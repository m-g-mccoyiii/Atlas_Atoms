"""The sixteenth measure, item 2: how many runs each deed of the reference book takes.

Reads the runs of `sweep_run.py deed16 --arg <pool>,<runs>` (pools b, none, kit, plus; every round played and what the deeds read
written out) and the ladder of path.js (LADDER: each rung's counter and number).  The counters below are the ones path.js
countersUpdate keeps, written again on the simulator's record of a round; a rung's counter not kept here is reported as such.

    python sweep_deeds.py rates            how often each counter moves, a run, by pool and player (for setting a deed's number)
    python sweep_deeds.py career [n]       careers: the run on which each thing is earned, casual and careful
"""
import json
import math
import os
import random
import re
import sys

import sweep_career as C
import sweep_core as SC

PL = {'greedy': 'Casual', 'median': 'Careful'}
A, RG, DB, CH, FU, CO, CC, OH, COOH, AR = range(10)       # sweep_run.DEED_KEYS and the benzene flag
RINGK = ('ring', 'weld', 'tuck', 'knit', 'seal', 'cap', 'close', 'open', 'snap')
D = 11                                                      # where the deed record sits in a full row
OFFN = {'carbon dioxide': 'carbon_dioxide', 'acid fumes': 'acid_fumes'}


def base(k):
    """A reflex across the fold counts as its twin along the chain (ring_far as ring, and so on)."""
    return k[:-4] if k.endswith('_far') else k


def is_ring(k):
    return base(k) in RINGK or k in ('bridge', 'stitch', 'link', 'bridge_o')


def load(exp=None):
    exp = exp or os.environ.get('SWEEP_DEEDS') or 'deed16'
    by = {}
    fp = os.path.join(SC.SWEEP_DIR, exp, 'rows.jsonl')
    for line in open(fp, encoding='utf-8'):
        r = json.loads(line) if line.strip() else None
        if not r or 'error' in r:
            continue
        for pl, d in r['by'].items():
            if d.get('full'):
                e = by.setdefault(pl, {}).setdefault(r['tag'], [])
                for run in d['full']:
                    e.append({'rounds': run, 'rack': r.get('rack', [])})
    return by


