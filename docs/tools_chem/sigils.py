"""Sigils on the Overreact engine: the 24 proposed by three designers, each written as an exact edit on the RDKit molecule or
on the round's rules, plus the round loop that fills a sigil and uses it.  The study is in SIGILS_STUDY.md.

A sigil is an object with
  id, name, designer          who proposed it
  fill_text, act_text, cost_text   the designer's words, shortened
  own_fill                    the Fill rule the designer picked (what fills it, how much)
  pos_rule                    'any' the sigil is a fourth slot in the line (designer 1; the common footing); 'first' it is tapped
                              before the line is lined up (designer 3's own rule); 'last' after the reagents
  mode                        'edit' (taps() gives legal edits), 'rewind' (Palingenesis), 'none' (not written)
  taps(smi, cx) -> [Tap]      every legal choice of the player, each with the molecule after it, what it sends off, gold
  post_page(smi, st) -> (smi, bonus_yield)   something that goes on after the sigil is used (Lapis redesign)

The common footing for the test (the same for every sigil, so the sigils are compared and not the designers' fill rules): a
circle of 12 notches, one notch for each reflex step of a page, carried across pages and rounds, empty at the start of a run,
extra notches kept; used as a fourth slot at any place in the line, or before the line.  Each sigil is also run on its own
designer's fill rule and placement ('own').

Player's choice, two ways: act='best' (the best of the legal choices: lines, slot, tap), act='random' (the page's best line as
usual, a random slot, a random legal tap).

Run the study:  python sigils.py study OUTDIR [runs] [workers]      Run the unit checks:  python test_sigils.py
"""
import itertools
import json
import math
import os
import random
import sys
import time
from collections import Counter, defaultdict, namedtuple

from rdkit import Chem

# The study ran on a frozen copy of the engine as it stood on 2026-11-11 before the final reagent set replaced it
# (chemlib, engine, library, molecules, hurdles, hurdle_gen with the nineteen reagents and twelve reflexes of docs/REACTIONS.md
# and docs/SELF_REACTIONS.md).  Point SIGILS_ENGINE_DIR at a folder holding those files to use it; unset, the live files are used.
_D = os.environ.get('SIGILS_ENGINE_DIR')
if _D:
    sys.path.insert(0, _D)

import chemlib
import engine as E
import hurdles as H
import library as L
import molecules as M
from chemlib import parse, canon, nbr, cnbr, hs, cdist, cpath, in_ring, finish, is_sp3

S1, D2 = Chem.BondType.SINGLE, Chem.BondType.DOUBLE
RING_CLOSERS = {'ring', 'tuck', 'weld', 'snap', 'knit', 'seal', 'pair'}
MAXTAP = 4              # legal taps looked at in one slot (sampled when there are more)
LOOK_K = 10             # the look-ahead player looks one page ahead for the K lines that pay most on this page
NTOP = 2                # lines of the page tried with a sigil: the best by yield ...
NRAND = 1               # ... and this many others drawn at random
STAGE = {1: 'early', 2: 'early', 3: 'early', 4: 'middle', 5: 'middle', 6: 'middle', 7: 'late', 8: 'late', 9: 'late'}


# ---------------------------------------------------------------------------------------------------------------
# small helpers on molecules
# ---------------------------------------------------------------------------------------------------------------

class Tap:
    """One legal choice: the molecule after it (canonical SMILES), what it sends off (can be negative: water taken back),
    gold made, and a note.  replay: the page's reagents fire again after the line (Tria Prima with the ammonia homunculus)."""
    __slots__ = ('smi', 'off', 'gold', 'info', 'replay', 'lost')

    def __init__(self, smi, off=None, gold=0, info='', replay=False, lost=0):
        self.smi = smi
        self.off = Counter(off or {})
        self.gold = gold
        self.info = info
        self.replay = replay
        self.lost = lost                # heavy atoms the molecule lost


def _rw(smi):
    return Chem.RWMol(parse(smi))


def _fin(rw):
    try:
        m = finish(rw)
    except Exception:
        return None
    if m is None:
        return None
    s = Chem.MolToSmiles(m)
    return None if '.' in s else s


def _carbons(mol, pred=None):
    return [a.GetIdx() for a in mol.GetAtoms() if a.GetAtomicNum() == 6 and (pred is None or pred(a))]


def _sp3c(a):
    return a.GetAtomicNum() == 6 and not a.GetIsAromatic() and all(b.GetBondTypeAsDouble() == 1.0 for b in a.GetBonds())


def _term_ch3(mol):
    """Chain-end CH3: a carbon with one heavy neighbour, a carbon, and three H."""
    return [a.GetIdx() for a in mol.GetAtoms() if a.GetAtomicNum() == 6 and a.GetDegree() == 1 and a.GetTotalNumHs() == 3
            and a.GetNeighbors()[0].GetAtomicNum() == 6]


def _oh(mol):
    """OH on an sp3 carbon that is not an acid: [(O idx, C idx)]."""
    out = []
    for a in mol.GetAtoms():
        if a.GetAtomicNum() == 8 and a.GetTotalNumHs() == 1 and a.GetDegree() == 1:
            c = a.GetNeighbors()[0]
            if c.GetAtomicNum() == 6 and _sp3c(c):
                out.append((a.GetIdx(), c.GetIdx()))
    return out


def _co(mol):
    """Ketone or aldehyde C=O (the carbon has only carbon neighbours besides the O): [(O idx, C idx)]."""
    out = []
    for a in mol.GetAtoms():
        if a.GetAtomicNum() == 8 and a.GetDegree() == 1:
            b = a.GetBonds()[0]
            c = b.GetOtherAtom(a)
            if b.GetBondTypeAsDouble() == 2.0 and c.GetAtomicNum() == 6 and all(n.GetAtomicNum() == 6 or n.GetIdx() == a.GetIdx()
                                                                          for n in c.GetNeighbors()):
                out.append((a.GetIdx(), c.GetIdx()))
    return out


def _cc_double(mol):
    return [(b.GetBeginAtomIdx(), b.GetEndAtomIdx()) for b in mol.GetBonds()
            if b.GetBondTypeAsDouble() == 2.0 and b.GetBeginAtom().GetAtomicNum() == 6 and b.GetEndAtom().GetAtomicNum() == 6]


def _sample(items, k, key):
    items = list(items)
    if len(items) <= k:
        return items
    return random.Random(key).sample(items, k)


def _add_group(rw, c, kind):
    """Put OH (kind 'OH'), '=O', or another atom on carbon c."""
    if kind == 'OH':
        o = rw.AddAtom(Chem.Atom(8))
        rw.AddBond(c, o, S1)
    elif kind == '=O':
        o = rw.AddAtom(Chem.Atom(8))
        rw.AddBond(c, o, D2)
    return rw


# ---------------------------------------------------------------------------------------------------------------
# fill rules
# ---------------------------------------------------------------------------------------------------------------

class Fill:
    """What lights the circle.  fn(td) -> notches for one page; td has chain, fired, off, smi_in, smi_end.  page_max: at most
    this many a page (designer 2's four strokes)."""

    def __init__(self, name, cap, fn, page_max=None, text=''):
        self.name = name
        self.cap = cap
        self.fn = fn
        self.page_max = page_max
        self.text = text

    def notches(self, td):
        n = float(self.fn(td))
        return min(n, self.page_max) if self.page_max else n


def _places(td, *names):
    return sum(p for r, p in td['fired'] if r in names)


FILL = {
    'steps': Fill('steps', 12, lambda td: len(td['chain']), text='one notch for each reflex step, 12 notches'),
    'steps16': Fill('steps16', 16, lambda td: len(td['chain']), text='one notch for each reflex step, 16 notches'),
    'variety': Fill('variety', 12, lambda td: len(set(td['chain'])) + len([k for k, v in td['off'].items() if v > 0]),
                    text='one notch for each different reflex that fired and each different runoff that came off, once a page; 12'),
    'rings': Fill('rings', 12, lambda td: sum(1 for s in td['chain'] if s in RING_CLOSERS), 4,
                  'one stroke for each ring a reflex closes, 4 a page at most; 12'),
    'places': Fill('places', 12, lambda td: sum(p for r, p in td['fired']), 4,
                   'one stroke for each place a reagent changes, 4 a page at most; 12'),
    'flips': Fill('flips', 12, lambda td: _places(td, 'oxidize', 'reduce', 'grow'), 4,
                  'one stroke for each OH made C=O or C=O made OH by a reagent, 4 a page at most; 12'),
    'kinds_off': Fill('kinds_off', 12, lambda td: len([k for k, v in td['off'].items() if v > 0]), 4,
                      'one stroke for each different kind of runoff, once a page, 4 at most; 12'),
    'water': Fill('water', 12, lambda td: max(0, td['off'].get('water', 0)), 4, 'one stroke for each water off, 4 a page; 12'),
    'newcc': Fill('newcc', 12, lambda td: _places(td, 'dehydrate', 'wittig', 'hofmann') + sum(
        1 for s in td['chain'] if s in ('dry', 'strip', 'pop')), 4, 'one stroke for each C=C made, 4 a page; 12'),
    'past2': Fill('past2', 12, lambda td: max(0, len(td['chain']) - 2), 4,
                  'one stroke for each reflex step past the second on a page, 4 a page at most; 12'),
    'allthree': Fill('allthree', 12, lambda td: 1 if len(td['fired']) >= 3 and all(p > 0 for r, p in td['fired']) else 0, 4,
                     'one stroke for each page on which all three reagents changed something; 12'),
    'runoff8': Fill('runoff8', 8, lambda td: sum(max(0, td['off'].get(k, 0)) for k in ('water', 'hydrogen', 'carbon dioxide')),
                    text='one notch for each water, hydrogen or carbon dioxide that leaves; 8'),
}


