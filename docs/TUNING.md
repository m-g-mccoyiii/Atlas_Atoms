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

## Second tuning pass, 2026-11-10

Measured with a new simulated player ("greedy") that takes whatever would make the most right now. It is kept out of the numbers to beat. Each figure is a median over the six plain molecules, 7 to 9 plays each, and moves by about 0.2 between measurements.

What adding one reagent to the starting four is worth:

| Reagent | Rarity | Worth |
| --- | --- | --- |
| hydroborate | common | 1.8 |
| HCl with KOH | uncommon | 1.7 |
| thionyl chloride with NaOH | uncommon | 2.0 |
| add methyl | uncommon | 1.4 |
| methylenate | uncommon | 1.6 |
| oxidize C=C (found) | rare | 1.3 |
| strip C=O (found) | rare | 1.35 |
| add allyl | rare | 4.0 |
| polymerize | legendary | 6.6 |

Changes that got there: rare reagents have one use on a page; add allyl adds 20 a place, not 45; polymerize keeps two uses and adds 20 times half the chain length a place; a found reagent counts its places three or four times and adds the row bonus of the name it stands for (before this, both made a round worse).

What one piece of catching equipment is worth, with hydroborate and add methyl held: cold trap 1.7, aqua regia 1.95, drying tube 1.3, molecular sieves 1.5, fume hood 1.75, scrubber 1.25, burner 1.25, litmus paper 1.35, black candle 2.15.

Number to beat: round 1 is now 1.1 of the plain player's lower quarter (was 0.8), then 1.58 times a round (was 1.62), because the greedy player beat early rounds four times over.

Rounds beaten by the greedy player, 50 to 60 runs each (10th / 25th / median / 75th / 90th):

| Supplier tier | Extras open | Picks | Rounds beaten |
| --- | --- | --- | --- |
| 0 | none | equipment first | 7 / 8 / 8 / 9 / 10 |
| 0 | none | random | 2 / 3 / 5 / 7 / 9 |
| 3 | all families, both found | equipment first | 5 / 7 / 8 / 9 / 10 |
| 5 | all families, both found | equipment first | 6 / 7 / 8 / 9 / 11 |

Median made over the number to beat, tier 0, equipment first, rounds 1 to 11: 2.4, 2.9, 2.9, 2.5, 2.2, 2.5, 1.9, 1.4, 1.1, 0.9, 0.7.

Still open: add allyl is worth twice the target for a rare. Deeper suppliers and families raise how far a round is beaten early (3 to 6 times) but not how many rounds a run lasts: every setup ends near round 8 or 9, which means the last rounds are decided by the climb of the number and not by the build. Rounds with a rule, carrying a molecule on, and spending water or hydrogen are not in any simulated run.

## Chain reactions, 2026-11-10

- When a row reaches three, the molecule is set off ("overreact"): every reaction that carries the row on then happens by itself, one after another and faster each time, without using the page's reactions, until nothing carries it on or the reagents run out. This replaces "every third reaction in a row gives one more reaction".
- The numbers to beat were measured again with chains in (12 plays a style) for all ten starting molecules and stored. They rose by about half to double.
- Number to beat: round 1 is 0.55 of the stored figure (was 1.1), then 1.6 times a round. Chains make a round swing more, so round 1 has to be forgiving: at 0.8 one greedy run in ten failed in round 1 or 2.
- Greedy player, tier 0: equipment first 8 / 8 / 9 / 9 / 10 rounds beaten, random picks 3 / 5 / 6 / 7 / 8.
- Not measured again after the change: single reagents, single pieces of equipment, tiers above 0.

## The chain is fired by the player, 2026-11-10

- A page that is used up with a row of three or more on it waits. The player sets it off ("set it off", click or Space), once a page. The molecule then reacts by itself until nothing carries the row on or the reagents run out.
- The chain may go back to a molecule it has already been (before, this needed the recycler). The recycler now adds row +0.5 on such a step. With this a chain runs 5 to 10 steps and one page can multiply what the round has made by ten or more.
- The numbers to beat were measured again for all ten starting molecules and seven rules (70 figures). They are now in the tens of thousands in round 1.
- Number to beat: round 1 is 0.9 of the stored figure, 1.75 times a round to round 3, then 1.5.
- Tier 0, 50 runs each, rounds beaten at the 10th / 25th / 50th / 75th / 90th run: keeps the row, equipment first 0 / 1 / 3 / 6 / 7. Keeps the row, random picks 0 / 1 / 1 / 2 / 2. Greedy 0 / 1 / 2 / 4 / 5. Never follows on 0 / 0 / 1 / 3 / 3.
- Median made over the number to beat, row player, rounds 1 to 8: 2.3, 2.1, 1.7, 1.7, 1.3, 1.1, 1.0, 0.7.
- Open: more than one run in ten fails round 1, which is too many. Random picks end by round 2. Most of a round's total comes from the last page, so the flask barely moves on page 1.

- Later the same day: the "set it off" button was removed. A page used up on a row of three goes off by itself after half a second. The rules and the stored numbers are unchanged, since the simulated player always fired.
