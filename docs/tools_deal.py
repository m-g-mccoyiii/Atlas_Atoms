# Reads headless measures (.claude/headless/out/<tag>_<player>_<k>.json, from hlmany.sh) and prints the pass table
# and the turn measures. Usage: python tools_deal.py <tag> [player ...]
import sys, os, io, json, glob
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '.claude', 'headless', 'out')
PLAYERS = ['novice', 'greedy', 'median', 'planner']

def rows(tag, pl):
    out = []; seen = set()
    for p in sorted(glob.glob(os.path.join(OUT, '%s_%s_*.json' % (tag, pl)))):
        if p.endswith('.hb.json'): continue
        d = json.load(io.open(p, encoding='utf8'))
        if not d.get('ok'): continue
        for r in d['result']['rows']:
            if 'error' in r: continue
            k = (r['seed'], r['round'])
            if k not in seen: seen.add(k); out.append(r)
    return out

def med(v):
    v = sorted(v); return v[len(v) // 2] if v else float('nan')

def report(tag, players):
    for pl in players:
        a = rows(tag, pl)
        if not a: continue
        seeds = sorted(set(r['seed'] for r in a)); spanr = max(r['round'] for r in a)
        print('%s %s: %d runs' % (tag, pl, len(seeds)))
        line = []
        for rd in range(1, spanr + 1):
            b = [r for r in a if r['round'] == rd and r.get('live', 1)]
            if b: line.append('%d (%d)' % (round(100.0 * sum(r['pass'] for r in b) / len(b)), len(b)))
        print('  pass by round: ' + ', '.join(line))
        win = sum(1 for s in seeds if all(r['pass'] for r in a if r['seed'] == s)) / float(len(seeds))
        print('  wins all rounds %.1f%%  tries %.1f' % (100 * win, 1.0 / win if win else float('inf')))
        m = []
        for rd in range(1, spanr + 1):
            v = [r['total'] / float(r['par'] * r.get('mult', 1)) for r in a if r['round'] == rd and r.get('par')]
            m.append('%.2f' % med(v) if v else '-')
        print('  median total over number: ' + ', '.join(m))
        d = [r['dec'] for r in a if isinstance(r.get('dec'), dict)]
        if d:
            T = {k: sum(x.get(k, 0) for x in d) for k in d[-1]}; n = max(1, T['n'])
            print('  turns %d: second within 30%% %.1f%%, or better two turns on %.1f%%, either %.1f%% | one option only %.1f%% | options a turn %.2f' % (T['n'], 100.0 * T['near'] / n, 100.0 * T['later'] / n, 100.0 * (T['near'] + T['later']) / n, 100.0 * T['forced'] / n, T['opts'] / float(n)))
            if T.get('pg'): print('  pages %d: best ordered play over 20%% more than the obvious one on %.1f%%, over 5%% on %.1f%%' % (T['pg'], 100.0 * T['pgDeep'] / T['pg'], 100.0 * T['pgSome'] / T['pg']))

if __name__ == '__main__':
    report(sys.argv[1], sys.argv[2:] or PLAYERS)
