"""The order the pieces after the start are unlocked in, with one deed each, and a check that every deed can be done.

The player starts with the six reactions (hydrate, hydroborate, dehydrate, oxidize, reduce, grow) and two self-reactions
(ring, dry).  Every other piece is opened by a deed.  A deed is done with the pieces held when it is asked for, in one
turn: at some point in the turn (right after a reaction, or when the chain it set off has settled) the molecule shows a
pattern that it did not show at the start of the turn.  The pattern is what the new piece works on, so the deed
teaches what the piece is for.

`check_all()` plays every line of up to three held reactions on a sample of the game's molecules and says, for each deed,
on how many molecules it can be done and gives one worked line.  Run `python unlocks.py` for the table.
"""
import itertools
import random
import sys
from collections import Counter

from rdkit import Chem

import library as L
import molecules
from chemlib import parse, pair_sites
from engine import Engine

KC = L.KC


def pat(sma):
    q = Chem.MolFromSmarts(sma)
    return lambda m: m.HasSubstructMatch(q)


def count(sma, n):
    q = Chem.MolFromSmarts(sma)
    return lambda m: len(m.GetSubstructMatches(q)) >= n


def pairp(a, b, ia, ib, lo, hi):
    return lambda m: bool(pair_sites(m, a, b, ia, ib, lo, hi))


def site(rule):
    return lambda m: bool(L.SELF_RULES[rule].find(m))


def both(*fs):
    return lambda m: all(f(m) for f in fs)


_ALD_OR_MEK = '[CX3H1,$([CX3H0](=O)[CH3]);!$(C(=O)-[!#6]);!$(C-[#6]=[#6]):1]=[O:5]'

# (kind, key, the deed in plain words, what it teaches, the pattern that must show up)
ORDER = [
    ('s', 'weld', 'Have a CH beside a C=O and a second C=O four or five carbons from that carbon.',
     'The carbon beside one C=O can join the second C=O and close a ring.', site('weld')),
    ('s', 'shift', 'Have a C=C two carbons from a C=O.',
     'A C=C two carbons from a C=O slides over to sit beside it.', site('shift')),
    ('r', 'hwe', 'Have an aldehyde or a methyl ketone with an OH three or four carbons from it.',
     'The C=O becomes C=CH-CO-CH3: a C=C next to a new C=O, which the OH can then close onto.',
     pairp(_ALD_OR_MEK, '[OX2H:3]-[CX4:4]', 1, 4, 3, 4)),
    ('s', 'tuck', 'Have a C=C beside a C=O and an OH three or four carbons from the far end of the C=C.',
     'The OH adds to the far carbon and closes a ring.', site('tuck')),
    ('r', 'epoxidation', 'Have a C=C and an OH three or four carbons apart.',
     'The C=C becomes an epoxide, and an OH nearby can open it into a ring.',
     pairp('[C:1]=[C:2]', '[OX2H:3]-[CX4:4]', 1, 4, 3, 4)),
    ('s', 'open', 'Have an epoxide and an OH three or four carbons apart.',
     'The OH opens the epoxide and closes a ring.', site('open')),
    ('s', 'fold', 'Have an epoxide with a carbon on both ends.',
     'Such an epoxide turns into a C=O.', site('fold')),
    ('r', 'dihydroxylation', 'Have a C=C beside a C=O.',
     'Both carbons of the C=C take an OH, and one of them lands two carbons from the C=O.',
     pat('[C]=[C]-[C]=O')),
    ('s', 'flip', 'Have an OH on a carbon of a C=C.',
     'That OH turns the C=C into a C=O.', site('flip')),
    ('r', 'chlorination', 'Have two OH three to five carbons apart.',
     'One OH becomes Cl, and the other OH can close onto it.',
     pairp('[OX2H:1]-[CX4:2]', '[OX2H:3]-[CX4:4]', 2, 4, 3, 5)),
    ('s', 'close', 'Have a Cl and an OH, NH2, SH or COOH three to five carbons apart.',
     'The Cl leaves as acid fumes and the other group closes a ring through its O, N or S.', site('close')),
    ('r', 'ozonolysis', 'Have a C=C that has a carbon on both ends of both its carbons (not at the end of a chain).',
     'The C=C is cut and both cut carbons become C=O.', pat('[C;!D1]=[C;!D1]')),
    ('s', 'snap', 'Have three C=C, two of them side by side.',
     'The side-by-side pair and the third C=C close a six-ring.', site('snap')),
    ('r', 'thiolene', 'Have a C=C and a C=O three to five carbons apart.',
     'The C=C takes an SH, and that SH can close onto the C=O.',
     pairp('[C:1]=[C:2]', '[%s:3]=[OX1:4]' % KC, 1, 3, 3, 5)),
    ('s', 'cap', 'Have an SH and a C=O three or four carbons apart.',
     'The SH closes a ring onto the C=O.', site('cap')),
    ('r', 'ritter', 'Have two C=C and a C=O on the molecule at once.',
     'Every C=C takes an NH2, and an NH2 near a C=O can close onto it.',
     both(count('[C]=[C]', 2), pat('[%s]=[OX1]' % KC))),
    ('s', 'knit', 'Have an NH2 and a C=O three or four carbons apart.',
     'The NH2 closes a ring onto the C=O.', site('knit')),
    ('r', 'hofmann', 'Have an NH2 on a carbon.',
     'The NH2 leaves and a C=C forms in its place.', pat('[NX3H2]-[CX4]')),
    ('r', 'chugaev', 'Have an OH on a carbon whose two neighbours are both CH2.',
     'The OH leaves and the C=C forms toward the neighbour with more H, the other way from dehydrate.',
     pat('[CH1;X4]([OX2H])([CH2])[CH2]')),
    ('r', 'hydroformylation', 'Have a C=C and an OH two or three carbons apart.',
     'The C=C takes a CHO, one carbon longer, which an OH nearby can close onto.',
     pairp('[C:1]=[C:2]', '[OX2H:3]-[CX4:4]', 1, 4, 2, 3)),
    ('r', 'permanganate', 'Have a C=C at the end of a chain and an OH three to five carbons from it.',
     'The chain end becomes COOH, which the OH can close onto.',
     pairp('[CH2D1:1]=[CH1D2:2]', '[OX2H:3]-[CX4:4]', 2, 4, 3, 5)),
    ('r', 'cyanohydrin', 'Have an aldehyde or a methyl ketone with an OH two to four carbons from it.',
     'The C=O becomes C(OH)-COOH, and the COOH can close onto the other OH.',
     pairp(_ALD_OR_MEK, '[OX2H:3]-[CX4:4]', 1, 4, 2, 4)),
    ('s', 'seal', 'Have a COOH and an OH, NH2 or SH three or four carbons apart.',
     'They join into a ring and water comes off.', site('seal')),
]

