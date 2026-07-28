/**
 * The bridge between what you have actually solved and what this playbook teaches.
 *
 * Two kinds of evidence, deliberately kept apart, because conflating them is how a
 * progress tracker starts lying to you:
 *
 *   STRONG — you solved a problem this playbook lists as an anchor for that specific
 *   pattern. That is direct evidence you have met the pattern.
 *
 *   WEAK — you solved something in the same family (the progress repo's own 16-way
 *   grouping). "Hashing" covers five distinct patterns here, so solving two hash
 *   problems says almost nothing about whether you know prefix-sum-plus-hash-map.
 *
 * A pattern is only ever reported as covered on STRONG evidence. Weak evidence is
 * shown separately and described as what it is: adjacent practice, not proof.
 */

import type { Pattern, TopicId, CompanyOA } from "../types";
import { PATTERNS } from "./index";
import { SOLVED, PROGRESS_COUNTS, PROGRESS_REPO, type SolvedEntry } from "./progress.generated";

export { PROGRESS_COUNTS, PROGRESS_REPO };
export type { SolvedEntry };

/**
 * The progress repo groups into 16 families; this playbook uses 13 topics. The map is
 * many-to-one and lossy in one direction that matters: "Two pointers & sliding window"
 * spans arrays AND strings, and "Math & number theory" lands in bits-and-math because
 * that is where this playbook keeps number theory. Where a family straddles two topics
 * the first entry is the primary and the rest are listed so weak evidence is not lost.
 */
export const FAMILY_TO_TOPICS: Readonly<Record<string, readonly TopicId[]>> = {
  Hashing: ["hash"],
  "Two pointers & sliding window": ["arr", "str"],
  "Math & number theory": ["bit"],
  Greedy: ["greedy"],
  Backtracking: ["bt"],
  "Prefix sums & intervals": ["arr", "hash"],
  "Linked lists": ["ll"],
  "Graphs, BFS & DFS": ["graph"],
  "Dynamic programming": ["dp"],
  "Bit manipulation": ["bit"],
  "Sorting & divide and conquer": ["arr"],
  "Binary search": ["bs"],
  Trees: ["tree"],
  Design: ["hash", "ll"],
  "Stacks & monotonic stacks": ["stk"],
  "Brute force done right": ["arr"],
};

const BY_NUM = new Map<number, SolvedEntry>(SOLVED.map((e) => [e.num, e]));

/** Every family string in the data that we have no mapping for. Should be empty. */
export function unmappedFamilies(): string[] {
  const seen = new Set<string>();
  for (const e of SOLVED) if (e.family && !(e.family in FAMILY_TO_TOPICS)) seen.add(e.family);
  return [...seen].sort();
}

export interface PatternCoverage {
  pattern: Pattern;
  /** anchors for this pattern that you have solved — STRONG evidence */
  solvedAnchors: SolvedEntry[];
  /** anchors you have not solved, as [number, slug, title] */
  openAnchors: readonly (readonly [number, string, string])[];
  /** solved problems in a family that maps to this pattern's topic — WEAK evidence */
  adjacent: SolvedEntry[];
  /** 0 when no anchor is solved */
  ratio: number;
  /** true only on strong evidence */
  touched: boolean;
}

export function patternCoverage(): PatternCoverage[] {
  const byTopic = new Map<TopicId, SolvedEntry[]>();
  for (const e of SOLVED) {
    for (const t of FAMILY_TO_TOPICS[e.family] ?? []) {
      const list = byTopic.get(t) ?? [];
      list.push(e);
      byTopic.set(t, list);
    }
  }

  return PATTERNS.map((pattern) => {
    const anchors = pattern.lc ?? [];
    const solvedAnchors: SolvedEntry[] = [];
    const openAnchors: (readonly [number, string, string])[] = [];
    for (const a of anchors) {
      const hit = BY_NUM.get(a[0]);
      if (hit) solvedAnchors.push(hit);
      else openAnchors.push(a);
    }
    const anchorNums = new Set(anchors.map((a) => a[0]));
    const adjacent = (byTopic.get(pattern.t) ?? []).filter((e) => !anchorNums.has(e.num));
    return {
      pattern,
      solvedAnchors,
      openAnchors,
      adjacent,
      ratio: anchors.length ? solvedAnchors.length / anchors.length : 0,
      touched: solvedAnchors.length > 0,
    };
  });
}

export interface TopicCoverage {
  topic: TopicId;
  patterns: number;
  touched: number;
  solvedHere: number;
  /** solved problems whose family maps here but which are not anchors */
  adjacentOnly: number;
}

export function topicCoverage(): TopicCoverage[] {
  const cov = patternCoverage();
  const out = new Map<TopicId, TopicCoverage>();
  for (const c of cov) {
    const t = c.pattern.t;
    const row = out.get(t) ?? { topic: t, patterns: 0, touched: 0, solvedHere: 0, adjacentOnly: 0 };
    row.patterns++;
    if (c.touched) row.touched++;
    row.solvedHere += c.solvedAnchors.length;
    out.set(t, row);
  }
  const adjacentByTopic = new Map<TopicId, Set<number>>();
  const anchorNums = new Set(PATTERNS.flatMap((p) => (p.lc ?? []).map((a) => a[0])));
  for (const e of SOLVED) {
    if (anchorNums.has(e.num)) continue;
    for (const t of FAMILY_TO_TOPICS[e.family] ?? []) {
      const s = adjacentByTopic.get(t) ?? new Set<number>();
      s.add(e.num);
      adjacentByTopic.set(t, s);
    }
  }
  for (const [t, s] of adjacentByTopic) {
    const row = out.get(t);
    if (row) row.adjacentOnly = s.size;
  }
  return [...out.values()];
}

