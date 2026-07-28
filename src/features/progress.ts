/**
 * "Your coverage" — the view that reads your solved repo and tells you what is cold.
 *
 * The design rule here: never show a number that flatters you. The headline leads with
 * patterns untouched, not problems solved, because 117 solved problems concentrated in
 * 27 of 63 patterns is a worse position than the raw count suggests, and the raw count
 * is the one that feels good.
 */

import { esc } from "../lib/dom";
import { COMPANIES } from "../data/companies";
import { showView } from "./router";
import { TOPICS } from "../data/index";
import {
  headline,
  patternCoverage,
  topicCoverage,
  gapsFor,
  gapsOverall,
  notesUrl,
  solutionUrl,
  unmappedFamilies,
  PROGRESS_COUNTS,
  PROGRESS_REPO,
} from "../data/progress";
import type { Gap } from "../data/progress";

const topicName = (id: string): string => TOPICS.find(([t]) => t === id)?.[1] ?? id;

function bar(done: number, total: number): string {
  const pct = total ? Math.round((100 * done) / total) : 0;
  return `<span class="pbar" aria-hidden="true"><span style="width:${pct}%"></span></span>`;
}

function gapRows(gaps: Gap[], weightLabel: string): string {
  if (!gaps.length) return `<p class="muted">Nothing cold here. Genuinely.</p>`;
  return `<table class="gaptable">
    <thead><tr><th>pattern</th><th>topic</th><th>${esc(weightLabel)}</th><th>adjacent</th><th>start with</th></tr></thead>
    <tbody>${gaps
      .map(
        (g) => `<tr>
      <td><button class="linkish" data-gopat="${esc(g.pattern.n)}">${esc(g.pattern.n)}</button></td>
      <td class="muted">${esc(topicName(g.pattern.t))}</td>
      <td><b>${g.weight}</b></td>
      <td class="muted">${g.adjacent ? `${g.adjacent} nearby` : "—"}</td>
      <td>${
        g.next
          ? `<a href="https://leetcode.com/problems/${esc(g.next[1])}/" target="_blank" rel="noopener">${g.next[0]}. ${esc(g.next[2])}</a>`
          : `<span class="muted">no anchor listed</span>`
      }</td>
    </tr>`,
      )
      .join("")}</tbody></table>`;
}

