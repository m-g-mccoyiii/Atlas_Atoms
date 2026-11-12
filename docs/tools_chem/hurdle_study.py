"""The large test of the specs: for every spec and every round 1..9, many rounds, six players, a fitting pool and a held-out pool.

  python hurdle_study.py fit U OUT.pkl [rounds]          U rounds per round number on the FIT pool; every live spec; players told no N
  python hurdle_study.py table FIT.pkl OUT.json          sort the specs, drop twins and crowded plans, write the table
  python hurdle_study.py rider POOL U TABLE.json OUT.pkl the base specs of rounds 6-9 with and without the held-back spec
  python hurdle_study.py addrider TABLE.json RIDER.pkl OUT.json   put the rider into the table
  python hurdle_study.py told POOL U TABLE.json OUT.pkl  the kept specs at the table's N, on POOL ('heldout' for the report), players told N
  python hurdle_study.py numbers TABLE.json TOLD.pkl|- OUT.tsv   write hurdle_numbers.tsv
Players: yield (the engine's greedy player), random, new (a person learning), seek/aim (a player who aims), middling and skilled
(per turn, aim with chance 0.5 or 0.95, else play like the new player).  See hurdles.py.

The molecules are split into two pools by the hash of the canonical SMILES: the FIT pool (the table is fitted on it) and the
HELD-OUT pool (the table never sees it).  Half the rounds deal the game's own molecules (as the game deals them, restricted to the
pool), half deal generated ones of the round's size.  The reagents carried are those a real run holds (hurdles.run_carried).
Targets: the new player clears about 75, 65 and 55 percent in rounds 1-3; the middling player MID_TARGET in rounds 4-9.
"""
import hashlib
import json
import math
import multiprocessing as mp
import pickle
import random
import statistics
import sys
import time
from collections import defaultdict
from functools import lru_cache

import numpy as np

import engine as E
import hurdles as H
import library
import molecules

ROUNDS = range(1, 10)
# the clear rate wanted of the new-player model in rounds 1 to 3, of the middling model in rounds 4 to 9
NEW_TARGET = {1: 0.75, 2: 0.65, 3: 0.55}
MID_TARGET = {4: 0.90, 5: 0.87, 6: 0.81, 7: 0.78, 8: 0.73, 9: 0.68}
TOL = 0.10                  # how far from its target the clear rate of the model may be at the N chosen


def target(rnd):
    return NEW_TARGET[rnd] if rnd <= 3 else MID_TARGET[rnd]


def model_of(rnd):
    return 'W' if rnd <= 3 else 'M'


PAIR_CORR = {str(r): 0.90 for r in range(6, 10)}              # per round: joint clear rate of two specs divided by the product of their rates (from the calibration)
SHIFT = {1: 0.05, 3: 0.03}  # per round: how far the target is moved when N is chosen (found by the calibration runs on the fit pool)


def aim_target(rnd):
    """The clear rate N is chosen for: the round's target moved by the calibration."""
    return min(0.97, max(0.3, target(rnd) + SHIFT.get(rnd, 0.0)))


def single_target(rnd):
    """The clear rate wanted of one spec: the round's target in rounds 1-5, its square root when two specs are offered (6-9)."""
    t = aim_target(rnd)
    return math.sqrt(t) if rnd >= 6 else t


# ---------------------------------------------------------------------------------------------------------------
# the two pools of molecules
# ---------------------------------------------------------------------------------------------------------------

def _hash(s):
    return int(hashlib.md5(s.encode()).hexdigest(), 16)


def in_pool(smi, pool):
    return (_hash(smi) % 2 == 0) == (pool == 'fit')


@lru_cache(maxsize=None)
def pool_gen(pool, rnd):
    """{size: [canonical SMILES]} of generated molecules for a round, in this pool only."""
    base = int(round(molecules.ROUND_SIZES[rnd - 1]))
    out = {}
    for size in range(max(8, base - 2), base + 3):
        g = molecules.generate(size, random.Random('pool/%d/%d' % (rnd, size)), 400, 'any', tries=8000)
        out[size] = sorted(m.canonical for m in g if in_pool(m.canonical, pool))
    return out


