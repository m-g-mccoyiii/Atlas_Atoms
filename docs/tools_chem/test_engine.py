"""Tests of the Overreact chemistry engine.  Run:  python test_engine.py            (all)
                                                  python test_engine.py -k ring   (only names with 'ring')
                                                  python test_engine.py --game    (also the comparison with the game, about 10 minutes; add --lookahead for that player too)
Also works under pytest (every test_* function).

Every expected SMILES below was written by hand from the chemistry, not copied from the engine's output.
"""
import random
import sys
import traceback

from rdkit import Chem

import chemlib
import library
import molecules
from chemlib import parse, comp, canon
from engine import (Engine, PLAYERS, SIX, SELF_RING, SELF_ALL, SELF_TIER1, pay_of, run_rounds, deal_source, summarize,
                    game_comparison, MAX_HEAVY, STEP_CAP)
from library import REACTIONS, SELF_RULES, reopen, POOL19

E = Engine(check_balance=True)


def same(a, b):
    return canon(a) == canon(b)


# ---------------------------------------------------------------------------------------------------------------
# worked cases: (reaction, SMILES before, SMILES after, places it acted at, what came off)
# ---------------------------------------------------------------------------------------------------------------
R = [
    # the six, as built
    ('hydrate', 'CC=C', 'CC(C)O', 1, {}),                                  # OH on the carbon with fewer H
    ('hydrate', 'C=CC(C)=O', 'CC(=O)CCO', 1, {}),                          # next to C=O the OH goes on the far carbon
    ('hydrate', 'C=CCCC=C', 'CC(O)CCC(C)O', 2, {}),                        # every C=C
    ('hydrate', 'CCC=CC', 'CCCC(C)O', 1, {}),                              # a tie: the carbon nearer the end of the chain
    ('hydroborate', 'CC=C', 'CCCO', 1, {}),                                # OH on the carbon with more H
    ('hydroborate', 'CC(C)=CC', 'CC(C)C(C)O', 1, {}),
    ('hydroborate', 'C=CCC=C', 'OCCCCCO', 2, {}),
    ('hydroborate', 'CC(C)=O', 'CC(C)=O', 0, {}),                          # MODE.zip: acts on C=C only
    ('dehydrate', 'CC(O)CC', 'CC=CC', 1, {'water': 1}),                    # toward the neighbor with fewer H
    ('dehydrate', 'CC(C)(O)C', 'C=C(C)C', 1, {'water': 1}),
    ('dehydrate', 'CC(O)CC=C', 'CC=CC=C', 1, {'water': 1}),                # fewer H, and that one is beside a C=C
    ('dehydrate', 'OCCO', 'OCCO', 0, {}),                                  # a 1,2-diol is left alone
    ('dehydrate', 'CC1(O)CCCCO1', 'CC1(O)CCCCO1', 0, {}),                  # the OH a zip leaves stays
    ('oxidize', 'CC(O)CCO', 'CC(=O)CC=O', 2, {'hydrogen': 2}),
    ('oxidize', 'CC(C)(O)C', 'CC(C)(C)O', 0, {}),                          # no H on the carbon
    ('oxidize', 'CCC=C', 'CCC=O', 1, {'carbon dioxide': 1}),               # chain-end C=C loses its end carbon
    ('oxidize', 'C=CC=C', 'O=CC=O', 2, {'carbon dioxide': 2}),
    ('oxidize', 'Oc1ccccc1', 'Oc1ccccc1', 0, {}),                          # a phenol is not an alcohol
    ('reduce', 'CCC=O', 'CCCO', 1, {}),
    ('reduce', 'O=CCCCC=O', 'OCCCCCO', 2, {}),
    ('reduce', 'CC(C)=O', 'CC(C)=O', 0, {}),                               # only a C=O at the end of a chain
    ('reduce', 'CC(=O)O', 'CC(=O)O', 0, {}),                               # an acid is untouched
    ('grow', 'CC(C)=O', 'C=CCC(C)(C)O', 1, {}),
    ('grow', 'O=CCCC(C)=O', 'C=CCC(O)CCC(C)(O)CC=C', 2, {}),
    ('grow', 'CC(=O)OC', 'CC(=O)OC', 0, {}),
    # the other thirteen
    ('wittig', 'CC(C)=O', 'C=C(C)C', 1, {}),
    ('wittig', 'O=CCC(C)=O', 'C=CCC(=C)C', 2, {}),
    ('wittig', 'CC(=O)OC', 'CC(=O)OC', 0, {}),
    ('dihydroxylation', 'CC=CC', 'CC(O)C(C)O', 1, {}),
    ('dihydroxylation', 'C=CC=C', 'OCC(O)C(O)CO', 2, {}),
    ('dihydroxylation', 'c1ccccc1', 'c1ccccc1', 0, {}),
    ('ozonolysis', 'CCC=CCC', 'CCC=O', 1, {'piece': 1}),                   # the shorter (here equal) piece is lost
    ('ozonolysis', 'CC=CCCC', 'CCCC=O', 1, {'piece': 1}),
    ('ozonolysis', 'C1CCC=CC1', 'O=CCCCCC=O', 1, {}),                      # a ring opens
    ('ozonolysis', 'C=CCC', 'C=CCC', 0, {}),                               # a chain-end C=C stays oxidize's
    ('jones', 'CCC=O', 'CCC(=O)O', 1, {}),
    ('jones', 'O=CCCCC=O', 'O=C(O)CCCC(=O)O', 2, {}),
    ('jones', 'CC(C)=O', 'CC(C)=O', 0, {}),
    ('amination', 'CC(C)=O', 'CC(C)N', 1, {'water': 1}),
    ('amination', 'O=CCCCC=O', 'NCCCCCN', 2, {'water': 2}),
    ('thiolene', 'CC=C', 'CCCS', 1, {}),                                   # SH on the carbon with more H
    ('thiolene', 'C1CCC=CC1', 'SC1CCCCC1', 1, {}),                         # also on a ring C=C
    ('thiolene', 'C=CC(C)=O', 'CC(=O)C(C)S', 1, {}),                       # anti: the carbon beside the C=O
    ('chlorination', 'CC(O)CC', 'CC(Cl)CC', 1, {'acid fumes': 1}),
    ('chlorination', 'OCCCO', 'ClCCCCl', 2, {'acid fumes': 2}),
    ('chlorination', 'CC(C)(O)C', 'CC(C)(O)C', 0, {}),                     # tertiary: it eliminates instead
    ('chlorination', 'CC(=O)O', 'CC(=O)O', 0, {}),                         # an acid would give an acyl chloride
    ('chlorination', 'Oc1ccccc1', 'Oc1ccccc1', 0, {}),
    ('williamson', 'ClCCCCCO', 'C1CCOCC1', 1, {'acid fumes': 1}),         # Cl and OH 4 carbons apart: a six-ring
    ('williamson', 'ClCCCCO', 'C1CCOC1', 1, {'acid fumes': 1}),
    ('williamson', 'ClCCCCCCO', 'C1CCCOCC1', 1, {'acid fumes': 1}),        # five carbons apart: a seven-ring
    ('williamson', 'ClCCCCCCCO', 'ClCCCCCCCO', 0, {}),                     # an eight-ring does not form
    ('suzuki', 'C=CCl', 'C=Cc1ccccc1O', 1, {}),
    ('suzuki', 'C=CCCl', 'C=CCc1ccccc1O', 1, {}),
    ('suzuki', 'ClCc1ccccc1', 'Oc1ccccc1Cc1ccccc1', 1, {}),
    ('suzuki', 'CCCCl', 'CCCCl', 0, {}),                                   # an alkyl chloride is a poor partner
    ('suzuki_loose', 'CCCCl', 'CCCc1ccccc1O', 1, {}),
    ('suzuki_loose', 'CC(Cl)C', 'CC(C)c1ccccc1O', 1, {}),
    ('hofmann', 'CCCN', 'C=CC', 1, {'trimethylamine': 1, 'water': 1}),
    ('hofmann', 'CC(N)CC', 'C=CCC', 1, {'trimethylamine': 1, 'water': 1}), # toward the neighbor with MORE H
    ('raney', 'CCS', 'CC', 1, {'sulfur': 1}),
    ('raney', 'C=CCCS', 'CCCC', 2, {'sulfur': 1}),                          # also saturates the C=C
    ('decarboxylation', 'CCC(=O)O', 'CC', 1, {'carbon dioxide': 1}),
    ('decarboxylation', 'O=C(O)CCCCC(=O)O', 'CCCC', 2, {'carbon dioxide': 2}),
    ('hydrogenation', 'C=CC=C', 'CCCC', 2, {}),
    ('hydrogenation', 'CC=O', 'CC=O', 0, {}),
    ('hydrogenation', 'c1ccccc1', 'c1ccccc1', 0, {}),
]

