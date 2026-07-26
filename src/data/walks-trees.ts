import type { Pattern } from "../types";

/**
 * Worked traces and edge matrices for trees and heaps.
 *
 * Trees are where the difference between "I know the traversal" and "I know which
 * traversal" gets tested, so most of these traces are about ordering rather than code.
 * As elsewhere, the third trace in each set is the one where the obvious model breaks.
 */
type Extra = Pick<Pattern, "edges" | "walk">;

export const WALKS_TREES: Readonly<Record<string, Extra>> = {
  "DFS traversal (the three orders)": {
    edges: [
      { input: "Empty tree", effect: "<code>root.left</code> throws before the base case if the null check is not the first line.", fix: "<code>if not node: return</code> as line one, always." },
      { input: "Skewed tree, 10⁵ nodes", effect: "Recursion depth equals n. Python raises RecursionError at 1000; the JVM overflows the stack.", fix: "Iterative traversal with an explicit stack, or <code>sys.setrecursionlimit</code> plus a bigger thread stack. Say which you would do." },
      { input: "Single node", effect: "All three orders produce the same one-element output.", fix: "Correct, and a useless test — it cannot distinguish pre from post. Use three nodes." },
      { input: "Only left children", effect: "In-order and pre-order differ; post-order reverses. A good discriminating test.", fix: "Test with a left chain AND a right chain; between them they catch a swapped visit position." },
      { input: "In-order on a non-BST", effect: "Produces output, but it is not sorted — and nothing errors.", fix: "In-order gives sorted output <em>only</em> for a BST. Validate first if the problem does not promise it." },
      { input: "Iterative in-order, forgetting to move right", effect: "Infinite loop — the same node is pushed forever.", fix: "After popping, <code>cur = cur.right</code>. That single line is what advances the traversal." },
    ],
    walk: [
      {
        title: "Simple — the same tree, three orders",
        input: "     1\n    / \\\n   2   3",
        cols: ["order", "when the node is visited", "output"],
        rows: [
          ["pre", "before both children", "1, 2, 3"],
          ["in", "between left and right", "2, 1, 3"],
          ["post", "after both children", "2, 3, 1"],
        ],
        lesson: "Identical recursion, one line moved. The node's position in the output is exactly the position of <code>visit()</code> in the function body.",
      },
      {
        title: "Harder — the iterative in-order stack, step by step",
        input: "BST:  2 with left 1, right 3",
        cols: ["step", "cur", "stack", "action", "out"],
        rows: [
          ["1", "2", "[]", "push 2, go left", "[]"],
          ["2", "1", "[2]", "push 1, go left", "[]"],
          ["3", "null", "[2,1]", "pop 1, emit, go right(null)", "[1]"],
          ["4", "null", "[2]", "pop 2, emit, go right", "[1,2]"],
          ["5", "3", "[]", "push 3, go left(null)", "[1,2]"],
          ["6", "null", "[3]", "pop 3, emit", "[1,2,3]"],
        ],
        lesson: "The stack holds the ancestors you still owe a visit to. Sorted output confirms the BST property — and the loop condition is <code>stack or cur</code>, because either an unfinished descent or an unpaid ancestor means work remains.",
      },
      {
        title: "Hardest — pre-order + post-order cannot rebuild the tree",
        input: "two different trees, identical pre and post",
        cols: ["tree", "pre-order", "post-order"],
        rows: [
          ["1 with LEFT child 2", "1, 2", "2, 1"],
          ["1 with RIGHT child 2", "1, 2", "2, 1"],
          ["", "<b>identical</b>", "<b>identical</b>"],
        ],
        lesson: "Neither traversal records whether a lone child was on the left or the right, so the pair is ambiguous. <b>In-order is what splits left from right</b>: given in-order plus either pre or post, the tree is unique. That is why LC 105 and 106 exist and why there is no pre+post version — worth knowing, because the follow-up 'can you do it from pre and post?' has the answer 'only if every node has 0 or 2 children'.",
      },
    ],
  },

  "BFS level order": {
    edges: [
      { input: "Empty tree", effect: "Enqueueing a null root makes the first dequeue throw.", fix: "Return the empty result before touching the queue." },
      { input: "Reading the queue length inside the inner loop", effect: "You consume nodes you just enqueued, so all levels merge into one flat list.", fix: "Snapshot <code>n = len(queue)</code> BEFORE the inner loop. That snapshot is the only thing making it level-order." },
      { input: "A perfectly balanced tree of 10⁵ nodes", effect: "The widest level holds ~n/2 nodes, so the queue is O(n) — BFS is not the low-memory option here.", fix: "If memory is the constraint, DFS is O(h). Say which resource you are optimising." },
      { input: "Right side view on a left-skewed tree", effect: "Taking the last node of each level still works — every level has exactly one node.", fix: "Correct. Test skewed both ways; it catches an off-by-one in the level snapshot." },
      { input: "Zigzag order", effect: "Reversing the queue is O(n) per level and easy to get wrong.", fix: "Build each level normally, then reverse the <em>level list</em> on alternate depths. Never reverse the queue itself." },
      { input: "Using a list as a queue in Python", effect: "<code>list.pop(0)</code> is O(n), making the whole traversal O(n²).", fix: "<code>collections.deque</code> and <code>popleft()</code>." },
    ],
    walk: [
      {
        title: "Simple — the snapshot in action",
        input: "     1\n    / \\\n   2   3\n      / \\\n     4   5",
        cols: ["level", "n = len(q) snapshot", "dequeued", "enqueued", "output"],
        rows: [
          ["0", "1", "1", "2, 3", "[[1]]"],
          ["1", "2", "2, 3", "4, 5", "[[1],[2,3]]"],
          ["2", "2", "4, 5", "—", "[[1],[2,3],[4,5]]"],
        ],
        lesson: "At level 1 the snapshot is 2, so the inner loop consumes exactly 2 nodes even though 4 and 5 are enqueued during it. They belong to the next level and are correctly deferred.",
      },
      {
        title: "Harder — what happens without the snapshot",
        input: "same tree, inner loop reading len(q) live",
        cols: ["iteration", "q at check", "consumes", "result"],
        rows: [
          ["outer 1", "[1]", "1, then enqueues 2,3", "len is now 2, loop continues"],
          ["still outer 1", "[2,3]", "2 and 3, enqueues 4,5", "len is now 2, continues"],
          ["still outer 1", "[4,5]", "4 and 5", "<b>one 'level' = [1,2,3,4,5]</b>"],
        ],
        lesson: "Reading the length live turns the inner loop into a full traversal, so every node lands in level 0. The output is a valid BFS order — just entirely without level boundaries — which is why this bug passes a test that only checks the flattened sequence.",
      },
      {
        title: "Hardest — minimum depth is not maximum depth inverted",
        input: "     1\n    /\n   2\n  /\n 3",
        cols: ["approach", "computes", "result", "correct?"],
        rows: [
          ["max depth logic with min()", "1 + min(left, right)", "1 + min(depth(2), <b>0</b>) = 1", "<b>no</b>"],
          ["BFS, stop at first leaf", "first node with no children", "3", "yes"],
          ["DFS handling the null child", "if one side is null, take the other", "3", "yes"],
        ],
        lesson: "For maximum depth, <code>1 + max(left, right)</code> works because a null child contributing 0 never wins. For minimum depth it always wins, so a node with one child reports depth 1 — but that node is not a leaf. Minimum depth means distance to the nearest <b>leaf</b>, and BFS gets it for free by stopping at the first childless node.",
      },
    ],
  },

  "Bottom-up subtree aggregate": {
    edges: [
      { input: "Returning the global answer instead of the local one", effect: "A parent cannot combine children's diameters into its own, so the answer is wrong on any tree deeper than 2.", fix: "Return the height; <em>record</em> the diameter in a separate variable. The two values are different quantities." },
      { input: "Negative node values in max-path-sum", effect: "A negative subtree drags the path down instead of being dropped.", fix: "Clamp each child's contribution: <code>max(0, childSum)</code>. The recorded global still allows the node alone." },
      { input: "Single node", effect: "Diameter 0 if counting edges, 1 if counting nodes.", fix: "Ask which the problem means. LC 543 counts edges." },
      { input: "Skewed tree, 10⁵ deep", effect: "Recursion dies before the algorithm does.", fix: "Iterative post-order, or process in reverse BFS order — that is a valid post-order for free." },
      { input: "Balanced check done as two passes", effect: "Computing height inside an is-balanced recursion is O(n²) on a skewed tree.", fix: "One pass returning −1 as a sentinel for 'already unbalanced', short-circuiting upward." },
      { input: "Empty tree", effect: "Height 0 and diameter 0, but only if the base case returns before dereferencing.", fix: "Null check first line." },
    ],
    walk: [
      {
        title: "Simple — height and diameter in one pass",
        input: "     1\n    / \\\n   2   3\n  /\n 4",
        cols: ["node (post-order)", "left h", "right h", "records l+r", "returns 1+max"],
        rows: [
          ["4", "0", "0", "0", "1"],
          ["2", "1", "0", "<b>1</b>", "2"],
          ["3", "0", "0", "0", "1"],
          ["1", "2", "1", "<b>3</b>", "3"],
        ],
        lesson: "Diameter 3 (edges 4→2→1→3). Node 1 records left height + right height = the path THROUGH it, and returns 1 + max = the height OF it. Two different numbers from the same call — that is the whole pattern.",
      },
      {
        title: "Harder — max path sum with a negative subtree",
        input: "     -10\n     /  \\\n    9    20\n        /  \\\n       15   7",
        cols: ["node", "left gain", "right gain", "records l+r+node", "returns node + max(gain)"],
        rows: [
          ["9", "0", "0", "9", "9"],
          ["15", "0", "0", "15", "15"],
          ["7", "0", "0", "7", "7"],
          ["20", "15", "7", "<b>42</b>", "20 + 15 = 35"],
          ["-10", "9", "35", "-10+9+35 = 34", "-10 + 35 = 25"],
        ],
        lesson: "Answer 42, the path 15→20→7, which never touches the root. The root records 34 — worse — so the global max keeps 42. Note the return value (25) is not the answer either; only the recorded maximum is.",
      },
      {
        title: "Hardest — why the clamp at zero is not optional",
        input: "      2\n     / \\\n   -5   -3",
        cols: ["without clamp", "with clamp", "correct?"],
        rows: [
          ["records 2 + (−5) + (−3) = <b>−6</b>", "records 2 + max(0,−5) + max(0,−3) = <b>2</b>", "2"],
          ["returns 2 + max(−5,−3) = −1", "returns 2 + max(0, max(0,0)) = 2", "—"],
          ["global max = max(−5, −3, −6) = <b>−3</b>", "global max = max(−5, −3, 2) = <b>2</b>", "<b>2</b>"],
        ],
        lesson: "A path is allowed to be a single node, so a negative child should simply be excluded rather than added. Without the clamp the algorithm is forced to include children it does not want, and returns −3 for a tree that plainly contains the value 2. The clamp is what encodes 'you may stop here'.",
      },
    ],
  },

  "BST invariant (range validation & search)": {
    edges: [
      { input: "Comparing only against the parent", effect: "Accepts invalid trees where a deep node violates a distant ancestor. The classic wrong answer.", fix: "Thread (low, high) down the recursion. The property is about ancestors, not parents." },
      { input: "Node value equals INT_MIN or INT_MAX", effect: "Sentinel bounds compare equal and a valid tree is rejected.", fix: "Use <code>long</code> bounds, or nullable bounds where null means unbounded." },
      { input: "Duplicate values", effect: "Strict <code>lo &lt; v &lt; hi</code> rejects them; non-strict accepts trees that break the search.", fix: "Ask the convention. Most problems forbid duplicates — confirm rather than assume." },
      { input: "Empty tree", effect: "Vacuously a valid BST.", fix: "Return true. Verify the base case fires before any dereference." },
      { input: "Skewed BST", effect: "Search degrades to O(n); the structure gives you nothing.", fix: "Correct, and worth saying: BST operations are O(h), and h is only log n when balanced." },
      { input: "Deleting a node with two children", effect: "There is no single obvious replacement.", fix: "Swap in the in-order successor (leftmost of the right subtree), then delete that instead. The predecessor works equally well — pick one and say why." },
    ],
    walk: [
      {
        title: "Simple — ranges narrowing down the tree",
        input: "     10\n    /  \\\n   5    15",
        cols: ["node", "inherited range", "check", "verdict"],
        rows: [
          ["10", "(−∞, +∞)", "−∞ < 10 < +∞", "ok"],
          ["5", "(−∞, 10)", "−∞ < 5 < 10", "ok"],
          ["15", "(10, +∞)", "10 < 15 < +∞", "ok"],
        ],
        lesson: "Going left caps the upper bound at the parent; going right raises the lower bound. Each node's range is the intersection of every decision above it.",
      },
      {
        title: "Harder — the tree that passes a parent-only check",
        input: "     10\n    /  \\\n   5    15\n       /\n      6",
        cols: ["node", "parent check", "range check", "which is right"],
        rows: [
          ["6", "6 < 15 ✓ (it is a left child of 15)", "range is (10, 15); <b>6 ≤ 10 ✗</b>", "<b>range</b>"],
          ["result", "<b>reports VALID</b>", "<b>reports INVALID</b>", "invalid — 6 sits right of 10 but is smaller"],
        ],
        lesson: "6 satisfies its parent perfectly and still breaks the tree: searching for 6 from the root would go right at 10 and never find it. The parent-only check is not a weaker version of the range check, it is a different and wrong check.",
      },
      {
        title: "Hardest — the in-order shortcut and its one trap",
        input: "validate by checking in-order output is strictly increasing",
        cols: ["tree", "in-order", "strictly increasing?", "valid BST?"],
        rows: [
          ["10 / 5 \\ 15", "5, 10, 15", "yes", "yes"],
          ["10 / 5 \\ 15 with 15's left = 6", "5, 10, <b>6</b>, 15", "no", "no ✓ caught"],
          ["duplicates: 5 / 5", "5, 5", "<b>not strictly</b>", "depends on convention"],
        ],
        lesson: "In-order traversal is a genuinely simpler validation — a BST is exactly a tree whose in-order output is sorted — and it catches the ancestor case the parent-only check misses. The trap is that you must keep only the <b>previous value</b>, not build the whole list (O(n) memory for nothing), and you must decide whether equal is allowed before you pick <code>&lt;</code> or <code>&lt;=</code>.",
      },
    ],
  },

  "Lowest common ancestor": {
    edges: [
      { input: "One node is the ancestor of the other", effect: "The LCA is the ancestor itself. Code that insists on two non-null returns misses it.", fix: "Return the node as soon as it matches p or q — the recursion handles the rest." },
      { input: "A node is not present in the tree", effect: "Returns an ancestor of the one that IS present, which looks like a valid answer.", fix: "If presence is not guaranteed, count matches during the traversal and return null unless both were found." },
      { input: "p == q", effect: "The LCA is that node.", fix: "Falls out correctly. Worth stating." },
      { input: "Root is one of the nodes", effect: "Returns the root immediately without descending.", fix: "Correct and optimal." },
      { input: "Using the general algorithm on a BST", effect: "O(n) when O(h) is available.", fix: "In a BST, walk down while both targets are on the same side; the first node that splits them is the LCA. No recursion needed." },
      { input: "Repeated LCA queries", effect: "O(n) each is too slow for 10⁵ queries.", fix: "Binary lifting: O(n log n) preprocessing, O(log n) per query. Name it — this is the expected follow-up." },
    ],
    walk: [
      {
        title: "Simple — the split point",
        input: "     3\n    / \\\n   5   1     find LCA(5, 1)",
        cols: ["node", "left returns", "right returns", "verdict"],
        rows: [
          ["5", "—", "—", "matches p → return 5"],
          ["1", "—", "—", "matches q → return 1"],
          ["3", "5", "1", "<b>both non-null → 3 is the LCA</b>"],
        ],
        lesson: "Both sides returning non-null means the two targets are in different subtrees, so this node is where their paths diverge. That is the definition of lowest common ancestor.",
      },
      {
        title: "Harder — one node is an ancestor of the other",
        input: "     3\n    /\n   5\n    \\\n     6      find LCA(5, 6)",
        cols: ["node", "left", "right", "returns"],
        rows: [
          ["6", "—", "—", "matches q → 6"],
          ["5", "null", "6", "<b>matches p → returns 5 immediately</b>"],
          ["3", "5", "null", "one non-null → pass 5 up"],
        ],
        lesson: "Node 5 returns itself without waiting to see what its subtree found — and that is correct, because if q is below p then p is the ancestor. The early return is not a shortcut, it is the case that makes the algorithm complete.",
      },
      {
        title: "Hardest — the answer that is wrong when a node is absent",
        input: "same tree, find LCA(5, 99) where 99 does not exist",
        cols: ["node", "left", "right", "returns", "problem"],
        rows: [
          ["5", "—", "—", "5 (matches p)", "—"],
          ["3", "5", "null", "<b>5</b>", "<b>5 is reported as the LCA</b>"],
          ["truth", "—", "—", "—", "there is no LCA — 99 is not in the tree"],
        ],
        lesson: "The algorithm assumes both nodes exist, and when one does not it happily returns the other. Nothing errors. If the problem allows a missing node you must track whether both were actually found — a boolean pair threaded through the recursion, or a presence check first. Most solutions online omit this because LC 236 guarantees presence; the interviewer's follow-up usually does not.",
      },
    ],
  },

  "Bounded heap for top-k": {
    edges: [
      { input: "k > n", effect: "The heap never reaches size k, so <code>heap[0]</code> is the global minimum, not the k-th largest.", fix: "Clamp k to n, or decide what the answer means and say so." },
      { input: "k = 0", effect: "Empty heap; peek throws.", fix: "Return early, before the loop." },
      { input: "Wrong heap direction", effect: "A max-heap for k-th largest evicts the biggest, leaving the k smallest. Returns a plausible wrong number.", fix: "k-th LARGEST needs a MIN-heap. Java's PriorityQueue is min by default; C++'s priority_queue is MAX by default — the two languages disagree, which is why this is worth saying aloud." },
      { input: "Equal priorities in Python", effect: "<code>TypeError</code> when heapq compares the payload after the priority ties.", fix: "Push a tuple with a tiebreaker: <code>(priority, counter, item)</code>." },
      { input: "Duplicates in the input", effect: "k-th largest counts duplicates as separate elements unless the problem says distinct.", fix: "Read the problem. 'k-th largest' and 'k-th distinct largest' differ on [3,3,3]." },
      { input: "k close to n", effect: "O(n log k) approaches O(n log n) and the heap buys nothing.", fix: "Just sort. Say that the heap wins when k is small and the crossover exists." },
    ],
    walk: [
      {
        title: "Simple — 2nd largest of [3, 1, 5, 4] with a min-heap of size 2",
        input: "push, then evict whenever size exceeds k",
        cols: ["v", "heap before", "push", "size > k?", "heap after"],
        rows: [
          ["3", "[]", "[3]", "no", "[3]"],
          ["1", "[3]", "[1,3]", "no", "[1,3]"],
          ["5", "[1,3]", "[1,3,5]", "yes → pop 1", "[3,5]"],
          ["4", "[3,5]", "[3,4,5]", "yes → pop 3", "[4,5]"],
        ],
        lesson: "Answer heap[0] = 4, the 2nd largest. The min-heap keeps the weakest survivor on top so it is the one evicted — which is exactly why k-th LARGEST needs a MIN-heap.",
      },
      {
        title: "Harder — the same input with the wrong direction",
        input: "max-heap of size 2",
        cols: ["v", "heap after push", "pops the", "heap after"],
        rows: [
          ["3", "[3]", "—", "[3]"],
          ["1", "[3,1]", "—", "[3,1]"],
          ["5", "[5,3,1]", "<b>largest, 5</b>", "[3,1]"],
          ["4", "[4,3,1]", "<b>4</b>", "[3,1]"],
        ],
        lesson: "It returns 3 — the 2nd <em>smallest</em>. The bug is silent: the code runs, the heap stays size 2, and a number comes out. On a test where the answer happens to coincide it even passes. Say the direction out loud before writing the loop.",
      },
      {
        title: "Hardest — why the invariant survives every step",
        input: "the claim: the heap always holds the k best seen so far",
        cols: ["case", "what happens", "why the invariant holds"],
        rows: [
          ["heap not yet full", "push", "fewer than k seen, so all of them are the best"],
          ["v worse than the weakest survivor", "push then immediately pop v", "v is not in the top k of anything containing these k"],
          ["v better than the weakest", "push, pop the weakest", "the evicted one is beaten by k others, so it cannot be in the top k"],
        ],
        lesson: "Induction over the stream: each case preserves 'the heap is the top k of everything seen'. That is what licenses discarding elements permanently — and why this works on data too large to fit in memory, which is the follow-up they are usually driving at.",
      },
    ],
  },

  "Two heaps (running median)": {
    edges: [
      { input: "First element", effect: "One heap is empty; reading both tops throws.", fix: "The push-through-and-rebalance sequence handles it if you always push to the same heap first." },
      { input: "Pushing to whichever side 'looks right'", effect: "Ties and equal values break the size invariant, and the median drifts.", fix: "Always push through the low heap, pop its top across to high, then rebalance. Deterministic regardless of value." },
      { input: "Even vs odd count", effect: "Odd → one top is the median. Even → average the two. Getting the parity test backwards is off by one element.", fix: "Fix a convention: low is allowed the extra element. Then odd means low.top()." },
      { input: "Integer division on the average", effect: "(3+4)//2 = 3 in Python, not 3.5.", fix: "Divide by 2.0, or return a float type." },
      { input: "Removing elements (sliding window median)", effect: "Neither heap supports arbitrary deletion.", fix: "Lazy deletion with a map of pending removals, or a balanced BST / indexed multiset. Say that plain two-heaps does not support removal." },
      { input: "All identical values", effect: "Every median is that value; the rebalancing still runs every step.", fix: "Correct. Good test that the invariant does not depend on distinctness." },
    ],
    walk: [
      {
        title: "Simple — adding 1, 2, 3",
        input: "low = max-heap (lower half), high = min-heap (upper half)",
        cols: ["add", "push to low", "move top to high", "rebalance", "low / high", "median"],
        rows: [
          ["1", "low=[1]", "high=[1], low=[]", "low=[1], high=[]", "[1] / []", "1"],
          ["2", "low=[2,1]", "high=[2], low=[1]", "sizes 1,1 ok", "[1] / [2]", "1.5"],
          ["3", "low=[3,1]", "high=[2,3], low=[1]", "high bigger → low=[2,1]", "[2,1] / [3]", "2"],
        ],
        lesson: "Every element takes the same route — into low, top across to high, rebalance if high grew larger. No branching on value, which is why ties cannot break it.",
      },
      {
        title: "Harder — why pushing directly to the 'right' side fails",
        input: "adding 5 then 5 then 5, choosing the side by comparison",
        cols: ["step", "naive: 'v ≤ low.top → low'", "size invariant"],
        rows: [
          ["add 5", "low=[5]", "1 / 0 ok"],
          ["add 5", "5 ≤ 5 → low=[5,5]", "<b>2 / 0</b>"],
          ["add 5", "5 ≤ 5 → low=[5,5,5]", "<b>3 / 0 — broken</b>"],
        ],
        lesson: "With ties the comparison always sends the value to the same side, and the halves stop being halves. The median then reads off a heap holding everything. The push-through-and-rebalance sequence has no comparison in it at all, which is precisely why it cannot develop this bias.",
      },
      {
        title: "Hardest — the parity convention decides the code",
        input: "5 elements, low allowed the extra",
        cols: ["count", "sizes (low / high)", "median is", "if the convention were reversed"],
        rows: [
          ["4", "2 / 2", "(low.top + high.top) / 2", "same"],
          ["5", "<b>3 / 2</b>", "<b>low.top</b>", "high.top — a different element"],
          ["rebalance rule", "if high > low, move one back", "keeps low ≥ high", "flip the test too"],
        ],
        lesson: "The rebalance rule and the median read must agree on which side carries the extra element. Fix one and derive the other — mixing conventions gives you an answer that is correct on even counts and off by one element on odd ones, which is a test failure that looks random.",
      },
    ],
  },

  "Merge k sorted sequences": {
    edges: [
      { input: "Some lists empty", effect: "Seeding the heap with <code>lst[0]</code> throws on an empty list.", fix: "Skip empty lists when seeding. They contribute nothing." },
      { input: "All lists empty", effect: "Heap never fills; the loop does not run.", fix: "Returns empty. Correct — verify the return type." },
      { input: "Equal values across lists", effect: "Python compares the next tuple element, which may be the list object itself → <code>TypeError</code>.", fix: "Include the list index as a tiebreaker: <code>(value, listIndex, position)</code>." },
      { input: "k = 1", effect: "Degenerates to copying one list.", fix: "Correct, and cheap. No special case needed." },
      { input: "Concatenate-then-sort instead", effect: "O(n log n) rather than O(n log k). Fine when k is close to n.", fix: "Both are defensible — say which you chose and why. With k = 2 the heap is overkill." },
      { input: "Merging linked lists rather than arrays", effect: "Storing nodes in the heap works, but Java needs a comparator and Python needs the index tiebreaker for the same reason.", fix: "Relink rather than copy to keep it O(1) extra space beyond the heap." },
    ],
    walk: [
      {
        title: "Simple — merging [1,4], [2,6], [3]",
        input: "heap holds one candidate per list: (value, list, index)",
        cols: ["heap", "pop", "push next from that list", "output"],
        rows: [
          ["(1,0,0) (2,1,0) (3,2,0)", "1", "(4,0,1)", "[1]"],
          ["(2,1,0) (3,2,0) (4,0,1)", "2", "(6,1,1)", "[1,2]"],
          ["(3,2,0) (4,0,1) (6,1,1)", "3", "— list 2 exhausted", "[1,2,3]"],
          ["(4,0,1) (6,1,1)", "4", "— list 0 exhausted", "[1,2,3,4]"],
          ["(6,1,1)", "6", "—", "[1,2,3,4,6]"],
        ],
        lesson: "The heap never holds more than k entries regardless of how long the lists are. Each pop is O(log k) and there are n pops, so O(n log k) — the whole reason not to concatenate and sort.",
      },
      {
        title: "Harder — the tiebreaker that prevents a crash",
        input: "lists [5] and [5], heap entries as (value, list)",
        cols: ["entries", "Python comparison", "outcome"],
        rows: [
          ["(5, 0) and (5, 1)", "5 == 5, compare 0 vs 1", "fine — ints compare"],
          ["(5, [5,6]) and (5, [5,7])", "5 == 5, compare <b>list vs list</b>", "compares elementwise — works by luck"],
          ["(5, node) and (5, node)", "5 == 5, compare <b>ListNode vs ListNode</b>", "<b>TypeError</b>"],
        ],
        lesson: "Python's tuple comparison is lexicographic and only stops early when it finds a difference. Ties push it onto the next element, and if that is an object without an ordering it raises. The integer index is not decoration — it guarantees the comparison terminates on something comparable.",
      },
      {
        title: "Hardest — when the heap is the wrong choice",
        input: "n total elements across k lists",
        cols: ["k", "heap: O(n log k)", "concat + sort: O(n log n)", "better"],
        rows: [
          ["2", "n · 1", "n log n", "<b>either — sort is less code</b>"],
          ["10", "n · 3.3", "n log n", "heap"],
          ["k = n (all length 1)", "n log n", "n log n", "<b>identical — sort is simpler</b>"],
          ["streaming, cannot hold n", "O(k) memory", "<b>impossible</b>", "<b>heap</b>"],
        ],
        lesson: "The heap wins on memory, not always on time: it holds k entries where sorting holds n. When the lists are too large to materialise — merging sorted files, or a k-way stream — sorting is not an option at all. That memory argument, not the log factor, is the reason to reach for it.",
      },
    ],
  },
};
