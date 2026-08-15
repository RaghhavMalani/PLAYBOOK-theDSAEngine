/**
 * The memory deep-dive — four topics that decide whether correct code also runs.
 *
 * The element-types module answers "what is in the box and what did it cost". This
 * answers the four questions that come after that, and they have one thing in
 * common: none of them changes your algorithm's complexity, and all four change
 * whether it finishes.
 *
 *   1. Iterator invalidation — the container moved out from under you, and only one
 *      of the three languages tells you.
 *   2. The cache hierarchy — the same O(n) walked two ways, measured.
 *   3. Stack versus heap — where things live, and why a deep DFS dies.
 *   4. Hash containers — load factor, rehashing, and the collision attack.
 *
 * EVERY NUMBER AND EVERY VERDICT HERE WAS MEASURED.
 *   C++    g++ 11.4.0 -std=c++17 — capacities, bucket counts, timed loops
 *   Java   OpenJDK 11.0.31 — caught exceptions and timed loops, after JIT warm-up
 *   Python CPython 3.10.12 — caught exceptions, getsizeof, timed loops
 *
 * Timing verdicts are recorded as comparisons rather than raw numbers, and taken as
 * the best of several runs, because a millisecond figure is not reproducible on
 * another machine but "column-major is slower than row-major" is. Where a fact
 * depends on the environment — the recursion ceiling, the JVM stack size — the
 * programs measure something stable and state the variable part in words instead of
 * pretending a number is universal.
 *
 * Re-run it all with `npm run verify:deep`.
 */

import type { DeepLevel } from "./deep-types";

