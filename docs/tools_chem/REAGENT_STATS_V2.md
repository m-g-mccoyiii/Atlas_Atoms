# Overreact: how each reagent scores (current game)

Written by `RS_V2=1 python reagent_stats.py agg _rs_v2`. Tables only; the older page `REAGENT_STATS.md` describes the old starting six on the old C, H, O molecules and its remarks do not carry over.

## What was played

- **Starting six:** hydrate, oxidize, grow, thiolene, dehydrate, ritter. The twelve others are unlocks (hydroborate and reduce among them).
- **Molecules:** molecules v2 (`molecules2.deal`): the round's pool with chance `P_POOL`, else the generator; 10 to 35 heavy atoms by round; they hold N, S and Cl. Rounds 1 to 9 equally. The columns "made molecules" are empty: every molecule is the game's.
- **Reflexes held:** rounds 1 to 3 the ten a new run holds (ring, dry, weld, shift, tuck, flip, snap, knit, cap, close); rounds 4 to 9 all thirteen (plus seal, open, fold). The engine has no "across the fold" reflexes.
- **Rounds played:** 74,736 (main 28,080, pairs 46,656, specs 0, other reflex sets 0).
- **fit:** 2700 molecules played, 0 skipped (the engine could not play them), 32 s on 6 worker processes; dealt from the pool 1807, from the generator 893, generator failed and the pool was used 0.
- **main:** 648 molecules played, 0 skipped (the engine could not play them), 855 s on 6 worker processes; dealt from the pool 437, from the generator 211, generator failed and the pool was used 0.
- **main:** 180 molecules played, 0 skipped (the engine could not play them), 2312 s on 6 worker processes; dealt from the pool 123, from the generator 57, generator failed and the pool was used 0.
- **pairs:** 243 molecules played, 0 skipped (the engine could not play them), 914 s on 6 worker processes; dealt from the pool 167, from the generator 76, generator failed and the pool was used 0.
- **reach:** 900 molecules played, 0 skipped (the engine could not play them), 40 s on 6 worker processes; dealt from the pool 601, from the generator 299, generator failed and the pool was used 0.

## Words

- **Dud:** a reagent that never acts; it takes a place in the bag and the deal. Every reagent is compared with a dud in its place (a starter: the six with it replaced by a dud; an unlock: the six plus it against the six plus a dud).
- **Yield change vs a dud:** mean yield with the reagent over mean yield with a dud, minus one. **Vs the six alone:** the same against the plain six (a starter: the other five).
- **STRENGTH:** for two players (greedy, look-ahead) and three bands (rounds 1 to 3, 4 to 6, 7 to 9), mean yield with over mean yield with a dud; the six numbers averaged; divided by the same averaged over the six starters. A dud scores 0.59.
- **Ratio** (per round): (yield with + 50) over (yield without + 50). **Swing:** spread of the log of the ratio. **Rounds it changes:** share of rounds where the yield differs at all.
- **Fit at round start:** share of dealt molecules the reagent has something to act on before anything is fired. **Can act in some line:** share where some line of three from the six and the reagent makes it act.
- **Bonus** (pairs): yield together over base, minus A over base, minus B over base, plus one; all four bags the same size (duds fill the gaps). Pairs of two starters are measured in a small bag (four starters and two duds) and read large.
- The flags (DEAD, NEAR-DEAD, CROWDS, DOMINATES, pairs with) are set by the same rules as the older page.

## The one table

