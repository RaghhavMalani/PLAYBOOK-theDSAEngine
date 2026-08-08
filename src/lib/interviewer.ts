import type { Pattern, Problem, TopicId } from "../types";

export type InterviewStage =
  | "constraints"
  | "complexity"
  | "approach"
  | "negatives"
  | "counterexample"
  | "proof"
  | "followup"
  | "complete";

export interface InterviewRubricItem {
  key: Exclude<InterviewStage, "complete">;
  label: string;
  points: number;
}

export interface GroundedInterviewPacket {
  patternName: string;
  topic: TopicId;
  problem: Problem;
  expectedTime: string;
  expectedSpace: string;
  signal: string;
  trap: string;
  why: string;
  proof: string;
  trace: {
    title: string;
    input: string;
    cols: readonly string[];
    rows: readonly (readonly string[])[];
    lesson: string;
  } | null;
  edges: readonly { input: string; effect: string; fix: string }[];
  followups: readonly { q: string; a: string }[];
  rubric: readonly InterviewRubricItem[];
}

export interface InterviewTurn {
  id: string;
  role: "interviewer" | "candidate";
  stage: InterviewStage;
  text: string;
  at: number;
}

export interface InterviewAssessment {
  stage: Exclude<InterviewStage, "complete">;
  score: 0 | 1 | 2;
  note: string;
}

export interface GroundedInterviewSession {
  id: string;
  packet: GroundedInterviewPacket;
  status: "active" | "complete";
  stage: InterviewStage;
  stageAttempt: number;
  followupIndex: number;
  transcript: readonly InterviewTurn[];
  assessments: readonly InterviewAssessment[];
  startedAt: number;
  completedAt?: number;
}

export interface InterviewMistakeEntry {
  topic: TopicId;
  pattern: string;
  signal: string;
  problem: string;
}

export const INTERVIEW_RUBRIC: readonly InterviewRubricItem[] = [
  { key: "constraints", label: "Clarify constraints", points: 14 },
  { key: "complexity", label: "Set intended complexity", points: 14 },
  { key: "approach", label: "Justify the approach", points: 18 },
  { key: "negatives", label: "Test changed assumptions", points: 12 },
  { key: "counterexample", label: "Trace a counterexample", points: 12 },
  { key: "proof", label: "State an invariant / proof", points: 18 },
  { key: "followup", label: "Handle escalation", points: 12 },
] as const;

const SOLUTION_REQUEST = /(?:\b(?:reveal|show|give|tell)\b|\bwhat(?:'s| is)\b)[^.!?]{0,30}\b(?:solution|answer|code|approach)\b|\b(?:solution|answer)\b[^.!?]{0,20}\b(?:please|now)\b/i;
const COMPLEXITY = /(?:o|theta|Θ)\s*\([^)]{1,40}\)/i;
const CONSTRAINT_WORDS = /\b(?:constraint|size|length|range|bound|n\b|m\b|negative|positive|zero|duplicate|sorted|empty|null|overflow|memory|input|output)\b/gi;
const CAUSAL_WORDS = /\b(?:because|therefore|so|impli(?:es|ed|cation)|preserv(?:e|es|ed|ing|ation)|maintain(?:s|ed|ing)?|cannot|always|never|exchange|induction|invariant|monotonic(?:ity)?)\b/gi;

function cleanHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().replace(/^Signal:\s*/i, "").trim();
}

function turn(role: InterviewTurn["role"], stage: InterviewStage, text: string, at: number, index: number): InterviewTurn {
  return { id: `${at}-${index}-${role}`, role, stage, text, at };
}

function uniqueMatches(value: string, pattern: RegExp): number {
  return new Set((value.match(pattern) ?? []).map((item) => item.toLowerCase())).size;
}

function expectedComplexityMatches(value: string, expected: string): boolean {
  const normalise = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
  const a = normalise(value);
  const b = normalise(expected);
  return a.length > 1 && (a.includes(b) || b.includes(a));
}

function numberWithNegative(value: string): string {
  if (/\-\d/.test(value)) return value;
  return value.replace(/\b([1-9]\d*)\b/, "-$1");
}

