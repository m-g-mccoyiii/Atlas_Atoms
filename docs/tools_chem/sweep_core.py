"""sweep_core.py: a fast whole-game simulator of Overreact for mass testing on every CPU core.

It sits on top of engine.py / library.py / fold.py / molecules2 / traits.py / hurdle_graph.py (imported, not copied) and
plays whole runs the way the game does (apps/steam/js/react/path.js, docs/tools_sim.js): the deal by round from molecules
v2 (the game's own FEED2 table, read out of path.js), two molecules offered and one taken, a spec picked from the game's
SPEC_TABLE with a proof that it can be reached, a hand of five from the carried set, a line of three, the reflex cascade
after every reagent that acted (the fold reflexes from round 4), the game's yield (places, row, extra, bank; fresh and old
steps; the double pay after the third circle; an across step paid as two; motifs), the spec check, Par and the four marks,
three run lengths and four player models.

What is matched and what is not is listed in docs/SWEEP.md ("Against the game").  In short:
  matched   CASC / RULE constants, scoreRound for the bare game, close / bank / made, assays (short, loose, each, scarce),
            specRead / specEvent / specLine / specPick, run lengths, uses, the size limit, loose rings opening on a page turn.
  proxy     "follows on" (the row): the game tracks atoms (a reagent follows on when it acts on an atom the last two plays
            made); here a reagent follows on when the number of places it fits changed over the last two plays.
  not in    isotopes (salt), rare versions of a reagent, instruments, the redraw, coins and offers between rounds, the
            family weights of the molecule draw, the screen-based ease of a molecule.

Everything a rule-breaking sigil or a perk needs is a field of Game.p (the rule numbers), Game.reactions / Game.self_rules
(the chemistry) or a hook on the Mod object passed to Game (sweep_perks.py, sigil2_rules.py).
"""
import copy
import json
import math
import os
import pickle
import random
import re
import sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

from rdkit import Chem, RDLogger

RDLogger.DisableLog('rdApp.*')

import chemlib
from chemlib import parse
import library as L
import engine as E
import fold as F
import traits as TR
import hurdle_graph as HG

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
PATH_JS = os.path.join(ROOT, 'apps', 'steam', 'js', 'react', 'path.js')
SWEEP_DIR = os.path.join(HERE, '_sweep')

# ---------------------------------------------------------------------------------------------------------------
# the game's own tables, read out of path.js so they cannot drift
# ---------------------------------------------------------------------------------------------------------------
_JS = open(PATH_JS, encoding='utf-8').read()


def _js_json(name):
    m = re.search(r'const %s = (\{.*?\});?\s*\n' % name, _JS)
    return json.loads(m.group(1))


FEED2 = _js_json('FEED2')
SPEC_TABLE = _js_json('SPEC_TABLE')
SPEC_TARGET = {int(k): float(v) for k, v in re.findall(r'(\d): ([\d.]+)', re.search(r'const SPEC_TARGET = \{(.*?)\}', _JS).group(1))}
MOTIF_RATE = {k: float(v) for k, v in re.findall(r'(\w+): \{ rate: ([\d.]+) \}', re.search(r'const MOTIFS = \{(.*?)\};', _JS).group(1))}
MOTIF_START = re.findall(r"'(\w+)'", re.search(r'const MOTIF_START = \[(.*?)\]', _JS).group(1))
PAR = [float(x) for x in re.search(r'const PAR = \{ rounds: \[(.*?)\]', _JS).group(1).split(',')]
_c = re.search(r'const CASC = \{ step: ([\d.]+), place: (\d+), row: ([\d.]+), mul: false, most: (\d+), old: ([\d.]+) \}', _JS)
CASC = {'step': float(_c.group(1)), 'place': float(_c.group(2)), 'row': float(_c.group(3)), 'most': int(_c.group(4)), 'old': float(_c.group(5))}
_s = re.search(r'const SYN = \{.*?finishExtra: ([\d.]+).*?place: (\d+), row: ([\d.]+) \}', _JS)
SYN = {'finishExtra': float(_s.group(1)), 'place': float(_s.group(2)), 'row': float(_s.group(3))}
SPEC_SCALE = {int(k): float(v) for k, v in re.findall(r'(\d): ([\d.]+)', re.search(r'RULE.specScale = \{(.*?)\}', _JS).group(1))}
SPEC_BAN = re.findall(r"'(\w+)'", re.search(r'RULE.specBan = \[(.*?)\]', _JS).group(1))
ASSAYF = json.loads(re.search(r'const ASSAYF = (\{.*?\});', _JS).group(1))
COIN = {'mark': 1, 'per': 3, 'cap': 2}                     # path.js COIN: a mark pays 1, interest 1 for every 3 held, 2 at most


def nice(q):
    mag = 10 ** max(0, int(math.floor(math.log10(max(10.0, q)))) - 1)
    return max(50, int(math.floor(q / mag + 0.5)) * mag)


