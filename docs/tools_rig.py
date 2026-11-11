# Analysis of the measuring rig's logs. Usage: python rig.py <tag> <first file> <last file> [--md]
# Reads the JSON files the rig posted to the frame server (saved as fNNNNNN.jpg) and prints the tables.
import json, io, os, sys, math, glob
F = 'C:/Users/mgmcc/AppData/Local/Temp/claude/c2e091f86aaa20cc/4b5d48b3-c4d4-47b4-ad30-ef7d19555645/scratchpad/frames/'
PLAYERS = ['novice', 'greedy', 'median', 'planner']
TARGET = {'median': [98, 95, 85, 92, 88, 70, 78, 70, 50], 'novice': [90, 80, 55, 55, 40, 20, 15, 10, 5], 'planner': [99, 99, 97, 98, 95, 90, 90, 85, 70]}
MARGIN = [3, 2.5, 1.6, 2, 1.8, 1.4, 1.5, 1.3, 1.2]
BEAT = {'novice': 3, 'median': 6, 'planner': 9}

def load(tag, lo, hi):
    rows = []; seen = set()
    for n in range(lo, hi + 1):
        p = F + 'f%05d.jpg' % n
        if not os.path.exists(p): continue
        try: d = json.load(io.open(p, encoding='utf8'))
        except Exception: continue
        if d.get('tag') != tag: continue
        for r in d['rows']:
            if 'error' in r: print('ERROR row', r); continue
            k = (r['player'], r['seed'], r['round'])
            if k in seen: continue
            seen.add(k); rows.append(r)
    return rows

def runs_of(rows):
    by = {}
    for r in rows: by.setdefault((r['player'], r['seed']), {})[r['round']] = r
    return by

def q(a, p):
    a = sorted(a); return a[min(len(a) - 1, int(len(a) * p))] if a else float('nan')
def med(a): return q(a, 0.5)

def walk(by, player, number=None, seeds=None):
    """Plays each run to its first miss. number(row) overrides the logged number. Returns per-round lists of rows reached."""
    reached = {r: [] for r in range(1, 10)}; beaten = []
    for (pl, sd), rs in by.items():
        if pl != player or (seeds and sd not in seeds): continue
        b = 0
        for r in range(1, 10):
            if r not in rs: break
            row = rs[r]; num = number(row) if number else row['number']
            ok = row['total'] >= num
            reached[r].append((row, num, ok))
            if not ok: break
            b += 1
        beaten.append(b)
    return reached, beaten

def stats(by, player, number=None, seeds=None):
    reached, beaten = walk(by, player, number, seeds)
    out = {'n': len(beaten), 'pass': [], 'reach': [], 'margin': [], 'last': None}
    over5 = 0; passed = 0; lastdec = 0; lastn = 0
    for r in range(1, 10):
        a = reached[r]; out['reach'].append(len(a))
        out['pass'].append(100.0 * sum(1 for x in a if x[2]) / len(a) if a else float('nan'))
        out['margin'].append(med([x[0]['total'] / max(1, x[1]) for x in a]))
        for row, num, ok in a:
            if ok:
                passed += 1
                if row['total'] > 5 * num: over5 += 1
                if r >= 4:
                    lastn += 1
                    pg = row.get('pages') or []
                    if len(pg) < 2 or pg[-2] < num: lastdec += 1
    out['over5'] = 100.0 * over5 / max(1, passed); out['passed'] = passed
    out['lastdec'] = 100.0 * lastdec / max(1, lastn)
    out['beaten'] = [q(beaten, p) for p in (0.1, 0.25, 0.5, 0.75, 0.9)]
    out['win'] = 100.0 * sum(1 for b in beaten if b >= 9) / max(1, len(beaten))
    out['mean'] = sum(beaten) / max(1, len(beaten))
    return out