function syntheticCounterexample(packet: GroundedInterviewPacket): string {
  const negativeEdge = packet.edges.find((edge) => /negative|<\s*0|minus/i.test(`${edge.input} ${edge.effect}`));
  if (negativeEdge) return `${negativeEdge.input} — ${negativeEdge.effect}`;
  if (packet.trace?.input) return numberWithNegative(packet.trace.input);
  if (packet.topic === "graph" || packet.topic === "dsu") return "Keep the smallest valid graph, then change one edge weight to -1.";
  if (packet.topic === "tree") return "Use a single-node tree whose value is -1, then a root with one negative child.";
  if (packet.topic === "str" || packet.topic === "trie") return "Use the empty string, then the shortest input containing one repeated symbol.";
  if (packet.topic === "ll") return "Use one node with value -1, then two nodes with equal values.";
  return "Use the smallest valid input and change exactly one numeric value to -1.";
}

function firstQuestion(packet: GroundedInterviewPacket): string {
  return `You are solving LC ${packet.problem[0]} — ${packet.problem[2]}. I will not reveal the solution. Before choosing an approach, what constraints and input assumptions do you need to clarify?`;
}

function average(assessments: readonly InterviewAssessment[]): number {
  return assessments.length ? assessments.reduce((sum, item) => sum + item.score, 0) / assessments.length : 0;
}

function latestScore(session: GroundedInterviewSession, stage: InterviewStage): number | null {
  return [...session.assessments].reverse().find((item) => item.stage === stage)?.score ?? null;
}

function nextStageQuestion(
  stage: InterviewStage,
  packet: GroundedInterviewPacket,
  assessments: readonly InterviewAssessment[],
  followupIndex: number,
): string {
  if (stage === "complexity") return "Good. Now commit before coding: what time and space complexity are you targeting, and which constraint rules out the obvious brute force?";
  if (stage === "approach") return "Walk me through your approach without writing code yet. Name the state you maintain and justify every irreversible choice. If it is greedy, give me the exchange argument.";
  if (stage === "negatives") return "What breaks if negatives are allowed? Be precise: identify the property your approach depended on, or explain why the approach still survives.";
  if (stage === "counterexample") return `Counterexample probe: ${syntheticCounterexample(packet)} Trace the first state transition where your claim is tested. Do not jump to the final answer.`;
  if (stage === "proof") return "State one invariant or give a proof sketch. Tell me what is true before an iteration, why the step preserves it, and why termination gives the answer.";
  if (stage === "followup") {
    const performance = average(assessments);
    const rung = packet.followups[followupIndex];
    if (rung && performance >= 1.35) return `Follow-up ${followupIndex + 1}: ${rung.q}`;
    if (packet.trace) return `Recovery follow-up: using ${packet.trace.input}, name the state after the first meaningful step and explain which invariant it demonstrates.`;
    if (rung) return `Take a smaller step: what assumption changes in this follow-up? ${rung.q}`;
    return "Final follow-up: change one input assumption. What part of your complexity or correctness argument must change first?";
  }
  return "Interview complete.";
}

export function buildGroundedPacket(pattern: Pattern, problem: Problem): GroundedInterviewPacket {
  const walk = pattern.walk?.[0] ?? null;
  return {
    patternName: pattern.n,
    topic: pattern.t,
    problem,
    expectedTime: pattern.tc,
    expectedSpace: pattern.sc,
    signal: cleanHtml(pattern.sig),
    trap: cleanHtml(pattern.trap),
    why: cleanHtml(pattern.why),
    proof: cleanHtml(pattern.proof ?? pattern.why),
    trace: walk ? {
      title: walk.title,
      input: walk.input,
      cols: walk.cols,
      rows: walk.rows,
      lesson: walk.lesson,
    } : null,
    edges: (pattern.edges ?? []).map((edge) => ({
      input: cleanHtml(edge.input),
      effect: cleanHtml(edge.effect),
      fix: cleanHtml(edge.fix),
    })),
    followups: pattern.followups ?? [],
    rubric: INTERVIEW_RUBRIC,
  };
}

export function startGroundedInterview(packet: GroundedInterviewPacket, now = Date.now()): GroundedInterviewSession {
  return {
    id: `grounded-${now}-${packet.problem[0]}`,
    packet,
    status: "active",
    stage: "constraints",
    stageAttempt: 0,
    followupIndex: 0,
    transcript: [turn("interviewer", "constraints", firstQuestion(packet), now, 0)],
    assessments: [],
    startedAt: now,
  };
}

