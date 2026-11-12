"""Motifs (the files and the talk here say "traits"; see TRAITS.md for the name): what a molecule HAS, counted exactly.

  MOTIFS            name -> Motif(count function, rate, mark), twelve of them, in the order the page lists them
  counts(smiles)    {name: level} for a SMILES string (cached)
  python traits.py test    the tests: for each motif, SMILES in and the count out (3 or more cases each)
  python traits.py study   the measures of TRAITS.md (rounds 1-3, 4-6, 7-9; greedy and look-ahead, ignoring and seeking)

The pay (TRAITS.md, "What they do"): after each step of a turn's chain the molecule is read; the step's places are
multiplied by  1 + sum over motifs of rate * level.  Nothing is capped.
"""
import itertools
import math
import random
import sys
import time
from collections import Counter, defaultdict
from functools import lru_cache

from rdkit import Chem, RDLogger
from rdkit.Chem import rdMolDescriptors

RDLogger.DisableLog('rdApp.*')

_S = Chem.MolFromSmarts
_SUGAR = _S('[CX4]-[OX2H]')
_ACID = _S('[CX3](=[OX1])[OX2H1]')
_AMINE = _S('[NX3;!a;!$(N-[CX3]=[O,S,N]);!$(N-[#7,#8,#16]);!$(N-C#N)]-[#6]')
_THIOETHER = _S('[#6]-[SX2;H0]-[#6]')
_SS = _S('[SX2]-[SX2]')


# ---------------------------------------------------------------------------------------------------------------
# the counts
# ---------------------------------------------------------------------------------------------------------------

def _unique_first(mol, patt, idx=0):
    return len({m[idx] for m in mol.GetSubstructMatches(patt)})


def n_sugar(mol):
    """Sugar units: carbons (sp3) that carry an OH.  Two OH on two carbons is 2; a carbon with two OH counts once."""
    return _unique_first(mol, _SUGAR, 0)


def run_of_double_bonds(mol):
    """The longest run of alternating double bonds: double, single, double, single ... counted as the number of double bonds in
    it.  Read on the Kekule form (a benzene ring is three double bonds, a naphthalene five).  A run of one is a plain double
    bond and is not counted (returns 0); the run must be two or longer."""
    k = Chem.Mol(mol)
    try:
        Chem.Kekulize(k, clearAromaticFlags=True)
    except Exception:
        return 0
    dbl = [b for b in k.GetBonds() if b.GetBondType() == Chem.BondType.DOUBLE]
    n = len(dbl)
    if n < 2:
        return 0
    adj = defaultdict(set)
    for i, j in itertools.combinations(range(n), 2):
        a, b = dbl[i], dbl[j]
        ai = {a.GetBeginAtomIdx(), a.GetEndAtomIdx()}
        bi = {b.GetBeginAtomIdx(), b.GetEndAtomIdx()}
        if ai & bi:
            continue
        linked = False
        for x in ai:
            for y in bi:
                bd = k.GetBondBetweenAtoms(x, y)
                if bd is not None and bd.GetBondType() == Chem.BondType.SINGLE:
                    linked = True
        if linked:
            adj[i].add(j)
            adj[j].add(i)
    best = 1

    def walk(v, seen):
        nonlocal best
        best = max(best, len(seen))
        for w in adj[v]:
            if w not in seen:
                seen.add(w)
                walk(w, seen)
                seen.discard(w)
    for v in range(n):
        walk(v, {v})
    return best if best >= 2 else 0


def n_resonance(mol):
    return run_of_double_bonds(mol)


def n_arene(mol):
    """Aromatic rings (rings whose every atom is aromatic)."""
    ri = mol.GetRingInfo()
    return sum(1 for r in ri.AtomRings() if all(mol.GetAtomWithIdx(i).GetIsAromatic() for i in r))


def _ring_systems(mol):
    """[(rings as atom tuples)] grouped into systems that share an atom."""
    rings = [set(r) for r in mol.GetRingInfo().AtomRings()]
    groups = []
    for r in rings:
        merged = [g for g in groups if any(r & s for s in g)]
        for g in merged:
            groups.remove(g)
        groups.append(sum(merged, []) + [r])
    return groups


