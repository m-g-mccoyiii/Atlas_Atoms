"""sweep_hom19_specs.py: the specs of the nineteenth measure (a creature acts once a round; Brimstone once a run), for sweep_run.py hom19.

    python sweep_hom19_specs.py grid           eight creatures at six sizes of the number, once a round (Dry ice is lit only on the
                                               last page and Brimstone keeps its number, so neither is in the grid)
    python sweep_hom19_specs.py stages         the ten as fitted, at their five stages
    python sweep_hom19_specs.py three          the ten at stage 3 and none
    python sweep_hom19_specs.py five           the ten at stage 5
    python sweep_hom19_specs.py brim           Brimstone at stage 3: once a run, and as it was

READ is what the player reads at stages 1 to 5 (path.js HOMGROW.read; the rules multiply by its square).
"""
import sys

import sweep_hom18_specs as S18

GRID = (1.25, 1.6, 2.0, 2.6, 3.4, 4.5)
READ = dict(S18.READ)
READ.update({          # read off the grid at worth 1.2, 1.35, 1.5, 1.65, 1.8 (sweep_hom18.py fit hom19); Dry ice and Brimstone keep the eighteenth's
    'water': (1.36, 1.83, 2.19, 2.54, 2.92),
    'h2': (1.50, 1.86, 2.15, 2.39, 2.75),
    'acid': (1.96, 2.67, 3.17, 4.05, 4.50),
    'wood': (1.54, 1.72, 1.88, 2.08, 2.38),
    'salt': (1.54, 1.87, 2.13, 2.36, 2.64),
    'slime': (1.55, 1.76, 1.98, 2.17, 2.38),
    'ammonia': (1.24, 1.48, 1.73, 1.96, 2.21),
    'seedling': (1.48, 1.71, 1.92, 2.26, 2.73),
})
ORDER = S18.ORDER


def rule(h):
    return S18.RULE[h] + ('~ONCE=1~ONCERUN=1' if h == 'brimstone' else '~ONCE=1')


def spec_at(h, r):
    n = S18.num(h, r)
    return rule(h) % ((n, n) if rule(h).count('%s') == 2 else n)


def spec(h, stage):
    return spec_at(h, READ[h][stage - 1])


if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'stages'
    if what == 'grid':
        print(';'.join(spec_at(h, r) for h in ORDER if h not in ('co2', 'brimstone') for r in GRID))
    elif what == 'stages':
        print(';'.join(spec(h, s) for h in ORDER for s in (1, 2, 3, 4, 5)))
    elif what == 'five':
        print(';'.join(spec(h, 5) for h in ORDER))
    elif what == 'brim':
        print(';'.join([spec('brimstone', 3), S18.spec('brimstone', 3), S18.spec('brimstone', 3) + '~ONCE=1']))
    else:
        print(';'.join([spec(h, 3) for h in ORDER] + ['none']))
