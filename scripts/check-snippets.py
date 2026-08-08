#!/usr/bin/env python3
"""Every Python snippet that ships must actually parse.

Run in CI. Snippets are fragments (they contain bare `return`), so each is wrapped
in a function body before parsing — that checks syntax without demanding they be
standalone programs.
"""
import ast, io, re, sys, textwrap, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
FILES = [
    "src/data/patterns.ts",
    "src/data/patterns-hard.ts",
    "src/data/patterns-math.ts",
    "src/data/patterns-adv.ts",
    "src/data/patterns-gaps.ts",
    "src/data/patterns-foundations.ts",
    "src/lib/stress.ts",
]

# matches   py: "....."   with escapes, and  `....`  template literals
DQ = re.compile(r'\n\s*py:\s*"((?:[^"\\]|\\.)*)"')
BT = re.compile(r'\n\s*`(def brute\(a\):[\s\S]*?)`,')

def unescape(s: str) -> str:
    return s.encode().decode("unicode_escape")

def main() -> int:
    checked = failed = 0
    for rel in FILES:
        text = (ROOT / rel).read_text(encoding="utf-8")
        snippets = [unescape(m.group(1)) for m in DQ.finditer(text)]
        snippets += [m.group(1) for m in BT.finditer(text)]
        for i, code in enumerate(snippets):
            checked += 1
            try:
                ast.parse("def _wrapper():\n" + textwrap.indent(code, "    "))
            except SyntaxError as e:
                failed += 1
                print(f"FAIL {rel} snippet #{i + 1}: {e}", file=sys.stderr)
                print(textwrap.indent(code[:200], "     | "), file=sys.stderr)

    print(f"{checked} Python snippets checked, {failed} syntax errors")
    return 1 if failed else 0

if __name__ == "__main__":
    sys.exit(main())
