import { COMPANIES } from "../data/companies";
import { PATTERNS, TOPICS } from "../data/index";
import { patternCoverage } from "../data/progress";
import { SOLVED } from "../data/progress.generated";
import {
  buildArenaReport,
  generateArenaSession,
  scoreArenaAttempt,
  type ArenaCompileResult,
  type ArenaConfig,
  type ArenaCorrectness,
  type ArenaDraft,
  type ArenaEvent,
  type ArenaMode,
  type ArenaRecoveryStep,
  type ArenaRunResult,
  type ArenaSession,
} from "../lib/arena";
import { $, $$, esc, store } from "../lib/dom";
import { appendAttemptHistory, codeFingerprint, type MasteryAttempt, type MistakeCategory } from "../lib/mastery";
import { readLog, writeLogEntries } from "./mistakes";
import { showView } from "./router";
import type { Lang, Problem, TopicId } from "../types";

interface RecoveryQueue {
  sourceSessionId: string;
  companyId: string;
  config: ArenaConfig;
  scheduledFor: string;
  patternNames: readonly string[];
  totalMinutes: number;
  challenges?: readonly { patternName: string; problem: Problem }[];
}

const MODE_LABELS: Record<ArenaMode, string> = {
  executable: "executable",
  whiteboard: "whiteboard",
  "staged-oa": "staged OA",
};

const EMPTY_DRAFT = (): ArenaDraft => ({
  patternGuess: "",
  patternIdentifiedSec: null,
  complexityChoice: "",
  complexityLocked: false,
  complexityLockedBeforeCode: true,
  code: "",
  hints: 0,
});

const topicName = (id: TopicId): string => TOPICS.find(([topic]) => topic === id)?.[1] ?? id;
const elapsedSec = (session: ArenaSession, now = Date.now()): number => Math.max(0, Math.round((now - session.startedAt) / 1000));
const formatClock = (seconds: number): string => `${Math.floor(seconds / 60)}:${String(Math.max(0, seconds % 60)).padStart(2, "0")}`;

function languageLabel(language: Lang): string {
  return { py: "Python", cpp: "C++", java: "Java" }[language];
}

function challengeStartSec(session: ArenaSession): number {
  const id = session.challenges[session.activeIndex]?.id;
  return [...session.events].reverse().find((event) => event.kind === "challenge-started" && event.challengeId === id)?.atSec ?? 0;
}

function appendEvent(session: ArenaSession, event: Omit<ArenaEvent, "atSec"> & { atSec?: number }): ArenaSession {
  return {
    ...session,
    events: [...session.events, { ...event, atSec: event.atSec ?? elapsedSec(session) }],
  };
}

function persist(session: ArenaSession): void {
  store("arenaActive", session);
}

function setupDate(): string {
  return new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);
}

