# ladder.py — every rung of the 40-rung language ladder, executed.
# python3 ladder.py
import bisect
import copy
import sys
import time
from collections import Counter, defaultdict, deque
from dataclasses import dataclass
import heapq

# R01 declare, index, length
a = [5, 2, 9]
print(f'R01 a[0]={a[0]} a[-1]={a[-1]} len(a)={len(a)} bool([])={bool([])} '
      f'  <- len() is a FUNCTION, and negative indices are legal')
try:
    a[9]
    r = 'no throw'
except IndexError as e:
    r = f'IndexError: {e}'
print(f'R01trap a[9] -> {r}   but a[9:] -> {a[9:]} (slicing NEVER raises)')

# R02 iterate three ways
v = ['a', 'b', 'c']
s1 = ''.join(v[i] for i in range(len(v)))
s2 = ''.join(x for x in v)
s3 = ''.join(f'{i}{x}' for i, x in enumerate(v))
print(f'R02 index={s1} for-each={s2} enumerate={s3}  (enumerate exists only here)')

# R03 initialize filled / sized
print(f'R03 [0]*5={[0]*5} [7]*5={[7]*5} list(range(5))={list(range(5))} '
      f'[None]*3={[None]*3}  (no fixed-size array; a list starts empty and grows)')

# R04 grow and shrink
v = [1, 2, 3]
v.append(4)
v.insert(1, 99)
del v[0]
popped = v.pop()
print(f'R04 after append/insert/del={v} pop()={popped}  (pop RETURNS the element — unlike C++/Java void)')
w = [10, 20, 30]
w.remove(20)
print(f'R04trap list.remove(20) removes by VALUE -> {w}   list.pop(1) would remove by INDEX')

# R05 copy vs alias
a = [1, 2, 3]
alias = a          # same object
shallow = a[:]     # new list
shallow[0] = 42
alias[1] = 77
print(f'R05 a={a} shallow={shallow}  (= aliases; a[:] / list(a) / a.copy() copy)')
print(f'R05id id(a)==id(alias) -> {id(a) == id(alias)}   id(a)==id(shallow) -> {id(a) == id(shallow)}')

# R06 2D grid
g = [[0] * 3 for _ in range(2)]
g[1][2] = 7
bad = [[0] * 3] * 2
bad[1][2] = 7
print(f'R06 {len(g)}x{len(g[0])} {g}')
print(f'R06trap [[0]*3]*2 after one write -> {bad}  <- ALL rows aliased, no error raised')

# R07 jagged
j = [[i] * (i + 1) for i in range(3)]
print(f'R07 jagged={j} rowlens={[len(r) for r in j]}  (ragged is the default, not a special case)')

# R08 reverse
v = [1, 2, 3, 4, 5]
v.reverse()
w = [1, 2, 3, 4, 5]
w[1:4] = w[1:4][::-1]
print(f'R08 .reverse()={v} slice-reverse [1:4]={w} whole [::-1]={[1,2,3,4,5][::-1]}  (reversed() gives an ITERATOR, not a list)')

# R09 sum min max
v = [4, 1, 9, 3]
print(f'R09 sum={sum(v)} min={min(v)} max={max(v)} '
      f'index-of-max={v.index(max(v))} max(range,key=)={max(range(len(v)), key=lambda i: v[i])}')
print(f'R09trap sum([2000000000, 2000000000])={sum([2000000000, 2000000000])}  '
      f'<- Python ints are ARBITRARY PRECISION: this never overflows, which is why the port to C++/Java breaks')

# R10 membership
v = [4, 1, 9]
s = {4, 1, 9}
print(f'R10 9 in list -> {9 in v} (O(n))   9 in set -> {9 in s} (O(1))   '
      f'"ell" in "hello" -> {"ell" in "hello"} (substring, not element!)')

# R11 index of a value / miss
v = [4, 1, 9]
try:
    v.index(8)
    r = 'no throw'
except ValueError as e:
    r = f'ValueError: {e}'
print(f'R11 v.index(9)={v.index(9)}  v.index(8) -> {r}  <- RAISES, it does not return -1')

# R12 conversions
t = (1, 2, 3)
print(f'R12 list(tuple)={list(t)} tuple(list)={tuple([1,2,3])} list("abc")={list("abc")} '
      f'list(range(3))={list(range(3))} "".join(["a","b"])={"".join(["a","b"])}')

