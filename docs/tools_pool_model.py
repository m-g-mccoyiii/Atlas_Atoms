"""Overreact self-reaction model. Molecules are graphs of carbons with groups; six player reactions;
twelve self-reactions run to a fixed point after each reaction that acted. No creatures.
Steps are self-reaction applications only. Step n of a page adds 50*n (pay = 50*N*(N+1)/2)."""
import itertools, random, statistics, sys, os, collections
from multiprocessing import Pool

ORDER = ['ring', 'dry', 'link', 'tuck', 'flip', 'weld', 'shift', 'snap', 'pair', 'strip', 'knit', 'seal']
BASE = ['ring', 'flip', 'dry', 'link']
FULL = ['ring', 'dry', 'link', 'tuck', 'flip', 'weld', 'shift', 'snap', 'pair']
PLUS = FULL + ['strip', 'knit', 'seal']
GROUPS = ['ring', 'flip', 'dry', 'link', 'strip', 'knit', 'seal', 'pair']   # the groups-only set: every new group has a partner, no weld/snap
RANK = {r: i for i, r in enumerate(ORDER)}
REAG = ['hydrate', 'hydroborate', 'dehydrate', 'oxidize', 'reduce', 'grow']
LINES = list(itertools.permutations(range(6), 3))
VAL = {'OH': 1, 'CO': 2, 'NH2': 1, 'SH': 1, 'COOH': 3, 'Cl': 1, 'ETH': 0, 'AR': 1, 'AROH': 2, None: 0}
CAP = 40
MAXN = 56
LOOPS = collections.Counter()   # per-process tallies
CAPHITS = [0]


class Mol:
    __slots__ = ('c', 'adj', 'dp')

    def copy(self):
        m = Mol(); m.c = self.c[:]; m.adj = [a[:] for a in self.adj]; m.dp = self.dp[:]
        return m


def hc(m, i):
    return 4 - len(m.adj[i]) - (1 if m.dp[i] >= 0 else 0) - VAL[m.c[i]]


def link(m, i, j):
    m.adj[i].append(j); m.adj[j].append(i)


def bfs(m, s, maxd=5):
    d = {s: 0}; fr = [s]
    for k in range(1, maxd + 1):
        nf = []
        for u in fr:
            for v in m.adj[u]:
                if v not in d:
                    d[v] = k; nf.append(v)
        fr = nf
    return d


# ---------------------------------------------------------------- the pool: 19 reactions (index 0..18 = numbers 1..19)
NAMES = ['hydrate', 'hydroborate', 'dehydrate', 'oxidize', 'reduce', 'grow', 'Wittig', 'dihydroxylation', 'ozonolysis',
         'Jones', 'amination', 'thiol-ene', 'chlorination', 'Williamson', 'Suzuki', 'Hofmann', 'Raney nickel',
         'decarboxylation', 'hydrogenation']
SIX = list(range(6))
NEW = list(range(6, 19))
CO2 = [0]


def size(m):
    return sum(1 for a in m.adj if a)


def new_atom(m):
    m.c.append(None); m.adj.append([]); m.dp.append(-1)
    return len(m.c) - 1


def unlink(m, i, j):
    m.adj[i].remove(j); m.adj[j].remove(i)


def kill(m, i):
    for j in list(m.adj[i]):
        m.adj[j].remove(i)
    m.adj[i] = []; m.c[i] = None; m.dp[i] = -1


def r_hydrate(m, boro=False, grp='OH'):
    acted = False
    for a in range(len(m.c)):
        b = m.dp[a]
        if b > a:
            first, second = (a, b) if hc(m, a) <= hc(m, b) else (b, a)
            if boro:
                first = second
            if m.c[first] is not None:
                continue
            m.dp[a] = m.dp[b] = -1
            m.c[first] = grp; acted = True
    return acted


def r_hydroborate(m):
    return r_hydrate(m, True)


def r_thiolene(m):
    return r_hydrate(m, True, 'SH')


def r_dehydrate(m):
    acted = False
    for i in range(len(m.c)):
        if m.c[i] != 'OH' or m.dp[i] >= 0:
            continue
        if 4 - len(m.adj[i]) < 1:
            continue
        cand = [x for x in m.adj[i] if m.dp[x] < 0 and m.c[x] in (None, 'OH') and hc(m, x) >= 1]
        if not cand:
            continue
        cand.sort(key=lambda x: (hc(m, x), x))
        t = cand[0]
        m.c[i] = None; m.dp[i] = t; m.dp[t] = i; acted = True
    return acted