function setupView(): string {
  const targets = store<string[]>("targets") ?? [];
  const selectedCompany = targets.find((id) => COMPANIES.some((company) => company.id === id)) ?? "google";
  const interviewDates = store<Record<string, string>>("interviewDates") ?? {};
  const language = (store<Lang>("lang") ?? "py") as Lang;
  const queue = store<RecoveryQueue>("arenaRecovery");
  const history = store<ArenaSession[]>("arenaHistory") ?? [];

  return `
    <div class="arena-hero">
      <div>
        <div class="tag"><i></i><span>interview arena // the closed training loop</span></div>
        <h2 class="mod">Train the round.<br><em>Not the answer.</em></h2>
        <p class="brief">Generate a company-shaped set from their topic weights and your actual blind spots. The score gives only <b>12 points to final correctness</b>; recognition, pre-code complexity, first runs, edges, independence, compile rate, and proof make up the rest.</p>
      </div>
      <div class="arena-loop" aria-label="training loop">
        <span>generate</span><b>→</b><span>perform</span><b>→</b><span>debrief</span><b>→</b><span>recover</span>
      </div>
    </div>

    ${queue?.patternNames.length ? `<div class="arena-recovery-banner">
      <div><span class="arena-eyebrow">recovery ready · ${esc(queue.scheduledFor)}</span>
      <b>${queue.patternNames.map(esc).join(" · ")}</b>
      <small>${queue.totalMinutes} minutes · generated from your last weak signals</small></div>
      <button class="btn on" id="arenaStartRecovery">start recovery</button>
    </div>` : ""}

    <div class="arena-setup-grid">
      <form class="arena-form" id="arenaSetup">
        <div class="console-bar"><span class="led"></span><span>round parameters</span></div>
        <div class="arena-form-body">
          <label><span>company</span><select id="arenaCompany">
            ${COMPANIES.map((company) => `<option value="${esc(company.id)}"${company.id === selectedCompany ? " selected" : ""}>${esc(company.name)}</option>`).join("")}
          </select></label>
          <label><span>role</span><input type="text" id="arenaRole" value="Software Engineer" placeholder="Backend SWE, New Grad, Data / ML…"></label>
          <label><span>interview date</span><input type="date" id="arenaDate" value="${esc(interviewDates[selectedCompany] ?? setupDate())}"></label>
          <label><span>language</span><select id="arenaLanguage">
            <option value="py"${language === "py" ? " selected" : ""}>Python</option>
            <option value="cpp"${language === "cpp" ? " selected" : ""}>C++</option>
            <option value="java"${language === "java" ? " selected" : ""}>Java</option>
          </select></label>
          <label><span>duration</span><select id="arenaDuration">
            ${[30, 45, 60, 75, 90, 120].map((minutes) => `<option value="${minutes}"${minutes === 90 ? " selected" : ""}>${minutes} minutes</option>`).join("")}
          </select></label>
        </div>

        <fieldset class="arena-modes">
          <legend>round mode</legend>
          <label><input type="radio" name="arenaMode" value="executable" checked><span><b>Executable</b><small>Use the platform editor. Runs and first-submit behavior count.</small></span></label>
          <label><input type="radio" name="arenaMode" value="whiteboard"><span><b>Whiteboard</b><small>No running until commit. Compile cleanliness becomes visible.</small></span></label>
          <label><input type="radio" name="arenaMode" value="staged-oa"><span><b>Staged OA</b><small>Sequential unlocks. No revisiting a submitted stage.</small></span></label>
        </fieldset>
        <div class="arena-form-action">
          <button class="btn on" type="submit">generate interview set →</button>
          <span id="arenaSetupHint">Uses company × coverage × recall × mistake signals.</span>
        </div>
      </form>

      <aside class="arena-contract">
        <div class="arena-eyebrow">the scoring contract</div>
        <div class="arena-contract-total"><b>100</b><span>process-weighted points</span></div>
        ${[
          ["14", "identify the pattern"], ["14", "lock complexity first"], ["12", "first-run correctness"],
          ["12", "surface edge cases"], ["10", "avoid hints"], ["10", "compile cleanly"],
          ["16", "explain / prove"], ["12", "final correctness"],
        ].map(([points, label]) => `<div class="arena-contract-row"><b>${points}</b><span>${label}</span></div>`).join("")}
        <p>The Arena records evidence; it does not pretend to replace the external judge or interviewer.</p>
      </aside>
    </div>

    ${history.length ? `<div class="arena-history">
      <div class="arena-section-head"><div><span class="arena-eyebrow">recent rounds</span><h3>Replay shelf</h3></div></div>
      <div class="arena-history-grid">${history.slice(0, 4).map((session) => `
        <button data-arena-history="${esc(session.id)}">
          <span>${esc(session.companyName)} · ${esc(MODE_LABELS[session.config.mode])}</span>
          <b>${session.report?.score ?? "—"}<small>/100</small></b>
          <em>${session.report?.weakPatternNames.length ?? 0} weak patterns · ${new Date(session.startedAt).toLocaleDateString()}</em>
        </button>`).join("")}</div>
    </div>` : ""}`;
}

function modeInstruction(mode: ArenaMode): string {
  if (mode === "whiteboard") return "Write the complete solution without executing it. Compile only after you commit.";
  if (mode === "staged-oa") return "This stage locks when submitted. You will not see the debrief until the set is complete.";
  return "Work in the linked judge or your normal executable editor. Record the real first-run result here.";
}

function hintContent(session: ArenaSession): string {
  const challenge = session.challenges[session.activeIndex]!;
  const hints = session.draft?.hints ?? 0;
  if (!hints) return `<p>Hints are progressive and each use is recorded.</p>`;
  return `<ol>
    ${hints >= 1 ? `<li><b>Recognition cue</b><span>${esc(challenge.signal)}</span></li>` : ""}
    ${hints >= 2 ? `<li><b>Pattern family</b><span>${esc(topicName(challenge.topic))} · ${esc(challenge.patternName)}</span></li>` : ""}
    ${hints >= 3 ? `<li><b>Failure mode</b><span>${esc(challenge.trap)}</span></li>` : ""}
  </ol>`;
}