@lru_cache(maxsize=None)
def pool_game(pool, rnd):
    w = molecules.deal_weights(rnd, 3)
    items = sorted((k, v) for k, v in w.items() if in_pool(k, pool))
    return items


def draw_molecule(pool, rnd, rng, src):
    if src == 'game':
        items = pool_game(pool, rnd)
        if items:
            r = rng.random() * sum(v for _, v in items)
            for k, v in items:
                r -= v
                if r < 0:
                    return k, 'game'
            return items[-1][0], 'game'
    g = pool_gen(pool, rnd)
    base = int(round(molecules.ROUND_SIZES[rnd - 1]))
    for _ in range(10):
        size = max(8, base + rng.choice([-2, -1, 0, 0, 1, 2]))
        if g.get(size):
            return rng.choice(g[size]), 'generated'
    size = rng.choice([s for s in g if g[s]])
    return rng.choice(g[size]), 'generated'


def make_unit(pool, rnd, idx):
    """The molecule, carried reagents and reflexes of one round of one run.  idx is the run (its carried set grows with the round)."""
    rng = random.Random('unit/%s/%d/%d' % (pool, rnd, idx))
    smi, src = draw_molecule(pool, rnd, rng, 'game' if (idx + rnd) % 2 == 0 else 'gen')
    carried = H.run_carried('%s/%d' % (pool, idx))[rnd]
    return smi, src, carried, H.RULES_BAND[rnd]


def play(eng, smi, carried, rules, player, seed):
    return eng.play_round(smi, carried, rules, player, seed, analyse=False)


# ---------------------------------------------------------------------------------------------------------------
# the fit: every live spec, players told nothing
# ---------------------------------------------------------------------------------------------------------------

def work_fit(unit):
    pool, rnd, idx, names = unit
    smi, src, carried, rules = make_unit(pool, rnd, idx)
    eng = E.Engine()
    seed = '%s/%d/%d' % (pool, rnd, idx)
    out = {'pool': pool, 'rnd': rnd, 'idx': idx, 'src': src, 'smi': smi, 'carried': carried, 'vals': {}}
    f0 = H.feat(E.canon(smi))
    out['atoms'] = f0['atoms']
    ry = play(eng, smi, carried, rules, E.PLAYERS['greedy'], seed)
    rr = play(eng, smi, carried, rules, E.PLAYERS['random'], seed)
    ly, lr = H.round_log(ry), H.round_log(rr)
    out['ypay'], out['rpay'] = ry['pay'], rr['pay']
    out['Y'] = {n: s.fn(ly) for n, s in H.SPECS.items()}
    out['R'] = {n: s.fn(lr) for n, s in H.SPECS.items()}
    for name in names:
        sp = H.SPECS[name]
        if not sp.applicable(carried, rules):
            continue
        res = {}
        for key, kind in (('S', 'seek'), ('W', 'new'), ('M', 'middling'), ('K', 'skilled')):
            pl = H.make_player(kind, [(sp, None)])
            r = play(eng, smi, carried, rules, pl, seed)
            res[key] = sp.fn(H.round_log(r))
            if key == 'S':
                res['Spay'] = r['pay']
        out['vals'][name] = res
    return out


def run_fit(pool, u, out, rounds=ROUNDS, names=None, procs=15):
    names = names or [s.name for s in H.live_specs()]
    units = [(pool, r, i, names) for i in range(u) for r in rounds]
    t0 = time.time()
    res = []
    with mp.Pool(procs) as p:
        for k, o in enumerate(p.imap_unordered(work_fit, units, chunksize=1)):
            res.append(o)
            if (k + 1) % 100 == 0:
                print('%d/%d  %.0fs' % (k + 1, len(units), time.time() - t0), flush=True)
    pickle.dump({'results': res, 'seconds': time.time() - t0, 'u': u, 'pool': pool, 'names': names}, open(out, 'wb'))
    print('done %d units in %.0fs' % (len(res), time.time() - t0))


