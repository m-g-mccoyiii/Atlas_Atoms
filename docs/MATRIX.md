# Overreact: the interaction matrix

Measured 2026-11-10 by simulation. This file is generated; the method and what it cannot see are at the end.

## What was tested

| Set | Size | Rounds simulated |
|---|---|---|
| Every piece alone | 60 | 1,800 |
| Every pair of pieces | 1,770 | 53,100 |
| Random builds of five pieces | 420 | 7,560 |
| Every piece on every family of molecule | 60 by 6 | 2,806 |
| Every piece under every kind of round | 60 by 8 | 5,856 |
| Every extra reagent added to the starting four | 9 | 690 |

The full space is far larger: 5,461,512 builds of five pieces from sixty, before reagents, molecules, levels and sigils. Pairs and a random sample of full builds are what can be measured; triples and beyond are covered only by the sample.

## Every piece alone

Worth is the round total with the piece, as a multiple of the total without it. 1.00 is no effect.

| Piece | Shelf | Worth |
|---|---|---|
| black candle | occult | 5.55 |
| a signed pact | occult | 3.00 |
| index cards | lab | 2.89 |
| recycler | lab | 2.62 |
| fume hood | lab | 2.33 |
| voodoo doll | occult | 2.30 |
| lead into gold | alchemy | 2.19 |
| stir plate | lab | 2.04 |
| philosopher's stone | alchemy | 2.03 |
| cold trap | lab | 1.96 |
| the Tower | occult | 1.91 |
| goat sacrifice | occult | 1.90 |
| schlenk line | lab | 1.88 |
| mortar | lab | 1.88 |
| log book | lab | 1.84 |
| cannula | lab | 1.80 |
| rubber duck | lab | 1.79 |
| scrubber | lab | 1.74 |
| stopwatch | lab | 1.63 |
| aqua regia | alchemy | 1.58 |
| reflux | lab | 1.52 |
| burner | lab | 1.50 |
| thermometer | lab | 1.50 |
| burette | lab | 1.45 |
| balance | lab | 1.44 |
| spatula | lab | 1.39 |
| homunculus, in a jar | alchemy | 1.36 |
| brass weights | lab | 1.32 |
| dropper | lab | 1.28 |
| elixir of life | alchemy | 1.27 |
| hourglass | occult | 1.27 |
| litmus paper | lab | 1.25 |
| magnet | lab | 1.21 |
| sieves | lab | 1.20 |
| grimoire | occult | 1.19 |
| drying tube | lab | 1.17 |
| raven | occult | 1.12 |
| ouroboros | alchemy | 1.11 |
| expired milk | lab | 1.10 |
| stopper | lab | 1.10 |
| poster | lab | 1.07 |
| mirror | lab | 1.01 |
| lab coat | lab | 1.00 |
| goggles | lab | 1.00 |
| grant proposal | lab | 1.00 |
| extinguisher | lab | 1.00 |
| the intern | lab | 1.00 |
| loupe | lab | 1.00 |
| monkey's paw | occult | 1.00 |
| cursed idol | occult | 1.00 |
| hand of glory | occult | 1.00 |
| crystal ball | occult | 0.97 |
| ouija board | occult | 0.97 |
| clamp | lab | 0.97 |
| seed crystal | lab | 0.90 |
| timer | lab | 0.89 |
| unlabeled bottle | lab | 0.88 |
| black cat | occult | 0.88 |
| coffee | lab | 0.83 |
| carousel | lab | 0.44 |

- **No measurable effect alone (12):** lab coat, goggles, grant proposal, extinguisher, the intern, mirror, loupe, monkey's paw, cursed idol, hand of glory, crystal ball, ouija board.
- **Worse than nothing alone (7):** carousel 0.44, coffee 0.83, black cat 0.88, unlabeled bottle 0.88, timer 0.89, seed crystal 0.90, clamp 0.97.
- **By shelf, median worth:** lab 1.28, alchemy 1.58, occult 1.19.

## Pairs

Synergy is the pair's worth divided by the product of the two alone. Above 1 the pair is a combo; below 1 the two get in each other's way.

- 1165 of 1,770 pairs are within 5 percent of no interaction.
- 59 pairs are combos of 1.25 or more. 6 are 2 or more.
- 70 pairs lose a fifth or more.

### Strongest combos

