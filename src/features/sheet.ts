/* Ported from the verified single-file build. Behaviour is unchanged;
   only the module boundaries and typing are new. */
import { $, esc } from "../lib/dom";
import { hl, bd } from "../lib/highlight";
import { PATTERNS as PAT, TOPICS } from "../data/index";

export function initSheet(): void {
function topicName(id){ for(var i=0;i<TOPICS.length;i++) if(TOPICS[i][0]===id) return TOPICS[i][1]; return id; }

  // signal -> pattern, auto-generated so it can never drift from the patterns above
  var  byTopic: any = {};
  PAT.forEach(function(p){ (byTopic[p.t]=byTopic[p.t]||[]).push(p); });
  var sigRows="";
  TOPICS.forEach(function(t){
    if(!byTopic[t[0]]) return;
    byTopic[t[0]].forEach(function(p,i){
      var plain=p.sig.replace(/<[^>]+>/g,"").replace(/^Signal:\s*/,"");
      if(plain.length>150) plain=plain.slice(0,148)+"…";
      sigRows+="<tr>"
        +"<td style='color:var(--mag);font-family:var(--mono);font-size:10px;letter-spacing:.14em'>"+(i===0?esc(t[1]).toUpperCase():"")+"</td>"
        +"<td style='color:var(--dim)'>"+esc(plain)+"</td>"
        +"<td><b>"+esc(p.n)+"</b></td>"
        +"<td>"+bd(p.tc)+"</td></tr>";
    });
  });

  $("#v-sheet").innerHTML=[
'<div class="tag"><i></i><span>the night before // one page</span></div>',
'<h2 class="mod">Revision sheet</h2>',
'<p class="brief">Everything else on this site is for learning. This page is for the two hours before an assessment. <button class="btn" onclick="window.print()" style="margin-left:8px">print / save as pdf</button></p>',

'<h2 class="mod" style="font-size:22px;margin-top:32px">1 · Constraint → complexity</h2>',
'<table class="t"><tr><th>n</th><th>Target</th><th>Pattern family</th></tr>',
'<tr><td><code>≤ 10</code></td><td>O(n!)</td><td>Permutations, brute force everything</td></tr>',
'<tr><td><code>≤ 20</code></td><td>O(2ⁿ)</td><td>Bitmask DP — this constraint means nothing else</td></tr>',
'<tr><td><code>≤ 100</code></td><td>O(n⁴) / O(n³)</td><td>Floyd–Warshall, interval DP</td></tr>',
'<tr><td><code>≤ 5·10³</code></td><td>O(n²)</td><td>Two-sequence DP, O(n²) LIS</td></tr>',
'<tr><td><code>≤ 10⁵</code></td><td>O(n log n)</td><td>Sort · heap · binary search · single pass</td></tr>',
'<tr><td><code>≤ 10⁷</code></td><td>O(n)</td><td>One pass, tight constants — often not Python</td></tr></table>',

'<h2 class="mod" style="font-size:22px;margin-top:34px">2 · Signal → pattern</h2>',
'<p class="brief" style="margin-bottom:12px">Read the left column. If you can name the middle column in under ten seconds, you are ready.</p>',
'<table class="t"><tr><th style="width:120px">Topic</th><th>If the problem says…</th><th style="width:210px">Reach for</th><th style="width:110px">Cost</th></tr>'+sigRows+'</table>',

'<h2 class="mod" style="font-size:22px;margin-top:34px">3 · The traps that cost offers</h2>',
'<div class="grid2">',
'<div class="card"><h5>All languages</h5><ul>',
'<li><code>(lo+hi)/2</code> overflows → <code>lo + (hi-lo)/2</code></li>',
'<li>Binary search: moving <code>lo = mid</code> needs a <b>ceiling</b> midpoint or it infinite-loops</li>',
'<li>BFS: mark visited on <b>enqueue</b>, not dequeue</li>',
'<li>Directed cycle detection needs <b>three</b> states, not a boolean</li>',
'<li>Dijkstra: skip stale heap entries (<code>if d &gt; dist[u]: continue</code>); negative weights break it entirely</li>',
'<li>Prefix-sum counting: seed the map with <code>{0: 1}</code></li>',
'<li>Knapsack: descending capacity = 0/1, ascending = unbounded</li>',
'<li>Backtracking: append a <b>copy</b> of the path, never the live list</li>',
'<li>Kadane: seed from <code>a[0]</code>, never 0</li></ul></div>',

'<div class="card"><h5>Python</h5><ul>',
'<li><code>[[0]*m]*n</code> aliases every row — use a comprehension</li>',
'<li><code>sort()</code>/<code>append()</code> return <code>None</code></li>',
'<li><code>pop(0)</code> and <code>insert(0,x)</code> are O(n) — use <code>deque</code></li>',
'<li>Mutable default args are shared across calls</li>',
'<li>Recursion limit is 1000 — raise it or go iterative</li>',
'<li><code>s += c</code> in a loop is O(n²) — collect and <code>join</code></li></ul>',
'<h5 style="margin-top:16px">C++</h5><ul>',
'<li><code>endl</code> flushes — use <code>"\\n"</code></li>',
'<li><code>v.size()</code> is unsigned: <code>size()-1</code> on empty wraps</li>',
'<li><code>push_back</code> invalidates all iterators and references</li>',
'<li><code>m[k]</code> on a missing key <b>inserts</b> — use <code>count</code>/<code>find</code></li>',
'<li>Comparator must be a strict weak ordering — <code>&lt;=</code> segfaults inside <code>sort</code></li></ul></div>',
'</div>',

'<div class="grid2" style="margin-top:16px">',
'<div class="card"><h5>Java</h5><ul>',
'<li><code>Scanner</code> is 5–10× slower than <code>BufferedReader</code> — never on big input</li>',
'<li><code>list.remove(int)</code> is by <b>index</b>, <code>remove(Object)</code> by <b>value</b></li>',
'<li><code>==</code> on boxed <code>Integer</code> fails above 127 — use <code>.equals</code></li>',
'<li><code>a - b</code> in a comparator overflows — use <code>Integer.compare</code></li>',
'<li><code>Arrays.asList</code> is fixed-size; on <code>int[]</code> it yields one element</li>',
'<li><code>String +=</code> in a loop is O(n²) — one <code>StringBuilder</code> outside</li>',
'<li><code>PriorityQueue</code> is a <b>min</b>-heap; C++ <code>priority_queue</code> is a <b>max</b>-heap</li></ul></div>',

'<div class="card"><h5>In the room</h5><ul>',
'<li><b>Read the constraints first.</b> They state the intended complexity.</li>',
'<li><b>Say the target complexity before coding.</b> Every rubric scores this.</li>',
'<li><b>Narrate.</b> A silent correct solution scores below a narrated one.</li>',
'<li><b>Clarify inputs:</b> empty? duplicates? negatives? sorted? size?</li>',
'<li><b>Brute force first if stuck</b> — state it, then improve it out loud.</li>',
'<li><b>Partial credit is real</b> in an OA. Something passing beats something elegant and unfinished.</li>',
'<li><b>Test on paper</b>: n=0, n=1, all-equal, all-negative, max size.</li></ul></div>',
'</div>',

'<h2 class="mod" style="font-size:22px;margin-top:34px">4 · Type the boilerplate before you read the problem</h2>',
'<div class="grid2">',
'<div class="card"><h5>Python</h5><pre class="src">'+hl("import sys\ndata = sys.stdin.buffer.read().split()\nsys.setrecursionlimit(300000)\n# one write at the end, never print() in a loop","py")+'</pre></div>',
'<div class="card"><h5>C++</h5><pre class="src">'+hl("#include <bits/stdc++.h>\nusing namespace std;\nios_base::sync_with_stdio(false);\ncin.tie(nullptr);   // and \"\\n\", never endl","cpp")+'</pre></div>',
'<div class="card"><h5>Java</h5><pre class="src">'+hl("StreamTokenizer in = new StreamTokenizer(\n    new BufferedInputStream(System.in));\nStringBuilder sb = new StringBuilder();\n// System.out.print(sb) once at the end","java")+'</pre></div>',
'<div class="card"><h5>Last check before you submit</h5><ul>',
'<li>Did I handle <b>n = 0</b> and <b>n = 1</b>?</li>',
'<li>Can any sum or product <b>overflow int</b>?</li>',
'<li>Is my output format exactly what they asked for?</li>',
'<li>Did I <b>remove debug prints</b>?</li>',
'<li>Is there a hidden O(n²) — <code>pop(0)</code>, <code>s += c</code>, <code>in</code> on a list?</li></ul></div>',
'</div>'
  ].join("");
}
