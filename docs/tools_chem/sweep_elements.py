"""sweep_elements.py: the elements beyond carbon and oxygen, each with candidate reagents and reflexes, for the sweeps.

N, S and Cl are in the game now (ritter, thiolene, chlorination; knit, cap, close).  Br, F, P, I, B, Si and Se are candidates.
Every candidate reagent is real chemistry written with the engine's own pieces (chemlib.SmartsStep, GraphRule, pair_sites),
because the game's rule is that dealt reactions stay real.  Nothing here is in the game.

An element is used in a sweep as a Mod ('elem:Br', or 'elem:Br:rise' / 'elem:Br:flat' / 'elem:Br:none' for the deal curve):
  * its reagents join the registry (the experiment puts them in the carried set), its reflexes are held from round one;
  * the deal: with chance p(round) the first of the two molecules offered carries the element (one group of the dealt molecule
    is rewritten as the element's group).  'rise': p climbs with the round (ruling AF2: rarer elements become more common as the
    rounds get deeper).  'flat': the same average chance in every round.  'none': never.
"""
from rdkit import Chem

import chemlib
from chemlib import SmartsStep, GraphRule, Reaction, RepeatStep, pair_sites, parse
import library as L
import sweep_core as SC

ONE_HET, KC = L.ONE_HET, L.KC
NUC = '[OX2H,NX3H2,SX2H;$(*-[CX4]):3]-[CX4;%s:4]' % ONE_HET


def _halide_close(name, X, fumes):
    """A halide and an OH, NH2 or SH 3 to 5 carbons apart close a ring of 5 to 7 (as library.close does for Cl)."""
    def find(mol):
        return pair_sites(mol, '[%s:1]-[CX4:2]' % X, NUC, 2, 4, 3, 5, ring='lactol')

    def edit(rw, s):
        rw.AddBond(s['B'][3], s['A'][2], Chem.BondType.SINGLE)
        rw.RemoveAtom(s['A'][1])
    r = GraphRule(name, find, edit, off={fumes: 1}, loses='H' + X, label=name, source='sweep',
                  doc='A C-%s and an OH, NH2 or SH 3 to 5 carbons apart close a ring of 5 to 7 atoms; H%s comes off.' % (X, X))
    r.prio = 0
    return r


# --- Br ---------------------------------------------------------------------------------------------------------
hydrobromination = Reaction('hydrobromination', 'Hydrobromination', L.addition_steps('Br', False, 'HBr'), source='sweep',
                            note='HBr adds across every C=C, the Br on the carbon with fewer H (Markovnikov).')
close_br = _halide_close('close_br', 'Br', 'acid fumes')

# --- I ----------------------------------------------------------------------------------------------------------


def _iodo_find(mol):
    return pair_sites(mol, '[CX3:1]=[CX3:2]', '[OX2H:3]-[CX4;%s:4]' % ONE_HET, 1, 4, 3, 4, ring='lactol')


def _iodo_edit(rw, s):
    c1, c2, o = s['A'][1], s['A'][2], s['B'][3]
    rw.GetBondBetweenAtoms(c1, c2).SetBondType(Chem.BondType.SINGLE)
    rw.AddBond(o, c1, Chem.BondType.SINGLE)
    i = rw.AddAtom(Chem.Atom(53))
    rw.AddBond(c2, i, Chem.BondType.SINGLE)


_iodo = GraphRule('iodoether', _iodo_find, _iodo_edit, adds='I2', loses='HI', label='iodoether', source='sweep')
iodocyclization = Reaction('iodocyclization', 'Iodocyclization', [RepeatStep(_iodo)], source='sweep',
                           note='Iodine on a C=C with an OH 3 or 4 carbons away: the OH closes a ring of 5 or 6 on the near carbon and '
                                'the far carbon takes the iodine (iodoetherification).')
close_i = _halide_close('close_i', 'I', 'acid fumes')

# --- F ----------------------------------------------------------------------------------------------------------
deoxyfluorination = Reaction('deoxyfluorination', 'Deoxyfluorination', [
    SmartsStep('[CX4;!H0;%s:1]-[OX2H]>>[C:1]-F' % ONE_HET, adds='HF', loses='H2O')], source='sweep',
    note='Every primary or secondary OH becomes F (DAST).  A C-F is inert: nothing in the game acts on it again.')

# --- P ----------------------------------------------------------------------------------------------------------
phosphorylation = Reaction('phosphorylation', 'Phosphorylation', [
    SmartsStep('[CX4;!H0;%s:1]-[OX2H:2]>>[C:1]-[O:2]P(=O)(O)O' % ONE_HET, adds='HPO3')], source='sweep',
    note='Every primary or secondary OH becomes a phosphate ester C-O-P(=O)(OH)2 (POCl3, then water).')


def _pring_find(mol):
    return pair_sites(mol, '[PX4:1](=O)(-[OX2H:2])(-[OX2:5])-[OX2H]', '[OX2H:3]-[CX4;%s:4]' % ONE_HET, 5, 4, 0, 0, ring='any') or \
        _pring_pairs(mol)


