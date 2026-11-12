# Overreact: how each reagent scores

Measured on 11 November 2026 with the engine in `docs/tools_chem` (RDKit, real molecules). The reagent set is `library.py` as it stood that evening: its header calls it the final set, but `FINAL.md` did not exist yet. Six reagents held from the start (hydrate, hydroborate, dehydrate, oxidize, reduce, grow) and twelve unlocks (hwe, dihydroxylation, ozonolysis, permanganate, ritter, thiolene, chlorination, cyanohydrin, hofmann, chugaev, hydroformylation, epoxidation). Run it again with `python reagent_stats.py` (the commands are at the bottom). Nothing in the game or in the existing engine files was changed.

## What was played

- **210,540 rounds** in all, on two kinds of molecule: half the game's own table as the game deals them, half made-up ones within two atoms of the round's size. Rounds 1 to 9 equally.
- **Alone value, positions, sets-off, rounds, swing:** 648 molecules (72 for each round number), each played with 26 different carried sets by the greedy player, and the first 30 of each round number (270) also by the look-ahead player. That is 648 greedy and 270 look-ahead rounds with each reagent carried, and the same number without it. (23,868 rounds.)
- **Pairs:** 243 molecules (27 per round number), 192 carried sets, greedy player (46,656 rounds).
- **Specs:** the kept specs of `hurdle_table.json` in the rounds they are offered, 36 molecules per round number, 24 specs and 122 spec-and-round cells that both copies of the table agree on, played by a player who aims at the spec (131,592 rounds).
- **Other reflex sets:** 162 molecules per set, greedy player, 26 carried sets (8,424 rounds).
- **Fit:** 2,700 molecules (300 per round number) checked for what each reagent can act on at the start; 900 molecules checked for whether it can act anywhere in a line of three with the six.
- **Reflexes held:** the ones the spec study gives each band of rounds: ring and dry in rounds 1 to 3; plus flip, shift, tuck, weld, snap in rounds 4 to 6; all thirteen in rounds 7 to 9 (so seal, close, knit, cap, open and fold exist only from round 7).
- **Time:** main 2,951 s, pairs 562 s, specs 4,790 s, other reflex sets 120 s, fit and reach 154 s: about 8,600 s of waiting on 15 worker processes, on a machine other jobs were also using. A first full run was thrown away because `library.py` and `engine.py` were replaced while it ran (20 reagents became 18).

## Words used here

- **Carried:** the reagent is held together with the others named. Five are dealt each page from what is carried.
- **Yield:** what a round paid (the engine's own pay: step n of a page's overreaction pays 50 times n, less when the page does not beat an earlier one).
- **Dud:** a reagent that never acts. It takes a place in the bag and in the deal and nothing else. Every reagent is compared with a dud in its place, so a seventh reagent is not blamed for making the bag bigger. The bag of a starter-test is the six with one replaced by a dud; the bag of an unlock-test is the six plus one reagent, against the six plus a dud.
- **Yield change vs a dud:** mean yield with the reagent over mean yield with a dud, minus one. This is the reagent's own worth.
- **Yield change vs the six alone:** the same against the plain six (for a starter, against the five others). It also carries the cost of crowding the bag: the reagent also pushes the others out of the deal.
- **Ratio** (per round): (yield with + 50) over (yield without + 50). 50 is one step's pay, so a round that pays nothing does not give nothing over nothing.
- **STRENGTH:** for each of two players (greedy, look-ahead) and each of three bands (rounds 1 to 3, 4 to 6, 7 to 9), mean yield with the reagent over mean yield with a dud; the six numbers averaged; then divided by the same figure averaged over the six starters, so the average starter is 1.0. The 90% range is from 300 resamples of the molecules. A dud scores about 0.66 on this scale.
- **Fit at round start:** the share of dealt molecules the reagent has something to act on before anything is fired. **Can act in some line:** the share of molecules where some line of three, made from the six and the reagent, makes it act at all.
- **Swing:** the spread (standard deviation) of the log of the ratio over rounds. High means huge in some rounds and nothing in others.
- **Bonus** (pairs): yield together over base, minus yield of A over base, minus yield of B over base, plus one. Positive means the two are worth more together than their separate worths added up. All four bags of a pair have the same number of reagents (duds fill the gaps).
- **Must-have pair:** bonus at least +10% with the 90% range clear of +10%, and together at least 1.25 times the base.

## The one table

Ranked by STRENGTH. "Best partner (bonus)" is the partner with the biggest bonus.

| Rank | Reagent | Held | STRENGTH | 90% range | Yield change vs a dud | Yield change vs the six alone | Median round ratio | Fit at round start | Can act in some line | Swing | Rounds it changes | Best partner (bonus) | Flags |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | oxidize | start | 1.89 | 1.82 to 1.98 | +181% | +156% | 2.42 | 79% | 100% | 0.86 | 95% | grow (+60%) | DOMINATES, pairs with grow, dihydroxylation |
| 2 | grow | start | 1.10 | 1.08 to 1.13 | +63% | +50% | 1.41 | 77% | 97% | 0.45 | 87% | oxidize (+60%) | pairs with oxidize, ozonolysis, hydroformylation |
| 3 | ozonolysis | unlock | 0.95 | 0.93 to 0.97 | +41% | +19% | 1.31 | 63% | 100% | 0.43 | 79% | grow (+31%) | pairs with grow, dehydrate |
| 4 | epoxidation | unlock | 0.88 | 0.86 to 0.89 | +30% | +11% | 1.00 | 63% | 100% | 0.42 | 45% | grow (+27%) | pairs with grow, dehydrate |
| 5 | hydroformylation | unlock | 0.82 | 0.81 to 0.84 | +22% | +3% | 1.14 | 63% | 100% | 0.36 | 73% | grow (+29%) | pairs with grow |
| 6 | dehydrate | start | 0.82 | 0.80 to 0.84 | +22% | +0% | 1.17 | 80% | 100% | 0.45 | 92% | ozonolysis (+24%) | pairs with ozonolysis, epoxidation |
| 7 | dihydroxylation | unlock | 0.81 | 0.80 to 0.82 | +20% | +2% | 1.07 | 63% | 100% | 0.31 | 65% | oxidize (+53%) | pairs with oxidize |
| 8 | hwe | unlock | 0.79 | 0.77 to 0.80 | +17% | -1% | 1.00 | 46% | 92% | 0.29 | 57% | oxidize (+15%) |  |
| 9 | chugaev | unlock | 0.77 | 0.76 to 0.79 | +15% | -3% | 1.00 | 80% | 100% | 0.28 | 56% | ozonolysis (+6%) |  |
| 10 | hydroborate | start | 0.76 | 0.75 to 0.78 | +13% | -5% | 1.10 | 63% | 100% | 0.43 | 87% | grow (+4%) | CROWDS (the deal is better without it) |
| 11 | hydrate | start | 0.74 | 0.72 to 0.76 | +10% | -10% | 1.09 | 63% | 100% | 0.44 | 88% | chugaev (+6%) | CROWDS (the deal is better without it) |
| 12 | reduce | start | 0.68 | 0.67 to 0.70 | +1% | -14% | 1.00 | 16% | 89% | 0.30 | 59% | epoxidation (+3%) | NEAR-DEAD, CROWDS (the deal is better without it) |
| 13 | hofmann | unlock | 0.67 | 0.67 to 0.67 | +0% | -15% | 1.00 | 0% | 0% | 0.00 | 0% | ritter (+8%) | DEAD |
| 14 | cyanohydrin | unlock | 0.67 | 0.67 to 0.68 | -0% | -15% | 1.00 | 46% | 93% | 0.19 | 28% | hydroformylation (+3%) | NEAR-DEAD |
| 15 | ritter | unlock | 0.66 | 0.66 to 0.67 | -2% | -17% | 1.00 | 63% | 100% | 0.24 | 27% | hofmann (+8%) | NEAR-DEAD |
| 16 | thiolene | unlock | 0.66 | 0.65 to 0.67 | -2% | -17% | 1.00 | 63% | 100% | 0.23 | 27% | hydroformylation (+5%) | NEAR-DEAD |
| 17 | chlorination | unlock | 0.66 | 0.65 to 0.66 | -2% | -17% | 1.00 | 58% | 100% | 0.33 | 25% | hydroformylation (+3%) | NEAR-DEAD |
| 18 | permanganate | unlock | 0.66 | 0.65 to 0.66 | -3% | -18% | 1.00 | 66% | 96% | 0.21 | 26% | hydroborate (+3%) | NEAR-DEAD |

