/* Ported from the verified single-file build. Behaviour unchanged; this is a
   lighter-touch port than the playbook — one module rather than six, because
   none of it is shared with the other page. */
export function initMemoryEngine(): void {


var CSSN=function(v,d){ var s=getComputedStyle(document.documentElement).getPropertyValue(v); var n=parseInt(s,10); return isNaN(n)?d:n; };
var CW=CSSN("--cw",52), CG=CSSN("--cg",6), STEP=CW+CG;
var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var $: any = function(s: string){ return document.querySelector(s); };
var $$: any = function(s: string){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
function sleep(ms){ return new Promise(function(r){ setTimeout(r, RM?0:ms); }); }
function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

/* =====================================================================
   HERO — self-sorting bar field
   ===================================================================== */
(function(){
  var t = $("#title"), e = $("#eyebrow");
  "MEMORY".split("").forEach(function(ch,i){
    var s=document.createElement("span");
    s.className="l g"; s.textContent=ch; s.style.animationDelay=(i*0.07+0.15)+"s";
    t.appendChild(s);
  });
  var txt="DSA // PART 01 — SEQUENCE CONTAINERS";
  txt.split("").forEach(function(ch,i){
    var s=document.createElement("span");
    s.textContent = ch===" " ? "\u00A0" : ch;
    s.style.animationDelay=(i*0.018)+"s";
    e.appendChild(s);
  });

  var c = $("#heroCanvas"), x = c.getContext("2d"), N=110, vals: any = [], disp: any = [], i=1, j=1, sorting=true;
  function reset(){
    vals=[]; for(var k=0;k<N;k++) vals.push(k+1);
    for(var k2=vals.length-1;k2>0;k2--){ var r=Math.floor(Math.random()*(k2+1)); var tmp=vals[k2]; vals[k2]=vals[r]; vals[r]=tmp; }
    disp = vals.slice(); i=1; j=1; sorting=true;
  }
  function fit(){ c.width=c.offsetWidth*devicePixelRatio; c.height=c.offsetHeight*devicePixelRatio; }
  reset(); fit(); addEventListener("resize", fit);

  var last=0, onScreen=true, scheduled=false;
  function tickable(){ return onScreen && !document.hidden; }
  function kick(){ if(scheduled || !tickable()) return; scheduled=true; requestAnimationFrame(loop); }
  function loop(ts){
    scheduled=false;
    if(!tickable()) return;          /* off-screen or backgrounded: stop burning battery */
    kick();
    if(!RM && ts-last>26){
      last=ts;
      for(var s=0;s<3;s++){
        if(!sorting) break;
        if(i>=N){ sorting=false; setTimeout(reset, 2600); break; }
        if(j>0 && vals[j-1]>vals[j]){ var tp=vals[j]; vals[j]=vals[j-1]; vals[j-1]=tp; j--; }
        else { i++; j=i; }
      }
    }
    for(var k=0;k<N;k++) disp[k] += (vals[k]-disp[k])*0.18;
    var W=c.width, H=c.height, bw=W/N;
    x.clearRect(0,0,W,H);
    for(var k3=0;k3<N;k3++){
      var h=(disp[k3]/N)*H*0.72;
      var hue = 178 + (disp[k3]/N)*150;
      x.fillStyle="hsla("+hue+",92%,62%,"+(0.10+(disp[k3]/N)*0.42)+")";
      x.fillRect(k3*bw, H-h, bw*0.62, h);
    }
    x.fillStyle="rgba(7,6,13,0.55)"; x.fillRect(0,0,W,H*0.42);
  }
  if(window.IntersectionObserver){
    new IntersectionObserver(function(e){ onScreen=e[0].isIntersecting; kick(); },{threshold:0}).observe(c);
  }
  document.addEventListener("visibilitychange", kick);
  kick();
})();

/* reveal on scroll */
(function(){
  var io=new IntersectionObserver(function(en){
    en.forEach(function(x){ if(x.isIntersecting){ x.target.classList.add("in"); io.unobserve(x.target);} });
  },{threshold:0.06});
  document.querySelectorAll(".reveal").forEach(function(n){ io.observe(n); });
})();

/* =====================================================================
   MODULE 01 — MEMORY ENGINE
   ===================================================================== */
(function(){
  var slots=$("#engSlots"), busy=false;
  var  arr: any = [], cap=0, reallocs=0, copies=0, costs: any = [];
  var GROW={f:2,key:"2"};
  var gen=0;                       /* bumped on reset; aborts in-flight animations */
  function stale(g){ return g!==gen; }
  function nextCap(cur,need){
    /* CPython list_resize: (newsize + (newsize >> 3) + 6) & ~3  -> 4,8,16,24,32,40,52,64... */
    if(GROW.key==="cpy") return (need + (need>>3) + 6) & ~3;
    if(cur===0) return 1;                        /* first allocation */
    return Math.max(cur+1, Math.floor(cur*GROW.f));
  }
  var  slotEls: any = [], cellEls: any = [];
  var chart=$("#costChart"), cx=chart.getContext("2d");

  function stat(id: string, v: any, flash?: boolean){
    var el=$(id); el.textContent=v;
    if(flash){ el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
  }
  function refreshStats(f?: boolean){
    stat("#sSize", arr.length, false); stat("#sCap", cap, false);
    stat("#sRe",reallocs,f); stat("#sCopy",copies,f);
    var pushes=costs.length;
    stat("#sAvg", pushes ? (costs.reduce(function(a,b){return a+b;},0)/pushes).toFixed(2) : "—");
  }
  function render(){
    while(slotEls.length<cap){ var s=document.createElement("div"); s.className="slot"; slots.appendChild(s); slotEls.push(s); }
    while(slotEls.length>cap){ slots.removeChild(slotEls.pop()); }
    slotEls.forEach(function(s,i){ s.style.left=(i*STEP)+"px"; });
    while(cellEls.length<arr.length){
      var d=document.createElement("div"); d.className="cell new"; slots.appendChild(d); cellEls.push(d);
    }
    while(cellEls.length>arr.length){ var g=cellEls.pop(); if(g.parentNode) slots.removeChild(g); }
    cellEls.forEach(function(d,i){ d.style.left=(i*STEP)+"px"; d.textContent=arr[i]; });
    refreshStats(false);
  }
  function drawChart(){
    var W=chart.width=chart.offsetWidth*devicePixelRatio, H=chart.height=240*devicePixelRatio;
    cx.clearRect(0,0,W,H);
    var pad=8*devicePixelRatio;
    if(!costs.length){
      cx.fillStyle="#544E7A"; cx.font=(12*devicePixelRatio)+"px JetBrains Mono, monospace";
      cx.fillText("push_back() to begin recording", pad, H/2); return;
    }
    var n=costs.length, maxC=Math.max.apply(null,costs), bw=Math.max(1,(W-pad*2)/n);
    var run=0, avg: any = [];
    for(var i=0;i<n;i++){ run+=costs[i]; avg.push(run/(i+1)); }
    // grid
    cx.strokeStyle="#221F3A"; cx.lineWidth=1;
    for(var g=0;g<=4;g++){ var y=pad+(H-pad*2)*g/4; cx.beginPath(); cx.moveTo(pad,y); cx.lineTo(W-pad,y); cx.stroke(); }
    // bars
    for(var k=0;k<n;k++){
      var h=(costs[k]/maxC)*(H-pad*2.5);
      cx.fillStyle = costs[k]>1 ? "rgba(255,61,154,.85)" : "rgba(91,255,165,.6)";
      cx.fillRect(pad+k*bw, H-pad-h, Math.max(1,bw*0.78), h);
    }
    // running average
    cx.strokeStyle="#38E8FF"; cx.lineWidth=2*devicePixelRatio; cx.beginPath();
    for(var m=0;m<n;m++){
      var ay=H-pad-(avg[m]/maxC)*(H-pad*2.5);
      if(m===0) cx.moveTo(pad+bw*0.4,ay); else cx.lineTo(pad+m*bw+bw*0.4,ay);
    }
    cx.stroke();
    cx.fillStyle="#38E8FF"; cx.font=(11*devicePixelRatio)+"px JetBrains Mono, monospace";
    cx.fillText("running average → "+(avg[n-1]).toFixed(2), pad+4, pad+14*devicePixelRatio);
    cx.fillStyle="#FF3D9A";
    cx.fillText("peak cost "+maxC, pad+4, pad+30*devicePixelRatio);
  }

  var nextVal=1;
  async function grow(g?: number){
    var newCap = nextCap(cap, arr.length+1);
    reallocs++; copies += arr.length;
    // stagger-copy animation
    for(var i=0;i<cellEls.length;i++){
      cellEls[i].classList.add("copying");
      if(i%3===0) await sleep(26);
    }
    if(stale(g)) return false;
    await sleep(210);
    if(stale(g)) return false;
    cap=newCap; render();
    await sleep(120);
    if(stale(g)) return false;
    cellEls.forEach(function(d){ d.classList.remove("copying"); });
    refreshStats(true);
    return true;
  }
  async function push(silent){
    if(busy) return; busy=true;
    var g=gen, cost=1;
    if(arr.length===cap){ cost = arr.length+1; if(!(await grow(g))){ busy=false; return; } }
    if(stale(g)){ busy=false; return; }
    arr.push(nextVal++); costs.push(cost); render(); drawChart();
    if(!silent) await sleep(120);
    busy=false;
  }
  async function pop(){
    if(busy||!arr.length) return; busy=true;
    var g=gen, last=cellEls[cellEls.length-1]; last.classList.add("dying");
    await sleep(260);
    if(stale(g)){ busy=false; return; }
    arr.pop(); render(); busy=false;
  }
  async function insertFront(){
    if(busy) return; busy=true;
    var g=gen;
    if(arr.length===cap){ if(!(await grow(g))){ busy=false; return; } }
    if(stale(g)){ busy=false; return; }
    arr.unshift(nextVal++);
    // rebuild so DOM order matches, then flash the shift
    render();
    cellEls.forEach(function(d,i){ if(i>0){ d.classList.add("act"); } });
    await sleep(430);
    if(stale(g)){ busy=false; return; }
    cellEls.forEach(function(d){ d.classList.remove("act"); });
    busy=false;
  }
  async function eraseMid(){
    if(busy||!arr.length) return; busy=true;
    var g=gen, i=Math.floor(arr.length/2);
    cellEls[i].classList.add("dying");
    for(var k=i+1;k<cellEls.length;k++) cellEls[k].classList.add("act");
    await sleep(320);
    if(stale(g)){ busy=false; return; }
    arr.splice(i,1); render();
    await sleep(300);
    if(stale(g)){ busy=false; return; }
    cellEls.forEach(function(d){ d.classList.remove("act"); });
    busy=false;
  }
  async function reserve(){
    if(busy) return; busy=true;
    if(cap>=32){ busy=false; return; }
    var g=gen;
    copies += arr.length; reallocs++;
    cellEls.forEach(function(d){ d.classList.add("copying"); });
    await sleep(300);
    if(stale(g)){ busy=false; return; }
    cap=32; render(); await sleep(140);
    if(stale(g)){ busy=false; return; }
    cellEls.forEach(function(d){ d.classList.remove("copying"); });
    refreshStats(true); busy=false;
  }

  /* The widget models three languages, so it must SPEAK three languages. Showing
   * push_back() while "CPython list" is selected teaches vocabulary that does not
   * exist in the language the user just chose. Keys match data-eng. */
  var OPS: any = {
    "2": {  // libstdc++ / libc++  -> std::vector
      push:"push_back(x)", pop:"pop_back()", front:"insert(begin(), x)",
      erase:"erase(begin()+mid)", reserve:"reserve(32)", x10:"push_back ×10", reset:"clear()",
    },
    "1.5": { // MSVC / Java ArrayList
      push:"add(x)", pop:"remove(size()-1)", front:"add(0, x)",
      erase:"remove(mid)", reserve:"ensureCapacity(32)", x10:"add ×10", reset:"clear()",
    },
    "cpy": { // CPython list
      push:"append(x)", pop:"pop()", front:"insert(0, x)",
      erase:"del a[mid]", reserve:"(no reserve — CPython grows on demand)", x10:"append ×10", reset:"a.clear()",
    },
  };
  function relabelOps(){
    var m = OPS[GROW.key] || OPS["2"];
    $$("[data-eng]").forEach(function(b){
      var k = b.dataset.eng!;
      if (m[k]) b.textContent = m[k];
    });
  }

  function reset(){
    gen++; busy=false;                 /* cancel anything mid-flight */
    arr=[]; cap=0; reallocs=0; copies=0; costs=[]; nextVal=1;
    cellEls.forEach(function(d){ if(d.parentNode) slots.removeChild(d); }); cellEls=[];
    slotEls.forEach(function(s){ if(s.parentNode) slots.removeChild(s); }); slotEls=[];
    render(); drawChart();
  }

  $$("[data-eng]").forEach(function(b){
    b.addEventListener("click", async function(){
      var a=b.dataset.eng!;
      if(a==="push") push(false);
      else if(a==="pop") pop();
      else if(a==="front") insertFront();
      else if(a==="erase") eraseMid();
      else if(a==="reserve") reserve();
      else if(a==="reset") reset();
      else if(a==="x10"){ var g=gen; for(var i=0;i<10;i++){ if(stale(g)) break; await push(true); await sleep(RM?0:70);} }
    });
  });
  $$("[data-grow]").forEach(function(b){
    b.addEventListener("click", async function(){
      var k=b.dataset.grow!;
      /* Replay the same number of appends under the new factor rather than clearing.
       * The section copy promises "switch models and watch the spikes rearrange", and
       * you cannot compare two growth curves if changing the model empties the chart.
       * Rebuilding to the same n is what makes the comparison meaningful. */
      var n = arr.length || 5;
      GROW={f: k==="cpy" ? 0 : parseFloat(k), key:k};
      $$("[data-grow]").forEach(function(x){ x.classList.remove("on"); });
      b.classList.add("on");
      relabelOps();
      reset();
      var g=gen;
      for(var i=0;i<n;i++){ if(stale(g)) return; await push(true); }
    });
  });
  relabelOps();
  reset();
  addEventListener("resize", drawChart);
  // seed a few so it isn't empty
  (async function(){ await sleep(600); for(var i=0;i<5;i++){ await push(true); await sleep(150);} })();
})();

/* =====================================================================
   MODULE 02 — PATTERN LAB
   ===================================================================== */
(function(){
  var track=$("#labTrack"), flagWrap=$("#labFlags"), band=$("#labBand");
  var codePane=$("#codePane"), varPane=$("#varPane"), narr=$("#narr");
  var  frames: any = [], cur=0, timer: any = null, playing=false, cells: any = [], idxs: any = [], flags: any = {};

  function snap(o,a){ o.arr=a.slice(); return o; }

  /* ---------- generators ---------- */
  function genTwo(a){
    var  F: any = [], lo=0, hi=a.length-1;
    if(a.length<2){
      return [snap({ptrs:{},line:0,vars:{target:"\u2014",sum:"\u2014"},
        note:"Two pointers needs at least two elements. With n < 2 there is no pair to find \u2014 and an interviewer will ask you what your code does here."},a)];
    }
    var target=a[1]+a[a.length-2];
    F.push(snap({ptrs:{lo:lo,hi:hi},line:0,vars:{target:target,sum:"—"},note:"Array is sorted. Looking for two values summing to "+target+"."},a));
    while(lo<hi){
      var s=a[lo]+a[hi];
      F.push(snap({ptrs:{lo:lo,hi:hi},line:2,marks:mk([[lo,"act"],[hi,"act"]]),vars:{target:target,sum:s},note:"a["+lo+"] + a["+hi+"] = "+a[lo]+" + "+a[hi]+" = "+s},a));
      if(s===target){
        F.push(snap({ptrs:{lo:lo,hi:hi},line:3,marks:mk([[lo,"ok"],[hi,"ok"]]),vars:{target:target,sum:s},note:"Found the pair. Total work: O(n) — each pointer moved forward only."},a));
        return F;
      }
      if(s<target){
        F.push(snap({ptrs:{lo:lo,hi:hi},line:4,marks:mk([[lo,"bad"]]),vars:{target:target,sum:s},note:s+" < "+target+". We need a bigger sum, and a[hi] is already the largest available — so only lo++ can help. Discard a[lo] forever."},a));
        lo++;
      } else {
        F.push(snap({ptrs:{lo:lo,hi:hi},line:5,marks:mk([[hi,"bad"]]),vars:{target:target,sum:s},note:s+" > "+target+". We need a smaller sum, and a[lo] is already the smallest — so only hi-- can help."},a));
        hi--;
      }
    }
    F.push(snap({ptrs:{lo:lo,hi:hi},line:6,vars:{target:target,sum:"—"},note:"Pointers crossed. No such pair exists."},a));
    return F;
  }
  function mk(pairs){ var  o: any = {}; pairs.forEach(function(p){ o[p[0]]=p[1]; }); return o; }

  function genWindow(a){
    var  F: any = [], seen: any = {}, left=0, best=0, bestL=0, bestR=0;
    F.push(snap({ptrs:{left:0,right:0},line:1,vars:{left:0,right:0,best:0},band:[0,0],note:"Find the longest run with no repeated character. Two pointers, both only ever move right."},a));
    for(var right=0; right<a.length; right++){
      var ch=a[right];
      F.push(snap({ptrs:{left:left,right:right},line:2,marks:mk([[right,"act"]]),vars:{left:left,right:right,best:best},band:[left,right],note:"Expand: right → "+right+", reading '"+ch+"'."},a));
      if(seen[ch]!==undefined && seen[ch]>=left){
        var nl=seen[ch]+1;
        F.push(snap({ptrs:{left:left,right:right},line:3,marks:mk([[right,"bad"],[seen[ch],"bad"]]),vars:{left:left,right:right,best:best},band:[left,right],note:"'"+ch+"' already sits inside the window at index "+seen[ch]+". The window is invalid."},a));
        left=nl;
        F.push(snap({ptrs:{left:left,right:right},line:4,vars:{left:left,right:right,best:best},band:[left,right],note:"Jump left straight to "+left+" — never scan backwards. This is why the whole thing stays O(n)."},a));
      }
      seen[ch]=right;
      var len=right-left+1;
      if(len>best){ best=len; bestL=left; bestR=right;
        F.push(snap({ptrs:{left:left,right:right},line:6,vars:{left:left,right:right,best:best},band:[left,right],note:"New best window: length "+best+"."},a));
      }
    }
    var  m: any = {}; for(var q=bestL;q<=bestR;q++) m[q]="ok";
    F.push(snap({ptrs:{left:bestL,right:bestR},line:7,marks:m,vars:{left:bestL,right:bestR,best:best},band:[bestL,bestR],note:"Answer: "+best+". Each index entered and left the window once → 2n moves → O(n)."},a));
    return F;
  }

  function genBinary(a){
    var  F: any = [], lo=0, hi=a.length, target=a[Math.floor(a.length*0.6)];
    function dead(l,h){ var  o: any = {}; for(var i=0;i<a.length;i++) if(i<l||i>=h) o[i]="dead"; return o; }
    F.push(snap({ptrs:{lo:lo,hi:hi},line:0,vars:{target:target,lo:lo,hi:hi},note:"lower_bound: find the FIRST index where a[i] >= "+target+". hi is exclusive."},a));
    while(lo<hi){
      var mid=lo+Math.floor((hi-lo)/2);
      var m=dead(lo,hi); m[mid]="act";
      F.push(snap({ptrs:{lo:lo,mid:mid,hi:hi},line:2,marks:m,vars:{target:target,lo:lo,mid:mid,hi:hi},note:"mid = "+mid+", a[mid] = "+a[mid]+". Note lo + (hi-lo)/2 — never (lo+hi)/2, which overflows."},a));
      if(a[mid]<target){
        var m2=dead(lo,hi); m2[mid]="bad";
        F.push(snap({ptrs:{lo:lo,mid:mid,hi:hi},line:4,marks:m2,vars:{target:target,lo:lo,mid:mid,hi:hi},note:a[mid]+" < "+target+" → mid is definitely too small. Discard everything up to and including it."},a));
        lo=mid+1;
      } else {
        var m3=dead(lo,hi); m3[mid]="ok";
        F.push(snap({ptrs:{lo:lo,mid:mid,hi:hi},line:6,marks:m3,vars:{target:target,lo:lo,mid:mid,hi:hi},note:a[mid]+" >= "+target+" → mid might BE the answer. Keep it: hi = mid, not mid-1."},a));
        hi=mid;
      }
    }
    var  fm: any = {}; fm[lo]="ok";
    F.push(snap({ptrs:{lo:lo},line:7,marks:fm,vars:{target:target,lo:lo,hi:hi},note:"lo == hi == "+lo+". That is the answer, and also the insertion point. Halving "+a.length+" elements took only "+Math.ceil(Math.log2(a.length))+" probes."},a));
    return F;
  }

  function genDutch(a){
    a=a.slice();
    var  F: any = [], lo=0, mid=0, hi=a.length-1;
    function zm(){ var  o: any = {}; for(var i=0;i<a.length;i++){ if(i<lo) o[i]="z0"; else if(i<mid) o[i]="z1"; else if(i>hi) o[i]="z2"; } return o; }
    F.push(snap({ptrs:{lo:lo,mid:mid,hi:hi},line:0,vars:{lo:lo,mid:mid,hi:hi},note:"Sort 0s, 1s and 2s in ONE pass, in place, O(1) extra space. Four regions, three pointers."},a));
    var guard=0;
    while(mid<=hi && guard++<200){
      var m=zm(); m[mid]="act";
      F.push(snap({ptrs:{lo:lo,mid:mid,hi:hi},line:1,marks:m,vars:{lo:lo,mid:mid,hi:hi},note:"Inspect a[mid] = "+a[mid]+". Invariant: [0,lo) is all 0s · [lo,mid) is all 1s · (hi,end] is all 2s."},a));
      if(a[mid]===0){
        var t=a[lo]; a[lo]=a[mid]; a[mid]=t; lo++; mid++;
        F.push(snap({ptrs:{lo:lo,mid:mid,hi:hi},line:3,marks:zm(),vars:{lo:lo,mid:mid,hi:hi},note:"It's a 0 → swap into the 0-region and advance BOTH lo and mid. The swapped-in value came from the 1-region, so it's safe."},a));
      } else if(a[mid]===1){
        mid++;
        F.push(snap({ptrs:{lo:lo,mid:mid,hi:hi},line:5,marks:zm(),vars:{lo:lo,mid:mid,hi:hi},note:"It's a 1 → already in the right place. Just advance mid."},a));
      } else {
        var t2=a[hi]; a[hi]=a[mid]; a[mid]=t2; hi--;
        F.push(snap({ptrs:{lo:lo,mid:mid,hi:hi},line:7,marks:zm(),vars:{lo:lo,mid:mid,hi:hi},note:"It's a 2 → swap to the back and DON'T advance mid. The value we just pulled in is unexamined. This single detail is what people get wrong."},a));
      }
    }
    var  fin: any = {}; for(var i=0;i<a.length;i++) fin[i]= a[i]===0?"z0":a[i]===1?"z1":"z2";
    F.push(snap({ptrs:{},line:8,marks:fin,vars:{lo:lo,mid:mid,hi:hi},note:"Done. Every element was touched at most twice → O(n), zero extra memory."},a));
    return F;
  }

  function genKadane(a){
    var  F: any = [], best=a[0], curv=a[0], st=0, bl=0, br=0;
    F.push(snap({ptrs:{i:0},line:0,marks:mk([[0,"act"]]),vars:{cur:curv,best:best},band:[0,0],note:"Largest sum of a contiguous subarray. The trick: at each index, only track the best subarray ENDING here — that's O(1) state."},a));
    for(var i=1;i<a.length;i++){
      var ext=curv+a[i];
      if(a[i]>ext){ curv=a[i]; st=i;
        F.push(snap({ptrs:{i:i},line:2,marks:mk([[i,"bad"]]),vars:{cur:curv,best:best},band:[st,i],note:"a["+i+"]="+a[i]+" beats extending ("+ext+"). The running sum had gone negative — it was dead weight. RESTART here."},a));
      } else { curv=ext;
        F.push(snap({ptrs:{i:i},line:2,marks:mk([[i,"act"]]),vars:{cur:curv,best:best},band:[st,i],note:"Extending is better: cur = "+curv+". Keep the run alive."},a));
      }
      if(curv>best){ best=curv; bl=st; br=i;
        F.push(snap({ptrs:{i:i},line:3,marks:mk([[i,"ok"]]),vars:{cur:curv,best:best},band:[st,i],note:"New maximum: "+best+"."},a));
      }
    }
    var  m: any = {}; for(var q=bl;q<=br;q++) m[q]="ok";
    F.push(snap({ptrs:{},line:4,marks:m,vars:{cur:curv,best:best},band:[bl,br],note:"Answer "+best+" over indices "+bl+".."+br+". One pass, O(n), O(1) memory. Careful: initialising best to 0 breaks on all-negative arrays."},a));
    return F;
  }

  /* ---------- algorithm registry ---------- */
  function rnd(n,lo,hi){ var  a: any = []; for(var i=0;i<n;i++) a.push(lo+Math.floor(Math.random()*(hi-lo+1))); return a; }
  var ALGOS=[
    { id:"two", name:"Two pointers", gen:genTwo,
      data:function(){ return rnd(11,1,40).sort(function(x,y){return x-y;}); },
      blurb:"<b>Signal:</b> the array is sorted and you need a pair (or triplet) meeting a condition. <b>Why it works:</b> sortedness makes the sum move monotonically, so a pointer never has to backtrack. Turns the naive O(n²) double loop into O(n).",
      code:["lo, hi = 0, len(a) - 1",
            "while lo &lt; hi:",
            "    s = a[lo] + a[hi]",
            "    if s == target: return (lo, hi)",
            "    if s &lt; target:  lo += 1   <span class='cm'># only lo can raise the sum</span>",
            "    else:           hi -= 1   <span class='cm'># only hi can lower it</span>",
            "return None"] },
    { id:"win", name:"Sliding window", gen:genWindow,
      data:function(){ var s="abcabcbbadcefgfabc".split(""); return s.slice(0,14); },
      blurb:"<b>Signal:</b> \"longest / shortest / count of <em>contiguous</em> subarrays with property P\". <b>Why it works:</b> both pointers only move forward, so despite the nested loop the total work is 2n → O(n).",
      code:["seen = {}          <span class='cm'># char -&gt; last index seen</span>",
            "left = best = 0",
            "for right, ch in enumerate(s):",
            "    if ch in seen and seen[ch] &gt;= left:",
            "        left = seen[ch] + 1     <span class='cm'># jump, never rewind</span>",
            "    seen[ch] = right",
            "    best = max(best, right - left + 1)",
            "return best"] },
    { id:"bin", name:"Binary search", gen:genBinary,
      data:function(){ var a=rnd(16,1,60).sort(function(x,y){return x-y;}); return a; },
      blurb:"<b>Signal:</b> sorted data, or a monotone predicate over an answer space. This exact skeleton — <code>lo &lt; hi</code>, <code>hi = mid</code>, <code>lo = mid + 1</code>, return <code>lo</code> — never produces an off-by-one and never infinite-loops. Use it verbatim, every time.",
      code:["lo, hi = 0, len(a)        <span class='cm'># hi is EXCLUSIVE</span>",
            "while lo &lt; hi:",
            "    mid = lo + (hi - lo) // 2",
            "    if a[mid] &lt; target:",
            "        lo = mid + 1         <span class='cm'># mid too small, discard it</span>",
            "    else:",
            "        hi = mid             <span class='cm'># mid might be the answer</span>",
            "return lo                    <span class='cm'># first i with a[i] &gt;= target</span>"] },
    { id:"dnf", name:"Dutch flag", gen:genDutch,
      data:function(){ return rnd(14,0,2); },
      blurb:"<b>Signal:</b> \"rearrange in place\", \"O(1) extra space\", three categories. <b>Why it works:</b> you maintain <em>region boundaries</em> as invariants rather than sorting. One pass, O(n), no extra memory.",
      code:["lo = mid = 0; hi = len(a) - 1",
            "while mid &lt;= hi:",
            "    if a[mid] == 0:",
            "        a[lo], a[mid] = a[mid], a[lo]; lo += 1; mid += 1",
            "    elif a[mid] == 1:",
            "        mid += 1",
            "    else:",
            "        a[mid], a[hi] = a[hi], a[mid]; hi -= 1   <span class='cm'># mid stays!</span>",
            "<span class='cm'># [0,lo)=0s  [lo,mid)=1s  (hi,end]=2s  [mid,hi]=unknown</span>"] },
    { id:"kad", name:"Kadane", gen:genKadane,
      data:function(){ return rnd(13,-9,9); },
      blurb:"<b>Signal:</b> optimal <em>contiguous</em> subarray. <b>Why it works:</b> the best subarray ending at index i is either just a[i], or the best one ending at i-1 extended. That's O(1) state per index — a one-line DP.",
      code:["best = cur = a[0]",
            "for i in range(1, len(a)):",
            "    cur  = max(a[i], cur + a[i])   <span class='cm'># restart, or extend</span>",
            "    best = max(best, cur)",
            "return best"] }
  ];
  var active=ALGOS[0], data: any = null;

  /* ---------- rendering ---------- */
  function buildTrack(a){
    cells.forEach(function(c){ c.remove(); }); idxs.forEach(function(c){ c.remove(); });
    Object.keys(flags).forEach(function(k){ flags[k].remove(); }); flags={};
    cells=[]; idxs=[];
    a.forEach(function(v,i){
      var d=document.createElement("div"); d.className="cell"; d.style.left=(i*STEP)+"px"; d.textContent=v;
      track.appendChild(d); cells.push(d);
      var n=document.createElement("div"); n.className="idx"; n.style.left=(i*STEP)+"px"; n.textContent=i;
      track.appendChild(n); idxs.push(n);
    });
    track.style.width=(a.length*STEP)+"px";
  }
  function applyFrame(f){
    f.arr.forEach(function(v,i){ if(cells[i]) cells[i].textContent=v; });
    cells.forEach(function(c,i){
      c.className="cell"+(f.marks&&f.marks[i]?" "+f.marks[i]:"");
    });
    var names=Object.keys(f.ptrs||{});
    names.forEach(function(nm,k){
      if(!flags[nm]){ var el=document.createElement("div"); el.className="flag f"+(k%4); el.textContent=nm; flagWrap.appendChild(el); flags[nm]=el; }
      flags[nm].style.opacity="1";
      flags[nm].style.left=(Math.min(Math.max(f.ptrs[nm],0),f.arr.length-1)*STEP)+"px";
    });
    Object.keys(flags).forEach(function(nm){ if(names.indexOf(nm)<0) flags[nm].style.opacity="0.12"; });
    if(f.band){ band.style.opacity="1"; band.style.left=(f.band[0]*STEP)+"px"; band.style.width=((f.band[1]-f.band[0]+1)*STEP-CG)+"px"; }
    else band.style.opacity="0";
    document.querySelectorAll("#codePane .cl").forEach(function(l,i){ l.classList.toggle("hot", i===f.line); });
    syncVars(f.vars||{});
    narr.innerHTML="<span class='step'>frame "+(cur+1)+" · line "+(f.line+1)+"</span>"+f.note;
    narr.classList.remove("pulse"); void narr.offsetWidth; narr.classList.add("pulse");
    $("#frameNo").textContent=String((cur+1)+" / "+frames.length);
    $("#scrubFill").style.width=((cur+1)/frames.length*100)+"%";
  }
  /* build the stat cells once per key-set, then only touch textContent */
  var  varCells: any = {}, varSig: any = null;
  function syncVars(vars){
    var keys=Object.keys(vars), sig=keys.join("\u0001");
    if(sig!==varSig){
      varPane.innerHTML=""; varCells={};
      var cls=["c1","c3","c2","c4"];
      keys.forEach(function(k,i){
        var d=document.createElement("div"); d.className="stat "+cls[i%4];
        var kk=document.createElement("div"); kk.className="k"; kk.textContent=k;
        var vv=document.createElement("div"); vv.className="v";
        d.appendChild(kk); d.appendChild(vv); varPane.appendChild(d);
        varCells[k]=vv;
      });
      varSig=sig;
    }
    keys.forEach(function(k){
      var t=String(vars[k]);
      if(varCells[k] && varCells[k].textContent!==t) varCells[k].textContent=t;
    });
  }

  function load(algo, newData){
    active=algo;
    if(newData||!data) data=algo.data();
    $("#algoBlurb").innerHTML=algo.blurb;
    codePane.innerHTML=algo.code.map(function(l){ return "<span class='cl'>"+l+"</span>"; }).join("");
    frames=algo.gen(data); cur=0;
    buildTrack(frames[0].arr);
    applyFrame(frames[0]);
  }
  function go(d){
    cur=Math.min(Math.max(cur+d,0),frames.length-1);
    applyFrame(frames[cur]);
    if(cur>=frames.length-1) stop();
  }
  function stop(){ playing=false; clearInterval(timer); $("#tPlay").textContent="▶ play"; $("#tPlay").classList.remove("on"); }
  function play(){
    if(playing){ stop(); return; }
    if(cur>=frames.length-1){ cur=0; applyFrame(frames[0]); }
    playing=true; $("#tPlay").textContent="❚❚ pause"; $("#tPlay").classList.add("on");
    var ms=1250-($("#tSpeed").value*115);
    timer=setInterval(function(){ if(cur>=frames.length-1){ stop(); return; } go(1); }, ms);
  }
  $("#tPlay").onclick=play;
  $("#tNext").onclick=function(){ stop(); go(1); };
  $("#tPrev").onclick=function(){ stop(); go(-1); };
  $("#tReset").onclick=function(){ stop(); cur=0; applyFrame(frames[0]); };
  $("#tShuffle").onclick=function(){ stop(); $("#labData").value=""; load(active,true); };

  /* ---- custom data + edge cases ---- */
  function coerceFor(algo, arr){
    var a=arr.slice(0,26);
    if(algo.id==="win") return a.map(String);
    a=a.map(function(v){ return typeof v==="number" ? v : (String(v).charCodeAt(0)%10); });
    if(algo.id==="dnf") a=a.map(function(v){ return ((v%3)+3)%3; });
    if(algo.id==="two"||algo.id==="bin") a.sort(function(x,y){ return x-y; });
    return a;
  }
  function applyData(arr, why){
    var a=coerceFor(active, arr);
    if(!a.length) return;
    stop(); data=a; load(active,false);
    if(why) narr.innerHTML += "<div style='margin-top:10px;color:var(--amb)'>"+why+"</div>";
  }
  function parseInput(raw){
    var toks=String(raw).split(/[\s,]+/).filter(Boolean);
    if(!toks.length) return null;
    if(toks.every(function(t){ return /^-?\d+$/.test(t); })) return toks.map(Number);
    return String(raw).replace(/[\s,]+/g,"").split("");
  }
  $("#tApply").onclick=function(){
    var a=parseInput($("#labData").value);
    if(!a){ narr.innerHTML="<span class='step'>no input</span>Type some numbers (<code>3, 1, 4</code>) or letters (<code>abcabc</code>), then hit run."; return; }
    var note="Running your input. ";
    if(active.id==="two"||active.id==="bin") note+="Sorted first \u2014 this template requires it.";
    else if(active.id==="dnf") note+="Values folded into {0,1,2} \u2014 that is what this template partitions.";
    else if(active.id==="win") note+="Treated as characters.";
    else note+="Used as-is.";
    applyData(a, note);
  };
  $("#labData").addEventListener("keydown",function(e){ if(e.key==="Enter") $("#tApply").click(); });

  var EDGE={
    one:   {num:[7],                            chr:["a"],                        why:"<b>n = 1.</b> Does the loop body ever run? Does it read index 1?"},
    two:   {num:[3,9],                          chr:["a","a"],                    why:"<b>n = 2.</b> The smallest case where pointers can cross. Off-by-ones surface here."},
    same:  {num:[7,7,7,7,7,7,7,7],              chr:["a","a","a","a","a","a"],    why:"<b>All equal.</b> Every comparison ties \u2014 this is where &lt; versus &lt;= silently changes the answer."},
    sorted:{num:[1,3,5,8,12,15,19,24,30,41],    chr:"abcdefghij".split(""),        why:"<b>Already sorted.</b> Best case for search, worst case for anything that assumed disorder."},
    rev:   {num:[41,30,24,19,15,12,8,5,3,1],    chr:"jihgfedcba".split(""),        why:"<b>Reverse sorted.</b> The classic worst case \u2014 maximum swaps, maximum shifts."},
    neg:   {num:[-4,-9,-2,-7,-1,-8,-3],         chr:"zyxwvu".split(""),            why:"<b>All negative.</b> Kadane seeded with 0 returns 0 here instead of -1. This single case fails more submissions than any other."}
  };
  $$("[data-edge]").forEach(function(b){
    b.addEventListener("click",function(){
      var e=EDGE[b.dataset.edge!];
      $("#labData").value="";
      applyData(active.id==="win" ? e.chr : e.num, e.why);
    });
  });

  /* ---- keyboard transport ---- */
  var labVisible=true;
  (function(){
    var lab=document.getElementById("lab");
    if(lab && window.IntersectionObserver){
      new IntersectionObserver(function(e){ labVisible=e[0].isIntersecting; },{threshold:0}).observe(lab);
    }
  })();
  document.addEventListener("keydown",function(e){
    var tag=(((e.target as HTMLElement | null)?.tagName)||"").toLowerCase();
    if(tag==="input"||tag==="textarea"||tag==="select") return;
    if(!labVisible) return;                    /* only while the lab is on screen */
    if(e.key===" "){ e.preventDefault(); play(); }
    else if(e.key==="ArrowRight"){ e.preventDefault(); stop(); go(1); }
    else if(e.key==="ArrowLeft"){ e.preventDefault(); stop(); go(-1); }
    else if(e.key==="r"||e.key==="R"){ stop(); cur=0; applyFrame(frames[0]); }
    else if(/^[1-5]$/.test(e.key)){
      var t=$$("#tabs .tab")[+e.key-1];
      if(t) t.click();
    }
  });
  $("#tSpeed").oninput=function(){ if(playing){ clearInterval(timer); playing=false; play(); } };

  var tabs=$("#tabs");
  ALGOS.forEach(function(al,i){
    var b=document.createElement("button"); b.className="tab"+(i===0?" on":""); b.textContent=al.name;
    b.onclick=function(){
      stop();
      document.querySelectorAll(".tab").forEach(function(t){ t.classList.remove("on"); });
      b.classList.add("on"); data=null; load(al,true);
    };
    tabs.appendChild(b);
  });
  load(ALGOS[0],true);
})();

/* =====================================================================
   MODULE 03 — COMPLEXITY
   ===================================================================== */
(function(){
  var gc=$("#growthChart"), g=gc.getContext("2d");
  var FN=[
    {n:"O(1)",       c:"#5BFFA5", f:function(n){ return 0; }},
    {n:"O(log n)",   c:"#38E8FF", f:function(n){ return Math.log10(Math.max(1,Math.log2(n))); }},
    {n:"O(n)",       c:"#8FA3FF", f:function(n){ return Math.log10(n); }},
    {n:"O(n log n)", c:"#FFB627", f:function(n){ return Math.log10(n)+Math.log10(Math.max(1,Math.log2(n))); }},
    {n:"O(n²)",      c:"#FF7A5C", f:function(n){ return 2*Math.log10(n); }},
    {n:"O(2ⁿ)",      c:"#FF3D9A", f:function(n){ return n*Math.log10(2); }}
  ];
  var prog=0;
  function draw(){
    var W=gc.width=gc.offsetWidth*devicePixelRatio, H=gc.height=330*devicePixelRatio;
    var pad=34*devicePixelRatio, MAXY=22;
    g.clearRect(0,0,W,H);
    g.strokeStyle="#221F3A"; g.lineWidth=1; g.font=(9.5*devicePixelRatio)+"px JetBrains Mono, monospace"; g.fillStyle="#544E7A";
    for(var k=0;k<=MAXY;k+=4){
      var y=H-pad-(k/MAXY)*(H-pad*1.6);
      g.beginPath(); g.moveTo(pad,y); g.lineTo(W-pad*0.4,y); g.stroke();
      g.fillText("10^"+k, 2, y+3*devicePixelRatio);
    }
    var maxN=1000;
    FN.forEach(function(o,idx){
      g.strokeStyle=o.c; g.lineWidth=2.2*devicePixelRatio; g.beginPath();
      var lim=Math.floor(maxN*prog);
      for(var i=1;i<=lim;i++){
        var v=Math.min(o.f(i),MAXY);
        var x=pad+((i-1)/(maxN-1))*(W-pad*1.4);
        var y=H-pad-(v/MAXY)*(H-pad*1.6);
        if(i===1) g.moveTo(x,y); else g.lineTo(x,y);
      }
      g.stroke();
      if(lim>3){
        var vv=Math.min(o.f(lim),MAXY);
        var yy=H-pad-(vv/MAXY)*(H-pad*1.6);
        var xx=pad+((lim-1)/(maxN-1))*(W-pad*1.4);
        g.fillStyle=o.c; g.font=(10.5*devicePixelRatio)+"px JetBrains Mono, monospace";
        g.fillText(o.n, Math.min(xx+6*devicePixelRatio, W-70*devicePixelRatio), Math.max(yy, 14*devicePixelRatio));
      }
    });
    g.fillStyle="#544E7A"; g.font=(10*devicePixelRatio)+"px JetBrains Mono, monospace";
    g.fillText("n  (1 → 1000)", W/2-40*devicePixelRatio, H-8*devicePixelRatio);
    g.fillText("operations", 2, 12*devicePixelRatio);
  }
  function animate(){ if(prog<1){ prog=Math.min(1,prog+0.012); draw(); requestAnimationFrame(animate);} }
  var started=false;
  new IntersectionObserver(function(e){ if(e[0].isIntersecting && !started){ started=true; animate(); } },{threshold:.2}).observe(gc);
  draw(); addEventListener("resize",draw);

  /* runtime estimator */
  var ROWS=[
    {n:"O(1)",       l:function(n){ return 0; }},
    {n:"O(log n)",   l:function(n){ return Math.log10(Math.max(1,Math.log2(n))); }},
    {n:"O(√n)",      l:function(n){ return 0.5*Math.log10(n); }},
    {n:"O(n)",       l:function(n){ return Math.log10(n); }},
    {n:"O(n log n)", l:function(n){ return Math.log10(n)+Math.log10(Math.max(1,Math.log2(n))); }},
    {n:"O(n²)",      l:function(n){ return 2*Math.log10(n); }},
    {n:"O(n³)",      l:function(n){ return 3*Math.log10(n); }},
    {n:"O(2ⁿ)",      l:function(n){ return n*Math.log10(2); }},
    {n:"O(n!)",      l:function(n){ var x=n+1; return (x-0.5)*Math.log10(x)-x*0.4342944819+0.39908993; }}
  ];
  function fmt(s){
    if(s<-9) return "instant";
    if(s<-6) return Math.pow(10,s+9).toPrecision(3)+" ns";
    if(s<-3) return Math.pow(10,s+6).toPrecision(3)+" \u00B5s";
    if(s<0)  return Math.pow(10,s+3).toPrecision(3)+" ms";
    if(s<1.778) return Math.pow(10,s).toPrecision(3)+" s";
    if(s<3.556) return Math.pow(10,s-1.778).toPrecision(3)+" min";
    if(s<4.937) return Math.pow(10,s-3.556).toPrecision(3)+" hours";
    if(s<7.499) return Math.pow(10,s-4.937).toPrecision(3)+" days";
    if(s<18)    return Math.pow(10,s-7.499).toPrecision(3)+" years";
    return "10^"+Math.round(s-7.5)+" years";
  }
  function upd(){
    var sl=+$("#nSlide").value;
    var n=Math.max(2,Math.round(Math.pow(10, sl/90*9)));
    $("#nVal").textContent=n.toLocaleString();
    var html="";
    ROWS.forEach(function(r){
      var lops=r.l(n), lsec=lops-9;
      var col = lsec<-3 ? "var(--lime)" : lsec<0.3 ? "var(--amb)" : "var(--mag)";
      var w = Math.max(2, Math.min(100, (lops/20)*100));
      html+="<div style='margin-bottom:11px'>"
        + "<div style='display:flex;justify-content:space-between;font-family:var(--mono);font-size:11.5px'>"
        + "<span style='color:var(--txt)'>"+r.n+"</span><span style='color:"+col+"'>"+fmt(lsec)+"</span></div>"
        + "<div style='height:3px;background:var(--line);margin-top:5px'><i style='display:block;height:3px;width:"+w+"%;background:"+col+";transition:width .3s'></i></div>"
        + "</div>";
    });
    $("#timeRows").innerHTML=html;
  }
  /* ---- memory footprint: MLE is as real a failure as TLE ---- */
  var MEM=[
    {n:"O(1)",             b:function(n){ return 64; },        note:"a few scalars"},
    {n:"O(n) int32 array", b:function(n){ return 4*n; },       note:"C++ vector&lt;int&gt;, Java int[]"},
    {n:"O(n) int64 array", b:function(n){ return 8*n; },       note:"long long / long"},
    {n:"O(n) Python list", b:function(n){ return 8*n + 28*n; },note:"8B pointer + ~28B per boxed int"},
    {n:"O(n) hash map",    b:function(n){ return 60*n; },      note:"unordered_map / dict, ~3\u00D7 an array"},
    {n:"O(n\u00B2) table", b:function(n){ return 4*n*n; },     note:"a DP grid \u2014 the usual MLE"}
  ];
  var LIMIT=256*1024*1024;                     /* typical judge cap */
  function bytes(x){
    if(x<1024) return x.toFixed(0)+" B";
    if(x<1048576) return (x/1024).toFixed(1)+" KB";
    if(x<1073741824) return (x/1048576).toFixed(1)+" MB";
    if(x<1.1e15) return (x/1073741824).toFixed(1)+" GB";
    return (x/1.1e15).toFixed(1)+" PB";
  }
  function updMem(nv){
    var html="";
    MEM.forEach(function(r){
      var b=r.b(nv), over=b>LIMIT;
      var col = over ? "var(--mag)" : b>LIMIT/4 ? "var(--amb)" : "var(--lime)";
      html+="<div style='margin-bottom:10px'>"
        + "<div style='display:flex;justify-content:space-between;gap:10px;font-family:var(--mono);font-size:11.5px'>"
        + "<span style='color:var(--txt)'>"+r.n+"</span>"
        + "<span style='color:"+col+"'>"+bytes(b)+(over?"  \u2717 MLE":"")+"</span></div>"
        + "<div style='font-family:var(--disp);font-size:11px;color:var(--dim);margin-top:2px'>"+r.note+"</div>"
        + "</div>";
    });
    html+="<div style='font-family:var(--disp);font-size:12px;color:var(--dim);margin-top:14px;border-left:2px solid var(--line2);padding-left:11px;line-height:1.6'>"
      + "Assumes the usual <b style='color:var(--txt)'>256 MB</b> limit. Two things people learn the hard way: a Python list of ints costs roughly <b style='color:var(--txt)'>9\u00D7</b> a C++ <code>vector&lt;int&gt;</code>, and an n\u00D7n DP table blows past 256 MB at around <b style='color:var(--txt)'>n = 8000</b> \u2014 which is exactly why interviewers ask you to roll it to one row."
      + "</div>";
    $("#memRows").innerHTML=html;
  }
  var _upd=upd;
  var upd2=function(){ _upd(); updMem(Math.max(2,Math.round(Math.pow(10, (+$("#nSlide").value)/90*9)))); };
  $("#nSlide").oninput=upd2; upd2();
})();

/* =====================================================================
   MODULE 04 — REFERENCE
   ===================================================================== */
(function(){
  var O={one:"<span class='O O1'>O(1)</span>",am:"<span class='O O1'>O(1)*</span>",log:"<span class='O Ol'>O(log n)</span>",
         n:"<span class='O On'>O(n)</span>",k:"<span class='O On'>O(k)</span>",nl:"<span class='O Ob'>O(n log n)</span>",
         nk:"<span class='O Ol'>O(n log k)</span>",fact:"<span class='O Ob'>O(n!)</span>"};
  var R=[
   ["Append at end","a.append(x)",O.am,"v.push_back(x);\nv.emplace_back(a...);",O.am+" emplace constructs in place — no copy.","a.add(x);",O.am],
   ["Prepend","a.insert(0, x) — use deque!",O.n,"v.insert(v.begin(), x);",O.n,"a.add(0, x);",O.n],
   ["Pop from end","x = a.pop()",O.one,"x = v.back(); v.pop_back();",O.one+" pop_back returns void.","x = a.remove(a.size()-1);",O.one],
   ["Remove by index","del a[i]  ·  a.pop(i)",O.n,"v.erase(v.begin()+i);",O.n,"a.remove(i);",O.n+" int → INDEX."],
   ["Remove by value","a.remove(x) — first only",O.n,"erase(v, x);  // C++20, all\nv.erase(remove(b,e,x), e);",O.n+" the erase-remove idiom.","a.remove(Integer.valueOf(x));",O.n+" Integer → VALUE."],
   ["Remove all matching","a[:] = [x for x in a if keep(x)]",O.n,"erase_if(v, pred);",O.n,"a.removeIf(pred);",O.n],
   ["Concatenate","a.extend(b)  ·  a += b",O.k,"v.insert(v.end(), b.begin(), b.end());",O.k,"a.addAll(b);",O.k],
   ["Length","len(a)",O.one,"v.size();  v.capacity();",O.one+" size() is UNSIGNED.","a.size()  ·  arr.length",O.one],
   ["Sub-range","b = a[i:j]",O.n,"vector&lt;int&gt; b(v.begin()+i, v.begin()+j);",O.n,"a.subList(i, j)",O.one+" a live VIEW, not a copy."],
   ["Reverse","a.reverse()  ·  a[::-1]",O.n,"reverse(v.begin(), v.end());",O.n,"Collections.reverse(a);",O.n],
   ["Sort ascending","a.sort()",O.nl+" Timsort — stable.","sort(v.begin(), v.end());",O.nl+" introsort — NOT stable.","Collections.sort(a);",O.nl+" stable for objects."],
   ["Sort descending","a.sort(reverse=True)",O.nl,"sort(v.rbegin(), v.rend());",O.nl,"a.sort(Comparator.reverseOrder());",O.nl],
   ["Custom order","a.sort(key=lambda p: p[1])",O.nl+" key, not comparator — faster.","sort(b,e,[](auto&amp; x, auto&amp; y){\n  return x.f &lt; y.f; });",O.nl+" must be a STRICT weak ordering.","a.sort(Comparator.comparingInt(P::f));",O.nl+" never x.f - y.f (overflow)."],
   ["Multi-key sort","a.sort(key=lambda p: (p[0], -p[1]))",O.nl,"tie-break inside the lambda",O.nl,"comparingInt(..).thenComparing(..)",O.nl],
   ["Lower bound","bisect_left(a, x)",O.log,"lower_bound(v.begin(), v.end(), x);",O.log,"— write it manually",O.log+" Java has no lower_bound."],
   ["Upper bound","bisect_right(a, x)",O.log,"upper_bound(v.begin(), v.end(), x);",O.log,"— write it manually",O.log],
   ["Exact search (sorted)","i = bisect_left(a,x); a[i]==x",O.log,"binary_search(b, e, x);\nequal_range(b, e, x);",O.log,"Arrays.binarySearch(arr, x);",O.log+" not found → -(insertion+1)."],
   ["Top k","heapq.nlargest(k, a)",O.nk+" bounded heap — log k, not log n. That is the whole point.","nth_element(b, b+k, e);",O.n+" quickselect, linear average.","PriorityQueue bounded to k",O.nk+" min-heap for k-th LARGEST."],
   ["Deduplicate","list(dict.fromkeys(a))",O.n+" keeps order.","sort(); v.erase(unique(b,e), e);",O.nl+" unique only kills ADJACENT dups.","new ArrayList&lt;&gt;(new LinkedHashSet&lt;&gt;(a))",O.n],
   ["Rotate by k","a[:] = a[k:] + a[:k]",O.n,"rotate(v.begin(), v.begin()+k, v.end());",O.n+" in place, no extra memory.","Collections.rotate(a, -k);",O.n],
   ["Next permutation","— no stdlib equivalent, write it",O.n+" itertools.permutations() is NOT this — it yields all "+O.fact+" of them.","next_permutation(b, e);",O.n+" per step — sort first!","— implement manually",O.n],
   ["Prefix sums","list(accumulate(a))",O.n,"partial_sum(b, e, out);",O.n,"Arrays.parallelPrefix(arr, Integer::sum);",O.n],
   ["Sum (watch overflow)","sum(a)",O.n+" arbitrary precision — safe.","accumulate(b, e, 0LL);",O.n+" 0LL or it overflows.","Arrays.stream(a).asLongStream().sum();",O.n],
   ["2D grid n×m","[[0]*m for _ in range(n)]",O.n+" NEVER [[0]*m]*n","vector&lt;vector&lt;int&gt;&gt; g(n, vector&lt;int&gt;(m));",O.n,"int[][] g = new int[n][m];",O.n],
   ["Pre-allocate","[0]*n  then  a[i] = …",O.n+" NOT a reserve(). This sets SIZE to n — appending after it gives you 2n elements. Python has no capacity API.","v.reserve(n);   // ≠ resize(n)",O.n+" reserve changes CAPACITY; size stays 0.","new ArrayList&lt;&gt;(n)",O.n+" initialCapacity; size stays 0."],
   ["Iterate with index","for i, x in enumerate(a):",O.n,"for (size_t i=0; i&lt;v.size(); ++i)",O.n,"for (int i=0; i&lt;a.size(); i++)",O.n],
   ["Safe delete while iterating","a[:] = [x for x in a if keep(x)]",O.n,"it = v.erase(it);  // reassign!",O.n,"iterator.remove()",O.n+" else ConcurrentModificationException."]
  ];
  var host=$("#refTable");
  var html="<div class='rhd'><div>Operation</div><div class='hpy'>Python</div><div class='hcpp'>C++</div><div class='hjava'>Java</div></div>";
  R.forEach(function(r){
    html+="<div class='rrow'>"
     +"<div class='rc op'>"+r[0]+"</div>"
     +"<div class='rc py'><code>"+r[1]+"</code><span class='n'>"+r[2]+"</span></div>"
     +"<div class='rc cpp'><code>"+r[3]+"</code><span class='n'>"+r[4]+"</span></div>"
     +"<div class='rc java'><code>"+r[5]+"</code><span class='n'>"+r[6]+"</span></div>"
     +"</div>";
  });
  host.innerHTML=html;

  var rows=Array.prototype.slice.call(host.querySelectorAll(".rrow"));
  var cache=rows.map(function(r){ return r.textContent.toLowerCase(); });
  $("#refQ").addEventListener("input",function(){
    var t=(this as any).value.trim().toLowerCase();
    rows.forEach(function(r,i){ r.style.display = (t==="" || cache[i].indexOf(t)>=0) ? "" : "none"; });
  });
  var COL={py:2,cpp:3,java:4};
  $$("[data-lang]").forEach(function(b){
    b.addEventListener("click",function(){
      var on=b.classList.toggle("on");
      var others=document.querySelectorAll("[data-lang].on");
      if(!on && others.length===0){ b.classList.add("on"); return; }
      var  live: any = []; $$("[data-lang]").forEach(function(x){ if(x.classList.contains("on")) live.push(x.dataset.lang!); });
      var cols="0.95fr "+live.map(function(){ return "1fr"; }).join(" ");
      host.querySelectorAll(".rrow,.rhd").forEach(function(r){ r.style.gridTemplateColumns=cols; });
      ["py","cpp","java"].forEach(function(l){
        var show=live.indexOf(l)>=0;
        host.querySelectorAll(".rc."+l).forEach(function(c){ c.style.display=show?"":"none"; });
        var h=host.querySelector(".h"+l); if(h) h.style.display=show?"":"none";
      });
    });
  });
})();

/* =====================================================================
   MODULE 05 — TRAPS
   ===================================================================== */
(function(){
  var T=[
   ["Java · silent wrong answer","remove(int) vs remove(Object)","Two different overloads. An <code>int</code> literal means INDEX; an <code>Integer</code> means VALUE.",
    "List&lt;Integer&gt; a = new ArrayList&lt;&gt;(List.of(10,20,30));\na.remove(20);                  <span class='x'>// IndexOutOfBounds — index 20!</span>\na.remove(1);                   <span class='c'>// removes 20 (by index)</span>\na.remove(Integer.valueOf(20)); <span class='y'>// removes the VALUE 20</span>"],
   ["C++ · infinite loop","size() is unsigned","<code>size_t</code> subtraction wraps past zero to ~1.8×10¹⁹.",
    "for (int i = 0; i &lt; v.size() - 1; i++)   <span class='x'>// empty v → runs forever</span>\n\nfor (int i = 0; i + 1 &lt; (int)v.size(); i++)  <span class='y'>// safe</span>"],
   ["C++ · dangling memory","Iterator invalidation","Any push_back that reallocates invalidates EVERY iterator, pointer and reference into the vector.",
    "int&amp; r = v[0];\nv.push_back(5);   <span class='x'>// r may now dangle</span>\nr = 10;           <span class='x'>// undefined behaviour</span>\n\nv.reserve(n);     <span class='y'>// or hold indices, not references</span>"],
   ["C++ · not a container","vector&lt;bool&gt; is a lie","A bit-packed specialisation. <code>operator[]</code> returns a proxy object, not <code>bool&amp;</code>.",
    "vector&lt;bool&gt; v(10);\nbool&amp; b = v[0];        <span class='x'>// won't compile</span>\nvector&lt;char&gt; ok(10);   <span class='y'>// use char or deque&lt;bool&gt;</span>"],
   ["Python · corrupted DP table","[[0]*m]*n aliasing","The <code>*</code> operator copies REFERENCES. All n rows are the same list object.",
    "g = [[0]*3]*3\ng[0][0] = 9\n<span class='x'># g == [[9,0,0],[9,0,0],[9,0,0]]</span>\n\ng = [[0]*3 for _ in range(3)]   <span class='y'># correct</span>"],
   ["Python · returns None","In-place methods return nothing","<code>sort</code>, <code>reverse</code>, <code>append</code>, <code>extend</code> mutate and return <code>None</code>. Chaining destroys your data.",
    "b = a.sort()      <span class='x'># b is None</span>\nb = sorted(a)     <span class='y'># correct</span>\na = a.append(x)   <span class='x'># a is now None</span>"],
   ["Python · hidden O(n²)","pop(0) and insert(0, x)","Both shift the entire list. In a BFS over 10⁵ nodes that's 10¹⁰ ops and a certain TLE.",
    "q = []; q.pop(0)            <span class='x'># O(n) every time</span>\nfrom collections import deque\nq = deque(); q.popleft()    <span class='y'># O(1)</span>"],
   ["Python · shared state","Mutable default arguments","The default list is created ONCE at function definition and shared by every call.",
    "def f(x, acc=[]):     <span class='x'># shared across calls</span>\n    acc.append(x)\n\ndef f(x, acc=None):   <span class='y'># correct</span>\n    if acc is None: acc = []"],
   ["Java · works small, fails big","== on boxed Integers","Java caches Integer objects from −128 to 127. Above that, <code>==</code> compares references.",
    "Integer a = 127, b = 127;  a == b;  <span class='c'>// true (cached)</span>\nInteger c = 128, d = 128;  c == d;  <span class='x'>// false (!)</span>\nc.equals(d);                        <span class='y'>// true — always use equals</span>"],
   ["Java · runtime exception","Arrays.asList is a fixed-size view","No add or remove. And on an <code>int[]</code> it yields a one-element <code>List&lt;int[]&gt;</code>.",
    "Arrays.asList(1,2,3).add(4);  <span class='x'>// UnsupportedOperationException</span>\nint[] arr = {1,2,3};\nArrays.asList(arr).size();    <span class='x'>// 1, not 3</span>\nArrays.stream(arr).boxed().toList();  <span class='y'>// correct</span>"],
   ["Java · silent aliasing","subList is live","Mutating the sublist mutates the parent. Structurally modifying the parent invalidates the view.",
    "var sub = a.subList(0, 3);\nsub.set(0, 99);   <span class='c'>// a.get(0) is now 99</span>\na.add(7);\nsub.get(0);       <span class='x'>// ConcurrentModificationException</span>"],
   ["C++ · segfault inside std::sort","Comparator must be a strict weak ordering","A comparator must return <b>false</b> for equal elements. Return <code>&lt;=</code> and <code>std::sort</code> reads out of bounds — the stack trace points into libstdc++ and tells you nothing.",
    "sort(b, e, [](int x, int y){ return x &lt;= y; });  <span class='x'>// UB: can segfault</span>\nsort(b, e, [](int x, int y){ return x &lt;  y;  });  <span class='y'>// correct</span>\n\n<span class='c'>// Java throws instead of crashing:</span>\n<span class='c'>// IllegalArgumentException: Comparison method</span>\n<span class='c'>// violates its general contract!</span>"],
   ["All languages · overflow","Midpoint and sum overflow","<code>(lo+hi)/2</code> overflows near INT_MAX in C++ and Java. Python is immune — which is exactly why Python habits don't transfer.",
    "int mid = (lo + hi) / 2;        <span class='x'>// can overflow</span>\nint mid = lo + (hi - lo) / 2;   <span class='y'>// safe</span>\nlong long s = accumulate(b, e, 0LL);  <span class='y'>// safe</span>"]
  ];
  $("#trapGrid").innerHTML = T.map(function(t){
    return "<div class='trap'><span class='lbl'>"+t[0]+"</span><h4>"+t[1]+"</h4><p>"+t[2]+"</p><pre>"+t[3]+"</pre></div>";
  }).join("");
})();

/* =====================================================================
   MODULE 02 — CACHE LOCALITY
   ===================================================================== */
(function(){
  var NL=8, LS=8, N=NL*LS, LINEB=64, ELB=8;
  var host=$("#cacheGrid"), lineEls: any = [], cellEls: any = [];
  var  order: any = [], step=0, timer: any = null, mode="row", cap=4;
  var  cache: any = [], hits=0, misses=0;

  for(var l=0;l<NL;l++){
    var row=document.createElement("div"); row.className="cline";
    var t=document.createElement("div"); t.className="tagn"; t.textContent="L"+l;
    row.appendChild(t);
    for(var k=0;k<LS;k++){
      var c=document.createElement("div"); c.className="ccell"; c.textContent=String(l*LS+k);
      row.appendChild(c); cellEls.push(c);
    }
    host.appendChild(row); lineEls.push(row);
  }

  function build(m){
    var  o: any = [],i,r,c;
    if(m==="col"){ for(c=0;c<LS;c++) for(r=0;r<NL;r++) o.push(r*LS+c); }
    else if(m==="stride"){ for(i=0;i<N;i+=2) o.push(i); for(i=1;i<N;i+=2) o.push(i); }
    else if(m==="rand"){
      for(i=0;i<N;i++) o.push(i);
      for(i=N-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var tmp=o[i]; o[i]=o[j]; o[j]=tmp; }
    }
    else { for(i=0;i<N;i++) o.push(i); }
    return o;
  }

  function paint(){
    var fetched=misses*LINEB, used=(hits+misses)*ELB;
    $("#cHit").textContent=String(hits);
    $("#cMiss").textContent=String(misses);
    $("#cBytes").textContent=fetched.toLocaleString();
    $("#cAmp").textContent = used ? (fetched/used).toFixed(1)+"\u00D7" : "\u2014";
    $("#cCyc").textContent=(hits*4+misses*200).toLocaleString();
  }

  function clear(){
    if(timer){ clearInterval(timer); timer=null; }
    cache=[]; hits=0; misses=0; step=0;
    for(var i=0;i<cellEls.length;i++) cellEls[i].className="ccell";
    for(var j=0;j<lineEls.length;j++) lineEls[j].className="cline";
    paint();
  }

  function tick(){
    if(step>=order.length){
      if(timer){ clearInterval(timer); timer=null; }
      for(var q=0;q<cellEls.length;q++) cellEls[q].classList.remove("cur");
      return;
    }
    var i=order[step], line=Math.floor(i/LS);
    var at=cache.indexOf(line), hit=at>=0;
    if(hit){ cache.splice(at,1); cache.push(line); hits++; }
    else{ misses++; if(cache.length>=cap) cache.shift(); cache.push(line); }

    for(var z=0;z<cellEls.length;z++) cellEls[z].classList.remove("cur");
    var el=cellEls[i];
    el.classList.remove("hit","miss");
    el.classList.add(hit?"hit":"miss");
    el.classList.add("cur");
    for(var m=0;m<lineEls.length;m++){
      lineEls[m].className="cline"+(cache.indexOf(m)>=0?" res":"")+((!hit&&m===line)?" load":"");
    }
    step++; paint();
  }

  function run(m){
    mode=m; clear(); order=build(m);
    if(RM){ while(step<order.length) tick(); return; }
    timer=setInterval(tick,42);
  }

  $$("[data-cache]").forEach(function(b){
    b.addEventListener("click",function(){
      var m=b.dataset.cache!;
      if(m==="stop"){ if(timer){ clearInterval(timer); timer=null; } return; }
      $$("[data-cache]").forEach(function(x){
        if(x.dataset.cache!!=="stop") x.classList.remove("on");
      });
      b.classList.add("on");
      run(m);
    });
  });

  $("#cacheCap").addEventListener("input",function(){
    cap=+(this as any).value;
    $("#capLbl").textContent=cap+" line"+(cap>1?"s":"")+" \u00B7 "+(cap*LINEB)+" B";
    run(mode);
  });

  order=build("row"); clear();
  var fired=false;
  new IntersectionObserver(function(e){
    if(e[0].isIntersecting && !fired){ fired=true; run("row"); }
  },{threshold:.2}).observe(host);
})();

/* ---- pointer-chasing race ---- */
(function(){
  var N=32, A_CYC=4, L_CYC=150, TOT_A=N*A_CYC, TOT_L=N*L_CYC;
  var sa=$("#rAstrip"), sb=$("#rBstrip"), A: any = [], B: any = [], bOrd: any = [], running=false;
  for(var i=0;i<N;i++){
    var u=document.createElement("u"); sa.appendChild(u); A.push(u);
    var v=document.createElement("u"); sb.appendChild(v); B.push(v);
    bOrd.push(i);
  }
  function shuffle(o){ for(var i=o.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=o[i]; o[i]=o[j]; o[j]=t; } }
  function done(){
    running=false;
    $("#rRatio").textContent="\u2248 "+(TOT_L/TOT_A).toFixed(0)+"\u00D7 slower \u00B7 identical O(n)";
  }
  function paint(a,b,clock){
    for(var i=0;i<N;i++) A[i].className = i<a ? "on" : "";
    for(var j=0;j<N;j++) B[j].className = "";
    for(var k=0;k<b;k++) B[bOrd[k]].className="sc";
    $("#rAbar").style.width=(a/N*100)+"%";
    $("#rBbar").style.width=(b/N*100)+"%";
    $("#rA").textContent=Math.round(Math.min(clock,TOT_A)).toLocaleString()+" cycles \u00b7 4 lines";
    $("#rB").textContent=Math.round(Math.min(clock,TOT_L)).toLocaleString()+" cycles \u00b7 32 lines";
  }
  $("#raceGo").addEventListener("click",function(){
    if(running) return;
    running=true; shuffle(bOrd);
    $("#rRatio").textContent="";
    if(RM){ paint(N,N,TOT_L); done(); return; }
    var  t0: any = null;
    function frame(ts){
      if(!t0) t0=ts;
      var clock=(ts-t0)*4;
      var a=Math.min(N,Math.floor(clock/A_CYC));
      var b=Math.min(N,Math.floor(clock/L_CYC));
      paint(a,b,clock);
      if(b<N) requestAnimationFrame(frame); else done();
    }
    requestAnimationFrame(frame);
  });
  paint(0,0,0);
})();

/* =====================================================================
   MODULE 04 — PATTERN DECISION TREE
   ===================================================================== */
(function(){
  function P(n,s,t){ return [n,s,t]; }

  var L={
  kadane:{n:"Kadane",t:"O(n)",s:"O(1)",
    sig:"<b>Signal:</b> optimal <em>contiguous</em> sum, values may be negative, no length constraint.",
    why:"The best subarray ending at index i is either a[i] on its own, or the best one ending at i-1 extended by a[i]. Nothing else is possible. That is O(1) state per index \u2014 a dynamic program whose table collapses to two scalars.",
    code:"best = cur = a[0]\n<span class='kw'>for</span> i <span class='kw'>in</span> range(<span class='nu'>1</span>, len(a)):\n    cur  = max(a[i], cur + a[i])   <span class='cm'># restart, or extend</span>\n    best = max(best, cur)\n<span class='kw'>return</span> best",
    warn:"Seeding <code>best = 0</code> returns 0 on an all-negative array instead of the least-negative element. Always seed from <code>a[0]</code>.",
    say:"The state is O(1) per index, so this is a DP where the table degenerates to two variables.",
    lc:[P(53,"maximum-subarray","Maximum Subarray"),P(152,"maximum-product-subarray","Max Product Subarray"),P(918,"maximum-sum-circular-subarray","Circular Max Sum"),P(1749,"maximum-absolute-sum-of-any-subarray","Max Absolute Sum")]},

  window:{n:"Sliding window",t:"O(n)",s:"O(k)",
    sig:"<b>Signal:</b> longest / shortest / count of <em>contiguous</em> ranges satisfying a property P.",
    why:"Both pointers only ever move right. Growing the window can only break P; shrinking can only restore it. So each index enters once and leaves once \u2014 2n moves total, O(n), despite the nested loop.",
    code:"<span class='kw'>from</span> collections <span class='kw'>import</span> Counter\ncnt, left, best = Counter(), <span class='nu'>0</span>, <span class='nu'>0</span>\n<span class='kw'>for</span> right, ch <span class='kw'>in</span> enumerate(s):\n    cnt[ch] += <span class='nu'>1</span>\n    <span class='kw'>while</span> <span class='kw'>not</span> ok(cnt):          <span class='cm'># shrink until valid again</span>\n        cnt[s[left]] -= <span class='nu'>1</span>\n        <span class='kw'>if</span> cnt[s[left]] == <span class='nu'>0</span>: <span class='kw'>del</span> cnt[s[left]]\n        left += <span class='nu'>1</span>\n    best = max(best, right - left + <span class='nu'>1</span>)",
    warn:"The technique requires monotonicity. If adding an element can make an invalid window valid again \u2014 which happens the moment negative numbers enter a sum constraint \u2014 sliding window is simply wrong. Use prefix sums plus a hash map instead.",
    say:"Both pointers are monotonically non-decreasing, so the amortised work is 2n even though the code reads as a nested loop.",
    lc:[P(3,"longest-substring-without-repeating-characters","Longest Unique Substring"),P(76,"minimum-window-substring","Minimum Window Substring"),P(209,"minimum-size-subarray-sum","Min Size Subarray Sum"),P(424,"longest-repeating-character-replacement","Char Replacement"),P(438,"find-all-anagrams-in-a-string","Find All Anagrams"),P(239,"sliding-window-maximum","Sliding Window Maximum")]},

  prefix:{n:"Prefix sums",t:"O(n) build \u00b7 O(1) query",s:"O(n)",
    sig:"<b>Signal:</b> repeated range-sum queries on an array that never changes \u2014 or counting subarrays whose sum equals k.",
    why:"Precompute p[i] = a[0..i-1]. Then sum(l..r) = p[r+1] - p[l], a single subtraction. The counting variant is the real payoff: sum(l..r) == k rewrites to p[r+1] - p[l] == k, so you sweep once and ask a hash map how many earlier prefixes equal p[r+1] - k.",
    code:"<span class='cm'># range queries</span>\np = [<span class='nu'>0</span>]*(len(a)+<span class='nu'>1</span>)\n<span class='kw'>for</span> i, v <span class='kw'>in</span> enumerate(a): p[i+<span class='nu'>1</span>] = p[i] + v\nrng = <span class='kw'>lambda</span> l, r: p[r+<span class='nu'>1</span>] - p[l]\n\n<span class='cm'># count subarrays summing to k</span>\nseen, run, out = {<span class='nu'>0</span>: <span class='nu'>1</span>}, <span class='nu'>0</span>, <span class='nu'>0</span>\n<span class='kw'>for</span> v <span class='kw'>in</span> a:\n    run += v\n    out += seen.get(run - k, <span class='nu'>0</span>)\n    seen[run] = seen.get(run, <span class='nu'>0</span>) + <span class='nu'>1</span>",
    warn:"Seed the map with <code>{0: 1}</code> or you miss every subarray that starts at index 0. This one line is the difference between passing and failing LC 560.",
    say:"Prefix sums turn a range query into a difference, which is why the sum-equals-k problem reduces to two-sum on prefixes.",
    lc:[P(303,"range-sum-query-immutable","Range Sum Query"),P(560,"subarray-sum-equals-k","Subarray Sum Equals K"),P(523,"continuous-subarray-sum","Continuous Subarray Sum"),P(974,"subarray-sums-divisible-by-k","Sums Divisible by K"),P(1314,"matrix-block-sum","2D Block Sum")]},

  diff:{n:"Difference array",t:"O(1) update \u00b7 O(n) finalise",s:"O(n)",
    sig:"<b>Signal:</b> thousands of <em>range updates</em> \u2014 add v to every index in [l, r] \u2014 and you only read the array at the very end.",
    why:"The inverse of prefix sums. Record only the two points where the increment starts and stops, then integrate once at the end. Each update touches two cells instead of r-l+1.",
    code:"d = [<span class='nu'>0</span>]*(n+<span class='nu'>1</span>)\n<span class='kw'>for</span> l, r, v <span class='kw'>in</span> updates:\n    d[l]   += v\n    d[r+<span class='nu'>1</span>] -= v          <span class='cm'># r+1, hence the n+1 sizing</span>\n\n<span class='kw'>from</span> itertools <span class='kw'>import</span> accumulate\nfinal = list(accumulate(d))[:n]",
    warn:"Size the array <code>n+1</code>, not <code>n</code>, or the <code>d[r+1]</code> write on the last index goes out of bounds. Also: this only works when no query is interleaved between updates \u2014 the moment you need reads in the middle, you need a Fenwick tree.",
    say:"A difference array is the discrete derivative; the final pass is the integral. O(1) per update instead of O(n).",
    lc:[P(1109,"corporate-flight-bookings","Corporate Flight Bookings"),P(370,"range-addition","Range Addition"),P(1094,"car-pooling","Car Pooling"),P(2381,"shifting-letters-ii","Shifting Letters II")]},

  twoptr:{n:"Two pointers, converging",t:"O(n) after sort",s:"O(1)",
    sig:"<b>Signal:</b> sorted array, find a <em>pair</em> meeting a numeric condition.",
    why:"Sortedness makes the sum move monotonically. If a[lo]+a[hi] is too small, a[hi] is already the largest partner available for a[lo] \u2014 so no pair using a[lo] can ever work, and lo can be discarded permanently. Each pointer moves at most n times.",
    code:"lo, hi = <span class='nu'>0</span>, len(a) - <span class='nu'>1</span>\n<span class='kw'>while</span> lo &lt; hi:\n    s = a[lo] + a[hi]\n    <span class='kw'>if</span> s == target: <span class='kw'>return</span> lo, hi\n    <span class='kw'>if</span> s &lt; target:  lo += <span class='nu'>1</span>   <span class='cm'># only lo can raise the sum</span>\n    <span class='kw'>else</span>:           hi -= <span class='nu'>1</span>   <span class='cm'># only hi can lower it</span>\n<span class='kw'>return</span> <span class='kw'>None</span>",
    warn:"If the problem wants original indices back, sorting destroys them. Sort <code>(value, index)</code> pairs, or switch to the hash-map approach.",
    say:"The discard argument is the proof: when the sum is too small, every pair involving a[lo] is too small, so lo is eliminated \u2014 not just skipped.",
    lc:[P(167,"two-sum-ii-input-array-is-sorted","Two Sum II"),P(11,"container-with-most-water","Container With Most Water"),P(42,"trapping-rain-water","Trapping Rain Water"),P(977,"squares-of-a-sorted-array","Squares of Sorted Array")]},

  ksum:{n:"k-Sum: fix and collapse",t:"O(n^(k-1))",s:"O(1)",
    sig:"<b>Signal:</b> find a triplet or quadruplet summing to a target. 3Sum is asked far more often than sorted 2Sum.",
    why:"Sort, then pin the outermost index and run converging two pointers on the remainder. Each pinned level costs a factor of n, so 3Sum is O(n\u00b2) and 4Sum is O(n\u00b3) \u2014 both beat the brute force by exactly one power.",
    code:"a.sort()\nout = []\n<span class='kw'>for</span> i <span class='kw'>in</span> range(len(a) - <span class='nu'>2</span>):\n    <span class='kw'>if</span> i &gt; <span class='nu'>0</span> <span class='kw'>and</span> a[i] == a[i-<span class='nu'>1</span>]: <span class='kw'>continue</span>   <span class='cm'># skip dup pivots</span>\n    lo, hi = i + <span class='nu'>1</span>, len(a) - <span class='nu'>1</span>\n    <span class='kw'>while</span> lo &lt; hi:\n        s = a[i] + a[lo] + a[hi]\n        <span class='kw'>if</span> s &lt; <span class='nu'>0</span>: lo += <span class='nu'>1</span>\n        <span class='kw'>elif</span> s &gt; <span class='nu'>0</span>: hi -= <span class='nu'>1</span>\n        <span class='kw'>else</span>:\n            out.append((a[i], a[lo], a[hi]))\n            lo += <span class='nu'>1</span>\n            <span class='kw'>while</span> lo &lt; hi <span class='kw'>and</span> a[lo] == a[lo-<span class='nu'>1</span>]: lo += <span class='nu'>1</span>  <span class='cm'># skip dup partners</span>\n            hi -= <span class='nu'>1</span>",
    warn:"Deduplication is where this is lost. You need <em>two</em> skips \u2014 one on the pivot, one on lo after a hit. Miss either and you emit duplicate triplets; do it with a set instead and you pay memory plus hashing for nothing.",
    say:"Sorting costs O(n log n), which is dominated by the O(n\u00b2) scan, so sorting is free here.",
    lc:[P(15,"3sum","3Sum"),P(16,"3sum-closest","3Sum Closest"),P(18,"4sum","4Sum"),P(259,"3sum-smaller","3Sum Smaller")]},

  hash:{n:"Hash map complement",t:"O(n)",s:"O(n)",
    sig:"<b>Signal:</b> you need original indices, the array must not be reordered, or O(n log n) is too slow.",
    why:"You are not searching for a value, you are searching for its complement. One pass: before inserting a[i], ask whether target - a[i] has already been seen. That guarantees you never pair an element with itself.",
    code:"seen = {}\n<span class='kw'>for</span> i, v <span class='kw'>in</span> enumerate(a):\n    <span class='kw'>if</span> target - v <span class='kw'>in</span> seen:\n        <span class='kw'>return</span> seen[target - v], i\n    seen[v] = i          <span class='cm'># insert AFTER the check</span>",
    warn:"Insert after checking, not before \u2014 otherwise <code>target = 2*v</code> matches a[i] with itself. And in C++, <code>unordered_map</code> is O(n) worst case under adversarial hashing; competitive judges exploit this, so reserve and use a custom hash on hot paths.",
    say:"This trades O(n) space for the O(log n) factor that sorting would have cost, and preserves the original indices.",
    lc:[P(1,"two-sum","Two Sum"),P(454,"4sum-ii","4Sum II"),P(560,"subarray-sum-equals-k","Subarray Sum Equals K"),P(219,"contains-duplicate-ii","Contains Duplicate II")]},

  lower:{n:"Binary search \u00b7 lower bound",t:"O(log n)",s:"O(1)",
    sig:"<b>Signal:</b> genuinely sorted data; find a value, its first occurrence, or where it would be inserted.",
    why:"Maintain the invariant that the answer lives in [lo, hi). Never write mid-1 on the side that might contain the answer \u2014 that single discipline is what removes every off-by-one.",
    code:"<span class='cm'># FIRST index with a[i] &gt;= target</span>\nlo, hi = <span class='nu'>0</span>, len(a)        <span class='cm'># hi is EXCLUSIVE</span>\n<span class='kw'>while</span> lo &lt; hi:\n    mid = lo + (hi - lo) // <span class='nu'>2</span>\n    <span class='kw'>if</span> a[mid] &lt; target: lo = mid + <span class='nu'>1</span>\n    <span class='kw'>else</span>:               hi = mid\n<span class='kw'>return</span> lo\n\n<span class='cm'># MIRROR: last index where pred(i) is true</span>\nlo, hi = <span class='nu'>0</span>, len(a) - <span class='nu'>1</span>\n<span class='kw'>while</span> lo &lt; hi:\n    mid = lo + (hi - lo + <span class='nu'>1</span>) // <span class='nu'>2</span>   <span class='cm'># CEILING \u2014 mandatory</span>\n    <span class='kw'>if</span> pred(mid): lo = mid\n    <span class='kw'>else</span>:         hi = mid - <span class='nu'>1</span>",
    warn:"The two templates are not interchangeable. Use the floor midpoint with <code>lo = mid</code> and it infinite-loops the instant hi = lo+1. If you are moving lo to mid, you must round the midpoint <em>up</em>. Memorising only the first template is the single most common binary search failure.",
    say:"lower_bound also returns the insertion point, so one function answers membership, first occurrence, count via upper minus lower, and where to insert.",
    lc:[P(704,"binary-search","Binary Search"),P(35,"search-insert-position","Search Insert Position"),P(34,"find-first-and-last-position-of-element-in-sorted-array","First and Last Position"),P(658,"find-k-closest-elements","K Closest Elements")]},

  rotated:{n:"Binary search \u00b7 rotated",t:"O(log n)",s:"O(1)",
    sig:"<b>Signal:</b> a sorted array that was rotated at an unknown pivot.",
    why:"At any midpoint, at least one half is still perfectly sorted \u2014 you can tell which by comparing a[mid] to a[lo]. Check whether the target falls inside that sorted half; if it does, recurse there, otherwise recurse into the other.",
    code:"lo, hi = <span class='nu'>0</span>, len(a) - <span class='nu'>1</span>\n<span class='kw'>while</span> lo &lt;= hi:\n    mid = lo + (hi - lo) // <span class='nu'>2</span>\n    <span class='kw'>if</span> a[mid] == target: <span class='kw'>return</span> mid\n    <span class='kw'>if</span> a[lo] &lt;= a[mid]:                  <span class='cm'># left half sorted</span>\n        <span class='kw'>if</span> a[lo] &lt;= target &lt; a[mid]: hi = mid - <span class='nu'>1</span>\n        <span class='kw'>else</span>:                        lo = mid + <span class='nu'>1</span>\n    <span class='kw'>else</span>:                                <span class='cm'># right half sorted</span>\n        <span class='kw'>if</span> a[mid] &lt; target &lt;= a[hi]: lo = mid + <span class='nu'>1</span>\n        <span class='kw'>else</span>:                        hi = mid - <span class='nu'>1</span>\n<span class='kw'>return</span> -<span class='nu'>1</span>",
    warn:"With duplicates allowed, <code>a[lo] == a[mid]</code> tells you nothing about which half is sorted, and the worst case degrades to O(n). LC 154 exists precisely to test whether you know that.",
    say:"The invariant is that at least one half is always sorted, which is what keeps the halving valid.",
    lc:[P(33,"search-in-rotated-sorted-array","Search in Rotated Array"),P(81,"search-in-rotated-sorted-array-ii","Rotated with Duplicates"),P(153,"find-minimum-in-rotated-sorted-array","Find Minimum"),P(154,"find-minimum-in-rotated-sorted-array-ii","Find Minimum II")]},

  boa:{n:"Binary search on the answer",t:"O(n log range)",s:"O(1)",
    sig:"<b>Signal:</b> minimise the maximum, maximise the minimum, smallest capacity / speed / days that still works. If you can hear the phrase <em>just barely enough</em>, it is this.",
    why:"You are not searching the array \u2014 you are searching the answer space. Write a boolean feasible(x). If feasible is monotone (true for every x above some threshold, false below), binary search the threshold. Most candidates never spot this because there is no sorted array anywhere in sight.",
    code:"<span class='kw'>def</span> feasible(x):\n    <span class='cm'># can we do it with capacity/speed/limit x?</span>\n    ...\n\nlo, hi = min_possible, max_possible\n<span class='kw'>while</span> lo &lt; hi:\n    mid = lo + (hi - lo) // <span class='nu'>2</span>\n    <span class='kw'>if</span> feasible(mid): hi = mid       <span class='cm'># mid works, try smaller</span>\n    <span class='kw'>else</span>:             lo = mid + <span class='nu'>1</span>\n<span class='kw'>return</span> lo",
    warn:"Verify monotonicity before you commit. If feasible flips true, false, true across the range, binary search returns nonsense with total confidence. Also set <code>hi</code> to a genuinely achievable bound \u2014 usually sum(a) or max(a) \u2014 not an arbitrary large constant.",
    say:"The array is not what is sorted here; the predicate is monotone over the answer space, which is all binary search actually requires.",
    lc:[P(875,"koko-eating-bananas","Koko Eating Bananas"),P(1011,"capacity-to-ship-packages-within-d-days","Ship Packages in D Days"),P(410,"split-array-largest-sum","Split Array Largest Sum"),P(1482,"minimum-number-of-days-to-make-m-bouquets","Bouquets"),P(2226,"maximum-candies-allocated-to-k-children","Maximum Candies")]},

  dnf:{n:"Dutch national flag",t:"O(n)",s:"O(1)",
    sig:"<b>Signal:</b> partition in place into three categories, one pass, no extra memory.",
    why:"You never sort \u2014 you maintain region boundaries as invariants. [0,lo) is category 0, [lo,mid) is category 1, (hi,end] is category 2, and [mid,hi] is the unexamined middle that shrinks every iteration.",
    code:"lo = mid = <span class='nu'>0</span>; hi = len(a) - <span class='nu'>1</span>\n<span class='kw'>while</span> mid &lt;= hi:\n    <span class='kw'>if</span> a[mid] == <span class='nu'>0</span>:\n        a[lo], a[mid] = a[mid], a[lo]; lo += <span class='nu'>1</span>; mid += <span class='nu'>1</span>\n    <span class='kw'>elif</span> a[mid] == <span class='nu'>1</span>:\n        mid += <span class='nu'>1</span>\n    <span class='kw'>else</span>:\n        a[mid], a[hi] = a[hi], a[mid]; hi -= <span class='nu'>1</span>   <span class='cm'># mid stays!</span>",
    warn:"When you swap from the back, do <b>not</b> advance mid. The value you just pulled in came from the unexamined region and has not been classified. Advancing mid here is the single most common bug in this algorithm.",
    say:"Each element is touched at most twice, so it is one pass, O(n), with zero extra memory \u2014 and it is exactly the partition step of quicksort with equal keys handled.",
    lc:[P(75,"sort-colors","Sort Colors"),P(905,"sort-array-by-parity","Sort Array by Parity"),P(324,"wiggle-sort-ii","Wiggle Sort II")]},

  readwrite:{n:"Two pointers, read / write",t:"O(n)",s:"O(1)",
    sig:"<b>Signal:</b> remove, filter or compact in place while preserving relative order.",
    why:"One pointer reads every element; a slower pointer marks where the next kept element belongs. Because write never overtakes read, you can safely overwrite in place with a single pass.",
    code:"write = <span class='nu'>0</span>\n<span class='kw'>for</span> read <span class='kw'>in</span> range(len(a)):\n    <span class='kw'>if</span> keep(a[read]):\n        a[write] = a[read]\n        write += <span class='nu'>1</span>\n<span class='kw'>return</span> write       <span class='cm'># new logical length</span>",
    warn:"Do not delete while iterating instead. <code>a.pop(i)</code> inside a loop is O(n) per call \u2014 quietly O(n\u00b2) overall \u2014 and it also skips the element that slid into the vacated slot.",
    say:"Write never overtakes read, so overwriting in place is always safe \u2014 that is the invariant that makes it O(1) space.",
    lc:[P(26,"remove-duplicates-from-sorted-array","Remove Duplicates"),P(27,"remove-element","Remove Element"),P(283,"move-zeroes","Move Zeroes"),P(80,"remove-duplicates-from-sorted-array-ii","Remove Duplicates II")]},

  cyclic:{n:"Cyclic sort \u00b7 index as hash",t:"O(n)",s:"O(1)",
    sig:"<b>Signal:</b> values are a permutation of 1..n or 0..n, and you must find the missing or duplicate one in O(1) space.",
    why:"When values and indices come from the same range, the array is its own hash table. Put every value v at index v-1, then whichever index disagrees with its value is your answer. The swap loop is O(n) because each swap places at least one value permanently.",
    code:"i = <span class='nu'>0</span>\n<span class='kw'>while</span> i &lt; len(a):\n    j = a[i] - <span class='nu'>1</span>                       <span class='cm'># where a[i] belongs</span>\n    <span class='kw'>if</span> <span class='nu'>0</span> &lt;= j &lt; len(a) <span class='kw'>and</span> a[i] != a[j]:\n        a[i], a[j] = a[j], a[i]        <span class='cm'># swap, do NOT advance</span>\n    <span class='kw'>else</span>:\n        i += <span class='nu'>1</span>\n\n<span class='kw'>for</span> i, v <span class='kw'>in</span> enumerate(a):\n    <span class='kw'>if</span> v != i + <span class='nu'>1</span>: <span class='kw'>return</span> i + <span class='nu'>1</span>",
    warn:"Guard with <code>a[i] != a[j]</code>, not <code>i != j</code>. With duplicates present the latter spins forever, swapping two equal values back and forth. Also do not advance i after a swap \u2014 the value you just received is unplaced.",
    say:"Values and indices share a range, so the array doubles as an O(1)-space hash table.",
    lc:[P(41,"first-missing-positive","First Missing Positive"),P(268,"missing-number","Missing Number"),P(287,"find-the-duplicate-number","Find the Duplicate"),P(448,"find-all-numbers-disappeared-in-an-array","Disappeared Numbers"),P(442,"find-all-duplicates-in-an-array","All Duplicates")]},

  rotate:{n:"Rotate by triple reversal",t:"O(n)",s:"O(1)",
    sig:"<b>Signal:</b> shift every element by k positions, wrapping, without allocating a second array.",
    why:"Reverse the whole array, then reverse each of the two resulting blocks. The elements land exactly where a rotation would put them, using nothing but swaps.",
    code:"k %= len(a)                <span class='cm'># k can exceed n</span>\na.reverse()\na[:k] = reversed(a[:k])\na[k:] = reversed(a[k:])\n\n<span class='cm'># C++:  rotate(v.begin(), v.begin()+k, v.end());</span>\n<span class='cm'># Java: Collections.rotate(list, -k);</span>",
    warn:"Take <code>k %= n</code> first. A raw k larger than n either throws or silently no-ops depending on the language, and it is the only edge case this problem has.",
    say:"Three reversals, O(n) total, O(1) space \u2014 and the standard library already ships it.",
    lc:[P(189,"rotate-array","Rotate Array"),P(151,"reverse-words-in-a-string","Reverse Words"),P(186,"reverse-words-in-a-string-ii","Reverse Words II")]},

  mono:{n:"Monotonic stack",t:"O(n)",s:"O(n)",
    sig:"<b>Signal:</b> for each element, find the next or previous strictly greater / smaller element. Spans, histograms, temperatures, trapped water.",
    why:"Keep a stack whose values stay decreasing. When a larger value arrives, it is the answer for everything you pop. Each index is pushed once and popped once \u2014 2n operations \u2014 so it is O(n) despite the inner while loop.",
    code:"stack, out = [], [-<span class='nu'>1</span>]*len(a)     <span class='cm'># stack holds INDICES</span>\n<span class='kw'>for</span> i, v <span class='kw'>in</span> enumerate(a):\n    <span class='kw'>while</span> stack <span class='kw'>and</span> a[stack[-<span class='nu'>1</span>]] &lt; v:\n        out[stack.pop()] = i       <span class='cm'># v is the next greater</span>\n    stack.append(i)\n<span class='cm'># anything still on the stack has no next greater element</span>",
    warn:"Push indices, not values \u2014 you almost always need the distance, not just the value. And decide deliberately between <code>&lt;</code> and <code>&lt;=</code>: with equal elements that choice determines whether you get the next-greater or the next-greater-or-equal, and it silently changes the answer on histogram problems.",
    say:"Every index is pushed and popped at most once, so the amortised cost is O(n) even though the inner loop looks quadratic.",
    lc:[P(496,"next-greater-element-i","Next Greater Element I"),P(739,"daily-temperatures","Daily Temperatures"),P(84,"largest-rectangle-in-histogram","Largest Rectangle"),P(42,"trapping-rain-water","Trapping Rain Water"),P(85,"maximal-rectangle","Maximal Rectangle"),P(503,"next-greater-element-ii","Next Greater II")]},

  interval:{n:"Sort and merge \u00b7 sweep line",t:"O(n log n)",s:"O(n)",
    sig:"<b>Signal:</b> overlapping ranges \u2014 merge them, count how many overlap at once, or find the minimum removals to make them disjoint.",
    why:"Sort by start and merge adjacent overlaps in one pass. When the question is instead how many are concurrent, split each interval into a +1 event at start and a -1 at end, sort the events, and sweep \u2014 the running total is the concurrency.",
    code:"<span class='cm'># merge</span>\nivs.sort(key=<span class='kw'>lambda</span> x: x[<span class='nu'>0</span>])\nout = [ivs[<span class='nu'>0</span>]]\n<span class='kw'>for</span> s, e <span class='kw'>in</span> ivs[<span class='nu'>1</span>:]:\n    <span class='kw'>if</span> s &lt;= out[-<span class='nu'>1</span>][<span class='nu'>1</span>]: out[-<span class='nu'>1</span>][<span class='nu'>1</span>] = max(out[-<span class='nu'>1</span>][<span class='nu'>1</span>], e)\n    <span class='kw'>else</span>:                out.append([s, e])\n\n<span class='cm'># max concurrency \u2014 sweep line</span>\nev = [(s, <span class='nu'>1</span>) <span class='kw'>for</span> s, e <span class='kw'>in</span> ivs] + [(e, -<span class='nu'>1</span>) <span class='kw'>for</span> s, e <span class='kw'>in</span> ivs]\nev.sort()                     <span class='cm'># -1 sorts before +1 at ties</span>\ncur = best = <span class='nu'>0</span>\n<span class='kw'>for</span> _, d <span class='kw'>in</span> ev:\n    cur += d; best = max(best, cur)",
    warn:"Ties decide the answer. If intervals are half-open, a meeting ending at 10 does not conflict with one starting at 10 \u2014 so the -1 event must sort first. Sorting <code>(time, delta)</code> gets this right for free because -1 &lt; +1; sorting by time alone does not.",
    say:"Sorting by start is what makes a single linear merge sufficient \u2014 once sorted, any overlap must be with the immediately preceding interval.",
    lc:[P(56,"merge-intervals","Merge Intervals"),P(57,"insert-interval","Insert Interval"),P(435,"non-overlapping-intervals","Non-overlapping Intervals"),P(452,"minimum-number-of-arrows-to-burst-balloons","Burst Balloons"),P(253,"meeting-rooms-ii","Meeting Rooms II")]},

  fastslow:{n:"Fast and slow pointers",t:"O(n)",s:"O(1)",
    sig:"<b>Signal:</b> detect a cycle, find the midpoint, or reach the k-th element from the end \u2014 in one pass with no extra memory.",
    why:"Two pointers moving at different speeds. If a cycle exists the fast one laps the slow one and they must meet. For the cycle entry: after they meet, reset one pointer to the head and advance both one step at a time \u2014 they meet exactly at the entrance.",
    code:"slow = fast = head\n<span class='kw'>while</span> fast <span class='kw'>and</span> fast.next:\n    slow = slow.next\n    fast = fast.next.next\n    <span class='kw'>if</span> slow <span class='kw'>is</span> fast: <span class='kw'>break</span>\n<span class='kw'>else</span>:\n    <span class='kw'>return</span> <span class='kw'>None</span>              <span class='cm'># no cycle</span>\n\nslow = head                     <span class='cm'># find the entry point</span>\n<span class='kw'>while</span> slow <span class='kw'>is</span> <span class='kw'>not</span> fast:\n    slow, fast = slow.next, fast.next\n<span class='kw'>return</span> slow",
    warn:"Guard both <code>fast</code> and <code>fast.next</code> before stepping twice, or an even-length list dereferences null. This also applies to arrays under an implicit next function \u2014 which is exactly how LC 287 is solved in O(1) space.",
    say:"Floyd's algorithm gives cycle detection in O(1) space, where the obvious hash-set solution costs O(n).",
    lc:[P(141,"linked-list-cycle","Linked List Cycle"),P(142,"linked-list-cycle-ii","Cycle II"),P(876,"middle-of-the-linked-list","Middle of List"),P(287,"find-the-duplicate-number","Find the Duplicate"),P(202,"happy-number","Happy Number")]},

  topk:{n:"Heap of size k \u00b7 quickselect",t:"O(n log k) \u00b7 O(n) avg",s:"O(k)",
    sig:"<b>Signal:</b> top k, k-th largest, k closest. You need partial order \u2014 never the fully sorted array.",
    why:"Sorting is O(n log n) and answers far more than was asked. A bounded min-heap of size k costs O(n log k). Quickselect partitions around a pivot and recurses into only one side, giving O(n) expected \u2014 but O(n\u00b2) worst case, so randomise the pivot.",
    code:"<span class='kw'>import</span> heapq\nheap = []\n<span class='kw'>for</span> v <span class='kw'>in</span> a:\n    heapq.heappush(heap, v)\n    <span class='kw'>if</span> len(heap) &gt; k: heapq.heappop(heap)   <span class='cm'># evict smallest</span>\n<span class='kw'>return</span> heap[<span class='nu'>0</span>]        <span class='cm'># k-th largest</span>\n\n<span class='cm'># C++ quickselect, O(n) expected:</span>\n<span class='cm'># nth_element(v.begin(), v.begin()+k, v.end());</span>",
    warn:"For the k-th <em>largest</em> you need a <em>min</em>-heap, and vice versa \u2014 getting this backwards is the classic slip. Also note this is O(n log k), not O(n log n); saying the latter in an interview throws away the whole reason you chose a heap.",
    say:"A bounded heap is O(n log k), and when k is small that is effectively linear \u2014 quickselect gets true O(n) expected if you can mutate the input.",
    lc:[P(215,"kth-largest-element-in-an-array","Kth Largest Element"),P(347,"top-k-frequent-elements","Top K Frequent"),P(973,"k-closest-points-to-origin","K Closest Points"),P(703,"kth-largest-element-in-a-stream","Kth Largest in Stream")]}
  };

  var NODES={
   root:{q:"What is the problem actually asking you to produce?",opts:[
     {t:"A contiguous subarray or substring",d:"The answer is a run of adjacent elements \u2014 never a scattered subset.",k:"contiguous",go:"contig"},
     {t:"A pair, triplet or subset hitting a numeric target",d:"Two Sum, 3Sum, closest pair, counting pairs under a bound.",k:"pair / triplet",go:"pair"},
     {t:"A position in sorted data \u2014 or a threshold that just barely works",d:"Search, insertion point, or minimise-the-maximum style optimisation.",k:"search",go:"search"},
     {t:"A rearrangement of the array, in place",d:"Usually paired with O(1) extra space or do not allocate.",k:"rearrange",go:"rearr"},
     {t:"For each element, its next or previous greater / smaller neighbour",d:"Spans, histograms, daily temperatures, trapped rain water.",k:"next greater",leaf:"mono"},
     {t:"Something about overlapping intervals or timeline events",d:"Meetings, bookings, merging ranges, counting concurrency.",k:"intervals",leaf:"interval"},
     {t:"A cycle, a midpoint, or the k-th element from the end",d:"One pass, no extra memory, possibly over an implicit sequence.",k:"cycle / midpoint",leaf:"fastslow"},
     {t:"The top k, or the k-th largest",d:"Partial order only \u2014 you never need the whole thing sorted.",k:"top k",leaf:"topk"}
   ]},
   contig:{q:"What about that contiguous range?",opts:[
     {t:"Maximise or minimise its sum",d:"Values may be negative. No constraint on the length.",k:"optimal sum",leaf:"kadane"},
     {t:"Longest / shortest / count of ranges satisfying a property",d:"Growing the window can only break the property; shrinking can only fix it.",k:"longest / shortest",leaf:"window"},
     {t:"Answer many range-sum queries on a fixed array",d:"The array never changes; queries arrive repeatedly.",k:"range queries",leaf:"prefix"},
     {t:"Apply many range updates, then read the array once",d:"Add v to every index in [l, r], thousands of times.",k:"range updates",leaf:"diff"}
   ]},
   pair:{q:"Can you afford to sort, and how large is the group?",opts:[
     {t:"Sortable \u2014 find a pair",d:"Sorting costs O(n log n) and buys you monotonicity.",k:"pair",leaf:"twoptr"},
     {t:"Sortable \u2014 find a triplet or quadruplet",d:"3Sum, 3Sum Closest, 4Sum.",k:"triplet",leaf:"ksum"},
     {t:"Cannot sort \u2014 you need the original indices, or O(n) is mandatory",d:"Order matters, or O(n log n) is already too slow.",k:"unsorted",leaf:"hash"}
   ]},
   search:{q:"What exactly are you binary-searching over?",opts:[
     {t:"The array itself \u2014 it is genuinely sorted",d:"Find a value, its first occurrence, or where it would be inserted.",k:"the array",leaf:"lower"},
     {t:"A sorted array that has been rotated",d:"One half is always still sorted \u2014 that is the invariant.",k:"rotated",leaf:"rotated"},
     {t:"The answer space, not the array",d:"Minimise the maximum load, fewest days, smallest capacity that works.",k:"the answer",leaf:"boa"}
   ]},
   rearr:{q:"What kind of rearrangement?",opts:[
     {t:"Partition into three categories",d:"Zeros/ones/twos, or less/equal/greater than a pivot.",k:"three-way",leaf:"dnf"},
     {t:"Drop or keep elements, preserving relative order",d:"Remove duplicates in place, move zeroes to the end, compact.",k:"compact",leaf:"readwrite"},
     {t:"The values are a permutation of 1..n",d:"Find the missing one, the duplicate, or all of them \u2014 in O(1) space.",k:"permutation",leaf:"cyclic"},
     {t:"Rotate the array by k",d:"Shift everything, wrapping around the ends.",k:"rotate",leaf:"rotate"}
   ]}
  };

  function ocls(t){
    if(/n log|n\u00B2|n\u00B3|n!|\^/.test(t)) return "Ob";
    if(/log/.test(t)) return "Ol";
    if(t==="O(1)") return "O1";
    return "On";
  }
  function bd(t){ return "<span class='O "+ocls(t)+"'>"+t+"</span>"; }

  var stack=[{id:"root",label:"start"}], full=false;
  function cur(){ return stack[stack.length-1].id; }

  function crumbs(){
    var h="<div class='crumbs'>";
    stack.forEach(function(s,i){
      if(i) h+="<span style='color:#332E55'>\u203A</span>";
      h+="<span class='crumb"+(i===stack.length-1?" cur":"")+"'>"+s.label+"</span>";
    });
    return h+"</div>";
  }

  function leafHTML(id){
    var x=L[id], h="<div class='leaf'>";
    h+="<h3>"+x.n+"</h3>";
    h+="<div class='badges'>"+bd(x.t)+bd(x.s+" space")+"</div>";
    h+="<p class='sig'>"+x.sig+"</p>";
    h+="<p class='sig' style='margin-top:14px'><b>Why it works.</b> "+x.why+"</p>";
    h+="<pre>"+x.code+"</pre>";
    h+="<div class='warn'><b>The trap:</b> "+x.warn+"</div>";
    h+="<div class='say'><b>Say this out loud:</b> \u201C"+x.say+"\u201D</div>";
    h+="<div class='mini'>drill these</div><div class='lcs'>";
    x.lc.forEach(function(p){
      h+="<a class='lc' target='_blank' rel='noopener' href='https://leetcode.com/problems/"+p[1]+"/'><s>"+p[0]+"</s>"+p[2]+"</a>";
    });
    return h+"</div></div>";
  }

  function mapHTML(){
    var h="<div class='map'>";
    NODES.root.opts.forEach(function(o){
      h+="<div class='mapcard'><h5>"+o.t+"</h5>";
      var kids: any = o.leaf ? [{leaf:o.leaf,d:o.d}] : (NODES as any)[o.go!].opts;
      kids.forEach(function(c){
        var x=L[c.leaf];
        h+="<div class='mi' data-leaf='"+c.leaf+"'><b>"+x.n+"</b><span>"+c.d+"</span><span style='color:#4A456E;margin-top:5px'>"+x.t+" time \u00b7 "+x.s+" space</span></div>";
      });
      h+="</div>";
    });
    return h+"</div>";
  }

  function draw(){
    var body=$("#dtBody");
    if(full){
      $("#dtMode").textContent="full map \u00b7 18 patterns";
      $("#dtToggle").textContent="guided router";
      $("#dtBack").style.display="none";
      body.innerHTML=mapHTML();
      body.querySelectorAll(".mi").forEach(function(el){
        el.addEventListener("click",function(){
          var id=el.dataset.leaf!;
          full=false;
          stack=[{id:"root",label:"start"},{id:id,label:L[id].n.toLowerCase()}];
          draw();
        });
      });
      return;
    }
    $("#dtMode").textContent="guided router";
    $("#dtToggle").textContent="show full map";
    $("#dtBack").style.display = stack.length>1 ? "" : "none";

    var id=cur(), h=crumbs();
    if(L[id]) h+=leafHTML(id);
    else{
      var nd=NODES[id];
      h+="<p class='dt-q'>"+nd.q+"</p><div class='dt-opts'>";
      nd.opts.forEach(function(o,i){
        h+="<button class='dt-opt' data-i='"+i+"'><span class='ar'>"+(i<9?"0":"")+(i+1)+"</span>"
          +"<span>"+o.t+"<em>"+o.d+"</em></span></button>";
      });
      h+="</div>";
    }
    body.innerHTML=h;
    body.querySelectorAll(".dt-opt").forEach(function(b){
      b.addEventListener("click",function(){
        var o=NODES[cur()].opts[+b.dataset.i!];
        stack.push({id:(o.leaf||o.go), label:o.k});
        draw();
      });
    });
  }

  $("#dtBack").addEventListener("click",function(){ if(stack.length>1){ stack.pop(); draw(); } });
  $("#dtToggle").addEventListener("click",function(){ full=!full; draw(); });
  draw();
})();

}
