"""sweep_hom18_specs.py: the specs of the eighteenth measure's creatures as fitted, for sweep_run.py hom18.

    python sweep_hom18_specs.py stages         the ten creatures at their five stages (50 specs joined by ;)
    python sweep_hom18_specs.py three          the ten at stage 3 and none

READ is what the player reads at stages 1 to 5 (path.js HOMGROW.read; the rules multiply by its square).  RULE is the creature
as sweep_homs.make reads it, with %s where its number goes.
"""
import sys

READ = {
    'water': (1.30, 1.50, 1.71, 1.93, 2.15),
    'h2': (1.38, 1.62, 1.84, 2.11, 2.46),
    'co2': (1.91, 2.40, 2.82, 3.89, 4.50),
    'acid': (2.01, 2.58, 3.17, 3.95, 4.50),
    'wood': (1.22, 1.33, 1.40, 1.45, 1.51),
    'salt': (1.35, 1.49, 1.67, 1.92, 2.15),
    'slime': (1.32, 1.45, 1.56, 1.66, 1.88),
    'ammonia': (1.08, 1.23, 1.32, 1.45, 1.57),
    'seedling': (1.30, 1.50, 1.67, 1.91, 2.25),
    'brimstone': (1.17, 1.30, 1.39, 1.52, 1.59),
}
RULE = {
    'water': 'water@%s~NEED=3',
    'h2': 'h2~MODE=1~KS=%s',
    'co2': 'co2@%s~NEEDC=0',
    'acid': 'acid@%s',
    'wood': 'wood~MODE=2~KS=%s',
    'salt': 'salt@%s~MATCH=1',
    'slime': 'slime@%s~K2=%s~OWN=0',
    'ammonia': 'ammonia~KN=%s',
    'seedling': 'seedling@%s~GAIN=6~RISE=0',
    'brimstone': 'brimstone~MODE=1~LASTP=1~KB=%s',
}
ORDER = ('water', 'h2', 'co2', 'acid', 'wood', 'salt', 'slime', 'ammonia', 'seedling', 'brimstone')


def num(h, r):
    k = r * r
    if h == 'co2':
        k = k ** (1.0 / 3.0)         # a bottle: three are shut
    return ('%.4f' % k).rstrip('0') + ('0' if ('%.4f' % k).rstrip('0').endswith('.') else '')


def spec(h, stage):
    n = num(h, READ[h][stage - 1])
    return RULE[h] % ((n, n) if RULE[h].count('%s') == 2 else n)


if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'stages'
    if what == 'stages':
        print(';'.join(spec(h, s) for h in ORDER for s in (1, 2, 3, 4, 5)))
    else:
        print(';'.join([spec(h, 3) for h in ORDER] + ['none']))
