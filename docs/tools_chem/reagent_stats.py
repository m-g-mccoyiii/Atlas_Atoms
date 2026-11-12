"""How each reagent scores: the statistics behind REAGENT_STATS.md.

Run (from this folder):
    python reagent_stats.py instances             list the rounds that are played
    python reagent_stats.py main  OUT.pkl [N]     alone value, positions, sets-off, bands, swing (N rounds per round number, default 72)
    python reagent_stats.py pairs OUT.pkl [N]     every pair of reagents carried together (greedy player)
    python reagent_stats.py specs OUT.pkl [N]     the kept specs, with and without each reagent (a player aiming at the spec)
    python reagent_stats.py fit   OUT.pkl [N]     the share of dealt molecules each reagent acts on, by round
    python reagent_stats.py sens  OUT.pkl [N]     strength again with the reflexes the starting ones only, and with all of them
    python reagent_stats.py agg   DIR             read the pickles in DIR and write REAGENT_STATS.md and reagent_stats.json

Everything reads engine.py, library.py, molecules.py and hurdles.py; none of them is changed.

Plain definitions (the same words are used in REAGENT_STATS.md):
  a round     one molecule, three pages; yield is the sum of the three pages' pay (engine.play_round 'pay').
  carried     the six starters plus the reagent ("a seventh"), or, for a starter, the six without it.
  the rest    the six starters; for a starter, the other five.  "with" = the rest plus the reagent, "without" = the rest alone.
  ratio       (yield with + 50) / (yield without + 50), per round; 50 is the pay of one reflex step, so a round that pays nothing
              does not give a ratio of nothing over nothing.
"""
import itertools
import json
import math
import multiprocessing as mp
import os
import pickle
import random
import sys
import time
from collections import Counter, defaultdict

import engine as E
import hurdles as H
import library
import molecules
from chemlib import canon
from library import REACTIONS, SELF_RULES, SIX

HERE = os.path.dirname(os.path.abspath(__file__))
STARTERS = SIX
NONSTART = tuple(n for n in REACTIONS if n not in SIX)              # 14, including the paper variant suzuki_loose
VARIANT = 'suzuki_loose'
ALL20 = SIX + NONSTART
REAL19 = tuple(n for n in ALL20 if n != VARIANT)
PLAYERS = ('greedy', 'lookahead')
PAD = 50.0


def band_of(r):
    return 'early' if r <= 3 else 'mid' if r <= 6 else 'late'


def rules_for(r, mode='band'):
    if mode == 'band':
        return H.RULES_BAND[r]
    if mode == 'start':
        return library.SELF_TIER1
    if mode == 'all':
        return library.SELF_ALL
    raise ValueError(mode)


# ---------------------------------------------------------------------------------------------------------------
# the rounds: for each round number 1..9, half the game's molecules as the game deals them, half generated ones
# ---------------------------------------------------------------------------------------------------------------

def instances(per_round=72, tag='rs'):
    out = []
    for r in range(1, 10):
        for j in range(per_round):
            seed = '%s/%d/%d' % (tag, r, j)
            rng = random.Random(seed)
            if j % 2 == 0:
                smi = molecules.deal_molecule(r, rng, 3)
                src = 'game'
            else:
                smi = None
                for _ in range(20):
                    size = int(round(molecules.ROUND_SIZES[r - 1])) + rng.randint(-2, 2)
                    got = molecules.generate(max(6, size), rng, 1, family='any')
                    if got:
                        smi = got[0].canonical
                        break
                if smi is None:
                    smi = molecules.deal_molecule(r, rng, 3)
                    src = 'game'
                else:
                    src = 'made'
            out.append((r, j, smi, seed, src))
    return out


def carried_sets():
    """name -> (carried tuple, the reagent it tests).
      rest6        the six starters.             plus:X   the six and X (X not a starter).      no:X    the six without X (X a starter).
      plus:null    the six and a dud (the control for plus:X, same size).   swap:X  the six with X replaced by a dud (control for rest6)."""
    sets = {'rest6': (SIX, None), 'plus:null': (SIX + ('null1',), None)}
    for x in STARTERS:
        rest = tuple(n for n in SIX if n != x)
        sets['no:' + x] = (rest, x)
        sets['swap:' + x] = (rest + ('null1',), x)
    for x in NONSTART:
        sets['plus:' + x] = (SIX + (x,), x)
    return sets


def track_for(sname):
    if sname == 'rest6':
        return STARTERS
    if sname.startswith('plus:') and sname != 'plus:null':
        return (sname[5:],)
    return ()


def pair_defs():
    """(a, b) -> (base, only a, only b, both): every set has the same number of carried reagents (duds fill the gaps)."""
    defs = {}
    for a, b in itertools.combinations(REAL19, 2):
        rest = [n for n in SIX if n not in (a, b)]
        key = lambda t: tuple(sorted(t, key=lambda n: (ALL20 + NULLS).index(n)))
        defs[(a, b)] = (key(rest + ['null1', 'null2']), key(rest + [a, 'null1']), key(rest + [b, 'null1']), key(rest + [a, b]))
    return defs


# ---------------------------------------------------------------------------------------------------------------
# a player that looks at the page the way the statistics need, and then plays as the wrapped player does
# ---------------------------------------------------------------------------------------------------------------

class Rec:
    """Wraps a player; for each tracked reagent dealt in a page, records what the page looked like and what was done."""

    def __init__(self, inner, track):
        self.inner = inner
        self.track = tuple(track)
        self.rows = []

    def choose(self, ctx):
        lines = ctx.evaluate()
        line = self.inner.choose(ctx)
        eng = ctx.engine
        if not lines:
            return line
        bestall = max(p for _, _, p in lines)
        paychosen = None
        for l, t, p in lines:
            if l == tuple(line):
                paychosen = p
                break
        for x in self.track:
            if x not in ctx.hand:
                continue
            wo = [p for l, _, p in lines if x not in l]
            bestwo = max(wo) if wo else 0.0
            bp = [0.0, 0.0, 0.0]
            for l, _, p in lines:
                for i, r in enumerate(l[:3]):
                    if r == x and p > bp[i]:
                        bp[i] = p
            inbest = any(p == bestall and x in l for l, _, p in lines)
            fit_now = eng.fire(ctx.smi, x).acted
            row = {'turn': ctx.turn, 'fit': fit_now, 'inbest': inbest, 'needed': bestwo < bestall, 'bestall': bestall,
                   'bestwo': bestwo, 'bp': bp, 'fired': [], 'x': x, 'pay': paychosen}
            sim = eng.run_line(ctx.smi, tuple(line), ctx.rules)
            off_at = 0
            for i, r in enumerate(line):
                n_here = sim.set_off[i]
                if r == x:
                    prev = eng.run_line(ctx.smi, tuple(line[:i]), ctx.rules)
                    f = eng.fire(prev.smi, x)
                    row['fired'].append({'pos': i + 1, 'acted': f.acted, 'places': sim.fired[i][1], 'set_off': n_here,
                                         'reflexes': sim.steps[off_at:off_at + n_here], 'off': dict(f.off)})
                off_at += n_here
            self.rows.append(row)
        return line


_ENG = None


NULLS = ('null1', 'null2')


def _engine():
    """The engine plus two reagents that never act (control: a dud takes a place in the carried set and in the deal, so a
    reagent can be compared with a dud of the same carried-set size instead of with a smaller set)."""
    global _ENG
    if _ENG is None:
        from chemlib import Reaction, SmartsStep
        _ENG = E.Engine()
        for n in NULLS:
            _ENG.reactions[n] = Reaction(n, n, [SmartsStep('[#118:1]>>[#118:1]')])
    return _ENG


def play(smi, carried, rules, pname, seed, track):
    eng = _engine()
    inner = E.PLAYERS[pname]
    rec = Rec(inner, track)
    rr = eng.play_round(smi, carried, rules, rec, seed, analyse=False)
    return {'pay': rr['pay'], 'steps': rr['steps'], 'rows': rec.rows, 'off': dict(rr['off']),
            'longest': rr['longest']}


# ---------------------------------------------------------------------------------------------------------------
# workers
# ---------------------------------------------------------------------------------------------------------------

