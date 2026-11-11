# Fits the Par curve to a measure made with go-on-after-a-miss runs. Usage: python fit.py <tag> <lo> <hi> <out par.json> [a s0 d]
# With a, s0 and d given it only reports what that curve would do on this measure.
import json, io, sys, math
import numpy as np
sys.path.insert(0, 'C:/Users/mgmcc/AppData/Local/Temp/claude/c2e091f86aaa20cc/4b5d48b3-c4d4-47b4-ad30-ef7d19555645/scratchpad/rig')
import rig
tag, lo, hi, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
rows = rig.load(tag, lo, hi); by = rig.runs_of(rows)
def mats(player):
    seeds = sorted(sd for (pl, sd), rs in by.items() if pl == player and all(r in rs for r in range(1, 10)))
    T = np.array([[by[(player, sd)][r]['total'] for r in range(1, 10)] for sd in seeds], float)
    M = np.array([[by[(player, sd)][r]['mult'] for r in range(1, 10)] for sd in seeds], float)
    return T / M
X = {p: mats(p) for p in ['novice', 'median', 'planner', 'greedy']}
print('runs', {p: len(X[p]) for p in X})
raw = np.median(X['median'], axis=0)
print('median player, median of total over the molecule and stake factor, by round:', [int(v) for v in raw])
print('step from round to round:', [round(raw[i + 1] / raw[i], 2) for i in range(8)])
TG = {p: np.array(rig.TARGET[p], float) for p in rig.TARGET}
LAST = np.array([1] * 8 + [1.15])
def curve(a, s0, d):
    p = [a]
    for k in range(8): p.append(p[-1] * max(1.05, s0 - d * k))
    return np.array(p)
def rates(x, par):
    ok = x >= par * LAST
    alive = np.cumprod(ok, axis=1)
    reach = np.concatenate([np.ones((len(x), 1)), alive[:, :-1]], axis=1)
    n = reach.sum(axis=0)
    return 100 * (reach * ok).sum(axis=0) / np.maximum(1, n), n
def score(a, s0, d):
    par = curve(a, s0, d)
    rm, _ = rates(X['median'], par); dm = np.abs(rm - TG['median'])
    rn, _ = rates(X['novice'], par); rp, _ = rates(X['planner'], par)
    return dm.max() + 0.02 * dm.sum() + 0.01 * (np.abs(rn - TG['novice']).sum() + np.abs(rp - TG['planner']).sum()), dm.max()
if len(sys.argv) > 5:
    best = (0, float(sys.argv[5]), float(sys.argv[6]), float(sys.argv[7]))
else:
    best = (1e9,)
    a0 = raw[0] / 3
    for s0 in np.arange(1.2, 6.01, 0.05):
        for d in np.arange(0, 0.8, 0.01):
            if s0 - 7 * d < 1.05: break
            for la in np.arange(-2.0, 2.01, 0.1):
                a = a0 * math.exp(la); sc = score(a, s0, d)[0]
                if sc < best[0]: best = (sc, a, s0, d)
    _, a, s0, d = best
    for s0b in np.arange(s0 - 0.05, s0 + 0.051, 0.01):
        for db in np.arange(max(0, d - 0.01), d + 0.011, 0.002):
            if s0b - 7 * db < 1.05: continue
            for la in np.arange(-0.12, 0.121, 0.02):
                ab = a * math.exp(la); sc = score(ab, s0b, db)[0]
                if sc < best[0]: best = (sc, ab, s0b, db)
_, a, s0, d = best
par = curve(a, s0, d)
print('fit: first %.0f, step %.3f falling by %.3f a round; whole climb %.0f times' % (a, s0, d, par[8] / par[0]))
print('par by round:', [int(v) for v in par])
print('worst miss for the median player: %.1f points' % score(a, s0, d)[1])
for p in ['novice', 'greedy', 'median', 'planner']:
    r, n = rates(X[p], par)
    print('%-8s' % p, ' '.join('%3.0f' % v for v in r), '| reached', ' '.join('%3d' % v for v in n), ('| target ' + ' '.join('%3d' % v for v in TG[p])) if p in TG else '')
if len(sys.argv) <= 5:
    json.dump({'first': a, 'step': round(s0, 3), 'fall': round(d, 4), 'after': round(max(1.2, s0 - 8 * d), 2), 'raw': [float(v) for v in raw]}, io.open(out, 'w', encoding='utf8'))
