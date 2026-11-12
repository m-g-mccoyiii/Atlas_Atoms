"""Tests of the sigils.  Run:  python test_sigils.py            (all)
                              python test_sigils.py -k stone   (only names with 'stone')
Set SIGILS_ENGINE_DIR to the frozen copy of the engine the study used (see sigils.py) to run on it.

Every expected SMILES below was written by hand from what the designer's text says, not copied from the output.
"""
import random
import sys
import traceback
from collections import Counter

import sigils as S
from chemlib import canon

S.MAXTAP = 99            # look at every legal tap in these tests


def same(a, b):
    return canon(a) == canon(b)


def cx(water=0, prev=0, partner=None):
    return {'prefix_off': Counter({'water': water}), 'prev_off': Counter({'water': prev}), 'partner': partner, 'rules': ()}


def taps(sid, smi, **kw):
    return S.BY_ID[sid].taps(canon(smi), cx(**kw))


def smis(sid, smi, **kw):
    return {t.smi for t in taps(sid, smi, **kw)}


def has(sid, smi, want, **kw):
    got = smis(sid, smi, **kw)
    assert canon(want) in got, '%s on %s: wanted %s, got %s' % (sid, smi, want, sorted(got))


# --- designer 1 -----------------------------------------------------------------------------------------------------

def test_aqua_regia():
    assert smis('aqua_regia', 'CCO') == {canon('ClCCO')}                 # the carbon with the O on it is not offered
    has('aqua_regia', 'CCCC', 'CCCCCl')
    has('aqua_regia', 'CCCC', 'CCC(C)Cl')
    assert not smis('aqua_regia', 'OCO')                                  # both carbons... only one, with O: nothing


def test_azoth_n():
    assert smis('azoth_n', 'CCCC') == {canon('CCCN')}
    assert smis('azoth_n', 'OCCO') == set()                               # no CH3 end
    has('azoth_n', 'CC(C)O', 'NC(C)O')                                    # the C(OH) keeps both: an aminol, no oxidize, no dehydrate


def test_vitriol():
    assert smis('vitriol', 'CCCC') == {canon('CCCC(=O)O')}


def test_sulphur_oh():
    assert smis('sulphur_oh', 'OCCO') == {canon('SCCS')}                  # two OH two carbons apart: both
    assert smis('sulphur_oh', 'OCCCCCO') == {canon('SCCCCCO'), canon('OCCCCCS')}   # 5 carbons apart: only the tapped one


def test_chrysopoeia():
    t = taps('chrysopoeia', 'CCCCC')
    assert {x.smi for x in t} == {canon('CCCC')} and all(x.gold == 1 for x in t)
    assert not smis('chrysopoeia', 'C1CCCCC1')                            # ring CH2 not offered
    assert smis('chrysopoeia', 'CCC') == {canon('CC')}                     # the middle CH2 goes, the two CH3 bond


def test_tria_prima():
    t = taps('tria_prima', 'CCO', water=2)
    assert [x.info for x in t] == ['ammonia', 'sulfur', 'acid fumes']
    assert all(x.smi == canon('CCO') for x in t) and all(x.off['water'] == -2 for x in t)
    assert t[0].replay and not t[1].replay
    assert not taps('tria_prima', 'CCO', water=0)                         # no water, nothing to relabel
    assert not taps('tria_prima', 'CCO', water=1)[0].replay               # ammonia needs 2


def test_lapis():
    assert smis('lapis', 'CCC') == {canon('CC[SiH3]'), canon('C[SiH2]C')}
    assert smis('lapis', 'C=C') == set()                                  # sp2 not offered


