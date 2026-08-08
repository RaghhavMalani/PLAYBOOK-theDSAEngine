/** Mastery analytics: repository history proves exposure; append-only attempts prove recall. */

import { esc } from "../lib/dom";
import {
  appendAttemptHistory,
  MASTERY_STAGES,
  readAttemptHistory,
  stageIndex,
  type Assistance,
  type AttemptKind,
  type AttemptOutcome,
  type CodeOrigin,
  type MasteryAttempt,
  type MasteryStage,
  type MistakeCategory,
  type RetentionDay,
} from "../lib/mastery";
import { COMPANIES } from "../data/companies";
import { showView } from "./router";
import { TOPICS, PATTERNS } from "../data/index";
import {
  headline,
  patternCoverage,
  topicCoverage,
  gapsFor,
  gapsOverall,
  notesUrl,
  solutionUrl,
  unmappedFamilies,
  progressSyncAge,
  PROGRESS_COUNTS,
  PROGRESS_REPO,
  PROGRESS_SYNC,
} from "../data/progress";
import type { Gap, PatternCoverage } from "../data/progress";

const topicName = (id: string): string => TOPICS.find(([t]) => t === id)?.[1] ?? id;
const stageLabel = (stage: MasteryStage): string => stage.replace("-", " ");
let flash = "";

function bar(done: number, total: number): string {
  const pct = total ? Math.round((100 * done) / total) : 0;
  return `<span class="pbar" aria-hidden="true"><span style="width:${pct}%"></span></span>`;
}

function fmtSeconds(value: number | null): string {
  if (value === null) return "—";
  if (value < 60) return `${Math.round(value)}s`;
  const minutes = Math.floor(value / 60);
  const seconds = Math.round(value % 60);
  return `${minutes}m${seconds ? ` ${seconds}s` : ""}`;
}

function fmtDate(value: string | null): string {
  if (!value) return "not yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "date unknown" : date.toLocaleDateString();
}

function stageBadge(stage: MasteryStage): string {
  return `<span class="mastery-stage ms-${stage}">${stageLabel(stage)}</span>`;
}

function retentionStrip(coverage: PatternCoverage): string {
  return `<span class="retention-strip" aria-label="retention checkpoints">${coverage.mastery.retention.map((checkpoint) =>
    `<span class="ret-${checkpoint.state}" title="day ${checkpoint.day}: ${checkpoint.state}">${checkpoint.day}</span>`,
  ).join("")}</span>`;
}

function gapRows(gaps: Gap[], weightLabel: string): string {
  if (!gaps.length) return `<p class="muted">Every relevant pattern is interview-ready.</p>`;
  return `<table class="gaptable">
    <thead><tr><th>pattern</th><th>mastery</th><th>topic</th><th>${esc(weightLabel)}</th><th>next evidence</th></tr></thead>
    <tbody>${gaps.map((g) => `<tr>
      <td><button class="linkish" data-gopat="${esc(g.pattern.n)}">${esc(g.pattern.n)}</button></td>
      <td>${stageBadge(g.stage)}</td>
      <td class="muted">${esc(topicName(g.pattern.t))}</td>
      <td><b>${g.weight}</b></td>
      <td>${g.next
        ? `<a href="https://leetcode.com/problems/${esc(g.next[1])}/" target="_blank" rel="noopener">LC ${g.next[0]}</a>`
        : `<span class="muted">${esc(g.stage === "unseen" ? "choose an anchor" : "log a timed re-solve")}</span>`}</td>
    </tr>`).join("")}</tbody></table>`;
}

function option(value: string, label = value): string {
  return `<option value="${esc(value)}">${esc(label)}</option>`;
}

function confidenceOptions(): string {
  return `<option value="">not recorded</option>${[1, 2, 3, 4, 5].map((n) => option(String(n), `${n} / 5`)).join("")}`;
}

