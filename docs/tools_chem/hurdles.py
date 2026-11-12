"""Hurdles for Overreact rounds: an "at least N" about the molecule or about what happened in the round.

A hurdle is a measured number.  A round is won when value >= N (N is shown at the start of the round).  Nothing caps the
value: going past N is what the points and the four words reward.  Points are a separate thing (engine.py).

  HURDLES            name -> Hurdle, every hurdle that can be checked exactly
  Hurdle.check(molecule, round_log) -> the measured value (a number)
  Log                a round as the hurdles read it: the start molecule and, per turn, the line, the chain, what was fired,
                     what came off, and the molecule at the end of the turn's chain (before the rings open again)
  round_log(rr)      a Log from the dict engine.Engine.play_round returns
  SeekPlayer(h)      plays for the hurdle's value, then points      (what a player who aims at it does)
  AimPlayer([(h,N)]) plays toward N and then for points             (the competent player the generator is tested with)
  pick_hurdle(...)   the generator: a hurdle and its N for a dealt molecule

How a structural hurdle reads the molecule (the same for all, so a page can say it in one line):
  gain  : the best end-of-turn molecule of the round, minus the start molecule (never below 0)
  loss  : the start molecule minus the smallest end-of-turn molecule
  abs   : the best end-of-turn molecule of the round
  last  : the molecule at the end of the last turn
  range : the largest minus the smallest size seen (start and all end-of-turn molecules)
The molecule is read at the end of the turn's chain, before the loose rings open again.
"""
import itertools
import random
from collections import Counter
from functools import lru_cache

from rdkit import Chem, RDLogger
from rdkit.Chem import Descriptors, rdMolDescriptors

import engine as E
import library
from chemlib import parse, canon

RDLogger.DisableLog('rdApp.*')

# ---------------------------------------------------------------------------------------------------------------
# what is read off a molecule
# ---------------------------------------------------------------------------------------------------------------
_P = lambda s: Chem.MolFromSmarts(s)
GROUP_SMARTS = {
    'OH': _P('[OX2H1][#6;!$([#6]=O)]'),                    # alcohol or phenol OH (not the OH of an acid)
    'C=O': _P('[CX3;!$(C-[!#6])]=[OX1]'),                   # ketone or aldehyde: a C=O carbon with only carbon neighbours
    'C=C': _P('C=C'),                                      # a double bond between two non-aromatic carbons
    'COOH': _P('[CX3](=[OX1])[OX2H1]'),
    'NH2': _P('[NX3H2][#6;!$(C=O)]'),
    'SH': _P('[SX2H1]'),
    'Cl': _P('[Cl]'),
    'ester': _P('[CX3](=[OX1])[OX2H0][#6]'),
    'ether': _P('[OX2H0;!$(O-C=O)]([#6])[#6]'),
    'amide': _P('[CX3](=[OX1])[NX3]'),
    'S-S': _P('[SX2][SX2]'),
    'C=N': _P('[CX3]=[NX2]'),
}
GROUPS = list(GROUP_SMARTS)
SITE7 = ['OH', 'C=O', 'C=C', 'COOH', 'NH2', 'SH', 'Cl']       # the groups the player's reactions work on


def _uf(n):
    p = list(range(n))

    def find(x):
        while p[x] != x:
            p[x] = p[p[x]]
            x = p[x]
        return x

    def union(a, b):
        p[find(a)] = find(b)
    return find, union


def _longest_chain(mol):
    """Atoms on the longest path through carbons that are not in a ring (those carbons form a forest)."""
    nodes = [a.GetIdx() for a in mol.GetAtoms() if a.GetAtomicNum() == 6 and not a.IsInRing()]
    ns = set(nodes)
    adj = {i: [n.GetIdx() for n in mol.GetAtomWithIdx(i).GetNeighbors() if n.GetIdx() in ns] for i in nodes}

    def far(s):
        seen = {s: 0}
        q = [s]
        for x in q:
            for y in adj[x]:
                if y not in seen:
                    seen[y] = seen[x] + 1
                    q.append(y)
        m = max(seen, key=seen.get)
        return m, seen[m], seen
    done, best = set(), 0
    for s in nodes:
        if s in done:
            continue
        a, _, comp = far(s)
        done |= set(comp)
        _, d, _ = far(a)
        best = max(best, d + 1)
    return best