# ---------------------------------------------------------------------------------------------------------------
# the N-told runs: the table's N (and the N either side) on a pool
# ---------------------------------------------------------------------------------------------------------------

def work_told(unit):
    """unit: (pool, rnd, idx, [(name, N), ...]).  Every (name, N) played by yield (once), random (once) and new, aim, middling and
    skilled, told N."""
    pool, rnd, idx, specs = unit
    smi, src, carried, rules = make_unit(pool, rnd, idx)
    eng = E.Engine()
    seed = '%s/%d/%d' % (pool, rnd, idx)
    out = {'pool': pool, 'rnd': rnd, 'idx': idx, 'src': src, 'smi': smi, 'carried': carried, 'atoms': H.feat(E.canon(smi))['atoms'],
           'vals': {}}
    ry = play(eng, smi, carried, rules, E.PLAYERS['greedy'], seed)
    rr = play(eng, smi, carried, rules, E.PLAYERS['random'], seed)
    ly, lr = H.round_log(ry), H.round_log(rr)
    out['ypay'] = ry['pay']
    for name, n in specs:
        sp = H.SPECS[name]
        if not sp.applicable(carried, rules):
            continue
        n_nom = n
        cap = sp.cap(H.feat(E.canon(smi)), rnd) if sp.cap else None
        if cap is not None and n > cap:
            n = max(1, cap)
        res = {'Y': sp.fn(ly), 'R': sp.fn(lr), 'eff': n}
        for key, kind in (('S', 'seek'), ('W', 'new'), ('A', 'aim'), ('M', 'middling'), ('K', 'skilled')):
            pl = H.make_player(kind, [(sp, n)])
            r = play(eng, smi, carried, rules, pl, seed)
            res[key] = sp.fn(H.round_log(r))
            res[key + 'pay'] = r['pay']
        res['ypay'] = ry['pay']
        out['vals'][(name, n_nom)] = res
    return out


def run_told(pool, u, specs_by_round, out, procs=15):
    """specs_by_round: {rnd: [(name, N), ...]}."""
    units = [(pool, r, i, specs_by_round[r]) for i in range(u) for r in sorted(specs_by_round)]
    t0 = time.time()
    res = []
    with mp.Pool(procs) as p:
        for k, o in enumerate(p.imap_unordered(work_told, units, chunksize=1)):
            res.append(o)
            if (k + 1) % 100 == 0:
                print('%d/%d  %.0fs' % (k + 1, len(units), time.time() - t0), flush=True)
    pickle.dump({'results': res, 'seconds': time.time() - t0, 'u': u, 'pool': pool}, open(out, 'wb'))
    print('done %d units in %.0fs' % (len(res), time.time() - t0))


# ---------------------------------------------------------------------------------------------------------------
# the analysis
# ---------------------------------------------------------------------------------------------------------------

def frac_ge(a, n):
    return sum(1 for x in a if x >= n) / float(len(a)) if len(a) else 0.0


def pct(a, q):
    s = sorted(a)
    return s[min(len(s) - 1, int(q * len(s)))] if s else 0


def rank_avg(a):
    a = np.asarray(a, float)
    u, inv, cnt = np.unique(a, return_inverse=True, return_counts=True)
    cs = np.cumsum(cnt)
    return (cs - (cnt - 1) / 2.0)[inv]


def spearman(a, b):
    if len(a) < 10:
        return float('nan')
    ra, rb = rank_avg(a), rank_avg(b)
    if ra.std() == 0 or rb.std() == 0:
        return float('nan')
    return float(np.corrcoef(ra, rb)[0, 1])


