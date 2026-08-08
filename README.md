# PLAYBOOK — the DSA engine

Two instruments for placement prep, sharing one design system and one typed dataset.

**[Playbook](./playbook.html)** — 77 patterns across 20 topics in Python, C++ and Java;
topic primers with diagrams; a real-CPython code visualiser; an empirical complexity
analyser; a stress tester; spaced-repetition drilling; a mistake log; OA intelligence on
25 companies; and an 11-rung ladder that starts at "I can write a for loop".
**Open it on the "start here" tab** — it routes you by situation rather
than making you guess which of eleven tools you need.

**[Your coverage](./playbook.html#progress)** — the playbook reads your
[leetcode-progress](https://github.com/RaghhavMalani/leetcode-progress) repo and tells you
which of the 77 patterns you have **never** solved a problem for, ranked by how much each
of the 25 companies weights it. Its versioned `progress.json` contract publishes changes
automatically; `npm run sync:progress` imports the sibling clone's committed contract for offline use.

**[Replay lab](./playbook.html#lab)** — connects every saved personal trace to its exact
curriculum pattern when available (or an explicitly labelled family analogue). Step through the
accepted code beside the generic trace, predict the next state, mutate plain Python inputs and
re-run locally, compare growth, inject an invariant bug, then stress-test and shrink the failure.

**[Grounded interviewer](./playbook.html#interviewer)** — runs a structured interview from only
the selected pattern, anchor problem, rubric, worked trace and follow-up ladder. It locks
constraints and intended complexity before approach, challenges unsupported greedy choices,
probes negative inputs, generates counterexamples, demands an invariant, adapts the escalation,
and converts weak transcript signals into reviewable mistake-log entries. Browser voice input and
spoken prompts are optional.

**[Memory](./memory.html)** — the arrays deep dive. Drive a dynamic array by hand and
watch amortisation happen, see why cache locality beats Big-O, step through five array
templates frame by frame, and read the complexity *and memory* estimator.

---

## What is in here

| | count |
| --- | --- |
| Patterns | **77** — 67 core + 10 hard tier |
| Topic primers | **20**, each with an SVG diagram, op-cost table and edge cases |
| Follow-up ladder rungs | **88** across 22 patterns |
| Documented edge cases | **395** (113 topic-level + 282 pattern-level) |
| Worked traces | **141** across 52 patterns |
| Personal replays | **112** imported from accepted-solution visualisations |
| Anchor problems | **306** LeetCode links |
| Companies profiled | **25** — 10 product, 8 fintech/quant, 7 India service |
| Zero-to-OA ladder | **11 rungs**, 155–230 honest hours |
| Automated verification | **Vitest content/coverage suite + Python snippet parser** |
| Your solved problems read | **126** — 41 of 77 patterns met |

Every pattern carries the same five things: the **signal** that identifies it, **why**
it works, the **trap** that costs the round, a line worth **saying out loud**, and the
code in all three languages. The hard tier adds a **derivation** (how to reach it at a
whiteboard from the brute force) and a **proof sketch**.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

| command | what it does |
| --- | --- |
| `npm run dev` | dev server with hot reload |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest content, classifier, backup and coverage tests |
| `npm run build` | typecheck, then production build into `dist/` |
| `npm run preview` | serve the built output |
| `npm run sync:progress` | import `../leetcode-progress/progress.json` and rebuild personal replays |
| `npm run sync:progress:contract -- path/to/progress.json` | import an exact live contract snapshot |
| `npm run sync:replays -- path/to/leetcode-progress` | rebuild the personal replay snapshot |

Run them one at a time — pasting a multi-line block into PowerShell executes every line.

---

## Deploy

Push to GitHub and import the repo on Vercel. `vercel.json` sits at the root, so there
is nothing to configure.

```bash
git add -A
git commit -m "the engine"
git push
```

### Installable, offline and cross-device

Production builds are installable as a PWA. Vite generates a precache manifest from the real
build output, so Today, drills, primers, patterns and replay traces keep working without a
network. API/auth requests are deliberately excluded from the cache.

The Mistake log view can export or restore a validated, schema-versioned JSON file containing all
non-regenerable learning state. Optional authenticated sync keeps the browser local-first and
merges categories independently across devices. To enable it, configure a Supabase project and
the two `VITE_SUPABASE_*` build variables described in
[`docs/learning-sync.md`](./docs/learning-sync.md).

### Optional: live OA research

`api/oa-research.ts` aggregates first-hand OA reports. All keys are optional and free.
Set them in Vercel → Settings → Environment Variables.

| source | needs | notes |
| --- | --- | --- |
| **Hacker News** | nothing | always on, free Algolia API |
| **Reddit** | `REDDIT_CLIENT_ID` + `REDDIT_CLIENT_SECRET` | official OAuth API; create a *script* app at reddit.com/prefs/apps |
| **Open web** | one of `TAVILY_API_KEY` / `BRAVE_API_KEY` / `SERPER_API_KEY` | pulls in GeeksforGeeks experiences, dev.to writeups, placement blogs |

**Deliberately not scraped:** LeetCode Discuss (their ToS forbids automated access) and
Glassdoor/Blind (same, plus active bot mitigation). Anything public from those still
arrives as indexed search snippets. Without any keys the curated dataset in
`src/data/companies.ts` still works.

### Optional: offline Python

The visualiser needs Pyodide. It tries `./pyodide/` locally first, then four CDNs. If
your network blocks CDNs, download a Pyodide release, extract it, and drop the `pyodide`
folder into `public/` so it ships at `/pyodide/pyodide.js`. Then it works offline
forever.

---

## Layout

```
src/
  types.ts            Pattern, TopicPrimer, CompanyOA — the typed contracts
  data/               all content. index.ts merges and validates it
  lib/                dom, highlight, pyodide loader, stress harness
  features/           one module per view
  memory/             the memory engine
  styles/             tokens.css is shared; playbook/memory are per-page
api/oa-research.ts    Vercel edge function
tests/                content, classifier, backup and coverage assertions
scripts/              python snippet syntax checker (runs in CI)
legacy/               the original single-file builds, kept for reference
```

**Content integrity is enforced, not assumed.** `src/data/index.ts` merges the
follow-up, edge-case and worked-trace layers onto the patterns by name, and **throws at
load** if a key stops matching — so renaming a pattern fails loudly instead of silently
dropping its content. CI additionally checks SVG well-formedness, that diagrams use only
design tokens, that trace rows match their column counts, and that all 68 Python
snippets parse.

---

## Honest notes

- **Worked traces and edge matrices cover 52 of 77 patterns.** What is left is hashing,
  arrays, binary search, greedy, bits, and a handful of graph and DP entries. The schema
  and renderer handle all 77 — the rest is content still to write. See `ROADMAP.md`.
- **`noImplicitAny` is off** for the ported DOM glue in `src/features` and `src/memory`.
  The data layer, types, lib and newer features are fully strict. Documented in
  `tsconfig.json` with a TODO rather than hidden.
- **The company topic weights are directional**, synthesised from public interview
  reports. Nobody publishes measured frequencies. Read the cited sources before
  reorganising a week around one bar.
- **Coverage is measured on anchors only.** A pattern counts as met when you have
  solved a problem this playbook lists as an anchor for it. 71 of your 126 solved
  problems are not anchors for anything here — real work, but not evidence about these
  77 patterns. The view says so rather than quietly counting them.
- **`progress.generated.ts` is committed on purpose.** The source repository publishes a
  versioned contract and dispatches the sync workflow; the resulting Playbook commit is
  deterministic and triggers deployment. See `docs/progress-bridge.md` for setup and the
  read-only offline fallback.

- **The visualiser is desktop-only.** It is hidden on phones with an explicit message
  rather than shipped broken.

See `ROADMAP.md` for what is worth building next, ranked twice — once by product value,
once by what actually moves a placement outcome.
