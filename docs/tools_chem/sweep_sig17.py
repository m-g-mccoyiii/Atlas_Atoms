"""The seventeenth measure: stronger forms of the two weak sigils, tried in the simulator (path.js RULE.sigilStrong).

A mod of sweep_run.py: 'sig17:<id>'.  Each is ONE stronger form that still bends one rule in its own way.

  mask_hold   Sulphur's Mask, and a ring closed through oxygen holds when the page is turned (it no longer opens again)
  mask_wide   Sulphur's Mask, and an OH reaches a C=O 3 to 5 carbons away (rings of 5 to 7; sulfur is the larger atom)
  mask_both   both
  mask_twice  Sulphur's Mask, and each ring closed through oxygen counts as two steps of the chain (sulfur weighs twice what oxygen does)
  mask_wide2  mask_wide and mask_twice
  mask_r1     the first ring an OH closes on a page counts as two steps (the O-O bridge as it was);  mask_r2  the first two
  mask_t1     as mask_twice, for the first such ring of a page only;  mask_t2  for the first two
  tet_free    Tetractys, and the fourth reagent of a page spends no use (an empty bottle may go there)
  tet_x3      Tetractys, and the fourth reagent pays three times, not twice
  tet_both    both

    python sweep_sig17.py worth [exp]        each set of _sweep/<exp> (sig17) against none: worth, wins of nine, the wall
"""
import sys

import sigil2_rules as S2
import sweep_core as SC

HOLD = '[CX4:1](-[OX2H:2])-;@[SX2,NX3;D2:3]-[#6]'       # library.reopen's pattern without the ring oxygen: rings through O stay


class MaskHold(S2.SulphursMask):
    id, chem = 'mask_hold', 'oass_hold'

    def setup(self, G):
        S2.SulphursMask.setup(self, G)
        G.reopen_skip = HOLD


class MaskWide(S2.SulphursMask):
    id, chem = 'mask_wide', 'oass_wide'

    def setup(self, G):
        S2.SulphursMask.setup(self, G)
        G.self_rules['ring'] = SC.ring_rule('ring', 3, 5, per_turn=None, prio=0)


class MaskBoth(S2.SulphursMask):
    id, chem = 'mask_both', 'oass_both'

    def setup(self, G):
        S2.SulphursMask.setup(self, G)
        G.self_rules['ring'] = SC.ring_rule('ring', 3, 5, per_turn=None, prio=0)
        G.reopen_skip = HOLD


class MaskTwice(S2.SulphursMask):
    id = 'mask_twice'          # the chemistry is the plain mask's (chem 'oass'): only the count changes

    def setup(self, G):
        S2.SulphursMask.setup(self, G)
        G.p['twice'] = ('ring', 'bridge_o')


class MaskWideTwice(S2.SulphursMask):
    id, chem = 'mask_wide2', 'oass_wide'

    def setup(self, G):
        S2.SulphursMask.setup(self, G)
        G.self_rules['ring'] = SC.ring_rule('ring', 3, 5, per_turn=None, prio=0)
        G.p['twice'] = ('ring', 'bridge_o')


class MaskT1(MaskTwice):
    id = 'mask_t1'             # only the first ring of a page counts twice

    def setup(self, G):
        MaskTwice.setup(self, G)
        G.p['twice_max'] = 1


class MaskT2(MaskTwice):
    id = 'mask_t2'             # the first two rings of a page count twice

    def setup(self, G):
        MaskTwice.setup(self, G)
        G.p['twice_max'] = 2


class MaskR1(S2.SulphursMask):
    id = 'mask_r1'             # the first ring an OH closes on a page counts as two steps; the O-O bridge across the fold as it was

    def setup(self, G):
        S2.SulphursMask.setup(self, G)
        G.p['twice'] = ('ring',)
        G.p['twice_max'] = 1


class MaskR2(S2.SulphursMask):
    id = 'mask_r2'             # the first two rings an OH closes on a page each count as two steps

    def setup(self, G):
        S2.SulphursMask.setup(self, G)
        G.p['twice'] = ('ring',)
        G.p['twice_max'] = 2


class TetFree(S2.Tetractys):
    id = 'tet_free'

    def setup(self, G):
        G.p['circles'] = 4
        G.p['free_last'] = True


