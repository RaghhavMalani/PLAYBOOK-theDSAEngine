/* Ported from the verified single-file build. Behaviour is unchanged;
   only the module boundaries and typing are new. */
import { $ } from "../lib/dom";
import { hl } from "../lib/highlight";

export function initPages(): void {


$("#v-io").innerHTML = [
'<div class="tag"><i></i><span>oa mechanics // the round nobody teaches</span></div>',
'<h2 class="mod">Fast I/O &amp; boilerplate</h2>',
'<p class="brief">This page is not about algorithms. It is about the <b>correct solutions that still fail</b>. With n up to 10⁶, Python\'s <code>input()</code> in a loop and Java\'s <code>Scanner</code> are slow enough to TLE a solution that is asymptotically perfect. Memorise one template per language and type it before you read the problem.</p>',

'<div class="note"><b>The rule of thumb:</b> if the constraints mention <b>10⁵ or more</b> lines of input, you must use buffered reading. <code>Scanner</code> is roughly <b>5–10× slower</b> than <code>BufferedReader</code>/<code>StreamTokenizer</code>; Python\'s <code>input()</code> is around <b>3–5× slower</b> than <code>sys.stdin.buffer.read()</code>. Neither shows up on the sample tests — only on the hidden ones.</div>',

'<div class="grid2">',
'<div class="card"><h5>Python — the only template you need</h5>',
'<pre class="src">'+hl("import sys\nfrom collections import deque, defaultdict, Counter\ninput = sys.stdin.readline          # line-based, fast enough\n\ndef main():\n    data = sys.stdin.buffer.read().split()   # FASTEST: read it all\n    it = iter(data)\n    t = int(next(it))\n    out = []\n    for _ in range(t):\n        n = int(next(it))\n        a = [int(next(it)) for _ in range(n)]\n        out.append(str(solve(n, a)))\n    sys.stdout.write(\"\\n\".join(out) + \"\\n\")   # ONE write, not n prints\n\nmain()","py")+'</pre>',
'<ul style="margin-top:12px"><li><b>Never</b> <code>print()</code> inside a hot loop — collect and join once.</li><li><code>input()</code> rebound to <code>sys.stdin.readline</code> keeps the trailing newline: use <code>.strip()</code> on strings.</li><li>Deep recursion: <code>sys.setrecursionlimit(300000)</code>, and prefer iterative DFS on 10⁵ nodes.</li></ul></div>',

'<div class="card"><h5>C++ — the only template you need</h5>',
'<pre class="src">'+hl("#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);   // both lines, always\n    cin.tie(nullptr);\n\n    int t;\n    cin >> t;\n    while (t--) {\n        int n;\n        cin >> n;\n        vector<long long> a(n);\n        for (auto& x : a) cin >> x;\n        cout << solve(a) << \"\\n\";       // \"\\n\", never endl\n    }\n    return 0;\n}","cpp")+'</pre>',
'<ul style="margin-top:12px"><li><code>endl</code> flushes the buffer <b>every call</b> — it is the single most common C++ TLE. Use <code>"\\n"</code>.</li><li>After <code>sync_with_stdio(false)</code> do <b>not</b> mix <code>printf</code>/<code>scanf</code> with <code>cin</code>/<code>cout</code>.</li><li><code>bits/stdc++.h</code> works on GCC (most judges) but not MSVC or clang by default.</li></ul></div>',

'<div class="card"><h5>Java — the one that actually bites</h5>',
'<pre class="src">'+hl("import java.io.*;\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        StreamTokenizer in = new StreamTokenizer(\n                new BufferedInputStream(System.in));\n        StringBuilder sb = new StringBuilder();\n\n        in.nextToken(); int t = (int) in.nval;\n        while (t-- > 0) {\n            in.nextToken(); int n = (int) in.nval;\n            int[] a = new int[n];\n            for (int i = 0; i < n; i++) {\n                in.nextToken();\n                a[i] = (int) in.nval;\n            }\n            sb.append(solve(a)).append('\\n');\n        }\n        System.out.print(sb);      // ONE print at the end\n    }\n}","java")+'</pre>',
'<ul style="margin-top:12px"><li><b>Never <code>Scanner</code></b> on large input. <code>StreamTokenizer</code> is fastest for numbers; <code>BufferedReader</code> + <code>split</code> for mixed text.</li><li><code>System.out.println</code> in a loop flushes each time — build a <code>StringBuilder</code>.</li><li><code>StreamTokenizer</code> reads doubles, so cast. It also cannot read negative numbers as one token unless you configure it — for those use <code>BufferedReader</code>.</li></ul></div>',

'<div class="card"><h5>The overflow table</h5>',
'<table class="t"><tr><th>Type</th><th>Max</th><th>When it bites</th></tr>',
'<tr><td><code>int</code> (C++/Java)</td><td>≈ 2.1 × 10⁹</td><td>Summing 10⁵ values of 10⁵ each. Use <code>long long</code>/<code>long</code>.</td></tr>',
'<tr><td><code>long long</code>/<code>long</code></td><td>≈ 9.2 × 10¹⁸</td><td>Products of two values near 10¹⁰, or factorials past 20!.</td></tr>',
'<tr><td>Python <code>int</code></td><td>unbounded</td><td>Never overflows — which is exactly why Python habits do not transfer.</td></tr></table>',
'<ul><li><code>(lo + hi) / 2</code> overflows near the max — write <code>lo + (hi - lo) / 2</code>.</li><li><code>(a * b) % m</code> overflows <b>before</b> the mod. Cast to 64-bit first.</li><li>Java: <code>a - b</code> inside a comparator overflows. Use <code>Integer.compare(a, b)</code>.</li></ul></div>',
'</div>',

'<h2 class="mod" style="margin-top:44px;font-size:26px">Reading the constraints</h2>',
'<p class="brief">The constraint block is the interviewer quietly handing you the intended complexity. Most candidates skim past it.</p>',
'<table class="t"><tr><th>Constraint</th><th>Intended complexity</th><th>What that means</th></tr>',
'<tr><td><code>n ≤ 10</code></td><td>O(n!) or O(n⁶)</td><td>Brute force everything. Permutations are fine.</td></tr>',
'<tr><td><code>n ≤ 20</code></td><td>O(2ⁿ) / O(2ⁿ·n)</td><td>Bitmask DP. This constraint means nothing else.</td></tr>',
'<tr><td><code>n ≤ 100</code></td><td>O(n⁴)</td><td>Floyd–Warshall, 4 nested loops.</td></tr>',
'<tr><td><code>n ≤ 500</code></td><td>O(n³)</td><td>Interval DP, matrix chain.</td></tr>',
'<tr><td><code>n ≤ 5·10³</code></td><td>O(n²)</td><td>Two-string DP, the O(n²) LIS.</td></tr>',
'<tr><td><code>n ≤ 10⁵ – 10⁶</code></td><td>O(n log n)</td><td>Sort, heap, binary search, or a single-pass linear scan.</td></tr>',
'<tr><td><code>n ≤ 10⁷ – 10⁸</code></td><td>O(n), tight constants</td><td>One pass. In Python this is often <b>not possible</b> — say so.</td></tr></table>',

'<div class="note"><b>Partial credit is a strategy, not a compromise.</b> Most OA platforms score per test case. If you have 15 minutes left and no optimal idea, write the O(n²) brute force — it clears the small constraint groups and beats an unfinished elegant solution. Get something passing first, optimise second. Meta\'s staged OA in particular requires passing each stage before the next unlocks.</div>'
].join("");


$("#v-sql").innerHTML = [
'<div class="tag"><i></i><span>visa &amp; amex // the half you did not plan for</span></div>',
'<h2 class="mod">SQL for the OA</h2>',
'<p class="brief">Visa\'s assessment has included a <b>SQL section</b> alongside the DSA questions — joins, GROUP BY, aggregates and filtering. Amex runs analytics-flavoured rounds too. This is a small, closed, highly learnable surface: a couple of hours here is worth more than another day of LeetCode mediums.</p>',

'<div class="grid2">',
'<div class="card"><h5>Order of execution — the thing that explains everything</h5>',
'<pre class="src">'+hl("FROM      -- 1. pick tables, do joins\nWHERE     -- 2. filter ROWS (no aggregates allowed here)\nGROUP BY  -- 3. collapse into groups\nHAVING    -- 4. filter GROUPS (aggregates allowed here)\nSELECT    -- 5. choose columns / compute aggregates\nORDER BY  -- 6. sort\nLIMIT     -- 7. cut","cpp")+'</pre>',
'<p style="font-size:13px;color:var(--dim);margin-top:11px">This single ordering answers most SQL interview questions: why you cannot use a <code>SELECT</code> alias in <code>WHERE</code> (SELECT runs later), and why aggregate filters must go in <code>HAVING</code> (WHERE runs before grouping).</p></div>',

'<div class="card"><h5>Joins</h5>',
'<pre class="src">'+hl("SELECT e.name, d.dept_name\nFROM employees e\nINNER JOIN departments d ON e.dept_id = d.id;   -- only matches\n\nLEFT JOIN   -- all of LEFT, NULLs where no match\nRIGHT JOIN  -- all of RIGHT\nFULL OUTER  -- everything from both\n\n-- find rows with NO match (very common question)\nSELECT c.name\nFROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id\nWHERE o.id IS NULL;","cpp")+'</pre>',
'<p style="font-size:13px;color:var(--dim);margin-top:11px"><b>Trap:</b> putting the right-table condition in <code>WHERE</code> instead of <code>ON</code> silently converts a LEFT JOIN back into an INNER JOIN, because <code>NULL</code> fails every comparison.</p></div>',

'<div class="card"><h5>Aggregates &amp; grouping</h5>',
'<pre class="src">'+hl("SELECT dept_id,\n       COUNT(*)        AS headcount,\n       AVG(salary)     AS avg_salary,\n       MAX(salary)     AS top_salary\nFROM employees\nWHERE active = 1              -- filter rows first\nGROUP BY dept_id\nHAVING COUNT(*) > 5           -- then filter groups\nORDER BY avg_salary DESC\nLIMIT 10;","cpp")+'</pre>',
'<p style="font-size:13px;color:var(--dim);margin-top:11px"><b>Trap:</b> <code>COUNT(*)</code> counts rows including NULLs; <code>COUNT(col)</code> skips NULLs. That difference is a favourite gotcha.</p></div>',

'<div class="card"><h5>Window functions — the differentiator</h5>',
'<pre class="src">'+hl("SELECT name, dept_id, salary,\n       ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn,\n       RANK()       OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk,\n       LAG(salary)  OVER (PARTITION BY dept_id ORDER BY hire_date)   AS prev_sal\nFROM employees;\n\n-- top earner per department\nSELECT * FROM (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY dept_id\n                               ORDER BY salary DESC) rn\n  FROM employees\n) t\nWHERE rn = 1;","cpp")+'</pre>',
'<p style="font-size:13px;color:var(--dim);margin-top:11px"><code>ROW_NUMBER</code> always gives 1,2,3. <code>RANK</code> ties then skips (1,1,3). <code>DENSE_RANK</code> ties without skipping (1,1,2). Knowing which to use is the actual question.</p></div>',

'<div class="card"><h5>Nth highest — the classic</h5>',
'<pre class="src">'+hl("-- second highest salary, NULL-safe\nSELECT MAX(salary) AS second_highest\nFROM employees\nWHERE salary < (SELECT MAX(salary) FROM employees);\n\n-- Nth, general\nSELECT DISTINCT salary\nFROM employees\nORDER BY salary DESC\nLIMIT 1 OFFSET 1;      -- OFFSET N-1","cpp")+'</pre>',
'<p style="font-size:13px;color:var(--dim);margin-top:11px"><b>Trap:</b> the <code>LIMIT/OFFSET</code> form returns <em>nothing</em> when there is no second value; the <code>MAX</code> form returns <code>NULL</code>. Interviewers usually want NULL.</p></div>',

'<div class="card"><h5>CTEs, duplicates &amp; NULLs</h5>',
'<pre class="src">'+hl("WITH recent AS (\n    SELECT * FROM orders WHERE order_date >= '2026-01-01'\n)\nSELECT customer_id, COUNT(*) FROM recent GROUP BY customer_id;\n\n-- find duplicates\nSELECT email, COUNT(*) FROM users\nGROUP BY email HAVING COUNT(*) > 1;\n\n-- NULL is not a value: these are NOT equivalent\nWHERE col = NULL      -- always false, matches nothing\nWHERE col IS NULL     -- correct\nCOALESCE(col, 0)      -- substitute a default","cpp")+'</pre></div>',
'</div>',

'<div class="note"><b>Two hours, honestly spent:</b> write these by hand until the execution order is automatic. Then do LeetCode\'s SQL 50 — it maps almost exactly onto what shows up in a Visa-style assessment, and it is a far smaller surface than the DSA half.</div>'
].join("");


$("#v-plan").innerHTML = [
'<div class="tag"><i></i><span>triage // under one month</span></div>',
'<h2 class="mod">The four weeks</h2>',
'<p class="brief">Coverage beats depth. A candidate who knows ten topics at 70% clears far more rounds than one who knows arrays at 100% and graphs at zero — because you do not get to pick the question. <b>Do not build study tools this month.</b> Consume, drill, repeat.</p>',

'<div class="wk"><div class="wd">week 1 · foundation</div><h4>Hashing · Strings · Linked lists · Stacks &amp; queues</h4>',
'<p>Highest frequency and fastest to learn. Hashing alone unlocks a large fraction of easy and medium problems. Finish the week able to write the sliding-window template and a monotonic stack from memory, in your chosen language, without looking.</p>',
'<p style="color:var(--amb)"><b>Target:</b> 35–40 problems. Mostly easy, sliding to medium by Thursday.</p></div>',

'<div class="wk"><div class="wd">week 2 · structure</div><h4>Trees &amp; BST · Heaps · Recursion &amp; backtracking</h4>',
'<p>Most tree problems are one of four traversals in a costume. Drill BFS level-order and the bottom-up post-order aggregate until they are automatic — between them they cover the majority of tree questions asked. Backtracking is one template with three variations.</p>',
'<p style="color:var(--amb)"><b>Target:</b> 35–40 problems. Mostly medium.</p></div>',

'<div class="wk"><div class="wd">week 3 · the deciders</div><h4>Graphs · Dynamic programming</h4>',
'<p>These two decide your Google and Meta outcome. Graphs: BFS/DFS, topological sort, union-find, Dijkstra — and recognising that a grid is a graph. DP: the six shapes (1D linear, 0/1 knapsack, unbounded, LIS, grid, two-sequence). Do not try to learn DP as a concept; learn the six shapes and which signal points at each.</p>',
'<p style="color:var(--amb)"><b>Target:</b> 40 problems. All medium, a few hard.</p></div>',

'<div class="wk"><div class="wd">week 4 · simulation only</div><h4>No new topics. Timed mixed drilling.</h4>',
'<p>Simulate the real format. <b>Meta:</b> 45 minutes, two problems, both finished. <b>Google:</b> write in a plain doc — no autocomplete, no running it — then type it in and see if it compiles first try. <b>Visa:</b> 90 minutes, four problems, plus the SQL section.</p>',
'<p>Revisit only what you got wrong. The revision sheet is what you read the night before, not this page.</p>',
'<p style="color:var(--amb)"><b>Target:</b> 6–8 full timed sets.</p></div>',

'<h2 class="mod" style="margin-top:40px;font-size:26px">Daily, non-negotiable</h2>',
'<div class="grid2">',
'<div class="card"><h5>The 25-minute rule</h5><ul>',
'<li><b>Struggle for 25 minutes</b> before looking at anything. The struggle is the part that transfers; reading solutions feels productive and mostly is not.</li>',
'<li>After solving, <b>close the tab and rewrite it from scratch.</b> If you cannot, you did not learn it.</li>',
'<li>Keep a <b>one-line log</b> per problem: the signal you missed. Re-read that log every Sunday — it becomes your personal trap list.</li>',
'<li><b>Say the complexity out loud</b> before coding. Every round scores this.</li></ul></div>',

'<div class="card"><h5>What actually gets scored</h5><ul>',
'<li><b>Meta</b> — speed and code cleanliness, explicitly. Two problems in 45 minutes.</li>',
'<li><b>Google</b> — complete working code including edge cases, written without a compiler. State edge cases aloud.</li>',
'<li><b>Microsoft</b> — one well-scoped problem per round, plus object-oriented design more than the others.</li>',
'<li><b>Visa / Amex</b> — throughput. Four questions, ~3 solved to advance, plus SQL.</li>',
'<li>Everywhere: <b>talk while you think.</b> A silent correct solution scores below a narrated one.</li></ul></div>',
'</div>',

'<div class="note"><b>Commit to one language this week.</b> Three languages in under a month means none of them is automatic, and the OA clock does not care that you know the algorithm. Python is the better hand-written language for Google and Meta, where execution is disabled and you want fewer characters to get right. C++ is the safer auto-graded language where TLE is real. Pick one, keep the other two as reading knowledge, and revisit after placements.</div>'
].join("");

}