export function renderProgress(): void {
  const host = document.getElementById("v-progress");
  if (!host) return;

  const h = headline();
  const cov = patternCoverage();
  const topics = topicCoverage().sort((a, b) => a.touched / a.patterns - b.touched / b.patterns);
  const unmapped = unmappedFamilies();

  const cold = cov.filter((c) => !c.touched).length;
  const companyOpts = COMPANIES.map(
    (c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`,
  ).join("");

  host.innerHTML = `
    <h2>Your coverage</h2>
    <p class="lede">
      Read from <a href="${PROGRESS_REPO}" target="_blank" rel="noopener">your leetcode-progress repo</a>
      — ${PROGRESS_COUNTS.total} problems, ${PROGRESS_COUNTS.withNotes} with written notes,
      ${PROGRESS_COUNTS.withViz} with a traced visualisation. Nothing here is typed in by hand;
      re-run <code>npm run sync:progress</code> after you solve things.
    </p>

    <div class="statrow">
      <div class="stat bad"><b>${cold}</b><span>patterns with nothing solved</span></div>
      <div class="stat"><b>${h.patternsTouched}/${h.patternsTotal}</b><span>patterns met</span></div>
      <div class="stat"><b>${h.anchorsSolved}/${h.anchorsTotal}</b><span>anchor problems done</span></div>
      <div class="stat"><b>${h.easy}/${h.medium}/${h.hard}</b><span>easy / medium / hard</span></div>
    </div>

    <div class="callout">
      <b>How to read this.</b> A pattern counts as met only when you have solved a problem
      this playbook lists as an <em>anchor</em> for it. ${h.offPlaybook} of your
      ${h.solved} solved problems are not anchors for anything here — that is not wasted
      work, it just is not evidence about these 63 patterns specifically. Solving inside
      a topic you already know is the most comfortable way to make no progress, and the
      number on the left is the one that predicts an OA result.
    </div>

    <h3>Where you are thin, by topic</h3>
    <table class="gaptable">
      <thead><tr><th>topic</th><th>patterns met</th><th></th><th>anchors solved</th><th>nearby work</th></tr></thead>
      <tbody>${topics
        .map(
          (t) => `<tr class="${t.touched === 0 ? "row-bad" : ""}">
        <td>${esc(topicName(t.topic))}</td>
        <td><b>${t.touched}</b> / ${t.patterns}</td>
        <td style="width:120px">${bar(t.touched, t.patterns)}</td>
        <td class="muted">${t.solvedHere}</td>
        <td class="muted">${t.adjacentOnly || "—"}</td>
      </tr>`,
        )
        .join("")}</tbody></table>

    <h3>What to fix first — across all ${COMPANIES.length} companies</h3>
    <p class="muted">
      Ranked by how many companies weight that topic at 4 or 5. The "adjacent" column is
      how many nearby problems you have already solved: it shortens the job, it does not
      remove it.
    </p>
    ${gapRows(gapsOverall(COMPANIES), "companies wanting it")}

    <h3>What to fix first — for one company</h3>
    <p><label>Target: <select id="gapco">${companyOpts}</select></label></p>
    <div id="gapone"></div>

    <h3>Patterns you have met</h3>
    <p class="muted">With links back to your own notes, which are usually better revision than re-reading mine.</p>
    <div class="metgrid">${cov
      .filter((c) => c.touched)
      .sort((a, b) => b.ratio - a.ratio)
      .map(
        (c) => `<div class="met">
        <button class="linkish" data-gopat="${esc(c.pattern.n)}"><b>${esc(c.pattern.n)}</b></button>
        <span class="muted">${c.solvedAnchors.length}/${c.pattern.lc?.length ?? 0} anchors</span>
        <div class="metlinks">${c.solvedAnchors
          .map(
            (e) =>
              `<a href="${e.notes ? notesUrl(e) : solutionUrl(e)}" target="_blank" rel="noopener" title="${esc(e.label || e.family)}">${e.num}</a>`,
          )
          .join(" ")}</div>
      </div>`,
      )
      .join("")}</div>

    ${
      unmapped.length
        ? `<div class="callout warn"><b>Unmapped families:</b> ${unmapped
            .map(esc)
            .join(", ")}. These contribute no adjacent-work credit until they are added to
            <code>FAMILY_TO_TOPICS</code> in <code>src/data/progress.ts</code>.</div>`
        : ""
    }
  `;

  const sel = document.getElementById("gapco") as HTMLSelectElement | null;
  const one = document.getElementById("gapone");
  const draw = (): void => {
    if (!sel || !one) return;
    const co = COMPANIES.find((c) => c.id === sel.value);
    one.innerHTML = co
      ? `<p class="muted">${esc(co.name)} — ${esc(co.format.slice(0, 160))}</p>${gapRows(gapsFor(co), "their weight")}`
      : "";
  };
  if (sel) {
    sel.onchange = draw;
    draw();
  }

  /* Jump to the pattern by driving the existing search box rather than adding a second
   * filtering path — one source of truth for what the pattern list is showing. */
  host.querySelectorAll<HTMLElement>("[data-gopat]").forEach((el) => {
    el.onclick = () => {
      showView("patterns");
      const q = document.getElementById("pq") as HTMLInputElement | null;
      if (q) {
        q.value = el.dataset.gopat ?? "";
        q.dispatchEvent(new Event("input"));
      }
    };
  });
}

export function initProgress(): void {
  try {
    renderProgress();
  } catch (err) {
    const host = document.getElementById("v-progress");
    if (host) {
      host.innerHTML = `<h2>Your coverage</h2><div class="callout warn">
        Could not read the progress data: ${esc(String(err))}.
        Run <code>npm run sync:progress</code> and rebuild.</div>`;
    }
  }
}