@lru_cache(maxsize=400000)
def feat(smi):
    """Every structural number any hurdle reads, for one molecule (a canonical SMILES)."""
    mol = parse(smi)
    f = {}
    atoms = list(mol.GetAtoms())
    f['atoms'] = len(atoms)
    f['weight'] = int(round(Descriptors.MolWt(mol)))
    rings = [set(r) for r in mol.GetRingInfo().AtomRings()]
    f['rings'] = len(rings)
    f['ring5'] = sum(1 for r in rings if len(r) == 5)
    f['ring6'] = sum(1 for r in rings if len(r) == 6)
    f['ring_small'] = sum(1 for r in rings if len(r) <= 4)
    f['ring_big'] = sum(1 for r in rings if len(r) >= 7)
    f['ring_sizes'] = len({len(r) for r in rings})
    f['ring_atoms'] = len(set().union(*rings)) if rings else 0
    n = len(rings)
    fu, uu = _uf(n)
    fs, us = _uf(n)
    pairs = 0
    for i, j in itertools.combinations(range(n), 2):
        k = len(rings[i] & rings[j])
        if k >= 2:
            pairs += 1
            uu(i, j)
        if k >= 1:
            us(i, j)
    f['fused_pairs'] = pairs
    f['fused_block'] = max(Counter(fu(i) for i in range(n)).values()) if n else 0
    f['ring_systems'] = len({fs(i) for i in range(n)})
    f['spiro'] = rdMolDescriptors.CalcNumSpiroAtoms(mol)
    f['bridgehead'] = rdMolDescriptors.CalcNumBridgeheadAtoms(mol)
    f['aromatic'] = rdMolDescriptors.CalcNumAromaticRings(mol)
    het = lambda r: {mol.GetAtomWithIdx(a).GetAtomicNum() for a in r} - {6}
    f['ring_hetero'] = sum(1 for r in rings if het(r))
    f['ring_mixed'] = sum(1 for r in rings if len(het(r)) >= 2)
    f['branch'] = sum(1 for a in atoms if a.GetDegree() >= 3)
    f['chain'] = _longest_chain(mol)
    dm = Chem.GetDistanceMatrix(mol)
    f['diameter'] = int(dm.max()) if len(atoms) > 1 else 0
    ranks = list(Chem.CanonicalRankAtoms(mol, breakTies=False))
    f['mirror'] = len(atoms) - len(set(ranks))
    f['stereo'] = len(Chem.FindMolChiralCenters(mol, includeUnassigned=True, useLegacyImplementation=False))
    dbl = 0
    arom = 0
    pi = 0
    fu2, uu2 = _uf(len(atoms))
    inconj = set()
    for b in mol.GetBonds():
        t = b.GetBondType()
        s = {b.GetBeginAtom().GetSymbol(), b.GetEndAtom().GetSymbol()}
        if t == Chem.BondType.DOUBLE:
            pi += 1
            if s in ({'C'}, {'C', 'O'}):
                dbl += 1
        elif b.GetIsAromatic():
            arom += 1
        if b.GetIsConjugated():
            uu2(b.GetBeginAtomIdx(), b.GetEndAtomIdx())
            inconj.add(b.GetBeginAtomIdx())
            inconj.add(b.GetEndAtomIdx())
    f['dbl'] = dbl + arom // 2
    f['unsat'] = len(rings) + pi + arom // 2
    f['conj'] = max(Counter(fu2(i) for i in inconj).values()) if inconj else 0
    f['hetero'] = sum(1 for a in atoms if a.GetAtomicNum() != 6)
    f['elements'] = len({a.GetSymbol() for a in atoms} - {'C'})
    cnt = {g: len(mol.GetSubstructMatches(p)) for g, p in GROUP_SMARTS.items()}
    f['groups'] = cnt
    f['kinds'] = sum(1 for g in GROUPS if cnt[g])
    f['sites'] = sum(cnt[g] for g in SITE7)
    f['present'] = frozenset(g for g in SITE7 if cnt[g])
    return f


# ---------------------------------------------------------------------------------------------------------------
# a round as the hurdles read it
# ---------------------------------------------------------------------------------------------------------------

