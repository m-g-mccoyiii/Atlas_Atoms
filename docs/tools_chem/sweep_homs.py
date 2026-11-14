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
    wood       on the round's last page, the last reagent of the line found nothing to act on.  He drinks it and pours every dealt reagent that was
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
        R.x['tp_' + self.name] = False
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
        return bool(R.rec) and not R.x.get('tp_' + self.name) and (self.last_page or R.page < R.pages)

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
        R.x['tp_' + self.name] = True
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
    """The chain floats over the page turn.  The bet (thirteenth): if the next page's own chain is shorter than the chain that
    floated, the balloon pops and the yield is times POP."""
    name = 'h2'
    last_page = False
    POP = 0.6
    NEED = 1            # the page's chain must be this long to float (3 until the fifteenth)
    TWO = True          # fifteenth: lit only by a page of two reagents (the third circle left empty), oxidize the second
    KT = 2.5            # fifteenth: the yield times this at the tap (reads 1.58)

    def setup(self, G):
        if self.TWO:
            G.p['short_lines'] = True
    SAFE = 99           # a reader floats any chain it is lit for
    peek_force = True   # a reader sees the pop before it lines up

    def lit(self, G, R):
        c = R.rec[-1]['circ']
        if self.TWO and len(c) != 2:
            return False
        return bool(c) and c[-1][0] == 'oxidize' and c[-1][1] > 0 and R.casc >= self.NEED

    def food_now(self, G, R):
        return R.rec[-1]['off'].get('hydrogen', 0) >= 1

    def apply(self, G, R):
        R.x['float'] = R.casc
        R.E *= self.KT

    def want(self, G, R, R2):
        return R.casc <= self.SAFE

    def page_turn(self, G, R):
        f = R.x.pop('float', 0)
        if f:
            R.casc = f
            R.x['floated'] = f

    def passive(self, G, R):
        f = R.x.pop('floated', 0)
        if f and len(R.rec[-1]['chain']) < f:
            R.E *= self.POP
            R.x['popped'] = R.x.get('popped', 0) + 1

    def peek(self, G, R, rng):
        if not R.rec:
            return None
        R2 = R.copy()
        R2.rec = list(R.rec)
        self.passive(G, R2)
        v = G.value(R2)
        if self._ok(R2) and self.lit(G, R2) and self.want(G, R2, R2):
            # the gain comes on the next page: a reader counts the chain it carries over as a tenth of the yield a step
            v = (v[0], int(v[1] * (1 + 0.1 * R2.casc)))
        return v


class DryIce(Hom):
    name = 'co2'
    K = 1.36            # three bottles shut: 2.5 times
    MOST = 3
    LEAST = 3

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
    K = 2.0
    LOSS = 2

    def lit(self, G, R):
        return R.x.get('a0', 0) - R.rec[-1]['F']['atoms'] >= self.LOSS

    def apply(self, G, R):
        R.E *= self.K


class Wood(Hom):
    """Any page (thirteenth): a reagent lined up found nothing to act on.  He drinks it and pours every dealt reagent that was
    not lined up, left to right as dealt, and his pours spend no use."""
    name = 'wood'
    K = 1.5             # yield times this when at least one of his pours lands (1.25 while his pours were free and the bottle he drank came back)

    def rest(self, R):
        ln = set(line_of(R.rec[-1]))
        return [r for r in R.x.get('hand', ()) if r not in ln and (R.left is None or R.left.get(r, 0) > 0)]

    def dud(self, R):
        c = R.rec[-1]['circ'][:3]
        return len(c) >= 3 and c[0][0] != 'finish' and c[0][1] == 0       # the FIRST reagent lined up found nothing

    def food_now(self, G, R):
        return any(c[1] == 0 for c in R.rec[-1]['circ'])

    def lit(self, G, R):
        return self.dud(R) and not R.over and len(self.rest(R)) >= 1

    FREE = False        # fifteenth: his pours spend a use each (they were free)
    EMPTY = True        # fifteenth: the bottle he drank is empty for the rest of the round

    def apply(self, G, R):
        rest = self.rest(R)
        dud = R.rec[-1]['circ'][0][0]
        if R.left is not None and self.FREE:
            for r in rest:
                R.left[r] = R.left.get(r, 0) + 1
        n0 = len(R.rec[-1]['circ'])
        more_circles(G, R, rest)
        if self.EMPTY and R.left is not None:
            R.left[dud] = 0
        if any(c[1] > 0 for c in R.rec[-1]['circ'][n0:]):
            R.E *= self.K


class Salt(Hom):
    name = 'salt'
    K = 2.5

    def lit(self, G, R):
        return len(R.rec) >= 2 and len(R.rec[-1]['circ']) >= 3 and line_of(R.rec[-1])[:3] == line_of(R.rec[-2])[:3]

    def apply(self, G, R):
        R.E *= self.K
        if R.left is not None:
            for r in line_of(R.rec[-1])[:3]:
                if r != 'finish':
                    R.left[r] = R.left.get(r, 0) + 1


