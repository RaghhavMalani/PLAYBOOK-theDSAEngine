import { describe, expect, it } from "vitest";
import { PATTERNS } from "../src/data";
import { PERSONAL_REPLAYS } from "../src/data/replays.generated";
import { FAMILY_TO_TOPICS } from "../src/data/progress";
import { SOLVED } from "../src/data/progress.generated";
import {
  buildReplayBridges,
  buildRunnableSource,
  canRunLive,
  countCurriculumTraces,
  introduceBug,
  mutateLiteralInput,
  predictionOptions,
} from "../src/lib/replay";

describe("personal replay laboratory", () => {
  const families = new Map(SOLVED.map((entry) => [entry.num, entry.family]));
  const bridges = buildReplayBridges(PERSONAL_REPLAYS, PATTERNS, FAMILY_TO_TOPICS, families);

  it("imports every traced personal solution and every curriculum trace", () => {
    expect(PERSONAL_REPLAYS).toHaveLength(112);
    expect(countCurriculumTraces(PATTERNS)).toBe(158);
    expect(bridges).toHaveLength(PERSONAL_REPLAYS.length);
    expect(bridges.filter((bridge) => bridge.exact && bridge.walk).length).toBeGreaterThan(20);
  });

  it("keeps every personal replay executable as a saved state sequence", () => {
    for (const replay of PERSONAL_REPLAYS) {
      expect(replay.code.length, replay.dir).toBeGreaterThan(20);
      expect(replay.frames.length, replay.dir).toBeGreaterThan(1);
      for (const frame of replay.frames) expect(frame.line, replay.dir).toBeGreaterThan(0);
    }
  });

  it("builds a live CPython wrapper only for plain method inputs", () => {
    const twoSum = PERSONAL_REPLAYS.find((replay) => replay.num === 1)!;
    expect(canRunLive(twoSum)).toBe(true);
    const source = buildRunnableSource(twoSum, "nums = [3, 3], target = 6")!;
    expect(source).toContain("Solution().twoSum(nums, target)");
    expect(source).toContain("nums = [3, 3]\ntarget = 6");

    const linked = PERSONAL_REPLAYS.find((replay) => replay.num === 2)!;
    expect(canRunLive(linked)).toBe(false);
  });

  it("mutates inputs without changing their overall shape", () => {
    const original = "nums = [2,7,11,15], target = 9";
    const mutated = mutateLiteralInput(original, 2);
    expect(mutated).not.toBe(original);
    expect(mutated).toContain("nums = [");
    expect(mutated).toContain("target =");
  });

  it("introduces one explainable source mutation", () => {
    const mutation = introduceBug("def solve(a):\n    if 1 not in a:\n        return max(a)", 0)!;
    expect(mutation.line).toBe(2);
    expect(mutation.before).toContain("not in");
    expect(mutation.after).not.toContain("not in");
    expect(mutation.code.split("\n")).toHaveLength(3);
  });

  it("creates a next-state prediction with exactly one recorded answer", () => {
    const replay = PERSONAL_REPLAYS[0];
    const options = predictionOptions(replay.frames[0], replay.frames[1]);
    expect(options).toHaveLength(3);
    expect(options[0].length).toBeGreaterThan(0);
    expect(new Set(options).size).toBe(3);
  });
});
