#!/usr/bin/env python3
"""Re-run the language ladder and prove the data file is not lying.

`src/data/lang-ladder.ts` claims that every `output` and `drill.out` field is
literal stdout from a real program. That claim decays the moment someone edits a
string by hand, and a wrong "actual output" block is worse than no output block
at all — it teaches the wrong fact with the authority of a transcript.

So the claim is executable. This script compiles and runs the six programs beside
it, captures their stdout, rebuilds what each rung's output field should be, and
diffs that against what the TypeScript actually contains. Any drift fails loudly
and says which rung.

    python3 scripts/lang-ladder-verify/verify.py

Requires g++ (C++17), a JDK 11+ with the single-file source launcher, and
python3. If a toolchain is missing the script says so and skips that language
rather than pretending it passed.
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
DATA = ROOT / "src" / "data" / "lang-ladder.ts"

# label -> the prefix the data file uses for that language's captured lines
LABELS = {"cpp": "[C++] ", "java": "[Java]", "py": "[Py]  "}

PROGRAMS = {
    # key            (rung program,   drill program,  how to run it)
    "cpp": ("Ladder.cpp", "Drills.cpp", "cpp"),
    "java": ("Ladder.java", "Drills.java", "java"),
    "py": ("ladder.py", "drills.py", "py"),
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
    """Group output lines by the rung number they are tagged with."""
    out: dict[int, list[str]] = {}
    for line in text.splitlines():
        m = re.match(rf"^{re.escape(prefix)}(\d\d)", line)
        if m:
            out.setdefault(int(m.group(1)), []).append(line)
    return out


def expected_block(captured: dict, n: int, kind: str) -> str:
    """Rebuild a rung's output field exactly as the data file should hold it."""
    lines = []
    for lang in ("cpp", "java", "py"):
        for line in captured[lang][kind].get(n, []):
            lines.append(f"{LABELS[lang]} {line}")
    return "\n".join(lines)


def data_blocks() -> dict[int, dict[str, str]]:
    """Pull every output / drill.out string out of the TypeScript, by rung."""
    src = DATA.read_text(encoding="utf-8")
    blocks: dict[int, dict[str, str]] = {}
    # rungs are separated by "n: <num>," at a known indent; slice between them
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
    missing = [t for t in ("g++", "java", sys.executable) if not have(t)]
    if missing:
        print(f"missing toolchain: {', '.join(missing)}", file=sys.stderr)
        return 2

    captured: dict[str, dict[str, dict[int, list[str]]]] = {}
    with tempfile.TemporaryDirectory() as td:
        work = pathlib.Path(td)
        for lang, (rung_src, drill_src, kind) in PROGRAMS.items():
            run = RUNNERS[kind]
            captured[lang] = {
                "rung": capture("R", run(HERE / rung_src, work)),
                "drill": capture("D", run(HERE / drill_src, work)),
            }
            print(f"ran {rung_src} and {drill_src}")

    blocks = data_blocks()
    if len(blocks) != 40:
        print(f"expected 40 rungs in the data file, found {len(blocks)}", file=sys.stderr)
        return 1

    failures, lines = [], 0
    for n in range(1, 41):
        for kind in ("rung", "drill"):
            want = expected_block(captured, n, kind)
            got = blocks[n]["rung" if kind == "rung" else "drill"]
            lines += len(want.splitlines())
            if not want:
                failures.append(f"rung {n} ({kind}): no program output tagged for this rung")
            elif want != got:
                failures.append(
                    f"rung {n} ({kind}): data file does not match the program.\n"
                    f"  expected:\n    " + "\n    ".join(want.splitlines()) + "\n"
                    f"  found:\n    " + "\n    ".join(got.splitlines())
                )

    print(f"\nchecked 40 rungs, {lines} captured stdout lines")
    if failures:
        print(f"\nFAILED ({len(failures)}):\n" + "\n".join(failures), file=sys.stderr)
        return 1
    print("every output field in lang-ladder.ts is literal stdout. Claim holds.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
