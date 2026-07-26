import type { Pattern } from "../types";

/**
 * Worked traces and edge matrices for strings, linked lists, stacks and backtracking.
 *
 * Every number in every table below was produced by running the algorithm in CPython
 * and printing the state, not by reasoning about it. The prefix-function and Z-function
 * tables in particular are the kind of thing that is wrong more often than not when
 * written from memory, so they were generated rather than recalled.
 */
type Extra = Pick<Pattern, "edges" | "walk">;

export const WALKS_STRUCTURES: Readonly<Record<string, Extra>> = {
  /* ------------------------------------------------------------------ strings */

  "Expand around centre": {
    edges: [
      { input: "Empty string", effect: "<code>2·n − 1</code> is −1, so the centre loop never runs and you return the empty string.", fix: "Correct, but only by accident. Return early on <code>not s</code> so the intent is visible." },
      { input: "Even-length answer, e.g. <code>cbbd</code>", effect: "If you only run odd centres you return <code>c</code> instead of <code>bb</code> — and the code looks completely right.", fix: "Run both centre types. The compact trick is to loop <code>c</code> over <code>0 … 2n−2</code> and set <code>l = c//2</code>, <code>r = l + (c &amp; 1)</code>." },
      { input: "All identical characters, <code>aaaa…</code> at n = 1000", effect: "Every centre expands to the string end. Genuinely Θ(n²) — about 500 000 character comparisons.", fix: "This is the intended worst case and usually passes. If n ≥ 10⁵ the problem wants Manacher's O(n), and that is the signal to switch." },
      { input: "No character repeats at all", effect: "Every expansion stops immediately; answer is any single character.", fix: "Initialise the best to <code>s[0]</code>, not to <code>\"\"</code>, or you return empty for a length-1 input." },
      { input: "Unicode with combining marks", effect: "Indexing by code unit splits a grapheme, so <code>é</code> written as <code>e + U+0301</code> reverses wrongly.", fix: "Almost never tested in an OA — but saying it out loud is free credit." },
    ],
    walk: [
      {
        title: "Simple — odd centre wins",
        input: 's = "babad"',
        cols: ["centre c", "l, r", "expands to", "best so far"],
        rows: [
          ["0", "0, 0", '<code>b</code>', '<code>b</code>'],
          ["1", "0, 1", '<code>ba</code> — mismatch, stop', '<code>b</code>'],
          ["2", "1, 1", '<code>a</code> → <code>bab</code> → out of range', '<code>bab</code> (len 3)'],
          ["3", "1, 2", '<code>ab</code> — mismatch, stop', '<code>bab</code>'],
          ["4", "2, 2", '<code>b</code> → <code>aba</code>', '<code>bab</code> (tie, keep first)'],
        ],
        lesson: "Seven successful character comparisons for n = 5. <code>aba</code> ties with <code>bab</code>; the problem accepts either, but only because you kept a strict <code>&gt;</code> rather than <code>&gt;=</code> when updating.",
      },
      {
        title: "Harder — the answer is even-length",
        input: 's = "cbbd"',
        cols: ["centre c", "l, r", "expands to", "best so far"],
        rows: [
          ["0", "0, 0", '<code>c</code>', '<code>c</code>'],
          ["1", "0, 1", '<code>cb</code> — mismatch', '<code>c</code>'],
          ["2", "1, 1", '<code>b</code>', '<code>c</code> (tie)'],
          ["3", "1, 2", '<code>bb</code> ✓ → then <code>cbbd</code> mismatch', '<code>bb</code> (len 2)'],
          ["4–6", "…", "nothing longer", '<code>bb</code>'],
        ],
        lesson: "Centre 3 is an <em>even</em> centre — it sits between two characters. Delete the even centres and this input returns <code>c</code>, which is the single most common bug in this pattern.",
      },
      {
        title: "Hardest — the quadratic worst case",
        input: 's = "aaaa"',
        cols: ["centre c", "type", "expansions", "running work"],
        rows: [
          ["0", "odd", "1 → <code>a</code>", "1"],
          ["1", "even", "2 → <code>aa</code>, <code>aaaa</code>? no, <code>aa</code> then bounds", "3"],
          ["2", "odd", "2 → <code>a</code>, <code>aaa</code>", "5"],
          ["3", "even", "2 → <code>aa</code>, <code>aaaa</code>", "7"],
          ["4", "odd", "2 → <code>a</code>, <code>aaa</code>", "9"],
          ["5", "even", "1 → <code>aa</code>", "10"],
          ["6", "odd", "1 → <code>a</code>", "10"],
        ],
        lesson: "10 comparisons for n = 4. The count grows as ≈ n²/2, so at n = 10⁴ that is 5·10⁷ — borderline. This is the input a tester uses, and the reason a constraint of n ≤ 10⁵ means Manacher rather than centres.",
      },
    ],
  },

  "String building — never += in a loop": {
    edges: [
      { input: "CPython, <code>s += c</code> in a loop", effect: "Usually <b>linear</b>, not quadratic — CPython resizes the buffer in place when the string's refcount is 1.", fix: "Do not repeat the folklore. The optimisation is real but fragile: keep a second reference to <code>s</code>, or run on PyPy/Jython, and it collapses back to Θ(n²). <code>\"\".join(parts)</code> is unconditionally linear, which is why it is still the right habit." },
      { input: "Java, <code>String s += c</code> in a loop", effect: "Genuinely Θ(n²). Each <code>+=</code> compiles to a fresh <code>StringBuilder</code>, an append, and a <code>toString</code>.", fix: "One <code>StringBuilder</code> outside the loop. This is the version that actually times out, and it is the one OAs test." },
      { input: "C++, <code>s += c</code>", effect: "Amortised O(1) — <code>std::string</code> grows geometrically, like a vector.", fix: "Nothing to fix. <code>s.reserve(n)</code> removes the reallocations entirely if you know the final size." },
      { input: "Building by <code>out = out + [v]</code> on a list", effect: "Θ(n²) in every Python implementation — a new list object each time, no in-place path.", fix: "<code>out.append(v)</code>. This is the list analogue people miss while carefully avoiding the string version." },
      { input: "Joining 10⁶ pieces", effect: "<code>join</code> makes two passes: one to total the lengths, one to copy. Peak memory is the result plus the parts list.", fix: "Fine at 10⁶. If memory is tight, write to a file or an <code>io.StringIO</code> incrementally instead." },
    ],
    walk: [
      {
        title: "Simple — what the two versions actually cost",
        input: "n = 4 characters appended one at a time",
        cols: ["step", "Java <code>String +=</code>", "chars copied", "Python <code>join</code>"],
        rows: [
          ["1", 'new SB("") → "a"', "0", "collect <code>a</code>"],
          ["2", 'new SB("a") → "ab"', "1", "collect <code>b</code>"],
          ["3", 'new SB("ab") → "abc"', "2", "collect <code>c</code>"],
          ["4", 'new SB("abc") → "abcd"', "3", "collect <code>d</code>"],
          ["join", "—", "total 6", "one pass, 4 copied"],
        ],
        lesson: "0+1+2+3 = 6 = n(n−1)/2. At n = 10⁵ that is 5·10⁹ character copies, which is a hard timeout, versus 10⁵ for the join.",
      },
      {
        title: "Harder — measured, not assumed",
        input: "The empirical analyser's log–log slope on each variant",
        cols: ["code", "measured exponent", "verdict"],
        rows: [
          ["<code>s += c</code> (CPython, sole reference)", "0.97", "linear — the in-place resize fires"],
          ["<code>t = s; s += c</code> (second reference)", "≈ 2.0", "quadratic — refcount is 2, no in-place path"],
          ["<code>out = out + [v]</code>", "2.03", "quadratic — lists have no such optimisation"],
          ["<code>\"\".join(parts)</code>", "1.00", "linear, unconditionally"],
        ],
        lesson: "Run these yourself in the complexity analyser. The point is not to memorise the table — it is that the <em>same source line</em> is linear or quadratic depending on a refcount you cannot see. Prefer the version whose cost does not depend on invisible state.",
      },
    ],
  },

  "KMP prefix function": {
    edges: [
      { input: "Pattern of length 1", effect: "<code>π = [0]</code>. The loop body never executes.", fix: "Nothing — but confirm your loop starts at <code>i = 1</code>, not <code>0</code>. Starting at 0 lets <code>π[0]</code> become 1 and every later value is poisoned." },
      { input: "<code>aaaa</code> — total self-overlap", effect: "<code>π = [0,1,2,3]</code>, the maximum possible. Every prefix is also a suffix.", fix: "Correct behaviour. This is the input that proves your fallback chain terminates, so trace it before submitting." },
      { input: "<code>abcd</code> — no overlap at all", effect: "<code>π = [0,0,0,0]</code>. Every comparison fails and <code>k</code> stays 0.", fix: "Check that <code>while k and …</code> guards on <code>k</code> being non-zero, or <code>π[k−1]</code> indexes <code>π[−1]</code> and Python silently reads the last element." },
      { input: "Searching text for pattern with the concatenation trick", effect: "If the separator also appears in the text, a match can straddle the join and you report a false hit.", fix: "Use a sentinel that cannot occur in either — <code>\\x00</code>, or <code>#</code> only if the alphabet is known to exclude it." },
      { input: "Pattern longer than the text", effect: "No match, but a naive bound like <code>range(len(text) − len(pat))</code> is negative and the loop silently does nothing.", fix: "Fine here, but state it. The failure mode appears when someone 'optimises' the loop bound later." },
    ],
    walk: [
      {
        title: "Simple — one overlap, then a reset",
        input: 'p = "aab"',
        cols: ["i", "s[i]", "k before", "compare", "π[i]"],
        rows: [
          ["1", "<code>a</code>", "0", "<code>a</code> vs s[0]=<code>a</code> ✓", "1"],
          ["2", "<code>b</code>", "1", "<code>b</code> vs s[1]=<code>a</code> ✗ → k = π[0] = 0; <code>b</code> vs s[0]=<code>a</code> ✗", "0"],
        ],
        lesson: "π = [0, 1, 0]. Read π[i] as: <em>the longest proper prefix of p[0..i] that is also a suffix of it.</em> Not 'how far we matched' — that is the search loop's variable, and conflating the two is the classic bug.",
      },
      {
        title: "Harder — the fallback chain does real work",
        input: 'p = "aabaaab"',
        cols: ["i", "s[i]", "k before", "what happens", "π[i]"],
        rows: [
          ["1", "<code>a</code>", "0", "match s[0]", "1"],
          ["2", "<code>b</code>", "1", "✗ → k = π[0] = 0 → ✗", "0"],
          ["3", "<code>a</code>", "0", "match s[0]", "1"],
          ["4", "<code>a</code>", "1", "match s[1] = <code>a</code>", "2"],
          ["5", "<code>a</code>", "2", "s[2] = <code>b</code> ✗ → k = π[1] = 1; s[1] = <code>a</code> ✓", "2"],
          ["6", "<code>b</code>", "2", "s[2] = <code>b</code> ✓", "3"],
        ],
        lesson: "π = [0,1,0,1,2,2,3]. Row 5 is the whole algorithm: on mismatch you do <em>not</em> reset to 0, you fall back to the next-best border. That is why the total work is O(n) — <code>k</code> increases at most once per <code>i</code>, so it can decrease at most n times overall.",
      },
      {
        title: "Hardest — a long fall",
        input: 'p = "aabaabaaa"',
        cols: ["i", "s[i]", "k before", "fallback chain", "π[i]"],
        rows: [
          ["6", "<code>a</code>", "3", "s[3] = <code>a</code> ✓", "4"],
          ["7", "<code>a</code>", "4", "s[4] = <code>a</code> ✓", "5"],
          ["8", "<code>a</code>", "5", "s[5] = <code>b</code> ✗ → k = π[4] = 2; s[2] = <code>b</code> ✗ → k = π[1] = 1; s[1] = <code>a</code> ✓", "2"],
        ],
        lesson: "π = [0,1,0,1,2,3,4,5,2]. At i = 8 the value falls from 5 to 2 through two fallbacks. If your amortisation argument felt hand-wavy, this is the concrete version: k climbed 5 times over the earlier indices, so it is allowed to fall twice here and still average O(1) per character.",
      },
    ],
  },

  "Z-function": {
    edges: [
      { input: "<code>z[0]</code>", effect: "Undefined by most conventions, or set to n. If you compute it in the loop you get a self-match and the box breaks.", fix: "Start the loop at <code>i = 1</code> and set <code>z[0] = n</code> explicitly (or never read it)." },
      { input: "<code>aaaaa</code> without the <code>min</code> cap", effect: "Every position rescans to the end. Θ(n²) — 10⁵ characters becomes 5·10⁹ comparisons.", fix: "<code>z[i] = min(r − i, z[i − l])</code> before the while loop. That single line is the algorithm; without it you have written a slow naive scan." },
      { input: "<code>i ≥ r</code> — outside the current Z-box", effect: "No information to reuse; you must compare from scratch.", fix: "Correct and necessary. Guard with <code>if i &lt; r</code> before applying the cap." },
      { input: "<code>z[i − l]</code> exactly reaches the box edge", effect: "The prefix match might continue past <code>r</code>, so you cannot take <code>z[i−l]</code> directly.", fix: "This is why it is <code>min</code> and why the while loop still runs afterwards. Capping without the follow-up loop gives silently short answers." },
      { input: "Pattern matching via <code>pattern + sep + text</code>", effect: "A separator present in either string produces false matches across the boundary.", fix: "Use a byte outside both alphabets. Then any <code>z[i] == len(pattern)</code> is a genuine occurrence at <code>i − len(pattern) − 1</code>." },
    ],
    walk: [
      {
        title: "Simple — full self-similarity",
        input: 's = "aaaaa"',
        cols: ["i", "in box?", "cap from z[i−l]", "extend", "z[i]"],
        rows: [
          ["1", "no (r = 0)", "—", "compare 4 times", "4"],
          ["2", "yes, box [1,5)", "min(5−2, z[1]=4) = 3", "already maximal", "3"],
          ["3", "yes", "min(5−3, z[2]=3) = 2", "—", "2"],
          ["4", "yes", "min(5−4, z[3]=2) = 1", "—", "1"],
        ],
        lesson: "z = [5,4,3,2,1]. Position 1 does 4 comparisons; positions 2–4 do <em>zero</em> because the cap already gives the exact answer. Remove the cap and each of them rescans to the end — that is the difference between O(n) and O(n²) on this exact input.",
      },
      {
        title: "Harder — partial matches, box moves",
        input: 's = "abacaba"',
        cols: ["i", "in box?", "starting value", "extend to", "z[i]", "new box"],
        rows: [
          ["1", "no", "0", "<code>b</code> ≠ <code>a</code>", "0", "unchanged"],
          ["2", "no", "0", "<code>a</code> = <code>a</code>, then <code>c</code> ≠ <code>b</code>", "1", "[2, 3)"],
          ["3", "no (i ≥ r)", "0", "<code>c</code> ≠ <code>a</code>", "0", "unchanged"],
          ["4", "no", "0", "<code>aba</code> matches, then end", "3", "[4, 7)"],
          ["5", "yes", "min(7−5, z[1]=0) = 0", "<code>b</code> ≠ <code>a</code>", "0", "unchanged"],
          ["6", "yes", "min(7−6, z[2]=1) = 1", "at end", "1", "unchanged"],
        ],
        lesson: "z = [7,0,1,0,3,0,1]. Row 5 is the payoff: <code>z[1] = 0</code> is copied straight in, so position 5 costs one failed comparison instead of a scan. The box only advances when a match runs past <code>r</code>, which is why <code>r</code> is monotone and the total extension work is O(n).",
      },
      {
        title: "Hardest — the cap is not the final answer",
        input: 's = "aabxaayaab"',
        cols: ["i", "cap", "extends further?", "z[i]"],
        rows: [
          ["1", "— (outside box)", "<code>a</code> ✓, <code>b</code> ≠ <code>a</code>", "1"],
          ["4", "— (i ≥ r)", "<code>aa</code> ✓, <code>y</code> ≠ <code>b</code>", "2"],
          ["5", "min(6−5, z[1]=1) = 1", "no — <code>y</code> ≠ <code>a</code> would be checked but cap = r−i so it stops", "1"],
          ["7", "— (i ≥ r)", "<code>aab</code> ✓, then string ends", "3"],
          ["8", "min(10−8, z[1]=1) = 1", "capped by z[i−l], value is exact", "1"],
        ],
        lesson: "z = [10,1,0,0,2,1,0,3,1,0]. Two distinct reasons the cap appears: <code>z[i−l]</code> smaller than the box (answer is exact, stop) versus the box edge smaller (answer may continue, keep comparing). Collapsing those two cases into one is the subtle bug that passes small tests.",
      },
    ],
  },

  /* ------------------------------------------------------------- linked lists */

  "Dummy head node": {
    edges: [
      { input: "Delete every node (all match)", effect: "Without a dummy, <code>head</code> must be reassigned inside the loop and the special case leaks everywhere. With one, the code is uniform and returns <code>dummy.next = None</code>.", fix: "This is the whole reason the pattern exists — the head stops being special." },
      { input: "Empty input list", effect: "<code>dummy.next = None</code>, loop never runs, returns <code>None</code>.", fix: "Correct with no extra code. Verify you return <code>dummy.next</code> and not <code>dummy</code>, which would return a phantom node." },
      { input: "Returning <code>head</code> out of habit", effect: "If the original head was deleted, you return a node that is no longer in the list — often a dangling one-element list.", fix: "<code>return dummy.next</code>, always. Rewrite it as the last line before you write the loop." },
      { input: "Node to delete is the last one", effect: "<code>prev.next = cur.next</code> sets <code>None</code> correctly, so the tail terminates.", fix: "No fix, but check you never dereference <code>cur.next.next</code> without a guard." },
      { input: "C++ / Java: dummy allocated on the heap", effect: "<code>new ListNode()</code> leaks in C++ if you return before deleting.", fix: "Stack-allocate: <code>ListNode dummy(0);</code> and use <code>&amp;dummy</code>. In Java the GC handles it." },
    ],
    walk: [
      {
        title: "Simple — delete a middle value",
        input: "1 → 2 → 3 → 4, remove 3",
        cols: ["prev", "cur", "match?", "list after step"],
        rows: [
          ["dummy", "1", "no → advance", "d → 1 → 2 → 3 → 4"],
          ["1", "2", "no → advance", "unchanged"],
          ["2", "3", "<b>yes</b> → <code>prev.next = cur.next</code>", "d → 1 → 2 → 4"],
          ["2", "4", "no → advance", "unchanged"],
        ],
        lesson: "The dummy is never touched here — which is exactly the point. It costs one node and removes an entire branch.",
      },
      {
        title: "Harder — the head itself is deleted",
        input: "3 → 1 → 2, remove 3",
        cols: ["prev", "cur", "action", "list after step"],
        rows: [
          ["dummy", "3", "match → <code>dummy.next = 1</code>", "d → 1 → 2"],
          ["dummy", "1", "no → advance", "unchanged"],
          ["1", "2", "no → advance", "unchanged"],
          ["return", "—", "<code>dummy.next</code> = node 1", "1 → 2"],
        ],
        lesson: "Returning the saved <code>head</code> here gives you node 3, which points at node 1 — so you would return the <em>whole original list</em> and the deletion would look like it silently failed.",
      },
      {
        title: "Hardest — every node matches",
        input: "7 → 7 → 7, remove 7",
        cols: ["prev", "cur", "action", "dummy.next"],
        rows: [
          ["dummy", "7₁", "match", "7₂"],
          ["dummy", "7₂", "match", "7₃"],
          ["dummy", "7₃", "match", "<code>None</code>"],
          ["return", "—", "—", "<code>None</code> — empty list"],
        ],
        lesson: "<code>prev</code> never moves. Three deletions, no special-casing, and the empty result falls out for free. Write this version without a dummy and you will need a separate <code>while head and head.val == v</code> pre-loop.",
      },
    ],
  },

  "Iterative reversal": {
    edges: [
      { input: "Empty list", effect: "<code>cur = None</code>, loop never runs, returns <code>prev = None</code>.", fix: "Correct with no guard. Initialising <code>prev = None</code> is what makes this work." },
      { input: "Single node", effect: "One iteration; the node's <code>next</code> becomes <code>None</code> and it is returned.", fix: "No fix. Note the node's <code>next</code> is <em>written</em> even though it was already <code>None</code> — harmless." },
      { input: "Forgetting to save <code>nxt</code>", effect: "After <code>cur.next = prev</code> the rest of the list is unreachable. You keep two nodes and lose n−2.", fix: "The save must be the <b>first</b> line of the loop body. Say the four lines in order out loud before writing them." },
      { input: "Recursive version at n = 10⁵", effect: "Stack overflow. Python's default limit is 1000 frames; the JVM dies around 10⁴.", fix: "Iterative always in an OA. Mention the recursive version exists and is O(n) stack — then do not write it." },
      { input: "Reversing a sublist [m, n]", effect: "Reconnecting the two boundaries is where this breaks; the node before <code>m</code> must point at the new head and the old <code>m</code> must point past <code>n</code>.", fix: "Use a dummy so <code>m = 1</code> is not special, and name the four boundary pointers before writing any loop." },
    ],
    walk: [
      {
        title: "Simple — the four-line dance",
        input: "1 → 2 → 3",
        cols: ["prev", "cur", "nxt", "after <code>cur.next = prev</code>"],
        rows: [
          ["<code>None</code>", "1", "2", "1 → None"],
          ["1", "2", "3", "2 → 1 → None"],
          ["2", "3", "<code>None</code>", "3 → 2 → 1 → None"],
          ["3", "<code>None</code>", "—", "loop exits, return <code>prev</code> = 3"],
        ],
        lesson: "The return value is <code>prev</code>, not <code>cur</code> — <code>cur</code> is <code>None</code> when you exit. Returning <code>cur</code> gives an empty list and is the second-most-common bug after losing <code>nxt</code>.",
      },
      {
        title: "Harder — what losing <code>nxt</code> actually does",
        input: "1 → 2 → 3 → 4, with the save line deleted",
        cols: ["step", "code run", "state", "reachable"],
        rows: [
          ["1", "<code>cur.next = prev</code>", "1 → None", "1"],
          ["2", "<code>cur = cur.next</code>", "cur = None", "1 only"],
          ["3", "loop exits immediately", "returns 1", "nodes 2,3,4 orphaned"],
        ],
        lesson: "It does not crash and it does not loop forever — it returns a one-element list. Silent truncation is worse than a crash, and it is why the trace table above is worth writing on paper the first few times.",
      },
    ],
  },

  "Fast & slow pointers": {
    edges: [
      { input: "Even-length list, finding the middle", effect: "<code>slow</code> lands on the <b>second</b> middle: for 1→2→3→4→5→6 it stops at 4, not 3.", fix: "If you need the first middle, start <code>fast = head.next</code>. Decide which the problem wants <em>before</em> writing the loop condition." },
      { input: "Odd-length list", effect: "Lands on the exact middle: 1→2→3→4→5 gives 3.", fix: "No fix. Trace both parities — the two loop conditions differ only in where <code>fast</code> starts." },
      { input: "Guarding only <code>fast</code>", effect: "<code>fast.next.next</code> dereferences null on even lengths. Immediate crash.", fix: "<code>while fast and fast.next:</code> — both, always." },
      { input: "Cycle of length 1 (node points at itself)", effect: "Detected on the first step; <code>slow</code> and <code>fast</code> both sit on that node.", fix: "Correct. But <code>if slow == fast</code> must be checked <em>after</em> moving both, not before, or the initial equality reports a false cycle." },
      { input: "No cycle at all", effect: "<code>fast</code> reaches <code>None</code> and the loop exits. O(n).", fix: "Return <code>False</code> / the middle. No infinite loop is possible because <code>fast</code> strictly advances." },
    ],
    walk: [
      {
        title: "Simple — the middle, both parities",
        input: "1→2→3→4→5 and 1→2→3→4→5→6",
        cols: ["length", "slow path", "fast path", "slow ends at"],
        rows: [
          ["5 (odd)", "1 → 2 → 3", "1 → 3 → 5", "<b>3</b> — the exact middle"],
          ["6 (even)", "1 → 2 → 3 → 4", "1 → 3 → 5 → null", "<b>4</b> — the <em>second</em> middle"],
        ],
        lesson: "Fast covers twice the ground, so when it hits the end slow is halfway. The even case landing on 4 rather than 3 changes the answer to 'delete the middle node' and to palindrome-splitting — read the problem statement for which one it wants.",
      },
      {
        title: "Harder — cycle detection, step by step",
        input: "1→2→…→9, with 9 pointing back to 3",
        cols: ["step", "slow", "fast", "equal?"],
        rows: [
          ["1", "2", "3", "no"],
          ["2", "3", "5", "no"],
          ["3", "4", "7", "no"],
          ["4", "5", "9", "no"],
          ["5", "6", "4", "no — fast has wrapped"],
          ["6", "7", "6", "no"],
          ["7", "8", "8", "<b>yes</b> — cycle detected"],
        ],
        lesson: "They meet at node 8, which is <em>not</em> the cycle entrance. Detection and location are two different problems, and reporting the meeting point as the entrance is the standard wrong answer.",
      },
      {
        title: "Hardest — finding the cycle entrance",
        input: "Continue from the meeting point at node 8",
        cols: ["step", "p (from head)", "q (from meet)", "equal?"],
        rows: [
          ["0", "1", "8", "no"],
          ["1", "2", "9", "no"],
          ["2", "3", "3", "<b>yes</b> → entrance is node 3"],
        ],
        lesson: "Reset one pointer to the head, advance both one step at a time, and they meet at the entrance. Why: if the tail before the cycle has length <code>a</code> and they met <code>b</code> into the cycle, then <code>a ≡ −b (mod cycle length)</code> — so walking <code>a</code> more from the meeting point lands exactly on the entrance. Say that sentence in the interview; the code alone is not the answer they want.",
      },
    ],
  },

  "Merge two sorted lists": {
    edges: [
      { input: "One list empty", effect: "The loop never runs and the tail attach returns the other list whole.", fix: "This is exactly why the trailing <code>tail.next = l1 or l2</code> is not optional." },
      { input: "Both empty", effect: "Returns <code>dummy.next = None</code>.", fix: "No special case needed with a dummy." },
      { input: "Forgetting the tail attach", effect: "Silently truncates. Passes on equal-length interleaved inputs, fails the moment one list runs out early.", fix: "Write <code>tail.next = l1 or l2</code> <em>before</em> writing the loop, so you cannot forget it." },
      { input: "Equal values in both lists", effect: "Either choice is sorted, but taking from <code>l2</code> on ties makes the merge unstable.", fix: "Use <code>&lt;=</code> on <code>l1</code> to keep it stable. Matters when the nodes carry payloads, and matters in merge sort." },
      { input: "Merging k lists this way, one at a time", effect: "O(k·n) — the accumulated list is rescanned every merge.", fix: "Pairwise merge in rounds, or a k-way heap: both O(n·log k). This is the follow-up in about half of the OAs that ask the two-list version." },
    ],
    walk: [
      {
        title: "Simple — strict interleave",
        input: "l1 = 1→4→5, l2 = 2→3→6",
        cols: ["l1 head", "l2 head", "take", "result so far"],
        rows: [
          ["1", "2", "l1 (1 ≤ 2)", "1"],
          ["4", "2", "l2", "1→2"],
          ["4", "3", "l2", "1→2→3"],
          ["4", "6", "l1", "1→2→3→4"],
          ["5", "6", "l1", "1→2→3→4→5"],
          ["<code>None</code>", "6", "loop exits", "attach tail → 1→2→3→4→5→6"],
        ],
        lesson: "Five comparisons for six nodes. The last node arrives via the tail attach, not the loop — delete that line and you return a five-element list.",
      },
      {
        title: "Harder — one list exhausts immediately",
        input: "l1 = 1, l2 = 2→3→4→5→6",
        cols: ["step", "action", "result"],
        rows: [
          ["1", "1 ≤ 2 → take l1; l1 becomes <code>None</code>", "1"],
          ["2", "loop condition fails", "1"],
          ["3", "<code>tail.next = l1 or l2</code> → attaches 2→3→4→5→6", "1→2→3→4→5→6"],
        ],
        lesson: "One comparison, five nodes attached in O(1) by pointer. This is the input that exposes a missing tail attach, and it is why 'it worked on my example' means nothing if your example was balanced.",
      },
      {
        title: "Hardest — ties, and why stability matters",
        input: "l1 = 2ᴬ→2ᴮ, l2 = 2ˣ→2ʸ (same keys, different payloads)",
        cols: ["comparison", "with <code>&lt;=</code>", "with <code>&lt;</code>"],
        rows: [
          ["2ᴬ vs 2ˣ", "take 2ᴬ", "take 2ˣ"],
          ["2ᴮ vs 2ˣ", "take 2ᴮ", "take 2ʸ"],
          ["result", "2ᴬ 2ᴮ 2ˣ 2ʸ — stable", "2ˣ 2ʸ 2ᴬ 2ᴮ — reversed"],
        ],
        lesson: "Both outputs are sorted by key, so a checker comparing keys accepts either. If the problem says 'preserve original relative order' the <code>&lt;</code> version fails, and the failing test looks arbitrary until you notice the tie rule.",
      },
    ],
  },

  /* ---------------------------------------------------------------- stacks */

  "Balanced brackets": {
    edges: [
      { input: "Empty string", effect: "Stack ends empty → valid.", fix: "Correct by convention. Confirm the problem agrees; a few define empty as invalid." },
      { input: "Closer arrives on an empty stack, e.g. <code>)</code>", effect: "Popping an empty stack raises <code>IndexError</code> in Python, or is UB in C++.", fix: "Check <code>if not stack: return False</code> <b>before</b> popping. First of the two failure modes." },
      { input: "Stack non-empty at the end, e.g. <code>(((</code>", effect: "Every character was fine individually, so a check-inside-the-loop-only version returns <code>True</code>.", fix: "<code>return not stack</code> as the last line. Second failure mode, and the one people skip." },
      { input: "Mismatched types, <code>(]</code>", effect: "Popping without comparing accepts it.", fix: "Compare the popped opener against the closer's expected partner: <code>if stack.pop() != PAIRS[c]</code>." },
      { input: "Odd-length input", effect: "Cannot possibly balance.", fix: "<code>if len(s) &amp; 1: return False</code> is a legitimate O(1) early exit worth mentioning — it halves the work on random tests." },
    ],
    walk: [
      {
        title: "Simple — valid nesting",
        input: 's = "({[]})"',
        cols: ["char", "action", "stack after"],
        rows: [
          ["<code>(</code>", "push", "<code>(</code>"],
          ["<code>{</code>", "push", "<code>( {</code>"],
          ["<code>[</code>", "push", "<code>( { [</code>"],
          ["<code>]</code>", "pop <code>[</code> — matches", "<code>( {</code>"],
          ["<code>}</code>", "pop <code>{</code> — matches", "<code>(</code>"],
          ["<code>)</code>", "pop <code>(</code> — matches", "empty"],
        ],
        lesson: "Empty stack at the end → valid. The stack depth is the nesting depth, which is also the answer to the common follow-up 'what is the maximum nesting level'.",
      },
      {
        title: "Harder — both failure modes side by side",
        input: '"(]" , ")(" and "((" ',
        cols: ["input", "where it fails", "which check catches it"],
        rows: [
          ["<code>(]</code>", "pop returns <code>(</code>, expected <code>[</code>", "the type comparison"],
          ["<code>)(</code>", "first char is a closer, stack empty", "the empty-stack guard"],
          ["<code>((</code>", "loop completes cleanly", "the final <code>not stack</code>"],
        ],
        lesson: "Three inputs, three different lines of code catching them. If you can only remember one thing about this pattern: it has three checks, not one, and the hidden tests contain one input per check.",
      },
    ],
  },

  "Monotonic deque (window max)": {
    edges: [
      { input: "k = 1", effect: "Every element is its own window max; the deque never holds more than one index.", fix: "Correct. Good sanity check that your output length is <code>n − k + 1</code>." },
      { input: "k = n", effect: "One output — the global max.", fix: "Correct, provided the emit guard is <code>if i &gt;= k − 1</code> and not <code>i &gt;= k</code>." },
      { input: "Strictly decreasing input", effect: "Nothing is ever evicted from the back; the deque grows to k and evicts only from the front.", fix: "Correct, and it is the worst case for memory: O(k). Confirm the front-expiry check uses <code>&lt;= i − k</code>." },
      { input: "Storing values instead of indices", effect: "You cannot tell whether the front has left the window, so stale maxima persist.", fix: "Store indices. Always. This is the single design decision the pattern rests on." },
      { input: "Duplicate values, using <code>&lt;</code> instead of <code>&lt;=</code> on the back", effect: "Duplicates accumulate; still correct, but the deque is larger than it needs to be.", fix: "Either works. <code>&lt;=</code> keeps it tighter; say which you chose and why." },
    ],
    walk: [
      {
        title: "Simple — the classic input",
        input: "a = [1, 3, −1, −3, 5, 3, 6, 7], k = 3",
        cols: ["i", "a[i]", "deque (values)", "front expired?", "emit"],
        rows: [
          ["0", "1", "[1]", "—", "—"],
          ["1", "3", "[3] — 1 evicted from back", "—", "—"],
          ["2", "−1", "[3, −1]", "no", "<b>3</b>"],
          ["3", "−3", "[3, −1, −3]", "no", "<b>3</b>"],
          ["4", "5", "[5] — all three evicted", "—", "<b>5</b>"],
          ["5", "3", "[5, 3]", "no", "<b>5</b>"],
          ["6", "6", "[6] — 5 and 3 evicted", "—", "<b>6</b>"],
          ["7", "7", "[7]", "—", "<b>7</b>"],
        ],
        lesson: "Output [3,3,5,5,6,7]. The deque is always decreasing front-to-back, so the front is always the window max. Each index is pushed once and popped once → O(n) despite the inner while loop.",
      },
      {
        title: "Harder — front expiry is the other half",
        input: "a = [9, 8, 7, 6], k = 2",
        cols: ["i", "a[i]", "deque before expiry", "front expired?", "deque after", "emit"],
        rows: [
          ["0", "9", "[9]", "—", "[9]", "—"],
          ["1", "8", "[9, 8]", "index 0 &gt; 1−2 → no", "[9, 8]", "<b>9</b>"],
          ["2", "7", "[9, 8, 7]", "index 0 ≤ 0 → <b>yes</b>", "[8, 7]", "<b>8</b>"],
          ["3", "6", "[8, 7, 6]", "index 1 ≤ 1 → <b>yes</b>", "[7, 6]", "<b>7</b>"],
        ],
        lesson: "Nothing is ever evicted from the back here — a decreasing array never triggers it. Every correct answer comes from the front-expiry check instead. Delete that check and you emit [9,9,9], which passes the previous trace and fails this one.",
      },
    ],
  },

  "Auxiliary stack (min-stack)": {
    edges: [
      { input: "<code>min()</code> on an empty stack", effect: "Undefined; <code>ms[-1]</code> raises.", fix: "Either document it as a precondition or return a sentinel. State which — the interviewer is listening for it." },
      { input: "Pushing a duplicate of the current minimum", effect: "If you only push to the min-stack on a strict <code>&lt;</code>, popping one copy pops the min-stack too and the minimum is lost while a copy is still on the main stack.", fix: "Push on <code>&lt;=</code>, or push the running min on <b>every</b> push. The second is simpler and O(n) space either way." },
      { input: "All elements equal", effect: "With the <code>&lt;=</code> rule the min-stack mirrors the main stack exactly. O(n) extra space.", fix: "Acceptable. If asked to do better, store (value, count) pairs — that is the intended follow-up." },
      { input: "Pop without a matching min-stack pop", effect: "The two stacks desynchronise permanently and every later <code>min()</code> is wrong.", fix: "Pop both in the same method. If you use the conditional-push variant, pop the min-stack only when <code>st.pop() == ms[-1]</code>." },
      { input: "Follow-up: O(1) extra space", effect: "Possible by storing <code>2·v − min</code> encoded values, but it overflows on the constraint bounds.", fix: "Mention it, note the overflow, and use the two-stack version unless they insist." },
    ],
    walk: [
      {
        title: "Simple — the two stacks move together",
        input: "push 5, push 3, push 7",
        cols: ["op", "main stack", "min stack", "min()"],
        rows: [
          ["push 5", "[5]", "[5]", "5"],
          ["push 3", "[5, 3]", "[5, 3]", "3"],
          ["push 7", "[5, 3, 7]", "[5, 3, 3]", "3"],
        ],
        lesson: "Pushing 7 pushes <code>min(7, 3) = 3</code> to the min-stack, not 7. The min-stack holds 'the minimum of everything at or below this level', which is what makes pop O(1).",
      },
      {
        title: "Harder — the duplicate-minimum trap",
        input: "push 5, push 3, push 3, then pop twice",
        cols: ["op", "main stack", "min stack", "min()"],
        rows: [
          ["push 5", "[5]", "[5]", "5"],
          ["push 3", "[5, 3]", "[5, 3]", "3"],
          ["push 3", "[5, 3, 3]", "[5, 3, 3]", "3"],
          ["pop", "[5, 3]", "[5, 3]", "<b>3</b> ✓ still correct"],
          ["pop", "[5]", "[5]", "5"],
        ],
        lesson: "Now run it with the strict-<code>&lt;</code> variant: the second <code>push 3</code> pushes nothing, so the first <code>pop</code> removes 3 from the min-stack and <code>min()</code> reports 5 while a 3 is still on the stack. The bug needs a duplicate minimum <em>and</em> a pop to appear, which is why it survives casual testing.",
      },
    ],
  },

  /* ---------------------------------------------------------- backtracking */

  "Subsets & combinations": {
    edges: [
      { input: "Empty input", effect: "One subset — the empty one. Output is <code>[[]]</code>, not <code>[]</code>.", fix: "Falls out naturally if you record at every node. Getting <code>[]</code> means you only record at leaves." },
      { input: "Appending <code>path</code> instead of <code>path[:]</code>", effect: "Every stored result is the same live list, so after backtracking you get 2ⁿ identical empty lists.", fix: "<code>res.append(path[:])</code> in Python, <code>new ArrayList&lt;&gt;(path)</code> in Java, <code>res.push_back(path)</code> in C++ (which copies by default)." },
      { input: "Duplicates in the input, distinct subsets wanted", effect: "<code>[1,2,2]</code> produces <code>[2]</code> twice.", fix: "Sort, then <code>if i &gt; start and a[i] == a[i−1]: continue</code>. The <code>i &gt; start</code> clause is what allows the duplicate <em>within</em> one branch while blocking it across siblings." },
      { input: "n = 20", effect: "2²⁰ ≈ 10⁶ subsets — fine. n = 25 is 3·10⁷ and borderline; n = 30 is 10⁹ and hopeless.", fix: "<code>n ≤ 20</code> in the constraints is the problem telling you exponential is intended. Above that it wants DP or meet in the middle." },
      { input: "Recording only at depth == k (combinations)", effect: "Correct, but you still explore branches that cannot reach k.", fix: "Prune: <code>if len(path) + (n − i) &lt; k: break</code>. Cuts a large fraction of the tree for small k." },
    ],
    walk: [
      {
        title: "Simple — the full subset tree",
        input: "a = [1, 2, 3]",
        cols: ["call", "path on entry", "recorded", "then tries"],
        rows: [
          ["f(0)", "[]", "<code>[]</code>", "i = 0,1,2"],
          ["f(1) via 1", "[1]", "<code>[1]</code>", "i = 1,2"],
          ["f(2) via 2", "[1,2]", "<code>[1,2]</code>", "i = 2"],
          ["f(3) via 3", "[1,2,3]", "<code>[1,2,3]</code>", "nothing"],
          ["back to f(1), i = 2", "[1,3]", "<code>[1,3]</code>", "nothing"],
          ["back to f(0), i = 1", "[2]", "<code>[2]</code>", "i = 2 → <code>[2,3]</code>"],
          ["back to f(0), i = 2", "[3]", "<code>[3]</code>", "nothing"],
        ],
        lesson: "8 = 2³ results, recorded at <em>every</em> node rather than only at leaves. The <code>start</code> index is what makes these combinations rather than permutations — it forbids looking backwards, so <code>[2,1]</code> is never generated.",
      },
      {
        title: "Harder — duplicates, and why <code>i &gt; start</code>",
        input: "a = [1, 2, 2] (already sorted)",
        cols: ["call", "i", "a[i] == a[i−1]?", "i &gt; start?", "action"],
        rows: [
          ["f(0), path []", "0", "—", "—", "take 1"],
          ["f(0), path []", "1", "no", "—", "take 2 → path [2]"],
          ["f(0), path []", "2", "<b>yes</b>", "<b>yes</b> (2 &gt; 0)", "<b>skip</b> — sibling duplicate"],
          ["f(2), path [2]", "2", "yes", "<b>no</b> (2 = 2)", "take → path [2,2] ✓"],
        ],
        lesson: "Row 3 blocks the second <code>[2]</code>. Row 4 must <em>not</em> be blocked, or you lose <code>[2,2]</code> entirely. Drop the <code>i &gt; start</code> clause and you get correct dedup plus a missing answer — a bug that looks like the opposite of what it is.",
      },
      {
        title: "Hardest — the copy bug, made visible",
        input: "a = [1, 2] with <code>res.append(path)</code>",
        cols: ["moment", "res contents", "why"],
        rows: [
          ["after recording []", "[ [] ]", "stores a reference to <code>path</code>"],
          ["after path.append(1)", "[ [1] ]", "the stored list <em>changed</em>"],
          ["after recording [1]", "[ [1], [1] ]", "two references, same object"],
          ["after all backtracking", "[ [], [], [], [] ]", "path is empty again — every entry is it"],
        ],
        lesson: "The final answer has the right <em>shape</em> (4 entries for n = 2) and entirely wrong contents. If your output is the correct length but full of identical values, this is always the cause.",
      },
    ],
  },

  Permutations: {
    edges: [
      { input: "Empty input", effect: "One permutation — the empty one.", fix: "<code>[[]]</code>. Same convention as subsets." },
      { input: "n = 10", effect: "10! = 3.6·10⁶ — fine. 11! = 4·10⁷ is borderline, 12! = 5·10⁸ is not.", fix: "<code>n ≤ 8</code> or so in the constraints means permutations are intended. Larger n means the problem is not really asking for all of them." },
      { input: "Duplicates without the <code>used[i−1]</code> clause", effect: "<code>[1,1,2]</code> emits each permutation twice.", fix: "Sort, then <code>if i &gt; 0 and a[i] == a[i−1] and not used[i−1]: continue</code>. The <code>not used[i−1]</code> is the most-forgotten condition in backtracking." },
      { input: "Using <code>used[i−1]</code> instead of <code>not used[i−1]</code>", effect: "Also dedups — but keeps a different canonical ordering. Correct by accident on some inputs, wrong on others.", fix: "Fix the convention to 'the earlier duplicate must be placed first' and the <code>not</code> version is the one that expresses it." },
      { input: "Swap-based generation with duplicates", effect: "The <code>used</code> trick does not transfer; swapping breaks the sorted order the dedup relies on.", fix: "Use a <code>set</code> of values tried at each depth instead, or stay with the <code>used</code>-array formulation." },
    ],
    walk: [
      {
        title: "Simple — the permutation tree",
        input: "a = [1, 2, 3]",
        cols: ["depth", "path", "available", "branches"],
        rows: [
          ["0", "[]", "1,2,3", "3"],
          ["1", "[1]", "2,3", "2"],
          ["2", "[1,2]", "3", "1"],
          ["3", "[1,2,3]", "—", "<b>record</b>"],
          ["backtrack to 1", "[1,3]", "2", "→ [1,3,2] <b>record</b>"],
          ["backtrack to 0", "[2] …", "1,3", "→ [2,1,3], [2,3,1]"],
          ["backtrack to 0", "[3] …", "1,2", "→ [3,1,2], [3,2,1]"],
        ],
        lesson: "3! = 6 results, recorded only at <em>leaves</em> — the opposite of subsets, where you record at every node. That single difference is the whole distinction between the two patterns.",
      },
      {
        title: "Harder — the duplicate rule, both branches",
        input: "a = [1, 1, 2], at depth 0",
        cols: ["i", "a[i] == a[i−1]?", "used[i−1]?", "verdict"],
        rows: [
          ["0", "—", "—", "take 1ᴬ"],
          ["1", "yes", "<b>false</b> — 1ᴬ not placed", "<b>skip</b>"],
          ["2", "no", "—", "take 2"],
        ],
        lesson: "At depth 0 the second 1 is skipped, so <code>[1ᴮ,1ᴬ,2]</code> is never generated. But one level down, after 1ᴬ <em>is</em> placed, <code>used[0]</code> is true and the second 1 is allowed — giving <code>[1,1,2]</code> exactly once. The condition encodes 'duplicates must be used left to right'.",
      },
      {
        title: "Hardest — what each wrong condition actually produces",
        input: "Three variants, run on three inputs. These counts were measured, not reasoned.",
        cols: ["condition", "[1,1]", "[1,1,1]", "[1,1,2]"],
        rows: [
          ["no dedup", "2 — duplicated", "6 — all identical", "6 — each twice"],
          ["<code>a[i]==a[i−1]</code> only", "<b>0</b>", "<b>0</b>", "<b>0</b>"],
          ["<code>… and not used[i−1]</code>", "1 ✓", "1 ✓", "3 ✓"],
        ],
        lesson: "The half-condition does not produce <em>too few</em> results — it produces <b>none at all</b>, at every size. Once the first 1 is placed, index 1 is still blocked because the check never asks whether index 0 was used, so no branch can ever reach full depth. A solution returning an empty list looks like a crash-adjacent bug rather than a dedup bug, which is why this one wastes so much time under a clock.",
      },
    ],
  },

  "Meet in the middle": {
    edges: [
      { input: "Odd n", effect: "Halves differ by one element; the larger half dominates the cost.", fix: "Split as <code>n//2</code> and <code>n − n//2</code>. The asymmetry is harmless — 2^⌈n/2⌉ is still the bound." },
      { input: "Joining with a nested loop over both halves", effect: "2^(n/2) · 2^(n/2) = 2ⁿ. You have done all the work and gained nothing.", fix: "Sort one half, then binary search or two-pointer. That is the entire point of the technique." },
      { input: "n = 40", effect: "2⁴⁰ = 10¹² brute force; 2²⁰ = 10⁶ per half. Feasible.", fix: "<code>n ≤ 40</code> with an exponential-looking problem is the standard signal for this pattern." },
      { input: "Memory", effect: "Each half stores 2^(n/2) sums — at n = 40 that is 10⁶ longs per side, about 8 MB each. Fine.", fix: "At n = 50 it is 3·10⁷ per side and you will exceed the limit before the time limit." },
      { input: "Needing the actual subset, not just the sum", effect: "Storing the subset with each sum multiplies memory by n.", fix: "Store the bitmask alongside the sum — one 32-bit int per entry, and you can reconstruct in O(n)." },
    ],
    walk: [
      {
        title: "Simple — the split",
        input: "a = [7,3,5,9,2,8], find the largest subset sum ≤ 17",
        cols: ["half", "elements", "all subset sums (sorted)", "count"],
        rows: [
          ["left", "[7, 3, 5]", "0, 3, 5, 7, 8, 10, 12, 15", "2³ = 8"],
          ["right", "[9, 2, 8]", "0, 2, 8, 9, 10, 11, 17, 19", "2³ = 8"],
        ],
        lesson: "16 sums enumerated instead of 2⁶ = 64. The saving looks small at n = 6; at n = 40 it is 2·10⁶ instead of 10¹², which is the difference between one second and thirty thousand years.",
      },
      {
        title: "Harder — the join, done properly",
        input: "For each left sum L, binary search the largest right sum ≤ 17 − L",
        cols: ["L", "budget 17 − L", "best right ≤ budget", "total"],
        rows: [
          ["0", "17", "17", "<b>17</b>"],
          ["3", "14", "11", "14"],
          ["5", "12", "11", "16"],
          ["7", "10", "10", "<b>17</b>"],
          ["8", "9", "9", "<b>17</b>"],
          ["10", "7", "2", "12"],
          ["12", "5", "2", "14"],
          ["15", "2", "2", "<b>17</b>"],
        ],
        lesson: "Answer 17, matching brute force over all 64 subsets. Eight binary searches at log 8 = 3 steps each — 24 operations for the join, not 64 pairings. Sorting the right half once is what buys that.",
      },
      {
        title: "Hardest — the two-pointer join, and why it is faster still",
        input: "Both halves sorted; L ascending, R descending",
        cols: ["L pointer", "R pointer", "sum", "action"],
        rows: [
          ["0", "19", "19 &gt; 17", "R--"],
          ["0", "17", "17 ≤ 17", "record 17, L++"],
          ["3", "17", "20 &gt; 17", "R--"],
          ["3", "11", "14 ≤ 17", "record 14, L++"],
          ["…", "…", "…", "each pointer moves at most 2^(n/2) times"],
        ],
        lesson: "O(2^(n/2)) for the join instead of O(2^(n/2) · n/2) with binary search. Both pass; the two-pointer version is what you say when asked 'can the join be faster'. It only works because the answer is monotone in L — state that, because it is the part being tested.",
      },
    ],
  },
};