# ---------------------------------------------------------------------------------------------------------------
# the sigils
# ---------------------------------------------------------------------------------------------------------------

class Sigil:
    id = ''
    name = ''
    designer = 0
    mode = 'edit'
    pos_rule = 'any'
    own_fill = 'steps'
    fill_text = ''
    act_text = ''
    cost_text = ''
    written = True
    note = ''
    needs_partner = False
    use_bonus = 0.0

    def taps(self, smi, cx):
        return []

    def post_page(self, smi, st):
        return smi, 0.0

    def positions(self, n_line, own=False):
        rule = self.pos_rule if own else self.common_pos()
        if rule == 'first':
            return [0]
        if rule == 'last':
            return [n_line]
        return list(range(n_line + 1))

    def common_pos(self):
        return 'any'

    def cap(self, fillname):
        return FILL[fillname].cap


def _single(smi, **kw):
    return [Tap(smi, **kw)] if smi else []


class AquaRegia(Sigil):
    id, name, designer = 'aqua_regia', 'Aqua Regia', 1
    own_fill = 'variety'
    fill_text = 'D1: variety, 12'
    act_text = 'tap a carbon with no O or N on it: one H on it becomes Cl'
    cost_text = 'chlorination needs an OH and destroys it; a Cl with no C=O two carbons away does nothing'

    def taps(self, smi, cx):
        mol = parse(smi)
        out = []
        for i in _carbons(mol, lambda a: _sp3c(a) and a.GetTotalNumHs() >= 1 and not any(
                n.GetAtomicNum() in (7, 8) for n in a.GetNeighbors())):
            rw = Chem.RWMol(mol)
            c = rw.AddAtom(Chem.Atom(17))
            rw.AddBond(i, c, S1)
            out.extend(_single(_fin(rw), info='Cl on C%d' % i))
        return out


class AzothN(Sigil):
    id, name, designer = 'azoth_n', 'Azoth (nitrogen)', 1
    own_fill = 'variety'
    fill_text = 'D1: variety, 12'
    act_text = 'tap a chain-end CH3: that carbon becomes N (NH2); the carbon leaves as carbon dioxide (not counted)'
    cost_text = 'the end carbon; a C(OH) that had that CH3 loses oxidize and dehydrate'

    def taps(self, smi, cx):
        mol = parse(smi)
        out = []
        for i in _term_ch3(mol):
            rw = Chem.RWMol(mol)
            rw.GetAtomWithIdx(i).SetAtomicNum(7)
            out.extend(_single(_fin(rw), info='CH3 to NH2', lost=0))
        return out


class Vitriol(Sigil):
    id, name, designer = 'vitriol', 'Vitriol', 1
    own_fill = 'variety'
    fill_text = 'D1: variety, 12'
    act_text = 'tap a chain-end CH3: it becomes COOH'
    cost_text = 'a COOH carbon is no longer a C=O that ring, weld or grow can use'

    def taps(self, smi, cx):
        mol = parse(smi)
        out = []
        for i in _term_ch3(mol):
            rw = Chem.RWMol(mol)
            _add_group(rw, i, '=O')
            _add_group(rw, i, 'OH')
            out.extend(_single(_fin(rw), info='CH3 to COOH'))
        return out


class SulphurOH(Sigil):
    id, name, designer = 'sulphur_oh', 'Sulphur (OH within 3)', 1
    own_fill = 'variety'
    fill_text = 'D1: variety, 12'
    act_text = 'tap an OH: it and every OH within 3 carbons of it become SH'
    cost_text = 'those OH are what ring, dry, oxidize and dehydrate work on'

    def taps(self, smi, cx):
        mol = parse(smi)
        ohs = _oh(mol)
        out = []
        for o, c in ohs:
            near = cdist(mol, c, 3)
            rw = Chem.RWMol(mol)
            n = 0
            for o2, c2 in ohs:
                if c2 in near:
                    rw.GetAtomWithIdx(o2).SetAtomicNum(16)
                    n += 1
            out.extend(_single(_fin(rw), info='%d OH to SH' % n))
        return out


class Chrysopoeia(Sigil):
    id, name, designer = 'chrysopoeia', 'Chrysopoeia', 1
    own_fill = 'variety'
    fill_text = 'D1: variety, 12'
    act_text = 'tap a CH2 in the chain (not in a ring): it leaves as one gold, its two neighbours bond'
    cost_text = 'a smaller molecule, so any size spec is harder'

    def taps(self, smi, cx):
        return _chain_ch2_removals(smi, gold=1)


def _chain_ch2_removals(smi, gold=0):
    mol = parse(smi)
    out = []
    for a in mol.GetAtoms():
        if a.GetAtomicNum() == 6 and not a.IsInRing() and a.GetDegree() == 2 and a.GetTotalNumHs() == 2 and not a.GetIsAromatic():
            n1, n2 = [n.GetIdx() for n in a.GetNeighbors()]
            if mol.GetAtomWithIdx(n1).GetAtomicNum() != 6 or mol.GetAtomWithIdx(n2).GetAtomicNum() != 6:
                continue
            rw = Chem.RWMol(mol)
            rw.AddBond(n1, n2, S1)
            rw.RemoveAtom(a.GetIdx())
            out.extend(_single(_fin(rw), gold=gold, info='CH2 out', lost=1))
    return out


class TriaPrima(Sigil):
    """Relabels the water of the page as ammonia, sulfur or acid fumes.  It changes nothing on the molecule; its use is to feed
    a slow homunculus where the molecule has no N, S or Cl.  Written with the ammonia homunculus as HOMUNCULI.md settles it
    (fed by 2 ammonias; tapped: the page's reagents fire again by themselves, no uses spent).  The sulfur and acid-fume choices
    are written as relabels with no effect here (those homunculi are not in the engine); they are counted in the study."""
    id, name, designer = 'tria_prima', 'Tria Prima', 1
    own_fill = 'variety'
    pos_rule = 'last'
    fill_text = 'D1: variety, 12'
    act_text = 'pick ammonia, sulfur or acid fumes: all the water off this page counts as that'
    cost_text = 'the water jar and the water homunculus get none of it'

    def common_pos(self):
        return 'last'

    def taps(self, smi, cx):
        w = cx['prefix_off'].get('water', 0)
        if w < 1:
            return []
        out = [Tap(smi, off={'water': -w}, info='ammonia', replay=(w >= 2)),
               Tap(smi, off={'water': -w}, info='sulfur'),
               Tap(smi, off={'water': -w}, info='acid fumes')]
        return out


class LapisPlain(Sigil):
    id, name, designer = 'lapis', 'Lapis (as written)', 1
    own_fill = 'variety'
    fill_text = 'D1: variety, 12'
    act_text = 'tap an sp3 carbon: it becomes Si; nothing sees it as carbon'
    cost_text = 'the carbon the reagents wanted'

    def taps(self, smi, cx):
        mol = parse(smi)
        out = []
        for i in _carbons(mol, _sp3c):
            rw = Chem.RWMol(mol)
            rw.GetAtomWithIdx(i).SetAtomicNum(14)
            out.extend(_single(_fin(rw), info='C to Si'))
        return out


class LapisRedesign(LapisPlain):
    """The redesign: the tapped Si turns one neighbour carbon with no O on it into Si at the end of each page; each Si pays 20
    yield (once, when it is made, the tapped one too) and nothing else can use it."""
    id, name = 'lapis_redesign', 'Lapis (redesign)'
    act_text = ('the same tap; then at the end of each page the Si turns one neighbour carbon with no O on it into Si; each Si pays 20 yield '
                'and nothing else can use it')
    cost_text = 'it eats the carbons the reagents want'
    note = 'reading: 20 yield once for each Si made, the tapped one included'
    use_bonus = 20.0

    def taps(self, smi, cx):
        return [Tap(t.smi, off=t.off, info='C to Si +20') for t in LapisPlain.taps(self, smi, cx)]

    def post_page(self, smi, st):
        mol = parse(smi)
        if not st.get('si_on'):
            return smi, 0.0
        sis = [a.GetIdx() for a in mol.GetAtoms() if a.GetAtomicNum() == 14]
        if not sis:
            return smi, 0.0
        for s in sis:
            for n in mol.GetAtomWithIdx(s).GetNeighbors():
                if n.GetAtomicNum() == 6 and _sp3c(n) and not any(x.GetAtomicNum() == 8 for x in n.GetNeighbors()):
                    rw = Chem.RWMol(mol)
                    rw.GetAtomWithIdx(n.GetIdx()).SetAtomicNum(14)
                    out = _fin(rw)
                    if out:
                        return out, 20.0
        return smi, 0.0


