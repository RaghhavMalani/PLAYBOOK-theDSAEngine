import { describe, it, expect } from "vitest";
import { PATTERNS } from "../src/data/index";
import { COMPANIES } from "../src/data/companies";
import { SOLVED, PROGRESS_COUNTS, PROGRESS_SYNC } from "../src/data/progress.generated";
import {
  FAMILY_TO_TOPICS,
  unmappedFamilies,
  patternCoverage,
  topicCoverage,
  gapsFor,
  gapsOverall,
  headline,
  notesUrl,
  solutionUrl,
  progressSyncAge,
} from "../src/data/progress";

const TOPIC_IDS = new Set(PATTERNS.map((p) => p.t));

describe("the generated progress snapshot", () => {
  it("is not empty", () => {
    expect(SOLVED.length).toBeGreaterThan(50);
  });

  it("has counts that agree with the entries themselves", () => {
    expect(PROGRESS_COUNTS.total).toBe(SOLVED.length);
    const easy = SOLVED.filter((e) => e.diff === "easy").length;
    const medium = SOLVED.filter((e) => e.diff === "medium").length;
    const hard = SOLVED.filter((e) => e.diff === "hard").length;
    expect(PROGRESS_COUNTS.easy).toBe(easy);
    expect(PROGRESS_COUNTS.medium).toBe(medium);
    expect(PROGRESS_COUNTS.hard).toBe(hard);
  });

  it("has no duplicate problem numbers", () => {
    const seen = new Set<number>();
    for (const e of SOLVED) {
      expect(seen.has(e.num)).toBe(false);
      seen.add(e.num);
    }
  });

  it("retains contract provenance and source-level solution facts", () => {
    expect(PROGRESS_SYNC.schemaVersion).toBe("1.0.0");
    expect(PROGRESS_SYNC.sourceCommit).toMatch(/^[a-f0-9]{40}$/);
    expect(Number.isNaN(Date.parse(PROGRESS_SYNC.generatedAt))).toBe(false);
    for (const entry of SOLVED) {
      expect(entry.langs.length).toBeGreaterThan(0);
      expect(Object.keys(entry.solutionHashes).length).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(entry.lastSolvedAt))).toBe(false);
      for (const hash of Object.values(entry.solutionHashes)) {
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
      }
    }
  });

  it("formats the generated-at timestamp as a live relative age", () => {
    const generated = Date.parse(PROGRESS_SYNC.generatedAt);
    expect(progressSyncAge(generated + 4 * 60_000)).toBe("4 minutes ago");
  });

  for (const e of SOLVED) {
    it(`${e.num} — ${e.dir}: has a plausible shape`, () => {
      expect(e.num).toBeGreaterThan(0);
      expect(e.dir).toMatch(/^\d{4}-[a-z0-9-]+$/);
      if (e.diff) expect(["easy", "medium", "hard"]).toContain(e.diff);
      expect(Array.isArray(e.langs)).toBe(true);
    });
  }
});

describe("the family to topic map", () => {
  it("covers every family present in the data", () => {
    expect(unmappedFamilies()).toEqual([]);
  });

  it("only maps to topic ids that actually exist", () => {
    for (const [family, topics] of Object.entries(FAMILY_TO_TOPICS)) {
      expect(topics.length).toBeGreaterThan(0);
      for (const t of topics) {
        if (!TOPIC_IDS.has(t)) throw new Error(`${family} maps to unknown topic "${t}"`);
      }
    }
  });
});

describe("coverage is computed from strong evidence only", () => {
  const cov = patternCoverage();

  it("returns one row per pattern", () => {
    expect(cov.length).toBe(PATTERNS.length);
  });

  it("never marks a pattern touched without a solved anchor", () => {
    for (const c of cov) {
      expect(c.touched).toBe(c.solvedAnchors.length > 0);
    }
  });

  it("splits every anchor into solved or open, losing none", () => {
    for (const c of cov) {
      const anchors = c.pattern.lc?.length ?? 0;
      expect(c.solvedAnchors.length + c.openAnchors.length).toBe(anchors);
    }
  });

  it("never counts an anchor as adjacent work as well", () => {
    for (const c of cov) {
      const anchorNums = new Set((c.pattern.lc ?? []).map((a) => a[0]));
      for (const a of c.adjacent) {
        if (anchorNums.has(a.num)) {
          throw new Error(`${c.pattern.n}: ${a.num} counted as both anchor and adjacent`);
        }
      }
    }
  });

  it("keeps the ratio inside 0..1", () => {
    for (const c of cov) {
      expect(c.ratio).toBeGreaterThanOrEqual(0);
      expect(c.ratio).toBeLessThanOrEqual(1);
    }
  });
});

