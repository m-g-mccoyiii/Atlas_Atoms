# Writes the table of specs into path.js (between "// SPEC TABLE BEGIN" and "// SPEC TABLE END").
# Reads docs/tools_chem/hurdle_table.json (the revised table: specs -> rounds -> options/usable) and docs/tools_chem/hurdles.py
# (family, plan, plain condition, mark). The reader of each spec (key, mode, event name) and what a spec needs the run to hold
# are in the dicts below: edit them when the list changes.
# Usage: python tools_spec_bake.py [table.json]
# Each row: { fam, plan, text, text1, read, key, mode, by, mark, need, good, use, cap }
#   use: { round: [[N, rate], ...] } the usable N for the round with the clear rate of the model the table was fitted to
#        (the new player in rounds 1 to 3, the middling player in rounds 4 to 9)
#   cap: null, 'start' (N at most the start size, start plus N at most 56) or 'half' (N at most half the start size)
import io, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, 'tools_chem'))
import hurdles as H
args = [a for a in sys.argv[1:]]
TABLE = os.path.join(HERE, 'tools_chem', 'hurdle_table.json')
tab = json.load(io.open(args[0] if args else TABLE, encoding='utf8'))
# name -> (reader, key, mode): 's' structure key of the molecule, 'g' group count, 'e' event reader
READ = {
 'six_rings': ('s', 'ring6', 'gain'), 'fused_pairs': ('s', 'fused_pairs', 'gain'), 'ring_systems': ('s', 'ring_systems', 'gain'),
 'growth': ('s', 'atoms', 'gain'), 'branch': ('s', 'branch', 'gain'), 'longest_chain': ('s', 'chain', 'gain'),
 'cut_down': ('s', 'atoms', 'loss'), 'finish_smaller': ('s', 'atoms', 'lastloss'), 'lean_turns': ('e', 'lean', ''),
 'kinds_gain': ('s', 'kinds', 'gain'), 'hetero_atoms': ('s', 'hetero', 'gain'), 'double_bonds': ('s', 'dbl', 'gain'),
 'conjugated': ('s', 'conj', 'gain'), 'unsaturation': ('s', 'unsat', 'gain'),
 'end_CO': ('g', 'C=O', 'lastgain'), 'end_CC': ('g', 'C=C', 'lastgain'),
 'opener': ('e', 'opener', ''), 'closer': ('e', 'closer', ''), 'kind_ring': ('e', 'kind:ring', ''),
 'off_total': ('e', 'off:all', ''), 'off_hydrogen': ('e', 'off:hydrogen', ''), 'off_carbon_dioxide': ('e', 'off:carbon_dioxide', ''),
 'pure_water': ('e', 'pure_water', ''), 'pure_gas': ('e', 'pure_gas', ''), 'held_back': ('e', 'held', ''),
}
CAP = {'growth': 'start', 'cut_down': 'half', 'finish_smaller': 'half'}
# what the run must hold: reagent ids or reflex ids (any of), 'mode:co2' (carbon dioxide is on), 'never'
NEED = {'off_hydrogen': ['pcc', 'permanganate'], 'off_carbon_dioxide': ['mode:co2', 'permanganate'], 'kind_ring': ['lactol'],
        'pure_gas': ['pcc', 'socl2', 'hofmann', 'permanganate']}
out = {}
rider = tab.get('riders', {}).get('held_back', {})
for name, row in tab['specs'].items():
    if not row.get('good_rounds'): continue
    if name not in READ: print('no reader for', name); continue
    h = H.HURDLES[name]; r = READ[name]
    use = {}
    for rd, info in row['rounds'].items():
        if int(rd) not in row['good_rounds']: continue
        model = 'W' if int(rd) <= 3 else 'M'
        ops = {o['N']: o['rates'][model] for o in info['options']}
        ns = info.get('usable') or [info.get('ref')]
        use[rd] = [[n, round(ops[n], 3)] for n in ns if n in ops]
    if name == 'held_back':
        use = {rd: [[n, 0.9]] for rd, n in rider.items()}
    try: t1 = h.condition(1)
    except Exception: t1 = h.text.replace('{N}', '1')
    out[name] = {'fam': h.family, 'plan': h.plan, 'text': h.text, 'text1': t1, 'read': r[0], 'key': r[1], 'mode': r[2], 'by': 0,
                 'mark': h.mark, 'need': NEED.get(name), 'good': row['good_rounds'], 'use': use, 'cap': CAP.get(name)}
if 'held_back' not in out and rider:
    h = H.HURDLES['held_back']
    out['held_back'] = {'fam': h.family, 'plan': h.plan, 'text': h.text, 'text1': h.condition(1), 'read': 'e', 'key': 'held', 'mode': '', 'by': 0,
                        'mark': h.mark, 'need': None, 'good': [int(k) for k in rider], 'use': {k: [[n, 0.9]] for k, n in rider.items()}, 'cap': None, 'rider': True}
txt = 'const SPEC_TABLE = ' + json.dumps(out, separators=(',', ':')) + ';'
f = os.path.join(HERE, '..', 'apps', 'steam', 'js', 'react', 'path.js')
s = io.open(f, encoding='utf8', newline='').read()
a = s.index('// SPEC TABLE BEGIN'); b = s.index('// SPEC TABLE END')
s = s[:a] + '// SPEC TABLE BEGIN (written by docs/tools_spec_bake.py from the table of specs; replace it wholesale)\n' + txt + '\n' + s[b:]
io.open(f, 'w', encoding='utf8', newline='').write(s)
print('wrote', len(out), 'specs,', len(txt), 'bytes')