class TetX3(S2.Tetractys):
    id = 'tet_x3'

    def setup(self, G):
        G.p['circles'] = 4
        G.p['lastx'] = 3.0


class TetBoth(S2.Tetractys):
    id = 'tet_both'

    def setup(self, G):
        G.p['circles'] = 4
        G.p['free_last'] = True
        G.p['lastx'] = 3.0


ALL = {c.id: c for c in (MaskHold, MaskWide, MaskBoth, MaskTwice, MaskWideTwice, MaskT1, MaskT2, MaskR1, MaskR2, TetFree, TetX3, TetBoth)}


def make(name):
    return ALL[name]()


# --- the pools of the seventeenth: every set on the new deal; sets that hold a sigil given a stronger form come from _sweep/sig17s ----
STRONG = {}          # filled from path.js RULE.sigilStrong below: {sigil id: mod of this file}


def _strong():
    import re
    m = re.search(r'RULE\.sigilStrong = \{(.*?)\};', SC._JS)
    return dict(re.findall(r"(\w+): '(\w+)'", m.group(1))) if m else {}


STRONG.update(_strong())


def load17():
    import sweep_sig16 as S16
    by = S16.load('sig17')
    try:
        new = S16.load('sig17s')
    except IOError:
        new = {}
    for pl, d in by.items():
        for st in list(d):
            if any(x in STRONG for x in st.split('+')) and st in (new.get(pl) or {}):
                del d[st]
        d.update(new.get(pl) or {})
    return by


def one_run(pools, rng, owned, G, worth, pick='best', per_clear=1, pay=0, cap=3, marks=None, least=1.0):
    """One nine-round run of buying, laid together from rounds of the sets held (as sweep_sig16.one_run, way 'buy').
    pay: gold Aqua Permanens pays when taken (it then costs nothing).  pick: 'best' the strongest he can pay for, leaving any worth
    under `least`; 'aqua' the same, and he takes Aqua Permanens whenever it is shown, for its gold; 'any' at random."""
    import sweep_sig16 as S16
    import sweep_career as C
    marks = marks or S16.MS
    held, gold, spent = [], 0, 0
    out = {'won': False, 'cleared': 0, 'at': {}, 'earn': {}, 'aqua': 0}
    for i in range(9):
        if i > 0 and len(held) < cap:
            left = [s for s in owned if s not in held]
            shown = rng.sample(left, min(G['shown'], len(left)))
            if 'aqua_permanens' in shown and pay and pick in ('aqua', 'any'):
                held.append('aqua_permanens')
                shown.remove('aqua_permanens')
                gold += pay
                out['aqua'] = i + 1
            while shown and len(held) < cap:
                can = [s for s in shown if s != 'aqua_permanens' and S16.price_of(s, len(held), G) <= gold]
                if pick != 'any':
                    can = [s for s in can if worth.get(s, 1) >= least]
                if not can:
                    break
                s = max(can, key=lambda x: worth.get(x, 1)) if pick != 'any' else rng.choice(can)
                p = S16.price_of(s, len(held), G)
                gold -= p
                spent += p
                held.append(s)
                shown.remove(s)
        out['at'][i + 1] = len(held)
        pool = pools.get(S16.key(held)) or pools[S16.key(held[:2])]
        rd = rng.choice(pool)[i]
        ok = C.cleared(rd, marks[i])
        e = S16.gold_of(rd, gold, ok, per_clear)
        gold += e
        out['earn'][i + 1] = (len(held), e)
        if not ok:
            break
        out['cleared'] = i + 1
    out['won'] = out['cleared'] == 9
    out['held'], out['gold'], out['spent'] = tuple(held), gold, spent
    return out


