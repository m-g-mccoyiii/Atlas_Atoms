"""Tests of hurdles.py (the specs): the structural readings on molecules whose answers are known, the event readings on made-up logs,
the plain-words rules, the players, the pools, the search and the generator.   python test_hurdles.py"""
import random
import sys

import engine as E
import hurdle_gen as G
import hurdle_study as S
import hurdles as H
import library
from chemlib import canon

F = lambda s: H.feat(canon(s))

BANNED = ['sets off', 'set off', 'driven off', 'steps by itself', 'self-reaction', 'bridgehead', 'spiro', 'joined block', 'hurdle',
          'cascade', 'zip']


def test_rings_and_sharing():
    d = F('C1CCC2CCCCC2C1')                       # decalin
    assert (d['rings'], d['ring6'], d['fused_pairs'], d['fused_block'], d['ring_systems']) == (2, 2, 1, 2, 1), d
    s = F('C1CCC2(C1)CCCC2')                      # spiro[4.4]nonane
    assert (s['rings'], s['ring5'], s['spiro'], s['fused_pairs'], s['ring_systems']) == (2, 2, 1, 0, 1), s
    n = F('C1CC2CCC1C2')                          # norbornane
    assert (n['rings'], n['bridgehead']) == (2, 2), n
    t = F('C1CCCC1CCC1CCCC1')                     # two separate rings
    assert (t['rings'], t['ring_systems'], t['fused_pairs']) == (2, 2, 0), t
    assert F('C1CCC1')['ring_small'] == 1 and F('C1CCCCCCC1')['ring_big'] == 1
    assert F('c1ccccc1')['aromatic'] == 1 and F('c1ccccc1')['dbl'] == 3 and F('c1ccccc1')['unsat'] == 4
    o = F('C1CCOC1')
    assert o['ring_hetero'] == 1 and o['ring_oxygen'] == 1 and o['ring_mixed'] == 0
    assert F('C1CCNC1')['ring_oxygen'] == 0 and F('C1CCNC1')['ring_hetero'] == 1
    assert F('C1CCOC1')['ring_atoms'] == 5 and F('C1CCCC1CCC1CCCC1')['ring_sizes'] == 1


def test_chain_branch_symmetry():
    assert F('CCCC1CC1')['chain'] == 3
    assert F('CCCCCCCC')['chain'] == 8 and F('CCCCCCCC')['diameter'] == 7
    assert F('CC(C)(C)C')['branch'] == 1
    assert F('CCC')['mirror'] == 1
    assert F('CC(O)CC')['stereo'] == 1
    assert F('C=CC=CC=O')['conj'] == 6
    k = F('OCC=CC(=O)O')
    assert k['groups']['OH'] == 1 and k['groups']['C=C'] == 1 and k['groups']['COOH'] == 1 and k['kinds'] == 3, k
    assert F('CC(=O)OC')['groups']['ester'] == 1 and F('CC(=O)OC')['groups']['C=O'] == 0
    assert F('CSSC')['groups']['S-S'] == 1 and F('CS')['groups']['SH'] == 1 and F('CN')['groups']['NH2'] == 1


def mk(chain, line=('a', 'b', 'c'), fired=None, off=None, set_off=(0, 0, 0), end='C'):
    return {'line': line, 'chain': tuple(chain), 'fired': fired or tuple((n, 1) for n in line), 'off': off or {},
            'set_off': set_off, 'smi_end': end}