class Rebis(Sigil):
    id, name, designer = 'rebis', 'Rebis', 1
    own_fill = 'variety'
    fill_text = 'D1: variety, 12'
    act_text = 'tap a ring: one CH2 in it becomes O, or one aromatic CH becomes N'
    cost_text = 'none stated'

    def taps(self, smi, cx):
        mol = parse(smi)
        out = []
        for a in mol.GetAtoms():
            if a.GetAtomicNum() == 6 and a.IsInRing():
                if not a.GetIsAromatic() and a.GetTotalNumHs() == 2 and a.GetDegree() == 2:
                    rw = Chem.RWMol(mol)
                    rw.GetAtomWithIdx(a.GetIdx()).SetAtomicNum(8)
                    out.extend(_single(_fin(rw), info='ring CH2 to O'))
                elif a.GetIsAromatic() and a.GetTotalNumHs() == 1:
                    rw = Chem.RWMol(mol)
                    rw.GetAtomWithIdx(a.GetIdx()).SetAtomicNum(7)
                    out.extend(_single(_fin(rw), info='aromatic CH to N'))
        return out


# --- designer 2 -----------------------------------------------------------------------------------------------------

def _longest_ends(mol):
    """The two carbons with a free H that are farthest apart along carbons (and not already bonded): (a, b, d) or None."""
    ends = _carbons(mol, lambda a: a.GetTotalNumHs() >= 1 and not a.GetIsAromatic())
    best = None
    for i in ends:
        dist = cdist(mol, i)
        for j in ends:
            if j <= i:
                continue
            d = dist.get(j)
            if d is None or d < 2:
                continue
            if best is None or d > best[2]:
                best = (i, j, d)
    return best


class OuroborosRing(Sigil):
    id, name, designer = 'ouroboros_ring', 'Ouroboros (ends bond)', 2
    own_fill = 'rings'
    fill_text = 'D2: each ring a reflex closes, 4 a page, 12'
    act_text = 'the two ends of the longest carbon chain bond, whatever the distance; the ring stays for the round'
    cost_text = 'the chain ends are gone, so oxidize\'s end cut and grow\'s arm lose their place'
    note = 'reading: an end is a carbon with a free H (an aldehyde C=O end becomes a ketone)'

    def taps(self, smi, cx):
        mol = parse(smi)
        b = _longest_ends(mol)
        if not b:
            return []
        rw = Chem.RWMol(mol)
        rw.AddBond(b[0], b[1], S1)
        return _single(_fin(rw), info='ring of %d' % (b[2] + 1))


class Coniunctio(Sigil):
    id, name, designer = 'coniunctio', 'Coniunctio', 2
    own_fill = 'places'
    needs_partner = True
    fill_text = 'D2: each place a reagent changes, 4 a page, 12'
    act_text = 'the molecule not taken from the pair joins the one taken, CH3 end to CH3 end, up to 56 atoms; its groups are live'
    cost_text = 'the next round offers no pair (the harder-molecule gold is lost); not modelled in the round'

    def taps(self, smi, cx):
        partner = cx.get('partner')
        if not partner:
            return []
        ma, mb = parse(smi), parse(partner)
        if ma.GetNumHeavyAtoms() + mb.GetNumHeavyAtoms() > E.MAX_HEAVY:
            return []
        ea, eb = _term_ch3(ma), _term_ch3(mb)
        combos = list(itertools.product(ea, eb))
        out = []
        for i, j in _sample(combos, MAXTAP, smi + partner):
            rw = Chem.RWMol(Chem.CombineMols(ma, mb))
            rw.AddBond(i, ma.GetNumAtoms() + j, S1)
            out.extend(_single(_fin(rw), info='joined %d + %d atoms' % (ma.GetNumHeavyAtoms(), mb.GetNumHeavyAtoms())))
        return out


class Mercurius(Sigil):
    id, name, designer = 'mercurius', 'Mercurius', 2
    own_fill = 'flips'
    fill_text = 'D2: each OH made C=O or C=O made OH by a reagent, 4 a page, 12'
    act_text = 'every non-tertiary C-OH becomes C=O, and every ketone or aldehyde becomes C-OH, all at once'
    cost_text = 'OH and C=O pairs swap sides; rings that wanted one of each lose them'

    def taps(self, smi, cx):
        mol = parse(smi)
        alc = [(o, c) for o, c in _oh(mol) if mol.GetAtomWithIdx(c).GetTotalNumHs() >= 1 and not any(
            n.GetAtomicNum() != 6 and n.GetIdx() != o for n in mol.GetAtomWithIdx(c).GetNeighbors())]
        car = _co(mol)
        if not alc and not car:
            return []
        rw = Chem.RWMol(mol)
        for o, c in alc:
            rw.GetBondBetweenAtoms(o, c).SetBondType(D2)
        for o, c in car:
            rw.GetBondBetweenAtoms(o, c).SetBondType(S1)
        return _single(_fin(rw), off={'hydrogen': len(alc)}, info='%d OH to C=O, %d C=O to OH' % (len(alc), len(car)))


class AzothGroups(Sigil):
    id, name, designer = 'azoth_groups', 'Azoth (every OH)', 2
    own_fill = 'kinds_off'
    fill_text = 'D2: each different kind of runoff, once a page, 4 a page, 12'
    act_text = 'pick NH2, SH or Cl: every OH becomes that group'
    cost_text = 'ring needs OH, so the plain chain gets shorter'

    def taps(self, smi, cx):
        mol = parse(smi)
        ohs = _oh(mol)
        if not ohs:
            return []
        out = []
        for z, nm in ((7, 'NH2'), (16, 'SH'), (17, 'Cl')):
            rw = Chem.RWMol(mol)
            for o, c in ohs:
                rw.GetAtomWithIdx(o).SetAtomicNum(z)
            out.extend(_single(_fin(rw), info='%d OH to %s' % (len(ohs), nm)))
        return out


def _water_in(smi, n, jar_back, info):
    """Put OH on up to n different C=C (the player picks which carbon of each): the taps."""
    mol = parse(smi)
    dbl = _cc_double(mol)
    if n < 1 or not dbl:
        return []
    k = min(n, len(dbl))
    rng = random.Random('wat' + smi + str(n))
    out, seen = [], set()
    for _ in range(MAXTAP * 3):
        chosen = rng.sample(dbl, k)
        picks = [(a, b, (a, b)[rng.randrange(2)]) for a, b in chosen]
        key = tuple(sorted((min(a, b), max(a, b), c) for a, b, c in picks))
        if key in seen:
            continue
        seen.add(key)
        rw = Chem.RWMol(mol)
        for a, b, c in picks:
            rw.GetBondBetweenAtoms(a, b).SetBondType(S1)
            _add_group(rw, c, 'OH')
        s = _fin(rw)
        if s:
            out.append(Tap(s, off={'water': -k} if jar_back else {}, info=info + ' x%d' % k))
        if len(out) >= MAXTAP:
            break
    return out


class Pelican(Sigil):
    id, name, designer = 'pelican', 'Pelican', 2
    own_fill = 'water'
    pos_rule = 'any'
    fill_text = 'D2: each water that comes off, 4 a page, 12'
    act_text = 'each water of the page goes back in as an OH on a C=C, one per water, the player picks where; then the reflexes run'
    cost_text = 'a water that goes back does not reach the jar'

    def taps(self, smi, cx):
        return _water_in(smi, cx['prefix_off'].get('water', 0), True, 'water back')


class NigredoWater(Sigil):
    id, name, designer = 'nigredo_water', 'Nigredo (water on enone)', 2
    own_fill = 'newcc'
    fill_text = 'D2: each C=C made, 4 a page, 12'
    act_text = 'every C=C beside a C=O takes water; the OH lands on the far carbon (dry run backward)'
    cost_text = 'the C=C beside the C=O is gone'

    def taps(self, smi, cx):
        mol = parse(smi)
        rw = Chem.RWMol(mol)
        n, done = 0, set()
        for a, b in _cc_double(mol):
            for x, y in ((a, b), (b, a)):
                if any(m.GetAtomicNum() == 6 and any(bd.GetBondTypeAsDouble() == 2.0 and bd.GetOtherAtom(m).GetAtomicNum() == 8
                                                     for bd in m.GetBonds()) for m in mol.GetAtomWithIdx(x).GetNeighbors()
                       if m.GetIdx() != y):
                    if (a, b) in done:
                        continue
                    done.add((a, b))
                    rw.GetBondBetweenAtoms(a, b).SetBondType(S1)
                    _add_group(rw, y, 'OH')
                    n += 1
        if not n:
            return []
        return _single(_fin(rw), info='%d enone(s) hydrated' % n)


