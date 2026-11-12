"""The hurdle generator: pick_hurdle(molecule, round_number, carried, rng, tier) -> Pick (a hurdle and its N, or two from round 6 on).

Needs hurdle_table.json (written by `python hurdle_study.py table OUT.pkl`): which hurdles the study found GOOD in which round,
and for each the share of seeking players at or above N = 0, 1, 2, ...
"""
import itertools
import json
import os
from collections import Counter

import engine as E
import hurdles as H
from chemlib import canon

TABLE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hurdle_table.json')
_TABLE = None


def table():
    global _TABLE
    if _TABLE is None:
        _TABLE = json.load(open(TABLE_PATH)) if os.path.exists(TABLE_PATH) else {}
    return _TABLE


def set_table(t):
    global _TABLE
    _TABLE = t


# ---------------------------------------------------------------------------------------------------------------
# reaching a hurdle: playing it out, and a search that ignores the deal
# ---------------------------------------------------------------------------------------------------------------

def play_with(eng, smi, carried, rules, player, seed):
    return eng.play_round(smi, carried, rules, player, seed, analyse=False)


def seek_values(eng, smi, carried, rules, h, seeds):
    """The hurdle's value and the points, for a player who aims at it (SeekPlayer): one round per seed (the seed fixes the deals)."""
    out = []
    for s in seeds:
        rr = play_with(eng, smi, carried, rules, H.SeekPlayer(h), s)
        out.append((h.check(smi, rr), rr['pay']))
    return out


def reach_search(eng, smi, carried, rules, aims, beam=3, turns=3):
    """Do some three lines (one a turn, any carried reactions, each at most 3 uses, the deal ignored) reach every (hurdle, N)
    of aims?  A beam search that keeps the states closest to the numbers.  Returns the lines found, or None.  Finding lines is
    a proof; finding none is not (the beam can miss)."""
    smi = eng.reopen(canon(smi))[0]
    start = smi
    states = [(smi, {r: 3 for r in carried}, [], [])]
    for _ in range(turns):
        nxt = {}
        for cur, left, done, lines in states:
            for line in itertools.product(carried, repeat=3):
                c = Counter(line)
                if any(left.get(r, 0) < n for r, n in c.items()):
                    continue
                tr = eng.run_line(cur, line, tuple(rules))
                td = H.turn_dict(line, tr)
                lg = H.Log(start, done + [td])
                prog = sum(min(h.fn(lg), n) / float(n) for h, n in aims)
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
FAMILY_TIER = {'chain': 0, 'off': 0, 'restraint': 0, 'size': 1, 'makeup': 1, 'shape': 2, 'timing': 2}
# two hurdles that cannot sit in one round: they pull against each other, or are the same count read twice
INCOMPATIBLE = [{'growth', 'cut_down'}, {'growth', 'size_range'}, {'cut_down', 'size_range'}, {'growth', 'weight'},
                {'cut_down', 'weight'}, {'every_turn', 'long_chain'}, {'every_turn', 'finish_strong'},
                {'rings', 'five_rings'}, {'rings', 'six_rings'}, {'busy', 'by_two_busy'}, {'rings', 'by_two_rings'},
                {'off_total', 'by_two_off_total'}]


def compatible(a, b):
    return a.family != b.family and {a.name, b.name} not in INCOMPATIBLE


def sf_N(sf, target):
    """Largest N whose share of seeking players at or above N is >= target, from a list sf[N]."""
    n = 0
    for k in range(1, len(sf)):
        if sf[k] >= target:
            n = k
        else:
            break
    return n


class Pick:
    def __init__(self, aims, target, mode):
        self.aims = aims                # [(Hurdle, N), ...]
        self.target = target
        self.mode = mode
        self.est = None                 # the clear rate the calibration saw
        self.tries = 0
        self.fell_back = False
        self.witness = None             # the lines of a round that reached it (the proof)

    @property
    def families(self):
        return [h.family for h, _ in self.aims]

    def text(self):
        return ' and '.join(h.condition(n) for h, n in self.aims)

    def __repr__(self):
        return 'Pick(%s)' % ', '.join('%s>=%d' % (h.name, n) for h, n in self.aims)


def candidates(round_number, carried, rules, tier, history, pair_with=None):
    """Hurdles the table calls GOOD for this round that the carried reactions and held self-reactions can feed, in tier, and
    not of the family just used."""
    last = history[-1] if history else ()
    out = []
    for name, row in table().items():
        h = H.HURDLES.get(name)
        if h is None or round_number not in row.get('good_rounds', []):
            continue
        if FAMILY_TIER.get(h.family, 3) > tier or not h.applicable(carried, rules):
            continue
        if h.family in last:
            continue
        if pair_with is not None and not compatible(h, pair_with):
            continue
        out.append(h)
    return out


def _order(cands, history, rng):
    """Random order, families used lately later."""
    recent = Counter(f for fam in history[-4:] for f in fam)
    return sorted(cands, key=lambda h: rng.random() * (1 + 2 * recent[h.family]))


