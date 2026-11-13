"""sweep_report.py: the tables of docs/SWEEP.md and docs/SIGILS2.md from the rows under _sweep/.

  python sweep_report.py a | a2 | a8 | b | c | d | thr        prints markdown tables (and writes _sweep/report_<x>.md)
"""
import itertools
import json
import math
import os
import sys
from collections import Counter, defaultdict

import sweep_core as SC
import sweep_run as SR
import sweep_exps as X

POOL = SC.POOL18
OUT = []


def P(*a):
    s = ' '.join(str(x) for x in a)
    OUT.append(s)
    print(s)


def table(head, rows):
    P('| ' + ' | '.join(head) + ' |')
    P('|' + '|'.join(['---'] * len(head)) + '|')
    for r in rows:
        P('| ' + ' | '.join(str(x) for x in r) + ' |')
    P('')


def S(row, pl=None):
    return row['by'][pl] if 'by' in row else row


def good(name):
    return [r for r in SR.rows_of(name) if 'error' not in r]


def mean(a):
    a = list(a)
    return sum(a) / len(a) if a else 0.0


def se(a):
    a = list(a)
    if len(a) < 2:
        return 0.0
    m = mean(a)
    return math.sqrt(sum((x - m) ** 2 for x in a) / (len(a) - 1) / len(a))


def pct(x, d=0):
    return ('%%.%df' % d) % (100.0 * x)


def wilson(k, n):
    if not n:
        return (0, 0)
    z = 1.96
    p = k / n
    c = (p + z * z / (2 * n)) / (1 + z * z / n)
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return (c - h, c + h)


def fit(rows, yfn):
    """Least squares: y of a set = base + sum of its reagents' effects (effects centred on zero)."""
    import numpy as np
    Xm = np.zeros((len(rows), len(POOL) + 1))
    y = np.zeros(len(rows))
    for i, r in enumerate(rows):
        Xm[i, 0] = 1
        for g in r['rack']:
            Xm[i, 1 + POOL.index(g)] = 1
        y[i] = yfn(r)
    coef = np.linalg.lstsq(Xm, y, rcond=None)[0]
    k = len(rows[0]['rack'])
    eff = coef[1:] - coef[1:].mean()
    base = coef[0] + k * coef[1:].mean()
    pred = Xm[:, 1:] @ eff + base
    ss = float(((y - y.mean()) ** 2).sum())
    r2 = 1 - float(((y - pred) ** 2).sum()) / ss if ss else 0.0
    return float(base), {g: float(eff[i]) for i, g in enumerate(POOL)}, r2, pred


