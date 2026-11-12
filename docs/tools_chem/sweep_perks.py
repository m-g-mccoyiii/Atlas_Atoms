"""sweep_perks.py: the ten homunculi of docs/HOMUNCULI.md as perks for sweep_core (they may break chemistry).

Each is a sweep_core.Mod.  It is fed inside a round by what the table in HOMUNCULI.md names, it can be tapped once a round,
and it is tapped only when it can do something.  The simulated players: the novice taps a lit creature half the time at a
place taken at random; the others try every place offered (at most six) and tap only where spec progress or yield goes up.

How close each is to HOMUNCULI.md / path.js HOMS is said in the class docstring (FIDELITY).
"""
import random

from rdkit import Chem
from rdkit.Chem import AllChem

import chemlib
from chemlib import parse
import library as L
import sweep_core as SC

MAXOPT = 6
_RX = {}


def rx(sma):
    r = _RX.get(sma)
    if r is None:
        r = _RX[sma] = AllChem.ReactionFromSmarts(sma)
    return r


def products(smi, sma, cap=40):
    """Every single-place product of a reaction SMARTS on smi, as canonical SMILES (deduplicated, in a fixed order)."""
    out = []
    for ps in rx(sma).RunReactants((parse(smi),), maxProducts=cap):
        try:
            m = ps[0]
            Chem.SanitizeMol(m)
            s = Chem.MolToSmiles(m)
            if '.' not in s and s not in out and Chem.MolFromSmiles(s) is not None:
                out.append(s)
        except Exception:
            pass
    return out


class Perk(SC.Mod):
    name = ''
    chem = ''
    need = 1
    when = 'after'            # 'after' the page fired, or 'before' it is lined up
    restart = False
    last_page = True          # may it be tapped on the last page

    def __init__(self):
        self.reset()

    def reset(self):
        self.taps = 0
        self.lit = 0
        self.rounds = 0

    def setup(self, G):
        G.hooks_fire = True

    def report(self):
        return {self.name: {'taps': self.taps, 'lit': self.lit, 'rounds': self.rounds}}

    def round_start(self, G, R, rng):
        if G.real:
            self.rounds += 1

    def fed(self, R):
        return 0

    def ready(self, R):
        return not R.x.get('used_' + self.name) and self.fed(R) >= self.need

    def options(self, G, R, rng):
        """The molecules it could leave (one per place it could be tapped)."""
        return []

    def after_tap(self, G, R):
        pass

    def after_page(self, G, R, rng, player):
        if self.when != 'after' or not self.ready(R) or (not self.last_page and R.page >= R.pages):
            return
        opts = self.options(G, R, rng)
        if not opts:
            return
        self.lit += 1 if G.real else 0
        if player == 'novice':
            if rng.random() < 0.5:
                self._do(G, R, rng.choice(opts))
            return
        base = G.value(R)
        best = None
        for s in opts[:MAXOPT]:
            R2 = R.copy()
            R2.rec = list(R.rec)
            self._apply(G, R2, s)
            v = G.value(R2)
            if v > base and (best is None or v > best[0]):
                best = (v, s)
        if best:
            self._do(G, R, best[1])

    def peek(self, G, R, rng):
        if self.when != 'after' or not self.ready(R) or (not self.last_page and R.page >= R.pages):
            return None
        best = None
        for s in self.options(G, R, rng)[:3]:
            R2 = R.copy()
            R2.rec = list(R.rec)
            self._apply(G, R2, s)
            v = G.value(R2)
            if best is None or v > best:
                best = v
        return best

    def _apply(self, G, R, s):
        G.tap(R, s, restart=self.restart)
        self.after_tap(G, R)

    def _do(self, G, R, s):
        self._apply(G, R, s)
        R.x['used_' + self.name] = True
        R.x['tap'] = R.x.get('tap', 0) + 1
        self.taps += 1 if G.real else 0


