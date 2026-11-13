"""sigil2_last.py: the last sigil, our own yellow sign: gold given up to break rules (HARNESS AM3, an idea marked "perhaps").

Four versions for the sweep, after the three concepts in docs/NOTES_WRITING.md ("The last sigil") and the lead's list.  Each is a
sweep_core.Mod used as 'sigil:last_<version>:<policy>'.  Gold is what a round pays in the game (path.js runEarn): one for each of
the 2, 4 and 8 times marks its yield reaches, and one for every three gold held (two at most), only when the yield passes the
number to beat.  Nothing else spends gold in the simulator (no shop), so "gold left" is what would still buy instruments.

  crown    The Open Crown.  Before a page: pay to break one rule for that page (a fourth circle, or the limits a turn start
           again after every reagent: the better of the two).  The price is 1 and doubles with each use in the run.  A round
           that ends at the top mark gives the gold of that round back; one that does not raises the next spec by a tenth for
           each gold spent.
  tatters  The Tatters.  At the start of a round: pay to tear one stroke; each tear breaks one rule for the rest of the run
           (in this order: the limits restart after every reagent; a fourth circle; the whole rack in the hand).  Prices 2, 3, 4.
           Every tear raises every later spec by a tenth.  (The seven-stroke ending of the concept is not simulated.)
  pledge   The lead's (b): a fourth circle from round one, against a debt.  Half of all gold earned (rounded up) goes to the
           debt, and the run is not won until the debt is cleared.
  refire   The lead's (c), first part: after a page, pay to fire the page's line again, no uses spent.  Price 2, one more each use.

Policies (how the simulated player uses it; the best play is found by comparing them with 'never', which is the run with no sigil):
  need     only when it raises spec progress on a page where the spec is not yet met
  always   whenever it can be paid for and makes anything more (progress or yield)
  early / late (tatters): tear as soon as it can be paid for / only from round 4
"""
import math
import random

import sweep_core as SC

OV = ('circles', 'limits_reset', 'hand')


class Last(SC.Mod):
    chem = ''

    def __init__(self, policy):
        self.policy = policy
        self.name = 'sigil:last_%s:%s' % (self.vid, policy)
        self.saved = None

    def setup(self, G):
        self.base = {k: G.p[k] for k in OV}

    def restore(self, G):
        for k in OV:
            G.p[k] = self.base[k]

    def run_start(self, G, run):
        self.restore(G)
        G.extra_key = ''

    def pay(self, G, R, price):
        run = G.run
        if G.real:
            run['at'].append((run.get('round', 0), run['gold'], price))
            run['uses'] += 1
        run['gold'] -= price
        run['spent'] += price
        R.x['spent'] = R.x.get('spent', 0) + price


class Crown(Last):
    vid = 'crown'

    def before_page(self, G, R, rng, player, hand):
        self.restore(G)
        run = G.run
        price = 2 ** run.get('crown_n', 0)
        if not G.real or run['gold'] < price:
            return None
        look = SC.PLAYERS[player]['look']
        look = min(look or 60, 60)
        r0 = random.Random(rng.random())
        _l, R0, pg0 = G.choose(R, hand, look, r0)
        if R0 is None:
            return None
        v0 = (G.prog(R, R.rec + [G.page_rec(pg0)]) if R.spec else 0.0, SC.made(R0))
        full = float(len(R.spec)) if R.spec else 0.0
        if self.policy == 'need' and v0[0] >= full:
            return None
        best = None
        for k, val in (('circles', 4), ('limits_reset', True)):
            G.p[k] = val
            l, R1, pg1 = G.choose(R, hand, look, random.Random(r0.random()))
            G.p[k] = self.base[k]
            if R1 is None:
                continue
            v = (G.prog(R, R.rec + [G.page_rec(pg1)]) if R.spec else 0.0, SC.made(R1))
            if best is None or v > best[0]:
                best = (v, l, k, val)
        if best is None:
            return None
        ok = best[0][0] > v0[0] if self.policy == 'need' else best[0] > v0
        if not ok:
            return None
        G.p[best[2]] = best[3]               # stays broken while the page is fired; put back before the next page
        run['crown_n'] = run.get('crown_n', 0) + 1
        self.pay(G, R, price)
        return best[1]

    def after_page(self, G, R, rng, player):
        self.restore(G)

    def round_end(self, G, R, run, earned):
        self.restore(G)
        run['spec_up'] = 1.0
        sp = R.x.get('spent', 0)
        if sp:
            if R.x['total'] >= SC.nice(SC.quota_of(R.rnd, R.brief) * 8):
                earned += sp
                run['spent'] -= sp
            else:
                run['spec_up'] = 1.0 + 0.1 * sp
        return earned