export interface Gap {
  pattern: Pattern;
  /** demand for this pattern's topic, normalised to 0–5 */
  weight: number;
  /** how much adjacent practice exists — softens the gap slightly */
  adjacent: number;
  /** demand, penalised for hard tier, credited for adjacent work. Higher = fix sooner. */
  score: number;
  /** the cheapest anchor to solve first */
  next: readonly [number, string, string] | null;
}

/**
 * Topic demand alone cannot rank patterns *within* a topic, and ranking by it produces
 * a list where Segment Tree and Kadane tie because both are "arrays". Two corrections:
 *
 *   TIER. A hard-tier pattern is worth less than a core one at equal demand, because
 *   core patterns appear in far more assessments and cost far less to learn. The −2 is
 *   large enough that no hard-tier pattern outranks a core pattern in a topic of the
 *   same demand, which is the behaviour you want a month out from placements.
 *
 *   ADJACENT WORK. Capped at 3 and worth a quarter each. Having solved twenty array
 *   problems is a reason to expect Kadane to be quick, not a reason to skip it.
 */
function scoreGap(pattern: Pattern, weight: number, adjacent: number): number {
  const tierPenalty = pattern.tier === "hard" ? 2 : 0;
  return weight - tierPenalty - Math.min(adjacent, 3) * 0.25;
}

/** Stable ordering: score, then core before hard, then alphabetical. */
function byScore(a: Gap, b: Gap): number {
  if (b.score !== a.score) return b.score - a.score;
  const at = a.pattern.tier === "hard" ? 1 : 0;
  const bt = b.pattern.tier === "hard" ? 1 : 0;
  if (at !== bt) return at - bt;
  return a.pattern.n.localeCompare(b.pattern.n);
}

/**
 * Cold patterns ranked by how much a given company actually weights them.
 *
 * The score is `weight − min(adjacent, 3) × 0.25`. The credit is small and capped on
 * purpose: having solved four array problems is not a reason to skip Kadane, it is
 * only a reason to expect Kadane to take twenty minutes rather than an hour.
 */
export function gapsFor(company: CompanyOA, limit = 12): Gap[] {
  const cov = patternCoverage();
  const gaps: Gap[] = [];
  for (const c of cov) {
    if (c.touched) continue;
    const weight = company.weights[c.pattern.t] ?? 0;
    if (weight <= 0) continue;
    gaps.push({
      pattern: c.pattern,
      weight,
      adjacent: c.adjacent.length,
      score: scoreGap(c.pattern, weight, c.adjacent.length),
      next: c.openAnchors[0] ?? null,
    });
  }
  gaps.sort(byScore);
  return gaps.slice(0, limit);
}

/**
 * The same ranking across every company at once — what to fix if you do not know yet
 * where you will sit.
 *
 * Demand is the share of companies weighting the topic at 4 or 5, rescaled to 0–5 so
 * it is directly comparable with a single company's weight. Using the raw count made
 * every array pattern tie at 23 and the list stopped saying anything.
 */
export function gapsOverall(companies: readonly CompanyOA[], limit = 15): Gap[] {
  const demand = new Map<TopicId, number>();
  for (const co of companies) {
    for (const [t, w] of Object.entries(co.weights) as [TopicId, number][]) {
      if (w >= 4) demand.set(t, (demand.get(t) ?? 0) + 1);
    }
  }
  const n = companies.length || 1;
  const cov = patternCoverage();
  const gaps: Gap[] = [];
  for (const c of cov) {
    if (c.touched) continue;
    const weight = Math.round((5 * (demand.get(c.pattern.t) ?? 0)) / n * 10) / 10;
    gaps.push({
      pattern: c.pattern,
      weight,
      adjacent: c.adjacent.length,
      score: scoreGap(c.pattern, weight, c.adjacent.length),
      next: c.openAnchors[0] ?? null,
    });
  }
  gaps.sort(byScore);
  return gaps.slice(0, limit);
}

/** Links back into the progress repo. Both render on GitHub without a build step. */
export function notesUrl(e: SolvedEntry): string {
  return `${PROGRESS_REPO}/blob/main/${e.dir}/NOTES.md`;
}
export function solutionUrl(e: SolvedEntry): string {
  return `${PROGRESS_REPO}/tree/main/${e.dir}`;
}

export interface Headline {
  solved: number;
  easy: number;
  medium: number;
  hard: number;
  patternsTouched: number;
  patternsTotal: number;
  anchorsSolved: number;
  anchorsTotal: number;
  /** solved problems that are not an anchor for anything here */
  offPlaybook: number;
}

export function headline(): Headline {
  const cov = patternCoverage();
  const anchorsTotal = PATTERNS.reduce((a, p) => a + (p.lc?.length ?? 0), 0);
  const anchorsSolved = cov.reduce((a, c) => a + c.solvedAnchors.length, 0);
  const anchorNums = new Set(PATTERNS.flatMap((p) => (p.lc ?? []).map((a) => a[0])));
  return {
    solved: PROGRESS_COUNTS.total,
    easy: PROGRESS_COUNTS.easy,
    medium: PROGRESS_COUNTS.medium,
    hard: PROGRESS_COUNTS.hard,
    patternsTouched: cov.filter((c) => c.touched).length,
    patternsTotal: PATTERNS.length,
    anchorsSolved,
    anchorsTotal,
    offPlaybook: SOLVED.filter((e) => !anchorNums.has(e.num)).length,
  };
}