## Flags

- **Dominates: oxidize.** It is dealt 82% of pages, is in a best line 97% of the time, and the best line is worse without it on 72% of pages. Carried in place of a dud it multiplies mean yield by 2.7; take it out of the six and the yield falls to 37%. Its worth is the same in rounds 1 to 3, 4 to 6 and 7 to 9 (2.8, 2.6, 2.7). It is the only starter that makes a C=O (the others add OH, take it off, turn a C=O into OH, or grow an arm on it), and ring, the reflex that starts most chains, needs a C=O and an OH. The next best reagent, grow, is worth +63% against its +181%.
- **Dead: hofmann.** It acts on nothing in any round alone: it needs an NH2 and only ritter makes one. With ritter it is worth +8% over adding the two, and ritter itself is worth nothing. Dead alone, nearly dead with its only feeder.
- **Near-dead (within 3 points of a dud on yield, changes the yield in 25 to 28% of rounds):** cyanohydrin, ritter, thiolene, chlorination, permanganate. Dealt 73% of pages, fired on a quarter to a third of them, 0.4 to 0.6 reflex steps after them, and no gain. Their groups (COOH, NH2, SH, Cl) are used only by seal, knit, cap and close, which exist only in rounds 7 to 9 and need a second group in the same molecule, and the made-up molecules and the game's table carry only C, H and O. Even with every reflex held from round 1 they stay at 0.66 to 0.74 (last table).
- **Crowds the deal (starters):** hydrate, hydroborate and reduce are worse than nothing against the six alone (-10%, -5% and -14% in the table: the six without them earn more than the six), and dehydrate only breaks even (0%). With one starter out the deal is five from five, not five from six, and these three give less than the better hand is worth. Reduce is a dud by itself (+1% against a dud): it acts on a terminal aldehyde only, 7 to 24% of molecules.
- **Must-have pairs.** None is a lock and key where both are dead alone and awake together. The pairs that are much more together than apart are below. Grow and dihydroxylation are worth about nothing without oxidize (1.01 and 1.04 against a dud in their pair bags) and +34% and +23% on top of it.
- **Spoil each other:** nothing serious. Cyanohydrin with epoxidation comes out 6% under epoxidation alone. Hydrate and hydroborate are twins (both add water across C=C): the two together are worth +47% against +37% and +45% alone, a bonus of -35%. Dehydrate and oxidize overlap too (both take the OH); that bonus (-123%) is inflated because the base with both removed is only four starters and two duds, and pays 110.

### Pairs worth more together than apart

| A | B | A alone | B alone | Together | Bonus over adding | 90% range | Together / (A + B - 1) |
|---|---|---|---|---|---|---|---|
| oxidize | grow | 1.84 | 1.01 | 2.46 | +60% | +51 to +69 | 1.33 |
| oxidize | dihydroxylation | 2.44 | 1.04 | 3.01 | +53% | +41 to +66 | 1.21 |
| grow | ozonolysis | 1.32 | 1.35 | 1.98 | +31% | +23 to +41 | 1.18 |
| grow | hydroformylation | 1.32 | 1.08 | 1.69 | +29% | +25 to +35 | 1.21 |
| grow | epoxidation | 1.32 | 1.22 | 1.81 | +27% | +18 to +36 | 1.18 |
| dehydrate | ozonolysis | 1.15 | 1.33 | 1.73 | +24% | +16 to +33 | 1.16 |
| dehydrate | epoxidation | 1.15 | 1.22 | 1.58 | +21% | +13 to +29 | 1.15 |

### Pairs that give less together than the sum

| A | B | A alone | B alone | Together | Bonus over adding | 90% range | Together / (A + B - 1) |
|---|---|---|---|---|---|---|---|
| dehydrate | oxidize | 2.80 | 6.24 | 6.81 | -123% | -162 to -82 | 0.85 |
| hydrate | hydroborate | 1.37 | 1.45 | 1.47 | -35% | -49 to -25 | 0.81 |

### Pairs that spoil each other (together under 0.95 of the better one alone)

| A | B | A alone | B alone | Together | Together / better single | Bonus over adding |
|---|---|---|---|---|---|---|
| cyanohydrin | epoxidation | 0.99 | 1.28 | 1.21 | 0.94 | -7% |

## What the numbers say