def test_event_readings():
    H_ = H.SPECS
    lg = H.Log('C', [mk(['ring', 'dry', 'tuck', 'ring']), mk(['ring', 'ring', 'ring']), mk([])], ('a', 'b', 'c', 'd', 'e', 'f'))
    assert H_['kind_ring'].fn(lg) == 5 and H_['opening_burst'].fn(lg) == 4
    assert H_['through_ring'].fn(lg) == 3                     # after the first ring of the first turn: dry, tuck, ring
    assert H_['through_dry'].fn(lg) == 2
    assert H_['quiet_then_loud'].fn(lg) == 0                  # turn 1 was not quiet
    assert H_['unused_reagents'].fn(lg) == 3 and H_['held_back'].fn(lg) == 0
    lg2 = H.Log('C', [mk(['ring'], set_off=(1, 0, 0), off={'water': 2, 'hydrogen': 1}), mk(['ring', 'dry'], set_off=(1, 1, 0)),
                      mk(['ring'] * 5, set_off=(2, 2, 1), off={'water': 1})], ('a', 'b', 'c', 'd'))
    assert H_['off_total'].fn(lg2) == 4 and H_['off_water'].fn(lg2) == 3 and H_['many_jars'].fn(lg2) == 2
    assert H_['big_puff'].fn(lg2) == 3 and H_['opener'].fn(lg2) == 2 and H_['closer'].fn(lg2) == 1
    assert H_['distinct_triggers'].fn(lg2) == 3 and H_['unused_reagents'].fn(lg2) == 1
    assert H_['quiet_then_loud'].fn(lg2) == 0 and H_['pure_water'].fn(lg2) == 2 and H_['pure_gas'].fn(lg2) == 0
    lg4 = H.Log('C', [mk(['ring']), mk([]), mk(['ring'] * 5)])
    assert H_['quiet_then_loud'].fn(lg4) == 5 and H_['quiet_then_loud'].fn(H.Log('C', lg4.turns[:2])) == 0
    lg3 = H.Log('C', [mk(['ring'], off={'hydrogen': 4, 'water': 1}), mk([]), mk(['ring', 'ring'])], ('a',))
    assert H_['pure_gas'].fn(lg3) == 3 and H_['pure_water'].fn(lg3) == 0
    short = H.Log('C', [mk([], line=('a', 'b')), mk([], line=('a', 'b', 'c')), mk([], line=('a',))], ('a', 'b', 'c'))
    assert H_['held_back'].fn(short) == 2
    clean = H.Log('C', [mk([], fired=(('a', 1), ('b', 2), ('c', 1))), mk([], fired=(('a', 1), ('b', 0), ('c', 1))), mk([])])
    assert H_['clean_turns'].fn(clean) == 2
    for h in H_.values():
        assert isinstance(h.fn(H.Log('C', [])), (int, float)), h.name


def test_structural_modes_and_the_start_offset():
    cage = canon('C=CCCC(=O)CCC(O)C12CC3CC(CC(C3)C1)C2')
    f0 = H.feat(cage)
    assert f0['bridgehead'] >= 4
    lg = H.Log(cage, [mk([], end=cage)])
    assert H.SPECS['bridgehead'].fn(lg) == 0 and H.SPECS['rings'].fn(lg) == 0     # the start does not count
    big = canon('C1CCC2CCCCC2C1')
    lg = H.Log('CCCCCCCCCC', [mk([], end='C' * 8), mk([], end=big)])
    assert H.SPECS['rings'].fn(lg) == 2 and H.SPECS['cut_down'].fn(lg) == 2 and H.SPECS['growth'].fn(lg) == 0
    assert H.SPECS['size_range'].fn(lg) == 2 and H.SPECS['finish_smaller'].fn(lg) == 0     # it ended at ten atoms again
    assert H.SPECS['lean_turns'].fn(lg) == 1
    # the finish is what counts for the keep specs: a C=O made in turn 1 and used up by turn 2 does not count
    a, b, c = canon('CCCCC=O'), canon('CCCCC(C)O'), canon('CCCCCC')
    lg = H.Log(c, [mk([], end=a), mk([], end=c)])
    assert H.SPECS['end_CO'].fn(lg) == 0
    lg = H.Log(c, [mk([], end=c), mk([], end=a)])
    assert H.SPECS['end_CO'].fn(lg) == 1
    # no spec can be cleared on page zero: a round with no turn reads 0 for all of them
    for n, h in H.SPECS.items():
        assert h.fn(H.Log(cage, [])) == 0, n


def test_plain_words_and_marks():
    assert len(H.SPECS) >= 55
    marks = {}
    for n, h in H.SPECS.items():
        t = h.text.format(N='N')
        w = t.split()
        assert h.text.startswith('at least {N}'), (n, h.text)
        assert len(w) <= 8, (n, len(w), t)
        for b in BANNED:
            assert b not in t.lower(), (n, b)
        assert h.mark and h.icon and h.how and h.family and h.plan, n
        assert h.condition(3).count('3') == 1
        if h.live:
            marks.setdefault(h.mark, []).append(n)
    assert all(len(v) == 1 for v in marks.values()), {k: v for k, v in marks.items() if len(v) > 1}