# R13 in-place vs new
a = [3, 1, 2]
b = sorted(a)
ret = a.sort()
print(f'R13 sorted(a) returns a NEW list={b}   a.sort() returns {ret} and mutates a to {a}')
c = [3, 1, 2]
c = c.sort()
print(f'R13trap "a = a.sort()" leaves you holding {c}  <- compiles fine, destroys your data')

# R14 ascending / descending
print(f'R14 sorted={sorted([3,1,2])} reverse=True -> {sorted([3,1,2], reverse=True)} '
      f'key=-x -> {sorted([3,1,2], key=lambda x: -x)}')

# R15 custom rule, second key
ps = [(1, 9), (2, 1), (1, 3)]
print(f'R15 {sorted(ps, key=lambda t: (t[1], t[0]))}')
tie = [(1, 5), (3, 5), (2, 1)]
print(f'R15mixed {tie} by 2nd ASC then 1st DESC -> {sorted(tie, key=lambda t: (t[1], -t[0]))}  '
      f'<- negation only works on NUMBERS; for strings you need two passes or cmp_to_key')

# R16 stable sort
v = [('a', 1), ('b', 1), ('c', 0)]
print(f'R16 sorted() is ALWAYS stable (Timsort) -> {"".join(x[0] for x in sorted(v, key=lambda x: x[1]))}  (a before b preserved)')
wc = [('b', 2), ('a', 2), ('c', 1)]
print(f'R16use count DESC then word ASC via TWO passes on {wc} -> '
      f'{sorted(sorted(wc, key=lambda x: x[0]), key=lambda x: -x[1])}  '
      f'(sort by the tiebreak first, then by the primary key — stability carries it)')

# R17 slices copy
a = [1, 2, 3, 4]
sl = a[0:2]
sl[0] = 42
print(f'R17 slice is a COPY: slice={sl} original={a}   a[::2]={a[::2]} a[::-1]={a[::-1]}')
nested = [[1], [2]]
sh = nested[:]
sh[0][0] = 99
print(f'R17trap a[:] is SHALLOW: nested={nested}  <- inner list shared. copy.deepcopy -> {copy.deepcopy([[1],[2]])[0]}')

# R18 tuple as compound element
p = (1, 'a')
t = (3, 4, 'z')
x, y, z = t
print(f'R18 p={p} p[0]={p[0]} unpack={x}{y}{z} sorted lexicographically={sorted([(2,1),(1,9),(1,3)])}')
try:
    p[0] = 5
    r = 'no throw'
except TypeError as e:
    r = f'TypeError: {e}'
print(f'R18imm tuples are immutable and HASHABLE: {{(1,2)}} works, {{[1,2]}} does not. p[0]=5 -> {r}')

# R19 dataclass as element
@dataclass(frozen=True, order=True)
class P:
    a: int
    b: int

v = sorted([P(2, 5), P(1, 7)])
print(f'R19 sorted first={v[0]} equality={P(1,7) == P(1,7)} hashable-as-key={len({P(1,1), P(1,1)})}  '
      f'(order=True gives comparison free; frozen=True gives hashability)')

# R20 dict put/get/missing
m = {'a': 1}
print(f'R20 m["a"]={m["a"]} m.get("b")={m.get("b")} m.get("b",-1)={m.get("b",-1)} '
      f'"b" in m -> {"b" in m}')
try:
    m['b']
    r = 'no throw'
except KeyError as e:
    r = f'KeyError: {e}'
print(f'R20trap m["b"] -> {r}  <- RAISES (C++ operator[] silently inserts; Java get returns null)')
m.setdefault('c', 3)
dd = defaultdict(int)
dd['zz'] += 1
print(f'R20api setdefault -> {m}   defaultdict(int)["zz"]+=1 -> {dict(dd)}')

# R21 frequency counting
s = 'abracadabra'
c = Counter(s)
d = defaultdict(int)
for ch in s:
    d[ch] += 1
print(f'R21 Counter={dict(sorted(c.items()))} most_common(2)={c.most_common(2)}')
print(f'R21alt defaultdict(int)={dict(sorted(d.items()))}  and Counter arithmetic: {dict(Counter("aab") - Counter("ab"))}')

# R22 set / dedup
v = [3, 1, 3, 2, 1]
print(f'R22 set(v)={set(v)} sorted(set(v))={sorted(set(v))} '
      f'dict.fromkeys(v) preserves order -> {list(dict.fromkeys(v))}')
print(f'R22ops {{1,2,3}} & {{2,3,4}} = {set([1,2,3]) & set([2,3,4])}, '
      f'| = {set([1,2,3]) | set([2,3,4])}, - = {set([1,2,3]) - set([2,3,4])}, '
      f'^ = {set([1,2,3]) ^ set([2,3,4])}')

