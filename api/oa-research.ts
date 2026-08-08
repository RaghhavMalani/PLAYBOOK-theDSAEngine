import type { ResearchHit, ResearchResponse, TopicId } from "../src/types";

export const config = { runtime: "edge" };

/**
 * OA research aggregator.
 *
 * WHAT THIS READS
 *   1. Reddit  — via the official OAuth API. r/csMajors, r/leetcode, r/cscareerquestions,
 *                r/developersIndia, r/Btechtards. This is where OA reports actually land.
 *   2. Hacker News — via the free Algolia search API. No key, no auth, no rate pain.
 *   3. The open web — via a search provider (Tavily / Brave / Serper). This is how
 *                GeeksforGeeks interview experiences, dev.to writeups, and college
 *                placement blogs get in, and it is also how content from sites we
 *                don't crawl directly still reaches you: as indexed snippets.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO, and why
 *   - LeetCode Discuss: their Terms of Service forbid automated access. Their GraphQL
 *     endpoint is trivial to hit, which is exactly why doing it would be a choice
 *     rather than an accident. It would also break on their next schema change and
 *     could get your account actioned. Your Premium subscription already gives you
 *     the company tagging legitimately.
 *   - Glassdoor / Blind: both forbid scraping and both run active bot mitigation.
 *     A Vercel edge function would be blocked within minutes anyway.
 *   Everything those sources contain that is publicly indexed still arrives via (3).
 *
 * KEYS (all optional, all free tiers)
 *   REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET   https://www.reddit.com/prefs/apps  ("script" app)
 *   TAVILY_API_KEY | BRAVE_API_KEY | SERPER_API_KEY
 * With no keys at all the endpoint returns 501 and the app falls back to the curated
 * dataset, which is a perfectly usable default.
 */

const SUBREDDITS = [
  "csMajors",
  "leetcode",
  "cscareerquestions",
  "developersIndia",
  "Btechtards",
  "interviewpreparation",
];

export const TOPIC_TERMS: Record<TopicId, string[]> = {
  hash: ["hash map", "hashmap", "hash table", "dictionary", "frequency", "anagram", "two sum", "counter"],
  str: ["string", "substring", "palindrome", "character", "parsing", "regex"],
  arr: ["array", "subarray", "two pointer", "sliding window", "kadane"],
  bs: ["binary search", "sorted array", "lower bound", "search space", "minimise the maximum", "minimize the maximum"],
  ll: ["linked list", "reverse list", "cycle detection", "fast and slow", "dummy node"],
  stk: ["stack", "queue", "monotonic", "parenthes", "deque", "next greater"],
  tree: ["binary tree", "bst", "traversal", "inorder", "level order", "lca"],
  heap: ["heap", "priority queue", "top k", "kth largest", "median", "merge k"],
  graph: ["graph", "bfs", "dfs", "shortest path", "dijkstra", "topological", "scc", "mst"],
  dp: ["dynamic programming", " dp ", "knapsack", "memoi", "subsequence", "edit distance", "lis"],
  bt: ["backtracking", "permutation", "subset", "combination", "n-queens", "sudoku"],
  greedy: ["greedy", "interval scheduling", "activity selection", "exchange argument"],
  bit: ["bit manipulation", "bitwise", "bitmask", "xor", "popcount", "set bit", "bit shift"],
  math: ["number theory", "prime", "sieve", "gcd", "lcm", "modulo", "modular", "combinatorics", "probability", "factorial"],
  intv: ["interval", "prefix sum", "difference array", "sweep line", "range query"],
  design: ["lru", "lfu", "cache design", "design data structure", "rate limiter", "object-oriented design"],
  sort: ["sorting", "merge sort", "quicksort", "quickselect", "divide and conquer", "comparator", "inversion count"],
  grid: ["matrix", "grid", "island", "flood fill", "maze", "spiral", "rotate image", "2d array"],
  trie: ["trie", "prefix tree", "autocomplete", "word search"],
  dsu: ["union find", "union-find", "disjoint set", "dsu", "connected components", "kruskal"],
};

