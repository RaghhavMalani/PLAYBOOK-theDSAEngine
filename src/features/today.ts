import { COMPANIES } from "../data/companies";
import { PATTERNS } from "../data/index";
import { patternCoverage, type PatternCoverage, type SolvedEntry } from "../data/progress";
import { SOLVED } from "../data/progress.generated";
import { topicName } from "../lib/topics";
import type { CompanyOA, Pattern, Problem, TopicId } from "../types";

const DAY = 86_400_000;

export type MissionKind = "recall" | "anchor" | "resolve";

export interface RecallRecord {
  box: number;
  due: number;
}

export interface MissionMistake {
  date: string;
  topic: TopicId | "";
  pattern: string;
  signal: string;
}

export interface MissionInputs {
  targetCompanyIds: readonly string[];
  mistakes: readonly MissionMistake[];
  boxes: Readonly<Record<string, number | RecallRecord>>;
  now?: number;
}

export interface MissionSignal {
  key: "company" | "coverage" | "staleness" | "mistakes" | "recall" | "resolve";
  label: string;
  value: number;
}

export interface MissionStep {
  id: MissionKind;
  kind: MissionKind;
  minutes: number;
  kicker: string;
  title: string;
  pattern: Pattern;
  problem: Problem | null;
  href: string | null;
  action: string;
  reason: string;
  score: number;
  signals: readonly MissionSignal[];
}

export interface TodayMission {
  date: string;
  totalMinutes: number;
  targetLabel: string;
  steps: readonly MissionStep[];
}

interface PatternStats {
  pattern: Pattern;
  coverage: PatternCoverage;
  company: CompanyOA | null;
  companyWeight: number;
  mistakes: MissionMistake[];
  recall: RecallRecord | null;
  lastAttempt: number | null;
  solved: SolvedEntry[];
  signals: MissionSignal[];
  score: number;
}

const clamp = (n: number, low = 0, high = 1): number => Math.max(low, Math.min(high, n));

function asRecall(value: number | RecallRecord | undefined): RecallRecord | null {
  if (value === undefined) return null;
  return typeof value === "number" ? { box: value, due: 0 } : value;
}

function selectedCompanies(ids: readonly string[]): readonly CompanyOA[] {
  const selected = COMPANIES.filter((company) => ids.includes(company.id));
  return selected.length ? selected : COMPANIES;
}

function strongestCompany(pattern: Pattern, companies: readonly CompanyOA[]): [CompanyOA | null, number] {
  let best: CompanyOA | null = null;
  let weight = 0;
  for (const company of companies) {
    const candidate = company.weights[pattern.t] ?? 0;
    if (candidate > weight) {
      best = company;
      weight = candidate;
    }
  }
  return [best, weight];
}

function daysSince(timestamp: number | null, now: number): number {
  return timestamp === null ? 365 : Math.max(0, Math.floor((now - timestamp) / DAY));
}

function reSolveWeakness(solved: readonly SolvedEntry[]): number {
  if (!solved.length) return 1;
  const repeats = solved.reduce((total, entry) => total + entry.reSolveHistory.length, 0);
  if (repeats === 0) return 1;
  if (repeats === 1) return 0.72;
  if (repeats === 2) return 0.46;
  return 0.2;
}

function failedRecall(record: RecallRecord | null, now: number): number {
  if (!record) return 0.42; // untested is an unknown, but weaker evidence than a miss
  const boxWeakness = clamp((4 - record.box) / 4);
  const due = record.due <= now ? 0.2 : 0;
  return clamp(boxWeakness + due);
}

/**
 * The six user-facing signals are combined multiplicatively. Each is mapped to
 * 0.75..1.25 first so missing history is neutral rather than making the entire
 * recommendation disappear. That preserves the useful "x" interaction: a cold,
 * stale pattern with repeated misses rises much faster than one strong signal alone.
 */
function multiply(signals: readonly MissionSignal[]): number {
  const product = signals.reduce((score, signal) => score * (0.75 + signal.value * 0.5), 1);
  return Math.round(product * 100);
}