class Water(Perk):
    """Floods: every C=C becomes C-OH, every loose ring opens, the rings close again; the count of the page starts again.
    Fed by 3 waters.  FIDELITY: as path.js HOMS.water (hydrate at every C=C, reopen, restart)."""
    name = 'water'
    need = 3
    restart = True

    def fed(self, R):
        return R.ev.get('water', 0)

    def options(self, G, R, rng):
        s = G.reopen(R.smi)
        f = G.eng(True, G.has_far(R.rules)).fire(s, 'hydrate')
        s2 = f.smi if f.acted else s
        return [s2] if s2 != R.smi else []


class Hydrogen(Perk):
    """Floats over: one C=O becomes OH where a ring then closes, and the rings carry on.  Fed by 3 hydrogens.
    FIDELITY: path.js offers the nearest C=O beyond each OH; here every C=O is tried and one that sets off a reflex is kept."""
    name = 'h2'
    need = 3

    def fed(self, R):
        return R.ev.get('hydrogen', 0)

    def options(self, G, R, rng):
        out = []
        for s in products(R.smi, '[CX3;!$(C(=O)-[!#6]):1]=[OX1:2]>>[C:1]-[O:2]'):
            if G.casc_only(s, (), R.rules, G.co2_of(R)):
                out.append(s)
        return out


class DryIce(Perk):
    """Freezes: the loose rings closed now stay shut for the round and are paid again, twice over, at the start of every later
    page.  Fed by 1 carbon dioxide.  Not on the last page.  FIDELITY: as path.js (frozenPay with pay 2, casc counts on from the
    frozen rings).  The frozen ring atom carries isotope 200 and the loose-ring pattern skips it."""
    name = 'co2'
    need = 1
    last_page = False
    SKIP = '[CX4:1](-[OX2H:2])-;@[OX2,SX2,NX3;D2;!200*:3]-[#6]'
    LOOSE = Chem.MolFromSmarts('[CX4](-[OX2H])-;@[OX2,SX2,NX3;D2;!200*]-[#6]')

    def setup(self, G):
        Perk.setup(self, G)
        G.reopen_skip = self.SKIP

    def fed(self, R):
        return R.ev.get('carbon_dioxide', 0)

    def _freeze(self, smi):
        mol = Chem.RWMol(parse(smi))
        ms = mol.GetSubstructMatches(self.LOOSE)
        seen = set()
        for m in ms:
            if m[2] not in seen:
                seen.add(m[2])
                mol.GetAtomWithIdx(m[2]).SetIsotope(200)
        return Chem.MolToSmiles(mol), len(seen)

    def options(self, G, R, rng):
        s, n = self._freeze(R.smi)
        if not n or not (R.page >= R.pages - 1 or R.casc >= 3):
            return []
        return [s]

    def after_page(self, G, R, rng, player):
        if not self.ready(R) or R.page >= R.pages:
            return
        opts = self.options(G, R, rng)
        if not opts:
            return
        self.lit += 1 if G.real else 0
        if player == 'novice' and rng.random() < 0.5:
            return
        s, n = self._freeze(R.smi)
        R.smi = s
        R.x['frozen'] = R.x.get('frozen', 0) + n
        R.x['used_' + self.name] = True
        R.x['tap'] = R.x.get('tap', 0) + 1
        self.taps += 1 if G.real else 0

    def page_turn(self, G, R):
        n = R.x.get('frozen', 0)
        if not n:
            return
        p = G.p
        for k in range(1, n + 1):
            R.P += p['casc_place'] * k * 2
            R.E += p['step'] * k * 2
            R.Rr += p['row_c'] * 2
        R.casc = n


