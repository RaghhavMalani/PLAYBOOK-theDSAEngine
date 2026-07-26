/* Ported from the verified single-file build. Behaviour is unchanged;
   only the module boundaries and typing are new. */
import { $, $$, esc, RM } from "../lib/dom";
import { hl } from "../lib/highlight";
import { getPyodide, pyodideHelp, traceHarness, cxHarness } from "../lib/pyodide";
import { stressHarness, STRESS_SAMPLES } from "../lib/stress";
import type { StressResult } from "../lib/stress";
import { store } from "../lib/dom";


export const SAMPLES=[
["Two pointers — pair sum","a = [2, 7, 11, 15, 19, 24, 30]\ntarget = 41\nlo, hi = 0, len(a) - 1\nwhile lo < hi:\n    s = a[lo] + a[hi]\n    if s == target:\n        break\n    if s < target:\n        lo += 1\n    else:\n        hi -= 1\nprint('indices', lo, hi)"],
["Sliding window — longest unique","s = 'abcabcbbadcef'\na = list(s)\nseen = {}\nleft = 0\nbest = 0\nfor right in range(len(a)):\n    ch = a[right]\n    if ch in seen and seen[ch] >= left:\n        left = seen[ch] + 1\n    seen[ch] = right\n    best = max(best, right - left + 1)\nprint('longest', best)"],
["Binary search — lower bound","a = [1, 3, 3, 5, 8, 8, 8, 13, 21, 34]\ntarget = 8\nlo, hi = 0, len(a)\nwhile lo < hi:\n    mid = lo + (hi - lo) // 2\n    if a[mid] < target:\n        lo = mid + 1\n    else:\n        hi = mid\nprint('first index >= target:', lo)"],
["Dutch national flag","a = [2, 0, 2, 1, 1, 0, 2, 1, 0, 0]\nlo = 0\nmid = 0\nhi = len(a) - 1\nwhile mid <= hi:\n    if a[mid] == 0:\n        a[lo], a[mid] = a[mid], a[lo]\n        lo += 1\n        mid += 1\n    elif a[mid] == 1:\n        mid += 1\n    else:\n        a[mid], a[hi] = a[hi], a[mid]\n        hi -= 1\nprint(a)"],
["DP table — edit distance ★","A = 'horse'\nB = 'ros'\nn, m = len(A), len(B)\ndp = [[0] * (m + 1) for _ in range(n + 1)]\nfor i in range(n + 1):\n    dp[i][0] = i\nfor j in range(m + 1):\n    dp[0][j] = j\nfor i in range(1, n + 1):\n    for j in range(1, m + 1):\n        if A[i-1] == B[j-1]:\n            dp[i][j] = dp[i-1][j-1]\n        else:\n            dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])\nprint('edit distance', dp[n][m])"],
["DP table — 0/1 knapsack ★","nums = [3, 34, 4, 12, 5, 2]\ntarget = 9\ndp = [[0] * (target + 1) for _ in range(len(nums) + 1)]\nfor i in range(1, len(nums) + 1):\n    for w in range(target + 1):\n        dp[i][w] = dp[i-1][w]\n        if nums[i-1] <= w:\n            dp[i][w] = max(dp[i][w], dp[i-1][w - nums[i-1]] + nums[i-1])\nprint('best', dp[len(nums)][target])"],
["Recursion — watch the call stack ★","def fib(n):\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nprint('fib(6) =', fib(6))"],
["Backtracking — subsets ★","a = [1, 2, 3]\nout = []\n\ndef backtrack(start, path):\n    out.append(path[:])\n    for i in range(start, len(a)):\n        path.append(a[i])\n        backtrack(i + 1, path)\n        path.pop()\n\nbacktrack(0, [])\nprint(out)"],
["Graph — BFS on a grid","grid = [[0,0,1,0],[1,0,1,0],[0,0,0,0],[0,1,1,0]]\nfrom collections import deque\nq = deque([(0, 0, 0)])\nseen = {(0, 0)}\nR, C = len(grid), len(grid[0])\nans = -1\nwhile q:\n    r, c, d = q.popleft()\n    if r == R - 1 and c == C - 1:\n        ans = d\n        break\n    for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):\n        nr, nc = r + dr, c + dc\n        if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] == 0 and (nr, nc) not in seen:\n            seen.add((nr, nc))\n            q.append((nr, nc, d + 1))\nprint('shortest path', ans)"],
["Hashing — frequency map","words = ['eat','tea','tan','ate','nat','bat']\ngroups = {}\nfor w in words:\n    key = ''.join(sorted(w))\n    if key not in groups:\n        groups[key] = []\n    groups[key].append(w)\nprint(list(groups.values()))"],
["Monotonic stack — next greater","a = [2, 1, 2, 4, 3, 1]\nstack = []\nout = [-1] * len(a)\nfor i in range(len(a)):\n    while stack and a[stack[-1]] < a[i]:\n        out[stack.pop()] = a[i]\n    stack.append(i)\nprint(out)"],
["Bubble sort — watch it swap","a = [5, 2, 9, 1, 7, 3]\nn = len(a)\nfor i in range(n):\n    for j in range(n - i - 1):\n        if a[j] > a[j + 1]:\n            a[j], a[j + 1] = a[j + 1], a[j]\nprint(a)"]
];

