"""The fold: how Overreact draws a long molecule folded back on itself like a snake, and what faces what across the fold.

Everything here is on RDKit molecules and does not edit any existing file.  See FOLD.md for the rule in plain words and the
measures.  Parts of this file:

  1. fold(mol, anchor, K)          the exact fold: backbone, row and column of each backbone atom, which side it points to.
  2. neighbors_across(mol)         the pairs of atoms that face each other across the fold.
  3. FAR_RULES                     the across-the-fold form of each reflex that has one, and three that exist only across the
                                   fold (bridge, stitch, link), written as engine reflex objects (chemlib.GraphRule).
  4. FoldEngine                    the engine of this folder with the anchor kept on the molecule and the across rules added.
  5. the measures                  see main() and the functions below it (python fold.py --help).

THE RULE IN BRIEF (details in the docstrings and in FOLD.md)
  * Rings of 8 atoms or fewer are bodies: drawn whole, never bent.  The bonds that an across join makes (rungs, flagged by an
    isotope mark here, by a flag on the bond in the game) are left out of the layout, so a loop made by a join does not move
    the molecule.  A ring of 9 or more atoms that no join made is cut at the bond that keeps the longest backbone.
  * The backbone is the longest path that starts at the anchor atom (one end of the longest path when the molecule is dealt,
    kept for the whole round).  At a fork it follows the longer way; a tie goes to the arm with more atoms, then to the lower
    canonical rank (the game: the lower atom id).  A lone hetero atom at the end is a group, not backbone.
  * Rows of K = 8 backbone atoms, row 0 left to right, row 1 right to left, and so on.  A turn is one bond straight across.
    A last row of 2 atoms or fewer is not turned (it runs on).  A ring body is never split across a turn.
  * The last atom of each row but the final one points into the gap, and the direction alternates along the row.
  * Arms of 3 atoms or fewer with no ring in them are groups and take their host's place; longer arms and rings that hang off
    the backbone are drawn outside and face nothing.
  * Facing (mode 'W'): hosts in neighbouring rows whose columns differ by 0 or 1.  An across join needs the two atoms 6 or
    more bonds apart (nearer than that the ordinary reflexes already reach).
"""
import itertools
import os
import random
import sys
import time
from collections import Counter, defaultdict, deque

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

from rdkit import Chem, RDLogger

RDLogger.DisableLog('rdApp.*')

import chemlib as C
from chemlib import parse, canon, matches, finish, nbr
import library as L
import engine as E

K_DEFAULT = 8            # backbone atoms in a row
SMALL = 8                # rings this size or smaller are bodies
SHORT_ARM = 3            # an arm this size or smaller (and with no ring) is a group and takes its host's place
TAIL_DEFAULT = 2         # a last row of this many atoms or fewer is not turned, it runs on straight
MIN_D = 6                # an across join needs the two atoms at least this many bonds apart
MODE_DEFAULT = 'W'       # 'E' same column only, 'W' same column or one to either side
ISO = {6: 13, 7: 15, 8: 18, 9: 19, 16: 34, 17: 37}   # the isotope that marks the anchor atom


# ---------------------------------------------------------------------------------------------------------------
# the anchor
# ---------------------------------------------------------------------------------------------------------------

def anchor_of(mol):
    """Index of the marked anchor atom, or None."""
    for a in mol.GetAtoms():
        if 0 < a.GetIsotope() < RUNG_BASE:
            return a.GetIdx()
    return None


RUNG_BASE = 100          # an across join marks both atoms of each bond it makes with the isotope 100 + k (k = 1, 2, ...)


def rung_bonds(mol):
    """The bonds an across join made: bonds whose two atoms carry the same rung mark.  (In the game: a flag on the bond.)"""
    out = []
    for b in mol.GetBonds():
        i, j = b.GetBeginAtom().GetIsotope(), b.GetEndAtom().GetIsotope()
        if i >= RUNG_BASE and i == j:
            out.append((b.GetBeginAtomIdx(), b.GetEndAtomIdx()))
    return out


def mark_rung(rw, a, b):
    """Called by an across join after it adds the bond a-b: flag the bond."""
    used = [x.GetIsotope() for x in rw.GetAtoms() if x.GetIsotope() >= RUNG_BASE]
    k = (max(used) if used else RUNG_BASE) + 1
    for x in (a, b):
        at = rw.GetAtomWithIdx(x)
        if at.GetIsotope() == 0:
            at.SetIsotope(k)


def _ranks(mol):
    return list(Chem.CanonicalRankAtoms(mol, breakTies=True))


def default_anchor(mol):
    """One end of the longest path (by atoms, rings counted as bodies are not considered: plain two-pass search on the atoms),
    the end with the lower canonical rank."""
    n = mol.GetNumAtoms()
    rk = _ranks(mol)
    dm = Chem.GetDistanceMatrix(mol)
    ok = [i for i in range(n) if not (mol.GetAtomWithIdx(i).GetDegree() == 1 and mol.GetAtomWithIdx(i).GetAtomicNum() != 6)] or list(range(n))
    start = min(ok, key=lambda i: rk[i])
    a = max(ok, key=lambda i: (dm[start][i], -rk[i]))
    b = max(ok, key=lambda i: (dm[a][i], -rk[i]))
    return a if rk[a] <= rk[b] else b


