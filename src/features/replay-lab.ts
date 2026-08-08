import { PATTERNS } from "../data";
import { PERSONAL_REPLAYS, type PersonalReplayFrame } from "../data/replays.generated";
import { FAMILY_TO_TOPICS } from "../data/progress";
import { SOLVED } from "../data/progress.generated";
import { $, esc } from "../lib/dom";
import { hl } from "../lib/highlight";
import { getPyodide, pyodideHelp, traceHarness } from "../lib/pyodide";
import {
  buildReplayBridges,
  buildRunnableSource,
  canRunLive,
  countCurriculumTraces,
  introduceBug,
  mutateLiteralInput,
  predictionOptions,
  type BugMutation,
  type ReplayBridge,
} from "../lib/replay";
import { stressHarness, STRESS_SAMPLES, type StressResult } from "../lib/stress";

interface LabFrame extends PersonalReplayFrame {
  dynamic?: boolean;
}

const FAMILY_BY_PROBLEM = new Map(SOLVED.map((entry) => [entry.num, entry.family]));
const BRIDGES = buildReplayBridges(PERSONAL_REPLAYS, PATTERNS, FAMILY_TO_TOPICS, FAMILY_BY_PROBLEM);
const GENERIC_TOTAL = countCurriculumTraces(PATTERNS);

function textOnly(html: string): string {
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent ?? "";
}

function languageFor(value: string): "py" | "cpp" | "java" {
  if (value === "java") return "java";
  if (value === "cpp" || value === "c") return "cpp";
  return "py";
}

function inputScale(input: string): number {
  const list = input.match(/\[([^\]]*)\]/);
  if (list) return Math.max(2, list[1].split(",").filter((x) => x.trim()).length);
  const n = input.match(/\bn\s*=\s*(\d+)/);
  return n ? Math.max(2, Number(n[1])) : 8;
}

function optimalOperations(complexity: string, n: number): number {
  const lower = complexity.toLowerCase();
  if (/o\(1\)/.test(lower)) return 1;
  if (/log/.test(lower) && !/n\s*(?:·|\*| )\s*log|nlog/.test(lower)) return Math.ceil(Math.log2(n));
  if (/n\s*(?:·|\*| )\s*log|n log/.test(lower)) return Math.ceil(n * Math.log2(n));
  if (/n²|n\^2/.test(lower)) return n * n;
  return n;
}

function stressSampleFor(bridge: ReplayBridge): string {
  const label = `${bridge.personal.pattern} ${bridge.pattern?.n ?? ""}`.toLowerCase();
  if (label.includes("binary search")) return STRESS_SAMPLES[2][1];
  if (label.includes("hash") || label.includes("duplicate") || label.includes("set")) return STRESS_SAMPLES[1][1];
  return STRESS_SAMPLES[0][1];
}

function invariantForBug(bug: BugMutation): string {
  if (bug.label.includes("membership")) return "The branch must execute exactly when the required state is present; inversion takes the miss path and skips the hit.";
  if (bug.label.includes("boundary")) return "The active range must continue to include every still-possible answer, including the equality boundary.";
  if (bug.label.includes("progress")) return "Every iteration must strictly reduce the unresolved state; otherwise termination and the complexity bound both fail.";
  if (bug.label.includes("extremum")) return "The accumulator must remain the best valid value seen so far; reversing min/max destroys that monotone guarantee.";
  if (bug.label.includes("order")) return "The output state must preserve discovery order; inserting at the opposite end reverses the constructed result.";
  return "The mutated transition no longer preserves the condition used by the algorithm's proof.";
}

