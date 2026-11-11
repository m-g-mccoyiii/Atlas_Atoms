# Par for each round of the bare game (docs/ORDER.md, layers 1 to 4), fitted on a measure of the four players.
# Usage: python tools_par_bare.py <tag> <first> <last> <out par.json> [top of the margin band, default 4] [least step, default 1.15]
# Reads a measure made with { all: true }. The number of a round is Par times the factors the round was played with,
# so the factors are divided out of every total first.
# One number cannot give the novice its pass rate and the median player a margin of 2 to 4: a round's total spreads
# about nine times for one player, and the two players are 3 to 18 times apart (docs/RIG.md, fourth measure).
#   Round one: where the worst of three misses is least: the novice's pass rate UNDER nine in ten, in units of 12
#     points and counted double; the median player's margin over the top of the band, in units of a factor of 1.5;
#     the median player's pass rate off its target, in units of 12 points.
#   Rounds two to five: the median player's median total, among its runs still alive, over the top of the band.
#     The owner asked for a margin of 2 to 4 here; the novice's targets in docs/BALANCE.md cannot be met with it.
#   Rounds six to nine, which no novice reaches: the median player's pass rate and margin against their targets.
# No round asks less than the least step times the one before.
import sys, os, json, io, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tools_rig as rig
tag, lo, hi, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
TOP = float(sys.argv[5]) if len(sys.argv) > 5 else 4.0
STEP = float(sys.argv[6]) if len(sys.argv) > 6 else 1.15
rows = rig.load(tag, lo, hi); by = rig.runs_of(rows)
T = rig.TARGET['median']; M = rig.MARGIN; NT = rig.TARGET['novice']
norm = lambda rs: [rs[r]['total'] / (rs[r]['number'] / rs[r]['par']) for r in range(1, 10)]
x = {sd: norm(rs) for (pl, sd), rs in by.items() if pl == 'median' and all(r in rs for r in range(1, 10))}
nx = {sd: norm(rs) for (pl, sd), rs in by.items() if pl == 'novice' and all(r in rs for r in range(1, 10))}
alive = set(x); nalive = set(nx); par = []
share = lambda v, p: 100.0 * sum(1 for t in v if t >= p) / len(v) if v else float('nan')
for r in range(9):
    v = sorted(x[sd][r] for sd in alive); med = v[len(v) // 2]
    nv = sorted(nx[sd][r] for sd in nalive)
    best = None
    for k in range(-400, 401):
        p = med * math.exp(k * 0.005 * math.log(4))
        if r and p < par[-1] * STEP: continue
        m = med / p; ps = share(v, p); c = abs(ps - T[r]) / 12.0
        if r == 0:
            a = max(0.0, NT[r] - share(nv, p)) / 12.0 * 2 if len(nv) >= 20 else 0.0
            b = max(0.0, math.log(m / TOP), math.log(2.0 / m)) / math.log(1.5)
        elif r < 5:
            a = 0.0; c = 0.0; b = abs(math.log(m / TOP)) / math.log(1.5)
        else:
            a = 0.0; b = abs(math.log(m / M[r])) / math.log(1.5)
        sc = max(a, b, c) + 0.05 * (a + b + c)
        if best is None or sc < best[0]: best = (sc, p, a, b, c)
    if best is None: best = (0, par[-1] * STEP, 0, 0, 0)
    p = best[1]
    print('round %d: Par %8.0f | median pass %5.1f%% (target %d, off %+.1f) margin %.2f | novice pass %5.1f%% of %d (target %d) | misses: novice %.2f, margin %.2f, median pass %.2f' % (r + 1, p, share(v, p), T[r], share(v, p) - T[r], med / p, share(nv, p), len(nv), NT[r], best[2], best[3], best[4]))
    par.append(p); alive = set(sd for sd in alive if x[sd][r] >= p); nalive = set(sd for sd in nalive if nx[sd][r] >= p)
print('steps', [round(par[i + 1] / par[i], 2) for i in range(8)], 'whole climb %.0f times' % (par[8] / par[0]))
json.dump({'rounds': par, 'after': round(max(1.2, par[8] / par[7]), 2)}, io.open(out, 'w', encoding='utf8'))
