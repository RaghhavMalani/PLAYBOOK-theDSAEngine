import { $, $$, esc, store } from "../lib/dom";
import { COVERAGE } from "../data/index";
import { LADDER, ladderHours } from "../data/ladder";
import { showView } from "./router";
import type { ViewId } from "./router";
import { readLog } from "./mistakes";
import { queueRecallPattern } from "./drill";
import { buildTodayMission, type MissionKind, type MissionStep, type TodayMission } from "./today";
import { topicName } from "../lib/topics";

/**
 * Orientation.
 *
 * There are eleven tools here and no obvious order. Left alone, the failure mode is
 * predictable: you read the pattern index because it is the biggest, feel productive,
 * and never touch the two things that actually change outcomes (the drill and the
 * mistake log). This page routes you by situation instead of by feature name.
 */

interface Route {
  when: string;
  go: ViewId;
  label: string;
  why: string;
}

const ROUTES: readonly Route[] = [
  {
    when: "I am stuck on a problem right now",
    go: "patterns",
    label: "Pattern index",
    why: "Search by <em>symptom</em>, not by name — type <code>contiguous</code>, <code>O(1) space</code>, <code>cycle</code>. Read only the <b>signal</b> line of each hit. If one matches, open it; if none do, you have mis-read the problem, not forgotten a template.",
  },
  {
    when: "I just failed a problem",
    go: "log",
    label: "Mistake log",
    why: "<b>Before</b> you read the solution. Write one line: the signal you missed. After you read the editorial you will write down the solution instead, and the solution is not what failed — recognition was.",
  },
  {
    when: "My solution is wrong and I cannot see why",
    go: "viz",
    label: "Stress tester",
    why: "Write the brute force you trust and the fast one you do not. It finds the smallest input where they disagree — usually two or three elements — then hands it to the tracer. Beats staring at the code.",
  },
  {
    when: "I do not understand a topic, not just a problem",
    go: "primers",
    label: "Foundations",
    why: "The layer above patterns: what the structure <em>is</em>, the invariant that makes it work, what every operation costs, and when not to use it. Read the primer before the patterns under it.",
  },
  {
    when: "I have 20 minutes and nothing specific to do",
    go: "drill",
    label: "Drill",
    why: "Twelve seconds to name the pattern from its signal. Weighted toward what you have actually logged as missed, and scheduled by date so it spreads across weeks. This is the highest-value idle activity here.",
  },
  {
    when: "I have an OA or interview tomorrow",
    go: "sheet",
    label: "Revision sheet",
    why: "Printable, one page, constraint→complexity table and the traps that cost offers. Read it, then read your mistake log. Do not start new topics the night before.",
  },
  {
    when: "I want to know what a specific company asks",
    go: "companies",
    label: "Company OA",
    why: "Format, duration, question count, topic weighting and reported question shapes for <b>25 companies</b> — including TCS NQT, Infosys, Zoho, Flipkart, Swiggy, Razorpay and Amazon. Tick your targets and the study-priority panel re-weights across them.",
  },
  {
    when: "My correct solution is timing out",
    go: "io",
    label: "Fast I/O",
    why: "Usually not the algorithm. <code>Scanner</code>, <code>endl</code>, <code>input()</code> in a loop, and <code>pop(0)</code> each turn a passing solution into a TLE. One template per language.",
  },
  {
    when: "I want to practise the way Google and Meta actually test",
    go: "viz",
    label: "Whiteboard mode",
    why: "In the visualiser toolbar. No highlighting, no output, no run button until you commit. Tracks whether your code ran <b>first try</b> — the number those rounds measure.",
  },
  {
    when: "I do not know what to study this week",
    go: "plan",
    label: "4-week plan",
    why: "Week by week, ordered by frequency rather than by textbook chapter. Coverage beats depth when you do not get to pick the question.",
  },
];

interface Tool {
  id: ViewId;
  name: string;
  what: string;
  use: string[];
  skip: string;
}

