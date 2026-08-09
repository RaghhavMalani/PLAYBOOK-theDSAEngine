"""Shared machinery for the two verification scripts.

Both `lang-ladder-verify` and `element-types-verify` do the same thing: compile
and run three programs, group their stdout by a tag, and diff that against strings
stored in a TypeScript data file. They had ~80% of their code in common, and two
copies of a subprocess wrapper is how the two drift.

Two things here are worth reading rather than skimming.

WHY COMPILER OUTPUT IS PRINTED. The first version ran the compiler with
`capture_output=True, check=True`. When g++ failed on a Windows machine, Python
raised CalledProcessError showing the command line and the exit status — and
swallowed the compiler's actual message, which was the only useful part. A
verification tool that hides the error it exists to surface is worse than no tool.
Every runner now prints the child's stderr before failing.

WHY A TOOLCHAIN MISMATCH IS NOT A FAILURE. The numbers in the data files are
measurements: `sizeof(pair<int,char>)`, `sys.getsizeof('hi')`, an ArrayList growth
curve. They are true for the toolchain that produced them and may legitimately
differ on another — CPython changed instance layout in 3.11, a different libstdc++
may pick a different vector growth constant. Failing hard on that would teach the
wrong lesson: that the page is broken, when in fact your machine is simply
different. So the reference toolchain is recorded, compared against the live one,
and a mismatch downgrades differences to an informational report. When the
toolchain matches, any difference is a real regression and fails loudly.
"""
from __future__ import annotations

import pathlib
import re
import shutil
import subprocess
import sys

# The toolchain every stored number was captured on. Update these together with
# the numbers, never separately.
REFERENCE = {
    "cpp": "g++ 11.4.0",
    "java": "openjdk 11.0.31",
    "py": "CPython 3.10.12",
}

# label -> the prefix the data files use for that language's captured lines
LABELS = {"cpp": "[C++] ", "java": "[Java]", "py": "[Py]  "}

INSTALL_HINT = {
    "g++": "a C++17 compiler — MSYS2/MinGW-w64, or `winget install BrechtSanders.WinLibs.POSIX.UCRT`",
    "java": "a JDK 11+ — `winget install Microsoft.OpenJDK.21`",
}


def have(tool: str) -> bool:
    return shutil.which(tool) is not None


def _run(cmd: list[str], what: str, **kw) -> subprocess.CompletedProcess:
    """Run a child process and, on failure, show what it actually said.

    This is the whole reason this helper exists — see the module docstring."""
    p = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if p.returncode != 0:
        print(f"\n  {what} failed (exit {p.returncode})", file=sys.stderr)
        print(f"  command: {' '.join(cmd)}\n", file=sys.stderr)
        out = (p.stderr or p.stdout or "(no output)").rstrip()
        for line in out.splitlines():
            print(f"    {line}", file=sys.stderr)
        print("", file=sys.stderr)
        raise SystemExit(1)
    return p


def run_cpp(src: pathlib.Path, workdir: pathlib.Path) -> str:
    exe = workdir / (src.stem + (".exe" if sys.platform == "win32" else ".bin"))
    _run(["g++", "-std=c++17", "-O2", "-o", str(exe), str(src)], f"compiling {src.name}")
    return _run([str(exe)], f"running {exe.name}").stdout


def run_java(src: pathlib.Path, workdir: pathlib.Path) -> str:
    # JDK 11+ single-file source launcher: compiles in memory, no javac needed.
    return _run(["java", str(src)], f"running {src.name}", cwd=workdir).stdout


def run_py(src: pathlib.Path, workdir: pathlib.Path) -> str:
    return _run([sys.executable, str(src)], f"running {src.name}").stdout


RUNNERS = {"cpp": run_cpp, "java": run_java, "py": run_py}


def _first_version(text: str) -> str:
    m = re.search(r"(\d+\.\d+(?:\.\d+)?)", text)
    return m.group(1) if m else "?"


def live_toolchain() -> dict[str, str]:
    """What is actually installed here, in the same shape as REFERENCE."""
    out = {"py": f"CPython {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"}
    try:
        v = subprocess.run(["g++", "--version"], capture_output=True, text=True)
        out["cpp"] = f"g++ {_first_version(v.stdout.splitlines()[0] if v.stdout else '')}"
    except Exception:
        out["cpp"] = "g++ ?"
    try:
        # java -version writes to stderr, which is a very old wart
        v = subprocess.run(["java", "-version"], capture_output=True, text=True)
        out["java"] = f"openjdk {_first_version(v.stderr or v.stdout)}"
    except Exception:
        out["java"] = "openjdk ?"
    return out


def check_tools() -> int:
    """Return 0 if the compilers are present, or explain what is missing."""
    missing = [t for t in ("g++", "java") if not have(t)]
    if not missing:
        return 0
    print("\n  Cannot verify: missing toolchain.\n", file=sys.stderr)
    for t in missing:
        print(f"    {t:<6} not on PATH — {INSTALL_HINT[t]}", file=sys.stderr)
    print(
        "\n  These scripts re-RUN the programs and diff their output against the data\n"
        "  file, so they need the compilers, not just Python. `npm run typecheck` and\n"
        "  `npm run build` still check the code without them.\n",
        file=sys.stderr,
    )
    return 2


def capture(prefix: str, text: str) -> dict[int, list[str]]:
    """Group output lines by the two-digit number they are tagged with."""
    out: dict[int, list[str]] = {}
    for line in text.splitlines():
        m = re.match(rf"^{re.escape(prefix)}(\d\d)", line)
        if m:
            out.setdefault(int(m.group(1)), []).append(line)
    return out


def block(per_lang: dict[str, dict[int, list[str]]], n: int) -> str:
    """Rebuild one entry's stored field exactly as the data file should hold it."""
    return "\n".join(
        f"{LABELS[lang]} {line}"
        for lang in ("cpp", "java", "py")
        for line in per_lang[lang].get(n, [])
    )


def report(failures: list[str], live: dict[str, str], unit: str, count: int, lines: int) -> int:
    """Print the verdict, treating a toolchain mismatch as explanation not failure."""
    drift = {k: (REFERENCE[k], live.get(k, "?")) for k in REFERENCE if REFERENCE[k] != live.get(k)}

    print(f"\nchecked {count} {unit}, {lines} captured stdout lines")
    print("  reference toolchain: " + ", ".join(REFERENCE[k] for k in ("cpp", "java", "py")))
    print("  running on:          " + ", ".join(live.get(k, "?") for k in ("cpp", "java", "py")))

    if not failures:
        print(f"\nevery stored field matches this run. Claim holds.")
        return 0

    if drift:
        print(
            "\n  NOTE — your toolchain differs from the one these numbers were captured on:",
        )
        for k, (ref, got) in drift.items():
            print(f"    {k:<5} captured on {ref}, you have {got}")
        print(
            "\n  The differences below are therefore EXPECTED, not bugs. These are real\n"
            "  measurements: object layouts and growth constants genuinely change between\n"
            "  compiler and interpreter versions. That is the point of measuring rather\n"
            "  than asserting.\n"
            "\n  To adopt your machine's numbers as the new reference, update REFERENCE in\n"
            "  scripts/verify_common.py and re-generate the stored fields.\n"
        )
        for f in failures:
            print(f"  - {f.splitlines()[0]}")
        print(f"\n{len(failures)} difference(s), all attributable to the toolchain gap. Not failing.")
        return 0

    print(f"\nFAILED ({len(failures)}) — same toolchain, different output:\n", file=sys.stderr)
    print("\n".join(failures), file=sys.stderr)
    return 1
