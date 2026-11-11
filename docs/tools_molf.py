# Molecule size factors from the per-molecule measure. Usage: python molf.py <first file> <out molf.json>
import json, io, os, sys, math
F = 'C:/Users/mgmcc/AppData/Local/Temp/claude/c2e091f86aaa20cc/4b5d48b3-c4d4-47b4-ad30-ef7d19555645/scratchpad/frames/'
base = int(sys.argv[1]); mols = {}
for n in range(base, base + 30):
    p = F + 'f%05d.jpg' % n
    if os.path.exists(p):
        d = json.load(io.open(p, encoding='utf8')); mols.update(d['mols'])
med = {k: sorted(v)[len(v) // 2] for k, v in mols.items()}
gm = math.exp(sum(math.log(max(1, v)) for v in med.values()) / len(med))
f = {k: med[k] / gm for k in med}
print(len(f), 'molecules, average (of logarithms) of the medians', int(gm))
for k in sorted(f, key=f.get):
    v = sorted(mols[k]); print('%-28s median %9d  lowest %8d highest %10d  factor %6.3f  held %5.2f  root %4.2f' % (k, med[k], v[0], v[-1], f[k], min(3, max(0.35, f[k])), math.sqrt(min(3, max(0.35, f[k])))))
print('spread of the factor', round(max(f.values()) / min(f.values()), 1), ' outside 0.35 to 3:', sum(1 for v in f.values() if v < 0.35 or v > 3))
json.dump(f, io.open(sys.argv[2], 'w', encoding='utf8'))
