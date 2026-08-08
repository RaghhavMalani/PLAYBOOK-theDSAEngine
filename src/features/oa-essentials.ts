import { OA_ESSENTIALS } from "../data/oa-essentials";
import { COMPANIES } from "../data/companies";
import { $, $$, esc, store } from "../lib/dom";
import type { CompanyOA, OAEssentialId, OAEssentialSection, OALesson } from "../types";

interface EssentialProgress {
  [lessonId: string]: {
    choice: number;
    correct: boolean;
  };
}

function relevantCompanies(section: OAEssentialSection): CompanyOA[] {
  const targets = new Set(store<string[]>("targets") ?? []);
  return COMPANIES.filter((company) => {
    const text = [
      company.format,
      company.questions,
      company.edge,
      ...company.extras,
      ...company.archetypes,
    ].join(" ").toLowerCase();
    return section.companyKeywords.some((keyword) => text.includes(keyword));
  }).sort((a, b) => Number(targets.has(b.id)) - Number(targets.has(a.id)) || a.name.localeCompare(b.name));
}

function completed(section: OAEssentialSection, progress: EssentialProgress): number {
  return section.lessons.filter((lesson) => progress[lesson.id]?.correct).length;
}

function companyStrip(section: OAEssentialSection): string {
  const targets = new Set(store<string[]>("targets") ?? []);
  const companies = relevantCompanies(section);
  return `<div class="oa-companies">
    <span class="subtle">appears in the existing company profiles</span>
    <div class="chips">${companies.map((company) =>
      `<span class="chip${targets.has(company.id) ? " chg" : ""}">${esc(company.name)}${targets.has(company.id) ? " · target" : ""}</span>`,
    ).join("")}</div>
  </div>`;
}

function lessonView(lesson: OALesson, index: number, total: number, progress: EssentialProgress): string {
  const saved = progress[lesson.id];
  return `<article class="oa-lesson">
    <div class="oa-lesson-head">
      <div>
        <div class="subtle">lesson ${index + 1}/${total} · ${lesson.minutes} minutes</div>
        <h3>${esc(lesson.title)}</h3>
      </div>
      <span class="badge ${saved?.correct ? "bd" : "bm"}">${saved?.correct ? "checkpoint clear" : "checkpoint open"}</span>
    </div>
    <p class="oa-goal">${esc(lesson.goal)}</p>

    <div class="mini">the repeatable method</div>
    <ol class="oa-method">${lesson.method.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>

    <div class="warn"><b>Trap:</b> ${esc(lesson.trap)}</div>

    <div class="oa-worked">
      <div class="subtle">worked example</div>
      <h4>${esc(lesson.worked.prompt)}</h4>
      <ol>${lesson.worked.steps.map((step) => `<li>${esc(step)}</li>`).join("")}</ol>
      <div class="say"><b>Answer:</b> ${esc(lesson.worked.answer)}</div>
    </div>

    <div class="oa-checkpoint">
      <div class="subtle">closed-book checkpoint</div>
      <h4>${esc(lesson.checkpoint.prompt)}</h4>
      <div class="oa-options">${lesson.checkpoint.choices.map((choice, choiceIndex) => {
        let state = "";
        if (saved && choiceIndex === lesson.checkpoint.answer) state = " right";
        else if (saved && choiceIndex === saved.choice) state = " wrong";
        return `<button class="dopt${state}" data-oa-answer="${choiceIndex}"${saved?.correct ? " disabled" : ""}>
          <s>${String.fromCharCode(65 + choiceIndex)}</s>${esc(choice)}</button>`;
      }).join("")}</div>
      ${saved ? `<div class="${saved.correct ? "say" : "warn"}"><b>${saved.correct ? "Correct." : "Not yet."}</b> ${esc(lesson.checkpoint.explanation)}</div>` :
        '<p class="subtle oa-hint">Commit to one answer before revealing the explanation.</p>'}
    </div>
  </article>`;
}

