/**
 * The 40-rung language ladder, as a component both pages mount.
 *
 * It started inside the approach view, then the memory page needed the same thing.
 * Rather than a second copy that drifts, the whole UI — toolbar, filters, search,
 * rungs — lives here and takes a host element id. Both callers get identical
 * behaviour, and the language choice is shared through one storage key, so picking
 * C++ on /memory means you are still in C++ when you land on /playbook.
 *
 * Filter state is module-level rather than per-mount because only one instance is
 * ever visible at a time; two mounts on one page would share filters, which is a
 * trade worth making for how much simpler it keeps the repaint.
 */

import { esc, store } from "../lib/dom";
import {
  LANG_LADDER,
  LADDER_TIERS,
  LADDER_GROUPS,
  LADDER_LANGS,
} from "../data/lang-ladder";
import type { LangKey, LadderRung, ApiRow } from "../data/lang-ladder";

const LKEY = "ladderLang";
export const ladderLang = (): LangKey => (store<LangKey>(LKEY) ?? "py") as LangKey;

/** Current filter state. Module-level so a repaint is one call with no plumbing. */
const view = { tier: "all", group: "all", q: "", open: false };

const pick = (r: { py: string; cpp: string; java: string }, L: LangKey): string =>
  L === "py" ? r.py : L === "cpp" ? r.cpp : r.java;

/**
 * Complexity strings become the same O-pills the rest of the site uses, so cost is
 * scannable down a column instead of read line by line. Anything unrecognised falls
 * through to the neutral pill rather than being guessed at.
 */
export function costPill(cost: string): string {
  const c = cost.toLowerCase();
  const cls = c.includes("o(1)")
    ? "O1"
    : c.includes("log") && !c.includes("n log")
      ? "Ol"
      : c.includes("n log") || c.includes("o(n")
        ? "On"
        : "Ob";
  return `<span class="O ${cls}">${esc(cost)}</span>`;
}

function apiTable(rows: readonly ApiRow[]): string {
  if (!rows.length) return "";
  return `<table class="lapi">
    <thead><tr><th>call</th><th>gives you</th><th>cost</th><th>what bites</th></tr></thead>
    <tbody>${rows
      .map(
        (a) => `<tr>
        <td><code>${esc(a.call)}</code></td>
        <td>${esc(a.gives)}</td>
        <td>${costPill(a.cost)}</td>
        <td class="muted">${a.gotcha ? esc(a.gotcha) : "—"}</td>
      </tr>`,
      )
      .join("")}</tbody></table>`;
}

/** Free-text search across everything a rung says — including its code and API rows. */
function matches(r: LadderRung, q: string): boolean {
  if (!q) return true;
  const hay = [
    r.title, r.why, r.intuition, r.useWhen, r.differs, r.group,
    r.py, r.cpp, r.java,
    r.drill.ask, r.drill.lc ?? "",
    (r.see ?? []).join(" "),
    r.api.py.concat(r.api.cpp, r.api.java)
      .map((a) => `${a.call} ${a.gives} ${a.gotcha ?? ""}`).join(" "),
  ].join(" ").toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
}

function renderRung(r: LadderRung, L: LangKey): string {
  const open = view.open ? " open" : "";
  return `<div class="lrung" data-n="${r.n}">
    <div class="lrhead">
      <span class="apnum">${String(r.n).padStart(2, "0")}</span>
      <h4>${esc(r.title)}</h4>
      <span class="lgrp">${esc(r.group)}</span>
      <span class="ltier lt-${r.tier}">${r.tier}</span>
    </div>

    <p class="lwhy">${esc(r.why)}</p>

    <div class="lintu"><b>How it actually works</b><p>${r.intuition}</p></div>

    <p class="luse"><b>Reach for it when</b> ${esc(r.useWhen)}</p>

    <pre class="src lcode">${esc(pick(r, L))}</pre>

    <details class="lfold"${open}>
      <summary>Function reference — every call, what it returns, what it costs</summary>
      ${apiTable(r.api[L])}
    </details>

    <div class="lout"><b>Actual output — all three, as run</b><pre>${esc(r.output)}</pre></div>

    <p class="ldiff"><b>What differs.</b> ${r.differs}</p>

    <details class="lfold ldrill"${open}>
      <summary>Drill — ${esc(r.drill.ask)}${
        r.drill.lc ? ` <span class="llc">${esc(r.drill.lc)}</span>` : ""
      }</summary>
      <pre class="src lcode">${esc(pick(r.drill, L))}</pre>
      <div class="lout"><b>Result</b><pre>${esc(r.drill.out)}</pre></div>
    </details>

    ${
      r.see?.length
        ? `<div class="lsee"><b>Same rung, wearing a hat</b>${r.see
            .map((s) => `<span class="lseechip">${esc(s)}</span>`)
            .join("")}</div>`
        : ""
    }
  </div>`;
}

