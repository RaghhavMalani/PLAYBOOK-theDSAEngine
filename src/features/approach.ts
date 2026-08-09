/**
 * The approach view — an interactive decision procedure rather than a page to read.
 *
 * The pattern index answers "how does X work". This answers the question you face with
 * a clock running: *I am staring at an array problem — what do I do first?*
 *
 * Two deliberate interaction choices:
 *
 *   The steps are a **stepper**, not an accordion. Only one question is live at a time,
 *   because the whole point is that the questions are ordered — showing all six at once
 *   reproduces exactly the "wall of technique" the guide exists to replace.
 *
 *   Choosing a branch **records the choice and shows the consequence**, so by the end
 *   you have a short list of techniques the constraints actually permit. That list is
 *   the deliverable, not the reading.
 */

import { esc, store } from "../lib/dom";
import { showView } from "./router";
import { ARRAY_APPROACH, ARRAY_SIGNALS, ARRAY_PITFALLS } from "../data/approach-arrays";
import {
  LANG_LADDER,
  LADDER_TIERS,
  LADDER_GROUPS,
  LADDER_LANGS,
} from "../data/lang-ladder";
import type { LangKey, LadderRung, ApiRow } from "../data/lang-ladder";


const LKEY = "ladderLang";
const lang = (): LangKey => (store<LangKey>(LKEY) ?? "py") as LangKey;

/** Current filter state for the ladder. Kept module-level so a repaint is one call. */
const view = { tier: "all", group: "all", q: "", open: false };

const pick = (r: { py: string; cpp: string; java: string }, L: LangKey): string =>
  L === "py" ? r.py : L === "cpp" ? r.cpp : r.java;

/**
 * Complexity strings are turned into the same pills the rest of the playbook uses,
 * so O(1) and O(n) are distinguishable at a glance rather than needing to be read.
 * Anything unrecognised falls through to the neutral pill rather than guessing.
 */