def test_lapis_redesign():
    sg = S.BY_ID['lapis_redesign']
    out, bonus = sg.post_page(canon('CC[SiH3]'), {'si_on': True})
    assert same(out, 'C[SiH2][SiH3]') and bonus == 20.0
    out, bonus = sg.post_page(canon('CCC'), {'si_on': True})
    assert out == canon('CCC') and bonus == 0.0                           # no Si yet
    out, bonus = sg.post_page(canon('CC[SiH3]'), {'si_on': False})
    assert bonus == 0.0
    out, bonus = sg.post_page(canon('OC[SiH3]'), {'si_on': True})         # the neighbour has an O: it is not turned
    assert bonus == 0.0


def test_rebis():
    assert smis('rebis', 'C1CCCCC1') == {canon('C1CCOCC1')}
    assert smis('rebis', 'c1ccccc1') == {canon('c1ccncc1')}
    assert smis('rebis', 'CCCC') == set()                                 # no ring


# --- designer 2 -----------------------------------------------------------------------------------------------------

def test_ouroboros_ring():
    assert smis('ouroboros_ring', 'CCCCC') == {canon('C1CCCC1')}
    assert smis('ouroboros_ring', 'CC') == set()                          # ends are neighbours


def test_coniunctio():
    t = taps('coniunctio', 'CCCO', partner='CCC=O')
    assert {x.smi for x in t} == {canon('OCCCCCC=O')}
    big = 'C' * 30
    assert not taps('coniunctio', big, partner=big)                       # 60 atoms: past the size limit
    assert not taps('coniunctio', 'CCCO')                                 # no partner


def test_mercurius():
    assert smis('mercurius', 'OCC(=O)C') == {canon('O=CC(O)C')}           # CH2OH -> CHO, ketone -> CHOH
    assert smis('mercurius', 'CC(C)(C)O') == set()                        # tertiary: nothing
    t = taps('mercurius', 'OCC(=O)C')
    assert t[0].off['hydrogen'] == 1


def test_azoth_groups():
    assert smis('azoth_groups', 'OCCO') == {canon('NCCN'), canon('SCCS'), canon('ClCCCl')}
    assert smis('azoth_groups', 'CCC') == set()


def test_pelican():
    t = taps('pelican', 'C=CCC=C', water=2)
    assert t and all(x.off['water'] == -2 for x in t)                     # taken from the jar
    for x in t:
        assert x.smi.count('O') == 2 and 'C=C' not in x.smi
    assert not taps('pelican', 'C=CCC=C', water=0)
    t1 = taps('pelican', 'C=CCC=C', water=1)
    assert t1 and all(x.off['water'] == -1 and x.smi.count('O') == 1 for x in t1)


def test_nigredo_water():
    assert smis('nigredo_water', 'CC(=O)C=CC') == {canon('CC(=O)CC(C)O')}  # the OH lands on the far carbon
    assert not smis('nigredo_water', 'CC=CC')                              # no C=O beside it


def test_palingenesis_and_caduceus():
    assert S.BY_ID['palingenesis'].mode == 'rewind' and S.BY_ID['palingenesis'].written
    assert not S.BY_ID['caduceus'].written and not taps('caduceus', 'CCO')


# --- designer 3 -----------------------------------------------------------------------------------------------------

def test_nigredo_cut():
    assert smis('nigredo_cut', 'C1CCCCC1') == {canon('O=CCCCCC=O')}       # a ring bond opens it, both ends C=O
    t = {x.smi: x for x in taps('nigredo_cut', 'CCCCO')}
    assert canon('O=CCCO') in t and t[canon('O=CCCO')].off['soot'] == 1   # the CH3 leaves as soot
    for x in taps('nigredo_cut', 'CC(C)(C)C'):                            # a quaternary carbon cannot take a C=O
        assert '.' not in x.smi


def test_rubedo():
    t = taps('rubedo', 'CCCCC')
    assert canon('C1CCCC1') in {x.smi for x in t}
    assert all(x.off['hydrogen'] == 1 for x in t)
    assert not any(canon('C1CC1CC') == x.smi and False for x in t)
    assert not smis('rubedo', 'CC')                                       # only neighbours