class Log:
    """start: SMILES of the molecule at the start of the round.  turns: list of dicts with keys
    line, chain (names of the self-reactions in order), fired ((reaction, places), ...), off (jar -> count),
    set_off (steps set off by each reaction of the line), smi_end (molecule at the end of the chain)."""
    __slots__ = ('start', 'turns', '_f0', '_pages')

    def __init__(self, start, turns):
        self.start = start
        self.turns = turns
        self._f0 = None
        self._pages = None

    @property
    def f0(self):
        if self._f0 is None:
            self._f0 = feat(self.start)
        return self._f0

    @property
    def pages(self):
        if self._pages is None:
            self._pages = [feat(t['smi_end']) for t in self.turns]
        return self._pages

    def head(self, k):
        return Log(self.start, self.turns[:k])


def turn_dict(line, t):
    """A turn dict from an engine.Turn (what Ctx.evaluate returns for a line)."""
    return {'line': tuple(line), 'chain': tuple(t.steps), 'fired': t.fired, 'off': dict(t.off), 'set_off': t.set_off,
            'smi_end': t.smi}


def round_log(rr):
    """A Log from the dict play_round returns."""
    return Log(rr['smi0'], [{'line': t['line'], 'chain': tuple(t['chain']), 'fired': t['fired'], 'off': t['off'],
                             'set_off': t['set_off'], 'smi_end': t['smi_end']} for t in rr['turns']])


# ---------------------------------------------------------------------------------------------------------------
# the hurdles
# ---------------------------------------------------------------------------------------------------------------

class Hurdle:
    def __init__(self, name, family, text, mark, fn, how, needs=None, kind='event', reading=''):
        self.name = name
        self.family = family
        self.text = text            # the condition in plain words; {N} is the number
        self.mark = mark            # the name of the mark the page draws
        self.fn = fn
        self.how = how              # how it is checked
        self.needs = needs          # None, or fn(carried, rules) -> True when the round can reach it at all
        self.kind = kind            # 'structure' (reads molecules) or 'event' (reads what happened)
        self.reading = reading      # gain / loss / abs / last / range for a structural one

    def value(self, log):
        return self.fn(log)

    def check(self, molecule, round_log_):
        """The measured value.  molecule: SMILES at the start of the round.  round_log_: a Log, or the dict of play_round."""
        lg = round_log_ if isinstance(round_log_, Log) else round_log(round_log_)
        if molecule is not None and canon(molecule) != lg.start and not isinstance(round_log_, Log):
            lg = Log(canon(molecule), lg.turns)
        return self.fn(lg)

    def applicable(self, carried, rules):
        return True if self.needs is None else bool(self.needs(tuple(carried), tuple(rules)))

    def condition(self, n):
        return self.text.format(N=n)

    def __repr__(self):
        return 'Hurdle(%s)' % self.name


HURDLES = {}


def _add(name, family, text, mark, fn, how, needs=None, kind='event', reading=''):
    HURDLES[name] = Hurdle(name, family, text, mark, fn, how, needs, kind, reading)


def has(*reactions):
    return lambda carried, rules: any(r in carried for r in reactions)


def rule_on(*names, feeders=()):
    def f(carried, rules):
        return all(n in rules for n in names) and (not feeders or any(r in carried for r in feeders))
    return f


def both(a, b):
    return lambda c, r: a(c, r) and b(c, r)


def _struct(key, mode):
    def fn(log):
        if not log.turns:
            return 0
        f0 = log.f0[key]
        vals = [p[key] for p in log.pages]
        if mode == 'gain':
            return max(0, max(vals) - f0)
        if mode == 'loss':
            return max(0, f0 - min(vals))
        if mode == 'abs':
            return max(vals)
        if mode == 'last':
            return vals[-1]
        if mode == 'range':
            return max(vals + [f0]) - min(vals + [f0])
        raise ValueError(mode)
    return fn


def _struct_group(group, mode):
    def fn(log):
        if not log.turns:
            return 0
        f0 = log.f0['groups'][group]
        vals = [p['groups'][group] for p in log.pages]
        return {'last': vals[-1], 'gain': max(0, max(vals) - f0), 'abs': max(vals)}[mode]
    return fn