| Rank | Reagent | Held | STRENGTH | 90% range | Yield change vs a dud | Yield change vs the six alone | Median round ratio | Fit at round start | Can act in some line | Swing | Rounds it changes | Best partner (bonus) | Flags |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | oxidize | start | 1.91 | 1.83 to 2.00 | +225% | +202% | 2.55 | 72% | 99% | 0.69 | 95% | grow (+129%) | pairs with grow, dihydroxylation, hwe |
| 2 | grow | start | 1.54 | 1.47 to 1.62 | +162% | +139% | 2.00 | 91% | 98% | 0.65 | 94% | ozonolysis (+138%) | pairs with ozonolysis, oxidize, hydroformylation |
| 3 | ozonolysis | unlock | 1.14 | 1.11 to 1.17 | +94% | +58% | 1.78 | 90% | 100% | 0.61 | 90% | grow (+138%) | pairs with grow, dehydrate |
| 4 | epoxidation | unlock | 1.03 | 1.00 to 1.06 | +75% | +42% | 1.34 | 90% | 100% | 0.65 | 72% | grow (+67%) | pairs with grow |
| 5 | hydroformylation | unlock | 0.90 | 0.87 to 0.92 | +52% | +24% | 1.42 | 90% | 100% | 0.55 | 83% | grow (+85%) | pairs with grow |
| 6 | dihydroxylation | unlock | 0.85 | 0.83 to 0.87 | +44% | +17% | 1.25 | 90% | 100% | 0.51 | 74% | oxidize (+79%) | pairs with oxidize, grow |
| 7 | hwe | unlock | 0.74 | 0.73 to 0.76 | +26% | +2% | 1.10 | 40% | 82% | 0.34 | 65% | oxidize (+28%) | pairs with oxidize |
| 8 | dehydrate | start | 0.70 | 0.69 to 0.72 | +19% | -2% | 1.09 | 63% | 99% | 0.37 | 79% | ozonolysis (+26%) | pairs with ozonolysis |
| 9 | hydrate | start | 0.68 | 0.67 to 0.70 | +16% | -9% | 1.12 | 90% | 100% | 0.61 | 90% | dehydrate (+11%) | CROWDS (the deal is better without it) |
| 10 | chugaev | unlock | 0.67 | 0.66 to 0.68 | +14% | -7% | 1.00 | 63% | 99% | 0.29 | 54% | hydroformylation (+14%) |  |
| 11 | hydroborate | unlock | 0.67 | 0.66 to 0.68 | +14% | -8% | 1.00 | 90% | 100% | 0.41 | 54% | oxidize (+21%) | pairs with oxidize |
| 12 | hofmann | unlock | 0.65 | 0.64 to 0.66 | +11% | -10% | 1.00 | 19% | 99% | 0.29 | 43% | ritter (+12%) |  |
| 13 | cyanohydrin | unlock | 0.61 | 0.60 to 0.61 | +3% | -16% | 1.00 | 50% | 95% | 0.24 | 44% | oxidize (+5%) | NEAR-DEAD |
| 14 | reduce | unlock | 0.60 | 0.59 to 0.60 | +1% | -18% | 1.00 | 36% | 93% | 0.17 | 24% | hydroformylation (+10%) |  |
| 15 | thiolene | start | 0.59 | 0.58 to 0.60 | +0% | -21% | 1.00 | 90% | 100% | 0.34 | 60% | oxidize (+15%) | CROWDS (the deal is better without it) |
| 16 | chlorination | unlock | 0.58 | 0.58 to 0.59 | -1% | -20% | 1.00 | 61% | 99% | 0.24 | 31% | hydroformylation (+3%) | NEAR-DEAD |
| 17 | permanganate | unlock | 0.58 | 0.57 to 0.58 | -2% | -20% | 1.00 | 65% | 98% | 0.23 | 34% | dihydroxylation (+4%) | NEAR-DEAD |
| 18 | ritter | start | 0.58 | 0.57 to 0.58 | -2% | -23% | 1.00 | 90% | 100% | 0.25 | 36% | hofmann (+12%) | CROWDS (the deal is better without it) |

## Pairs worth more together than apart

| A | B | A alone | B alone | Together | Bonus over adding | 90% range | Together / (A + B - 1) |
|---|---|---|---|---|---|---|---|
| grow | ozonolysis | 1.85 | 1.53 | 3.76 | +138% | +116 to +157 | 1.58 |
| oxidize | grow | 1.26 | 1.01 | 2.56 | +129% | +113 to +149 | 2.02 |
| grow | hydroformylation | 1.85 | 1.23 | 2.93 | +85% | +73 to +100 | 1.41 |
| oxidize | dihydroxylation | 2.27 | 1.23 | 3.29 | +79% | +63 to +98 | 1.31 |
| grow | epoxidation | 1.85 | 1.72 | 3.25 | +67% | +48 to +89 | 1.26 |
| grow | dihydroxylation | 1.85 | 1.36 | 2.68 | +47% | +34 to +61 | 1.21 |
| oxidize | hwe | 2.27 | 1.20 | 2.75 | +28% | +17 to +41 | 1.12 |
| dehydrate | ozonolysis | 1.10 | 1.86 | 2.22 | +26% | +13 to +39 | 1.13 |
| oxidize | hydroborate | 2.27 | 1.02 | 2.51 | +21% | +13 to +31 | 1.09 |

## Pairs that give less together than the sum

| A | B | A alone | B alone | Together | Bonus over adding | 90% range | Together / (A + B - 1) |
|---|---|---|---|---|---|---|---|
| oxidize | dehydrate | 4.21 | 1.84 | 4.66 | -39% | -62 to -20 | 0.92 |
| ozonolysis | epoxidation | 1.96 | 1.77 | 2.41 | -33% | -46 to -18 | 0.88 |

## Pairs that spoil each other

(none)

## Alone value

