# Roadmap

Suggestions for making this better, ranked. Written July 2026, while placements are
under a month away — which is why there are two rankings and they disagree.

---

## Where it stands today

| | count |
| --- | --- |
| Patterns | **63** (53 core + 10 hard tier) |
| Topic primers | **13**, one per topic, each with an SVG diagram |
| Follow-up ladder rungs | **88** across 22 patterns |
| Edge cases documented | **112** (78 topic-level + 34 pattern-level) |
| Worked traces | **18** across 6 patterns |
| Anchor problems linked | **212** |
| Companies profiled | **7** |
| Languages per pattern | **3** (Python, C++, Java) |

Working features: pattern browser with tier/topic filter, real-CPython visualiser
(Pyodide + `sys.settrace`), empirical complexity analyser (wall-clock, log–log
regression), spaced-repetition drill, mock OA timer, company OA intelligence with a
live research endpoint, fast-I/O reference, SQL section, four-week plan, printable
revision sheet.

**Known gaps, stated plainly:** worked traces cover 6 of 63 patterns; edge matrices
cover 22 of 63; `noImplicitAny` is off for the ported DOM glue; there are no automated
tests in the repo; the whole UI is desktop-first.

---

## Tier 1 — ✅ **all three shipped** (July 2026)

### 1. Mistake log ⭐ ✅ **built**

*Shipped as `src/features/mistakes.ts`, nav tab "mistake log". Feeds drill weighting.*

When you fail a problem, record one line: **the signal you missed**. Not the problem,
not the solution — the recognition failure.

> *"Saw 'contiguous', reached for two pointers, it was actually prefix sums."*
> *"Knew it was DP, could not name the state."*
> *"Had the algorithm in 4 minutes, spent 20 debugging an off-by-one in the window."*

After three weeks that is a **personalised trap list**, and it beats everything else in
this repo because it is about your failure modes rather than the average candidate's.

**Sketch**
```
src/features/mistakes.ts
  - textarea + topic select + optional pattern link + date
  - localStorage: pb_mistakes = [{ id, date, topic, pattern?, signal, note }]
  - list view grouped by topic, newest first
  - "review" mode: shows only entries older than 3 days
  - feed into drill.ts: weight weightedPick() toward logged topics
```
The last line is what makes it more than a notes app — the drill starts targeting
your actual misses instead of a generic Leitner schedule.

---

### 2. Stress tester ✅ **built**

*Shipped as `src/lib/stress.ts` + a third visualiser sub-tab. Delta-debugging shrink verified against three known-buggy implementations.*

Write a brute force and your optimised version. The tool generates thousands of random
inputs, finds the **smallest** case where they disagree, and drops it straight into the
tracer.

This converts *"fails on hidden test 7"* from unfixable into a two-minute fix. Every
competitive programmer uses it; almost no interview-prep resource teaches it.

**Sketch**
```
new sub-tab in the visualiser, alongside trace / complexity
  panes: brute(a) | fast(a) | gen(seed) -> input
  loop up to N times:
    inp = gen(seed)
    if brute(inp) != fast(inp): shrink(inp); break
  shrink: repeatedly try smaller/simpler inputs that still disagree
  on failure -> prefill the tracer with the minimal counterexample
```
Reuses `getPyodide()` and the existing harness plumbing in `src/lib/pyodide.ts`.

---

### 3. Whiteboard mode ✅ **built**

*Toggle in the trace toolbar. Tracks first-try success rate across attempts.*

Google writes in a shared Doc. Meta uses CoderPad with execution disabled. Neither
gives you a compiler.

A trace panel with **no syntax highlighting, no autocomplete, no run button** — write
it blind, then reveal and execute. It rehearses the exact failure those rounds are
built to catch: code that does not compile first try.

**Sketch**
```
toggle in the visualiser toolbar
  - strip highlighting from the editor (plain textarea, mono, no hl())
  - hide the run button behind a "reveal" step
  - optional countdown (45 min, Meta-style)
  - on reveal: run, and report whether it worked FIRST TRY
  - track first-try rate over time — that number is the whole point
```

---