def S(name, family, key, mode, text, mark, how, needs=None):
    _add(name, family, text, mark, _struct(key, mode), how, needs, 'structure', mode)


# --- shape ---------------------------------------------------------------------------------------------------------
S('rings', 'shape', 'rings', 'gain', 'at least {N} more rings than the molecule starts with', 'ring',
  'count of the smallest rings (RDKit ring perception) at the end of a turn minus at the start; best turn')
S('five_rings', 'shape', 'ring5', 'gain', 'at least {N} more rings of five atoms', 'ring5',
  'rings of exactly 5 atoms, end of a turn minus start; best turn')
S('six_rings', 'shape', 'ring6', 'gain', 'at least {N} more rings of six atoms', 'ring6',
  'rings of exactly 6 atoms, end of a turn minus start; best turn')
S('fused_pairs', 'shape', 'fused_pairs', 'gain', 'at least {N} more pairs of rings that share a side', 'ring_pair',
  'pairs of rings with 2 or more atoms in common, end of a turn minus start; best turn')
S('fused_block', 'shape', 'fused_block', 'gain', 'a joined block of rings {N} bigger than the biggest at the start', 'ladder',
  'most rings in one group where rings are joined if they share a side (2+ atoms), end of a turn minus start; best turn')
S('ring_systems', 'shape', 'ring_systems', 'gain', 'at least {N} more separate groups of rings', 'islands',
  'groups of rings that touch at no atom (rings joined if they share any atom), end of a turn minus start; best turn')
S('spiro', 'shape', 'spiro', 'gain', 'at least {N} more atoms where two rings meet at a single point', 'spiro',
  'atoms shared by exactly two rings that share only that atom (RDKit CalcNumSpiroAtoms), minus start; best turn')
S('bridgehead', 'shape', 'bridgehead', 'gain', 'at least {N} more bridgehead atoms (a cage)', 'cage',
  'atoms at the ends of a bridge between two rings (RDKit CalcNumBridgeheadAtoms), minus start; best turn')
S('small_rings', 'shape', 'ring_small', 'gain', 'at least {N} more rings of three or four atoms', 'ring3',
  'rings of 3 or 4 atoms, minus start; best turn')
S('big_rings', 'shape', 'ring_big', 'gain', 'at least {N} more rings of seven or more atoms', 'ring7',
  'rings of 7 or more atoms, minus start; best turn')
S('aromatic', 'shape', 'aromatic', 'gain', 'at least {N} more benzene-type rings', 'benzene',
  'aromatic rings (RDKit CalcNumAromaticRings), minus start; best turn')
S('ring_hetero', 'shape', 'ring_hetero', 'gain', 'at least {N} more rings with an oxygen, nitrogen or sulfur in them', 'ring_o',
  'rings with at least one atom that is not carbon, minus start; best turn')
S('ring_mixed', 'shape', 'ring_mixed', 'gain', 'at least {N} more rings holding two different odd atoms', 'ring_on',
  'rings with at least two different non-carbon elements, minus start; best turn',
  has('amination', 'thiolene', 'chlorination', 'jones'))
S('ring_atoms', 'shape', 'ring_atoms', 'gain', 'at least {N} more atoms inside rings', 'ring_fill',
  'atoms that are in at least one ring, minus start; best turn')
S('ring_sizes', 'shape', 'ring_sizes', 'gain', 'at least {N} more different ring sizes', 'ring_sizes',
  'number of different ring sizes present, minus start; best turn')
# --- size ----------------------------------------------------------------------------------------------------------
S('longest_chain', 'size', 'chain', 'gain', 'a chain of carbons {N} longer than the longest at the start', 'ladder_chain',
  'atoms on the longest path through carbons that are not in rings, minus start; best turn')
S('diameter', 'size', 'diameter', 'gain', 'the molecule {N} bonds longer end to end', 'span',
  'largest number of bonds between any two atoms, minus start; best turn')
S('branch', 'size', 'branch', 'gain', 'at least {N} more branch points', 'fork',
  'atoms with 3 or more heavy neighbours, minus start; best turn')
