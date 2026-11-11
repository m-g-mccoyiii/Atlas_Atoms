# Headless measures (docs/HEADLESS.md): gathers the results of .claude/headless/hlmany.sh into the files the other
# tools read (tools_rig.load: one JSON file per block, { tag, rows }), and compares two measures seed by seed.
# Usage: python tools_hl.py gather <tag> <base file number>
#        python tools_hl.py same <tag a> <tag b>          share of runs whose rounds are the same in both
import sys, os, io, json, glob
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '.claude', 'headless', 'out')
sys.path.insert(0, HERE)
import tools_rig as rig

def gather(tag, base):
    n = 0; rows = 0; bad = []
    for p in sorted(glob.glob(os.path.join(OUT, tag + '_*.json'))):
        if p.endswith('.hb.json'): continue
        d = json.load(io.open(p, encoding='utf8'))
        if not d.get('ok'): bad.append((os.path.basename(p), d.get('error'))); continue
        r = d['result']
        io.open(rig.F + 'f%05d.jpg' % (base + n), 'w', encoding='utf8').write(json.dumps({'tag': tag, 'rows': r['rows']}))
        n += 1; rows += len(r['rows'])
    print('gathered', tag, 'files', n, 'rows', rows, 'from', base, 'to', base + n - 1, 'failed', bad)

def all_rows(tag):
    rows = []; seen = set()
    for fn in os.listdir(rig.F):
        p = rig.F + fn
        try:
            with io.open(p, 'rb') as f:
                if f.read(1) != b'{': continue
            d = json.load(io.open(p, encoding='utf8'))
        except Exception: continue
        if d.get('tag') != tag: continue
        for r in d['rows']:
            if 'error' in r: continue
            k = (r['player'], r['seed'], r['round'])
            if k not in seen: seen.add(k); rows.append(r)
    return rows

def sig(rows):
    d = {}
    for r in rows: d.setdefault((r['player'], r['seed']), {})[r['round']] = (r.get('mol'), r.get('number'), r.get('total'))
    return d

def same(a, b):
    A, B = sig(all_rows(a)), sig(all_rows(b)); by = {}
    for k in A:
        if k not in B: continue
        v = by.setdefault(k[0], [0, 0, 0, 0]); v[0] += 1
        if A[k] == B[k]: v[1] += 1
        elif all(A[k][r][0] == B[k][r][0] for r in A[k] if r in B[k]): v[2] += 1   # same molecules, other totals
        else: v[3] += 1
    for pl, v in sorted(by.items()): print(' %-8s runs in both %4d  the same %4d (%.1f%%)  same molecules, other totals %d  other molecules %d' % (pl, v[0], v[1], 100.0 * v[1] / max(1, v[0]), v[2], v[3]))

if __name__ == '__main__':
    if sys.argv[1] == 'gather': gather(sys.argv[2], int(sys.argv[3]))
    elif sys.argv[1] == 'same': same(sys.argv[2], sys.argv[3])