# R23 iterating a dict / ordering
m = {'b': 2, 'a': 1, 'c': 3}
print(f'R23 dict preserves INSERTION order (3.7+): keys={list(m)} '
      f'items={list(m.items())} sorted by value={sorted(m.items(), key=lambda kv: kv[1])}')

# R24 ordered navigation — Python has no TreeMap
keys = sorted([10, 20, 30])
i = bisect.bisect_left(keys, 15)
print(f'R24 no TreeMap in the stdlib. sorted keys + bisect: ceiling(15)={keys[i]} '
      f'floor(15)={keys[i-1]} first={keys[0]} last={keys[-1]}  '
      f'(inserting stays O(n) — use sortedcontainers if you need O(log n) writes)')

# R25 binary search + miss
s = [1, 3, 5, 7]
print(f'R25 bisect_left(s,5)={bisect.bisect_left(s,5)} (hit) bisect_left(s,4)={bisect.bisect_left(s,4)} (insertion point) '
      f'bisect_left(s,99)={bisect.bisect_left(s,99)} (== len, no error)')
print(f'R25found "was it there?" needs an explicit check: i=bisect_left(s,4); i<len(s) and s[i]==4 -> '
      f'{(lambda i: i < len(s) and s[i] == 4)(bisect.bisect_left(s,4))}')

# R26 lower/upper bound counts duplicates
s = [1, 3, 3, 3, 5]
lo, hi = bisect.bisect_left(s, 3), bisect.bisect_right(s, 3)
print(f'R26 bisect_left={lo} bisect_right={hi} count={hi-lo}  (bisect_right is the same as bisect)')

# R27 prefix sums
import itertools
a = [2, 4, 6, 8]
p = [0]
for x in a:
    p.append(p[-1] + x)
acc = list(itertools.accumulate(a))
print(f'R27 prefix(n+1)={p} sum a[1..2]={p[3]-p[1]}   itertools.accumulate(n)={acc} '
      f'accumulate with initial=0 -> {list(itertools.accumulate(a, initial=0))}')

# R28 stack
st = [1]
st.append(2)
top = st.pop()
print(f'R28 a plain list IS the stack: append/pop -> popped={top} top={st[-1]} len={len(st)}')
try:
    [].pop()
    r = 'no throw'
except IndexError as e:
    r = f'IndexError: {e}'
print(f'R28empty [].pop() -> {r}  (Python raises; C++ top() on empty is undefined behaviour)')

# R29 queue
q = deque([1, 2])
f = q.popleft()
print(f'R29 deque.popleft()={f} front={q[0]} len={len(q)}  (deque, NOT list)')
print(f'R29trap list.pop(0) is O(n): it shifts every element. On 1e5 items that alone is 5e9 operations.')

# R30 deque both ends
d = deque([2, 3])
d.appendleft(1)
d.append(4)
print(f'R30 popped first={d.popleft()} back={d.pop()} left={list(d)} '
      f'index access d[0]={d[0]} (O(n) in the middle) rotate(1) -> {(lambda x: (x.rotate(1), list(x))[1])(deque([1,2,3]))}')

# R31 priority queue defaults
h = []
for x in [5, 1, 9]:
    heapq.heappush(h, x)
mx = []
for x in [5, 1, 9]:
    heapq.heappush(mx, -x)
print(f'R31 heapq is a MIN-heap ONLY: h[0]={h[0]}   max-heap trick = push -x, read -mx[0] = {-mx[0]}  '
      f'(no comparator argument exists at all)')
print(f'R31trap the raw list is heap order, not sorted: h={h}  nlargest(2)={heapq.nlargest(2, [5,1,9])} '
      f'nsmallest(2)={heapq.nsmallest(2, [5,1,9])} heapify(list) is O(n)')

# R32 heap of tuples
h = []
for pr, name in [(3, 'c'), (1, 'a'), (2, 'b')]:
    heapq.heappush(h, (pr, name))
out = []
while h:
    out.append(''.join(map(str, heapq.heappop(h))))
print(f'R32 drained= {" ".join(out)}  (tuples compare lexicographically — no comparator needed)')
print(f'R32trap if the 2nd field is not comparable you get a TypeError; add a tiebreak counter: (pri, i, obj)')

# R33 strings are sequences
s = 'hello'
try:
    s[0] = 'H'
    r = 'no throw'
except TypeError as e:
    r = f'TypeError: {e}'