def quota_of(rnd, brief):
    """The number to beat (path.js runQuota): Par of the round, times the assay's factor in rounds 3, 6, 9."""
    f = ASSAYF[brief][min(2, max(0, rnd // 3 - 1))] if brief in ASSAYF else 1.0
    return nice(PAR[rnd - 1] * f)


SPEC_FAMILY_TIER = {'chain': 0, 'runoff': 0, 'off': 0, 'restraint': 0, 'size': 1, 'makeup': 1, 'shape': 2, 'timing': 2}
SPEC_CLASH = [('growth', 'cut_down'), ('growth', 'finish_smaller'), ('growth', 'lean_turns'), ('off_total', 'pure_water'),
              ('off_total', 'pure_gas'), ('pure_water', 'pure_gas')]
SPEC_RIDER = {'p': 0.25, 'factor': 0.97}
SPEC_REACH = {'plays': 3, 'look': 30}
SPEC_JARS = ['water', 'hydrogen', 'carbon_dioxide', 'acid_fumes', 'ammonia', 'sulfur', 'trimethylamine', 'other']
P_POOL = [0.9, 0.85, 0.8, 0.7, 0.65, 0.6, 0.55, 0.5, 0.5]
ASSAYS = ['scarce', 'short', 'each', 'loose']
LENGTHS = {'bachelor': (3, 1), 'master': (6, 2), 'doctorate': (9, 3)}
MARKS = (1, 2, 4, 8)
# the game's ids for the engine's names (spec `need`, named rows)
JSID = {'pcc': 'oxidize', 'allyl': 'grow', 'bh3': 'hydroborate', 'nabh4': 'reduce', 'socl2': 'chlorination', 'lactol': 'ring',
        'enone': 'dry', 'taut': 'flip', 'snap6': 'snap', 'ether': 'close'}
OFFKEY = {'carbon dioxide': 'carbon_dioxide', 'acid fumes': 'acid_fumes', 'piece': 'other'}
# named rows of two that the game pays (run.js ROUTES), in the engine's names: (first alternatives, second alternatives)
ROUTES2 = [(('hydrate', 'hydroborate'), ('oxidize',)), (('hydrate',), ('dehydrate',)), (('dehydrate',), ('hydrate', 'hydroborate')),
           (('dehydrate',), ('finish',)), (('reduce', 'hydroborate'), ('dehydrate',), ('finish',)),
           (('reduce', 'hydroborate'), ('dehydrate',), ('hydrate', 'hydroborate'), ('oxidize',))]


def named_row(path):
    """The longest named row the path ends on pays 0.5 for each reagent after the first (path.js namedRow)."""
    best = 0
    for seq in ROUTES2:
        n = len(seq)
        if n > best and len(path) >= n and all(path[len(path) - n + k] in seq[k] for k in range(n)):
            best = n
    return 0.5 * (best - 1) if best else 0.0

START_SIX = ('hydrate', 'oxidize', 'grow', 'thiolene', 'dehydrate', 'ritter')         # path.js RUNG.start, ruling AF
NEAR10 = ('close', 'knit', 'cap', 'dry', 'flip', 'shift', 'tuck', 'weld', 'snap', 'ring')   # a new game's ten, in SELF_ORDER
FAR_HELD = tuple(k for k in F.FAR_ORDER if (not F.FAR_RULES[k].twin) or F.FAR_RULES[k].twin in NEAR10)
# rules.js nextReflex: rare groups first, ring across last (grp), then the nearest, then this order
FAR_JS = ('seal_far', 'close_far', 'knit_far', 'cap_far', 'open_far', 'bridge', 'weld_far', 'tuck_far', 'snap_far', 'stitch', 'link', 'ring_far')
FAR_GRP = {'seal_far': 0, 'close_far': 0, 'knit_far': 0, 'cap_far': 0, 'open_far': 0, 'bridge': 0, 'weld_far': 1, 'tuck_far': 1, 'snap_far': 1,
           'stitch': 1, 'link': 1, 'ring_far': 2}
POOL18 = tuple(L.POOL)


def _feeds():
    pool, bank = {r: [] for r in range(1, 10)}, {r: [] for r in range(1, 10)}
    seen = set()
    for row in FEED2['pool']:
        pool[row[0]].append(row[2])
        seen.add((row[0], row[2]))
    for row in FEED2['bank']:
        if (row[0], row[2]) not in seen:
            bank[row[0]].append(row[2])
    return pool, bank


FEED_POOL, FEED_BANK = _feeds()

# the finishing reagent (path.js SYN.finish, 'h2'): hydrogen over palladium takes every C=C to C-C; last page only, ends the round
FINISH = chemlib.Reaction('finish', 'Hydrogenate', [chemlib.SmartsStep('[C:1]=[C:2]>>[C:1]-[C:2]', adds='H2')], source='built')
# oxidize in the bare game (MODE.co2 false): no chain-end cut
OX_BARE = chemlib.Reaction('oxidize', 'Oxidize', [L.oxidize.steps[0]], source='built')

DEFAULTS = dict(
    place=20.0,              # RARITY.common.place, SYN.place: what one place a reagent changes adds
    casc_place=CASC['place'], step=CASC['step'], row_c=CASC['row'], row_r=SYN['row'], old=CASC['old'], most=CASC['most'],
    lastx=2.0, fold_pay=2, pages=3, circles=3, hand=5, uses=3, max_heavy=56, fresh=True, reopen=True,
    far_from=4,              # the across-the-fold reflexes are held from this round
    motifs=True, motif_open=tuple(MOTIF_START), finish=True, co2=None, fire_times=1,
    limits_reset=False,      # sigil: the per-turn limits start again after every reagent
    kind_fresh=0,            # RULE.kindFresh: the first step of each kind in a round counts this many more times
    runoff_step=0,           # sigil: each thing that comes off pays as this many reflex steps
    dbl_places=1.0,          # sigil: a reagent or reflex that works on a double bond has its places counted this many times
    casc_mul=1.0,            # sigil: every reflex step's places times this
    spec_scale=None, spec_ban=None, uses_free=None)
DBL_REAGENTS = {'hydrate', 'hydroborate', 'grow', 'reduce', 'hwe', 'dihydroxylation', 'ozonolysis', 'ritter', 'thiolene',
                'cyanohydrin', 'hydroformylation', 'epoxidation', 'finish'}
DBL_REFLEX = {'ring', 'dry', 'flip', 'shift', 'tuck', 'weld', 'snap', 'knit', 'cap', 'ring_far', 'cap_far', 'knit_far', 'weld_far',
              'tuck_far', 'snap_far', 'stitch'}


class Mod:
    """Hooks for a perk or a sigil.  Every method may be left out."""
    name = ''

    def setup(self, G):
        """Change G.p, G.reactions, G.self_rules, G.near, G.far once, before play."""

    def round_start(self, G, R, rng):
        """R.smi may be changed (a transmutation)."""

    def before_page(self, G, R, rng, player, hand):
        """Return a forced line (wood spirit) or None."""

    def on_fire(self, G, R, rid, sg):
        """A reagent is about to act on R.smi (sg is what it does): feed counters go in R.ev."""

    def after_page(self, G, R, rng, player):
        """A tap after the page fired (a homunculus)."""

    def page_turn(self, G, R):
        """Called after the page is turned (frozen rings are paid here)."""

    def run_start(self, G, run):
        """A run begins.  run is a dict: gold, spent, uses, spec_up (later specs are raised by this factor), debt."""

    def round_end(self, G, R, run, earned):
        """The gold a round earned; return what the player keeps."""
        return earned

    def run_won(self, G, run, won):
        return won

    def peek(self, G, R, rng):
        """What the round would be worth (spec progress, yield) if the perk were tapped now, or None: a player who reads the page
        counts this when it weighs a line, so a line that feeds the creature can beat a line that pays more by itself."""
        return None


def ring_rule(name, lo=3, hi=4, per_turn=2, prio=2, through_any=False, alias='ring'):
    """The game's ring reflex (library.ring) with another reach: an OH whose carbon is lo..hi carbons from the carbon of a C=O
    closes a ring through its oxygen.  through_any: the distance is counted through any atom, not along carbons only."""
    kc, oh = '[%s:1]=[OX1:2]' % L.KC, '[OX2H:3]-[$([CX4]),$(c):4]'

    def find(mol):
        if not through_any:
            return chemlib.pair_sites(mol, kc, oh, 1, 4, lo, hi, ring='lactol')
        dm = Chem.GetDistanceMatrix(mol)
        out = []
        for ia, a in enumerate(chemlib.matches(mol, kc)):
            for ib, b in enumerate(chemlib.matches(mol, oh)):
                d = int(dm[a[1]][b[4]])
                if lo <= d <= hi and a[1] != b[4] and not mol.GetBondBetweenAtoms(a[1], b[3]):
                    out.append({'A': a, 'B': b, 'dist': d, 'tie': (ia, ib)})
        return out

    def edit(rw, s):
        rw.GetBondBetweenAtoms(s['A'][1], s['A'][2]).SetBondType(Chem.BondType.SINGLE)
        rw.AddBond(s['B'][3], s['A'][1], Chem.BondType.SINGLE)
    r = chemlib.GraphRule(name, find, edit, label=name, source='sweep')
    r.prio, r.per_turn, r.alias = prio, per_turn, alias
    return r


_ISO = re.compile(r'\[\d')
_GROUPS = None


_STRIP = {}


def _strip(smi):
    if not _ISO.search(smi):
        return smi
    v = _STRIP.get(smi)
    if v is None:
        if len(_STRIP) > 200000:
            _STRIP.clear()
        v = _STRIP[smi] = F.strip(smi)
    return v


def _feature(smi, k):
    """One number of path.js SX.featOf.  The cheap ones are read with RDKit; the longest chain and the alternating run are the
    game's own graph readers (hurdle_graph.py, the file path.js was ported from).  Rings: the count is bonds - atoms + 1 (the
    size of the smallest set of smallest rings); ring6, fused_pairs and ring_systems read RDKit's ring list, which differs from
    the game's on cages only (RIG.md, seventh measure)."""
    global _GROUPS
    mol = parse(smi)
    if k == 'atoms':
        return mol.GetNumAtoms()
    if k == 'branch':
        return sum(1 for a in mol.GetAtoms() if a.GetDegree() >= 3)
    if k == 'hetero':
        return sum(1 for a in mol.GetAtoms() if a.GetAtomicNum() != 6)
    if k in ('dbl', 'unsat', 'rings'):
        dbl = pi = arom = 0
        for b in mol.GetBonds():
            if b.GetIsAromatic():
                arom += 1
            elif b.GetBondTypeAsDouble() == 2.0:
                pi += 1
                z = {b.GetBeginAtom().GetAtomicNum(), b.GetEndAtom().GetAtomicNum()}
                if z == {6} or z == {6, 8}:
                    dbl += 1
        rings = mol.GetNumBonds() - mol.GetNumAtoms() + len(Chem.GetMolFrags(mol))
        return {'dbl': dbl + arom // 2, 'unsat': rings + pi + arom // 2, 'rings': rings}[k]
    if k in ('ring6', 'fused_pairs', 'ring_systems'):
        rings = [set(r) for r in mol.GetRingInfo().AtomRings()]
        if k == 'ring6':
            return sum(1 for r in rings if len(r) == 6)
        n = len(rings)
        par = list(range(n))

        def find(x):
            while par[x] != x:
                par[x] = par[par[x]]
                x = par[x]
            return x
        pairs = 0
        for i in range(n):
            for j in range(i + 1, n):
                c = len(rings[i] & rings[j])
                if c >= 2:
                    pairs += 1
                if c >= 1:
                    par[find(i)] = find(j)
        return pairs if k == 'fused_pairs' else len({find(i) for i in range(n)})
    if k == 'chain' or k == 'conj':
        m = Chem.Mol(mol)                       # as hurdle_graph.graph_of, but a dative (fifth) bond is read as a plain bond
        Chem.Kekulize(m, clearAromaticFlags=True)
        el = [a.GetSymbol() for a in m.GetAtoms()]
        bonds = [(x.GetBeginAtomIdx(), x.GetEndAtomIdx(), int(x.GetBondTypeAsDouble())) for x in m.GetBonds()]
        return HG.longest_chain(el, bonds) if k == 'chain' else HG.alternating_run(el, bonds)
    if _GROUPS is None:
        import hurdles
        _GROUPS = hurdles.GROUP_SMARTS
    if k == 'kinds':
        return sum(1 for g in _GROUPS.values() if mol.HasSubstructMatch(g))
    if k.startswith('g:'):
        return len(mol.GetSubstructMatches(_GROUPS[k[2:]]))
    raise KeyError(k)


class FeatView:
    __slots__ = ('G', 'smi')

    def __init__(self, G, smi):
        self.G, self.smi = G, smi

    def __getitem__(self, k):
        return self.G.fkey(self.smi, k)


class Seg:
    __slots__ = ('n', 'off', 'smi1', 'steps')

    def __init__(self, n, off, smi1, steps):
        self.n, self.off, self.smi1, self.steps = n, off, smi1, steps      # steps: ((kind, smiles after, off items), ...)


class Round:
    """The state of one round, as path.js keeps it on g."""
    __slots__ = ('smi', 'P', 'Rr', 'E', 'bank', 'casc', 'best', 'path', 'hist', 'seen', 'loops', 'used', 'kinds_seen', 'rnd',
                 'brief', 'page', 'pages', 'left', 'rules', 'rec', 'f0', 'spec', 'over', 'ev', 'x', 'tally', 'limcnt', 'free', 'tierNo')

    def copy(self):
        o = Round.__new__(Round)
        for k in Round.__slots__:
            setattr(o, k, getattr(self, k))
        o.path = self.path[:]
        o.hist = self.hist[:]
        o.left = dict(self.left) if self.left is not None else None
        o.ev = dict(self.ev)
        o.x = dict(self.x)
        o.tally = dict(self.tally)
        o.used = self.used
        o.kinds_seen = self.kinds_seen
        o.seen = self.seen
        return o


def made(R):
    return int(round((R.bank + R.P * R.Rr) * R.E))


class Game:
    def __init__(self, key='base', mods=(), params=None, cache=None):
        self.key = key
        self.p = dict(DEFAULTS)
        if params:
            self.p.update(params)
        self.reactions = dict(L.REACTIONS)
        self.reactions['finish'] = FINISH
        self.self_rules = dict(L.SELF_RULES)
        self.self_rules.update(F.FAR_RULES)
        self.near = NEAR10
        self.far = tuple(k for k in FAR_JS if k in FAR_HELD)
        for k, grp in FAR_GRP.items():
            fr = copy.copy(F.FAR_RULES[k])
            fr.prio = 3 + grp
            self.self_rules[k] = fr
        self.reopen_extra = []          # fn(smiles) -> smiles, run after the loose rings open (frozen rings, cured carbons)
        self.reopen_skip = None         # a SMARTS that replaces the engine's loose-ring pattern (dry ice: frozen rings stay)
        self.hooks_fire = False
        self.reaction_extra = {}        # {reagent: [more steps]} (a sigil adds to what a reagent does)
        self.fold_K = F.K_DEFAULT       # backbone atoms in a row of the fold
        self.run = {'gold': 0, 'spent': 0, 'uses': 0, 'spec_up': 1.0, 'debt': 0}
        self.extra_key = ''             # joins the key of a kept proof (rules that change inside a run)
        self.real = True                # False while a proof round is played (perks do not count their taps there)
        self.modkey = '+'.join(getattr(m, 'name', '') for m in mods) + '|' + json.dumps(params or {}, sort_keys=True)
        self.mods = list(mods)
        for m in self.mods:
            m.setup(self)
        self._engs = {}
        self.cache = cache if cache is not None else {}
        self.new = {}
        self.stats = Counter()

    # --- engines -------------------------------------------------------------------------------------------------
    def eng(self, co2, fold=False):
        """The engine: with the fold (the anchor kept on the molecule) when across reflexes are held, plain otherwise."""
        e = self._engs.get((co2, fold))
        if e is None:
            rx = dict(self.reactions)
            if not co2 and rx.get('oxidize') is L.oxidize:
                rx['oxidize'] = OX_BARE
            for n, more in self.reaction_extra.items():
                rx[n] = chemlib.Reaction(n, rx[n].label, list(rx[n].steps) + list(more), source='sigil')
            if fold:
                e = F.FoldEngine(reactions=rx, max_heavy=self.p['max_heavy'], cap=self.p['most'])
            else:
                e = E.Engine(reactions=rx, max_heavy=self.p['max_heavy'], cap=self.p['most'])
            e.self_rules = self.self_rules
            self._engs[(co2, fold)] = e
        return e

    def has_far(self, rules):
        return any(getattr(self.self_rules[r], 'far', False) for r in rules)

    def _get(self, k):
        v = self.cache.get(k)
        if v is None:
            v = self.new.get(k)
        return v

    def _put(self, k, v):
        self.new[k] = v
        return v

    def trim(self):
        for e in self._engs.values():
            if len(e._fire) > 60000:
                e.clear()

    # --- chemistry, cached by canonical SMILES ----------------------------------------------------------------------
    def rules_for(self, rnd):
        return self.near + (self.far if rnd >= self.p['far_from'] else ())

    def start(self, smi, rnd):
        s = chemlib.canon(smi)
        if self.has_far(self.rules_for(rnd)):
            s = F.with_anchor(s)
        return self.reopen(s)

    def reopen(self, smi):
        if not self.p['reopen']:
            return smi
        k = ('o', self.key, smi)
        v = self._get(k)
        if v is None:
            v = self._put(k, self._reopen(smi))
        return v

    def _reopen(self, smi):
        if self.reopen_skip:
            mol = parse(smi)
            for _ in range(80):
                ms = chemlib.matches(mol, self.reopen_skip)
                if not ms:
                    break
                rw = Chem.RWMol(mol)
                rw.RemoveBond(ms[0][1], ms[0][3])
                rw.GetBondBetweenAtoms(ms[0][1], ms[0][2]).SetBondType(Chem.BondType.DOUBLE)
                out = chemlib.finish(rw)
                if out is None:
                    break
                mol = out
            s = Chem.MolToSmiles(mol)
        else:
            s = self.eng(True).reopen(smi)[0]
        for fn in self.reopen_extra:
            s = fn(s)
        return s

    def seg(self, smi, rid, used, rules, co2):
        """One reagent fired on smi and the reflexes that follow, step by step.  None when it is wasted."""
        k = ('s', self.key, smi, rid, used, rules, co2)
        v = self.cache.get(k)
        if v is None:
            v = self.new.get(k)
        if v is not None:
            return v if v != 0 else None
        self.stats['seg_miss'] += 1
        F.CFG['K'] = self.fold_K
        eng = self.eng(co2, self.has_far(rules))
        f = eng.fire(smi, rid)
        if not f.acted:
            self.new[k] = 0
            return None
        v = Seg(f.n, tuple((OFFKEY.get(a, a), b) for a, b in f.off), f.smi, self.cascade(f.smi, used, rules, co2))
        self.new[k] = v
        return v

    def cascade(self, smi, used, rules, co2, budget=None):
        F.CFG['K'] = self.fold_K
        eng = self.eng(co2, self.has_far(rules))
        mol = parse(smi)
        cnt = Counter(dict(used))
        steps = []
        sr = self.self_rules
        cap = budget or self.p['most']
        while len(steps) < cap:
            act = tuple(r for r in rules if getattr(sr[r], 'per_turn', None) is None or cnt[r] < sr[r].per_turn)
            nxt = eng._next_self(mol, act)
            if nxt is None:
                break
            rule, (mol, _d) = nxt
            cnt[rule.name] += 1
            steps.append((rule.name, Chem.MolToSmiles(mol), tuple((OFFKEY.get(a, a), b) for a, b in rule.off.items())))
        return tuple(steps)

    def casc_only(self, smi, used, rules, co2):
        """The reflexes of smi as it stands, no reagent (after a perk changed the molecule)."""
        k = ('c', self.key, smi, used, rules, co2)
        v = self._get(k)
        if v is None:
            v = self._put(k, self.cascade(smi, used, rules, co2))
        return v

    def mult(self, smi):
        """Product of (1 + rate x level) over the open motifs of the molecule, loose rings read open (path.js motifsOf)."""
        k = ('m', self.key, smi)
        v = self._get(k)
        if v is None:
            try:
                c = TR.counts(_strip(self.reopen(smi)))
                v = 1.0
                for name in self.p['motif_open']:
                    lv = c.get(name, 0)
                    if lv:
                        v *= 1 + MOTIF_RATE[name] * lv
            except Exception:
                v = 1.0
            self._put(k, v)
        return v

    def feat(self, smi):
        """The numbers the specs read, worked out one at a time as they are asked for."""
        return FeatView(self, smi)

    def fkey(self, smi, k):
        ck = ('f', smi, k)
        v = self._get(ck)
        if v is None:
            v = self._put(ck, _feature(_strip(smi), k))
        return v

    def sites(self, smi, rid, co2=True):
        """How many places each step of a reagent fits, for the follows-on proxy."""
        k = ('n', self.key, smi, rid, co2)
        v = self._get(k)
        if v is None:
            mol = parse(smi)
            v = tuple(len(mol.GetSubstructMatches(st.query, maxMatches=40)) for st in self.eng(co2).reactions[rid].steps if hasattr(st, 'query'))
            self._put(k, v)
        return v

    # --- a round -------------------------------------------------------------------------------------------------
    def begin(self, smi, rnd, rack, brief='plain', spec=None, tierNo=1):
        p = self.p
        R = Round.__new__(Round)
        R.rnd, R.brief, R.tierNo = rnd, brief, tierNo
        R.rules = self.rules_for(rnd)
        R.smi = self.start(smi, rnd)
        R.P, R.Rr, R.E, R.bank, R.casc, R.best = 0.0, 1.0, 1.0, 0.0, 0, 0
        R.path, R.hist, R.seen, R.loops, R.used, R.kinds_seen = [], [], frozenset([R.smi]), 0, frozenset(), frozenset()
        R.page, R.pages = 1, p['pages'] - (1 if brief == 'short' else 0)
        free = p['uses_free'] if p['uses_free'] is not None else (tierNo == 1)
        R.free = free
        n = (p['uses'] + 1) // 2 if brief == 'scarce' else p['uses']
        R.left = None if free else {r: n for r in rack}
        R.spec = spec
        R.f0 = self.feat(R.smi)
        R.rec = []
        R.over = False
        R.ev = {}
        R.x = {}
        R.tally = {}
        R.limcnt = ()
        return R

    def co2_of(self, R):
        c = self.p['co2']
        return (R.tierNo != 1) if c is None else c

    def close(self, R):
        R.bank += R.P * R.Rr
        R.P = 0.0
        R.Rr = 1.0
        R.path = []

    def _used(self, cnt):
        sr = self.self_rules
        return tuple(sorted((k, min(v, sr[k].per_turn)) for k, v in cnt.items() if getattr(sr[k], 'per_turn', None) is not None))

    def score_casc(self, R, kind, smi, off, page, lx):
        """One reflex step: path.js scoreRound with o.casc (and synTake's bookkeeping)."""
        p = self.p
        far = getattr(self.self_rules[kind], 'far', False)
        h = p['casc_place'] * lx * p['casc_mul']
        if p['dbl_places'] != 1.0 and kind in DBL_REFLEX:
            h *= p['dbl_places']
        R.P += h
        base = kind[:-4] if kind.endswith('_far') else kind
        nrp = (p['fold_pay'] if far else 1) + (p['kind_fresh'] if (p['kind_fresh'] and base not in R.kinds_seen) else 0)
        if p['runoff_step'] and off:
            nrp += p['runoff_step'] * sum(b for _a, b in off)
        for _ in range(nrp):
            R.casc += 1
            w = 1.0 if (not p['fresh'] or R.casc > R.best) else p['old']
            if R.casc > 1:
                f = 1 + (R.casc - 1) * w
                R.P += h * (f - 1)
                h *= f
            R.E += p['step'] * R.casc * w * lx
        if p['motifs']:
            m = self.mult(smi)
            if m > 1:
                R.P += h * (m - 1)
        if R.brief != 'loose':
            R.Rr += p['row_c']
        else:
            R.E += 0.3
        if R.brief == 'each' and kind not in R.used:
            R.E += 0.5
            R.used = R.used | {kind}
        R.kinds_seen = R.kinds_seen | {base}
        R.path.append('~')
        R.hist.append(R.smi)
        R.smi = smi
        if smi not in R.seen:
            R.seen = R.seen | {smi}
        page['chain'].append(getattr(self.self_rules[kind], 'alias', kind))
        for a, b in off:
            page['off'][a] = page['off'].get(a, 0) + b
            R.ev[a] = R.ev.get(a, 0) + b

    def play_circle(self, R, rid, page, idx, n_circ):
        """One circle of the line: the reagent, then the reflexes (path.js queueStep, synTake, afterTurn)."""
        p = self.p
        co2 = self.co2_of(R)
        circ = [rid, 0, 0]
        page['circ'].append(circ)
        if rid == 'finish' and R.page < R.pages:
            return
        if R.left is not None and rid != 'finish':
            if R.left.get(rid, 0) <= 0:
                return
            R.left[rid] -= 1
        times = 1 if rid == 'finish' else p['fire_times']
        for t in range(times):
            used = () if p['limits_reset'] else R.limcnt
            sg = self.seg(R.smi, rid, used, R.rules, co2)
            if sg is None:
                if t == 0:
                    page['last_on'] = False
                return
            if self.hooks_fire:
                for m in self.mods:
                    m.on_fire(self, R, rid, sg)
            # does it follow on?  (proxy for the game's atom tracking, see the module docstring)
            cont = False
            if rid == 'finish':
                cont = True
            elif R.path:
                back = R.hist[-2] if len(R.hist) >= 2 else (R.hist[0] if R.hist else R.smi)
                hot = self.sites(R.smi, rid, co2) != self.sites(back, rid, co2)
                loop = sg.smi1 in R.seen
                cont = hot and (not loop or R.loops < 2)
                if loop and cont:
                    R.loops += 1
                if not cont:
                    self.close(R)
            first = rid not in R.used
            per = p['place']
            if R.brief == 'each' and not first:
                per = 0.0
            if p['dbl_places'] != 1.0 and rid in DBL_REAGENTS:
                per *= p['dbl_places']
            h = per * sg.n
            R.P += h
            if p['motifs']:
                m = self.mult(sg.smi1)
                if m > 1:
                    R.P += h * (m - 1)
            R.path.append(rid)
            if cont and R.brief != 'loose':
                R.Rr += p['row_r']
                R.Rr += named_row(R.path)
            if R.brief == 'loose':
                R.E += 0.3
            elif R.brief == 'each' and first:
                R.E += 0.5
            R.used = R.used | {rid}
            R.hist.append(R.smi)
            R.smi = sg.smi1
            if sg.smi1 not in R.seen:
                R.seen = R.seen | {sg.smi1}
            circ[1] += sg.n
            for a, b in sg.off:
                page['off'][a] = page['off'].get(a, 0) + b
                R.ev[a] = R.ev.get(a, 0) + b
            R.ev['use:' + rid] = R.ev.get('use:' + rid, 0) + 1
            if p['runoff_step'] and sg.off:
                for _ in range(p['runoff_step'] * sum(b for _a, b in sg.off)):
                    R.casc += 1
                    w = 1.0 if (not p['fresh'] or R.casc > R.best) else p['old']
                    R.P += p['casc_place'] * (1 + (R.casc - 1) * w)
                    R.E += p['step'] * R.casc * w
            if rid == 'finish':
                R.E += SYN['finishExtra'] * sg.n
                R.over = True
                return
            last_on = idx >= n_circ - 1
            page['last_on'] = last_on
            lx = p['lastx'] if (last_on or p.get('lastx_all')) else 1.0
            cnt = Counter(dict(used))
            for kind, smi, off in sg.steps:
                if R.casc >= p['most']:
                    break
                self.score_casc(R, kind, smi, off, page, lx)
                cnt[kind] += 1
                circ[2] += 1
            R.limcnt = self._used(cnt)

    def run_line(self, R, line):
        """Fire a line on a copy of the round.  Returns (round after, page record)."""
        R2 = R.copy()
        page = {'circ': [], 'chain': [], 'off': {}, 'last_on': False}
        R2.limcnt = ()
        n = len(line)
        for i, rid in enumerate(line):
            if R2.over:
                break
            self.play_circle(R2, rid, page, i, max(n, self.p['circles']))
        page['smi'] = R2.smi
        return R2, page

    def page_rec(self, page):
        return {'circ': page['circ'], 'chain': page['chain'], 'off': page['off'], 'total': sum(page['off'].values()),
                'F': self.feat(page['smi'])}

    def turn(self, R):
        """path.js turn(): the page is turned, the longest chain is kept, the loose rings open."""
        R.best = max(R.best, R.casc)
        R.casc = 0
        R.page += 1
        s = self.reopen(R.smi)
        if s != R.smi:
            R.hist.append(R.smi)
            R.smi = s
        R.limcnt = ()
        for m in self.mods:
            m.page_turn(self, R)

    def tap(self, R, smi, restart=False):
        """A perk changed the molecule: the reflexes run from the new molecule and are paid as steps of the page in play
        (path.js homGo).  restart: the count of the page starts again (water).  Returns the steps it set off."""
        if smi != R.smi:
            R.hist.append(R.smi)
            R.smi = smi
            if smi not in R.seen:
                R.seen = R.seen | {smi}
        if restart:
            R.best = max(R.best, R.casc)
            R.casc = 0
        rec = R.rec[-1] if R.rec else {'circ': [], 'chain': [], 'off': {}}
        pg = {'circ': list(rec['circ']), 'chain': list(rec['chain']), 'off': dict(rec['off'])}
        n = 0
        for kind, s, off in self.casc_only(smi, (), R.rules, self.co2_of(R)):
            if R.casc >= self.p['most']:
                break
            self.score_casc(R, kind, s, off, pg, 1.0)
            n += 1
        pg['smi'] = R.smi
        if R.rec:
            R.rec = R.rec[:-1] + [self.page_rec(pg)]
        return n

    def value(self, R):
        """What a player compares: spec progress, then yield."""
        return (self.prog(R, R.rec) if R.spec else 0.0, made(R))

    def end(self, R):
        self.close(R)
        R.over = True
        return made(R)

    # --- the spec (path.js specRead, specEvent) ---------------------------------------------------------------------
    def spec_value(self, name, f0, pages):
        d = SPEC_TABLE[name]
        key = d['key']
        if d['read'] == 'e':
            return _spec_event(key, pages, f0)
        if not pages:
            return 0
        k = 'g:' + key if d['read'] == 'g' else key
        a = f0[k]
        vals = [pg['F'][k] for pg in pages]
        mx, mn = max(vals), min(vals)
        mode = d['mode']
        if mode == 'gain':
            return max(0, mx - a)
        if mode == 'loss':
            return max(0, a - mn)
        if mode == 'abs':
            return mx
        if mode == 'last':
            return vals[-1]
        if mode == 'lastgain':
            return max(0, vals[-1] - a)
        if mode == 'lastloss':
            return max(0, a - vals[-1])
        if mode == 'range':
            return max(mx, a) - min(mn, a)
        raise ValueError(mode)

    def prog(self, R, pages):
        t = 0.0
        for name, n in R.spec:
            t += min(self.spec_value(name, R.f0, pages), n) / float(n)
        return round(t, 9)

    def met(self, R):
        return bool(R.spec) and all(self.spec_value(name, R.f0, R.rec) >= n for name, n in R.spec)

    # --- lines and players ----------------------------------------------------------------------------------------
    def lines(self, R, hand):
        """path.js specLines: every line the hand allows (uses respected), the finishing reagent on the last page."""
        L_ = self.p['circles']
        ids = [r for r in hand if R.left is None or R.left.get(r, 0) > 0]
        last = R.page >= R.pages
        fin = False
        if last and self.p['finish']:
            fin = self.sites(R.smi, 'finish')[0] > 0
        if fin:
            ids = ids + ['finish']
        short = bool(R.spec) and any(n == 'held_back' for n, _ in R.spec)
        out = []

        def rec(cur):
            if len(cur) == L_:
                out.append(tuple(cur))
                return
            if short and cur:
                out.append(tuple(cur))
            for r in ids:
                if r == 'finish':
                    if r in cur:
                        continue
                elif R.left is not None and cur.count(r) >= R.left.get(r, 0):
                    continue
                cur.append(r)
                rec(cur)
                cur.pop()
        rec([])
        return out

    def choose(self, R, hand, look, rng, next_hand=None, plan=False, peek=False):
        """path.js specLine: spec progress first, yield to break a tie, a further tie at random.  look None: every line."""
        lines = self.lines(R, hand)
        if not lines:
            return (), None, None
        if look is None and len(lines) > 250:
            look = 250                  # four circles or a hand of eight: the reader looks at 250 lines drawn at random
        if look and len(lines) > look:
            rng.shuffle(lines)
            lines = lines[:look]
        best = None
        ties = 0
        scored = []
        plain = None
        peek = peek and bool(self.mods)
        for l in lines:
            R2, page = self.run_line(R, l)
            pr = self.prog(R, R.rec + [self.page_rec(page)]) if R.spec else 0.0
            v = (pr, made(R2))
            if peek:
                if plain is None or v > plain[0]:
                    plain = (v, l)
                if not R2.over:
                    R2.rec = R.rec + [self.page_rec(page)]
                    for m in self.mods:
                        w = m.peek(self, R2, rng)
                        if w is not None and w > v:
                            v = w
            if plan:
                scored.append((v, l, R2, page))
            if best is None or v > best[0]:
                best = (v, l, R2, page)
                ties = 1
            elif v == best[0]:
                ties += 1
                if rng.random() < 1.0 / ties:
                    best = (v, l, R2, page)
        if plan and next_hand and R.page < R.pages and R.spec:
            # the planner: the six best lines of this page, each followed by the best line of the next hand (shown: RULE.next)
            scored.sort(key=lambda t: t[0], reverse=True)
            top = None
            for v, l, R2, page in scored[:3]:
                R3 = R2.copy()
                R3.rec = R.rec + [self.page_rec(page)]
                self.turn(R3)
                nv = (-1.0, -1)
                for l2 in self.lines(R3, next_hand):
                    R4, pg2 = self.run_line(R3, l2)
                    w = (self.prog(R3, R3.rec + [self.page_rec(pg2)]), made(R4))
                    if w > nv:
                        nv = w
                key = (nv[0], v[0], nv[1])
                if top is None or key > top[0]:
                    top = (key, (v, l, R2, page))
            best = top[1]
        if peek and plain is not None:
            best[2].x['dec_pages'] = best[2].x.get('dec_pages', 0) + 1
            if plain[1] != best[1] and best[0] > plain[0]:
                best[2].x['dec_changed'] = best[2].x.get('dec_changed', 0) + 1
        return best[1], best[2], best[3]


def _spec_event(key, pages, f0):
    circs = lambda pg: pg['circ']
    if key == 'lean':
        prev, n = f0['atoms'], 0
        for pg in pages:
            a = pg['F']['atoms']
            if a < prev:
                n += 1
            prev = a
        return n
    if key == 'held':
        return sum(1 for pg in pages if 0 < len(pg['circ']) < 3)
    if key == 'pure_water':
        w = sum(pg['off'].get('water', 0) for pg in pages)
        return max(0, w - (sum(pg['total'] for pg in pages) - w))
    if key == 'pure_gas':
        gas = sum(pg['off'].get(j, 0) for pg in pages for j in ('hydrogen', 'carbon_dioxide', 'acid_fumes', 'trimethylamine'))
        return max(0, gas - sum(pg['off'].get('water', 0) for pg in pages))
    if key == 'opener':
        return max([pg['circ'][0][2] if pg['circ'] else 0 for pg in pages] or [0])
    if key == 'closer':
        return max([pg['circ'][2][2] if len(pg['circ']) >= 3 else 0 for pg in pages] or [0])
    if key.startswith('kind:'):
        return sum(pg['chain'].count(key[5:]) for pg in pages)
    if key == 'off:all':
        return sum(pg['total'] for pg in pages)
    if key.startswith('off:'):
        return sum(pg['off'].get(key[4:], 0) for pg in pages)
    raise ValueError('no event reader ' + key)


PLAYERS = {'novice': dict(look=4, plan=False, pick='random'), 'greedy': dict(look=12, plan=False, pick='ease'),
           'median': dict(look=None, plan=False, pick='ease'), 'planner': dict(look=None, plan=True, pick='ease'),
           'aim30': dict(look=30, plan=False, pick='ease')}


def deal_hand(rack, R, rng, n):
    """path.js draw(): n of the rack, reagents that still have a use first."""
    has = [r for r in rack if R.left is None or R.left.get(r, 0) > 0]
    out_ = [r for r in rack if not (R.left is None or R.left.get(r, 0) > 0)]
    rng.shuffle(has)
    rng.shuffle(out_)
    pick = (has + out_)[:n]
    return [r for r in rack if r in pick]


def play_round(G, smi, rnd, rack, player, rng, spec=None, brief='plain', tierNo=1, log=None):
    """One round.  Returns the Round at its end (R.x['total'] the yield, R.x['met'] the spec)."""
    pol = PLAYERS[player]
    R = G.begin(smi, rnd, rack, brief, spec, tierNo)
    for m in G.mods:
        m.round_start(G, R, rng)
    if G.mods:
        R.f0 = G.feat(R.smi)
        R.seen = frozenset([R.smi])
    nh = G.p['hand']
    hand = deal_hand(rack, R, rng, nh)
    steps_page, kinds, dealt, usedc = [], Counter(), Counter(), Counter()
    while True:
        dealt.update(hand)
        nxt = deal_hand(rack, R, rng, nh) if R.page < R.pages else None
        forced = None
        for m in G.mods:
            f = m.before_page(G, R, rng, player, hand)
            if f:
                forced = f
        if forced:
            R2, page = G.run_line(R, forced)
            line = tuple(forced)
        else:
            line, R2, page = G.choose(R, hand, pol['look'], rng, nxt, pol['plan'], peek=(player in ('median', 'planner', 'greedy')))
        if R2 is not None:
            rec = R.rec + [G.page_rec(page)]
            ev0 = R.ev
            R = R2
            R.rec = rec
            if log is not None:
                log.append({'page': R.page, 'hand': list(hand), 'line': list(line), 'chain': list(page['chain']), 'smi': R.smi,
                            'made': made(R), 'circ': [list(c) for c in page['circ']]})
            R.x['lines'] = R.x.get('lines', ()) + (line,)
            usedc.update(set(line))
        else:
            R.rec = R.rec + [G.page_rec({'circ': [], 'chain': [], 'off': {}, 'smi': R.smi})]
        for m in G.mods:
            if not R.over:
                m.after_page(G, R, rng, player)
        steps_page.append(len(R.rec[-1]['chain']))
        kinds.update(R.rec[-1]['chain'])
        if R.over or R.page >= R.pages:
            break
        G.turn(R)
        hand = nxt
    R.x['total'] = G.end(R)
    R.x['met'] = G.met(R) if R.spec else None
    R.x['steps'] = steps_page
    R.x['kinds'] = dict(kinds)
    R.x['dealt'] = dict(dealt)
    R.x['used'] = dict(usedc)
    return R


# ---------------------------------------------------------------------------------------------------------------
# the spec generator (path.js specPick)
# ---------------------------------------------------------------------------------------------------------------

def _need(d, carried, co2):
    nd = d.get('need')
    if not nd:
        return True
    for x in nd:
        if x == 'never':
            continue
        if x == 'mode:co2':
            if co2:
                return True
        elif JSID.get(x, x) in carried:
            return True
    return False


def spec_pick(G, smi, rnd, rack, rng, tierNo, hist, brief='plain', proof=True):
    last = hist[-1] if hist else []
    recent = Counter(f for h in hist[-4:] for f in h)
    p = G.p
    scale = (p['spec_scale'] if p['spec_scale'] is not None else SPEC_SCALE) if tierNo == 1 else {}
    ban = (p['spec_ban'] if p['spec_ban'] is not None else SPEC_BAN) if tierNo == 1 else ()
    target = max(0.05, min(0.99, SPEC_TARGET[max(1, min(9, rnd))]))
    pair = rnd >= 6
    rider = pair and rnd in SPEC_TABLE['held_back']['good'] and 'restraint' not in last and rng.random() < SPEC_RIDER['p']
    t1 = min(0.97, (target / 0.9) ** 0.5) if pair else target
    t1r = min(0.97, target / SPEC_RIDER['factor'])
    co2 = (tierNo != 1) if p['co2'] is None else p['co2']
    carried = set(rack) | set(G.near)
    start = G.start(smi, rnd)
    atoms0 = G.feat(start)['atoms']

    def is_open(name):
        d = SPEC_TABLE[name]
        return (name not in ban and not d.get('rider') and rnd in d['good'] and SPEC_FAMILY_TIER.get(d['fam'], 3) <= tierNo
                and _need(d, carried, co2))

    def order(names):
        return [n for n, _ in sorted(((n, rng.random() * (1 + 2 * recent.get(SPEC_TABLE[n]['fam'], 0))) for n in names), key=lambda t: t[1])]

    def n_of(name, tg):
        d = SPEC_TABLE[name]
        best, bd = 0, 9.0
        for N, share in d['use'].get(str(rnd), []):
            e = abs(share - tg)
            if e < bd:
                bd, best = e, N
        cap = min(atoms0, 56 - atoms0) if d['cap'] == 'start' else (atoms0 // 2 if d['cap'] == 'half' else 10 ** 9)
        if tierNo == 1 and best:
            best = max(1, int(round(best * scale.get(rnd, 1) + 1e-9)))
        return min(best, cap)

    def reach(parts):
        # the proof that an aiming player reaches it in up to three plays.  The answer for one (molecule, rack, spec) is kept:
        # a later run with the same three reuses the draw, which leaves the rates as they are and saves most of the work.
        if not proof:
            return 1
        ck = ('p', G.key, G.modkey, G.extra_key, smi, rnd, tuple(rack), tuple(parts), brief, tierNo, co2)
        v = G._get(ck)
        if v is None:
            v = 0
            G.real = False
            try:
                for k in range(SPEC_REACH['plays']):
                    if play_round(G, smi, rnd, rack, 'aim30', rng, spec=parts, brief=brief, tierNo=tierNo).x['met']:
                        v = k + 1
                        break
            finally:
                G.real = True
            G._put(ck, v if v else -1)
        return max(v, 0)

    def clash(a, b):
        return (SPEC_TABLE[a]['fam'] == SPEC_TABLE[b]['fam'] or SPEC_TABLE[a]['plan'] == SPEC_TABLE[b]['plan']
                or (a, b) in SPEC_CLASH or (b, a) in SPEC_CLASH)
    names = [n for n in SPEC_TABLE if is_open(n)]
    got = None
    for a in order([n for n in names if SPEC_TABLE[n]['fam'] not in last])[:10]:
        na = n_of(a, t1)
        if na < 1:
            continue
        if rider:
            ra, nr = n_of(a, t1r), n_of('held_back', 1)
            if ra < 1 or nr < 1:
                continue
            ps = [(a, ra), ('held_back', nr)]
            k = reach(ps)
            if k:
                got = (ps, k)
                break
            continue
        if not pair:
            k = reach([(a, na)])
            if k:
                got = ([(a, na)], k)
                break
            continue
        for b in order([n for n in names if not clash(a, n) and SPEC_TABLE[n]['fam'] not in last])[:6]:
            nb = n_of(b, t1)
            if nb < 1:
                continue
            ps = [(a, na), (b, nb)]
            k = reach(ps)
            if k:
                got = (ps, k)
                break
        if got:
            break
    fell = False
    if not got:
        fell = True
        cands = [x for x in ('off_total', 'growth', 'branch') if SPEC_TABLE[x]['fam'] not in last] + ['off_total', 'growth', 'branch']
        for nm in cands:
            got = ([(nm, max(1, n_of(nm, target)))], 0)
            if reach(got[0]):
                break
    return {'parts': got[0], 'proof': got[1], 'fell': fell, 'families': [SPEC_TABLE[n]['fam'] for n, _ in got[0]]}


# ---------------------------------------------------------------------------------------------------------------
# a run
# ---------------------------------------------------------------------------------------------------------------

def deal_two(rnd, rng, extra=None):
    """Two different molecules of the round: the pool with the game's chance, else the bank (path.js feedsFor, P_POOL).
    extra(rnd, rng) may return a SMILES to deal in place of the first (the rarity curve of sweep_elements.py)."""
    out = []
    while len(out) < 2:
        src = FEED_POOL[rnd] if (rng.random() < P_POOL[rnd - 1] or not FEED_BANK[rnd]) else FEED_BANK[rnd]
        s = rng.choice(src)
        if extra is not None and not out:
            s = extra(rnd, rng) or s
        if s not in out:
            out.append(s)
    return out


def play_run(G, seed, length='bachelor', rack=START_SIX, player='median', racks=None, extra=None, stop=False, logs=False, first=1,
             last=None):
    """A whole run.  racks: {round: rack} when the carried set changes.  Every round is played (as the rig's `all`) unless stop.
    Returns a dict: won, cleared, rounds: [{r, mol, brief, spec, met, total, par, marks, steps, kinds, ...}]."""
    n_rounds, tierNo = LENGTHS[length]
    rng0 = random.Random('run/%s' % seed)
    assay = ASSAYS[:]
    rng0.shuffle(assay)
    hist = []
    out = {'seed': seed, 'length': length, 'player': player, 'rounds': [], 'cleared': 0, 'won': False}
    alive = True
    run = G.run = {'gold': 0, 'spent': 0, 'uses': 0, 'spec_up': 1.0, 'debt': 0, 'player': player, 'n_rounds': n_rounds, 'at': []}
    G.extra_key = ''
    for m in G.mods:
        m.run_start(G, run)
    if last:
        n_rounds = last - first + 1
    for r in range(first, (last or n_rounds) + 1):
        rng = random.Random('run/%s/%d' % (seed, r))
        rk = tuple(racks[r]) if racks else tuple(rack)
        brief = assay[(r // 3 - 1) % 3] if r % 3 == 0 else 'plain'
        two = deal_two(r, rng, extra)
        opts = [(s, spec_pick(G, s, r, rk, rng, tierNo, hist, brief)) for s in two]
        if PLAYERS[player]['pick'] == 'random':
            smi, sp = opts[rng.randrange(2)]
        else:
            key = lambda o: (0 if o[1]['proof'] == 0 else 4 - o[1]['proof'])
            smi, sp = opts[0] if key(opts[0]) >= key(opts[1]) else opts[1]
        hist.append(sp['families'])
        if run['spec_up'] > 1.0:
            sp = dict(sp, parts=[(nm, int(math.ceil(n * run['spec_up'] - 1e-9))) for nm, n in sp['parts']])
        run['round'] = r
        lg = [] if logs else None
        R = play_round(G, smi, r, rk, player, rng, spec=sp['parts'], brief=brief, tierNo=tierNo, log=lg)
        total = R.x['total']
        par = quota_of(r, brief)
        earned = 0
        if total >= par:
            earned = COIN['mark'] * sum(1 for k in (2, 4, 8) if total >= nice(par * k)) + min(COIN['cap'], run['gold'] // COIN['per'])
        for m in G.mods:
            earned = m.round_end(G, R, run, earned)
        run['gold'] += earned
        row = {'r': r, 'mol': smi, 'brief': brief, 'spec': sp['parts'], 'fell': sp['fell'], 'met': bool(R.x['met']), 'total': total,
               'par': par, 'marks': sum(1 for k in MARKS if total >= nice(par * k)), 'gold': run['gold'], 'steps': R.x['steps'], 'kinds': R.x['kinds'],
               'lines': R.x.get('lines', ()), 'dealt': R.x['dealt'], 'used': R.x['used'], 'alive': alive, 'end': R.smi, 'tap': R.x.get('tap', 0),
               'dec': (R.x.get('dec_changed', 0), R.x.get('dec_pages', 0))}
        if logs:
            row['log'] = lg
        out['rounds'].append(row)
        if row['met'] and alive:
            out['cleared'] += 1
        if not row['met']:
            alive = False
            if stop:
                break
        G.trim()
    out['won'] = out['cleared'] >= n_rounds
    for m in G.mods:
        out['won'] = m.run_won(G, run, out['won'])
    out['gold'], out['spent'], out['uses'], out['at'] = run['gold'], run['spent'], run['uses'], run['at']
    return out


# ---------------------------------------------------------------------------------------------------------------
# the disk cache shared by the workers
# ---------------------------------------------------------------------------------------------------------------

def cache_path(key):
    return os.path.join(SWEEP_DIR, 'cache', 'base_%s.pkl' % re.sub(r'[^A-Za-z0-9_.-]', '_', key))


def load_cache(key):
    fp = cache_path(key)
    if os.path.exists(fp):
        try:
            with open(fp, 'rb') as f:
                return pickle.load(f)
        except Exception:
            return {}
    return {}


def save_new(G, tag):
    """A worker writes what it learned; merge_cache folds the files into the base."""
    if not G.new:
        return None
    d = os.path.join(SWEEP_DIR, 'cache')
    os.makedirs(d, exist_ok=True)
    fp = os.path.join(d, 'new_%s_%s_%d.pkl' % (re.sub(r'[^A-Za-z0-9_.-]', '_', G.key), tag, os.getpid()))
    old = {}
    if os.path.exists(fp):
        with open(fp, 'rb') as f:
            old = pickle.load(f)
    old.update(G.new)
    with open(fp, 'wb') as f:
        pickle.dump(old, f, protocol=pickle.HIGHEST_PROTOCOL)
    G.cache.update(G.new)
    G.new = {}
    return fp


def merge_cache(key, limit=4000000):
    d = os.path.join(SWEEP_DIR, 'cache')
    if not os.path.isdir(d):
        return 0
    k2 = re.sub(r'[^A-Za-z0-9_.-]', '_', key)
    files = [f for f in os.listdir(d) if f.startswith('new_%s_' % k2)]
    if not files:
        return 0
    base = load_cache(key)
    for f in files:
        try:
            with open(os.path.join(d, f), 'rb') as h:
                new = pickle.load(h)
            if len(base) < limit:
                base.update(new)
        except Exception:
            pass
        os.remove(os.path.join(d, f))
    with open(cache_path(key), 'wb') as h:
        pickle.dump(base, h, protocol=pickle.HIGHEST_PROTOCOL)
    return len(base)


if __name__ == '__main__':
    import time
    G = Game()
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 20
    for pl in ('novice', 'greedy', 'median'):
        t = time.time()
        res = [play_run(G, s, 'bachelor', START_SIX, pl) for s in range(n)]
        dt = time.time() - t
        turns = sum(len(r['steps']) for x in res for r in x['rounds'])
        print(pl, 'won %.0f%%' % (100.0 * sum(x['won'] for x in res) / n),
              'clear', [round(100.0 * sum(x['rounds'][i]['met'] for x in res) / n) for i in range(3)],
              'median total', [sorted(x['rounds'][i]['total'] for x in res)[n // 2] for i in range(3)],
              '%.1f s, %.1f turns/s' % (dt, turns / dt), dict(G.stats))