def table(by, n=20000, pays=(0, 4, 6, 8), per_clear=1, owned_n=9):
    import random
    import sweep_sig16 as S16
    G = S16.GET
    for pl in ('median', 'greedy'):
        pools = {k: v for k, v in by[pl].items() if k == 'none' or S16.is_sigset(k)}
        worth = {s: S16.stats(pools[s], pools['none'])['worth'] for s in S16.SIG9}
        print(S16.PL[pl], 'worth alone:', ', '.join('%s %.2f' % (S16.NAME[s], worth[s]) for s in sorted(worth, key=lambda x: -worth[x])))
        print('| The buyer | Aqua Permanens pays | Held going into round 4, 7, 9 | Held at the end | Wins of nine, of 100 | Reach round 7, of 100 | Two runs end with the same set, of 100 pairs | Gold a round pays in rounds 4 to 9 holding 0, 1, 2, 3 | Runs that took Aqua Permanens, of 100; they win |')
        print('|---|---|---|---|---|---|---|---|---|')
        rows = [('none', 0, 9.9)] + [(pk, pay, least) for pk, least in (('best', 1.0), ('best', 1.15), ('aqua', 1.0), ('aqua', 1.15), ('any', 0)) for pay in pays if not (pk == 'best' and pay != pays[0])]
        for pk, pay, least in rows:
            rng = random.Random('t17/%s/%s/%s/%s/%d/%d' % (pl, pk, pay, least, per_clear, owned_n))
            rs = []
            for _ in range(n):
                owned = [] if pk == 'none' else (list(S16.SIG9) if owned_n >= 9 else rng.sample(S16.SIG9, owned_n))
                rs.append(one_run(pools, rng, owned, G, worth, pk, per_clear, pay, least=least))
            at = lambda r_: sum(x['at'][r_] for x in rs if r_ in x['at']) / float(max(1, sum(1 for x in rs if r_ in x['at'])))
            cnt = {}
            for x in rs:
                cnt[frozenset(x['held'])] = cnt.get(frozenset(x['held']), 0) + 1
            same = 100.0 * sum(v * (v - 1) for v in cnt.values()) / float(n * (n - 1))
            e = {}
            for x in rs:
                for r_, (h, g) in x['earn'].items():
                    if r_ >= 4:
                        a = e.setdefault(h, [0, 0])
                        a[0] += g
                        a[1] += 1
            aq = [x for x in rs if x['aqua']]
            print('| %s%s | %s | %.1f, %.1f, %.1f | %.2f | %.2f | %.1f | %.0f | %s | %.0f; %.2f |' % (
                {'none': 'buys nothing', 'best': 'the strongest he can pay for', 'aqua': 'the same, and takes Aqua Permanens when shown', 'any': 'anything, at random'}[pk],
                ', leaving any worth under 1.15' if least > 1.0 and pk != 'none' else '', pay if pk in ('aqua', 'any') else '.', at(4), at(7), at(9), sum(len(x['held']) for x in rs) / float(n),
                100.0 * sum(x['won'] for x in rs) / n, 100.0 * sum(1 for x in rs if 7 in x['at']) / n, same,
                ', '.join('%.2f' % (e[h][0] / float(e[h][1])) if h in e else '.' for h in range(4)), 100.0 * len(aq) / n, 100.0 * sum(x['won'] for x in aq) / max(1, len(aq))))


if __name__ == '__main__':
    import sweep_sig16 as S16
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'worth'
    if cmd == 'table':
        table(load17(), int(sys.argv[2]) if len(sys.argv) > 2 else 20000, per_clear=int(sys.argv[3]) if len(sys.argv) > 3 else 1, owned_n=int(sys.argv[4]) if len(sys.argv) > 4 else 9)
        sys.exit(0)
    by = load17() if (len(sys.argv) > 2 and sys.argv[2] == 'all') else S16.load(sys.argv[2] if len(sys.argv) > 2 else 'sig17')
    if cmd == 'worth':
        for pl in ('median', 'greedy'):
            d = by.get(pl) or {}
            base = d.get('none')
            if not base:
                continue
            b = S16.stats(base, None)
            print('%s: none %d runs, wins of nine %.2f, wall %s, biggest %.1f' % (S16.PL[pl], b['n'], b['win'], ', '.join('%.0f' % x for x in b['wall']), b['max']))
            rows = sorted(((S16.stats(runs, base), st, runs) for st, runs in d.items() if st != 'none'), key=lambda t: -t[0]['worth'])
            for s, st, runs in rows:
                print('  %-34s n %4d worth %.2f wins %.2f (x%.1f) yield %.2f met %.0f wall %s max %.1f steps %.2f | %s | %s' % (
                    st, s['n'], s['worth'], s['win'], 2.718 ** S16.se_win(runs), s['y'] / b['y'], s['met'], ', '.join('%.0f' % x for x in s['wall']), s['max'], s['steps'],
                    S16.moved(runs, base, 4 + 3), S16.moved(runs, base, 6)))
