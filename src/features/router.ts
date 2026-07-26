import { $, $$ } from "../lib/dom";

export type ViewId =
  | "primers" | "patterns" | "viz" | "drill" | "log" | "companies" | "io" | "sql" | "plan" | "sheet";

const VIEWS: readonly (readonly [ViewId, string])[] = [
  ["primers", "foundations"],
  ["patterns", "patterns"],
  ["viz", "visualiser"],
  ["drill", "drill"],
  ["log", "mistake log"],
  ["companies", "company oa"],
  ["io", "fast i/o"],
  ["sql", "sql"],
  ["plan", "4-week plan"],
  ["sheet", "revision sheet"],
];

export function showView(id: ViewId): void {
  $$(".navtab").forEach((x) => x.classList.remove("on"));
  const tab = $$(".navtab").find((b) => b.dataset.v === id);
  if (tab) tab.classList.add("on");
  $$(".view").forEach((s) => s.classList.remove("on"));
  const view = document.getElementById("v-" + id);
  if (view) view.classList.add("on");
  try { location.hash = id; } catch { /* file:// can refuse */ }
  try { window.scrollTo(0, 0); } catch { /* jsdom */ }
}

export function initRouter(): void {
  const host = $("#navtabs");
  for (const [id, label] of VIEWS) {
    const b = document.createElement("button");
    b.className = "navtab";
    b.textContent = label;
    b.dataset.v = id;
    b.onclick = () => showView(id);
    host.appendChild(b);
  }
  const fromHash = (location.hash || "").replace("#", "") as ViewId;
  showView(VIEWS.some(([id]) => id === fromHash) ? fromHash : "primers");
}