def _pring_pairs(mol):
    out = []
    for ia, a in enumerate(chemlib.matches(mol, '[PX4:1](=O)(-[OX2H:2])-[OX2:5]-[CX4:6]')):
        d = chemlib.cdist(mol, a[6], 3)
        for ib, b in enumerate(chemlib.matches(mol, '[OX2H:3]-[CX4;%s:4]' % ONE_HET)):
            dd = d.get(b[4])
            if dd is not None and 1 <= dd <= 2 and b[3] not in a.values():
                out.append({'A': a, 'B': b, 'dist': dd, 'tie': (ia, ib)})
    return out


def _pring_edit(rw, s):
    rw.AddBond(s['B'][3], s['A'][1], Chem.BondType.SINGLE)
    rw.RemoveAtom(s['A'][2])


pring = GraphRule('pring', _pring_pairs, _pring_edit, off={'water': 1}, loses='H2O', label='pring', source='sweep',
                  doc='A phosphate ester and an OH one or two carbons along close a cyclic phosphate of 5 or 6 atoms (as in cyclic '
                      'AMP); water comes off.')
pring.prio = 0

# --- B ----------------------------------------------------------------------------------------------------------
borylation = Reaction('borylation', 'Hydroboration (boron kept)', L.addition_steps('B(O)O', True, 'H3BO2'), source='sweep',
                      note='Every C=C takes a boronic acid B(OH)2 on the carbon with more H (hydroboration, then water in place of '
                           'peroxide).')


def _bring_find(mol):
    return pair_sites(mol, '[BX3:1](-[OX2H:2])(-[OX2H])-[CX4:5]', '[OX2H:3]-[CX4;%s:4]' % ONE_HET, 5, 4, 2, 3, ring='lactol')


def _bring_edit(rw, s):
    rw.AddBond(s['B'][3], s['A'][1], Chem.BondType.SINGLE)
    rw.RemoveAtom(s['A'][2])


bring = GraphRule('bring', _bring_find, _bring_edit, off={'water': 1}, loses='H2O', label='bring', source='sweep',
                  doc='A boronic acid and an OH 2 or 3 carbons away close a cyclic boronic ester (an oxaborole or oxaborinane ring); water '
                      'comes off.')
bring.prio = 0

# --- Si ---------------------------------------------------------------------------------------------------------
silylation = Reaction('silylation', 'Silylation', [
    SmartsStep('[CX4;!H0;%s:1]-[OX2H:2]>>[C:1]-[O:2][Si](C)(C)C' % ONE_HET, adds='C3H8Si')], source='sweep',
    note='Every primary or secondary OH becomes a silyl ether O-SiMe3 (chlorotrimethylsilane, base).  A protected OH takes no '
         'part in anything.')

# --- Se ---------------------------------------------------------------------------------------------------------
selenoxide = Reaction('selenoxide', 'Selenoxide elimination', [
    SmartsStep('[%s:1](=[O:2])-[CX4;!H0:3]-[CX4;!H0;!$(C-[!#6]):4]>>[C:1](=[O:2])-[C:3]=[C:4]' % KC, adds='O', loses='H2O',
               off={'selenium': 1}, max_sites=8)], source='sweep',
    note='A C=O with CH-CH beside it becomes C=O beside C=C (an enone): phenylselenyl chloride on the enolate, then peroxide; the '
         'selenium leaves as PhSeOH.')

# --- the table --------------------------------------------------------------------------------------------------
# group: reaction SMARTS that rewrites one OH (or C=C) of a dealt molecule as the element's group, for the deal
# tier: how rare the element is (the deal curve)
ELEMENTS = {
    'N': dict(reagents=('ritter',), reflexes=('knit',), group='[CX4;!H0;%s:1]-[OX2H]>>[C:1]-N' % ONE_HET, tier='common', now=True),
    'S': dict(reagents=('thiolene',), reflexes=('cap',), group='[CX4;!H0;%s:1]-[OX2H]>>[C:1]-S' % ONE_HET, tier='common', now=True),
    'Cl': dict(reagents=('chlorination',), reflexes=('close',), group='[CX4;!H0;%s:1]-[OX2H]>>[C:1]-Cl' % ONE_HET, tier='common', now=True),
    'Br': dict(reagents=('hydrobromination',), reflexes=('close_br',), group='[CX4;!H0;%s:1]-[OX2H]>>[C:1]-Br' % ONE_HET, tier='uncommon'),
    'P': dict(reagents=('phosphorylation',), reflexes=('pring',), group='[CX4;!H0;%s:1]-[OX2H:2]>>[C:1]-[O:2]P(=O)(O)O' % ONE_HET, tier='uncommon'),
    'B': dict(reagents=('borylation',), reflexes=('bring',), group='[CX4;!H0;%s:1]-[OX2H]>>[C:1]-B(O)O' % ONE_HET, tier='uncommon'),
    'I': dict(reagents=('iodocyclization',), reflexes=('close_i',), group='[CX4;!H0;%s:1]-[OX2H]>>[C:1]-I' % ONE_HET, tier='rare'),
    'F': dict(reagents=('deoxyfluorination',), reflexes=(), group='[CX4;!H0;%s:1]-[OX2H]>>[C:1]-F' % ONE_HET, tier='rare'),
    'Si': dict(reagents=('silylation',), reflexes=(), group='[CX4;!H0;%s:1]-[OX2H:2]>>[C:1]-[O:2][Si](C)(C)C' % ONE_HET, tier='rare'),
    'Se': dict(reagents=('selenoxide',), reflexes=(), group='[CX4;!H0;%s:1]-[OX2H]>>[C:1]-[SeH]' % ONE_HET, tier='rare'),
}
NEW_REACTIONS = {r.name: r for r in (hydrobromination, iodocyclization, deoxyfluorination, phosphorylation, borylation, silylation, selenoxide)}
NEW_RULES = {r.name: r for r in (close_br, close_i, pring, bring)}
# chance that a round's first molecule carries the element: (round 1, round 9), straight line between
CURVE = {'common': (0.25, 0.65), 'uncommon': (0.08, 0.50), 'rare': (0.02, 0.34)}
ORDER = ('N', 'S', 'Cl', 'Br', 'P', 'B', 'I', 'F', 'Si', 'Se')
SYMBOL = {'N': 'N', 'S': 'S', 'Cl': 'Cl', 'Br': 'Br', 'P': 'P', 'B': 'B', 'I': 'I', 'F': 'F', 'Si': 'Si', 'Se': 'Se'}


