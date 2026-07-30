import { $, $$, esc, store } from "../lib/dom";
import { COMPANIES, aggregateWeights } from "../data/companies";
import { topicName } from "../lib/topics";
import type { CompanyOA, ResearchResponse } from "../types";

const pct = (x: number) => Math.round(x * 100);

function weightBars(c: CompanyOA): string {
  const rows = Object.entries(c.weights).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  const max = Math.max(1, ...rows.map(([, w]) => w ?? 0));
  return rows
    .map(([t, w]) => {
      const v = (w ?? 0) / max;
      const col = v > 0.79 ? "var(--mag)" : v > 0.55 ? "var(--amb)" : "var(--cyan)";
      return `<div style="margin-bottom:7px">
        <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px">
          <span>${esc(topicName(t))}</span><span style="color:${col}">${w}/5</span></div>
        <div style="height:3px;background:var(--line);margin-top:4px">
          <i style="display:block;height:3px;width:${pct(v)}%;background:${col}"></i></div>
      </div>`;
    })
    .join("");
}

function card(c: CompanyOA): string {
  return `<div class="console" style="margin-bottom:16px">
    <div class="console-bar"><span class="led"></span><span>${esc(c.name)} · ${esc(c.platform)}</span>
      <span style="flex:1"></span>
      <span style="color:var(--dim)">checked ${esc(c.checked)}</span></div>
    <div class="console-body">
      <div class="grid2">
        <div>
          <div class="subtle">format</div>
          <p style="font-size:13.5px;color:var(--dim);margin:6px 0 14px">${esc(c.format)}</p>
          <div class="boxes" style="margin:0 0 16px">
            <div class="box"><div class="bk">duration</div><div class="bv" style="color:var(--cyan);font-size:17px">${c.durationMin ? c.durationMin + "m" : "—"}</div></div>
            <div class="box"><div class="bk">questions</div><div class="bv" style="color:var(--amb);font-size:17px">${esc(c.questions)}</div></div>
          </div>
          <div class="subtle">what decides pass/fail</div>
          <div class="warn" style="margin-top:8px">${esc(c.edge)}</div>
          ${c.extras.length ? `<div class="subtle" style="margin-top:14px">beyond dsa</div>
            <div class="chips" style="margin-top:7px">${c.extras.map((e) => `<span class="chip">${esc(e)}</span>`).join("")}</div>` : ""}
        </div>
        <div>
          <div class="subtle">topic weighting</div>
          <div style="margin-top:10px">${weightBars(c)}</div>
          <div class="subtle" style="margin-top:16px">reported question shapes</div>
          <ul style="margin:8px 0 0;padding-left:18px;font-size:13px;color:var(--dim);line-height:1.7">
            ${c.archetypes.map((a) => `<li>${esc(a)}</li>`).join("")}
          </ul>
        </div>
      </div>
      <div class="mini">sources</div>
      <div class="lcs">${c.sources.map((s) => `<a class="lc" target="_blank" rel="noopener" href="${esc(s.url)}">${esc(s.label)}</a>`).join("")}</div>
      <div class="btnrow" style="margin-top:16px">
        <button class="btn" data-refresh="${esc(c.id)}" data-name="${esc(c.name)}">↻ pull current reports</button>
        <span class="subtle" id="rs-${esc(c.id)}"></span>
      </div>
      <div id="rr-${esc(c.id)}"></div>
    </div></div>`;
}