def rho_table(results, names):
    """{(a, b): [rho in round 1..9]} from the values of every spec on the same plays (the yield and random players' rounds), only on
    rounds where both specs apply."""
    by = defaultdict(list)
    for r in results:
        by[r['rnd']].append(r)
    out = {}
    for rnd in ROUNDS:
        rows = by.get(rnd, [])
        rules = H.RULES_BAND[rnd]
        vec = {}
        ok = {}
        for n in names:
            sp = H.SPECS[n]
            use = [i for i, r in enumerate(rows) if sp.applicable(r['carried'], rules)]
            ok[n] = set(use)
            vec[n] = (np.array([rows[i]['Y'][n] for i in use] + [rows[i]['R'][n] for i in use], float), use)
        for i, a in enumerate(names):
            for b in names[i + 1:]:
                common = sorted(ok[a] & ok[b])
                if len(common) < 30:
                    out.setdefault((a, b), []).append(float('nan'))
                    continue
                va = [rows[k]['Y'][a] for k in common] + [rows[k]['R'][a] for k in common]
                vb = [rows[k]['Y'][b] for k in common] + [rows[k]['R'][b] for k in common]
                out.setdefault((a, b), []).append(spearman(va, vb))
    return out


def median_rho(rs):
    v = [x for x in rs if x == x]
    return statistics.median(v) if v else float('nan')


GAP = 0.10                  # the aiming player must clear the spec this much more often than the yield-only player
Y_MAX = 0.85                # the yield-only player may not clear it more often than this
S_MIN = {1: 0.78, 2: 0.78, 3: 0.78, 4: 0.82, 5: 0.82, 6: 0.88, 7: 0.88, 8: 0.88, 9: 0.86}   # the aiming player must reach N this often (deals differ, so it can fail)
PAY_MIN = 0.5               # a player who aims and clears keeps at least this share of the yield-only player's yield
PAY_MIN_GRAIN = 0.3         # ... for a spec that makes the player give something up
PAIR_LO, PAIR_HI = 0.55, 0.97   # a spec used as one of two must be cleared by the model this often


def eff_thr(sp, n, atoms, rnd):
    """N for one molecule: cut to the spec's cap for that molecule (growth: at most the start size and 56 atoms in all)."""
    if sp.cap:
        cap = sp.cap({'atoms': atoms}, rnd)
        if cap is not None:
            return min(n, max(1, cap))
    return n


def rate_of(vals, thr):
    return sum(1 for v, t in zip(vals, thr) if v >= t) / float(len(vals)) if len(vals) else 0.0


