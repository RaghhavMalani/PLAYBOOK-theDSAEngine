import { $, $$, esc, store } from "../lib/dom";
import { PRIMERS, TOPICS, COVERAGE } from "../data/index";
import type { TopicPrimer } from "../types";

const label = (id: string) => TOPICS.find(([t]) => t === id)?.[1] ?? id;

function opsTable(p: TopicPrimer): string {
  return `<table class="t">
    <tr><th>operation</th><th style="width:150px">cost</th><th>note</th></tr>
    ${p.ops.map(([op, cost, note]) => `<tr>
      <td><code>${esc(op)}</code></td>
      <td><span class="O ${/O\(1\)|α/.test(cost) ? "O1" : /log/.test(cost) ? "Ol" : /2ⁿ|n!|n²|n³|V³|V·E/.test(cost) ? "Ob" : "On"}">${esc(cost)}</span></td>
      <td style="color:var(--dim)">${note}</td></tr>`).join("")}
  </table>`;
}

function edgeTable(edges: readonly { input: string; effect: string; fix: string }[]): string {
  return `<table class="t edget">
    <tr><th style="width:26%">input</th><th style="width:40%">what actually goes wrong</th><th>what to do</th></tr>
    ${edges.map((e) => `<tr>
      <td><b>${e.input}</b></td>
      <td style="color:var(--mag)">${e.effect}</td>
      <td style="color:var(--dim)">${e.fix}</td></tr>`).join("")}
  </table>`;
}

function paras(text: string): string {
  return text.split("\n\n").map((x) => `<p>${x}</p>`).join("");
}

function card(p: TopicPrimer): string {
  return `<div class="console primer" id="pr-${p.id}">
    <div class="console-bar"><span class="led"></span><span>${esc(label(p.id))}</span>
      <span style="flex:1"></span>
      <button class="btn" data-jump="${p.id}" style="padding:5px 10px;font-size:10px">patterns →</button></div>
    <div class="console-body">
      <p class="oneline">${p.oneLine}</p>

      <div class="diagram">${p.svg}</div>
      <p class="capt">${p.caption}</p>

      <div class="mini">the mental model</div>
      <div class="model">${paras(p.model)}</div>

      <div class="mini">the load-bearing invariant</div>
      <div class="proof">${p.invariant}</div>

      <div class="mini">what each operation costs</div>
      ${opsTable(p)}

      <div class="grid2" style="margin:18px 0 4px">
        <div class="card"><h5 style="color:var(--lime)">reach for it when</h5>
          <ul>${p.reach.map((r) => `<li>${r}</li>`).join("")}</ul></div>
        <div class="card"><h5 style="color:var(--mag)">do not, when</h5>
          <ul>${p.avoid.map((r) => `<li>${r}</li>`).join("")}</ul></div>
      </div>

      <div class="mini">edge cases that break correct-looking code</div>
      ${edgeTable(p.edges)}
    </div></div>`;
}

export function initPrimers(): void {
  let open = (store<string>("primer") ?? "") || PRIMERS[0]!.id;

  function render(): void {
    const p = PRIMERS.find((x) => x.id === open) ?? PRIMERS[0]!;
    $("#v-primers").innerHTML = `
      <div class="tag"><i></i><span>foundations // understand it, do not just recognise it</span></div>
      <h2 class="mod">Topic primers</h2>
      <p class="brief">The layer above patterns. What each structure actually <b>is</b>, the invariant that makes it work, what every operation costs, when to reach for it and when not — and the edge cases that break code which looks correct. ${COVERAGE.primers} topics, ${COVERAGE.primerEdgeRows} documented edge cases, each with a diagram.</p>

      <div class="btnrow" style="margin-bottom:20px">
        ${PRIMERS.map((x) => `<button class="btn${x.id === open ? " on" : ""}" data-pr="${x.id}">${esc(label(x.id))}</button>`).join("")}
      </div>

      ${card(p)}

      <div class="note"><b>How to use this page.</b> Read the primer for a topic <em>before</em> the patterns under it. The patterns tell you which template to reach for; this tells you why the template is allowed to work — which is what you need when the interviewer removes an assumption and the template stops applying.</div>`;

    $$("[data-pr]").forEach((b) => {
      b.onclick = () => { open = b.dataset.pr!; store("primer", open); render(); try { window.scrollTo(0, 0); } catch { /* jsdom */ } };
    });
    $$("[data-jump]").forEach((b) => {
      b.onclick = () => {
        const tab = $$(".navtab").find((t) => t.dataset.v === "patterns");
        if (tab) tab.click();
        const topicBtn = $$("#topics .topic").find((t) => t.dataset.t === b.dataset.jump);
        if (topicBtn) topicBtn.click();
      };
    });
  }
  render();
}
