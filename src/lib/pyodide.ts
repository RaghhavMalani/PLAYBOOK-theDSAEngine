/* Ported from the verified single-file build. Behaviour is unchanged;
   only the module boundaries and typing are new. */
declare global { interface Window { loadPyodide?: (o: { indexURL: string }) => Promise<any>; } }


export const PYVER="0.26.4";
export const PY_SOURCES=[
  {label:"local ./pyodide/",  js:"./pyodide/pyodide.js",                                             idx:"./pyodide/"},
  {label:"jsdelivr",          js:"https://cdn.jsdelivr.net/pyodide/v"+PYVER+"/full/pyodide.js",      idx:"https://cdn.jsdelivr.net/pyodide/v"+PYVER+"/full/"},
  {label:"jsdelivr (npm)",    js:"https://cdn.jsdelivr.net/npm/pyodide@"+PYVER+"/pyodide.js",        idx:"https://cdn.jsdelivr.net/npm/pyodide@"+PYVER+"/"},
  {label:"unpkg",             js:"https://unpkg.com/pyodide@"+PYVER+"/pyodide.js",                   idx:"https://unpkg.com/pyodide@"+PYVER+"/"},
  {label:"cdnjs",             js:"https://cdnjs.cloudflare.com/ajax/libs/pyodide/"+PYVER+"/pyodide.js", idx:"https://cdnjs.cloudflare.com/ajax/libs/pyodide/"+PYVER+"/"}
];
let PYODIDE: any = null;
let PYLOADING: Promise<any> | null = null;
export function loadScriptOnce(src){
  return new Promise<void>(function(res,rej){
    var s=document.createElement("script");
    s.src=src;
    s.onload=function(){ res(); };
    s.onerror=function(){ s.remove(); rej(new Error("blocked or unreachable")); };
    document.head.appendChild(s);
  });
}
export function pyodideHelp(tried){
  return "<b>Python could not be loaded.</b> Every source was blocked: "+tried.join(", ")+
   ".<br><br>This is almost always a network filter (college wifi, ISP, or an extension) blocking the CDNs. "+
   "<b>The permanent fix — takes two minutes and then works offline forever:</b>"+
   "<br>1. Download <code>pyodide-"+PYVER+".tar.bz2</code> from <a href='https://github.com/pyodide/pyodide/releases/tag/"+PYVER+"' target='_blank' rel='noopener'>the Pyodide releases page</a>"+
   "<br>2. Extract it. You'll get a folder named <code>pyodide</code>"+
   "<br>3. Put that folder <b>next to playbook.html</b>, so the path <code>pyodide/pyodide.js</code> works"+
   "<br>4. Reload this page and hit trace again — it will find the local copy first and never touch the network."+
   "<br><br><span style='color:var(--dim)'>Everything else on this site works without Python. Only the visualiser needs it.</span>";
}
export async function getPyodide(onStatus){
  if(PYODIDE) return PYODIDE;
  if(PYLOADING) return PYLOADING;
  PYLOADING=(async function(){
    var  tried: any = [];
    for(var i=0;i<PY_SOURCES.length;i++){
      var s=PY_SOURCES[i];
      try{
        onStatus("Loading Python from <b>"+s.label+"</b>… (first run only, ~10&nbsp;MB)");
        if(!window.loadPyodide) await loadScriptOnce(s.js);
        if(!window.loadPyodide) throw new Error("script loaded but loadPyodide missing");
        PYODIDE=await window.loadPyodide({indexURL:s.idx});
        onStatus("Python ready via <b>"+s.label+"</b>. Real CPython, running locally in your browser.","ok");
        PYLOADING=null;
        return PYODIDE;
      }catch(e){
        tried.push(s.label);
        try{ delete window.loadPyodide; }catch(e2){ window.loadPyodide=undefined; }
      }
    }
    PYLOADING=null;
    throw new Error("__HELP__"+JSON.stringify(tried));
  })();
  return PYLOADING;
}