export const CXSAMPLES=[
["Linear scan — should measure O(n)","def solve(a):\n    best = 0\n    for v in a:\n        if v > best:\n            best = v\n    return best"],
["Sorting — should measure O(n log n)","def solve(a):\n    return sorted(a)[len(a) // 2]"],
["Nested loop — should measure O(n²)","def solve(a):\n    count = 0\n    for i in range(len(a)):\n        for j in range(i + 1, len(a)):\n            if a[i] > a[j]:\n                count += 1\n    return count"],
["The hidden O(n²) — pop(0)  ⚠","def solve(a):\n    # looks linear. it is not.\n    q = list(a)\n    total = 0\n    while q:\n        total += q.pop(0)     # O(n) every single time\n    return total"],
["The hidden O(n²) — 'in' on a list  ⚠","def solve(a):\n    seen = []                 # should be a set\n    out = 0\n    for v in a:\n        if v not in seen:     # O(n) scan each iteration\n            seen.append(v)\n            out += 1\n    return out"],
["The hidden O(n²) — list concat  ⚠","def solve(a):\n    out = []\n    for v in a:\n        out = out + [v]       # rebuilds the list every time\n    return len(out)           # out.append(v) would be O(1)"],
["The hidden O(n²) — insert(0, v)  ⚠","def solve(a):\n    out = []\n    for v in a:\n        out.insert(0, v)      # shifts everything, every time\n    return len(out)           # a deque appendleft is O(1)"],
["Surprise: s += c is NOT quadratic  ★","def solve(a):\n    # textbooks say this is O(n^2). CPython optimises it\n    # in place when the string has one reference, so it\n    # measures LINEAR. Java's String += really is quadratic.\n    s = ''\n    for v in a:\n        s += str(v % 10)\n    return len(s)"],
["Binary search — should measure O(log n)","def solve(a):\n    a = sorted(a)\n    target = a[len(a) // 3]\n    lo, hi = 0, len(a)\n    while lo < hi:\n        mid = lo + (hi - lo) // 2\n        if a[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid\n    return lo"]
];


