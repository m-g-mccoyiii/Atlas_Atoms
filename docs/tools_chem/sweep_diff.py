"""The twelfth measure: read the runs of `sweep_run.py diff` (every round played, cleared or not) and say what any pass mark
on the yield would do.  Bare rounds carry nothing from one to the next, so a run is won when every round of it is cleared and
a pass mark can be laid over the same runs afterwards.

    python sweep_diff.py show  base/median                 spec met and yield over the number to beat, by round
    python sweep_diff.py fit   base/median 80,72,68,...    the pass mark by round that gives this clear rate to that player
    python sweep_diff.py apply base/median,base/greedy 0.5,0.6,...   clear rates and wins under these pass marks
"""
import json
import os
import sys

import sweep_core as SC

HERE = os.path.dirname(os.path.abspath(__file__))


def load(exp='diff'):
    by = {}
    fp = os.path.join(SC.SWEEP_DIR, exp, 'rows.jsonl')
    for line in open(fp, encoding='utf-8'):
        line = line.strip()
        if not line:
            continue
        r = json.loads(line)
        if 'error' in r or not r.get('rr'):
            continue
        by.setdefault(r.get('tag', '?'), []).extend(r['rr'])
    return by


def q(v, p):
    v = sorted(v)
    return v[min(len(v) - 1, int(len(v) * p))] if v else 0


def show(runs, n=12):
    print('runs', len(runs))
    print('round  met%%   yield over the number to beat, rounds with the spec met: 10%%  25%%  50%%  75%%  90%%   all rounds 50%%')
    for i in range(n):
        col = [r[i] for r in runs if len(r) > i]
        if not col:
            break
        met = [x[1] for x in col if x[0]]
        print('%5d  %5.1f   %6.2f %6.2f %6.2f %6.2f %6.2f   %6.2f' % (i + 1, 100.0 * len(met) / len(col), q(met, .1), q(met, .25), q(met, .5),
                                                                 q(met, .75), q(met, .9), q([x[1] for x in col], .5)))


def fit(runs, rates, n=12):
    """The pass mark for each round at which this share of the runs clear it (spec met and yield at or past the mark)."""
    out = []
    for i in range(n):
        col = [r[i] for r in runs if len(r) > i]
        want = rates[min(i, len(rates) - 1)] / 100.0
        met = sorted((x[1] for x in col if x[0]), reverse=True)
        k = int(round(want * len(col)))
        if k >= len(met):
            out.append(0.0)
        else:
            out.append(round(met[max(0, k - 1)], 2))
    return out


def apply(runs, marks, n=12, lift=1.0):
    """Clear rate by round (all runs), wins of nine and twelve, close calls.  lift: every yield times this."""
    rate, near_miss, near_win = [], [], []
    for i in range(n):
        col = [r[i] for r in runs if len(r) > i]
        m = marks[min(i, len(marks) - 1)]
        ok = [x for x in col if x[0] and x[1] * lift >= m]
        rate.append(100.0 * len(ok) / max(1, len(col)))
        lost = [x for x in col if not (x[0] and x[1] * lift >= m)]
        # a close call: lost with the spec met and the yield within a quarter of the mark, or won by less than a third over it
        near_miss.append(100.0 * sum(1 for x in lost if x[0] and m and x[1] * lift >= 0.75 * m) / max(1, len(lost)))
        near_win.append(100.0 * sum(1 for x in ok if m and x[1] * lift < 1.33 * m) / max(1, len(ok)))

    def won(k):
        full = [r for r in runs if len(r) >= k]
        return sum(1 for r in full if all(x[0] and x[1] * lift >= marks[min(i, len(marks) - 1)] for i, x in enumerate(r[:k]))), len(full)
    return {'rate': rate, 'w9': won(9), 'w12': won(12) if n >= 12 else None, 'near_miss': near_miss, 'near_win': near_win}


def line(tag, res):
    w9, w12 = res['w9'], res['w12']
    s = '%-16s %s | nine %d of %d (%.2f%%)' % (tag, ' '.join('%3.0f' % x for x in res['rate']), w9[0], w9[1], 100.0 * w9[0] / max(1, w9[1]))
    if w12 and w12[1]:
        s += ' | twelve %d (%.2f%%)' % (w12[0], 100.0 * w12[0] / w12[1])
    return s


def final(exp='final'):
    """Runs stopped at the first round not cleared (sweep_run.py final ...): by tag, runs, wins of nine and of twelve, and the
    share of the runs still alive that clear each round."""
    by = {}
    for line in open(os.path.join(SC.SWEEP_DIR, exp, 'rows.jsonl'), encoding='utf-8'):
        r = json.loads(line) if line.strip() else None
        if not r or 'error' in r:
            continue
        d = by.setdefault(r.get('tag', '?'), {'n': 0, 'w9': 0, 'w12': 0, 'alive': [0] * 12, 'ok': [0] * 12, 'near': 0, 'lost': 0})
        d['n'] += r['n']
        d['w12'] += r['won']
        d['w9'] += sum(1 for x in (r.get('rr') or []) if len(x) >= 10) if len(r.get('alive', [])) > 9 else r['won']
        for i, v in enumerate(r.get('alive', [])[:12]):
            d['alive'][i] += v
            d['ok'][i] += r['ok'][i]
    for t, d in sorted(by.items()):
        n = d['n']
        import math
        lo = lambda k: 100.0 * max(0.0, (k / n) - 1.96 * math.sqrt(max(k, 1) / n * (1 - k / n) / n))
        hi = lambda k: 100.0 * ((k / n) + 1.96 * math.sqrt(max(k, 1) / n * (1 - k / n) / n))
        print('%-28s runs %6d | nine %5d (%.2f%%; %.2f to %.2f) | twelve %4d (%.2f%%) | of those alive, clear: %s' % (
            t, n, d['w9'], 100.0 * d['w9'] / n, lo(d['w9']), hi(d['w9']), d['w12'], 100.0 * d['w12'] / n,
            ' '.join('%2.0f' % (100.0 * d['ok'][i] / d['alive'][i]) if d['alive'][i] >= 20 else ' .' for i in range(12))))
    return by


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'final':
        final(sys.argv[2] if len(sys.argv) > 2 else 'final')
        sys.exit(0)
    by = load(os.environ.get('SWEEP_EXP', 'diff'))
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'list'
    if cmd == 'list':
        for k, v in sorted(by.items()):
            print(k, len(v))
    elif cmd == 'show':
        for t in sys.argv[2].split(','):
            print(t)
            show(by[t])
    elif cmd == 'fit':
        marks = fit(by[sys.argv[2]], [float(x) for x in sys.argv[3].split(',')])
        print('marks', ','.join('%.2f' % m for m in marks))
        for t in sorted(by):
            if t.split('/')[0] == sys.argv[2].split('/')[0]:
                print(line(t, apply(by[t], marks)))
    elif cmd == 'apply':
        marks = [float(x) for x in sys.argv[3].split(',')]
        lift = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
        for t in sys.argv[2].split(','):
            res = apply(by[t], marks, lift=lift)
            print(line(t, res))
            print('   lost rounds that were close (spec met, yield within a quarter):', ' '.join('%3.0f' % x for x in res['near_miss']))
            print('   won rounds that were close (under a third over the mark):     ', ' '.join('%3.0f' % x for x in res['near_win']))
