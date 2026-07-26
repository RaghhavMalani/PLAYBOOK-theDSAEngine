import type { TopicPrimer } from "../types";

const S = {
  cell: (x: number, y: number, w: number, h: number, fill: string, stroke: string) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`,
  txt: (x: number, y: number, t: string, fill = "var(--txt)", size = 11, anchor = "middle") =>
    `<text x="${x}" y="${y}" fill="${fill}" font-family="var(--mono)" font-size="${size}" text-anchor="${anchor}">${t}</text>`,
  line: (x1: number, y1: number, x2: number, y2: number, stroke: string, dash = "") =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1.4"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`,
};
const DIM = "var(--line2)";
const PANEL = "var(--panel2)";

export const PRIMERS_B: readonly TopicPrimer[] = [
  /* ============================== HEAPS ============================== */
  {
    id: "heap",
    oneLine: "A tree that keeps only one promise — the smallest (or largest) element is on top — and is therefore much cheaper than sorting.",
    model:
      "A binary heap is a complete binary tree stored in a flat array: the children of index i live at 2i+1 and 2i+2. The only invariant is that a parent beats both children. It does <em>not</em> keep siblings ordered, and that laziness is exactly why insert and extract are O(log n) instead of O(n).\n\nThe interview insight is that <b>sorting answers more than most questions ask</b>. If you need the k largest, you do not need the other n−k in order. A heap bounded at size k gives you O(n log k), which is effectively linear for small k — and it streams, so it works when the data does not fit in memory.\n\nThe second use is as a <b>priority queue for search</b>: Dijkstra, A*, merge-k-sorted, and 'always process the cheapest pending thing' all reduce to repeatedly extracting the minimum.",
    invariant:
      "Every parent compares favourably to both children. Nothing else is guaranteed — in particular a heap is <em>not</em> sorted, and iterating the backing array gives you no useful order.",
    ops: [
      ["peek min / max", "O(1)", "it is just index 0"],
      ["push", "O(log n)", "sift up"],
      ["pop", "O(log n)", "move last to root, sift down"],
      ["build from an array", "O(n)", "heapify bottom-up — NOT n log n"],
      ["top k from n", "O(n log k)", "bounded heap; the point of the structure"],
      ["k-th largest via quickselect", "O(n) expected", "faster, but mutates and does not stream"],
      ["search for an arbitrary value", "O(n)", "no structure to exploit — use a map"],
      ["decrease-key", "O(log n) or unsupported", "usually simulated by pushing a duplicate"],
    ],
    reach: [
      "Top k, k-th largest, k closest — anything needing partial order",
      "A running median (two heaps facing each other)",
      "Merging k sorted sequences",
      "Dijkstra and any 'process cheapest next' search",
      "Scheduling by deadline or priority",
    ],
    avoid: [
      "You need the whole thing sorted → just sort, it is one call",
      "You need to search or delete arbitrary elements → map, or a heap plus lazy deletion",
      "k is close to n → sorting is simpler and the log factor is irrelevant",
      "A monotonic deque would do (sliding window max) → the heap adds a needless log",
    ],
    edges: [
      { input: "k > n", effect: "The heap never fills; <code>heap[0]</code> is not the k-th anything.", fix: "Clamp k, or decide what the answer means and say so." },
      { input: "k = 0", effect: "Empty heap; <code>peek()</code> throws.", fix: "Return early, before the loop. Decide whether k=0 means an empty result or is invalid input, and say which — the interviewer is checking that you noticed." },
      { input: "Wrong heap direction", effect: "For k-th LARGEST you need a MIN-heap so the weakest survivor is evicted. Getting it backwards returns the k-th smallest.", fix: "Say the direction out loud before coding. Java's PriorityQueue is min by default; C++'s priority_queue is MAX by default." },
      { input: "Equal priorities", effect: "Python raises <code>TypeError</code> comparing the payload when the priorities tie.", fix: "Push a tuple with a tiebreaker: <code>(priority, counter, item)</code>." },
      { input: "Duplicates in a two-heap median", effect: "Pushing to whichever side 'looks right' breaks the size invariant.", fix: "Always push through one heap and pop across, then rebalance." },
      { input: "Stale entries (Dijkstra)", effect: "A node is pushed several times; re-expanding a finalised node breaks the complexity bound.", fix: "<code>if d > dist[u]: continue</code> — skip stale pops." },
    ],
    caption: "A min-heap as an array. Parent at i, children at 2i+1 and 2i+2. Siblings are unordered — that is the laziness that buys O(log n).",
    svg: `<svg viewBox="0 0 640 220" xmlns="http://www.w3.org/2000/svg">
  ${S.line(300, 46, 200, 92, DIM)}${S.line(300, 46, 400, 92, DIM)}
  ${S.line(200, 114, 140, 154, DIM)}${S.line(200, 114, 258, 154, DIM)}
  ${S.line(400, 114, 460, 154, DIM)}
  <circle cx="300" cy="34" r="19" fill="rgba(91,255,165,.14)" stroke="var(--lime)" stroke-width="1.4"/>${S.txt(300, 39, "1", "var(--lime)", 12)}
  <circle cx="200" cy="102" r="19" fill="${PANEL}" stroke="${DIM}" stroke-width="1.4"/>${S.txt(200, 107, "3", "var(--txt)", 12)}
  <circle cx="400" cy="102" r="19" fill="${PANEL}" stroke="${DIM}" stroke-width="1.4"/>${S.txt(400, 107, "2", "var(--txt)", 12)}
  <circle cx="140" cy="166" r="19" fill="${PANEL}" stroke="${DIM}" stroke-width="1.4"/>${S.txt(140, 171, "7", "var(--txt)", 12)}
  <circle cx="258" cy="166" r="19" fill="${PANEL}" stroke="${DIM}" stroke-width="1.4"/>${S.txt(258, 171, "5", "var(--txt)", 12)}
  <circle cx="460" cy="166" r="19" fill="${PANEL}" stroke="${DIM}" stroke-width="1.4"/>${S.txt(460, 171, "4", "var(--txt)", 12)}
  ${S.txt(330, 30, "min on top", "var(--lime)", 9, "start")}
  ${S.txt(430, 100, "2 < 3, but they are", "var(--amb)", 9, "start")}
  ${S.txt(430, 112, "siblings — unordered", "var(--amb)", 9, "start")}

  ${[1, 3, 2, 7, 5, 4].map((v, i) =>
    S.cell(20 + i * 40, 196, 34, 20, i === 0 ? "rgba(91,255,165,.14)" : PANEL, i === 0 ? "var(--lime)" : DIM) +
    S.txt(37 + i * 40, 210, String(v), i === 0 ? "var(--lime)" : "var(--txt)", 10)).join("")}
  ${S.txt(268, 210, "← the same heap, flat in an array", "var(--dim)", 10, "start")}
</svg>`,
  },

  /* ============================== GRAPHS ============================== */
  {
    id: "graph",
    oneLine: "Nodes and edges — and the entire skill is recognising that something which is not called a graph is one.",
    model:
      "Most graph problems do not hand you a graph. They hand you a grid, a list of word transformations, a set of course prerequisites, or a state space, and the first move is to name the nodes and the edges. Once you have done that, the algorithm is usually the obvious one.\n\nThe algorithm follows from the edge weights. <b>All equal</b> → BFS gives shortest paths, because the queue is naturally ordered by distance. <b>Non-negative</b> → Dijkstra, which is BFS with the queue swapped for a heap. <b>Negative allowed</b> → Bellman-Ford, which also detects negative cycles. <b>Only connectivity matters</b> → union-find, especially if edges arrive one at a time. <b>Directed with prerequisites</b> → topological sort, which doubles as cycle detection.\n\nThe representation matters more than people expect: an adjacency list is O(V+E) memory and the right default; an adjacency matrix is O(V²) and only worth it for dense graphs or O(1) edge tests.",
    invariant:
      "BFS: the queue holds nodes at distance d then d+1 and nothing further, so the first time you dequeue a node its distance is final. Dijkstra: the same, but it requires <b>non-negative</b> weights — a negative edge invalidates the finality and the algorithm is simply wrong, not just slow.",
    ops: [
      ["BFS / DFS", "O(V+E)", "with an adjacency list"],
      ["Dijkstra (binary heap)", "O((V+E) log V)", "non-negative weights only"],
      ["Bellman-Ford", "O(V·E)", "handles negatives, detects negative cycles"],
      ["Floyd-Warshall", "O(V³)", "all pairs; fine when V ≤ ~400"],
      ["topological sort (Kahn)", "O(V+E)", "short output ⇒ a cycle exists"],
      ["union-find op", "O(α(n)) ≈ O(1)", "needs BOTH compression and rank"],
      ["Tarjan SCC / bridges", "O(V+E)", "one DFS with low-links"],
      ["MST (Kruskal)", "O(E log E)", "Prim is better on dense graphs"],
    ],
    reach: [
      "A grid — it is a graph with 4 or 8 edges per cell",
      "Prerequisites, dependencies, ordering → topological sort",
      "'Fewest moves' or 'shortest transformation' → BFS over a state space",
      "'Are these connected' with edges arriving incrementally → union-find",
      "Cheapest route with weights → Dijkstra",
    ],
    avoid: [
      "Dijkstra with negative edges → wrong answers, use Bellman-Ford",
      "Floyd-Warshall when V is large → O(V³) dies past a few hundred",
      "An adjacency matrix on a sparse graph → O(V²) memory for nothing",
      "Recursive DFS at 10⁶ nodes → the stack dies; go iterative",
    ],
    edges: [
      { input: "Disconnected graph", effect: "One BFS from node 0 misses whole components; MST is undefined.", fix: "Loop over all start nodes. For MST, decide whether you return a forest or fail." },
      { input: "Self-loops and parallel edges", effect: "Bridge detection by parent vertex wrongly reports a parallel edge as a bridge.", fix: "Skip the arriving edge by EDGE ID, not by parent vertex." },
      { input: "Marking visited on dequeue", effect: "The same node enters the queue many times; on dense graphs this blows up.", fix: "Mark visited when you ENQUEUE. This is the single most common BFS bug." },
      { input: "Cycle in a directed graph", effect: "A boolean visited array cannot distinguish a back edge from a cross edge, so diamonds are falsely reported as cycles.", fix: "Three states: unvisited / in-progress / done." },
      { input: "Zero-weight edges in Dijkstra", effect: "Works, but if weights are only 0 and 1 you are paying an unnecessary log factor.", fix: "0-1 BFS with a deque: push_front for 0, push_back for 1." },
      { input: "Single node, no edges", effect: "Topological sort must still output it; connectivity count is 1 not 0.", fix: "Initialise the component count to V and decrement per union." },
      { input: "Grid boundary", effect: "Indexing before bounds-checking throws or silently wraps in some languages.", fix: "Bounds-check BEFORE indexing, always in that order." },
    ],
    caption: "BFS explores in distance layers. Because every edge costs the same, the first time a node is reached is via a shortest path — which is why no relaxation step is needed.",
    svg: `<svg viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg">
  ${S.line(90, 100, 220, 60, DIM)}${S.line(90, 100, 220, 140, DIM)}
  ${S.line(220, 60, 350, 60, DIM)}${S.line(220, 140, 350, 140, DIM)}${S.line(220, 60, 350, 140, DIM)}
  ${S.line(350, 60, 480, 100, DIM)}${S.line(350, 140, 480, 100, DIM)}

  <rect x="52" y="20" width="76" height="160" rx="3" fill="rgba(91,255,165,.05)" stroke="var(--lime)" stroke-dasharray="3 3"/>
  <rect x="182" y="20" width="76" height="160" rx="3" fill="rgba(56,232,255,.05)" stroke="var(--cyan)" stroke-dasharray="3 3"/>
  <rect x="312" y="20" width="76" height="160" rx="3" fill="rgba(255,182,39,.05)" stroke="var(--amb)" stroke-dasharray="3 3"/>
  <rect x="442" y="20" width="76" height="160" rx="3" fill="rgba(255,61,154,.05)" stroke="var(--mag)" stroke-dasharray="3 3"/>
  ${S.txt(90, 34, "d = 0", "var(--lime)", 10)}
  ${S.txt(220, 34, "d = 1", "var(--cyan)", 10)}
  ${S.txt(350, 34, "d = 2", "var(--amb)", 10)}
  ${S.txt(480, 34, "d = 3", "var(--mag)", 10)}

  <circle cx="90" cy="100" r="18" fill="rgba(91,255,165,.14)" stroke="var(--lime)" stroke-width="1.4"/>${S.txt(90, 105, "s", "var(--lime)", 12)}
  <circle cx="220" cy="60" r="18" fill="rgba(56,232,255,.12)" stroke="var(--cyan)" stroke-width="1.4"/>${S.txt(220, 65, "a", "var(--cyan)", 12)}
  <circle cx="220" cy="140" r="18" fill="rgba(56,232,255,.12)" stroke="var(--cyan)" stroke-width="1.4"/>${S.txt(220, 145, "b", "var(--cyan)", 12)}
  <circle cx="350" cy="60" r="18" fill="rgba(255,182,39,.12)" stroke="var(--amb)" stroke-width="1.4"/>${S.txt(350, 65, "c", "var(--amb)", 12)}
  <circle cx="350" cy="140" r="18" fill="rgba(255,182,39,.12)" stroke="var(--amb)" stroke-width="1.4"/>${S.txt(350, 145, "d", "var(--amb)", 12)}
  <circle cx="480" cy="100" r="18" fill="rgba(255,61,154,.12)" stroke="var(--mag)" stroke-width="1.4"/>${S.txt(480, 105, "t", "var(--mag)", 12)}
  ${S.txt(540, 96, "mark visited on", "var(--lime)", 10, "start")}
  ${S.txt(540, 110, "ENQUEUE, not", "var(--lime)", 10, "start")}
  ${S.txt(540, 124, "on dequeue", "var(--lime)", 10, "start")}
</svg>`,
  },

  /* ======================= DYNAMIC PROGRAMMING ======================= */
  {
    id: "dp",
    oneLine: "Recursion plus memory. The hard part is never the code — it is naming the state.",
    model:
      "DP applies when a problem has <b>overlapping subproblems</b> (the same sub-question is asked many times) and an <b>optimal substructure</b> (the best answer is built from best answers to sub-questions). If both hold, you compute each sub-answer once and reuse it.\n\nThe method that actually works under pressure is: write the brute-force recursion first, without caring about efficiency. Then look at the recursion's parameters — <em>that is your state</em>. Add a cache keyed on those parameters and you have top-down DP. Reverse the dependency order and you have bottom-up. Then notice how far back the recurrence reaches and roll the table down to that many rows.\n\nNearly all interview DP is one of six shapes: <b>1D linear</b> (answer at i from a constant number of earlier), <b>knapsack</b> (choose or skip under a budget), <b>unbounded</b> (reuse allowed), <b>LIS</b> (longest chain), <b>grid</b> (2D paths), <b>two-sequence</b> (compare two strings). Recognising which shape you are in is most of the work.",
    invariant:
      "The state must be a <b>complete summary of the past</b>: everything the future needs to know, and nothing more. Too little and the recurrence is wrong; too much and the table does not fit. Every DP bug is one of those two.",
    ops: [
      ["1D linear", "O(n) / O(1)", "roll to two or three scalars"],
      ["0/1 knapsack", "O(n·W) / O(W)", "capacity loop DESCENDING"],
      ["unbounded knapsack", "O(n·W) / O(W)", "capacity loop ASCENDING"],
      ["LIS (patience)", "O(n log n) / O(n)", "tails array + binary search"],
      ["grid paths", "O(R·C) / O(C)", "roll to one row"],
      ["two sequences", "O(n·m) / O(m)", "(n+1)×(m+1) table, indices i-1 and j-1"],
      ["bitmask over subsets", "O(2ⁿ·n)", "n ≤ 20"],
      ["submask enumeration", "O(3ⁿ)", "not 4ⁿ — each element is in one of three states"],
    ],
    reach: [
      "'Maximum / minimum / count of ways' plus choices at each step",
      "You wrote a recursion and noticed it recomputes the same arguments",
      "Constraints look like n ≤ 5000 (O(n²)) or n ≤ 20 (O(2ⁿ))",
      "A greedy feels right but you cannot construct an exchange argument",
    ],
    avoid: [
      "A provable greedy exists → DP is slower and more code",
      "Subproblems do not overlap → it is plain divide and conquer",
      "The state needs the whole path → DP will not compress it; think again",
      "n ≤ 10 → brute force and move on",
    ],
    edges: [
      { input: "n = 0 / empty input", effect: "dp[0] must be a meaningful base case, and 'no way to do it' must differ from 'zero cost'.", fix: "Use a sentinel (−inf or None) for unreachable, distinct from 0." },
      { input: "All negative values", effect: "Max-subarray seeded at 0 returns 0; max-path-sum drags negatives in.", fix: "Seed from the first element; clamp child contributions at 0 for path problems." },
      { input: "Loop direction reversed (knapsack)", effect: "Descending is 0/1, ascending is unbounded. Both compile, both look right, they answer different questions.", fix: "Say which problem you are solving before you write the loop." },
      { input: "Loop nesting swapped (coin change)", effect: "Coins outer / amount inner counts COMBINATIONS; amount outer / coins inner counts PERMUTATIONS.", fix: "LC 518 wants the first, LC 377 the second. Same code, swapped loops." },
      { input: "Off-by-one in a two-sequence table", effect: "Reading <code>A[i]</code> instead of <code>A[i-1]</code> silently shifts everything.", fix: "Table is (n+1)×(m+1); string indices are always i−1 and j−1." },
      { input: "Recursion depth on memoised top-down", effect: "10⁵ chained states overflow the stack even though the DP is O(n).", fix: "Convert to bottom-up, or raise the recursion limit." },
      { input: "Answer needs the choices, not the value", effect: "The rolled 1D table cannot be back-traced.", fix: "Keep the 2D table, or store parent pointers. You cannot have O(1) space AND reconstruction." },
    ],
    caption: "A two-sequence DP table (edit distance). Each cell reads three neighbours; row i needs only row i−1, which is why it rolls to O(m) space.",
    svg: `<svg viewBox="0 0 640 220" xmlns="http://www.w3.org/2000/svg">
  ${S.txt(24, 30, "", "var(--dim)", 10)}
  ${["", "r", "o", "s"].map((c, j) => S.txt(96 + j * 52, 30, c || "ø", "var(--mag)", 11)).join("")}
  ${["ø", "h", "o", "r", "s", "e"].map((c, i) => S.txt(56, 58 + i * 26, c, "var(--cyan)", 11)).join("")}
  ${[
      [0, 1, 2, 3],
      [1, 1, 2, 3],
      [2, 2, 1, 2],
      [3, 2, 2, 2],
      [4, 3, 3, 2],
      [5, 4, 4, 3],
    ].map((row, i) => row.map((v, j) => {
      const hot = i === 4 && j === 3;
      const src = (i === 3 && j === 3) || (i === 4 && j === 2) || (i === 3 && j === 2);
      return S.cell(72 + j * 52, 44 + i * 26, 44 + 0, 20, hot ? "rgba(91,255,165,.18)" : src ? "rgba(255,182,39,.13)" : PANEL,
        hot ? "var(--lime)" : src ? "var(--amb)" : DIM) +
        S.txt(94 + j * 52, 58 + i * 26, String(v), hot ? "var(--lime)" : src ? "var(--amb)" : "var(--txt)", 10);
    }).join("")).join("")}
  ${S.txt(300, 60, "each cell = f(up, left, diagonal)", "var(--amb)", 11, "start")}
  ${S.txt(300, 82, "match  →  take the diagonal", "var(--dim)", 11, "start")}
  ${S.txt(300, 102, "differ →  1 + min(the three)", "var(--dim)", 11, "start")}
  ${S.txt(300, 138, "row i needs only row i-1", "var(--lime)", 11, "start")}
  ${S.txt(300, 158, "→ roll to O(m) space", "var(--lime)", 11, "start")}
  ${S.txt(300, 190, "table is (n+1) x (m+1)", "var(--mag)", 11, "start")}
  ${S.txt(300, 208, "string indices are i-1, j-1", "var(--mag)", 11, "start")}
</svg>`,
  },

  /* ============================ BACKTRACKING ============================ */
  {
    id: "bt",
    oneLine: "Exhaustive search with an undo step — and pruning is what separates 'works' from 'finishes'.",
    model:
      "Backtracking builds a candidate incrementally and abandons a branch the moment it cannot lead to a solution. Structurally it is always the same three lines: <b>choose</b>, <b>recurse</b>, <b>un-choose</b>. That last line is the whole difference from plain recursion — you mutate a shared path and restore it on the way out, which is what keeps memory at O(depth) instead of O(number of candidates).\n\nThe distinction that decides correctness is what you pass down. A <b>start index</b> means later choices cannot revisit earlier elements, giving combinations. A <b>used[] array</b> with a full loop means any unused element is available, giving permutations. Confusing the two is the most common backtracking error.\n\nThe distinction that decides <em>speed</em> is pruning. Sorting first so you can break out early, bounding the remaining sum, and skipping duplicate branches turn an intractable search into a fast one without changing the asymptotic label.",
    invariant:
      "On entry and exit of every recursive call, the shared <code>path</code> is in the same state. If it is not, you have forgotten an un-choose, and results will bleed between branches.",
    ops: [
      ["all subsets", "O(2ⁿ · n)", "n copies of the path at the leaves"],
      ["all permutations", "O(n! · n)", "n ≤ 10 or so in practice"],
      ["combination sum", "O(2ⁿ)", "with pruning, far better in practice"],
      ["N-Queens", "O(n!) bounded", "column/diagonal sets make each test O(1)"],
      ["Sudoku", "exponential", "constraint propagation dominates the runtime"],
      ["word search on a grid", "O(R·C·4^L)", "L = word length"],
    ],
    reach: [
      "'Return all …' rather than 'return the best' or 'count'",
      "n is small — 10 to 20 — and the answer is a set of configurations",
      "Constraint satisfaction: placements, colourings, partitions",
      "You need the actual solutions, not just how many",
    ],
    avoid: [
      "You only need the count → DP is usually exponentially faster",
      "You only need the best one → DP or greedy",
      "n > 20 with no pruning → it will not finish; reframe the problem",
    ],
    edges: [
      { input: "Appending the live path", effect: "Every stored result is the same object and ends up empty after backtracking.", fix: "Append a COPY: <code>path[:]</code>, <code>new ArrayList&lt;&gt;(path)</code>, <code>vector(path)</code>." },
      { input: "Duplicates in the input", effect: "Identical subsets or permutations are emitted many times.", fix: "Sort first. For subsets skip <code>i > start && a[i] == a[i-1]</code>. For permutations skip <code>a[i] == a[i-1] && !used[i-1]</code> — the <code>!used[i-1]</code> is the most-forgotten condition in all of backtracking." },
      { input: "Empty input", effect: "Subsets should return <code>[[]]</code>, not <code>[]</code>. Permutations should return <code>[[]]</code> too.", fix: "The base case emits the empty path — verify rather than assume." },
      { input: "Forgetting to un-choose", effect: "Results grow monotonically and later branches inherit earlier state.", fix: "Write choose and un-choose as a pair, on adjacent lines, before filling in the middle." },
      { input: "Recursing with i instead of i+1", effect: "Elements get reused — that is combination-sum-with-repetition, a different problem.", fix: "<code>i+1</code> for use-once, <code>i</code> for unlimited reuse. State which you intend." },
      { input: "Target already reached at depth 0", effect: "Missing the base-case check before the loop skips a valid empty answer.", fix: "Check the terminal condition at the top of the function, not inside the loop." },
    ],
    caption: "The recursion tree for subsets of [1,2,3]. Each level chooses whether to include one element — 2ⁿ leaves, and the un-choose step is what lets one shared path visit all of them.",
    svg: `<svg viewBox="0 0 640 210" xmlns="http://www.w3.org/2000/svg">
  ${S.line(320, 34, 170, 78, DIM)}${S.line(320, 34, 470, 78, DIM)}
  ${S.line(170, 94, 95, 134, DIM)}${S.line(170, 94, 245, 134, DIM)}
  ${S.line(470, 94, 395, 134, DIM)}${S.line(470, 94, 545, 134, DIM)}
  ${[[95, "[]"], [245, "[3]"], [395, "[2]"], [545, "[2,3]"]].map(([x, t]) =>
    S.cell(Number(x) - 38, 150, 76, 24, "rgba(91,255,165,.10)", "var(--lime)") + S.txt(Number(x), 166, String(t), "var(--lime)", 10)).join("")}
  ${S.cell(282, 22, 76, 24, PANEL, "var(--cyan)")}${S.txt(320, 38, "[]", "var(--cyan)", 10)}
  ${S.cell(132, 82, 76, 24, PANEL, DIM)}${S.txt(170, 98, "skip 1", "var(--dim)", 10)}
  ${S.cell(432, 82, 76, 24, PANEL, DIM)}${S.txt(470, 98, "take 2", "var(--dim)", 10)}
  ${S.txt(230, 60, "skip", "var(--mag)", 9)}
  ${S.txt(410, 60, "take", "var(--lime)", 9)}
  ${S.txt(20, 198, "choose → recurse → UN-choose.  drop the un-choose and every branch inherits the last one's state.", "var(--dim)", 11, "start")}
</svg>`,
  },

  /* ============================== GREEDY ============================== */
  {
    id: "greedy",
    oneLine: "Commit to the locally best choice and never reconsider — correct only when you can prove it, which is the entire difficulty.",
    model:
      "A greedy algorithm makes an irrevocable choice at each step using a local rule. When it works it is dramatically simpler and faster than DP. When it does not, it produces a plausible wrong answer, which is worse than being slow.\n\nSo greedy is not really an algorithm technique — it is a <b>proof technique</b>. The code is trivial; the work is establishing that the local choice is safe. The standard tool is an <b>exchange argument</b>: assume an optimal solution differs from your greedy choice, then show you can swap your choice in without making things worse. If you can construct that argument, greedy is correct. If you cannot, you probably need DP.\n\nThe practical tell is the sort key. Interval scheduling sorts by <em>end</em> time, not start — finishing earliest leaves the most room for everything after. Getting the key wrong is the usual failure, and it is not detectable by testing a few examples.",
    invariant:
      "After each greedy choice, an optimal solution consistent with all choices made so far still exists. That statement <em>is</em> the exchange argument, and it is what you should say out loud.",
    ops: [
      ["sort + single pass", "O(n log n)", "sorting dominates"],
      ["interval scheduling", "O(n log n)", "sort by END time"],
      ["fractional knapsack", "O(n log n)", "sort by value/weight ratio"],
      ["Huffman coding", "O(n log n)", "repeatedly merge the two smallest — a heap"],
      ["reachability sweep", "O(n)", "no sort needed; track the frontier"],
      ["MST (Kruskal / Prim)", "O(E log E)", "greedy licensed by the cut property"],
      ["Dijkstra", "O((V+E) log V)", "greedy licensed by non-negative weights"],
    ],
    reach: [
      "Activity selection, minimum arrows, meeting rooms, non-overlapping intervals",
      "'Minimum number of X to cover Y'",
      "Jump games and gas stations — track a reachability frontier",
      "You can state an exchange argument in one sentence",
    ],
    avoid: [
      "You cannot justify the local choice → it is probably DP",
      "0/1 knapsack — greedy by ratio is provably wrong when items are indivisible",
      "Choices interact across the whole sequence → DP",
      "Coin change with arbitrary denominations — greedy fails on {1,3,4} for 6",
    ],
    edges: [
      { input: "Sorting by start instead of end", effect: "Activity selection returns a suboptimal count. Passes small examples, fails hidden tests.", fix: "Sort by END. Say why: finishing earliest maximises remaining room." },
      { input: "Ties in the sort key", effect: "Different orderings give different answers when the tiebreak matters (e.g. Russian doll envelopes).", fix: "Define the secondary key explicitly — often DESCENDING on the second field." },
      { input: "Half-open vs closed intervals", effect: "A meeting ending at 10 either conflicts with one starting at 10 or does not. Off by one room.", fix: "Sort events as <code>(time, delta)</code> so −1 precedes +1 at ties." },
      { input: "Empty input", effect: "<code>ivs[0]</code> throws; the answer is 0 or 1 depending on the problem.", fix: "Guard, and state the convention." },
      { input: "Single interval", effect: "Merging loops that start at index 1 never execute — usually fine, but verify the output shape.", fix: "Seed the output with the first element, then iterate from 1." },
      { input: "Greedy 'works' on the samples", effect: "The most dangerous case: it looks right and is wrong.", fix: "Try to construct a counterexample for 60 seconds before committing. If you cannot, state the exchange argument and proceed." },
    ],
    caption: "Interval scheduling. Sorting by END time (top) picks 3; sorting by START (bottom) picks 2. Same data, wrong key, wrong answer.",
    svg: `<svg viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg">
  ${S.txt(20, 22, "sorted by END  →  3 intervals", "var(--lime)", 10, "start")}
  ${[[20, 120, 1], [140, 100, 1], [80, 300, 0], [260, 160, 1]].map(([x, w, keep], i) =>
    S.cell(Number(x), 32 + i * 20, Number(w), 15, keep ? "rgba(91,255,165,.16)" : "rgba(255,61,154,.08)", keep ? "var(--lime)" : "var(--mag)")).join("")}
  ${S.txt(470, 44, "kept", "var(--lime)", 9, "start")}
  ${S.txt(470, 76, "rejected: overlaps", "var(--mag)", 9, "start")}

  ${S.line(20, 118, 620, 118, DIM, "3 3")}

  ${S.txt(20, 142, "sorted by START  →  2 intervals", "var(--mag)", 10, "start")}
  ${[[20, 120, 1], [80, 300, 1], [140, 100, 0], [260, 160, 0]].map(([x, w, keep], i) =>
    S.cell(Number(x), 152 + i * 20, Number(w), 15, keep ? "rgba(91,255,165,.16)" : "rgba(255,61,154,.08)", keep ? "var(--lime)" : "var(--mag)")).join("")}
  ${S.txt(470, 186, "the long one blocks two", "var(--mag)", 9, "start")}
</svg>`,
  },

  /* =========================== BITS & MATH =========================== */
  {
    id: "bit",
    oneLine: "Integers as sets of bits, plus the small number-theory facts that show up over and over.",
    model:
      "Bit manipulation matters in interviews for two reasons. First, a few identities turn O(n) work into O(1): <code>x & (x-1)</code> clears the lowest set bit, <code>x & -x</code> isolates it, and XOR is its own inverse so pairs cancel. Second, an integer's bits <em>are</em> a subset, which is what makes bitmask DP possible.\n\nThe number-theory half is a small, closed set of facts: a sieve marks composites in O(n log log n); Euclid's GCD is O(log min(a,b)); modular exponentiation is O(log n) by repeated squaring. Most 'math' problems in an OA reduce to one of these plus care about overflow.\n\nWhich brings up the thing that actually decides outcomes here: the moment a problem says <b>modulo 10⁹+7</b>, every intermediate product must be reduced in 64-bit. <code>(a*b) % m</code> with two ints near 10⁹ overflows <em>before</em> the mod is applied, and the result is silently wrong.",
    invariant:
      "XOR: <code>x ^ x == 0</code> and <code>x ^ 0 == x</code>, and it is commutative — which is exactly why XOR-ing everything cancels pairs and leaves the singleton, regardless of order.",
    ops: [
      ["test / set / clear bit i", "O(1)", "parenthesise: (x &amp; (1&lt;&lt;i)) != 0"],
      ["popcount", "O(1)", "__builtin_popcount / Integer.bitCount"],
      ["clear lowest set bit", "O(1)", "x &amp; (x-1)"],
      ["isolate lowest set bit", "O(1)", "x &amp; -x — the Fenwick tree trick"],
      ["iterate all subsets", "O(2ⁿ)", "n ≤ 20"],
      ["iterate submasks of a mask", "O(3ⁿ) total", "sub = (sub-1) &amp; mask"],
      ["sieve to n", "O(n log log n)", "start marking at p·p"],
      ["gcd", "O(log min(a,b))", "Euclid"],
      ["modular power", "O(log n)", "repeated squaring, 64-bit intermediates"],
    ],
    reach: [
      "'Every element appears twice except one' → XOR",
      "n ≤ 20 and state is 'which elements are used' → bitmask",
      "'Answer modulo 10⁹+7' → modular arithmetic, watch overflow",
      "Primes, divisors, factorisation → sieve",
      "Huge exponents → fast power",
    ],
    avoid: [
      "Bit tricks for readability's sake → clarity beats cleverness in an interview",
      "XOR for 'appears three times' → it does not work; use bit counts mod 3",
      "Trial division for many primality queries → sieve once",
    ],
    edges: [
      { input: "Shift by ≥ bit width", effect: "<code>1 &lt;&lt; 32</code> on a 32-bit int is undefined in C++ and wraps in Java.", fix: "Use <code>1LL &lt;&lt; k</code> in C++, <code>1L &lt;&lt; k</code> in Java. Python has arbitrary precision." },
      { input: "Missing parentheses around a shift", effect: "<code>mask & 1 &lt;&lt; i == 0</code> parses as <code>mask &amp; (1 &lt;&lt; (i == 0))</code> — shift binds looser than equality.", fix: "Always <code>(mask &amp; (1 &lt;&lt; i)) != 0</code>." },
      { input: "Negative numbers with >>", effect: "<code>&gt;&gt;</code> is arithmetic (sign-extending) in Java; <code>&gt;&gt;&gt;</code> is logical. C++ on signed negatives was UB before C++20.", fix: "Cast to unsigned, or use <code>&gt;&gt;&gt;</code> in Java." },
      { input: "(a*b) % m with a, b near 10⁹", effect: "Overflows int32 before the mod applies. Silently wrong, no crash.", fix: "Cast to <code>long long</code> / <code>long</code> BEFORE multiplying." },
      { input: "Negative modulo", effect: "<code>-7 % 5</code> is <code>-2</code> in C++/Java, <code>3</code> in Python.", fix: "<code>((x % m) + m) % m</code> whenever the sign is uncertain." },
      { input: "Sieve marking from 2p", effect: "Correct but slower; marking from p·p is the standard optimisation.", fix: "Start the inner loop at <code>p*p</code>, and use <code>long</code> for it — <code>p*p</code> overflows for p near 10⁵ in int." },
      { input: "n = 0 or 1 in the sieve", effect: "0 and 1 are not prime but arrays initialised to true say they are.", fix: "Explicitly set both false." },
    ],
    caption: "x & (x-1) clears the lowest set bit; x & -x isolates it. Subtracting 1 flips the lowest 1 and everything below it — that is the whole mechanism.",
    svg: `<svg viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg">
  ${S.txt(20, 30, "x      = 44", "var(--txt)", 11, "start")}
  ${"00101100".split("").map((b, i) =>
    S.cell(150 + i * 34, 16, 28, 20, b === "1" ? "rgba(56,232,255,.14)" : PANEL, b === "1" ? "var(--cyan)" : DIM) +
    S.txt(164 + i * 34, 31, b, b === "1" ? "var(--cyan)" : "#4A456E", 11)).join("")}

  ${S.txt(20, 68, "x - 1  = 43", "var(--txt)", 11, "start")}
  ${"00101011".split("").map((b, i) => {
    const flipped = i >= 5;
    return S.cell(150 + i * 34, 54, 28, 20, flipped ? "rgba(255,182,39,.14)" : PANEL, flipped ? "var(--amb)" : DIM) +
      S.txt(164 + i * 34, 69, b, flipped ? "var(--amb)" : "#4A456E", 11);
  }).join("")}
  ${S.txt(432, 90, "the lowest 1 and everything below it flipped", "var(--amb)", 9, "start")}

  ${S.line(150, 104, 422, 104, DIM, "3 3")}

  ${S.txt(20, 128, "x & (x-1) = 40", "var(--lime)", 11, "start")}
  ${"00101000".split("").map((b, i) =>
    S.cell(150 + i * 34, 114, 28, 20, b === "1" ? "rgba(91,255,165,.14)" : PANEL, b === "1" ? "var(--lime)" : DIM) +
    S.txt(164 + i * 34, 129, b, b === "1" ? "var(--lime)" : "#4A456E", 11)).join("")}
  ${S.txt(432, 128, "lowest set bit CLEARED", "var(--lime)", 9, "start")}

  ${S.txt(20, 168, "x & -x    = 4", "var(--mag)", 11, "start")}
  ${"00000100".split("").map((b, i) =>
    S.cell(150 + i * 34, 154, 28, 20, b === "1" ? "rgba(255,61,154,.14)" : PANEL, b === "1" ? "var(--mag)" : DIM) +
    S.txt(164 + i * 34, 169, b, b === "1" ? "var(--mag)" : "#4A456E", 11)).join("")}
  ${S.txt(432, 168, "lowest set bit ISOLATED", "var(--mag)", 9, "start")}
</svg>`,
  },
];
