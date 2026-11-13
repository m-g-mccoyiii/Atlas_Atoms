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
import hashlib
import json
import math
import os
import pickle
import random
import re
import sqlite3
import sys
import time
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



def _far_sites_lazy(mol, sma_a, sma_b, anchor_a, anchor_b, same=False, extra=None):
    """fold.far_sites with the same answer, but the fold of the molecule (the dear part: about a millisecond for a molecule
    not seen before) is laid out only when both groups are on the molecule."""
    As = chemlib.matches(mol, sma_a)
    if not As or (same and len(As) < 2):
        return []
    Bs = As if same else chemlib.matches(mol, sma_b)
    if not Bs:
        return []
    f = F._fi(mol)
    out = []
    min_d = F.CFG['min_d']
    for ia, a in enumerate(As):
        ca = a[anchor_a]
        for ib, b in enumerate(Bs):
            if same and ib <= ia:
                continue
            cb = b[anchor_b]
            if ca == cb or set(a.values()) & set(b.values()):
                continue
            if not F.faces(f, ca, cb):
                continue
            d = int(f.dm[ca][cb])
            if d < min_d:
                continue
            if extra is not None and not extra(mol, a, b):
                continue
            out.append({'A': a, 'B': b, 'dist': d, 'tie': (ia, ib)})
    return out


F.far_sites = _far_sites_lazy

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
PAR_AFTER = float(re.search(r'const PAR = \{ rounds: \[.*?\], after: ([\d.]+)', _JS).group(1))       # the step for every round past nine
_h = re.search(r'RULE\.hetCurve = \[(.*?)\]', _JS)
HET_CURVE = [float(x) for x in _h.group(1).split(',')] if _h else None     # ruling AF2: share of dealt molecules with an element past C, H, O
_hb = re.search(r'RULE.hetCurveB = \[(.*?)\]', _JS)
HET_CURVE_B = [float(x) for x in _hb.group(1).split(',')] if _hb else None   # the bachelor's own curve (a first game)
_sb = re.search(r'RULE.specBanBy = (\{.*?\});', _JS)
SPEC_BAN_BY = {int(k): re.findall(r"'(\w+)'", v) for k, v in re.findall(r'(\d): \[(.*?)\]', _sb.group(1))} if _sb else {}
_np = re.search(r'RULE.needPar = \[(.*?)\]', _JS)
NEED_PAR = [float(x) for x in _np.group(1).split(',')] if _np else None      # the game's pass marks (the simulator applies them only when asked: params need_par)
_nb = re.search(r'RULE\.needParBy = \{(.*?)\};', _JS)
NEED_PAR_BY = {k: [float(x) for x in v.split(',')] for k, v in re.findall(r'(\w+): \[(.*?)\]', _nb.group(1))} if _nb else None   # the pass marks by run length
_sbl = re.search(r'RULE\.specBanByLong = \{(.*?)\};', _JS)
SPEC_BAN_LONG = {int(k): re.findall(r"'(\w+)'", v) for k, v in re.findall(r'(\d): \[(.*?)\]', _sbl.group(1))} if _sbl else None


def need_of(np_, length, rnd):
    """The pass mark of a round: np_ a number, a list by round, or {length: list} (path.js needParBy; a length not listed has none)."""
    if not np_:
        return 0.0
    if isinstance(np_, dict):
        np_ = np_.get(length)
        if not np_:
            return 0.0
    return float(np_[min(rnd, len(np_)) - 1]) if isinstance(np_, (list, tuple)) else float(np_)


_sl = re.search(r'RULE.specScaleLong = \{(.*?)\}', _JS)
SPEC_SCALE_LONG = {int(k): float(v) for k, v in re.findall(r'(\d): ([\d.]+)', _sl.group(1))} if _sl else None
_ce = re.search(r'RULE\.clEarly = \[(.*?)\]', _JS)
CL_EARLY = [float(x) for x in _ce.group(1).split(',')] if _ce else None      # rounds 1 to 3: the chance a dealt molecule is a chlorine one
_fc = re.search(r'const FEED_CL = \{(.*?)\};', _JS)
FEED_CL = {int(k): re.findall(r"'([^']+)'", v) for k, v in re.findall(r'(\d): \[(.*?)\]', _fc.group(1))} if _fc else {}
_HETRE = re.compile(r'[^CcOoHh0-9()=#\[\]@+\-/.%:]')
_c = re.search(r'const CASC = \{ step: ([\d.]+), place: (\d+), row: ([\d.]+), mul: false, most: (\d+), old: ([\d.]+) \}', _JS)
CASC = {'step': float(_c.group(1)), 'place': float(_c.group(2)), 'row': float(_c.group(3)), 'most': int(_c.group(4)), 'old': float(_c.group(5))}
_f = re.search(r'const FLAT = \{(.*?)\}', _JS)
FLAT = {k: float(v) for k, v in re.findall(r'(\w+): ([\d.]+)', _f.group(1))} if _f else {}   # ruling AT: flatter chain bonuses
FLAT_POW = [float(os.environ.get('SWEEP_FLAT_POW') or FLAT.get('pow', 1.0))]
_s = re.search(r'const SYN = \{.*?finishExtra: ([\d.]+).*?place: (\d+), row: ([\d.]+) \}', _JS)
SYN = {'finishExtra': float(_s.group(1)), 'place': float(_s.group(2)), 'row': float(_s.group(3))}
SPEC_SCALE = {int(k): float(v) for k, v in re.findall(r'(\d): ([\d.]+)', re.search(r'RULE.specScale = \{(.*?)\}', _JS).group(1))}
SPEC_BAN = re.findall(r"'(\w+)'", re.search(r'RULE.specBan = \[(.*?)\]', _JS).group(1))
ASSAYF = json.loads(re.search(r'const ASSAYF = (\{.*?\});', _JS).group(1))
COIN = {'mark': 1, 'per': 3, 'cap': 2}                     # path.js COIN: a mark pays 1, interest 1 for every 3 held, 2 at most