def p_of(el, rnd, curve='rise'):
    lo, hi = CURVE[ELEMENTS[el]['tier']]
    if curve == 'none':
        return 0.0
    if curve == 'flat':
        return (lo + hi) / 2.0
    return lo + (hi - lo) * (rnd - 1) / 8.0


class Element(SC.Mod):
    def __init__(self, el, curve='rise'):
        self.el, self.curve = el, curve
        self.d = ELEMENTS[el]
        self.name = 'elem:' + el
        self.chem = '' if self.d.get('now') else 'el' + el
        self.step = SmartsStep(self.d['group'], max_sites=1)
        self.reset()

    def reset(self):
        self.dealt = 0
        self.asked = 0

    def setup(self, G):
        for r in self.d['reagents']:
            if r in NEW_REACTIONS:
                G.reactions[r] = NEW_REACTIONS[r]
        for r in self.d['reflexes']:
            if r in NEW_RULES:
                G.self_rules[r] = NEW_RULES[r]
                if r not in G.near:
                    G.near = (r,) + G.near

    def deal_extra(self, rnd, rng):
        """With the curve's chance: a pool molecule of the round with one OH rewritten as the element's group."""
        self.asked += 1
        if rng.random() >= p_of(self.el, rnd, self.curve):
            return None
        for _ in range(12):
            s = rng.choice(SC.FEED_POOL[rnd])
            r = self.step._one(parse(chemlib.canon(s)))
            if r is not None:
                self.dealt += 1
                return Chem.MolToSmiles(r[0])
        return None

    def report(self):
        return {'elem_dealt': self.dealt, 'elem_asked': self.asked}


def make(arg):
    el, _, curve = arg.partition(':')
    return Element(el, curve or 'rise')


def has_element(smi, el):
    m = Chem.MolFromSmiles(smi)
    return m is not None and any(a.GetSymbol() == el for a in m.GetAtoms())


def selftest():
    cases = [('hydrobromination', 'C=CCCC(C)O', 'CC(Br)CCC(C)O'), ('deoxyfluorination', 'CC(O)CCO', 'CC(F)CCF'),
             ('phosphorylation', 'CC(O)C', 'CC(C)OP(=O)(O)O'), ('borylation', 'C=CCC', 'CCCCB(O)O'),
             ('silylation', 'CCO', 'CCO[Si](C)(C)C'), ('selenoxide', 'CC(=O)CCC', 'CC=CC(C)=O'),
             ('iodocyclization', 'C=CCCC(C)O', 'CC1CCC(CI)O1')]
    ok = True
    for name, a, want in cases:
        got = Chem.MolToSmiles(NEW_REACTIONS[name].fire(parse(chemlib.canon(a))).mol)
        good = got == chemlib.canon(want)
        ok &= good
        print('%-18s %-14s -> %-22s %s' % (name, a, got, 'ok' if good else 'WANTED ' + chemlib.canon(want)))
    for name, a in (('close_br', 'BrCCCCO'), ('close_i', 'ICCCCN'), ('pring', 'OCCCOP(=O)(O)O'), ('bring', 'OCCCB(O)O')):
        rule = NEW_RULES[name]
        sites = rule.find(parse(chemlib.canon(a)))
        got = Chem.MolToSmiles(rule.apply(parse(chemlib.canon(a)), sites[0])[0]) if sites else None
        ok &= got is not None
        print('%-18s %-14s -> %s' % (name, a, got))
    return ok


if __name__ == '__main__':
    print('all ok' if selftest() else 'FAILED')
