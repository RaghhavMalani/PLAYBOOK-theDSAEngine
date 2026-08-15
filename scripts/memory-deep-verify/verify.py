#!/usr/bin/env python3
"""Re-run the memory deep-dive measurements and prove the data file is not lying.

`src/data/memory-deep.ts` claims that every `measured` field is literal stdout
from a real program — every caught exception, every bucket count, every timing
verdict.

The timing claims here are recorded as COMPARISONS ("column-major slower than
row-major") rather than as milliseconds, precisely so that they reproduce on a
different machine. A millisecond figure would be true once and misleading
forever after. This script is what keeps that honest.

    npm run verify:deep

Go through npm rather than calling this directly: scripts/run-python.mjs finds a
real Python 3 on any OS, which matters on Windows where `python3` is usually a
Microsoft Store placeholder rather than an interpreter.

Also needs g++ (C++17) and a JDK 11+, because it re-RUNS the programs rather than
trusting a stored transcript. Missing tools are named with the command that
installs them; a compiler error is printed in full rather than swallowed.

Hash bucket counts and dict sizes are implementation details that move between
releases, so a different toolchain downgrades differences to an informational
report rather than a failure — see scripts/verify_common.py.
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
DATA = HERE.parent.parent / "src" / "data" / "memory-deep.ts"

PROGRAMS = {
    # key    (program, runner)
    "cpp": ("Deep.cpp", "cpp"),
    "java": ("Deep.java", "java"),
    "py": ("deep.py", "py"),
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
            raise SystemExit(f"topic {n}: could not locate the measured field in the data file")
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
            # Deep.* tag their lines D01..D04; the element-types programs use E01..E12.
            per_lang[lang] = capture("D", RUNNERS[kind](HERE / prog, work))
            print(f"ran {prog}")

    blocks = data_blocks()
    if len(blocks) != 4:
        print(f"expected 4 topics in the data file, found {len(blocks)}", file=sys.stderr)
        return 1

    failures: list[str] = []
    lines = 0
    for n in range(1, 5):
        want = block(per_lang, n)
        got = blocks[n]
        lines += len(want.splitlines())
        if not want:
            failures.append(f"topic {n}: no program output tagged for this topic")
        elif want != got:
            failures.append(
                f"topic {n}: stored text differs from this run\n"
                "  expected:\n    " + "\n    ".join(want.splitlines()) + "\n"
                "  found:\n    " + "\n    ".join(got.splitlines())
            )

    return report(failures, live_toolchain(), "topics", 4, lines)


if __name__ == "__main__":
    raise SystemExit(main())