export function countTopics(hits: ResearchHit[]): Partial<Record<TopicId, number>> {
  const blob = hits.map((h) => `${h.title} ${h.snippet}`).join(" ").toLowerCase();
  const out: Partial<Record<TopicId, number>> = {};
  for (const [topic, terms] of Object.entries(TOPIC_TERMS) as [TopicId, string[]][]) {
    let n = 0;
    for (const t of terms) {
      let i = blob.indexOf(t);
      while (i !== -1) { n++; i = blob.indexOf(t, i + t.length); }
    }
    if (n > 0) out[topic] = n;
  }
  return out;
}

const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const clip = (s: string, n = 400) => (s.length > n ? s.slice(0, n) + "…" : s);

/* ------------------------------ Reddit ------------------------------ */

let redditToken: { value: string; expires: number } | null = null;

async function redditAuth(id: string, secret: string): Promise<string> {
  if (redditToken && redditToken.expires > Date.now() + 30_000) return redditToken.value;
  const r = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${id}:${secret}`),
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "dsa-engine/1.0 (OA research, personal use)",
    },
    body: "grant_type=client_credentials",
  });
  if (!r.ok) throw new Error(`Reddit auth ${r.status}`);
  const j = (await r.json()) as { access_token: string; expires_in: number };
  redditToken = { value: j.access_token, expires: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

interface RedditChild {
  data: {
    title: string;
    selftext?: string;
    permalink: string;
    subreddit: string;
    score: number;
    num_comments: number;
    created_utc: number;
  };
}

async function reddit(id: string, secret: string, company: string): Promise<ResearchHit[]> {
  const token = await redditAuth(id, secret);
  const q = `${company} (OA OR "online assessment" OR "interview experience" OR codesignal OR hackerrank)`;
  const url =
    `https://oauth.reddit.com/r/${SUBREDDITS.join("+")}/search` +
    `?q=${encodeURIComponent(q)}&restrict_sr=1&sort=new&limit=40&t=year&raw_json=1`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, "user-agent": "dsa-engine/1.0 (OA research, personal use)" },
  });
  if (!r.ok) throw new Error(`Reddit search ${r.status}`);
  const j = (await r.json()) as { data?: { children?: RedditChild[] } };
  return (j.data?.children ?? []).map((c) => ({
    title: `${c.data.title}  [r/${c.data.subreddit} · ${c.data.score}↑ · ${c.data.num_comments} comments]`,
    url: `https://www.reddit.com${c.data.permalink}`,
    snippet: clip((c.data.selftext ?? "").replace(/\s+/g, " ").trim()),
    host: "reddit.com",
  }));
}

/* --------------------------- Hacker News ---------------------------- */

async function hackernews(company: string): Promise<ResearchHit[]> {
  const q = `${company} interview`;
  const r = await fetch(
    `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(q)}&tags=(story,comment)&hitsPerPage=20`,
  );
  if (!r.ok) throw new Error(`HN ${r.status}`);
  const j = (await r.json()) as {
    hits?: { objectID: string; title?: string; story_title?: string; comment_text?: string; story_text?: string; points?: number }[];
  };
  return (j.hits ?? [])
    .map((h) => ({
      title: (h.title ?? h.story_title ?? "HN comment") + (h.points ? `  [${h.points}↑]` : ""),
      url: `https://news.ycombinator.com/item?id=${h.objectID}`,
      snippet: clip((h.comment_text ?? h.story_text ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()),
      host: "news.ycombinator.com",
    }))
    .filter((h) => h.snippet.length > 40);
}

/* ------------------------- search providers ------------------------- */

async function tavily(key: string, query: string): Promise<ResearchHit[]> {
  const r = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ api_key: key, query, max_results: 15, search_depth: "advanced" }),
  });
  if (!r.ok) throw new Error(`Tavily ${r.status}`);
  const j = (await r.json()) as { results?: { title: string; url: string; content: string }[] };
  return (j.results ?? []).map((x) => ({ title: x.title, url: x.url, snippet: clip(x.content ?? ""), host: host(x.url) }));
}

