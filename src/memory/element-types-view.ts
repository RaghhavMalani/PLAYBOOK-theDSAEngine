/**
 * The element-types ladder, rendered.
 *
 * Twelve levels answering the question the memory page is actually about: not
 * "which method do I call" but "what is in the box, and what did that cost".
 *
 * Two rendering choices worth stating:
 *
 *   The measured block is styled like the ladder's output block on purpose. Both
 *   are literal stdout, and making them look identical is the point — a number the
 *   page printed itself should never be mistaken for a number the page asserts.
 *
 *   The declaration table shows BYTES rather than complexity, because on this page
 *   the interesting axis is memory, not time. It reuses the ladder's table styling
 *   so the two modules read as one family.
 */

import { esc, store } from "../lib/dom";
import { ELEMENT_LEVELS, ELEMENT_TIERS, ELEMENT_RUNTIMES } from "../data/element-types";
import type { LangKey, ElementLevel, DeclRow } from "../data/element-types";

// Shares the ladder's key on purpose: choosing C++ once should hold across both
// modules and both pages.
const LKEY = "ladderLang";
const lang = (): LangKey => (store<LangKey>(LKEY) ?? "py") as LangKey;

const view = { tier: "all", q: "", open: false };

const pick = (r: { py: string; cpp: string; java: string }, L: LangKey): string =>
  L === "py" ? r.py : L === "cpp" ? r.cpp : r.java;

function declTable(rows: readonly DeclRow[]): string {
  return `<table class="lapi etdecl">
    <thead><tr><th>how you declare it</th><th>what one element costs</th><th>what surprises people</th></tr></thead>
    <tbody>${rows
      .map(
        (d) => `<tr>
        <td><code>${esc(d.decl)}</code></td>
        <td class="etbytes">${esc(d.bytes)}</td>
        <td class="muted">${esc(d.note)}</td>
      </tr>`,
      )
      .join("")}</tbody></table>`;
}

function matches(l: ElementLevel, q: string): boolean {
  if (!q) return true;
  const hay = [
    l.title, l.what, l.why, l.layout, l.differs, l.trap ?? "",
    l.py, l.cpp, l.java,
    (l.see ?? []).join(" "),
    l.decl.py.concat(l.decl.cpp, l.decl.java)
      .map((d) => `${d.decl} ${d.bytes} ${d.note}`).join(" "),
  ].join(" ").toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
}

function renderLevel(l: ElementLevel, L: LangKey): string {
  const open = view.open ? " open" : "";
  return `<div class="lrung etlvl" data-n="${l.n}">
    <div class="lrhead">
      <span class="apnum">${String(l.n).padStart(2, "0")}</span>
      <h4>${esc(l.title)}</h4>
      <span class="ltier lt-${l.tier}">${l.tier}</span>
    </div>

    <p class="etwhat">${esc(l.what)}</p>
    <p class="lwhy">${esc(l.why)}</p>

    <div class="lintu etlayout"><b>What the machine lays out</b><p>${l.layout}</p></div>

    <pre class="src lcode">${esc(pick(l, L))}</pre>

    <details class="lfold"${open}>
      <summary>Declaration reference — the spelling, and what one element costs</summary>
      ${declTable(l.decl[L])}
    </details>

    <div class="lout etmeasured"><b>Measured — all three, as run</b><pre>${esc(l.measured)}</pre></div>

    <p class="ldiff"><b>What differs.</b> ${l.differs}</p>

    ${l.trap ? `<p class="ettrap"><b>The trap</b> ${l.trap}</p>` : ""}

    ${
      l.see?.length
        ? `<div class="lsee"><b>Where it shows up</b>${l.see
            .map((s) => `<span class="lseechip">${esc(s)}</span>`)
            .join("")}</div>`
        : ""
    }
  </div>`;
}

function renderLevels(): string {
  const L = lang();
  const rows = ELEMENT_LEVELS.filter(
    (l) => (view.tier === "all" || l.tier === view.tier) && matches(l, view.q),
  );
  const count = `<p class="lcount">Showing <b>${rows.length}</b> of ${ELEMENT_LEVELS.length} levels${
    view.q ? ` matching “${esc(view.q)}”` : ""
  }.</p>`;
  if (!rows.length) {
    return `${count}<p class="muted">Nothing at that combination. Clear the search or widen the level.</p>`;
  }
  return count + rows.map((l) => renderLevel(l, L)).join("");
}

function toolbar(): string {
  return `<div class="ltools">
    <div class="btnrow">
      <span class="apsidehead" style="margin:0">language</span>
      ${ELEMENT_RUNTIMES.map(
        (l) => `<button class="btn etlang-b" data-lang="${l.key}" title="${esc(l.runtime)}">${l.label}</button>`,
      ).join("")}
    </div>
    <div class="btnrow">
      <span class="apsidehead" style="margin:0">level</span>
      <button class="btn ettier-b" data-tier="all">all</button>
      ${ELEMENT_TIERS.map((t) => `<button class="btn ettier-b" data-tier="${t}">${t}</button>`).join("")}
    </div>
    <div class="btnrow lsearchrow">
      <input type="text" id="etq" placeholder="search 12 levels — try “padding”, “boxing”, “vector&lt;bool&gt;”, “cache”…">
      <button class="btn" id="etexpand">expand all</button>
    </div>
  </div>`;
}

/** Render the element-types ladder into `hostId` and wire its controls. */
export function mountElementTypes(hostId: string): void {
  const host = document.getElementById(hostId);
  if (!host) return;

  host.innerHTML = `${toolbar()}<div class="etlist">${renderLevels()}</div>`;

  const paint = (): void => {
    const box = host.querySelector<HTMLElement>(".etlist");
    if (box) box.innerHTML = renderLevels();
    host.querySelectorAll<HTMLElement>(".etlang-b").forEach((b) =>
      b.classList.toggle("on", b.dataset.lang === lang()));
    host.querySelectorAll<HTMLElement>(".ettier-b").forEach((b) =>
      b.classList.toggle("on", b.dataset.tier === view.tier));
    const ex = host.querySelector<HTMLElement>("#etexpand");
    if (ex) ex.textContent = view.open ? "collapse all" : "expand all";
  };

  host.querySelectorAll<HTMLElement>(".etlang-b").forEach((b) => {
    b.onclick = () => { store(LKEY, b.dataset.lang as LangKey); paint(); };
  });
  host.querySelectorAll<HTMLElement>(".ettier-b").forEach((b) => {
    b.onclick = () => { view.tier = b.dataset.tier ?? "all"; paint(); };
  });

  const q = host.querySelector<HTMLInputElement>("#etq");
  if (q) {
    q.value = view.q;
    q.addEventListener("input", () => { view.q = q.value; paint(); });
  }
  const ex = host.querySelector<HTMLElement>("#etexpand");
  if (ex) ex.onclick = () => { view.open = !view.open; paint(); };

  paint();
}
