"""The thirteenth measure, part 1: the shape of a long run and what a player earns from getting further.

Reads the runs of `sweep_run.py gentle --arg g1,<player>,<runs>` (every round of twelve played, cleared or not, written out in
full).  Bare rounds carry nothing from one to the next, so any pass mark, any run length and a whole career can be laid over
the same rounds afterwards.

    python sweep_career.py show g1                   spec met and the yield over the number to beat, by round and player
    python sweep_career.py fit g1 doctorate          pass marks for the target clear rates (TARGET below), then every player under them
    python sweep_career.py apply g1                  the marks in MARKS (as built in path.js): clear rates, wins, near misses
    python sweep_career.py career g1 [careers]       a career with the unlocks of REACH: runs to the first, the tenth, the first nine-round win
"""
import json
import math
import os
import random
import re
import sys

import sweep_core as SC

PLAYERS = ('novice', 'greedy', 'median', 'planner')
LABEL = {'novice': 'Novice (looks at 4 lines)', 'greedy': 'Casual (looks at 12 lines)', 'median': 'Careful (reads every line)',
         'planner': 'Reads every line and the next hand'}
ROUNDS = {'master': 6, 'doctorate': 9, 'postdoc': 12}


def _marks():
    m = re.search(r'RULE\.needParBy = (\{.*?\});', SC._JS)
    if not m:
        return None
    return {k: [float(x) for x in v.split(',')] for k, v in re.findall(r'(\w+): \[(.*?)\]', m.group(1))}


MARKS = _marks()

# full row of a round: [mol, met, total, par, prog, steps by page, kinds, used, spec names, end]
MOL, MET, TOT, PAR, PROG, STEPS, KINDS, USED, SPEC, END = range(10)


def load(var, exp='gentle'):
    by = {}
    fp = os.path.join(SC.SWEEP_DIR, exp, 'rows.jsonl')
    for line in open(fp, encoding='utf-8'):
        line = line.strip()
        if not line:
            continue
        r = json.loads(line)
        if 'error' in r or not r.get('full'):
            continue
        t = r.get('tag', '?')
        if t.split('/')[0] != var:
            continue
        by.setdefault(t.split('/')[1], []).extend(r['full'])
    return by


def q(v, p):
    v = sorted(v)
    return v[min(len(v) - 1, int(len(v) * p))] if v else 0


def ratio(rd):
    return rd[TOT] / float(rd[PAR])


def show(by):
    for pl in PLAYERS:
        runs = by.get(pl)
        if not runs:
            continue
        print(pl, 'runs', len(runs))
        print('round  met   yield over the number to beat where the spec is met: 10%  25%  50%  75%  90%')
        for i in range(12):
            col = [r[i] for r in runs if len(r) > i]
            met = [ratio(x) for x in col if x[MET]]
            print('%5d %5.1f   %6.2f %6.2f %6.2f %6.2f %6.2f' % (i + 1, 100.0 * len(met) / len(col), q(met, .1), q(met, .25), q(met, .5), q(met, .75), q(met, .9)))


def fit(runs, rates):
    """The pass mark for each round at which this share of these runs clear it."""
    out = []
    for i, want in enumerate(rates):
        col = [r[i] for r in runs if len(r) > i]
        met = sorted((ratio(x) for x in col if x[MET]), reverse=True)
        k = int(round(want / 100.0 * len(col)))
        out.append(0.0 if k >= len(met) else round(met[max(0, k - 1)], 2))
    return out


def cleared(rd, mark, lift=1.0):
    return bool(rd[MET]) and rd[TOT] * lift >= mark * rd[PAR]


def near(rd, mark, lift=1.0, by=0.15):
    """A lost round within `by` of passing: the spec met and the yield at least 1 - by of the mark, or the yield past the mark
    and at least 1 - by of the spec reached."""
    if cleared(rd, mark, lift):
        return False
    y = rd[TOT] * lift / float(max(1e-9, mark * rd[PAR])) if mark > 0 else 9.0
    pr = 1.0 if rd[MET] else (rd[PROG] or 0.0)
    return (pr >= 1.0 and y >= 1 - by) or (y >= 1.0 and pr >= 1 - by)


def apply(runs, marks, lift=1.0):
    n = len(marks)
    rate, nm = [], []
    lost_all = near_all = 0
    for i in range(n):
        col = [r[i] for r in runs if len(r) > i]
        ok = sum(1 for x in col if cleared(x, marks[i], lift))
        rate.append(100.0 * ok / max(1, len(col)))
    # near misses are counted where a run really ends: at its first lost round
    wins = 0
    depth = [0] * (n + 1)
    for r in runs:
        d = 0
        while d < n and cleared(r[d], marks[d], lift):
            d += 1
        depth[d] += 1
        if d >= n:
            wins += 1
        else:
            lost_all += 1
            near_all += 1 if near(r[d], marks[d], lift) else 0
    return {'rate': rate, 'wins': wins, 'n': len(runs), 'depth': depth, 'near': 100.0 * near_all / max(1, lost_all)}


