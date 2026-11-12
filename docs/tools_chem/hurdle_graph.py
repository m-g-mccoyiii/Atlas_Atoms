"""The structural hurdles written on a plain graph, with no RDKit inside the algorithms, so that the JavaScript game can do the same.
The game builder can port this file function by function.  `python hurdle_graph.py` checks every function against hurdles.feat
(RDKit) on a few hundred molecules from played rounds and prints how often they agree.

A graph is (el, bonds): el = list of element symbols of the heavy atoms (hydrogens are not atoms); bonds = list of (i, j, order)
with order 1, 2 or 3 in a KEKULE form (a benzene ring is written with alternating single and double bonds).
"""
import itertools
import random
import sys
from collections import Counter, deque


def graph_of(smi):
    """(el, bonds, nH) of a SMILES, kekulized.  (RDKit is used here only to read the SMILES.)"""
    from rdkit import Chem
    m = Chem.MolFromSmiles(smi)
    Chem.Kekulize(m, clearAromaticFlags=True)
    el = [a.GetSymbol() for a in m.GetAtoms()]
    bonds = [(b.GetBeginAtomIdx(), b.GetEndAtomIdx(), int(b.GetBondTypeAsDouble())) for b in m.GetBonds()]
    nh = [a.GetTotalNumHs() for a in m.GetAtoms()]
    return el, bonds, nh


def adjacency(n, bonds):
    adj = [[] for _ in range(n)]
    for i, j, o in bonds:
        adj[i].append((j, o))
        adj[j].append((i, o))
    return adj


def components(n, bonds):
    adj = adjacency(n, bonds)
    seen = [-1] * n
    k = 0
    for s in range(n):
        if seen[s] >= 0:
            continue
        seen[s] = k
        q = [s]
        for x in q:
            for y, _ in adj[x]:
                if seen[y] < 0:
                    seen[y] = k
                    q.append(y)
        k += 1
    return seen, k


# --- rings: the smallest set of smallest rings (a minimum cycle basis, Horton's candidates) ------------------------------
def rings(n, bonds):
    """List of rings, each a tuple of atom indices in order round the ring.  The number of rings is bonds - atoms + pieces."""
    adj = adjacency(n, bonds)
    _, pieces = components(n, bonds)
    want = len(bonds) - n + pieces
    if want <= 0:
        return []
    eid = {}
    for k, (i, j, _) in enumerate(bonds):
        eid[(i, j)] = eid[(j, i)] = k
    cands = {}
    for r in range(n):
        par = {r: None}
        dist = {r: 0}
        q = deque([r])
        while q:
            x = q.popleft()
            for y, _ in adj[x]:
                if y not in par:
                    par[y] = x
                    dist[y] = dist[x] + 1
                    q.append(y)

        def path(x):
            p = []
            while x is not None:
                p.append(x)
                x = par[x]
            return p
        for (i, j, _) in bonds:
            if i not in par or j not in par or par[i] == j or par[j] == i:
                continue
            pi, pj = path(i), path(j)
            if set(pi[:-1]) & set(pj[:-1]):
                continue
            cyc = pi[::-1] + pj[:-1]               # r ... i then j ... (back toward r)
            key = frozenset(eid[(cyc[t], cyc[(t + 1) % len(cyc)])] for t in range(len(cyc)))
            if key not in cands:
                cands[key] = tuple(cyc)
    order = sorted(cands.items(), key=lambda kv: (len(kv[1]), sorted(kv[0])))
    basis = []          # gaussian elimination over GF(2): each vector is an int bitmask of bonds
    chosen = []
    for key, cyc in order:
        v = 0
        for b in key:
            v |= 1 << b
        for bv in basis:
            v = min(v, v ^ bv)
        if v:
            basis.append(v)
            chosen.append(cyc)
            if len(chosen) == want:
                break
    return chosen


def union_find(k):
    p = list(range(k))

    def find(x):
        while p[x] != x:
            p[x] = p[p[x]]
            x = p[x]
        return x
    return find, lambda a, b: p.__setitem__(find(a), find(b))


