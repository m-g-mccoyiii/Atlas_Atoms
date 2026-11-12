"""The spec generator: pick_spec(molecule, round_number, carried, rng, ...) -> Pick (a spec and its N, or two from round 6 on).

Needs hurdle_table.json (written by `python hurdle_study.py table FIT.pkl table.json`, then `rider` and `addrider`, see SPECS.md): the specs
that are kept, the rounds each is offered in, and for each round every N that may be offered (`usable`) with the clear rates the
players had on the FIT pool of molecules.  The generator is tested on the HELD-OUT pool (hurdle_gen_test.py).

How it chooses (table mode only; the sim mode of the first version is gone, see SPECS.md):
  1. Candidates are the kept specs the table offers in this round, that the carried reagents and held reflexes can feed, that are
     inside the tier, and that are not of the family used by the previous round.  Every usable N is a candidate.  A candidate is drawn
     with weights: a fitted clear rate near the round's target, a spec not used earlier in the run, a low clear rate for the
     yield-only player.
  2. N is the table's N, cut to the molecule's cap (growth: at most the start size and 56 atoms in all).
  3. A pick is refused for this molecule if the aiming player reaches N in fewer than half of the six trial rounds (MIN_EST; deals
     decide), or if it never does and a search cannot reach it either (no proof), or if the yield-only player clears it in every
     trial round (it asks nothing).
  4. From round 6 two specs of different families and plans are picked (and not a known clash) so that the product of their fitted
     rates, times the calibration `pair_corr`, is near the target; now and then (RIDER_SHARE) the second is the held-back spec
     ('at least N turns firing fewer than three') beside a spec taken a little easier.
  5. Proof of reach: a round played out that reached every N, else a beam search that ignores the deal (`reach_search`).
  6. Fall back: if no candidate passes in twenty draws, the plain specs (runoff over the round, atoms bigger, reflexes after the first
     reagent) are tried at the table's N; if even they fail, 1 runoff over the round.
"""
import itertools
import json
import math
import os
from collections import Counter

import engine as E
import hurdles as H
from chemlib import canon

TABLE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hurdle_table.json')
_TABLE = None
RIDER_SHARE = 0.25
MIN_EST = 0.5               # the aiming player must reach the pick in at least this share of the trial rounds (deals decide)
YIELD_PENALTY = 2.0         # how much less often a spec is drawn that the yield-only player clears by itself
FAMILY_TIER = {'chain': 0, 'runoff': 0, 'restraint': 0, 'size': 1, 'makeup': 1, 'shape': 2, 'timing': 2}
# two specs that cannot sit in one round: they pull against each other, or are the same count read twice
INCOMPATIBLE = [{'growth', 'cut_down'}, {'growth', 'finish_smaller'}, {'growth', 'lean_turns'}, {'quiet_then_loud', 'opening_burst'},
                {'rings', 'five_rings'}, {'rings', 'six_rings'}, {'rings', 'by_two_rings'}, {'quiet_then_loud', 'opener'},
                {'quiet_then_loud', 'closer'}, {'growth', 'unused_reagents'}, {'end_OH', 'cut_down'}, {'fewer_groups', 'end_CO'},
                {'fewer_groups', 'end_OH'}, {'fewer_groups', 'end_CC'}]


def table():
    global _TABLE
    if _TABLE is None:
        _TABLE = json.load(open(TABLE_PATH)) if os.path.exists(TABLE_PATH) else {'specs': {}, '_meta': {}}
    return _TABLE


def set_table(t):
    global _TABLE
    _TABLE = t


def compatible(a, b):
    return a.family != b.family and a.plan != b.plan and {a.name, b.name} not in INCOMPATIBLE


# ---------------------------------------------------------------------------------------------------------------
# reaching a spec: playing it out, and a search that ignores the deal
# ---------------------------------------------------------------------------------------------------------------

def play_with(eng, smi, carried, rules, player, seed):
    return eng.play_round(smi, carried, rules, player, seed, analyse=False)