| Pair | Synergy | Pair worth |
|---|---|---|
| recycler + seed crystal | 10.09 | 23.9 |
| voodoo doll + cursed idol | 4.55 | 10.5 |
| mirror + recycler | 2.84 | 7.5 |
| cursed idol + goat sacrifice | 2.46 | 4.7 |
| recycler + dropper | 2.33 | 7.8 |
| recycler + carousel | 2.08 | 2.4 |
| schlenk line + lab coat | 1.94 | 3.7 |
| seed crystal + carousel | 1.87 | 0.7 |
| mirror + ouroboros | 1.84 | 2.1 |
| burner + carousel | 1.76 | 1.2 |
| index cards + carousel | 1.73 | 2.2 |
| carousel + black cat | 1.72 | 0.7 |
| brass weights + carousel | 1.71 | 1.0 |
| carousel + voodoo doll | 1.70 | 1.7 |
| carousel + black candle | 1.68 | 4.1 |
| stopper + ouroboros | 1.65 | 2.0 |
| seed crystal + black cat | 1.61 | 1.3 |
| coffee + timer | 1.60 | 1.2 |
| recycler + hourglass | 1.58 | 5.3 |
| recycler + elixir of life | 1.58 | 5.3 |
| cursed idol + black candle | 1.53 | 8.5 |
| seed crystal + ouroboros | 1.52 | 1.5 |
| brass weights + ouroboros | 1.46 | 2.1 |
| ouija board + goat sacrifice | 1.46 | 2.7 |
| seed crystal + timer | 1.45 | 1.2 |
| timer + ouija board | 1.43 | 1.2 |
| scrubber + carousel | 1.43 | 1.1 |
| the Tower + cursed idol | 1.42 | 2.7 |
| carousel + goat sacrifice | 1.42 | 1.2 |
| hourglass + black candle | 1.40 | 9.9 |

### Worst pairs

| Pair | Synergy | Pair worth |
|---|---|---|
| fume hood + black candle | 0.51 | 6.7 |
| ouroboros + the Tower | 0.52 | 1.1 |
| recycler + the Tower | 0.53 | 2.6 |
| the Tower + black candle | 0.54 | 5.8 |
| cold trap + fume hood | 0.57 | 2.6 |
| mirror + black candle | 0.59 | 3.3 |
| burner + the Tower | 0.59 | 1.7 |
| scrubber + the Tower | 0.61 | 2.0 |
| unlabeled bottle + recycler | 0.61 | 1.4 |
| black candle + goat sacrifice | 0.61 | 6.5 |
| stir plate + black candle | 0.63 | 7.2 |
| cold trap + black candle | 0.65 | 7.0 |
| index cards + fume hood | 0.65 | 4.4 |
| rubber duck + black candle | 0.66 | 6.5 |
| black cat + black candle | 0.67 | 3.3 |
| cold trap + goat sacrifice | 0.67 | 2.5 |
| stir plate + fume hood | 0.68 | 3.2 |
| log book + black candle | 0.68 | 7.0 |
| scrubber + voodoo doll | 0.68 | 2.7 |
| stir plate + index cards | 0.69 | 4.1 |

### Strongest pairs outright

| Pair | Pair worth |
|---|---|
| recycler + seed crystal | 23.9 |
| black candle + a signed pact | 16.7 |
| recycler + black candle | 15.7 |
| index cards + black candle | 14.4 |
| lead into gold + black candle | 13.0 |
| mortar + black candle | 10.7 |
| cannula + black candle | 10.6 |
| voodoo doll + cursed idol | 10.5 |
| schlenk line + black candle | 10.4 |
| hourglass + black candle | 9.9 |
| elixir of life + black candle | 9.9 |
| voodoo doll + black candle | 9.2 |
| philosopher's stone + black candle | 9.2 |
| drying tube + black candle | 9.0 |
| dropper + black candle | 8.8 |

### How well each piece combines

The number of the 59 partners with which a piece is a combo of 1.25 or more, and its average synergy.

