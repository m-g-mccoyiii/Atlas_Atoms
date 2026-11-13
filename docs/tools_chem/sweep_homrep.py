"""Read the homunculus runs (sweep_run.py hom1 / hom23): by set, the clear rate of each round, the win rate of nine rounds as the
product of the nine (every round was played, and a round carries nothing to the next but gold), how often the creature's food
was made, how often it was lit and tapped, and the yield against the same deals with none."""
import json
import math
import os
import sys

import sweep_core as SC


def load(exp):
    by = {}
    for line in open(os.path.join(SC.SWEEP_DIR, exp, 'rows.jsonl'), encoding='utf-8'):
        r = json.loads(line) if line.strip() else None
        if not r or 'error' in r:
            continue
        d = by.setdefault(r['tag'], {'n': 0, 'ok': [0] * 12, 'met': [0] * 12, 'alive': [0] * 12, 'mod': {}, 'logtot': [0.0] * 12, 'dec': [0, 0],
                                     'kinds': {}, 'used': {}, 'dealt': {}, 'won': 0})
        d['n'] += r['n']
        d['won'] += r['won']
        for i, v in enumerate(r['ok']):
            d['ok'][i] += v
            d['met'][i] += r['met'][i]
            d['alive'][i] += r['alive'][i]
            d['logtot'][i] += r['logtot'][i] * r['n']
        for nm, m in (r.get('mod') or {}).items():
            e = d['mod'].setdefault(nm, {})
            for k, v in m.items():
                e[k] = e.get(k, 0) + v
        d['dec'][0] += r['dec'][0]
        d['dec'][1] += r['dec'][1]
        for key in ('kinds', 'used', 'dealt'):
            for k, v in r[key].items():
                d[key][k] = d[key].get(k, 0) + v
    return by


def win(d, k=9):
    p = 1.0
    for i in range(k):
        p *= d['ok'][i] / max(1, d['alive'][i])
    return 100.0 * p


if __name__ == '__main__':
    exp = sys.argv[1] if len(sys.argv) > 1 else 'hom1'
    by = load(exp)
    base = None
    for t in by:
        if t.startswith('none|'):
            base = by[t]
    print('%-34s %5s %6s %7s %6s  %s' % ('set', 'runs', 'win9%', 'yieldx', 'line%', 'food/lit/tap % of pages; tapped % of rounds; uses share'))
    for t, d in sorted(by.items(), key=lambda kv: -win(kv[1])):
        n = d['n']
        yx = math.exp(sum((d['logtot'][i] - base['logtot'][i] * n / base['n']) for i in range(9)) / (9.0 * n)) if base else 0
        ms = '; '.join('%s food %d lit %d tap %d, rounds %d' % (nm, 100 * m['food'] / max(1, m['pages']), 100 * m['lit'] / max(1, m['pages']),
                                                                  100 * m['taps'] / max(1, m['pages']), 100 * m.get('rtap', 0) / max(1, m['rounds']))
                       for nm, m in d['mod'].items())
        us = ' '.join('%s %d' % (k[:4], 100 * v / max(1, d['dealt'].get(k, 1))) for k, v in sorted(d['used'].items()) if k != 'finish')
        print('%-34s %5d %6.2f %7.2f %6.1f  %s | %s | clear %s' % (t.split('|')[0], n, win(d), yx, 100.0 * d['dec'][0] / max(1, d['dec'][1]), ms, us,
                                                             ' '.join('%2.0f' % (100.0 * d['ok'][i] / max(1, d['alive'][i])) for i in range(9))))
