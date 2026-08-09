#!/usr/bin/env python3
"""Re-run the element-types measurements and prove the data file is not lying.

`src/data/element-types.ts` claims that every `measured` field is literal stdout
from a real program — every sizeof, every byte count, every timing verdict.

Byte counts are the most rot-prone thing on the page: they are correct for one
compiler on one machine, and the moment someone hand-edits one it becomes a
confident lie with the authority of a transcript. This is the guard.

    npm run verify:elements

Go through npm rather than calling this directly: scripts/run-python.mjs finds a
real Python 3 on any OS, which matters on Windows where `python3` is usually a
Microsoft Store placeholder rather than an interpreter.

Also needs g++ (C++17) and a JDK 11+, because it re-RUNS the programs rather than
trusting a stored transcript. Missing tools are named with the command that
installs them; a compiler error is printed in full rather than swallowed.

This script is the one most likely to report differences on someone else's
machine, and that is correct behaviour rather than a bug: CPython changed instance
layout in 3.11, and a different libstdc++ may choose a different vector growth
constant. A toolchain that differs from the reference downgrades differences to an
informational report — see scripts/verify_common.py.
"""
from __future__ import annotations

import json
import pathlib
import re
import sys
import tempfile

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from verify_common import (  # noqa: E402
    RUNNERS, block, capture, check_tools, live_toolchain, report,
)

HERE = pathlib.Path(__file__).resolve().parent
DATA = HERE.parent.parent / "src" / "data" / "element-types.ts"

PROGRAMS = {
    # key    (program, runner)
    "cpp": ("Elements.cpp", "cpp"),
    "java": ("Elements.java", "java"),
    "py": ("elements.py", "py"),
}


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
    bad = check_tools()
    if bad:
        return bad

    per_lang: dict[str, dict[int, list[str]]] = {}
    with tempfile.TemporaryDirectory() as td:
        work = pathlib.Path(td)
        for lang, (prog, kind) in PROGRAMS.items():
            per_lang[lang] = capture("E", RUNNERS[kind](HERE / prog, work))
            print(f"ran {prog}")

    blocks = data_blocks()
    if len(blocks) != 12:
        print(f"expected 12 levels in the data file, found {len(blocks)}", file=sys.stderr)
        return 1

    failures: list[str] = []
    lines = 0
    for n in range(1, 13):
        want = block(per_lang, n)
        got = blocks[n]
        lines += len(want.splitlines())
        if not want:
            failures.append(f"level {n}: no program output tagged for this level")
        elif want != got:
            failures.append(
                f"level {n}: stored text differs from this run\n"
                "  expected:\n    " + "\n    ".join(want.splitlines()) + "\n"
                "  found:\n    " + "\n    ".join(got.splitlines())
            )

    return report(failures, live_toolchain(), "levels", 12, lines)


if __name__ == "__main__":
    raise SystemExit(main())
