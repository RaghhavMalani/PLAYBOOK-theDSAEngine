import { describe, expect, it } from "vitest";
import { codeFingerprint, masteryForPattern, type MasteryAttempt } from "../src/lib/mastery";

const DAY = 86_400_000;
const BASE = Date.parse("2026-01-01T12:00:00.000Z");

function attempt(overrides: Partial<MasteryAttempt> = {}): MasteryAttempt {
  return {
    id: overrides.id ?? `a-${Math.random()}`,
    pattern: "Prefix sum + hash map",
    problemNumber: 560,
    attemptedAt: new Date(BASE).toISOString(),
    source: "manual",
    kind: "re-solve",
    outcome: "pass",
    assistance: "none",
    withoutNotes: true,
    recognitionSeconds: 80,
    workingCodeSeconds: 1_200,
    codeHash: "hash-a",
    codeOrigin: "changed",
    firstPass: true,
    mistakeCategory: "none",
    confidenceBefore: 3,
    confidenceAfter: 4,
    retentionDay: null,
    ...overrides,
  };
}

describe("mastery evidence ladder", () => {
  it("treats an accepted repository solution as exposure only", () => {
    expect(masteryForPattern("Prefix sum + hash map", null, [], BASE).stage).toBe("unseen");
    expect(masteryForPattern("Prefix sum + hash map", new Date(BASE).toISOString(), [], BASE).stage).toBe("exposed");
  });

  it("distinguishes assisted work from an independent re-solve", () => {
    const assisted = attempt({ assistance: "hint", withoutNotes: false });
    expect(masteryForPattern(assisted.pattern, null, [assisted], BASE).stage).toBe("assisted");

    const clean = attempt({ id: "clean" });
    expect(masteryForPattern(clean.pattern, null, [assisted, clean], BASE).stage).toBe("independent");
  });

  it("does not count memorised code as independent", () => {
    const memorised = attempt({ codeOrigin: "memorized" });
    expect(masteryForPattern(memorised.pattern, null, [memorised], BASE).stage).toBe("exposed");
  });

  it("requires checkpoints to occur after their real due dates", () => {
    const baseline = attempt({ id: "baseline" });
    const early = attempt({ id: "early", kind: "retention", retentionDay: 7, attemptedAt: new Date(BASE + DAY).toISOString() });
    const premature = masteryForPattern(baseline.pattern, null, [baseline, early], BASE + 8 * DAY);
    expect(premature.stage).toBe("independent");
    expect(premature.retention.find((row) => row.day === 7)?.state).toBe("due");

    const onTime = attempt({ id: "day-7", kind: "retention", retentionDay: 7, attemptedAt: new Date(BASE + 7 * DAY).toISOString() });
    expect(masteryForPattern(baseline.pattern, null, [baseline, onTime], BASE + 8 * DAY).stage).toBe("retained");
  });

  it("reserves interview-ready for a clean, timed day-30 pass", () => {
    const baseline = attempt({ id: "baseline" });
    const day30 = attempt({
      id: "day-30",
      kind: "retention",
      retentionDay: 30,
      attemptedAt: new Date(BASE + 30 * DAY).toISOString(),
      recognitionSeconds: 120,
      workingCodeSeconds: 1_800,
      confidenceAfter: 4,
      firstPass: true,
    });
    expect(masteryForPattern(baseline.pattern, null, [baseline, day30], BASE + 31 * DAY).stage).toBe("interview-ready");
    expect(masteryForPattern(baseline.pattern, null, [baseline, { ...day30, firstPass: false }], BASE + 31 * DAY).stage).toBe("retained");
  });

  it("fingerprints code deterministically without storing the code", () => {
    expect(codeFingerprint("return 42")).toBe(codeFingerprint("return 42"));
    expect(codeFingerprint("return 42")).not.toBe(codeFingerprint("return 43"));
    expect(codeFingerprint("   ")).toBeNull();
  });
});
