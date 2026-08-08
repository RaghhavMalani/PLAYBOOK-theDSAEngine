import { STORE_PREFIX } from "./dom";
import {
  LEARNING_DATA_KEYS,
  LEARNING_STATE_CHANGED_EVENT,
  ensureLearningMetadata,
  readLearningMetadata,
  writeLearningMetadata,
  type LearningDataKey,
} from "./learning-state";

export { LEARNING_DATA_KEYS, type LearningDataKey } from "./learning-state";

export interface LearningBackup {
  format: "dsa-engine-learning-data";
  version: 2;
  exportedAt: string;
  deviceId: string;
  data: Partial<Record<LearningDataKey, unknown | null>>;
  updatedAt: Partial<Record<LearningDataKey, string>>;
}

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): boolean =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const ROOT_VALIDATORS: Record<LearningDataKey, (value: unknown) => boolean> = {
  mistakes: Array.isArray,
  boxes: isRecord,
  masteryAttempts: Array.isArray,
  conf: isRecord,
  targets: isStringArray,
  interviewDates: isRecord,
  today: isRecord,
  wb: isRecord,
  arenaActive: isRecord,
  arenaHistory: Array.isArray,
  arenaRecovery: isRecord,
  groundedInterviewActive: isRecord,
  groundedInterviewHistory: Array.isArray,
  groundedMistakeSessions: isStringArray,
  oaEssentials: isRecord,
};

function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function validateCategory(key: LearningDataKey, value: unknown): void {
  if (value === null) return;
  if (!ROOT_VALIDATORS[key](value)) {
    throw new Error(`The learning-data category "${key}" has an invalid shape.`);
  }
}

export function createLearningBackup(
  storage: ReadableStorage = localStorage,
  now = new Date(),
): LearningBackup {
  const exportedAt = now.toISOString();
  const metadata = readLearningMetadata(storage, STORE_PREFIX);
  const data: LearningBackup["data"] = {};
  const updatedAt: LearningBackup["updatedAt"] = {};
  for (const key of LEARNING_DATA_KEYS) {
    const raw = storage.getItem(STORE_PREFIX + key);
    if (raw === null) {
      data[key] = null;
    } else {
      try {
        data[key] = JSON.parse(raw) as unknown;
      } catch {
        throw new Error(`Stored learning data for "${key}" is not valid JSON.`);
      }
    }
    updatedAt[key] = metadata?.updatedAt[key] ?? exportedAt;
  }
  return {
    format: "dsa-engine-learning-data",
    version: 2,
    exportedAt,
    deviceId: metadata?.deviceId ?? "unregistered-device",
    data,
    updatedAt,
  };
}

export function parseLearningBackup(input: string | unknown): LearningBackup {
  let value: unknown = input;
  if (typeof input === "string") {
    try {
      value = JSON.parse(input) as unknown;
    } catch {
      throw new Error("That file is not valid JSON.");
    }
  }
  if (!isRecord(value) || value.format !== "dsa-engine-learning-data") {
    throw new Error("That is not a DSA Engine learning-data backup.");
  }
  if (value.version !== 1 && value.version !== 2) {
    throw new Error(`Unsupported learning-data backup version: ${String(value.version)}.`);
  }
  if (!isRecord(value.data)) {
    throw new Error("The learning-data backup has no data object.");
  }

  const data: LearningBackup["data"] = {};
  const updatedAt: LearningBackup["updatedAt"] = {};
  const sourceUpdatedAt = value.version === 2 && isRecord(value.updatedAt) ? value.updatedAt : {};
  const fallbackTimestamp = validTimestamp(value.exportedAt) ? value.exportedAt : new Date(0).toISOString();
  for (const key of LEARNING_DATA_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(value.data, key)) continue;
    const category = value.data[key];
    validateCategory(key, category);
    data[key] = category;
    updatedAt[key] = validTimestamp(sourceUpdatedAt[key]) ? sourceUpdatedAt[key] : fallbackTimestamp;
  }
  if (Object.keys(data).length === 0) {
    throw new Error("The backup contains none of the recognised learning-data categories.");
  }

  return {
    format: "dsa-engine-learning-data",
    version: 2,
    exportedAt: validTimestamp(value.exportedAt) ? value.exportedAt : fallbackTimestamp,
    deviceId: value.version === 2 && typeof value.deviceId === "string" ? value.deviceId : "legacy-device",
    data,
    updatedAt,
  };
}

/** Replaces only the non-regenerable learning-data categories; UI preferences are untouched. */
export function restoreLearningBackup(
  input: string | unknown,
  storage: WritableStorage = localStorage,
  now = new Date(),
): number {
  const backup = parseLearningBackup(input);
  const metadata = ensureLearningMetadata(storage, STORE_PREFIX, now);
  const nextUpdatedAt = { ...metadata.updatedAt };
  let restored = 0;

  // Parsing and root validation happen before the first write, so a malformed file
  // cannot leave the browser with half of a restore applied.
  for (const key of LEARNING_DATA_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(backup.data, key)) continue;
    const value = backup.data[key];
    if (value === null) storage.removeItem(STORE_PREFIX + key);
    else storage.setItem(STORE_PREFIX + key, JSON.stringify(value));
    nextUpdatedAt[key] = backup.updatedAt[key] ?? now.toISOString();
    restored++;
  }
  writeLearningMetadata(storage, { ...metadata, updatedAt: nextUpdatedAt }, STORE_PREFIX);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LEARNING_STATE_CHANGED_EVENT, {
      detail: { source: "restore" },
    }));
  }
  return restored;
}

export function mergeLearningBackups(
  localInput: string | unknown,
  remoteInput: string | unknown,
  now = new Date(),
): LearningBackup {
  const local = parseLearningBackup(localInput);
  const remote = parseLearningBackup(remoteInput);
  const data: LearningBackup["data"] = {};
  const updatedAt: LearningBackup["updatedAt"] = {};

  for (const key of LEARNING_DATA_KEYS) {
    const hasLocal = Object.prototype.hasOwnProperty.call(local.data, key);
    const hasRemote = Object.prototype.hasOwnProperty.call(remote.data, key);
    if (!hasLocal && !hasRemote) continue;
    const localTime = Date.parse(local.updatedAt[key] ?? new Date(0).toISOString());
    const remoteTime = Date.parse(remote.updatedAt[key] ?? new Date(0).toISOString());
    const useRemote = hasRemote && (!hasLocal || remoteTime > localTime);
    data[key] = useRemote ? remote.data[key] : local.data[key];
    updatedAt[key] = useRemote ? remote.updatedAt[key] : local.updatedAt[key];
  }

  return {
    format: "dsa-engine-learning-data",
    version: 2,
    exportedAt: now.toISOString(),
    deviceId: local.deviceId,
    data,
    updatedAt,
  };
}

export function downloadLearningBackup(storage: Storage = localStorage): void {
  ensureLearningMetadata(storage, STORE_PREFIX);
  const backup = createLearningBackup(storage);
  const blob = new Blob([JSON.stringify(backup, null, 2) + "\n"], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `dsa-engine-learning-${backup.exportedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
