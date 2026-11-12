"""Test of the generator over many rounds, played in runs of nine rounds so that the family history and the carried reagents are real.

  python hurdle_gen_test.py run POOL RUNS OUT.pkl    RUNS runs of 9 rounds on POOL ('heldout' or 'fit'); every pick is played by six players
  python hurdle_gen_test.py report OUT.pkl
Players: yield (the engine's greedy player: it does not know the spec), random, new (a person learning, told the spec), aim (the aiming
player, told the spec and N), middling (per turn: aim with chance 0.5, else like the new player) and skilled (0.95).  All six play
the same molecule with the same deals.
"""
import math
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

KINDS = ('yield', 'random', 'new', 'aim', 'middling', 'skilled')


def one_run(args):
    pool, j = args
    rows = []
    hist = []
    for rnd in range(1, 10):
        smi, src, carried, rules = S.make_unit(pool, rnd, j)
        eng = E.Engine()
        rng = random.Random('genpick/%s/%d/%d' % (pool, j, rnd))
        t0 = time.time()
        pk = G.pick_spec(smi, rnd, carried, rng, tier=3, history=hist, rules=rules, engine=eng)
        dt = time.time() - t0
        hist.append(pk)
        seed = 'gen/%s/%d/%d' % (pool, j, rnd)
        ok, vals, pays = {}, {}, {}
        for kind in KINDS:
            pl = H.make_player(kind, pk.aims)
            rr = eng.play_round(smi, carried, rules, pl, seed, analyse=False)
            lg = H.round_log(rr)
            v = [h.fn(lg) for h, _ in pk.aims]
            ok[kind] = all(x >= n for x, (_, n) in zip(v, pk.aims))
            vals[kind] = v
            pays[kind] = rr['pay']
        rows.append({'run': j, 'rnd': rnd, 'src': src, 'smi': smi, 'atoms': H.feat(E.canon(smi))['atoms'], 'carried': carried,
                     'names': pk.names, 'N': [n for _, n in pk.aims], 'fam': pk.families, 'plan': pk.plans,
                     'fell_back': pk.fell_back, 'tries': pk.tries, 'est': pk.est, 'proof': pk.proof,
                     'witness': pk.witness is not None, 'rider': pk.rider, 'ok': ok, 'vals': vals, 'pays': pays, 'secs': dt,
                     'text': pk.text()})
    return rows


def run(pool, runs, out, procs=15, start=0):
    t0 = time.time()
    allrows = []
    with mp.Pool(procs) as p:
        for k, rows in enumerate(p.imap_unordered(one_run, [(pool, j) for j in range(start, start + runs)])):
            allrows += rows
            if (k + 1) % 10 == 0:
                print('%d/%d runs  %.0fs' % (k + 1, runs, time.time() - t0), flush=True)
    pickle.dump({'rows': allrows, 'seconds': time.time() - t0, 'runs': runs, 'pool': pool}, open(out, 'wb'))
    print('done %d picks in %.0fs' % (len(allrows), time.time() - t0))


