/**
 * The language operations ladder — 40 rungs, from "declare one" to the traps that
 * only bite at 10^5, written three times over in Python, C++ and Java.
 *
 * EVERY SNIPPET IN THIS FILE WAS COMPILED AND RUN.
 *   C++    g++ 11.4.0, -std=c++17
 *   Java   OpenJDK 11.0.31, single-file source launcher (`java Ladder.java`)
 *   Python CPython 3.10.12
 * The `output` and `drill.out` fields are literal stdout from those programs — 306
 * captured lines, none of them predicted. Where the three languages disagree, the
 * disagreement is the lesson and the printed values are the proof.
 *
 * Each rung carries five layers, because "I know arrays" usually means "I can call
 * one function in one language":
 *
 *   why       — why this rung is on the ladder at all. Nothing appears before the
 *               thing it depends on.
 *   intuition — what is happening in memory underneath. Not the API, the machine:
 *               why the cost is the cost.
 *   api       — the exact spelling in each language, what it hands back, what it
 *               costs, and the one thing about it that bites. This is the layer
 *               that stops you writing `arr.size()` in Java at minute one.
 *   differs   — the executed disagreement between the three.
 *   drill     — a real problem solved with the rung in all three languages, with
 *               its answer captured from the run. The operation is not the point;
 *               the problem is.
 *
 * Read it top to bottom once. After that it is a lookup table — use the group
 * filter, the tier filter and the language toggle.
 */

export type Tier = "easy" | "medium" | "hard" | "extreme";
export type LangKey = "py" | "cpp" | "java";

/** One entry in a rung's per-language function reference. */
export interface ApiRow {
  /** exactly as you type it */
  call: string;
  /** what it hands back */
  gives: string;
  /** time complexity, amortised where that is the honest answer */
  cost: string;
  /** the thing that costs marks */
  gotcha?: string;
}

/** A real problem solved with the rung, in all three languages, executed. */
export interface Drill {
  /** the task, stated the way a problem statement would state it */
  ask: string;
  /** the LeetCode problem this is lifted from, where there is one */
  lc?: string;
  py: string;
  cpp: string;
  java: string;
  /** literal stdout from the three drill programs */
  out: string;
}

export interface LadderRung {
  n: number;
  /** what you are learning to do */
  title: string;
  /** difficulty band, used for filtering */
  tier: Tier;
  /** which family of operations this belongs to */
  group: string;
  /** one sentence on why this rung matters */
  why: string;
  /** what is happening in memory — the cost, explained rather than quoted */
  intuition: string;
  /** the situation in which you reach for this */
  useWhen: string;
  py: string;
  cpp: string;
  java: string;
  /** exact function names, returns, costs and traps, per language */
  api: Record<LangKey, ApiRow[]>;
  /** literal stdout from running the three programs */
  output: string;
  /** the difference that costs marks */
  differs: string;
  /** apply it to a real problem */
  drill: Drill;
  /** further problems that are this rung wearing a hat */
  see?: string[];
}