| Reagent | Dealt (per page) | Fired when dealt | In a best line (ties count) | Best line worse without it | How much worse | Ratio mean | median | p10 | p90 | Ratio of mean yields | Mean yield with / without a dud |
|---|---|---|---|---|---|---|---|---|---|---|---|
| oxidize | 80% | 82% | 96% | 67% | 55% | 3.46 | 2.55 | 1.12 | 6.75 | 2.96 | 767 / 259 |
| grow | 81% | 77% | 97% | 62% | 47% | 2.85 | 2.00 | 1.00 | 5.50 | 2.40 | 767 / 319 |
| ozonolysis | 70% | 76% | 96% | 65% | 45% | 2.48 | 1.78 | 1.00 | 4.50 | 1.96 | 1227 / 626 |
| epoxidation | 72% | 59% | 91% | 50% | 42% | 2.19 | 1.34 | 0.90 | 3.44 | 1.77 | 1110 / 626 |
| hydroformylation | 71% | 66% | 93% | 50% | 32% | 1.95 | 1.42 | 1.00 | 3.32 | 1.53 | 960 / 626 |
| dihydroxylation | 72% | 60% | 90% | 34% | 21% | 1.72 | 1.25 | 1.00 | 2.65 | 1.44 | 900 / 626 |
| hwe | 73% | 56% | 87% | 33% | 23% | 1.32 | 1.10 | 1.00 | 1.95 | 1.25 | 784 / 626 |
| dehydrate | 84% | 52% | 85% | 33% | 24% | 1.21 | 1.09 | 0.77 | 1.63 | 1.17 | 767 / 658 |
| hydrate | 83% | 53% | 83% | 27% | 18% | 1.49 | 1.12 | 0.62 | 2.57 | 1.16 | 767 / 659 |
| chugaev | 73% | 50% | 88% | 25% | 16% | 1.15 | 1.00 | 0.87 | 1.58 | 1.13 | 710 / 626 |
| hydroborate | 72% | 45% | 85% | 16% | 10% | 1.31 | 1.00 | 0.86 | 1.75 | 1.14 | 712 / 626 |
| hofmann | 73% | 45% | 78% | 23% | 17% | 1.19 | 1.00 | 1.00 | 1.61 | 1.11 | 696 / 626 |
| cyanohydrin | 73% | 43% | 82% | 16% | 11% | 1.06 | 1.00 | 0.86 | 1.32 | 1.03 | 645 / 626 |
| reduce | 73% | 34% | 76% | 6% | 5% | 1.03 | 1.00 | 1.00 | 1.12 | 1.01 | 634 / 626 |
| thiolene | 85% | 28% | 72% | 6% | 3% | 1.06 | 1.00 | 0.69 | 1.41 | 1.00 | 767 / 768 |
| chlorination | 72% | 35% | 75% | 9% | 8% | 1.01 | 1.00 | 0.84 | 1.14 | 0.99 | 619 / 626 |
| permanganate | 73% | 33% | 75% | 7% | 6% | 1.00 | 1.00 | 0.80 | 1.14 | 0.98 | 616 / 626 |
| ritter | 86% | 24% | 67% | 1% | 1% | 1.00 | 1.00 | 0.75 | 1.13 | 0.98 | 767 / 783 |

By player, and against the six alone:

| Reagent | Greedy: ratio of means | median | Look-ahead: ratio of means | median | Against the six alone: mean / median ratio |
|---|---|---|---|---|---|
| oxidize | 2.64 | 2.31 | 3.80 | 3.50 | 3.19 / 2.29 |
| grow | 2.21 | 1.89 | 2.86 | 2.60 | 2.56 / 1.86 |
| ozonolysis | 2.02 | 1.78 | 1.84 | 1.79 | 2.06 / 1.52 |
| epoxidation | 1.68 | 1.26 | 1.94 | 1.57 | 1.92 / 1.20 |
| hydroformylation | 1.58 | 1.42 | 1.45 | 1.39 | 1.63 / 1.25 |
| dihydroxylation | 1.45 | 1.19 | 1.42 | 1.41 | 1.53 / 1.14 |
| hwe | 1.23 | 1.07 | 1.29 | 1.18 | 1.18 / 1.00 |
| dehydrate | 1.12 | 1.05 | 1.27 | 1.18 | 0.97 / 0.93 |
| hydrate | 1.17 | 1.12 | 1.16 | 1.12 | 1.04 / 0.98 |
| chugaev | 1.11 | 1.00 | 1.17 | 1.06 | 1.06 / 1.00 |
| hydroborate | 1.13 | 1.00 | 1.15 | 1.00 | 1.18 / 1.00 |
| hofmann | 1.12 | 1.00 | 1.09 | 1.00 | 1.08 / 1.00 |
| cyanohydrin | 1.03 | 1.00 | 1.04 | 1.00 | 0.96 / 0.94 |
| reduce | 1.01 | 1.00 | 1.02 | 1.00 | 0.95 / 0.91 |
| thiolene | 0.99 | 1.00 | 1.01 | 1.00 | 0.86 / 0.86 |
| chlorination | 0.99 | 1.00 | 0.99 | 1.00 | 0.94 / 0.90 |
| permanganate | 0.98 | 1.00 | 0.99 | 1.00 | 0.93 / 0.88 |
| ritter | 0.97 | 1.00 | 1.00 | 1.00 | 0.83 / 0.83 |

## Fit rate