def with_anchor(smi):
    """The SMILES with an anchor atom marked (the default anchor), unless it already has one."""
    mol = parse(smi)
    if anchor_of(mol) is not None:
        return smi
    return mark(mol, default_anchor(mol))


def mark(mol, idx):
    rw = Chem.RWMol(mol)
    at = rw.GetAtomWithIdx(idx)
    at.SetIsotope(ISO.get(at.GetAtomicNum(), 2 * at.GetAtomicNum()))
    return Chem.MolToSmiles(rw)


def strip(smi):
    """The SMILES without the anchor mark."""
    m = Chem.MolFromSmiles(smi)
    for a in m.GetAtoms():
        a.SetIsotope(0)
    return Chem.MolToSmiles(m)


# ---------------------------------------------------------------------------------------------------------------
# the fold
# ---------------------------------------------------------------------------------------------------------------

class Fold:
    """The result of fold().  Attributes:
       K, mode       the row length and the facing mode
       anchor        the start atom
       path          backbone atoms in order
       pos           {backbone atom: (row, col)}
       down          {backbone atom: True if it points into the gap below its row, False if into the gap above}
       host          {atom: backbone atom whose place it takes} for backbone atoms (themselves) and the atoms of short arms
       rows          number of rows
       pads          columns left empty so that a ring body is not split across a turn
       rung          the bonds left out because they close a loop (list of (a, b))
    """
    __slots__ = ('K', 'mode', 'anchor', 'path', 'pos', 'down', 'host', 'rows', 'pads', 'rung', 'dm', 'hostpos')


def _small_systems(mol):
    systems = []
    for r in mol.GetRingInfo().AtomRings():
        if len(r) > SMALL:
            continue
        s = set(r)
        for t in [t for t in systems if t & s]:
            systems.remove(t)
            s |= t
        systems.append(s)
    return systems


def _components(nodes, edges):
    adj = defaultdict(list)
    for e in edges:
        adj[e[0]].append(e[1])
        adj[e[1]].append(e[0])
    seen, c = set(), 0
    for s0 in sorted(nodes):
        if s0 in seen:
            continue
        c += 1
        q = [s0]
        seen.add(s0)
        while q:
            u = q.pop()
            for v in adj[u]:
                if v not in seen:
                    seen.add(v)
                    q.append(v)
    return c


def _connected(nodes, edges):
    if not nodes:
        return True
    adj = defaultdict(list)
    for e in edges:
        adj[e[0]].append(e[1])
        adj[e[1]].append(e[0])
    seen = {next(iter(nodes))}
    q = [next(iter(nodes))]
    while q:
        u = q.pop()
        for v in adj[u]:
            if v not in seen:
                seen.add(v)
                q.append(v)
    return len(seen) == len(nodes)


def fold(mol, K=K_DEFAULT, anchor=None, mode=MODE_DEFAULT, balanced=False, tail=None):
    """The fold of a molecule.  Deterministic.  `anchor` is the atom index to start from; None means the marked atom, or the
    default anchor.  balanced=True is the alternative of equal rows (rows = ceil(atoms / K), row length = ceil(atoms / rows)).
    """
    n = mol.GetNumAtoms()
    if anchor is None:
        anchor = anchor_of(mol)
    if anchor is None:
        anchor = default_anchor(mol)
    rungs = rung_bonds(mol)
    if rungs:                              # the layout is drawn without the bonds that an across join made
        rw = Chem.RWMol(mol)
        for a, b in rungs:
            rw.RemoveBond(a, b)
        lay = rw.GetMol()
        lay.UpdatePropertyCache(strict=False)
        Chem.GetSymmSSSR(lay)
    else:
        lay = mol
    full = mol
    mol = lay
    rk = _ranks(full)
    systems = _small_systems(mol)
    node_of = list(range(n))
    members = {i: [i] for i in range(n)}
    for k, s in enumerate(systems):
        nid = n + k
        members[nid] = sorted(s)
        for a in s:
            node_of[a] = nid
    for nid in list(members):
        if nid < n and node_of[nid] != nid:
            del members[nid]
    # edges between different nodes: (node u, node v, atom in u, atom in v)
    edges = []
    for b in mol.GetBonds():
        i, j = b.GetBeginAtomIdx(), b.GetEndAtomIdx()
        if node_of[i] != node_of[j]:
            edges.append((node_of[i], node_of[j], i, j))
    nodes = set(members)
    cn = len(edges) - len(nodes) + _components(nodes, edges)
    cut = []
    if cn > 0:
        cut = _choose_cut(mol, nodes, edges, members, node_of, anchor, cn, rk)
    keep = [e for e in edges if e not in cut]
    adj = defaultdict(list)
    for u, v, x, y in keep:
        adj[u].append((v, x, y))
        adj[v].append((u, y, x))
    path = _longest(mol, members, node_of, adj, anchor, rk)
    f = _place(mol, path, K, mode, rk, balanced, tail)
    f.anchor = anchor
    f.rung = list(rungs) + [(x, y) for u, v, x, y in cut]
    f.host = _hosts(mol, path, members, node_of, adj, f)
    f.dm = None
    f.hostpos = {a: f.pos[h] for a, h in f.host.items()}
    return f


