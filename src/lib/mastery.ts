import { store } from "./dom";

/**
 * Mastery is evidence, not a checkbox. Repository solves establish exposure; only
 * append-only, self-described attempts can establish independence and retention.
 */
export const MASTERY_STAGES = [
  "unseen",
  "exposed",
  "assisted",
  "independent",
  "retained",
  "interview-ready",
] as const;

export type MasteryStage = (typeof MASTERY_STAGES)[number];
export type AttemptKind = "first-solve" | "re-solve" | "retention";
export type AttemptOutcome = "pass" | "partial" | "fail";
export type Assistance = "none" | "notes" | "hint" | "solution";
export type CodeOrigin = "changed" | "memorized" | "unknown";
export type MistakeCategory =
  | "none"
  | "recognition"
  | "approach"
  | "implementation"
  | "complexity"
  | "edge-case"
  | "syntax";
export type RetentionDay = 3 | 7 | 14 | 30;

export interface MasteryAttempt {
  /** Stable id makes Arena imports idempotent. Existing entries are never overwritten. */
  id: string;
  pattern: string;
  problemNumber: number | null;
  attemptedAt: string;
  source: "manual" | "arena";
  kind: AttemptKind;
  outcome: AttemptOutcome;
  assistance: Assistance;
  withoutNotes: boolean;
  recognitionSeconds: number | null;
  workingCodeSeconds: number | null;
  codeHash: string | null;
  /** Explicit self-report: identical code can be canonical without being memorised. */
  codeOrigin: CodeOrigin;
  firstPass: boolean | null;
  mistakeCategory: MistakeCategory;
  confidenceBefore: number | null;
  confidenceAfter: number | null;
  retentionDay: RetentionDay | null;
}

export type RetentionState = "locked" | "upcoming" | "due" | "passed" | "failed";

export interface RetentionCheckpoint {
  day: RetentionDay;
  state: RetentionState;
  dueAt: string | null;
  attempt: MasteryAttempt | null;
}

export interface MasteryEvidence {
  stage: MasteryStage;
  stageIndex: number;
  firstSolveAt: string | null;
  attempts: readonly MasteryAttempt[];
  successfulIndependentResolves: number;
  latestRecognitionSeconds: number | null;
  latestWorkingCodeSeconds: number | null;
  firstPassRate: number | null;
  confidenceDelta: number | null;
  topMistake: MistakeCategory | null;
  codeSignal: "untracked" | "baseline" | "changed" | "unchanged" | "memorized";
  retention: readonly RetentionCheckpoint[];
  nextAction: string;
}

export const RETENTION_DAYS: readonly RetentionDay[] = [3, 7, 14, 30];
const KEY = "masteryAttempts";
const DAY = 86_400_000;

export function stageIndex(stage: MasteryStage): number {
  return MASTERY_STAGES.indexOf(stage);
}

function validAttempt(value: unknown): value is MasteryAttempt {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<MasteryAttempt>;
  const inSet = <T extends string>(candidate: unknown, values: readonly T[]): candidate is T =>
    typeof candidate === "string" && values.includes(candidate as T);
  const nullableNumber = (candidate: unknown): boolean =>
    candidate === null || (typeof candidate === "number" && Number.isFinite(candidate));
  return typeof row.id === "string" && typeof row.pattern === "string" &&
    typeof row.attemptedAt === "string" && !Number.isNaN(Date.parse(row.attemptedAt)) &&
    inSet(row.source, ["manual", "arena"]) &&
    inSet(row.kind, ["first-solve", "re-solve", "retention"]) &&
    inSet(row.outcome, ["pass", "partial", "fail"]) &&
    inSet(row.assistance, ["none", "notes", "hint", "solution"]) &&
    typeof row.withoutNotes === "boolean" &&
    nullableNumber(row.problemNumber) && nullableNumber(row.recognitionSeconds) &&
    nullableNumber(row.workingCodeSeconds) && nullableNumber(row.confidenceBefore) &&
    nullableNumber(row.confidenceAfter) &&
    (row.codeHash === null || typeof row.codeHash === "string") &&
    (row.firstPass === null || typeof row.firstPass === "boolean") &&
    (row.retentionDay === null || (typeof row.retentionDay === "number" && [3, 7, 14, 30].includes(row.retentionDay))) &&
    inSet(row.codeOrigin, ["changed", "memorized", "unknown"]) &&
    inSet(row.mistakeCategory, ["none", "recognition", "approach", "implementation", "complexity", "edge-case", "syntax"]);
}

export function readAttemptHistory(): MasteryAttempt[] {
  const value = store<unknown>(KEY);
  return Array.isArray(value) ? value.filter(validAttempt) : [];
}

/** Append only. Duplicate ids are ignored; no caller can update an earlier event. */
export function appendAttemptHistory(entries: readonly MasteryAttempt[]): number {
  if (!entries.length) return 0;
  const current = readAttemptHistory();
  const ids = new Set(current.map((entry) => entry.id));
  const fresh = entries.filter((entry) => !ids.has(entry.id));
  if (fresh.length) store(KEY, [...current, ...fresh]);
  return fresh.length;
}

