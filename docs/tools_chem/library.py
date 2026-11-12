"""The reactions and self-reactions of Overreact, written as reaction SMARTS and graph queries on RDKit molecules.

The final set (docs/tools_chem/FINAL.md).  Chosen from three joint tunings (A, B, C) by running them on the game's molecules.

REACTIONS (what the player fires), `source`:
  'built'  the six the player starts with, exactly as the game has them (apps/steam/js/react/rules.js, MODE.zip = true,
           MODE.co2 = true): hydrate, hydroborate, dehydrate, oxidize, reduce, grow.
  'final'  the twelve that are unlocked later.  Each one makes a group that a self-reaction takes, or takes away one.
SELF_RULES (what the molecule does by itself):
  ring     exactly as built (the game's `lactol`, called zip in play).
  the others are docs/SELF_REACTIONS.md, rewritten where the chemistry check or the measures asked for it.
Order and limits (engine rules the game has to carry; the engine reads them from the rule objects):
  rule.prio      0 runs before 1 before 2 when more than one fits; within one prio the nearest pair goes first.
                 Rules on the rarer groups (Cl, NH2, SH, COOH, epoxide) are 0; ring is 2 so the others take a C=O first.
  rule.per_turn  most steps of that kind in one turn: dry 1, weld 2, ring 2.

Every rule says what it adds and loses (formulas) so the engine can check the atoms balance on every use.
"""
from collections import Counter

from rdkit import Chem

from chemlib import (SmartsStep, SmartsSelfRule, GraphRule, Reaction, RepeatStep, pair_sites, matches, cnbr, nbr, hs,
                     end_dist, hetero, is_sp3, cdist, cpath, in_ring, lactol_ring_ok, finish, parse)

# --- shared SMARTS pieces ---------------------------------------------------------------------------------------
# a C=O carbon with only carbon neighbours (so a ketone or aldehyde; not an acid, ester, amide): the game's "reducible"
KC = 'CX3;!$(C(=O)-[!#6])'
# a carbon with a single hetero neighbour at most (the game's "no other hetero on the carbon")
ONE_HET = '!$(C(-[!#6])-[!#6])'
CONJ = '$(C-[#6]=O)'            # next to a carbonyl carbon


# ---------------------------------------------------------------------------------------------------------------
# tie rules the game applies where SMARTS cannot say which carbon (markovnikov, zaitsev), as keys for SmartsStep.choose
# ---------------------------------------------------------------------------------------------------------------

def _pull(mol, c, other):
    """A carbon next to c (not `other`) that itself carries a hetero atom."""
    return any(mol.GetAtomWithIdx(n).GetAtomicNum() == 6 and hetero(mol, n) for n in nbr(mol, c) if n != other)


def _alkene_partner(mol, c):
    for b in mol.GetAtomWithIdx(c).GetBonds():
        if b.GetBondTypeAsDouble() == 2.0:
            o = b.GetOtherAtomIdx(c)
            if mol.GetAtomWithIdx(o).GetAtomicNum() == 6:
                return o
    return None


def tie_markovnikov(anti):
    """Both carbons of a C=C alike in hydrogens and next to no carbonyl: the group goes on the carbon that has no
    hetero-bearing neighbour, then on the one nearer the end of the chain (rules.js markovnikov).  anti reverses it."""
    def key(mol, cand):
        cx = next(iter(cand.gained), None)
        if cx is None:
            return (0, 0)
        other = _alkene_partner(mol, cx)
        k = (1 if _pull(mol, cx, other) else 0, end_dist(mol, cx))
        return (-k[0], -k[1]) if anti else k
    return key


def zaitsev(mol, cand):
    """Dehydrate: toward the neighbour with fewest H, then the one beside another unsaturation, then the one farther from
    the end of the chain (rules.js zaitsev)."""
    pairs = cand.new_double
    if not pairs:
        return (9, 9, 9)
    i, j = pairs[0]
    rem = cand.removed
    c = i if any(n in rem for n in nbr(mol, i)) else j
    beta = j if c == i else i
    conj = any(n != c and mol.GetAtomWithIdx(n).GetAtomicNum() == 6 and not is_sp3(mol, n) for n in nbr(mol, beta))
    return (hs(mol, beta), 0 if conj else 1, -end_dist(mol, beta))


