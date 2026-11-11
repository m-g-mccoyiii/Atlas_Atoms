"""Overreact self-reaction model. Molecules are graphs of carbons with groups; six player reactions;
twelve self-reactions run to a fixed point after each reaction that acted. No creatures.
Steps are self-reaction applications only. Step n of a page adds 50*n (pay = 50*N*(N+1)/2)."""
import itertools, random, statistics, sys, os, collections
from multiprocessing import Pool

ORDER = ['ring', 'dry', 'tuck', 'flip', 'weld', 'shift', 'snap', 'strip', 'knit', 'pop', 'seal', 'pair']
RANK = {r: i for i, r in enumerate(ORDER)}
REAG = ['hydrate', 'hydroborate', 'dehydrate', 'oxidize', 'reduce', 'grow']
LINES = list(itertools.permutations(range(6), 3))
VAL = {'OH': 1, 'CO': 2, 'NH2': 1, 'SH': 1, 'COOH': 1, 'Cl': 1, 'ETH': 0, None: 0}
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


# ---------------------------------------------------------------- player reactions
def r_hydrate(m, boro=False):
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
            m.c[first] = 'OH'; acted = True
    return acted


def r_hydroborate(m):
    return r_hydrate(m, True)


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
        cand.sort(key=lambda x: (0 if m.c[x] == 'OH' else 1, x))
        t = cand[0]
        m.c[i] = None; m.dp[i] = t; m.dp[t] = i; acted = True
    return acted


def r_oxidize(m):
    acted = False
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
        if m.c[i] == 'CO' and len(m.adj[i]) <= 2 and len(m.c) + 3 <= MAXN:
            m.c[i] = 'OH'
            a = len(m.c)
            m.c += [None, None, None]; m.adj += [[], [], []]; m.dp += [-1, -1, -1]
            link(m, i, a); link(m, a, a + 1); link(m, a + 1, a + 2)
            m.dp[a + 1] = a + 2; m.dp[a + 2] = a + 1
            acted = True
    return acted


RX = [r_hydrate, r_hydroborate, r_dehydrate, r_oxidize, r_reduce, r_grow]


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
        for i in OH:
            di = D(i)
            for j in CO:
                if di.get(j) in (3, 4):
                    add('ring', di[j], (i, j), (i, j))
    if 'dry' in rules or 'strip' in rules or 'pop' in rules:
        for name, src in (('dry', OH), ('strip', by['Cl']), ('pop', by['COOH'])):
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
    if 'knit' in rules:
        for i in by['NH2']:
            for j in CO:
                dj = D(j)
                if dj.get(i) in (3, 4) and len(m.adj[j]) <= 2:
                    for nn in m.adj[j]:
                        if dj.get(i) is not None and D(i).get(nn, 9) > D(i)[j] and m.dp[nn] < 0 and c[nn] is None and hc(m, nn) >= 1:
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
    elif rule == 'pop':
        i, j, mm = a; c[i] = None; c[j] = 'OH'; dp[j] = mm; dp[mm] = j
    elif rule == 'seal' or rule == 'pair':
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


def fire(m, r, rules):
    if RX[r](m):
        return fixed_point(m, rules)
    return None


def leaves(m0, rules):
    """All 120 lines with shared prefixes. Returns list of (line, steps_total, chains, mol)."""
    out = []

    def rec(m, line, chains):
        if len(line) == 3:
            tot = sum(len(x) for x in chains)
            out.append((tuple(line), tot, chains, m)); return
        for r in range(6):
            if r in line:
                continue
            u = m.copy()
            ch = fire(u, r, rules)
            rec(u, line + [r], chains + ([ch] if ch is not None else []))
    rec(m0, [], [])
    return out


def pay(n):
    return 50 * n * (n + 1) // 2


def play_line(m0, line, rules):
    m = m0.copy(); chains = []
    for r in line:
        ch = fire(m, r, rules)
        if ch is not None:
            chains.append(ch)
    return sum(len(x) for x in chains), chains, m


