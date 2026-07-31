import type { TopicPrimer } from "../types";

/**
 * Primers for the seven topics added after auditing which families real solved work
 * falls into. Same contract as PRIMERS_A/B: mental model first, then the invariant
 * that makes the technique valid, then costs, then when NOT to reach for it.
 *
 * Every SVG uses design tokens only — CI fails the build on a hardcoded colour, so
 * the diagrams re-theme with the rest of the app rather than being pinned to one
 * palette.
 */
const T = (x: number, y: number, t: string, fill = "var(--txt)", size = 11, anchor = "middle") =>
  `<text x="${x}" y="${y}" fill="${fill}" font-family="var(--mono)" font-size="${size}" text-anchor="${anchor}">${t}</text>`;
const R = (x: number, y: number, w: number, h: number, fill: string, stroke: string) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
const L = (x1: number, y1: number, x2: number, y2: number, stroke: string, dash = "") =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1.4"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;

const DIM = "var(--line2)";
const PANEL = "var(--panel2)";
const ACC = "var(--cyan)";
const WARN = "var(--mag)";

export const PRIMERS_C: readonly TopicPrimer[] = [
  {
    id: "math",
    oneLine:
      "Number theory is the topic where the constraint tells you the algorithm more loudly than anywhere else.",
    model:
      "Three tools cover almost every OA number-theory question. <b>Euclid's algorithm</b> for anything about common divisors — it shrinks a pair of numbers by repeated remainder, which is why it is logarithmic rather than linear in the value. <b>The sieve</b> for when you need primality across a whole range, trading O(n) memory for the ability to answer any query in O(1). <b>Modular arithmetic</b> for when the answer is astronomically large and the problem says 'mod 10⁹+7'.\n\nThe skill is reading the constraint. <code>n ≤ 10⁶</code> with repeated primality queries means sieve. A single <code>n ≤ 10¹²</code> primality check means trial division to √n. 'Return the answer modulo…' means every intermediate must be reduced, and in C++/Java it means casting to 64-bit before every multiply.",
    invariant:
      "Under a modulus, <b>addition, subtraction and multiplication are safe; division is not</b>. You may reduce at any point without changing the answer — but only for those three operations. Division requires the modular inverse, which exists only when the divisor is coprime to the modulus.",
    ops: [
      ["gcd(a, b)", "O(log min(a,b))", "worst case is consecutive Fibonacci numbers"],
      ["sieve to n", "O(n log log n)", "O(n) memory — the reason not to use it for one query"],
      ["primality of one n", "O(√n)", "trial division; no memory at all"],
      ["a^e mod m", "O(log e)", "square and halve; 10⁹ becomes ~30 steps"],
      ["modular inverse", "O(log m)", "Fermat, and only when m is prime"],
    ],
    reach: [
      "The problem says 'modulo 10⁹+7' — that is an instruction, not decoration.",
      "You need primality or factorisation for many values in a range.",
      "Anything about divisors, multiples, cycles that must re-sync, or reducing fractions.",
      "Counting problems whose exact answer would have hundreds of digits.",
    ],
    avoid: [
      "A single primality test on a large number — trial division to √n beats a sieve on both time and memory.",
      "Factorising a 64-bit semiprime. That is Pollard's rho territory and almost never the intended OA answer.",
      "Reaching for <code>double</code>. Floating point loses integer precision above 2⁵³ and every 'wrong by one' bug here traces back to it.",
    ],
    edges: [
      { input: "<code>(a - b) % MOD</code> in C++ or Java", effect: "Returns a negative remainder, unlike Python.", fix: "<code>((a - b) % MOD + MOD) % MOD</code>. The most common modular bug in C++ submissions." },
      { input: "<code>a * b</code> with both near 10⁹", effect: "Overflows int32 <em>before</em> the modulo runs, so the modulo cannot rescue it.", fix: "Cast one operand to 64-bit before multiplying, not after." },
      { input: "Sieve with n < 2", effect: "Writing <code>is_p[1] = False</code> indexes out of range.", fix: "Guard before allocating." },
      { input: "<code>lcm</code> as <code>a * b / g</code>", effect: "The product overflows while the answer would have fit.", fix: "<code>a / g * b</code> — the division is exact by definition." },
      { input: "Modular inverse with a composite modulus", effect: "Fermat's little theorem silently returns a wrong value.", fix: "Extended Euclid, and only when <code>gcd(a, m) = 1</code>." },
    ],
    svg:
      `<svg viewBox="0 0 460 130" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Euclid's algorithm reducing 48 and 18 to their gcd of 6">` +
      T(10, 18, "gcd(48, 18) — each step replaces the pair with (b, a mod b)", "var(--dim)", 10, "start") +
      [
        ["48", "18", 20],
        ["18", "12", 130],
        ["12", "6", 240],
        ["6", "0", 350],
      ]
        .map(([a, b, x]) => {
          const X = x as number;
          return (
            R(X, 40, 40, 30, PANEL, DIM) +
            R(X + 44, 40, 40, 30, PANEL, DIM) +
            T(X + 20, 60, a as string) +
            T(X + 64, 60, b as string, ACC) +
            (X < 350 ? L(X + 88, 55, X + 106, 55, DIM) : "")
          );
        })
        .join("") +
      T(370, 60, "6", "var(--lime)") +
      T(10, 96, "the last non-zero value is the answer: 6", "var(--dim)", 10, "start") +
      T(10, 114, "three remainder steps, not 48 subtractions", ACC, 10, "start") +
      `</svg>`,
    caption:
      "Each step replaces (a, b) with (b, a mod b). The modulo is what makes it logarithmic — repeated subtraction would take 48 steps to reach the same answer.",
  },

  {
    id: "intv",
    oneLine:
      "Sort the endpoints and the problem usually collapses into a single left-to-right pass.",
    model:
      "Two techniques that look similar and answer different questions. <b>Merging</b> sorts by start and walks forward, combining anything that overlaps the range being built — it answers 'what does the union look like'. <b>Sweeping</b> turns each interval into a <code>+1</code> at its start and a <code>−1</code> at its end, sorts the events, and tracks a running sum — it answers 'how many are active at once'.\n\n<b>Prefix sums</b> are the same idea one dimension down: precompute cumulative totals so any range query is a subtraction. The 2D version extends this with inclusion–exclusion, four lookups per rectangle regardless of its size. All three share one premise — do the expensive ordering work once, then answer each query in constant time.",
    invariant:
      "For merging: <b>once sorted by start, an interval can only overlap the one currently being built</b>, never an earlier output — which is what licenses the single pass. For prefix sums: <b>the underlying data must not change</b>. One update invalidates the whole table.",
    ops: [
      ["sort intervals", "O(n log n)", "dominates everything else in the topic"],
      ["merge pass", "O(n)", "after sorting; no nested comparison"],
      ["sweep line", "O(n log n)", "2n events, sorted once"],
      ["prefix build", "O(n) / O(mn)", "one pass"],
      ["range query", "O(1)", "two lookups in 1D, four in 2D"],
      ["point update", "O(n)", "prefix sums do not support it — use a Fenwick tree"],
    ],
    reach: [
      "Overlapping ranges: calendars, bookings, memory blocks, IP ranges.",
      "'Minimum rooms', 'peak concurrent', 'busiest moment' — that is a sweep.",
      "Many range-sum queries over data that never changes.",
      "A brute force that is O(n·q); prefix sums usually make it O(n + q).",
    ],
    avoid: [
      "Data that changes between queries — the prefix table goes stale silently. Use a Fenwick or segment tree.",
      "A difference array when coordinates run to 10⁹ but n is small. Sweep the events instead of the axis.",
      "Sorting by end when you meant to merge. That key is for the greedy 'most non-overlapping intervals' problem, which is a different question.",
    ],
    edges: [
      { input: "Empty interval list", effect: "Reading the last output element crashes before any answer exists.", fix: "Return early. The single most-hit edge case in this topic." },
      { input: "Touching intervals <code>[1,4]</code> and <code>[4,5]</code>", effect: "Merge or not depending on <code>&lt;=</code> vs <code>&lt;</code>.", fix: "The problem decides. State your choice out loud." },
      { input: "End and start at the same instant in a sweep", effect: "Processing the start first over-counts by one.", fix: "Sort ends before starts at equal time." },
      { input: "Fully contained interval", effect: "Overwriting the end shrinks the merged range.", fix: "<code>max(end, cur_end)</code>, always." },
      { input: "Prefix sums exceeding int32", effect: "A 200×200 grid of 10⁵ values totals 4×10⁹.", fix: "64-bit accumulator in C++ and Java." },
    ],
    svg:
      `<svg viewBox="0 0 460 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sweep line over three intervals showing a peak of two concurrent">` +
      T(10, 16, "sweep: +1 at each start, −1 at each end, track the running sum", "var(--dim)", 10, "start") +
      R(30, 30, 300, 14, PANEL, ACC) +
      T(180, 41, "[0, 30]", ACC, 9) +
      R(80, 50, 50, 14, PANEL, WARN) +
      T(105, 61, "[5,10]", WARN, 9) +
      R(180, 50, 50, 14, PANEL, WARN) +
      T(205, 61, "[15,20]", WARN, 9) +
      L(20, 78, 440, 78, DIM) +
      [
        [30, "+1", "1"],
        [80, "+1", "2"],
        [130, "−1", "1"],
        [180, "+1", "2"],
        [230, "−1", "1"],
        [330, "−1", "0"],
      ]
        .map(([x, d, c]) => {
          const X = x as number;
          return L(X, 74, X, 82, DIM) + T(X, 94, d as string, "var(--dim)", 9) + T(X, 110, c as string, c === "2" ? "var(--lime)" : "var(--txt)", 11);
        })
        .join("") +
      T(10, 110, "active", "var(--dim)", 9, "start") +
      T(10, 134, "peak = 2 → two rooms needed", "var(--lime)", 10, "start") +
      `</svg>`,
    caption:
      "Three intervals become six events. The running sum is the number active at that instant, so its maximum — 2 here — is the answer without ever comparing intervals pairwise.",
  },

  {
    id: "design",
    oneLine:
      "Design questions test whether you can compose two structures so that every operation stays O(1).",
    model:
      "No single data structure gives you everything. A hash map has O(1) lookup and no order. A linked list has O(1) splicing and no lookup. An array has O(1) indexing and O(n) deletion. <b>Design problems are almost always about combining two of them so their weaknesses cancel.</b>\n\nLRU is the canonical example: hash map for 'where is this key', doubly linked list for 'what was used least recently', and the map stores <em>pointers into the list</em> so you can splice in O(1). Once you see that shape you can rebuild LFU (map to frequency buckets), Insert-Delete-GetRandom (array plus index map), and All-O(1) from the same idea.\n\nThese rounds are also where Indian machine-coding formats live — Flipkart's 90-minute build and Zoho's three-hour system round expect a working, testable class, not a single function.",
    invariant:
      "<b>Every structure you keep must be updated on every mutating operation</b>, or they desynchronise. Most design bugs are not algorithmic — they are one container updated and the other forgotten, which produces wrong answers with no crash.",
    ops: [
      ["hash map lookup", "O(1) avg", "no ordering information at all"],
      ["doubly linked list splice", "O(1)", "needs a pointer to the node, not a value"],
      ["singly linked list delete", "O(n)", "must find the predecessor — why LRU needs doubly"],
      ["array index", "O(1)", "delete is O(n) unless you swap with the last element"],
      ["balanced BST", "O(log n)", "when you need order as well as lookup"],
    ],
    reach: [
      "'Design a cache / iterator / rate limiter / browser history.'",
      "The problem demands O(1) for two operations that no single structure gives together.",
      "A machine-coding round where a working class is the deliverable.",
    ],
    avoid: [
      "Reaching for a library shortcut without saying you know the manual version. <code>LinkedHashMap</code> and <code>OrderedDict</code> hide exactly the thing being tested.",
      "A singly linked list where you need middle deletion.",
      "Optimising before the API is correct. Get every operation right, then discuss the constant factor.",
    ],
    edges: [
      { input: "capacity = 0", effect: "Evicts what was just inserted, or crashes on an empty list.", fix: "Guard at construction." },
      { input: "<code>put</code> on an existing key at full capacity", effect: "Evicting before checking existence drops the wrong entry.", fix: "Existence check first; an update never grows the size." },
      { input: "<code>get</code> that does not reorder", effect: "Silently becomes least-recently-<em>inserted</em>.", fix: "Promote on read. That is what LRU means." },
      { input: "Unlinking without removing the map entry", effect: "Size never shrinks and eviction stops working.", fix: "Store the key inside the node so it can be deleted by key." },
      { input: "No sentinel nodes", effect: "Empty and single-element cases each need their own branch, and one is always wrong.", fix: "Sentinel head and tail. Two nodes remove every boundary case." },
    ],
    svg:
      `<svg viewBox="0 0 460 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="LRU cache: hash map pointing into a doubly linked list">` +
      T(10, 16, "hash map: key → node", "var(--dim)", 10, "start") +
      [
        ["1", 20],
        ["2", 20 + 46],
        ["3", 20 + 92],
      ]
        .map(([k, x]) => R(x as number, 24, 40, 22, PANEL, DIM) + T((x as number) + 20, 39, k as string, ACC))
        .join("") +
      T(10, 78, "doubly linked list: most recent → least recent", "var(--dim)", 10, "start") +
      R(20, 88, 34, 26, PANEL, DIM) +
      T(37, 105, "H", "var(--dim)", 10) +
      [
        ["3", 66],
        ["1", 132],
        ["2", 198],
      ]
        .map(([k, x]) => R(x as number, 88, 46, 26, PANEL, ACC) + T((x as number) + 23, 105, k as string, ACC))
        .join("") +
      R(264, 88, 34, 26, PANEL, DIM) +
      T(281, 105, "T", "var(--dim)", 10) +
      [54, 112, 178, 244].map((x) => L(x, 101, x + 12, 101, DIM)).join("") +
      L(40, 46, 78, 86, DIM, "3 3") +
      L(86, 46, 150, 86, DIM, "3 3") +
      L(132, 46, 216, 86, DIM, "3 3") +
      T(10, 138, "map finds the node, list knows the order — both O(1)", "var(--lime)", 10, "start") +
      `</svg>`,
    caption:
      "The map answers 'where is key 1', the list answers 'what is least recent'. Because the map stores node pointers, promoting an entry is a constant number of pointer rewires.",
  },

  {
    id: "sort",
    oneLine:
      "Most hard sorting problems are easy once you name the right comparison — the sort itself is library work.",
    model:
      "Three distinct skills wear the same label. <b>Custom comparators</b>: the algorithm is the comparison, not the sort. 'Largest number from concatenation' is just <code>a+b vs b+a</code>. <b>Divide and conquer</b>: merge sort's merge step can count things — inversions, reverse pairs, elements smaller to the right — because when you take from the right half you learn something about the entire remaining left half at once. <b>Order statistics</b>: quickselect finds the k-th element in O(n) average by discarding the half that cannot contain k.\n\nThe common thread is that sorting is rarely the answer by itself; it is the preprocessing that makes a one-pass answer possible.",
    invariant:
      "A comparator must define a <b>strict weak ordering</b>: irreflexive, antisymmetric, transitive. Break it — most commonly by returning true for equal elements — and <code>std::sort</code> may read out of bounds and Java throws a contract violation. This is a crash, not a wrong answer.",
    ops: [
      ["comparison sort", "O(n log n)", "the information-theoretic floor"],
      ["counting / radix sort", "O(n + k)", "only for small integer ranges"],
      ["merge sort", "O(n log n)", "stable, O(n) extra, the only good choice for linked lists"],
      ["quicksort", "O(n log n) avg", "O(n²) worst; not stable"],
      ["quickselect", "O(n) avg", "O(n²) worst without a random pivot"],
      ["heap for top-k", "O(n log k)", "no worst case — the safe choice under time pressure"],
    ],
    reach: [
      "The ordering is not the natural one — sort by a derived key.",
      "Counting pairs that would be O(n²) by brute force.",
      "You need one order statistic, not the whole sorted array.",
      "Sorting is the preprocessing that makes a greedy or two-pointer pass valid.",
    ],
    avoid: [
      "Sorting when a heap answers the question — top-k does not need a full sort.",
      "Quickselect on adversarial input without randomising the pivot.",
      "Assuming stability. <code>std::sort</code> and Java's primitive sort are not stable.",
      "<code>a - b</code> comparators on values that span the int range.",
    ],
    edges: [
      { input: "<code>a - b</code> as a comparator", effect: "Overflows and inverts the order on mixed-sign wide integers.", fix: "<code>Integer.compare</code>, or a genuine <code>&lt;</code>." },
      { input: "<code>&lt;=</code> in a C++ comparator", effect: "Not a strict weak ordering — can crash <code>std::sort</code>.", fix: "Strict less-than only." },
      { input: "Inversion count on n = 10⁵ reversed", effect: "n(n−1)/2 = 4,999,950,000 inversions — roughly twice the int32 ceiling.", fix: "<code>long long</code> in C++, <code>long</code> in Java. The sort itself is fine; it is the counter that silently wraps negative." },
      { input: "Quickselect on sorted input, fixed pivot", effect: "O(n²) — a standard grader test.", fix: "Randomise the pivot." },
      { input: "Mutating a sort key after sorting", effect: "The order silently becomes invalid and any later binary search is wrong.", fix: "Key on something immutable, or re-sort." },
    ],
    svg:
      `<svg viewBox="0 0 460 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Merge step counting inversions">` +
      T(10, 16, "merging [3,5] and [2,4] — taking from the right counts inversions", "var(--dim)", 10, "start") +
      T(30, 44, "left", "var(--dim)", 9, "start") +
      R(70, 32, 36, 24, PANEL, DIM) +
      T(88, 48, "3") +
      R(110, 32, 36, 24, PANEL, DIM) +
      T(128, 48, "5") +
      T(30, 82, "right", "var(--dim)", 9, "start") +
      R(70, 70, 36, 24, PANEL, WARN) +
      T(88, 86, "2", WARN) +
      R(110, 70, 36, 24, PANEL, WARN) +
      T(128, 86, "4", WARN) +
      L(160, 60, 190, 60, DIM) +
      T(210, 44, "take 2 → +2 inversions", WARN, 10, "start") +
      T(210, 62, "(3 and 5 both exceed it)", "var(--dim)", 9, "start") +
      T(210, 84, "take 4 → +1 inversion", WARN, 10, "start") +
      T(210, 102, "(only 5 remains on the left)", "var(--dim)", 9, "start") +
      T(10, 128, "total 3 — counted in O(1) per step, not by comparing pairs", "var(--lime)", 10, "start") +
      `</svg>`,
    caption:
      "When 2 is taken from the right half, every remaining left element is greater than it — so the whole count is added at once. That single line replaces the inner loop of an O(n²) scan.",
  },

  {
    id: "grid",
    oneLine:
      "A grid is either a graph in disguise or an indexing exercise — decide which before you write anything.",
    model:
      "Two families. <b>Traversal problems</b> — islands, flood fill, shortest path through cells — are graph problems where the neighbours are implied by the coordinates rather than stored in an adjacency list. Everything from the graphs topic applies directly; you just generate neighbours with a direction array.\n\n<b>Transform problems</b> — rotate, spiral, set-zeroes, transpose — are pure index manipulation, and the interesting constraint is almost always <em>in place, O(1) extra space</em>. The reliable technique is to decompose the transform into two simple passes rather than deriving one clever index formula: a 90° clockwise rotation is transpose-then-reverse-each-row, and both halves are obviously correct.",
    invariant:
      "<b>Bounds first, then value.</b> Every neighbour access must check <code>0 ≤ r &lt; m</code> and <code>0 ≤ c &lt; n</code> before reading the cell. Reversing the order reads out of bounds — which in C++ is silent corruption rather than an exception.",
    ops: [
      ["visit every cell", "O(mn)", "the floor for anything touching the whole grid"],
      ["BFS / DFS over cells", "O(mn)", "each cell enqueued once if visited is marked correctly"],
      ["transpose in place", "O(mn)", "square only; j must start at i+1"],
      ["binary search a sorted grid", "O(log mn)", "treat it as one flat array"],
      ["2D prefix sum query", "O(1)", "after an O(mn) build"],
    ],
    reach: [
      "Connected regions, flood fill, counting islands.",
      "Shortest path on a uniform grid — BFS, not Dijkstra, when every step costs the same.",
      "In-place transforms with an O(1) space follow-up.",
      "Row-sorted and column-sorted matrices, which allow a staircase search from a corner.",
    ],
    avoid: [
      "Recursive DFS on a 1000×1000 grid — 10⁶ frames will overflow the stack. Use an explicit stack or BFS.",
      "A visited set when you are allowed to mutate the grid; overwriting the cell is O(1) space.",
      "Deriving one clever rotation formula under time pressure when two passes are obviously right.",
    ],
    edges: [
      { input: "Empty grid or empty first row", effect: "<code>m[0]</code> throws before any work happens.", fix: "Check both — a grid of empty rows passes the first test." },
      { input: "Transposing with <code>j</code> from 0", effect: "Swaps every pair twice; the matrix is unchanged and nothing errors.", fix: "<code>j</code> from <code>i+1</code>." },
      { input: "Single row or column in a spiral", effect: "The bottom and left passes re-emit cells already output.", fix: "Re-check <code>top ≤ bot</code> and <code>left ≤ right</code> before the two reverse passes." },
      { input: "Marking visited on dequeue instead of enqueue", effect: "The same cell is enqueued many times; memory blows up on open grids.", fix: "Mark when you enqueue." },
      { input: "In-place rotation of a non-square grid", effect: "Indexes out of bounds — it is not possible in place.", fix: "Allocate a new grid, and say why." },
    ],
    svg:
      `<svg viewBox="0 0 460 140" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Rotate a 3 by 3 matrix by transposing then reversing each row">` +
      T(10, 16, "rotate 90° clockwise = transpose, then reverse each row", "var(--dim)", 10, "start") +
      [
        [20, ["1", "2", "3", "4", "5", "6", "7", "8", "9"], "original", DIM],
        [170, ["1", "4", "7", "2", "5", "8", "3", "6", "9"], "transpose", ACC],
        [320, ["7", "4", "1", "8", "5", "2", "9", "6", "3"], "reverse rows", "var(--lime)"],
      ]
        .map(([x, vals, label, col]) => {
          const X = x as number;
          const V = vals as string[];
          let out = T(X + 45, 40, label as string, "var(--dim)", 9);
          for (let i = 0; i < 9; i++) {
            const r = Math.floor(i / 3);
            const c = i % 3;
            out += R(X + c * 30, 48 + r * 26, 28, 24, PANEL, col as string) + T(X + c * 30 + 14, 64 + r * 26, V[i], col as string);
          }
          return out;
        })
        .join("") +
      L(140, 74, 162, 74, DIM) +
      L(290, 74, 312, 74, DIM) +
      T(10, 134, "two obvious passes beat one index formula you cannot verify", "var(--dim)", 10, "start") +
      `</svg>`,
    caption:
      "Column 0 of the original (1,4,7) ends up as row 0 reversed (7,4,1) — a 90° clockwise turn, built from two passes that are each individually easy to check.",
  },

  {
    id: "trie",
    oneLine:
      "A trie makes prefix questions cost the length of the prefix instead of the size of the dictionary.",
    model:
      "Each node represents one character, and the path from the root spells a prefix. A word is stored as a path, with a flag on the final node marking 'a word ends here'. Lookup walks one node per character, so it costs <b>O(word length) regardless of how many words are stored</b> — which is the property a hash set cannot offer, because hashing needs the entire key and destroys any prefix relationship.\n\nThe second, less obvious use is the <b>binary trie</b>: store numbers as 32-bit paths and you can find the maximum XOR partner for a value in O(32) by greedily walking toward the opposite bit at each level. That trick turns several 'maximum XOR' problems from O(n²) into O(n·32).",
    invariant:
      "<b>The end-of-word flag is the only thing distinguishing a stored word from a prefix of one.</b> Node existence proves a prefix exists; it proves nothing about a word. Conflating the two is the defining bug of the topic.",
    ops: [
      ["insert word", "O(L)", "L = word length"],
      ["search word", "O(L)", "must check the end flag"],
      ["startsWith", "O(L)", "must not check the end flag"],
      ["delete", "O(L)", "unset the flag; prune only if the node has no children"],
      ["memory", "O(total chars)", "26 pointers per node adds up fast in C++/Java"],
    ],
    reach: [
      "Autocomplete, spell-check, dictionary prefix queries.",
      "Word Search II — a trie prunes the DFS the moment a path stops being a prefix of any word.",
      "Maximum XOR pair or subarray, via a binary trie.",
      "Many queries against a fixed dictionary — build once, query cheaply.",
    ],
    avoid: [
      "Exact-match lookup only. A hash set is simpler and faster; the trie earns its memory only when prefixes matter.",
      "A 26-pointer array per node when the alphabet is not fixed lowercase — use a map per node.",
      "Very large dictionaries in C++/Java without checking the memory: 10⁶ nodes × 26 pointers × 8 bytes is roughly 200 MB.",
    ],
    edges: [
      { input: "<code>search</code> without the end flag", effect: "Inserting 'apple' makes 'app' report as a stored word.", fix: "Check the flag in <code>search</code>, not in <code>startsWith</code>." },
      { input: "One word a prefix of another", effect: "'app' and 'apple' share a path.", fix: "Works naturally — provided the flag lives on the node rather than being inferred from childlessness." },
      { input: "Non-lowercase input with a 26-slot array", effect: "<code>c - 'a'</code> goes out of range; silent corruption in C++.", fix: "Map per node, or assert the constraint." },
      { input: "Empty string inserted", effect: "Marks the root, so <code>search(\"\")</code> is true.", fix: "Usually right; confirm the problem allows it." },
      { input: "Deleting by pruning eagerly", effect: "Removes nodes still needed by a longer word.", fix: "Unset the flag; prune only nodes with no children and no flag." },
    ],
    svg:
      `<svg viewBox="0 0 460 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Trie storing app and apple, with end-of-word flags">` +
      T(10, 16, 'trie holding "app" and "apple"', "var(--dim)", 10, "start") +
      [
        ["root", 20, DIM, false],
        ["a", 90, DIM, false],
        ["p", 150, DIM, false],
        ["p", 210, "var(--lime)", true],
        ["l", 280, DIM, false],
        ["e", 340, "var(--lime)", true],
      ]
        .map(([ch, x, col, end]) => {
          const X = x as number;
          return (
            R(X, 50, 44, 30, PANEL, col as string) +
            T(X + 22, 70, ch as string, col as string) +
            (end ? T(X + 22, 98, "end", "var(--lime)", 9) : "")
          );
        })
        .join("") +
      [64, 134, 194, 254, 324].map((x) => L(x, 65, x + 26, 65, DIM)).join("") +
      T(10, 124, 'search("app") → node exists AND end = true → true', "var(--lime)", 10, "start") +
      T(10, 142, 'search("appl") → node exists, end = false → false', WARN, 10, "start") +
      `</svg>`,
    caption:
      "Both queries walk to a real node; only the end flag separates them. Without it, 'appl' would be reported as a stored word.",
  },

  {
    id: "dsu",
    oneLine:
      "Union-Find answers 'are these connected?' under a stream of merges, in effectively constant time.",
    model:
      "Every set is a tree, and the root identifies the set. <code>find</code> walks to the root; <code>union</code> links one root under another. Two optimisations make it fast: <b>path compression</b> flattens the tree during every find, and <b>union by rank</b> always hangs the shorter tree under the taller so trees never get deep. Together the amortised cost is inverse Ackermann — under 5 for any input that fits in memory.\n\nThe decisive property is that <code>union</code> <em>returns whether it did anything</em>. If both elements already share a root, the edge you were about to add closes a cycle. That one boolean solves cycle detection, Kruskal's MST, and redundant-connection problems without any extra machinery.",
    invariant:
      "<b>Always union roots, never raw elements.</b> <code>parent[a] = b</code> instead of <code>parent[find(a)] = find(b)</code> detaches whatever subtree <code>a</code> was carrying, producing wrong components with no crash and no warning.",
    ops: [
      ["find", "O(α(n)) ≈ O(1)", "amortised, with both optimisations"],
      ["union", "O(α(n)) ≈ O(1)", "two finds plus one pointer write"],
      ["connected?", "O(α(n))", "compare the two roots"],
      ["component count", "O(1)", "decrement on each successful union"],
      ["disconnect an edge", "not supported", "there is no un-union; process offline in reverse"],
    ],
    reach: [
      "Edges arriving incrementally, with connectivity questions in between.",
      "Counting connected components or friend circles.",
      "Cycle detection in an undirected graph.",
      "Kruskal's MST — sort edges, union, and skip the ones that return false.",
      "Merging accounts, emails, or any equivalence classes.",
    ],
    avoid: [
      "Directed graphs — Union-Find has no notion of direction. Use Tarjan for strongly connected components.",
      "Anything requiring edge removal.",
      "Shortest paths. DSU knows <em>whether</em> things connect, never how far apart they are.",
    ],
    edges: [
      { input: "<code>parent[a] = b</code> without <code>find</code>", effect: "Silently splits a set; component counts go wrong with no error.", fix: "Resolve both to roots first." },
      { input: "Union of already-connected nodes", effect: "Returns false, changes nothing.", fix: "That return value is the cycle detector — use it rather than adding a second pass." },
      { input: "Rank incremented on every union", effect: "Rank stops tracking height and the balancing degrades.", fix: "Increment only when the two ranks were equal." },
      { input: "Recursive <code>find</code> at n = 10⁵", effect: "A degenerate chain overflows the stack before compression can help.", fix: "Iterative path halving — same complexity, no stack." },
      { input: "Only one optimisation applied", effect: "O(log n) rather than near-constant. Usually still passes, occasionally not.", fix: "Both. Together they are four extra lines." },
    ],
    svg:
      `<svg viewBox="0 0 460 145" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Union-Find merging two trees and detecting a cycle">` +
      T(10, 16, "union(1,3): find both roots first, then link root under root", "var(--dim)", 10, "start") +
      R(40, 34, 40, 26, PANEL, ACC) +
      T(60, 51, "0", ACC) +
      R(20, 78, 40, 26, PANEL, DIM) +
      T(40, 95, "1", "var(--dim)") +
      L(56, 60, 44, 76, DIM) +
      R(150, 34, 40, 26, PANEL, ACC) +
      T(170, 51, "2", ACC) +
      R(130, 78, 40, 26, PANEL, DIM) +
      T(150, 95, "3", "var(--dim)") +
      L(166, 60, 154, 76, DIM) +
      T(105, 51, "+", "var(--dim)", 12) +
      L(200, 47, 226, 47, DIM) +
      R(300, 34, 40, 26, PANEL, "var(--lime)") +
      T(320, 51, "0", "var(--lime)") +
      R(250, 78, 40, 26, PANEL, DIM) +
      T(270, 95, "1", "var(--dim)") +
      R(350, 78, 40, 26, PANEL, DIM) +
      T(370, 95, "2", "var(--dim)") +
      L(312, 60, 280, 76, DIM) +
      L(332, 60, 364, 76, DIM) +
      R(400, 112, 40, 24, PANEL, DIM) +
      T(420, 128, "3", "var(--dim)") +
      L(378, 104, 404, 112, DIM) +
      T(10, 128, "one component; a later union(2,3) would return false — a cycle", "var(--lime)", 10, "start") +
      `</svg>`,
    caption:
      "Both trees resolve to their roots (0 and 2) before linking. Writing parent[1] = 3 instead would detach node 1 from 0 and leave three broken sets rather than one.",
  },
];