def summarize(rows):
    """By-round numbers and the nine-round arithmetic from the rows of a run of runs."""
    out = {'by_round': {}}
    for rnd in range(1, 10):
        x = [r for r in rows if r['rnd'] == rnd]
        f = lambda k: sum(1 for r in x if r['ok'][k]) / float(len(x))
        g = lambda k: sum(1 for r in x if r[k]) / float(len(x))
        nums = Counter(tuple(r['N']) for r in x)
        out['by_round'][rnd] = {
            'n': len(x), 'target': S.target(rnd), 'model': 'new player' if rnd <= 3 else 'middling player',
            'rates': {k: f(k) for k in KINDS}, 'pairs': sum(1 for r in x if len(r['names']) == 2) / float(len(x)),
            'fell_back': g('fell_back'), 'witness': g('witness'), 'riders': g('rider'),
            'searched': sum(1 for r in x if r['proof'] == 'search') / float(len(x)),
            'kinds': len({n for r in x for n in r['names']}), 'families': len({f_ for r in x for f_ in r['fam']}),
            'mean_N': sum(sum(r['N']) / len(r['N']) for r in x) / len(x),
            'secs': sum(r['secs'] for r in x) / len(x)}
    # runs
    byrun = defaultdict(list)
    for r in rows:
        byrun[r['run']].append(r)
    full = {k: 0 for k in KINDS}
    nruns = 0
    same_fam, tot_pairs, same_spec = 0, 0, 0
    for j, rs in byrun.items():
        rs.sort(key=lambda r: r['rnd'])
        if len(rs) < 9:
            continue
        nruns += 1
        for k in KINDS:
            if all(r['ok'][k] for r in rs):
                full[k] += 1
        for a, b in zip(rs, rs[1:]):
            tot_pairs += 1
            if set(a['fam']) & set(b['fam']):
                same_fam += 1
            if set(a['names']) & set(b['names']):
                same_spec += 1
    out['runs'] = nruns
    out['full_wins'] = full
    out['same_family_twice'] = (same_fam, tot_pairs)
    out['same_spec_twice'] = (same_spec, tot_pairs)
    br = out['by_round']
    out['product'] = {k: math.prod(br[r]['rates'][k] for r in range(1, 10)) for k in KINDS}
    out['product_1_3'] = {k: math.prod(br[r]['rates'][k] for r in range(1, 4)) for k in KINDS}
    out['spec_use'] = Counter(n for r in rows for n in r['names'])
    out['fam_use'] = Counter(f for r in rows for f in r['fam'])
    out['plan_use'] = Counter(f for r in rows for f in r['plan'])
    return out


def report(path):
    d = pickle.load(open(path, 'rb'))
    rows = d['rows']
    s = summarize(rows)
    out = ['pool %s: %d picks in %d runs, %.0f s' % (d['pool'], len(rows), s['runs'], d['seconds'])]
    out.append('round  target(model)   new  yield  random   aim  middling  skilled   pairs%  fellback%  proof%  by-search%  kinds  fams  meanN')
    for rnd in range(1, 10):
        b = s['by_round'][rnd]
        r = b['rates']
        out.append('%d      %2d (%s)  %5.1f  %5.1f  %5.1f  %5.1f   %5.1f    %5.1f     %4.0f    %5.1f     %5.1f   %5.1f      %2d    %2d    %.1f' % (
            rnd, round(100 * b['target']), 'new' if rnd <= 3 else 'mid', 100 * r['new'], 100 * r['yield'], 100 * r['random'],
            100 * r['aim'], 100 * r['middling'], 100 * r['skilled'], 100 * b['pairs'], 100 * b['fell_back'], 100 * b['witness'],
            100 * b['searched'], b['kinds'], b['families'], b['mean_N']))
    out.append('nine-round product of the per-round rates: ' + ', '.join('%s %.3f' % (k, s['product'][k]) for k in KINDS))
    out.append('rounds 1-3 product: ' + ', '.join('%s %.3f' % (k, s['product_1_3'][k]) for k in KINDS))
    out.append('full nine-round wins in the %d runs: ' % s['runs'] + ', '.join('%s %d' % (k, s['full_wins'][k]) for k in KINDS))
    out.append('same family in two rounds running: %d of %d; same spec: %d of %d' % (s['same_family_twice'] + s['same_spec_twice']))
    out.append('families chosen: ' + ', '.join('%s %d' % kv for kv in s['fam_use'].most_common()))
    out.append('plans chosen: ' + ', '.join('%s %d' % kv for kv in s['plan_use'].most_common()))
    out.append('specs used (%d kinds): ' % len(s['spec_use']) + ', '.join('%s %d' % kv for kv in s['spec_use'].most_common()))
    out.append('pick time: %.1f s on average, longest %.1f s' % (sum(r['secs'] for r in rows) / len(rows), max(r['secs'] for r in rows)))
    return '\n'.join(out)


if __name__ == '__main__':
    if sys.argv[1] == 'run':
        run(sys.argv[2], int(sys.argv[3]), sys.argv[4], start=int(sys.argv[5]) if len(sys.argv) > 5 else 0)
    elif sys.argv[1] == 'report':
        print(report(sys.argv[2]))
