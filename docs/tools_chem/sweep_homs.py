"""sweep_homs.py: the ten homunculi, second design (ruling AP 2: "reward gameplay not averages").

Each pays for a way of playing a page or a round.  It is lit by what the player's three reagents did on the page (never by a
flat count), the player taps it, and it has a cost or a risk.  The numbers (K) are the ones in path.js HOMS2.
A name may carry its own strength: 'water@1.8'.

    water      a wet page: 4 or more waters off one page.  The flood: the round's yield times K, and every C=C becomes C-OH.
    h2         the last reagent of the page gives off hydrogen (oxidize lands last).  The chain floats over the page turn:
               the next page's chain counts on from this page's.
    co2        carbon dioxide was made this round and at least two reagents were never fired in it.  At the end of the
               round every reagent never fired is a frozen bottle: the yield times K for each (three at most).
    acid       the molecule ends the page smaller than it began (it was eaten).  The yield times K.
    wood       the last reagent of the line found nothing to act on.  He drinks it and pours every dealt reagent that was
               not lined up, left to right, each spending a use.
    salt       the line is the line of the page before, reagent for reagent.  The yield times K and the line spends no use.
    slime      every one of the three reagents lands and sets off at least one reflex.  It sticks the three chains
               into one: the yield times K.
    ammonia    nitrogen went on the molecule this page (ritter lands, or a knit).  The line fires again, no use spent.
    seedling   the molecule ends the page at least 5 atoms bigger than it began.  The yield times K, and more for each
               page in a row; a page that ends smaller and it wilts (times WILT, the row starts again).
    brimstone  sulfur went on the molecule this page (thiolene lands, or a cap), not on the last page.  Hellfire: the
               round ends now and the yield is times K (after page one) or K2 (after page two).
"""
import sweep_core as SC
from sweep_core import made

HAND = {}


class Hom(SC.Mod):
    name = ''
    chem = ''
    K = 1.5
    in_proof = False
    last_page = True

    def __init__(self, k=None):
        if k is not None:
            self.K = k
        self.reset()

    def reset(self):
        self.taps = self.lit_n = self.rounds = self.pages = self.food = self.rtap = 0

    def report(self):
        return {self.name: {'taps': self.taps, 'lit': self.lit_n, 'rounds': self.rounds, 'pages': self.pages, 'food': self.food, 'rtap': self.rtap}}

    def round_start(self, G, R, rng):
        if G.real:
            self.rounds += 1
            self._rt = False

    def before_page(self, G, R, rng, player, hand):
        R.x['a0'] = G.feat(R.smi)['atoms']
        R.x['hand'] = tuple(hand)
        R.x['tp'] = False
        return None

    # --- what each creature answers -------------------------------------------------------------------------------
    def food_now(self, G, R):
        """Was its food made on the page just fired (whether or not the way of playing was met)."""
        return self.lit(G, R)

    def lit(self, G, R):
        return False

    def apply(self, G, R):
        pass

    def want(self, G, R, R2):
        return G.value(R2) > G.value(R)

    def passive(self, G, R):
        """What it does by itself after a page (a penalty)."""

    # --- the flow ----------------------------------------------------------------------------------------------------
    def _ok(self, R):
        return bool(R.rec) and not R.x.get('tp') and (self.last_page or R.page < R.pages)

    def after_page(self, G, R, rng, player):
        if not R.rec:
            return
        if G.real:
            self.pages += 1
            if self.food_now(G, R):
                self.food += 1
        self.passive(G, R)
        if not self._ok(R) or not self.lit(G, R):
            return
        if G.real:
            self.lit_n += 1
        if player == 'novice':
            if rng.random() < 0.5:
                return
        else:
            R2 = R.copy()
            R2.rec = list(R.rec)
            self.apply(G, R2)
            if not self.want(G, R, R2):
                return
        self.apply(G, R)
        R.x['tp'] = True
        R.x['tap'] = R.x.get('tap', 0) + 1
        if G.real:
            self.taps += 1
            if not self._rt:
                self._rt = True
                self.rtap += 1

    def peek(self, G, R, rng):
        if not self._ok(R) or not self.lit(G, R):
            return self.peek_plan(G, R)
        R2 = R.copy()
        R2.rec = list(R.rec)
        self.passive(G, R2)
        self.apply(G, R2)
        if not self.want(G, R, R2):
            return None
        return G.value(R2)

    def peek_plan(self, G, R):
        return None


