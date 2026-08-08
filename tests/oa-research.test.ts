import { describe, expect, it } from "vitest";
import { TOPICS } from "../src/data/index";
import { countTopics, TOPIC_TERMS } from "../api/oa-research";

describe("OA topic classification", () => {
  it("has terms for every declared topic", () => {
    expect(Object.keys(TOPIC_TERMS).sort()).toEqual(TOPICS.map(([id]) => id).sort());
  });

  it("classifies the seven newer topic buckets independently", () => {
    const topicMentions = countTopics([{
      title: "Number theory, interval sweeps, LRU design and merge sort",
      snippet: "A matrix flood fill used a trie and union-find.",
      url: "https://example.com/report",
      host: "example.com",
    }]);
    for (const id of ["math", "intv", "design", "sort", "grid", "trie", "dsu"] as const) {
      expect(topicMentions[id], id).toBeGreaterThan(0);
    }
  });
});
