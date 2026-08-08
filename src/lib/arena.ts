import type { CompanyOA, Lang, Pattern, Problem, TopicId } from "../types";

export type ArenaMode = "executable" | "whiteboard" | "staged-oa";
export type ArenaCorrectness = "pass" | "partial" | "fail";
export type ArenaRunResult = "pass" | "partial" | "fail" | "not-run";
export type ArenaCompileResult = "clean" | "minor-fix" | "fail" | "not-checked";

export interface ArenaConfig {
  companyId: string;
  role: string;
  interviewDate: string;
  language: Lang;
  durationMin: number;
  mode: ArenaMode;
}

export interface ArenaRecallRecord {
  box: number;
  due: number;
}

export interface ArenaMistakeInput {
  date: string;
  topic: TopicId | "";
  pattern: string;
  signal: string;
}

export interface ArenaCoverageInput {
  ratio: number;
  openAnchors: readonly Problem[];
}

export interface ArenaGenerationInput {
  config: ArenaConfig;
  company: CompanyOA;
  patterns: readonly Pattern[];
  coverage: Readonly<Record<string, ArenaCoverageInput>>;
  confidences: Readonly<Record<string, "ok" | "weak">>;
  boxes: Readonly<Record<string, number | ArenaRecallRecord>>;
  mistakes: readonly ArenaMistakeInput[];
  now?: number;
  forcedPatternNames?: readonly string[];
}

export interface ArenaChallenge {
  id: string;
  stage: number;
  budgetMin: number;
  patternName: string;
  topic: TopicId;
  problem: Problem;
  expectedTime: string;
  expectedSpace: string;
  signal: string;
  trap: string;
  proofGuide: string;
  edges: readonly { input: string; effect: string; fix: string }[];
  selectionReason: string;
}

export type ArenaEventKind =
  | "session-started"
  | "challenge-started"
  | "pattern-locked"
  | "complexity-locked"
  | "hint-used"
  | "challenge-submitted"
  | "session-completed";

export interface ArenaEvent {
  kind: ArenaEventKind;
  challengeId?: string;
  atSec: number;
  detail?: string;
}

export interface ArenaExplanationRubric {
  invariant: boolean;
  complexity: boolean;
  correctness: boolean;
  tradeoff: boolean;
}

export interface ArenaAttempt {
  challengeId: string;
  patternGuess: string;
  patternIdentifiedSec: number;
  complexityChoice: string;
  complexityLockedBeforeCode: boolean;
  code: string;
  correctness: ArenaCorrectness;
  firstRun: ArenaRunResult;
  edgeCases: readonly string[];
  hints: number;
  compileResult: ArenaCompileResult;
  explanation: string;
  explanationRubric: ArenaExplanationRubric;
  missedSignal: string;
  submittedAtSec: number;
}

export interface ArenaDraft {
  patternGuess: string;
  patternIdentifiedSec: number | null;
  complexityChoice: string;
  complexityLocked: boolean;
  complexityLockedBeforeCode: boolean;
  code: string;
  hints: number;
}

export interface ArenaMetric {
  key: "pattern" | "complexity" | "first-run" | "edges" | "hints" | "compile" | "explanation" | "correctness";
  label: string;
  earned: number;
  max: number;
  note: string;
}

export interface ArenaAttemptScore {
  challengeId: string;
  score: number;
  weak: boolean;
  metrics: readonly ArenaMetric[];
}

export interface ArenaRecoveryStep {
  patternName: string;
  minutes: number;
  action: string;
}

export interface ArenaGeneratedMistake {
  topic: TopicId;
  pattern: string;
  signal: string;
  problem: string;
}

export interface ArenaReport {
  score: number;
  attemptScores: readonly ArenaAttemptScore[];
  aggregateMetrics: readonly ArenaMetric[];
  weakPatternNames: readonly string[];
  generatedMistakes: readonly ArenaGeneratedMistake[];
  boxUpdates: Readonly<Record<string, ArenaRecallRecord>>;
  replay: readonly ArenaEvent[];
  recovery: {
    scheduledFor: string;
    totalMinutes: number;
    patternNames: readonly string[];
    steps: readonly ArenaRecoveryStep[];
  };
}

export interface ArenaSession {
  id: string;
  config: ArenaConfig;
  companyName: string;
  startedAt: number;
  status: "active" | "complete";
  activeIndex: number;
  challenges: readonly ArenaChallenge[];
  attempts: readonly ArenaAttempt[];
  events: readonly ArenaEvent[];
  draft?: ArenaDraft;
  completedAt?: number;
  report?: ArenaReport;
}

const DAY = 86_400_000;
const INTERVAL_DAYS = [0, 1, 3, 7, 14] as const;