# self-reactions: (rule, before, after, off)   one step of the rule alone
S = [
    ('ring', 'OCCCCC=O', 'OC1CCCCO1', {}),                                 # d = 4: a six-ring
    ('ring', 'OCCCC(C)=O', 'CC1(O)CCCO1', {}),                             # d = 3: a five-ring
    ('ring', 'Oc1ccccc1CCC=O', 'OC1CCc2ccccc2O1', {}),                     # a phenol
    ('ring', 'OCCC=O', 'OCCC=O', {}),                                      # d = 2: too near
    ('ring', 'OCCCCCC=O', 'OCCCCCC=O', {}),                                # d = 5: too far
    ('ring', 'OCCCC(=O)CCC(=O)C', 'CC(=O)CCC1(O)CCCO1', {}),               # the OH goes to the nearer C=O
    ('dry', 'CC(=O)CC(C)O', 'CC(=O)C=CC', {'water': 1}),
    ('dry', 'O=CCC(O)CC', 'O=CC=CCC', {'water': 1}),
    ('dry', 'CC(=O)CCC(C)O', 'CC(=O)CCC(C)O', {}),                         # the OH is 3 away: not dry
    ('flip', 'OC=C', 'CC=O', {}),
    ('flip', 'CC(O)=CC', 'CC(=O)CC', {}),
    ('flip', 'Oc1ccccc1', 'Oc1ccccc1', {}),                                # a phenol does not flip
    ('shift', 'CC(=O)CC=CC', 'CC(=O)C=CCC', {}),
    ('shift', 'O=CCC=C', 'O=CC=CC', {}),
    ('shift', 'CC(=O)C=CC', 'CC(=O)C=CC', {}),                             # already beside the C=O: it stays
    ('tuck', 'CC(=O)C=CCCCO', 'CC(=O)CC1CCCO1', {}),                       # OH 3 from the far carbon
    ('tuck', 'O=CC=CCCCCO', 'O=CCC1CCCCO1', {}),                           # OH 4 from the far carbon
    ('tuck', 'CC(=O)C=CCO', 'CC(=O)C=CCO', {}),                            # OH too near
    ('weld', 'CC(=O)CCCC(C)=O', 'CC1(O)CCCC(=O)C1', {}),                   # a six-ring, the second C=O becomes C-OH
    ('weld', 'CC(=O)CCCCC(C)=O', 'CC(=O)C1CCCC1(C)O', {}),                 # a five-ring
    ('weld', 'CC(=O)CC(C)=O', 'CC(=O)CC(C)=O', {}),                        # too near
    ('snap', 'C=CC=CCCCC=C', 'C1C=CC2CCCC2C1', {}),                        # Diels-Alder, a five-ring tether
    ('snap', 'C=CC=CCCCCC=C', 'C1C=CC2CCCCC2C1', {}),                      # a six-ring tether
    ('snap', 'C=CC=C', 'C=CC=C', {}),                                      # no third C=C
    ('strip', 'CC(=O)CC(C)Cl', 'CC(=O)C=CC', {'acid fumes': 1}),
    ('strip', 'O=CCC(Cl)C', 'O=CC=CC', {'acid fumes': 1}),
    ('knit', 'NCCCC(C)=O', 'CC1=NCCC1', {'water': 1}),                     # a five-ring (N joins the carbon)
    ('knit', 'NCCCCC=O', 'C1=NCCCC1', {'water': 1}),                       # a six-ring
    ('knit', 'NCC=O', 'NCC=O', {}),
    ('pop', 'CC(=O)CC(=O)O', 'C=C(C)O', {'carbon dioxide': 1}),
    ('pop', 'CC(=O)C(C)C(=O)O', 'CC=C(C)O', {'carbon dioxide': 1}),
    ('pop', 'CC(=O)CCC(=O)O', 'CC(=O)CCC(=O)O', {}),                       # the COOH is 3 away
    ('seal', 'OCCCC(=O)O', 'O=C1CCCO1', {'water': 1}),                     # a five-ring lactone
    ('seal', 'OCCCCC(=O)O', 'O=C1CCCCO1', {'water': 1}),                   # a six-ring lactone
    ('pair', 'SCCCS', 'C1CSSC1', {'hydrogen': 1}),
    ('pair', 'SCCCCS', 'C1CCSSC1', {'hydrogen': 1}),
]