class Palingenesis(Sigil):
    id, name, designer = 'palingenesis', 'Palingenesis', 2
    own_fill = 'past2'
    mode = 'rewind'
    fill_text = 'D2: each reflex step past the second on a page, 4 a page, 12'
    act_text = 'tapped after a page: the molecule goes back to how it stood before that page; its yield stays, its uses are refunded, the hand stays'
    cost_text = 'rings made on that page are gone; the water and gas that came off still go to the jars'
    note = 'reading: the rewound page uses up a page of the three; the next page is played on the old molecule with the same hand'


class Caduceus(Sigil):
    id, name, designer = 'caduceus', 'Caduceus', 2
    own_fill = 'allthree'
    mode = 'none'
    written = False
    fill_text = 'D2: each page on which all three reagents changed something, 12'
    act_text = 'the first two reagents of the page fire at the same moment on the molecule as it began the page; the first wins ties'
    cost_text = 'no ordering trick, the first reagent decides every tie'
    note = 'NOT WRITTEN: a reagent here is a chain of reaction-SMARTS steps, each applied place by place, and the product is re-read as a new canonical molecule after every place (chemlib.SmartsStep.apply_all), so the atoms a reagent touched are not kept and two reagents cannot be applied to the same starting molecule and merged.'


# --- designer 3 -----------------------------------------------------------------------------------------------------

class NigredoCut(Sigil):
    id, name, designer = 'nigredo_cut', 'Nigredo (cut a bond)', 3
    own_fill = 'steps'
    pos_rule = 'first'
    fill_text = 'D3: steps, 12'
    act_text = 'pick one C-C single bond: it breaks, the smaller piece leaves as soot, each cut carbon that stays becomes C=O; a ring bond opens the ring and both ends become C=O'
    cost_text = 'atoms and groups are lost; may fall under a size spec'

    def taps(self, smi, cx):
        mol = parse(smi)
        bonds = [b for b in mol.GetBonds() if b.GetBondTypeAsDouble() == 1.0 and not b.GetIsAromatic()
                 and b.GetBeginAtom().GetAtomicNum() == 6 and b.GetEndAtom().GetAtomicNum() == 6]
        out = []
        for b in _sample(bonds, MAXTAP, smi):
            a, c = b.GetBeginAtomIdx(), b.GetEndAtomIdx()
            ring = b.IsInRing()
            rw = Chem.RWMol(mol)
            rw.RemoveBond(a, c)
            soot = 0
            keep_ends = [a, c]
            if not ring:
                frags = Chem.GetMolFrags(rw)
                if len(frags) != 2:
                    continue
                f_keep, f_drop = sorted(frags, key=lambda f: (-len(f), f))
                if len(f_keep) == len(f_drop) and a in f_drop:
                    f_keep, f_drop = f_drop, f_keep
                keep_ends = [x for x in (a, c) if x in f_keep]
                soot = len(f_drop)
                for idx in sorted(f_drop, reverse=True):
                    rw.RemoveAtom(idx)
                    keep_ends = [x - 1 if x > idx else x for x in keep_ends]
            for x in keep_ends:
                at = rw.GetAtomWithIdx(x)
                val = sum(bd.GetBondTypeAsDouble() for bd in at.GetBonds())
                if val + 2 <= 4 and at.GetAtomicNum() == 6 and not at.GetIsAromatic():
                    _add_group(rw, x, '=O')
            s = _fin(rw)
            if s:
                out.append(Tap(s, off={'soot': soot} if soot else {}, info='cut %s' % ('ring' if ring else 'chain'), lost=soot))
        return out


class Rubedo(Sigil):
    id, name, designer = 'rubedo', 'Rubedo', 3
    own_fill = 'steps'
    pos_rule = 'first'
    fill_text = 'D3: steps, 12'
    act_text = 'pick two carbons that are not neighbours and each have a free H: they bond (a ring of any size); one hydrogen leaves'
    cost_text = 'uses the carbons\' H and can block a reflex that wanted them'

    def taps(self, smi, cx):
        mol = parse(smi)
        cs = _carbons(mol, lambda a: a.GetTotalNumHs() >= 1 and not a.GetIsAromatic())
        pairs = []
        for i in cs:
            dist = cdist(mol, i)
            for j in cs:
                if j > i and dist.get(j, 0) >= 2:
                    pairs.append((i, j, dist[j]))
        out = []
        for i, j, d in _sample(pairs, MAXTAP, smi):
            rw = Chem.RWMol(mol)
            rw.AddBond(i, j, S1)
            out.extend(_single(_fin(rw), off={'hydrogen': 1}, info='ring of %d' % (d + 1)))
        return out


class SulfurTwo(Sigil):
    id, name, designer = 'sulfur_two', 'Sulfur (two OH)', 3
    own_fill = 'steps'
    pos_rule = 'first'
    fill_text = 'D3: steps, 12'
    act_text = 'pick up to two OH: each becomes SH; two SH 2 or 3 carbons apart join as an S-S ring if pair is held'
    cost_text = 'ring needs an OH, and SH is not one'

    def taps(self, smi, cx):
        mol = parse(smi)
        ohs = _oh(mol)
        sets = [(x,) for x in ohs] + list(itertools.combinations(ohs, 2))
        out = []
        for st in _sample(sets, MAXTAP, smi):
            rw = Chem.RWMol(mol)
            for o, c in st:
                rw.GetAtomWithIdx(o).SetAtomicNum(16)
            out.extend(_single(_fin(rw), info='%d OH to SH' % len(st)))
        return out


class Tetrasomia(Sigil):
    id, name, designer = 'tetrasomia', 'Tetrasomia', 3
    own_fill = 'steps'
    pos_rule = 'first'
    fill_text = 'D3: steps, 12'
    act_text = 'pick a direction. Forward: every OH becomes C=O, every C=O becomes C=C (O leaves as water), every C=C gets an OH. Backward is the reverse'
    cost_text = 'can undo the setup you spent two pages on'

    def taps(self, smi, cx):
        out = []
        for fwd in (True, False):
            t = self._wheel(smi, fwd)
            if t:
                out.append(t)
        return out

    def _wheel(self, smi, fwd):
        mol = parse(smi)
        rw = Chem.RWMol(mol)
        touched = set()
        water = hydrogen = 0
        n = 0
        ohs = [(o, c) for o, c in _oh(mol) if mol.GetAtomWithIdx(c).GetTotalNumHs() >= 1 and not any(
            x.GetAtomicNum() != 6 and x.GetIdx() != o for x in mol.GetAtomWithIdx(c).GetNeighbors())]
        cos = _co(mol)
        ccs = _cc_double(mol)
        rem = []

        def zait(c, avoid):
            """A neighbour carbon with an H, fewest H first."""
            cands = [x for x in cnbr(mol, c) if x not in avoid and hs(mol, x) >= 1 and _sp3c(mol.GetAtomWithIdx(x))]
            cands.sort(key=lambda x: (hs(mol, x), x))
            return cands[0] if cands else None

        def hyd_carbon(a, b, more):
            ha, hb = hs(mol, a), hs(mol, b)
            if ha == hb:
                return min(a, b)
            return (a if ha > hb else b) if more else (a if ha < hb else b)
        if fwd:
            for o, c in ohs:
                if c in touched:
                    continue
                rw.GetBondBetweenAtoms(o, c).SetBondType(D2)
                touched.add(c)
                hydrogen += 1
                n += 1
            for o, c in cos:
                if c in touched:
                    continue
                nb = zait(c, touched)
                if nb is None:
                    continue
                rw.RemoveBond(o, c)
                rw.GetBondBetweenAtoms(c, nb).SetBondType(D2)
                rem.append(o)
                touched.update((c, nb, o))
                water += 1
                n += 1
            for a, b in ccs:
                if a in touched or b in touched:
                    continue
                c = hyd_carbon(a, b, False)
                rw.GetBondBetweenAtoms(a, b).SetBondType(S1)
                _add_group(rw, c, 'OH')
                touched.update((a, b))
                n += 1
        else:
            for o, c in cos:
                if c in touched:
                    continue
                rw.GetBondBetweenAtoms(o, c).SetBondType(S1)
                touched.add(c)
                n += 1
            for a, b in ccs:
                if a in touched or b in touched:
                    continue
                c = hyd_carbon(a, b, False)
                rw.GetBondBetweenAtoms(a, b).SetBondType(S1)
                _add_group(rw, c, '=O')
                touched.update((a, b))
                n += 1
            for o, c in ohs:
                if c in touched:
                    continue
                nb = zait(c, touched)
                if nb is None:
                    continue
                rw.RemoveBond(o, c)
                rw.GetBondBetweenAtoms(c, nb).SetBondType(D2)
                rem.append(o)
                touched.update((c, nb, o))
                water += 1
                n += 1
        for o in sorted(rem, reverse=True):
            rw.RemoveAtom(o)
        if not n:
            return None
        s = _fin(rw)
        if not s:
            return None
        return Tap(s, off={'water': water, 'hydrogen': hydrogen} if (water or hydrogen) else {},
                   info='%s, %d groups turned' % ('forward' if fwd else 'backward', n))