# ---------------------------------------------------------------------------------------------------------------
def rep_a():
    rows = [r for r in good('a_six') if 'by' in r]
    if not rows:
        return
    N = len(rows)
    P('### a. Every starting six (%d of 18,564 sets played)' % N)
    P('')
    hd = ['Player', 'Runs', 'Wins all three', 'Clear rounds 1, 2, 3', 'Kinds of reflex a run', 'Reflex steps a turn', 'Yield over Par, median']
    tb = []
    for pl in ('novice', 'greedy', 'median'):
        n = sum(S(r, pl)['n'] for r in rows)
        tb.append([pl, n, pct(sum(S(r, pl)['won'] for r in rows) / n, 1), ', '.join(pct(sum(S(r, pl)['met'][i] for r in rows) / n) for i in range(3)),
                   '%.2f' % mean(S(r, pl)['kinds_run'] for r in rows), '%.2f' % mean(S(r, pl)['steps_turn'] for r in rows),
                   '%.2f' % mean(S(r, pl)['ratio_med'] for r in rows)])
    table(hd, tb)
    # reagent effects
    fits = {}
    for pl in ('novice', 'greedy', 'median'):
        fits[pl] = fit(rows, lambda r, pl=pl: S(r, pl)['won'] / S(r, pl)['n'])
    fk = fit(rows, lambda r: S(r, 'median')['kinds_run'])
    fst = fit(rows, lambda r: S(r, 'median')['steps_turn'])
    ftv = fit(rows, lambda r: S(r, 'median')['tv'] or 0.0)
    dealt, used = Counter(), Counter()
    dom = defaultdict(list)
    for r in rows:
        m = S(r, 'median')
        for g in r['rack']:
            d, u = m['dealt'].get(g, 0), m['used'].get(g, 0)
            dealt[g] += d
            used[g] += u
            if d:
                dom[g].append(u / d)
    P('Each reagent, over every set that holds it (%d sets each).  Win columns: points of win rate a set gains by holding it, against the average reagent (a straight-line fit over all sets).  In the line: share of the hands it was dealt in where the median player (who takes the best line it can find for the spec) fired it.' % (N * 6 // 18))
    P('')
    hd = ['Reagent', 'Novice wins', 'Greedy wins', 'Median wins', 'In the line', 'the same, lowest and highest tenth of sets', 'Kinds a run', 'Steps a turn', 'Run-to-run difference']
    tb = []
    for g in sorted(POOL, key=lambda g: -fits['novice'][1][g]):
        ds = sorted(dom[g])
        tb.append([g, '%+.1f' % (100 * fits['novice'][1][g]), '%+.1f' % (100 * fits['greedy'][1][g]), '%+.1f' % (100 * fits['median'][1][g]),
                   pct(used[g] / max(1, dealt[g])), '%s to %s' % (pct(ds[len(ds) // 10]), pct(ds[len(ds) * 9 // 10])) if ds else '',
                   '%+.2f' % fk[1][g], '%+.2f' % fst[1][g], '%+.3f' % ftv[1][g]])
    table(hd, tb)
    P('Fit quality (share of the spread between sets that the straight-line fit explains): novice %.2f, greedy %.2f, median %.2f, kinds %.2f.  Base win rate of an average set: novice %s, greedy %s, median %s.' % (
        fits['novice'][2], fits['greedy'][2], fits['median'][2], fk[2], pct(fits['novice'][0], 1), pct(fits['greedy'][0], 1), pct(fits['median'][0], 1)))
    P('')
    # the spread between sets, by the fit
    for pl in ('novice', 'median'):
        pr = sorted(fits[pl][3])
        P('Predicted win rate of a set, %s: lowest %s, tenth %s, middle %s, ninetieth %s, highest %s.' % (
            pl, pct(pr[0]), pct(pr[len(pr) // 10]), pct(pr[len(pr) // 2]), pct(pr[len(pr) * 9 // 10]), pct(pr[-1])))
    P('')
    # the best and worst sets by a plain score: novice wins + kinds + difference, each in standard units
    import numpy as np
    z = lambda v: (v - v.mean()) / (v.std() or 1)
    score = z(fits['novice'][3]) + z(fk[3]) + z(ftv[3])
    order = np.argsort(-score)
    hd = ['Set', 'Novice wins (fit)', 'Median wins (fit)', 'Kinds a run (fit)', 'Difference (fit)']
    P('Best first-game sets by the fit (novice win rate, kinds of reflex a run and run-to-run difference, each in standard units, added):')
    P('')
    table(hd, [[', '.join(rows[i]['rack']), pct(fits['novice'][3][i]), pct(fits['median'][3][i]), '%.2f' % fk[3][i], '%.3f' % ftv[3][i]] for i in order[:12]])
    P('Worst:')
    P('')
    table(hd, [[', '.join(rows[i]['rack']), pct(fits['novice'][3][i]), pct(fits['median'][3][i]), '%.2f' % fk[3][i], '%.3f' % ftv[3][i]] for i in order[-6:]])
    for nm, rk in (('the six of a new game now', X.START), ('the six before ruling AF', sorted(X.OLD, key=POOL.index))):
        idx = [i for i, r in enumerate(rows) if list(r['rack']) == list(rk)]
        if idx:
            i = idx[0]
            rank = int((score > score[i]).sum()) + 1
            P('%s (%s): rank %d of %d; fit: novice %s, median %s, kinds %.2f.' % (nm, ', '.join(rk), rank, N, pct(fits['novice'][3][i]), pct(fits['median'][3][i]), fk[3][i]))
    P('')
    kinds = Counter()
    for r in rows:
        kinds.update(S(r, 'median')['kinds'])
    t = sum(kinds.values())
    P('Reflex steps by kind, median player, all sets: ' + ', '.join('%s %s' % (k, pct(v / t)) for k, v in kinds.most_common()) + '.')
    P('')
    tvs = sorted(S(r, 'median')['tv'] or 0 for r in rows)
    P('Run-to-run difference (how far apart two runs of the same set are in the kinds of reflex they show, 0 the same, 1 nothing shared), median player: tenth %.2f, middle %.2f, ninetieth %.2f.' % (
        tvs[len(tvs) // 10], tvs[len(tvs) // 2], tvs[len(tvs) * 9 // 10]))
    P('')


def rep_a2():
    rows = [r for r in good('a_six2') if 'by' in r]
    if not rows:
        return
    by = defaultdict(list)
    for r in rows:
        by[(r['tag'], tuple(r['rack']))].append(r)
    P('### a, stage two: the picked sets on unseen seeds (60 runs a set for the novice, greedy and median player, 20 for the planner)')
    P('')
    hd = ['Group', 'Set', 'Novice wins', 'Greedy', 'Median', 'Planner', 'Kinds a run (median)', 'Most-fired reagent, share of its hands']
    tb = []
    grp = defaultdict(lambda: defaultdict(lambda: [0, 0]))
    for (tag, rack), rs in sorted(by.items(), key=lambda kv: -sum(S(r, 'novice')['won'] for r in kv[1])):
        cell = []
        for pl in ('novice', 'greedy', 'median', 'planner'):
            k = sum(S(r, pl)['won'] for r in rs if pl in r['by'])
            n = sum(S(r, pl)['n'] for r in rs if pl in r['by'])
            grp[tag][pl][0] += k
            grp[tag][pl][1] += n
            lo, hi = wilson(k, n)
            cell.append('%s (%s to %s)' % (pct(k / n), pct(lo), pct(hi)) if n else '')
        d, u = Counter(), Counter()
        for r in rs:
            d.update(S(r, 'median')['dealt'])
            u.update(S(r, 'median')['used'])
        top = max(rack, key=lambda g: u[g] / max(1, d[g]))
        tb.append([tag, ', '.join(rack)] + cell + ['%.2f' % mean(S(r, 'median')['kinds_run'] for r in rs), '%s %s' % (top, pct(u[top] / max(1, d[top])))])
    show = [t for t in tb if t[0] in ('start', 'old')] + [t for t in tb if t[0] == 'top'][:10] + [t for t in tb if t[0] == 'bottom'][-5:]
    table(hd, show)
    P('By group (all sets of the group together):')
    P('')
    table(['Group', 'Sets', 'Novice wins', 'Greedy', 'Median', 'Planner'],
          [[t, sum(1 for k in by if k[0] == t)] + [pct(grp[t][pl][0] / grp[t][pl][1], 1) if grp[t][pl][1] else '' for pl in ('novice', 'greedy', 'median', 'planner')]
           for t in ('top', 'random', 'bottom', 'start', 'old') if t in grp])


def rep_a8():
    rows = [r for r in good('a_eight') if 'by' in r]
    if not rows:
        return
    P('### a. Carried eights: %d of the 43,758 sets, rounds 4 to 6, 4 runs a set and player' % len(rows))
    P('')
    tb = []
    for pl in ('greedy', 'median'):
        n = sum(S(r, pl)['n'] for r in rows)
        tb.append([pl, n, pct(sum(S(r, pl)['won'] for r in rows) / n, 1), ', '.join(pct(sum(S(r, pl)['met'][i] for r in rows) / n) for i in range(3)),
                   '%.2f' % mean(S(r, pl)['kinds_run'] for r in rows), '%.2f' % mean(S(r, pl)['steps_turn'] for r in rows)])
    table(['Player', 'Runs', 'Clears rounds 4, 5 and 6', 'Clear rounds 4, 5, 6', 'Kinds of reflex a run', 'Reflex steps a turn'], tb)
    fm = fit(rows, lambda r: S(r, 'median')['cleared'] / S(r, 'median')['n'])
    fg = fit(rows, lambda r: S(r, 'greedy')['cleared'] / S(r, 'greedy')['n'])
    fk = fit(rows, lambda r: S(r, 'median')['kinds_run'])
    fy = fit(rows, lambda r: mean(S(r, 'median')['logtot']))
    dealt, used = Counter(), Counter()
    for r in rows:
        dealt.update(S(r, 'median')['dealt'])
        used.update(S(r, 'median')['used'])
    table(['Reagent', 'Rounds cleared of 3, median', 'the same, greedy', 'In the line', 'Kinds a run', 'Yield (log)'],
          [[g, '%+.2f' % fm[1][g], '%+.2f' % fg[1][g], pct(used[g] / max(1, dealt[g])), '%+.2f' % fk[1][g], '%+.2f' % fy[1][g]]
           for g in sorted(POOL, key=lambda g: -fm[1][g])])
    P('Fit quality: median %.2f, greedy %.2f.  An average eight clears %.2f of the three rounds (median player).' % (fm[2], fg[2], fm[0]))
    P('')
    import numpy as np
    order = np.argsort(-fm[3])
    table(['Best eights by the fit', 'Rounds cleared of 3 (fit)', 'played'],
          [[', '.join(rows[i]['rack']), '%.2f' % fm[3][i], '%.2f' % (S(rows[i], 'median')['cleared'] / S(rows[i], 'median')['n'])] for i in order[:8]])
    table(['Worst eights by the fit', 'Rounds cleared of 3 (fit)', 'played'],
          [[', '.join(rows[i]['rack']), '%.2f' % fm[3][i], '%.2f' % (S(rows[i], 'median')['cleared'] / S(rows[i], 'median')['n'])] for i in order[-5:]])


def rep_b():
    import sweep_elements as SE
    rows = good('b_elem')
    if not rows:
        return
    by = defaultdict(list)
    for r in rows:
        by[r['tag']].append(r)
    ctl = by.get('control', [])
    P('### b. Elements (%d runs of nine rounds a cell, median player)' % sum(r['n'] for r in ctl))
    P('')

    def cell(rs):
        n = sum(r['n'] for r in rs)
        return n, sum(r['cleared'] for r in rs) / max(1, n), mean(r['steps_turn'] for r in rs), mean(r['kinds_run'] for r in rs), mean(mean(r['logtot']) for r in rs)
    c = cell(ctl)
    hd = ['Element', 'Reagent, reflex', 'Deal', 'Its reagent fired, share of hands', 'Its reflex, share of all steps', 'Final molecules that hold it', 'Rounds cleared of 9',
          'Steps a turn', 'Kinds a run', 'Yield (log)']
    tb = [['none (control)', 'reduce in its place', '', '', '', '', '%.2f' % c[1], '%.2f' % c[2], '%.2f' % c[3], '%.2f' % c[4]]]
    for el in SE.ORDER:
        d = SE.ELEMENTS[el]
        rg = d['reagents'][0]
        for curve in ('none', 'flat', 'rise'):
            rs = by.get('%s/%s' % (el, curve), [])
            if not rs:
                continue
            n, cl, st, kd, ly = cell(rs)
            dealt = sum(r['dealt'].get(rg, 0) for r in rs)
            used = sum(r['used'].get(rg, 0) for r in rs)
            kinds = Counter()
            for r in rs:
                kinds.update(r['kinds'])
            fl = sum(kinds.get(x, 0) + kinds.get(x + '_far', 0) for x in d['reflexes'])
            end = sum(p['el_end'] for r in rs for p in r.get('per', []))
            tot = sum(r['n'] for r in rs) * 9
            tb.append([el if curve == 'none' else '', '%s, %s' % (rg, ', '.join(d['reflexes']) or 'none') if curve == 'none' else '', curve, pct(used / max(1, dealt)),
                       pct(fl / max(1, sum(kinds.values())), 1), pct(end / max(1, tot)), '%.2f (%+.2f)' % (cl, cl - c[1]), '%.2f (%+.2f)' % (st, st - c[2]),
                       '%.2f (%+.2f)' % (kd, kd - c[3]), '%.2f (%+.2f)' % (ly, ly - c[4])])
    table(hd, tb)
    P('By round, rising deal: share of hands in which the element\'s reagent was fired when dealt (rounds 1 to 9), then share of rounds whose final molecule holds the element.')
    P('')
    tb = []
    for el in SE.ORDER:
        rs = by.get('%s/rise' % el, [])
        if not rs or not rs[0].get('per'):
            continue
        rg = SE.ELEMENTS[el]['reagents'][0]
        a, b = [], []
        for i in range(9):
            dl = sum(r['per'][i]['dealt'].get(rg, 0) for r in rs)
            us = sum(r['per'][i]['used'].get(rg, 0) for r in rs)
            a.append(pct(us / max(1, dl)))
            b.append(pct(sum(r['per'][i]['el_end'] for r in rs) / max(1, sum(r['n'] for r in rs))))
        tb.append([el, ' '.join(a), ' '.join(b)])
    table(['Element', 'Reagent fired when dealt, rounds 1 to 9', 'Final molecule holds it, rounds 1 to 9'], tb)


def _cells(name):
    by = defaultdict(list)
    for r in good(name):
        by[r['tag']].append(r)
    return by


def _paired(rs, base, key):
    """Mean difference of key (per run) between the cells, paired by job (the same seeds)."""
    b = {r['id'].rsplit('_', 1)[-1]: r for r in base}
    d = []
    for r in rs:
        o = b.get(r['id'].rsplit('_', 1)[-1])
        if o:
            d.append(key(r) - key(o))
    return mean(d), se(d), len(d)


def rep_c():
    import sweep_perks as SP
    by = _cells('c_hom1')
    if not by:
        return
    P('### c. Homunculi, each alone (median player; start six and the eight; paired with the same seeds and no creature)')
    P('')
    hd = ['Creature', 'Tapped, share of rounds', 'Bachelor: rounds cleared of 3', 'Master: of 6', 'Doctorate: of 9', 'Wins: bachelor, master, doctorate', 'Yield times (median of round ratios)',
          'Biggest round over Par', 'Line changed for it, share of pages']
    tb = []
    for nm in ('none',) + SP.ORDER:
        cells = []
        wins = []
        taps = rounds = 0
        ratio, rmax, dec = [], 0, [0, 0]
        for length, nr in (('bachelor', 3), ('master', 6), ('doctorate', 9)):
            rs = by.get('%s|start|%s' % (nm, length), []) + by.get('%s|eight|%s' % (nm, length), [])
            bs = by.get('none|start|%s' % length, []) + by.get('none|eight|%s' % length, [])
            n = sum(r['n'] for r in rs)
            if not n:
                cells.append('')
                wins.append('')
                continue
            cl = sum(r['cleared'] for r in rs) / n
            if nm == 'none':
                cells.append('%.2f' % cl)
            else:
                d, s, k = _paired(rs, bs, lambda r: r['cleared'] / r['n'])
                cells.append('%.2f (%+.2f, +-%.2f)' % (cl, d, 1.96 * s))
            wins.append(pct(sum(r['won'] for r in rs) / n))
            taps += sum(r['taps'] for r in rs)
            rounds += n * nr
            b2 = {r['id'].rsplit('_', 2)[-2] + r['id'].rsplit('_', 1)[-1] + r['id'].split('_')[2]: r for r in bs}
            for r in rs:
                o = b2.get(r['id'].rsplit('_', 2)[-2] + r['id'].rsplit('_', 1)[-1] + r['id'].split('_')[2])
                if o and r.get('tot') and o.get('tot'):
                    for x, y in zip(r['tot'], o['tot']):
                        ratio += [(a + 1.0) / (b + 1.0) for a, b in zip(x, y)]
                rmax = max(rmax, r['ratio_max'])
                dec[0] += r['dec'][0]
                dec[1] += r['dec'][1]
        ratio.sort()
        tb.append([SP.LABEL.get(nm, 'none'), pct(taps / max(1, rounds)) if nm != 'none' else ''] + cells + [', '.join(wins),
                  '%.2f' % ratio[len(ratio) // 2] if ratio and nm != 'none' else '', '%.0f' % rmax, pct(dec[0] / max(1, dec[1]), 1) if nm != 'none' else ''])
    table(hd, tb)
    P('The same by reagent set, master\'s (rounds cleared of 6, and taps a run):')
    P('')
    tb = []
    for nm in ('none',) + SP.ORDER:
        row = [SP.LABEL.get(nm, 'none')]
        for rk in ('start', 'eight'):
            rs = by.get('%s|%s|master' % (nm, rk), [])
            n = sum(r['n'] for r in rs)
            row.append('%.2f, %.1f taps' % (sum(r['cleared'] for r in rs) / n, sum(r['taps'] for r in rs) / n) if n else '')
        tb.append(row)
    table(['Creature', 'Start six', 'The eight (start six, reduce, hydroborate)'], tb)
    by2 = _cells('c_hom23')
    if not by2:
        return
    base = by.get('none|eight|master', [])
    bn = sum(r['n'] for r in base)
    bcl = sum(r['cleared'] for r in base) / max(1, bn)
    single = {}
    for nm in SP.ORDER:
        rs = by.get('%s|eight|master' % nm, [])
        n = sum(r['n'] for r in rs)
        single[nm] = sum(r['cleared'] for r in rs) / max(1, n) - bcl
    P('### c. Every pair and every triple (the eight, master\'s, median player, 8 runs a cell; no creature clears %.2f of 6)' % bcl)
    P('')
    res = []
    for tag, rs in by2.items():
        n = sum(r['n'] for r in rs)
        cl = sum(r['cleared'] for r in rs) / n
        names = tag.split('+')
        res.append((tag, len(names), cl - bcl, cl - bcl - sum(single[x] for x in names), max(r['ratio_max'] for r in rs), mean(r['ratio_med'] for r in rs),
                    sum(r['taps'] for r in rs) / n, sum(r['won'] for r in rs) / n))
    for k, label in ((2, 'pairs'), (3, 'triples')):
        sub = sorted([x for x in res if x[1] == k], key=lambda x: -x[2])
        P('%d %s.  Lift: rounds cleared of 6 over no creature.  Beyond the sum: the lift minus the lifts of its members alone (noise is about +-0.9 at 8 runs).' % (len(sub), label))
        P('')
        hd = ['Combination', 'Lift', 'Beyond the sum', 'Wins', 'Taps a run', 'Yield over Par, median', 'Biggest round over Par']
        fmt = lambda x: [' + '.join(SP.LABEL[n] for n in x[0].split('+')), '%+.2f' % x[2], '%+.2f' % x[3], pct(x[7]), '%.1f' % x[6], '%.2f' % x[5], '%.0f' % x[4]]
        table(hd, [fmt(x) for x in sub[:8]] + [['...', '', '', '', '', '', '']] + [fmt(x) for x in sub[-4:]])
        big = sorted(sub, key=lambda x: -x[4])[:5]
        P('Biggest single rounds among the %s: ' % label + '; '.join('%s %.0f times Par' % (' + '.join(SP.LABEL[n] for n in x[0].split('+')), x[4]) for x in big) + '.')
        P('')
    # each creature's mean lift inside pairs and triples
    tb = []
    for nm in SP.ORDER:
        p2 = [x[2] for x in res if x[1] == 2 and nm in x[0].split('+')]
        p3 = [x[2] for x in res if x[1] == 3 and nm in x[0].split('+')]
        o2 = [x[2] for x in res if x[1] == 2 and nm not in x[0].split('+')]
        tb.append([SP.LABEL[nm], '%+.2f' % single[nm], '%+.2f' % mean(p2), '%+.2f' % (mean(p2) - mean(o2)), '%+.2f' % mean(p3)])
    table(['Creature', 'Alone', 'Mean lift of the pairs it is in', 'against pairs without it', 'Mean lift of the triples it is in'], tb)


def rep_d(shortlist=True):
    import sigil2_rules as S2
    import sweep_perks as SP
    by = _cells('d_sig1')
    if not by:
        return {}
    P('### d. Sigils, each alone (median player; start six and the eight; paired with the same seeds and no sigil)')
    P('')
    base_used = Counter()
    for r in by.get('none|start|master', []) + by.get('none|eight|master', []):
        base_used.update(r['used'])
    info = {}
    hd = ['Sigil', 'Rule', 'Bachelor: rounds cleared of 3', 'Master: of 6', 'Wins: bachelor, master', 'Yield times', 'Biggest round over Par', 'Steps a turn', 'Kinds a run',
          'Play shifted']
    tb = []
    for sid in ('none',) + S2.ORDER:
        cells, wins = [], []
        d6 = 0.0
        ratio = []
        rmax = 0
        st, kd = [], []
        used = Counter()
        for length in ('bachelor', 'master'):
            rs = by.get('%s|start|%s' % (sid, length), []) + by.get('%s|eight|%s' % (sid, length), [])
            bs = by.get('none|start|%s' % length, []) + by.get('none|eight|%s' % length, [])
            n = sum(r['n'] for r in rs)
            if not n:
                cells.append('')
                wins.append('')
                continue
            cl = sum(r['cleared'] for r in rs) / n
            if sid == 'none':
                cells.append('%.2f' % cl)
            else:
                d, s, k = _paired2(rs, bs, lambda r: r['cleared'] / r['n'])
                cells.append('%.2f (%+.2f, +-%.2f)' % (cl, d, 1.96 * s))
                if length == 'master':
                    d6 = d
            wins.append(pct(sum(r['won'] for r in rs) / n))
            b2 = {_k(r): r for r in bs}
            for r in rs:
                o = b2.get(_k(r))
                if o and r.get('tot') and o.get('tot'):
                    for x, y in zip(r['tot'], o['tot']):
                        ratio += [(a + 1.0) / (b + 1.0) for a, b in zip(x, y)]
                rmax = max(rmax, r['ratio_max'])
                st.append(r['steps_turn'])
                kd.append(r['kinds_run'])
                if length == 'master':
                    used.update(r['used'])
        ratio.sort()
        ym = ratio[len(ratio) // 2] if ratio else 1.0
        su, sb = sum(used.values()) or 1, sum(base_used.values()) or 1
        shift = 0.5 * sum(abs(used.get(k, 0) / su - base_used.get(k, 0) / sb) for k in set(used) | set(base_used))
        info[sid] = {'d6': d6, 'yield': ym, 'rmax': rmax, 'steps': mean(st), 'kinds': mean(kd), 'shift': shift}
        c = S2.SIGILS.get(sid)
        tb.append([c.title if c else 'none', c.rule if c else '', cells[0], cells[1], ', '.join(wins), '%.2f' % ym if sid != 'none' else '', '%.0f' % rmax,
                   '%.2f' % mean(st), '%.2f' % mean(kd), '%.2f' % shift if sid != 'none' else ''])
    table(hd, tb)
    P('Yield times: the middle of (round yield with the sigil) over (the same round without).  Play shifted: how far the mix of reagents fired moves from the mix with no sigil (0 the same, 1 nothing shared).')
    P('')
    by2 = _cells('d_sig2')
    b4 = _cells('d_base4')
    base = b4.get('none|start', [])
    bcl = sum(r['cleared'] for r in base) / max(1, sum(r['n'] for r in base))
    single = {}
    for sid in S2.ORDER:
        rs = b4.get('%s|start' % sid, [])
        single[sid] = sum(r['cleared'] for r in rs) / max(1, sum(r['n'] for r in rs)) - bcl
    pair_stats = defaultdict(list)
    if by2:
        res = []
        for tag, rs in by2.items():
            a, b = tag.split('+')
            n = sum(r['n'] for r in rs)
            cl = sum(r['cleared'] for r in rs) / n
            x = (tag, cl - bcl, cl - bcl - single[a] - single[b], max(r['ratio_max'] for r in rs), mean(r['ratio_med'] for r in rs), sum(r['won'] for r in rs) / n)
            res.append(x)
            pair_stats[a].append(x)
            pair_stats[b].append(x)
        P('### d. Pairs of sigils (%d of 300 pairs played; start six, rounds 1 to 4, median player, 4 runs a pair; no sigil clears %.2f of 4)' % (len(res), bcl))
        P('')
        T = lambda t: ' + '.join(S2.SIGILS[x].title for x in t.split('+'))
        fmt = lambda x: [T(x[0]), '%+.2f' % x[1], '%+.2f' % x[2], pct(x[5]), '%.2f' % x[4], '%.0f' % x[3]]
        hd = ['Pair', 'Lift (rounds of 4)', 'Beyond the sum', 'Wins', 'Yield over Par, median', 'Biggest round over Par']
        P('Highest lift:')
        P('')
        table(hd, [fmt(x) for x in sorted(res, key=lambda x: -x[1])[:10]])
        P('Biggest rounds (runaway yield):')
        P('')
        table(hd, [fmt(x) for x in sorted(res, key=lambda x: -x[3])[:10]])
        P('Lowest lift:')
        P('')
        table(hd, [fmt(x) for x in sorted(res, key=lambda x: x[1])[:6]])
    by3 = _cells('d_sighom')
    hom_stats = defaultdict(list)
    if by3:
        nb = b4.get('none|eight', [])
        ncl = sum(r['cleared'] for r in nb) / max(1, sum(r['n'] for r in nb))
        P('### d. Sigil with homunculus (%d of 250 cells played; the eight, rounds 1 to 4, median player, 4 runs a cell): rounds cleared of 4 over no sigil and no creature (%.2f)' % (len(by3), ncl))
        P('')
        tb = []
        for sid in S2.ORDER:
            row = [S2.SIGILS[sid].title]
            for h in SP.ORDER:
                rs = by3.get('%s+%s' % (sid, h), [])
                n = sum(r['n'] for r in rs)
                if n:
                    v = sum(r['cleared'] for r in rs) / n - ncl
                    hom_stats[sid].append((h, v, max(r['ratio_max'] for r in rs), sum(r['taps'] for r in rs) / n))
                    row.append('%+.1f' % v)
                else:
                    row.append('')
            tb.append(row)
        table(['Sigil'] + [SP.LABEL[h] for h in SP.ORDER], tb)
        big = sorted(((sid, h, v, rm) for sid, hs in hom_stats.items() for h, v, rm, _ in hs), key=lambda x: -x[3])[:6]
        P('Biggest rounds: ' + '; '.join('%s + %s %.0f times Par' % (S2.SIGILS[a].title, SP.LABEL[h], rm) for a, h, v, rm in big) + '.')
        P('')
    by4 = _cells('d_sigsets')
    sets = {}
    if by4:
        P('### d. Each sigil on twelve other sixes (bachelor\'s, median player, 8 runs a set): rounds cleared of 3 over no sigil on the same set')
        P('')
        tb = []
        for sid in S2.ORDER:
            ds = []
            for tag, rs in by4.items():
                s2, grp = tag.split('|')
                if s2 != sid:
                    continue
                for r in rs:
                    o = [q for q in by4.get('none|%s' % grp, []) if q['rack'] == r['rack']]
                    if o:
                        ds.append(r['cleared'] / r['n'] - o[0]['cleared'] / o[0]['n'])
            if ds:
                sets[sid] = (mean(ds), min(ds), max(ds), sum(1 for d in ds if d > 0), len(ds))
                tb.append([S2.SIGILS[sid].title, '%+.2f' % mean(ds), '%+.2f to %+.2f' % (min(ds), max(ds)), '%d of %d' % (sum(1 for d in ds if d > 0), len(ds))])
        table(['Sigil', 'Mean', 'Lowest and highest set', 'Sets it helps'], tb)
    return {'info': info, 'pairs': {k: (mean(x[1] for x in v), max(x[3] for x in v)) for k, v in pair_stats.items()},
            'hom': {k: (mean(x[1] for x in v), max(x[2] for x in v)) for k, v in hom_stats.items()}, 'sets': sets, 'single': single}


def _k(r):
    p = r['id'].split('_')
    return (p[-3], p[-2], p[-1])


def _paired2(rs, base, key):
    b = {_k(r): r for r in base}
    d = [key(r) - key(b[_k(r)]) for r in rs if _k(r) in b]
    return mean(d), se(d), len(d)


def rep_thr():
    P('### Throughput')
    P('')
    tb = []
    for name in sorted(os.listdir(SR.OUT)):
        fp = os.path.join(SR.OUT, name, 'stats.jsonl')
        if not os.path.exists(fp):
            continue
        t = c = w = j = 0
        for line in open(fp):
            s = json.loads(line)
            t += s['turns']
            c += s['core_secs']
            w += s.get('wall', 0)
            j += s['todo']
        if t:
            tb.append([name, j, t, '%.0f' % w, '%.0f' % (t / max(w, 1e-9)), '%.1f' % (t / max(c, 1e-9))])
    table(['Experiment', 'Jobs', 'Turns', 'Wall seconds', 'Turns a second, 12 workers', 'Turns a second a core'], tb)


def rep_last():
    import sigil2_last as SL
    by = _cells('e_last')
    if not by:
        return
    P('### The last sigil: four versions (start six, median and greedy player, the same seeds as no sigil)')
    P('')
    for length, nr in (('master', 6), ('doctorate', 9)):
        if not by.get('none|%s' % length):
            continue
        tb = []
        for cell in ('none',) + SL.CELLS:
            rs = by.get('%s|%s' % (cell, length), [])
            if not rs:
                continue
            row = [cell.replace(':', ', ')]
            for pl in ('median', 'greedy'):
                n = sum(S(r, pl)['n'] for r in rs)
                row += ['%.2f' % (sum(S(r, pl)['cleared'] for r in rs) / n), pct(sum(S(r, pl)['won'] for r in rs) / n),
                        pct(sum(S(r, pl).get('used_runs', 0) for r in rs) / n), '%.1f' % mean(S(r, pl).get('uses', 0) for r in rs),
                        '%.1f' % mean(S(r, pl).get('spent', 0) for r in rs), '%.1f' % mean(S(r, pl).get('gold', 0) for r in rs)]
            at = [a for r in rs for a in S(r, 'median').get('at', [])]
            row.append(', '.join('%d gold: %d' % (g, c) for g, c in sorted(Counter(min(a[1], 9) for a in at).items())) if at else '')
            row.append('%.1f' % mean(a[0] for a in at) if at else '')
            tb.append(row)
        P('%s (%d rounds), %d runs a cell and player:' % (length, nr, sum(S(r, 'median')['n'] for r in by['none|%s' % length])))
        P('')
        table(['Version, policy', 'Median: rounds cleared', 'wins', 'runs that used it', 'uses a run', 'gold given up a run', 'gold left',
               'Greedy: rounds cleared', 'wins', 'runs that used it', 'uses a run', 'gold given up a run', 'gold left',
               'Gold held when used (median): times', 'Mean round of use'], tb)


def rep_wins():
    rows = good('wins') + good('wins_all')
    if not rows:
        return
    P('### The bare run: the starting six, no instrument, no creature, no sigil (stopped at the first round not cleared)')
    P('')
    tb, tb2 = [], []
    for pl in ('novice', 'greedy', 'median', 'planner'):
        rs = [r for r in rows if r.get('tag') == pl]
        n = sum(r['n'] for r in rs)
        if not n:
            continue
        met = [sum(r['met'][i] for r in rs) for i in range(12)]
        cells = []
        for k in (met[2], met[5], met[8], met[11]):
            lo, hi = wilson(k, n)
            cells.append('%d (%s; %s to %s)' % (k, pct(k / n, 2), pct(lo, 2), pct(hi, 2)))
        tb.append([pl, n] + cells)
        prev = [n] + met[:-1]
        tb2.append([pl] + [pct(met[i] / prev[i]) if prev[i] >= 20 else ('%d of %d' % (met[i], prev[i]) if prev[i] else '') for i in range(12)])
    table(['Player', 'Runs', 'Clear rounds 1 to 3', 'Clear 1 to 6', 'Win all nine (doctorate)', 'Win all twelve (postdoc)'], tb)
    P('Share of the runs still alive that clear each round (a count where fewer than 20 runs were left):')
    P('')
    table(['Player'] + ['R%d' % i for i in range(1, 13)], tb2)


if __name__ == '__main__':
    which = sys.argv[1:] or ['a', 'a2', 'a8', 'b', 'c', 'd', 'last', 'thr']
    for w in which:
        del OUT[:]
        r = {'a': rep_a, 'a2': rep_a2, 'a8': rep_a8, 'b': rep_b, 'c': rep_c, 'd': rep_d, 'thr': rep_thr, 'last': rep_last, 'wins': rep_wins}[w]()
        with open(os.path.join(SR.OUT, 'report_%s.md' % w), 'w', encoding='utf-8') as f:
            f.write('\n'.join(OUT) + '\n')
        if w == 'd' and r:
            json.dump(r, open(os.path.join(SR.OUT, 'report_d.json'), 'w'), indent=1)