def most_h(mol, cand):
    """Hofmann: toward the neighbour with MORE hydrogens."""
    pairs = cand.new_double
    if not pairs:
        return (9,)
    i, j = pairs[0]
    rem = cand.removed
    c = i if any(n in rem for n in nbr(mol, i)) else j
    beta = j if c == i else i
    return (-hs(mol, beta),)


# ---------------------------------------------------------------------------------------------------------------
# addition across C=C: hydrate / hydroborate (O) and thiol-ene (S)
# ---------------------------------------------------------------------------------------------------------------

def addition_steps(X, anti, adds):
    """X goes on one carbon of every C=C and H on the other.  Markovnikov (anti False): next to a carbonyl on the far
    carbon; else on the carbon with fewer H; else away from a hetero-bearing neighbour; else nearer the chain end.
    anti True is exactly the opposite choice (rules.js: hydroborate takes the carbon markovnikov gives the hydrogen)."""
    steps = []
    # 1. one carbon is next to a carbonyl and the other is not
    if not anti:
        steps.append(SmartsStep('[C;%s:1]=[C;!%s:2]>>[C:1]-[C:2]-%s' % (CONJ, CONJ, X), adds=adds))
    else:
        steps.append(SmartsStep('[C;%s:1]=[C;!%s:2]>>[C:1](-%s)-[C:2]' % (CONJ, CONJ, X), adds=adds))
    # 2. unequal numbers of hydrogens
    for lo, hi in (('H0', 'H1,H2'), ('H1', 'H2')):
        if not anti:
            steps.append(SmartsStep('[C;%s:1]=[C;%s:2]>>[C:1](-%s)-[C:2]' % (lo, hi, X), adds=adds))
        else:
            steps.append(SmartsStep('[C;%s:1]=[C;%s:2]>>[C:1]-[C:2]-%s' % (lo, hi, X), adds=adds))
    # 3. a tie: decided by the neighbours and the end of the chain
    steps.append(SmartsStep('[C:1]=[C:2]>>[C:1](-%s)-[C:2]' % X, adds=adds, choose=tie_markovnikov(anti)))
    return steps


# ---------------------------------------------------------------------------------------------------------------
# the six, as built
# ---------------------------------------------------------------------------------------------------------------

hydrate = Reaction('hydrate', 'Hydrate', addition_steps('O', False, 'H2O'), source='built', family='move OH and C=O',
                   note='Adds water across every C=C. The OH goes on the carbon with fewer H (next to a C=O: on the far carbon).')

hydroborate = Reaction('hydroborate', 'Hydroborate', addition_steps('O', True, 'H2O'), source='built',
                       family='move OH and C=O',
                       note='Adds water across every C=C with the OH on the carbon markovnikov gives the hydrogen (more H). '
                            'Acts on C=C only (MODE.zip).')

dehydrate = Reaction('dehydrate', 'Dehydrate', [SmartsStep(
    '[CX4;%s;!$(C-[#6]~[#8]):1](-[OX2H:2])-[CX4;!H0;!$(C-[!#6]):3]>>[C:1]=[C:3]' % ONE_HET,
    loses='H2O', off={'water': 1}, choose=zaitsev)], source='built', family='move OH and C=O',
    note='OH on a saturated carbon becomes C=C toward the neighbor with fewer H. Not on a carbon with a second hetero '
         'atom (the OH a zip leaves), and not beside a carbon that carries O (1,2-diols, alpha-hydroxy ketones).')

oxidize = Reaction('oxidize', 'Oxidize', [
    SmartsStep('[CX4;!H0;%s:1]-[OX2H:2]>>[C:1]=[O:2]' % ONE_HET, loses='H2', off={'hydrogen': 1}),
    # RULE.co2 = true: a C=C at the very end of a chain (CH=CH2) loses its end carbon as carbon dioxide, C=O is left
    SmartsStep('[CH2D1:1]=[CH1D2:2]>>[C:2]=O', adds='O4', loses='CH2O3', off={'carbon dioxide': 1}),
], source='built', family='move OH and C=O',
    note='Every OH whose carbon has an H becomes C=O (hydrogen off). A chain-end C=C loses its end carbon as carbon dioxide '
         'and leaves C=O on the next carbon.')

reduce_ = Reaction('reduce', 'Reduce', [SmartsStep('[%s;H1,H2:1]=[O:2]>>[C:1]-[O:2]' % KC, adds='H2')], source='built',
                   family='move OH and C=O',
                   note='A C=O at the end of a chain (an aldehyde: the carbon has an H) becomes OH (MODE.zip).')

