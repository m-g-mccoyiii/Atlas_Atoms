"""sweep_tools.py: the game's instruments (path.js FIVE, rules.js tools) as mods for sweep_core, so each can be measured as it is.

Seven of the eight are modelled.  Three are passive and are the game's rule exactly:
    carousel   one more reagent in the hand            dropper   one more use of every reagent        timer   a fourth circle on a page
Four change the molecule, once a round (path.js TOOLUSES), and the reflexes run from what they leave (path.js toolGo):
    crystal    a hydrogen on a plain carbon becomes an OH (the player picks the carbon)
    bunsen     every OH that can lose water does, and becomes a C=C
    burette    every C=C outside a benzene ring becomes a C=O
    magnet     every stretch of four or more plain CH2 in a row is pulled shut to two carbons
The mirror is not modelled (it copies half of the molecule across a bond; the reference chemistry has no such step).

FIDELITY.  The game lets a piece be used while a page is being lined up; here it is used after a page has fired (which is the
same as before the next page is lined up) and never before page one.  The places are found by SMARTS on the reference
chemistry, not by rules.js, so the count of places can differ by a few.  What the burner drives off is not counted as water.
TUNE holds what the fourteenth measure changed: `uses` (times a round a piece may be used; path.js TOOLUSES is 1 for all) and
`pay` (each reflex step a piece sets off counts this many times; path.js RULE.toolPay).
"""
from rdkit import Chem

from chemlib import parse
import sweep_core as SC
import sweep_perks as SP

_tp = SC.re.search(r'RULE\.toolPay = (\{.*?\});', SC._JS)
TOOL_PAY = {k: float(v) for k, v in SC.re.findall(r'(\w+): ([\d.]+)', _tp.group(1))} if _tp else {}
_tu = SC.re.search(r'RULE\.toolUses = (\{.*?\});', SC._JS)
TOOL_USES = {k: int(v) for k, v in SC.re.findall(r'(\w+): (\d+)', _tu.group(1))} if _tu else {}
_ps = SC.re.search(r'RULE\.passive = (\{.*?\});', SC._JS)
CAROUSEL_FIRST = bool(SC.re.search(r'RULE\.carouselFirst = true', SC._JS))
PASSIVE = {k: int(v) for k, v in SC.re.findall(r'(\w+): (\d+)', _ps.group(1))} if _ps else {}


def _heavy(smi):
    return len(SC.re.findall(r'Cl|Br|[BCNOSPFI]|[cnos]', smi))


def _exhaust(smi, sma, cap=24):
    """Apply a one-place reaction until it finds no place (the first product each time, in RDKit's fixed order)."""
    cur = smi
    for _ in range(cap):
        ps = SP.products(cur, sma, cap=8)
        if not ps:
            break
        cur = ps[0]
    return cur


def _magnet(smi):
    m = Chem.RWMol(parse(smi))
    plain = lambda a: a.GetSymbol() == 'C' and not a.IsInRing() and a.GetTotalNumHs() == 2 and a.GetDegree() == 2 and not a.GetIsAromatic()
    seen, runs = set(), []
    for a in m.GetAtoms():
        if a.GetIdx() in seen or not plain(a):
            continue
        # walk to one end of the stretch, then along it
        run = [a.GetIdx()]
        seen.add(a.GetIdx())
        for _dir in (0, 1):
            cur = run[-1] if _dir == 0 else run[0]
            while True:
                nx = [n.GetIdx() for n in m.GetAtomWithIdx(cur).GetNeighbors() if n.GetIdx() not in seen and plain(n)]
                if not nx:
                    break
                cur = nx[0]
                seen.add(cur)
                if _dir == 0:
                    run.append(cur)
                else:
                    run.insert(0, cur)
        if len(run) >= 4:
            runs.append(run)
    if not runs:
        return None
    kill = []
    for run in runs:
        m.AddBond(run[0], run[-1], Chem.BondType.SINGLE)
        kill += run[1:-1]
    for i in sorted(kill, reverse=True):
        m.RemoveAtom(i)
    try:
        Chem.SanitizeMol(m)
        s = Chem.MolToSmiles(m)
        return s if '.' not in s else None
    except Exception:
        return None


