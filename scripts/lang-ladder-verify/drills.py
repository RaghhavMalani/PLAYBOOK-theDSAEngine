# drills.py — one real mini-problem per rung, executed.
# python3 drills.py
import bisect
import heapq
import itertools
from collections import Counter, defaultdict, deque

# D01 middle element of an odd-length array
a = [5, 2, 9, 1, 7]
print(f'D01 middle={a[len(a)//2]} first={a[0]} last={a[-1]}')

# D02 sum of elements at even indices
a = [1, 2, 3, 4, 5]
print(f'D02 evenIdxSum={sum(a[::2])}')

# D03 tally
t = [0] * 5
for h in [1, 3, 1]:
    t[h] += 1
print(f'D03 tally={t}')

# D04 LC27 remove element in place
a = [3, 2, 2, 3]
val, k = 3, 0
for x in a:
    if x != val:
        a[k] = x
        k += 1
del a[k:]
print(f'D04 removeElement(val=3) k={k} a={a}')

# D05 sort a copy without disturbing the caller
orig = [3, 1, 2]
s = sorted(orig)                     # sorted() always returns a NEW list
print(f'D05 sorted={s} original untouched={orig}')

# D06 identity matrix
n = 3
m = [[1 if i == j else 0 for j in range(n)] for i in range(n)]
print(f'D06 identity={m}')

# D07 LC118 Pascal's triangle
n, tri = 5, []
for i in range(n):
    row = [1] * (i + 1)
    for j in range(1, i):
        row[j] = tri[i-1][j-1] + tri[i-1][j]
    tri.append(row)
print(f'D07 pascal={tri}')

# D08 LC189 rotate right by k
a = [1, 2, 3, 4, 5, 6, 7]
k = 3 % len(a)
a = a[-k:] + a[:-k]                  # slicing makes this one line
print(f'D08 rotateRight(3)={a}')

# D09 LC53 Kadane
a = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
best = cur = a[0]
for x in a[1:]:
    cur = max(x, cur + x)
    best = max(best, cur)
print(f'D09 maxSubarraySum={best}')

# D10 LC217 contains duplicate
a = [1, 2, 3, 1]
print(f'D10 containsDuplicate={len(set(a)) != len(a)}')

# D11 index-of with a real sentinel (index() RAISES, so guard it)
a = [4, 1, 9]
print(f'D11 indexOf(9)={a.index(9) if 9 in a else -1} indexOf(8)={a.index(8) if 8 in a else -1}')

# D12 digits string -> list -> sum
s = '12345'
d = [int(c) for c in s]
print(f'D12 digits={d} sum={sum(d)}')

# D13 LC215 kth largest without disturbing the original
a = [3, 2, 1, 5, 6, 4]
k = 2
print(f'D13 kthLargest(2)={sorted(a, reverse=True)[k-1]} original={a}')

# D14 top-3 largest
a = [5, 1, 9, 3, 7]
print(f'D14 top3={sorted(a, reverse=True)[:3]}')

# D15 sort people by age asc then name asc
p = [(30, 'bob'), (25, 'amy'), (30, 'ann')]
print(f'D15 byAgeThenName= {" ".join(f"{n}{ag}" for ag, n in sorted(p))} ')

# D16 sort words by length, alphabetical within equal lengths
w = ['pear', 'fig', 'apple', 'kiwi']
print(f'D16 byLenThenAlpha= {" ".join(sorted(w, key=lambda x: (len(x), x)))} ')

# D17 LC643 max average of a window of size k
a, k = [1, 12, -5, -6, 50, 3], 4
cur = sum(a[:k])
best = cur
for i in range(k, len(a)):
    cur += a[i] - a[i-k]
    best = max(best, cur)
print(f'D17 maxAvgWindow(k=4)={best / k}')

# D18 LC56 merge intervals
iv = sorted([(1, 3), (8, 10), (2, 6), (15, 18)])
merged = []
for st, en in iv:
    if merged and st <= merged[-1][1]:
        merged[-1][1] = max(merged[-1][1], en)
    else:
        merged.append([st, en])
print(f'D18 mergedIntervals={"".join(f"[{x},{y}]" for x, y in merged)}')

# D19 sort records by salary desc
emps = [('amy', 90), ('bob', 120), ('cat', 110)]
top = sorted(emps, key=lambda e: -e[1])[0]
print(f'D19 topEarner={top[0]} {top[1]}')

# D20 LC1 two sum
a, t = [2, 7, 11, 15], 9
seen, ans = {}, (-1, -1)
for i, x in enumerate(a):
    if t - x in seen:
        ans = (seen[t-x], i)
        break
    seen[x] = i
print(f'D20 twoSum=[{ans[0]},{ans[1]}]')

# D21 LC242 valid anagram
print(f'D21 isAnagram={Counter("anagram") == Counter("nagaram")}')

# D22 LC349 intersection
print(f'D22 intersection={sorted(set([4,9,5]) & set([9,4,9,8,4]))}')

# D23 LC347 most frequent element
c = Counter([1, 1, 1, 2, 2, 3])
k_, v_ = c.most_common(1)[0]
print(f'D23 mostFrequent={k_} count={v_}')