class Acid(Perk):
    """Eats through: every stretch of four or more plain CH2 is eaten down to three, and for the rest of the round a ring closes
    across up to six carbons.  Fed by hydrate or dehydrate fired once.  FIDELITY: as HOMUNCULI.md; the wider ring is the game's
    ring with reach 3 to 6 (sweep_core.ring_rule)."""
    name = 'acid'
    CH2 = 'CH2;X4;!R;!$(C-[!#6])'
    EAT = chemlib.SmartsStep('[%s:1]-[%s]-[%s:3]-[%s:4]>>[C:1]-[C:3]-[C:4]' % (CH2, CH2, CH2, CH2))

    def setup(self, G):
        Perk.setup(self, G)
        G.self_rules['ring6'] = SC.ring_rule('ring6', 3, 6)

    def fed(self, R):
        return R.ev.get('use:hydrate', 0) + R.ev.get('use:dehydrate', 0)

    def options(self, G, R, rng):
        return [Chem.MolToSmiles(self.EAT.apply_all(parse(R.smi)).mol)]

    def _apply(self, G, R, s):
        R.rules = tuple('ring6' if r == 'ring' else r for r in R.rules)
        G.tap(R, s)


class Wood(Perk):
    """Blind drunk: tapped before the page is lined up, the page fires every dealt reagent that has a use left, in a random
    order, each spending a use.  Fed by 1 reduce.  FIDELITY: as path.js HOMS.wood (five circles, the double pay after the last)."""
    name = 'wood'
    when = 'before'

    def fed(self, R):
        return R.ev.get('use:reduce', 0)

    def before_page(self, G, R, rng, player, hand):
        if not self.ready(R):
            return None
        ids = [r for r in hand if R.left is None or R.left.get(r, 0) > 0]
        if len(ids) < 2:
            return None
        self.lit += 1 if G.real else 0
        rng.shuffle(ids)
        if player == 'novice':
            ok = rng.random() < 0.5
        else:
            R2, pg = G.run_line(R, tuple(ids))
            v = (G.prog(R, R.rec + [G.page_rec(pg)]) if R.spec else 0.0, SC.made(R2))
            _l, R3, pg3 = G.choose(R, hand, SC.PLAYERS[player]['look'], random.Random(rng.random()))
            b = (G.prog(R, R.rec + [G.page_rec(pg3)]) if (R.spec and R3 is not None) else 0.0, SC.made(R3) if R3 is not None else 0)
            ok = v > b
        if not ok:
            return None
        R.x['used_' + self.name] = True
        R.x['tap'] = R.x.get('tap', 0) + 1
        self.taps += 1 if G.real else 0
        return tuple(ids)


class Salt(Perk):
    """Cures: tap a C=O; for the round a ring that closes on it leaves it a C=O, up to three rings a page.  Fed by oxidize on a
    chain-end OH.  FIDELITY: tapped after a page here (the game taps before the next is lined up, which is the same moment).
    The cured carbon holds C=O and the ring bonds at once, five or more bonds: the ring bond is stored as a dative bond from the
    carbon, which RDKit leaves out of the carbon's valence.  A cured C=O that has taken a ring is out of reach of every reagent
    (as the game says); before its first ring it is not protected.  The cured rings open again when the page is turned."""
    name = 'salt'
    ENDOL = Chem.MolFromSmarts('[CH2X4;D2](-[OX2H])-[#6]')

    def setup(self, G):
        Perk.setup(self, G)
        kc, oh = '[#6;201*:1]=[OX1:2]', '[OX2H:3]-[CX4:4]'

        def find(mol):
            return chemlib.pair_sites(mol, kc, oh, 1, 4, 3, 4, ring='any')

        def edit(rw, s):
            rw.AddBond(s['A'][1], s['B'][3], Chem.BondType.DATIVE)
        r = chemlib.GraphRule('cure', find, edit, label='cure', source='sweep')
        r.prio, r.per_turn, r.alias = 1, 3, 'ring'
        G.self_rules['cure'] = r
        G.near = G.near + ('cure',)
        G.reopen_extra.append(self._open)

    @staticmethod
    def _open(smi):
        if '->' not in smi and '<-' not in smi:
            return smi
        rw = Chem.RWMol(parse(smi))
        for b in list(rw.GetBonds()):
            if b.GetBondType() == Chem.BondType.DATIVE:
                rw.RemoveBond(b.GetBeginAtomIdx(), b.GetEndAtomIdx())
        out = chemlib.finish(rw)
        return Chem.MolToSmiles(out) if out is not None else smi

    def on_fire(self, G, R, rid, sg):
        if rid == 'oxidize' and parse(R.smi).HasSubstructMatch(self.ENDOL):
            R.ev['endox'] = R.ev.get('endox', 0) + 1

    def fed(self, R):
        return R.ev.get('endox', 0)

    def options(self, G, R, rng):
        mol = parse(R.smi)
        out = []
        for m in mol.GetSubstructMatches(Chem.MolFromSmarts('[%s]=[OX1]' % L.KC)):
            rw = Chem.RWMol(mol)
            rw.GetAtomWithIdx(m[0]).SetIsotope(201)
            s = Chem.MolToSmiles(rw)
            if s not in out:
                out.append(s)
        rng.shuffle(out)
        return out


