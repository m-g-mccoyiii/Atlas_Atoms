# Writes the molecules of docs/tools_chem/molecules2.py into path.js (between "// MOLECULES V2 BEGIN" and "// MOLECULES V2 END"):
# the pool (24 a round, rounds 1 to 9) and the bank (generated, 40 a round) as [round, family, Kekule SMILES]. Replaces the old FEED table unless AA.rxFeedOld is set.
import io, os, re, json
HERE = os.path.dirname(os.path.abspath(__file__))
def rows(fn):
    t = io.open(os.path.join(HERE, 'tools_chem', fn), encoding='utf8').read()
    return [[int(a), b, c] for a, b, c in re.findall(r"\[(\d), '(\w+)', '([^']+)'\]", t)]
pool, bank = rows('molecules2_feed.js'), rows('molecules2_bank.js')
txt = 'const FEED2 = ' + json.dumps({'pool': pool, 'bank': bank}, separators=(',', ':')) + ';'
f = os.path.join(HERE, '..', 'apps', 'steam', 'js', 'react', 'path.js')
s = io.open(f, encoding='utf8', newline='').read(); nl = '\r\n' if '\r\n' in s else '\n'
head = '// MOLECULES V2 BEGIN (written by docs/tools_mol2_bake.py from docs/tools_chem/molecules2_feed.js and molecules2_bank.js; replace it wholesale)' + nl
if '// MOLECULES V2 BEGIN' in s:
    a = s.index('// MOLECULES V2 BEGIN'); b = s.index('// MOLECULES V2 END')
    s = s[:a] + head + txt + nl + s[b:]
else:
    a = s.index('// INTERIM MOLECULES'); b = s.index('const FEEDS = FEED.map')
    s = s[:a] + head + txt + nl + '// MOLECULES V2 END' + nl + s[b:]
io.open(f, 'w', encoding='utf8', newline='').write(s)
print('pool', len(pool), 'bank', len(bank), 'rounds', sorted(set(r[0] for r in pool)))