grow = Reaction('grow', 'Grow', [SmartsStep('[%s:1]=[O:2]>>[C:1](-[O:2])-C-C=C' % KC, adds='C3H6')], size='grow',
                source='built', family='move OH and C=O',
                note='Every C=O becomes C-OH with a three-carbon arm CH2-CH=CH2 (allyl).')

SIX = ('hydrate', 'hydroborate', 'dehydrate', 'oxidize', 'reduce', 'grow')
# the game's order in path.js RUNG.start: hydrate, oxidize (pcc), grow (allyl), hydroborate (bh3), dehydrate, reduce (nabh4)

# ---------------------------------------------------------------------------------------------------------------
# ---------------------------------------------------------------------------------------------------------------
# the twelve reactions after the six
# ---------------------------------------------------------------------------------------------------------------

KET = 'CX3H0;!$(C(=O)-[!#6])'            # a ketone carbon
ALD = 'CX3H1;!$(C(=O)-[!#6])'            # an aldehyde carbon (chain-end C=O)

hwe = Reaction('hwe', 'Horner-Wadsworth-Emmons (acetonyl phosphonate)', [
    SmartsStep('[CX3;$(C(=O)[CH3]),$([CX3H1]);!$(C(=O)-[!#6]);!$(C-[#6]=[#6]):1]=[O:2]>>[C:1]=C-C(=O)C',
               adds='C3H4O', loses='O')],
    family='make C=O and C=C',
    note='Every aldehyde and every methyl ketone (CH3-C=O) that is not already beside a C=C becomes C=CH-C(=O)-CH3: a C=C '
         'beside a new ketone (phosphonate carbanion; hindered and conjugated ketones do not react).')

dihydroxylation = Reaction('dihydroxylation', 'Dihydroxylation',
                           [SmartsStep('[C:1]=[C:2]>>[C:1](-O)-[C:2]-O', adds='H2O2')], family='make OH',
                           note='Every C=C becomes two OH on its two carbons (osmium tetroxide).')

ozonolysis = Reaction('ozonolysis', 'Ozonolysis', [SmartsStep('[C:1]=[C:2]>>([C:1]=O.[C:2]=O)', adds='O2')],
                      family='make C=O',
                      note='Every C=C is cut and each cut carbon becomes C=O. A chain keeps its longer piece (the shorter one, '
                           'formaldehyde for a chain-end C=C, is counted as a piece), a ring opens.')

permanganate = Reaction('permanganate', 'Strong oxidation (hot permanganate)', [
    SmartsStep('[CH2D1:1]=[CH1D2:2]>>[C:2](=O)O', adds='O5', loses='CH2O3', off={'carbon dioxide': 1}),
    SmartsStep('[%s:1]=[O:2]>>[C:1](=[O:2])O' % ALD, adds='O'),
    SmartsStep('[CH2X4;D2;$(C-[#6]):1]-[OX2H:2]>>[C:1](=O)-[O:2]', adds='O', loses='H2', off={'hydrogen': 1}),
], family='make COOH',
    note='Every chain-end C=C, every aldehyde and every chain-end OH (CH2-OH) becomes COOH; a chain-end C=C loses its end '
         'carbon as carbon dioxide.')

ritter = Reaction('ritter', 'Ritter amination', addition_steps('N', False, 'NH3'), family='make NH2',
                     note='Every C=C takes NH2 and H, Markovnikov (acetonitrile in strong acid gives the amide on the carbon '
                          'with fewer H, boiling acid frees the amine; net ammonia added).')

thiolene = Reaction('thiolene', 'Thiol-ene', addition_steps('S', True, 'H2S'), family='make SH',
                    note='Every C=C takes SH, anti-Markovnikov: on the carbon with MORE H (thioacetic acid and light, then '
                         'hydrolysis: net H2S).')

chlorination = Reaction('chlorination', 'Chlorination',
                        [SmartsStep('[CX4;!H0;%s:1]-[OX2H]>>[C:1]-Cl' % ONE_HET, adds='SOCl2', loses='HClO2S',
                                    off={'acid fumes': 1})], family='make Cl',
                        note='Every primary or secondary alcohol OH becomes Cl (thionyl chloride; SO2 and HCl come off as acid '
                             'fumes). Tertiary OH, phenol OH, COOH and hemiketal OH are left.')