def test_reaction_cases():
    bad = []
    for name, before, after, n, off in R:
        mol = parse(before)
        r = REACTIONS[name].fire(mol)
        got = Chem.MolToSmiles(r.mol)
        ok = got == canon(after) and r.n == n and {k: v for k, v in r.off.items()} == off
        bal = comp(mol) + r.added == comp(r.mol) + r.lost
        if not (ok and bal):
            bad.append('%s %s -> %s (n=%d, off=%s, balanced=%s); wanted %s (n=%d, off=%s)' % (
                name, before, got, r.n, dict(r.off), bal, canon(after), n, off))
    assert not bad, '\n'.join(bad)


def test_every_reaction_has_two_cases():
    count = {}
    for name, _, _, n, _ in R:
        count.setdefault(name, [0, 0])
        count[name][0 if n else 1] += 1
    for name in REACTIONS:
        assert name in count, 'no worked case for ' + name
        assert count[name][0] >= 2 or (count[name][0] + count[name][1] >= 2), name
        assert count[name][0] >= 1, 'no case where %s acts' % name
    for name in POOL19:
        assert sum(count[name]) >= 2, name


def test_self_cases():
    bad = []
    for name, before, after, off in S:
        mol = parse(before)
        rule = SELF_RULES[name]
        sites = rule.find(mol)
        if canon(after) == canon(before):
            if sites:
                bad.append('%s should not fire on %s' % (name, before))
            continue
        if not sites:
            bad.append('%s found no place on %s' % (name, before))
            continue
        res = rule.apply(mol, sites[0])
        if res is None:
            bad.append('%s could not apply on %s' % (name, before))
            continue
        out, dropped = res
        got = Chem.MolToSmiles(out)
        o = dict(rule.off)
        before_c = comp(mol)
        after_c = comp(out)
        lost = chemlib.formula(rule.loses)
        added = chemlib.formula(rule.adds)
        bal = before_c + added == after_c + lost
        if got != canon(after) or o != off or not bal:
            bad.append('%s %s -> %s (off %s, balanced %s); wanted %s %s' % (name, before, got, o, bal, canon(after), off))
    assert not bad, '\n'.join(bad)