def work_main(task):
    (r, j, smi, seed, src), mode, pnames = task
    out = {}
    rules = rules_for(r, mode)
    for sname, (car, x) in carried_sets().items():
        track = track_for(sname)
        for pn in pnames:
            out[(sname, pn)] = play(smi, car, rules, pn, seed, track)
    if len(_engine()._fire) > 100000 or len(_engine()._line) > 150000:
        _engine().clear()
    return {'r': r, 'j': j, 'smi': smi, 'src': src, 'mode': mode, 'res': out}


def work_pairs(task):
    (r, j, smi, seed, src), = task
    rules = rules_for(r, 'band')
    need = set()
    for d in pair_defs().values():
        need.update(d)
    out = {}
    for car in need:
        out[car] = play(smi, car, rules, 'greedy', seed, ())['pay']
    if len(_engine()._fire) > 100000 or len(_engine()._line) > 150000:
        _engine().clear()
    return {'r': r, 'j': j, 'res': out}


def n60(row, r):
    sf = row['sf'].get(str(r))
    if not sf:
        return None
    n = 0
    for k, v in enumerate(sf):
        if v >= 0.6:
            n = k
    return max(1, n)


def kept_cells():
    """round -> [(spec name, N)] for the kept specs of hurdle_table.json in the rounds they are offered, N the table's reference N."""
    tb = json.load(open(os.path.join(HERE, 'hurdle_table.json')))['specs']
    cells = defaultdict(list)
    for name, row in tb.items():
        if name not in H.SPECS or not row.get('kept'):
            continue
        for r in row['good_rounds']:
            c = row['rounds'].get(str(r))
            if c and c.get('ref'):
                cells[r].append((name, int(c['ref'])))
    return cells


def work_specs(task, only=None):
    (r, j, smi, seed, src), = task
    cells = kept_cells()[r]
    rules = rules_for(r, 'band')
    out = {}
    eng = _engine()
    sets = carried_sets()
    for sname, (car, x) in sets.items():
        if only and sname not in only:
            continue
        for name, n in cells:
            sp = H.SPECS[name]
            pl = H.SeekPlayer(sp)
            rr = eng.play_round(smi, car, rules, pl, seed, analyse=False)
            v = sp.value(H.round_log(rr))
            out[(sname, name)] = (v, n, rr['pay'], sp.applicable(car, rules))
    if len(eng._fire) > 150000:
        eng.clear()
    return {'r': r, 'j': j, 'res': out}


def work_specs_null(task):
    return work_specs(task, only=['plus:null'] + ['swap:' + x for x in STARTERS])


def work_fit(task):
    (r, j, smi, seed, src), = task
    eng = _engine()
    smi2, _ = eng.reopen(canon(smi))
    out = {x: eng.fire(smi2, x).acted for x in ALL20}
    return {'r': r, 'j': j, 'src': src, 'res': out}


def work_reach(task):
    """Can the reagent act at all in a line of three made from the six starters and itself?  (round start, rules of the round)"""
    (r, j, smi, seed, src), = task
    eng = _engine()
    rules = rules_for(r, 'band')
    smi2, _ = eng.reopen(canon(smi))
    out = {}
    for x in ALL20:
        car = SIX if x in SIX else SIX + (x,)
        acts = False
        first = False
        for line in itertools.product(car, repeat=3):
            if x not in line:
                continue
            t = eng.run_line(smi2, line, rules)
            if any(nm == x and pl > 0 for nm, pl in t.fired):
                acts = True
                break
        out[x] = acts
    if len(eng._fire) > 150000:
        eng.clear()
    return {'r': r, 'j': j, 'src': src, 'res': out}


def _pool():
    return mp.Pool(min(15, os.cpu_count() or 4))


def run_phase(fn, tasks, out_path, label):
    t0 = time.time()
    res = []
    with _pool() as pool:
        for i, x in enumerate(pool.imap_unordered(fn, tasks, chunksize=1)):
            res.append(x)
            if (i + 1) % 50 == 0:
                print('%s %d/%d %.0fs' % (label, i + 1, len(tasks), time.time() - t0), flush=True)
    dt = time.time() - t0
    pickle.dump({'res': res, 'seconds': dt}, open(out_path, 'wb'))
    print('%s done: %d tasks, %.0f s' % (label, len(tasks), dt), flush=True)


def run_stream(fn, tasks, out_path, label):
    """Like run_phase but each result is appended to the file as soon as it is done, so a partial run can be read."""
    t0 = time.time()
    n = 0
    with open(out_path, 'wb') as fh, _pool() as pool:
        for x in pool.imap_unordered(fn, tasks, chunksize=1):
            pickle.dump(x, fh)
            fh.flush()
            n += 1
            if n % 20 == 0:
                print('%s %d/%d %.0fs' % (label, n, len(tasks), time.time() - t0), flush=True)
    print('%s done: %d tasks, %.0f s' % (label, n, time.time() - t0), flush=True)


def read_stream(path):
    out = []
    with open(path, 'rb') as fh:
        while True:
            try:
                out.append(pickle.load(fh))
            except EOFError:
                break
            except Exception:
                break           # a half-written last record
    if len(out) == 1 and isinstance(out[0], dict) and 'res' in out[0] and 'seconds' in out[0]:
        return out[0]
    return {'res': out, 'seconds': float('nan')}


# ---------------------------------------------------------------------------------------------------------------
# aggregation: reads what the phases wrote and makes the tables (appended; used by `python reagent_stats.py agg DIR`)
# ---------------------------------------------------------------------------------------------------------------
import numpy as np
from library import SELF_RULES
BANDS = ('early', 'mid', 'late')
PL = PLAYERS
rng = np.random.default_rng(7)


def load(p):
    return pickle.load(open(p, 'rb'))


def sets_of(x):
    """(with, literal without, size-matched without).  Literal: the six alone / the six minus the starter.  Matched: the
    same carried-set size with a dud in place of the reagent."""
    return ('rest6', 'no:' + x, 'swap:' + x) if x in SIX else ('plus:' + x, 'rest6', 'plus:null')


def pct(a, q):
    return float(np.percentile(a, q)) if len(a) else float('nan')


def mean(a):
    a = list(a)
    return float(sum(a) / len(a)) if a else float('nan')


# ---------------------------------------------------------------------------------------------------------------
def per_reagent_main(main):
    res = main['res']
    n = len(res)
    out = {}
    for x in ALL20:
        w, olit, o = sets_of(x)
        idx = {p: [k for k, i in enumerate(res) if (w, p) in i['res'] and (o, p) in i['res'] and (olit, p) in i['res']] for p in PL}
        rnd = {p: np.array([res[k]['r'] for k in idx[p]]) for p in PL}
        band = {p: np.array([band_of(r) for r in rnd[p]]) for p in PL}
        src = {p: np.array([res[k]['src'] for k in idx[p]]) for p in PL}
        pw = {p: np.array([res[k]['res'][(w, p)]['pay'] for k in idx[p]]) for p in PL}
        po = {p: np.array([res[k]['res'][(o, p)]['pay'] for k in idx[p]]) for p in PL}
        pl_ = {p: np.array([res[k]['res'][(olit, p)]['pay'] for k in idx[p]]) for p in PL}
        d = {'with_set': w, 'without_set': o, 'literal_set': olit, 'n_rounds': {p: len(idx[p]) for p in PL}}

        def rat(sel, pls=PL):
            sw = np.concatenate([pw[p][sel(p)] for p in pls]); so = np.concatenate([po[p][sel(p)] for p in pls])
            a = (sw + PAD) / (so + PAD)
            lr = np.log(a)
            return {'n': int(len(a)), 'mean': float(a.mean()), 'median': float(np.median(a)), 'p10': pct(a, 10), 'p90': pct(a, 90),
                    'ratio_of_means': float(sw.mean() / so.mean()) if so.mean() > 0 else float('nan'),
                    'yield_with': float(sw.mean()), 'yield_without': float(so.mean()),
                    'same_share': float((sw == so).mean()), 'better_share': float((sw > so).mean()), 'worse_share': float((sw < so).mean()),
                    'big_share': float((a >= 1.5).mean()), 'sd_log': float(lr.std()),
                    'gain_mean': float((sw - so).mean()), 'gain_p10': pct(sw - so, 10), 'gain_p90': pct(sw - so, 90),
                    'gain_sd': float((sw - so).std())}
        allsel = lambda p: np.ones(len(idx[p]), bool)
        d['ratio'] = {'all': rat(allsel)}
        for p in PL:
            d['ratio'][p] = rat(allsel, (p,))
        for bb in BANDS:
            d['ratio'][bb] = rat(lambda p, bb=bb: band[p] == bb)
        for r in range(1, 10):
            d['ratio']['r%d' % r] = rat(lambda p, r=r: rnd[p] == r)
        for s_ in ('game', 'made'):
            d['ratio'][s_] = rat(lambda p, s_=s_: src[p] == s_)
        cells = []
        for p in PL:
            for bb in BANDS:
                m = band[p] == bb
                so = po[p][m].mean()
                cells.append(pw[p][m].mean() / so if so > 0 else 1.0)
        d['strength_raw'] = float(np.mean(cells))
        lc = []
        for p in PL:
            for bb in BANDS:
                m = band[p] == bb
                so = pl_[p][m].mean()
                lc.append(pw[p][m].mean() / so if so > 0 else 1.0)
        d['literal_raw'] = float(np.mean(lc))
        d['literal_ratio_all'] = {'mean': float(np.mean(np.concatenate([(pw[p] + PAD) / (pl_[p] + PAD) for p in PL]))),
                                  'median': float(np.median(np.concatenate([(pw[p] + PAD) / (pl_[p] + PAD) for p in PL])))}
        bs = []
        for _ in range(300):
            cl = []
            for p in PL:
                for bb in BANDS:
                    ii = np.where(band[p] == bb)[0]
                    ii = rng.choice(ii, len(ii))
                    so = po[p][ii].mean()
                    cl.append(pw[p][ii].mean() / so if so > 0 else 1.0)
            bs.append(np.mean(cl))
        d['strength_raw_ci'] = [pct(bs, 5), pct(bs, 95)]
        meds = []
        for p in PL:
            for bb in BANDS:
                m = band[p] == bb
                meds.append(float(np.median((pw[p][m] + PAD) / (po[p][m] + PAD))))
        d['typical_raw'] = float(np.mean(meds))
        # greedy only (the cells with the same instances for every player)
        rows = []
        plays = Counter()
        for p in PL:
            for k in idx[p]:
                plays[(p, band_of(res[k]['r']))] += 1
                for row in res[k]['res'][(w, p)]['rows']:
                    if row['x'] == x:
                        rows.append((res[k]['r'], p, row))
        d['rows_n'] = len(rows)
        d.update(row_stats(rows, plays))
        out[x] = d
    return out


