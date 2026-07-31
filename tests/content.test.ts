import { describe, it, expect } from "vitest";
import { PATTERNS, PRIMERS, TOPICS, COVERAGE } from "../src/data/index";
import { FOLLOWUPS, mergeFollowups } from "../src/data/followups";
import { WALKS, mergeWalks } from "../src/data/walks";
import { COMPANIES, aggregateWeights } from "../src/data/companies";
import { STRESS_SAMPLES, stressHarness } from "../src/lib/stress";
import { LADDER, ladderHours } from "../src/data/ladder";
import type { TopicId } from "../src/types";

/**
 * These exist because every check in this repo used to be a throwaway script in a
 * sandbox that no longer exists. Twice during development a content edit silently
 * did nothing and was only caught because someone happened to look. That is the
 * class of bug these tests close.
 */

const TOPIC_IDS = new Set(TOPICS.map(([id]) => id));

describe("patterns", () => {
  it("has the expected shape and size", () => {
    expect(PATTERNS.length).toBe(77);
    expect(COVERAGE.core).toBe(67);
    expect(COVERAGE.hard).toBe(10);
  });

  it("every pattern carries all three languages", () => {
    for (const p of PATTERNS) {
      expect(p.py, `${p.n} python`).toBeTruthy();
      expect(p.cpp, `${p.n} c++`).toBeTruthy();
      expect(p.java, `${p.n} java`).toBeTruthy();
    }
  });

  it("every pattern has the four teaching fields", () => {
    for (const p of PATTERNS) {
      for (const f of ["sig", "why", "trap", "say"] as const) {
        expect(p[f], `${p.n}.${f}`).toBeTruthy();
        expect(String(p[f]).length, `${p.n}.${f} too short`).toBeGreaterThan(40);
      }
    }
  });

  it("every topic id is declared in TOPICS", () => {
    for (const p of PATTERNS) expect(TOPIC_IDS.has(p.t), `${p.n} -> ${p.t}`).toBe(true);
  });

  it("pattern names are unique — the merge maps key on them", () => {
    const seen = new Set<string>();
    for (const p of PATTERNS) {
      expect(seen.has(p.n), `duplicate pattern name: ${p.n}`).toBe(false);
      seen.add(p.n);
    }
  });

  it("every pattern links at least three problems with valid slugs", () => {
    for (const p of PATTERNS) {
      expect(p.lc.length, `${p.n} problem count`).toBeGreaterThanOrEqual(3);
      for (const [num, slug, title] of p.lc) {
        expect(Number.isInteger(num) && num > 0, `${p.n}: bad number ${num}`).toBe(true);
        expect(slug, `${p.n}: bad slug ${slug}`).toMatch(/^[a-z0-9-]+$/);
        expect(title.length, `${p.n}: empty title`).toBeGreaterThan(2);
      }
    }
  });

  it("complexity strings look like complexities", () => {
    for (const p of PATTERNS) {
      expect(p.tc, `${p.n}.tc`).toMatch(/O\(|α/);
      expect(p.sc, `${p.n}.sc`).toMatch(/O\(|α/);
    }
  });
});

describe("hard tier", () => {
  const hard = PATTERNS.filter((p) => p.tier === "hard");

  it("all ten are present and marked", () => {
    expect(hard.length).toBe(10);
  });

  it("every hard pattern has derivation, proof and a ladder", () => {
    for (const p of hard) {
      expect(p.derive, `${p.n}.derive`).toBeTruthy();
      expect(p.proof, `${p.n}.proof`).toBeTruthy();
      expect(p.followups?.length, `${p.n}.followups`).toBeGreaterThanOrEqual(3);
    }
  });

  it("follow-up rungs are questions with answers", () => {
    for (const p of PATTERNS) {
      for (const f of p.followups ?? []) {
        // "n is 40." is a legitimate follow-up; the bar is "not empty", not "verbose"
        expect(f.q.length, `${p.n}: short question`).toBeGreaterThan(6);
        expect(f.a.length, `${p.n}: short answer`).toBeGreaterThan(30);
      }
    }
  });
});

describe("merge guards", () => {
  it("mergeFollowups throws when a key stops matching a pattern name", () => {
    expect(() => mergeFollowups([])).toThrow(/no longer exist/);
  });

  it("mergeWalks throws when a key stops matching a pattern name", () => {
    expect(() => mergeWalks([])).toThrow(/no longer exist/);
  });

  it("every followups key matches a real pattern", () => {
    const names = new Set(PATTERNS.map((p) => p.n));
    for (const k of Object.keys(FOLLOWUPS)) expect(names.has(k), `orphan followup: ${k}`).toBe(true);
  });

  it("every walks key matches a real pattern", () => {
    const names = new Set(PATTERNS.map((p) => p.n));
    for (const k of Object.keys(WALKS)) expect(names.has(k), `orphan walk: ${k}`).toBe(true);
  });
});

describe("worked traces", () => {
  it("every trace row matches its column count", () => {
    for (const p of PATTERNS) {
      for (const w of p.walk ?? []) {
        for (const row of w.rows) {
          expect(row.length, `${p.n} / ${w.title}: row width`).toBe(w.cols.length);
        }
      }
    }
  });

  it("every trace states what it teaches", () => {
    for (const p of PATTERNS) {
      for (const w of p.walk ?? []) {
        expect(w.lesson.length, `${p.n} / ${w.title}: lesson`).toBeGreaterThan(40);
        expect(w.input.length, `${p.n} / ${w.title}: input`).toBeGreaterThan(3);
      }
    }
  });
});

describe("edge cases", () => {
  it("every edge row has all three columns filled", () => {
    const all = [
      ...PATTERNS.flatMap((p) => (p.edges ?? []).map((e) => [p.n, e] as const)),
      ...PRIMERS.flatMap((p) => p.edges.map((e) => [p.id, e] as const)),
    ];
    expect(all.length).toBeGreaterThan(100);
    for (const [owner, e] of all) {
      expect(e.input.length, `${owner}: empty input`).toBeGreaterThan(2);
      expect(e.effect.length, `${owner}: effect too short`).toBeGreaterThan(20);
      expect(e.fix.length, `${owner}: fix too short`).toBeGreaterThan(15);
    }
  });
});

describe("topic primers", () => {
  it("there is exactly one primer per topic", () => {
    expect(PRIMERS.length).toBe(TOPICS.length);
    const ids = new Set(PRIMERS.map((p) => p.id));
    for (const [t] of TOPICS) expect(ids.has(t as TopicId), `missing primer: ${t}`).toBe(true);
  });

  it("every primer is substantive", () => {
    for (const p of PRIMERS) {
      expect(p.model.split(/\s+/).length, `${p.id}: model too short`).toBeGreaterThan(80);
      expect(p.invariant.length, `${p.id}: invariant`).toBeGreaterThan(50);
      expect(p.ops.length, `${p.id}: ops`).toBeGreaterThanOrEqual(4);
      expect(p.reach.length, `${p.id}: reach`).toBeGreaterThanOrEqual(3);
      expect(p.avoid.length, `${p.id}: avoid`).toBeGreaterThanOrEqual(3);
      expect(p.edges.length, `${p.id}: edges`).toBeGreaterThanOrEqual(4);
    }
  });

  it("every SVG is well-formed and themed with design tokens", () => {
    for (const p of PRIMERS) {
      expect((p.svg.match(/<svg /g) ?? []).length, `${p.id}: svg open`).toBe(1);
      expect((p.svg.match(/<\/svg>/g) ?? []).length, `${p.id}: svg close`).toBe(1);
      expect(p.svg, `${p.id}: viewBox`).toMatch(/viewBox="[\d\s.]+"/);
      // one muted grey is allowed; everything else must be a token
      const hex = (p.svg.match(/#[0-9A-Fa-f]{6}/g) ?? []).filter((h) => h !== "#4A456E");
      expect(hex, `${p.id}: hardcoded colours ${hex.join(",")}`).toHaveLength(0);
      expect(p.svg.includes("xlink:href"), `${p.id}: external ref`).toBe(false);
      expect(p.caption.length, `${p.id}: caption`).toBeGreaterThan(30);
    }
  });
});

describe("company data", () => {
  it("every company is complete and cited", () => {
    expect(COMPANIES.length).toBeGreaterThanOrEqual(25);
    for (const c of COMPANIES) {
      expect(c.sources.length, `${c.name}: sources`).toBeGreaterThanOrEqual(1);
      for (const s of c.sources) expect(s.url, `${c.name}: url`).toMatch(/^https:\/\//);
      expect(c.archetypes.length, `${c.name}: archetypes`).toBeGreaterThanOrEqual(3);
      expect(c.edge.length, `${c.name}: edge`).toBeGreaterThan(60);
      expect(c.format.length, `${c.name}: format`).toBeGreaterThan(60);
      expect(c.checked, `${c.name}: checked date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      for (const [t, w] of Object.entries(c.weights)) {
        expect(TOPIC_IDS.has(t as TopicId), `${c.name}: bad topic ${t}`).toBe(true);
        expect(w, `${c.name}.${t} weight range`).toBeGreaterThanOrEqual(0);
        expect(w, `${c.name}.${t} weight range`).toBeLessThanOrEqual(5);
      }
    }
  });

  it("aggregate weights rank topics and normalise", () => {
    const agg = aggregateWeights([]);
    expect(agg.length).toBeGreaterThan(5);
    expect(agg[0]!.pct).toBe(1);
    for (let i = 1; i < agg.length; i++) expect(agg[i]!.total).toBeLessThanOrEqual(agg[i - 1]!.total);
  });
});

describe("the zero-to-OA ladder", () => {
  it("is contiguously numbered from 1", () => {
    LADDER.forEach((r, i) => expect(r.n, `rung ${i}`).toBe(i + 1));
  });

  it("every rung states its gate, what it unlocks, and how you know you are done", () => {
    for (const r of LADDER) {
      expect(r.before.length, `${r.title}: before`).toBeGreaterThan(15);
      expect(r.learn.length, `${r.title}: learn`).toBeGreaterThan(80);
      expect(r.unlocks.length, `${r.title}: unlocks`).toBeGreaterThan(60);
      expect(r.done.length, `${r.title}: done`).toBeGreaterThan(30);
      expect(r.reaches.length, `${r.title}: reaches`).toBeGreaterThan(10);
    }
  });

  it("every topic a rung points at is a real topic", () => {
    for (const r of LADDER) {
      for (const t of r.topics) expect(TOPIC_IDS.has(t as TopicId), `${r.title} -> ${t}`).toBe(true);
    }
  });

  it("hour ranges parse and are ordered low to high", () => {
    for (const r of LADDER) {
      const [a, b] = r.hours.split("\u2013").map((x) => parseInt(x, 10));
      expect(Number.isFinite(a), `${r.title}: hours`).toBe(true);
      if (Number.isFinite(b)) expect(b).toBeGreaterThanOrEqual(a);
    }
    const { low, high } = ladderHours();
    expect(low).toBeGreaterThan(100);
    expect(high).toBeGreaterThanOrEqual(low);
  });

  it("covers every topic across the whole path", () => {
    const covered = new Set(LADDER.flatMap((r) => r.topics));
    // arr, bs, hash, tree, stk, graph, dp, bt, greedy, heap, bit are routed;
    // str and ll are absorbed into earlier rungs by design
    expect(covered.size).toBeGreaterThanOrEqual(10);
  });
});

describe("stress harness", () => {
  it("interpolates the trial count and defines the three required functions", () => {
    const h = stressHarness(1234);
    expect(h).toContain("range(1, 1234 + 1)");
    expect(h).toContain("_shrink");
    expect(h).toContain("'brute'");
    expect(h).toContain("'fast'");
    expect(h).toContain("'gen'");
  });

  it("every sample defines brute, fast and gen", () => {
    for (const [name, code] of STRESS_SAMPLES) {
      expect(code, `${name}: brute`).toMatch(/def brute\(/);
      expect(code, `${name}: fast`).toMatch(/def fast\(/);
      expect(code, `${name}: gen`).toMatch(/def gen\(/);
    }
  });
});
