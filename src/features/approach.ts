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
import { mountLadder } from "./ladder-view";
import { LADDER_LANGS } from "../data/lang-ladder";


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
    <div id="lladder"></div>

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

  mountLadder("lladder");

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