function statsFor(inputs: MissionInputs): PatternStats[] {
  const now = inputs.now ?? Date.now();
  const companies = selectedCompanies(inputs.targetCompanyIds);
  const solvedByNum = new Map(SOLVED.map((entry) => [entry.num, entry]));

  return patternCoverage().map((coverage) => {
    const pattern = coverage.pattern;
    const solved = (pattern.lc ?? [])
      .map(([num]) => solvedByNum.get(num))
      .filter((entry): entry is SolvedEntry => Boolean(entry));
    const lastAttempt = solved.length
      ? Math.max(...solved.map((entry) => Date.parse(entry.lastSolvedAt)))
      : null;
    const [company, companyWeight] = strongestCompany(pattern, companies);
    const mistakes = inputs.mistakes.filter((mistake) =>
      mistake.pattern.trim().toLowerCase() === pattern.n.toLowerCase() || mistake.topic === pattern.t,
    );
    const recall = asRecall(inputs.boxes[pattern.n]);
    const age = daysSince(lastAttempt, now);
    const signals: MissionSignal[] = [
      { key: "company", label: `company ${companyWeight}/5`, value: companyWeight / 5 },
      { key: "coverage", label: `${coverage.stage.replace("-", " ")} mastery`, value: 1 - coverage.ratio },
      { key: "staleness", label: lastAttempt === null ? "never attempted" : `${age}d since attempt`, value: clamp(age / 180) },
      { key: "mistakes", label: mistakes.length ? `${mistakes.length} logged miss${mistakes.length === 1 ? "" : "es"}` : "no logged misses", value: clamp(mistakes.length / 3) },
      { key: "recall", label: recall ? `recall box ${recall.box}` : "recall untested", value: failedRecall(recall, now) },
      { key: "resolve", label: solved.length && reSolveWeakness(solved) === 1 ? "never re-solved" : `re-solve ${Math.round(reSolveWeakness(solved) * 100)}% weak`, value: reSolveWeakness(solved) },
    ];

    return {
      pattern,
      coverage,
      company,
      companyWeight,
      mistakes,
      recall,
      lastAttempt,
      solved,
      signals,
      score: multiply(signals),
    };
  });
}

function leetcode(problem: Problem): string {
  return `https://leetcode.com/problems/${problem[1]}/`;
}

function mistakeClause(stat: PatternStats): string | null {
  if (!stat.mistakes.length) return null;
  const latest = [...stat.mistakes].sort((a, b) => b.date.localeCompare(a.date))[0];
  const excerpt = latest.signal.trim().replace(/\s+/g, " ").slice(0, 92);
  return `${stat.mistakes.length} logged miss${stat.mistakes.length === 1 ? "" : "es"} point here${excerpt ? `, including “${excerpt}${latest.signal.length > 92 ? "…" : ""}”` : ""}`;
}

function companyClause(stat: PatternStats): string {
  if (!stat.company) return `${topicName(stat.pattern.t)} has broad company demand`;
  return `${stat.company.name} weights ${topicName(stat.pattern.t)} ${stat.companyWeight}/5`;
}

function weakestSolved(stat: PatternStats, now: number): [SolvedEntry, Problem] | null {
  let best: [SolvedEntry, Problem] | null = null;
  let bestScore = -Infinity;
  for (const problem of stat.pattern.lc ?? []) {
    const entry = stat.solved.find((candidate) => candidate.num === problem[0]);
    if (!entry) continue;
    const score = now - Date.parse(entry.lastSolvedAt) - entry.reSolveHistory.length * 120 * DAY;
    if (score > bestScore) {
      best = [entry, problem];
      bestScore = score;
    }
  }
  return best;
}

function takeBest(pool: readonly PatternStats[], excluded = new Set<string>()): PatternStats {
  const available = pool.filter((stat) => !excluded.has(stat.pattern.n));
  const source = available.length ? available : pool;
  return [...source].sort((a, b) => b.score - a.score || a.pattern.n.localeCompare(b.pattern.n))[0] ?? statsFor({ targetCompanyIds: [], mistakes: [], boxes: {} })[0]!;
}