export function initOAEssentials(): void {
  let sectionId: OAEssentialId = "quant";
  let lessonId = OA_ESSENTIALS[0]!.lessons[0]!.id;
  let progress = store<EssentialProgress>("oaEssentials") ?? {};

  function render(): void {
    const section = OA_ESSENTIALS.find((item) => item.id === sectionId) ?? OA_ESSENTIALS[0]!;
    let lessonIndex = section.lessons.findIndex((lesson) => lesson.id === lessonId);
    if (lessonIndex < 0) lessonIndex = 0;
    const lesson = section.lessons[lessonIndex]!;
    lessonId = lesson.id;
    const allLessons = OA_ESSENTIALS.flatMap((item) => item.lessons);
    const totalDone = allLessons.filter((item) => progress[item.id]?.correct).length;

    $("#v-essentials").innerHTML = `
      <div class="tag"><i></i><span>campus oa // the majority of the paper</span></div>
      <h2 class="mod">OA essentials</h2>
      <p class="brief">DSA is only one section in many campus assessments. This track covers the repeatable non-coding surface: quantitative aptitude, reasoning and verbal, then DBMS, operating systems and networks. Each lesson ends with one closed-book checkpoint; a section is clear only when every checkpoint is correct.</p>

      <div class="boxes oa-overview">
        <div class="box"><div class="bk">sections</div><div class="bv" style="color:var(--cyan)">${OA_ESSENTIALS.length}</div></div>
        <div class="box"><div class="bk">compact lessons</div><div class="bv" style="color:var(--amb)">${allLessons.length}</div></div>
        <div class="box"><div class="bk">checkpoints clear</div><div class="bv" style="color:var(--lime)">${totalDone}/${allLessons.length}</div></div>
        <div class="box"><div class="bk">study time</div><div class="bv">${allLessons.reduce((sum, item) => sum + item.minutes, 0)}m</div></div>
      </div>

      <div class="subtabs oa-tabs">${OA_ESSENTIALS.map((item) => {
        const done = completed(item, progress);
        return `<button class="subtab${item.id === section.id ? " on" : ""}" data-oa-section="${item.id}">
          ${esc(item.label)} <s>${done}/${item.lessons.length}</s></button>`;
      }).join("")}</div>

      <div class="oa-section-intro">
        <div><div class="subtle">${esc(section.eyebrow)}</div><p>${esc(section.description)}</p></div>
        ${companyStrip(section)}
      </div>

      <div class="oa-layout">
        <nav class="oa-lesson-nav" aria-label="${esc(section.label)} lessons">
          ${section.lessons.map((item, itemIndex) => `<button class="oa-lesson-link${item.id === lesson.id ? " on" : ""}" data-oa-lesson="${esc(item.id)}">
            <span>${String(itemIndex + 1).padStart(2, "0")}</span><b>${esc(item.title)}</b>
            <i>${progress[item.id]?.correct ? "✓" : item.minutes + "m"}</i></button>`).join("")}
        </nav>
        ${lessonView(lesson, lessonIndex, section.lessons.length, progress)}
      </div>

      <div class="btnrow oa-next">
        <button class="btn" id="oaPrev" ${lessonIndex === 0 ? "disabled" : ""}>← previous lesson</button>
        <button class="btn" id="oaNext" ${lessonIndex === section.lessons.length - 1 ? "disabled" : ""}>next lesson →</button>
      </div>
      <div class="note"><b>Use this with the Company OA view.</b> Companies highlighted as “target” come from your saved company selection. Clear the relevant section before adding another algorithm family to the week.</div>`;

    $$<HTMLButtonElement>("[data-oa-section]").forEach((button) => {
      button.onclick = () => {
        sectionId = button.dataset.oaSection as OAEssentialId;
        lessonId = OA_ESSENTIALS.find((item) => item.id === sectionId)!.lessons[0]!.id;
        render();
      };
    });
    $$<HTMLButtonElement>("[data-oa-lesson]").forEach((button) => {
      button.onclick = () => { lessonId = button.dataset.oaLesson!; render(); };
    });
    $$<HTMLButtonElement>("[data-oa-answer]").forEach((button) => {
      button.onclick = () => {
        const choice = Number(button.dataset.oaAnswer);
        progress = {
          ...progress,
          [lesson.id]: { choice, correct: choice === lesson.checkpoint.answer },
        };
        store("oaEssentials", progress);
        render();
      };
    });
    $("#oaPrev").onclick = () => {
      if (lessonIndex > 0) { lessonId = section.lessons[lessonIndex - 1]!.id; render(); }
    };
    $("#oaNext").onclick = () => {
      if (lessonIndex + 1 < section.lessons.length) { lessonId = section.lessons[lessonIndex + 1]!.id; render(); }
    };
  }

  render();
}
