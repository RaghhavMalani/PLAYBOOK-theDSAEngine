/**
 * The array approach guide — a decision procedure, not a list.
 *
 * The pattern index answers "how does X work". This answers the question you actually
 * face in an OA: *I am staring at an array problem and the clock is running — what do
 * I do first?* It is deliberately ordered as a sequence of cheap questions, because the
 * expensive move is picking a technique before you have read the constraints.
 *
 * Every claim about a technique here matches a real pattern in the index; the `goto`
 * field is checked against pattern names at load, so this cannot drift out of sync.
 */

export interface ApproachStep {
  /** ordinal, rendered as the chapter numeral */
  n: number;
  /** the question to ask yourself, in the second person */
  ask: string;
  /** why this question comes at this position */
  why: string;
  /** concrete branches: what the answer implies */
  branches: readonly { when: string; then: string; goto?: string }[];
}

export interface SignalRow {
  /** the phrase or shape in the problem statement */
  cue: string;
  /** what it almost always means */
  means: string;
  /** pattern name in the index */
  goto: string;
}

/**
 * Step 0 is reading the constraint, and it is first for a reason: it eliminates more
 * wrong approaches per second than any other action available to you.
 */
export const ARRAY_APPROACH: readonly ApproachStep[] = [
  {
    n: 1,
    ask: "What is n, and what does that allow?",
    why: "The constraint is the interviewer telling you the intended complexity before you have thought about the problem at all. Reading it first eliminates entire families of approach in about five seconds, and skipping it is how people spend twenty minutes optimising toward a bound they were never going to need.",
    branches: [
      { when: "n ≤ 10", then: "Exponential is fine. Permutations, subsets, brute force over all orderings." },
      { when: "n ≤ 20", then: "2ⁿ ≈ 10⁶. Bitmask over subsets, or meet in the middle." },
      { when: "n ≤ 500", then: "O(n³) fits. Floyd–Warshall, interval DP over all splits." },
      { when: "n ≤ 5000", then: "O(n²) fits. Two-sequence DP, all-pairs scans." },
      { when: "n ≤ 10⁵ or 10⁶", then: "O(n log n) at worst. Sort, binary search, heap — or a single clever pass." },
      { when: "n ≤ 10⁹", then: "You cannot even touch every element. Binary search on the answer, or maths." },
    ],
  },
  {
    n: 2,
    ask: "Is the array sorted — and if not, would sorting cost me anything?",
    why: "Sortedness unlocks two pointers and binary search, which are the cheapest tools in the topic. If the answer does not depend on original order, sorting is nearly free at O(n log n) and frequently turns a hard problem into an obvious one. The only reason not to sort is if positions matter.",
    branches: [
      { when: "Sorted, looking for a pair or triple", then: "Converging two pointers. No hash map needed, O(1) space.", goto: "Two pointers, converging" },
      { when: "Sorted, looking for a position or boundary", then: "Binary search — first-true or last-true template." },
      { when: "Unsorted but order does not matter", then: "Sort first. Almost always worth it." },
      { when: "Unsorted and order is the answer", then: "Do not sort. Think hash map, prefix sums, or a stack." },
      { when: "Values are 1..n, a permutation", then: "Cyclic sort — O(n) and O(1), better than sorting.", goto: "Cyclic sort (index as hash)" },
    ],
  },
  {
    n: 3,
    ask: "Am I being asked about a contiguous run, or any subset?",
    why: "This single distinction splits the topic in half. Contiguous means windows and prefix sums are available. Non-contiguous means you are in subsequence territory, which is usually DP or sorting — and applying a window there is the most common wrong turn in the whole topic.",
    branches: [
      { when: "Contiguous, fixed length", then: "Fixed sliding window — add one, drop one." },
      { when: "Contiguous, variable length with a condition", then: "Variable sliding window — grow, then shrink while invalid." },
      { when: "Contiguous, maximum sum", then: "Kadane. Restart whenever the running sum turns into a liability.", goto: "Kadane (max subarray)" },
      { when: "Contiguous, maximum product", then: "Kadane with a running minimum too — negatives flip.", goto: "Maximum product subarray" },
      { when: "Contiguous, sum equals exactly k", then: "Prefix sum plus a hash map of seen prefixes." },
      { when: "Not contiguous", then: "Sorting, DP, or a heap. A window is invalid here." },
    ],
  },
  {
    n: 4,
    ask: "Does the problem demand O(1) extra space?",
    why: "This is the follow-up that arrives after you give the obvious answer, and it is where most of the marks are. There is a small, fixed set of tricks that buy O(1) space, and they are worth knowing by name because none of them is derivable in the moment.",
    branches: [
      { when: "Removing or compacting elements", then: "Read and write pointers into the same array.", goto: "In-place read / write pointers" },
      { when: "Three categories to segregate", then: "Dutch national flag, three pointers, one pass.", goto: "Dutch national flag (3-way partition)" },
      { when: "Rotating or cyclically shifting", then: "Three reversals. No modular arithmetic.", goto: "Rotate by reversal" },
      { when: "Finding a majority element", then: "Boyer–Moore cancellation, then verify.", goto: "Boyer–Moore majority vote" },
      { when: "Values are 1..n and something is missing or duplicated", then: "Cyclic sort, or use the sign of each slot as a visited marker.", goto: "Cyclic sort (index as hash)" },
      { when: "Finding a cycle", then: "Floyd's fast and slow pointers." },
    ],
  },
  {
    n: 5,
    ask: "Are there many queries, or many updates, or both?",
    why: "This is the question that chooses your data structure, and getting it wrong is expensive because the wrong choice still passes the small tests. The rule is simple: reads only, prefix sums. Writes too, a tree.",
    branches: [
      { when: "Many range reads, no writes", then: "Prefix sums. O(n) build, O(1) query." },
      { when: "Many range writes, then one read", then: "Difference array. O(1) per update.", goto: "Difference array (range updates)" },
      { when: "Reads and point writes interleaved", then: "Fenwick tree — shorter to write than a segment tree.", goto: "Fenwick tree (BIT)" },
      { when: "Range writes and range reads interleaved", then: "Segment tree with lazy propagation.", goto: "Segment tree" },
      { when: "Coordinates up to 10⁹ but few events", then: "Sweep the events, not the axis." },
    ],
  },
  {
    n: 6,
    ask: "Before I submit — what breaks this?",
    why: "The gap between a working solution and an accepted one is almost always a boundary you did not test. These five take under a minute together and they are the ones graders actually include.",
    branches: [
      { when: "Empty array", then: "Does a[0] throw? Does the loop still terminate?" },
      { when: "One element", then: "Do two pointers cross immediately? Is the answer that element?" },
      { when: "All identical", then: "Do duplicate-skipping loops terminate? Does the partition degrade?" },
      { when: "All negative", then: "Did you initialise an accumulator to 0 when it should be a[0]?" },
      { when: "Maximum values", then: "Does the sum or product exceed 32 bits? 10⁵ × 10⁵ = 10¹⁰." },
    ],
  },
];