/** Small deterministic fingerprint for in-browser Arena comparisons; code never leaves the browser. */
export function codeFingerprint(code: string): string | null {
  const clean = code.trim();
  if (!clean) return null;
  let hash = 2166136261;
  for (let i = 0; i < clean.length; i++) {
    hash ^= clean.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function happened(attempt: MasteryAttempt): number {
  const parsed = Date.parse(attempt.attemptedAt);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function independent(attempt: MasteryAttempt): boolean {
  return attempt.outcome === "pass" &&
    attempt.kind !== "first-solve" &&
    attempt.assistance === "none" &&
    attempt.withoutNotes &&
    attempt.codeOrigin !== "memorized";
}

function latestNumber(
  attempts: readonly MasteryAttempt[],
  key: "recognitionSeconds" | "workingCodeSeconds",
): number | null {
  for (let i = attempts.length - 1; i >= 0; i--) {
    const value = attempts[i]![key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

function retentionFor(
  attempts: readonly MasteryAttempt[],
  baseline: MasteryAttempt | null,
  now: number,
): RetentionCheckpoint[] {
  return RETENTION_DAYS.map((day) => {
    const dueMs = baseline ? happened(baseline) + day * DAY : null;
    const matching = attempts.filter((attempt) =>
      attempt.kind === "retention" && attempt.retentionDay === day &&
      dueMs !== null && happened(attempt) >= dueMs,
    );
    const attempt = matching.length ? [...matching].sort((a, b) => happened(b) - happened(a))[0]! : null;
    let state: RetentionState;
    if (attempt) state = independent(attempt) ? "passed" : "failed";
    else if (dueMs === null) state = "locked";
    else state = now >= dueMs ? "due" : "upcoming";
    return { day, state, dueAt: dueMs === null ? null : new Date(dueMs).toISOString(), attempt };
  });
}

function codeSignal(attempts: readonly MasteryAttempt[]): MasteryEvidence["codeSignal"] {
  const withHash = attempts.filter((attempt) => attempt.codeHash);
  const latest = withHash[withHash.length - 1];
  if (!latest) return "untracked";
  if (latest.codeOrigin === "memorized") return "memorized";
  const previous = withHash[withHash.length - 2];
  if (!previous) return "baseline";
  return previous.codeHash === latest.codeHash ? "unchanged" : "changed";
}

function nextAction(stage: MasteryStage, retention: readonly RetentionCheckpoint[]): string {
  if (stage === "unseen") return "Solve one anchor and record what help you needed.";
  if (stage === "exposed") return "Re-solve without notes; record recognition and code time.";
  if (stage === "assisted") return "Repeat with no notes, hints, or remembered code.";
  if (stage === "independent") {
    const next = retention.find((checkpoint) => checkpoint.state !== "passed");
    return next ? `Pass the ${next.day}-day retention check.` : "Log a clean 30-day interview run.";
  }
  if (stage === "retained") return "At day 30, pass first try: recognise ≤2m and code ≤30m.";
  return "Maintain with mixed, timed interview rounds.";
}

export function masteryForPattern(
  pattern: string,
  repoFirstSolvedAt: string | null,
  history: readonly MasteryAttempt[] = readAttemptHistory(),
  now = Date.now(),
): MasteryEvidence {
  const attempts = history
    .filter((attempt) => attempt.pattern === pattern)
    .sort((a, b) => happened(a) - happened(b));
  const independentAttempts = attempts.filter(independent);
  const independentResolves = independentAttempts.filter((attempt) => attempt.kind === "re-solve");
  const baseline = independentResolves[0] ?? null;
  const retention = retentionFor(attempts, baseline, now);
  const passed = new Set(retention.filter((checkpoint) => checkpoint.state === "passed").map((checkpoint) => checkpoint.day));
  const day30 = retention.find((checkpoint) => checkpoint.day === 30)?.attempt ?? null;

  let stage: MasteryStage = repoFirstSolvedAt || attempts.length ? "exposed" : "unseen";
  if (attempts.some((attempt) => attempt.outcome === "pass" && attempt.assistance !== "none")) stage = "assisted";
  if (independentResolves.length) stage = "independent";
  if ([...passed].some((day) => day >= 7)) stage = "retained";
  if (day30 && independent(day30) && day30.firstPass === true &&
      day30.recognitionSeconds !== null && day30.recognitionSeconds <= 120 &&
      day30.workingCodeSeconds !== null && day30.workingCodeSeconds <= 1_800 &&
      day30.confidenceAfter !== null && day30.confidenceAfter >= 4) {
    stage = "interview-ready";
  }

  const firstPassRows = attempts.filter((attempt) => attempt.firstPass !== null);
  const confidenceRows = attempts.filter((attempt) => attempt.confidenceBefore !== null && attempt.confidenceAfter !== null);
  const mistakes = new Map<MistakeCategory, number>();
  for (const attempt of attempts) {
    if (attempt.mistakeCategory === "none") continue;
    mistakes.set(attempt.mistakeCategory, (mistakes.get(attempt.mistakeCategory) ?? 0) + 1);
  }
  const firstDates = [repoFirstSolvedAt, ...attempts.filter((attempt) => attempt.kind === "first-solve").map((attempt) => attempt.attemptedAt)]
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => Date.parse(a) - Date.parse(b));

  return {
    stage,
    stageIndex: stageIndex(stage),
    firstSolveAt: firstDates[0] ?? null,
    attempts,
    successfulIndependentResolves: independentResolves.length,
    latestRecognitionSeconds: latestNumber(attempts, "recognitionSeconds"),
    latestWorkingCodeSeconds: latestNumber(attempts, "workingCodeSeconds"),
    firstPassRate: firstPassRows.length
      ? firstPassRows.filter((attempt) => attempt.firstPass).length / firstPassRows.length
      : null,
    confidenceDelta: confidenceRows.length
      ? confidenceRows.reduce((sum, attempt) => sum + attempt.confidenceAfter! - attempt.confidenceBefore!, 0) / confidenceRows.length
      : null,
    topMistake: [...mistakes].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    codeSignal: codeSignal(attempts),
    retention,
    nextAction: nextAction(stage, retention),
  };
}
