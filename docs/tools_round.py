# How wide a round is and how much of a choice a turn is, from the rig's logs.
# Usage: python tools_round.py <tag> <first file> <last file> [player ...]
# Reads rounds logged with { all: true } (and { dec: true } for the turn measures). Every run counts in every round,
# missed or not, so the spread does not depend on the number to beat.
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tools_rig as rig

def report(tag, lo, hi, players):
    rows = rig.load(tag, lo, hi)
    for p in players:
        a = [r for r in rows if r['player'] == p]
        if not a: continue
        print('%s %s: %d rounds, %d runs' % (tag, p, len(a), len(set(r['seed'] for r in a))))
        worst = 0
        for rd in range(1, 10):
            v = sorted(r['total'] for r in a if r['round'] == rd)
            if len(v) < 10: continue
            q10, q50, q90 = rig.q(v, 0.1), rig.q(v, 0.5), rig.q(v, 0.9); sp = q90 / max(1, q10); worst = max(worst, sp)
            ch = sorted(r.get('chain', 0) for r in a if r['round'] == rd)
            long = [r['total'] for r in a if r['round'] == rd and r.get('chain', 0) >= max(1, rig.q(ch, 0.75))]
            short = [r['total'] for r in a if r['round'] == rd and r.get('chain', 0) <= rig.q(ch, 0.5)]
            print('  round %d: n %d  10th %9d  median %10d  90th %11d  spread %7.1f | chain median %d, 90th %d, longest %d; long chains over the rest %.1f' % (rd, len(v), q10, q50, q90, sp, rig.q(ch, 0.5), rig.q(ch, 0.9), ch[-1], rig.med(long) / max(1, rig.med(short)) if long and short else float('nan')))
        print('  worst spread %.1f' % worst)
        d = [r['dec'] for r in a if isinstance(r.get('dec'), dict)]
        if d:
            T = {k: sum(x.get(k, 0) for x in d) for k in d[-1]}
            n = max(1, T['n'])
            if T.get('pg'): print('  pages %d: the best ordered play adds over 20%% more than the greedy one-at-a-time play on %.1f%%, over 5%% more on %.1f%%' % (T['pg'], 100.0 * T['pgDeep'] / T['pg'], 100.0 * T['pgSome'] / T['pg']))
            if T.get('bkOff'): print('  bank offered on %d turns of a page, right to take on %.1f%% (it was the only move on %.1f%%); offered at %d forks, right at %.1f%%; all offers %.1f%%' % (T['bkOff'], 100.0 * T['bkRight'] / T['bkOff'], 100.0 * T['bkOnly'] / T['bkOff'], T['fkOff'], 100.0 * T['fkRight'] / max(1, T['fkOff']), 100.0 * (T['bkRight'] + T['fkRight']) / (T['bkOff'] + T['fkOff'])))
            print('  turns %d: second within 30%% of the best %.1f%%, or better two turns on %.1f%%, either %.1f%% | one option only %.1f%% | row open and at most one reagent keeps it %.1f%% of %d | options a turn %.2f' % (T['n'], 100.0 * T['near'] / n, 100.0 * T['later'] / n, 100.0 * (T['near'] + T['later']) / n, 100.0 * T['forced'] / n, 100.0 * T['one'] / max(1, T['open']), T['open'], T['opts'] / n))
        for k in ('heavy', 'atoms', 'banks', 'redraws', 'forks', 'idle', 'wasted', 'left', 'steps'):
            v = [r[k] for r in a if k in r]
            if v: print('  %s: mean %.2f, median %s, 90th %s, most %s' % (k, sum(v) / len(v), rig.med(v), rig.q(v, 0.9), max(v)))
        kinds = {}
        for r in a: kinds.setdefault(r['kind'], []).append(r['total'] / max(1, r.get('par', 1)))
        print('  total over Par by kind:', {k: (len(v), round(rig.med(v), 2)) for k, v in sorted(kinds.items())})

if __name__ == '__main__' and sys.argv[1] != 'break':
    report(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4:] or rig.PLAYERS)

# python tools_round.py break <file>: the paired test posted by simBreak (docs/tools_sim.js). A build counts for the
# player that may break when its median over the same seeds is higher than the keeper's.
def breaks(ns):
    import json, io
    b = []
    for n in ns:
        d = json.load(io.open(rig.F + 'f%05d.jpg' % n, encoding='utf8')); b += d['builds']
    up = sum(1 for q in b if q['a'] > q['b']); up5 = sum(1 for q in b if q['a'] > 1.05 * q['b']); dn = sum(1 for q in b if q['a'] < q['b']); dn5 = sum(1 for q in b if q['a'] < q['b'] / 1.05)
    plays = d['n'] * len(b); w = sum(q['wins'] for q in b); t = sum(q['ties'] for q in b)
    print('%s against %s, %d builds, %d plays each' % (d['a'], d['b'], len(b), d['n']))
    print('  builds where %s has the higher median: %.1f%% (by more than 5%%: %.1f%%); lower: %.1f%% (by more than 5%%: %.1f%%); equal: %.1f%%' % (d['a'], 100.0 * up / len(b), 100.0 * up5 / len(b), 100.0 * dn / len(b), 100.0 * dn5 / len(b), 100.0 * (len(b) - up - dn) / len(b)))
    print('  single plays won %.1f%%, tied %.1f%%' % (100.0 * w / plays, 100.0 * t / plays))
    r = sorted(q['a'] / max(1, q['b']) for q in b); print('  median of the ratio of medians %.3f, 10th %.2f, 90th %.2f' % (r[len(r) // 2], r[len(r) // 10], r[len(r) * 9 // 10]))
    for rd in range(1, 10):
        v = [q for q in b if q['round'] == rd]
        if v: print('  round %d: %d builds, higher in %.0f%%' % (rd, len(v), 100.0 * sum(1 for q in v if q['a'] > q['b']) / len(v)))
    for f in sorted(set(q.get('from', '') for q in b)):
        v = [q for q in b if q.get('from', '') == f]
        print('  builds from %s: %d, higher in %.0f%%, lower in %.0f%%, median ratio %.3f' % (f, len(v), 100.0 * sum(1 for q in v if q['a'] > q['b']) / len(v), 100.0 * sum(1 for q in v if q['a'] < q['b']) / len(v), sorted(q['a'] / max(1, q['b']) for q in v)[len(v) // 2]))

if __name__ == '__main__' and sys.argv[1] == 'break': breaks([int(a) for a in sys.argv[2:]])
