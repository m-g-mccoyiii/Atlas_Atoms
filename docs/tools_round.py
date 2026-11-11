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
            T = {k: sum(x[k] for x in d) for k in d[0]}
            n = max(1, T['n'])
            print('  turns %d: second within 30%% of the best %.1f%%, or better two turns on %.1f%%, either %.1f%% | one option only %.1f%% | row open and at most one reagent keeps it %.1f%% of %d | options a turn %.2f' % (T['n'], 100.0 * T['near'] / n, 100.0 * T['later'] / n, 100.0 * (T['near'] + T['later']) / n, 100.0 * T['forced'] / n, 100.0 * T['one'] / max(1, T['open']), T['open'], T['opts'] / n))
        for k in ('heavy', 'atoms', 'banks', 'redraws', 'forks', 'idle', 'left', 'steps'):
            v = [r[k] for r in a if k in r]
            if v: print('  %s: mean %.2f, median %s, 90th %s, most %s' % (k, sum(v) / len(v), rig.med(v), rig.q(v, 0.9), max(v)))
        kinds = {}
        for r in a: kinds.setdefault(r['kind'], []).append(r['total'] / max(1, r.get('par', 1)))
        print('  total over Par by kind:', {k: (len(v), round(rig.med(v), 2)) for k, v in sorted(kinds.items())})

if __name__ == '__main__':
    report(sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4:] or rig.PLAYERS)
