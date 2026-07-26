import { PATTERNS as CORE, TOPICS } from "./patterns";
import { HARD_PATTERNS } from "./patterns-hard";
import { mergeFollowups } from "./followups";
import { mergeWalks } from "./walks";
import { PRIMERS_A } from "./topics-deep-a";
import { PRIMERS_B } from "./topics-deep-b";
import type { Pattern, TopicPrimer, TopicId } from "../types";

/**
 * The single source of content for the whole app.
 *
 * Both merge steps throw if a key stops matching a pattern name, so renaming a
 * pattern fails loudly at load rather than silently dropping its follow-ups,
 * edge cases or worked traces.
 */
export const PATTERNS: readonly Pattern[] = mergeWalks([
  ...mergeFollowups(CORE),
  ...HARD_PATTERNS,
]);

export const PRIMERS: readonly TopicPrimer[] = [...PRIMERS_A, ...PRIMERS_B];

export { TOPICS };

export function primerFor(id: TopicId): TopicPrimer | undefined {
  return PRIMERS.find((p) => p.id === id);
}

/* Honest coverage numbers, so the UI can say what is actually populated
   rather than implying every pattern carries every layer. */
export const COVERAGE = {
  total: PATTERNS.length,
  core: PATTERNS.filter((p) => (p.tier ?? "core") === "core").length,
  hard: PATTERNS.filter((p) => p.tier === "hard").length,
  withLadder: PATTERNS.filter((p) => p.followups?.length).length,
  withEdges: PATTERNS.filter((p) => p.edges?.length).length,
  withWalks: PATTERNS.filter((p) => p.walk?.length).length,
  rungs: PATTERNS.reduce((n, p) => n + (p.followups?.length ?? 0), 0),
  edgeRows: PATTERNS.reduce((n, p) => n + (p.edges?.length ?? 0), 0),
  primers: PRIMERS.length,
  primerEdgeRows: PRIMERS.reduce((n, p) => n + p.edges.length, 0),
};