def round_counts(rd, won, marks_n, near, task_lost, long_run):
    """One round's counters (path.js countersUpdate).  Returns (adds, tops): counts to add, and highest-ever values."""
    a, t = {}, {}

    def add(k, n=1):
        a[k] = a.get(k, 0) + n

    def top(k, v):
        t[k] = max(t.get(k, 0), v)
    d = rd[D]
    f0, pages = d['f0'], d['p']
    add('rounds')
    if won:
        add('rounds_won')
    fired, kinds, steps, water, prev = set(), {}, 0, 0, None
    n_close = n_cap = co2_pages = epox_pages = 0
    het = set()
    for names, places, sets, chain, off, F in pages:
        off = {OFFN.get(k, k): v for k, v in off.items()}
        steps += len(chain)
        top('max_chain_page', len(chain))
        cs = [(n, p, s) for n, p, s in zip(names, places, sets) if n != 'finish']
        for n, p, s in cs:
            fired.add(n)
            add(n + '_fired')
            if p > 0:
                add(n + '_acted')
            else:
                add('wasted_circles')        # a bottle lined up that found nothing to act on (seventeenth, item 5: it can feed the wood spirit's jar)
        if any(sum(1 for n2, p2, _s in cs if n2 == n and p2 > 0) >= 2 for n in set(x[0] for x in cs)):
            add('twice_pages')               # a page on which one reagent landed twice (it can feed the slime's jar)
        for n, p, s in cs:
            if n in ('dehydrate', 'hydrate', 'oxidize', 'grow', 'epoxidation'):
                top('max_%s_places' % n, p)
        for k in chain:
            kinds[k] = 1
            b = base(k)
            if b == 'dry':
                add('dry_steps')
            if is_ring(k):
                add('ring_steps')
            if b in ('ring', 'tuck'):
                het.add('O')
            if b == 'knit':
                het.add('N')
            if b == 'cap':
                het.add('S')
        n_close += sum(1 for k in chain if base(k) == 'close')
        n_cap += sum(1 for k in chain if base(k) == 'cap')
        top('max_rings_page', sum(1 for k in chain if is_ring(k)))
        top('max_co_gain', F[CO] - f0[CO])
        top('max_dbl_gain', F[DB] - f0[DB])
        top('max_cc_gain', F[CC] - f0[CC])
        top('max_both_gain', min(F[CC] - f0[CC], F[CO] - f0[CO]))
        top('max_water_page', off.get('water', 0))
        top('max_h2_page', off.get('hydrogen', 0))
        water += off.get('water', 0)
        for k, v in off.items():
            add('off_' + k, v)
        if off.get('carbon_dioxide', 0) > 0:
            co2_pages += 1
        if any(n == 'epoxidation' and p > 0 for n, p in zip(names, places)):
            epox_pages += 1
        nm = [n for n, p, s in cs]
        land = [p > 0 for n, p, s in cs]
        if nm == ['hydrate', 'dehydrate', 'hydrate'] and all(land):
            add('hdh_pages')
        if any(n == 'ritter' and p > 0 for n, p, s in cs) and any(base(k) == 'knit' for k in chain):
            add('n_ring_pages')
        if any(n == 'thiolene' and p > 0 for n, p, s in cs) and any(base(k) == 'cap' for k in chain):
            add('s_ring_pages')
        i = next((j for j, (n, p, s) in enumerate(cs) if n == 'epoxidation' and p > 0), -1)
        if i >= 0 and any(n == 'oxidize' and p > 0 for n, p, s in cs[i + 1:]):
            add('epox_ox_pages')
        i = next((j for j, (n, p, s) in enumerate(cs) if n == 'hydrate' and p > 0), -1)
        if i >= 0 and any(n == 'oxidize' and p > 0 for n, p, s in cs[i + 1:]):
            add('hydrate_then_oxidize')
        if len(cs) >= 3 and all(n == nm[0] for n in nm):
            add('one_reagent_lines')
        if len(cs) >= 3 and sum(1 for n, p, s in cs if s > 0) >= 3:
            add('all3_pages')
        if len(cs) >= 3:
            top('max_last_set', cs[-1][2])
        top('max_limits_page', int(sum(1 for k in chain if base(k) == 'dry') >= 1) + int(sum(1 for k in chain if base(k) == 'weld') >= 2) + int(sum(1 for k in chain if base(k) == 'ring') >= 2))
        if prev is not None and nm and nm == prev[0] and chain and prev[1]:
            add('repeat_pages')
        prev = (nm, chain)
    end = pages[-1][5] if pages else f0
    add('reflex_steps', steps)
    top('max_kinds_round', len(kinds))
    top('max_mark', marks_n)
    top('max_kinds_fired_round', len(fired))
    top('max_close_round', n_close)
    top('max_cap_round', n_cap)
    top('max_co2_pages_round', co2_pages)
    top('max_epox_pages_round', epox_pages)
    top('max_rings_gain', end[RG] - f0[RG])
    top('max_chain_gain', end[CH] - f0[CH])
    top('max_fused_gain', end[FU] - f0[FU])
    if not won and pages:
        top('max_lost_last_chain', len(pages[-1][3]))
    top('max_shrink_round', f0[A] - end[A])
    if long_run:
        top('max_spent_round', d.get('sp', 0))
    if end[A] >= f0[A] + 10:
        add('bigger10_rounds')
    if end[A] < f0[A]:
        add('smaller_rounds')
    if f0[CO] >= 2 and end[CO] == 0:
        add('co_cleared_rounds')
    if end[COOH] > f0[COOH]:
        add('cooh_rounds')
    if f0[AR] and marks_n >= 2:
        add('arene_mark_rounds')
    if f0[FU] == 0 and end[FU] >= 1:
        add('fused_made_rounds')
    if won and pages and not pages[0][3]:
        add('met_after_empty')
    if not won and pages and len(pages[-1][3]) >= 4:
        add('lost_hot_rounds')
    if len(pages) >= 3 and all(any(base(k) == 'dry' for k in pg[3]) for pg in pages):
        add('dry3_rounds')
    if len(pages) >= 3 and all({OFFN.get(k, k): v for k, v in pg[4].items()}.get('water', 0) > 0 for pg in pages):
        add('water3_rounds')
    if won and water == 0:
        add('dry_free_rounds')
    if won and len(fired) <= 3:
        add('narrow_rounds')
    if near:
        add('near_rounds')
    if task_lost:
        add('task_lost_rounds')
    return a, t, fired, het


