import type { CompanyOA } from "../types";

/**
 * Indian campus and off-campus hiring, researched July 2026.
 *
 * This half of the dataset matters more than the FAANG half for most Indian students,
 * because these are the companies that actually visit campus — and their assessments
 * look nothing like a Meta CodeSignal. A TCS NQT is 190 minutes of aptitude with two
 * coding problems bolted on; preparing for it with LeetCode mediums is the wrong
 * preparation entirely.
 *
 * Same honesty caveats as the global set: `weights` are directional (0-5), synthesised
 * from public reports and official pattern pages. Formats change per season and per
 * role band. Every entry cites its sources and carries a checked date.
 */
export const COMPANIES_INDIA: readonly CompanyOA[] = [
  /* ============================ SERVICE / MASS ============================ */
  {
    id: "tcs",
    name: "TCS (NQT)",
    tier: "service",
    platform: "TCS iON, proctored",
    format:
      "190 minutes, ~82 questions, split into Foundation and Advanced. Foundation: Numerical Ability (20Q/25min), Verbal (25Q/25min), Reasoning (20Q/25min). Advanced: Advanced Aptitude (15Q/25min) and Advanced Coding (2 problems / 90 min). One integrated score decides your Ninja, Digital or Prime band.",
    durationMin: 190,
    questions: "~80 MCQs + 2 coding problems",
    weights: { arr: 4, str: 3, hash: 2, bit: 2, greedy: 1, bs: 1 },
    archetypes: [
      "Pattern printing, number series, string reversal — closer to school programming than LeetCode",
      "Array traversal and simple aggregation",
      "Basic string manipulation, palindromes, frequency counts",
      "Programming-logic MCQs on C/C++/Java output, OOP and DSA definitions",
      "Quantitative aptitude: percentages, ratios, time-and-work, permutations",
    ],
    edge:
      "The coding is the SMALL half. Roughly 60 of the 82 questions are aptitude, verbal and reasoning, and the band you land in — Ninja, Digital or Prime — is decided by the integrated score. Grinding DSA and skipping aptitude is the classic way to qualify for Ninja when you wanted Prime.",
    extras: ["Numerical, verbal and reasoning aptitude", "Programming-logic MCQs", "No negative marking in 2026"],
    sources: [
      { label: "PrepInsta — TCS NQT syllabus 2026", url: "https://prepinsta.com/tcs-nqt/syllabus/" },
      { label: "PapersAdda — NQT pattern, 83Q / 190min", url: "https://papersadda.com/article/tcs-nqt-exam-pattern-2026/" },
      { label: "GeeksforGeeks — NQT preparation sheet", url: "https://www.geeksforgeeks.org/dsa/tcs-nqt-preparation-sheet-2026-aptitude-verbal-coding-questions/" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "infosys",
    name: "Infosys",
    tier: "service",
    platform: "HackerRank / Infosys assessment platform",
    format:
      "NQT-style: reasoning, mathematical ability and verbal, then a pseudocode section and 2–3 coding problems. The Specialist Programmer (SP) and Digital Specialist Engineer (DSE) roles use a harder coding paper than the Systems Engineer track.",
    durationMin: 150,
    questions: "MCQ sections + 2–3 coding problems",
    weights: { arr: 4, str: 3, hash: 2, bs: 2, greedy: 2, dp: 1 },
    archetypes: [
      "Pseudocode output prediction — a section unique to Infosys",
      "Array and string manipulation at easy-to-medium level",
      "Puzzle-style logical reasoning",
      "For SP/DSE: genuine LeetCode-medium DSA",
    ],
    edge:
      "The pseudocode section catches people out — it is reading comprehension for code, not writing it. Practise tracing unfamiliar pseudocode by hand. Which role band you are shortlisted for depends heavily on the coding half.",
    extras: ["Pseudocode section", "Logical reasoning", "Puzzle solving"],
    sources: [
      { label: "PrepInsta — Infosys pattern", url: "https://prepinsta.com/infosys/" },
      { label: "PlacementPreparation — Infosys syllabus", url: "https://www.placementpreparation.io/infosys/syllabus-and-test-pattern/" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "wipro",
    name: "Wipro (NLTH)",
    tier: "service",
    platform: "Wipro assessment platform",
    format:
      "National Level Talent Hunt: aptitude (quant, logical, verbal), then two coding problems, plus a written-communication essay section that is scored separately.",
    durationMin: 138,
    questions: "~50 MCQs + 2 coding + 1 essay",
    weights: { arr: 4, str: 3, hash: 2, greedy: 1, bs: 1 },
    archetypes: [
      "Easy-to-medium array and string problems",
      "Quantitative aptitude and logical reasoning",
      "Essay writing — genuinely scored, not a formality",
    ],
    edge:
      "The written-communication essay is a real gate and the one most candidates ignore entirely. Practise writing 200 clean words on a generic prompt.",
    extras: ["Essay / written communication", "Aptitude"],
    sources: [
      { label: "PrepInsta — Wipro NLTH pattern", url: "https://prepinsta.com/wipro/" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "cognizant",
    name: "Cognizant (GenC)",
    tier: "service",
    platform: "Cognizant assessment platform",
    format:
      "GenC: aptitude and communication, then coding. GenC Next and GenC Pro are separate, harder tracks with more DSA and a technical interview that goes deeper.",
    durationMin: 120,
    questions: "MCQ sections + 2 coding problems",
    weights: { arr: 4, str: 3, hash: 2, bs: 1, greedy: 1 },
    archetypes: [
      "Basic array, string and number-theory problems",
      "Aptitude and English communication",
      "For GenC Next/Pro: medium DSA and OOP design",
    ],
    edge:
      "Which track you sit decides everything. GenC is an aptitude test with coding attached; GenC Pro is a real engineering interview. Confirm the track before you decide how to prepare.",
    extras: ["Communication assessment", "Aptitude"],
    sources: [
      { label: "PrepInsta — Cognizant pattern", url: "https://prepinsta.com/cognizant/" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "accenture",
    name: "Accenture",
    tier: "service",
    platform: "Accenture assessment platform",
    format:
      "Cognitive and technical assessment, then coding (2 problems), then a communication assessment. The coding bar is low; the volume of non-coding sections is high.",
    durationMin: 135,
    questions: "MCQ sections + 2 coding problems",
    weights: { arr: 3, str: 3, hash: 2, greedy: 1 },
    archetypes: [
      "Easy array and string problems",
      "Pseudocode and fundamentals MCQs",
      "Communication assessment with spoken and written components",
    ],
    edge:
      "The communication assessment is a separate qualifying gate. Strong DSA does not compensate for failing it.",
    extras: ["Cognitive assessment", "Communication assessment (spoken + written)"],
    sources: [
      { label: "PrepInsta — Accenture pattern", url: "https://prepinsta.com/accenture/" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "capgemini",
    name: "Capgemini",
    tier: "service",
    platform: "Capgemini assessment platform",
    format:
      "Game-based aptitude, pseudocode MCQs, English communication, then behavioural. Coding appears in the Analyst track rather than the base one.",
    durationMin: 120,
    questions: "Game-based + pseudocode MCQs + English",
    weights: { arr: 3, str: 2, hash: 1 },
    archetypes: [
      "Game-based cognitive tasks — unusual and worth practising once so the format is not a surprise",
      "Pseudocode output prediction",
      "English grammar and comprehension",
    ],
    edge:
      "The game-based section is unlike anything else in campus hiring. Do one practice run purely so the interface does not cost you time.",
    extras: ["Game-based aptitude", "Behavioural assessment", "English"],
    sources: [
      { label: "PrepInsta — Capgemini pattern", url: "https://prepinsta.com/capgemini/" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "zoho",
    name: "Zoho",
    tier: "service",
    platform: "On-site / proctored online",
    format:
      "Five to seven rounds. Written: 25 aptitude questions in 90 minutes, then 10 technical questions in 60 minutes. Then a programming round, then an <b>advanced coding round where you build one complete working system from scratch in about 3 hours</b> in C, C++ or Java. Then technical and HR interviews.",
    durationMin: 180,
    questions: "25 aptitude + 10 technical + programming + a 3-hour build",
    weights: { arr: 4, str: 5, hash: 3, ll: 3, bit: 3, greedy: 2 },
    archetypes: [
      "String processing without library help — Zoho famously restricts built-ins",
      "Pattern printing and matrix manipulation",
      "Build a complete program: a text editor, a calculator, a small database — working code, not an algorithm",
      "C fundamentals: pointers, memory, manual string handling",
    ],
    edge:
      "Zoho is the outlier in Indian hiring: the final round is <b>engineering, not algorithms</b>. You build something that runs, handles input, and does not crash. LeetCode preparation transfers poorly — practise writing a 300-line program that works, in one sitting, without a library.",
    extras: ["Aptitude", "A 3-hour build-from-scratch round", "No negative marking"],
    sources: [
      { label: "PlacementPreparation — Zoho process", url: "https://www.placementpreparation.io/zoho/recruitment-process/" },
      { label: "PrepInsta — Zoho exam pattern", url: "https://prepinsta.com/zoho/exam-pattern/" },
      { label: "FACE Prep — Zoho recruitment process", url: "https://faceprep.in/article/zoho-recruitment-process-2018-and-zoho-exam-pattern-with-application-link/" },
    ],
    checked: "2026-07-26",
  },

  /* ========================= INDIAN PRODUCT / UNICORN ========================= */
  {
    id: "flipkart",
    name: "Flipkart",
    tier: "product",
    platform: "HackerRank / HackerEarth",
    format:
      "2–3 algorithmic problems at medium-to-hard with partial scoring, sometimes plus a debugging or aptitude section. Then a <b>machine-coding round</b> — you build a small working program, not an algorithm — then 1–2 DSA interviews, sometimes a design round, then HR.",
    durationMin: 90,
    questions: "2–3 problems, medium to hard",
    weights: { arr: 5, str: 4, dp: 5, graph: 4, tree: 4, heap: 3, greedy: 3, hash: 4 },
    archetypes: [
      "Dynamic programming at genuine medium-hard difficulty",
      "Graph traversal and shortest paths",
      "Trees, heaps and occasionally tries",
      "Greedy with a non-obvious sort key",
      "Machine coding: design and implement a small system in 90 minutes",
    ],
    edge:
      "The machine-coding round is what makes Flipkart distinctive and it is where most candidates are unprepared. It scores clean class design, working code and handled edge cases — not algorithmic cleverness. Practise building something like a parking lot or a splitwise clone in 90 minutes.",
    extras: ["Machine coding round", "Occasional debugging section", "LLD/HLD for some roles"],
    sources: [
      { label: "PapersAdda — Flipkart hiring process 2026", url: "https://papersadda.com/article/flipkart-hiring-process-2026/" },
      { label: "FinalRound — Flipkart SDE and machine coding", url: "https://www.finalroundai.com/blog/flipkart-interview-process" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "swiggy",
    name: "Swiggy",
    tier: "product",
    platform: "HackerRank / HackerEarth",
    format:
      "Online assessment with 2–3 DSA problems, then 2–4 DSA interview rounds, plus system design for senior roles. Reports consistently describe medium-to-hard problems expected within 30–40 minutes each.",
    durationMin: 90,
    questions: "2–3 problems",
    weights: { arr: 5, hash: 4, dp: 4, graph: 4, tree: 3, heap: 3, str: 3 },
    archetypes: [
      "Array and hash-map problems with a real-world framing (orders, delivery slots)",
      "Graph problems on delivery/routing scenarios",
      "Dynamic programming, medium difficulty",
      "Heap and interval scheduling",
    ],
    edge:
      "Speed is the constraint: medium-hard in 30–40 minutes means you cannot afford to derive from scratch. This is exactly the recognition speed the drill trains.",
    extras: ["System design for SDE-2 and above"],
    sources: [
      { label: "JobRise — DSA prep for Indian product companies 2026", url: "https://jobrise.io/en/blog/dsa-interview-preparation-india-2026/" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "zomato",
    name: "Zomato",
    tier: "product",
    platform: "HackerRank / HackerEarth",
    format:
      "Online assessment with DSA problems, then 2–3 technical rounds. Product-thinking questions appear alongside algorithms for some roles.",
    durationMin: 90,
    questions: "2–3 problems",
    weights: { arr: 5, hash: 4, str: 4, dp: 4, graph: 3, tree: 3, greedy: 3 },
    archetypes: [
      "Array and string processing",
      "Hash-map aggregation over event or order data",
      "Medium DP and greedy",
      "Occasional low-level design discussion",
    ],
    edge:
      "Less predictable than Flipkart or Swiggy — the bar varies by team. Prepare breadth rather than betting on one topic.",
    extras: ["Product-sense questions for some roles"],
    sources: [
      { label: "TheJobOverflow — Zomato interview experiences", url: "https://thejoboverflow.com/?tag=zomato" },
      { label: "JobRise — Indian product company prep", url: "https://jobrise.io/en/blog/dsa-interview-preparation-india-2026/" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "razorpay",
    name: "Razorpay",
    tier: "fintech",
    platform: "HackerRank / HackerEarth",
    format:
      "Online assessment with medium-hard DSA in 30–40 minutes per problem, then multiple technical rounds including machine coding or LLD for many roles.",
    durationMin: 90,
    questions: "2–3 problems, medium to hard",
    weights: { arr: 5, hash: 5, dp: 4, str: 4, tree: 3, graph: 3, greedy: 3 },
    archetypes: [
      "Transaction and ledger processing — hash maps and aggregation",
      "Medium-hard DP",
      "Low-level design: build a rate limiter, a payment splitter",
      "Concurrency questions for backend roles",
    ],
    edge:
      "Fintech framing means correctness pressure: idempotency, exact-once processing and integer money handling come up as follow-ups. Never represent money as a float and say why.",
    extras: ["Machine coding / LLD", "System design"],
    sources: [
      { label: "JobRise — Indian product company prep 2026", url: "https://jobrise.io/en/blog/dsa-interview-preparation-india-2026/" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "cred",
    name: "CRED",
    tier: "fintech",
    platform: "HackerRank / HackerEarth",
    format:
      "Online assessment with medium-hard DSA, then technical rounds with a strong emphasis on code quality and design. A small hiring bar with a high standard.",
    durationMin: 90,
    questions: "2–3 problems, medium to hard",
    weights: { arr: 5, hash: 4, dp: 4, tree: 4, graph: 3, str: 3, heap: 3 },
    archetypes: [
      "Medium-hard algorithmic problems with little hand-holding",
      "Low-level design with an emphasis on clean abstractions",
      "Concurrency and system behaviour under load",
    ],
    edge:
      "CRED interviews weight <b>how you write code</b> unusually heavily — naming, decomposition, handling of failure. A correct but sprawling solution scores below a clean one.",
    extras: ["LLD", "Code-quality emphasis"],
    sources: [
      { label: "JobRise — Indian product company prep 2026", url: "https://jobrise.io/en/blog/dsa-interview-preparation-india-2026/" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "phonepe",
    name: "PhonePe",
    tier: "fintech",
    platform: "HackerRank / HackerEarth",
    format:
      "Online assessment with 2–3 DSA problems, then multiple technical rounds including design. Fresher hiring runs through both campus and off-campus drives.",
    durationMin: 90,
    questions: "2–3 problems",
    weights: { arr: 5, hash: 4, dp: 4, graph: 4, tree: 3, heap: 3, str: 3 },
    archetypes: [
      "Array and hash-map problems on transaction-shaped data",
      "Graph problems — payment routing, dependency resolution",
      "Medium DP",
      "System design for anything above entry level",
    ],
    edge:
      "Scale framing is common: expect follow-ups about what changes when the input is a stream rather than an array, or when it does not fit in memory.",
    extras: ["System design", "Occasional LLD"],
    sources: [
      { label: "JobRise — Indian product company prep 2026", url: "https://jobrise.io/en/blog/dsa-interview-preparation-india-2026/" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "freshworks",
    name: "Freshworks",
    tier: "product",
    platform: "Online assessment platform",
    format:
      "Around five rounds. First an online aptitude test — MCQs on English grammar plus an essay-type written section. Then three short technical rounds of 15–20 minutes each on programming fundamentals, then HR.",
    durationMin: 90,
    questions: "Aptitude MCQs + essay, then 3 technical rounds",
    weights: { arr: 4, str: 4, hash: 3, ll: 2, tree: 2 },
    archetypes: [
      "Programming fundamentals rather than hard algorithms",
      "English grammar and written communication",
      "Short, rapid-fire technical questions",
    ],
    edge:
      "The technical rounds are short — 15 to 20 minutes — so answers must be immediate. Depth matters less than not stalling.",
    extras: ["English MCQs and essay", "Multiple short technical rounds"],
    sources: [
      { label: "Unstop — Freshworks recruitment process", url: "https://unstop.com/blog/freshworks-recruitment-process" },
      { label: "Freshers.jobs — Freshworks process", url: "https://freshers.jobs/freshworks-recruitment-process/" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "sprinklr",
    name: "Sprinklr",
    tier: "product",
    platform: "Online coding platform",
    format:
      "Online assessment with 2–3 DSA problems at medium-to-hard. Then a technical round on DSA and CS fundamentals, then a second on projects, data structures and behavioural questions.",
    durationMin: 90,
    questions: "2–3 problems, medium to hard",
    weights: { arr: 5, dp: 4, graph: 4, hash: 4, tree: 3, str: 3, heap: 2 },
    archetypes: [
      "Medium-hard DSA, closer to a product-company bar than a service one",
      "CS fundamentals: OS, DBMS, networks",
      "Deep discussion of your own projects",
    ],
    edge:
      "The second technical round goes hard on your resume projects. Be able to justify every technology choice you list.",
    extras: ["CS fundamentals (OS/DBMS/CN)", "Project deep-dive"],
    sources: [
      { label: "GeeksforGeeks — Sprinklr recruitment process", url: "https://www.geeksforgeeks.org/interview-experiences/sprinklr-recruitment-process/" },
    ],
    checked: "2026-07-26",
  },

  /* ============================= GLOBAL, HIRING IN INDIA ============================= */
  {
    id: "amazon",
    name: "Amazon",
    tier: "product",
    platform: "Amazon assessment platform, webcam-proctored",
    format:
      "90–120 minutes, proctored. A DSA coding test, a <b>debugging section</b>, and a work-style survey; 2026 added more interactive game-like sections. Then Technical 1 (DSA), Technical 2 (OOD and system design basics), and a Bar Raiser round on the 16 Leadership Principles.",
    durationMin: 105,
    questions: "2 coding problems + debugging + work-style survey",
    weights: { arr: 5, str: 5, hash: 5, tree: 4, graph: 4, dp: 3, heap: 3, ll: 3 },
    archetypes: [
      "Two coding problems, usually one easy-medium and one medium",
      "Debugging: given broken code, find and fix the fault under time pressure",
      "Tree and graph traversal",
      "Hash-map aggregation over logs or orders",
      "OOD: design a class hierarchy for a small system",
    ],
    edge:
      "The <b>Leadership Principles are scored as heavily as the code</b>. The Bar Raiser can veto the hire alone. Prepare 6–8 STAR stories mapped to the 16 LPs — this is the cheapest marginal gain available anywhere in Amazon's process, and the part candidates most reliably neglect.",
    extras: ["Debugging section", "Work-style survey", "Bar Raiser on 16 Leadership Principles", "CGPA cutoff often 7.0–7.5"],
    sources: [
      { label: "FACE Prep — Amazon recruitment process", url: "https://faceprep.in/article/amazon-recruitment-process/" },
      { label: "PapersAdda — Amazon OA pattern 2026", url: "https://papersadda.com/article/amazon-online-assessment-2026/" },
      { label: "Entri — Amazon OA pattern and syllabus", url: "https://entri.app/blog/amazon-online-assessment-details/" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "deshaw",
    name: "D. E. Shaw",
    tier: "fintech",
    platform: "Online test",
    format:
      "60-minute online test across five sections with <b>0.25 negative marking</b>: quantitative aptitude, verbal, logical reasoning, technical MCQs, and a coding problem that is frequently dynamic programming. Then two technical interviews and an HR round.",
    durationMin: 60,
    questions: "4 MCQ sections + 1 coding problem",
    weights: { dp: 5, arr: 4, bit: 4, greedy: 3, graph: 3, hash: 3 },
    archetypes: [
      "A dynamic programming problem under severe time pressure",
      "Probability and combinatorics in the quant section",
      "Technical MCQs on OS, DBMS, C/C++ output",
      "Logical reasoning puzzles",
    ],
    edge:
      "<b>0.25 negative marking</b> changes the strategy completely — guessing is negative expected value unless you can eliminate two options. Sixty minutes across five sections means roughly ten minutes each; the coding problem cannot be a leisurely derivation.",
    extras: ["Negative marking", "Quant and probability", "Technical MCQs"],
    sources: [
      { label: "FACE Prep — D.E. Shaw recruitment process", url: "https://faceprep.in/article/d-e-shaw-campus-recruitment-process-face-prep/" },
      { label: "Unstop — D.E. Shaw process 2026", url: "https://unstop.com/blog/de-shaw-recruitment-process" },
    ],
    checked: "2026-07-26",
  },
  {
    id: "arcesium",
    name: "Arcesium",
    tier: "fintech",
    platform: "HackerRank",
    format:
      "Two-part online round: technical and aptitude MCQs covering DSA, operating systems and C/C++/Java basics, then two or three coding problems. Five to six rounds in total for the Assistant System Engineer track.",
    durationMin: 120,
    questions: "MCQ section + 2–3 coding problems",
    weights: { arr: 4, dp: 4, hash: 4, tree: 3, graph: 3, bit: 3, str: 3 },
    archetypes: [
      "Medium DSA — arrays, strings, DP",
      "MCQs on operating systems and language semantics",
      "SQL and database questions for some tracks",
    ],
    edge:
      "The MCQ half covers OS and language internals, not just DSA. A strong coder who has never revised OS fundamentals loses marks here that are cheap to recover.",
    extras: ["OS and DBMS MCQs", "Language-semantics questions"],
    sources: [
      { label: "GeeksforGeeks — Arcesium recruitment process", url: "https://www.geeksforgeeks.org/arcesium-recruitment-process/" },
      { label: "InterviewBit — Arcesium interview questions", url: "https://www.interviewbit.com/arcesium-interview-questions/" },
    ],
    checked: "2026-07-26",
  },
];
