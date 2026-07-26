import "./styles/tokens.css";
import "./styles/memory.css";
import { initMemoryEngine } from "./memory/engine";

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initMemoryEngine);
else initMemoryEngine();