function activeView(session: ArenaSession): string {
  const challenge = session.challenges[session.activeIndex]!;
  const draft = session.draft ?? EMPTY_DRAFT();
  const problemHref = challenge.problem[1] ? `https://leetcode.com/problems/${encodeURIComponent(challenge.problem[1])}/` : "#";
  const mode = session.config.mode;
  const stages = session.challenges.map((item, index) => `<span class="${index < session.activeIndex ? "done" : index === session.activeIndex ? "on" : ""}"><i></i>${mode === "staged-oa" ? `S${item.stage}` : `Q${item.stage}`}</span>`).join("");

  return `
    <div class="arena-session-bar">
      <div><span class="arena-eyebrow">${esc(session.companyName)} · ${esc(session.config.role)}</span>
        <b>${esc(MODE_LABELS[mode])} · ${languageLabel(session.config.language)} · ${session.config.durationMin}m</b></div>
      <div class="arena-clock"><span>round clock</span><b id="arenaClock">0:00</b></div>
      <button class="btn" id="arenaExit">exit & keep progress</button>
    </div>
    <div class="arena-stage-rail">${stages}</div>

    <div class="arena-question-head">
      <div><span class="arena-eyebrow">${mode === "staged-oa" ? "stage" : "question"} ${challenge.stage} / ${session.challenges.length} · ${challenge.budgetMin}m budget</span>
        <h2>LC ${challenge.problem[0]}<br><em>${esc(challenge.problem[2])}</em></h2></div>
      <a class="btn on" href="${problemHref}" target="_blank" rel="noopener">open original prompt ↗</a>
    </div>
    <div class="arena-mode-note"><b>${esc(MODE_LABELS[mode])} rules.</b> ${esc(modeInstruction(mode))}</div>

    <div class="arena-workspace">
      <main>
        <section class="arena-gate ${draft.patternIdentifiedSec !== null ? "locked" : ""}">
          <div class="arena-stepno">01</div>
          <div><span class="arena-eyebrow">recognition gate</span><h3>What pattern is this?</h3>
            <p>Say it before touching implementation. The clock stops for this metric when you lock.</p>
            <div class="arena-lock-row">
              <input type="text" id="arenaPatternGuess" value="${esc(draft.patternGuess)}" placeholder="e.g. prefix sum + hash map" ${draft.patternIdentifiedSec !== null ? "disabled" : ""}>
              <button class="btn${draft.patternIdentifiedSec !== null ? "" : " on"}" id="arenaLockPattern" ${draft.patternIdentifiedSec !== null ? "disabled" : ""}>${draft.patternIdentifiedSec !== null ? `locked · ${Math.round(draft.patternIdentifiedSec)}s` : "lock pattern"}</button>
            </div>
          </div>
        </section>

        <section class="arena-gate ${draft.complexityLocked ? "locked" : ""} ${draft.patternIdentifiedSec === null ? "disabled" : ""}">
          <div class="arena-stepno">02</div>
          <div><span class="arena-eyebrow">complexity gate</span><h3>Choose the budget before code.</h3>
            <p>State the target time complexity. You will see the expected answer only in the replay.</p>
            <div class="arena-lock-row">
              <input type="text" id="arenaComplexity" value="${esc(draft.complexityChoice)}" placeholder="e.g. O(n log n)" ${draft.complexityLocked || draft.patternIdentifiedSec === null ? "disabled" : ""}>
              <button class="btn${draft.complexityLocked ? "" : " on"}" id="arenaLockComplexity" ${draft.complexityLocked || draft.patternIdentifiedSec === null ? "disabled" : ""}>${draft.complexityLocked ? "complexity locked" : "lock complexity"}</button>
            </div>
          </div>
        </section>

        <section class="arena-code ${draft.complexityLocked ? "" : "disabled"}">
          <div class="arena-code-bar"><span>${languageLabel(session.config.language)} solution · ${mode === "whiteboard" ? "no execution" : "working copy"}</span><span id="arenaCodeCount">${draft.code.length} chars</span></div>
          <textarea id="arenaCode" spellcheck="false" placeholder="Lock your pattern and complexity first…" ${draft.complexityLocked ? "" : "disabled"}>${esc(draft.code)}</textarea>
        </section>

        <section class="arena-eval ${draft.complexityLocked ? "" : "disabled"}">
          <div class="arena-section-head"><div><span class="arena-eyebrow">evidence card</span><h3>Record what actually happened.</h3></div><span>required fields are marked *</span></div>
          <div class="arena-eval-grid">
            <fieldset><legend>final correctness *</legend>
              ${radioGroup("arenaCorrectness", [["pass", "correct"], ["partial", "partial"], ["fail", "failed"]])}
            </fieldset>
            <fieldset><legend>first run / submit *</legend>
              ${radioGroup("arenaFirstRun", [["pass", "passed"], ["partial", "some failed"], ["fail", "failed"], ["not-run", "not run"]])}
            </fieldset>
            <label><span>post-commit compile *</span><select id="arenaCompile"><option value="">choose…</option>
              <option value="clean">clean first compile</option><option value="minor-fix">minor syntax fix</option><option value="fail">did not compile</option><option value="not-checked">not checked</option>
            </select></label>
            <label><span>edge cases found · one per line</span><textarea id="arenaEdges" placeholder="empty input&#10;single element&#10;duplicate values"></textarea></label>
          </div>
          <fieldset class="arena-rubric"><legend>explanation / proof quality</legend>
            <label><input type="checkbox" id="arenaInvariant"> stated the invariant</label>
            <label><input type="checkbox" id="arenaExplainComplexity"> justified complexity</label>
            <label><input type="checkbox" id="arenaProof"> gave a correctness argument</label>
            <label><input type="checkbox" id="arenaTradeoff"> compared an alternative</label>
          </fieldset>
          <label class="arena-wide-label"><span>explanation notes</span><textarea id="arenaExplanation" placeholder="The invariant, why each step preserves it, and why the final state answers the question…"></textarea></label>
          <label class="arena-wide-label"><span>signal you missed · optional</span><input type="text" id="arenaMissedSignal" placeholder="Leave blank and Arena will derive one if the attempt is weak."></label>
          <div class="arena-submit-row"><span id="arenaSubmitHint"></span><button class="btn on" id="arenaSubmitChallenge">${session.activeIndex === session.challenges.length - 1 ? "finish & close the loop →" : mode === "staged-oa" ? "submit & unlock next stage →" : "submit & next question →"}</button></div>
        </section>
      </main>

      <aside class="arena-hints">
        <div class="arena-eyebrow">interviewer channel</div>
        <h3>${draft.hints ? `${draft.hints} hint${draft.hints === 1 ? "" : "s"} used` : "Ask only when stuck."}</h3>
        <div id="arenaHintBody">${hintContent(session)}</div>
        <button class="btn" id="arenaHint" ${draft.hints >= 3 ? "disabled" : ""}>request hint ${Math.min(3, draft.hints + 1)} / 3</button>
        <small>Every request enters the replay timeline.</small>
      </aside>
    </div>`;
}