const TOOLS: readonly Tool[] = [
  {
    id: "primers",
    name: "Foundations",
    what: "One primer per topic: mental model, the load-bearing invariant, an operation-cost table, when to reach for it and when not, plus edge cases — each with a diagram.",
    use: [
      "You can apply a template but could not explain why it is allowed to work",
      "An interviewer removed an assumption and the template stopped applying",
      "You are starting a topic from scratch",
    ],
    skip: "You already know the topic and just need the code — go straight to the pattern index.",
  },
  {
    id: "patterns",
    name: "Pattern index",
    what: `${COVERAGE.total} patterns, each with the signal that identifies it, why it works, the trap that costs the round, a line to say out loud, and code in Python, C++ and Java. Hard-tier entries add a derivation and a proof sketch.`,
    use: [
      "You need the template and its trap in one place",
      "You want the follow-up ladder — what they ask <em>after</em> you solve it",
      "You are looking for problems to drill on a specific pattern",
    ],
    skip: "You are reading it front to back. That feels productive and teaches almost nothing — use the drill instead.",
  },
  {
    id: "viz",
    name: "Visualiser",
    what: "Three tools in one. <b>Trace</b> steps through real CPython line by line. <b>Complexity analyser</b> measures your actual growth rate by timing. <b>Stress tester</b> hunts for a minimal counterexample.",
    use: [
      "Trace: the state is too complex to hold in your head — DP tables, recursion, graph traversals",
      "Complexity: you suspect a hidden quadratic (<code>pop(0)</code>, <code>x in list</code>, string building)",
      "Stress: your solution fails a hidden test and you cannot reproduce it",
    ],
    skip: "You are on a phone — it is desktop-only, and deliberately hidden there rather than shipped broken.",
  },
  {
    id: "drill",
    name: "Drill",
    what: "Timed signal→pattern recall with Leitner boxes scheduled by date. Distractors come from the same topic, so it is genuinely hard. Also holds the mock OA timer.",
    use: [
      "Any spare 20 minutes — this is the default activity",
      "You want the recognition speed a 45-minute two-problem round demands",
      "Week 4, when you should not be learning new topics",
    ],
    skip: "You have not covered the topic yet. Drilling before learning just teaches you the shape of your own ignorance.",
  },
  {
    id: "log",
    name: "Mistake log",
    what: "One line per failure: the signal you missed. Feeds the drill's weighting so it targets your actual failure modes.",
    use: [
      "Every single time a problem beats you — before reading the solution",
      "Five minutes before any assessment",
      "Sunday, to see which topic keeps reappearing",
    ],
    skip: "Never. This is the one thing here you cannot regenerate unless you have downloaded a learning-data backup.",
  },
  {
    id: "progress",
    name: "Your coverage",
    what: "Reads the committed snapshot of your solved-problem repo and shows which playbook patterns are still cold, ranked by company demand.",
    use: [
      "Choosing the next pattern from evidence instead of comfort",
      "Checking whether solved volume is turning into pattern breadth",
      "Finding the next unsolved anchor for a target company",
    ],
    skip: "The progress snapshot has not been refreshed after your latest solved work.",
  },
  {
    id: "companies",
    name: "Company OA",
    what: "Researched formats and topic weightings for <b>25 companies</b> across global product, Indian product/unicorn, fintech and the service giants — each with cited sources, a checked date and a live-refresh endpoint.",
    use: [
      "Deciding what to prioritise given your specific target list",
      "The week before an OA, to know the format you will face",
      "Realising a TCS NQT is 60 aptitude questions with 2 coding problems attached — and preparing accordingly",
    ],
    skip: "You are treating the 0–5 weights as measured data. They are directional, synthesised from public reports — read the sources.",
  },
  {
    id: "io",
    name: "Fast I/O",
    what: "The correct-but-slow failures: buffered reading per language, the overflow table, and the constraint→complexity map.",
    use: [
      "Before your first OA on a new platform",
      "Any time a correct solution times out",
    ],
    skip: "Interview rounds — nobody cares about I/O when there is no judge.",
  },
  {
    id: "sql",
    name: "SQL",
    what: "Execution order, joins, aggregates, window functions, and the Nth-highest classic. Small, closed, highly learnable surface.",
    use: [
      "Visa and Amex — their assessments have included a SQL section",
      "Two hours, once, and then never again",
    ],
    skip: "You are only targeting pure-DSA product companies.",
  },
  {
    id: "plan",
    name: "4-week plan",
    what: "Week-by-week topic ordering by frequency, plus what each company actually scores.",
    use: ["Sunday planning", "Deciding whether to go deep or wide"],
    skip: "You are more than three months out — go deeper per topic instead.",
  },
  {
    id: "sheet",
    name: "Revision sheet",
    what: "One printable page: constraint→complexity, signal→pattern for every pattern, and the per-language traps. Generated from the pattern data, so it cannot drift.",
    use: ["The night before", "The train on the way there", "Print it once and annotate by hand"],
    skip: "You are trying to learn from it. It is a reminder, not a teacher.",
  },
];

