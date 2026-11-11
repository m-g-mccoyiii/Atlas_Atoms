"""Building blocks for reactions and self-reactions on RDKit molecules.

A molecule is carried around as a canonical SMILES string (hydrogens implicit).  Every function here takes an RDKit Mol
that came from MolFromSmiles and returns a new canonical Mol; nothing is changed in place.

  SmartsStep   one reaction SMARTS, applied at every place it fits (one match at a time, to the end).
  SelfRule     something the molecule does by itself: find(mol) lists the places, apply(mol, site) does one.
  GraphRule    a SelfRule written as a graph query plus an edit of the RDKit graph (pairs of groups at a carbon distance).
  Reaction     a named reaction the player fires: a list of steps run in order, each at every place it fits.

Distances are always bonds along carbon atoms only ("3 or 4 carbons apart"), the shortest way round.
"""
import re
from collections import Counter
from functools import lru_cache

from rdkit import Chem, RDLogger
from rdkit.Chem import AllChem

RDLogger.DisableLog('rdApp.*')

# ---------------------------------------------------------------------------------------------------------------
# molecules as strings
# ---------------------------------------------------------------------------------------------------------------


@lru_cache(maxsize=30000)
def parse(smi):
    m = Chem.MolFromSmiles(smi)
    if m is None:
        raise ValueError('bad SMILES: ' + smi)
    return m


def canon(smi):
    return Chem.MolToSmiles(parse(smi))


def heavy(smi):
    return parse(smi).GetNumHeavyAtoms()


def comp(mol):
    """Atom counts of a molecule with its implicit hydrogens: Counter({'C': 3, 'H': 8, ...})."""
    c = Counter()
    for a in mol.GetAtoms():
        c[a.GetSymbol()] += 1
        c['H'] += a.GetTotalNumHs()
    return c


def formula(s):
    """'H2O' -> Counter({'H': 2, 'O': 1}); '' -> empty."""
    c = Counter()
    for el, n in re.findall(r'([A-Z][a-z]?)(\d*)', s or ''):
        c[el] += int(n) if n else 1
    return c


def finish(rw):
    """Sanitize an edited graph and return it as a canonical Mol (a fresh parse), or None if it is not valid chemistry."""
    try:
        m = rw.GetMol() if hasattr(rw, 'GetMol') else rw
        Chem.SanitizeMol(m)
        smi = Chem.MolToSmiles(m)
        return Chem.MolFromSmiles(smi)
    except Exception:
        return None


# ---------------------------------------------------------------------------------------------------------------
# graph queries
# ---------------------------------------------------------------------------------------------------------------


def nbr(mol, i):
    return [a.GetIdx() for a in mol.GetAtomWithIdx(i).GetNeighbors()]


def cnbr(mol, i):
    return [a.GetIdx() for a in mol.GetAtomWithIdx(i).GetNeighbors() if a.GetAtomicNum() == 6]


def hs(mol, i):
    return mol.GetAtomWithIdx(i).GetTotalNumHs()


def cdist(mol, src, maxd=99):
    """Bonds from src to every carbon reached along carbon atoms only: {idx: d}."""
    dist = {src: 0}
    q = [src]
    k = 0
    while k < len(q):
        u = q[k]
        k += 1
        d = dist[u]
        if d >= maxd:
            continue
        for v in cnbr(mol, u):
            if v not in dist:
                dist[v] = d + 1
                q.append(v)
    return dist


def cpath(mol, src, dst, maxd=99):
    """A shortest path of carbon atoms from src to dst (list of idx), neighbours taken in index order, or None."""
    prev = {src: None}
    dist = {src: 0}
    q = [src]
    k = 0
    while k < len(q):
        u = q[k]
        k += 1
        if u == dst:
            break
        if dist[u] >= maxd:
            continue
        for v in sorted(cnbr(mol, u)):
            if v not in prev:
                prev[v] = u
                dist[v] = dist[u] + 1
                q.append(v)
    if dst not in prev:
        return None
    p = []
    u = dst
    while u is not None:
        p.append(u)
        u = prev[u]
    return p[::-1]


def in_ring(mol, i):
    return mol.GetRingInfo().NumAtomRings(i) > 0


def bond_ring_size(mol, a, b):
    """Size of the smallest ring that holds the bond a-b, 0 if none."""
    bd = mol.GetBondBetweenAtoms(a, b)
    return mol.GetRingInfo().MinBondRingSize(bd.GetIdx()) if bd is not None else 0


def end_dist(mol, c):
    """C-C bonds from carbon c to the nearest carbon with at most one carbon neighbour (the end of a chain)."""
    seen = {c}
    layer = [c]
    d = 0
    while layer:
        nxt = []
        for a in layer:
            cn = cnbr(mol, a)
            if len(cn) <= 1:
                return d
            for x in cn:
                if x not in seen:
                    seen.add(x)
                    nxt.append(x)
        layer = nxt
        d += 1
    return d


