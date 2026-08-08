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
import {
  masteryForPattern,
  readAttemptHistory,
  stageIndex,
  type MasteryEvidence,
  type MasteryStage,
} from "../lib/mastery";
import { PATTERNS } from "./index";
import {
  SOLVED,
  PROGRESS_COUNTS,
  PROGRESS_REPO,
  PROGRESS_SYNC,
  type SolvedEntry,
} from "./progress.generated";

export { PROGRESS_COUNTS, PROGRESS_REPO, PROGRESS_SYNC };
export type { SolvedEntry };

/** Human age for the generated-at timestamp; evaluated in the browser on every render. */
export function progressSyncAge(now = Date.now()): string {
  const elapsed = Math.max(0, now - Date.parse(PROGRESS_SYNC.generatedAt));
  if (elapsed < 60_000) return "just now";
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(PROGRESS_SYNC.generatedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * The progress repo groups into 16 families; this playbook now uses 20 topics.
 *
 * Adding math, intv, sort and design was driven by this map: those four families had
 * no real home and were being filed under borrowed topics ("Math & number theory" sat
 * in bits-and-math, intervals were split across arrays and hashing), which made the
 * adjacent-work signal noisy in both directions. Fifteen of the sixteen families now
 * map 1:1.
 *
 * The one deliberate exception is "Two pointers & sliding window", which genuinely
 * spans arrays and strings. "Brute force done right" maps to arrays because it is a
 * teaching label rather than a technique.
 */
export const FAMILY_TO_TOPICS: Readonly<Record<string, readonly TopicId[]>> = {
  Hashing: ["hash"],
  "Two pointers & sliding window": ["arr", "str"],
  "Math & number theory": ["math"],
  Greedy: ["greedy"],
  Backtracking: ["bt"],
  "Prefix sums & intervals": ["intv"],
  "Linked lists": ["ll"],
  "Graphs, BFS & DFS": ["graph"],
  "Dynamic programming": ["dp"],
  "Bit manipulation": ["bit"],
  "Sorting & divide and conquer": ["sort"],
  "Binary search": ["bs"],
  Trees: ["tree"],
  Design: ["design"],
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
  /** Mastery progress on the six-stage ladder, kept as `ratio` for recommendation consumers. */
  ratio: number;
  /** Repository-anchor coverage, separate from mastery. */
  anchorRatio: number;
  stage: MasteryStage;
  mastery: MasteryEvidence;
  /** Compatibility alias: the pattern has at least been exposed. */
  touched: boolean;
}

export function patternCoverage(): PatternCoverage[] {
  const attemptHistory = readAttemptHistory();
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
    const repoFirstSolvedAt = solvedAnchors
      .map((entry) => entry.firstSolvedAt)
      .sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? null;
    const mastery = masteryForPattern(pattern.n, repoFirstSolvedAt, attemptHistory);
    return {
      pattern,
      solvedAnchors,
      openAnchors,
      adjacent,
      ratio: mastery.stageIndex / 5,
      anchorRatio: anchors.length ? solvedAnchors.length / anchors.length : 0,
      stage: mastery.stage,
      mastery,
      touched: mastery.stage !== "unseen",
    };
  });
}

export interface TopicCoverage {
  topic: TopicId;
  patterns: number;
  touched: number;
  independent: number;
  retained: number;
  interviewReady: number;
  mastery: number;
  solvedHere: number;
  /** solved problems whose family maps here but which are not anchors */
  adjacentOnly: number;
}

export function topicCoverage(): TopicCoverage[] {
  const cov = patternCoverage();
  const out = new Map<TopicId, TopicCoverage>();
  for (const c of cov) {
    const t = c.pattern.t;
    const row = out.get(t) ?? {
      topic: t, patterns: 0, touched: 0, independent: 0, retained: 0,
      interviewReady: 0, mastery: 0, solvedHere: 0, adjacentOnly: 0,
    };
    row.patterns++;
    if (c.touched) row.touched++;
    if (stageIndex(c.stage) >= stageIndex("independent")) row.independent++;
    if (stageIndex(c.stage) >= stageIndex("retained")) row.retained++;
    if (c.stage === "interview-ready") row.interviewReady++;
    row.mastery += c.ratio;
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
  stage: MasteryStage;
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
function scoreGap(pattern: Pattern, weight: number, adjacent: number, stage: MasteryStage): number {
  const tierPenalty = pattern.tier === "hard" ? 2 : 0;
  const evidenceGap = (5 - stageIndex(stage)) * 0.6;
  return weight + evidenceGap - tierPenalty - Math.min(adjacent, 3) * 0.25;
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
    if (c.stage === "interview-ready") continue;
    const weight = company.weights[c.pattern.t] ?? 0;
    if (weight <= 0) continue;
    gaps.push({
      pattern: c.pattern,
      stage: c.stage,
      weight,
      adjacent: c.adjacent.length,
      score: scoreGap(c.pattern, weight, c.adjacent.length, c.stage),
      next: c.openAnchors[0] ?? c.pattern.lc?.[0] ?? null,
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
    if (c.stage === "interview-ready") continue;
    const weight = Math.round((5 * (demand.get(c.pattern.t) ?? 0)) / n * 10) / 10;
    gaps.push({
      pattern: c.pattern,
      stage: c.stage,
      weight,
      adjacent: c.adjacent.length,
      score: scoreGap(c.pattern, weight, c.adjacent.length, c.stage),
      next: c.openAnchors[0] ?? c.pattern.lc?.[0] ?? null,
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
  patternsIndependent: number;
  patternsRetained: number;
  patternsInterviewReady: number;
  patternsUnseen: number;
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
    patternsIndependent: cov.filter((c) => stageIndex(c.stage) >= stageIndex("independent")).length,
    patternsRetained: cov.filter((c) => stageIndex(c.stage) >= stageIndex("retained")).length,
    patternsInterviewReady: cov.filter((c) => c.stage === "interview-ready").length,
    patternsUnseen: cov.filter((c) => c.stage === "unseen").length,
    patternsTotal: PATTERNS.length,
    anchorsSolved,
    anchorsTotal,
    offPlaybook: SOLVED.filter((e) => !anchorNums.has(e.num)).length,
  };
}