cyanohydrin = Reaction('cyanohydrin', 'Cyanohydrin route (cyanide, then acid)', [
    SmartsStep('[CX3;$(C(=O)[CH3]),$([CX3H1]);!$(C(=O)-[!#6]):1]=[O:2]>>[C:1](-[O:2])C(=O)O', adds='CH5NO2', loses='H3N',
               off={'ammonia': 1})], family='make COOH',
    note='Every aldehyde and methyl ketone (CH3-C=O) becomes C(OH)-COOH, one carbon longer (cyanide adds to the C=O, boiling '
         'acid turns the nitrile to COOH). Ammonia leaves.')

hofmann = Reaction('hofmann', 'Hofmann elimination', [SmartsStep(
    '[CX4;%s:1](-[NX3H2:2])-[CX4;!H0;!$(C-[!#6]):3]>>[C:1]=[C:3]' % ONE_HET, adds='C3H8O', loses='C3H11NO',
    off={'trimethylamine': 1, 'water': 1}, choose=most_h)], family='make C=C',
    note='Every NH2 on a saturated carbon leaves as trimethylamine and water and a C=C forms toward the neighbor with MORE H.')

chugaev = Reaction('chugaev', 'Chugaev elimination', [SmartsStep(
    '[CX4;%s;!$(C-[#6]~[#8]):1](-[OX2H:2])-[CX4;!H0;!$(C-[!#6]):3]>>[C:1]=[C:3]' % ONE_HET,
    adds='C2H3IS2', loses='C2H5IOS2', off={'sulfur': 1}, choose=most_h)], family='make C=C',
    note='Every OH on a saturated carbon becomes C=C toward the neighbor with MORE H (the opposite of dehydrate): carbon '
         'disulfide and methyl iodide make the xanthate, heat drives it off with carbonyl sulfide and methanethiol (sulfur).')

hydroformylation = Reaction('hydroformylation', 'Hydroformylation', addition_steps('C=O', True, 'CH2O'),
                            family='make C=O', note='Every C=C takes CHO and H, anti-Markovnikov (carbon monoxide and hydrogen, '
                                                    'rhodium): the CHO goes on the carbon with MORE H, one carbon longer.')

epoxidation = Reaction('epoxidation', 'Epoxidation', [SmartsStep('[C:1]=[C:2]>>[C:1]1[C:2]O1', adds='O')],
                       family='make epoxide', note='Every C=C becomes a three-ring with O (peracid).')


# ---------------------------------------------------------------------------------------------------------------
# self-reactions
# ---------------------------------------------------------------------------------------------------------------
def _ring_find(mol):
    """The game's lactol (zip).  An OH whose carbon is 3 or 4 carbons from the carbon of a C=O closes a ring through its
    oxygen.  The OH may be on a benzene ring.  Either part in a ring: the new ring may share at most one bond with a
    ring of 8 or fewer atoms.  The OH a zip just left (its carbon also carries a ring-type oxygen) goes first, then the
    nearest C=O, then the molecule's own order."""
    ks = matches(mol, '[%s:1]=[OX1:2]' % KC)
    ohs = matches(mol, '[OX2H:1]-[$([CX4]),$(c):2]')
    if not ks or not ohs:
        return []
    out = []
    for ik, k in enumerate(ks):
        kc = k[1]
        dist = cdist(mol, kc, 4)
        for io, s in enumerate(ohs):
            sc = s[2]
            if sc == kc:
                continue
            d = dist.get(sc)
            if d is None or d < 3 or d > 4:
                continue
            if (in_ring(mol, kc) or in_ring(mol, sc)) and not lactol_ring_ok(mol, sc, kc, 8):
                continue
            front = 0
            for n in nbr(mol, sc):
                a = mol.GetAtomWithIdx(n)
                if n != s[1] and a.GetAtomicNum() == 8 and a.GetDegree() == 2 and all(
                        x.GetAtomicNum() == 6 for x in a.GetNeighbors()):
                    front = 1
            out.append({'dist': d, 'tie': (ik, io), 'sort': (-front, d, ik, io), 'k': k, 'oh': s})
    return out


def _ring_edit(rw, s):
    kc, ko = s['k'][1], s['k'][2]
    o = s['oh'][1]
    rw.GetBondBetweenAtoms(kc, ko).SetBondType(Chem.BondType.SINGLE)
    rw.AddBond(o, kc, Chem.BondType.SINGLE)