| Reagent | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | game molecules | made molecules |
|---|---|---|---|---|---|---|---|---|---|---|---|
| oxidize | 58% | 66% | 71% | 66% | 71% | 77% | 88% | 75% | 76% | 72% | - |
| grow | 95% | 100% | 85% | 89% | 93% | 96% | 92% | 83% | 89% | 91% | - |
| ozonolysis | 100% | 93% | 75% | 88% | 90% | 100% | 92% | 89% | 85% | 90% | - |
| epoxidation | 100% | 93% | 75% | 88% | 90% | 100% | 92% | 89% | 85% | 90% | - |
| hydroformylation | 100% | 93% | 75% | 88% | 90% | 100% | 92% | 89% | 85% | 90% | - |
| dihydroxylation | 100% | 93% | 75% | 88% | 90% | 100% | 92% | 89% | 85% | 90% | - |
| hwe | 33% | 36% | 27% | 37% | 44% | 41% | 48% | 43% | 52% | 40% | - |
| dehydrate | 48% | 60% | 55% | 50% | 64% | 70% | 79% | 73% | 72% | 63% | - |
| hydrate | 100% | 93% | 75% | 88% | 90% | 100% | 92% | 89% | 85% | 90% | - |
| chugaev | 48% | 60% | 55% | 50% | 64% | 70% | 79% | 73% | 72% | 63% | - |
| hydroborate | 100% | 93% | 75% | 88% | 90% | 100% | 92% | 89% | 85% | 90% | - |
| hofmann | 4% | 0% | 4% | 23% | 25% | 23% | 31% | 32% | 33% | 19% | - |
| cyanohydrin | 48% | 57% | 42% | 46% | 55% | 47% | 54% | 47% | 55% | 50% | - |
| reduce | 37% | 36% | 30% | 28% | 44% | 29% | 40% | 42% | 37% | 36% | - |
| thiolene | 100% | 93% | 75% | 88% | 90% | 100% | 92% | 89% | 85% | 90% | - |
| chlorination | 36% | 42% | 53% | 55% | 58% | 70% | 86% | 74% | 75% | 61% | - |
| permanganate | 76% | 62% | 72% | 59% | 76% | 59% | 64% | 62% | 57% | 65% | - |
| ritter | 100% | 93% | 75% | 88% | 90% | 100% | 92% | 89% | 85% | 90% | - |

Acts somewhere in some line of three made from the six and itself:

| Reagent | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | all |
|---|---|---|---|---|---|---|---|---|---|---|
| oxidize | 100% | 100% | 100% | 100% | 100% | 100% | 96% | 96% | 95% | 99% |
| grow | 100% | 100% | 98% | 100% | 100% | 100% | 96% | 96% | 95% | 98% |
| ozonolysis | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| epoxidation | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| hydroformylation | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| dihydroxylation | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| hwe | 89% | 87% | 89% | 72% | 83% | 84% | 77% | 79% | 80% | 82% |
| dehydrate | 100% | 100% | 94% | 99% | 100% | 100% | 100% | 100% | 100% | 99% |
| hydrate | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| chugaev | 100% | 100% | 94% | 99% | 100% | 100% | 100% | 100% | 100% | 99% |
| hydroborate | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| hofmann | 100% | 100% | 88% | 99% | 100% | 100% | 100% | 100% | 100% | 99% |
| cyanohydrin | 100% | 95% | 94% | 97% | 98% | 100% | 95% | 86% | 88% | 95% |
| reduce | 98% | 94% | 90% | 91% | 98% | 98% | 95% | 86% | 89% | 93% |
| thiolene | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| chlorination | 100% | 100% | 100% | 100% | 100% | 100% | 96% | 96% | 95% | 99% |
| permanganate | 100% | 100% | 98% | 100% | 100% | 100% | 96% | 96% | 95% | 98% |
| ritter | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |

On the page, when dealt:

| Reagent | Something to act on when dealt (page start) | Acts when fired | Places it acts at (mean, when it acts) |
|---|---|---|---|
| oxidize | 53% | 84% | 2.6 |
| grow | 84% | 90% | 2.0 |
| ozonolysis | 59% | 92% | 2.5 |
| epoxidation | 56% | 82% | 2.8 |
| hydroformylation | 61% | 88% | 2.5 |
| dihydroxylation | 58% | 73% | 2.2 |
| hwe | 42% | 66% | 1.3 |
| dehydrate | 58% | 72% | 2.3 |
| hydrate | 67% | 80% | 2.0 |
| chugaev | 49% | 66% | 2.0 |
| hydroborate | 61% | 68% | 2.2 |
| hofmann | 22% | 55% | 1.8 |
| cyanohydrin | 48% | 50% | 1.4 |
| reduce | 42% | 35% | 1.3 |
| thiolene | 67% | 62% | 1.8 |
| chlorination | 42% | 38% | 1.6 |
| permanganate | 57% | 43% | 1.5 |
| ritter | 67% | 55% | 1.7 |

## What it sets off

