import type { OAEssentialSection } from "../types";

/**
 * The non-DSA half of common campus assessments. Each lesson deliberately fits
 * one sitting: learn a repeatable method, inspect one worked example, then answer
 * one closed checkpoint without needing an external question bank.
 */
export const OA_ESSENTIALS: readonly OAEssentialSection[] = [
  {
    id: "quant",
    label: "Quantitative aptitude",
    eyebrow: "ratios before algebra",
    description:
      "Convert words into ratios, rates, or multipliers before touching a formula. These questions reward a small set of reusable models and ruthless arithmetic hygiene, not cleverness.",
    companyKeywords: ["aptitude", "quant", "numerical", "mathematical", "analytics", "probability"],
    lessons: [
      {
        id: "percent-ratio",
        title: "Percentages, ratios & mixtures",
        minutes: 24,
        goal: "Move between percentage change, ratios, and weighted mixtures without inventing an unknown for every sentence.",
        method: [
          "Treat x% as a multiplier: an increase is ×(1 + x/100), a decrease is ×(1 − x/100). Successive changes multiply; they never simply add.",
          "If A:B = a:b, write A = ak and B = bk. The shared k removes most simultaneous equations.",
          "For a two-part mixture, use alligation: the quantity ratio is the opposite distance from the target concentration.",
        ],
        trap: "A 20% rise followed by a 20% fall is not zero change: 1.2 × 0.8 = 0.96, so the net change is −4%.",
        worked: {
          prompt: "A 30% solution is mixed with a 50% solution to make 42 litres of a 40% solution. How much of each is used?",
          steps: [
            "Distances from the target are 40 − 30 = 10 and 50 − 40 = 10.",
            "Alligation gives low:high = 10:10 = 1:1.",
            "Split 42 litres equally.",
          ],
          answer: "21 L of 30% solution and 21 L of 50% solution.",
        },
        checkpoint: {
          prompt: "A salary rises by 25% and then falls by 20%. Relative to the original salary, what is the final change?",
          choices: ["No change", "5% increase", "5% decrease", "4% decrease"],
          answer: 0,
          explanation: "1.25 × 0.80 = 1.00. The unequal percentages happen to be exact inverse multipliers here.",
        },
      },
      {
        id: "averages-commercial",
        title: "Averages, profit & interest",
        minutes: 25,
        goal: "Use totals and multipliers so replacement averages, discounts, profit, and compound interest become one-line calculations.",
        method: [
          "Average is total/count. When one value is replaced, change in total = count × change in average.",
          "Profit and loss percentages are normally measured against cost price; discount is measured against marked price. Keep the bases separate.",
          "Compound interest is repeated multiplication. For two years at r%, multiply principal by (1 + r/100)².",
        ],
        trap: "A 20% markup followed by a 20% discount does not return to cost: marked price and cost price are different bases.",
        worked: {
          prompt: "The average of 8 numbers is 24. Replacing one number by 42 raises the average to 27. What was replaced?",
          steps: [
            "The total rises by 8 × (27 − 24) = 24.",
            "The new value 42 is 24 larger than the old value.",
            "Old value = 42 − 24.",
          ],
          answer: "18.",
        },
        checkpoint: {
          prompt: "An item costs ₹800, is marked up 25%, then discounted 10%. What is the selling price?",
          choices: ["₹880", "₹900", "₹920", "₹1,000"],
          answer: 1,
          explanation: "₹800 × 1.25 = ₹1,000 marked price; ₹1,000 × 0.90 = ₹900.",
        },
      },
      {
        id: "work-rate",
        title: "Time, work & pipes",
        minutes: 26,
        goal: "Translate every worker or pipe into work per unit time, add rates, and invert only once at the end.",
        method: [
          "If A finishes in a days, A's rate is 1/a job per day. Combined rates add; an outlet or leak subtracts.",
          "Use the LCM of the completion times as a convenient total-work unit when fractions feel slow.",
          "Efficiency is inverse to time: if A is twice as efficient as B, A needs half as long for the same work.",
        ],
        trap: "Do not average completion times. Two workers taking 6 and 3 days together do not take 4.5 days; their rates are what combine.",
        worked: {
          prompt: "A completes a job in 12 days and B in 18 days. How long together?",
          steps: [
            "Choose total work 36 units. A does 3 units/day; B does 2.",
            "Together they do 5 units/day.",
            "Time = 36/5 days.",
          ],
          answer: "7.2 days.",
        },
        checkpoint: {
          prompt: "A pipe fills a tank in 8 hours and a leak empties it in 24 hours. With both open, how long does filling take?",
          choices: ["6 hours", "10 hours", "12 hours", "16 hours"],
          answer: 2,
          explanation: "Net rate = 1/8 − 1/24 = 2/24 = 1/12 tank per hour, so the tank takes 12 hours.",
        },
      },
      {
        id: "speed-data",
        title: "Speed, distance & data interpretation",
        minutes: 28,
        goal: "Keep units consistent, use relative speed, and reduce tables or charts to the exact comparison the question asks for.",
        method: [
          "Write d = st and convert units first: km/h to m/s is ×5/18; m/s to km/h is ×18/5.",
          "Opposite directions add speeds; same direction subtracts. For average speed over equal distances use 2ab/(a+b), not (a+b)/2.",
          "In data interpretation, estimate the answer range before exact division. It catches copied digits and impossible percentages.",
        ],
        trap: "The ordinary mean of two speeds works only for equal time, not equal distance.",
        worked: {
          prompt: "A car travels 120 km at 40 km/h and returns the same distance at 60 km/h. Find its average speed.",
          steps: [
            "Outward time = 120/40 = 3 h; return time = 120/60 = 2 h.",
            "Total distance = 240 km and total time = 5 h.",
            "Average speed = 240/5.",
          ],
          answer: "48 km/h.",
        },
        checkpoint: {
          prompt: "A 180 m train moving at 54 km/h crosses a pole in how many seconds?",
          choices: ["10", "12", "15", "18"],
          answer: 1,
          explanation: "54 km/h = 15 m/s. Time = 180/15 = 12 seconds.",
        },
      },
    ],
  },
  {
    id: "reasoning",
    label: "Reasoning & verbal",
    eyebrow: "constraints, not intuition",
    description:
      "Externalise the rules. A tiny diagram, set relation, or evidence table beats holding six conditions in working memory, and it makes option elimination auditable.",
    companyKeywords: ["reasoning", "verbal", "communication", "english", "puzzle", "cognitive", "game-based", "essay"],
    lessons: [
      {
        id: "series-coding",
        title: "Series & coding-decoding",
        minutes: 20,
        goal: "Test simple first- and second-order differences before reaching for an exotic pattern.",
        method: [
          "For number series, write first differences, then second differences; also test alternating odd/even subsequences.",
          "Check multiplication plus/minus a small constant when differences grow rapidly.",
          "For letter codes, map A=1…Z=26 and test position shifts, reversal, and pairwise operations explicitly.",
        ],
        trap: "A short prefix can fit infinitely many rules. Prefer the simplest rule that explains every transition and is represented among the options.",
        worked: {
          prompt: "Find the next term: 2, 6, 12, 20, 30, ?",
          steps: [
            "First differences are 4, 6, 8, 10.",
            "The differences rise by 2, so the next difference is 12.",
            "30 + 12 = 42. Equivalently the terms are n(n+1).",
          ],
          answer: "42.",
        },
        checkpoint: {
          prompt: "Find the next term: 3, 8, 15, 24, 35, ?",
          choices: ["46", "47", "48", "49"],
          answer: 2,
          explanation: "Differences are 5, 7, 9, 11, so the next difference is 13 and the answer is 48.",
        },
      },
      {
        id: "arrangements",
        title: "Arrangements & ordering",
        minutes: 28,
        goal: "Turn prose into slots and relative-order constraints, then branch only on the most restrictive condition.",
        method: [
          "Draw exactly one slot per person or object. Record adjacency as a block and fixed distances as linked slots.",
          "Place absolute facts first, then adjacency, then weaker before/after facts.",
          "For circular arrangements, fix one person at the top to remove rotations; left/right is from each person's perspective unless stated otherwise.",
        ],
        trap: "Do not assume 'A is left of B' means immediately left. Adjacency needs words such as immediately, next to, or consecutive.",
        worked: {
          prompt: "P, Q, R, S sit in a row. Q is immediately right of P. R is not at an end. S is left of P. Find the order.",
          steps: [
            "Treat PQ as a fixed block.",
            "S must appear before that block.",
            "R cannot be at either end, leaving S R P Q.",
          ],
          answer: "S, R, P, Q.",
        },
        checkpoint: {
          prompt: "Five people stand in a row. A is immediately before B, and C is immediately after B. Which block must occur?",
          choices: ["BAC", "ABC", "ACB", "CAB"],
          answer: 1,
          explanation: "A immediately precedes B and C immediately follows B, forcing the consecutive block ABC.",
        },
      },
      {
        id: "syllogism",
        title: "Syllogisms & logical deduction",
        minutes: 24,
        goal: "Reason from set containment and overlap without importing real-world facts or reversing implications.",
        method: [
          "Translate 'all A are B' as A ⊆ B; it does not imply B ⊆ A. 'No A are B' means disjoint sets.",
          "'Some A are B' asserts at least one overlap. Universal statements alone do not guarantee that any A exists.",
          "Test conclusions by drawing the smallest counterexample. If one legal diagram makes it false, it does not follow.",
        ],
        trap: "Affirming the consequent is invalid: if all cats are mammals, seeing a mammal does not prove it is a cat.",
        worked: {
          prompt: "All routers are devices. No device is edible. What necessarily follows?",
          steps: [
            "Routers are a subset of devices.",
            "Devices and edible things are disjoint.",
            "Therefore routers cannot overlap edible things.",
          ],
          answer: "No router is edible.",
        },
        checkpoint: {
          prompt: "All analysts are graduates. Some graduates are coders. Which conclusion is guaranteed?",
          choices: ["Some analysts are coders", "All coders are analysts", "No analyst is a coder", "None of these"],
          answer: 3,
          explanation: "The coder-graduate overlap may sit completely outside the analyst subset. No relation between analysts and coders is forced.",
        },
      },
      {
        id: "verbal-evidence",
        title: "Reading, grammar & data sufficiency",
        minutes: 26,
        goal: "Answer only what the passage or statements establish, while checking sufficiency without needlessly solving the whole problem.",
        method: [
          "For comprehension, locate the sentence supporting an option; reject answers that are plausible but not stated or implied.",
          "For grammar, find the subject before choosing the verb; ignore intervening prepositional phrases.",
          "For data sufficiency, ask whether each statement determines a unique answer. The value itself is optional.",
        ],
        trap: "Combining statements too early loses the distinction between 'either alone' and 'both together', which is exactly what data-sufficiency options test.",
        worked: {
          prompt: "Is integer n even? (1) n is divisible by 6. (2) n is divisible by 3.",
          steps: [
            "Statement 1 alone guarantees a factor 2, so yes.",
            "Statement 2 allows 3 and 6, so it is insufficient.",
            "No combination is needed because statement 1 already decides it.",
          ],
          answer: "Statement 1 alone is sufficient; statement 2 alone is not.",
        },
        checkpoint: {
          prompt: "Choose the correct verb: 'The quality of the answers ___ improved.'",
          choices: ["have", "are", "has", "were"],
          answer: 2,
          explanation: "The subject is singular 'quality'; 'of the answers' is only a prepositional phrase. Use 'has'.",
        },
      },
    ],
  },
  {
    id: "cs",
    label: "CS theory",
    eyebrow: "explain the mechanism",
    description:
      "Technical MCQs become easier when every definition is tied to the mechanism it protects: transactions preserve invariants, schedulers share a CPU, and protocols trade latency for guarantees.",
    companyKeywords: ["dbms", "os", "cn", "fundamentals", "technical mcq", "programming-logic", "pseudocode", "oop", "linux"],
    lessons: [
      {
        id: "dbms",
        title: "DBMS: keys, normalisation & transactions",
        minutes: 34,
        goal: "Distinguish logical design from runtime guarantees: keys and normal forms prevent anomalies; ACID and isolation govern concurrent execution.",
        method: [
          "A candidate key is minimal and unique; the chosen candidate is the primary key. A foreign key preserves referential integrity.",
          "2NF removes partial dependency on part of a composite key; 3NF removes transitive dependency on a non-key attribute.",
          "ACID: atomicity is all-or-nothing, consistency preserves declared rules, isolation controls interference, durability survives commit.",
          "An index trades write cost and storage for faster reads. A composite index is ordered: (a,b) naturally supports a and a+b lookups, not generally b alone.",
        ],
        trap: "Atomicity and isolation are not synonyms. Atomicity handles partial failure inside one transaction; isolation handles interactions between concurrent transactions.",
        worked: {
          prompt: "Enrollment(student_id, course_id, student_name, grade) has key (student_id, course_id). Why is it not in 2NF?",
          steps: [
            "The key is composite.",
            "student_name depends only on student_id, a proper subset of the key.",
            "That partial dependency violates 2NF; move student data to Student(student_id, student_name).",
          ],
          answer: "student_name is partially dependent on the composite key, so decompose the table.",
        },
        checkpoint: {
          prompt: "A transaction reads the same row twice and sees two committed values because another transaction updated it between reads. What anomaly is this?",
          choices: ["Dirty read", "Non-repeatable read", "Phantom read", "Lost update"],
          answer: 1,
          explanation: "The same row changes between two reads: non-repeatable read. A phantom is a changed set of matching rows, usually after an insert/delete.",
        },
      },
      {
        id: "os",
        title: "OS: processes, scheduling & memory",
        minutes: 36,
        goal: "Explain what the kernel owns, what threads share, why context switches cost time, and how virtual memory turns addresses into pages.",
        method: [
          "Processes have separate address spaces; threads in one process share code, heap, and open resources but keep their own stack and registers.",
          "A context switch saves and restores execution state. It enables sharing but does no application work itself.",
          "Deadlock requires mutual exclusion, hold-and-wait, no preemption, and circular wait; breaking any one condition prevents deadlock.",
          "Virtual addresses map through page tables to physical frames. A page fault means the required page is not currently resident; the OS must resolve it.",
        ],
        trap: "Concurrency is not parallelism. One CPU core can interleave many threads concurrently; parallel execution requires multiple execution units.",
        worked: {
          prompt: "Why can two threads share a heap object but have different local variables with the same name?",
          steps: [
            "Threads in a process share the process address space, including the heap.",
            "Each thread owns a separate call stack.",
            "Local variables normally live in each thread's stack frame, so the names and storage are independent.",
          ],
          answer: "Shared heap, separate stacks.",
        },
        checkpoint: {
          prompt: "Which scheduling policy is most directly vulnerable to starvation of long jobs when short jobs keep arriving?",
          choices: ["FCFS", "Shortest Job First", "Round Robin", "FIFO paging"],
          answer: 1,
          explanation: "SJF continually prefers shorter work, so a long waiting job may never run. Aging is a standard mitigation for starvation.",
        },
      },
      {
        id: "networks",
        title: "CN: TCP/IP, DNS & HTTP",
        minutes: 35,
        goal: "Trace one request from a domain name to bytes on a connection and know which layer supplies each guarantee.",
        method: [
          "DNS resolves a hostname to an address. ARP resolves an IP to a link-layer address on the local network. They solve different mappings.",
          "TCP supplies an ordered, reliable byte stream with flow and congestion control; UDP supplies independent datagrams without those guarantees.",
          "HTTPS is HTTP over TLS. TLS authenticates the server and protects confidentiality and integrity; it does not hide the destination IP from the network path.",
          "HTTP is stateless at the protocol level. Cookies or tokens carry application session identity across requests.",
        ],
        trap: "TCP preserves byte order, not application message boundaries. One send can be split across reads, and several sends can arrive in one read.",
        worked: {
          prompt: "What must generally happen before a browser can send an HTTPS request to a hostname it has never visited?",
          steps: [
            "Resolve the hostname with DNS.",
            "Establish transport connectivity, normally a TCP handshake for HTTP/1.1 or HTTP/2.",
            "Complete the TLS handshake, then send the HTTP request inside the protected channel.",
          ],
          answer: "DNS resolution → transport handshake → TLS handshake → HTTP request.",
        },
        checkpoint: {
          prompt: "Which protocol is the best default for a file transfer that must arrive complete and in order?",
          choices: ["UDP", "ARP", "TCP", "ICMP"],
          answer: 2,
          explanation: "TCP provides reliable, ordered delivery and retransmission. File transfer values correctness over the lower overhead of UDP.",
        },
      },
      {
        id: "runtime-oop",
        title: "OOP & runtime fundamentals",
        minutes: 30,
        goal: "Separate compile-time types, runtime objects, encapsulation, inheritance, and polymorphic dispatch in output-prediction MCQs.",
        method: [
          "Encapsulation protects an invariant behind methods; abstraction exposes what a component does while hiding how.",
          "Overloading chooses among signatures at compile time; overriding replaces inherited behaviour and dispatches on the runtime object.",
          "Composition models has-a and keeps change local. Inheritance models is-a and couples subclasses to the base contract.",
          "A shallow copy duplicates the outer object but shares referenced children; a deep copy recursively duplicates owned mutable state.",
        ],
        trap: "A reference's declared type controls which members are legal to call; the runtime object's type controls which overridden implementation executes.",
        worked: {
          prompt: "Animal a = new Dog(); a.speak(); where Dog overrides speak. Which implementation runs?",
          steps: [
            "The declared type Animal permits the speak call.",
            "The runtime object is a Dog.",
            "An overridden instance method uses dynamic dispatch.",
          ],
          answer: "Dog.speak runs.",
        },
        checkpoint: {
          prompt: "Which relationship best models an Order that uses a PaymentStrategy which can be swapped at runtime?",
          choices: ["Inheritance", "Composition", "Global state", "Method overloading"],
          answer: 1,
          explanation: "The order has a strategy and delegates payment behaviour to it. Composition keeps the policy replaceable without subclassing Order.",
        },
      },
    ],
  },
] as const;