def cell_of(rows, rnd, name, tg=None):
    """The sorting of one spec in one round from the fit rows.  Returns a dict: 'options' (one entry for each N whose model rate is
    at least 0.25: the rates of the six players, room, pay kept, whether the option is of good quality), 'ref' (the option
    nearest the rate wanted of one spec in this round), 'usable' (the options that may be offered in this round), 'label'."""
    sp = H.SPECS[name]
    atoms = [r['atoms'] for r in rows]
    V = {k: [r['vals'][name][k] for r in rows] for k in ('S', 'W', 'M', 'K')}
    V['Y'] = [r['Y'][name] for r in rows]
    V['R'] = [r['R'][name] for r in rows]
    model = model_of(rnd)
    t = single_target(rnd) if tg is None else tg
    top = int(max(V['S'] + V[model] + [1]))
    if sp.cap:
        top = min(top, max(sp.cap({'atoms': a}, rnd) for a in atoms))      # a bigger N would be cut to the cap for every molecule
    p90 = pct(V['S'], 0.9)
    allp = statistics.mean(r['ypay'] for r in rows)
    opts = []
    for n in range(1, top + 1):
        thr = [eff_thr(sp, n, a, rnd) for a in atoms]
        rates = {k: rate_of(V[k], thr) for k in V}
        if rates[model] < 0.25:
            break
        room_ok = p90 >= n + 2 or (sp.tops_out and p90 >= 2 * n)
        keep = [r['vals'][name]['Spay'] for r, th in zip(rows, thr) if r['vals'][name]['S'] >= th]
        ratio = (statistics.mean(keep) / allp) if keep and allp > 0 else None
        gap_ok = rates['S'] - rates['Y'] >= GAP and rates['Y'] <= Y_MAX
        pay_ok = ratio is None or ratio >= (PAY_MIN_GRAIN if sp.grain else PAY_MIN)
        reach_ok = rates['S'] >= S_MIN[rnd]
        opts.append({'N': n, 'rates': rates, 'model_rate': rates[model], 'room_ok': room_ok, 'gap_ok': gap_ok,
                     'pay_ok': pay_ok, 'reach_ok': reach_ok, 'pay_ratio': ratio,
                     'quality': room_ok and gap_ok and pay_ok and reach_ok})
    c = {'n': len(rows), 'options': opts, 'p90': p90, 'max': max(V['S']), 'target': t}
    if not opts:
        c.update(label='TOO RARE', ref=None, usable=[])
        return c
    q = [o for o in opts if o['quality']]
    pool = q or opts
    ref = min(pool, key=lambda o: (abs(o['model_rate'] - t), -o['N']))
    c['ref'] = ref['N']
    if rnd <= 5:
        usable = [o for o in q if abs(o['model_rate'] - aim_target(rnd)) <= TOL]
    else:
        usable = [o for o in q if PAIR_LO <= o['model_rate'] <= PAIR_HI]
    c['usable'] = [o['N'] for o in usable]
    if usable:
        c['label'] = 'GOOD'
    else:
        near = min(opts, key=lambda o: abs(o['model_rate'] - t))
        if not near['room_ok']:
            c['label'] = 'NO ROOM'
        elif not near['gap_ok']:
            c['label'] = 'TRACKS THE SCORE'
        elif not near['pay_ok']:
            c['label'] = 'FIGHTS THE SCORE'
        elif not near['reach_ok']:
            c['label'] = 'TOO HARD TO REACH'
        else:
            c['label'] = 'MISSES THE RATE'
    return c


def sort_specs(results, names=None):
    """{(name, rnd): cell} for every live spec."""
    by = defaultdict(list)
    for r in results:
        for n in r['vals']:
            by[(n, r['rnd'])].append(r)
    cells = {}
    for (n, rnd), rows in by.items():
        if len(rows) < 40 or n == 'held_back':
            continue
        cells[(n, rnd)] = cell_of(rows, rnd, n)
    return cells


def words(spec):
    return len(spec.text.format(N='N').split())


def prefer_key(name, good):
    sp = H.SPECS[name]
    return (sp.plain, words(sp), -len(good.get(name, [])), name)


def choose_kept(cells, rho, min_good=2, per_plan=3, riders=('held_back',)):
    """Keep the specs that sort GOOD in at least `min_good` rounds; drop a twin (median rank agreement above 0.85 on the same
    plays) keeping the plainer; keep at most `per_plan` per plan.  Returns (kept, dropped {name: reason}, good {name: [rounds]})."""
    from collections import Counter
    good, labels = {}, {}
    for (n, rnd), c in cells.items():
        labels.setdefault(n, {})[rnd] = c['label']
        if c['label'] == 'GOOD':
            good.setdefault(n, []).append(rnd)
    for n in good:
        good[n].sort()
    dropped = {}
    cand = [n for n in good if len(good[n]) >= min_good and n not in riders]
    for n in labels:
        if n in riders or n in cand:
            continue
        cnt = Counter(labels[n].values())
        dropped[n] = 'sorted %s in most rounds%s' % (cnt.most_common(1)[0][0],
                                                      (' (GOOD in %s)' % ','.join(map(str, good[n]))) if n in good else '')

    def agree(a, b):
        key = (a, b) if (a, b) in rho else (b, a)
        return median_rho(rho.get(key, [float('nan')]))
    order = sorted(cand, key=lambda n: prefer_key(n, good))
    kept = []
    for n in order:
        twin = next((k for k in kept if agree(n, k) > 0.85), None)
        same = next((k for k in kept if H.SPECS[n].cluster and H.SPECS[k].cluster == H.SPECS[n].cluster), None)
        if twin:
            dropped[n] = 'twin of %s (rank agreement %.2f)' % (twin, agree(n, twin))
        elif same:
            dropped[n] = 'the same count as %s (%s)' % (same, H.SPECS[n].cluster)
        else:
            kept.append(n)
    final = []
    for plan in sorted({H.SPECS[n].plan for n in kept}):
        inplan = [n for n in kept if H.SPECS[n].plan == plan]
        inplan.sort(key=lambda n: (not H.SPECS[n].grain, -len(good[n]), prefer_key(n, good)))
        for i, n in enumerate(inplan):
            if i < per_plan:
                final.append(n)
            else:
                dropped[n] = 'plan "%s" full (kept %s)' % (plan, ', '.join(inplan[:per_plan]))
    return sorted(final, key=lambda n: (H.SPECS[n].family, H.SPECS[n].plan, n)), dropped, good