function renderLadder(): string {
  const L = ladderLang();
  const rows = LANG_LADDER.filter(
    (r) =>
      (view.tier === "all" || r.tier === view.tier) &&
      (view.group === "all" || r.group === view.group) &&
      matches(r, view.q),
  );
  const count = `<p class="lcount">Showing <b>${rows.length}</b> of ${LANG_LADDER.length} rungs${
    view.q ? ` matching “${esc(view.q)}”` : ""
  }.</p>`;
  if (!rows.length) {
    return `${count}<p class="muted">Nothing at that combination. Clear the search or widen the level.</p>`;
  }
  return count + rows.map((r) => renderRung(r, L)).join("");
}

/** The toolbar markup. Kept separate because it is never re-rendered — only the
 *  rung list is, which is what lets the search box keep focus while you type. */
function toolbar(): string {
  return `<div class="ltools">
    <div class="btnrow">
      <span class="apsidehead" style="margin:0">language</span>
      ${LADDER_LANGS.map(
        (l) => `<button class="btn lang-b" data-lang="${l.key}" title="${esc(l.runtime)}">${l.label}</button>`,
      ).join("")}
    </div>
    <div class="btnrow">
      <span class="apsidehead" style="margin:0">level</span>
      <button class="btn tier-b" data-tier="all">all</button>
      ${LADDER_TIERS.map((t) => `<button class="btn tier-b" data-tier="${t}">${t}</button>`).join("")}
    </div>
    <div class="btnrow">
      <span class="apsidehead" style="margin:0">family</span>
      <button class="btn grp-b" data-grp="all">all</button>
      ${LADDER_GROUPS.map((g) => `<button class="btn grp-b" data-grp="${esc(g)}">${esc(g)}</button>`).join("")}
    </div>
    <div class="btnrow lsearchrow">
      <input type="text" id="lq" placeholder="search 40 rungs — try “overflow”, “lower_bound”, “heap”, “subList”…">
      <button class="btn" id="lexpand">expand all</button>
    </div>
  </div>`;
}

/**
 * Render the ladder into `hostId` and wire every control.
 * Safe to call more than once — it rebuilds the whole subtree.
 */
export function mountLadder(hostId: string): void {
  const host = document.getElementById(hostId);
  if (!host) return;

  host.innerHTML = `${toolbar()}<div class="lladder">${renderLadder()}</div>`;

  const paint = (): void => {
    const box = host.querySelector<HTMLElement>(".lladder");
    if (box) box.innerHTML = renderLadder();
    host.querySelectorAll<HTMLElement>(".lang-b").forEach((b) =>
      b.classList.toggle("on", b.dataset.lang === ladderLang()));
    host.querySelectorAll<HTMLElement>(".tier-b").forEach((b) =>
      b.classList.toggle("on", b.dataset.tier === view.tier));
    host.querySelectorAll<HTMLElement>(".grp-b").forEach((b) =>
      b.classList.toggle("on", b.dataset.grp === view.group));
    const ex = host.querySelector<HTMLElement>("#lexpand");
    if (ex) ex.textContent = view.open ? "collapse all" : "expand all";
  };

  host.querySelectorAll<HTMLElement>(".lang-b").forEach((b) => {
    b.onclick = () => { store(LKEY, b.dataset.lang as LangKey); paint(); };
  });
  host.querySelectorAll<HTMLElement>(".tier-b").forEach((b) => {
    b.onclick = () => { view.tier = b.dataset.tier ?? "all"; paint(); };
  });
  host.querySelectorAll<HTMLElement>(".grp-b").forEach((b) => {
    b.onclick = () => { view.group = b.dataset.grp ?? "all"; paint(); };
  });

  const lq = host.querySelector<HTMLInputElement>("#lq");
  if (lq) {
    lq.value = view.q;
    // Only the rung list is replaced, never the toolbar, so focus and caret survive.
    lq.addEventListener("input", () => { view.q = lq.value; paint(); });
  }
  const ex = host.querySelector<HTMLElement>("#lexpand");
  if (ex) ex.onclick = () => { view.open = !view.open; paint(); };

  paint();
}