class Slime(Perk):
    """Sticks: two carbons are joined by two carbons of slime, so groups on them come within reach of each other.  Fed by 1
    hydroborate.  FIDELITY: the pairs offered are an OH carbon and a carbon beside a C=O that are too far apart to close a ring
    (the game offers pairs across which a ring would close); the two slime carbons are real carbons and may pass the size limit."""
    name = 'slime'

    def fed(self, R):
        return R.ev.get('use:hydroborate', 0)

    def options(self, G, R, rng):
        mol = parse(R.smi)
        a = [m[0] for m in mol.GetSubstructMatches(Chem.MolFromSmarts('[CX4;!H0]-[OX2H]'))]
        b = [m[0] for m in mol.GetSubstructMatches(Chem.MolFromSmarts('[CX4;!H0]-[%s]=[OX1]' % L.KC))]
        pairs = [(x, y) for x in a for y in b if x != y and chemlib.cdist(mol, x, 99).get(y, 99) > 3]
        rng.shuffle(pairs)
        out = []
        for x, y in pairs[:12]:
            rw = Chem.RWMol(mol)
            c1, c2 = rw.AddAtom(Chem.Atom(6)), rw.AddAtom(Chem.Atom(6))
            rw.AddBond(x, c1, Chem.BondType.SINGLE)
            rw.AddBond(c1, c2, Chem.BondType.SINGLE)
            rw.AddBond(c2, y, Chem.BondType.SINGLE)
            m2 = chemlib.finish(rw)
            if m2 is None:
                continue
            s = Chem.MolToSmiles(m2)
            if s not in out and G.casc_only(s, (), R.rules, G.co2_of(R)):
                out.append(s)
            if len(out) >= MAXOPT:
                break
        return out


class Ammonia(Perk):
    """Smelling salts: the page's reagents fire again by themselves, in the same order, no uses spent.  Fed by 2 ammonias (ammonia
    in the runoff, or oxidize fired while the molecule holds an NH2).  FIDELITY: as HOMUNCULI.md; not built in the game."""
    name = 'ammonia'
    need = 2
    NH2 = Chem.MolFromSmarts('[NX3H2]-[CX4]')

    def on_fire(self, G, R, rid, sg):
        if rid == 'oxidize' and parse(R.smi).HasSubstructMatch(self.NH2):
            R.ev['nh3'] = R.ev.get('nh3', 0) + 1

    def fed(self, R):
        return R.ev.get('ammonia', 0) + R.ev.get('nh3', 0)

    def after_page(self, G, R, rng, player):
        if not self.ready(R):
            return
        line = (R.x.get('lines') or ((),))[-1]
        line = tuple(r for r in line if r != 'finish')
        if not line:
            return
        self.lit += 1 if G.real else 0
        if player == 'novice' and rng.random() < 0.5:
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
        v2 = (G.prog(R, R.rec[:-1] + [G.page_rec(pg2)]) if R.spec else 0.0, SC.made(R2))
        if player != 'novice' and v2 <= G.value(R):
            return
        for k in SC.Round.__slots__:
            if k not in ('left', 'rec', 'x'):
                setattr(R, k, getattr(R2, k))
        R.rec = R.rec[:-1] + [G.page_rec(pg2)]
        R.x['used_' + self.name] = True
        R.x['tap'] = R.x.get('tap', 0) + 1
        self.taps += 1 if G.real else 0