S('growth', 'size', 'atoms', 'gain', 'at least {N} atoms bigger than the start', 'grow',
  'heavy atoms at the end of a turn minus heavy atoms at the start; best turn')
S('cut_down', 'size', 'atoms', 'loss', 'at least {N} atoms smaller than the start', 'cut',
  'heavy atoms at the start minus the fewest at the end of any turn')
S('size_range', 'size', 'atoms', 'range', 'swing the size by at least {N} atoms between the smallest and the biggest', 'swing',
  'largest minus smallest heavy-atom count over the start and every end of turn')
S('weight', 'size', 'weight', 'gain', 'at least {N} mass units heavier than the start', 'weight',
  'molecular weight at the end of a turn minus at the start; best turn')
# --- makeup --------------------------------------------------------------------------------------------------------
S('kinds_at_once', 'makeup', 'kinds', 'abs', 'at least {N} different kinds of group on the molecule at once', 'groups',
  'number of the 12 group kinds (OH, C=O, C=C, COOH, NH2, SH, Cl, ester, ether, amide, S-S, C=N) present, end of a turn; best turn')
for _g, _lab in (('OH', 'OH'), ('C=O', 'C=O'), ('C=C', 'C=C')):
    _add('left_' + _g.replace('=', ''), 'makeup', 'at least {N} ' + _lab + ' groups still standing at the end', 'keep_' + _lab,
         _struct_group(_g, 'last'), 'count of the group on the molecule at the end of the last turn', None, 'structure', 'last')
S('conjugated', 'makeup', 'conj', 'gain', 'a run of alternating bonds {N} atoms longer than at the start', 'conjugated',
  'atoms in the biggest connected set of conjugated bonds (RDKit), minus start; best turn')
S('double_bonds', 'makeup', 'dbl', 'gain', 'at least {N} more double bonds (C=C and C=O)', 'double',
  'C=C plus C=O double bonds (an aromatic ring counts 3), minus start; best turn')
S('unsaturation', 'makeup', 'unsat', 'gain', 'at least {N} more rings and double bonds together', 'unsat',
  'rings plus double bonds (an aromatic ring counts 1 ring and 3 bonds), minus start; best turn')
S('mirror', 'makeup', 'mirror', 'gain', 'at least {N} more atoms that have a twin elsewhere', 'mirror',
  'atoms minus the number of distinct atom classes (RDKit canonical ranks with ties kept), minus start; best turn')
S('stereo', 'makeup', 'stereo', 'gain', 'at least {N} more handed centres', 'hand',
  'atoms that could be handed (RDKit FindMolChiralCenters with unassigned), minus start; best turn')
S('hetero_atoms', 'makeup', 'hetero', 'gain', 'at least {N} more atoms that are not carbon', 'hetero',
  'atoms other than carbon, minus start; best turn')
S('elements', 'makeup', 'elements', 'gain', 'at least {N} more different elements besides carbon', 'elements',
  'distinct elements other than carbon, minus start; best turn', has('amination', 'thiolene', 'chlorination', 'hofmann'))


def _burn(log):
    if not log.turns:
        return 0
    return max(0, log.f0['sites'] - log.pages[-1]['sites'])


_add('burn_down', 'makeup', 'at least {N} fewer reactive groups at the end than at the start', 'burn', _burn,
     'count of OH, C=O, C=C, COOH, NH2, SH, Cl on the molecule at the start minus at the end of the last turn', None,
     'structure', 'lastloss')


def _passing(log):
    if not log.turns:
        return 0
    p0 = log.f0['present']
    seen = set().union(*[p['present'] for p in log.pages])
    return len([g for g in SITE7 if g not in p0 and g in seen and g not in log.pages[-1]['present']])


_add('passing_through', 'makeup', 'at least {N} kinds of group made during the round and gone by the end', 'passing', _passing,
     'groups (of the 7 reactive kinds) absent at the start, present at the end of some turn, absent at the end of the last turn',
     None, 'structure', 'special')


# --- what the molecule did by itself ------------------------------------------------------------------------------
def _steps(log):
    return [len(t['chain']) for t in log.turns]


def E_(name, family, text, mark, fn, how, needs=None):
    _add(name, family, text, mark, fn, how, needs, 'event')