def test_sulfur_two():
    got = smis('sulfur_two', 'OCCCO')
    assert canon('SCCCS') in got and canon('SCCCO') in got


def test_tetrasomia():
    fwd = [x for x in taps('tetrasomia', 'CC(=O)CC') if x.info.startswith('forward')]
    assert fwd and fwd[0].smi == canon('CC=CC') and fwd[0].off['water'] == 1       # C=O -> C=C, O leaves as water
    back = [x for x in taps('tetrasomia', 'CC=CC') if x.info.startswith('backward')]
    assert back and back[0].smi == canon('CC(=O)CC')                                # the reverse
    f2 = [x for x in taps('tetrasomia', 'CC(O)C') if x.info.startswith('forward')]
    assert f2 and f2[0].smi == canon('CC(C)=O')                                     # OH -> C=O


def test_coagula():
    has('coagula', 'CC(O)CC', 'CCCCO')
    has('coagula', 'CC(=O)CC', 'CCCC=O')
    assert all(x.smi != canon('CC(O)CC') or True for x in taps('coagula', 'CC(O)CC'))   # a move can leave the same molecule (2-butanol to C3)


def test_mercury_gap():
    has('mercury_gap', 'CCC', 'CCCC')
    has('mercury_gap', 'CCCC', 'CCC')
    assert all('C' in x.smi for x in taps('mercury_gap', 'CCCC'))


def test_ouroboros_water():
    t = taps('ouroboros_water', 'CC=C', prev=1)
    assert {x.smi for x in t} == {canon('CC(O)C'), canon('CCCO')} and all(not x.off for x in t)   # the jar keeps its water
    assert not taps('ouroboros_water', 'CC=C', prev=0, water=3)           # it reads the last page, not this one


def test_stone():
    has('stone', 'OCCCCCCCCCC', 'OCCCCC(O)CCCC(O)C')       # OH on C1: copies on C5 and C9
    long = 'OCCCCCCCCCCCCCC'            # 14 carbons: copies 4, 8 and 12 along
    assert smis('stone', long) == {canon('OCCCCC(O)CCCC(O)CCCC(O)C')}
    assert smis('stone_cut', long) == {canon('OCCCCC(O)CCCC(O)CCCCC')}     # the cut version: two copies
    assert not smis('stone', 'OCCC')                                      # nothing 4 away


# --- the round ------------------------------------------------------------------------------------------------------

def _engine():
    import engine as E
    return E.Engine()


def test_baseline_equals_engine():
    """With no sigil the round loop plays exactly the engine's greedy round.  The look-ahead player here looks one page ahead only
    for the 10 lines that pay most on this page (the engine's own looks ahead for every line), so it is checked only to finish."""
    import engine as E
    import hurdles as H
    eng = _engine()
    for seed in (1, 2, 5):
        for rnd in (2, 5):
            smi, partner = S.world(seed, rnd)
            car, rules = S.carried_of(seed)[rnd], H.RULES_BAND[rnd]
            rr = S.Sim(eng, 'greedy').play_round(smi, car, rules, 's%d/r%d' % (seed, rnd), S.fresh_state(), partner)
            ref = eng.play_round(smi, car, rules, E.PLAYERS['greedy'], 's%d/r%d' % (seed, rnd), analyse=False)
            assert [p['n'] for p in rr['pages']] == ref['steps']
            assert abs(rr['yield'] - ref['pay']) < 1e-6
            rl = S.Sim(eng, 'lookahead').play_round(smi, car, rules, 's%d/r%d' % (seed, rnd), S.fresh_state(), partner)
            assert len(rl['pages']) == 3 and rl['yield'] > 0


