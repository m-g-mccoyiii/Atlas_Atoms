"""sweep_hom20_specs.py: the twentieth measure (owner, ruling BC: "synergy over averages"; "Try it on three first"), for sweep_run.py hom20.

Three creatures get a number that grows with a count (path.js RULE.homCount):
    acid       read B * PER^(atoms chewed - 2), at most x3.20 (ruling BC)
    seedling   read B * PER^(atoms added - 6)
    brimstone  read PER^(sulfur atoms on the molecule)  (B = PER: "x1.17 for each sulfur"); with Sulphur's Mask held every OH counts too

    python sweep_hom20_specs.py grid <creature> <cand>     the trials of B (as read) for one candidate PER, to fit B to worth 1.2 .. 1.8
    python sweep_hom20_specs.py stages <creature> <cand>   the five stages as fitted (FIT), for one candidate
    python sweep_hom20_specs.py s135 <creature> <cand>     stages 1, 3 and 5 only
    python sweep_hom20_specs.py one <creature> <cand> <stage> [extra ~ATTR=v]

CAND[creature] are the three candidates (a, b, c).  FIT[creature][cand] the five numbers B as read, fitted (sweep_hom18.py fit hom20).
"""
import sys

CAND = {
    'acid': {'a': 1.10, 'b': 1.20, 'c': 1.35},
    'seedling': {'a': 1.03, 'b': 1.06, 'c': 1.10},
    # Brimstone: the per-sulfur number by stage (B = PER), three ladders
    'brimstone': {'a': (1.10, 1.15, 1.20, 1.25, 1.30), 'b': (1.17, 1.30, 1.39, 1.52, 1.59), 'c': (1.25, 1.40, 1.55, 1.70, 1.85)},
}
GRID = {'acid': (1.25, 1.6, 2.0, 2.6, 3.2), 'seedling': (1.1, 1.3, 1.6, 2.0, 2.6)}
CAPR = 3.2
FIT = {      # B as read at stages 1..5, read off the grid (sweep_hom18.py fit hom20) at worth 1.2, 1.35, 1.5, 1.65, 1.8; Acid stops at x3.20
    'acid': {'a': (1.92, 2.61, 3.12, 3.2, 3.2), 'b': (1.92, 2.50, 3.11, 3.2, 3.2), 'c': (1.90, 2.50, 3.11, 3.2, 3.2)},
    'seedling': {'a': (1.34, 1.57, 1.77, 1.99, 2.34), 'b': (1.19, 1.38, 1.54, 1.79, 2.16), 'c': (1.07, 1.23, 1.40, 1.59, 1.94)},
}
RULE = {
    'acid': 'acid@%s~COUNT=1~PER=%s~CAPR=' + str(CAPR) + '~ONCE=1',
    'seedling': 'seedling@%s~GAIN=6~RISE=0~COUNT=1~PER=%s~ONCE=1',
    'brimstone': 'brimstone~MODE=1~LASTP=1~KB=%s~COUNT=1~PER=%s~MASKOH=1~ONCE=1~ONCERUN=1',
}
ORDER = ('acid', 'seedling', 'brimstone')


def num(r):
    k = r * r
    s = ('%.4f' % k).rstrip('0')
    return s + ('0' if s.endswith('.') else '')


def spec_b(h, cand, b):
    per = CAND[h][cand]
    return RULE[h] % (num(b), '%.4f' % per)


def spec(h, cand, stage):
    if h == 'brimstone':
        per = CAND[h][cand][stage - 1]
        return RULE[h] % (num(per), '%.4f' % per)
    return spec_b(h, cand, FIT[h][cand][stage - 1])


if __name__ == '__main__':
    what, h, cand = sys.argv[1], sys.argv[2], sys.argv[3]
    if what == 'grid':
        print(';'.join(spec_b(h, cand, b) for b in GRID[h]))
    elif what == 'stages':
        print(';'.join(spec(h, cand, s) for s in (1, 2, 3, 4, 5)))
    elif what == 's135':
        print(';'.join(spec(h, cand, s) for s in (1, 3, 5)))
    elif what == 'one':
        print(spec(h, cand, int(sys.argv[4])) + ''.join(sys.argv[5:]))