ring = GraphRule('ring', _ring_find, _ring_edit, label='Ring', source='built',
                 doc='An OH whose carbon is 3 or 4 carbons from the carbon of a C=O closes a ring of 5 or 6 through its oxygen; '
                     'the C=O becomes C-OH (a hemiketal). It is loose: it opens again when the turn ends.')



flip = SmartsSelfRule('flip', '[C:1](-[OX2H:2])=[C:3]>>[C:1](=[O:2])-[C:3]', 0, label='Flip',
                      doc='An OH on a carbon of a C=C (an enol) becomes C=O and the C=C goes single.')

shift = SmartsSelfRule('shift', '[%s:1](=[O:2])-[CX4;!H0:3]-[CX3;!$(C-[#6]=O):4]=[C;!$(C-[#6]=O):5]>>'
                                '[C:1](=[O:2])-[C:3]=[C:4]-[C:5]' % KC, 2, label='Shift',
                       doc='A C=C whose near carbon is two carbons from a C=O slides one carbon toward it, so it sits beside '
                           'the C=O. Only when the C=C is not already beside a C=O (that stops it sliding back).')


def _tuck_find(mol):
    return pair_sites(mol, '[%s:1](=[O:2])-[C:3]=[C:4]' % KC, '[OX2H:5]-[CX4;%s:6]' % ONE_HET, 4, 6, 3, 4, ring='lactol')


def _tuck_edit(rw, s):
    c3, c4, o = s['A'][3], s['A'][4], s['B'][5]
    rw.GetBondBetweenAtoms(c3, c4).SetBondType(Chem.BondType.SINGLE)
    rw.AddBond(o, c4, Chem.BondType.SINGLE)


tuck = GraphRule('tuck', _tuck_find, _tuck_edit, label='Tuck',
                 doc='A C=C beside a C=O (an enone) and an OH 3 or 4 carbons from the far carbon: the OH adds to the far carbon, '
                     'closing a ring of 5 or 6 through O, and the C=C goes single (oxa-Michael).')


def _weld_find(mol):
    return pair_sites(mol, '[%s:1](=[O:2])-[CX4;!R;!H0:3]' % KC, '[%s;!R:4]=[O:5]' % KC, 3, 4, 4, 5, ring='any')


def _weld_edit(rw, s):
    a, c2, o2 = s['A'][3], s['B'][4], s['B'][5]
    rw.GetBondBetweenAtoms(c2, o2).SetBondType(Chem.BondType.SINGLE)
    rw.AddBond(a, c2, Chem.BondType.SINGLE)


weld = GraphRule('weld', _weld_find, _weld_edit, label='Weld',
                 doc='The carbon beside one C=O joins the carbon of a second C=O 4 or 5 carbons away (aldol): a ring of 5 or 6 '
                     'closes and the second C=O becomes C-OH. The first C=O stays (the game keeps it).', source='built-draft')


def _snap_find(mol):
    out = []
    dbls = [(b.GetBeginAtomIdx(), b.GetEndAtomIdx()) for b in mol.GetBonds()
            if b.GetBondTypeAsDouble() == 2.0 and b.GetBeginAtom().GetAtomicNum() == 6 and b.GetEndAtom().GetAtomicNum() == 6]
    if len(dbls) < 3:
        return out

    def isdbl(a, b):
        bd = mol.GetBondBetweenAtoms(a, b)
        return bd is not None and bd.GetBondTypeAsDouble() == 2.0
    for ia, (x, y) in enumerate(dbls):
        for c1, c2 in ((x, y), (y, x)):
            for c3 in cnbr(mol, c2):
                if c3 == c1 or isdbl(c2, c3):
                    continue
                for c4 in cnbr(mol, c3):
                    if c4 in (c2, c1) or not isdbl(c3, c4):
                        continue
                    for ib, (u, v) in enumerate(dbls):
                        if ib == ia or {u, v} & {c1, c2, c3, c4}:
                            continue
                        for ca, cb in ((u, v), (v, u)):
                            p = cpath(mol, c4, ca, 5)
                            if not p or len(p) < 5 or c3 in p or cb in p or c1 in p or mol.GetBondBetweenAtoms(c1, cb):
                                continue
                            out.append({'dist': len(p) - 1, 'tie': (ia, ib), 'c': (c1, c2, c3, c4, ca, cb)})
    return out


