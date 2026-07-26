import type { Pattern } from "../types";

/**
 * Worked traces and edge matrices for the dynamic-programming patterns.
 *
 * DP is where a state table beats any amount of prose: you cannot argue with a filled
 * grid. As with the graph set, the third trace in each group is the one where the
 * obvious mental model quietly produces the wrong answer.
 */
type Extra = Pick<Pattern, "edges" | "walk">;

export const WALKS_DP: Readonly<Record<string, Extra>> = {
  "1D linear DP": {
    edges: [
      { input: "n = 0", effect: "The loop never runs and you return the seed. Whether 0 is right depends on the problem.", fix: "Decide what the empty answer means and state it. House robber → 0; decode ways → 0 or 1 depending on the convention." },
      { input: "n = 1", effect: "Most recurrences read <code>dp[i-2]</code>, which is out of range.", fix: "Seed two values before the loop, or start the loop at index 2 with dp[0] and dp[1] set." },
      { input: "All values are zero", effect: "Every answer is 0 — correct, but it hides seeding bugs that only show on non-trivial input.", fix: "Never test only with zeros. Use a case where skipping beats taking." },
      { input: "Negative values (house robber variants)", effect: "Seeding <code>best = 0</code> silently means 'take nothing', which may be disallowed.", fix: "Check whether the empty selection is legal. If not, seed from a[0]." },
      { input: "Rolled to two scalars, then asked for the choices", effect: "You cannot reconstruct which items were picked — the history is gone.", fix: "Keep the full array, or store parent pointers. O(1) space and reconstruction are mutually exclusive." },
      { input: "Circular variant (first and last adjacent)", effect: "The linear recurrence happily takes both ends.", fix: "Run it twice — once excluding the first element, once excluding the last — and take the max. That is the whole of House Robber II." },
    ],
    walk: [
      {
        title: "Simple — house robber on [2, 7, 9, 3]",
        input: "cannot take two adjacent",
        cols: ["v", "prev2 (skip)", "prev1 (best so far)", "take = prev2 + v", "new prev1"],
        rows: [
          ["2", "0", "0", "0 + 2 = 2", "max(0, 2) = 2"],
          ["7", "0", "2", "0 + 7 = 7", "max(2, 7) = 7"],
          ["9", "2", "7", "2 + 9 = 11", "max(7, 11) = 11"],
          ["3", "7", "11", "7 + 3 = 10", "max(11, 10) = 11"],
        ],
        lesson: "The answer 11 is 2 + 9. Notice the last step: taking 3 would have given 10, so the DP correctly declines it. Two scalars carry everything the future needs — that is what makes the table collapsible.",
      },
      {
        title: "Harder — why prev2 must lag, not equal prev1",
        input: "same array, but updating prev2 = prev1 BEFORE computing take",
        cols: ["v", "correct order", "buggy order", "difference"],
        rows: [
          ["2", "take = 0+2 = 2", "prev2←0, take = 0+2 = 2", "same"],
          ["7", "take = 0+7 = 7", "prev2←2, take = <b>2+7 = 9</b>", "<b>took 2 AND 7 — adjacent!</b>"],
          ["9", "take = 2+9 = 11", "take = 9+9 = 18", "compounding nonsense"],
        ],
        lesson: "prev2 must hold the best answer from <em>two</em> steps back. Advancing it before you use it makes it one step back, which permits adjacent picks — the exact constraint the problem forbids. The simultaneous assignment <code>prev2, prev1 = prev1, max(...)</code> exists to prevent this.",
      },
      {
        title: "Hardest — decode ways, where a zero changes everything",
        input: "s = \"106\"  vs  s = \"100\"",
        cols: ["prefix", "\"106\" ways", "\"100\" ways", "why"],
        rows: [
          ["\"1\"", "1", "1", "just '1'"],
          ["\"10\"", "1", "1", "'10' only — '1','0' is invalid, 0 has no letter"],
          ["\"106\"", "<b>1</b>", "—", "'10','6'  — '1','06' invalid, leading zero"],
          ["\"100\"", "—", "<b>0</b>", "'10','0' invalid, '1','00' invalid → no decoding"],
        ],
        lesson: "A zero is never a standalone letter and can only survive as the second digit of 10 or 20. Two zeros in a row, or a zero after 3–9, kills the whole string. Most wrong submissions handle 'zero exists' but not 'zero makes the count exactly 0' — and the DP has to propagate that 0 forward, not restart.",
      },
    ],
  },

  "Unbounded knapsack / coin change": {
    edges: [
      { input: "amount = 0", effect: "dp[0] = 0 and the answer is 'zero coins', which is correct but often mis-seeded as infinity.", fix: "dp[0] = 0 always. It is the base case, not a special case." },
      { input: "No combination reaches the amount", effect: "dp[amount] stays at the infinity sentinel; returning it raw leaks the sentinel.", fix: "Map it to −1 explicitly. And guard <code>dp[w-c] != INF</code> before adding, or INF+1 overflows in C++/Java." },
      { input: "A coin larger than the amount", effect: "The inner loop <code>range(c, amount+1)</code> does not execute. Correctly skipped.", fix: "Nothing. Say it out loud — it shows you read the loop bound." },
      { input: "Coin value 0", effect: "Infinite loop or infinite ways, depending on the variant.", fix: "Filter zero and negative coins up front, or assert they cannot occur." },
      { input: "Loop nesting swapped", effect: "Coins outer / amount inner counts COMBINATIONS. Amount outer / coins inner counts PERMUTATIONS. Both compile.", fix: "LC 518 wants combinations, LC 377 wants permutations. Identical code, swapped loops, different answers." },
      { input: "Counting ways with a large answer", effect: "The count can exceed int32 even when the amount is small.", fix: "Use <code>long</code>, or apply the modulus the problem gives you." },
    ],
    walk: [
      {
        title: "Simple — fewest coins for 6 from {1, 3, 4}",
        input: "dp[w] = fewest coins to make w, ascending capacity",
        cols: ["w", "via 1", "via 3", "via 4", "dp[w]"],
        rows: [
          ["0", "—", "—", "—", "0"],
          ["1", "dp[0]+1 = 1", "—", "—", "1"],
          ["2", "dp[1]+1 = 2", "—", "—", "2"],
          ["3", "dp[2]+1 = 3", "dp[0]+1 = 1", "—", "<b>1</b>"],
          ["4", "dp[3]+1 = 2", "dp[1]+1 = 2", "dp[0]+1 = 1", "<b>1</b>"],
          ["6", "dp[5]+1 = 3", "dp[3]+1 = <b>2</b>", "dp[2]+1 = 3", "<b>2</b>"],
        ],
        lesson: "6 = 3 + 3, two coins. The greedy 'take the biggest coin first' would take 4, then 1 and 1 — three coins. Coin systems where greedy works are the exception; {1,3,4} is the standard counterexample.",
      },
      {
        title: "Harder — ascending capacity is what permits reuse",
        input: "coin 3, amount 6",
        cols: ["w", "reads dp[w−3]", "that value was set", "so coin 3 is used"],
        rows: [
          ["3", "dp[0]", "at init", "once"],
          ["6", "dp[3]", "<b>this same pass</b>", "<b>twice</b>"],
        ],
        lesson: "dp[3] already includes one coin 3 when dp[6] reads it, so dp[6] gets two. That reuse is the definition of unbounded. Flip the loop to descending and dp[3] would still hold its pre-coin value, giving 0/1 knapsack — each coin once. One loop direction, two different problems.",
      },
      {
        title: "Hardest — combinations vs permutations, same code",
        input: "amount 3, coins {1, 2}",
        cols: ["loop order", "counts", "result", "why"],
        rows: [
          ["coins outer, amount inner", "{1,1,1}, {1,2}", "<b>2</b>", "coin 2 is only ever considered after all of coin 1 — order cannot vary"],
          ["amount outer, coins inner", "{1,1,1}, {1,2}, {2,1}", "<b>3</b>", "at each amount every coin is retried, so orderings are distinct"],
        ],
        lesson: "Nothing about the arithmetic changed — only which loop is outside. Coins outside fixes an order on the coins, so each multiset is counted once. Amount outside lets every coin lead at every step, so sequences are counted. LC 518 and LC 377 differ by exactly this, and reading the problem for the word 'combination' versus 'permutation' is the whole task.",
      },
    ],
  },

  "Longest increasing subsequence": {
    edges: [
      { input: "Empty array", effect: "tails stays empty and the length is 0.", fix: "Correct. Verify you do not index tails[0] anywhere unguarded." },
      { input: "All equal, e.g. [5,5,5]", effect: "With bisect_left every 5 replaces the first tail, so the answer is 1 — strictly increasing. With bisect_right you get 3.", fix: "Strict → bisect_left. Non-strict → bisect_right. One function call, opposite answers." },
      { input: "Strictly decreasing", effect: "Every element replaces tails[0]; the answer is 1.", fix: "Correct, and a good sanity check that you are replacing rather than appending." },
      { input: "Asked to print the subsequence", effect: "tails is NOT a valid subsequence — only its length is meaningful. Printing it gives a wrong answer that looks plausible.", fix: "Store, per element, the index it was placed at plus a parent pointer, then walk back from the final placement." },
      { input: "Russian doll / 2D variant", effect: "Sorting by width ascending and height ascending lets two equal-width envelopes nest.", fix: "Width ascending, height <b>descending</b> on ties, then LIS on heights. The descending tie-break is what forbids it." },
      { input: "n = 1", effect: "One append, answer 1.", fix: "Correct. Confirm the binary search handles an empty tails array." },
    ],
    walk: [
      {
        title: "Simple — [10, 9, 2, 5, 3, 7]",
        input: "tails[k] = smallest possible tail of an increasing subsequence of length k+1",
        cols: ["v", "position found", "action", "tails after"],
        rows: [
          ["10", "0 (end)", "append", "[10]"],
          ["9", "0", "replace", "[9]"],
          ["2", "0", "replace", "[2]"],
          ["5", "1 (end)", "append", "[2, 5]"],
          ["3", "1", "replace", "[2, 3]"],
          ["7", "2 (end)", "append", "[2, 3, 7]"],
        ],
        lesson: "Length 3, which is correct (2,3,7 or 2,5,7). Replacing 5 with 3 did not change the length — it lowered the tail, which can only help a future element extend it.",
      },
      {
        title: "Harder — tails is not the answer",
        input: "[2, 5, 3]",
        cols: ["step", "tails", "is tails a real subsequence of the input?"],
        rows: [
          ["after 2", "[2]", "yes"],
          ["after 5", "[2, 5]", "yes"],
          ["after 3", "<b>[2, 3]</b>", "<b>yes here — but only by luck</b>"],
        ],
        lesson: "On [2, 5, 3] tails ends as [2,3] which happens to be a real subsequence. On [10, 9, 2, 5, 3, 7] it ends as [2,3,7] — also real. But run [1, 100, 2, 3] and tails becomes [1,2,3], which IS real, while [4,5,1,2,6] gives tails [1,2,6] where 1 and 2 come after 5 was overwritten. The array is a bookkeeping device: its LENGTH is always right, its CONTENTS are not guaranteed to be a subsequence of anything. Never print it.",
      },
      {
        title: "Hardest — the tie-break that decides Russian doll envelopes",
        input: "envelopes [[5,4], [6,4], [6,7], [2,3]]",
        cols: ["sort rule", "sorted order", "LIS on heights", "result"],
        rows: [
          ["width ↑, height ↑", "[2,3] [5,4] [6,4] [6,7]", "3,4,4,7 → LIS = 3", "<b>3 — WRONG</b>, uses both width-6"],
          ["width ↑, height ↓", "[2,3] [5,4] [6,7] [6,4]", "3,4,7,4 → LIS = 3", "<b>3 — correct</b>: [2,3],[5,4],[6,7]"],
        ],
        lesson: "With heights ascending, two envelopes of the same width sit in increasing height order and LIS happily chains them — but equal widths cannot nest. Sorting height <b>descending</b> within a width makes those heights non-increasing, so LIS can never pick two from the same width group. The entire correctness of the 2D case lives in that one tie-break.",
      },
    ],
  },

  "Grid DP": {
    edges: [
      { input: "Obstacle on the start cell", effect: "dp[0] was seeded to 1 before the obstacle check, so paths exist through a blocked start.", fix: "Check the start cell first and return 0. Order matters: seed, then check, or check, then seed." },
      { input: "Obstacle on the target", effect: "The answer must be 0, but a rolled 1D array may still carry a stale non-zero.", fix: "Zeroing on an obstacle handles it, as long as the zeroing happens for every cell including the last." },
      { input: "Single row or single column", effect: "There is exactly one path — unless an obstacle blocks it, in which case zero.", fix: "The recurrence handles it if you guard <code>c &gt; 0</code>. Test a 1×n grid explicitly." },
      { input: "Rolling to 1D with the wrong loop order", effect: "<code>dp[c-1]</code> is the CURRENT row when iterating left to right, and the previous row when iterating right to left. One of those is wrong for your recurrence.", fix: "For unique-paths, left-to-right is correct: dp[c] is the row above (not yet overwritten) and dp[c-1] is the current row (already written). Write that comment in the code." },
      { input: "Path counts exceeding int", effect: "A 30×30 grid has C(58,29) ≈ 3×10¹⁶ paths — well past int32.", fix: "<code>long</code>, or the modulus the problem specifies." },
      { input: "Min path sum with negative values", effect: "Seeding the running minimum at 0 rather than the first cell breaks it.", fix: "Seed from grid[0][0], never 0 — the same trap as Kadane." },
    ],
    walk: [
      {
        title: "Simple — unique paths on a 3×3 grid",
        input: "move right or down only",
        cols: ["row", "c=0", "c=1", "c=2"],
        rows: [
          ["r=0", "1", "1", "1"],
          ["r=1", "1", "2", "3"],
          ["r=2", "1", "3", "<b>6</b>"],
        ],
        lesson: "Each cell is the sum of the one above and the one to the left. The first row and column are all 1 because there is exactly one way to walk a straight line. 6 = C(4,2), which is the closed form.",
      },
      {
        title: "Harder — one obstacle zeroes a whole region",
        input: "same 3×3 grid, obstacle at (1,1)",
        cols: ["row", "c=0", "c=1", "c=2"],
        rows: [
          ["r=0", "1", "1", "1"],
          ["r=1", "1", "<b>0</b>", "0 + 1 = 1"],
          ["r=2", "1", "1 + 0 = 1", "1 + 1 = <b>2</b>"],
        ],
        lesson: "The obstacle contributes 0 rather than being skipped, so its zero propagates naturally into every cell downstream of it. Six paths become two. Notice (1,2) is 1, not 3 — it lost everything that would have come through the blocked cell.",
      },
      {
        title: "Hardest — what the rolled 1D array actually holds",
        input: "processing row r, currently at column c, iterating LEFT to RIGHT",
        cols: ["expression", "which row it holds", "why"],
        rows: [
          ["<code>dp[c]</code>", "row <b>r−1</b>", "not yet overwritten this pass — it is the cell ABOVE"],
          ["<code>dp[c-1]</code>", "row <b>r</b>", "already overwritten this pass — it is the cell to the LEFT"],
          ["<code>dp[c] += dp[c-1]</code>", "above + left", "exactly the 2D recurrence"],
        ],
        lesson: "The rolled array holds two different rows at once, and which one depends on whether the index is ahead of or behind the cursor. That is why the loop direction is load-bearing: reverse it and <code>dp[c-1]</code> becomes the row above, giving you a diagonal recurrence you did not want. When unsure, keep the 2D table — O(R·C) memory is almost always affordable and the bug class disappears.",
      },
    ],
  },

  "Two-sequence DP (LCS / edit distance)": {
    edges: [
      { input: "Either string empty", effect: "The answer is the length of the other one (edit distance) or 0 (LCS). Row and column 0 must be initialised accordingly.", fix: "For edit distance seed dp[i][0] = i and dp[0][j] = j. Forgetting this is the single most common bug." },
      { input: "Using A[i] instead of A[i-1]", effect: "Everything shifts by one and the answer is wrong in a way that still looks structured.", fix: "The table is (n+1)×(m+1); string indices are ALWAYS i−1 and j−1. Write it in a comment." },
      { input: "Identical strings", effect: "Edit distance 0, LCS = n. A good check that the diagonal branch is right.", fix: "Test it — it catches a swapped match/mismatch branch instantly." },
      { input: "Completely disjoint alphabets", effect: "LCS 0, edit distance max(n,m). Checks the mismatch branch.", fix: "Test both extremes; between them they exercise every branch." },
      { input: "Rolled to one row, then asked for the alignment", effect: "Backtracking needs the full table.", fix: "Keep 2D for reconstruction. O(n·m) memory is the price of the answer." },
      { input: "n·m too large (both 10⁵)", effect: "10¹⁰ cells — impossible.", fix: "Say so. Hirschberg's gives O(n·m) time in O(min(n,m)) space, but if BOTH are 10⁵ the time alone is fatal and the problem wants something else." },
    ],
    walk: [
      {
        title: "Simple — LCS of \"abc\" and \"ac\"",
        input: "match → diagonal + 1;  mismatch → max(up, left)",
        cols: ["", "ø", "a", "c"],
        rows: [
          ["ø", "0", "0", "0"],
          ["a", "0", "<b>1</b>", "1"],
          ["b", "0", "1", "1"],
          ["c", "0", "1", "<b>2</b>"],
        ],
        lesson: "Answer 2 — 'ac'. The 'b' row copies its neighbours unchanged, because b appears in neither position of the second string. Every diagonal step is a matched character.",
      },
      {
        title: "Harder — edit distance \"horse\" → \"ros\", the base row matters",
        input: "dp[i][0] = i (delete i chars), dp[0][j] = j (insert j chars)",
        cols: ["", "ø", "r", "o", "s"],
        rows: [
          ["ø", "<b>0</b>", "<b>1</b>", "<b>2</b>", "<b>3</b>"],
          ["h", "<b>1</b>", "1", "2", "3"],
          ["o", "<b>2</b>", "2", "<b>1</b>", "2"],
          ["r", "<b>3</b>", "2", "2", "2"],
          ["s", "<b>4</b>", "3", "3", "<b>2</b>"],
          ["e", "<b>5</b>", "4", "4", "3"],
        ],
        lesson: "The bold first row and column are the base cases: turning a string into the empty string costs one delete per character. Seed them to 0 instead and every answer comes out too small — the DP thinks you can discard characters for free. The final answer is 3.",
      },
      {
        title: "Hardest — LCS and edit distance are NOT complements",
        input: "A = \"abc\", B = \"acb\"",
        cols: ["measure", "value", "reasoning"],
        rows: [
          ["LCS", "2", "\"ab\" or \"ac\""],
          ["n + m − 2·LCS", "3 + 3 − 4 = <b>2</b>", "the delete-and-insert-only distance"],
          ["true edit distance", "<b>2</b>", "substitute b→c and c→b"],
          ["A = \"abcd\", B = \"badc\"", "LCS 2, formula gives 4, true distance <b>2</b>", "<b>they disagree</b>"],
        ],
        lesson: "When substitution is allowed, edit distance is not derivable from LCS. The formula <code>n + m − 2·LCS</code> is only correct for the delete-and-insert variant (LC 583). Interviewers ask 'can you get one from the other?' precisely because the answer is 'only under a restricted operation set' — and confidently saying yes is the trap.",
      },
    ],
  },
};
