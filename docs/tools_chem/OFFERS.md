# Overreact: how often each reagent is offered, and what it costs

Written 12 November 2026. Every number comes from `reagent_stats.json` (the 18 reagents of `library.py` and `FINAL.md`, measured on the engine) through `offer_formula.py`. Nothing is typed in per reagent: when a reagent's measured numbers change, run `python offer_formula.py table` and its odds, its price and its place in the unlock order follow.

What other games do and why, in one line each, and what is taken from them:

| Game | What it does | Why it works | What we take |
|---|---|---|---|
| Slay the Spire | rare cards 3 in 100, common 60; a rare gets likelier with each common | a rare arrives on average without being promised | stronger is rarer; a not-seen reagent gets likelier |
| Balatro | three joker tiers 70/25/5, fixed prices by tier, reroll $5 then +$1, interest capped | rarer is readable at a glance; spending is a real choice | price from strength in whole gold; reroll that rises within a visit (already built) |
| Vampire Survivors | each item's weight is a number; few slots, so each pick makes the next offer more relevant | fine steps without named tiers | a weight per reagent, drawn without repeats |
| Hades | the best boons need boons already held | strong things feel earned | held partners make a reagent likelier |
| Teamfight Tactics | the shop's odds move with the player's level; a shared pool | spending changes what is seen | odds move with the round; a run carries its own stock |
| Risk of Rain 2 | price grows on the same clock as difficulty | gold never outruns the game | tested and left out: gold here does not grow with the round |
| League of Legends | price = gold per point of each stat, read off a table | anything new can be priced in minutes | price = gold per point of measured worth |

## 1. The inputs

Five measured numbers go in, all from `reagent_stats.json`.

| Input | What it is | Why it belongs |
|---|---|---|
| Worth W | mean yield with the reagent over mean yield with a dud in its place, minus one | the one number for strength; rarity and price both follow it |
| Band worth | the same in rounds 1 to 3, 4 to 6 and 7 to 9 | says when a reagent comes alive; epoxidation is a dud until round 7 |
| Reach | share of rounds in which the reagent changes the yield at all | "widely useful"; fit at round start is not used for the weight because the near-dead five fit 58 to 66% of molecules and still change only a quarter of rounds |
| Swing | spread of the log of the round ratio | steady or lumpy; used for the unlock order |
| Partner bonus and dependence | the pair table's bonus b(x, y); dependence D = best bonus / (best bonus + W + 0.10) | partners raise the weight; dependence orders the unlocks |

