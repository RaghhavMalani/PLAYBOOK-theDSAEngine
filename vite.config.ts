import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  base: "./",
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
