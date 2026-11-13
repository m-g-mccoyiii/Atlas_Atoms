import sweep_homrep as H, itertools, statistics as st
one = {t.split('|')[0]: H.win(d) for t, d in H.load('hom1').items()}
by = {t.split('|')[0]: d for t, d in H.load('hom23').items()}
base = one['none']
rows = []
for t, d in by.items():
    hs = t.split('+'); w = H.win(d)
    exp = base
    for h in hs: exp *= one[h] / base
    rows.append((len(hs), w, exp, max(one[h] for h in hs), t, d['n']))
for k in (2, 3):
    r = sorted([x for x in rows if x[0] == k], key=lambda x: -x[1])
    ws = [x[1] for x in r]
    print(k, 'sets', len(r), 'runs each', r[0][5], 'win9 mean %.2f median %.2f min %.2f max %.2f' % (st.mean(ws), st.median(ws), min(ws), max(ws)), 'above the product of singles:', sum(1 for x in r if x[1] > 1.3 * x[2]), 'below best single:', sum(1 for x in r if x[1] < x[3]))
    for x in r[:8]: print('   top %-28s %.2f (singles multiplied %.2f, best single %.2f)' % (x[4], x[1], x[2], x[3]))
    for x in r[-4:]: print('   low %-28s %.2f (singles multiplied %.2f, best single %.2f)' % (x[4], x[1], x[2], x[3]))
    syn = sorted(r, key=lambda x: -x[1] / x[2])[:5]
    for x in syn: print('   more than the parts %-28s %.2f against %.2f' % (x[4], x[1], x[2]))
for h in H.HOMS if hasattr(H, 'HOMS') else sorted(k for k in one if k not in ('none', 'bare')):
    p2 = [x[1] for x in rows if x[0] == 2 and h in x[4].split('+')]; p3 = [x[1] for x in rows if x[0] == 3 and h in x[4].split('+')]
    print('%-10s alone %.2f  in pairs %.2f  in triples %.2f' % (h, one[h], st.mean(p2), st.mean(p3)))