E_('busy', 'chain', 'at least {N} steps by itself over the round', 'steps',
   lambda lg: sum(_steps(lg)), 'sum over the turns of the length of the chain')
E_('long_chain', 'chain', 'a chain of at least {N} steps in one turn', 'ladder_steps',
   lambda lg: max(_steps(lg) or [0]), 'longest chain of any turn')
E_('every_turn', 'chain', 'at least {N} steps in every turn', 'steady',
   lambda lg: min(_steps(lg) or [0]) if len(lg.turns) >= 1 else 0, 'shortest chain of the turns played')
E_('finish_strong', 'chain', 'at least {N} steps in the last turn alone', 'finish',
   lambda lg: _steps(lg)[2] if len(lg.turns) >= 3 else 0, 'length of the chain of turn 3')
E_('opener', 'chain', 'the first reaction of a turn sets off at least {N} steps', 'first',
   lambda lg: max([t['set_off'][0] for t in lg.turns if t['set_off']] or [0]), 'largest steps set off by the first reaction of a line')
E_('closer', 'chain', 'the third reaction of a turn sets off at least {N} steps', 'third',
   lambda lg: max([t['set_off'][2] for t in lg.turns if len(t['set_off']) >= 3] or [0]), 'largest steps set off by the third reaction of a line')
E_('kinds_in_turn', 'chain', 'at least {N} different self-reactions in one turn', 'kinds_turn',
   lambda lg: max([len(set(t['chain'])) for t in lg.turns] or [0]), 'most distinct self-reaction names in one chain')
E_('kinds_in_round', 'chain', 'at least {N} different self-reactions over the round', 'kinds_round',
   lambda lg: len({c for t in lg.turns for c in t['chain']}), 'distinct self-reaction names over all chains')


def _loops(log):
    n = 0
    for t in log.turns:
        last = {}
        for i, c in enumerate(t['chain']):
            if c in last and any(x != c for x in t['chain'][last[c] + 1:i]):
                n += 1
            last[c] = i
    return n


E_('loop', 'chain', 'a kind comes round again after another kind at least {N} times', 'loop', _loops,
   'times a self-reaction fires again with a different one between, summed over the turns')
E_('pile_on', 'chain', 'one self-reaction fires at least {N} times in one turn', 'pile',
   lambda lg: max([max(Counter(t['chain']).values()) for t in lg.turns if t['chain']] or [0]),
   'largest count of one name in one chain')
E_('all_three_feed', 'chain', 'at least {N} turns where each of the three reactions sets something off', 'three_feed',
   lambda lg: sum(1 for t in lg.turns if len(t['set_off']) == 3 and min(t['set_off']) >= 1),
   'turns whose three set_off numbers are all 1 or more')
E_('no_dead_reaction', 'restraint', 'at least {N} turns where all three reactions found something to act on', 'no_dead',
   lambda lg: sum(1 for t in lg.turns if len(t['fired']) == 3 and all(p > 0 for _, p in t['fired'])),
   'turns where all three fired reactions acted')
E_('crescendo', 'chain', 'each turn longer than the one before, {N} times', 'crescendo',
   lambda lg: sum(1 for a, b in zip(_steps(lg), _steps(lg)[1:]) if b > a), 'count of turns whose chain is longer than the turn before')
E_('distinct_triggers', 'chain', 'at least {N} different reactions that set something off', 'trigger',
   lambda lg: len({n for t in lg.turns for (n, _), s in zip(t['fired'], t['set_off']) if s > 0}),
   'distinct reactions of the line with set_off 1 or more')

_NEEDS_RULE = {'strip': has('chlorination'), 'knit': has('amination'), 'pop': has('jones'), 'seal': has('jones'),
               'pair': has('thiolene')}
for _r in library.SELF_ORDER:
    _nd = _NEEDS_RULE.get(_r)
    E_('kind_' + _r, 'chain', 'at least {N} steps of ' + _r + ' over the round', 'self_' + _r,
       (lambda r: lambda lg: sum(t['chain'].count(r) for t in lg.turns))(_r),
       'count of ' + _r + ' in the chains',
       (lambda r, nd: lambda c, rules: r in rules and (nd is None or nd(c, rules)))(_r, _nd))

