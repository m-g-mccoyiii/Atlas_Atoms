"""tools_molf2.py: the molecule factors (MOLF in path.js) fitted on molecules v2, 2026-11-12.

Measure (headless, docs/HEADLESS.md; copies of the jobs are in docs/tools_jobs/):
  hl.sh m3_molf.js m3_mp0 3400 "" set=pool part=0 parts=3 n=20      (parts 0 to 2; set=bank for the bank molecules, names m3_mb*)
  hl.sh m3_runs.js m3_rA0 1800 "" player=greedy from=9001 n=38 'opts={"all":true,"tier":0,"rule":{"bare":true,"co2":false}}'
Then:
  python docs/tools_molf2.py fit                 the factors of each way of fitting, and how far each narrows the spread on the runs
  python docs/tools_molf2.py bake <way>          writes the MOLF line of path.js (way: par, round, or none to clear it)
  python docs/tools_molf2.py check <prefix>      spread on runs measured with the baked table (out/<prefix>*.json)

A molecule's factor: the median round total of the greedy player on it (bare rounds, by itself, n seeds) over
  par   : the Par of the round (path.js PAR)
  round : the middle (median) of the medians of the pool molecules of the same round, so the factors of a round centre on 1
both held to LO..HI. ("par" is not used: a molecule by itself makes 0.55 to 0.74 of Par, which was fitted inside runs, so it
would lower every number to beat by a third. "round" is the one baked.) path.js takes the root of the factor (MOLD.pow 0.5). A molecule dealt in more than one round takes the geometric mean of its rounds.
The check: log(round total / number to beat) over every round of bare nine-round greedy runs; its interquartile range, with the
factor left out of the number and with it in. The number to beat is nice(par * molecule factor * kind factor * stake) as in path.js.
"""
import json, glob, math, re, sys, os, statistics as st
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, '.claude', 'headless', 'out')
PATH = os.path.join(ROOT, 'apps', 'steam', 'js', 'react', 'path.js')
LO, HI = 0.4, 2.5
POW = 0.5   # path.js MOLD.pow: the number to beat takes the root of the factor (the slope of in-run yield on the factor is 0.51)

def load(prefix):
    rows = []
    for f in sorted(glob.glob(os.path.join(OUT, prefix + '*.json'))):
        if f.endswith('.hb.json'): continue
        d = json.load(open(f))
        if not d.get('ok'): print('not ok:', f); continue
        rows += d['result']['rows']
    return rows

def nice(q):
    mag = 10 ** max(0, math.floor(math.log10(max(10, q))) - 1)
    return max(50, round(q / mag) * mag)

def iqr(v):
    v = sorted(v); q = st.quantiles(v, n=4); return q[2] - q[0]

def fit():
    rows = load('m3_mp') + load('m3_mb')
    med = {}   # (smiles, round) -> median, par, bank
    for smi, rnd, bank, par, tot in rows:
        t = [x for x in tot if x >= 0]
        if len(t) >= 8: med[(smi, rnd)] = (st.median(t), par, bank, len(t))
    centre = {}
    for r in range(1, 10):
        v = [m[0] for (s, rr), m in med.items() if rr == r and not m[2]]
        if v: centre[r] = st.median(v)
    ways = {'par': {}, 'round': {}}
    for way in ways:
        acc = {}
        for (smi, r), (m, par, bank, n) in med.items():
            base = par if way == 'par' else centre.get(r)
            if not base or m <= 0: continue
            acc.setdefault(smi, []).append(math.log(m / base))
        for smi, v in acc.items(): ways[way][smi] = round(min(HI, max(LO, math.exp(sum(v) / len(v)))), 3)
    return med, centre, ways

def spread(runs, table):
    out, by = [], {}
    for seed, rnd, mol, kind, total, par, mult, number, won in runs:
        if total <= 0 or not mol: continue
        f = table.get(mol, 1) if table else 1
        x = math.log(total / nice(par * mult * f ** POW)); out.append(x); by.setdefault(rnd, []).append(x)
    return iqr(out), st.pstdev(out), len(out), {r: round(iqr(v), 3) for r, v in sorted(by.items())}

def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'fit'
    if cmd == 'check':
        # runs played with the baked table: the number to beat as it was in play, and the same rounds with the factor taken out again
        runs = load(sys.argv[2]); s = open(PATH, encoding='utf-8').read(); t = json.loads(re.search(r'^const MOLF = (\{.*?\});', s, re.M).group(1))
        w = [math.log(r[4] / r[7]) for r in runs if r[4] > 0]; wo = spread([r[:6] + [r[6] / (t.get(r[2], 1) ** POW)] + r[7:] for r in runs], None)
        print('rounds %d, on a fitted molecule %d' % (len(w), sum(1 for r in runs if r[2] in t)))
        print('with the factor (the number as played): IQR of log(total / number to beat) %.3f  sd %.3f' % (iqr(w), st.pstdev(w)))
        print('without (factor divided out):           IQR %.3f  sd %.3f  by round %s' % (wo[0], wo[1], wo[3])); return
    med, centre, ways = fit()
    pool = sum(1 for k, m in med.items() if not m[2]); bank = len(med) - pool
    print('molecule-rounds measured: pool %d, bank %d; seeds a molecule %s' % (pool, bank, sorted(set(m[3] for m in med.values()))))
    print('round: Par, middle of the pool medians, ratio')
    for r in sorted(centre):
        par = [m[1] for (s, rr), m in med.items() if rr == r][0]; print('  %d: %d  %d  %.2f' % (r, par, centre[r], centre[r] / par))
    for way, t in ways.items():
        v = sorted(t.values()); print('%s: %d keys, min %.3f median %.3f max %.3f, at the low edge %d, at the high edge %d' % (way, len(v), v[0], st.median(v), v[-1], sum(1 for x in v if x <= LO), sum(1 for x in v if x >= HI)))
    runs = load('m3_rA')
    if runs:
        for name, t in [('no factor', None)] + list(ways.items()):
            a = spread(runs, t); print('%-10s rounds %d  IQR %.3f  sd %.3f  by round %s' % (name, a[2], a[0], a[1], a[3]))
        # the pool molecules only (the bank ones may not be fitted)
    if cmd == 'bake':
        way = sys.argv[2]; t = {} if way == 'none' else ways[way]
        s = open(PATH, encoding='utf-8', newline='').read()
        m = re.search(r'^const MOLF = \{.*$', s, re.M); assert m and len(re.findall(r'^const MOLF = ', s, re.M)) == 1
        body = json.dumps(dict(sorted(t.items())), separators=(',', ':'))
        note = '   // none: every molecule counts 1' if way == 'none' else '   // molecules v2, fitted 2026-11-12 (docs/tools_molf2.py, way "%s"): greedy median of %d bare rounds on the molecule by itself over %s, held to %s..%s; %d keys' % (way, max(m2[3] for m2 in med.values()), 'the Par of its round' if way == 'par' else 'the middle of its round\'s pool molecules', LO, HI, len(t))
        line = 'const MOLF = ' + body + ';' + note
        if m.group(0).endswith('\r'): line += '\r'
        s = s[:m.start()] + line + s[m.end():]
        open(PATH, 'w', encoding='utf-8', newline='').write(s); print('baked', way, len(t), 'keys')

main()