# ---------------------------------------------------------------------------------------------------------------
# the table
# ---------------------------------------------------------------------------------------------------------------

def build_table(fit_path, out_path, min_good=2, rho=None):
    d = pickle.load(open(fit_path, 'rb'))
    res = d['results']
    names = d['names']
    cells = sort_specs(res)
    if rho is None:
        rho = rho_table(res, [s.name for s in H.SPECS.values() if s.name not in ('held_back',)])
    kept, dropped, good = choose_kept(cells, rho, min_good=min_good)
    tb = {'_meta': {'new_target': NEW_TARGET, 'mid_target': MID_TARGET, 'shift': {str(k): v for k, v in SHIFT.items()}, 'pair_corr': PAIR_CORR,
                    'tol': TOL, 'p_aim': H.P_AIM, 'fit_units': d['u'],
                    'built': time.strftime('%Y-%m-%d %H:%M')},
          'specs': {}, 'riders': {}}
    for n in names:
        if n == 'held_back':
            continue
        sp = H.SPECS[n]
        row = {'family': sp.family, 'plan': sp.plan, 'kept': n in kept, 'good_rounds': good.get(n, []) if n in kept else [],
               'dropped': dropped.get(n), 'rounds': {}}
        for rnd in ROUNDS:
            c = cells.get((n, rnd))
            if c:
                row['rounds'][str(rnd)] = c
        tb['specs'][n] = row
    json.dump(tb, open(out_path, 'w'), indent=1, default=float)
    return tb, kept, dropped, rho


# ---------------------------------------------------------------------------------------------------------------
# the held-back spec: it only makes sense beside another spec
# ---------------------------------------------------------------------------------------------------------------

def work_rider(unit):
    """unit: (pool, rnd, idx, [(name, N), ...]).  Each base spec alone and with 'at least 1 turn firing fewer than three' beside
    it, played by the aiming, middling and skilled players (who may fire fewer than three) and by the yield-only player."""
    pool, rnd, idx, bases = unit
    smi, src, carried, rules = make_unit(pool, rnd, idx)
    eng = E.Engine()
    seed = '%s/%d/%d' % (pool, rnd, idx)
    hb = H.SPECS['held_back']
    ry = play(eng, smi, carried, rules, E.PLAYERS['greedy'], seed)
    ly = H.round_log(ry)
    out = {'rnd': rnd, 'idx': idx, 'vals': {}}
    for name, n in bases:
        sp = H.SPECS[name]
        if not sp.applicable(carried, rules):
            continue
        f0 = H.feat(E.canon(smi))
        if sp.cap:
            cap = sp.cap(f0, rnd)
            if cap is not None:
                n = min(n, max(1, cap))
        res = {'y_base': sp.fn(ly) >= n, 'y_pair1': sp.fn(ly) >= n and hb.fn(ly) >= 1}
        for kind in ('aim', 'middling', 'skilled'):
            for tag, aims in (('base', [(sp, n)]), ('pair1', [(sp, n), (hb, 1)]), ('pair2', [(sp, n), (hb, 2)])):
                r = play(eng, smi, carried, rules, H.make_player(kind, aims), seed)
                lg = H.round_log(r)
                res[kind + '_' + tag] = all(h.fn(lg) >= m for h, m in aims)
        out['vals'][(name, n)] = res
    return out