function radioGroup(name: string, values: readonly (readonly [string, string])[]): string {
  return `<div class="arena-choice-row">${values.map(([value, label]) => `<label><input type="radio" name="${name}" value="${value}"><span>${label}</span></label>`).join("")}</div>`;
}

function eventLabel(event: ArenaEvent): string {
  return {
    "session-started": "Round started",
    "challenge-started": "Question opened",
    "pattern-locked": "Pattern locked",
    "complexity-locked": "Complexity locked",
    "hint-used": "Hint requested",
    "challenge-submitted": "Question submitted",
    "session-completed": "Round closed",
  }[event.kind];
}

function recoveryRows(steps: readonly ArenaRecoveryStep[]): string {
  return steps.map((step) => `<div><b>${step.minutes}m</b><span><strong>${esc(step.patternName)}</strong>${esc(step.action)}</span></div>`).join("");
}

function reportView(session: ArenaSession): string {
  const report = session.report!;
  const grade = report.score >= 85 ? "round ready" : report.score >= 70 ? "close, not stable" : "recovery required";
  const eventChallenge = new Map(session.challenges.map((challenge) => [challenge.id, challenge]));
  return `
    <div class="arena-report-hero">
      <div><div class="tag"><i></i><span>debrief // ${esc(session.companyName)} · ${esc(MODE_LABELS[session.config.mode])}</span></div>
        <h2 class="mod">${report.score}<em>/100</em></h2><p>${grade}</p></div>
      <div class="arena-report-actions"><button class="btn" id="arenaDownloadReplay">download replay</button><button class="btn" id="arenaNew">new arena</button></div>
    </div>

    <div class="arena-loop-result">
      <div><span>mistake log</span><b>${report.generatedMistakes.length}</b><small>missed signals added</small></div>
      <div><span>rescheduled</span><b>${report.weakPatternNames.length}</b><small>weak patterns due now</small></div>
      <div><span>replay</span><b>${report.replay.length}</b><small>timestamped events</small></div>
      <div><span>recovery</span><b>${report.recovery.totalMinutes}m</b><small>ready for ${esc(report.recovery.scheduledFor)}</small></div>
    </div>

    <section class="arena-report-section">
      <div class="arena-section-head"><div><span class="arena-eyebrow">score anatomy</span><h3>Correctness was only 12 points.</h3></div></div>
      <div class="arena-metric-grid">${report.aggregateMetrics.map((metric) => `<div>
        <span>${esc(metric.label)}</span><b>${metric.earned}<small>/${metric.max}</small></b>
        <i><em style="width:${Math.round((metric.earned / metric.max) * 100)}%"></em></i><p>${esc(metric.note)}</p>
      </div>`).join("")}</div>
    </section>

    <section class="arena-report-section">
      <div class="arena-section-head"><div><span class="arena-eyebrow">attempt replay</span><h3>Where the round moved.</h3></div></div>
      <div class="arena-attempts">${session.attempts.map((attempt, index) => {
        const challenge = eventChallenge.get(attempt.challengeId)!;
        const scored = report.attemptScores[index]!;
        return `<article>
          <div class="arena-attempt-score"><span>${scored.weak ? "weak signal" : "held up"}</span><b>${scored.score}<small>/100</small></b></div>
          <div><span class="arena-eyebrow">LC ${challenge.problem[0]} · ${esc(topicName(challenge.topic))}</span><h4>${esc(challenge.problem[2])}</h4>
            <p><b>Pattern:</b> ${esc(attempt.patternGuess)} → <strong>${esc(challenge.patternName)}</strong> in ${Math.round(attempt.patternIdentifiedSec)}s</p>
            <p><b>Complexity:</b> ${esc(attempt.complexityChoice)} → <strong>${esc(challenge.expectedTime)}</strong></p>
            <p><b>Outcome:</b> ${esc(attempt.correctness)} · ${esc(attempt.firstRun)} first run · ${attempt.edgeCases.length} edges · ${attempt.hints} hints · ${esc(attempt.compileResult)}</p>
            <details><summary>show rubric and reference signals</summary><p>${esc(challenge.signal)}</p><p><b>Proof guide:</b> ${esc(challenge.proofGuide)}</p></details>
          </div>
        </article>`;
      }).join("")}</div>
    </section>

    <section class="arena-report-section arena-replay">
      <div class="arena-section-head"><div><span class="arena-eyebrow">timestamped replay</span><h3>The sequence, not the story.</h3></div></div>
      <div class="arena-timeline">${report.replay.map((event) => `<div><time>${formatClock(event.atSec)}</time><i></i><span><b>${eventLabel(event)}</b>${event.detail ? esc(event.detail) : event.challengeId ? esc(eventChallenge.get(event.challengeId)?.problem[2] ?? "") : ""}</span></div>`).join("")}</div>
    </section>

    <section class="arena-recovery-card">
      <div><span class="arena-eyebrow">next recovery · ${esc(report.recovery.scheduledFor)}</span><h3>${report.weakPatternNames.length ? "The next session is already built." : "No weak-pattern recovery needed."}</h3>
        <p>${report.weakPatternNames.length ? `${report.recovery.totalMinutes} minutes focused only on ${report.weakPatternNames.map(esc).join(", ")}.` : "Every pattern cleared the process bar. Generate a fresh company-weighted set when ready."}</p></div>
      ${report.recovery.steps.length ? `<div class="arena-recovery-steps">${recoveryRows(report.recovery.steps)}</div><button class="btn on" id="arenaLaunchRecovery">start recovery session →</button>` : ""}
    </section>`;
}

