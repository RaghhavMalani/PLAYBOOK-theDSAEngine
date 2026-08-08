import { describe, expect, it } from "vitest";
import { COMPANIES } from "../src/data/companies";
import { PATTERNS } from "../src/data/index";
import {
  buildArenaReport,
  generateArenaSession,
  scoreArenaAttempt,
  type ArenaAttempt,
  type ArenaConfig,
} from "../src/lib/arena";

const NOW = Date.parse("2026-08-05T12:00:00.000Z");
const company = COMPANIES.find((candidate) => candidate.id === "google")!;
const config: ArenaConfig = {
  companyId: company.id,
  role: "Backend Software Engineer",
  interviewDate: "2026-08-22",
  language: "py",
  durationMin: 90,
  mode: "staged-oa",
};

function generated() {
  return generateArenaSession({
    config,
    company,
    patterns: PATTERNS,
    coverage: Object.fromEntries(PATTERNS.map((pattern) => [pattern.n, { ratio: 0, openAnchors: pattern.lc }])),
    confidences: {},
    boxes: {},
    mistakes: [],
    now: NOW,
  });
}

function attemptFor(session = generated(), index = 0): ArenaAttempt {
  const challenge = session.challenges[index]!;
  return {
    challengeId: challenge.id,
    patternGuess: challenge.patternName,
    patternIdentifiedSec: 55,
    complexityChoice: challenge.expectedTime,
    complexityLockedBeforeCode: true,
    code: "def solve(a):\n    return a",
    correctness: "pass",
    firstRun: "pass",
    edgeCases: ["empty", "single item", "duplicates"],
    hints: 0,
    compileResult: "clean",
    explanation: "Invariant and proof.",
    explanationRubric: { invariant: true, complexity: true, correctness: true, tradeoff: true },
    missedSignal: "",
    submittedAtSec: 900,
  };
}

describe("Interview Arena", () => {
  it("builds a deterministic staged set from the weighted pattern pool", () => {
    const first = generated();
    const second = generated();

    expect(first.challenges).toHaveLength(4);
    expect(first.challenges.map((challenge) => challenge.patternName)).toEqual(second.challenges.map((challenge) => challenge.patternName));
    expect(new Set(first.challenges.map((challenge) => challenge.patternName)).size).toBe(4);
    expect(first.challenges.every((challenge) => challenge.selectionReason.includes("company"))).toBe(true);
  });

  it("keeps final correctness to 12 of the 100 available points", () => {
    const session = generated();
    const scored = scoreArenaAttempt(session.challenges[0]!, attemptFor(session));
    const correctness = scored.metrics.find((metric) => metric.key === "correctness")!;

    expect(scored.score).toBe(100);
    expect(correctness.max).toBe(12);
    expect(scored.metrics.reduce((sum, metric) => sum + metric.max, 0)).toBe(100);
  });

  it("closes the loop for a weak attempt", () => {
    const session = generated();
    const weak = {
      ...attemptFor(session),
      patternGuess: "two pointers",
      complexityChoice: "O(n^2)",
      correctness: "partial" as const,
      firstRun: "fail" as const,
      edgeCases: [],
      hints: 2,
      compileResult: "minor-fix" as const,
      explanationRubric: { invariant: false, complexity: false, correctness: false, tradeoff: false },
    };
    const complete = { ...session, attempts: [weak] };
    const report = buildArenaReport(complete, {}, NOW + 20 * 60_000);
    const patternName = session.challenges[0]!.patternName;

    expect(report.generatedMistakes).toHaveLength(1);
    expect(report.generatedMistakes[0]!.signal).toContain(patternName);
    expect(report.boxUpdates[patternName]).toEqual({ box: 0, due: NOW + 20 * 60_000 });
    expect(report.recovery.patternNames).toEqual([patternName]);
    expect(report.recovery.totalMinutes).toBe(25);
    expect(report.replay.at(-1)?.kind).toBe("session-completed");
  });
});
