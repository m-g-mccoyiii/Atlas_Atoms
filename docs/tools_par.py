# Par for each round, fitted to the pass rate and to the margin together.
# Usage: python tools_par.py <tag> <first> <last> <out par.json> [check]
# Reads a measure made with { all: true } on the factors already baked. Round by round, over the median player's runs
# still alive, Par is set where the worse of two misses is least: the pass rate against its target, counted in units
# of 12 points, and the median margin against its target, counted in units of a factor of 1.5. In round one the pass
# rate counts double. A round's Par is never under 1.15 times the round before. With "check" nothing is fitted: the measure is read against the numbers it was played on.
import sys, os, json, io, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tools_rig as rig
tag, lo, hi, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
rows = rig.load(tag, lo, hi); by = rig.runs_of(rows)
T = rig.TARGET['median']; M = rig.MARGIN
runs = {sd: rs for (pl, sd), rs in by.items() if pl == 'median' and all(r in rs for r in range(1, 10))}
x = {sd: [rs[r]['total'] / (rs[r]['number'] / rs[r]['par']) for r in range(1, 10)] for sd, rs in runs.items()}
alive = set(x); par = []
nov = sorted(rs[1]['total'] / (rs[1]['number'] / rs[1]['par']) for (pl, sd), rs in by.items() if pl == 'novice' and 1 in rs)
for r in range(9):
    v = sorted(x[sd][r] for sd in alive); med = v[len(v) // 2]; best = None
    for k in range(-200, 201):
        p = med / M[r] * math.exp(k * 0.005 * math.log(4))
        if r and p < par[-1] * 1.15: continue   # the number never falls: each round asks at least 1.15 times the last
        ps = 100.0 * sum(1 for t in v if t >= p) / len(v)
        a = abs(ps - T[r]) / 12.0 * (2 if r == 0 else 1); b = abs(math.log(med / p / M[r])) / math.log(1.5)
        sc = max(a, b) + 0.05 * (a + b)
        if best is None or sc < best[0]: best = (sc, p, ps, med / p)
    # Round one is set by the novice: the number is no higher than what 88 in 100 of the novice's first rounds reach,
    # so a player who lines a page up without thought still passes round one about nine times in ten. The median
    # player then passes it by more than its target margin; the marks above the number are what it plays for there.
    if r == 0 and nov:
        pn = nov[int(len(nov) * 0.12)]
        if pn < best[1]: best = (0, pn, 100.0 * sum(1 for t in v if t >= pn) / len(v), med / pn)
        print('round 1 by the novice: %d first rounds, 12th percentile %.0f, novice pass %.1f%%' % (len(nov), pn, 100.0 * sum(1 for t in nov if t >= best[1]) / len(nov)))
    par.append(best[1]); alive = set(sd for sd in alive if x[sd][r] >= best[1])
    print('round %d: Par %9.0f  pass %5.1f%% (target %d, off %+.1f)  margin %.2f (target %s, %.2f times off)  alive %d' % (r + 1, best[1], best[2], T[r], best[2] - T[r], best[3], M[r], max(best[3] / M[r], M[r] / best[3]), len(v)))
print('steps', [round(par[i + 1] / par[i], 2) for i in range(8)], 'whole climb %.0f times' % (par[8] / par[0]))
json.dump({'rounds': par, 'after': round(max(1.2, par[8] / par[7]), 2)}, io.open(out, 'w', encoding='utf8'))