**Next up:** worked traces for the remaining 57 patterns, and edge matrices for the remaining 41.

---

## Tier 2 — finish what is half-built

### 4. Worked traces for the remaining 57 patterns

**Effort:** large, but incremental and parallelisable

Traces are the part that actually teaches — the state table is where *"I understand
it"* becomes *"I can produce it"*. Six patterns have them; the schema and renderer are
already in place, so this is pure content.

Priority order: graphs → DP → trees → the hard tier. Those are where a trace helps
most, because the state is hardest to hold in your head.

### 5. Edge matrices for the remaining 41 patterns

**Effort:** medium · Same story: schema and renderer exist, content does not.

### 6. Date-based spaced repetition ✅ **built**

Boxes now carry a `due` timestamp: failed → due immediately, then +1, +3, +7, +14 days.
The picker prefers due items and falls back to everything when nothing is scheduled, so
the drill never runs dry. Old numeric box values migrate automatically. Due count shows
in the question header and the schedule is documented in the progress panel.

### 7. Mobile pass ✅ **built**

Breakpoints at 760px and 420px. Topic list becomes a horizontal strip, tables scroll
instead of squashing, tap targets grow, nav scrolls horizontally. The visualiser is
hidden on phones with an explicit message rather than shipped broken.

---

## Tier 3 — make it a real product

### 8. Tests and CI ✅ **built**

`tests/content.test.ts` — **2862 assertions** over the content: shape, uniqueness, slug
format, complexity strings, trace row/column agreement, edge-row completeness, SVG
well-formedness and token-only colours, company citations, merge-guard throws.
`scripts/check-snippets.py` parses all **68** Python snippets. `.github/workflows/ci.yml`
runs typecheck → tests → snippets → build on every push.

*Original plan, for reference:*

```
vitest
  - data integrity: every pattern has 3 languages, ≥3 problems, valid topic id
  - slug format, no duplicate pattern names
  - mergeFollowups / mergeWalks throw on unknown keys
  - every SVG parses and uses only var(--…) colours
  - python snippets parse (via a small node-side check or a py script in CI)
.github/workflows/ci.yml
  - npm ci → typecheck → test → build, on every push
```
This is what stops content drift once the repo is bigger than one person's memory.

### 9. Remove `noImplicitAny: false`

**Effort:** boring, ~4 hours, mechanical

~540 annotations across the ported DOM glue. Removes the one honest asterisk on the
"it is TypeScript now" claim. Do it a file at a time; `src/features/visualiser.ts` and
`src/memory/engine.ts` are the bulk.

### 10. Search across everything

**Effort:** ~2 hours

Search is patterns-only. It should cover primers, edge cases, worked traces and
follow-up rungs too — so *"negative numbers break sliding window"* finds you the right
place from any of three angles.

### 11. Deep links

**Effort:** ~1 hour

`/patterns#monotonic-stack`, `/foundations#graph`. Cheap, and it makes the thing
shareable — which matters if you are hosting it and your batch starts using it.

---

## Tier 4 — territory that is genuinely missing

### 12. System design

Google and Meta both have a round. There is nothing here at all. Even a small module —
the standard building blocks, the estimation numbers, three worked designs — would be
more than most candidates walk in with.

### 13. Behavioural

Every loop scores it and it is the **cheapest round to prepare**. Meta publishes a
rubric. A STAR-format story bank with 6–8 stories mapped to the common prompts would
take an evening and is close to free marks.

### 14. Proof techniques as their own primer

The `proof` field exists on individual patterns, but nothing teaches the three moves
themselves: **exchange arguments**, **induction on the invariant**, **amortised
counting**. Hard rounds ask you to justify, not just implement, and those three cover
almost every justification you will need.

---

## The honest caveat on all of this

The ranking above is by **how much each improves the product**.

Ranked by **how much each improves your placement outcome in the next four weeks**, it
is:

1. Mistake log
2. Whiteboard mode
3. *nothing else on this list*

And none of the three beats spending that time solving problems on a timer. The build
is already past the point of diminishing returns for a four-week horizon — every hour
here is an hour not spent on the thing that actually transfers.

Come back to Tiers 2–4 after you have offers.