export const MEMORY_DEEP: readonly DeepLevel[] = [
  {
    n: 1,
    title: "Iterator invalidation — the container moved under you",
    tier: "medium",
    what: "What happens to an iterator, a reference or a pointer when the container it points into changes.",
    why: "This is the one bug on the memory page that can corrupt memory rather than merely waste it. C++ gives you undefined behaviour, Java throws, and Python silently returns a wrong answer — three languages, three completely different failure modes for one mistake.",
    layout:
      "An iterator into a <code>vector</code> is a raw pointer into the heap buffer. When <code>push_back</code> exceeds capacity it allocates a <em>new</em> buffer, copies the elements over and frees the old one — and every iterator, pointer and reference you were holding still points at the freed block. Node-based containers (<code>list</code>, <code>map</code>, <code>set</code>) never move their nodes, so inserting leaves every other iterator valid. Java has no pointers to dangle: growing an <code>ArrayList</code> copies <em>references</em> into a bigger array while the objects stay exactly where they were, so the failure is detection (a modification counter) rather than corruption. Python's list is the same, and it does not even detect — the index simply walks forward while the list shrinks beneath it.",
    py: `v = [1, 2, 2, 3, 4]

for x in v:                 # iterating the LIVE list
    if x % 2 == 0:
        v.remove(x)
# -> [1, 2, 3]   an even number SURVIVED. No error, no warning.

for x in v[:]:              # iterate a COPY — correct
    if x % 2 == 0: v.remove(x)

[x for x in v if x % 2]     # better: build a new list

d = {'a': 1, 'b': 2, 'c': 3}
for k in d: d[k + 'x'] = 1  # RuntimeError: dictionary changed size
for k in d: d[k] = 99       # FINE — the key SET did not change`,
    cpp: `vector<int> v{1, 2, 3};
v.reserve(3);
int* p = v.data();
v.push_back(4);             // capacity exceeded -> REALLOCATES
// p, and every iterator you held, now dangle. Reading them is UB.

v.reserve(100);             // headroom means no reallocation,
                            // so pointers stay valid — that is the fix

// erase invalidates from the erase point on. The return value is the cure:
for (auto it = v.begin(); it != v.end();)
    if (*it % 2 == 0) it = v.erase(it);
    else ++it;

list<int> l; map<int,int> m;   // node-based: inserting invalidates NOTHING
unordered_map<int,int> um;     // a REHASH invalidates iterators,
                               // but references to values survive`,
    java: `List<Integer> v = new ArrayList<>(List.of(1,2,3,4,5));

for (Integer x : v)
    if (x % 2 == 0) v.remove(x);   // ConcurrentModificationException

Iterator<Integer> it = v.iterator();
while (it.hasNext()) if (it.next() % 2 == 0) it.remove();   // correct
v.removeIf(x -> x % 2 == 0);                                // idiomatic

List<Integer> sub = base.subList(0, 2);
base.add(9);        // structural change to the PARENT
sub.get(0);         // ConcurrentModificationException — the view broke

// growth copies REFERENCES; the objects never move, so nothing dangles.`,
    decl: {
      py: [
        { decl: "for x in list: list.remove(x)", bytes: "no error", note: "SILENTLY skips elements — the worst of the three failure modes" },
        { decl: "for x in list[:]", bytes: "O(n) memory", note: "iterate a snapshot; the simple correct fix" },
        { decl: "[x for x in a if p(x)]", bytes: "O(n)", note: "build rather than mutate; a[:] = [...] to write back in place" },
        { decl: "dict / set during iteration", bytes: "RuntimeError", note: "these DO raise — the inconsistency with lists is the trap" },
        { decl: "d[k] = v on an existing key", bytes: "safe", note: "only changing the key SET is structural" },
      ],
      cpp: [
        { decl: "push_back past capacity", bytes: "invalidates EVERYTHING", note: "all iterators, pointers and references — reading them is undefined behaviour" },
        { decl: "reserve(n) first", bytes: "keeps them valid", note: "the only way to hold a pointer across insertions" },
        { decl: "it = v.erase(it)", bytes: "returns the next valid iterator", note: "do not also ++it; that skips an element" },
        { decl: "list / map / set insert", bytes: "invalidates nothing", note: "node-based containers never move existing elements" },
        { decl: "unordered_map rehash", bytes: "invalidates iterators only", note: "references to values survive; iterators do not" },
      ],
      java: [
        { decl: "for-each + structural change", bytes: "ConcurrentModificationException", note: "fail-fast via a modCount check — a feature, not an annoyance" },
        { decl: "Iterator.remove()", bytes: "safe", note: "the only correct manual removal during iteration" },
        { decl: "removeIf(pred)", bytes: "safe, O(n)", note: "the idiom; works on Set and Map.values() too" },
        { decl: "subList view", bytes: "breaks on parent change", note: "valid only while the parent is structurally unmodified" },
        { decl: "references never dangle", bytes: "—", note: "growth copies references; the objects stay put. Java's one clear safety win over C++" },
      ],
    },
    measured: "[C++]  D01 vector: capacity 3 -> 6, buffer moved -> true  EVERY iterator, pointer and reference into it is now dangling\n[C++]  D01safe with reserve(100) headroom, push_back did NOT move the buffer -> true  (reserve is how you keep pointers valid)\n[C++]  D01erase erase() returns the next valid iterator -> 1 3 5 \n[C++]  D01node std::list: after inserting at both ends, the old iterator still reads 2  — node containers keep every other iterator valid\n[C++]  D01map std::map: after inserting a new key, the old iterator still reads 20  (same guarantee)\n[C++]  D01hash unordered_map: buckets 2 -> 97, load_factor 1 -> 0.515464  — a REHASH invalidates iterators, but NOT references to values\n[Java] D01 for-each + structural modification -> ConcurrentModificationException   Java DETECTS it with a modCount check and fails fast\n[Java] D01fix Iterator.remove() -> [1, 3, 5]   removeIf() -> [1, 3, 5]\n[Java] D01view subList after the parent grew -> ConcurrentModificationException   a view is only valid while the parent is structurally unchanged\n[Java] D01noptr after 101 adds forced regrowth, the element reference still reads 7  — Java copies REFERENCES into the new array; the objects never move, so nothing dangles. This is the one place Java is safer than C++.\n[Java] D01map mutating a HashMap while iterating its keySet -> ConcurrentModificationException   (a value-only put(k, newValue) on an EXISTING key is fine — it is not structural)\n[Py]   D01 source=[1, 2, 2, 3, 4]  iterating a copy -> [1, 3] (correct)   iterating the live list -> [1, 2, 3]\n[Py]   D01quiet Python does NOT raise for a list. The index walks forward while the list shrinks under it, so elements are SKIPPED and you get a plausible wrong answer. Java throws ConcurrentModificationException for exactly this.\n[Py]   D01dict adding keys while iterating a dict -> RuntimeError: dictionary changed size during iteration  <- dicts DO raise, lists do not\n[Py]   D01ok assigning to EXISTING keys during iteration is fine: {'a': 99, 'b': 99}  — only changing the SET of keys is a structural change\n[Py]   D01set the same guard exists on sets -> RuntimeError: Set changed size during iteration\n[Py]   D01noptr Python has no pointers to dangle: growing a list may move its internal buffer, but every NAME still refers to the same list object -> alias is lst: True, alias=[1, 2, 3, 4]",
    differs:
      "Three failure modes, all executed. C++ reallocated on <code>push_back</code> and the buffer address <b>changed</b> — every pointer held across that line is now dangling, and reading one is undefined behaviour rather than a crash you can count on. Java <b>threw ConcurrentModificationException</b>, and its <code>subList</code> view threw too once the parent grew. Python <b>returned <code>[1, 2, 3]</code></b> from a filter that should have produced <code>[1, 3]</code> — an even number survived, silently. Note Python's own inconsistency: dicts and sets raise <code>RuntimeError</code> for the same class of mistake that lists ignore.",
    trap: "Python's silence is the one that reaches the judge. Java's exception looks hostile and is the friendliest behaviour of the three — it converts a wrong answer into a stack trace. C++'s is the most dangerous: the program usually keeps running on freed memory and fails somewhere unrelated.",
    see: ["LC 27 · Remove Element", "LC 283 · Move Zeroes", "LC 26 · Remove Duplicates from Sorted Array"],
  },
  {
    n: 2,
    title: "The cache hierarchy — the half Big-O cannot see",
    tier: "hard",
    what: "Why the same O(n) walk can be several times slower depending only on the order you touch memory.",
    why: "Complexity analysis counts operations and assumes every memory access costs the same. It does not. That single false assumption is why two algorithms with identical Big-O can differ by an order of magnitude, and why the fix is often to reorder two loops.",
    layout:
      "The CPU never fetches a byte. It fetches a <b>64-byte cache line</b> and keeps it in L1, then L2, then L3, each larger and slower than the last, with main memory perhaps 200 cycles away. Walking with stride 1 means every line you pay for delivers 16 useful ints — and the hardware prefetcher, seeing a straight line, fetches ahead so you rarely wait at all. Walk with stride 16 and every read costs a fresh line for one useful value: 16× the memory traffic for the same answer. Go further and the prefetcher gives up entirely because the pattern no longer looks sequential. Nothing about the instruction count changed.",
    py: `import array
a = array.array('i', bytes(4 * (1 << 22)))   # contiguous, no pointers

# same NUMBER of reads, different stride:
for _ in range(touches):
    total += a[i & mask]; i += stride        # stride 1 vs 16 vs 1024

# the cliff is real here but SMALLER than in C++/Java: the interpreter
# overhead per element dwarfs the memory stall. In CPython the loop
# itself is the bottleneck.

# and a plain list is worse before you start — every element is a
# POINTER to an int object elsewhere, so a "sequential" walk is
# already random access. numpy is how you get the real thing.`,
    cpp: `vector<int> a(1 << 22);         // 16 MB, larger than most L3

for (size_t i = 0, k = 0; k < touches; ++k, i += stride)
    s += a[i & (N - 1)];        // stride 1, 16, 1024

// row-major vs column-major on the same matrix:
for (int i = 0; i < M; ++i)
    for (int j = 0; j < M; ++j) r += g[i * M + j];   // fast

for (int j = 0; j < M; ++j)
    for (int i = 0; i < M; ++i) c += g[i * M + j];   // slow

// identical answer, identical O(n^2), two lines swapped.`,
    java: `int[] a = new int[1 << 22];

// warm up first — an un-JITed loop measures the interpreter,
// not the memory system:
for (int r = 0; r < 3; r++) sink += strideSum(a, 1);

// then best-of-N, so a GC pause cannot flip the verdict.

// the JIT compiles this to essentially the same machine code as C++,
// so the cliff is the same cliff. The array bounds check is NOT what
// you are seeing — it predicts perfectly and costs almost nothing.`,
    decl: {
      py: [
        { decl: "list", bytes: "8B pointer per slot", note: "sequential in pointers, random in the objects they point at" },
        { decl: "array.array(typecode)", bytes: "raw width, contiguous", note: "the only stdlib way to get a cache-friendly numeric buffer" },
        { decl: "numpy ndarray", bytes: "raw width, vectorised", note: "where the cache actually starts to dominate, because the loop is in C" },
        { decl: "sum() / min() over array", bytes: "O(n) in C", note: "escaping the interpreter matters more than locality, in that order" },
      ],
      cpp: [
        { decl: "cache line", bytes: "64 bytes = 16 ints", note: "the unit the hardware moves; the number that explains every gap here" },
        { decl: "row-major traversal", bytes: "1 line per 16 reads", note: "index [i*M + j] with j innermost" },
        { decl: "column-major traversal", bytes: "1 line per read", note: "the same loops swapped — measurably slower for identical work" },
        { decl: "one flat vector vs vector of vectors", bytes: "1 allocation vs r+1", note: "flat is contiguous; nested rows are scattered" },
        { decl: "__builtin_prefetch", bytes: "—", note: "rarely needed; the hardware prefetcher already handles straight lines" },
      ],
      java: [
        { decl: "int[]", bytes: "dense, one block", note: "the only dense layout available — use it in anything hot" },
        { decl: "Integer[] / List<Integer>", bytes: "8B ref + scattered objects", note: "a pointer chase per element; the prefetcher cannot help" },
        { decl: "JIT warm-up", bytes: "—", note: "time an un-warmed loop and you measure the interpreter, not memory" },
        { decl: "bounds checks", bytes: "~free in a hot loop", note: "predicted perfectly; they are not the reason your loop is slow" },
      ],
    },
    measured: "[C++]  D02 the SAME number of reads, walked with a growing stride:\n[C++]  D02step stride 16 slower than stride 1 -> true   stride 1024 slower than stride 16 -> true   1024 slower than 1 -> true\n[C++]  D02why identical instruction count, identical O(n). The only thing that changed\n[C++]  D02line a line is 64 bytes = 16 ints. At stride 1 you use all 16 ints of every\n[C++]  D02order 1024x1024 sum, same total: true.  column-major slower than row-major -> true  — swapping two loop lines, nothing else\n[Java] D02 the SAME number of reads, walked with a growing stride:\n[Java] D02step stride 16 slower than stride 1 -> true   stride 1024 slower than stride 16 -> true   1024 slower than 1 -> true  (sink true)\n[Java] D02jvm the JIT compiles this to essentially the same machine code as C++, so the cliff is the same cliff. The array bounds check is not what you are seeing.\n[Java] D02order 1024x1024 sum, same total: true.  column-major slower than row-major -> true  — swapping two loop lines, nothing else (warm true)\n[Py]   D02 the SAME number of reads, walked with a growing stride:\n[Py]   D02step stride 16 slower than stride 1 -> True   stride 1024 slower than stride 16 -> True   1024 slower than 1 -> True\n[Py]   D02gap the effect is REAL but much smaller here than in C++ or Java, because the interpreter overhead per element dwarfs the memory stall. In CPython the loop itself is the bottleneck; the cache only becomes visible once you drop into C via numpy.\n[Py]   D02list and a plain list is worse than array.array before you even start: every element is a POINTER to an int object elsewhere, so a \"sequential\" walk is already random access.",
    differs:
      "All three showed the same direction, for partly different reasons. In C++ and Java the cliff is pure memory: identical instruction counts, and stride 1024 measurably slower than stride 1, with column-major slower than row-major on the same matrix and the same total. Python showed the effect too, but the honest caveat is in its own output — the interpreter overhead per element dwarfs the memory stall, so in CPython the loop is the bottleneck and the cache only becomes the dominant term once you drop into C.",
    trap: "This is the optimisation to reach for when the complexity is already optimal and you are still timing out. It changes no logic, so it cannot introduce a wrong answer — which makes it unusually safe to try late in a contest.",
    see: ["LC 48 · Rotate Image", "LC 54 · Spiral Matrix", "LC 74 · Search a 2D Matrix", "any 10⁶-element scan"],
  },
  {
    n: 3,
    title: "Stack versus heap, and why a deep DFS dies",
    tier: "hard",
    what: "Where locals, objects and buffers actually live, and what happens when the call stack runs out.",
    why: "Every recursive solution has a depth limit that no complexity analysis mentions. On 10⁵ nodes that limit is the difference between an accepted solution and a crash, and the three languages fail at very different depths in very different ways.",
    layout:
      "The stack is a fixed block of memory handed to the thread at creation — typically 8 MB for a Linux main thread, 1 MB on Windows, and 512 KB–1 MB per JVM thread. Every call pushes a frame holding the return address, saved registers and locals, and allocation is a single pointer bump; freeing happens automatically when the frame pops. The heap has no such discipline: allocation goes through a real allocator, and freeing is either manual, scope-based, or deferred to a garbage collector. Recursion depth is therefore bounded by <em>stack bytes ÷ frame size</em>, which is why a fat frame runs out far sooner than a lean one.",
    py: `# there is no stack/heap choice. EVERY object is on the heap;
# the C stack holds only interpreter frames. Even 3 is a heap object.

sys.getrecursionlimit()        # 1000 — a SOFT limit the interpreter
                               # enforces to protect the real C stack
sys.setrecursionlimit(10000)   # raises the GUARD, not the stack

# raising it too far turns a catchable RecursionError into a genuine
# segfault. A DFS on 1e5 nodes should be ITERATIVE, not merely permitted:

stack = [start]
while stack:
    u = stack.pop()
    for v in g[u]: stack.append(v)`,
    cpp: `int local;                // stack: one pointer bump, freed at scope exit
vector<int> v(4);         // the OBJECT is where you declared it,
                          // its BUFFER is on the heap
new int[n];               // heap: a real allocator call

// a frame of a few locals measures ~64 bytes, so:
//   8 MB Linux stack  -> ~130,000 levels
//   1 MB Windows stack -> ~16,000 levels

// overflowing the stack is a CRASH you cannot catch. Not an exception,
// not a signal you can meaningfully recover from — the process dies.`,
    java: `// the split is not yours to make: primitive LOCALS and object
// REFERENCES live on the stack; every object and array is on the heap.

// there is no stack allocation you can request. Escape analysis may
// scalarise a short-lived object, but that is the JIT's decision.

// -Xss4m           enlarge the stack
// new Thread(group, runnable, name, stackSize)   per-thread size

try { deepRecursion(); }
catch (StackOverflowError e) { ... }
// SOE is catchable, unlike C++ — but the JVM is left in a state you
// should not keep working in. Convert to an explicit Deque instead.`,
    decl: {
      py: [
        { decl: "sys.getrecursionlimit()", bytes: "1000 by default", note: "a guard the interpreter enforces, not the size of the real stack" },
        { decl: "sys.setrecursionlimit(n)", bytes: "raises the guard only", note: "set it too high and you get a segfault instead of RecursionError" },
        { decl: "a frame object", bytes: "heavier than a C frame", note: "recursion is expensive in time here, not just in depth" },
        { decl: "explicit stack + while", bytes: "heap, unbounded", note: "the fix; also usually faster than the recursive form" },
      ],
      cpp: [
        { decl: "a local variable", bytes: "one pointer bump", note: "freed automatically at scope exit — no allocator involved" },
        { decl: "new / malloc", bytes: "a real allocator call", note: "why a hot loop that allocates per iteration is slow" },
        { decl: "main thread stack", bytes: "~8 MB on Linux, 1 MB on Windows", note: "ulimit -s shows it; the Windows figure is the one that bites" },
        { decl: "stack overflow", bytes: "a CRASH", note: "not catchable, not diagnosable — the single worst failure mode here" },
        { decl: "large local arrays", bytes: "on the stack", note: "int a[1000000] inside a function overflows immediately; make it global or heap" },
      ],
      java: [
        { decl: "primitive local / reference", bytes: "on the stack", note: "the object itself is always on the heap" },
        { decl: "every object and array", bytes: "on the heap", note: "no value types on JDK 11; Valhalla would change this" },
        { decl: "-Xss", bytes: "sets thread stack size", note: "the usual competitive-programming fix: run the solver on a big-stack thread" },
        { decl: "StackOverflowError", bytes: "catchable", note: "but the JVM state after it is not one to keep using" },
        { decl: "GC pause", bytes: "proportional to LIVE objects", note: "freeing is deferred, so the cost shows up somewhere else" },
      ],
    },
    measured: "[C++]  D03 a local int lives on the STACK; new/malloc and every vector buffer live on\n[C++]  D03size sizeof(vector<int>) object=24B on the stack, holding a pointer to 16B on the heap. local=0\n[C++]  D03cost the stack is a pointer bump — allocation is one instruction and freeing is\n[C++]  D03frame one recursive frame of this shape measures 64 bytes\n[C++]  D03depth at that size, an 8 MB Linux stack allows about 131072 levels; a 1 MB Windows stack allows about 16384\n[C++]  D03risk a DFS on 1e5 nodes with a few locals per frame is genuinely close to the\n[Java] D03 in Java the split is not yours to make: LOCALS of primitive type and object REFERENCES live on the stack; every object and every array lives on the heap.\n[Java] D03noalloc there is no stack allocation of objects you can request. Escape analysis may scalarise a short-lived object, but that is the JIT's decision, not a language feature you can rely on.\n[Java] D03gc the heap is garbage collected, so 'freeing' is not a cost you pay at the free — it is a pause you pay later, proportional to LIVE objects.\n[Java] D03depth recursion to depth 5000 succeeds on any default JVM; 100000 typically does NOT — the exact ceiling depends on -Xss and frame size\n[Java] D03size the default JVM thread stack is 512KB-1MB (-Xss changes it), far smaller than the 8MB a Linux main thread gets in C++.\n[Java] D03risk StackOverflowError IS catchable, unlike a C++ stack overflow — but catching it leaves the JVM in a state you should not keep working in. Convert deep recursion to an explicit Deque instead.\n[Py]   D03 there is no stack/heap choice in Python. EVERY object is on the heap; the C stack holds only interpreter frames. Even the integer 3 is a heap object.\n[Py]   D03frame each Python call builds a frame OBJECT, which is heavier than a C stack frame — that is why recursion is expensive here in time as well as in depth.\n[Py]   D03lim sys.getrecursionlimit()=1000 — a SOFT limit the interpreter enforces to protect the real C stack underneath it.\n[Py]   D03depth after setrecursionlimit(10000), recursion reached depth 4000; the limit was restored to 1000\n[Py]   D03risk raising the limit does NOT enlarge the C stack — set it too high and you get a genuine segfault instead of a catchable RecursionError. A DFS on 1e5 nodes should be iterative, not merely permitted.",
    differs:
      "The measured frame size in C++ was <b>64 bytes</b>, which puts an 8 MB Linux stack at roughly <b>131,000</b> levels and a 1 MB Windows stack at about <b>16,000</b> — so the same recursive solution can pass on the judge and crash on your laptop. Java survives depth 5,000 on any default JVM but not 100,000, and its <code>StackOverflowError</code> is at least catchable. Python's limit is not the stack at all but a <b>soft guard set at 1,000</b>, which you can raise — and raising it too far replaces a catchable <code>RecursionError</code> with a real segfault.",
    trap: "In C++, a large local array is on the <em>stack</em>: <code>int a[1000000];</code> inside a function is 4 MB of stack and overflows immediately, while the identical declaration at global scope is fine. This catches people who move working code into a function.",
    see: ["LC 200 · Number of Islands", "LC 104 · Maximum Depth of Binary Tree", "LC 207 · Course Schedule", "LC 133 · Clone Graph"],
  },
  {
    n: 4,
    title: "Hash containers: load factor, rehashing, and the collision attack",
    tier: "extreme",
    what: "What O(1) average actually costs in memory, and the input that turns it into O(n).",
    why: "The hash map is the most-used structure after the array, and its guarantee is average-case only. Two things break it: the memory it quietly consumes, and an adversary who can choose your keys. One of the three languages defends against the second; one does not.",
    layout:
      "A hash map is an array of buckets plus a rule for turning a key into an index. Lookup is O(1) <em>on average</em> because a good hash spreads keys evenly, so each bucket holds about <code>size / bucket_count</code> entries — the <b>load factor</b>. When that ratio crosses a threshold the table allocates a bigger bucket array and re-inserts everything: O(n), rare, amortised away. The average collapses if the hash does not spread. C++ makes this trivially exploitable because <code>std::hash&lt;size_t&gt;</code> is the <em>identity</em> — choose keys that are all multiples of the bucket count and every one lands in the same chain. Java re-mixes every hash and converts a long chain into a red-black tree; Python randomises string hashing per process.",
    py: `d = {}
for i in range(1000): d[i] = i

# CPython resizes when 2/3 full. Since 3.6 a dict is TWO arrays —
# a compact entries array plus a sparse index array — which is why
# it preserves insertion order AND costs less than the old table.

hash(1)      # 1     — identity for small ints
hash(-1)     # -2    — special-cased; -1 signals an error in CPython
hash('abc')  # RANDOMISED per process (PYTHONHASHSEED)

# strings are protected from collision attacks; integer keys are not.
# there is no ordered map: for floor/ceiling you need sorted + bisect.`,
    cpp: `unordered_map<int,int> m;
m.reserve(n);              // pre-size to skip every rehash

m.load_factor();           // size / bucket_count
m.max_load_factor();       // 1.0 by default — rehash at 100% full
m.bucket_count();          // 13, 29, 59, 127, 257, 541, 1109, ...

// THE ATTACK: std::hash<size_t> is the IDENTITY on libstdc++.
// Keys chosen as multiples of bucket_count all land in bucket 0
// and lookup degrades to a linear scan of the chain.

// the fix — mix the key yourself:
struct Hash { size_t operator()(size_t x) const {
    x += 0x9e3779b97f4a7c15ULL;
    x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9ULL;
    return x ^ (x >> 31); } };`,
    java: `Map<Integer,Integer> m = new HashMap<>();

// 16 buckets, doubling when size > capacity * 0.75:
//   16, 32, 64, 128, 256, 512, 1024, 2048 ...
new HashMap<>((int)(expected / 0.75f) + 1);   // skip every rehash

// Java re-mixes every hash before masking:
//     h = key.hashCode(); h ^= (h >>> 16);
// so the identity-hash attack that works on libstdc++ does not.

// and since Java 8, a bucket with more than 8 entries converts to a
// RED-BLACK TREE, so a collision attack degrades to O(log n), not O(n).

// each entry is a Node: hash + key ref + value ref + next ref, ~32B
// plus the boxed key and value.`,
    decl: {
      py: [
        { decl: "dict resize threshold", bytes: "2/3 full", note: "measured sizes: 232, 360, 640, 1176, 2272, 4696, 9312, 18520, 36960 bytes" },
        { decl: "compact dict (3.6+)", bytes: "two arrays", note: "entries + sparse index — the reason insertion order is preserved" },
        { decl: "hash(int)", bytes: "the identity", note: "hash(-1) is -2, because -1 means error in the C API" },
        { decl: "hash(str)", bytes: "randomised per process", note: "PYTHONHASHSEED; deliberate protection against collision attacks" },
        { decl: "1e6 int->int dict", bytes: "~40-70 MB", note: "two array.array('i') holding the same data is 8 MB" },
      ],
      cpp: [
        { decl: "max_load_factor()", bytes: "1.0 by default", note: "rehash at 100% full; lower it to trade memory for fewer collisions" },
        { decl: "bucket_count()", bytes: "13, 29, 59, 127, 257, 541, 1109", note: "primes on libstdc++ — measured, not quoted" },
        { decl: "reserve(n)", bytes: "skips every rehash", note: "the single cheapest unordered_map optimisation" },
        { decl: "std::hash<size_t>", bytes: "the IDENTITY", note: "the whole anti-hash attack. Mix the key before inserting" },
        { decl: "no std::hash for pair", bytes: "does not compile", note: "fold into one integer, or use map<> instead" },
      ],
      java: [
        { decl: "default load factor", bytes: "0.75", note: "doubling from 16; a space/time trade you can set in the constructor" },
        { decl: "hash spreading", bytes: "h ^ (h >>> 16)", note: "why the libstdc++ identity attack does not work here" },
        { decl: "treeify threshold", bytes: "8 entries per bucket", note: "converts a chain to a red-black tree — O(log n) worst case, not O(n)" },
        { decl: "Node per entry", bytes: "~32B + boxed key/value", note: "a HashMap<Integer,Integer> of 1e6 is roughly 80 MB" },
        { decl: "TreeMap", bytes: "O(log n)", note: "what you give up with a hash: sorted iteration, floorKey, ceilingKey" },
      ],
    },
    measured: "[C++]  D04 bucket counts as it grew: 13 29 59 127 257 541 1109 \n[C++]  D04lf max_load_factor=1 current=0.901713 buckets=1109 for 1000 entries\n[C++]  D04mem libstdc++ unordered_map is buckets + a NODE per entry (~24B each), so it is roughly 3-4x a vector holding the same pairs\n[C++]  D04coll 200 keys chosen as multiples of bucket_count -> worst bucket holds 200 entries; ordinary keys -> worst bucket holds 1\n[C++]  D04why std::hash<size_t> is the IDENTITY on libstdc++, so an adversary who knows\n[C++]  D04cmp 200000 random keys: unordered_map faster to build -> true, faster to look up -> true  — but map gives you sorted iteration and lower_bound, which no hash can\n[Java] D04 HashMap starts with 16 buckets and doubles when size > capacity * 0.75. Growth: 16, 32, 64, 128, 256, 512, 1024, 2048 for the default load factor.\n[Java] D04lf the 0.75 default is a space/time trade: higher packs tighter and collides more, lower wastes buckets. new HashMap<>(expected / 0.75f + 1) skips every rehash when you know the size in advance.\n[Java] D04node each entry is a Node object: hash, key ref, value ref, next ref = ~32B plus the boxed key and value. A HashMap<Integer,Integer> of 1e6 entries is roughly 80MB; an int[] pair of arrays is 8MB.\n[Java] D04tree since Java 8, a bucket with more than 8 entries converts to a RED-BLACK TREE, so a collision attack degrades to O(log n) rather than O(n). C++ has no such protection.\n[Java] D04hash Java re-mixes every hash (h ^ h>>>16) before masking, so the identity-hash attack that works on libstdc++ does not work here. size=1000\n[Java] D04cmp 200000 random keys: HashMap faster to build -> true, faster to look up -> true  — but TreeMap gives sorted iteration, floorKey and ceilingKey, which no hash can (checksum true)\n[Py]   D04 dict byte sizes as it grew: [232, 360, 640, 1176, 2272, 4696, 9312, 18520, 36960]\n[Py]   D04lf CPython resizes when it is 2/3 full, and since 3.6 a dict is two arrays — a compact entries array plus a sparse index array — which is why it both preserves insertion order and costs less than the classic open-addressing table.\n[Py]   D04mem a dict of 1e6 int->int is roughly 40-70MB depending on fill; two array.array(\"i\") holding the same data is 8MB. The convenience is not free.\n[Py]   D04hash hash(int) is the identity for small ints: hash(1)=1 hash(2)=2 hash(-1)=-2  <- -1 is special-cased to -2 because -1 signals an error in CPython\n[Py]   D04str hash(\"abc\") is RANDOMISED per process by default (PYTHONHASHSEED), specifically to stop the collision attack that plain integer keys are still open to.\n[Py]   D04cmp 200000 random keys: dict build faster than a full sort of the same keys, and lookup is O(1) amortised (checksum ok: True)\n[Py]   D04noorder there is no ordered-map equivalent in the stdlib: a dict gives you insertion order, never sorted order. For floor/ceiling queries you need a sorted list plus bisect, which is O(n) to insert — the gap C++ fills with std::map and Java with TreeMap.",
    differs:
      "The collision attack is the executed headline. In C++, 200 keys chosen as multiples of the bucket count all landed in <b>one bucket of 200 entries</b>, while ordinary keys gave a worst bucket of <b>1</b> — that is O(1) becoming O(n) on input an adversary chose. Java is immune to the same trick because it re-mixes every hash, and converts a long chain to a tree regardless. The growth curves were measured rather than quoted: C++ went <code>13, 29, 59, 127, 257, 541, 1109</code>, Java doubles from 16 at load factor 0.75, and CPython's dict resizes at two-thirds full. All three confirmed the hash map builds and looks up faster than the ordered alternative — which is exactly the trade, since only the ordered one answers \"nearest key to x\".",
    trap: "If you use <code>unordered_map</code> with integer keys on a judge that runs adversarial tests, assume the identity hash will be exploited. Mix the key with a random constant, or use <code>map</code> and accept the log factor.",
    see: ["LC 1 · Two Sum", "LC 128 · Longest Consecutive Sequence", "LC 560 · Subarray Sum Equals K", "LC 49 · Group Anagrams"],
  },
];
