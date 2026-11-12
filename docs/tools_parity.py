# The game against the chemistry engine (docs/tools_chem), case by case.
#   python docs/tools_parity.py make [seed] [out]     dump the cases from the engine (RDKit): reagents, reflexes, whole turns
#   python docs/tools_parity.py compare <game json> [report json]   compare what the game's own rules did (headless job
#                                                                  jobs/parity.js writes the game json) with the engine
# A case is the SMILES before, what was fired, the canonical SMILES after and the runoff. The game side sends back its own SMILES
# (Kekule, its own atom order); both sides are read into RDKit and compared as canonical SMILES. A mismatch is classified:
#   tie       the engine's answer changes when its choice among equal places is made the other way (so the case does not say what the
#             game must do): the game's answer is one of the engine's two
#   other     everything else (a mismatch to fix)
import sys, os, io, json, random
from collections import Counter
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, 'tools_chem'))
from rdkit import Chem, RDLogger
RDLogger.DisableLog('rdApp.*')
import chemlib
import library as L
import engine as EN
from molecules import game_molecules

ALL_REAG = list(L.REACTIONS)
ALL_SELF = tuple(L.SELF_ORDER)
ENGINE = EN.Engine()


def can(smi):
    m = Chem.MolFromSmiles(smi)
    return Chem.MolToSmiles(m) if m is not None else None


def kek(smi):
    m = Chem.MolFromSmiles(smi)
    Chem.Kekulize(m, clearAromaticFlags=True)
    return Chem.MolToSmiles(m, kekuleSmiles=True)


def aromatic(smi):
    m = Chem.MolFromSmiles(smi)
    return any(a.GetIsAromatic() for a in m.GetAtoms())


def cnt(d):
    return {k: v for k, v in sorted(dict(d).items())}