def _snap_edit(rw, s):
    c1, c2, c3, c4, ca, cb = s['c']
    S, D = Chem.BondType.SINGLE, Chem.BondType.DOUBLE
    rw.GetBondBetweenAtoms(c1, c2).SetBondType(S)
    rw.GetBondBetweenAtoms(c3, c4).SetBondType(S)
    rw.GetBondBetweenAtoms(c2, c3).SetBondType(D)
    rw.GetBondBetweenAtoms(ca, cb).SetBondType(S)
    rw.AddBond(c1, cb, S)
    rw.AddBond(c4, ca, S)


snap = GraphRule('snap', _snap_find, _snap_edit, label='Snap',
                 doc='Two C=C side by side (C1=C2-C3=C4) and a third C=C whose near carbon is 4 or 5 bonds from C4 close a six-ring '
                     '(an intramolecular Diels-Alder); one C=C is left, between C2 and C3.', source='built-draft')




dry = SmartsSelfRule('dry', '[%s:1](=[O:2])-[CX4;!H0:3]-[CX4;!$(C(-[!#6])-[!#6]):4]-[OX2H:5]>>[C:1](=[O:2])-[C:3]=[C:4]' % KC, 2,
                     off={'water': 1}, loses='H2O', label='Dry',
                     doc='An OH two carbons from a C=O leaves as water and a C=C forms beside the C=O (aldol dehydration). Not an OH on a '
                         'carbon that also carries another O (the OH a ring leaves). At most once a turn.')


def _knit_find(mol):
    return pair_sites(mol, '[%s:1]=[OX1:2]' % KC, '[NX3H2:3]-[CX4:4]', 1, 4, 3, 4, ring='lactol')


def _knit_edit(rw, s):
    c, n = s['A'][1], s['B'][3]
    rw.GetBondBetweenAtoms(c, s['A'][2]).SetBondType(Chem.BondType.SINGLE)
    rw.AddBond(c, n, Chem.BondType.SINGLE)
    # the O of the C=O stays on the carbon as OH


knit = GraphRule('knit', _knit_find, _knit_edit, label='Knit',
                 doc='An NH2 3 or 4 carbons from a C=O adds to it and closes a ring of 5 or 6 through N; the C=O becomes C-OH '
                     '(a carbinolamine, the nitrogen twin of ring). Loose: it opens again when the turn ends.')


def _seal_find(mol):
    return pair_sites(mol, '[CX3:1](=[OX1:2])(-[OX2H:3])-[#6]', '[OX2H,NX3H2,SX2H;$(*-[CX4]):4]-[CX4;%s:5]' % ONE_HET, 1, 5, 3, 4,
                      ring='lactol')


def _seal_edit(rw, s):
    c, oh_acid, o = s['A'][1], s['A'][3], s['B'][4]
    rw.AddBond(o, c, Chem.BondType.SINGLE)
    rw.RemoveAtom(oh_acid)


seal = GraphRule('seal', _seal_find, _seal_edit, off={'water': 1}, loses='H2O', label='Seal',
                 doc='A COOH and an OH, NH2 or SH 3 or 4 carbons apart (counting the acid carbon) join as a lactone, lactam or '
                     'thiolactone ring of 5 or 6 atoms; water comes off.')


def _cap_find(mol):
    return pair_sites(mol, '[SX2H:1]-[CX4:2]', '[%s:3]=[OX1:4]' % KC, 2, 3, 3, 4, ring='lactol')


def _cap_edit(rw, s):
    sulf, c = s['A'][1], s['B'][3]
    rw.GetBondBetweenAtoms(c, s['B'][4]).SetBondType(Chem.BondType.SINGLE)
    rw.AddBond(sulf, c, Chem.BondType.SINGLE)


cap = GraphRule('cap', _cap_find, _cap_edit, label='Cap',
                doc='An SH 3 or 4 carbons from a C=O adds to it and closes a ring of 5 or 6 through S; the C=O becomes C-OH '
                    '(a thiohemiketal, the sulfur twin of ring).')


def _close_find(mol):
    a = pair_sites(mol, '[Cl:1]-[CX4:2]', '[OX2H,NX3H2,SX2H;$(*-[CX4]):3]-[CX4;%s:4]' % ONE_HET, 2, 4, 3, 5, ring='lactol')
    b = pair_sites(mol, '[Cl:1]-[CX4:2]', '[OX2H:3]-[CX3:4]=[OX1]', 2, 4, 3, 5, ring='lactol')
    return a + b