def r_oxidize(m):
    acted = False
    for e in range(len(m.c)):          # chain-end C=C: the end carbon leaves as carbon dioxide
        if len(m.adj[e]) == 1 and m.dp[e] >= 0 and m.c[e] is None:
            p = m.dp[e]
            if m.c[p] is None and len(m.adj[p]) <= 3:
                unlink(m, e, p); m.dp[e] = m.dp[p] = -1; m.c[p] = 'CO'; acted = True
                CO2[0] += 1
    for i in range(len(m.c)):
        if m.c[i] == 'OH' and m.dp[i] < 0 and hc(m, i) >= 1:
            m.c[i] = 'CO'; acted = True
    return acted


def r_reduce(m):
    acted = False
    for i in range(len(m.c)):
        if m.c[i] == 'CO' and len(m.adj[i]) == 1:
            m.c[i] = 'OH'; acted = True
    return acted


def r_grow(m):
    acted = False
    for i in range(len(m.c)):
        if m.c[i] == 'CO' and len(m.adj[i]) <= 2 and size(m) + 3 <= MAXN:
            m.c[i] = 'OH'
            a = new_atom(m); b = new_atom(m); d = new_atom(m)
            link(m, i, a); link(m, a, b); link(m, b, d)
            m.dp[b] = d; m.dp[d] = b
            acted = True
    return acted


def r_wittig(m):
    acted = False
    for i in range(len(m.c)):
        if m.c[i] == 'CO' and len(m.adj[i]) <= 2 and size(m) + 1 <= MAXN:
            k = new_atom(m); link(m, i, k); m.c[i] = None; m.dp[i] = k; m.dp[k] = i; acted = True
    return acted


def r_dihydroxylation(m):
    acted = False
    for a in range(len(m.c)):
        b = m.dp[a]
        if b > a and m.c[a] is None and m.c[b] is None:
            m.dp[a] = m.dp[b] = -1; m.c[a] = m.c[b] = 'OH'; acted = True
    return acted


def comp(m, s):
    seen = {s}; fr = [s]
    while fr:
        nf = []
        for u in fr:
            for v in m.adj[u]:
                if v not in seen:
                    seen.add(v); nf.append(v)
        fr = nf
    return seen


def r_ozonolysis(m):
    acted = False
    for a in range(len(m.c)):
        b = m.dp[a]
        if b > a and m.c[a] is None and m.c[b] is None and len(m.adj[a]) >= 2 and len(m.adj[b]) >= 2:
            unlink(m, a, b); m.dp[a] = m.dp[b] = -1
            ca = comp(m, a)
            if b not in ca:
                cb = comp(m, b)
                drop = ca if len(ca) < len(cb) else cb
                for x in drop:
                    m.c[x] = None; m.adj[x] = []; m.dp[x] = -1
            m.c[a] = m.c[b] = 'CO'
            acted = True
    return acted


def r_jones(m):
    acted = False
    for i in range(len(m.c)):
        if m.c[i] == 'CO' and len(m.adj[i]) == 1:
            m.c[i] = 'COOH'; acted = True
    return acted


def r_amination(m):
    acted = False
    for i in range(len(m.c)):
        if m.c[i] == 'CO':
            m.c[i] = 'NH2'; acted = True
    return acted


def r_chlorination(m):
    acted = False
    for i in range(len(m.c)):
        if m.c[i] == 'OH':
            m.c[i] = 'Cl'; acted = True
    return acted


def r_williamson(m):
    acted = False
    while True:
        best = None
        for i in [k for k, x in enumerate(m.c) if x == 'Cl']:
            d = bfs(m, i, 5)
            for j in [k for k, x in enumerate(m.c) if x == 'OH']:
                if d.get(j) in (3, 4, 5):
                    key = (d[j], i, j)
                    if best is None or key < best:
                        best = key
        if best is None:
            return acted
        _, i, j = best
        m.c[i] = m.c[j] = 'ETH'; link(m, i, j); acted = True


def r_suzuki(m):
    acted = False
    for i in range(len(m.c)):
        if m.c[i] == 'Cl' and size(m) + 6 <= MAXN:
            r = [new_atom(m) for _ in range(6)]
            for k in range(6):
                link(m, r[k], r[(k + 1) % 6]); m.c[r[k]] = 'AR'
            m.c[r[1]] = 'AROH'
            m.c[i] = None; link(m, i, r[0]); acted = True
    return acted