1. **Four tiers.** Oxidize alone at the top. Then grow (+63% against a dud), ozonolysis (+41%), epoxidation (+30%, all of it in rounds 7 to 9). Then a middle of +10 to +22%: hydroformylation, dehydrate, dihydroxylation, hwe, chugaev, hydroborate, hydrate. Then nothing: reduce, hofmann, cyanohydrin, ritter, thiolene, chlorination, permanganate.
2. **Grow does nothing by itself.** 0.02 reflex steps follow it. Its worth is in the arm it adds (a C=C and a C-OH) that the next reagent and the next page use. It is the best partner of five reagents.
3. **Epoxidation is a late-round reagent.** In rounds 1 to 6 it is a dud (0.98 to 0.99): it makes an epoxide and only open and fold (from round 7) use one. In rounds 7 to 9 it is 1.84, the second best unlock, and when it acts it sets off 3.8 steps. It changes the yield in only 45% of rounds, so it is lumpy (swing 0.42, spread of yield change 788).
4. **Ozonolysis, hydroformylation, dihydroxylation, hwe** steady: swing 0.29 to 0.43. Ozonolysis peaks in rounds 4 to 6 (1.69). Hwe is best early (1.26) and fades (1.08 late). Chugaev and dehydrate grow with the round (dehydrate 1.05, 1.24, 1.31).
5. **Dehydrate, hydrate and hydroborate cut both ways.** They make the yield worse in 27%, 33% and 29% of rounds (dehydrate p10 ratio 0.72): they remove the OH or C=C a reflex was going to use. Oxidize and grow are worse than a dud in 1% and 5% of rounds.
6. **Positions.** Oxidize is the same anywhere (28, 34, 38% of firings first, second, third; a gain of 157 to 178 per page). Grow belongs early (50% first, 14% third; the best-line gain is 63 first and 17 third). Ozonolysis, hydroformylation and epoxidation want to be last (52 to 54% of their firings, gain 141, 82 and 296 against 67, 43 and 181 first): they need what the first two have made.
7. **What they set off.** Per firing: oxidize 2.0 steps (dry, weld, ring), epoxidation 2.4 (3.8 when it acts; open and fold), ozonolysis 1.9 (ring, weld, dry), hydroformylation 1.6 (ring), chugaev 1.2 (shift, snap), dehydrate 1.1 (snap, shift), hydrate 0.9, hwe 0.9, dihydroxylation 0.9, hydroborate 0.6, then 0.4 to 0.6 for reduce, cyanohydrin, chlorination, permanganate, ritter, thiolene.
8. **Runoff.** Oxidize gives hydrogen (1.8) and carbon dioxide (1.1) itself and water (0.6) through dry. Dehydrate 2.05 water. Chugaev 1.77 sulfur. Ozonolysis 1.3 pieces and 0.44 water. Chlorination 0.84 acid fumes and 0.30 more through close. Cyanohydrin 0.68 ammonia. Permanganate carbon dioxide 0.21 and hydrogen 0.34, and 0.39 water through seal. Epoxidation gives 0.14 water. Hydroformylation, dihydroxylation, hwe, hydroborate, hydrate, reduce, ritter and thiolene give water only through reflexes (0.06 to 0.25).
9. **Fit.** Eight reagents need a C=C and share one fit curve (hydrate, hydroborate, dihydroxylation, ozonolysis, epoxidation, hydroformylation, ritter, thiolene): 66, 64, 69, 59, 53, 53, 66, 72, 65% by round. Dehydrate and chugaev need an OH (66 rising to 94%). Oxidize needs an OH or a chain-end C=C (71 to 83%). Hwe and cyanohydrin need an aldehyde or a methyl ketone (28 to 64% by round). Reduce needs a terminal aldehyde (7 to 24%). Permanganate falls with the round (87 to 45%), chlorination rises (36 to 76%). Hofmann: 0. On the game's own molecules grow fits 91% and the made-up ones 63%.
10. **Specs.** Oxidize makes 88% of the kept-spec cells easier and grow 84%; dehydrate 60%, dihydroxylation 57%, ozonolysis 52%, hydroformylation 52%, hwe 45%. Ritter, thiolene, epoxidation and permanganate make 13 to 20% harder (their side effects get in the way of a player aiming at one spec). Hofmann changes nothing. 13 of the 122 cells (the hydrogen and carbon dioxide runoff specs) can only be offered when oxidize is carried.

## Alone value

Dealt: share of pages on which it is in the hand of five. Fired when dealt: share of those pages where it is in the chosen line. In a best line counts ties, so a reagent that does nothing still reads 70%; "best line worse without it" is the real measure. "How much worse" is the loss in page pay, on the pages where it was dealt.

| Reagent | Dealt (per page) | Fired when dealt | In a best line (ties count) | Best line worse without it | How much worse | Ratio mean | median | p10 | p90 | Ratio of mean yields | Mean yield with / without a dud |
|---|---|---|---|---|---|---|---|---|---|---|---|
| oxidize | 82% | 82% | 97% | 72% | 56% | 4.66 | 2.42 | 1.17 | 10.83 | 2.70 | 930 / 345 |
| grow | 85% | 64% | 94% | 46% | 29% | 1.74 | 1.41 | 1.00 | 2.79 | 1.53 | 930 / 606 |
| ozonolysis | 71% | 71% | 94% | 56% | 34% | 1.59 | 1.31 | 1.00 | 2.48 | 1.42 | 1129 / 795 |
| epoxidation | 74% | 39% | 81% | 25% | 20% | 1.34 | 1.00 | 0.97 | 2.07 | 1.44 | 1147 / 795 |
| hydroformylation | 72% | 61% | 90% | 41% | 26% | 1.36 | 1.14 | 0.99 | 2.04 | 1.22 | 969 / 795 |
| dehydrate | 82% | 54% | 85% | 36% | 23% | 1.31 | 1.17 | 0.72 | 2.00 | 1.24 | 930 / 752 |
| dihydroxylation | 73% | 56% | 91% | 22% | 12% | 1.26 | 1.07 | 0.95 | 1.77 | 1.18 | 938 / 795 |
| hwe | 73% | 51% | 87% | 26% | 16% | 1.23 | 1.00 | 1.00 | 1.71 | 1.13 | 899 / 795 |
| chugaev | 73% | 50% | 88% | 28% | 16% | 1.16 | 1.00 | 0.95 | 1.60 | 1.18 | 936 / 795 |
| hydroborate | 83% | 43% | 79% | 18% | 10% | 1.22 | 1.10 | 0.71 | 1.81 | 1.13 | 930 / 826 |
| hydrate | 84% | 46% | 76% | 19% | 12% | 1.21 | 1.09 | 0.70 | 1.84 | 1.09 | 930 / 852 |
| reduce | 84% | 29% | 63% | 5% | 3% | 1.07 | 1.00 | 0.74 | 1.42 | 1.01 | 930 / 921 |
| hofmann | 73% | 25% | 70% | 0% | 0% | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 795 / 795 |
| cyanohydrin | 73% | 34% | 80% | 7% | 4% | 1.01 | 1.00 | 0.89 | 1.10 | 1.00 | 796 / 795 |
| ritter | 73% | 27% | 74% | 2% | 1% | 0.99 | 1.00 | 0.86 | 1.07 | 0.98 | 776 / 795 |
| thiolene | 73% | 27% | 73% | 2% | 1% | 0.99 | 1.00 | 0.86 | 1.05 | 0.97 | 773 / 795 |
| chlorination | 74% | 27% | 73% | 5% | 4% | 0.98 | 1.00 | 0.90 | 1.04 | 0.97 | 770 / 795 |
| permanganate | 74% | 26% | 74% | 5% | 3% | 0.98 | 1.00 | 0.85 | 1.04 | 0.97 | 773 / 795 |

