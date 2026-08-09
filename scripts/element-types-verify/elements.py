# elements.py — what can go INSIDE a container, and what it costs. Executed.
# python3 elements.py
import array
import sys
import time
from dataclasses import dataclass


def deep(obj, seen=None):
    """Bytes reachable from obj: the container plus everything it points at.

    getsizeof() alone lies about a list — it reports the pointer array only, not
    the objects those pointers lead to, which is exactly the cost that matters."""
    if seen is None:
        seen = set()
    if id(obj) in seen:
        return 0
    seen.add(id(obj))
    n = sys.getsizeof(obj)
    if isinstance(obj, (list, tuple, set, frozenset)):
        n += sum(deep(x, seen) for x in obj)
    elif isinstance(obj, dict):
        n += sum(deep(k, seen) + deep(v, seen) for k, v in obj.items())
    return n


# E01 the plainest element: a number
a = [1, 2, 3]
print(f'E01 there are no primitives. sys.getsizeof(1)={sys.getsizeof(1)}B for the int OBJECT, '
      f'sys.getsizeof(10**20)={sys.getsizeof(10**20)}B (arbitrary precision grows), '
      f'float={sys.getsizeof(1.0)}B bool={sys.getsizeof(True)}B')
print(f'E01vec sys.getsizeof([1,2,3])={sys.getsizeof(a)}B is POINTERS ONLY (8B each + header). '
      f'Reachable total = {deep(a)}B once you count the three int objects.')
_small_a, _small_b = int('1'), int('1')          # built at runtime, not folded
_big_a, _big_b = int('257'), int('257')
print(f'E01cache small ints -5..256 are pre-allocated and SHARED, so a list of small ints '
      f'costs far less than deep() suggests: int("1") is int("1") -> {_small_a is _small_b}, '
      f'but int("257") is int("257") -> {_big_a is _big_b} — past the cache each one is a fresh 28B object')

# E02 a list is an array of pointers, never of values
b = [10, 20, 30]
print(f'E02 CPython list = a contiguous array of PyObject*, so b[i] is one pointer read '
      f'PLUS one dereference. len(b)={len(b)} b[1]={b[1]}')
print(f'E02arr array.array("i",[10,20,30]) stores raw 4-byte ints with NO per-element object: '
      f'{sys.getsizeof(array.array("i", [10,20,30]))}B vs {deep(b)}B for the list. '
      f'This is the closest Python gets to int[].')

# E03 a pair inside — the tuple
p = (1, 2)
print(f'E03 tuple IS the pair: {p} p[0]={p[0]} sizeof={sys.getsizeof(p)}B '
      f'(vs {sys.getsizeof([1,2])}B for the list — a tuple is smaller because it cannot grow)')
print(f'E03hash tuples are IMMUTABLE and HASHABLE, so they work as dict keys and set members: '
      f'{len({(1,2), (1,2), (3,4)})} unique from three. Lists are not hashable at all.')
try:
    {[1, 2]}
    r = 'no error'
except TypeError as e:
    r = f'TypeError: {e}'
print(f'E03trap a set of lists -> {r}')

# E04 tuples of any arity, and named ones
from collections import namedtuple
Point = namedtuple('Point', 'x y')
pt = Point(1, 2)
t3 = (1, 2, 3)
print(f'E04 arity is free: sizeof (1,2)={sys.getsizeof((1,2))}B (1,2,3)={sys.getsizeof(t3)}B '
      f'— 8B per extra slot, exactly one pointer')
print(f'E04named namedtuple keeps tuple size ({sys.getsizeof(pt)}B) but adds names: '
      f'pt.x={pt.x} pt[0]={pt[0]} — still indexable, still hashable, zero memory cost')


# E05 a class inside — __slots__ is the lever
class Plain:
    def __init__(self, a, b):
        self.a, self.b = a, b


class Slotted:
    __slots__ = ('a', 'b')

    def __init__(self, a, b):
        self.a, self.b = a, b


@dataclass(frozen=True)
class Frozen:
    a: int
    b: int


pl, sl = Plain(1, 2), Slotted(1, 2)
print(f'E05 a normal instance carries a __dict__: sizeof(obj)={sys.getsizeof(pl)}B '
      f'+ its __dict__ {sys.getsizeof(pl.__dict__)}B = {sys.getsizeof(pl) + sys.getsizeof(pl.__dict__)}B')
print(f'E05slots __slots__ removes the dict entirely: {sys.getsizeof(sl)}B, '
      f'and has_dict={hasattr(sl, "__dict__")}. This is the one real memory lever Python gives you.')
print(f'E05data @dataclass(frozen=True) is hashable and usable as a key: '
      f'{len({Frozen(1,2), Frozen(1,2)})} unique from two identical')