def r_hofmann(m):
    acted = False
    for i in range(len(m.c)):
        if m.c[i] == 'NH2':
            cand = [x for x in m.adj[i] if m.dp[x] < 0 and m.c[x] is None and hc(m, x) >= 1]
            if not cand:
                continue
            cand.sort(key=lambda x: (-hc(m, x), x))
            t = cand[0]
            m.c[i] = None; m.dp[i] = t; m.dp[t] = i; acted = True
    return acted


def r_raney(m):
    acted = False
    for i in range(len(m.c)):
        if m.c[i] == 'SH':
            m.c[i] = None; acted = True
    return acted


def r_decarb(m):
    acted = False
    for i in range(len(m.c)):
        if m.c[i] == 'COOH':
            kill(m, i); acted = True; CO2[0] += 1
    return acted


def r_hydrogenation(m):
    acted = False
    for a in range(len(m.c)):
        b = m.dp[a]
        if b > a:
            m.dp[a] = m.dp[b] = -1; acted = True
    return acted


RX = [r_hydrate, r_hydroborate, r_dehydrate, r_oxidize, r_reduce, r_grow, r_wittig, r_dihydroxylation, r_ozonolysis,
      r_jones, r_amination, r_thiolene, r_chlorination, r_williamson, r_suzuki, r_hofmann, r_raney, r_decarb,
      r_hydrogenation]


# ---------------------------------------------------------------- self-reactions
def find(m, rules, touched):
    c = m.c; n = len(c)
    by = collections.defaultdict(list)
    for i in range(n):
        if c[i]:
            by[c[i]].append(i)
    OH, CO = by['OH'], by['CO']
    cache = {}

    def D(i):
        d = cache.get(i)
        if d is None:
            d = cache[i] = bfs(m, i)
        return d
    out = []

    def add(rule, dist, ids, args):
        fresh = 0 if (touched and any(x in touched for x in ids)) else 1
        out.append((dist, fresh, RANK[rule], ids, rule, args))
    if 'flip' in rules:
        for i in OH:
            if m.dp[i] >= 0:
                add('flip', 0, (i,), (i,))
    if 'ring' in rules:
        for i in OH + by['AROH']:
            di = D(i)
            for j in CO:
                if di.get(j) in (3, 4):
                    add('ring', di[j], (i, j), (i, j))
    if 'dry' in rules or 'strip' in rules:
        for name, src in (('dry', OH), ('strip', by['Cl'])):
            if name not in rules:
                continue
            if name not in rules:
                continue
            for i in src:
                if name != 'pop' and m.dp[i] >= 0:
                    continue
                for j in CO:
                    di = D(i)
                    if di.get(j) == 2:
                        mids = [x for x in m.adj[i] if x in m.adj[j]]
                        for mm in mids:
                            if m.dp[mm] < 0 and c[mm] is None and hc(m, mm) >= 1 and (name == 'pop' or 4 - len(m.adj[i]) >= 1):
                                add(name, 2, (i, j, mm), (i, j, mm)); break
    dbls = [(a, m.dp[a]) for a in range(n) if m.dp[a] >= 0]   # both orientations
    if 'shift' in rules or 'tuck' in rules:
        for j in CO:
            dj = D(j)
            for a, b in dbls:
                if dj.get(a) == 2 and dj.get(b) == 3 and 'shift' in rules and not any(c[x] == 'CO' for x in m.adj[a] + m.adj[b]):
                    for mm in m.adj[a]:
                        if dj.get(mm) == 1 and m.dp[mm] < 0 and c[mm] is None and hc(m, mm) >= 1:
                            add('shift', 2, (a, b, j), (a, b, mm)); break
                if 'tuck' in rules and dj.get(a) == 1 and dj.get(b) == 2 and OH:
                    db = D(b)
                    for k in OH:
                        if k not in (a, b, j) and db.get(k) in (3, 4):
                            add('tuck', db[k], (a, b, k), (a, b, k))
    if 'weld' in rules and len(CO) >= 2:
        for j1 in CO:
            for p in m.adj[j1]:
                if c[p] is None and m.dp[p] < 0 and hc(m, p) >= 1:
                    dp_ = D(p)
                    for j2 in CO:
                        if j2 != j1 and j2 != p and dp_.get(j2) in (4, 5):
                            add('weld', dp_[j2], (j1, p, j2), (p, j2))
    if 'snap' in rules and len(dbls) >= 6:   # dbls has both orientations: need three double bonds
        for a, b in dbls:
            for cc in m.adj[b]:
                d_ = m.dp[cc]
                if cc != a and d_ >= 0 and d_ != b:
                    # diene a=b-cc=d_ ; d_ is the end
                    dd = D(d_)
                    for e, f in dbls:
                        if e in (a, b, cc, d_) or f in (a, b, cc, d_):
                            continue
                        if dd.get(e) in (4, 5):
                            add('snap', dd[e], (a, b, cc, d_, e, f), (a, b, cc, d_, e, f))
    if 'link' in rules:
        for i in by['NH2']:
            di = D(i)
            for j in by['COOH']:
                if di.get(j) in (3, 4):
                    add('link', di[j], (i, j), (i, j))
    if 'knit' in rules:
        for i in by['NH2']:
            for j in CO:
                dj = D(j)
                if dj.get(i) in (3, 4) and len(m.adj[j]) <= 2:
                    for nn in m.adj[j]:
                        if D(i).get(nn, 9) > D(i)[j] and m.dp[nn] < 0 and c[nn] is None and hc(m, nn) >= 1:
                            add('knit', dj[i], (i, j, nn), (i, j, nn)); break
    if 'seal' in rules:
        for i in by['COOH']:
            di = D(i)
            for j in OH:
                if di.get(j) in (3, 4):
                    add('seal', di[j], (i, j), (i, j))
    if 'pair' in rules:
        sh = by['SH']
        for x in range(len(sh)):
            dx = D(sh[x])
            for y in range(x + 1, len(sh)):
                if dx.get(sh[y]) in (2, 3):
                    add('pair', dx[sh[y]], (sh[x], sh[y]), (sh[x], sh[y]))
    return out


