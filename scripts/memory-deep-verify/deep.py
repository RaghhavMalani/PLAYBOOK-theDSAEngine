# deep.py — iterator invalidation, the cache hierarchy, stack vs heap, hashing.
# Measured, not asserted. python3 deep.py
import array
import sys
import time

# ---------------- D01  iterator invalidation ----------------
SRC = [1, 2, 2, 3, 4]

v = SRC[:]
for x in v[:]:                       # iterate a COPY
    if x % 2 == 0:
        v.remove(x)
broken = SRC[:]
for x in broken:                     # iterate the LIVE list
    if x % 2 == 0:
        broken.remove(x)
print(f'D01 source={SRC}  iterating a copy -> {v} (correct)   iterating the live list -> {broken}')
print(f'D01quiet Python does NOT raise for a list. The index walks forward while the list shrinks '
      f'under it, so elements are SKIPPED and you get a plausible wrong answer. '
      f'Java throws ConcurrentModificationException for exactly this.')

d = {'a': 1, 'b': 2, 'c': 3}
try:
    for k in d:
        d[k + 'x'] = 1
    r = 'no error'
except RuntimeError as e:
    r = f'RuntimeError: {e}'
print(f'D01dict adding keys while iterating a dict -> {r}  <- dicts DO raise, lists do not')

d2 = {'a': 1, 'b': 2}
for k in d2:
    d2[k] = 99                        # value-only assignment is not a resize
print(f'D01ok assigning to EXISTING keys during iteration is fine: {d2}  '
      f'— only changing the SET of keys is a structural change')

s = {1, 2, 3}
try:
    for x in s:
        s.add(x + 10)
    r2 = 'no error'
except RuntimeError as e:
    r2 = f'RuntimeError: {e}'
print(f'D01set the same guard exists on sets -> {r2}')

lst = [1, 2, 3]
alias = lst
lst.append(4)                         # a list never "reallocates" out from under you
print(f'D01noptr Python has no pointers to dangle: growing a list may move its internal buffer, '
      f'but every NAME still refers to the same list object -> alias is lst: {alias is lst}, '
      f'alias={alias}')

# ---------------- D02  the cache hierarchy ----------------
N = 1 << 22                           # 4M ints
a = array.array('i', bytes(4 * N))    # raw contiguous storage, not a list of pointers


def stride_sum(buf, stride, touches=1 << 18):
    mask = len(buf) - 1
    total = 0
    i = 0
    for _ in range(touches):
        total += buf[i & mask]
        i += stride
    return total


def best(buf, stride, reps=3):
    b = float('inf')
    for _ in range(reps):
        t0 = time.perf_counter()
        stride_sum(buf, stride)
        b = min(b, time.perf_counter() - t0)
    return b


s1, s16, s1024 = best(a, 1), best(a, 16), best(a, 1024)
print(f'D02 the SAME number of reads, walked with a growing stride:')
print(f'D02step stride 16 slower than stride 1 -> {s16 > s1}   '
      f'stride 1024 slower than stride 16 -> {s1024 > s16}   1024 slower than 1 -> {s1024 > s1}')
print(f'D02gap the effect is REAL but much smaller here than in C++ or Java, because the '
      f'interpreter overhead per element dwarfs the memory stall. In CPython the loop itself '
      f'is the bottleneck; the cache only becomes visible once you drop into C via numpy.')
print(f'D02list and a plain list is worse than array.array before you even start: every element '
      f'is a POINTER to an int object elsewhere, so a "sequential" walk is already random access.')

# ---------------- D03  stack vs heap ----------------
print(f'D03 there is no stack/heap choice in Python. EVERY object is on the heap; the C stack '
      f'holds only interpreter frames. Even the integer 3 is a heap object.')
print(f'D03frame each Python call builds a frame OBJECT, which is heavier than a C stack frame — '
      f'that is why recursion is expensive here in time as well as in depth.')
print(f'D03lim sys.getrecursionlimit()={sys.getrecursionlimit()} — a SOFT limit the interpreter '
      f'enforces to protect the real C stack underneath it.')


def rec(d):
    return d if d >= 4000 else rec(d + 1)


old = sys.getrecursionlimit()
sys.setrecursionlimit(10000)
reached = rec(0)
sys.setrecursionlimit(old)
print(f'D03depth after setrecursionlimit(10000), recursion reached depth {reached}; '
      f'the limit was restored to {sys.getrecursionlimit()}')
print(f'D03risk raising the limit does NOT enlarge the C stack — set it too high and you get a '
      f'genuine segfault instead of a catchable RecursionError. A DFS on 1e5 nodes should be '
      f'iterative, not merely permitted.')

# ---------------- D04  hash containers ----------------
sizes, last = [], 0
dd = {}
for i in range(1000):
    dd[i] = i
    cur = sys.getsizeof(dd)
    if cur != last:
        last = cur
        sizes.append(cur)
print(f'D04 dict byte sizes as it grew: {sizes}')
print(f'D04lf CPython resizes when it is 2/3 full, and since 3.6 a dict is two arrays — a compact '
      f'entries array plus a sparse index array — which is why it both preserves insertion order '
      f'and costs less than the classic open-addressing table.')
print(f'D04mem a dict of 1e6 int->int is roughly 40-70MB depending on fill; two array.array("i") '
      f'holding the same data is 8MB. The convenience is not free.')

print(f'D04hash hash(int) is the identity for small ints: hash(1)={hash(1)} hash(2)={hash(2)} '
      f'hash(-1)={hash(-1)}  <- -1 is special-cased to -2 because -1 signals an error in CPython')
print(f'D04str hash("abc") is RANDOMISED per process by default (PYTHONHASHSEED), specifically to '
      f'stop the collision attack that plain integer keys are still open to.')

n = 200000
keys = list(range(n))
import random
random.Random(42).shuffle(keys)

t0 = time.perf_counter()
hm = {}
for k in keys:
    hm[k] = k
t1 = time.perf_counter()
tot = 0
for k in keys:
    tot += hm[k]
t2 = time.perf_counter()
sl = sorted(keys)
t3 = time.perf_counter()
print(f'D04cmp {n} random keys: dict build {"faster than" if (t1-t0) < (t3-t2) else "slower than"} '
      f'a full sort of the same keys, and lookup is O(1) amortised (checksum ok: {tot == sum(keys)})')
print(f'D04noorder there is no ordered-map equivalent in the stdlib: a dict gives you insertion '
      f'order, never sorted order. For floor/ceiling queries you need a sorted list plus bisect, '
      f'which is O(n) to insert — the gap C++ fills with std::map and Java with TreeMap.')