def test_new_player_looks_at_nothing_ahead():
    smi = canon('C=CCCC(=O)CCC(=O)CCCC=O')
    carried = library.SIX
    eng = E.Engine()
    H.SPECS['rings'].fn  # noqa
    rr = eng.play_round(smi, carried, library.SELF_TIER1, H.make_player('new', [(H.SPECS['rings'], 2)]), 'n1', analyse=False)
    played_new = len(eng._line)
    eng2 = E.Engine()
    eng2.play_round(smi, carried, library.SELF_TIER1, H.make_player('aim', [(H.SPECS['rings'], 2)]), 'n1', analyse=False)
    # the aiming player plays out every line of the hand (up to 125) each turn; the new player plays out only what it fires
    assert played_new <= 3 * 3 + 6, played_new
    assert len(eng2._line) > 100, len(eng2._line)
    assert all(len(t['line']) == 3 for t in rr['turns'])


def test_players_and_a_round():
    eng = E.Engine()
    smi = 'C=CCCC(=O)CCC(=O)CCCC=O'
    for name in ('growth', 'off_total', 'rings'):
        h = H.SPECS[name]
        sk = [h.check(smi, eng.play_round(smi, library.SIX, library.SELF_TIER1, H.SeekPlayer(h), 's%d' % i, analyse=False))
              for i in range(8)]
        pt = [h.check(smi, eng.play_round(smi, library.SIX, library.SELF_TIER1, E.PLAYERS['greedy'], 's%d' % i, analyse=False))
              for i in range(8)]
        assert sum(sk) >= sum(pt) * 0.8, (name, sk, pt)
    # the held-back spec lets the players fire fewer than three, and only that spec does
    hb = H.SPECS['held_back']
    rr = eng.play_round(smi, library.SIX, library.SELF_TIER1, H.AimPlayer([(hb, 2)]), 'h1', analyse=False)
    assert hb.check(smi, rr) >= 2
    rr = eng.play_round(smi, library.SIX, library.SELF_TIER1, H.AimPlayer([(H.SPECS['rings'], 2)]), 'h1', analyse=False)
    assert all(len(t['line']) == 3 for t in rr['turns'])
    # the mix plays each turn as one of its two players and keeps one record of the round
    mix = H.make_player('middling', [(H.SPECS['rings'], 2)])
    rr = eng.play_round(smi, library.SIX, library.SELF_TIER1, mix, 'm1', analyse=False)
    assert len(mix.done) == 3 and len(rr['turns']) == 3
    assert H.SPECS['rings'].check(smi, rr) == H.SPECS['rings'].fn(H.Log(canon(smi), mix.done, rr['carried']))


def test_pools_and_carried():
    for pool in ('fit', 'heldout'):
        for r in (1, 5, 9):
            assert S.pool_game(pool, r) or S.pool_gen(pool, r)
    for r in (1, 2, 5, 9):
        a = {m for ms in S.pool_gen('fit', r).values() for m in ms} | {k for k, _ in S.pool_game('fit', r)}
        b = {m for ms in S.pool_gen('heldout', r).values() for m in ms} | {k for k, _ in S.pool_game('heldout', r)}
        assert a and b and not (a & b), (r, len(a), len(b))
    for j in range(20):
        c = H.run_carried('t/%d' % j)
        assert all(c[r] == library.SIX for r in (1, 2, 3))
        assert len(c[4]) == 7 and c[4][:6] == library.SIX and len(c[6]) == 8 and set(c[4]) <= set(c[5]) <= set(c[6])
        assert all(len(c[r]) == 8 for r in (6, 7, 8, 9))
        assert all(x in library.REACTIONS for r in c for x in c[r])


def test_growth_is_capped():
    g = H.SPECS['growth']
    for atoms in (10, 11, 20, 31, 35, 37):
        cap = g.cap({'atoms': atoms}, 1)
        assert cap <= atoms and atoms + cap <= E.MAX_HEAVY and cap >= 1, (atoms, cap)
    assert H.SPECS['cut_down'].cap({'atoms': 11}, 1) == 5


def test_reach_search():
    eng = E.Engine()
    smi = 'C=CCCC(=O)CCC(=O)CCCC=O'
    ok = G.reach_search(eng, smi, library.SIX, library.SELF_TIER1, [(H.SPECS['off_total'], 3)])
    assert ok is not None and len(ok) <= 3
    assert G.reach_search(eng, smi, library.SIX, library.SELF_TIER1, [(H.SPECS['rings'], 25)]) is None