def mol_spread(by, player, number=None, minn=8, alive=True):
    """For each round, the median margin of each molecule and the ratio of the easiest to the hardest."""
    reached, _ = walk(by, player, number)
    res = []
    for r in range(1, 10):
        if alive: a = reached[r]
        else: a = [(rs[r], (number(rs[r]) if number else rs[r]['number']), None) for (pl, sd), rs in by.items() if pl == player and r in rs]
        m = {}
        for row, num, ok in a: m.setdefault(row['mol'], []).append(row['total'] / max(1, num))
        mm = {k: med(v) for k, v in m.items() if len(v) >= minn}
        if len(mm) >= 2:
            hi = max(mm, key=mm.get); lo = min(mm, key=mm.get)
            res.append((r, len(mm), mm[hi] / mm[lo], hi, mm[hi], lo, mm[lo]))
        else: res.append((r, len(mm), float('nan'), '', 0, '', 0))
    return res

def table(by, number=None, title=''):
    L = []
    S = {p: stats(by, p, number) for p in PLAYERS if any(k[0] == p for k in by)}
    L.append('| Round | ' + ' | '.join('%s | target' % p if p in TARGET else p for p in S) + ' |')
    L.append('|---|' + '|'.join('---|---' if p in TARGET else '---' for p in S) + '|')
    for r in range(9):
        cells = []
        for p in S:
            cells.append('%.0f%% (%d)' % (S[p]['pass'][r], S[p]['reach'][r]) if S[p]['reach'][r] else 'none reached')
            if p in TARGET: cells.append('%d%%' % TARGET[p][r])
        L.append('| %d%s | ' % (r + 1, ', assay' if r % 3 == 2 else '') + ' | '.join(cells) + ' |')
    L.append('')
    L.append('| Player | Runs | Rounds beaten at 10, 25, 50, 75, 90 percent | Mean | Target median | Wins | Passed by more than 5 times | Last page decided, round 4 on |')
    L.append('|---|---|---|---|---|---|---|---|')
    for p in S:
        s = S[p]; L.append('| %s | %d | %s | %.1f | %s | %.1f%% | %.1f%% of %d | %.0f%% |' % (p, s['n'], ', '.join(str(x) for x in s['beaten']), s['mean'], BEAT.get(p, ''), s['win'], s['over5'], s['passed'], s['lastdec']))
    L.append('')
    L.append('| Round | ' + ' | '.join(S) + ' | target, median player |')
    L.append('|---|' + '---|' * (len(S) + 1))
    for r in range(9): L.append('| %d | ' % (r + 1) + ' | '.join('%.2f' % S[p]['margin'][r] if S[p]['reach'][r] else '' for p in S) + ' | %s |' % MARGIN[r])
    return '\n'.join(L), S

if __name__ == '__main__':
    tag, lo, hi = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    rows = load(tag, lo, hi); by = runs_of(rows)
    print('rows', len(rows), 'runs', {p: sum(1 for k in by if k[0] == p) for p in PLAYERS})
    t, S = table(by); print(t)
    print('\nmedian player, molecules in the same round (alive runs, at least 8 plays):')
    for x in mol_spread(by, 'median'): print('  round %d: %d molecules, easiest over hardest %.1f  (%s %.2f, %s %.2f)' % x)
    print('')
    print('median player, molecules in the same round (every run, missed or not, at least 8 plays):')
    for x in mol_spread(by, 'median', alive=False): print('  round %d: %d molecules, easiest over hardest %.1f  (%s %.2f, %s %.2f)' % x)
    for p in PLAYERS:
        a = [r for r in rows if r['player'] == p]; c = [r for r in a if r.get('cut')]
        if a: print('%s: %d rounds, cut short %d (%.1f%%), cut and missed %d, cut and under 5 times the number %d, largest molecule %d atoms' % (p, len(a), len(c), 100.0 * len(c) / len(a), sum(1 for r in c if not r['pass']), sum(1 for r in c if r['total'] < 5 * r['number']), max(r.get('atoms', 0) for r in a)))
    kinds = {}
    for r in rows:
        if r['player'] == 'median': kinds.setdefault(r['kind'], []).append(r['total'] / max(1, r['number']))
    print('median player margin by kind:', {k: (len(v), round(med(v), 2)) for k, v in kinds.items()})
