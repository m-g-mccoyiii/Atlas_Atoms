import json, math, io, re, itertools
F='C:/Users/mgmcc/AppData/Local/Temp/claude/c2e091f86aaa20cc/4b5d48b3-c4d4-47b4-ad30-ef7d19555645/scratchpad/frames/'
mx=json.load(io.open(F+'f77791.jpg',encoding='utf8')); rs=json.load(io.open(F+'f77792.jpg',encoding='utf8'))
src=io.open('C:/Work/atlas-atoms/apps/steam/js/react/path.js',encoding='utf8').read()
name={}; kin={}
for m in re.finditer(r"\{ id: '(\w+)', tok: '([^']*)'(.*?)\n", src):
    b=m.group(3)
    if 'name:' in b and 'note:' in b:
        n=re.search(r"name: (?:'([^']*)'|\"([^\"]*)\")",b); k=re.search(r"kin: '(\w+)'",b)
        name[m.group(1)]=n.group(1) or n.group(2); kin[m.group(1)]=k.group(1) if k else 'lab'
ids=mx['ids']; base=mx['base']
solo={i:math.exp(mx['solo'][i]-base) for i in ids}
syn={}
for k,v in mx['pair'].items():
    a,b=k.split('+'); syn[k]=math.exp(v-base)/(solo[a]*solo[b])