def row_stats(rows, plays):
    """rows: [(round, player, row)].  plays: Counter {(player, band): rounds played}.  Pages = 3 per round."""
    pages_all = 3 * sum(plays.values())
    def block(rs, pages):
        rs = [r for _, _, r in rs]
        k = len(rs)
        if k == 0:
            return {'dealt': 0}
        fir = [f for r in rs for f in r['fired']]
        acted = [f for f in fir if f['acted']]
        gaps = [(r['bestall'] - r['bestwo']) / r['bestall'] for r in rs if r['bestall'] > 0]
        b = {'dealt': k, 'dealt_rate': k / pages if pages else float('nan'),
             'fired_when_dealt': sum(1 for r in rs if r['fired']) / k,
             'fit_when_dealt': sum(1 for r in rs if r['fit']) / k,
             'in_a_best_line': sum(1 for r in rs if r['inbest']) / k,
             'best_worse_without': sum(1 for r in rs if r['needed']) / k,
             'gap_rel': mean(gaps), 'gap_abs': mean([r['bestall'] - r['bestwo'] for r in rs]),
             'firings': len(fir), 'acted_share': len(acted) / len(fir) if fir else float('nan'),
             'places_mean': mean([f['places'] for f in acted]),
             'setoff_mean': mean([f['set_off'] for f in fir]),
             'setoff_mean_acted': mean([f['set_off'] for f in acted]),
             'setoff_share': mean([1.0 if f['set_off'] > 0 else 0.0 for f in fir]),
             'setoff_ge3_share': mean([1.0 if f['set_off'] >= 3 else 0.0 for f in fir])}
        return b
    out = {'overall': block(rows, pages_all)}
    for bnd in BANDS:
        rs = [t for t in rows if band_of(t[0]) == bnd]
        out['band_' + bnd] = block(rs, 3 * sum(v for (p_, b_), v in plays.items() if b_ == bnd))
    for p in PL:
        rs = [t for t in rows if t[1] == p]
        out['player_' + p] = block(rs, 3 * sum(v for (p_, b_), v in plays.items() if p_ == p))
    # sets off
    fir = [f for _, _, r in rows for f in r['fired']]
    refl = Counter()
    off_direct = Counter()
    off_refl = Counter()
    for f in fir:
        refl.update(f['reflexes'])
        for k, v in f['off'].items():
            off_direct[k] += v
        for nm in f['reflexes']:
            for k, v in SELF_RULES[nm].off.items():
                off_refl[k] += v
    nf = max(1, len(fir))
    out['reflexes_per_firing'] = {k: v / nf for k, v in refl.most_common()}
    out['reflex_total_per_firing'] = sum(refl.values()) / nf
    out['runoff_direct_per_firing'] = {k: v / nf for k, v in off_direct.items()}
    out['runoff_reflex_per_firing'] = {k: v / nf for k, v in off_refl.items()}
    # position
    pos = {}
    for p in (1, 2, 3):
        fs = [f for _, _, r in rows for f in r['fired'] if f['pos'] == p]
        pays = [r['pay'] for _, _, r in rows for f in r['fired'] if f['pos'] == p and r['pay'] is not None]
        cf = [max(r['bp'][p - 1] - r['bestwo'], 0.0) for _, _, r in rows]
        top = 0
        for _, _, r in rows:
            m = max(r['bp'])
            if m > 0 and r['bp'][p - 1] == m:
                top += 1
        pos[p] = {'firings': len(fs), 'share_of_firings': len(fs) / nf if fir else float('nan'),
                  'acted_share': mean([1.0 if f['acted'] else 0.0 for f in fs]),
                  'setoff_mean': mean([f['set_off'] for f in fs]), 'page_pay_mean': mean(pays),
                  'best_gain_if_here': mean(cf), 'best_slot_share': top / max(1, len(rows))}
    out['position'] = pos
    return out


# ---------------------------------------------------------------------------------------------------------------
def fit_stats(fit):
    res = fit['res']
    out = {}
    for x in ALL20:
        d = {}
        for r in range(1, 10):
            v = [i['res'][x] for i in res if i['r'] == r]
            d['r%d' % r] = sum(v) / len(v)
        d['all'] = mean(d['r%d' % r] for r in range(1, 10))
        for s in ('game', 'made'):
            v = [i['res'][x] for i in res if i['src'] == s]
            d[s] = sum(v) / len(v)
        out[x] = d
    return out


# ---------------------------------------------------------------------------------------------------------------
def pair_stats(pairs):
    res = pairs['res']
    n = len(res)
    out = {}
    cache = {}
    def Y(car):
        car = tuple(car)
        if car not in cache:
            cache[car] = np.array([i['res'][car] for i in res])
        return cache[car]
    for (a, b), (c0, ca, cb, cab) in pair_defs().items():
        y0, ya, yb, yab = Y(c0), Y(ca), Y(cb), Y(cab)
        def calc(ix):
            m0, ma, mb, mab = y0[ix].mean(), ya[ix].mean(), yb[ix].mean(), yab[ix].mean()
            ra, rb, rab = ma / m0, mb / m0, mab / m0
            den = ra + rb - 1.0
            return ra, rb, rab, (rab / den if den > 0.3 else float('nan')), rab - ra - rb + 1.0, (mab - m0) - ((ma - m0) + (mb - m0))
        allix = np.arange(n)
        ra, rb, rab, syn, bonus, extra = calc(allix)
        bs = []
        bb = []
        for _ in range(200):
            ix = rng.integers(0, n, n)
            c_ = calc(ix)
            bs.append(c_[3]); bb.append(c_[4])
        bs = [v for v in bs if not math.isnan(v)]
        out['%s|%s' % (a, b)] = {'a': a, 'b': b, 'base_yield': float(y0.mean()), 'ratio_a': ra, 'ratio_b': rb, 'ratio_both': rab,
                                 'synergy': syn, 'synergy_ci': [pct(bs, 5), pct(bs, 95)] if bs else [float('nan')] * 2,
                                 'extra_yield': extra, 'bonus': bonus, 'bonus_ci': [pct(bb, 5), pct(bb, 95)],
                                 'beats_best_single': rab / max(ra, rb)}
    return out


