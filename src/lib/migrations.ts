/**
 * One-time localStorage migrations.
 *
 * Pattern names are the storage key for confidence ratings and Leitner boxes, so
 * renaming or retiring a pattern silently orphans real progress. Anything that changes
 * a pattern name must ship a migration here, and the migration must be idempotent
 * because it runs on every boot.
 */

import { store, STORE_PREFIX } from "./dom";

/** [from, to] — progress recorded under `from` moves to `to`. */
const RENAMES: readonly (readonly [string, string])[] = [
  // "Merge intervals / sweep line" duplicated two patterns in the intervals topic.
  // It was retired; its drill history belongs with the merge pattern, which is the
  // half a learner is actually being tested on when they rate it.
  ["Merge intervals / sweep line", "Merge overlapping intervals"],
];

/** Maps keyed by pattern name that need the rename applied. */
const NAME_KEYED_STORES = ["conf", "boxes"] as const;

const DONE_KEY = "migrations";

function applied(): Record<string, boolean> {
  return (store<Record<string, boolean>>(DONE_KEY) ?? {}) as Record<string, boolean>;
}

/**
 * Move progress from retired pattern names onto their replacements.
 *
 * Merge rule when both names hold a value: keep the **weaker** one. A Leitner box is a
 * claim about what you have retained, and merging two histories by taking the stronger
 * would manufacture confidence you never earned. Being pushed back a box costs one
 * review; being wrongly advanced costs a question in an OA.
 */
export function migrateLearningKeys(): void {
  const done = applied();
  let changed = false;

  for (const [from, to] of RENAMES) {
    const tag = `rename:${from}`;
    if (done[tag]) continue;

    for (const key of NAME_KEYED_STORES) {
      const map = store<Record<string, unknown>>(key);
      if (!map || typeof map !== "object" || !(from in map)) continue;

      const incoming = map[from];
      const existing = map[to];

      if (existing === undefined) {
        map[to] = incoming;
      } else if (typeof incoming === "number" && typeof existing === "number") {
        map[to] = Math.min(incoming, existing); // weaker wins
      }
      // If the shapes disagree, keep what was already there and drop the orphan.

      delete map[from];
      store(key, map);
      changed = true;
    }

    done[tag] = true;
  }

  if (changed || Object.keys(done).length !== Object.keys(applied()).length) {
    store(DONE_KEY, done);
  }
  void STORE_PREFIX;
}