| Reagent | Held | Worth W | Rounds 1-3 | 4-6 | 7-9 | Alive from | Reach | Fit at start | Swing | Best partner | Best later partner | Dependence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| oxidize | start | +181% | +182% | +158% | +174% | round 1 | 95% | 79% | 0.86 | grow (+60%) | dihydroxylation (+53%) | 0.24 |
| grow | start | +63% | +55% | +70% | +44% | round 1 | 87% | 77% | 0.45 | oxidize (+60%) | ozonolysis (+31%) | 0.45 |
| ozonolysis | unlock | +41% | +27% | +69% | +30% | round 1 | 79% | 63% | 0.43 | grow (+31%) | chugaev (+6%) | 0.38 |
| epoxidation | unlock | +30% | -1% | -2% | +84% | round 7 | 45% | 63% | 0.42 | grow (+27%) | hwe (+4%) | 0.41 |
| hydroformylation | unlock | +22% | +16% | +39% | +13% | round 1 | 73% | 63% | 0.36 | grow (+29%) | hwe (+8%) | 0.48 |
| dehydrate | start | +22% | +5% | +24% | +31% | round 4 | 92% | 80% | 0.45 | ozonolysis (+24%) | ozonolysis (+24%) | 0.43 |
| dihydroxylation | unlock | +20% | +18% | +31% | +11% | round 1 | 65% | 63% | 0.31 | oxidize (+53%) | hwe (+9%) | 0.64 |
| hwe | unlock | +17% | +26% | +16% | +8% | round 1 | 57% | 46% | 0.29 | oxidize (+15%) | dihydroxylation (+9%) | 0.36 |
| chugaev | unlock | +15% | +3% | +17% | +22% | round 4 | 56% | 80% | 0.28 | ozonolysis (+6%) | ozonolysis (+6%) | 0.20 |
| hydroborate | start | +13% | +9% | +14% | +13% | round 1 | 87% | 63% | 0.43 | grow (+4%) | permanganate (+3%) | 0.14 |
| hydrate | start | +10% | +14% | +8% | +9% | round 1 | 88% | 63% | 0.44 | chugaev (+6%) | chugaev (+6%) | 0.23 |
| reduce | start | +1% | +2% | +0% | +1% | never | 59% | 16% | 0.30 | epoxidation (+3%) | epoxidation (+3%) | 0.18 |
| hofmann | unlock | +0% | +0% | +0% | +0% | never | 0% | 0% | 0.00 | ritter (+8%) | ritter (+8%) | 0.45 |
| cyanohydrin | unlock | -0% | -2% | -0% | +1% | never | 28% | 46% | 0.19 | hydroformylation (+3%) | hydroformylation (+3%) | 0.25 |
| ritter | unlock | -2% | -1% | -1% | -3% | never | 27% | 63% | 0.24 | hofmann (+8%) | hofmann (+8%) | 0.45 |
| thiolene | unlock | -2% | -1% | -2% | -4% | never | 27% | 63% | 0.23 | hydroformylation (+5%) | hydroformylation (+5%) | 0.33 |
| chlorination | unlock | -2% | -2% | -3% | -3% | never | 25% | 58% | 0.33 | hydroformylation (+3%) | hydroformylation (+3%) | 0.25 |
| permanganate | unlock | -3% | -3% | -3% | -3% | never | 26% | 66% | 0.21 | hydroborate (+3%) | hydroformylation (+2%) | 0.21 |

"Alive from" is the first band where the reagent adds 8% or more.

## 2. The offer

### Two draws

1. **The run's stock.** At the start of a run, the supplier stocks a few of the unlocked reagents: 4 for a bachelor's, 5 for a master's, 5 for a doctorate (fewer if fewer are unlocked). They are drawn by the weight below, read at round 2, times the drought across runs.
2. **Each visit** (after each round but the last) the free pick of one from three is drawn from the stock plus any starter the player has put back, by the weight below, without repeats. A fourth, priced slot is drawn from everything else unlocked (section 3).

The stock comes from TFT's pool and from the owner's note in `LOOP.md` that two runs should see different reagents. A doctorate has eight visits; with all twelve open to every visit, a player who reads the reagents saw everything and took the same five every run (section 6). The stock is what makes runs different.

### The weight

    weight(x) = U × R × A × P × M

| Term | Formula | Constant | Reason | Pattern, and how ours differs |
|---|---|---|---|---|
| U, usefulness | 0.30 + 0.70 × reach | 0.30 | a reagent that changes nothing is offered less but never shut out | our own: no other game has a measured "does nothing" share |
| R, rarity | e^(−2.5 × max(0, W)) | k = 2.5 | stronger is rarer: +41% worth is offered 0.36 times as often as a dud-level one | Slay the Spire and Balatro tiers, as a smooth curve like Vampire Survivors, set by measured worth instead of a label |
| A, timing | (1 + mean band worth over the rounds left in the run) / (1 + its mean band worth) | power 1 | offered when it will be alive: epoxidation is 0.78 early in a bachelor's, 1.45 at round 8 of a doctorate | TFT odds by level; ours moves by each reagent's own curve, not by tier |
| P, partners | product over held unlocks of (1 + 2 × b), divided by (1 + 2 × b) for each starter put back; b clipped to -0.4 to +0.6; P kept within 0.5 to 2 | κ = 2 | a reagent that pays more with what is held is likelier; a twin of what is held is less likely | Hades and Vampire Survivors favour what is held; ours reads the measured pair bonus, and the six are the base the worth was measured on, so they count only when missing |
| M, drought | (1 + 0.20 × visits since last shown) × 0.6^(times shown and passed this run) | 0.20, 0.6 | a reagent kept from view comes back; one the player turned down twice stops crowding the three | Slay the Spire's rare offset, per reagent instead of per tier, with a turn-down rule added |
| Stock drought | stock weight × (1 + 0.5 × runs since last stocked) | 0.5 | every reagent comes round across runs | Slay the Spire's offset across runs |