# ---------------------------------------------------------------------------------------------------------------
def spec_stats(specs, nulls=None):
    res = specs['res']
    if nulls:
        nm = {(i['r'], i['j']): i['res'] for i in nulls['res']}
        for i in res:
            i['res'].update(nm.get((i['r'], i['j']), {}))
        res = [i for i in res if 'plus:null' in {k[0] for k in i['res']}]
    cells = defaultdict(list)       # (spec, round) -> instances
    for i in res:
        names = {k[1] for k in i['res'] if k[0] == 'rest6'} & {k[1] for k in i['res'] if k[0] == 'plus:null'}
        for nm in names:
            cells[(nm, i['r'])].append(i)
    out = {}
    base_rate = {}
    for key, ins in cells.items():
        base_rate[key] = mean(1.0 if i['res'][('rest6', key[0])][0] >= i['res'][('rest6', key[0])][1] else 0.0 for i in ins)
    for x in ALL20:
        w, olit, o = sets_of(x)
        easier = harder = same = 0
        opens = closes = 0
        helped = []
        hurt = []
        per_spec = defaultdict(lambda: [0, 0, 0])
        vals = []
        for (nm, r), ins in cells.items():
            b = c = 0
            for i in ins:
                vw, nw, _, aw = i['res'][(w, nm)]
                vo, no, _, ao = i['res'][(o, nm)]
                cw, co = vw >= nw, vo >= no
                if cw and not co:
                    b += 1
                if co and not cw:
                    c += 1
            rate_w = mean(1.0 if i['res'][(w, nm)][0] >= i['res'][(w, nm)][1] else 0.0 for i in ins)
            rate_o = mean(1.0 if i['res'][(o, nm)][0] >= i['res'][(o, nm)][1] else 0.0 for i in ins)
            ap_w, ap_o = ins[0]['res'][(w, nm)][3], ins[0]['res'][(o, nm)][3]
            if ap_w and not ap_o:
                opens += 1
            if ap_o and not ap_w:
                closes += 1
            d_ = np.array([(i['res'][(w, nm)][0] - i['res'][(o, nm)][0]) / float(i['res'][(w, nm)][1]) for i in ins])
            se = d_.std(ddof=1) / math.sqrt(len(d_)) if len(d_) > 2 else float('inf')
            z = d_.mean() / se if se > 0 else (0.0 if d_.mean() == 0 else math.copysign(9.9, d_.mean()))
            if d_.mean() >= 0.10 and z >= 2.0:
                easier += 1; per_spec[nm][0] += 1; helped.append((nm, r, round(rate_o, 2), round(rate_w, 2)))
            elif d_.mean() <= -0.10 and z <= -2.0:
                harder += 1; per_spec[nm][1] += 1; hurt.append((nm, r, round(rate_o, 2), round(rate_w, 2)))
            else:
                same += 1; per_spec[nm][2] += 1
            vals.append(float(d_.mean()))
        tot = easier + harder + same
        specs_easier = sorted(nm for nm, v in per_spec.items() if v[0] > 0 and v[0] >= v[1])
        out[x] = {'mean_value_change_over_N': float(np.mean(vals)), 'cells': tot, 'easier': easier / tot, 'harder': harder / tot, 'unchanged': same / tot,
                  'specs_made_easier_somewhere': len([nm for nm, v in per_spec.items() if v[0] > 0]),
                  'specs_total': len(per_spec), 'opens_spec': opens, 'closes_spec': closes,
                  'most_helped': sorted(per_spec.items(), key=lambda kv: -kv[1][0])[:5] and
                  [(nm, v[0]) for nm, v in sorted(per_spec.items(), key=lambda kv: -kv[1][0])[:5] if v[0] > 0],
                  'most_hurt': [(nm, v[1]) for nm, v in sorted(per_spec.items(), key=lambda kv: -kv[1][1])[:3] if v[1] > 0]}
    return out, {'cells': len(cells), 'specs': len({k[0] for k in cells}), 'mean_base_rate': mean(base_rate.values())}


# ---------------------------------------------------------------------------------------------------------------
def sens_stats(sens):
    res = sens['res']
    out = {}
    for mode in ('start', 'all'):
        ins = [i for i in res if i['mode'] == mode]
        rnd = np.array([i['r'] for i in ins]); band = np.array([band_of(r) for r in rnd])
        raw = {}
        for x in ALL20:
            w, olit, o = sets_of(x)
            pw = np.array([i['res'][(w, 'greedy')]['pay'] for i in ins]); po = np.array([i['res'][(o, 'greedy')]['pay'] for i in ins])
            cells = []
            for b in BANDS:
                m = band == b
                cells.append(pw[m].mean() / po[m].mean() if po[m].mean() > 0 else 1.0)
            raw[x] = float(np.mean(cells))
        sc = np.mean([raw[x] for x in STARTERS])
        out[mode] = {x: raw[x] / sc for x in ALL20}
        out[mode + '_n'] = len(ins)
    return out


# ---------------------------------------------------------------------------------------------------------------
# the report: REAGENT_STATS.md and reagent_stats.json
# ---------------------------------------------------------------------------------------------------------------

def _f2(x, d=2):
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return '-'
    return ('%.' + str(d) + 'f') % x


def _pc(x, d=0):
    if x is None or (isinstance(x, float) and math.isnan(x)):
        return '-'
    return ('%.' + str(d) + 'f%%') % (100 * x)


def _tbl(head, rows):
    out = ['| ' + ' | '.join(head) + ' |', '|' + '|'.join('---' for _ in head) + '|']
    for r in rows:
        out.append('| ' + ' | '.join(str(c) for c in r) + ' |')
    return '\n'.join(out)