def test_every_self_rule_has_two_cases():
    for name in SELF_RULES:
        acts = [s for s in S if s[0] == name and canon(s[1]) != canon(s[2])]
        assert len(acts) >= 2, name


def test_self_rules_have_no_site_on_plain_alkane():
    for rule in SELF_RULES.values():
        assert not rule.find(parse('CCCCCCCC')), rule.name


# ---------------------------------------------------------------------------------------------------------------
# the rules of the engine
# ---------------------------------------------------------------------------------------------------------------

def test_deterministic_whatever_the_atom_order():
    rng = random.Random(5)
    probes = ['CC(O)CCC(=O)CCC=C', 'C=CCCC(=O)CCC(O)CCC=C', 'OC1(CCCCC1)CCC=CCCC(=O)C', 'CC(C)(O)CCC(O)CCC(O)C',
              'CC=CCCC=CC']
    for smi in probes:
        for name in ('hydrate', 'hydroborate', 'dehydrate', 'oxidize', 'reduce', 'grow', 'ozonolysis', 'dihydroxylation'):
            ref = Chem.MolToSmiles(REACTIONS[name].fire(parse(smi)).mol)
            for _ in range(5):
                rs = Chem.MolToSmiles(parse(smi), doRandom=True)
                got = Chem.MolToSmiles(REACTIONS[name].fire(Chem.MolFromSmiles(rs)).mol)
                assert got == ref, (name, smi, rs, got, ref)


def test_self_reactions_deterministic_whatever_the_atom_order():
    rng = random.Random(7)
    probes = ['OCCCC(=O)CCC(=O)CCC(=O)C', 'CC(O)CCC(=O)CCC(O)CCC(=O)C', 'C=CCCC(=O)CCC(O)CCCC(=O)C']
    for smi in probes:
        ref = E.settle(canon(smi), SELF_RING, 40)[0]
        for _ in range(5):
            rs = Chem.MolToSmiles(parse(smi), doRandom=True)
            got = E.settle(canon(rs), SELF_RING, 40)[0]
            assert got == ref, (smi, rs, got, ref)