function historySession(id: string): ArenaSession | null {
  return (store<ArenaSession[]>("arenaHistory") ?? []).find((session) => session.id === id) ?? null;
}

function createSession(config: ArenaConfig, forcedPatternNames?: readonly string[]): ArenaSession | null {
  const company = COMPANIES.find((candidate) => candidate.id === config.companyId);
  if (!company) return null;
  const coverage = Object.fromEntries(patternCoverage().map((row) => [row.pattern.n, { ratio: row.ratio, openAnchors: row.openAnchors }]));
  const session = generateArenaSession({
    config,
    company,
    patterns: PATTERNS,
    coverage,
    confidences: store<Record<string, "ok" | "weak">>("conf") ?? {},
    boxes: store<Record<string, number | { box: number; due: number }>>("boxes") ?? {},
    mistakes: readLog(),
    forcedPatternNames,
  });
  session.draft = EMPTY_DRAFT();
  persist(session);
  return session;
}

function applyClosedLoop(session: ArenaSession): void {
  const report = session.report!;
  writeLogEntries(report.generatedMistakes.map((mistake, index) => ({
    id: `${session.id}-miss-${index}`,
    date: new Date(session.completedAt ?? Date.now()).toISOString().slice(0, 10),
    topic: mistake.topic,
    pattern: mistake.pattern,
    signal: mistake.signal,
    problem: mistake.problem,
    reviews: 0,
  })));

  const boxes = store<Record<string, number | { box: number; due: number }>>("boxes") ?? {};
  store("boxes", { ...boxes, ...report.boxUpdates });

  const solvedNumbers = new Set(SOLVED.map((entry) => entry.num));
  const masteryAttempts: MasteryAttempt[] = session.attempts.map((attempt, index) => {
    const challenge = session.challenges.find((candidate) => candidate.id === attempt.challengeId)!;
    const scored = report.attemptScores[index]!;
    const patternMetric = scored.metrics.find((metric) => metric.key === "pattern");
    const started = [...session.events]
      .reverse()
      .find((event) => event.kind === "challenge-started" && event.challengeId === attempt.challengeId)?.atSec ?? 0;
    let mistakeCategory: MistakeCategory = "none";
    if (patternMetric && patternMetric.earned < patternMetric.max) mistakeCategory = "recognition";
    else if (attempt.hints > 0) mistakeCategory = "approach";
    else if (attempt.firstRun !== "pass" || attempt.correctness !== "pass") mistakeCategory = "implementation";
    else if (attempt.edgeCases.length === 0) mistakeCategory = "edge-case";
    return {
      id: `${session.id}-mastery-${attempt.challengeId}`,
      pattern: challenge.patternName,
      problemNumber: challenge.problem[0],
      attemptedAt: new Date(session.startedAt + attempt.submittedAtSec * 1_000).toISOString(),
      source: "arena",
      kind: solvedNumbers.has(challenge.problem[0]) ? "re-solve" : "first-solve",
      outcome: attempt.correctness,
      assistance: attempt.hints > 0 ? "hint" : "none",
      withoutNotes: attempt.hints === 0,
      recognitionSeconds: attempt.patternIdentifiedSec,
      workingCodeSeconds: Math.max(0, attempt.submittedAtSec - started),
      codeHash: codeFingerprint(attempt.code),
      codeOrigin: "unknown",
      firstPass: attempt.firstRun === "not-run" ? null : attempt.firstRun === "pass",
      mistakeCategory,
      confidenceBefore: null,
      confidenceAfter: null,
      retentionDay: null,
    };
  });
  appendAttemptHistory(masteryAttempts);

  if (session.config.mode === "whiteboard") {
    const wb = store<{ tries: number; first: number }>("wb") ?? { tries: 0, first: 0 };
    for (const attempt of session.attempts) {
      wb.tries++;
      if (attempt.compileResult === "clean") wb.first++;
    }
    store("wb", wb);
  }

  const history = (store<ArenaSession[]>("arenaHistory") ?? []).filter((candidate) => candidate.id !== session.id);
  store("arenaHistory", [session, ...history].slice(0, 12));
  store<RecoveryQueue>("arenaRecovery", {
    sourceSessionId: session.id,
    companyId: session.config.companyId,
    config: session.config,
    scheduledFor: report.recovery.scheduledFor,
    patternNames: report.recovery.patternNames,
    totalMinutes: report.recovery.totalMinutes,
    challenges: session.challenges
      .filter((challenge) => report.recovery.patternNames.includes(challenge.patternName))
      .map((challenge) => ({ patternName: challenge.patternName, problem: challenge.problem })),
  });
}