| Reagent | Reflex steps after it (per firing) | when it acts | Sets off any | Sets off 3+ | Reflexes after it (per firing) | Runoff from the reagent itself (per firing) | Runoff from the reflexes it sets off (per firing) |
|---|---|---|---|---|---|---|---|
| oxidize | 1.73 | 2.05 | 77% | 30% | dry 0.57, weld 0.40, shift 0.23, ring 0.19 | carbon dioxide 1.14, hydrogen 1.08 | water 0.57, acid fumes 0.00 |
| grow | 0.08 | 0.09 | 8% | 0% | snap 0.05, seal 0.02, close 0.02, fold 0.00 | - | water 0.02, acid fumes 0.02 |
| ozonolysis | 2.19 | 2.38 | 87% | 39% | weld 0.84, ring 0.57, dry 0.49, knit 0.10 | piece 1.27 | water 0.50, acid fumes 0.01 |
| epoxidation | 2.45 | 3.00 | 77% | 45% | fold 1.04, open 0.96, weld 0.16, dry 0.15 | - | water 0.16, acid fumes 0.01 |
| hydroformylation | 1.74 | 1.96 | 78% | 26% | ring 0.67, weld 0.57, dry 0.36, knit 0.04 | - | water 0.38, acid fumes 0.01 |
| dihydroxylation | 1.06 | 1.44 | 43% | 21% | dry 0.33, ring 0.31, flip 0.25, weld 0.06 | - | water 0.35, acid fumes 0.01 |
| hwe | 1.07 | 1.62 | 58% | 13% | ring 0.32, weld 0.18, shift 0.14, dry 0.13 | - | water 0.13, acid fumes 0.01 |
| dehydrate | 0.95 | 1.33 | 56% | 9% | snap 0.48, shift 0.29, dry 0.05, weld 0.04 | water 1.62 | acid fumes 0.00, water 0.05 |
| hydrate | 0.82 | 1.02 | 51% | 6% | dry 0.41, ring 0.20, tuck 0.06, knit 0.04 | - | water 0.43, acid fumes 0.01 |
| chugaev | 0.96 | 1.45 | 57% | 10% | shift 0.54, snap 0.27, dry 0.05, weld 0.04 | sulfur 1.32 | water 0.05, acid fumes 0.00 |
| hydroborate | 0.37 | 0.55 | 23% | 3% | ring 0.16, dry 0.10, weld 0.03, tuck 0.03 | - | water 0.11, acid fumes 0.01 |
| hofmann | 0.68 | 1.24 | 46% | 5% | shift 0.51, dry 0.06, snap 0.04, ring 0.02 | trimethylamine 1.01, water 1.01 | water 0.06, acid fumes 0.00 |
| cyanohydrin | 0.55 | 1.12 | 37% | 3% | seal 0.32, dry 0.08, shift 0.04, tuck 0.04 | ammonia 0.70 | water 0.40, acid fumes 0.01 |
| reduce | 0.28 | 0.81 | 20% | 1% | dry 0.08, tuck 0.05, ring 0.04, shift 0.04 | - | acid fumes 0.01, water 0.08 |
| thiolene | 0.48 | 0.78 | 34% | 3% | cap 0.31, dry 0.07, weld 0.03, ring 0.02 | - | water 0.08, acid fumes 0.01 |
| chlorination | 0.41 | 1.08 | 28% | 3% | close 0.28, dry 0.05, shift 0.03, knit 0.02 | acid fumes 0.63 | acid fumes 0.28, water 0.05 |
| permanganate | 0.40 | 0.94 | 26% | 4% | seal 0.29, dry 0.03, shift 0.02, knit 0.01 | carbon dioxide 0.36, hydrogen 0.03 | water 0.32, acid fumes 0.01 |
| ritter | 0.37 | 0.68 | 28% | 2% | knit 0.22, dry 0.07, weld 0.02, cap 0.02 | - | water 0.08, acid fumes 0.01 |

## Value by position in the line