def test_zip_runs_along_a_chain_and_opens_again():
    # OH ... C=O ... C=O: the OH of the first ring closes the second
    smi = 'OCCCC(=O)CCC(=O)CCC(=O)C'
    s, steps, off, capped = E.settle(canon(smi), SELF_RING, 40)
    assert steps == ('ring', 'ring', 'ring'), steps
    assert not capped
    # at the turn's end every loose ring opens: back to the OH and the C=Os it came from
    back, n = E.reopen(s)
    assert n == 3 and back == canon(smi), (back, n)


def test_a_ring_whose_oh_was_taken_stays_shut():
    smi = 'CC(=O)CC(O)CCCC(=O)C'     # ring closes the OH onto a C=O, dry then takes the new OH away
    m, n = reopen(parse('CC1(O)CCCO1'))
    assert n == 1 and Chem.MolToSmiles(m) == canon('OCCCC(C)=O')
    m, n = reopen(parse('CC1=CCCO1'))      # no OH on the ring carbon: stays shut
    assert n == 0


def test_cap_of_40_steps_and_its_flag():
    class Toggle(chemlib.SelfRule):
        name = 'toggle'
        off = {}

        def find(self, mol):
            return [chemlib.Site(self, 1)]

        def apply(self, mol, site):
            return mol, chemlib.Counter()
    eng = Engine(self_rules={'toggle': Toggle()})
    smi, steps, off, capped = eng.settle('CCO', ('toggle',), 40)
    assert len(steps) == 40 and capped
    smi, steps, off, capped = eng.settle('CCO', ('toggle',), 7)
    assert len(steps) == 7 and capped
    smi, steps, off, capped = E.settle('CCO', SELF_ALL, 40)
    assert steps == () and not capped


def test_a_wasted_reaction_sets_nothing_off():
    smi = canon('OCCCC(=O)CCC(=O)C')                       # a zip is standing but nothing has been fired
    t = E.run_line(smi, ('hydrate', 'reduce', 'hydrate'), SELF_RING)       # no C=C, no aldehyde: all wasted
    assert t.steps == () and [n for _, n in t.fired] == [0, 0, 0]
    t = E.run_line(smi, ('hydroborate',), SELF_RING)
    assert t.steps == ()


def test_a_reaction_that_acts_sets_the_zip_off_and_the_steps_add():
    smi = canon('C=CCCC(=O)CCC(=O)CCC=O')
    # hydrate puts OH on C2 (closes onto the C=O 3 away)...
    t = E.run_line(smi, ('hydrate',), SELF_RING)
    assert len(t.steps) >= 1 and t.set_off == (len(t.steps),)
    t3 = E.run_line(smi, ('hydrate', 'oxidize', 'reduce'), SELF_RING)
    assert sum(t3.set_off) == len(t3.steps)


def test_size_limit_makes_a_reaction_wasted():
    smi = 'C' * 52 + 'C(=O)C'                              # 55 heavy atoms with one C=O: grow would give 58
    assert heavy(smi) == 55
    f = E.fire(canon(smi), 'grow')
    assert not f.acted and f.blocked and f.smi == canon(smi)
    small = E.fire('CC(C)=O', 'grow')
    assert small.acted


def heavy(smi):
    return parse(smi).GetNumHeavyAtoms()


def test_pay_rule():
    assert pay_of(3, 0)[0] == 50 + 100 + 150
    assert pay_of(3, 0)[1] == 0.1 * (1 + 2 + 3)
    # steps that only repeat an earlier turn's chain pay a quarter of the climb; steps past it pay in full
    p, e, full = pay_of(3, 2)
    assert p == 50 * 1 + 50 * (1 + 0.25) + 150 and full == 1, (p, full)
    assert pay_of(0, 5)[0] == 0
    p2 = pay_of(2, 5)[0]
    assert p2 == 50 + 62.5