def _jsonable(o):
    if isinstance(o, dict):
        return {str(k): _jsonable(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [_jsonable(v) for v in o]
    if isinstance(o, (np.floating, float)):
        return None if math.isnan(float(o)) else float(o)
    if isinstance(o, (np.integer,)):
        return int(o)
    return o


def collect(OUT):
    """Read the pickles and streams of a run and compute every table."""
    main = read_stream(OUT + '/main.stream')
    fit = load(OUT + '/fit.pkl')
    reach = load(OUT + '/reach.pkl')
    pairs = read_stream(OUT + '/pairs.stream')
    specs = load(OUT + '/specs.pkl')
    specs_null = read_stream(OUT + '/specs_null.stream')
    sens = read_stream(OUT + '/sens.stream')
    D = per_reagent_main(main)
    F = fit_stats(fit)
    RE = {x: sum(1 for i in reach['res'] if i['res'][x]) / len(reach['res']) for x in ALL20}
    REB = {x: {r: (lambda v: sum(v) / len(v))([1 if i['res'][x] else 0 for i in reach['res'] if i['r'] == r]) for r in range(1, 10)} for x in ALL20}
    P = pair_stats(pairs)
    n_spec_plays = sum(len(i['res']) for i in specs['res']) + sum(len(i['res']) for i in specs_null['res'])
    S, Smeta = spec_stats(specs, specs_null)
    SE = sens_stats(sens)
    sc = sum(D[x]['strength_raw'] for x in STARTERS) / 6.0
    for x in ALL20:
        D[x]['strength'] = D[x]['strength_raw'] / sc
        D[x]['strength_ci'] = [D[x]['strength_raw_ci'][0] / sc, D[x]['strength_raw_ci'][1] / sc]
        D[x]['live_share'] = 1 - D[x]['ratio']['all']['same_share']
    order = sorted(ALL20, key=lambda x: -D[x]['strength'])
    partners = {x: [] for x in ALL20}
    for k, p in P.items():
        partners[p['a']].append((p['b'], p))
        partners[p['b']].append((p['a'], p))
    best3 = {x: sorted(partners[x], key=lambda t: -t[1]['bonus'])[:3] for x in ALL20}
    worst = {x: sorted(partners[x], key=lambda t: t[1]['bonus'])[0] for x in ALL20}
    musts = sorted([(p['a'], p['b'], p) for p in P.values() if p['bonus_ci'][0] >= 0.10 and p['ratio_both'] >= 1.25], key=lambda t: -t[2]['bonus'])
    spoils = sorted([(p['a'], p['b'], p) for p in P.values() if p['beats_best_single'] <= 0.95 and p['bonus_ci'][1] < 0], key=lambda t: t[2]['beats_best_single'])
    redund = sorted([(p['a'], p['b'], p) for p in P.values() if p['bonus_ci'][1] <= -0.15], key=lambda t: t[2]['bonus'])
    flags = {x: [] for x in ALL20}
    for x in ALL20:
        d = D[x]
        gain = d['strength_raw'] - 1.0
        bp = best3[x][0][1]['bonus']
        if d['live_share'] < 0.10 and abs(gain) < 0.03 and bp < 0.10:
            flags[x].append('DEAD')
        elif abs(gain) < 0.035 and bp < 0.10:
            flags[x].append('NEAR-DEAD')
        if x in STARTERS and d['literal_raw'] - 1 < -0.05:
            flags[x].append('CROWDS (the deal is better without it)')
        mine = [b if a == x else a for a, b, p in musts if x in (a, b)]
        if mine:
            flags[x].append('pairs with ' + ', '.join(mine[:3]))
    if D[order[0]]['strength_ci'][0] > 1.5 * D[order[1]]['strength'] and D[order[0]]['strength_raw'] - 1 > 1.5 * (D[order[1]]['strength_raw'] - 1):
        flags[order[0]].insert(0, 'DOMINATES')
    return {'D': D, 'F': F, 'RE': RE, 'REB': REB, 'P': P, 'S': S, 'Smeta': Smeta, 'SE': SE, 'sc': sc, 'order': order,
            'best3': best3, 'worst': worst, 'musts': musts, 'spoils': spoils, 'redund': redund, 'flags': flags,
            'n_spec_plays': n_spec_plays, 'main': main, 'fit': fit, 'reach': reach, 'pairs': pairs, 'specs': specs, 'specs_null': specs_null, 'sens': sens}


def make_report(OUT, outdir, seconds=None, prose=None):
    C = collect(OUT)
    D, F, RE, REB, P, S, SE, order, flags, best3, worst = (C[k] for k in ('D', 'F', 'RE', 'REB', 'P', 'S', 'SE', 'order', 'flags', 'best3', 'worst'))
    rank = {x: i + 1 for i, x in enumerate(order)}
    f2, pc, tbl = _f2, _pc, _tbl
    sec = {}
    rows = []
    for x in order:
        d = D[x]
        b = best3[x][0]
        rows.append([rank[x], x, 'start' if x in STARTERS else 'unlock', f2(d['strength']), '%s to %s' % (f2(d['strength_ci'][0]), f2(d['strength_ci'][1])),
                     '%+.0f%%' % (100 * (d['strength_raw'] - 1)), '%+.0f%%' % (100 * (d['literal_raw'] - 1)), f2(d['ratio']['all']['median']),
                     pc(F[x]['all']), pc(RE[x]), f2(d['ratio']['all']['sd_log']), pc(d['live_share']),
                     '%s (%+.0f%%)' % (b[0], 100 * b[1]['bonus']), ', '.join(flags[x])])
    sec['master'] = tbl(['Rank', 'Reagent', 'Held', 'STRENGTH', '90% range', 'Yield change vs a dud', 'Yield change vs the six alone', 'Median round ratio',
                         'Fit at round start', 'Can act in some line', 'Swing', 'Rounds it changes', 'Best partner (bonus)', 'Flags'], rows)
    rows = []
    for x in order:
        d = D[x]; o = d['overall']; r = d['ratio']['all']
        rows.append([x, pc(o.get('dealt_rate')), pc(o.get('fired_when_dealt')), pc(o.get('in_a_best_line')), pc(o.get('best_worse_without')),
                     pc(o.get('gap_rel')), f2(r['mean']), f2(r['median']), f2(r['p10']), f2(r['p90']), f2(r['ratio_of_means']),
                     '%.0f / %.0f' % (r['yield_with'], r['yield_without'])])
    sec['alone'] = tbl(['Reagent', 'Dealt (per page)', 'Fired when dealt', 'In a best line (ties count)', 'Best line worse without it', 'How much worse', 'Ratio mean',
                        'median', 'p10', 'p90', 'Ratio of mean yields', 'Mean yield with / without a dud'], rows)
    rows = []
    for x in order:
        d = D[x]
        row = [x]
        for p in PL:
            r = d['ratio'][p]
            row += [f2(r['ratio_of_means']), f2(r['median'])]
        row += ['%.2f / %.2f' % (d['literal_ratio_all']['mean'], d['literal_ratio_all']['median'])]
        rows.append(row)
    sec['alone_player'] = tbl(['Reagent', 'Greedy: ratio of means', 'median', 'Look-ahead: ratio of means', 'median', 'Against the six alone: mean / median ratio'], rows)
    sec['fit'] = tbl(['Reagent'] + ['R%d' % r for r in range(1, 10)] + ['game molecules', 'made molecules'],
                     [[x] + [pc(F[x]['r%d' % r]) for r in range(1, 10)] + [pc(F[x]['game']), pc(F[x]['made'])] for x in order])
    sec['reach'] = tbl(['Reagent'] + ['R%d' % r for r in range(1, 10)] + ['all'], [[x] + [pc(REB[x][r]) for r in range(1, 10)] + [pc(RE[x])] for x in order])
    sec['fitpage'] = tbl(['Reagent', 'Something to act on when dealt (page start)', 'Acts when fired', 'Places it acts at (mean, when it acts)'],
                         [[x, pc(D[x]['overall'].get('fit_when_dealt')), pc(D[x]['overall'].get('acted_share')), f2(D[x]['overall'].get('places_mean'), 1)] for x in order])
    rows = []
    for x in order:
        d = D[x]; o = d['overall']
        rf = ', '.join('%s %.2f' % (k, v) for k, v in list(d['reflexes_per_firing'].items())[:4]) or '-'
        ro = ', '.join('%s %.2f' % (k, v) for k, v in d['runoff_direct_per_firing'].items()) or '-'
        rr = ', '.join('%s %.2f' % (k, v) for k, v in d['runoff_reflex_per_firing'].items()) or '-'
        rows.append([x, f2(o.get('setoff_mean')), f2(o.get('setoff_mean_acted')), pc(o.get('setoff_share')), pc(o.get('setoff_ge3_share')), rf, ro, rr])
    sec['setsoff'] = tbl(['Reagent', 'Reflex steps after it (per firing)', 'when it acts', 'Sets off any', 'Sets off 3+', 'Reflexes after it (per firing)',
                          'Runoff from the reagent itself (per firing)', 'Runoff from the reflexes it sets off (per firing)'], rows)
    rows = []
    for x in order:
        d = D[x]
        row = [x]
        for p in (1, 2, 3):
            q = d['position'][p]
            row += [pc(q['share_of_firings']), f2(q['setoff_mean']), f2(q['page_pay_mean'], 0), f2(q['best_gain_if_here'], 0)]
        rows.append(row)
    sec['position'] = tbl(['Reagent'] + sum([['%s: share of firings' % n, 'steps after it', 'page pay', 'best-line gain if put here'] for n in ('1st', '2nd', '3rd')], []), rows)
    rows = []
    for x in order:
        d = D[x]
        row = [x]
        for b in BANDS:
            r = d['ratio'][b]
            o = d['band_' + b]
            row += [f2(r['ratio_of_means']), f2(r['median']), pc(o.get('fired_when_dealt')), pc(o.get('best_worse_without'))]
        rows.append(row)
    sec['band'] = tbl(['Reagent'] + sum([['%s: ratio of means' % b, 'median', 'fired when dealt', 'best line worse without it'] for b in ('early 1-3', 'mid 4-6', 'late 7-9')], []), rows)
    sec['round'] = tbl(['Reagent'] + ['R%d' % r for r in range(1, 10)], [[x] + [f2(D[x]['ratio']['r%d' % r]['ratio_of_means']) for r in range(1, 10)] for x in order])
    rows = []
    for x in order:
        b3 = best3[x]; w = worst[x]
        rows.append([x] + ['%s (%+.0f%%, together %s)' % (n, 100 * p['bonus'], f2(p['ratio_both'])) for n, p in b3] + ['%s (%+.0f%%)' % (w[0], 100 * w[1]['bonus'])])
    sec['partners'] = tbl(['Reagent', 'Best partner', '2nd', '3rd', 'Worst partner'], rows)
    hdr = ['A', 'B', 'A alone', 'B alone', 'Together', 'Bonus over adding', '90% range', 'Together / (A + B - 1)']
    row_ = lambda a, b, p: [a, b, f2(p['ratio_a']), f2(p['ratio_b']), f2(p['ratio_both']), '%+.0f%%' % (100 * p['bonus']),
                            '%+.0f to %+.0f' % (100 * p['bonus_ci'][0], 100 * p['bonus_ci'][1]), f2(p['synergy'])]
    sec['must'] = tbl(hdr, [row_(a, b, p) for a, b, p in C['musts'][:15]])
    sec['spoil'] = tbl(['A', 'B', 'A alone', 'B alone', 'Together', 'Together / better single', 'Bonus over adding'],
                       [[a, b, f2(p['ratio_a']), f2(p['ratio_b']), f2(p['ratio_both']), f2(p['beats_best_single']), '%+.0f%%' % (100 * p['bonus'])] for a, b, p in C['spoils'][:15]]) if C['spoils'] else '(none)'
    sec['redund'] = tbl(hdr, [row_(a, b, p) for a, b, p in C['redund'][:12]]) if C['redund'] else '(none)'
    rows = []
    for x in order:
        r = D[x]['ratio']['all']
        rows.append([x, f2(r['sd_log']), pc(1 - r['same_share']), pc(r['better_share']), pc(r['worse_share']), pc(r['big_share']), '%+.0f' % r['gain_p10'],
                     '%+.0f' % r['gain_p90'], '%.0f' % r['gain_sd'], f2(r['p10']), f2(r['p90'])])
    sec['swing'] = tbl(['Reagent', 'Swing (spread of log ratio)', 'Rounds changed', 'Better', 'Worse', 'Ratio 1.5+', 'Yield change p10', 'p90', 'sd', 'Ratio p10', 'p90'], rows)
    rows = []
    for x in order:
        s = S[x]
        rows.append([x, pc(s['easier']), pc(s['harder']), pc(s['unchanged']), '%+.2f' % s['mean_value_change_over_N'],
                     '%d of %d' % (s['specs_made_easier_somewhere'], s['specs_total']),
                     ', '.join('%s %d' % (n, c) for n, c in s['most_helped'][:3]) or '-'])
    sec['specs'] = tbl(['Reagent', 'Spec cells it makes easier', 'Harder', 'No change', 'Mean change in the spec value, in units of N', 'Distinct specs eased somewhere',
                        'Most helped (rounds, of 9)'], rows)
    sec['sens'] = tbl(['Reagent', 'STRENGTH, reflexes by round (as the game)', 'Starting reflexes only (ring, dry)', 'All reflexes'],
                      [[x, f2(D[x]['strength']), f2(SE['start'][x]), f2(SE['all'][x])] for x in order])

    # --- counts
    main, pairs, specs, specs_null, sens, fit, reach = (C[k] for k in ('main', 'pairs', 'specs', 'specs_null', 'sens', 'fit', 'reach'))
    nrounds = {'main': sum(len(i['res']) for i in main['res']), 'pairs': sum(len(i['res']) for i in pairs['res']),
               'specs': C['n_spec_plays'],
               'sens': sum(len(i['res']) for i in sens['res'])}
    nrounds['total'] = sum(nrounds.values())
    per_reagent = {x: D[x]['n_rounds'] for x in ALL20}
    meta = {'rounds_played': nrounds, 'molecule_rounds': {'main': len(main['res']), 'pairs': len(pairs['res']), 'specs': len(specs['res']), 'sens': len(sens['res']) // 2,
                                                          'fit_molecules': len(fit['res']), 'reach_molecules': len(reach['res'])},
            'rounds_per_reagent_with_it': per_reagent['oxidize'], 'seconds': seconds or {},
            'scale': {'mean_starter_raw_ratio': C['sc'], 'meaning': 'STRENGTH = (mean over 2 players x 3 bands of mean yield with / mean yield with a dud in its place) divided by the same number averaged over the six starters'},
            'spec_cells': C['Smeta']}
    result = {'meta': meta, 'ranking': order, 'flags': flags,
              'reagents': {x: {'rank': rank[x], 'held': 'start' if x in STARTERS else 'unlock', 'strength': D[x]['strength'], 'strength_ci90': D[x]['strength_ci'],
                               'yield_change_vs_dud': D[x]['strength_raw'] - 1, 'yield_change_vs_six_alone': D[x]['literal_raw'] - 1,
                               'fit_round_start': F[x], 'can_act_in_some_line': RE[x], 'can_act_in_some_line_by_round': REB[x],
                               'alone': {k: v for k, v in D[x].items() if k not in ('strength', 'strength_ci')},
                               'partners_best3': [(n, p) for n, p in best3[x]], 'partner_worst': worst[x],
                               'spec_effect': S[x], 'strength_other_reflex_sets': {'start': SE['start'][x], 'all': SE['all'][x]}} for x in ALL20},
              'pairs': P, 'must_have_pairs': [(a, b) for a, b, _ in C['musts']], 'spoiling_pairs': [(a, b) for a, b, _ in C['spoils']],
              'redundant_pairs': [(a, b) for a, b, _ in C['redund']]}
    os.makedirs(outdir, exist_ok=True)
    json.dump(_jsonable(result), open(os.path.join(outdir, 'reagent_stats.json'), 'w'), indent=1)
    md = prose
    for k, v in sec.items():
        md = md.replace('<<%s>>' % k, v)
    for k, v in (('nr_main', nrounds['main']), ('nr_pairs', nrounds['pairs']), ('nr_specs', nrounds['specs']), ('nr_sens', nrounds['sens']), ('nr_total', nrounds['total'])):
        md = md.replace('<<%s>>' % k, '{:,}'.format(v))
    open(os.path.join(outdir, 'REAGENT_STATS.md'), 'w', encoding='utf8').write(md)
    return result, meta

PROSE = r'''# Overreact: how each reagent scores

Measured on 11 November 2026 with the engine in `docs/tools_chem` (RDKit, real molecules). The reagent set is `library.py` as it stood that evening: its header calls it the final set, but `FINAL.md` did not exist yet. Six reagents held from the start (hydrate, hydroborate, dehydrate, oxidize, reduce, grow) and twelve unlocks (hwe, dihydroxylation, ozonolysis, permanganate, ritter, thiolene, chlorination, cyanohydrin, hofmann, chugaev, hydroformylation, epoxidation). Run it again with `python reagent_stats.py` (the commands are at the bottom). Nothing in the game or in the existing engine files was changed.

## What was played

- **<<nr_total>> rounds** in all, on two kinds of molecule: half the game's own table as the game deals them, half made-up ones within two atoms of the round's size. Rounds 1 to 9 equally.
- **Alone value, positions, sets-off, rounds, swing:** 648 molecules (72 for each round number), each played with 26 different carried sets by the greedy player, and the first 30 of each round number (270) also by the look-ahead player. That is 648 greedy and 270 look-ahead rounds with each reagent carried, and the same number without it. (<<nr_main>> rounds.)
- **Pairs:** 243 molecules (27 per round number), 192 carried sets, greedy player (<<nr_pairs>> rounds).
- **Specs:** the kept specs of `hurdle_table.json` in the rounds they are offered, 36 molecules per round number, 24 specs and 122 spec-and-round cells that both copies of the table agree on, played by a player who aims at the spec (<<nr_specs>> rounds).
- **Other reflex sets:** 162 molecules per set, greedy player, 26 carried sets (<<nr_sens>> rounds).
- **Fit:** 2,700 molecules (300 per round number) checked for what each reagent can act on at the start; 900 molecules checked for whether it can act anywhere in a line of three with the six.
- **Reflexes held:** the ones the spec study gives each band of rounds: ring and dry in rounds 1 to 3; plus flip, shift, tuck, weld, snap in rounds 4 to 6; all thirteen in rounds 7 to 9 (so seal, close, knit, cap, open and fold exist only from round 7).
- **Time:** main 2,951 s, pairs 562 s, specs 4,790 s, other reflex sets 120 s, fit and reach 154 s: about 8,600 s of waiting on 15 worker processes, on a machine other jobs were also using. A first full run was thrown away because `library.py` and `engine.py` were replaced while it ran (20 reagents became 18).

## Words used here

- **Carried:** the reagent is held together with the others named. Five are dealt each page from what is carried.
- **Yield:** what a round paid (the engine's own pay: step n of a page's overreaction pays 50 times n, less when the page does not beat an earlier one).
- **Dud:** a reagent that never acts. It takes a place in the bag and in the deal and nothing else. Every reagent is compared with a dud in its place, so a seventh reagent is not blamed for making the bag bigger. The bag of a starter-test is the six with one replaced by a dud; the bag of an unlock-test is the six plus one reagent, against the six plus a dud.
- **Yield change vs a dud:** mean yield with the reagent over mean yield with a dud, minus one. This is the reagent's own worth.
- **Yield change vs the six alone:** the same against the plain six (for a starter, against the five others). It also carries the cost of crowding the bag: the reagent also pushes the others out of the deal.
- **Ratio** (per round): (yield with + 50) over (yield without + 50). 50 is one step's pay, so a round that pays nothing does not give nothing over nothing.
- **STRENGTH:** for each of two players (greedy, look-ahead) and each of three bands (rounds 1 to 3, 4 to 6, 7 to 9), mean yield with the reagent over mean yield with a dud; the six numbers averaged; then divided by the same figure averaged over the six starters, so the average starter is 1.0. The 90% range is from 300 resamples of the molecules. A dud scores about 0.66 on this scale.
- **Fit at round start:** the share of dealt molecules the reagent has something to act on before anything is fired. **Can act in some line:** the share of molecules where some line of three, made from the six and the reagent, makes it act at all.
- **Swing:** the spread (standard deviation) of the log of the ratio over rounds. High means huge in some rounds and nothing in others.
- **Bonus** (pairs): yield together over base, minus yield of A over base, minus yield of B over base, plus one. Positive means the two are worth more together than their separate worths added up. All four bags of a pair have the same number of reagents (duds fill the gaps).
- **Must-have pair:** bonus at least +10% with the 90% range clear of +10%, and together at least 1.25 times the base.

## The one table

Ranked by STRENGTH. "Best partner (bonus)" is the partner with the biggest bonus.

<<master>>

## Flags

- **Dominates: oxidize.** It is dealt 82% of pages, is in a best line 97% of the time, and the best line is worse without it on 72% of pages. Carried in place of a dud it multiplies mean yield by 2.7; take it out of the six and the yield falls to 37%. Its worth is the same in rounds 1 to 3, 4 to 6 and 7 to 9 (2.8, 2.6, 2.7). It is the only starter that makes a C=O (the others add OH, take it off, turn a C=O into OH, or grow an arm on it), and ring, the reflex that starts most chains, needs a C=O and an OH. The next best reagent, grow, is worth +63% against its +181%.
- **Dead: hofmann.** It acts on nothing in any round alone: it needs an NH2 and only ritter makes one. With ritter it is worth +8% over adding the two, and ritter itself is worth nothing. Dead alone, nearly dead with its only feeder.
- **Near-dead (within 3 points of a dud on yield, changes the yield in 25 to 28% of rounds):** cyanohydrin, ritter, thiolene, chlorination, permanganate. Dealt 73% of pages, fired on a quarter to a third of them, 0.4 to 0.6 reflex steps after them, and no gain. Their groups (COOH, NH2, SH, Cl) are used only by seal, knit, cap and close, which exist only in rounds 7 to 9 and need a second group in the same molecule, and the made-up molecules and the game's table carry only C, H and O. Even with every reflex held from round 1 they stay at 0.66 to 0.74 (last table).
- **Crowds the deal (starters):** hydrate, hydroborate and reduce are worse than nothing against the six alone (-10%, -5% and -14% in the table: the six without them earn more than the six), and dehydrate only breaks even (0%). With one starter out the deal is five from five, not five from six, and these three give less than the better hand is worth. Reduce is a dud by itself (+1% against a dud): it acts on a terminal aldehyde only, 7 to 24% of molecules.
- **Must-have pairs.** None is a lock and key where both are dead alone and awake together. The pairs that are much more together than apart are below. Grow and dihydroxylation are worth about nothing without oxidize (1.01 and 1.04 against a dud in their pair bags) and +34% and +23% on top of it.
- **Spoil each other:** nothing serious. Cyanohydrin with epoxidation comes out 6% under epoxidation alone. Hydrate and hydroborate are twins (both add water across C=C): the two together are worth +47% against +37% and +45% alone, a bonus of -35%. Dehydrate and oxidize overlap too (both take the OH); that bonus (-123%) is inflated because the base with both removed is only four starters and two duds, and pays 110.

### Pairs worth more together than apart

<<must>>

### Pairs that give less together than the sum

<<redund>>

### Pairs that spoil each other (together under 0.95 of the better one alone)

<<spoil>>

## What the numbers say

1. **Four tiers.** Oxidize alone at the top. Then grow (+63% against a dud), ozonolysis (+41%), epoxidation (+30%, all of it in rounds 7 to 9). Then a middle of +10 to +22%: hydroformylation, dehydrate, dihydroxylation, hwe, chugaev, hydroborate, hydrate. Then nothing: reduce, hofmann, cyanohydrin, ritter, thiolene, chlorination, permanganate.
2. **Grow does nothing by itself.** 0.02 reflex steps follow it. Its worth is in the arm it adds (a C=C and a C-OH) that the next reagent and the next page use. It is the best partner of five reagents.
3. **Epoxidation is a late-round reagent.** In rounds 1 to 6 it is a dud (0.98 to 0.99): it makes an epoxide and only open and fold (from round 7) use one. In rounds 7 to 9 it is 1.84, the second best unlock, and when it acts it sets off 3.8 steps. It changes the yield in only 45% of rounds, so it is lumpy (swing 0.42, spread of yield change 788).
4. **Ozonolysis, hydroformylation, dihydroxylation, hwe** steady: swing 0.29 to 0.43. Ozonolysis peaks in rounds 4 to 6 (1.69). Hwe is best early (1.26) and fades (1.08 late). Chugaev and dehydrate grow with the round (dehydrate 1.05, 1.24, 1.31).
5. **Dehydrate, hydrate and hydroborate cut both ways.** They make the yield worse in 27%, 33% and 29% of rounds (dehydrate p10 ratio 0.72): they remove the OH or C=C a reflex was going to use. Oxidize and grow are worse than a dud in 1% and 5% of rounds.
6. **Positions.** Oxidize is the same anywhere (28, 34, 38% of firings first, second, third; a gain of 157 to 178 per page). Grow belongs early (50% first, 14% third; the best-line gain is 63 first and 17 third). Ozonolysis, hydroformylation and epoxidation want to be last (52 to 54% of their firings, gain 141, 82 and 296 against 67, 43 and 181 first): they need what the first two have made.
7. **What they set off.** Per firing: oxidize 2.0 steps (dry, weld, ring), epoxidation 2.4 (3.8 when it acts; open and fold), ozonolysis 1.9 (ring, weld, dry), hydroformylation 1.6 (ring), chugaev 1.2 (shift, snap), dehydrate 1.1 (snap, shift), hydrate 0.9, hwe 0.9, dihydroxylation 0.9, hydroborate 0.6, then 0.4 to 0.6 for reduce, cyanohydrin, chlorination, permanganate, ritter, thiolene.
8. **Runoff.** Oxidize gives hydrogen (1.8) and carbon dioxide (1.1) itself and water (0.6) through dry. Dehydrate 2.05 water. Chugaev 1.77 sulfur. Ozonolysis 1.3 pieces and 0.44 water. Chlorination 0.84 acid fumes and 0.30 more through close. Cyanohydrin 0.68 ammonia. Permanganate carbon dioxide 0.21 and hydrogen 0.34, and 0.39 water through seal. Epoxidation gives 0.14 water. Hydroformylation, dihydroxylation, hwe, hydroborate, hydrate, reduce, ritter and thiolene give water only through reflexes (0.06 to 0.25).
9. **Fit.** Eight reagents need a C=C and share one fit curve (hydrate, hydroborate, dihydroxylation, ozonolysis, epoxidation, hydroformylation, ritter, thiolene): 66, 64, 69, 59, 53, 53, 66, 72, 65% by round. Dehydrate and chugaev need an OH (66 rising to 94%). Oxidize needs an OH or a chain-end C=C (71 to 83%). Hwe and cyanohydrin need an aldehyde or a methyl ketone (28 to 64% by round). Reduce needs a terminal aldehyde (7 to 24%). Permanganate falls with the round (87 to 45%), chlorination rises (36 to 76%). Hofmann: 0. On the game's own molecules grow fits 91% and the made-up ones 63%.
10. **Specs.** Oxidize makes 88% of the kept-spec cells easier and grow 84%; dehydrate 60%, dihydroxylation 57%, ozonolysis 52%, hydroformylation 52%, hwe 45%. Ritter, thiolene, epoxidation and permanganate make 13 to 20% harder (their side effects get in the way of a player aiming at one spec). Hofmann changes nothing. 13 of the 122 cells (the hydrogen and carbon dioxide runoff specs) can only be offered when oxidize is carried.

## Alone value

Dealt: share of pages on which it is in the hand of five. Fired when dealt: share of those pages where it is in the chosen line. In a best line counts ties, so a reagent that does nothing still reads 70%; "best line worse without it" is the real measure. "How much worse" is the loss in page pay, on the pages where it was dealt.

<<alone>>

By player (ratio of mean yields against a dud, and the median round ratio), and against the six alone:

<<alone_player>>

## Fit rate

Share of dealt molecules the reagent has anything to act on at the start of the round, by round. A hand does not need the reagent to act at the start: it can act after another reagent in the line has made what it needs. The next table counts that.

<<fit>>

Share of molecules on which the reagent acts somewhere in some line of three made from the six and itself:

<<reach>>

On the page, when it was dealt: has something to act on at the start of the page; acts when fired (after earlier reagents of the line); places it acts at.

<<fitpage>>

## What it sets off

Reflex steps that follow it in the line, per firing; the reflexes that did them (per firing, the four most common); runoff.

<<setsoff>>

## Value by position in the line

Share of its firings that were first, second, third; reflex steps after it; mean pay of the page; and the mean gain, over every page it was dealt, of the best line with it in that place over the best line without it.

<<position>>

## Value by round

Early is rounds 1 to 3, middle 4 to 6, late 7 to 9. Ratio of mean yields against a dud.

<<band>>

By round number:

<<round>>

## Partners

For every pair of the 18, the four bags have the same number of reagents. Best three and worst, by bonus; in brackets the bonus and the pair's yield over the base.

<<partners>>

## Swing

How much its value varies from molecule to molecule. Rounds changed: the share of rounds where the yield differs at all. Better and worse: the shares where it was higher or lower.

<<swing>>

## Value toward the spec

Each cell is one kept spec in one round it is offered. A spec is "made easier" when a player aiming at it ends on a higher value by at least a tenth of N, with a paired test at two standard errors, with the reagent against a dud. Clear rates are not used because at the table's N the six already clear 93% of the time.

<<specs>>

## Other reflex sets

STRENGTH again with only the starting reflexes (ring, dry) held in every round, and with all of them held in every round. Greedy player only, scaled to the average starter in the same set.

<<sens>>

Ozonolysis, epoxidation and hydroformylation gain the most when all reflexes are held early (epoxidation 0.70 to 1.19). The five group-makers stay at the bottom under every set.

## Where the engine is too crude to trust

- **The molecules carry only C, H and O.** Nothing in the game's table or the made-up ones has N, S, Cl or COOH at the start. The five group-makers (ritter, thiolene, chlorination, permanganate, cyanohydrin) and hofmann can only be valued through the reflexes that meet two groups made in the same molecule. A second feeder of the other group (for example, Cl and OH 3 or 4 apart for close; NH2 and a C=O for knit) is rare in these molecules. Their deadness is partly the molecule set. Read them as "not worth anything on these molecules", not "worth nothing".
- **Yield comes only from reflex steps.** A reagent earns yield only by what it sets off, so the pay cannot see worth that the game may give some other way: a clean molecule, runoff for the jars, the spec, a cross-page set-up.
- **The players are not people.** Greedy sees one page. Look-ahead sees this page and the next, with the next hand known. Neither plans three pages, aims at the spec while playing for yield, or holds a reagent back. Reagents that are set-up pieces (grow, dihydroxylation, epoxidation) are probably worth more to a person who plans than here.
- **A seventh reagent, not a full run.** Each reagent is measured on top of the six (a starter against the other five). A real run carries up to eight with several unlocks at once. The pair table is the only place two are carried together; three or more are not measured.
- **The six never leave.** A real run may carry fewer than the six, or swap a starter for an unlock; here the six are always in the bag.
- **The pair bags for starters** are a small bag (four starters and two duds, or five and a dud): the deal is almost fixed, so a pair of two starters reads large. Treat the starter-starter bonuses as a size of overlap, not a worth.
- **The reflex set per band** is the one the spec study uses, and a player may hold different reflexes by then. The last table shows the strengths move: a reagent that depends on a late reflex (epoxidation) moves most.
- **The spec table was refitted by another job while this ran.** Only the specs and rounds that both copies list were used (24 specs, 122 cells). The aimed player is greedy page by page, so a "harder" cell can be the aimed player's own mistake.
- **The look-ahead rounds are fewer** (270 against 648). Values for the two players are consistent for the top and bottom reagents; in the middle of the table the order changes with the player (see the player table).
- **Ties.** Many lines tie on pay (all those that do nothing). The player draws one at random, so "in a best line" overstates a reagent that does nothing.
- **Generated molecules** (half the rounds) are made by a crude generator: chains of C(=O), C(O), C=C, with a ring or phenol on the end now and then. The game's own molecules are in the other half; the fit table shows the two differ (grow 91% against 63%).
- **Only the reagents' own steps and the reflexes are measured.** Instruments, homunculi, specs, and the gold price are not in the engine.

## Files and commands

`reagent_stats.py` (this program), `REAGENT_STATS.md` (this page), `reagent_stats.json` (every number above and more: per-reagent blocks, all 153 pairs with their ranges, the spec effect).

```
python reagent_stats.py main   OUT/main.stream 72 30    # rounds per round number, look-ahead rounds per round number
python reagent_stats.py pairs  OUT/pairs.stream 27
python reagent_stats.py specs  OUT/specs.pkl 36         # then: specs_null OUT/specs_null.stream 36
python reagent_stats.py sens   OUT/sens.stream 18
python reagent_stats.py fit    OUT/fit.pkl 300
python reagent_stats.py reach  OUT/reach.pkl 100
python reagent_stats.py agg    OUT                      # writes REAGENT_STATS.md and reagent_stats.json next to this file
```
'''


def run_agg(out_dir):
    seconds = {'main': 2951, 'pairs': 562, 'specs': 4268, 'specs_null': 522, 'sens': 120, 'fit': 109, 'reach': 45,
               'note': 'seconds of waiting on 15 worker processes, machine shared with other jobs'}
    return make_report(out_dir, HERE, seconds, PROSE)


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'agg':
        run_agg(sys.argv[2])
        sys.exit(0)
    if cmd == 'instances':
        ins = instances(int(sys.argv[2]) if len(sys.argv) > 2 else 72)
        print(len(ins), Counter(i[4] for i in ins))
    elif cmd == 'main':
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 72
        la = int(sys.argv[4]) if len(sys.argv) > 4 else 30        # the first `la` rounds of each round number are also played by the look-ahead player
        ins = sorted(instances(n), key=lambda i: (i[1], i[0]))     # interleaved by round so a partial run is balanced
        run_stream(work_main, [(i, 'band', PLAYERS if i[1] < la else ('greedy',)) for i in ins], sys.argv[2], 'main')
    elif cmd == 'sens':
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 27
        ins = sorted(instances(n, tag='sens'), key=lambda i: (i[1], i[0]))
        tasks = [(i, m, ('greedy',)) for i in ins for m in ('start', 'all')]
        run_stream(work_main, tasks, sys.argv[2], 'sens')
    elif cmd == 'specs_null':
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 36
        ins = sorted(instances(n, tag='spec'), key=lambda i: (i[1], i[0]))
        run_stream(work_specs_null, [(i,) for i in ins], sys.argv[2], 'specs_null')
    elif cmd == 'pairs':
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 27
        ins = sorted(instances(n, tag='pair'), key=lambda i: (i[1], i[0]))
        run_stream(work_pairs, [(i,) for i in ins], sys.argv[2], 'pairs')
    elif cmd == 'specs':
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 36
        ins = instances(n, tag='spec')
        run_phase(work_specs, [(i,) for i in ins], sys.argv[2], 'specs')
    elif cmd == 'reach':
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 100
        run_phase(work_reach, [(i,) for i in instances(n, tag='reach')], sys.argv[2], 'reach')
    elif cmd == 'fit':
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 300
        ins = instances(n, tag='fit')
        run_phase(work_fit, [(i,) for i in ins], sys.argv[2], 'fit')
