// Deep.cpp — iterator invalidation, the cache hierarchy, stack vs heap, hashing.
// Measured, not asserted. g++ -std=c++17 -O2 -o deep Deep.cpp && ./deep
#include <algorithm>
#include <chrono>
#include <cstddef>
#include <cstdint>
#include <deque>
#include <iostream>
#include <list>
#include <map>
#include <numeric>
#include <random>
#include <set>
#include <sstream>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>
using namespace std;

int main() {
    cout << boolalpha;

    /* ---------------- D01  iterator invalidation ---------------- */
    {
        vector<int> v{1, 2, 3};
        v.reserve(3);
        int* before = v.data();
        size_t capBefore = v.capacity();
        v.push_back(4);                       // forces a reallocation
        int* after = v.data();
        cout << "D01 vector: capacity " << capBefore << " -> " << v.capacity()
             << ", buffer moved -> " << (before != after)
             << "  EVERY iterator, pointer and reference into it is now dangling\n";

        vector<int> w{1, 2, 3};
        w.reserve(100);                        // room to spare
        int* p0 = w.data();
        w.push_back(4);                        // no reallocation this time
        cout << "D01safe with reserve(100) headroom, push_back did NOT move the buffer -> "
             << (p0 == w.data()) << "  (reserve is how you keep pointers valid)\n";
    }
    {
        // erase invalidates from the erase point onward; the RETURN VALUE is the fix
        vector<int> v{1, 2, 3, 4, 5};
        for (auto it = v.begin(); it != v.end();)
            if (*it % 2 == 0) it = v.erase(it); else ++it;
        ostringstream o; for (int x : v) o << x << " ";
        cout << "D01erase erase() returns the next valid iterator -> " << o.str() << "\n";
    }
    {
        // node-based containers do NOT invalidate other elements
        list<int> l{1, 2, 3};
        auto it = next(l.begin());             // -> 2
        l.push_front(0);
        l.push_back(9);
        cout << "D01node std::list: after inserting at both ends, the old iterator still reads "
             << *it << "  — node containers keep every other iterator valid\n";

        map<int, int> m{{1, 10}, {2, 20}};
        auto mit = m.find(2);
        m[3] = 30;
        cout << "D01map std::map: after inserting a new key, the old iterator still reads "
             << mit->second << "  (same guarantee)\n";

        unordered_map<int, int> um;
        um.reserve(2);
        for (int i = 0; i < 2; ++i) um[i] = i;
        float lf0 = um.load_factor();
        size_t b0 = um.bucket_count();
        for (int i = 2; i < 50; ++i) um[i] = i;   // forces rehash
        cout << "D01hash unordered_map: buckets " << b0 << " -> " << um.bucket_count()
             << ", load_factor " << lf0 << " -> " << um.load_factor()
             << "  — a REHASH invalidates iterators, but NOT references to values\n";
    }

    /* ---------------- D02  the cache hierarchy ---------------- */
    {
        /* Walk a fixed number of elements with a growing stride. While the working set
         * fits a cache level the time per access is flat; each time it spills to the
         * next level the time steps up. The steps ARE the hierarchy. */
        const size_t N = 1 << 22;              // 4M ints = 16 MB, bigger than most L3
        vector<int> a(N, 1);
        volatile long long sink = 0;

        auto timeStride = [&](size_t stride) {
            const size_t touches = 1 << 20;    // the same COUNT of reads every time
            auto t0 = chrono::steady_clock::now();
            long long s2 = 0;
            for (size_t rep = 0; rep < 4; ++rep)
                for (size_t i = 0, k = 0; k < touches; ++k, i += stride)
                    s2 += a[i & (N - 1)];
            auto t1 = chrono::steady_clock::now();
            sink += s2;
            return chrono::duration<double, milli>(t1 - t0).count();
        };
        // best of 3 on each, so one scheduling hiccup cannot flip a verdict
        auto best = [&](size_t stride) {
            double b = 1e18;
            for (int r = 0; r < 3; ++r) b = min(b, timeStride(stride));
            return b;
        };
        double s1 = best(1), s16 = best(16), s1024 = best(1024);
        cout << "D02 the SAME number of reads, walked with a growing stride:\n"
             << "D02step stride 16 slower than stride 1 -> " << (s16 > s1)
             << "   stride 1024 slower than stride 16 -> " << (s1024 > s16)
             << "   1024 slower than 1 -> " << (s1024 > s1) << "\n";
        cout << "D02why identical instruction count, identical O(n). The only thing that changed\n"
             << "        is how many CACHE LINES each pass has to fetch.\n";
        cout << "D02line a line is 64 bytes = 16 ints. At stride 1 you use all 16 ints of every\n"
             << "        line you pay for; at stride 16 and beyond you use ONE, so you pay 16x\n"
             << "        the memory traffic for the same answer — and the prefetcher stops helping.\n";
    }
    {
        // row-major vs column-major on the same matrix
        const int M = 1024;
        vector<int> g(size_t(M) * M, 1);
        volatile long long sink = 0;
        auto t0 = chrono::steady_clock::now();
        long long r = 0;
        for (int i = 0; i < M; ++i) for (int j = 0; j < M; ++j) r += g[size_t(i) * M + j];
        auto t1 = chrono::steady_clock::now();
        long long c = 0;
        for (int j = 0; j < M; ++j) for (int i = 0; i < M; ++i) c += g[size_t(i) * M + j];
        auto t2 = chrono::steady_clock::now();
        sink += r + c;
        double rowMs = chrono::duration<double, milli>(t1 - t0).count();
        double colMs = chrono::duration<double, milli>(t2 - t1).count();
        cout << "D02order 1024x1024 sum, same total: " << (r == c)
             << ".  column-major slower than row-major -> " << (colMs > rowMs)
             << "  — swapping two loop lines, nothing else\n";
    }

    /* ---------------- D03  stack vs heap ---------------- */
    {
        int local = 0;
        vector<int> heapv(4);
        cout << "D03 a local int lives on the STACK; new/malloc and every vector buffer live on\n"
             << "        the HEAP; the vector OBJECT itself sits wherever you declared it.\n";
        cout << "D03size sizeof(vector<int>) object=" << sizeof(heapv)
             << "B on the stack, holding a pointer to " << heapv.capacity() * sizeof(int)
             << "B on the heap. local=" << local << "\n";
        cout << "D03cost the stack is a pointer bump — allocation is one instruction and freeing is\n"
             << "        automatic at scope exit. The heap needs a real allocator and a matching\n"
             << "        free, which is why a hot loop that news per iteration is slow.\n";
    }
    {
        /* Measure the FRAME SIZE rather than recursing until the stack dies: a real
         * stack overflow is a crash the process cannot catch, and crashing the
         * verification run to prove a point about crashing would be a poor trade. */
        struct R {
            static ptrdiff_t probe(int d, const char* prev) {
                char here;
                if (d == 0) return probe(1, &here);
                return prev - &here;          // frames grow downward on x86-64
            }
        };
        char anchor;
        ptrdiff_t frame = R::probe(0, &anchor);
        if (frame < 0) frame = -frame;
        cout << "D03frame one recursive frame of this shape measures " << frame << " bytes\n";
        cout << "D03depth at that size, an 8 MB Linux stack allows about "
             << (8 * 1024 * 1024 / (frame ? frame : 1))
             << " levels; a 1 MB Windows stack allows about "
             << (1 * 1024 * 1024 / (frame ? frame : 1)) << "\n";
        cout << "D03risk a DFS on 1e5 nodes with a few locals per frame is genuinely close to the\n"
             << "        Windows limit, and overflowing the stack is a CRASH, not an exception you\n"
             << "        can catch. Convert to an explicit stack when depth can reach 1e5.\n";
    }

    /* ---------------- D04  hash containers ---------------- */
    {
        unordered_map<int, int> m;
        ostringstream growth;
        size_t lastB = 0;
        for (int i = 0; i < 1000; ++i) {
            m[i] = i;
            if (m.bucket_count() != lastB) { lastB = m.bucket_count(); growth << lastB << " "; }
        }
        cout << "D04 bucket counts as it grew: " << growth.str() << "\n";
        cout << "D04lf max_load_factor=" << m.max_load_factor()
             << " current=" << m.load_factor()
             << " buckets=" << m.bucket_count() << " for " << m.size() << " entries\n";
        cout << "D04mem libstdc++ unordered_map is buckets + a NODE per entry (~"
             << (sizeof(void*) * 2 + sizeof(pair<const int, int>))
             << "B each), so it is roughly 3-4x a vector holding the same pairs\n";
    }
    {
        // collisions: all keys landing in one bucket turns O(1) into O(n)
        unordered_map<size_t, int> m;
        m.reserve(1024);
        size_t B = m.bucket_count();
        for (int i = 0; i < 200; ++i) m[size_t(i) * B] = i;   // every key hashes to bucket 0
        size_t worst = 0;
        for (size_t b = 0; b < m.bucket_count(); ++b) worst = max(worst, m.bucket_size(b));
        unordered_map<size_t, int> fair;
        fair.reserve(1024);
        for (int i = 0; i < 200; ++i) fair[i] = i;
        size_t fairWorst = 0;
        for (size_t b = 0; b < fair.bucket_count(); ++b) fairWorst = max(fairWorst, fair.bucket_size(b));
        cout << "D04coll 200 keys chosen as multiples of bucket_count -> worst bucket holds "
             << worst << " entries; ordinary keys -> worst bucket holds " << fairWorst << "\n";
        cout << "D04why std::hash<size_t> is the IDENTITY on libstdc++, so an adversary who knows\n"
             << "        your bucket count can force every key into one chain. That is a real\n"
             << "        anti-hash attack in competitive programming: mix the key first.\n";
    }
    {
        // ordered vs unordered: the tradeoff, timed
        const int N = 200000;
        vector<int> keys(N);
        iota(keys.begin(), keys.end(), 0);
        mt19937 rng(42);
        shuffle(keys.begin(), keys.end(), rng);

        unordered_map<int, int> um; um.reserve(N * 2);
        map<int, int> om;
        auto t0 = chrono::steady_clock::now();
        for (int k : keys) um[k] = k;
        auto t1 = chrono::steady_clock::now();
        for (int k : keys) om[k] = k;
        auto t2 = chrono::steady_clock::now();
        volatile long long s = 0;
        for (int k : keys) s += um[k];
        auto t3 = chrono::steady_clock::now();
        for (int k : keys) s += om[k];
        auto t4 = chrono::steady_clock::now();

        double uIns = chrono::duration<double, milli>(t1 - t0).count();
        double oIns = chrono::duration<double, milli>(t2 - t1).count();
        double uLook = chrono::duration<double, milli>(t3 - t2).count();
        double oLook = chrono::duration<double, milli>(t4 - t3).count();
        cout << "D04cmp " << N << " random keys: unordered_map faster to build -> " << (uIns < oIns)
             << ", faster to look up -> " << (uLook < oLook)
             << "  — but map gives you sorted iteration and lower_bound, which no hash can\n";
    }

    return 0;
}
