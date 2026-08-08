import { PATTERNS as CORE, TOPICS } from "./patterns";
import { HARD_PATTERNS } from "./patterns-hard";
import { PATTERNS_MATH } from "./patterns-math";
import { PATTERNS_ADV } from "./patterns-adv";
import { PATTERNS_GAPS } from "./patterns-gaps";
import { PATTERNS_FOUNDATIONS } from "./patterns-foundations";
import { PATTERNS_ARRAYS } from "./patterns-arrays";
import { mergeFollowups } from "./followups";
import { mergeWalks } from "./walks";
import { PRIMERS_A } from "./topics-deep-a";
import { PRIMERS_B } from "./topics-deep-b";
import { PRIMERS_C } from "./topics-deep-c";
import { PRIMERS_FOUNDATIONS } from "./topics-foundations";
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
  /* patterns-math carries its own edges and walks inline rather than through the
   * merge layers, so it is appended after mergeFollowups. */
  ...PATTERNS_MATH,
  ...PATTERNS_ADV,
  ...PATTERNS_GAPS,
  ...PATTERNS_FOUNDATIONS,
  ...PATTERNS_ARRAYS,
]);

export const PRIMERS: readonly TopicPrimer[] = [...PRIMERS_A, ...PRIMERS_B, ...PRIMERS_C, ...PRIMERS_FOUNDATIONS];

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