export function initReplayLab(): void {
  const host = $("#v-lab");
  const exactCount = BRIDGES.filter((bridge) => bridge.exact && bridge.walk).length;
  const liveCount = BRIDGES.filter((bridge) => canRunLive(bridge.personal)).length;

  host.innerHTML = `
    <div class="lab-hero">
      <div>
        <div class="tag"><i></i><span>personal replay laboratory // predict · mutate · break · shrink</span></div>
        <h2 class="mod">Your code,<br><em>under pressure.</em></h2>
        <p class="brief">Replay the code you actually submitted beside the reusable pattern it belongs to. Predict before revealing, change the input, compare growth, break an invariant, then let the stress tester reduce the failure to the smallest useful case.</p>
      </div>
      <div class="lab-ledger" aria-label="replay coverage">
        <div><b>${PERSONAL_REPLAYS.length}</b><span>personal replays</span></div>
        <div><b>${GENERIC_TOTAL}</b><span>curriculum traces</span></div>
        <div><b>${exactCount}</b><span>exact bridges</span></div>
        <div><b>${liveCount}</b><span>live-input ready</span></div>
      </div>
    </div>

    <div class="lab-shell">
      <aside class="lab-picker">
        <label class="lab-label" for="labSearch">choose a solved problem</label>
        <input id="labSearch" type="search" placeholder="number, title, pattern…" autocomplete="off">
        <div class="lab-filter-row">
          <button class="lab-filter on" data-filter="all">all</button>
          <button class="lab-filter" data-filter="exact">exact pair</button>
          <button class="lab-filter" data-filter="live">live input</button>
        </div>
        <div id="labProblemList" class="lab-problem-list"></div>
      </aside>

      <main class="lab-workbench">
        <div class="lab-problem-head">
          <div>
            <div class="lab-kicker" id="labKicker"></div>
            <h3 id="labTitle"></h3>
            <div class="lab-badges" id="labBadges"></div>
          </div>
          <a class="btn" id="labSource" target="_blank" rel="noopener">source ↗</a>
        </div>

        <div class="lab-input-strip">
          <label for="labInput"><span>LIVE INPUT</span><small id="labInputNote"></small></label>
          <textarea id="labInput" rows="2" spellcheck="false"></textarea>
          <div class="btnrow">
            <button class="btn amb" id="labMutate">mutate</button>
            <button class="btn on" id="labRerun">run actual code</button>
            <button class="btn" id="labResetInput">reset</button>
          </div>
          <div class="lab-run-status" id="labRunStatus"></div>
        </div>

        <div class="lab-mode-tabs" role="tablist">
          <button class="on" data-lab-mode="replay">01 replay + predict</button>
          <button data-lab-mode="compare">02 brute vs optimal</button>
          <button data-lab-mode="bug">03 break the invariant</button>
        </div>

        <section class="lab-mode on" id="labModeReplay">
          <div class="lab-dual">
            <article class="lab-trace-panel lab-personal-panel">
              <header><span>your accepted code</span><b id="labPersonalCounter"></b></header>
              <div class="lab-code" id="labCode"></div>
              <div class="lab-state">
                <div class="lab-frame-kind" id="labFrameKind"></div>
                <div class="lab-vars" id="labVars"></div>
                <p id="labNarration"></p>
                <div class="lab-output" id="labOutput"></div>
              </div>
            </article>

            <article class="lab-trace-panel lab-generic-panel">
              <header><span>generic optimal trace</span><b id="labGenericCounter"></b></header>
              <div id="labGeneric"></div>
            </article>
          </div>

          <div class="lab-predict" id="labPredict">
            <div><span>PREDICT BEFORE REVEAL</span><b>What changes on the next executed state?</b></div>
            <div class="lab-predict-options" id="labPredictOptions"></div>
            <div class="lab-predict-result" id="labPredictResult"></div>
          </div>

          <div class="lab-transport">
            <button class="btn" id="labPrev">◀ previous</button>
            <button class="btn" id="labPlay">▶ replay</button>
            <button class="btn on" id="labNext">predict next →</button>
            <span id="labProgressLabel"></span>
            <i><em id="labProgress"></em></i>
          </div>
        </section>

        <section class="lab-mode" id="labModeCompare">
          <div class="lab-compare-intro">
            <div><span>INPUT SIZE</span><b id="labNLabel"></b></div>
            <input id="labN" type="range" min="4" max="160" value="24">
            <p id="labCompareCopy"></p>
          </div>
          <div class="lab-race">
            <div class="lab-race-row brute"><label><b>brute force</b><span id="labBruteCount"></span></label><i><em id="labBruteBar"></em></i></div>
            <div class="lab-race-row fast"><label><b>optimized</b><span id="labFastCount"></span></label><i><em id="labFastBar"></em></i></div>
          </div>
          <div class="lab-checkpoints">
            <div><b id="labSavedSteps"></b><span>saved personal state transitions</span></div>
            <div><b id="labGenericSteps"></b><span>curriculum checkpoints</span></div>
            <div><b id="labTime"></b><span>submitted time</span></div>
            <div><b id="labOptimalTime"></b><span>pattern target</span></div>
          </div>
        </section>

        <section class="lab-mode" id="labModeBug">
          <div class="lab-bug-head">
            <div><span>ONE LINE WAS MUTATED</span><h4>Find the first broken invariant.</h4><p>Click the suspicious line. Syntax can stay valid while the proof silently stops being true.</p></div>
            <button class="btn amb" id="labNewBug">introduce another bug</button>
          </div>
          <div class="lab-bug-code" id="labBugCode"></div>
          <div class="lab-bug-verdict" id="labBugVerdict"></div>
          <div class="lab-stress">
            <div><span>AUTOMATIC COUNTEREXAMPLE HUNT</span><h4>Now make the failure small.</h4><p>The closest invariant microcase runs brute and optimized code on seeded random inputs, then removes irrelevant data until the disagreement cannot shrink further.</p></div>
            <button class="btn on" id="labStress">run + shrink</button>
            <div id="labStressOut"></div>
          </div>
        </section>
      </main>
    </div>`;

  let selected = Math.max(0, BRIDGES.findIndex((bridge) => bridge.exact && bridge.walk));
  let visible: ReplayBridge[] = BRIDGES.slice();
  let filter = "all";
  let frames: LabFrame[] = [];
  let code = "";
  let step = 0;
  let predictionAnswered = false;
  let timer: number | null = null;
  let mutationSeed = 0;
  let bugSeed = 0;
  let bug: BugMutation | null = null;

  const current = (): ReplayBridge => visible[selected] ?? visible[0] ?? BRIDGES[0];

  function stop(): void {
    if (timer) window.clearInterval(timer);
    timer = null;
    $("#labPlay").textContent = "▶ replay";
  }

  function renderList(): void {
    const query = $("#labSearch").value.trim().toLowerCase();
    visible = BRIDGES.filter((bridge) => {
      if (filter === "exact" && !(bridge.exact && bridge.walk)) return false;
      if (filter === "live" && !canRunLive(bridge.personal)) return false;
      const haystack = `${bridge.personal.num} ${bridge.personal.name} ${bridge.personal.pattern} ${bridge.pattern?.n ?? ""}`.toLowerCase();
      return !query || haystack.includes(query);
    });
    selected = Math.min(selected, Math.max(0, visible.length - 1));
    $("#labProblemList").innerHTML = visible.length
      ? visible.map((bridge, index) => `
          <button class="lab-problem ${index === selected ? "on" : ""}" data-index="${index}">
            <span>${String(bridge.personal.num).padStart(4, "0")}</span>
            <b>${esc(bridge.personal.name)}</b>
            <small>${bridge.exact && bridge.walk ? "anchor-matched trace" : bridge.walk ? "family analogue" : "personal replay only"}</small>
          </button>`).join("")
      : `<p class="lab-empty">No replay matches that filter.</p>`;
    host.querySelectorAll<HTMLButtonElement>(".lab-problem").forEach((button) => {
      button.onclick = () => {
        selected = Number(button.dataset.index);
        renderList();
        loadBridge();
      };
    });
  }

  function renderCode(): void {
    const bridge = current();
    const activeLine = frames[step]?.line ?? -1;
    $("#labCode").innerHTML = code.split("\n").map((line, index) => `
      <span class="lab-code-line ${index + 1 === activeLine ? "on" : ""}" data-line="${index + 1}">
        <i>${String(index + 1).padStart(2, "0")}</i><code>${hl(line || " ", languageFor(bridge.personal.lang))}</code>
      </span>`).join("");
    const hot = host.querySelector<HTMLElement>(".lab-code-line.on");
    hot?.scrollIntoView?.({ block: "nearest" });
  }

  function renderGeneric(): void {
    const bridge = current();
    const walk = bridge.walk;
    if (!walk) {
      $("#labGenericCounter").textContent = "gap";
      $("#labGeneric").innerHTML = `<div class="lab-generic-empty"><b>No exact curriculum dry run yet.</b><p>Your personal replay still works. This gap is visible on purpose rather than pretending a nearby algorithm is the same one.</p></div>`;
      return;
    }
    const genericStep = frames.length <= 1
      ? 0
      : Math.min(walk.rows.length - 1, Math.round(step / (frames.length - 1) * (walk.rows.length - 1)));
    $("#labGenericCounter").textContent = `${genericStep + 1} / ${walk.rows.length}`;
    const rows = walk.rows.map((row, index) => `<tr class="${index === genericStep ? "on" : index < genericStep ? "past" : "future"}">${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("");
    $("#labGeneric").innerHTML = `
      <div class="lab-walk-title"><b>${esc(bridge.pattern?.n ?? bridge.personal.pattern)}</b><span>${bridge.exact ? "anchor match → reusable pattern" : "nearest family analogue"}</span></div>
      <div class="lab-walk-input">${esc(walk.input)}</div>
      <div class="lab-table-scroll"><table><thead><tr>${walk.cols.map((col) => `<th>${esc(col)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>
      <p class="lab-lesson">${walk.lesson}</p>`;
    host.querySelector("#labGeneric tr.on")?.scrollIntoView?.({ block: "nearest" });
  }

  function renderPrediction(): void {
    const wrap = $("#labPredict");
    if (step >= frames.length - 1) {
      wrap.classList.add("done");
      $("#labPredictOptions").innerHTML = `<span class="lab-finished">Trace complete. Mutate the input or break an invariant next.</span>`;
      $("#labPredictResult").textContent = "";
      return;
    }
    wrap.classList.remove("done");
    const options = predictionOptions(frames[step], frames[step + 1]);
    $("#labPredictOptions").innerHTML = options.map((option, index) => `
      <button data-answer="${index}" ${predictionAnswered ? "disabled" : ""}>${esc(option)}</button>`).join("");
    if (!predictionAnswered) $("#labPredictResult").textContent = "Choose before the next state is revealed.";
    host.querySelectorAll<HTMLButtonElement>("#labPredictOptions button").forEach((button) => {
      button.onclick = () => {
        const right = button.dataset.answer === "0";
        predictionAnswered = true;
        host.querySelectorAll("#labPredictOptions button").forEach((candidate, index) => {
          candidate.setAttribute("disabled", "true");
          candidate.classList.toggle("correct", index === 0);
          candidate.classList.toggle("wrong", candidate === button && !right);
        });
        $("#labPredictResult").innerHTML = right
          ? `<b>Correct.</b> Now reveal it.`
          : `<b>Good miss.</b> The actual next state is marked in green.`;
        $("#labNext").textContent = "reveal next →";
      };
    });
  }

  function renderFrame(): void {
    const frame = frames[step];
    if (!frame) return;
    renderCode();
    $("#labPersonalCounter").textContent = `${step + 1} / ${frames.length}`;
    $("#labFrameKind").innerHTML = `<span class="${esc(frame.type)}">${esc(frame.type)}</span> line ${frame.line}${frame.dynamic ? " · live run" : " · saved replay"}`;
    $("#labVars").innerHTML = frame.vars.length ? frame.vars.map((value) => `<span>${value}</span>`).join("") : `<span>no tracked values changed</span>`;
    $("#labNarration").innerHTML = frame.msg;
    $("#labOutput").innerHTML = frame.out.length ? `<b>output so far</b>${frame.out.map((value) => `<span>${esc(value)}</span>`).join("")}` : "";
    $("#labProgressLabel").textContent = `${step + 1} of ${frames.length}`;
    $("#labProgress").style.width = `${((step + 1) / frames.length) * 100}%`;
    renderGeneric();
    renderPrediction();
  }

  function next(): void {
    stop();
    if (step >= frames.length - 1) return;
    if (!predictionAnswered) {
      $("#labPredict").classList.add("nudge");
      window.setTimeout(() => $("#labPredict").classList.remove("nudge"), 420);
      return;
    }
    step++;
    predictionAnswered = false;
    $("#labNext").textContent = "predict next →";
    renderFrame();
  }

  function compare(): void {
    const bridge = current();
    const n = Number($("#labN").value);
    const optimized = optimalOperations(bridge.pattern?.tc ?? bridge.personal.complexity.time, n);
    const brute = n * n;
    $("#labNLabel").textContent = `n = ${n}`;
    $("#labBruteCount").textContent = `${brute.toLocaleString()} candidate checks`;
    $("#labFastCount").textContent = `${optimized.toLocaleString()} state visits`;
    $("#labBruteBar").style.width = "100%";
    $("#labFastBar").style.width = `${Math.max(2, optimized / brute * 100)}%`;
    $("#labCompareCopy").innerHTML = `At this size, the brute-force model does roughly <b>${Math.max(1, Math.round(brute / optimized)).toLocaleString()}×</b> the work. The bars use the curriculum target <code>${esc(bridge.pattern?.tc ?? bridge.personal.complexity.time)}</code>; the replay counts below are teaching checkpoints, not fabricated CPU instructions.`;
  }

  function renderBug(): void {
    const bridge = current();
    bug = introduceBug(bridge.personal.code, bugSeed++);
    $("#labBugVerdict").innerHTML = bug
      ? `One executable line changed. Click it before revealing the invariant.`
      : `This source has no safe one-token mutation rule yet.`;
    $("#labBugCode").innerHTML = (bug?.code ?? bridge.personal.code).split("\n").map((line, index) => `
      <button data-line="${index + 1}"><i>${String(index + 1).padStart(2, "0")}</i><code>${hl(line || " ", languageFor(bridge.personal.lang))}</code></button>`).join("");
    host.querySelectorAll<HTMLButtonElement>("#labBugCode button").forEach((button) => {
      button.onclick = () => {
        if (!bug) return;
        const guessed = Number(button.dataset.line);
        const correct = guessed === bug.line;
        button.classList.add(correct ? "correct" : "wrong");
        if (correct) host.querySelector(`#labBugCode button[data-line="${bug.line}"]`)?.classList.add("correct");
        const watchout = bridge.pattern?.trap ?? bridge.personal.pitfalls[0] ?? "Re-check the condition against the smallest edge case.";
        $("#labBugVerdict").innerHTML = `
          <b>${correct ? "Located." : `The mutation is on line ${bug.line}.`}</b>
          <span>${esc(bug.label)}: <code>${esc(bug.before.trim())}</code> became <code>${esc(bug.after.trim())}</code>.</span>
          <p><strong>Broken invariant:</strong> ${esc(invariantForBug(bug))}</p>
          <p><strong>Pattern watchout:</strong> ${watchout}</p>`;
      };
    });
  }

  function loadBridge(): void {
    stop();
    const bridge = current();
    frames = bridge.personal.frames.slice();
    code = bridge.personal.code;
    step = 0;
    predictionAnswered = false;
    mutationSeed = 0;
    $("#labKicker").textContent = `LC ${bridge.personal.num} · ${bridge.personal.difficulty} · ${bridge.personal.pattern}`;
    $("#labTitle").textContent = bridge.personal.name;
    $("#labBadges").innerHTML = `
      <span>${bridge.personal.lang.toUpperCase()}</span>
      <span>${bridge.personal.complexity.time}</span>
      <span class="${bridge.exact && bridge.walk ? "good" : "warn"}">${bridge.exact && bridge.walk ? "exact curriculum bridge" : bridge.walk ? "family analogue" : "curriculum trace gap"}</span>`;
    $("#labSource").setAttribute("href", `https://github.com/RaghhavMalani/leetcode-progress/tree/main/${bridge.personal.dir}`);
    $("#labInput").value = bridge.personal.input;
    $("#labInputNote").textContent = canRunLive(bridge.personal)
      ? "editable · executes locally in CPython"
      : "saved replay only · judge structures need an adapter";
    $("#labRerun").disabled = !canRunLive(bridge.personal);
    $("#labRunStatus").textContent = "Loaded the accepted trace.";
    $("#labN").value = String(Math.min(160, Math.max(4, inputScale(bridge.personal.input) * 4)));
    $("#labSavedSteps").textContent = String(bridge.personal.frames.length);
    $("#labGenericSteps").textContent = String(bridge.walk?.rows.length ?? 0);
    $("#labTime").textContent = bridge.personal.complexity.time;
    $("#labOptimalTime").textContent = bridge.pattern?.tc ?? "not mapped";
    renderFrame();
    compare();
    renderBug();
    $("#labStressOut").innerHTML = "";
  }

  $("#labSearch").oninput = () => {
    selected = 0;
    renderList();
    if (visible.length) loadBridge();
  };
  host.querySelectorAll<HTMLButtonElement>(".lab-filter").forEach((button) => {
    button.onclick = () => {
      filter = button.dataset.filter ?? "all";
      host.querySelectorAll(".lab-filter").forEach((item) => item.classList.toggle("on", item === button));
      selected = 0;
      renderList();
      if (visible.length) loadBridge();
    };
  });

  host.querySelectorAll<HTMLButtonElement>(".lab-mode-tabs button").forEach((button) => {
    button.onclick = () => {
      const mode = button.dataset.labMode;
      host.querySelectorAll(".lab-mode-tabs button").forEach((item) => item.classList.toggle("on", item === button));
      host.querySelectorAll(".lab-mode").forEach((item) => item.classList.remove("on"));
      $(`#labMode${mode![0].toUpperCase()}${mode!.slice(1)}`).classList.add("on");
      stop();
    };
  });

  $("#labPrev").onclick = () => {
    stop();
    step = Math.max(0, step - 1);
    predictionAnswered = false;
    $("#labNext").textContent = "predict next →";
    renderFrame();
  };
  $("#labNext").onclick = next;
  $("#labPlay").onclick = () => {
    if (timer) {
      stop();
      return;
    }
    if (step >= frames.length - 1) step = 0;
    predictionAnswered = true;
    $("#labPlay").textContent = "❚❚ pause";
    timer = window.setInterval(() => {
      if (step >= frames.length - 1) {
        stop();
        return;
      }
      step++;
      predictionAnswered = true;
      renderFrame();
    }, 900);
    renderFrame();
  };
  $("#labMutate").onclick = () => {
    $("#labInput").value = mutateLiteralInput($("#labInput").value, ++mutationSeed);
    $("#labRunStatus").textContent = "Input changed. Run actual code to generate fresh states.";
  };
  $("#labResetInput").onclick = () => {
    $("#labInput").value = current().personal.input;
    $("#labRunStatus").textContent = "Restored the recorded input.";
  };
  $("#labRerun").onclick = async () => {
    const bridge = current();
    const source = buildRunnableSource(bridge.personal, $("#labInput").value);
    if (!source) return;
    const status = $("#labRunStatus");
    $("#labRerun").disabled = true;
    try {
      const py = await getPyodide((message) => { status.innerHTML = message; });
      status.textContent = "Tracing the mutated input…";
      py.globals.set("_SRC", source);
      await py.runPythonAsync(traceHarness(25_000));
      const result = JSON.parse(py.globals.get("_RESULT"));
      const prefixLines = 6;
      const codeLines = bridge.personal.code.split("\n").length;
      const fresh: LabFrame[] = (result.frames ?? [])
        .filter((frame: any) => frame.line >= prefixLines && frame.line < prefixLines + codeLines)
        .map((frame: any) => ({
          line: frame.line - prefixLines + 1,
          type: "live",
          msg: `Executed <b>${esc(frame.fn)}</b> with the mutated input.`,
          vars: Object.entries(frame.vars ?? {}).slice(0, 10).map(([name, value]: [string, any]) => `<b>${esc(name)}</b> = ${esc(value?.d ?? "?")}`),
          out: result.out ? [String(result.out).trim()] : [],
          dynamic: true,
        }));
      if (!fresh.length) {
        status.innerHTML = result.err ? `<b>${esc(result.err)}</b>` : "No method states were traced.";
      } else {
        frames = fresh;
        code = bridge.personal.code;
        step = 0;
        predictionAnswered = false;
        status.innerHTML = result.err
          ? `Generated <b>${fresh.length}</b> states, then raised <b>${esc(result.err)}</b>.`
          : `Generated <b>${fresh.length}</b> fresh states from your actual submission.`;
        renderFrame();
      }
    } catch (error: any) {
      const message = error?.message ?? String(error);
      status.innerHTML = message.startsWith("__HELP__")
        ? pyodideHelp(JSON.parse(message.slice(8)))
        : `<b>${esc(message)}</b>`;
    } finally {
      $("#labRerun").disabled = !canRunLive(bridge.personal);
    }
  };

  $("#labN").oninput = compare;
  $("#labNewBug").onclick = renderBug;
  $("#labStress").onclick = async () => {
    const output = $("#labStressOut");
    $("#labStress").disabled = true;
    output.innerHTML = `<span>Running seeded trials and shrinking the first disagreement…</span>`;
    try {
      const py = await getPyodide((message) => { output.innerHTML = message; });
      py.globals.set("_SRC", stressSampleFor(current()));
      await py.runPythonAsync(stressHarness(3_000));
      const result: StressResult = JSON.parse(py.globals.get("_RESULT"));
      if (result.err) {
        output.innerHTML = `<b>${esc(result.err)}</b>`;
      } else if (!result.found) {
        output.innerHTML = `<b>No disagreement in ${result.trials} trials.</b><span>Widen the generator before trusting the optimized version.</span>`;
      } else {
        output.innerHTML = `
          <div><span>minimal failing input</span><b>${esc(result.minimal ?? "")}</b></div>
          <div><span>brute says</span><b>${esc(result.expected ?? "")}</b></div>
          <div><span>optimized says</span><b>${esc(result.got ?? "")}</b></div>
          <p>Found on trial ${result.trials}; reduced in ${result.shrinks} productive shrink steps from <code>${esc(result.raw ?? "")}</code>.</p>`;
      }
    } catch (error: any) {
      const message = error?.message ?? String(error);
      output.innerHTML = message.startsWith("__HELP__")
        ? pyodideHelp(JSON.parse(message.slice(8)))
        : `<b>${esc(message)}</b>`;
    } finally {
      $("#labStress").disabled = false;
    }
  };

  renderList();
  loadBridge();
}
