import { PATTERNS, TOPICS } from "../data/index";
import {
  answerGroundedInterview,
  buildGroundedPacket,
  deriveInterviewMistakes,
  interviewScore,
  startGroundedInterview,
  transcriptMarkdown,
  type GroundedInterviewSession,
  type InterviewAssessment,
  type InterviewStage,
} from "../lib/interviewer";
import { $, $$, esc, store } from "../lib/dom";
import { writeLogEntries } from "./mistakes";

interface SpeechRecognitionResultLike {
  readonly length: number;
  readonly isFinal: boolean;
  readonly [index: number]: { readonly transcript: string };
}

interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: { readonly length: number; readonly [index: number]: SpeechRecognitionResultLike };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type RecognitionConstructor = new () => SpeechRecognitionLike;

const STAGES: readonly Exclude<InterviewStage, "complete">[] = [
  "constraints", "complexity", "approach", "negatives", "counterexample", "proof", "followup",
];

const STAGE_LABELS: Record<InterviewStage, string> = {
  constraints: "constraints",
  complexity: "complexity",
  approach: "approach",
  negatives: "negative values",
  counterexample: "counterexample",
  proof: "invariant / proof",
  followup: "follow-up ladder",
  complete: "debrief",
};

const topicName = (id: string): string => TOPICS.find(([topic]) => topic === id)?.[1] ?? id;

function recognitionConstructor(): RecognitionConstructor | null {
  const voiceWindow = window as typeof window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return voiceWindow.SpeechRecognition ?? voiceWindow.webkitSpeechRecognition ?? null;
}

function latestPrompt(session: GroundedInterviewSession): string {
  return [...session.transcript].reverse().find((item) => item.role === "interviewer")?.text ?? "";
}

function bestAssessments(session: GroundedInterviewSession): Map<InterviewStage, InterviewAssessment> {
  const out = new Map<InterviewStage, InterviewAssessment>();
  for (const item of session.assessments) {
    const prior = out.get(item.stage);
    if (!prior || item.score > prior.score) out.set(item.stage, item);
  }
  return out;
}

function setupView(): string {
  const lastPattern = store<string>("groundedPattern") ?? PATTERNS.find((pattern) => pattern.walk?.length && pattern.followups?.length)?.n ?? PATTERNS[0]!.n;
  const voice = store<boolean>("groundedVoice") ?? false;
  const pattern = PATTERNS.find((candidate) => candidate.n === lastPattern) ?? PATTERNS[0]!;
  return `
    <div class="gi-hero">
      <div>
        <div class="tag"><i></i><span>grounded interviewer // bounded context, adaptive pressure</span></div>
        <h2 class="mod">No generic chat.<br><em>Just the round.</em></h2>
        <p class="brief">The interviewer receives one selected pattern, one anchor problem, the scoring rubric, one worked trace, and that pattern's follow-up ladder. It cannot browse the rest of the playbook or reveal implementation code during the attempt.</p>
      </div>
      <div class="gi-contract" aria-label="interview contract">
        <span>asks constraints first</span><span>locks complexity</span><span>attacks assumptions</span><span>demands proof</span>
      </div>
    </div>

    <div class="gi-setup">
      <div class="console-bar"><span class="led"></span><span>build the ground packet</span><strong>only these inputs cross the boundary</strong></div>
      <div class="gi-setup-body">
        <label><span>selected pattern</span><select id="giPattern">
          ${PATTERNS.map((candidate) => `<option value="${esc(candidate.n)}"${candidate.n === pattern.n ? " selected" : ""}>${esc(topicName(candidate.t))} · ${esc(candidate.n)}</option>`).join("")}
        </select></label>
        <label><span>anchor problem</span><select id="giProblem">
          ${problemOptions(pattern, 0)}
        </select></label>
        <label class="gi-voice-option"><input type="checkbox" id="giVoice"${voice ? " checked" : ""}><span><b>voice rehearsal</b><small>Speak each prompt and allow microphone dictation when this browser supports it.</small></span></label>
      </div>
      <div class="gi-packet-preview" id="giPacketPreview">${packetPreview(pattern)}</div>
      <div class="gi-setup-action">
        <button class="btn on" id="giStart">start grounded interview →</button>
        <span>Solutions stay sealed until the debrief.</span>
      </div>
    </div>`;
}

function problemOptions(pattern: (typeof PATTERNS)[number], selected: number): string {
  return pattern.lc.map((problem, index) => `<option value="${index}"${index === selected ? " selected" : ""}>LC ${problem[0]} · ${esc(problem[2])}</option>`).join("");
}

