"""The nine sigils in the game against the simulator, whole turns (fourteenth measure).

    python sweep_sigcheck.py make [n]      n turns for each sigil, with and without it, played here: writes .claude/headless/sig14_in.json
    (the game plays them: bash .claude/headless/hlow.sh sig14.js sig14 600)
    python sweep_sigcheck.py compare       the game's answers (.claude/headless/out/sig14.json) against the simulator's
    python sweep_sigcheck.py demo          for each sigil, a short molecule and a line of three where it changes what happens

A turn: a molecule of the round's deal, a line of three reagents of the starting six (four with Tetractys), the ten reflexes of a
new game, no across reflexes (the whole-turn check knows no fold, as jobs/parity_game.js).  Clepsydra is checked on its
fourth page: three pages are fired first and the turn compared is the fourth.
"""
import json
import os
import random
import sys

from rdkit import Chem

import sweep_core as SC
import sigil2_rules as SG

HL = os.path.join(SC.ROOT, '.claude', 'headless')
NINE = ('phlogiston', 'clepsydra', 'via_humida', 'solve', 'aqua_permanens', 'tetractys', 'respiratio', 'gemini', 'sulphurs_mask')
SIM_ID = {'solve': 'unbound'}            # the simulator's class id where it differs
PAR = {'far_from': 99}


def kek(smi):
    return Chem.MolToSmiles(Chem.MolFromSmiles(smi), kekuleSmiles=True)


def can(s):
    m = Chem.MolFromSmiles(s) if s else None
    return Chem.MolToSmiles(m) if m is not None else s


def game(sig):
    return SC.Game(key='sc_' + (sig or 'none'), mods=[SG.make(SIM_ID.get(sig, sig))] if sig else [], params=dict(PAR), cache=SC.MemStore())


def play(G, smi, rnd, lines):
    """Fire the lines, one a page; returns the record of the last page."""
    R = G.begin(smi, rnd, SC.START_SIX, 'plain', None, tierNo=2)
    out = None
    for i, line in enumerate(lines):
        if i:
            G.turn(R)
        R, page = G.run_line(R, tuple(line))
        R.rec = R.rec + [G.page_rec(page)]
        out = {'after': page['smi'], 'steps': list(page['chain']), 'fired': [[c[0], c[1]] for c in page['circ']], 'total': SC.made(R)}
    return out


def make(n=200):
    cases = []
    for sig in NINE:
        G1, G0 = game(sig), game(None)
        rng = random.Random('sig14/' + sig)
        k = 0
        while k < n:
            rnd = rng.randint(1, 9)
            smi = SC.deal_two(rnd, rng)[0]
            nl = 4 if sig == 'tetractys' else 3
            lines = [[rng.choice(SC.START_SIX) for _ in range(nl)] for _ in range(4 if sig == 'clepsydra' else 1)]
            try:
                w = play(G1, smi, rnd, lines)
                wo = play(G0, smi, rnd, lines[:3] if sig == 'clepsydra' else ([lines[0][:3]] if sig == 'tetractys' else lines))
            except Exception as e:
                continue
            cases.append({'sig': sig, 'rnd': rnd, 'before': smi, 'kek': kek(smi), 'lines': lines, 'with': w, 'without': wo,
                          'differs': (can(w['after']) != can(wo['after'])) or w['steps'] != wo['steps'] or w['total'] != wo['total']})
            k += 1
    json.dump({'cases': cases}, open(os.path.join(HL, 'sig14_in.json'), 'w'))
    for sig in NINE:
        cs = [c for c in cases if c['sig'] == sig]
        print('%-15s %d turns, the sigil changes the turn in %d' % (sig, len(cs), sum(c['differs'] for c in cs)))


def compare():
    cases = json.load(open(os.path.join(HL, 'sig14_in.json')))['cases']
    base = 'base' in sys.argv                # the same turns with the sigil off, against the simulator with none: the agreement to expect
    out = json.load(open(os.path.join(HL, 'out', 'sig14off.json' if base else 'sig14.json')))
    res = (out.get('result') or out)['turn']
    print('| Sigil | Turns | Same molecule after | Same reflexes in the same order | Same places for each reagent | Same yield | Turns the sigil changed (simulator) | Of those, same molecule | Steps the game flagged |')
    print('|---|---|---|---|---|---|---|---|---|')
    bad = {}
    for sig in NINE:
        n = mol = st = fr = yd = dif = difok = flag = 0
        for c, g in zip(cases, res):
            if c['sig'] != sig:
                continue
            n += 1
            if 'err' in g:
                bad.setdefault(sig, []).append(('err', g['err'][:80]))
                continue
            w = c['without'] if base else c['with']
            if base and c['sig'] in ('clepsydra', 'tetractys'):
                continue
            m_ok = can(g['after']) == can(w['after'])
            mol += m_ok
            st += g['steps'] == w['steps']
            fr += [x[1] for x in g['fired']] == [x[1] for x in w['fired']]
            yd += abs(g['total'] - w['total']) <= 1
            flag += g.get('flags', 0)
            if c['differs']:
                dif += 1
                difok += m_ok
            if not m_ok and len(bad.setdefault(sig, [])) < 3:
                bad[sig].append((c['before'], c['lines'], w['steps'], g['steps']))
        print('| %s | %d | %d | %d | %d | %d | %d | %d | %d |' % (sig, n, mol, st, fr, yd, dif, difok, flag))
    if '-v' in sys.argv:
        for k, v in bad.items():
            for b in v:
                print(k, b)


def demo():
    cases = json.load(open(os.path.join(HL, 'sig14_in.json')))['cases']
    out = None
    fp = os.path.join(HL, 'out', 'sig14.json')
    if os.path.exists(fp):
        o = json.load(open(fp))
        out = (o.get('result') or o)['turn']
    for sig in NINE:
        best = None
        for i, c in enumerate(cases):
            if c['sig'] != sig or not c['differs']:
                continue
            if out is not None and ('err' in out[i] or can(out[i]['after']) != can(c['with']['after']) or out[i]['steps'] != c['with']['steps']):
                continue                       # only a case the game plays as the simulator does
            gain = len(c['with']['steps']) - len(c['without']['steps'])
            key = (-(1 if c['rnd'] <= 4 else 0), -abs(gain) if sig != 'gemini' else 0, len(c['before']))
            if best is None or key < best[0]:
                best = (key, c)
        if not best:
            print(sig, 'no case')
            continue
        c = best[1]
        print('| %s | `%s` | %s | %s, yield %d | %s, yield %d |' % (sig, c['before'], '; '.join(', '.join(l) for l in c['lines']), ', '.join(c['without']['steps']) or 'no reflex', c['without']['total'],
                                                                 ', '.join(c['with']['steps']) or 'no reflex', c['with']['total']))


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'make'
    if cmd == 'make':
        make(int(sys.argv[2]) if len(sys.argv) > 2 else 200)
    elif cmd == 'compare':
        compare()
    else:
        demo()