interface TodayProgress {
  date: string;
  completed: MissionKind[];
}

function missionStep(step: MissionStep, done: boolean): string {
  const action = step.kind === "recall"
    ? `<button class="btn on" data-recall="${esc(step.pattern.n)}">${esc(step.action)} →</button>`
    : step.href
      ? `<a class="btn on" href="${esc(step.href)}" target="_blank" rel="noopener">${esc(step.action)} ↗</a>`
      : "";
  return `<article class="mission-step${done ? " is-done" : ""}" data-step="${step.id}">
    <div class="mission-index">${step.kind === "recall" ? "01" : step.kind === "anchor" ? "02" : "03"}</div>
    <div class="mission-main">
      <div class="mission-kicker">${esc(step.kicker)} <span>${step.minutes} min</span></div>
      <h3>${esc(step.title)}</h3>
      <div class="mission-pattern">${esc(topicName(step.pattern.t))} · ${esc(step.pattern.n)}</div>
      <p>${esc(step.reason)}</p>
      <details class="mission-why">
        <summary>why this won</summary>
        <div class="mission-signals">${step.signals.map((signal) => `<span data-signal="${signal.key}">${esc(signal.label)}</span>`).join("")}</div>
      </details>
      <div class="mission-actions">${action}
        <button class="btn mission-check${done ? " on" : ""}" data-complete="${step.id}" aria-pressed="${done}">${done ? "✓ complete" : "mark complete"}</button>
      </div>
    </div>
  </article>`;
}

function missionMarkup(mission: TodayMission): string {
  const saved = store<TodayProgress>("today");
  const progress: TodayProgress = saved?.date === mission.date ? saved : { date: mission.date, completed: [] };
  const done = new Set(progress.completed);
  const pct = Math.round(done.size / mission.steps.length * 100);
  return `<div class="mission-shell">
    <div class="mission-head">
      <div>
        <div class="tag"><i></i><span>today mode // one loop, no menu anxiety</span></div>
        <h2 class="mod">Today’s <em>${mission.totalMinutes}-minute mission</em></h2>
        <p class="mission-summary">1 recall drill <i>·</i> 1 cold anchor <i>·</i> 1 timed re-solve</p>
      </div>
      <div class="mission-progress" aria-label="${done.size} of ${mission.steps.length} complete">
        <strong>${done.size}<span>/3</span></strong><small>complete</small>
      </div>
    </div>
    <div class="mission-meter"><i style="width:${pct}%"></i></div>
    <div class="mission-formula">
      <span>company demand</span><b>×</b><span>coverage gap</span><b>×</b><span>time since attempt</span><b>×</b><span>mistakes</span><b>×</b><span>failed recall</span><b>×</b><span>re-solve weakness</span>
      <em>${esc(mission.targetLabel)}</em>
    </div>
    <div class="mission-list">${mission.steps.map((step) => missionStep(step, done.has(step.id))).join("")}</div>
    ${done.size === mission.steps.length ? `<div class="mission-finish"><b>Mission complete.</b> Stop. Consistency beats turning one good day into a burnout day.</div>` : ""}
  </div>`;
}

