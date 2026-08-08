import type { Pattern } from "../types";

/**
 * The array patterns the playbook was missing, chosen against Striver's A2Z array
 * section and cross-checked with what the 25 profiled companies actually ask.
 *
 * Every one of these is a "you either know the trick or you don't" pattern — they are
 * not derivable under time pressure, which is exactly why they appear in OAs. Each
 * carries the recognition cue, the invariant that makes it correct, and the trap that
 * costs the round.
 *
 * Every number in every trace was produced by running the algorithm and printing state,
 * including the incorrect variants where a trap is being demonstrated.
 */
export const PATTERNS_ARRAYS: readonly Pattern[] = [
  {
    t: "arr",
    n: "Boyer–Moore majority vote",
    tc: "O(n)",
    sc: "O(1)",
    sig: "<b>Signal:</b> 'the element appearing more than ⌊n/2⌋ times', or more than ⌊n/3⌋. The giveaway is a <em>strict majority</em> guarantee plus a follow-up demanding O(1) space after you offer a hash map.",
    why: "Pair every occurrence of the majority element with one of a different element and both cancel. Because the majority strictly exceeds half, it cannot be fully cancelled — whatever survives must be it. The counter is not a frequency; it is the size of the current unpaired run.",
    trap: "<b>The algorithm finds a candidate, not a majority.</b> If no element exceeds ⌊n/2⌋ it still returns something — on <code>[1,2,3]</code> it returns 3, which appears once. When the problem does not guarantee a majority exists you <b>must</b> add a second pass to count the candidate. Skipping that pass is the standard wrong answer.",
    say: "One pass to find a candidate by cancellation, and a second to verify it — the counter tracks an unpaired run, not a frequency.",
    py: "def majority(a):\n    cand, cnt = None, 0\n    for v in a:                  # pass 1: cancel\n        if cnt == 0:\n            cand, cnt = v, 1\n        elif v == cand:\n            cnt += 1\n        else:\n            cnt -= 1\n    # pass 2: VERIFY (skip only if a majority is guaranteed)\n    return cand if a.count(cand) > len(a) // 2 else -1\n\n# n/3 variant: at most two elements can exceed n/3,\n# so track TWO candidates and two counters, then verify both.",
    cpp: "int majority(vector<int>& a) {\n    int cand = 0, cnt = 0;\n    for (int v : a) {\n        if (cnt == 0)      { cand = v; cnt = 1; }\n        else if (v == cand) ++cnt;\n        else                --cnt;\n    }\n    int c = count(a.begin(), a.end(), cand);   // verify\n    return c > (int) a.size() / 2 ? cand : -1;\n}",
    java: "int majority(int[] a) {\n    int cand = 0, cnt = 0;\n    for (int v : a) {\n        if (cnt == 0)       { cand = v; cnt = 1; }\n        else if (v == cand) cnt++;\n        else                cnt--;\n    }\n    int c = 0;\n    for (int v : a) if (v == cand) c++;        // verify\n    return c > a.length / 2 ? cand : -1;\n}",
    lc: [
      [169, "majority-element", "Majority Element"],
      [229, "majority-element-ii", "Majority Element II"],
      [1150, "check-if-a-number-is-majority-element-in-a-sorted-array", "Check Majority in Sorted Array"],
    ],
    edges: [
      { input: "No majority exists, e.g. <code>[1,2,3]</code>", effect: "Returns 3 — the last element adopted — which appears exactly once.", fix: "Second verification pass. Only skip it when the statement explicitly guarantees a majority." },
      { input: "Single element", effect: "Adopted immediately with count 1; returned.", fix: "Correct — one element is trivially a majority of one." },
      { input: "All identical", effect: "Counter climbs to n, never cancels.", fix: "Correct. Useful check that you never decrement on a match." },
      { input: "Exactly n/2 occurrences (even n)", effect: "Not a <em>strict</em> majority, and the cancellation can leave the wrong candidate standing.", fix: "The guarantee is <code>&gt; ⌊n/2⌋</code>, not <code>≥</code>. <code>[1,1,2,2]</code> has no majority and the verify pass is what catches it." },
      { input: "n/3 variant with one candidate", effect: "Silently misses the second qualifying element.", fix: "Two candidates and two counters — at most two values can exceed n/3. Both still need verifying." },
    ],
    walk: [
      {
        title: "Simple — cancellation, step by step",
        input: "a = [2, 2, 1, 1, 1, 2, 2]",
        cols: ["saw", "candidate", "count", "action"],
        rows: [
          ["2", "2", "1", "count was 0 → adopt"],
          ["2", "2", "2", "match → +1"],
          ["1", "2", "1", "differ → −1"],
          ["1", "2", "<b>0</b>", "differ → −1, candidate now unbacked"],
          ["1", "<b>1</b>", "1", "count 0 → <b>adopt 1</b>"],
          ["2", "1", "0", "differ → −1"],
          ["2", "<b>2</b>", "1", "count 0 → adopt 2"],
        ],
        lesson:
          "Final candidate 2, which occurs 4 times out of 7 — a true majority ✓. Notice the candidate changed twice. The algorithm does not track the most frequent element at any moment; it only guarantees that the <em>survivor</em> of total cancellation is the majority if one exists.",
      },
      {
        title: "Harder — what happens with no majority (both versions run)",
        input: "a = [1, 2, 3]",
        cols: ["version", "candidate returned", "actual count", "verdict"],
        rows: [
          ["without verify", "<b>3</b>", "1 of 3", "<b>wrong</b> — reports a non-majority"],
          ["with verify", "3 → count 1 ≤ 1", "1 of 3", "returns −1 ✓"],
        ],
        lesson:
          "Executed both. The unverified version returns whatever was adopted last, which on a fully-cancelling input is just the final element. It looks like an answer, which is why this bug survives casual testing — the output has the right <em>type</em>.",
      },
    ],
  },

  {
    t: "arr",
    n: "Dutch national flag (3-way partition)",
    tc: "O(n)",
    sc: "O(1)",
    sig: "<b>Signal:</b> exactly three categories to segregate in one pass — sort 0s/1s/2s, move negatives/zeros/positives, partition around a pivot value with many duplicates.",
    why: "Three pointers carve the array into four zones: settled-low <code>[0, lo)</code>, settled-mid <code>[lo, mid)</code>, unexamined <code>[mid, hi]</code>, settled-high <code>(hi, n)</code>. Every step shrinks the unexamined zone by one, so it terminates in a single pass.",
    trap: "<b>Do not advance <code>mid</code> after swapping with <code>hi</code>.</b> The value you just pulled from the back has never been examined — advancing skips it and leaves it misplaced. Swapping with <code>lo</code> is different: that value is already known to be a 1, so both pointers move.",
    say: "Three pointers, four zones, and mid stays put after a high swap because the incoming value is still unexamined.",
    py: "def sort_colors(a):\n    lo, mid, hi = 0, 0, len(a) - 1\n    while mid <= hi:                 # <=, not <\n        if a[mid] == 0:\n            a[lo], a[mid] = a[mid], a[lo]\n            lo += 1; mid += 1        # both move\n        elif a[mid] == 2:\n            a[mid], a[hi] = a[hi], a[mid]\n            hi -= 1                  # mid does NOT move\n        else:\n            mid += 1\n    return a",
    cpp: "void sortColors(vector<int>& a) {\n    int lo = 0, mid = 0, hi = (int) a.size() - 1;\n    while (mid <= hi) {\n        if (a[mid] == 0)      { swap(a[lo++], a[mid++]); }\n        else if (a[mid] == 2) { swap(a[mid], a[hi--]); }   // mid stays\n        else                  { ++mid; }\n    }\n}",
    java: "void sortColors(int[] a) {\n    int lo = 0, mid = 0, hi = a.length - 1;\n    while (mid <= hi) {\n        if (a[mid] == 0) {\n            int t = a[lo]; a[lo] = a[mid]; a[mid] = t; lo++; mid++;\n        } else if (a[mid] == 2) {\n            int t = a[mid]; a[mid] = a[hi]; a[hi] = t; hi--;   // mid stays\n        } else mid++;\n    }\n}",
    lc: [
      [75, "sort-colors", "Sort Colors"],
      [905, "sort-array-by-parity", "Sort Array By Parity"],
      [2161, "partition-array-according-to-given-pivot", "Partition Array by Pivot"],
    ],
    edges: [
      { input: "Advancing <code>mid</code> after a high swap", effect: "The incoming value is never examined; a 0 or 2 can be left in the middle zone.", fix: "Only <code>hi--</code>. Re-examine the same <code>mid</code> next iteration." },
      { input: "<code>while mid &lt; hi</code>", effect: "The final unexamined element is skipped.", fix: "<code>mid &lt;= hi</code>. The loop must consume the unexamined zone entirely." },
      { input: "All the same value", effect: "All 0s: lo and mid march together. All 2s: hi walks down to meet mid.", fix: "Both correct. Worth tracing since the two branches behave very differently." },
      { input: "More than three categories", effect: "The pattern does not generalise — four zones need a different scheme.", fix: "Counting sort for a small fixed range, or a full sort. Say so rather than forcing it." },
      { input: "Counting sort offered instead", effect: "Two passes, O(1) space, also correct and easier.", fix: "Perfectly acceptable — but the interviewer usually then asks for one pass, which is this." },
    ],
    walk: [
      {
        title: "Simple — the full run on the classic input",
        input: "a = [2, 0, 2, 1, 1, 0]",
        cols: ["a[mid]", "action", "lo, mid, hi after", "array"],
        rows: [
          ["2", "swap with hi, hi−−, <b>mid stays</b>", "0, 0, 4", "[0, 0, 2, 1, 1, 2]"],
          ["0", "swap with lo, both ++", "1, 1, 4", "[0, 0, 2, 1, 1, 2]"],
          ["0", "swap with lo, both ++", "2, 2, 4", "[0, 0, 2, 1, 1, 2]"],
          ["2", "swap with hi, hi−−, mid stays", "2, 2, 3", "[0, 0, 1, 1, 2, 2]"],
          ["1", "mid++", "2, 3, 3", "[0, 0, 1, 1, 2, 2]"],
          ["1", "mid++", "2, 4, 3", "sorted — mid &gt; hi, exit"],
        ],
        lesson:
          "Six steps, six elements. Row 1 is the crux: after pulling a 0 in from the back, <code>mid</code> stays at 0 so that 0 gets processed on row 2. Advance there and it is stranded in the wrong zone permanently.",
      },
      {
        title: "Harder — the four zones as an invariant",
        input: "What each region means at any moment",
        cols: ["region", "range", "contains", "status"],
        rows: [
          ["low", "<code>[0, lo)</code>", "all 0s", "settled"],
          ["mid", "<code>[lo, mid)</code>", "all 1s", "settled"],
          ["unknown", "<code>[mid, hi]</code>", "anything", "<b>shrinks every step</b>"],
          ["high", "<code>(hi, n)</code>", "all 2s", "settled"],
        ],
        lesson:
          "Every branch shrinks the unknown region by exactly one, which is the termination proof and the O(n) bound in one sentence. If you can state these four zones out loud, the code writes itself; if you cannot, you will get the pointer updates wrong under pressure.",
      },
    ],
  },

  {
    t: "arr",
    n: "Next permutation",
    tc: "O(n)",
    sc: "O(1)",
    sig: "<b>Signal:</b> 'the next lexicographically greater arrangement', 'the next bigger number with the same digits', or generating permutations in order without recursion.",
    why: "The suffix that is already non-increasing is maximal — nothing greater can be made from it alone. So find the rightmost <b>pivot</b> where <code>a[i] &lt; a[i+1]</code>, swap it with the smallest suffix value that still exceeds it, then reverse the suffix to make it the smallest arrangement. That gives the immediate successor rather than just some larger one.",
    trap: "<b>Reverse the suffix; do not sort it.</b> After the swap the suffix is guaranteed non-increasing, so reversing gives ascending order in O(n) — sorting is O(n log n) for the same result and signals you have not seen why the guarantee holds. Also: when no pivot exists the array is the last permutation and must wrap to the first, which is just reversing the whole thing.",
    say: "Find the rightmost ascent, swap with the smallest larger value to its right, then reverse the suffix — and reverse, not sort, because the suffix is already non-increasing.",
    py: "def next_permutation(a):\n    n = len(a)\n    i = n - 2\n    while i >= 0 and a[i] >= a[i + 1]:   # find the pivot\n        i -= 1\n    if i >= 0:\n        j = n - 1\n        while a[j] <= a[i]:              # rightmost value greater than pivot\n            j -= 1\n        a[i], a[j] = a[j], a[i]\n    a[i + 1:] = reversed(a[i + 1:])      # REVERSE, not sort\n    return a                              # i == -1 wraps to the first permutation",
    cpp: "void nextPermutation(vector<int>& a) {\n    int n = a.size(), i = n - 2;\n    while (i >= 0 && a[i] >= a[i + 1]) --i;\n    if (i >= 0) {\n        int j = n - 1;\n        while (a[j] <= a[i]) --j;\n        swap(a[i], a[j]);\n    }\n    reverse(a.begin() + i + 1, a.end());\n}\n// std::next_permutation does exactly this and returns false on wrap.",
    java: "void nextPermutation(int[] a) {\n    int n = a.length, i = n - 2;\n    while (i >= 0 && a[i] >= a[i + 1]) i--;\n    if (i >= 0) {\n        int j = n - 1;\n        while (a[j] <= a[i]) j--;\n        int t = a[i]; a[i] = a[j]; a[j] = t;\n    }\n    for (int l = i + 1, r = n - 1; l < r; l++, r--) {\n        int t = a[l]; a[l] = a[r]; a[r] = t;\n    }\n}",
    lc: [
      [31, "next-permutation", "Next Permutation"],
      [556, "next-greater-element-iii", "Next Greater Element III"],
      [46, "permutations", "Permutations"],
      [1291, "sequential-digits", "Sequential Digits"],
    ],
    edges: [
      { input: "Already the last permutation, <code>[3,2,1]</code>", effect: "No pivot found, <code>i = −1</code>.", fix: "Reverse the whole array → <code>[1,2,3]</code>. The <code>i+1 = 0</code> slice handles it with no special case, which is why the reverse sits outside the <code>if</code>." },
      { input: "Duplicates, <code>[1,1,5]</code>", effect: "Using <code>&gt;</code> instead of <code>&gt;=</code> in the pivot scan picks the wrong index.", fix: "<code>a[i] &gt;= a[i+1]</code> for the pivot and <code>a[j] &lt;= a[i]</code> for the successor. Verified: <code>[1,1,5] → [1,5,1]</code>." },
      { input: "Sorting the suffix instead of reversing", effect: "Same answer, O(n log n) instead of O(n).", fix: "Reverse. The suffix is provably non-increasing at that point." },
      { input: "Single element", effect: "No pivot, reverses a length-1 slice.", fix: "Correct with no guard." },
      { input: "Scanning for <code>j</code> from the left", effect: "Picks a larger-than-necessary value and produces a permutation that is greater but not the <em>next</em> one.", fix: "Scan from the right — the first value exceeding the pivot is the smallest such, because the suffix descends." },
    ],
    walk: [
      {
        title: "Simple — the four canonical cases",
        input: "Each verified by execution",
        cols: ["input", "pivot", "output", "note"],
        rows: [
          ["[1, 2, 3]", "index 1 (value 2)", "<b>[1, 3, 2]</b>", "swap 2↔3, reverse empty tail"],
          ["[1, 3, 2]", "index 0 (value 1)", "<b>[2, 1, 3]</b>", "swap 1↔2, reverse [3,1] → [1,3]"],
          ["[1, 1, 5]", "index 1 (value 1)", "<b>[1, 5, 1]</b>", "duplicates handled by <code>&gt;=</code>"],
          ["[3, 2, 1]", "<b>none</b> (i = −1)", "<b>[1, 2, 3]</b>", "wraps to the first permutation"],
        ],
        lesson:
          "Row 4 is why the reverse must sit outside the <code>if</code>. With <code>i = −1</code> the slice <code>a[0:]</code> is the whole array, so the wrap is free — no branch, no special case.",
      },
      {
        title: "Harder — a long descending suffix",
        input: "a = [2, 3, 6, 5, 4, 1]",
        cols: ["step", "state", "reason"],
        rows: [
          ["scan for pivot", "6&gt;5, 5&gt;4, 4&gt;1 all descend; 3&lt;6 stops", "pivot at <b>index 1</b> (value 3)"],
          ["suffix", "[6, 5, 4, 1] — non-increasing", "nothing larger can come from it alone"],
          ["find j from right", "1≤3, 4&gt;3 → <b>j = 4</b>", "smallest suffix value exceeding 3"],
          ["swap", "[2, <b>4</b>, 6, 5, <b>3</b>, 1]", "pivot replaced by its tightest upgrade"],
          ["reverse suffix", "[2, 4, <b>1, 3, 5, 6</b>]", "smallest arrangement of what remains"],
        ],
        lesson:
          "Result [2,4,1,3,5,6], verified. Two moves do the work: the swap makes the number bigger by the smallest possible step at the highest position it can, and the reverse makes everything after it as small as possible. That pairing is what makes it the <em>next</em> permutation rather than merely a larger one.",
      },
    ],
  },

  {
    t: "arr",
    n: "Rotate by reversal",
    tc: "O(n)",
    sc: "O(1)",
    sig: "<b>Signal:</b> 'rotate the array k steps' with an O(1) space follow-up. Also rotating a string, or any cyclic shift where an extra buffer is disallowed.",
    why: "Reversing the whole array puts the last k elements at the front — in reverse order. Reversing each of the two blocks separately then restores their internal order. Three reversals, each O(n) with no extra memory, and no modular index arithmetic to get wrong.",
    trap: "<b><code>k</code> can exceed <code>n</code>.</b> Always take <code>k %= n</code> first, or every index goes out of range. And guard <code>n == 0</code> before the modulo — <code>k % 0</code> throws. The juggling algorithm using GCD cycles is also O(1) space but far harder to write correctly under pressure; reversal is the one to reach for.",
    say: "Reverse everything, then reverse the first k and the rest — three passes, O(1) space, and k mod n first so a large k can't run off the end.",
    py: "def rotate(a, k):\n    n = len(a)\n    if n == 0:\n        return a\n    k %= n                    # k can exceed n\n    a.reverse()               # whole\n    a[:k] = reversed(a[:k])   # first block\n    a[k:] = reversed(a[k:])   # second block\n    return a",
    cpp: "void rotate(vector<int>& a, int k) {\n    int n = a.size();\n    if (n == 0) return;\n    k %= n;\n    reverse(a.begin(), a.end());\n    reverse(a.begin(), a.begin() + k);\n    reverse(a.begin() + k, a.end());\n}",
    java: "void rotate(int[] a, int k) {\n    int n = a.length;\n    if (n == 0) return;\n    k %= n;\n    rev(a, 0, n - 1);\n    rev(a, 0, k - 1);\n    rev(a, k, n - 1);\n}\nprivate void rev(int[] a, int l, int r) {\n    while (l < r) { int t = a[l]; a[l++] = a[r]; a[r--] = t; }\n}",
    lc: [
      [189, "rotate-array", "Rotate Array"],
      [61, "rotate-list", "Rotate List"],
      [396, "rotate-function", "Rotate Function"],
      [1260, "shift-2d-grid", "Shift 2D Grid"],
    ],
    edges: [
      { input: "<code>k &gt; n</code>", effect: "Index out of range without the modulo.", fix: "<code>k %= n</code> before anything else. <code>[1,2] k=5</code> → <code>[2,1]</code>, verified." },
      { input: "<code>n == 0</code>", effect: "<code>k % 0</code> raises.", fix: "Guard the empty array before the modulo, not after." },
      { input: "<code>k == 0</code> or <code>k == n</code>", effect: "Three reversals that cancel out — correct but wasteful.", fix: "Early return if <code>k == 0</code> after the modulo." },
      { input: "Rotating left instead of right", effect: "Same technique, different split point.", fix: "Left rotation by k is right rotation by <code>n − k</code>. Read which direction the problem wants." },
      { input: "Using a temp array", effect: "O(n) space — correct, and often accepted first.", fix: "Fine as a first answer. The reversal trick is the follow-up, so lead with the simple one then offer this." },
    ],
    walk: [
      {
        title: "Simple — three reversals, watched",
        input: "a = [1,2,3,4,5,6,7], k = 3",
        cols: ["stage", "array", "what it achieved"],
        rows: [
          ["start", "[1, 2, 3, 4, 5, 6, 7]", "—"],
          ["reverse all", "[<b>7, 6, 5</b>, 4, 3, 2, 1]", "last 3 are now in front, but backwards"],
          ["reverse first k", "[<b>5, 6, 7</b>, 4, 3, 2, 1]", "front block order restored"],
          ["reverse rest", "[5, 6, 7, <b>1, 2, 3, 4</b>]", "back block order restored ✓"],
        ],
        lesson:
          "Every intermediate state verified. The first reversal does the moving; the next two only repair order. That separation is why there is no modular arithmetic anywhere — and why this version is much harder to get wrong than index-shifting.",
      },
    ],
  },

  {
    t: "arr",
    n: "Maximum product subarray",
    tc: "O(n)",
    sc: "O(1)",
    sig: "<b>Signal:</b> maximum <em>product</em> rather than sum, over a contiguous subarray, with negative numbers present. If everything is positive it collapses to a trivial scan — the negatives are the problem.",
    why: "Kadane's single running value fails because a negative flips large-to-small and small-to-large. So track <b>both</b> the running maximum and the running minimum: a very negative minimum is one negative multiplication away from becoming the maximum. On a negative element, swap them before extending.",
    trap: "<b>You must swap <code>cur_max</code> and <code>cur_min</code> before updating, not after</b>, and you must use the <em>old</em> values when computing both — compute <code>cur_max</code> first and its new value will corrupt <code>cur_min</code>. In Python the tuple assignment handles it; in C++ and Java you need a temporary.",
    say: "Track the running max and min together, because one negative turns the smallest product into the largest — and swap them before extending, not after.",
    py: "def max_product(a):\n    best = cur_max = cur_min = a[0]\n    for v in a[1:]:\n        if v < 0:\n            cur_max, cur_min = cur_min, cur_max   # swap BEFORE extending\n        cur_max = max(v, cur_max * v)\n        cur_min = min(v, cur_min * v)\n        best = max(best, cur_max)\n    return best",
    cpp: "int maxProduct(vector<int>& a) {\n    int best = a[0], curMax = a[0], curMin = a[0];\n    for (size_t i = 1; i < a.size(); ++i) {\n        int v = a[i];\n        if (v < 0) swap(curMax, curMin);\n        curMax = max(v, curMax * v);\n        curMin = min(v, curMin * v);\n        best = max(best, curMax);\n    }\n    return best;\n}",
    java: "int maxProduct(int[] a) {\n    int best = a[0], curMax = a[0], curMin = a[0];\n    for (int i = 1; i < a.length; i++) {\n        int v = a[i];\n        if (v < 0) { int t = curMax; curMax = curMin; curMin = t; }\n        curMax = Math.max(v, curMax * v);\n        curMin = Math.min(v, curMin * v);\n        best = Math.max(best, curMax);\n    }\n    return best;\n}",
    lc: [
      [152, "maximum-product-subarray", "Maximum Product Subarray"],
      [628, "maximum-product-of-three-numbers", "Max Product of Three Numbers"],
      [1464, "maximum-product-of-two-elements-in-an-array", "Max Product of Two Elements"],
    ],
    edges: [
      { input: "A zero in the array", effect: "Both running values collapse to 0, correctly restarting the subarray.", fix: "The <code>max(v, ...)</code> handles it — taking <code>v</code> alone <em>is</em> the restart. <code>[-2,0,-1] → 0</code>, verified." },
      { input: "Two negatives, <code>[-2,3,-4]</code>", effect: "Answer 24, using the whole array — the minimum −6 becomes the maximum when multiplied by −4.", fix: "This is exactly what tracking the minimum buys. Verified." },
      { input: "Updating <code>cur_max</code> before reading it for <code>cur_min</code>", effect: "The new max poisons the min computation; wrong on any input with negatives.", fix: "Compute both from the pre-update values. Tuple assignment in Python, an explicit temp elsewhere." },
      { input: "Initialising to 0 or 1", effect: "Same class of bug as Kadane — an all-negative array reports a product it never achieved.", fix: "Seed all three from <code>a[0]</code>." },
      { input: "Product overflow", effect: "Even with values bounded by 10, a run of 30 elements exceeds int32.", fix: "Constraints usually bound the product; if not, use 64-bit. Worth naming out loud." },
    ],
    walk: [
      {
        title: "Simple — the canonical run",
        input: "a = [2, 3, −2, 4]",
        cols: ["i", "v", "cur_max", "cur_min", "best"],
        rows: [
          ["0", "2", "2 (seed)", "2", "2"],
          ["1", "3", "max(3, 6) = <b>6</b>", "min(3, 6) = 3", "6"],
          ["2", "−2", "swap first → max(−2, −6) = −2", "min(−2, −12) = <b>−12</b>", "6"],
          ["3", "4", "max(4, −8) = 4", "min(4, −48) = −48", "<b>6</b>"],
        ],
        lesson:
          "Answer 6, from [2,3]. Watch row 2: after the swap, <code>cur_min</code> becomes −12 — a value that looks useless. It is the whole point. One more negative element would have turned it into +24 and taken the lead.",
      },
      {
        title: "Harder — where the minimum wins",
        input: "a = [−2, 3, −4]",
        cols: ["i", "v", "cur_max", "cur_min", "best"],
        rows: [
          ["0", "−2", "−2", "−2", "−2"],
          ["1", "3", "max(3, −6) = 3", "min(3, −6) = <b>−6</b>", "3"],
          ["2", "−4", "swap → max(−4, <b>24</b>) = <b>24</b>", "min(−4, −12) = −12", "<b>24</b>"],
        ],
        lesson:
          "Answer 24 — the entire array. Kadane with a single running value would report 3 here. The −6 carried forward from row 1 is what becomes 24, which is why discarding the minimum as 'not useful' loses the answer entirely.",
      },
    ],
  },

  {
    t: "arr",
    n: "Best time to buy and sell (min-so-far)",
    tc: "O(n)",
    sc: "O(1)",
    sig: "<b>Signal:</b> maximum difference <code>a[j] − a[i]</code> where <code>i &lt; j</code> — stock profit, maximum gain, largest rise. The ordering constraint is the tell: you cannot just take max minus min.",
    why: "At each price, the best sale today is today's price minus the cheapest price seen <em>so far</em>. Tracking that running minimum turns an O(n²) pair search into one pass, because you never need to look backwards — the minimum already summarises everything to the left.",
    trap: "<b>Update the answer before updating the minimum</b>, or you will compute a profit of 0 on the day the new minimum appears — buying and selling on the same day. It happens to be harmless when profit can be 0, and silently wrong the moment the problem forbids a same-day trade or asks for the actual indices.",
    say: "One pass keeping the cheapest price so far; today's best profit is today's price minus that minimum, and I score before updating the minimum so I never trade with myself.",
    py: "def max_profit(prices):\n    if not prices:\n        return 0\n    lo, best = prices[0], 0\n    for v in prices:\n        best = max(best, v - lo)   # score FIRST\n        lo = min(lo, v)            # then update the floor\n    return best\n\n# Unlimited transactions (LC 122) is a different, simpler problem:\n# sum every positive day-to-day delta.",
    cpp: "int maxProfit(vector<int>& p) {\n    if (p.empty()) return 0;\n    int lo = p[0], best = 0;\n    for (int v : p) {\n        best = max(best, v - lo);\n        lo = min(lo, v);\n    }\n    return best;\n}",
    java: "int maxProfit(int[] p) {\n    if (p.length == 0) return 0;\n    int lo = p[0], best = 0;\n    for (int v : p) {\n        best = Math.max(best, v - lo);\n        lo = Math.min(lo, v);\n    }\n    return best;\n}",
    lc: [
      [121, "best-time-to-buy-and-sell-stock", "Best Time to Buy and Sell Stock"],
      [122, "best-time-to-buy-and-sell-stock-ii", "Buy and Sell Stock II"],
      [1732, "find-the-highest-altitude", "Find the Highest Altitude"],
      [2016, "maximum-difference-between-increasing-elements", "Max Difference Between Increasing Elements"],
    ],
    edges: [
      { input: "Prices only fall, <code>[7,6,4,3,1]</code>", effect: "No profitable trade; returns 0.", fix: "Correct when the problem allows doing nothing. If it forces a trade, the answer is the least-bad loss and <code>best</code> must seed from the first pair, not 0. Verified: returns 0." },
      { input: "Empty or single price", effect: "There is no <code>i &lt; j</code> pair at all, so no trade is possible — and on an empty list <code>prices[0]</code> throws before the loop even starts.", fix: "Guard the empty case explicitly and return 0. A single price is fine unguarded: the loop scores <code>v − v = 0</code> and returns 0, which is the right answer." },
      { input: "Updating <code>lo</code> before scoring", effect: "On a new-minimum day you compute <code>v − v = 0</code>, a same-day trade.", fix: "Score, then update. Harmless when 0 is allowed; wrong when it is not." },
      { input: "Asked for the buy and sell days", effect: "The plain version tracks no indices.", fix: "Record the index of <code>lo</code>, and capture both indices whenever <code>best</code> improves. Standard follow-up." },
      { input: "Unlimited transactions (LC 122)", effect: "This algorithm answers a different question and under-reports.", fix: "Sum every positive consecutive difference. Simpler, and people often over-engineer it into DP." },
    ],
    walk: [
      {
        title: "Simple — one pass, scoring before updating",
        input: "prices = [7, 1, 5, 3, 6, 4]",
        cols: ["i", "price", "min so far", "profit today", "best"],
        rows: [
          ["0", "7", "7", "0", "0"],
          ["1", "1", "<b>1</b>", "1 − 7 = −6 → ignored", "0"],
          ["2", "5", "1", "5 − 1 = <b>4</b>", "4"],
          ["3", "3", "1", "3 − 1 = 2", "4"],
          ["4", "6", "1", "6 − 1 = <b>5</b>", "<b>5</b>"],
          ["5", "4", "1", "4 − 1 = 3", "5"],
        ],
        lesson:
          "Answer 5 — buy at 1 on day 1, sell at 6 on day 4. Row 1 shows why the order matters: scoring first gives −6, which loses to the current best of 0; had we updated <code>lo</code> first we would have scored 1 − 1 = 0, the same answer here but by accident rather than by reasoning.",
      },
    ],
  },
];