By player (ratio of mean yields against a dud, and the median round ratio), and against the six alone:

| Reagent | Greedy: ratio of means | median | Look-ahead: ratio of means | median | Against the six alone: mean / median ratio |
|---|---|---|---|---|---|
| oxidize | 2.47 | 2.12 | 3.14 | 2.94 | 4.29 / 2.18 |
| grow | 1.38 | 1.31 | 1.85 | 1.71 | 1.58 / 1.32 |
| ozonolysis | 1.44 | 1.34 | 1.38 | 1.29 | 1.33 / 1.15 |
| epoxidation | 1.31 | 1.00 | 1.65 | 1.00 | 1.15 / 1.00 |
| hydroformylation | 1.24 | 1.14 | 1.19 | 1.15 | 1.16 / 1.00 |
| dehydrate | 1.16 | 1.16 | 1.37 | 1.26 | 1.00 / 1.00 |
| dihydroxylation | 1.16 | 1.00 | 1.21 | 1.17 | 1.10 / 1.00 |
| hwe | 1.13 | 1.00 | 1.14 | 1.09 | 1.08 / 1.00 |
| chugaev | 1.14 | 1.00 | 1.23 | 1.08 | 1.03 / 1.00 |
| hydroborate | 1.09 | 1.08 | 1.19 | 1.15 | 0.99 / 1.00 |
| hydrate | 1.08 | 1.08 | 1.11 | 1.10 | 0.95 / 0.97 |
| reduce | 1.01 | 1.00 | 1.02 | 1.00 | 0.91 / 0.93 |
| hofmann | 1.00 | 1.00 | 1.00 | 1.00 | 0.91 / 0.89 |
| cyanohydrin | 1.00 | 1.00 | 1.01 | 1.00 | 0.91 / 0.90 |
| ritter | 0.97 | 1.00 | 0.99 | 1.00 | 0.89 / 0.88 |
| thiolene | 0.97 | 1.00 | 0.98 | 1.00 | 0.89 / 0.88 |
| chlorination | 0.96 | 1.00 | 0.99 | 1.00 | 0.87 / 0.88 |
| permanganate | 0.97 | 1.00 | 0.98 | 1.00 | 0.88 / 0.88 |

## Fit rate

Share of dealt molecules the reagent has anything to act on at the start of the round, by round. A hand does not need the reagent to act at the start: it can act after another reagent in the line has made what it needs. The next table counts that.

| Reagent | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | game molecules | made molecules |
|---|---|---|---|---|---|---|---|---|---|---|---|
| oxidize | 83% | 76% | 83% | 81% | 82% | 77% | 71% | 82% | 76% | 79% | 79% |
| grow | 66% | 68% | 69% | 74% | 76% | 86% | 87% | 87% | 82% | 91% | 63% |
| ozonolysis | 66% | 64% | 69% | 59% | 53% | 53% | 66% | 72% | 65% | 70% | 56% |
| epoxidation | 66% | 64% | 69% | 59% | 53% | 53% | 66% | 72% | 65% | 70% | 56% |
| hydroformylation | 66% | 64% | 69% | 59% | 53% | 53% | 66% | 72% | 65% | 70% | 56% |
| dehydrate | 67% | 67% | 66% | 77% | 85% | 91% | 90% | 86% | 94% | 83% | 78% |
| dihydroxylation | 66% | 64% | 69% | 59% | 53% | 53% | 66% | 72% | 65% | 70% | 56% |
| hwe | 28% | 34% | 31% | 43% | 49% | 59% | 64% | 54% | 53% | 58% | 35% |
| chugaev | 67% | 67% | 66% | 77% | 85% | 91% | 90% | 86% | 94% | 83% | 78% |
| hydroborate | 66% | 64% | 69% | 59% | 53% | 53% | 66% | 72% | 65% | 70% | 56% |
| hydrate | 66% | 64% | 69% | 59% | 53% | 53% | 66% | 72% | 65% | 70% | 56% |
| reduce | 21% | 24% | 21% | 22% | 13% | 7% | 11% | 15% | 7% | 13% | 18% |
| hofmann | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| cyanohydrin | 28% | 34% | 31% | 43% | 49% | 59% | 64% | 54% | 53% | 58% | 35% |
| ritter | 66% | 64% | 69% | 59% | 53% | 53% | 66% | 72% | 65% | 70% | 56% |
| thiolene | 66% | 64% | 69% | 59% | 53% | 53% | 66% | 72% | 65% | 70% | 56% |
| chlorination | 36% | 34% | 37% | 53% | 70% | 72% | 68% | 76% | 74% | 49% | 67% |
| permanganate | 87% | 83% | 85% | 68% | 60% | 52% | 55% | 59% | 45% | 61% | 72% |

Share of molecules on which the reagent acts somewhere in some line of three made from the six and itself:

| Reagent | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | all |
|---|---|---|---|---|---|---|---|---|---|---|
| oxidize | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| grow | 90% | 95% | 93% | 94% | 100% | 100% | 99% | 99% | 100% | 97% |
| ozonolysis | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| epoxidation | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| hydroformylation | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| dehydrate | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| dihydroxylation | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| hwe | 90% | 92% | 92% | 85% | 95% | 92% | 93% | 90% | 95% | 92% |
| chugaev | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| hydroborate | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| hydrate | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| reduce | 88% | 94% | 93% | 82% | 88% | 80% | 89% | 91% | 97% | 89% |
| hofmann | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% | 0% |
| cyanohydrin | 90% | 94% | 93% | 87% | 96% | 94% | 94% | 93% | 96% | 93% |
| ritter | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| thiolene | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| chlorination | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |
| permanganate | 90% | 95% | 93% | 94% | 99% | 100% | 98% | 99% | 100% | 96% |

On the page, when it was dealt: has something to act on at the start of the page; acts when fired (after earlier reagents of the line); places it acts at.

| Reagent | Something to act on when dealt (page start) | Acts when fired | Places it acts at (mean, when it acts) |
|---|---|---|---|
| oxidize | 62% | 92% | 3.1 |
| grow | 79% | 86% | 2.4 |
| ozonolysis | 46% | 89% | 2.3 |
| epoxidation | 45% | 62% | 3.4 |
| hydroformylation | 44% | 83% | 2.5 |
| dehydrate | 76% | 80% | 2.6 |
| dihydroxylation | 46% | 72% | 2.2 |
| hwe | 43% | 68% | 1.4 |
| chugaev | 71% | 80% | 2.2 |
| hydroborate | 51% | 77% | 2.2 |
| hydrate | 51% | 81% | 2.0 |
| reduce | 37% | 45% | 1.7 |
| hofmann | 0% | 0% | - |
| cyanohydrin | 44% | 43% | 1.6 |
| ritter | 45% | 39% | 1.7 |
| thiolene | 46% | 40% | 1.7 |
| chlorination | 47% | 38% | 2.2 |
| permanganate | 60% | 41% | 1.8 |

