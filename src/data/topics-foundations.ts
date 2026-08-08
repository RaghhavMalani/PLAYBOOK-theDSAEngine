import type { TopicPrimer } from "../types";

const box = (x: number, y: number, w: number, h: number, label: string, stroke = "var(--line2)") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="var(--panel)" stroke="${stroke}"/>` +
  `<text x="${x + w / 2}" y="${y + h / 2 + 4}" text-anchor="middle" fill="var(--txt)" font-family="monospace" font-size="10">${label}</text>`;
const line = (x1: number, y1: number, x2: number, y2: number, color = "var(--dim)") =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5"/>`;
const label = (x: number, y: number, value: string, color = "var(--dim)") =>
  `<text x="${x}" y="${y}" fill="${color}" font-family="monospace" font-size="10">${value}</text>`;

export const PRIMERS_FOUNDATIONS: readonly TopicPrimer[] = [
  {
    id: "rec",
    oneLine: "Recursion is a function contract applied to a strictly smaller state, with the runtime stack remembering unfinished work.",
    model:
      "Do not begin by tracing every call. Begin with a <b>contract</b>: what does this function promise to return for one state? Then write a base case whose answer is immediate, make every recursive branch move toward it, and use the promised child answer to build this frame's answer. The runtime stores each unfinished frame — parameters, locals, and the return address — on the call stack. That makes recursive code compact but not free: depth h costs O(h) memory, even when no collection is allocated.\n\nThere are two shapes worth seeing. A <b>chain</b> makes one smaller call per frame, such as reversing a list. A <b>tree</b> makes several calls, such as naive Fibonacci. If different branches reach the same argument, the apparent tree contains repeated states; caching those states turns it into dynamic programming. Trees, graph DFS, backtracking, divide-and-conquer and top-down DP are all variations on this same contract.",
    invariant: "<b>Every path must make measurable progress toward a covered base case.</b> State the decreasing measure — remaining length, interval width, tree height, or unfilled positions — and the maximum call depth follows from it.",
    ops: [
      ["one recursive call", "T(n)=T(n−1)+work", "usually a chain of depth n"],
      ["two half-size calls", "T(n)=2T(n/2)+work", "merge-sort-shaped recursion tree"],
      ["one half-size call", "T(n)=T(n/2)+work", "logarithmic depth, as in fast power"],
      ["memoised state", "once per state", "repeated calls become cache lookups"],
      ["stack space", "O(max depth)", "separate from heap or output space"],
    ],
    reach: [
      "Trees and divide-and-conquer structures whose input is recursively defined.",
      "Backtracking, where each frame owns one choice and its undo.",
      "Top-down dynamic programming after repeated argument tuples are identified.",
      "Proofs by structural induction: base case plus the smaller-instance hypothesis.",
    ],
    avoid: [
      "Linear chains near 10⁵ depth in Python or Java; an explicit stack is safer.",
      "A recursion whose state does not shrink on every branch; that is non-termination, not elegance.",
      "Passing or copying large containers into every frame when indices can describe the subproblem.",
    ],
    edges: [
      { input: "Empty input", effect: "The first dereference happens before the recursive structure exists.", fix: "Make emptiness an explicit base case before any field or index access." },
      { input: "One-element input", effect: "A base case covering only zero can perform an unnecessary or invalid smaller call.", fix: "Cover the smallest non-empty object when it has a direct answer." },
      { input: "Same-size recursive call", effect: "The measure never decreases, so frames accumulate until stack overflow.", fix: "Write the decreasing measure beside the call and verify strict progress." },
      { input: "Two identical recursive calls", effect: "A logarithmic recurrence can silently become linear or an exponential one even worse.", fix: "Save a repeated child result once, or memoise genuinely shared states." },
      { input: "Depth beyond runtime limit", effect: "Correct logic fails before reaching the base case because the process stack is finite.", fix: "Use an explicit stack or a bottom-up loop when depth is data-dependent and large." },
    ],
    svg: `<svg viewBox="0 0 460 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Recursive calls descend to a base case and then unwind">` +
      label(12, 18, "descent: shrink the state") +
      box(20, 32, 86, 28, "solve(4)", "var(--cyan)") + line(106, 46, 134, 46) +
      box(134, 32, 86, 28, "solve(3)") + line(220, 46, 248, 46) +
      box(248, 32, 86, 28, "solve(2)") + line(334, 46, 362, 46) +
      box(362, 32, 78, 28, "base", "var(--lime)") +
      label(12, 94, "unwind: combine the trusted smaller answer", "var(--amb)") +
      line(401, 108, 291, 108, "var(--amb)") + line(291, 108, 177, 108, "var(--amb)") + line(177, 108, 63, 108, "var(--amb)") +
      label(122, 136, "stack depth = number of unfinished frames") + `</svg>`,
    caption: "Calls descend while the state shrinks; useful results are assembled during unwind. The number of boxes alive at once is the auxiliary call-stack cost.",
  },
  {
    id: "queue",
    oneLine: "A queue preserves arrival order; a deque adds constant-time access at both ends without allowing arbitrary middle operations.",
    model:
      "A FIFO queue has two roles: producers append at the back and consumers remove from the front. That ordering makes it the natural structure for event streams and breadth-first search. In BFS, every state at distance d enters before any state at distance d+1, which is why the first arrival is shortest when edges have equal weight. When levels matter, snapshot the current queue length before processing; new children remain behind that fixed boundary.\n\nA <b>deque</b> supports both ends. It can act as an ordinary queue, a stack, or a candidate set whose expired items leave the front while dominated items leave the back. A circular array implements a bounded queue without shifting: head points to the front, tail to the next insertion slot, and both wrap modulo capacity. In Python, use collections.deque; a list's pop(0) is O(n).",
    invariant: "<b>Logical order is independent of physical layout.</b> Dequeue always removes the oldest live item, and every index stored in a monotonic deque must still belong to the current window while its values remain ordered.",
    ops: [
      ["enqueue back", "O(1)", "append one newest item"],
      ["dequeue front", "O(1)", "remove one oldest item"],
      ["deque push/pop either end", "O(1)", "no arbitrary middle access"],
      ["level snapshot", "O(1)", "freezes the current BFS frontier width"],
      ["circular buffer memory", "O(capacity)", "fixed allocation, no shifting"],
    ],
    reach: [
      "Breadth-first traversal and shortest paths with unit edge weights.",
      "Arrival-order event processing, recent-call windows, and producer/consumer buffers.",
      "Fixed-window maximum/minimum via a monotonic deque.",
      "Bounded queues and rolling buffers implemented with a circular array."],
    avoid: [
      "Weighted shortest paths; FIFO cannot order states by accumulated cost.",
      "Python list.pop(0), which shifts every remaining element.",
      "A queue when the most recently added unfinished item must be processed first; that is a stack."],
    edges: [
      { input: "Empty dequeue", effect: "Front access fails or returns an uninitialised slot.", fix: "Check size first and return an explicit empty result." },
      { input: "Full bounded queue", effect: "A new item overwrites the oldest live item without an intentional eviction policy.", fix: "Reject, block, or explicitly evict; never let capacity semantics be accidental." },
      { input: "head == tail in a ring", effect: "The same index relation can represent both empty and full.", fix: "Track size or reserve one unused slot, and keep that convention everywhere." },
      { input: "BFS visited marked on removal", effect: "The same node may be enqueued by several parents before its first turn.", fix: "Mark at discovery/enqueue time." },
      { input: "Changing queue size inside a level", effect: "Fresh children leak into the current depth and flatten the traversal.", fix: "Snapshot the width before the inner loop." },
    ],
    svg: `<svg viewBox="0 0 460 145" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="FIFO queue with removal at the head and insertion at the tail">` +
      label(16, 18, "oldest leaves here", "var(--mag)") + label(330, 18, "newest enters here", "var(--lime)") +
      box(24, 52, 72, 38, "A", "var(--mag)") + box(100, 52, 72, 38, "B") + box(176, 52, 72, 38, "C") + box(252, 52, 72, 38, "D", "var(--lime)") +
      line(16, 72, 2, 72, "var(--mag)") + line(340, 72, 326, 72, "var(--lime)") +
      label(88, 120, "front → FIFO order → back", "var(--cyan)") + `</svg>`,
    caption: "A leaves before B, C, and D regardless of their values. The structure promises ordering by arrival time, not priority or magnitude.",
  },
  {
    id: "ood",
    oneLine: "Low-level design assigns state and invariants to clear owners, then exposes small commands instead of public mutation.",
    model:
      "Machine-coding rounds test whether a changing program remains understandable after the happy path. Start by extracting use cases and invariants, not by drawing inheritance trees. Identify the object that owns each consistency rule, keep its fields private, and expose commands that validate before mutation. Prefer <b>composition</b> for policies that vary — pricing, routing, notification — because the stable workflow can depend on a narrow interface while implementations change independently.\n\nUse inheritance only for a genuine substitutable is-a relationship. If a lifecycle controls legal behaviour, model it as an explicit state machine rather than several booleans whose combinations include impossible states. Separate domain logic from input/output and persistence so the core can be tested in memory. Good LLD is not the number of classes; it is how small the blast radius is when one requirement changes.",
    invariant: "<b>Every business rule has one authoritative owner.</b> A command validates all preconditions before changing that owner's state, and rejected commands leave the aggregate exactly as it was.",
    ops: [
      ["command validation", "O(1) or lookup cost", "check before mutation"],
      ["policy dispatch", "O(1)", "interface call selected by composition"],
      ["state transition", "O(1)", "one legal lifecycle edge"],
      ["repository lookup", "implementation-dependent", "keep storage behind a boundary"],
      ["unit test", "isolated", "construct domain objects without UI or database"],
    ],
    reach: [
      "Machine-coding prompts that ask for a complete working service or simulation.",
      "Entities with lifecycles such as orders, bookings, elevators, and vending machines.",
      "Rules expected to gain new variants without changing the central workflow.",
      "Code-quality rounds where tests, naming, error paths, and extensibility are scored."],
    avoid: [
      "One class per noun with public fields and no owned rule; that is procedural code in disguise.",
      "Deep inheritance hierarchies chosen before any substitutable behaviour exists.",
      "Singleton global state, which hides dependencies and makes tests interfere.",
      "Adding databases, frameworks, or patterns that the required use cases do not need."],
    edges: [
      { input: "Duplicate command", effect: "Retrying a request can charge, allocate, or decrement inventory twice.", fix: "Define idempotency where retries are possible and key commands by request identity." },
      { input: "Failure midway through mutation", effect: "Related fields disagree about whether the operation completed.", fix: "Validate first and commit the invariant-preserving transition together." },
      { input: "New policy variant", effect: "A conditional ladder in the workflow must be edited and retested everywhere.", fix: "Inject a cohesive strategy behind a domain-level interface." },
      { input: "Concurrent callers", effect: "Two individually valid commands can race and violate shared capacity.", fix: "State the concurrency boundary and make the aggregate update atomic." },
      { input: "Invalid lifecycle command", effect: "An order may complete before payment or a machine may dispense while idle.", fix: "Encode explicit states and permit only listed transitions." },
    ],
    svg: `<svg viewBox="0 0 460 155" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A service delegates a variable rule to a strategy while an entity owns state">` +
      box(18, 34, 104, 34, "command") + line(122, 51, 154, 51, "var(--cyan)") +
      box(154, 28, 122, 46, "Order service", "var(--cyan)") + line(276, 42, 316, 42) + line(276, 62, 316, 104) +
      box(316, 24, 126, 34, "Order entity", "var(--lime)") + box(316, 88, 126, 34, "Pricing policy", "var(--amb)") +
      label(318, 146, "owns state       varies independently") + `</svg>`,
    caption: "The service coordinates one use case, the entity owns valid state, and a strategy owns the independently changing rule. Each reason to change has one home.",
  },
  {
    id: "comb",
    oneLine: "Combinatorics counts structured outcomes; probability weights those outcomes and expectation often avoids enumerating them.",
    model:
      "Begin with the sample space and ask whether order matters. Permutations distinguish order; combinations identify arrangements that differ only by internal order. Factorials, nPr and nCr are consequences of that choice, not formulas to guess. When conditions overlap, inclusion-exclusion assigns alternating signs to intersections so each valid object has net coefficient one. Counting a complement is often shorter than describing every allowed case directly.\n\nProbability is favourable mass divided by total mass only when elementary outcomes are equally likely. For a random process, define states and move probability mass through transitions; merged paths add. Expected value has an especially powerful escape hatch: linearity of expectation lets you sum indicator probabilities even when events depend on each other. In modular counting, division means multiplying by a modular inverse under the required modulus — ordinary integer division is not valid.",
    invariant: "<b>Count every elementary outcome exactly once with the correct weight.</b> Before applying a formula, state whether outcomes are ordered, whether choices repeat, and whether the elementary cases are equally likely.",
    ops: [
      ["nPr", "O(r) multiplicative", "ordered selection without replacement"],
      ["nCr", "O(r) exact", "unordered selection; use r=min(r,n−r)"],
      ["factorial precompute", "O(n) build, O(1) query", "with modular inverse for division"],
      ["inclusion-exclusion", "O(2^k)", "one term per non-empty subset of k conditions"],
      ["probability DP", "states × transitions", "move and merge probability mass"],
    ],
    reach: [
      "Counting paths, interleavings, selections, arrangements, and assignments.",
      "At-least-one conditions with overlapping sets or forbidden properties.",
      "Random walks and bounded stochastic processes with a compact state.",
      "Expected counts of events where indicator variables make dependencies irrelevant."],
    avoid: [
      "Using favourable/total when final states have different numbers of generating paths.",
      "Computing raw factorials in fixed-width integers before taking a quotient or modulus.",
      "Assuming independence merely because linearity of expectation did not require it.",
      "Inclusion-exclusion over many conditions when a smaller DP state captures the same constraint."],
    edges: [
      { input: "r outside 0..n", effect: "A combination formula indexes invalid factorials or returns a meaningless product.", fix: "Define nCr as zero outside its valid range." },
      { input: "Repeated objects", effect: "Distinct-object factorial formulas overcount arrangements that look identical.", fix: "Divide by each multiplicity factorial or model counts directly." },
      { input: "Non-prime modulus", effect: "Fermat-based modular inverses can be invalid or not exist.", fix: "Check the modulus assumptions and use extended gcd or another counting method." },
      { input: "Overlapping forbidden sets", effect: "Simple subtraction removes their intersection more than once.", fix: "Use inclusion-exclusion with every required intersection." },
      { input: "In-place probability layer", effect: "New mass moves again during the same step and changes the process.", fix: "Build a separate next-state distribution for each time step." },
    ],
    svg: `<svg viewBox="0 0 460 155" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A set overlap illustrates inclusion-exclusion">` +
      label(14, 18, "|A ∪ B| = |A| + |B| − |A ∩ B|", "var(--cyan)") +
      `<circle cx="180" cy="82" r="52" fill="var(--panel)" stroke="var(--amb)"/><circle cx="258" cy="82" r="52" fill="var(--panel)" fill-opacity="0.65" stroke="var(--lime)"/>` +
      label(146, 84, "A", "var(--amb)") + label(286, 84, "B", "var(--lime)") + label(207, 84, "subtract overlap", "var(--mag)") +
      label(74, 145, "adding both circles counts the lens twice; subtract it once") + `</svg>`,
    caption: "Adding A and B counts the shared lens twice. Subtracting the intersection once gives every object in the union a final coefficient of exactly one.",
  },
] as const;
