# Overreact: numbers, 2026-11-10

All figures come from simulated players in the browser, not from people. A simulated player follows on when it can and otherwise takes the reaction that changes the most places.

## Targets

- Round 1 is beaten nearly always.
- A player who takes equipment first lasts about 8 rounds with the first supplier. A player who picks at random lasts about 5.
- One piece of equipment multiplies a round by about 1.5 to 2. Late tiers may go higher.
- Choosing a round does not pause the game.

## What was wrong

- A new reagent could end the run. Adding HCl alone cut a round to about a quarter, because nothing held could react with the chloride it makes. Thionyl chloride did the same. This was the wall at round 6.
- After the equipment slots filled, later picks added almost nothing.
- The number to beat grew 1.85 times a round whatever the player held.
- One carbon-14 could multiply a round by 30.

## What changed

- HCl comes with KOH as one pick, and thionyl chloride with NaOH. The first supplier sells hydroborate only.
- Five equipment slots.
- A stronger reagent adds 40 places per place per level, up from 20.
- Number to beat: 0.8 of the plain player's lower quarter in round 1, then 1.62 times a round. A round with a rule no longer asks an extra quarter.
- Carbon-14 multiplies extra by 1.25, down from 1.5.
- Weak pieces raised: spatula, stopper, mirror, cannula, reflux, burette, clamp, stir bar, carousel, dropper, homunculus, lead.
- Strong pieces cut: mortar, index cards, log book, seed crystal, scale pan, cold trap, stopwatch.
- The numbers to beat for the six starting molecules under each rule are stored in path.js, so choosing a round takes about 0.2 seconds.

## Measured after

Rounds beaten, 80 to 100 runs each, plain rounds only (10th / 25th / median / 75th / 90th percentile):

| Supplier tier | Picks | Rounds beaten |
| --- | --- | --- |
| 0 | equipment first | 4 / 7 / 8 / 9 / 10 |
| 0 | random | 2 / 3 / 5 / 7 / 8 |
| 1 | equipment first | 6 / 6 / 8 / 9 / 11 |
| 3 | equipment first | 3 / 6 / 7 / 8 / 11 |
| 5 | equipment first | 4 / 6 / 8 / 10 / 18 |
| 3 | random | 1 / 2 / 3 / 5 / 8 |

Median made over the number to beat, tier 0, equipment first, rounds 1 to 11: 2.8, 2.6, 2.5, 1.9, 1.7, 2.3, 2.2, 1.5, 1.1, 0.9, 0.7.

## Still open

- Opening more suppliers does not make a careless player last longer. Tier 3 with random picks lasts 3 rounds against 5 at tier 0, because the larger stock holds more pieces that add no number.
- About one run in ten at tier 5 never ends. Nothing caps a run.
- One reagent pick (hydroborate) doubles a round. No other single pick does.
- Recycler measured at 3.4 times on its own and was not changed.
- Rounds with a rule were measured only before the extra quarter was removed: a player who ignores the rule lasted 4 rounds against 8.
- Single-piece figures are from 60 plays each and move by about 0.3 between measurements.

## Rarity and new families, 2026-11-10 (not yet measured)

- Reagents have a rarity: common (each place 20), uncommon (30), rare (45), legendary (70). Odds among the reagents on offer in take-one: 60, 28, 10, 2, with the three rarer weights raised by a quarter for each supplier opened.
- Families opened with credit between runs: organometallics (5: add methyl, add allyl), ylides (8: methylenate), radicals (14: polymerize).
- Polymerize starts a chain at each C=C and doubles every chain on each later use. Each place it acts on adds 20 times half the total chain length. It has one use on a page.
- A named row done for the first time adds its one-step reagent for good: alkene to ketone gives oxidize C=C, carbonyl removal gives strip C=O.
- One scripted round with three polymerizations made 2,744 against 900. Before the one-use limit and with legendary place value, four polymerizations made 110,621.
- None of this has been run through the simulated players. The stored numbers to beat still assume every place adds 20.

## By-products, 2026-11-10 (not yet measured)

- What leaves a molecule is sorted into water, hydrogen, oxide, chloride or other.
- Caught by equipment: cold trap takes water (extra +0.3), burner burns hydrogen (row +0.5), black candle lights hydrogen (extra times 1.2), litmus paper takes a chloride (extra +0.4), aqua regia takes an oxide or a chloride (extra times 1.3).
- Not caught: water and hydrogen are collected. Three water deal the page's reagents again. Three hydrogen give every reagent on the page one more use. Both carry over between rounds of a run.
- Every by-product adds a stroke to a tally. The fifth pays 50 places for each reaction in the open row.
- One scripted round with a cold trap and a black candle on a molecule with three alcohols made 20,591 against about 900, so the catch values are too high.
