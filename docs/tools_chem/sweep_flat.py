"""The fourteenth measure, part 1: how wide a round's yield is spread, and how close lost and won rounds are to the pass mark.

Reads the runs of `sweep_run.py flat14 --arg <variant>,<player>,<runs>` (every round of nine played and written out in full).

    python sweep_flat.py spread old,p50,p0 [player]     the spread of the yield by round, each variant
    python sweep_flat.py near old,p50,p0 [player]       marks fitted to the same clear rates, then: near misses, near wins, the top mark
"""
import sys

import sweep_career as C

TOP = 8.0      # OVERREACT under the old rule; the `pow` command moves it with the power (path.js RULE.tiers is 8 to the power 0.5)


def spread(by, pl):
    runs = by.get(pl) or []
    out = []
    for i in range(9):
        col = [C.ratio(r[i]) for r in runs if len(r) > i and r[i][C.MET]]
        out.append((C.q(col, .1), C.q(col, .5), C.q(col, .9)))
    return out


def near_win(rd, mark, by=0.15):
    return C.cleared(rd, mark) and rd[C.TOT] < (1 + by) * mark * rd[C.PAR]


def table(by, pl, marks, top=TOP):
    runs = by[pl]
    res = C.apply(runs, marks)
    n = len(marks)
    lost = nearl = won = nearw = 0
    tops = 0
    for r in runs:
        for i in range(n):
            rd = r[i]
            if C.cleared(rd, marks[i]):
                won += 1
                nearw += 1 if near_win(rd, marks[i]) else 0
            else:
                lost += 1
                nearl += 1 if C.near(rd, marks[i]) else 0
            if rd[C.TOT] >= top * rd[C.PAR]:
                tops += 1
    res.update(near_all=100.0 * nearl / max(1, lost), near_win=100.0 * nearw / max(1, won), tops=tops / float(len(runs)))
    return res


if __name__ == '__main__':
    cmd = sys.argv[1]
    vs = sys.argv[2].split(',')
    pl = sys.argv[3] if len(sys.argv) > 3 else 'median'
    base = None
    for v in vs:
        by = C.load(v, 'flat14')
        if pl not in by:
            print(v, 'no runs')
            continue
        sp = spread(by, pl)
        if cmd == 'spread':
            print('%-6s runs %d  90th over 10th by round: %s | middle: %s' % (v, len(by[pl]), ' '.join('%5.1f' % (c / max(a, 1e-9)) for a, b, c in sp),
                                                                 ' '.join('%5.2f' % b for a, b, c in sp)))
            continue
        if base is None:
            base = C.apply(by[pl], C.MARKS['doctorate'])['rate']       # the first variant's clear rates under the marks as built
        marks = C.fit(by[pl], base)
        t = table(by, pl, marks)
        print('%-6s marks %s' % (v, ', '.join('%.2f' % m for m in marks)))
        print('       clear %s | wins %.2f%% | first lost round within 15%%: %.0f%% | every lost round: %.0f%% | wins within 15%% above: %.0f%% | rounds at the top mark, a run: %.2f'
              % (' '.join('%3.0f' % x for x in t['rate']), 100.0 * t['wins'] / t['n'], t['near'], t['near_all'], t['near_win'], t['tops']))
    if cmd == 'pow':
        # one rule for every multiplier: the yield is the old yield raised to a power (path.js FLAT.pow), the number to beat and
        # the marks with it, so the same rounds are won and lost; what changes is how far from the mark a round lands
        import copy
        src, exp = (sys.argv[4].split(':') + ['gentle'])[:2] if len(sys.argv) > 4 else ('g4', 'gentle')
        by0 = C.load(src, exp)
        for pl_ in C.PLAYERS:
            if pl_ not in by0:
                continue
            print(C.LABEL[pl_], 'runs', len(by0[pl_]))
            for g in [float(x) for x in vs]:
                runs = [[list(rd) for rd in r[:9]] for r in by0[pl_]]
                for r in runs:
                    for rd in r:
                        rd[C.TOT] = max(1.0, rd[C.TOT]) ** g
                        rd[C.PAR] = float(rd[C.PAR]) ** g
                marks = [m ** g for m in C.MARKS['doctorate']]
                t = table({pl_: runs}, pl_, marks, top=TOP ** g)
                col = [C.ratio(r[6]) for r in runs if r[6][C.MET]]
                print('  power %.2f | round 7, 90th over 10th: %5.1f | first lost round within 15%%: %2.0f%% | every lost round: %2.0f%% | won rounds within 15%% above: %2.0f%% | top mark, rounds a run: %.2f | wins %.2f%%'
                      % (g, C.q(col, .9) / max(1e-9, C.q(col, .1)), t['near'], t['near_all'], t['near_win'], t['tops'], 100.0 * t['wins'] / t['n']))
