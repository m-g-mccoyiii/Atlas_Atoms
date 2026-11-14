"""sweep_exps.py: the experiment grids of docs/SWEEP.md.  Each function returns the list of jobs for sweep_run.run.

  python sweep_run.py list
  python sweep_run.py a_six            every starting six of the 18 reagents (18,564), rounds 1 to 3
  python sweep_exps.py all             every experiment in order (resumable)
"""
import itertools
import json
import os
import random
import re
import sys

import sweep_core as SC

POOL = SC.POOL18
START = list(SC.START_SIX)
OLD = ['hydrate', 'hydroborate', 'dehydrate', 'oxidize', 'reduce', 'grow']
EIGHT = START + ['reduce', 'hydroborate']
XM = int(os.environ.get('SWEEP_X', '1'))          # more seed blocks in every cell of the small grids (the ids of the first blocks stay)
HOMS = ('water', 'h2', 'co2', 'acid', 'wood', 'salt', 'slime', 'ammonia', 'seedling', 'brimstone')


def _rid(rack):
    return ''.join('%x' % POOL.index(r) if POOL.index(r) < 16 else 'gh'[POOL.index(r) - 16] for r in rack)


def a_six():
    """Every six of the 18 reagents (18,564 sets): a bachelor's (rounds 1 to 3), novice, greedy and median player, 2 seeds a set."""
    jobs = []
    for i, rack in enumerate(itertools.combinations(POOL, 6)):
        b = i % 16                          # 16 blocks of seeds: sets in a block meet the same deals (48 seeds in all)
        jobs.append({'id': 'six_' + _rid(rack), 'rack': list(rack), 'length': 'bachelor', 'players': ['novice', 'greedy', 'median'],
                     'seeds': [b * 10 + 1, b * 10 + 2]})
    return jobs


def model_six(rows=None, key='median'):
    """Least squares on the sweep of sixes: cleared rounds of a set = base + sum of its reagents' effects.  Returns
    (base, {reagent: effect}, {set: predicted})."""
    import numpy as np
    import sweep_run as SR
    rows = rows if rows is not None else [r for r in SR.rows_of('a_six') if 'by' in r]
    X = np.zeros((len(rows), len(POOL) + 1))
    y = np.zeros(len(rows))
    for i, r in enumerate(rows):
        X[i, 0] = 1
        for g in r['rack']:
            X[i, 1 + POOL.index(g)] = 1
        y[i] = r['by'][key]['cleared'] / float(r['by'][key]['n'])
    # every set has exactly six reagents, so the columns sum to six times the constant: solve with the effects centred
    coef = np.linalg.lstsq(X, y, rcond=None)[0]
    eff = coef[1:] - coef[1:].mean()
    base = coef[0] + 6 * coef[1:].mean()
    pred = {tuple(r['rack']): float(base + sum(eff[POOL.index(g)] for g in r['rack'])) for r in rows}
    return float(base), {g: float(eff[i]) for i, g in enumerate(POOL)}, pred


def six_picks(n_top=40, n_bot=20, n_rand=40):
    base, eff, pred = model_six()
    order = sorted(pred, key=lambda k: -pred[k])
    rg = random.Random(7)
    mid = rg.sample(order[n_top:-n_bot], n_rand)
    picks = [('top', k) for k in order[:n_top]] + [('bottom', k) for k in order[-n_bot:]] + [('random', k) for k in mid]
    if tuple(START) not in [k for _, k in picks]:
        picks.append(('start', tuple(START)))
    if tuple(sorted(OLD, key=POOL.index)) not in [k for _, k in picks]:
        picks.append(('old', tuple(sorted(OLD, key=POOL.index))))
    return picks


def a_six2():
    """Stage two: the 40 best, 20 worst and 40 random sixes by the model of a_six, and the two the game has had, 60 unseen seeds each."""
    jobs = []
    for tag, rack in six_picks():
        for c in range(6):
            jobs.append({'id': 'six2_%s_%d' % (_rid(rack), c), 'rack': list(rack), 'length': 'bachelor', 'tag': tag,
                         'players': ['novice', 'greedy', 'median'] + (['planner'] if c < 2 else []),
                         'seeds': list(range(3001 + c * 10, 3011 + c * 10))})
    return jobs


def a_eight():
    """A sample of 300 of the 43,758 carried eights, played on rounds 4 to 6 (a master's), greedy and median player, 4 seeds."""
    rg = random.Random(8)
    seen, jobs = set(), []
    while len(jobs) < 300:
        rack = tuple(sorted(rg.sample(POOL, 8), key=POOL.index))
        if rack in seen:
            continue
        seen.add(rack)
        b = len(jobs) % 12
        jobs.append({'id': 'eight_' + _rid(rack), 'rack': list(rack), 'length': 'master', 'first': 4, 'last': 6,
                     'players': ['greedy', 'median'], 'seeds': [500 + b * 10 + k for k in range(4)]})
    return jobs


def b_elem():
    """Elements: N, S, Cl and seven candidates, each with its reagent and reflex, nine rounds, three deal curves, median player."""
    import sweep_elements as SE
    jobs = []
    base4 = ['hydrate', 'oxidize', 'grow', 'dehydrate']
    for c in range(3 * XM):
        seeds = list(range(700 + c * 4, 704 + c * 4))
        jobs.append({'id': 'el_control_%d' % c, 'mods': [], 'rack': base4 + ['reduce', 'hydroborate'], 'length': 'doctorate',
                     'players': ['median'], 'seeds': seeds, 'tag': 'control'})
        for el in SE.ORDER:
            rg = list(SE.ELEMENTS[el]['reagents'])[:1]
            for curve in ('rise', 'flat', 'none'):
                jobs.append({'id': 'el_%s_%s_%d' % (el, curve, c), 'mods': ['elem:%s:%s' % (el, curve)], 'rack': base4 + rg + ['hydroborate'],
                             'length': 'doctorate', 'players': ['median'], 'seeds': seeds, 'watch': el, 'tag': '%s/%s' % (el, curve)})
    return jobs


def _best_six():
    try:
        return list(six_picks(1, 1, 1)[0][1])
    except Exception:
        return None


def c_hom1():
    """Homunculi, each alone and none: two reagent sets, three run lengths, median player."""
    jobs = []
    racks = {'start': START, 'eight': EIGHT}
    for nm in ('none',) + HOMS:
        mods = [] if nm == 'none' else ['perk:' + nm]
        for rk, rack in racks.items():
            for length, n in (('bachelor', 8), ('master', 4), ('doctorate', 2)):
                for c in range(n * XM):
                    jobs.append({'id': 'h1_%s_%s_%s_%d' % (nm, rk, length, c), 'mods': mods, 'rack': rack, 'length': length,
                                 'players': ['median'], 'seeds': list(range(900 + c * 4, 904 + c * 4)), 'tag': '%s|%s|%s' % (nm, rk, length)})
    return jobs