class Tool(SP.Perk):
    """A piece used on the molecule.  It is always ready; `uses` times a round."""
    chem = ''
    when = 'after'
    kind = 'tool'

    def reset(self):
        SP.Perk.reset(self)
        self.uses = TOOL_USES.get(self.name, 1)
        self.pay = TOOL_PAY.get(self.name, 1.0)

    def ready(self, R):
        return R.x.get('used_n_' + self.name, 0) < self.uses

    def fed(self, R):
        return 1

    def _apply(self, G, R, s):
        if self.pay != 1.0:              # RULE.toolPay: the steps the piece sets off count this many times
            keep = G.p['casc_mul']
            G.p['casc_mul'] = keep * self.pay
            try:
                G.tap(R, s, restart=False)
            finally:
                G.p['casc_mul'] = keep
        else:
            G.tap(R, s, restart=False)

    def _do(self, G, R, s):
        self._apply(G, R, s)
        R.x['used_n_' + self.name] = R.x.get('used_n_' + self.name, 0) + 1
        self.taps += 1 if G.real else 0

    def ok(self, G, s, R):
        return bool(s) and s != R.smi and _heavy(s) <= max(G.p['max_heavy'], _heavy(R.smi))


class Crystal(Tool):
    name = 'crystal'

    def options(self, G, R, rng):
        out = SP.products(R.smi, '[CX4;!H0;!$(C~[!#6]):1]>>[C:1]O', cap=40)
        if len(out) > SP.MAXOPT:
            out = rng.sample(out, SP.MAXOPT)
        return [s for s in out if self.ok(G, s, R)]


class Bunsen(Tool):
    name = 'bunsen'

    def options(self, G, R, rng):
        s = _exhaust(R.smi, '[C;!H0:1][C:2][OX2H1]>>[C:1]=[C:2]')
        return [s] if self.ok(G, s, R) else []


class Burette(Tool):
    name = 'burette'

    def options(self, G, R, rng):
        s = _exhaust(_exhaust(R.smi, '[CH1;!a:1]=[C;!a:2]>>[C:1](=O)[C:2]'), '[CH2;!a:1]=[C;!a:2]>>[C:1](=O)[C:2]')
        return [s] if self.ok(G, s, R) else []


class Magnet(Tool):
    name = 'magnet'

    def options(self, G, R, rng):
        s = _magnet(R.smi)
        return [s] if self.ok(G, s, R) else []


class Passive(SC.Mod):
    key, by = '', 1
    kind = 'passive'

    def setup(self, G):
        if getattr(self, 'trial', None) is None and CAROUSEL_FIRST and self.name == 'carousel':
            self.key = 'hand_first'
        G.p[self.key] = (G.p.get(self.key) or 0) + (self.by if getattr(self, 'trial', None) is not None else PASSIVE.get(self.name, self.by))

    def report(self):
        return {}


class Carousel(Passive):
    name, key = 'carousel', 'hand'


class Dropper(Passive):
    name, key = 'dropper', 'uses'


class Timer(Passive):
    name, key = 'timer', 'circles'


TOOLS = {c.name: c for c in (Crystal, Bunsen, Burette, Magnet, Carousel, Dropper, Timer)}
ORDER = ('crystal', 'bunsen', 'burette', 'magnet', 'carousel', 'dropper', 'timer')
LABEL = {'crystal': 'Seed crystal', 'bunsen': 'Burner', 'burette': 'Burette', 'magnet': 'Magnet', 'carousel': 'Carousel', 'dropper': 'Dropper', 'timer': 'Timer'}


def make(name):
    """name, or name@x for a trial: a piece's pay (the steps it sets off count x times), the dropper's uses, the timer's circles,
    or carousel@first (one more reagent in the first hand of a round only)."""
    nm, _, x = name.partition('@')
    t = TOOLS[nm]()
    if x:
        if isinstance(t, Tool):
            t.pay = float(x)
            t.reset = lambda t=t, x=float(x): (SP.Perk.reset(t), setattr(t, 'uses', TOOL_USES.get(nm, 1)), setattr(t, 'pay', x))
        elif x == 'first':
            t.key, t.by = 'hand_first', 1
        else:
            t.by = int(x)
        t.trial = x
    return t
