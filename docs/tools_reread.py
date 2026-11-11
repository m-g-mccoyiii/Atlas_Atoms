# Reads a measure against another Par. Usage: python tools_reread.py <tag> <first> <last> <par.json>
# A measure made with { all: true } plays every round whatever the number was, so the same rounds can be read
# against any Par: the number of a round is the new Par for its round times the factors the round was played with.
# Coins make this slightly inexact (a mark reached pays a coin, and coins buy deals on the take-one page).
import sys, os, json, io, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tools_rig as rig
tag, lo, hi = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
par = json.load(io.open(sys.argv[4], encoding='utf8'))['rounds']
def nice(q):
    mag = 10 ** max(0, int(math.floor(math.log10(max(10, q)))) - 1)
    return max(50, round(q / mag) * mag)
number = lambda row: nice(par[row['round'] - 1] * row['mult'])
rows = rig.load(tag, lo, hi); by = rig.runs_of(rows)
print('runs', {p: sum(1 for k in by if k[0] == p) for p in rig.PLAYERS})
t, S = rig.table(by, number); print(t)
print('\nRounds from round 4 on that ended at another level than they stood at before the last page:')
for p in S: print('  %s: %.1f%% of %d (the pass itself: %.1f%%)' % (p, S[p]['undecided'], S[p]['undn'], S[p]['undpass']))
print('\nmedian player, molecules in the same round (alive runs, at least 8 plays):')
for x in rig.mol_spread(by, 'median', number): print('  round %d: %d molecules, easiest over hardest %.1f' % x[:3])