| Piece | Combos | Average synergy |
|---|---|---|
| carousel | 13 | 1.14 |
| seed crystal | 9 | 1.24 |
| recycler | 7 | 1.25 |
| timer | 7 | 1.04 |
| coffee | 6 | 1.03 |
| brass weights | 6 | 1.04 |
| voodoo doll | 6 | 1.08 |
| black cat | 6 | 1.03 |
| cursed idol | 6 | 1.11 |
| goat sacrifice | 6 | 1.04 |
| black candle | 5 | 0.95 |
| ouroboros | 4 | 1.06 |
| ouija board | 4 | 1.01 |
| lab coat | 3 | 1.03 |
| mirror | 3 | 1.03 |
| index cards | 3 | 0.97 |
| elixir of life | 3 | 1.04 |
| the Tower | 3 | 0.97 |
| hourglass | 3 | 1.04 |
| unlabeled bottle | 2 | 1.00 |
| scrubber | 2 | 0.98 |
| burner | 2 | 1.01 |
| dropper | 2 | 1.03 |
| balance | 1 | 1.03 |
| schlenk line | 1 | 1.03 |
| rubber duck | 1 | 0.97 |
| stopper | 1 | 1.01 |
| drying tube | 1 | 1.02 |
| lead into gold | 1 | 1.04 |
| grimoire | 1 | 1.01 |
| spatula | 0 | 0.96 |
| poster | 0 | 1.00 |
| expired milk | 0 | 0.99 |
| goggles | 0 | 1.00 |
| grant proposal | 0 | 1.00 |
| extinguisher | 0 | 1.00 |
| the intern | 0 | 1.00 |
| mortar | 0 | 1.00 |
| cannula | 0 | 1.01 |
| reflux | 0 | 1.01 |
| burette | 0 | 0.98 |
| clamp | 0 | 1.02 |
| magnet | 0 | 1.00 |
| stir plate | 0 | 0.96 |
| log book | 0 | 0.97 |
| cold trap | 0 | 0.91 |
| sieves | 0 | 1.00 |
| fume hood | 0 | 0.92 |
| litmus paper | 0 | 0.97 |
| stopwatch | 0 | 0.97 |
| thermometer | 0 | 0.98 |
| loupe | 0 | 1.00 |
| philosopher's stone | 0 | 0.99 |
| aqua regia | 0 | 0.99 |
| homunculus, in a jar | 0 | 1.01 |
| monkey's paw | 0 | 1.00 |
| raven | 0 | 0.98 |
| hand of glory | 0 | 1.00 |
| crystal ball | 0 | 1.00 |
| a signed pact | 0 | 1.00 |

## Full builds of five

420 random builds. Worth of the whole build against no equipment: median 3.9, the top tenth above 12.8, the bottom tenth below 1.47, the best 73, the worst 0.42. The spread from the bottom tenth to the top tenth is a factor of 9.

### Ten best builds found

| Build | Worth |
|---|---|
| carousel, recycler, aqua regia, voodoo doll, black candle | 73 |
| mortar, hourglass, recycler, lead into gold, stir plate | 55 |
| cursed idol, poster, goat sacrifice, voodoo doll, loupe | 53 |
| schlenk line, cannula, lead into gold, index cards, scrubber | 38 |
| sieves, cold trap, black candle, stir plate, a signed pact | 34 |
| fume hood, recycler, seed crystal, ouroboros, litmus paper | 34 |
| voodoo doll, index cards, magnet, black candle, cannula | 33 |
| reflux, dropper, recycler, fume hood, magnet | 31 |
| black candle, recycler, unlabeled bottle, goat sacrifice, stopper | 31 |
| schlenk line, cursed idol, philosopher's stone, cold trap, black candle | 31 |

### Ten worst

| Build | Worth |
|---|---|
| sieves, unlabeled bottle, loupe, grant proposal, magnet | 0.81 |
| ouija board, unlabeled bottle, monkey's paw, lab coat, aqua regia | 0.79 |
| balance, carousel, hand of glory, loupe, sieves | 0.79 |
| loupe, lab coat, litmus paper, grant proposal, unlabeled bottle | 0.77 |
| lab coat, black cat, carousel, clamp, cold trap | 0.77 |
| carousel, extinguisher, poster, elixir of life, rubber duck | 0.73 |
| carousel, hand of glory, spatula, sieves, magnet | 0.68 |
| carousel, ouroboros, coffee, elixir of life, the intern | 0.43 |
| elixir of life, hourglass, timer, magnet, carousel | 0.43 |
| ouija board, carousel, goggles, raven, extinguisher | 0.42 |

### What a piece is worth inside a build

