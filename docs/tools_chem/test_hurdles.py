"""Tests of hurdles.py: the structural readings on molecules whose answers are known, the event readings on made-up logs, the
players, the search and the generator.   python test_hurdles.py"""
import random
import sys

import engine as E
import hurdle_gen as G
import hurdles as H
import library
from chemlib import canon

F = lambda s: H.feat(canon(s))


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
    assert o['ring_hetero'] == 1 and o['ring_mixed'] == 0
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
    H_ = H.HURDLES
    lg = H.Log('C', [mk(['ring', 'dry', 'tuck', 'ring']), mk(['ring', 'ring', 'ring']), mk([])])
    assert H_['busy'].fn(lg) == 7 and H_['long_chain'].fn(lg) == 4 and H_['every_turn'].fn(lg) == 0
    assert H_['loop'].fn(lg) == 1 and H_['pile_on'].fn(lg) == 3 and H_['kinds_in_turn'].fn(lg) == 3
    assert H_['kinds_in_round'].fn(lg) == 3 and H_['kind_ring'].fn(lg) == 5 and H_['finish_strong'].fn(lg) == 0
    assert H_['order_ring_dry'].fn(lg) == 1 and H_['order_dry_tuck'].fn(lg) == 1
    assert H_['crescendo'].fn(lg) == 0
    lg2 = H.Log('C', [mk(['ring'], set_off=(1, 0, 0), off={'water': 2, 'hydrogen': 1}), mk(['ring', 'dry'], set_off=(1, 1, 0)),
                      mk(['ring'] * 5, set_off=(2, 2, 1), off={'water': 1})])
    assert H_['crescendo'].fn(lg2) == 2 and H_['finish_strong'].fn(lg2) == 5 and H_['off_total'].fn(lg2) == 4
    assert H_['off_water'].fn(lg2) == 3 and H_['many_jars'].fn(lg2) == 2 and H_['big_puff'].fn(lg2) == 3
    assert H_['opener'].fn(lg2) == 2 and H_['closer'].fn(lg2) == 1 and H_['all_three_feed'].fn(lg2) == 1
    assert H_['variety'].fn(lg2) == 3 and H_['repeats'].fn(lg2) == 6 and H_['same_line'].fn(lg2) == 3
    assert H_['by_two_busy'].fn(lg2) == 3
    for h in H_.values():
        assert isinstance(h.fn(H.Log('C', [])), (int, float)), h.name


def test_structural_modes_and_the_start_offset():
    cage = canon('C=CCCC(=O)CCC(O)C12CC3CC(CC(C3)C1)C2')
    f0 = H.feat(cage)
    assert f0['bridgehead'] >= 4
    lg = H.Log(cage, [mk([], end=cage)])
    assert H.HURDLES['bridgehead'].fn(lg) == 0 and H.HURDLES['rings'].fn(lg) == 0     # the start does not count
    big = canon('C1CCC2CCCCC2C1')
    lg = H.Log('CCCCCCCCCC', [mk([], end='C' * 8), mk([], end=big)])
    assert H.HURDLES['rings'].fn(lg) == 2 and H.HURDLES['cut_down'].fn(lg) == 2 and H.HURDLES['growth'].fn(lg) == 0
    assert H.HURDLES['size_range'].fn(lg) == 2


def test_check_matches_a_played_round():
    smi = 'C=CCCC(=O)CCC(=O)CCCC=O'
    eng = E.Engine()
    rr = eng.play_round(smi, library.SIX, library.SELF_TIER1, E.PLAYERS['greedy'], 'x1', analyse=False)
    steps = sum(len(t['chain']) for t in rr['turns'])
    assert H.HURDLES['busy'].check(smi, rr) == steps
    assert H.HURDLES['long_chain'].check(smi, rr) == rr['longest']
    assert H.HURDLES['off_total'].check(smi, rr) == sum(rr['off'].values())


def test_seeker_beats_points_on_its_own_hurdle():
    eng = E.Engine()
    smi = 'C=CCCC(=O)CCC(=O)CCCC=O'
    for name in ('growth', 'busy', 'rings'):
        h = H.HURDLES[name]
        sk = [h.check(smi, eng.play_round(smi, library.SIX, library.SELF_TIER1, H.SeekPlayer(h), 's%d' % i, analyse=False))
              for i in range(8)]
        pt = [h.check(smi, eng.play_round(smi, library.SIX, library.SELF_TIER1, E.PLAYERS['greedy'], 's%d' % i, analyse=False))
              for i in range(8)]
        assert sum(sk) >= sum(pt), (name, sk, pt)


def test_reach_search():
    eng = E.Engine()
    smi = 'C=CCCC(=O)CCC(=O)CCCC=O'
    ok = G.reach_search(eng, smi, library.SIX, library.SELF_TIER1, [(H.HURDLES['busy'], 3)])
    assert ok is not None and len(ok) <= 3
    assert G.reach_search(eng, smi, library.SIX, library.SELF_TIER1, [(H.HURDLES['rings'], 25)]) is None


def test_generator():
    G.set_table({'busy': {'label': 'GOOD', 'good_rounds': [1, 2, 3], 'sf': {'1': [1, .9, .7, .5, .2, 0], '2': [1, .9, .7, .5, .2, 0],
                                                                            '3': [1, .9, .7, .5, .2, 0]}},
                 'growth': {'label': 'GOOD', 'good_rounds': [1, 2, 3], 'sf': {'1': [1, .9, .7, .5, .2, 0]}}})
    smi = 'C=CCCC(=O)CCC(=O)CCCC=O'
    rng = random.Random(3)
    pk = G.pick_hurdle(smi, 1, library.SIX, rng, tier=3, mode='table', k=6, kp=3)
    assert pk.aims and pk.aims[0][1] >= 1 and pk.witness is not None, pk
    pk2 = G.pick_hurdle(smi, 2, library.SIX, rng, tier=3, history=[pk.families], mode='table', k=6, kp=3)
    assert pk2.families != pk.families or pk2.fell_back, (pk, pk2)
    G.set_table({})
    pk3 = G.pick_hurdle(smi, 1, library.SIX, rng, mode='sim', k=6, kp=3)
    assert pk3.fell_back and pk3.aims
    G.set_table(None)


def test_names_and_text():
    assert len(H.HURDLES) >= 80
    for n, h in H.HURDLES.items():
        assert '{N}' in h.text and h.family and h.mark and h.how, n
        assert h.condition(3)


if __name__ == '__main__':
    fails = 0
    tests = [(k, v) for k, v in sorted(globals().items()) if k.startswith('test_') and callable(v)]
    for k, f in tests:
        try:
            f()
            print('PASS', k)
        except Exception as e:
            fails += 1
            print('FAIL', k, repr(e))
    print('%d tests, %d failed' % (len(tests), fails))
    sys.exit(1 if fails else 0)
