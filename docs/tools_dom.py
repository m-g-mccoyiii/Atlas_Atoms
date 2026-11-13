# Dominance by real play (RIG.md, eleventh measure): runs .claude/headless/jobs/dom.js for rounds 1 to 9 side by side and prints one row.
#   python docs/tools_dom.py run  NAME POL N [RULE-JSON] [extra k=v ...]   POL greedy|look ; one headless job per round number
#   python docs/tools_dom.py show NAME [NAME ...]                           the table rows from the saved results
# Results: .claude/headless/out/dom_<NAME>_r<round>.json
import json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); HL = os.path.join(HERE, '..', '.claude', 'headless')
NAMES = {'pcc': 'oxidize', 'allyl': 'grow', 'bh3': 'hydroborate', 'nabh4': 'reduce'}
ORDER = ['oxidize', 'hydrate', 'grow', 'dehydrate', 'thiolene', 'ritter']


def run(name, pol, n, rule, extra, rounds=range(1, 10), tmo=5400):
    ps = []
    for r in rounds:
        cmd = ['bash', './hl.sh', 'dom.js', 'dom_%s_r%d' % (name, r), str(tmo), '', 'rounds=%d' % r, 'n=%s' % n, 'pol=%s' % pol] + (['rule64=' + __import__('base64').b64encode(rule.encode()).decode()] if rule else []) + list(extra)
        ps.append(subprocess.Popen(cmd, cwd=HL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL))
    for p in ps:
        p.wait()


def load(name):
    rs = {}
    for r in range(1, 10):
        f = os.path.join(HL, 'out', 'dom_%s_r%d.json' % (name, r))
        if not os.path.exists(f):
            continue
        d = json.load(open(f))
        if d.get('ok'):
            rs[r] = d['result']['rounds'][str(r)]
    return rs


def agg(rs, rounds=None):
    tot = {}; hands = kinds = chains = steps = 0; ml = []; err = 0
    for r, R in rs.items():
        if rounds and r not in rounds:
            continue
        for k, o in R['reagent'].items():
            t = tot.setdefault(NAMES.get(k, k), dict(held=0, inBest=0, inEvery=0, loss=0.0, own=0, set=0, uses=0))
            t['held'] += o['held']; t['inBest'] += o['inBest']; t['inEvery'] += o['inEvery']; t['loss'] += o['lossPct'] * o['held'] / 100.0
            t['own'] += o['own']; t['set'] += o['set']; t['uses'] += o['uses']
        hands += R['hands']; kinds += R['kinds']; chains += R['chains']; steps += R['steps']; ml.append(R['meanLog']); err += R['err']
    return tot, dict(hands=hands, kpc=kinds / max(1, chains), steps=steps / max(1, hands), meanLog=sum(ml) / max(1, len(ml)), err=err, rounds=sorted(rs))


def row(name, rounds=None, detail=False):
    rs = load(name); tot, g = agg(rs, rounds)
    names = ORDER + sorted(k for k in tot if k not in ORDER)
    cells = []
    for k in names:
        if k not in tot:
            cells.append('-'); continue
        t = tot[k]; h = max(1, t['held'])
        cells.append('%d (%d) -%d' % (round(100 * t['inBest'] / h), round(100 * t['inEvery'] / h), round(100 * t['loss'] / h)))
    print('| %s | %s | %.2f | %.2f | %.3f | rounds %s err %d |' % (name, ' | '.join(cells), g['kpc'], g['steps'], g['meanLog'], ','.join(map(str, g['rounds'])), g['err']))
    if detail:
        for k in names:
            if k in tot:
                t = tot[k]; u = max(1, t['uses'])
                print('    %-10s own places per use %.2f, reflex steps set off per use %.2f, uses %d' % (k, t['own'] / u, t['set'] / u, t['uses']))
        for r in sorted(rs):
            R = rs[r]
            print('    r%d: ' % r + ', '.join('%s %d' % (NAMES.get(k, k), o['best']) for k, o in sorted(R['reagent'].items())) + ' | kinds/chain %.2f steps %.2f heavy %.1f kinds %s' % (R['kindsPerChain'], R['stepsPerHand'], R['heavy'], json.dumps(R['lineKinds'])))
    return names


if __name__ == '__main__':
    if sys.argv[1] == 'run':
        name, pol, n = sys.argv[2], sys.argv[3], sys.argv[4]; rule = sys.argv[5] if len(sys.argv) > 5 else ''
        run(name, pol, n, rule, sys.argv[6:])
        print('| variant | ' + ' | '.join(ORDER) + ' | kinds per chain | steps a hand | mean log round yield | |'); row(name, detail=True)
    else:
        print('| variant | ' + ' | '.join(ORDER) + ' | kinds per chain | steps a hand | mean log round yield | |')
        det = '-d' in sys.argv
        for nm in sys.argv[2:]:
            if nm != '-d':
                row(nm, detail=det)
