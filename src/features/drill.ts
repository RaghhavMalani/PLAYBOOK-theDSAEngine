/* Ported from the verified single-file build. Behaviour is unchanged;
   only the module boundaries and typing are new. */
import { $, $$, esc, store } from "../lib/dom";
import { hl } from "../lib/highlight";
import { PATTERNS as PAT } from "../data/index";
import { topicName } from "../lib/topics";
import { showView } from "./router";
import { missedTopics } from "./mistakes";

export function initDrill(): void {
var TIME=12000;               // ms per question
  var qStart=0, tick: any = null, curQ: any = null, answered=false;
  var sess={seen:0,right:0,streak:0,best:0};

  /* Leitner boxes, scheduled by DATE rather than per-session.
     Box 0 (just failed) is due immediately so it returns within the sitting;
     everything above it drifts out across the weeks. */
  var INTERVAL_DAYS = [0, 1, 3, 7, 14];
  var DAY_MS = 86400000;

  function boxes(): any { return store("boxes") || {}; }
  function rec(p: any): any {
    var v = boxes()[p.n];
    if(v === undefined) return { box: 0, due: 0 };
    if(typeof v === "number") return { box: v, due: 0 };   // migrate the old shape
    return v;
  }
  function boxOf(p: any){ return rec(p).box; }
  function isDue(p: any){ return rec(p).due <= Date.now(); }
  function dueCount(){
    var b = boxes();
    return PAT.filter(function(p: any){ return b[p.n] !== undefined && isDue(p); }).length;
  }
  function setBox(n: any, v: any){
    var b = boxes();
    b[n] = { box: v, due: Date.now() + INTERVAL_DAYS[Math.min(4, v)]! * DAY_MS };
    store("boxes", b);
  }

  function shell(){
    $("#v-drill").innerHTML=[
'<div class="tag"><i></i><span>recall // signal → pattern under a clock</span></div>',
'<h2 class="mod">Drill</h2>',
'<p class="brief">Reading patterns feels like learning. It is not. <b>Recall</b> is. You get twelve seconds to name the pattern from its signal — the same window you get in a real round before the interviewer notices you are stuck. Wrong answers come back sooner; correct ones drift further out.</p>',
'<div class="subtabs" id="dModes">',
'  <button class="subtab on" data-d="quiz">⚡ recall drill</button>',
'  <button class="subtab" data-d="stats">▦ progress</button>',
'  <button class="subtab" data-d="mock">⏱ mock oa timer</button>',
'</div>',
'<div id="dQuiz"></div>',
'<div id="dStats" style="display:none"></div>',
'<div id="dMock" style="display:none"></div>'
    ].join("");
    $$("#dModes .subtab").forEach(function(b){
      b.onclick=function(){
        $$("#dModes .subtab").forEach(function(x){x.classList.remove("on");});
        b.classList.add("on");
        $("#dQuiz").style.display  = b.dataset.d==="quiz" ?"":"none";
        $("#dStats").style.display = b.dataset.d==="stats"?"":"none";
        $("#dMock").style.display  = b.dataset.d==="mock" ?"":"none";
        if(b.dataset.d==="stats") drawStats();
        if(b.dataset.d==="mock")  drawMock();
        if(b.dataset.d!!=="quiz")  clearInterval(tick);
        else nextQ();
      };
    });
    nextQ();
  }

  function weightedPick(){
    /* Two signals combined:
         - Leitner box: what you got wrong recently comes back sooner
         - mistake log: topics you have ACTUALLY missed get up to 3x the weight
       The second is what makes this personal rather than generic. */
    var missed = missedTopics();
    var pool: any = [], duePool: any = [];
    PAT.forEach(function(p: any){
      var w = Math.max(1, 5 - boxOf(p));
      var m = missed.get(p.t) || 0;
      if(m > 0) w *= Math.min(3, 1 + m * 0.5);   // topics you have ACTUALLY missed
      var n = Math.round(w);
      for(var i=0;i<n;i++){ pool.push(p); if(isDue(p)) duePool.push(p); }
    });
    /* prefer what is scheduled; fall back to everything when nothing is due, so the
       drill never runs out of questions */
    var use = duePool.length ? duePool : pool;
    return use[Math.floor(Math.random()*use.length)];
  }

  function nextQ(){
    clearInterval(tick); answered=false;
    var correct=weightedPick();
    var others=PAT.filter(function(p){return p!==correct;});
    // prefer distractors from the same topic — makes it genuinely hard
    var same=others.filter(function(p){return p.t===correct.t;});
    var pool=same.length>=3?same:others;
    var  picks: any = [];
    while(picks.length<3 && pool.length){
      var i=Math.floor(Math.random()*pool.length);
      picks.push(pool.splice(i,1)[0]);
    }
    var opts=picks.concat([correct]).sort(function(){return Math.random()-0.5;});
    curQ={correct:correct,opts:opts};

    var sig=correct.sig.replace(/<[^>]+>/g,"").replace(/^Signal:\s*/,"");
    $("#dQuiz").innerHTML=[
'<div class="drillcard">',
'  <div class="timerbar"><i id="dTimer"></i></div>',
'  <div class="dmeta">'+esc(topicName(correct.t))+' · box '+boxOf(correct)+' / 4 · '+dueCount()+' due · streak '+sess.streak+'</div>',
'  <p class="dq">“'+esc(sig)+'”</p>',
'  <div class="subtle">which pattern is this?</div>',
'  <div class="dopts" id="dOpts"></div>',
'  <div id="dAfter" style="margin-top:20px"></div>',
'</div>'
    ].join("");
    var oh=$("#dOpts");
    opts.forEach(function(p,i){
      var b=document.createElement("button");
      b.className="dopt"; b.textContent=p.n; b.dataset.i=i;
      b.onclick=function(){ answer(p,b); };
      oh.appendChild(b);
    });
    qStart=Date.now();
    tick=setInterval(function(){
      var left=1-(Date.now()-qStart)/TIME;
      if(left<=0){ clearInterval(tick); if(!answered) answer(null,null); return; }
      $("#dTimer").style.width=(left*100)+"%";
    },60);
  }

  function answer(chosen,btn){
    if(answered) return;
    answered=true; clearInterval(tick);
    var ok = chosen===curQ.correct;
    sess.seen++;
    if(ok){ sess.right++; sess.streak++; sess.best=Math.max(sess.best,sess.streak); setBox(curQ.correct.n, Math.min(4,boxOf(curQ.correct)+1)); }
    else  { sess.streak=0; setBox(curQ.correct.n, 0); }

    $$("#dOpts .dopt").forEach(function(b,i){
      b.disabled=true;
      if(curQ.opts[i]===curQ.correct) b.classList.add("right");
      else if(b===btn) b.classList.add("wrong");
    });
    var p=curQ.correct;
    $("#dAfter").innerHTML=[
ok?'<div class="say"><b>Correct.</b> Moved to box '+boxOf(p)+' — you will see it less often now.</div>'
  :'<div class="warn"><b>'+(chosen?'Not quite.':'Out of time.')+'</b> Back to box 0 — this one comes back soon.</div>',
'<div class="card" style="margin-top:12px">',
'  <h4>'+esc(p.n)+' <span style="font-size:11px;color:var(--dim)">'+esc(p.tc)+' · '+esc(p.sc)+' space</span></h4>',
'  <p style="font-size:13.5px;color:var(--dim);margin:0 0 12px">'+p.why+'</p>',
'  <pre class="src" style="border-top:1px solid var(--line)">'+hl(p.py,"py")+'</pre>',
'</div>',
'<div class="btnrow" style="margin-top:14px">',
'  <button class="btn on" id="dNext">next →  <span style="opacity:.6">(enter)</span></button>',
'  <button class="btn" id="dOpen">open full pattern</button>',
'  <span style="font-family:var(--mono);font-size:11px;color:var(--dim);margin-left:6px">session '+sess.right+' / '+sess.seen+' · best streak '+sess.best+'</span>',
'</div>'
    ].join("");
    $("#dNext").onclick=nextQ;
    $("#dOpen").onclick=function(){
      showView("patterns");
      var q=$("#pq"); q.value=p.n; q.dispatchEvent(new Event("input",{bubbles:true}));
    };
  }

  function drawStats(){
    var b=boxes(), counts=[0,0,0,0,0];
    PAT.forEach(function(p){ counts[boxOf(p)]++; });
    var mastered=counts[4], weak=PAT.filter(function(p){return boxOf(p)===0 && b[p.n]!==undefined;});
    var untouched=PAT.filter(function(p){return b[p.n]===undefined;});
    $("#dStats").innerHTML=[
'<div class="boxes">',
'  <div class="box"><div class="bk">box 0 · relearn</div><div class="bv" style="color:var(--mag)">'+counts[0]+'</div></div>',
'  <div class="box"><div class="bk">box 1</div><div class="bv" style="color:var(--amb)">'+counts[1]+'</div></div>',
'  <div class="box"><div class="bk">box 2</div><div class="bv" style="color:var(--amb)">'+counts[2]+'</div></div>',
'  <div class="box"><div class="bk">box 3</div><div class="bv" style="color:var(--cyan)">'+counts[3]+'</div></div>',
'  <div class="box"><div class="bk">box 4 · solid</div><div class="bv" style="color:var(--lime)">'+mastered+'</div></div>',
'</div>',
'<div class="grid2" style="margin-top:20px">',
'<div class="card"><h5>needs work — drill these first</h5>'+
 (weak.length?'<div class="chips">'+weak.map(function(p){return "<span class='chip'>"+esc(p.n)+"</span>";}).join("")+'</div>'
             :'<p style="color:var(--dim);font-size:13.5px;margin:0">Nothing in box 0 yet. Run the drill and this fills up with exactly what to review.</p>')+
'</div>',
'<div class="card"><h5>not seen yet <s style="color:var(--dim);font-family:var(--mono);font-size:11px">'+untouched.length+'</s></h5>'+
 '<p style="color:var(--dim);font-size:13.5px;margin:0 0 12px">Patterns the drill has not shown you. Coverage is the point — an untested pattern is an unknown pattern.</p>'+
 '<div class="chips">'+untouched.slice(0,24).map(function(p){return "<span class='chip'>"+esc(p.n)+"</span>";}).join("")+
 (untouched.length>24?"<span class='chip'>+"+(untouched.length-24)+" more</span>":"")+'</div></div>',
'</div>',
'<div class="card" style="margin-top:16px"><h5>review schedule</h5>'+
 '<p style="color:var(--dim);font-size:13px;margin:0 0 10px">Boxes carry a <b>due date</b>, so reviews spread across your weeks instead of one sitting. A failed pattern goes straight back into rotation; correct answers drift out.</p>'+
 '<div class="boxes" style="margin:0">'+
   INTERVAL_DAYS.map(function(d: any, i: number){
     return "<div class='box'><div class='bk'>box "+i+"</div><div class='bv' style='font-size:15px;color:var(--cyan)'>"+(d===0?"now":"+"+d+"d")+"</div></div>";
   }).join("")+
 '</div></div>'+
 '<div class="btnrow" style="margin-top:18px"><button class="btn mag" id="dReset">reset all progress</button></div>'
    ].join("");
    $("#dReset").onclick=function(){
      if(confirm("Reset every box back to 0?")){ store("boxes",{}); drawStats(); }
    };
  }

  function drawMock(){
    $("#dMock").innerHTML=[
'<div class="grid2">',
'<div class="card"><h5>Meta · 45 min · two problems, both expected</h5>',
'  <div id="mkClock" style="font-family:var(--mono);font-size:56px;font-weight:700;letter-spacing:-.03em;color:var(--cyan);line-height:1.1">45:00</div>',
'  <div class="btnrow" style="margin-top:14px">',
'    <button class="btn on" id="mkStart">▶ start</button>',
'    <button class="btn mag" id="mkStop">reset</button>',
'    <select id="mkPreset"><option value="45">Meta · 45 min · 2 problems</option>',
'      <option value="90">Visa · 90 min · 4 problems</option>',
'      <option value="60">Google screen · 60 min</option>',
'      <option value="20">single problem · 20 min</option></select>',
'  </div>',
'  <p style="font-size:13px;color:var(--dim);margin-top:14px">Halfway through, you should be <b>writing code</b>, not still thinking. If you are not, say your brute force out loud and start from there — a working O(n²) scores; a silent optimal that never gets written does not.</p></div>',
'<div class="card"><h5>run it like the real thing</h5><ul>',
'  <li><b>Read the constraints first.</b> They tell you the target complexity.</li>',
'  <li><b>State your approach and its complexity before typing.</b> Every rubric scores this.</li>',
'  <li><b>No IDE.</b> Google and Meta disable execution — write it in a plain text box.</li>',
'  <li><b>Narrate continuously.</b> Silence reads as being stuck.</li>',
'  <li><b>Last 5 minutes:</b> stop coding, trace your solution on n=0, n=1 and a duplicate-heavy input out loud.</li>',
'</ul></div></div>'
    ].join("");
    var total=45*60, left=total, run: any = null;
    function paint(){
      var m=Math.floor(left/60), s=left%60;
      var el=$("#mkClock");
      el.textContent=m+":"+(s<10?"0":"")+s;
      el.style.color = left<=60 ? "var(--mag)" : left<=total*0.34 ? "var(--amb)" : "var(--cyan)";
    }
    $("#mkPreset").onchange=function(){ clearInterval(run); total=left=+(this as any).value*60; paint(); $("#mkStart").textContent="▶ start"; };
    $("#mkStart").onclick=function(){
      if(run){ clearInterval(run); run=null; (this as any).textContent="▶ resume"; return; }
      (this as any).textContent="❚❚ pause";
      run=setInterval(function(){ if(left<=0){ clearInterval(run); run=null; return; } left--; paint(); },1000);
    };
    $("#mkStop").onclick=function(){ clearInterval(run); run=null; left=total; paint(); $("#mkStart").textContent="▶ start"; };
    paint();
  }

  document.addEventListener("keydown",function(e){
    if(!$("#v-drill")||!$("#v-drill").classList.contains("on")) return;
    var tag=(((e.target as HTMLElement | null)?.tagName)||"").toLowerCase();
    if(tag==="input"||tag==="textarea"||tag==="select") return;
    if(e.key==="Enter" && answered && $("#dNext")){ e.preventDefault(); nextQ(); }
    if(/^[1-4]$/.test(e.key) && !answered){
      var b=$$("#dOpts .dopt")[+e.key-1];
      if(b) b.click();
    }
  });

  shell();
}
