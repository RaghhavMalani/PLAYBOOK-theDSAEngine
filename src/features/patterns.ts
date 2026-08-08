/* Ported from the verified single-file build. Behaviour is unchanged;
   only the module boundaries and typing are new. */
import { $, $$, store } from "../lib/dom";
import { hl, bd } from "../lib/highlight";
import { PATTERNS as PAT, TOPICS } from "../data/index";
import { topicName } from "../lib/topics";
import { showView } from "./router";
import type { Lang } from "../types";

export function traceButtonLabel(lang: Lang): string {
  return lang === "py" ? "trace it →" : "trace the Python →";
}

export function initPatterns(): void {
var curTopic="all", curLang: Lang = (store<Lang>("lang")||"py"), q="", openId: any = null, curTier="all";

  function conf(){ return store("conf")||{}; }
  function setConf(name,v){ var c=conf(); if(v===null) delete c[name]; else c[name]=v; store("conf",c); }

  function matches(p){
    if(curTopic!=="all" && p.t!==curTopic) return false;
    if(curTier!=="all" && (p.tier||"core")!==curTier) return false;
    if(!q) return true;
    var hay=(p.n+" "+p.sig+" "+p.why+" "+p.trap+" "+p.tc+" "+p.sc+" "+
             p.lc.map(function(x){return x[0]+" "+x[2];}).join(" ")).toLowerCase();
    return hay.indexOf(q)>=0;
  }
  function drawTopics(){
    var  counts: any = {}; PAT.forEach(function(p){counts[p.t]=(counts[p.t]||0)+1;});
    var c=conf(), solid=PAT.filter(function(p){return c[p.n]==="ok";}).length;
    var h="<button class='topic"+(curTopic==="all"?" on":"")+"' data-t='all'>All patterns <s>"+PAT.length+"</s></button>";
    TOPICS.forEach(function(t){
      if(!counts[t[0]]) return;
      h+="<button class='topic"+(curTopic===t[0]?" on":"")+"' data-t='"+t[0]+"'>"+t[1]+" <s>"+counts[t[0]]+"</s></button>";
    });
    h+="<div style='margin-top:14px;display:grid;gap:5px'>"
      +"<button class='topic"+(curTier==="all"?" on":"")+"' data-tier='all'>Every tier</button>"
      +"<button class='topic"+(curTier==="core"?" on":"")+"' data-tier='core'>Core <s>"+PAT.filter(function(p:any){return (p.tier||"core")==="core";}).length+"</s></button>"
      +"<button class='topic"+(curTier==="hard"?" on":"")+"' data-tier='hard'>Hard tier <s>"+PAT.filter(function(p:any){return p.tier==="hard";}).length+"</s></button>"
      +"</div>";
    h+="<div style='margin-top:16px;padding:11px 12px;border:1px solid var(--line);background:var(--panel)'>"
      +"<div class='subtle'>confident in</div>"
      +"<div style='font-family:var(--mono);font-size:22px;font-weight:700;color:"+(solid>PAT.length/2?"var(--lime)":"var(--amb)")+"'>"+solid+" / "+PAT.length+"</div></div>";
    $("#topics").innerHTML=h;
    $$("#topics .topic").forEach(function(b){
      b.onclick=function(){ curTopic=b.dataset.t!; openId=null; drawTopics(); drawPane(); };
    });
  }
  function drawPane(){
    var list=PAT.filter(matches);
    $("#pcount").textContent=list.length+" / "+PAT.length+" patterns";
    if(openId!==null && list.indexOf(PAT[openId])<0) openId=null;
    if(openId!==null){ drawDetail(PAT[openId]); return; }
    if(!list.length){ $("#pane").innerHTML="<div class='card'>Nothing matches that. Try a broader term — <code>window</code>, <code>heap</code>, <code>cycle</code>.</div>"; return; }
    var c=conf(), h="<div class='plist'>";
    list.forEach(function(p){
      var mark = c[p.n]==="ok" ? "<span style='color:var(--lime)'>● </span>" : c[p.n]==="weak" ? "<span style='color:var(--mag)'>● </span>" : "";
      h+="<button class='pcard' data-i='"+PAT.indexOf(p)+"'>"
       + "<div class='tp'>"+mark+topicName(p.t)+(p.tier==="hard"?" <b style='color:var(--mag)'>· HARD</b>":"")+"</div>"
       + "<h4>"+p.n+"</h4>"
       + "<p>"+p.sig.replace(/<[^>]+>/g,"").replace(/^Signal:\s*/,"")+"</p>"
       + "<div class='bs'>"+bd(p.tc)+bd(p.sc+" space")+"</div></button>";
    });
    $("#pane").innerHTML=h+"</div>";
    $$("#pane .pcard").forEach(function(b){
      b.onclick=function(){ openId=+b.dataset.i!; drawPane(); try{window.scrollTo(0,0);}catch(e: any){} };
    });
  }
  function drawDetail(p){
    var c=conf()[p.n];
    var h="<div class='console'><div class='console-bar'><span class='led'></span><span>"+topicName(p.t)+"</span>"
      + "<span style='flex:1'></span>"
      + "<button class='btn"+(c==="ok"?" on":"")+"' id='pok' style='padding:5px 10px;font-size:10px'>✓ got it</button>"
      + "<button class='btn mag' id='pweak' style='padding:5px 10px;font-size:10px'>⚑ shaky</button>"
      + "<button class='btn' id='pback' style='padding:5px 10px;font-size:10px'>← all</button></div>"
      + "<div class='console-body detail'>"
      + "<h3>"+p.n+"</h3><div class='badges'>"+bd(p.tc)+bd(p.sc+" space")+"</div>"
      + "<p class='sig'>"+p.sig+"</p>"
      + "<p class='sig'><b>Why it works.</b> "+p.why+"</p>"
      + (p.derive ? "<div class='mini'>how to derive it at a whiteboard</div><div class='derive'>"+p.derive+"</div>" : "")
      + (p.proof  ? "<div class='mini'>why it is correct</div><div class='proof'>"+p.proof+"</div>" : "")
      + "<div class='warn'><b>The trap:</b> "+p.trap+"</div>"
      + (p.edges && p.edges.length
          ? "<div class='mini'>edge cases that break correct-looking code</div>"
            + "<table class='t edget'><tr><th style='width:26%'>input</th><th style='width:40%'>what goes wrong</th><th>what to do</th></tr>"
            + p.edges.map(function(e: any){
                return "<tr><td><b>"+e.input+"</b></td><td style='color:var(--mag)'>"+e.effect+"</td>"
                     + "<td style='color:var(--dim)'>"+e.fix+"</td></tr>";
              }).join("") + "</table>"
          : "")
      + "<div class='say'><b>Say this out loud:</b> “"+p.say+"”</div>"
      + (p.followups && p.followups.length
          ? "<div class='mini'>the follow-up ladder \u00b7 they will not stop at the base problem</div>"
            + "<div class='ladder' id='ladder'>"
            + p.followups.map(function(f: any, i: number){
                return "<div class='rung' data-r='"+i+"'>"
                     + "<div class='rq'><s>"+(i+1)+"</s>"+f.q+"<em>reveal</em></div>"
                     + "<div class='ra'>"+f.a+"</div></div>";
              }).join("")
            + "</div>"
          : "")
      + (p.walk && p.walk.length
          ? "<div class='mini'>worked traces \u00b7 simple to hard</div>"
            + p.walk.map(function(w: any, wi: number){
                return "<div class='walk'>"
                  + "<div class='wt'><s>"+(wi+1)+"</s>"+w.title+"</div>"
                  + "<div class='wi'>"+w.input+"</div>"
                  + "<table class='t walkt'><tr>"
                  + w.cols.map(function(c: string){ return "<th>"+c+"</th>"; }).join("")
                  + "</tr>"
                  + w.rows.map(function(r: string[]){
                      return "<tr>"+r.map(function(c: string){ return "<td>"+c+"</td>"; }).join("")+"</tr>";
                    }).join("")
                  + "</table>"
                  + "<div class='wl'><b>What it teaches.</b> "+w.lesson+"</div>"
                  + "</div>";
              }).join("")
          : "")
      + "<div class='langtabs'>"
      +   "<button class='langtab"+(curLang==="py"?" on":"")+"' data-l='py'>python</button>"
      +   "<button class='langtab"+(curLang==="cpp"?" on":"")+"' data-l='cpp'>c++</button>"
      +   "<button class='langtab"+(curLang==="java"?" on":"")+"' data-l='java'>java</button>"
      +   "<span style='flex:1'></span><button class='langtab' id='pcopy'>copy</button>"
      +   "<button class='langtab' id='pviz' title='The visualiser executes CPython through Pyodide'>"+traceButtonLabel(curLang)+"</button></div>"
      + "<pre class='src' id='psrc'>"+hl(p[curLang],curLang)+"</pre>"
      + "<div class='mini'>drill these</div><div class='lcs'>"
      + p.lc.map(function(x){return "<a class='lc' target='_blank' rel='noopener' href='https://leetcode.com/problems/"+x[1]+"/'><s>"+x[0]+"</s>"+x[2]+"</a>";}).join("")
      + "</div></div></div>";
    $("#pane").innerHTML=h;
    $("#pback").onclick=function(){ openId=null; drawPane(); };
    $$("#ladder .rung").forEach(function(el){
      el.onclick=function(){ el.classList.toggle("open"); };
    });
    $("#pok").onclick=function(){ setConf(p.n, conf()[p.n]==="ok"?null:"ok"); drawTopics(); drawDetail(p); };
    $("#pweak").onclick=function(){ setConf(p.n,"weak"); drawTopics(); drawDetail(p); };
    $$("#pane .langtab[data-l]").forEach(function(b){
      b.onclick=function(){ curLang=b.dataset.l as Lang; store("lang",curLang); drawDetail(p); };
    });
    $("#pcopy").onclick=function(){
      if(navigator.clipboard) navigator.clipboard.writeText(p[curLang]);
      (this as any).textContent="copied"; var self: any = this;
      setTimeout(function(){ self.textContent="copy"; },1200);
    };
    $("#pviz").onclick=function(){
      $("#vzCode").value=p.py;
      showView("viz");
    };
  }
  $("#pq").addEventListener("input",function(){ q=(this as any).value.trim().toLowerCase(); openId=null; drawPane(); });
  drawTopics(); drawPane();
}
