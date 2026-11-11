# Tier one (docs/LOOP.md): the three bare rounds of a first run. Reads a measure made with
#   simGo(tag, players, from, to, base, { tierNo: 1, tier: 0, all: true, rule: { co2: false } })
# and prints the gap between the players, a table of what other numbers would give, and every table of the fifth
# measure in docs/RIG.md.
# Usage: python tools_tier1.py <tag> <first file> <last file> [fit m1,m2,m3 | par p1,p2,p3 | baked] [out par.json]
#   fit:   Par of round r is the median player's median total (factors divided out) over the margin m
#   par:   read against these three numbers
#   baked: read against the number each round was played with
import sys, os, json, io, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tools_rig as rig
tag, lo, hi = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
mode = sys.argv[4] if len(sys.argv) > 4 else 'fit'
arg = sys.argv[5] if len(sys.argv) > 5 else '4,4,4'
PL = rig.PLAYERS; R3 = [1, 2, 3]
rows = rig.load(tag, lo, hi); by = rig.runs_of(rows)
runs = {pl: {sd: rs for (p, sd), rs in by.items() if p == pl and all(r in rs for r in R3)} for pl in PL}
med = rig.med; q = rig.q
norm = lambda row: row['total'] / row['mult']
def nice(v):
    mag = 10 ** max(0, int(math.floor(math.log10(max(10, v)))) - 1); return max(50, round(v / mag) * mag)
print('runs', {pl: len(runs[pl]) for pl in PL})
print('\nmedian total, factors divided out; spread is the 90th run over the 10th')
for pl in PL:
    print(' %-8s' % pl, ' '.join('%7d (%4.1f)' % (med([norm(rs[r]) for rs in runs[pl].values()]), q([norm(rs[r]) for rs in runs[pl].values()], 0.9) / max(1, q([norm(rs[r]) for rs in runs[pl].values()], 0.1))) for r in R3))
M = {pl: [med([norm(rs[r]) for rs in runs[pl].values()]) for r in R3] for pl in PL}
mean = lambda a: sum(a) / max(1, len(a))
Mn = {pl: [mean([rs[r]['total'] for rs in runs[pl].values()]) for r in R3] for pl in PL}
for a, b in [('novice', 'greedy'), ('planner', 'greedy'), ('planner', 'median'), ('median', 'novice'), ('median', 'greedy')]:
    print(' %s over %s: medians %s   means %s' % (a, b, ' '.join('%.2f' % (M[a][i] / M[b][i]) for i in range(3)), ' '.join('%.2f' % (Mn[a][i] / Mn[b][i]) for i in range(3))))

def num_of(par):
    if par is None: return lambda row: row['number']
    return lambda row: nice(par[row['round'] - 1] * row['mult'])
def level(x, n): return rig.level(x, n)
def table(par, show=True):
    num = num_of(par); out = {}
    for pl in PL:
        rs_all = list(runs[pl].values()); n = len(rs_all)
        if not n: continue
        reach = [0, 0, 0]; ok = [0, 0, 0]; unc = [0, 0, 0]; win = 0; und = [0, 0, 0]; flags = [[0] * 5 for _ in R3]; beaten = 0
        for rs in rs_all:
            alive = True
            for i, r in enumerate(R3):
                row = rs[r]; nb = num(row); p = row['total'] >= nb
                unc[i] += p
                pg = row.get('pages') or [row['total']]
                if len(pg) >= 2 and level(pg[-2], nb) != level(pg[-1], nb): und[i] += 1
                flags[i][min(4, level(row['total'], nb))] += 1
                if alive:
                    reach[i] += 1; ok[i] += p
                    if p: beaten += 1
                    else: alive = False
            win += alive
        out[pl] = dict(n=n, reach=reach, passes=[100.0 * ok[i] / max(1, reach[i]) for i in range(3)], unc=[100.0 * unc[i] / n for i in range(3)], win=100.0 * win / n, und=[100.0 * und[i] / n for i in range(3)], flags=[[100.0 * f / n for f in fl] for fl in flags], beaten=beaten / n,
                       margin=[med([rs[r]['total'] / num(rs[r]) for rs in rs_all]) for r in R3])
    return out
def line(par):
    t = table(par); nv, md = t['novice'], t['median']
    return 'novice every run %s wins %4.1f (tries %.1f) | greedy wins %4.1f | median pass %s wins %4.1f margins %s last page %s | planner wins %4.1f' % (' '.join('%2.0f' % v for v in nv['unc']), nv['win'], 100 / max(0.1, nv['win']), t['greedy']['win'], ' '.join('%2.0f' % v for v in md['unc']), md['win'], ' '.join('%.1f' % v for v in md['margin']), ' '.join('%2.0f' % v for v in md['und']), t['planner']['win'])