function assessmentFor(session: GroundedInterviewSession, answer: string): InterviewAssessment {
  const stage = session.stage as Exclude<InterviewStage, "complete">;
  const words = answer.trim().split(/\s+/).filter(Boolean).length;
  if (stage === "constraints") {
    const found = uniqueMatches(answer, CONSTRAINT_WORDS);
    return { stage, score: found >= 4 ? 2 : found >= 2 ? 1 : 0, note: found >= 4 ? "Covered size and domain assumptions." : "Constraint surface was incomplete." };
  }
  if (stage === "complexity") {
    const stated = COMPLEXITY.test(answer);
    const matched = expectedComplexityMatches(answer, session.packet.expectedTime);
    const justified = /because|constraint|bound|n\b|brute|too slow/i.test(answer);
    return { stage, score: matched && justified ? 2 : stated ? 1 : 0, note: matched ? "Target matches the grounded rubric." : "Complexity was missing or did not match the intended budget." };
  }
  if (stage === "approach") {
    const causal = uniqueMatches(answer, CAUSAL_WORDS);
    const greedy = /\bgreedy|locally optimal|sort and (?:take|pick)|always choose\b/i.test(answer);
    const greedyProof = /exchange|stays? ahead|cut property|matroid|contradiction/i.test(answer);
    const score = greedy && !greedyProof ? 0 : words >= 28 && causal >= 2 ? 2 : words >= 12 ? 1 : 0;
    return { stage, score, note: greedy && !greedyProof ? "Greedy choice was asserted without a safety argument." : score === 2 ? "Approach included state and causal justification." : "Approach needs a maintained state and justification." };
  }
  if (stage === "negatives") {
    const assumption = /monoton|order|sum|window|weight|index|comparison|overflow|unchanged|still works|does not (?:break|change)|irrelevant|equality|counterexample|invalid/i.test(answer);
    return { stage, score: assumption && words >= 16 ? 2 : words >= 8 ? 1 : 0, note: assumption ? "Changed assumption was addressed." : "Did not identify what negative values change." };
  }
  if (stage === "counterexample") {
    const traceLanguage = /first|then|after|state|pointer|index|queue|stack|sum|value|step|iteration/i.test(answer);
    return { stage, score: traceLanguage && words >= 18 ? 2 : words >= 8 ? 1 : 0, note: traceLanguage ? "Counterexample was traced." : "Answer skipped the state transition." };
  }
  if (stage === "proof") {
    const causal = uniqueMatches(answer, CAUSAL_WORDS);
    const structure = /before|initial|base|preserv|maintain|after|terminat|therefore|invariant|induction|exchange/i.test(answer);
    return { stage, score: words >= 28 && causal >= 2 && structure ? 2 : words >= 12 && causal >= 1 ? 1 : 0, note: structure ? "Proof has an invariant/preservation shape." : "Proof needs initialization, preservation, and termination." };
  }
  const grounded = words >= 24 && /because|if|then|change|complex|invariant|state|case/i.test(answer);
  return { stage, score: grounded ? 2 : words >= 10 ? 1 : 0, note: grounded ? "Follow-up was reasoned through." : "Follow-up answer needs a causal argument." };
}

function stageAfter(session: GroundedInterviewSession, assessment: InterviewAssessment): { stage: InterviewStage; followupIndex: number; complete: boolean } {
  const retry = assessment.score === 0 && session.stageAttempt === 0;
  if (retry) return { stage: session.stage, followupIndex: session.followupIndex, complete: false };
  const order: readonly InterviewStage[] = ["constraints", "complexity", "approach", "negatives", "counterexample", "proof", "followup"];
  if (session.stage === "followup") {
    const strong = average([...session.assessments, assessment]) >= 1.45;
    const hasAnother = strong && session.followupIndex + 1 < Math.min(2, session.packet.followups.length);
    return hasAnother
      ? { stage: "followup", followupIndex: session.followupIndex + 1, complete: false }
      : { stage: "complete", followupIndex: session.followupIndex, complete: true };
  }
  const index = order.indexOf(session.stage);
  return { stage: order[index + 1] ?? "complete", followupIndex: session.followupIndex, complete: index + 1 >= order.length };
}

function retryQuestion(stage: InterviewStage, packet: GroundedInterviewPacket): string {
  if (stage === "constraints") return "Pause there. I need concrete constraints: input size, value domain, ordering, duplicates, and whether empty input is valid. Which of those decide your algorithm?";
  if (stage === "complexity") return `Commit to Big-O time and space. The selected pattern's intended time budget exists, but I will not reveal it before your attempt.`;
  if (stage === "approach") return "That is a conclusion, not a justification. What state do you maintain, and why is each update safe? If you chose greedy, produce an exchange argument or abandon the choice.";
  if (stage === "negatives") return "Answer the exact hypothetical: introduce one negative value. Which monotonic or ordering assumption changes?";
  if (stage === "counterexample") return `Trace it, do not summarize it: ${syntheticCounterexample(packet)} What is the state before and immediately after the first meaningful step?`;
  if (stage === "proof") return "Give me the three-part proof shape: true initially, preserved by one step, and sufficient at termination.";
  return "Push one level deeper: what changed, why does your earlier argument still hold, and what is the new complexity?";
}