## What it sets off

Reflex steps that follow it in the line, per firing; the reflexes that did them (per firing, the four most common); runoff.

| Reagent | Reflex steps after it (per firing) | when it acts | Sets off any | Sets off 3+ | Reflexes after it (per firing) | Runoff from the reagent itself (per firing) | Runoff from the reflexes it sets off (per firing) |
|---|---|---|---|---|---|---|---|
| oxidize | 2.01 | 2.19 | 79% | 34% | dry 0.61, weld 0.57, ring 0.55, tuck 0.14 | carbon dioxide 1.08, hydrogen 1.78 | water 0.61 |
| grow | 0.02 | 0.02 | 2% | 0% | snap 0.02 | - | - |
| ozonolysis | 1.89 | 2.12 | 83% | 29% | ring 0.73, weld 0.63, dry 0.44, tuck 0.07 | piece 1.30 | water 0.44 |
| epoxidation | 2.37 | 3.83 | 54% | 37% | open 0.92, fold 0.91, weld 0.30, dry 0.14 | - | water 0.14 |
| hydroformylation | 1.57 | 1.90 | 73% | 21% | ring 0.89, weld 0.44, dry 0.22, tuck 0.02 | - | water 0.22 |
| dehydrate | 1.08 | 1.35 | 50% | 16% | snap 0.48, shift 0.29, weld 0.15, dry 0.12 | water 2.05 | water 0.12 |
| dihydroxylation | 0.94 | 1.31 | 44% | 14% | ring 0.52, dry 0.23, flip 0.10, weld 0.07 | - | water 0.23 |
| hwe | 0.91 | 1.34 | 52% | 9% | ring 0.51, weld 0.15, dry 0.11, tuck 0.06 | - | water 0.11 |
| chugaev | 1.23 | 1.54 | 55% | 18% | shift 0.68, snap 0.23, weld 0.15, dry 0.11 | sulfur 1.77 | water 0.11 |
| hydroborate | 0.59 | 0.77 | 37% | 4% | ring 0.46, dry 0.08, weld 0.03, tuck 0.02 | - | water 0.08 |
| hydrate | 0.91 | 1.13 | 57% | 6% | ring 0.57, dry 0.25, weld 0.05, tuck 0.04 | - | water 0.25 |
| reduce | 0.59 | 1.32 | 34% | 5% | ring 0.37, dry 0.13, tuck 0.07, weld 0.01 | - | water 0.13 |
| hofmann | 0.00 | - | 0% | 0% | - | - | - |
| cyanohydrin | 0.57 | 1.31 | 32% | 6% | ring 0.23, seal 0.16, dry 0.08, tuck 0.04 | ammonia 0.68 | water 0.24 |
| ritter | 0.38 | 0.99 | 21% | 4% | knit 0.18, ring 0.08, dry 0.06, weld 0.04 | - | water 0.06 |
| thiolene | 0.37 | 0.92 | 19% | 4% | cap 0.17, ring 0.07, dry 0.06, weld 0.04 | - | water 0.06 |
| chlorination | 0.51 | 1.35 | 22% | 10% | close 0.30, dry 0.09, weld 0.07, ring 0.03 | acid fumes 0.84 | acid fumes 0.30, water 0.09 |
| permanganate | 0.48 | 1.16 | 23% | 8% | seal 0.36, ring 0.06, dry 0.03, weld 0.02 | carbon dioxide 0.21, hydrogen 0.34 | water 0.39 |

## Value by position in the line

Share of its firings that were first, second, third; reflex steps after it; mean pay of the page; and the mean gain, over every page it was dealt, of the best line with it in that place over the best line without it.

| Reagent | 1st: share of firings | steps after it | page pay | best-line gain if put here | 2nd: share of firings | steps after it | page pay | best-line gain if put here | 3rd: share of firings | steps after it | page pay | best-line gain if put here |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| oxidize | 28% | 1.99 | 443 | 158 | 34% | 1.69 | 267 | 157 | 38% | 2.30 | 373 | 178 |
| grow | 50% | 0.01 | 262 | 63 | 36% | 0.02 | 433 | 64 | 14% | 0.05 | 172 | 17 |
| ozonolysis | 16% | 1.92 | 426 | 67 | 32% | 1.77 | 404 | 97 | 52% | 1.94 | 423 | 141 |
| epoxidation | 26% | 2.00 | 805 | 181 | 22% | 2.15 | 621 | 187 | 52% | 2.65 | 1092 | 296 |
| hydroformylation | 22% | 1.55 | 345 | 43 | 24% | 1.42 | 240 | 36 | 54% | 1.65 | 354 | 82 |
| dehydrate | 38% | 1.29 | 371 | 61 | 22% | 0.52 | 253 | 44 | 40% | 1.19 | 455 | 87 |
| dihydroxylation | 26% | 1.16 | 289 | 21 | 42% | 0.87 | 353 | 47 | 32% | 0.86 | 245 | 27 |
| hwe | 33% | 1.20 | 257 | 23 | 27% | 0.52 | 308 | 28 | 40% | 0.94 | 316 | 41 |
| chugaev | 38% | 1.56 | 449 | 64 | 21% | 0.66 | 311 | 40 | 41% | 1.21 | 529 | 85 |
| hydroborate | 23% | 0.90 | 261 | 10 | 42% | 0.42 | 324 | 32 | 35% | 0.59 | 214 | 11 |
| hydrate | 24% | 1.06 | 209 | 11 | 38% | 0.89 | 265 | 20 | 38% | 0.85 | 230 | 17 |
| reduce | 34% | 0.62 | 188 | 4 | 28% | 0.63 | 265 | 5 | 39% | 0.54 | 206 | 6 |
| hofmann | 35% | 0.00 | 165 | 0 | 33% | 0.00 | 146 | 0 | 32% | 0.00 | 130 | 0 |
| cyanohydrin | 30% | 0.65 | 204 | 6 | 30% | 0.44 | 186 | 7 | 41% | 0.60 | 236 | 14 |
| ritter | 33% | 0.55 | 207 | 3 | 27% | 0.35 | 206 | 4 | 40% | 0.27 | 268 | 6 |
| thiolene | 34% | 0.58 | 206 | 3 | 28% | 0.34 | 214 | 5 | 39% | 0.20 | 240 | 5 |
| chlorination | 31% | 0.63 | 145 | 5 | 30% | 0.12 | 157 | 5 | 39% | 0.71 | 184 | 8 |
| permanganate | 28% | 0.39 | 157 | 2 | 28% | 0.17 | 164 | 3 | 44% | 0.72 | 196 | 7 |