| Reagent | 1st: share of firings | steps after it | page pay | best-line gain if put here | 2nd: share of firings | steps after it | page pay | best-line gain if put here | 3rd: share of firings | steps after it | page pay | best-line gain if put here |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| oxidize | 29% | 1.50 | 348 | 119 | 34% | 1.74 | 276 | 121 | 37% | 1.90 | 291 | 137 |
| grow | 44% | 0.08 | 266 | 91 | 40% | 0.07 | 327 | 104 | 16% | 0.12 | 171 | 40 |
| ozonolysis | 22% | 2.10 | 471 | 118 | 26% | 2.09 | 439 | 138 | 52% | 2.29 | 542 | 224 |
| epoxidation | 24% | 2.63 | 898 | 228 | 18% | 1.95 | 454 | 164 | 58% | 2.54 | 768 | 338 |
| hydroformylation | 26% | 1.70 | 348 | 68 | 23% | 1.56 | 263 | 53 | 50% | 1.84 | 388 | 111 |
| dihydroxylation | 33% | 1.82 | 315 | 45 | 43% | 0.70 | 353 | 69 | 24% | 0.65 | 249 | 43 |
| hwe | 26% | 1.09 | 229 | 30 | 24% | 0.75 | 276 | 34 | 50% | 1.22 | 347 | 70 |
| dehydrate | 30% | 1.10 | 290 | 42 | 24% | 0.52 | 240 | 39 | 46% | 1.08 | 325 | 69 |
| hydrate | 36% | 1.27 | 179 | 21 | 37% | 0.56 | 224 | 30 | 27% | 0.58 | 197 | 21 |
| chugaev | 30% | 1.21 | 328 | 31 | 22% | 0.47 | 161 | 19 | 48% | 1.04 | 351 | 56 |
| hydroborate | 29% | 0.87 | 178 | 10 | 43% | 0.13 | 270 | 30 | 28% | 0.24 | 149 | 7 |
| hofmann | 32% | 0.84 | 268 | 32 | 28% | 0.43 | 163 | 25 | 39% | 0.74 | 232 | 36 |
| cyanohydrin | 26% | 0.68 | 133 | 9 | 31% | 0.32 | 178 | 16 | 43% | 0.64 | 243 | 28 |
| reduce | 31% | 0.43 | 133 | 5 | 32% | 0.24 | 157 | 6 | 37% | 0.20 | 130 | 6 |
| thiolene | 26% | 0.71 | 163 | 2 | 29% | 0.24 | 131 | 2 | 45% | 0.51 | 229 | 6 |
| chlorination | 30% | 0.48 | 144 | 6 | 32% | 0.27 | 127 | 6 | 38% | 0.49 | 117 | 8 |
| permanganate | 27% | 0.53 | 101 | 4 | 29% | 0.27 | 122 | 5 | 44% | 0.42 | 144 | 7 |
| ritter | 26% | 0.60 | 104 | 0 | 28% | 0.26 | 132 | 0 | 47% | 0.31 | 202 | 1 |

## Value by round

| Reagent | early 1-3: ratio of means | median | fired when dealt | best line worse without it | mid 4-6: ratio of means | median | fired when dealt | best line worse without it | late 7-9: ratio of means | median | fired when dealt | best line worse without it |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| oxidize | 2.87 | 2.50 | 83% | 66% | 3.44 | 2.94 | 83% | 68% | 2.69 | 2.30 | 82% | 66% |
| grow | 2.52 | 2.17 | 79% | 65% | 2.97 | 2.37 | 78% | 66% | 1.99 | 1.78 | 73% | 54% |
| ozonolysis | 2.01 | 1.77 | 73% | 63% | 2.06 | 1.84 | 79% | 68% | 1.83 | 1.72 | 75% | 65% |
| epoxidation | 0.96 | 1.00 | 24% | 0% | 2.02 | 1.88 | 77% | 77% | 2.13 | 1.95 | 76% | 75% |
| hydroformylation | 1.57 | 1.40 | 66% | 51% | 1.68 | 1.59 | 69% | 52% | 1.39 | 1.31 | 65% | 48% |
| dihydroxylation | 1.52 | 1.35 | 61% | 35% | 1.49 | 1.33 | 59% | 35% | 1.33 | 1.13 | 61% | 32% |
| hwe | 1.26 | 1.10 | 53% | 32% | 1.28 | 1.12 | 59% | 36% | 1.22 | 1.08 | 55% | 32% |
| dehydrate | 1.15 | 1.10 | 48% | 28% | 1.19 | 1.11 | 52% | 36% | 1.16 | 1.09 | 57% | 36% |
| hydrate | 1.16 | 1.13 | 54% | 29% | 1.18 | 1.12 | 50% | 26% | 1.15 | 1.08 | 56% | 25% |
| chugaev | 1.09 | 1.00 | 48% | 21% | 1.17 | 1.00 | 52% | 28% | 1.13 | 1.00 | 51% | 27% |
| hydroborate | 1.11 | 1.00 | 41% | 12% | 1.15 | 1.00 | 47% | 17% | 1.14 | 1.00 | 46% | 17% |
| hofmann | 1.10 | 1.00 | 43% | 21% | 1.11 | 1.00 | 46% | 23% | 1.12 | 1.00 | 46% | 24% |
| cyanohydrin | 1.00 | 1.00 | 35% | 6% | 1.05 | 1.00 | 47% | 23% | 1.03 | 1.00 | 47% | 20% |
| reduce | 1.01 | 1.00 | 34% | 5% | 1.02 | 1.00 | 36% | 7% | 1.01 | 1.00 | 34% | 5% |
| thiolene | 1.02 | 1.00 | 27% | 6% | 0.99 | 1.00 | 28% | 6% | 0.99 | 1.00 | 27% | 4% |
| chlorination | 0.98 | 1.00 | 35% | 9% | 0.99 | 1.00 | 34% | 8% | 0.99 | 1.00 | 35% | 10% |
| permanganate | 0.96 | 1.00 | 26% | 1% | 0.98 | 1.00 | 37% | 11% | 1.00 | 1.00 | 34% | 9% |
| ritter | 0.97 | 1.00 | 25% | 1% | 0.98 | 1.00 | 23% | 1% | 0.98 | 1.00 | 24% | 1% |