E_('rare_close', 'chain', 'at least {N} rings closed through nitrogen, sulfur or an acid', 'ring_rare',
   lambda lg: sum(t['chain'].count(x) for t in lg.turns for x in ('knit', 'seal', 'pair')),
   'count of knit, seal and pair steps', lambda c, r: any(x in r for x in ('knit', 'seal', 'pair')) and has('amination', 'jones', 'thiolene')(c, r))


def _order(a, b):
    def fn(log):
        n = 0
        for t in log.turns:
            ch = t['chain']
            ia = [i for i, c in enumerate(ch) if c == a]
            ib = [i for i, c in enumerate(ch) if c == b]
            if ia and ib and min(ia) < max(ib):
                n += 1
        return n
    return fn


for _a, _b in (('ring', 'dry'), ('dry', 'tuck'), ('weld', 'dry')):
    E_('order_%s_%s' % (_a, _b), 'chain', 'at least {N} turns where ' + _a + ' comes before ' + _b, 'order_%s_%s' % (_a, _b),
       _order(_a, _b), 'turns whose chain has ' + _a + ' somewhere before a later ' + _b,
       rule_on(_a, _b))

# --- what came off -------------------------------------------------------------------------------------------------
def _offsum(log, jar=None):
    return sum(v for t in log.turns for k, v in t['off'].items() if jar is None or k == jar)


E_('off_total', 'off', 'at least {N} things driven off over the round', 'off_all', lambda lg: _offsum(lg),
   'sum of everything that came off, over the turns')
for _jar, _need in (('water', None), ('hydrogen', has('oxidize')), ('carbon dioxide', has('oxidize', 'decarboxylation', 'jones')),
                    ('acid fumes', has('chlorination', 'williamson')), ('sulfur', has('raney')),
                    ('trimethylamine', has('hofmann'))):
    E_('off_' + _jar.replace(' ', '_'), 'off', 'at least {N} ' + _jar + ' driven off', 'jar_' + _jar.replace(' ', '_'),
       (lambda j: lambda lg: _offsum(lg, j))(_jar), 'amount of ' + _jar + ' that came off, over the turns', _need)
E_('many_jars', 'off', 'at least {N} different things driven off', 'jars',
   lambda lg: len({k for t in lg.turns for k, v in t['off'].items() if v > 0}), 'distinct jars with something in them')
E_('big_puff', 'off', 'at least {N} things driven off in one turn', 'puff',
   lambda lg: max([sum(t['off'].values()) for t in lg.turns] or [0]), 'largest sum of everything off in one turn')

# --- restraint and variety ------------------------------------------------------------------------------------------
E_('variety', 'restraint', 'at least {N} different reactions used over the round', 'variety',
   lambda lg: len({n for t in lg.turns for n, _ in t['fired']}), 'distinct reaction names in the lines of the round')
E_('repeats', 'restraint', 'at least {N} reactions used again that were already used this round', 'repeat',
   lambda lg: sum(len(t['fired']) for t in lg.turns) - len({n for t in lg.turns for n, _ in t['fired']}),
   'reactions fired minus distinct reactions fired')
E_('acted_total', 'restraint', 'at least {N} of the reactions fired found something to act on', 'acted',
   lambda lg: sum(1 for t in lg.turns for _, p in t['fired'] if p > 0), 'fired reactions that acted at least once')
E_('distinct_acted', 'restraint', 'at least {N} different reactions that found something to act on', 'acted_kinds',
   lambda lg: len({n for t in lg.turns for n, p in t['fired'] if p > 0}), 'distinct reactions that acted')
E_('places', 'restraint', 'reactions that act at least {N} places in all', 'places',
   lambda lg: sum(p for t in lg.turns for _, p in t['fired']), 'sum of places each fired reaction acted at')
E_('same_line', 'restraint', 'the same line of three fired on at least {N} turns', 'same_line',
   lambda lg: max(Counter(t['line'] for t in lg.turns if len(t['line']) == 3).values() or [0]) if lg.turns and any(len(t['line']) == 3 for t in lg.turns) else 0,
   'largest number of turns that fired the identical ordered line')

