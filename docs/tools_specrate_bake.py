# Writes SPEC_RATE into path.js (between "// SPEC RATE BEGIN" and "// SPEC RATE END") from the headless job specrate.js
# (.claude/headless/out/sr_b<round>.json for the bachelor's rounds, sr_d<round>.json for the longer runs when they exist).
# SPEC_RATE[set][round][spec] = { novice: [...], greedy: [...], median: [...] }: entry k-1 is the share of rounds in which that
# simulated player, aiming at the spec on a molecule dealt for the round, ended with a value of at least k (percent, whole numbers).
import io, json, os
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..', '.claude', 'headless', 'out')
tab = {}
for st in ('b', 'd'):
    for r in range(1, 13):
        f = os.path.join(OUT, 'sr_%s%d.json' % (st, r))
        if not os.path.exists(f): continue
        d = json.load(open(f))
        if not d.get('ok'): continue
        for name, pl in d['result']['specs'].items():
            row = {}
            for p, a in pl.items():
                t = sum(a)
                if not t: continue
                s = [round(100.0 * sum(a[k:]) / t) for k in range(1, len(a))]
                while s and s[-1] == 0: s.pop()
                row[p] = s
            if row: tab.setdefault(st, {}).setdefault(str(r), {})[name] = row
txt = 'const SPEC_RATE = ' + json.dumps(tab, separators=(',', ':')) + ';'
f = os.path.join(HERE, '..', 'apps', 'steam', 'js', 'react', 'path.js'); s = io.open(f, encoding='utf8', newline='').read(); nl = '\r\n' if '\r\n' in s else '\n'
head = '// SPEC RATE BEGIN (written by docs/tools_specrate_bake.py from the job specrate.js; replace it wholesale)'
if '// SPEC RATE BEGIN' not in s:
    a = s.index('// SPEC TABLE BEGIN'); s = s[:a] + head + nl + txt + nl + '// SPEC RATE END' + nl + s[a:]
else:
    a = s.index('// SPEC RATE BEGIN'); b = s.index('// SPEC RATE END'); s = s[:a] + head + nl + txt + nl + s[b:]
io.open(f, 'w', encoding='utf8', newline='').write(s)
print('wrote', {k: sorted(v) for k, v in tab.items()}, len(txt), 'bytes')