## Value by round

Early is rounds 1 to 3, middle 4 to 6, late 7 to 9. Ratio of mean yields against a dud.

| Reagent | early 1-3: ratio of means | median | fired when dealt | best line worse without it | mid 4-6: ratio of means | median | fired when dealt | best line worse without it | late 7-9: ratio of means | median | fired when dealt | best line worse without it |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| oxidize | 2.82 | 2.27 | 83% | 65% | 2.58 | 2.46 | 82% | 72% | 2.74 | 2.51 | 81% | 77% |
| grow | 1.55 | 1.42 | 54% | 33% | 1.70 | 1.54 | 72% | 52% | 1.44 | 1.35 | 67% | 52% |
| ozonolysis | 1.27 | 1.15 | 63% | 39% | 1.69 | 1.67 | 77% | 67% | 1.30 | 1.24 | 74% | 62% |
| epoxidation | 0.99 | 1.00 | 21% | 0% | 0.98 | 1.00 | 24% | 0% | 1.84 | 1.64 | 73% | 76% |
| hydroformylation | 1.16 | 1.00 | 53% | 25% | 1.39 | 1.36 | 71% | 53% | 1.13 | 1.09 | 59% | 44% |
| dehydrate | 1.05 | 1.00 | 41% | 16% | 1.24 | 1.24 | 56% | 40% | 1.31 | 1.28 | 65% | 53% |
| dihydroxylation | 1.18 | 1.00 | 54% | 14% | 1.31 | 1.20 | 58% | 28% | 1.11 | 1.02 | 54% | 25% |
| hwe | 1.26 | 1.13 | 55% | 25% | 1.16 | 1.02 | 52% | 28% | 1.08 | 1.00 | 46% | 25% |
| chugaev | 1.03 | 1.00 | 37% | 7% | 1.17 | 1.06 | 55% | 35% | 1.22 | 1.13 | 57% | 44% |
| hydroborate | 1.09 | 1.00 | 48% | 12% | 1.14 | 1.12 | 40% | 21% | 1.13 | 1.11 | 42% | 19% |
| hydrate | 1.14 | 1.12 | 56% | 22% | 1.08 | 1.08 | 42% | 17% | 1.09 | 1.07 | 41% | 19% |
| reduce | 1.02 | 1.00 | 40% | 7% | 1.00 | 1.00 | 25% | 3% | 1.01 | 1.00 | 22% | 5% |
| hofmann | 1.00 | 1.00 | 24% | 0% | 1.00 | 1.00 | 29% | 0% | 1.00 | 1.00 | 24% | 0% |
| cyanohydrin | 0.98 | 1.00 | 35% | 4% | 1.00 | 1.00 | 28% | 1% | 1.01 | 1.00 | 39% | 16% |
| ritter | 0.99 | 1.00 | 21% | 0% | 0.99 | 1.00 | 25% | 0% | 0.97 | 1.00 | 34% | 7% |
| thiolene | 0.99 | 1.00 | 21% | 0% | 0.98 | 1.00 | 25% | 0% | 0.96 | 1.00 | 34% | 7% |
| chlorination | 0.98 | 1.00 | 20% | 0% | 0.97 | 1.00 | 26% | 1% | 0.97 | 1.00 | 34% | 15% |
| permanganate | 0.97 | 1.00 | 20% | 1% | 0.97 | 1.00 | 24% | 0% | 0.97 | 1.00 | 32% | 13% |

By round number:

| Reagent | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 |
|---|---|---|---|---|---|---|---|---|---|
| oxidize | 2.70 | 3.10 | 2.69 | 2.80 | 2.61 | 2.43 | 2.72 | 2.96 | 2.58 |
| grow | 1.48 | 1.58 | 1.58 | 1.77 | 1.76 | 1.61 | 1.50 | 1.48 | 1.37 |
| ozonolysis | 1.29 | 1.25 | 1.28 | 1.83 | 1.66 | 1.63 | 1.49 | 1.23 | 1.25 |
| epoxidation | 0.98 | 1.01 | 0.98 | 0.98 | 1.00 | 0.98 | 1.98 | 1.68 | 1.90 |
| hydroformylation | 1.15 | 1.16 | 1.16 | 1.52 | 1.36 | 1.34 | 1.28 | 1.08 | 1.08 |
| dehydrate | 1.04 | 1.10 | 1.01 | 1.23 | 1.22 | 1.26 | 1.25 | 1.30 | 1.35 |
| dihydroxylation | 1.19 | 1.18 | 1.15 | 1.36 | 1.28 | 1.30 | 1.22 | 1.08 | 1.05 |
| hwe | 1.25 | 1.25 | 1.28 | 1.22 | 1.17 | 1.13 | 1.12 | 1.07 | 1.05 |
| chugaev | 1.01 | 1.04 | 1.03 | 1.15 | 1.18 | 1.18 | 1.23 | 1.19 | 1.26 |
| hydroborate | 1.12 | 1.10 | 1.05 | 1.12 | 1.10 | 1.21 | 1.16 | 1.17 | 1.07 |
| hydrate | 1.11 | 1.20 | 1.12 | 1.09 | 1.06 | 1.08 | 1.08 | 1.13 | 1.06 |
| reduce | 1.04 | 1.00 | 1.03 | 0.99 | 1.02 | 1.00 | 1.01 | 1.03 | 0.99 |
| hofmann | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| cyanohydrin | 0.98 | 0.96 | 1.01 | 0.96 | 1.01 | 1.00 | 1.00 | 1.02 | 1.01 |
| ritter | 0.98 | 1.01 | 0.98 | 0.99 | 1.00 | 0.98 | 0.96 | 0.96 | 0.98 |
| thiolene | 0.98 | 1.01 | 0.98 | 0.98 | 1.00 | 0.98 | 0.96 | 0.96 | 0.97 |
| chlorination | 0.99 | 0.98 | 0.97 | 0.98 | 0.96 | 0.97 | 0.98 | 0.94 | 0.99 |
| permanganate | 0.97 | 1.00 | 0.96 | 0.97 | 0.96 | 0.98 | 0.99 | 0.96 | 0.98 |

## Partners

For every pair of the 18, the four bags have the same number of reagents. Best three and worst, by bonus; in brackets the bonus and the pair's yield over the base.

