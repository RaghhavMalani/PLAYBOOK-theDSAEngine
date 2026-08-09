#!/usr/bin/env python3
"""Re-run the language ladder and prove the data file is not lying.

`src/data/lang-ladder.ts` claims that every `output` and `drill.out` field is
literal stdout from a real program. That claim decays the moment someone edits a
string by hand, and a wrong "actual output" block is worse than no output block at
all — it teaches the wrong fact with the authority of a transcript.

So the claim is executable. This compiles and runs the six programs beside it,
captures their stdout, rebuilds what each rung's fields should be, and diffs.

    npm run verify:ladder

Go through npm rather than calling this directly: scripts/run-python.mjs finds a
real Python 3 on any OS, which matters on Windows where `python3` is usually a
Microsoft Store placeholder rather than an interpreter.

Also needs g++ (C++17) and a JDK 11+, because it re-RUNS the programs rather than
trusting a stored transcript. Missing tools are named with the command that
installs them; a compiler error is printed in full rather than swallowed.

A toolchain that differs from the one the numbers were captured on downgrades any
differences to an informational report — see scripts/verify_common.py for why.
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
DATA = HERE.parent.parent / "src" / "data" / "lang-ladder.ts"

PROGRAMS = {
    # key    (rung program,  drill program, runner)
    "cpp": ("Ladder.cpp", "Drills.cpp", "cpp"),
    "java": ("Ladder.java", "Drills.java", "java"),
    "py": ("ladder.py", "drills.py", "py"),
}


def data_blocks() -> dict[int, dict[str, str]]:
    """Pull every output / drill.out string out of the TypeScript, by rung."""
    src = DATA.read_text(encoding="utf-8")
    blocks: dict[int, dict[str, str]] = {}
    starts = [(int(m.group(1)), m.start()) for m in re.finditer(r"^    n: (\d+),$", src, re.M)]
    for idx, (n, pos) in enumerate(starts):
        end = starts[idx + 1][1] if idx + 1 < len(starts) else len(src)
        chunk = src[pos:end]
        out = re.search(r'^    output: ("(?:[^"\\]|\\.)*"),$', chunk, re.M)
        dout = re.search(r'^      out: ("(?:[^"\\]|\\.)*"),$', chunk, re.M)
        if not out or not dout:
            raise SystemExit(f"rung {n}: could not locate output / drill.out in the data file")
        blocks[n] = {"rung": json.loads(out.group(1)), "drill": json.loads(dout.group(1))}
    return blocks


def main() -> int:
    bad = check_tools()
    if bad:
        return bad

    rung: dict[str, dict[int, list[str]]] = {}
    drill: dict[str, dict[int, list[str]]] = {}
    with tempfile.TemporaryDirectory() as td:
        work = pathlib.Path(td)
        for lang, (rung_src, drill_src, kind) in PROGRAMS.items():
            run = RUNNERS[kind]
            rung[lang] = capture("R", run(HERE / rung_src, work))
            drill[lang] = capture("D", run(HERE / drill_src, work))
            print(f"ran {rung_src} and {drill_src}")

    blocks = data_blocks()
    if len(blocks) != 40:
        print(f"expected 40 rungs in the data file, found {len(blocks)}", file=sys.stderr)
        return 1

    failures: list[str] = []
    lines = 0
    for n in range(1, 41):
        for key, per_lang in (("rung", rung), ("drill", drill)):
            want = block(per_lang, n)
            got = blocks[n][key]
            lines += len(want.splitlines())
            if not want:
                failures.append(f"rung {n} ({key}): no program output tagged for this rung")
            elif want != got:
                failures.append(
                    f"rung {n} ({key}): stored text differs from this run\n"
                    "  expected:\n    " + "\n    ".join(want.splitlines()) + "\n"
                    "  found:\n    " + "\n    ".join(got.splitlines())
                )

    return report(failures, live_toolchain(), "rungs", 40, lines)


if __name__ == "__main__":
    raise SystemExit(main())