const clamp = (n: number, low = 0, high = 1): number => Math.max(low, Math.min(high, n));
const cleanHtml = (text: string): string => text.replace(/<[^>]+>/g, "").replace(/^Signal:\s*/i, "").trim();
const round = (n: number): number => Math.round(n * 10) / 10;

function hash(input: string): number {
  let out = 2166136261;
  for (let i = 0; i < input.length; i++) {
    out ^= input.charCodeAt(i);
    out = Math.imul(out, 16777619);
  }
  return out >>> 0;
}

function seededUnit(seed: string): number {
  let x = hash(seed) || 1;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x >>> 0) / 4_294_967_295;
}

function asRecall(value: number | ArenaRecallRecord | undefined): ArenaRecallRecord | null {
  if (value === undefined) return null;
  return typeof value === "number" ? { box: value, due: 0 } : value;
}

function roleBoost(role: string, topic: TopicId): number {
  const r = role.toLowerCase();
  const groups: readonly [RegExp, readonly TopicId[]][] = [
    [/back.?end|platform|distributed/, ["graph", "heap", "hash", "design", "tree"]],
    [/front.?end|web/, ["arr", "str", "hash", "stk", "design"]],
    [/mobile|android|ios/, ["arr", "str", "design", "graph"]],
    [/data|machine learning|ml|quant/, ["arr", "dp", "graph", "heap", "math"]],
  ];
  const match = groups.find(([pattern]) => pattern.test(r));
  return match?.[1].includes(topic) ? 1.18 : 1;
}

function challengeCount(config: ArenaConfig): number {
  if (config.mode === "staged-oa") return Math.min(4, Math.max(2, Math.round(config.durationMin / 22.5)));
  return Math.min(4, Math.max(1, Math.round(config.durationMin / 30)));
}

function selectionScore(input: ArenaGenerationInput, pattern: Pattern): { score: number; reason: string } {
  const coverage = input.coverage[pattern.n];
  const ratio = coverage?.ratio ?? 0;
  const company = input.company.weights[pattern.t] ?? 0;
  const confidence = input.confidences[pattern.n];
  const recall = asRecall(input.boxes[pattern.n]);
  const misses = input.mistakes.filter((m) => m.pattern === pattern.n || m.topic === pattern.t).length;

  let score = 1 + company * 1.25 + (1 - ratio) * 3;
  if (confidence === "weak") score += 2;
  if (confidence === "ok") score *= 0.55;
  if (recall) score += Math.max(0, 4 - recall.box) * 0.55;
  score += Math.min(2.5, misses * 0.5);
  score *= roleBoost(input.config.role, pattern.t);

  const parts = [`company ${company}/5`, ratio === 0 ? "unseen" : `${Math.round(ratio * 100)}% up the mastery ladder`];
  if (confidence === "weak") parts.push("marked shaky");
  if (recall && recall.box <= 1) parts.push(`recall box ${recall.box}`);
  if (misses) parts.push(`${misses} related miss${misses === 1 ? "" : "es"}`);
  return { score, reason: parts.join(" · ") };
}

function pickProblem(pattern: Pattern, coverage: ArenaCoverageInput | undefined, index: number): Problem {
  const open = coverage?.openAnchors ?? [];
  return open[index % Math.max(1, open.length)] ?? pattern.lc[index % pattern.lc.length] ?? [0, "", pattern.n];
}