def run_rider(pool, u, bases_by_round, out, procs=15):
    units = [(pool, r, i, bases_by_round[r]) for i in range(u) for r in sorted(bases_by_round)]
    res = []
    t0 = time.time()
    with mp.Pool(procs) as p:
        for k, o in enumerate(p.imap_unordered(work_rider, units, chunksize=1)):
            res.append(o)
            if (k + 1) % 100 == 0:
                print('%d/%d  %.0fs' % (k + 1, len(units), time.time() - t0), flush=True)
    pickle.dump({'results': res, 'u': u, 'pool': pool}, open(out, 'wb'))
    print('done %d units in %.0fs' % (len(res), time.time() - t0))


def rider_summary(results):
    """By round: the mean clear rate of the base specs alone and with the rider, for each player."""
    by = defaultdict(lambda: defaultdict(list))
    for r in results:
        for (name, n), v in r['vals'].items():
            for k, x in v.items():
                by[r['rnd']][k].append(1.0 if x else 0.0)
    return {rnd: {k: statistics.mean(v) for k, v in d.items()} for rnd, d in by.items()}


def add_riders(table_path, rider_pkl, out_path):
    """Writes the 'riders' part of the table from run_rider: for each round 6-9 the held-back N (1, or 2 when one turn costs the middling
    player less than 5 points) and rider_factor (the middling player's clear rate with the rider divided by without)."""
    tb = json.load(open(table_path))
    summ = rider_summary(pickle.load(open(rider_pkl, 'rb'))['results'])
    rid, fac = {}, {}
    for rnd, d in sorted(summ.items()):
        base, p1, p2 = d['middling_base'], d['middling_pair1'], d['middling_pair2']
        rid[str(rnd)] = 2 if (base - p1) < 0.05 and p2 > 0.5 * base else 1
        fac[str(rnd)] = round((p2 if rid[str(rnd)] == 2 else p1) / base, 3) if base else 1.0
    tb['riders'] = {'held_back': rid}
    tb['_meta']['rider_factor'] = fac
    tb['_meta']['rider_summary'] = {str(k): v for k, v in summ.items()}
    json.dump(tb, open(out_path, 'w'), indent=1, default=float)
    return rid, fac


def told_summary(results):
    """{(name, rnd, N): {'n', rates of Y R W A M K, 'room' (p90 of the seeker's value minus N), 'p90'}} from run_told."""
    by = defaultdict(list)
    for r in results:
        for (name, n), v in r['vals'].items():
            by[(name, r['rnd'], n)].append(v)
    out = {}
    for key, rows in by.items():
        name, rnd, n = key
        thr = [v['eff'] for v in rows]
        d = {'n': len(rows)}
        for k in ('Y', 'R', 'S', 'W', 'A', 'M', 'K'):
            d[k] = sum(1 for v, t in zip(rows, thr) if v[k] >= t) / float(len(rows))
        d['p90'] = pct([v['S'] for v in rows], 0.9)
        d['room'] = d['p90'] - n
        d['pay_ratio'] = statistics.mean(v['Apay'] for v in rows) / statistics.mean(v['ypay'] for v in rows)
        out[key] = d
    return out


