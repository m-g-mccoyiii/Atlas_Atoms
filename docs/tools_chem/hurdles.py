"""Specs for Overreact rounds: an "at least N" about the molecule or about what happened in the round.

(The file keeps its old name.  In the game a round asks for "the spec"; docs/NAMES.md.  `HURDLES` is the same dict as `SPECS`.)

A spec is a measured number.  A round is won when the value at the end of the round is at least N (N is shown at the start of
the round).  Nothing caps the value: going past N is what the yield and the four words reward.  Yield is a separate thing
(engine.py).  See docs/tools_chem/SPECS.md for the kept set and the tests.

  SPECS              name -> Spec, every spec that can be checked exactly (`live` ones are aimed at in the study)
  Spec.fn(log)       the measured value (a number)
  Log                a round as the specs read it: the start molecule, the reagents carried and, per turn, the line, the
                     chain of reflexes, what was fired, the runoff, and the molecule at the end of the turn's chain
  round_log(rr)      a Log from the dict engine.Engine.play_round returns
  Players that play a round (all take the engine's ctx):
    SeekPlayer(spec)        maximises the spec's value (N not needed), then yield
    AimPlayer([(spec, N)])  plays toward N for each, then for yield          (the aiming player)
    NewPlayer(spec, N)      a person learning: sees the spec, the molecule and what each reagent does by itself, but not
                            what the reflexes will do; picks with noise; looks at nothing ahead of firing
    MixPlayer(a, b, p)      per turn plays like a with chance p, else like b    (middling and skilled players)
    engine.PLAYERS['greedy']  the yield-only player

How a structural spec reads the molecule (the same for all, so a page can say it in one line):
  gain      : the best end-of-turn molecule of the round, minus the start molecule (never below 0)
  loss      : the start molecule minus the smallest end-of-turn molecule
  lastgain  : the molecule at the end of the last turn, minus the start molecule (never below 0)
  lastloss  : the start molecule minus the molecule at the end of the last turn (never below 0)
The molecule is read at the end of the turn's chain, before the loose rings open again.  No spec reads an absolute value, so a
molecule that already has a cage or four rings cannot clear a spec on page zero.
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
SITE7 = ['OH', 'C=O', 'C=C', 'COOH', 'NH2', 'SH', 'Cl']       # the groups the player's reagents work on


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
    """Every structural number any spec reads, for one molecule (a canonical SMILES)."""
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
    f['ring_oxygen'] = sum(1 for r in rings if 8 in het(r))
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
# a round as the specs read it
# ---------------------------------------------------------------------------------------------------------------

class Log:
    """start: SMILES of the molecule at the start of the round.  turns: list of dicts with keys
    line, chain (names of the reflexes in order), fired ((reagent, places), ...), off (runoff -> count),
    set_off (reflexes started by each reagent of the line), smi_end (molecule at the end of the chain).
    carried: the reagents the player holds this round."""
    __slots__ = ('start', 'turns', 'carried', '_f0', '_pages')

    def __init__(self, start, turns, carried=()):
        self.start = start
        self.turns = turns
        self.carried = tuple(carried)
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
        return Log(self.start, self.turns[:k], self.carried)


def turn_dict(line, t, smi_end=None):
    """A turn dict from an engine.Turn (what Ctx.evaluate returns for a line)."""
    return {'line': tuple(line), 'chain': tuple(t.steps), 'fired': t.fired, 'off': dict(t.off), 'set_off': t.set_off,
            'smi_end': t.smi if smi_end is None else smi_end}


def round_log(rr):
    """A Log from the dict play_round returns."""
    return Log(rr['smi0'], [{'line': t['line'], 'chain': tuple(t['chain']), 'fired': t['fired'], 'off': t['off'],
                             'set_off': t['set_off'], 'smi_end': t['smi_end']} for t in rr['turns']], rr.get('carried', ()))


# ---------------------------------------------------------------------------------------------------------------
# the specs
# ---------------------------------------------------------------------------------------------------------------

class Spec:
    """One spec.  text: the condition for the page, 'at least {N} ...', at most eight words.  mark: the name of the small drawn
    icon; icon: one line saying what the icon shows.  plan: the direction of play it pulls in (at most three kept specs per plan).
    family: the coarse group (tiers, and no family twice running).  plain: 1 reads plainest .. 3.  tops_out: the count cannot
    grow without limit (room is then measured as twice N).  short: the players may fire fewer than three reagents in a turn.
    grain: it makes the player give something up."""

    def __init__(self, name, family, plan, text, mark, icon, fn, how, needs=None, kind='event', reading='', tops_out=False,
                 short=False, grain=False, cap=None, plain=2, live=True, prog=None, cluster=None):
        self.name = name
        self.family = family
        self.plan = plan
        self.text = text
        self.mark = mark
        self.icon = icon
        self.fn = fn
        self.how = how
        self.needs = needs
        self.kind = kind
        self.reading = reading
        self.tops_out = tops_out
        self.short = short
        self.grain = grain
        self.cap = cap                  # fn(f0, rnd) -> the most N may be for this molecule, or None
        self.plain = plain
        self.live = live
        self.prog = prog                # fn(log, N) -> progress in [0, N] for a player; default min(value, N)
        self.cluster = cluster          # specs with the same cluster count the same thing; at most one of them is kept

    def value(self, log):
        return self.fn(log)

    def check(self, molecule, round_log_):
        """The measured value.  molecule: SMILES at the start of the round.  round_log_: a Log, or the dict of play_round."""
        lg = round_log_ if isinstance(round_log_, Log) else round_log(round_log_)
        if molecule is not None and canon(molecule) != lg.start and not isinstance(round_log_, Log):
            lg = Log(canon(molecule), lg.turns, lg.carried)
        return self.fn(lg)

    def progress(self, log, n):
        """How far a player is toward N, in [0, 1] (n None: the raw value, for a player who does not know N)."""
        if self.prog is not None:
            p = self.prog(log, n if n else 1)
            return p / n if n else p
        v = self.fn(log)
        return min(v, n) / float(n) if n else float(v)

    def applicable(self, carried, rules):
        return True if self.needs is None else bool(self.needs(tuple(carried), tuple(rules)))

    def condition(self, n):
        """The words for the page with N put in ('at least 1 more kind of group', not '1 more kinds')."""
        t = self.text.format(N=n)
        if n == 1:
            head, tail = t.split('1', 1)
            for plural, single in SINGULAR:
                if plural in tail.split():
                    words = tail.split(' ')
                    words[words.index(plural)] = single
                    tail = ' '.join(words)
                    break
            t = head + '1' + tail
        return t

    def __repr__(self):
        return 'Spec(%s)' % self.name


SINGULAR = [('rings', 'ring'), ('atoms', 'atom'), ('forks', 'fork'), ('kinds', 'kind'), ('turns', 'turn'), ('reagents', 'reagent'),
            ('reflexes', 'reflex'), ('bonds', 'bond'), ('mass', 'mass'), ('ring-closing', 'ring-closing')]
SPECS = {}
HURDLES = SPECS                 # the old name


def _add(name, family, plan, text, mark, icon, fn, how, **kw):
    SPECS[name] = Spec(name, family, plan, text, mark, icon, fn, how, **kw)


def has(*reagents):
    return lambda carried, rules: any(r in carried for r in reagents)


def rule_on(*names, feeders=()):
    def f(carried, rules):
        return all(n in rules for n in names) and (not feeders or any(r in carried for r in feeders))
    return f


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
        if mode == 'lastgain':
            return max(0, vals[-1] - f0)
        if mode == 'lastloss':
            return max(0, f0 - vals[-1])
        if mode == 'abs':
            return max(vals)
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
        if mode == 'lastgain':
            return max(0, vals[-1] - f0)
        if mode == 'gain':
            return max(0, max(vals) - f0)
        raise ValueError(mode)
    return fn


def S(name, family, plan, key, mode, text, mark, icon, how, **kw):
    _add(name, family, plan, text, mark, icon, _struct(key, mode), how, kind='structure', reading=mode, **kw)


def E_(name, family, plan, text, mark, icon, fn, how, **kw):
    _add(name, family, plan, text, mark, icon, fn, how, kind='event', **kw)


# --- rings -----------------------------------------------------------------------------------------------------------
S('rings', 'shape', 'rings', 'rings', 'gain', 'at least {N} more rings', 'ring',
  'a ring outline for each ring made', 'count of the smallest rings (RDKit ring perception) at the end of a turn minus at the start; best turn',
  plain=1)
S('five_rings', 'shape', 'rings', 'ring5', 'gain', 'at least {N} more five-atom rings', 'ring5',
  'a ring drawn with five dots', 'rings of exactly 5 atoms, end of a turn minus start; best turn', plain=1)
S('six_rings', 'shape', 'rings', 'ring6', 'gain', 'at least {N} more six-atom rings', 'ring6',
  'a ring drawn with six dots', 'rings of exactly 6 atoms, end of a turn minus start; best turn', plain=1)
S('fused_pairs', 'shape', 'rings', 'fused_pairs', 'gain', 'at least {N} more rings sharing a side', 'ring_pair',
  'two rings drawn with one side in common', 'pairs of rings with 2 or more atoms in common, end of a turn minus start; best turn')
S('fused_block', 'shape', 'rings', 'fused_block', 'gain', 'at least {N} more rings fused together', 'ladder',
  'three rings in a row, each sharing a side with the next',
  'most rings in one group where rings are joined if they share a side (2+ atoms), end of a turn minus start; best turn',
  grain=True, plain=2)
S('ring_systems', 'shape', 'rings', 'ring_systems', 'gain', 'at least {N} more separate ring groups', 'islands',
  'ring clusters drawn apart from each other',
  'groups of rings that touch at no atom (rings joined if they share any atom), end of a turn minus start; best turn')
S('spiro', 'shape', 'rings', 'spiro', 'gain', 'at least {N} more rings sharing one atom', 'figure_eight',
  'two rings touching at a single dot, like a figure eight',
  'atoms shared by exactly two rings that share only that atom (RDKit CalcNumSpiroAtoms), minus start; best turn', plain=2)
S('ring_oxygen', 'shape', 'rings', 'ring_oxygen', 'gain', 'at least {N} more rings holding oxygen', 'ring_o',
  'a ring with a red O in its outline', 'rings with at least one oxygen atom, minus start; best turn', plain=1)
S('ring_atoms', 'shape', 'rings', 'ring_atoms', 'gain', 'at least {N} more atoms in rings', 'ring_fill',
  'ring outlines with the atoms inside filled in', 'atoms that are in at least one ring, minus start; best turn',
  cap=lambda f0, rnd: f0['atoms'])
# --- size ------------------------------------------------------------------------------------------------------------
S('growth', 'size', 'big', 'atoms', 'gain', 'at least {N} atoms bigger than the start', 'grow',
  'the start molecule with a larger one drawn after it',
  'heavy atoms at the end of a turn minus heavy atoms at the start; best turn; N is at most the start size and the total at most 56',
  cap=lambda f0, rnd: max(1, min(E.MAX_HEAVY - f0['atoms'], f0['atoms'])), plain=1)
S('branch', 'size', 'big', 'branch', 'gain', 'at least {N} more forks in the molecule', 'fork',
  'a tree that splits', 'atoms with 3 or more heavy neighbours, minus start; best turn')
S('longest_chain', 'size', 'big', 'chain', 'gain', 'at least {N} longer chain than the start', 'ladder_chain',
  'a straight zigzag with a ruler along it', 'atoms on the longest path through carbons that are not in rings, minus start; best turn')
S('cut_down', 'size', 'small', 'atoms', 'loss', 'at least {N} atoms smaller than the start', 'cut',
  'the start molecule with a ghost outline of the atoms that went',
  'heavy atoms at the start minus the fewest at the end of any turn; N is at most half the start size',
  grain=True, cap=lambda f0, rnd: max(1, f0['atoms'] // 2), plain=1)
S('finish_smaller', 'size', 'small', 'atoms', 'lastloss', 'at least {N} atoms smaller at the finish', 'cut_end',
  'the start molecule and a smaller one at the end of an arrow',
  'heavy atoms at the start minus heavy atoms after the last turn; N is at most half the start size',
  grain=True, cap=lambda f0, rnd: max(1, f0['atoms'] // 2), plain=1)


def _lean(log):
    prev = log.f0['atoms']
    n = 0
    for p in log.pages:
        if p['atoms'] < prev:
            n += 1
        prev = p['atoms']
    return n


E_('lean_turns', 'size', 'small', 'at least {N} turns ending smaller', 'lean',
   'three small boxes, each with a down arrow when the molecule got smaller', _lean,
   'turns whose end-of-turn heavy atoms are fewer than at the end of the turn before (the start for turn 1)', grain=True,
   tops_out=True, plain=1)
# --- makeup ------------------------------------------------------------------------------------------------------------
S('kinds_gain', 'makeup', 'kinds', 'kinds', 'gain', 'at least {N} more kinds of group', 'groups',
  'coloured tiles, one for each kind of group on the molecule',
  'number of the 12 group kinds (OH, C=O, C=C, COOH, NH2, SH, Cl, ester, ether, amide, S-S, C=N) present, end of a turn minus start; best turn',
  tops_out=True)
S('hetero_atoms', 'makeup', 'kinds', 'hetero', 'gain', 'at least {N} more non-carbon atoms', 'hetero',
  'the red and blue atoms circled', 'atoms other than carbon, minus start; best turn', plain=1)
S('double_bonds', 'makeup', 'bonds', 'dbl', 'gain', 'at least {N} more double bonds', 'double',
  'double lines, one for each double bond', 'C=C plus C=O double bonds (an aromatic ring counts 3), minus start; best turn', plain=1)
S('conjugated', 'makeup', 'bonds', 'conj', 'gain', 'at least {N} more atoms in alternating bonds', 'conjugated',
  'a zigzag of single and double lines lit up end to end',
  'atoms in the biggest connected set of conjugated bonds (RDKit), minus start; best turn', plain=3)
S('unsaturation', 'makeup', 'bonds', 'unsat', 'gain', 'at least {N} more rings and double bonds', 'unsat',
  'ring outlines and double lines counted together',
  'rings plus double bonds (an aromatic ring counts 1 ring and 3 bonds), minus start; best turn')
for _g, _lab in (('OH', 'OH'), ('C=O', 'C=O'), ('C=C', 'C=C')):
    _add('end_' + _g.replace('=', ''), 'makeup', 'keep', 'at least {N} more ' + _lab + ' at the finish', 'keep_' + _g.replace('=', ''),
         'the group drawn in a box that stays lit to the end of the round',
         _struct_group(_g, 'lastgain'), 'count of ' + _lab + ' groups on the molecule after the last turn minus the count at the start (never below 0)',
         kind='structure', reading='lastgain', grain=True, plain=2)


def _fewer_groups(log):
    if not log.turns:
        return 0
    return max(0, log.f0['sites'] - log.pages[-1]['sites'])


_add('fewer_groups', 'makeup', 'keep', 'at least {N} fewer groups at the finish', 'burn',
     'a row of group tiles, some crossed out', _fewer_groups,
     'count of OH, C=O, C=C, COOH, NH2, SH, Cl on the molecule at the start minus after the last turn', kind='structure',
     reading='lastloss', grain=True)

# --- the molecule's own reflexes -----------------------------------------------------------------------------------------
_STEPS = lambda log: [len(t['chain']) for t in log.turns]


E_('opener', 'chain', 'chains', 'at least {N} reflexes after the first reagent', 'first',
   'a lit bolt after the first of three bottles',
   lambda lg: max([t['set_off'][0] for t in lg.turns if t['set_off']] or [0]),
   'largest number of reflexes started by the first reagent of a line, over the turns', plain=2)
E_('closer', 'chain', 'chains', 'at least {N} reflexes after the last reagent', 'third',
   'a lit bolt after the third of three bottles',
   lambda lg: max([t['set_off'][2] for t in lg.turns if len(t['set_off']) >= 3] or [0]),
   'largest number of reflexes started by the third reagent of a line, over the turns', plain=2)
E_('distinct_triggers', 'chain', 'chains', 'at least {N} reagents that start a reflex', 'trigger',
   'bottles with a spark above them',
   lambda lg: len({n for t in lg.turns for (n, _), s in zip(t['fired'], t['set_off']) if s > 0}),
   'distinct reagents of the lines whose set_off is 1 or more', tops_out=True)
E_('kind_ring', 'chain', 'chains', 'at least {N} ring-closing reflexes', 'self_ring',
   'a chain being closed into a ring', lambda lg: sum(t['chain'].count('ring') for t in lg.turns),
   'count of the ring reflex in the chains', needs=lambda c, r: 'ring' in r, plain=1)


def _after(name):
    """Reflexes that came after the first `name` reflex of a turn (the most in one turn)."""
    def fn(lg):
        best = 0
        for t in lg.turns:
            ch = t['chain']
            if name in ch:
                best = max(best, len(ch) - 1 - ch.index(name))
        return best
    return fn


E_('through_ring', 'chain', 'chains', 'at least {N} reflexes after a ring closes', 'after_ring',
   'a chain of lit links that carries on past a ring', _after('ring'),
   'most reflexes after the first ring reflex of one turn', needs=lambda c, r: 'ring' in r, grain=True)
E_('through_dry', 'chain', 'chains', 'at least {N} reflexes after a dry reflex', 'after_dry',
   'a chain of lit links that carries on past a water drop', _after('dry'),
   'most reflexes after the first dry reflex of one turn', needs=lambda c, r: 'dry' in r, grain=True)


# --- timing --------------------------------------------------------------------------------------------------------------
def _quiet_loud(log):
    if len(log.turns) < 3:
        return 0
    s = _STEPS(log)
    return s[2] if s[0] <= 1 and s[1] <= 1 else 0


def _quiet_loud_prog(log, n):
    s = _STEPS(log)
    if len(s) < 3:
        return 0.9 * n if all(x <= 1 for x in s) else 0.0
    return min(n, _quiet_loud(log))


E_('quiet_then_loud', 'timing', 'late', 'at least {N} reflexes after two quiet turns', 'quiet_loud',
   'two flat turns and then a tall bar', _quiet_loud,
   'reflexes in turn 3, counted only when turns 1 and 2 each had at most 1 reflex', prog=_quiet_loud_prog, grain=True, plain=2)
E_('opening_burst', 'timing', 'late', 'at least {N} reflexes in the first turn', 'burst',
   'a tall bar in the first of three turns', lambda lg: len(lg.turns[0]['chain']) if lg.turns else 0,
   'reflexes in turn 1', plain=1)
SPECS['by_two_rings'] = Spec('by_two_rings', 'timing', 'rings', 'at least {N} more rings after two turns', 'deadline_ring',
                             'a ring outline with a clock showing two of three turns',
                             lambda lg: SPECS['rings'].fn(lg.head(2)),
                             'the rings spec counted over turns 1 and 2 only', kind='structure', reading='gain', plain=1)

# --- runoff --------------------------------------------------------------------------------------------------------------
GAS_JARS = ('hydrogen', 'carbon dioxide', 'acid fumes', 'trimethylamine')


def _offsum(log, jar=None):
    return sum(v for t in log.turns for k, v in t['off'].items() if jar is None or k == jar)


E_('off_total', 'runoff', 'vent', 'at least {N} runoff over the round', 'off_all',
   'jars filling with drops and bubbles', lambda lg: _offsum(lg), 'sum of everything that came off, over the turns', plain=1)
for _jar, _need in (('water', None), ('hydrogen', has('oxidize')),
                    ('carbon dioxide', has('oxidize', 'decarboxylation', 'jones'))):
    E_('off_' + _jar.replace(' ', '_'), 'runoff', 'vent', 'at least {N} ' + _jar + ' in the runoff', 'jar_' + _jar.replace(' ', '_'),
       'a jar of ' + _jar, (lambda j: lambda lg: _offsum(lg, j))(_jar), 'amount of ' + _jar + ' that came off, over the turns',
       needs=_need, plain=1)
E_('many_jars', 'runoff', 'vent', 'at least {N} kinds of runoff', 'jars',
   'several different jars side by side', lambda lg: len({k for t in lg.turns for k, v in t['off'].items() if v > 0}),
   'distinct runoff kinds with something in them', tops_out=True, plain=1)
E_('big_puff', 'runoff', 'vent', 'at least {N} runoff in one turn', 'puff',
   'one big cloud over a single turn', lambda lg: max([sum(t['off'].values()) for t in lg.turns] or [0]),
   'largest sum of everything off in one turn', plain=1)
E_('pure_water', 'runoff', 'pure', 'at least {N} more water than other runoff', 'water_only',
   'a full water jar beside empty ones',
   lambda lg: max(0, _offsum(lg, 'water') - (_offsum(lg) - _offsum(lg, 'water'))),
   'water that came off minus everything else that came off, over the turns', grain=True)
E_('pure_gas', 'runoff', 'pure', 'at least {N} more gas than water', 'gas_only',
   'bubbles rising from a jar with no water in it',
   lambda lg: max(0, sum(_offsum(lg, j) for j in GAS_JARS) - _offsum(lg, 'water')),
   'hydrogen, carbon dioxide, acid fumes and trimethylamine that came off minus water, over the turns', grain=True,
   needs=has('oxidize', 'decarboxylation', 'jones', 'chlorination', 'williamson', 'hofmann'))


# --- restraint -----------------------------------------------------------------------------------------------------------
def _unused(log):
    if not log.turns:
        return 0
    used = {r for t in log.turns for r in t['line']}
    return max(0, len(set(log.carried)) - len(used))


E_('unused_reagents', 'restraint', 'restraint', 'at least {N} reagents left unused', 'shelf',
   'bottles still full on the shelf at the end', _unused, 'carried reagents never fired in the round', grain=True, tops_out=True,
   plain=1)
E_('clean_turns', 'restraint', 'restraint', 'at least {N} turns with no wasted reagent', 'clean',
   'three bottles, each with a tick, for a turn where all three worked',
   lambda lg: sum(1 for t in lg.turns if len(t['fired']) == 3 and all(p > 0 for _, p in t['fired'])),
   'turns where all three fired reagents found something to change', tops_out=True, plain=1)
E_('held_back', 'restraint', 'restraint', 'at least {N} turns firing fewer than three', 'held',
   'a turn with one empty slot', lambda lg: sum(1 for t in lg.turns if 0 < len(t['line']) < 3),
   'turns in which fewer than three reagents were fired', short=True, grain=True, tops_out=True, plain=1)

# --- measured and dropped without a player aimed at them (kept here so their values can be compared and tested) -------------

def _drop(name, family, plan, text, mark, icon, fn, how, **kw):
    E_(name, family, plan, text, mark, icon, fn, how, live=False, **kw)


S('size_range', 'size', 'big', 'atoms', 'range', 'at least {N} atoms of size swing', 'swing', 'a molecule that grows and shrinks',
  'largest minus smallest heavy-atom count over the start and every end of turn', live=False)
S('diameter', 'size', 'big', 'diameter', 'gain', 'at least {N} bonds longer end to end', 'span', 'a ruler from end to end',
  'largest number of bonds between any two atoms, minus start; best turn', live=False)
S('ring_sizes', 'shape', 'rings', 'ring_sizes', 'gain', 'at least {N} more different ring sizes', 'ring_sizes', 'rings of different sizes',
  'number of different ring sizes present, minus start; best turn', live=False)
S('elements', 'makeup', 'kinds', 'elements', 'gain', 'at least {N} more different elements besides carbon', 'elements',
  'element tiles', 'distinct elements other than carbon, minus start; best turn', live=False,
  needs=has('amination', 'thiolene', 'chlorination', 'hofmann'))
_drop('kinds_in_turn', 'chain', 'chains', 'at least {N} different reflexes in one turn', 'kinds_turn', 'reflex tiles',
      lambda lg: max([len(set(t['chain'])) for t in lg.turns] or [0]), 'most distinct reflex names in one chain')
_drop('acted_total', 'restraint', 'restraint', 'at least {N} reagents that found something', 'acted', 'ticks',
      lambda lg: sum(1 for t in lg.turns for _, p in t['fired'] if p > 0), 'fired reagents that acted at least once')
_drop('distinct_acted', 'restraint', 'restraint', 'at least {N} different reagents that found something', 'acted_kinds', 'ticks',
      lambda lg: len({n for t in lg.turns for n, p in t['fired'] if p > 0}), 'distinct reagents that acted')
_drop('by_two_off_total', 'timing', 'vent', 'at least {N} runoff after two turns', 'deadline_off', 'jar and clock',
      lambda lg: _offsum(lg.head(2)), 'the runoff spec counted over turns 1 and 2 only')
_drop('busy', 'chain', 'chains', 'at least {N} reflexes over the round', 'steps', 'bolts',
      lambda lg: sum(_STEPS(lg)), 'sum over the turns of the length of the chain')
_drop('finish_strong', 'chain', 'chains', 'at least {N} reflexes in the last turn', 'finish', 'bar',
      lambda lg: _STEPS(lg)[2] if len(lg.turns) >= 3 else 0, 'length of the chain of turn 3')
_drop('kind_dry', 'chain', 'chains', 'at least {N} dry reflexes', 'self_dry', 'drops',
      lambda lg: sum(t['chain'].count('dry') for t in lg.turns), 'count of the dry reflex in the chains')
S('weight', 'size', 'big', 'weight', 'gain', 'at least {N} mass units over the start', 'weight', 'scale',
  'molecular weight, minus start; best turn', live=False)
S('bridgehead', 'shape', 'rings', 'bridgehead', 'gain', 'at least {N} more cage corner atoms', 'cage', 'a cage',
  'atoms at the ends of a bridge between two rings (RDKit), minus start; best turn', live=False)
S('mirror', 'makeup', 'kinds', 'mirror', 'gain', 'at least {N} more atoms with a twin', 'mirror', 'twins',
  'atoms minus the number of distinct atom classes, minus start; best turn', live=False)
S('stereo', 'makeup', 'kinds', 'stereo', 'gain', 'at least {N} more handed centres', 'hand', 'hands',
  'atoms that could be handed, minus start; best turn', live=False)

# specs that count the same thing in a different dress: at most one of each cluster is kept
for _n in ('rings', 'five_rings', 'six_rings', 'ring_atoms', 'by_two_rings'):
    SPECS[_n].cluster = 'ring count'
for _n in ('fused_pairs', 'fused_block'):
    SPECS[_n].cluster = 'fused rings'
SPECS['big_puff'].plain = 2


def all_specs():
    return list(SPECS.values())


def live_specs():
    return [s for s in SPECS.values() if s.live]


# ---------------------------------------------------------------------------------------------------------------
# lines: what a player may fire
# ---------------------------------------------------------------------------------------------------------------

def lines_for(ctx, short=False):
    """[(line, Turn, pay)] for the lines of three reagents (the engine's own list) and, when short, also lines of one or two."""
    base = ctx.evaluate()
    if not short:
        return base
    eng = ctx.engine
    out = list(base)
    have = {l for l, _, _ in base}
    for L in (2, 1):
        for line in itertools.product(ctx.hand, repeat=L):
            if line in have:
                continue
            c = Counter(line)
            if any(ctx.left.get(r, 0) < n for r, n in c.items()):
                continue
            t = eng.run_line(ctx.smi, line, ctx.rules)
            out.append((line, t, E.pay_cached(len(t.steps), ctx.best_prior)[0]))
    return out


# ---------------------------------------------------------------------------------------------------------------
# players that aim at specs
# ---------------------------------------------------------------------------------------------------------------

class _TrackPlayer:
    """Keeps the turns played so far in a round; the engine calls choose once a turn, turn 0 first."""
    shared = False

    def _begin(self, ctx):
        if ctx.turn == 0 and not self.shared:
            self.start = ctx.smi
            self.done = []
        self.carried = ctx.carried

    def _commit(self, line, t):
        self.done.append(turn_dict(line, t))

    def _log(self, extra):
        return Log(self.start, self.done + [extra], self.carried)


class SeekPlayer(_TrackPlayer):
    """Maximises the spec's value after this turn (the raw value: it is not told N), then yield.  Ties are drawn at random."""
    name = 'seek'

    def __init__(self, spec):
        self.h = spec

    def choose(self, ctx):
        self._begin(ctx)
        lines = lines_for(ctx, self.h.short)
        if not lines:
            return ()
        scored = []
        for line, t, pay in lines:
            lg = self._log(turn_dict(line, t))
            scored.append(((self.h.progress(lg, None), pay), line, t))
        top = max(s[0] for s in scored)
        pick = ctx.rng.choice([s for s in scored if s[0] == top])
        self._commit(pick[1], pick[2])
        return pick[1]


class AimPlayer(_TrackPlayer):
    """Plays toward the numbers (min(value, N) for each, scaled), then for yield.  aims = [(spec, N), ...].  The aiming player."""
    name = 'aim'

    def __init__(self, aims):
        self.aims = list(aims)
        self.short = any(h.short for h, _ in self.aims)

    def choose(self, ctx):
        self._begin(ctx)
        lines = lines_for(ctx, self.short)
        if not lines:
            return ()
        scored = []
        for line, t, pay in lines:
            lg = self._log(turn_dict(line, t))
            prog = sum(h.progress(lg, n) for h, n in self.aims)
            scored.append(((round(prog, 9), pay), line, t))
        top = max(s[0] for s in scored)
        pick = ctx.rng.choice([s for s in scored if s[0] == top])
        self._commit(pick[1], pick[2])
        return pick[1]


NEW_EPS = 0.10          # share of turns in which a new player just fires something
NEW_SIGMA = 0.25        # noise on the 0..1 judgement of a line
NEW_ACTED = 0.15        # a line in which every reagent has something to work on looks better to a new player


class NewPlayer(_TrackPlayer):
    """A person learning.  It sees the spec, its number and the molecule, and it knows what each reagent does by itself (the card
    says so), so it can tell which reagents will find something and judge how a line moves the molecule toward the spec.  It does
    NOT see what the molecule will do by itself afterwards (the reflexes) and learns nothing ahead of firing: it never plays a line
    out to look at the result.  Its judgement of a line is the spec's value on the molecule after the reagents alone (no reflexes),
    scaled over the lines of the turn, plus a liking for lines where every reagent finds something, plus noise; now and then
    (NEW_EPS of turns) it just fires something.  aims: [(spec, N), ...] (N None: the raw value)."""
    name = 'new'

    def __init__(self, aims, eps=NEW_EPS, sigma=NEW_SIGMA, acted=NEW_ACTED):
        self.aims = list(aims) if not isinstance(aims, Spec) else [(aims, None)]
        self.short = any(h.short for h, _ in self.aims)
        self.eps = eps
        self.sigma = sigma
        self.acted = acted

    def _direct(self, ctx, line):
        eng = ctx.engine
        smi = ctx.smi
        fired, off = [], Counter()
        ok = True
        for r in line:
            f = eng.fire(smi, r)
            fired.append((r, f.n))
            if f.acted:
                smi = f.smi
                off.update(dict(f.off))
            else:
                ok = False
        td = {'line': tuple(line), 'chain': (), 'fired': tuple(fired), 'off': dict(off), 'set_off': tuple(0 for _ in line),
              'smi_end': smi}
        return td, ok

    def _lines(self, ctx):
        """The lines the player may fire (no reflexes are run to look at them)."""
        out = [l for l in ctx.engine.valid_lines(ctx.hand, ctx.left)]
        if self.short:
            have = set(out)
            for L in (2, 1):
                for line in itertools.product(ctx.hand, repeat=L):
                    if line in have:
                        continue
                    c = Counter(line)
                    if any(ctx.left.get(r, 0) < n for r, n in c.items()):
                        continue
                    out.append(line)
        return out

    def choose(self, ctx):
        self._begin(ctx)
        lines = self._lines(ctx)
        if not lines:
            return ()
        rng = ctx.rng
        if rng.random() < self.eps:
            line = rng.choice(lines)
        else:
            prog, ok = [], []
            for line in lines:
                td, acted = self._direct(ctx, line)
                lg = self._log(td)
                prog.append(sum(h.progress(lg, n) for h, n in self.aims))
                ok.append(acted)
            lo, hi = min(prog), max(prog)
            span = max(hi - lo, 1e-9)
            best, bi = None, 0
            for i in range(len(lines)):
                sc = (prog[i] - lo) / span + (self.acted if ok[i] else 0.0) + rng.gauss(0, self.sigma)
                if best is None or sc > best:
                    best, bi = sc, i
            line = lines[bi]
        self._commit(line, ctx.engine.run_line(ctx.smi, tuple(line), ctx.rules))
        return line


class MixPlayer(_TrackPlayer):
    """Each turn plays like `a` with chance p, else like `b`.  Middling player: p(aim) = P_AIM['middling'] (0.5) on each turn;
    skilled player: p(aim) = P_AIM['skilled'] (0.95); on the other turns each plays like the NewPlayer."""
    name = 'mix'

    def __init__(self, a, b, p_a):
        self.a, self.b, self.p = a, b, p_a
        self.short = getattr(a, 'short', False) or getattr(b, 'short', False)

    def choose(self, ctx):
        if ctx.turn == 0:
            self.start = ctx.smi
            self.done = []
        for pl in (self.a, self.b):
            pl.shared = True
            pl.start, pl.done = self.start, self.done
        pl = self.a if ctx.rng.random() < self.p else self.b
        return pl.choose(ctx)


P_AIM = {'middling': 0.5, 'skilled': 0.95}


def make_player(kind, aims):
    """The players of the tests.  kind: 'yield' (the engine's greedy player), 'random', 'new', 'aim', 'middling', 'skilled', 'seek'.
    aims: [(spec, N), ...] (N may be None for 'seek' and 'new' fits)."""
    if kind == 'yield':
        return E.PLAYERS['greedy']
    if kind == 'random':
        return E.PLAYERS['random']
    if kind == 'new':
        return NewPlayer(aims)
    if kind == 'aim':
        return AimPlayer(aims)
    if kind == 'seek':
        return SeekPlayer(aims[0][0])
    if kind in P_AIM:
        a = AimPlayer(aims) if all(n for _, n in aims) else SeekPlayer(aims[0][0])
        return MixPlayer(a, NewPlayer(aims), P_AIM[kind])
    raise ValueError(kind)


# ---------------------------------------------------------------------------------------------------------------
# the rounds of a run
# ---------------------------------------------------------------------------------------------------------------
# the reagents a run can pick up after the six: whatever library.py lists beyond them (the 13 of the first library)
EXTRA = tuple(r for r in getattr(library, 'POOL19', library.SIX) if r not in library.SIX)
# the reflexes held in each band of rounds: the starting two; seven (the first library's first seven); all of them
_FIRST_SEVEN = tuple(r for r in ('ring', 'dry', 'flip', 'shift', 'tuck', 'weld', 'snap') if r in library.SELF_RULES)
RULES_BAND = {1: library.SELF_TIER1, 2: library.SELF_TIER1, 3: library.SELF_TIER1,
              4: _FIRST_SEVEN, 5: _FIRST_SEVEN, 6: _FIRST_SEVEN,
              7: library.SELF_ALL, 8: library.SELF_ALL, 9: library.SELF_ALL}


def run_carried(seed):
    """The reagents a run holds in each round 1..9, as a real run grows them: the six in rounds 1 to 3; one more from round 4,
    one or two more from round 5, two more from round 6 (eight at most); from round 7 the eight stay, and now and then one is
    swapped for a newly found reagent.  Returns {round: tuple}."""
    rng = random.Random('carried/%s' % (seed,))
    extras = rng.sample(EXTRA, 3)
    cur = list(library.SIX)
    out = {}
    for r in range(1, 10):
        if r == 4:
            cur.append(extras[0])
        elif r == 5 and rng.random() < 0.5:
            cur.append(extras[1])
        elif r == 6 and len(cur) < 8:
            cur.append(extras[1] if extras[1] not in cur else extras[2])
        elif r >= 7 and rng.random() < 0.4:
            new = rng.choice([x for x in EXTRA if x not in cur])
            cur[rng.randrange(len(cur))] = new
        out[r] = tuple(cur)
    return out


def band(rnd):
    return 'early' if rnd <= 3 else 'mid' if rnd <= 6 else 'late'


def pick_spec(*args, **kw):
    """The generator (hurdle_gen.pick_spec): see there."""
    import hurdle_gen
    return hurdle_gen.pick_spec(*args, **kw)


pick_hurdle = pick_spec