class Coagula(Sigil):
    id, name, designer = 'coagula', 'Coagula', 3
    own_fill = 'steps'
    pos_rule = 'first'
    fill_text = 'D3: steps, 12'
    act_text = 'pick one OH or C=O and any carbon with room: the group leaves its carbon and stands on the new one'
    cost_text = 'the old carbon is left plain'

    def taps(self, smi, cx):
        mol = parse(smi)
        moves = []
        for o, c in _oh(mol):
            for d in _carbons(mol, lambda a: _sp3c(a) and a.GetTotalNumHs() >= 1):
                if d != c:
                    moves.append((o, c, d, S1))
        for o, c in _co(mol):
            for d in _carbons(mol, lambda a: _sp3c(a) and a.GetTotalNumHs() >= 2):
                if d != c:
                    moves.append((o, c, d, D2))
        out = []
        for o, c, d, bt in _sample(moves, MAXTAP, smi):
            rw = Chem.RWMol(mol)
            rw.RemoveBond(o, c)
            rw.AddBond(d, o, bt)
            out.extend(_single(_fin(rw), info='%s moved' % ('OH' if bt == S1 else 'C=O')))
        return out


class MercuryGap(Sigil):
    id, name, designer = 'mercury_gap', 'Mercury (one carbon)', 3
    own_fill = 'steps'
    pos_rule = 'first'
    fill_text = 'D3: steps, 12'
    act_text = 'pick a C-C bond and a CH2 goes into it, or pick a plain CH2 in a chain and it comes out'
    cost_text = 'a gap that was right goes wrong'

    def taps(self, smi, cx):
        mol = parse(smi)
        moves = [('in', b.GetBeginAtomIdx(), b.GetEndAtomIdx()) for b in mol.GetBonds()
                 if b.GetBondTypeAsDouble() == 1.0 and not b.GetIsAromatic() and b.GetBeginAtom().GetAtomicNum() == 6
                 and b.GetEndAtom().GetAtomicNum() == 6]
        outs = [t for t in _chain_ch2_removals(smi)]
        k = min(len(moves), max(1, MAXTAP - min(len(outs), 2)))
        out = []
        for _, a, b in _sample(moves, k, smi):
            rw = Chem.RWMol(mol)
            rw.RemoveBond(a, b)
            c = rw.AddAtom(Chem.Atom(6))
            rw.AddBond(a, c, S1)
            rw.AddBond(c, b, S1)
            out.extend(_single(_fin(rw), info='CH2 in'))
        out.extend(_sample(outs, MAXTAP - len(out), smi + 'o'))
        return out


class OuroborosWater(Sigil):
    id, name, designer = 'ouroboros_water', 'Ouroboros (water back)', 3
    own_fill = 'runoff8'
    pos_rule = 'first'
    fill_text = 'D3: runoff, 8 notches'
    act_text = 'every water that left on the last page goes back in; for each, a C=C you pick becomes C-OH; the jar keeps the water it counted'
    cost_text = 'removes C=C that snap and Wittig need'

    def common_pos(self):
        return 'first'

    def taps(self, smi, cx):
        return _water_in(smi, cx['prev_off'].get('water', 0), False, 'water back')


class Stone(Sigil):
    id, name, designer = 'stone', 'The Stone', 3
    own_fill = 'steps16'
    pos_rule = 'first'
    fill_text = 'D3: steps, 16 notches'
    act_text = 'pick one OH or C=O: a copy stands on every plain carbon 4, 8, 12 carbons from it along the chain, both ways'
    cost_text = 'the long wait; too many OH let dry eat the ones a ring needs'
    max_copies = None

    def taps(self, smi, cx):
        mol = parse(smi)
        out = []
        groups = [(o, c, 'OH') for o, c in _oh(mol)] + [(o, c, '=O') for o, c in _co(mol)]
        for o, c, kind in _sample(groups, MAXTAP, smi):
            dist = cdist(mol, c, 12)
            targets = []
            for i, d in sorted(dist.items(), key=lambda t: (t[1], t[0])):
                if d in (4, 8, 12):
                    a = mol.GetAtomWithIdx(i)
                    if _sp3c(a) and not any(n.GetAtomicNum() != 6 for n in a.GetNeighbors()) and a.GetTotalNumHs() >= (1 if kind == 'OH' else 2):
                        targets.append(i)
            if self.max_copies:
                targets = targets[:self.max_copies]
            if not targets:
                continue
            rw = Chem.RWMol(mol)
            for i in targets:
                _add_group(rw, i, kind)
            out.extend(_single(_fin(rw), info='%d copies of %s' % (len(targets), kind)))
        return out


class StoneCut(Stone):
    id, name = 'stone_cut', 'The Stone (two copies)'
    max_copies = 2
    note = 'the designer\'s own cut: "if it is not cut to two copies it breaks the game"'


ALL = [AquaRegia(), AzothN(), Vitriol(), SulphurOH(), Chrysopoeia(), TriaPrima(), LapisPlain(), LapisRedesign(), Rebis(),
       OuroborosRing(), Coniunctio(), Mercurius(), AzothGroups(), Pelican(), NigredoWater(), Palingenesis(), Caduceus(),
       NigredoCut(), Rubedo(), SulfurTwo(), Tetrasomia(), Coagula(), MercuryGap(), OuroborosWater(), Stone(), StoneCut()]
BY_ID = {s.id: s for s in ALL}
WRITTEN = [s for s in ALL if s.written]


# ---------------------------------------------------------------------------------------------------------------
# the round with a sigil
# ---------------------------------------------------------------------------------------------------------------

class Opt:
    """One thing the player may do on a page: a line of reagents, and maybe the sigil at a slot with a tap."""
    __slots__ = ('line', 'pos', 'tap', 'turn', 'bonus', 'score', 'rewind', 'smi_in', 'hand', 'left0')

    def __init__(self, line, turn, bonus=0.0, pos=None, tap=None, rewind=False, smi_in=None, hand=None, left0=None):
        self.line = tuple(line)
        self.turn = turn
        self.bonus = bonus
        self.pos = pos
        self.tap = tap
        self.rewind = rewind
        self.smi_in = smi_in
        self.hand = hand
        self.left0 = left0
        self.score = None


def fresh_state():
    return {'fill': 0.0, 'cum': 0.0, 'si_on': False}


