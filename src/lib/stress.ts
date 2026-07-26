/**
 * Stress-testing harness.
 *
 * You write three functions: a brute force you trust, a fast one you do not, and a
 * generator. This runs them against thousands of random inputs, and on the first
 * disagreement it *shrinks* the input — repeatedly trying smaller inputs that still
 * disagree — until it has a minimal counterexample.
 *
 * That shrink step is the whole value. "It fails somewhere in a 500-element array" is
 * unactionable; "it fails on [1, 1]" is a two-minute fix. This is standard practice in
 * competitive programming and essentially unknown in interview prep.
 */

export interface StressResult {
  ok: boolean;
  trials: number;
  found: boolean;
  /** the raw failing input, before shrinking */
  raw?: string;
  /** the minimal failing input */
  minimal?: string;
  expected?: string;
  got?: string;
  /** how many shrink steps were productive */
  shrinks?: number;
  err?: string;
  /** a runnable snippet that reproduces it, for the tracer */
  repro?: string;
}

export function stressHarness(trials: number | string): string {
  return [
    "import json, copy, random",
    "_RES = {}",
    "def _run(fn, x):",
    "    return fn(copy.deepcopy(x))",
    "def _disagree(brute, fast, x):",
    "    try:",
    "        return _run(brute, x) != _run(fast, x)",
    "    except Exception:",
    "        return False        # a crash on a shrunk input is not the same bug",
    "def _shrink(brute, fast, inp):",
    "    cur = inp",
    "    steps = 0",
    "    changed = True",
    "    while changed and steps < 400:",
    "        changed = False",
    "        # 1. try each half - the big win, cuts length geometrically",
    "        if isinstance(cur, (list, str)) and len(cur) > 1:",
    "            for cand in (cur[:len(cur)//2], cur[len(cur)//2:]):",
    "                if len(cand) > 0 and _disagree(brute, fast, cand):",
    "                    cur = cand; changed = True; steps += 1; break",
    "            if changed: continue",
    "        # 2. drop one element at a time",
    "        if isinstance(cur, (list, str)) and len(cur) > 1:",
    "            for i in range(len(cur)):",
    "                cand = cur[:i] + cur[i+1:]",
    "                if len(cand) > 0 and _disagree(brute, fast, cand):",
    "                    cur = cand; changed = True; steps += 1; break",
    "            if changed: continue",
    "        # 3. pull values toward zero, so the numbers are readable",
    "        if isinstance(cur, list) and all(isinstance(x, int) for x in cur):",
    "            done = False",
    "            for i in range(len(cur)):",
    "                for t in (0, cur[i] // 2, 1):",
    "                    if t != cur[i]:",
    "                        cand = list(cur); cand[i] = t",
    "                        if _disagree(brute, fast, cand):",
    "                            cur = cand; changed = True; steps += 1; done = True; break",
    "                if done: break",
    "            if changed: continue",
    "        # 4. integer inputs: halve toward zero",
    "        if isinstance(cur, int) and cur != 0:",
    "            for t in (0, cur // 2, 1):",
    "                if t != cur and _disagree(brute, fast, t):",
    "                    cur = t; changed = True; steps += 1; break",
    "    return cur, steps",
    "try:",
    "    _g = {'__name__': '__main__'}",
    "    exec(compile(_SRC, '<stress>', 'exec'), _g)",
    "    _brute, _fast, _gen = _g.get('brute'), _g.get('fast'), _g.get('gen')",
    "    _missing = [n for n, f in (('brute', _brute), ('fast', _fast), ('gen', _gen)) if f is None]",
    "    if _missing:",
    "        raise RuntimeError('define ' + ', '.join(_missing) + ' - see the template')",
    "    _bad = None",
    "    _t = 0",
    "    for _t in range(1, " + String(trials) + " + 1):",
    "        _inp = _gen(random.Random(_t))",
    "        _e = _run(_brute, _inp)",
    "        _a = _run(_fast, _inp)",
    "        if _e != _a:",
    "            _bad = (_inp, _e, _a)",
    "            break",
    "    if _bad is None:",
    "        _RES = {'ok': True, 'trials': _t, 'found': False}",
    "    else:",
    "        _inp, _e, _a = _bad",
    "        _min, _steps = _shrink(_brute, _fast, _inp)",
    "        _me, _ma = _run(_brute, _min), _run(_fast, _min)",
    "        _RES = {'ok': False, 'trials': _t, 'found': True,",
    "                'raw': repr(_inp)[:400], 'minimal': repr(_min),",
    "                'expected': repr(_me), 'got': repr(_ma), 'shrinks': _steps,",
    "                'repro': 'a = ' + repr(_min) + '\\n\\n' + _SRC.split('def gen')[0].rstrip() +",
    "                         '\\n\\nprint(\"brute:\", brute(a))\\nprint(\"fast: \", fast(a))'}",
    "except Exception as e:",
    "    _RES = {'ok': False, 'trials': 0, 'found': False, 'err': type(e).__name__ + ': ' + str(e)}",
    "_RESULT = json.dumps(_RES)",
  ].join("\n");
}