# D24 next event strictly after t (sorted keys + bisect — no TreeMap)
ev = {9: 'standup', 13: 'lunch', 17: 'review'}
keys = sorted(ev)
i = bisect.bisect_right(keys, 10)
print(f'D24 nextEventAfter(10)={keys[i]} {ev[keys[i]]}  none after 17 -> {bisect.bisect_right(keys, 17) == len(keys)}')

# D25 LC35 search insert position
a = [1, 3, 5, 6]
f = lambda t: bisect.bisect_left(a, t)
print(f'D25 searchInsert(5)={f(5)} (2)={f(2)} (7)={f(7)} (0)={f(0)}')

# D26 LC34 count occurrences
a, t = [5, 7, 7, 8, 8, 8, 10], 8
lo, hi = bisect.bisect_left(a, t), bisect.bisect_right(a, t)
print(f'D26 range of 8 = [{lo},{hi-1}] count={hi-lo}')

# D27 LC303 range sum query
a = [-2, 0, 3, -5, 2, -1]
p = [0] + list(itertools.accumulate(a))
q = lambda l, r: p[r+1] - p[l]
print(f'D27 sumRange(0,2)={q(0,2)} (2,5)={q(2,5)} (0,5)={q(0,5)}')


def paren(s):
    st, m = [], {')': '(', ']': '[', '}': '{'}
    for c in s:
        if c in m:
            if not st or st.pop() != m[c]:
                return False
        else:
            st.append(c)
    return not st


# D28 LC20 valid parentheses
print(f'D28 "()[]{{}}"={paren("()[]{}")} "(]"={paren("(]")} "([)]"={paren("([)]")}')

# D29 BFS levels
g = [[1, 2], [0, 3], [0], [1]]
dist = [-1] * 4
q_ = deque([0])
dist[0] = 0
while q_:
    u = q_.popleft()
    for v in g[u]:
        if dist[v] < 0:
            dist[v] = dist[u] + 1
            q_.append(v)
print(f'D29 bfsDistFrom0={dist}')

# D30 LC239 sliding window maximum
a, k = [1, 3, -1, -3, 5, 3, 6, 7], 3
dq, out = deque(), []
for i, x in enumerate(a):
    while dq and dq[0] <= i - k:
        dq.popleft()
    while dq and a[dq[-1]] <= x:
        dq.pop()
    dq.append(i)
    if i >= k - 1:
        out.append(a[dq[0]])
print(f'D30 slidingWindowMax(k=3)={out}')

# D31 LC215 kth largest with a size-k min-heap
a, k = [3, 2, 1, 5, 6, 4], 2
h = []
for x in a:
    heapq.heappush(h, x)
    if len(h) > k:
        heapq.heappop(h)
print(f'D31 kthLargest(2) via size-k min-heap={h[0]}   (or heapq.nlargest(2,a)[-1]={heapq.nlargest(2,a)[-1]})')

# D32 LC973 k closest points
pts, k = [(1, 3), (-2, 2), (5, 8), (0, 1)], 2
out = heapq.nsmallest(k, pts, key=lambda p: p[0]*p[0] + p[1]*p[1])
print(f'D32 kClosest(2)={"".join(f"({x},{y})" for x, y in sorted(out))}')

# D33 LC125 valid palindrome
pal = lambda s: (lambda t: t == t[::-1])(''.join(c.lower() for c in s if c.isalnum()))
print(f'D33 "A man, a plan, a canal: Panama"={pal("A man, a plan, a canal: Panama")} "race a car"={pal("race a car")}')

# D34 run-length encode
s = 'aaabbc'
print(f'D34 rle("aaabbc")={"".join(ch + str(len(list(grp))) for ch, grp in itertools.groupby(s))}')

# D35 caesar shift by 3
s = 'xyz'
print(f'D35 caesar("xyz",3)={"".join(chr(ord("a") + (ord(c) - ord("a") + 3) % 26) for c in s)}')


def rev_int(x):
    sign = -1 if x < 0 else 1
    r = sign * int(str(abs(x))[::-1])
    return 0 if r < -2**31 or r > 2**31 - 1 else r   # the guard is MANUAL: Python never overflows


# D36 LC7 reverse integer
print(f'D36 reverse(123)={rev_int(123)} reverse(-123)={rev_int(-123)} reverse(1534236469)={rev_int(1534236469)} (overflow -> 0)')

# D37 dedupe a list of pairs BY VALUE
print(f'D37 dedupedPairs: set of tuples={len({(1,2), (1,2), (3,4)})} (tuples are hashable)   '
      f'set of lists -> TypeError: unhashable type: \'list\'')

# D38 remove all evens safely
print(f'D38 removeEvens={[x for x in [1,2,2,3,4] if x % 2]}')

# D39 double every element in place
v = [1, 2, 3]
v[:] = [x * 2 for x in v]            # v[:] = writes through to the SAME object
print(f'D39 doubled={v}  (v[:] = ... mutates in place; v = ... would rebind)')

# D40 kth smallest without a full sort
a, k = [7, 10, 4, 3, 20, 15], 3
print(f'D40 kthSmallest(3) via heapq.nsmallest={heapq.nsmallest(k, a)[-1]}  '
      f'(O(n log k); Python has no nth_element)')