def _row(options, usable, ref=None):
    return {'options': [{'N': n, 'model_rate': r, 'rates': {'Y': 0.3}} for n, r in options], 'usable': usable, 'ref': ref or usable[0]}


def test_generator():
    tb = {'_meta': {}, 'specs': {
        'off_total': {'family': 'runoff', 'plan': 'vent', 'kept': True, 'good_rounds': [1, 2, 3, 6],
                      'rounds': {str(r): _row([(2, .8), (3, .7), (4, .5)], [2, 3]) for r in (1, 2, 3, 6)}},
        'growth': {'family': 'size', 'plan': 'big', 'kept': True, 'good_rounds': [1, 2, 3, 6],
                   'rounds': {str(r): _row([(3, .8), (5, .7)], [3, 5]) for r in (1, 2, 3, 6)}},
        'opener': {'family': 'chain', 'plan': 'chains', 'kept': True, 'good_rounds': [6],
                   'rounds': {'6': _row([(1, .9)], [1])}}}, 'riders': {}}
    G.set_table(tb)
    smi = 'C=CCCC(=O)CCC(=O)CCCC=O'
    rng = random.Random(3)
    pk = G.pick_spec(smi, 1, library.SIX, rng, tier=3, k=4, kp=3)
    assert pk.aims and pk.aims[0][1] >= 1 and pk.witness is not None, pk
    pk2 = G.pick_spec(smi, 2, library.SIX, rng, tier=3, history=[pk], k=4, kp=3)
    assert pk2.families != pk.families or pk2.fell_back, (pk, pk2)
    pk6 = G.pick_spec(smi, 6, library.SIX, rng, tier=3, history=[pk2], k=4, kp=3)
    assert len(pk6.aims) == 2 or pk6.fell_back, pk6
    assert len({h.family for h, _ in pk6.aims}) == len(pk6.aims)
    G.set_table({'specs': {}, '_meta': {}})
    pk3 = G.pick_spec(smi, 1, library.SIX, rng, k=4, kp=3)
    assert pk3.fell_back and pk3.aims
    G.set_table(None)


def test_study_sorting():
    # a fake round of rows: a spec the aiming player clears and the yield-only player does not
    rows = []
    rng = random.Random(1)
    for i in range(120):
        w = rng.choice([0, 1, 1, 2, 3])
        rows.append({'atoms': 12, 'ypay': 100.0, 'Y': {'rings': rng.choice([0, 0, 0, 1])}, 'R': {'rings': 0},
                     'vals': {'rings': {'S': 4 + rng.choice([0, 1, 2, 3]), 'W': w, 'M': w + 1, 'K': 5, 'Spay': 90.0}}})
    c = S.cell_of(rows, 1, 'rings')
    assert c['options'] and c['ref'] >= 1 and c['label'] in ('GOOD', 'MISSES THE RATE', 'NO ROOM'), c['label']
    assert S.rank_avg([1, 1, 2]).tolist() == [1.5, 1.5, 3.0]
    assert abs(S.spearman([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]) - 1.0) < 1e-9


def test_graph_version_agrees_with_rdkit():
    import hurdle_graph as HG
    import molecules
    smis = [m.canonical for m in molecules.game_molecules()[::4]] + ['CC(=O)OC', 'CSSC', 'NCCC(=O)N', 'C=NCC', 'OC(=O)CCO', 'c1ccccc1O']
    keys = ['ring5', 'ring_oxygen', 'ring_atoms', 'atoms', 'chain', 'branch', 'conj', 'dbl', 'hetero', 'kinds', 'sites', 'spiro', 'ring_systems']
    bad = []
    for smi in smis:
        a, b = HG.numbers(smi), H.feat(smi)
        for k in keys:
            if a[k] != b[k]:
                bad.append((smi, k, a[k], b[k]))
        for g in H.GROUPS:
            if a['groups'][g] != b['groups'][g]:
                bad.append((smi, g, a['groups'][g], b['groups'][g]))
    assert not bad, bad[:5]


if __name__ == '__main__':
    fails = 0
    tests = [(k, v) for k, v in sorted(globals().items()) if k.startswith('test_') and callable(v)]
    for k, f in tests:
        try:
            f()
            print('PASS', k)
        except Exception as e:
            import traceback
            traceback.print_exc()
            fails += 1
            print('FAIL', k, repr(e))
    print('%d tests, %d failed' % (len(tests), fails))
    sys.exit(1 if fails else 0)