def _cage_systems(mol):
    """Ring systems that are cages: two rings share three or more atoms (a bridge), or three or more rings in which every ring
    atom has three ring bonds (a closed shell such as cubane).  Returns [(rings in system, ring-count)]"""
    out = []
    for g in _ring_systems(mol):
        atoms = set().union(*g)
        bonds = {b.GetIdx() for b in mol.GetBonds() if b.GetBeginAtomIdx() in atoms and b.GetEndAtomIdx() in atoms and b.IsInRing()}
        r = len(bonds) - len(atoms) + 1
        bridged = any(len(a & b) >= 3 for a, b in itertools.combinations(g, 2))
        deg = Counter()
        for bi in bonds:
            b = mol.GetBondWithIdx(bi)
            deg[b.GetBeginAtomIdx()] += 1
            deg[b.GetEndAtomIdx()] += 1
        shell = len(g) >= 3 and all(deg[a] == 3 for a in atoms)
        if (bridged or shell) and r >= 2:
            out.append((g, r, atoms))
    return out


def n_cage(mol):
    """Cage level: for each bridged or closed-shell ring system, the number of rings tied into it minus one
    (norbornane 1, adamantane 2, cubane 4)."""
    return sum(r - 1 for _, r, _ in _cage_systems(mol))


def n_ring(mol):
    """Plain rings: rings that are not aromatic and not inside a cage."""
    cage_atoms = set()
    for _, _, atoms in _cage_systems(mol):
        cage_atoms |= atoms
    n = 0
    for r in mol.GetRingInfo().AtomRings():
        if all(mol.GetAtomWithIdx(i).GetIsAromatic() for i in r):
            continue
        if set(r) <= cage_atoms:
            continue
        n += 1
    return n


def n_fusion(mol):
    """Fused pairs: pairs of rings that share exactly one side (two atoms joined by a bond).  Not counted inside a cage.
    Naphthalene 1, decalin 1, a steroid's four rings 3."""
    cage_atoms = set()
    for _, _, atoms in _cage_systems(mol):
        cage_atoms |= atoms
    rings = [set(r) for r in mol.GetRingInfo().AtomRings() if not set(r) <= cage_atoms]
    n = 0
    for a, b in itertools.combinations(rings, 2):
        sh = a & b
        if len(sh) == 2:
            i, j = tuple(sh)
            if mol.GetBondBetweenAtoms(i, j) is not None:
                n += 1
    return n


def n_spiro(mol):
    """Spiro centres: an atom that is the only atom two rings share."""
    return rdMolDescriptors.CalcNumSpiroAtoms(mol)


def n_branch(mol):
    """Branch points: sp3 carbons with three or four carbon neighbours."""
    return sum(1 for a in mol.GetAtoms() if a.GetAtomicNum() == 6 and a.GetHybridization() == Chem.HybridizationType.SP3
               and sum(1 for n in a.GetNeighbors() if n.GetAtomicNum() == 6) >= 3)


def n_acid(mol):
    return _unique_first(mol, _ACID, 0)


def n_amine(mol):
    """Nitrogens that are amines (not amides, not aromatic, not N-O or N-N or nitriles)."""
    return _unique_first(mol, _AMINE, 0)


def n_sulfur(mol):
    """Sulfur bridges: each C-S-C is one, each S-S bond is one."""
    return len(mol.GetSubstructMatches(_THIOETHER)) // 2 * 0 + len({m[1] for m in mol.GetSubstructMatches(_THIOETHER)}) + \
        len({tuple(sorted(m)) for m in mol.GetSubstructMatches(_SS)})


def plain_stretch(mol):
    """Carbons in the longest unbroken stretch of plain carbons: not in a ring, CH2 or CH3, joined by single bonds."""
    ok = {a.GetIdx() for a in mol.GetAtoms() if a.GetAtomicNum() == 6 and not a.IsInRing() and a.GetTotalNumHs() in (2, 3)
          and a.GetHybridization() == Chem.HybridizationType.SP3}
    best = 0

    def walk(v, seen):
        nonlocal best
        best = max(best, len(seen))
        for nb in mol.GetAtomWithIdx(v).GetNeighbors():
            w = nb.GetIdx()
            if w in ok and w not in seen:
                seen.add(w)
                walk(w, seen)
                seen.discard(w)
    for v in ok:
        if sum(1 for nb in mol.GetAtomWithIdx(v).GetNeighbors() if nb.GetIdx() in ok) <= 1:
            walk(v, {v})
    return best