class Slime(Hom):
    """Fifteenth: the same bottle twice on a page, both landing and each setting off a reflex of its own: yield times K, and that
    bottle is empty for the rest of the round.  (SAME 0 is the thirteenth's rule: two or three reagents each with a reflex, K2 and K,
    the bottles shut on the next page.)"""
    name = 'slime'
    K = 2.5
    K2 = 2.5

    OWN = 1             # fifteenth: each of the twins must also set off a reflex of its own
    SAME = 2            # fifteenth: lit by one bottle in this many of the page's circles, each landing; that bottle is then empty for the round

    def own(self, R):
        if self.SAME:           # the same bottle in two of the page's three circles (SAME 2) or all three (SAME 3), every one of them landing
            c = [x for x in R.rec[-1]['circ'][:3] if x[0] != 'finish']
            for r in dict.fromkeys(x[0] for x in c):
                tw = [x for x in c if x[0] == r]
                if len(tw) >= self.SAME and all(x[1] > 0 and (not self.OWN or x[2] > 0) for x in tw):
                    return [r] * len(tw)
            return []
        return [x[0] for x in R.rec[-1]['circ'][:3] if x[0] != 'finish' and x[1] > 0 and x[2] > 0]

    def lit(self, G, R):
        return len(self.own(R)) >= 2

    def food_now(self, G, R):
        return len(self.own(R)) >= 1

    def apply(self, G, R):
        own = self.own(R)
        R.E *= self.K if len(own) >= 3 else self.K2
        if self.SAME:
            if R.left is not None:
                R.left[own[0]] = 0
            return
        R.x['stuck'] = tuple(dict.fromkeys(own))      # in the order of the line, as the game (the measures were run with them sorted by name: at most two are ever shut, so it seldom differs)

    def before_page(self, G, R, rng, player, hand):
        for r in R.x.pop('stuck', ()):
            if r in hand and len(hand) > 3:
                hand.remove(r)
        return Hom.before_page(self, G, R, rng, player, hand)


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
        if G.p.get('ammonia_limits'):      # path.js RULE.ammoniaLimits (off): the second firing has the page's plain limits, counted afresh
            R.limcnt = ()
            G.limits_back = True
            try:
                more_circles(G, R, ln)
            finally:
                G.limits_back = False
            return
        more_circles(G, R, ln)


class Seedling(Hom):
    name = 'seedling'
    K = 1.8             # 1.8, then 2.6, then 3.4 for each page in a row (1.4 and 8 atoms until the fifteenth)
    GAIN = 12
    WILT = 0.7
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
        # thirteenth: once it has been tapped it must be fed every page: a page that grows less than GAIN and it wilts
        if self.grew(R) < self.GAIN and R.x.get('streak', 0) > 0 and R.x.get('wpage') != R.page and R.x.get('spage') != R.page:
            R.E *= self.WILT
            R.x['streak'] = 0
            R.x['wpage'] = R.page

    def apply(self, G, R):
        n = R.x.get('streak', 0) + 1
        R.x['streak'] = n
        R.x['spage'] = R.page
        R.E *= 1 + (self.K - 1) * n


class Brimstone(Hom):
    """Sulfur went on the molecule this page (thiolene lands, or a cap), not on the last page.  Hellfire: the round ends now,
    whatever is left of the task is burned (it counts as met), and the yield is times K after page one, K2 after page two.
    The pages not played are the price."""
    name = 'brimstone'
    K = 1.5
    K2 = 1.25
    last_page = False

    HALF = 0.5          # fifteenth: the fire takes only a task this far done (0.5: at least half)

    def lit(self, G, R):
        rec = R.rec[-1]
        if self.HALF and R.spec and G.prog(R, R.rec) < self.HALF * len(R.spec):
            return False
        return (not R.over) and (any(c[0] == 'thiolene' and c[1] > 0 for c in rec['circ']) or 'cap' in rec['chain'])

    def apply(self, G, R):
        R.E *= self.K if R.page <= 1 else self.K2
        R.x['burnt'] = True
        R.over = True

    def want(self, G, R, R2):
        # a reader burns when that clears the round: the yield then passes the mark, and either the task is not met yet (it is
        # burned) or the yield was short without the fire
        nd = G.need_abs(R)
        if nd <= 0:
            return bool(R.spec) and not G.met(R) and R.page >= 2
        return made(R2) >= nd and (not G.met(R) or made(R) < nd)


HOMS = {c.name: c for c in (Water, Hydrogen, DryIce, Acid, Wood, Salt, Slime, Ammonia, Seedling, Brimstone)}
ORDER = ('water', 'h2', 'co2', 'acid', 'wood', 'salt', 'slime', 'ammonia', 'seedling', 'brimstone')
LABEL = {'water': 'Water', 'h2': 'Hydrogen', 'co2': 'Dry ice', 'acid': 'Acid', 'wood': 'Wood spirit', 'salt': 'Salt', 'slime': 'Slime',
         'ammonia': 'Ammonia', 'seedling': 'Seedling', 'brimstone': 'Brimstone'}


def make(arg):
    arg, _, opts = arg.partition('/')          # name[@k][/ATTR=value/ATTR=value]: a trial of a creature's own numbers
    name, _, k = arg.partition('@')
    h = HOMS[name](float(k) if k else None)
    for o in opts.split('/') if opts else ():
        a, v = o.split('=')
        setattr(h, a.upper(), float(v) if '.' in v else int(v))
    return h
