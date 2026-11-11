"""The game's own molecules, read from the game's source, and a generator of further ones.

Source of truth: apps/steam/js/react/path.js, the table FEED (kind, SMILES).  This module reads that file, so a
molecule added to the game shows up here after one re-run.  Nothing is copied by hand.

Run `python molecules.py` for the report: how many were found, how many parse, sizes, and the rounds each can be dealt in.
"""
import os
import re
import random
from functools import lru_cache

from rdkit import Chem, RDLogger

RDLogger.DisableLog('rdApp.*')

HERE = os.path.dirname(os.path.abspath(__file__))
PATH_JS = os.path.normpath(os.path.join(HERE, '..', '..', 'apps', 'steam', 'js', 'react', 'path.js'))

# path.js FEEDSIZE: heavy atoms asked for by round 1..9, and how far off a molecule may be.
ROUND_SIZES = [11.5, 12.5, 14, 16.5, 19.5, 23, 27, 31, 35]
NEAR = 3.5
# path.js KIN: family -> (tier it opens at, weight when a round draws a family)
FAMILY_ODDS = {'chain': (0, 38), 'ring': (0, 24), 'arene': (1, 16), 'sugar': (2, 13), 'cage': (3, 9)}
# path.js RULE.filter, FILTER: rounds 1..3 reject shapes that cannot cascade, prefer two or more C=C with at most one OH
FILTER_UP_TO = 3


def read_feed(path=PATH_JS):
    """[(family, smiles)] in the order of the table in path.js."""
    text = open(path, encoding='utf8').read()
    i = text.index('const FEED = [')
    j = text.index('\n];', i)
    return re.findall(r"\['(\w+)',\s*'([^']+)'\]", text[i:j])


def shape_of(mol):
    """OH, C=C outside benzene, C=O counted as path.js feedShape counts them, and its bad/good flags."""
    oh = len(mol.GetSubstructMatches(Chem.MolFromSmarts('[OX2H]')))
    ene = len(mol.GetSubstructMatches(Chem.MolFromSmarts('C=C')))
    one = len(mol.GetSubstructMatches(Chem.MolFromSmarts('C=O')))
    kinds = (1 if oh else 0) + (1 if ene else 0) + (1 if one else 0)
    bad = (oh >= 2 and not ene) or (one == 1 and not ene) or kinds <= 1
    return {'oh': oh, 'ene': ene, 'one': one, 'bad': bad, 'good': (not bad) and oh <= 1 and ene >= 2}


def rounds_for(heavy):
    """Rounds (1..9) whose size ask is within NEAR of this size."""
    return [r + 1 for r, s in enumerate(ROUND_SIZES) if abs(heavy - s) <= NEAR]


class Molecule:
    __slots__ = ('smiles', 'canonical', 'heavy', 'family', 'from_game', 'rounds', 'shape')

    def __init__(self, smiles, family, from_game=True):
        m = Chem.MolFromSmiles(smiles)
        if m is None:
            raise ValueError('does not parse: ' + smiles)
        self.smiles = smiles
        self.canonical = Chem.MolToSmiles(m)
        self.heavy = m.GetNumHeavyAtoms()
        self.family = family
        self.from_game = from_game
        self.rounds = rounds_for(self.heavy)
        self.shape = shape_of(m)

    def __repr__(self):
        return 'Molecule(%s, %s, heavy=%d, rounds=%s%s)' % (self.canonical, self.family, self.heavy, self.rounds,
                                                         '' if self.from_game else ', generated')


@lru_cache(maxsize=None)
def _load(path):
    out, failed = [], []
    for fam, smi in read_feed(path):
        try:
            out.append(Molecule(smi, fam, True))
        except ValueError:
            failed.append((fam, smi))
    return tuple(out), tuple(failed)


def game_molecules(path=PATH_JS):
    """All molecules of the game's table that parse."""
    return list(_load(path)[0])


def failed_molecules(path=PATH_JS):
    """Entries of the game's table that RDKit cannot parse (expected: none)."""
    return list(_load(path)[1])


def pool_for_round(rnd, mols=None, family=None):
    """What path.js feedsFor offers for a round: the molecules of a family within NEAR of the round's size, or the two
    nearest of that family; in rounds 1..3 the bad shapes are left out and the good shapes counted twice."""
    mols = mols if mols is not None else game_molecules()
    t = ROUND_SIZES[max(1, min(9, rnd)) - 1]
    of = [m for m in mols if (family is None or m.family == family)]
    near = [m for m in of if abs(m.heavy - t) <= NEAR]
    out = near if near else sorted(of, key=lambda m: abs(m.heavy - t))[:2]
    if rnd <= FILTER_UP_TO:
        ok = [m for m in out if not m.shape['bad']]
        if ok:
            out = ok + [m for m in ok if m.shape['good']]
    return out


def deal_weights(rnd, tier=3, mols=None):
    """Probability that each molecule of the table is the one a round deals (one of the three on offer is drawn the way
    path.js runBriefs draws it: a family by its odds among the families open at this tier, then a molecule of that
    family uniformly from feedsFor).  Returns {canonical: probability}.  Families with nothing to offer are skipped."""
    mols = mols if mols is not None else game_molecules()
    fams = [f for f, (t, w) in FAMILY_ODDS.items() if t <= tier]
    weights, total = {}, 0.0
    for f in fams:
        pool = pool_for_round(rnd, mols, f)
        if pool:
            total += FAMILY_ODDS[f][1]
    for f in fams:
        pool = pool_for_round(rnd, mols, f)
        if not pool:
            continue
        pf = FAMILY_ODDS[f][1] / total
        for m in pool:
            weights[m.canonical] = weights.get(m.canonical, 0.0) + pf / len(pool)
    return weights