The average build with the piece against the average build without it. This is the number that matters in play, because pieces are never alone.

| Piece | In a build | Alone |
|---|---|---|
| black candle | 3.50 | 5.55 |
| recycler | 2.81 | 2.62 |
| a signed pact | 2.22 | 3.00 |
| voodoo doll | 2.18 | 2.30 |
| index cards | 1.89 | 2.89 |
| lead into gold | 1.82 | 2.19 |
| schlenk line | 1.76 | 1.88 |
| goat sacrifice | 1.69 | 1.90 |
| mortar | 1.60 | 1.88 |
| philosopher's stone | 1.44 | 2.03 |
| cannula | 1.41 | 1.80 |
| cursed idol | 1.39 | 1.00 |
| reflux | 1.34 | 1.52 |
| fume hood | 1.33 | 2.33 |
| stir plate | 1.22 | 2.04 |
| balance | 1.19 | 1.44 |
| scrubber | 1.15 | 1.74 |
| dropper | 1.14 | 1.28 |
| log book | 1.14 | 1.84 |
| the Tower | 1.13 | 1.91 |
| brass weights | 1.09 | 1.32 |
| aqua regia | 1.09 | 1.58 |
| poster | 1.08 | 1.07 |
| thermometer | 1.02 | 1.50 |
| cold trap | 1.02 | 1.96 |
| burner | 1.02 | 1.50 |
| ouroboros | 1.00 | 1.11 |
| stopwatch | 1.00 | 1.63 |
| hourglass | 0.97 | 1.27 |
| stopper | 0.96 | 1.10 |
| litmus paper | 0.96 | 1.25 |
| homunculus, in a jar | 0.90 | 1.36 |
| raven | 0.90 | 1.12 |
| seed crystal | 0.89 | 0.90 |
| sieves | 0.88 | 1.20 |
| rubber duck | 0.84 | 1.79 |
| the intern | 0.81 | 1.00 |
| expired milk | 0.81 | 1.10 |
| grimoire | 0.80 | 1.19 |
| lab coat | 0.80 | 1.00 |
| mirror | 0.80 | 1.01 |
| magnet | 0.80 | 1.21 |
| coffee | 0.79 | 0.83 |
| spatula | 0.78 | 1.39 |
| clamp | 0.75 | 0.97 |
| ouija board | 0.74 | 0.97 |
| burette | 0.71 | 1.45 |
| hand of glory | 0.70 | 1.00 |
| monkey's paw | 0.70 | 1.00 |
| elixir of life | 0.69 | 1.27 |
| drying tube | 0.68 | 1.17 |
| goggles | 0.67 | 1.00 |
| extinguisher | 0.66 | 1.00 |
| black cat | 0.66 | 0.88 |
| crystal ball | 0.65 | 0.97 |
| grant proposal | 0.65 | 1.00 |
| loupe | 0.62 | 1.00 |
| timer | 0.61 | 0.89 |
| unlabeled bottle | 0.59 | 0.88 |
| carousel | 0.44 | 0.44 |

## Pieces by family of molecule

Worth of each piece on each family. A piece that is strong on one family and dead on another is a build piece; a piece that is flat everywhere is filler.