| Reagent | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 |
|---|---|---|---|---|---|---|---|---|---|
| oxidize | 2.51 | 2.77 | 3.36 | 3.95 | 3.47 | 3.13 | 2.91 | 2.67 | 2.53 |
| grow | 2.27 | 2.50 | 2.76 | 3.46 | 2.76 | 2.86 | 2.27 | 2.01 | 1.77 |
| ozonolysis | 2.37 | 1.85 | 1.89 | 2.18 | 2.02 | 2.02 | 1.98 | 1.76 | 1.78 |
| epoxidation | 0.94 | 0.98 | 0.96 | 1.86 | 2.11 | 2.07 | 2.25 | 2.05 | 2.12 |
| hydroformylation | 1.81 | 1.58 | 1.37 | 1.83 | 1.68 | 1.56 | 1.58 | 1.32 | 1.29 |
| dihydroxylation | 1.69 | 1.47 | 1.43 | 1.53 | 1.52 | 1.45 | 1.41 | 1.33 | 1.27 |
| hwe | 1.23 | 1.29 | 1.26 | 1.26 | 1.30 | 1.29 | 1.25 | 1.21 | 1.20 |
| dehydrate | 1.14 | 1.15 | 1.15 | 1.15 | 1.22 | 1.19 | 1.18 | 1.13 | 1.18 |
| hydrate | 1.08 | 1.16 | 1.24 | 1.15 | 1.15 | 1.23 | 1.21 | 1.10 | 1.14 |
| chugaev | 1.07 | 1.10 | 1.10 | 1.17 | 1.18 | 1.17 | 1.14 | 1.14 | 1.12 |
| hydroborate | 1.11 | 1.15 | 1.07 | 1.12 | 1.16 | 1.16 | 1.18 | 1.13 | 1.12 |
| hofmann | 1.16 | 1.06 | 1.08 | 1.14 | 1.13 | 1.08 | 1.11 | 1.13 | 1.12 |
| cyanohydrin | 0.99 | 0.99 | 1.01 | 1.05 | 1.10 | 1.02 | 1.06 | 1.03 | 1.02 |
| reduce | 0.99 | 1.01 | 1.02 | 1.02 | 1.04 | 1.01 | 1.01 | 1.00 | 1.01 |
| thiolene | 1.00 | 1.05 | 1.00 | 1.01 | 1.00 | 0.97 | 1.01 | 1.02 | 0.96 |
| chlorination | 0.98 | 0.99 | 0.98 | 1.00 | 1.03 | 0.95 | 0.99 | 0.98 | 1.00 |
| permanganate | 0.95 | 0.96 | 0.97 | 0.98 | 1.00 | 0.97 | 1.01 | 0.98 | 1.01 |
| ritter | 0.99 | 0.98 | 0.96 | 0.99 | 0.98 | 0.98 | 0.98 | 0.98 | 0.98 |

## Partners

| Reagent | Best partner | 2nd | 3rd | Worst partner |
|---|---|---|---|---|
| oxidize | grow (+129%, together 2.56) | dihydroxylation (+79%, together 3.29) | hwe (+28%, together 2.75) | dehydrate (-39%) |
| grow | ozonolysis (+138%, together 3.76) | oxidize (+129%, together 2.56) | hydroformylation (+85%, together 2.93) | hydrate (-17%) |
| ozonolysis | grow (+138%, together 3.76) | dehydrate (+26%, together 2.22) | hwe (+17%, together 2.31) | epoxidation (-33%) |
| epoxidation | grow (+67%, together 3.25) | hwe (+17%, together 2.12) | chugaev (+10%, together 1.94) | ozonolysis (-33%) |
| hydroformylation | grow (+85%, together 2.93) | hwe (+19%, together 1.96) | chugaev (+14%, together 1.81) | oxidize (-21%) |
| dihydroxylation | oxidize (+79%, together 3.29) | grow (+47%, together 2.68) | hwe (+21%, together 1.83) | ozonolysis (-21%) |
| hwe | oxidize (+28%, together 2.75) | dihydroxylation (+21%, together 1.83) | hydroformylation (+19%, together 1.96) | dehydrate (-6%) |
| dehydrate | ozonolysis (+26%, together 2.22) | hydrate (+11%, together 1.18) | epoxidation (+9%, together 1.92) | oxidize (-39%) |
| hydrate | dehydrate (+11%, together 1.18) | chugaev (+8%, together 1.34) | thiolene (+4%, together 1.17) | ozonolysis (-23%) |
| chugaev | hydroformylation (+14%, together 1.81) | ozonolysis (+12%, together 2.16) | epoxidation (+10%, together 1.94) | dehydrate (-7%) |
| hydroborate | oxidize (+21%, together 2.51) | grow (+11%, together 2.04) | chugaev (+3%, together 1.21) | hydrate (-12%) |
| hofmann | ritter (+12%, together 1.13) | hydroformylation (+4%, together 1.74) | hwe (+2%, together 1.30) | grow (-9%) |
| cyanohydrin | oxidize (+5%, together 2.37) | hydroformylation (+4%, together 1.65) | dihydroxylation (+3%, together 1.49) | epoxidation (-5%) |
| reduce | hydroformylation (+10%, together 1.68) | oxidize (+3%, together 2.31) | hofmann (+1%, together 1.12) | ritter (-3%) |
| thiolene | oxidize (+15%, together 2.39) | grow (+11%, together 1.95) | hydrate (+4%, together 1.17) | hydroformylation (-7%) |
| chlorination | hydroformylation (+3%, together 1.61) | dehydrate (+3%, together 1.09) | thiolene (+1%, together 1.01) | oxidize (-16%) |
| permanganate | dihydroxylation (+4%, together 1.45) | hydroformylation (+3%, together 1.58) | dehydrate (+2%, together 1.08) | oxidize (-11%) |
| ritter | hofmann (+12%, together 1.13) | permanganate (+1%, together 0.98) | chlorination (-0%, together 0.99) | dihydroxylation (-8%) |