def ring_numbers(el, bonds):
    n = len(el)
    rs = rings(n, bonds)
    sets = [set(r) for r in rs]
    out = {'rings': len(rs), 'ring5': sum(1 for r in rs if len(r) == 5), 'ring6': sum(1 for r in rs if len(r) == 6),
           'ring_small': sum(1 for r in rs if len(r) <= 4), 'ring_big': sum(1 for r in rs if len(r) >= 7),
           'ring_sizes': len({len(r) for r in rs}), 'ring_atoms': len(set().union(*sets)) if sets else 0}
    f1, u1 = union_find(len(rs))
    f2, u2 = union_find(len(rs))
    pairs = 0
    spiro_at, bridge_at = set(), set()
    for i, j in itertools.combinations(range(len(rs)), 2):
        com = sets[i] & sets[j]
        if len(com) >= 2:
            pairs += 1
            u1(i, j)
        if com:
            u2(i, j)
        if len(com) == 1:
            spiro_at |= com                                   # two rings meeting at one atom
        if len(com) >= 3:
            # the shared stretch is a path; its two end atoms (the ones with a neighbour in only one of the two rings' shared part)
            sh = com
            for a in sh:
                inner = 0
                for r in (rs[i],):
                    k = r.index(a)
                    for d in (-1, 1):
                        if r[(k + d) % len(r)] in sh:
                            inner += 1
                if inner == 1:
                    bridge_at.add(a)
    out['fused_pairs'] = pairs
    out['fused_block'] = max(Counter(f1(i) for i in range(len(rs))).values()) if rs else 0
    out['ring_systems'] = len({f2(i) for i in range(len(rs))})
    out['spiro'] = len(spiro_at)
    out['bridgehead'] = len(bridge_at)
    hetero = lambda r: {el[a] for a in r} - {'C'}
    out['ring_hetero'] = sum(1 for r in rs if hetero(r))
    out['ring_oxygen'] = sum(1 for r in rs if 'O' in hetero(r))
    out['ring_mixed'] = sum(1 for r in rs if len(hetero(r)) >= 2)
    # a benzene-type ring: six carbons joined alternately by single and double bonds
    bo = {}
    for i, j, o in bonds:
        bo[(i, j)] = bo[(j, i)] = o
    out['aromatic'] = sum(1 for r in rs if len(r) == 6 and all(el[a] == 'C' for a in r) and sorted(
        bo[(r[t], r[(t + 1) % 6])] for t in range(6)) == [1, 1, 1, 2, 2, 2] and all(
        bo[(r[t], r[(t + 1) % 6])] != bo[(r[(t + 1) % 6], r[(t + 2) % 6])] for t in range(6)))
    return out


# --- chain, span, branches, twins, alternating run --------------------------------------------------------------------------
def longest_chain(el, bonds):
    n = len(el)
    inring = set().union(*[set(r) for r in rings(n, bonds)]) if rings(n, bonds) else set()
    nodes = [i for i in range(n) if el[i] == 'C' and i not in inring]
    ns = set(nodes)
    adj = {i: [] for i in nodes}
    for i, j, _ in bonds:
        if i in ns and j in ns:
            adj[i].append(j)
            adj[j].append(i)

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
        best = max(best, far(a)[1] + 1)
    return best


def diameter(el, bonds):
    n = len(el)
    adj = adjacency(n, bonds)
    best = 0
    for s in range(n):
        d = {s: 0}
        q = [s]
        for x in q:
            for y, _ in adj[x]:
                if y not in d:
                    d[y] = d[x] + 1
                    q.append(y)
        best = max(best, max(d.values()))
    return best


def branch_points(el, bonds):
    return sum(1 for a in adjacency(len(el), bonds) if len(a) >= 3)


def twins(el, bonds, nh):
    """atoms minus the number of classes, where two atoms are in one class when they look the same from the inside: start with
    (element, hydrogens, bonds), then repeatedly add the sorted (bond order, class) of the neighbours until the classes stop splitting."""
    n = len(el)
    adj = adjacency(n, bonds)
    cls = [(el[i], nh[i], len(adj[i])) for i in range(n)]
    k = len(set(cls))
    while True:
        new = [(cls[i], tuple(sorted((o, cls[j]) for j, o in adj[i]))) for i in range(n)]
        ids = {v: t for t, v in enumerate(sorted(set(new), key=repr))}
        new = [ids[v] for v in new]
        if len(set(new)) == k:
            break
        cls, k = new, len(set(new))
    return n - k


def alternating_run(el, bonds):
    """Atoms in the biggest connected set of conjugated bonds.  A single bond is conjugated when both its atoms are in a double
    bond, or one is in a double bond and the other is O, N, S or Cl (a lone pair to share).  A double bond is conjugated when one
    of its atoms sits in such a single bond.  A lone double bond, or a C=O with nothing beside it, is not conjugated."""
    n = len(el)
    adj = adjacency(n, bonds)
    pi = [any(o >= 2 for _, o in adj[i]) for i in range(n)]
    lone = [el[i] in ('O', 'N', 'S', 'Cl') for i in range(n)]
    conj_atoms = set()
    single = []
    for i, j, o in bonds:
        if o == 1 and ((pi[i] and pi[j]) or (pi[i] and lone[j]) or (pi[j] and lone[i])):
            single.append((i, j))
            conj_atoms |= {i, j}
    f, u = union_find(n)
    inc = set()
    for i, j in single:
        u(i, j)
        inc |= {i, j}
    for i, j, o in bonds:
        if o >= 2 and (i in conj_atoms or j in conj_atoms):
            u(i, j)
            inc |= {i, j}
    return max(Counter(f(i) for i in inc).values()) if inc else 0


