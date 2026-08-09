// Elements.cpp — what can go INSIDE a container, and what it costs. Executed.
// g++ -std=c++17 -O2 -o elements Elements.cpp && ./elements
#include <bits/stdc++.h>
using namespace std;

template <class T> string vs(const vector<T>& v) {
    ostringstream o; o << "[";
    for (size_t i = 0; i < v.size(); ++i) { if (i) o << ","; o << v[i]; }
    o << "]"; return o.str();
}

/* Bytes actually reachable from a vector: the object itself plus its heap buffer.
 * capacity(), not size() — the buffer is what was allocated, not what you filled. */
template <class T> size_t heapBytes(const vector<T>& v) {
    return sizeof(v) + v.capacity() * sizeof(T);
}

int main() {
    cout << boolalpha;

    // E01 the plainest element: a number
    {
        vector<int> v{1, 2, 3};
        cout << "E01 sizeof(int)=" << sizeof(int)
             << " sizeof(long long)=" << sizeof(long long)
             << " sizeof(double)=" << sizeof(double)
             << " sizeof(char)=" << sizeof(char)
             << " sizeof(bool)=" << sizeof(bool)
             << "\nE01vec sizeof(vector<int>) object=" << sizeof(v)
             << " (3 pointers) + capacity " << v.capacity() << " x 4B heap = "
             << heapBytes(v) << "B total for 3 ints\n";
    }

    // E02 elements are stored BY VALUE and contiguously
    {
        vector<int> v{10, 20, 30};
        cout << "E02 stride &v[1]-&v[0] = " << ((char*)&v[1] - (char*)&v[0]) << " bytes"
             << "  contiguous=" << (&v[1] == &v[0] + 1)
             << "  v.data()==&v[0] -> " << (v.data() == &v[0]) << "\n";
    }

    // E03 a pair inside
    {
        vector<pair<int,int>> v{{1,2},{3,4}};
        cout << "E03 sizeof(pair<int,int>)=" << sizeof(pair<int,int>)
             << " sizeof(pair<int,char>)=" << sizeof(pair<int,char>) << " <- PADDED to 8, not 5"
             << " sizeof(pair<char,char>)=" << sizeof(pair<char,char>)
             << "\nE03use v[0].first=" << v[0].first << " v[0].second=" << v[0].second
             << " sorted lexicographically for free; usable as a map key\n";
    }

    // E04 a tuple inside
    {
        tuple<int,int,int> t{1,2,3};
        cout << "E04 sizeof(tuple<int,int,int>)=" << sizeof(t)
             << " sizeof(tuple<char,int>)=" << sizeof(tuple<char,int>) << " (padded)"
             << " get<1>=" << get<1>(t)
             << "  tuple_size=" << tuple_size<decltype(t)>::value << "\n";
    }

    // E05 a struct inside — and padding
    {
        struct Bad  { char a; int b; char c; };   // 1 + pad3 + 4 + 1 + pad3
        struct Good { int b; char a; char c; };   // 4 + 1 + 1 + pad2
        struct Packed { int x, y; };
        cout << "E05 struct{char,int,char}=" << sizeof(Bad) << "B"
             << "  reordered {int,char,char}=" << sizeof(Good) << "B"
             << "  {int,int}=" << sizeof(Packed) << "B"
             << "\nE05align alignof(Bad)=" << alignof(Bad)
             << " — the compiler inserts padding so each field sits on its own alignment."
             << " Ordering fields big-to-small is free memory.\n";
        cout << "E05waste 1e6 x Bad = " << (sizeof(Bad) * 1000000 / 1048576.0)
             << " MB vs 1e6 x Good = " << (sizeof(Good) * 1000000 / 1048576.0) << " MB\n";
    }

    // E06 a string inside — the element is a HANDLE, the text is elsewhere
    {
        vector<string> v{"hi", "a much longer string that will not fit in the small buffer"};
        cout << "E06 sizeof(string) handle=" << sizeof(string)
             << " (same for every string, short or long)"
             << "\nE06sso short.capacity()=" << v[0].capacity()
             << " long.capacity()=" << v[1].capacity()
             << " <- short-string optimisation: up to ~15 chars live INSIDE the handle,"
             << " longer ones are a separate heap block\n";
        cout << "E06vec vector<string> of 2 = " << heapBytes(v)
             << "B of handles, plus each long string's own buffer\n";
    }

    // E07 a nested vector — rows are separate allocations
    {
        vector<vector<int>> g(3, vector<int>(4, 0));
        cout << "E07 sizeof(vector<vector<int>>) object=" << sizeof(g)
             << "  outer holds " << g.size() << " HANDLES of " << sizeof(g[0]) << "B each"
             << "\nE07rows row1 starts where row0 ends -> " << (g[0].data() + 4 == g[1].data())
             << "  <- separate heap blocks, NOT one rectangle\n";
        vector<int> flat(3 * 4, 0);
        cout << "E07flat one flat vector<int>(12): " << heapBytes(flat)
             << "B in ONE block, index with flat[i*4+j] — fewer allocations, better locality\n";
    }

    // E08 vector<bool> is not a container of bool
    {
        vector<bool> vb(64, true);
        vector<char> vc(64, 1);
        cout << "E08 vector<bool>(64) -> sizeof object=" << sizeof(vb)
             << ", 64 bits packed into " << (64 / 8) << " bytes of storage"
             << "\nE08cmp vector<char>(64) heap=" << heapBytes(vc) << "B — 8x more, but"
             << " vb[0] returns a PROXY (sizeof=" << sizeof(vb[0]) << "), not bool&."
             << " bool& b = vb[0]; does not compile.\n";
    }

    // E09 pointers / smart pointers as elements
    {
        struct Node { int v; };
        vector<Node*> raw;
        vector<unique_ptr<Node>> owned;
        for (int i = 0; i < 3; ++i) owned.push_back(make_unique<Node>(Node{i}));
        cout << "E09 sizeof(Node*)=" << sizeof(Node*)
             << " sizeof(unique_ptr<Node>)=" << sizeof(unique_ptr<Node>) << " (zero overhead)"
             << " sizeof(shared_ptr<Node>)=" << sizeof(shared_ptr<Node>) << " (ptr + control block ptr)"
             << "\nE09deref owned[1]->v=" << owned[1]->v
             << " — the vector holds 8B handles; the Nodes are scattered on the heap\n";
    }

    // E10 array of structs vs struct of arrays
    {
        struct Particle { double x, y, z; int id; };
        const int N = 100000;
        vector<Particle> aos(N);
        for (int i = 0; i < N; ++i) aos[i] = {double(i), 0, 0, i};
        vector<double> sx(N); vector<int> sid(N);
        for (int i = 0; i < N; ++i) { sx[i] = i; sid[i] = i; }

        auto t0 = chrono::steady_clock::now();
        double s1 = 0; for (int r = 0; r < 50; ++r) for (int i = 0; i < N; ++i) s1 += aos[i].x;
        auto t1 = chrono::steady_clock::now();
        double s2 = 0; for (int r = 0; r < 50; ++r) for (int i = 0; i < N; ++i) s2 += sx[i];
        auto t2 = chrono::steady_clock::now();

        double aosMs = chrono::duration<double, milli>(t1 - t0).count();
        double soaMs = chrono::duration<double, milli>(t2 - t1).count();
        cout << "E10 sizeof(Particle)=" << sizeof(Particle) << "B"
             << "  summing ONE field over " << N << " elements x50:"
             << "\nE10perf array-of-structs is slower than struct-of-arrays -> " << (aosMs > soaMs)
             << "  (same sum: " << (s1 == s2) << ")"
             << "  — AoS drags all " << sizeof(Particle) << "B through cache to read 8\n";
    }

    // E11 what a container CAN hold
    {
        map<pair<int,int>, int> byPair;      byPair[{1,2}] = 3;
        set<vector<int>> setOfVec;           setOfVec.insert({1,2});
        vector<function<int(int)>> fns;      fns.push_back([](int x){ return x*2; });
        cout << "E11 map<pair,int> works (pair is comparable): " << byPair[{1,2}]
             << "  set<vector<int>> works: " << setOfVec.size()
             << "  vector<function> works: " << fns[0](21)
             << "\nE11req ordered containers need operator< ; unordered ones need std::hash."
             << " There is NO std::hash for pair or vector — unordered_map<pair<..>,..> does NOT compile.\n";
    }

    // E12 capacity growth: what the buffer actually does
    {
        vector<int> v;
        ostringstream caps;
        size_t last = 0;
        for (int i = 0; i < 100; ++i) {
            v.push_back(i);
            if (v.capacity() != last) { last = v.capacity(); caps << last << " "; }
        }
        cout << "E12 capacities as it grew: " << caps.str() << "\n";
        cout << "E12ratio libstdc++ DOUBLES. After 100 pushes: size=" << v.size()
             << " capacity=" << v.capacity()
             << " wasted=" << (v.capacity() - v.size()) << " slots ("
             << ((v.capacity() - v.size()) * sizeof(int)) << "B)\n";
        v.shrink_to_fit();
        cout << "E12shrink after shrink_to_fit: capacity=" << v.capacity() << "\n";
    }

    return 0;
}