fitpar = lambda ms: [M['median'][i] / ms[i] for i in range(3)]
if mode == 'fit':
    print('\nwhat other numbers would give (Par = the median player\'s median over the margin)')
    for ms in [(2, 2, 2), (3, 3, 3), (4, 4, 4), (4, 3, 3), (5, 4, 4), (5, 5, 5), (6, 5, 5)]:
        print(' margins %s: %s' % (ms, line(fitpar(ms))))
    ms = tuple(float(v) for v in arg.split(',')); par = [float('%.3g' % p) for p in fitpar(ms)]
    print('\nfitted at margins', ms, 'Par', par)
    if len(sys.argv) > 6: json.dump({'rounds123': par}, io.open(sys.argv[6], 'w')); print('wrote', sys.argv[6])
elif mode == 'par': par = [float(v) for v in arg.split(',')]
else: par = None
t = table(par)
print('\nround | ' + ' | '.join(PL))
for i in range(3):
    print(' %d | ' % (i + 1) + ' | '.join('%3.0f%% (%d)' % (t[pl]['passes'][i], t[pl]['reach'][i]) for pl in PL))
print(' wins all three: ' + ', '.join('%s %.1f' % (pl, t[pl]['win']) for pl in PL) + '   rounds beaten: ' + ', '.join('%s %.2f' % (pl, t[pl]['beaten']) for pl in PL))
print(' novice tries expected: %.1f' % (100 / max(0.1, t['novice']['win'])))
for pl in PL: print(' %-8s margin %s   last page changes the flag reached %s (every run)' % (pl, ' '.join('%.2f' % v for v in t[pl]['margin']), ' '.join('%2.0f%%' % v for v in t[pl]['und'])))
print('\nflags reached, share of every run: none / stable / unstable / volatile / overreact')
for pl in PL:
    print(' %-8s ' % pl + '   '.join('r%d %s' % (i + 1, '/'.join('%2.0f' % v for v in t[pl]['flags'][i])) for i in range(3)))
print('\nwhat the molecule did by itself on a page: share of pages with 1, 3, 6 or more; longest; mean')
for pl in PL:
    st = [int(x) for rs in runs[pl].values() for r in R3 for x in str(rs[r].get('casc', '')).split() if x != '']
    if st: print(' %-8s %4.1f %4.1f %4.1f  longest %d  mean %.2f' % (pl, 100.0 * sum(1 for x in st if x >= 1) / len(st), 100.0 * sum(1 for x in st if x >= 3) / len(st), 100.0 * sum(1 for x in st if x >= 6) / len(st), max(st), mean(st)))
print('\nmolecules in a round, median player: the median of total over number for each molecule played 8 times or more; most over least')
num = num_of(par)
for r in R3:
    bm = {}
    for rs in runs['median'].values(): bm.setdefault(rs[r]['mol'], []).append(rs[r]['total'] / num(rs[r]))
    ms_ = sorted((med(v), k, len(v)) for k, v in bm.items() if len(v) >= 8)
    if ms_: print(' round %d: %d molecules, %.2f to %.2f, apart %.1f   (least %s, most %s)' % (r, len(ms_), ms_[0][0], ms_[-1][0], ms_[-1][0] / max(0.01, ms_[0][0]), ms_[0][1], ms_[-1][1]))
print('\nround three by kind of assay, median player and novice: median of total over number, plays')
for pl in ['median', 'novice']:
    bk = {}
    for rs in runs[pl].values(): bk.setdefault(rs[3]['kind'], []).append(rs[3]['total'] / num(rs[3]))
    print(' %-8s ' % pl + '  '.join('%s %.2f (%d)' % (k, med(v), len(v)) for k, v in sorted(bk.items())))
print('\npages on which a dealt reaction had no use left, share of pages; by round')
for pl in PL:
    print(' %-8s ' % pl + ' '.join('%4.1f%%' % (100.0 * sum(rs[r].get('dryPg', 0) for rs in runs[pl].values()) / max(1, sum(rs[r].get('pgN', 0) for rs in runs[pl].values()))) for r in R3) + '   without scarce rounds: ' + '%4.1f%%' % (100.0 * sum(rs[r].get('dryPg', 0) for rs in runs[pl].values() for r in R3 if rs[r]['kind'] != 'scarce') / max(1, sum(rs[r].get('pgN', 0) for rs in runs[pl].values() for r in R3 if rs[r]['kind'] != 'scarce'))))
print('\ncoins held after each round (mean), share of pairs where the harder one was taken, pairs drawn again (per 100 rounds)')
for pl in PL:
    rr = [rs[r] for rs in runs[pl].values() for r in R3]; pairs = [x for x in rr if x.get('pairCoins', -1) >= 0 and x.get('pairGap', 0) >= 0.5]
    print(' %-8s coins %s   harder taken %4.1f%% of %d   drawn again %.1f   hand dealt again %.1f per 100 rounds' % (pl, ' '.join('%.1f' % mean([rs[r].get('coins', 0) for rs in runs[pl].values()]) for r in R3), 100.0 * sum(1 for x in pairs if x['pairCoins'] > 0) / max(1, len(pairs)), len(pairs), 100.0 * sum(x.get('redrew', 0) for x in rr) / max(1, len(rr)), 100.0 * sum(x.get('redraws', 0) for x in rr) / max(1, len(rr))))