# --- bonds, odd atoms and the twelve kinds of group -----------------------------------------------------------------------------
def double_bonds(el, bonds):
    """C=C plus C=O double bonds; a benzene ring written in kekule form has three C=C, so it counts 3 as it should."""
    return sum(1 for i, j, o in bonds if o == 2 and {el[i], el[j]} in ({'C'}, {'C', 'O'}))


def unsaturation(el, bonds):
    """rings plus all double bonds (a benzene ring: 1 ring and 3 double bonds)."""
    return len(rings(len(el), bonds)) + sum(1 for _, _, o in bonds if o == 2)


def hetero_atoms(el):
    return sum(1 for e in el if e != 'C')


def aromatic_bonds(el, bonds):
    """Bonds of benzene-type rings (six carbons joined alternately by single and double bonds), which the C=C group must skip."""
    n = len(el)
    bo = {}
    for i, j, o in bonds:
        bo[(i, j)] = bo[(j, i)] = o
    out = set()
    for r in rings(n, bonds):
        if len(r) == 6 and all(el[a] == 'C' for a in r) and sorted(bo[(r[t], r[(t + 1) % 6])] for t in range(6)) == [1, 1, 1, 2, 2, 2] \
                and all(bo[(r[t], r[(t + 1) % 6])] != bo[(r[(t + 1) % 6], r[(t + 2) % 6])] for t in range(6)):
            for t in range(6):
                out.add(frozenset((r[t], r[(t + 1) % 6])))
    return out


def group_counts(el, bonds, nh):
    """How many of each of the 12 kinds of group are on the molecule (hydrogens are not atoms; nh is the hydrogens on each atom).
    OH: an O with one H on a carbon that is not a C=O carbon.  C=O: a carbon with three connections, a double bond to an O with
    nothing else on it, and no other atom but carbon beside it.  C=C: a double bond between two carbons not in a benzene ring.
    COOH, ester (C(=O)-O-C), ether (O between two carbons, not an ester O), amide (C(=O)-N), NH2 (on a carbon that is not a C=O
    carbon), SH, Cl, S-S, C=N (a carbon double-bonded to an N with two connections)."""
    n = len(el)
    adj = adjacency(n, bonds)
    arom = aromatic_bonds(el, bonds)
    conn = [len(adj[i]) + nh[i] for i in range(n)]

    def dbl_to(i, sym, deg=None):
        return [j for j, o in adj[i] if o == 2 and el[j] == sym and (deg is None or len(adj[j]) == deg)]

    carbonyl = [i for i in range(n) if el[i] == 'C' and conn[i] == 3 and dbl_to(i, 'O', 1)]
    cnt = {g: 0 for g in ('OH', 'C=O', 'C=C', 'COOH', 'NH2', 'SH', 'Cl', 'ester', 'ether', 'amide', 'S-S', 'C=N')}
    carbonyl_set = set(carbonyl)
    for i in carbonyl:
        singles = [j for j, o in adj[i] if o == 1]
        if all(el[j] == 'C' for j in singles):
            cnt['C=O'] += 1
        for j in singles:
            if el[j] == 'O' and len(adj[j]) == 1 and nh[j] == 1:
                cnt['COOH'] += 1
            if el[j] == 'O' and len(adj[j]) == 2 and nh[j] == 0 and any(el[k] == 'C' and k != i for k, _ in adj[j]):
                cnt['ester'] += 1
            if el[j] == 'N' and conn[j] == 3:
                cnt['amide'] += 1
    for i in range(n):
        e = el[i]
        if e == 'O' and len(adj[i]) == 1 and nh[i] == 1:
            c = adj[i][0][0]
            if el[c] == 'C' and c not in carbonyl_set:
                cnt['OH'] += 1
        elif e == 'O' and len(adj[i]) == 2 and nh[i] == 0 and all(el[k] == 'C' and o == 1 for k, o in adj[i]):
            if not any(k in carbonyl_set for k, _ in adj[i]):
                cnt['ether'] += 1
        elif e == 'N' and len(adj[i]) == 1 and nh[i] == 2 and adj[i][0][0] not in carbonyl_set and el[adj[i][0][0]] == 'C':
            cnt['NH2'] += 1
        elif e == 'S' and len(adj[i]) == 1 and nh[i] == 1:
            cnt['SH'] += 1
        elif e == 'Cl':
            cnt['Cl'] += 1
    for i, j, o in bonds:
        if o == 2 and el[i] == 'C' and el[j] == 'C' and frozenset((i, j)) not in arom:
            cnt['C=C'] += 1
        if o == 1 and el[i] == 'S' and el[j] == 'S' and len(adj[i]) == 2 and len(adj[j]) == 2:
            cnt['S-S'] += 1
        if o == 2 and {el[i], el[j]} == {'C', 'N'}:
            c, nn = (i, j) if el[i] == 'C' else (j, i)
            if conn[c] == 3 and len(adj[nn]) == 2:
                cnt['C=N'] += 1
    return cnt