function replayMarkdown(session: ArenaSession): string {
  const report = session.report!;
  const challenges = new Map(session.challenges.map((challenge) => [challenge.id, challenge]));
  return `# Interview Arena replay\n\n${session.companyName} · ${session.config.role} · ${MODE_LABELS[session.config.mode]} · ${languageLabel(session.config.language)}\n\n**Score: ${report.score}/100**\n\n## Attempts\n\n${session.attempts.map((attempt, index) => {
    const challenge = challenges.get(attempt.challengeId)!;
    const score = report.attemptScores[index]!;
    return `### ${index + 1}. LC ${challenge.problem[0]} — ${challenge.problem[2]} (${score.score}/100)\n\n- Pattern: ${attempt.patternGuess} → ${challenge.patternName} in ${Math.round(attempt.patternIdentifiedSec)}s\n- Complexity: ${attempt.complexityChoice} → ${challenge.expectedTime}\n- Result: ${attempt.correctness}; first run ${attempt.firstRun}; ${attempt.hints} hints; compile ${attempt.compileResult}\n- Edges: ${attempt.edgeCases.join("; ") || "none"}\n`;
  }).join("\n")}\n## Timeline\n\n${report.replay.map((event) => `- ${formatClock(event.atSec)} — ${eventLabel(event)}${event.detail ? `: ${event.detail}` : ""}`).join("\n")}\n\n## Recovery — ${report.recovery.scheduledFor}\n\n${report.recovery.steps.map((step) => `- ${step.minutes}m · ${step.patternName}: ${step.action}`).join("\n") || "No recovery required."}\n`;
}