class Seedling(Perk):
    """Grows: nine carbons with three C=O grow from the carbon tapped and may pass the size limit.  Fed by 1 grow.
    FIDELITY: as HOMUNCULI.md (the arm is CH2-CH2-CO-CH2-CH2-CO-CH2-CH2-CHO); up to six carbons are tried, OH carbons first."""
    name = 'seedling'
    ARM = '[CX4;!H0:1]>>[C:1]CCC(=O)CCC(=O)CCC=O'

    def fed(self, R):
        return R.ev.get('use:grow', 0)

    def options(self, G, R, rng):
        ps = products(R.smi, self.ARM, 60)
        rng.shuffle(ps)
        out = [s for s in ps[:10] if G.casc_only(s, (), R.rules, G.co2_of(R))]
        return out[:MAXOPT]


class Brimstone(Perk):
    """Hellfire: burns the next eight plain carbons from the carbon tapped and writes an OH on the 4th and a C=O on the 8th (on a
    stretch of four to seven plain carbons only the OH).  Then the rings run.  Fed by 2 sulfurs (sulfur in the runoff, or oxidize
    fired while the molecule holds an SH).  FIDELITY: as HOMUNCULI.md; the short stretch is this file's addition; not built in the game."""
    name = 'brimstone'
    need = 2
    SH = Chem.MolFromSmarts('[SX2H]')
    PL = 'CH2;X4;!$(C-[!#6])'
    BURN8 = '[#6:9]-[%s:1]-[%s:2]-[%s:3]-[%s:4]-[%s:5]-[%s:6]-[%s:7]-[CH2,CH3;X4;!$(C-[!#6]):8]>>[#6:9]-[C:1]-[C:2]-[C:3]-[C:4](O)-[C:5]-[C:6]-[C:7]-[C:8]=O' % ((PL,) * 7)
    BURN4 = '[#6:9]-[%s:1]-[%s:2]-[%s:3]-[CH2,CH3;X4;!$(C-[!#6]):4]>>[#6:9]-[C:1]-[C:2]-[C:3]-[C:4]O' % ((PL,) * 3)

    def on_fire(self, G, R, rid, sg):
        if rid == 'oxidize' and parse(R.smi).HasSubstructMatch(self.SH):
            R.ev['sox'] = R.ev.get('sox', 0) + 1

    def fed(self, R):
        return R.ev.get('sulfur', 0) + R.ev.get('sox', 0)

    def options(self, G, R, rng):
        ps = products(R.smi, self.BURN8) or products(R.smi, self.BURN4)
        rng.shuffle(ps)
        return ps[:MAXOPT]


PERKS = {c.name: c for c in (Water, Hydrogen, DryIce, Acid, Wood, Salt, Slime, Ammonia, Seedling, Brimstone)}
ORDER = ('water', 'h2', 'co2', 'acid', 'wood', 'salt', 'slime', 'ammonia', 'seedling', 'brimstone')
LABEL = {'water': 'Water', 'h2': 'Hydrogen', 'co2': 'Dry ice', 'acid': 'Acid', 'wood': 'Wood spirit', 'salt': 'Salt', 'slime': 'Slime',
         'ammonia': 'Ammonia', 'seedling': 'Seedling', 'brimstone': 'Brimstone'}


def make(name):
    return PERKS[name]()


if __name__ == '__main__':
    import sys
    import time
    racks = {'six': SC.START_SIX, 'eight': SC.START_SIX + ('reduce', 'hydroborate')}
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 6
    for nm in (sys.argv[2:] or ORDER):
        t = time.time()
        pk = make(nm)
        G = SC.Game(mods=[pk])
        res = [SC.play_run(G, 100 + i, 'master', racks['eight'], 'median') for i in range(n)]
        print('%-10s cleared %.2f taps %d lit %d rounds %d  %.1f s' % (nm, sum(r['cleared'] for r in res) / n, pk.taps, pk.lit, pk.rounds, time.time() - t))
