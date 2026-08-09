import "./styles/tokens.css";
import "./styles/memory.css";
// Shared with the playbook page: the ladder and element-types modules render on both.
import "./styles/ladder.css";
import { initMemoryEngine } from "./memory/engine";
import { mountElementTypes } from "./memory/element-types-view";
import { mountLadder } from "./features/ladder-view";
import { initPwa } from "./lib/pwa";

function boot(): void {
  initPwa();
  initMemoryEngine();
  // Both are self-contained and fail quietly if their host section is absent,
  // so neither can take the page down if the markup changes.
  mountElementTypes("etLadder");
  mountLadder("lladder");
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