def apply(m, cand):
    rule, a = cand[4], cand[5]
    c, dp = m.c, m.dp
    if rule == 'ring':
        i, j = a; c[i] = 'ETH'; c[j] = 'OH'; link(m, i, j)
    elif rule == 'dry' or rule == 'strip':
        i, j, mm = a; c[i] = None; dp[i] = mm; dp[mm] = i
    elif rule == 'flip':
        i, = a; k = dp[i]; dp[i] = dp[k] = -1; c[i] = 'CO'
    elif rule == 'shift':
        x, y, mm = a; dp[y] = -1; dp[x] = mm; dp[mm] = x
    elif rule == 'tuck':
        x, y, k = a; dp[x] = dp[y] = -1; c[k] = 'ETH'; link(m, k, y)
    elif rule == 'weld':
        p, j2 = a; c[j2] = 'OH'; link(m, p, j2)
    elif rule == 'snap':
        a_, b, cc, d, e, f = a
        dp[a_] = dp[b] = dp[cc] = dp[d] = dp[e] = dp[f] = -1
        dp[b] = cc; dp[cc] = b
        link(m, d, e); link(m, a_, f)
    elif rule == 'knit':
        i, j, nn = a; c[i] = 'ETH'; c[j] = None; link(m, i, j); dp[j] = nn; dp[nn] = j
    elif rule == 'link' or rule == 'pair' or rule == 'seal':
        i, j = a; c[i] = c[j] = 'ETH'; link(m, i, j)


def fixed_point(m, rules):
    """Returns the list of rule names applied; flags loop / cap in LOOPS / CAPHITS."""
    steps = []; touched = None; seen = {}
    while True:
        cands = find(m, rules, touched)
        if not cands:
            return steps
        cand = min(cands, key=lambda x: x[:4])
        apply(m, cand)
        steps.append(cand[4]); touched = set(cand[3])
        sig = (tuple(m.c), tuple(m.dp), sum(len(a) for a in m.adj))
        if sig in seen:
            LOOPS[tuple(sorted(set(steps[seen[sig]:])))] += 1
            return steps
        seen[sig] = len(steps)
        if len(steps) >= CAP:
            CAPHITS[0] += 1
            return steps


WPAY = [os.environ.get('WPAY') == '1']
RINGS = [0]