def line(pl, res):
    w, n = res['wins'], res['n']
    prod = 1.0
    for x in res['rate']:
        prod *= x / 100.0
    return '%-8s clear %s | wins %d of %d (%.2f%%; the rates multiplied %.2f%%) | lost rounds within 15%%: %.0f%%' % (
        pl, ' '.join('%3.0f' % x for x in res['rate']), w, n, 100.0 * w / n, 100.0 * prod, res['near'])


# ---------------------------------------------------------------------------------------------------------------
# the ladder (path.js LADDER): what a run earns, won or lost.  A rung is earned once.  `gives` is the shelf whose next thing
# opens; the shelves in HELP lift the yield of later runs in this model.
# ---------------------------------------------------------------------------------------------------------------
def _ladder():
    m = re.search(r'const LADDER = \[(.*?)\n\];', SC._JS, re.S)
    out = []
    for row in re.findall(r'\{(.*?)\}', m.group(1) if m else ''):
        d = {}
        for k, v in re.findall(r"(\w+): ('[^']*'|[\d.]+)", row):
            d[k] = v.strip("'") if v.startswith("'") else float(v)
        out.append(d)
    return out


LADDER = _ladder()
_lc = re.search(r'const LADDER_CAP = (\d+)', SC._JS)
LADDER_CAP = int(_lc.group(1)) if _lc else 99        # rungs handed over by one run at most
RING = ('ring', 'weld', 'tuck', 'knit', 'seal', 'cap', 'close', 'open', 'snap')
HELP = {'instrument': 1.12, 'homunculus': 1.3}       # the yield of every later long run times this, for each one held
CARRY = 5                                            # instruments carried in a run at most


def heavy(smi):
    return len(re.findall(r'Cl|Br|[BCNOSPFI]|[cnos]', smi))


def run_counts(rounds, cl, marks_n, near_n):
    """What the game's counters (path.js countersUpdate, countersRun) add for one run: the rounds played, the last one lost unless won."""
    c = {'runs': 1, 'rounds': len(rounds), 'rounds_won': sum(cl), 'runs_lost': 0 if all(cl) else 1, 'near_rounds': near_n,
         'reflex_steps': 0, 'ring_steps': 0, 'max_chain_page': 0, 'max_kinds_round': 0, 'max_mark': 0, 'max_kinds_run': 0, 'bigger10_rounds': 0,
         'narrow_rounds': 0}
    used = set()
    for rd, ok, mk in zip(rounds, cl, marks_n):
        c['reflex_steps'] += sum(rd[STEPS])
        c['ring_steps'] += sum(v for k, v in rd[KINDS].items() if k in RING)
        c['max_chain_page'] = max(c['max_chain_page'], max(rd[STEPS] or [0]))
        c['max_kinds_round'] = max(c['max_kinds_round'], len(rd[KINDS]))
        c['max_mark'] = max(c['max_mark'], mk)
        used |= set(rd[USED])
        if heavy(rd[END]) >= heavy(rd[MOL]) + 10:
            c['bigger10_rounds'] += 1
        if ok and len(rd[USED]) <= 3:
            c['narrow_rounds'] += 1
    c['max_kinds_run'] = len(used)
    return c


def rung_met(g, cnt, deep):
    if g['kind'] == 'depth':
        return deep >= g['n']
    return cnt.get(g['counter'], 0) >= g['n']


