# What to build next, and what your data already says

Written after wiring `leetcode-progress` into the playbook. Everything in the first
section is a fact read out of your repo, not an opinion.

---

## Part 1 — what your 117 solved problems actually show

| | |
| --- | --- |
| Solved | **117** (37 easy / 62 medium / 18 hard) |
| Patterns met | **27 of 63** |
| Patterns with nothing solved | **36** |
| Anchor problems done | **43 of 252** |
| Solved but not an anchor here | **81** |

**The medium/hard split is genuinely good.** 62 medium and 18 hard out of 117 is a
better ratio than most people have a month out. You are not grinding easies.

**The distribution is the problem, not the volume.** Ranked thinnest first:

| topic | patterns met | nearby problems solved |
| --- | --- | --- |
| Greedy | **0 / 2** | 10 |
| Strings | **1 / 5** | 7 |
| Stacks & queues | **1 / 4** | 2 |
| Dynamic programming | **2 / 9** | 4 |
| Arrays & two pointers | **2 / 8** | 19 |
| Trees & BST | 2 / 5 | 1 |
| Bits & math | 2 / 4 | 14 |
| Graphs | 3 / 8 | 7 |
| Linked lists | **4 / 4** | 7 |

Two things worth sitting with:

1. **Greedy is 0 of 2 despite ten solved greedy problems.** That is the single loudest
   signal in your data. You have been solving greedy problems without meeting either of
   the two patterns that generalise. Greedy is also the topic where confident wrong
   answers live, because the code is trivial and the exchange argument is the actual
   work — so ten solves without the pattern is exactly the shape of someone who will
   pattern-match a greedy that does not hold.

2. **Arrays: 19 nearby solves, 2 of 8 patterns.** You have done a lot of array work that
   did not land on Kadane, cyclic sort, in-place read/write, or difference arrays. These
   are cheap — probably an evening each given your base — and 23 of the 25 companies
   weight arrays at 4 or 5.

**Where the ranking puts you today**, across all 25 companies (core tier only, hard tier
deliberately demoted because you are a month out):

1. Kadane (max subarray) → LC 53
2. In-place read / write pointers → LC 26
3. Cyclic sort (index as hash) → LC 41
4. Difference array (range updates) → LC 1109
5. 0/1 knapsack → LC 416
6. Unbounded knapsack / coin change → LC 322
7. Longest increasing subsequence → LC 300
8. Two-sequence DP (LCS / edit distance) → LC 1143
9. Prefix sum + hash map → LC 560

If you target **Google or Meta**, the list reorders to graphs and DP: BFS shortest path,
grid as an implicit graph, cycle detection and bipartite check, 0/1 knapsack, LIS. If you
target **Amazon or a service company**, it stays arrays. The view lets you switch.

---

## Part 2 — build suggestions, ranked by what moves a placement outcome

### Tier 1 — worth doing before your OAs

**1. Import your NOTES.md into the drill deck.**
You have written 109 sets of notes, and they are better revision material than anything I
wrote, because they are in your words. Right now the drill deck is generated from my
pattern data only. Parsing the "Where people go wrong" section out of each NOTES.md into
drill cards would give you ~400 personal recall prompts for maybe an hour of work.

**2. Re-solve detection.**
`stats.json` stores a SHA per solution file. Diffing it across commits tells you which
problems you have *re-solved*, which is the single best predictor of retention. Nothing
else in your setup measures whether knowledge is sticking, only whether it arrived.

**3. A "cold pattern" timer.**
Track the date you last touched each pattern. Combined with the coverage bridge you would
get "you met monotonic stack 41 days ago and have not returned" — which is a different
and more useful alarm than "you have never met it".

**4. Fix greedy first, then arrays.**
Not a build task. Two patterns and four patterns respectively, both cheap given your
base, both high-demand. This is the highest-value fourteen hours available to you.

### Tier 2 — worth doing if you have a spare evening

**5. Host the visualizations.**
You have 109 traced HTML visualisations sitting in a repo GitHub will not render. Turn on
GitHub Pages for `leetcode-progress` and every one becomes a live link — then the coverage
view can link straight to your own step-through instead of to a source file.

**6. Anchor list from your own solves.**
81 of your solved problems are not anchors for any pattern here. Some of them should be —
they are good problems and you already have notes on them. A script that proposes
"problem 1004 looks like a sliding-window anchor, add it?" would improve my dataset using
your judgement.

**7. Language coverage.**
Only 40 of 117 have a C++ solution and 31 have Java. You told me all three matter. The
generated data already records which languages exist per problem, so a "solved in Python
only" filter is about ten lines on top of what is now there.

### Tier 3 — nice, not urgent

**8. Company-specific mock OA.** Pull the pattern mix from the company weights and
generate a timed set matching their actual format (TCS NQT's 82 questions in 190 minutes
is nothing like Google's two-in-90).

**9. Contest-rating estimator.** You have 18 hard problems solved; mapping solved
difficulty onto an approximate LeetCode rating would give a single number to watch.

**10. Spaced-repetition on edge cases, not patterns.** The 290 edge-case rows are the
part most likely to cost a round, and they are currently read-once material.

---

## Part 3 — two things about the leetcode-progress repo

Neither is caused by the sync script, which only ever reads. Both need your hand.

**1. I left a `.git/index.lock` in it.** Running `git status` there created a lock file
that the mount would not let me delete. Git will refuse to commit until it is gone:

```
del D:\DSA-engine\leetcode-progress\.git\index.lock
```

**2. 287 files show as modified, and it is line endings.** Git stores LF; your working
tree has CRLF, so every file reads as fully rewritten (9951 insertions, 9950 deletions —
the whole repo). This predates anything I did. If you want it to stop:

```
cd D:\DSA-engine\leetcode-progress
git config core.autocrlf true
git checkout -- .
```

I did not run that, because you said not to change anything in there.

---

## How to refresh the coverage data

```
npm run sync:progress
```

Reads `../leetcode-progress`, writes `src/data/progress.generated.ts`, touches nothing
else. If the folder is missing it exits quietly and keeps the committed snapshot, so
Vercel builds fine without it. Commit the regenerated file so the deployed site sees it.