out=[]; W=out.append
W('# Overreact: the interaction matrix\n')
W('Measured 2026-11-10 by simulation. This file is generated; the method and what it cannot see are at the end.\n')
W('## What was tested\n')
W('| Set | Size | Rounds simulated |\n|---|---|---|')
W('| Every piece alone | 60 | 1,800 |'); W('| Every pair of pieces | 1,770 | 53,100 |'); W('| Random builds of five pieces | 420 | 7,560 |')
W('| Every piece on every family of molecule | 60 by 6 | 2,806 |'); W('| Every piece under every kind of round | 60 by 8 | 5,856 |'); W('| Every extra reagent added to the starting four | 9 | 690 |')
W('\nThe full space is far larger: 5,461,512 builds of five pieces from sixty, before reagents, molecules, levels and sigils. Pairs and a random sample of full builds are what can be measured; triples and beyond are covered only by the sample.\n')
W('## Every piece alone\n')
W('Worth is the round total with the piece, as a multiple of the total without it. 1.00 is no effect.\n')
W('| Piece | Shelf | Worth |\n|---|---|---|')
for i in sorted(ids,key=lambda q:-solo[q]): W('| %s | %s | %.2f |'%(name[i],kin[i],solo[i]))
dead=[i for i in ids if 0.97<=solo[i]<=1.03]; hurt=[i for i in ids if solo[i]<0.97]
W('\n- **No measurable effect alone (%d):** %s.'%(len(dead),', '.join(name[i] for i in dead)))
W('- **Worse than nothing alone (%d):** %s.'%(len(hurt),', '.join('%s %.2f'%(name[i],solo[i]) for i in sorted(hurt,key=lambda q:solo[q]))))
sh={}
for i in ids: sh.setdefault(kin[i],[]).append(solo[i])
W('- **By shelf, median worth:** '+', '.join('%s %.2f'%(k,sorted(v)[len(v)//2]) for k,v in sh.items())+'.\n')
W('## Pairs\n')
W('Synergy is the pair\'s worth divided by the product of the two alone. Above 1 the pair is a combo; below 1 the two get in each other\'s way.\n')
vals=sorted(syn.values()); n=len(vals)
W('- %d of 1,770 pairs are within 5 percent of no interaction.'%sum(1 for v in vals if 0.95<=v<=1.05))
W('- %d pairs are combos of 1.25 or more. %d are 2 or more.'%(sum(1 for v in vals if v>=1.25),sum(1 for v in vals if v>=2)))
W('- %d pairs lose a fifth or more.\n'%sum(1 for v in vals if v<=0.8))
W('### Strongest combos\n\n| Pair | Synergy | Pair worth |\n|---|---|---|')
for k,v in sorted(syn.items(),key=lambda q:-q[1])[:30]:
    a,b=k.split('+'); W('| %s + %s | %.2f | %.1f |'%(name[a],name[b],v,math.exp(mx['pair'][k]-base)))
W('\n### Worst pairs\n\n| Pair | Synergy | Pair worth |\n|---|---|---|')
for k,v in sorted(syn.items(),key=lambda q:q[1])[:20]:
    a,b=k.split('+'); W('| %s + %s | %.2f | %.1f |'%(name[a],name[b],v,math.exp(mx['pair'][k]-base)))
W('\n### Strongest pairs outright\n\n| Pair | Pair worth |\n|---|---|')
for k,v in sorted(mx['pair'].items(),key=lambda q:-q[1])[:15]:
    a,b=k.split('+'); W('| %s + %s | %.1f |'%(name[a],name[b],math.exp(v-base)))
# who combos most
tot={i:[] for i in ids}
for k,v in syn.items():
    a,b=k.split('+'); tot[a].append(v); tot[b].append(v)
W('\n### How well each piece combines\n')
W('The number of the 59 partners with which a piece is a combo of 1.25 or more, and its average synergy.\n')
W('| Piece | Combos | Average synergy |\n|---|---|---|')
for i in sorted(ids,key=lambda q:-sum(1 for v in tot[q] if v>=1.25)): W('| %s | %d | %.2f |'%(name[i],sum(1 for v in tot[i] if v>=1.25),sum(tot[i])/len(tot[i])))
W('\n## Full builds of five\n')
kits=rs['kits']; kb=[(k,math.exp(v-base)) for k,v in kits]; kb.sort(key=lambda q:-q[1])
ws=[v for _,v in kb]
W('420 random builds. Worth of the whole build against no equipment: median %.1f, the top tenth above %.1f, the bottom tenth below %.2f, the best %.0f, the worst %.2f. The spread from the bottom tenth to the top tenth is a factor of %.0f.\n'%(ws[len(ws)//2],ws[len(ws)//10],ws[-len(ws)//10],ws[0],ws[-1],ws[len(ws)//10]/ws[-len(ws)//10]))
W('### Ten best builds found\n\n| Build | Worth |\n|---|---|')
for k,v in kb[:10]: W('| %s | %.0f |'%(', '.join(name[i] for i in k.split(',')),v))
W('\n### Ten worst\n\n| Build | Worth |\n|---|---|')
for k,v in kb[-10:]: W('| %s | %.2f |'%(', '.join(name[i] for i in k.split(',')),v))
pres={i:[] for i in ids}; absn={i:[] for i in ids}
for k,v in kits:
    s=set(k.split(','))
    for i in ids: (pres if i in s else absn)[i].append(v)
lift={i:math.exp(sum(pres[i])/len(pres[i])-sum(absn[i])/len(absn[i])) for i in ids if pres[i]}
W('\n### What a piece is worth inside a build\n')
W('The average build with the piece against the average build without it. This is the number that matters in play, because pieces are never alone.\n')
W('| Piece | In a build | Alone |\n|---|---|---|')
for i in sorted(lift,key=lambda q:-lift[q]): W('| %s | %.2f | %.2f |'%(name[i],lift[i],solo[i]))
W('\n## Pieces by family of molecule\n')
fams=sorted(rs['fam']['none'].keys())
W('Worth of each piece on each family. A piece that is strong on one family and dead on another is a build piece; a piece that is flat everywhere is filler.\n')
W('| Piece | '+' | '.join(fams)+' | Spread |\n|---|'+'---|'*(len(fams)+1))
rows=[]
for i in ids:
    r=[math.exp(rs['fam'][i][f]-rs['fam']['none'][f]) for f in fams]; rows.append((max(r)/max(0.01,min(r)),i,r))
for sp,i,r in sorted(rows,key=lambda q:-q[0]): W('| %s | '%name[i]+' | '.join('%.2f'%v for v in r)+' | %.1f |'%sp)
W('\nHow big each family scores with no equipment (median of the log, as a total): '+', '.join('%s %d'%(f,round(math.exp(rs['fam']['none'][f]))) for f in fams)+'.\n')
W('## Pieces by kind of round\n')
brs=sorted(rs['brief']['none'].keys())
W('| Piece | '+' | '.join(brs)+' |\n|---|'+'---|'*len(brs))
for i in sorted(ids,key=lambda q:-max(math.exp(rs['brief'][q][b]-rs['brief']['none'][b]) for b in brs)/max(0.01,min(math.exp(rs['brief'][q][b]-rs['brief']['none'][b]) for b in brs)))[:25]:
    W('| %s | '%name[i]+' | '.join('%.2f'%math.exp(rs['brief'][i][b]-rs['brief']['none'][b]) for b in brs)+' |')
W('\nOnly the 25 pieces that vary most are shown. Totals with no equipment by kind of round: '+', '.join('%s %d'%(b,round(math.exp(rs['brief']['none'][b]))) for b in brs)+'.\n')
W('## Reagents\n')
W('Each reagent added to the starting four, on all 23 molecules.\n\n| Added | Worth |\n|---|---|')
for k,v in sorted(rs['rack'].items(),key=lambda q:-q[1]):
    if k!='start': W('| %s | %.2f |'%(k,math.exp(v-rs['rack']['start'])))
W('\n## Numbers to beat\n')
W('Round one, starting four reagents, no equipment, a player who always takes the biggest number. Seven plays a molecule.\n')
W('| Molecule | Family | Number to beat | Lowest | Median | Highest | Median as a share |\n|---|---|---|---|---|---|---|')
qs=mx['quota']; sharev=[]
for q in sorted(qs,key=lambda q:(q['med']/q['quota']) if q['quota']>0 else 0):
    sh=q['med']/q['quota'] if q['quota']>0 else 0; sharev.append(sh)
    W('| %s | %s | %s | %s | %s | %s | %.2f |'%(q['feed'],q['kin'],format(q['quota'],','),format(q['lo'],','),format(q['med'],','),format(q['hi'],','),sh))
W('\n- On %d of 23 molecules the median play beats the number.'%sum(1 for v in sharev if v>=1))
W('- The median share runs from %.2f to %.2f, a factor of %.0f between the hardest and easiest molecule.\n'%(min(sharev),max(sharev),max(sharev)/max(0.001,min(sharev))))
W('## Method and limits\n')
W('- **The player.** A simulated player who always takes the reaction that adds most. It never breaks a row on purpose, never spends a wish, never uses the fire extinguisher, and does not feed the circle. Pieces built around those cannot be judged here: black cat, monkey\'s paw, fire extinguisher, the intern, the pay pieces (goggles, grant proposal).')
W('- **The rack.** The starting four plus hydroborate and add methyl. Pieces tied to other reagents (acids, halides) read low.')
W('- **One round.** Round one of a run, level one of every piece. Nothing here covers nine rounds, levels, or the number to beat rising.')
W('- **Noise.** Every comparison uses the same six molecules and the same five seeds with and without the piece, so the same deals are compared. Differences under about 5 percent are still not meaningful.')
W('- **Averages are of logarithms**, so one huge round does not swamp the rest.')
io.open('C:/Work/atlas-atoms/docs/MATRIX.md','w',encoding='utf8',newline='\n').write('\n'.join(out)+'\n')
print(len(out),'lines'); print('dead',len(dead),'hurt',len(hurt)); print('combos>=1.25',sum(1 for v in vals if v>=1.25),'>=2',sum(1 for v in vals if v>=2),'near1',sum(1 for v in vals if 0.95<=v<=1.05)); print('kits med %.1f top10 %.1f bot10 %.2f best %.0f'%(ws[len(ws)//2],ws[len(ws)//10],ws[-len(ws)//10],ws[0])); print('quota beaten',sum(1 for v in sharev if v>=1),'min %.2f max %.2f'%(min(sharev),max(sharev)))
print('top solo',[(name[i],round(solo[i],2)) for i in sorted(ids,key=lambda q:-solo[q])[:8]])
print('top syn',[(k,round(v,2)) for k,v in sorted(syn.items(),key=lambda q:-q[1])[:8]])
