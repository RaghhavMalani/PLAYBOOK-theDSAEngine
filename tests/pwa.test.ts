import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("offline app shell", () => {
  it("ships an install manifest with offline-first destinations", () => {
    const manifest = JSON.parse(readFileSync(resolve("public/manifest.webmanifest"), "utf8")) as {
      display: string;
      start_url: string;
      shortcuts: { url: string }[];
      icons: { purpose: string }[];
    };
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toContain("playbook.html");
    expect(manifest.shortcuts.map((item) => item.url)).toEqual(expect.arrayContaining([
      "./playbook.html#drill",
      "./playbook.html#patterns",
      "./playbook.html#lab",
    ]));
    expect(manifest.icons.some((icon) => icon.purpose.includes("maskable"))).toBe(true);
  });

  it("keeps API calls out of the offline cache", () => {
    const worker = readFileSync(resolve("src/pwa/service-worker.js"), "utf8");
    expect(worker).toContain("/api/");
    expect(worker).toContain("request.mode === \"navigate\"");
    expect(worker).toContain("staleWhileRevalidate");
  });
});