def is_sp3(mol, i):
    return all(b.GetBondTypeAsDouble() == 1.0 for b in mol.GetAtomWithIdx(i).GetBonds())


def hetero(mol, i):
    """Has a neighbour that is neither carbon nor hydrogen."""
    return any(mol.GetAtomWithIdx(j).GetAtomicNum() != 6 for j in nbr(mol, i))


def lactol_ring_ok(mol, a, b, limit=8):
    """The rule of the game's zip: when either end sits in a ring, the way from one carbon to the other may run along at
    most one bond that lies in a ring of `limit` atoms or fewer (small rings come out side by side, never bridged)."""
    if not (in_ring(mol, a) or in_ring(mol, b)):
        return True
    p = cpath(mol, a, b, 99)
    if not p:
        return False
    shared = 0
    for i in range(len(p) - 1):
        r = bond_ring_size(mol, p[i], p[i + 1])
        if r and r <= limit:
            shared += 1
    return shared <= 1


_PAT = {}


def pat(sma):
    q = _PAT.get(sma)
    if q is None:
        q = Chem.MolFromSmarts(sma)
        if q is None:
            raise ValueError('bad SMARTS: ' + sma)
        _PAT[sma] = q
    return q


def matches(mol, sma):
    """Every match of a SMARTS with atom maps, as dicts {map number: atom idx}, in the molecule's atom order."""
    q = pat(sma)
    maps = [a.GetAtomMapNum() for a in q.GetAtoms()]
    out = []
    for m in mol.GetSubstructMatches(q, uniquify=False, maxMatches=2000):
        out.append({mp: ix for mp, ix in zip(maps, m) if mp})
    return out


# ---------------------------------------------------------------------------------------------------------------
# what a reaction did, read off the product that RunReactants gives
# ---------------------------------------------------------------------------------------------------------------


class Cand:
    """One product of RunReactants, with what changed told in terms of the atoms of the reactant."""

    def __init__(self, mol, prods):
        self.mol = mol
        self.prods = prods
        self._origin = None

    @property
    def origin(self):
        """[{product atom idx: reactant atom idx}] for each product molecule; atoms the reaction made are absent."""
        if self._origin is None:
            self._origin = []
            for pm in self.prods:
                o = {}
                for a in pm.GetAtoms():
                    if a.HasProp('react_atom_idx'):
                        o[a.GetIdx()] = a.GetIntProp('react_atom_idx')
                self._origin.append(o)
        return self._origin

    @property
    def removed(self):
        kept = set()
        for o in self.origin:
            kept.update(o.values())
        return set(range(self.mol.GetNumAtoms())) - kept

    @property
    def gained(self):
        """Reactant atoms that now carry a new atom the reaction made."""
        out = set()
        for pm, o in zip(self.prods, self.origin):
            for a in pm.GetAtoms():
                if a.GetIdx() in o:
                    if any(n.GetIdx() not in o for n in a.GetNeighbors()):
                        out.add(o[a.GetIdx()])
        return out

    @property
    def new_double(self):
        """Pairs (i, j) of reactant atoms joined by a double bond now that were joined by a single bond before."""
        out = []
        for pm, o in zip(self.prods, self.origin):
            for b in pm.GetBonds():
                i, j = b.GetBeginAtomIdx(), b.GetEndAtomIdx()
                if i in o and j in o and b.GetBondTypeAsDouble() == 2.0:
                    ob = self.mol.GetBondBetweenAtoms(o[i], o[j])
                    if ob is not None and ob.GetBondTypeAsDouble() == 1.0:
                        out.append((o[i], o[j]))
        return out


# ---------------------------------------------------------------------------------------------------------------
# a step: one reaction SMARTS applied everywhere it fits
# ---------------------------------------------------------------------------------------------------------------


class StepResult:
    __slots__ = ('mol', 'n', 'off', 'added', 'lost')

    def __init__(self, mol, n=0, off=None, added=None, lost=None):
        self.mol = mol
        self.n = n
        self.off = off if off is not None else Counter()
        self.added = added if added is not None else Counter()
        self.lost = lost if lost is not None else Counter()