def n_chain(mol):
    """Chain level: the longest plain stretch divided by three, rounded down (a stretch of 3 to 5 carbons is 1, 6 to 8 is 2)."""
    return plain_stretch(mol) // 3


class Motif:
    def __init__(self, name, plain, fn, rate, unit, mark):
        self.name, self.plain, self.fn, self.rate, self.unit, self.mark = name, plain, fn, rate, unit, mark


# name, how it is said, count, pay per level, what one level is, the mark beside the molecule
MOTIFS = {m.name: m for m in [
    Motif('sugar', 'sugar', n_sugar, 0.07, 'a carbon with an OH', 'a sugar cube'),
    Motif('resonance', 'resonance', n_resonance, 0.09, 'a double bond in the longest alternating run', 'a wave'),
    Motif('arene', 'benzene ring', n_arene, 0.35, 'an aromatic ring', 'a hexagon with an inner circle'),
    Motif('ring', 'ring', n_ring, 0.07, 'a ring that is not aromatic and not in a cage', 'a plain polygon'),
    Motif('fusion', 'shared side', n_fusion, 0.2, 'two rings sharing one side', 'two polygons touching along a side'),
    Motif('cage', 'cage', n_cage, 0.04, 'a ring tied into a bridged or closed shell, minus one', 'a cube outline'),
    Motif('spiro', 'spiro centre', n_spiro, 0.12, 'a single atom two rings share', 'two polygons touching at a point'),
    Motif('acid', 'acid', n_acid, 0.35, 'a COOH', 'a drop'),
    Motif('amine', 'amine', n_amine, 0.3, 'an amine nitrogen', 'a three-pronged crown'),
    Motif('sulfur', 'sulfur bridge', n_sulfur, 0.5, 'a C-S-C or an S-S', 'a yellow arch'),
    Motif('branch', 'branch point', n_branch, 0.04, 'a carbon holding three or four other carbons', 'a fork'),
    Motif('chain', 'long chain', n_chain, 0.15, 'three plain carbons in a row, longest stretch', 'a zigzag'),
]}
NAMES = tuple(MOTIFS)


@lru_cache(maxsize=None)
def counts(smi):
    mol = Chem.MolFromSmiles(smi)
    return {k: m.fn(mol) for k, m in MOTIFS.items()}


@lru_cache(maxsize=None)
def standing(smi):
    """The molecule as it stands: a ring a reflex closed loosely is read open (engine.reopen), so only what stays counts."""
    return E.ENGINE.reopen(smi)[0]


@lru_cache(maxsize=None)
def counts_tuple(smi):
    c = counts(standing(smi))
    return tuple(c[k] for k in NAMES)


