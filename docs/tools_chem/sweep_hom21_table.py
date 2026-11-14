"""sweep_hom21_table.py: the twenty-first measure's tables (docs/RIG.md, twenty-first; ruling BI "cap only the base").

    python sweep_hom21_table.py alone      Acid alone at stages 1, 3, 5, both players, each step (_sweep/hom21), and the bare game
    python sweep_hom21_table.py combo      every set of _sweep/hom21x: wins, biggest round, rounds past 20, 50, 100
"""
import sys

import sweep_hom18 as H18
import sweep_hom20_specs as S
import sweep_hom20_table as T
import sweep_sig16 as S16


def alone():
    by, mod = H18.load('hom21')
    for pl in ('median', 'greedy'):
        none = by.get(pl, {}).get('none')
        print('\n%s (bare this run: wins %.2f; sig17 bare: %.2f)' % (S16.PL[pl], H18.H.win(none) if none else -1, H18.H.win(S16.load('sig17')[pl]['none'])))
        base = S16.load('sig17')[pl]['none']
        for c in ('a', 'd', 'b'):
            cells = []
            for st in (1, 3, 5):
                runs = by.get(pl, {}).get(S.spec('acid', c, st))
                if not runs:
                    cells.append('not played'); continue
                x = H18.line(runs, base)
                cells.append('worth %.2f; wins %.1f; biggest %.0f' % (x['worth'], x['win'], x['max']))
            print('| acid %s (x%.2f) | %s |' % (c, S.CAND['acid'][c], ' | '.join(cells)))


def combo():
    from collections import Counter
    by, mod = H18.load('hom21x')
    base = S16.load('sig17')['median']['none']
    cn = T.counts('hom21x')
    for st in sorted(by.get('median', {})):
        x = H18.line(by['median'][st], base)
        rat = sorted((H18.C.ratio(rd) for r in by['median'][st] for rd in r[:9]), reverse=True)
        c = cn.get(st, Counter())
        print('| %s | runs %d | wins %.1f | biggest %.1f | past 20, 50, 100: %d, %d, %d of %d | most counted %s |' % (
            st, x['n'], x['win'], x['max'], x['p20'], x['p50'], sum(1 for v in rat if v > 100), x['rounds'], max(c) if c else '.'))


if __name__ == '__main__':
    {'alone': alone, 'combo': combo}[sys.argv[1] if len(sys.argv) > 1 else 'alone']()
