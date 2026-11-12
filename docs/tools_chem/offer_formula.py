"""How often each reagent is offered and what it costs, worked out from the measured statistics.

Reads reagent_stats.json (written by reagent_stats.py). Nothing here is typed in by hand per reagent: change a reagent's
numbers there and its offer odds, its price and its place in the unlock order follow.

Run (from this folder):
    python offer_formula.py table              the inputs, weights, odds at rounds 2, 5, 8, prices, unlock order
    python offer_formula.py offers [N]         N runs of each length through the offer layer only (fast, no chemistry)
    python offer_formula.py tune  [N]          try the constants on a grid and print the ones that pass the check
    python offer_formula.py engine OUT [N]     N runs of each length played round by round on the engine (multiprocess)
    python offer_formula.py report OUT         read OUT and print the simulation tables

Words (as in OFFERS.md):
  worth W        mean yield with the reagent over mean yield with a dud in its place, minus one (yield_change_vs_dud)
  band worth     the same in rounds 1-3, 4-6, 7-9
  reach          share of rounds in which the reagent changes the yield at all (1 - same_share)
  swing          spread of the log of the per-round ratio (sd_log)
  bonus b(x,y)   what x and y are worth together over the sum of their separate worths (pair table)
  visit          the pick of one from three after a round
"""
import itertools
import json
import math
import os
import pickle
import random
import sys
import time
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
# RS_V2=1: the current game (reagent_stats.py run with RS_V2=1): its JSON and its starting six.  Without it, as before.
V2 = os.environ.get('RS_V2', '') == '1'
STATS = json.load(open(os.path.join(HERE, 'reagent_stats_v2.json' if V2 else 'reagent_stats.json')))
SIX = (('hydrate', 'oxidize', 'grow', 'thiolene', 'dehydrate', 'ritter') if V2 else
       ('hydrate', 'hydroborate', 'dehydrate', 'oxidize', 'reduce', 'grow'))
ALL = tuple(STATS['reagents'])
UNLOCKS = tuple(x for x in ALL if x not in SIX)
LENGTHS = {'bachelor': 3, 'master': 6, 'doctorate': 9}
CARRY = 8
BANDS = ('early', 'mid', 'late')


def band(r):
    return 'early' if r <= 3 else 'mid' if r <= 6 else 'late'


# ---------------------------------------------------------------------------------------------------------------
# 1. the inputs, read from the statistics
# ---------------------------------------------------------------------------------------------------------------

ALIVE = 0.08          # a band counts as alive when the reagent adds at least 8% yield there
NOISE = 0.10          # pair bonuses under about 10% are within the measuring noise of the pair table


def _pair(a, b):
    k = '%s|%s' % (a, b)
    if k not in STATS['pairs']:
        k = '%s|%s' % (b, a)
    return STATS['pairs'][k]['bonus']


def read_inputs():
    out = {}
    for x in ALL:
        r = STATS['reagents'][x]
        ra = r['alone']['ratio']
        bw = {b: ra[b]['ratio_of_means'] - 1.0 for b in BANDS}
        alive = next((1 + 3 * i for i, b in enumerate(BANDS) if bw[b] >= ALIVE), None)
        bonus = {y: _pair(x, y) for y in ALL if y != x}
        best_any = max(bonus, key=bonus.get)
        best_unl = max((y for y in UNLOCKS if y != x), key=bonus.get)
        b_star = max(0.0, bonus[best_any])
        dep = b_star / (b_star + max(0.0, r['yield_change_vs_dud']) + NOISE)
        out[x] = dict(held=r['held'], strength=r['strength'], worth=r['yield_change_vs_dud'], band=bw,
                      band_mean=sum(bw.values()) / 3, reach=1.0 - ra['all']['same_share'], fit=r['fit_round_start']['all'],
                      swing=ra['all']['sd_log'], alive=alive, bonus=bonus, best_any=best_any, best_unlock=best_unl,
                      dependence=dep)
    return out


IN = read_inputs()