# --- by a deadline (a hurdle that must be met by the end of turn two) ---------------------------------------------------
for _b in ('busy', 'rings', 'off_total'):
    _base = HURDLES[_b]
    _add('by_two_' + _b, 'timing', _base.text + ', by the end of the second turn', 'deadline_' + _base.mark,
         (lambda base: lambda lg: base.fn(lg.head(2)))(_base), _base.how + ' (only turns 1 and 2 count)', _base.needs,
         _base.kind, _base.reading)


def all_hurdles():
    return list(HURDLES.values())


# ---------------------------------------------------------------------------------------------------------------
# players that aim at hurdles
# ---------------------------------------------------------------------------------------------------------------

class _TrackPlayer:
    """Keeps the turns played so far in a round; the engine calls choose once a turn, turn 0 first."""

    def _begin(self, ctx):
        if ctx.turn == 0:
            self.start = ctx.smi
            self.done = []

    def _cands(self, ctx):
        return ctx.evaluate()

    def _commit(self, line, t):
        self.done.append(turn_dict(line, t))


class SeekPlayer(_TrackPlayer):
    """Maximises the hurdle's value after this turn, then points.  Ties are drawn at random."""
    name = 'seek'

    def __init__(self, hurdle):
        self.h = hurdle

    def choose(self, ctx):
        self._begin(ctx)
        lines = self._cands(ctx)
        if not lines:
            return ()
        scored = []
        for line, t, pay in lines:
            td = turn_dict(line, t)
            v = self.h.fn(Log(self.start, self.done + [td]))
            scored.append(((v, pay), line, t))
        top = max(s[0] for s in scored)
        pick = ctx.rng.choice([s for s in scored if s[0] == top])
        self._commit(pick[1], pick[2])
        return pick[1]


class AimPlayer(_TrackPlayer):
    """Plays toward the numbers (min(value, N) for each, scaled), then for points.  Aims = [(hurdle, N), ...]."""
    name = 'aim'

    def __init__(self, aims):
        self.aims = list(aims)

    def choose(self, ctx):
        self._begin(ctx)
        lines = self._cands(ctx)
        if not lines:
            return ()
        scored = []
        for line, t, pay in lines:
            td = turn_dict(line, t)
            lg = Log(self.start, self.done + [td])
            prog = sum(min(h.fn(lg), n) / float(n) for h, n in self.aims)
            scored.append(((round(prog, 9), pay), line, t))
        top = max(s[0] for s in scored)
        pick = ctx.rng.choice([s for s in scored if s[0] == top])
        self._commit(pick[1], pick[2])
        return pick[1]


# ---------------------------------------------------------------------------------------------------------------
# the generator
# ---------------------------------------------------------------------------------------------------------------
TARGETS = {1: .85, 2: .80, 3: .65, 4: .75, 5: .70, 6: .55, 7: .65, 8: .60, 9: .45}
# the sets carried and the self-reactions held in each band of rounds, for the study and the generator test
EXTRA = ('jones', 'amination', 'thiolene', 'chlorination', 'wittig', 'ozonolysis', 'williamson', 'decarboxylation', 'hofmann',
         'raney', 'hydrogenation', 'dihydroxylation', 'suzuki')
RULES_BAND = {1: library.SELF_TIER1, 2: library.SELF_TIER1, 3: library.SELF_TIER1,
              4: tuple(library.SELF_ORDER[:7]), 5: tuple(library.SELF_ORDER[:7]), 6: tuple(library.SELF_ORDER[:7]),
              7: library.SELF_ALL, 8: library.SELF_ALL, 9: library.SELF_ALL}


def carried_for(rnd, rng):
    """The reactions carried in a round: the six for rounds 1-3; the six and two others (rounds 4-6) or three of the six and five
    others (rounds 7-9), at most eight."""
    if rnd <= 3:
        return library.SIX
    if rnd <= 6:
        return library.SIX + tuple(rng.sample(EXTRA, 2))
    return tuple(rng.sample(library.SIX, 3)) + tuple(rng.sample(EXTRA, 5))


def band(rnd):
    return 'early' if rnd <= 3 else 'mid' if rnd <= 6 else 'late'


def pick_hurdle(*args, **kw):
    """The generator (hurdle_gen.pick_hurdle): see there."""
    import hurdle_gen
    return hurdle_gen.pick_hurdle(*args, **kw)