# --- what everything adds up to ---------------------------------------------------------------------------------------------------
def numbers(smi):
    el, bonds, nh = graph_of(smi)
    out = ring_numbers(el, bonds)
    g = group_counts(el, bonds, nh)
    out.update({'atoms': len(el), 'chain': longest_chain(el, bonds), 'diameter': diameter(el, bonds),
                'branch': branch_points(el, bonds), 'mirror': twins(el, bonds, nh), 'conj': alternating_run(el, bonds),
                'dbl': double_bonds(el, bonds), 'unsat': unsaturation(el, bonds), 'hetero': hetero_atoms(el), 'groups': g,
                'kinds': sum(1 for v in g.values() if v),
                'sites': sum(g[k] for k in ('OH', 'C=O', 'C=C', 'COOH', 'NH2', 'SH', 'Cl'))})
    return out


def compare(smiles):
    import hurdles as H
    keys = ['rings', 'ring5', 'ring6', 'ring_small', 'ring_big', 'ring_sizes', 'ring_atoms', 'fused_pairs', 'fused_block',
            'ring_systems', 'spiro', 'bridgehead', 'ring_hetero', 'ring_oxygen', 'ring_mixed', 'aromatic', 'atoms', 'chain',
            'diameter', 'branch', 'mirror', 'conj', 'dbl', 'unsat', 'hetero', 'kinds', 'sites']
    ok, bad, ex = Counter(), Counter(), {}
    for s in smiles:
        a, b = numbers(s), H.feat(s)
        for k in keys:
            if a[k] == b[k]:
                ok[k] += 1
            else:
                bad[k] += 1
                ex.setdefault(k, (s, a[k], b[k]))
        for g in H.GROUPS:
            k = 'group ' + g
            if a['groups'][g] == b['groups'][g]:
                ok[k] += 1
            else:
                bad[k] += 1
                ex.setdefault(k, (s, a['groups'][g], b['groups'][g]))
    return ok, bad, ex


def gains(pairs):
    """For (start, end) pairs: how often the GAIN (end minus start, never below 0) is the same by the graph version and by RDKit."""
    import hurdles as H
    keys = ['rings', 'ring5', 'ring6', 'fused_pairs', 'fused_block', 'ring_systems', 'spiro', 'bridgehead', 'ring_hetero',
            'ring_oxygen', 'aromatic', 'chain', 'diameter', 'branch', 'mirror', 'conj', 'dbl', 'unsat', 'hetero', 'kinds', 'atoms']
    same = Counter()
    for a, b in pairs:
        na, nb, fa, fb = numbers(a), numbers(b), H.feat(a), H.feat(b)
        for k in keys:
            same[k] += 1 if max(0, na[k] - nb[k] if False else nb[k] - na[k]) == max(0, fb[k] - fa[k]) else 0
    return {k: same[k] / float(len(pairs)) for k in keys}


def sample(n=300, pairs=False):
    import engine as E
    import hurdles as H
    import molecules
    out = set()
    prs = []
    for rnd in (1, 2, 3, 4, 5, 6, 7, 8, 9):
        for i in range(n // 9 // 2 + 1):
            rng = random.Random(i * 13 + rnd)
            smi = molecules.deal_molecule(rnd, rng, 3)
            out.add(E.canon(smi))
            eng = E.Engine()
            car = H.run_carried('g%d' % i)[rnd]
            for pl in ('greedy', 'random'):
                rr = eng.play_round(smi, car, H.RULES_BAND[rnd], E.PLAYERS[pl], 'g%d' % i, analyse=False)
                for t in rr['turns']:
                    out.add(t['smi_end'])
                    prs.append((E.canon(smi), t['smi_end']))
    return prs if pairs else sorted(out)


if __name__ == '__main__':
    sm = sample(int(sys.argv[1]) if len(sys.argv) > 1 else 300)
    ok, bad, ex = compare(sm)
    print('%d molecules' % len(sm))
    for k in ok:
        print('%-14s agree %4d  differ %3d  %s' % (k, ok[k], bad[k], ex.get(k, '')))
    g = gains(sample(int(sys.argv[1]) if len(sys.argv) > 1 else 300, pairs=True))
    print('share of rounds-turns where the GAIN over the start is the same by the graph version and by RDKit:')
    print(', '.join('%s %.3f' % kv for kv in g.items()))
