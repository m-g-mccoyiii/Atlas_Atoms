"""Test of the generator over many rounds, played in runs of nine rounds so that the family history is real.

  python hurdle_gen_test.py run RUNS OUT.pkl      RUNS runs of 9 rounds, each pick made in both modes (sim, table)
  python hurdle_gen_test.py report OUT.pkl
The player that is tested is AimPlayer (plays toward the numbers, then for points).  The points player and the random player
are played on the same round to see how often they clear the hurdle by accident.
"""
import multiprocessing as mp
import pickle
import random
import sys
import time
from collections import Counter, defaultdict

import engine as E
import hurdle_gen as G
import hurdle_study as S
import hurdles as H


def one_run(j):
    rows = []
    hist = {'sim': [], 'table': []}
    for rnd in range(1, 10):
        smi, src, carried, rules = S.make_unit(rnd, j * 9 + rnd)
        for mode in ('sim', 'table'):
            eng = E.Engine()
            rng = random.Random('genpick/%d/%d/%s' % (j, rnd, mode))
            t0 = time.time()
            pk = G.pick_hurdle(smi, rnd, carried, rng, tier=3, history=hist[mode], rules=rules, mode=mode, engine=eng)
            dt = time.time() - t0
            hist[mode].append(pk.families)
            seed = 'gen/%d/%d' % (j, rnd)
            ra = eng.play_round(smi, carried, rules, H.AimPlayer(pk.aims), seed, analyse=False)
            rp = eng.play_round(smi, carried, rules, E.PLAYERS['greedy'], seed, analyse=False)
            rr = eng.play_round(smi, carried, rules, E.PLAYERS['random'], seed, analyse=False)
            la, lp, lr = H.round_log(ra), H.round_log(rp), H.round_log(rr)
            ok = lambda lg: all(h.fn(lg) >= n for h, n in pk.aims)
            rows.append({'run': j, 'rnd': rnd, 'mode': mode, 'src': src, 'smi': smi, 'carried': carried,
                         'names': [h.name for h, _ in pk.aims], 'N': [n for _, n in pk.aims],
                         'fam': pk.families, 'fell_back': pk.fell_back, 'tries': pk.tries, 'est': pk.est,
                         'target': pk.target, 'witness': pk.witness is not None, 'aim': ok(la), 'points': ok(lp),
                         'random': ok(lr), 'aim_pay': ra['pay'], 'points_pay': rp['pay'], 'secs': dt,
                         'values': [h.fn(la) for h, _ in pk.aims]})
    return rows


def run(runs, out, procs=15):
    t0 = time.time()
    allrows = []
    with mp.Pool(procs) as pool:
        for k, rows in enumerate(pool.imap_unordered(one_run, range(runs))):
            allrows += rows
            if (k + 1) % 10 == 0:
                print('%d/%d runs  %.0fs' % (k + 1, runs, time.time() - t0), flush=True)
    pickle.dump({'rows': allrows, 'seconds': time.time() - t0, 'runs': runs}, open(out, 'wb'))
    print('done %d picks in %.0fs' % (len(allrows), time.time() - t0))


def report(path):
    d = pickle.load(open(path, 'rb'))
    rows = d['rows']
    out = []
    for mode in ('sim', 'table'):
        rs = [r for r in rows if r['mode'] == mode]
        out.append('mode %s: %d picks in %d runs' % (mode, len(rs), d['runs']))
        out.append('round  target  aim-clear  points-clear  random-clear  pairs%  fallback%  witness%  mean-tries')
        for rnd in range(1, 10):
            x = [r for r in rs if r['rnd'] == rnd]
            f = lambda k: 100.0 * sum(1 for r in x if r[k]) / len(x)
            out.append('%d      %2d      %5.1f      %5.1f         %5.1f        %4.0f    %5.1f      %5.1f     %.1f' % (
                rnd, round(100 * x[0]['target']), f('aim'), f('points'), f('random'),
                100.0 * sum(1 for r in x if len(r['names']) == 2) / len(x), f('fell_back'), f('witness'),
                sum(r['tries'] for r in x) / len(x)))
        fam = Counter(f for r in rs for f in r['fam'])
        nm = Counter(n for r in rs for n in r['names'])
        out.append('families: ' + ', '.join('%s %d' % kv for kv in fam.most_common()))
        out.append('hurdles used (%d kinds): ' % len(nm) + ', '.join('%s %d' % kv for kv in nm.most_common(30)))
        same = 0
        tot = 0
        by = defaultdict(list)
        for r in sorted(rs, key=lambda r: (r['run'], r['rnd'])):
            by[r['run']].append(r)
        for run_ in by.values():
            for a, b in zip(run_, run_[1:]):
                tot += 1
                if set(a['fam']) & set(b['fam']):
                    same += 1
        out.append('same family in two rounds running: %d of %d' % (same, tot))
        out.append('picks %.1f s on average, longest %.1f s' % (sum(r['secs'] for r in rs) / len(rs), max(r['secs'] for r in rs)))
    return '\n'.join(out)


if __name__ == '__main__':
    if sys.argv[1] == 'run':
        run(int(sys.argv[2]), sys.argv[3])
    elif sys.argv[1] == 'report':
        print(report(sys.argv[2]))