class Sim:
    """Plays rounds for one player, with or without a sigil.
    player: 'greedy' (the page's best yield), 'lookahead' (this page and the next), 'seek' (a spec's value, then yield; spec=...).
    sigil: a Sigil or None.  own: use the designer's own fill rule and placement (else the common footing).
    act: 'best' (the best of the legal choices) or 'random' (the page's usual line, a random slot, a random legal tap)."""

    def __init__(self, eng, player='greedy', sigil=None, own=False, act='best', spec=None):
        self.eng = eng
        self.kind = player
        self.sigil = sigil if (sigil is not None and sigil.written) else None
        self.own = own
        self.act = act
        self.spec = spec
        self.fill = FILL[self.sigil.own_fill if own else 'steps'] if self.sigil else None
        self._taps = {}
        self._runs = {}
        self._rules = ()

    # --- scoring ------------------------------------------------------------------------------------------
    def score(self, o, c):
        eng = self.eng
        n = len(o.turn.steps)
        pay = E.pay_cached(n, c['bp'])[0] + o.bonus
        if self.kind == 'greedy':
            return pay
        if self.kind == 'lookahead':
            nxt = 0.0
            if c['t'] + 1 < 3 and (c.get('look') is None or id(o) in c['look']):
                left = dict(o.left0)
                for r in o.line:
                    left[r] -= 1
                nsmi = eng.reopen(o.turn.smi)[0]
                nxt = eng.best_value(nsmi, c['carried'], left, c['rules'], max(c['bp'], n), c['seed'], c['t'] + 1, 3, 1)
            return pay + nxt
        lg = H.Log(c['start'], c['done'] + [H.turn_dict(o.line, o.turn)], c['carried'])
        return (self.spec.progress(lg, None), pay)

    def _prune(self, opts, c):
        """The look-ahead player looks one page ahead only for the LOOK_K options that pay most on this page; the others keep
        this page's pay (so they only win if nothing looked at beats them).  Same rule with and without a sigil."""
        if self.kind != 'lookahead':
            c['look'] = None
            return
        ranked = sorted(opts, key=lambda o: -(E.pay_cached(len(o.turn.steps), c['bp'])[0] + o.bonus))
        c['look'] = {id(o) for o in ranked[:LOOK_K]}

    # --- the sigil's slot ---------------------------------------------------------------------------------
    def _taps_at(self, smi, cx):
        key = (self.sigil.id, smi, cx['prefix_off'].get('water', 0), cx['prev_off'].get('water', 0), cx.get('partner'))
        r = self._taps.get(key)
        if r is None:
            try:
                r = list(self.sigil.taps(smi, cx))
            except Exception:
                r = []
            r = [t for t in r if t.smi]
            r = _sample(r, MAXTAP, 'tap/' + smi)
            self._taps[key] = r
        return r

    def _run_slot(self, prefix, tap, rest, line_all):
        """The turn after the sigil's edit at the end of `prefix`: the edit, the reflexes, then the rest of the line."""
        eng = self.eng
        rules = self._rules
        steps, off = prefix.steps, Counter(dict(prefix.off))
        off.update(tap.off)
        fired = prefix.fired
        set_off = list(prefix.set_off)
        capped = prefix.capped
        cur = tap.smi
        extra = 0
        if cur != prefix.smi:
            s2, st2, off2, cp = eng.settle(cur, rules, eng.cap - len(steps))
            steps = steps + st2
            off.update(dict(off2))
            capped = capped or cp
            cur = s2
            extra = len(st2)
        if extra:
            if set_off:
                set_off[-1] += extra
            else:
                set_off.append(extra)
        seq = list(rest) + (list(line_all) if tap.replay else [])
        for r in seq:
            f = eng.fire(cur, r)
            if not f.acted:
                fired = fired + ((r, 0),)
                set_off.append(0)
                continue
            s3, st3, off3, cp = eng.settle(f.smi, rules, eng.cap - len(steps))
            off.update(dict(f.off))
            off.update(dict(off3))
            steps = steps + st3
            fired = fired + ((r, f.n),)
            set_off.append(len(st3))
            capped = capped or cp
            cur = s3
        return E.Turn(cur, steps, fired, tuple(sorted(off.items())), capped, tuple(set_off))

    def _sigil_options(self, c, base, st, srng):
        sg = self.sigil
        eng = self.eng
        rules = c['rules']
        self._rules = rules
        if base:
            ranked = sorted(range(len(base)), key=lambda i: -base[i][2])
            pool = [base[i][0] for i in ranked[:NTOP]]
            rest = [base[i][0] for i in ranked[NTOP:]]
            if rest and NRAND:
                pool += srng.sample(rest, min(NRAND, len(rest)))
        else:
            pool = [()]
        seen = set()
        opts = []
        for line in pool:
            for pos in sg.positions(len(line), self.own):
                prefix = eng.run_line(c['smi'], line[:pos], rules)
                cx = {'prefix_off': Counter(dict(prefix.off)), 'prev_off': c['prev_off'], 'partner': c['partner'], 'rules': rules}
                for tp in self._taps_at(prefix.smi, cx):
                    key = (line, pos, tp.smi, tp.replay, tp.info)
                    if key in seen:
                        continue
                    seen.add(key)
                    ck = (c['smi'], line, pos, tp.smi, tp.replay, rules)
                    t = self._runs.get(ck)
                    if t is None:
                        t = self._runs[ck] = self._run_slot(prefix, tp, line[pos:], line)
                    o = Opt(line, t, sg.use_bonus, pos, tp, left0=c['left'])
                    opts.append(o)
        return opts

    # --- a round ------------------------------------------------------------------------------------------
    def play_round(self, smi, carried, rules, seed, st, partner=None, tb=None):
        eng = self.eng
        sg = self.sigil
        smi = eng.reopen(canon(smi))[0]
        carried, rules = tuple(carried), tuple(rules)
        left = {r: E.USES for r in carried}
        bp = 0
        prng = random.Random('player/%s' % (tb or seed))
        srng = random.Random('sigil/%s' % seed)
        st['si_on'] = False
        pages = []
        done = []
        hist = []
        prev_off = Counter()
        gold = 0.0
        start = smi
        cap = self.fill.cap if self.fill else 0
        short = bool(self.spec is not None and self.spec.short)
        for t in range(E.TURNS):
            hand = eng.hand_for(carried, left, seed, t, E.HAND)
            c = {'smi': smi, 'left': dict(left), 'bp': bp, 'carried': carried, 'rules': rules, 'seed': seed, 't': t,
                 'start': start, 'done': done, 'prev_off': prev_off, 'partner': partner}
            base = eng.evaluate(smi, hand, left, rules, bp) if hand else []
            if short and hand:
                have = {x[0] for x in base}
                for L_ in (2, 1):
                    for line in itertools.product(hand, repeat=L_):
                        if line in have:
                            continue
                        cn = Counter(line)
                        if any(left.get(r, 0) < n for r, n in cn.items()):
                            continue
                        tt = eng.run_line(smi, line, rules)
                        base.append((line, tt, E.pay_cached(len(tt.steps), bp)[0]))
            chosen = None
            base_best = None
            base_tops = []
            if base:
                bo = [Opt(l, tt, 0.0, left0=c['left']) for l, tt, p in base]
                self._prune(bo, c)
                for o in bo:
                    o.score = self.score(o, c)
                top = max(o.score for o in bo)
                base_tops = [o for o in bo if o.score == top]
                chosen = prng.choice(base_tops)
                base_best = chosen
            full = sg is not None and st['fill'] >= cap - 1e-9
            used = None
            optinfo = None
            if full:
                sopts = []
                if sg.mode == 'edit':
                    if self.act == 'best':
                        sopts = self._sigil_options(c, base, st, srng)
                elif sg.mode == 'rewind' and hist:
                    h = hist[-1]
                    pb = eng.evaluate(h['smi'], h['hand'], h['left'], rules, bp) if h['hand'] else []
                    sopts = [Opt(l, tt, 0.0, rewind=True, smi_in=h['smi'], hand=h['hand'], left0=h['left']) for l, tt, p in pb]
                if sopts:
                    pays = [E.pay_cached(len(o.turn.steps), bp)[0] + o.bonus for o in sopts]
                    optinfo = (len(sopts), max(pays), sum(pays) / len(pays), len({o.turn.smi for o in sopts}))
                    self._prune(sopts, c)
                    for o in sopts:
                        o.score = self.score(o, c)
                    top = max(o.score for o in sopts)
                    cand = srng.choice([o for o in sopts if o.score == top])
                    if self.act == 'best':
                        if base_best is None or cand.score > base_best.score:
                            used = cand
                    else:
                        used = cand      # a rewind has no tap to draw: the page's best replay line
                elif sg.mode == 'edit' and self.act == 'random' and chosen is not None:
                    self._rules = rules
                    line = chosen.line
                    poss = sg.positions(len(line), self.own)
                    srng.shuffle(poss)
                    for pos in poss:
                        prefix = eng.run_line(smi, line[:pos], rules)
                        cx = {'prefix_off': Counter(dict(prefix.off)), 'prev_off': prev_off, 'partner': partner, 'rules': rules}
                        tps = self._taps_at(prefix.smi, cx)
                        if tps:
                            tp = srng.choice(tps)
                            tt = self._run_slot(prefix, tp, line[pos:], line)
                            used = Opt(line, tt, sg.use_bonus, pos, tp, left0=c['left'])
                            break
            if used is not None:
                line = used.line
                turn = used.turn
                if used.rewind:
                    smi_in, hand_used, left_before = used.smi_in, used.hand, dict(used.left0)
                else:
                    smi_in, hand_used, left_before = smi, hand, dict(left)
                bonus = used.bonus
                if sg.id == 'lapis_redesign':
                    st['si_on'] = True
                gold += used.tap.gold if used.tap else 0
            else:
                smi_in, hand_used, left_before = smi, hand, dict(left)
                if chosen is not None:
                    line, turn = chosen.line, chosen.turn
                else:
                    line, turn = (), eng.run_line(smi, (), rules)
                bonus = 0.0
            n_steps = len(turn.steps)
            pay, extra, fullp = E.pay_cached(n_steps, bp)
            end_smi = turn.smi
            if sg is not None and st.get('si_on'):
                end_smi, b2 = sg.post_page(end_smi, st)
                bonus += b2
            td = {'line': tuple(line), 'chain': tuple(turn.steps), 'fired': turn.fired, 'off': dict(turn.off),
                  'set_off': turn.set_off, 'smi_in': smi_in, 'smi_end': end_smi}
            notches = 0.0
            crossed = 0
            if sg is not None:
                if used is not None:
                    st['fill'] -= cap
                notches = self.fill.notches(td)
                before = math.floor(st['cum'] / cap + 1e-9)
                st['cum'] += notches
                st['fill'] = min(st['fill'] + notches, 2 * cap)
                crossed = math.floor(st['cum'] / cap + 1e-9) - before
            same_line = None
            if used is not None and base_tops:
                same_line = (not used.rewind) and any(o.line == line for o in base_tops)
            gain = None
            if used is not None and base_best is not None:
                gain = (pay + bonus) - E.pay_cached(len(base_best.turn.steps), bp)[0]
            pages.append({'line': tuple(line), 'n': n_steps, 'chain': tuple(turn.steps), 'pay': pay + bonus, 'bonus': bonus,
                          'off': dict(turn.off), 'smi_in': smi_in, 'smi_end': end_smi, 'used': used is not None,
                          'rewind': bool(used is not None and used.rewind), 'pos': (used.pos if used else None),
                          'tap': (used.tap.info if used and used.tap else None), 'full': full, 'notches': notches,
                          'crossed': crossed, 'same_line': same_line, 'gain': gain, 'fired': turn.fired, 'set_off': turn.set_off,
                          'lost': (used.tap.lost if used and used.tap else 0), 'optinfo': optinfo,
                          'base_pay': (E.pay_cached(len(base_best.turn.steps), bp)[0] if base_best is not None else 0.0)})
            done.append(H.turn_dict(line, turn, end_smi))
            if used is not None and used.rewind:
                left = dict(left_before)
            for r in line:
                left[r] -= 1
            hist.append({'smi': smi_in, 'hand': hand_used, 'left': left_before})
            smi = eng.reopen(end_smi)[0]
            prev_off = Counter(dict(turn.off))
            bp = max(bp, n_steps)
        rr = {'smi0': start, 'carried': carried, 'rules': rules, 'pages': pages, 'gold': gold}
        rr['yield'] = sum(p['pay'] for p in pages)
        rr['steps'] = [p['n'] for p in pages]
        return rr