# ---------------------------------------------------------------------------------------------------------------
# tests
# ---------------------------------------------------------------------------------------------------------------
CASES = {
    'sugar': [('CC(O)CC(O)CC(O)C', 3), ('OCC(O)C(O)C(O)C(O)CO', 6), ('CCCCC', 0), ('OC1=CC=CC=C1', 0), ('OC(O)CC', 1),
              ('CC(=O)O', 0), ('C=CO', 0)],
    'resonance': [('C=CC=C', 2), ('C=CC=CC=CC=CC=C', 5), ('C=CC=CC=C', 3), ('C=CCC=C', 0), ('C=C', 0), ('c1ccccc1', 3),
                  ('C=CC=O', 2), ('c1ccc2ccccc2c1', 5), ('CC=CC(=O)C=C', 3), ('C=C=C', 0)],
    'arene': [('c1ccccc1', 1), ('c1ccc2ccccc2c1', 2), ('Cc1ccc(C)cc1', 1), ('C1CCCCC1', 0), ('c1ccc(-c2ccccc2)cc1', 2),
              ('C1=CC=CC=C1', 1)],
    'ring': [('C1CCCC1', 1), ('C1CCC2CCCCC2C1', 2), ('c1ccccc1', 0), ('C1CCCC1CC1CCCC1', 2), ('C12C3C4C1C5C2C3C45', 0),
             ('C1CC2CCC1C2', 0), ('CCCC', 0)],
    'fusion': [('c1ccc2ccccc2c1', 1), ('C1CCC2CCCCC2C1', 1), ('CC12CCC3C(CCC4CCCCC34)C1CCC2', 3), ('C1CCCC1CC1CCCC1', 0),
               ('C1CCC2(C1)CCCC2', 0), ('C1CC2CCC1C2', 0)],
    'cage': [('C1CC2CCC1C2', 1), ('C12CC3CC(CC(C3)C1)C2', 2), ('C12C3C4C1C5C2C3C45', 4), ('C1CCC2CCCCC2C1', 0),
             ('C1CCCCC1', 0), ('C1CC2CC1C2', 1)],
    'spiro': [('C1CCC2(C1)CCCC2', 1), ('C1CCC2(CC1)CCCC2', 1), ('C1CCC2(C1)CCC3(C2)CCCC3', 2), ('C1CCC2CCCCC2C1', 0),
              ('CCCC', 0)],
    'acid': [('CC(=O)O', 1), ('OC(=O)CCC(=O)O', 2), ('CC(=O)OC', 0), ('CC(=O)N', 0), ('OC(=O)c1ccccc1', 1), ('CCO', 0)],
    'amine': [('CCN', 1), ('CCNCC', 1), ('NCCCN', 2), ('CC(=O)N', 0), ('c1ccncc1', 0), ('CN(C)C', 1), ('CC#N', 0)],
    'sulfur': [('CSC', 1), ('CSSC', 1), ('CSCSC', 2), ('CS', 0), ('C1CCSCC1', 1), ('CSSSC', 2), ('CCO', 0)],
    'branch': [('CC(C)C', 1), ('CC(C)(C)C', 1), ('CC(C)CC(C)C', 2), ('CCCC', 0), ('CC(C)(O)C', 1), ('C1CC1', 0), ('CC(O)C', 0)],
    'chain': [('CCCCCC', 2), ('CCC', 1), ('CC', 0), ('CCCC(O)CCC', 1), ('CCCCCCCCC', 3), ('C1CCCCC1', 0), ('CCCCCCCCCCCC', 4),
              ('CC(C)CCCCCC', 2)],
}


def run_tests():
    bad = 0
    total = 0
    for name, rows in CASES.items():
        assert len(rows) >= 3
        for smi, want in rows:
            got = MOTIFS[name].fn(Chem.MolFromSmiles(smi))
            total += 1
            if got != want:
                bad += 1
                print('FAIL %-9s %-34s want %d got %d' % (name, smi, want, got))
    print('%d cases, %d wrong, %d motifs' % (total, bad, len(CASES)))
    return bad

# ---------------------------------------------------------------------------------------------------------------
# a turn's chain, step by step, with the molecule after each step (engine.settle does not keep these)
# ---------------------------------------------------------------------------------------------------------------
import os
import engine as E
import library
import molecules
from chemlib import parse, canon

SIX = library.SIX
EXTRAS = tuple(r for r in library.POOL if r not in SIX)
STAGES = {
    1: {'rounds': (1, 2, 3), 'rules': library.SELF_TIER1, 'six': 6, 'extra': 0},
    2: {'rounds': (4, 5, 6), 'rules': ('ring', 'dry', 'flip', 'shift', 'tuck', 'weld', 'snap'), 'six': 6, 'extra': 2},
    3: {'rounds': (7, 8, 9), 'rules': library.SELF_ALL, 'six': 3, 'extra': 5},
}
RATES = {k: m.rate for k, m in MOTIFS.items()}
LOOK_KEEP = 8      # the look-ahead player follows only the 8 best lines of this turn (ties drawn at random) into the next turn


def carried_for(stage, seed):
    st = STAGES[stage]
    rng = random.Random('carry/%s/%s' % (stage, seed))
    six = list(SIX) if st['six'] == 6 else rng.sample(list(SIX), st['six'])
    ex = rng.sample(list(EXTRAS), st['extra'])
    return tuple(six + ex)


class Stepped:
    __slots__ = ('smi', 'steps', 'states')


_STEP = {}


