#!/usr/bin/env node
/**
 * Run a Python script with whichever interpreter this machine actually has.
 *
 * The npm scripts used to hardcode `python3`, which works on macOS and Linux and
 * fails on Windows — where the launcher is `py`, the executable is `python`, and
 * `python3` resolves to a Microsoft Store *stub* that prints
 *
 *     Python was not found; run without arguments to install from the Microsoft Store
 *
 * and exits non-zero. That stub is the reason a plain `which python3` check is not
 * enough: the name resolves, the program exists, and it is not Python. So each
 * candidate is probed by actually asking it for its version and requiring a real
 * answer back.
 *
 *     node scripts/run-python.mjs scripts/element-types-verify/verify.py [args...]
 *
 * Exit code is the script's own, so npm still fails the build when a check fails.
 */
import { spawnSync } from "node:child_process";

/** Ordered by how likely each is to be the real thing on the host we are on. */
const CANDIDATES = [
  ["python3", []],
  ["python", []],
  ["py", ["-3"]],       // the Windows launcher, which is usually the right answer
];

/** A candidate counts only if it runs and reports Python 3. This is what rejects
 *  the Store stub, a Python 2 left on PATH, and anything else wearing the name. */
function probe(cmd, prefix) {
  try {
    const r = spawnSync(cmd, [...prefix, "-c", "import sys; print(sys.version_info[0])"], {
      encoding: "utf8",
      windowsHide: true,
    });
    return r.status === 0 && r.stdout.trim() === "3";
  } catch {
    return false;
  }
}

function findPython() {
  for (const [cmd, prefix] of CANDIDATES) {
    if (probe(cmd, prefix)) return [cmd, prefix];
  }
  return null;
}

const [script, ...rest] = process.argv.slice(2);
if (!script) {
  console.error("usage: node scripts/run-python.mjs <script.py> [args...]");
  process.exit(2);
}

const found = findPython();
if (!found) {
  console.error(
    [
      "",
      "  No Python 3 interpreter found.",
      "",
      `  Tried: ${CANDIDATES.map(([c, p]) => [c, ...p].join(" ")).join(", ")}`,
      "",
      "  On Windows, `python3` is often a Microsoft Store placeholder rather than a",
      "  real interpreter, which is why this check asks each candidate for its version",
      "  instead of trusting the name.",
      "",
      "  Install Python 3 from python.org and tick “Add python.exe to PATH”, or run",
      "  `winget install Python.Python.3.12`. Then open a NEW terminal — PATH changes",
      "  do not reach a shell that is already running.",
      "",
      "  These verify scripts also need g++ and a JDK 11+ to run the C++ and Java",
      "  programs. Without all three, `npm run typecheck` still covers the code; the",
      "  verify scripts are what re-prove the captured output.",
      "",
    ].join("\n"),
  );
  process.exit(127);
}

const [cmd, prefix] = found;
const run = spawnSync(cmd, [...prefix, script, ...rest], {
  stdio: "inherit",
  windowsHide: true,
});
process.exit(run.status === null ? 1 : run.status);