| Reagent | Best partner | 2nd | 3rd | Worst partner |
|---|---|---|---|---|
| oxidize | grow (+60%, together 2.46) | dihydroxylation (+53%, together 3.01) | hwe (+15%, together 2.76) | dehydrate (-123%) |
| grow | oxidize (+60%, together 2.46) | ozonolysis (+31%, together 1.98) | hydroformylation (+29%, together 1.69) | dehydrate (-7%) |
| ozonolysis | grow (+31%, together 1.98) | dehydrate (+24%, together 1.73) | chugaev (+6%, together 1.63) | epoxidation (-7%) |
| epoxidation | grow (+27%, together 1.81) | dehydrate (+21%, together 1.58) | hwe (+4%, together 1.44) | oxidize (-30%) |
| hydroformylation | grow (+29%, together 1.69) | hwe (+8%, together 1.42) | thiolene (+5%, together 1.24) | oxidize (-21%) |
| dehydrate | ozonolysis (+24%, together 1.73) | epoxidation (+21%, together 1.58) | dihydroxylation (+10%, together 1.43) | oxidize (-123%) |
| dihydroxylation | oxidize (+53%, together 3.01) | grow (+12%, together 1.63) | dehydrate (+10%, together 1.43) | epoxidation (-10%) |
| hwe | oxidize (+15%, together 2.76) | dihydroxylation (+9%, together 1.38) | hydroformylation (+8%, together 1.42) | dehydrate (-6%) |
| chugaev | ozonolysis (+6%, together 1.63) | hydrate (+6%, together 1.26) | dihydroxylation (+2%, together 1.33) | dehydrate (-16%) |
| hydroborate | grow (+4%, together 1.41) | oxidize (+3%, together 2.82) | permanganate (+3%, together 1.06) | hydrate (-35%) |
| hydrate | chugaev (+6%, together 1.26) | epoxidation (+1%, together 1.52) | permanganate (+1%, together 1.09) | hydroborate (-35%) |
| reduce | epoxidation (+3%, together 1.43) | hydroformylation (+1%, together 1.34) | hofmann (+0%, together 1.04) | hwe (-6%) |
| hofmann | ritter (+8%, together 1.04) | hydroformylation (+2%, together 1.24) | hydrate (+0%, together 1.11) | epoxidation (-3%) |
| cyanohydrin | hydroformylation (+3%, together 1.25) | chlorination (+2%, together 0.97) | thiolene (+1%, together 0.97) | epoxidation (-7%) |
| ritter | hofmann (+8%, together 1.04) | hydroformylation (+5%, together 1.23) | dihydroxylation (+3%, together 1.15) | oxidize (-10%) |
| thiolene | hydroformylation (+5%, together 1.24) | ozonolysis (+3%, together 1.42) | dihydroxylation (+2%, together 1.16) | oxidize (-6%) |
| chlorination | hydroformylation (+3%, together 1.22) | ritter (+2%, together 0.94) | thiolene (+2%, together 0.95) | oxidize (-17%) |
| permanganate | hydroborate (+3%, together 1.06) | hydroformylation (+2%, together 1.22) | hydrate (+1%, together 1.09) | oxidize (-9%) |

## Swing

How much its value varies from molecule to molecule. Rounds changed: the share of rounds where the yield differs at all. Better and worse: the shares where it was higher or lower.

| Reagent | Swing (spread of log ratio) | Rounds changed | Better | Worse | Ratio 1.5+ | Yield change p10 | p90 | sd | Ratio p10 | p90 |
|---|---|---|---|---|---|---|---|---|---|---|
| oxidize | 0.86 | 95% | 94% | 1% | 78% | +62 | +1325 | 509 | 1.17 | 10.83 |
| grow | 0.45 | 87% | 82% | 5% | 45% | +0 | +841 | 376 | 1.00 | 2.79 |
| ozonolysis | 0.43 | 79% | 73% | 7% | 39% | +0 | +912 | 435 | 1.00 | 2.48 |
| epoxidation | 0.42 | 45% | 35% | 10% | 21% | -29 | +1312 | 788 | 0.97 | 2.07 |
| hydroformylation | 0.36 | 73% | 62% | 10% | 24% | -12 | +579 | 299 | 0.99 | 2.04 |
| dehydrate | 0.45 | 92% | 64% | 27% | 26% | -200 | +688 | 399 | 0.72 | 2.00 |
| dihydroxylation | 0.31 | 65% | 54% | 11% | 19% | -50 | +538 | 306 | 0.95 | 1.77 |
| hwe | 0.29 | 57% | 50% | 7% | 15% | +0 | +338 | 250 | 1.00 | 1.71 |
| chugaev | 0.28 | 56% | 45% | 11% | 14% | -54 | +525 | 363 | 0.95 | 1.60 |
| hydroborate | 0.43 | 87% | 58% | 29% | 20% | -275 | +575 | 403 | 0.71 | 1.81 |
| hydrate | 0.44 | 88% | 55% | 33% | 20% | -325 | +529 | 404 | 0.70 | 1.84 |
| reduce | 0.30 | 59% | 34% | 25% | 9% | -225 | +275 | 281 | 0.74 | 1.42 |
| hofmann | 0.00 | 0% | 0% | 0% | 0% | +0 | +0 | 0 | 1.00 | 1.00 |
| cyanohydrin | 0.19 | 28% | 15% | 14% | 2% | -88 | +75 | 150 | 0.89 | 1.10 |
| ritter | 0.24 | 27% | 11% | 15% | 1% | -112 | +62 | 170 | 0.86 | 1.07 |
| thiolene | 0.23 | 27% | 11% | 16% | 1% | -100 | +50 | 166 | 0.86 | 1.05 |
| chlorination | 0.33 | 25% | 11% | 14% | 1% | -88 | +50 | 181 | 0.90 | 1.04 |
| permanganate | 0.21 | 26% | 11% | 16% | 1% | -100 | +50 | 161 | 0.85 | 1.04 |

## Value toward the spec

Each cell is one kept spec in one round it is offered. A spec is "made easier" when a player aiming at it ends on a higher value by at least a tenth of N, with a paired test at two standard errors, with the reagent against a dud. Clear rates are not used because at the table's N the six already clear 93% of the time.