def deal_molecule(rnd, rng, tier=3, mols=None, extra=None):
    """One molecule for a round, drawn as deal_weights says.  `extra` is a list of generated Molecule objects that may
    also be dealt (they join their family's pool when their size fits)."""
    mols = list(mols if mols is not None else game_molecules()) + list(extra or [])
    w = deal_weights(rnd, tier, mols)
    keys = sorted(w)
    r = rng.random() * sum(w.values())
    for k in keys:
        r -= w[k]
        if r < 0:
            return k
    return keys[-1]


# ---------------------------------------------------------------------------------------------------------------
# A generator of further molecules (NOT from the game: from_game is False on every one).
# It builds a chain the way the game's table does: groups every three or four carbons so rings of five and six can
# close, with a C=O or an OH or a C=C at the ends, and now and then a carbon ring or a benzene ring on the end.
# ---------------------------------------------------------------------------------------------------------------
_UNITS = [  # (smiles of the unit, heavy atoms, weight): units are written so that they chain left to right
    ('C(=O)', 2, 5), ('C(O)', 2, 3), ('C=C', 2, 3), ('C(C)(O)', 3, 1), ('C(=O)C', 3, 1),
]
_ENDS = ['O=C', 'C=C', 'CC(=O)', 'CC(C)(O)', 'OC', 'C=CC']
_TAILS = ['', '', '', 'C1CCCC1', 'C1CCCCC1', 'c1ccccc1O', 'C1CCC1', 'C12CC3CC(CC(C3)C1)C2']


def generate(size, rng=None, n=1, family='chain', tries=2000, avoid=()):
    """n distinct valid molecules with exactly `size` heavy atoms (not from the game).  family: 'chain', 'ring' (a
    carbon ring on one end), 'arene' (a phenol ring on one end), 'sugar' (many OH) or 'any'."""
    rng = rng or random.Random()
    seen, out = set(avoid), []
    for _ in range(tries):
        if len(out) >= n:
            break
        smi = _build(size, rng, family)
        if smi is None:
            continue
        m = Chem.MolFromSmiles(smi)
        if m is None or m.GetNumHeavyAtoms() != size:
            continue
        can = Chem.MolToSmiles(m)
        if can in seen:
            continue
        seen.add(can)
        mol = Molecule(smi, family if family != 'any' else 'chain', from_game=False)
        out.append(mol)
    return out


def _build(size, rng, family):
    fam = rng.choice(['chain', 'ring', 'arene', 'sugar']) if family == 'any' else family
    tail = ''
    if fam == 'ring':
        tail = rng.choice(['C1CCCC1', 'C1CCCCC1', 'OC1(CCCC1)', 'C1CCC1'])
    elif fam == 'arene':
        tail = rng.choice(['c1ccccc1O', 'c1ccccc1', 'c1ccc(O)cc1'])
    start = rng.choice(_ENDS)
    parts = [start]
    heavy = Chem.MolFromSmiles(start).GetNumHeavyAtoms()
    tail_n = Chem.MolFromSmiles(tail).GetNumHeavyAtoms() if tail else 0
    budget = size - tail_n
    if budget < heavy:
        return None
    while heavy < budget:
        # a spacer of two or three CH2, then a unit
        sp = rng.choice([2, 3, 3])
        if fam == 'sugar':
            unit, un = ('C(O)', 2)
        else:
            u = rng.choices(_UNITS, weights=[w for _, _, w in _UNITS])[0]
            unit, un = u[0], u[1]
        if heavy + sp + un > budget:
            # fill the rest with CH2
            parts.append('C' * (budget - heavy))
            heavy = budget
            break
        parts.append('C' * sp)
        parts.append(unit)
        heavy += sp + un
    smi = ''.join(parts) + tail
    return smi


def report():
    mols = game_molecules()
    bad = failed_molecules()
    print('entries in the table of path.js: %d' % (len(mols) + len(bad)))
    print('parsed by RDKit: %d' % len(mols))
    print('failed to parse: %d %s' % (len(bad), bad))
    print('distinct canonical SMILES: %d' % len({m.canonical for m in mols}))
    fams = {}
    for m in mols:
        fams[m.family] = fams.get(m.family, 0) + 1
    print('by family: %s' % fams)
    hs = [m.heavy for m in mols]
    print('heavy atoms: min %d, max %d' % (min(hs), max(hs)))
    for r in range(1, 10):
        pool = pool_for_round(r)
        print('round %d asks for %.1f: %d molecules dealt (heavy atoms %d to %d)' % (
            r, ROUND_SIZES[r - 1], len({m.canonical for m in pool}), min(m.heavy for m in pool), max(m.heavy for m in pool)))
    nothing = [m for m in mols if not m.rounds]
    print('molecules that no round deals by size alone: %d' % len(nothing))
    for m in nothing:
        print('   ', m.canonical, m.heavy)


if __name__ == '__main__':
    report()