describe("topic coverage", () => {
  const topics = topicCoverage();

  it("accounts for every pattern exactly once", () => {
    expect(topics.reduce((a, t) => a + t.patterns, 0)).toBe(PATTERNS.length);
  });

  it("never reports more touched than exist", () => {
    for (const t of topics) {
      expect(t.touched).toBeLessThanOrEqual(t.patterns);
    }
  });
});

describe("the headline never flatters", () => {
  const h = headline();

  it("agrees with the coverage rows", () => {
    const cov = patternCoverage();
    expect(h.patternsTouched).toBe(cov.filter((c) => c.touched).length);
    expect(h.patternsTotal).toBe(PATTERNS.length);
  });

  it("cannot claim more anchors solved than exist", () => {
    expect(h.anchorsSolved).toBeLessThanOrEqual(h.anchorsTotal);
  });

  it("counts off-playbook problems as part of the total, not on top of it", () => {
    expect(h.offPlaybook).toBeLessThanOrEqual(h.solved);
  });
});

describe("gap ranking gives usable advice", () => {
  it("only removes patterns once they are interview-ready", () => {
    const ready = new Set(
      patternCoverage()
        .filter((c) => c.stage === "interview-ready")
        .map((c) => c.pattern.n),
    );
    for (const co of COMPANIES) {
      for (const g of gapsFor(co)) {
        if (ready.has(g.pattern.n)) throw new Error(`${co.name}: suggested interview-ready pattern ${g.pattern.n}`);
      }
    }
  });

  it("returns results in descending score for every company", () => {
    for (const co of COMPANIES) {
      const gs = gapsFor(co);
      for (let i = 1; i < gs.length; i++) {
        if (gs[i].score > gs[i - 1].score) {
          throw new Error(`${co.name}: gap ${i} scores higher than the one before it`);
        }
      }
    }
  });

  it("does not rank a hard-tier pattern above a core one of equal demand", () => {
    for (const co of COMPANIES) {
      const gs = gapsFor(co, 50);
      for (let i = 1; i < gs.length; i++) {
        const prev = gs[i - 1];
        const cur = gs[i];
        if (prev.pattern.tier === "hard" && cur.pattern.tier !== "hard" && cur.weight >= prev.weight) {
          throw new Error(
            `${co.name}: hard "${prev.pattern.n}" (w=${prev.weight}) ranked above core "${cur.pattern.n}" (w=${cur.weight})`,
          );
        }
      }
    }
  });

  it("keeps the overall demand on the same 0-5 scale as a single company", () => {
    for (const g of gapsOverall(COMPANIES, 100)) {
      expect(g.weight).toBeGreaterThanOrEqual(0);
      expect(g.weight).toBeLessThanOrEqual(5);
    }
  });

  it("gives every suggestion a concrete next problem where one is listed", () => {
    for (const g of gapsOverall(COMPANIES, 20)) {
      const anchors = g.pattern.lc?.length ?? 0;
      if (anchors > 0 && g.next === null) {
        throw new Error(`${g.pattern.n} has ${anchors} anchors but no next problem`);
      }
    }
  });
});

describe("links back into the progress repo", () => {
  for (const e of SOLVED.slice(0, 40)) {
    it(`${e.num}: builds a well-formed github url`, () => {
      const url = e.notes ? notesUrl(e) : solutionUrl(e);
      expect(url).toMatch(/^https:\/\/github\.com\/[\w-]+\/[\w-]+\/(blob|tree)\/main\//);
      expect(url).toContain(e.dir);
    });
  }
});