START_REACTIONS = tuple(L.SIX)
START_SELF = ('ring', 'dry')
KEYS = [o[1] for o in ORDER]


def states_seen(eng, smi, line, rules):
    """The molecule right after each reaction of the line that acted, and again when the chain it set off has settled."""
    out = []
    cur = smi
    for i, r in enumerate(line):
        f = eng.fire(cur, r)
        if not f.acted:
            continue
        out.append((r, f.smi))
        t = eng.run_line(smi, line[:i + 1], rules)
        cur = t.smi
        out.append(('chain', t.smi))
    return out


def held_before(index):
    """(reactions, self-reactions) held when deed number `index` (0-based) is asked."""
    hr, hs = list(START_REACTIONS), list(START_SELF)
    for kind, key, *_ in ORDER[:index]:
        (hr if kind == 'r' else hs).append(key)
    return hr, hs


def check(index, mols=None, sample=30, seed=1, eng=None):
    """(molecules it can be done on, molecules tried, one worked example or None) for deed number `index`."""
    kind, key, deed, teaches, f = ORDER[index]
    hr, hs = held_before(index)
    eng = eng or Engine()
    rules = tuple(x for x in L.SELF_ORDER if x in hs)
    ms = list(mols if mols is not None else molecules.game_molecules())
    random.Random(seed).shuffle(ms)
    ms = ms[:sample]
    ok = tried = 0
    ex = None
    for m in ms:
        smi = eng.reopen(m.canonical)[0]
        if f(parse(smi)):
            continue                      # it has to be made in the turn, not already there
        tried += 1
        found = None
        for n in (1, 2, 3):
            for line in itertools.product(hr, repeat=n):
                if any(c > 3 for c in Counter(line).values()):
                    continue
                for lab, s in states_seen(eng, smi, line, rules):
                    if f(parse(s)):
                        found = (smi, line, lab, s)
                        break
                if found:
                    break
            if found:
                break
        if found:
            ok += 1
            if ex is None or (parse(found[0]).GetNumHeavyAtoms(), len(found[1])) < (parse(ex[0]).GetNumHeavyAtoms(), len(ex[1])):
                ex = found
    return ok, tried, ex


def _one(args):
    i, sample = args
    return i, check(i, sample=sample)


def check_all(processes=6, sample=30):
    import multiprocessing as mp
    with mp.Pool(processes) as p:
        return dict(p.map(_one, [(i, sample) for i in range(len(ORDER))]))


if __name__ == '__main__':
    res = check_all(sample=int(sys.argv[1]) if len(sys.argv) > 1 else 30)
    for i, (kind, key, deed, teaches, f) in enumerate(ORDER):
        ok, n, ex = res[i]
        hr, hs = held_before(i)
        print('%2d %-16s (%s) holding %d reactions, %d self-reactions: can be done on %d of %d molecules' % (
            i + 1, key, 'reaction' if kind == 'r' else 'self-reaction', len(hr), len(hs), ok, n))
        print('     deed: %s' % deed)
        if ex:
            print('     e.g. %s  line %s  (seen %s) %s' % (ex[0], ' + '.join(ex[1]), ex[2], ex[3]))