# ---------------------------------------------------------------- molecules
def gen(stage, rng, rich):
    L = {'early': rng.randint(12, 16), 'middle': rng.randint(19, 25), 'late': rng.randint(29, 35)}[stage]
    pe = {'early': 0.10, 'middle': 0.22, 'late': 0.35}[stage] if rich else 0
    arms = {'early': 0, 'middle': 1, 'late': 2}[stage]
    m = Mol(); m.c = [None] * L; m.adj = [[] for _ in range(L)]; m.dp = [-1] * L
    for i in range(1, L):
        link(m, i - 1, i)
    pos = rng.choice([0, 1, 2]); groups = []
    while pos < L:
        r = rng.random()
        if r < 0.30:
            if m.c[pos] is None and m.dp[pos] < 0: m.c[pos] = 'OH'
        elif r < 0.65:
            if m.c[pos] is None and m.dp[pos] < 0 and len(m.adj[pos]) <= 2: m.c[pos] = 'CO'
        else:
            if pos + 1 < L and m.dp[pos] < 0 and m.dp[pos + 1] < 0 and m.c[pos] is None and m.c[pos + 1] is None:
                m.dp[pos] = pos + 1; m.dp[pos + 1] = pos
        groups.append(pos)
        pos += rng.choice([2, 3, 3, 3, 4, 4, 5, 6])
    if 'OH' not in m.c: m.c[min(L - 1, 1)] = m.c[min(L - 1, 1)] or 'OH'
    if 'CO' not in m.c:
        k = rng.randint(L // 2, L - 1)
        if m.c[k] is None and m.dp[k] < 0: m.c[k] = 'CO'
    def free(i): return m.c[i] is None and m.dp[i] < 0
    for _ in range(arms):
        base = rng.randint(1, L - 2)
        if len(m.adj[base]) != 2 or m.c[base] in ('CO',):
            continue
        k = rng.choice([2, 3]); s = len(m.c); prev = base
        for t in range(k):
            m.c.append(None); m.adj.append([]); m.dp.append(-1); link(m, prev, s + t); prev = s + t
        r = rng.random()
        if r < 0.4: m.c[prev] = 'CO'
        elif r < 0.6: m.c[prev] = 'OH'
    if rich:
        n = len(m.c)
        def put(g, ends=False):
            cands = [i for i in range(n) if free(i) and (len(m.adj[i]) == 1 if ends else len(m.adj[i]) <= 2)]
            if cands:
                m.c[rng.choice(cands)] = g
        if rng.random() < pe: put('Cl')
        if rng.random() < pe: put('NH2')
        if rng.random() < pe: put('COOH', True)
        if rng.random() < pe:
            cands = [i for i in range(n) if free(i)]
            if cands:
                i = rng.choice(cands); d = bfs(m, i, 3)
                js = [j for j, k in d.items() if k in (2, 3) and free(j)]
                if js:
                    m.c[i] = 'SH'; m.c[rng.choice(js)] = 'SH'
    return m


def trig(m):
    s = set(x for x in m.c if x)
    return s


# ---------------------------------------------------------------- players
def best_leaf(m0, rules, rng):
    lv = leaves(m0, rules)
    mx = max(x[1] for x in lv)
    top = [x for x in lv if x[1] == mx]
    return rng.choice(top), lv


def greedy_round(m0, rules, rng):
    m = m0; pages = []
    for _ in range(3):
        (line, tot, chains, m), lv = best_leaf(m, rules, rng)
        pages.append((tot, chains))
    return pages


def random_round(m0, rules, rng):
    m = m0; pages = []
    for _ in range(3):
        line = rng.choice(LINES)
        tot, chains, m = play_line(m, line, rules)
        pages.append((tot, chains))
    return pages


def look_round(m0, rules, rng):
    """top 4 first-page lines by steps (distinct states), top 3 second pages each, then greedy third."""
    lv = sorted(leaves(m0, rules), key=lambda x: (-x[1], rng.random()))
    seen = set(); best = None; k1 = 0
    for line, t1, ch1, m1 in lv:
        sig = (tuple(m1.c), tuple(m1.dp))
        if sig in seen:
            continue
        seen.add(sig); k1 += 1
        lv2 = sorted(leaves(m1, rules), key=lambda x: (-x[1], rng.random()))
        seen2 = set(); k2 = 0
        for line2, t2, ch2, m2 in lv2:
            s2 = (tuple(m2.c), tuple(m2.dp))
            if s2 in seen2:
                continue
            seen2.add(s2); k2 += 1
            lv3 = leaves(m2, rules)
            t3 = max(x[1] for x in lv3)
            tot = pay(t1) + pay(t2) + pay(t3)
            if best is None or tot > best:
                best = tot
            if k2 >= 3:
                break
        if k1 >= 4:
            break
    return best


def round_pay(pages):
    return sum(pay(t) for t, _ in pages)


# ---------------------------------------------------------------- measurement jobs
def stats_job(args):
    """Steps per page for greedy and random on one molecule, with rule tallies."""
    stage, seed, rules, rich = args
    LOOPS.clear(); CAPHITS[0] = 0
    rng = random.Random(seed)
    m0 = gen(stage, rng, rich)
    tr = trig(m0)
    g = greedy_round(m0, rules, rng)
    r = random_round(m0, rules, rng)
    fires = collections.Counter(); pagesfired = collections.Counter(); ends = collections.Counter(); nchains = 0
    kinds = []
    for tot, chains in g:
        ks = set()
        for ch in chains:
            if ch:
                nchains += 1; ends[ch[-1]] += 1
            for x in ch:
                fires[x] += 1; ks.add(x)
        for x in ks:
            pagesfired[x] += 1
        kinds.append(len(ks))
    return dict(stage=stage, g=[t for t, _ in g], r=[t for t, _ in r], kinds=kinds, fires=fires, pagesfired=pagesfired,
                ends=ends, nchains=nchains, loops=dict(LOOPS), cap=CAPHITS[0], tr=tr,
                gmax=[max((len(ch) for ch in c), default=0) for _, c in g])


def hurt_job(args):
    stage, seed, rules = args
    LOOPS.clear(); CAPHITS[0] = 0
    rng = random.Random(seed)
    m0 = gen(stage, rng, True)
    full = max(x[1] for x in leaves(m0, rules))
    res = {}
    for r in rules:
        sub = [x for x in rules if x != r]
        res[r] = max(x[1] for x in leaves(m0, sub))
    return dict(stage=stage, full=full, drop=res, tr=trig(m0))


def tier1_job(args):
    stage, seed, rules = args
    rng = random.Random(seed)
    m0 = gen(stage, rng, False)
    g = round_pay(greedy_round(m0, rules, rng))
    rs = [round_pay(random_round(m0, rules, rng)) for _ in range(8)]
    lk = look_round(m0, rules, rng)
    return dict(g=g, r=statistics.mean(rs), l=lk, rmax=max(rs), rmin=min(rs))
