import type { Lang } from "../types";
import { esc } from "./dom";

const KW: Record<Lang, RegExp> = {
  py: /\b(def|return|if|elif|else|for|while|in|not|and|or|None|True|False|import|from|class|break|continue|lambda|yield|with|as|is|global|nonlocal|pass|try|except|finally|raise|assert)\b/g,
  cpp: /\b(int|long|auto|for|while|if|else|return|vector|string|bool|void|const|struct|class|new|delete|nullptr|true|false|using|namespace|std|unordered_map|unordered_set|map|set|queue|stack|priority_queue|deque|pair|tuple|size_t|static|template|typename|break|continue|sort|swap|max|min|function|public|private)\b/g,
  java: /\b(int|long|double|for|while|if|else|return|new|null|true|false|public|private|static|void|class|boolean|char|String|List|ArrayList|Map|HashMap|Set|HashSet|Deque|ArrayDeque|Queue|PriorityQueue|Arrays|Collections|Integer|Long|Math|import|break|continue|final|this)\b/g,
};

/** Highlight per line, splitting the comment off first so keyword substitution
 *  can never chew on the class attributes it just inserted. */
export function hl(code: string, lang: Lang = "py"): string {
  return String(code)
    .split("\n")
    .map((line) => {
      const mark = lang === "py" ? "#" : "//";
      const at = line.indexOf(mark);
      const codePart = at >= 0 ? line.slice(0, at) : line;
      const cmPart = at >= 0 ? line.slice(at) : "";
      let s = esc(codePart)
        .replace(KW[lang] ?? KW.py, "<span class='kw'>$1</span>")
        .replace(/\b(\d+)\b/g, "<span class='nu'>$1</span>");
      if (cmPart) s += "<span class='cm'>" + esc(cmPart) + "</span>";
      return s;
    })
    .join("\n");
}

export function ocls(t: string): string {
  if (/2ⁿ|n!|n²|n³|n·W|n·A|n·m|n·k|R·C/.test(t)) return "Ob";
  if (/log/.test(t)) return "Ol";
  if (/O\(1\)|α\(n\)/.test(t)) return "O1";
  return "On";
}

export const bd = (t: string): string => `<span class="O ${ocls(t)}">${t}</span>`;