async function refresh(id: string, name: string): Promise<void> {
  const status = $("#rs-" + id);
  const out = $("#rr-" + id);
  status.textContent = "searching…";
  try {
    const r = await fetch(`/api/oa-research?company=${encodeURIComponent(name)}`);
    const j = (await r.json()) as ResearchResponse & { error?: string; message?: string };
    if (!r.ok) {
      status.textContent = "";
      out.innerHTML = `<div class="warn" style="margin-top:12px"><b>${esc(j.error ?? "failed")}</b> — ${esc(j.message ?? "")}</div>`;
      return;
    }
    const mentions = Object.entries(j.topicMentions).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0)).slice(0, 8);
    status.textContent = `${j.hits.length} sources via ${j.provider}`;
    out.innerHTML = `
      <div class="say" style="margin-top:14px"><b>Topics mentioned across current reports:</b>
        ${mentions.map(([t, n]) => `<span class="chip" style="margin:4px 4px 0 0">${esc(topicName(t))} <b>${n}</b></span>`).join("")}
      </div>
      <div class="mini">what people are reporting right now</div>
      <div style="display:grid;gap:8px">
        ${j.hits.map((h) => `<a class="lc" style="display:block;text-align:left;padding:10px 12px" target="_blank" rel="noopener" href="${esc(h.url)}">
            <b style="color:var(--txt)">${esc(h.title)}</b>
            <div style="color:var(--dim);margin-top:4px;font-family:var(--disp);font-size:12.5px">${esc(h.snippet.slice(0, 220))}</div>
            <div style="color:var(--amb);margin-top:4px">${esc(h.host)}</div></a>`).join("")}
      </div>
      <p class="subtle" style="margin-top:12px;letter-spacing:0;text-transform:none;font-family:var(--disp);font-size:12px">${esc(j.note ?? "")}</p>`;
  } catch (e) {
    status.textContent = "";
    out.innerHTML = `<div class="warn" style="margin-top:12px">Live research needs the app deployed with a search API key. ${esc(e instanceof Error ? e.message : String(e))}</div>`;
  }
}

export function initCompanies(): void {
  const saved = (store<string[]>("targets") ?? ["google", "meta", "microsoft", "apple", "visa", "amex"]) as string[];
  let targets = new Set(saved);

  function render(): void {
    const agg = aggregateWeights([...targets]);
    $("#v-companies").innerHTML = `
      <div class="tag"><i></i><span>oa intelligence // what these companies actually ask</span></div>
      <h2 class="mod">Company OA</h2>
      <p class="brief">Formats, topic weighting and reported question shapes for the companies you're targeting — the gap LeetCode Premium leaves when a company isn't listed. Every entry cites its sources and carries the date it was checked. Tick your targets and the <b>study priority</b> below re-weights to match.</p>

      <div class="btnrow" style="margin-bottom:18px">
        ${COMPANIES.map((c) => `<button class="btn${targets.has(c.id) ? " on" : ""}" data-target="${c.id}">${esc(c.name)}</button>`).join("")}
      </div>

      <div class="console" style="margin-bottom:22px">
        <div class="console-bar"><span class="led" style="background:var(--amb)"></span>
          <span>study priority across your ${targets.size} selected ${targets.size === 1 ? "company" : "companies"}</span></div>
        <div class="console-body">
          ${agg.length === 0 ? '<p class="subtle">Pick at least one company.</p>' : agg.map((r) => {
            const col = r.pct > 0.79 ? "var(--mag)" : r.pct > 0.5 ? "var(--amb)" : "var(--cyan)";
            return `<div style="margin-bottom:9px">
              <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:12px">
                <span style="color:var(--txt)">${esc(topicName(r.topic))}</span>
                <span style="color:${col}">${r.total}</span></div>
              <div style="height:4px;background:var(--line);margin-top:5px">
                <i style="display:block;height:4px;width:${pct(r.pct)}%;background:${col}"></i></div></div>`;
          }).join("")}
          <div class="note" style="margin:18px 0 0">Read this top-down. The top four are where your next week goes; anything in the bottom third is not what loses you these interviews.</div>
        </div>
      </div>

      ${COMPANIES.filter((c) => targets.has(c.id)).map(card).join("")}

      <div class="note"><b>On the numbers:</b> the 0–5 weights are directional, synthesised from what recurs across public interview reports. Nobody publishes measured frequencies, so treat them as a prior rather than a fact — and click through to the sources before you reorganise a week around one bar.</div>`;

    $$("[data-target]").forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.target!;
        if (targets.has(id)) targets.delete(id); else targets.add(id);
        store("targets", [...targets]);
        render();
      };
    });
    $$("[data-refresh]").forEach((b) => {
      b.onclick = () => void refresh(b.dataset.refresh!, b.dataset.name!);
    });
  }
  render();
}