export function answerGroundedInterview(session: GroundedInterviewSession, rawAnswer: string, now = Date.now()): GroundedInterviewSession {
  if (session.status === "complete") return session;
  const answer = rawAnswer.trim();
  if (!answer) return session;

  const candidate = turn("candidate", session.stage, answer, now, session.transcript.length);
  if (SOLUTION_REQUEST.test(answer)) {
    const refusal = turn(
      "interviewer",
      session.stage,
      "I will not reveal the solution during the attempt. State what you know, make one falsifiable claim, and I will challenge it.",
      now + 1,
      session.transcript.length + 1,
    );
    return { ...session, stageAttempt: session.stageAttempt + 1, transcript: [...session.transcript, candidate, refusal] };
  }

  const assessment = assessmentFor(session, answer);
  const assessments = [...session.assessments, assessment];
  const next = stageAfter(session, assessment);
  const interviewerText = next.complete
    ? "Interview complete. I have converted the weak rubric signals into proposed mistake-log entries; review them before saving."
    : next.stage === session.stage
      ? retryQuestion(session.stage, session.packet)
      : nextStageQuestion(next.stage, session.packet, assessments, next.followupIndex);
  const interviewer = turn("interviewer", next.stage, interviewerText, now + 1, session.transcript.length + 1);
  return {
    ...session,
    status: next.complete ? "complete" : "active",
    stage: next.stage,
    stageAttempt: next.stage === session.stage ? session.stageAttempt + 1 : 0,
    followupIndex: next.followupIndex,
    assessments,
    transcript: [...session.transcript, candidate, interviewer],
    completedAt: next.complete ? now : undefined,
  };
}

export function interviewScore(session: GroundedInterviewSession): number {
  const best = new Map<InterviewStage, InterviewAssessment>();
  for (const item of session.assessments) {
    const prior = best.get(item.stage);
    if (!prior || item.score > prior.score) best.set(item.stage, item);
  }
  return Math.round(session.packet.rubric.reduce((total, item) => {
    const score = best.get(item.key)?.score ?? 0;
    return total + item.points * (score / 2);
  }, 0));
}

export function deriveInterviewMistakes(session: GroundedInterviewSession): InterviewMistakeEntry[] {
  const label: Record<Exclude<InterviewStage, "complete">, string> = {
    constraints: "Started choosing an algorithm before clarifying the constraints and input domain.",
    complexity: `Did not commit to ${session.packet.expectedTime} before discussing implementation.`,
    approach: `Named an approach for ${session.packet.patternName} without justifying the maintained state or greedy choice.`,
    negatives: "Did not identify what breaks when negative values are introduced.",
    counterexample: "Could not trace the first state change on a generated counterexample.",
    proof: `Could not state an invariant or proof sketch for ${session.packet.patternName}.`,
    followup: `The follow-up ladder for ${session.packet.patternName} exposed an unstable assumption.`,
  };
  const weakest = session.packet.rubric
    .map((rubric) => ({ rubric, score: latestScore(session, rubric.key) ?? 0 }))
    .filter((item) => item.score < 2)
    .sort((a, b) => a.score - b.score || b.rubric.points - a.rubric.points)
    .slice(0, 4);
  return weakest.map(({ rubric }) => ({
    topic: session.packet.topic,
    pattern: session.packet.patternName,
    signal: label[rubric.key],
    problem: `Grounded interview · LC ${session.packet.problem[0]} ${session.packet.problem[2]}`,
  }));
}

export function transcriptMarkdown(session: GroundedInterviewSession): string {
  const problem = session.packet.problem;
  return `# Grounded interview — LC ${problem[0]} ${problem[2]}\n\n` +
    `Pattern packet: ${session.packet.patternName}\n\nScore: ${interviewScore(session)}/100\n\n` +
    session.transcript.map((item) => `**${item.role === "interviewer" ? "Interviewer" : "Candidate"} · ${item.stage}**\n\n${item.text}\n`).join("\n");
}