def stepped(eng, smi, line, rules):
    """Fire `line` and let the molecule go on by itself exactly as Engine.run_line does, keeping the molecule after each step.
    Built from the line without its last reaction, so every prefix is shared."""
    key = (smi, line, rules)
    r = _STEP.get(key)
    if r is not None:
        return r
    if not line:
        r = Stepped()
        r.smi, r.steps, r.states = smi, (), ()
        _STEP[key] = r
        return r
    prev = stepped(eng, smi, line[:-1], rules)
    f = eng.fire(prev.smi, line[-1])
    r = Stepped()
    if not f.acted:
        r.smi, r.steps, r.states = prev.smi, prev.steps, prev.states
    else:
        cnt = Counter(prev.steps)
        steps, states = list(prev.steps), list(prev.states)
        mol = parse(f.smi)
        state = f.smi
        while True:
            act = tuple(x for x in rules if getattr(eng.self_rules[x], 'per_turn', None) is None or cnt[x] < eng.self_rules[x].per_turn)
            if len(steps) >= eng.cap:
                break
            nxt = eng._next_self(mol, act)
            if nxt is None:
                break
            rule, (mol, dropped) = nxt
            steps.append(rule.name)
            cnt[rule.name] += 1
            states.append(Chem.MolToSmiles(mol))
        r.smi, r.steps, r.states = Chem.MolToSmiles(mol), tuple(steps), tuple(states)
    _STEP[key] = r
    return r


FORM = 'product'      # 'sum': 1 + sum of rate * level;  'product': each motif multiplies, (1 + rate * level) for each


def step_mult(c, rates, form=None):
    """(multiplier, {motif: share of the bonus}) for a vector of levels c (in NAMES order).  The product form splits the bonus
    among the motifs by the logarithm of each one's factor."""
    form = form or FORM
    if form == 'sum':
        parts = {nm: rates[nm] * v for nm, v in zip(NAMES, c) if v}
        return 1.0 + sum(parts.values()), parts
    m = 1.0
    logs = {}
    for nm, v in zip(NAMES, c):
        if v:
            f = 1.0 + rates[nm] * v
            m *= f
            logs[nm] = math.log(f)
    tot = sum(logs.values())
    return m, {nm: (m - 1.0) * l / tot for nm, l in logs.items()} if tot else {}


def turn_pay(st, best_prior, rates):
    """(pay with motifs, pay without, {motif: bonus}) of one turn's chain."""
    on = off = 0.0
    bonus = Counter()
    for k, s in enumerate(st.states, 1):
        w = 1.0 if k > best_prior else E.OLD
        base = E.PLACE * (1.0 + (k - 1) * w)
        m, parts = step_mult(counts_tuple(s), rates)
        off += base
        on += base * m
        for nm, p in parts.items():
            bonus[nm] += base * p
    return on, off, bonus


def lines_for(eng, smi, hand, left, rules):
    return [(line, stepped(eng, smi, line, rules)) for line in eng.valid_lines(hand, left)]


def best_next(eng, smi, carried, left, rules, best_prior, seed, turn, turns, seek, rates, memo):
    if turn >= turns:
        return 0.0
    hand = eng.hand_for(carried, left, seed, turn)
    key = (smi, hand, tuple(sorted(left.items())), best_prior, turn, seek)
    v = memo.get(key)
    if v is not None:
        return v
    best = 0.0
    for line, st in lines_for(eng, smi, hand, left, rules):
        p = turn_pay(st, best_prior, rates)[0 if seek else 1]
        best = max(best, p)
    memo[key] = best
    return best


