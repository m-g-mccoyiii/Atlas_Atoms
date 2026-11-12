"""The large test of the hurdles: for every hurdle and every round 1..9, many rounds, three players.

  python hurdle_study.py run N OUT.pkl [rounds]      N rounds per round number (half the game's molecules, half generated)
  python hurdle_study.py report OUT.pkl              the distributions, the N for 80/60/40 percent, the sorting
Players: random; points (greedy for points); seek (greedy on the hurdle's value, then points).
"""
import multiprocessing as mp
import pickle
import random
import statistics
import sys
import time
from collections import defaultdict

import engine as E
import hurdles as H
import library
import molecules


def make_unit(rnd, idx):
    """The molecule, carried set and rules of one test round.  Even idx: the game's molecules as dealt; odd: generated."""
    rng = random.Random('unit/%d/%d' % (rnd, idx))
    if idx % 2 == 0:
        smi = molecules.deal_molecule(rnd, rng, 3)
        src = 'game'
    else:
        base = molecules.ROUND_SIZES[rnd - 1]
        size = max(8, int(round(base)) + rng.choice([-2, -1, 0, 0, 1, 2]))
        smi = None
        for _ in range(20):
            g = molecules.generate(size, rng, 1, 'any')
            if g:
                smi = g[0].canonical
                break
        if smi is None:
            smi = molecules.deal_molecule(rnd, rng, 3)
            src = 'game'
        else:
            src = 'generated'
    carried = H.carried_for(rnd, rng)
    return smi, src, carried, H.RULES_BAND[rnd]


def play(eng, smi, carried, rules, player, seed):
    return eng.play_round(smi, carried, rules, player, seed, analyse=False)


def work(unit):
    rnd, idx = unit
    smi, src, carried, rules = make_unit(rnd, idx)
    eng = E.Engine()
    seed = 'st/%d/%d' % (rnd, idx)
    out = {'rnd': rnd, 'idx': idx, 'src': src, 'smi': smi, 'carried': carried, 'vals': {}}
    out['heavy'] = E.parse(smi).GetNumHeavyAtoms()
    rp = play(eng, smi, carried, rules, E.PLAYERS['random'], seed)
    pp = play(eng, smi, carried, rules, E.PLAYERS['greedy'], seed)
    lr, lp = H.round_log(rp), H.round_log(pp)
    out['rpay'], out['ppay'] = rp['pay'], pp['pay']
    for name, h in H.HURDLES.items():
        if not h.applicable(carried, rules):
            continue
        play_seek = H.SeekPlayer(h)
        rs = play(eng, smi, carried, rules, play_seek, seed)
        out['vals'][name] = (h.fn(lr), h.fn(lp), h.check(smi, rs), rs['pay'])
    out['f0'] = H.feat(E.canon(smi)) and {k: v for k, v in H.feat(E.canon(smi)).items() if k in ('atoms', 'rings', 'kinds')}
    return out


def run(n, out, rounds=range(1, 10), procs=15):
    units = [(r, i) for i in range(n) for r in rounds]
    t0 = time.time()
    res = []
    with mp.Pool(procs) as pool:
        for k, o in enumerate(pool.imap_unordered(work, units, chunksize=2)):
            res.append(o)
            if (k + 1) % 200 == 0:
                print('%d/%d  %.0fs' % (k + 1, len(units), time.time() - t0), flush=True)
    pickle.dump({'results': res, 'seconds': time.time() - t0, 'n': n}, open(out, 'wb'))
    print('done %d rounds in %.0fs' % (len(res), time.time() - t0))


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'run':
        rounds = [int(x) for x in sys.argv[4].split(',')] if len(sys.argv) > 4 else range(1, 10)
        run(int(sys.argv[2]), sys.argv[3], rounds)


# ---------------------------------------------------------------------------------------------------------------
# the analysis
# ---------------------------------------------------------------------------------------------------------------

def frac_ge(a, n):
    return sum(1 for x in a if x >= n) / float(len(a)) if a else 0.0


def n_for(a, t):
    """The largest whole number N such that at least a share t of the values are >= N (0 when even 1 is cleared too rarely)."""
    if not a:
        return 0
    top = int(max(a))
    n = 0
    for k in range(1, top + 1):
        if frac_ge(a, k) >= t:
            n = k
        else:
            break
    return n


def pct(a, q):
    s = sorted(a)
    return s[min(len(s) - 1, int(q * len(s)))] if s else 0


def analyse(results):
    """{(hurdle, round): cell}.  Each cell has N80/N60/N40, how often the points player and the random player clear them,
    the room above N60, the points kept by the seeker and the label."""
    by = defaultdict(list)
    for r in results:
        for h, v in r['vals'].items():
            by[(h, r['rnd'])].append((v[0], v[1], v[2], v[3], r['ppay']))
    cells = {}
    for (h, rnd), rows in by.items():
        rv = [x[0] for x in rows]
        pv = [x[1] for x in rows]
        sv = [x[2] for x in rows]
        c = {'n': len(rows), 'mean_seek': statistics.mean(sv), 'p50': pct(sv, .5), 'p90': pct(sv, .9), 'p95': pct(sv, .95),
             'max': max(sv), 'points_mean': statistics.mean(pv), 'random_mean': statistics.mean(rv)}
        for t, k in ((.8, '80'), (.6, '60'), (.4, '40')):
            N = n_for(sv, t)
            c['N' + k] = N
            c['pts' + k] = frac_ge(pv, N) if N >= 1 else None
            c['rnd' + k] = frac_ge(rv, N) if N >= 1 else None
            c['seek' + k] = frac_ge(sv, N) if N >= 1 else None
        n60 = c['N60']
        c['room'] = c['p95'] - n60 if n60 >= 1 else None
        if n60 >= 1:
            keep = [x[3] for x in rows if x[2] >= n60]
            allp = statistics.mean(x[4] for x in rows)
            c['pay_ratio'] = (statistics.mean(keep) / allp) if keep and allp > 0 else None
        else:
            c['pay_ratio'] = None
        c['label'] = label_of(c, sv)
        cells[(h, rnd)] = c
    return cells


