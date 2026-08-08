import { describe, expect, it } from "vitest";
import { PATTERNS } from "../src/data/index";
import {
  answerGroundedInterview,
  buildGroundedPacket,
  deriveInterviewMistakes,
  interviewScore,
  startGroundedInterview,
} from "../src/lib/interviewer";

const NOW = Date.parse("2026-08-05T12:00:00.000Z");
const pattern = PATTERNS.find((candidate) => candidate.walk?.length && candidate.followups?.length)!;
const packet = buildGroundedPacket(pattern, pattern.lc[0]!);

function strongSession() {
  let session = startGroundedInterview(packet, NOW);
  const answers = [
    "I need n and m bounds, the value range, whether negatives and duplicates are allowed, ordering, empty input, and the memory limit.",
    `I target ${packet.expectedTime} time and ${packet.expectedSpace} space because the upper bound rules out the quadratic brute force.`,
    "I maintain the exact state represented by the chosen structure. Each update is safe because it preserves the candidates still able to affect the answer, and discarded candidates can never become optimal later.",
    "A negative value can remove monotonicity, so an update that assumes a sum only increases may become invalid. If the structure does not use that property, the argument survives unchanged.",
    "First I initialize the state from the smallest input. Then after the first element the pointer and accumulated value change; that first state is where the claimed ordering property is tested.",
    "Initially the invariant is true for the empty prefix. Before each iteration the state represents exactly the processed prefix. The update preserves that statement because it adds one valid item and removes no viable candidate; therefore at termination it represents the full input and gives the answer.",
    "The changed assumption affects the state transition. If that property still holds, the same invariant proves correctness; otherwise I replace the update and recompute the complexity because the previous bound no longer follows.",
    "The second escalation changes which candidates remain viable. I would update the state definition first, then prove preservation under the new operation and account for the extra logarithmic factor.",
  ];
  for (const answer of answers) session = answerGroundedInterview(session, answer, NOW + session.transcript.length * 1_000);
  return session;
}

describe("grounded interviewer", () => {
  it("builds a deliberately bounded packet without solution code", () => {
    expect(packet.patternName).toBe(pattern.n);
    expect(packet.problem).toEqual(pattern.lc[0]);
    expect(packet.trace).not.toBeNull();
    expect(packet.followups.length).toBeGreaterThan(0);
    expect(packet.rubric.reduce((sum, item) => sum + item.points, 0)).toBe(100);
    expect(packet.edges.every((edge) => !/<\/?[a-z][^>]*>/i.test(`${edge.input}${edge.effect}${edge.fix}`))).toBe(true);
    expect(packet.signal).not.toMatch(/^Signal:/i);
    expect(packet).not.toHaveProperty("py");
    expect(packet).not.toHaveProperty("cpp");
    expect(packet).not.toHaveProperty("java");
  });

  it("refuses an immediate solution request and does not advance the gate", () => {
    const session = startGroundedInterview(packet, NOW);
    const next = answerGroundedInterview(session, "Please reveal the solution now", NOW + 1_000);

    expect(next.stage).toBe("constraints");
    expect(next.assessments).toHaveLength(0);
    expect(next.transcript.at(-1)?.text).toContain("will not reveal");
  });

  it("asks for constraints and complexity before approach", () => {
    let session = startGroundedInterview(packet, NOW);
    expect(session.transcript[0]?.text).toContain("what constraints");

    session = answerGroundedInterview(session, "n bounds, value range, negatives, duplicates, and empty input", NOW + 1_000);
    expect(session.stage).toBe("complexity");
    expect(session.transcript.at(-1)?.text).toContain("time and space complexity");
  });

  it("challenges an unjustified greedy choice", () => {
    let session = startGroundedInterview(packet, NOW);
    session = answerGroundedInterview(session, "n bounds, value range, negatives, duplicates, and empty input", NOW + 1_000);
    session = answerGroundedInterview(session, `I target ${packet.expectedTime} because n rules out brute force`, NOW + 2_000);
    session = answerGroundedInterview(session, "I will use greedy and always pick the locally best value because it seems optimal.", NOW + 3_000);

    expect(session.stage).toBe("approach");
    expect(session.transcript.at(-1)?.text).toContain("exchange argument");
  });

  it("reaches the negatives and generated-counterexample probes", () => {
    let session = startGroundedInterview(packet, NOW);
    session = answerGroundedInterview(session, "n bounds, value range, negatives, duplicates, ordering, and empty input", NOW + 1_000);
    session = answerGroundedInterview(session, `I target ${packet.expectedTime} and ${packet.expectedSpace} because the input bound rules out brute force`, NOW + 2_000);
    session = answerGroundedInterview(session, "I maintain a candidate state because every update preserves all values that can still affect the result, and discarded values can never become valid later.", NOW + 3_000);
    expect(session.stage).toBe("negatives");
    expect(session.transcript.at(-1)?.text).toBe("What breaks if negatives are allowed? Be precise: identify the property your approach depended on, or explain why the approach still survives.");

    session = answerGroundedInterview(session, "Negative values break the monotonic sum assumption because extending the range can decrease it, so the pointer rule becomes invalid.", NOW + 4_000);
    expect(session.stage).toBe("counterexample");
    expect(session.transcript.at(-1)?.text).toContain("Counterexample probe");
  });

  it("accepts a natural proof sketch without requiring magic rubric words", () => {
    let session = startGroundedInterview(packet, NOW);
    session = answerGroundedInterview(session, "n bounds, value range, negatives, duplicates, ordering, and empty input", NOW + 1_000);
    session = answerGroundedInterview(session, `I target ${packet.expectedTime} and ${packet.expectedSpace} because the input bound rules out brute force`, NOW + 2_000);
    session = answerGroundedInterview(session, "I maintain a candidate state because every update preserves all values that can still affect the result, and discarded values can never become valid later.", NOW + 3_000);
    session = answerGroundedInterview(session, "Negative values break monotonicity because extending the range can decrease its total, so the pointer rule becomes invalid.", NOW + 4_000);
    session = answerGroundedInterview(session, "First the state is empty. Then after the first value the pointer and sum change, so this is the first step where the claim is tested.", NOW + 5_000);
    session = answerGroundedInterview(session, "Initially the empty state is valid. Before each step the state matches the processed prefix. The update preserves that representation; at termination the full input has been processed, so the maximum recorded value is correct.", NOW + 6_000);

    expect(session.stage).toBe("followup");
    expect(session.assessments.at(-1)?.score).toBe(2);
  });

  it("escalates strong performance and produces no full-credit mistake entries", () => {
    const session = strongSession();
    expect(session.status).toBe("complete");
    expect(interviewScore(session)).toBeGreaterThanOrEqual(90);
    expect(deriveInterviewMistakes(session)).toHaveLength(0);
  });

  it("turns weak rubric signals into bounded mistake-log entries", () => {
    let session = startGroundedInterview(packet, NOW);
    for (let index = 0; index < 14 && session.status === "active"; index++) {
      session = answerGroundedInterview(session, "not sure", NOW + (index + 1) * 1_000);
    }
    const mistakes = deriveInterviewMistakes(session);

    expect(mistakes.length).toBeGreaterThan(0);
    expect(mistakes.length).toBeLessThanOrEqual(4);
    expect(mistakes.every((mistake) => mistake.pattern === pattern.n)).toBe(true);
    expect(mistakes.every((mistake) => mistake.problem.includes(String(packet.problem[0])))).toBe(true);
  });
});