export function initVisualiser(): void {
var  frames: any = [], cur=0, timer: any = null, playing=false;
  var pick="", pickAuto: any = null, srcLines: any = [], flagEls: any = {};

  var sel=$("#vzSample");
  SAMPLES.forEach(function(s,i){ var o=document.createElement("option"); o.value=String(i); o.textContent=s[0]; sel.appendChild(o); });
  sel.onchange=function(){ if((this as any).value!==""){ $("#vzCode").value=SAMPLES[+(this as any).value][1]; } };
  $("#vzCode").value=SAMPLES[0][1];
  $("#vzLimit").oninput=function(){ $("#vzLimitL").textContent=(this as any).value; };

  $$("#vzModes .subtab").forEach(function(b){
    b.onclick=function(){
      $$("#vzModes .subtab").forEach(function(x){x.classList.remove("on");});
      b.classList.add("on");
      $("#vzTraceMode").style.display = b.dataset.m==="trace" ? "" : "none";
      $("#vzCxMode").style.display    = b.dataset.m==="cx"    ? "" : "none";
      $("#vzStMode").style.display    = b.dataset.m==="st"    ? "" : "none";
    };
  });

  function status(msg: string, cls?: string){ var el=$("#vzStatus"); el.className="vzstatus"+(cls?" "+cls:""); el.innerHTML=msg; }

  /* ---------- structure rendering ---------- */
  function renderStage(name: any, val: any, prev?: any){
    var st=$("#vzStage");
    if(!val){ st.innerHTML="<div class='subtle'>no structure selected</div>"; $("#vzArrName").textContent=""; return; }

    if(val.k==="g"){                                    // 2D grid / DP table
      var h="<div class='trackwrap'><div class='gridview'>";
      var w=0; val.v.forEach(function(r){ w=Math.max(w,r.length); });
      h+="<div class='gr'><div class='ghead'></div>";
      for(var c=0;c<w;c++) h+="<div class='ghead'>"+c+"</div>";
      h+="</div>";
      val.v.forEach(function(row,ri){
        h+="<div class='gr'><div class='ghead'>"+ri+"</div>";
        row.forEach(function(cell,ci){
          var chg = prev && prev.k==="g" && prev.v[ri] && prev.v[ri][ci]!==cell;
          var nz = cell!=="0";
          h+="<div class='gcell"+(nz?" nz":"")+(chg?" chg":"")+"' title='["+ri+"]["+ci+"] = "+esc(cell)+"'>"+esc(cell)+"</div>";
        });
        h+="</div>";
      });
      st.innerHTML=h+"</div></div>";
      $("#vzArrName").textContent="2D table · "+name+" · "+val.d;
      return;
    }
    if(val.k==="l"){                                    // 1D list + pointers
      var CW=46,CG=6,STEP=CW+CG;
      var f=frames[cur];
      var  ptrs: any = {};
      Object.keys(f.vars).forEach(function(k){
        if(k===name) return;
        var v=f.vars[k];
        if(v.k==="n" && typeof v.n==="number" && v.n===Math.floor(v.n) && v.n>=0 && v.n<val.v.length) ptrs[k]=v.n;
      });
      var names=Object.keys(ptrs);
      var fh="", th="";
      names.forEach(function(k,i){
        fh+="<div class='flag f"+(i%4)+"' style='left:"+(ptrs[k]*STEP)+"px'>"+esc(k)+"</div>";
      });
      val.v.forEach(function(cell,i){
        var chg = prev && prev.k==="l" && prev.v[i]!==cell;
        var pi=names.filter(function(k){return ptrs[k]===i;});
        var cls="cell"+(chg?" chg":"")+(pi.length?" p"+(names.indexOf(pi[0])%4):"");
        th+="<div class='"+cls+"' style='left:"+(i*STEP)+"px'>"+esc(cell)+"</div>"
          + "<div class='idx' style='left:"+(i*STEP)+"px'>"+i+"</div>";
      });
      var wpx=(val.v.length*STEP);
      st.innerHTML="<div class='trackwrap'><div class='flags' style='width:"+wpx+"px'>"+fh+"</div>"
                 + "<div class='track' style='width:"+wpx+"px'>"+th+"</div></div>";
      $("#vzArrName").textContent="list · "+name+" · "+val.len+" items"+(names.length?"  ·  pointers: "+names.join(", "):"");
      return;
    }
    if(val.k==="m"||val.k==="e"){                       // dict / set
      var ch="<div class='chips'>";
      if(val.k==="m") val.v.forEach(function(kv){
        var chg=!prev||prev.k!=="m"||!prev.v.some(function(p){return p[0]===kv[0]&&p[1]===kv[1];});
        ch+="<span class='chip"+(chg?" chg":"")+"'><b>"+esc(kv[0])+"</b> → "+esc(kv[1])+"</span>";
      });
      else val.v.forEach(function(x){
        var chg=!prev||prev.k!=="e"||prev.v.indexOf(x)<0;
        ch+="<span class='chip"+(chg?" chg":"")+"'>"+esc(x)+"</span>";
      });
      st.innerHTML=ch+"</div>";
      $("#vzArrName").textContent=(val.k==="m"?"dict · ":"set · ")+name+" · "+val.len+" entries";
      return;
    }
    st.innerHTML="<div class='subtle'>"+esc(val.d)+"</div>";
    $("#vzArrName").textContent=String(name);
  }

  function autoPick(){
    var  score: any = {};
    frames.forEach(function(f){
      Object.keys(f.vars).forEach(function(k){
        var v=f.vars[k];
        if(v.k==="g") score[k]=(score[k]||0)+1000;
        else if(v.k==="l" && v.len>=2) score[k]=(score[k]||0)+v.len;
        else if(v.k==="m"||v.k==="e") score[k]=(score[k]||0)+2;
      });
    });
    var  best: any = null,bv=-1;
    Object.keys(score).forEach(function(k){ if(score[k]>bv){bv=score[k];best=k;} });
    return best;
  }
  function fillPicker(){
    var  seen: any = {};
    frames.forEach(function(f){ Object.keys(f.vars).forEach(function(k){
      var v=f.vars[k];
      if(v.k==="l"||v.k==="g"||v.k==="m"||v.k==="e") seen[k]=v.k;
    });});
    var s=$("#vzPick");
    s.innerHTML="<option value=''>auto</option>"+Object.keys(seen).map(function(k){
      return "<option value='"+esc(k)+"'>"+esc(k)+"  ("+({l:"list",g:"grid",m:"dict",e:"set"})[seen[k]]+")</option>";
    }).join("");
    s.value=pick;
  }

  function applyFrame(){
    var f=frames[cur]; if(!f) return;
    var name = pick || pickAuto;
    var val  = name ? f.vars[name] : null;
    var prev = (cur>0 && name) ? frames[cur-1].vars[name] : null;
    renderStage(name,val,prev);

    // counters
    var mut=0, prevList: any = null;
    for(var i=1;i<=cur;i++){
      var a=frames[i-1].vars[name], b=frames[i].vars[name];
      if(a&&b&&a.k===b.k&&(a.k==="l"||a.k==="g") && JSON.stringify(a.v)!==JSON.stringify(b.v)) mut++;
    }
    $("#vzCounters").innerHTML=
       "<div class='stat c1'><div class='k'>step</div><div class='v'>"+(cur+1)+"</div></div>"
      +"<div class='stat c3'><div class='k'>calls so far</div><div class='v'>"+f.calls+"</div></div>"
      +"<div class='stat c2'><div class='k'>stack depth</div><div class='v'>"+f.depth+"</div></div>"
      +"<div class='stat c4'><div class='k'>writes</div><div class='v'>"+mut+"</div></div>";

    // variables (skip the staged one)
    var cls=["c1","c3","c2","c4"], j=0, vh="";
    Object.keys(f.vars).forEach(function(k){
      if(k===name) return;
      vh+="<div class='stat "+cls[j++%4]+"'><div class='k'>"+esc(k)+"</div><div class='v' title='"+esc(f.vars[k].d)+"'>"+esc(f.vars[k].d)+"</div></div>";
    });
    $("#vzVars").innerHTML=vh;

    // call stack
    if(f.stack && f.stack.length>1){
      $("#vzStackWrap").style.display="";
      $("#vzStack").innerHTML=f.stack.map(function(s,i){
        return "<div class='frame"+(i===f.stack.length-1?" cur":"")+"'><s>"+i+"</s>"+esc(s)+"</div>";
      }).join("");
    } else { $("#vzStackWrap").style.display="none"; }

    $$("#vzLines .cl").forEach(function(l,i){ l.classList.toggle("hot", i===f.line); });
    var hot=$("#vzLines .cl.hot");
    if(hot && hot.scrollIntoView) try{ hot.scrollIntoView({block:"nearest"}); }catch(e: any){}
    $("#vzFrame").textContent=String((cur+1)+" / "+frames.length);
    $("#vzScrub").style.width=((cur+1)/frames.length*100)+"%";
  }

  function stop(){ playing=false; clearInterval(timer); $("#vzPlay").textContent="▶ play"; $("#vzPlay").classList.remove("on"); }
  function go(d: number){ if(!frames.length) return; cur=Math.max(0,Math.min(frames.length-1,cur+d)); applyFrame(); if(cur>=frames.length-1) stop(); }
  function play(){
    if(!frames.length) return;
    if(playing){ stop(); return; }
    if(cur>=frames.length-1){ cur=0; applyFrame(); }
    playing=true; $("#vzPlay").textContent="❚❚ pause"; $("#vzPlay").classList.add("on");
    timer=setInterval(function(){ if(cur>=frames.length-1){ stop(); return; } go(1); }, Math.max(16,620-(Number($("#vzSpeed").value)*60)));
  }
  function jumpToLine(ln: number){
    for(var i=cur+1;i<frames.length;i++) if(frames[i].line===ln){ cur=i; applyFrame(); return true; }
    for(var j=0;j<frames.length;j++) if(frames[j].line===ln){ cur=j; applyFrame(); return true; }
    return false;
  }
  function stepOut(){
    if(!frames.length) return;
    var d=frames[cur].depth;
    for(var i=cur+1;i<frames.length;i++) if(frames[i].depth<d){ stop(); cur=i; applyFrame(); return; }
    stop(); cur=frames.length-1; applyFrame();
  }

  async function run(){
    stop();
    var src=$("#vzCode").value;
    if(!src.trim()){ status("Nothing to trace — paste some Python first.","err"); return; }
    $("#vzRun").disabled=true;
    try{
      var py=await getPyodide(status);
      status("Tracing…");
      py.globals.set("_SRC", src);
      await py.runPythonAsync(traceHarness(+$("#vzLimit").value));
      var res=JSON.parse(py.globals.get("_RESULT"));

      srcLines=src.split("\n");
      $("#vzLines").innerHTML=srcLines.map(function(l,i){
        return "<span class='cl' data-ln='"+i+"'>"+(hl(l,"py")||" ")+"</span>";
      }).join("");
      $$("#vzLines .cl").forEach(function(el){
        el.onclick=function(){ stop(); if(!jumpToLine(+el.dataset.ln!)) status("That line never executed.","err"); };
      });

      frames=res.frames||[]; cur=0;
      pickAuto=autoPick(); pick=""; fillPicker();

      if(res.out){ $("#vzOut").style.display=""; $("#vzOut").textContent=res.out; }
      else $("#vzOut").style.display="none";

      if(!frames.length){
        status(res.err ? ("Nothing ran — "+esc(res.err)) : "No executable lines were traced.","err");
      } else {
        applyFrame();
        var extra = res.maxdepth>1 ? " · max recursion depth <b>"+res.maxdepth+"</b> · <b>"+res.calls+"</b> calls" : "";
        if(res.err) status("Traced <b>"+frames.length+"</b> steps, then raised: <b>"+esc(res.err)+"</b>"+extra,"err");
        else status("Traced <b>"+frames.length+"</b> steps"+extra+". Space plays · arrows step · click a source line to jump there.","ok");
      }
      /* whiteboard mode scores this: did it run first try? */
      window.dispatchEvent(new CustomEvent("pb:traced", {detail:{err: res.err}}));
    }catch(e: any){
      var m=e.message||String(e);
      if(m.indexOf("__HELP__")===0) status(pyodideHelp(JSON.parse(m.slice(8))),"err");
      else status("<b>"+esc(m)+"</b>","err");
    }finally{ $("#vzRun").disabled=false; }
  }

  $("#vzRun").onclick=run;
  $("#vzPick").onchange=function(){ pick=(this as any).value; applyFrame(); };
  $("#vzClear").onclick=function(){
    stop(); frames=[]; cur=0; pick=""; pickAuto=null;
    $("#vzCode").value=""; $("#vzLines").innerHTML=""; $("#vzStage").innerHTML="";
    $("#vzVars").innerHTML=""; $("#vzCounters").innerHTML=""; $("#vzOut").style.display="none";
    $("#vzStackWrap").style.display="none"; $("#vzFrame").textContent="0 / 0";
    $("#vzScrub").style.width="0"; $("#vzArrName").textContent="";
    status("Cleared.");
  };
  $("#vzPlay").onclick=play;
  $("#vzNext").onclick=function(){ stop(); go(1); };
  $("#vzPrev").onclick=function(){ stop(); go(-1); };
  $("#vzOut2").onclick=stepOut;
  $("#vzReset").onclick=function(){ stop(); cur=0; applyFrame(); };
  $("#vzSpeed").oninput=function(){ if(playing){ stop(); play(); } };
  $("#vzScrubBar").onclick=function(e){
    if(!frames.length) return;
    stop();
    var r=(this as any).getBoundingClientRect();
    cur=Math.max(0,Math.min(frames.length-1,Math.round((e.clientX-r.left)/r.width*(frames.length-1))));
    applyFrame();
  };
  $("#vzCode").addEventListener("keydown",function(e){
    if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){ e.preventDefault(); run(); }
    if(e.key==="Tab"){ e.preventDefault();
      var s=(this as any).selectionStart;
      (this as any).value=(this as any).value.slice(0,s)+"    "+(this as any).value.slice((this as any).selectionEnd);
      (this as any).selectionStart=(this as any).selectionEnd=s+4;
    }
  });
  document.addEventListener("keydown",function(e){
    if(!$("#v-viz").classList.contains("on")) return;
    if($("#vzTraceMode").style.display==="none") return;
    var tag=(((e.target as HTMLElement | null)?.tagName)||"").toLowerCase();
    if(tag==="textarea"||tag==="input"||tag==="select") return;
    if(e.key===" "){ e.preventDefault(); play(); }
    else if(e.key==="ArrowRight"){ e.preventDefault(); stop(); go(1); }
    else if(e.key==="ArrowLeft"){ e.preventDefault(); stop(); go(-1); }
    else if(e.key==="r"||e.key==="R"){ stop(); cur=0; applyFrame(); }
  });

  /* ---------- complexity analyser ---------- */
  var csel=$("#cxSample");
  CXSAMPLES.forEach(function(s,i){ var o=document.createElement("option"); o.value=String(i); o.textContent=s[0]; csel.appendChild(o); });
  csel.onchange=function(){ if((this as any).value!==""){ $("#cxCode").value=CXSAMPLES[+(this as any).value][1]; } };
  $("#cxCode").value=CXSAMPLES[0][1];

  var MODELS: [string, (n:number)=>number][] = [
    ["O(1)",       function(n){return 1;}],
    ["O(log n)",   function(n){return Math.log2(n);}],
    ["O(n)",       function(n){return n;}],
    ["O(n log n)", function(n){return n*Math.log2(n);}],
    ["O(n²)",      function(n){return n*n;}],
    ["O(n³)",      function(n){return n*n*n;}]
  ];
  function fitModels(pts: any[]){
    return MODELS.map(function(m){
      var ds=pts.map(function(p){ return Math.log(p[1]) - Math.log(m[1](p[0])); });
      var mean=ds.reduce(function(a,b){return a+b;},0)/ds.length;
      var rms=Math.sqrt(ds.reduce(function(a,b){return a+(b-mean)*(b-mean);},0)/ds.length);
      return {name:m[0],rms:rms,c:Math.exp(mean),f:m[1]};
    }).sort(function(a,b){return a.rms-b.rms;});
  }
  function slope(pts: any[]){
    var xs=pts.map(function(p){return Math.log(p[0]);}), ys=pts.map(function(p){return Math.log(p[1]);});
    var mx=xs.reduce(function(a,b){return a+b;},0)/xs.length, my=ys.reduce(function(a,b){return a+b;},0)/ys.length;
    var num=0,den=0;
    for(var i=0;i<xs.length;i++){ num+=(xs[i]-mx)*(ys[i]-my); den+=(xs[i]-mx)*(xs[i]-mx); }
    return den? num/den : 0;
  }
  function drawCx(pts: any[], best?: any){
    var c=$<HTMLCanvasElement>("#cxChart"), dpr=window.devicePixelRatio||1;
    var W=c.width=c.offsetWidth*dpr, H=c.height=260*dpr, g=c.getContext("2d")!;
    g.clearRect(0,0,W,H);
    if(!pts.length) return;
    var pad=40*dpr;
    var xs=pts.map(function(p){return Math.log2(p[0]);}), ys=pts.map(function(p){return Math.log2(p[1]);});
    var x0=Math.min.apply(null,xs)-.4, x1=Math.max.apply(null,xs)+.4;
    var y0=Math.min.apply(null,ys)-.6, y1=Math.max.apply(null,ys)+.6;
    function X(v){ return pad+(v-x0)/(x1-x0)*(W-pad*1.3); }
    function Y(v){ return H-pad-(v-y0)/(y1-y0)*(H-pad*1.5); }
    g.strokeStyle="#221F3A"; g.lineWidth=1;
    g.font=(9.5*dpr)+"px JetBrains Mono, monospace"; g.fillStyle="#544E7A";
    pts.forEach(function(p){ var x=X(Math.log2(p[0]));
      g.beginPath(); g.moveTo(x,pad*.4); g.lineTo(x,H-pad); g.stroke();
      g.fillText("n="+p[0], x-12*dpr, H-pad+14*dpr);
    });
    // reference models
    var refs: [string,(n:number)=>number,string][] = [["O(n)",function(n){return n;},"#8FA3FF"],["O(n log n)",function(n){return n*Math.log2(n);},"#FFB627"],["O(n²)",function(n){return n*n;},"#FF3D9A"]];
    refs.forEach(function(r){
      var k=pts[0][1]/r[1](pts[0][0]);
      g.strokeStyle=r[2]; g.globalAlpha=.32; g.lineWidth=1.4*dpr;
      g.beginPath();
      pts.forEach(function(p,i){ var x=X(Math.log2(p[0])), y=Y(Math.log2(k*r[1](p[0]))); if(i)g.lineTo(x,y); else g.moveTo(x,y); });
      g.stroke(); g.globalAlpha=1;
    });
    // best fit
    if(best){
      g.strokeStyle="#5BFFA5"; g.lineWidth=2.4*dpr; g.setLineDash([5*dpr,4*dpr]);
      g.beginPath();
      pts.forEach(function(p,i){ var x=X(Math.log2(p[0])), y=Y(Math.log2(best.c*best.f(p[0]))); if(i)g.lineTo(x,y); else g.moveTo(x,y); });
      g.stroke(); g.setLineDash([]);
    }
    // measured
    g.strokeStyle="#38E8FF"; g.lineWidth=2.6*dpr; g.beginPath();
    pts.forEach(function(p,i){ var x=X(Math.log2(p[0])), y=Y(Math.log2(p[1])); if(i)g.lineTo(x,y); else g.moveTo(x,y); });
    g.stroke();
    g.fillStyle="#38E8FF";
    pts.forEach(function(p){ var x=X(Math.log2(p[0])), y=Y(Math.log2(p[1])); g.beginPath(); g.arc(x,y,4*dpr,0,7); g.fill(); });
    g.font=(10*dpr)+"px JetBrains Mono, monospace";
    g.fillText("measured time (log₂)", pad, 16*dpr);
  }

  async function runCx(){
    var src=$("#cxCode").value;
    if(!/def\s+solve\s*\(/.test(src)){
      $("#cxStatus").className="vzstatus err";
      $("#cxStatus").innerHTML="Your code must define <code>def solve(a):</code> — that is the function that gets measured.";
      return;
    }
    $("#cxRun").disabled=true;
    var st=$("#cxStatus");
    function sset(m: string, c?: string){ st.className="vzstatus"+(c?" "+c:""); st.innerHTML=m; }
    try{
      var py=await getPyodide(sset);
      sset("Timing your function at n = 400 … 12800, auto-repeating small sizes to beat the browser clock. A few seconds.");
      py.globals.set("_SRC", src);
      await py.runPythonAsync(cxHarness($("#cxGen").value,[400,800,1600,3200,6400,12800],3.0));
      var res=JSON.parse(py.globals.get("_RESULT"));
      if(res.err){ sset("<b>"+esc(res.err)+"</b>","err"); $("#cxRun").disabled=false; return; }
      var pts=res.pts.filter(function(p){return p[1]>0;});
      if(pts.length<3){ sset("Not enough data points — the function may be too slow or return immediately.","err"); $("#cxRun").disabled=false; return; }

      var fits=fitModels(pts), best=fits[0], sl=slope(pts);
      drawCx(pts,best);

      var conf = best.rms<0.12 ? "strong" : best.rms<0.3 ? "reasonable" : "weak";
      $("#cxVerdict").innerHTML=
        "<div style='font-family:var(--mono);font-size:10px;letter-spacing:.2em;color:var(--dim);text-transform:uppercase'>measured complexity</div>"
       +"<div style='font-size:34px;font-weight:700;letter-spacing:-.02em;color:var(--lime);line-height:1.15'>"+best.name+"</div>"
       +"<div style='color:var(--dim);font-size:13px;margin-top:6px'>Empirical exponent from the log–log slope: <b style='color:var(--cyan)'>"+sl.toFixed(2)+"</b>"
       +" · fit quality <b style='color:"+(conf==="strong"?"var(--lime)":conf==="reasonable"?"var(--amb)":"var(--mag)")+"'>"+conf+"</b>"
       +" (residual "+best.rms.toFixed(3)+")</div>"
       +"<div style='color:var(--dim);font-size:12.5px;margin-top:10px'>Runner-up: "+fits[1].name+" (residual "+fits[1].rms.toFixed(3)+")"
       +(Math.abs(fits[1].rms-best.rms)<0.05?" — <b style='color:var(--amb)'>too close to call; extend the sizes to separate them</b>":"")+"</div>";

      var rows="<tr><th>n</th><th>time per call</th><th>ratio vs previous</th><th>doubling behaviour</th></tr>";
      pts.forEach(function(p,i){
        var r = i? p[1]/pts[i-1][1] : null;
        var note = r===null ? "—" : r<1.3 ? "flat → logarithmic" : r<2.4 ? "×2 → linear" : r<3.2 ? "×2.2–3 → n log n" : r<5 ? "×4 → quadratic" : "×8+ → cubic or worse";
        var ms=p[1]*1000; rows+="<tr><td><code>"+p[0]+"</code></td><td>"+(ms<1?(ms*1000).toFixed(1)+" µs":ms.toFixed(2)+" ms")+"</td><td>"+(r?r.toFixed(2)+"×":"—")+"</td><td style='color:var(--dim)'>"+note+"</td></tr>";
      });
      $("#cxTable").innerHTML=rows;
      sset("Measured "+pts.length+" sizes by <b>wall clock</b>, so cost hidden inside C builtins counts too. The <b>doubling ratio</b> is the intuition: when n doubles, linear code doubles its time, quadratic code quadruples it.","ok");
    }catch(e: any){
      var m=e.message||String(e);
      if(m.indexOf("__HELP__")===0) sset(pyodideHelp(JSON.parse(m.slice(8))),"err");
      else sset("<b>"+esc(m)+"</b>","err");
    }finally{ $("#cxRun").disabled=false; }
  }
  $("#cxRun").onclick=runCx;

  /* ---------- stress tester ---------- */
  var ssel=$("#stSample");
  STRESS_SAMPLES.forEach(function(sm,i){
    var o=document.createElement("option"); o.value=String(i); o.textContent=sm[0]; ssel.appendChild(o);
  });
  ssel.onchange=function(){ if((this as any).value!==""){ $("#stCode").value=STRESS_SAMPLES[+(this as any).value]![1]; } };
  $("#stCode").value=STRESS_SAMPLES[0]![1];
  $("#stTrials").oninput=function(){ $("#stTrialsL").textContent=String((this as any).value); };

  async function runStress(){
    var st=$("#stStatus");
    function sset(m: string, c?: string){ st.className="vzstatus"+(c?" "+c:""); st.innerHTML=m; }
    $("#stRun").disabled=true;
    try{
      var py=await getPyodide(sset);
      sset("Running up to <b>"+$("#stTrials").value+"</b> trials, then shrinking any failure to its smallest form…");
      py.globals.set("_SRC", $("#stCode").value);
      await py.runPythonAsync(stressHarness($("#stTrials").value));
      var r: StressResult = JSON.parse(py.globals.get("_RESULT"));

      if(r.err){ sset("<b>"+esc(r.err)+"</b>","err"); $("#stOut").innerHTML=""; $("#stRun").disabled=false; return; }

      if(!r.found){
        sset("No disagreement in <b>"+r.trials+"</b> trials.","ok");
        $("#stOut").innerHTML="<div class='say'><b>They agree on every generated input.</b> That is evidence, not proof — "
          + "widen <code>gen</code> (bigger n, wider value range, more duplicates, negatives) and run it again. "
          + "Most bugs hide in a shape the generator never produced.</div>";
        $("#stRun").disabled=false; return;
      }

      sset("Disagreement at trial <b>"+r.trials+"</b>, shrunk in <b>"+r.shrinks+"</b> steps.","err");
      $("#stOut").innerHTML =
          "<div class='ce'><div class='cel'>minimal failing input</div>"
        + "<div class='cev'>"+esc(r.minimal||"")+"</div></div>"
        + "<div class='cmp'>"
        +   "<div><div class='k'>brute says</div><div class='v' style='color:var(--lime)'>"+esc(r.expected||"")+"</div></div>"
        +   "<div><div class='k'>fast says</div><div class='v' style='color:var(--mag)'>"+esc(r.got||"")+"</div></div>"
        + "</div>"
        + "<div class='shrinkbar'>found on <b>"+esc(String(r.raw||""))+"</b> → shrunk to <b>"+esc(r.minimal||"")+"</b></div>"
        + "<div class='btnrow' style='margin-top:14px'><button class='btn on' id='stTrace'>trace the minimal case →</button></div>";

      var tb=document.getElementById("stTrace");
      if(tb) (tb as any).onclick=function(){
        $("#vzCode").value=r.repro||"";
        $$("#vzModes .subtab").forEach(function(x){x.classList.remove("on");});
        $$("#vzModes .subtab")[0]!.classList.add("on");
        $("#vzTraceMode").style.display=""; $("#vzCxMode").style.display="none"; $("#vzStMode").style.display="none";
        try{ window.scrollTo(0,0); }catch(e){}
      };
    }catch(e: any){
      var m=e.message||String(e);
      if(m.indexOf("__HELP__")===0) sset(pyodideHelp(JSON.parse(m.slice(8))),"err");
      else sset("<b>"+esc(m)+"</b>","err");
    }finally{ $("#stRun").disabled=false; }
  }
  $("#stRun").onclick=runStress;

  /* ---------- whiteboard mode ----------
     Google writes in a shared doc; Meta disables execution in CoderPad. Neither
     gives you a compiler. This hides the output panel and the run button until you
     commit, then reports whether it worked FIRST TRY - the number those rounds
     actually measure. */
  var wbOn=false, wbStart=0, wbTimer: any=null;
  function wbStats(): any { return (store<any>("wb") || {tries:0, first:0}); }
  function wbPanel(){
    var s2=wbStats();
    var rate = s2.tries ? Math.round(s2.first/s2.tries*100) : 0;
    var el = Date.now()-wbStart;
    var mins = wbOn ? Math.floor(el/60000) : 0;
    var secs = wbOn ? Math.floor(el/1000)%60 : 0;
    return "<div class='wbpanel'>"
      + "<div class='wbt'>"+(wbOn ? (mins+":"+(secs<10?"0":"")+secs) : "—")+"</div>"
      + "<div class='wbm'>No highlighting, no output, no run button. Write the whole solution, "
      + "then reveal. If it does not run first try, that is exactly the failure a Google or Meta "
      + "round is built to catch — better to find it here.</div>"
      + "<div class='wbstat'>"
      +   "<div><div class='k'>attempts</div><div class='v' style='color:var(--cyan)'>"+s2.tries+"</div></div>"
      +   "<div><div class='k'>ran first try</div><div class='v' style='color:"+(rate>=60?"var(--lime)":rate>=30?"var(--amb)":"var(--mag)")+"'>"+rate+"%</div></div>"
      + "</div></div>";
  }
  function wbRender(){
    var host=document.getElementById("vzWbPanel");
    if(host) host.innerHTML = wbOn ? wbPanel() : "";
  }
  $("#vzWb").onclick=function(){
    wbOn=!wbOn;
    document.body.classList.toggle("wb", wbOn);
    $("#vzWb").classList.toggle("on", wbOn);
    $("#vzRun").textContent = wbOn ? "▶ reveal & run" : "▶ trace it";
    if(wbOn){
      wbStart=Date.now();
      var stage=document.getElementById("vzStage");
      if(stage && !document.getElementById("vzWbPanel")){
        var d=document.createElement("div"); d.id="vzWbPanel";
        stage.parentNode!.insertBefore(d, stage);
      }
      wbTimer=setInterval(wbRender, 1000);
    } else {
      clearInterval(wbTimer);
    }
    wbRender();
  };
  window.addEventListener("pb:traced", function(ev: any){
    if(!wbOn) return;
    var s3=wbStats();
    s3.tries++; if(!ev.detail || !ev.detail.err) s3.first++;
    store("wb", s3);
    wbOn=false; clearInterval(wbTimer);
    document.body.classList.remove("wb");
    $("#vzWb").classList.remove("on");
    $("#vzRun").textContent="▶ trace it";
    wbRender();
  });
}