def play(run, ln, marks, lift=1.0):
    """Cut a run at its first round not cleared.  Returns the rounds played with (won, marks, near, task lost) each."""
    out = []
    ms = marks.get(ln)
    for i, rd in enumerate(run['rounds'][:{'bachelor': 3, 'master': 6, 'doctorate': 9}[ln]]):
        ok = bool(rd[C.MET]) if ln == 'bachelor' else C.cleared(rd, ms[i], lift)
        x = C.ratio(rd) * lift
        mk = (1 + sum(1 for k in SC.TIERS if x >= k)) if x >= 1 else 0
        nr = (not ok) and ln != 'bachelor' and C.near(rd, ms[i])
        tl = (not ok) and ln != 'bachelor' and not rd[C.MET] and x >= ms[i]
        out.append((rd, ok, mk, nr, tl))
        if not ok:
            break
    return out


def ladder_things():
    """The ladder's rungs that hand over a named thing: id, kind, counter, n, gives, thing."""
    return [g for g in C.LADDER if g.get('thing')]


def jars():
    m = re.search(r'const JAR = \{ full: \{(.*?)\}', SC._JS)
    return {k: int(v) for k, v in re.findall(r'(\w+): (\d+)', m.group(1))}


# what feeds each jar, as a counter of this file (path.js HOMS feed); None: not kept by the simulator
JAR_FEED = {'water': ('off_water',), 'h2': ('off_hydrogen',), 'co2': ('off_carbon_dioxide',), 'acid': ('hydrate_acted', 'dehydrate_acted'), 'wood': ('reduce_acted',),
            'salt': None, 'slime': ('hydroborate_acted',), 'seedling': ('grow_acted',), 'ammonia': ('off_ammonia', 'ritter_acted'), 'brimstone': ('off_sulfur', 'thiolene_acted')}


JARX = {'size': {}, 'feed': {}}      # seventeenth, item 5: trials of the jars (smaller jars; further feeds)


