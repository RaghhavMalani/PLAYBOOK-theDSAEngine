import { $, $$, esc, store } from "../lib/dom";
import { PATTERNS, TOPICS } from "../data/index";
import { topicName } from "../lib/topics";
import type { TopicId } from "../types";

/**
 * The mistake log.
 *
 * The entry is deliberately the SIGNAL YOU MISSED, not the problem and not the
 * solution. "Saw contiguous, reached for two pointers, it was prefix sums" is worth
 * more than a copy of the correct code, because the thing that failed was recognition
 * — and recognition is what a timed round tests.
 *
 * After a few weeks this is a list of *your* failure modes rather than the average
 * candidate's, which is why it beats everything else in this repo.
 */

export interface Mistake {
  id: string;
  /** ISO date, day resolution — you log once, you do not edit timestamps */
  date: string;
  topic: TopicId | "";
  /** the pattern you SHOULD have reached for, if you know it now */
  pattern: string;
  /** the recognition failure, in your own words */
  signal: string;
  /** optional: problem number or name */
  problem: string;
  /** how many times you have reviewed it */
  reviews: number;
}

const KEY = "mistakes";
const DAY = 86_400_000;

export const readLog = (): Mistake[] => (store<Mistake[]>(KEY) ?? []) as Mistake[];
const writeLog = (m: Mistake[]) => store(KEY, m);

/** Topics you have actually got wrong, most-missed first. Drill uses this. */
export function missedTopics(): Map<TopicId, number> {
  const out = new Map<TopicId, number>();
  for (const m of readLog()) {
    if (!m.topic) continue;
    out.set(m.topic, (out.get(m.topic) ?? 0) + 1);
  }
  return out;
}

const daysAgo = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / DAY);

function toMarkdown(list: Mistake[]): string {
  const byTopic = new Map<string, Mistake[]>();
  for (const m of list) {
    const k = m.topic ? topicName(m.topic) : "Unsorted";
    if (!byTopic.has(k)) byTopic.set(k, []);
    byTopic.get(k)!.push(m);
  }
  let out = `# Mistake log\n\n${list.length} entries · exported ${new Date().toISOString().slice(0, 10)}\n\n`;
  out += `The signal missed, not the problem. Read this before an assessment.\n\n`;
  for (const [topic, ms] of [...byTopic].sort((a, b) => b[1].length - a[1].length)) {
    out += `## ${topic}  (${ms.length})\n\n`;
    for (const m of ms) {
      out += `- **${m.signal.replace(/\n+/g, " ")}**\n`;
      if (m.pattern) out += `  - should have used: ${m.pattern}\n`;
      if (m.problem) out += `  - problem: ${m.problem}\n`;
      out += `  - logged: ${m.date}\n`;
    }
    out += `\n`;
  }
  return out;
}