def play(eng, smi, carried, rules, seed, depth, seek, rates, turns=3):
    """One round.  depth 1 is greedy, 2 looks one turn ahead (the next hand is known).  seek: values a line by the pay with
    motifs, otherwise by the pay without."""
    smi, _ = eng.reopen(canon(smi))
    left = {r: E.USES for r in carried}
    rng = random.Random('player/%s' % seed)
    memo = {}
    best_prior = 0
    rec = {'start': counts(smi), 'smi0': smi, 'turns': [], 'on': 0.0, 'off': 0.0, 'extra': 1.0, 'bonus': Counter(),
           'peak': dict(counts(smi))}
    for t in range(turns):
        hand = eng.hand_for(carried, left, seed, t)
        if not hand:
            break
        cands = []
        first = []
        for line, st in lines_for(eng, smi, hand, left, rules):
            on, off, _ = turn_pay(st, best_prior, rates)
            first.append((on if seek else off, line, st))
        if depth > 1 and t + 1 < turns and len(first) > LOOK_KEEP:
            rng.shuffle(first)
            first.sort(key=lambda x: -x[0])
            first = first[:LOOK_KEEP]
        for val, line, st in first:
            if depth > 1 and t + 1 < turns:
                nsmi, _ = eng.reopen(st.smi)
                nleft = dict(left)
                for r in line:
                    nleft[r] -= 1
                val += best_next(eng, nsmi, carried, nleft, rules, max(best_prior, len(st.steps)), seed, t + 1, turns, seek, rates, memo)
            cands.append((val, line, st))
        top = max(c[0] for c in cands)
        pick = rng.choice([c for c in cands if c[0] == top])
        _, line, st = pick
        on, off, bonus = turn_pay(st, best_prior, rates)
        n = len(st.steps)
        p, e, full = E.pay_cached(n, best_prior)
        assert abs(p - off) < 1e-6, (p, off)
        for r in line:
            left[r] -= 1
        rec['on'] += on
        rec['off'] += off
        rec['extra'] += e
        rec['bonus'].update(bonus)
        for k_, s in enumerate(st.states, 1):
            w_ = 1.0 if k_ > best_prior else E.OLD
            rec.setdefault('steps', []).append((E.PLACE * (1.0 + (k_ - 1) * w_), counts_tuple(s)))
            for k, v in counts(standing(s)).items():
                if v > rec['peak'][k]:
                    rec['peak'][k] = v
        rec['turns'].append({'n': n, 'line': line})
        smi, _ = eng.reopen(st.smi)
        best_prior = max(best_prior, n)
    rec['end'] = counts(smi)
    rec['smi_end'] = smi
    return rec


def mult_of(smi, rates):
    return step_mult(counts_tuple(canon(smi)), rates)[0]


def job(args):
    stage, depth, seek, seeds, rates = args
    eng = E.Engine()
    st = STAGES[stage]
    out = []
    for seed in seeds:
        rnd = st['rounds'][seed % 3]
        rng = random.Random('mol/%s' % seed)
        smi = molecules.deal_molecule(rnd, rng, 3)
        if seek == 2:
            # the seeker is offered a second molecule (the game's choice of one from two) and takes the one with the better start
            smi2 = molecules.deal_molecule(rnd, rng, 3)
            m1, m2 = mult_of(smi, rates), mult_of(smi2, rates)
            if m2 > m1:
                smi = smi2
        carried = carried_for(stage, seed)
        out.append((stage, depth, seek, seed, rnd, play(eng, smi, carried, st['rules'], seed, depth, seek, rates)))
    return out


def run_study(n=300, rates=None, workers=None, stages=(1, 2, 3), modes=((1, 0), (2, 0), (1, 1), (2, 1), (1, 2), (2, 2))):
    """Runs the jobs as separate python processes (multiprocessing is refused on some machines) and collects their pickles."""
    import pickle
    import subprocess
    import tempfile
    rates = rates or RATES
    d = tempfile.mkdtemp(prefix='traits_')
    tasks = []
    for stage in stages:
        for depth, seek in modes:
            if True:
                for k in range(0, n, 15):
                    tasks.append((stage, depth, seek, list(range(k, min(n, k + 15))), rates))
    # heavy ones first
    tasks.sort(key=lambda t: -(t[1] * 10 + t[0]))
    procs = []
    outs = []
    maxp = workers or max(1, (os.cpu_count() or 4) - 1)
    for i, t in enumerate(tasks):
        inp, outp = os.path.join(d, 'in%d.pkl' % i), os.path.join(d, 'out%d.pkl' % i)
        pickle.dump(t, open(inp, 'wb'))
        while sum(1 for p in procs if p.poll() is None) >= maxp:
            time.sleep(0.5)
        procs.append(subprocess.Popen([sys.executable, os.path.abspath(__file__), 'chunk', inp, outp]))
        outs.append(outp)
    for p in procs:
        p.wait()
    res = []
    for o in outs:
        res.extend(pickle.load(open(o, 'rb')))
    return res


def mean(a):
    a = list(a)
    return sum(a) / len(a) if a else 0.0


def cv(a):
    m = mean(a)
    return math.sqrt(mean([(x - m) ** 2 for x in a])) / m if m else 0.0


