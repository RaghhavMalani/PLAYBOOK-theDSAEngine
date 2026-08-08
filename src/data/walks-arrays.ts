import type { Pattern } from "../types";

/**
 * Edge matrices and worked traces for the array patterns.
 *
 * Arrays is the most heavily weighted topic across all 25 companies and was the
 * emptiest in the app — 1 of 8 patterns had any edge cases or traces. This file
 * closes that gap.
 *
 * Every table below was produced by running the algorithm and printing state. Where a
 * table shows a *wrong* variant, the wrong variant was executed too, so the failure it
 * describes is the failure it actually produces.
 */
type Extra = Pick<Pattern, "edges" | "walk">;

export const WALKS_ARRAYS: Readonly<Record<string, Extra>> = {
  "Kadane (max subarray)": {
    edges: [
      {
        input: "All negative, e.g. <code>[−3, −1, −7]</code>",
        effect: "Initialising <code>best = 0</code> returns <b>0</b> — an empty subarray — when the answer is <b>−1</b>.",
        fix: "Initialise both <code>cur</code> and <code>best</code> to <code>a[0]</code> and start the loop at index 1. This is the single most common Kadane bug and the test that catches it is always present.",
      },
      {
        input: "Empty array",
        effect: "<code>a[0]</code> throws before the loop begins.",
        fix: "Guard it. Decide with the interviewer whether an empty input should return 0 or is out of contract — do not silently pick one.",
      },
      {
        input: "Single element",
        effect: "Loop body never runs; returns <code>a[0]</code>.",
        fix: "Correct for free, including when that element is negative — which is exactly why the <code>a[0]</code> initialisation is right.",
      },
      {
        input: "You also need the subarray, not just the sum",
        effect: "The plain version tracks no indices, so you can report the value but not where it came from.",
        fix: "Record <code>start</code> when <code>cur</code> restarts (that is, when <code>a[i] &gt; cur + a[i]</code>), and record <code>(start, i)</code> whenever <code>best</code> improves. Common follow-up.",
      },
      {
        input: "Sum exceeding 32-bit",
        effect: "10⁵ elements at 10⁴ each is 10⁹ — fine; but 10⁵ at 10⁵ is 10¹⁰ and overflows int.",
        fix: "<code>long long</code> / <code>long</code> in C++ and Java. Check the constraint on element magnitude, not just on n.",
      },
    ],
    walk: [
      {
        title: "Simple — the canonical run",
        input: "a = [−2, 1, −3, 4, −1, 2, 1, −5, 4]",
        cols: ["i", "a[i]", "cur = max(a[i], cur+a[i])", "best"],
        rows: [
          ["0", "−2", "−2 (seed)", "−2"],
          ["1", "1", "max(1, −1) = <b>1</b>", "1"],
          ["2", "−3", "max(−3, −2) = −2", "1"],
          ["3", "4", "max(4, 2) = <b>4</b>", "4"],
          ["4", "−1", "max(−1, 3) = 3", "4"],
          ["5", "2", "max(2, 5) = 5", "5"],
          ["6", "1", "max(1, 6) = 6", "<b>6</b>"],
          ["7", "−5", "max(−5, 1) = 1", "6"],
          ["8", "4", "max(4, 5) = 5", "6"],
        ],
        lesson:
          "Answer 6, from the subarray [4, −1, 2, 1]. Rows 1 and 3 are the restarts: when <code>a[i]</code> alone beats <code>cur + a[i]</code>, the running sum has become a liability and you drop it. That single comparison is the whole algorithm.",
      },
      {
        title: "Harder — the all-negative trap, both variants run",
        input: "a = [−3, −1, −7]",
        cols: ["initialisation", "cur / best after each step", "returns", "verdict"],
        rows: [
          ["<code>best = a[0]</code>", "(−3,−3) → (−1,−1) → (−7,−1)", "<b>−1</b>", "correct — the least-bad single element"],
          ["<code>best = 0</code>", "(0,0) → (0,0) → (0,0)", "<b>0</b>", "<b>wrong</b> — reports an empty subarray"],
        ],
        lesson:
          "Both were executed. The <code>best = 0</code> version never selects any element because every running sum is negative, so it silently claims a subarray that does not exist. If the problem permits an empty subarray, 0 is right — read the statement, because the two conventions differ by one line and one test case.",
      },
    ],
  },

  "In-place read / write pointers": {
    edges: [
      {
        input: "Empty array",
        effect: "Loop never runs, <code>w</code> stays 0, returns 0.",
        fix: "Correct with no guard — one of the few patterns where the empty case falls out.",
      },
      {
        input: "Every element removed",
        effect: "<code>w</code> stays 0; the array's contents past index 0 are untouched but irrelevant.",
        fix: "Return <code>w</code>, and say out loud that only <code>a[0..w)</code> is defined. The grader ignores the tail — people who try to clear it waste time.",
      },
      {
        input: "Nothing removed",
        effect: "<code>a[w] = a[r]</code> writes every element onto itself — harmless but n redundant writes.",
        fix: "Guard with <code>if w != r</code> if writes are expensive. Not needed for correctness; worth mentioning as an optimisation.",
      },
      {
        input: "Advancing <code>w</code> before writing",
        effect: "Off-by-one: the first slot is skipped and the last kept element is dropped.",
        fix: "Write first, then increment: <code>a[w] = a[r]; w += 1</code>. Order matters and the failure looks like an unrelated boundary bug.",
      },
      {
        input: "Order must be preserved",
        effect: "The swap-with-last trick is O(n) too but scrambles order.",
        fix: "Read/write compaction is stable; swap-with-last is not. Pick based on whether the problem cares — and it usually does.",
      },
    ],
    walk: [
      {
        title: "Simple — remove all 3s",
        input: "a = [3, 2, 2, 3], val = 3",
        cols: ["r", "a[r]", "keep?", "w after", "array"],
        rows: [
          ["0", "3", "no", "0", "[3, 2, 2, 3]"],
          ["1", "2", "<b>yes</b> → a[0] = 2", "1", "[<b>2</b>, 2, 2, 3]"],
          ["2", "2", "<b>yes</b> → a[1] = 2", "2", "[2, <b>2</b>, 2, 3]"],
          ["3", "3", "no", "2", "[2, 2, 2, 3]"],
        ],
        lesson:
          "Returns 2, and <code>a[0..2)</code> = [2, 2] is the answer. The tail still reads [2, 3] — that is expected and the grader does not look at it. <code>r</code> always moves; <code>w</code> only moves on a keep, which is why <code>w ≤ r</code> always holds and the write can never clobber an unread element.",
      },
      {
        title: "Harder — why w never overtakes r",
        input: "The invariant that makes in-place safe",
        cols: ["step", "w", "r", "w ≤ r?", "safe to write a[w]?"],
        rows: [
          ["start", "0", "0", "yes (equal)", "yes — writing onto itself"],
          ["after a skip", "0", "1", "<b>w &lt; r</b>", "yes — a[0] already read"],
          ["after a keep", "1", "1", "yes (equal)", "yes"],
          ["general", "w", "r", "<b>always w ≤ r</b>", "a[w] was read at step w ≤ r"],
        ],
        lesson:
          "<code>w</code> increments only on a keep and <code>r</code> increments every step, so <code>w</code> can never pass <code>r</code>. That is the proof that in-place is safe here, and it is the sentence to say out loud — the code is trivial, the invariant is what is being tested.",
      },
    ],
  },

  "Cyclic sort (index as hash)": {
    edges: [
      {
        input: "Values outside <code>1..n</code>",
        effect: "<code>j = a[i] − 1</code> indexes out of bounds — an immediate crash on negatives or large values.",
        fix: "Bounds-check <code>0 ≤ j &lt; n</code> before swapping and advance past anything out of range. First Missing Positive depends on this branch.",
      },
      {
        input: "Duplicates present",
        effect: "Comparing <code>a[i] != i + 1</code> loops forever when two equal values want the same slot.",
        fix: "Compare <b>values</b>, not positions: <code>a[i] != a[j]</code>. When they are equal the slot is already correct and you advance. This is the condition that guarantees termination.",
      },
      {
        input: "Already sorted",
        effect: "Zero swaps; the pointer advances n times.",
        fix: "Correct. Best case, and a useful sanity check that you are not swapping unconditionally.",
      },
      {
        input: "Advancing <code>i</code> after a swap",
        effect: "The value swapped <em>into</em> position <code>i</code> is never examined, so it stays misplaced.",
        fix: "Only advance when no swap happened. After a swap, re-examine the same index.",
      },
      {
        input: "0-indexed value range <code>0..n−1</code>",
        effect: "Using <code>a[i] − 1</code> is off by one for the whole array.",
        fix: "Target index is <code>a[i]</code>, not <code>a[i] − 1</code>. Read the range in the statement before writing the line.",
      },
    ],
    walk: [
      {
        title: "Simple — three swaps, then five advances",
        input: "a = [3, 1, 5, 4, 2]",
        cols: ["i", "a[i]", "target j = a[i]−1", "action", "array after"],
        rows: [
          ["0", "3", "2", "a[0] ≠ a[2] → <b>swap</b>", "[5, 1, 3, 4, 2]"],
          ["0", "5", "4", "a[0] ≠ a[4] → <b>swap</b>", "[2, 1, 3, 4, 5]"],
          ["0", "2", "1", "a[0] ≠ a[1] → <b>swap</b>", "[1, 2, 3, 4, 5]"],
          ["0", "1", "0", "a[0] == a[0] → advance", "sorted"],
          ["1–4", "—", "—", "each already home → advance", "[1, 2, 3, 4, 5]"],
        ],
        lesson:
          "Exactly <b>3</b> swaps and 5 advances. Index 0 is visited four times because after each swap you re-examine the same slot — advancing instead would leave 5 and 2 stranded. Every swap places at least one value permanently, which is why the total work is O(n) despite the inner-looking behaviour.",
      },
      {
        title: "Harder — First Missing Positive, where the bounds check earns its place",
        input: "a = [3, 4, −1, 1] → LeetCode 41",
        cols: ["phase", "state", "note"],
        rows: [
          ["place", "[1, −1, 3, 4]", "−1 and 4 are out of range or already home"],
          ["scan i=0", "a[0] = 1 = 0+1 ✓", "keep going"],
          ["scan i=1", "a[1] = −1 ≠ 2", "<b>answer = 2</b>"],
          ["check [1,2,0]", "→ 3", "all of 1..2 present, so answer is n+1"],
          ["check [7,8,9,11,12]", "→ 1", "nothing in range at all"],
        ],
        lesson:
          "All three results verified. The bounds check is not defensive coding here — it <em>is</em> the algorithm, because out-of-range values are precisely the ones that mark a gap. This is the O(n) time, O(1) space answer that the O(n) space hash-set version does not get credit for.",
      },
    ],
  },

  "Difference array (range updates)": {
    edges: [
      {
        input: "Size <code>n</code> instead of <code>n+1</code>",
        effect: "<code>d[r+1] -= v</code> writes out of bounds when the range ends at the last index.",
        fix: "Allocate <code>n+1</code>. The extra cell absorbs the closing marker of a full-length range and costs nothing.",
      },
      {
        input: "Ranges given 1-indexed",
        effect: "Applying <code>d[l] += v</code> directly shifts every update by one position.",
        fix: "Convert once at the boundary: <code>d[l−1] += v; d[r] -= v</code>. Do it in one place, not scattered through the loop.",
      },
      {
        input: "Reading before the prefix pass",
        effect: "<code>d</code> holds deltas, not values — the array looks like nonsense.",
        fix: "The prefix sum is what materialises the answer. Updates are O(1) each; you pay O(n) once at the end." ,
      },
      {
        input: "Queries interleaved with updates",
        effect: "Every query forces a fresh O(n) prefix pass, so the technique loses its advantage.",
        fix: "Difference arrays are for <b>batch</b> updates then one read. Interleaved reads and writes need a Fenwick tree.",
      },
      {
        input: "Coordinates up to 10⁹",
        effect: "The array cannot be allocated.",
        fix: "Switch to event sweeping — sort <code>(position, delta)</code> pairs instead of indexing an axis you cannot afford.",
      },
    ],
    walk: [
      {
        title: "Simple — three range updates in O(1) each",
        input: "n = 5; add 2 to [1,3], add 3 to [2,4], add −1 to [0,2]",
        cols: ["operation", "d after", "cost"],
        rows: [
          ["+2 on [1,3]", "[0, <b>2</b>, 0, 0, <b>−2</b>, 0]", "O(1)"],
          ["+3 on [2,4]", "[0, 2, <b>3</b>, 0, −2, <b>−3</b>]", "O(1)"],
          ["−1 on [0,2]", "[<b>−1</b>, 2, 3, <b>1</b>, −2, −3]", "O(1)"],
          ["prefix pass", "→ [−1, 1, 4, 5, 3]", "O(n), once"],
        ],
        lesson:
          "Brute force would touch 3 + 3 + 3 = 9 cells; the difference array touches 6 and then makes one pass. Verified against a brute-force loop — both give [−1, 1, 4, 5, 3]. At 10⁵ updates over 10⁵ elements this is 2×10⁵ operations instead of 10¹⁰.",
      },
      {
        title: "Harder — Corporate Flight Bookings, the 1-indexed conversion",
        input: "bookings = [[1,2,10], [2,3,20], [2,5,25]], n = 5 → LeetCode 1109",
        cols: ["booking (1-indexed)", "d[first−1] +=", "d[last] −=", "running answer"],
        rows: [
          ["[1, 2, 10]", "d[0] += 10", "d[2] −= 10", "—"],
          ["[2, 3, 20]", "d[1] += 20", "d[3] −= 20", "—"],
          ["[2, 5, 25]", "d[1] += 25", "d[5] −= 25", "—"],
          ["prefix", "—", "—", "<b>[10, 55, 45, 25, 25]</b>"],
        ],
        lesson:
          "Verified against the expected LeetCode output. The <code>−1</code> on the opening index and the bare <code>last</code> on the closing one are asymmetric on purpose — <code>last</code> is already the exclusive end once converted. Getting this backwards shifts every seat by one and produces an answer that looks nearly right.",
      },
    ],
  },

  "Fenwick tree (BIT)": {
    edges: [
      {
        input: "0-indexed input",
        effect: "<code>i += i &amp; -i</code> loops forever at index 0, because the low bit of 0 is 0.",
        fix: "The tree is <b>1-indexed internally</b>. Convert on entry (<code>i += 1</code>) and keep the public API 0-indexed if you prefer.",
      },
      {
        input: "Range sum with <code>l = 0</code>",
        effect: "<code>prefix(l − 1)</code> becomes <code>prefix(−1)</code> and underflows.",
        fix: "Guard: <code>l ? prefix(r) − prefix(l−1) : prefix(r)</code>.",
      },
      {
        input: "Building by n separate updates",
        effect: "O(n log n) — fine, but there is a linear construction.",
        fix: "O(n) build: copy the values, then push each node into its parent once. Worth knowing when n = 10⁶ and the build is timed.",
      },
      {
        input: "Needing range <em>assignment</em>, not addition",
        effect: "A Fenwick tree cannot do it — it accumulates.",
        fix: "Segment tree with lazy propagation. Knowing which structure stops working is the follow-up question." ,
      },
      {
        input: "Sums exceeding 32-bit",
        effect: "10⁵ values at 10⁹ each is 10¹⁴.",
        fix: "64-bit tree array. The indices stay int; the accumulator must not.",
      },
    ],
    walk: [
      {
        title: "Simple — prefix and range on [1..8]",
        input: "a = [1, 2, 3, 4, 5, 6, 7, 8], all inserted",
        cols: ["query", "meaning", "result"],
        rows: [
          ["<code>prefix(3)</code>", "1 + 2 + 3 + 4", "<b>10</b>"],
          ["<code>range(2, 5)</code>", "3 + 4 + 5 + 6", "<b>18</b>"],
          ["<code>add(2, +10)</code>", "index 2 becomes 13", "—"],
          ["<code>range(2, 5)</code>", "13 + 4 + 5 + 6", "<b>28</b>"],
        ],
        lesson:
          "All four verified against a running implementation. The point is the third row: a point update costs O(log n) and every later range query stays correct — which is exactly what a prefix-sum array cannot do.",
      },
      {
        title: "Harder — why the low-bit trick is O(log n)",
        input: "n = 8; the index chains for update and query",
        cols: ["operation", "start", "chain", "steps"],
        rows: [
          ["update", "5", "5 → 6 → 8", "<b>3</b> (add low bit)"],
          ["query", "7", "7 → 6 → 4", "<b>3</b> (strip low bit)"],
          ["why", "—", "each step clears or carries one bit", "≤ log₂ n"],
        ],
        lesson:
          "Both chains verified. <code>i &amp; -i</code> isolates the lowest set bit; adding it carries upward through the responsibility tree, subtracting it walks down to the next disjoint block. Each step changes one bit, so neither chain can exceed the bit-width of n — that is the entire complexity argument, and it is what to say when asked to justify O(log n).",
      },
    ],
  },
};