def nice(q):
    mag = 10 ** max(0, int(math.floor(math.log10(max(10.0, q)))) - 1)
    return max(50, int(math.floor(q / mag + 0.5)) * mag)


def quota_of(rnd, brief, mul=1.0):
    """The number to beat (path.js runQuota): Par of the round, times the assay's factor in rounds 3, 6, 9."""
    f = ASSAYF[brief][min(2, max(0, rnd // 3 - 1))] if brief in ASSAYF else 1.0
    par = PAR[rnd - 1] if rnd <= 9 else PAR[8] * PAR_AFTER ** (rnd - 9)          # path.js parOf
    return nice(par * mul * f)             # mul: the sign (path.js signBar)


SPEC_FAMILY_TIER = {'chain': 0, 'runoff': 0, 'off': 0, 'restraint': 0, 'size': 1, 'makeup': 1, 'shape': 2, 'timing': 2}
SPEC_CLASH = [('growth', 'cut_down'), ('growth', 'finish_smaller'), ('growth', 'lean_turns'), ('off_total', 'pure_water'),
              ('off_total', 'pure_gas'), ('pure_water', 'pure_gas')]
SPEC_RIDER = {'p': 0.25, 'factor': 0.97}
SPEC_REACH = {'plays': 3, 'look': 30}
SPEC_JARS = ['water', 'hydrogen', 'carbon_dioxide', 'acid_fumes', 'ammonia', 'sulfur', 'trimethylamine', 'other']
P_POOL = [0.9, 0.85, 0.8, 0.7, 0.65, 0.6, 0.55, 0.5, 0.5]
ASSAYS = ['scarce', 'short', 'each', 'loose']
LENGTHS = {'bachelor': (3, 1), 'master': (6, 2), 'doctorate': (9, 3), 'postdoc': (12, 4)}   # postdoc: path.js POSTDOC (RULE.postdoc)
TIERS = tuple(float(x) for x in re.search(r'tiers: \[(.*?)\]', _JS).group(1).split(','))    # path.js RULE.tiers
MARKS = (1,) + TIERS
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
    spec_scale=None, spec_ban=None, spec_ban_by=None, uses_free=None,
    het=True,                # RULE.hetCurve: the deal's rising share of molecules with an element past C, H, O
    need_par=None,           # RULE.needPar: a round is cleared only when the yield also passes this share of the number to beat
                             #   (a list by round, the last entry for every later round; None: the spec alone clears a round)
    pair_from=6,             # RULE.pairFrom: two tasks from this round (tiers past the bachelor's)
    spec_ban_long=None,      # RULE.specBanByLong: {round: [spec names not set]} in the runs past the bachelor's
    spec_scale_long=None,    # RULE.specScaleLong: {round: N of the table times this} in the runs past the bachelor's
    spec_shift=None,         # RULE.specShiftLong: {round: change of the spec's target share} for the runs past the bachelor's
    aim_par=False,           # the player counts the yield still missing to the pass mark as part of what it plays for
    par_mul=1.0,             # the number to beat times this (the sign: SIGN.bar for each time it was taken)
    yield_mul=1.0,           # every round's yield times this (the sign: 1.2 for each time it was taken)
    chain_pow=1.0, chain_knee=0, chain_add=False,   # trials of the fourteenth measure (see chain_n); not in the game
    motif_pow=1.0)           # trial: the motif multiplier of a step raised to this; not in the game
DBL_REAGENTS = {'hydrate', 'hydroborate', 'grow', 'reduce', 'hwe', 'dihydroxylation', 'ozonolysis', 'ritter', 'thiolene',
                'cyanohydrin', 'hydroformylation', 'epoxidation', 'finish'}
DBL_REFLEX = {'ring', 'dry', 'flip', 'shift', 'tuck', 'weld', 'snap', 'knit', 'cap', 'ring_far', 'cap_far', 'knit_far', 'weld_far',
              'tuck_far', 'snap_far', 'stitch'}


class Mod:
    """Hooks for a perk or a sigil.  Every method may be left out."""
    name = ''
    in_proof = True     # False: it takes no part when a spec is proved reachable (a creature: the game's proof taps none)

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


def flat(raw):
    """path.js flat(): the yield is the product raised to FLAT.pow, a product of FLAT.pivot staying where it is."""
    g = FLAT_POW[0]
    return raw if g == 1 else FLAT.get('pivot', 4770.0) ** (1 - g) * max(0.0, raw) ** g


def yx(k):
    """path.js yx(): what extra is multiplied by for the yield to be multiplied by k."""
    g = FLAT_POW[0]
    return k if g == 1 else k ** (1.0 / g)


def made(R):
    return int(math.floor(flat((R.bank + R.P * R.Rr) * R.E) + 0.5))


def chain_n(n, p):
    """What step n of a page's chain counts as (path.js chainN): n itself up to CASC.knee, and past it only the power CASC.pow
    of the steps beyond, so a long chain still pays more with every step but no longer by its square."""
    a, k = p['chain_pow'], p['chain_knee']
    if a == 1 or n <= k:
        return float(n)
    return k + (n - k) ** a


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
        self.proof_mods = [m for m in self.mods if getattr(m, 'in_proof', True)]
        self.proofkey = '+'.join(getattr(m, 'name', '') for m in self.proof_mods) + '|' + json.dumps(params or {}, sort_keys=True)
        for m in self.mods:
            m.setup(self)
        self._engs = {}
        self.store = cache if isinstance(cache, MemStore) else (MemStore() if cache is None else MemStore(cache))
        self._segs = {}                 # (smi, reagent, used, rules, co2) -> Seg, this process only (built from the kept parts)
        self._rid = {}                  # a list of held reflexes -> a short name for it in the keys
        self._sites = {}                # (smi, reagent, co2) -> places, this process only (cheap to work out again)
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
        return self.store.get(k)

    def _put(self, k, v):
        self.store.put(k, v)
        return v

    def trim(self):
        for e in self._engs.values():
            if len(e._fire) > 20000:
                e.clear()
        if len(self._segs) > 400000:
            self._segs.clear()
        if len(self._sites) > 400000:
            self._sites.clear()

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
        """One reagent fired on smi and the reflexes that follow, step by step.  None when it is wasted.
        Built from three kept parts, each keyed by the canonical SMILES and shared by every worker through the store:
        the reagent's product (smi, reagent), the reflexes a molecule can do in order (smi), one reflex applied (smi, reflex).
        The per-turn limits (used) only pick among kept answers, so they do not split the store."""
        k = (smi, rid, used, rules, co2)
        v = self._segs.get(k)
        if v is not None:
            return v if v != 0 else None
        far = self.has_far(rules)
        fk = ('F', self.key, smi, rid, co2, far)
        f = self.store.get(fk)
        if f is None:
            self.stats['seg_miss'] += 1
            F.CFG['K'] = self.fold_K
            r = self.eng(co2, far).fire(smi, rid)
            f = (r.smi, r.n, tuple((OFFKEY.get(a, a), b) for a, b in r.off)) if r.acted else 0
            self.store.put(fk, f)
        if f == 0:
            self._segs[k] = 0
            return None
        v = Seg(f[1], f[2], f[0], self.cascade(f[0], used, rules, co2))
        self._segs[k] = v
        return v

    def cands(self, smi, rules):
        """The reflexes that fit smi, in the engine's order (engine._next_self: priority, nearest pair, place in the list)."""
        rid_ = self._rid.get(rules)
        if rid_ is None:
            rid_ = self._rid[rules] = hashlib.blake2b(','.join(rules).encode(), digest_size=5).hexdigest()
        k = ('x', self.key, smi, rid_)
        v = self.store.get(k)
        if v is None:
            self.stats['cand_miss'] += 1
            F.CFG['K'] = self.fold_K
            mol = parse(smi)
            sr = self.self_rules
            c = []
            for ri, rn in enumerate(rules):
                sites = sr[rn].find(mol)
                if sites:
                    c.append(((getattr(sr[rn], 'prio', 1), sites[0].dist, ri), rn))
            c.sort(key=lambda t: t[0])
            v = tuple(rn for _, rn in c)
            self.store.put(k, v)
        return v

    def step(self, smi, rn):
        """One reflex at its first place that gives a valid molecule: (smiles after, what comes off), or 0."""
        k = ('a', self.key, smi, rn)
        v = self.store.get(k)
        if v is None:
            self.stats['step_miss'] += 1
            F.CFG['K'] = self.fold_K
            mol = parse(smi)
            rule = self.self_rules[rn]
            v = 0
            for st in rule.find(mol):
                r = rule.apply(mol, st)
                if r is not None:
                    v = (Chem.MolToSmiles(r[0]), tuple((OFFKEY.get(a, a), b) for a, b in rule.off.items()))
                    break
            self.store.put(k, v)
        return v

    def cascade(self, smi, used, rules, co2, budget=None):
        sr = self.self_rules
        cap = budget or self.p['most']
        cnt = dict(used)
        steps = []
        while len(steps) < cap:
            hit = None
            for rn in self.cands(smi, rules):
                lim = getattr(sr[rn], 'per_turn', None)
                if lim is not None and cnt.get(rn, 0) >= lim:
                    continue
                r = self.step(smi, rn)
                if r != 0:
                    hit = (rn, r)
                    break
            if hit is None:
                break
            rn, (smi, off) = hit
            cnt[rn] = cnt.get(rn, 0) + 1
            steps.append((rn, smi, off))
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
                mol = parse(_strip(self.reopen(smi)))
                v = 1.0
                for name in self.p['motif_open']:      # only the open motifs are counted (traits.counts counts all twelve)
                    lv = TR.MOTIFS[name].fn(mol)
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
        k = (smi, rid, co2)
        v = self._sites.get(k)
        if v is None:
            mol = parse(smi)
            v = self._sites[k] = tuple(len(mol.GetSubstructMatches(st.query, maxMatches=40)) for st in self.eng(co2).reactions[rid].steps if hasattr(st, 'query'))
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
            cn = chain_n(R.casc, p)
            if R.casc > 1:
                f = 1 + (cn - 1) * w
                if p['chain_add']:           # CASC.add: a step's places are its own count, not the product of the counts before it
                    R.P += h * (f - 1)
                else:
                    R.P += h * (f - 1)
                    h *= f
            R.E += p['step'] * cn * w * lx
        if p['motifs']:
            m = self.mult(smi) ** p['motif_pow']
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
                m = self.mult(sg.smi1) ** p['motif_pow']
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

    def run_line(self, R, line, memo=None):
        """Fire a line on a copy of the round.  Returns (round after, page record).
        memo: a dict kept for one choice; lines that begin the same way share the work of the circles they share."""
        n = len(line)
        nc = max(n, self.p['circles'])
        i = 0
        R2 = None
        if memo is not None:
            line = tuple(line)
            i = n
            st = None
            while i > 0:
                st = memo.get((nc, line[:i]))
                if st is not None:
                    break
                i -= 1
            if i == n and st is not None:
                return st
            if i > 0:
                R2 = st[0].copy()
                pg = st[1]
                page = {'circ': [list(c) for c in pg['circ']], 'chain': pg['chain'][:], 'off': dict(pg['off']), 'last_on': pg['last_on']}
        if R2 is None:
            R2 = R.copy()
            page = {'circ': [], 'chain': [], 'off': {}, 'last_on': False}
            R2.limcnt = ()
        while i < n:
            if R2.over:
                break
            self.play_circle(R2, line[i], page, i, nc)
            i += 1
            if memo is not None and i < n:
                page['smi'] = R2.smi
                memo[(nc, line[:i])] = (R2, page)
                R2 = R2.copy()
                page = {'circ': [list(c) for c in page['circ']], 'chain': page['chain'][:], 'off': dict(page['off']), 'last_on': page['last_on']}
        page['smi'] = R2.smi
        if memo is not None:
            memo[(nc, line)] = (R2, page)
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

    def need_abs(self, R):
        """The yield the round must reach to be cleared (RULE.needPar), 0 when there is none; before the sign's lift."""
        np_ = self.p.get('need_par')
        if not np_ or R.tierNo == 1:        # the bachelor's keeps the task alone (path.js needParB is null)
            return 0.0
        nd = need_of(np_, (getattr(self, 'run', None) or {}).get('length'), R.rnd)
        return nd * quota_of(R.rnd, R.brief, self.p.get('par_mul') or 1.0) / (self.p.get('yield_mul') or 1.0)

    def value(self, R):
        """What a player compares: spec progress (and, with aim_par, the share of the pass mark reached), then yield."""
        pr = self.prog(R, R.rec) if R.spec else 0.0
        if self.real and self.p.get('aim_par') and R.spec:
            nd = self.need_abs(R)
            if nd > 0:
                pr = round(pr + min(1.0, made(R) / nd), 9)
        return (pr, made(R))

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
        if R.x.get('burnt'):
            return float(len(R.spec))        # brimstone: the task was burned, it counts as met
        t = 0.0
        for name, n in R.spec:
            t += min(self.spec_value(name, R.f0, pages), n) / float(n)
        return round(t, 9)

    def met(self, R):
        if R.x.get('burnt'):
            return bool(R.spec)
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

    def choose(self, R, hand, look, rng, next_hand=None, plan=False, peek=False, mrng=None):
        """path.js specLine: spec progress first, yield to break a tie, a further tie at random.  look None: every line."""
        lines = self.lines(R, hand)
        if not lines:
            return (), None, None
        self.store.keep = R.page <= self.p.get('keep_pages', 2)     # the chemistry of the last page is rarely met again: not logged
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
        memo = {}
        need_abs = 0.0
        if self.real and self.p.get('aim_par') and R.spec:
            need_abs = self.need_abs(R)
        for l in lines:
            R2, page = self.run_line(R, l, memo)
            pr = self.prog(R, R.rec + [self.page_rec(page)]) if R.spec else 0.0
            if need_abs > 0:
                pr = round(pr + min(1.0, made(R2) / need_abs), 9)
            v = (pr, made(R2))
            if peek:
                if plain is None or v > plain[0]:
                    plain = (v, l)
                if not R2.over:
                    R2.rec = R.rec + [self.page_rec(page)]
                    for m in self.mods:
                        w = m.peek(self, R2, mrng or rng)
                        if w is not None and (w > v or getattr(m, 'peek_force', False)):
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
                memo2 = {}
                for l2 in self.lines(R3, next_hand):
                    R4, pg2 = self.run_line(R3, l2, memo2)
                    w = (self.prog(R3, R3.rec + [self.page_rec(pg2)]), made(R4))
                    if need_abs > 0:
                        w = (round(w[0] + min(1.0, w[1] / need_abs), 9), w[1])
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


def _only_rises(spec):
    """True when every part of the spec, once met on a page, stays met to the end of the round (a gain, a loss, a count)."""
    for name, _n in spec or ():
        d = SPEC_TABLE[name]
        if d['read'] == 'e':
            if d['key'] in ('pure_water', 'pure_gas'):
                return False
        elif d['mode'] not in ('gain', 'loss', 'abs', 'range'):
            return False
    return bool(spec)


def play_round(G, smi, rnd, rack, player, rng, spec=None, brief='plain', tierNo=1, log=None, quit_met=False):
    """One round.  Returns the Round at its end (R.x['total'] the yield, R.x['met'] the spec)."""
    pol = PLAYERS[player]
    R = G.begin(smi, rnd, rack, brief, spec, tierNo)
    mods = G.mods if G.real else G.proof_mods
    mrng = random.Random(rng.random())       # what a perk or sigil rolls never moves the deal: with and without it the hands are the same
    for m in mods:
        m.round_start(G, R, mrng)
    if mods:
        R.f0 = G.feat(R.smi)
        R.seen = frozenset([R.smi])
    nh = G.p['hand']
    hrng = random.Random(rng.random())       # the hands have their own dice too: a tie broken another way does not move the next deal
    hand = deal_hand(rack, R, hrng, nh + (G.p.get('hand_first') or 0))       # hand_first: more reagents in the first hand of a round only (the carousel)
    steps_page, kinds, dealt, usedc = [], Counter(), Counter(), Counter()
    while True:
        dealt.update(hand)
        nxt = deal_hand(rack, R, hrng, nh) if R.page < R.pages else None
        forced = None
        for m in mods:
            f = m.before_page(G, R, mrng, player, hand)
            if f:
                forced = f
        if forced:
            R2, page = G.run_line(R, forced)
            line = tuple(forced)
        else:
            line, R2, page = G.choose(R, hand, pol['look'], rng, nxt, pol['plan'], peek=(player in ('median', 'planner', 'greedy')), mrng=mrng)
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
        for m in mods:
            if not R.over:
                m.after_page(G, R, mrng, player)
        steps_page.append(len(R.rec[-1]['chain']))
        kinds.update(R.rec[-1]['chain'])
        if R.over or R.page >= R.pages:
            break
        if quit_met and G.met(R):
            break                        # a proof: the spec is met and cannot be lost again, the later pages change nothing
        G.turn(R)
        hand = nxt
    R.x['total'] = G.end(R)
    R.x['met'] = G.met(R) if R.spec else None
    R.x['prog'] = round(G.prog(R, R.rec) / max(1, len(R.spec)), 4) if R.spec else None      # share of the spec reached, 0 to 1
    R.x['steps'] = steps_page
    R.x['close_pages'] = sum(1 for pg in R.rec if 'close' in pg['chain'])       # hands in which chlorine's reflex fired
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
    if tierNo != 1 and p.get('spec_scale_long'):
        scale = {int(k): float(v) for k, v in p['spec_scale_long'].items()}      # RULE.specScaleLong: N times this, by round
    ban = (p['spec_ban'] if p['spec_ban'] is not None else SPEC_BAN) if tierNo == 1 else ()
    if tierNo == 1 and (p.get('spec_ban_by') if p.get('spec_ban_by') is not None else SPEC_BAN_BY):     # RULE.specBanBy
        bb = p['spec_ban_by'] if p.get('spec_ban_by') is not None else SPEC_BAN_BY
        ban = tuple(ban) + tuple(bb.get(rnd, bb.get(str(rnd), ())))
    if tierNo != 1 and p.get('spec_ban_long'):                                  # RULE.specBanByLong: the same in the runs past the bachelor's
        bb = p['spec_ban_long']
        ban = tuple(ban) + tuple(bb.get(rnd, bb.get(str(rnd), ())))
    rnd_true, rnd = rnd, max(1, min(9, rnd))          # rounds past nine use round nine's specs (path.js POSTDOC)
    target = SPEC_TARGET[max(1, min(9, rnd))]
    if tierNo != 1 and p.get('spec_shift'):
        sh = p['spec_shift']
        target += float(sh.get(rnd, sh.get(str(rnd), 0)))
    target = max(0.05, min(0.99, target))
    pair = rnd >= (p.get('pair_from') or 6)
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
        if best and (tierNo == 1 or scale):
            best = max(1, int(round(best * scale.get(rnd, 1) + 1e-9)))
        return min(best, cap)

    def reach(parts):
        # the proof that an aiming player reaches it in up to three plays.  The answer for one (molecule, rack, spec) is kept:
        # a later run with the same three reuses the draw, which leaves the rates as they are and saves most of the work.
        if not proof:
            return 1
        ck = ('p', G.key, G.proofkey, G.extra_key, smi, rnd, tuple(rack), tuple(parts), brief, tierNo, co2)
        v = G._get(ck)
        if v is None:
            v = 0
            G.real = False
            G.stats['proofs'] += 1
            # the proof has its own dice: a run is the same whether or not the proof was kept, and the dice do not depend on
            # the perks and sigils held, so a run with one and the run without meet the same proof where the chemistry is the same
            prng = random.Random(repr(('p', smi, rnd, tuple(rack), tuple(parts), brief, tierNo, co2)))
            qm = _only_rises(parts)
            try:
                for k in range(SPEC_REACH['plays']):
                    if play_round(G, smi, rnd, rack, 'aim30', prng, spec=parts, brief=brief, tierNo=tierNo, quit_met=qm).x['met']:
                        v = k + 1
                        break
            finally:
                G.real = True
            G.store.keep = True
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

def deal_two(rnd, rng, extra=None, het=True, cl_early=True):
    """Two different molecules of the round: the pool with the game's chance, else the bank (path.js feedsFor, P_POOL).
    RULE.hetCurve (on in the game): each molecule is first decided to hold an element other than C, H, O or not, with the
    round's share, and is then drawn from the molecules of the round that fit.  Rounds past nine deal round nine's.
    extra(rnd, rng) may return a SMILES to deal in place of the first (the rarity curve of sweep_elements.py)."""
    r9 = max(1, min(9, rnd))
    cv = het if isinstance(het, (list, tuple)) else HET_CURVE          # a list: another curve than the game's (RULE.hetCurve)
    hc = cv[min(len(cv), r9) - 1] if (het and cv) else None
    out = []
    cl = CL_EARLY[rnd - 1] if (cl_early and CL_EARLY and 1 <= rnd <= len(CL_EARLY) and FEED_CL.get(rnd)) else 0
    while len(out) < 2:
        if cl > 0 and rng.random() < cl:           # path.js RULE.clEarly: one of the round's chlorine molecules
            left = [x for x in FEED_CL[rnd] if x not in out]
            if left:
                out.append(rng.choice(left))
                continue
        use_pool = rng.random() < P_POOL[r9 - 1]
        pl, bk = FEED_POOL[r9], FEED_BANK[r9]
        if hc is not None:
            want = rng.random() < hc
            pl2 = [x for x in pl if bool(_HETRE.search(x)) == want and x not in out]
            bk2 = [x for x in bk if bool(_HETRE.search(x)) == want and x not in out]
            if pl2 or bk2:
                pl, bk = pl2, bk2
        src = pl if ((use_pool or not bk) and pl) else (bk or pl)
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
    tierNo = min(tierNo, 3)             # a postdoc is a doctorate that goes on: rounds 1 to 9 are the same run
    rng0 = random.Random('run/%s' % seed)
    assay = ASSAYS[:]
    rng0.shuffle(assay)
    hist = []
    out = {'seed': seed, 'length': length, 'player': player, 'rounds': [], 'cleared': 0, 'won': False}
    alive = True
    run = G.run = {'gold': 0, 'spent': 0, 'uses': 0, 'spec_up': 1.0, 'debt': 0, 'player': player, 'n_rounds': n_rounds, 'at': [], 'length': length}
    G.extra_key = ''
    for m in G.mods:
        m.run_start(G, run)
    if last:
        n_rounds = last - first + 1
    for r in range(first, (last or n_rounds) + 1):
        rng = random.Random('run/%s/%d' % (seed, r))
        rk = tuple(racks[r]) if racks else tuple(rack)
        brief = assay[(r // 3 - 1) % 3] if r % 3 == 0 else 'plain'
        het = G.p.get('het', True)
        if tierNo == 1 and het is True and G.p.get('het_b', HET_CURVE_B):
            het = G.p.get('het_b', HET_CURVE_B)
        two = deal_two(r, rng, extra, het, G.p.get('cl_early', True))
        opts = [(s, spec_pick(G, s, r, rk, random.Random('run/%s/%d/spec%d' % (seed, r, i)), tierNo, hist, brief)) for i, s in enumerate(two)]
        if PLAYERS[player]['pick'] == 'random':
            smi, sp = opts[rng.randrange(2)]
        else:
            key = lambda o: (0 if o[1]['proof'] == 0 else 4 - o[1]['proof'])
            smi, sp = opts[0] if key(opts[0]) >= key(opts[1]) else opts[1]
        hist.append(sp['families'])
        if run['spec_up'] > 1.0:
            sp = dict(sp, parts=[(nm, int(math.ceil(n * run['spec_up'] - 1e-9))) for nm, n in sp['parts']])
        run['round'] = r
        run['rack'] = rk
        lg = [] if logs else None
        R = play_round(G, smi, r, rk, player, rng, spec=sp['parts'], brief=brief, tierNo=tierNo, log=lg)
        total = R.x['total']
        if G.p.get('yield_mul', 1.0) != 1.0:
            total = int(round(total * G.p['yield_mul']))
        par = quota_of(r, brief, G.p.get('par_mul') or 1.0)
        np_ = G.p.get('need_par')
        need = need_of(np_, length, r) if (np_ and tierNo != 1) else 0.0
        ok = bool(R.x['met']) and total >= need * par
        earned = 0
        if total >= par:
            earned = COIN['mark'] * sum(1 for k in TIERS if total >= nice(par * k)) + min(COIN['cap'], run['gold'] // COIN['per'])
        for m in G.mods:
            earned = m.round_end(G, R, run, earned)
        run['gold'] += earned
        row = {'r': r, 'mol': smi, 'brief': brief, 'spec': sp['parts'], 'fell': sp['fell'], 'met': bool(R.x['met']), 'ok': ok, 'total': total,
               'par': par, 'marks': sum(1 for k in MARKS if total >= nice(par * k)), 'gold': run['gold'], 'steps': R.x['steps'], 'kinds': R.x['kinds'],
               'lines': R.x.get('lines', ()), 'dealt': R.x['dealt'], 'used': R.x['used'], 'alive': alive, 'end': R.smi, 'tap': R.x.get('tap', 0), 'prog': R.x.get('prog'), 'close_pages': R.x.get('close_pages', 0),
               'dec': (R.x.get('dec_changed', 0), R.x.get('dec_pages', 0))}
        if logs:
            row['log'] = lg
        out['rounds'].append(row)
        if row['ok'] and alive:
            out['cleared'] += 1
        if not row['ok']:
            alive = False
            if stop:
                break
        G.trim()
        G.store.keep = True
        G.store.flush()
    out['won'] = out['cleared'] >= n_rounds
    for m in G.mods:
        out['won'] = m.run_won(G, run, out['won'])
    out['gold'], out['spent'], out['uses'], out['at'] = run['gold'], run['spent'], run['uses'], run['at']
    return out


# ---------------------------------------------------------------------------------------------------------------
# the store shared by every worker and every later run
# ---------------------------------------------------------------------------------------------------------------
# Three layers.  (1) A dict in the worker.  (2) One append-only log file per worker: a worker writes what it learns to its own
# log every few seconds and reads the other workers' logs every few seconds, so a molecule worked out by one is known to all
# within seconds and nobody waits on a lock.  (3) One sqlite file, read by every worker on a miss and written by ONE process
# only (the parent of the pool, sweep_run.run), which folds the logs into it in key order.  A first version let all twelve
# workers write the sqlite file: random-key inserts dirtied a page each, the write-ahead file grew to 690 MB in fifteen
# minutes and the workers spent 97 percent of their time waiting.

class MemStore:
    """The store of one process (tests, a cold bench)."""
    keep = True

    def __init__(self, d=None):
        self.mem = d if d is not None else {}

    def get(self, k):
        return self.mem.get(k)

    def put(self, k, v):
        self.mem[k] = v

    def flush(self, force=False):
        return 0


def _hkey(k):
    return hashlib.blake2b(repr(k).encode(), digest_size=12).digest()


CACHE_DIR = os.path.join(SWEEP_DIR, 'cache')


def _read_frames(fh, pos):
    """Whole frames of a log from pos: [(key, value), ...] lists, and the new position.  A frame half written is left."""
    out = []
    fh.seek(0, 2)
    end = fh.tell()
    while pos + 8 <= end:
        fh.seek(pos)
        n = int.from_bytes(fh.read(8), 'little')
        if pos + 8 + n > end:
            break
        out.append(fh.read(n))
        pos += 8 + n
    return out, pos


class Store(MemStore):
    LIMIT = 1000000
    EVERY = 6.0

    def __init__(self, d=None):
        MemStore.__init__(self)
        self.dir = d or CACHE_DIR
        os.makedirs(self.dir, exist_ok=True)
        self.path = os.path.join(self.dir, 'store.sqlite')
        self.db = None
        self.db_tried = 0.0
        self.pend = []
        self.last = time.time()
        self.last_tail = 0.0
        self.mine = os.path.join(self.dir, 'log_%d_%d.bin' % (os.getpid(), int(time.time() * 1000) % 100000000))
        self.fh = None
        self.pos = {}                   # other workers' logs: file name -> bytes read
        self.keep = True                # False: what is learned now stays in this process (deep pages are rarely met again)
        self.disk_hits = self.log_in = 0

    def _base(self):
        if self.db is None and time.time() - self.db_tried > 20:
            self.db_tried = time.time()
            if os.path.exists(self.path):
                try:
                    self.db = sqlite3.connect('file:%s?mode=ro' % self.path.replace('\\', '/'), uri=True, timeout=30, isolation_level=None)
                    self.db.execute('PRAGMA cache_size=-100000')
                except Exception:
                    self.db = None
        return self.db

    def get(self, k):
        v = self.mem.get(k)
        if v is None:
            db = self._base()
            if db is not None:
                try:
                    row = db.execute('SELECT v FROM kv WHERE k=?', (_hkey(k),)).fetchone()
                except sqlite3.Error:
                    row = None
                if row is not None:
                    v = pickle.loads(row[0])
                    self.disk_hits += 1
                    self.mem[k] = v
        return v

    def put(self, k, v):
        self.mem[k] = v
        if self.keep:
            self.pend.append((k, v))

    def flush(self, force=False):
        """Write what is new to this worker's log, read what the others wrote.  Called often; does its work every few seconds."""
        now = time.time()
        n = 0
        if self.pend and (force or now - self.last >= self.EVERY or len(self.pend) >= 20000):
            blob = pickle.dumps(self.pend, pickle.HIGHEST_PROTOCOL)
            if self.fh is None:
                self.fh = open(self.mine, 'ab')
            self.fh.write(len(blob).to_bytes(8, 'little') + blob)
            self.fh.flush()
            n = len(self.pend)
            self.pend = []
            self.last = now
        if now - self.last_tail >= self.EVERY:
            self.last_tail = now
            self.tail()
        return n

    def tail(self):
        if len(self.mem) > self.LIMIT:
            self.mem.clear()                         # the folded part is still in the sqlite file
        me = os.path.basename(self.mine)
        try:
            names = [f for f in os.listdir(self.dir) if f.startswith('log_') and f.endswith('.bin') and f != me]
        except OSError:
            return
        mem = self.mem
        for f in names:
            try:
                with open(os.path.join(self.dir, f), 'rb') as fh:
                    frames, self.pos[f] = _read_frames(fh, self.pos.get(f, 0))
            except OSError:
                continue
            for blob in frames:
                try:
                    for k, v in pickle.loads(blob):
                        mem[k] = v
                        self.log_in += 1
                except Exception:
                    pass


_STORE = [None]


def shared_store():
    if _STORE[0] is None:
        _STORE[0] = Store()
    return _STORE[0]


class Folder:
    """The one writer of the sqlite file: folds the workers' logs into it, in key order, in big transactions."""

    def __init__(self, d=None):
        self.dir = d or CACHE_DIR
        os.makedirs(self.dir, exist_ok=True)
        self.db = sqlite3.connect(os.path.join(self.dir, 'store.sqlite'), timeout=120, isolation_level=None)
        self.db.execute('PRAGMA journal_mode=WAL')
        self.db.execute('PRAGMA synchronous=OFF')
        self.db.execute('PRAGMA cache_size=-400000')
        self.db.execute('CREATE TABLE IF NOT EXISTS kv (k BLOB PRIMARY KEY, v BLOB) WITHOUT ROWID')
        self.pos = {}
        self.rows = 0

    def fold(self, final=False):
        """Read the new part of every log and put it in the file.  final: the workers are gone, so the logs are removed."""
        names = [f for f in os.listdir(self.dir) if f.startswith('log_') and f.endswith('.bin')]
        batch = {}
        for f in names:
            try:
                with open(os.path.join(self.dir, f), 'rb') as fh:
                    frames, self.pos[f] = _read_frames(fh, self.pos.get(f, 0))
            except OSError:
                continue
            for blob in frames:
                try:
                    for k, v in pickle.loads(blob):
                        batch[_hkey(k)] = pickle.dumps(v, pickle.HIGHEST_PROTOCOL)
                except Exception:
                    pass
        if batch:
            rows = sorted(batch.items())
            self.db.execute('BEGIN IMMEDIATE')
            self.db.executemany('INSERT OR IGNORE INTO kv VALUES (?,?)', rows)
            self.db.execute('COMMIT')
            self.rows += len(rows)
        if final:
            try:
                self.db.execute('PRAGMA wal_checkpoint(TRUNCATE)')
            except sqlite3.Error:
                pass
            for f in names:
                try:
                    os.remove(os.path.join(self.dir, f))
                    self.pos.pop(f, None)
                except OSError:
                    pass
        return len(batch)

    def count(self):
        return self.db.execute('SELECT count(*) FROM kv').fetchone()[0]

    def close(self):
        self.db.close()


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
