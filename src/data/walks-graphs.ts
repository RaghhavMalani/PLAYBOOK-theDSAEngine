import type { Pattern } from "../types";

/**
 * Worked traces and edge matrices for the graph patterns.
 *
 * Graphs and DP decide the Google/Meta outcome, so these get the fullest treatment.
 * In every set the third trace is the one where the obvious mental model produces a
 * wrong answer — that is the trace worth reading twice.
 */
type Extra = Pick<Pattern, "edges" | "walk">;

export const WALKS_GRAPHS: Readonly<Record<string, Extra>> = {
  "Topological sort (Kahn's)": {
    edges: [
      { input: "A cycle exists", effect: "The queue empties before every node is emitted, so the output is short. If you return it anyway, you hand back a partial ordering that looks valid.", fix: "<code>return order if len(order) == n else []</code>. That single comparison IS the cycle detection — do not write a separate DFS for it." },
      { input: "Disconnected graph", effect: "Nothing breaks; every component's roots start at in-degree 0 and all get emitted.", fix: "Correct by construction. Worth saying out loud, because it is the case people assume is broken." },
      { input: "Self-loop <code>u → u</code>", effect: "in-degree[u] is 1 and can never reach 0, so u is never emitted — correctly reported as a cycle.", fix: "Nothing to fix. A self-loop IS a cycle; confirm the problem agrees." },
      { input: "Duplicate edges <code>u → v</code> twice", effect: "in-degree[v] is inflated to 2 but only decremented twice, so it still reaches 0. Correct — but only because you decrement per edge, not per node.", fix: "Build in-degrees from the edge list, not from a deduplicated neighbour set. Mixing the two is the bug." },
      { input: "n = 1, no edges", effect: "One node at in-degree 0, emitted immediately. len(order) == 1 == n.", fix: "Correct. Verify your loop bound is <code>range(n)</code> and not <code>range(len(edges))</code>." },
      { input: "Multiple valid orderings", effect: "The queue order decides which you get. Tests comparing against one fixed answer will fail spuriously.", fix: "If the problem wants lexicographically smallest, swap the queue for a min-heap — O(V log V + E)." },
    ],
    walk: [
      {
        title: "Simple — a chain of prerequisites",
        input: "0 → 1 → 2   (take 0 before 1, 1 before 2)",
        cols: ["step", "in-degrees", "queue", "emit", "order"],
        rows: [
          ["init", "[0, 1, 1]", "[0]", "—", "[]"],
          ["1", "[0, 0, 1]", "[1]", "0", "[0]"],
          ["2", "[0, 0, 0]", "[2]", "1", "[0, 1]"],
          ["3", "[0, 0, 0]", "[]", "2", "[0, 1, 2]"],
        ],
        lesson: "A node enters the queue at the exact moment its last prerequisite is emitted. len(order) == 3 == n, so no cycle.",
      },
      {
        title: "Harder — a diamond, where two orderings are both correct",
        input: "0 → 1, 0 → 2, 1 → 3, 2 → 3",
        cols: ["step", "in-degrees", "queue", "emit", "note"],
        rows: [
          ["init", "[0, 1, 1, 2]", "[0]", "—", "only 0 is free"],
          ["1", "[0, 0, 0, 2]", "[1, 2]", "0", "0 frees BOTH 1 and 2"],
          ["2", "[0, 0, 0, 1]", "[2]", "1", "3 still waits on 2"],
          ["3", "[0, 0, 0, 0]", "[3]", "2", "now 3 is free"],
          ["4", "—", "[]", "3", "order = [0,1,2,3]"],
        ],
        lesson: "[0,2,1,3] is equally correct — the queue order picked one. If a test expects a specific answer, the problem wants the lexicographically smallest, which needs a min-heap not a queue.",
      },
      {
        title: "Hardest — the cycle that a partial output hides",
        input: "0 → 1, 1 → 2, 2 → 1   (1 and 2 depend on each other)",
        cols: ["step", "in-degrees", "queue", "emit", "order"],
        rows: [
          ["init", "[0, 2, 1]", "[0]", "—", "[]"],
          ["1", "[0, 1, 1]", "[]", "0", "[0]"],
          ["2", "—", "<b>empty</b>", "—", "<b>[0] — loop ends</b>"],
        ],
        lesson: "The queue drained with in-degree[1] still at 1 and in-degree[2] at 1: they hold each other up forever. The output <code>[0]</code> is a perfectly plausible-looking ordering, which is exactly why you must compare <code>len(order)</code> to n. Skip that check and Course Schedule returns 'yes, schedulable' on an impossible graph.",
      },
    ],
  },

  "Union-Find (DSU)": {
    edges: [
      { input: "union(x, x)", effect: "find(x) == find(x), so union returns false. Harmless, but it counts as 'already connected' — which for cycle detection means a self-loop is reported as a cycle.", fix: "Correct for cycle detection. If self-loops should be ignored, filter them before the union." },
      { input: "No path compression", effect: "A chain of unions builds a linked list; find becomes O(n) and 10⁵ operations TLE.", fix: "Both optimisations or neither is not the choice — you need BOTH compression and union by rank to get O(α(n))." },
      { input: "Union by rank omitted", effect: "Compression alone gives amortised O(log n). Usually passes, sometimes does not.", fix: "Two extra lines. Add them and say 'O(α(n)), effectively constant'." },
      { input: "Counting components", effect: "Counting after the fact with a set of roots is O(n) per query.", fix: "Keep a counter initialised to n, decrement on every union that returns true. O(1) to read." },
      { input: "Non-integer elements (emails, strings)", effect: "The parent array cannot be indexed.", fix: "Map each element to an index first. That mapping step is most of 'Accounts Merge'." },
      { input: "Queries interleaved with disconnections", effect: "DSU cannot un-merge. Path compression destroys the history you would need.", fix: "Process offline in reverse if the problem allows, or use a rollback DSU without compression. Say which — 'DSU does not support deletion' is the expected answer." },
    ],
    walk: [
      {
        title: "Simple — three unions, watching the roots",
        input: "n = 5, unions: (0,1), (2,3), (1,2)",
        cols: ["op", "roots found", "action", "parent array", "components"],
        rows: [
          ["init", "—", "—", "[0,1,2,3,4]", "5"],
          ["union(0,1)", "0, 1", "link 1 → 0", "[0,0,2,3,4]", "4"],
          ["union(2,3)", "2, 3", "link 3 → 2", "[0,0,2,2,4]", "3"],
          ["union(1,2)", "0, 2", "link 2 → 0", "[0,0,0,2,4]", "2"],
        ],
        lesson: "find(1) walks 1→0 and find(3) walks 3→2→0, so the third union links the two ROOTS, not the two nodes. Component count drops only on a successful union.",
      },
      {
        title: "Harder — union returning false is the cycle detector",
        input: "edges arriving: (0,1), (1,2), (2,0)",
        cols: ["edge", "find(u)", "find(v)", "union returns", "meaning"],
        rows: [
          ["(0,1)", "0", "1", "true", "merged"],
          ["(1,2)", "0", "2", "true", "merged"],
          ["(2,0)", "0", "0", "<b>false</b>", "<b>already connected → this edge closes a cycle</b>"],
        ],
        lesson: "You do not need a separate cycle-detection pass. The union that returns false is the redundant edge — that is the whole of LC 684, and the same fact is why Kruskal skips edges that would form a cycle.",
      },
      {
        title: "Hardest — why compression alone is not enough",
        input: "unions in the worst order: (1,0), (2,1), (3,2), (4,3) … always linking the bigger tree under the smaller",
        cols: ["without union by rank", "with union by rank"],
        rows: [
          ["parent chain: 4→3→2→1→0", "flat: 1,2,3,4 → 0"],
          ["find(4) walks 4 links", "find(4) walks 1 link"],
          ["depth grows linearly with unions", "depth stays O(log n) before compression, O(α) after"],
          ["<b>O(n) per find → TLE at 10⁵</b>", "<b>O(α(n)) amortised</b>"],
        ],
        lesson: "Path compression flattens what it touches, but nothing stops you building a deep chain in the first place. Union by rank prevents the chain; compression cleans up what remains. Interviewers ask for both because either alone has a bad case.",
      },
    ],
  },

  "Dijkstra (weighted shortest path)": {
    edges: [
      { input: "A negative edge", effect: "Dijkstra is <b>wrong</b>, not slow: a node popped as final can later be reached more cheaply. It returns a confident wrong distance.", fix: "Bellman-Ford, O(V·E), which also detects negative cycles. State this before writing code if weights could be negative." },
      { input: "Stale heap entries", effect: "The lazy version pushes a node once per improvement. Re-expanding a finalised node breaks the complexity bound and can be exponential on crafted graphs.", fix: "<code>if d > dist[u]: continue</code> immediately after popping. One line, and it is the difference between O((V+E) log V) and much worse." },
      { input: "Unreachable target", effect: "dist stays at infinity. Returning it raw leaks a sentinel into the answer.", fix: "Map infinity to −1 or whatever the problem wants, explicitly." },
      { input: "Zero-weight edges", effect: "Works, but you are paying a log factor for nothing.", fix: "If weights are only 0 and 1, use 0-1 BFS with a deque — push_front for 0, push_back for 1. O(V+E)." },
      { input: "Multiple edges between the same pair", effect: "No problem — relaxation naturally keeps the cheapest.", fix: "Nothing. Do not pre-deduplicate; it is wasted work." },
      { input: "Sum of weights overflows int", effect: "Path costs near 10⁹ over 10⁵ edges exceed int32 and the comparison inverts.", fix: "<code>long long</code> / <code>long</code> for distances. Initialise to a large sentinel, not INT_MAX, so <code>d + w</code> cannot wrap." },
    ],
    walk: [
      {
        title: "Simple — the greedy choice in action",
        input: "s→a (1), s→b (4), a→b (2), b→t (1)",
        cols: ["pop", "d", "relax", "dist after"],
        rows: [
          ["s", "0", "a←1, b←4", "s:0 a:1 b:4 t:∞"],
          ["a", "1", "b: 1+2=3 < 4 ✓", "s:0 a:1 b:3 t:∞"],
          ["b", "3", "t: 3+1=4", "s:0 a:1 b:3 t:4"],
          ["t", "4", "—", "answer 4"],
        ],
        lesson: "b was first reached at 4 via the direct edge, then improved to 3 via a. Because it had not been popped yet, the improvement still counted — that is why you relax on push, not on pop.",
      },
      {
        title: "Harder — the stale entry you must skip",
        input: "same graph; the heap now holds b twice",
        cols: ["heap", "pop", "d vs dist[u]", "action"],
        rows: [
          ["(0,s)", "s", "0 == 0", "relax, push (1,a) and (4,b)"],
          ["(1,a) (4,b)", "a", "1 == 1", "relax b to 3, push (3,b) — <b>(4,b) is now stale</b>"],
          ["(3,b) (4,b)", "b", "3 == 3", "relax t, push (4,t)"],
          ["(4,b) (4,t)", "b", "<b>4 &gt; dist[b]=3</b>", "<b>skip — this is the stale copy</b>"],
          ["(4,t)", "t", "4 == 4", "done"],
        ],
        lesson: "Without the skip you re-expand b and relax t a second time. Harmless here, but on a graph where each node improves k times you re-expand O(E) times and the bound collapses. The one-line guard is not an optimisation, it is part of the algorithm.",
      },
      {
        title: "Hardest — the negative edge that breaks it silently",
        input: "s→a (2), s→b (5), b→a (−4).  True dist to a is 1 (via b).",
        cols: ["pop", "d", "what Dijkstra concludes", "reality"],
        rows: [
          ["s", "0", "a←2, b←5", "—"],
          ["a", "2", "<b>a is FINAL at 2</b>", "but s→b→a = 5−4 = <b>1</b>"],
          ["b", "5", "relax a: 5−4 = 1 &lt; 2", "a should update, but a was popped"],
          ["—", "—", "<b>returns 2</b>", "<b>correct answer is 1</b>"],
        ],
        lesson: "The greedy is licensed by non-negativity: when you pop the minimum, no unexplored path can be cheaper because every remaining edge only adds. A negative edge destroys that argument, and the failure is silent — no crash, no warning, just a wrong number. If weights can be negative, say 'Dijkstra is invalid here' and switch to Bellman-Ford.",
      },
    ],
  },

  "Grid as an implicit graph": {
    edges: [
      { input: "Indexing before the bounds check", effect: "<code>grid[r][c]</code> with r = −1 throws in Java/C++, and in Python silently wraps to the LAST row — producing a wrong answer with no error.", fix: "Bounds-check first, always: <code>if 0 &lt;= nr &lt; R and 0 &lt;= nc &lt; C</code>. The Python wrap is the nastier failure because nothing crashes." },
      { input: "Marking visited on dequeue", effect: "A cell can enter the queue from all four neighbours before it is first popped, so the queue blows up.", fix: "Mark on enqueue. On a grid this is the difference between O(R·C) and something much worse." },
      { input: "Multi-source spread", effect: "Running BFS once per source is O((R·C)²) and times out on rotting-oranges style inputs.", fix: "Push every source at distance 0 before the loop. One BFS." },
      { input: "Mutating the grid to mark visited", effect: "Fast and O(1) space, but destroys the caller's input.", fix: "Fine if the problem allows it — say so out loud. Otherwise a separate visited array." },
      { input: "1×1 grid", effect: "Start equals target; loops that check the target inside the neighbour scan never fire.", fix: "Test the target before entering the loop as well as inside it." },
      { input: "Diagonal movement", effect: "4 directions vs 8 changes the answer and is easy to misread.", fix: "Read the problem twice. <code>DIRS</code> is one line, and getting it wrong invalidates everything downstream." },
    ],
    walk: [
      {
        title: "Simple — counting islands with DFS",
        input: "grid = [['1','1','0'], ['0','1','0'], ['0','0','1']]",
        cols: ["scan cell", "value", "action", "islands"],
        rows: [
          ["(0,0)", "1", "new island → DFS sinks (0,0),(0,1),(1,1)", "1"],
          ["(0,1)", "0", "already sunk", "1"],
          ["(1,1)", "0", "already sunk", "1"],
          ["(2,2)", "1", "new island → DFS sinks (2,2)", "2"],
        ],
        lesson: "Sinking each cell to '0' as you visit is the visited-set. The outer scan only ever starts a DFS on a cell no earlier DFS reached, so each cell is touched O(1) times overall.",
      },
      {
        title: "Harder — multi-source BFS, all sources at distance 0",
        input: "two rotten oranges at (0,0) and (0,3), fresh ones between",
        cols: ["minute", "queue contents", "newly rotted"],
        rows: [
          ["0", "[(0,0), (0,3)]", "— both sources seeded together"],
          ["1", "[(0,1), (1,0), (0,2), (1,3)]", "4 cells, from BOTH fronts"],
          ["2", "[(1,1), (1,2)]", "2 cells where the fronts meet"],
          ["—", "[]", "answer: 2 minutes"],
        ],
        lesson: "Seeding both sources at distance 0 makes the two fronts advance together and meet in the middle. Running BFS from each source separately and taking the minimum gives the same answer here but costs O(sources × R·C) — on a grid that is full of rotten oranges, that is quadratic.",
      },
      {
        title: "Hardest — the negative index that does not crash",
        input: "Python, cell (0,0), checking the neighbour above: nr = −1",
        cols: ["order of operations", "grid[nr][nc] reads", "result"],
        rows: [
          ["<b>index first</b>, then bounds-check", "grid[−1][0] = <b>the LAST row</b>", "no exception; silently wrong"],
          ["<b>bounds-check first</b>, then index", "never evaluated", "correct"],
        ],
        lesson: "In C++ and Java a negative index throws or corrupts memory, so you find out. In Python, <code>grid[-1]</code> is legal and returns the bottom row — the grid effectively wraps around, connecting the top edge to the bottom. Your island count comes back wrong on inputs that touch the border and right on ones that do not, which is the hardest kind of bug to spot from a failing test number.",
      },
    ],
  },

  "Cycle detection & bipartite check": {
    edges: [
      { input: "Directed graph with a boolean visited array", effect: "A diamond (a→b, a→c, b→d, c→d) reports a false cycle: d is 'already visited' when reached the second time, but that is a cross edge, not a back edge.", fix: "Three states — unvisited / in-progress / done. Only an edge into an <b>in-progress</b> node is a cycle." },
      { input: "Undirected graph, skipping by parent vertex", effect: "Two parallel edges between u and v are reported as no cycle, when they are one.", fix: "Skip by edge id, not by parent vertex. This is the same fix as bridge finding." },
      { input: "Disconnected graph", effect: "One DFS misses whole components; a cycle elsewhere goes undetected.", fix: "Loop over every unvisited start node." },
      { input: "Bipartite check on a disconnected graph", effect: "Each component is coloured independently — correct, but a component you never visit is never validated.", fix: "Same fix: iterate all starts. A graph is bipartite only if every component is." },
      { input: "Odd-length cycle", effect: "This is exactly what makes a graph non-bipartite; even cycles are fine.", fix: "Nothing to fix — this is the theorem. Say it: a graph is bipartite iff it has no odd cycle." },
      { input: "Self-loop in a bipartite check", effect: "u must differ in colour from itself. Impossible.", fix: "A self-loop makes any graph non-bipartite. Detect it up front rather than letting the colouring loop decide." },
    ],
    walk: [
      {
        title: "Simple — a real directed cycle",
        input: "0 → 1 → 2 → 0",
        cols: ["visit", "state before", "edge to", "verdict"],
        rows: [
          ["0", "all WHITE", "1", "descend"],
          ["1", "0 GRAY", "2", "descend"],
          ["2", "0,1 GRAY", "0", "0 is <b>GRAY</b> → back edge → <b>cycle</b>"],
        ],
        lesson: "GRAY means 'on the current recursion stack'. An edge to a GRAY node closes a loop through the path you are standing on — that is what a cycle is.",
      },
      {
        title: "Harder — the diamond that is NOT a cycle",
        input: "0 → 1, 0 → 2, 1 → 3, 2 → 3",
        cols: ["visit", "edge to", "state of target", "verdict"],
        rows: [
          ["0 → 1 → 3", "3", "WHITE", "descend, finish 3 → BLACK"],
          ["back at 1", "—", "—", "finish 1 → BLACK"],
          ["0 → 2", "2", "WHITE", "descend"],
          ["2 → 3", "3", "<b>BLACK</b>", "<b>cross edge — NOT a cycle</b>"],
        ],
        lesson: "With a boolean visited array, that last step reads as 'already visited' and a naive check calls it a cycle. BLACK means 'finished, and nothing in its subtree reaches back here'. The distinction between BLACK and GRAY is the entire reason three states are needed.",
      },
      {
        title: "Hardest — bipartite fails only on an ODD cycle",
        input: "left: a square 0-1-2-3-0.   right: a triangle 0-1-2-0.",
        cols: ["graph", "colouring attempt", "result"],
        rows: [
          ["square (4-cycle)", "0=A, 1=B, 2=A, 3=B, back to 0=A ✓", "<b>bipartite</b>"],
          ["triangle (3-cycle)", "0=A, 1=B, 2=A, edge 2–0 wants A≠A ✗", "<b>not bipartite</b>"],
        ],
        lesson: "Colours alternate along any path, so returning to the start after an EVEN number of steps lands on the original colour and is consistent. An odd cycle forces a node to differ from itself. That is why 'bipartite' and 'no odd cycle' are the same statement — worth saying, because it turns a colouring exercise into a structural claim.",
      },
    ],
  },
};
