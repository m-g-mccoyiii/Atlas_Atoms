"""sweep_validate.py: the simulator against the game.

  python sweep_validate.py turns      the parity cases of .claude/headless (made by docs/tools_parity.py, played by the game in headless
                                      Edge: jobs/parity.js for reagents and settles, jobs/parity_game.js for whole turns on the game's own round)
  python sweep_validate.py rig        the clear rates and yields of docs/RIG.md (tenth measure) against the same cells played here

Nothing is run in a browser here: the game's answers are the JSON files the rig already wrote.
"""
import json
import os
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from rdkit import Chem
import sweep_core as SC
import library as L

HL = os.path.join(SC.ROOT, '.claude', 'headless')
ID = {'pcc': 'oxidize', 'allyl': 'grow', 'bh3': 'hydroborate', 'nabh4': 'reduce'}


def can(s):
    m = Chem.MolFromSmiles(s)
    return Chem.MolToSmiles(m) if m is not None else s


def first(*names):
    for n in names:
        fp = os.path.join(HL, 'out', n)
        if os.path.exists(fp):
            d = json.load(open(fp))
            if d.get('ok') and d.get('result'):
                return d['result'], n
    return None, None


def turns(verbose=False):
    cases = json.load(open(os.path.join(HL, 'parity_in.json')))
    G = SC.Game(key='parity')
    G.near = tuple(L.SELF_ORDER)          # the parity cases hold all thirteen reflexes, no fold
    G.far = ()
    G.p['co2'] = True
    G.p['finish'] = False
    out = {}
    # 1. whole turns on the game's own round (parity_game.js)
    game, src = first('pg10.json', 'rvbpg1.json', 'rvpg.json')
    exact = steps_same = end_same = fired_same = n = kinds_ok = 0
    diffs = []
    for c, g in zip(cases['turn'], game['turn']):
        if 'err' in g:
            continue
        n += 1
        R = G.begin(c['before'], 1, c['line'], tierNo=2)
        R.left = None
        R2, page = G.run_line(R, tuple(c['line']))
        my_steps = list(page['chain'])
        my_fired = [[a, b] for a, b, _ in page['circ']]
        g_fired = [[ID.get(a, a), b] for a, b in g['fired']]
        a_ok = can(g['after']) == can(R2.smi)
        r_ok = can(g['reopened']) == can(G.reopen(R2.smi))
        s_ok = my_steps == g['steps']
        f_ok = my_fired == g_fired
        steps_same += s_ok
        end_same += r_ok
        fired_same += f_ok
        kinds_ok += Counter(my_steps) == Counter(g['steps'])
        if a_ok and r_ok and s_ok and f_ok:
            exact += 1
        else:
            diffs.append((c['before'], c['line'], my_steps, g['steps'], my_fired, g_fired))
    out['turns'] = {'file': src, 'n': n, 'exact': exact, 'same_steps_in_order': steps_same, 'same_step_kinds_counted': kinds_ok,
                    'same_places': fired_same, 'same_molecule_after_reopen': end_same}
    # 2. one reagent on one molecule, and a molecule settled to the end (parity.js, the engine functions of the game)
    game2, src2 = first('par11.json', 'rvpar.json', 'par2.json', 'par1.json')
    if game2:
        ok = m = 0
        eng = G.eng(True)
        for c, g in zip(cases['reagent'], game2.get('reagent', [])):
            if 'err' in g:
                continue
            m += 1
            f = eng.fire(can(c['before']), c['reagent'])
            ok += (can(g['after']) == can(f.smi)) and (g['n'] == f.n)
        out['reagents'] = {'file': src2, 'n': m, 'exact': ok}
        ok = m = 0
        for c, g in zip(cases['settle'], game2.get('settle', [])):
            if 'err' in g:
                continue
            m += 1
            st = G.cascade(can(c['before']), (), tuple(c['held']), True)
            end = st[-1][1] if st else can(c['before'])
            ok += (can(g['after']) == can(end)) and ([s[0] for s in st] == g['steps'])
        out['settles'] = {'file': src2, 'n': m, 'exact': ok}
    print(json.dumps(out, indent=1))
    if verbose:
        for d in diffs[:10]:
            print(d)
    os.makedirs(SC.SWEEP_DIR, exist_ok=True)
    json.dump(out, open(os.path.join(SC.SWEEP_DIR, 'validate_turns.json'), 'w'), indent=1)
    return out


def rig(n=300, workers=int(os.environ.get('SWEEP_WORKERS', '12'))):
    """The cells of RIG.md's tenth measure played here: bachelor's 300 runs a player, the bare nine rounds 120 runs a player.
    The tenth measure was made before RULE.hetCurve was switched on, so these cells deal without it (het False)."""
    import sweep_run as SR
    jobs = []
    for pl in ('novice', 'greedy', 'median', 'planner'):
        for i in range(n // 10 if pl != 'planner' else 3):
            jobs.append({'id': 'bach_%s_%d' % (pl, i), 'length': 'bachelor', 'rack': list(SC.START_SIX), 'player': pl,
                         'params': {'het': False}, 'seeds': list(range(1001 + i * 10, 1011 + i * 10)), 'tag': 'bach'})
        for i in range(int(os.environ.get('SWEEP_NINE', '12')) if pl != 'planner' else 0):
            jobs.append({'id': 'nine_%s_%d' % (pl, i), 'length': 'doctorate', 'rack': list(SC.START_SIX), 'player': pl,
                         'params': {'co2': False, 'het': False}, 'seeds': list(range(5001 + i * 10, 5011 + i * 10)), 'tag': 'nine'})
    st = SR.run('validate_rig', jobs, workers)
    rows = SR.rows_of('validate_rig')
    res = {}
    for tag, nr in (('bach', 3), ('nine', 9)):
        for pl in ('novice', 'greedy', 'median', 'planner'):
            rs = [r for r in rows if r.get('tag') == tag and r.get('player') == pl and 'error' not in r]
            if not rs:
                continue
            N = sum(r['n'] for r in rs)
            res['%s %s' % (tag, pl)] = {'runs': N, 'won_pct': round(100.0 * sum(r['won'] for r in rs) / N, 1),
                                        'clear_pct': [round(100.0 * sum(r['met'][i] for r in rs) / N) for i in range(nr)],
                                        'exp_mean_log_total': [round(2.718281828 ** (sum(r['logtot'][i] * r['n'] for r in rs) / N)) for i in range(nr)],
                                        'kinds_per_run': round(sum(r['kinds_run'] * r['n'] for r in rs) / N, 2)}
    print(json.dumps(res, indent=1))
    print(json.dumps(st))
    json.dump(res, open(os.path.join(SC.SWEEP_DIR, 'validate_rig.json'), 'w'), indent=1)
    return res


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'turns'
    if cmd == 'turns':
        turns('-v' in sys.argv)
    else:
        rig(int(sys.argv[2]) if len(sys.argv) > 2 else 300)