def _inner_path(mol, memb, entry, goal, rk):
    """Shortest path inside the atoms `memb` from entry to goal (None: to the farthest atom), neighbours taken by rank."""
    if len(memb) == 1:
        return [entry]
    ms = set(memb)
    prev = {entry: None}
    dist = {entry: 0}
    q = deque([entry])
    while q:
        u = q.popleft()
        for v in sorted((x.GetIdx() for x in mol.GetAtomWithIdx(u).GetNeighbors() if x.GetIdx() in ms), key=lambda i: rk[i]):
            if v not in prev:
                prev[v] = u
                dist[v] = dist[u] + 1
                q.append(v)
    if goal is None:
        goal = max(dist, key=lambda i: (dist[i], -rk[i]))
    p = []
    u = goal
    while u is not None:
        p.append(u)
        u = prev[u]
    return p[::-1]


def _longest(mol, members, node_of, adj, anchor, rk):
    """The longest path from the anchor in the tree of nodes (a body counts as the atoms of the shortest way through it)."""
    cache = {}

    def size(node, parent):
        s = len(members[node])
        for v, x, y in adj[node]:
            if v != parent:
                s += size(v, node)
        return s

    def best(node, entry, parent):
        key = (node, entry, parent)
        if key in cache:
            return cache[key]
        cands = []
        for v, x, y in adj[node]:
            if v == parent:
                continue
            inner = _inner_path(mol, members[node], entry, x, rk)
            w2, p2 = best(v, y, node)
            cands.append(((len(inner) + w2, size(v, node), -rk[y]), inner + p2))
        if not cands:
            a0 = mol.GetAtomWithIdx(entry)
            if len(members[node]) == 1 and parent is not None and a0.GetAtomicNum() != 6 and a0.GetDegree() == 1:
                res = (0, [])                 # a lone hetero atom at the end is a group, not part of the backbone
            else:
                p = _inner_path(mol, members[node], entry, None, rk)
                res = (len(p), p)
        else:
            k, p = max(cands, key=lambda t: t[0])
            res = (k[0], p)
        cache[key] = res
        return res

    return best(node_of[anchor], anchor, None)[1]


def _choose_cut(mol, nodes, edges, members, node_of, anchor, cn, rk):
    """Which bonds to leave out so that the nodes form a tree: the ones that keep the longest backbone."""
    # an edge is in a cycle if the rest is still connected without it
    comps = _components(nodes, edges)
    cand = [e for e in edges if _components(nodes, [x for x in edges if x is not e]) == comps]
    best = None
    combos = itertools.combinations(cand, cn)
    count = 0
    for cs in combos:
        count += 1
        if count > 4000:
            break
        rest = [e for e in edges if e not in cs]
        if len(rest) != len(nodes) - comps or _components(nodes, rest) != comps:
            continue
        adj = defaultdict(list)
        for u, v, x, y in rest:
            adj[u].append((v, x, y))
            adj[v].append((u, y, x))
        p = _longest(mol, members, node_of, adj, anchor, rk)
        key = (-len(p), tuple(sorted(rk[a] for e in cs for a in (e[2], e[3]))))
        if best is None or key < best[0]:
            best = (key, list(cs))
    if best is None:                      # fall back: a breadth-first tree
        seen = {node_of[anchor]}
        q = [node_of[anchor]]
        tree = []
        while q:
            u = q.pop(0)
            for e in edges:
                for a, b in ((e[0], e[1]), (e[1], e[0])):
                    if a == u and b not in seen:
                        seen.add(b)
                        q.append(b)
                        tree.append(e)
        return [e for e in edges if e not in tree]
    return best[1]