def fire(m, r, rules):
    if r == 13:
        before = sum(len(a) for a in m.adj)
    if RX[r](m):
        pre = []
        if r == 13 and WPAY[0]:
            pre = ['Williamson-ring'] * ((sum(len(a) for a in m.adj) - before) // 2)
        return pre + fixed_point(m, rules)
    return None


def pay(n):
    return 50 * n * (n + 1) // 2


def leaves(m0, hand, rules, k=3):
    """All ordered lines of k from hand (shared prefixes). Returns (line, steps, maxchain, chains, mol)."""
    out = []

    def rec(m, line, chains):
        if len(line) == k:
            tot = sum(len(x) for x in chains)
            out.append((tuple(line), tot, max((len(x) for x in chains), default=0), chains, m)); return
        for r in hand:
            if r in line:
                continue
            u = m.copy()
            ch = fire(u, r, rules)
            rec(u, line + [r], chains + ([ch] if ch is not None else []))
    rec(m0, [], [])
    return out


def deal(carried, rng, n=5):
    if len(carried) <= n:
        return list(carried)
    return rng.sample(list(carried), n)


# ---------------------------------------------------------------- molecules
def free(m, i):
    return m.c[i] is None and m.dp[i] < 0


def gen(stage, rng, extra=True):
    L = {'early': rng.randint(12, 16), 'middle': rng.randint(19, 25), 'late': rng.randint(29, 35)}[stage]
    arms = {'early': 0, 'middle': 1, 'late': 2}[stage]
    m = Mol(); m.c = [None] * L; m.adj = [[] for _ in range(L)]; m.dp = [-1] * L
    for i in range(1, L):
        link(m, i - 1, i)
    pos = rng.choice([0, 1, 2])
    while pos < L:
        r = rng.random()
        if r < 0.30:
            if free(m, pos): m.c[pos] = 'OH'
        elif r < 0.65:
            if free(m, pos) and len(m.adj[pos]) <= 2: m.c[pos] = 'CO'
        else:
            if pos + 1 < L and free(m, pos) and free(m, pos + 1):
                m.dp[pos] = pos + 1; m.dp[pos + 1] = pos
        pos += rng.choice([2, 3, 3, 3, 4, 4, 5, 6])
    if 'OH' not in m.c: m.c[min(L - 1, 1)] = m.c[min(L - 1, 1)] or 'OH'
    if 'CO' not in m.c:
        k = rng.randint(L // 2, L - 1)
        if free(m, k): m.c[k] = 'CO'
    for _ in range(arms):
        base = rng.randint(1, L - 2)
        if len(m.adj[base]) != 2 or m.c[base] in ('CO',):
            continue
        k = rng.choice([2, 3]); prev = base
        for t in range(k):
            s = new_atom(m); link(m, prev, s); prev = s
        r = rng.random()
        if r < 0.4: m.c[prev] = 'CO'
        elif r < 0.6: m.c[prev] = 'OH'
    if extra:
        n = len(m.c)
        if rng.random() < 0.35:            # chain-end C=C
            ends = [i for i in range(n) if len(m.adj[i]) == 1 and free(m, i)]
            if ends:
                e = rng.choice(ends); a = new_atom(m); b = new_atom(m); link(m, e, a); link(m, a, b)
                m.dp[a] = b; m.dp[b] = a
        if rng.random() < 0.20:            # ring C=C (cyclohexene arm)
            hs = [i for i in range(n) if free(m, i) and len(m.adj[i]) <= 2]
            if hs:
                h = rng.choice(hs); r = [new_atom(m) for _ in range(6)]
                for k in range(6): link(m, r[k], r[(k + 1) % 6])
                link(m, h, r[0]); m.dp[r[2]] = r[3]; m.dp[r[3]] = r[2]
        for g, p in (('NH2', 0.15), ('SH', 0.10)):
            if rng.random() < p:
                cs = [i for i in range(n) if free(m, i) and len(m.adj[i]) <= 2]
                if cs: m.c[rng.choice(cs)] = g
    return m


def mixed(seed):
    rng = random.Random(seed)
    return gen(['early', 'middle', 'late'][seed % 3], rng)


def show(m):
    g = []
    for i in range(len(m.c)):
        if not m.adj[i]:
            continue
        t = (m.c[i] or '') + ('=%d' % m.dp[i] if m.dp[i] > i else '')
        if t:
            g.append('%d:%s' % (i, t))
    n = size(m); e = sum(len(a) for a in m.adj) // 2
    return '%d atoms, %d rings; %s' % (n, e - n + 1, ' '.join(g))