class SmartsStep:
    """`smarts` is a reaction SMARTS with one reactant.  It is applied at one place, the product is sanitized and
    canonicalised, and that is repeated on the product until it fits nowhere: so it acts everywhere it fits, one place at
    a time, in a fixed order (the molecule's canonical atom order).  If the product is several pieces (a cut) the piece with
    the most heavy atoms stays (ties: the larger canonical SMILES) and the others are counted as 'piece' and as lost atoms.

    adds / loses : formulas of what the reagent brings and what leaves, per place, used to check the atoms balance.
    off          : {jar: count per place} what comes off the molecule, for the jars (water, hydrogen, ...).
    choose       : function(mol, Cand) -> sortable key; among all the ways it could act, the smallest key goes first.
                   Used where SMARTS alone cannot say which of two carbons is meant (the tie rules).
    """

    def __init__(self, smarts, adds='', loses='', off=None, choose=None, max_sites=64):
        self.smarts = smarts
        self.rxn = AllChem.ReactionFromSmarts(smarts)
        if self.rxn.GetNumReactantTemplates() != 1:
            raise ValueError('one reactant only: ' + smarts)
        self.adds = formula(adds)
        self.loses = formula(loses)
        self.off = Counter(off or {})
        self.choose = choose
        self.max_sites = max_sites
        self.query = pat(smarts.split('>>')[0])

    def has_site(self, mol):
        return mol.HasSubstructMatch(self.query)

    def _finish(self, prods):
        """Sanitize a product (several pieces if it was cut); returns (main Mol, lost-atom Counter, pieces dropped) or None."""
        try:
            if len(prods) == 1:
                pm = prods[0]
                Chem.SanitizeMol(pm)
                smi = Chem.MolToSmiles(pm)
                if '.' not in smi:
                    main = Chem.MolFromSmiles(smi)
                    return (main, Counter(), 0) if main is not None else None
                frags = smi.split('.')
            else:
                frags = []
                for pm in prods:
                    Chem.SanitizeMol(pm)
                    frags.extend(Chem.MolToSmiles(pm).split('.'))
        except Exception:
            return None
        parsed = []
        for s in frags:
            fm = Chem.MolFromSmiles(s)
            if fm is None:
                return None
            parsed.append((fm.GetNumHeavyAtoms(), s, fm))
        parsed.sort(key=lambda t: (t[0], t[1]), reverse=True)
        main = parsed[0][2]
        dropped = Counter()
        for _, _, fm in parsed[1:]:
            dropped.update(comp(fm))
        return main, dropped, len(parsed) - 1

    def _one(self, mol):
        if not mol.HasSubstructMatch(self.query):
            return None
        if self.choose is None:
            prods = self.rxn.RunReactants((mol,), maxProducts=1)
            for p in prods:
                r = self._finish(p)
                if r:
                    return r
            if prods:  # the first way did not sanitize; try the others
                for p in self.rxn.RunReactants((mol,), maxProducts=200):
                    r = self._finish(p)
                    if r:
                        return r
            return None
        best = None
        for p in self.rxn.RunReactants((mol,), maxProducts=400):
            key = tuple(self.choose(mol, Cand(mol, p)))
            if best is not None and key > best[0]:
                continue
            r = self._finish(p)
            if not r:
                continue
            full = key + (Chem.MolToSmiles(r[0]),)
            if best is None or full < best[1]:
                best = (key, full, r)
        return best[2] if best else None

    def apply_all(self, mol):
        n = 0
        off, added, lost = Counter(), Counter(), Counter()
        for _ in range(self.max_sites):
            r = self._one(mol)
            if r is None:
                break
            mol, dropped, n_drop = r
            n += 1
            for k, v in self.off.items():
                off[k] += v
            if n_drop:
                off['piece'] += n_drop
            added.update(self.adds)
            lost.update(self.loses)
            lost.update(dropped)
        return StepResult(mol, n, off, added, lost)


# ---------------------------------------------------------------------------------------------------------------
# self-reactions
# ---------------------------------------------------------------------------------------------------------------


class Site:
    __slots__ = ('rule', 'dist', 'tie', 'data')

    def __init__(self, rule, dist, tie=(), data=None):
        self.rule = rule
        self.dist = dist
        self.tie = tie
        self.data = data


class SelfRule:
    """A thing the molecule does by itself.  find(mol) -> sites, best first (a Site's dist is how far apart the two
    groups are: the engine does the nearest first).  apply(mol, site) -> (new Mol, lost-atoms Counter) does ONE place."""
    name = ''
    label = ''
    off = {}
    adds = ''
    loses = ''
    doc = ''
    source = 'paper'

    def find(self, mol):
        raise NotImplementedError

    def apply(self, mol, site):
        raise NotImplementedError

    def as_step(self):
        return RepeatStep(self)


class SmartsSelfRule(SelfRule):
    """A self-reaction that is one reaction SMARTS.  dist is the distance used to order it among the others."""

    def __init__(self, name, smarts, dist, off=None, adds='', loses='', label='', doc='', source='paper'):
        self.name = name
        self.step = SmartsStep(smarts, adds, loses, off)
        self.dist = dist
        self.off = Counter(off or {})
        self.adds = adds
        self.loses = loses
        self.label = label or name
        self.doc = doc
        self.source = source

    def find(self, mol):
        return [Site(self, self.dist)] if self.step.has_site(mol) else []

    def apply(self, mol, site):
        r = self.step._one(mol)
        if r is None:
            return None
        return r[0], r[1]