| Piece | arene | cage | chain | ring | sugar | Spread |
|---|---|---|---|---|---|---|
| unlabeled bottle | 1.84 | 0.31 | 0.60 | 0.51 | 0.91 | 6.0 |
| cold trap | 0.67 | 0.69 | 2.31 | 1.46 | 0.90 | 3.4 |
| goat sacrifice | 1.76 | 2.20 | 1.40 | 1.54 | 0.75 | 2.9 |
| index cards | 2.02 | 2.58 | 2.86 | 2.92 | 5.84 | 2.9 |
| dropper | 2.93 | 1.74 | 1.39 | 1.10 | 1.21 | 2.7 |
| stopper | 0.94 | 0.66 | 1.20 | 0.77 | 1.74 | 2.6 |
| coffee | 1.04 | 1.58 | 0.74 | 0.70 | 0.65 | 2.4 |
| timer | 1.21 | 1.62 | 0.80 | 0.72 | 0.67 | 2.4 |
| ouija board | 1.08 | 1.60 | 0.81 | 0.74 | 0.67 | 2.4 |
| seed crystal | 0.53 | 1.20 | 0.88 | 0.92 | 0.69 | 2.3 |
| mirror | 0.77 | 0.55 | 0.91 | 0.71 | 1.24 | 2.3 |
| litmus paper | 0.89 | 0.72 | 1.51 | 1.12 | 1.14 | 2.1 |
| the Tower | 1.10 | 0.76 | 1.56 | 0.98 | 1.06 | 2.1 |
| mortar | 0.95 | 1.34 | 1.92 | 1.27 | 1.77 | 2.0 |
| black candle | 3.19 | 1.83 | 3.61 | 2.97 | 3.00 | 2.0 |
| crystal ball | 1.00 | 0.60 | 0.79 | 1.17 | 0.83 | 1.9 |
| voodoo doll | 2.01 | 2.77 | 1.65 | 1.86 | 1.51 | 1.8 |
| rubber duck | 1.14 | 1.33 | 1.76 | 2.07 | 1.31 | 1.8 |
| stir plate | 1.31 | 1.50 | 2.00 | 2.34 | 1.57 | 1.8 |
| log book | 1.19 | 1.86 | 1.83 | 2.12 | 1.36 | 1.8 |
| thermometer | 1.03 | 1.30 | 1.49 | 1.75 | 1.23 | 1.7 |
| drying tube | 0.87 | 1.09 | 1.18 | 1.42 | 0.86 | 1.7 |
| stopwatch | 1.16 | 1.38 | 1.62 | 1.83 | 1.40 | 1.6 |
| ouroboros | 1.15 | 1.22 | 1.19 | 0.78 | 1.07 | 1.6 |
| lead into gold | 2.57 | 2.94 | 1.89 | 2.76 | 2.72 | 1.6 |
| carousel | 0.48 | 0.44 | 0.32 | 0.50 | 0.40 | 1.5 |
| fume hood | 1.25 | 1.34 | 1.92 | 1.75 | 1.55 | 1.5 |
| sieves | 0.82 | 0.90 | 1.21 | 1.21 | 0.79 | 1.5 |
| scrubber | 1.61 | 1.26 | 1.18 | 1.20 | 1.81 | 1.5 |
| black cat | 0.82 | 0.98 | 0.79 | 0.65 | 0.75 | 1.5 |
| elixir of life | 1.54 | 1.37 | 1.29 | 1.04 | 1.03 | 1.5 |
| hourglass | 1.54 | 1.37 | 1.29 | 1.04 | 1.03 | 1.5 |
| homunculus, in a jar | 1.20 | 1.79 | 1.35 | 1.36 | 1.23 | 1.5 |
| clamp | 1.03 | 0.84 | 1.05 | 0.96 | 0.71 | 1.5 |
| balance | 1.62 | 1.83 | 1.23 | 1.66 | 1.61 | 1.5 |
| spatula | 1.84 | 1.39 | 1.25 | 1.65 | 1.64 | 1.5 |
| cannula | 1.51 | 2.14 | 1.86 | 2.20 | 1.63 | 1.5 |
| philosopher's stone | 1.86 | 1.73 | 2.06 | 2.10 | 1.51 | 1.4 |
| burner | 1.42 | 1.36 | 1.15 | 1.05 | 1.45 | 1.4 |
| reflux | 1.39 | 1.61 | 1.50 | 1.57 | 1.23 | 1.3 |
| brass weights | 1.43 | 1.30 | 1.24 | 1.09 | 1.28 | 1.3 |
| grimoire | 1.06 | 1.36 | 1.17 | 1.18 | 1.12 | 1.3 |
| burette | 1.32 | 1.61 | 1.27 | 1.40 | 1.35 | 1.3 |
| aqua regia | 1.36 | 1.33 | 1.63 | 1.33 | 1.36 | 1.2 |
| recycler | 3.03 | 3.12 | 2.56 | 2.84 | 2.89 | 1.2 |
| magnet | 1.22 | 1.31 | 1.15 | 1.19 | 1.37 | 1.2 |
| raven | 1.00 | 1.02 | 1.18 | 1.00 | 1.00 | 1.2 |
| schlenk line | 1.89 | 1.81 | 1.66 | 1.83 | 1.77 | 1.1 |
| poster | 1.06 | 1.07 | 1.04 | 1.05 | 1.09 | 1.0 |
| expired milk | 1.07 | 1.06 | 1.10 | 1.10 | 1.10 | 1.0 |
| a signed pact | 3.00 | 3.00 | 3.00 | 3.00 | 3.00 | 1.0 |
| lab coat | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.0 |
| goggles | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.0 |
| grant proposal | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.0 |
| extinguisher | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.0 |
| the intern | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.0 |
| loupe | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.0 |
| monkey's paw | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.0 |
| cursed idol | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.0 |
| hand of glory | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.0 |