export function initMistakes(): void {
  let filter: "all" | "review" = "all";

  function add(): void {
    const signal = ($("#mkSignal") as HTMLTextAreaElement).value.trim();
    if (!signal) {
      $("#mkHint").textContent = "Write the signal you missed — one line is enough.";
      return;
    }
    const list = readLog();
    list.unshift({
      id: String(Date.now()),
      date: new Date().toISOString().slice(0, 10),
      topic: ($("#mkTopic") as HTMLSelectElement).value as TopicId | "",
      pattern: ($("#mkPattern") as HTMLSelectElement).value,
      signal,
      problem: $("#mkProblem").value.trim(),
      reviews: 0,
    });
    writeLog(list);
    ($("#mkSignal") as HTMLTextAreaElement).value = "";
    $("#mkProblem").value = "";
    render();
  }

  function render(): void {
    const list = readLog();
    const due = list.filter((m) => daysAgo(m.date) >= 3);
    const shown = filter === "review" ? due : list;

    const counts = missedTopics();
    const ranked = [...counts].sort((a, b) => b[1] - a[1]);

    $("#v-log").innerHTML = `
      <div class="tag"><i></i><span>the log // your failure modes, not the average candidate's</span></div>
      <h2 class="mod">Mistake log</h2>
      <p class="brief">Record <b>the signal you missed</b> — not the problem, not the solution. <em>"Saw contiguous, reached for two pointers, it was prefix sums."</em> Recognition is what a timed round tests, so recognition failures are what is worth writing down. After three weeks this is worth more than anything else here, because it is about you.</p>

      <div class="vzgrid" style="align-items:start">
        <div class="console">
          <div class="console-bar"><span class="led"></span><span>log a miss</span></div>
          <div class="console-body" style="padding:16px">
            <div class="subtle">what did you fail to recognise?</div>
            <textarea id="mkSignal" placeholder="Saw 'contiguous', reached for two pointers — it was prefix sums." style="min-height:84px;margin-top:7px"></textarea>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:11px">
              <div>
                <div class="subtle">topic</div>
                <select id="mkTopic" style="width:100%;margin-top:5px;padding:8px">
                  <option value="">— pick a topic —</option>
                  ${TOPICS.map(([id, l]) => `<option value="${id}">${esc(l)}</option>`).join("")}
                </select>
              </div>
              <div>
                <div class="subtle">should have used</div>
                <select id="mkPattern" style="width:100%;margin-top:5px;padding:8px">
                  <option value="">— optional —</option>
                  ${PATTERNS.map((p) => `<option value="${esc(p.n)}">${esc(p.n)}</option>`).join("")}
                </select>
              </div>
            </div>

            <div class="subtle" style="margin-top:11px">problem <span style="text-transform:none;letter-spacing:0">(optional)</span></div>
            <input type="text" id="mkProblem" placeholder="LC 560, or the OA question" style="margin-top:5px">

            <div class="btnrow" style="margin-top:13px">
              <button class="btn on" id="mkAdd">log it</button>
              <span class="subtle" id="mkHint" style="letter-spacing:0;text-transform:none;font-family:var(--disp);font-size:12px"></span>
            </div>
          </div>
        </div>

        <div class="console">
          <div class="console-bar"><span class="led" style="background:var(--amb);box-shadow:0 0 8px var(--amb)"></span><span>where you actually lose points</span></div>
          <div class="console-body" style="padding:16px">
            ${ranked.length === 0
              ? `<p style="color:var(--dim);font-size:13.5px;margin:0">Nothing logged yet. Log your next three misses and this becomes the most useful panel on the site — the drill will start targeting these topics automatically.</p>`
              : ranked.map(([t, n]) => {
                  const w = n / ranked[0]![1];
                  const col = w > 0.79 ? "var(--mag)" : w > 0.45 ? "var(--amb)" : "var(--cyan)";
                  return `<div style="margin-bottom:9px">
                    <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:12px">
                      <span>${esc(topicName(t))}</span><span style="color:${col}">${n}</span></div>
                    <div style="height:4px;background:var(--line);margin-top:5px">
                      <i style="display:block;height:4px;width:${Math.round(w * 100)}%;background:${col}"></i></div></div>`;
                }).join("")}
            ${ranked.length ? `<div class="say" style="margin-top:14px"><b>The drill is now weighted toward these.</b> Your top topic comes up roughly three times as often as an unlogged one.</div>` : ""}
          </div>
        </div>
      </div>

      <div class="btnrow" style="margin:22px 0 14px">
        <button class="btn${filter === "all" ? " on" : ""}" data-f="all">all <s style="text-decoration:none;opacity:.6">${list.length}</s></button>
        <button class="btn${filter === "review" ? " on" : ""}" data-f="review">ready to review <s style="text-decoration:none;opacity:.6">${due.length}</s></button>
        <span style="flex:1"></span>
        <button class="btn" id="mkExport" ${list.length ? "" : "disabled"}>export as markdown</button>
        <button class="btn mag" id="mkClear" ${list.length ? "" : "disabled"}>clear all</button>
      </div>

      ${shown.length === 0
        ? `<div class="card"><p style="margin:0;color:var(--dim);font-size:13.5px">${
            filter === "review"
              ? "Nothing is due yet — entries appear here three days after you log them, which is roughly when you have forgotten them."
              : "Empty. The next time a problem beats you, come here first and write one line before you look at the solution."
          }</p></div>`
        : shown.map((m) => `<div class="mistake">
            <div class="mh">
              <span class="mtopic">${m.topic ? esc(topicName(m.topic)) : "unsorted"}</span>
              <span class="mage">${daysAgo(m.date) === 0 ? "today" : daysAgo(m.date) + "d ago"}</span>
              ${m.reviews ? `<span class="mrev">reviewed ${m.reviews}×</span>` : ""}
              <span style="flex:1"></span>
              <button class="btn" data-rev="${m.id}" style="padding:4px 9px;font-size:9.5px">reviewed</button>
              <button class="btn mag" data-del="${m.id}" style="padding:4px 9px;font-size:9.5px">delete</button>
            </div>
            <div class="msig">${esc(m.signal)}</div>
            ${m.pattern || m.problem ? `<div class="mmeta">
              ${m.pattern ? `<span>should have used <b>${esc(m.pattern)}</b></span>` : ""}
              ${m.problem ? `<span>${esc(m.problem)}</span>` : ""}
            </div>` : ""}
          </div>`).join("")}

      <div class="note"><b>How to use it.</b> Log the miss <em>before</em> you read the solution — after you read it, you will write down the solution instead of the recognition failure, and the recognition failure is the whole point. Then read this page for five minutes before every assessment.</div>`;

    $("#mkAdd").onclick = add;
    ($("#mkSignal") as HTMLTextAreaElement).addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); add(); }
    });
    $$("[data-f]").forEach((b) => { b.onclick = () => { filter = b.dataset.f as "all" | "review"; render(); }; });
    $$("[data-del]").forEach((b) => {
      b.onclick = () => { writeLog(readLog().filter((m) => m.id !== b.dataset.del)); render(); };
    });
    $$("[data-rev]").forEach((b) => {
      b.onclick = () => {
        const l = readLog();
        const m = l.find((x) => x.id === b.dataset.rev);
        if (m) { m.reviews++; m.date = new Date().toISOString().slice(0, 10); }
        writeLog(l); render();
      };
    });
    $("#mkExport").onclick = () => {
      const blob = new Blob([toMarkdown(readLog())], { type: "text/markdown" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "mistake-log.md";
      a.click();
      URL.revokeObjectURL(a.href);
    };
    $("#mkClear").onclick = () => {
      if (confirm("Delete every entry? This is the one thing here you cannot regenerate.")) {
        writeLog([]); render();
      }
    };
  }

  render();
}