def test_hand_and_uses():
    carried = SIX + ('wittig', 'jones')
    left = {r: 3 for r in carried}
    h1 = E.hand_for(carried, left, 11, 0)
    assert len(h1) == 5 and len(set(h1)) == 5 and set(h1) <= set(carried)
    assert h1 == E.hand_for(carried, left, 11, 0)                      # seeded
    assert h1 != E.hand_for(carried, left, 12, 0) or h1 != E.hand_for(carried, left, 13, 0)
    left['wittig'] = 0
    for t in range(20):
        assert 'wittig' not in E.hand_for(carried, left, 3, t)
    assert E.hand_for(SIX[:4], {r: 3 for r in SIX[:4]}, 1, 0) == SIX[:4]       # five or fewer: all handed out
    # no reaction is used more than three times in a round
    rs = run_rounds(Engine(), ['C=CCCC(=O)CCC=O'], SIX, SELF_RING, 'greedy', range(5), analyse=False)
    for r in rs:
        used = {}
        for t in r['turns']:
            for x in t['line']:
                used[x] = used.get(x, 0) + 1
        assert max(used.values()) <= 3
        assert len(r['turns']) == 3


def test_turn_end_opens_rings_and_next_turn_starts_with_the_chain_set_up():
    smi = canon('OCCCC(=O)CCC(=O)CCC=C')
    rr = Engine().play_round(smi, SIX, SELF_RING, PLAYERS['random'], 3)
    for t in rr['turns']:
        assert t['smi_out'] == Engine().reopen(t['smi_end'])[0]
    # a ring that stayed shut would be a ring in the next turn's starting molecule; none is left open to close again
    for t in rr['turns']:
        assert reopen(parse(t['smi_out']))[1] == 0       # nothing loose is left at the start of the next turn


def test_players_order():
    # on molecules with a cascade to find, greedy beats random and look-ahead is not worse than greedy
    eng = Engine()
    mols = ['C=CCCC(=O)CCC=O', 'CC(C)(O)CCC(=O)CCC=C', 'O=CCCC(=O)CCC(=O)CCC=C', 'C=CCCC(=O)CCC(=O)CCCC=O']
    res = {}
    for pn in ('random', 'greedy', 'lookahead'):
        rs = run_rounds(eng, mols, SIX, SELF_RING, pn, range(40), analyse=False)
        res[pn] = summarize(rs)['pay_mean']
    assert res['greedy'] > res['random'], res
    assert res['lookahead'] >= res['greedy'] * 0.97, res


def test_the_ten_lines_of_docs_reactions_md():
    """Each line of three of docs/REACTIONS.md section 6, with the chemistry check's corrections.  Reactions only (no
    self-reactions) except where the line itself names one (6: dry, 9: ring)."""
    def go(smi, line, rules=()):
        cur = canon(smi)
        for r in line:
            f = E.fire(cur, r)
            assert f.acted, (smi, line, r, cur)
            cur = f.smi
            cur = E.settle(cur, tuple(rules), 40)[0]
        return cur
    # 1 but-1-ene: both C=C carbons take OH, both become C=O, both become NH2 (water off twice)
    assert go('C=CCC', ['dihydroxylation', 'oxidize', 'amination']) == canon('CCC(N)CN')
    # 2 pent-4-en-1-amine: OH on the end carbon, C=O, COOH (the amine is attacked by chromic acid in life: accepted)
    assert go('NCCCC=C', ['hydroborate', 'oxidize', 'jones']) == canon('NCCCCC(=O)O')
    # 3 hex-5-en-1-ol: OH to Cl, OH on carbon 5, a six-ring ether
    assert go('OCCCCC=C', ['chlorination', 'hydrate', 'williamson']) == canon('CC1CCCCO1')
    # 4 cyclohexene: opened, both ends COOH, both lost as carbon dioxide: butane
    assert go('C1CCC=CC1', ['ozonolysis', 'jones', 'decarboxylation']) == canon('CCCC')
    # 5 pentan-2-one: C=O to NH2, NH2 to C=C toward the methyl, OH on the end carbon: the C=O has moved to a chain-end alcohol
    assert go('CCCC(C)=O', ['amination', 'hofmann', 'hydroborate']) == canon('OCCCCC')
    # 6 propanone: grow, oxidize cuts the arm end as carbon dioxide (dry then fires), Jones makes the C=O a COOH
    assert go('CC(C)=O', ['grow', 'oxidize', 'jones'], SELF_TIER1) == canon('CC(C)=CC(=O)O')
    # 7 propanone: Wittig gives isobutene, hydroborate puts OH on the CH2 end, oxidize makes it C=O
    assert go('CC(C)=O', ['wittig', 'hydroborate', 'oxidize']) == canon('O=CC(C)C')
    # 8 pent-4-en-2-ol: SH on the end carbon, C=C toward the neighbor with fewer H, then Raney nickel takes the SH (and, as the
    #   check says, the C=C): pentane
    assert go('CC(O)CC=C', ['thiolene', 'dehydrate', 'raney']) == canon('CCCCC')
    # 9 hydroxyacetone: Cl, a 2-hydroxyphenyl ring on it, and the ring OH closes onto the C=O.  (Needs suzuki_loose: an alkyl
    #   chloride is a poor Suzuki partner.)
    assert go('CC(=O)CO', ['chlorination', 'suzuki_loose'], SELF_RING) == canon('CC1(O)Cc2ccccc2O1')
    assert not E.fire(canon('CC(=O)CCl'), 'suzuki').acted
    # 10 hex-5-en-2-one: C=C goes single, C=O to C=CH2, OH on the =CH2 end only
    assert go('CC(=O)CCC=C', ['hydrogenation', 'wittig', 'hydroborate']) == canon('OCC(C)CCCC')


