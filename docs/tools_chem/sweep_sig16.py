"""The sixteenth measure, item 1: the nine sigils alone, in pairs and in threes, and three ways of getting them.

Reads the runs of `sweep_run.py sig16 --arg <what>,both,<runs>` (nine rounds, every round played, written out in full, every
set of sigils on the same deals).  Rounds played this way carry nothing from one to the next, so a run in which sigils are got
on the way (bought, chosen, offered) is laid together from rounds of the sets held at each round.

    python sweep_sig16.py sets [player [size [top]]]   each set against none: wins of nine, worth, the biggest round, what play changes
    python sweep_sig16.py pairs [player]               pairs and threes: what they do together that none does alone
    python sweep_sig16.py homs                         each sigil with each creature (careful player)
    python sweep_sig16.py gold                         gold a round pays, by round and player
    python sweep_sig16.py ways [runs]                  the three ways of getting them, compared
"""
import json
import math
import os
import random
import re
import sys

import sweep_career as C
import sweep_core as SC
import sweep_help as H

MS = C.MARKS['doctorate']
SIG9 = ('phlogiston', 'clepsydra', 'via_humida', 'unbound', 'aqua_permanens', 'tetractys', 'respiratio', 'gemini', 'sulphurs_mask')
NAME = {'phlogiston': 'Phlogiston', 'clepsydra': 'Clepsydra', 'via_humida': 'Via Humida', 'unbound': 'Solve', 'aqua_permanens': 'Aqua Permanens',
        'tetractys': 'Tetractys', 'respiratio': 'Respiratio', 'gemini': 'Gemini', 'sulphurs_mask': "Sulphur's Mask"}
PL = {'greedy': 'Casual', 'median': 'Careful'}


def load(exp='sig16'):
    """{player: {set name: [run, ...]}}; a set name is ids joined by + ('none' for no sigil)."""
    by = {}
    fp = os.path.join(SC.SWEEP_DIR, exp, 'rows.jsonl')
    for line in open(fp, encoding='utf-8'):
        r = json.loads(line) if line.strip() else None
        if not r or 'error' in r:
            continue
        st = r['tag'].split('/')[0]
        rows = r['by'] if 'by' in r else {r.get('player', 'median'): r}
        for pl, d in rows.items():
            if d.get('full'):
                by.setdefault(pl, {}).setdefault(st, []).extend(d['full'])
    return by


def key(ids):
    return '+'.join(s for s in SIG9 if s in ids) or 'none'


def nm(st):
    return ' + '.join(NAME.get(x, x.replace('hom:', '')) for x in st.split('+')) if st != 'none' else 'none'


def stats(runs, base):
    n = len(runs)
    rds = [rd for r in runs for rd in r[:9]]
    rat = sorted(C.ratio(rd) for rd in rds)
    steps = sum(sum(rd[C.STEPS]) for rd in rds)
    pages = sum(len(rd[C.STEPS]) for rd in rds)
    w = H.win(runs)
    return {'n': n, 'win': w, 'worth': H.flat_lift(base, w) if base is not None else 1.0, 'y': math.exp(H.mlog(runs)), 'met': 100.0 * sum(rd[C.MET] for rd in rds) / len(rds),
            'max': rat[-1], 'p99': rat[int(len(rat) * 0.99)], 'steps': steps / float(pages), 'top': sum(1 for x in rat if x >= SC.TIERS[-1]) / float(n),
            'rates': H.rates(runs), 'wall': [100 * x for x in H.rates(runs)[6:]]}


def se_win(runs):
    """A rough 'good to' for a win rate read as nine clear rates multiplied: the relative errors of the nine, added in squares."""
    v = 0.0
    for i, p in enumerate(H.rates(runs)):
        n = sum(1 for r in runs if len(r) > i)
        if p > 0:
            v += (1 - p) / (p * n)
    return math.sqrt(v)


def share(runs, idx):
    c = {}
    for r in runs:
        for rd in r[:9]:
            for k, v in rd[idx].items():
                c[k] = c.get(k, 0) + v
    t = float(sum(c.values()) or 1)
    return {k: v / t for k, v in c.items()}, sum(c.values()) / float(len(runs))


def moved(runs, base, idx, least=0.03):
    a, _ = share(runs, idx)
    b, _ = share(base, idx)
    d = sorted(((a.get(k, 0) - b.get(k, 0), k) for k in set(a) | set(b)), key=lambda t: -abs(t[0]))
    return ', '.join('%s %+d' % (k, round(100 * x)) for x, k in d[:4] if abs(x) >= least)


