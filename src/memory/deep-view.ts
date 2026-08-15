/**
 * One renderer for both of the memory page's deep-dive modules.
 *
 * `element-types` and `memory-deep` are the same artefact with different content:
 * a graded list of topics, each carrying a mechanism explanation, a per-language
 * reference table, literal captured stdout and the traps. The first version of this
 * file was written for element-types alone; when the second module arrived, copying
 * ~160 lines of near-identical rendering would have guaranteed the two drifted.
 *
 * What genuinely differs between the two is wording, so that is what the config
 * carries: the column headings, the summary line on the collapsed table, and the
 * search placeholder. Everything structural is shared.
 *
 * Filter state is per-mount rather than module-level, because unlike the ladder,
 * two of these ARE visible on one page at the same time and they must not share a
 * search box.
 */

import { esc, store } from "../lib/dom";
import { DEEP_TIERS, DEEP_RUNTIMES } from "../data/deep-types";
import type { LangKey, DeepLevel, DeclRow } from "../data/deep-types";

// Shares the ladder's key deliberately: choosing C++ once should hold everywhere.
const LKEY = "ladderLang";
const lang = (): LangKey => (store<LangKey>(LKEY) ?? "py") as LangKey;

export interface DeepViewConfig {
  /** unique per mount — used to namespace the control ids */
  id: string;
  /** the three column headings on the reference table */
  columns: [string, string, string];
  /** the text on the collapsed reference table's summary */
  refSummary: string;
  /** heading on the captured-output block */
  measuredLabel: string;
  /** placeholder for the search box */
  placeholder: string;
  /** what the count line calls a row */
  unit: string;
}

const pick = (r: { py: string; cpp: string; java: string }, L: LangKey): string =>
  L === "py" ? r.py : L === "cpp" ? r.cpp : r.java;

function refTable(rows: readonly DeclRow[], cols: [string, string, string]): string {
  return `<table class="lapi etdecl">
    <thead><tr><th>${esc(cols[0])}</th><th>${esc(cols[1])}</th><th>${esc(cols[2])}</th></tr></thead>
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

function matches(l: DeepLevel, q: string): boolean {
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

function renderLevel(l: DeepLevel, L: LangKey, cfg: DeepViewConfig, open: boolean): string {
  return `<div class="lrung etlvl" data-n="${l.n}">
    <div class="lrhead">
      <span class="apnum">${String(l.n).padStart(2, "0")}</span>
      <h4>${esc(l.title)}</h4>
      <span class="ltier lt-${l.tier}">${l.tier}</span>
    </div>

    <p class="etwhat">${esc(l.what)}</p>
    <p class="lwhy">${esc(l.why)}</p>

    <div class="lintu etlayout"><b>What the machine is actually doing</b><p>${l.layout}</p></div>

    <pre class="src lcode">${esc(pick(l, L))}</pre>

    <details class="lfold"${open ? " open" : ""}>
      <summary>${esc(cfg.refSummary)}</summary>
      ${refTable(l.decl[L], cfg.columns)}
    </details>

    <div class="lout etmeasured"><b>${esc(cfg.measuredLabel)}</b><pre>${esc(l.measured)}</pre></div>

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

/**
 * Render `levels` into `hostId` and wire the controls.
 * Safe to call repeatedly, and safe to mount more than once per page.
 */
export function mountDeepLevels(
  hostId: string,
  levels: readonly DeepLevel[],
  cfg: DeepViewConfig,
): void {
  const host = document.getElementById(hostId);
  if (!host) return;

  // per-mount state: two of these coexist on the memory page
  const view = { tier: "all", q: "", open: false };
  const qId = `q_${cfg.id}`;
  const exId = `ex_${cfg.id}`;

  const renderList = (): string => {
    const L = lang();
    const rows = levels.filter(
      (l) => (view.tier === "all" || l.tier === view.tier) && matches(l, view.q),
    );
    const count = `<p class="lcount">Showing <b>${rows.length}</b> of ${levels.length} ${esc(cfg.unit)}${
      view.q ? ` matching “${esc(view.q)}”` : ""
    }.</p>`;
    if (!rows.length) {
      return `${count}<p class="muted">Nothing at that combination. Clear the search or widen the level.</p>`;
    }
    return count + rows.map((l) => renderLevel(l, L, cfg, view.open)).join("");
  };

  host.innerHTML = `<div class="ltools">
      <div class="btnrow">
        <span class="apsidehead" style="margin:0">language</span>
        ${DEEP_RUNTIMES.map(
          (l) => `<button class="btn dlang-b" data-lang="${l.key}" title="${esc(l.runtime)}">${l.label}</button>`,
        ).join("")}
      </div>
      <div class="btnrow">
        <span class="apsidehead" style="margin:0">level</span>
        <button class="btn dtier-b" data-tier="all">all</button>
        ${DEEP_TIERS.map((t) => `<button class="btn dtier-b" data-tier="${t}">${t}</button>`).join("")}
      </div>
      <div class="btnrow lsearchrow">
        <input type="text" id="${qId}" placeholder="${esc(cfg.placeholder)}">
        <button class="btn" id="${exId}">expand all</button>
      </div>
    </div>
    <div class="etlist">${renderList()}</div>`;

  const paint = (): void => {
    const box = host.querySelector<HTMLElement>(".etlist");
    if (box) box.innerHTML = renderList();
    host.querySelectorAll<HTMLElement>(".dlang-b").forEach((b) =>
      b.classList.toggle("on", b.dataset.lang === lang()));
    host.querySelectorAll<HTMLElement>(".dtier-b").forEach((b) =>
      b.classList.toggle("on", b.dataset.tier === view.tier));
    const ex = host.querySelector<HTMLElement>(`#${exId}`);
    if (ex) ex.textContent = view.open ? "collapse all" : "expand all";
  };

  host.querySelectorAll<HTMLElement>(".dlang-b").forEach((b) => {
    b.onclick = () => {
      store(LKEY, b.dataset.lang as LangKey);
      paint();
      // the sibling module shares the language key, so repaint it too
      document.dispatchEvent(new CustomEvent("deeplang"));
    };
  });
  host.querySelectorAll<HTMLElement>(".dtier-b").forEach((b) => {
    b.onclick = () => { view.tier = b.dataset.tier ?? "all"; paint(); };
  });

  const q = host.querySelector<HTMLInputElement>(`#${qId}`);
  if (q) {
    q.value = view.q;
    q.addEventListener("input", () => { view.q = q.value; paint(); });
  }
  const ex = host.querySelector<HTMLElement>(`#${exId}`);
  if (ex) ex.onclick = () => { view.open = !view.open; paint(); };

  // keep the two modules' language toggles in agreement
  document.addEventListener("deeplang", paint);

  paint();
}
