import "./styles/tokens.css";
import "./styles/memory.css";
import { initMemoryEngine } from "./memory/engine";
import { initPwa } from "./lib/pwa";

function boot(): void {
  initPwa();
  initMemoryEngine();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