def is_sigset(st):
    return st != 'none' and '&' not in st and 'hom:' not in st


def sets(by, pl, size=None, top=None):
    d = by[pl]
    base = d['none']
    b = stats(base, None)
    print('%s: none, %d runs: wins of nine %.2f in 100; task met %.0f; rounds 7, 8, 9 cleared %s; biggest round %.1f times the number to beat; steps a page %.2f; rounds at the top mark a run %.2f' % (
        PL[pl], b['n'], b['win'], b['met'], ', '.join('%.0f' % x for x in b['wall']), b['max'], b['steps'], b['top']))
    print('| Sigils | Runs | Wins of nine, of 100 (good to, times) | Worth | Yield as read, times | Task met, of 100 rounds | Rounds 7, 8, 9 cleared, of 100 | Biggest round, times the number to beat | Rounds at the top mark, a run | Reflex steps a page | Reagents used more or less (points of share) | Reflexes more or less |')
    print('|---|---|---|---|---|---|---|---|---|---|---|---|')
    rows = []
    for st, runs in d.items():
        k = 0 if st == 'none' else st.count('+') + 1
        if not is_sigset(st) or (size is not None and k != size):
            continue
        rows.append((st, stats(runs, base), runs))
    rows.sort(key=lambda t: -t[1]['worth'])
    show = rows if not top or len(rows) <= 2 * top else rows[:top] + rows[-top:]
    for st, s, runs in show:
        print('| %s | %d | %.2f (%.1f) | %.2f | %.2f | %.0f | %s | %.1f | %.2f | %.2f | %s | %s |' % (
            nm(st), s['n'], s['win'], math.exp(se_win(runs)), s['worth'], s['y'] / b['y'], s['met'], ', '.join('%.0f' % x for x in s['wall']), s['max'], s['top'], s['steps'],
            moved(runs, base, C.USED), moved(runs, base, C.KINDS)))
    return rows