def _place(mol, path, K, mode, rk, balanced, tail_n=None):
    tail_n = TAIL_DEFAULT if tail_n is None else tail_n
    f = Fold()
    f.mode = mode
    f.path = list(path)
    # stretches of consecutive atoms that belong to one ring body must not be split across a turn
    ri = mol.GetRingInfo()
    systems = _small_systems(mol)
    body = {}
    for k, s in enumerate(systems):
        for a in s:
            body[a] = k
    stretches = []
    for a in path:
        b = body.get(a)
        if stretches and b is not None and body.get(stretches[-1][-1]) == b:
            stretches[-1].append(a)
        else:
            stretches.append([a])
    if balanced:
        N = sum(len(s) for s in stretches)
        rows = max(1, -(-N // K))
        K = max(1, -(-N // rows))
    f.K = K
    pos, down = {}, {}
    p = 0
    pads = 0
    placed = []                                   # (atom, position number)
    for st in stretches:
        if len(st) <= K and (p % K) + len(st) > K:
            pads += K - (p % K)
            p += K - (p % K)
        for a in st:
            placed.append((a, p))
            p += 1
    last = (placed[-1][1] // K) if placed else 0
    rj = [(a, q // K, q % K) for a, q in placed]
    # a last row of TAIL atoms or fewer (and no ring body in it) is not turned: it runs on straight from the row before
    tail = [x for x in rj if x[1] == last]
    if last >= 1 and len(tail) <= tail_n and not any(body.get(a) is not None for a, _, _ in tail):
        rj = [(a, r if r < last else last - 1, j if r < last else K + j) for a, r, j in rj]
    for a, r, j in rj:
        col = j if r % 2 == 0 else K - 1 - j
        pos[a] = (r, col)
        down[a] = (col + r + K - 1) % 2 == 0
    f.pos = pos
    f.down = down
    f.rows = (max(r for r, c in pos.values()) + 1) if pos else 0
    f.pads = pads
    return f


def _hosts(mol, path, members, node_of, adj, f):
    """{atom: backbone atom whose place it takes}: backbone atoms themselves, and the atoms of arms of SHORT_ARM atoms or fewer
    that hold no ring body."""
    host = {a: a for a in path}
    on = set(path)
    # arms: walk the tree away from the backbone atoms
    for a in path:
        for v, x, y in adj[node_of[a]]:
            pass
    for a in path:
        for nb in mol.GetAtomWithIdx(a).GetNeighbors():
            j = nb.GetIdx()
            if j in on:
                continue
            # a bond that is a rung (left out) does not start an arm
            if any({a, j} == {r1, r2} for r1, r2 in f.rung):
                continue
            arm, ring = _arm(mol, j, on, f)
            if len(arm) <= SHORT_ARM and not ring:
                for x in arm:
                    host[x] = a
    return host


def _arm(mol, start, on, f):
    seen = {start}
    q = [start]
    ring = False
    rung = set(frozenset(r) for r in f.rung)
    systems = _small_systems(mol)
    inbody = set()
    for s in systems:
        inbody |= s
    while q:
        u = q.pop()
        if u in inbody:
            ring = True
        for nb in mol.GetAtomWithIdx(u).GetNeighbors():
            j = nb.GetIdx()
            if j in on or j in seen or frozenset((u, j)) in rung:
                continue
            seen.add(j)
            q.append(j)
    return seen, ring


# ---------------------------------------------------------------------------------------------------------------
# facing
# ---------------------------------------------------------------------------------------------------------------

def _info(mol, K, mode, balanced=False):
    cache = getattr(mol, '_foldinfo', None)
    if cache is None:
        cache = {}
        try:
            mol._foldinfo = cache
        except Exception:
            pass
    key = (K, mode, balanced)
    f = cache.get(key)
    if f is None:
        f = fold(mol, K=K, mode=mode, balanced=balanced)
        f.dm = Chem.GetDistanceMatrix(mol)
        cache[key] = f
    return f


def faces(f, a, b):
    """True if atoms a and b (any atoms that have a host) face each other across the fold."""
    if CFG.get('nofold'):                  # a test switch: any two atoms count as facing (used to ask "were the groups there?")
        return True
    pa, pb = f.hostpos.get(a), f.hostpos.get(b)
    if pa is None or pb is None:
        return False
    (r1, c1), (r2, c2) = pa, pb
    if abs(r1 - r2) != 1:
        return False
    if f.mode == 'E':
        if c1 != c2:
            return False
        up, lo = (a, b) if r1 < r2 else (b, a)
        return f.down[f.host[up]]
    return abs(c1 - c2) <= 1


def neighbors_across(mol, K=K_DEFAULT, mode=MODE_DEFAULT, min_d=MIN_D, f=None):
    """The pairs of atoms that face each other across the fold and are at least min_d bonds apart: [(a, b, bonds apart)] with
    a < b.  Only atoms that have a host (backbone atoms and the atoms of short arms) are listed."""
    f = f or _info(mol, K, mode)
    atoms = sorted(f.hostpos)
    out = []
    for i, a in enumerate(atoms):
        for b in atoms[i + 1:]:
            if faces(f, a, b):
                d = int(f.dm[a][b])
                if d >= min_d:
                    out.append((a, b, d))
    return out


def render(mol, K=K_DEFAULT, mode=MODE_DEFAULT, f=None):
    """A text picture of the fold: one line per row of backbone atoms, with the one-atom groups under or over them."""
    f = f or _info(mol, K, mode)
    rows = defaultdict(dict)
    for a, (r, c) in f.pos.items():
        rows[r][c] = a
    arms = defaultdict(list)
    for a, h in f.host.items():
        if a != h:
            arms[h].append(a)
    out = []
    for r in range(f.rows):
        top, mid, bot = [], [], []
        for c in range(f.K):
            a = rows[r].get(c)
            if a is None:
                top.append('   ')
                mid.append(' . ')
                bot.append('   ')
                continue
            at = mol.GetAtomWithIdx(a)
            sym = at.GetSymbol() + ('^' if 0 < at.GetIsotope() < RUNG_BASE else '')
            groups = ''.join(sorted(mol.GetAtomWithIdx(x).GetSymbol() for x in arms[a]))[:2]
            other = [x for x in at.GetNeighbors() if x.GetIdx() not in f.pos]
            tag = groups or ('*' if other else '')
            mid.append(' %-2s' % sym)
            (bot if f.down[a] else top).append(' %-2s' % tag)
            (top if f.down[a] else bot).append('   ')
        out.append(''.join(top).rstrip())
        out.append(''.join(mid).rstrip())
        out.append(''.join(bot).rstrip())
        out.append('')
    return '\n'.join(out)


# ---------------------------------------------------------------------------------------------------------------
# the across-the-fold reflexes
# ---------------------------------------------------------------------------------------------------------------
# Each is a chemlib.GraphRule whose finder looks only at groups that face each other across the fold and are MIN_D or more
# bonds apart, and whose editor is the join.  Config (row length, facing mode) is read from CFG at the time of the search.
CFG = {'K': K_DEFAULT, 'mode': MODE_DEFAULT, 'min_d': MIN_D, 'balanced': False}
ONE_HET = L.ONE_HET
KC = L.KC


def _fi(mol):
    return _info(mol, CFG['K'], CFG['mode'], CFG['balanced'])


def far_sites(mol, sma_a, sma_b, anchor_a, anchor_b, same=False, extra=None):
    """Pairs of groups (A then B) whose anchor atoms face each other across the fold and are CFG['min_d'] or more bonds apart."""
    f = _fi(mol)
    As = matches(mol, sma_a)
    Bs = As if same else matches(mol, sma_b)
    out = []
    for ia, a in enumerate(As):
        ca = a[anchor_a]
        for ib, b in enumerate(Bs):
            if same and ib <= ia:
                continue
            cb = b[anchor_b]
            if ca == cb or set(a.values()) & set(b.values()):
                continue
            if not faces(f, ca, cb):
                continue
            d = int(f.dm[ca][cb])
            if d < CFG['min_d']:
                continue
            if extra is not None and not extra(mol, a, b):
                continue
            out.append({'A': a, 'B': b, 'dist': d, 'tie': (ia, ib)})
    return out


def _site_ring(mol):
    return far_sites(mol, '[%s:1]=[OX1:2]' % KC, '[OX2H:3]-[CX4;%s:4]' % ONE_HET, 1, 4)


def _ed_ring(rw, s):
    kc, ko, o = s['A'][1], s['A'][2], s['B'][3]
    rw.GetBondBetweenAtoms(kc, ko).SetBondType(Chem.BondType.SINGLE)
    rw.AddBond(o, kc, Chem.BondType.SINGLE)
    mark_rung(rw, o, kc)


def _site_cap(mol):
    return far_sites(mol, '[SX2H:1]-[CX4:2]', '[%s:3]=[OX1:4]' % KC, 2, 3)


def _ed_cap(rw, s):
    sulf, c = s['A'][1], s['B'][3]
    rw.GetBondBetweenAtoms(c, s['B'][4]).SetBondType(Chem.BondType.SINGLE)
    rw.AddBond(sulf, c, Chem.BondType.SINGLE)
    mark_rung(rw, sulf, c)


def _site_knit(mol):
    return far_sites(mol, '[%s:1]=[OX1:2]' % KC, '[NX3H2:3]-[CX4:4]', 1, 4)


def _ed_knit(rw, s):
    c, o, n = s['A'][1], s['A'][2], s['B'][3]
    rw.AddBond(n, c, Chem.BondType.DOUBLE)
    mark_rung(rw, n, c)
    rw.RemoveAtom(o)                              # the O leaves with two H of the NH2 as water: an imine bridge


def _site_weld(mol):
    return far_sites(mol, '[%s:1](=[O:2])-[CX4;!R;!H0:3]' % KC, '[%s;!R:4]=[O:5]' % KC, 3, 4)


def _ed_weld(rw, s):
    a, c2, o2 = s['A'][3], s['B'][4], s['B'][5]
    rw.GetBondBetweenAtoms(c2, o2).SetBondType(Chem.BondType.SINGLE)
    rw.AddBond(a, c2, Chem.BondType.SINGLE)
    mark_rung(rw, a, c2)


def _site_seal(mol):
    return far_sites(mol, '[CX3:1](=[OX1:2])(-[OX2H:3])-[#6]', '[OX2H,NX3H2,SX2H;$(*-[CX4]):4]-[CX4;%s:5]' % ONE_HET, 1, 5)


def _ed_seal(rw, s):
    c, oh_acid, o = s['A'][1], s['A'][3], s['B'][4]
    rw.AddBond(o, c, Chem.BondType.SINGLE)
    mark_rung(rw, o, c)
    rw.RemoveAtom(oh_acid)


def _site_close(mol):
    a = far_sites(mol, '[Cl:1]-[CX4:2]', '[OX2H,NX3H2,SX2H;$(*-[CX4]):3]-[CX4;%s:4]' % ONE_HET, 2, 4)
    b = far_sites(mol, '[Cl:1]-[CX4:2]', '[OX2H:3]-[CX3:4]=[OX1]', 2, 4)
    return a + b


def _ed_close(rw, s):
    cl, o, c = s['A'][1], s['B'][3], s['A'][2]
    rw.AddBond(o, c, Chem.BondType.SINGLE)
    mark_rung(rw, o, c)
    rw.RemoveAtom(cl)


def _site_open(mol):
    f = _fi(mol)
    out = []
    eps = matches(mol, '[C:1]1-[O:2]-[C:3]1')
    ohs = matches(mol, '[OX2H:4]-[CX4;%s:5]' % ONE_HET)
    for ia, a in enumerate(eps):
        for ib, b in enumerate(ohs):
            if b[4] in (a[1], a[3]) or b[4] == a[1]:
                continue
            # the OH attacks the epoxide carbon that faces it
            best = None
            for ca in (a[1], a[3]):
                if faces(f, ca, b[5]) and int(f.dm[ca][b[5]]) >= CFG['min_d']:
                    d = int(f.dm[ca][b[5]])
                    if best is None or d < best[0]:
                        best = (d, ca)
            if best:
                aa = dict(a)
                aa['hit'] = best[1]
                out.append({'A': aa, 'B': b, 'dist': best[0], 'tie': (ia, ib)})
    return out


def _ed_open(rw, s):
    ca = s['A']['hit']
    oe = s['A'][2]
    oh = s['B'][4]
    rw.RemoveBond(ca, oe)
    rw.AddBond(oh, ca, Chem.BondType.SINGLE)
    mark_rung(rw, oh, ca)


def _site_tuck(mol):
    return far_sites(mol, '[%s:1](=[O:2])-[C:3]=[C:4]' % KC, '[OX2H:5]-[CX4;%s:6]' % ONE_HET, 4, 6)


def _ed_tuck(rw, s):
    c3, c4, o = s['A'][3], s['A'][4], s['B'][5]
    rw.GetBondBetweenAtoms(c3, c4).SetBondType(Chem.BondType.SINGLE)
    rw.AddBond(o, c4, Chem.BondType.SINGLE)
    mark_rung(rw, o, c4)


def _site_snap(mol):
    f = _fi(mol)
    out = []
    dbls = [(b.GetBeginAtomIdx(), b.GetEndAtomIdx()) for b in mol.GetBonds()
            if b.GetBondTypeAsDouble() == 2.0 and b.GetBeginAtom().GetAtomicNum() == 6 and b.GetEndAtom().GetAtomicNum() == 6
            and not b.GetIsAromatic()]
    if len(dbls) < 3:
        return out

    def isdbl(a, b):
        bd = mol.GetBondBetweenAtoms(a, b)
        return bd is not None and bd.GetBondTypeAsDouble() == 2.0
    for ia, (x, y) in enumerate(dbls):
        for c1, c2 in ((x, y), (y, x)):
            for c3 in C.cnbr(mol, c2):
                if c3 == c1 or isdbl(c2, c3):
                    continue
                for c4 in C.cnbr(mol, c3):
                    if c4 in (c2, c1) or not isdbl(c3, c4):
                        continue
                    for ib, (u, v) in enumerate(dbls):
                        if ib == ia or {u, v} & {c1, c2, c3, c4}:
                            continue
                        hit = None
                        for ca, cb in ((u, v), (v, u)):
                            if mol.GetBondBetweenAtoms(c1, cb) or mol.GetBondBetweenAtoms(c4, ca):
                                continue
                            if not any(faces(f, p, q) for p in (c1, c2, c3, c4) for q in (ca, cb)):
                                continue
                            d = min(int(f.dm[p][q]) for p in (c1, c2, c3, c4) for q in (ca, cb))
                            if d < CFG['min_d']:
                                continue
                            # c4 joins ca and c1 joins cb; take the way round that joins the nearer pair
                            hit = (d, (c1, c2, c3, c4, ca, cb))
                            break
                        if hit:
                            out.append({'dist': hit[0], 'tie': (ia, ib), 'c': hit[1]})
    return out


def _ed_snap(rw, s):
    c1, c2, c3, c4, ca, cb = s['c']
    S, D = Chem.BondType.SINGLE, Chem.BondType.DOUBLE
    rw.GetBondBetweenAtoms(c1, c2).SetBondType(S)
    rw.GetBondBetweenAtoms(c3, c4).SetBondType(S)
    rw.GetBondBetweenAtoms(c2, c3).SetBondType(D)
    rw.GetBondBetweenAtoms(ca, cb).SetBondType(S)
    rw.AddBond(c1, cb, S)
    mark_rung(rw, c1, cb)
    rw.AddBond(c4, ca, S)
    mark_rung(rw, c4, ca)


def _site_bridge(mol):
    return far_sites(mol, '[SX2H:1]-[CX4:2]', '[SX2H:1]-[CX4:2]', 2, 2, same=True)


def _ed_bridge(rw, s):
    rw.AddBond(s['A'][1], s['B'][1], Chem.BondType.SINGLE)
    mark_rung(rw, s['A'][1], s['B'][1])


def _site_stitch(mol):
    f = _fi(mol)
    out = []
    dbls = [(b.GetBeginAtomIdx(), b.GetEndAtomIdx()) for b in mol.GetBonds()
            if b.GetBondTypeAsDouble() == 2.0 and b.GetBeginAtom().GetAtomicNum() == 6 and b.GetEndAtom().GetAtomicNum() == 6
            and not b.GetIsAromatic() and not mol.GetRingInfo().NumBondRings(b.GetIdx())]
    for ia in range(len(dbls)):
        for ib in range(ia + 1, len(dbls)):
            p, q = dbls[ia], dbls[ib]
            if set(p) & set(q):
                continue
            if not any(faces(f, x, y) for x in p for y in q):
                continue
            d = min(int(f.dm[x][y]) for x in p for y in q)
            if d < CFG['min_d']:
                continue
            # the pair of atoms that face each other are joined, and the other two atoms are joined
            opts = []
            for x in p:
                for y in q:
                    if faces(f, x, y):
                        ox = p[1] if x == p[0] else p[0]
                        oy = q[1] if y == q[0] else q[0]
                        opts.append((int(f.dm[ox][oy]), x, y, ox, oy))
            opts.sort()
            dd, x, y, ox, oy = opts[0]
            if mol.GetBondBetweenAtoms(ox, oy) is not None:
                continue
            out.append({'dist': d, 'tie': (ia, ib), 'c': (x, ox, y, oy)})
    return out


def _ed_stitch(rw, s):
    x, ox, y, oy = s['c']
    rw.GetBondBetweenAtoms(x, ox).SetBondType(Chem.BondType.SINGLE)
    rw.GetBondBetweenAtoms(y, oy).SetBondType(Chem.BondType.SINGLE)
    rw.AddBond(x, y, Chem.BondType.SINGLE)
    mark_rung(rw, x, y)
    rw.AddBond(ox, oy, Chem.BondType.SINGLE)
    mark_rung(rw, ox, oy)


def _site_link(mol):
    return far_sites(mol, '[OX2H:1]-[CX4;%s:2]' % ONE_HET, '[OX2H:1]-[CX4;%s:2]' % ONE_HET, 2, 2, same=True)


def _ed_link(rw, s):
    o1, c1 = s['A'][1], s['A'][2]
    o2, c2 = s['B'][1], s['B'][2]
    mol = rw.GetMol()
    n1 = sum(1 for x in mol.GetAtomWithIdx(c1).GetNeighbors() if x.GetAtomicNum() == 6)
    n2 = sum(1 for x in mol.GetAtomWithIdx(c2).GetNeighbors() if x.GetAtomicNum() == 6)
    if n1 > n2:                       # the OH on the more crowded carbon leaves; the other O makes the ether
        o1, c1, o2, c2 = o2, c2, o1, c1
    # o1 (on the less crowded carbon c1) attacks c2; o2 leaves as water
    rw.AddBond(o1, c2, Chem.BondType.SINGLE)
    mark_rung(rw, o1, c2)
    rw.RemoveAtom(o2)


def _far(name, finder, editor, label, doc, off=None, prio=3, per_turn=1, twin=''):
    r = C.GraphRule(name, finder, editor, off=off, label=label, doc=doc, source='fold')
    r.prio = prio
    r.per_turn = per_turn
    r.twin = twin
    r.far = True
    return r


FAR_RULES = {r.name: r for r in [
    _far('ring_far', _site_ring, _ed_ring, 'Ring across', 'An OH facing a C=O across the fold: the OH oxygen joins the C=O carbon and closes a loop; the C=O becomes C-OH. Loose: opens again when the turn ends.', twin='ring'),
    _far('cap_far', _site_cap, _ed_cap, 'Cap across', 'An SH facing a C=O across the fold: the S joins the C=O carbon and closes a loop; the C=O becomes C-OH. Loose.', twin='cap'),
    _far('knit_far', _site_knit, _ed_knit, 'Knit across', 'An NH2 facing a C=O across the fold: C=N forms (an imine) and water comes off; a loop of the molecule through the new C=N stays.', off={'water': 1}, twin='knit'),
    _far('weld_far', _site_weld, _ed_weld, 'Weld across', 'The CH beside a C=O facing a second C=O across the fold: they join (a large aldol), the second C=O becomes C-OH.', twin='weld'),
    _far('seal_far', _site_seal, _ed_seal, 'Seal across', 'A COOH facing an OH, NH2 or SH across the fold: a large lactone, lactam or thiolactone; water comes off.', off={'water': 1}, twin='seal'),
    _far('close_far', _site_close, _ed_close, 'Close across', 'A Cl facing an OH, NH2, SH or COOH across the fold: the Cl leaves and the other group closes a large ring (a crown-like ether, amine, thioether or lactone); acid fumes come off.', off={'acid fumes': 1}, twin='close'),
    _far('open_far', _site_open, _ed_open, 'Open across', 'An epoxide facing an OH across the fold: the OH opens the epoxide and closes a large ether ring; the other epoxide carbon keeps an OH.', twin='open'),
    _far('tuck_far', _site_tuck, _ed_tuck, 'Tuck across', 'The far carbon of a C=C beside a C=O facing an OH across the fold: the OH adds to it and closes a large ether ring.', twin='tuck'),
    _far('snap_far', _site_snap, _ed_snap, 'Snap across', 'Two C=C side by side facing a third C=C across the fold: a six-ring forms (a transannular Diels-Alder) and the chain between becomes a loop.', twin='snap'),
    _far('bridge', _site_bridge, _ed_bridge, 'Bridge', 'Two SH facing each other across the fold join as S-S (a disulfide bridge); two H leave as hydrogen.', off={'hydrogen': 1}),
    _far('stitch', _site_stitch, _ed_stitch, 'Stitch', 'Two C=C facing each other across the fold join into a four-ring (a [2+2] ring) and both go single.'),
    _far('link', _site_link, _ed_link, 'Link', 'Two OH facing each other across the fold join as an ether C-O-C (a large ether ring, as in crown ethers); water comes off.', off={'water': 1}),
]}
FAR_ORDER = ('ring_far', 'cap_far', 'knit_far', 'weld_far', 'seal_far', 'close_far', 'open_far', 'tuck_far', 'snap_far',
             'bridge', 'stitch', 'link')
FAR_KINDS = {k for k in FAR_RULES}
# the loose ones (a loop that opens again when the turn ends) are opened by library.reopen


# ---------------------------------------------------------------------------------------------------------------
# the engine
# ---------------------------------------------------------------------------------------------------------------

class FoldEngine(E.Engine):
    """The engine of this folder with the across-the-fold reflexes added and the anchor kept on the molecule (an isotope mark
    on one atom, which survives every reaction that leaves the atom in place; if the atom is cut away the next end of the
    longest path becomes the anchor, as the game would do)."""

    def __init__(self, **kw):
        rules = dict(L.SELF_RULES)
        rules.update(FAR_RULES)
        super().__init__(self_rules=rules, **kw)
        self._remarked = {}

    def fire(self, smi, name):
        key = (smi, name)
        hit = self._remarked.get(key)
        if hit is not None:
            return hit
        res = super().fire(smi, name)
        if res.acted and anchor_of(parse(res.smi)) is None:
            m = parse(res.smi)
            res = E.Fired(mark(m, default_anchor(m)), res.n, res.off, res.acted, res.blocked)
        self._remarked[key] = res
        return res

    def clear(self):
        super().clear()
        self._remarked.clear()

    def reopen(self, smi):
        smi2, n = super().reopen(smi)
        return smi2, n


def set_config(K=None, mode=None, min_d=None, balanced=None):
    if K is not None:
        CFG['K'] = K
    if mode is not None:
        CFG['mode'] = mode
    if min_d is not None:
        CFG['min_d'] = min_d
    if balanced is not None:
        CFG['balanced'] = balanced



# ---------------------------------------------------------------------------------------------------------------
# tests: python fold.py test
# ---------------------------------------------------------------------------------------------------------------

def chain_with(n, groups, anchor_at=0):
    """A straight chain of n carbons with groups hung on chosen atoms: groups {index: 'SMILES branch'}; the end atom may be
    replaced by a group string under key 'end' (for a COOH at the end).  The anchor is carbon 0."""
    parts = []
    for k in range(n):
        g = groups.get(k)
        parts.append('C' + ('(%s)' % g if g else ''))
    smi = ''.join(parts)
    m = Chem.MolFromSmiles(smi)
    return mark(m, anchor_at)


# rule -> (n, {index: group}, what the product must be: (atoms in the product minus atoms before) as formula change)
FAR_CASES = {
    # name: (chain length, groups, expected change in heavy atoms + H ({}: none; water leaves: {'O': -1, 'H': -2}) , a pattern that must be in the product)
    'ring_far': (20, {3: 'O', 12: '=O'}, {}, '[CX4](O)(O)'),
    'cap_far': (20, {3: 'S', 12: '=O'}, {}, '[CX4](O)(S)'),
    'knit_far': (20, {3: 'N', 12: '=O'}, {'O': -1, 'H': -2}, 'C=N'),
    'weld_far': (20, {4: '=O', 12: '=O'}, {}, '[CX4](O)'),
    'seal_far': (20, {3: 'O', 12: 'C(=O)O'}, {'O': -1, 'H': -2}, 'C(=O)O[CX4]'),
    'close_far': (20, {3: 'Cl', 12: 'O'}, {'Cl': -1, 'H': -1}, '[CX4]O[CX4]'),
    'bridge': (20, {3: 'S', 12: 'S'}, {'H': -2}, 'SS'),
    'link': (20, {3: 'O', 12: 'O'}, {'O': -1, 'H': -2}, '[CX4]O[CX4]'),
}


def selftest(verbose=True):
    """Each across reflex on a chain built so that its two groups face each other; checks the product exists, the atoms
    balance as the doc says, and the rung is flagged.  Also checks the fold itself."""
    from collections import Counter
    ok = True

    def comp(m):
        c = Counter()
        for a in m.GetAtoms():
            c[a.GetSymbol()] += 1
            c['H'] += a.GetTotalNumHs()
        return c
    set_config(K=8, mode='W', min_d=6, balanced=False)
    for name, (n, groups, delta, patt) in FAR_CASES.items():
        g = dict(groups)
        smi = chain_with(n, g)
        m = parse(smi)
        rule = FAR_RULES[name]
        sites = rule.find(m)
        if not sites:
            print('FAIL', name, 'no site on', smi)
            ok = False
            continue
        out = rule.apply(m, sites[0])
        if out is None:
            print('FAIL', name, 'no product')
            ok = False
            continue
        p = out[0]
        d = comp(p)
        d.subtract(comp(m))
        d = {k: v for k, v in d.items() if v}
        want = {k: v for k, v in delta.items() if v}
        match = p.HasSubstructMatch(Chem.MolFromSmarts(patt))
        rung = len(rung_bonds(p)) >= 1
        good = (d == want) and match and rung
        ok = ok and good
        if verbose:
            print('%-9s %s  %s -> %s  change %s %s' % (name, 'ok  ' if good else 'FAIL', smi, Chem.MolToSmiles(p), d,
                                                        '' if good else '(want %s, pattern %s, rung %s)' % (want, match, rung)))
    # the folds
    for n_atoms, rows in [(8, 1), (10, 1), (11, 2), (18, 2), (19, 3), (26, 3), (27, 4), (28, 4), (35, 5)]:
        m = parse(with_anchor('C' * n_atoms))
        f = fold(m)
        good = f.rows == rows
        ok = ok and good
        if verbose:
            print('fold of %2d carbons: rows %d %s' % (n_atoms, f.rows, 'ok' if good else 'FAIL want %d' % rows))
    # facing is symmetric, and the same fold is found twice
    m = parse(with_anchor('CC(O)CCCCCCCCCCC(=O)CCCCCCCCCC'))
    f1, f2 = fold(m), fold(m)
    good = f1.pos == f2.pos and all(faces(f1, b, a) == faces(f1, a, b) for a in f1.hostpos for b in f1.hostpos)
    ok = ok and good
    print('same fold twice and facing symmetric:', 'ok' if good else 'FAIL')
    return ok


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'test':
        sys.exit(0 if selftest() else 1)
    smi = sys.argv[1] if len(sys.argv) > 1 else 'CC(O)CCCCCCCCCCCCC(=O)CC'
    smi = with_anchor(canon(smi))
    m = parse(smi)
    print(smi)
    print(render(m))
    print(neighbors_across(m))
