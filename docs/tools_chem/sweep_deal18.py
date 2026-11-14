"""sweep_deal18.py: the game's own deal against the simulator's, a round at a time (RIG.md seventeenth part 4; eighteenth for rounds 7, 8).

    bash .claude/headless/hlow.sh jobs/deal17.js deal18r7 570 "" n=150 from=7 to=7
    python docs/tools_chem/sweep_deal18.py deal18r7 [deal18r8 ...]

For each round in the job's result: the simulator's tally of 20,000 deals of two (sweep_core.deal_two with the late-round rule as the
game has it), the game's tally with RULE.dealFlat off (before) and on (now): molecules dealt, the share of the one dealt most, how
many deals of 100 differ from the simulator's (half the summed difference of the two shares), and how many of the simulator's
commoner molecules (dealt 1 in 100 or more) the game never dealt.
"""
import json
import os
import random
import sys

import sweep_core as SC

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))


def sim(r, n=20000):
    rng = random.Random(1800 + r)
    seen = {}
    for _ in range(n):
        for m in deal_names(r, rng):
            seen[m] = seen.get(m, 0) + 1
    return seen


def deal_names(r, rng):
    two = SC.deal_two(r, rng, None, True, True, SC.EL_LATE)
    out = []
    for x in two:
        out.append(x if isinstance(x, str) else (x.get('smi') or x.get('src') or x[0]) if isinstance(x, dict) else x[-1] if isinstance(x[-1], str) else x[0])
    return out


def share(t):
    n = float(sum(t.values()) or 1)
    return {k: v / n for k, v in t.items()}


def line(name, t, s):
    a, b = share(t), share(s)
    keys = set(a) | set(b)
    diff = 50.0 * sum(abs(a.get(k, 0) - b.get(k, 0)) for k in keys)
    never = sum(1 for k, v in b.items() if v >= 0.01 and k not in a)
    return '%s: %d molecules; the most dealt %.1f in 100; %.0f deals in 100 differ from the simulator; %d of its commoner molecules never dealt' % (name, len(t), 100 * max(a.values()), diff, never)


if __name__ == '__main__':
    for nm in sys.argv[1:]:
        o = json.load(open(os.path.join(ROOT, '.claude', 'headless', 'out', nm + '.json'), encoding='utf-8'))
        o = o.get('result', o)
        if o.get('error') or 'on' not in o:
            print(nm, 'no result:', str(o)[:300])
            continue
        for r in sorted(o['on'], key=int):
            s = sim(int(r))
            s2 = sim(int(r), 150)
            sh = share(s)
            print('round %s (%d deals of two in the game)' % (r, o['n']))
            print('  simulator: %d molecules; the most dealt %.1f in 100; two tallies of the simulator at the game\'s size differ by %s' % (len(s), 100 * max(sh.values()), line('', s2, s).split(';')[2].strip()))
            if o.get('off'):
                print('  ' + line('game before (RULE.dealFlat off)', o['off'][r], s))
            print('  ' + line('game now', o['on'][r], s))
