#!/usr/bin/env node

/**
 * Offline fallback for the live progress.json bridge.
 *
 * This script only reads the separate leetcode-progress clone. Its repository-owned
 * generator scans local solutions and git history in memory; only Playbook's committed
 * src/data/progress.generated.ts is written.
 *
 *   node scripts/sync-progress.mjs [path-to-leetcode-progress]
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeProgressModule } from "./progress-module.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../src/data/progress.generated.ts");
const SRC = resolve(process.argv[2] ?? join(HERE, "../../leetcode-progress"));

if (!existsSync(SRC) || !statSync(SRC).isDirectory()) {
  console.log(`[sync-progress] ${SRC} not found — keeping the committed data as is.`);
  process.exit(0);
}

const generatorPath = join(SRC, "scripts", "generate-progress.mjs");
if (!existsSync(generatorPath)) {
  console.error(
    `[sync-progress] ${generatorPath} is missing. Update the sibling leetcode-progress clone ` +
      `or import its committed progress.json with scripts/import-progress.mjs.`,
  );
  process.exit(1);
}

let contract;
let sourceMode = "offline scan";
try {
  contract = JSON.parse(
    execFileSync(process.execPath, [generatorPath, "--stdout"], {
      cwd: SRC,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
} catch (error) {
  // A locked-down shell can deny git history reads (for example, Git's safe.directory
  // ownership guard). The committed contract is still a complete offline snapshot.
  const committedContract = join(SRC, "progress.json");
  if (!existsSync(committedContract)) throw error;
  console.warn(
    `[sync-progress] local rescan unavailable; importing the committed ${committedContract} instead.`,
  );
  contract = JSON.parse(readFileSync(committedContract, "utf8"));
  sourceMode = "committed offline contract";
}
writeProgressModule(contract, OUT);
execFileSync(process.execPath, [join(HERE, "generate-replays.mjs"), SRC], {
  cwd: resolve(HERE, ".."),
  stdio: "inherit",
});
console.log(
  `[sync-progress] ${sourceMode}: ${contract.problems.length} problems at ` +
    `${contract.sourceCommit.slice(0, 7)} → src/data/progress.generated.ts`,
);
