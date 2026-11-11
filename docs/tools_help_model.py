"""Overreact homunculus strength model.

Chain model of a molecule (a tree of carbons: main chain plus arms and sprouts),
a greedy player over three pages with the six starting reactions, the game's
ring scoring, and one small function per creature.

Run:  python hom_model.py [molecules_per_stage]
"""
import itertools, os, random, statistics, sys
NEW = int(os.environ.get('NEW', 0))   # NEW=1 turns on every changed rule; any single flag below can still override
def E(k, old, new): return int(os.environ.get(k, new if NEW else old))
WATER_V = E('WATER_V', 0, 1); ARMS = E('ARMS', 3, 2); EVERY = E('EVERY', 4, 6)
SEEDNEED = E('SEEDNEED', 2, 3); AMM_NH2 = E('AMM_NH2', 0, 1); AMMNEED = E('AMMNEED', 2, 2); HYDNEED = E('HYDNEED', 3, 3)
BRIML = E('BRIML', 0, 8); BRIM_SH = int(os.environ.get('BRIM_SH', 0))   # BRIML>0: fire burns only the next BRIML plain carbons; OH on the 4th, then C=O on every 4th
ACIDEXT = int(os.environ.get('ACIDEXT', 2))
ACID = os.environ.get('ACID', 'g' if NEW else '')   # '', 'a', 'b', 'c'(a+b), 'd' (extra rule)
SALTCAP = int(os.environ.get('SALTCAP', 3)); ONLY = os.environ.get('ONLY', '')
from multiprocessing import Pool

# carbon states
BARE, OH, CO, CC, NH2, RING, ROH, DEAD = 0, 1, 2, 3, 4, 5, 6, 7
# RING = OH used up in a closed ring, ROH = the free OH a ring leaves (protected)
MAXN = 56
W, H, C, F, N = 0, 1, 2, 3, 4          # feed counters: water, hydrogen, co2, fumes, ammonia
RD, SA, SU, SE, BO, PSH = 5, 6, 7, 8, 9, 10   # reduces, salt oxidizes, sulfurs, grows, boranes, SH groups waiting
NFEED = 11
T = 0                                   # phase the creature is used in: 0 = before the line, 3 = after
REAG = ['hydrate', 'hydroborate', 'dehydrate', 'oxidize', 'reduce', 'grow']
LINES = list(itertools.permutations(range(6), 3))   # ordered lines of 3 different reactions
TOPO = {}


def topo(par, br=None, ext=0):
    key = (tuple(par), br, ext)
    t = TOPO.get(key)
    if t:
        return t
    n = len(par)
    adj = [[] for _ in range(n + 2)]
    kids = [[] for _ in range(n)]
    for i in range(1, n):
        p = par[i]
        adj[i].append(p); adj[p].append(i); kids[p].append(i)
    if br:
        a, b = br
        for u, v in ((a, n), (n, n + 1), (n + 1, b)):
            adj[u].append(v); adj[v].append(u)
    reach = []
    for s in range(n):
        seen = {s}; fr = [s]; out = []
        for d in range(1, 5 + ext):
            nf = []
            for u in fr:
                for v in adj[u]:
                    if v not in seen:
                        seen.add(v); nf.append(v)
                        if d >= 3:
                            out.append((d, 0 if v > s else 1, v))
            fr = nf
        out.sort()
        reach.append([v for _, _, v in out if v < n])
    TOPO[key] = (reach, kids)
    return TOPO[key]


class Mol:
    __slots__ = ('c', 'par', 'rings', 'nf', 'n', 'pay', 'L', 'feed', 'br', 'salt', 'scnt', 'ext')

    def copy(self):
        m = Mol()
        m.c = self.c[:]; m.par = self.par[:]; m.rings = self.rings[:]
        m.nf = self.nf; m.n = self.n; m.pay = self.pay; m.L = self.L
        m.feed = self.feed[:]
        m.br = self.br; m.salt = self.salt; m.scnt = self.scnt; m.ext = self.ext
        return m

    def assign(self, o):
        self.c = o.c; self.par = o.par; self.rings = o.rings
        self.nf = o.nf; self.n = o.n; self.pay = o.pay; self.L = o.L; self.feed = o.feed
        self.br = o.br; self.salt = o.salt; self.scnt = o.scnt; self.ext = o.ext


def make(c, sh=0):
    m = Mol()
    m.c = list(c); m.par = [-1] + list(range(len(c) - 1)); m.rings = []
    m.nf = 0; m.n = 0; m.pay = 0.0; m.L = 0; m.feed = [0] * NFEED; m.feed[PSH] = sh
    m.br = None; m.salt = -1; m.scnt = 0; m.ext = 0
    return m


def alive(m):
    return sum(1 for x in m.c if x != DEAD)


# ---------------------------------------------------------------- zip and score
def cascade(m):
    """OH takes the nearest C=O 3 or 4 carbons away, closing a ring; repeat."""
    c = m.c
    reach, _ = topo(m.par, m.br, m.ext)
    while True:
        order = []
        if m.rings and c[m.rings[-1][1]] == ROH:
            order.append(m.rings[-1][1])
        order += [i for i, x in enumerate(c) if x == OH]
        hit = None
        for i in order:
            for j in reach[i]:
                if c[j] == CO and not (j == m.salt and m.scnt >= SALTCAP):
                    hit = (i, j); break
            if hit:
                break
        if not hit:
            return
        i, j = hit
        c[i] = RING
        if j == m.salt:
            m.scnt += 1
        else:
            c[j] = ROH
        m.rings.append(hit)
        m.n += 1
        # ring n adds 50*n; a repeat inside the longest row so far pays a quarter
        m.pay += 50 * m.n * (1.0 if m.n > m.L else 0.25)


def start_page(m):
    m.scnt = 0
    m.n = m.nf
    m.pay = sum(50 * k for k in range(1, m.nf + 1))     # frozen rings pay in full