def make(seed=1, out=None):
    rng = random.Random(seed)
    gm = game_molecules()
    starts = []
    for x in gm:
        c = can(getattr(x, 'smiles', None) or getattr(x, 'smi', None) or str(x))
        if c and not aromatic(c):
            starts.append(c)
    starts = sorted(set(starts))
    # a pool of molecules: the game's, and what random reagents (no reflexes) and reflexes make of them
    pool = list(starts)
    seen = set(pool)
    names = ALL_REAG
    for it in range(4000):
        smi = rng.choice(pool)
        for _ in range(rng.choice([1, 1, 2, 3])):
            r = rng.choice(names)
            f = ENGINE.fire(smi, r)
            if not f.acted:
                continue
            smi = f.smi
            if rng.random() < 0.4:
                s2, st, off, capped = ENGINE.settle(smi, ALL_SELF, 40, ())
                smi = s2
        if smi and smi not in seen and not aromatic(smi) and Chem.MolFromSmiles(smi).GetNumHeavyAtoms() <= 40:
            seen.add(smi)
            pool.append(smi)
        if len(pool) > 2500:
            break
    cases = {'reagent': [], 'reflex': [], 'settle': [], 'turn': []}
    # --- reagents: every reagent on molecules it fits
    per = {r: [] for r in ALL_REAG}
    order = pool[:]
    rng.shuffle(order)
    for smi in order:
        for r in ALL_REAG:
            if len(per[r]) >= 30:
                continue
            f = ENGINE.fire(smi, r)
            if f.acted and not f.blocked and not aromatic(f.smi):
                per[r].append({'reagent': r, 'before': smi, 'after': f.smi, 'n': f.n, 'off': cnt(dict(f.off))})
    for r in ALL_REAG:
        cases['reagent'] += per[r]
    # --- reflexes: the first one to fire, one step, from molecules reagents left unsettled
    byr = {r: [] for r in ALL_SELF}
    for smi in order:
        mol = chemlib.parse(smi)
        nx = ENGINE._next_self(mol, ALL_SELF)
        if nx is None:
            continue
        rule, (m2, dropped) = nx
        if len(byr[rule.name]) < 40:
            byr[rule.name].append({'before': smi, 'held': list(ALL_SELF), 'first': rule.name, 'after1': Chem.MolToSmiles(m2),
                                   'off': cnt(rule.off)})
    # molecules in which a given reflex is held alone: make sure each reflex is met on its own (a pool made by reagents then
    # settled never has the sites; use the unsettled products of single reagents)
    for smi in order:
        for r in ALL_REAG:
            f = ENGINE.fire(smi, r)
            if not f.acted:
                continue
            mol = chemlib.parse(f.smi)
            for sr in ALL_SELF:
                if len(byr[sr]) >= 40:
                    continue
                nx = ENGINE._next_self(mol, (sr,))
                if nx is None:
                    continue
                rule, (m2, dropped) = nx
                byr[sr].append({'before': f.smi, 'held': [sr], 'first': sr, 'after1': Chem.MolToSmiles(m2), 'off': cnt(rule.off)})
        if all(len(byr[k]) >= 40 for k in byr):
            break
    # flip is rare (an enol): walk reagents then the reflexes step by step and keep the state before a flip
    for smi in order:
        if len(byr['flip']) >= 40:
            break
        for r1 in ('dihydroxylation', 'hwe'):
            f = ENGINE.fire(smi, r1)
            if not f.acted:
                continue
            cur = f.smi
            for _ in range(6):
                mol = chemlib.parse(cur)
                nx = ENGINE._next_self(mol, ALL_SELF)
                if nx is None:
                    break
                rule, (m2, dropped) = nx
                if rule.name == 'flip' and len(byr['flip']) < 40:
                    byr['flip'].append({'before': cur, 'held': list(ALL_SELF), 'first': 'flip', 'after1': Chem.MolToSmiles(m2), 'off': cnt(rule.off)})
                cur = Chem.MolToSmiles(m2)
    for r in ALL_SELF:
        cases['reflex'] += byr[r]
    # --- settle to the end: with the two reflexes a new game holds, with a middle set and with all, from unsettled molecules
    held_sets = [('ring', 'dry'), ('ring', 'dry', 'weld', 'shift', 'tuck', 'open', 'fold'), ALL_SELF]
    n = 0
    for smi in order:
        for r in rng.sample(ALL_REAG, 3):
            f = ENGINE.fire(smi, r)
            if not f.acted or aromatic(f.smi):
                continue
            hs = rng.choice(held_sets)
            rules = tuple(x for x in L.SELF_ORDER if x in hs)
            s2, st, off, capped = ENGINE.settle(f.smi, rules, 40, ())
            if not st or aromatic(s2):
                continue
            reo = ENGINE.reopen(s2)[0]
            cases['settle'].append({'before': f.smi, 'held': list(rules), 'steps': list(st), 'after': s2, 'reopened': reo,
                                    'off': cnt(off), 'capped': bool(capped)})
            n += 1
        if n >= 300:
            break
    # --- whole turns: three reagents, the reflexes after each (per-turn limits across the line)
    n = 0
    for smi in order:
        line = tuple(rng.choice(ALL_REAG) for _ in range(3))
        c = Counter(line)
        if any(v > 3 for v in c.values()):
            continue
        t = ENGINE.run_line(smi, line, ALL_SELF)
        if aromatic(t.smi) or not any(p for _, p in t.fired):
            continue
        reo = ENGINE.reopen(t.smi)[0]
        cases['turn'].append({'before': smi, 'line': list(line), 'held': list(ALL_SELF), 'steps': list(t.steps), 'fired': [[a, b] for a, b in t.fired],
                              'after': t.smi, 'reopened': reo, 'off': cnt(dict(t.off)), 'capped': bool(t.capped)})
        n += 1
        if n >= 150:
            break
    for k in cases:
        for c in cases[k]:
            c['kek'] = kek(c['before'])
    out = out or os.path.join(HERE, '..', '.claude', 'headless', 'parity_in.json')
    io.open(out, 'w', encoding='utf8').write(json.dumps(cases))
    print({k: len(v) for k, v in cases.items()}, 'pool', len(pool), '->', out)
    print('reagents per:', {r: len(per[r]) for r in ALL_REAG})
    print('reflexes per:', {r: len(byr[r]) for r in ALL_SELF})