function packetPreview(pattern: (typeof PATTERNS)[number]): string {
  return [
    ["pattern", "1", pattern.n],
    ["problem", String(pattern.lc.length), "anchor choices"],
    ["rubric", "7", "scored gates"],
    ["trace", String(pattern.walk?.length ? 1 : 0), pattern.walk?.length ? "worked trace loaded" : "counterexample fallback"],
    ["ladder", String(pattern.followups?.length ?? 0), "adaptive follow-ups"],
  ].map(([label, count, detail]) => `<div><span>${esc(label)}</span><b>${esc(count)}</b><small>${esc(detail)}</small></div>`).join("");
}

function stageRail(session: GroundedInterviewSession): string {
  const current = session.stage === "complete" ? STAGES.length : STAGES.indexOf(session.stage as Exclude<InterviewStage, "complete">);
  return STAGES.map((stage, index) => `<span class="${index < current ? "done" : index === current ? "on" : ""}"><i></i>${esc(STAGE_LABELS[stage])}</span>`).join("");
}

function groundCard(session: GroundedInterviewSession): string {
  const packet = session.packet;
  return `<aside class="gi-ground">
    <div class="arena-eyebrow">sealed ground packet</div>
    <h3>${esc(packet.patternName)}</h3>
    <p>LC ${packet.problem[0]} · ${esc(packet.problem[2])}</p>
    <dl>
      <div><dt>rubric</dt><dd>${packet.rubric.length} gates · 100 points</dd></div>
      <div><dt>worked trace</dt><dd>${packet.trace ? esc(packet.trace.title) : "generated fallback"}</dd></div>
      <div><dt>edge probes</dt><dd>${packet.edges.length || 1}</dd></div>
      <div><dt>follow-up rungs</dt><dd>${packet.followups.length}</dd></div>
    </dl>
    <div class="gi-seal"><b>sealed during attempt</b><span>solution code · proof guide · trap · expected complexity</span></div>
  </aside>`;
}

function transcriptLedger(session: GroundedInterviewSession): string {
  const turns = session.transcript;
  return `<details class="gi-ledger"${session.status === "complete" ? " open" : ""}>
    <summary><span>evidence ledger</span><b>${turns.filter((item) => item.role === "candidate").length} answers recorded</b></summary>
    <div>${turns.map((item) => `<article class="${item.role}">
      <header><span>${item.role}</span><em>${esc(STAGE_LABELS[item.stage])}</em></header><p>${esc(item.text)}</p>
    </article>`).join("")}</div>
  </details>`;
}

function activeView(session: GroundedInterviewSession): string {
  const problem = session.packet.problem;
  const problemHref = problem[1] ? `https://leetcode.com/problems/${encodeURIComponent(problem[1])}/` : "#";
  const voiceAvailable = Boolean(recognitionConstructor());
  return `
    <div class="gi-session-head">
      <div><span class="arena-eyebrow">grounded interview · ${esc(topicName(session.packet.topic))}</span><h2>LC ${problem[0]} <em>${esc(problem[2])}</em></h2></div>
      <div class="gi-session-actions"><a class="btn on" href="${problemHref}" target="_blank" rel="noopener">open prompt ↗</a><button class="btn mag" id="giReset">end attempt</button></div>
    </div>
    <div class="gi-stage-rail">${stageRail(session)}</div>
    <div class="gi-workspace">
      <main>
        <section class="gi-prompt">
          <div class="gi-prompt-meta"><span>interviewer prompt</span><b>${esc(STAGE_LABELS[session.stage])}</b></div>
          <p>${esc(latestPrompt(session))}</p>
          <button class="gi-speak" id="giSpeak" aria-label="Read prompt aloud" title="Read prompt aloud">◖))</button>
        </section>
        <section class="gi-response">
          <label for="giAnswer"><span>your answer · think out loud</span><em id="giListenStatus">${voiceAvailable ? "type or use the microphone" : "microphone dictation is not supported here"}</em></label>
          <textarea id="giAnswer" placeholder="State a claim the interviewer can challenge…" autofocus></textarea>
          <div class="gi-response-actions">
            <button class="btn" id="giMic"${voiceAvailable ? "" : " disabled"}>● microphone</button>
            <span id="giAnswerHint">Ctrl / ⌘ + Enter submits</span>
            <button class="btn on" id="giSend">answer & continue →</button>
          </div>
        </section>
        ${transcriptLedger(session)}
      </main>
      ${groundCard(session)}
    </div>`;
}

