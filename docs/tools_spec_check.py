# Checks the JavaScript readers of the spec (path.js, SX) against Python. The headless job jobs/spec_dump.js dumps, for 300
# molecules of the game's table and 300 end-of-page molecules of played rounds, the graph and the values the JS readers gave.
# Here: (1) the graph version (tools_chem/hurdle_graph.py) on the same graph, which the JS must match exactly;
#       (2) RDKit (tools_chem/hurdles.feat) on the molecule built from the same graph, which the JS may differ from on cages
#           and on the few kinds of group RDKit perceives differently (reported).
# Usage: python tools_spec_check.py <dump json from hl.sh> [out json]
import sys, os, io, json
from collections import Counter
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, 'tools_chem'))
import hurdle_graph as HG
import hurdles as H
from rdkit import Chem
from chemlib import canon

GRAPH_KEYS = ['rings', 'ring5', 'ring6', 'ring_small', 'ring_big', 'ring_sizes', 'ring_atoms', 'fused_pairs', 'fused_block', 'ring_systems',
              'spiro', 'bridgehead', 'ring_hetero', 'ring_mixed', 'aromatic', 'atoms', 'chain', 'diameter', 'branch', 'conj']
RD_KEYS = GRAPH_KEYS + ['dbl', 'unsat', 'hetero', 'elements', 'kinds']
GROUPS = ['OH', 'C=O', 'C=C', 'COOH', 'NH2', 'SH', 'Cl', 'ester', 'ether', 'amide', 'S-S', 'C=N']

def graph_vals(g):
    el, bonds = g['el'], [tuple(b) for b in g['bonds']]
    out = HG.ring_numbers(el, bonds)
    out.update({'atoms': len(el), 'chain': HG.longest_chain(el, bonds), 'diameter': HG.diameter(el, bonds), 'branch': HG.branch_points(el, bonds), 'conj': HG.alternating_run(el, bonds)})
    return out

def rdkit_feat(g):
    rw = Chem.RWMol()
    for e, h in zip(g['el'], g['nh']):
        a = Chem.Atom(e); a.SetNoImplicit(True); a.SetNumExplicitHs(h); rw.AddAtom(a)
    bt = {1: Chem.BondType.SINGLE, 2: Chem.BondType.DOUBLE, 3: Chem.BondType.TRIPLE}
    for i, j, o in g['bonds']: rw.AddBond(i, j, bt[o])
    m = rw.GetMol(); Chem.SanitizeMol(m)
    return H.feat(canon(Chem.MolToSmiles(m)))

def main():
    d = json.load(io.open(sys.argv[1], encoding='utf8'))
    assert d['ok'], d
    res = d['result']; report = {}
    for part in ('feeds', 'ends'):
        items = res[part]; gb, gbad, rb, rbad, ex = Counter(), Counter(), Counter(), Counter(), {}
        for it in items:
            js = it['vals']; gv = graph_vals(it['graph']); rd = rdkit_feat(it['graph'])
            for k in GRAPH_KEYS:
                if js[k] == gv[k]: gb[k] += 1
                else: gbad[k] += 1; ex.setdefault('graph:' + k, (it['src'], js[k], gv[k]))
            for k in RD_KEYS:
                if js[k] == rd[k]: rb[k] += 1
                else: rbad[k] += 1; ex.setdefault('rdkit:' + k, (it['src'], js[k], rd[k]))
            for gname in GROUPS:
                if js['g:' + gname] == rd['groups'][gname]: rb['g:' + gname] += 1
                else: rbad['g:' + gname] += 1; ex.setdefault('rdkit:g:' + gname, (it['src'], js['g:' + gname], rd['groups'][gname]))
        n = len(items)
        print('%s: %d molecules' % (part, n))
        print('  JS against the graph version (must be 0 mismatches): %d mismatches' % sum(gbad.values()), dict(gbad))
        print('  JS against RDKit: mismatches by reader', {k: v for k, v in rbad.items()})
        for k, v in sorted(ex.items()): print('    example', k, v)
        report[part] = {'n': n, 'graph_mismatch': dict(gbad), 'rdkit_mismatch': dict(rbad)}
    if len(sys.argv) > 2: json.dump(report, io.open(sys.argv[2], 'w'))

if __name__ == '__main__': main()