def pick_hurdle(molecule, round_number, carried, rng, tier=3, history=(), rules=None, mode='sim', k=14, kp=6, engine=None,
                target=None, pair=None):
    """A hurdle (or, from round 6 on, two from different families) and its N for a dealt molecule.

    molecule: SMILES.  carried: the reactions carried (at most 8).  rules: the self-reactions held (default: the round's band).
    rng: random.Random.  tier 0..3: how many families are open.  history: the family lists of the earlier picks of this run
    (the family just used is not offered again, those used lately are less likely).
    mode 'sim': N is the quantile of k rounds played on this very molecule by a player who seeks the hurdle, so that a
    player who aims at it clears it at the round's target rate.  mode 'table': N from the study's table for the round (no
    play needed to find N; four rounds are still played to see that it can be reached).
    pair: True or False to force; default is a pair from round 6 on.
    Never offered: a hurdle that no round played out reached and the search could not reach; a hurdle the points player clears in
    every trial (it asks nothing).  pick.fell_back is True when no GOOD hurdle could be offered and a plain one was used."""
    rules = tuple(rules if rules is not None else H.RULES_BAND[round_number])
    carried = tuple(carried)
    eng = engine or E.Engine()
    smi = canon(molecule)
    target = target if target is not None else H.TARGETS[round_number]
    want_pair = (round_number >= 6) if pair is None else pair
    token = '%.9f' % rng.random()
    seeds = ['cal/%s/%d' % (token, i) for i in range(k)]
    pseeds = ['calp/%s/%d' % (token, i) for i in range(kp)]
    tries = 0

    def single_for(h, tgt):
        """(N, rate) for one hurdle at a target rate, or None."""
        if mode == 'table':
            row = table()[h.name]['sf'].get(str(round_number))
            n = sf_N(row, tgt) if row else 0
            vals = [v for v, _ in seek_values(eng, smi, carried, rules, h, seeds[:4])]
            if n < 1 or max(vals) < n:
                return None
            return n, sum(1 for v in vals if v >= n) / float(len(vals))
        vals = [v for v, _ in seek_values(eng, smi, carried, rules, h, seeds)]
        sf = [sum(1 for v in vals if v >= x) / float(len(vals)) for x in range(0, int(max(vals)) + 2)]
        n = sf_N(sf, tgt)
        if n < 1:
            return None
        return n, sf[n]

    def asks_something(h, n):
        pv = []
        for s in pseeds:
            rr = play_with(eng, smi, carried, rules, E.PLAYERS['greedy'], s)
            pv.append(h.check(smi, rr))
        return sum(1 for v in pv if v >= n) < len(pv)

    cands = _order(candidates(round_number, carried, rules, tier, history), history, rng)
    chosen = None
    for h in cands[:10]:
        tries += 1
        t1 = min(0.97, target ** 0.5 * 1.04) if want_pair else target
        r = single_for(h, t1)
        if r is None or not asks_something(h, r[0]):
            continue
        if not want_pair:
            chosen = ([(h, r[0])], r[1])
            break
        others = _order(candidates(round_number, carried, rules, tier, history, pair_with=h), history, rng)
        for h2 in others[:6]:
            tries += 1
            r2 = single_for(h2, t1)
            if r2 is None or not asks_something(h2, r2[0]):
                continue
            aims2 = [(h, r[0]), (h2, r2[0])]
            est2 = 0.0
            for _ in range(4):
                ok = []
                for s in seeds:
                    rr = play_with(eng, smi, carried, rules, H.AimPlayer(aims2), s)
                    lg = H.round_log(rr)
                    ok.append(all(hh.fn(lg) >= nn for hh, nn in aims2))
                est2 = sum(ok) / float(len(ok))
                if est2 > target + 0.15:
                    i = rng.randrange(2)
                    aims2[i] = (aims2[i][0], aims2[i][1] + 1)
                elif est2 < target - 0.15:
                    i = max(range(2), key=lambda j: aims2[j][1])
                    if aims2[i][1] <= 1:
                        i = 1 - i
                    if aims2[i][1] <= 1:
                        break
                    aims2[i] = (aims2[i][0], aims2[i][1] - 1)
                else:
                    break
            if est2 > 0:
                chosen = (aims2, est2)
                break
        if chosen:
            break
    if chosen is None:
        pk = None
        for name in ('busy', 'off_total', 'growth'):
            h = H.HURDLES[name]
            r = single_for(h, target)
            if r is not None:
                pk = Pick([(h, r[0])], target, mode)
                pk.est = r[1]
                break
        if pk is None:
            pk = Pick([(H.HURDLES['busy'], 1)], target, mode)
        pk.fell_back = True
    else:
        pk = Pick(chosen[0], target, mode)
        pk.est = chosen[1]
    pk.tries = tries
    # the proof that it can be reached: a round played out that reached it, else the search that ignores the deal
    wit = None
    for s in seeds[:6]:
        rr = play_with(eng, smi, carried, rules, H.AimPlayer(pk.aims), s)
        lg = H.round_log(rr)
        if all(hh.fn(lg) >= nn for hh, nn in pk.aims):
            wit = [t['line'] for t in rr['turns']]
            break
    if wit is None:
        wit = reach_search(eng, smi, carried, rules, pk.aims)
    pk.witness = wit
    return pk
