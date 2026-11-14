"""sweep_hom18.py: the eighteenth measure's creatures (sweep_run.py hom18): what each trial of a creature's numbers is worth.

    python sweep_hom18.py [experiment]         every trial played: runs, worth, wins of nine, rounds 7 to 9, biggest round, jobs a run
    python sweep_hom18.py fit [experiment]     for each creature the number (as read) at which it is worth 1.2, 1.35, 1.5, 1.65, 1.8,
                                               read off the trials by a straight line between the two nearest (log of the number)

"Worth" is sweep_help.flat_lift: the flat lift of the bare run's yield that wins nine rounds as often.  The bare runs are sig17's
(the same deals).  A trial's name is the spec given to sweep_run.py hom18 (and '&' the instruments or sigils held beside it).
"""
import json
import math
import os
import re
import sys

import sweep_career as C
import sweep_core as SC
import sweep_help as H
import sweep_sig16 as S16


def load(exp='hom18'):
    by, mod = {}, {}
    for line in open(os.path.join(SC.SWEEP_DIR, exp, 'rows.jsonl'), encoding='utf-8'):
        r = json.loads(line) if line.strip() else None
        if not r or 'error' in r:
            continue
        st = r['tag'].split('|')[0]
        rows = r['by'] if 'by' in r else {r.get('player', 'median'): r}
        for pl, d in rows.items():
            if d.get('full'):
                by.setdefault(pl, {}).setdefault(st, []).extend(d['full'])
        if 'by' not in r:
            m = mod.setdefault((r.get('player', 'median'), st), {})
            for v in (r.get('mod') or {}).values():
                for k, x in v.items():
                    m[k] = m.get(k, 0) + x
    return by, mod


def read_of(spec):
    """The number a player reads at the tap for a spec (the square root of what multiplies E), or None."""
    name = spec.split('&')[0].split('~')[0]
    cr, _, k = name.partition('@')
    opts = dict(o.split('=') for o in spec.split('&')[0].split('~')[1:])
    if cr == 'co2':
        return float(k or 1.36) ** (float(opts.get('MOST', 3)) / 2.0)
    for a in ('KS', 'KN', 'KB'):
        if a in opts:
            return float(opts[a]) ** 0.5
    return float(k) ** 0.5 if k else None


def line(runs, base, m=None):
    w = H.win(runs)
    rat = sorted((C.ratio(rd) for r in runs for rd in r[:9]), reverse=True)
    n = float((m or {}).get('runs') or 0)
    return {'n': len(runs), 'worth': H.flat_lift(base, w), 'win': w, 'wall': [100 * x for x in H.rates(runs)[6:]], 'early': [100 * x for x in H.rates(runs)[:6]],
            'max': rat[0], 'p20': sum(1 for x in rat if x > 20), 'p50': sum(1 for x in rat if x > 50), 'rounds': len(rat),
            'r20': sum(1 for r in runs if any(C.ratio(rd) > 20 for rd in r[:9])), 'taps': (m or {}).get('taps', 0) / n if n else None}


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in ('fit',) else 'all'
    exp = [a for a in sys.argv[1:] if a != 'fit']
    exp = exp[0] if exp else 'hom18'
    by, mod = load(exp)
    bare = S16.load('sig17')
    for pl in ('median', 'greedy'):
        if pl not in by:
            continue
        base = bare[pl]['none']
        print('%s; none: %d runs, wins of nine %.2f, rounds 1 to 9 cleared %s' % (S16.PL[pl], len(base), H.win(base), ', '.join('%.0f' % (100 * x) for x in H.rates(base))))
        rows = {st: line(runs, base, mod.get((pl, st))) for st, runs in by[pl].items()}
        if cmd == 'all':
            for st in sorted(rows):
                x = rows[st]
                rd = read_of(st) if st.split('&')[0] != 'none' else None
                print('| %-34s | reads %s | n %4d | worth %.2f | wins %5.2f | 1-6: %s | 7-9: %s | biggest %5.1f | rounds past 20, 50: %d, %d of %d | runs with one past 20: %d | jobs a run %s |' % (
                    st, ('x%.2f' % rd) if rd else '.', x['n'], x['worth'], x['win'], ', '.join('%.0f' % v for v in x['early']), ', '.join('%.0f' % v for v in x['wall']),
                    x['max'], x['p20'], x['p50'], x['rounds'], x['r20'], ('%.1f' % x['taps']) if x['taps'] is not None else '.'))
            continue
        fam = {}
        for st, x in rows.items():
            if '&' in st or st == 'none' or read_of(st) is None:
                continue
            key = re.sub(r'(@[\d.]+)|(~K[SNB2]=[\d.]+)', '', st)
            fam.setdefault(key, []).append((read_of(st), x['worth'], x['max'], x['n']))
        for key in sorted(fam):
            pts = sorted(fam[key])
            out = []
            for tgt in (1.2, 1.35, 1.5, 1.65, 1.8):
                v = None
                for (a, wa, _, _), (b, wb, _, _) in zip(pts, pts[1:]):
                    if (wa - tgt) * (wb - tgt) <= 0 and wa != wb:
                        t = (tgt - wa) / (wb - wa)
                        v = math.exp(math.log(a) + t * (math.log(b) - math.log(a)))
                        break
                out.append('%.2f' % v if v else ('under' if pts[0][1] > tgt else 'over'))
            print('%-26s trials (reads: worth, biggest round): %s  ->  worth 1.2, 1.35, 1.5, 1.65, 1.8 at x%s' % (
                key, '; '.join('x%.2f: %.2f, %.0f' % (a, w, mx) for a, w, mx, _ in pts), ', x'.join(out)))