# ---------------------------------------------------------------------------------------------------------------------------
def rand_smiles(smi, rng):
    m = Chem.MolFromSmiles(smi)
    return Chem.MolToSmiles(m, doRandom=True, canonical=False)


_ONE = chemlib.SmartsStep._one


def _one_alt(self, mol):
    """SmartsStep._one with the last tie-break reversed: among places with equal keys the largest product SMILES goes first
    (the engine takes the smallest), and among places with no choose function the last match goes first."""
    if not mol.HasSubstructMatch(self.query):
        return None
    if self.choose is None:
        prods = self.rxn.RunReactants((mol,), maxProducts=400)
        for p in reversed(prods):
            r = self._finish(p)
            if r:
                return r
        return None
    best = None
    for p in self.rxn.RunReactants((mol,), maxProducts=400):
        key = tuple(self.choose(mol, chemlib.Cand(mol, p)))
        if best is not None and key > best[0]:
            continue
        r = self._finish(p)
        if not r:
            continue
        sm = Chem.MolToSmiles(r[0])
        if best is None or key < best[0] or (key == best[0] and sm > best[1]):
            best = (key, sm, r)
    return best[2] if best else None


def step_alternatives(step, mol):
    """Every product an engine step could have made if its choice among equal places had gone another way."""
    if not step.has_site(mol):
        return []
    prods = step.rxn.RunReactants((mol,), maxProducts=600)
    if step.choose is not None:
        keyed = []
        for p in prods:
            keyed.append((tuple(step.choose(mol, chemlib.Cand(mol, p))), p))
        if not keyed:
            return []
        mn = min(k for k, _ in keyed)
        prods = [p for k, p in keyed if k == mn]
    out = {}
    for p in prods:
        r = step._finish(p)
        if r:
            out[Chem.MolToSmiles(r[0])] = r
    return list(out.values())


def fire_all(smi, rname, cap=300):
    """The set of canonical molecules the reagent can leave when ties are broken every possible way."""
    states = {can(smi): (chemlib.parse(smi), 0)}
    res = set()
    for st in L.REACTIONS[rname].steps:
        nxt = {}
        todo = list(states.items())
        seen = set()
        while todo and len(seen) < cap:
            sm, (mol, n) = todo.pop()
            if sm in seen:
                continue
            seen.add(sm)
            alts = step_alternatives(st, mol)
            if not alts:
                nxt[sm] = (mol, n)
                continue
            for r in alts:
                m2 = r[0]
                todo.append((Chem.MolToSmiles(m2), (m2, n + 1)))
        states = nxt
    return {sm for sm in states}


def next_alternatives(smi, rules, cnt):
    """Every (rule name, product smiles) the molecule could take as its next reflex step when equal places are taken in every order."""
    mol = chemlib.parse(smi)
    act = tuple(r for r in rules if getattr(ENGINE.self_rules[r], 'per_turn', None) is None or cnt.get(r, 0) < ENGINE.self_rules[r].per_turn)
    cands = []
    for ri, rn in enumerate(act):
        rule = ENGINE.self_rules[rn]
        sites = rule.find(mol)
        if sites:
            cands.append(((getattr(rule, 'prio', 1), sites[0].dist, ri), rule, sites))
    cands.sort(key=lambda t: t[0])
    for _, rule, sites in cands:
        outs = {}
        if isinstance(rule, chemlib.SmartsSelfRule):
            for r in step_alternatives(rule.step, mol):
                outs[Chem.MolToSmiles(r[0])] = (rule.name, r[0])
        else:
            def tk(x):
                d = x.data or {}
                return tuple(d['sort'][:2]) if d.get('sort') else x.dist
            first = tk(sites[0])
            for x in sites:
                if tk(x) != first:
                    continue
                r = rule.apply(mol, x)
                if r is not None:
                    outs[Chem.MolToSmiles(r[0])] = (rule.name, r[0])
        if outs:
            return list(outs.values())
    return []