Run length enters through A (only the rounds left in this run count, so epoxidation is rare in a bachelor's and common late in a doctorate) and through the stock size. The pity rule is in, because the stock keeps the pool small and a reagent can otherwise go many runs unseen; the turn-down rule is in, because three slots are few and an offer refused twice is a wasted slot.

### The weights at round 5 of a doctorate, the six held

| Reagent | U | R | A | Weight | Share of one slot |
|---|---|---|---|---|---|
| chugaev | 0.69 | 0.69 | 1.05 | 0.506 | 10% |
| cyanohydrin | 0.50 | 1.00 | 1.01 | 0.503 | 10% |
| permanganate | 0.48 | 1.00 | 1.00 | 0.484 | 9% |
| thiolene | 0.49 | 1.00 | 0.99 | 0.484 | 9% |
| ritter | 0.49 | 1.00 | 0.99 | 0.483 | 9% |
| chlorination | 0.47 | 1.00 | 1.00 | 0.472 | 9% |
| hydroformylation | 0.81 | 0.57 | 1.01 | 0.468 | 9% |
| dihydroxylation | 0.75 | 0.60 | 0.99 | 0.449 | 9% |
| hwe | 0.70 | 0.66 | 0.95 | 0.439 | 8% |
| epoxidation | 0.62 | 0.47 | 1.18 | 0.345 | 7% |
| ozonolysis | 0.86 | 0.36 | 1.03 | 0.313 | 6% |
| hofmann | 0.30 | 1.00 | 1.00 | 0.300 | 6% |

### The odds at rounds 2, 5 and 8 of a doctorate

All twelve in the pool, no drought. "Empty-handed": the six held, no unlock, so no partner counts. "With partner": its best later partner held (that partner leaves the pool, which also lifts the others a little). "One slot" is the share of a single draw; "in three" is the chance to be among the three.

| Reagent | Price | R2 one slot | R2 in three | R2 with partner | R5 one slot | R5 in three | R5 with partner | R8 one slot | R8 in three | R8 with partner |
|---|---|---|---|---|---|---|---|---|---|---|
| chugaev | 3 | 9% | 28% | 32% | 10% | 29% | 33% | 10% | 29% | 34% |
| cyanohydrin | 2 | 10% | 28% | 33% | 10% | 28% | 33% | 10% | 29% | 33% |
| permanganate | 2 | 9% | 28% | 31% | 9% | 27% | 31% | 9% | 28% | 31% |
| thiolene | 2 | 9% | 28% | 33% | 9% | 27% | 32% | 9% | 27% | 32% |
| ritter | 2 | 9% | 28% | 33% | 9% | 27% | 33% | 9% | 27% | 33% |
| chlorination | 2 | 9% | 27% | 31% | 9% | 27% | 31% | 9% | 27% | 31% |
| hydroformylation | 4 | 9% | 27% | 33% | 9% | 27% | 32% | 8% | 25% | 30% |
| dihydroxylation | 3 | 9% | 26% | 33% | 9% | 26% | 32% | 8% | 24% | 30% |
| hwe | 3 | 9% | 26% | 33% | 8% | 25% | 31% | 8% | 25% | 31% |
| epoxidation | 4 | 6% | 18% | 21% | 7% | 20% | 24% | 8% | 25% | 28% |
| ozonolysis | 5 | 6% | 18% | 22% | 6% | 18% | 23% | 5% | 17% | 21% |
| hofmann | 2 | 6% | 18% | 23% | 6% | 18% | 22% | 6% | 18% | 22% |

Chance to be in a run's stock (first run, all twelve unlocked):

| Length | Most likely | Least likely |
|---|---|---|
| bachelor's (4) | hwe 39%, the near-dead five 37 to 38%, dihydroxylation, hydroformylation 35%, chugaev 34% | hofmann 25%, ozonolysis 23%, epoxidation 19% |
| master's (5) | cyanohydrin 47%, the middle and near-dead 45 to 46% | ozonolysis 33%, hofmann 31%, epoxidation 24% |
| doctorate (5) | the middle and near-dead 43 to 47% | ozonolysis 32%, epoxidation 31%, hofmann 31% |

The pair bonuses between two unlocks are small today (at most +9%), so the partner term moves the odds by 3 to 6 points. The big bonuses are with the starters (grow, oxidize, dehydrate), which are held in every run and are already inside each worth.

## 3. The cost

**Decided:** the free pick of one from three stays. Gold buys three things around it:

1. **A fourth, priced slot** at each visit, drawn from everything unlocked outside the free three and outside the stock, with 0.4 of the rarity (e^(−1.0 × W)), so strong reagents show there more than in the free three. It is how gold reaches past the run's stock (Balatro vouchers and TFT levels: odds can be bought).
2. **The reroll,** as built: 1, then 2, then 3 within a visit, back to 1 at the next.
3. **Skip** pays 1, as built.

No hold. The drought term already brings back what was shown and missed, and a hold would add a mark to the screen for little.

No sell value for a reagent put back. With free picks a sell price would turn every visit into gold.

**Price:**

    list price = round(2 + 7 × max(0, W)), at least 1
    price paid = list price + 1 for each reagent already bought from the slot this run

No random spread: prices are 2 to 5 gold, and ±10% of 3 is nothing (Balatro has none either). The rise with each buy follows Slay the Spire's card removal (+25 each time) and Balatro's reroll (+$1). No rise with the round: gold here comes from marks over the number and capped interest, about 3 to 4 a round from round 2 to 9 (`LOOP.md`), so it does not grow on a clock the way Risk of Rain's does.

| Reagent | Held | Worth W | List price | After 1 buy | After 2 |
|---|---|---|---|---|---|
| oxidize | start | +181% | 15 | 16 | 17 |
| grow | start | +63% | 6 | 7 | 8 |
| ozonolysis | unlock | +41% | 5 | 6 | 7 |
| epoxidation | unlock | +30% | 4 | 5 | 6 |
| hydroformylation | unlock | +22% | 4 | 5 | 6 |
| dehydrate | start | +22% | 4 | 5 | 6 |
| dihydroxylation | unlock | +20% | 3 | 4 | 5 |
| hwe | unlock | +17% | 3 | 4 | 5 |
| chugaev | unlock | +15% | 3 | 4 | 5 |
| hydroborate | start | +13% | 3 | 4 | 5 |
| hydrate | start | +10% | 3 | 4 | 5 |
| reduce | start | +1% | 2 | 3 | 4 |
| hofmann, cyanohydrin, ritter, thiolene, chlorination, permanganate | unlock | 0 to -3% | 2 | 3 | 4 |

A starter is priced only when it was put back and comes up again. The best unlock costs about one round's gold, so a player buys one every two or three visits and still has gold for an instrument. A player with no gold still takes one of three for free, or skips for a coin.

## 4. The unlock order

    lateness = (z(swing) + z(dependence) + z(worth) + z(round it comes alive)) / 2 − z(reach)

z is the number's distance from the twelve's average in spreads. Wide reach pulls a reagent earlier; swing, need of a partner, strength and coming alive late push it later. A reagent that never comes alive counts as round 10.

The runs column is the measured pace of the reagent shelf in `FINDINGS.md` (the median run on which a middling player finds each of its twelve reagent findings, from its career model), given out in this order. Each reagent's finding must be set so it lands near its run; `FINDINGS.md` still names the old reagents (Wittig, Jones, Suzuki and others) and is to be rewritten for these twelve. The deed for each piece is the one in `FINAL.md` section 4.

| Order | Reagent | Lateness | Swing | Reach | Dependence | Worth | Alive from | Median run | Deed (`FINAL.md`) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | chugaev | -1.45 | 0.28 | 56% | 0.20 | +15% | round 4 | 2 | an OH on a carbon whose two neighbours are both CH2 |
| 2 | hwe | -1.06 | 0.29 | 57% | 0.36 | +17% | round 1 | 4 | an aldehyde or methyl ketone with an OH 3 or 4 carbons from it |
| 3 | hydroformylation | -0.78 | 0.36 | 73% | 0.48 | +22% | round 1 | 9 | a C=C and an OH 2 or 3 carbons apart |
| 4 | ozonolysis | -0.46 | 0.43 | 79% | 0.38 | +41% | round 1 | 9 | a C=C with carbon on both ends of both carbons |
| 5 | cyanohydrin | -0.23 | 0.19 | 28% | 0.25 | 0% | never | 12 | an aldehyde or methyl ketone with an OH 2 to 4 carbons from it |
| 6 | permanganate | -0.19 | 0.21 | 26% | 0.21 | -3% | never | 13 | a chain-end C=C and an OH 3 to 5 carbons from it |
| 7 | dihydroxylation | -0.05 | 0.31 | 65% | 0.64 | +20% | round 1 | 21 | a C=C beside a C=O |
| 8 | thiolene | +0.34 | 0.23 | 27% | 0.33 | -2% | never | 31 | a C=C and a C=O 3 to 5 carbons apart |
| 9 | chlorination | +0.55 | 0.33 | 25% | 0.25 | -2% | never | 36 | two OH 3 to 5 carbons apart |
| 10 | ritter | +0.89 | 0.24 | 27% | 0.45 | -2% | never | 43 | two C=C and a C=O at once |
| 11 | hofmann | +1.00 | 0.00 | 0% | 0.45 | 0% | never | 44 | an NH2 on a carbon (needs ritter) |
| 12 | epoxidation | +1.45 | 0.42 | 45% | 0.41 | +30% | round 7 | 57 | a C=C and an OH 3 or 4 carbons apart |

This differs from the order in `FINAL.md` section 4, which was set by which reflex each reagent teaches. Hofmann lands after ritter, its only feeder, by the numbers alone. Ozonolysis is the strongest unlock and comes fourth because its reach is the widest of the twelve; give it the weight of a strong piece by a harder deed if it should come later. Cyanohydrin and permanganate come before dihydroxylation only because they are steady; they do nothing on today's molecules, and their place moves by itself once they are measured on molecules that carry N, S, Cl or COOH.

## 5. Instruments and homunculi on the same formula

Measure each the same way: yield with it against a dud of the same kind in its place, by band, for the greedy and look-ahead players; reach; swing; the bonus with each reagent and with each other instrument. Then:

- **Instruments are bought, not picked.** The weight decides which instruments the shelf shows each visit (with the shelf's 0.4 rarity); the price is the same line, `round(2 + 7 × W)`, so gold buys worth at one rate whatever it buys. An instrument used once a round is measured as such. Its partner term reads its bonus with the reagents held, so a burner shows up more for a player carrying dehydrate.
- **Homunculi are not offered.** One hatches per jar. The same worth sets the jar's size: runoff needed = base × (1 + 7 × W) / (1 + 7 × average W of the ten), so a stronger homunculus takes a longer jar, as `HOMUNCULI.md` asks (slower jars better).
- **Unlock order** uses the same lateness, with "uses per round" in place of reach for instruments.
- **What changes:** the dud is a no-op of the same kind (an instrument that does nothing takes a shelf slot); the band split must include round 1 to 3 for a player with no instruments, since tier one holds none; and the partner table grows to reagent × instrument pairs, which is the one new measurement.

## 6. The check by simulation

**How it was run.** The offer layer is `offer_formula.py`. The player who picks reads the numbers: it takes the offered reagent whose worth over the rounds left, plus its partner bonuses with what is held, is highest, if that is at least 0.05; when it holds eight it puts back the held one worth least, if the new one beats it by 0.05; it buys from the priced slot when that beats the free three by 0.05 and leaves it 3 gold; it rerolls when nothing on offer is worth 0.10 and it has the gold. Gold per round: 2 or 3 for marks (2.4 on average, as `LOOP.md` measured), interest of 1 per 3 held up to 2, 1 for a skip. Runs come in a row (a career), so the drought across runs carries. All twelve unlocks are open. Then every round of every run was played on the engine: greedy player, molecules dealt as the game deals them, reflexes by band as in `REAGENT_STATS.md`, no round lost (the engine has no spec), so run yield is the sum of all rounds.

10,800 rounds played on the engine in 466 s: 300 runs of each length with the formula, 300 doctorates with every weight equal, and 300 doctorates with the six only. The offer counts were also run on 2,000 runs of each length without the chemistry.

**Doctorate, 300 runs on the engine:**

| Reagent | Seen in a run | Taken in a run | Held at the end | Run yield when held at the end | when not |
|---|---|---|---|---|---|
| chugaev | 100% | 56% | 56% | 10,316 | 9,228 |
| hwe | 100% | 50% | 50% | 10,199 | 9,468 |
| hydroformylation | 100% | 50% | 45% | 9,936 | 9,749 |
| dihydroxylation | 100% | 43% | 37% | 9,331 | 10,125 |
| epoxidation | 98% | 44% | 44% | 10,527 | 9,296 |
| ozonolysis | 99% | 41% | 41% | 10,740 | 9,213 |
| ritter | 99% | 3% | 3% | 8,539 | 9,869 |
| thiolene | 99% | 2% | 1% | 7,892 | 9,853 |
| cyanohydrin | 100% | 1% | 0% | | |
| chlorination | 99% | 0% | 0% | | |
| permanganate | 99% | 0% | 0% | | |
| hofmann | 96% | 0% | 0% | | |
| reduce (put back) | 49% | 0% | 51% | 9,004 | 10,686 |
| hydrate (put back) | 29% | 4% | 75% | 9,682 | 10,290 |
| hydroborate (put back) | 14% | 0% | 86% | 9,583 | 11,376 |

"Seen" counts the priced slot, which draws from outside the stock, so nearly everything is seen in eight visits; what a run can take for free is its stock of five.

| | Bachelor's | Master's | Doctorate | Doctorate, equal weights | Doctorate, the six only |
|---|---|---|---|---|---|
| Different final sets of eight | 14 of 300 | 51 of 300 | 74 of 300 | 71 of 300 | 1 |
| Most common final set | 45 runs | 20 runs | 18 runs | 14 runs | 300 |
| Run yield, mean | 1,494 | 4,808 | 9,834 | 9,709 | 8,091 |
| sd | 237 | 983 | 1,704 | 1,662 | 950 |
| p10 / median / p90 | 1,200 / 1,500 / 1,800 | 3,600 / 4,788 / 5,988 | 7,738 / 9,762 / 12,088 | 7,750 / 9,562 / 11,912 | 6,950 / 8,138 / 9,275 |
| Best | 2,025 | 7,975 | 16,112 | 17,312 | 10,700 |
| Fails the check | none | none | none | none | |

Mean yield by round, doctorate: 485, 473, 492, 969, 1,074, 1,148, 1,570, 1,771, 1,852.

In 2,000 offer-only runs of each length the same holds: no unlock is seen in fewer than 39% of runs (epoxidation in a bachelor's) or taken in more than 51%; the doctorate ends in 89 different sets. A player who takes at random ends in 1,679 different sets of 2,000.

**What the check says:**
- Unlocks lift a doctorate's yield by 22% over the six alone and nearly double the spread (sd 950 to 1,704). Runs holding ozonolysis or epoxidation at the end make 1,200 to 1,500 more than runs without.
- The weights themselves move yield little: the formula and equal weights end 1% apart. What makes runs different is the stock; what the weights decide is which reagents fill it and when they show (epoxidation 0% in a bachelor's, 44% in a doctorate; with equal weights a bachelor's would offer it as often as anything).
- Putting reduce, hydrate and hydroborate back raises yield (9,004 when reduce is kept to the end, 10,686 when it is put back), as the crowding flag in `REAGENT_STATS.md` said.
- The six near-dead unlocks are offered as often as the useful ones (their low worth makes them common, their low reach makes them rarer, and the two about cancel) and are almost never taken. About half of every offer is one of them. That is the chemistry, not the formula: on molecules that carry N, S, Cl or COOH their reach rises and their weights follow.

**What was tuned, and what changed:**
1. First version: no stock, all twelve open to every visit. In a doctorate the reading player saw every unlock and took hwe in 100% of runs, ozonolysis 100%, chugaev 99%, epoxidation 98%, hydroformylation 72%; 9 different final sets in 1,000. Equal weights failed the same way (99 to 100%), so no setting of the weight alone could pass: eight visits of three from twelve show everything.
2. Added the run's stock with a drought across runs. With a stock of 6 in a doctorate, hwe and chugaev were still taken in 63 to 67% of runs.
3. Grid of 72 settings (rarity k 1.5, 2.5, 3.5; doctorate stock 5 or 6; drought across runs 0.25, 0.5, 1; priced-slot rarity 0.4 or 1; turn-down 1 or 0.6), 600 runs each of master's and doctorate. Every setting with a doctorate stock of 5 passes, every one with 6 fails. Rarity k moves the most-taken share by 3 points (0.54 at k 1.5 to 0.51 at 3.5) and was left at 2.5. Drought 0.5, priced-slot rarity 0.4 and turn-down 0.6 were kept because together they give the highest least-seen share (81%).

## 7. What to measure in the real game, in order

1. **What players take.** For each visit: the three offered, the priced one, which was taken, which was put back. If one reagent is taken in more than 6 runs in 10, or the same final eight ends more than 1 run in 10, the stock is too big or that reagent's worth is under-read.
2. **Worth in people's hands.** Run yield with and without each reagent held, by round band, from real runs. Set-up reagents (grow, dihydroxylation, epoxidation) are likely worth more to a person who plans than to the greedy player; feed the real numbers back into `reagent_stats.json` and rerun `offer_formula.py table`.
3. **The priced slot.** Share of visits a reagent is bought, gold held when it is, and gold left at the end of a run. If players still end a run with 20 or more gold, the rise per buy is too small or the price line too low.
4. **Rerolls and skips.** How often and at what gold. A reroll on most visits means the three are too often near-dead.
5. **Unlock pace.** The run on which each reagent's finding is done, against the median run in section 4.
6. **Turned-down offers.** If the same reagent is turned down on most visits it is shown, the turn-down factor is too weak or its worth too high.
7. **Partner pull.** Whether holding a partner changes what is taken; the pair bonuses between unlocks are small today, so this matters once molecules with N, S and Cl arrive.

## Files

- `offer_formula.py`: the inputs, the weight, the price, the unlock order, the offer layer, the tuning grid and the engine check. `python offer_formula.py table`, `offers 2000`, `tune 600`, `engine OUT.pkl 300`, `report OUT.pkl`.
- Reads `reagent_stats.json`; plays rounds with `engine.py`, `molecules.py` and `hurdles.py` (`RULES_BAND`), none changed.
