import json, glob, os, math, sys
D=os.environ.get('FRAMES','frames')
def load(lo):
    rows={}
    for f in glob.glob(D+'/f*.jpg'):
        try: n=int(os.path.basename(f)[1:-4])
        except: continue
        if lo<=n<lo+1000:
            try:
                for q in json.load(open(f,encoding='utf-8')).get('rows',[]):
                    if 'error' not in q: rows[(q['seed'],q['round'])]=q
            except Exception as e: pass
    return rows
b=load(int(sys.argv[1]))
gm=lambda u: math.exp(sum(map(math.log,u))/max(1,len(u)))
def beaten(rows, seeds):
    out=[]
    for s in seeds:
        n=0
        for r in range(1,10):
            q=rows.get((s,r))
            if not q or not q['pass']: break
            n+=1
        out.append(n)
    return sum(out)/max(1,len(out))
for a in sys.argv[2:]:
    lo=int(a); r=load(lo); u=[]; al=[]; mid=[]
    seeds=sorted(set(k[0] for k in r if (k[0],9) in r and (k[0],9) in b))
    for k,q in r.items():
        if k not in b or k[0] not in seeds: continue
        x=(q['total']+1)/(b[k]['total']+1); al.append(x)
        if q.get('hom'):
            u.append(x)
            if 4<=k[1]<=6: mid.append(x)
    u.sort()
    print(lo,'runs',len(seeds),'rounds',len(al),'tapped %d (%.0f%%)'%(len(u),100*len(u)/max(1,len(al))),'tapped gm %.2f median %.2f mid-rounds gm %.2f (%d)'%(gm(u),u[len(u)//2] if u else 0,gm(mid),len(mid)),'all gm %.2f'%gm(al),'beaten %.2f vs %.2f'%(beaten(r,seeds),beaten(b,seeds)),'jar/run w %.1f h %.1f c %.1f'%tuple(sum(q.get(k2,0) or 0 for q in r.values())/max(1,len(set(k[0] for k in r))) for k2 in ('water','h2','co2')))