def worth_rest(x, r_from, L):
    """Mean band worth over the rounds this pick will be carried in: r_from .. L."""
    rs = range(r_from, L + 1)
    return sum(IN[x]['band'][band(r)] for r in rs) / len(rs)


# ---------------------------------------------------------------------------------------------------------------
# 2. the offer weight
# ---------------------------------------------------------------------------------------------------------------

C0 = dict(
    u=0.30,          # usefulness floor: a reagent that changes nothing keeps 30% of the weight of one that changes every round
    k=2.5,           # rarity: weight falls by e^-k for each +100% of worth
    t=1.0,           # timing: weight follows the worth left in the run, relative to the reagent's own average
    kappa=2.0,       # partners: each held partner multiplies the weight by 1 + kappa * bonus
    p_lo=0.5, p_hi=2.0,
    pity=0.20,       # each visit a reagent is not shown adds 20% to its weight; showing it resets the count
    decay=0.6,       # each time it is shown and passed over in this run its weight is multiplied by 0.6
    shelf_k=0.4,     # the priced fourth slot uses 0.4 of the rarity, so strong reagents show there more often
    c0=2, c1=7,      # list price = 2 + 7 * worth, rounded, at least 1
    step=1,          # each reagent bought from the shelf this run raises every shelf price by 1
    stock={3: 4, 6: 5, 9: 5},   # how many of the unlocked reagents a run's supplier carries, by run length
    pity_run=0.5,    # each run a reagent is left out of the stock adds 50% to its stock weight; being stocked resets it
)


def clip_b(b):
    return max(-0.4, min(0.6, b))


def partner_factor(x, held, C):
    """1 with the plain six. Each held unlock multiplies by 1 + kappa*b; each starter put back divides by it, since the
    worth was measured on top of the six."""
    f = 1.0
    for h in held:
        if h == x:
            continue
        if h in UNLOCKS:
            f *= max(0.2, 1 + C['kappa'] * clip_b(IN[x]['bonus'][h]))
    for s in SIX:
        if s not in held and s != x:
            f /= max(0.2, 1 + C['kappa'] * clip_b(IN[x]['bonus'][s]))
    return max(C['p_lo'], min(C['p_hi'], f))


def weight(x, r_next, L, held, C, drought=0, passed=0, shelf=False):
    i = IN[x]
    U = C['u'] + (1 - C['u']) * i['reach']
    k = C['k'] * (C['shelf_k'] if shelf else 1.0)
    R = math.exp(-k * max(0.0, i['worth']))
    A = ((1 + worth_rest(x, r_next, L)) / (1 + i['band_mean'])) ** C['t']
    P = partner_factor(x, held, C)
    M = (1 + C['pity'] * drought) * C['decay'] ** passed
    return U * R * A * P * M


def parts(x, r_next, L, held, C):
    i = IN[x]
    return dict(U=C['u'] + (1 - C['u']) * i['reach'], R=math.exp(-C['k'] * max(0.0, i['worth'])),
                A=((1 + worth_rest(x, r_next, L)) / (1 + i['band_mean'])) ** C['t'], P=partner_factor(x, held, C))


def draw(pool, w, n, rng):
    pool = list(pool)
    w = list(w)
    out = []
    for _ in range(min(n, len(pool))):
        t = rng.random() * sum(w)
        for j, wj in enumerate(w):
            t -= wj
            if t <= 0:
                break
        out.append(pool.pop(j))
        w.pop(j)
    return out


def inclusion(ws, n=3):
    """Exact chance each item is among n drawn without replacement, weight by weight."""
    names = list(ws)
    p = Counter()
    for seq in itertools.permutations(names, min(n, len(names))):
        pr = 1.0
        left = sum(ws.values())
        for s in seq:
            pr *= ws[s] / left
            left -= ws[s]
        for s in seq:
            p[s] += pr
    return p


# ---------------------------------------------------------------------------------------------------------------
# 3. the price
# ---------------------------------------------------------------------------------------------------------------

def list_price(x, C):
    return max(1, int(math.floor(C['c0'] + C['c1'] * max(0.0, IN[x]['worth']) + 0.5)))


def price(x, C, bought=0):
    return list_price(x, C) + C['step'] * bought