export function traceHarness(limit){
  return [
"import sys, json, io as _vzio",
"_TR = []; _LIMIT = "+limit+"; _ERR = None; _BUF = _vzio.StringIO()",
"_STK = []; _CALLS = [0]; _MAXD = [0]",
"def _short(x):",
"    try: s = repr(x)",
"    except Exception: s = '?'",
"    return s if len(s) <= 14 else s[:13] + '\\u2026'",
"def _safe(v):",
"    try:",
"        if v is None or isinstance(v, bool): return {'k':'s','d':repr(v)}",
"        if isinstance(v, (int, float)): return {'k':'n','d':repr(v),'n':v}",
"        if isinstance(v, str): return {'k':'s','d':(repr(v) if len(v)<=40 else repr(v[:37])+'\\u2026')}",
"        if isinstance(v, (list, tuple)):",
"            L = list(v)",
"            if L and len(L) <= 26 and all(isinstance(r, (list, tuple)) for r in L):",
"                w = max(len(r) for r in L)",
"                if w <= 26:",
"                    return {'k':'g','v':[[_short(x) for x in list(r)] for r in L],",
"                            'd':'grid %dx%d' % (len(L), w), 'len':len(L)}",
"            items = [_short(x) for x in L[:120]]",
"            body = ', '.join(items[:8]) + ('\\u2026' if len(L) > 8 else '')",
"            return {'k':'l','v':items,'d':'['+body+']','len':len(L)}",
"        if isinstance(v, dict):",
"            its = list(v.items())[:40]",
"            return {'k':'m','v':[[_short(a), _short(b)] for a, b in its],",
"                    'd':'{'+', '.join(_short(a)+': '+_short(b) for a,b in its[:6])+('\\u2026' if len(v)>6 else '')+'}','len':len(v)}",
"        if isinstance(v, (set, frozenset)):",
"            its = [_short(x) for x in list(v)[:40]]",
"            return {'k':'e','v':its,'d':'{'+', '.join(its[:6])+('\\u2026' if len(v)>6 else '')+'}','len':len(v)}",
"        return {'k':'o','d':type(v).__name__}",
"    except Exception:",
"        return {'k':'o','d':'?'}",
"def _tr(frame, event, arg):",
"    if frame.f_code.co_filename != '<vz>': return None",
"    if event == 'call':",
"        _CALLS[0] += 1",
"        try:",
"            c = frame.f_code",
"            names = c.co_varnames[:c.co_argcount]",
"            sig = c.co_name + '(' + ', '.join(_short(frame.f_locals.get(a)) for a in names) + ')'",
"        except Exception:",
"            sig = '?()'",
"        _STK.append(sig)",
"        if len(_STK) > _MAXD[0]: _MAXD[0] = len(_STK)",
"        return _tr",
"    if event == 'return':",
"        if _STK: _STK.pop()",
"        return _tr",
"    if event == 'line':",
"        if len(_TR) >= _LIMIT:",
"            raise RuntimeError('step limit reached - raise MAX STEPS or shrink the input')",
"        loc = {}",
"        for k, v in list(frame.f_locals.items()):",
"            if k.startswith('_'): continue",
"            loc[k] = _safe(v)",
"        _TR.append({'line': frame.f_lineno - 1, 'vars': loc, 'fn': frame.f_code.co_name,",
"                    'depth': len(_STK), 'stack': list(_STK), 'calls': _CALLS[0]})",
"    return _tr",
"_compiled = None",
"try:",
"    _compiled = compile(_SRC, '<vz>', 'exec')",
"except SyntaxError as e:",
"    _ERR = 'SyntaxError: ' + str(e)",
"if _compiled is not None:",
"    _stdout = sys.stdout",
"    sys.stdout = _BUF",
"    sys.settrace(_tr)",
"    try:",
"        exec(_compiled, {'__name__': '__main__'})",
"    except Exception as e:",
"        _ERR = type(e).__name__ + ': ' + str(e)",
"    finally:",
"        sys.settrace(None)",
"        sys.stdout = _stdout",
"_RESULT = json.dumps({'frames': _TR, 'out': _BUF.getvalue(), 'err': _ERR,",
"                      'calls': _CALLS[0], 'maxdepth': _MAXD[0]})"
  ].join("\n");
}


export function cxHarness(gen,sizes,budget){
  return [
"import sys, json, time, gc, random",
"random.seed(12345)",
"def _mk(kind, n):",
"    if kind == 'int': return n",
"    if kind == 'string': return ''.join(random.choice('abcdefghij') for _ in range(n))",
"    a = [random.randint(0, 1000000) for _ in range(n)]",
"    if kind == 'sorted': a.sort()",
"    if kind == 'revsorted': a.sort(reverse=True)",
"    return a",
"def _timed(fn, kind, n):",
"    reps = 1",
"    while True:",
"        args = [_mk(kind, n) for _ in range(reps)]",
"        gc.disable()",
"        t0 = time.perf_counter()",
"        for a in args: fn(a)",
"        d = time.perf_counter() - t0",
"        gc.enable()",
"        if d >= 0.03 or reps >= 256: return d / reps, reps",
"        reps *= 4",
"_PTS = []; _CXERR = None",
"try:",
"    _g = {'__name__': '__main__'}",
"    exec(compile(_SRC, '<cx>', 'exec'), _g)",
"    _fn = _g.get('solve')",
"    if _fn is None:",
"        raise RuntimeError('No function named solve(a) was found. Define  def solve(a):  and return anything.')",
"    _spent = 0.0",
"    for _n in " + JSON.stringify(sizes) + ":",
"        _d, _r = _timed(_fn, '" + gen + "', _n)",
"        _PTS.append([_n, _d, _r])",
"        _spent += _d * _r",
"        if _d > 0.30 or _spent > " + budget + ": break",
"except Exception as e:",
"    _CXERR = type(e).__name__ + ': ' + str(e)",
"_RESULT = json.dumps({'pts': _PTS, 'err': _CXERR})"
  ].join("\n");
}


export {};