function rubricRows(session: GroundedInterviewSession): string {
  const best = bestAssessments(session);
  return session.packet.rubric.map((item) => {
    const assessment = best.get(item.key);
    const score = assessment?.score ?? 0;
    const earned = Math.round(item.points * score / 2);
    return `<div class="gi-rubric-row score-${score}"><span>${esc(item.label)}</span><b>${earned}<small>/${item.points}</small></b><p>${esc(assessment?.note ?? "Not assessed.")}</p></div>`;
  }).join("");
}

function traceReference(session: GroundedInterviewSession): string {
  const trace = session.packet.trace;
  if (!trace) return `<p class="gi-empty">No authored trace exists for this pattern yet. The interview used a topic-aware generated counterexample.</p>`;
  const rows = trace.rows.slice(0, 4);
  return `<div class="gi-trace-reference"><div><span>${esc(trace.title)}</span><code>${esc(trace.input)}</code></div>
    <table class="t"><thead><tr>${trace.cols.map((col) => `<th>${esc(col)}</th>`).join("")}</tr></thead><tbody>
      ${rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}
    </tbody></table><p>${esc(trace.lesson)}</p></div>`;
}

function completeView(session: GroundedInterviewSession): string {
  const score = interviewScore(session);
  const mistakes = deriveInterviewMistakes(session);
  const saved = store<string[]>("groundedMistakeSessions")?.includes(session.id) ?? false;
  return `
    <div class="gi-debrief-head">
      <div><div class="tag"><i></i><span>debrief // the ground packet is now unsealed</span></div><h2>${score}<small>/100</small></h2><p>${score >= 85 ? "interview ready" : score >= 65 ? "promising, not stable" : "rehearse the weak gates"}</p></div>
      <div class="gi-debrief-actions"><button class="btn" id="giDownload">download transcript</button><button class="btn on" id="giNew">new interview</button></div>
    </div>
    <div class="gi-rubric-grid">${rubricRows(session)}</div>

    <section class="gi-debrief-section">
      <div class="arena-section-head"><div><span class="arena-eyebrow">reference packet</span><h3>What the interviewer was allowed to know.</h3></div></div>
      <div class="gi-reference-grid">
        <article><span>intended budget</span><h4>${esc(session.packet.expectedTime)} time<br>${esc(session.packet.expectedSpace)} space</h4></article>
        <article><span>signal</span><p>${esc(session.packet.signal)}</p></article>
        <article><span>trap</span><p>${esc(session.packet.trap)}</p></article>
        <article><span>proof guide</span><p>${esc(session.packet.proof)}</p></article>
      </div>
      ${traceReference(session)}
    </section>

    <section class="gi-debrief-section">
      <div class="arena-section-head"><div><span class="arena-eyebrow">transcript → mistake log</span><h3>${mistakes.length ? `${mistakes.length} recognition failures extracted.` : "No weak signals extracted."}</h3></div>
        ${mistakes.length ? `<button class="btn${saved ? "" : " on"}" id="giSaveMistakes"${saved ? " disabled" : ""}>${saved ? "saved to mistake log" : `save ${mistakes.length} entries →`}</button>` : ""}</div>
      ${mistakes.length ? `<div class="gi-mistakes">${mistakes.map((mistake) => `<article><i></i><div><b>${esc(mistake.signal)}</b><span>${esc(mistake.pattern)} · ${esc(mistake.problem)}</span></div></article>`).join("")}</div>` : `<div class="callout"><b>Every gate cleared.</b> The transcript is still available as evidence; nothing noisy was added to your mistake log.</div>`}
    </section>
    ${transcriptLedger(session)}`;
}

