"""sweep_exps.py: the experiment grids of docs/SWEEP.md.  Each function returns the list of jobs for sweep_run.run.

  python sweep_run.py list
  python sweep_run.py a_six            every starting six of the 18 reagents (18,564), rounds 1 to 3
  python sweep_exps.py all             every experiment in order (resumable)
"""
import itertools
import json
import os
import random
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
