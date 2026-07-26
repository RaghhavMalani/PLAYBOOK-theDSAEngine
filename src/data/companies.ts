import type { CompanyOA } from "../types";
import { COMPANIES_INDIA } from "./companies-india";

/**
 * Curated from public interview reports and company guides, July 2026.
 *
 * Honesty notes, because this matters more than the data looking authoritative:
 *  - `weights` are directional (0-5), synthesised from what topics recur across
 *    reports. They are not measured frequencies and nobody publishes those.
 *  - Formats change per season and per team. Treat this as a prior, not a promise.
 *  - Everything here is from public sources. Nothing is scraped from LeetCode.
 *
 * Use the "refresh" button in the app to pull current reports via a search API
 * (see api/oa-research.ts) when you want something fresher than this snapshot.
 */
const COMPANIES_GLOBAL: readonly CompanyOA[] = [
  {
    id: "google",
    name: "Google",
    tier: "product",
    platform: "Third-party OA, then Google Docs / shared editor",
    format:
      "Online assessment first, then a loop of two DSA rounds plus system design and behavioural. Coding happens in a plain shared doc — no syntax highlighting, no autocomplete, no way to run it.",
    durationMin: 90,
    questions: "1–2 problems in the OA; 1–2 per interview round",
    weights: { graph: 5, dp: 5, str: 4, arr: 4, bs: 3, tree: 3, hash: 3, greedy: 2, heap: 2, bt: 2 },
    archetypes: [
      "Graph traversal on an implicit graph (grid, word ladder, state space)",
      "Shortest path — BFS when unweighted, Dijkstra when weighted",
      "String manipulation with a non-obvious invariant",
      "DP where the recurrence is the whole difficulty",
      "Sorting/ordering with a custom comparator and tie-break rules",
    ],
    edge:
      "You must write complete, compiling code including the entry point, and state edge cases out loud. The doc has no compiler — the round is partly designed to catch people who rely on one.",
    extras: ["System design round", "Googleyness / behavioural"],
    sources: [
      { label: "Exponent — Google SWE New Grad guide", url: "https://www.tryexponent.com/guides/google-software-engineer-new-grad-interview" },
      { label: "Levelop — what changed in 2026", url: "https://levelop.dev/blog/google-coding-interviews-in-2026-what-changed-and-what-didnt" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "meta",
    name: "Meta",
    tier: "product",
    platform: "CodeSignal (proctored, camera + mic on)",
    format:
      "90-minute proctored OA built as one base problem in four escalating stages — you must clear each stage to unlock the next. Interview rounds are 45 minutes with TWO problems, both expected complete, in CoderPad with execution disabled.",
    durationMin: 90,
    questions: "1 staged problem (4 stages) in the OA; 2 problems per 45-min round",
    weights: { arr: 5, str: 5, hash: 5, tree: 4, graph: 4, dp: 3, ll: 3, heap: 2, stk: 2, bs: 2 },
    archetypes: [
      "Array/string transformation that escalates in constraints stage by stage",
      "Hash-map aggregation over a stream of records",
      "Tree traversal with a twist (level order, path aggregation, serialisation)",
      "Graph connectivity or shortest path on a modest graph",
      "Interval merging / scheduling",
    ],
    edge:
      "Speed is explicitly scored. Two problems in 45 minutes means roughly 20 minutes each including narration — you cannot afford to think in silence. Code cleanliness is a separate scored axis.",
    extras: ["AI-assisted coding round for a growing share of candidates", "Behavioural with a published rubric"],
    sources: [
      { label: "ClavePrep — Meta interview process 2026", url: "https://claveprep.com/blog/meta-interview-process-2026-guide" },
      { label: "Shadecoder — Meta OA prep", url: "https://www.shadecoder.com/blogs/meta-interview-guide-2026-oa-coding-assessment-prep" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "microsoft",
    name: "Microsoft",
    tier: "product",
    platform: "CodeSignal-style asynchronous OA",
    format:
      "Asynchronous OA with one to two LeetCode-medium problems plus short written behavioural prompts. Interview rounds favour one well-scoped problem rather than Meta's two.",
    durationMin: 70,
    questions: "1–2 coding problems + short-answer behavioural",
    weights: { arr: 5, str: 5, ll: 4, tree: 4, hash: 4, graph: 3, dp: 3, stk: 3, heap: 2, bs: 2 },
    archetypes: [
      "Linked list manipulation — reversal, merging, cycle handling",
      "String parsing and in-place transformation",
      "Tree traversal and BST property questions",
      "Matrix / grid traversal",
      "Object-oriented design of a small system",
    ],
    edge:
      "Microsoft tests object-oriented design more than the other product companies. Expect a follow-up asking you to structure your solution into classes, not just make it correct.",
    extras: ["Written behavioural prompts inside the OA", "OOD discussion"],
    sources: [
      { label: "OphyAI — Microsoft interview guide", url: "https://ophyai.com/blog/company-guides/microsoft-interview-guide" },
      { label: "Wrok — FAANG loops decoded 2026", url: "https://www.wrok.app/blog/faang-interview-loops-2026" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "apple",
    name: "Apple",
    tier: "product",
    platform: "Code-editor take-home / async assessment (team dependent)",
    format:
      "Two problems, often dynamic programming or sliding window, moderate-to-high difficulty, used as a filter before the loop. Apple is the least standardised of the big five — the process is shaped heavily by the team you're interviewing for.",
    durationMin: null,
    questions: "2 problems",
    weights: { dp: 5, str: 4, arr: 4, tree: 3, graph: 3, hash: 3, bs: 2, ll: 2, bit: 2 },
    archetypes: [
      "Dynamic programming, often the two-sequence or 1D-linear shape",
      "Sliding window over a string or array",
      "Core data-structure implementation with a clean API",
      "Performance reasoning on large or memory-constrained inputs",
      "Language fundamentals (C, C++, Swift, Python) as follow-ups",
    ],
    edge:
      "Apple pays unusual attention to clean API design, edge-case handling, and how you reason about performance on constrained hardware. For systems/embedded teams, cache behaviour and memory layout come up for real — the locality module in the memory engine is directly relevant.",
    extras: ["Occasional SQL or Linux command questions", "Deep dives on your resume projects"],
    sources: [
      { label: "InterviewQuery — Apple SWE guide", url: "https://www.interviewquery.com/guides/apple-software-engineer" },
      { label: "PracHub — Apple complete guide 2026", url: "https://prachub.com/resources/apple-software-engineer-interview-the-complete-guide-2026" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "visa",
    name: "Visa",
    tier: "fintech",
    platform: "CodeSignal or HackerRank (proctored)",
    format:
      "70–90 minutes with FOUR questions ranging easy/medium to medium/hard. Reports consistently say you need roughly three of four solved fully to advance. Frequently includes a SQL section alongside the DSA.",
    durationMin: 90,
    questions: "3–4 problems, plus SQL",
    weights: { arr: 5, str: 5, hash: 5, dp: 4, graph: 3, bs: 3, greedy: 2, tree: 2 },
    archetypes: [
      "Transaction-record processing — dedupe, aggregate, find anomalies with a hash map",
      "Running sums / prefix aggregation over a sequence",
      "String parsing and validation",
      "Dynamic programming, usually a knapsack or 1D-linear shape",
      "SQL: joins, GROUP BY, aggregates, filtering",
    ],
    edge:
      "Throughput, not depth. Four questions in 90 minutes means about 20 minutes each — partial credit is real and a fast brute force on the easy ones beats an elegant unfinished solution. Do not skip the SQL half.",
    extras: ["SQL section", "Occasional Python-specific questions"],
    sources: [
      { label: "Prepfully — Visa SWE guide", url: "https://prepfully.com/interview-guides/visa-software-engineer" },
      { label: "InterviewQuery — Visa SWE guide", url: "https://www.interviewquery.com/guides/visa-software-engineer" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "amex",
    name: "American Express",
    tier: "fintech",
    platform: "Codility / HackerRank / HireVue CodeVue",
    format:
      "Coding challenge covering DSA fundamentals, typically two problems — one easy, one harder. Sometimes delivered as a HireVue digital interview mixing behavioural questions with coding tasks.",
    durationMin: 75,
    questions: "2 problems (one easy, one harder)",
    weights: { arr: 5, str: 4, hash: 4, dp: 3, tree: 3, greedy: 2, bs: 2, graph: 2 },
    archetypes: [
      "Standard competitive-programming style array/string problems",
      "Hash-map counting and grouping",
      "Straightforward DP or greedy",
      "Basic recursion",
    ],
    edge:
      "This is a baseline-competency filter rather than a hard technical bar. The differentiator at Amex is the later rounds — expect aptitude and analytics-flavoured components alongside the coding.",
    extras: ["Aptitude / logical reasoning", "Behavioural via HireVue", "Analytics case elements"],
    sources: [
      { label: "InterviewQuery — Amex SWE guide", url: "https://www.interviewquery.com/guides/american-express-software-engineer" },
      { label: "GraduatesFirst — Amex assessment guide", url: "https://www.graduatesfirst.com/amex-aptitude-tests" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "goldman",
    name: "Goldman Sachs",
    tier: "fintech",
    platform: "HackerRank",
    format:
      "2–4 coding problems in 120–180 minutes. The India Hackathon (GSIH) is a separate 12-hour HackerRank challenge that acts as a major hiring funnel into pre-placement interviews, split into a CS track and a Quant track.",
    durationMin: 150,
    questions: "2–4 problems",
    weights: { graph: 5, dp: 5, arr: 4, greedy: 4, bit: 3, hash: 3, str: 3, bs: 3, heap: 2 },
    archetypes: [
      "Graph problems — connectivity, shortest path, topological ordering",
      "Dynamic programming, frequently the harder shapes",
      "Greedy with an exchange argument you're expected to justify",
      "Recursion and optimisation problems",
      "Quant track: probability, statistics, linear algebra, mathematical modelling",
    ],
    edge:
      "Longer format and harder problems than the typical product-company OA. The CS track leans on graphs, DP and greedy; if you're going for the quant track the maths matters more than the DSA.",
    extras: ["Aptitude / logic section", "Quant track: probability and statistics"],
    sources: [
      { label: "GraduatesFirst — Goldman assessments", url: "https://www.graduatesfirst.com/goldman-sachs-aptitude-tests" },
      { label: "Goldman Sachs India Hackathon", url: "https://www.goldmansachs.com/careers/students/programs-and-internships/india/hackathon" },
    ],
    checked: "2026-07-26",
  },
];

/** Everything, global first then the India-focused set. */
export const COMPANIES: readonly CompanyOA[] = [...COMPANIES_GLOBAL, ...COMPANIES_INDIA];

/** Aggregate topic weight across a selection of companies, for the "what to study" view. */
export function aggregateWeights(ids: readonly string[]) {
  const totals = new Map<string, number>();
  const picked = COMPANIES.filter((c) => ids.length === 0 || ids.includes(c.id));
  for (const c of picked) {
    for (const [topic, w] of Object.entries(c.weights)) {
      totals.set(topic, (totals.get(topic) ?? 0) + (w ?? 0));
    }
  }
  const max = Math.max(1, ...totals.values());
  return [...totals.entries()]
    .map(([topic, total]) => ({ topic, total, pct: total / max }))
    .sort((a, b) => b.total - a.total);
}
