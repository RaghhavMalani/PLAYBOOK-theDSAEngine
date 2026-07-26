import { TOPICS } from "../data/index";
import type { TopicId } from "../types";

export function topicName(id: string): string {
  for (const [tid, label] of TOPICS) if (tid === id) return label;
  return id;
}

export const TOPIC_IDS: readonly TopicId[] = TOPICS.map(([id]) => id);