# ---------------------------------------------------------------------------------------------------------------
# the world of a test: molecules, carried reagents, specs
# ---------------------------------------------------------------------------------------------------------------

_CARRIED = {}
_NTAB = {}


def carried_of(seed):
    if seed not in _CARRIED:
        _CARRIED[seed] = H.run_carried(seed)
    return _CARRIED[seed]


def world(seed, rnd):
    """(molecule, partner molecule) of round rnd of run `seed`.  Even seeds deal the game's molecules, odd seeds generated ones
    (any family, the round's size)."""
    rng = random.Random('mol/%d/%d' % (seed, rnd))
    smi = None
    if seed % 2 == 1:
        g = M.generate(int(round(M.ROUND_SIZES[rnd - 1])), rng, 1, 'any')
        if g:
            smi = g[0].canonical
    if smi is None:
        smi = M.deal_molecule(rnd, rng, 3)
    prng = random.Random('partner/%d/%d' % (seed, rnd))
    partner = M.deal_molecule(rnd, prng, 3)
    for _ in range(6):
        if partner != smi:
            break
        partner = M.deal_molecule(rnd, prng, 3)
    return smi, partner


def n60(name, rnd):
    """The N the fitted table gives as the one a seeking player reaches in 60 percent of rounds, or 0."""
    import hurdle_gen as G
    row = G.table().get(name)
    if not row or rnd not in row.get('good_rounds', []):
        return 0
    sf = row['sf'].get(str(rnd))
    if not sf:
        return 0
    best = 0
    for k, v in enumerate(sf):
        if v >= 0.6:
            best = k
    return best


def cells_for(carried, rules, rnd):
    """[(spec name, N)] of the kept specs that apply to a round."""
    import hurdle_gen as G
    out = []
    for name, row in G.table().items():
        if not isinstance(row, dict) or rnd not in row.get('good_rounds', []):
            continue
        sp = H.SPECS.get(name)
        if sp is None:
            continue
        N = n60(name, rnd)
        if N >= 1 and sp.applicable(carried, rules):
            out.append((name, N))
    return sorted(out)


def ring_kinds(smi):
    mol = parse(smi)
    out = set()
    for r in mol.GetRingInfo().AtomRings():
        het = tuple(sorted(mol.GetAtomWithIdx(a).GetSymbol() for a in r if mol.GetAtomWithIdx(a).GetAtomicNum() != 6))
        arom = all(mol.GetAtomWithIdx(a).GetIsAromatic() for a in r)
        out.add((len(r), het, arom))
    return out


def groups_of(smi):
    f = H.feat(smi)
    g = {k for k, v in f['groups'].items() if v}
    mol = parse(smi)
    g |= {'elem_' + a.GetSymbol() for a in mol.GetAtoms() if a.GetSymbol() in ('N', 'S', 'Cl', 'Si')}
    return g


def kk(k):
    return '%d%s%s' % (k[0], ''.join(k[1]) if k[1] else 'C', 'a' if k[2] else '')


def log_of(rr):
    turns = [{'line': p['line'], 'chain': tuple(p['chain']), 'fired': p['fired'], 'off': p['off'], 'set_off': p['set_off'],
              'smi_end': p['smi_end']} for p in rr['pages']]
    return H.Log(rr['smi0'], turns, rr['carried'])


def digest(rr, seed, rnd, with_specs=True):
    """The small record kept of a round."""
    pages = rr['pages']
    d = {'seed': seed, 'r': rnd, 'stage': STAGE[rnd], 'yield': rr['yield'], 'steps': rr['steps'], 'gold': rr['gold'],
         'chains': [list(p['chain']) for p in pages], 'lines': [list(p['line']) for p in pages],
         'full': [p['full'] for p in pages], 'used': [p['used'] for p in pages], 'rewind': [p['rewind'] for p in pages],
         'crossed': [p['crossed'] for p in pages], 'notches': [p['notches'] for p in pages],
         'taps': [p['tap'] for p in pages], 'optinfo': [p['optinfo'] for p in pages], 'base_pay': [p['base_pay'] for p in pages], 'pos': [p['pos'] for p in pages], 'same_line': [p['same_line'] for p in pages],
         'gain': [p['gain'] for p in pages], 'lost': sum(p['lost'] for p in pages), 'bonus': sum(p['bonus'] for p in pages),
         'off': {}, 'smi0': rr['smi0']}
    off = Counter()
    for p in pages:
        off.update(p['off'])
    d['off'] = dict(off)
    ends = [p['smi_end'] for p in pages]
    rk = set()
    gr = set()
    for s in ends:
        rk |= ring_kinds(s)
        gr |= groups_of(s)
    d['rings'] = sorted(kk(k) for k in rk)
    d['groups'] = sorted(gr)
    d['atoms0'] = parse(rr['smi0']).GetNumHeavyAtoms()
    d['atoms1'] = parse(ends[-1]).GetNumHeavyAtoms() if ends else d['atoms0']
    if with_specs:
        lg = log_of(rr)
        sv = {}
        for name, N in cells_for(rr['carried'], rr['rules'], rnd):
            try:
                sv[name] = [H.SPECS[name].fn(lg), N]
            except Exception:
                pass
        d['specs'] = sv
    return d


def play_run(eng, seed, sigil=None, player='greedy', own=False, act='best'):
    sim = Sim(eng, player, sigil, own, act)
    st = fresh_state()
    out = []
    for rnd in range(1, 10):
        smi, partner = world(seed, rnd)
        rr = sim.play_round(smi, carried_of(seed)[rnd], H.RULES_BAND[rnd], 's%d/r%d' % (seed, rnd), st, partner)
        out.append(digest(rr, seed, rnd))
    return out


def task_main(args):
    seed, cfgs = args
    eng = E.Engine()
    out = {}
    t0 = time.time()
    times = {}
    for key, sid, player, own, act in cfgs:
        t1 = time.time()
        out[key] = play_run(eng, seed, BY_ID[sid] if sid else None, player, own, act)
        times[key] = time.time() - t1
        _mem_guard(eng)
    eng.clear()
    H.feat.cache_clear()
    chemlib.parse.cache_clear()
    return seed, out, times


def _mem_guard(eng):
    n = len(eng._fire) + len(eng._settle) + len(eng._line)
    if n > 250000:
        eng.clear()
    if H.feat.cache_info().currsize > 60000:
        H.feat.cache_clear()


def _low_priority():
    if not os.environ.get('SIGILS_LOWPRI'):
        return
    try:
        import ctypes
        ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), 0x4000)
    except Exception:
        pass


def _pool(fn, tasks, workers):
    if workers <= 1:
        for t in tasks:
            yield fn(t)
        return
    import multiprocessing as mp
    with mp.get_context('spawn').Pool(workers, initializer=_low_priority) as p:
        for r in p.imap_unordered(fn, tasks, chunksize=1):
            yield r


def main_configs(kind='main'):
    """The configurations, as (key, sigil id or None, player, own fill, act).
    'main': the common footing, best use, greedy and look-ahead players, and the two baselines.
    'supp': the supplement: random use (greedy), and the designer's own fill and placement (greedy, best use), and the baseline."""
    if kind == 'main':
        cfgs = [('base/greedy', None, 'greedy', False, 'best'), ('base/lookahead', None, 'lookahead', False, 'best')]
        for sg in WRITTEN:
            cfgs.append((sg.id + '/greedy/best', sg.id, 'greedy', False, 'best'))
            cfgs.append((sg.id + '/lookahead/best', sg.id, 'lookahead', False, 'best'))
        return cfgs
    cfgs = [('base/greedy', None, 'greedy', False, 'best')]
    for sg in WRITTEN:
        cfgs.append((sg.id + '/greedy/random', sg.id, 'greedy', False, 'random'))
        cfgs.append((sg.id + '/greedy/own', sg.id, 'greedy', True, 'best'))
    return cfgs