# E06 a string inside
s, t = 'hi', 'a much longer string'
print(f'E06 str is IMMUTABLE. sizeof("hi")={sys.getsizeof(s)}B '
      f'sizeof("{t}")={sys.getsizeof(t)}B — ~49B of header plus 1 byte per ASCII char')
print(f'E06flex PEP 393: pure-ASCII strings use 1 byte/char, Latin-1 1, BMP 2, astral 4. '
      f'sizeof("é")={sys.getsizeof("é")}B vs sizeof("e")={sys.getsizeof("e")}B — '
      f'one non-ASCII character re-encodes the WHOLE string')
_lit = 'hi'
_lit2 = 'hi'                                      # a second literal, same module
_built = ''.join(['h', 'i'])                      # built at runtime, not folded
print(f'E06intern identifier-like literals are INTERNED into a shared pool: '
      f'two literals share one object -> {_lit is _lit2}, '
      f'but the same text built at runtime is a separate object -> {_built is _lit} '
      f'(equal though: {_built == _lit}). Always use ==.')

# E07 nested lists
g = [[0] * 4 for _ in range(3)]
print(f'E07 [[0]*4 for _ in range(3)] is 3 SEPARATE list objects held by pointer: '
      f'rows distinct -> {g[0] is not g[1]}, total reachable {deep(g)}B')
bad = [[0] * 4] * 3
bad[0][0] = 9
print(f'E07trap [[0]*4]*3 shares ONE row: after bad[0][0]=9 -> {bad}  all rows aliased -> {bad[0] is bad[1]}')
flat = [0] * 12
print(f'E07flat one flat list of 12 = {deep(flat)}B, index flat[i*4+j] — '
      f'fewer objects, one contiguous pointer array')

# E08 flags: list of bool vs bytearray vs int bitmask
flags = [False] * 64
ba = bytearray(64)
mask = 0
mask |= 1 << 0
print(f'E08 [False]*64 = {deep(flags)}B (pointers, though True/False are singletons so no extra objects)')
print(f'E08byte bytearray(64) = {sys.getsizeof(ba)}B — one byte per flag, mutable')
print(f'E08bits a plain int as a bitmask = {sys.getsizeof(mask)}B for 64 flags. '
      f'mask & (1<<0) -> {bool(mask & (1 << 0))}, mask.bit_count() exists in 3.10+')

# E09 everything is a reference
x = [1]
y = [x, x]
print(f'E09 every element is a reference: y[0] is y[1] -> {y[0] is y[1]}. '
      f'Mutating through one shows in the other: ', end='')
y[0].append(2)
print(f'{y}')
print(f'E09copy list(y) is SHALLOW — the inner list is still shared. copy.deepcopy is the only true copy.')

# E10 list of objects vs parallel arrays
N = 100000
objs = [Slotted(i, 0) for i in range(N)]
xs = array.array('d', [float(i) for i in range(N)])
t0 = time.perf_counter()
s1 = 0.0
for _ in range(5):
    for o in objs:
        s1 += o.a
t1 = time.perf_counter()
s2 = 0.0
for _ in range(5):
    s2 += sum(xs)
t2 = time.perf_counter()
print(f'E10 summing ONE field over {N} elements x5:')
print(f'E10perf attribute walk slower than array.array + sum() -> {(t1-t0) > (t2-t1)} '
      f'(same total: {s1 == s2}) — the object walk pays an attribute lookup per element in the interpreter, '
      f'sum() over array.array runs in C')

# E11 what a container CAN hold
by_tuple = {(1, 2): 3}
fns = [lambda v: v * 2]
mixed = [1, 'a', 2.0, [3], (4,), {5}, None]
print(f'E11 dict keyed by tuple works: {by_tuple[(1,2)]}   list of lambdas works: {fns[0](21)}')
print(f'E11mixed a list can hold ANY mix — {[type(v).__name__ for v in mixed]} — '
      f'because every slot is just a pointer. C++ and Java cannot do this without variant/Object.')
print(f'E11req dict/set keys must be HASHABLE (immutable): tuple yes, list no, frozenset yes')

# E12 growth: what the list buffer does
v = []
caps, last = [], 0
for i in range(100):
    v.append(i)
    cur = (sys.getsizeof(v) - sys.getsizeof([])) // 8
    if cur != last:
        last = cur
        caps.append(cur)
print(f'E12 slot counts as it grew: {caps}')
print(f'E12ratio CPython over-allocates by roughly 1.125x plus a constant — a much gentler curve '
      f'than C++ 2x or Java 1.5x. After 100 appends: len={len(v)} slots={last}')
print(f'E12fix there is no reserve(). [None]*n sets SIZE, not capacity — appending after it gives you 2n.')
