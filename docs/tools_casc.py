# Cascades in the rig's logs. Usage: python tools_casc.py <tag> <first file> <last file>
# Prints, for each player in the measure, how many steps of cascade a page had (every page of every round of every
# run, whether or not the run was still alive), the mean by round, and the heavy atoms of the molecule at the start
# and the end of a round.
import sys, tools_rig as rig
def table(rows, label=''):
    out = []
    players = [p for p in rig.PLAYERS if any(r['player'] == p for r in rows)] + sorted(set(r['player'] for r in rows) - set(rig.PLAYERS))
    for pl in players:
        rs = [r for r in rows if r['player'] == pl]
        cs = [int(c) for r in rs for c in (r.get('casc') or '').split()]
        if not cs: continue
        n = float(len(cs)); ge = lambda k: 100.0 * sum(1 for c in cs if c >= k) / n
        hist = ' '.join('%d:%.1f%%' % (k, 100.0 * cs.count(k) / n) for k in range(0, max(cs) + 1) if cs.count(k))
        out.append('%s%s: runs %d pages %d | 1+ %.1f%% | 3+ %.1f%% | 6+ %.1f%% | 10+ %.2f%% | longest %d | mean %.2f' % (label, pl, len(set(r['seed'] for r in rs)), len(cs), ge(1), ge(3), ge(6), ge(10), max(cs), sum(cs) / n))
        out.append('   ' + hist)
        byr = []
        for k in range(1, 10):
            q = [r for r in rs if r['round'] == k]
            c = [int(x) for r in q for x in (r.get('casc') or '').split()]
            if c: byr.append('%d: %.1f steps, %s to %s atoms' % (k, sum(c) / float(len(c)), rig.med([r.get('heavy0', 0) for r in q]), rig.med([r.get('heavy', 0) for r in q])))
        out.append('   by round ' + ' | '.join(byr))
    return '\n'.join(out)
if __name__ == '__main__':
    tag, lo, hi = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    print(table(rig.load(tag, lo, hi)))