def career(by_long, by_b, marks, n_runs=300, rng=None, help_k=None, ladder=True, eff=1.0, until=None):
    """One career: always the longest run open.  Returns the run numbers of the first rung, the tenth, the first master's and
    doctorate win, and what was held after 10, 30, 100 runs."""
    rng = rng or random.Random(1)
    hk = help_k or HELP
    reach, cnt, got, deep = 1, {}, [], 0
    out = {'first': None, 'tenth': None, 'master': None, 'doctorate': None, 'bachelor': None, 'held': {}, 'gave': [], 'deep': {}}
    shelf = {}
    for i in range(1, n_runs + 1):
        ln = ('bachelor', 'master', 'doctorate')[min(reach, 3) - 1]
        if ln == 'bachelor':
            r = by_b[rng.randrange(len(by_b))]
            cl, played = [], []
            for rd in r[:3]:
                played.append(rd)
                cl.append(bool(rd[MET]))
                if not cl[-1]:
                    break
            mk = [sum(1 for k in (1, 2, 4, 8) if ratio(rd) >= k) for rd in played]
            nr = 0
            won = len(cl) == 3 and all(cl)
        else:
            lift = (hk['instrument'] ** min(CARRY, shelf.get('instrument', 0))) * (hk['homunculus'] if ln != 'master' and shelf.get('homunculus', 0) else 1.0)
            if not ladder:
                lift = 1.0
            lift *= eff                  # the sign: the lift of the signs taken over how far the number to beat has risen
            r = by_long[rng.randrange(len(by_long))]
            ms = marks[ln]
            cl, played = [], []
            for j, rd in enumerate(r[:len(ms)]):
                played.append(rd)
                cl.append(cleared(rd, ms[j], lift))
                if not cl[-1]:
                    break
            mk = [sum(1 for k in (1, 2, 4, 8) if ratio(rd) * lift >= k) for rd in played]
            nr = 1 if (not cl[-1] and near(played[-1], ms[len(cl) - 1], lift)) else 0
            won = len(cl) == len(ms) and all(cl)
            deep = max(deep, sum(cl))
        c = run_counts(played, cl, mk, nr)
        for k, v in c.items():
            cnt[k] = max(cnt.get(k, 0), v) if k.startswith('max_') else cnt.get(k, 0) + v
        if won:
            cnt['won_' + ln] = cnt.get('won_' + ln, 0) + 1
            if out.get(ln) is None:
                out[ln] = i
            reach = max(reach, {'bachelor': 2, 'master': 3, 'doctorate': 3}.get(ln, 3))
        new = 0
        for g in LADDER:
            if new < LADDER_CAP and g['id'] not in got and rung_met(g, cnt, deep):
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
        if until and len(got) >= until:
            out['full'] = i              # the run on which the sign can be taken
            break
    return out


_sg = re.search(r'const SIGN = \{ lift: ([\d.]+), bar: ([\d.]+), share: ([\d.]+), laps: (\d+)', SC._JS)
SIGN = {'lift': float(_sg.group(1)), 'bar': float(_sg.group(2)), 'share': float(_sg.group(3)), 'laps': int(_sg.group(4))} if _sg else None


def laps_table(by, var_b, n=200, cap=600, bar=None):
    """Careers through the sign: each lap starts with nothing, yields lifted by the signs taken, the number to beat risen, and
    ends when SIGN.share of the ladder is held again (the sign can be taken)."""
    byb = load(var_b)
    bar = bar or SIGN['bar']
    until = int(math.ceil(SIGN['share'] * len(LADDER)))
    print('| Player | Lap (signs taken) | Yield times | Number to beat times | Runs until the sign can be taken (9 tenths held again) | First six-round win in the lap (run) | First nine-round win in the lap (run) | Laps finished within %d runs |' % cap)
    print('|---|---|---|---|---|---|---|---|')
    for pl in PLAYERS:
        if pl not in by or pl not in byb:
            continue
        rng = random.Random('laps/' + pl)
        for k in range(SIGN['laps'] + 1):
            eff = (1 + SIGN['lift'] * k) / bar ** k
            cs = [career(by[pl], byb[pl], MARKS, cap, rng, eff=eff, until=until) for _ in range(n)]
            s_ = lambda x: 'not in %d' % cap if x is None else str(x)
            print('| %s | %d | %.1f | %.2f | %s | %s | %s | %.0f in 100 |' % (LABEL[pl], k, 1 + SIGN['lift'] * k, bar ** k, s_(med([c.get('full') for c in cs], n)),
                                                                  s_(med([c['master'] for c in cs], n)), s_(med([c['doctorate'] for c in cs], n)),
                                                                  100.0 * sum(1 for c in cs if c.get('full')) / n))