export function buildTodayMission(inputs: MissionInputs): TodayMission {
  const now = inputs.now ?? Date.now();
  const stats = statsFor({ ...inputs, now });
  const excluded = new Set<string>();

  const recall = takeBest(
    stats.map((stat) => ({
      ...stat,
      score: Math.round(stat.score * (stat.recall && stat.recall.due <= now ? 1.3 : stat.recall ? 1.12 : 1)),
    })),
  );
  excluded.add(recall.pattern.n);

  const anchor = takeBest(
    stats
      .filter((stat) => stat.coverage.openAnchors.length > 0)
      .map((stat) => ({ ...stat, score: Math.round(stat.score * (stat.coverage.stage === "unseen" ? 1.3 : 0.9)) })),
    excluded,
  );
  excluded.add(anchor.pattern.n);

  const resolve = takeBest(
    stats
      .filter((stat) => stat.solved.length > 0)
      .map((stat) => ({ ...stat, score: Math.round(stat.score * (0.8 + reSolveWeakness(stat.solved) * 0.5)) })),
    excluded,
  );

  const anchorProblem = anchor.coverage.openAnchors[0] ?? anchor.pattern.lc?.[0] ?? null;
  const resolvePair = weakestSolved(resolve, now);
  const resolveProblem = resolvePair?.[1] ?? resolve.pattern.lc?.[0] ?? null;
  const recallMiss = mistakeClause(recall);
  const anchorMiss = mistakeClause(anchor);
  const resolveMiss = mistakeClause(resolve);
  const resolveAge = daysSince(resolve.lastAttempt, now);

  const steps: MissionStep[] = [
    {
      id: "recall",
      kind: "recall",
      minutes: 7,
      kicker: "recall drill",
      title: recall.pattern.n,
      pattern: recall.pattern,
      problem: null,
      href: null,
      action: "start focused recall",
      reason: `Recall ${recall.pattern.n} because ${recall.recall ? `it is in box ${recall.recall.box}${recall.recall.due <= now ? " and due now" : ""}` : "it has never been tested"}, ${companyClause(recall)}${recallMiss ? `, and ${recallMiss}` : ""}.`,
      score: recall.score,
      signals: recall.signals,
    },
    {
      id: "anchor",
      kind: "anchor",
      minutes: 25,
      kicker: "mastery anchor",
      title: anchorProblem ? `LC ${anchorProblem[0]} · ${anchorProblem[2]}` : anchor.pattern.n,
      pattern: anchor.pattern,
      problem: anchorProblem,
      href: anchorProblem ? leetcode(anchorProblem) : null,
      action: "open mastery anchor",
      reason: `Do ${anchorProblem ? `LC ${anchorProblem[0]}` : anchor.pattern.n} today because ${anchor.pattern.n} is only ${anchor.coverage.stage.replace("-", " ")}, ${companyClause(anchor)}${anchorMiss ? `, and ${anchorMiss}` : ""}.`,
      score: anchor.score,
      signals: anchor.signals,
    },
    {
      id: "resolve",
      kind: "resolve",
      minutes: 20,
      kicker: "timed re-solve",
      title: resolveProblem ? `LC ${resolveProblem[0]} · ${resolveProblem[2]}` : resolve.pattern.n,
      pattern: resolve.pattern,
      problem: resolveProblem,
      href: resolveProblem ? leetcode(resolveProblem) : null,
      action: "open 20-minute re-solve",
      reason: `Re-solve ${resolveProblem ? `LC ${resolveProblem[0]}` : resolve.pattern.n} because it was last attempted ${resolveAge} day${resolveAge === 1 ? "" : "s"} ago, ${resolve.solved.reduce((sum, entry) => sum + entry.reSolveHistory.length, 0) ? "its re-solve history is still thin" : "it has never been re-solved"}, and ${companyClause(resolve)}${resolveMiss ? `; ${resolveMiss}` : ""}.`,
      score: resolve.score,
      signals: resolve.signals,
    },
  ];

  const targets = selectedCompanies(inputs.targetCompanyIds);
  return {
    date: new Date(now).toISOString().slice(0, 10),
    totalMinutes: steps.reduce((total, step) => total + step.minutes, 0),
    targetLabel: inputs.targetCompanyIds.length
      ? `${targets.length} target compan${targets.length === 1 ? "y" : "ies"}`
      : "all-company baseline",
    steps,
  };
}