def end_page(m):
    m.L = max(m.L, m.n)
    for i, j in reversed(m.rings[m.nf:]):
        m.c[j] = CO; m.c[i] = OH
    del m.rings[m.nf:]


# ---------------------------------------------------------------- the six reactions
def _leaf(m, i, kids):
    return all(m.c[k] == DEAD for k in kids[i])


def r_hydrate(m, boro=False):
    c = m.c; _, kids = topo(m.par); acted = False
    for i in range(len(c)):
        if c[i] != CC:
            continue
        tgt = i
        if boro:
            for k in kids[i]:
                if c[k] == BARE:
                    tgt = k; break
            else:
                p = m.par[i]
                if p >= 0 and c[p] == BARE:
                    tgt = p
        if tgt != i:
            c[i] = BARE
        c[tgt] = OH; acted = True
        if boro and c[tgt] == OH:
            m.feed[BO] += 1
    if acted and not boro:
        m.feed[F] += 1
    return acted


def r_hydroborate(m):
    return r_hydrate(m, True)


def r_dehydrate(m):
    c = m.c; acted = False
    for i in range(len(c)):
        if c[i] == OH:
            c[i] = CC; m.feed[W] += 1; acted = True
    if acted:
        m.feed[F] += 1
    return acted


def r_oxidize(m):
    c = m.c; _, kids = topo(m.par); acted = False
    if m.feed[PSH]:
        m.feed[SU] += m.feed[PSH]; m.feed[PSH] = 0
    for i in range(len(c)):
        x = c[i]
        if x == OH:
            live = [k for k in kids[i] if c[k] != DEAD]
            if (m.par[i] >= 0 and not live) or (m.par[i] < 0 and len(live) == 1):
                m.feed[SA] += 1
            c[i] = CO; m.feed[H] += 1; acted = True
        elif x == NH2:
            c[i] = CO; m.feed[N] += 1; acted = True
        elif x == CC and m.par[i] >= 0 and _leaf(m, i, kids):
            p = m.par[i]
            if c[p] in (BARE, OH, CO, CC):          # end carbon leaves as CO2, C=O at the new end
                c[i] = DEAD; c[p] = CO; m.feed[C] += 1; acted = True
    return acted


def r_reduce(m):
    c = m.c; _, kids = topo(m.par); acted = False
    for i in range(len(c)):
        if c[i] == CO and i != m.salt:
            live = [k for k in kids[i] if c[k] != DEAD]
            end = (m.par[i] >= 0 and not live) or (m.par[i] < 0 and len(live) == 1)
            if end:
                c[i] = OH; acted = True; m.feed[RD] += 1
    return acted


def r_grow(m):
    c = m.c; acted = False
    for i in range(len(c)):
        if c[i] == CO and i != m.salt and alive(m) + 3 <= MAXN:
            c[i] = OH; m.feed[SE] += 1
            a = len(c)
            c += [BARE, BARE, CC]
            m.par += [i, a, a + 1]
            acted = True
    return acted


RX = [r_hydrate, r_hydroborate, r_dehydrate, r_oxidize, r_reduce, r_grow]


def fire(m, r):
    if RX[r](m):
        cascade(m)
        return True
    return False


# ---------------------------------------------------------------- the creatures
# each takes (m, line) and returns 0 = not fed, 1 = fed but nothing to do, 2 = acted.
def water(m, line):
    """Flood: every C=C to OH, every open ring opens, the zip runs again, rings count on."""
    if m.feed[W] < 3:
        return 0
    cc = [i for i, x in enumerate(m.c) if x == CC]
    if not cc and len(m.rings) == m.nf:
        return 1
    for i in cc:
        m.c[i] = OH
    for i, j in reversed(m.rings[m.nf:]):
        m.c[j] = CO; m.c[i] = OH
    del m.rings[m.nf:]
    if WATER_V:
        m.L = max(m.L, m.n); m.n = m.nf
    cascade(m)
    return 2


def hydrogen(m, line):
    """Where the rings stop, the first C=O past the gap becomes OH and the rings go on."""
    if m.feed[H] < HYDNEED:
        return 0
    c = m.c
    cands = []
    if m.rings and c[m.rings[-1][1]] == ROH:
        cands.append(m.rings[-1][1])
    cands += [i for i, x in enumerate(c) if x == OH]
    best = None
    for a in cands:
        j = next((j for j in range(a + 1, len(c)) if c[j] == CO), None)
        if j is None:
            continue
        t = m.copy(); t.c[j] = OH; cascade(t)
        if best is None or t.pay > best.pay:
            best = t
    if best is None:
        return 1
    m.assign(best)
    return 2


def carbon_dioxide(m, line):
    """Freeze the rings this page closed: they stay shut all round and pay in full."""
    if m.feed[C] < 3:
        return 0
    if len(m.rings) == m.nf:
        return 1
    m.nf = len(m.rings)
    j = m.rings[-1][1]
    if m.c[j] == ROH:
        m.c[j] = OH
    return 2


def _cuts(m, wide):
    c = m.c; _, kids = topo(m.par)
    live = lambda u: [x for x in kids[u] if c[x] != DEAD]
    cuts = []
    if not wide:
        func = (OH, CO, NH2, RING, ROH)
        for a in range(len(c)):
            if c[a] not in func:
                continue
            for k in kids[a]:
                if c[k] == DEAD:
                    continue
                run = []; u = k
                while c[u] in (BARE, CC) and len(live(u)) == 1:
                    run.append(u); u = live(u)[0]
                if run and c[u] in func and len(run) > 3:
                    cuts.append((a, run, u))
    else:
        first_oh = next((i for i, x in enumerate(c) if x == OH), -1)
        for a in range(len(c)):
            if c[a] != CO:
                continue
            for k in kids[a]:
                if c[k] == DEAD:
                    continue
                run = []; u = k
                while (c[u] in (BARE, CC) or (c[u] == OH and u != first_oh)) and len(live(u)) == 1:
                    run.append(u); u = live(u)[0]
                if run and c[u] == CO and len(run) > 3:
                    cuts.append((a, run, u))
    return cuts