class Tatters(Last):
    vid = 'tatters'
    TEARS = (('limits_reset', True), ('circles', 4), ('hand', 99))

    def run_start(self, G, run):
        Last.run_start(self, G, run)
        run['tears'] = 0

    def round_start(self, G, R, rng):
        run = G.run
        if not G.real:
            return
        k = run['tears']
        if k >= len(self.TEARS) or run['gold'] < 2 + k:
            return
        if self.policy == 'late' and R.rnd < 4:
            return
        if R.rnd >= run['n_rounds']:
            return                           # nothing left to gain from a standing rule
        self.pay(G, R, 2 + k)
        G.p[self.TEARS[k][0]] = self.TEARS[k][1]
        run['tears'] = k + 1
        run['spec_up'] = 1.1 ** (k + 1)
        G.extra_key = 'tear%d' % (k + 1)


class Pledge(Last):
    vid = 'pledge'

    def run_start(self, G, run):
        Last.run_start(self, G, run)
        G.p['circles'] = 4
        G.extra_key = 'pledge'
        run['debt'] = int(self.policy)
        run['uses'] = 1

    def round_end(self, G, R, run, earned):
        pay = min(run['debt'], int(math.ceil(earned / 2.0)))
        run['debt'] -= pay
        run['spent'] += pay
        return earned - pay

    def run_won(self, G, run, won):
        run['cleared_debt'] = run['debt'] <= 0
        return won and run['debt'] <= 0


class Refire(Last):
    vid = 'refire'

    def after_page(self, G, R, rng, player):
        run = G.run
        price = 2 + run.get('refire_n', 0)
        if not G.real or run['gold'] < price or R.over:
            return
        line = tuple(r for r in (R.x.get('lines') or ((),))[-1] if r != 'finish')
        if not line:
            return
        R0 = R.copy()
        R0.left = None
        R2, pg = G.run_line(R0, line)
        if not any(c[1] for c in pg['circ']):
            return
        rec = R.rec[-1]
        pg2 = {'circ': list(rec['circ']), 'chain': list(rec['chain']) + pg['chain'], 'off': dict(rec['off']), 'smi': R2.smi}
        for k, v in pg['off'].items():
            pg2['off'][k] = pg2['off'].get(k, 0) + v
        new = R.rec[:-1] + [G.page_rec(pg2)]
        v0 = G.value(R)
        v2 = (G.prog(R, new) if R.spec else 0.0, SC.made(R2))
        full = float(len(R.spec)) if R.spec else 0.0
        ok = (v0[0] < full and v2[0] > v0[0]) if self.policy == 'need' else v2 > v0
        if not ok:
            return
        for k in SC.Round.__slots__:
            if k not in ('left', 'rec', 'x'):
                setattr(R, k, getattr(R2, k))
        R.rec = new
        run['refire_n'] = run.get('refire_n', 0) + 1
        self.pay(G, R, price)


