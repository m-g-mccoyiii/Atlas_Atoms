# Writes the table of specs into path.js (between "// SPEC TABLE BEGIN" and "// SPEC TABLE END").
# Reads docs/tools_chem/hurdle_table.json (or SPECS table when it lands: same shape: name -> {good_rounds, sf}) and
# docs/tools_chem/hurdles.py (family, text). The reader of each spec (key, mode, event name), the plain mark name the page
# draws and what a spec needs the run to hold are in the three dicts below: edit them when the list changes.
# Usage: python tools_spec_bake.py [table.json]
import io, json, os, sys, re
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, 'tools_chem'))
# --head: read hurdles.py and the table as committed (while the list is being revised in the working tree)
import subprocess, tempfile
args = [a for a in sys.argv[1:] if a != '--head']
if '--head' in sys.argv:
    tmp = tempfile.mkdtemp()
    for f in ('hurdles.py', 'hurdle_table.json'):
        io.open(os.path.join(tmp, f), 'wb').write(subprocess.check_output(['git', '-C', HERE, 'show', 'HEAD:docs/tools_chem/' + f]))
    sys.path.insert(0, tmp); TABLE = os.path.join(tmp, 'hurdle_table.json')
else: TABLE = os.path.join(HERE, 'tools_chem', 'hurdle_table.json')
import hurdles as H
tab = json.load(io.open(args[0] if args else TABLE, encoding='utf8'))
# name -> (reader, key, mode): 's' structure key of the molecule, 'g' group count, 'e' event reader
READ = {
 'rings': ('s', 'rings', 'gain'), 'five_rings': ('s', 'ring5', 'gain'), 'six_rings': ('s', 'ring6', 'gain'), 'fused_pairs': ('s', 'fused_pairs', 'gain'),
 'fused_block': ('s', 'fused_block', 'gain'), 'ring_systems': ('s', 'ring_systems', 'gain'), 'spiro': ('s', 'spiro', 'gain'), 'bridgehead': ('s', 'bridgehead', 'gain'),
 'ring_hetero': ('s', 'ring_hetero', 'gain'), 'ring_atoms': ('s', 'ring_atoms', 'gain'), 'ring_sizes': ('s', 'ring_sizes', 'gain'),
 'longest_chain': ('s', 'chain', 'gain'), 'diameter': ('s', 'diameter', 'gain'), 'branch': ('s', 'branch', 'gain'), 'growth': ('s', 'atoms', 'gain'),
 'cut_down': ('s', 'atoms', 'loss'), 'size_range': ('s', 'atoms', 'range'), 'kinds_at_once': ('s', 'kinds', 'abs'), 'left_CO': ('g', 'C=O', 'last'),
 'conjugated': ('s', 'conj', 'gain'), 'double_bonds': ('s', 'dbl', 'gain'), 'unsaturation': ('s', 'unsat', 'gain'), 'hetero_atoms': ('s', 'hetero', 'gain'),
 'elements': ('s', 'elements', 'gain'), 'opener': ('e', 'opener', ''), 'closer': ('e', 'closer', ''), 'kinds_in_turn': ('e', 'kinds_in_turn', ''),
 'all_three_feed': ('e', 'all_three_feed', ''), 'no_dead_reaction': ('e', 'no_dead', ''), 'distinct_triggers': ('e', 'distinct_triggers', ''),
 'kind_ring': ('e', 'kind:lactol', ''), 'kind_snap': ('e', 'kind:snap6', ''), 'off_total': ('e', 'off:all', ''), 'off_water': ('e', 'off:water', ''),
 'off_hydrogen': ('e', 'off:hydrogen', ''), 'off_carbon_dioxide': ('e', 'off:carbon_dioxide', ''), 'many_jars': ('e', 'jars', ''), 'big_puff': ('e', 'puff', ''),
 'acted_total': ('e', 'acted', ''), 'distinct_acted': ('e', 'acted_kinds', ''),
}
# the page's marks that exist today are used where one fits; every other spec keeps the name hurdles.py gave it (docs/SPEC_NOTES.md)
MARK = {'rings': 'ring', 'fused_pairs': 'joined', 'fused_block': 'joined', 'bridgehead': 'cage', 'growth': 'big', 'size_range': 'size',
        'kinds_at_once': 'kinds', 'off_water': 'water', 'longest_chain': 'chain'}
# what the run must hold: reagent ids or reflex ids (any of), 'mode:co2' (carbon dioxide is on), 'never' (nothing in the game feeds it yet)
NEED = {'off_hydrogen': ['pcc'], 'off_carbon_dioxide': ['mode:co2'], 'elements': ['never'], 'kind_ring': ['lactol'], 'kind_snap': ['snap6'],
        'kinds_in_turn': ['selfs:2'], 'all_three_feed': None}
out = {}
for name, row in tab.items():
    if not row.get('good_rounds'): continue
    base = name[7:] if name.startswith('by_two_') else name
    if base not in READ: print('no reader for', name); continue
    h = H.HURDLES[name]; r = READ[base]
    out[name] = {'fam': h.family, 'text': h.text, 'read': r[0], 'key': r[1], 'mode': r[2], 'by': 2 if name != base else 0,
                 'mark': MARK.get(base, h.mark), 'need': NEED.get(base), 'good': row['good_rounds'],
                 'sf': {k: [round(x, 3) for x in v] for k, v in row['sf'].items()}}
txt = 'const SPEC_TABLE = ' + json.dumps(out, separators=(',', ':')) + ';'
f = os.path.join(HERE, '..', 'apps', 'steam', 'js', 'react', 'path.js')
s = io.open(f, encoding='utf8', newline='').read()
a = s.index('// SPEC TABLE BEGIN'); b = s.index('// SPEC TABLE END')
s = s[:a] + '// SPEC TABLE BEGIN (written by docs/tools_spec_bake.py from the table of specs; replace it wholesale)\n' + txt + '\n' + s[b:]
io.open(f, 'w', encoding='utf8', newline='').write(s)
print('wrote', len(out), 'specs,', len(txt), 'bytes')
