# The coin sink (RULE.sink) read from the dumps of sinkJob (tools_sinkjob.js): nine-round runs of the median player,
# with the sink off and at three price tables, on the same seeds.
# Usage: python tools_sink.py <frames folder> <first file> <last file>
import sys, os, json, math
d, lo, hi = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
J = {}
for i in range(lo, hi + 1):
    p = os.path.join(d, 'f%05d.jpg' % i)
    if not os.path.exists(p): continue
    for tag, o in json.load(open(p, encoding='utf-8')).items():
        if not tag.startswith('n9'): continue
        cfg = tag.split()[1]
        for sd, rows in o['rows'].items():
            if int(sd) <= 200: J.setdefault(cfg, {})[int(sd)] = rows
# a row: round, total, number, pass, coins after, uses bought, live, dry pages, pages, pair redraws
off = J['off']
for cfg in ['off', '123', '112', '234']:
    R = J.get(cfg, {}); n = len(R)
    beaten = sum(sum(1 for q in rows if q[3]) for rows in R.values()) / max(1, n)
    print('\n%s: %d runs, rounds beaten %.2f' % (cfg, n, beaten))
    for r in range(9):
        qs = [(sd, rows[r]) for sd, rows in R.items() if len(rows) > r]
        if not qs: continue
        m = len(qs); lr = [math.log(max(1, q[1]) / max(1, off[sd][r][1])) for sd, q in qs if sd in off and len(off[sd]) > r]
        print(' round %d  n %3d  pass %3d%%  coins after %5.1f  bought %.2f a round, in %2d%% of rounds  total over off %.3f (%d)  redraws %.2f' % (r + 1, m, round(100 * sum(q[3] for _, q in qs) / m), sum(q[4] for _, q in qs) / m, sum(q[5] for _, q in qs) / m, round(100 * sum(1 for _, q in qs if q[5]) / m), math.exp(sum(lr) / max(1, len(lr))), len(lr), sum(q[9] for _, q in qs) / m))
    end = [rows[-1][4] for rows in R.values()]; print(' coins at the end of a run: mean %.1f' % (sum(end) / max(1, len(end))))