def career(pools, n_runs, rng, marks, cap=None, lift=1.0, until=None):
    """One career: the longest run open each time.  Returns {thing or rung id: (run the deed was done, run it was handed over)}."""
    cap = cap or C.LADDER_CAP
    cnt, cntL, got, done, deep, reach = {}, {}, {}, {}, 0, 1      # cntL: what was done in six-round and nine-round runs only (path.js 'L:' counters)
    have_inst, have_reag = 0, set()
    JF = dict(jars(), **JARX['size'])
    out = {'won': {}, 'credit': [], 'sign': None}
    credit, n_got = 0, 0
    for i in range(1, n_runs + 1):
        ln = ('bachelor', 'master', 'doctorate')[reach - 1]
        if ln == 'bachelor':
            pool = pools['b']
        else:
            pool = pools['kit'] if (have_inst >= 2 and 'kit' in pools) else pools['none']
            if have_reag and 'plus' in pools and rng.random() < 0.5:
                fit = [r for r in pools['plus'] if set(r['rack'][6:]) <= have_reag]
                if fit:
                    pool = fit
        run = pool[rng.randrange(len(pool))]
        rs = play(run, ln, marks, lift)
        fired, het = set(), set()
        for rd, ok, mk, nr, tl in rs:
            a, t, f, h = round_counts(rd, ok, mk, nr, tl, ln != 'bachelor')
            for cc in ((cnt, cntL) if ln != 'bachelor' else (cnt,)):
                for k, v in a.items():
                    cc[k] = cc.get(k, 0) + v
                for k, v in t.items():
                    cc[k] = max(cc.get(k, 0), v)
            fired |= f
            het |= h
            if ok and ln != 'bachelor':
                deep = max(deep, len([1 for x in rs if x[1]]))
        cnt['runs'] = cnt.get('runs', 0) + 1
        won = len(rs) == {'bachelor': 3, 'master': 6, 'doctorate': 9}[ln] and rs[-1][1]
        if not won:
            cnt['runs_lost'] = cnt.get('runs_lost', 0) + 1
        cnt['max_kinds_run'] = max(cnt.get('max_kinds_run', 0), len(fired))
        cnt['max_het_rings_run'] = max(cnt.get('max_het_rings_run', 0), len(het))
        if ln != 'bachelor':
            cntL['max_het_rings_run'] = max(cntL.get('max_het_rings_run', 0), len(het))
        if won:
            out['won'].setdefault(ln, i)
            if ln == 'bachelor':
                done.setdefault('len_master', i)
                got.setdefault('len_master', i)
            if ln == 'master':
                done.setdefault('len_doctorate', i)
                got.setdefault('len_doctorate', i)
        if cnt.get('hydrate_then_oxidize', 0) >= 1 and 'found_wacker' not in done:
            done['found_wacker'] = got['found_wacker'] = i       # near enough: hydrate, then oxidize, both acting, on one page
        if won:
            reach = max(reach, {'bachelor': 2, 'master': 3, 'doctorate': 3}[ln])
        new = 0
        for g in C.LADDER:
            if g.get('gives') == 'closed':
                continue
            met = deep >= g['n'] if g['kind'] == 'depth' else (cntL if g.get('long') else cnt).get(g['counter'], 0) >= g['n']
            if met and g['id'] not in done:
                done[g['id']] = i
            if met and g['id'] not in got and new < cap:
                got[g['id']] = i
                new += 1
                n_got += 1
                credit += int(g.get('credit', 0) or 0)
                if g.get('gives') == 'instrument':
                    have_inst += 1
                if g.get('gives') == 'reagent':
                    have_reag.add(g.get('thing'))
        for h, feed in JAR_FEED.items():
            feed = (feed or ()) + tuple(JARX['feed'].get(h, ()))
            if feed and ('jar_' + h) not in done and sum(cnt.get(k, 0) for k in feed) >= JF[h]:
                done['jar_' + h] = got['jar_' + h] = i
        out['credit'].append(credit)
        out.setdefault('feed', []).append({h: sum(cnt.get(k, 0) for k in (f or ())) for h, f in JAR_FEED.items()})
        if out['sign'] is None and until and n_got >= until:
            out['sign'] = i
            break
    out['done'], out['got'], out['cnt'] = done, got, cnt
    return out