def line_of(rec):
    return tuple(c[0] for c in rec['circ'])


def more_circles(G, R, rids):
    """Fire more reagents on the page just fired (path.js: the queue goes on); the last of them is the page's last."""
    rec = R.rec[-1]
    pg = {'circ': [list(c) for c in rec['circ']], 'chain': list(rec['chain']), 'off': dict(rec['off']), 'last_on': False}
    n0 = len(pg['circ'])
    for i, rid in enumerate(rids):
        if R.over:
            break
        G.play_circle(R, rid, pg, n0 + i, n0 + len(rids))
    pg['smi'] = R.smi
    R.rec = R.rec[:-1] + [G.page_rec(pg)]


class Water(Hom):
    name = 'water'
    K = 1.5
    NEED = 4

    def lit(self, G, R):
        return R.rec[-1]['off'].get('water', 0) >= self.NEED

    def food_now(self, G, R):
        return R.rec[-1]['off'].get('water', 0) >= 1

    def apply(self, G, R):
        R.E *= self.K
        s = G.reopen(R.smi)
        f = G.eng(True, G.has_far(R.rules)).fire(s, 'hydrate')
        s2 = f.smi if f.acted else s
        if s2 != R.smi:
            G.tap(R, s2)


class Hydrogen(Hom):
    name = 'h2'
    last_page = False

    def lit(self, G, R):
        c = R.rec[-1]['circ']
        return bool(c) and c[-1][0] == 'oxidize' and c[-1][1] > 0 and R.casc > 0

    def food_now(self, G, R):
        return R.rec[-1]['off'].get('hydrogen', 0) >= 1

    def apply(self, G, R):
        R.x['float'] = R.casc

    def want(self, G, R, R2):
        return True

    def page_turn(self, G, R):
        f = R.x.pop('float', 0)
        if f:
            R.casc = f

    def peek(self, G, R, rng):
        # the gain comes on the next page: a reader counts the chain it carries over as half a step of yield each
        if not self._ok(R) or not self.lit(G, R):
            return None
        v = G.value(R)
        return (v[0], int(v[1] * (1 + 0.1 * R.casc)))


class DryIce(Hom):
    name = 'co2'
    K = 1.3
    MOST = 3
    LEAST = 2

    def shut(self, R):
        rack = R.x.get('rack') or ()
        return min(self.MOST, sum(1 for r in rack if not R.ev.get('use:' + r)))

    def round_start(self, G, R, rng):
        Hom.round_start(self, G, R, rng)
        R.x['rack'] = tuple(G.run.get('rack', ())) if getattr(G, 'run', None) else ()

    def food_now(self, G, R):
        return R.rec[-1]['off'].get('carbon_dioxide', 0) >= 1

    def lit(self, G, R):
        return R.page >= R.pages and R.ev.get('carbon_dioxide', 0) >= 1 and self.shut(R) >= self.LEAST

    def apply(self, G, R):
        R.E *= self.K ** self.shut(R)

    def peek_plan(self, G, R):
        # before the last page a reader counts the bottles still shut once carbon dioxide has been made
        if R.ev.get('carbon_dioxide', 0) < 1 or self.shut(R) < self.LEAST:
            return None
        v = G.value(R)
        return (v[0], int(v[1] * self.K ** self.shut(R)))


class Acid(Hom):
    name = 'acid'
    K = 1.5
    LOSS = 1

    def lit(self, G, R):
        return R.x.get('a0', 0) - R.rec[-1]['F']['atoms'] >= self.LOSS

    def apply(self, G, R):
        R.E *= self.K


class Wood(Hom):
    name = 'wood'

    def rest(self, R):
        ln = set(line_of(R.rec[-1]))
        return [r for r in R.x.get('hand', ()) if r not in ln and (R.left is None or R.left.get(r, 0) > 0)]

    def dud(self, R):
        c = R.rec[-1]['circ']
        return len(c) >= 3 and c[-1][0] != 'finish' and c[-1][1] == 0

    def food_now(self, G, R):
        return any(c[1] == 0 for c in R.rec[-1]['circ'])

    def lit(self, G, R):
        return self.dud(R) and not R.over and len(self.rest(R)) >= 1

    def apply(self, G, R):
        more_circles(G, R, self.rest(R))

    def want(self, G, R, R2):
        # a reader lets him pour on the round's last page, or when every bottle he would pour keeps a use afterwards
        spare = R.left is None or R.page >= R.pages or all(R.left.get(r, 0) >= 2 for r in self.rest(R))
        return spare and G.value(R2) > G.value(R)