def pairs(by, pl):
    """What sigils do together that none does alone: the worth of the set over the worths of its sigils multiplied."""
    d = by[pl]
    base = d['none']
    w1 = {s: stats(d[s], base)['worth'] for s in SIG9 if s in d}
    out = []
    for st, runs in d.items():
        ids = st.split('+')
        if not is_sigset(st) or len(ids) < 2 or any(x not in w1 for x in ids):
            continue
        s = stats(runs, base)
        alone = 1.0
        for x in ids:
            alone *= w1[x]
        out.append((s['worth'] / alone, st, s, alone))
    for k in (2, 3, 4):
        rows = sorted((r for r in out if r[1].count('+') == k - 1), reverse=True)
        if not rows:
            continue
        print('%s, sets of %d: %d sets, %d runs each' % (PL[pl], k, len(rows), rows[0][2]['n']))
        print('| Set | Worth together | The %d alone, multiplied | Together over apart | Wins of nine, of 100 | Biggest round, times the number to beat |' % k)
        print('|---|---|---|---|---|---|')
        for r in rows[:8] + rows[-6:]:
            print('| %s | %.2f | %.2f | %.2f | %.2f | %.1f |' % (nm(r[1]), r[2]['worth'], r[3], r[0], r[2]['win'], r[2]['max']))
        ws = sorted(r[2]['worth'] for r in rows)
        wn = sorted(r[2]['win'] for r in rows)
        print('worth of a set of %d: lowest %.2f, middle %.2f, highest %.2f; wins of nine: lowest %.2f, middle %.2f, highest %.2f; sets with a round past 10 times the number to beat: %d; past 6 times: %d' % (
            k, ws[0], ws[len(ws) // 2], ws[-1], wn[0], wn[len(wn) // 2], wn[-1], sum(1 for r in rows if r[2]['max'] > 10), sum(1 for r in rows if r[2]['max'] > 6)))
        # each sigil's average 'together over apart' over the sets it is in
        print('   a sigil over the sets of %d it is in, together over apart: %s' % (k, ', '.join('%s %.2f' % (NAME[s], sum(r[0] for r in rows if s in r[1].split('+')) / max(1, sum(1 for r in rows if s in r[1].split('+')))) for s in SIG9)))
    return out


def homs(by, pl='median'):
    d = by[pl]
    base = d['none']
    hs = sorted({st.split('hom:')[1] for st in d if 'hom:' in st})
    print('| Sigil | ' + ' | '.join(hs) + ' |')
    print('|---|' + '---|' * len(hs))
    print('| the creature alone: wins of nine, of 100 | ' + ' | '.join('%.2f' % H.win(d['hom:' + h]) if 'hom:' + h in d else '.' for h in hs) + ' |')
    for s in SIG9:
        cells = []
        for h in hs:
            k = '%s+hom:%s' % (s, h)
            if k not in d or s not in d or 'hom:' + h not in d:
                cells.append('.')
                continue
            w, ws, wh = H.flat_lift(base, H.win(d[k])), H.flat_lift(base, H.win(d[s])), H.flat_lift(base, H.win(d['hom:' + h]))
            mx = max(C.ratio(rd) for r in d[k] for rd in r[:9])
            cells.append('%.2f (%.2f)%s' % (w, w / (ws * wh), ' max %.0f' % mx if mx > 10 else ''))
        print('| %s | %s |' % (NAME[s], ' | '.join(cells)))


# --- gold -------------------------------------------------------------------------------------------------------------------
def gold_of(rd, held, cleared=True, per_clear=0):
    """path.js runEarn: a round at or past the number to beat pays one for each mark above it, and interest on gold held first.
    per_clear: RULE.goldClear, gold for a round cleared whatever its yield."""
    x = C.ratio(rd)
    g = per_clear if cleared else 0
    if x >= 1:
        g += sum(1 for k in SC.TIERS if x >= k) + min(SC.COIN['cap'], held // SC.COIN['per'])
    return g


def gold(by, per_clear=0):
    print('| Player | Gold a round pays, rounds 1 to 9 (every round played, nothing bought) | Gold held after round 3, 6, 9 of runs still alive then | Runs alive after round 3, 6, of 100 |')
    print('|---|---|---|---|')
    for pl in ('greedy', 'median'):
        runs = by[pl]['none']
        per = [sum(gold_of(r[i], 0, C.cleared(r[i], MS[i]), per_clear) for r in runs) / float(len(runs)) for i in range(9)]
        held = {3: [], 6: [], 9: []}
        for r in runs:
            g = 0
            for i in range(9):
                if not C.cleared(r[i], MS[i]):
                    break
                g += gold_of(r[i], g, True, per_clear)
                if i + 1 in held:
                    held[i + 1].append(g)
        print('| %s | %s | %s | %s |' % (PL[pl], ', '.join('%.2f' % x for x in per), ', '.join('%.1f' % (sum(v) / max(1.0, len(v))) for v in held.values()),
                                       ', '.join('%.0f' % (100.0 * len(held[k]) / len(runs)) for k in (3, 6))))


# --- the three ways of getting them -------------------------------------------------------------------------------------------
def _js(name, default=None):
    m = re.search(r'const %s = (\{.*?\});' % name, SC._JS, re.S)
    if not m:
        return default
    t = re.sub(r'(\w+):', r'"\1":', m.group(1)).replace("'", '"')
    return json.loads(t)


GET = _js('SIGIL_GET') or {}
SIM2JS = {'unbound': 'solve'}


def price_of(s, bought, G=None):
    G = G or GET
    return G['price'][SIM2JS.get(s, s)] + G['step'] * bought


def one_run(pools, way, rng, owned, G, worth, pick='best', per_clear=0, spend=1.0, cap=3, marks=MS):
    """One nine-round run laid together from rounds of the sets held.  way: none, buy, start, offer.
    pick: 'best' the player takes the one worth most to him (he has learned which), 'any' one at random.
    spend: the share of his gold he is willing to put into sigils (the rest goes to the shelf's reagent and the re-deals)."""
    held = []
    st = {'gold': 0, 'spent': 0}
    out = {'won': False, 'cleared': 0, 'at': {}, 'gold': 0, 'spent': 0, 'earn': {}}

    def choose(shown):
        if pick == 'best':
            shown = [s for s in shown if worth.get(s, 1) >= 1.0]       # he has learned which ones hurt and leaves them
        if not shown:
            return None
        return max(shown, key=lambda s: worth.get(s, 1)) if pick == 'best' else rng.choice(shown)

    def visit(nxt):
        left = [s for s in owned if s not in held]
        if len(held) >= cap or not left:
            return
        if way == 'start' and nxt in G['startRounds']:
            c = choose(left)
            if c:
                held.append(c)
        elif way == 'offer' and nxt - 1 in G['offerRounds']:
            c = choose(rng.sample(left, min(G['offerN'], len(left))))
            if c:
                held.append(c)
        elif way == 'buy' and nxt > 1:
            shown = rng.sample(left, min(G['shown'], len(left)))
            while shown and len(held) < cap:
                keep = (1 - spend) * (st['gold'] + st['spent'])
                can = [s for s in shown if price_of(s, len(held), G) <= st['gold'] - keep]
                s = choose(can)
                if s is None:
                    break
                p = price_of(s, len(held), G)
                st['gold'] -= p
                st['spent'] += p
                held.append(s)
                shown.remove(s)

    visit(1)
    for i in range(9):
        out['at'][i + 1] = len(held)
        pool = pools.get(key(held))
        if pool is None:               # a set not played
            pool = pools[key(held[:3])]
        rd = rng.choice(pool)[i]
        ok = C.cleared(rd, marks[i])
        e = gold_of(rd, st['gold'], ok, per_clear)
        st['gold'] += e
        out['earn'][i + 1] = (len(held), e)
        if not ok:
            break
        out['cleared'] = i + 1
        if i < 8:
            visit(i + 2)
    out['won'] = out['cleared'] == 9
    out['held'] = tuple(held)
    out['gold'], out['spent'] = st['gold'], st['spent']
    return out


def ways(by, n=20000, G=None, per_clear=None, owned_n=(9, 4), cap=3, quiet=False):
    G = G or GET
    pc = G.get('goldClear', 0) if per_clear is None else per_clear
    res = {}
    for pl in ('greedy', 'median'):
        pools = {k: v for k, v in by[pl].items() if k == 'none' or is_sigset(k)}
        base = pools['none']
        worth = {s: stats(pools[s], base)['worth'] for s in SIG9}
        if not quiet:
            print('%s' % PL[pl])
            print('| Way | Sigils owned | The player takes | Held going into round 2, 4, 7, 9 (runs that get there) | Held when the run ends | Wins of nine, of 100 | Runs that reach round 7, of 100 | Two runs end holding the same set, of 100 pairs | Different sets in 1,000 runs | Gold spent on sigils a run |')
            print('|---|---|---|---|---|---|---|---|---|---|')
        for way, picks, spends in (('none', ('best',), (1.0,)), ('buy', ('best', 'any'), (1.0, 0.5)), ('start', ('best', 'any'), (1.0,)), ('offer', ('best', 'any'), (1.0,))):
            for on in owned_n:
                for pick in picks:
                    for spend in spends:
                        if way == 'none' and on != owned_n[0]:
                            continue
                        rng = random.Random('ways/%s/%s/%d/%s/%s' % (pl, way, on, pick, spend))
                        rs = []
                        for _ in range(n):
                            owned = list(SIG9) if on >= 9 else rng.sample(SIG9, on)
                            rs.append(one_run(pools, way, rng, owned, G, worth, pick, pc, spend, cap))
                        at = lambda r_: sum(x['at'][r_] for x in rs if r_ in x['at']) / float(max(1, sum(1 for x in rs if r_ in x['at'])))
                        endh = sum(len(x['held']) for x in rs) / float(n)
                        win = 100.0 * sum(x['won'] for x in rs) / n
                        r7 = 100.0 * sum(1 for x in rs if 7 in x['at']) / n
                        cnt = {}
                        for x in rs:
                            cnt[frozenset(x['held'])] = cnt.get(frozenset(x['held']), 0) + 1
                        same = 100.0 * sum(v * (v - 1) for v in cnt.values()) / float(n * (n - 1))
                        d1000 = len({frozenset(x['held']) for x in rs[:1000]})
                        res[(pl, way, on, pick, spend)] = {'win': win, 'end': endh, 'same': same, 'r7': r7, 'runs': rs}
                        if not quiet:
                            print('| %s | %d | %s%s | %.1f, %.1f, %.1f, %.1f | %.2f | %.2f | %.1f | %.0f | %d | %.1f |' % (
                                way, on, {'best': 'the strongest he can', 'any': 'any at random'}[pick] if way != 'none' else '', ', half his gold kept for other things' if spend < 1 else '',
                                at(2), at(4), at(7), at(9), endh, win, r7, same, d1000, sum(x['spent'] for x in rs) / float(n)))
    return res


def snowball(by, n=40000, G=None, pc=None):
    """Does a rich run get richer?  Gold a round pays by how many sigils were held in it, and wins by when the first was bought."""
    G = G or GET
    for pl in ('greedy', 'median'):
        pools = {k: v for k, v in by[pl].items() if k == 'none' or is_sigset(k)}
        worth = {s: stats(pools[s], pools['none'])['worth'] for s in SIG9}
        rng = random.Random('snow/' + pl)
        rs = [one_run(pools, 'buy', rng, list(SIG9), G, worth, 'best', G.get('goldClear', 0) if pc is None else pc) for _ in range(n)]
        e = {}
        for x in rs:
            for r_, (h, g) in x['earn'].items():
                if r_ >= 4:
                    a = e.setdefault(h, [0, 0])
                    a[0] += g
                    a[1] += 1
        early = [x for x in rs if x['at'].get(4, 0) >= 1]
        late = [x for x in rs if 4 in x['at'] and x['at'][4] == 0]
        print('%s: gold a round pays in rounds 4 to 9 holding 0, 1, 2, 3 sigils: %s.  Of runs that reach round 4: holding one by then %d in 100, they win %.2f in 100; the rest win %.2f in 100' % (
            PL[pl], ', '.join('%.2f' % (e[h][0] / float(e[h][1])) if h in e else '.' for h in range(4)), 100.0 * len(early) / max(1, len(early) + len(late)),
            100.0 * sum(x['won'] for x in early) / max(1, len(early)), 100.0 * sum(x['won'] for x in late) / max(1, len(late))))


def first_ten(by, G=None, n=4000, pc=None):
    """What a new player meets: nine-round runs while he owns the first one or three sigils he has earned."""
    G = G or GET
    for pl in ('greedy', 'median'):
        pools = {k: v for k, v in by[pl].items() if k == 'none' or is_sigset(k)}
        worth = {s: stats(pools[s], pools['none'])['worth'] for s in SIG9}
        print(PL[pl])
        print('| Way | Sigils owned | Of ten runs, runs in which a sigil was held at all | Runs that end holding one, two, three | Rounds played with a sigil at work, of 100 |')
        print('|---|---|---|---|---|')
        for way in ('buy', 'start', 'offer'):
            for on in (1, 3):
                rng = random.Random('ten/%s/%s/%d' % (pl, way, on))
                rs = [one_run(pools, way, rng, rng.sample(SIG9, on), G, worth, 'best', G.get('goldClear', 0) if pc is None else pc, 1.0) for _ in range(n)]
                any_ = 10.0 * sum(1 for x in rs if x['held']) / n
                k = [10.0 * sum(1 for x in rs if len(x['held']) == j) / n for j in (1, 2, 3)]
                played = sum(len(x['at']) for x in rs)
                with_ = sum(1 for x in rs for r_, h in x['at'].items() if h)
                print('| %s | %d | %.1f | %.1f, %.1f, %.1f | %.0f |' % (way, on, any_, k[0], k[1], k[2], 100.0 * with_ / played))


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'sets'
    by = load()
    if cmd == 'sets':
        for pl in ([sys.argv[2]] if len(sys.argv) > 2 else ['median', 'greedy']):
            sets(by, pl, int(sys.argv[3]) if len(sys.argv) > 3 else 1, int(sys.argv[4]) if len(sys.argv) > 4 else None)
    elif cmd == 'pairs':
        for pl in ([sys.argv[2]] if len(sys.argv) > 2 else ['median', 'greedy']):
            pairs(by, pl)
    elif cmd == 'homs':
        homs(by)
    elif cmd == 'gold':
        gold(by, int(sys.argv[2]) if len(sys.argv) > 2 else 0)
    elif cmd == 'ways':
        ways(by, int(sys.argv[2]) if len(sys.argv) > 2 else 20000, cap=int(sys.argv[3]) if len(sys.argv) > 3 else 3, per_clear=int(sys.argv[4]) if len(sys.argv) > 4 else None, owned_n=tuple(int(x) for x in sys.argv[5].split('+')) if len(sys.argv) > 5 else (9, 4))
    elif cmd == 'snow':
        snowball(by, pc=int(sys.argv[2]) if len(sys.argv) > 2 else None)
    elif cmd == 'ten':
        first_ten(by, pc=int(sys.argv[2]) if len(sys.argv) > 2 else None)
