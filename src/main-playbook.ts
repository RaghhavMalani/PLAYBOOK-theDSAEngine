import "./styles/tokens.css";
import "./styles/playbook.css";

import { initRouter } from "./features/router";
import { initPrimers } from "./features/primers";
import { initPatterns } from "./features/patterns";
import { initVisualiser } from "./features/visualiser";
import { initDrill } from "./features/drill";
import { initMistakes } from "./features/mistakes";
import { initCompanies } from "./features/companies";
import { initPages } from "./features/pages";
import { initSheet } from "./features/sheet";
import { $ } from "./lib/dom";

function boot(): void {
  initRouter();
  initPrimers();
  initPatterns();
  initVisualiser();
  initCompanies();
  initPages();
  initSheet();
  initMistakes();
  initDrill();
  const cd = $("#cd");
  if (cd) cd.textContent = "coverage beats depth";
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