function download(session: GroundedInterviewSession): void {
  const blob = new Blob([transcriptMarkdown(session)], { type: "text/markdown" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `grounded-interview-lc-${session.packet.problem[0]}-${new Date(session.startedAt).toISOString().slice(0, 10)}.md`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function initInterviewer(): void {
  let session = store<GroundedInterviewSession>("groundedInterviewActive");
  let recognition: SpeechRecognitionLike | null = null;
  let listening = false;

  function persist(): void {
    store("groundedInterviewActive", session);
    if (session?.status === "complete") {
      const history = store<GroundedInterviewSession[]>("groundedInterviewHistory") ?? [];
      const withoutCurrent = history.filter((attempt) => attempt.id !== session!.id);
      store("groundedInterviewHistory", [session, ...withoutCurrent].slice(0, 25));
    }
  }

  function speak(text = session ? latestPrompt(session) : ""): void {
    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98;
    utterance.pitch = 0.96;
    window.speechSynthesis.speak(utterance);
  }

  function render(): void {
    const host = $("#v-interviewer");
    host.innerHTML = !session ? setupView() : session.status === "complete" ? completeView(session) : activeView(session);
    bind();
  }

  function bindSetup(): void {
    const patternSelect = $("#giPattern") as HTMLSelectElement;
    patternSelect.onchange = () => {
      const pattern = PATTERNS.find((candidate) => candidate.n === patternSelect.value) ?? PATTERNS[0]!;
      ($("#giProblem") as HTMLSelectElement).innerHTML = problemOptions(pattern, 0);
      $("#giPacketPreview").innerHTML = packetPreview(pattern);
      store("groundedPattern", pattern.n);
    };
    $("#giStart").onclick = () => {
      const pattern = PATTERNS.find((candidate) => candidate.n === patternSelect.value);
      const problemIndex = Number(($("#giProblem") as HTMLSelectElement).value);
      const problem = pattern?.lc[problemIndex];
      if (!pattern || !problem) return;
      const voice = ($("#giVoice") as HTMLInputElement).checked;
      store("groundedPattern", pattern.n);
      store("groundedVoice", voice);
      session = startGroundedInterview(buildGroundedPacket(pattern, problem));
      persist();
      render();
      if (voice) speak();
    };
  }

  function stopListening(): void {
    if (recognition && listening) recognition.stop();
    listening = false;
    recognition = null;
  }

  function startListening(): void {
    const Constructor = recognitionConstructor();
    const input = document.getElementById("giAnswer") as HTMLTextAreaElement | null;
    if (!Constructor || !input || listening) return;
    recognition = new Constructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    let stable = input.value.trim();
    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index]!;
        const words = result[0]?.transcript ?? "";
        if (result.isFinal) stable = `${stable} ${words}`.trim();
        else interim += words;
      }
      input.value = `${stable}${interim ? ` ${interim}` : ""}`.trim();
      const status = document.getElementById("giListenStatus");
      if (status) status.textContent = interim ? "listening…" : "voice captured";
    };
    recognition.onerror = () => {
      const status = document.getElementById("giListenStatus");
      if (status) status.textContent = "microphone unavailable — keep typing";
    };
    recognition.onend = () => {
      listening = false;
      const mic = document.getElementById("giMic");
      mic?.classList.remove("on");
    };
    recognition.start();
    listening = true;
    $("#giMic").classList.add("on");
    $("#giMic").textContent = "■ stop listening";
  }

  function submitAnswer(): void {
    if (!session || session.status !== "active") return;
    const input = $("#giAnswer") as HTMLTextAreaElement;
    const answer = input.value.trim();
    if (!answer) {
      $("#giAnswerHint").textContent = "Say something the interviewer can test.";
      input.focus();
      return;
    }
    stopListening();
    session = answerGroundedInterview(session, answer);
    persist();
    const shouldSpeak = store<boolean>("groundedVoice") ?? false;
    render();
    if (shouldSpeak && session.status === "active") speak();
  }

  function bindActive(): void {
    $("#giReset").onclick = () => {
      if (!confirm("End this grounded interview? The unfinished transcript will be removed.")) return;
      stopListening();
      store("groundedInterviewActive", null);
      session = null;
      render();
    };
    $("#giSpeak").onclick = () => speak();
    $("#giMic").onclick = () => listening ? stopListening() : startListening();
    $("#giSend").onclick = submitAnswer;
    const input = $("#giAnswer") as HTMLTextAreaElement;
    input.onkeydown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        submitAnswer();
      }
    };
  }

  function bindComplete(): void {
    $("#giNew").onclick = () => {
      store("groundedInterviewActive", null);
      session = null;
      render();
    };
    $("#giDownload").onclick = () => download(session!);
    const save = document.getElementById("giSaveMistakes") as HTMLButtonElement | null;
    if (save) save.onclick = () => {
      const mistakes = deriveInterviewMistakes(session!);
      const added = writeLogEntries(mistakes.map((mistake, index) => ({
        id: `${session!.id}-mistake-${index}`,
        date: new Date(session!.completedAt ?? Date.now()).toISOString().slice(0, 10),
        topic: mistake.topic,
        pattern: mistake.pattern,
        signal: mistake.signal,
        problem: mistake.problem,
        reviews: 0,
      })));
      const saved = store<string[]>("groundedMistakeSessions") ?? [];
      if (!saved.includes(session!.id)) store("groundedMistakeSessions", [session!.id, ...saved].slice(0, 50));
      save.textContent = added ? `${added} saved to mistake log` : "already in mistake log";
      save.disabled = true;
      save.classList.remove("on");
    };
  }

  function bind(): void {
    $$<HTMLElement>("#v-interviewer button").forEach((button) => button.setAttribute("type", "button"));
    if (!session) bindSetup();
    else if (session.status === "active") bindActive();
    else bindComplete();
  }

  render();
}