def reach_search(eng, smi, carried, rules, aims, beam=3, turns=3):
    """Do some three lines (one a turn, any carried reagents, each at most 3 uses, the deal ignored) reach every (spec, N) of aims?
    A beam search that keeps the states closest to the numbers.  Returns the lines found, or None.  Finding lines is a proof;
    finding none is not (the beam can miss)."""
    smi = eng.reopen(canon(smi))[0]
    start = smi
    shorts = any(h.short for h, _ in aims)
    lens = (3, 2, 1) if shorts else (3,)
    states = [(smi, {r: 3 for r in carried}, [], [])]
    for _ in range(turns):
        nxt = {}
        for cur, left, done, lines in states:
            for L in lens:
                for line in itertools.product(carried, repeat=L):
                    c = Counter(line)
                    if any(left.get(r, 0) < n for r, n in c.items()):
                        continue
                    tr = eng.run_line(cur, line, tuple(rules))
                    td = H.turn_dict(line, tr)
                    lg = H.Log(start, done + [td], carried)
                    prog = sum(h.progress(lg, n) for h, n in aims)
                    nl = dict(left)
                    for r in line:
                        nl[r] -= 1
                    ns = eng.reopen(tr.smi)[0]
                    key = (ns, tuple(sorted(nl.items())), tuple(len(x['chain']) for x in done + [td]))
                    if key not in nxt or nxt[key][0] < prog:
                        nxt[key] = (prog, (ns, nl, done + [td], lines + [line]))
        best = sorted(nxt.values(), key=lambda x: -x[0])[:beam]
        if not best:
            return None
        if best[0][0] >= len(aims) - 1e-9:
            return best[0][1][3]
        states = [b[1] for b in best]
    return None


# ---------------------------------------------------------------------------------------------------------------
# the generator
# ---------------------------------------------------------------------------------------------------------------

class Pick:
    def __init__(self, aims, target, mode='table'):
        self.aims = aims                # [(Spec, N), ...]
        self.target = target
        self.mode = mode
        self.est = None                 # share of trial rounds in which the aiming player reached it
        self.tries = 0
        self.fell_back = False
        self.witness = None             # the lines of a round that reached it (the proof)
        self.proof = None               # 'played' or 'search'
        self.rider = False

    @property
    def families(self):
        return [h.family for h, _ in self.aims]

    @property
    def names(self):
        return [h.name for h, _ in self.aims]

    @property
    def plans(self):
        return [h.plan for h, _ in self.aims]

    def text(self):
        return ' and '.join(h.condition(n) for h, n in self.aims)

    def __repr__(self):
        return 'Pick(%s)' % ', '.join('%s>=%d' % (h.name, n) for h, n in self.aims)


def _cell(name, rnd):
    row = table()['specs'].get(name)
    return None if row is None else row.get('rounds', {}).get(str(rnd))


def candidates(rnd, carried, rules, tier, history, f0=None, pair_with=None):
    """(spec, N, fitted rate of the model, fitted rate of the yield-only player) for every N the table offers in this round for the kept specs: the options of good quality
    whose rate is near the round's target (rounds 1-5) or between 0.55 and 0.97 (rounds 6-9, where two are offered)."""
    last = set(history[-1].families) if history else set()
    out = []
    for name, row in table()['specs'].items():
        if not row.get('kept') or rnd not in row.get('good_rounds', []):
            continue
        sp = H.SPECS.get(name)
        c = _cell(name, rnd)
        if sp is None or c is None:
            continue
        if FAMILY_TIER.get(sp.family, 3) > tier or not sp.applicable(carried, rules) or sp.family in last:
            continue
        if pair_with is not None and not compatible(sp, pair_with):
            continue
        for o in c['options']:
            if o['N'] not in c['usable']:
                continue
            n = o['N']
            if f0 is not None and sp.cap:
                cap = sp.cap(f0, rnd)
                if cap is not None and cap < n:
                    n = max(1, cap)
            out.append((sp, n, o['model_rate'], o['rates']['Y']))
    return out


def _weights(cands, history, centre, width, scale=1.0, y_with=1.0):
    """Weights: a rate near the centre, a spec not used earlier in the run, and a low rate for the yield-only player (the pair's is
    the product of the two, y_with being the other one's)."""
    used = Counter(nm for p in history for nm in p.names)
    return [math.exp(-0.5 * (((rate * scale) - centre) / width) ** 2) / (1.0 + 2 * used[sp.name]) * math.exp(-YIELD_PENALTY * y * y_with) + 1e-9
            for sp, n, rate, y in cands]


def _draw(cands, w, rng):
    r = rng.random() * sum(w)
    for c, x in zip(cands, w):
        r -= x
        if r < 0:
            return c
    return cands[-1]


def pair_corr(rnd):
    return table().get('_meta', {}).get('pair_corr', {}).get(str(rnd), 1.0)


def rider_factor(rnd):
    return table().get('_meta', {}).get('rider_factor', {}).get(str(rnd), 0.85)