/**
 * The fast lookup: phrase in the statement, technique it implies. This is the table to
 * read the night before, and the one to scan when the clock is running.
 */
export const ARRAY_SIGNALS: readonly SignalRow[] = [
  { cue: "“sorted array” + “find a pair”", means: "converging two pointers, not a hash map", goto: "Two pointers, converging" },
  { cue: "“maximum sum subarray”", means: "Kadane — one pass, restart on liability", goto: "Kadane (max subarray)" },
  { cue: "“maximum product subarray”", means: "Kadane, but track the minimum as well", goto: "Maximum product subarray" },
  { cue: "“in place” or “O(1) extra space”", means: "read/write pointers, reversal, or index-as-hash", goto: "In-place read / write pointers" },
  { cue: "“0s, 1s and 2s” or three buckets", means: "Dutch national flag, one pass", goto: "Dutch national flag (3-way partition)" },
  { cue: "“rotate by k”", means: "three reversals, and k mod n first", goto: "Rotate by reversal" },
  { cue: "“more than n/2 times”", means: "Boyer–Moore, then a verification pass", goto: "Boyer–Moore majority vote" },
  { cue: "“next greater arrangement” / “next permutation”", means: "rightmost ascent, swap, reverse the suffix", goto: "Next permutation" },
  { cue: "“buy low, sell high” / “max difference i < j”", means: "track the minimum so far, score before updating", goto: "Best time to buy and sell (min-so-far)" },
  { cue: "values are exactly 1..n", means: "cyclic sort — every value has a home index", goto: "Cyclic sort (index as hash)" },
  { cue: "“add v to every element in [l, r]”, many times", means: "difference array, then one prefix pass", goto: "Difference array (range updates)" },
  { cue: "“range sum” with updates in between", means: "Fenwick tree, not a prefix array", goto: "Fenwick tree (BIT)" },
  { cue: "“range sum” and “range update” together", means: "segment tree with lazy propagation", goto: "Segment tree" },
];

/**
 * The five mistakes that cost the most marks in this topic, ranked by how often they
 * survive a person's own testing — which is what makes them dangerous.
 */
export const ARRAY_PITFALLS: readonly { title: string; body: string }[] = [
  {
    title: "Initialising an accumulator to zero",
    body: "Kadane and maximum-product both break on all-negative input if you seed <code>best = 0</code>, because zero corresponds to an empty subarray that the problem usually does not permit. Seed from <code>a[0]</code> and start the loop at index 1. This single mistake accounts for more failed Kadane submissions than every other cause combined.",
  },
  {
    title: "Treating a candidate as an answer",
    body: "Boyer–Moore returns a candidate whether or not a majority exists. Quickselect's pivot lands in its final position but says nothing about the rest. Both need a second step to be correct, and both produce output that <em>looks</em> right without it.",
  },
  {
    title: "Advancing a pointer that should have stayed",
    body: "In Dutch national flag, <code>mid</code> must not move after swapping with <code>hi</code> — the incoming value is unexamined. In cyclic sort, the index must not advance after a swap for the same reason. Both bugs leave a few elements misplaced rather than failing loudly.",
  },
  {
    title: "Assuming the array fits the technique you know",
    body: "A window is only valid on a contiguous range with a monotone condition. Applying one to a subsequence problem produces a plausible answer on small tests and a wrong one on the hidden set. Check contiguity before reaching for the window.",
  },
  {
    title: "Ignoring the size of the values",
    body: "Constraints bound <code>n</code>, but overflow comes from the <em>values</em>. 10⁵ elements at 10⁵ each sums to 10¹⁰, which is past int32. Inversion counts reach n(n−1)/2 ≈ 5 × 10⁹. Read both bounds, not just the one on n.",
  },
];