async function brave(key: string, query: string): Promise<ResearchHit[]> {
  const r = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=15`, {
    headers: { Accept: "application/json", "X-Subscription-Token": key },
  });
  if (!r.ok) throw new Error(`Brave ${r.status}`);
  const j = (await r.json()) as { web?: { results?: { title: string; url: string; description: string }[] } };
  return (j.web?.results ?? []).map((x) => ({ title: x.title, url: x.url, snippet: clip(x.description ?? ""), host: host(x.url) }));
}

async function serper(key: string, query: string): Promise<ResearchHit[]> {
  const r = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": key, "content-type": "application/json" },
    body: JSON.stringify({ q: query, num: 15 }),
  });
  if (!r.ok) throw new Error(`Serper ${r.status}`);
  const j = (await r.json()) as { organic?: { title: string; link: string; snippet: string }[] };
  return (j.organic ?? []).map((x) => ({ title: x.title, url: x.link, snippet: clip(x.snippet ?? ""), host: host(x.link) }));
}

/* ------------------------------ handler ----------------------------- */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "public, max-age=1800, s-maxage=21600" },
  });

/** Sources that carry first-hand candidate reports, ranked above SEO aggregators. */
const FIRST_HAND = ["reddit.com", "news.ycombinator.com", "geeksforgeeks.org", "dev.to", "1point3acres", "medium.com"];

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const company = (url.searchParams.get("company") ?? "").trim().slice(0, 60);
  const role = (url.searchParams.get("role") ?? "software engineer new grad").trim().slice(0, 60);
  if (!company) return json({ error: "bad_request", message: "Pass ?company=Visa" }, 400);

  const year = new Date().getFullYear();
  const query =
    `${company} ${role} online assessment ${year} interview experience ` +
    `questions asked coding round topics OA format`;

  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {};

  const tasks: Promise<ResearchHit[]>[] = [];
  const used: string[] = [];
  const failed: string[] = [];

  if (env.REDDIT_CLIENT_ID && env.REDDIT_CLIENT_SECRET) {
    used.push("reddit");
    tasks.push(reddit(env.REDDIT_CLIENT_ID, env.REDDIT_CLIENT_SECRET, company).catch((e) => {
      failed.push(`reddit (${e instanceof Error ? e.message : "failed"})`);
      return [];
    }));
  }

  // HN needs no key, so it is always in.
  used.push("hackernews");
  tasks.push(hackernews(company).catch((e) => {
    failed.push(`hackernews (${e instanceof Error ? e.message : "failed"})`);
    return [];
  }));

  if (env.TAVILY_API_KEY) {
    used.push("tavily");
    tasks.push(tavily(env.TAVILY_API_KEY, query).catch((e) => { failed.push(`tavily (${e instanceof Error ? e.message : "failed"})`); return []; }));
  } else if (env.BRAVE_API_KEY) {
    used.push("brave");
    tasks.push(brave(env.BRAVE_API_KEY, query).catch((e) => { failed.push(`brave (${e instanceof Error ? e.message : "failed"})`); return []; }));
  } else if (env.SERPER_API_KEY) {
    used.push("serper");
    tasks.push(serper(env.SERPER_API_KEY, query).catch((e) => { failed.push(`serper (${e instanceof Error ? e.message : "failed"})`); return []; }));
  }

  const settled = await Promise.all(tasks);
  let hits = settled.flat();

  // de-dupe by url, then rank first-hand reports above aggregators
  const seen = new Set<string>();
  hits = hits.filter((h) => (seen.has(h.url) ? false : (seen.add(h.url), true)));
  hits.sort(
    (a, b) =>
      Number(FIRST_HAND.some((g) => b.host.includes(g))) - Number(FIRST_HAND.some((g) => a.host.includes(g))),
  );

  if (hits.length === 0) {
    return json(
      {
        error: "no_sources",
        message:
          "Nothing came back. Hacker News runs without a key, so an empty result usually means no " +
          "keys are configured and HN had no match. Add REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET " +
          "and/or TAVILY_API_KEY in Vercel → Settings → Environment Variables. The curated dataset " +
          "works without any of them.",
        attempted: used,
        failed,
      },
      501,
    );
  }

  const body: ResearchResponse = {
    company,
    query,
    provider: used.join(" + ") + (failed.length ? ` (failed: ${failed.join(", ")})` : ""),
    hits: hits.slice(0, 24),
    topicMentions: countTopics(hits),
    fetchedAt: new Date().toISOString(),
    note:
      "Topic counts are keyword mentions across post bodies and snippets — a rough signal of what " +
      "people report being asked, not a measured frequency. Reddit and HN entries are first-hand " +
      "reports and worth reading in full; ranked above them is nothing, ranked below is SEO content. " +
      "LeetCode Discuss and Glassdoor are not crawled (their terms forbid it) — anything public from " +
      "them arrives here as indexed search snippets instead.",
  };
  return json(body);
}