function localDateTime(): string {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function attemptForm(): string {
  const patterns = [...PATTERNS].sort((a, b) => a.n.localeCompare(b.n));
  return `<section class="mastery-ledger">
    <div class="mastery-section-head">
      <div><span class="subtle">append-only attempt ledger</span><h3>Log evidence, not a verdict.</h3></div>
      <p>Entries cannot be edited or deleted here. A later attempt corrects the record without rewriting it.</p>
    </div>
    <div class="mastery-form">
      <label><span>pattern</span><select id="maPattern">${patterns.map((p) => option(p.n)).join("")}</select></label>
      <label><span>problem #</span><input id="maProblem" type="number" min="1" placeholder="560"></label>
      <label><span>attempt</span><select id="maKind">${option("first-solve", "first solve")}${option("re-solve", "re-solve")}${option("retention", "retention check")}</select></label>
      <label><span>when</span><input id="maWhen" type="datetime-local" value="${localDateTime()}"></label>
      <label><span>outcome</span><select id="maOutcome">${option("pass")}${option("partial")}${option("fail")}</select></label>
      <label><span>help used</span><select id="maAssistance">${option("none")}${option("notes")}${option("hint")}${option("solution", "editorial / solution")}</select></label>
      <label><span>retention checkpoint</span><select id="maRetention"><option value="">not a checkpoint</option>${[3, 7, 14, 30].map((n) => option(String(n), `day ${n}`)).join("")}</select></label>
      <label><span>pattern recognition · sec</span><input id="maRecognition" type="number" min="0" step="1" placeholder="75"></label>
      <label><span>working code · min</span><input id="maCodeTime" type="number" min="0" step="0.5" placeholder="24"></label>
      <label><span>first-pass success</span><select id="maFirstPass"><option value="">not recorded</option>${option("yes", "yes")}${option("no", "no")}</select></label>
      <label><span>mistake category</span><select id="maMistake">${["none", "recognition", "approach", "implementation", "complexity", "edge-case", "syntax"].map((v) => option(v)).join("")}</select></label>
      <label><span>code hash · optional</span><input id="maCodeHash" type="text" maxlength="128" placeholder="git/blob/SHA fingerprint"></label>
      <label><span>code recall</span><select id="maCodeOrigin">${option("unknown")}${option("changed", "changed / reconstructed")}${option("memorized", "recognisably memorized")}</select></label>
      <label><span>confidence before</span><select id="maConfidenceBefore">${confidenceOptions()}</select></label>
      <label><span>confidence after</span><select id="maConfidenceAfter">${confidenceOptions()}</select></label>
      <div class="mastery-checks">
        <label><input id="maWithoutNotes" type="checkbox"><span>re-solved without notes</span></label>
      </div>
      <div class="mastery-submit">
        <button class="btn on" id="maAppend">append attempt</button>
        <span id="maStatus">${esc(flash)}</span>
      </div>
    </div>
  </section>`;
}

function patternRows(cov: PatternCoverage[]): string {
  const sorted = [...cov].sort((a, b) =>
    stageIndex(a.stage) - stageIndex(b.stage) || a.pattern.n.localeCompare(b.pattern.n),
  );
  return `<table class="gaptable mastery-table">
    <thead><tr><th>pattern</th><th>stage</th><th>evidence</th><th>recognise / code</th><th>first pass</th><th>code</th><th>retention</th><th>next gate</th></tr></thead>
    <tbody>${sorted.map((c) => `<tr>
      <td><button class="linkish" data-gopat="${esc(c.pattern.n)}">${esc(c.pattern.n)}</button><small>${esc(topicName(c.pattern.t))}</small></td>
      <td>${stageBadge(c.stage)}</td>
      <td><b>${c.mastery.attempts.length}</b> logged · ${c.mastery.successfulIndependentResolves} independent
        <small>first solve: ${esc(fmtDate(c.mastery.firstSolveAt))} · ${c.solvedAnchors.length} repo anchor${c.solvedAnchors.length === 1 ? "" : "s"}</small>
        <small>${c.mastery.topMistake ? `top miss: ${esc(c.mastery.topMistake)}` : "no mistakes logged"} · confidence Δ ${c.mastery.confidenceDelta === null ? "—" : `${c.mastery.confidenceDelta >= 0 ? "+" : ""}${c.mastery.confidenceDelta.toFixed(1)}`}</small></td>
      <td>${fmtSeconds(c.mastery.latestRecognitionSeconds)} / ${fmtSeconds(c.mastery.latestWorkingCodeSeconds)}</td>
      <td>${c.mastery.firstPassRate === null ? "—" : `${Math.round(c.mastery.firstPassRate * 100)}%`}</td>
      <td>${esc(c.mastery.codeSignal)}</td>
      <td>${retentionStrip(c)}</td>
      <td>${esc(c.mastery.nextAction)}</td>
    </tr>`).join("")}</tbody>
  </table>`;
}

function attemptRows(attempts: readonly MasteryAttempt[]): string {
  if (!attempts.length) return `<div class="card"><p class="muted">No measured attempts yet. Repository solves appear as exposure in the table above; log the next re-solve here.</p></div>`;
  return `<div class="attempt-history-note">Showing the latest ${Math.min(20, attempts.length)} of ${attempts.length} immutable entries.</div>
    <table class="gaptable attempt-history"><thead><tr><th>when</th><th>pattern / problem</th><th>attempt</th><th>result</th><th>timing</th><th>process evidence</th><th>confidence</th></tr></thead>
    <tbody>${[...attempts].reverse().slice(0, 20).map((a) => `<tr>
      <td><time datetime="${esc(a.attemptedAt)}">${esc(new Date(a.attemptedAt).toLocaleDateString())}</time><small>${esc(a.source)}</small></td>
      <td><b>${esc(a.pattern)}</b><small>${a.problemNumber ? `LC ${a.problemNumber}` : "no problem id"}</small></td>
      <td>${esc(a.kind)}${a.retentionDay ? `<small>day ${a.retentionDay}</small>` : ""}</td>
      <td>${esc(a.outcome)}<small>${a.firstPass === null ? "first pass unknown" : a.firstPass ? "first pass" : "needed correction"}</small></td>
      <td>${fmtSeconds(a.recognitionSeconds)} / ${fmtSeconds(a.workingCodeSeconds)}</td>
      <td>${a.withoutNotes ? "no notes" : esc(a.assistance)} · ${esc(a.codeOrigin)}<small>${esc(a.mistakeCategory)}</small></td>
      <td>${a.confidenceBefore ?? "—"} → ${a.confidenceAfter ?? "—"}</td>
    </tr>`).join("")}</tbody></table>`;
}

function readNumber(id: string): number | null {
  const raw = (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null)?.value ?? "";
  if (!raw.trim()) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function appendFromForm(): void {
  const value = (id: string): string => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement).value;
  const kind = value("maKind") as AttemptKind;
  const retentionDay = readNumber("maRetention") as RetentionDay | null;
  if (kind === "retention" && retentionDay === null) {
    const status = document.getElementById("maStatus");
    if (status) status.textContent = "Choose day 3, 7, 14, or 30 for a retention attempt.";
    return;
  }
  const when = value("maWhen");
  const firstPass = value("maFirstPass");
  const problem = readNumber("maProblem");
  const codeTime = readNumber("maCodeTime");
  const attempt: MasteryAttempt = {
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    pattern: value("maPattern"),
    problemNumber: problem === null ? null : Math.max(1, Math.round(problem)),
    attemptedAt: when ? new Date(when).toISOString() : new Date().toISOString(),
    source: "manual",
    kind,
    outcome: value("maOutcome") as AttemptOutcome,
    assistance: value("maAssistance") as Assistance,
    withoutNotes: (document.getElementById("maWithoutNotes") as HTMLInputElement).checked,
    recognitionSeconds: readNumber("maRecognition"),
    workingCodeSeconds: codeTime === null ? null : codeTime * 60,
    codeHash: value("maCodeHash").trim() || null,
    codeOrigin: value("maCodeOrigin") as CodeOrigin,
    firstPass: firstPass === "" ? null : firstPass === "yes",
    mistakeCategory: value("maMistake") as MistakeCategory,
    confidenceBefore: readNumber("maConfidenceBefore"),
    confidenceAfter: readNumber("maConfidenceAfter"),
    retentionDay: kind === "retention" ? retentionDay : null,
  };
  appendAttemptHistory([attempt]);
  flash = `Attempt appended at ${new Date(attempt.attemptedAt).toLocaleString()}.`;
  renderProgress();
}

export function renderProgress(): void {
  const host = document.getElementById("v-progress");
  if (!host) return;

  const h = headline();
  const cov = patternCoverage();
  const topics = topicCoverage().sort((a, b) => a.mastery / a.patterns - b.mastery / b.patterns);
  const attempts = readAttemptHistory();
  const unmapped = unmappedFamilies();
  const syncedCommit = PROGRESS_SYNC.sourceCommit.slice(0, 7);
  const counts = Object.fromEntries(MASTERY_STAGES.map((stage) => [stage, cov.filter((c) => c.stage === stage).length])) as Record<MasteryStage, number>;
  const companyOpts = COMPANIES.map((c) => option(c.id, c.name)).join("");

  host.innerHTML = `
    <div class="tag"><i></i><span>mastery // what your attempts can actually prove</span></div>
    <h2 class="mod">${h.patternsUnseen} unseen.<br><em>${h.patternsInterviewReady} interview-ready.</em></h2>
    <p class="syncstamp">Repository exposure synced through
      <a href="${PROGRESS_REPO}/commit/${PROGRESS_SYNC.sourceCommit}" target="_blank" rel="noopener"><code>${syncedCommit}</code></a>
      · <time datetime="${PROGRESS_SYNC.generatedAt}">${progressSyncAge()}</time>
    </p>
    <p class="lede">${PROGRESS_COUNTS.total} accepted problems are useful history, but acceptance alone only earns <b>exposed</b>. The higher stages come from measured re-solves and retention checks stored in this browser.</p>

    <div class="mastery-funnel">${MASTERY_STAGES.map((stage, index) => `<div class="mastery-funnel-step ms-${stage}"><span>${index + 1}</span><b>${counts[stage]}</b><small>${stageLabel(stage)}</small></div>`).join("")}</div>

    <div class="callout mastery-rules">
      <b>The gates are intentionally hard.</b>
      <span><strong>exposed</strong> accepted once or attempted</span>
      <span><strong>assisted</strong> passed with notes, a hint, or a solution</span>
      <span><strong>independent</strong> passed a re-solve without notes, help, or memorised code</span>
      <span><strong>retained</strong> passed an independent check at day 7 or later</span>
      <span><strong>interview-ready</strong> passed day 30 on the first try, recognised ≤2m, coded ≤30m, confidence ≥4</span>
    </div>

    ${attemptForm()}

    <h3>Pattern mastery</h3>
    <p class="muted">The 3 / 7 / 14 / 30 cells show retention state: locked, upcoming, due, passed, or failed. A failed later attempt stays in history; it never disappears behind a green check.</p>
    <div class="mastery-table-wrap">${patternRows(cov)}</div>

    <h3>Attempt history</h3>
    ${attemptRows(attempts)}

    <h3>Where mastery is thin, by topic</h3>
    <table class="gaptable"><thead><tr><th>topic</th><th>exposed</th><th>independent</th><th>retained</th><th>interview-ready</th><th>mastery</th></tr></thead>
      <tbody>${topics.map((t) => `<tr class="${t.touched === 0 ? "row-bad" : ""}"><td>${esc(topicName(t.topic))}</td><td>${t.touched}/${t.patterns}</td><td>${t.independent}</td><td>${t.retained}</td><td>${t.interviewReady}</td><td style="width:140px">${bar(t.mastery, t.patterns)}</td></tr>`).join("")}</tbody>
    </table>

    <h3>What evidence to build next — across all ${COMPANIES.length} companies</h3>
    ${gapRows(gapsOverall(COMPANIES), "company demand")}

    <h3>What evidence to build next — for one company</h3>
    <p><label>Target: <select id="gapco">${companyOpts}</select></label></p><div id="gapone"></div>

    <h3>Repository anchors</h3>
    <p class="muted">These links prove exposure and give you a re-solve target. They do not, by themselves, prove mastery.</p>
    <div class="metgrid">${cov.filter((c) => c.solvedAnchors.length).sort((a, b) => b.solvedAnchors.length - a.solvedAnchors.length).map((c) => `<div class="met">
      <button class="linkish" data-gopat="${esc(c.pattern.n)}"><b>${esc(c.pattern.n)}</b></button>${stageBadge(c.stage)}
      <span class="muted">${c.solvedAnchors.length}/${c.pattern.lc?.length ?? 0} anchors accepted</span>
      <div class="metlinks">${c.solvedAnchors.map((e) => `<a href="${e.notes ? notesUrl(e) : solutionUrl(e)}" target="_blank" rel="noopener" title="${esc(e.label || e.family)}">${e.num}</a>`).join(" ")}</div>
    </div>`).join("")}</div>

    ${unmapped.length ? `<div class="callout warn"><b>Unmapped families:</b> ${unmapped.map(esc).join(", ")}.</div>` : ""}
  `;

  document.getElementById("maAppend")?.addEventListener("click", appendFromForm);
  const kind = document.getElementById("maKind") as HTMLSelectElement | null;
  const retention = document.getElementById("maRetention") as HTMLSelectElement | null;
  if (kind && retention) kind.onchange = () => { if (kind.value !== "retention") retention.value = ""; };

  const sel = document.getElementById("gapco") as HTMLSelectElement | null;
  const one = document.getElementById("gapone");
  const draw = (): void => {
    if (!sel || !one) return;
    const co = COMPANIES.find((c) => c.id === sel.value);
    one.innerHTML = co ? `<p class="muted">${esc(co.name)} — ranked by demand and missing mastery evidence.</p>${gapRows(gapsFor(co), "their weight")}` : "";
    bindPatternLinks(one);
  };
  if (sel) { sel.onchange = draw; draw(); }
  bindPatternLinks(host);
}

function bindPatternLinks(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>("[data-gopat]").forEach((el) => {
    el.onclick = () => {
      showView("patterns");
      const q = document.getElementById("pq") as HTMLInputElement | null;
      if (q) { q.value = el.dataset.gopat ?? ""; q.dispatchEvent(new Event("input")); }
    };
  });
}

export function initProgress(): void {
  try {
    renderProgress();
  } catch (err) {
    const host = document.getElementById("v-progress");
    if (host) host.innerHTML = `<h2>Mastery</h2><div class="callout warn">Could not read mastery data: ${esc(String(err))}.</div>`;
  }
}
