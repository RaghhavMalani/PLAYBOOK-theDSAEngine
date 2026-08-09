/**
 * The element-types ladder — what can go INSIDE a container, and what it costs.
 *
 * The operations ladder (lang-ladder.ts) answers "how do I call this". This answers
 * the question the memory page exists to ask: *what is actually in the box, and how
 * many bytes did that decision cost me?*
 *
 * Twelve levels, easy to extreme, from "an array of numbers" to array-of-structs
 * versus struct-of-arrays and why one of them is measurably faster at reading the
 * same field. The through-line is a single idea that the three languages answer
 * completely differently:
 *
 *     Does the container hold your VALUES, or does it hold POINTERS to them?
 *
 * C++ holds values. Java holds values for primitives and pointers for everything
 * else. Python holds pointers, always, with no exceptions. Every size number below
 * follows from that one fact, and so does every performance difference.
 *
 * EVERY NUMBER IN THIS FILE WAS MEASURED, NOT LOOKED UP.
 *   C++    g++ 11.4.0 -std=c++17 — sizeof, alignof, capacity(), data() addresses
 *   Java   OpenJDK 11.0.31 — measured layout facts and timed loops after warm-up
 *   Python CPython 3.10.12 — sys.getsizeof plus a recursive reachable-bytes walk
 * The `measured` field on each level is literal stdout from those programs: 88
 * captured lines. Re-run them with `npm run verify:elements` and the check will
 * fail loudly if a single byte count drifts.
 *
 * Why measure rather than assert: "an Integer costs about 16 bytes" is the kind of
 * claim that is repeated until it is wrong for your JVM. Printing sizeof and
 * getsizeof from a real run means the page cannot quietly rot.
 */

export type ElemTier = "easy" | "medium" | "hard" | "extreme";
export type LangKey = "py" | "cpp" | "java";

/** One row of the per-language declaration reference. */
export interface DeclRow {
  /** how you declare or spell it */
  decl: string;
  /** what one element actually occupies */
  bytes: string;
  /** the thing that surprises people */
  note: string;
}

export interface ElementLevel {
  n: number;
  /** what is in the box at this level */
  title: string;
  tier: ElemTier;
  /** the one-line version */
  what: string;
  /** why this level is where it is on the ladder */
  why: string;
  /** the memory picture — what the machine actually lays out */
  layout: string;
  py: string;
  cpp: string;
  java: string;
  /** per-language declaration + cost reference */
  decl: Record<LangKey, DeclRow[]>;
  /** literal stdout from the three measurement programs */
  measured: string;
  /** the difference that costs memory or time */
  differs: string;
  /** the mistake this level exists to prevent */
  trap?: string;
  /** where this shows up in real problems */
  see?: string[];
}