def messy(m):
    return sum(len(r) - 3 for _, r, _ in _cuts(m, False)) + (sum(len(r) - 3 for _, r, _ in _cuts(m, True)) if ACID in ('b', 'c', 'f') else 0)


def _apply(m, cuts):
    for a, run, b in cuts:
        for u in run[2:-1]:
            m.c[u] = DEAD
        m.par[run[-1]] = run[1]


def acid(m, line):
    """Every run of plain carbons between two OH/C=O carbons longer than 3 is eaten down to 3.
    ACID b/c: also between neighbouring C=O, eating C=C and OH (not the first OH) on the way."""
    if m.feed[F] < 3:
        return 0
    got = False
    if ACID in ('d', 'e', 'f', 'g'):
        m.ext = ACIDEXT; got = True
    if ACID in ('b', 'c', 'd', 'f'):
        w = _cuts(m, True)
        if w:
            _apply(m, w); got = True
    n = _cuts(m, False) if ACID != 'e' else []
    if n:
        _apply(m, n); got = True
    if not got:
        return 1
    cascade(m)
    return 2


def ammonia(m, line):
    """The page's three reactions fire again in the same order, no uses spent."""
    if m.feed[N] < AMMNEED:
        return 0
    acted = False
    for r in line:
        acted |= fire(m, r)
    return 2 if acted else 1


def sprout(m, line, extra=0, arms=3):
    """Nine carbons with three C=O grow at a tapped carbon and stay for the round."""
    if alive(m) + 3 * arms > MAXN + extra:
        return 1
    c = m.c
    cands = []
    if m.rings and c[m.rings[-1][1]] == ROH:
        cands.append(m.rings[-1][1])
    cands += [i for i, x in enumerate(c) if x == OH][:5]
    cands += [i for i in range(len(c)) if c[i] != DEAD and m.par[i] >= 0 and m.par[i] in cands][:3]
    best = None
    for k in dict.fromkeys(cands):
        t = m.copy(); a = len(t.c)
        t.c += [BARE, BARE, CO] * arms
        t.par += [k] + list(range(a, a + 3 * arms - 1))
        cascade(t)
        if best is None or t.pay > best.pay:
            best = t
    if best is None:
        return 1
    m.assign(best)
    return 2


def _spread(xs, k):
    if len(xs) <= k:
        return list(xs)
    return [xs[int(i * (len(xs) - 1) / (k - 1))] for i in range(k)]


def _look(t, line):
    """Score a tapped state: before the line, fire the line on a copy; after it, run the zip."""
    if T == 0:
        u = t.copy()
        for r in line:
            fire(u, r)
        return u.pay
    cascade(t)
    return t.pay


def main_path(m):
    kids = topo(m.par)[1]
    path = [0]; u = 0
    while True:
        k = [x for x in kids[u] if m.c[x] != DEAD]
        if not k:
            return path
        u = min(k); path.append(u)


def brimstone(m, line):
    """From a tapped carbon to a chain end, every 4th plain carbon becomes OH, then C=O, alternating."""
    if m.feed[SU] < 2:
        return 0
    path = main_path(m)
    best = None
    for s in _spread(list(range(len(path))), 9):
        for seg in (path[s:], path[:s + 1][::-1]):
            t = m.copy(); cnt = 0; nxt = OH; changed = False
            for u in seg:
                if t.c[u] == BARE:
                    cnt += 1
                    if BRIML:
                        if cnt > BRIML:
                            break
                        if cnt % 4 == 0:
                            t.c[u] = OH if not changed else CO; changed = True
                    elif cnt % EVERY == 0:
                        t.c[u] = nxt; nxt = CO if nxt == OH else OH; changed = True
            if not changed:
                continue
            sc = _look(t, line)
            if best is None or sc > best[0]:
                best = (sc, t)
    if best is None:
        return 1
    if T == 0:
        pass
    m.assign(best[1])
    return 2


def seedling(m, line):
    """As the sprout, but past the size limit by up to 9 carbons, and fed by 2 grows."""
    if m.feed[SE] < SEEDNEED:
        return 0
    return sprout(m, line, extra=9, arms=ARMS)


def salt(m, line):
    """Cure a tapped C=O: rings close on it and leave it C=O, up to 3 a page; reactions skip it."""
    if m.feed[SA] < 3:
        return 0
    if m.salt >= 0:
        return 1
    cos = [i for i, x in enumerate(m.c) if x == CO]
    if not cos:
        return 1
    best = None
    for j in _spread(cos, 8):
        t = m.copy(); t.salt = j
        sc = _look(t, line)
        if best is None or sc > best[0]:
            best = (sc, t)
    m.assign(best[1])
    return 2


def slime(m, line):
    """Two tapped carbons are stuck together as 3 carbons apart for the round."""
    if m.feed[BO] < 3:
        return 0
    if m.br:
        return 1
    g = [i for i, x in enumerate(m.c) if x in (OH, CO, CC, NH2, ROH)]
    best = None
    for a, b in itertools.combinations(_spread(g, 7), 2):
        t = m.copy(); t.br = (a, b)
        sc = _look(t, line)
        if best is None or sc > best[0]:
            best = (sc, t)
    if best is None:
        return 1
    m.assign(best[1])
    return 2


def wood_spirit(m, line):
    """Handled in with_creature: the page fires five dealt reactions in random order."""
    return 2 if m.feed[RD] >= 3 else 0



CREATURES = {
    'water': (water, W, 3),
    'hydrogen': (hydrogen, H, HYDNEED),
    'carbon dioxide': (carbon_dioxide, C, 3),
    'acid': (acid, F, 3),
    'ammonia': (ammonia, N, AMMNEED),
    'wood spirit': (wood_spirit, RD, 3),
    'salt': (salt, SA, 3),
    'brimstone': (brimstone, SU, 2),
    'seedling': (seedling, SE, SEEDNEED),
    'slime': (slime, BO, 3),
}
START_ONLY = ('wood spirit', 'salt')