def test_molecule_table():
    mols = molecules.game_molecules()
    assert not molecules.failed_molecules()
    assert len(mols) >= 73
    assert all(m.rounds for m in mols)
    for m in mols:
        assert Chem.MolFromSmiles(m.smiles) is not None
    gen = molecules.generate(21, random.Random(2), 3, 'ring')
    assert len(gen) == 3 and all(not g.from_game and g.heavy == 21 for g in gen)


def test_every_game_molecule_zips_with_the_six():
    """docs/CASCADES.md: 'Every one can zip with the starting reagents' (some line of three sets a chain off)."""
    eng = Engine()
    bad = []
    for m in molecules.game_molecules():
        best = 0
        for line in __import__('itertools').product(SIX, repeat=3):
            t = eng.run_line(m.canonical, line, SELF_RING)
            best = max(best, len(t.steps))
            if best >= 1:
                break
        if best < 1:
            bad.append(m.canonical)
    assert not bad, bad


def test_all_pool_reactions_run_on_all_game_molecules_and_balance():
    eng = Engine(check_balance=True)
    for m in molecules.game_molecules()[::4]:
        for name in REACTIONS:
            eng.fire(m.canonical, name)


# ---------------------------------------------------------------------------------------------------------------
# the check against the game (slow)
# ---------------------------------------------------------------------------------------------------------------

def game_check(seeds=6, players=('random', 'greedy_steps')):
    res = game_comparison(Engine(), seeds=seeds, players=players)
    print('\nThe six and ring on the game\'s molecules (each molecule weighted as the rounds deal it), three turns a round:')
    print('%-14s %10s %10s %10s %10s %10s' % ('player', 'mean steps', '1+', '3+', '6+', '10+'))
    for pn, d in res.items():
        print('%-14s %10.2f %9.0f%% %9.0f%% %9.1f%% %9.1f%%' % (pn, d['mean'], 100 * d[1], 100 * d[3], 100 * d[6], 100 * d[10]))
    print('game (docs/CASCADES.md, RIG.md): mean 2.4 steps a turn on the structural screen; the median player had a chain on 90 in\n'
          '100 turns, 3 or more on 56, 6 or more on 12.5 (24 with pieces), 10 or more on 0 (2 with pieces)')
    return res


def main(argv):
    pat = None
    if '-k' in argv:
        pat = argv[argv.index('-k') + 1]
    tests = [(n, f) for n, f in sorted(globals().items()) if n.startswith('test_') and callable(f)
             and (pat is None or pat in n)]
    fails = 0
    for n, f in tests:
        try:
            f()
            print('PASS', n)
        except Exception:
            fails += 1
            print('FAIL', n)
            traceback.print_exc()
    n_cases = len(R) + len(S)
    print('\n%d tests, %d failed; %d worked cases (%d reactions, %d self-reactions)' % (len(tests), fails, n_cases, len(R), len(S)))
    if '--game' in argv:
        game_check(players=('random', 'greedy_steps', 'lookahead') if '--lookahead' in argv else ('random', 'greedy_steps'))
    return 1 if fails else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
