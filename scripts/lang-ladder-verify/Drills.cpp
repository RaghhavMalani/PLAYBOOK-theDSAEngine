// Drills.cpp — one real mini-problem per rung, executed.
// g++ -std=c++17 -O2 -o drills Drills.cpp && ./drills
/* Explicit standard headers rather than <bits/stdc++.h>.
 *
 * bits/stdc++.h is a libstdc++ convenience header — it is not standard C++, and it
 * is absent on clang/libc++, on MSVC, and on some MinGW-w64 builds. It compiled
 * fine on the Linux box these numbers were captured on and failed on Windows,
 * which is exactly the kind of portability assumption a verification script must
 * not make about the machine re-running it. */
#include <algorithm>
#include <array>
#include <cctype>
#include <chrono>
#include <climits>
#include <cstddef>
#include <deque>
#include <functional>
#include <iostream>
#include <iterator>
#include <map>
#include <memory>
#include <numeric>
#include <queue>
#include <random>
#include <set>
#include <sstream>
#include <stack>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
using namespace std;

template <class T> string vs(const vector<T>& v) {
    ostringstream o; o << "[";
    for (size_t i = 0; i < v.size(); ++i) { if (i) o << ","; o << v[i]; }
    o << "]"; return o.str();
}

int main() {
    cout << boolalpha;

    // D01 middle element of an odd-length array
    { vector<int> a{5, 2, 9, 1, 7}; cout << "D01 middle=" << a[a.size() / 2] << " first=" << a.front() << " last=" << a.back() << "\n"; }

    // D02 sum of elements at even indices
    { vector<int> a{1, 2, 3, 4, 5}; int s = 0; for (size_t i = 0; i < a.size(); i += 2) s += a[i]; cout << "D02 evenIdxSum=" << s << "\n"; }

    // D03 tally: five slots, mark three hits
    { vector<int> t(5, 0); for (int h : {1, 3, 1}) t[h]++; cout << "D03 tally=" << vs(t) << "\n"; }

    // D04 LC27 remove element in place, return new length
    { vector<int> a{3, 2, 2, 3}; int val = 3, k = 0;
      for (int x : a) if (x != val) a[k++] = x;
      a.resize(k); cout << "D04 removeElement(val=3) k=" << k << " a=" << vs(a) << "\n"; }

    // D05 sort a copy without disturbing the caller
    { vector<int> orig{3, 1, 2};
      auto sortedCopy = [](vector<int> v) { sort(v.begin(), v.end()); return v; };   // BY VALUE
      auto s = sortedCopy(orig);
      cout << "D05 sorted=" << vs(s) << " original untouched=" << vs(orig) << "\n"; }

    // D06 n x n identity matrix
    { int n = 3; vector<vector<int>> m(n, vector<int>(n, 0));
      for (int i = 0; i < n; ++i) m[i][i] = 1;
      ostringstream o; for (auto& r : m) o << vs(r); cout << "D06 identity=" << o.str() << "\n"; }

    // D07 LC118 Pascal's triangle, 5 rows
    { int n = 5; vector<vector<int>> t;
      for (int i = 0; i < n; ++i) { vector<int> row(i + 1, 1);
        for (int j = 1; j < i; ++j) row[j] = t[i-1][j-1] + t[i-1][j];
        t.push_back(row); }
      ostringstream o; for (auto& r : t) o << vs(r); cout << "D07 pascal=" << o.str() << "\n"; }

    // D08 LC189 rotate right by k with triple reverse
    { vector<int> a{1,2,3,4,5,6,7}; int k = 3 % a.size();
      reverse(a.begin(), a.end()); reverse(a.begin(), a.begin()+k); reverse(a.begin()+k, a.end());
      cout << "D08 rotateRight(3)=" << vs(a) << "\n"; }

    // D09 LC53 Kadane
    { vector<int> a{-2,1,-3,4,-1,2,1,-5,4};
      long long best = a[0], cur = a[0];
      for (size_t i = 1; i < a.size(); ++i) { cur = max((long long)a[i], cur + a[i]); best = max(best, cur); }
      cout << "D09 maxSubarraySum=" << best << "\n"; }

    // D10 LC217 contains duplicate
    { vector<int> a{1,2,3,1}; unordered_set<int> s(a.begin(), a.end());
      cout << "D10 containsDuplicate=" << (s.size() != a.size()) << "\n"; }

    // D11 LC704-style linear index-of with a real sentinel
    { vector<int> a{4,1,9}; int target = 9, idx = -1;
      auto it = find(a.begin(), a.end(), target);
      if (it != a.end()) idx = (int)(it - a.begin());
      cout << "D11 indexOf(9)=" << idx << " indexOf(8)=" << (find(a.begin(),a.end(),8)==a.end() ? -1 : 0) << "\n"; }

    // D12 digits string -> int vector -> sum
    { string s = "12345"; vector<int> d;
      for (char c : s) d.push_back(c - '0');
      cout << "D12 digits=" << vs(d) << " sum=" << accumulate(d.begin(), d.end(), 0) << "\n"; }

    // D13 LC215 kth largest without disturbing the original
    { vector<int> a{3,2,1,5,6,4}; int k = 2;
      vector<int> c = a; sort(c.rbegin(), c.rend());
      cout << "D13 kthLargest(2)=" << c[k-1] << " original=" << vs(a) << "\n"; }

    // D14 top-3 largest
    { vector<int> a{5,1,9,3,7}; vector<int> c = a; sort(c.rbegin(), c.rend()); c.resize(3);
      cout << "D14 top3=" << vs(c) << "\n"; }

    // D15 sort people by age asc then name asc
    { vector<pair<int,string>> p{{30,"bob"},{25,"amy"},{30,"ann"}};
      sort(p.begin(), p.end());   // pair compares (age, name) lexicographically — free
      ostringstream o; for (auto& x : p) o << x.second << x.first << " ";
      cout << "D15 byAgeThenName= " << o.str() << "\n"; }

    // D16 sort words by length, alphabetical within equal lengths
    { vector<string> w{"pear","fig","apple","kiwi"};
      sort(w.begin(), w.end());                                              // pass 1: alphabetical
      stable_sort(w.begin(), w.end(), [](const string&a,const string&b){ return a.size()<b.size(); });
      ostringstream o; for (auto& x : w) o << x << " ";
      cout << "D16 byLenThenAlpha= " << o.str() << "\n"; }

    // D17 LC643 max average of a window of size k
    { vector<int> a{1,12,-5,-6,50,3}; int k = 4;
      double sum = accumulate(a.begin(), a.begin()+k, 0.0), best = sum;
      for (size_t i = k; i < a.size(); ++i) { sum += a[i] - a[i-k]; best = max(best, sum); }
      cout << "D17 maxAvgWindow(k=4)=" << best / k << "\n"; }

    // D18 LC56 sort intervals by start, then merge
    { vector<pair<int,int>> iv{{1,3},{8,10},{2,6},{15,18}};
      sort(iv.begin(), iv.end());
      vector<pair<int,int>> m;
      for (auto& x : iv) { if (!m.empty() && x.first <= m.back().second) m.back().second = max(m.back().second, x.second); else m.push_back(x); }
      ostringstream o; for (auto& x : m) o << "[" << x.first << "," << x.second << "]";
      cout << "D18 mergedIntervals=" << o.str() << "\n"; }

    // D19 sort records by salary desc, print top
    { struct Emp { string name; int sal; };
      vector<Emp> e{{"amy",90},{"bob",120},{"cat",110}};
      sort(e.begin(), e.end(), [](const Emp&a,const Emp&b){ return a.sal > b.sal; });
      cout << "D19 topEarner=" << e[0].name << " " << e[0].sal << "\n"; }

    // D20 LC1 two sum with a hash map
    { vector<int> a{2,7,11,15}; int t = 9; unordered_map<int,int> seen; pair<int,int> ans{-1,-1};
      for (int i = 0; i < (int)a.size(); ++i) { auto it = seen.find(t - a[i]); if (it != seen.end()) { ans = {it->second, i}; break; } seen[a[i]] = i; }
      cout << "D20 twoSum=[" << ans.first << "," << ans.second << "]\n"; }

    // D21 LC242 valid anagram
    { string a = "anagram", b = "nagaram";
      array<int,26> c{}; for (char x : a) c[x-'a']++; for (char x : b) c[x-'a']--;
      bool ok = all_of(c.begin(), c.end(), [](int x){ return x == 0; });
      cout << "D21 isAnagram=" << ok << "\n"; }

    // D22 LC349 intersection of two arrays
    { vector<int> a{4,9,5}, b{9,4,9,8,4};
      unordered_set<int> sa(a.begin(), a.end()); set<int> out;
      for (int x : b) if (sa.count(x)) out.insert(x);
      cout << "D22 intersection=" << vs(vector<int>(out.begin(), out.end())) << "\n"; }

    // D23 LC347 most frequent element
    { vector<int> a{1,1,1,2,2,3}; unordered_map<int,int> f; for (int x : a) f[x]++;
      auto best = max_element(f.begin(), f.end(), [](auto&x, auto&y){ return x.second < y.second; });
      cout << "D23 mostFrequent=" << best->first << " count=" << best->second << "\n"; }

    // D24 next event strictly after t, in an ordered map
    { map<int,string> ev{{9,"standup"},{13,"lunch"},{17,"review"}};
      auto it = ev.upper_bound(10);
      cout << "D24 nextEventAfter(10)=" << it->first << " " << it->second
           << "  none after 17 -> " << (ev.upper_bound(17) == ev.end()) << "\n"; }

    // D25 LC35 search insert position
    { vector<int> a{1,3,5,6};
      auto f = [&](int t){ return (int)(lower_bound(a.begin(), a.end(), t) - a.begin()); };
      cout << "D25 searchInsert(5)=" << f(5) << " (2)=" << f(2) << " (7)=" << f(7) << " (0)=" << f(0) << "\n"; }

    // D26 LC34 count occurrences in a sorted array
    { vector<int> a{5,7,7,8,8,8,10}; int t = 8;
      int lo = lower_bound(a.begin(),a.end(),t) - a.begin();
      int hi = upper_bound(a.begin(),a.end(),t) - a.begin();
      cout << "D26 range of 8 = [" << lo << "," << (hi-1) << "] count=" << (hi-lo) << "\n"; }

    // D27 LC303 range sum query
    { vector<int> a{-2,0,3,-5,2,-1}; vector<long long> p(a.size()+1,0);
      for (size_t i=0;i<a.size();++i) p[i+1]=p[i]+a[i];
      auto q=[&](int l,int r){ return p[r+1]-p[l]; };
      cout << "D27 sumRange(0,2)=" << q(0,2) << " (2,5)=" << q(2,5) << " (0,5)=" << q(0,5) << "\n"; }

    // D28 LC20 valid parentheses
    { auto ok = [](const string& s){ stack<char> st; unordered_map<char,char> m{{')','('},{']','['},{'}','{'}};
        for (char c : s) { if (m.count(c)) { if (st.empty() || st.top() != m[c]) return false; st.pop(); } else st.push(c); }
        return st.empty(); };
      cout << "D28 \"()[]{}\"=" << ok("()[]{}") << " \"(]\"=" << ok("(]") << " \"([)]\"=" << ok("([)]") << "\n"; }

    // D29 BFS levels on a tiny graph
    { vector<vector<int>> g{{1,2},{0,3},{0},{1}};
      vector<int> dist(4,-1); queue<int> q; q.push(0); dist[0]=0;
      while(!q.empty()){ int u=q.front(); q.pop(); for(int v:g[u]) if(dist[v]<0){dist[v]=dist[u]+1;q.push(v);} }
      cout << "D29 bfsDistFrom0=" << vs(dist) << "\n"; }

    // D30 LC239 sliding window maximum with a monotonic deque
    { vector<int> a{1,3,-1,-3,5,3,6,7}; int k=3; deque<int> dq; vector<int> out;
      for (int i=0;i<(int)a.size();++i){ while(!dq.empty() && dq.front()<=i-k) dq.pop_front();
        while(!dq.empty() && a[dq.back()]<=a[i]) dq.pop_back(); dq.push_back(i);
        if(i>=k-1) out.push_back(a[dq.front()]); }
      cout << "D30 slidingWindowMax(k=3)=" << vs(out) << "\n"; }

    // D31 LC215 kth largest with a size-k MIN-heap
    { vector<int> a{3,2,1,5,6,4}; int k=2;
      priority_queue<int, vector<int>, greater<int>> h;
      for(int x:a){ h.push(x); if((int)h.size()>k) h.pop(); }
      cout << "D31 kthLargest(2) via size-k min-heap=" << h.top() << "\n"; }

    // D32 LC973 k closest points to the origin
    { vector<pair<int,int>> pts{{1,3},{-2,2},{5,8},{0,1}}; int k=2;
      priority_queue<pair<long long,pair<int,int>>> h;   // MAX-heap of (dist, point), keep k smallest
      for(auto&p:pts){ long long d=(long long)p.first*p.first+(long long)p.second*p.second;
        h.push({d,p}); if((int)h.size()>k) h.pop(); }
      vector<pair<int,int>> out; while(!h.empty()){ out.push_back(h.top().second); h.pop(); }
      sort(out.begin(), out.end());
      ostringstream o; for(auto&p:out) o<<"("<<p.first<<","<<p.second<<")";
      cout << "D32 kClosest(2)=" << o.str() << "\n"; }

    // D33 LC125 valid palindrome, alphanumeric only, case-insensitive
    { auto ok=[](string s){ string t; for(char c:s) if(isalnum((unsigned char)c)) t+=tolower(c);
        return equal(t.begin(), t.begin()+t.size()/2, t.rbegin()); };
      cout << "D33 \"A man, a plan, a canal: Panama\"=" << ok("A man, a plan, a canal: Panama")
           << " \"race a car\"=" << ok("race a car") << "\n"; }

    // D34 run-length encode
    { string s="aaabbc"; string out; out.reserve(s.size()*2);
      for(size_t i=0;i<s.size();){ size_t j=i; while(j<s.size()&&s[j]==s[i]) ++j;
        out += s[i]; out += to_string(j-i); i=j; }
      cout << "D34 rle(\"aaabbc\")=" << out << "\n"; }

    // D35 caesar shift by 3, wrapping
    { string s="xyz", out; for(char c:s) out += char('a' + (c-'a'+3)%26);
      cout << "D35 caesar(\"xyz\",3)=" << out << "\n"; }

    // D36 LC7 reverse integer with an overflow guard
    { auto rev=[](int x)->int{ long long r=0; while(x){ r=r*10+x%10; x/=10;
        if(r>INT_MAX||r<INT_MIN) return 0; } return (int)r; };
      cout << "D36 reverse(123)=" << rev(123) << " reverse(-123)=" << rev(-123)
           << " reverse(1534236469)=" << rev(1534236469) << " (overflow -> 0)\n"; }

    // D37 dedupe a list of pairs by VALUE
    { set<pair<int,int>> s{{1,2},{1,2},{3,4}};
      cout << "D37 dedupedPairs=" << s.size() << " (pair has real value equality in C++)\n"; }

    // D38 remove all evens safely
    { vector<int> v{1,2,2,3,4};
      v.erase(remove_if(v.begin(), v.end(), [](int x){return x%2==0;}), v.end());
      cout << "D38 removeEvens=" << vs(v) << "\n"; }

    // D39 double every element in place
    { vector<int> v{1,2,3}; for(int& x:v) x*=2; cout << "D39 doubled=" << vs(v) << "\n"; }

    // D40 kth smallest in O(n) average with nth_element
    { vector<int> a{7,10,4,3,20,15}; int k=3;
      nth_element(a.begin(), a.begin()+k-1, a.end());
      cout << "D40 kthSmallest(3) via nth_element=" << a[k-1] << " (O(n) average, no full sort)\n"; }

    return 0;
}
