# The JavaScript fold (rules.js ENG.foldOf, acrossPairs) against docs/tools_chem/fold.py on the same molecules. Ties go to the lower atom index in both
# (fold.py's canonical ranks are replaced by the index). Usage: python tools_foldpar.py make [n]   then run jobs/foldpar.js   then   python tools_foldpar.py compare <json>
import sys, os, io, json, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, 'tools_chem'))
from rdkit import Chem, RDLogger
RDLogger.DisableLog('rdApp.*')
import fold as F
F._ranks = lambda mol: list(range(mol.GetNumAtoms()))
IN = os.path.join(HERE, '..', '.claude', 'headless', 'fold_in.json')
def make(n=300):
    pin = json.load(io.open(os.path.join(HERE, '..', '.claude', 'headless', 'parity_in.json'), encoding='utf8'))
    seen, rows = set(), []
    for k in ('reagent', 'settle', 'turn', 'reflex'):
        for c in pin[k]:
            for key in ('before', 'after', 'after1'):
                s = c.get(key)
                if not s or s in seen: continue
                m = Chem.MolFromSmiles(s)
                if m is None or m.GetNumHeavyAtoms() < 9 or m.GetNumHeavyAtoms() > 44 or any(a.GetIsAromatic() for a in m.GetAtoms()): continue
                seen.add(s)
                Chem.Kekulize(m, clearAromaticFlags=True)
                rows.append({'smi': s, 'kek': Chem.MolToSmiles(m, kekuleSmiles=True)})
    random.Random(3).shuffle(rows); rows = rows[:n]
    io.open(IN, 'w', encoding='utf8').write(json.dumps(rows)); print(len(rows))
def compare(path):
    rows = json.load(io.open(IN, encoding='utf8')); res = json.load(io.open(path, encoding='utf8')); res = res.get('result', res)
    bad = {'anchor': 0, 'path': 0, 'pos': 0, 'across': 0, 'err': 0}; ex = {}
    for r, g in zip(rows, res):
        if 'err' in g: bad['err'] += 1; ex.setdefault('err', (r['kek'], g['err'])); continue
        rw = Chem.RWMol()
        for e, h in zip(g['el'], g['nh']):
            a = Chem.Atom(e); a.SetNoImplicit(True); a.SetNumExplicitHs(h); rw.AddAtom(a)
        for a, b, o in g['bonds']:
            rw.AddBond(a, b, {1: Chem.BondType.SINGLE, 2: Chem.BondType.DOUBLE, 3: Chem.BondType.TRIPLE}[o])
        m = rw.GetMol(); Chem.SanitizeMol(m)
        try:
            f = F.fold(m); acc = sorted((a, b, d) for a, b, d in F.neighbors_across(m, f=F._info(m, 8, 'W')))
        except Exception as e:
            bad['err'] += 1; ex.setdefault('err', (r['kek'], str(e))); continue
        pos = sorted((a, p[0], p[1]) for a, p in f.pos.items())
        if f.anchor != g['anchor']: bad['anchor'] += 1; ex.setdefault('anchor', (r['kek'], f.anchor, g['anchor']))
        if list(f.path) != g['path']: bad['path'] += 1; ex.setdefault('path', (r['kek'], list(f.path), g['path']))
        if [list(x) for x in pos] != g['pos']: bad['pos'] += 1; ex.setdefault('pos', (r['kek'],))
        if [list(x) for x in acc] != g['across']: bad['across'] += 1; ex.setdefault('across', (r['kek'], acc[:6], g['across'][:6]))
    print('molecules', len(rows), 'mismatches', bad)
    for k, v in ex.items(): print(k, v)
def build(g):
    rw = Chem.RWMol()
    for e in g['el']:
        rw.AddAtom(Chem.Atom(e))
    for a, b, o in g['bonds']:
        rw.AddBond(a, b, {1: Chem.BondType.SINGLE, 2: Chem.BondType.DOUBLE, 3: Chem.BondType.TRIPLE}[o])
    m = rw.GetMol(); Chem.SanitizeMol(m); return m
def across(path):
    """The across reflexes: the game's first place against fold.py's rules on the same graph (ties: any place of fold.py's that gives the game's answer)."""
    res = json.load(io.open(path, encoding='utf8')); res = res.get('result', res)
    NAME = {'ring_far': 'ring_far', 'cap_far': 'cap_far', 'knit_far': 'knit_far', 'weld_far': 'weld_far', 'seal_far': 'seal_far', 'close_far': 'close_far',
            'open_far': 'open_far', 'tuck_far': 'tuck_far', 'snap_far': 'snap_far', 'bridge': 'bridge', 'stitch': 'stitch', 'link': 'link'}
    from collections import Counter, defaultdict
    tot, agree, tie, bad, err = Counter(), Counter(), Counter(), Counter(), Counter(); ex = {}
    def canon(s):
        mm = Chem.MolFromSmiles(s); return Chem.MolToSmiles(mm) if mm is not None else None
    for r in res:
        k = r['kind']; tot[k] += 1
        if 'err' in r: err[k] += 1; ex.setdefault(('err', k), r['err']); continue
        m = build(r['graph']); rule = F.FAR_RULES[NAME[k]]
        try:
            sites = rule.find(m)
        except Exception as e:
            err[k] += 1; ex.setdefault(('perr', k), str(e)); continue
        if not sites: bad[k] += 1; ex.setdefault(('nosite', k), r['graph']['el'][:10]); continue
        want = canon(r['after']); got = []
        for s in sites:
            a = rule.apply(m, s)
            got.append(F.strip(Chem.MolToSmiles(a[0])) if a else None)
        if got[0] == want: agree[k] += 1
        elif want in got: tie[k] += 1
        else: bad[k] += 1; ex.setdefault(('diff', k), (Chem.MolToSmiles(m), want, got[:2]))
    print('kind: cases agree tie wrong error')
    for k in NAME: print(k, tot[k], agree[k], tie[k], bad[k], err[k])
    for k, v in ex.items(): print(k, str(v)[:300])
if __name__ == '__main__':
    if sys.argv[1] == 'across': across(sys.argv[2]); sys.exit(0)
    if sys.argv[1] == 'make': make(int(sys.argv[2]) if len(sys.argv) > 2 else 300)
    else: compare(sys.argv[2])