## Swing

| Reagent | Swing (spread of log ratio) | Rounds changed | Better | Worse | Ratio 1.5+ | Yield change p10 | p90 | sd | Ratio p10 | p90 |
|---|---|---|---|---|---|---|---|---|---|---|
| oxidize | 0.69 | 95% | 92% | 4% | 78% | +50 | +1114 | 459 | 1.12 | 6.75 |
| grow | 0.65 | 94% | 90% | 4% | 70% | +0 | +1026 | 443 | 1.00 | 5.50 |
| ozonolysis | 0.61 | 90% | 85% | 5% | 63% | +0 | +1362 | 535 | 1.00 | 4.50 |
| epoxidation | 0.65 | 72% | 61% | 11% | 44% | -50 | +1388 | 723 | 0.90 | 3.44 |
| hydroformylation | 0.55 | 83% | 75% | 8% | 45% | +0 | +850 | 395 | 1.00 | 3.32 |
| dihydroxylation | 0.51 | 74% | 64% | 10% | 38% | +0 | +800 | 369 | 1.00 | 2.65 |
| hwe | 0.34 | 65% | 55% | 9% | 23% | +0 | +550 | 295 | 1.00 | 1.95 |
| dehydrate | 0.37 | 79% | 56% | 22% | 14% | -150 | +412 | 282 | 0.77 | 1.63 |
| hydrate | 0.61 | 90% | 56% | 34% | 29% | -326 | +589 | 415 | 0.62 | 2.57 |
| chugaev | 0.29 | 54% | 40% | 14% | 12% | -62 | +350 | 244 | 0.87 | 1.58 |
| hydroborate | 0.41 | 54% | 38% | 15% | 15% | -76 | +388 | 241 | 0.86 | 1.75 |
| hofmann | 0.29 | 43% | 38% | 5% | 12% | +0 | +275 | 171 | 1.00 | 1.61 |
| cyanohydrin | 0.24 | 44% | 28% | 16% | 5% | -88 | +188 | 154 | 0.86 | 1.32 |
| reduce | 0.17 | 24% | 14% | 10% | 2% | +0 | +75 | 105 | 1.00 | 1.12 |
| thiolene | 0.34 | 60% | 31% | 29% | 9% | -250 | +214 | 263 | 0.69 | 1.41 |
| chlorination | 0.24 | 31% | 16% | 15% | 3% | -88 | +62 | 121 | 0.84 | 1.14 |
| permanganate | 0.23 | 34% | 15% | 19% | 2% | -112 | +62 | 124 | 0.80 | 1.14 |
| ritter | 0.25 | 36% | 14% | 22% | 3% | -162 | +75 | 168 | 0.75 | 1.13 |

## Value toward the spec

(not run)

## Other reflex sets

(not run)

## Limits

- No "across the fold" reflexes in the Python engine. Instruments, homunculi, specs and the gold price are not in it either.
- Yield comes only from reflex steps. The players are greedy (one page) and look-ahead (this page and the next), not people.
- Each reagent is measured as a seventh on top of the six (a starter against the other five); a real run carries up to eight.
- Small sample: see the counts above and the 90% ranges in the table.

## Commands

```
RS_V2=1 python reagent_stats.py fit   _rs_v2/fit.pkl N
RS_V2=1 RS_LA_EVERY=9 python reagent_stats.py main _rs_v2/main.stream 72            # look-ahead on every 9th molecule
RS_V2=1 RS_LA_EVERY=1 RS_J0=72 python reagent_stats.py main _rs_v2/main_b.stream 20  # 20 more per round number, both players
RS_V2=1 python reagent_stats.py pairs _rs_v2/pairs.stream N
RS_V2=1 python reagent_stats.py reach _rs_v2/reach.pkl N        # optional
RS_V2=1 python reagent_stats.py agg   _rs_v2                    # writes reagent_stats_v2.json and REAGENT_STATS_V2.md
RS_V2=1 python offer_formula.py table
```
