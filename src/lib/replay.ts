import type { Pattern, TopicId } from "../types";
import type { PersonalReplay, PersonalReplayFrame } from "../data/replays.generated";

export interface ReplayBridge {
  personal: PersonalReplay;
  pattern: Pattern | null;
  walk: NonNullable<Pattern["walk"]>[number] | null;
  exact: boolean;
}

export interface BugMutation {
  code: string;
  line: number;
  before: string;
  after: string;
  label: string;
}

const BUG_RULES: readonly {
  find: RegExp;
  replace: string;
  label: string;
}[] = [
  { find: /\bnot in\b/, replace: "in", label: "membership condition inverted" },
  { find: /\bif\s+(.+?)\s+in\s+/, replace: "if $1 not in ", label: "membership condition inverted" },
  { find: /<=/, replace: "<", label: "inclusive boundary made exclusive" },
  { find: />=/, replace: ">", label: "inclusive boundary made exclusive" },
  { find: /==/, replace: "!=", label: "equality condition inverted" },
  { find: /\+\s*1\b/, replace: "+ 0", label: "forward progress removed" },
  { find: /-\s*1\b/, replace: "- 0", label: "boundary update removed" },
  { find: /\.append\(/, replace: ".insert(0, ", label: "append order reversed" },
  { find: /\bmin\(/, replace: "max(", label: "extremum direction inverted" },
  { find: /\bmax\(/, replace: "min(", label: "extremum direction inverted" },
];

export function buildReplayBridges(
  replays: readonly PersonalReplay[],
  patterns: readonly Pattern[],
  familyToTopics: Readonly<Record<string, readonly TopicId[]>>,
  familyByProblem: ReadonlyMap<number, string> = new Map(),
): ReplayBridge[] {
  return replays.map((personal) => {
    const exactPatterns = patterns.filter((pattern) =>
      (pattern.lc ?? []).some((problem) => problem[0] === personal.num),
    );
    const exactWithWalk = exactPatterns.find((pattern) => pattern.walk?.length);
    if (exactWithWalk) {
      return {
        personal,
        pattern: exactWithWalk,
        walk: exactWithWalk.walk?.[0] ?? null,
        exact: true,
      };
    }

    const family = familyByProblem.get(personal.num) ?? personal.pattern;
    const topics = new Set<TopicId>([
      ...(exactPatterns[0] ? [exactPatterns[0].t] : []),
      ...(familyToTopics[family] ?? familyToTopics[personal.pattern.split(" · ")[0]] ?? []),
    ]);
    if (!topics.size) {
      for (const [family, mapped] of Object.entries(familyToTopics)) {
        if (personal.pattern.toLowerCase().includes(family.toLowerCase().split(/[,&]/)[0].trim())) {
          mapped.forEach((topic) => topics.add(topic));
        }
      }
    }
    const analogue = patterns.find((pattern) => topics.has(pattern.t) && pattern.walk?.length) ?? null;
    return {
      personal,
      pattern: analogue,
      walk: analogue?.walk?.[0] ?? null,
      exact: false,
    };
  });
}

/** Whether the saved LeetCode method can be invoked without constructing a judge-only node type. */
export function canRunLive(replay: PersonalReplay): boolean {
  if (replay.lang !== "py" || !/^[A-Za-z_]\w*$/.test(replay.runName)) return false;
  if (/\b(?:ListNode|TreeNode|Node)\b/.test(replay.code)) return false;
  if (!replay.input || /\b(null|then|operations|queries|node|tree|board example|permutation of|value range)\b/i.test(replay.input)) {
    return false;
  }
  return extractInputNames(replay.input).length > 0;
}

export function extractInputNames(input: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  const re = /(?:^|,\s*)([A-Za-z_]\w*)\s*=/g;
  for (const match of input.matchAll(re)) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      names.push(match[1]);
    }
  }
  return names;
}

export function normalizeRunnableInput(input: string): string {
  return input.replace(/,\s*(?=[A-Za-z_]\w*\s*=)/g, "\n");
}

/** Wrap a LeetCode class method in a normal executable program for the CPython tracer. */
export function buildRunnableSource(replay: PersonalReplay, input: string): string | null {
  if (!canRunLive(replay)) return null;
  const names = extractInputNames(input);
  if (!names.length) return null;
  return [
    "from typing import *",
    "from collections import Counter, defaultdict, deque",
    "from functools import lru_cache",
    "from math import gcd, inf",
    "import heapq",
    "",
    replay.code,
    "",
    normalizeRunnableInput(input),
    `_lab_result = Solution().${replay.runName}(${names.join(", ")})`,
    "print(_lab_result)",
  ].join("\n");
}

/** Deterministically perturb one literal while preserving the input's overall shape. */
export function mutateLiteralInput(input: string, seed = 0): string {
  const hits = [...input.matchAll(/-?\d+/g)];
  if (!hits.length) {
    const stringHit = input.match(/(["'])([^"']+)\1/);
    if (!stringHit || stringHit.index == null) return input;
    const body = stringHit[2];
    const next = body.length > 1 ? body.slice(1) + body[0] : body + body;
    return input.slice(0, stringHit.index) + stringHit[1] + next + stringHit[1] + input.slice(stringHit.index + stringHit[0].length);
  }
  const hit = hits[Math.abs(seed) % hits.length];
  const start = hit.index ?? 0;
  const value = Number(hit[0]);
  const delta = value === 0 ? 1 : (seed % 2 === 0 ? 1 : -1) * Math.max(1, Math.floor(Math.abs(value) / 2));
  const replacement = String(value + delta);
  return input.slice(0, start) + replacement + input.slice(start + hit[0].length);
}

export function introduceBug(code: string, seed = 0): BugMutation | null {
  const lines = code.split("\n");
  const candidates: { line: number; rule: (typeof BUG_RULES)[number] }[] = [];
  lines.forEach((line, index) => {
    if (line.trim().startsWith("#")) return;
    BUG_RULES.forEach((rule) => {
      rule.find.lastIndex = 0;
      if (rule.find.test(line)) candidates.push({ line: index, rule });
    });
  });
  if (!candidates.length) return null;
  const chosen = candidates[Math.abs(seed) % candidates.length];
  const before = lines[chosen.line];
  chosen.rule.find.lastIndex = 0;
  const after = before.replace(chosen.rule.find, chosen.rule.replace);
  lines[chosen.line] = after;
  return {
    code: lines.join("\n"),
    line: chosen.line + 1,
    before,
    after,
    label: chosen.rule.label,
  };
}

function plain(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
}

export function predictionOptions(
  current: PersonalReplayFrame,
  next: PersonalReplayFrame,
): readonly string[] {
  const answer = next.vars.length ? next.vars.map(plain).join(" · ") : plain(next.msg);
  const unchanged = current.vars.length ? current.vars.map(plain).join(" · ") : "No tracked state changes";
  const wrongLine = `Execution jumps to line ${Math.max(1, next.line + (next.line === current.line ? 2 : -1))}`;
  return [answer, unchanged === answer ? "The current state is cleared" : unchanged, wrongLine];
}

export function countCurriculumTraces(patterns: readonly Pattern[]): number {
  return patterns.reduce((total, pattern) => total + (pattern.walk?.length ?? 0), 0);
}