def c_hom23():
    """Homunculi, every pair and every triple: the eight-reagent set, a master's, median player, 4 seeds."""
    jobs = []
    for k in (2, 3):
        for combo in itertools.combinations(HOMS, k):
            for c in range(1):
                jobs.append({'id': 'h%d_%s_%d' % (k, '+'.join(combo), c), 'mods': ['perk:' + x for x in combo], 'rack': EIGHT,
                             'length': 'master', 'players': ['median'], 'seeds': list(range(900 + c * 4, 904 + c * 4)),
                             'tag': '+'.join(combo)})
    return jobs


def d_sig1():
    """Sigils, each alone and none: two reagent sets, a bachelor's (24 runs a set) and a master's (12), median player."""
    import sigil2_rules as S2
    jobs = []
    for sid in ('none',) + S2.ORDER:
        mods = [] if sid == 'none' else ['sigil:' + sid]
        for rk, rack in (('start', START), ('eight', EIGHT)):
            for length, n in (('bachelor', 6), ('master', 3)):
                for c in range(n * XM):
                    jobs.append({'id': 's1_%s_%s_%s_%d' % (sid, rk, length, c), 'mods': mods, 'rack': rack, 'length': length,
                                 'players': ['median'], 'seeds': list(range(1100 + c * 4, 1104 + c * 4)), 'tag': '%s|%s|%s' % (sid, rk, length)})
    return jobs


def d_sig2():
    """Sigils, every pair: the start six, rounds 1 to 4 of a master's (the fold comes in at round 4), median player, 4 seeds."""
    import sigil2_rules as S2
    jobs = []
    for a, b in itertools.combinations(S2.ORDER, 2):
        for c in range(XM):
            jobs.append({'id': 's2_%s+%s%s' % (a, b, '_%d' % c if c else ''), 'mods': ['sigil:' + a, 'sigil:' + b], 'rack': START, 'length': 'master',
                         'first': 1, 'last': 4, 'players': ['median'], 'seeds': list(range(1100 + c * 4, 1104 + c * 4)), 'tag': '%s+%s' % (a, b)})
    return jobs


def d_sighom():
    """Each sigil with each homunculus: the eight-reagent set, rounds 1 to 4 of a master's, median player, 4 seeds."""
    import sigil2_rules as S2
    jobs = []
    for a in S2.ORDER:
        for h in HOMS:
            jobs.append({'id': 'sh_%s+%s' % (a, h), 'mods': ['sigil:' + a, 'perk:' + h], 'rack': EIGHT, 'length': 'master', 'first': 1, 'last': 4,
                         'players': ['median'], 'seeds': list(range(900, 904)), 'tag': '%s+%s' % (a, h)})
    return jobs


def d_sigsets():
    """Each sigil on a sample of 12 other sixes (the best, worst and random of a_six), a bachelor's, median player, 8 seeds."""
    import sigil2_rules as S2
    picks = six_picks(4, 4, 4)[:12]
    jobs = []
    for sid in ('none',) + S2.ORDER:
        for tag, rack in picks:
            jobs.append({'id': 'ss_%s_%s' % (sid, _rid(rack)), 'mods': [] if sid == 'none' else ['sigil:' + sid], 'rack': list(rack),
                         'length': 'bachelor', 'players': ['median'], 'seeds': list(range(1300, 1308)), 'tag': '%s|%s' % (sid, tag)})
    return jobs


def d_base4():
    """No sigil and no creature on rounds 1 to 4, and each creature alone there: what the pairs of d_sig2 and d_sighom are held against."""
    import sigil2_rules as S2
    jobs = []
    for c in range(XM):
        sx = '_%d' % c if c else ''
        s1, s9 = list(range(1100 + c * 4, 1104 + c * 4)), list(range(900 + c * 4, 904 + c * 4))
        jobs.append({'id': 'b4_none_start' + sx, 'mods': [], 'rack': START, 'length': 'master', 'first': 1, 'last': 4, 'players': ['median'],
                     'seeds': s1, 'tag': 'none|start'})
        for a in S2.ORDER:
            jobs.append({'id': 'b4_%s_start%s' % (a, sx), 'mods': ['sigil:' + a], 'rack': START, 'length': 'master', 'first': 1, 'last': 4,
                         'players': ['median'], 'seeds': s1, 'tag': '%s|start' % a})
        if c:
            continue
        jobs.append({'id': 'b4_none_eight', 'mods': [], 'rack': EIGHT, 'length': 'master', 'first': 1, 'last': 4, 'players': ['median'],
                     'seeds': s9, 'tag': 'none|eight'})
        for a in S2.ORDER:
            jobs.append({'id': 'b4_%s_eight' % a, 'mods': ['sigil:' + a], 'rack': EIGHT, 'length': 'master', 'first': 1, 'last': 4,
                         'players': ['median'], 'seeds': s9, 'tag': '%s|eight' % a})
        for h in HOMS:
            jobs.append({'id': 'b4_%s_eight' % h, 'mods': ['perk:' + h], 'rack': EIGHT, 'length': 'master', 'first': 1, 'last': 4,
                         'players': ['median'], 'seeds': s9, 'tag': '%s|eight' % h})
    return jobs


def e_last():
    """The last sigil: four versions and their policies against no sigil; start six; a master's and nine rounds; median and greedy player."""
    import sigil2_last as SL
    jobs = []
    for cell in ('none',) + SL.CELLS:
        mods = [] if cell == 'none' else ['sigil:last_' + cell]
        for length, n in (('master', 5), ('doctorate', 4)):
            for c in range(n * XM):
                jobs.append({'id': 'last_%s_%s_%d' % (cell.replace(':', '-'), length, c), 'mods': mods, 'rack': START, 'length': length,
                             'players': ['median', 'greedy'], 'seeds': list(range(1500 + c * 4, 1504 + c * 4)), 'tag': '%s|%s' % (cell, length)})
    return jobs


EXPERIMENTS = {'e_last': e_last, 'd_base4': d_base4, 'a_six': a_six, 'a_six2': a_six2, 'a_eight': a_eight, 'b_elem': b_elem, 'c_hom1': c_hom1, 'c_hom23': c_hom23,
               'd_sig1': d_sig1, 'd_sig2': d_sig2, 'd_sighom': d_sighom, 'd_sigsets': d_sigsets}
