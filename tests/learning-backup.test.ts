import { describe, expect, it } from "vitest";
import {
  createLearningBackup,
  mergeLearningBackups,
  parseLearningBackup,
  restoreLearningBackup,
} from "../src/lib/learning-backup";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe("learning-data backups", () => {
  it("captures and restores every non-regenerable category", () => {
    const source = new MemoryStorage();
    source.setItem("pb_boxes", JSON.stringify({ "Frequency map": { box: 3, due: 123 } }));
    source.setItem("pb_conf", JSON.stringify({ "Frequency map": 2 }));
    source.setItem("pb_targets", JSON.stringify(["google", "visa"]));
    source.setItem("pb_interviewDates", JSON.stringify({ google: "2026-08-22" }));
    source.setItem("pb_mistakes", JSON.stringify([{ id: "1", signal: "missed prefix sum" }]));
    source.setItem("pb_wb", JSON.stringify({ tries: 4, first: 3 }));
    source.setItem("pb_today", JSON.stringify({ date: "2026-08-04", completed: ["recall"] }));
    source.setItem("pb_arenaActive", JSON.stringify({ id: "arena-1", status: "active" }));
    source.setItem("pb_arenaHistory", JSON.stringify([{ id: "arena-0", score: 72 }]));
    source.setItem("pb_arenaRecovery", JSON.stringify({ patternNames: ["Prefix sum"] }));
    source.setItem("pb_masteryAttempts", JSON.stringify([{ id: "attempt-1", pattern: "Prefix sum" }]));
    source.setItem("pb_groundedInterviewActive", JSON.stringify({ id: "grounded-1", status: "complete" }));
    source.setItem("pb_groundedInterviewHistory", JSON.stringify([{ id: "grounded-1", status: "complete" }]));
    source.setItem("pb_groundedMistakeSessions", JSON.stringify(["grounded-1"]));
    source.setItem("pb_oaEssentials", JSON.stringify({ dbms: { choice: 1, correct: true } }));

    const backup = createLearningBackup(source, new Date("2026-08-04T12:00:00.000Z"));
    const target = new MemoryStorage();
    expect(backup.version).toBe(2);
    expect(restoreLearningBackup(JSON.stringify(backup), target)).toBe(15);
    expect(target.getItem("pb_boxes")).toBe(source.getItem("pb_boxes"));
    expect(target.getItem("pb_conf")).toBe(source.getItem("pb_conf"));
    expect(target.getItem("pb_targets")).toBe(source.getItem("pb_targets"));
    expect(target.getItem("pb_interviewDates")).toBe(source.getItem("pb_interviewDates"));
    expect(target.getItem("pb_mistakes")).toBe(source.getItem("pb_mistakes"));
    expect(target.getItem("pb_wb")).toBe(source.getItem("pb_wb"));
    expect(target.getItem("pb_today")).toBe(source.getItem("pb_today"));
    expect(target.getItem("pb_arenaActive")).toBe(source.getItem("pb_arenaActive"));
    expect(target.getItem("pb_arenaHistory")).toBe(source.getItem("pb_arenaHistory"));
    expect(target.getItem("pb_arenaRecovery")).toBe(source.getItem("pb_arenaRecovery"));
    expect(target.getItem("pb_masteryAttempts")).toBe(source.getItem("pb_masteryAttempts"));
    expect(target.getItem("pb_groundedInterviewActive")).toBe(source.getItem("pb_groundedInterviewActive"));
    expect(target.getItem("pb_groundedInterviewHistory")).toBe(source.getItem("pb_groundedInterviewHistory"));
    expect(target.getItem("pb_groundedMistakeSessions")).toBe(source.getItem("pb_groundedMistakeSessions"));
    expect(target.getItem("pb_oaEssentials")).toBe(source.getItem("pb_oaEssentials"));
  });

  it("removes a category when a full backup records it as empty", () => {
    const source = new MemoryStorage();
    const backup = createLearningBackup(source);
    const target = new MemoryStorage();
    target.setItem("pb_mistakes", "[{}]");
    restoreLearningBackup(backup, target);
    expect(target.getItem("pb_mistakes")).toBeNull();
  });

  it("migrates v1 files and rejects unrelated and future-version JSON", () => {
    const migrated = parseLearningBackup({
      format: "dsa-engine-learning-data",
      version: 1,
      exportedAt: "2026-08-01T00:00:00.000Z",
      data: { boxes: { "Prefix sum": { box: 2, due: 123 } } },
    });
    expect(migrated.version).toBe(2);
    expect(migrated.updatedAt.boxes).toBe("2026-08-01T00:00:00.000Z");
    expect(() => parseLearningBackup('{"hello":"world"}')).toThrow(/not a DSA Engine/);
    expect(() => parseLearningBackup({
      format: "dsa-engine-learning-data",
      version: 3,
      data: { boxes: {} },
    })).toThrow(/Unsupported/);
  });

  it("validates every category before making any restore writes", () => {
    const target = new MemoryStorage();
    target.setItem("pb_boxes", JSON.stringify({ keep: true }));
    expect(() => restoreLearningBackup({
      format: "dsa-engine-learning-data",
      version: 2,
      exportedAt: "2026-08-04T12:00:00.000Z",
      deviceId: "bad-file",
      updatedAt: { boxes: "2026-08-04T12:00:00.000Z", targets: "2026-08-04T12:00:00.000Z" },
      data: { boxes: {}, targets: { should: "be an array" } },
    }, target)).toThrow(/targets/);
    expect(target.getItem("pb_boxes")).toBe(JSON.stringify({ keep: true }));
  });

  it("merges categories independently using revision timestamps", () => {
    const local = parseLearningBackup({
      format: "dsa-engine-learning-data",
      version: 2,
      exportedAt: "2026-08-05T10:00:00.000Z",
      deviceId: "laptop",
      updatedAt: { mistakes: "2026-08-05T10:00:00.000Z", conf: "2026-08-04T10:00:00.000Z" },
      data: { mistakes: [{ id: "local" }], conf: { Prefix: 1 } },
    });
    const remote = parseLearningBackup({
      format: "dsa-engine-learning-data",
      version: 2,
      exportedAt: "2026-08-05T11:00:00.000Z",
      deviceId: "phone",
      updatedAt: { mistakes: "2026-08-04T10:00:00.000Z", conf: "2026-08-05T11:00:00.000Z" },
      data: { mistakes: [{ id: "remote" }], conf: { Prefix: 4 } },
    });
    const merged = mergeLearningBackups(local, remote, new Date("2026-08-05T12:00:00.000Z"));
    expect(merged.data.mistakes).toEqual([{ id: "local" }]);
    expect(merged.data.conf).toEqual({ Prefix: 4 });
    expect(merged.deviceId).toBe("laptop");
  });
});