REROLL = (1, 2, 3)     # as built: 1, then 2, then 3 within one visit
SKIP_PAYS = 1          # as built


# ---------------------------------------------------------------------------------------------------------------
# 4. the unlock order
# ---------------------------------------------------------------------------------------------------------------

# the measured pace of the reagent shelf in FINDINGS.md (median run of a middling player for each of its twelve
# reagent findings, in order); the order below decides which reagent gets which slot
PACE = (2, 4, 9, 9, 12, 13, 21, 31, 36, 43, 44, 57)


def _z(vals):
    m = sum(vals.values()) / len(vals)
    s = math.sqrt(sum((v - m) ** 2 for v in vals.values()) / len(vals)) or 1.0
    return {k: (v - m) / s for k, v in vals.items()}


def lateness():
    """Higher = later. Two things are read: how widely it is useful now (reach) and how much of a power piece it is (worth,
    swing, need of a partner, coming alive late). Early: wide and modest. Late: narrow, swingy, partner-hungry or strong."""
    xs = UNLOCKS
    zs = _z({x: IN[x]['swing'] for x in xs})
    zr = _z({x: IN[x]['reach'] for x in xs})
    zd = _z({x: IN[x]['dependence'] for x in xs})
    zw = _z({x: max(0.0, IN[x]['worth']) for x in xs})
    za = _z({x: IN[x]['alive'] or 10 for x in xs})
    return {x: (zs[x] + zd[x] + zw[x] + za[x]) / 2 - zr[x] for x in xs}


def unlock_order():
    lt = lateness()
    return sorted(UNLOCKS, key=lambda x: lt[x])


# ---------------------------------------------------------------------------------------------------------------
# the player who takes from the offer (reads the statistics: what a reagent adds over the rest of the run)
# ---------------------------------------------------------------------------------------------------------------

def value(x, held, r_next, L):
    v = worth_rest(x, r_next, L)
    for h in held:
        if h != x and h in UNLOCKS:
            v += clip_b(IN[x]['bonus'][h])
    for s in SIX:
        if s not in held and s != x:
            v -= clip_b(IN[x]['bonus'][s]) * 0.5
    return v


TAKE_MIN = 0.05
SWAP_GAIN = 0.05
RESERVE = 3            # gold the player keeps back for an instrument


def draw_stock(L, rng, C, unlocked=UNLOCKS, runs_out=None, flat=False):
    """The run's supplier: which unlocked reagents this run can offer free. Drawn at the start of the run by the weight
    with the run's first offer round, times the drought across runs."""
    runs_out = runs_out or {}
    size = min(C['stock'][L], len(unlocked))
    ws = [1.0 if flat else weight(x, 2, L, SIX, C) * (1 + C['pity_run'] * runs_out.get(x, 0)) for x in unlocked]
    return draw(unlocked, ws, size, rng)