def pick_spec(molecule, round_number, carried, rng, tier=3, history=(), rules=None, mode='table', k=6, kp=6, engine=None,
              pair=None):
    """A spec (or, from round 6 on, two from different families) and its N for a dealt molecule.

    molecule: SMILES.  carried: the reagents carried (at most 8).  rules: the reflexes held (default: the round's band).
    rng: random.Random.  tier 0..3: how many families are open.  history: the earlier Picks of this run (the family just used is
    not offered again, specs used already are less likely).  pair: True or False to force; default is a pair from round 6 on.
    Never offered: a spec that no trial round reached and the search could not reach; a spec the yield-only player clears in every
    trial round (it asks nothing).  pick.fell_back is True when no kept spec could be offered and a plain one was used."""
    from hurdle_study import SHIFT, aim_target as round_target
    SHIFT.update({int(k): v for k, v in table().get('_meta', {}).get('shift', {}).items()})
    rules = tuple(rules if rules is not None else H.RULES_BAND[round_number])
    carried = tuple(carried)
    eng = engine or E.Engine()
    smi = canon(molecule)
    f0 = H.feat(eng.reopen(smi)[0])
    tgt = round_target(round_number)
    want_pair = (round_number >= 6) if pair is None else pair
    token = '%.9f' % rng.random()
    seeds = ['cal/%s/%d' % (token, i) for i in range(k)]
    pseeds = ['calp/%s/%d' % (token, i) for i in range(kp)]
    tries = [0]

    def trial(aims):
        ok, wit = 0, None
        for s in seeds:
            rr = play_with(eng, smi, carried, rules, H.AimPlayer(aims), s)
            lg = H.round_log(rr)
            if all(h.fn(lg) >= n for h, n in aims):
                ok += 1
                if wit is None:
                    wit = [t['line'] for t in rr['turns']]
        yall = True
        for s in pseeds:
            rr = play_with(eng, smi, carried, rules, E.PLAYERS['greedy'], s)
            lg = H.round_log(rr)
            if not all(h.fn(lg) >= n for h, n in aims):
                yall = False
                break
        return ok / float(len(seeds)), wit, yall

    def accept(aims, min_est=MIN_EST):
        tries[0] += 1
        est, wit, yall = trial(aims)
        if yall or est < min_est:
            return None
        proof = 'played'
        if wit is None:
            wit = reach_search(eng, smi, carried, rules, aims)
            proof = 'search'
            if wit is None:
                return None
        return est, wit, proof

    chosen = None
    cands = candidates(round_number, carried, rules, tier, history, f0)
    corr = pair_corr(round_number)
    used = Counter(nm for p in history for nm in p.names)
    for _ in range(20):
        if not cands:
            break
        if not want_pair:
            a = _draw(cands, _weights(cands, history, tgt, 0.07), rng)
            cands = [c for c in cands if c is not a]
            aims = [(a[0], a[1])]
            r = accept(aims)
            if r:
                chosen = (aims, r, False)
                break
            continue
        a = _draw(cands, [math.exp(-YIELD_PENALTY * c[3]) / (1.0 + 2 * used[c[0].name]) for c in cands], rng)
        cands = [c for c in cands if c is not a]
        rid = table().get('riders', {}).get('held_back')
        if rid and rng.random() < RIDER_SHARE:
            # a spec taken a little easier, and one turn held back
            rn = rid.get(str(round_number), 1)
            ok = _weights([a], history, tgt, 0.06, scale=rider_factor(round_number), y_with=0.0)
            if ok[0] > 0.2:
                aims = [(a[0], a[1]), (H.SPECS['held_back'], rn)]
                r = accept(aims)
                if r:
                    chosen = (aims, r, True)
                    break
        others = candidates(round_number, carried, rules, tier, history, f0, pair_with=a[0])
        for _ in range(6):
            if not others:
                break
            w = _weights(others, history, tgt, 0.05, scale=a[2] * corr, y_with=a[3])
            if sum(w) < 0.05:
                break
            b = _draw(others, w, rng)
            others = [c for c in others if c is not b]
            aims = [(a[0], a[1]), (b[0], b[1])]
            r = accept(aims)
            if r:
                chosen = (aims, r, False)
                break
        if chosen:
            break
    if chosen is None:
        pk = None
        for name in ('off_total', 'growth', 'opener'):
            sp = H.SPECS[name]
            c = _cell(name, round_number)
            nn = c['ref'] if c and c.get('ref') else 1
            if sp.cap:
                cap = sp.cap(f0, round_number)
                nn = min(nn, cap) if cap else nn
            aims = [(sp, max(1, nn))]
            r = accept(aims, min_est=0.0)
            if r:
                pk = Pick(aims, tgt, mode)
                pk.est, pk.witness, pk.proof = r
                break
        if pk is None:
            pk = Pick([(H.SPECS['off_total'], 1)], tgt, mode)
        pk.fell_back = True
    else:
        pk = Pick(chosen[0], tgt, mode)
        pk.est, pk.witness, pk.proof = chosen[1]
        pk.rider = chosen[2]
    pk.tries = tries[0]
    return pk


pick_hurdle = pick_spec
