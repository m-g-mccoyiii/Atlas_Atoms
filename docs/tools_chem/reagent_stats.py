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


if __name__ == '__main__':
    cmd = sys.argv[1]
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
