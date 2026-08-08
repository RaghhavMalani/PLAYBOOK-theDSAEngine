import { describe, expect, it } from "vitest";
import { PATTERNS } from "../src/data/index";
import { patternCoverage } from "../src/data/progress";
import { SOLVED } from "../src/data/progress.generated";
import { buildTodayMission } from "../src/features/today";

const NOW = Date.parse("2026-08-05T12:00:00.000Z");

describe("Today Mode", () => {
  it("builds one complete 52-minute loop", () => {
    const mission = buildTodayMission({ targetCompanyIds: ["amazon"], mistakes: [], boxes: {}, now: NOW });

    expect(mission.totalMinutes).toBe(52);
    expect(mission.steps.map((step) => step.kind)).toEqual(["recall", "anchor", "resolve"]);
    expect(mission.steps.map((step) => step.minutes)).toEqual([7, 25, 20]);
  });

  it("uses a genuinely open anchor and a genuinely solved re-solve", () => {
    const mission = buildTodayMission({ targetCompanyIds: ["amazon"], mistakes: [], boxes: {}, now: NOW });
    const anchor = mission.steps.find((step) => step.kind === "anchor")!;
    const resolve = mission.steps.find((step) => step.kind === "resolve")!;
    const coverage = new Map(patternCoverage().map((row) => [row.pattern.n, row]));

    expect(anchor.problem).not.toBeNull();
    expect(coverage.get(anchor.pattern.n)?.openAnchors.some(([num]) => num === anchor.problem?.[0])).toBe(true);
    expect(resolve.problem).not.toBeNull();
    expect(SOLVED.some((entry) => entry.num === resolve.problem?.[0])).toBe(true);
  });

  it("shows all six factors behind every recommendation", () => {
    const mission = buildTodayMission({ targetCompanyIds: ["amazon"], mistakes: [], boxes: {}, now: NOW });
    const expected = ["company", "coverage", "staleness", "mistakes", "recall", "resolve"];

    for (const step of mission.steps) {
      expect(step.signals.map((signal) => signal.key)).toEqual(expected);
      expect(step.reason.length).toBeGreaterThan(80);
    }
  });

  it("pulls an explicit failed recall to the front", () => {
    const focus = PATTERNS.find((pattern) => pattern.n === "Prefix sum + hash map")!;
    const boxes = Object.fromEntries(PATTERNS.map((pattern) => [pattern.n, { box: 4, due: NOW + 86_400_000 }]));
    boxes[focus.n] = { box: 0, due: 0 };

    const mission = buildTodayMission({
      targetCompanyIds: ["amazon"],
      boxes,
      mistakes: [
        { date: "2026-08-04", topic: focus.t, pattern: focus.n, signal: "Negative values broke my sliding window." },
        { date: "2026-08-03", topic: focus.t, pattern: focus.n, signal: "Missed prefix sum state." },
      ],
      now: NOW,
    });

    expect(mission.steps[0].pattern.n).toBe(focus.n);
    expect(mission.steps[0].reason).toContain("2 logged misses");
    expect(mission.steps[0].reason).toContain("Amazon");
  });
});
