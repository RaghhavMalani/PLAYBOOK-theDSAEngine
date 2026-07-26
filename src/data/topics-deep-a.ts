import type { TopicPrimer } from "../types";

/* Shared SVG helpers. Everything uses design tokens so the diagrams theme with
   the rest of the app rather than being pinned to one palette. */
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

export const PRIMERS_A: readonly TopicPrimer[] = [
  /* ============================== HASHING ============================== */
  {
    id: "hash",
    oneLine: "A hash map trades memory for the ability to answer 'have I seen this?' in constant time.",
    model:
      "Think of it as a very large array indexed by <em>content</em> rather than position. A hash function turns a key into an array index; the value lives there. Because the index is computed rather than searched for, lookup does not depend on how many items you have stored — that is the whole product.\n\nWhen two keys hash to the same slot (a <b>collision</b>), the implementation stores both: either chained in a list at that slot, or pushed to the next free slot (open addressing). Collisions are why the O(1) is <em>average</em> and not worst case.\n\nThe practical skill is not implementing one. It is <b>noticing when a problem is secretly asking a membership question</b>. 'Find two numbers summing to k' is really 'for each number, have I seen its complement?'. 'Are these anagrams' is 'do these two multisets match?'. Once you see the membership question, the code writes itself.",
    invariant:
      "Keys must be <b>immutable and hashable</b>, and equality must agree with the hash: if two keys are equal, their hashes must be equal. Mutate a key after insertion and it becomes unreachable — it hashes to a new slot while sitting in the old one.",
    ops: [
      ["insert / update", "O(1) avg", "amortised — occasional rehash copies everything"],
      ["lookup", "O(1) avg", "O(n) worst case under collisions"],
      ["delete", "O(1) avg", "open addressing needs tombstones, not blanks"],
      ["iterate", "O(capacity)", "not O(size) — sparse maps iterate slowly"],
      ["ordered iteration", "not supported", "use a tree map: O(log n) ops, sorted"],
    ],
    reach: [
      "Counting anything — frequencies, duplicates, 'how many times'",
      "Membership tests inside a loop that would otherwise be a nested scan",
      "Grouping by a computed key (anagrams, canonical forms)",
      "Memoising a recursion where the state is not a small integer",
      "Prefix-sum counting, where the key is a running total",
    ],
    avoid: [
      "You need sorted order or range queries → a balanced tree (<code>std::map</code>, <code>TreeMap</code>)",
      "Keys are small dense integers → a plain array is faster and simpler",
      "You need the <em>k</em> smallest → a heap, not a map",
      "Memory is the binding constraint → a hash map costs roughly 3× an array of the same data",
    ],
    edges: [
      { input: "Empty input", effect: "The map is empty and <code>max()</code> over it throws.", fix: "Guard before reducing: <code>if not cnt: return default</code>." },
      { input: "All elements identical", effect: "One key with count n. Anything assuming ≥2 distinct keys breaks.", fix: "Test with <code>[7,7,7]</code> — it catches most off-by-one grouping bugs." },
      { input: "Key is a mutable list", effect: "Python raises <code>TypeError: unhashable</code>; Java silently hashes by identity.", fix: "Convert to a tuple in Python, a String or record in Java. Never <code>int[]</code> as a Java key." },
      { input: "Adversarial keys (competitive judges)", effect: "Every key collides; <code>unordered_map</code> degrades to O(n) per op and TLEs.", fix: "In C++, add a random-seeded custom hash. This is a real attack on Codeforces, less so on OA platforms." },
      { input: "Negative numbers with modulo keys", effect: "<code>-7 % 5</code> is <code>-2</code> in C++/Java, <code>3</code> in Python — different buckets.", fix: "Normalise: <code>((x % k) + k) % k</code>." },
    ],
    caption: "A key is hashed to a slot. Two keys landing in the same slot chain there — that chain is why O(1) is average, not worst case.",
    svg: `<svg viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg">
  ${S.txt(60, 22, "keys", "var(--dim)", 10)}
  ${S.cell(20, 32, 80, 24, PANEL, DIM)}${S.txt(60, 48, '"eat"', "var(--txt)")}
  ${S.cell(20, 64, 80, 24, PANEL, DIM)}${S.txt(60, 80, '"tea"', "var(--txt)")}
  ${S.cell(20, 96, 80, 24, PANEL, DIM)}${S.txt(60, 112, '"bat"', "var(--txt)")}

  ${S.txt(175, 22, "hash()", "var(--mag)", 10)}
  ${S.cell(140, 42, 70, 66, "rgba(255,61,154,.08)", "var(--mag)")}
  ${S.txt(175, 80, "h(k)", "var(--mag)")}
  ${S.line(100, 44, 140, 60, DIM)}
  ${S.line(100, 76, 140, 74, DIM)}
  ${S.line(100, 108, 140, 90, DIM)}

  ${S.txt(300, 22, "slots", "var(--dim)", 10)}
  ${[0, 1, 2, 3, 4].map((i) => S.cell(250, 32 + i * 30, 100, 24, PANEL, DIM) + S.txt(263, 48 + i * 30, String(i), "#4A456E", 9)).join("")}
  ${S.line(210, 75, 250, 68, "var(--mag)")}
  ${S.line(210, 75, 250, 158, "var(--mag)")}

  ${S.cell(360, 32, 84, 24, "rgba(56,232,255,.12)", "var(--cyan)")}${S.txt(402, 48, '"eat"', "var(--cyan)")}
  ${S.cell(452, 32, 84, 24, "rgba(56,232,255,.12)", "var(--cyan)")}${S.txt(494, 48, '"tea"', "var(--cyan)")}
  ${S.line(350, 44, 360, 44, "var(--cyan)")}
  ${S.line(444, 44, 452, 44, "var(--cyan)")}
  ${S.txt(545, 48, "collision", "var(--amb)", 9, "start")}
  ${S.txt(545, 60, "chained", "var(--amb)", 9, "start")}

  ${S.cell(360, 152, 84, 24, "rgba(91,255,165,.12)", "var(--lime)")}${S.txt(402, 168, '"bat"', "var(--lime)")}
  ${S.line(350, 164, 360, 164, "var(--lime)")}
  ${S.txt(545, 168, "no collision", "var(--lime)", 9, "start")}
</svg>`,
  },

  /* ============================== STRINGS ============================== */
  {
    id: "str",
    oneLine: "Strings are arrays of characters with one extra property that changes everything: in most languages they are immutable.",
    model:
      "Almost every string problem is an array problem wearing a costume. Sliding window, two pointers, prefix sums, hash maps — all apply unchanged. What differs is the <b>alphabet</b>, which is usually small (26 letters, 128 ASCII), and that turns 'a hash map of characters' into 'a 26-length array', which is both faster and easier to reason about.\n\nThe property that genuinely differs is immutability. In Python and Java a string cannot be edited in place, so every 'modification' allocates a new one. That is why you accumulate into a list or a <code>StringBuilder</code> and join once. C++'s <code>std::string</code> <em>is</em> mutable, so this class of bug does not exist there.\n\nFor the harder tier, the question becomes: can you avoid re-comparing characters you have already compared? That is the shared idea behind KMP, the Z-function and rolling hashes — all three are ways of remembering previous comparisons so the scan never backtracks.",
    invariant:
      "For window techniques on strings: the property must be monotone in the window. For prefix-function techniques: <code>pi[i]</code> / <code>z[i]</code> depend only on characters at or before i, which is what makes a single left-to-right pass valid.",
    ops: [
      ["index a character", "O(1)", "but Python indexing returns a new 1-char string"],
      ["concatenate", "O(n+m)", "in a loop this is the classic accidental O(n²)"],
      ["substring / slice", "O(k)", "Java 7+ copies; it is not a view any more"],
      ["compare", "O(min(n,m))", "early exit on first difference"],
      ["find substring (builtin)", "O(n·m) worst", "fine in practice; KMP for adversarial input"],
      ["KMP / Z build", "O(n)", "amortised — the pointer never moves backwards"],
    ],
    reach: [
      "Anything about substrings, prefixes, suffixes or palindromes",
      "Character-frequency problems — use a 26-length array, not a map",
      "Pattern matching where the naive O(n·m) would TLE",
      "Parsing and tokenising, usually with a stack",
    ],
    avoid: [
      "Building output by repeated concatenation → collect and join",
      "Sorting each string to canonicalise when strings are long → count array is O(k) not O(k log k)",
      "Hand-rolling KMP under time pressure when the builtin will pass → use the builtin, say you'd use KMP for adversarial input",
    ],
    edges: [
      { input: "Empty string", effect: "Loops do not execute; <code>s[0]</code> throws; a window of size 0 is 'valid' for many predicates.", fix: "Decide explicitly what the answer for <code>\"\"</code> is and test it first." },
      { input: "Single character", effect: "Two-pointer palindrome checks pass trivially; expand-around-centre has no even centre.", fix: "Both centre types must still be attempted." },
      { input: "All identical characters", effect: "<code>aaaa…</code> makes the Z-function O(n²) without the window cap, and breaks sliding-window dedup logic.", fix: "This is the standard adversarial input — test it every time." },
      { input: "Unicode / non-ASCII", effect: "A 26-length array indexes out of bounds; <code>len()</code> counts code points, not user-visible characters.", fix: "Use a map, or state the ASCII assumption out loud." },
      { input: "Mixed case", effect: "'Aa' is a palindrome case-insensitively but not otherwise.", fix: "Normalise up front and say you are doing it." },
    ],
    caption: "Sliding a window over a string: both pointers only ever move right, so the total work is 2n even though the code has a nested loop.",
    svg: `<svg viewBox="0 0 640 170" xmlns="http://www.w3.org/2000/svg">
  ${"abcabcbb".split("").map((c, i) => {
    const inWin = i >= 2 && i <= 4;
    return S.cell(40 + i * 62, 60, 54, 40, inWin ? "rgba(56,232,255,.14)" : PANEL, inWin ? "var(--cyan)" : DIM) +
      S.txt(67 + i * 62, 85, c, inWin ? "var(--cyan)" : "var(--txt)", 15) +
      S.txt(67 + i * 62, 116, String(i), "#4A456E", 9);
  }).join("")}
  <rect x="158" y="52" width="182" height="56" rx="3" fill="none" stroke="var(--cyan)" stroke-width="1.4" stroke-dasharray="4 3"/>
  ${S.txt(167, 42, "left", "var(--amb)", 10, "start")}
  ${S.line(167, 46, 167, 56, "var(--amb)")}
  ${S.txt(315, 42, "right", "var(--mag)", 10, "start")}
  ${S.line(315, 46, 315, 56, "var(--mag)")}
  ${S.txt(40, 145, "both pointers move right only  →  each index enters once and leaves once  →  2n moves", "var(--dim)", 11, "start")}
</svg>`,
  },

  /* ======================= ARRAYS & TWO POINTERS ======================= */
  {
    id: "arr",
    oneLine: "A contiguous block of memory where the index arithmetic is the whole advantage — and where most interview questions live.",
    model:
      "An array gives you O(1) access because the address of element i is just <code>base + i × size</code>. Everything else about arrays follows from that one fact: random access is free, insertion in the middle is not, and iterating in order is dramatically faster than jumping around because the hardware fetches a whole cache line at a time.\n\nThe technique family that dominates array interviews is <b>pointer discipline</b>. Instead of nested loops, you maintain one or more indices with a rule about when each may move, plus an invariant that justifies never moving them backwards. Two pointers converging, a sliding window expanding and contracting, a read pointer with a slower write pointer — all the same idea, different rules.\n\nThe second family is <b>precomputation</b>: prefix sums turn a range query into a subtraction, difference arrays turn a range update into two writes. Both trade O(n) setup for O(1) per operation, which is the right trade whenever there are many operations.",
    invariant:
      "For converging pointers: everything outside <code>[lo, hi]</code> has been <em>eliminated</em>, not merely skipped — you must be able to argue no answer was lost. For read/write compaction: <code>write ≤ read</code> always, which is what makes overwriting in place safe.",
    ops: [
      ["access by index", "O(1)", "the reason arrays exist"],
      ["append", "O(1) amortised", "occasional realloc copies everything"],
      ["insert / delete at front", "O(n)", "shifts every element — use a deque"],
      ["search unsorted", "O(n)", "no structure to exploit"],
      ["search sorted", "O(log n)", "binary search"],
      ["prefix-sum range query", "O(1) after O(n) build", "static arrays only"],
      ["range update, read at end", "O(1) per update", "difference array"],
    ],
    reach: [
      "Sorted input and you need a pair, triplet, or a partition point",
      "'Contiguous' appears anywhere in the problem — subarray, substring, window",
      "In-place rearrangement with an O(1) space requirement",
      "Many range queries on data that does not change",
    ],
    avoid: [
      "Frequent insertion in the middle → linked list, or rethink the problem",
      "Frequent front operations → deque",
      "Range queries interleaved with updates → segment tree or Fenwick",
      "Membership testing in a loop → set",
    ],
    edges: [
      { input: "n = 0", effect: "<code>a[0]</code> throws; <code>hi = len(a) - 1</code> is −1; <code>a.size() - 1</code> in C++ wraps to a huge unsigned.", fix: "Guard first. In C++ compare as <code>i + 1 < (int)v.size()</code>." },
      { input: "n = 1", effect: "Converging pointers never enter the loop; anything reading <code>a[1]</code> is out of bounds.", fix: "Decide the answer for a single element explicitly." },
      { input: "All negative", effect: "Kadane seeded with 0 returns 0 instead of the least-negative element.", fix: "Seed from <code>a[0]</code>, never 0. This single case fails more submissions than any other." },
      { input: "Duplicates", effect: "3Sum emits duplicate triplets; cyclic sort loops forever with an index-based guard.", fix: "Skip equal pivots AND equal partners; guard cyclic sort on <code>a[i] != a[j]</code>." },
      { input: "Sum exceeds int", effect: "10⁵ values of 10⁵ each is 10¹⁰ — overflows int32 silently.", fix: "<code>long long</code> / <code>long</code>. Python is immune, which is why the habit does not transfer." },
      { input: "Already sorted / reverse sorted", effect: "Best and worst case for many algorithms; quicksort with a naive pivot degrades to O(n²).", fix: "Test both. Randomise or use median-of-three pivots." },
    ],
    caption: "Converging two pointers. The sum is too small, so a[lo] can never reach the target with any partner — lo is eliminated, not just skipped.",
    svg: `<svg viewBox="0 0 640 180" xmlns="http://www.w3.org/2000/svg">
  ${[2, 7, 11, 15, 19, 24].map((v, i) => {
    const active = i === 1 || i === 5;
    const dead = i === 0;
    return S.cell(50 + i * 92, 56, 78, 42, dead ? "rgba(255,61,154,.10)" : active ? "rgba(255,182,39,.14)" : PANEL,
      dead ? "var(--mag)" : active ? "var(--amb)" : DIM) +
      S.txt(89 + i * 92, 82, String(v), dead ? "var(--mag)" : active ? "var(--amb)" : "var(--txt)", 14) +
      S.txt(89 + i * 92, 114, String(i), "#4A456E", 9);
  }).join("")}
  ${S.txt(89, 138, "eliminated", "var(--mag)", 9)}
  ${S.txt(181, 42, "lo", "var(--amb)", 10)}
  ${S.line(181, 46, 181, 54, "var(--amb)")}
  ${S.txt(549, 42, "hi", "var(--amb)", 10)}
  ${S.line(549, 46, 549, 54, "var(--amb)")}
  ${S.txt(50, 165, "7 + 24 = 31 < target 40  →  24 is already the biggest partner for 7, so no pair using 7 can work", "var(--dim)", 11, "start")}
</svg>`,
  },

  /* =========================== BINARY SEARCH =========================== */
  {
    id: "bs",
    oneLine: "Halving a search space repeatedly — and the hard part is realising the space is often the answer, not the array.",
    model:
      "Binary search needs exactly one thing: a <b>monotone predicate</b>. Some property is false for a while and then true forever (or the reverse). Given that, you can find the boundary in log n probes by repeatedly discarding the half that cannot contain it.\n\nThe easy version is searching a sorted array, where the predicate is <code>a[i] ≥ target</code>. The version that decides interviews is <b>binary search on the answer</b>: you are asked to minimise a maximum, and there is no sorted array in sight. You invent one by asking 'is a budget of x feasible?' — that predicate is monotone, so you binary search x. The reframe from <em>optimise</em> to <em>verify</em> is the whole technique.\n\nThere are exactly two templates and they are not interchangeable. Learn both or you will infinite-loop.",
    invariant:
      "The answer always lies inside the live interval. Never discard the side that might contain it: if <code>a[mid] ≥ target</code>, mid <em>might be</em> the answer, so write <code>hi = mid</code> and not <code>hi = mid - 1</code>.",
    ops: [
      ["search sorted array", "O(log n)", "requires random access — not linked lists"],
      ["lower_bound", "O(log n)", "first index with a[i] ≥ x; also the insertion point"],
      ["upper_bound", "O(log n)", "first index with a[i] > x"],
      ["count of x", "O(log n)", "upper − lower"],
      ["binary search on answer", "O(n log range)", "the feasibility check dominates"],
      ["on a float answer", "~100 iterations", "fixed count; never loop on lo < hi with floats"],
    ],
    reach: [
      "Sorted data, or data you can afford to sort",
      "'Minimise the maximum' / 'maximise the minimum' / 'smallest k that works'",
      "A rotated sorted array — one half is always still sorted",
      "The answer space is huge but the feasibility check is cheap",
    ],
    avoid: [
      "The predicate is not monotone → binary search returns a confident wrong answer",
      "Data is a linked list → no random access, so no halving",
      "n is small → a linear scan is simpler and less error-prone under pressure",
    ],
    edges: [
      { input: "Target absent", effect: "<code>lower_bound</code> returns the insertion point, which may be <code>len(a)</code>.", fix: "Check <code>lo < n and a[lo] == target</code> before dereferencing." },
      { input: "Duplicates of the target", effect: "Plain binary search returns an arbitrary one of them.", fix: "Use lower_bound for the first and upper_bound for the last. Do not scan linearly from the hit — that reintroduces O(n)." },
      { input: "lo + hi near INT_MAX", effect: "<code>(lo+hi)/2</code> overflows to negative and indexes out of bounds.", fix: "<code>lo + (hi - lo) / 2</code>. Python is immune." },
      { input: "You need the LAST true, not the first", effect: "The lower-bound template with <code>lo = mid</code> infinite-loops the moment <code>hi == lo + 1</code>.", fix: "Round the midpoint UP: <code>lo + (hi - lo + 1) / 2</code>. This is the single most common binary search failure." },
      { input: "Rotated array with duplicates", effect: "<code>a[lo] == a[mid]</code> tells you nothing about which half is sorted; worst case degrades to O(n).", fix: "Shrink lo by one and continue. State that the bound is now O(n) — LC 154 tests exactly this." },
      { input: "hi set to an unachievable bound", effect: "Returns a value that no configuration achieves.", fix: "Set hi to something real: <code>max(a)</code> or <code>sum(a)</code>." },
    ],
    caption: "The two templates. Left: first-true, floor midpoint, hi = mid. Right: last-true, CEILING midpoint, lo = mid. Swapping the midpoint rounding infinite-loops.",
    svg: `<svg viewBox="0 0 640 210" xmlns="http://www.w3.org/2000/svg">
  ${S.txt(20, 20, "FIRST true  ·  hi = mid  ·  floor midpoint", "var(--cyan)", 10, "start")}
  ${["F", "F", "F", "T", "T", "T"].map((c, i) =>
    S.cell(20 + i * 46, 30, 40, 30, c === "T" ? "rgba(91,255,165,.13)" : "rgba(255,61,154,.09)", c === "T" ? "var(--lime)" : "var(--mag)") +
    S.txt(40 + i * 46, 50, c, c === "T" ? "var(--lime)" : "var(--mag)", 12)).join("")}
  ${S.line(157, 66, 157, 78, "var(--cyan)")}
  ${S.txt(157, 92, "answer", "var(--cyan)", 10)}
  ${S.txt(20, 118, "mid = lo + (hi-lo)/2", "var(--dim)", 10, "start")}
  ${S.txt(20, 134, "if pred(mid): hi = mid", "var(--dim)", 10, "start")}
  ${S.txt(20, 150, "else:         lo = mid+1", "var(--dim)", 10, "start")}

  ${S.line(320, 14, 320, 200, DIM, "3 3")}

  ${S.txt(350, 20, "LAST true  ·  lo = mid  ·  CEILING midpoint", "var(--amb)", 10, "start")}
  ${["T", "T", "T", "F", "F", "F"].map((c, i) =>
    S.cell(350 + i * 46, 30, 40, 30, c === "T" ? "rgba(91,255,165,.13)" : "rgba(255,61,154,.09)", c === "T" ? "var(--lime)" : "var(--mag)") +
    S.txt(370 + i * 46, 50, c, c === "T" ? "var(--lime)" : "var(--mag)", 12)).join("")}
  ${S.line(441, 66, 441, 78, "var(--amb)")}
  ${S.txt(441, 92, "answer", "var(--amb)", 10)}
  ${S.txt(350, 118, "mid = lo + (hi-lo+1)/2", "var(--amb)", 10, "start")}
  ${S.txt(350, 134, "if pred(mid): lo = mid", "var(--dim)", 10, "start")}
  ${S.txt(350, 150, "else:         hi = mid-1", "var(--dim)", 10, "start")}
  ${S.txt(350, 176, "drop the +1 here and it", "var(--mag)", 10, "start")}
  ${S.txt(350, 190, "loops forever at hi = lo+1", "var(--mag)", 10, "start")}
</svg>`,
  },

  /* ========================== LINKED LISTS ========================== */
  {
    id: "ll",
    oneLine: "Nodes connected by pointers — O(1) splice if you are already there, and getting there is the whole problem.",
    model:
      "A linked list gives up random access to gain O(1) insertion and deletion <em>at a position you already hold</em>. That qualifier is doing all the work: reaching position i is O(i), so the O(1) splice is usually preceded by an O(n) walk, which is why arrays beat lists in practice far more often than the complexity table suggests.\n\nInterview linked-list problems are almost entirely <b>pointer choreography</b>. Three moves cover most of them: a <b>dummy head</b> so the first node is not a special case, <b>three-pointer reversal</b> (save next, flip, advance), and <b>two pointers at different speeds</b> for cycles and midpoints.\n\nThe reason they get asked is that they are unforgiving. There is no index to fall back on, so an off-by-one becomes a null dereference or an infinite loop rather than a wrong number — which makes them a clean test of whether you can hold a mutating structure in your head.",
    invariant:
      "At every step you must know exactly which nodes are reachable. When reversing, <code>prev</code> heads the reversed prefix and <code>cur</code> heads the untouched suffix; losing <code>next</code> before overwriting <code>cur.next</code> orphans everything after it.",
    ops: [
      ["access by index", "O(n)", "no arithmetic shortcut — this is the cost"],
      ["insert / delete at a held node", "O(1)", "the entire selling point"],
      ["insert at head", "O(1)", "with a dummy head, no special case"],
      ["search", "O(n)", "and cache-hostile: every hop is a dependent load"],
      ["reverse", "O(n) / O(1) space", "iteratively; the recursive version is O(n) stack"],
      ["detect a cycle", "O(n) / O(1) space", "Floyd's; a hash set would be O(n) space"],
    ],
    reach: [
      "The problem hands you a list — you rarely choose this structure",
      "O(1) space is required and you can rewire rather than copy",
      "Merging sorted sequences without extra memory",
      "LRU caches, where you splice known nodes to the front",
    ],
    avoid: [
      "You need indexing or binary search → array",
      "You need speed on real hardware → array wins even at equal complexity, because pointer chasing defeats the prefetcher",
      "Deep recursion on 10⁵ nodes → iterate, or the stack dies",
    ],
    edges: [
      { input: "Empty list (head is null)", effect: "Every <code>head.next</code> throws.", fix: "A dummy head removes most of these branches entirely." },
      { input: "Single node", effect: "Fast/slow both start at head; reversal returns head unchanged; 'remove the second' has no target.", fix: "Trace n=1 on paper before you write the loop." },
      { input: "Two nodes", effect: "The smallest case where 'middle' is ambiguous — slow lands on the second.", fix: "For the first middle, start fast at <code>head.next</code>. Say which convention you are using." },
      { input: "Even-length list in fast/slow", effect: "<code>fast.next.next</code> dereferences null.", fix: "Guard BOTH <code>fast</code> and <code>fast.next</code> before the double step." },
      { input: "The head itself is removed", effect: "Returning the saved <code>head</code> returns a detached node.", fix: "Return <code>dummy.next</code>, never the original head." },
      { input: "A cycle exists", effect: "Any length or traversal loop runs forever.", fix: "Floyd's first if a cycle is possible; do not assume termination." },
    ],
    caption: "Iterative reversal. Save next before flipping, or everything after cur is orphaned — that one line is the whole algorithm.",
    svg: `<svg viewBox="0 0 640 190" xmlns="http://www.w3.org/2000/svg">
  ${S.txt(20, 20, "before", "var(--dim)", 10, "start")}
  ${[1, 2, 3, 4].map((v, i) =>
    S.cell(20 + i * 110, 30, 62, 34, PANEL, DIM) + S.txt(51 + i * 110, 52, String(v), "var(--txt)", 13) +
    (i < 3 ? S.line(82 + i * 110, 47, 128 + i * 110, 47, DIM) +
      `<polygon points="${128 + i * 110},47 ${121 + i * 110},43 ${121 + i * 110},51" fill="${DIM}"/>` : "")).join("")}

  ${S.txt(20, 100, "mid-flip", "var(--dim)", 10, "start")}
  ${[1, 2, 3, 4].map((v, i) => {
    const done = i <= 1;
    return S.cell(20 + i * 110, 110, 62, 34, done ? "rgba(91,255,165,.12)" : PANEL, done ? "var(--lime)" : DIM) +
      S.txt(51 + i * 110, 132, String(v), done ? "var(--lime)" : "var(--txt)", 13);
  }).join("")}
  ${S.line(128, 127, 82, 127, "var(--lime)")}
  <polygon points="82,127 89,123 89,131" fill="var(--lime)"/>
  ${S.line(238, 127, 292, 127, "var(--amb)")}
  <polygon points="292,127 285,123 285,131" fill="var(--amb)"/>
  ${S.txt(148, 100, "prev", "var(--lime)", 10)}
  ${S.line(148, 104, 148, 108, "var(--lime)")}
  ${S.txt(258, 100, "cur", "var(--mag)", 10)}
  ${S.line(258, 104, 258, 108, "var(--mag)")}
  ${S.txt(368, 100, "next", "var(--amb)", 10)}
  ${S.line(368, 104, 368, 108, "var(--amb)")}
  ${S.txt(20, 172, "nxt = cur.next  →  cur.next = prev  →  prev = cur  →  cur = nxt", "var(--dim)", 11, "start")}
</svg>`,
  },

  /* ======================== STACKS & QUEUES ======================== */
  {
    id: "stk",
    oneLine: "Two disciplines for choosing what to process next: most-recent-first (stack) or oldest-first (queue).",
    model:
      "A stack models 'the most recent unfinished thing'. That makes it the natural fit for nesting — brackets, expression parsing, and function calls, which is literally what the call stack is. A queue models 'process in arrival order', which is what makes BFS explore by distance.\n\nThe interview-relevant version is the <b>monotonic</b> variant. Keep the stack sorted (say, decreasing) and it becomes a store of <em>useful candidates</em>: anything smaller than a later element can never be the 'next greater' for anyone further right, so you pop it and never look at it again. Each index is pushed once and popped once, which is why an apparently nested loop is O(n).\n\nThe monotonic <b>deque</b> is the same idea with expiry added: you also evict from the front when indices fall out of a window, which is how sliding-window maximum gets to O(n) instead of O(n log k).",
    invariant:
      "For a monotonic stack: values from bottom to top are strictly ordered. That ordering is what makes the top the nearest useful candidate — and what makes the amortised argument work, since a violated ordering is immediately popped.",
    ops: [
      ["push / pop / top", "O(1)", "amortised for a vector-backed stack"],
      ["queue enqueue / dequeue", "O(1)", "use a deque, never list.pop(0)"],
      ["monotonic stack full pass", "O(n)", "each index pushed once, popped once"],
      ["monotonic deque window", "O(n)", "vs O(n log k) for a heap"],
      ["min-stack getMin", "O(1)", "with an auxiliary stack, O(n) extra space"],
      ["queue from two stacks", "O(1) amortised", "worst case O(n) on a single dequeue"],
    ],
    reach: [
      "Next / previous greater or smaller element",
      "Histograms, spans, trapped water, rectangle areas",
      "Bracket matching, expression evaluation, nested decoding",
      "Sliding window minimum or maximum",
      "BFS (queue) and iterative DFS (stack)",
    ],
    avoid: [
      "Python <code>list.pop(0)</code> as a queue → O(n) per call, quietly O(n²); use <code>collections.deque</code>",
      "A heap where a monotonic deque works → you pay an unnecessary log factor",
      "Recursion on 10⁵-deep input → convert to an explicit stack",
    ],
    edges: [
      { input: "Pop from empty", effect: "Python <code>IndexError</code>; C++ <code>back()</code> on empty is undefined behaviour, not an exception.", fix: "Always test emptiness first: <code>while stack and …</code>." },
      { input: "Stack non-empty at the end", effect: "Unmatched openers. Returning true here is the second half of the bracket problem that people forget.", fix: "Two checks, not one: closer-on-empty AND non-empty-at-end." },
      { input: "Equal values in a monotonic stack", effect: "<code>&lt;</code> versus <code>&lt;=</code> flips next-greater into next-greater-or-equal and silently changes histogram answers.", fix: "Pick deliberately and state why. For counting subarray minima, make one side strict and one not, or you double count." },
      { input: "Storing values instead of indices", effect: "You cannot compute distances or test window expiry.", fix: "Push indices. You can always read the value; you cannot recover the index." },
      { input: "Window size larger than the array", effect: "The deque never fills; the output array is sized negative.", fix: "Clamp k to n and decide what the answer means." },
    ],
    caption: "A monotonic (decreasing) stack. 4 arrives, pops everything smaller — each of those pops resolves an answer, and each index is popped at most once.",
    svg: `<svg viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg">
  ${[2, 1, 2, 4, 3].map((v, i) => {
    const popped = i < 3;
    return S.cell(30 + i * 74, 34, 60, 36, i === 3 ? "rgba(56,232,255,.14)" : popped ? "rgba(255,61,154,.10)" : PANEL,
      i === 3 ? "var(--cyan)" : popped ? "var(--mag)" : DIM) +
      S.txt(60 + i * 74, 58, String(v), i === 3 ? "var(--cyan)" : popped ? "var(--mag)" : "var(--txt)", 14) +
      S.txt(60 + i * 74, 86, String(i), "#4A456E", 9);
  }).join("")}
  ${S.txt(252, 24, "incoming", "var(--cyan)", 9)}

  ${S.txt(420, 24, "stack (indices)", "var(--dim)", 10)}
  ${S.cell(392, 34, 56, 26, "rgba(255,61,154,.10)", "var(--mag)")}${S.txt(420, 51, "2", "var(--mag)")}
  ${S.cell(392, 62, 56, 26, "rgba(255,61,154,.10)", "var(--mag)")}${S.txt(420, 79, "1", "var(--mag)")}
  ${S.cell(392, 90, 56, 26, "rgba(255,61,154,.10)", "var(--mag)")}${S.txt(420, 107, "0", "var(--mag)")}
  ${S.txt(470, 51, "← top: popped by 4", "var(--mag)", 9, "start")}
  ${S.txt(470, 79, "← popped by 4", "var(--mag)", 9, "start")}
  ${S.txt(470, 107, "← popped by 4", "var(--mag)", 9, "start")}

  ${S.txt(30, 148, "every pop resolves one answer: nextGreater[popped] = 4", "var(--lime)", 11, "start")}
  ${S.txt(30, 172, "each index is pushed once and popped once  →  2n operations  →  O(n), not O(n²)", "var(--dim)", 11, "start")}
</svg>`,
  },

  /* ========================== TREES & BST ========================== */
  {
    id: "tree",
    oneLine: "A hierarchy with no cycles, where almost every problem is one of four traversals wearing a costume.",
    model:
      "A tree is a graph with n−1 edges and no cycles, which means there is exactly one path between any two nodes. That uniqueness is why tree problems are so much easier than graph problems: no visited set is needed if you track the parent, and recursion naturally matches the structure.\n\nThe choice that decides most tree problems is <b>when you visit the node relative to its children</b>. Pre-order (node first) is for copying and serialising. In-order on a BST yields sorted output — that is the defining property, and half of BST problems are secretly 'do an in-order walk'. Post-order (children first) is for anything where a node's answer depends on its subtrees: heights, diameters, sums, validity.\n\nA <b>BST</b> adds an ordering invariant that turns search into binary search. The trap is that the invariant is about <em>ancestors</em>, not parents — a node must be within a range inherited from everything above it, not merely bigger than its immediate parent.",
    invariant:
      "BST: every node's value lies strictly inside the open range inherited from its ancestors. Checking only against the parent is wrong — it accepts trees where a deep left-subtree node exceeds a distant ancestor.",
    ops: [
      ["BST search / insert / delete", "O(h)", "h = log n if balanced, n if degenerate"],
      ["traversal (any order)", "O(n) / O(h) space", "the h is recursion stack"],
      ["level order (BFS)", "O(n) / O(w) space", "w = max width, can be n/2"],
      ["build from traversals", "O(n)", "needs pre+in, or post+in — pre+post is ambiguous"],
      ["LCA, general binary tree", "O(n)", "one post-order pass"],
      ["LCA in a BST", "O(h)", "walk down while both targets are on one side"],
      ["kth smallest in a BST", "O(h + k)", "in-order with early exit"],
    ],
    reach: [
      "The input is a tree — you rarely pick this",
      "'Levels', 'depth', 'shortest in an unweighted structure' → BFS",
      "A node's answer needs its children's answers → post-order",
      "Sorted output from a BST → in-order",
      "Prefix matching over strings → trie, which is a tree over the alphabet",
    ],
    avoid: [
      "An unbalanced BST for guaranteed performance → use the language's balanced map",
      "Recursion when the tree may be a 10⁵-node chain → iterate, or raise the limit",
      "Assuming a binary tree is a BST — validate if the problem does not promise it",
    ],
    edges: [
      { input: "Empty tree (root is null)", effect: "Height should be 0, but <code>root.val</code> throws; BFS with a null root enqueues null.", fix: "Return the base case before touching root — the very first line." },
      { input: "Single node", effect: "Diameter is 0 not 1 (edges vs nodes); it is trivially balanced and a valid BST.", fix: "Decide whether you count nodes or edges and say which." },
      { input: "Completely skewed", effect: "h = n, so recursion is n deep — stack overflow at 10⁵, and BST ops degrade to O(n).", fix: "Iterative traversal, or state the assumption that the tree is balanced." },
      { input: "Duplicate values in a BST", effect: "Strict range checks reject legitimate trees; 'go left on equal' vs 'right' changes the shape.", fix: "Ask which convention. Most problems forbid duplicates — confirm rather than assume." },
      { input: "Node value equals INT_MIN / INT_MAX", effect: "Sentinel-based BST validation compares against the same value and wrongly rejects.", fix: "Use <code>long</code> bounds, or nullable/optional bounds." },
      { input: "Even number of nodes at the deepest level", effect: "'Middle' and 'balanced' become ambiguous.", fix: "Balanced usually means heights differ by at most 1 — state the definition you are using." },
    ],
    caption: "The BST range invariant. Node 6 is bounded by (5, 10) — inherited from BOTH ancestors, not just its parent. Comparing to the parent alone accepts an invalid tree.",
    svg: `<svg viewBox="0 0 640 210" xmlns="http://www.w3.org/2000/svg">
  ${S.line(320, 52, 200, 100, DIM)}${S.line(320, 52, 440, 100, DIM)}
  ${S.line(200, 122, 130, 166, DIM)}${S.line(200, 122, 268, 166, DIM)}
  <circle cx="320" cy="40" r="20" fill="var(--panel2)" stroke="var(--cyan)" stroke-width="1.4"/>${S.txt(320, 45, "10", "var(--cyan)", 12)}
  <circle cx="200" cy="110" r="20" fill="var(--panel2)" stroke="var(--line2)" stroke-width="1.4"/>${S.txt(200, 115, "5", "var(--txt)", 12)}
  <circle cx="440" cy="110" r="20" fill="var(--panel2)" stroke="var(--line2)" stroke-width="1.4"/>${S.txt(440, 115, "15", "var(--txt)", 12)}
  <circle cx="130" cy="178" r="20" fill="var(--panel2)" stroke="var(--line2)" stroke-width="1.4"/>${S.txt(130, 183, "3", "var(--txt)", 12)}
  <circle cx="268" cy="178" r="20" fill="rgba(91,255,165,.13)" stroke="var(--lime)" stroke-width="1.4"/>${S.txt(268, 183, "6", "var(--lime)", 12)}

  ${S.txt(352, 30, "(-inf, +inf)", "var(--dim)", 9, "start")}
  ${S.txt(150, 90, "(-inf, 10)", "var(--dim)", 9, "start")}
  ${S.txt(468, 100, "(10, +inf)", "var(--dim)", 9, "start")}
  ${S.txt(296, 178, "(5, 10)  ← from BOTH ancestors", "var(--lime)", 9, "start")}
  ${S.txt(20, 200, "if 6 were 12, it would still beat its parent 5 — but violate the ancestor bound of 10", "var(--mag)", 11, "start")}
</svg>`,
  },
];