export function generateArenaSession(input: ArenaGenerationInput): ArenaSession {
  const now = input.now ?? Date.now();
  const id = `arena-${now}-${hash(`${input.config.companyId}:${input.config.role}:${input.config.mode}`)}`;
  const forced = new Set(input.forcedPatternNames ?? []);
  const requested = input.forcedPatternNames?.length ?? challengeCount(input.config);
  const candidates = input.patterns
    .filter((pattern) => forced.size === 0 || forced.has(pattern.n))
    .map((pattern) => {
      const selection = selectionScore(input, pattern);
      const jitter = seededUnit(`${id}:${pattern.n}`) * 0.35;
      return { pattern, score: selection.score + jitter, reason: selection.reason };
    });

  const selected: typeof candidates = [];
  const topicCounts = new Map<TopicId, number>();
  while (selected.length < requested && candidates.length) {
    candidates.sort((a, b) => {
      const aPenalty = 1 + (topicCounts.get(a.pattern.t) ?? 0) * 0.48;
      const bPenalty = 1 + (topicCounts.get(b.pattern.t) ?? 0) * 0.48;
      return b.score / bPenalty - a.score / aPenalty || a.pattern.n.localeCompare(b.pattern.n);
    });
    const next = candidates.shift()!;
    selected.push(next);
    topicCounts.set(next.pattern.t, (topicCounts.get(next.pattern.t) ?? 0) + 1);
  }

  const budgetMin = Math.max(8, Math.floor(input.config.durationMin / Math.max(1, selected.length)));
  const challenges = selected.map(({ pattern, reason }, index): ArenaChallenge => ({
    id: `${id}-q${index + 1}`,
    stage: index + 1,
    budgetMin,
    patternName: pattern.n,
    topic: pattern.t,
    problem: pickProblem(pattern, input.coverage[pattern.n], index),
    expectedTime: pattern.tc,
    expectedSpace: pattern.sc,
    signal: cleanHtml(pattern.sig),
    trap: cleanHtml(pattern.trap),
    proofGuide: cleanHtml(pattern.proof ?? pattern.why),
    edges: pattern.edges ?? [],
    selectionReason: reason,
  }));

  return {
    id,
    config: input.config,
    companyName: input.company.name,
    startedAt: now,
    status: "active",
    activeIndex: 0,
    challenges,
    attempts: [],
    events: [
      { kind: "session-started", atSec: 0, detail: `${input.company.name} · ${input.config.mode}` },
      ...(challenges[0] ? [{ kind: "challenge-started" as const, challengeId: challenges[0].id, atSec: 0 }] : []),
    ],
  };
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function patternGuessMatches(guess: string, expected: string): boolean {
  const a = normalise(guess);
  const b = normalise(expected);
  return a.length >= 4 && (a === b || (a.length >= 8 && b.includes(a)) || (b.length >= 8 && a.includes(b)));
}

export function complexityMatches(choice: string, expected: string): boolean {
  const a = normalise(choice).replace(/time$/, "");
  const b = normalise(expected).replace(/time$/, "");
  return a.length > 1 && (a === b || a.includes(b) || b.includes(a));
}

function metric(
  key: ArenaMetric["key"],
  label: string,
  ratio: number,
  max: number,
  note: string,
): ArenaMetric {
  return { key, label, earned: round(clamp(ratio) * max), max, note };
}

export function scoreArenaAttempt(challenge: ArenaChallenge, attempt: ArenaAttempt): ArenaAttemptScore {
  const guessed = patternGuessMatches(attempt.patternGuess, challenge.patternName);
  const seconds = Math.max(0, attempt.patternIdentifiedSec);
  const speed = seconds <= 90 ? 1 : seconds <= 180 ? 0.82 : seconds <= 300 ? 0.58 : 0.3;
  const complexityRight = complexityMatches(attempt.complexityChoice, challenge.expectedTime);
  const firstRun = { pass: 1, partial: 0.55, fail: 0.15, "not-run": 0 }[attempt.firstRun];
  const wantedEdges = Math.max(1, Math.min(3, challenge.edges.length || 2));
  const edgeRatio = attempt.edgeCases.filter((edge) => edge.trim()).length / wantedEdges;
  const hintRatio = Math.max(0, 1 - attempt.hints * 0.28);
  const compile = { clean: 1, "minor-fix": 0.55, fail: 0.1, "not-checked": 0 }[attempt.compileResult];
  const explanationCount = Object.values(attempt.explanationRubric).filter(Boolean).length;
  const correctness = { pass: 1, partial: 0.55, fail: 0 }[attempt.correctness];

  const metrics: ArenaMetric[] = [
    metric("pattern", "Pattern identification", (guessed ? 1 : 0.25) * speed, 14, `${guessed ? "matched" : "missed"} in ${Math.round(seconds)}s`),
    metric("complexity", "Complexity before code", (attempt.complexityLockedBeforeCode ? 0.45 : 0) + (complexityRight ? 0.55 : 0), 14, `${attempt.complexityChoice || "not locked"} · target ${challenge.expectedTime}`),
    metric("first-run", "First-run correctness", firstRun, 12, attempt.firstRun),
    metric("edges", "Edge cases found", edgeRatio, 12, `${attempt.edgeCases.filter(Boolean).length}/${wantedEdges} surfaced`),
    metric("hints", "Hint independence", hintRatio, 10, `${attempt.hints} hint${attempt.hints === 1 ? "" : "s"}`),
    metric("compile", "Compile rate", compile, 10, attempt.compileResult),
    metric("explanation", "Explanation / proof", explanationCount / 4, 16, `${explanationCount}/4 rubric points`),
    metric("correctness", "Final correctness", correctness, 12, attempt.correctness),
  ];
  const score = Math.round(metrics.reduce((sum, row) => sum + row.earned, 0));
  return {
    challengeId: challenge.id,
    score,
    weak: score < 72 || !guessed || !complexityRight || attempt.correctness !== "pass",
    metrics,
  };
}

function defaultMiss(challenge: ArenaChallenge, attempt: ArenaAttempt): string {
  if (attempt.missedSignal.trim()) return attempt.missedSignal.trim();
  if (!patternGuessMatches(attempt.patternGuess, challenge.patternName)) {
    return `Did not map “${challenge.problem[2]}” to ${challenge.patternName} before coding.`;
  }
  if (!complexityMatches(attempt.complexityChoice, challenge.expectedTime)) {
    return `Recognised ${challenge.patternName}, but planned ${attempt.complexityChoice || "no complexity"} instead of ${challenge.expectedTime}.`;
  }
  if (attempt.edgeCases.filter(Boolean).length < Math.min(2, Math.max(1, challenge.edges.length))) {
    return `Started ${challenge.patternName} without surfacing enough boundary cases before the first run.`;
  }
  if (attempt.hints > 0) return `Needed ${attempt.hints} hint${attempt.hints === 1 ? "" : "s"} to complete ${challenge.patternName}.`;
  return `${challenge.patternName} was not reliable under interview conditions.`;
}

function nextIsoDay(now: number): string {
  return new Date(now + DAY).toISOString().slice(0, 10);
}

export function buildArenaReport(session: ArenaSession, previousBoxes: Readonly<Record<string, number | ArenaRecallRecord>> = {}, now = Date.now()): ArenaReport {
  const challengeById = new Map(session.challenges.map((challenge) => [challenge.id, challenge]));
  const attemptScores = session.attempts.map((attempt) => scoreArenaAttempt(challengeById.get(attempt.challengeId)!, attempt));
  const weak = attemptScores.filter((row) => row.weak);
  const weakIds = new Set(weak.map((row) => row.challengeId));
  const weakChallenges = session.challenges.filter((challenge) => weakIds.has(challenge.id));
  const attemptById = new Map(session.attempts.map((attempt) => [attempt.challengeId, attempt]));

  const aggregateMetrics = (attemptScores[0]?.metrics ?? []).map((seed) => {
    const rows = attemptScores.map((row) => row.metrics.find((candidate) => candidate.key === seed.key)!);
    const earned = rows.length ? rows.reduce((sum, row) => sum + row.earned, 0) / rows.length : 0;
    return { ...seed, earned: round(earned), note: `${Math.round((earned / seed.max) * 100)}% across the set` };
  });
  const score = attemptScores.length
    ? Math.round(attemptScores.reduce((sum, row) => sum + row.score, 0) / attemptScores.length)
    : 0;

  const generatedMistakes = weakChallenges.map((challenge): ArenaGeneratedMistake => ({
    topic: challenge.topic,
    pattern: challenge.patternName,
    signal: defaultMiss(challenge, attemptById.get(challenge.id)!),
    problem: `Arena · LC ${challenge.problem[0]} ${challenge.problem[2]}`,
  }));

  const boxUpdates: Record<string, ArenaRecallRecord> = {};
  for (const challenge of weakChallenges) boxUpdates[challenge.patternName] = { box: 0, due: now };
  for (const challenge of session.challenges.filter((candidate) => !weakIds.has(candidate.id))) {
    const previous = asRecall(previousBoxes[challenge.patternName]);
    const box = Math.min(4, (previous?.box ?? 0) + 1);
    boxUpdates[challenge.patternName] = { box, due: now + INTERVAL_DAYS[box]! * DAY };
  }

  const recoverySteps = weakChallenges.flatMap((challenge): ArenaRecoveryStep[] => [
    { patternName: challenge.patternName, minutes: 5, action: `Recall the signal and state ${challenge.expectedTime} before seeing code.` },
    { patternName: challenge.patternName, minutes: 5, action: `List three edge cases for ${challenge.problem[2]}.` },
    { patternName: challenge.patternName, minutes: 15, action: `Re-solve LC ${challenge.problem[0]} in ${session.config.mode} mode with zero hints.` },
  ]);

  return {
    score,
    attemptScores,
    aggregateMetrics,
    weakPatternNames: weakChallenges.map((challenge) => challenge.patternName),
    generatedMistakes,
    boxUpdates,
    replay: [...session.events, { kind: "session-completed", atSec: Math.max(0, Math.round((now - session.startedAt) / 1000)), detail: `score ${score}` }],
    recovery: {
      scheduledFor: nextIsoDay(now),
      totalMinutes: recoverySteps.reduce((sum, step) => sum + step.minutes, 0),
      patternNames: weakChallenges.map((challenge) => challenge.patternName),
      steps: recoverySteps,
    },
  };
}
