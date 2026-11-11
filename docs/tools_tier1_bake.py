# Bakes the numbers of tier one (rounds one to three) into path.js and leaves everything else as it is.
# Usage: python tools_tier1_bake.py <factors.json or -> <par.json or -> [note]
#   factors.json from tools_factors.py on a tier-one measure of the median player choosing at random: the molecule
#     factors of the molecules it saw replace the old ones, moved as a whole so that their geometric mean over the old
#     ones is 1 (rounds four on, which share some of these molecules, keep their scale); the first act of ASSAYF is
#     replaced; KINDF and the other acts are kept.
#   par.json from tools_tier1.py: {"rounds123": [three numbers]}: the first three of PAR.rounds are replaced.
import io, json, sys, re, math, subprocess, datetime
R = 'C:/Work/atlas-atoms/'
f = R + 'apps/steam/js/react/path.js'; s = io.open(f, encoding='utf8', newline='').read()
def get(name): return re.search(r'^const %s = (.*);$' % name, s, re.M)
def put(name, text):
    global s
    m = get(name); s = s[:m.start(1)] + text + s[m.end(1):]
note = sys.argv[3] if len(sys.argv) > 3 else ''
if sys.argv[1] != '-':
    fa = json.load(io.open(sys.argv[1], encoding='utf8')); molf = json.loads(get('MOLF').group(1)); assayf = json.loads(get('ASSAYF').group(1))
    seen = [k for k in fa['molf'] if k in molf]; sh = math.exp(sum(math.log(fa['molf'][k] / molf[k]) for k in seen) / max(1, len(seen)))
    for k, v in fa['molf'].items(): molf[k] = round(v / sh, 3)
    for k, v in fa['assayf'].items(): assayf[k][0] = round(v[0], 3)
    put('MOLF', json.dumps(molf, separators=(',', ':'))); put('ASSAYF', json.dumps(assayf, separators=(',', ':')))
    print('molecule factors replaced:', len(fa['molf']), 'moved by %.3f' % sh, 'assay act one:', {k: v[0] for k, v in assayf.items()})
if sys.argv[2] != '-':
    p = json.load(io.open(sys.argv[2]))['rounds123']; m = get('PAR'); txt = m.group(1); mm = re.search(r'rounds: \[([^\]]*)\]', txt); old = [x.strip() for x in mm.group(1).split(',')]
    new = [str(int(round(x))) for x in p] + old[3:]; put('PAR', txt[:mm.start(1)] + ', '.join(new) + txt[mm.end(1):]); print('Par', new)
commit = subprocess.check_output(['git', '-C', R, 'rev-parse', '--short', 'HEAD']).decode().strip()
tagline = "// Tier one (rounds one to three) baked again on %s after commit %s (docs/tools_tier1_bake.py). %s\n" % (datetime.date.today().isoformat(), commit, note)
i = s.index('// END GENERATED'); s = re.sub(r'// Tier one \(rounds one to three\) baked again[^\n]*\n', '', s); i = s.index('// END GENERATED'); s = s[:i] + tagline + s[i:]
io.open(f, 'w', encoding='utf8', newline='').write(s)
for h in ['apps/steam/scheme.html', '.claude/rec.html']:
    t = io.open(R + h, encoding='utf8', newline='').read(); m = re.search(r'js/react/path\.js\?v=(\d+)', t); t = t.replace(m.group(0), 'js/react/path.js?v=%d' % (int(m.group(1)) + 1)); io.open(R + h, 'w', encoding='utf8', newline='').write(t)
print('baked, path.js v', int(m.group(1)) + 1)
