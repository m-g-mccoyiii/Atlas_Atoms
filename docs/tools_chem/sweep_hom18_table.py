"""sweep_hom18_table.py: the tables of docs/RIG.md, eighteenth, part 2, from _sweep/hom18 (sweep_run.py hom18).

    python sweep_hom18_table.py stages     each creature at its five stages, alone: the careful and the casual player
    python sweep_hom18_table.py kit        a full kit (three instruments, three sigils) with each creature at stage 3 and with none
    python sweep_hom18_table.py jobs       how often each creature does its job in a run (careful player, the runs played for him alone)

"Worth" is sweep_help.flat_lift against sig17's bare runs (the same deals).  A set played 100 times: wins are good to about 1.3
times either way near 3 in 100; the biggest round is one round of 900.
"""
import sys

import sweep_career as C
import sweep_help as H
import sweep_hom18 as M
import sweep_hom18_specs as S
import sweep_sig16 as S16
from sweep_homs import LABEL

KIT = '&carousel+burette+crystal+gemini+clepsydra+via_humida'


def cell(runs, base):
    x = M.line(runs, base)
    return x


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'stages'
    by, mod = M.load('hom18')
    bare = S16.load('sig17')
    if cmd == 'stages':
        for pl in ('median', 'greedy'):
            base = bare[pl]['none']
            print('%s; none: %d runs, wins of nine %.2f in 100; rounds 1 to 9 cleared %s; biggest round %.1f' % (
                S16.PL[pl], len(base), H.win(base), ', '.join('%.0f' % (100 * v) for v in H.rates(base)), max(C.ratio(rd) for r in base for rd in r[:9])))
            print('| Creature | ' + ' | '.join('Stage %d: reads; worth; wins of nine, of 100; biggest round' % s for s in (1, 2, 3, 4, 5)) + ' | Runs of 100 with a round past 20 times, stage 3; 5 |')
            print('|---|---|---|---|---|---|---|')
            tot = {s: [] for s in (1, 2, 3, 4, 5)}
            for h in S.ORDER:
                cells, r20 = [], []
                for s in (1, 2, 3, 4, 5):
                    runs = (by.get(pl) or {}).get(S.spec(h, s))
                    if not runs:
                        cells.append('.')
                        r20.append(None)
                        continue
                    x = cell(runs, base)
                    tot[s].append(x)
                    r20.append(100.0 * x['r20'] / x['n'])
                    cells.append('x%.2f; %.2f; %.1f; %.0f' % (S.READ[h][s - 1], x['worth'], x['win'], x['max']))
                print('| %s | %s | %s; %s |' % (LABEL[h], ' | '.join(cells), '.' if r20[2] is None else '%.0f' % r20[2], '.' if r20[4] is None else '%.0f' % r20[4]))
            for s in (1, 2, 3, 4, 5):
                t = tot[s]
                if t:
                    w = sorted(x['worth'] for x in t)
                    print('  stage %d, all ten: worth %.2f to %.2f, the middle %.2f; wins of nine %.2f in 100 on average; rounds 1 to 6 cleared %s; rounds 7 to 9 %s; biggest round %.0f' % (
                        s, w[0], w[-1], (w[4] + w[5]) / 2 if len(w) == 10 else w[len(w) // 2], sum(x['win'] for x in t) / len(t),
                        ', '.join('%.0f' % (sum(x['early'][i] for x in t) / len(t)) for i in range(6)), ', '.join('%.0f' % (sum(x['wall'][i] for x in t) / len(t)) for i in range(3)), max(x['max'] for x in t)))
    elif cmd == 'kit':
        for pl in ('median', 'greedy'):
            base = bare[pl]['none']
            d = by.get(pl) or {}
            k0 = d.get('none' + KIT)
            print('%s; bare: wins of nine %.2f in 100' % (S16.PL[pl], H.win(base)))
            if k0:
                x = cell(k0, base)
                print('| The kit with no creature | n %d | worth %.2f | wins of nine %.1f | rounds 7 to 9: %s | biggest round %.0f | runs of 100 with a round past 20, 50: %.0f, %.0f |' % (
                    x['n'], x['worth'], x['win'], ', '.join('%.0f' % v for v in x['wall']), x['max'], 100.0 * x['r20'] / x['n'], 100.0 * sum(1 for r in k0 if any(C.ratio(rd) > 50 for rd in r[:9])) / x['n']))
            for h in S.ORDER:
                runs = d.get(S.spec(h, 3) + KIT)
                if not runs:
                    continue
                x = cell(runs, base)
                print('| %s | n %d | worth %.2f | wins of nine %.1f | rounds 7 to 9: %s | biggest round %.0f | runs of 100 with a round past 20, 50: %.0f, %.0f |' % (
                    LABEL[h], x['n'], x['worth'], x['win'], ', '.join('%.0f' % v for v in x['wall']), x['max'], 100.0 * x['r20'] / x['n'], 100.0 * sum(1 for r in runs if any(C.ratio(rd) > 50 for rd in r[:9])) / x['n']))
    elif cmd == 'fresh':
        # the ten at stage 3 on deals the numbers were not fitted on (SWEEP_SEED=r sweep_run.py hom18 --arg both,200,,<three>)
        sd = sys.argv[2] if len(sys.argv) > 2 else 'r'
        for pl in ('median', 'greedy'):
            d = by.get(pl) or {}
            base = d.get('none#' + sd)
            if not base:
                continue
            print('%s, deals %s; none: %d runs, wins of nine %.2f in 100; rounds 1 to 9 cleared %s; biggest round %.1f' % (
                S16.PL[pl], sd, len(base), H.win(base), ', '.join('%.0f' % (100 * v) for v in H.rates(base)), max(C.ratio(rd) for r in base for rd in r[:9])))
            ws = []
            for h in S.ORDER:
                runs = d.get(S.spec(h, 3) + '#' + sd)
                if not runs:
                    continue
                x = cell(runs, base)
                ws.append(x['worth'])
                print('| %s | n %d | x%.2f | worth %.2f | wins of nine %.1f | rounds 7 to 9: %s | biggest round %.0f | runs of 100 with a round past 20: %.0f |' % (
                    LABEL[h], x['n'], S.READ[h][2], x['worth'], x['win'], ', '.join('%.0f' % v for v in x['wall']), x['max'], 100.0 * x['r20'] / x['n']))
            if ws:
                ws.sort()
                print('  worth %.2f to %.2f, the middle %.2f' % (ws[0], ws[-1], (ws[4] + ws[5]) / 2 if len(ws) == 10 else ws[len(ws) // 2]))
    elif cmd == 'jobs':
        for st in sorted(k for (pl, k) in mod if pl == 'median'):
            m = mod[('median', st)]
            if m.get('runs'):
                print('%-40s jobs a run %.1f (%d runs)' % (st, m.get('taps', 0) / float(m['runs']), m['runs']))
