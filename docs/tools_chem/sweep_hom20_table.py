"""sweep_hom20_table.py: the twentieth measure's tables (docs/RIG.md, twentieth).

    python sweep_hom20_table.py alone      the three candidates of each creature at stages 1, 3, 5, alone, both players (_sweep/hom20)
    python sweep_hom20_table.py combo      every set of _sweep/hom20x: wins, biggest round, rounds past 20, 50, 100, the largest count read
"""
import json
import os
import sys
from collections import Counter

import sweep_core as SC
import sweep_hom18 as H18
import sweep_hom20_specs as S
import sweep_sig16 as S16


def counts(exp):
    out = {}
    for line in open(os.path.join(SC.SWEEP_DIR, exp, 'rows.jsonl'), encoding='utf-8'):
        r = json.loads(line) if line.strip() else None
        if not r or 'error' in r:
            continue
        c = out.setdefault(r['tag'].split('|')[0], Counter())
        for v in (r.get('mod') or {}).values():
            for k, x in v.items():
                if k.startswith('n_'):
                    c[int(k[2:])] += x
    return out


def alone():
    by, mod = H18.load('hom20')
    bare = S16.load('sig17')
    for pl in ('median', 'greedy'):
        base = bare[pl]['none']
        print('\n%s (none: wins %.2f)' % (S16.PL[pl], H18.H.win(base)))
        for h in ('acid', 'seedling', 'brimstone'):
            for c in ('a', 'b', 'c'):
                cells = []
                for st in (1, 3, 5):
                    sp = S.spec(h, c, st)
                    runs = by.get(pl, {}).get(sp)
                    if not runs:
                        cells.append('not played')
                        continue
                    x = H18.line(runs, base)
                    cells.append('worth %.2f; wins %.1f; biggest %.0f' % (x['worth'], x['win'], x['max']))
                print('| %s %s | %s |' % (h, c, ' | '.join(cells)))


def combo():
    by, mod = H18.load('hom20x')
    bare = S16.load('sig17')
    cn = counts('hom20x')
    base = bare['median']['none']
    for st in sorted(by.get('median', {})):
        x = H18.line(by['median'][st], base)
        rat = sorted((H18.C.ratio(rd) for r in by['median'][st] for rd in r[:9]), reverse=True)
        c = cn.get(st, Counter())
        print('| %s | runs %d | wins %.1f | biggest %.1f | rounds past 20, 50, 100: %d, %d, %d of %d | most counted %s |' % (
            st, x['n'], x['win'], x['max'], x['p20'], x['p50'], sum(1 for v in rat if v > 100), x['rounds'], max(c) if c else '.'))


if __name__ == '__main__':
    {'alone': alone, 'combo': combo}[sys.argv[1] if len(sys.argv) > 1 else 'alone']()