export const STRESS_SAMPLES: readonly (readonly [string, string])[] = [
  [
    "Find the bug — max subarray seeded at 0",
    `def brute(a):
    # obviously correct, obviously slow
    best = a[0]
    for i in range(len(a)):
        s = 0
        for j in range(i, len(a)):
            s += a[j]
            best = max(best, s)
    return best

def fast(a):
    # Kadane, but seeded at 0 instead of a[0]
    best = cur = 0
    for v in a:
        cur = max(v, cur + v)
        best = max(best, cur)
    return best

def gen(rng):
    n = rng.randint(1, 8)
    return [rng.randint(-9, 9) for _ in range(n)]`,
  ],
  [
    "Find the bug — dedup that misses adjacent pairs",
    `def brute(a):
    out = []
    for v in a:
        if v not in out:
            out.append(v)
    return out

def fast(a):
    # only compares against the PREVIOUS element
    out = []
    for v in a:
        if not out or out[-1] != v:
            out.append(v)
    return out

def gen(rng):
    n = rng.randint(1, 8)
    return [rng.randint(0, 3) for _ in range(n)]`,
  ],
  [
    "Find the bug — binary search, hi off by one",
    `def brute(a):
    # first index with a[i] >= t.  t is deliberately ABOVE every element,
    # so the correct answer is len(a) - which is the case the bug misses.
    a = sorted(a)
    t = max(a) + 1
    for i, v in enumerate(a):
        if v >= t:
            return i
    return len(a)

def fast(a):
    a = sorted(a)
    t = max(a) + 1
    lo, hi = 0, len(a) - 1        # BUG: hi should be len(a), exclusive
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] < t:
            lo = mid + 1
        else:
            hi = mid
    return lo

def gen(rng):
    n = rng.randint(1, 7)
    return [rng.randint(0, 5) for _ in range(n)]`,
  ],
  [
    "Correct pair — this one should find nothing",
    `def brute(a):
    best = a[0]
    for i in range(len(a)):
        s = 0
        for j in range(i, len(a)):
            s += a[j]
            best = max(best, s)
    return best

def fast(a):
    best = cur = a[0]             # correctly seeded
    for v in a[1:]:
        cur = max(v, cur + v)
        best = max(best, cur)
    return best

def gen(rng):
    n = rng.randint(1, 8)
    return [rng.randint(-9, 9) for _ in range(n)]`,
  ],
  [
    "Blank template",
    `def brute(a):
    # slow but obviously correct
    return None

def fast(a):
    # the one you actually want to submit
    return None

def gen(rng):
    # rng is a seeded random.Random — keep inputs SMALL,
    # small failing cases are the point
    n = rng.randint(1, 8)
    return [rng.randint(-9, 9) for _ in range(n)]`,
  ],
];