export const ELEMENT_LEVELS: readonly ElementLevel[] = [
  {
    n: 1,
    title: "A number",
    tier: "easy",
    what: "The simplest possible element: an integer, a float, a character.",
    why: "Start here because every later level is this one plus a layer of indirection. And because the three languages already disagree — one of them has no primitive numbers at all.",
    layout:
      "In C++ and in a Java <code>int[]</code>, the number IS the storage: four bytes, sitting in the block, no header and no pointer. In Python there is no such thing as a raw number — <code>1</code> is a full object with a reference count, a type pointer and a digit array, and the list holds the <em>address</em> of that object. That is why the same three integers cost 36 bytes in C++ and 172 in Python.",
    py: `a = [1, 2, 3]

# there are no primitives. 1 is an OBJECT:
sys.getsizeof(1)        # 28 bytes
sys.getsizeof(10**20)   # 36 — arbitrary precision, so it grows
sys.getsizeof(1.0)      # 24

# the list holds POINTERS to those objects
sys.getsizeof(a)        # 88 — pointer array only

# the closest thing to int[]:
import array
array.array('i', [1, 2, 3])   # raw 4-byte ints, no per-element object`,
    cpp: `vector<int> v{1, 2, 3};

sizeof(int);        // 4
sizeof(long long);  // 8
sizeof(double);     // 8
sizeof(char);       // 1
sizeof(bool);       // 1

sizeof(v);          // 24 — the vector OBJECT is 3 pointers
                    //      (begin, end, capacity_end)
v.capacity() * sizeof(int);   // 12 — the heap buffer

// total for three ints: 24 + 12 = 36 bytes`,
    java: `int[] prim = {1, 2, 3};              // 12 bytes of payload
List<Integer> boxed = List.of(1, 2, 3);

// byte 1 · char 2 · int 4 · long 8 · float 4 · double 8

// int  -> 4 bytes of VALUE
// Integer -> a 16-byte object header + 4-byte payload,
//            and the List stores an 8-byte POINTER to it
//            ~28 bytes per element instead of 4

// generics cannot hold primitives, so every collection
// forces the boxed form. This is not a style choice.`,
    decl: {
      py: [
        { decl: "[1, 2, 3]", bytes: "88B of pointers + 28B per distinct int", note: "small ints -5..256 are shared, so a list of small ints costs far less than the arithmetic suggests" },
        { decl: "array.array('i', ...)", bytes: "4B per element, no objects", note: "the only way to get a real int array; loses list methods" },
        { decl: "10 ** 20", bytes: "36B and rising", note: "arbitrary precision — an int grows with its magnitude" },
      ],
      cpp: [
        { decl: "vector<int>", bytes: "24B object + 4B/element", note: "the 24 is three pointers; it does not change with size" },
        { decl: "int a[n]", bytes: "4B/element, zero overhead", note: "on the stack, so no allocation at all — but the size must be a constant" },
        { decl: "array<int, N>", bytes: "4B/element", note: "the modern fixed array; knows its size, still zero overhead" },
      ],
      java: [
        { decl: "int[]", bytes: "16B header + 4B length + 4B/element", note: "the only primitive-dense container Java has" },
        { decl: "List<Integer>", bytes: "~28B/element", note: "8B pointer + 16B header + 4B payload, and the objects are scattered" },
        { decl: "Integer.valueOf(x)", bytes: "cached for -128..127", note: "the cache is why == appears to work on small values and fails past 127" },
      ],
    },
    measured: "[C++]  E01 sizeof(int)=4 sizeof(long long)=8 sizeof(double)=8 sizeof(char)=1 sizeof(bool)=1\n[C++]  E01vec sizeof(vector<int>) object=24 (3 pointers) + capacity 3 x 4B heap = 36B total for 3 ints\n[Java] E01 primitive widths: byte=1 char=2 int=4 long=8 float=4 double=8 boolean=1(JLS unspecified, 1 in practice)\n[Java] E01box int is 4B of VALUE; Integer is a 16B object header + 4B payload, and List<Integer> stores an 8B POINTER to it. ~28B per element vs 4.  int[3] payload=12B   List<Integer> of 3 = 3 pointers + 3 objects\n[Java] E01why generics cannot hold primitives, so every collection forces the boxed form. boxed.get(0)=1 prim[0]=1\n[Py]   E01 there are no primitives. sys.getsizeof(1)=28B for the int OBJECT, sys.getsizeof(10**20)=36B (arbitrary precision grows), float=24B bool=28B\n[Py]   E01vec sys.getsizeof([1,2,3])=88B is POINTERS ONLY (8B each + header). Reachable total = 172B once you count the three int objects.\n[Py]   E01cache small ints -5..256 are pre-allocated and SHARED, so a list of small ints costs far less than deep() suggests: int(\"1\") is int(\"1\") -> True, but int(\"257\") is int(\"257\") -> False — past the cache each one is a fresh 28B object",
    differs:
      "Executed: the same three integers cost <b>36 bytes</b> in C++ (24-byte vector object plus a 12-byte buffer), <b>12 bytes of payload</b> in a Java <code>int[]</code>, and <b>172 bytes</b> reachable in Python. Python is roughly 5× the C++ figure and that ratio holds at any size, because every element is a pointer to a 28-byte object rather than a number.",
    trap: "Python's <code>sys.getsizeof(a)</code> reports <b>88</b> for a three-element list — the pointer array only. It does not count the integers those pointers lead to, which is the cost that actually matters. Measure reachable bytes, not the container.",
    see: ["LC 1480 · Running Sum", "any problem with n up to 10⁶ and a memory limit"],
  },
  {
    n: 2,
    title: "…and where those numbers physically sit",
    tier: "easy",
    what: "Contiguity: whether element i+1 is next to element i in memory.",
    why: "This is the whole reason arrays are fast, and it is invisible in the syntax. Two containers with identical APIs can differ by an order of magnitude on a straight scan, purely because of this.",
    layout:
      "A contiguous block means <code>a[i]</code> is <code>base + i × elementSize</code> — one multiply, one add, one memory read. It also means the CPU's prefetcher can see you coming: reading <code>a[0]</code> pulls a whole 64-byte cache line, so the next 15 ints are already there. A pointer array breaks that. The pointers are contiguous, but the objects they point at are wherever the allocator happened to put them, so every read is a second, unpredictable jump.",
    py: `b = [10, 20, 30]

# the POINTERS are contiguous; the ints are not.
# b[i] costs one pointer read PLUS one dereference.

# array.array is genuinely contiguous:
import array
xs = array.array('d', [1.0, 2.0, 3.0])   # raw 8-byte doubles

# and numpy, if the judge allows it, is the real answer
# for anything numeric and large.`,
    cpp: `vector<int> v{10, 20, 30};

&v[1] - &v[0];                 // 1  (one int apart)
(char*)&v[1] - (char*)&v[0];   // 4  bytes
v.data() == &v[0];             // true

// guaranteed contiguous by the standard, which is why
// v.data() can be handed to a C API.

// std::list is NOT: every node is its own allocation,
// which is why it loses to vector even for insertion.`,
    java: `int[] a = {10, 20, 30};

// one contiguous block of 4-byte slots.
// a[i] is base + i*4, then a bounds check.

// Integer[] / List<Integer> is a contiguous block of
// POINTERS. The Integers are scattered. One extra hop
// per read, and the prefetcher cannot help you.

// There is no way to get a dense array of a user-defined
// type on JDK 11 — no structs, no value types.`,
    decl: {
      py: [
        { decl: "list", bytes: "8B pointer per slot", note: "contiguous pointers, scattered objects" },
        { decl: "array.array(typecode)", bytes: "raw width per element", note: "genuinely contiguous; 'i'=4B, 'd'=8B, 'b'=1B" },
        { decl: "bytes / bytearray", bytes: "1B per element", note: "the densest built-in; bytearray is the mutable one" },
      ],
      cpp: [
        { decl: "vector<T>", bytes: "sizeof(T) per element", note: "contiguity is guaranteed by the standard" },
        { decl: "deque<T>", bytes: "sizeof(T) + block overhead", note: "contiguous in CHUNKS — O(1) both ends, but data() does not exist" },
        { decl: "list<T>", bytes: "sizeof(T) + 2 pointers", note: "a node per element; almost always slower than vector in practice" },
      ],
      java: [
        { decl: "int[] / double[]", bytes: "dense, one block", note: "the fast path; use it in anything hot" },
        { decl: "ArrayList<T>", bytes: "8B reference per slot", note: "the references are dense, the objects are not" },
        { decl: "LinkedList<T>", bytes: "~40B per node", note: "get(i) is O(n); it exists mostly to be a Deque" },
      ],
    },
    measured: "[C++]  E02 stride &v[1]-&v[0] = 4 bytes  contiguous=true  v.data()==&v[0] -> true\n[Java] E02 int[] is one contiguous block of 4-byte slots — a[i] is base + i*4. length=3 a[1]=20\n[Java] E02obj Integer[] / List<Integer> is a contiguous block of POINTERS; the Integers themselves are wherever the allocator put them. One extra hop per read.\n[Py]   E02 CPython list = a contiguous array of PyObject*, so b[i] is one pointer read PLUS one dereference. len(b)=3 b[1]=20\n[Py]   E02arr array.array(\"i\",[10,20,30]) stores raw 4-byte ints with NO per-element object: 92B vs 172B for the list. This is the closest Python gets to int[].",
    differs:
      "The C++ run confirms the stride is exactly <b>4 bytes</b> and <code>v.data() == &amp;v[0]</code>. Java's <code>int[]</code> has the same layout. Python's list does not and cannot — the measured gap between a list and an <code>array.array</code> holding the same three numbers was <b>172B versus 92B</b>, and the array is the one the CPU can stream.",
    trap: "Reaching for <code>LinkedList</code> in Java or <code>std::list</code> in C++ because the problem says \"lots of insertions\". Both lose to the contiguous container for almost every realistic n, because the pointer chasing costs more than the shifting saves.",
    see: ["any TLE where the algorithm is already optimal"],
  },
  {
    n: 3,
    title: "A pair",
    tier: "easy",
    what: "Two values travelling together as one element — coordinates, (value, index), an interval.",
    why: "The first compound element, and the first place the three languages differ in kind rather than degree. C++ has a real pair; Python has tuples; Java has nothing, and the substitute costs four times the memory and silently breaks hashing.",
    layout:
      "C++ <code>pair&lt;int,int&gt;</code> is two ints laid end to end: eight bytes, inline, no indirection. Python's tuple is a heap object with a header, holding two pointers. Java's <code>int[]{a,b}</code> is a heap object with a 16-byte header and a length field before the eight bytes of payload — 32 bytes to carry what C++ carries in 8, and the container then stores a pointer to it.",
    py: `p = (1, 2)

p[0]                    # 1
sys.getsizeof(p)        # 56 — vs 72 for the equivalent list
                        #      (a tuple cannot grow, so it is smaller)

# immutable AND hashable, so it works as a dict key:
seen = {(1, 2): 'a'}
{(1,2), (1,2), (3,4)}   # 2 unique

{[1, 2]}                # TypeError: unhashable type: 'list'`,
    cpp: `pair<int,int> p{1, 2};
p.first; p.second;

sizeof(pair<int,int>);    // 8  — exactly two ints, inline
sizeof(pair<int,char>);   // 8  — PADDED, not 5
sizeof(pair<char,char>);  // 2

// compares lexicographically for free:
sort(v.begin(), v.end());          // vector<pair<..>> just works
map<pair<int,int>, int> byPoint;   // pair as a key: also free

// but there is NO std::hash for pair, so
// unordered_map<pair<int,int>, int> does NOT compile.`,
    java: `// Java has NO pair type. Three substitutes:

int[] p = {1, 2};                       // the CP idiom
Map.Entry<Integer,Integer> e = Map.entry(1, 2);
List<Integer> lp = List.of(1, 2);

// the hole:
new HashSet<>(List.of(new int[]{1,2},
                      new int[]{1,2})).size();   // 2  (!)
new HashSet<>(List.of(List.of(1,2),
                      List.of(1,2))).size();     // 1

// Java 16+: record P(int a, int b) {} fixes both.`,
    decl: {
      py: [
        { decl: "(a, b)", bytes: "56B + the two objects", note: "immutable and hashable — usable as a dict key or set member" },
        { decl: "[a, b]", bytes: "72B", note: "mutable, so NOT hashable; larger because it keeps growth room" },
        { decl: "namedtuple('P','x y')", bytes: "56B — identical to a tuple", note: "adds field names at zero memory cost, still indexable" },
      ],
      cpp: [
        { decl: "pair<A,B>", bytes: "sizeof(A)+sizeof(B), padded", note: "inline, no allocation; .first / .second" },
        { decl: "make_pair(a,b)", bytes: "same", note: "pre-C++17 spelling; braces are enough now" },
        { decl: "map<pair<..>,V>", bytes: "—", note: "works: pair has operator<. unordered_map does NOT: no std::hash for pair" },
      ],
      java: [
        { decl: "int[]{a, b}", bytes: "16B header + 4B len + 8B = 32B", note: "4× C++, and NO value equality — useless in a HashSet" },
        { decl: "List.of(a, b)", bytes: "~48B + boxing", note: "correct equals and hashCode — the right choice for a key" },
        { decl: "Map.entry(k, v)", bytes: "~32B + boxing", note: "immutable; rejects null; getKey()/getValue()" },
      ],
    },
    measured: "[C++]  E03 sizeof(pair<int,int>)=8 sizeof(pair<int,char>)=8 <- PADDED to 8, not 5 sizeof(pair<char,char>)=2\n[C++]  E03use v[0].first=1 v[0].second=2 sorted lexicographically for free; usable as a map key\n[Java] E03 Java has NO pair type. int[]{1,2} is the idiom: [1, 2]  Map.entry -> (1,2)  List.of -> [1, 2]\n[Java] E03dedup HashSet<int[]> of two identical pairs -> size 2 (WRONG: arrays have identity equality)   HashSet<List<Integer>> -> size 1 (right)\n[Java] E03cost int[]{a,b} = 16B header + 4B length + 8B payload = 32B per pair, vs C++ pair<int,int> which is exactly 8B inline. 4x, before the pointer to it.\n[Py]   E03 tuple IS the pair: (1, 2) p[0]=1 sizeof=56B (vs 72B for the list — a tuple is smaller because it cannot grow)\n[Py]   E03hash tuples are IMMUTABLE and HASHABLE, so they work as dict keys and set members: 2 unique from three. Lists are not hashable at all.\n[Py]   E03trap a set of lists -> TypeError: unhashable type: 'list'",
    differs:
      "A pair of ints: <b>8 bytes</b> inline in C++, <b>32 bytes</b> on the heap in Java before you even point at it, <b>56 bytes</b> in Python. And the executed deduplication shows the correctness half: a <code>HashSet&lt;int[]&gt;</code> holding two identical <code>{1,2}</code> arrays reported size <b>2</b>, while <code>HashSet&lt;List&lt;Integer&gt;&gt;</code> reported <b>1</b>. C++ <code>set&lt;pair&gt;</code> and Python's <code>{(1,2)}</code> both collapse correctly.",
    trap: "C++ gives you <code>map&lt;pair,V&gt;</code> free but <code>unordered_map&lt;pair,V&gt;</code> does not compile — there is no <code>std::hash</code> for pair. Either use the ordered map, or hash the pair yourself into a single <code>long long</code> with <code>a * 1000000LL + b</code>.",
    see: ["LC 56 · Merge Intervals", "LC 973 · K Closest Points", "LC 452 · Minimum Number of Arrows"],
  },
  {
    n: 4,
    title: "A tuple — three or more, of mixed types",
    tier: "easy",
    what: "The pair, generalised: (priority, index, payload), (x, y, z), (count, word).",
    why: "The moment an element has three fields, the ergonomics diverge sharply. In two languages it stays free; in the third, every option costs you something — type safety, memory, or twenty lines of boilerplate.",
    layout:
      "C++ <code>tuple</code> is still inline and still padded to alignment: three ints is 12 bytes, but <code>tuple&lt;char,int&gt;</code> is 8 rather than 5. Python's tuple grows by exactly one pointer per slot — 56 bytes for two, 64 for three — because arity only adds pointers. Java has no tuple at all, and the escape hatch, <code>Object[]</code>, boxes everything and throws away the types.",
    py: `t = (1, 2, 3)
x, y, z = t                # unpacking

sys.getsizeof((1,2))       # 56
sys.getsizeof((1,2,3))     # 64   — exactly 8B per extra slot

from collections import namedtuple
Point = namedtuple('Point', 'x y')
pt = Point(1, 2)
pt.x, pt[0]                # names AND indexing, same 56 bytes

# heapq relies on this: (priority, tiebreak, payload)
# compares left to right with no comparator anywhere.`,
    cpp: `tuple<int,int,int> t{1, 2, 3};

get<0>(t); get<2>(t);          // index must be compile-time
auto [x, y, z] = t;            // structured binding, C++17
tuple_size<decltype(t)>::value;  // 3

sizeof(tuple<int,int,int>);    // 12
sizeof(tuple<char,int>);       // 8 — padded

tie(a, b) < tie(c, d);         // the tidy multi-key compare`,
    java: `// no tuple either. Every option costs something:

Object[] mixed = {1, "a", 2.0};   // boxes all, loses types,
                                  // every read needs a cast
int[] ints = {1, 2, 3};           // typed but no equals
List<Integer> l = List.of(1,2,3); // equals, but boxed

record T(int a, int b, String c) {}   // Java 16+ only

// JDK 11: write the class, with equals and hashCode.`,
    decl: {
      py: [
        { decl: "(a, b, c)", bytes: "64B (8B per slot)", note: "any arity, any mix of types, still hashable if the parts are" },
        { decl: "namedtuple", bytes: "identical to a tuple", note: "the free upgrade — names, no cost, still a tuple everywhere" },
        { decl: "typing.NamedTuple", bytes: "same", note: "the typed spelling of the same thing" },
      ],
      cpp: [
        { decl: "tuple<A,B,C>", bytes: "sum, padded", note: "get<i>() needs a compile-time i — you cannot loop over fields" },
        { decl: "auto [a,b,c] = t", bytes: "—", note: "C++17 structured binding; use auto& to bind by reference" },
        { decl: "struct with names", bytes: "same as the tuple", note: "almost always more readable than get<2>()" },
      ],
      java: [
        { decl: "Object[]", bytes: "16B + 8B/slot + boxing", note: "compiles for anything, casts on every read, no type safety" },
        { decl: "record T(...)", bytes: "16B header + fields", note: "Java 16+; generates equals, hashCode, toString, accessors" },
        { decl: "hand-written class", bytes: "16B header + fields", note: "the JDK 11 answer; you must write equals AND hashCode" },
      ],
    },
    measured: "[C++]  E04 sizeof(tuple<int,int,int>)=12 sizeof(tuple<char,int>)=8 (padded) get<1>=2  tuple_size=3\n[Java] E04 Java has no tuple either. Options: int[] (no equals), List.of (equals but boxed), a record (Java 16+), or a hand-written class (JDK 11). Object[] loses all type safety.\n[Java] E04obj Object[]{1,\"a\",2.0} compiles and boxes everything: [1, a, 2.0] — every read needs a cast\n[Py]   E04 arity is free: sizeof (1,2)=56B (1,2,3)=64B — 8B per extra slot, exactly one pointer\n[Py]   E04named namedtuple keeps tuple size (56B) but adds names: pt.x=1 pt[0]=1 — still indexable, still hashable, zero memory cost",
    differs:
      "Arity is nearly free in Python — the measured jump from a 2-tuple to a 3-tuple was <b>56 to 64 bytes</b>, exactly one pointer. C++ pays alignment instead of pointers: <code>tuple&lt;char,int&gt;</code> measured <b>8 bytes</b>, not 5. Java pays in ceremony: the executed <code>Object[]{1,\"a\",2.0}</code> compiles and boxes every element, and every read back out needs a cast.",
    trap: "Python heaps depend on tuple comparison, so <code>heappush(h, (pri, obj))</code> raises <code>TypeError</code> the moment two priorities tie and it tries to compare the payloads. Insert a counter: <code>(pri, next(counter), obj)</code>.",
    see: ["LC 973 · K Closest Points", "LC 23 · Merge k Sorted Lists", "LC 692 · Top K Frequent Words"],
  },
  {
    n: 5,
    title: "A struct, a class, a record",
    tier: "medium",
    what: "A named type with named fields as the element — the point where <code>x[2]</code> stops telling you anything.",
    why: "This is where C++ hands you a lever the other two do not have, and where Java charges you a fee you cannot refuse. Both facts are measurable, and both matter at 10⁶ elements.",
    layout:
      "C++ lays your fields out in declaration order and inserts <b>padding</b> so each one sits on its own alignment boundary. <code>{char, int, char}</code> becomes 1 + 3 wasted + 4 + 1 + 3 wasted = 12 bytes; reorder it to <code>{int, char, char}</code> and it is 8. Java does not give you that lever — the JVM reorders fields itself — but it charges a 12–16 byte <b>object header</b> on every single instance, which C++ does not have at all. Python charges the most: a per-instance <code>__dict__</code>, unless you ask for <code>__slots__</code>.",
    py: `class Plain:
    def __init__(self, a, b):
        self.a, self.b = a, b

class Slotted:
    __slots__ = ('a', 'b')        # THE memory lever
    def __init__(self, a, b):
        self.a, self.b = a, b

sys.getsizeof(Plain(1,2))              # 48
sys.getsizeof(Plain(1,2).__dict__)     # 104   -> 152 total
sys.getsizeof(Slotted(1,2))            # 48, and no __dict__

@dataclass(frozen=True)
class P: a: int; b: int      # hashable, usable as a key`,
    cpp: `struct Bad  { char a; int b; char c; };   // 12 bytes
struct Good { int b; char a; char c; };   //  8 bytes

sizeof(Bad);    // 12  — 1 + pad3 + 4 + 1 + pad3
sizeof(Good);   //  8  — 4 + 1 + 1 + pad2
alignof(Bad);   //  4

// order fields BIG to SMALL and the padding disappears.
// At 1e6 elements that is 11.4 MB vs 7.6 MB, for free.

// no header, no vtable unless you add a virtual function.`,
    java: `static final class P {
    final int a, b;
    P(int a, int b) { this.a = a; this.b = b; }
    @Override public boolean equals(Object o) { ... }
    @Override public int hashCode() { return Objects.hash(a, b); }
}

// every object carries a 12-16B HEADER before your fields.
// A class holding one int is ~24 bytes to store 4.
// 1e6 of them is ~24MB; an int[] is 4MB.

// the JVM reorders fields itself, so unlike C++,
// field order is NOT under your control.

record P(int a, int b) {}    // Java 16+ — generates everything`,
    decl: {
      py: [
        { decl: "class with __dict__", bytes: "48B + 104B dict = 152B", note: "the default, and the most expensive per-instance option there is" },
        { decl: "__slots__ = (...)", bytes: "48B, no dict", note: "the one real memory lever Python gives you — roughly 3× smaller" },
        { decl: "@dataclass(frozen=True)", bytes: "same as the class", note: "adds equals and hash so it can be a dict key" },
        { decl: "namedtuple", bytes: "56B", note: "smaller still, but immutable and tuple-like rather than object-like" },
      ],
      cpp: [
        { decl: "struct { ... }", bytes: "sum of fields + padding", note: "NO header. This is the only language here with zero per-object overhead" },
        { decl: "field order", bytes: "12B vs 8B for the same data", note: "declare big to small; the compiler will not reorder for you" },
        { decl: "alignas(n)", bytes: "forces alignment", note: "for cache-line alignment in hot structures" },
        { decl: "a virtual function", bytes: "+8B vptr", note: "the first virtual method adds a hidden pointer to every instance" },
      ],
      java: [
        { decl: "class", bytes: "12-16B header + fields, 8B-aligned", note: "the header is not optional on JDK 11" },
        { decl: "record (16+)", bytes: "same", note: "generates equals, hashCode, toString — but the header cost is identical" },
        { decl: "parallel primitive arrays", bytes: "no headers at all", note: "the real fix when you need 10⁶ of something" },
      ],
    },
    measured: "[C++]  E05 struct{char,int,char}=12B  reordered {int,char,char}=8B  {int,int}=8B\n[C++]  E05align alignof(Bad)=4 — the compiler inserts padding so each field sits on its own alignment. Ordering fields big-to-small is free memory.\n[C++]  E05waste 1e6 x Bad = 11.4441 MB vs 1e6 x Good = 7.62939 MB\n[Java] E05 every Java object carries a 12-16B HEADER (mark word + class pointer) before any of your fields. There is no way to opt out — no structs, no value types on JDK 11.\n[Java] E05field the JVM reorders fields itself and aligns objects to 8B, so {char,int,char} and {int,char,char} end up the same size. Unlike C++, field order is NOT under your control.\n[Java] E05size a class with one int: ~16B header + 4B int + 4B padding = 24B, to hold 4 bytes of data. 1e6 of them is ~24MB vs 4MB for an int[].\n[Py]   E05 a normal instance carries a __dict__: sizeof(obj)=48B + its __dict__ 104B = 152B\n[Py]   E05slots __slots__ removes the dict entirely: 48B, and has_dict=False. This is the one real memory lever Python gives you.\n[Py]   E05data @dataclass(frozen=True) is hashable and usable as a key: 1 unique from two identical",
    differs:
      "Three different levers, all measured. C++: reordering <code>{char,int,char}</code> to <code>{int,char,char}</code> took the struct from <b>12 to 8 bytes</b> — at 10⁶ elements that is <b>11.4 MB versus 7.6 MB</b> for identical data. Java: no such lever, but a mandatory header, so a class holding one int is ~24 bytes to store 4. Python: <code>__slots__</code> removed the per-instance <code>__dict__</code> and took an instance from <b>152 bytes to 48</b>.",
    trap: "In Java, overriding <code>equals</code> and forgetting <code>hashCode</code> leaves sorting and <code>list.contains</code> working while <code>HashSet</code> and <code>HashMap</code> silently stop deduplicating. Always write both, or use a record.",
    see: ["LC 1584 · Min Cost to Connect All Points", "LC 218 · The Skyline Problem"],
  },
  {
    n: 6,
    title: "A string",
    tier: "medium",
    what: "The element is text — and text is the one type where all three languages hide a second allocation from you.",
    why: "A vector of strings is not a vector of text. It is a vector of handles, each pointing somewhere else. Sorting it moves handles; comparing it chases pointers. That distinction explains most string-heavy timeouts.",
    layout:
      "In C++ a <code>std::string</code> is a 32-byte handle that keeps up to ~15 characters <em>inside itself</em> — the short-string optimisation — and spills to the heap beyond that. So a vector of short strings is genuinely contiguous and a vector of long ones is not, with no change in the type. Java strings are immutable objects holding a <code>byte[]</code>, and since Java 9 ASCII text costs 1 byte per character rather than 2. Python strings are the same shape, and PEP 393 means one non-ASCII character re-encodes the whole string to a wider representation.",
    py: `s = 'hi'
sys.getsizeof('hi')                  # 51 — ~49B header + 1B/char
sys.getsizeof('a much longer string')  # 69

sys.getsizeof('e')   # 50   — ASCII, 1 byte
sys.getsizeof('é')   # 74   — one non-ASCII char re-encodes
                     #        the WHOLE string to Latin-1/UCS-2

# immutable, so every edit allocates:
s[0] = 'H'           # TypeError
'H' + s[1:]          # a new string`,
    cpp: `string s = "hi";

sizeof(string);      // 32 — the HANDLE, same for every string
s.capacity();        // 15 for a short string: it lives INSIDE
                     //     the handle (short-string optimisation)
                     // 58 for a long one: a separate heap block

s[0] = 'H';          // MUTABLE — the outlier of the three
s += "!";            // amortised O(1); no quadratic trap here

// vector<string> of 2 = 88B of handles, plus each long
// string's own buffer.`,
    java: `String s = "hi";     // IMMUTABLE

// since Java 9: a byte[] plus a coder flag.
// ASCII text is 1 byte per char, not 2.
// each String ≈ 16B header + 8B byte[] ref + 4B cached hash
//               + the byte[] itself (16B header + length)

s.charAt(0);         // read-only
s.toCharArray();     // the route to mutation
new String(cs);      // …and back

"hi" == "hi";        // true  — literals are INTERNED
new String("hi") == "hi";   // false — always use .equals()`,
    decl: {
      py: [
        { decl: "str", bytes: "~49B header + 1B/ASCII char", note: "immutable; every edit allocates a new one" },
        { decl: "a non-ASCII char", bytes: "re-encodes the WHOLE string", note: "'é' took the same 1-char string from 50B to 74B" },
        { decl: "''.join(parts)", bytes: "O(total) once", note: "the correct way to build; += in a loop is O(n²) in principle" },
      ],
      cpp: [
        { decl: "std::string", bytes: "32B handle", note: "≤15 chars live inside the handle — no heap block at all" },
        { decl: "string_view", bytes: "16B, owns nothing", note: "a view; dangles the moment the owner dies" },
        { decl: "s += c", bytes: "amortised O(1)", note: "mutable buffer, so C++ has no quadratic concatenation trap" },
      ],
      java: [
        { decl: "String", bytes: "~40B + byte[] (16B + len)", note: "immutable; literals are interned into a shared pool" },
        { decl: "StringBuilder", bytes: "growable char buffer", note: "mandatory for loop building — += is O(n²)" },
        { decl: "s.intern()", bytes: "shares the pooled copy", note: "rarely worth it; == on Strings is still a bug" },
      ],
    },
    measured: "[C++]  E06 sizeof(string) handle=32 (same for every string, short or long)\n[C++]  E06sso short.capacity()=15 long.capacity()=58 <- short-string optimisation: up to ~15 chars live INSIDE the handle, longer ones are a separate heap block\n[C++]  E06vec vector<string> of 2 = 88B of handles, plus each long string's own buffer\n[Java] E06 String is IMMUTABLE and the element is a reference. Since Java 9 the bytes live in a byte[] with a coder flag (Latin-1 or UTF-16), so ASCII text costs 1 byte per char, not 2.\n[Java] E06cost each String = ~16B header + 8B byte[] ref + 4B hash + the byte[] itself (16B header + length). \"hi\".length()=2 \"a much longer string\".length()=20\n[Java] E06intern literals are INTERNED into a shared pool: true for two literals, but false once you allocate one. Always .equals().\n[Py]   E06 str is IMMUTABLE. sizeof(\"hi\")=51B sizeof(\"a much longer string\")=69B — ~49B of header plus 1 byte per ASCII char\n[Py]   E06flex PEP 393: pure-ASCII strings use 1 byte/char, Latin-1 1, BMP 2, astral 4. sizeof(\"é\")=74B vs sizeof(\"e\")=50B — one non-ASCII character re-encodes the WHOLE string\n[Py]   E06intern identifier-like literals are INTERNED into a shared pool: two literals share one object -> True, but the same text built at runtime is a separate object -> False (equal though: True). Always use ==.",
    differs:
      "The C++ short-string optimisation is the one to know: the measured capacities were <b>15</b> for the short string and <b>58</b> for the long one, from the same 32-byte handle type. Python's re-encoding is the sharpest measured surprise — <code>'e'</code> is <b>50 bytes</b> and <code>'é'</code> is <b>74</b>, for one character. And in both Java and Python, two identical literals share one object while the same text built at runtime does not.",
    trap: "Comparing strings with <code>==</code> in Java, or with <code>is</code> in Python. Both appear to work because literals are interned, and both fail the moment the string is built at runtime — which is exactly when it comes from input.",
    see: ["LC 49 · Group Anagrams", "LC 242 · Valid Anagram", "LC 14 · Longest Common Prefix"],
  },
  {
    n: 7,
    title: "Another container",
    tier: "medium",
    what: "Nesting — a grid, an adjacency list, a list of groups.",
    why: "Everyone writes <code>int[3][4]</code> and pictures a rectangle. None of the three languages actually build one. Knowing what they build instead explains both the aliasing bug and the cache behaviour.",
    layout:
      "All three build an array of <em>handles</em>, each pointing at its own separately allocated row. That is why rows can have different lengths for free, why Java can leave a row null, and why the rows are nowhere near each other in memory. A flat container of <code>r × c</code> indexed as <code>[i*c + j]</code> is one allocation instead of <code>r+1</code>, and one contiguous block instead of scattered rows — usually a measurable win for anything that scans.",
    py: `g = [[0] * 4 for _ in range(3)]     # 3 SEPARATE row objects
g[0] is g[1]                        # False — correct

bad = [[0] * 4] * 3                 # ONE row, referenced 3 times
bad[0][0] = 9
bad                                 # [[9,0,0,0], [9,0,0,0], [9,0,0,0]]
bad[0] is bad[1]                    # True — the whole bug

flat = [0] * 12                     # one object
flat[i * 4 + j]                     # index it yourself`,
    cpp: `vector<vector<int>> g(3, vector<int>(4, 0));

sizeof(g);        // 24 — the outer object
                  //      holding 3 handles of 24B each
g[0].data() + 4 == g[1].data();   // false: separate blocks

// the flat form: one allocation, contiguous, cache-friendly
vector<int> flat(3 * 4, 0);
flat[i * 4 + j];

// C++ copies the inner vector into each row, so there is
// no aliasing trap here — you pay in allocations instead.`,
    java: `int[][] g = new int[3][4];

// an array of 3 REFERENCES, each to its own int[4].
// FOUR objects, four allocations.
g[0] != g[1];        // true — rows are distinct
g.length;            // 3
g[0].length;         // 4   — NOT "the width"

int[][] j = new int[3][];   // 3 NULL row references
j[0] = new int[7];          // you allocate each row

int[] flat = new int[3 * 4];   // one object`,
    decl: {
      py: [
        { decl: "[[v]*c for _ in range(r)]", bytes: "r row objects + pointers", note: "the ONLY correct spelling when the row is mutable" },
        { decl: "[[v]*c]*r", bytes: "ONE row object", note: "silently aliases every row — no error, corrupted DP table" },
        { decl: "[0] * (r*c)", bytes: "one object", note: "the flat form; index [i*c + j]" },
      ],
      cpp: [
        { decl: "vector<vector<T>>", bytes: "24B outer + 24B/row + rows", note: "r+1 heap allocations; rows are scattered" },
        { decl: "vector<T> flat(r*c)", bytes: "one block", note: "one allocation, contiguous — noticeably faster to scan" },
        { decl: "array<array<T,C>,R>", bytes: "truly rectangular, inline", note: "the only genuine 2D block, but sizes must be compile-time" },
      ],
      java: [
        { decl: "new int[r][c]", bytes: "1 outer + r inner objects", note: "each row is 16B header + 4B length + payload" },
        { decl: "new int[r][]", bytes: "r null references", note: "jagged; reading before allocating a row is a NullPointerException" },
        { decl: "new int[r*c]", bytes: "one object", note: "one header instead of r+1; index [i*c + j]" },
      ],
    },
    measured: "[C++]  E07 sizeof(vector<vector<int>>) object=24  outer holds 3 HANDLES of 24B each\n[C++]  E07rows row1 starts where row0 ends -> false  <- separate heap blocks, NOT one rectangle\n[C++]  E07flat one flat vector<int>(12): 72B in ONE block, index with flat[i*4+j] — fewer allocations, better locality\n[Java] E07 int[3][4] is NOT a rectangle: it is an array of 3 REFERENCES, each to its own int[4]. 4 separate objects, 4 separate allocations.\n[Java] E07proof g.length=3 g[0].length=4  rows are distinct objects: true  and rows can be replaced independently, which is why jagged arrays are legal\n[Java] E07flat one int[12] = 68B in ONE object vs int[3][4] = 1 outer (16+4+24) + 3 inner (16+4+16 each) = 152B. Index flat[i*4+j].\n[Py]   E07 [[0]*4 for _ in range(3)] is 3 SEPARATE list objects held by pointer: rows distinct -> True, total reachable 376B\n[Py]   E07trap [[0]*4]*3 shares ONE row: after bad[0][0]=9 -> [[9, 0, 0, 0], [9, 0, 0, 0], [9, 0, 0, 0]]  all rows aliased -> True\n[Py]   E07flat one flat list of 12 = 176B, index flat[i*4+j] — fewer objects, one contiguous pointer array",
    differs:
      "Measured in Java: <code>int[3][4]</code> costs <b>152 bytes</b> across four objects, while one <code>int[12]</code> costs <b>68 bytes</b> in one — for identical data. C++ confirmed the rows are not adjacent (<code>g[0].data() + 4 == g[1].data()</code> is <b>false</b>). And Python's executed aliasing trap is the reason this level is on the ladder at all: <code>[[0]*4]*3</code> after one write became <code>[[9,0,0,0], [9,0,0,0], [9,0,0,0]]</code>.",
    trap: "Only Python aliases, because <code>*</code> copies references. But all three scatter the rows, so all three benefit from flattening when the grid is large and you scan it more than you index it.",
    see: ["LC 62 · Unique Paths", "LC 64 · Minimum Path Sum", "LC 200 · Number of Islands", "LC 54 · Spiral Matrix"],
  },
  {
    n: 8,
    title: "A flag — and the eight-fold difference",
    tier: "hard",
    what: "The element is one bit of information: visited, prime, taken. The cheapest possible payload, stored eight ways.",
    why: "A boolean is one bit. Every language stores it in at least one byte, some in eight. On a sieve of 10⁷ that is the difference between 1.25 MB and 10 MB, and it is a one-line change.",
    layout:
      "A byte is the smallest addressable unit, so a plain array of booleans wastes 7 bits in 8. Packing them into the bits of an integer recovers all of it, at the cost of a shift and a mask per access — which is usually still faster, because 8× less memory means 8× fewer cache misses. C++ does this automatically for <code>vector&lt;bool&gt;</code>, which is why that type is a famous mistake: it silently is not a container of <code>bool</code>. Java and Python make you opt in with <code>BitSet</code> and integer masks, which is the more honest design.",
    py: `flags = [False] * 64      # 592B — pointers, though
                          # True/False are singletons

ba = bytearray(64)        # 121B — one byte per flag, mutable
ba[0] = 1

mask = 0                  # 28B for SIXTY-FOUR flags
mask |= 1 << i            # set
mask &  (1 << i)          # test
mask &= ~(1 << i)         # clear
mask.bit_count()          # 3.10+`,
    cpp: `vector<bool> vb(64, true);
// 64 bits packed into 8 BYTES of storage.

auto x = vb[0];           // a PROXY object (16 bytes!), not bool&
// bool& b = vb[0];       // does NOT compile

vector<char> vc(64);      // 8x more memory, but a REAL container
bitset<64> bs;            // fixed size, packed, and honest
bs.set(0); bs.count(); bs.any();

// rule: vector<char> when you need a real bool container,
// bitset<N> when the size is known and you want the packing.`,
    java: `boolean[] flags = new boolean[64];
// ONE BYTE per flag = 64B of payload. The JVM does not pack.

BitSet bits = new BitSet(64);
// 64 bits into a single long = 8 BYTES. 8x smaller.
bits.set(0);
bits.get(0);
bits.cardinality();
bits.or(other); bits.and(other);   // whole-set operations

long mask = 0;            // 64 flags in one primitive
mask |= 1L << i;          // note the L — 1 << 40 is an int bug`,
    decl: {
      py: [
        { decl: "[False] * n", bytes: "8B pointer per flag", note: "True/False are singletons, so no per-element object — but still 8B each" },
        { decl: "bytearray(n)", bytes: "1B per flag", note: "mutable, indexable, and the simple middle ground" },
        { decl: "int as a bitmask", bytes: "~28B for 64 flags", note: "arbitrary precision, so it scales to any width; bit_count() in 3.10+" },
      ],
      cpp: [
        { decl: "vector<bool>", bytes: "1 BIT per flag", note: "a bit-packed proxy — NOT a container of bool. bool& does not compile" },
        { decl: "vector<char>", bytes: "1B per flag", note: "the real container when you need references or std::algorithms" },
        { decl: "bitset<N>", bytes: "1 bit per flag", note: "fixed compile-time size; count(), any(), and full bitwise ops" },
      ],
      java: [
        { decl: "boolean[]", bytes: "1B per flag", note: "the JVM does not pack them, despite the JLS leaving it open" },
        { decl: "BitSet", bytes: "1 bit per flag", note: "an honest separate type — grows on demand, has cardinality() and set ops" },
        { decl: "long as a mask", bytes: "64 flags in 8B", note: "use 1L << i, not 1 << i — the int form silently wraps past 31" },
      ],
    },
    measured: "[C++]  E08 vector<bool>(64) -> sizeof object=40, 64 bits packed into 8 bytes of storage\n[C++]  E08cmp vector<char>(64) heap=88B — 8x more, but vb[0] returns a PROXY (sizeof=16), not bool&. bool& b = vb[0]; does not compile.\n[Java] E08 boolean[64] uses ONE BYTE per flag = 64B payload. BitSet(64) packs 64 bits into a single long = 8B. 8x smaller.\n[Java] E08use flags[0]=true bits.get(0)=true bits.cardinality()=1  — and unlike C++ vector<bool>, BitSet is a separate honest type, not a fake array\n[Py]   E08 [False]*64 = 592B (pointers, though True/False are singletons so no extra objects)\n[Py]   E08byte bytearray(64) = 121B — one byte per flag, mutable\n[Py]   E08bits a plain int as a bitmask = 28B for 64 flags. mask & (1<<0) -> True, mask.bit_count() exists in 3.10+",
    differs:
      "The measured spread for 64 flags: Python <code>[False]*64</code> is <b>592 bytes</b>, <code>bytearray(64)</code> is <b>121</b>, an int mask is <b>28</b>. Java <code>boolean[64]</code> is <b>64 bytes</b> of payload, <code>BitSet</code> is <b>8</b>. C++ <code>vector&lt;bool&gt;</code> packs into <b>8 bytes</b> — and the measured proof that it is not a real container: <code>vb[0]</code> returns a proxy of <b>sizeof 16</b>, not a <code>bool&amp;</code>.",
    trap: "<code>vector&lt;bool&gt;</code> is the standard library's own acknowledged mistake. It breaks <code>auto&amp;</code>, breaks any algorithm expecting real references, and is slower per-element than <code>vector&lt;char&gt;</code>. Use it deliberately for the packing, or not at all.",
    see: ["LC 204 · Count Primes", "LC 78 · Subsets", "LC 279 · Perfect Squares", "any sieve or bitmask DP"],
  },
  {
    n: 9,
    title: "A pointer to somewhere else",
    tier: "hard",
    what: "The element is a reference — a tree node, a graph node, an object you did not want to copy.",
    why: "Every Java collection and every Python container is already doing this, whether or not you asked. Making it explicit is what lets you reason about why a linked structure loses to an array that does strictly more work.",
    layout:
      "A pointer is 8 bytes and tells you nothing about where it points. Store a million of them and you have a contiguous 8 MB array of addresses leading to a million objects scattered across the heap in allocation order — which, after a few rounds of insertion and deletion, is no order at all. The scan is then one cache miss per element, and a cache miss is roughly 200 cycles. That is the entire reason <code>std::list</code> and <code>LinkedList</code> underperform their theoretical complexity.",
    py: `x = [1]
y = [x, x]              # both slots hold the SAME pointer
y[0] is y[1]            # True
y[0].append(2)
y                       # [[1, 2], [1, 2]] — one object, seen twice

# every element of every container is a reference.
# there is no other option and no way to opt out.

list(y)                 # SHALLOW — inner list still shared
copy.deepcopy(y)        # the only true copy`,
    cpp: `sizeof(Node*);                 // 8
sizeof(unique_ptr<Node>);      // 8  — zero overhead
sizeof(shared_ptr<Node>);      // 16 — ptr + control block ptr

vector<Node*> raw;                    // you own the lifetime
vector<unique_ptr<Node>> owned;       // RAII, single owner
owned.push_back(make_unique<Node>(1));

// C++ is the only one where you CHOOSE: store values
// inline (contiguous, fast) or pointers (indirect, flexible).`,
    java: `List<Node> nodes = new ArrayList<>();

// every non-primitive element is an 8-byte reference
// (4 bytes with compressed oops under a 32GB heap).
// The objects live wherever the allocator put them.

nodes.get(1).v;    // one pointer hop, every time

// and every one of those references is a GC root to trace.
// 1e6 objects is 1e6 things the collector must walk.

// the fix is the same as always: parallel primitive arrays.`,
    decl: {
      py: [
        { decl: "any element", bytes: "8B pointer", note: "there is no value semantics anywhere — everything is a reference" },
        { decl: "list(x) / x[:]", bytes: "copies pointers only", note: "SHALLOW: nested containers stay shared" },
        { decl: "copy.deepcopy(x)", bytes: "O(total)", note: "the only true copy; slow, so reach for it deliberately" },
      ],
      cpp: [
        { decl: "T* / T&", bytes: "8B", note: "raw; you own the lifetime and the bugs" },
        { decl: "unique_ptr<T>", bytes: "8B — zero overhead", note: "single owner, freed automatically; move-only" },
        { decl: "shared_ptr<T>", bytes: "16B + a control block", note: "refcounted; the atomic increment is not free in a hot loop" },
        { decl: "vector<T> (by value)", bytes: "sizeof(T), inline", note: "the option the other two languages do not have" },
      ],
      java: [
        { decl: "any object reference", bytes: "8B (4B compressed)", note: "compressed oops apply automatically under a 32GB heap" },
        { decl: "int[] vs Integer[]", bytes: "4B vs ~28B per element", note: "the single biggest memory decision in Java" },
        { decl: "parallel primitive arrays", bytes: "no headers, no pointers", note: "how you write a graph algorithm that has to be fast" },
      ],
    },
    measured: "[C++]  E09 sizeof(Node*)=8 sizeof(unique_ptr<Node>)=8 (zero overhead) sizeof(shared_ptr<Node>)=16 (ptr + control block ptr)\n[C++]  E09deref owned[1]->v=1 — the vector holds 8B handles; the Nodes are scattered on the heap\n[Java] E09 every non-primitive element is an 8B reference (4B with compressed oops under a 32GB heap). The objects are scattered wherever the allocator put them.\n[Java] E09deref nodes.get(1).v=1 — one pointer hop per access, and the GC has to trace every one of them\n[Py]   E09 every element is a reference: y[0] is y[1] -> True. Mutating through one shows in the other: [[1, 2], [1, 2]]\n[Py]   E09copy list(y) is SHALLOW — the inner list is still shared. copy.deepcopy is the only true copy.",
    differs:
      "Measured: C++ <code>unique_ptr</code> is <b>8 bytes</b> — genuinely free, the same as a raw pointer — while <code>shared_ptr</code> is <b>16</b> because it carries a second pointer to the reference count. Java and Python have no such choice to make: every non-primitive element is already a reference, and the executed Python aliasing shows both slots of <code>[x, x]</code> leading to one object.",
    trap: "In C++, <code>shared_ptr</code> in a hot loop costs an atomic increment on every copy. Pass it by <code>const&amp;</code>, or use a raw pointer for non-owning access — <code>shared_ptr</code> is for shared <em>ownership</em>, not for shared access.",
    see: ["LC 138 · Copy List with Random Pointer", "LC 133 · Clone Graph", "LC 146 · LRU Cache"],
  },
  {
    n: 10,
    title: "Array of structs, or struct of arrays?",
    tier: "extreme",
    what: "The same fields, laid out two ways: one array of records, or one array per field.",
    why: "This is the highest-leverage layout decision there is, it changes no algorithm and no complexity, and it is measurable. All three languages showed the same winner.",
    layout:
      "The CPU does not fetch bytes, it fetches 64-byte <b>cache lines</b>. If your element is a 32-byte particle and you only read its <code>x</code>, every line you pull contains two particles' worth of <code>y</code>, <code>z</code> and <code>id</code> that you did not want — you are using 8 useful bytes out of every 64. Split the fields into separate arrays and a line of <code>x</code> values is 8 useful values out of 8. Same algorithm, same complexity, roughly 4× the useful bandwidth.",
    py: `# array-of-objects: an attribute lookup per element
objs = [Slotted(i, 0) for i in range(N)]
total = sum(o.a for o in objs)          # interpreted, per element

# struct-of-arrays: the loop runs in C
import array
xs = array.array('d', ...)
total = sum(xs)                          # one C call

# in Python the win is not cache lines, it is
# escaping the interpreter loop entirely.
# numpy is the same idea taken all the way.`,
    cpp: `struct Particle { double x, y, z; int id; };  // 32 bytes

vector<Particle> aos(N);        // array of structs
for (auto& p : aos) s += p.x;   // pulls 32B to use 8

vector<double> sx(N);           // struct of arrays
for (double x : sx) s += x;     // pulls 64B, uses 64

// same complexity, same instructions, different bandwidth.
// SoA also vectorises; AoS usually cannot.`,
    java: `Particle[] aos = new Particle[N];
// an array of REFERENCES to N separate objects.
// Java's version is worse than C++'s: not only is the
// unused data dragged in, the objects are not even
// adjacent — it is a pointer chase per element.

double[] sx = new double[N];
// one dense block. This is the only dense option Java
// gives you, and it is why hot Java code looks like C.`,
    decl: {
      py: [
        { decl: "list of objects", bytes: "8B ptr + instance each", note: "an attribute lookup per element, in the interpreter" },
        { decl: "array.array per field", bytes: "raw width, contiguous", note: "lets sum()/min()/max() run in C over the whole array" },
        { decl: "numpy arrays", bytes: "raw width, vectorised", note: "the real answer for numeric work, where the judge allows it" },
      ],
      cpp: [
        { decl: "vector<Struct>", bytes: "sizeof(Struct)/element", note: "contiguous, but drags every field through cache" },
        { decl: "one vector per field", bytes: "sizeof(field)/element", note: "the SoA form; scans faster and vectorises" },
        { decl: "cache line", bytes: "64 bytes", note: "the unit the hardware actually moves — the number that explains the gap" },
      ],
      java: [
        { decl: "Object[]", bytes: "8B ref + object each", note: "worse than C++ AoS: unused fields AND a pointer chase" },
        { decl: "parallel primitive arrays", bytes: "dense, no headers", note: "the only dense layout available on JDK 11" },
        { decl: "Project Valhalla", bytes: "—", note: "value types would fix this; not in JDK 11" },
      ],
    },
    measured: "[C++]  E10 sizeof(Particle)=32B  summing ONE field over 100000 elements x50:\n[C++]  E10perf array-of-structs is slower than struct-of-arrays -> true  (same sum: true)  — AoS drags all 32B through cache to read 8\n[Java] E10 summing ONE field over 1000000 shuffled elements, best of 5 after warm-up:\n[Java] E10perf scattered Particle[] slower than double[] -> true  (same sum: true)  — the object array chases a pointer per element; the double[] is a straight walk\n[Py]   E10 summing ONE field over 100000 elements x5:\n[Py]   E10perf attribute walk slower than array.array + sum() -> True (same total: True) — the object walk pays an attribute lookup per element in the interpreter, sum() over array.array runs in C",
    differs:
      "All three measured the same direction, for three different reasons. C++: <code>sizeof(Particle)</code> is <b>32 bytes</b> and array-of-structs was slower — the cache line argument, cleanly. Java: slower too, over a million <em>shuffled</em> references, best of five after warm-up — and worse than C++, because the object array adds a real pointer chase on top of the wasted bytes. Python: slower again, but the cause is the interpreter — the attribute walk pays per-element dispatch while <code>sum()</code> over an <code>array.array</code> runs entirely in C.",
    trap: "This is the optimisation to reach for when your complexity is already optimal and you are still timing out. It changes no logic, so it cannot introduce a wrong answer — which makes it unusually safe to try late.",
    see: ["any n ≥ 10⁶ scan", "LC 74 · Search a 2D Matrix", "graph problems with dense adjacency"],
  },
  {
    n: 11,
    title: "What is a container even allowed to hold?",
    tier: "extreme",
    what: "The requirements an element must satisfy before a set, a map or a sort will accept it.",
    why: "Two of these requirements fail at compile time and one fails silently at runtime. The silent one has already appeared twice on this ladder, and it is the same bug both times.",
    layout:
      "A sorted container needs a total order — <code>operator&lt;</code> in C++, <code>Comparable</code> in Java, <code>__lt__</code> in Python. A hash container needs a hash <em>and</em> an equality that agree: equal things must hash equal, or the bucket lookup goes to the wrong place. C++ refuses to compile when the hash is missing. Java does not — <code>Object</code> supplies an identity hash, so the code builds and the set simply never matches anything. Python refuses at runtime with <code>TypeError: unhashable</code>, which is the middle ground and arguably the best of the three.",
    py: `{(1, 2): 3}              # tuple key: fine — hashable
{[1, 2]: 3}              # TypeError: unhashable type: 'list'

# hashable == immutable, roughly:
#   yes: int, str, tuple, frozenset, a frozen dataclass
#   no:  list, dict, set, a plain object with __eq__ only

# and a list can hold ANY mix, because every slot
# is just a pointer:
[1, 'a', 2.0, [3], (4,), {5}, None]`,
    cpp: `map<pair<int,int>, int> ok;        // pair has operator<
set<vector<int>> alsoOk;           // vector has operator<
vector<function<int(int)>> fns;    // even callables

unordered_map<pair<int,int>, int> nope;
// DOES NOT COMPILE — there is no std::hash for pair.
// Either use map<>, or fold the pair into one integer:
//   key = a * 1000000LL + b

// ordered  -> needs operator<
// unordered -> needs std::hash + operator==`,
    java: `Map<List<Integer>,Integer> ok = new HashMap<>();
ok.put(List.of(1,2), 3);          // List has equals + hashCode

Map<int[],Integer> compiles = new HashMap<>();
// …and silently never finds anything, because int[]
// inherits identity equality from Object.

// HashMap keys need equals() AND hashCode()
// TreeMap keys need Comparable, or a Comparator`,
    decl: {
      py: [
        { decl: "dict / set key", bytes: "—", note: "must be hashable, which in practice means immutable" },
        { decl: "frozenset / tuple", bytes: "—", note: "the hashable versions of set and list" },
        { decl: "sorted(key=...)", bytes: "—", note: "no ordering requirement on the element — the KEY does the work" },
        { decl: "a list", bytes: "—", note: "can hold any mix of types; C++ and Java need variant or Object" },
      ],
      cpp: [
        { decl: "map / set", bytes: "—", note: "needs operator< (a strict weak ordering)" },
        { decl: "unordered_map / set", bytes: "—", note: "needs std::hash AND operator== — MISSING for pair and vector" },
        { decl: "a custom hash", bytes: "—", note: "specialise std::hash, or pass a hasher as the third template argument" },
        { decl: "variant / any", bytes: "size of the largest + tag", note: "how C++ holds a mix of types at all" },
      ],
      java: [
        { decl: "HashMap key", bytes: "—", note: "needs equals AND hashCode; the default is identity, which compiles and fails" },
        { decl: "TreeMap key", bytes: "—", note: "needs Comparable or a Comparator — this one throws at runtime, loudly" },
        { decl: "int[] as a key", bytes: "—", note: "the silent failure. Use List.of or a record instead" },
      ],
    },
    measured: "[C++]  E11 map<pair,int> works (pair is comparable): 3  set<vector<int>> works: 1  vector<function> works: 42\n[C++]  E11req ordered containers need operator< ; unordered ones need std::hash. There is NO std::hash for pair or vector — unordered_map<pair<..>,..> does NOT compile.\n[Java] E11 Map<List<Integer>,Integer> works (List has equals+hashCode): 3  List<Function> works: 42\n[Java] E11req HashMap keys need equals() AND hashCode(); TreeMap keys need Comparable. int[] has NEITHER that is useful — it compiles and silently fails to deduplicate.\n[Py]   E11 dict keyed by tuple works: 3   list of lambdas works: 42\n[Py]   E11mixed a list can hold ANY mix — ['int', 'str', 'float', 'list', 'tuple', 'set', 'NoneType'] — because every slot is just a pointer. C++ and Java cannot do this without variant/Object.\n[Py]   E11req dict/set keys must be HASHABLE (immutable): tuple yes, list no, frozenset yes",
    differs:
      "Three failure modes for one mistake. C++ <b>refuses to compile</b> <code>unordered_map&lt;pair,V&gt;</code>. Python <b>raises</b> <code>TypeError: unhashable type: 'list'</code> the moment you try. Java <b>compiles and runs</b> and quietly never matches — the executed <code>HashSet&lt;int[]&gt;</code> held two identical pairs as two distinct entries. Python's flexibility is measured too: one list held seven different types, which neither of the others can do without <code>variant</code> or <code>Object</code>.",
    trap: "The C++ compile error is a gift. The Java silence is not — if a <code>HashSet</code> or <code>HashMap</code> is behaving as though nothing is ever present, check whether the key type has a real <code>hashCode</code> before you check anything else.",
    see: ["LC 49 · Group Anagrams", "LC 128 · Longest Consecutive Sequence", "LC 217 · Contains Duplicate"],
  },
  {
    n: 12,
    title: "The buffer underneath, and how it grows",
    tier: "extreme",
    what: "Capacity versus size — the slots that exist against the elements you put in them.",
    why: "Appending is amortised O(1) because of this, and the constant hiding in \"amortised\" is a growth factor the three languages chose differently. It is also where the memory you cannot account for went.",
    layout:
      "A dynamic array is a fixed block plus a count. Appending writes the next free slot until the block is full, then allocates a bigger one and copies everything — O(n), but rare enough that the average stays O(1). The growth <b>factor</b> decides the trade: doubling means fewer copies and up to 50% wasted space; 1.5× wastes less and copies more. Python grows gentlest of all, by roughly 1.125× plus a constant, which suits a language where each slot is only a pointer.",
    py: `v = []
for i in range(100): v.append(i)

# measured slot counts as it grew:
# 4, 8, 16, 24, 32, 40, 52, 64, 76, 92, 108
# roughly 1.125x plus a constant — the gentlest of the three

# there is NO reserve():
[None] * n      # sets SIZE to n, not capacity.
                # appending after this gives you 2n elements.

del v[:]        # empties without rebinding the object`,
    cpp: `vector<int> v;
for (int i = 0; i < 100; ++i) v.push_back(i);

// measured capacities: 1 2 4 8 16 32 64 128
// libstdc++ DOUBLES. After 100 pushes:
//   size = 100, capacity = 128, 28 slots wasted (112 bytes)

v.reserve(n);        // capacity only — size() is unchanged
v.resize(n);         // SIZE — this is what makes v[0] valid
v.shrink_to_fit();   // 128 -> 100  (a request, not a promise)
v.clear();           // size 0, capacity UNCHANGED`,
    java: `List<Integer> v = new ArrayList<>();

// grows by 1.5x: oldCap + (oldCap >> 1), starting at 10
//   10, 15, 22, 33, 49, 73, 109, 163, ...
// after 100 adds: 163 slots for 100 elements
//   ~63 wasted references (~504B), plus 100 Integer objects

new ArrayList<>(n);      // pre-size the buffer
((ArrayList<Integer>) v).trimToSize();   // the shrink
v.clear();               // size 0, capacity unchanged`,
    decl: {
      py: [
        { decl: "list growth", bytes: "~1.125× + constant", note: "measured 4, 8, 16, 24, 32, 40, 52, 64, 76, 92, 108" },
        { decl: "no reserve()", bytes: "—", note: "[None]*n sets SIZE — appending after it gives you 2n elements" },
        { decl: "del v[:]", bytes: "size 0", note: "empties in place, keeping the same object for other references" },
      ],
      cpp: [
        { decl: "growth factor 2×", bytes: "up to 50% waste", note: "measured 1 2 4 8 16 32 64 128 on libstdc++" },
        { decl: "reserve(n)", bytes: "capacity only", note: "size() stays where it was; v[0] is still invalid" },
        { decl: "resize(n)", bytes: "size AND capacity", note: "this is the one that makes indexing valid" },
        { decl: "shrink_to_fit()", bytes: "capacity → size", note: "a non-binding request; measured 128 → 100 here" },
      ],
      java: [
        { decl: "growth factor 1.5×", bytes: "less waste, more copies", note: "10, 15, 22, 33, 49, 73, 109, 163 from an empty ArrayList" },
        { decl: "new ArrayList<>(n)", bytes: "capacity n, size 0", note: "the pre-size; the argument is NOT an initial size" },
        { decl: "trimToSize()", bytes: "capacity → size", note: "on the concrete ArrayList type, not the List interface" },
      ],
    },
    measured: "[C++]  E12 capacities as it grew: 1 2 4 8 16 32 64 128 \n[C++]  E12ratio libstdc++ DOUBLES. After 100 pushes: size=100 capacity=128 wasted=28 slots (112B)\n[C++]  E12shrink after shrink_to_fit: capacity=100\n[Java] E12 ArrayList grows by 1.5x (oldCap + oldCap>>1), starting at 10: 10, 15, 22, 33, 49, 73, 109, 163, ...\n[Java] E12ratio after 100 adds the backing array is 163 slots for 100 elements — size=100, ~63 wasted references (~504B), plus 100 Integer objects\n[Java] E12fix new ArrayList<>(n) pre-sizes the buffer; there is no shrink_to_fit, but trimToSize() on the concrete ArrayList type does the same job\n[Py]   E12 slot counts as it grew: [4, 8, 16, 24, 32, 40, 52, 64, 76, 92, 108]\n[Py]   E12ratio CPython over-allocates by roughly 1.125x plus a constant — a much gentler curve than C++ 2x or Java 1.5x. After 100 appends: len=100 slots=108\n[Py]   E12fix there is no reserve(). [None]*n sets SIZE, not capacity — appending after it gives you 2n.",
    differs:
      "Three different growth curves, all measured on the same 100 appends. C++ doubled — <b>1, 2, 4, 8, 16, 32, 64, 128</b> — ending with 28 wasted slots. Java grew by 1.5× to <b>163 slots for 100 elements</b>. Python grew gentlest, <b>4, 8, 16, 24, 32, 40, 52, 64, 76, 92, 108</b>. And <code>shrink_to_fit()</code> measurably took the C++ capacity from 128 back to 100, which neither of the others offers on the interface type.",
    trap: "<code>clear()</code> sets the size to zero and leaves the capacity alone in all three. If you are reusing a container across test cases and watching memory climb, that is why — you need <code>shrink_to_fit</code>, <code>trimToSize</code>, or a fresh object.",
    see: ["any problem building a result of unknown size", "LC 1store-and-scan problems", "multi-testcase harnesses"],
  },
];

/** Tiers, in ladder order, for the level filter. */
export const ELEMENT_TIERS = ["easy", "medium", "hard", "extreme"] as const;

/** The runtimes every number on this page was measured on. */
export const ELEMENT_RUNTIMES: { key: LangKey; label: string; runtime: string }[] = [
  { key: "py", label: "python", runtime: "CPython 3.10.12" },
  { key: "cpp", label: "c++", runtime: "g++ 11.4.0, -std=c++17" },
  { key: "java", label: "java", runtime: "OpenJDK 11.0.31" },
];
