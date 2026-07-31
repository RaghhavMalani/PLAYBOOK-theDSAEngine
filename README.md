# PLAYBOOK — the DSA engine

Two instruments for placement prep, sharing one design system and one typed dataset.

**[Playbook](./playbook.html)** — 77 patterns across 20 topics in Python, C++ and Java;
topic primers with diagrams; a real-CPython code visualiser; an empirical complexity
analyser; a stress tester; spaced-repetition drilling; a mistake log; OA intelligence on
25 companies; and an 11-rung ladder that starts at "I can write a for loop".
**Open it on the "start here" tab** — it routes you by situation rather
than making you guess which of ten tools you need.

**[Your coverage](./playbook.html#progress)** — the playbook reads your
[leetcode-progress](https://github.com/RaghhavMalani/leetcode-progress) repo and tells you
which of the 63 patterns you have **never** solved a problem for, ranked by how much each
of the 25 companies weights it. Run `npm run sync:progress` after you solve things.

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
| Anchor problems | **306** LeetCode links |
| Companies profiled | **25** — 10 product, 8 fintech/quant, 7 India service |
| Zero-to-OA ladder | **11 rungs**, 155–230 honest hours |
| Content assertions in CI | **6634** |
| Your solved problems read | **117** — 27 of 63 patterns met |

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
| `npm test` | 6634 content assertions via vitest |
| `npm run build` | typecheck, then production build into `dist/` |
| `npm run preview` | serve the built output |
| `npm run sync:progress` | re-read `../leetcode-progress` into `src/data/progress.generated.ts` |

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
tests/                6634 content assertions
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
  and renderer handle all 63 — the rest is content still to write. See `ROADMAP.md`.
- **`noImplicitAny` is off** for the ported DOM glue in `src/features` and `src/memory`.
  The data layer, types, lib and newer features are fully strict. Documented in
  `tsconfig.json` with a TODO rather than hidden.
- **The company topic weights are directional**, synthesised from public interview
  reports. Nobody publishes measured frequencies. Read the cited sources before
  reorganising a week around one bar.
- **Coverage is measured on anchors only.** A pattern counts as met when you have
  solved a problem this playbook lists as an anchor for it. 81 of your 117 solved
  problems are not anchors for anything here — real work, but not evidence about these
  63 patterns. The view says so rather than quietly counting them.
- **`progress.generated.ts` is committed on purpose.** Vercel only checks out this repo,
  so the snapshot has to travel with it. Re-run the sync script and commit after solving.

- **The visualiser is desktop-only.** It is hidden on phones with an explicit message
  rather than shipped broken.

See `ROADMAP.md` for what is worth building next, ranked twice — once by product value,
once by what actually moves a placement outcome.
