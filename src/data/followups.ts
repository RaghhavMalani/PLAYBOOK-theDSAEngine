import type { Pattern } from "../types";

/**
 * The escalation layer for the core patterns.
 *
 * Solving the base problem is the entry fee. What separates outcomes in a Google or
 * Meta round is the next four minutes, when the interviewer starts removing your
 * assumptions one at a time. This maps pattern name -> the ladder they actually walk,
 * plus how to *derive* the pattern at a whiteboard and how to *justify* it when asked.
 *
 * Keyed by `Pattern.n`. Merged onto the core patterns at load; a name that stops
 * matching becomes a hard failure in the merge (see mergeFollowups) rather than
 * silently doing nothing.
 */
type Extra = Pick<Pattern, "derive" | "proof" | "followups">;

export const FOLLOWUPS: Readonly<Record<string, Extra>> = {
  "Sliding window with counts": {
    derive:
      "Start with the O(n²) double loop: for every left, extend right until the property breaks. Then notice that when you advance left by one, the right pointer never needs to go backwards — the window that was valid for the old left is still a starting point. Delete the reset of right and you have O(n).",
    proof:
      "Both pointers are monotonically non-decreasing and each is bounded by n, so at most 2n pointer moves happen in total. The technique is only <em>valid</em> when the property is monotone in the window: growing can only break it, shrinking can only fix it. State that condition explicitly — it is the thing that fails on the variant below.",
    followups: [
      { q: "Now the array can contain negative numbers and the constraint is 'sum ≥ k'.", a: "Sliding window breaks — adding a negative can make an invalid window valid again, so shrinking is no longer safe. Switch to prefix sums with a monotonic deque (LC 862), which is the honest answer and the one they are testing for." },
      { q: "At most k distinct characters instead of zero repeats.", a: "Same skeleton, different validity test: shrink while the map size exceeds k. The counter tracks distinct keys rather than a have/want match." },
      { q: "Return the count of valid windows, not the longest.", a: "For 'at most' properties, each right contributes (right - left + 1) windows. For 'exactly k', compute atMost(k) - atMost(k-1) — that subtraction trick is the whole problem in several LeetCode mediums." },
      { q: "The window must be a fixed size k.", a: "Drop the inner while entirely: add right, and once the window exceeds k, remove exactly one from the left. One in, one out, no shrink loop." },
    ],
  },

  "Two pointers, converging": {
    derive:
      "Brute force is every pair: O(n²). Sort, and then ask what sortedness buys you — if a[lo]+a[hi] is too small, then a[hi] is the largest partner a[lo] will ever get, so a[lo] can be discarded entirely rather than retried against smaller partners. That is an elimination, not a skip, and it is what makes the scan linear.",
    proof:
      "Loop invariant: every pair not yet examined lies strictly inside [lo, hi]. When the sum is too small, no pair (lo, j) for any j ≤ hi can reach the target, so removing lo loses no solution. Symmetrically for hi. Each step removes one index, so at most n steps.",
    followups: [
      { q: "Triplets summing to zero, no duplicates in the output.", a: "Sort, fix i, two-pointer the rest — O(n²). Dedup needs TWO skips: one on the pivot i, and one on lo after recording a hit. Missing the second is the most common 3Sum bug." },
      { q: "The array is not sorted and you need original indices.", a: "Sorting destroys them. Either sort (value, index) pairs, or use the hash-map complement approach which is O(n) and preserves indices naturally." },
      { q: "k-Sum for general k.", a: "Recurse: fix one index and solve (k-1)-Sum on the suffix, bottoming out at two pointers. O(n^(k-1)). Say the complexity out loud so they know you understand the cost of each extra level." },
      { q: "Count pairs with sum less than target.", a: "When a[lo]+a[hi] < target, every j in (lo, hi] also works, so add (hi - lo) and advance lo. Counting in bulk rather than one at a time keeps it O(n)." },
    ],
  },

  "Binary search on the answer": {
    derive:
      "You are told to minimise a maximum, and there is no sorted array anywhere — that is the disguise. Ask the inverse question instead: 'given a specific budget x, is the task feasible?' That is usually a simple linear greedy. If feasible is monotone in x, the answer is the boundary, and boundaries are found by binary search. The reframe from optimise to verify is the entire technique.",
    proof:
      "Requires feasible(x) to be monotone: false for every x below a threshold, true for every x at or above it. Then the predicate partitions the search space into exactly two runs and the standard lower-bound invariant applies. If monotonicity fails, binary search returns a confident wrong answer — so verify it, do not assume it.",
    followups: [
      { q: "Prove your feasibility check is monotone.", a: "For capacity-style problems: any schedule valid at budget x is still valid at x+1, since every constraint is an upper bound. State that implication — it is the proof." },
      { q: "The answer is a real number, not an integer.", a: "Binary search on doubles for a fixed ~100 iterations, or until the interval is under the required epsilon. Do not loop on `lo < hi` with floats — it may never terminate." },
      { q: "Minimise the maximum AND report the partition.", a: "Run the search to find the optimal x, then run the greedy once more at that x, recording the splits. Reconstruct after, never during." },
      { q: "feasible() itself is O(n log n).", a: "Total becomes O(n log n log range). Usually still fine, but say the number: with n=10⁵ and range 10⁹, that is roughly 10⁵ · 17 · 30 ≈ 5·10⁷, which is acceptable in C++ and marginal in Python." },
    ],
  },

  "Monotonic stack": {
    derive:
      "Brute force: for each i, scan right until you find something bigger — O(n²) on a decreasing array. Then notice the scan repeatedly walks over elements that can never be an answer for anyone: if a[j] < a[k] and j < k, then a[j] is useless to everyone to the right of k. So keep only the useful candidates, which by that argument form a decreasing sequence — a stack.",
    proof:
      "Amortised counting: each index is pushed exactly once and popped at most once, so the inner while loop runs at most n times across the whole outer loop. That gives O(n) despite the nested structure. The stack invariant is that values are strictly decreasing from bottom to top, which is what makes the top the nearest useful candidate.",
    followups: [
      { q: "Largest rectangle in a histogram.", a: "For each bar, find the nearest strictly smaller bar on each side — two monotonic stack passes, or one pass where the width is computed at pop time. The subtlety is equal heights: pick < or <= deliberately, and note that either works if you allow one side to be non-strict." },
      { q: "Trapping rain water.", a: "Two-pointer O(1) space is cleaner here than the stack, since water level at i is min(maxLeft, maxRight) - height[i]. Mention both and say which you'd write." },
      { q: "Sliding window maximum.", a: "Monotonic deque, not stack — you also need to evict from the front when indices leave the window. Store indices so expiry is testable." },
      { q: "Sum of subarray minimums over all subarrays.", a: "For each element, count how many subarrays it is the minimum of: (i - prevSmaller) · (nextSmaller - i). Handle ties by making one side strict and the other not, or you double count." },
    ],
  },

  "BFS — shortest path, unweighted": {
    derive:
      "Try DFS first and notice it finds *a* path, not the shortest. The fix is to expand in order of distance, which means a queue instead of a stack. That one data-structure swap is the whole difference, and it is worth saying out loud because it shows you know why BFS works rather than that BFS is the BFS answer.",
    proof:
      "Induction on distance: the queue always holds nodes at distance d then d+1 and never anything further, so the first time a node is dequeued its recorded distance is minimal. This depends on every edge having equal weight — the moment weights differ, the queue is no longer sorted by distance and you need Dijkstra.",
    followups: [
      { q: "Multiple starting points.", a: "Push all sources into the queue at distance 0 before the loop. One BFS, not one per source — running it per source is O(n²) and times out on rotting-oranges style problems." },
      { q: "Edges cost either 0 or 1.", a: "0-1 BFS with a deque: push_front for 0-weight edges, push_back for 1-weight. O(V+E), no heap, no log factor." },
      { q: "Find the shortest path itself, not its length.", a: "Store a parent pointer per node when you enqueue it, then walk back from the target. O(V) extra memory, and it does not change the traversal." },
      { q: "Bidirectional search?", a: "Run BFS from both ends and stop when the frontiers meet — roughly O(b^(d/2)) instead of O(b^d). Worth mentioning for word-ladder problems; the bookkeeping is fiddly so only claim it if you can write it." },
    ],
  },

  "Dijkstra (weighted shortest path)": {
    derive:
      "BFS fails on weighted graphs because the queue is no longer ordered by distance. Replace the queue with a priority queue ordered by distance and the same argument works again. That is literally all Dijkstra is — BFS with the queue swapped for a heap.",
    proof:
      "Exchange argument on the greedy choice: when you pop the minimum-distance unfinalised node u, any alternative path to u must pass through some unfinalised node v with dist[v] ≥ dist[u], and edges are non-negative, so that path cannot be shorter. Non-negativity is load-bearing — with a negative edge the popped distance is no longer final and the algorithm is simply wrong.",
    followups: [
      { q: "There are negative edges.", a: "Dijkstra is invalid, not just slow. Bellman-Ford in O(V·E), which also detects negative cycles. If there are negative edges but no negative cycles and you need all pairs, Johnson's reweighting." },
      { q: "At most k stops allowed.", a: "Add k to the state: dist[node][stops]. Or use Bellman-Ford relaxed exactly k+1 times, which is cleaner for LC 787 and avoids a heap keyed on two dimensions." },
      { q: "Why skip stale heap entries?", a: "The lazy version pushes a node once per improvement, so the heap can hold O(E) entries. Without `if d > dist[u]: continue` you re-expand finalised nodes and the complexity bound breaks." },
      { q: "Maximise the minimum edge on a path instead.", a: "Same skeleton, different relaxation: the path cost is min of edges and you maximise it, so use a max-heap and relax with min(). This is 'path with minimum effort' and it shows the pattern generalises to any monotone path function." },
    ],
  },

  "Union-Find (DSU)": {
    derive:
      "Start with 'are these two connected' answered by a BFS each time: O(V+E) per query. Then notice you only need the component <em>identity</em>, not the path. So store one representative per component, and the only hard part is keeping the lookup cheap — which is what path compression and union by rank do.",
    proof:
      "With both path compression and union by rank the amortised cost per operation is O(α(n)), the inverse Ackermann function, which is under 5 for any n that fits in memory. With only one of the two optimisations it degrades to O(log n); with neither, to O(n). This is why 'I'd add both' is the correct thing to say rather than a detail.",
    followups: [
      { q: "Detect a cycle while adding edges.", a: "union() returning false means the endpoints were already connected, so this edge closes a cycle. That is the entire 'redundant connection' problem." },
      { q: "Support undo / rollback.", a: "Drop path compression (it destroys history) and keep union by rank with a stack of the parent changes. O(log n) per op, but rollback becomes O(1). This is the basis of offline dynamic connectivity." },
      { q: "Track component sizes or counts.", a: "Keep a size array updated in union, and a running component count decremented on every successful union. Both are O(1) additions and most DSU problems need one of them." },
      { q: "Weighted / bipartite union-find.", a: "Store a parity or offset relative to the parent and combine it during compression. This solves 'are these two in opposite groups' and equation-satisfiability problems." },
    ],
  },

  "0/1 knapsack": {
    derive:
      "Start from the recursion: at each item, take it or skip it — O(2ⁿ). Memoise on (index, remaining capacity) and it becomes O(n·W). Then notice row i only reads row i-1, so collapse to one array — and to keep 'each item once', iterate capacity <em>downwards</em> so you read values that predate this item.",
    proof:
      "The loop direction <em>is</em> the correctness argument. Descending capacity means dp[w - v] still holds the value from before this item was considered, so the item is used at most once. Ascending capacity reads a value that may already include this item, which is exactly the unbounded-knapsack recurrence. Both are correct programs; they solve different problems.",
    followups: [
      { q: "Unlimited copies of each item.", a: "Iterate capacity ascending. One character of difference, entirely different problem — and worth naming explicitly so they know it is deliberate." },
      { q: "Reconstruct which items were chosen.", a: "Keep the 2D table (you cannot recover choices from the rolled 1D version) and walk backwards: if dp[i][w] != dp[i-1][w], item i was taken. O(n·W) memory is the price of the answer." },
      { q: "W is 10⁹ but n is 100.", a: "Flip the DP: index by achievable value instead of capacity, dp[value] = minimum weight. Works when values are small even though weights are not." },
      { q: "Exactly k items.", a: "Add a dimension: dp[k][w]. Initialise dp[0][0]=0 and everything else to -infinity so 'unreachable' is distinguishable from 'zero value'." },
    ],
  },

  "Longest increasing subsequence": {
    derive:
      "The O(n²) DP is immediate: dp[i] = 1 + max over j<i with a[j]<a[i]. To beat it, ask what that inner max actually needs — only the smallest tail achievable for each length. Keep that as an array, notice it is always sorted, and the inner scan becomes a binary search.",
    proof:
      "tails[k] = the minimum possible tail of any increasing subsequence of length k+1. It is sorted because a longer subsequence cannot have a smaller tail than a shorter one built from its prefix. Replacing the first element ≥ v keeps every invariant and can only lower a tail, which never hurts a future extension — so the length is exact even though the array itself is not a valid subsequence.",
    followups: [
      { q: "Reconstruct the actual subsequence.", a: "Store, for each element, the index it was placed at plus a parent pointer to the previous tail's owner. Then walk back from the last placement. tails alone cannot be printed — that is the trap." },
      { q: "Non-strictly increasing.", a: "bisect_right instead of bisect_left. One function call, and getting it backwards silently changes the answer on inputs with duplicates." },
      { q: "Longest increasing subsequence in 2D — Russian doll envelopes.", a: "Sort by width ascending and by height DESCENDING on ties, then LIS on heights. The descending tie-break is what prevents two envelopes of equal width both being used." },
      { q: "Longest bitonic subsequence.", a: "LIS from the left and LIS from the right, then combine at each index. Two passes of the same routine." },
    ],
  },

  "Bounded heap for top-k": {
    derive:
      "Sorting gives the answer in O(n log n) but answers far more than was asked — you get the full order when you needed k elements. So keep only k candidates: a heap of size k, evicting the weakest whenever it overflows. O(n log k). If you may mutate the input, quickselect partitions to the k-th boundary and gives O(n) expected.",
    proof:
      "Invariant: the heap always holds the k best elements seen so far. When element v arrives and the heap is full, either v is worse than the current weakest survivor — discard it, and it can never be in the top k of a superset — or it is better, so evicting the weakest preserves the invariant. Induction over the stream.",
    followups: [
      { q: "Which heap for the k-th largest?", a: "A MIN-heap of size k, so the weakest survivor sits on top and is the one evicted. Getting this backwards is the classic slip. Java's PriorityQueue is a min-heap by default; C++'s priority_queue is a max-heap by default." },
      { q: "The data is a stream and k is fixed.", a: "This is already the streaming solution — O(log k) per element, O(k) memory, never needs the whole input. Say that, because it is why bounded heaps exist." },
      { q: "Get true O(n).", a: "Quickselect with a randomised pivot: expected O(n), worst case O(n²). Introselect (falling back to median-of-medians) gives worst-case O(n). Requires mutating the input and does not stream." },
      { q: "Top k most frequent, k close to n.", a: "At that point sorting the counts is simpler and the log factor is irrelevant. Bucket sort by frequency gives O(n) since frequencies are bounded by n — worth mentioning as the linear-time answer." },
    ],
  },

  "Bottom-up subtree aggregate": {
    derive:
      "The naive version computes height at every node from scratch: O(n²) on a skewed tree. Then notice each node's height needs only its children's heights, which the post-order recursion has already computed. So return the local value up the tree and record the global answer on the way — one traversal does both.",
    proof:
      "Induction on subtree height, with leaves as the base case. The reason it is O(n) rather than O(n²) is that each node is visited exactly once and does O(children) work, and the sum of children over all nodes is n-1 edges.",
    followups: [
      { q: "Diameter — what do you return versus record?", a: "Return the height; record height(left)+height(right). Returning the diameter itself is the classic wrong answer, because a parent cannot combine children's diameters into its own." },
      { q: "Maximum path sum with negative values.", a: "Clamp each child's contribution at zero — max(0, childSum) — so a negative subtree is dropped rather than dragging the path down. The recorded global still considers the node alone." },
      { q: "Balanced-tree check in one pass.", a: "Return -1 as a sentinel for 'already unbalanced' and short-circuit upward, instead of computing height and balance in two separate traversals." },
      { q: "The tree is 10⁵ deep and skewed.", a: "Recursion dies — Python's default limit is 1000 and the JVM stack will overflow. Convert to an explicit stack, or process nodes in reverse BFS order, which is a valid post-order for free." },
    ],
  },

  "Cyclic sort (index as hash)": {
    derive:
      "The obvious solutions use O(n) extra space: a hash set, or a boolean array. To get O(1), ask what resource you already have — the array itself, whose indices span the same range as its values. So make position i own value i+1, and any mismatch after the pass is the answer.",
    proof:
      "Each swap places at least one value at its final index, and a placed value is never moved again, so there are at most n swaps and the loop is O(n) despite not advancing i every iteration. The guard must compare <em>values</em> (a[i] != a[j]) rather than indices, or two equal values swap forever.",
    followups: [
      { q: "First missing POSITIVE, with negatives and values above n present.", a: "Ignore anything outside [1, n] — it cannot be the answer, since the answer is at most n+1. That bound is the insight; the rest is the same loop." },
      { q: "Find the duplicate without modifying the array.", a: "Floyd's cycle detection over the implicit function i -> a[i]. O(1) space and read-only, which is what LC 287 is really testing." },
      { q: "Find all duplicates and all missing.", a: "Same pass, then collect every index where a[i] != i+1 — a[i] is a duplicate and i+1 is missing. One traversal gives both lists." },
      { q: "Values are 0..n instead of 1..n.", a: "Shift the mapping to j = a[i] and check a[i] != a[j]. Off-by-one here is the entire bug surface, so state the mapping before you write the loop." },
    ],
  },
};

/**
 * Merge the escalation layer onto the core patterns.
 *
 * Throws on an unmatched key rather than silently skipping. A pattern rename would
 * otherwise quietly drop its follow-ups, which is exactly the kind of drift the
 * typed data layer exists to prevent.
 */
export function mergeFollowups(core: readonly Pattern[]): Pattern[] {
  const names = new Set(core.map((p) => p.n));
  const unmatched = Object.keys(FOLLOWUPS).filter((k) => !names.has(k));
  if (unmatched.length) {
    throw new Error(
      `followups.ts references patterns that no longer exist: ${unmatched.join(", ")}. ` +
        `Rename the key or remove the entry.`,
    );
  }
  return core.map((p) => {
    const extra = FOLLOWUPS[p.n];
    return extra ? { ...p, tier: p.tier ?? "core", ...extra } : { ...p, tier: p.tier ?? "core" };
  });
}
