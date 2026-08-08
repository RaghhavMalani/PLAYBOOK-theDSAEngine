#!/usr/bin/env node

/** Import the live progress.json bridge into Playbook's committed build snapshot. */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeProgressModule } from "./progress-module.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const INPUT = resolve(process.argv[2] ?? join(HERE, "../../leetcode-progress/progress.json"));
const OUTPUT = resolve(HERE, "../src/data/progress.generated.ts");

const contract = JSON.parse(readFileSync(INPUT, "utf8"));
writeProgressModule(contract, OUTPUT);
console.log(
  `[import-progress] ${contract.problems.length} problems at ${contract.sourceCommit.slice(0, 7)} ` +
    `→ src/data/progress.generated.ts`,
);
