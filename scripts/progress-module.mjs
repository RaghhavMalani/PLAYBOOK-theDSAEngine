import { writeFileSync } from "node:fs";

export const SUPPORTED_PROGRESS_SCHEMA = "1.0.0";

/** Validate the cross-repo boundary before allowing it into Playbook's data layer. */
export function validateProgressContract(contract) {
  const fail = (message) => {
    throw new Error(`[import-progress] ${message}`);
  };
  if (contract?.schemaVersion !== SUPPORTED_PROGRESS_SCHEMA) {
    fail(
      `unsupported schemaVersion ${JSON.stringify(contract?.schemaVersion)}; ` +
        `expected ${SUPPORTED_PROGRESS_SCHEMA}`,
    );
  }
  if (Number.isNaN(Date.parse(contract.generatedAt))) fail("generatedAt must be an ISO timestamp");
  if (!/^[a-f0-9]{40}$/.test(contract.sourceCommit ?? "")) {
    fail("sourceCommit must be a full git SHA");
  }
  if (typeof contract.repository !== "string" || !contract.repository.startsWith("https://github.com/")) {
    fail("repository must be a GitHub URL");
  }
  if (!Array.isArray(contract.problems)) fail("problems must be an array");

  const numbers = new Set();
  for (const problem of contract.problems) {
    if (!Number.isInteger(problem.number) || problem.number <= 0) fail("invalid problem number");
    if (numbers.has(problem.number)) fail(`duplicate problem number ${problem.number}`);
    numbers.add(problem.number);
    if (!/^\d{4}-[a-z0-9-]+$/.test(problem.directory ?? "")) {
      fail(`invalid directory ${JSON.stringify(problem.directory)}`);
    }
    if (!["", "easy", "medium", "hard"].includes(problem.difficulty)) {
      fail(`${problem.directory} has invalid difficulty ${JSON.stringify(problem.difficulty)}`);
    }
    if (!Array.isArray(problem.languages) || problem.languages.length === 0) {
      fail(`${problem.directory} has no solution languages`);
    }
    if (typeof problem.artifacts?.notes?.available !== "boolean") {
      fail(`${problem.directory} has invalid notes availability`);
    }
    if (typeof problem.artifacts?.trace?.available !== "boolean") {
      fail(`${problem.directory} has invalid trace availability`);
    }
    const hashes = Object.entries(problem.solutionHashes ?? {});
    if (!hashes.length || hashes.some(([, hash]) => !/^[a-f0-9]{64}$/.test(hash))) {
      fail(`${problem.directory} has invalid solution hashes`);
    }
    if (Number.isNaN(Date.parse(problem.firstSolvedAt))) {
      fail(`${problem.directory} has invalid firstSolvedAt`);
    }
    if (Number.isNaN(Date.parse(problem.lastSolvedAt))) {
      fail(`${problem.directory} has invalid lastSolvedAt`);
    }
    if (!Array.isArray(problem.reSolveHistory)) {
      fail(`${problem.directory} has invalid reSolveHistory`);
    }
    for (const event of problem.reSolveHistory) {
      if (
        !/^[a-f0-9]{40}$/.test(event.sourceCommit ?? "") ||
        Number.isNaN(Date.parse(event.solvedAt)) ||
        !Array.isArray(event.languages) ||
        event.languages.length === 0
      ) {
        fail(`${problem.directory} has an invalid re-solve event`);
      }
    }
  }
  return contract;
}

const literal = (value) => JSON.stringify(value);

export function renderProgressModule(untrustedContract) {
  const contract = validateProgressContract(untrustedContract);
  const entries = contract.problems.map((problem) => ({
    num: problem.number,
    dir: problem.directory,
    diff: problem.difficulty,
    label: problem.classification?.label ?? "",
    family: problem.classification?.family ?? "",
    langs: problem.languages,
    viz: problem.artifacts.trace.available,
    notes: problem.artifacts.notes.available,
    solutionHashes: problem.solutionHashes,
    firstSolvedAt: problem.firstSolvedAt,
    lastSolvedAt: problem.lastSolvedAt,
    reSolveHistory: problem.reSolveHistory,
  }));
  const counts = { easy: 0, medium: 0, hard: 0, withNotes: 0, withViz: 0 };
  for (const entry of entries) {
    if (entry.diff in counts) counts[entry.diff]++;
    if (entry.notes) counts.withNotes++;
    if (entry.viz) counts.withViz++;
  }

  return `/* GENERATED from leetcode-progress/progress.json — do not edit by hand.
 *
 * Contract ${contract.schemaVersion}; source commit ${contract.sourceCommit}.
 * ${entries.length} solved problems; ${counts.withNotes} carry notes and
 * ${counts.withViz} have a traced visualisation.
 *
 * Live updates arrive through repository_dispatch. npm run sync:progress imports the
 * sibling repository's committed contract for offline use.
 */

export interface ReSolveEvent {
  sourceCommit: string;
  solvedAt: string;
  languages: readonly string[];
}

export interface SolvedEntry {
  /** LeetCode problem number */
  num: number;
  /** directory name in the progress repo, e.g. "0042-trapping-rain-water" */
  dir: string;
  /** "easy" | "medium" | "hard", or "" if NOTES.md had no header */
  diff: string;
  /** the author's own fine-grained pattern label */
  label: string;
  /** the raw repository's pattern family */
  family: string;
  /** languages with a current solution */
  langs: readonly string[];
  /** a step-by-step traced visualisation exists */
  viz: boolean;
  /** a written NOTES.md exists */
  notes: boolean;
  /** SHA-256 by repository-relative solution path */
  solutionHashes: Readonly<Record<string, string>>;
  firstSolvedAt: string;
  lastSolvedAt: string;
  /** solution-touching commits after the initial solve */
  reSolveHistory: readonly ReSolveEvent[];
}

export const PROGRESS_REPO = ${literal(contract.repository)};

export const PROGRESS_SYNC = ${literal({
    schemaVersion: contract.schemaVersion,
    generatedAt: contract.generatedAt,
    sourceCommit: contract.sourceCommit,
  })} as const;

/** Counted from contract problems, not taken on trust from stats.json. */
export const PROGRESS_COUNTS = ${literal({ total: entries.length, ...counts })} as const;

/** LeetHub's own tally, retained only to make source drift visible. */
export const PROGRESS_DECLARED = ${literal(contract.declaredStats ?? null)} as const;

export const SOLVED: readonly SolvedEntry[] = [
${entries.map((entry) => `  ${JSON.stringify(entry)},`).join("\n")}
];
`;
}

export function writeProgressModule(contract, outputPath) {
  writeFileSync(outputPath, renderProgressModule(contract), "utf8");
}
