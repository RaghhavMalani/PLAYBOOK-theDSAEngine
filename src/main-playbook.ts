import "./styles/tokens.css";
import "./styles/playbook.css";

import { initRouter } from "./features/router";
import { initGuide } from "./features/guide";
import { initPrimers } from "./features/primers";
import { initPatterns } from "./features/patterns";
import { initVisualiser } from "./features/visualiser";
import { initDrill } from "./features/drill";
import { initMistakes } from "./features/mistakes";
import { initProgress } from "./features/progress";
import { initTracePlay } from "./features/traceplay";
import { initCompanies } from "./features/companies";
import { initOAEssentials } from "./features/oa-essentials";
import { initPages } from "./features/pages";
import { initSheet } from "./features/sheet";
import { initArena } from "./features/arena";
import { initInterviewer } from "./features/interviewer";
import { $ } from "./lib/dom";
import { initCloudSync } from "./lib/cloud-sync";
import { initPwa } from "./lib/pwa";

function boot(): void {
  initPwa();
  initCloudSync();
  initRouter();
  initArena();
  initInterviewer();
  initGuide();
  initPrimers();
  initPatterns();
  initVisualiser();
  initCompanies();
  initOAEssentials();
  initPages();
  initSheet();
  initMistakes();
  initProgress();
  initTracePlay();
  initDrill();
  const cd = $("#cd");
  if (cd) cd.textContent = "coverage beats depth";
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