print(f'R33 s[0]={s[0]} len={len(s)} s[1:4]={s[1:4]} (start,END-exclusive) s[::-1]={s[::-1]}')
print(f'R33imm s[0]="H" -> {r}   fix: "H"+s[1:] = {"H"+s[1:]}')

# R34 building a string in a loop
parts = [chr(ord('a') + i) for i in range(5)]
joined = ''.join(parts)
bad = ''
for i in range(5):
    bad += chr(ord('a') + i)
print(f'R34 "".join(list)={joined} (O(n))   += in a loop={bad} (O(n^2) in principle; CPython has a fragile in-place optimisation you must not rely on)')
t0 = time.perf_counter()
sb = ''.join(['x'] * 200000)
t_join = time.perf_counter() - t0
t0 = time.perf_counter()
acc2 = []
for _ in range(200000):
    acc2.append('x')
''.join(acc2)
t_app = time.perf_counter() - t0
print(f'R34perf join of 200000 pieces is faster than append-then-join -> {t_join < t_app}  (both are O(n); join wins by constant factor)')

# R35 char arithmetic
print(f'R35 ord("c")-ord("a")={ord("c")-ord("a")} chr(ord("a")+2)={chr(ord("a")+2)} ord("A")={ord("A")} '
      f'"c".isalpha()={"c".isalpha()}  <- NO implicit char type: ord()/chr() are mandatory')
try:
    'c' - 'a'
    r = 'no throw'
except TypeError as e:
    r = f'TypeError: {e}'
print(f'R35trap "c" - "a" -> {r}')

# R36 no overflow
big = 2 ** 200
print(f'R36 2**200 = {big}  ({big.bit_length()} bits — Python ints have no width)')
print(f'R36mid (lo+hi)//2 is always safe here: {(2000000000 + 2100000000) // 2}   '
      f'sys.maxsize={sys.maxsize} is only the max LIST INDEX, not an int limit')
print(f'R36div -7//2={-7//2} (floors toward -inf)  int(-7/2)={int(-7/2)} (truncates)  '
      f'<- C++/Java give -3; Python // gives -4. This is a real wrong-answer source.')

# R37 identity vs equality
x, y = int('256'), int('256')      # built at runtime so the compiler cannot fold them
p, q = int('257'), int('257')
print(f'R37 int("256") is int("256") -> {x is y}   int("257") is int("257") -> {p is q}   257 == 257 -> {p == q}  '
      f'<- CPython caches small ints -5..256; `is` on ints is a bug waiting for larger data')
print(f'R37list [1,2]==[1,2] -> {[1,2]==[1,2]} but [1,2] is [1,2] -> {[1,2] is [1,2]}  (== is VALUE, is is IDENTITY)')

# R38 mutating while iterating
SRC = [1, 2, 2, 3, 4]
v = SRC[:]
for x in v[:]:
    if x % 2 == 0:
        v.remove(x)
broken = SRC[:]
for x in broken:
    if x % 2 == 0:
        broken.remove(x)
print(f'R38 source={SRC}  iterate over a COPY v[:] -> {v} (correct)')
print(f'R38trap iterating the LIVE list -> {broken}  <- an even number survived. Python does NOT raise; Java throws ConcurrentModificationException')
print(f'R38fix comprehension -> {[x for x in SRC if x % 2]}')

# R39 loop variable semantics
v = [1, 2, 3]
for x in v:
    x *= 10
print(f'R39 rebinding the loop var does nothing: {v}')
for i in range(len(v)):
    v[i] *= 10
print(f'R39fix by index -> {v}')
objs = [[1]]
for o in objs:
    o[0] = 99
print(f'R39obj mutating a MUTABLE element through the loop var DOES stick: {objs}')

# R40 scale traps
import sys as _s
print(f'R40 sys.getsizeof([]) = {_s.getsizeof([])} bytes, a list of 1e6 ints holds POINTERS '
      f'(~8 bytes each) plus the int objects themselves (~28 bytes) — roughly 9x a C++ vector<int>')
print(f'R40rec default recursion limit = {_s.getrecursionlimit()}  <- a DFS on 1e5 nodes will RecursionError; '
      f'raise it or go iterative')
t0 = time.perf_counter()
tot = 0
for i in range(2000000):
    tot += i
t_loop = time.perf_counter() - t0
t0 = time.perf_counter()
tot2 = sum(range(2000000))
t_sum = time.perf_counter() - t0
print(f'R40perf sum(range(2e6)) faster than a Python for-loop -> {t_sum < t_loop} (same answer {tot == tot2}) '
      f'— the C loop beats the interpreted one every time')