class GraphRule(SelfRule):
    """A self-reaction written as a graph query (finder) and an edit of the graph (editor).
    finder(mol) -> list of dicts, each with 'dist' (and optional 'tie' tuple); the list is sorted here.
    editor(rw, site_dict) edits the RWMol in place."""

    def __init__(self, name, finder, editor, off=None, adds='', loses='', label='', doc='', source='paper'):
        self.name = name
        self.finder = finder
        self.editor = editor
        self.off = Counter(off or {})
        self.adds = adds
        self.loses = loses
        self.label = label or name
        self.doc = doc
        self.source = source

    def find(self, mol):
        sites = self.finder(mol)
        sites.sort(key=lambda s: s.get('sort') or (s['dist'], s.get('tie', ())))
        return [Site(self, s['dist'], s.get('tie', ()), s) for s in sites]

    def apply(self, mol, site):
        rw = Chem.RWMol(mol)
        self.editor(rw, site.data)
        out = finish(rw)
        if out is None:
            return None
        return out, Counter()


class RepeatStep:
    """Run a SelfRule's place after place until it fits nowhere: how a player's reaction that is a pair-joiner acts
    'everywhere it fits'."""

    def __init__(self, rule, max_sites=24):
        self.rule = rule
        self.max_sites = max_sites
        self.adds = formula(rule.adds)
        self.loses = formula(rule.loses)

    def has_site(self, mol):
        return bool(self.rule.find(mol))

    def apply_all(self, mol):
        n = 0
        off, added, lost = Counter(), Counter(), Counter()
        for _ in range(self.max_sites):
            sites = self.rule.find(mol)
            if not sites:
                break
            r = self.rule.apply(mol, sites[0])
            if r is None:
                break
            mol, dropped = r
            n += 1
            for k, v in self.rule.off.items():
                off[k] += v
            added.update(self.adds)
            lost.update(self.loses)
            lost.update(dropped)
        return StepResult(mol, n, off, added, lost)


def pair_sites(mol, sma_a, sma_b, anchor_a, anchor_b, lo, hi, ring='any', ordered=True, ring_limit=8):
    """Every (group A, group B) whose anchor carbons are lo..hi bonds apart along carbons.
    sma_a / sma_b carry atom maps; anchor_a / anchor_b are the map numbers of the anchor carbons.
    ring: 'any' no limit; 'lactol' the game's zip limit on fused small rings; 'none' neither anchor may be in a ring.
    ordered False: A and B are the same kind of group, so keep each pair once.
    Returns [{'A': {map: idx}, 'B': {map: idx}, 'dist': d}]."""
    As = matches(mol, sma_a)
    Bs = As if sma_b == sma_a else matches(mol, sma_b)
    out = []
    cache = {}
    for ia, a in enumerate(As):
        ca = a[anchor_a]
        if ca not in cache:
            cache[ca] = cdist(mol, ca, hi)
        dist = cache[ca]
        for ib, b in enumerate(Bs):
            if not ordered and ib <= ia:
                continue
            cb = b[anchor_b]
            d = dist.get(cb)
            if d is None or d < lo or d > hi or cb == ca:
                continue
            if set(a.values()) & set(b.values()):
                continue
            if ring == 'lactol' and not lactol_ring_ok(mol, cb, ca, ring_limit):
                continue
            if ring == 'none' and (in_ring(mol, ca) or in_ring(mol, cb)):
                continue
            out.append({'A': a, 'B': b, 'dist': d, 'tie': (ia, ib)})
    return out


# ---------------------------------------------------------------------------------------------------------------
# the reaction the player fires
# ---------------------------------------------------------------------------------------------------------------


class Reaction:
    """A named reaction.  steps run in order; each acts everywhere it fits.  fire(mol) -> StepResult (n = places)."""

    def __init__(self, name, label, steps, size='small', source='paper', note='', family='', unlock=''):
        self.name = name
        self.label = label
        self.steps = list(steps)
        self.size = size
        self.source = source      # 'built' = exactly as in the game; 'paper' = first draft from docs/REACTIONS.md
        self.note = note
        self.family = family
        self.unlock = unlock

    def fire(self, mol):
        total = StepResult(mol)
        for st in self.steps:
            r = st.apply_all(total.mol)
            total.mol = r.mol
            total.n += r.n
            total.off.update(r.off)
            total.added.update(r.added)
            total.lost.update(r.lost)
        return total

    def smarts(self):
        out = []
        for st in self.steps:
            out.append(getattr(st, 'smarts', None) or ('(graph rule %s)' % st.rule.name))
        return out