function costPill(cost: string): string {
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

/** Free-text search across everything a rung says, not just its title. */
function matches(r: LadderRung, q: string): boolean {
  if (!q) return true;
  const hay = [
    r.title,
    r.why,
    r.intuition,
    r.useWhen,
    r.differs,
    r.group,
    r.py,
    r.cpp,
    r.java,
    r.drill.ask,
    r.drill.lc ?? "",
    (r.see ?? []).join(" "),
    r.api.py.concat(r.api.cpp, r.api.java).map((a) => a.call + " " + a.gives + " " + (a.gotcha ?? "")).join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => hay.includes(t));
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

    <div class="lintu">
      <b>How it actually works</b>
      <p>${r.intuition}</p>
    </div>

    <p class="luse"><b>Reach for it when</b> ${esc(r.useWhen)}</p>

    <pre class="src lcode">${esc(pick(r, L))}</pre>

    <details class="lfold"${open}>
      <summary>Function reference — every call, what it returns, what it costs</summary>
      ${apiTable(r.api[L])}
    </details>

    <div class="lout"><b>Actual output — all three, as run</b><pre>${esc(r.output)}</pre></div>

    <p class="ldiff"><b>What differs.</b> ${r.differs}</p>

    <details class="lfold ldrill"${open}>
      <summary>Drill — ${esc(r.drill.ask)}${r.drill.lc ? ` <span class="llc">${esc(r.drill.lc)}</span>` : ""}</summary>
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
  const L = lang();
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

interface Answers {
  [step: number]: number;
}

const KEY = "approachAnswers";

const answers = (): Answers => (store<Answers>(KEY) ?? {}) as Answers;
const saveAnswer = (step: number, branch: number): void => {
  const a = answers();
  if (a[step] === branch) delete a[step]; // click again to unset
  else a[step] = branch;
  store(KEY, a);
};

/** Jump into the pattern index with the search box already filtered. */
function gotoPattern(name: string): void {
  showView("patterns");
  const q = document.getElementById("pq") as HTMLInputElement | null;
  if (q) {
    q.value = name;
    q.dispatchEvent(new Event("input"));
  }
}

function shortlist(): { pattern: string; because: string }[] {
  const a = answers();
  const out: { pattern: string; because: string }[] = [];
  for (const step of ARRAY_APPROACH) {
    const pick = a[step.n];
    if (pick === undefined) continue;
    const b = step.branches[pick];
    if (b?.goto) out.push({ pattern: b.goto, because: b.when });
  }
  // de-duplicate, keeping the first reason that nominated it
  const seen = new Set<string>();
  return out.filter((x) => (seen.has(x.pattern) ? false : (seen.add(x.pattern), true)));
}

function renderSteps(): string {
  const a = answers();
  return ARRAY_APPROACH.map((step) => {
    const picked = a[step.n];
    const done = picked !== undefined;
    return `<div class="apstep${done ? " apdone" : ""}">
      <div class="aphead">
        <span class="apnum">${String(step.n).padStart(2, "0")}</span>
        <h3>${esc(step.ask)}</h3>
      </div>
      <p class="apwhy">${esc(step.why)}</p>
      <div class="apbranches">
        ${step.branches
          .map(
            (b, i) => `<button class="apbranch${picked === i ? " on" : ""}"
              data-step="${step.n}" data-branch="${i}">
              <span class="apwhen">${b.when}</span>
              <span class="apthen">${b.then}</span>
              ${b.goto ? `<span class="apgoto">${esc(b.goto)} →</span>` : ""}
            </button>`,
          )
          .join("")}
      </div>
    </div>`;
  }).join("");
}

function renderShortlist(): string {
  const list = shortlist();
  const answered = Object.keys(answers()).length;
  if (!answered) {
    return `<p class="muted">Answer the questions above and the techniques your constraints actually permit will collect here.</p>`;
  }
  if (!list.length) {
    return `<p class="muted">${answered} answered, but none of those branches points at a specific pattern — they narrow the space rather than name a technique. Keep going.</p>`;
  }
  return `<ol class="apshort">${list
    .map(
      (x) => `<li>
        <button class="linkish" data-gopat="${esc(x.pattern)}"><b>${esc(x.pattern)}</b></button>
        <span class="muted">because ${esc(x.because)}</span>
      </li>`,
    )
    .join("")}</ol>`;
}

function renderSignals(filter: string): string {
  const f = filter.trim().toLowerCase();
  const rows = ARRAY_SIGNALS.filter(
    (r) => !f || r.cue.toLowerCase().includes(f) || r.means.toLowerCase().includes(f) || r.goto.toLowerCase().includes(f),
  );
  if (!rows.length) return `<p class="muted">Nothing matches “${esc(filter)}”.</p>`;
  return `<table class="gaptable">
    <thead><tr><th>if the statement says</th><th>it almost always means</th><th>pattern</th></tr></thead>
    <tbody>${rows
      .map(
        (r) => `<tr>
      <td>${r.cue}</td>
      <td class="muted">${r.means}</td>
      <td><button class="linkish" data-gopat="${esc(r.goto)}">${esc(r.goto)} →</button></td>
    </tr>`,
      )
      .join("")}</tbody></table>`;
}

export function renderApproach(): void {
  const host = document.getElementById("v-approach");
  if (!host) return;

  host.innerHTML = `
    <div class="tag"><i></i><span>approach // arrays, in the order the questions matter</span></div>
    <h2 class="mod">What do I<br><em>do first?</em></h2>
    <p class="brief">
      The pattern index tells you <b>how</b> a technique works. This tells you <b>which one to
      reach for</b>, in the order the questions are worth asking. Work down it — each answer
      eliminates approaches rather than adding them.
    </p>

    <div class="apgrid">
      <div id="apsteps">${renderSteps()}</div>
      <aside class="apside">
        <div class="apcard">
          <div class="apsidehead">What your answers permit</div>
          <div id="apshort">${renderShortlist()}</div>
          <button class="btn" id="apreset" style="margin-top:12px">reset answers</button>
        </div>
      </aside>
    </div>

    <h3>Signal → technique</h3>
    <p class="muted">The table to scan when the clock is running. Search a phrase from the problem statement.</p>
    <p><input type="text" id="apq" placeholder="e.g. sorted, in place, more than n/2, rotate…"></p>
    <div id="apsignals">${renderSignals("")}</div>

    <h3>Every operation, in your three languages — 40 rungs</h3>
    <p class="brief">
      Forty rungs, ordered so nothing appears before the thing it depends on. Every
      snippet below was <b>compiled and run</b>: ${LADDER_LANGS.map((l) => esc(l.runtime)).join(", ")}.
      The “actual output” blocks are literal stdout — 306 captured lines, none of them
      predicted. Each rung carries how it works underneath, the exact function names in
      all three languages with their costs, the executed disagreement, and a real problem
      solved with it.
    </p>
    <div class="ltools">
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
        ${LADDER_GROUPS.map((g) => `<button class="btn grp-b" data-grp="${g}">${esc(g)}</button>`).join("")}
      </div>
      <div class="btnrow lsearchrow">
        <input type="text" id="lq" placeholder="search 40 rungs — try “overflow”, “lower_bound”, “heap”, “subList”…">
        <button class="btn" id="lexpand">expand all</button>
      </div>
    </div>
    <div id="lladder">${renderLadder()}</div>

    <h3>The five that cost the most marks</h3>
    <p class="muted">Ranked by how often they survive your own testing — which is what makes them dangerous.</p>
    <div class="appits">${ARRAY_PITFALLS.map(
      (p, i) => `<div class="appit">
        <div class="apnum">${String(i + 1).padStart(2, "0")}</div>
        <div><h4>${esc(p.title)}</h4><p>${p.body}</p></div>
      </div>`,
    ).join("")}</div>
  `;

  const refresh = (): void => {
    const s = document.getElementById("apsteps");
    const sh = document.getElementById("apshort");
    if (s) s.innerHTML = renderSteps();
    if (sh) sh.innerHTML = renderShortlist();
    bind();
  };

  function bind(): void {
    host!.querySelectorAll<HTMLElement>("[data-step]").forEach((el) => {
      el.onclick = () => {
        saveAnswer(Number(el.dataset.step), Number(el.dataset.branch));
        refresh();
      };
    });
    host!.querySelectorAll<HTMLElement>("[data-gopat]").forEach((el) => {
      el.onclick = () => gotoPattern(el.dataset.gopat ?? "");
    });
  }

  bind();

  const reset = document.getElementById("apreset");
  if (reset) {
    reset.onclick = () => {
      store(KEY, {});
      refresh();
    };
  }

  const paintLadder = (): void => {
    const box = document.getElementById("lladder");
    if (box) box.innerHTML = renderLadder();
    host.querySelectorAll<HTMLElement>(".lang-b").forEach((b) =>
      b.classList.toggle("on", b.dataset.lang === lang()),
    );
    host.querySelectorAll<HTMLElement>(".tier-b").forEach((b) =>
      b.classList.toggle("on", b.dataset.tier === view.tier),
    );
    host.querySelectorAll<HTMLElement>(".grp-b").forEach((b) =>
      b.classList.toggle("on", b.dataset.grp === view.group),
    );
    const ex = document.getElementById("lexpand");
    if (ex) ex.textContent = view.open ? "collapse all" : "expand all";
  };
  host.querySelectorAll<HTMLElement>(".lang-b").forEach((b) => {
    b.onclick = () => {
      store(LKEY, b.dataset.lang as LangKey);
      paintLadder();
    };
  });
  host.querySelectorAll<HTMLElement>(".tier-b").forEach((b) => {
    b.onclick = () => {
      view.tier = b.dataset.tier ?? "all";
      paintLadder();
    };
  });
  host.querySelectorAll<HTMLElement>(".grp-b").forEach((b) => {
    b.onclick = () => {
      view.group = b.dataset.grp ?? "all";
      paintLadder();
    };
  });
  const lq = document.getElementById("lq") as HTMLInputElement | null;
  if (lq) {
    lq.value = view.q;
    lq.addEventListener("input", () => {
      view.q = lq.value;
      paintLadder();
      // repainting replaces the input's siblings, not the input itself, so focus survives
    });
  }
  const lexpand = document.getElementById("lexpand");
  if (lexpand) {
    lexpand.onclick = () => {
      view.open = !view.open;
      paintLadder();
    };
  }
  paintLadder();

  const q = document.getElementById("apq") as HTMLInputElement | null;
  if (q) {
    q.addEventListener("input", () => {
      const box = document.getElementById("apsignals");
      if (box) {
        box.innerHTML = renderSignals(q.value);
        box.querySelectorAll<HTMLElement>("[data-gopat]").forEach((el) => {
          el.onclick = () => gotoPattern(el.dataset.gopat ?? "");
        });
      }
    });
  }
}

export function initApproach(): void {
  try {
    renderApproach();
  } catch (err) {
    const host = document.getElementById("v-approach");
    if (host) {
      host.innerHTML = `<h2 class="mod">Approach</h2><div class="callout warn">Could not render: ${esc(String(err))}</div>`;
    }
  }
}