How big each family scores with no equipment (median of the log, as a total): arene 59755, cage 18583, chain 33256, ring 7137, sugar 3996.

## Pieces by kind of round

| Piece | back | broad | each | loose | plain | scarce | short |
|---|---|---|---|---|---|---|---|
| recycler | 14.59 | 3.25 | 1.40 | 2.96 | 2.56 | 1.12 | 1.63 |
| carousel | 0.71 | 0.44 | 1.16 | 0.20 | 0.32 | 0.53 | 0.68 |
| brass weights | 1.82 | 1.50 | 0.96 | 0.40 | 1.24 | 1.40 | 1.18 |
| stopper | 1.03 | 1.32 | 0.91 | 0.39 | 1.20 | 1.23 | 1.25 |
| black candle | 3.51 | 4.30 | 3.10 | 1.36 | 3.61 | 2.75 | 3.34 |
| index cards | 3.82 | 2.78 | 1.35 | 1.33 | 2.86 | 2.24 | 2.19 |
| drying tube | 1.54 | 1.02 | 1.34 | 0.56 | 1.18 | 1.06 | 1.28 |
| lead into gold | 2.15 | 1.74 | 4.70 | 2.06 | 1.89 | 2.16 | 1.95 |
| cold trap | 2.50 | 1.97 | 1.26 | 0.94 | 2.31 | 1.20 | 1.82 |
| seed crystal | 1.22 | 1.26 | 0.98 | 0.50 | 0.88 | 0.86 | 0.84 |
| mirror | 0.90 | 1.05 | 1.07 | 0.49 | 0.91 | 1.23 | 0.91 |
| ouroboros | 2.65 | 1.18 | 1.10 | 1.06 | 1.19 | 1.12 | 1.15 |
| timer | 1.25 | 0.84 | 0.58 | 0.50 | 0.80 | 0.88 | 0.72 |
| scrubber | 0.96 | 1.34 | 1.96 | 0.84 | 1.18 | 1.16 | 1.43 |
| sieves | 1.75 | 1.41 | 1.06 | 1.15 | 1.21 | 0.85 | 1.21 |
| coffee | 0.89 | 0.74 | 0.69 | 0.44 | 0.74 | 0.79 | 0.72 |
| fume hood | 1.74 | 1.92 | 1.28 | 0.95 | 1.92 | 1.48 | 1.69 |
| the Tower | 1.86 | 1.44 | 0.92 | 1.56 | 1.56 | 1.07 | 1.45 |
| balance | 1.39 | 1.28 | 2.48 | 1.34 | 1.23 | 1.39 | 1.27 |
| unlabeled bottle | 0.71 | 0.79 | 0.40 | 0.55 | 0.60 | 0.63 | 0.62 |
| litmus paper | 1.21 | 1.52 | 1.00 | 0.86 | 1.51 | 1.20 | 1.24 |
| cannula | 2.03 | 2.15 | 1.62 | 2.65 | 1.86 | 1.51 | 1.87 |
| goat sacrifice | 1.41 | 1.54 | 1.07 | 0.88 | 1.40 | 1.47 | 0.92 |
| magnet | 0.97 | 1.27 | 0.91 | 0.73 | 1.15 | 1.13 | 1.17 |
| black cat | 1.28 | 0.85 | 0.91 | 0.74 | 0.79 | 0.74 | 0.82 |

Only the 25 pieces that vary most are shown. Totals with no equipment by kind of round: back 26450, broad 39066, each 111525, loose 65973, plain 33256, scarce 17801, short 15851.

## Reagents

Each reagent added to the starting four, on all 23 molecules.

| Added | Worth |
|---|---|
| bh3 | 81.53 |
| hcl | 1.02 |
| nabh4 | 0.99 |
| snap | 0.94 |
| cyclize | 0.86 |
| aromatize | 0.66 |
| socl2 | 0.37 |
| wittig | 0.21 |
| memgbr | 0.15 |