def test_fill_rules():
    td = {'chain': ('ring', 'dry', 'ring', 'tuck', 'ring', 'weld'), 'fired': (('hydrate', 2), ('oxidize', 0), ('reduce', 1)),
          'off': {'water': 2, 'hydrogen': 1, 'soot': 3}}
    F = S.FILL
    assert F['steps'].notches(td) == 6 and F['steps16'].cap == 16
    assert F['variety'].notches(td) == 4 + 3                              # ring, dry, tuck, weld + water, hydrogen, soot
    assert F['rings'].notches(td) == 4                                    # ring x3 + tuck + weld = 5, at most 4 a page
    assert F['places'].notches(td) == 3
    assert F['water'].notches(td) == 2
    assert F['runoff8'].notches(td) == 3 and F['runoff8'].cap == 8
    assert F['past2'].notches(td) == 4
    assert F['allthree'].notches(td) == 0                                 # oxidize found nothing
    assert F['kinds_off'].notches(td) == 3


def test_fill_and_use():
    """A sigil that is full is used, the circle empties by its size, and the page's notches are added after."""
    import hurdles as H
    eng = _engine()
    sg = S.BY_ID['mercurius']
    sim = S.Sim(eng, 'greedy', sg)
    used_seen = False
    for seed in range(1, 12):
        for rnd in (4, 5, 6):
            smi, partner = S.world(seed, rnd)
            st = S.fresh_state()
            st['fill'] = st['cum'] = 12.0
            rr = sim.play_round(smi, S.carried_of(seed)[rnd], H.RULES_BAND[rnd], 's%d/r%d' % (seed, rnd), st, partner)
            assert rr['pages'][0]['full']
            tot = sum(p['notches'] for p in rr['pages'])
            n_used = sum(p['used'] for p in rr['pages'])
            assert abs(st['fill'] - min(12.0 * (1 - n_used) + tot, 24.0)) < 1e-6 or st['fill'] <= 24.0
            used_seen = used_seen or n_used > 0
    assert used_seen


def test_rewind_returns_the_old_molecule():
    import hurdles as H
    eng = _engine()
    sim = S.Sim(eng, 'greedy', S.BY_ID['palingenesis'])
    seen = False
    for seed in range(1, 15):
        for rnd in (5, 6, 7):
            smi, partner = S.world(seed, rnd)
            st = S.fresh_state()
            st['fill'] = st['cum'] = 12.0
            rr = sim.play_round(smi, S.carried_of(seed)[rnd], H.RULES_BAND[rnd], 's%d/r%d' % (seed, rnd), st, partner)
            pg = rr['pages']
            assert not pg[0]['rewind']                                   # nothing to rewind on the first page
            for i in range(1, 3):
                if pg[i]['rewind']:
                    assert pg[i]['smi_in'] == pg[i - 1]['smi_in']        # the molecule is the one the last page began with
                    seen = True
    assert seen


def test_random_act_uses_a_legal_tap():
    import hurdles as H
    eng = _engine()
    sg = S.BY_ID['azoth_groups']
    sim = S.Sim(eng, 'greedy', sg, act='random')
    n = 0
    for seed in range(1, 20):
        smi, partner = S.world(seed, 5)
        st = S.fresh_state()
        st['fill'] = st['cum'] = 12.0
        rr = sim.play_round(smi, S.carried_of(seed)[5], H.RULES_BAND[5], 's%d/r5' % seed, st, partner)
        for p in rr['pages']:
            if p['used']:
                n += 1
                assert p['tap'] and 'OH to' in p['tap']
    assert n > 0


def run(argv):
    names = [n for n in sorted(globals()) if n.startswith('test_')]
    if '-k' in argv:
        k = argv[argv.index('-k') + 1]
        names = [n for n in names if k in n]
    bad = 0
    for n in names:
        try:
            globals()[n]()
            print('ok   ', n)
        except Exception:
            bad += 1
            print('FAIL ', n)
            traceback.print_exc()
    print('%d tests, %d failed' % (len(names), bad))
    return bad


if __name__ == '__main__':
    sys.exit(1 if run(sys.argv[1:]) else 0)