class Salt(Hom):
    name = 'salt'
    K = 2.0

    def lit(self, G, R):
        return len(R.rec) >= 2 and len(R.rec[-1]['circ']) >= 3 and line_of(R.rec[-1])[:3] == line_of(R.rec[-2])[:3]

    def apply(self, G, R):
        R.E *= self.K
        if R.left is not None:
            for r in line_of(R.rec[-1])[:3]:
                if r != 'finish':
                    R.left[r] = R.left.get(r, 0) + 1


class Slime(Hom):
    name = 'slime'
    K = 1.6

    def lit(self, G, R):
        c = R.rec[-1]['circ']
        return len(c) >= 3 and all(x[0] != 'finish' and x[1] > 0 and x[2] > 0 for x in c[:3])

    def food_now(self, G, R):
        return sum(1 for x in R.rec[-1]['circ'][:3] if x[2] > 0) >= 2

    def apply(self, G, R):
        R.E *= self.K


class Ammonia(Hom):
    name = 'ammonia'

    def lit(self, G, R):
        rec = R.rec[-1]
        return (not R.over) and (any(c[0] == 'ritter' and c[1] > 0 for c in rec['circ']) or 'knit' in rec['chain'])

    def apply(self, G, R):
        ln = [r for r in line_of(R.rec[-1])[:3] if r != 'finish']
        if R.left is not None:
            for r in ln:
                R.left[r] = R.left.get(r, 0) + 1
        more_circles(G, R, ln)


class Seedling(Hom):
    name = 'seedling'
    K = 1.2
    GAIN = 5
    WILT = 0.8
    peek_force = True         # a reader sees the wilt before it lines up

    def peek(self, G, R, rng):
        if not R.rec:
            return None
        R2 = R.copy()
        R2.rec = list(R.rec)
        self.passive(G, R2)
        if self._ok(R2) and self.lit(G, R2):
            self.apply(G, R2)
        return G.value(R2)

    def grew(self, R):
        return R.rec[-1]['F']['atoms'] - R.x.get('a0', 0)

    def food_now(self, G, R):
        return any(c[0] == 'grow' and c[1] > 0 for c in R.rec[-1]['circ'])

    def lit(self, G, R):
        return self.grew(R) >= self.GAIN and not R.x.get('wilted_now')

    def passive(self, G, R):
        if self.grew(R) < 0 and R.x.get('streak', 0) > 0 and R.x.get('wpage') != R.page:
            R.E *= self.WILT
            R.x['streak'] = 0
            R.x['wpage'] = R.page

    def apply(self, G, R):
        n = R.x.get('streak', 0) + 1
        R.x['streak'] = n
        R.E *= 1 + (self.K - 1) * n


class Brimstone(Hom):
    name = 'brimstone'
    K = 2.5
    K2 = 1.75
    last_page = False

    def lit(self, G, R):
        rec = R.rec[-1]
        return (not R.over) and (any(c[0] == 'thiolene' and c[1] > 0 for c in rec['circ']) or 'cap' in rec['chain'])

    def apply(self, G, R):
        R.E *= self.K if R.page <= 1 else self.K2
        R.over = True

    def want(self, G, R, R2):
        # hellfire is taken only when it turns a round not yet cleared into a cleared one
        if not (R.spec and G.met(R2)):
            return False
        nd = G.need_abs(R)
        return nd > 0 and made(R) < nd <= made(R2)


HOMS = {c.name: c for c in (Water, Hydrogen, DryIce, Acid, Wood, Salt, Slime, Ammonia, Seedling, Brimstone)}
ORDER = ('water', 'h2', 'co2', 'acid', 'wood', 'salt', 'slime', 'ammonia', 'seedling', 'brimstone')
LABEL = {'water': 'Water', 'h2': 'Hydrogen', 'co2': 'Dry ice', 'acid': 'Acid', 'wood': 'Wood spirit', 'salt': 'Salt', 'slime': 'Slime',
         'ammonia': 'Ammonia', 'seedling': 'Seedling', 'brimstone': 'Brimstone'}


def make(arg):
    name, _, k = arg.partition('@')
    return HOMS[name](float(k) if k else None)