def run_offers(L, rng, C, unlocked=UNLOCKS, picker='reader', flat=False, shelf_on=True, stock=None):
    held = list(SIX)
    stock = list(unlocked) if stock is None else list(stock)
    gold = 0
    drought = Counter()
    passed = Counter()
    seen, taken, bought = set(), set(), []
    carried = {1: tuple(held)}
    log = []
    nbought = 0
    for r in range(1, L):
        gold += 2 + (1 if rng.random() < 0.4 else 0) + min(2, gold // 3)       # marks, then interest (as built)
        r_next = r + 1
        pool = [x for x in stock + list(SIX) if x not in held]
        outside = [x for x in unlocked if x not in held and x not in stock]
        rerolls = 0
        while True:
            ws = [1.0 if flat else weight(x, r_next, L, held, C, drought[x], passed[x]) for x in pool]
            offer = draw(pool, ws, 3, rng)
            rest = [x for x in pool if x not in offer] + outside
            shelf = []
            if shelf_on and rest and not flat:
                shelf = draw(rest, [weight(x, r_next, L, held, C, drought[x], passed[x], shelf=True) for x in rest], 1, rng)
            if picker != 'reader' or rerolls >= len(REROLL):
                break
            best = max(value(x, held, r_next, L) for x in offer) if offer else 0
            cost = REROLL[rerolls]
            if best < 0.10 and gold >= cost + RESERVE:
                gold -= cost
                rerolls += 1
                for x in offer + shelf:
                    seen.add(x)
                continue
            break
        shown = set(offer) | set(shelf)
        seen |= shown
        took = []
        if picker == 'reader':
            # the shelf first: buy when it is the best thing on show and gold is left over
            if shelf:
                s = shelf[0]
                cost = price(s, C, nbought)
                vs = value(s, held, r_next, L)
                vo = max([value(x, held, r_next, L) for x in offer] or [0])
                if vs > vo + 0.05 and vs > TAKE_MIN and gold - cost >= RESERVE:
                    if len(held) >= CARRY:
                        drop = min(held, key=lambda h: value(h, [y for y in held if y != h], r_next, L))
                        if vs > value(drop, [y for y in held if y != drop], r_next, L) + SWAP_GAIN:
                            held.remove(drop)
                    if len(held) < CARRY:
                        held.append(s)
                        gold -= cost
                        nbought += 1
                        took.append(s)
                        bought.append(s)
            cand = sorted(offer, key=lambda x: -value(x, held, r_next, L))
            done = False
            for x in cand[:1]:
                vx = value(x, held, r_next, L)
                if vx < TAKE_MIN:
                    break
                if len(held) < CARRY:
                    held.append(x)
                    took.append(x)
                    done = True
                else:
                    drop = min(held, key=lambda h: value(h, [y for y in held if y != h], r_next, L))
                    if vx > value(drop, [y for y in held if y != drop], r_next, L) + SWAP_GAIN:
                        held.remove(drop)
                        held.append(x)
                        took.append(x)
                        done = True
            if not done:
                gold += SKIP_PAYS
        else:                                   # novice: takes one of the three at random, puts back one at random when full
            if offer:
                x = rng.choice(offer)
                if len(held) >= CARRY:
                    held.remove(rng.choice(held))
                held.append(x)
                took.append(x)
        taken |= set(took)
        for x in pool + outside:
            if x in shown:
                drought[x] = 0
                if x not in took:
                    passed[x] += 1
            else:
                drought[x] += 1
        carried[r_next] = tuple(held)
        log.append((r, offer, shelf, took))
    return dict(carried=carried, seen=seen, taken=taken, bought=bought, final=tuple(sorted(held)), gold=gold, log=log,
                stock=tuple(stock))


def career(L, n, C, seed='c', unlocked=UNLOCKS, use_stock=True, **kw):
    """n runs in a row by one player, so the drought across runs carries from run to run."""
    runs_out = Counter()
    out = []
    for i in range(n):
        rng = random.Random('%s/%d/%d' % (seed, L, i))
        st = draw_stock(L, rng, C, unlocked, runs_out, flat=kw.get('flat', False)) if use_stock else list(unlocked)
        for x in unlocked:
            runs_out[x] = 0 if x in st else runs_out[x] + 1
        out.append(run_offers(L, rng, C, unlocked, stock=st, **kw))
    return out


def offer_stats(L, n, C, seed='o', **kw):
    seen, taken, held_end, sets, buys = Counter(), Counter(), Counter(), Counter(), Counter()
    for res in career(L, n, C, seed, **kw):
        for x in res['seen']:
            seen[x] += 1
        for x in res['taken']:
            taken[x] += 1
        for x in res['final']:
            held_end[x] += 1
        for x in res['bought']:
            buys[x] += 1
        sets[res['final']] += 1
    return dict(n=n, seen=seen, taken=taken, held_end=held_end, sets=sets, buys=buys)


def check(st, pool=UNLOCKS, lo=0.10, hi=0.60):
    n = st['n']
    bad = []
    for x in pool:
        if st['seen'][x] / n < lo:
            bad.append('%s seen %.0f%%' % (x, 100 * st['seen'][x] / n))
        if st['taken'][x] / n > hi:
            bad.append('%s taken %.0f%%' % (x, 100 * st['taken'][x] / n))
    return bad


# ---------------------------------------------------------------------------------------------------------------
# printing
# ---------------------------------------------------------------------------------------------------------------

def pc(x, d=0):
    return ('%.' + str(d) + 'f%%') % (100 * x)


def print_inputs():
    print('| Reagent | Held | Worth W | Early | Mid | Late | Alive from | Reach | Fit at start | Swing | Best partner (bonus) | Best later partner (bonus) | Partner dependence |')
    print('|---|---|---|---|---|---|---|---|---|---|---|---|---|')
    for x in sorted(ALL, key=lambda x: -IN[x]['worth']):
        i = IN[x]
        print('| %s | %s | %+.0f%% | %+.0f%% | %+.0f%% | %+.0f%% | %s | %s | %s | %.2f | %s (%+.0f%%) | %s (%+.0f%%) | %.2f |' % (
            x, i['held'], 100 * i['worth'], 100 * i['band']['early'], 100 * i['band']['mid'], 100 * i['band']['late'],
            ('round %d' % i['alive']) if i['alive'] else 'never', pc(i['reach']), pc(i['fit']), i['swing'],
            i['best_any'], 100 * i['bonus'][i['best_any']], i['best_unlock'], 100 * i['bonus'][i['best_unlock']], i['dependence']))


def print_odds(C, L=9, rounds=(2, 5, 8)):
    """Chance to be among the three of a visit, all twelve unlocked, the six held, no unlock held (empty-handed), and with
    the reagent's best later partner held (that one factor changes; the others are as empty-handed)."""
    head = '| Reagent | List price |' + ''.join(' R%d one slot | R%d in three | R%d with partner |' % (r, r, r) for r in rounds)
    print(head)
    print('|---|---|' + '---|---|---|' * len(rounds))
    rows = {}
    for r in rounds:
        ws = {x: weight(x, r, L, SIX, C) for x in UNLOCKS}
        inc = inclusion(ws)
        tot = sum(ws.values())
        for x in UNLOCKS:
            p = IN[x]['best_unlock']
            w2 = dict(ws)
            w2[x] = weight(x, r, L, SIX + (p,), C)
            w2.pop(p)                           # the partner is held, so it is not in the pool
            inc2 = inclusion(w2)
            rows.setdefault(x, []).append((ws[x] / tot, inc[x], inc2[x]))
    for x in sorted(UNLOCKS, key=lambda x: -rows[x][1][1]):
        print('| %s | %d |' % (x, list_price(x, C)) + ''.join(' %s | %s | %s |' % (pc(a), pc(b), pc(c)) for a, b, c in rows[x]))


def print_weights(C, L=9, r=5):
    print('| Reagent | U usefulness | R rarity | A timing (R%d, doctorate) | weight | share of one slot |' % r)
    print('|---|---|---|---|---|---|')
    ws = {x: weight(x, r, L, SIX, C) for x in UNLOCKS}
    tot = sum(ws.values())
    for x in sorted(UNLOCKS, key=lambda x: -ws[x]):
        p = parts(x, r, L, SIX, C)
        print('| %s | %.2f | %.2f | %.2f | %.3f | %s |' % (x, p['U'], p['R'], p['A'], ws[x], pc(ws[x] / tot)))


def print_prices(C):
    print('| Reagent | Held | Worth W | List price | after 1 buy | after 2 |')
    print('|---|---|---|---|---|---|')
    for x in sorted(ALL, key=lambda x: -IN[x]['worth']):
        print('| %s | %s | %+.0f%% | %d | %d | %d |' % (x, IN[x]['held'], 100 * IN[x]['worth'], list_price(x, C), price(x, C, 1), price(x, C, 2)))


def print_order():
    lt = lateness()
    print('| Order | Reagent | Lateness | Swing | Reach | Dependence | Worth | Alive from | Median run (FINDINGS pace) |')
    print('|---|---|---|---|---|---|---|---|---|')
    for k, x in enumerate(unlock_order()):
        i = IN[x]
        print('| %d | %s | %+.2f | %.2f | %s | %.2f | %+.0f%% | %s | %d |' % (k + 1, x, lt[x], i['swing'], pc(i['reach']), i['dependence'],
                                                                         100 * i['worth'], ('round %d' % i['alive']) if i['alive'] else 'never', PACE[k]))


def print_offer_stats(st, label):
    n = st['n']
    print('**%s** (%d runs)' % (label, n))
    print()
    print('| Reagent | Seen in a run | Taken in a run | Held at the end | Bought from the shelf |')
    print('|---|---|---|---|---|')
    for x in sorted(UNLOCKS + SIX, key=lambda x: -st['seen'][x]):
        if not st['seen'][x] and x in SIX:
            continue
        print('| %s | %s | %s | %s | %s |' % (x, pc(st['seen'][x] / n), pc(st['taken'][x] / n), pc(st['held_end'][x] / n), pc(st['buys'][x] / n)))
    print()
    top = st['sets'].most_common(1)[0]
    print('Different final sets: %d of %d runs; the most common set ends %d runs.' % (len(st['sets']), n, top[1]))
    print('Fails the check: %s' % (', '.join(check(st)) or 'none'))
    print()


# ---------------------------------------------------------------------------------------------------------------
# tuning
# ---------------------------------------------------------------------------------------------------------------

def tune(n=600):
    rows = []
    for k in (1.5, 2.5, 3.5):
        for sd in (5, 6):
            for pity_run in (0.25, 0.5, 1.0):
                for shelf_k in (0.4, 1.0):
                    for decay in (1.0, 0.6):
                        C = dict(C0, k=k, pity_run=pity_run, shelf_k=shelf_k, decay=decay, stock={3: 4, 6: 5, 9: sd})
                        worst_t, worst_s, bad = 0, 1, []
                        for name in ('master', 'doctorate'):
                            st = offer_stats(LENGTHS[name], n, C, seed='tune')
                            bad += check(st)
                            worst_t = max(worst_t, max(st['taken'][x] / n for x in UNLOCKS))
                            worst_s = min(worst_s, min(st['seen'][x] / n for x in UNLOCKS))
                            nsets = len(st['sets'])
                        rows.append((len(bad), worst_t, worst_s, nsets, k, sd, pity_run, shelf_k, decay))
                        print('%d %.2f %.2f %d k=%.1f stock9=%d pity_run=%.2f shelf_k=%.1f decay=%.1f' % rows[-1], flush=True)
    rows.sort(key=lambda t: (t[0], t[1]))
    print('BEST')
    for r in rows[:15]:
        print('%d %.2f %.2f %d k=%.1f stock9=%d pity_run=%.2f shelf_k=%.1f decay=%.1f' % r)
    return rows


# ---------------------------------------------------------------------------------------------------------------
# the check on the engine: every round of every run is played
# ---------------------------------------------------------------------------------------------------------------

def _play(task):
    tag, i, r, carried, seed = task
    import engine as E
    import hurdles as H
    import molecules
    global _ENG
    try:
        _ENG
    except NameError:
        _ENG = E.Engine()
    smi = molecules.deal_molecule(r, random.Random('mol/%s/%d/%d' % (seed, i, r)), 3)
    rr = _ENG.play_round(smi, tuple(carried), H.RULES_BAND[r], E.PLAYERS['greedy'], '%s/%d/%d' % (seed, i, r), analyse=False)
    return tag, i, r, rr['pay'], max(rr['steps']) if rr['steps'] else 0


CONFIGS = (('formula', 'doctorate', {}), ('formula', 'master', {}), ('formula', 'bachelor', {}),
           ('flat', 'doctorate', {'flat': True}), ('six only', 'doctorate', None))


def engine_check(out, n=300, C=None, workers=14):
    import multiprocessing as mp
    C = C or C0
    runs = {}
    tasks = []
    for name, length, kw in CONFIGS:
        L = LENGTHS[length]
        tag = '%s/%s' % (name, length)
        if kw is None:
            got = [dict(carried={r: SIX for r in range(1, L + 1)}, seen=set(), taken=set(), bought=[], final=SIX) for _ in range(n)]
        else:
            got = career(L, n, C, 'eng', **kw)
        for i, res in enumerate(got):
            runs[(tag, i)] = res
            for r in range(1, L + 1):
                tasks.append((tag, i, r, res['carried'][r], 'eng'))
    t0 = time.time()
    with mp.Pool(workers) as pool:
        got = pool.map(_play, tasks, chunksize=4)
    pays = defaultdict(dict)
    for tag, i, r, pay, longest in got:
        pays[(tag, i)][r] = (pay, longest)
    pickle.dump(dict(runs=runs, pays=dict(pays), n=n, C=C, seconds=time.time() - t0), open(out, 'wb'))
    print('played %d rounds in %.0f s' % (len(tasks), time.time() - t0))


def _q(a, q):
    a = sorted(a)
    return a[min(len(a) - 1, int(q * len(a)))]


def report(out):
    d = pickle.load(open(out, 'rb'))
    n = d['n']
    print('rounds played: %d, seconds %.0f' % (sum(len(v) for v in d['pays'].values()), d['seconds']))
    for name, length, kw in CONFIGS:
        tag = '%s/%s' % (name, length)
        keys = [k for k in d['runs'] if k[0] == tag]
        tot = [sum(p for p, _ in d['pays'][k].values()) for k in keys]
        m = sum(tot) / len(tot)
        sd = math.sqrt(sum((t - m) ** 2 for t in tot) / len(tot))
        print()
        print('**%s, %s**: run yield mean %.0f, sd %.0f, p10 %.0f, median %.0f, p90 %.0f, best %.0f' % (
            name, length, m, sd, _q(tot, 0.1), _q(tot, 0.5), _q(tot, 0.9), max(tot)))
        if kw is None:
            continue
        seen, taken, held_end, sets = Counter(), Counter(), Counter(), Counter()
        for k in keys:
            res = d['runs'][k]
            seen.update(res['seen'])
            taken.update(res['taken'])
            held_end.update(res['final'])
            sets[res['final']] += 1
        print('different final sets: %d of %d; most common set ends %d runs' % (len(sets), len(keys), sets.most_common(1)[0][1]))
        st = dict(n=len(keys), seen=seen, taken=taken)
        print('fails the check: %s' % (', '.join(check(st)) or 'none'))
        print('| Reagent | Seen | Taken | Held at end | Mean run yield when held at end | when not |')
        print('|---|---|---|---|---|---|')
        for x in sorted(ALL, key=lambda x: -seen[x]):
            if not seen[x] and x in SIX and held_end[x] == len(keys):
                continue
            w = [t for k, t in zip(keys, tot) if x in d['runs'][k]['final']]
            wo = [t for k, t in zip(keys, tot) if x not in d['runs'][k]['final']]
            print('| %s | %s | %s | %s | %s | %s |' % (x, pc(seen[x] / len(keys)), pc(taken[x] / len(keys)), pc(held_end[x] / len(keys)),
                                                 '%.0f' % (sum(w) / len(w)) if w else '-', '%.0f' % (sum(wo) / len(wo)) if wo else '-'))
        L = LENGTHS[length]
        print('mean yield by round: ' + ', '.join('R%d %.0f' % (r, sum(d['pays'][k][r][0] for k in keys) / len(keys)) for r in range(1, L + 1)))


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'table'
    if cmd == 'table':
        print_inputs(); print()
        print_weights(C0); print()
        print_odds(C0); print()
        print_prices(C0); print()
        print_order()
    elif cmd == 'offers':
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 2000
        for name, L in LENGTHS.items():
            print_offer_stats(offer_stats(L, n, C0), name)
        print_offer_stats(offer_stats(9, n, C0, flat=True), 'doctorate, every reagent weighted the same (no formula)')
        print_offer_stats(offer_stats(9, n, C0, picker='novice'), 'doctorate, a player who takes at random')
    elif cmd == 'tune':
        tune(int(sys.argv[2]) if len(sys.argv) > 2 else 1500)
    elif cmd == 'engine':
        engine_check(sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 300)
    elif cmd == 'report':
        report(sys.argv[2])