ORDER_ALL = ('d_sig1', 'c_hom1', 'd_base4', 'e_last', 'a_six', 'a_six2', 'b_elem', 'd_sig2', 'c_hom23', 'd_sighom', 'a_eight', 'd_sigsets')


def speed(arg='greedy'):
    """Throughput and the bare win rate: nine-round runs of the starting six, 5 seeds a job (arg: player[,jobs[,length]])."""
    ps = (arg or 'greedy').split(',')
    pl, n, ln = ps[0], int(ps[1]) if len(ps) > 1 else 4000, ps[2] if len(ps) > 2 else 'doctorate'
    return [{'id': 'sp_%s_%s_%d' % (pl, ln, i), 'rack': START, 'length': ln, 'player': pl,
             'seeds': ['%s/%d' % (ln, i * 5 + k) for k in range(5)]} for i in range(n)]


EXPERIMENTS['speed'] = speed


def wins(arg='greedy'):
    """The bare run (the starting six, no instrument, no creature, no sigil): 20,000 runs a player of up to twelve rounds, stopped
    at the first round not cleared.  Clearing nine is a doctorate won, clearing twelve a postdoc.  The same seeds for every player.
    arg: player[,runs]."""
    ps = (arg or 'greedy').split(',')
    pl, n = ps[0], int(ps[1]) if len(ps) > 1 else 20000
    return [{'id': 'win_%s_%d' % (pl, i), 'rack': START, 'length': 'postdoc', 'player': pl, 'stop': True, 'params': {'co2': False},
             'seeds': ['w/%d' % (i * 10 + k) for k in range(10)], 'tag': pl} for i in range(n // 10)]


def wins_all():
    return wins('novice') + wins('greedy') + wins('median')


EXPERIMENTS['wins'] = wins
EXPERIMENTS['wins_all'] = wins_all


# --- the twelfth measure: how hard the bare run is for the careful player (ruling AP 1) -----------------------------------
DIFF = {
    'base': {},
    'big15': {'spec_shift': {4: -0.15, 5: -0.15, 6: -0.15, 7: -0.15, 8: -0.15, 9: -0.15}},
    'big30': {'spec_shift': {4: -0.30, 5: -0.30, 6: -0.30, 7: -0.30, 8: -0.30, 9: -0.30}},
    'pair4': {'pair_from': 4},
    'pair1': {'pair_from': 1},
    'r2': {'spec_shift': {2: 0.15}},
    'r12': {'spec_shift': {1: 0.15, 2: 0.25}},
    'r12b': {'spec_shift': {1: 0.10, 2: 0.15}},
    'n15': {'spec_scale_long': {4: 1.5, 5: 1.5, 6: 1.5, 7: 1.5, 8: 1.5, 9: 1.5}},
    'n20': {'spec_scale_long': {4: 2.0, 5: 2.0, 6: 2.0, 7: 2.0, 8: 2.0, 9: 2.0}},
    's2a': {'spec_scale_long': {2: 0.7}},
    's2b': {'spec_scale_long': {2: 0.5}},
    's2c': {'spec_scale_long': {1: 0.7, 2: 0.5}},
    's2c_on': {'spec_scale_long': {1: 0.7, 2: 0.5}},
    'base_on': {},
}


def diff(arg='base,median,2000'):
    """Every round of twelve played whether or not the one before was cleared, so a pass mark can be read off afterwards
    (bare rounds carry nothing from one to the next).  arg: variant,player,runs[,length[,stop]]."""
    ps = arg.split(',')
    var, pl, n = ps[0], ps[1], int(ps[2]) if len(ps) > 2 else 2000
    ln = ps[3] if len(ps) > 3 else 'postdoc'
    stop = len(ps) > 4 and ps[4] == 'stop'
    par = dict(DIFF[var], co2=False)
    if var.endswith('_on'):
        del par['co2']                  # as the game plays a run past the bachelor's: oxidize cuts a chain-end C=C and gives off carbon dioxide
    return [{'id': 'df_%s_%s_%s%s_%d' % (var, pl, ln, '_s' if stop else '', i), 'rack': START, 'length': ln, 'player': pl, 'stop': stop,
             'params': par, 'seeds': ['w/%d' % (i * 10 + k) for k in range(10)], 'tag': '%s/%s' % (var, pl)} for i in range(n // 10)]


EXPERIMENTS['diff'] = diff

# The clear rule of the twelfth measure (path.js RULE.needPar, RULE.specScaleLong): the spec met AND the yield past this share of
# the number to beat, by round; rounds 1 and 2 of the long runs with smaller spec numbers.
NEED12 = [0.86, 0.95, 0.88, 1.17, 1.60, 1.03, 1.12, 1.26, 1.16, 0.98, 0.77, 0.52]      # the twelfth measure's marks under the square root rule (FLAT)
T12 = {'need_par': NEED12, 'spec_scale_long': {1: 0.7, 2: 0.5}, 'aim_par': True}
assert SC.NEED_PAR is None or SC.NEED_PAR == NEED12, 'path.js RULE.needPar and NEED12 differ'


def final(arg='median,20000'):
    """The bare run under the new clear rule, stopped at the first round not cleared, up to twelve rounds, on seeds the pass
    marks were not fitted on.  arg: player,runs[,noaim][,key=value;...] (key=value: more params, as JSON values)."""
    ps = arg.split(',')
    pl, n = ps[0], int(ps[1]) if len(ps) > 1 else 20000
    par = dict(T12, co2=False)
    tag = pl
    for x in ps[2:]:
        if x == 'noaim':
            par['aim_par'] = False
            tag += '/noaim'
        elif x.startswith('v'):
            tag += '/' + x                     # a later set of pass marks: its own rows
        elif x == 'on':
            del par['co2']                     # as the game plays a doctorate with nothing unlocked (carbon dioxide comes off)
            tag += '/on'
        elif '=' in x:
            k, v = x.split('=', 1)
            par[k] = json.loads(v.replace(';', ','))
            tag += '/' + x
    return [{'id': 'fin_%s_%d' % (tag, i), 'rack': START, 'length': 'postdoc', 'player': pl, 'stop': True, 'params': par,
             'seeds': ['f/%d' % (i * 10 + k) for k in range(10)], 'tag': tag} for i in range(n // 10)]


EXPERIMENTS['final'] = final

# --- the ten homunculi, second design (ruling AP 2; sweep_homs.py) ----------------------------------------------------------
HOMS2 = ('water', 'h2', 'co2', 'acid', 'wood', 'salt', 'slime', 'ammonia', 'seedling', 'brimstone')


def hom_jobs(sets, n, length='doctorate', player='median', stop=False, seed='h', extra=None):
    """sets: list of tuples of homunculus names (may carry '@k'); () is none (co2 on, as a run that holds a creature), ('bare',) the bare run."""
    jobs = []
    for hs in sets:
        bare = hs == ('bare',)
        par = dict(T12)
        if bare:
            par['co2'] = False
        if extra:
            par.update(extra)
        tag = '+'.join(hs) or 'none'
        for i in range(n // 10):
            jobs.append({'id': 'hm_%s_%s_%s%s_%s_%d' % (tag, length, player, '_s' if stop else '', seed, i), 'rack': START, 'length': length,
                         'player': player, 'stop': stop, 'mods': [] if bare else ['hom:' + h for h in hs], 'params': par,
                         'seeds': ['%s/%d' % (seed, i * 10 + k) for k in range(10)], 'tag': '%s|%s|%s' % (tag, length, player)})
    return jobs


def hom1(arg='300'):
    """Each of the ten alone, the bare run and no creature: nine rounds, every round played.  arg: runs[,player[,names;names...]]."""
    ps = arg.split(',')
    n = int(ps[0])
    pl = ps[1] if len(ps) > 1 else 'median'
    sets = [('bare',), ()] + [(h,) for h in HOMS2]
    if len(ps) > 2:
        sets = [tuple(x.split('+')) for x in ps[2].split(';')]
    return hom_jobs(sets, n, player=pl)


def hom23(arg='40'):
    """All 45 pairs and all 120 triples, nine rounds, every round played.  arg: runs a set."""
    import itertools
    n = int(arg)
    sets = [c for k in (2, 3) for c in itertools.combinations(HOMS2, k)]
    return hom_jobs(sets, n)


EXPERIMENTS['hom1'] = hom1
EXPERIMENTS['hom23'] = hom23

# --- the sign (ruling AP 4; path.js SIGN) -------------------------------------------------------------------------------
SIGN = {'lift': 0.2, 'bar': 1.15, 'tasks': 1.25, 'takes': ['pair4', 'tasks', 'uses', 'pair1', 'hand']}


def sign_params(level, opt='takes'):
    """The run of a player who has taken the sign `level` times.  opt: 'lift' the lift alone, 'bar' the number to beat rises
    too, 'takes' the sign also takes one thing a level (as path.js)."""
    par = dict(T12, yield_mul=1 + SIGN['lift'] * level)
    if opt in ('bar', 'takes'):
        par['par_mul'] = SIGN['bar'] ** level
    if opt == 'takes':
        tk = SIGN['takes'][:level]
        if 'pair4' in tk:
            par['pair_from'] = 4
        if 'pair1' in tk:
            par['pair_from'] = 1
        if 'tasks' in tk:
            sl = dict(par['spec_scale_long'])
            par['spec_scale_long'] = {r: sl.get(r, 1.0) * SIGN['tasks'] for r in range(1, 10)}
        if 'uses' in tk:
            par['uses'] = 2
        if 'hand' in tk:
            par['hand'] = 4
    return par


def sign(arg='800'):
    """Nine-round runs with nothing unlocked at each level of the sign, every round played.  arg: runs[,player]."""
    ps = arg.split(',')
    n, pl = int(ps[0]), ps[1] if len(ps) > 1 else 'median'
    jobs = []
    for opt, levels in (('bar', (1, 2, 3, 5)), ('takes', (1, 2, 3, 4, 5))):
        for lv in levels:
            for i in range(n // 10):
                jobs.append({'id': 'sg_%s_%d_%s_%d' % (opt, lv, pl, i), 'rack': START, 'length': 'doctorate', 'player': pl,
                             'params': sign_params(lv, opt), 'seeds': ['h/%d' % (i * 10 + k) for k in range(10)],
                             'tag': '%s %d|doctorate|%s' % (opt, lv, pl)})
    return jobs


EXPERIMENTS['sign'] = sign

# --- the opening (ruling AP 3): the bachelor's for a beginner -------------------------------------------------------------
HET_EARLY = [0.35, 0.40, 0.45, 0.50, 0.58, 0.70, 0.80, 0.90, 0.95]
OPEN = {
    'o0': {},
    'o1': {'spec_scale': {1: 0.15, 2: 0.36, 3: 0.45}},
    'o2': {'spec_scale': {1: 0.15, 2: 0.30, 3: 0.35}},
    'o3': {'spec_scale': {1: 0.15, 2: 0.36, 3: 0.45}, 'het': HET_EARLY},
    'o4': {'het': HET_EARLY},
    'o5': {'spec_scale': {1: 0.15, 2: 0.36, 3: 0.45}, 'het': HET_EARLY,
           'spec_ban_by': {1: ['cut_down', 'double_bonds', 'unsaturation', 'lean_turns'], 2: ['end_CO', 'off_hydrogen']}},
    'o6': {'spec_scale': {1: 0.15, 2: 0.36, 3: 0.40}, 'het': HET_EARLY,
           'spec_ban_by': {1: ['cut_down', 'double_bonds', 'unsaturation'], 2: ['end_CO']}},
}


def opening(arg='o0,600'):
    """Three-round runs of the starting six by the novice, the greedy and the median player, every round played.  arg: variant,runs."""
    ps = arg.split(',')
    var, n = ps[0], int(ps[1]) if len(ps) > 1 else 600
    return [{'id': 'op_%s_%d' % (var, i), 'rack': START, 'length': 'bachelor', 'players': ['novice', 'greedy', 'median'], 'per': True,
             'params': dict(OPEN[var]), 'seeds': ['o/%d' % (i * 10 + k) for k in range(10)], 'tag': var} for i in range(n // 10)]


EXPERIMENTS['opening'] = opening


def phase1(name, jobs):
    """The first pass, for a machine that is shared: a part of every grid, chosen so each cell still has runs.  The ids are the
    ids of the full grid, so the full grid later carries on from here."""
    rg = random.Random(11)
    if name == 'a_six':
        keep = set(j['id'] for j in rg.sample(jobs, 700))
        keep |= {'six_' + _rid(START), 'six_' + _rid(sorted(OLD, key=POOL.index))}
        return [j for j in jobs if j['id'] in keep]
    if name == 'd_sig1':
        return [j for j in jobs if ('_start_bachelor_' in j['id'] and j['id'][-1] in '012') or ('_start_master_' in j['id'] and j['id'][-1] == '0')]
    if name == 'c_hom1':
        return [j for j in jobs if ('_eight_master_' in j['id'] and j['id'][-1] in '01') or ('_start_bachelor_' in j['id'] and j['id'][-1] in '01')]
    if name == 'e_last':
        return [j for j in jobs if '_master_' in j['id'] and j['id'][-1] in '01']
    if name == 'b_elem':
        return [j for j in jobs if j['id'][-1] == '0' and ('_rise_' in j['id'] or '_none_' in j['id'] or 'control' in j['id'])]
    if name == 'd_sig2':
        return rg.sample(jobs, 60)
    if name == 'c_hom23':
        return [j for j in jobs if j['id'].startswith('h2_')]
    if name == 'd_sighom':
        return rg.sample(jobs, 50)
    if name == 'a_eight':
        return jobs[:60]
    if name == 'd_base4':
        return jobs
    return []


PHASE1 = ('d_sig1', 'c_hom1', 'e_last', 'a_six', 'b_elem', 'd_base4', 'c_hom23', 'd_sig2', 'd_sighom', 'a_eight')

if __name__ == '__main__':
    import sweep_run as SR
    if sys.argv[1] == 'phase1':
        workers = int(os.environ.get('SWEEP_WORKERS', '8'))
        for name in sys.argv[2:] or PHASE1:
            st = SR.run(name, phase1(name, EXPERIMENTS[name]()), workers)
            print('DONE', name, json.dumps(st), flush=True)
        sys.exit(0)
    which = sys.argv[2:] or ORDER_ALL
    workers = int(os.environ.get('SWEEP_WORKERS', '8'))
    for name in which:
        st = SR.run(name, EXPERIMENTS[name](), workers)
        print('DONE', name, json.dumps(st), flush=True)


# --- the thirteenth measure, part 1: a gentle start and a wall at the end (ruling AR) ------------------------------------
GENTLE = {
    'g0': {'spec_scale_long': {1: 0.7, 2: 0.5}},
    'g1': {'spec_scale_long': {1: 0.3, 2: 0.35, 3: 0.7}, 'spec_ban_long': {1: ['cut_down', 'double_bonds', 'unsaturation', 'lean_turns'], 2: ['end_CO', 'off_hydrogen']}},
}


def gentle(arg='g1,median,2000'):
    """Every round of twelve played, cleared or not, with every round written out in full (molecule, spec met, share of the
    spec reached, yield, the reflexes), as the game plays a long run with nothing unlocked.  arg: variant,player,runs[,seed letter[,length]]."""
    ps = arg.split(',')
    var, pl, n = ps[0], ps[1], int(ps[2])
    sd = ps[3] if len(ps) > 3 else 'g'
    ln = ps[4] if len(ps) > 4 else 'postdoc'
    lt = '' if ln == 'postdoc' else '_' + ln
    return [{'id': 'gt_%s_%s_%s%s_%d' % (var, pl, sd, lt, i), 'rack': START, 'length': ln, 'player': pl, 'params': dict(GENTLE[var]), 'full': True,
             'seeds': ['%s/%d' % (sd, i * 10 + k) for k in range(10)], 'tag': '%s%s/%s' % (var, lt, pl)} for i in range(n // 10)]


GENTLE['g3'] = dict(GENTLE['g1'])        # as g2, the chlorine molecules dealt by RULE.clEarly alone (0.22)
GENTLE['g4'] = dict(GENTLE['g1'])        # RULE.clEarly 0.32, hands with close counted
GENTLE['g2'] = dict(GENTLE['g1'])        # the same rule, run after the chlorine molecules went into rounds 1 to 3 (part 4)
EXPERIMENTS['gentle'] = gentle


# the clear rule as the game has it now (path.js RULE.needParBy, specScaleLong, specBanByLong)
T13 = {'need_par': SC.NEED_PAR_BY, 'spec_scale_long': SC.SPEC_SCALE_LONG, 'spec_ban_long': SC.SPEC_BAN_LONG, 'aim_par': True}


def final13(arg='median,6000,doctorate'):
    """A long run with nothing unlocked under the game's rule as it stands, stopped at the first round not cleared, on deals the
    marks were not fitted on.  arg: player,runs,length[,key=value;...]."""
    ps = arg.split(',')
    pl, n, ln = ps[0], int(ps[1]), ps[2]
    par = dict(T13)
    tag = '%s/%s' % (ln, pl)
    for x in ps[3:]:
        k, v = x.split('=', 1)
        par[k] = json.loads(v.replace(';', ','))
        tag += '/' + x
    return [{'id': 'f13_%s_%d' % (tag, i), 'rack': START, 'length': ln, 'player': pl, 'stop': True, 'params': par, 'full': True,
             'seeds': ['v/%d' % (i * 10 + k) for k in range(10)], 'tag': tag} for i in range(n // 10)]


EXPERIMENTS['final13'] = final13


def hom13(arg='300'):
    """Thirteenth: each creature alone under the game's rule as it stands (T13), nine rounds, every round played, with the run
    that holds none.  arg: runs[,player[,names;names...]] (a name may be a pair: wood+ammonia)."""
    ps = arg.split(',')
    n = int(ps[0])
    pl = ps[1] if len(ps) > 1 else 'median'
    sets = [()] + [(h,) for h in HOMS2]
    if len(ps) > 2:
        sets = [tuple(x.split('+')) if x != 'none' else () for x in ps[2].split(';')]
    jobs = hom_jobs(sets, n, player=pl, seed='k', extra=T13)
    for j in jobs:
        j['id'] = 'h13' + j['id']
    return jobs


def hompair13(arg='40'):
    """Thirteenth: all 45 pairs, each creature with its own tap on a page.  arg: runs a pair."""
    import itertools
    jobs = hom_jobs(list(itertools.combinations(HOMS2, 2)), int(arg), seed='k', extra=T13)
    for j in jobs:
        j['id'] = 'h13' + j['id']
    return jobs


EXPERIMENTS['hom13'] = hom13
EXPERIMENTS['hompair13'] = hompair13


# --- the fourteenth measure, part 1: flatter chain bonuses (ruling AT) ------------------------------------------------------
# Each variant is the scoring rule only; the tasks are the game's (g1).  'now' reads path.js as it stands.
FLAT14 = {
    'old': {'chain_pow': 1.0, 'chain_knee': 0, 'motif_pow': 1.0},          # the rule of the thirteenth measure
    'p50': {'chain_pow': 0.5, 'chain_knee': 0, 'motif_pow': 1.0},
    'p25': {'chain_pow': 0.25, 'chain_knee': 0, 'motif_pow': 1.0},
    'p0': {'chain_pow': 0.0, 'chain_knee': 0, 'motif_pow': 1.0},
    'p50m': {'chain_pow': 0.5, 'chain_knee': 0, 'motif_pow': 0.5},
    'p25m': {'chain_pow': 0.25, 'chain_knee': 0, 'motif_pow': 0.5},
    'p0m': {'chain_pow': 0.0, 'chain_knee': 0, 'motif_pow': 0.5},
    'p0m0': {'chain_pow': 0.0, 'chain_knee': 0, 'motif_pow': 0.0},
    'now': {},
    'now_b': {},        # the same, for the first-game runs the career tables draw from
}


def flat14(arg='now,median,300'):
    """Fourteenth: every round of nine played, cleared or not, written out in full, under one scoring variant of FLAT14.
    arg: variant,player,runs[,seed letter[,length[,key=value;...]]]."""
    ps = arg.split(',')
    var, pl, n = ps[0], ps[1], int(ps[2])
    sd = ps[3] if len(ps) > 3 and ps[3] else 'g'
    ln = ps[4] if len(ps) > 4 and ps[4] else 'doctorate'
    par = dict(GENTLE['g1'])
    par.update(FLAT14[var])
    for x in ps[5:]:
        k, v = x.split('=', 1)
        par[k] = json.loads(v.replace(';', ','))
    return [{'id': 'fl_%s_%s_%s_%s_%d' % (var, pl, sd, ln, i), 'rack': START, 'length': ln, 'player': pl, 'params': par, 'full': True,
             'seeds': ['%s/%d' % (sd, i * 10 + k) for k in range(10)], 'tag': '%s/%s' % (var, pl)} for i in range(n // 10)]


EXPERIMENTS['flat14'] = flat14


# --- the fourteenth measure, part 2: the helpers as they are (ruling AT) ----------------------------------------------------
TOOLS14 = ('crystal', 'bunsen', 'burette', 'magnet', 'carousel', 'dropper', 'timer')      # sweep_tools.py; the mirror is not modelled


def help14(arg='none,median,200'):
    """Fourteenth: a nine-round run under the game's rule with a set of helpers held from round one, every round played and
    written out in full.  arg: set,player,runs[,seed letter[,length]].  set: none, or names joined by + (an instrument of
    sweep_tools.py, or hom:<creature>), or kNhM: N instruments and M creatures drawn at random for each ten runs."""
    import random as _r
    ps = arg.split(',')
    st, pl, n = ps[0], ps[1], int(ps[2])
    sd = ps[3] if len(ps) > 3 and ps[3] else 'p'
    ln = ps[4] if len(ps) > 4 and ps[4] else 'doctorate'
    jobs = []
    for i in range(n // 10):
        if re.match(r'k\d+h\d+$', st):
            rg = _r.Random('%s/%s/%d' % (st, sd, i))
            k, h = int(st[1:st.index('h')]), int(st[st.index('h') + 1:])
            mods = ['tool:' + t for t in rg.sample(TOOLS14, k)] + ['hom:' + x for x in rg.sample(HOMS2, h)]
        elif st == 'none':
            mods = []
        else:
            mods = [x if ':' in x else 'tool:' + x for x in st.split('+')]
        jobs.append({'id': 'hp_%s_%s_%s_%s_%d' % (st, pl, sd, ln, i), 'rack': START, 'length': ln, 'player': pl, 'mods': mods, 'params': dict(T13),
                     'full': True, 'seeds': ['%s/%d' % (sd, i * 10 + k) for k in range(10)], 'tag': '%s/%s' % (st, pl)})
    return jobs


EXPERIMENTS['help14'] = help14


# --- the fifteenth measure, item 1: helpers that help the task (the tally counter, the condenser) and the bench's limit ------
TOOLS15 = TOOLS14 + ('counter', 'condenser')


def help15(arg='none,median,200'):
    """Fifteenth: as help14, with the two task instruments in the draw and the bench's limit.
    arg: set,player,runs[,seed letter[,length[,cap]]].  set as help14 (kNhM draws from all nine modelled instruments).
    cap: instruments used on the molecule in one round at most (path.js RULE.bench); empty: the game's own."""
    import random as _r
    ps = arg.split(',')
    st, pl, n = ps[0], ps[1], int(ps[2])
    sd = ps[3] if len(ps) > 3 and ps[3] else 'p'
    ln = ps[4] if len(ps) > 4 and ps[4] else 'doctorate'
    cap = ps[5] if len(ps) > 5 and ps[5] else ''
    par = dict(T13)
    if cap == '':
        _b = re.search(r'RULE\.bench = (\d+)', SC._JS)
        cap = _b.group(1) if _b else '0'
    if int(cap) > 0:
        par['tool_cap'] = int(cap)
    jobs = []
    for i in range(n // 10):
        if re.match(r'k\d+h\d+$', st):
            rg = _r.Random('%s/%s/%d' % (st, sd, i))
            k, h = int(st[1:st.index('h')]), int(st[st.index('h') + 1:])
            mods = ['tool:' + t for t in rg.sample(TOOLS15, k)] + ['hom:' + x for x in rg.sample(HOMS2, h)]
        elif st == 'none':
            mods = []
        else:
            mods = [x if ':' in x else 'tool:' + x for x in st.split('+')]
        jobs.append({'id': 'h15_%s_%s_%s_%s_c%s_%d' % (st, pl, sd, ln, cap, i), 'rack': START, 'length': ln, 'player': pl, 'mods': mods, 'params': dict(par),
                     'full': True, 'seeds': ['%s/%d' % (sd, i * 10 + k) for k in range(10)], 'tag': '%s/%s/c%s' % (st, pl, cap)})
    return jobs


EXPERIMENTS['help15'] = help15


def hom15(arg='200'):
    """Fifteenth, item 2: creatures alone under the game's rule, nine rounds, every round played.  arg: runs,player,names;names
    (a name may carry a trial of its numbers: seedling@1.6/gain=12)."""
    ps = arg.split(',')
    n = int(ps[0])
    pl = ps[1] if len(ps) > 1 else 'median'
    sets = [tuple(x.split('+')) if x != 'none' else () for x in ps[2].split(';')] if len(ps) > 2 else [()] + [(h,) for h in HOMS2]
    jobs = hom_jobs(sets, n, player=pl, seed='k', extra=T13)
    for j in jobs:
        j['id'] = 'h15' + j['id']
    return jobs


EXPERIMENTS['hom15'] = hom15


# --- the sixteenth measure, item 1: the nine sigils alone, in pairs, in threes, and with each creature ---------------------------
SIG9 = ('phlogiston', 'clepsydra', 'via_humida', 'unbound', 'aqua_permanens', 'tetractys', 'respiratio', 'gemini', 'sulphurs_mask')


def sig16(arg='1,median,200'):
    """Sixteenth: nine-round runs under the game's rule with a set of sigils held from round one, every round played and written
    out in full, every set on the same deals.  arg: what,player,runs[,seed letter[,extra mods joined by +]].
    what: 0 none; 1 each alone; 2 the 36 pairs; 3 the 84 threes; 4 thirty sets of four; hom: each sigil with each creature;
    or sigil ids joined by + (one set).  extra mods: instruments (sweep_tools.py) or hom:<creature>, held as well."""
    ps = arg.split(',')
    what, pl, n = ps[0], ps[1], int(ps[2])
    sd = ps[3] if len(ps) > 3 and ps[3] else 'q'
    more = [x if ':' in x else 'tool:' + x for x in ps[4].split('+')] if len(ps) > 4 and ps[4] else []
    if what == '0':
        sets = [()]
    elif what in ('1', '2', '3'):
        sets = list(itertools.combinations(SIG9, int(what)))
    elif what == '4':
        sets = random.Random(16).sample(list(itertools.combinations(SIG9, 4)), 30)
    elif what == 'hom':
        sets = [(s, 'hom:' + h) for s in SIG9 for h in HOMS2] + [('hom:' + h,) for h in HOMS2]
    else:
        sets = [tuple(what.split('+'))]
    par = dict(T13)
    _b = re.search(r'RULE\.bench = (\d+)', SC._JS)
    if more and _b and int(_b.group(1)) > 0:
        par['tool_cap'] = int(_b.group(1))
    jobs = []
    for st in sets:
        mods = [x if ':' in x else 'sigil:' + x for x in st] + more
        name = '+'.join(st) or 'none'
        if more:
            name += '&' + '+'.join(m.split(':')[1] for m in more)
        for i in range(n // 10):
            j = {'id': 's16_%s_%s_%s_%d' % (name, pl, sd, i), 'rack': START, 'length': 'doctorate', 'player': pl, 'mods': mods,
                 'params': dict(par), 'full': True, 'seeds': ['%s/%d' % (sd, i * 10 + k) for k in range(10)], 'tag': '%s/%s' % (name, pl)}
            if pl == 'both':             # the casual and the careful player on the same deals, in one job (the proofs are shared)
                j['players'] = ['greedy', 'median']
            jobs.append(j)
    return jobs


EXPERIMENTS['sig16'] = sig16

# --- the sixteenth measure, item 2: the runs the deeds of the reference book are counted on (sweep_deeds.py) -----------------------
EARNED12 = ('epoxidation', 'hwe', 'permanganate', 'hydroborate', 'cyanohydrin', 'reduce', 'chlorination', 'hydroformylation', 'ozonolysis',
            'dihydroxylation', 'hofmann', 'chugaev')


def deed16(arg='none,300'):
    """Sixteenth, item 2: runs of the casual and the careful player with what the deeds read written out for every round.
    arg: pool,runs[,key=value;...].  pool: b (three rounds, a first game), none (nine rounds, nothing held), kit (nine rounds with the
    carousel, burette and seed crystal), plus (nine rounds, two of the twelve earned reagents on the rack as well, drawn for
    every ten runs).  Every round is played."""
    ps = arg.split(',')
    pool, n = ps[0], int(ps[1])
    par = dict(T13)
    for x in ps[2:]:
        k, v = x.split('=', 1)
        par[k] = json.loads(v.replace(';', ','))
    jobs = []
    for i in range(n // 10):
        rack, mods, ln = START, [], 'doctorate'
        if pool == 'b':
            ln = 'bachelor'
        elif pool == 'kit':
            mods = ['tool:carousel', 'tool:burette', 'tool:crystal']
            _b = re.search(r'RULE\.bench = (\d+)', SC._JS)
            if _b and int(_b.group(1)) > 0:
                par['tool_cap'] = int(_b.group(1))
        elif pool == 'plus':
            rack = START + random.Random('plus/%d' % i).sample(EARNED12, 2)
        jobs.append({'id': 'd16_%s_%d%s' % (pool, i, ''.join('_' + x for x in ps[2:])), 'rack': rack, 'length': ln, 'players': ['greedy', 'median'], 'mods': mods, 'params': dict(par),
                     'full': True, 'deeds': True, 'seeds': ['d%s/%d' % (pool, i * 10 + k) for k in range(10)], 'tag': '%s%s' % (pool, ''.join('/' + x for x in ps[2:]))})
    return jobs


EXPERIMENTS['deed16'] = deed16


# --- the sixteenth measure, item 3: N, S and Cl in rounds 4 to 9 (path.js RULE.elLate) ---------------------------------------------
# the chance, by round, that a dealt molecule is first one of the round's own that hold the element (chlorine, then sulfur, then nitrogen)
EL16 = {4: {'Cl': 0.29, 'S': 0.08, 'N': 0.17}, 5: {'Cl': 0.31, 'S': 0.10, 'N': 0.02}, 6: {'Cl': 0.26, 'S': 0.09, 'N': 0.14},
        7: {'Cl': 0.23, 'S': 0.11, 'N': 0.05}, 8: {'Cl': 0.10, 'S': 0.08}, 9: {'Cl': 0.07, 'S': 0.04, 'N': 0.08}}
FLAT14['el16'] = {'el_late': {str(k): v for k, v in EL16.items()}}       # flat14 el16,<player>,<runs>,g,doctorate: the pools the pass marks are fitted on
assert SC.EL_LATE is None or EL16 == SC.EL_LATE, 'EL16 and path.js RULE.elLate differ'
# the marks fitted on those pools (sweep_career.py fit el16 ...), for the runs that check them on other deals (final13 ...,ver=16)
MARKS16 = {'master': [0.36, 0.53, 0.39, 0.65, 1.16, 1.09], 'doctorate': [0.36, 0.53, 0.39, 0.65, 0.83, 0.70, 1.48, 2.04, 2.18]}


def final16(arg='median,2000'):
    """Sixteenth, item 3: a nine-round run with nothing unlocked under RULE.elLate and the refitted marks, stopped at the first
    round not cleared, on deals the marks were not fitted on.  arg: player,runs[,length]."""
    ps = arg.split(',')
    pl, n = ps[0], int(ps[1])
    ln = ps[2] if len(ps) > 2 else 'doctorate'
    par = dict(T13, el_late=FLAT14['el16']['el_late'])
    if MARKS16:
        par['need_par'] = MARKS16
    return [{'id': 'f16_%s_%s_%d' % (ln, pl, i), 'rack': START, 'length': ln, 'player': pl, 'stop': True, 'params': par, 'full': True,
             'seeds': ['w/%d' % (i * 10 + k) for k in range(10)], 'tag': '%s/%s/ver=16' % (ln, pl)} for i in range(n // 10)]


EXPERIMENTS['final16'] = final16


# --- the seventeenth measure: the same sets on the new deal (RULE.elLate on, read from path.js), kept apart in _sweep/sig17 ---
EXPERIMENTS['sig17'] = sig16


def _s17(arg, prefix, length='doctorate', strong='only'):
    """sig16's jobs with the stronger forms of path.js RULE.sigilStrong in place of the plain sigils (sweep_sig17.STRONG).
    strong: 'only' the sets that hold such a sigil, 'not' the others, 'all' every set."""
    import sweep_sig17 as S17
    out = []
    for j in sig16(arg):
        has = any(m.split(':')[1] in S17.STRONG for m in j['mods'] if m.startswith('sigil:'))
        if (strong == 'only' and not has) or (strong == 'not' and has):
            continue
        j['mods'] = ['sig17:' + S17.STRONG[m.split(':')[1]] if (m.startswith('sigil:') and m.split(':')[1] in S17.STRONG) else m for m in j['mods']]
        j['id'] = prefix + j['id']
        j['length'] = length
        if os.environ.get('SWEEP_P'):          # further rule numbers for a trial, as JSON (the experiment sig17p)
            j['params'].update(json.loads(os.environ['SWEEP_P']))
        out.append(j)
    return out


EXPERIMENTS['sig17s'] = lambda arg='1,both,200': _s17(arg, 's_')                     # nine rounds, the sets that hold a stronger form
EXPERIMENTS['sig17n'] = lambda arg='2,both,60': _s17(arg, 'n_', strong='not')        # the other sets; run with experiment name sig17 (see RIG.md seventeenth)
EXPERIMENTS['sig17m'] = lambda arg='1,both,100': _s17(arg, 'm_', 'master', 'all')    # the six-round run
EXPERIMENTS['sig17k'] = lambda arg='0,both,100,q,carousel+burette+crystal': _s17(arg, 'k_', strong='all')   # with the kit of three instruments held
EXPERIMENTS['deed17'] = deed16                                                       # the deeds' pools on the new deal (sweep_deeds.py, SWEEP_DEEDS=deed17)
EXPERIMENTS['sig17q'] = lambda arg: _s17(arg, 'q_', strong='all')                    # the second trial of the same (SWEEP_P ammonia_limits 2)
EXPERIMENTS['sig17p'] = lambda arg: _s17(arg, 'p_', strong='all')                    # a trial with SWEEP_P set (Ammonia's second firing keeps the limits)


def hom17(arg='now,median,100'):
    """Seventeenth: each creature alone at a stage of its growth (path.js RULE.homGrow, sweep_homs.Hom STAGE / GROW), nine rounds, every
    round played, on sig17's deals.  arg: mode,player,runs.  mode: now (as it was), s1..s5 (a fixed stage), run (grows in the run),
    cap2..cap4 (grows in the run up to that stage)."""
    mode, pl, n = arg.split(',')
    opt = {'now': '', 'run': '/GROW=1'}.get(mode) if mode in ('now', 'run') else ('/STAGE=' + mode[1:] if mode[0] == 's' else '/GROW=1/CAP=' + mode[3:])
    which = HOMS2
    if mode[0] == 'm':                    # "simplify the creatures": m<1..3>[k<number>] for hydrogen, wood spirit and brimstone; m2k1.8:h2 for one of them
        mode, _, one = mode.partition(':')
        which = (one,) if one else ('h2', 'wood', 'brimstone')
        opt = '/MODE=' + mode[1] + ('/KS=' + mode[3:] if len(mode) > 2 else '')
    jobs = []
    for h in which:
        for i in range(int(n) // 10):
            jobs.append({'id': 'h17_%s_%s_%s_%d' % (h, mode, pl, i), 'rack': START, 'length': 'doctorate', 'player': pl, 'mods': ['hom:' + h + opt], 'params': dict(T13),
                         'full': True, 'seeds': ['q/%d' % (i * 10 + k) for k in range(10)], 'tag': 'hom:%s@%s/%s' % (h, mode, pl)})
    return jobs


EXPERIMENTS['hom17'] = hom17


def hom18(arg='median,100,,water@2.25'):
    """Eighteenth: a creature with numbers of its own, nine rounds, every round played, on sig17's deals (seed letter q).
    arg: player,runs,extra mods joined by + (instruments, sigil:<id>),spec;spec;...  A spec is a creature as sweep_homs.make reads
    it with ~ for / ('h2~MODE=1~KS=2.25'), or 'none'.  player 'both': the casual and the careful player on the same deals.
    SWEEP_SEED=<letter> plays other deals than sig17's (the set's name then ends '#<letter>'; play 'none' on them too)."""
    pl, n, more, specs = arg.split(',', 3)
    sd = os.environ.get('SWEEP_SEED', 'q')
    more = [x if ':' in x else 'tool:' + x for x in more.split('+')] if more else []
    par = dict(T13)
    _b = re.search(r'RULE\.bench = (\d+)', SC._JS)
    if any(m.startswith('tool:') for m in more) and _b and int(_b.group(1)) > 0:
        par['tool_cap'] = int(_b.group(1))
    jobs = []
    for sp in specs.split(';'):
        mods = ([] if sp == 'none' else ['hom:' + sp.replace('~', '/')]) + more
        name = sp + ('&' + '+'.join(m.split(':')[1] for m in more) if more else '') + ('' if sd == 'q' else '#' + sd)
        for i in range(int(n) // 10):
            j = {'id': 'h18_%s_%s_%d' % (name, pl, i), 'rack': START, 'length': 'doctorate', 'player': pl, 'mods': mods, 'params': dict(par),
                 'full': True, 'seeds': ['%s/%d' % (sd, i * 10 + k) for k in range(10)], 'tag': '%s|%s' % (name, pl)}
            if pl == 'both':
                j['players'] = ['greedy', 'median']
            jobs.append(j)
    return jobs


EXPERIMENTS['hom18'] = hom18