def med(v, n):
    """Median over n careers of a run number that may never come (None): None when under half got there."""
    got = sorted(x for x in v if x is not None)
    if len(got) * 2 < n:
        return None
    return got[min(len(got) - 1, n // 2)]


def career_table(by, var_b, n=400, n_runs=300, help_k=None, ladder=True):
    byb = load(var_b)
    print("| Player | Runs to the first thing earned | To the tenth | Runs of the first 20 that earn something | Things earned after 10, 30, 100 runs | Deepest round of a long run cleared after 10, 30, 100 runs | First six-round win (run) | First nine-round win (run) | Careers with a nine-round win in %d runs |" % n_runs)
    print('|---|---|---|---|---|---|---|---|---|')
    for pl in PLAYERS:
        if pl not in by or pl not in byb:
            continue
        rng = random.Random('career/' + pl)
        cs = [career(by[pl], byb[pl], MARKS, n_runs, rng, help_k, ladder) for _ in range(n)]
        f = lambda k: med([c[k] for c in cs], n)
        s = lambda x: 'not in %d' % n_runs if x is None else str(x)
        g20 = sum(sum(1 for x in c['gave'][:20] if x) for c in cs) / float(n)
        held = ', '.join('%.0f' % (sum(c['held'][k][0] for c in cs) / float(n)) for k in (10, 30, 100))
        deep = ', '.join('%.1f' % (sum(c['deep'][k] for c in cs) / float(n)) for k in (10, 30, 100))
        print('| %s | %s | %s | %.0f | %s | %s | %s | %s | %.0f in 100 |' % (LABEL[pl], s(f('first')), s(f('tenth')), g20, held, deep, s(f('master')), s(f('doctorate')),
                                                                         100.0 * sum(1 for c in cs if c['doctorate'] is not None) / n))


# the clear rates the marks are fitted to: the casual player in the gentle rounds, the careful player in the wall
TARGET = {
    'master': ('greedy', [80, 72, 60, 45], 'median', [55, 40]),
    'doctorate': ('greedy', [80, 74, 66, 56, 46, 38], 'median', [52, 42, 34]),
    'postdoc': ('greedy', [80, 74, 66, 56, 46, 38], 'median', [52, 42, 34, 40, 34, 28]),
}

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'show'
    var = sys.argv[2] if len(sys.argv) > 2 else 'g1'
    by = load(var)
    if cmd == 'show':
        show(by)
    elif cmd == 'fit':
        for ln in (sys.argv[3].split(',') if len(sys.argv) > 3 else ROUNDS):
            p1, r1, p2, r2 = TARGET[ln]
            if len(sys.argv) > 4:
                r = [float(x) for x in sys.argv[4].split(',')]
                r1, r2 = r[:len(r1)], r[len(r1):]
            marks = fit(by[p1], r1) + fit([r[len(r1):] for r in by[p2]], r2)
            print(ln, 'marks', ', '.join('%.2f' % m for m in marks))
            for pl in PLAYERS:
                if pl in by:
                    print('  ' + line(pl, apply(by[pl], marks)))
    elif cmd == 'apply':
        for ln, marks in (MARKS or {}).items():
            print(ln, marks)
            for pl in PLAYERS:
                if pl in by:
                    print('  ' + line(pl, apply(by[pl], marks)))
    elif cmd == 'final':
        # runs stopped at the first round not cleared, the players aiming at the mark (sweep_run.py final13): wins, clear rates of
        # the runs still alive, and how many lost rounds were within 15 in 100 of passing
        fp = os.path.join(SC.SWEEP_DIR, 'final13', 'rows.jsonl')
        acc = {}
        for ln_ in open(fp, encoding='utf-8'):
            r = json.loads(ln_) if ln_.strip() else None
            if not r or 'error' in r or not r.get('full'):
                continue
            acc.setdefault(r['tag'], []).extend(r['full'])
        for tag in sorted(acc):
            ln = tag.split('/')[0]
            ms = MARKS[ln]
            runs = acc[tag]
            n = len(runs)
            wins = sum(1 for r in runs if len(r) == len(ms) and cleared(r[-1], ms[-1]))
            alive = [sum(1 for r in runs if len(r) > i) for i in range(len(ms))]
            ok = [sum(1 for r in runs if len(r) > i and cleared(r[i], ms[i])) for i in range(len(ms))]
            lost = [r[-1] for r in runs if not (len(r) == len(ms) and cleared(r[-1], ms[-1]))]
            nearn = sum(1 for r in runs if not (len(r) == len(ms) and cleared(r[-1], ms[-1])) and near(r[-1], ms[len(r) - 1]))
            near25 = sum(1 for r in runs if not (len(r) == len(ms) and cleared(r[-1], ms[-1])) and near(r[-1], ms[len(r) - 1], by=0.25))
            se = 1.96 * math.sqrt(max(wins, 1) / float(n) * (1 - wins / float(n)) / n)
            print('%-22s runs %5d | wins %4d (%.2f%%; %.2f to %.2f) | of those alive, clear: %s | lost rounds within 15%%: %.0f%%, within 25%%: %.0f%%' % (
                tag, n, wins, 100.0 * wins / n, 100 * max(0, wins / float(n) - se), 100 * (wins / float(n) + se),
                ' '.join('%2.0f' % (100.0 * ok[i] / alive[i]) if alive[i] >= 20 else ' .' for i in range(len(ms))),
                100.0 * nearn / max(1, len(lost)), 100.0 * near25 / max(1, len(lost))))
    elif cmd == 'laps':
        laps_table(by, var + '_bachelor', int(sys.argv[3]) if len(sys.argv) > 3 else 200, bar=float(sys.argv[4]) if len(sys.argv) > 4 else None)
    elif cmd == 'career':
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 400
        print('with the ladder (an instrument lifts the yield %.2f times, five carried at most; a homunculus %.2f times)' % (HELP['instrument'], HELP['homunculus']))
        career_table(by, var + '_bachelor', n)
        print('the same careers when nothing earned lifts the yield')
        career_table(by, var + '_bachelor', n, ladder=False)
