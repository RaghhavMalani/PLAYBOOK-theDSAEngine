/**
 * Zero to a hard OA.
 *
 * Everything else here assumes you already know what a hash map is. This does not.
 * It is an ordered path with explicit prerequisites, so someone starting from "I can
 * write a for loop" has a route rather than a pile of 63 patterns and no entry point.
 *
 * The ordering is not arbitrary. Each rung exists because the next one is unlearnable
 * without it — you cannot understand why a sliding window is O(n) until you can
 * reason about amortisation, and you cannot derive a DP recurrence until recursion
 * is automatic. Skipping ahead produces someone who can recite templates and cannot
 * adapt them, which is exactly what a hard OA is designed to detect.
 */

export interface Rung {
  n: number;
  /** short title */
  title: string;
  /** the honest gate: what you must already be able to do */
  before: string;
  /** what you are actually learning, in plain language */
  learn: string;
  /** why this unlocks the next rung — the load-bearing reason for the ordering */
  unlocks: string;
  /** concrete, checkable */
  done: string;
  /** topic ids to filter the pattern index to */
  topics: string[];
  /** rough time for someone starting cold */
  hours: string;
  /** which stage of an OA this gets you through */
  reaches: string;
}

export const LADDER: readonly Rung[] = [
  {
    n: 1,
    title: "Read code before you write it",
    before: "You can write a for loop and an if statement in one language.",
    learn:
      "Trace code by hand. Given ten lines and an input, produce the output on paper without running it. Learn what an array index actually is (an offset from a base address), what a variable holds, and what changes when you assign.",
    unlocks:
      "Every later rung is debugging. If you cannot predict what your own code does, you cannot fix it under a clock — you can only guess and re-run, and an OA gives you neither the time nor the compiler.",
    done: "You can predict the output of an unfamiliar 15-line loop, correctly, on paper, three times running.",
    topics: [],
    hours: "6–10",
    reaches: "Nothing yet. This is the floor.",
  },
  {
    n: 2,
    title: "Complexity as a habit, not a subject",
    before: "Rung 1 — you can trace an unfamiliar loop on paper and get the right answer.",
    learn:
      "Count operations. Recognise that a nested loop over the same array is n², that halving repeatedly is log n, and that <code>n ≤ 10⁵</code> in a problem statement is the interviewer telling you the intended answer is O(n log n) or better. Learn the constraint→complexity table by heart.",
    unlocks:
      "It converts problem statements into instructions. Once you read constraints first, most problems announce their own solution shape before you have thought about them at all.",
    done: "Given any constraint, you can name the target complexity in under five seconds — and given any loop nest, you can name its complexity without hesitating.",
    topics: [],
    hours: "4–6",
    reaches: "You stop writing solutions that were never going to pass.",
  },
  {
    n: 3,
    title: "Arrays and the pointer disciplines",
    before: "Rungs 1–2. You can name the complexity of a loop nest without pausing to think about it.",
    learn:
      "Two pointers converging, the read/write compaction pointer, and prefix sums. The idea underneath all three: maintain indices with a rule about when each may move, plus an argument for why they never move backwards.",
    unlocks:
      "Sliding window is this plus one more condition. Binary search is this plus monotonicity. Almost every array technique is a variation on pointer discipline, so this is the rung with the highest leverage in the whole ladder.",
    done: "You can write converging two pointers and in-place compaction from memory, and explain why each index is <em>eliminated</em> rather than merely skipped.",
    topics: ["arr"],
    hours: "10–14",
    reaches: "The easy problem in almost any OA.",
  },
  {
    n: 4,
    title: "Hashing — the first real superpower",
    before: "Rung 3. Two pointers must be something you write, not something you look up.",
    learn:
      "A hash map turns 'have I seen this?' from an O(n) scan into O(1). Learn to spot the membership question hiding inside a problem: two-sum is 'have I seen the complement', anagrams is 'do these multisets match', subarray-sum-equals-k is two-sum on prefix sums.",
    unlocks:
      "It removes a factor of n from an enormous class of problems, and it is the first time you will convert an O(n²) brute force into O(n) by <em>reframing</em> rather than optimising. That reframing move is the core interview skill.",
    done: "Given a nested-loop solution, you can spot whether the inner loop is a membership test and remove it.",
    topics: ["hash"],
    hours: "8–12",
    reaches: "Most easy and many medium OA problems.",
  },
  {
    n: 5,
    title: "Sliding window and binary search",
    before: "Rungs 3–4. Do not attempt before pointer discipline is automatic.",
    learn:
      "Sliding window for contiguous ranges with a monotone property. Binary search in both templates — first-true and last-true — and, more importantly, binary search on the <em>answer</em> rather than on an array.",
    unlocks:
      "These two cover a large slice of the medium band. Binary-search-on-answer in particular is the first technique where you invent the search space rather than being handed it, which is a mental move you will reuse in DP.",
    done: "You can write both binary search templates cold and say why the ceiling midpoint is mandatory in one of them. You can state the condition under which sliding window is invalid.",
    topics: ["bs"],
    hours: "10–14",
    reaches: "The medium problem in most OAs.",
  },
  {
    n: 6,
    title: "Recursion until it stops feeling like magic",
    before: "Rungs 1–5 — and sliding window in particular should already feel routine, because recursion is hard enough without a second unfamiliar idea beside it.",
    learn:
      "Write recursion where you trust the recursive call without tracing into it. Learn the three positions — before the children, between them, after them — and what each is for. Draw the call stack by hand until you do not need to.",
    unlocks:
      "Trees are recursion. Backtracking is recursion with an undo. DP is recursion with a cache. Graph DFS is recursion with a visited set. This single rung is the prerequisite for four topics, which is why it comes before all of them.",
    done: "You can write a recursive function, predict its call stack depth, and convert a simple one to iteration with an explicit stack.",
    topics: [],
    hours: "10–16",
    reaches: "Nothing directly — it is the gate to everything after.",
  },
  {
    n: 7,
    title: "Trees, stacks and queues",
    before: "Rung 6. Recursion must be comfortable, not merely survivable.",
    learn:
      "The four traversals and which to use when. BFS with the level snapshot. The bottom-up post-order aggregate, where a node's answer needs its children's. Monotonic stacks for next-greater problems.",
    unlocks:
      "BFS on a tree is BFS on a graph with the visited set removed, so this is graphs with training wheels. The bottom-up aggregate is DP on a tree, so it is also DP with training wheels.",
    done: "You can pick pre/in/post from the problem statement without trying all three, and explain why a monotonic stack is O(n) despite the inner loop.",
    topics: ["tree", "stk"],
    hours: "14–20",
    reaches: "A solid medium bar. Most service-company OAs are now comfortably in range.",
  },
  {
    n: 8,
    title: "Graphs",
    before: "Rungs 6–7. You can write a tree traversal from memory and predict its stack depth. A graph is a tree that is allowed to revisit, so the traversal must be automatic before the revisiting is added.",
    learn:
      "Recognise that a grid, a word list and a set of prerequisites are all graphs. BFS for unweighted shortest paths, DFS for connectivity, topological sort for ordering and cycle detection, union-find for incremental connectivity, Dijkstra for weights.",
    unlocks:
      "Half the hard problems in a product-company OA are graph problems wearing a costume. The skill is naming the nodes and edges — after that the algorithm is usually the obvious one.",
    done: "Given a problem with no graph in it, you can identify the nodes and edges. You know why visited is marked on enqueue, and why Dijkstra is wrong with negative weights.",
    topics: ["graph"],
    hours: "18–25",
    reaches: "The hard problem in a product-company OA.",
  },
  {
    n: 9,
    title: "Dynamic programming — the six shapes",
    before: "Rung 6, absolutely. DP before recursion is fluent is wasted time.",
    learn:
      "Do not learn 'DP'. Learn six shapes: 1D linear, 0/1 knapsack, unbounded, LIS, grid, two-sequence. For each, write the brute-force recursion first, notice the repeated arguments, add a cache, then reverse the order to get bottom-up.",
    unlocks:
      "DP is the topic that most separates outcomes at Google and Meta, and the method — brute force, then find the state, then cache — is the same method you will use on a problem you have never seen.",
    done: "Given a new problem you can name which of the six shapes it is, or say honestly that it is none of them. You can explain why the knapsack loop direction changes the problem.",
    topics: ["dp"],
    hours: "25–35",
    reaches: "Most of what a hard OA throws at you.",
  },
  {
    n: 10,
    title: "Backtracking, greedy, heaps and bits",
    before: "Rungs 6–9. These four fill the gaps the big topics leave, which makes them worth the least until the big topics are genuinely solid.",
    learn:
      "Backtracking as choose/recurse/un-choose with duplicate pruning. Greedy as a <em>proof</em> technique — the code is trivial, the exchange argument is the work. Bounded heaps for top-k. Bit tricks and the constraint <code>n ≤ 20</code> meaning bitmask.",
    unlocks:
      "These fill the gaps. Greedy in particular is where confident wrong answers live, so learning to demand a justification before committing is worth more than the templates.",
    done: "You can state an exchange argument for a greedy choice, or recognise that you cannot and reach for DP instead.",
    topics: ["bt", "greedy", "heap", "bit"],
    hours: "20–28",
    reaches: "Effectively the whole medium band, plus much of the hard one.",
  },
  {
    n: 11,
    title: "The hard tier",
    before: "Rungs 1–10, with graphs and DP genuinely solid rather than recently read.",
    learn:
      "Segment trees and Fenwick trees for range queries with updates. Tarjan for SCCs and bridges. Tree DP with rerooting. Digit DP. DP over subsets. Z-function. Matrix exponentiation. Meet in the middle.",
    unlocks:
      "Nothing further — this is the ceiling for interview preparation. These appear in Goldman-style long-format OAs, ICPC-flavoured rounds, and the hardest Google follow-ups.",
    done: "You can derive each from its brute force rather than recalling it, and state the proof sketch when asked to justify.",
    topics: [],
    hours: "30–50",
    reaches: "The hardest assessment you are likely to sit.",
  },
];

/** Cumulative hours, for the honest total at the top of the page. */
export function ladderHours(): { low: number; high: number } {
  let low = 0, high = 0;
  for (const r of LADDER) {
    const [a, b] = r.hours.split("–").map((x) => parseInt(x, 10));
    low += a ?? 0;
    high += b ?? a ?? 0;
  }
  return { low, high };
}
