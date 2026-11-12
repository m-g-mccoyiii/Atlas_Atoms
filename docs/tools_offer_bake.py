# Writes the table the offer reads into path.js (between "// OFFER TABLE BEGIN" and "// OFFER TABLE END") from docs/tools_chem/reagent_stats.json
# through offer_formula.py: per reagent the worth W, the worth by band (rounds 1-3, 4-6, 7-9), the reach, the held-at-start flag and the pair bonus
# with every other reagent. Run again when the statistics change; the game reads only this table.
import io, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, 'tools_chem'))
import offer_formula as O
# the game's starting six (ruling AF): thiolene and ritter replace hydroborate and reduce. The worth numbers are those measured with the old six on the engine
# (reagent_stats.json) and were NOT measured again for the new six: that needs reagent_stats.py (hours).
GAME_SIX = ('hydrate', 'dehydrate', 'oxidize', 'grow', 'thiolene', 'ritter')
out = {}
for x in O.ALL:
    i = O.IN[x]
    out[x] = {'held': bool(x in GAME_SIX), 'worth': round(i['worth'], 4), 'band': [round(i['band'][b], 4) for b in O.BANDS], 'mean': round(i['band_mean'], 4),
              'reach': round(i['reach'], 4), 'bonus': {y: round(v, 3) for y, v in i['bonus'].items()}}
txt = 'const OFFER_STATS = ' + json.dumps(out, separators=(',', ':')) + ';'
f = os.path.join(HERE, '..', 'apps', 'steam', 'js', 'react', 'path.js')
s = io.open(f, encoding='utf8', newline='').read()
nl = '\r\n' if '\r\n' in s else '\n'
if '// OFFER TABLE BEGIN' not in s:
    a = s.index('const MOTIF_START')
    s = s[:a] + '// OFFER TABLE BEGIN (written by docs/tools_offer_bake.py from docs/tools_chem/reagent_stats.json; replace it wholesale)' + nl + txt + nl + '// OFFER TABLE END' + nl + s[a:]
else:
    a = s.index('// OFFER TABLE BEGIN'); b = s.index('// OFFER TABLE END')
    s = s[:a] + '// OFFER TABLE BEGIN (written by docs/tools_offer_bake.py from docs/tools_chem/reagent_stats.json; replace it wholesale)' + nl + txt + nl + s[b:]
io.open(f, 'w', encoding='utf8', newline='').write(s)
print('wrote', len(out), 'reagents,', len(txt), 'bytes')