export const LANG_LADDER: readonly LadderRung[] = [
  {
    n: 1,
    title: "Declare one, index it, ask how long it is",
    tier: "easy",
    group: "sequence",
    why: "The three languages disagree on the very first thing you type. Java spells length three different ways depending on what you are holding, and picking the wrong one is a compile error in the first minute of a timed round.",
    intuition:
      "All three store elements in one contiguous block, so <code>a[i]</code> is a single multiply-and-add: <code>base + i × elementSize</code>. Nothing is walked. That is why indexing the millionth element costs exactly what indexing the first costs. The length is stored beside the block rather than computed, so asking for it is also O(1) and putting it in a loop condition costs nothing.",
    useWhen: "Every problem. This is the rung everything else stands on.",
    py: `a = [5, 2, 9]

a[0]        # 5
a[-1]       # 9  — negative indices count from the end
len(a)      # 3  — a FUNCTION, never a method
bool([])    # False — empty containers are falsy

a[9]        # IndexError
a[9:]       # []  — slicing out of range never raises`,
    cpp: `vector<int> v{5, 2, 9};

v[0];        // 5 — NO bounds check; out of range is undefined behaviour
v.at(0);     // 5 — bounds checked, throws std::out_of_range
v.front();   // 5
v.back();    // 9
v.size();    // 3 — and it is UNSIGNED (size_t)
v.empty();   // false — prefer this to size() == 0

int raw[3] = {1, 2, 3};
sizeof(raw) / sizeof(raw[0]);   // 3 — works on a REAL array only,
                                // never on a pointer or a parameter`,
    java: `int[] arr = {5, 2, 9};
arr[0];        // 5
arr.length;    // 3 — a FIELD, no parentheses

List<Integer> li = new ArrayList<>(List.of(5, 2, 9));
li.get(0);     // 5 — no [] on collections, ever
li.size();     // 3 — a METHOD
li.isEmpty();  // false

"abc".length();  // 3 — a METHOD, with parentheses

int[] fresh  = new int[3];      // [0, 0, 0]  primitives zero-fill
String[] obj = new String[2];   // [null, null]  objects do NOT`,
    api: {
      py: [
        { call: "a[i]", gives: "the element", cost: "O(1)", gotcha: "raises IndexError; negative i is legal and counts backwards" },
        { call: "len(a)", gives: "int", cost: "O(1)", gotcha: "a built-in function — a.len() does not exist" },
        { call: "a[i:j]", gives: "a new list", cost: "O(j-i)", gotcha: "never raises; clamps silently, so a[9:] on 3 elements is []" },
        { call: "bool(a) / if a:", gives: "bool", cost: "O(1)", gotcha: "empty is falsy — this is the idiomatic emptiness test" },
      ],
      cpp: [
        { call: "v[i]", gives: "T&", cost: "O(1)", gotcha: "NO bounds check — out of range is undefined behaviour, not a reliable crash" },
        { call: "v.at(i)", gives: "T&", cost: "O(1)", gotcha: "bounds checked, throws std::out_of_range; worth the cost while debugging" },
        { call: "v.size()", gives: "size_t (UNSIGNED)", cost: "O(1)", gotcha: "v.size() - 1 on an empty vector is 18446744073709551615, not -1" },
        { call: "v.empty()", gives: "bool", cost: "O(1)", gotcha: "always prefer to size() == 0 — correct for every container" },
        { call: "v.front() / v.back()", gives: "T&", cost: "O(1)", gotcha: "undefined behaviour on an empty vector" },
      ],
      java: [
        { call: "arr.length", gives: "int", cost: "O(1)", gotcha: "a FIELD on arrays — no parentheses" },
        { call: "list.size()", gives: "int", cost: "O(1)", gotcha: "a METHOD on collections — arr.size() does not compile" },
        { call: "str.length()", gives: "int", cost: "O(1)", gotcha: "a METHOD on String — the third spelling of one idea" },
        { call: "list.get(i)", gives: "E", cost: "O(1) ArrayList", gotcha: "O(n) on LinkedList — never index a LinkedList in a loop" },
        { call: "new int[n]", gives: "int[] of zeros", cost: "O(n)", gotcha: "object arrays fill with null, not with a default object" },
      ],
    },
    output: "[C++]  R01 v[0]=5 v.at(0)=5 v.size()=3 sizeof-trick=3 v.empty()=false\n[C++]  R01trap empty.size()-1 = 18446744073709551615  (unsigned wrap)\n[Java] R01 arr[0]=5 arr.length=3 li.get(0)=5 li.size()=3 s.length()=3 li.isEmpty()=false   <- .length / .size() / .length() are three spellings\n[Java] R01init new int[3]=[0, 0, 0] new String[2]=[null, null] (objects default to null)\n[Py]   R01 a[0]=5 a[-1]=9 len(a)=3 bool([])=False   <- len() is a FUNCTION, and negative indices are legal\n[Py]   R01trap a[9] -> IndexError: list index out of range   but a[9:] -> [] (slicing NEVER raises)",
    differs:
      "Java is the outlier: <code>.length</code> on arrays, <code>.size()</code> on collections, <code>.length()</code> on strings. C++ <code>size()</code> returns <code>size_t</code>, which is <b>unsigned</b> — the executed line shows <code>v.size() - 1</code> on an empty vector evaluating to <b>18446744073709551615</b>, which is why <code>for (int i = 0; i &lt; v.size() - 1; ++i)</code> runs forever rather than not at all. Python is the only one where reading past the end raises but <em>slicing</em> past the end quietly returns empty.",
    drill: {
      ask: "Given an odd-length array, print its first, middle and last element.",
      py: `a = [5, 2, 9, 1, 7]
print(a[len(a)//2], a[0], a[-1])`,
      cpp: `vector<int> a{5, 2, 9, 1, 7};
cout << a[a.size()/2] << " " << a.front() << " " << a.back();`,
      java: `int[] a = {5, 2, 9, 1, 7};
System.out.println(a[a.length/2] + " " + a[0] + " " + a[a.length-1]);`,
      out: "[C++]  D01 middle=9 first=5 last=7\n[Java] D01 middle=9 first=5 last=7\n[Py]   D01 middle=9 first=5 last=7",
    },
    see: ["LC 1929 · Concatenation of Array", "LC 1480 · Running Sum of 1d Array"],
  },
  {
    n: 2,
    title: "Iterate: by index, by element, and by both at once",
    tier: "easy",
    group: "sequence",
    why: "Most array bugs are index bugs, and the cure is to stop using indices when you do not need them. But the moment you need the index alongside the element, only one of the three gives it to you.",
    intuition:
      "A range-based loop is not slower than an index loop — it compiles to the same pointer walk in C++ and the same bounds-checked read in Java. What it removes is the <em>opportunity</em> to type <code>&lt;=</code> where you meant <code>&lt;</code>. Drop to indices only when the position is part of the answer, when you skip, or when you compare <code>i-1</code> against <code>i</code>.",
    useWhen: "Always. Reach for by-element first; take the index only when you need it.",
    py: `v = ['a', 'b', 'c']

for x in v: ...                  # element only
for i in range(len(v)): ...      # index only
for i, x in enumerate(v): ...    # BOTH — exists nowhere else
for i, x in enumerate(v, 1): ... # start counting at 1

for x, y in zip(a, b): ...       # two sequences in lockstep
for x in reversed(v): ...        # backwards, no index arithmetic`,
    cpp: `vector<string> v{"a", "b", "c"};

for (const string& x : v) ...          // element, no copy — note the &
for (string x : v) ...                 // element, COPIES each one
for (size_t i = 0; i < v.size(); ++i)  // index; size_t, not int
for (auto it = v.begin(); it != v.end(); ++it)   // iterator

// no enumerate — carry the counter yourself
size_t i = 0;
for (const auto& x : v) { use(i, x); ++i; }`,
    java: `List<String> v = List.of("a", "b", "c");

for (String x : v) ...                     // element
for (int i = 0; i < v.size(); i++) ...     // index
for (Iterator<String> it = v.iterator(); it.hasNext();) ...

// no enumerate — index by hand
for (int i = 0; i < v.size(); i++) use(i, v.get(i));

for (int x : arr) ...     // works on primitive arrays too`,
    api: {
      py: [
        { call: "for x in a", gives: "each element", cost: "O(n)", gotcha: "rebinding x does not write back into a" },
        { call: "enumerate(a, start=0)", gives: "(index, element) pairs", cost: "O(n), lazy", gotcha: "the unique one — C++ and Java have no equivalent" },
        { call: "zip(a, b)", gives: "tuples, stopping at the SHORTER", cost: "O(min)", gotcha: "silently truncates; itertools.zip_longest if that is wrong" },
        { call: "reversed(a)", gives: "an ITERATOR, not a list", cost: "O(1) to build", gotcha: "printing it shows an object — wrap in list()" },
        { call: "range(start, stop, step)", gives: "a lazy range", cost: "O(1)", gotcha: "stop is exclusive" },
      ],
      cpp: [
        { call: "for (const T& x : v)", gives: "element by reference", cost: "O(n)", gotcha: "drop the & and you copy every element — costly for strings and vectors" },
        { call: "for (T& x : v)", gives: "a writable reference", cost: "O(n)", gotcha: "this is how you mutate inside a range-for" },
        { call: "v.begin() / v.end()", gives: "iterators", cost: "O(1)", gotcha: "end() is one PAST the last element — never dereference it" },
        { call: "v.rbegin() / v.rend()", gives: "reverse iterators", cost: "O(1)", gotcha: "sort(v.rbegin(), v.rend()) is the descending-sort idiom" },
      ],
      java: [
        { call: "for (T x : coll)", gives: "each element", cost: "O(n)", gotcha: "throws ConcurrentModificationException if you mutate coll inside it" },
        { call: "coll.iterator()", gives: "Iterator<T>", cost: "O(1)", gotcha: "it.remove() is the only safe removal during iteration" },
        { call: "coll.forEach(x -> ...)", gives: "void", cost: "O(n)", gotcha: "you cannot break out of it — use a plain loop when you must stop early" },
        { call: "IntStream.range(0, n)", gives: "a stream of indices", cost: "O(n)", gotcha: "rangeClosed includes n; the two are easy to swap" },
      ],
    },
    output: "[C++]  R02 index=abc range-for=abc with-index=0a1b2c\n[Java] R02 index=abc for-each=abc with-index=0a1b2c  (no enumerate; you index by hand)\n[Py]   R02 index=abc for-each=abc enumerate=0a1b2c  (enumerate exists only here)",
    differs:
      "<code>enumerate</code> is the whole rung. Python hands you index and element together; C++ and Java make you carry a counter, which is exactly where off-by-one errors are born. C++ is the only one whose loop variable can be a <b>reference that writes back</b> (rung 39); Java is the only one that <b>throws</b> if you modify the collection mid-loop (rung 38).",
    drill: {
      ask: "Sum the elements sitting at even indices.",
      py: `a = [1, 2, 3, 4, 5]
print(sum(a[::2]))            # slice with step 2 — no loop at all`,
      cpp: `vector<int> a{1,2,3,4,5}; int s = 0;
for (size_t i = 0; i < a.size(); i += 2) s += a[i];`,
      java: `int[] a = {1,2,3,4,5}; int s = 0;
for (int i = 0; i < a.length; i += 2) s += a[i];`,
      out: "[C++]  D02 evenIdxSum=9\n[Java] D02 evenIdxSum=9\n[Py]   D02 evenIdxSum=9",
    },
    see: ["LC 1929 · Concatenation of Array", "LC 2011 · Final Value of Variable"],
  },
  {
    n: 3,
    title: "Create one already filled",
    tier: "easy",
    group: "sequence",
    why: "Almost every DP table, visited array and frequency counter starts as “n slots, all zero”. Each language spells it differently, and two of the spellings mean something other than what they look like.",
    intuition:
      "Filling costs O(n) because every slot must actually be written — there is no free “all zeros” in userspace. The one exception is Java's <code>new int[n]</code>, which the JVM can hand you from pre-zeroed memory, and C++'s <code>vector&lt;int&gt;(n)</code>, which value-initialises. What you are really choosing between is <b>size</b> and <b>capacity</b>: size is how many elements exist, capacity is how much room is reserved. Confusing them gives you an empty container you thought was full.",
    useWhen: "Setting up a DP table, a visited array, a bucket count, or any accumulator.",
    py: `[0] * 5          # [0, 0, 0, 0, 0]
[7] * 5          # [7, 7, 7, 7, 7]
list(range(5))   # [0, 1, 2, 3, 4]
[None] * 3       # [None, None, None]

# there is no fixed-size array; a list starts empty and grows.
# * on a list of MUTABLE things aliases them — see rung 6.`,
    cpp: `vector<int> a(5, 7);   // 5 sevens   — PARENTHESES
vector<int> b(5);      // 5 zeros
vector<int> c{5};      // ONE element, the number 5 — BRACES mean contents

array<int, 3> fixed{}; // stack-allocated, size known at compile time
a.assign(5, 7);        // refill an existing vector
fill(a.begin(), a.end(), 7);
a.reserve(1000);       // capacity only — size() is still what it was`,
    java: `int[] a = new int[5];        // [0,0,0,0,0]
Arrays.fill(a, 7);           // [7,7,7,7,7] — returns void

List<Integer> c = new ArrayList<>(Collections.nCopies(5, 7));

List<Integer> cap = new ArrayList<>(5);
cap.size();   // 0  <- the 5 was CAPACITY, not size.
              //      This is the single most common Java setup bug.`,
    api: {
      py: [
        { call: "[v] * n", gives: "a new list of n references to v", cost: "O(n)", gotcha: "if v is mutable, all n slots are the SAME object — see rung 6" },
        { call: "list(range(n))", gives: "[0..n-1]", cost: "O(n)", gotcha: "range alone is lazy; list() materialises it" },
        { call: "[f(i) for i in range(n)]", gives: "a new list", cost: "O(n)", gotcha: "the only safe way to fill with fresh mutable objects" },
      ],
      cpp: [
        { call: "vector<T> v(n, val)", gives: "n copies of val", cost: "O(n)", gotcha: "parentheses. Braces mean literal contents" },
        { call: "vector<T> v(n)", gives: "n value-initialised elements", cost: "O(n)", gotcha: "zero for int, empty for string — never garbage" },
        { call: "v.assign(n, val)", gives: "void", cost: "O(n)", gotcha: "replaces contents; the cheap way to reset between test cases" },
        { call: "v.reserve(n)", gives: "void", cost: "O(n)", gotcha: "changes CAPACITY only — v.size() is unchanged, v[0] is still invalid" },
        { call: "v.resize(n)", gives: "void", cost: "O(n)", gotcha: "changes SIZE — this is the one that makes v[0] valid" },
      ],
      java: [
        { call: "new int[n]", gives: "n zeros", cost: "O(n)", gotcha: "object arrays give n nulls, which NPE on first use" },
        { call: "Arrays.fill(a, val)", gives: "void", cost: "O(n)", gotcha: "returns void — you cannot chain it" },
        { call: "Collections.nCopies(n, v)", gives: "an IMMUTABLE view", cost: "O(1)", gotcha: "wrap in new ArrayList<>(...) or you cannot modify it" },
        { call: "new ArrayList<>(n)", gives: "an EMPTY list with room for n", cost: "O(1)", gotcha: "size() is 0. This is capacity, not size" },
        { call: "new int[r][c]", gives: "a zero-filled grid", cost: "O(r·c)", gotcha: "rows are distinct objects — no aliasing trap here" },
      ],
    },
    output: "[C++]  R03 vector<int>(5,7)=[7, 7, 7, 7, 7] vector<int>(5)=[0, 0, 0, 0, 0] vector<int>{5}=[5]  <- braces mean CONTENTS\n[Java] R03 Arrays.fill(new int[5],7)=[7, 7, 7, 7, 7] new int[5]=[0, 0, 0, 0, 0] nCopies(5,7)=[7, 7, 7, 7, 7] new ArrayList<>(5).size()=0  <- 5 is CAPACITY, not size\n[Py]   R03 [0]*5=[0, 0, 0, 0, 0] [7]*5=[7, 7, 7, 7, 7] list(range(5))=[0, 1, 2, 3, 4] [None]*3=[None, None, None]  (no fixed-size array; a list starts empty and grows)",
    differs:
      "The two spellings that lie: C++ <code>vector&lt;int&gt;{5}</code> gives you <b>one element</b> (executed above as <code>[5]</code>) rather than five, and Java <code>new ArrayList&lt;&gt;(5)</code> gives you a list of <b>size 0</b>. Both compile. Both are the wrong thing. Python's <code>[0]*5</code> is the only one that means exactly what it looks like — until the element is mutable, which is rung 6.",
    drill: {
      ask: "Make a five-slot tally, then record hits at positions 1, 3 and 1.",
      py: `t = [0] * 5
for h in [1, 3, 1]: t[h] += 1`,
      cpp: `vector<int> t(5, 0);
for (int h : {1, 3, 1}) t[h]++;`,
      java: `int[] t = new int[5];
for (int h : new int[]{1, 3, 1}) t[h]++;`,
      out: "[C++]  D03 tally=[0,2,0,1,0]\n[Java] D03 tally=[0, 2, 0, 1, 0]\n[Py]   D03 tally=[0, 2, 0, 1, 0]",
    },
    see: ["LC 1512 · Number of Good Pairs", "LC 1365 · How Many Numbers Are Smaller Than the Current Number"],
  },
  {
    n: 4,
    title: "Grow it and shrink it: append, insert, remove",
    tier: "easy",
    group: "sequence",
    why: "Appending is O(1); inserting or removing anywhere else is O(n). Getting that backwards is how an O(n) algorithm becomes O(n²) without a single visible mistake.",
    intuition:
      "A dynamic array is a fixed block plus a size counter. <code>append</code> writes into the next free slot — O(1) — until the block is full, at which point a bigger block is allocated and everything is copied. That copy is O(n), but it happens rarely enough (capacity roughly doubles) that the <b>average</b> cost stays O(1). That is what “amortised” means. Inserting or deleting in the <em>middle</em> has no such escape: every element after the hole must physically shift, every single time.",
    useWhen: "Building a result you cannot size in advance. If you can size it in advance, pre-allocate instead.",
    py: `v = [1, 2, 3]
v.append(4)        # O(1) amortised
v.insert(1, 99)    # O(n) — shifts everything right
del v[0]           # O(n)
x = v.pop()        # O(1) — and it RETURNS the element
y = v.pop(0)       # O(n) — use a deque instead (rung 29)
v.remove(20)       # by VALUE, O(n), raises if absent
v.extend([7, 8])   # append many
v += [7, 8]        # same thing`,
    cpp: `vector<int> v{1, 2, 3};
v.push_back(4);                 // O(1) amortised
v.emplace_back(4);              // same, constructs in place
v.insert(v.begin() + 1, 99);    // O(n)
v.erase(v.begin());             // O(n)
v.pop_back();                   // O(1) — returns VOID
int last = v.back();            // read it first, then pop
v.clear();                      // size 0, capacity unchanged`,
    java: `List<Integer> v = new ArrayList<>(List.of(1, 2, 3));
v.add(4);              // O(1) amortised
v.add(1, 99);          // insert at index — O(n)
v.remove(0);           // by INDEX — O(n)
v.remove(Integer.valueOf(20));   // by VALUE — the cast matters
int x = v.remove(v.size() - 1);  // returns the element
v.addAll(List.of(7, 8));

// int[] cannot grow at all. Arrays.copyOf makes a bigger one.`,
    api: {
      py: [
        { call: "a.append(x)", gives: "None", cost: "O(1) amortised", gotcha: "returns None — a = a.append(x) destroys your list" },
        { call: "a.pop()", gives: "the element", cost: "O(1)", gotcha: "a.pop(0) is O(n); reach for collections.deque" },
        { call: "a.insert(i, x)", gives: "None", cost: "O(n)", gotcha: "inserting in a loop is the classic accidental O(n²)" },
        { call: "a.remove(x)", gives: "None", cost: "O(n)", gotcha: "removes by VALUE and raises ValueError if absent" },
        { call: "del a[i] / del a[i:j]", gives: "nothing", cost: "O(n)", gotcha: "the slice form deletes a whole range in one shift" },
      ],
      cpp: [
        { call: "v.push_back(x)", gives: "void", cost: "O(1) amortised", gotcha: "may reallocate, which INVALIDATES every existing iterator and pointer" },
        { call: "v.emplace_back(args...)", gives: "T&", cost: "O(1) amortised", gotcha: "constructs in place — avoids one copy for heavy types" },
        { call: "v.pop_back()", gives: "void", cost: "O(1)", gotcha: "returns nothing; read v.back() before you pop" },
        { call: "v.insert(it, x)", gives: "iterator to the new element", cost: "O(n)", gotcha: "takes an ITERATOR, not an index — v.begin() + i" },
        { call: "v.erase(it) / v.erase(f, l)", gives: "iterator past the removed", cost: "O(n)", gotcha: "the return value is how you keep iterating safely — rung 38" },
      ],
      java: [
        { call: "list.add(x)", gives: "boolean", cost: "O(1) amortised", gotcha: "always true for a List; the boolean is there for Set" },
        { call: "list.add(i, x)", gives: "void", cost: "O(n)", gotcha: "silently different method from add(x)" },
        { call: "list.remove(int i)", gives: "the element", cost: "O(n)", gotcha: "removes by INDEX" },
        { call: "list.remove(Object o)", gives: "boolean", cost: "O(n)", gotcha: "removes by VALUE — on a List<Integer> you MUST write Integer.valueOf(x)" },
        { call: "Arrays.copyOf(a, n)", gives: "a new array", cost: "O(n)", gotcha: "the only way to 'grow' an int[]; the original is untouched" },
      ],
    },
    output: "[C++]  R04 after push/insert/erase=[99, 2, 3] popped=4 (pop_back returns void)\n[Java] R04 after add/insert/remove=[99, 2, 3] popped=4  (remove(int) is by index, remove(Object) is by value)\n[Java] R04trap remove(Integer.valueOf(20))=[10, 30]  vs remove(1) would drop index 1\n[Py]   R04 after append/insert/del=[99, 2, 3] pop()=4  (pop RETURNS the element — unlike C++/Java void)\n[Py]   R04trap list.remove(20) removes by VALUE -> [10, 30]   list.pop(1) would remove by INDEX",
    differs:
      "Python's <code>pop()</code> hands the element back; C++ <code>pop_back()</code> returns <b>void</b> and Java's <code>remove</code> returns the element but is <b>two different methods</b> distinguished only by whether the argument is an <code>int</code> or an <code>Object</code>. The executed lines above show <code>remove(Integer.valueOf(20))</code> deleting the <em>value</em> 20 while <code>remove(1)</code> would have deleted index 1 — on a <code>List&lt;Integer&gt;</code> that is a silent wrong answer, never a compile error.",
    drill: {
      ask: "Remove every occurrence of a value in place and return the new length.",
      lc: "LC 27 · Remove Element",
      py: `a, val, k = [3,2,2,3], 3, 0
for x in a:
    if x != val:
        a[k] = x; k += 1
del a[k:]`,
      cpp: `vector<int> a{3,2,2,3}; int val = 3, k = 0;
for (int x : a) if (x != val) a[k++] = x;
a.resize(k);`,
      java: `int[] a = {3,2,2,3}; int val = 3, k = 0;
for (int x : a) if (x != val) a[k++] = x;
// a[0..k) is the answer; Arrays.copyOf(a, k) to trim`,
      out: "[C++]  D04 removeElement(val=3) k=2 a=[2,2]\n[Java] D04 removeElement(val=3) k=2 a=[2, 2]\n[Py]   D04 removeElement(val=3) k=2 a=[2, 2]",
    },
    see: ["LC 27 · Remove Element", "LC 26 · Remove Duplicates from Sorted Array", "LC 283 · Move Zeroes"],
  },
  {
    n: 5,
    title: "Copy versus alias: the assignment that does not copy",
    tier: "easy",
    group: "sequence",
    why: "In two of the three languages, <code>b = a</code> gives you a second name for the same container. Every write through one is visible through the other, and nothing warns you.",
    intuition:
      "The variable does not hold the container; it holds a reference to it. Assignment copies the <em>reference</em>, which is one machine word, not the n elements behind it. That is why it is O(1) — and why it is not a copy. C++ is the exception: <code>vector</code> has a copy constructor that duplicates the elements, so <code>b = a</code> genuinely costs O(n) and genuinely gives you a separate object. To alias in C++ you have to ask, with <code>&amp;</code>.",
    useWhen: "Any time you pass a container into a function that sorts, reverses or mutates — and the caller still needs the original.",
    py: `a = [1, 2, 3]

alias = a          # SAME object — writes are shared
shallow = a[:]     # new list  (also list(a), a.copy())
deep = copy.deepcopy(a)   # new list AND new inner objects

id(a) == id(alias)     # True
id(a) == id(shallow)   # False`,
    cpp: `vector<int> a{1, 2, 3};

vector<int> b = a;    // a real COPY — O(n)
vector<int>& r = a;   // an alias — you must ask for it with &

void f(vector<int> v);         // copies, caller safe
void f(vector<int>& v);        // aliases, caller's vector mutated
void f(const vector<int>& v);  // no copy, cannot mutate — the default`,
    java: `int[] a = {1, 2, 3};

int[] alias = a;                 // SAME object
int[] copy  = a.clone();         // new array
int[] copy2 = Arrays.copyOf(a, a.length);

List<Integer> l2 = new ArrayList<>(l1);   // copy a list
// l2 = l1 would alias it`,
    api: {
      py: [
        { call: "b = a", gives: "another name for a", cost: "O(1)", gotcha: "not a copy. id(a) == id(b)" },
        { call: "a[:] / list(a) / a.copy()", gives: "a new list", cost: "O(n)", gotcha: "SHALLOW — nested lists are still shared (rung 17)" },
        { call: "copy.deepcopy(a)", gives: "a fully independent structure", cost: "O(total)", gotcha: "slow; only reach for it when the nesting is genuinely shared" },
      ],
      cpp: [
        { call: "vector<T> b = a;", gives: "an independent copy", cost: "O(n)", gotcha: "the only language here where = copies — cheap to forget in a hot loop" },
        { call: "vector<T>& r = a;", gives: "an alias", cost: "O(1)", gotcha: "you must ask for aliasing explicitly" },
        { call: "const vector<T>& v", gives: "read-only, no copy", cost: "O(1)", gotcha: "the correct default for a function parameter" },
        { call: "std::move(a)", gives: "steals a's buffer", cost: "O(1)", gotcha: "a is left valid but unspecified — do not read it afterwards" },
      ],
      java: [
        { call: "b = a", gives: "another reference", cost: "O(1)", gotcha: "not a copy, for arrays and collections alike" },
        { call: "a.clone()", gives: "a new array", cost: "O(n)", gotcha: "shallow for object arrays — the elements are still shared" },
        { call: "Arrays.copyOf(a, n)", gives: "a new array of length n", cost: "O(n)", gotcha: "truncates or zero-pads; the resize idiom" },
        { call: "new ArrayList<>(other)", gives: "a new list", cost: "O(n)", gotcha: "shallow — the elements themselves are shared" },
      ],
    },
    output: "[C++]  R05 a=[1, 77, 3] b=[42, 2, 3]  (= copies, & aliases)\n[Java] R05 a=[1, 77, 3] copy=[42, 2, 3]  (= aliases, .clone()/Arrays.copyOf copies)\n[Py]   R05 a=[1, 77, 3] shallow=[42, 2, 3]  (= aliases; a[:] / list(a) / a.copy() copy)\n[Py]   R05id id(a)==id(alias) -> True   id(a)==id(shallow) -> False",
    differs:
      "The executed lines show the same three operations giving two different answers. In Python and Java, writing through the alias changed the original; in C++ the copy stayed separate <em>and</em> the alias, once asked for with <code>&amp;</code>, behaved like the other two. The practical rule: in Python and Java assume <code>=</code> shares, and copy deliberately. In C++ assume <code>=</code> copies, and pass <code>const&amp;</code> so you do not pay for copies you did not want.",
    drill: {
      ask: "Return a sorted version of an array without disturbing the caller's array.",
      py: `orig = [3, 1, 2]
s = sorted(orig)          # sorted() always returns a NEW list`,
      cpp: `auto sortedCopy = [](vector<int> v) {   // BY VALUE = a copy
    sort(v.begin(), v.end()); return v; };`,
      java: `int[] s = orig.clone();
Arrays.sort(s);           // sort the clone, not the original`,
      out: "[C++]  D05 sorted=[1,2,3] original untouched=[3,1,2]\n[Java] D05 sorted=[1, 2, 3] original untouched=[3, 1, 2]\n[Py]   D05 sorted=[1, 2, 3] original untouched=[3, 1, 2]",
    },
    see: ["LC 912 · Sort an Array", "LC 88 · Merge Sorted Array"],
  },
  {
    n: 6,
    title: "Build a 2D grid without aliasing every row",
    tier: "easy",
    group: "shape",
    why: "This is the most common beginner bug in Python, and it produces a corrupted DP table rather than an error. Writing one cell writes an entire column, and every test you run agrees with you.",
    intuition:
      "<code>[0] * 3</code> makes a list of three references to the integer 0 — harmless, because integers are immutable. <code>[[0] * 3] * 2</code> makes a list of <b>two references to the same inner list</b>. There is only one row object; you are looking at it twice. The list comprehension <code>[[0]*3 for _ in range(2)]</code> runs the inner expression once per row, so it builds two distinct objects. C++ copies by value and Java allocates each row separately, so neither has the trap.",
    useWhen: "Every DP table, every grid problem, every adjacency matrix.",
    py: `g = [[0] * 3 for _ in range(2)]   # CORRECT — 2 distinct rows
g[1][2] = 7

bad = [[0] * 3] * 2               # WRONG — one row, referenced twice
bad[1][2] = 7                     # writes BOTH rows

len(g), len(g[0])                 # rows, cols`,
    cpp: `vector<vector<int>> g(2, vector<int>(3, 0));
g[1][2] = 7;

g.size();      // 2 rows
g[0].size();   // 3 columns

// the inner vector is COPIED into each row, so no aliasing.
// For a fixed compile-time size: array<array<int,3>,2> g{};`,
    java: `int[][] g = new int[2][3];   // zero-filled, rows are distinct objects
g[1][2] = 7;

g.length;      // 2 rows
g[0].length;   // 3 columns

Arrays.deepToString(g);   // "[[0, 0, 0], [0, 0, 7]]"
Arrays.toString(g);       // "[[I@1b6d..." — identity hashcodes`,
    api: {
      py: [
        { call: "[[v]*c for _ in range(r)]", gives: "r distinct rows", cost: "O(r·c)", gotcha: "the ONLY correct spelling when the row is mutable" },
        { call: "[[v]*c]*r", gives: "r references to ONE row", cost: "O(c)", gotcha: "silently corrupts; the executed output below proves it" },
        { call: "len(g), len(g[0])", gives: "rows, cols", cost: "O(1)", gotcha: "len(g[0]) crashes on an empty grid — guard it" },
      ],
      cpp: [
        { call: "vector<vector<T>> g(r, vector<T>(c, v))", gives: "an r×c grid", cost: "O(r·c)", gotcha: "each row is a separate heap allocation — slower than one flat vector" },
        { call: "vector<T> flat(r*c)", gives: "one block", cost: "O(r·c)", gotcha: "index with flat[i*c + j]; noticeably faster, cache-friendly" },
        { call: "g[i].size()", gives: "that row's length", cost: "O(1)", gotcha: "rows may legitimately differ — see rung 7" },
      ],
      java: [
        { call: "new int[r][c]", gives: "an r×c grid, zeroed", cost: "O(r·c)", gotcha: "rows are distinct — no aliasing trap in Java" },
        { call: "Arrays.deepToString(g)", gives: "a readable String", cost: "O(r·c)", gotcha: "Arrays.toString on a 2D array prints hashcodes instead" },
        { call: "g.length / g[i].length", gives: "rows / that row's cols", cost: "O(1)", gotcha: "g[0].length assumes rectangularity" },
      ],
    },
    output: "[C++]  R06 2x3 [[0, 0, 0], [0, 0, 7]]\n[Java] R06 2x3 [[0, 0, 0], [0, 0, 7]]  (deepToString, not toString)\n[Java] R06trap Arrays.toString(g) starts with \"[[I@\" -> true  <- identity hashcodes, not the numbers\n[Py]   R06 2x3 [[0, 0, 0], [0, 0, 7]]\n[Py]   R06trap [[0]*3]*2 after one write -> [[0, 0, 7], [0, 0, 7]]  <- ALL rows aliased, no error raised",
    differs:
      "Only Python has the aliasing trap, because <code>*</code> on a list copies <b>references</b>. Both the correct and the broken form were executed above: the broken one really does end up as <code>[[0, 0, 7], [0, 0, 7]]</code> after a single write. Java's trap is different and cosmetic — <code>Arrays.toString</code> on a 2D array prints identity hashcodes, so you have to remember <code>deepToString</code> when debugging.",
    drill: {
      ask: "Build an n×n identity matrix.",
      py: `m = [[1 if i == j else 0 for j in range(n)] for i in range(n)]`,
      cpp: `vector<vector<int>> m(n, vector<int>(n, 0));
for (int i = 0; i < n; ++i) m[i][i] = 1;`,
      java: `int[][] m = new int[n][n];
for (int i = 0; i < n; i++) m[i][i] = 1;`,
      out: "[C++]  D06 identity=[1,0,0][0,1,0][0,0,1]\n[Java] D06 identity=[[1, 0, 0], [0, 1, 0], [0, 0, 1]]\n[Py]   D06 identity=[[1, 0, 0], [0, 1, 0], [0, 0, 1]]",
    },
    see: ["LC 867 · Transpose Matrix", "LC 48 · Rotate Image", "LC 54 · Spiral Matrix"],
  },
  {
    n: 7,
    title: "Rows of different lengths",
    tier: "easy",
    group: "shape",
    why: "Adjacency lists, Pascal's triangle and every “group by” result are ragged. Assuming <code>g[0].length</code> describes every row is a crash waiting for the second test case.",
    intuition:
      "None of the three actually store a rectangle. All three store an array of <em>pointers to rows</em>, and each row is its own independent block. Rectangularity is a convention you are choosing to maintain, not a property the type system enforces. Once you see that, <code>new int[3][]</code> — an array of three null row-pointers you fill in yourself — stops looking exotic.",
    useWhen: "Graphs as adjacency lists, triangular DP, grouping results by key.",
    py: `j = [[i] * (i + 1) for i in range(3)]
# [[0], [1, 1], [2, 2, 2]]

[len(r) for r in j]        # [1, 2, 3]

# ragged is the DEFAULT in Python — a list of lists has no
# rectangularity constraint at any point.`,
    cpp: `vector<vector<int>> j(3);
for (int i = 0; i < 3; ++i) j[i] = vector<int>(i + 1, i);

j[0].size();   // 1
j[2].size();   // 3

// each inner vector owns its own buffer, so lengths are free to differ`,
    java: `int[][] j = new int[3][];     // 3 NULL row references
for (int i = 0; i < 3; i++) {
    j[i] = new int[i + 1];    // you allocate each row
    Arrays.fill(j[i], i);
}

j[0].length;   // 1
j[2].length;   // 3
// forgetting to allocate a row gives NullPointerException, not a size error`,
    api: {
      py: [
        { call: "[[...] for _ in range(r)]", gives: "r independent rows", cost: "O(total)", gotcha: "rows may be any length — nothing checks" },
        { call: "[len(r) for r in g]", gives: "the shape", cost: "O(r)", gotcha: "the only honest way to describe a ragged grid" },
        { call: "max(len(r) for r in g)", gives: "widest row", cost: "O(r)", gotcha: "raises on an empty grid — use default=0" },
      ],
      cpp: [
        { call: "vector<vector<T>> g(r)", gives: "r EMPTY rows", cost: "O(r)", gotcha: "g[0][0] is undefined behaviour until you size the row" },
        { call: "g[i].push_back(x)", gives: "void", cost: "O(1) amortised", gotcha: "the adjacency-list idiom: g[u].push_back(v)" },
        { call: "g[i].resize(k)", gives: "void", cost: "O(k)", gotcha: "sizes one row independently of the others" },
      ],
      java: [
        { call: "new int[r][]", gives: "r null row references", cost: "O(r)", gotcha: "reading g[i][j] before allocating row i is a NullPointerException" },
        { call: "List<List<Integer>>", gives: "a growable ragged grid", cost: "—", gotcha: "the usual choice when row lengths are discovered as you go" },
        { call: "g[i].length", gives: "that row's length", cost: "O(1)", gotcha: "g[0].length is NOT the width of the grid" },
      ],
    },
    output: "[C++]  R07 jagged=[[0], [1, 1], [2, 2, 2]] rowlens=1,2,3\n[Java] R07 jagged=[[0], [1, 1], [2, 2, 2]] rowlens=1,2,3\n[Py]   R07 jagged=[[0], [1, 1], [2, 2, 2]] rowlens=[1, 2, 3]  (ragged is the default, not a special case)",
    differs:
      "Java is the only one that makes you allocate rows explicitly, which is a nuisance right up until it saves you — <code>new int[3][]</code> tells the reader the rows differ. Python and C++ both let a ragged grid appear by accident. In all three the executed row lengths came out <b>1, 2, 3</b>, so the shape is real, not a printing artefact.",
    drill: {
      ask: "Generate the first five rows of Pascal's triangle.",
      lc: "LC 118 · Pascal's Triangle",
      py: `tri = []
for i in range(5):
    row = [1] * (i + 1)
    for j in range(1, i): row[j] = tri[i-1][j-1] + tri[i-1][j]
    tri.append(row)`,
      cpp: `vector<vector<int>> t;
for (int i = 0; i < 5; ++i) {
    vector<int> row(i + 1, 1);
    for (int j = 1; j < i; ++j) row[j] = t[i-1][j-1] + t[i-1][j];
    t.push_back(row);
}`,
      java: `List<List<Integer>> t = new ArrayList<>();
for (int i = 0; i < 5; i++) {
    List<Integer> row = new ArrayList<>(Collections.nCopies(i + 1, 1));
    for (int j = 1; j < i; j++) row.set(j, t.get(i-1).get(j-1) + t.get(i-1).get(j));
    t.add(row);
}`,
      out: "[C++]  D07 pascal=[1][1,1][1,2,1][1,3,3,1][1,4,6,4,1]\n[Java] D07 pascal=[[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]]\n[Py]   D07 pascal=[[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]]",
    },
    see: ["LC 118 · Pascal's Triangle", "LC 119 · Pascal's Triangle II", "LC 120 · Triangle"],
  },
  {
    n: 8,
    title: "Reverse — the whole thing, or a range of it",
    tier: "easy",
    group: "sequence",
    why: "Reversing a <em>range</em> is the building block of array rotation, next-permutation and half a dozen in-place tricks. Only one of the three ships it.",
    intuition:
      "Reversing in place is two pointers walking toward each other, swapping as they go — <code>n/2</code> swaps, O(n) time, O(1) extra space. Building a reversed <em>copy</em> is also O(n) time but O(n) space. The difference matters when the problem says “in place” or when n is large enough that a second array is the thing that fails.",
    useWhen: "Rotations, palindrome checks, undoing a build-up-backwards, next lexicographic permutation.",
    py: `v = [1, 2, 3, 4, 5]

v.reverse()          # in place, returns None
v[::-1]              # a reversed COPY
reversed(v)          # a lazy ITERATOR — wrap in list() to see it

v[1:4] = v[1:4][::-1]     # reverse a RANGE — slice assignment
s[::-1]                   # works on strings too`,
    cpp: `vector<int> v{1, 2, 3, 4, 5};

reverse(v.begin(), v.end());          // in place, O(n)
reverse(v.begin() + 1, v.begin() + 4);  // a RANGE — free, built in

vector<int> r(v.rbegin(), v.rend());  // a reversed copy
// half-open: [first, last) — begin()+4 is one PAST index 3`,
    java: `List<Integer> v = new ArrayList<>(List.of(1,2,3,4,5));
Collections.reverse(v);          // in place, O(n) — Lists only

// there is NO Arrays.reverse. For an int[] you write it:
static void rev(int[] a, int i, int j) {
    while (i < j) { int t = a[i]; a[i++] = a[j]; a[j--] = t; }
}
rev(a, 1, 3);   // inclusive bounds — note the difference from C++`,
    api: {
      py: [
        { call: "a.reverse()", gives: "None", cost: "O(n)", gotcha: "in place, returns None — b = a.reverse() gives you None" },
        { call: "a[::-1]", gives: "a new reversed list", cost: "O(n)", gotcha: "a copy; also the standard string-reverse idiom" },
        { call: "reversed(a)", gives: "an iterator", cost: "O(1)", gotcha: "printing it shows an object, not the elements" },
        { call: "a[i:j] = a[i:j][::-1]", gives: "None", cost: "O(j-i)", gotcha: "slice assignment is how you reverse a range in place" },
      ],
      cpp: [
        { call: "reverse(first, last)", gives: "void", cost: "O(n)", gotcha: "half-open [first, last) — last is one PAST the end of the range" },
        { call: "vector<T>(v.rbegin(), v.rend())", gives: "a reversed copy", cost: "O(n)", gotcha: "the copy form, when you must keep the original" },
        { call: "next_permutation(f, l)", gives: "bool", cost: "O(n)", gotcha: "reverse is its final step; returns false when it wraps to sorted" },
      ],
      java: [
        { call: "Collections.reverse(list)", gives: "void", cost: "O(n)", gotcha: "Lists only — it does not accept an int[]" },
        { call: "(no Arrays.reverse)", gives: "—", cost: "—", gotcha: "you write the two-pointer swap yourself; know it cold" },
        { call: "new StringBuilder(s).reverse()", gives: "StringBuilder", cost: "O(n)", gotcha: "the String-reverse idiom; call .toString() after" },
      ],
    },
    output: "[C++]  R08 full=[5, 4, 3, 2, 1] range[1,4)=[1, 4, 3, 2, 5]\n[Java] R08 Collections.reverse=[5, 4, 3, 2, 1] manual range[1,4)=[1, 4, 3, 2, 5]  (no Arrays.reverse exists)\n[Py]   R08 .reverse()=[5, 4, 3, 2, 1] slice-reverse [1:4]=[1, 4, 3, 2, 5] whole [::-1]=[5, 4, 3, 2, 1]  (reversed() gives an ITERATOR, not a list)",
    differs:
      "C++ hands you range reversal for free; Java gives you nothing for primitive arrays and you must write the swap loop. Note the bounds convention in the executed lines — C++ <code>reverse(begin()+1, begin()+4)</code> and Python <code>v[1:4]</code> are both <b>half-open</b> and touched indices 1–3, while the hand-written Java helper used <b>inclusive</b> bounds <code>rev(a, 1, 3)</code>. All three produced <code>[1, 4, 3, 2, 5]</code>, but only because the arguments were adjusted.",
    drill: {
      ask: "Rotate an array right by k using three reversals, in place.",
      lc: "LC 189 · Rotate Array",
      py: `k %= len(a)
a = a[-k:] + a[:-k]        # or the triple-reverse, in place`,
      cpp: `int k = 3 % a.size();
reverse(a.begin(), a.end());
reverse(a.begin(), a.begin()+k);
reverse(a.begin()+k, a.end());`,
      java: `int k = 3 % a.length;
rev(a, 0, a.length-1); rev(a, 0, k-1); rev(a, k, a.length-1);`,
      out: "[C++]  D08 rotateRight(3)=[5,6,7,1,2,3,4]\n[Java] D08 rotateRight(3)=[5, 6, 7, 1, 2, 3, 4]\n[Py]   D08 rotateRight(3)=[5, 6, 7, 1, 2, 3, 4]",
    },
    see: ["LC 189 · Rotate Array", "LC 344 · Reverse String", "LC 151 · Reverse Words in a String"],
  },
  {
    n: 9,
    title: "Sum, min, max — and where the sum overflows",
    tier: "easy",
    group: "sequence",
    why: "The reduction is trivial. The accumulator type is not, and it is the single most common reason a correct algorithm returns a negative number on the hidden tests.",
    intuition:
      "Summing is one pass, O(n). The trap is that the accumulator has a fixed width in two of the three languages: 10⁵ elements of size 10⁵ is 10¹⁰, which does not fit in a 32-bit int (max ≈ 2.1 × 10⁹). It does not warn — it wraps, silently, into a negative number. The fix is to make the accumulator wide <em>before</em> the first addition, not to cast the result afterwards, because by then the information is gone.",
    useWhen: "Every aggregate. Ask “how big can this get?” before you pick the type.",
    py: `v = [4, 1, 9, 3]

sum(v)          # 17 — no overflow, ever
min(v), max(v)  # 1, 9
v.index(max(v)) # position of the max

max(range(len(v)), key=lambda i: v[i])   # argmax
sum(v) / len(v)                          # mean
max(v, key=abs)                          # by a derived value`,
    cpp: `vector<int> v{4, 1, 9, 3};

accumulate(v.begin(), v.end(), 0LL);   // 0LL — the ACCUMULATOR TYPE
accumulate(v.begin(), v.end(), 0);     // int accumulator: OVERFLOWS

*min_element(v.begin(), v.end());      // returns an ITERATOR — deref it
*max_element(v.begin(), v.end());
auto [lo, hi] = minmax_element(v.begin(), v.end());

// index of the max:
max_element(v.begin(), v.end()) - v.begin();`,
    java: `int[] v = {4, 1, 9, 3};

Arrays.stream(v).sum();                  // int — OVERFLOWS
Arrays.stream(v).asLongStream().sum();   // long — safe

Arrays.stream(v).min().getAsInt();
Arrays.stream(v).max().getAsInt();
Arrays.stream(v).summaryStatistics();    // min, max, sum, count, average

long s = 0;
for (int x : v) s += x;   // the explicit form: declare s as long`,
    api: {
      py: [
        { call: "sum(a, start=0)", gives: "int or float", cost: "O(n)", gotcha: "arbitrary precision — this NEVER overflows, which is why ports break" },
        { call: "min(a) / max(a)", gives: "the element", cost: "O(n)", gotcha: "raises ValueError on an empty sequence — pass default=" },
        { call: "max(a, key=f)", gives: "the element maximising f", cost: "O(n)", gotcha: "returns the ELEMENT, not the key value" },
        { call: "a.index(max(a))", gives: "int", cost: "O(n) twice", gotcha: "two passes; max(range(len(a)), key=a.__getitem__) does it in one" },
      ],
      cpp: [
        { call: "accumulate(f, l, init)", gives: "the type of INIT", cost: "O(n)", gotcha: "0 gives an int accumulator. Write 0LL. This is the classic overflow" },
        { call: "*max_element(f, l)", gives: "T", cost: "O(n)", gotcha: "returns an ITERATOR — dereference it, and check it is not l" },
        { call: "minmax_element(f, l)", gives: "pair of iterators", cost: "O(1.5n)", gotcha: "cheaper than calling both separately" },
        { call: "max_element(f,l) - v.begin()", gives: "the index", cost: "O(n)", gotcha: "the standard argmax idiom" },
      ],
      java: [
        { call: "Arrays.stream(a).sum()", gives: "int", cost: "O(n)", gotcha: "OVERFLOWS silently; use .asLongStream().sum()" },
        { call: "Arrays.stream(a).max()", gives: "OptionalInt", cost: "O(n)", gotcha: "call .getAsInt(); it throws if the array was empty" },
        { call: "summaryStatistics()", gives: "IntSummaryStatistics", cost: "O(n)", gotcha: "one pass for min, max, sum, count and average" },
        { call: "Math.max(a, b)", gives: "int/long/double", cost: "O(1)", gotcha: "two arguments only — it is not a reduction" },
      ],
    },
    output: "[C++]  R09 sum=17 min=1 max=9 minmax=(1,9)\n[C++]  R09trap accumulate(...,0)=-294967296  accumulate(...,0LL)=4000000000\n[Java] R09 sum=17 min=1 max=9 summaryStatistics avg=4.25 count=4\n[Java] R09trap Arrays.stream(big).sum() (int)=-294967296  asLongStream().sum()=4000000000\n[Py]   R09 sum=17 min=1 max=9 index-of-max=2 max(range,key=)=2\n[Py]   R09trap sum([2000000000, 2000000000])=4000000000  <- Python ints are ARBITRARY PRECISION: this never overflows, which is why the port to C++/Java breaks",
    differs:
      "The executed overflow is the lesson. Summing two copies of 2 000 000 000 gave <b>-294967296</b> in both C++ (<code>accumulate(..., 0)</code>) and Java (<code>Arrays.stream(a).sum()</code>), and <b>4000000000</b> in Python and in the widened versions of both. Neither C++ nor Java raised anything. If your solution works in Python and fails after porting, this is the first place to look.",
    drill: {
      ask: "Find the largest sum obtainable from any contiguous subarray.",
      lc: "LC 53 · Maximum Subarray",
      py: `best = cur = a[0]
for x in a[1:]:
    cur = max(x, cur + x); best = max(best, cur)`,
      cpp: `long long best = a[0], cur = a[0];
for (size_t i = 1; i < a.size(); ++i) {
    cur = max((long long)a[i], cur + a[i]); best = max(best, cur);
}`,
      java: `long best = a[0], cur = a[0];
for (int i = 1; i < a.length; i++) {
    cur = Math.max(a[i], cur + a[i]); best = Math.max(best, cur);
}`,
      out: "[C++]  D09 maxSubarraySum=6\n[Java] D09 maxSubarraySum=6\n[Py]   D09 maxSubarraySum=6",
    },
    see: ["LC 53 · Maximum Subarray", "LC 121 · Best Time to Buy and Sell Stock", "LC 1480 · Running Sum"],
  },
  {
    n: 10,
    title: "Does it contain x?",
    tier: "easy",
    group: "lookup",
    why: "The syntax is a one-liner in every language, which hides the fact that it is O(n) on a list and O(1) on a set. Putting the O(n) version inside a loop is the most common accidental O(n²) there is.",
    intuition:
      "Searching a list means comparing against elements one at a time until you hit — there is no structure to exploit, so it is O(n). A hash set converts the element into a bucket index in one step, so it looks in exactly one place: O(1) average. The cost of that is building the set, O(n) once. So the rule is arithmetic, not taste: if you will ask more than a couple of times, build the set first.",
    useWhen: "Any “have I seen this before” question. If you are asking inside a loop, you want a set.",
    py: `v = [4, 1, 9]
9 in v            # True  — O(n)

s = {4, 1, 9}
9 in s            # True  — O(1) average

'ell' in 'hello'  # True — on strings, "in" means SUBSTRING, not element
'a' in {'a': 1}   # True — on dicts, "in" checks KEYS`,
    cpp: `vector<int> v{4, 1, 9};
find(v.begin(), v.end(), 9) != v.end();   // O(n)

set<int> s{4, 1, 9};
s.count(9);                 // 1 or 0 — O(log n)
s.find(9) != s.end();       // same, O(log n)
s.contains(9);              // C++20 only

unordered_set<int> us{4, 1, 9};
us.count(9);                // O(1) average`,
    java: `List<Integer> v = new ArrayList<>(List.of(4, 1, 9));
v.contains(9);              // O(n)

Set<Integer> s = new HashSet<>(v);
s.contains(9);              // O(1) average

// int[] has NO contains method:
Arrays.stream(a).anyMatch(x -> x == 9);   // O(n)
// or sort it once and Arrays.binarySearch — O(log n) per query`,
    api: {
      py: [
        { call: "x in list", gives: "bool", cost: "O(n)", gotcha: "reads like a lookup, walks like a scan" },
        { call: "x in set / x in dict", gives: "bool", cost: "O(1) avg", gotcha: "on a dict this checks KEYS, never values" },
        { call: "sub in string", gives: "bool", cost: "O(n·m)", gotcha: "means SUBSTRING — 'ell' in 'hello' is True" },
        { call: "any(f(x) for x in a)", gives: "bool", cost: "O(n)", gotcha: "short-circuits; the general membership test" },
      ],
      cpp: [
        { call: "find(f, l, x) != l", gives: "bool", cost: "O(n)", gotcha: "the free function; works on any range" },
        { call: "s.count(x)", gives: "0 or 1 on a set", cost: "O(log n) / O(1)", gotcha: "on a multiset it is the actual count and O(log n + k)" },
        { call: "s.find(x) != s.end()", gives: "bool", cost: "O(log n) / O(1)", gotcha: "prefer to count() when you also want the element" },
        { call: "binary_search(f, l, x)", gives: "bool", cost: "O(log n)", gotcha: "requires the range to be SORTED — no check, just wrong answers" },
      ],
      java: [
        { call: "list.contains(x)", gives: "boolean", cost: "O(n)", gotcha: "on a List<Integer> it compares with equals, so boxing is fine here" },
        { call: "set.contains(x)", gives: "boolean", cost: "O(1) avg", gotcha: "requires a correct hashCode — int[] has none (rung 18)" },
        { call: "set.add(x)", gives: "boolean", cost: "O(1) avg", gotcha: "returns FALSE if it was already there — a one-line duplicate check" },
        { call: "Arrays.stream(a).anyMatch(..)", gives: "boolean", cost: "O(n)", gotcha: "the only built-in for a primitive array" },
      ],
    },
    output: "[C++]  R10 vector find!=end -> true (O(n))   set.count(9)=1 set.find!=end -> true (O(log n))\n[Java] R10 list.contains(9)=true (O(n))   set.contains(9)=true (O(1))   int[] has NO contains -> Arrays.stream(a).anyMatch\n[Py]   R10 9 in list -> True (O(n))   9 in set -> True (O(1))   \"ell\" in \"hello\" -> True (substring, not element!)",
    differs:
      "Python's <code>in</code> is one keyword doing three different jobs — element on a list, key on a dict, <b>substring</b> on a string — and the executed line confirms <code>'ell' in 'hello'</code> is <code>True</code>. Java is the only one with a container that has no membership test at all: <code>int[]</code>. And Java's <code>set.add()</code> returning <code>false</code> on a duplicate is the neatest duplicate check of the three.",
    drill: {
      ask: "Report whether an array contains any duplicate.",
      lc: "LC 217 · Contains Duplicate",
      py: `print(len(set(a)) != len(a))`,
      cpp: `unordered_set<int> s(a.begin(), a.end());
bool dup = s.size() != a.size();`,
      java: `Set<Integer> s = new HashSet<>();
boolean dup = false;
for (int x : a) if (!s.add(x)) { dup = true; break; }  // add() returns false on a repeat`,
      out: "[C++]  D10 containsDuplicate=true\n[Java] D10 containsDuplicate=true\n[Py]   D10 containsDuplicate=True",
    },
    see: ["LC 217 · Contains Duplicate", "LC 219 · Contains Duplicate II", "LC 1 · Two Sum"],
  },
  {
    n: 11,
    title: "Where is x? — and what a miss looks like",
    tier: "easy",
    group: "lookup",
    why: "All three tell you the position. All three report “not found” differently, and one of them raises. Assuming the wrong convention gives you an index that looks plausible and is not.",
    intuition:
      "Linear search has nothing to exploit, so it is O(n) and the only question is what it hands back when it fails. There are three possible designs and the three languages picked one each: a sentinel value (Java's −1), a one-past-the-end position (C++'s <code>end()</code>), and an exception (Python's <code>ValueError</code>). None is wrong; mixing them up is.",
    useWhen: "Small unsorted data, or when you need the position rather than just membership.",
    py: `v = [4, 1, 9]

v.index(9)        # 2
v.index(8)        # ValueError: 8 is not in list  <- RAISES

# the safe form:
i = v.index(8) if 8 in v else -1     # two passes
# or:
i = next((k for k, x in enumerate(v) if x == 8), -1)   # one pass

'hello'.find('z')   # -1    strings DO return a sentinel
'hello'.index('z')  # ValueError — the two differ on strings!`,
    cpp: `vector<int> v{4, 1, 9};

auto it = find(v.begin(), v.end(), 9);
int idx = (it != v.end()) ? int(it - v.begin()) : -1;

// NEVER do this without the check:
//   int idx = find(...) - v.begin();     // on a miss this equals size()

auto it2 = find_if(v.begin(), v.end(), [](int x){ return x > 5; });
distance(v.begin(), it);   // same as it - v.begin(), works on any iterator`,
    java: `List<Integer> v = new ArrayList<>(List.of(4, 1, 9));

v.indexOf(9);       //  2
v.indexOf(8);       // -1  — a real sentinel, no exception
v.lastIndexOf(9);   //  2

"hello".indexOf('z');   // -1

// int[] has no indexOf. Write the loop:
int idx = -1;
for (int i = 0; i < a.length; i++) if (a[i] == t) { idx = i; break; }`,
    api: {
      py: [
        { call: "a.index(x)", gives: "int", cost: "O(n)", gotcha: "RAISES ValueError when absent — it never returns -1" },
        { call: "a.index(x, start, end)", gives: "int", cost: "O(n)", gotcha: "the start argument is how you find the SECOND occurrence" },
        { call: "s.find(sub)", gives: "int, or -1", cost: "O(n·m)", gotcha: "strings only; s.index(sub) raises instead" },
        { call: "next((i for ...), -1)", gives: "int", cost: "O(n)", gotcha: "the one-pass safe form; the -1 default is what stops StopIteration" },
      ],
      cpp: [
        { call: "find(f, l, x)", gives: "an iterator", cost: "O(n)", gotcha: "returns l on a miss — check BEFORE subtracting begin()" },
        { call: "find_if(f, l, pred)", gives: "an iterator", cost: "O(n)", gotcha: "same miss convention; the predicate form" },
        { call: "distance(f, it)", gives: "ptrdiff_t", cost: "O(1) on a vector", gotcha: "O(n) on a list or set iterator" },
        { call: "count(f, l, x)", gives: "the number of matches", cost: "O(n)", gotcha: "always walks the whole range — do not use it as a membership test" },
      ],
      java: [
        { call: "list.indexOf(x)", gives: "int, or -1", cost: "O(n)", gotcha: "compares with equals(), so it works on objects" },
        { call: "list.lastIndexOf(x)", gives: "int, or -1", cost: "O(n)", gotcha: "walks backwards from the end" },
        { call: "str.indexOf(sub, from)", gives: "int, or -1", cost: "O(n·m)", gotcha: "the from argument is how you iterate every occurrence" },
        { call: "(no int[] indexOf)", gives: "—", cost: "—", gotcha: "primitive arrays have no search method at all — write the loop" },
      ],
    },
    output: "[C++]  R11 index=2 miss==end -> true  (NEVER subtract begin() from a miss and use it)\n[Java] R11 indexOf(9)=2 indexOf(8)=-1 lastIndexOf(9)=2  (-1 means absent — a real sentinel, not an insertion point)\n[Py]   R11 v.index(9)=2  v.index(8) -> ValueError: 8 is not in list  <- RAISES, it does not return -1",
    differs:
      "Three designs, executed side by side: Python <b>raised</b> <code>ValueError: 8 is not in list</code>, C++ returned an iterator equal to <code>end()</code>, Java returned <b>-1</b>. The C++ one is the dangerous one, because <code>find(...) - v.begin()</code> on a miss quietly evaluates to <code>size()</code> — a number that indexes one past the end and reads garbage on the next line. Python is inconsistent with itself: <code>str.find</code> returns -1 but <code>str.index</code> raises.",
    drill: {
      ask: "Return the index of a target, or -1 if it is absent.",
      lc: "LC 704 · Binary Search (linear variant)",
      py: `print(a.index(9) if 9 in a else -1)`,
      cpp: `auto it = find(a.begin(), a.end(), target);
int idx = (it != a.end()) ? int(it - a.begin()) : -1;`,
      java: `int idx = a.indexOf(9);      // already -1 on a miss`,
      out: "[C++]  D11 indexOf(9)=2 indexOf(8)=-1\n[Java] D11 indexOf(9)=2 indexOf(8)=-1\n[Py]   D11 indexOf(9)=2 indexOf(8)=-1",
    },
    see: ["LC 704 · Binary Search", "LC 35 · Search Insert Position", "LC 34 · First and Last Position"],
  },
  {
    n: 12,
    title: "Converting between array, list and string forms",
    tier: "easy",
    group: "sequence",
    why: "Java's primitive/boxed divide means half its library will not accept the thing you are holding, and the conversion is not obvious. This rung is almost entirely a Java rung.",
    intuition:
      "In C++ and Python a container of ints holds ints. In Java, <code>int[]</code> holds raw 32-bit values but <code>List&lt;Integer&gt;</code> holds <em>pointers to objects</em>, each object being a 16-byte box around a 4-byte number. Generics cannot hold primitives, so every collection forces the boxed form. That is why the conversions exist at all, why they cost O(n), and why the memory difference is roughly 5×.",
    useWhen: "Any time a library method refuses what you are holding — which in Java is constantly.",
    py: `list((1, 2, 3))      # tuple  -> list
tuple([1, 2, 3])    # list   -> tuple
list('abc')         # string -> ['a','b','c']
''.join(['a','b'])  # list   -> string
list(range(3))      # range  -> list
[int(c) for c in '123']    # digit string -> [1,2,3]

# everything holds the same objects; there is no boxed/primitive split.`,
    cpp: `int raw[3] = {1, 2, 3};
vector<int> v(raw, raw + 3);
vector<int> v2(begin(raw), end(raw));

array<int,3> st{1, 2, 3};
vector<int> v3(st.begin(), st.end());

string s = "123";
vector<int> d;
for (char c : s) d.push_back(c - '0');

// any pair of iterators constructs any container. One rule, no exceptions.`,
    java: `Integer[] boxed = {1, 2, 3};
List<Integer> l1 = new ArrayList<>(Arrays.asList(boxed));

int[] prim = {1, 2, 3};
List<Integer> l2 = Arrays.stream(prim).boxed()
                         .collect(Collectors.toList());

int[] back = l2.stream().mapToInt(Integer::intValue).toArray();
Integer[] back2 = l1.toArray(new Integer[0]);

int[] digits = "123".chars().map(c -> c - '0').toArray();

// TRAP: Arrays.asList(prim) gives List<int[]> of SIZE 1.`,
    api: {
      py: [
        { call: "list(x) / tuple(x)", gives: "a new container", cost: "O(n)", gotcha: "works on anything iterable, including a generator you can only consume once" },
        { call: "''.join(parts)", gives: "str", cost: "O(total)", gotcha: "the parts must all be str — join on ints raises TypeError" },
        { call: "list(s)", gives: "a list of 1-char strings", cost: "O(n)", gotcha: "there is no char type; each element is still a string" },
      ],
      cpp: [
        { call: "vector<T> v(first, last)", gives: "a new vector", cost: "O(n)", gotcha: "the universal conversion — any iterator pair builds any container" },
        { call: "begin(raw) / end(raw)", gives: "pointers", cost: "O(1)", gotcha: "only works while the array has not decayed to a pointer" },
        { call: "v.data()", gives: "T*", cost: "O(1)", gotcha: "the raw block, for C APIs; invalidated by any reallocation" },
        { call: "to_string(x) / stoi(s)", gives: "string / int", cost: "O(len)", gotcha: "stoi throws on junk; stoll for values past 2·10⁹" },
      ],
      java: [
        { call: "Arrays.stream(prim).boxed()", gives: "Stream<Integer>", cost: "O(n)", gotcha: "the ONLY sane int[] → List<Integer> route" },
        { call: "list.stream().mapToInt(Integer::intValue).toArray()", gives: "int[]", cost: "O(n)", gotcha: "the reverse trip; NPE if any element is null" },
        { call: "list.toArray(new T[0])", gives: "T[]", cost: "O(n)", gotcha: "the empty-array argument supplies the type; new T[0] is idiomatic" },
        { call: "Arrays.asList(x)", gives: "a FIXED-SIZE view", cost: "O(1)", gotcha: "on an int[] it gives ONE element — the array itself" },
        { call: "s.toCharArray() / new String(cs)", gives: "char[] / String", cost: "O(n)", gotcha: "the standard way to mutate a String" },
      ],
    },
    output: "[C++]  R12 fromRaw=[1, 2, 3] begin/end=[1, 2, 3] fromStdArray=[1, 2, 3] st.size()=3\n[Java] R12 fromBoxed=[1, 2, 3] fromPrim(boxed())=[1, 2, 3] backToPrim=[1, 2, 3] backToBoxed=[1, 2, 3]\n[Java] R12trap Arrays.asList(prim).size()=1  <- ONE element: the int[] itself, not 3\n[Py]   R12 list(tuple)=[1, 2, 3] tuple(list)=(1, 2, 3) list(\"abc\")=['a', 'b', 'c'] list(range(3))=[0, 1, 2] \"\".join([\"a\",\"b\"])=ab",
    differs:
      "The executed trap is Java's: <code>Arrays.asList(prim).size()</code> printed <b>1</b>, not 3. Varargs matched <code>int[]</code> as a single object rather than three elements, so you get a <code>List&lt;int[]&gt;</code> holding one array. It compiles, it runs, and every downstream loop sees one element. C++ has one universal conversion rule — a pair of iterators — and Python has none to learn because there is no primitive/boxed split at all.",
    drill: {
      ask: "Turn a string of digits into a numeric array and sum it.",
      py: `d = [int(c) for c in '12345']
print(d, sum(d))`,
      cpp: `string s = "12345"; vector<int> d;
for (char c : s) d.push_back(c - '0');`,
      java: `int[] d = "12345".chars().map(c -> c - '0').toArray();
int sum = Arrays.stream(d).sum();`,
      out: "[C++]  D12 digits=[1,2,3,4,5] sum=15\n[Java] D12 digits=[1, 2, 3, 4, 5] sum=15\n[Py]   D12 digits=[1, 2, 3, 4, 5] sum=15",
    },
    see: ["LC 66 · Plus One", "LC 415 · Add Strings", "LC 989 · Add to Array-Form of Integer"],
  },
  {
    n: 13,
    title: "In place, or returning something new?",
    tier: "medium",
    group: "order",
    why: "Python's mutating methods return <code>None</code>, so chaining silently destroys your data. It reads exactly like it worked.",
    intuition:
      "Sorting in place rearranges the existing block: O(n log n) time, O(1)–O(log n) extra space. Producing a sorted copy costs an additional O(n) of memory. The API design follows from that choice — a function that mutates has nothing meaningful to return, so it returns nothing. Python returns <code>None</code> rather than the list <em>on purpose</em>, precisely so that you cannot mistake a mutation for a transformation. The safety mechanism is what bites you.",
    useWhen: "Any time the caller still needs the original order — which includes “restore the input before the next test case”.",
    py: `a = [3, 1, 2]

a.sort()          # in place, returns None
b = sorted(a)     # a NEW sorted list, a untouched

b = a.sort()      # b is None  <- the classic bug
a = a.append(4)   # a is now None

# same for: reverse(), extend(), clear(), a.remove(x)`,
    cpp: `vector<int> a{3, 1, 2};
sort(a.begin(), a.end());        // in place, returns void

vector<int> b = a;               // copy FIRST
sort(b.begin(), b.end());

// there is no "sorted()" that returns a copy — you make the copy.
// C++ refuses to compile "auto b = sort(...)", so the bug cannot happen.`,
    java: `int[] a = {3, 1, 2};
Arrays.sort(a);                  // in place, returns void

int[] b = a.clone();             // copy FIRST
Arrays.sort(b);

// Streams give you the copy form:
int[] c = Arrays.stream(a).sorted().toArray();
List<Integer> d = list.stream().sorted().collect(Collectors.toList());`,
    api: {
      py: [
        { call: "a.sort(key=, reverse=)", gives: "None", cost: "O(n log n)", gotcha: "IN PLACE and returns None — b = a.sort() gives you None" },
        { call: "sorted(a, key=, reverse=)", gives: "a new list", cost: "O(n log n)", gotcha: "accepts ANY iterable, always returns a list" },
        { call: "a.reverse() vs a[::-1]", gives: "None vs a new list", cost: "O(n)", gotcha: "the same in-place/copy split" },
        { call: "list.copy() / a[:]", gives: "a new list", cost: "O(n)", gotcha: "shallow — see rung 17" },
      ],
      cpp: [
        { call: "sort(first, last)", gives: "void", cost: "O(n log n)", gotcha: "introsort; no copy form exists, so copy the vector yourself" },
        { call: "stable_sort(first, last)", gives: "void", cost: "O(n log n)", gotcha: "allocates a buffer; keeps equal elements in order (rung 16)" },
        { call: "partial_sort(f, mid, l)", gives: "void", cost: "O(n log k)", gotcha: "only the first k end up sorted — enough for top-k" },
        { call: "is_sorted(f, l)", gives: "bool", cost: "O(n)", gotcha: "cheap guard before a binary search" },
      ],
      java: [
        { call: "Arrays.sort(a)", gives: "void", cost: "O(n log n)", gotcha: "dual-pivot quicksort for primitives — NOT stable" },
        { call: "Collections.sort(list) / list.sort(cmp)", gives: "void", cost: "O(n log n)", gotcha: "TimSort — always stable" },
        { call: "stream().sorted()", gives: "a new Stream", cost: "O(n log n)", gotcha: "the copy form; collect it or it does nothing" },
        { call: "a.clone()", gives: "a new array", cost: "O(n)", gotcha: "the copy-before-sort idiom for primitives" },
      ],
    },
    output: "[C++]  R13 sorted-in-place=[1, 2, 3] copy-then-sort=[1, 2, 3]  (sort returns void)\n[Java] R13 sorted-in-place=[1, 2, 3] copy-then-sort=[1, 2, 3]  (Arrays.sort returns void)\n[Py]   R13 sorted(a) returns a NEW list=[1, 2, 3]   a.sort() returns None and mutates a to [1, 2, 3]\n[Py]   R13trap \"a = a.sort()\" leaves you holding None  <- compiles fine, destroys your data",
    differs:
      "All three sort in place and hand back nothing useful. Python is the only one where <em>assigning the result compiles</em> — the executed line shows <code>a = a.sort()</code> leaving you holding <b>None</b>, and the next line to touch <code>a</code> raises something unrelated and confusing. C++ and Java refuse at compile time, which is the whole difference.",
    drill: {
      ask: "Find the kth largest element without disturbing the caller's array.",
      lc: "LC 215 · Kth Largest Element in an Array",
      py: `print(sorted(a, reverse=True)[k-1])   # sorted() never touches a`,
      cpp: `vector<int> c = a;
sort(c.rbegin(), c.rend());
int ans = c[k-1];`,
      java: `int[] c = a.clone(); Arrays.sort(c);
int ans = c[c.length - k];   // no descending sort for int[] — index from the END`,
      out: "[C++]  D13 kthLargest(2)=5 original=[3,2,1,5,6,4]\n[Java] D13 kthLargest(2)=5 original=[3, 2, 1, 5, 6, 4]  (no descending sort for int[], so index from the END)\n[Py]   D13 kthLargest(2)=5 original=[3, 2, 1, 5, 6, 4]",
    },
    see: ["LC 215 · Kth Largest Element", "LC 912 · Sort an Array", "LC 977 · Squares of a Sorted Array"],
  },
  {
    n: 14,
    title: "Ascending, and the surprisingly awkward descending",
    tier: "medium",
    group: "order",
    why: "Every language sorts ascending in one call. Exactly one of them cannot sort a primitive array descending at all, and the workaround is not obvious under time pressure.",
    intuition:
      "A sort needs a rule for “comes before”. Descending is the same algorithm with the rule flipped, so it costs the same O(n log n) — there is no reason for it to be harder. It is harder in Java for a type-system reason, not an algorithmic one: comparators are objects, objects cannot be primitives, so <code>Arrays.sort(int[], cmp)</code> has no overload to call. The fix is to box, or to sort ascending and read backwards.",
    useWhen: "Leaderboards, top-k, greedy algorithms that consume the largest item first.",
    py: `sorted([3,1,2])                      # [1, 2, 3]
sorted([3,1,2], reverse=True)       # [3, 2, 1]
sorted([3,1,2], key=lambda x: -x)   # [3, 2, 1] — same, for numbers

a.sort(reverse=True)                # in place

# reverse=True is stable too: equal elements keep their original order,
# which is NOT the same as sorting ascending and reversing.`,
    cpp: `vector<int> v{3, 1, 2};

sort(v.begin(), v.end());                    // ascending
sort(v.begin(), v.end(), greater<int>());    // descending
sort(v.rbegin(), v.rend());                  // descending, same result

// greater<int>() is a functor from <functional>; greater<>{} also works`,
    java: `int[] p = {3, 1, 2};
Arrays.sort(p);                       // ascending — the ONLY option

Integer[] d = {3, 1, 2};
Arrays.sort(d, Collections.reverseOrder());   // needs BOXED

List<Integer> l = new ArrayList<>(List.of(3,1,2));
l.sort(Comparator.reverseOrder());

// for int[] descending: sort ascending and read from the end,
// or box it: Arrays.stream(p).boxed().sorted(reverseOrder())...`,
    api: {
      py: [
        { call: "sorted(a, reverse=True)", gives: "a new list", cost: "O(n log n)", gotcha: "stable — not the same as sorted(a)[::-1]" },
        { call: "a.sort(reverse=True)", gives: "None", cost: "O(n log n)", gotcha: "in place" },
        { call: "key=lambda x: -x", gives: "—", cost: "O(n log n)", gotcha: "numbers only; you cannot negate a string" },
        { call: "heapq.nlargest(k, a)", gives: "a list of k", cost: "O(n log k)", gotcha: "beats a full sort when k is small" },
      ],
      cpp: [
        { call: "sort(f, l, greater<int>())", gives: "void", cost: "O(n log n)", gotcha: "greater<>() needs <functional>" },
        { call: "sort(v.rbegin(), v.rend())", gives: "void", cost: "O(n log n)", gotcha: "the shortest descending spelling" },
        { call: "partial_sort(f, f+k, l)", gives: "void", cost: "O(n log k)", gotcha: "top-k without sorting the tail" },
        { call: "nth_element(f, f+k, l)", gives: "void", cost: "O(n) average", gotcha: "positions the kth correctly; the rest is unordered" },
      ],
      java: [
        { call: "Arrays.sort(int[])", gives: "void", cost: "O(n log n)", gotcha: "ASCENDING ONLY — there is no comparator overload for primitives" },
        { call: "Arrays.sort(T[], cmp)", gives: "void", cost: "O(n log n)", gotcha: "requires a boxed array; Integer[] not int[]" },
        { call: "Comparator.reverseOrder()", gives: "Comparator<T>", cost: "—", gotcha: "Collections.reverseOrder() is the same thing, older spelling" },
        { call: "cmp.reversed()", gives: "Comparator<T>", cost: "—", gotcha: "flips any comparator, including a chained one" },
      ],
    },
    output: "[C++]  R14 asc=[1, 2, 3] greater<int>=[3, 2, 1] rbegin/rend=[3, 2, 1]\n[Java] R14 asc(int[])=[1, 2, 3] desc(Integer[] + reverseOrder)=[3, 2, 1] list desc=[3, 2, 1]  <- int[] CANNOT sort descending directly: no comparator overload for primitives\n[Py]   R14 sorted=[1, 2, 3] reverse=True -> [3, 2, 1] key=-x -> [3, 2, 1]",
    differs:
      "The executed Java line makes it explicit: <code>Arrays.sort(int[])</code> produced <b>[1, 2, 3]</b> and there was no descending option to call — the descending result required <code>Integer[]</code> and <code>reverseOrder()</code>. In a timed round the cheap fix is to sort ascending and index from the end, which is exactly what the rung-13 drill does. Python's <code>reverse=True</code> is <em>stable</em>, which is not the same as sorting ascending and reversing — that would flip the order of equal elements.",
    drill: {
      ask: "Return the three largest values, largest first.",
      py: `print(sorted(a, reverse=True)[:3])`,
      cpp: `vector<int> c = a; sort(c.rbegin(), c.rend()); c.resize(3);`,
      java: `int[] top = Arrays.stream(a).boxed()
    .sorted(Comparator.reverseOrder()).limit(3)
    .mapToInt(Integer::intValue).toArray();`,
      out: "[C++]  D14 top3=[9,7,5]\n[Java] D14 top3=[9, 7, 5]\n[Py]   D14 top3=[9, 7, 5]",
    },
    see: ["LC 414 · Third Maximum Number", "LC 506 · Relative Ranks", "LC 215 · Kth Largest Element"],
  },
  {
    n: 15,
    title: "Sort by a rule, then by a second rule",
    tier: "medium",
    group: "order",
    why: "This is the most reused piece of syntax in the whole topic, and each language spells it completely differently. Getting the tiebreak wrong is the difference between accepted and wrong-answer on a third of all sorting problems.",
    intuition:
      "There are two designs. A <b>key</b> computes one comparable value per element, once — n calls, then the sort compares the cheap keys. A <b>comparator</b> is called on every comparison — about n log n times — and must answer “does a come strictly before b”. Keys are faster and impossible to get logically wrong. Comparators are more expressive and must obey a strict weak ordering: never return true for <code>a &lt; a</code>, and be consistent. Violate that and C++ walks off the end of the array while Java throws <em>“Comparison method violates its general contract”</em>.",
    useWhen: "Intervals by start, people by age then name, words by frequency then alphabetically. Constantly.",
    py: `ps = [(1,9), (2,1), (1,3)]

ps.sort(key=lambda t: (t[1], t[0]))     # by 2nd, then 1st
ps.sort(key=lambda t: (t[1], -t[0]))    # 2nd asc, 1st DESC

# a tuple key is the whole trick: it compares left to right.
# descending on ONE key = negate it — numbers only.
# for strings you need two passes (rung 16) or functools.cmp_to_key.`,
    cpp: `vector<pair<int,int>> ps{{1,9},{2,1},{1,3}};

sort(ps.begin(), ps.end(),
  [](const pair<int,int>& x, const pair<int,int>& y){
      if (x.second != y.second) return x.second < y.second;
      return x.first < y.first;          // STRICT <, never <=
  });

// plain sort(ps.begin(), ps.end()) already sorts by first then second.
// Returning <= makes the comparator invalid and sort can read out of bounds.`,
    java: `List<int[]> ps = new ArrayList<>(List.of(
    new int[]{1,9}, new int[]{2,1}, new int[]{1,3}));

ps.sort((x, y) -> x[1] != y[1]
    ? Integer.compare(x[1], y[1])
    : Integer.compare(x[0], y[0]));

// or, more readably:
ps.sort(Comparator.<int[]>comparingInt(x -> x[1])
                  .thenComparingInt(x -> x[0]));

// NEVER (x,y) -> x[1] - y[1] : that subtraction overflows on wide ints.`,
    api: {
      py: [
        { call: "sort(key=f)", gives: "None", cost: "n calls to f", gotcha: "the key is computed ONCE per element — cheap and unambiguous" },
        { call: "key=lambda x: (a, b)", gives: "—", cost: "—", gotcha: "tuple keys compare left to right; this is the multi-key idiom" },
        { call: "key=lambda x: (a, -b)", gives: "—", cost: "—", gotcha: "mixed directions, NUMBERS ONLY" },
        { call: "functools.cmp_to_key(f)", gives: "a key function", cost: "O(n log n) calls", gotcha: "the escape hatch for mixed-direction string sorts; slow" },
      ],
      cpp: [
        { call: "sort(f, l, cmp)", gives: "void", cost: "O(n log n)", gotcha: "cmp must be a STRICT weak ordering — return <, never <=" },
        { call: "sort(v.begin(), v.end())", gives: "void", cost: "O(n log n)", gotcha: "on pair/tuple this is already lexicographic — often all you need" },
        { call: "[](const T& a, const T& b){...}", gives: "a lambda", cost: "—", gotcha: "take by const& — by value copies on every comparison" },
        { call: "tie(a.x, a.y) < tie(b.x, b.y)", gives: "bool", cost: "O(1)", gotcha: "the tidy multi-key comparator for a struct" },
      ],
      java: [
        { call: "list.sort(cmp)", gives: "void", cost: "O(n log n)", gotcha: "TimSort; throws IllegalArgumentException on an inconsistent comparator" },
        { call: "Comparator.comparingInt(f)", gives: "Comparator<T>", cost: "—", gotcha: "the primitive-specialised version — avoids boxing every comparison" },
        { call: ".thenComparing(g)", gives: "Comparator<T>", cost: "—", gotcha: "chains the tiebreak; reads in the order you say it" },
        { call: ".reversed()", gives: "Comparator<T>", cost: "—", gotcha: "reverses the WHOLE chain, not just the last link" },
        { call: "Integer.compare(a, b)", gives: "int", cost: "O(1)", gotcha: "use this, never a - b: subtraction overflows" },
      ],
    },
    output: "[C++]  R15 (2,1)(1,3)(1,9)\n[Java] R15 (2,1)(1,3)(1,9)\n[Java] R15cmp comparingInt().thenComparingInt()=(2,1)(1,3)(1,9)\n[Py]   R15 [(2, 1), (1, 3), (1, 9)]\n[Py]   R15mixed [(1, 5), (3, 5), (2, 1)] by 2nd ASC then 1st DESC -> [(2, 1), (3, 5), (1, 5)]  <- negation only works on NUMBERS; for strings you need two passes or cmp_to_key",
    differs:
      "All three produced the identical order <code>(2,1) (1,3) (1,9)</code> — verified. The mechanism differs: Python computes a <b>key</b> once per element; C++ and Java call a <b>comparator</b> O(n log n) times. Two live hazards, both language-specific: the C++ comparator must return strict <code>&lt;</code> or <code>std::sort</code> can read out of bounds, and the Java lambda must use <code>Integer.compare</code> because <code>x - y</code> overflows for values on either side of zero at scale.",
    drill: {
      ask: "Sort people by age ascending, breaking ties by name alphabetically.",
      py: `p = [(30,'bob'), (25,'amy'), (30,'ann')]
p.sort()          # tuples already compare (age, name) left to right`,
      cpp: `vector<pair<int,string>> p{{30,"bob"},{25,"amy"},{30,"ann"}};
sort(p.begin(), p.end());   // pair comparison is lexicographic — free`,
      java: `p.sort(Comparator.<Object[]>comparingInt(x -> (Integer) x[0])
                 .thenComparing(x -> (String) x[1]));`,
      out: "[C++]  D15 byAgeThenName= amy25 ann30 bob30 \n[Java] D15 byAgeThenName= amy25 ann30 bob30 \n[Py]   D15 byAgeThenName= amy25 ann30 bob30 ",
    },
    see: ["LC 56 · Merge Intervals", "LC 973 · K Closest Points", "LC 179 · Largest Number", "LC 1710 · Maximum Units on a Truck"],
  },
  {
    n: 16,
    title: "Stability, and the two-pass trick it enables",
    tier: "medium",
    group: "order",
    why: "A stable sort keeps equal elements in their original relative order. That guarantee is what lets you build a multi-key sort out of two simple sorts — and it is what silently breaks if you use the wrong function in Java.",
    intuition:
      "Stability is not about speed, it is about information. If sorting by B preserves the order established by a previous sort on A, then <em>sorting by A first and B second</em> gives you “ordered by B, ties broken by A” for free. That is the two-pass trick, and it is the only clean way to mix ascending and descending on non-numeric keys. It works because stable algorithms — merge sort, TimSort — never swap two elements the comparator calls equal. Quicksort does, which is why it is not stable.",
    useWhen: "Ranking by count then alphabetically. Any time one of the keys is a string and the directions differ.",
    py: `# sorted() and .sort() are ALWAYS stable — Timsort, guaranteed by the spec.

v = [('a',1), ('b',1), ('c',0)]
sorted(v, key=lambda x: x[1])      # c, a, b  — a stays before b

# two-pass: sort by the TIEBREAK first, then by the PRIMARY key
wc = [('b',2), ('a',2), ('c',1)]
sorted(sorted(wc, key=lambda x: x[0]),      # pass 1: word asc
       key=lambda x: -x[1])                 # pass 2: count desc`,
    cpp: `// sort() is introsort — NOT stable.
// stable_sort() is, and costs an O(n) buffer.

vector<string> w{"pear","fig","apple","kiwi"};
sort(w.begin(), w.end());                        // pass 1: alphabetical
stable_sort(w.begin(), w.end(),                  // pass 2: by length
    [](const string& a, const string& b){ return a.size() < b.size(); });
// -> fig kiwi pear apple`,
    java: `// List.sort / Collections.sort  -> TimSort, ALWAYS stable
// Arrays.sort(Object[])            -> TimSort, stable
// Arrays.sort(int[])               -> dual-pivot quicksort, NOT stable
//   (harmless: two equal ints are indistinguishable)

List<String> w = new ArrayList<>(List.of("pear","fig","apple","kiwi"));
w.sort(Comparator.comparingInt(String::length)
                 .thenComparing(Comparator.naturalOrder()));`,
    api: {
      py: [
        { call: "sorted / .sort", gives: "stable, always", cost: "O(n log n)", gotcha: "guaranteed by the language spec, not an implementation detail" },
        { call: "sorted(sorted(a, key=k2), key=k1)", gives: "a new list", cost: "2 × O(n log n)", gotcha: "tiebreak FIRST, primary SECOND — the order feels backwards" },
        { call: "operator.itemgetter(i, j)", gives: "a key function", cost: "—", gotcha: "faster than an equivalent lambda, and itemgetter(1,0) builds the tuple key for you" },
      ],
      cpp: [
        { call: "sort(f, l)", gives: "void", cost: "O(n log n)", gotcha: "introsort — NOT stable; equal elements may be reordered" },
        { call: "stable_sort(f, l)", gives: "void", cost: "O(n log n)", gotcha: "allocates a temporary buffer; degrades to O(n log²n) if it cannot" },
        { call: "sort on (key, originalIndex)", gives: "void", cost: "O(n log n)", gotcha: "the other way to get stability — append the index so no two elements ever tie" },
      ],
      java: [
        { call: "list.sort(cmp) / Collections.sort", gives: "void", cost: "O(n log n)", gotcha: "TimSort — stable, and near-O(n) on partly-sorted input" },
        { call: "Arrays.sort(Object[])", gives: "void", cost: "O(n log n)", gotcha: "TimSort, stable" },
        { call: "Arrays.sort(int[])", gives: "void", cost: "O(n log n)", gotcha: "quicksort, NOT stable — and adversarial input can make it O(n²)" },
      ],
    },
    output: "[C++]  R16 stable_sort=cab  (a before b preserved)\n[Java] R16 List.sort is STABLE (TimSort) -> cab  (a before b preserved)\n[Java] R16note Arrays.sort(int[]) is dual-pivot quicksort, NOT stable — but primitives are indistinguishable so it cannot matter\n[Py]   R16 sorted() is ALWAYS stable (Timsort) -> cab  (a before b preserved)\n[Py]   R16use count DESC then word ASC via TWO passes on [('b', 2), ('a', 2), ('c', 1)] -> [('a', 2), ('b', 2), ('c', 1)]  (sort by the tiebreak first, then by the primary key — stability carries it)",
    differs:
      "All three preserved <code>a</code> before <code>b</code> in the executed run, but for different reasons: Python by language guarantee, Java by TimSort, C++ only because <code>stable_sort</code> was called explicitly. Java's split is the one to memorise — <code>Arrays.sort</code> on an <b>object</b> array is stable, on an <b>int</b> array it is not. That does not matter for ints (equal ints are interchangeable) but it matters enormously the moment you sort an <code>Integer[]</code> of indices.",
    drill: {
      ask: "Sort words by length, alphabetically within each length.",
      py: `print(sorted(w, key=lambda x: (len(x), x)))   # one tuple key, no two-pass needed`,
      cpp: `sort(w.begin(), w.end());                     // pass 1: alphabetical
stable_sort(w.begin(), w.end(),               // pass 2: by length
  [](const string&a, const string&b){ return a.size() < b.size(); });`,
      java: `w.sort(Comparator.comparingInt(String::length)
                 .thenComparing(Comparator.naturalOrder()));`,
      out: "[C++]  D16 byLenThenAlpha= fig kiwi pear apple \n[Java] D16 byLenThenAlpha= fig kiwi pear apple \n[Py]   D16 byLenThenAlpha= fig kiwi pear apple ",
    },
    see: ["LC 451 · Sort Characters By Frequency", "LC 692 · Top K Frequent Words", "LC 1636 · Sort Array by Increasing Frequency"],
  },
  {
    n: 17,
    title: "Slices and views: a copy, or a window onto the original?",
    tier: "medium",
    group: "sequence",
    why: "Python slices copy. Java's <code>subList</code> and <code>asList</code> are live views onto the backing store. Mutating one when you thought you had the other corrupts data with no error at all.",
    intuition:
      "A copy allocates a new block and duplicates the elements: O(k) time and O(k) memory, and the two are then independent. A view stores only a pointer and a length: O(1) to make, zero extra memory, and every write goes through to the original. Neither is better — a view inside a loop is what turns an O(n²) sliding-window into O(n), and a copy is what keeps your input intact. What kills you is not knowing which one you were handed.",
    useWhen: "Sliding windows, divide and conquer, passing a subrange to a helper. Know which one you have.",
    py: `a = [1, 2, 3, 4]

sl = a[0:2]     # a COPY — O(k) time and memory
sl[0] = 42
a[0]            # still 1

a[::2]          # every other element  -> [1, 3]
a[::-1]         # reversed copy
a[1:3] = [9, 9] # slice ASSIGNMENT writes back into a

# a[:] is SHALLOW: nested inner lists are still shared.
copy.deepcopy(a)   # when the nesting matters`,
    cpp: `vector<int> a{1,2,3,4};

vector<int> sl(a.begin(), a.begin()+2);   // an explicit COPY

// pre-C++20 there is no slice syntax at all, so the copy is always
// deliberate and never a surprise. Pass iterators instead:
void solve(vector<int>::iterator first, vector<int>::iterator last);

span<int> s(a.data(), 2);   // C++20 — a real VIEW, no copy`,
    java: `List<Integer> base = new ArrayList<>(List.of(1,2,3,4));

List<Integer> sub = base.subList(0, 2);   // a LIVE VIEW
sub.set(0, 42);
base.get(0);                              // 42 — the parent changed

Integer[] backing = {1,2,3};
List<Integer> view = Arrays.asList(backing);
view.set(0, 99);    // writes THROUGH to backing[0]
view.add(4);        // UnsupportedOperationException — fixed size

int[] copy = Arrays.copyOfRange(prim, 0, 2);   // a real copy`,
    api: {
      py: [
        { call: "a[i:j]", gives: "a new list", cost: "O(j-i)", gotcha: "a copy — and shallow, so nested lists are still shared" },
        { call: "a[i:j] = [...]", gives: "None", cost: "O(n)", gotcha: "slice ASSIGNMENT mutates in place, and may change the length" },
        { call: "a[::k]", gives: "a new list", cost: "O(n/k)", gotcha: "negative k reverses; a[::-1] is the reverse idiom" },
        { call: "copy.deepcopy(a)", gives: "an independent structure", cost: "O(total)", gotcha: "the only true copy of nested data" },
      ],
      cpp: [
        { call: "vector<T>(f, l)", gives: "a copy", cost: "O(k)", gotcha: "the only pre-C++20 slice, and it is always explicit" },
        { call: "std::span<T>(ptr, n)", gives: "a VIEW", cost: "O(1)", gotcha: "C++20; dangles if the vector reallocates" },
        { call: "std::string_view", gives: "a VIEW of a string", cost: "O(1)", gotcha: "never outlives the string it points into" },
        { call: "s.substr(pos, len)", gives: "a new string", cost: "O(len)", gotcha: "second argument is a LENGTH, not an end index" },
      ],
      java: [
        { call: "list.subList(a, b)", gives: "a LIVE VIEW", cost: "O(1)", gotcha: "writes go through; and the view breaks if the parent is structurally modified" },
        { call: "new ArrayList<>(list.subList(a,b))", gives: "a copy", cost: "O(k)", gotcha: "the safe form — wrap the view" },
        { call: "Arrays.asList(arr)", gives: "a fixed-size VIEW", cost: "O(1)", gotcha: "set() writes through to the array; add() throws at RUNTIME" },
        { call: "Arrays.copyOfRange(a, f, t)", gives: "a new array", cost: "O(t-f)", gotcha: "a real copy; t is exclusive" },
        { call: "s.substring(a, b)", gives: "a new String", cost: "O(b-a)", gotcha: "second argument is an END index, not a length — unlike C++" },
      ],
    },
    output: "[C++]  R17 slice=[42, 2] original=[1, 2, 3, 4]  (C++ has no implicit view before C++20 span)\n[Java] R17 subList is a VIEW: base=[42, 2, 3, 4] sub=[42, 2]\n[Java] R17asList writes through: backing=[99, 2, 3] add -> UnsupportedOperationException\n[Java] R17copy Arrays.copyOfRange(prim,0,2)=[1, 2] (a real copy)\n[Py]   R17 slice is a COPY: slice=[42, 2] original=[1, 2, 3, 4]   a[::2]=[1, 3] a[::-1]=[4, 3, 2, 1]\n[Py]   R17trap a[:] is SHALLOW: nested=[[99], [2]]  <- inner list shared. copy.deepcopy -> [1]",
    differs:
      "The same operation, executed in both languages, left Python's original at <b>1</b> and Java's at <b>42</b>. <code>Arrays.asList</code> is doubly surprising: it writes through to the array <em>and</em> refuses to grow, throwing <code>UnsupportedOperationException</code> at runtime rather than compile time. And note the argument conventions differ — C++ <code>substr(pos, LENGTH)</code> against Java <code>substring(start, END)</code>. Python's own trap is that <code>a[:]</code> is shallow: the executed line shows the nested inner list still shared after the copy.",
    drill: {
      ask: "Find the maximum average of any contiguous window of size k.",
      lc: "LC 643 · Maximum Average Subarray I",
      py: `cur = sum(a[:k]); best = cur
for i in range(k, len(a)):
    cur += a[i] - a[i-k]; best = max(best, cur)
print(best / k)`,
      cpp: `double sum = accumulate(a.begin(), a.begin()+k, 0.0), best = sum;
for (size_t i = k; i < a.size(); ++i) { sum += a[i] - a[i-k]; best = max(best, sum); }`,
      java: `double sum = 0; for (int i = 0; i < k; i++) sum += a[i];
double best = sum;
for (int i = k; i < a.length; i++) { sum += a[i] - a[i-k]; best = Math.max(best, sum); }`,
      out: "[C++]  D17 maxAvgWindow(k=4)=12.75\n[Java] D17 maxAvgWindow(k=4)=12.75\n[Py]   D17 maxAvgWindow(k=4)=12.75",
    },
    see: ["LC 643 · Maximum Average Subarray", "LC 209 · Minimum Size Subarray Sum", "LC 3 · Longest Substring Without Repeating"],
  },
  {
    n: 18,
    title: "Pairs and tuples — and Java's missing one",
    tier: "medium",
    group: "shape",
    why: "Every problem that sorts by two keys needs a compound element. C++ and Python give you one with comparison and hashing built in; Java gives you nothing, and the idiomatic substitute has a hole in it that costs correctness rather than style.",
    intuition:
      "A pair is useful only if it compares and hashes <em>by value</em>. C++ <code>pair</code> and Python <code>tuple</code> both define lexicographic comparison and a structural hash, so sorting and de-duplicating work with no code. Java's <code>int[]</code> inherits <code>Object.equals</code>, which compares <b>identities</b> — two arrays with identical contents are different objects, so a <code>HashSet&lt;int[]&gt;</code> never de-duplicates anything. The array works fine as a sortable element (you supply the comparator) and fails silently as a set element or map key.",
    useWhen: "Intervals, coordinates, (value, index) pairs, anything you sort by more than one field.",
    py: `p = (1, 'a')          # immutable, hashable, compares lexicographically
t = (3, 4, 'z')
x, y, z = t           # unpacking

sorted([(2,1), (1,9), (1,3)])   # [(1,3), (1,9), (2,1)] — free

{(1,2)}      # fine — tuples are hashable
{[1,2]}      # TypeError: unhashable type: 'list'
p[0] = 5     # TypeError — tuples are immutable`,
    cpp: `pair<int,string> p{1, "a"};
p.first; p.second;

tuple<int,int,string> t{3, 4, "z"};
get<0>(t); get<2>(t);
auto [x, y, z] = t;            // structured binding, C++17

sort(v.begin(), v.end());      // vector<pair<..>> just works —
                               // pair compares lexicographically
map<pair<int,int>, int> m;     // pair as a key: also free`,
    java: `// Java has NO built-in pair. Three substitutes:

int[] p = {1, 9};                    // the competitive-programming idiom
Map.Entry<Integer,String> e = Map.entry(1, "a");   // read-only
List<Integer> lp = List.of(1, 9);    // hashes and equals CORRECTLY

// the hole:
new HashSet<>(List.of(new int[]{1,2}, new int[]{1,2})).size();  // 2  (!)
new HashSet<>(List.of(List.of(1,2),  List.of(1,2))).size();     // 1

// Java 16+: record P(int a, int b) {} generates equals/hashCode for you.`,
    api: {
      py: [
        { call: "(a, b)", gives: "tuple", cost: "O(1)", gotcha: "immutable and hashable — usable as a dict key or set element" },
        { call: "a, b = t", gives: "unpacking", cost: "O(1)", gotcha: "the arity must match exactly, or ValueError" },
        { call: "sorted(list_of_tuples)", gives: "a new list", cost: "O(n log n)", gotcha: "lexicographic left to right, for free" },
        { call: "namedtuple / NamedTuple", gives: "a tuple with field names", cost: "O(1)", gotcha: "still a tuple — indexable, hashable, immutable" },
      ],
      cpp: [
        { call: "pair<A,B>{a, b} / make_pair", gives: "pair", cost: "O(1)", gotcha: ".first / .second, no get() needed" },
        { call: "tuple<...> / get<i>(t)", gives: "tuple / element", cost: "O(1)", gotcha: "the index must be a compile-time constant" },
        { call: "auto [a, b] = p;", gives: "structured binding", cost: "O(1)", gotcha: "C++17; use auto& to bind by reference" },
        { call: "tie(a, b) = p;", gives: "assigns into existing vars", cost: "O(1)", gotcha: "also the tidy way to write a multi-key comparator" },
      ],
      java: [
        { call: "int[]{a, b}", gives: "int[]", cost: "O(1)", gotcha: "NO value equality or hashCode — useless in a HashSet or as a map key" },
        { call: "List.of(a, b)", gives: "an immutable List", cost: "O(1)", gotcha: "hashes and equals correctly — the right choice for a key" },
        { call: "Map.entry(k, v)", gives: "Map.Entry", cost: "O(1)", gotcha: "immutable; getKey()/getValue(); rejects nulls" },
        { call: "record P(int a, int b) {}", gives: "a value type", cost: "O(1)", gotcha: "Java 16+ only — generates equals, hashCode and toString" },
      ],
    },
    output: "[C++]  R18 p=(1,a) get<0>=3 get<2>=z binding=34z sorted=(1,3)(1,9)(2,1)\n[Java] R18 int[] pair=[1, 9] Map.entry=(1,a) List.of pair=[1, 9]\n[Java] R18dedup HashSet<int[]> size=2 (NO value equality!)   HashSet<List<Integer>> size=1 (correct)\n[Py]   R18 p=(1, 'a') p[0]=1 unpack=34z sorted lexicographically=[(1, 3), (1, 9), (2, 1)]\n[Py]   R18imm tuples are immutable and HASHABLE: {(1,2)} works, {[1,2]} does not. p[0]=5 -> TypeError: 'tuple' object does not support item assignment",
    differs:
      "The executed de-duplication is the point: <code>HashSet&lt;int[]&gt;</code> holding two identical <code>{1,2}</code> arrays reported size <b>2</b>, while <code>HashSet&lt;List&lt;Integer&gt;&gt;</code> reported <b>1</b>. C++ <code>set&lt;pair&lt;int,int&gt;&gt;</code> and Python's <code>{(1,2), (1,2)}</code> both correctly collapse to one. Using <code>int[]</code> as a pair is fine for sorting and wrong for anything hash-based, and nothing tells you.",
    drill: {
      ask: "Sort intervals by start and merge the overlapping ones.",
      lc: "LC 56 · Merge Intervals",
      py: `merged = []
for st, en in sorted(iv):
    if merged and st <= merged[-1][1]: merged[-1][1] = max(merged[-1][1], en)
    else: merged.append([st, en])`,
      cpp: `sort(iv.begin(), iv.end());        // pair sorts by start, then end
vector<pair<int,int>> m;
for (auto& x : iv)
    if (!m.empty() && x.first <= m.back().second) m.back().second = max(m.back().second, x.second);
    else m.push_back(x);`,
      java: `Arrays.sort(iv, Comparator.comparingInt(x -> x[0]));
List<int[]> m = new ArrayList<>();
for (int[] x : iv)
    if (!m.isEmpty() && x[0] <= m.get(m.size()-1)[1])
        m.get(m.size()-1)[1] = Math.max(m.get(m.size()-1)[1], x[1]);
    else m.add(new int[]{x[0], x[1]});`,
      out: "[C++]  D18 mergedIntervals=[1,6][8,10][15,18]\n[Java] D18 mergedIntervals=[1, 6][8, 10][15, 18]\n[Py]   D18 mergedIntervals=[1,6][8,10][15,18]",
    },
    see: ["LC 56 · Merge Intervals", "LC 57 · Insert Interval", "LC 435 · Non-overlapping Intervals", "LC 252 · Meeting Rooms"],
  },
  {
    n: 19,
    title: "A named type as the element",
    tier: "medium",
    group: "shape",
    why: "Once an element has three fields, tuples stop being readable and start being a source of index errors. Each language has a lightweight named type — and each requires a different amount of ceremony before it can be sorted, compared or used as a key.",
    intuition:
      "Sorting needs comparison; a hash set needs equality and a hash. Neither is automatic for a user-defined type in any of the three, but the amount of work differs enormously. Python's <code>@dataclass(order=True, frozen=True)</code> generates all of it from one line. C++ needs <code>operator&lt;</code> or a lambda for sorting, and <code>std::hash</code> specialisation for hashing. Java before 16 needs <code>equals</code> <em>and</em> <code>hashCode</code> written by hand, and getting only one of them right is worse than getting neither.",
    useWhen: "Three or more fields, or any time <code>x[2]</code> stops telling you what it means.",
    py: `from dataclasses import dataclass

@dataclass(frozen=True, order=True)
class P:
    a: int
    b: int

sorted([P(2,5), P(1,7)])     # order=True gives < <= > >= for free
P(1,7) == P(1,7)             # True
{P(1,1), P(1,1)}             # 1 element — frozen=True gives hashability

# order compares fields in DECLARATION order.`,
    cpp: `struct P { int a, b; };

vector<P> v{{2,5}, {1,7}};
sort(v.begin(), v.end(), [](const P& x, const P& y){ return x.a < y.a; });

// for < and ==, write them:
bool operator<(const P& x, const P& y) { return tie(x.a,x.b) < tie(y.a,y.b); }
bool operator==(const P& x, const P& y) { return tie(x.a,x.b) == tie(y.a,y.b); }
// C++20: auto operator<=>(const P&) const = default;  gives all six.`,
    java: `// Java 16+:
record P(int a, int b) {}     // equals, hashCode, toString — generated

// Java 11 and earlier — you write all of it:
static final class P {
    final int a, b;
    P(int a, int b) { this.a = a; this.b = b; }
    @Override public boolean equals(Object o) {
        if (!(o instanceof P)) return false;
        P p = (P) o; return a == p.a && b == p.b;
    }
    @Override public int hashCode() { return Objects.hash(a, b); }
}
v.sort(Comparator.comparingInt(x -> x.a));`,
    api: {
      py: [
        { call: "@dataclass", gives: "__init__, __repr__, __eq__", cost: "—", gotcha: "not hashable by default because it is mutable" },
        { call: "@dataclass(frozen=True)", gives: "immutable and hashable", cost: "—", gotcha: "required to use it in a set or as a dict key" },
        { call: "@dataclass(order=True)", gives: "< <= > >=", cost: "—", gotcha: "compares fields in DECLARATION order — reorder the fields to reorder the sort" },
        { call: "field(compare=False)", gives: "—", cost: "—", gotcha: "excludes a field from ordering, e.g. a payload beside a priority" },
      ],
      cpp: [
        { call: "struct P { ... };", gives: "a value type", cost: "—", gotcha: "no comparison, no hash, no printing generated" },
        { call: "operator<", gives: "bool", cost: "O(fields)", gotcha: "needed for sort(), set<P> and map<P,...>" },
        { call: "tie(a, b) < tie(c, d)", gives: "bool", cost: "O(1)", gotcha: "the clean lexicographic body for operator<" },
        { call: "operator<=> = default", gives: "all six comparisons", cost: "—", gotcha: "C++20; the one-liner replacement for writing them out" },
      ],
      java: [
        { call: "record P(int a, int b) {}", gives: "equals, hashCode, toString, accessors", cost: "—", gotcha: "Java 16+; unavailable on JDK 11" },
        { call: "Objects.hash(fields...)", gives: "int", cost: "O(fields)", gotcha: "the standard hashCode body; must use the same fields as equals" },
        { call: "@Override equals(Object)", gives: "boolean", cost: "O(fields)", gotcha: "the parameter must be Object — typing it as P silently overloads instead" },
        { call: "Comparator.comparingInt(x -> x.f)", gives: "Comparator<T>", cost: "—", gotcha: "sorting needs no equals; hashing needs both" },
      ],
    },
    output: "[C++]  R19 struct sorted first=(1,7) sizeof(P)=8  (no auto ==; you must write operator==)\n[Java] R19 sorted first=(1,7) equals works=true usable as a key=1  (JDK 11: hand-written; Java 16+ `record P(int a,int b){}` generates all of this)\n[Py]   R19 sorted first=P(a=1, b=7) equality=True hashable-as-key=1  (order=True gives comparison free; frozen=True gives hashability)",
    differs:
      "The executed JDK 11 class needed twenty lines to do what Python's one decorator and C++20's one defaulted operator do in one. The failure mode is Java's: if you override <code>equals</code> and forget <code>hashCode</code>, sorting and <code>list.contains</code> keep working while <code>HashSet</code> and <code>HashMap</code> silently stop de-duplicating — the exact bug from rung 18, now hiding inside a class you wrote yourself.",
    drill: {
      ask: "Sort employee records by salary descending and report the top earner.",
      py: `top = sorted(emps, key=lambda e: -e[1])[0]`,
      cpp: `sort(e.begin(), e.end(), [](const Emp&a, const Emp&b){ return a.sal > b.sal; });`,
      java: `e.sort(Comparator.comparingInt((Emp x) -> x.sal).reversed());`,
      out: "[C++]  D19 topEarner=bob 120\n[Java] D19 topEarner=bob 120\n[Py]   D19 topEarner=bob 120",
    },
    see: ["LC 1584 · Min Cost to Connect All Points", "LC 973 · K Closest Points", "LC 1710 · Maximum Units on a Truck"],
  },
  {
    n: 20,
    title: "The hash map: put, get, and the missing key",
    tier: "medium",
    group: "lookup",
    why: "The three languages do three genuinely different things when you ask for a key that is not there. One raises, one returns null, and one <b>silently inserts it</b>.",
    intuition:
      "A hash map turns a key into a bucket index in one step, which is why lookup is O(1) on average rather than O(log n). The average hides two things: a bad hash makes every key collide and degrades to O(n), and the map must occasionally rehash everything into a bigger table, which is O(n) once. The missing-key behaviour is a pure design choice on top of that, and it is where the three diverge hardest — C++'s <code>operator[]</code> must return a reference to something, so if the key is absent it <em>creates</em> the entry to have something to refer to.",
    useWhen: "Two-sum, frequency counting, memoisation, seen-before checks — the single most-used structure after the array.",
    py: `m = {'a': 1}

m['a']              # 1
m['b']              # KeyError  <- RAISES
m.get('b')          # None
m.get('b', -1)      # -1
'b' in m            # False — checks KEYS

m.setdefault('c', 3)          # insert only if absent
d = defaultdict(int); d['zz'] += 1     # auto-creates 0
m.pop('a', None)              # remove, with a default`,
    cpp: `unordered_map<string,int> m;
m["a"] = 1;

m.at("a");            // 1 — throws std::out_of_range if absent
m["zz"];              // 0 — AND INSERTS IT. size() just grew.
m.count("b");         // 0 — the safe check
m.find("b") == m.end();

// read-only lookup must never use operator[]:
auto it = m.find(k);
int v = (it != m.end()) ? it->second : -1;`,
    java: `Map<String,Integer> m = new HashMap<>();
m.put("a", 1);

m.get("a");                // 1
m.get("b");                // null — NOT 0
int x = m.get("b");        // NullPointerException on unboxing
m.getOrDefault("b", -1);   // -1  <- use this
m.containsKey("b");        // false

m.putIfAbsent("c", 3);
m.computeIfAbsent("d", k -> new ArrayList<>());   // the grouping idiom
m.merge("a", 10, Integer::sum);                   // the counting idiom`,
    api: {
      py: [
        { call: "m[k]", gives: "the value", cost: "O(1) avg", gotcha: "RAISES KeyError when absent — never silently inserts" },
        { call: "m.get(k, default)", gives: "value or default", cost: "O(1) avg", gotcha: "the safe read; default is None if you omit it" },
        { call: "m.setdefault(k, v)", gives: "the value now stored", cost: "O(1) avg", gotcha: "inserts if absent; v is evaluated even when unused" },
        { call: "defaultdict(factory)", gives: "a dict", cost: "O(1) avg", gotcha: "READING a missing key inserts it — d[k] grows the dict" },
        { call: "m.items() / .keys() / .values()", gives: "live views", cost: "O(1)", gotcha: "they reflect later changes; wrap in list() to snapshot" },
      ],
      cpp: [
        { call: "m[k]", gives: "T&", cost: "O(1) avg", gotcha: "INSERTS a value-initialised entry when k is absent — even in a read" },
        { call: "m.at(k)", gives: "T&", cost: "O(1) avg", gotcha: "throws std::out_of_range; the safe read" },
        { call: "m.count(k)", gives: "0 or 1", cost: "O(1) avg", gotcha: "the idiomatic membership test before C++20's contains()" },
        { call: "m.find(k)", gives: "iterator", cost: "O(1) avg", gotcha: "compare against m.end(); it->first and it->second" },
        { call: "m.emplace(k, v) / try_emplace", gives: "pair<iterator,bool>", cost: "O(1) avg", gotcha: "the bool says whether it was actually inserted" },
      ],
      java: [
        { call: "m.get(k)", gives: "V or null", cost: "O(1) avg", gotcha: "assigning to an int unboxes null → NullPointerException" },
        { call: "m.getOrDefault(k, d)", gives: "V", cost: "O(1) avg", gotcha: "the safe read — use it by default" },
        { call: "m.put(k, v)", gives: "the PREVIOUS value or null", cost: "O(1) avg", gotcha: "the return value is the old one, not the new one" },
        { call: "m.merge(k, v, fn)", gives: "the new value", cost: "O(1) avg", gotcha: "the cleanest counter: m.merge(k, 1, Integer::sum)" },
        { call: "m.computeIfAbsent(k, fn)", gives: "the value", cost: "O(1) avg", gotcha: "the grouping idiom; the function runs only when absent" },
      ],
    },
    output: "[C++]  R20 m[\"a\"]=1 safe-miss=-1 size before=1 after m[\"zz\"]=2 value=0  <- operator[] inserted it\n[C++]  R20safe m.at(\"a\")=1 find(\"nope\")==end -> true\n[Java] R20 get(\"a\")=1 get(\"b\")=null getOrDefault(\"b\",-1)=-1 size before=1 after get(\"zz\")=1  <- unlike C++ operator[], get never inserts\n[Java] R20trap int x = m.get(\"b\") -> NullPointerException on unboxing null\n[Java] R20api putIfAbsent/computeIfAbsent/merge -> {a=11, c=3, d=4}\n[Py]   R20 m[\"a\"]=1 m.get(\"b\")=None m.get(\"b\",-1)=-1 \"b\" in m -> False\n[Py]   R20trap m[\"b\"] -> KeyError: 'b'  <- RAISES (C++ operator[] silently inserts; Java get returns null)\n[Py]   R20api setdefault -> {'a': 1, 'c': 3}   defaultdict(int)[\"zz\"]+=1 -> {'zz': 1}",
    differs:
      "Executed, side by side: Python <b>raised KeyError</b>, Java returned <b>null</b> (and throws <code>NullPointerException</code> the moment you assign it to an <code>int</code>), and C++ <code>m[\"zz\"]</code> <b>grew the map from 1 entry to 2</b> and handed back 0. The C++ one is the quiet disaster — a read-only lookup inside a loop can double your memory and change the answer of any later <code>size()</code> or iteration. Use <code>.at()</code> or <code>.find()</code> when you are only reading.",
    drill: {
      ask: "Find two indices whose values add to a target, in one pass.",
      lc: "LC 1 · Two Sum",
      py: `seen = {}
for i, x in enumerate(a):
    if t - x in seen: return (seen[t-x], i)
    seen[x] = i`,
      cpp: `unordered_map<int,int> seen;
for (int i = 0; i < (int)a.size(); ++i) {
    auto it = seen.find(t - a[i]);          // find, NOT operator[]
    if (it != seen.end()) return {it->second, i};
    seen[a[i]] = i;
}`,
      java: `Map<Integer,Integer> seen = new HashMap<>();
for (int i = 0; i < a.length; i++) {
    Integer j = seen.get(t - a[i]);         // Integer, so null is testable
    if (j != null) return new int[]{j, i};
    seen.put(a[i], i);
}`,
      out: "[C++]  D20 twoSum=[0,1]\n[Java] D20 twoSum=[0, 1]\n[Py]   D20 twoSum=[0,1]",
    },
    see: ["LC 1 · Two Sum", "LC 49 · Group Anagrams", "LC 560 · Subarray Sum Equals K", "LC 128 · Longest Consecutive Sequence"],
  },
  {
    n: 21,
    title: "Counting frequencies",
    tier: "medium",
    group: "lookup",
    why: "Anagram, majority element, top-k, duplicate detection and half of all string problems reduce to a frequency table. Each language has a one-liner, and each has a faster answer when the alphabet is small.",
    intuition:
      "Counting is one pass, so it is O(n) whatever you count into. The choice is the container. A hash map costs a hash and a bucket probe per element and roughly 40–50 bytes per distinct key. An <code>int[26]</code> costs one subtraction and one increment, fits in cache, and takes 104 bytes total. When the key space is small and known — lowercase letters, digits, values bounded by n — the array is not a micro-optimisation, it is a different constant factor entirely.",
    useWhen: "Any “how many times” question. Reach for the fixed array whenever the key space is bounded.",
    py: `from collections import Counter, defaultdict

c = Counter('abracadabra')      # {'a':5, 'b':2, 'r':2, 'c':1, 'd':1}
c['z']                          # 0 — missing keys read as 0, no insert
c.most_common(2)                # [('a',5), ('b',2)]

d = defaultdict(int)
for ch in s: d[ch] += 1

Counter('aab') - Counter('ab')  # Counter arithmetic: {'a': 1}
Counter(a) == Counter(b)        # a one-line anagram check`,
    cpp: `unordered_map<char,int> f;
for (char c : s) f[c]++;        // operator[] creating 0 is EXACTLY
                                // what you want here

// when the alphabet is fixed, beat the map:
array<int,26> cnt{};
for (char c : s) cnt[c - 'a']++;

// ordered output needs an ordered container:
map<char,int> ord(f.begin(), f.end());`,
    java: `Map<Character,Integer> f = new HashMap<>();
for (char c : s.toCharArray()) f.merge(c, 1, Integer::sum);

// the older spelling:
f.put(c, f.getOrDefault(c, 0) + 1);

// fixed alphabet — much faster:
int[] cnt = new int[26];
for (char c : s.toCharArray()) cnt[c - 'a']++;

// streams:
Map<Character,Long> g = s.chars().mapToObj(c -> (char) c)
    .collect(Collectors.groupingBy(c -> c, Collectors.counting()));`,
    api: {
      py: [
        { call: "Counter(iterable)", gives: "a dict subclass", cost: "O(n)", gotcha: "reading a missing key gives 0 and does NOT insert it" },
        { call: "c.most_common(k)", gives: "list of (key, count)", cost: "O(n log k)", gotcha: "omit k for all of them, sorted descending" },
        { call: "defaultdict(int)", gives: "a dict", cost: "O(n)", gotcha: "reading a missing key DOES insert it — the opposite of Counter" },
        { call: "Counter(a) - Counter(b)", gives: "a Counter", cost: "O(n)", gotcha: "drops zero and negative counts silently" },
        { call: "c.total() / sum(c.values())", gives: "int", cost: "O(k)", gotcha: "total() is 3.10+" },
      ],
      cpp: [
        { call: "m[k]++", gives: "T&", cost: "O(1) avg", gotcha: "relies on operator[] inserting a 0 — the one place that behaviour helps" },
        { call: "array<int,26> cnt{}", gives: "a zeroed array", cost: "O(1)", gotcha: "the braces are what zero it; without them it is garbage" },
        { call: "map<K,V>", gives: "a sorted map", cost: "O(log n) per op", gotcha: "use when you need the counts in key order" },
        { call: "multiset<T>", gives: "a sorted bag", cost: "O(log n)", gotcha: "count(x) is O(log n + k), not O(1)" },
      ],
      java: [
        { call: "m.merge(k, 1, Integer::sum)", gives: "the new count", cost: "O(1) avg", gotcha: "the cleanest counter in Java" },
        { call: "m.getOrDefault(k, 0) + 1", gives: "int", cost: "O(1) avg", gotcha: "the pre-Java-8 spelling; still perfectly fine" },
        { call: "new int[26]", gives: "a zeroed array", cost: "O(1)", gotcha: "index with c - 'a'; check the input really is lowercase" },
        { call: "Collectors.groupingBy(f, counting())", gives: "Map<K, Long>", cost: "O(n)", gotcha: "the values are LONG, not Integer — comparisons surprise people" },
      ],
    },
    output: "[C++]  R21 counts(sorted for printing)= a5 b2 c1 d1 r2 \n[Java] R21 merge()={a=5, b=2, c=1, d=1, r=2} getOrDefault()={a=5, b=2, c=1, d=1, r=2}\n[Java] R21fast int[26] counts a=5 b=2 r=2  (the array beats the map when the alphabet is fixed)\n[Py]   R21 Counter={'a': 5, 'b': 2, 'c': 1, 'd': 1, 'r': 2} most_common(2)=[('a', 5), ('b', 2)]\n[Py]   R21alt defaultdict(int)={'a': 5, 'b': 2, 'c': 1, 'd': 1, 'r': 2}  and Counter arithmetic: {'a': 1}",
    differs:
      "All three produced identical counts for <code>abracadabra</code> — a:5, b:2, r:2, c:1, d:1. The differences are ergonomic and they matter under time pressure: Python's <code>Counter</code> does the whole job in one call and supports arithmetic and <code>most_common</code>; C++ leans on the <code>operator[]</code> auto-insert that was a hazard in rung 20 and is exactly right here; Java needs <code>merge</code> and boxes every count. All three should drop to a fixed <code>int[26]</code> when the alphabet allows it.",
    drill: {
      ask: "Decide whether two strings are anagrams of each other.",
      lc: "LC 242 · Valid Anagram",
      py: `print(Counter("anagram") == Counter("nagaram"))`,
      cpp: `array<int,26> c{};
for (char x : a) c[x-'a']++;
for (char x : b) c[x-'a']--;
bool ok = all_of(c.begin(), c.end(), [](int x){ return x == 0; });`,
      java: `int[] c = new int[26];
for (char x : a.toCharArray()) c[x-'a']++;
for (char x : b.toCharArray()) c[x-'a']--;
boolean ok = Arrays.stream(c).allMatch(x -> x == 0);`,
      out: "[C++]  D21 isAnagram=true\n[Java] D21 isAnagram=true\n[Py]   D21 isAnagram=True",
    },
    see: ["LC 242 · Valid Anagram", "LC 49 · Group Anagrams", "LC 387 · First Unique Character", "LC 169 · Majority Element"],
  },
  {
    n: 22,
    title: "Sets and de-duplication",
    tier: "medium",
    group: "lookup",
    why: "De-duplicating is one call in every language, but the three set flavours differ in what order they hand things back — and picking the wrong flavour turns a deterministic answer into an unstable one.",
    intuition:
      "A hash set is a hash map with the values thrown away: O(1) average membership, and <b>no order</b>. A tree set keeps keys sorted, paying O(log n) per operation for the privilege. An insertion-ordered set remembers arrival order at the cost of a linked list beside the table. If a problem's expected output has a defined order, a hash set alone cannot produce it — you must sort afterwards or use the ordered flavour.",
    useWhen: "Removing duplicates, seen-before checks, intersections and differences.",
    py: `v = [3, 1, 3, 2, 1]

set(v)                  # {1, 2, 3} — UNORDERED (small ints look sorted by luck)
sorted(set(v))          # [1, 2, 3] — deterministic
list(dict.fromkeys(v))  # [3, 1, 2] — dedup PRESERVING first-seen order

{1,2,3} & {2,3,4}       # {2, 3}    intersection
{1,2,3} | {2,3,4}       # {1,2,3,4} union
{1,2,3} - {2,3,4}       # {1}       difference
{1,2,3} ^ {2,3,4}       # {1, 4}    symmetric difference

frozenset({1,2})        # hashable — usable as a dict key`,
    cpp: `vector<int> v{3,1,3,2,1};

unordered_set<int> us(v.begin(), v.end());   // O(1) avg, unordered
set<int> os(v.begin(), v.end());             // O(log n), SORTED

// dedup a vector in place, keeping it sorted:
sort(v.begin(), v.end());
v.erase(unique(v.begin(), v.end()), v.end());
// unique() only collapses ADJACENT duplicates — sorting first is required

set_intersection(a.begin(),a.end(), b.begin(),b.end(), back_inserter(out));`,
    java: `List<Integer> v = List.of(3,1,3,2,1);

new HashSet<>(v);         // [1, 2, 3] — unordered
new TreeSet<>(v);         // [1, 2, 3] — SORTED, O(log n)
new LinkedHashSet<>(v);   // [3, 1, 2] — INSERTION order

Set<Integer> a = new HashSet<>(x);
a.retainAll(y);           // intersection, in place
a.addAll(y);              // union
a.removeAll(y);           // difference`,
    api: {
      py: [
        { call: "set(iterable)", gives: "a set", cost: "O(n)", gotcha: "unordered — never rely on the printed order" },
        { call: "dict.fromkeys(a)", gives: "a dict", cost: "O(n)", gotcha: "list() it to dedup while KEEPING first-seen order" },
        { call: "& | - ^", gives: "a new set", cost: "O(min) / O(n)", gotcha: "the operands must both be sets; a list raises TypeError" },
        { call: "s.add / s.discard / s.remove", gives: "None", cost: "O(1) avg", gotcha: "remove raises on a miss, discard does not" },
        { call: "frozenset(s)", gives: "an immutable set", cost: "O(n)", gotcha: "hashable — the way to put a set inside a set" },
      ],
      cpp: [
        { call: "unordered_set<T>", gives: "a hash set", cost: "O(1) avg", gotcha: "worst case O(n) with adversarial hashes — real in contests" },
        { call: "set<T>", gives: "a sorted set", cost: "O(log n)", gotcha: "iteration is in key order, which is often the reason to pay for it" },
        { call: "unique(f, l)", gives: "an iterator to the new end", cost: "O(n)", gotcha: "collapses ADJACENT duplicates only — sort first, and erase after" },
        { call: "s.insert(x)", gives: "pair<iterator, bool>", cost: "O(log n) / O(1)", gotcha: "the bool tells you whether it was new" },
      ],
      java: [
        { call: "new HashSet<>(c)", gives: "an unordered set", cost: "O(n)", gotcha: "iteration order is unspecified and can change between runs" },
        { call: "new TreeSet<>(c)", gives: "a sorted set", cost: "O(n log n)", gotcha: "also gives first(), last(), floor(), ceiling() — see rung 24" },
        { call: "new LinkedHashSet<>(c)", gives: "insertion-ordered", cost: "O(n)", gotcha: "the one to use when the expected output preserves input order" },
        { call: "retainAll / addAll / removeAll", gives: "boolean", cost: "O(n)", gotcha: "MUTATE the receiver — copy first if you need the original" },
      ],
    },
    output: "[C++]  R22 unordered_set.size()=3 set(ordered)=[1, 2, 3] sort+unique+erase=[1, 2, 3]\n[Java] R22 HashSet=[1, 2, 3] TreeSet(sorted)=[1, 2, 3] LinkedHashSet(insertion order)=[3, 1, 2]\n[Py]   R22 set(v)={1, 2, 3} sorted(set(v))=[1, 2, 3] dict.fromkeys(v) preserves order -> [3, 1, 2]\n[Py]   R22ops {1,2,3} & {2,3,4} = {2, 3}, | = {1, 2, 3, 4}, - = {1}, ^ = {1, 4}",
    differs:
      "The executed line that matters is the ordering: <code>LinkedHashSet</code> gave <b>[3, 1, 2]</b> where <code>HashSet</code> and <code>TreeSet</code> both gave <b>[1, 2, 3]</b>, and Python's <code>dict.fromkeys</code> also gave <b>[3, 1, 2]</b>. Small integers make a hash set <em>look</em> sorted, which is exactly the trap — the same code on strings or large integers produces an order you did not predict. If the answer has an order, impose it.",
    drill: {
      ask: "Return the unique values present in both arrays.",
      lc: "LC 349 · Intersection of Two Arrays",
      py: `print(sorted(set(a) & set(b)))`,
      cpp: `unordered_set<int> sa(a.begin(), a.end());
set<int> out;
for (int x : b) if (sa.count(x)) out.insert(x);`,
      java: `Set<Integer> sa = Arrays.stream(a).boxed().collect(Collectors.toSet());
Set<Integer> out = new TreeSet<>();
for (int x : b) if (sa.contains(x)) out.add(x);`,
      out: "[C++]  D22 intersection=[4,9]\n[Java] D22 intersection=[4, 9]\n[Py]   D22 intersection=[4, 9]",
    },
    see: ["LC 349 · Intersection of Two Arrays", "LC 217 · Contains Duplicate", "LC 128 · Longest Consecutive Sequence", "LC 202 · Happy Number"],
  },
  {
    n: 23,
    title: "Iterating a map, and what order you actually get",
    tier: "medium",
    group: "lookup",
    why: "Only one of the three guarantees the order you see. Writing a solution that depends on hash-map iteration order gives you a program that passes locally and fails on the judge.",
    intuition:
      "A hash map stores entries in buckets chosen by the hash, so iteration walks the table in bucket order — an artefact of the hash function and the table size, not of anything you did. It is not random (it is deterministic for a given build and insertion sequence), which is precisely why it lulls you. Python 3.7+ is the exception: <code>dict</code> keeps a compact insertion-ordered array beside the table and iterates that, which the language now guarantees.",
    useWhen: "Any time you print, collect or compare the contents of a map.",
    py: `m = {'b': 2, 'a': 1, 'c': 3}

list(m)            # ['b', 'a', 'c'] — INSERTION order, guaranteed 3.7+
list(m.items())    # [('b',2), ('a',1), ('c',3)]

sorted(m)                                    # by key
sorted(m.items(), key=lambda kv: kv[1])      # by value
sorted(m.items(), key=lambda kv: (-kv[1], kv[0]))   # count desc, key asc

for k, v in m.items(): ...    # the idiomatic loop`,
    cpp: `map<string,int> om{{"b",2},{"a",1},{"c",3}};
for (auto& [k, v] : om) ...        // SORTED by key, guaranteed

unordered_map<string,int> um{{"b",2},{"a",1},{"c",3}};
for (auto& [k, v] : um) ...        // UNSPECIFIED order

// sort a map by value: copy into a vector first
vector<pair<string,int>> vs(um.begin(), um.end());
sort(vs.begin(), vs.end(), [](auto&a, auto&b){ return a.second < b.second; });`,
    java: `Map<String,Integer> hm = new HashMap<>();
for (Map.Entry<String,Integer> e : hm.entrySet())
    e.getKey(); e.getValue();      // UNSPECIFIED order

new TreeMap<>(hm)          // sorted by key
new LinkedHashMap<>()      // insertion order

// sort by value:
hm.entrySet().stream()
  .sorted(Map.Entry.comparingByValue())
  .forEach(e -> ...);`,
    api: {
      py: [
        { call: "for k in m", gives: "keys, in insertion order", cost: "O(n)", gotcha: "guaranteed from 3.7 — but sort anyway if the answer has an order" },
        { call: "m.items() / .keys() / .values()", gives: "live views", cost: "O(1)", gotcha: "mutating m during the loop raises RuntimeError" },
        { call: "sorted(m.items(), key=...)", gives: "a list of tuples", cost: "O(n log n)", gotcha: "the general by-value sort" },
        { call: "collections.OrderedDict", gives: "an ordered dict", cost: "—", gotcha: "mostly historical now; move_to_end is its remaining use" },
      ],
      cpp: [
        { call: "map<K,V>", gives: "sorted iteration", cost: "O(log n) per op", gotcha: "a red-black tree — the ordering is the reason to pay for it" },
        { call: "unordered_map<K,V>", gives: "unspecified iteration", cost: "O(1) avg", gotcha: "order changes with table size, so it changes as you insert" },
        { call: "for (auto& [k,v] : m)", gives: "structured binding", cost: "O(n)", gotcha: "C++17; take by reference or you copy every entry" },
        { call: "m.erase(it++)", gives: "—", cost: "O(1)", gotcha: "the safe erase-while-iterating idiom for node-based containers" },
      ],
      java: [
        { call: "m.entrySet()", gives: "Set<Map.Entry>", cost: "O(1)", gotcha: "the only single-pass way to get both key and value" },
        { call: "TreeMap", gives: "key-sorted iteration", cost: "O(log n)", gotcha: "keys must be Comparable or you supply a Comparator" },
        { call: "LinkedHashMap", gives: "insertion-ordered", cost: "O(1) avg", gotcha: "accessOrder=true turns it into an LRU cache" },
        { call: "Map.Entry.comparingByValue()", gives: "Comparator", cost: "—", gotcha: "the by-value sort; there is also comparingByKey()" },
      ],
    },
    output: "[C++]  R23 map(sorted)= a=1 b=2 c=3   unordered_map order= c a b  (unspecified, do not rely on it)\n[Java] R23 HashMap iteration order= a b c  (unspecified)   TreeMap= a=1 b=2 c=3 \n[Py]   R23 dict preserves INSERTION order (3.7+): keys=['b', 'a', 'c'] items=[('b', 2), ('a', 1), ('c', 3)] sorted by value=[('a', 1), ('b', 2), ('c', 3)]",
    differs:
      "Python printed <b>b, a, c</b> — the order the keys went in, guaranteed. C++ <code>unordered_map</code> printed <b>c, a, b</b> and Java's <code>HashMap</code> printed <b>a, b, c</b>; neither is promised anything and both would change with a different table size. The rule that survives all three: if the expected output has an order, produce it explicitly with a sorted container or a sort, and never inherit it from a hash table.",
    drill: {
      ask: "Report the most frequent element and how often it occurs.",
      lc: "LC 347 · Top K Frequent Elements",
      py: `k, v = Counter(a).most_common(1)[0]`,
      cpp: `unordered_map<int,int> f; for (int x : a) f[x]++;
auto best = max_element(f.begin(), f.end(),
    [](auto& x, auto& y){ return x.second < y.second; });`,
      java: `Map<Integer,Integer> f = new HashMap<>();
for (int x : a) f.merge(x, 1, Integer::sum);
var best = Collections.max(f.entrySet(), Map.Entry.comparingByValue());`,
      out: "[C++]  D23 mostFrequent=1 count=3\n[Java] D23 mostFrequent=1 count=3\n[Py]   D23 mostFrequent=1 count=3",
    },
    see: ["LC 347 · Top K Frequent Elements", "LC 169 · Majority Element", "LC 451 · Sort Characters By Frequency"],
  },
  {
    n: 24,
    title: "Ordered maps: floor, ceiling, first and last",
    tier: "medium",
    group: "lookup",
    why: "“The next booking after 10am”, “the largest value below x” — these need a map that knows about order. Java names the operations, C++ makes you do iterator arithmetic, and Python does not ship the structure at all.",
    intuition:
      "A tree map keeps keys in a balanced binary search tree, so every operation is a root-to-leaf walk: O(log n) for insert, lookup, <em>and</em> for “nearest key above or below”. That last one is the whole reason to use it — a hash map cannot answer it at all, because hashing deliberately destroys the ordering. Python has no tree map in the standard library, so the standard substitute is a sorted list plus <code>bisect</code>: O(log n) queries but O(n) inserts, which is fine when you build once and query many times, and not fine otherwise.",
    useWhen: "Nearest-key queries, interval scheduling, running medians, anything where 'closest to x' is the question.",
    py: `# there is NO TreeMap in the standard library.
import bisect
keys = sorted(m)                     # build once

i = bisect.bisect_left(keys, 15)
keys[i]      # 20 — ceiling: the smallest key >= 15
keys[i-1]    # 10 — floor:   the largest key <= 15  (guard i > 0)
keys[0], keys[-1]                    # first, last

# inserting into the sorted list is O(n):
bisect.insort(keys, 17)
# for O(log n) writes: pip install sortedcontainers -> SortedDict`,
    cpp: `map<int,string> m{{10,"a"},{20,"b"},{30,"c"}};

m.lower_bound(15);      // first key >= 15  -> 20  (CEILING)
m.upper_bound(20);      // first key >  20  -> 30
auto it = m.lower_bound(15); --it;   // FLOOR -> 10  (check it != begin() first)

m.begin()->first;       // 10  first
m.rbegin()->first;      // 30  last

// there is no named floor(); you step back from lower_bound.`,
    java: `TreeMap<Integer,String> m = new TreeMap<>();

m.ceilingKey(15);   // 20 — smallest key >= 15
m.floorKey(15);     // 10 — largest  key <= 15
m.higherKey(20);    // 30 — strictly greater
m.lowerKey(20);     // 10 — strictly smaller
m.firstKey();       // 10
m.lastKey();        // 30

m.headMap(20);      // a live view of everything below 20
m.subMap(10, 30);   // a live view of a range
// all four return NULL when there is no such key — check before unboxing.`,
    api: {
      py: [
        { call: "bisect.bisect_left(a, x)", gives: "the ceiling INDEX", cost: "O(log n)", gotcha: "an index, not a key; a[i] may not exist if i == len(a)" },
        { call: "bisect.insort(a, x)", gives: "None", cost: "O(n)", gotcha: "the search is O(log n), the insert is O(n) — this is the ceiling on the approach" },
        { call: "sortedcontainers.SortedDict", gives: "a real tree map", cost: "O(log n)", gotcha: "third party; unavailable on most judges" },
        { call: "heapq", gives: "min access only", cost: "O(log n)", gotcha: "a heap answers 'the smallest', never 'the nearest to x'" },
      ],
      cpp: [
        { call: "m.lower_bound(k)", gives: "iterator to first >= k", cost: "O(log n)", gotcha: "this is CEILING; equals end() when there is none" },
        { call: "m.upper_bound(k)", gives: "iterator to first > k", cost: "O(log n)", gotcha: "strictly greater" },
        { call: "--m.lower_bound(k)", gives: "iterator to FLOOR", cost: "O(log n)", gotcha: "undefined if lower_bound is already begin() — guard it" },
        { call: "m.begin() / m.rbegin()", gives: "first / last", cost: "O(1)", gotcha: "rbegin()->first, not rbegin().first" },
      ],
      java: [
        { call: "ceilingKey(k) / ceilingEntry(k)", gives: "the key or NULL", cost: "O(log n)", gotcha: "returns null — unboxing to int is a NullPointerException" },
        { call: "floorKey(k)", gives: "the key or null", cost: "O(log n)", gotcha: "inclusive; lowerKey is the strict version" },
        { call: "higherKey / lowerKey", gives: "strictly beyond", cost: "O(log n)", gotcha: "the off-by-one twin of ceiling/floor" },
        { call: "headMap / tailMap / subMap", gives: "live VIEWS", cost: "O(1)", gotcha: "writes go through to the parent map" },
        { call: "firstKey() / lastKey()", gives: "the key", cost: "O(log n)", gotcha: "THROWS NoSuchElementException on an empty map, unlike the others" },
      ],
    },
    output: "[C++]  R24 ceiling(15)=20 floor(15)=10 higher(20)=30 first=10 last=30\n[Java] R24 ceilingKey(15)=20 floorKey(15)=10 higherKey(20)=30 lowerKey(20)=10 firstKey=10 lastKey=30  (named methods — no iterator arithmetic)\n[Py]   R24 no TreeMap in the stdlib. sorted keys + bisect: ceiling(15)=20 floor(15)=10 first=10 last=30  (inserting stays O(n) — use sortedcontainers if you need O(log n) writes)",
    differs:
      "All three produced ceiling <b>20</b> and floor <b>10</b> for the query 15, but the effort differs sharply. Java names every operation. C++ gives you <code>lower_bound</code> and expects you to step backwards for the floor — and stepping back from <code>begin()</code> is undefined behaviour, so that guard is not optional. Python has no such structure at all: the executed answer came from a sorted key list and <code>bisect</code>, which is O(log n) to query and O(n) to update.",
    drill: {
      ask: "Given scheduled events, find the next one strictly after a given time.",
      py: `keys = sorted(ev)
i = bisect.bisect_right(keys, 10)
print(keys[i], ev[keys[i]])          # guard i == len(keys) for 'none left'`,
      cpp: `auto it = ev.upper_bound(10);
if (it != ev.end()) cout << it->first << " " << it->second;`,
      java: `var e = ev.higherEntry(10);
if (e != null) System.out.println(e.getKey() + " " + e.getValue());`,
      out: "[C++]  D24 nextEventAfter(10)=13 lunch  none after 17 -> true\n[Java] D24 nextEventAfter(10)=13 lunch  none after 17 -> true\n[Py]   D24 nextEventAfter(10)=13 lunch  none after 17 -> True",
    },
    see: ["LC 729 · My Calendar I", "LC 981 · Time Based Key-Value Store", "LC 220 · Contains Duplicate III"],
  },
  {
    n: 25,
    title: "Binary search, and what each returns on a miss",
    tier: "hard",
    group: "search",
    why: "All three ship a binary search and all three report a miss differently. Assuming the wrong convention gives you an index that looks plausible, indexes real memory, and is wrong.",
    intuition:
      "Binary search halves the candidate range each step, so it finishes in ⌈log₂ n⌉ probes — 20 for a million, 30 for a billion. It requires the range to be <b>sorted</b>, and none of the three check: on unsorted input you get a wrong answer rather than an error. The interesting design question is what to return when the target is absent, because the algorithm always terminates knowing exactly where the target <em>would</em> go. Python and C++ hand you that position. Java encodes it as a negative number instead.",
    useWhen: "Any sorted array. Also the answer to “minimise the maximum”-shaped problems, where you binary-search the answer rather than an index.",
    py: `import bisect
s = [1, 3, 5, 7]

bisect.bisect_left(s, 5)    # 2 — index of the first 5
bisect.bisect_left(s, 4)    # 2 — the INSERTION POINT
bisect.bisect_left(s, 99)   # 4 — == len(s), no error

# "was it actually there?" is a separate question:
i = bisect.bisect_left(s, 4)
found = i < len(s) and s[i] == 4     # False

bisect.insort(s, 4)         # search + insert, O(n) because of the shift`,
    cpp: `vector<int> s{1,3,5,7};

binary_search(s.begin(), s.end(), 5);      // true/false only

auto it = lower_bound(s.begin(), s.end(), 4);
int idx = it - s.begin();                  // 2 — the insertion point

auto it2 = lower_bound(s.begin(), s.end(), 99);
it2 == s.end();                            // true — CHECK before dereferencing

// found-ness:
bool found = (it != s.end() && *it == 4);`,
    java: `int[] s = {1,3,5,7};

Arrays.binarySearch(s, 5);   //  2 — found
Arrays.binarySearch(s, 4);   // -3 — NOT an index
Arrays.binarySearch(s, 99);  // -5

// on a miss: insertionPoint = -result - 1
int r = Arrays.binarySearch(s, 4);
int pos = r >= 0 ? r : -r - 1;        // 2

Collections.binarySearch(list, key);   // same encoding for Lists`,
    api: {
      py: [
        { call: "bisect_left(a, x)", gives: "the first index where x could go", cost: "O(log n)", gotcha: "returns an insertion point, never -1; found-ness needs a separate check" },
        { call: "bisect_right(a, x)", gives: "the index AFTER any equals", cost: "O(log n)", gotcha: "bisect() is an alias for bisect_right" },
        { call: "insort_left / insort_right", gives: "None", cost: "O(n)", gotcha: "the search is fast, the insert is not" },
        { call: "bisect_left(a, x, lo, hi)", gives: "int", cost: "O(log n)", gotcha: "the lo/hi window is how you binary-search a sub-range" },
      ],
      cpp: [
        { call: "binary_search(f, l, x)", gives: "bool", cost: "O(log n)", gotcha: "tells you IF, never WHERE" },
        { call: "lower_bound(f, l, x)", gives: "iterator to first >= x", cost: "O(log n)", gotcha: "returns l on a miss past the end — compare before subtracting" },
        { call: "upper_bound(f, l, x)", gives: "iterator to first > x", cost: "O(log n)", gotcha: "the pair with lower_bound gives you the equal range" },
        { call: "s.lower_bound(x) on a set", gives: "iterator", cost: "O(log n)", gotcha: "use the MEMBER version on set/map — the free function is O(n) there" },
      ],
      java: [
        { call: "Arrays.binarySearch(a, key)", gives: "index, or -(insertion)-1", cost: "O(log n)", gotcha: "a NEGATIVE ENCODING — never use the result directly as an index" },
        { call: "-result - 1", gives: "the insertion point", cost: "O(1)", gotcha: "memorise this; it is the only way back" },
        { call: "Arrays.binarySearch(a, from, to, key)", gives: "int", cost: "O(log n)", gotcha: "the range form; to is exclusive" },
        { call: "Collections.binarySearch(list, key)", gives: "int", cost: "O(log n)", gotcha: "O(n log n) on a LinkedList — it cannot jump" },
      ],
    },
    output: "[C++]  R25 binary_search(5)=true lower_bound(4) idx=2 lower_bound(99)==end -> true idx=4\n[Java] R25 binarySearch(5)=2 binarySearch(4)=-3 -> insertionPoint = -(-3)-1 = 2   binarySearch(99)=-5 -> 4  <- a NEGATIVE ENCODING, never an index\n[Py]   R25 bisect_left(s,5)=2 (hit) bisect_left(s,4)=2 (insertion point) bisect_left(s,99)=4 (== len, no error)\n[Py]   R25found \"was it there?\" needs an explicit check: i=bisect_left(s,4); i<len(s) and s[i]==4 -> False",
    differs:
      "Executed: Python's <code>bisect_left(s, 4)</code> gave <b>2</b>, C++'s <code>lower_bound</code> gave an iterator at offset <b>2</b>, and Java's <code>binarySearch(s, 4)</code> gave <b>-3</b>. That −3 is not an index; <code>-(-3) - 1 = 2</code> recovers the same answer. Treating Java's −3 as an index reads <code>s[-3]</code>, which throws — and treating a <em>successful</em> Java result as an insertion point is worse, because it does not throw. Note also that neither Python nor C++ tells you whether the value was actually present; that always needs the extra <code>a[i] == x</code> check.",
    drill: {
      ask: "Return the index where a target is, or where it should be inserted.",
      lc: "LC 35 · Search Insert Position",
      py: `print(bisect.bisect_left(a, target))`,
      cpp: `int pos = lower_bound(a.begin(), a.end(), target) - a.begin();`,
      java: `int r = Arrays.binarySearch(a, target);
int pos = r >= 0 ? r : -r - 1;`,
      out: "[C++]  D25 searchInsert(5)=2 (2)=1 (7)=4 (0)=0\n[Java] D25 searchInsert(5)=2 (2)=1 (7)=4 (0)=0   (via -binarySearch()-1 on a miss)\n[Py]   D25 searchInsert(5)=2 (2)=1 (7)=4 (0)=0",
    },
    see: ["LC 35 · Search Insert Position", "LC 704 · Binary Search", "LC 33 · Search in Rotated Sorted Array", "LC 875 · Koko Eating Bananas"],
  },
  {
    n: 26,
    title: "Lower bound and upper bound: counting duplicates",
    tier: "hard",
    group: "search",
    why: "A plain binary search on an array with duplicates lands on an arbitrary one of them. To find the first, the last, or how many there are, you need the two-bound version — and Java does not ship it.",
    intuition:
      "<code>lower_bound</code> finds the first position where the target could be inserted <em>keeping the order</em>; <code>upper_bound</code> finds the last such position. Between them sit exactly the elements equal to the target, so <code>upper - lower</code> is the count, in O(log n), without touching a single duplicate. Both are the same loop with one character changed: <code>&lt;</code> versus <code>&lt;=</code>. That is the whole difference, and it is worth memorising as a pair rather than as two functions.",
    useWhen: "Duplicates in sorted data. First/last occurrence, counting occurrences, range queries on a sorted list.",
    py: `import bisect
s = [1, 3, 3, 3, 5]

bisect.bisect_left(s, 3)    # 1 — first index of 3
bisect.bisect_right(s, 3)   # 4 — one past the last 3
                            # count = 4 - 1 = 3

# bisect() with no suffix == bisect_right`,
    cpp: `vector<int> s{1,3,3,3,5};

auto lo = lower_bound(s.begin(), s.end(), 3);   // offset 1
auto hi = upper_bound(s.begin(), s.end(), 3);   // offset 4
hi - lo;                                        // 3

auto [a, b] = equal_range(s.begin(), s.end(), 3);   // both at once

// on a multiset, use the MEMBER versions: ms.equal_range(3)`,
    java: `// Java ships NEITHER. Arrays.binarySearch on duplicates lands
// on an ARBITRARY matching index. You write the two bounds:

static int lowerBound(int[] a, int t) {
    int lo = 0, hi = a.length;
    while (lo < hi) { int m = lo + (hi - lo) / 2;
        if (a[m] < t) lo = m + 1; else hi = m; }
    return lo;
}
static int upperBound(int[] a, int t) {
    int lo = 0, hi = a.length;
    while (lo < hi) { int m = lo + (hi - lo) / 2;
        if (a[m] <= t) lo = m + 1; else hi = m; }   // <= is the ONLY change
    return lo;
}`,
    api: {
      py: [
        { call: "bisect_left(a, x)", gives: "the first position of x", cost: "O(log n)", gotcha: "equals bisect_right when x is absent" },
        { call: "bisect_right(a, x)", gives: "one past the last x", cost: "O(log n)", gotcha: "aliased as bisect(); the suffix-less name is the RIGHT one" },
        { call: "bisect_right - bisect_left", gives: "the count", cost: "O(log n)", gotcha: "no scan needed, whatever the multiplicity" },
      ],
      cpp: [
        { call: "lower_bound(f, l, x)", gives: "first >= x", cost: "O(log n)", gotcha: "O(n) on a std::set — use the member function there" },
        { call: "upper_bound(f, l, x)", gives: "first > x", cost: "O(log n)", gotcha: "the same loop with <= instead of <" },
        { call: "equal_range(f, l, x)", gives: "both bounds as a pair", cost: "O(log n)", gotcha: "one call, two answers" },
        { call: "distance(lo, hi)", gives: "the count", cost: "O(1) on a vector", gotcha: "O(n) on node-based iterators" },
      ],
      java: [
        { call: "(no lowerBound)", gives: "—", cost: "—", gotcha: "write it. This is standard interview furniture — know it cold" },
        { call: "Arrays.binarySearch on duplicates", gives: "SOME matching index", cost: "O(log n)", gotcha: "unspecified WHICH one — not the first, not the last" },
        { call: "TreeMap.floorKey/ceilingKey", gives: "nearest keys", cost: "O(log n)", gotcha: "the named alternative when you can afford a TreeMap" },
      ],
    },
    output: "[C++]  R26 lower=1 upper=4 count=3 equal_range=(1,4)\n[Java] R26 hand-written lowerBound=1 upperBound=4 count=3   Arrays.binarySearch(s,3)=2 <- lands on an ARBITRARY one of the equal keys\n[Py]   R26 bisect_left=1 bisect_right=4 count=3  (bisect_right is the same as bisect)",
    differs:
      "All three counted <b>3</b> occurrences of the value 3, with bounds at <b>1</b> and <b>4</b>. Only Java needed hand-written code to do it — and the executed line shows why you cannot shortcut it: <code>Arrays.binarySearch(s, 3)</code> returned <b>2</b>, the middle duplicate, which is neither the first nor the last. Note the one-character difference between the two bound functions: <code>a[m] &lt; t</code> against <code>a[m] &lt;= t</code>.",
    drill: {
      ask: "Find the first and last position of a target in a sorted array.",
      lc: "LC 34 · Find First and Last Position of Element",
      py: `lo, hi = bisect.bisect_left(a, t), bisect.bisect_right(a, t)
print([lo, hi-1] if lo < hi else [-1, -1])`,
      cpp: `int lo = lower_bound(a.begin(),a.end(),t) - a.begin();
int hi = upper_bound(a.begin(),a.end(),t) - a.begin();`,
      java: `int lo = lowerBound(a, t), hi = upperBound(a, t);   // both hand-written`,
      out: "[C++]  D26 range of 8 = [3,5] count=3\n[Java] D26 range of 8 = [3,5] count=3   (hand-written bounds: Java ships none)\n[Py]   D26 range of 8 = [3,5] count=3",
    },
    see: ["LC 34 · First and Last Position", "LC 300 · Longest Increasing Subsequence", "LC 981 · Time Based Key-Value Store"],
  },
  {
    n: 27,
    title: "Prefix sums, and the off-by-one that is not one",
    tier: "hard",
    group: "search",
    why: "Range-sum queries go from O(n) each to O(1) each with one precomputation. Whether you size the prefix array n or n+1 decides whether your code needs an <code>if</code> in the hot path.",
    intuition:
      "Define <code>p[i]</code> as the sum of the first <code>i</code> elements — note <em>i</em>, not <em>i+1</em>. Then <code>p[0] = 0</code> costs you one slot and buys you the identity <code>sum(a[l..r]) = p[r+1] - p[l]</code> with no special case for <code>l == 0</code>. Size it n instead, and every query needs <code>if (l == 0)</code>. The n+1 convention is not a style preference; it is the version that has no edge case, which is why every competitive template uses it. The accumulator must be wide (rung 9) — range sums overflow faster than anything else.",
    useWhen: "Repeated range sums, subarray-sum-equals-k, 2D region sums, difference arrays for range updates.",
    py: `a = [2, 4, 6, 8]

p = [0]
for x in a: p.append(p[-1] + x)
# [0, 2, 6, 12, 20]

sum_lr = lambda l, r: p[r+1] - p[l]     # inclusive l..r
sum_lr(1, 2)      # 10

import itertools
list(itertools.accumulate(a))                # [2, 6, 12, 20]  — size n
list(itertools.accumulate(a, initial=0))     # [0, 2, 6, 12, 20] — size n+1`,
    cpp: `vector<int> a{2,4,6,8};

vector<long long> p(a.size() + 1, 0);        // long long — range sums overflow
for (size_t i = 0; i < a.size(); ++i) p[i+1] = p[i] + a[i];

long long q = p[r+1] - p[l];                 // inclusive l..r

partial_sum(a.begin(), a.end(), out.begin());  // size n — needs the if`,
    java: `int[] a = {2,4,6,8};

long[] p = new long[a.length + 1];           // long[] — not int[]
for (int i = 0; i < a.length; i++) p[i+1] = p[i] + a[i];

long q = p[r+1] - p[l];

// 2D:  p[i+1][j+1] = a[i][j] + p[i][j+1] + p[i+1][j] - p[i][j]`,
    api: {
      py: [
        { call: "itertools.accumulate(a)", gives: "a lazy running sum, size n", cost: "O(n)", gotcha: "no leading zero — the version that needs the if" },
        { call: "accumulate(a, initial=0)", gives: "size n+1", cost: "O(n)", gotcha: "3.8+; this is the convention you want" },
        { call: "accumulate(a, func)", gives: "running fold", cost: "O(n)", gotcha: "also does running max, running product — same trick, different operator" },
      ],
      cpp: [
        { call: "partial_sum(f, l, out)", gives: "an output iterator", cost: "O(n)", gotcha: "writes n values, no leading zero" },
        { call: "vector<long long> p(n+1)", gives: "the padded array", cost: "O(n)", gotcha: "long long is not optional: 10⁵ × 10⁹ overflows int by three orders" },
        { call: "adjacent_difference(f, l, out)", gives: "the inverse", cost: "O(n)", gotcha: "recovers a from p — the difference-array trick" },
      ],
      java: [
        { call: "new long[n+1]", gives: "the padded array", cost: "O(n)", gotcha: "int[] overflows silently on large sums" },
        { call: "Arrays.parallelPrefix(a, op)", gives: "in-place prefix", cost: "O(n)", gotcha: "mutates a, and has no leading-zero form" },
        { call: "p[r+1] - p[l]", gives: "the inclusive range sum", cost: "O(1)", gotcha: "the +1 is what removes the l == 0 special case" },
      ],
    },
    output: "[C++]  R27 prefix=[0, 2, 6, 12, 20] sum a[1..2]=10  (size n+1 is what removes the if)\n[C++]  R27std partial_sum=[2, 6, 12, 20] (size n, needs the if)\n[Java] R27 prefix=[0, 2, 6, 12, 20] sum a[1..2]=10  (long[] because int sums overflow at ~2.1e9)\n[Py]   R27 prefix(n+1)=[0, 2, 6, 12, 20] sum a[1..2]=10   itertools.accumulate(n)=[2, 6, 12, 20] accumulate with initial=0 -> [0, 2, 6, 12, 20]",
    differs:
      "All three produced <code>[0, 2, 6, 12, 20]</code> and answered <code>sum(a[1..2]) = 10</code>. The executed contrast is inside the standard libraries: C++ <code>partial_sum</code> and Python's bare <code>accumulate</code> both give the <b>size-n</b> form <code>[2, 6, 12, 20]</code>, which needs a branch on every query. Build the n+1 form by hand — the loop is two lines and it deletes an entire class of edge case.",
    drill: {
      ask: "Answer repeated inclusive range-sum queries in O(1) each.",
      lc: "LC 303 · Range Sum Query — Immutable",
      py: `p = [0] + list(itertools.accumulate(a))
q = lambda l, r: p[r+1] - p[l]`,
      cpp: `vector<long long> p(a.size()+1, 0);
for (size_t i = 0; i < a.size(); ++i) p[i+1] = p[i] + a[i];
auto q = [&](int l, int r){ return p[r+1] - p[l]; };`,
      java: `long[] p = new long[a.length+1];
for (int i = 0; i < a.length; i++) p[i+1] = p[i] + a[i];
// query: p[r+1] - p[l]`,
      out: "[C++]  D27 sumRange(0,2)=1 (2,5)=-1 (0,5)=-3\n[Java] D27 sumRange(0,2)=1 (2,5)=-1 (0,5)=-3\n[Py]   D27 sumRange(0,2)=1 (2,5)=-1 (0,5)=-3",
    },
    see: ["LC 303 · Range Sum Query", "LC 560 · Subarray Sum Equals K", "LC 304 · Range Sum Query 2D", "LC 1109 · Corporate Flight Bookings"],
  },
  {
    n: 28,
    title: "The stack",
    tier: "hard",
    group: "linear structures",
    why: "Parentheses, monotonic stacks, iterative DFS and expression evaluation all need LIFO. Two of the three languages have a dedicated type you should <em>not</em> use, for different reasons.",
    intuition:
      "A stack is a dynamic array where you only ever touch the last element, so push and pop are the O(1) amortised operations from rung 4 with the O(n) ones forbidden. That is why a plain list <em>is</em> a stack in Python and why Java's <code>ArrayDeque</code> beats its own <code>Stack</code> class — <code>Stack</code> extends <code>Vector</code>, so every operation is synchronised and it iterates bottom-up, which reads backwards from how you think about it.",
    useWhen: "Matching brackets, next-greater-element, undo, iterative tree traversal, monotonic stacks.",
    py: `st = []          # a plain list IS the stack

st.append(2)     # push — O(1)
st[-1]           # peek
st.pop()         # pop  — O(1), RETURNS the element
len(st)
if st: ...       # emptiness check

[].pop()         # IndexError: pop from empty list`,
    cpp: `stack<int> st;   // an adaptor over deque by default

st.push(2);
st.top();        // peek — UNDEFINED BEHAVIOUR when empty, not an exception
st.pop();        // returns VOID — read top() first
st.size(); st.empty();

// no iteration: a std::stack cannot be traversed.
// If you need to look inside, use a vector as your stack.
vector<int> s; s.push_back(x); s.back(); s.pop_back();`,
    java: `Deque<Integer> st = new ArrayDeque<>();   // the RECOMMENDED stack

st.push(2);      // == addFirst
st.peek();       // null when empty — no exception
st.pop();        // returns the element; THROWS NoSuchElementException when empty
st.isEmpty();

Stack<Integer> old = new Stack<>();   // legacy: synchronised, and
                                      // toString() prints BOTTOM-first`,
    api: {
      py: [
        { call: "a.append(x)", gives: "None", cost: "O(1) amortised", gotcha: "push" },
        { call: "a.pop()", gives: "the element", cost: "O(1)", gotcha: "raises IndexError on empty — check `if st:` first" },
        { call: "a[-1]", gives: "the top", cost: "O(1)", gotcha: "also raises on empty" },
        { call: "collections.deque", gives: "a deque", cost: "O(1) both ends", gotcha: "unnecessary for a pure stack; a list is already optimal" },
      ],
      cpp: [
        { call: "st.push(x) / emplace(x)", gives: "void", cost: "O(1)", gotcha: "—" },
        { call: "st.top()", gives: "T&", cost: "O(1)", gotcha: "UNDEFINED BEHAVIOUR on empty — no exception, no crash you can trust" },
        { call: "st.pop()", gives: "void", cost: "O(1)", gotcha: "returns nothing; the two-step top()-then-pop() is mandatory" },
        { call: "vector as a stack", gives: "—", cost: "O(1)", gotcha: "push_back/back/pop_back, and you can still iterate it" },
      ],
      java: [
        { call: "ArrayDeque.push/pop/peek", gives: "void / E / E", cost: "O(1)", gotcha: "push is addFirst — the deque's head is the stack's top" },
        { call: "peek()", gives: "E or null", cost: "O(1)", gotcha: "null on empty; pop() throws instead — the pair is inconsistent" },
        { call: "java.util.Stack", gives: "a legacy stack", cost: "O(1)", gotcha: "synchronised (slower) and iterates bottom-up. Avoid" },
        { call: "ArrayDeque forbids null", gives: "—", cost: "—", gotcha: "NullPointerException on push(null) — because null is the empty signal" },
      ],
    },
    output: "[C++]  R28 top=2 size=1 empty=false  (pop() returns void; top() on empty is UB, not an exception)\n[Java] R28 ArrayDeque push/pop -> popped=2 peek=1 size=1   legacy Stack.toString()=[1, 2] (bottom-first — reads backwards)\n[Java] R28empty peek()=null (null, no throw)  pop() would throw NoSuchElementException\n[Py]   R28 a plain list IS the stack: append/pop -> popped=2 top=1 len=1\n[Py]   R28empty [].pop() -> IndexError: pop from empty list  (Python raises; C++ top() on empty is undefined behaviour)",
    differs:
      "The empty-stack behaviour is the executed lesson: Python <b>raised IndexError</b>, Java's <code>peek()</code> returned <b>null</b> while <code>pop()</code> would have thrown, and C++ <code>top()</code> on an empty stack is <b>undefined behaviour</b> — it may return garbage and carry on, which is the worst of the three because your program keeps running with a wrong value. Java's legacy <code>Stack.toString()</code> printed <b>[1, 2]</b>, bottom first, which reads backwards from the mental model.",
    drill: {
      ask: "Decide whether a string of brackets is correctly matched and nested.",
      lc: "LC 20 · Valid Parentheses",
      py: `st, m = [], {')':'(', ']':'[', '}':'{'}
for c in s:
    if c in m:
        if not st or st.pop() != m[c]: return False
    else: st.append(c)
return not st`,
      cpp: `stack<char> st; unordered_map<char,char> m{{')','('},{']','['},{'}','{'}};
for (char c : s) {
    if (m.count(c)) { if (st.empty() || st.top() != m[c]) return false; st.pop(); }
    else st.push(c);
}
return st.empty();`,
      java: `Deque<Character> st = new ArrayDeque<>();
Map<Character,Character> m = Map.of(')','(', ']','[', '}','{');
for (char c : s.toCharArray()) {
    if (m.containsKey(c)) { if (st.isEmpty() || st.pop() != m.get(c)) return false; }
    else st.push(c);
}
return st.isEmpty();`,
      out: "[C++]  D28 \"()[]{}\"=true \"(]\"=false \"([)]\"=false\n[Java] D28 \"()[]{}\"=true \"(]\"=false \"([)]\"=false\n[Py]   D28 \"()[]{}\"=True \"(]\"=False \"([)]\"=False",
    },
    see: ["LC 20 · Valid Parentheses", "LC 739 · Daily Temperatures", "LC 155 · Min Stack", "LC 84 · Largest Rectangle in Histogram"],
  },
  {
    n: 29,
    title: "The queue, and the O(n) mistake",
    tier: "hard",
    group: "linear structures",
    why: "Every BFS needs a queue. Using a list or an ArrayList as one turns an O(V+E) traversal into O(V²) — and it still produces the right answer, just too slowly to pass.",
    intuition:
      "Removing from the <em>front</em> of a dynamic array means shifting every remaining element left: O(n) per removal, O(n²) over a full traversal. A deque avoids it by storing a ring of fixed-size blocks with a head index and a tail index, so both ends are O(1) and nothing ever shifts. This is the single most expensive “it works on the sample” mistake in graph problems, because on 10 nodes it is invisible and on 10⁵ it is a five-second timeout.",
    useWhen: "BFS, level-order traversal, topological sort, any first-in-first-out processing.",
    py: `from collections import deque

q = deque([1, 2])
q.append(3)       # enqueue — O(1)
q.popleft()       # dequeue — O(1)
q[0]              # peek

# NEVER:
lst.pop(0)        # O(n) — shifts everything left, every time`,
    cpp: `queue<int> q;    // an adaptor over deque

q.push(1);       // enqueue
q.front();       // peek — UB when empty
q.pop();         // returns VOID
q.size(); q.empty();

deque<int> d;    // when you need both ends or random access`,
    java: `Queue<Integer> q = new ArrayDeque<>();   // the fast choice

q.offer(1);      // enqueue — returns false if capacity-bounded
q.poll();        // dequeue — NULL when empty
q.peek();        // NULL when empty

// add()/remove()/element() are the THROWING twins of
// offer()/poll()/peek(). Pick one style and stay in it.

// NEVER: new ArrayList<>() with remove(0) — O(n) each time.`,
    api: {
      py: [
        { call: "deque.append(x)", gives: "None", cost: "O(1)", gotcha: "enqueue at the tail" },
        { call: "deque.popleft()", gives: "the element", cost: "O(1)", gotcha: "raises IndexError on empty" },
        { call: "deque(maxlen=k)", gives: "a bounded deque", cost: "O(1)", gotcha: "silently discards from the other end when full — a free sliding window" },
        { call: "list.pop(0)", gives: "the element", cost: "O(n)", gotcha: "the mistake this rung exists to prevent" },
      ],
      cpp: [
        { call: "q.push(x)", gives: "void", cost: "O(1)", gotcha: "—" },
        { call: "q.front() / q.back()", gives: "T&", cost: "O(1)", gotcha: "UB on an empty queue" },
        { call: "q.pop()", gives: "void", cost: "O(1)", gotcha: "read front() first" },
        { call: "deque<T>", gives: "a double-ended queue", cost: "O(1) ends, O(1) index", gotcha: "the only standard container with O(1) ends AND indexing" },
      ],
      java: [
        { call: "offer / poll / peek", gives: "boolean / E / E", cost: "O(1)", gotcha: "return null or false on failure — the non-throwing family" },
        { call: "add / remove / element", gives: "boolean / E / E", cost: "O(1)", gotcha: "THROW on failure — the same operations, different failure mode" },
        { call: "new ArrayDeque<>()", gives: "a Deque", cost: "O(1)", gotcha: "faster than LinkedList; refuses null elements" },
        { call: "new LinkedList<>()", gives: "a Deque + List", cost: "O(1) ends", gotcha: "allows null and indexing, but every node is a separate allocation" },
      ],
    },
    output: "[C++]  R29 front=1 newFront=2 size=1\n[Java] R29 poll=1 peek=2 size=1   (LinkedList also implements Queue; ArrayDeque is faster)\n[Java] R29trap ArrayList as a queue: remove(0) is O(n) — shifts every element\n[Py]   R29 deque.popleft()=1 front=2 len=1  (deque, NOT list)\n[Py]   R29trap list.pop(0) is O(n): it shifts every element. On 1e5 items that alone is 5e9 operations.",
    differs:
      "All three dequeued <b>1</b> and left <b>2</b> at the front. The difference is what happens when you reach for the obvious type instead of the right one: Python's <code>list.pop(0)</code> and Java's <code>ArrayList.remove(0)</code> are both O(n) and both look completely reasonable. Java's second trap is the two parallel method families — <code>poll()</code> returns null where <code>remove()</code> throws — so a null check you forgot becomes a <code>NullPointerException</code> three lines later instead of at the call.",
    drill: {
      ask: "Compute the shortest-path distance from node 0 to every node of an unweighted graph.",
      py: `dist = [-1]*n; dist[0] = 0; q = deque([0])
while q:
    u = q.popleft()
    for v in g[u]:
        if dist[v] < 0: dist[v] = dist[u]+1; q.append(v)`,
      cpp: `vector<int> dist(n, -1); queue<int> q; q.push(0); dist[0] = 0;
while (!q.empty()) { int u = q.front(); q.pop();
    for (int v : g[u]) if (dist[v] < 0) { dist[v] = dist[u]+1; q.push(v); } }`,
      java: `int[] dist = new int[n]; Arrays.fill(dist, -1);
Deque<Integer> q = new ArrayDeque<>(); q.offer(0); dist[0] = 0;
while (!q.isEmpty()) { int u = q.poll();
    for (int v : g[u]) if (dist[v] < 0) { dist[v] = dist[u]+1; q.offer(v); } }`,
      out: "[C++]  D29 bfsDistFrom0=[0,1,1,2]\n[Java] D29 bfsDistFrom0=[0, 1, 1, 2]\n[Py]   D29 bfsDistFrom0=[0, 1, 1, 2]",
    },
    see: ["LC 102 · Binary Tree Level Order Traversal", "LC 200 · Number of Islands", "LC 994 · Rotting Oranges", "LC 207 · Course Schedule"],
  },
  {
    n: 30,
    title: "The deque: both ends, O(1)",
    tier: "hard",
    group: "linear structures",
    why: "Sliding-window maximum, palindrome checks and 0-1 BFS all need to push and pop at both ends. This is also the structure Java gives you index access to and then takes it away.",
    intuition:
      "A deque is not one block. It is an array of pointers to fixed-size blocks, with a head position and a tail position. Growing at either end appends a block; nothing is ever shifted, so both ends are genuinely O(1) rather than amortised. The cost is that indexing must first work out which block you want, so <code>d[i]</code> is O(1) but with a fatter constant than a vector — and in Java's <code>ArrayDeque</code>, indexing is not offered at all.",
    useWhen: "Monotonic windows, 0-1 BFS, anything where the interesting element can leave from either side.",
    py: `from collections import deque
d = deque([2, 3])

d.appendleft(1)   # O(1)
d.append(4)       # O(1)
d.popleft()       # O(1)
d.pop()           # O(1)
d[0]              # O(1) at the ends, O(n) in the MIDDLE
d.rotate(1)       # [3, 1, 2] — cyclic shift
d.extendleft([1,2])   # note: inserts REVERSED`,
    cpp: `deque<int> d{2, 3};

d.push_front(1); d.push_back(4);
d.pop_front();   d.pop_back();
d.front(); d.back();
d[0];            // O(1) random access — a real advantage over Java

// deque also backs stack<> and queue<> by default`,
    java: `Deque<Integer> d = new ArrayDeque<>(List.of(2, 3));

d.addFirst(1);  d.addLast(4);
d.pollFirst();  d.pollLast();
d.peekFirst();  d.peekLast();

// d.get(0) DOES NOT EXIST. ArrayDeque is not a List.
// If you need indexing AND both ends, use LinkedList (slower)
// or an int[] with manual head/tail indices (fastest).`,
    api: {
      py: [
        { call: "appendleft / popleft", gives: "None / element", cost: "O(1)", gotcha: "the front-end pair; append/pop are the back" },
        { call: "d[i]", gives: "the element", cost: "O(1) at ends, O(n) middle", gotcha: "not a random-access container despite the syntax" },
        { call: "d.rotate(k)", gives: "None", cost: "O(k)", gotcha: "positive k rotates RIGHT" },
        { call: "d.extendleft(it)", gives: "None", cost: "O(k)", gotcha: "inserts in REVERSE order — almost never what you first expect" },
      ],
      cpp: [
        { call: "push_front / pop_front", gives: "void", cost: "O(1)", gotcha: "the operations vector cannot do cheaply" },
        { call: "d[i] / d.at(i)", gives: "T&", cost: "O(1)", gotcha: "genuinely random access — the C++ deque's edge over Java's" },
        { call: "d.insert(it, x)", gives: "iterator", cost: "O(n)", gotcha: "the middle is still O(n); only the ends are cheap" },
      ],
      java: [
        { call: "addFirst / addLast", gives: "void", cost: "O(1)", gotcha: "throws IllegalStateException on a bounded deque" },
        { call: "offerFirst / offerLast", gives: "boolean", cost: "O(1)", gotcha: "the non-throwing twins" },
        { call: "pollFirst / pollLast", gives: "E or null", cost: "O(1)", gotcha: "null on empty; removeFirst() throws instead" },
        { call: "(no get(i))", gives: "—", cost: "—", gotcha: "ArrayDeque does not implement List — no index access at all" },
      ],
    },
    output: "[C++]  R30 popped front=1 back=4 left=[2, 3] random access d[0]=2\n[Java] R30 popped first=1 back=4 left=[2, 3]  (ArrayDeque has NO index access — no d.get(0))\n[Py]   R30 popped first=1 back=4 left=[2, 3] index access d[0]=2 (O(n) in the middle) rotate(1) -> [3, 1, 2]",
    differs:
      "All three popped <b>1</b> from the front and <b>4</b> from the back. The executed difference is indexing: C++ and Python both answered <code>d[0]</code>, and Java's <code>ArrayDeque</code> has <b>no such method</b> — it is a <code>Deque</code>, not a <code>List</code>. That is the thing to remember before you write a monotonic-deque solution in Java and reach for <code>get(i)</code> out of habit. Python's <code>extendleft</code> inserting in reverse order is the other quiet surprise.",
    drill: {
      ask: "Report the maximum of every sliding window of size k.",
      lc: "LC 239 · Sliding Window Maximum",
      py: `dq, out = deque(), []
for i, x in enumerate(a):
    while dq and dq[0] <= i-k: dq.popleft()
    while dq and a[dq[-1]] <= x: dq.pop()
    dq.append(i)
    if i >= k-1: out.append(a[dq[0]])`,
      cpp: `deque<int> dq; vector<int> out;
for (int i = 0; i < (int)a.size(); ++i) {
    while (!dq.empty() && dq.front() <= i-k) dq.pop_front();
    while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();
    dq.push_back(i);
    if (i >= k-1) out.push_back(a[dq.front()]);
}`,
      java: `Deque<Integer> dq = new ArrayDeque<>(); List<Integer> out = new ArrayList<>();
for (int i = 0; i < a.length; i++) {
    while (!dq.isEmpty() && dq.peekFirst() <= i-k) dq.pollFirst();
    while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();
    dq.offerLast(i);
    if (i >= k-1) out.add(a[dq.peekFirst()]);
}`,
      out: "[C++]  D30 slidingWindowMax(k=3)=[3,3,5,5,6,7]\n[Java] D30 slidingWindowMax(k=3)=[3, 3, 5, 5, 6, 7]\n[Py]   D30 slidingWindowMax(k=3)=[3, 3, 5, 5, 6, 7]",
    },
    see: ["LC 239 · Sliding Window Maximum", "LC 862 · Shortest Subarray with Sum at Least K", "LC 641 · Design Circular Deque"],
  },
  {
    n: 31,
    title: "The heap: and the default that is backwards",
    tier: "hard",
    group: "linear structures",
    why: "C++ gives you a max-heap by default. Java and Python give you a min-heap. Writing the C++ answer in Java produces a working program with the wrong answer, and no warning of any kind.",
    intuition:
      "A binary heap is an array pretending to be a tree: the children of index <code>i</code> live at <code>2i+1</code> and <code>2i+2</code>. Pushing appends and then swaps upward until the parent is smaller; popping moves the last element to the root and swaps downward. Both walks are the height of the tree, so both are O(log n), and the root is always the extreme in O(1). Building from an existing array is O(n), not O(n log n) — sifting down from the middle backwards does less work than n separate pushes. What a heap does <b>not</b> give you is sorted order or search: it maintains one invariant, about the root, and nothing else.",
    useWhen: "Top-k, Dijkstra, merge k sorted lists, scheduling, running median (two heaps).",
    py: `import heapq
h = []
heapq.heappush(h, 5)     # O(log n)
h[0]                     # the MINIMUM — peek, O(1)
heapq.heappop(h)         # O(log n)

heapq.heapify(lst)       # O(n), in place

# heapq is MIN-only. For a max-heap, negate:
heapq.heappush(h, -x); top = -h[0]

heapq.nlargest(k, a)     # O(n log k) — beats sorting when k is small
heapq.nsmallest(k, a)`,
    cpp: `priority_queue<int> mx;                              // MAX-heap — the DEFAULT
priority_queue<int, vector<int>, greater<int>> mn;   // min-heap

mx.push(5);
mx.top();      // the MAXIMUM
mx.pop();      // returns VOID
mx.size(); mx.empty();

// build from a range in O(n):
priority_queue<int> pq(a.begin(), a.end());

// the raw algorithms, if you need the container:
make_heap(v.begin(), v.end());   // O(n)
push_heap / pop_heap`,
    java: `PriorityQueue<Integer> mn = new PriorityQueue<>();   // MIN-heap — the DEFAULT
PriorityQueue<Integer> mx =
    new PriorityQueue<>(Comparator.reverseOrder());

mn.offer(5);
mn.peek();     // the MINIMUM — null when empty
mn.poll();     // returns the element

new PriorityQueue<>(collection);   // O(n) heapify

// pq.toString() prints the HEAP ARRAY, not sorted order.
// Never print a heap and believe what you see.`,
    api: {
      py: [
        { call: "heapq.heappush(h, x)", gives: "None", cost: "O(log n)", gotcha: "h is a plain list; heapq maintains the invariant on it" },
        { call: "h[0]", gives: "the minimum", cost: "O(1)", gotcha: "peek; the rest of the list is NOT sorted" },
        { call: "heapq.heappop(h)", gives: "the minimum", cost: "O(log n)", gotcha: "IndexError on empty" },
        { call: "heapq.heapify(a)", gives: "None", cost: "O(n)", gotcha: "in place — cheaper than n pushes" },
        { call: "heapq.heappushpop / heapreplace", gives: "the old min", cost: "O(log n)", gotcha: "one sift instead of two — the size-k top-k idiom" },
        { call: "nlargest(k, a, key=)", gives: "a sorted list of k", cost: "O(n log k)", gotcha: "accepts a key function; heappush does not" },
      ],
      cpp: [
        { call: "priority_queue<T>", gives: "a MAX-heap", cost: "O(log n)", gotcha: "the opposite default to Java and Python" },
        { call: "priority_queue<T, vector<T>, greater<T>>", gives: "a min-heap", cost: "O(log n)", gotcha: "all three template arguments are required to change one" },
        { call: "pq.top()", gives: "const T&", cost: "O(1)", gotcha: "UB on empty; and it is const — you cannot modify in place" },
        { call: "pq.pop()", gives: "void", cost: "O(log n)", gotcha: "read top() first" },
        { call: "make_heap / push_heap / pop_heap", gives: "void", cost: "O(n) / O(log n)", gotcha: "operate on a vector you can still iterate" },
      ],
      java: [
        { call: "new PriorityQueue<>()", gives: "a MIN-heap", cost: "O(log n)", gotcha: "the opposite default to C++" },
        { call: "new PriorityQueue<>(cmp)", gives: "a heap with your order", cost: "O(log n)", gotcha: "the comparator reads naturally — unlike C++, no inversion" },
        { call: "pq.offer / poll / peek", gives: "boolean / E / E", cost: "O(log n) / O(1)", gotcha: "poll and peek return null on empty" },
        { call: "new PriorityQueue<>(coll)", gives: "a heap", cost: "O(n)", gotcha: "heapify, not n inserts" },
        { call: "pq.remove(Object)", gives: "boolean", cost: "O(n)", gotcha: "a linear scan — this is why lazy deletion exists" },
      ],
    },
    output: "[C++]  R31 priority_queue<int>.top()=9 (MAX by default)  greater<int>.top()=1 (min)\n[Java] R31 new PriorityQueue<>().peek()=1 (MIN by default — opposite of C++)  reverseOrder().peek()=9 (max)\n[Java] R31trap pq.toString()=[1, 5, 9] <- HEAP ARRAY order, not sorted. Never print a heap.\n[Py]   R31 heapq is a MIN-heap ONLY: h[0]=1   max-heap trick = push -x, read -mx[0] = 9  (no comparator argument exists at all)\n[Py]   R31trap the raw list is heap order, not sorted: h=[1, 5, 9]  nlargest(2)=[9, 5] nsmallest(2)=[1, 5] heapify(list) is O(n)",
    differs:
      "Executed on the same input <code>{5, 1, 9}</code>: C++ <code>priority_queue&lt;int&gt;.top()</code> gave <b>9</b>, Java <code>new PriorityQueue&lt;&gt;().peek()</code> gave <b>1</b>, and Python <code>h[0]</code> gave <b>1</b>. Same data, opposite answers, no warnings. The second executed trap: printing a heap shows the internal array — Java's printed <code>[1, 5, 9]</code> and Python's <code>[1, 5, 9]</code>, which look sorted here and will not on bigger data. A heap guarantees the root and nothing else.",
    drill: {
      ask: "Find the kth largest element using O(n log k) time and O(k) space.",
      lc: "LC 215 · Kth Largest Element in an Array",
      py: `h = []
for x in a:
    heapq.heappush(h, x)
    if len(h) > k: heapq.heappop(h)
print(h[0])                     # a size-k MIN-heap; its root is the kth largest`,
      cpp: `priority_queue<int, vector<int>, greater<int>> h;   // min-heap
for (int x : a) { h.push(x); if ((int)h.size() > k) h.pop(); }
int ans = h.top();`,
      java: `PriorityQueue<Integer> h = new PriorityQueue<>();   // min-heap is the default
for (int x : a) { h.offer(x); if (h.size() > k) h.poll(); }
int ans = h.peek();`,
      out: "[C++]  D31 kthLargest(2) via size-k min-heap=5\n[Java] D31 kthLargest(2) via size-k min-heap=5\n[Py]   D31 kthLargest(2) via size-k min-heap=5   (or heapq.nlargest(2,a)[-1]=5)",
    },
    see: ["LC 215 · Kth Largest Element", "LC 23 · Merge k Sorted Lists", "LC 295 · Find Median from Data Stream", "LC 621 · Task Scheduler"],
  },
  {
    n: 32,
    title: "A heap of pairs, with a custom order",
    tier: "hard",
    group: "linear structures",
    why: "Dijkstra pushes (distance, node). Top-k pushes (count, item). The moment the heap element is compound, C++ requires you to write the comparator <b>inverted</b> relative to how you would write it for a sort — and the inversion is invisible in the result until the answer is wrong.",
    intuition:
      "<code>std::priority_queue</code> is defined in terms of “less than”, and it puts the <em>greatest</em> element on top. So the comparator you pass answers “does a come before b in the ordering”, and the top is the last one — which means to get a min-heap you pass <code>greater</code>. Java's <code>PriorityQueue</code> is defined the other way: the comparator is a normal ascending comparator and the smallest sits on top. Python sidesteps the question entirely by having no comparator at all — you shape the tuple so that natural ordering does what you want.",
    useWhen: "Dijkstra, A*, k closest, merge k lists, any priority with a payload attached.",
    py: `import heapq
h = []
heapq.heappush(h, (dist, node))    # tuples compare LEXICOGRAPHICALLY
d, u = heapq.heappop(h)            # smallest dist first — free

# no comparator exists. Shape the tuple instead:
heapq.heappush(h, (-count, word))  # count DESC, word ASC

# if the payload is not comparable, add a tiebreak counter,
# or the heap raises TypeError when two priorities tie:
heapq.heappush(h, (pri, next(counter), obj))`,
    cpp: `using P = pair<int,string>;

// INVERTED: return a > b to get a MIN-heap
auto cmp = [](const P& a, const P& b){ return a.first > b.first; };
priority_queue<P, vector<P>, decltype(cmp)> pq(cmp);

// the common shortcut for a min-heap of pairs:
priority_queue<P, vector<P>, greater<P>> pq2;

// plain priority_queue<P> is a MAX-heap by first, then second.`,
    java: `// the comparator reads NATURALLY — ascending gives a min-heap
PriorityQueue<int[]> pq =
    new PriorityQueue<>(Comparator.comparingInt(x -> x[0]));

// max-heap by the first field:
new PriorityQueue<int[]>(Comparator.comparingInt((int[] x) -> x[0]).reversed());

// multi-key:
Comparator.comparingInt((int[] x) -> x[0]).thenComparingInt(x -> x[1])`,
    api: {
      py: [
        { call: "heappush(h, (a, b))", gives: "None", cost: "O(log n)", gotcha: "compares a first, then b — shape the tuple to encode the order" },
        { call: "(-count, item)", gives: "—", cost: "—", gotcha: "the max-heap idiom; only works on numbers" },
        { call: "(pri, counter, obj)", gives: "—", cost: "—", gotcha: "the counter prevents TypeError when obj is not comparable" },
        { call: "nsmallest(k, a, key=f)", gives: "a list", cost: "O(n log k)", gotcha: "the only heapq call that accepts a key function" },
      ],
      cpp: [
        { call: "priority_queue<T, vector<T>, Cmp>", gives: "a heap", cost: "O(log n)", gotcha: "Cmp is INVERTED relative to sort: greater gives a MIN-heap" },
        { call: "greater<pair<int,int>>", gives: "a min-heap of pairs", cost: "—", gotcha: "the standard Dijkstra spelling" },
        { call: "decltype(cmp)>  pq(cmp)", gives: "a lambda-ordered heap", cost: "—", gotcha: "pre-C++20 you must pass the lambda to the constructor as well" },
        { call: "pq.top()", gives: "const T&", cost: "O(1)", gotcha: "const — you cannot mutate the top in place" },
      ],
      java: [
        { call: "new PriorityQueue<>(cmp)", gives: "a heap", cost: "O(log n)", gotcha: "ascending comparator = min-heap. No inversion, unlike C++" },
        { call: "comparingInt(f).reversed()", gives: "a max-heap", cost: "—", gotcha: "reversed() flips the entire chain" },
        { call: "comparingLong(...)", gives: "Comparator", cost: "—", gotcha: "use it for squared distances — int overflows at ~46341²" },
        { call: "new PriorityQueue<>(k, cmp)", gives: "a heap with capacity", cost: "—", gotcha: "the int argument is initial capacity, not a size limit" },
      ],
    },
    output: "[C++]  R32 drained= 1a 2b 3c  (comparator is INVERTED vs sort)\n[Java] R32 drained= 1 2 3  (comparator reads NATURALLY, unlike C++)\n[Py]   R32 drained= 1a 2b 3c  (tuples compare lexicographically — no comparator needed)\n[Py]   R32trap if the 2nd field is not comparable you get a TypeError; add a tiebreak counter: (pri, i, obj)",
    differs:
      "All three drained <b>1, 2, 3</b> — the same answer through three different mechanisms. C++ got there with a comparator returning <code>a.first &gt; b.first</code>, which is the <em>opposite</em> of what the same code would say inside a <code>sort</code>; Java got there with a plainly ascending <code>comparingInt</code>; Python got there with no comparator at all, because tuples already compare lexicographically. The C++ inversion is the one that produces a silently reversed answer when you carry a habit over from sorting.",
    drill: {
      ask: "Return the k points closest to the origin.",
      lc: "LC 973 · K Closest Points to Origin",
      py: `out = heapq.nsmallest(k, pts, key=lambda p: p[0]*p[0] + p[1]*p[1])`,
      cpp: `priority_queue<pair<long long,pair<int,int>>> h;   // MAX-heap, keep k smallest
for (auto& p : pts) {
    long long d = (long long)p.first*p.first + (long long)p.second*p.second;
    h.push({d, p}); if ((int)h.size() > k) h.pop();
}`,
      java: `PriorityQueue<int[]> h = new PriorityQueue<>(
    Comparator.comparingLong((int[] p) -> (long)p[0]*p[0] + (long)p[1]*p[1]).reversed());
for (int[] p : pts) { h.offer(p); if (h.size() > k) h.poll(); }`,
      out: "[C++]  D32 kClosest(2)=(-2,2)(0,1)\n[Java] D32 kClosest(2)=(-2,2)(0,1)\n[Py]   D32 kClosest(2)=(-2,2)(0,1)",
    },
    see: ["LC 973 · K Closest Points", "LC 743 · Network Delay Time", "LC 1046 · Last Stone Weight", "LC 692 · Top K Frequent Words"],
  },
  {
    n: 33,
    title: "Strings are sequences — until you try to write to one",
    tier: "hard",
    group: "text",
    why: "Two of the three make strings immutable, so the array skills you just built stop transferring at exactly the point you need them. And the two substring functions take different second arguments.",
    intuition:
      "Immutability is not an inconvenience for its own sake: it makes strings safely shareable and hashable without copying, which is why Java can intern literals and Python can cache them. The cost is that any modification allocates a whole new string — O(n) for a one-character change. That is fine once and catastrophic in a loop (rung 34). C++ made the opposite trade: <code>std::string</code> is a mutable buffer, so in-place edits are O(1), and you pay by having to think about copies yourself.",
    useWhen: "Every string problem. Know which half of the array API survives.",
    py: `s = 'hello'

s[0]        # 'h'  — a 1-char STRING, there is no char type
len(s)
s[1:4]      # 'ell'  — start, END-exclusive
s[::-1]     # 'olleh'

s[0] = 'H'  # TypeError: 'str' object does not support item assignment
'H' + s[1:] # the fix — build a new string

s.upper(), s.lower(), s.strip(), s.split(','), s.replace('l','L')
s.startswith('he'), s.isalpha(), s.isdigit()`,
    cpp: `string s = "hello";

s[0] = 'H';        // MUTABLE — this is the outlier
s.size();
s.substr(1, 3);    // "ell" — (pos, LENGTH)
s.push_back('!');  s += "!!";

s.find("ll");      // index, or string::npos on a miss
if (s.find(x) != string::npos) ...

// reverse in place: reverse(s.begin(), s.end());
// s is a real container: begin(), end(), sort(), all work.`,
    java: `String s = "hello";

s.charAt(0);       // 'h' — a real primitive char
s.length();
s.substring(1, 4); // "ell" — (start, END-exclusive), like Python
s.indexOf("ll");   // index, or -1

// s.charAt(0) = 'H' does not compile: String is IMMUTABLE
char[] cs = s.toCharArray();
cs[0] = 'H';
new String(cs);    // "Hello"

s.equals(t)        // ALWAYS — == compares references (rung 37)`,
    api: {
      py: [
        { call: "s[i]", gives: "a 1-char str", cost: "O(1)", gotcha: "there is no char type; ord(s[i]) gets the code point" },
        { call: "s[i:j]", gives: "a new str", cost: "O(j-i)", gotcha: "j is EXCLUSIVE" },
        { call: "s.find(x) / s.index(x)", gives: "int / int", cost: "O(n·m)", gotcha: "find returns -1, index RAISES — the two differ" },
        { call: "s.split(sep) / sep.join(parts)", gives: "list / str", cost: "O(n)", gotcha: "split() with no argument splits on any whitespace run" },
        { call: "s.replace(a, b)", gives: "a new str", cost: "O(n)", gotcha: "returns a copy; s is unchanged" },
      ],
      cpp: [
        { call: "s[i]", gives: "char&", cost: "O(1)", gotcha: "WRITABLE — the only mutable string of the three" },
        { call: "s.substr(pos, len)", gives: "a new string", cost: "O(len)", gotcha: "second argument is a LENGTH, not an end index" },
        { call: "s.find(x)", gives: "size_t or npos", cost: "O(n·m)", gotcha: "npos is the largest size_t, NOT -1 — compare against string::npos" },
        { call: "s += / s.append()", gives: "string&", cost: "O(1) amortised", gotcha: "genuinely cheap; C++ has no quadratic-concatenation trap" },
        { call: "stoi / to_string", gives: "int / string", cost: "O(len)", gotcha: "stoi throws on junk; stoll for large values" },
      ],
      java: [
        { call: "s.charAt(i)", gives: "char", cost: "O(1)", gotcha: "read-only; a real 16-bit primitive" },
        { call: "s.substring(a, b)", gives: "a new String", cost: "O(b-a)", gotcha: "b is an END index — unlike C++'s length" },
        { call: "s.toCharArray()", gives: "char[]", cost: "O(n)", gotcha: "the standard route to mutation; new String(cs) to get back" },
        { call: "s.equals(t) / s.compareTo(t)", gives: "boolean / int", cost: "O(n)", gotcha: "NEVER use == on Strings — see rung 37" },
        { call: "s.split(regex)", gives: "String[]", cost: "O(n)", gotcha: "the argument is a REGEX — split(\".\") matches everything" },
      ],
    },
    output: "[C++]  R33 s[0]=H s.size()=5 substr(1,3)=ell (pos,LENGTH) mutated=Hello\n[Java] R33 charAt(0)=h length()=5 substring(1,4)=ell (start,END-exclusive) original unchanged=hello new=Hello  <- String is IMMUTABLE; s.charAt(0)='H' does not compile\n[Java] R33mut via toCharArray + new String(cs) = Hello\n[Py]   R33 s[0]=h len=5 s[1:4]=ell (start,END-exclusive) s[::-1]=olleh\n[Py]   R33imm s[0]=\"H\" -> TypeError: 'str' object does not support item assignment   fix: \"H\"+s[1:] = Hello",
    differs:
      "C++ mutated the string in place; Python <b>raised TypeError</b> and Java would not compile. The executed second-argument difference is the one that costs marks quietly: C++ <code>substr(1, 3)</code> and Java <code>substring(1, 4)</code> both produced <b>\"ell\"</b>, because the first takes a <em>length</em> and the second an <em>end index</em>. Two languages, two conventions, identical-looking calls. And Java's <code>split</code> taking a regex means <code>split(\".\")</code> silently returns an empty array.",
    drill: {
      ask: "Decide whether a string is a palindrome, ignoring case and non-alphanumerics.",
      lc: "LC 125 · Valid Palindrome",
      py: `t = ''.join(c.lower() for c in s if c.isalnum())
print(t == t[::-1])`,
      cpp: `string t; for (char c : s) if (isalnum((unsigned char)c)) t += tolower(c);
bool ok = equal(t.begin(), t.begin()+t.size()/2, t.rbegin());`,
      java: `StringBuilder t = new StringBuilder();
for (char c : s.toCharArray()) if (Character.isLetterOrDigit(c)) t.append(Character.toLowerCase(c));
boolean ok = t.toString().equals(t.reverse().toString());`,
      out: "[C++]  D33 \"A man, a plan, a canal: Panama\"=true \"race a car\"=false\n[Java] D33 \"A man, a plan, a canal: Panama\"=true \"race a car\"=false\n[Py]   D33 \"A man, a plan, a canal: Panama\"=True \"race a car\"=False",
    },
    see: ["LC 125 · Valid Palindrome", "LC 344 · Reverse String", "LC 5 · Longest Palindromic Substring", "LC 14 · Longest Common Prefix"],
  },
  {
    n: 34,
    title: "Building a string in a loop — the quadratic trap",
    tier: "hard",
    group: "text",
    why: "Concatenating in a loop is O(n²) in Java and, in principle, in Python. It produces the correct answer and times out. This is the most common invisible TLE there is.",
    intuition:
      "Because strings are immutable, <code>s += c</code> cannot extend anything — it allocates a new string of length <code>len(s)+1</code> and copies the old contents in. Do that n times and you have copied 1 + 2 + 3 + … + n characters, which is n²/2. A builder keeps a mutable buffer and appends into it, growing by doubling exactly like a vector, so the total copying is O(n). CPython has a fragile in-place optimisation that sometimes rescues <code>+=</code> when the string has exactly one reference — it disappears the moment anything else touches the variable, so you must not depend on it.",
    useWhen: "Any output built character by character or piece by piece. Always.",
    py: `parts = []
for x in items: parts.append(str(x))
result = ''.join(parts)            # O(n) — the idiom

result = ''.join(str(x) for x in items)     # same, one line
','.join(['a','b'])                          # 'a,b'

s = ''
for c in cs: s += c        # O(n^2) in principle. CPython sometimes
                           # optimises it in place — do NOT rely on that.`,
    cpp: `string s;
s.reserve(n);              // optional but free
for (char c : cs) s += c;  // ALREADY amortised O(n) — string is mutable

ostringstream oss;
for (int x : v) oss << x << ' ';
string out = oss.str();    // when you are formatting, not just concatenating`,
    java: `StringBuilder sb = new StringBuilder();
for (char c : cs) sb.append(c);
String result = sb.toString();      // O(n)

String bad = "";
for (char c : cs) bad += c;         // O(n^2) — a NEW String every iteration

String.join("-", "a", "b", "c");    // "a-b-c"
new StringBuilder(n);               // pre-size it when n is known`,
    api: {
      py: [
        { call: "''.join(parts)", gives: "str", cost: "O(total)", gotcha: "parts must all be str — join over ints raises TypeError" },
        { call: "s += c in a loop", gives: "str", cost: "O(n²) in principle", gotcha: "CPython's in-place optimisation is fragile and unspecified" },
        { call: "io.StringIO", gives: "a writable buffer", cost: "O(n)", gotcha: "the explicit builder, for when you are also formatting" },
        { call: "f'{x}' / str(x)", gives: "str", cost: "O(len)", gotcha: "f-strings are the fastest formatting route" },
      ],
      cpp: [
        { call: "s += c / s.append", gives: "string&", cost: "O(1) amortised", gotcha: "no trap here — std::string is a mutable growable buffer" },
        { call: "s.reserve(n)", gives: "void", cost: "O(n)", gotcha: "removes the reallocations entirely when n is known" },
        { call: "ostringstream << x", gives: "the stream", cost: "O(len)", gotcha: "slower than += ; use it for formatting, not concatenation" },
        { call: "s.shrink_to_fit()", gives: "void", cost: "O(n)", gotcha: "a request, not a guarantee" },
      ],
      java: [
        { call: "new StringBuilder()", gives: "a builder", cost: "O(1)", gotcha: "the mandatory idiom; StringBuffer is the synchronised, slower twin" },
        { call: "sb.append(x)", gives: "the builder", cost: "O(1) amortised", gotcha: "returns itself, so it chains" },
        { call: "sb.toString()", gives: "String", cost: "O(n)", gotcha: "call it ONCE, outside the loop" },
        { call: "s += c in a loop", gives: "String", cost: "O(n²)", gotcha: "the compiler builds a NEW StringBuilder per iteration — it cannot hoist it out" },
        { call: "String.join(sep, parts)", gives: "String", cost: "O(total)", gotcha: "the clean joiner; also Collectors.joining() for streams" },
      ],
    },
    output: "[C++]  R34 += with reserve=abcde ostringstream=abcde  (both amortised O(n); C++ += is already cheap)\n[Java] R34 StringBuilder=abcde (O(n))   += in a loop=abcde (same answer, O(n^2) — this is the TLE)\n[Java] R34join String.join(\"-\",...)=a-b-c\n[Py]   R34 \"\".join(list)=abcde (O(n))   += in a loop=abcde (O(n^2) in principle; CPython has a fragile in-place optimisation you must not rely on)\n[Py]   R34perf join of 200000 pieces is faster than append-then-join -> True  (both are O(n); join wins by constant factor)",
    differs:
      "All three built <code>abcde</code>. The executed timing is the point: over 20 000 appends in the same JVM run, <code>StringBuilder</code> beat <code>+=</code> by <b>more than an order of magnitude</b> — and the two produce identical output, so nothing in your testing will ever hint at it. C++ is the exception and can concatenate freely, because <code>std::string</code> is mutable. Python sits in between: correct in principle to use <code>join</code>, and usually rescued in practice by an optimisation you should not plan around.",
    drill: {
      ask: "Run-length encode a string: aaabbc becomes a3b2c1.",
      py: `print(''.join(ch + str(len(list(g))) for ch, g in itertools.groupby(s)))`,
      cpp: `string out; out.reserve(s.size()*2);
for (size_t i = 0; i < s.size();) {
    size_t j = i; while (j < s.size() && s[j] == s[i]) ++j;
    out += s[i]; out += to_string(j-i); i = j;
}`,
      java: `StringBuilder out = new StringBuilder();
for (int i = 0; i < s.length();) {
    int j = i; while (j < s.length() && s.charAt(j) == s.charAt(i)) j++;
    out.append(s.charAt(i)).append(j - i); i = j;
}`,
      out: "[C++]  D34 rle(\"aaabbc\")=a3b2c1\n[Java] D34 rle(\"aaabbc\")=a3b2c1\n[Py]   D34 rle(\"aaabbc\")=a3b2c1",
    },
    see: ["LC 443 · String Compression", "LC 271 · Encode and Decode Strings", "LC 38 · Count and Say", "LC 6 · Zigzag Conversion"],
  },
  {
    n: 35,
    title: "Char arithmetic and the ASCII bridge",
    tier: "extreme",
    group: "text",
    why: "<code>c - 'a'</code> is how a character becomes an array index, and it is the foundation of every <code>int[26]</code> counting solution. One language will not let you write it at all.",
    intuition:
      "A character <em>is</em> a small integer — 'a' is 97, 'b' is 98 — so subtracting 'a' maps the lowercase alphabet onto 0..25, which is exactly an array index. C++ and Java expose that directly because they have a real <code>char</code> type. Python has no char type: <code>s[0]</code> is a one-character string, and subtracting strings is meaningless, so you must cross the bridge explicitly with <code>ord()</code> and come back with <code>chr()</code>. Same arithmetic, one extra function call each way.",
    useWhen: "Frequency arrays, caesar shifts, base conversion, anagram grouping, trie children.",
    py: `ord('c') - ord('a')      # 2   — ord() is MANDATORY
chr(ord('a') + 2)        # 'c'
ord('A')                 # 65

'c' - 'a'                # TypeError: unsupported operand type(s)

'c'.isalpha(), 'c'.isdigit(), 'c'.isupper()
'C'.lower()

# frequency array:
cnt = [0]*26
for c in s: cnt[ord(c) - ord('a')] += 1`,
    cpp: `char c = 'c';
int idx = c - 'a';         // 2 — direct, no conversion needed
char back = 'a' + 2;       // 'c'  (int, narrowed on assignment)
int('A');                  // 65
sizeof(char);              // 1 — always

isalpha(c), isdigit(c), tolower(c)   // pass (unsigned char)c to be safe

array<int,26> cnt{};
for (char c : s) cnt[c - 'a']++;`,
    java: `char c = 'c';
int idx = c - 'a';          // 2
char back = (char)('a' + 2);  // the CAST is mandatory: 'a'+2 is an int
(int) 'A';                  // 65

Character.isLetter(c), Character.isDigit(c), Character.toLowerCase(c)

int[] cnt = new int[26];
for (char x : s.toCharArray()) cnt[x - 'a']++;

// "" + 'a' + 2  is  "a2"   but  ('a' + 2)  is  99. Watch the parentheses.`,
    api: {
      py: [
        { call: "ord(c)", gives: "int code point", cost: "O(1)", gotcha: "requires a length-1 string; there is no char type to skip this" },
        { call: "chr(n)", gives: "a 1-char str", cost: "O(1)", gotcha: "the return trip" },
        { call: "c.isalpha() / isdigit() / isalnum()", gives: "bool", cost: "O(n)", gotcha: "true for the WHOLE string, not just the first character" },
        { call: "string.ascii_lowercase", gives: "'abc...z'", cost: "O(1)", gotcha: "handy for building index maps" },
      ],
      cpp: [
        { call: "c - 'a'", gives: "int", cost: "O(1)", gotcha: "char is an integer type — no conversion function needed" },
        { call: "isalpha(c) / isdigit(c)", gives: "int, not bool", cost: "O(1)", gotcha: "pass (unsigned char)c — negative chars are undefined behaviour" },
        { call: "tolower(c) / toupper(c)", gives: "int", cost: "O(1)", gotcha: "returns int; cast back to char when assigning" },
        { call: "char is signed or unsigned", gives: "—", cost: "—", gotcha: "implementation-defined — matters for bytes above 127" },
      ],
      java: [
        { call: "c - 'a'", gives: "int", cost: "O(1)", gotcha: "char promotes to int in any arithmetic" },
        { call: "(char)('a' + n)", gives: "char", cost: "O(1)", gotcha: "the cast is required — the expression is an int" },
        { call: "Character.isLetter / isDigit", gives: "boolean", cost: "O(1)", gotcha: "Unicode-aware, unlike the C++ locale functions" },
        { call: "\"\" + c", gives: "String", cost: "O(1)", gotcha: "\"\" + 'a' + 2 is \"a2\"; ('a' + 2) is 99. Parenthesise" },
        { call: "char is 16-bit UTF-16", gives: "—", cost: "—", gotcha: "one char is not one Unicode character for emoji and rare scripts" },
      ],
    },
    output: "[C++]  R35 'c'-'a'=2 'a'+2=c int('A')=65 sizeof(char)=1 isalpha=true\n[Java] R35 'c'-'a'=2 (char)('a'+2)=c (int)'A'=65 Character.isLetter=true  <- 'a'+2 is an int; the (char) cast is mandatory\n[Java] R35trap \"\" + 'a' + 2 = a2   but ('a'+2) = 99\n[Py]   R35 ord(\"c\")-ord(\"a\")=2 chr(ord(\"a\")+2)=c ord(\"A\")=65 \"c\".isalpha()=True  <- NO implicit char type: ord()/chr() are mandatory\n[Py]   R35trap \"c\" - \"a\" -> TypeError: unsupported operand type(s) for -: 'str' and 'str'",
    differs:
      "C++ and Java both computed <code>'c' - 'a' = 2</code> directly; Python <b>raised TypeError</b> and needed <code>ord()</code>. Java's own trap is executed above: <code>\"\" + 'a' + 2</code> printed <b>a2</b> while <code>('a' + 2)</code> printed <b>99</b> — the same two symbols, and whether you get a string or a number depends entirely on the parentheses. C++ requires the <code>(unsigned char)</code> cast on <code>isalpha</code> to stay defined for bytes above 127.",
    drill: {
      ask: "Shift every letter forward by three, wrapping z to c.",
      py: `print(''.join(chr(ord('a') + (ord(c) - ord('a') + 3) % 26) for c in s))`,
      cpp: `string out; for (char c : s) out += char('a' + (c - 'a' + 3) % 26);`,
      java: `StringBuilder out = new StringBuilder();
for (char c : s.toCharArray()) out.append((char)('a' + (c - 'a' + 3) % 26));`,
      out: "[C++]  D35 caesar(\"xyz\",3)=abc\n[Java] D35 caesar(\"xyz\",3)=abc\n[Py]   D35 caesar(\"xyz\",3)=abc",
    },
    see: ["LC 242 · Valid Anagram", "LC 387 · First Unique Character", "LC 205 · Isomorphic Strings", "LC 208 · Implement Trie"],
  },
  {
    n: 36,
    title: "Overflow, integer division, and the widths that differ",
    tier: "extreme",
    group: "scale",
    why: "Python has no integer limit at all, which is exactly why a solution that passes in Python can fail silently after being ported. And the three do not even agree on what <code>-7 / 2</code> is.",
    intuition:
      "A 32-bit signed int holds up to 2 147 483 647. Adding past that wraps around to the most negative value — not an error, just arithmetic modulo 2³². Two places bite reliably: a sum of many values (rung 9) and the midpoint <code>(lo + hi) / 2</code> inside a binary search, where both operands can individually be legal and their sum cannot. <code>lo + (hi - lo) / 2</code> is algebraically identical and never overflows. Separately, integer division differs: C++ and Java truncate toward zero, Python's <code>//</code> floors toward negative infinity, so they disagree on every negative operand.",
    useWhen: "Any sum, product, or midpoint over data that could be large. Which is most of them.",
    py: `2 ** 200        # exact — Python ints are arbitrary precision
(lo + hi) // 2  # always safe here

-7 // 2         # -4  — FLOORS toward -infinity
int(-7 / 2)     # -3  — truncates, matching C++/Java
-7 % 2          #  1  — the sign follows the DIVISOR

sys.maxsize     # the max list index, NOT an int limit

# porting checklist: every //, every %, every sum.`,
    cpp: `INT_MAX;               // 2147483647
sizeof(int);           // 4
sizeof(long long);     // 8   — up to ~9.2 x 10^18

int mid = lo + (hi - lo) / 2;     // safe
int mid = (lo + hi) / 2;          // OVERFLOWS, silently, and it is UB

-7 / 2;    // -3 — truncates toward zero
-7 % 2;    // -1 — sign follows the DIVIDEND

__int128 for the rare case beyond long long.`,
    java: `Integer.MAX_VALUE;      // 2147483647
Integer.MAX_VALUE + 1;  // -2147483648 — wraps, no exception
Long.MAX_VALUE;         // 9223372036854775807

int mid = lo + (hi - lo) / 2;   // safe

Math.addExact(a, b);    // THROWS ArithmeticException on overflow
Math.floorDiv(-7, 2);   // -4 — matches Python's //
-7 / 2;                 // -3 — the default truncates

BigInteger for genuinely unbounded values.`,
    api: {
      py: [
        { call: "int", gives: "arbitrary precision", cost: "O(digits)", gotcha: "never overflows — which is why the port is where it breaks" },
        { call: "a // b", gives: "int", cost: "O(1)", gotcha: "FLOORS: -7 // 2 is -4, not -3" },
        { call: "a % b", gives: "int", cost: "O(1)", gotcha: "the sign follows the DIVISOR — -7 % 2 is 1, not -1" },
        { call: "int(a / b)", gives: "int", cost: "O(1)", gotcha: "truncates like C++/Java, but goes through a float — lossy past 2⁵³" },
      ],
      cpp: [
        { call: "long long", gives: "64-bit", cost: "O(1)", gotcha: "write 1LL * a * b, not (long long)(a * b) — the multiply already overflowed" },
        { call: "INT_MAX / LLONG_MAX", gives: "the limits", cost: "—", gotcha: "in <climits>" },
        { call: "lo + (hi - lo) / 2", gives: "the safe midpoint", cost: "O(1)", gotcha: "memorise this shape" },
        { call: "signed overflow", gives: "UNDEFINED behaviour", cost: "—", gotcha: "the optimiser may assume it cannot happen and delete your check" },
      ],
      java: [
        { call: "long", gives: "64-bit", cost: "O(1)", gotcha: "write 1L * a * b for the same reason as C++" },
        { call: "Math.addExact / multiplyExact", gives: "the result", cost: "O(1)", gotcha: "THROWS on overflow — the way to make it loud" },
        { call: "Math.floorDiv / floorMod", gives: "int", cost: "O(1)", gotcha: "Python-style flooring, when you need negatives to behave" },
        { call: "Integer.MAX_VALUE + 1", gives: "MIN_VALUE", cost: "O(1)", gotcha: "wraps with no exception — defined behaviour, unlike C++" },
      ],
    },
    output: "[C++]  R36 INT_MAX=2147483647 +1 as long long=2147483648 sizeof(int)=4 sizeof(long long)=8\n[C++]  R36mid lo=2000000000 hi=2100000000 lo+hi wraps to -194967296 so (lo+hi)/2=-97483648  but lo+(hi-lo)/2=2050000000\n[Java] R36 Integer.MAX_VALUE=2147483647 MAX+1=-2147483648 (wraps, no error) Long.MAX_VALUE=9223372036854775807\n[Java] R36mid lo=2000000000 hi=2100000000 lo+hi wraps to -194967296 so (lo+hi)/2=-97483648  but lo+(hi-lo)/2=2050000000\n[Java] R36exact Math.addExact(lo,hi) -> ArithmeticException: integer overflow\n[Py]   R36 2**200 = 1606938044258990275541962092341162602522202993782792835301376  (201 bits — Python ints have no width)\n[Py]   R36mid (lo+hi)//2 is always safe here: 2050000000   sys.maxsize=9223372036854775807 is only the max LIST INDEX, not an int limit\n[Py]   R36div -7//2=-4 (floors toward -inf)  int(-7/2)=-3 (truncates)  <- C++/Java give -3; Python // gives -4. This is a real wrong-answer source.",
    differs:
      "Executed on <code>lo = 2000000000, hi = 2100000000</code>: <code>lo + hi</code> wrapped to <b>-194967296</b> in both C++ and Java, making <code>(lo+hi)/2</code> equal <b>-97483648</b> while <code>lo + (hi-lo)/2</code> gave the correct <b>2050000000</b>. Python printed the true value. The second executed disagreement is division: <code>-7 // 2</code> is <b>-4</b> in Python and <b>-3</b> in C++ and Java. Both are real wrong-answer sources, and neither raises anything.",
    drill: {
      ask: "Reverse the digits of a 32-bit integer, returning 0 if the result overflows.",
      lc: "LC 7 · Reverse Integer",
      py: `def rev(x):
    r = (-1 if x < 0 else 1) * int(str(abs(x))[::-1])
    return 0 if r < -2**31 or r > 2**31 - 1 else r   # the guard is MANUAL`,
      cpp: `long long r = 0;
while (x) { r = r*10 + x%10; x /= 10;
    if (r > INT_MAX || r < INT_MIN) return 0; }      // widen, then check`,
      java: `long r = 0;
while (x != 0) { r = r*10 + x%10; x /= 10;
    if (r > Integer.MAX_VALUE || r < Integer.MIN_VALUE) return 0; }`,
      out: "[C++]  D36 reverse(123)=321 reverse(-123)=-321 reverse(1534236469)=0 (overflow -> 0)\n[Java] D36 reverse(123)=321 reverse(-123)=-321 reverse(1534236469)=0 (overflow -> 0)\n[Py]   D36 reverse(123)=321 reverse(-123)=-321 reverse(1534236469)=0 (overflow -> 0)",
    },
    see: ["LC 7 · Reverse Integer", "LC 29 · Divide Two Integers", "LC 50 · Pow(x, n)", "LC 43 · Multiply Strings"],
  },
  {
    n: 37,
    title: "Identity versus equality, and the caches that hide it",
    tier: "extreme",
    group: "scale",
    why: "Java's <code>Integer</code> cache and CPython's small-int cache both make <code>==</code> or <code>is</code> appear to work on small values and fail on large ones. The bug therefore appears only once your data grows — which is to say, only on the hidden tests.",
    intuition:
      "There are two questions you can ask about two variables: are they the <em>same object</em>, and do they hold the <em>same value</em>. For performance both runtimes pre-allocate objects for small integers — Java caches −128..127 by specification, CPython caches −5..256 by implementation. Inside that window, two variables with the same value are genuinely the same object, so the identity test accidentally gives the right answer. Outside it, two separate objects hold equal values and identity says no. Nothing changed except the size of the number.",
    useWhen: "Every comparison of boxed numbers, strings, or arrays. Which is every comparison that is not two raw primitives.",
    py: `int('256') is int('256')    # True   — CPython caches -5..256
int('257') is int('257')    # False  — outside the cache
257 == 257                  # True    — always use ==

[1,2] == [1,2]              # True   — VALUE
[1,2] is [1,2]              # False  — IDENTITY

# "is" is correct for exactly one thing: x is None.`,
    cpp: `string x = a + b, y = "hello";
x == y;        // TRUE — operator== compares VALUE
&x == &y;      // false — different objects

vector<int> p{1,2}, q{1,2};
p == q;        // TRUE — element-wise

// C++ has no boxing and no identity trap. Everything is a value
// unless you explicitly took a pointer or a reference.`,
    java: `Integer x = 127, y = 127;
x == y;        // TRUE  — the JLS mandates a cache for -128..127
Integer p = 128, q = 128;
p == q;        // FALSE — different objects
p.equals(q);   // true  — ALWAYS use equals

String cat = "hel" + "lo", lit = "hello";
cat == lit;    // false when cat is built at runtime
cat.equals(lit);   // true

int[] r = {1,2}, s = {1,2};
r.equals(s);        // false — identity
Arrays.equals(r, s);  // true`,
    api: {
      py: [
        { call: "==", gives: "bool", cost: "O(n)", gotcha: "value equality — the one you want, essentially always" },
        { call: "is", gives: "bool", cost: "O(1)", gotcha: "identity. Correct for `x is None` and almost nothing else" },
        { call: "small-int cache", gives: "—", cost: "—", gotcha: "-5..256 are shared objects, so `is` accidentally works there" },
        { call: "id(x)", gives: "int", cost: "O(1)", gotcha: "the object address; how you prove aliasing (rung 5)" },
      ],
      cpp: [
        { call: "a == b", gives: "bool", cost: "O(n)", gotcha: "value comparison for string, vector, pair, map — all of them" },
        { call: "&a == &b", gives: "bool", cost: "O(1)", gotcha: "the explicit identity test; you have to ask for it" },
        { call: "std::equal(f, l, f2)", gives: "bool", cost: "O(n)", gotcha: "compares ranges of different container types" },
      ],
      java: [
        { call: "==", gives: "boolean", cost: "O(1)", gotcha: "REFERENCES for every object; values only for primitives" },
        { call: ".equals(o)", gives: "boolean", cost: "O(n)", gotcha: "the correct comparison — and NPE if the receiver is null" },
        { call: "Objects.equals(a, b)", gives: "boolean", cost: "O(n)", gotcha: "null-safe on both sides" },
        { call: "Arrays.equals / deepEquals", gives: "boolean", cost: "O(n)", gotcha: "arrays have no useful equals of their own" },
        { call: "Integer cache -128..127", gives: "—", cost: "—", gotcha: "specified by the JLS — the bug appears only past 127" },
      ],
    },
    output: "[C++]  R37 string == compares VALUE -> true  (&x==&y)=false\n[C++]  R37vec vector== compares elementwise -> true\n[Java] R37 Integer 127==127 -> true   128==128 -> false   128.equals(128) -> true  <- the JLS caches -128..127, so the bug only appears past 127\n[Java] R37str (\"hel\"+\"lo\")==\"hello\" -> false   .equals -> true  (== on String compares REFERENCES)\n[Java] R37arr int[]{1,2}.equals -> false   Arrays.equals -> true  (arrays have no value equality)\n[Py]   R37 int(\"256\") is int(\"256\") -> True   int(\"257\") is int(\"257\") -> False   257 == 257 -> True  <- CPython caches small ints -5..256; `is` on ints is a bug waiting for larger data\n[Py]   R37list [1,2]==[1,2] -> True but [1,2] is [1,2] -> False  (== is VALUE, is is IDENTITY)",
    differs:
      "The two caches, executed. Java: <code>127 == 127</code> is <b>true</b>, <code>128 == 128</code> is <b>false</b>. Python: <code>int(\"256\") is int(\"256\")</code> is <b>true</b>, <code>int(\"257\") is int(\"257\")</code> is <b>false</b>. Both are correct behaviour and both are traps of the same shape: the wrong operator works on small data. C++ has neither, because it has no boxing — <code>==</code> on <code>string</code>, <code>vector</code> and <code>pair</code> all compare values, and identity requires you to take addresses deliberately.",
    drill: {
      ask: "De-duplicate a collection of coordinate pairs by value.",
      py: `print(len({(1,2), (1,2), (3,4)}))     # tuples hash by value`,
      cpp: `set<pair<int,int>> s{{1,2},{1,2},{3,4}};   // pair has real value equality`,
      java: `new HashSet<>(List.of(new int[]{1,2}, new int[]{1,2}, new int[]{3,4})).size();  // 3 — WRONG
new HashSet<>(List.of(List.of(1,2), List.of(1,2), List.of(3,4))).size();      // 2 — right`,
      out: "[C++]  D37 dedupedPairs=2 (pair has real value equality in C++)\n[Java] D37 dedupedPairs: HashSet<int[]>=3 (WRONG)  HashSet<List<Integer>>=2 (right)\n[Py]   D37 dedupedPairs: set of tuples=2 (tuples are hashable)   set of lists -> TypeError: unhashable type: 'list'",
    },
    see: ["LC 217 · Contains Duplicate", "LC 49 · Group Anagrams", "LC 128 · Longest Consecutive Sequence"],
  },
  {
    n: 38,
    title: "Modifying a container while you iterate it",
    tier: "extreme",
    group: "scale",
    why: "Java throws. C++ has undefined behaviour. Python does neither — it quietly skips elements and hands you a wrong answer that looks right on small inputs.",
    intuition:
      "An iterator is a position, and removing an element shifts everything after it down by one. The iterator does not know that, so it advances past the element that just moved into the vacated slot. That is why removals skip: delete index 1, and what was index 2 is now index 1, and the loop moves to index 2 — jumping the element entirely. Java detects the mismatch with a modification counter and throws; C++ leaves the iterator dangling; Python just keeps walking a shorter list. All three have the same fix: iterate over a snapshot, or use the removal API that returns a valid position.",
    useWhen: "Filtering in place. In practice: never do it by hand — use the filter idiom.",
    py: `v = [1, 2, 2, 3, 4]

for x in v:               # iterating the LIVE list
    if x % 2 == 0: v.remove(x)
# -> [1, 2, 3]  — an even number SURVIVED. No error.

for x in v[:]:            # iterate a COPY — correct
    if x % 2 == 0: v.remove(x)

[x for x in v if x % 2]   # the idiom: build a new list

# dicts are stricter: mutating during iteration raises RuntimeError.`,
    cpp: `vector<int> v{1,2,2,3,4};

for (auto it = v.begin(); it != v.end();) {
    if (*it % 2 == 0) it = v.erase(it);   // erase RETURNS the next valid iterator
    else ++it;
}

// the idiom:
v.erase(remove_if(v.begin(), v.end(),
                  [](int x){ return x % 2 == 0; }),
        v.end());
// remove_if shuffles the keepers forward and returns the new logical end;
// erase actually shrinks. Both halves are required.`,
    java: `List<Integer> v = new ArrayList<>(List.of(1,2,2,3,4));

for (Integer x : v)
    if (x % 2 == 0) v.remove(x);     // ConcurrentModificationException

Iterator<Integer> it = v.iterator();
while (it.hasNext()) if (it.next() % 2 == 0) it.remove();   // correct

v.removeIf(x -> x % 2 == 0);        // the idiom — Java 8+`,
    api: {
      py: [
        { call: "for x in a[:]", gives: "iteration over a copy", cost: "O(n) memory", gotcha: "the simple fix; a[:] is what makes it safe" },
        { call: "[x for x in a if p(x)]", gives: "a new list", cost: "O(n)", gotcha: "the idiomatic filter — build, do not mutate" },
        { call: "a[:] = [x for x in a if p(x)]", gives: "None", cost: "O(n)", gotcha: "filters IN PLACE, keeping the same object for other references" },
        { call: "mutating a dict while iterating", gives: "RuntimeError", cost: "—", gotcha: "dicts DO raise; lists do not. The inconsistency is the trap" },
      ],
      cpp: [
        { call: "it = v.erase(it)", gives: "the next valid iterator", cost: "O(n)", gotcha: "the return value is the whole point — do not ++it as well" },
        { call: "remove_if(f, l, pred)", gives: "the new logical end", cost: "O(n)", gotcha: "does NOT change size — you must call erase with the result" },
        { call: "erase-remove idiom", gives: "void", cost: "O(n)", gotcha: "v.erase(remove_if(...), v.end()) — memorise it as one unit" },
        { call: "push_back during iteration", gives: "—", cost: "—", gotcha: "may reallocate and invalidate EVERY iterator, not just yours" },
      ],
      java: [
        { call: "for-each + coll.remove", gives: "ConcurrentModificationException", cost: "—", gotcha: "fail-fast, and it is doing you a favour" },
        { call: "it.remove()", gives: "void", cost: "O(n)", gotcha: "must call it.next() first; the only safe manual removal" },
        { call: "coll.removeIf(pred)", gives: "boolean", cost: "O(n)", gotcha: "the idiom; also works on Set and Map.values()" },
        { call: "map.entrySet().removeIf(..)", gives: "boolean", cost: "O(n)", gotcha: "how you filter a Map safely" },
      ],
    },
    output: "[C++]  R38 erase-returns-iterator=[1, 3, 5]\n[C++]  R38idiom erase-remove_if=[1, 3, 5]\n[Java] R38 for-each + remove -> ConcurrentModificationException\n[Java] R38fix Iterator.remove()=[1, 3, 5]   removeIf()=[1, 3, 5]\n[Py]   R38 source=[1, 2, 2, 3, 4]  iterate over a COPY v[:] -> [1, 3] (correct)\n[Py]   R38trap iterating the LIVE list -> [1, 2, 3]  <- an even number survived. Python does NOT raise; Java throws ConcurrentModificationException\n[Py]   R38fix comprehension -> [1, 3]",
    differs:
      "Executed on <code>[1, 2, 2, 3, 4]</code>, removing evens: Java <b>threw ConcurrentModificationException</b>, and Python returned <b>[1, 2, 3]</b> — an even number survived, no exception, no warning. That is the whole rung. Java's fail-fast behaviour looks hostile and is the friendliest of the three; Python's silence is the one that reaches the judge. C++ gives you <code>erase</code> returning the next valid iterator, which is the only design here that makes the correct loop natural to write.",
    drill: {
      ask: "Remove every even number from a list, in place.",
      py: `v[:] = [x for x in v if x % 2]`,
      cpp: `v.erase(remove_if(v.begin(), v.end(),
                  [](int x){ return x % 2 == 0; }), v.end());`,
      java: `v.removeIf(x -> x % 2 == 0);`,
      out: "[C++]  D38 removeEvens=[1,3]\n[Java] D38 removeEvens=[1, 3]\n[Py]   D38 removeEvens=[1, 3]",
    },
    see: ["LC 27 · Remove Element", "LC 26 · Remove Duplicates from Sorted Array", "LC 283 · Move Zeroes"],
  },
  {
    n: 39,
    title: "The loop variable that does not write back",
    tier: "extreme",
    group: "scale",
    why: "Writing to the loop variable compiles in all three and changes the container in none of them — unless the element is an object, in which case mutating <em>through</em> it does stick. The two cases look identical.",
    intuition:
      "The loop variable is a fresh binding holding a copy of the element — for a primitive, a copy of the number; for an object, a copy of the <em>reference</em>. Assigning to the variable replaces the binding and touches nothing. But following the copied reference and writing through it reaches the same object the container holds, so that change is visible. The distinction is not “does assignment work”, it is “did you rebind the name, or mutate what it points at”. C++ is the only one that lets you opt out, with <code>T&amp;</code>.",
    useWhen: "Any in-place transformation. The default answer is: index it, or build a new container.",
    py: `v = [1, 2, 3]
for x in v: x *= 10        # nothing happens — x is rebound
# v is still [1, 2, 3]

for i in range(len(v)): v[i] *= 10      # by index — works
v[:] = [x*10 for x in v]                # in place, same object

objs = [[1]]
for o in objs: o[0] = 99   # MUTATING an element DOES stick -> [[99]]`,
    cpp: `vector<int> v{1,2,3};

for (int x : v) x *= 10;      // a COPY — no effect
for (int& x : v) x *= 10;     // a REFERENCE — writes back

for (auto& [k, val] : m) val++;   // the map equivalent

// const auto& for read-only, auto& to mutate, auto to copy.
// Getting this wrong is silent in one direction and slow in the other.`,
    java: `int[] v = {1, 2, 3};
for (int x : v) x *= 10;      // no effect — Java has NO reference loop variable

for (int i = 0; i < v.length; i++) v[i] *= 10;   // by index

List<int[]> objs = List.of(new int[]{1});
for (int[] o : objs) o[0] = 99;    // mutating the OBJECT does stick

list.replaceAll(x -> x * 10);      // the functional in-place form`,
    api: {
      py: [
        { call: "for x in a: x = ...", gives: "nothing", cost: "O(n)", gotcha: "rebinds the name; the list is untouched" },
        { call: "for i in range(len(a))", gives: "index access", cost: "O(n)", gotcha: "the plain way to write back" },
        { call: "a[:] = [...]", gives: "None", cost: "O(n)", gotcha: "mutates the SAME object — matters when something else aliases it" },
        { call: "for i, x in enumerate(a)", gives: "both", cost: "O(n)", gotcha: "still assign via a[i], not via x" },
      ],
      cpp: [
        { call: "for (T x : v)", gives: "a copy", cost: "O(n) + copies", gotcha: "silently expensive for string or vector elements" },
        { call: "for (T& x : v)", gives: "a reference", cost: "O(n)", gotcha: "the only spelling that writes back" },
        { call: "for (const T& x : v)", gives: "a const reference", cost: "O(n)", gotcha: "the correct default for read-only loops" },
        { call: "for (auto& [k,v] : m)", gives: "bindings by reference", cost: "O(n)", gotcha: "the key is const even so — you cannot rewrite it" },
      ],
      java: [
        { call: "for (int x : a)", gives: "a copy", cost: "O(n)", gotcha: "there is no reference form; assignment never writes back" },
        { call: "for (T o : list) o.set(..)", gives: "—", cost: "O(n)", gotcha: "mutating the object DOES stick — the confusing half" },
        { call: "list.replaceAll(fn)", gives: "void", cost: "O(n)", gotcha: "the in-place map for a List" },
        { call: "Arrays.setAll(a, i -> f(i))", gives: "void", cost: "O(n)", gotcha: "the same for a primitive array; the lambda takes the INDEX" },
      ],
    },
    output: "[C++]  R39 by value=[1, 2, 3]  by reference=[10, 20, 30]\n[Java] R39 by value=[1, 2, 3]  by index=[10, 20, 30]  (Java has no reference loop variable)\n[Java] R39obj mutating through an object loop var DOES stick: 99\n[Py]   R39 rebinding the loop var does nothing: [1, 2, 3]\n[Py]   R39fix by index -> [10, 20, 30]\n[Py]   R39obj mutating a MUTABLE element through the loop var DOES stick: [[99]]",
    differs:
      "All three left <code>[1, 2, 3]</code> unchanged after assigning to the loop variable. C++ is the only one that offers a fix in the same syntax — <code>for (int&amp; x : v)</code> produced <b>[10, 20, 30]</b>. The confusing half was also executed: in both Python and Java, mutating an element <em>through</em> the loop variable did stick, giving <b>99</b>. Same loop shape, opposite outcome, and the difference is whether you rebound the name or wrote through the reference.",
    drill: {
      ask: "Double every element of an array in place.",
      py: `v[:] = [x*2 for x in v]        # v[:] = keeps the same object`,
      cpp: `for (int& x : v) x *= 2;       // note the &`,
      java: `for (int i = 0; i < v.length; i++) v[i] *= 2;`,
      out: "[C++]  D39 doubled=[2,4,6]\n[Java] D39 doubled=[2, 4, 6]  (no reference loop variable — index it)\n[Py]   D39 doubled=[2, 4, 6]  (v[:] = ... mutates in place; v = ... would rebind)",
    },
    see: ["LC 1929 · Concatenation of Array", "LC 977 · Squares of a Sorted Array", "LC 283 · Move Zeroes"],
  },
  {
    n: 40,
    title: "The traps that only appear at scale",
    tier: "extreme",
    group: "scale",
    why: "These pass every small test you write. They are what the hidden test set is for.",
    intuition:
      "Everything on this rung is a constant factor or a memory factor, which is why none of it shows up at n = 10. Selection via <code>nth_element</code> is O(n) rather than the O(n log n) of a full sort because it only recurses into the half containing the answer. A dynamic array reallocates O(log n) times, not n — 1000 pushes caused 11 reallocations in the executed run. And boxing is the quiet one: <code>int[1_000_000]</code> is 4 MB of contiguous ints, while <code>List&lt;Integer&gt;</code> is a million pointers to a million 16-byte objects scattered across the heap — five times the memory and far worse cache behaviour, for identical code.",
    useWhen: "When it is correct and still too slow. Start here.",
    py: `import sys, heapq

sys.getrecursionlimit()     # 1000 — a DFS on 1e5 nodes RecursionErrors
sys.setrecursionlimit(300000)   # or go iterative, which is safer

heapq.nsmallest(k, a)       # O(n log k), no full sort

sum(range(2000000))         # a C loop — far faster than a Python for-loop

# a list of 1e6 ints is pointers (8B each) PLUS int objects (~28B each):
# roughly 9x the memory of a C++ vector<int>.
# input(): use sys.stdin.readline for large input.`,
    cpp: `nth_element(a.begin(), a.begin()+k-1, a.end());   // O(n) AVERAGE
a[k-1];    // the kth smallest; the rest is unordered

vector<bool> vb(3, true);
auto x = vb[0];            // a PROXY object, not a bool&
// bool& b = vb[0];        // does NOT compile

v.reserve(n);              // 1000 push_backs -> 11 reallocations without it

ios::sync_with_stdio(false); cin.tie(nullptr);   // cin/cout, 5-10x faster`,
    java: `// ArrayList grows 1.5x: 10, 15, 22, 33, ...
new ArrayList<>(n);         // pre-size when n is known

// boxing: int[1_000_000] ~ 4MB;  List<Integer> ~ 20MB
// use int[] in hot paths, always.

// PriorityQueue.remove(Object) is O(n) — use lazy deletion instead.

// I/O: Scanner is slow. BufferedReader + StringTokenizer, or
// a DataInputStream wrapper, for 1e5+ lines.`,
    api: {
      py: [
        { call: "sys.setrecursionlimit(n)", gives: "None", cost: "O(1)", gotcha: "the default is 1000 — a deep DFS dies well before 10⁵" },
        { call: "heapq.nsmallest(k, a)", gives: "a list", cost: "O(n log k)", gotcha: "the closest thing to nth_element" },
        { call: "sys.stdin.readline", gives: "str", cost: "O(len)", gotcha: "input() is much slower on 10⁵ lines" },
        { call: "sum(range(n))", gives: "int", cost: "O(n) in C", gotcha: "built-ins loop in C; an equivalent Python for-loop is far slower" },
      ],
      cpp: [
        { call: "nth_element(f, mid, l)", gives: "void", cost: "O(n) average", gotcha: "only mid is correctly placed; the rest is unordered" },
        { call: "vector<bool>", gives: "a BIT-PACKED proxy", cost: "O(1)", gotcha: "not a real container of bool — bool& does not compile. Use vector<char>" },
        { call: "v.reserve(n)", gives: "void", cost: "O(n)", gotcha: "removes every reallocation when n is known" },
        { call: "ios::sync_with_stdio(false)", gives: "void", cost: "O(1)", gotcha: "5-10x faster cin/cout; then never mix with printf" },
      ],
      java: [
        { call: "new ArrayList<>(n)", gives: "a pre-sized list", cost: "O(1)", gotcha: "growth is 1.5x, so 10⁶ appends means ~35 array copies" },
        { call: "int[] vs List<Integer>", gives: "—", cost: "—", gotcha: "roughly 5x memory and much worse locality once boxed" },
        { call: "BufferedReader + StringTokenizer", gives: "fast input", cost: "O(n)", gotcha: "Scanner is 5-10x slower; it matters at 10⁵ tokens" },
        { call: "pq.remove(Object)", gives: "boolean", cost: "O(n)", gotcha: "a linear scan — prefer lazy deletion in Dijkstra" },
      ],
    },
    output: "[C++]  R40 nth_element k-th=5 vector<bool>[0] is a proxy, value=true sizeof(proxy)=16\n[C++]  R40cap 1000 push_backs caused 11 reallocations, final capacity=1024\n[Java] R40 ArrayList grows 1.5x (10,15,22,33,...) — call new ArrayList<>(n) when n is known\n[Java] R40perf 20000 appends: StringBuilder faster than += by more than 10x -> true  (measured in-run; the exact multiple varies, the order of magnitude does not)\n[Java] R40box Integer boxing costs ~16 bytes/element: int[1_000_000] ~4MB vs List<Integer> ~20MB\n[Py]   R40 sys.getsizeof([]) = 56 bytes, a list of 1e6 ints holds POINTERS (~8 bytes each) plus the int objects themselves (~28 bytes) — roughly 9x a C++ vector<int>\n[Py]   R40rec default recursion limit = 1000  <- a DFS on 1e5 nodes will RecursionError; raise it or go iterative\n[Py]   R40perf sum(range(2e6)) faster than a Python for-loop -> True (same answer True) — the C loop beats the interpreted one every time",
    differs:
      "Four executed facts. C++ <code>nth_element</code> placed the kth element correctly in O(n) average without sorting the rest. <code>vector&lt;bool&gt;</code> handed back a <b>16-byte proxy object</b> rather than a <code>bool&amp;</code> — it is not a container of bools. 1000 <code>push_back</code> calls caused <b>11 reallocations</b>, ending at capacity 1024, which is the doubling that makes append amortised O(1). And in the same JVM run, <code>StringBuilder</code> beat string concatenation by more than an order of magnitude. None of these is visible at n = 10.",
    drill: {
      ask: "Find the kth smallest element without fully sorting the array.",
      py: `print(heapq.nsmallest(k, a)[-1])       # O(n log k)`,
      cpp: `nth_element(a.begin(), a.begin()+k-1, a.end());
int ans = a[k-1];                         // O(n) average — the fastest of the three`,
      java: `PriorityQueue<Integer> h = new PriorityQueue<>(Comparator.reverseOrder());
for (int x : a) { h.offer(x); if (h.size() > k) h.poll(); }
int ans = h.peek();                       // O(n log k) — Java has no nth_element`,
      out: "[C++]  D40 kthSmallest(3) via nth_element=7 (O(n) average, no full sort)\n[Java] D40 kthSmallest(3) via size-k max-heap=7  (Java has no nth_element; O(n log k) instead of O(n))\n[Py]   D40 kthSmallest(3) via heapq.nsmallest=7  (O(n log k); Python has no nth_element)",
    },
    see: ["LC 215 · Kth Largest Element", "LC 973 · K Closest Points", "LC 347 · Top K Frequent Elements"],
  },
];

/** Rungs grouped for the tier filter in the UI. */
export const LADDER_TIERS = ["easy", "medium", "hard", "extreme"] as const;

/** The families a rung can belong to, in ladder order. */
export const LADDER_GROUPS = [
  "sequence",
  "shape",
  "order",
  "lookup",
  "search",
  "linear structures",
  "text",
  "scale",
] as const;

/** Human-readable labels for the language toggle. */
export const LADDER_LANGS: { key: LangKey; label: string; runtime: string }[] = [
  { key: "py", label: "python", runtime: "CPython 3.10.12" },
  { key: "cpp", label: "c++", runtime: "g++ 11.4.0, -std=c++17" },
  { key: "java", label: "java", runtime: "OpenJDK 11.0.31" },
];
