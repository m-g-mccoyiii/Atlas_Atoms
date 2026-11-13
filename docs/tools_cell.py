# One cell of runs on the rig, split over K headless jobs: python docs/tools_cell.py NAME PLAYER N K 'OPTS-JSON' [from]
# prints clear rate by round (of rounds reached with all:true, of all runs) and runs won.
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); HL = os.path.join(HERE, '..', '.claude', 'headless')
sys.argv = [a for a in sys.argv if a != '-s'] + (['-s'] if '-s' in sys.argv else []); name, player, n, k, opts = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]; frm = int(sys.argv[6]) if len(sys.argv) > 6 and sys.argv[6] != '-s' else 1001
per = n // k; ps = []
for j in range(k):
    ps.append(subprocess.Popen(['bash', './hl.sh', 'cell.js', '%s_%d' % (name, j), '7000', '', 'player=' + player, 'from=%d' % (frm + j * per), 'n=%d' % per, 'opts64=' + __import__('base64').b64encode(opts.encode()).decode()], cwd=HL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL))
for p in ps: p.wait()
tot = dict(n=0, wins=0, clear=[], seen=[], specs={}, ms=0, steps=0, pages=0)
for j in range(k):
    try: d = json.load(open(os.path.join(HL, 'out', '%s_%d.json' % (name, j))))
    except Exception: continue
    if not d.get('ok'): print('job', j, 'failed', str(d)[:200]); continue
    r = d['result']; tot['n'] += r['n']; tot['wins'] += r['wins']; tot['ms'] += r['msPerRun'] * r['n']; tot['steps'] += r['steps']; tot['pages'] += r['pages']
    for i, c in enumerate(r['clear']):
        while len(tot['clear']) <= i: tot['clear'].append(0); tot['seen'].append(0)
        tot['clear'][i] += c or 0; tot['seen'][i] += r['seen'][i] or 0
    for s, v in r['specs'].items():
        t = tot['specs'].setdefault(s, [0, 0]); t[0] += v[0]; t[1] += v[1]
N = max(1, tot['n'])
print('%s %s runs %d | clear by round %s | wins %d (%.1f%%) | %d ms a run | pages a run %.1f' % (name, player, tot['n'], ', '.join('%d' % round(100.0 * c / max(1, s)) for c, s in zip(tot['clear'], tot['seen'])), tot['wins'], 100.0 * tot['wins'] / N, tot['ms'] / N, tot['pages'] / N))
if '-s' in sys.argv:
    for s, v in sorted(tot['specs'].items(), key=lambda kv: -kv[1][0])[:40]: print('   %-28s offered %4d cleared %3d%%' % (s, v[0], round(100.0 * v[1] / max(1, v[0]))))
json.dump(tot, open(os.path.join(HL, 'out', 'cell_%s.json' % name), 'w'))
