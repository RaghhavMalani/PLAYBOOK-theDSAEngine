import { defineConfig, type Plugin } from "vite";
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";
import { COVERAGE } from "./src/data/index";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

function serviceWorkerPlugin(): Plugin {
  return {
    name: "offline-service-worker",
    apply: "build",
    generateBundle(_options, bundle) {
      const paths = [
        ...Object.keys(bundle).map((file) => `./${file}`),
        "./manifest.webmanifest",
        "./icons/dsa-engine.svg",
      ];
      const fingerprint = paths.join("|").split("").reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 0).toString(36);
      const template = readFileSync(here("./src/pwa/service-worker.js"), "utf8");
      this.emitFile({
        type: "asset",
        fileName: "service-worker.js",
        source: template
          .replace("__CACHE_VERSION__", JSON.stringify(`dsa-engine-${fingerprint}`))
          .replace("__PRECACHE_MANIFEST__", JSON.stringify([...new Set(paths)])),
      });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [{
    name: "catalog-counts",
    transformIndexHtml: (html) => html
      .replace(/(<span data-pattern-count>)\d+(<\/span>)/g, `$1${COVERAGE.total}$2`)
      .replace(/(<meta name="description" data-pattern-count content=")\d+/, `$1${COVERAGE.total}`),
  }, serviceWorkerPlugin()],
  build: {
    target: "es2020",
    outDir: "dist",
    rollupOptions: {
      input: {
        index: here("./index.html"),
        playbook: here("./playbook.html"),
        memory: here("./memory.html"),
      },
    },
  },
  server: { port: 5173, open: "/index.html" },
});
