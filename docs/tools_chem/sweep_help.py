"""The fourteenth measure, part 2: what each helper does for a run, as it is, and a career with real helpers.

Reads the runs of `sweep_run.py help14 --arg <set>,<player>,<runs>` (nine rounds, every round played, written out in full).

    python sweep_help.py each [player]          each set against `none` on the same deals: yield times, task met, wins of nine,
                                                and the flat lift of the bare run's yield that wins as often
    python sweep_help.py career [careers]       careers in which a run's rounds are drawn from runs played WITH the helpers held
"""
import json
import math
import os
import random
import sys

import sweep_career as C
import sweep_core as SC

MS = C.MARKS['doctorate']


def load():
    by = {}
    fp = os.path.join(SC.SWEEP_DIR, 'help14', 'rows.jsonl')
    for line in open(fp, encoding='utf-8'):
        r = json.loads(line) if line.strip() else None
        if not r or 'error' in r or not r.get('full'):
            continue
        st, pl = r['tag'].split('/')
        d = by.setdefault(pl, {}).setdefault(st, {'runs': [], 'mod': {}})
        d['runs'].extend(r['full'])
        for nm, m in (r.get('mod') or {}).items():
            e = d['mod'].setdefault(nm, {})
            for k, v in m.items():
                if isinstance(v, (int, float)):
                    e[k] = e.get(k, 0) + v
    return by


def rates(runs, lift=1.0, ms=MS):
    out = []
    for i in range(len(ms)):
        col = [r[i] for r in runs if len(r) > i]
        out.append(sum(1 for x in col if C.cleared(x, ms[i], lift)) / float(max(1, len(col))))
    return out


def win(runs, lift=1.0, ms=MS):
    p = 1.0
    for x in rates(runs, lift, ms):
        p *= x
    return 100.0 * p


def mlog(runs):
    v = [math.log(max(1.0, rd[C.TOT])) for r in runs for rd in r[:9]]
    return sum(v) / len(v)


def flat_lift(base, target):
    """The flat lift of the bare run's yield at which its wins of nine equal `target`."""
    lo, hi = 0.5, 4.0
    for _ in range(40):
        mid = (lo * hi) ** 0.5
        if win(base, mid) < target:
            lo = mid
        else:
            hi = mid
    return (lo * hi) ** 0.5


def each(by, pl):
    d = by[pl]
    base = d['none']['runs']
    b0, w0 = mlog(base), win(base)
    print('%s: none, %d runs: wins of nine %.2f in 100, task met %.0f in 100' % (C.LABEL[pl], len(base), w0, 100.0 * sum(rd[C.MET] for r in base for rd in r[:9]) / (9.0 * len(base))))
    print('| Helper | Runs | Yield as read, times | On the product, times | Task met, of 100 rounds | Wins of nine, of 100 | Against none | The flat lift of the yield that wins as often | Used, of 100 rounds |')
    print('|---|---|---|---|---|---|---|---|---|')
    for st in sorted(d, key=lambda s: -win(d[s]['runs'])):
        if st == 'none':
            continue
        runs = d[st]['runs']
        y = math.exp(mlog(runs) - b0)
        w = win(runs)
        used = '; '.join('%s %d' % (nm, 100.0 * m.get('taps', 0) / max(1, m.get('rounds', 0))) for nm, m in d[st]['mod'].items() if m.get('rounds'))
        print('| %s | %d | %.2f | %.2f | %.0f | %.2f | %.1f | %.2f | %s |' % (st, len(runs), y, y * y, 100.0 * sum(rd[C.MET] for r in runs for rd in r[:9]) / (9.0 * len(runs)),
                                                                           w, w / max(1e-9, w0), flat_lift(base, w), used))


