/**
 * The shape shared by the memory page's two deep-dive modules.
 *
 * `element-types.ts` (what goes inside a container) and `memory-deep.ts` (iterator
 * invalidation, the cache hierarchy, stack vs heap, hashing) are the same kind of
 * artefact: a graded list of topics, each with a mechanism explanation, a
 * per-language reference table, literal captured stdout, and the traps.
 *
 * The types lived inside element-types.ts until the second module needed them.
 * Two copies of a type definition is how two modules drift apart, and it would
 * also have forced a second copy of the ~160-line renderer, so they moved here and
 * both modules and one renderer now share them.
 */

export type DeepTier = "easy" | "medium" | "hard" | "extreme";
export type LangKey = "py" | "cpp" | "java";

/**
 * One row of a per-language reference table.
 *
 * The field names come from the element-types module, where a row really is a
 * declaration and a byte count. In memory-deep the same three columns carry a
 * rule, its guarantee, and the trap — so the renderer takes the column headings
 * as configuration rather than hardcoding them.
 */
export interface DeclRow {
  /** the spelling, the API, or the rule */
  decl: string;
  /** what it costs, or what it guarantees */
  bytes: string;
  /** the thing that surprises people */
  note: string;
}

export interface DeepLevel {
  n: number;
  /** what this topic is */
  title: string;
  tier: DeepTier;
  /** the one-line version */
  what: string;
  /** why it earns a place on the ladder */
  why: string;
  /** the mechanism — what the machine is actually doing */
  layout: string;
  py: string;
  cpp: string;
  java: string;
  /** per-language reference table */
  decl: Record<LangKey, DeclRow[]>;
  /** literal stdout from the three measurement programs */
  measured: string;
  /** the difference that costs memory, time or correctness */
  differs: string;
  /** the mistake this topic exists to prevent */
  trap?: string;
  /** where it shows up in real problems */
  see?: string[];
}

/** Tiers in ladder order, for the level filter. */
export const DEEP_TIERS = ["easy", "medium", "hard", "extreme"] as const;

/** The runtimes every number on this page was measured on. */
export const DEEP_RUNTIMES: { key: LangKey; label: string; runtime: string }[] = [
  { key: "py", label: "python", runtime: "CPython 3.10.12" },
  { key: "cpp", label: "c++", runtime: "g++ 11.4.0, -std=c++17" },
  { key: "java", label: "java", runtime: "OpenJDK 11.0.31" },
];
