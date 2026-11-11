# Factors for the number to beat, measured inside runs. Usage: python tools_factors.py <tag> <first> <last> <out.json>
# Reads a measure of the median player made with { all: true, pickRound: 'random' }, so that every kind of round is
# played whether or not a player would choose it. Fits log(total / (Par times stake)) = round + kind + molecule by
# least squares. An assay's kind is fitted apart for each act. A round that carries a molecule on has no molecule term.
import sys, os, json, io, math
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tools_rig as rig
tag, lo, hi, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
rows = [r for r in rig.load(tag, lo, hi) if r['player'] == 'median']
KINDS = ['plain', 'carry', 'broad', 'loose', 'each', 'back', 'scarce', 'short']; ASSAY = ['scarce', 'short', 'each', 'loose']
mols = sorted(set(r['mol'] for r in rows if r['mol'] and not r['carry']))
cols = ['r%d' % k for k in range(1, 10)] + ['k:' + k for k in KINDS[1:]] + ['a%d:%s' % (a, k) for a in (1, 2, 3) for k in ASSAY] + ['m:' + m for m in mols]
ix = {c: i for i, c in enumerate(cols)}
X = np.zeros((len(rows), len(cols))); y = np.zeros(len(rows))
for n, r in enumerate(rows):
    X[n, ix['r%d' % r['round']]] = 1
    if r['assay']: X[n, ix['a%d:%s' % (r['round'] // 3, r['kind'])]] = 1
    elif r['kind'] != 'plain': X[n, ix['k:' + r['kind']]] = 1
    if not r['carry'] and r['mol']: X[n, ix['m:' + r['mol']]] = 1
    y[n] = math.log(max(1, r['total']) / (r['par'] * r.get('stake', 1)))
b = np.linalg.lstsq(X, y, rcond=None)[0]
res = y - X @ b
kindf = {'plain': 1.0}; kindf.update({k: math.exp(b[ix['k:' + k]]) for k in KINDS[1:]})
assayf = {k: [0, 0, 0] for k in ASSAY}
for a in (1, 2, 3):
    v = [b[ix['a%d:%s' % (a, k)]] for k in ASSAY]; m = sum(v) / len(v)
    for k, x in zip(ASSAY, v): assayf[k][a - 1] = math.exp(x - m)
mv = [b[ix['m:' + m]] for m in mols]; mm = sum(mv) / len(mv)
molf = {m: math.exp(x - mm) for m, x in zip(mols, mv)}
print('rows', len(rows), 'spread of what is left (sd of log) %.2f, before the fit %.2f' % (res.std(), (y - y.mean()).std()))
print('kinds against plain:', {k: round(v, 2) for k, v in kindf.items()}, 'widest apart %.1f' % (max(kindf.values()) / min(kindf.values())))
print('assay kinds by act:', {k: [round(x, 2) for x in v] for k, v in assayf.items()})
print('molecules: least %.2f most %.2f, %.0f times apart' % (min(molf.values()), max(molf.values()), max(molf.values()) / min(molf.values())))
for m in sorted(molf, key=molf.get): print('  %-28s %.3f  (%d rounds)' % (m, molf[m], sum(1 for r in rows if r['mol'] == m and not r['carry'])))
json.dump({'kindf': kindf, 'assayf': assayf, 'molf': molf}, io.open(out, 'w', encoding='utf8'))
