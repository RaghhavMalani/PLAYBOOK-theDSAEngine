/** Shared domain types. The data layer is strictly typed on purpose: this is the
 *  layer where drift between a template and the thing it claims to be becomes a
 *  lie the reader can't detect. Compile errors are cheaper than wrong teaching. */

export type TopicId =
  | "hash" | "str" | "arr" | "bs" | "ll" | "stk"
  | "tree" | "heap" | "graph" | "dp" | "bt" | "greedy" | "bit"
  /* Added after auditing which families the solved-problem repo actually falls into.
   * "bit" was carrying number theory, and intervals were split across arr and hash;
   * both now have a home, which also lets the coverage bridge map 1:1. */
  | "math" | "intv" | "design" | "sort" | "grid" | "trie" | "dsu"
  | "rec" | "queue" | "ood" | "comb";

export type Lang = "py" | "cpp" | "java";

/** [problem number, leetcode slug, display title] */
export type Problem = readonly [number, string, string];

export interface Pattern {
  /** topic bucket */
  t: TopicId;
  /** display name, also the localStorage key for confidence + Leitner box */
  n: string;
  /** time complexity, e.g. "O(n log n)" */
  tc: string;
  /** space complexity, e.g. "O(1)" */
  sc: string;
  /** the recognition cue — may contain inline HTML */
  sig: string;
  /** why the technique is correct */
  why: string;
  /** the mistake that costs the round */
  trap: string;
  /** a sentence worth saying out loud in an interview */
  say: string;
  py: string;
  cpp: string;
  java: string;
  lc: readonly Problem[];

  /* ---------- hard-round layer ---------- */

  /** "core" = the pattern itself. "hard" = the escalation you get in a Google/Meta
   *  hard round or a Goldman long-format OA. */
  tier?: "core" | "hard";

  /** How to *derive* this at a whiteboard from the brute force. You cannot
   *  memorise your way through a novel hard problem; you can derive your way
   *  through one. */
  derive?: string;

  /** Why it is correct. Hard rounds ask you to justify, not just implement —
   *  the invariant, the exchange argument, or the amortisation argument. */
  proof?: string;

  /** The ladder interviewers actually walk once you solve the base problem.
   *  Each rung is a question and the answer they are looking for. */
  followups?: readonly { q: string; a: string }[];

  /** The inputs that break a correct-looking implementation. `input` is the shape,
   *  `effect` is what actually goes wrong, `fix` is the one line that handles it. */
  edges?: readonly { input: string; effect: string; fix: string }[];

  /** Worked traces, ordered simple -> complicated. Each step shows the state after
   *  it, so the table reads as a dry run you can check your own code against. */
  walk?: readonly {
    title: string;
    /** e.g. 'a = [2, 7, 11, 15], target = 18' */
    input: string;
    /** column headers for the state table, e.g. ['lo','hi','sum','action'] */
    cols: readonly string[];
    rows: readonly (readonly string[])[];
    /** what the trace was meant to teach */
    lesson: string;
  }[];
}

/* ---------- topic primers ---------- */

export interface TopicPrimer {
  id: TopicId;
  /** what it is, in one sentence */
  oneLine: string;
  /** the mental model — how to think about it, not how to code it */
  model: string;
  /** the property that must stay true; break it and the technique is invalid */
  invariant: string;
  /** [operation, complexity, note] */
  ops: readonly (readonly [string, string, string])[];
  /** when to reach for this topic */
  reach: readonly string[];
  /** when NOT to, and what to use instead */
  avoid: readonly string[];
  /** topic-level edge cases, above any individual pattern */
  edges: readonly { input: string; effect: string; fix: string }[];
  /** inline SVG. Must use var(--…) tokens so it themes with everything else. */
  svg: string;
  /** one sentence on what the diagram is showing */
  caption: string;
}

export type Topic = readonly [TopicId, string];

/* ---------- company OA intelligence ---------- */

export type Tier = "product" | "fintech" | "service";

export interface CompanyOA {
  id: string;
  name: string;
  tier: Tier;
  /** assessment host, e.g. "CodeSignal" */
  platform: string;
  /** human description of the format */
  format: string;
  durationMin: number | null;
  questions: string;
  /** topic ids weighted 0-5 by how heavily they show up */
  weights: Partial<Record<TopicId, number>>;
  /** archetypes actually reported, not invented */
  archetypes: string[];
  /** what people say decides pass/fail */
  edge: string;
  /** extra sections beyond DSA (SQL, aptitude, behavioural…) */
  extras: string[];
  sources: { label: string; url: string }[];
  /** ISO date this entry was last researched */
  checked: string;
}

/* ---------- live research endpoint ---------- */

export interface ResearchHit {
  title: string;
  url: string;
  snippet: string;
  /** hostname, for source-quality display */
  host: string;
}

export interface ResearchResponse {
  company: string;
  query: string;
  provider: string;
  hits: ResearchHit[];
  /** topic id -> mentions across the hits */
  topicMentions: Partial<Record<TopicId, number>>;
  fetchedAt: string;
  note?: string;
}

/* ---------- non-DSA OA essentials ---------- */

export type OAEssentialId = "quant" | "reasoning" | "cs";

export interface OACheckpoint {
  prompt: string;
  choices: readonly string[];
  /** Zero-based index into choices. */
  answer: number;
  explanation: string;
}

export interface OALesson {
  id: string;
  title: string;
  minutes: number;
  goal: string;
  method: readonly string[];
  trap: string;
  worked: {
    prompt: string;
    steps: readonly string[];
    answer: string;
  };
  checkpoint: OACheckpoint;
}

export interface OAEssentialSection {
  id: OAEssentialId;
  label: string;
  eyebrow: string;
  description: string;
  /** Case-insensitive signals matched against CompanyOA.extras and archetypes. */
  companyKeywords: readonly string[];
  lessons: readonly OALesson[];
}
