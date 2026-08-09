#!/usr/bin/env python3
"""Re-run the element-types measurements and prove the data file is not lying.

`src/data/element-types.ts` claims that every `measured` field is literal stdout
from a real program — every sizeof, every byte count, every timing verdict. That claim decays the moment someone edits a
string by hand, and a wrong "actual output" block is worse than no output block
at all — it teaches the wrong fact with the authority of a transcript.

So the claim is executable. This script compiles and runs the three programs beside
it, captures their stdout, rebuilds what each level's measured field should be, and
diffs that against what the TypeScript actually contains. Any drift fails loudly
and says which level.

Byte counts are the most rot-prone thing on the page: they are correct for one
compiler on one machine, and the moment someone hand-edits one it becomes a
confident lie. This is the guard.

    npm run verify:elements

Go through npm rather than calling this directly: scripts/run-python.mjs finds a
real Python 3 on any OS, which matters on Windows where `python3` is usually a
Microsoft Store placeholder rather than an interpreter.

Also requires g++ (C++17) and a JDK 11+ with the single-file source launcher,
because it re-RUNS the programs rather than trusting a stored transcript. If any
of the three is missing it says which, and how to install it, instead of failing
somewhere deep in a subprocess.
"""
from __future__ import annotations

import json
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
DATA = ROOT / "src" / "data" / "element-types.ts"

# label -> the prefix the data file uses for that language's captured lines
LABELS = {"cpp": "[C++] ", "java": "[Java]", "py": "[Py]  "}

PROGRAMS = {
    # key      (program, how to run it)
    "cpp": ("Elements.cpp", "cpp"),
    "java": ("Elements.java", "java"),
    "py": ("elements.py", "py"),
}


def have(tool: str) -> bool:
    return shutil.which(tool) is not None


def run_cpp(src: pathlib.Path, workdir: pathlib.Path) -> str:
    exe = workdir / (src.stem + ".bin")
    subprocess.run(
        ["g++", "-std=c++17", "-O2", "-o", str(exe), str(src)],
        check=True, capture_output=True, text=True,
    )
    return subprocess.run([str(exe)], check=True, capture_output=True, text=True).stdout


def run_java(src: pathlib.Path, workdir: pathlib.Path) -> str:
    # JDK 11+ single-file source launcher: compiles in memory, no javac needed.
    return subprocess.run(
        ["java", str(src)], check=True, capture_output=True, text=True, cwd=workdir
    ).stdout


def run_py(src: pathlib.Path, workdir: pathlib.Path) -> str:
    return subprocess.run(
        [sys.executable, str(src)], check=True, capture_output=True, text=True
    ).stdout


RUNNERS = {"cpp": run_cpp, "java": run_java, "py": run_py}


def capture(prefix: str, text: str) -> dict[int, list[str]]:
    """Group output lines by the level number they are tagged with."""
    out: dict[int, list[str]] = {}
    for line in text.splitlines():
        m = re.match(rf"^{re.escape(prefix)}(\d\d)", line)
        if m:
            out.setdefault(int(m.group(1)), []).append(line)
    return out


def expected_block(captured: dict, n: int) -> str:
    """Rebuild a level's measured field exactly as the data file should hold it."""
    lines = []
    for lang in ("cpp", "java", "py"):
        for line in captured[lang].get(n, []):
            lines.append(f"{LABELS[lang]} {line}")
    return "\n".join(lines)


def data_blocks() -> dict[int, str]:
    """Pull every measured string out of the TypeScript, by level."""
    src = DATA.read_text(encoding="utf-8")
    blocks: dict[int, str] = {}
    starts = [(int(m.group(1)), m.start()) for m in re.finditer(r"^    n: (\d+),$", src, re.M)]
    for idx, (n, pos) in enumerate(starts):
        end = starts[idx + 1][1] if idx + 1 < len(starts) else len(src)
        m = re.search(r'^    measured: ("(?:[^"\\]|\\.)*"),$', src[pos:end], re.M)
        if not m:
            raise SystemExit(f"level {n}: could not locate the measured field in the data file")
        blocks[n] = json.loads(m.group(1))
    return blocks


def main() -> int:
    """Compile, run, and diff. Reports a missing toolchain clearly rather than
    failing somewhere deep in a subprocess call."""
    needed = {
        "g++": "a C++17 compiler — MSYS2/MinGW-w64 or `winget install BrechtSanders.WinLibs.POSIX.UCRT`",
        "java": "a JDK 11+ — `winget install Microsoft.OpenJDK.21`",
    }
    missing = [t for t in needed if not have(t)]
    if missing:
        print("", file=sys.stderr)
        print("  Cannot verify: missing toolchain.", file=sys.stderr)
        print("", file=sys.stderr)
        for t in missing:
            print(f"    {t:<6} not on PATH — {needed[t]}", file=sys.stderr)
        print("", file=sys.stderr)
        print("  This script re-RUNS the programs and diffs their output against the", file=sys.stderr)
        print("  data file, so it needs the compilers, not just Python. `npm run", file=sys.stderr)
        print("  typecheck` still checks the code without them.", file=sys.stderr)
        print("", file=sys.stderr)
        return 2

    captured: dict[str, dict[int, list[str]]] = {}
    with tempfile.TemporaryDirectory() as td:
        work = pathlib.Path(td)
        for lang, (prog, kind) in PROGRAMS.items():
            captured[lang] = capture("E", RUNNERS[kind](HERE / prog, work))
            print(f"ran {prog}")

    blocks = data_blocks()
    if len(blocks) != 12:
        print(f"expected 12 levels in the data file, found {len(blocks)}", file=sys.stderr)
        return 1

    failures, lines = [], 0
    for n in range(1, 13):
        want = expected_block(captured, n)
        got = blocks[n]
        lines += len(want.splitlines())
        if not want:
            failures.append(f"level {n}: no program output tagged for this level")
        elif want != got:
            failures.append(
                f"level {n}: data file does not match the program.\n"
                f"  expected:\n    " + "\n    ".join(want.splitlines()) + "\n"
                f"  found:\n    " + "\n    ".join(got.splitlines())
            )

    print(f"\nchecked 12 levels, {lines} measured stdout lines")
    if failures:
        print(f"\nFAILED ({len(failures)}):\n" + "\n".join(failures), file=sys.stderr)
        return 1
    print("every measured field in element-types.ts is literal stdout. Claim holds.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
