import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // the content tests are pure data assertions — no DOM needed, so this stays fast
    environment: "node",
    reporters: "verbose",
  },
});