| Reagent | Spec cells it makes easier | Harder | No change | Mean change in the spec value, in units of N | Distinct specs eased somewhere | Most helped (rounds, of 9) |
|---|---|---|---|---|---|---|
| oxidize | 88% | 0% | 12% | +1.60 | 23 of 24 | growth 9, unsaturation 9, hetero_atoms 9 |
| grow | 84% | 1% | 16% | +1.87 | 21 of 24 | growth 9, unsaturation 9, hetero_atoms 9 |
| ozonolysis | 52% | 1% | 47% | +0.92 | 18 of 24 | off_total 8, hetero_atoms 7, double_bonds 6 |
| epoxidation | 5% | 17% | 78% | -0.10 | 3 of 24 | closer 3, ring_systems 2, opener 1 |
| hydroformylation | 52% | 4% | 43% | +0.42 | 16 of 24 | growth 9, branch 8, double_bonds 8 |
| dehydrate | 60% | 0% | 40% | +0.98 | 16 of 24 | unsaturation 9, double_bonds 9, off_total 8 |
| dihydroxylation | 57% | 6% | 38% | +0.54 | 14 of 24 | unsaturation 9, hetero_atoms 9, branch 9 |
| hwe | 45% | 0% | 55% | +0.23 | 12 of 24 | growth 9, unsaturation 8, hetero_atoms 8 |
| chugaev | 29% | 2% | 70% | +0.12 | 13 of 24 | off_total 8, double_bonds 5, cut_down 4 |
| hydroborate | 29% | 0% | 71% | +0.34 | 12 of 24 | branch 8, off_hydrogen 7, end_CC 4 |
| hydrate | 16% | 0% | 84% | +0.22 | 10 of 24 | branch 4, pure_water 4, off_hydrogen 2 |
| reduce | 11% | 1% | 89% | +0.08 | 7 of 24 | cut_down 5, lean_turns 3, off_total 1 |
| hofmann | 0% | 1% | 99% | +0.00 | 0 of 24 | - |
| cyanohydrin | 14% | 4% | 82% | +0.08 | 6 of 24 | hetero_atoms 9, growth 3, kinds_gain 2 |
| ritter | 2% | 20% | 78% | -0.11 | 1 of 24 | kinds_gain 2 |
| thiolene | 2% | 15% | 84% | -0.10 | 1 of 24 | kinds_gain 2 |
| chlorination | 4% | 7% | 89% | -0.05 | 4 of 24 | kinds_gain 2, pure_gas 1, double_bonds 1 |
| permanganate | 14% | 13% | 73% | +0.02 | 7 of 24 | hetero_atoms 7, off_carbon_dioxide 2, off_hydrogen 2 |

## Other reflex sets

STRENGTH again with only the starting reflexes (ring, dry) held in every round, and with all of them held in every round. Greedy player only, scaled to the average starter in the same set.

| Reagent | STRENGTH, reflexes by round (as the game) | Starting reflexes only (ring, dry) | All reflexes |
|---|---|---|---|
| oxidize | 1.89 | 1.92 | 1.87 |
| grow | 1.10 | 1.06 | 1.12 |
| ozonolysis | 0.95 | 0.89 | 1.23 |
| epoxidation | 0.88 | 0.70 | 1.19 |
| hydroformylation | 0.82 | 0.80 | 1.02 |
| dehydrate | 0.82 | 0.75 | 0.80 |
| dihydroxylation | 0.81 | 0.84 | 0.90 |
| hwe | 0.79 | 0.86 | 0.82 |
| chugaev | 0.77 | 0.75 | 0.81 |
| hydroborate | 0.76 | 0.75 | 0.74 |
| hydrate | 0.74 | 0.79 | 0.77 |
| reduce | 0.68 | 0.73 | 0.71 |
| hofmann | 0.67 | 0.72 | 0.73 |
| cyanohydrin | 0.67 | 0.72 | 0.74 |
| ritter | 0.66 | 0.70 | 0.70 |
| thiolene | 0.66 | 0.70 | 0.69 |
| chlorination | 0.66 | 0.70 | 0.66 |
| permanganate | 0.66 | 0.69 | 0.69 |

Ozonolysis, epoxidation and hydroformylation gain the most when all reflexes are held early (epoxidation 0.70 to 1.19). The five group-makers stay at the bottom under every set.

## Where the engine is too crude to trust

- **The molecules carry only C, H and O.** Nothing in the game's table or the made-up ones has N, S, Cl or COOH at the start. The five group-makers (ritter, thiolene, chlorination, permanganate, cyanohydrin) and hofmann can only be valued through the reflexes that meet two groups made in the same molecule. A second feeder of the other group (for example, Cl and OH 3 or 4 apart for close; NH2 and a C=O for knit) is rare in these molecules. Their deadness is partly the molecule set. Read them as "not worth anything on these molecules", not "worth nothing".
- **Yield comes only from reflex steps.** A reagent earns yield only by what it sets off, so the pay cannot see worth that the game may give some other way: a clean molecule, runoff for the jars, the spec, a cross-page set-up.
- **The players are not people.** Greedy sees one page. Look-ahead sees this page and the next, with the next hand known. Neither plans three pages, aims at the spec while playing for yield, or holds a reagent back. Reagents that are set-up pieces (grow, dihydroxylation, epoxidation) are probably worth more to a person who plans than here.
- **A seventh reagent, not a full run.** Each reagent is measured on top of the six (a starter against the other five). A real run carries up to eight with several unlocks at once. The pair table is the only place two are carried together; three or more are not measured.
- **The six never leave.** A real run may carry fewer than the six, or swap a starter for an unlock; here the six are always in the bag.
- **The pair bags for starters** are a small bag (four starters and two duds, or five and a dud): the deal is almost fixed, so a pair of two starters reads large. Treat the starter-starter bonuses as a size of overlap, not a worth.
- **The reflex set per band** is the one the spec study uses, and a player may hold different reflexes by then. The last table shows the strengths move: a reagent that depends on a late reflex (epoxidation) moves most.
- **The spec table was refitted by another job while this ran.** Only the specs and rounds that both copies list were used (24 specs, 122 cells). The aimed player is greedy page by page, so a "harder" cell can be the aimed player's own mistake.
- **The look-ahead rounds are fewer** (270 against 648). Values for the two players are consistent for the top and bottom reagents; in the middle of the table the order changes with the player (see the player table).
- **Ties.** Many lines tie on pay (all those that do nothing). The player draws one at random, so "in a best line" overstates a reagent that does nothing.
- **Generated molecules** (half the rounds) are made by a crude generator: chains of C(=O), C(O), C=C, with a ring or phenol on the end now and then. The game's own molecules are in the other half; the fit table shows the two differ (grow 91% against 63%).
- **Only the reagents' own steps and the reflexes are measured.** Instruments, homunculi, specs, and the gold price are not in the engine.

## Files and commands

`reagent_stats.py` (this program), `REAGENT_STATS.md` (this page), `reagent_stats.json` (every number above and more: per-reagent blocks, all 153 pairs with their ranges, the spec effect).

```
python reagent_stats.py main   OUT/main.stream 72 30    # rounds per round number, look-ahead rounds per round number
python reagent_stats.py pairs  OUT/pairs.stream 27
python reagent_stats.py specs  OUT/specs.pkl 36         # then: specs_null OUT/specs_null.stream 36
python reagent_stats.py sens   OUT/sens.stream 18
python reagent_stats.py fit    OUT/fit.pkl 300
python reagent_stats.py reach  OUT/reach.pkl 100
python reagent_stats.py agg    OUT                      # writes REAGENT_STATS.md and reagent_stats.json next to this file
```