def write_numbers(table_path, told_path, out_path):
    """hurdle_numbers.tsv: every number for every live spec and round: N (the reference one and the ones the generator may use), the
    fit-pool clear rates of the six players, room, the share of yield kept, and, for the kept specs, the held-out clear rates."""
    tb = json.load(open(table_path))
    told = told_summary(pickle.load(open(told_path, 'rb'))['results']) if told_path else {}
    cols = ['spec', 'family', 'plan', 'kept', 'round', 'label', 'ref_N', 'usable_N', 'fit_Y', 'fit_R', 'fit_W', 'fit_S', 'fit_M', 'fit_K',
            'fit_p90', 'fit_room', 'yield_kept', 'held_n', 'held_Y', 'held_R', 'held_W', 'held_A', 'held_M', 'held_K', 'held_room']
    lines = [chr(9).join(cols)]
    for n, row in tb['specs'].items():
        for r in ROUNDS:
            c = row['rounds'].get(str(r))
            if not c:
                continue
            ref = [o for o in c['options'] if o['N'] == c.get('ref')]
            o = ref[0] if ref else None
            t = told.get((n, r, c.get('ref')))
            f = lambda x: '' if x is None else ('%.3f' % x if isinstance(x, float) else str(x))
            vals = [n, row['family'], row['plan'], 'yes' if row['kept'] else 'no', r, c['label'], c.get('ref', ''),
                    ' '.join(str(x) for x in c.get('usable', []))]
            vals += [f(o['rates'][k]) if o else '' for k in 'YRWSMK']
            vals += [f(c.get('p90')), f(c['p90'] - c['ref']) if o else '', f(o['pay_ratio']) if o else '']
            vals += [str(t['n']) if t else ''] + [f(t[k]) if t else '' for k in 'YRWAMK'] + [f(t['room']) if t else '']
            lines.append(chr(9).join(str(x) for x in vals))
    open(out_path, 'w').write(chr(10).join(lines) + chr(10))
    return len(lines) - 1


def refs_from_table(path, kept_only=True):
    """{rnd: [(name, ref N)]} for every kept spec in the rounds it is offered."""
    tb = json.load(open(path))
    out = defaultdict(list)
    for n, row in tb['specs'].items():
        if kept_only and not row['kept']:
            continue
        for r in row['good_rounds']:
            c = row['rounds'][str(r)]
            out[r].append((n, c['ref']))
    return dict(out)



if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'fit':
        run_fit('fit', int(sys.argv[2]), sys.argv[3], [int(x) for x in sys.argv[4].split(',')] if len(sys.argv) > 4 else ROUNDS)
    elif cmd == 'table':
        if len(sys.argv) > 4:
            cfg = json.load(open(sys.argv[4]))
            SHIFT.update({int(k): v for k, v in cfg.get('shift', {}).items()})
            PAIR_CORR.update(cfg.get('pair_corr', {}))
            MID_TARGET.update({int(k): v for k, v in cfg.get('mid_target', {}).items()})
        tb, kept, dropped, rho = build_table(sys.argv[2], sys.argv[3])
        print(len(kept), 'kept:', ', '.join(kept))
        for n, why in sorted(dropped.items()):
            print('  dropped %-20s %s' % (n, why))
    elif cmd == 'told':             # told POOL U TABLE.json OUT.pkl : the kept specs at the table's reference N
        run_told(sys.argv[2], int(sys.argv[3]), refs_from_table(sys.argv[4]), sys.argv[5])
    elif cmd == 'numbers':          # numbers TABLE.json TOLD.pkl OUT.tsv
        print(write_numbers(sys.argv[2], sys.argv[3] if sys.argv[3] != '-' else None, sys.argv[4]), 'rows')
    elif cmd == 'addrider':         # addrider TABLE.json RIDER.pkl OUT.json
        print(add_riders(sys.argv[2], sys.argv[3], sys.argv[4]))
    elif cmd == 'rider':            # rider POOL U TABLE.json OUT.pkl : base specs of rounds 6-9 with and without the held-back spec
        refs = {r: v for r, v in refs_from_table(sys.argv[4]).items() if r >= 6}
        run_rider(sys.argv[2], int(sys.argv[3]), refs, sys.argv[5])