export function initGuide(): void {
  const mission = buildTodayMission({
    targetCompanyIds: store<string[]>("targets") ?? ["google", "meta", "microsoft", "apple", "visa", "amex"],
    mistakes: readLog(),
    boxes: store<Record<string, number | { box: number; due: number }>>("boxes") ?? {},
  });

  $("#v-guide").innerHTML = `
    <div id="todayMission">${missionMarkup(mission)}</div>

    <section class="today-secondary">
      <div class="today-secondary-head">
        <div>
          <div class="subtle">off-mission</div>
          <h3>Need something else?</h3>
        </div>
        <p>The engine is still here. Today Mode simply chooses the default.</p>
      </div>

      <details class="engine-drawer">
        <summary>Find a tool for my situation <span>10 routes →</span></summary>
        <div class="console drawer-body">
          <div class="console-body" style="padding:0">
            ${ROUTES.map((r, i) => `<div class="route" data-go="${r.go}">
              <div class="rn">${String(i + 1).padStart(2, "0")}</div>
              <div class="rb"><div class="rw">${esc(r.when)}</div><div class="ry">${r.why}</div></div>
              <div class="rg">${esc(r.label)} →</div>
            </div>`).join("")}
          </div>
        </div>
      </details>

      <details class="engine-drawer">
        <summary>Starting from zero <span>${LADDER.length} rungs · ${ladderHours().low}–${ladderHours().high} hours →</span></summary>
        <div class="drawer-content">
          <p class="brief">Everything else assumes you know what a hash map is. This path does not. Each rung has a gate because the ordering is load-bearing: recursion unlocks trees, graphs, backtracking and DP.</p>
          <div class="ladder-path">
            ${LADDER.map((r) => `<div class="lrung" data-topics="${r.topics.join(",")}">
              <div class="lnum">${r.n}</div><div class="lbody">
                <div class="lhead"><span class="lt">${esc(r.title)}</span><span class="lh">${esc(r.hours)} h</span></div>
                <div class="lgate"><b>Before you start:</b> ${r.before}</div><div class="llearn">${r.learn}</div>
                <div class="lunlock"><b>Why it comes here.</b> ${r.unlocks}</div><div class="ldone"><b>You are done when:</b> ${r.done}</div>
                <div class="lreach">${esc(r.reaches)}</div>
                ${r.topics.length ? `<button class="btn" data-lgo="${r.topics[0]}" style="margin-top:11px;padding:5px 11px;font-size:10px">patterns for this rung →</button>` : ""}
              </div>
            </div>`).join("")}
          </div>
        </div>
      </details>

      <details class="engine-drawer">
        <summary>Browse the complete engine <span>${TOOLS.length} tools →</span></summary>
        <div class="drawer-content">
          <div class="grid2">
            ${TOOLS.map((t) => `<div class="card toolcard" data-go="${t.id}">
              <h5>${esc(t.name)}</h5><p style="font-size:13px;color:var(--dim);margin:0 0 12px;line-height:1.65">${t.what}</p>
              <div class="subtle" style="color:var(--lime)">use it when</div><ul style="margin:6px 0 12px">${t.use.map((u) => `<li>${u}</li>`).join("")}</ul>
              <div class="subtle" style="color:var(--mag)">skip it when</div><p style="font-size:12.5px;color:var(--dim);margin:6px 0 0;line-height:1.6">${t.skip}</p>
            </div>`).join("")}
          </div>
          <div class="note"><b>What is actually finished.</b> ${COVERAGE.total} patterns, all with signal / why / trap / say and three languages. <b>${COVERAGE.withLadder}</b> carry a follow-up ladder, <b>${COVERAGE.withEdges}</b> an edge-case matrix, and <b>${COVERAGE.withWalks}</b> a worked trace.</div>
        </div>
      </details>
    </section>`;

  function bindMission(): void {
    $$("[data-recall]").forEach((button) => {
      button.onclick = () => {
        queueRecallPattern(button.dataset.recall!);
        showView("drill");
      };
    });
    $$("[data-complete]").forEach((button) => {
      button.onclick = () => {
        const saved = store<TodayProgress>("today");
        const current: TodayProgress = saved?.date === mission.date ? saved : { date: mission.date, completed: [] };
        const id = button.dataset.complete as MissionKind;
        current.completed = current.completed.includes(id)
          ? current.completed.filter((kind) => kind !== id)
          : [...current.completed, id];
        store("today", current);
        $("#todayMission").innerHTML = missionMarkup(mission);
        bindMission();
      };
    });
  }

  bindMission();
  $$(".route, .toolcard").forEach((el) => { el.onclick = () => showView(el.dataset.go as ViewId); });
  $$("[data-lgo]").forEach((el) => {
    el.onclick = (e) => {
      e.stopPropagation();
      showView("patterns");
      const topic = $$("#topics .topic").find((candidate) => candidate.dataset.t === el.dataset.lgo);
      if (topic) topic.click();
    };
  });
}
