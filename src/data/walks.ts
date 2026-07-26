import type { Pattern } from "../types";
import { WALKS_GRAPHS } from "./walks-graphs";
import { WALKS_DP } from "./walks-dp";
import { WALKS_TREES } from "./walks-trees";
import { WALKS_STRUCTURES } from "./walks-structures";

/**
 * Worked traces and edge-case matrices, keyed by pattern name.
 *
 * Each pattern gets two or three walkthroughs ordered simple -> complicated, each a
 * dry run you can check your own implementation against line by line. The point of
 * the hardest one is always that the naive mental model breaks on it.
 */
type Extra = Pick<Pattern, "edges" | "walk">;

const CORE_WALKS: Readonly<Record<string, Extra>> = {
  "Two pointers, converging": {
    edges: [
      { input: "n = 0 or 1", effect: "<code>hi = len(a)-1</code> is −1 or 0, so the loop never runs and you fall through to the 'not found' return.", fix: "Correct by accident here, but say it out loud — the interviewer is checking whether you noticed." },
      { input: "target smaller than a[0]+a[1]", effect: "hi walks all the way down to lo and exits. O(n), no crash.", fix: "Nothing to fix; confirm the loop condition is <code>lo &lt; hi</code> and not <code>&lt;=</code>, or you would compare an element with itself." },
      { input: "Duplicates, and all pairs wanted", effect: "The same pair is emitted repeatedly.", fix: "After recording a hit, advance lo past all equal values AND retreat hi past all equal values." },
      { input: "Input not actually sorted", effect: "Silently wrong — the elimination argument is invalid, and it still returns something.", fix: "Sort first, or assert sortedness. Never trust the caller." },
      { input: "Integer overflow on the sum", effect: "Two values near 2·10⁹ overflow int32 and the comparison inverts.", fix: "<code>long long</code> for the sum in C++/Java." },
    ],
    walk: [
      {
        title: "Simple — the pair exists",
        input: "a = [2, 7, 11, 15], target = 22",
        cols: ["lo", "hi", "a[lo]+a[hi]", "vs target", "action"],
        rows: [
          ["0", "3", "2 + 15 = 17", "17 < 22", "too small → lo++"],
          ["1", "3", "7 + 15 = 22", "equal", "found → return (1, 3)"],
        ],
        lesson: "Two probes for n = 4. Each step eliminates one index permanently, which is why it is O(n) and not O(n²).",
      },
      {
        title: "Harder — no pair exists, pointers must cross",
        input: "a = [1, 3, 5, 9], target = 100",
        cols: ["lo", "hi", "sum", "action"],
        rows: [
          ["0", "3", "1 + 9 = 10", "too small → lo++"],
          ["1", "3", "3 + 9 = 12", "too small → lo++"],
          ["2", "3", "5 + 9 = 14", "too small → lo++"],
          ["3", "3", "—", "lo == hi → loop exits, return None"],
        ],
        lesson: "The exit condition is <code>lo &lt; hi</code>, strictly. With <code>&lt;=</code> you would compute a[3]+a[3] and could return a bogus pair where one element is used twice.",
      },
      {
        title: "Hardest — duplicates, and every distinct pair wanted",
        input: "a = [1, 1, 2, 2, 3, 3], target = 4",
        cols: ["lo", "hi", "sum", "action"],
        rows: [
          ["0", "5", "1 + 3 = 4", "record (1,3) → then skip dups on BOTH sides"],
          ["2", "3", "2 + 2 = 4", "record (2,2) → advance both"],
          ["3", "2", "—", "crossed → done. output: (1,3), (2,2)"],
        ],
        lesson: "Advancing only one pointer after a hit re-emits (1,3) three more times. Both sides must skip their duplicate runs — this is exactly the dedup logic 3Sum needs.",
      },
    ],
  },

  "Sliding window with counts": {
    edges: [
      { input: "Empty string", effect: "The loop body never runs; best stays 0.", fix: "Confirm 0 is the intended answer for <code>\"\"</code> rather than assuming." },
      { input: "k larger than the string", effect: "The window never becomes invalid, so it never shrinks — the answer is the whole string.", fix: "Usually correct. For fixed-size windows, clamp k and decide what the answer means." },
      { input: "All identical characters", effect: "For 'no repeats', every window of size 2 is invalid, so the answer is 1.", fix: "Verify left jumps rather than creeps: <code>left = seen[ch] + 1</code>, not <code>left += 1</code>." },
      { input: "Negative numbers with a sum constraint", effect: "Sliding window is <b>invalid</b> — adding a negative can make an invalid window valid, so shrinking is unsound. Returns a wrong answer confidently.", fix: "Prefix sums + monotonic deque (LC 862). This is the single most important limit of the technique." },
      { input: "Duplicate characters outside the current window", effect: "<code>seen[ch]</code> holds a stale index from before left; jumping to it moves left backwards.", fix: "Guard with <code>seen[ch] >= left</code>. Without it the window can grow past a repeat." },
    ],
    walk: [
      {
        title: "Simple — longest substring with no repeats",
        input: "s = \"abca\"",
        cols: ["right", "ch", "seen", "left", "window", "best"],
        rows: [
          ["0", "a", "{a:0}", "0", "\"a\"", "1"],
          ["1", "b", "{a:0, b:1}", "0", "\"ab\"", "2"],
          ["2", "c", "{a:0, b:1, c:2}", "0", "\"abc\"", "3"],
          ["3", "a", "{a:3, b:1, c:2}", "1", "\"bca\"", "3"],
        ],
        lesson: "At right = 3 the repeat 'a' was last seen at 0, which is ≥ left, so left jumps to 1. It does not creep — jumping is what keeps the total moves at 2n.",
      },
      {
        title: "Harder — the stale-index trap",
        input: "s = \"abba\"",
        cols: ["right", "ch", "last seen", "≥ left?", "left", "best"],
        rows: [
          ["0", "a", "—", "—", "0", "1"],
          ["1", "b", "—", "—", "0", "2"],
          ["2", "b", "1", "1 ≥ 0 yes", "2", "2"],
          ["3", "a", "0", "0 ≥ 2 <b>NO</b>", "2 (unchanged)", "2"],
        ],
        lesson: "At right = 3, 'a' was last seen at index 0 — but left is already past it, so that occurrence is outside the window and must be ignored. Drop the <code>>= left</code> guard and left moves backwards to 1, producing \"bba\" and the wrong answer 3.",
      },
      {
        title: "Hardest — where sliding window is simply wrong",
        input: "a = [2, -1, 2], target sum ≥ 3, want the shortest",
        cols: ["window", "sum", "valid?", "what a window would do"],
        rows: [
          ["[2]", "2", "no", "keep expanding"],
          ["[2,-1]", "1", "no", "keep expanding"],
          ["[2,-1,2]", "3", "yes", "try to shrink from the left…"],
          ["[-1,2]", "1", "no", "shrank and became invalid — but [2] earlier was also invalid"],
        ],
        lesson: "Shrinking assumes validity is monotone: once valid, staying valid until you remove too much. Negatives break that, so the window can never be trusted. The correct tool is prefix sums with a monotonic deque. Recognising this limit is worth more than the template itself.",
      },
    ],
  },

  "Binary search on the answer": {
    edges: [
      { input: "lo = hi initially", effect: "The loop never runs and returns lo — correct only if lo is genuinely achievable.", fix: "Set lo to a real lower bound, usually <code>max(a)</code>, not 0." },
      { input: "feasible() true for every x", effect: "Returns lo, the smallest budget. Correct.", fix: "Verify lo is achievable, or you return an impossible answer." },
      { input: "feasible() false for every x", effect: "Returns hi. If hi was arbitrary, the answer is meaningless.", fix: "Set hi to something provably sufficient — <code>sum(a)</code> for splitting problems." },
      { input: "Non-monotone predicate", effect: "Binary search converges to a confident wrong answer. No crash, no warning.", fix: "Prove monotonicity before writing the loop. If you cannot, the technique does not apply." },
      { input: "Float answer", effect: "<code>while lo &lt; hi</code> may never terminate — floats between lo and hi are unbounded.", fix: "Loop a fixed ~100 times, or until <code>hi - lo &lt; eps</code>." },
      { input: "mid overflow", effect: "<code>(lo+hi)/2</code> overflows when both are near INT_MAX.", fix: "<code>lo + (hi-lo)/2</code>." },
    ],
    walk: [
      {
        title: "Simple — split [7,2,5,10,8] into 2 parts, minimise the largest sum",
        input: "lo = max = 10, hi = sum = 32",
        cols: ["lo", "hi", "mid", "feasible(mid)?", "action"],
        rows: [
          ["10", "32", "21", "yes: [7,2,5] = 14, [10,8] = 18 → 2 parts", "hi = 21"],
          ["10", "21", "15", "yes: [7,2,5] = 14, [10] , [8] → wait, 3 parts", "no → lo = 16"],
          ["16", "21", "18", "yes: [7,2,5] = 14, [10,8] = 18 → 2 parts", "hi = 18"],
          ["16", "18", "17", "no: [7,2,5]=14, [10]=10, [8] → 3 parts", "lo = 18"],
          ["18", "18", "—", "loop exits", "answer 18"],
        ],
        lesson: "The search space is the <em>answer</em> (a sum between 10 and 32), not the array. Five feasibility checks instead of trying every partition.",
      },
      {
        title: "Harder — why the bounds must be achievable",
        input: "same array, but lo set to 0 instead of max(a)",
        cols: ["lo", "hi", "mid", "feasible?", "problem"],
        rows: [
          ["0", "32", "16", "yes", "hi = 16"],
          ["0", "16", "8", "no — 10 alone exceeds 8", "lo = 9"],
          ["9", "16", "12", "no", "lo = 13"],
          ["13", "16", "14", "no", "lo = 15"],
          ["15", "16", "15", "no", "lo = 16 → returns 16"],
        ],
        lesson: "It still converges here, but only because feasible() correctly rejects budgets below max(a). If your feasibility check does not handle 'one element alone exceeds the budget', a lo of 0 makes it loop or return nonsense. Set lo = max(a) and the case cannot arise.",
      },
      {
        title: "Hardest — a predicate that is NOT monotone",
        input: "'find x where exactly 3 elements are ≤ x' on a = [1, 5, 5, 9]",
        cols: ["x", "count ≤ x", "predicate 'count == 3'"],
        rows: [
          ["1", "1", "false"],
          ["5", "3", "<b>true</b>"],
          ["7", "3", "<b>true</b>"],
          ["9", "4", "false"],
        ],
        lesson: "False, then true, then false. Binary search will land somewhere in that pattern and report it as the boundary, which is meaningless. The fix is to reframe as a monotone predicate — 'count ≤ x is at least 3' — then take the boundary. Always check the shape of your predicate before trusting the search.",
      },
    ],
  },

  "Monotonic stack": {
    edges: [
      { input: "Strictly decreasing input", effect: "Nothing ever pops during the scan; the stack holds all n indices and every answer is −1.", fix: "Correct. Confirm your post-loop handling leaves them as 'no next greater'." },
      { input: "Strictly increasing input", effect: "Every element pops the entire stack — still O(n) total because each index pops once.", fix: "This is the case that proves the amortised bound; use it to explain O(n)." },
      { input: "All equal values", effect: "With <code>&lt;</code> nothing pops (next-greater); with <code>&lt;=</code> everything pops (next-greater-or-equal).", fix: "Choose deliberately and say which the problem wants." },
      { input: "Storing values rather than indices", effect: "You cannot compute widths or distances, and window expiry becomes impossible.", fix: "Always push indices." },
      { input: "Empty input", effect: "The output array is empty; loops do not run.", fix: "Fine, but confirm the return type is right." },
      { input: "Histogram with a taller bar at the very end", effect: "Bars still on the stack at the end never get their width computed.", fix: "Append a sentinel 0, or drain the stack after the loop with width measured to n." },
    ],
    walk: [
      {
        title: "Simple — next greater element",
        input: "a = [2, 1, 3]",
        cols: ["i", "a[i]", "stack before", "pops", "stack after", "out"],
        rows: [
          ["0", "2", "[]", "—", "[0]", "[-1,-1,-1]"],
          ["1", "1", "[0]", "none (2 ≥ 1)", "[0,1]", "[-1,-1,-1]"],
          ["2", "3", "[0,1]", "pop 1 (1<3), pop 0 (2<3)", "[2]", "[3,3,-1]"],
        ],
        lesson: "3 resolves two pending answers in one step. Index 2 is left on the stack with no next greater, so it keeps −1.",
      },
      {
        title: "Harder — the amortised argument made visible",
        input: "a = [5, 4, 3, 2, 1, 9]",
        cols: ["i", "a[i]", "pops this step", "running total pops"],
        rows: [
          ["0–4", "5,4,3,2,1", "0 each (decreasing)", "0"],
          ["5", "9", "<b>5 pops</b> — the whole stack", "5"],
        ],
        lesson: "One step did 5 pops, which <em>looks</em> like the inner loop is O(n). But those 5 indices were each pushed exactly once and are now gone forever. Total pushes = 6, total pops ≤ 6, so total work is O(n). This is the argument to say out loud when asked why a nested loop is linear.",
      },
      {
        title: "Hardest — largest rectangle, where the sentinel matters",
        input: "heights = [2, 4]  (increasing, so nothing pops during the scan)",
        cols: ["i", "h", "stack", "area computed"],
        rows: [
          ["0", "2", "[0]", "none"],
          ["1", "4", "[0,1]", "none"],
          ["end", "—", "[0,1] still full", "<b>nothing computed — answer would be 0</b>"],
          ["sentinel 0", "0", "pop 1: h=4, w=1 → 4; pop 0: h=2, w=2 → 4", "max = 4"],
        ],
        lesson: "On increasing input the scan never pops, so without draining the stack afterwards you return 0 on a valid input. Either append a sentinel 0 or run an explicit drain loop with width measured to n. This is the most common histogram bug and it only shows on monotone inputs.",
      },
    ],
  },

  "0/1 knapsack": {
    edges: [
      { input: "target = 0", effect: "dp[0] = True immediately; the answer is 'yes, the empty subset'.", fix: "Confirm the problem accepts the empty subset." },
      { input: "Empty item list", effect: "Only dp[0] is reachable.", fix: "Correct — verify you do not index into an empty array." },
      { input: "An item heavier than the target", effect: "The inner loop <code>range(target, v-1, -1)</code> does not execute at all, so the item is skipped.", fix: "Correct by construction. Note it — it shows you understand the loop bound." },
      { input: "Loop direction ascending by mistake", effect: "Solves unbounded knapsack instead. Both compile; the samples often pass.", fix: "Descending for 0/1. Say the direction out loud before writing it." },
      { input: "Odd total sum in partition problems", effect: "No equal split can exist, but the DP still runs a full O(n·W) pass.", fix: "Early return if <code>sum % 2 != 0</code> — cheap and shows you thought about it." },
      { input: "Negative item values", effect: "Indices go negative; the capacity dimension is meaningless.", fix: "Offset the range, or state that the technique needs non-negative weights." },
    ],
    walk: [
      {
        title: "Simple — can [1,3] reach 4?",
        input: "nums = [1, 3], target = 4, dp over capacities 0..4",
        cols: ["step", "dp[0]", "dp[1]", "dp[2]", "dp[3]", "dp[4]"],
        rows: [
          ["init", "T", "F", "F", "F", "F"],
          ["item 1 (w↓)", "T", "<b>T</b>", "F", "F", "F"],
          ["item 3 (w↓)", "T", "T", "F", "<b>T</b>", "<b>T</b>"],
        ],
        lesson: "dp[4] became true via dp[4−3] = dp[1], which was set by the previous item. That is the 0/1 property: dp[1] predates item 3.",
      },
      {
        title: "Harder — why the loop must run DOWNWARDS",
        input: "nums = [3], target = 6, iterating capacity ASCENDING (the bug)",
        cols: ["w", "reads dp[w−3]", "value read", "dp[w] becomes", "problem"],
        rows: [
          ["3", "dp[0]", "T", "T", "correct — uses 3 once"],
          ["6", "dp[3]", "<b>T (just set!)</b>", "<b>T</b>", "used 3 TWICE"],
        ],
        lesson: "Ascending, dp[3] was already updated by this same item, so dp[6] reuses it. That is unbounded knapsack. Descending reads dp[3] from before the item existed, so each item is used at most once. One loop direction, two different problems.",
      },
      {
        title: "Hardest — partition [1,5,11,5] into equal halves",
        input: "sum = 22, so target = 11",
        cols: ["item", "newly reachable capacities"],
        rows: [
          ["init", "{0}"],
          ["1", "{0, 1}"],
          ["5", "{0, 1, 5, 6}"],
          ["11", "{0, 1, 5, 6, 11}  ← target hit"],
          ["5", "{0, 1, 5, 6, 10, 11}"],
        ],
        lesson: "Reachability grows as a set. The answer is yes because 11 appears — via the single item 11, but also via 1+5+5 on the last row. Tracking the set rather than the table is a good way to sanity-check your implementation by hand.",
      },
    ],
  },

  "BFS — shortest path, unweighted": {
    edges: [
      { input: "start == target", effect: "Returns 0 on the first dequeue.", fix: "Check before the loop too, in case the target test is inside the neighbour loop." },
      { input: "Target unreachable", effect: "The queue empties and you fall through.", fix: "Return −1 explicitly. Do not let the function fall off the end." },
      { input: "Marking visited on DEQUEUE", effect: "The same node is enqueued many times before it is first processed; on dense graphs this explodes.", fix: "Mark on ENQUEUE. The single most common BFS bug." },
      { input: "Disconnected graph", effect: "One BFS covers one component only.", fix: "Loop over all unvisited starts if you need every component." },
      { input: "Multi-source problem", effect: "Running BFS once per source is O(V·(V+E)) and times out.", fix: "Push every source at distance 0 before the loop — one BFS." },
      { input: "Grid with an out-of-bounds neighbour", effect: "Indexing before bounds-checking throws, or wraps to the wrong row.", fix: "Bounds-check first, then index — always that order." },
    ],
    walk: [
      {
        title: "Simple — a straight line",
        input: "s → a → b → t",
        cols: ["queue (node, d)", "dequeued", "enqueued", "seen"],
        rows: [
          ["[(s,0)]", "s, 0", "a", "{s, a}"],
          ["[(a,1)]", "a, 1", "b", "{s, a, b}"],
          ["[(b,2)]", "b, 2", "t", "{s, a, b, t}"],
          ["[(t,3)]", "t, 3", "—", "target → return 3"],
        ],
        lesson: "The queue holds one distance layer at a time. The first dequeue of t gives its final distance.",
      },
      {
        title: "Harder — two paths of different lengths",
        input: "s→t directly (1 edge) and s→a→b→t (3 edges)",
        cols: ["step", "queue", "note"],
        rows: [
          ["1", "[(s,0)]", "dequeue s, enqueue t at 1 and a at 1"],
          ["2", "[(t,1), (a,1)]", "dequeue t → <b>return 1</b>"],
          ["—", "—", "the 3-edge path is never explored"],
        ],
        lesson: "BFS finds the short path first because the queue is ordered by distance. It does not need to see the long path at all — that ordering is the entire proof of correctness, and it is why unit weights are required.",
      },
      {
        title: "Hardest — why marking on dequeue explodes",
        input: "a star: centre c connected to 4 leaves, all leaves connected to each other",
        cols: ["approach", "times each leaf is enqueued", "total queue operations"],
        rows: [
          ["mark on <b>enqueue</b>", "1", "O(V + E)"],
          ["mark on <b>dequeue</b>", "once per neighbour that runs first", "O(V·E) in the worst case"],
        ],
        lesson: "With marking-on-dequeue, a node can sit in the queue many times before its first pop, and each copy re-expands its neighbours. It still terminates and still gives the right distance, so tests pass on small inputs and TLE on large ones — the worst failure mode to debug.",
      },
    ],
  },
};

/** Everything, merged. Adding a topic file means adding one spread here. */
export const WALKS: Readonly<Record<string, Extra>> = {
  ...CORE_WALKS,
  ...WALKS_GRAPHS,
  ...WALKS_DP,
  ...WALKS_TREES,
  ...WALKS_STRUCTURES,
};

/** Merge onto the pattern list, failing loudly if a key stops matching a name. */
export function mergeWalks<T extends Pattern>(patterns: readonly T[]): T[] {
  const names = new Set(patterns.map((p) => p.n));
  const unmatched = Object.keys(WALKS).filter((k) => !names.has(k));
  if (unmatched.length) {
    throw new Error(`walks.ts references patterns that no longer exist: ${unmatched.join(", ")}`);
  }
  return patterns.map((p) => {
    const extra = WALKS[p.n];
    return extra ? { ...p, ...extra } : p;
  });
}