def settle_all(start, rules, budget, cnt0=None, steps0=(), cap=4000):
    """Every (final canonical smiles, steps) the settle can end with when equal places are taken in every order."""
    res = set()
    todo = [(start, tuple(sorted((cnt0 or {}).items())), tuple(steps0))]
    seen = set()
    n = 0
    while todo:
        smi, cn, steps = todo.pop()
        if (smi, cn, steps) in seen:
            continue
        seen.add((smi, cn, steps))
        n += 1
        if n > cap:
            return None
        if len(steps) >= budget:
            res.add((smi, steps))
            continue
        alts = next_alternatives(smi, rules, dict(cn))
        if not alts:
            res.add((smi, steps))
            continue
        for rn, m2 in alts:
            c2 = dict(cn)
            c2[rn] = c2.get(rn, 0) + 1
            todo.append((Chem.MolToSmiles(m2), tuple(sorted(c2.items())), steps + (rn,)))
    return res


def turn_all(smi, line, rules, cap=4000):
    states = {(can(smi), (), ())}
    for r in line:
        nxt = set()
        for sm, cn, steps in states:
            alts = fire_all(sm, r)
            for a in alts:
                if a == sm:
                    nxt.add((sm, cn, steps))
                    continue
                out = settle_all(a, rules, 40, dict(cn), steps, cap)
                if out is None:
                    return None
                for s2, st2 in out:
                    c2 = {}
                    for x in st2:
                        c2[x] = c2.get(x, 0) + 1
                    nxt.add((s2, tuple(sorted(c2.items())), st2))
        states = nxt
        if len(states) > 3000:
            return None
    return {(s2, st) for s2, cn, st in states}


def alt_outcomes(kind, c, k=12, seed=7):
    outs = set()
    for flip in (False, True):
        chemlib.SmartsStep._one = _one_alt if flip else _ONE
        ENGINE.clear()
        try:
            outs |= alt_outcomes1(kind, c, k, seed)
        finally:
            chemlib.SmartsStep._one = _ONE
            ENGINE.clear()
    return outs


def alt_outcomes1(kind, c, k=12, seed=7):
    """What the engine says when the atoms of the molecule come in other orders (its choice among equal places depends on the order
    the molecule is read in): the set of canonical answers."""
    rng = random.Random(seed)
    outs = set()
    for _ in range(k):
        rs = rand_smiles(c['before'], rng)
        try:
            if kind == 'reagent':
                f = ENGINE.fire(rs, c['reagent'])
                outs.add((can(f.smi), tuple(sorted((a, b) for a, b in f.off if a != 'piece'))))
            elif kind == 'reflex':
                nx = ENGINE._next_self(chemlib.parse(rs), tuple(c['held']))
                outs.add((nx[0].name, Chem.MolToSmiles(nx[1][0])) if nx else None)
            elif kind == 'settle':
                s2, st, off, cap = ENGINE.settle(rs, tuple(c['held']), 40, ())
                outs.add((can(s2), tuple(st)))
            else:
                t = ENGINE.run_line(rs, tuple(c['line']), tuple(c['held']))
                outs.add((can(t.smi), tuple(t.steps)))
        except Exception as e:
            outs.add(('err', str(e)[:30]))
    return outs


def game_key(kind, c, g):
    if kind == 'reagent':
        return (can(g['after']), None)
    if kind == 'reflex':
        return (g.get('first'), can(g['after']))
    return (can(g['after']), tuple(g.get('steps') or ()))


def norm_off(d):
    return {k.replace(' ', '_'): v for k, v in d.items() if k != 'piece'}