def _close_edit(rw, s):
    cl, o = s['A'][1], s['B'][3]
    c = s['A'][2]
    rw.AddBond(o, c, Chem.BondType.SINGLE)
    rw.RemoveAtom(cl)


close = GraphRule('close', _close_find, _close_edit, off={'acid fumes': 1}, loses='HCl', label='Close',
                  doc='A Cl and an OH, NH2, SH or COOH 3 to 5 carbons apart close a ring of 5 to 7 atoms through O, N or S (Williamson '
                      'ether, amine, thioether or lactone by alkylation, base); HCl comes off as acid fumes.')

def _open_find(mol):
    return pair_sites(mol, '[C:1]1-[O:2]-[C:3]1', '[OX2H:4]-[CX4;%s:5]' % ONE_HET, 1, 5, 3, 4, ring='lactol')


def _open_edit(rw, s):
    ca, oe = s['A'][1], s['A'][2]
    oh = s['B'][4]
    rw.RemoveBond(ca, oe)
    rw.AddBond(oh, ca, Chem.BondType.SINGLE)


open_ = GraphRule('open', _open_find, _open_edit, label='Open',
                  doc='An OH 3 or 4 carbons from a carbon of an epoxide attacks that carbon, closing a ring of 5 or 6 through O; '
                      'the epoxide opens and its other carbon is left with an OH (acid-catalysed epoxy-alcohol cyclization).')

fold = SmartsSelfRule('fold', '[C;H0,H1:1]1-[O:2]-[C;H1:3]1>>[C:1]-[C:3]=[O:2]', 9, label='Fold',
                      doc='An epoxide with a carbon on both ends turns into a C=O (Meinwald rearrangement): the O stays on one '
                          'carbon as C=O and an H moves to the other. A chain-end epoxide is left for open. Runs last of its kind.')


# ---------------------------------------------------------------------------------------------------------------
# the registry
# ---------------------------------------------------------------------------------------------------------------
REACTIONS = {r.name: r for r in [
    hydrate, hydroborate, dehydrate, oxidize, reduce_, grow,
    hwe, dihydroxylation, ozonolysis, permanganate, ritter, thiolene, chlorination, cyanohydrin, hofmann, chugaev,
    hydroformylation, epoxidation]}

# the order the engine looks in (earlier wins a tie of prio and distance)
SELF_ORDER = ['seal', 'close', 'knit', 'cap', 'open', 'fold', 'dry', 'flip', 'shift', 'tuck', 'weld', 'snap', 'ring']
SELF_RULES = {r.name: r for r in [ring, dry, flip, shift, tuck, weld, snap, knit, seal, cap, close, open_, fold]}
for _n in ('seal', 'close', 'knit', 'cap', 'open'):
    SELF_RULES[_n].prio = 0
SELF_RULES['ring'].prio = 2
PER_TURN = {'dry': 1, 'weld': 2, 'ring': 2}
for _n, _c in PER_TURN.items():
    SELF_RULES[_n].per_turn = _c
SELF_RING = ('ring',)                    # the game as built before this set
START_SELF = ('ring', 'dry')             # what the player holds at the start
SELF_TIER1 = START_SELF
SELF_ALL = tuple(SELF_ORDER)

POOL = SIX + ('hwe', 'dihydroxylation', 'ozonolysis', 'permanganate', 'ritter', 'thiolene', 'chlorination', 'cyanohydrin',
              'hofmann', 'chugaev', 'hydroformylation', 'epoxidation')
POOL19 = POOL                            # the old name

def reopen(mol):
    """A ring a self-reaction closed loosely (a carbon with an OH and, beside it, an ether oxygen in a ring) opens again:
    the ring oxygen takes the H and the OH becomes the C=O it was.  Repeated until none is left."""
    n = 0
    for _ in range(80):
        ms = matches(mol, '[CX4:1](-[OX2H:2])-;@[OX2,SX2,NX3;D2:3]-[#6]')
        if not ms:
            break
        m = ms[0]
        rw = Chem.RWMol(mol)
        rw.RemoveBond(m[1], m[3])
        rw.GetBondBetweenAtoms(m[1], m[2]).SetBondType(Chem.BondType.DOUBLE)
        out = finish(rw)
        if out is None:
            break
        mol = out
        n += 1
    return mol, n