def report(flat, rates, out=print):
    by = defaultdict(dict)
    for stage, depth, seek, seed, rnd, rec in flat:
        by[(stage, depth, int(seek))][seed] = rec
    label = lambda d, s: ('look-ahead' if d == 2 else 'greedy') + ' ' + ('ignoring', 'seeking lines', 'seeking molecule and lines')[s]
    for stage in sorted({k[0] for k in by}):
        out('')
        out('=== Stage %d (rounds %s) ===' % (stage, STAGES[stage]['rounds']))
        for (d, s) in ((1, 0), (2, 0), (1, 1), (2, 1), (1, 2), (2, 2)):
            recs = list(by.get((stage, d, s), {}).values())
            if not recs:
                continue
            out('--- %s, %d rounds ---' % (label(d, s), len(recs)))
            if s == 0 or s == 2:
                out('%-9s %7s %5s | %7s %5s %5s %5s %4s | %7s %5s | %6s' % ('motif', 'start%', 'lvl', 'peak%', 'lvl', '>=3', '>=5', 'max', 'end%', 'lvl', 'gain1+'))
                for k in NAMES:
                    st = [r['start'][k] for r in recs]
                    pk = [r['peak'][k] for r in recs]
                    en = [r['end'][k] for r in recs]
                    pres = lambda a: 100.0 * sum(1 for x in a if x) / len(a)
                    lv = lambda a: mean([x for x in a if x])
                    ge = lambda a, t: 100.0 * sum(1 for x in a if x >= t) / len(a)
                    gain = 100.0 * sum(1 for r in recs if r['peak'][k] - r['start'][k] >= 1) / len(recs)
                    out('%-9s %6.1f%% %5.2f | %6.1f%% %5.2f %4.0f%% %4.0f%% %4d | %6.1f%% %5.2f | %5.1f%%' % (
                        k, pres(st), lv(st), pres(pk), lv(pk), ge(pk, 3), ge(pk, 5), max(pk), pres(en), lv(en), gain))
            yon = [r['on'] * r['extra'] for r in recs]
            yoff = [r['off'] * r['extra'] for r in recs]
            out('yield with motifs / without: %.3f   (mean %.0f vs %.0f)' % (sum(yon) / sum(yoff), mean(yon), mean(yoff)))
            tot = Counter()
            for r in recs:
                tot.update(r['bonus'])
            T = sum(tot.values()) or 1
            out('share of motif yield: ' + ', '.join('%s %.0f%%' % (k, 100 * tot[k] / T) for k in NAMES if tot[k]))
            out('spread of round yield (sd/mean): without %.3f, with %.3f' % (cv(yoff), cv(yon)))
            top = Counter(max(r['bonus'], key=r['bonus'].get) if r['bonus'] else 'none' for r in recs)
            out('motif paying most in a round: ' + ', '.join('%s %d' % kv for kv in top.most_common()))
        for d in (1, 2):
            base = by.get((stage, d, 0), {})
            for s in (1, 2):
                other = by.get((stage, d, s), {})
                seeds = sorted(set(base) & set(other))
                if not seeds:
                    continue
                a = [other[k]['on'] * other[k]['extra'] for k in seeds]
                b_ = [base[k]['on'] * base[k]['extra'] for k in seeds]
                lr = sorted(math.log(x / y) for x, y in zip(a, b_) if x > 0 and y > 0)
                wins = sum(1 for x, y in zip(a, b_) if x > y * 1.0001)
                loss = sum(1 for x, y in zip(a, b_) if x < y * 0.9999)
                out('%s vs ignoring, %d paired rounds: mean yield %.0f vs %.0f (ratio %.3f); typical round x%.3f (geometric mean), median x%.3f; '
                    'ahead in %d%%, behind in %d%%' % (label(d, s), len(seeds), mean(a), mean(b_), sum(a) / sum(b_),
                                                     math.exp(mean(lr)), math.exp(lr[len(lr) // 2]), 100 * wins / len(seeds), 100 * loss / len(seeds)))


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        sys.exit(1 if run_tests() else 0)
    if len(sys.argv) > 1 and sys.argv[1] == 'chunk':
        import pickle
        pickle.dump(job(pickle.load(open(sys.argv[2], 'rb'))), open(sys.argv[3], 'wb'))
        sys.exit(0)
    if len(sys.argv) > 1 and sys.argv[1] == 'study':
        t0 = time.time()
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 300
        flat = run_study(n)
        import pickle
        if len(sys.argv) > 3:
            pickle.dump(flat, open(sys.argv[3], 'wb'))
        report(flat, RATES)
        print('\n%.0f seconds' % (time.time() - t0))
