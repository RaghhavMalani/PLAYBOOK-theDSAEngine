export const LEARNING_DATA_KEYS = [
  "mistakes",
  "boxes",
  "masteryAttempts",
  "conf",
  "targets",
  "interviewDates",
  "today",
  "wb",
  "arenaActive",
  "arenaHistory",
  "arenaRecovery",
  "groundedInterviewActive",
  "groundedInterviewHistory",
  "groundedMistakeSessions",
  "oaEssentials",
] as const;

export type LearningDataKey = (typeof LEARNING_DATA_KEYS)[number];

export interface LearningMetadata {
  version: 1;
  deviceId: string;
  updatedAt: Partial<Record<LearningDataKey, string>>;
}

export const LEARNING_META_KEY = "learningMeta";
export const LEARNING_STATE_CHANGED_EVENT = "dsa:learning-state-changed";

const LEARNING_KEY_SET = new Set<string>(LEARNING_DATA_KEYS);

export function isLearningDataKey(key: string): key is LearningDataKey {
  return LEARNING_KEY_SET.has(key);
}

function deviceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function readLearningMetadata(storage: Pick<Storage, "getItem">, prefix = "pb_"): LearningMetadata | null {
  try {
    const value = JSON.parse(storage.getItem(prefix + LEARNING_META_KEY) ?? "null") as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (record.version !== 1 || typeof record.deviceId !== "string") return null;
    const updatedAt = record.updatedAt;
    if (!updatedAt || typeof updatedAt !== "object" || Array.isArray(updatedAt)) return null;
    return { version: 1, deviceId: record.deviceId, updatedAt: updatedAt as LearningMetadata["updatedAt"] };
  } catch {
    return null;
  }
}

export function ensureLearningMetadata(
  storage: Pick<Storage, "getItem" | "setItem">,
  prefix = "pb_",
  now = new Date(),
): LearningMetadata {
  const existing = readLearningMetadata(storage, prefix);
  if (existing) return existing;
  const timestamp = now.toISOString();
  const metadata: LearningMetadata = {
    version: 1,
    deviceId: deviceId(),
    updatedAt: Object.fromEntries(LEARNING_DATA_KEYS.map((key) => [key, timestamp])),
  };
  storage.setItem(prefix + LEARNING_META_KEY, JSON.stringify(metadata));
  return metadata;
}

export function writeLearningMetadata(
  storage: Pick<Storage, "setItem">,
  metadata: LearningMetadata,
  prefix = "pb_",
): void {
  storage.setItem(prefix + LEARNING_META_KEY, JSON.stringify(metadata));
}

export function markLearningDataChanged(
  key: LearningDataKey,
  storage: Pick<Storage, "getItem" | "setItem">,
  prefix = "pb_",
  now = new Date(),
): void {
  const metadata = ensureLearningMetadata(storage, prefix, now);
  writeLearningMetadata(storage, {
    ...metadata,
    updatedAt: { ...metadata.updatedAt, [key]: now.toISOString() },
  }, prefix);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LEARNING_STATE_CHANGED_EVENT, {
      detail: { key, source: "local" },
    }));
  }
}
