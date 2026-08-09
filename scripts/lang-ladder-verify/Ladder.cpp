// Ladder.cpp — every rung of the 40-rung language ladder, executed.
// g++ -std=c++17 -O2 -o ladder Ladder.cpp && ./ladder
#include <bits/stdc++.h>
using namespace std;

template <class T> string vs(const vector<T>& v) {
    ostringstream o; o << "[";
    for (size_t i = 0; i < v.size(); ++i) { if (i) o << ", "; o << v[i]; }
    o << "]"; return o.str();
}
string vvs(const vector<vector<int>>& g) {
    ostringstream o; o << "[";
    for (size_t i = 0; i < g.size(); ++i) { if (i) o << ", "; o << vs(g[i]); }
    o << "]"; return o.str();
}

int main() {
    cout << boolalpha;

    // R01 declare, index, length
    {
        vector<int> v{5, 2, 9};
        int raw[3] = {1, 2, 3};
        cout << "R01 v[0]=" << v[0] << " v.at(0)=" << v.at(0)
             << " v.size()=" << v.size()
             << " sizeof-trick=" << sizeof(raw) / sizeof(raw[0])
             << " v.empty()=" << v.empty() << "\n";
        vector<int> e;
        cout << "R01trap empty.size()-1 = " << (e.size() - 1) << "  (unsigned wrap)\n";
    }

    // R02 iterate three ways
    {
        vector<string> v{"a", "b", "c"};
        string s1, s2, s3;
        for (size_t i = 0; i < v.size(); ++i) s1 += v[i];
        for (const string& x : v) s2 += x;
        for (size_t i = 0; i < v.size(); ++i) s3 += to_string(i) + v[i];
        cout << "R02 index=" << s1 << " range-for=" << s2 << " with-index=" << s3 << "\n";
    }

    // R03 initialize filled / sized
    {
        vector<int> a(5, 7);
        vector<int> b(5);
        vector<int> c{5};
        cout << "R03 vector<int>(5,7)=" << vs(a)
             << " vector<int>(5)=" << vs(b)
             << " vector<int>{5}=" << vs(c) << "  <- braces mean CONTENTS\n";
    }

    // R04 grow and shrink
    {
        vector<int> v{1, 2, 3};
        v.push_back(4);
        v.insert(v.begin() + 1, 99);
        v.erase(v.begin() + 0);
        int last = v.back(); v.pop_back();
        cout << "R04 after push/insert/erase=" << vs(v) << " popped=" << last
             << " (pop_back returns void)\n";
    }

    // R05 copy vs alias
    {
        vector<int> a{1, 2, 3};
        vector<int> b = a;      // deep copy of elements
        b[0] = 42;
        vector<int>& r = a;     // explicit alias
        r[1] = 77;
        cout << "R05 a=" << vs(a) << " b=" << vs(b) << "  (= copies, & aliases)\n";
    }

    // R06 2D grid
    {
        vector<vector<int>> g(2, vector<int>(3, 0));
        g[1][2] = 7;
        cout << "R06 " << g.size() << "x" << g[0].size() << " " << vvs(g) << "\n";
    }

    // R07 jagged
    {
        vector<vector<int>> j(3);
        for (int i = 0; i < 3; ++i) j[i] = vector<int>(i + 1, i);
        cout << "R07 jagged=" << vvs(j) << " rowlens="
             << j[0].size() << "," << j[1].size() << "," << j[2].size() << "\n";
    }

    // R08 reverse
    {
        vector<int> v{1, 2, 3, 4, 5};
        reverse(v.begin(), v.end());
        vector<int> w{1, 2, 3, 4, 5};
        reverse(w.begin() + 1, w.begin() + 4);
        cout << "R08 full=" << vs(v) << " range[1,4)=" << vs(w) << "\n";
    }

    // R09 sum min max
    {
        vector<int> v{4, 1, 9, 3};
        long long s = accumulate(v.begin(), v.end(), 0LL);
        int mn = *min_element(v.begin(), v.end());
        int mx = *max_element(v.begin(), v.end());
        auto mm = minmax_element(v.begin(), v.end());
        cout << "R09 sum=" << s << " min=" << mn << " max=" << mx
             << " minmax=(" << *mm.first << "," << *mm.second << ")\n";
        vector<int> big{2000000000, 2000000000};
        cout << "R09trap accumulate(...,0)=" << accumulate(big.begin(), big.end(), 0)
             << "  accumulate(...,0LL)=" << accumulate(big.begin(), big.end(), 0LL) << "\n";
    }

    // R10 membership
    {
        vector<int> v{4, 1, 9};
        bool has = find(v.begin(), v.end(), 9) != v.end();
        set<int> s{4, 1, 9};
        cout << "R10 vector find!=end -> " << has
             << " (O(n))   set.count(9)=" << s.count(9)
             << " set.find!=end -> " << (s.find(9) != s.end()) << " (O(log n))\n";
    }

    // R11 index of a value / miss
    {
        vector<int> v{4, 1, 9};
        auto it = find(v.begin(), v.end(), 9);
        auto miss = find(v.begin(), v.end(), 8);
        cout << "R11 index=" << (it - v.begin())
             << " miss==end -> " << (miss == v.end())
             << "  (NEVER subtract begin() from a miss and use it)\n";
    }

    // R12 array <-> list conversions
    {
        int raw[3] = {1, 2, 3};
        vector<int> v(raw, raw + 3);
        vector<int> v2(begin(raw), end(raw));
        array<int, 3> st{1, 2, 3};
        vector<int> v3(st.begin(), st.end());
        cout << "R12 fromRaw=" << vs(v) << " begin/end=" << vs(v2)
             << " fromStdArray=" << vs(v3) << " st.size()=" << st.size() << "\n";
    }

    // R13 in-place vs new
    {
        vector<int> a{3, 1, 2};
        vector<int> b = a;
        sort(b.begin(), b.end());
        sort(a.begin(), a.end());
        cout << "R13 sorted-in-place=" << vs(a) << " copy-then-sort=" << vs(b)
             << "  (sort returns void)\n";
    }

    // R14 ascending / descending
    {
        vector<int> v{3, 1, 2};
        sort(v.begin(), v.end());
        vector<int> d{3, 1, 2};
        sort(d.begin(), d.end(), greater<int>());
        vector<int> r{3, 1, 2};
        sort(r.rbegin(), r.rend());
        cout << "R14 asc=" << vs(v) << " greater<int>=" << vs(d) << " rbegin/rend=" << vs(r) << "\n";
    }

    // R15 custom rule, second key
    {
        vector<pair<int, int>> ps{{1, 9}, {2, 1}, {1, 3}};
        sort(ps.begin(), ps.end(), [](const pair<int, int>& x, const pair<int, int>& y) {
            if (x.second != y.second) return x.second < y.second;
            return x.first < y.first;
        });
        ostringstream o;
        for (auto& p : ps) o << "(" << p.first << "," << p.second << ")";
        cout << "R15 " << o.str() << "\n";
    }

    // R16 stable sort
    {
        vector<pair<string, int>> v{{"a", 1}, {"b", 1}, {"c", 0}};
        auto byNum = [](const pair<string, int>& x, const pair<string, int>& y) { return x.second < y.second; };
        auto st = v; stable_sort(st.begin(), st.end(), byNum);
        ostringstream o; for (auto& p : st) o << p.first;
        cout << "R16 stable_sort=" << o.str() << "  (a before b preserved)\n";
    }

    // R17 slice = explicit copy
    {
        vector<int> a{1, 2, 3, 4};
        vector<int> sl(a.begin(), a.begin() + 2);
        sl[0] = 42;
        cout << "R17 slice=" << vs(sl) << " original=" << vs(a)
             << "  (C++ has no implicit view before C++20 span)\n";
    }

    // R18 pair / tuple
    {
        pair<int, string> p{1, "a"};
        tuple<int, int, string> t{3, 4, "z"};
        auto [x, y, z] = t;                    // structured binding, C++17
        vector<pair<int, int>> v{{2, 1}, {1, 9}, {1, 3}};
        sort(v.begin(), v.end());              // lexicographic, free
        ostringstream o; for (auto& q : v) o << "(" << q.first << "," << q.second << ")";
        cout << "R18 p=(" << p.first << "," << p.second << ")"
             << " get<0>=" << get<0>(t) << " get<2>=" << get<2>(t)
             << " binding=" << x << y << z
             << " sorted=" << o.str() << "\n";
    }

    // R19 record / struct as element
    {
        struct P { int a; int b; };
        vector<P> v{{2, 5}, {1, 7}};
        sort(v.begin(), v.end(), [](const P& x, const P& y) { return x.a < y.a; });
        cout << "R19 struct sorted first=(" << v[0].a << "," << v[0].b << ")"
             << " sizeof(P)=" << sizeof(P)
             << "  (no auto ==; you must write operator==)\n";
    }

    // R20 hash map put/get/missing
    {
        unordered_map<string, int> m;
        m["a"] = 1;
        int got = m.count("b") ? m["b"] : -1;
        size_t beforeSize = m.size();
        int sneaky = m["zz"];                  // operator[] INSERTS a default
        cout << "R20 m[\"a\"]=" << m["a"] << " safe-miss=" << got
             << " size before=" << beforeSize << " after m[\"zz\"]=" << m.size()
             << " value=" << sneaky << "  <- operator[] inserted it\n";
        cout << "R20safe m.at(\"a\")=" << m.at("a")
             << " find(\"nope\")==end -> " << (m.find("nope") == m.end()) << "\n";
    }

    // R21 frequency counting
    {
        string s = "abracadabra";
        unordered_map<char, int> f;
        for (char c : s) f[c]++;
        map<char, int> ord(f.begin(), f.end());
        ostringstream o; for (auto& kv : ord) o << kv.first << kv.second << " ";
        cout << "R21 counts(sorted for printing)= " << o.str() << "\n";
    }

    // R22 set / dedup
    {
        vector<int> v{3, 1, 3, 2, 1};
        unordered_set<int> us(v.begin(), v.end());
        set<int> os(v.begin(), v.end());
        vector<int> sorted_unique = v;
        sort(sorted_unique.begin(), sorted_unique.end());
        sorted_unique.erase(unique(sorted_unique.begin(), sorted_unique.end()), sorted_unique.end());
        cout << "R22 unordered_set.size()=" << us.size()
             << " set(ordered)=" << vs(vector<int>(os.begin(), os.end()))
             << " sort+unique+erase=" << vs(sorted_unique) << "\n";
    }

    // R23 iterating a map / ordering
    {
        map<string, int> om{{"b", 2}, {"a", 1}, {"c", 3}};
        ostringstream o; for (auto& kv : om) o << kv.first << "=" << kv.second << " ";
        unordered_map<string, int> um{{"b", 2}, {"a", 1}, {"c", 3}};
        ostringstream u; for (auto& kv : um) u << kv.first << " ";
        cout << "R23 map(sorted)= " << o.str() << "  unordered_map order= " << u.str()
             << " (unspecified, do not rely on it)\n";
    }

    // R24 ordered map navigation
    {
        map<int, string> m{{10, "a"}, {20, "b"}, {30, "c"}};
        auto lb = m.lower_bound(15);   // first >= 15  -> ceiling
        auto ub = m.upper_bound(20);   // first > 20
        auto fl = m.lower_bound(15);   // floor: step back from lower_bound
        --fl;
        cout << "R24 ceiling(15)=" << lb->first << " floor(15)=" << fl->first
             << " higher(20)=" << ub->first
             << " first=" << m.begin()->first << " last=" << m.rbegin()->first << "\n";
    }

    // R25 binary search + miss
    {
        vector<int> s{1, 3, 5, 7};
        bool found = binary_search(s.begin(), s.end(), 5);
        auto it = lower_bound(s.begin(), s.end(), 4);
        auto it2 = lower_bound(s.begin(), s.end(), 99);
        cout << "R25 binary_search(5)=" << found
             << " lower_bound(4) idx=" << (it - s.begin())
             << " lower_bound(99)==end -> " << (it2 == s.end())
             << " idx=" << (it2 - s.begin()) << "\n";
    }

    // R26 lower/upper bound counts duplicates
    {
        vector<int> s{1, 3, 3, 3, 5};
        auto lo = lower_bound(s.begin(), s.end(), 3);
        auto hi = upper_bound(s.begin(), s.end(), 3);
        auto pr = equal_range(s.begin(), s.end(), 3);
        cout << "R26 lower=" << (lo - s.begin()) << " upper=" << (hi - s.begin())
             << " count=" << (hi - lo)
             << " equal_range=(" << (pr.first - s.begin()) << "," << (pr.second - s.begin()) << ")\n";
    }

    // R27 prefix sums
    {
        vector<int> a{2, 4, 6, 8};
        vector<long long> p(a.size() + 1, 0);
        for (size_t i = 0; i < a.size(); ++i) p[i + 1] = p[i] + a[i];
        cout << "R27 prefix=" << vs(p) << " sum a[1..2]=" << (p[3] - p[1])
             << "  (size n+1 is what removes the if)\n";
        vector<long long> q(a.size());
        partial_sum(a.begin(), a.end(), q.begin());
        cout << "R27std partial_sum=" << vs(q) << " (size n, needs the if)\n";
    }

    // R28 stack
    {
        stack<int> st;
        st.push(1); st.push(2);
        int t = st.top(); st.pop();
        cout << "R28 top=" << t << " size=" << st.size() << " empty=" << st.empty()
             << "  (pop() returns void; top() on empty is UB, not an exception)\n";
    }

    // R29 queue
    {
        queue<int> q;
        q.push(1); q.push(2);
        int f = q.front(); q.pop();
        cout << "R29 front=" << f << " newFront=" << q.front() << " size=" << q.size() << "\n";
    }

    // R30 deque both ends
    {
        deque<int> d{2, 3};
        d.push_front(1); d.push_back(4);
        int a = d.front(); d.pop_front();
        int b = d.back();  d.pop_back();
        cout << "R30 popped front=" << a << " back=" << b << " left=" << vs(vector<int>(d.begin(), d.end()))
             << " random access d[0]=" << d[0] << "\n";
    }

    // R31 priority queue defaults
    {
        priority_queue<int> mx;                                        // MAX-heap by default
        priority_queue<int, vector<int>, greater<int>> mn;             // min-heap
        for (int x : {5, 1, 9}) { mx.push(x); mn.push(x); }
        cout << "R31 priority_queue<int>.top()=" << mx.top() << " (MAX by default)"
             << "  greater<int>.top()=" << mn.top() << " (min)\n";
    }

    // R32 heap of pairs with comparator
    {
        using P = pair<int, string>;
        auto cmp = [](const P& a, const P& b) { return a.first > b.first; };  // INVERTED for min-heap
        priority_queue<P, vector<P>, decltype(cmp)> pq(cmp);
        pq.push({3, "c"}); pq.push({1, "a"}); pq.push({2, "b"});
        ostringstream o;
        while (!pq.empty()) { o << pq.top().first << pq.top().second << " "; pq.pop(); }
        cout << "R32 drained= " << o.str() << " (comparator is INVERTED vs sort)\n";
    }

    // R33 strings are sequences
    {
        string s = "hello";
        s[0] = 'H';                     // MUTABLE in C++
        cout << "R33 s[0]=" << s[0] << " s.size()=" << s.size()
             << " substr(1,3)=" << s.substr(1, 3) << " (pos,LENGTH)"
             << " mutated=" << s << "\n";
    }

    // R34 building a string in a loop
    {
        string s;
        s.reserve(5);
        for (int i = 0; i < 5; ++i) s += char('a' + i);
        ostringstream oss;
        for (int i = 0; i < 5; ++i) oss << char('a' + i);
        cout << "R34 += with reserve=" << s << " ostringstream=" << oss.str()
             << "  (both amortised O(n); C++ += is already cheap)\n";
    }

    // R35 char arithmetic
    {
        char c = 'c';
        int idx = c - 'a';
        char back = char('a' + 2);
        cout << "R35 'c'-'a'=" << idx << " 'a'+2=" << back
             << " int('A')=" << int('A') << " sizeof(char)=" << sizeof(char)
             << " isalpha=" << (bool)isalpha((unsigned char)c) << "\n";
    }

    // R36 overflow widths
    {
        int big = INT_MAX;
        long long wide = (long long)big + 1;
        int lo = 2000000000, hi = 2100000000;
        // lo+hi is 4,100,000,000 which does not fit in a signed 32-bit int.
        // Signed overflow is UB, so reproduce the wrap deliberately and observe it.
        int wrappedSum = (int)((unsigned)lo + (unsigned)hi);   // the bit pattern a real int holds
        int badMid = wrappedSum / 2;                           // what (lo+hi)/2 actually computes
        int goodMid = lo + (hi - lo) / 2;
        cout << "R36 INT_MAX=" << big << " +1 as long long=" << wide
             << " sizeof(int)=" << sizeof(int) << " sizeof(long long)=" << sizeof(long long)
             << "\nR36mid lo=" << lo << " hi=" << hi << " lo+hi wraps to " << wrappedSum
             << " so (lo+hi)/2=" << badMid << "  but lo+(hi-lo)/2=" << goodMid << "\n";
    }

    // R37 equality
    {
        string a = "hel", b = "lo";
        string x = a + b, y = "hello";
        cout << "R37 string == compares VALUE -> " << (x == y)
             << "  (&x==&y)=" << (&x == &y) << "\n";
        vector<int> p{1, 2}, q{1, 2};
        cout << "R37vec vector== compares elementwise -> " << (p == q) << "\n";
    }

    // R38 mutating while iterating
    {
        vector<int> v{1, 2, 3, 4, 5};
        for (auto it = v.begin(); it != v.end();) {
            if (*it % 2 == 0) it = v.erase(it);   // erase RETURNS the next valid iterator
            else ++it;
        }
        cout << "R38 erase-returns-iterator=" << vs(v) << "\n";
        vector<int> w{1, 2, 3, 4, 5};
        w.erase(remove_if(w.begin(), w.end(), [](int x) { return x % 2 == 0; }), w.end());
        cout << "R38idiom erase-remove_if=" << vs(w) << "\n";
    }

    // R39 loop variable reference semantics
    {
        vector<int> v{1, 2, 3};
        for (int x : v) x *= 10;              // copy — no effect
        cout << "R39 by value=" << vs(v);
        for (int& x : v) x *= 10;             // reference — writes back
        cout << "  by reference=" << vs(v) << "\n";
    }

    // R40 scale traps
    {
        vector<int> k{5, 1, 9, 3, 7};
        nth_element(k.begin(), k.begin() + 2, k.end());
        vector<bool> vb(3, true);
        auto proxy = vb[0];                    // NOT bool&
        vector<int> cap;
        size_t grows = 0, last = 0;
        for (int i = 0; i < 1000; ++i) { cap.push_back(i); if (cap.capacity() != last) { last = cap.capacity(); ++grows; } }
        cout << "R40 nth_element k-th=" << k[2]
             << " vector<bool>[0] is a proxy, value=" << (bool)proxy
             << " sizeof(proxy)=" << sizeof(proxy)
             << "\nR40cap 1000 push_backs caused " << grows << " reallocations, final capacity=" << cap.capacity() << "\n";
    }

    return 0;
}