def label_of(c, sv):
    if c['N40'] < 1:
        return 'TOO RARE'
    if c['N80'] == c['N40']:
        return 'DULL'
    if c['N60'] < 1:
        return 'TOO RARE'
    pc = c['pts60']
    ratio = c['pay_ratio']
    gap = (c['seek60'] - pc) if pc is not None else None
    if pc is not None and pc >= 0.85:
        return 'TOO EASY'
    if pc is not None and gap < 0.10:
        return 'TRACKS THE SCORE'      # the points player clears it about as often as the player who aims: it adds no decision
    if ratio is not None and (ratio < 0.5 or (pc is not None and pc < 0.02 and ratio < 0.8)):
        return 'FIGHTS THE SCORE'
    if c['room'] is not None and c['room'] >= max(1, 0.2 * c['N60']) and pc is not None and pc < 0.85:
        return 'GOOD'
    return 'NO ROOM' if (c['room'] is not None and c['room'] < max(1, 0.2 * c['N60'])) else 'TOO EASY'


def hurdle_summary(cells):
    out = {}
    for h in H.HURDLES:
        rs = {r: cells[(h, r)] for r in range(1, 10) if (h, r) in cells}
        if not rs:
            out[h] = {'label': 'NEVER APPLICABLE', 'good_rounds': [], 'rounds': {}}
            continue
        good = [r for r, c in rs.items() if c['label'] == 'GOOD']
        cnt = defaultdict(int)
        for c in rs.values():
            cnt[c['label']] += 1
        if len(good) >= 3:
            lab = 'GOOD'
        else:
            lab = max(cnt, key=lambda k: (cnt[k], k != 'GOOD'))
            if good:
                lab = lab + ' (good in %s)' % ','.join(map(str, good))
        out[h] = {'label': lab, 'good_rounds': good, 'rounds': rs, 'counts': dict(cnt)}
    return out


# a hurdle that reads almost the same as another (correlation 0.9 or more between the two on the points player's rounds):
# the one on the left is dropped and the one on the right kept
TWINS = {'weight': 'growth', 'places': 'off_total', 'kinds_in_round': 'kinds_in_turn', 'kind_dry': 'off_water',
         'kind_weld': 'loop', 'order_dry_tuck': 'kind_tuck'}
# measured GOOD, but a player cannot see it coming or cannot steer it, so the generator does not offer it
HELD_BACK = {'stereo': 'handedness is never set by the engine: the count is a fact of the graph the player cannot steer or read',
             'mirror': 'twin atoms are hard to see on the page',
             'loop': 'a kind coming round again is hard to read on screen',
             'crescendo': 'it asks for the turns in a rising order, which the player only learns at turn three'}


def write_table(results, path):
    """hurdle_table.json: for each hurdle its label, the rounds where it is GOOD, and per round the share of seeking players at or
    above N for N = 0, 1, 2, ... (what hurdle_gen reads)."""
    import json
    by = defaultdict(list)
    for r in results:
        for h, v in r['vals'].items():
            by[(h, r['rnd'])].append(v[2])
    cells = analyse(results)
    summ = hurdle_summary(cells)
    tb = {}
    for h, s in summ.items():
        row = {'label': s['label'], 'good_rounds': s['good_rounds'], 'sf': {}}
        if h in TWINS:
            row['twin_of'] = TWINS[h]
            row['good_rounds'] = []
        if h in HELD_BACK:
            row['held_back'] = HELD_BACK[h]
            row['good_rounds'] = []
        for rnd in range(1, 10):
            sv = by.get((h, rnd))
            if sv:
                row['sf'][str(rnd)] = [round(frac_ge(sv, x), 4) for x in range(0, int(max(sv)) + 2)]
        tb[h] = row
    json.dump(tb, open(path, 'w'), indent=0)
    return tb


if __name__ == '__main__' and sys.argv[1] == 'table':
    d = pickle.load(open(sys.argv[2], 'rb'))
    tb = write_table(d['results'], sys.argv[3] if len(sys.argv) > 3 else H.__file__.replace('hurdles.py', 'hurdle_table.json'))
    print(sum(1 for r in tb.values() if r['label'].startswith('GOOD')), 'GOOD hurdles of', len(tb))

if __name__ == '__main__' and sys.argv[1] == 'report':
    d = pickle.load(open(sys.argv[2], 'rb'))
    cells = analyse(d['results'])
    summ = hurdle_summary(cells)
    for h, s in summ.items():
        print('%-20s %s' % (h, s['label']), s.get('counts'))