def career_real(pools, by_b, n_runs=300, rng=None, carry=5):
    """One career (sweep_career.career) in which a long run's rounds come from a run played with the helpers held: the pool is the
    one for the count of instruments on the shelf (up to `carry`) and, in the nine-round run, a creature if one is held."""
    rng = rng or random.Random(1)
    reach, cnt, got, deep = 1, {}, [], 0
    out = {'first': None, 'tenth': None, 'master': None, 'doctorate': None, 'bachelor': None, 'held': {}, 'gave': [], 'deep': {}}
    shelf = {}
    ks = sorted({k for k, h in pools})
    for i in range(1, n_runs + 1):
        ln = ('bachelor', 'master', 'doctorate')[min(reach, 3) - 1]
        if ln == 'bachelor':
            r = by_b[rng.randrange(len(by_b))]
            cl, played = [], []
            for rd in r[:3]:
                played.append(rd)
                cl.append(bool(rd[C.MET]))
                if not cl[-1]:
                    break
            mk = [sum(1 for k in SC.MARKS if C.ratio(rd) >= k) for rd in played]
            nr = 0
            won = len(cl) == 3 and all(cl)
        else:
            k = min(carry, shelf.get('instrument', 0))
            k = max(x for x in ks if x <= k)
            # a homunculus hatches from a jar, not from a rung: here one is held once 200 reflex steps have been set off over the career (the
            # thirteenth measure's rung, kept as a stand-in for the first jar filling)
            h = 1 if (ln != 'master' and cnt.get('reflex_steps', 0) >= 200 and (k, 1) in pools) else 0
            pool = pools[(k, h)]
            r = pool[rng.randrange(len(pool))]
            ms = C.MARKS[ln]
            cl, played = [], []
            for j, rd in enumerate(r[:len(ms)]):
                played.append(rd)
                cl.append(C.cleared(rd, ms[j]))
                if not cl[-1]:
                    break
            mk = [sum(1 for q in SC.MARKS if C.ratio(rd) >= q) for rd in played]
            nr = 1 if (not cl[-1] and C.near(played[-1], ms[len(cl) - 1])) else 0
            won = len(cl) == len(ms) and all(cl)
            deep = max(deep, sum(cl))
        c = C.run_counts(played, cl, mk, nr)
        for kk, v in c.items():
            cnt[kk] = max(cnt.get(kk, 0), v) if kk.startswith('max_') else cnt.get(kk, 0) + v
        if won:
            if out.get(ln) is None:
                out[ln] = i
            reach = max(reach, {'bachelor': 2, 'master': 3, 'doctorate': 3}.get(ln, 3))
        new = 0
        for g in C.LADDER:
            if new < C.LADDER_CAP and g['id'] not in got and C.rung_met(g, cnt, deep):
                got.append(g['id'])
                shelf[g['gives']] = shelf.get(g['gives'], 0) + 1
                new += 1
        out['gave'].append(new)
        if new and out['first'] is None:
            out['first'] = i
        if len(got) >= 10 and out['tenth'] is None:
            out['tenth'] = i
        if i in (10, 30, 100, 300):
            out['held'][i] = (len(got), shelf.get('instrument', 0), shelf.get('homunculus', 0))
            out['deep'][i] = deep
    return out


def career_table(by, n=300, n_runs=300, real=True):
    print('| Player | Things earned after 10, 30, 100 runs | Deepest round of a long run cleared after 10, 30, 100 runs | First six-round win (run) | First nine-round win (run) | Careers with a nine-round win in %d runs |' % n_runs)
    print('|---|---|---|---|---|---|')
    for pl in ('novice', 'greedy', 'median'):
        if pl not in by or 'none' not in by[pl]:
            continue
        byb = C.load('now_b', 'flat14').get(pl)
        if not byb:
            print(pl, 'no first-game runs (sweep_run.py flat14 --arg now_b,%s,600,g,bachelor)' % pl)
            continue
        pools = {(0, 0): by[pl]['none']['runs']}
        for st, d in by[pl].items():
            if st[0] == 'k' and 'h' in st and st[1].isdigit():
                pools[(int(st[1:st.index('h')]), int(st[st.index('h') + 1:]))] = d['runs']
        if not real:
            pools = {(0, 0): pools[(0, 0)]}
        rng = random.Random('career14/' + pl)
        cs = [career_real(pools, byb, n_runs, rng) for _ in range(n)]
        f = lambda k: C.med([c[k] for c in cs], n)
        s = lambda x: 'not in %d' % n_runs if x is None else str(x)
        print('| %s | %s | %s | %s | %s | %.0f in 100 | pools %s' % (C.LABEL[pl], ', '.join('%.0f' % (sum(c['held'][k][0] for c in cs) / float(n)) for k in (10, 30, 100)),
                                                           ', '.join('%.1f' % (sum(c['deep'][k] for c in cs) / float(n)) for k in (10, 30, 100)),
                                                           s(f('master')), s(f('doctorate')), 100.0 * sum(1 for c in cs if c['doctorate'] is not None) / n,
                                                           sorted((k, len(v)) for k, v in pools.items())))


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'each'
    by = load()
    if cmd == 'each':
        each(by, sys.argv[2] if len(sys.argv) > 2 else 'median')
    elif cmd == 'career':
        career_table(by, int(sys.argv[2]) if len(sys.argv) > 2 else 300, real=(len(sys.argv) < 4 or sys.argv[3] != 'bare'))