## Numbers to beat

Round one, starting four reagents, no equipment, a player who always takes the biggest number. Seven plays a molecule.

| Molecule | Family | Number to beat | Lowest | Median | Highest | Median as a share |
|---|---|---|---|---|---|---|
| OCC12C3C4C1C5C2C3C45CO | cage | 210,000 | 16,159 | 16,159 | 95,141 | 0.08 |
| C=CCC(=O)CCC(=O)CC=C | chain | 73,000 | 5,784 | 9,578 | 40,338 | 0.13 |
| OCC(O)CO | sugar | 160,000 | 20,378 | 25,303 | 48,933 | 0.16 |
| CC(=O)CCC(O)C1=CC=CC=C1 | arene | 98,000 | 12,176 | 26,283 | 231,459 | 0.27 |
| C=CCC(O)CC(O)CC=C | chain | 75,000 | 8,878 | 20,614 | 1,306,041 | 0.27 |
| CC(=O)CCC(O)CC=C | chain | 57,000 | 9,438 | 15,678 | 129,369 | 0.28 |
| OCC(O)C(O)C(O)C(O)C=O | sugar | 1,000,000 | 260,912 | 292,593 | 456,263 | 0.29 |
| CC(O)CC(=O)CCC(Cl)CCC=C | chain | 24,000 | 4,685 | 7,968 | 19,006 | 0.33 |
| OCC1OC(O)C(O)C(O)C1O | sugar | 230,000 | 46,477 | 78,343 | 89,291 | 0.34 |
| C=CCC(O)CC=C | chain | 28,000 | 8,695 | 10,361 | 107,228 | 0.37 |
| CC(O)CCC=C | chain | 7,900 | 1,873 | 3,360 | 4,928 | 0.43 |
| OC(C=C)C1=CC=CC=C1 | arene | 200,000 | 47,238 | 90,263 | 196,657 | 0.45 |
| OCC1OC(O)CC1O | sugar | 21,000 | 5,434 | 10,304 | 19,089 | 0.49 |
| CC(O)CC(=O)C1=CC=CC=C1 | arene | 34,000 | 17,704 | 17,910 | 147,966 | 0.53 |
| O=C1CCC(CC=C)CC1 | ring | 9,200 | 2,110 | 4,910 | 8,068 | 0.53 |
| C=CCC(O)C1=CC=CC=C1 | arene | 210,000 | 21,962 | 120,118 | 153,882 | 0.57 |
| C=CC1CCC(O)CC1 | ring | 5,700 | 2,987 | 4,466 | 38,030 | 0.78 |
| OC1CCC(O)CC1 | ring | 21,000 | 18,023 | 28,160 | 144,794 | 1.34 |
| OC1CC2CC1C=C2 | cage | 2,300 | 1,550 | 3,819 | 8,504 | 1.66 |
| C=CC12C3C4C1C5C2C3C45CO | cage | 35,000 | 81,079 | 81,079 | 92,908 | 2.32 |
| OC1CC2CCC1C=C2 | cage | 1,400 | 1,550 | 3,579 | 5,590 | 2.56 |
| O=C1CCC(O)CC1C=C | ring | 12,000 | 16,162 | 31,093 | 597,553 | 2.59 |
| OC1C2CC3CC(C2)CC1C3 | cage | 470 | 1,892 | 4,543 | 4,543 | 9.67 |

- On 6 of 23 molecules the median play beats the number.
- The median share runs from 0.08 to 9.67, a factor of 126 between the hardest and easiest molecule.

## Method and limits

- **The player.** A simulated player who always takes the reaction that adds most. It never breaks a row on purpose, never spends a wish, never uses the fire extinguisher, and does not feed the circle. Pieces built around those cannot be judged here: black cat, monkey's paw, fire extinguisher, the intern, the pay pieces (goggles, grant proposal).
- **The rack.** The starting four plus hydroborate and add methyl. Pieces tied to other reagents (acids, halides) read low.
- **One round.** Round one of a run, level one of every piece. Nothing here covers nine rounds, levels, or the number to beat rising.
- **Noise.** Every comparison uses the same six molecules and the same five seeds with and without the piece, so the same deals are compared. Differences under about 5 percent are still not meaningful.
- **Averages are of logarithms**, so one huge round does not swamp the rest.
