import "./styles/tokens.css";
import "./styles/memory.css";
// Shared with the playbook page: the ladder and deep-dive modules render on both.
import "./styles/ladder.css";
import { initMemoryEngine } from "./memory/engine";
import { initModuleNav } from "./memory/module-nav";
import { mountDeepLevels } from "./memory/deep-view";
import { mountLadder } from "./features/ladder-view";
import { ELEMENT_LEVELS } from "./data/element-types";
import { MEMORY_DEEP } from "./data/memory-deep";
import { initPwa } from "./lib/pwa";

function boot(): void {
  initPwa();
  initMemoryEngine();

  // Two mounts of one renderer. What differs between them is wording, so that is
  // all the config carries; everything structural is shared.
  mountDeepLevels("etLadder", ELEMENT_LEVELS, {
    id: "et",
    columns: ["how you declare it", "what one element costs", "what surprises people"],
    refSummary: "Declaration reference — the spelling, and what one element costs",
    measuredLabel: "Measured — all three, as run",
    placeholder: "search 12 levels — try “padding”, “boxing”, “vector<bool>”, “cache”…",
    unit: "levels",
  });

  mountDeepLevels("mdLadder", MEMORY_DEEP, {
    id: "md",
    columns: ["the rule, or the call", "what it costs or guarantees", "what surprises people"],
    refSummary: "Rules and guarantees — per container, per language",
    measuredLabel: "Measured — all three, as run",
    placeholder: "search 4 topics — try “rehash”, “stride”, “stack”, “invalidate”…",
    unit: "topics",
  });

  mountLadder("lladder");
  initModuleNav();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