def med(v, n):
    v = sorted(x for x in v if x is not None)
    return None if len(v) * 2 < n else v[min(len(v) - 1, n // 2)]


def careers(by, n=200, n_runs=300):
    marks = C.MARKS
    res = {}
    for pl in ('greedy', 'median'):
        pools = by[pl]
        rng = random.Random('deeds/' + pl)
        res[pl] = [career(pools, n_runs, rng, marks) for _ in range(n)]
    return res


def table(res, n_runs=300):
    n = len(res['greedy'])
    s = lambda x: 'not in %d' % n_runs if x is None else str(x)
    print('| Thing | Rung | Counter | Number | Casual: run the deed is done (middle career) | Casual: run it is handed over | Careful: deed done | Careful: handed over | Casual careers that get it in %d runs, of 100 |' % n_runs)
    print('|---|---|---|---|---|---|---|---|---|')
    rows = [(g.get('thing'), g['id'], g.get('counter', 'depth'), g['n'], g.get('gives')) for g in ladder_things()] + [(h, 'jar_' + h, '+'.join(f) if f else 'not kept here', jars()[h], 'homunculus') for h, f in JAR_FEED.items()]
    for thing, gid, ctr, num, gives in rows:
        f = lambda pl, w: med([c[w].get(gid) for c in res[pl]], n)
        print('| %s (%s) | %s | %s | %s | %s | %s | %s | %s | %.0f |' % (thing, gives, gid, ctr, ('%g' % num), s(f('greedy', 'done')), s(f('greedy', 'got')), s(f('median', 'done')), s(f('median', 'got')),
                                                                    100.0 * sum(1 for c in res['greedy'] if gid in c['got']) / n))
    for pl in ('greedy', 'median'):
        cs = res[pl]
        held = lambda k: sum(sum(1 for g in ladder_things() if c['got'].get(g['id'], 10 ** 9) <= k) + sum(1 for h in JAR_FEED if c['got'].get('jar_' + h, 10 ** 9) <= k) for c in cs) / float(n)
        print('%s: things held after 5, 10, 20, 40, 100, %d runs: %s; first six-round win run %s, first nine-round win run %s' % (
            PL[pl], n_runs, ', '.join('%.0f' % held(k) for k in (5, 10, 20, 40, 100, n_runs)), s(med([c['won'].get('master') for c in cs], n)), s(med([c['won'].get('doctorate') for c in cs], n))))


def rates(by):
    """How often each counter moves: for a count, a run's average; for a highest-ever, the share of runs that reach each value."""
    marks = C.MARKS
    for pl in ('greedy', 'median'):
        for pool, runs in sorted(by[pl].items()):
            ln = 'bachelor' if pool == 'b' else 'doctorate'
            adds, tops = {}, {}
            for run in runs:
                ta = {}
                for rd, ok, mk, nr, tl in play(run, ln, marks):
                    a, t, f, h = round_counts(rd, ok, mk, nr, tl, ln != 'bachelor')
                    for k, v in a.items():
                        adds[k] = adds.get(k, 0) + v
                    for k, v in t.items():
                        ta[k] = max(ta.get(k, 0), v)
                for k, v in ta.items():
                    tops.setdefault(k, []).append(v)
            n = float(len(runs))
            print('%s, pool %s, %d runs (cut at the first round lost)' % (PL[pl], pool, n))
            print('  a run adds: ' + ', '.join('%s %.2f' % (k, v / n) for k, v in sorted(adds.items())))
            print('  runs of 100 that reach: ' + '; '.join('%s %s' % (k, ' '.join('%d:%.0f' % (x, 100.0 * sum(1 for v in vs if v >= x) / n) for x in sorted(set(vs)) if x > 0)[:60]) for k, vs in sorted(tops.items())))


def earn(res, n_runs=300):
    """Write _sweep/deed16/earn.json for sweep_refdoc.py: for each thing of the book, the run of the middle career on which it is
    handed over (jars: hatched), casual and careful; None when under half the careers get it in n_runs."""
    n = len(res['greedy'])
    out = {}
    keys = [(g['gives'] + ':' + g['thing'], g['id']) for g in ladder_things()] + [('homunculus:' + h, 'jar_' + h) for h in JAR_FEED if JAR_FEED[h]] + [
        ('length:master', 'len_master'), ('length:doctorate', 'len_doctorate'), ('reagent:wacker', 'found_wacker')]
    for k, gid in keys:
        out[k] = {'casual': med([c['got'].get(gid) for c in res['greedy']], n), 'careful': med([c['got'].get(gid) for c in res['median']], n),
                  'casual_done': med([c['done'].get(gid) for c in res['greedy']], n), 'careful_done': med([c['done'].get(gid) for c in res['median']], n)}
    json.dump({'runs': n_runs, 'careers': n, 'earn': out}, open(os.path.join(SC.SWEEP_DIR, 'deed16', 'earn.json'), 'w'), indent=0)
    return out


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'rates'
    by = load()
    if cmd == 'rates':
        rates(by)
    elif cmd == 'jars':
        # seventeenth, item 5: the wood spirit's and the slime's jars three ways.  python sweep_deeds.py jars [careers]
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 200
        ways = (('as they are (40 reduce, 70 hydroborate)', {}, {}), ('smaller jars (15 and 25)', {'wood': 15, 'slime': 25}, {}),
                ('fed by a starting play too (a bottle that found nothing; a page where one reagent landed twice)', {}, {'wood': ('wasted_circles',), 'slime': ('twice_pages',)}),
                ('fed by a starting play too, counted at half', {'wood': 80, 'slime': 140}, {'wood': ('wasted_circles', 'reduce_acted'), 'slime': ('twice_pages', 'hydroborate_acted')}))
        print('| Way | Player | Wood spirit hatches (run of the middle career) | careers that hatch it in 300 runs, of 100 | Slime hatches | careers, of 100 |')
        print('|---|---|---|---|---|---|')
        for name, size, feed in ways:
            JARX['size'], JARX['feed'] = size, feed
            res = careers(by, n)
            for pl in ('greedy', 'median'):
                cs = res[pl]
                f = lambda h: (med([c['got'].get('jar_' + h) for c in cs], n), 100.0 * sum(1 for c in cs if ('jar_' + h) in c['got']) / n)
                w, sl = f('wood'), f('slime')
                print('| %s | %s | %s | %.0f | %s | %.0f |' % (name, PL[pl], w[0] if w[0] else 'not in 300', w[1], sl[0] if sl[0] else 'not in 300', sl[1]))
        JARX['size'], JARX['feed'] = {}, {}
    elif cmd == 'grow':
        # seventeenth: creatures that keep growing (path.js HOMGROW.keep): the run on which the lifetime count of each jar reaches
        # 1, 2, 4, 7, 11 ... times its size.  python sweep_deeds.py grow [careers] [multiples joined by +]
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 200
        mult = [float(x) for x in sys.argv[3].split('+')] if len(sys.argv) > 3 else [1, 2, 4, 7, 11]
        res = careers(by, n)
        JF = jars()
        print('| Creature | Jar | ' + ' | '.join('Casual: run at %g jars' % m for m in mult) + ' | ' + ' | '.join('Careful: %g' % m for m in mult) + ' |')
        for h, f in JAR_FEED.items():
            if not f:
                continue
            cells = []
            for pl in ('greedy', 'median'):
                for m in mult:
                    at = [next((i + 1 for i, d in enumerate(c['feed']) if d[h] >= m * JF[h]), None) for c in res[pl]]
                    v = med(at, n)
                    cells.append(str(v) if v else 'not in 300')
            print('| %s | %d | %s |' % (h, JF[h], ' | '.join(cells)))
    elif cmd == 'credit':
        # seventeenth, item 3: credit over a career under the new ladder, and the sign's three laps.  python sweep_deeds.py credit [careers]
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 200
        res = careers(by, n)
        tot = sum(int(g.get('credit', 0) or 0) for g in C.LADDER)
        print('the ladder: %d rungs, %d pay credit, %d credit in all' % (len(C.LADDER), sum(1 for g in C.LADDER if g.get('credit')), tot))
        for pl in ('greedy', 'median'):
            cs = res[pl]
            print('%s: credit held after 5, 10, 20, 40, 100, 300 runs (nothing spent): %s' % (PL[pl], ', '.join('%.0f' % (sum(c['credit'][k - 1] for c in cs) / float(n)) for k in (5, 10, 20, 40, 100, 300))))
        until = int(math.ceil(C.SIGN['share'] * len(C.LADDER)))
        print('the sign can be taken when %d of the %d rungs are held' % (until, len(C.LADDER)))
        print('| Player | Lap (signs taken) | Yield times | Number to beat times | Runs until the sign can be taken | First six-round win in the lap (run) | First nine-round win in the lap (run) | Laps finished within 600 runs, of 100 |')
        print('|---|---|---|---|---|---|---|---|')
        for pl in ('greedy', 'median'):
            rng = random.Random('laps17/' + pl)
            for k in range(C.SIGN['laps'] + 1):
                lift = (1 + C.SIGN['lift'] * k) / C.SIGN['bar'] ** k
                cs = [career(by[pl], 600, rng, C.MARKS, lift=lift, until=until) for _ in range(n)]
                s_ = lambda x: 'not in 600' if x is None else str(x)
                print('| %s | %d | %.1f | %.2f | %s | %s | %s | %.0f |' % (PL[pl], k, 1 + C.SIGN['lift'] * k, C.SIGN['bar'] ** k, s_(med([c['sign'] for c in cs], n)), s_(med([c['won'].get('master') for c in cs], n)),
                                                                     s_(med([c['won'].get('doctorate') for c in cs], n)), 100.0 * sum(1 for c in cs if c['sign']) / n))
    else:
        res = careers(by, int(sys.argv[2]) if len(sys.argv) > 2 else 200)
        table(res)
        earn(res)