class Mask(Last):
    """The Mask (docs/NOTES_WRITING.md, concept 2).  At the start of a round: pay to have one group on the molecule read as
    another until the round ends (a C=O as an OH, an OH as a C=O, a Cl as an NH2, an OH as an SH or an NH2, an NH2 or SH as an
    OH).  Simulated as the group being the other group for the round: reflexes, the spec and the reagents all read it so.
    When the round ends: pay the same gold again to keep what the round made, or keep the gold and the round's yield is
    halved (the yield "made through it" is taken as the whole round's, which is the dearest reading of the concept).
    Price 2, one more each use in a run.
    Policies:  need   masks only when the first page then gets further on the spec than it does unmasked; pays again when it can
               always masks whenever the first page is better in any way (spec progress, then yield); pays again when it can
               half   as need, but never pays the second time (takes the halved yield)"""
    vid = 'mask'
    OPTS = (('[CX3:1]=[OX1:2]', '[C:1]-[O:2]'), ('[CX4;!H0:1]-[OX2H:2]', '[C:1]=[O:2]'), ('[Cl:1]-[CX4:2]', '[N:1]-[C:2]'),
            ('[OX2H:1]-[CX4:2]', '[S:1]-[C:2]'), ('[OX2H:1]-[CX4:2]', '[N:1]-[C:2]'), ('[NX3H2:1]-[CX4:2]', '[O:1]-[C:2]'),
            ('[SX2H:1]-[CX4:2]', '[O:1]-[C:2]'))

    def round_start(self, G, R, rng):
        run = G.run
        price = 2 + run.get('mask_n', 0)
        R.x['mask'] = 0
        if not G.real or run['gold'] < price or not R.spec:
            return
        import sweep_perks as SP
        rack = run.get('rack') or SC.START_SIX
        r0 = random.Random(rng.random())
        hand = SC.deal_hand(rack, R, r0, G.p['hand'])
        full = float(len(R.spec))

        def first_page(smi):
            R1 = R.copy()
            R1.smi = smi
            R1.f0 = G.feat(smi)
            R1.seen = frozenset([smi])
            _l, R2, pg = G.choose(R1, hand, 30, random.Random(7))
            if R2 is None:
                return (0.0, 0)
            return (G.prog(R1, [G.page_rec(pg)]), SC.made(R2))
        v0 = first_page(R.smi)
        if self.policy in ('need', 'half') and v0[0] >= full:
            return
        best = None
        for a, b in self.OPTS:
            for s in SP.products(R.smi, a + '>>' + b, 6)[:2]:
                if G.has_far(R.rules):
                    import fold as F
                    s = F.with_anchor(s)
                v = first_page(s)
                if best is None or v > best[0]:
                    best = (v, s)
        if best is None:
            return
        ok = best[0] > v0 if self.policy == 'always' else best[0][0] > v0[0]
        if not ok:
            return
        R.smi = best[1]
        R.x['mask'] = price
        R.x['tap'] = R.x.get('tap', 0) + 1
        run['mask_n'] = run.get('mask_n', 0) + 1
        self.pay(G, R, price)

    def round_end(self, G, R, run, earned):
        price = R.x.get('mask', 0)
        if not price:
            return earned
        if self.policy != 'half' and run['gold'] + earned >= price:
            run['gold'] -= price                 # paid the second time: the yield is kept
            run['spent'] += price
            run['kept'] = run.get('kept', 0) + 1
            return earned
        total = R.x['total'] // 2                # the mask comes off unpaid: half the yield is lost, and the gold it would have earned
        par = SC.quota_of(R.rnd, R.brief)
        e2 = 0
        if total >= par:
            e2 = SC.COIN['mark'] * sum(1 for k in (2, 4, 8) if total >= SC.nice(par * k)) + min(SC.COIN['cap'], run['gold'] // SC.COIN['per'])
        R.x['total'] = total
        return min(earned, e2)


VERSIONS = {c.vid: c for c in (Crown, Mask, Tatters, Pledge, Refire)}
CELLS = ('crown:need', 'crown:always', 'mask:need', 'mask:always', 'mask:half', 'tatters:early', 'tatters:late', 'pledge:3', 'pledge:6', 'refire:need', 'refire:always')
TITLE = {'crown': 'The Open Crown', 'mask': 'The Mask', 'tatters': 'The Tatters', 'pledge': 'The Pledge', 'refire': 'The Second Act'}


def make(arg):
    vid, _, policy = arg.partition(':')
    return VERSIONS[vid](policy)


if __name__ == '__main__':
    for cell in ('none',) + CELLS:
        G = SC.Game(mods=[] if cell == 'none' else [make(cell)])
        res = [SC.play_run(G, 40 + i, 'master', SC.START_SIX, 'median') for i in range(3)]
        print('%-15s cleared %s won %s gold %s spent %s uses %s' % (cell, [r['cleared'] for r in res], [int(r['won']) for r in res],
                                                               [r['gold'] for r in res], [r['spent'] for r in res], [r['uses'] for r in res]))
