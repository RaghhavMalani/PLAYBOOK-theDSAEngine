# PLAYBOOK — the DSA engine

Two instruments for placement prep, sharing one design system and one typed dataset.

**[Playbook](./playbook.html)** — 63 patterns across 13 topics in Python, C++ and Java;
topic primers with diagrams; a real-CPython code visualiser; an empirical complexity
analyser; a stress tester; spaced-repetition drilling; a mistake log; company OA
intelligence. **Open it on the "start here" tab** — it routes you by situation rather
than making you guess which of ten tools you need.

**[Memory](./memory.html)** — the arrays deep dive. Drive a dynamic array by hand and
watch amortisation happen, see why cache locality beats Big-O, step through five array
templates frame by frame, and read the complexity *and memory* estimator.

---

## What is in here

| | count |
| --- | --- |
| Patterns | **63** — 53 core + 10 hard tier |
| Topic primers | **13**, each with an SVG diagram, op-cost table and edge cases |
| Follow-up ladder rungs | **88** across 22 patterns |
| Documented edge cases | **220** |
| Worked traces | **72** across 24 patterns |
| Anchor problems | **212** LeetCode links |
| Companies profiled | **7** |
| Content assertions in CI | **3504** |

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
| `npm test` | 3504 content assertions via vitest |
| `npm run build` | typecheck, then production build into `dist/` |
| `npm run preview` | serve the built output |

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
tests/                3504 content assertions
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

- **Worked traces cover 24 of 63 patterns**; edge matrices cover 34 of 63. The schema and
  renderer handle all of them — the rest is content still to write. See `ROADMAP.md`.
- **`noImplicitAny` is off** for the ported DOM glue in `src/features` and `src/memory`.
  The data layer, types, lib and newer features are fully strict. Documented in
  `tsconfig.json` with a TODO rather than hidden.
- **The company topic weights are directional**, synthesised from public interview
  reports. Nobody publishes measured frequencies. Read the cited sources before
  reorganising a week around one bar.
- **The visualiser is desktop-only.** It is hidden on phones with an explicit message
  rather than shipped broken.

See `ROADMAP.md` for what is worth building next, ranked twice — once by product value,
once by what actually moves a placement outcome.