# ---------------------------------------------------------------- player
def play_page(m0, line, cre=None, t=None):
    global T
    m = m0.copy(); start_page(m)
    T = t
    if cre and t == 0:
        st = cre(m, line)
        if st != 2:
            return st, 0, None
    for r in line:
        fire(m, r)
    if cre and t == 3:
        st = cre(m, line)
        if st != 2:
            return st, 0, None
    pay = m.pay; end_page(m)
    return 2, pay, m


def play_wood(m0, five, rng, K=8):
    """Fire the five reactions in K random orders; pay is the mean, the state is the median one."""
    res = []
    for _ in range(K):
        order = list(five); rng.shuffle(order)
        m = m0.copy(); start_page(m)
        for r in order:
            fire(m, r)
        pay = m.pay; end_page(m)
        res.append((pay, m))
    res.sort(key=lambda x: x[0])
    mean = sum(p for p, _ in res) / K
    return mean, res[K // 2][1]


def greedy(m0, key=None, need=0):
    """Best line for this page by pay (and, if key is given, by feed gained first)."""
    best = None
    for line in LINES:
        _, pay, m = play_page(m0, line)
        gain = min(max(m.feed[key] - m0.feed[key], 0), max(need - m0.feed[key], 0)) if key is not None else 0
        k = (gain, pay, m.n)
        if best is None or k > best[0]:
            best = (k, pay, m)
    return best[1], best[2]


def plan(m0, pages_left, K=5):
    """Best total over the pages left: top K lines by pay each page, then recurse."""
    if pages_left == 0:
        return 0.0, []
    cands = []
    for line in LINES:
        _, pay, m = play_page(m0, line)
        cands.append((pay, m.n, m))
    cands.sort(key=lambda x: (x[0], x[1]), reverse=True)
    if pages_left == 1:
        return cands[0][0], [(cands[0][0], cands[0][2])]
    best = None; seen = set()
    for pay, n, m in cands:
        sig = (tuple(m.c), m.nf, m.L)
        if sig in seen:
            continue
        seen.add(sig)
        tot, path = plan(m, pages_left - 1, K)
        if best is None or pay + tot > best[0]:
            best = (pay + tot, [(pay, m)] + path)
        if len(seen) >= K:
            break
    return best


def run_rest(m, pages_left):
    return plan(m, pages_left, 3)[0]


def round_total(m0):
    tot, path = plan(m0, 3, 5)
    return tot, [m0] + [m for _, m in path], [p for p, _ in path]


def with_creature(mol, name, base):
    cre, key, need = CREATURES[name]
    btot, bstates, bpays = base
    best = btot; fed = False
    feedstates = {}
    for p in range(3):
        starts = [(bstates[p], sum(bpays[:p]))]
        if p > 0 and key is not None:
            if (key, p) not in feedstates:
                m = mol; tot = 0.0; ss = [(m, 0.0)]
                for _ in range(p):
                    pay, m = greedy(m, key, need); tot += pay
                feedstates[(key, p)] = (m, tot)
            starts.append(feedstates[(key, p)])
        for st0, cum in starts:
            cands = []
            if name == 'wood spirit':
                if st0.feed[RD] >= 3:
                    fed = True
                    rng = random.Random(len(st0.c) * 7919 + p)
                    for skip in range(6):
                        five = [r for r in range(6) if r != skip]
                        pay, m1 = play_wood(st0, five, rng)
                        cands.append((pay, m1.n, id(m1), m1))
            else:
              for line in LINES:
                for t in ((0,) if name in START_ONLY else (0, 3)):
                    st, pay, m1 = play_page(st0, line, cre, t)
                    if st >= 1:
                        fed = True
                    if st == 2:
                        cands.append((pay, m1.n, id(m1), m1))
            cands.sort(key=lambda x: (x[0], x[1]), reverse=True)
            seen = set()
            for pay, n, _, m1 in cands[:6]:
                sig = (tuple(m1.c), m1.nf, m1.n)
                if sig in seen:
                    continue
                seen.add(sig)
                tot = cum + pay + run_rest(m1, 2 - p)
                if tot > best:
                    best = tot
    return fed, best


# ---------------------------------------------------------------- molecules
def gen(stage, rng):
    tgt = {'early': 14, 'middle': 22, 'late': 33}[stage]
    sd = {'early': 1.5, 'middle': 2.5, 'late': 3.5}[stage]
    pst = {'early': 0.05, 'middle': 0.18, 'late': 0.28}[stage]
    pn = {'early': 0.10, 'middle': 0.30, 'late': 0.40}[stage]
    L = max(9, int(round(rng.gauss(tgt, sd))))
    c = [BARE] * L
    pos = rng.choice([0, 0, 1, 2])
    c[pos] = OH if rng.random() < 0.85 else CC
    groups = [pos]
    while True:
        pos += rng.choice([6, 7, 8]) if rng.random() < pst else rng.choice([3, 3, 4])
        if pos >= L:
            break
        r = rng.random()
        c[pos] = CO if r < 0.72 else (CC if r < 0.86 else OH)
        groups.append(pos)
    r = rng.random()
    if c[L - 1] == BARE:
        if r < 0.25:
            c[L - 1] = CO
        elif r < 0.40:
            c[L - 1] = CC
    cos = [i for i in range(L) if c[i] == CO and i != groups[0]]
    if not cos:
        c[min(L - 1, groups[0] + 3)] = CO
    if rng.random() < pn:
        cos = [i for i in range(1, L) if c[i] == CO]
        for i in rng.sample(cos, min(len(cos), rng.choice([2, 3]))):
            c[i] = NH2
    return c


def mol_for(stage, seed, alt=0):
    rng = random.Random(seed + alt)
    c = gen(stage, rng)
    r2 = random.Random(seed + alt + 99991)
    pn = {'early': 0.10, 'middle': 0.30, 'late': 0.40}[stage]
    sh = r2.choice([2, 3]) if r2.random() < pn else 0
    return c, sh, rng


def one(args):
    stage, seed = args
    c, sh, rng = mol_for(stage, seed)
    mol = make(c, sh)
    base = round_total(mol)
    out = {'base': base[0], 'len': len(c)}
    for name in CREATURES:
        if ONLY and name not in ONLY.split(','):
            continue
        m_, b_ = mol, base
        if name == 'ammonia' and AMM_NH2 and NH2 not in c:
            c2 = c[:]
            cos = [i for i in range(1, len(c2)) if c2[i] == CO]
            r3 = random.Random(seed + 4242)
            for i in r3.sample(cos, min(len(cos), r3.choice([2, 3]))):
                c2[i] = NH2
            m_ = make(c2, sh); b_ = round_total(m_)
        if name == 'brimstone' and BRIM_SH and sh < 2:
            m_ = make(c, 2); b_ = round_total(m_)
        if name == 'acid' and ACID in ('a', 'c', 'f'):
            c2, sh2, _ = mol_for(stage, seed, 7777)
            m2 = make(c2, sh2)
            if messy(m2) > messy(mol):
                m_ = m2; b_ = round_total(m2)
        out[name] = with_creature(m_, name, b_)
        out[name + '#base'] = b_[0]
    return stage, out


def pct(xs, q):
    xs = sorted(xs)
    return xs[min(len(xs) - 1, int(q * len(xs)))]


def main():
    per = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    jobs = [(s, 1000 * i + k) for i, s in enumerate(['early', 'middle', 'late']) for k in range(per)]
    with Pool(min(14, os.cpu_count() or 4)) as pool:
        res = pool.map(one, jobs, chunksize=2)
    stages = ['early', 'middle', 'late']
    print('mean base round total:', {s: round(statistics.mean(o['base'] for st, o in res if st == s)) for s in stages})
    print('share of rounds with base total 0:', {s: round(sum(1 for st, o in res if st == s and o['base'] == 0) / per, 2) for s in stages})
    print()
    print('%-15s %-7s %5s %5s %7s %7s %8s' % ('creature', 'stage', 'fed%', 'used%', 'med|use', 'p90|use', 'mean all'))
    for name in CREATURES:
        if ONLY and name not in ONLY.split(','):
            continue
        for s in stages:
            rows = [o for st, o in res if st == s and o[name + '#base'] > 0]
            fed = sum(1 for o in rows if o[name][0]) / len(rows)
            ratios = [o[name][1] / o[name + '#base'] for o in rows]
            used = [r for r in ratios if r > 1.0001]
            print('%-15s %-7s %5.0f %5.0f %7s %7s %8.2f' % (
                name, s, 100 * fed, 100 * len(used) / len(rows),
                '%.2f' % statistics.median(used) if used else '-',
                '%.2f' % pct(used, 0.9) if used else '-',
                statistics.mean(ratios)))




# ================================================================ HELPERS (pieces)
# each h_* takes a Mol and returns a list of changed raw copies (not yet zipped);
# the search zips them, keeps a few, and plays them. Structural ones need rings empty
# (before the line); the others may be used before the line or after it.
KC = 4
REC_CAP = int(os.environ.get('REC_CAP', 3)); MET_K = int(os.environ.get('MET_K', 3)); BAL_N = int(os.environ.get('BAL_N', 1))
AQ_ALL = int(os.environ.get('AQ_ALL', 0)); TW_ANY = int(os.environ.get('TW_ANY', 0)); MORT_N = int(os.environ.get('MORT_N', 1)); BURN_CO = int(os.environ.get('BURN_CO', 0))


def _spread(xs, k):
    if len(xs) <= k:
        return list(xs)
    if k <= 1:
        return [xs[len(xs) // 2]] if k == 1 else []
    return [xs[int(i * (len(xs) - 1) / (k - 1))] for i in range(k)]


def nbrs(m):
    c = m.c; par = m.par; n = len(c)
    adj = [[] for _ in range(n)]
    for i in range(1, n):
        p = par[i]
        if p >= 0 and c[i] != DEAD and c[p] != DEAD:
            adj[i].append(p); adj[p].append(i)
    return adj


def bfs(adj, s, ban=None):
    dist = {s: 0}; prev = {s: -1}; q = [s]
    for u in q:
        for v in adj[u]:
            if v not in dist and not (ban and ((u, v) == ban or (v, u) == ban)):
                dist[v] = dist[u] + 1; prev[v] = u; q.append(v)
    return dist, prev, q


def live_nodes(m):
    return [i for i, x in enumerate(m.c) if x != DEAD]


def path_from(adj, s):
    _, prev, q = bfs(adj, s)
    p = [q[-1]]
    while prev[p[-1]] != -1:
        p.append(prev[p[-1]])
    return p[::-1]


def diam(m, adj):
    lv = live_nodes(m)
    u = bfs(adj, lv[0])[2][-1]
    p = path_from(adj, u)
    if p[0] > p[-1]:
        p = p[::-1]
    return p


def ends_of(m, adj):
    return [i for i in live_nodes(m) if len(adj[i]) <= 1 and m.c[i] not in (RING, ROH)]


def rebuild(m, root, keep, adj):
    order = [root]; new = {root: 0}; par = [-1]
    for u in order:
        for v in adj[u]:
            if v in keep and v not in new:
                new[v] = len(order); order.append(v); par.append(new[u])
    t = m.copy()
    try:
        t.rings = [(new[i], new[j]) for i, j in m.rings]
    except KeyError:
        return None
    t.c = [m.c[u] for u in order]; t.par = par
    t.salt = new.get(m.salt, -1) if m.salt >= 0 else -1
    t.br = None
    return t


def graph_mol(m, c2, edges):
    n = len(c2); adj = [[] for _ in range(n)]
    for a, b in edges:
        adj[a].append(b); adj[b].append(a)
    root = next(i for i in range(n) if len(adj[i]) <= 1)
    order = [root]; new = {root: 0}; par = [-1]
    for u in order:
        for v in adj[u]:
            if v not in new:
                new[v] = len(order); order.append(v); par.append(new[u])
    t = m.copy()
    t.c = [c2[u] for u in order]; t.par = par; t.rings = []; t.nf = 0; t.salt = -1; t.br = None
    return t


def co_in_reach(m, reach, i):
    return any(m.c[j] == CO and j != m.salt for j in reach[i])


def oh_in_reach(m, reach, i):
    return any(m.c[j] in (OH, ROH) for j in reach[i])


# ---- the thirteen, and the mirror and the seed crystal
def h_burner(m):
    reach, _ = topo(m.par, m.br, m.ext)
    t = m.copy(); k = 0
    for i, x in enumerate(m.c):
        if x == OH and not any(m.c[j] == CO for j in reach[i]):
            t.c[i] = CO if BURN_CO else CC; k += 1
    if not k:
        return []
    t.feed[W] += k; t.feed[F] += 1
    return [t]


def h_burette(m):
    adj = nbrs(m); out = []
    for e in ends_of(m, adj):
        path = path_from(adj, e)
        t = m.copy(); ch = False
        for u in path:
            if m.c[u] == CC:
                t.c[u] = CO; ch = True
        if m.c[e] == BARE:
            t.c[e] = OH; ch = True
        if ch:
            out.append(t)
    return out


def h_magnet(m):
    adj = nbrs(m)
    P = diam(m, adj); n = len(P); out = []
    for a, node in enumerate(P):
        if m.c[node] not in (OH, CO):
            continue
        d = 1 if a < (n - 1) / 2 else -1
        maxd = (n - 1 - a) if d == 1 else a
        cos = [k for k in range(1, maxd + 1) if m.c[P[a + d * k]] == CO and P[a + d * k] != m.salt]
        if not cos:
            continue
        t = m.copy(); prev = 0; ch = False
        for idx, cur in enumerate(cos):
            tgt = prev + 4
            if idx + 1 < len(cos):
                tgt = min(tgt, cos[idx + 1] - 1)
            tgt = min(tgt, maxd)
            if tgt > prev and tgt != cur and t.c[P[a + d * tgt]] == BARE:
                t.c[P[a + d * cur]] = BARE; t.c[P[a + d * tgt]] = CO
                cur = tgt; ch = True
            prev = cur
        if ch:
            out.append(t)
    return out


def h_tower(m):
    if m.rings:
        return []
    adj = nbrs(m); out = []
    for i, x in enumerate(m.c):
        if x != CC and not (TW_ANY and x in (OH, CO)):
            continue
        for v in adj[i]:
            for keep in (i, v):
                q = bfs(adj, keep, (i, v))[2]
                if len(q) < 5:
                    continue
                t = rebuild(m, keep, set(q), adj)
                if t is None:
                    continue
                t.c[0] = CO
                out.append((len(q), t))
    out.sort(key=lambda x: -x[0])
    return [t for _, t in out[:30]]


def h_mortar(m):
    ohs = [i for i, x in enumerate(m.c) if x == OH]
    cos = [i for i, x in enumerate(m.c) if x == CO and i != m.salt]
    prs = [(i, j) for i in ohs for j in cos]
    out = []
    for i, j in (_spread(prs, 40) if prs else []):
        t = m.copy()
        t.c[i] = RING; t.c[j] = ROH; t.rings.append((i, j)); t.n += 1
        t.pay += 50 * t.n * (1.0 if t.n > t.L else 0.25)
        out.append(t)
        if MORT_N > 1:
            for i2 in ohs:
                for j2 in cos:
                    if i2 != i and j2 != j:
                        u = t.copy()
                        u.c[i2] = RING; u.c[j2] = ROH; u.rings.append((i2, j2)); u.n += 1
                        u.pay += 50 * u.n * (1.0 if u.n > u.L else 0.25)
                        out.append(u)
    return out


def h_voodoo(m):
    adj = nbrs(m); P = diam(m, adj); n = len(P); out = []
    for a, node in enumerate(P):
        x = m.c[node]
        if x in (OH, CO) and a != n - 1 - a and m.c[P[n - 1 - a]] == BARE and not (x == CO and node == m.salt):
            t = m.copy(); t.c[P[n - 1 - a]] = x; out.append(t)
    return out


def h_recycler(m):
    w = min(REC_CAP, m.feed[W])
    if w <= 0:
        return []

    def spots(t):
        r2, _ = topo(t.par, t.br, t.ext)
        s = [i for i, x in enumerate(t.c) if x == BARE and co_in_reach(t, r2, i)]
        return s if s else _spread([i for i, x in enumerate(t.c) if x == BARE], 3)
    firsts = []
    for i in spots(m):
        u = m.copy(); u.c[i] = OH; cascade(u)
        firsts.append(((u.pay, u.n), i))
    firsts.sort(reverse=True)
    out = []
    for _, f in firsts[:3]:
        t = m.copy(); t.c[f] = OH
        for s in range(w - 1):
            ct = t.copy(); cascade(ct)
            best = None
            for i in spots(ct):
                if ct.c[i] != BARE:
                    continue
                u = ct.copy(); u.c[i] = OH; cascade(u)
                k = (u.pay, u.n)
                if best is None or k > best[0]:
                    best = (k, i)
            if best is None:
                break
            t = ct; t.c[best[1]] = OH
        out.append(t)
    return out


def h_paw(m):
    if m.rings:
        return []
    adj = nbrs(m); P = diam(m, adj)
    reach, _ = topo(m.par, m.br, m.ext)
    bare = [i for i, x in enumerate(m.c) if x == BARE]
    cand = []
    for x in bare:
        if co_in_reach(m, reach, x):
            cand.append((x, OH))
        if oh_in_reach(m, reach, x):
            cand.append((x, CO))
    cand += [(x, g) for x in _spread(bare, 3) for g in (OH, CO)] if bare else []
    out = []
    for x, g in dict.fromkeys(cand):
        f = next((u for u in reversed(P) if m.c[u] == BARE and u != x), None)
        if f is None or f == 0:
            continue
        t = m.copy()
        for i in range(len(t.c)):
            if i != f and t.par[i] == f:
                t.par[i] = t.par[f]
        t.c[f] = DEAD; t.c[x] = g
        out.append(t)
    return out


def h_cannula(m):
    reach, _ = topo(m.par, m.br, m.ext)
    cos = _spread([i for i, x in enumerate(m.c) if x == CO and i != m.salt], 6)
    tg = [i for i, x in enumerate(m.c) if x == BARE and oh_in_reach(m, reach, i)]
    tg = _spread(tg, 8) if tg else _spread([i for i, x in enumerate(m.c) if x == BARE], 3)
    out = []
    for j in cos:
        for k in tg:
            t = m.copy(); t.c[j] = BARE; t.c[k] = CO; out.append(t)
    return out


def h_balance(m):
    ohs = [i for i, x in enumerate(m.c) if x == OH]
    cos = [i for i, x in enumerate(m.c) if x == CO and i != m.salt]
    out = []
    for i, j in (_spread([(i, j) for i in ohs for j in cos], 40) if ohs and cos else []):
        t = m.copy(); t.c[i] = CO; t.c[j] = OH; out.append(t)
        if BAL_N > 1:
            for i2 in ohs:
                for j2 in cos:
                    if i2 != i and j2 != j:
                        u = t.copy(); u.c[i2] = CO; u.c[j2] = OH; out.append(u)
    return out


def h_aqua(m):
    adj = nbrs(m); out = []
    for e in ends_of(m, adj):
        plain = []; prev = None; cur = e
        while m.c[cur] == BARE:
            nx = [v for v in adj[cur] if v != prev]
            if len(nx) != 1:
                plain = None if not nx else plain
                break
            plain.append(cur); prev, cur = cur, nx[0]
        if not plain:
            continue
        t = m.copy()
        for u in plain:
            t.c[u] = DEAD
        t.feed[F] += len(plain)
        if 0 in plain:
            a2 = nbrs(t)
            keep = set(live_nodes(t))
            t = rebuild(t, cur, keep, a2)
            if t is None:
                continue
        out.append(t)
    if AQ_ALL and len(out) > 1:
        t = m.copy(); f = 0
        for e in ends_of(m, adj):
            prev = None; cur = e; plain = []
            while m.c[cur] == BARE:
                nx = [v for v in adj[cur] if v != prev]
                if len(nx) != 1:
                    break
                plain.append(cur); prev, cur = cur, nx[0]
            for u in plain:
                t.c[u] = DEAD
            f += len(plain)
        if f and 0 not in [i for i in range(len(t.c)) if t.c[i] == DEAD]:
            t.feed[F] += f; out.append(t)
    return out


def h_methanol(m):
    adj = nbrs(m); es = ends_of(m, adj); out = []
    room = MAXN - alive(m)
    subs = []
    for k in range(1, MET_K + 1):
        subs += list(itertools.combinations(es, k))
    for s in (_spread(subs, 30) if subs else []):
        if len(s) > room:
            continue
        t = m.copy()
        for e in s:
            t.c.append(OH); t.par.append(e)
        out.append(t)
    return out


def h_ethylene(m):
    adj = nbrs(m); out = []
    if alive(m) + 2 > MAXN:
        return []
    for e in ends_of(m, adj):
        t = m.copy(); a = len(t.c)
        t.c += [BARE, CC]; t.par += [e, a]
        out.append(t)
    return out


def h_seed(m):
    reach, _ = topo(m.par, m.br, m.ext)
    s = [i for i, x in enumerate(m.c) if x == BARE and co_in_reach(m, reach, i)]
    if not s:
        s = _spread([i for i, x in enumerate(m.c) if x == BARE], 3)
    out = []
    for i in s:
        t = m.copy(); t.c[i] = OH; out.append(t)
    return out


def h_mirror(m):
    if m.rings:
        return []
    adj = nbrs(m); out = []
    lim = (MAXN - 6) // 2
    for u in live_nodes(m):
        for v in adj[u]:
            q = bfs(adj, u, (u, v))[2]
            k = len(q)
            if k > lim or k < 3:
                continue
            idx = {x: i for i, x in enumerate(q)}
            edges = [(idx[x], idx[y]) for x in q for y in adj[x] if y in idx and idx[x] < idx[y]]
            c2 = [m.c[x] for x in q] * 2
            edges = edges + [(a + k, b + k) for a, b in edges] + [(idx[u], idx[u] + k)]
            out.append(graph_mol(m, c2, edges))
    return out


HFUN = {'burner': h_burner, 'burette': h_burette, 'magnet': h_magnet, 'tower': h_tower, 'mortar': h_mortar,
        'voodoo': h_voodoo, 'recycler': h_recycler, 'paw': h_paw, 'cannula': h_cannula, 'balance': h_balance,
        'aqua regia': h_aqua, 'methanol': h_methanol, 'ethylene': h_ethylene, 'seed': h_seed, 'mirror': h_mirror}
STRUCT = ('tower', 'mirror', 'paw')


def apply_h(name, m, pre):
    if name in STRUCT and not pre:
        return []
    raw = HFUN[name](m)
    if not raw:
        return []
    if len(raw) > 60:
        raw = _spread(raw, 60)
    sc = []
    seen = set()
    for t in raw:
        cascade(t)
        sig = (tuple(t.c), tuple(t.par), tuple(t.rings))
        if sig in seen:
            continue
        seen.add(sig)
        sc.append((t.pay, t.n, t))
    sc.sort(key=lambda x: (x[0], x[1]), reverse=True)
    top = sc[:KC - 1]; rest = sc[KC - 1:]
    if rest:
        top += _spread(rest, 1)
    return [t for _, _, t in top]


# ---------------------------------------------------------------- search over a round
def plain_lines(m, nl):
    res = []
    for line in LINES:
        t = m.copy(); start_page(t)
        for r in line:
            fire(t, r)
        res.append((t.pay, t.n, line))
    res.sort(key=lambda x: (x[0], x[1]), reverse=True)
    k = nl * 3 // 5
    keep = res[:k]; rest = res[k:]
    if rest:
        keep += _spread(rest, nl - k)
    return [l for _, _, l in keep]


def exec_script(m0, line, script):
    s0 = m0.copy(); start_page(s0)
    sts = [s0]; fired = False
    for it in script:
        if it == 'L':
            for s in sts:
                for r in line:
                    fire(s, r)
            fired = True
        else:
            nxt = []
            for s in sts:
                nxt += apply_h(it, s, not fired)
            sts = nxt
            if not sts:
                return []
    out = []
    for s in sts:
        pay = s.pay; end_page(s)
        out.append((pay, s))
    return out


def search(m, pl, avail, K=2, nl=40, force=False):
    if pl == 0:
        return 0.0
    if not avail:
        return run_rest(m, pl)
    names = sorted(avail)
    lines = plain_lines(m, nl)
    subsets = [()]
    for k in range(1, len(names) + 1):
        subsets += list(itertools.combinations(names, k))
    out = {}
    for line in lines:
        for S in subsets:
            if force and not S:
                continue
            for perm in set(itertools.permutations(list(S) + ['L'])):
                for pay, s in exec_script(m, line, perm):
                    out.setdefault(frozenset(S), []).append((pay, s.n, s))
    best = 0.0
    for used, lst in out.items():
        lst.sort(key=lambda x: (x[0], x[1]), reverse=True)
        seen = set(); cnt = 0
        for pay, n, s in lst:
            sig = (tuple(s.c), tuple(s.par), s.nf)
            if sig in seen:
                continue
            seen.add(sig); cnt += 1
            best = max(best, pay + search(s, pl - 1, avail - used, K, nl))
            if cnt >= K:
                break
    return best


def with_helpers(mol, avail, base, K=2, nl=40):
    btot, bst, bp = base
    best = btot
    for p in range(3):
        v = sum(bp[:p]) + search(bst[p], 3 - p, frozenset(avail), K, nl, True)
        best = max(best, v)
    return best


SINGLES = ['mirror', 'seed', 'burner', 'burette', 'magnet', 'tower', 'mortar', 'voodoo', 'recycler', 'paw',
           'cannula', 'balance', 'aqua regia', 'methanol', 'ethylene']
PAIRS = [('burner', 'burette'), ('burette', 'magnet'), ('mortar', 'magnet'), ('voodoo', 'paw'),
         ('tower', 'cannula'), ('recycler', 'burner'), ('methanol', 'burette'), ('mirror', 'paw'), ('balance', 'cannula')]
NPAIR = int(os.environ.get('NPAIR', 6))
ONLYS = os.environ.get('ONLYS', '')


def job(args):
    stage, seed = args
    c, sh, rng = mol_for(stage, seed)
    mol = make(c, sh)
    base = round_total(mol)
    out = {'base': base[0]}
    if base[0] <= 0:
        return stage, out
    sing = [s for s in SINGLES if not ONLYS or s in ONLYS.split(',')]
    for h in sing:
        out[h] = with_helpers(mol, {h}, base)
    if not ONLYS:
        for a, b in PAIRS[:NPAIR]:
            out[a + '+' + b] = with_helpers(mol, {a, b}, base)
    return stage, out


def main():
    import json, time
    per = int(sys.argv[1]) if len(sys.argv) > 1 else 20
    jobs = [(s, 1000 * i + k) for i, s in enumerate(['early', 'middle', 'late']) for k in range(per)]
    t0 = time.time(); res = []
    with Pool(min(16, os.cpu_count() or 4)) as pool:
        for k, r in enumerate(pool.imap_unordered(job, jobs, chunksize=1)):
            res.append(r)
            if k % 20 == 0:
                print(k, len(jobs), round(time.time() - t0), flush=True)
    json.dump(res, open(os.environ.get('OUT', 'help_res.json'), 'w'))
    report(res)


def report(res):
    stages = ['early', 'middle', 'late']
    print('%-11s %-7s %5s %6s %6s %6s' % ('helper', 'stage', 'beat%', 'med', 'p90', 'mean'))
    for h in SINGLES:
        for s in stages:
            rows = [o for st, o in res if st == s and o['base'] > 0 and h in o]
            if not rows:
                continue
            ra = [max(o[h] / o['base'], 1.0) for o in rows]
            print('%-11s %-7s %5.0f %6.2f %6.2f %6.2f' % (h, s, 100 * sum(1 for r in ra if r > 1.0001) / len(ra),
                  statistics.median(ra), pct(ra, 0.9), statistics.mean(ra)))
    print()
    print('%-20s %-7s %6s %6s %7s %7s %7s' % ('pair', 'stage', 'pair', 'a*b', 'syn med', 'syn mean', 'syn p90'))
    for a, b in PAIRS:
        for s in stages:
            rows = [o for st, o in res if st == s and o['base'] > 0 and (a + '+' + b) in o and a in o and b in o]
            if not rows:
                continue
            rp = [max(o[a + '+' + b], o[a], o[b]) / o['base'] for o in rows]
            ab = [max(o[a] / o['base'], 1) * max(o[b] / o['base'], 1) for o in rows]
            syn = [x / y for x, y in zip(rp, ab)]
            print('%-20s %-7s %6.2f %6.2f %7.2f %7.2f %7.2f' % (a + '+' + b, s, statistics.mean(rp), statistics.mean(ab),
                  statistics.median(syn), statistics.mean(syn), pct(syn, 0.9)))


if __name__ == '__main__':
    main()