def compare(gamef, rep=None):
    cases = json.load(io.open(os.path.join(HERE, '..', '.claude', 'headless', 'parity_in.json'), encoding='utf8'))
    res = json.load(io.open(gamef, encoding='utf8'))
    res = res.get('result', res)
    rows = []
    summ = {}
    for kind in ('reagent', 'reflex', 'settle', 'turn'):
        if kind not in res:
            continue
        for i, c in enumerate(cases[kind]):
            g = (res.get(kind) or [])[i] if i < len(res.get(kind) or []) else None
            if g is None:
                rows.append((kind, i, c, None, 'missing'))
                continue
            ok = True
            why = []
            exp = {'reagent': 'after', 'reflex': 'after1', 'settle': 'after', 'turn': 'after'}[kind]
            gs = can(g['after']) if g.get('after') else None
            es = can(c[exp])
            if gs != es:
                ok = False
                why.append('structure')
            if kind in ('settle', 'turn') and g.get('steps') != c['steps']:
                ok = False
                why.append('steps')
            if kind == 'reflex' and g.get('first') != c['first']:
                ok = False
                why.append('first')
            if kind in ('reagent', 'settle', 'turn'):
                if cnt(g.get('off', {})) != cnt(norm_off(c['off'])):
                    ok = False
                    why.append('off')
            if kind == 'reagent' and g.get('n') != c['n']:
                why.append('n')
            summ.setdefault(kind, Counter())
            summ[kind]['cases'] += 1
            if ok:
                summ[kind]['agree'] += 1
            else:
                summ[kind]['differ'] += 1
                for w in why:
                    summ[kind][w] += 1
                rows.append((kind, i, c, g, ','.join(why)))
    # classify: a tie when the engine's own answer depends on the order the molecule is read in and the game's answer is one of them
    for r in rows:
        kind, i, c, g, why = r
        r_cls = 'real'
        if g and 'err' not in g:
            outs = alt_outcomes(kind, c)
            gk = game_key(kind, c, g)
            if kind == 'reagent':
                try:
                    allset = fire_all(c['before'], c['reagent'])
                except Exception:
                    allset = set()
                if gk[0] in allset and len(allset) > 1:
                    outs = outs | {(x, None) for x in allset}
            if kind in ('settle', 'turn'):
                try:
                    if kind == 'settle':
                        al = settle_all(can(c['before']), tuple(c['held']), 40)
                    else:
                        al = turn_all(c['before'], tuple(c['line']), tuple(c['held']))
                except Exception as e:
                    al = None
                c['_unres'] = al is None
                if al:
                    if any(x[0] == gk[0] and x[1] == gk[1] for x in al):
                        outs = outs | {('x', 'y'), ('x2', 'y2')}
                        gk = ('SAME', 'SAME')
                        outs.add(('SAME', 'SAME'))
            if len(outs) > 1:
                if gk == ('SAME', 'SAME'):
                    r_cls = 'tie'
                elif kind == 'reagent' and any(o and o[0] == gk[0] for o in outs):
                    r_cls = 'tie'
                elif kind == 'reflex' and any(o and (o[0], o[1]) == (gk[0], gk[1]) for o in outs):
                    r_cls = 'tie'
                elif kind in ('settle', 'turn') and any(o[0] == gk[0] and o[1] == gk[1] for o in outs if o and o[0] != 'err'):
                    r_cls = 'tie'
                elif kind in ('settle', 'turn') and any(o[0] == gk[0] for o in outs if o and o[0] != 'err'):
                    r_cls = 'tie'
        elif g and 'err' in g:
            r_cls = 'error'
        if r_cls == 'real' and c.get('_unres'):
            r_cls = 'unresolved'
        rows[rows.index(r)] = (kind, i, c, g, why + '|' + r_cls)
    tot = Counter()
    for kind, i, c, g, why in rows:
        tot[(kind, why.split('|')[1])] += 1
    print('mismatches by kind and class:', dict(tot))
    print(json.dumps({k: dict(v) for k, v in summ.items()}, indent=1))
    by = Counter()
    for kind, i, c, g, why in rows:
        key = (kind, c.get('reagent') or c.get('first') or '', why)
        by[key] += 1
    for k, v in sorted(by.items(), key=lambda t: -t[1])[:40]:
        print(v, k)
    if rep:
        io.open(rep, 'w', encoding='utf8').write(json.dumps([{'kind': k, 'i': i, 'case': c, 'game': g, 'why': w} for k, i, c, g, w in rows]))
    return rows


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'make':
        make(int(sys.argv[2]) if len(sys.argv) > 2 else 1, sys.argv[3] if len(sys.argv) > 3 else None)
    elif cmd == 'compare':
        compare(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