def study_main(outdir, runs=67, kind='main', workers=11, first=1):
    """One file a run (seed_N.json, or supp_N.json); a run that has a file is not played again."""
    os.makedirs(outdir, exist_ok=True)
    pre = 'seed_' if kind == 'main' else 'supp_'
    tasks = [(s, main_configs(kind)) for s in range(first, first + runs)
             if not os.path.exists(os.path.join(outdir, '%s%d.json' % (pre, s)))]
    t0 = time.time()
    n = 0
    for seed, out, times in _pool(task_main, tasks, workers):
        json.dump({'seed': seed, 'res': out, 'times': times}, open(os.path.join(outdir, '%s%d.json' % (pre, seed)), 'w'))
        n += 1
        print('%s runs done %d/%d, %.0f s' % (kind, n, len(tasks), time.time() - t0), flush=True)


def load_main(outdir, kind='main'):
    """{config key: [round digests]} and the core seconds, from the run files."""
    pre = 'seed_' if kind == 'main' else 'supp_'
    res = defaultdict(list)
    tt = defaultdict(float)
    n = 0
    for f in sorted(os.listdir(outdir)):
        if f.startswith(pre) and f.endswith('.json'):
            d = json.load(open(os.path.join(outdir, f)))
            for k, v in d['res'].items():
                res[k].extend(v)
            for k, v in d['times'].items():
                tt[k] += v
            n += 1
    return res, tt, n


# ---------------------------------------------------------------------------------------------------------------
# a player that aims at a spec, with the sigil full at the start of the round
# ---------------------------------------------------------------------------------------------------------------

def task_aim(args):
    seed, sids, ncells = args
    eng = E.Engine()
    out = []
    for rnd in range(1, 10):
        smi, partner = world(seed, rnd)
        carried, rules = carried_of(seed)[rnd], H.RULES_BAND[rnd]
        cells = cells_for(carried, rules, rnd)
        pick = random.Random('aim/%d/%d' % (seed, rnd)).sample(cells, min(ncells, len(cells)))
        for name, N in pick:
            sp = H.SPECS[name]
            rseed = 's%d/r%d' % (seed, rnd)
            row = {'seed': seed, 'r': rnd, 'stage': STAGE[rnd], 'spec': name, 'N': N}

            def play(sim, tag, rs=rseed):
                st = fresh_state()
                if sim.sigil:
                    st['fill'] = st['cum'] = float(sim.fill.cap)
                rr = sim.play_round(smi, carried, rules, rseed, st, partner, tb=rs)
                return sp.fn(log_of(rr)), rr
            v0, _ = play(Sim(eng, 'seek', None, spec=sp), 'base')
            vc, _ = play(Sim(eng, 'seek', None, spec=sp), 'ctrl', rs=rseed + '/ctrl')
            row['base'] = v0
            row['ctrl'] = vc
            for sid in sids:
                sg = BY_ID[sid]
                v1, rr1 = play(Sim(eng, 'seek', sg, spec=sp), sid)
                row[sid] = v1
                row[sid + '/used'] = any(p['used'] for p in rr1['pages'])
            out.append(row)
    eng.clear()
    return out


def study_aim(outdir, seeds, ncells=3, workers=15, sids=None):
    sids = sids or [s.id for s in WRITTEN]
    rows = []
    t0 = time.time()
    n = 0
    for r in _pool(task_aim, [(s, sids, ncells) for s in seeds], workers):
        rows.extend(r)
        n += 1
        if n % 5 == 0:
            print('aim seeds %d/%d, %.0f s' % (n, len(seeds), time.time() - t0), flush=True)
    json.dump(rows, open(os.path.join(outdir, 'aim.json'), 'w'))
    json.dump({'wall': time.time() - t0, 'seeds': len(seeds), 'cells': len(rows)}, open(os.path.join(outdir, 'aim_time.json'), 'w'))
    return rows


# ---------------------------------------------------------------------------------------------------------------
# what a sigil opens on one page: every line, with and without it
# ---------------------------------------------------------------------------------------------------------------

def task_reach(args):
    seed, rnd, sids, nlines = args
    eng = E.Engine()
    smi, partner = world(seed, rnd)
    smi = eng.reopen(canon(smi))[0]
    carried, rules = carried_of(seed)[rnd], H.RULES_BAND[rnd]
    seedstr = 's%d/r%d' % (seed, rnd)
    hand = eng.hand_for(carried, {r: 3 for r in carried}, seedstr, 0, 5)
    left = {r: 3 for r in carried}
    base = eng.evaluate(smi, hand, left, rules, 0)
    A_mol, A_rings, A_groups, A_refl = set(), set(), set(), set()
    for l, t, p in base:
        e = eng.reopen(t.smi)[0]
        A_mol.add(e)
        A_rings |= ring_kinds(e)
        A_groups |= groups_of(e)
        A_refl |= set(t.steps)
    best_pay = max(p for l, t, p in base) if base else 0
    out = []
    for sid in sids:
        sg = BY_ID[sid]
        if sg.mode != 'edit':
            continue
        sim = Sim(eng, 'greedy', sg)
        sim._rules = rules
        rng = random.Random('reach/%s' % seedstr)
        lines = [l for l, t, p in base]
        pool = rng.sample(lines, min(nlines, len(lines))) if lines else [()]
        B_mol, B_rings, B_groups, B_refl, B_dir, n_opts, bestB = set(), set(), set(), set(), set(), 0, 0.0
        for line in pool:
            for pos in sg.positions(len(line)):
                prefix = eng.run_line(smi, line[:pos], rules)
                cx = {'prefix_off': Counter(dict(prefix.off)), 'prev_off': Counter(), 'partner': partner, 'rules': rules}
                for tp in sim._taps_at(prefix.smi, cx):
                    t = sim._run_slot(prefix, tp, line[pos:], line)
                    n_opts += 1
                    e = eng.reopen(t.smi)[0]
                    B_mol.add(e)
                    B_rings |= ring_kinds(e)
                    g = groups_of(e)
                    B_groups |= g
                    B_dir |= groups_of(tp.smi)
                    B_refl |= set(t.steps)
                    bestB = max(bestB, E.pay_cached(len(t.steps), 0)[0] + sg.use_bonus)
        out.append({'seed': seed, 'r': rnd, 'stage': STAGE[rnd], 'sigil': sid, 'n_opts': n_opts,
                    'new_mols': len(B_mol - A_mol), 'mols': len(B_mol), 'new_rings': sorted(kk(k) for k in B_rings - A_rings),
                    'new_groups': sorted(B_groups - A_groups), 'new_groups_direct': sorted((B_dir - A_groups)),
                    'new_groups_play': sorted((B_groups - A_groups) - (B_dir - A_groups)),
                    'new_refl': sorted(B_refl - A_refl), 'best_with': bestB, 'best_without': best_pay,
                    'base_mols': len(A_mol)})
    eng.clear()
    return out


def study_reach(outdir, seeds, nlines=24, workers=15, sids=None):
    sids = sids or [s.id for s in WRITTEN]
    tasks = [(s, r, sids, nlines) for s in seeds for r in (2, 5, 8)]
    rows = []
    t0 = time.time()
    n = 0
    for r in _pool(task_reach, tasks, workers):
        rows.extend(r)
        n += 1
        if n % 10 == 0:
            print('reach %d/%d, %.0f s' % (n, len(tasks), time.time() - t0), flush=True)
    json.dump(rows, open(os.path.join(outdir, 'reach.json'), 'w'))
    json.dump({'wall': time.time() - t0, 'tasks': len(tasks)}, open(os.path.join(outdir, 'reach_time.json'), 'w'))
    return rows


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'help'
    if cmd in ('main', 'supp'):
        out = sys.argv[2]
        runs = int(sys.argv[3]) if len(sys.argv) > 3 else 67
        w = int(sys.argv[4]) if len(sys.argv) > 4 else 11
        study_main(out, runs, cmd, w)
    elif cmd == 'aim':
        out = sys.argv[2]
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 12
        w = int(sys.argv[4]) if len(sys.argv) > 4 else 9
        nc = int(sys.argv[5]) if len(sys.argv) > 5 else 2
        study_aim(out, list(range(1001, 1001 + n)), nc, w)
    elif cmd == 'reach':
        out = sys.argv[2]
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 8
        w = int(sys.argv[4]) if len(sys.argv) > 4 else 9
        nl = int(sys.argv[5]) if len(sys.argv) > 5 else 16
        study_reach(out, list(range(2001, 2001 + n)), nl, w)
    else:
        print(__doc__)