function downloadReplay(session: ArenaSession): void {
  const blob = new Blob([replayMarkdown(session)], { type: "text/markdown" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `interview-arena-${session.companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date(session.startedAt).toISOString().slice(0, 10)}.md`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function initArena(): void {
  let session = store<ArenaSession>("arenaActive");
  let timer: ReturnType<typeof setInterval> | null = null;

  function clock(): void {
    if (!session || session.status !== "active") return;
    const elapsed = elapsedSec(session);
    const left = session.config.durationMin * 60 - elapsed;
    const target = document.getElementById("arenaClock");
    if (target) {
      target.textContent = `${left < 0 ? "+" : ""}${formatClock(Math.abs(left))}`;
      target.classList.toggle("over", left < 0);
    }
  }

  function startTimer(): void {
    if (timer) clearInterval(timer);
    if (session?.status === "active") {
      clock();
      timer = setInterval(clock, 1000);
    }
  }

  function render(): void {
    const host = $("#v-arena");
    host.innerHTML = !session ? setupView() : session.status === "complete" ? reportView(session) : activeView(session);
    bind();
    startTimer();
  }

  function startRecovery(queue: RecoveryQueue): void {
    const config: ArenaConfig = {
      ...queue.config,
      role: `Recovery · ${queue.config.role}`,
      durationMin: Math.max(25, queue.totalMinutes),
    };
    session = createSession(config, queue.patternNames);
    if (session && queue.challenges?.length) {
      const exactProblem = new Map(queue.challenges.map((challenge) => [challenge.patternName, challenge.problem]));
      session = {
        ...session,
        challenges: session.challenges.map((challenge) => ({
          ...challenge,
          problem: exactProblem.get(challenge.patternName) ?? challenge.problem,
          selectionReason: `recovery · ${challenge.selectionReason}`,
        })),
      };
      persist(session);
    }
    render();
  }

  function bindSetup(): void {
    const form = document.getElementById("arenaSetup") as HTMLFormElement | null;
    const companyInput = document.getElementById("arenaCompany") as HTMLSelectElement | null;
    const dateInput = document.getElementById("arenaDate") as HTMLInputElement | null;
    if (companyInput && dateInput) companyInput.onchange = () => {
      const dates = store<Record<string, string>>("interviewDates") ?? {};
      dateInput.value = dates[companyInput.value] ?? setupDate();
    };
    if (form) form.onsubmit = (event) => {
      event.preventDefault();
      const role = $("#arenaRole").value.trim();
      const date = $("#arenaDate").value;
      const mode = document.querySelector<HTMLInputElement>('input[name="arenaMode"]:checked')?.value as ArenaMode | undefined;
      if (!role || !date || !mode) {
        $("#arenaSetupHint").textContent = "Add a role, date, and round mode.";
        return;
      }
      const config: ArenaConfig = {
        companyId: $("#arenaCompany").value,
        role,
        interviewDate: date,
        language: $("#arenaLanguage").value as Lang,
        durationMin: Number($("#arenaDuration").value),
        mode,
      };
      const interviewDates = store<Record<string, string>>("interviewDates") ?? {};
      store("interviewDates", { ...interviewDates, [config.companyId]: config.interviewDate });
      store("lang", config.language);
      session = createSession(config);
      render();
    };

    const queue = store<RecoveryQueue>("arenaRecovery");
    const recoveryButton = document.getElementById("arenaStartRecovery");
    if (recoveryButton && queue) recoveryButton.onclick = () => startRecovery(queue);
    $$('[data-arena-history]').forEach((button) => {
      button.onclick = () => {
        const historic = historySession(button.dataset.arenaHistory ?? "");
        if (historic) { session = historic; render(); }
      };
    });
  }

  function bindActive(): void {
    if (!session || session.status !== "active") return;
    if (!session.draft) session.draft = EMPTY_DRAFT();

    $("#arenaExit").onclick = () => {
      persist(session!);
      showView("guide");
    };

    $("#arenaLockPattern").onclick = () => {
      const guess = $("#arenaPatternGuess").value.trim();
      if (!guess) return;
      const identified = Math.max(0, elapsedSec(session!) - challengeStartSec(session!));
      session!.draft = { ...session!.draft!, patternGuess: guess, patternIdentifiedSec: identified };
      session = appendEvent(session!, { kind: "pattern-locked", challengeId: session!.challenges[session!.activeIndex]!.id, detail: guess });
      persist(session); render();
    };

    $("#arenaLockComplexity").onclick = () => {
      const choice = $("#arenaComplexity").value.trim();
      if (!choice) return;
      const beforeCode = !session!.draft!.code.trim();
      session!.draft = { ...session!.draft!, complexityChoice: choice, complexityLocked: true, complexityLockedBeforeCode: beforeCode };
      session = appendEvent(session!, { kind: "complexity-locked", challengeId: session!.challenges[session!.activeIndex]!.id, detail: choice });
      persist(session); render();
    };

    const code = document.getElementById("arenaCode") as HTMLTextAreaElement | null;
    if (code) code.oninput = () => {
      session!.draft = { ...session!.draft!, code: code.value };
      const count = document.getElementById("arenaCodeCount");
      if (count) count.textContent = `${code.value.length} chars`;
      persist(session!);
    };

    $("#arenaHint").onclick = () => {
      const hints = Math.min(3, session!.draft!.hints + 1);
      session!.draft = { ...session!.draft!, hints };
      session = appendEvent(session!, { kind: "hint-used", challengeId: session!.challenges[session!.activeIndex]!.id, detail: `hint ${hints}` });
      persist(session); render();
    };

    $("#arenaSubmitChallenge").onclick = () => {
      const correctness = document.querySelector<HTMLInputElement>('input[name="arenaCorrectness"]:checked')?.value as ArenaCorrectness | undefined;
      const firstRun = document.querySelector<HTMLInputElement>('input[name="arenaFirstRun"]:checked')?.value as ArenaRunResult | undefined;
      const compileResult = $("#arenaCompile").value as ArenaCompileResult | "";
      if (!correctness || !firstRun || !compileResult) {
        $("#arenaSubmitHint").textContent = "Record correctness, first run, and compile result.";
        return;
      }
      const challenge = session!.challenges[session!.activeIndex]!;
      const draft = session!.draft!;
      const attempt = {
        challengeId: challenge.id,
        patternGuess: draft.patternGuess,
        patternIdentifiedSec: draft.patternIdentifiedSec ?? session!.config.durationMin * 60,
        complexityChoice: draft.complexityChoice,
        complexityLockedBeforeCode: draft.complexityLockedBeforeCode,
        code: draft.code.slice(0, 16_000),
        correctness,
        firstRun,
        edgeCases: $("#arenaEdges").value.split(/\r?\n/).map((edge) => edge.trim()).filter(Boolean),
        hints: draft.hints,
        compileResult,
        explanation: $("#arenaExplanation").value.trim(),
        explanationRubric: {
          invariant: $("#arenaInvariant").checked,
          complexity: $("#arenaExplainComplexity").checked,
          correctness: $("#arenaProof").checked,
          tradeoff: $("#arenaTradeoff").checked,
        },
        missedSignal: $("#arenaMissedSignal").value.trim(),
        submittedAtSec: elapsedSec(session!),
      };
      // Score once here as a shape guard; the complete report recomputes all attempts.
      scoreArenaAttempt(challenge, attempt);
      session = { ...session!, attempts: [...session!.attempts, attempt] };
      session = appendEvent(session, { kind: "challenge-submitted", challengeId: challenge.id, detail: `${correctness} · ${firstRun} first run` });

      if (session.activeIndex < session.challenges.length - 1) {
        const nextIndex = session.activeIndex + 1;
        session = { ...session, activeIndex: nextIndex, draft: EMPTY_DRAFT() };
        session = appendEvent(session, { kind: "challenge-started", challengeId: session.challenges[nextIndex]!.id });
        persist(session); render();
        return;
      }

      const completedAt = Date.now();
      const previousBoxes = store<Record<string, number | { box: number; due: number }>>("boxes") ?? {};
      const report = buildArenaReport(session, previousBoxes, completedAt);
      session = { ...session, status: "complete", completedAt, report, draft: undefined };
      applyClosedLoop(session);
      persist(session);
      render();
    };
  }

  function bindReport(): void {
    if (!session?.report) return;
    $("#arenaNew").onclick = () => { store("arenaActive", null); session = null; render(); };
    $("#arenaDownloadReplay").onclick = () => downloadReplay(session!);
    const recovery = document.getElementById("arenaLaunchRecovery");
    if (recovery) recovery.onclick = () => {
      const queue = store<RecoveryQueue>("arenaRecovery");
      if (queue) startRecovery(queue);
    };
  }

  function bind(): void {
    if (!session) bindSetup();
    else if (session.status === "active") bindActive();
    else bindReport();
  }

  render();
}
