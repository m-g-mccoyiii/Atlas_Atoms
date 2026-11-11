# Overreact: how hard it gets, and what winning is

2026-11-11. Three researchers with sources, a designer, a reviewer. On paper. Sections 4 and 5 below copy other games' rules too closely and are being rebuilt from this game's own pieces (the owner: "it can't just straight copy those").

## The design

**1. THE SHAPE**

Score to reach, as a multiple of round 1. The round 3, 6 and 9 rows are the rule rounds.

| Round | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| Multiple | 1 | 2.5 | 5 | 8.5 | 13 | 24 | 32 | 41 | 60 |
| Step from the round before | none | 2.5 | 2.0 | 1.7 | 1.5 | 1.85 | 1.33 | 1.28 | 1.46 |

- **Steep, then slowing.** Balatro's base steps fall 2.67, 2.50, 2.50, 2.20, 1.82, 1.75, 1.43. Luck be a Landlord's rent steps fall 2.0, 2.0, 1.5, 1.5, 1.33, 1.25, 1.13. Ours falls from 2.5 to 1.28. The current flat 1.85 a round reaches about 137 times by round 9, which is the wrong shape. Landlord reaches 31 times in 12 payments, and Balatro 167 times in 8 antes with 24 blinds.
- **Steps at the rule rounds.** Rounds 6 and 9 step up before the rest. Balatro's boss is 2 times the small blind in the same ante, and Landlord has the same bump at payment 9 (1.13 then 1.35).
- **Rests.** Rounds 7 and 8 are rests after the round 6 step. Landlord rests the same way at payments 8, 10 and 11 (1.13, 1.09, 1.08).
- **Round 1 does not change.** Balatro's ante 1 is 300 at every stake. Difficulty goes into the late rounds only.
- **Tier ends.** Tier 1 ends at 5 times and tier 2 at 24 times. Balatro's ante 4 is 17 times ante 1 and its ante 8 is 167 times.
- **Power needed.** A chain of n steps pays 25 times n times (n+1). Chain 4 pays 500, 8 pays 1,800, 12 pays 3,900 and 16 pays 6,800. Molecules gain atoms, so chain 4 in round 1 growing to chain 12 in round 9 gives 7.8 times from length alone. The other 60 divided by 7.8, about 7.7 times, must come from helpers and creatures. That is 1.29 a round compounding, so by round 9 a median player's multipliers must have grown about 8-fold.
- **Balatro's gap.** Per hand it needs 333 times more power against 167 times more requirement. Power must outrun the target by about 2 times, and ours does the same.
- **Tier 1.** Tier 1 has no helpers, so chain length alone must carry the median player 2 to 4 times over each number there.

**2. WINNING SEPARATE FROM THE SCORE MARKS**

**A. The last round is the test.**
- Modeled on: Balatro (win by beating ante 8; endless play afterward is a pure score race) and Dead Cells (beat the Hand of the King).
- The player sees: the last round carries the hardest rule, shown from the start of the run. Passing its number wins. The words and coins only rate the score.
- Risk: winning and "stable" are still the same total, so the owner's complaint stays.

**B. The finish.**
- Modeled on: Hades (clear the Temple), Brotato (kill the wave 20 boss) and Slay the Spire (the act boss shown on the map).
- The player sees: the last round names a finish for the molecule, such as "ring closed and no free OH" or "ends as a ketone". The player wins by passing the number and ending a turn with the finish in place.
- Risk: it can clash with the biggest chain. I reduce this by offering three finishes and letting the player take one.

**C. The clock.**
- Modeled on: Vampire Survivors' Reaper (655,350 health times player level, arriving at a fixed time) and Risk of Rain 2 (a difficulty clock, multiplier 1.15 per stage).
- The player sees: in the last round the number climbs 1.5 times each turn after turn three, and the run is won by clearing it before the climb outruns the molecule.
- Risk: a new rule appears at the hardest moment.

**Pick: B.** It is the only one where winning is a different act from scoring: the molecule ends as something specific. Slay the Spire and Balatro show their final test in advance. RDKit can check a finish against the SMILES, so the simulator can test it. The four words and the coins stay as the score layer. After a win, rounds 10 and up (Balatro endless) count only for words.

**3. THE THREE LENGTHS**

Per-run win share:

| Length | New player, first run | Average | Skilled |
|---|---|---|---|
| Three rounds | 30% | 65% | 90% |
| Six rounds | none | 25% | 60% |
| Nine rounds | none | 10% | 33% |

- **Three rounds.** The matches are Brotato Danger 0 (72.8% of owners win), Dead Cells first boss (72.2%), Monster Train first boss (96.5%) and Hades region 1 (81.8%).
- **Hades.** About 30 tries to a first clear is the number behind "a new player wins within a few tries" for tier 1.
- **Six and nine.** Slay the Spire wins 9% of all runs at Ascension 0 (Mega Crit, May 2026), and Balatro Gold is 12.2% of owners. A Steam percentage counts quitters, so it is a floor. The owner's 1 in 4, 1 in 10 and 1 in 3 sit inside that range.
- **Second source.** Dead Cells' second boss, at 55.7% of owners, backs the six-round figure.

Average player, nine rounds, chance to pass each round and where the lost runs end:

| Round | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| Pass | 98% | 95% | 82% | 85% | 80% | 62% | 75% | 68% | 60% |
| Share of all losses | 2% | 5% | 19% | 13% | 14% | 22% | 9% | 9% | 7% |

- The product is 9.8%. Rounds 3 and 6 hold 41% of all losses.
- **Peaks.** Balatro bosses are named as the usual killers (community only). Hades keeps 88%, 81% and 79% across its regions, a steady loss rather than a cliff.
- **Round 9.** I depart from Balatro here. 96% of owners who reach ante 8 have a win, so the end is soft. Ours is firm because the finish is a second condition.
- **Six-round table.** For the six-round run the pass rates are 98, 95, 80, 78, 72 and 60, which multiply to 25%. For three rounds they are 98, 95 and 70, which gives 65%.
- **Your own measure.** Round 1 should be passed by 95% of new players on their first line.

**4. THE ROUNDS THAT CHANGE A RULE**

Each section's rule round draws one rule from its pool. Each pool is modeled on the boss blind group named.

| # | Rule | Model |
|---|---|---|
| 1 | Each reaction has 2 uses this round, not 3. | The Water, no discards |
| 2 | A reaction used last turn cannot be used this turn. | The Eye, no repeats |
| 3 | Each reaction used costs 1 coin. | The Tooth |
| 4 | The molecule is 4 atoms bigger. | The Wall |
| 5 | One dealt reaction is blocked each turn, the one most used. | Window and Head |
| 6 | The molecule does at most two things by itself a turn. | The Needle |
| 7 | A ring that closes a second time pays nothing. | The Flint |
| 8 | A cascade stops after step 6. | The Pillar, a cap on the strong line |
| 9 | One helper is switched off each turn. | Crimson Heart |
| 10 | A reaction used twice in a turn is removed from the pool. | Cerulean Bell |
| 11 | The creature sleeps this round. | Amber Acorn |
| 12 | Between turns one atom of the molecule is swapped for another. | Violet Vessel, a size attack |

- Rules 1 to 4 go in round 3, 5 to 8 in round 6, and 9 to 12 in round 9. A later pool also holds the earlier ones, as in Balatro's rising minimum ante.
- Balatro has 8 bosses in ante 1, 18 by ante 2, and the joker attackers only at ante 8. Tier 1 has no helpers, so rules 9 and 11 cannot appear there.
- **How the player learns.** Balatro shows the boss in advance, and so does Slay the Spire. Each section opens by naming its rule round, with a mark on the pair screen. The rule is shown but not hinted, so a new player is never ambushed.
- **A record.** A rules-met page fills in once each rule has been faced, as an outline with a count.

**5. HARDER LEVELS AFTER A WIN**

Each level keeps all the earlier ones. The retention column is the share of those who cleared the level before.

| Level | Rule change | Model | Retention | Of nine-round winners |
|---|---|---|---|---|
| 1 | The first round pays no extra coins. | Red stake, small blind pays $0 | 70% | 70% |
| 2 | Redraw of the pair starts at 2 coins. | Slay the Spire Ascension 12-16, shops +10% | 78% | 55% |
| 3 | Rule rounds draw from the next pool up. | Balatro minimum ante bosses | 72% | 39% |
| 4 | A dud reaction joins the pool at round 4. | Ascension 10 curse card, Raccoin bad coins | 80% | 31% |
| 5 | The hand is four, not five. | Blue stake, a discard fewer | 78% | 24% |
| 6 | Rounds 5 to 9 are 25% higher. | Purple, ante 8 at 2 times against ante 2 at 1.25 | 82% | 20% |
| 7 | A helper is lost after 3 rounds. | Orange, perishable | 78% | 16% |
| 8 | Two rule rounds at the end, rounds 8 and 9. | Ascension 20, two bosses; Brotato Danger 5 | 65% | 10% |

- **Retention evidence.** Dead Cells' Boss Cells keep 53%, 64%, 77% and 77% of the previous level. Balatro Red keeps 61% of White winners, Black 42% and Gold 17%. Slay the Spire's Ascension 20 keeps about half of Ascension 10. Brotato falls from 72.8% to 35% at Danger 5, mostly in the last step.
- **Shape.** The first drop is big, the middle eases, and the last is a cliff.
- **Where numbers move.** Only level 6 touches the numbers, and only late. Brotato Dangers 0 to 2 and Peglin Cruciball 1 change enemies, not the target.

**6. HOW HARD IT IS TO GET EVERYTHING**

An average player. A run takes about 4 to 10 minutes.

| Runs | Reactions | Helpers (of 10) | Creatures (of 10) | Kits (of 7) | Tier | Stake |
|---|---|---|---|---|---|---|
| 1 | 6 | 0 | 0 | 1 | 1 | none |
| 5 | 8 | 2 | 0 | 1 | 2 | none |
| 20 | 11 | 6 | 2 | 3 | 3 | none |
| 60 | 15 | 9 | 5 | 5 | 3 | 2 |
| 150 | 18 | 10 | 8 | 7 | 3 | 4 |

- **Last few percent.** About 4% of owners would see the full set of 20 reactions or the full book including cholesterol, about 5% the tenth creature, and about 1.5% stake 8.
- **Guides.** Hades epilogue is 8.4% and all six weapons 19.5%. Dead Cells Collector is 5.8% and its no-hit win 3.5%. Slay the Spire Ascension 20 is 7.3%.
- **Not locked away.** Monster Train's developer says content behind the top difficulty goes unseen, so no unlock needs a stake above 4. The last unlocks are only slow, never gated behind stakes 5 to 8.
- **Pacing.** Ascension 10 is 14.8% of owners, but 66.3% of owners unlock Ascension at all.

**7. THE ECONOMY AGAINST THE CURVE**

| | Rounds 1-3 | Rounds 4-6 | Rounds 7-9 |
|---|---|---|---|
| Base pay | 3 | 4 | 5 |
| Rule round bonus | +2 | +2 | +2 |
| Marks | 1, 1, 2, 3 | same | same |
| Interest | 1 per 5 held, cap 3 | same | same |
| Weak helper | 4 | 4 | 4 |
| Middle helper | not sold | 7 | 7 |
| Strong helper | not sold | not sold | 11 |
| Offer reroll | 2, then +1 | same | same |
| Pair redraw | 1, 2, 3 | same | same |

- **Where the numbers come from.** Balatro blinds pay $3, $4, $5 and $8 for the showdown. Interest is 1 per 5, capped at 5. Reroll starts at $5 and adds 1. Jokers cost $1 to 6 common, $4 to 8 uncommon and $7 to 10 rare, odds 70, 25 and 5.
- **Income.** About 8 coins a round for the median, around 70 over nine rounds. Balatro brings in $12 a ante.
- **Prices.** A weak helper is half a round of income, as a Balatro common is half an ante of income. Prices stay flat against a curve that grows 60 times, so money buys choices and the build must compound.
- **Interest.** The cap is 3, lower than Balatro's 5, because our income is smaller. It gives the same saving-or-spending choice.
- **Departure.** Balatro reroll starts near a weak joker's price. Ours starts at half, so a player with no coins is never stuck, per the owner's no-punishing rule.
- **Held coins.** The median now ends a run holding 28 coins. After this the target is about 12.

**8. WHAT TO MEASURE, IN ORDER**

1. Total score by round for four simulated players (novice, median, planner, skilled), reactions only, by molecule size.
2. Set rounds 1 to 3 to the table so the three-round pass rates read 98, 95 and 70 for the median.
3. Worth of each helper per coin spent, to set the prices.
4. Worth of each creature as a multiplier on total.
5. Fit rounds 4 to 9 so the pass rates match section 3, and the share of losses peaks at rounds 3 and 6.
6. The pass-rate drop from each of the twelve rules for the median. Mild is under 8 points, middle 8 to 15, hard 15 to 25. Reorder the pools to match.
7. The finish test: the share of rounds that pass the number but miss the finish, and the finish pass rate by skill.
8. Retention at each of the eight levels, then adjust until the last reads 10% of nine-round winners.
9. Runs to each unlock by deed for each skill, against the table in section 6.
10. Coin totals and spend by round, against section 7.

## The review

**Verdict: the shape is plausible, but the evidence is partly decoration, tier 1 contradicts its own numbers, and winning is not yet a different act.**

**(1) Do the choices follow from the numbers?**
- The Balatro targets and the 167 times check out. The Luck be a Landlord steps do not. The wiki rents are [25, 50, 100, 150, 225, 275, 325, 375, 500, 550, 650, 777](https://luck-be-a-landlord.fandom.com/wiki/Rent). The real steps are 2, 2, 1.5, 1.5, 1.22, 1.18, 1.15 and then 1.33, not 1.33, 1.25, 1.13. "Rests at 8, 10, 11" is wrong at 11 (1.18).
- The 31 times is right. Landlord's tail is close to straight-line. That undercuts "steep then slowing" as a lesson.
- The per-run win shares lean on Steam owner percentages (Brotato 72.8%, Dead Cells 72.2%, Gold 12.2%). Those are the share of owners who ever got the achievement. They are not the chance of winning a run, so they cannot back a 65% per-run figure. Only Slay the Spire's 9% of runs is per-run.
- "About 30 tries to a first Hades clear" is cited as the basis for "a new player wins within a few tries". It argues the opposite.
- The pass rates are back-fitted to hit 25% and 10%. That is the same flat target setting you were told to stop.
- The six-round pass rates (80, 78, 72, 60) and the nine-round ones (82, 85, 80, 62) describe the same rounds. The six-round last round adds a finish and still passes about the same as nine-round round 6.

**(2) Is the curve felt?**
- In log terms the target growth only falls. The sawtooth at round 6 has nothing on the player side to match it.
- Pass rates plateau at about 60 to 75% from round 5, so there is no felt cliff.
- Tier 1 is arithmetically broken. Power is 25n(n+1), so a chain growing from 4 to 7 gives 2.8 times. Round 3 asks 5 times round 1. "Chain length alone carries the median 2 to 4 times over each number" cannot hold at round 3.
- Strong helpers are not sold until round 7, but power must already be about 4 times higher by round 5.
- The average player does lose most full runs, and a new player can win the short one.

**(3) Winning separate from the marks?**
- B is the right pick, but its cited games (Hades, Brotato, Spire boss) are bosses to defeat, not finish conditions. That is the decoration.
- The finish shows only in the last round, so the player cannot build toward it.
- A finish plus a rule plus the hardest step all land on round 9.

**(4) Rule rounds**
- Rules 1, 3, 4 and 12 are number tweaks, not attacks on a way of playing.
- Rule 3 taxes coins, which breaks "not punishing".
- Rule 8 caps chains at 6 against a 24 times target. That attacks the core goal and cannot be passed.

**(5) Everything unlocked**
- It is hard but possible, and the 150-run pace is sound.
- Levels 1 and 2 barely change play, because the median holds 28 coins. A 70% or 78% retention is asserted, not derived.
- Level 3 has no "next pool" at round 9.

**(6) HARNESS failures**
- N: "rounds 10 and up (endless)". A run is 3, 6 or 9 rounds.
- 125 and "not punishing": rule 3, "Each reaction used costs 1 coin".
- S: it says "tier", "stake", "pool", "retention" and "cascade", has no schematic, and is long.
- LOOP.md (not HARNESS) says the last unlocks ask for wins at harder stakes. The design caps unlock gates at stake 4. That is a defensible departure, but state it.
- P: choosing among finishes is close to a hint. It is allowed only if no reaction outcome is previewed.

**Five changes, most important first**

1. Replace section 2, Pick: "Pick B, moved to the start. Before round 1 the player is shown three finishes for the molecule and takes one. The run is won by ending any turn of the last round with that finish in place and the number passed. A three-round run offers the easiest finish only. The marks and coins rate the score and never decide the win. No rounds past the last."

2. Add to section 1: "Beating round 3 or round 6 gives a free pick of one strong helper, ahead of the step up. Round 6 stays at 24 times only if the median holds a doubling of multipliers on entering it."

3. Replace the Tier 1 line: "Chain 4 to 7 gives 2.8 times. The median clears round 1 at 4 times its number, round 2 at 2.2 times, and round 3 at 1.3 times."

4. Replace section 3's evidence: "Per-run chances are our targets, fitted last. Steam percentages only bound how many owners ever win. Only Slay the Spire's 9% of runs is per-run. Drop the Hades 30-tries line. A new player's first run wins 30% of the time, so about 3 tries. Six- and nine-round pass rates share one column per round, and the finish lowers the last one."

5. Replace rules 3, 4 and 8 with: "3: each reaction used after the second pays 1 coin less at round end, never below 0. 4: your first reaction each turn is chosen for you. 8: a cascade pays in full to step 6, then half." Also set level 3 to "round 9 draws two rules". Make level 1 "base pay 2" and level 2 "no interest".

Files read: C:\Work\atlas-atoms\docs\HARNESS.md, C:\Work\atlas-atoms\docs\ROGUELIKE_STUDY.md, C:\Work\atlas-atoms\docs\LOOP.md.

## Research: Balatro

# Balatro difficulty research for Overreact

**Source types:** Dev = developer. Wiki = fan wiki (balatrowiki.org). Data = public achievement stats. Community = a player's estimate. Calc = my arithmetic from a sourced number.

Two caveats up front. I found no developer statement about ante scaling or difficulty targets. I found no measured distribution of which ante runs die in.

## 1. Chip requirement by ante

Source: [Blinds and Antes](https://balatrowiki.org/w/Blinds_and_Antes) and [Ante](https://balatrowiki.org/w/Ante) (Wiki). The Small, Big and Boss columns are Calc: small is 1x, big is 1.5x, boss is 2x, rounded.

| Ante | Base (white) | Small / Big / Boss at base | Green | Purple | Base step from the ante before (Calc) |
|---|---|---|---|---|---|
| 1 | 300 | 300 / 450 / 600 | 300 | 300 | none |
| 2 | 800 | 800 / 1,200 / 1,600 | 900 | 1,000 | 2.67x |
| 3 | 2,000 | 2,000 / 3,000 / 4,000 | 2,600 | 3,200 | 2.50x |
| 4 | 5,000 | 5,000 / 7,500 / 10,000 | 8,000 | 9,000 | 2.50x |
| 5 | 11,000 | 11,000 / 16,500 / 22,000 | 20,000 | 25,000 | 2.20x |
| 6 | 20,000 | 20,000 / 30,000 / 40,000 | 36,000 | 60,000 | 1.82x |
| 7 | 35,000 | 35,000 / 52,500 / 70,000 | 60,000 | 110,000 | 1.75x |
| 8 | 50,000 | 50,000 / 75,000 / 100,000 | 100,000 | 200,000 | 1.43x |

- **Ante 8 against ante 1:** 167 times at base, and 667 times at Purple (200,000 over 300). Calc.
- **Blind multipliers:** The Wall is 4x and Violet Vessel is 6x. The Needle is 1x, but it allows only one hand.
- **Rounding:** Requirements are rounded to two significant digits.
- **Ante 1:** It is 300 at every stake. The stakes raise ante 2 and later, and the gap widens, so the early game stays the same and the late game steepens.
- **Source conflict:** A search summary of another guide gave 2,800 for ante 3 and 6,000 for ante 4. The wiki figures above are the ones I trust.

## 2. Endless mode (ante 9 and up, base stake)

The wiki's formula is: ante 8 value × (1.6 + 0.75k / (1 + 0.2k))^k, with k = ante − 8.

I could not reproduce the wiki's listed ante 10 value from the formula as fetched, so use the listed values. Listed values are Wiki. Step ratios are Calc.

| Ante | Requirement | Step from the ante before |
|---|---|---|
| 9 | 110,000 | 2.2x |
| 10 | 560,000 | 5.1x |
| 11 | 7,200,000 | 12.9x |
| 12 | 300,000,000 | 41.7x |
| 13 | 47,000,000,000 | 157x |
| 14 | 2.9e13 | 617x |
| 39 | about 4.8e309 | overflows the number type |

At ante 39 the score becomes "naneinf" and nothing can beat the requirement.

- **Wins and scores are separate.** The game is won by beating ante 8. Endless play after that is a pure score race.
- **Showdown bosses.** The five showdown bosses sit at ante 8, 16, 24 and every eighth ante after.

## 3. Boss blinds

Source: [Boss Blinds](https://balatrowiki.org/w/Boss_Blinds) (Wiki).

| Group | Count | Examples | Where |
|---|---|---|---|
| Any-ante bosses | 8 | Hook (discards 2 random cards after each hand), Club, Goad, Window and Head (debuff one suit), Psychic (must play 5 cards), Manacle (−1 hand size), Pillar | Ante 1 and later |
| Minimum ante 2 | 10 | Wall (4x size), Needle (one hand), Flint (chips and mult halved), Water (0 discards), House, Wheel, Fish, Mark | Ante 2 and later |
| Minimum ante 3 to 6 | 5 | Eye (no repeated hand type, ante 3), Tooth (lose $1 per card played, ante 3), Plant (face cards debuffed, ante 4), Serpent (ante 5), Ox (ante 6) | Ante 3 and later |
| Showdown | 5 | Amber Acorn (shuffles jokers), Verdant Leaf (all cards debuffed until a joker is sold), Violet Vessel (6x size), Crimson Heart (one joker disabled each hand), Cerulean Bell (forces a card) | Ante 8 only |

- **Rule changes, not just bigger numbers.** Early bosses hit one suit or one resource. Late bosses attack the joker build itself.
- **Pool growth.** The pool is 8 bosses at ante 1 and 18 at ante 2, inferred from the minimum-ante column. Calc.

## 4. Shop economy

Sources: [Shop](https://balatrowiki.org/w/Shop) and [Money](https://balatrowiki.org/w/Money) (Wiki), and a [shop economy analysis](https://saschb2b.github.io/game-mechanics/games/balatro/shop-economy) (community).

| Item | Number |
|---|---|
| Blind reward | Small $3, Big $4, Boss $5, Showdown boss $8 |
| Red stake and up | Small blind pays $0 |
| Unused hand | +$1 each |
| Interest | $1 per $5 held, capped at $5 (reached at $25) |
| Starting money | $4 on most decks |
| Reroll | $5 first, then +$1 each time; resets each shop |
| Joker price | Common $1–6, Uncommon $4–8, Rare $7–10, Legendary $20 (not sold in shops) |
| Joker odds | 70% common, 25% uncommon, 5% rare |
| Edition surcharge | Foil +$2, Holographic +$3, Polychrome +$5 |
| Sell value | Half of the cost, minimum $1 |
| Shop | 2 card slots, 2 packs, 1 voucher |
| Voucher | $10 |

- **Base income:** $12 per ante before hands and interest. Calc.
- **Pacing against the curve:** A joker costs $4–10 while requirements rise 167 times. Money buys very little of the late growth, so the late curve must be met by compounding multiplication. I found no source for money earned by ante, and no source for how the shop is paced against the curve.
- **The shop tension:** The core midgame choice is to save for interest or to spend. Hoarding leaves you underbuilt, and overspending loses interest.

## 5. Stakes

Source: [Stakes](https://balatrowiki.org/w/Stakes) (Wiki). Each stake includes everything before it.

| Order | Stake | Adds |
|---|---|---|
| 1 | White | Base game |
| 2 | Red | Small blind pays $0 |
| 3 | Green | Requirements scale faster |
| 4 | Black | Eternal jokers (cannot be sold) appear in shops |
| 5 | Blue | −1 discard |
| 6 | Purple | Requirements scale faster again |
| 7 | Orange | Perishable jokers (debuffed after 5 rounds) appear |
| 8 | Gold | Rental jokers ($3 a round) appear |

Pairing every stake with every deck gives 15 decks × 8 stakes, a 120-run grid. This is Analysis from the earlier study. The wiki page I fetched mixed in effects from other pages, so I left those out.

## 6. How often people win

Source: [Steam global achievement stats](https://steamcommunity.com/stats/2379780/achievements) (Data). These are shares of all owners who ever earned each achievement, not win rates per run.

| Achievement | Share |
|---|---|
| Reach ante 4 | 89.8% |
| Reach ante 8 | 74.4% |
| Win a run (White or higher) | 71.5% |
| Win on Red or higher | 43.6% |
| Win on Black or higher | 30.2% |
| Win on Gold | 12.2% |
| Win in 12 rounds or fewer | 20.1% |

- **Win given ante 8 reached.** Of owners who reached ante 8, about 96% have a win (71.5 ÷ 74.4). Calc. Most players who reach ante 8 clear it.
- **Where the survivors drop off.** Ante 1 to 4 loses about 10% of owners. Ante 4 to 8 loses about 15 more. Stake climbing is the real filter: Black keeps 42% of White winners, and Gold keeps 17%. Calc.
- **Other platforms.** [Exophase](https://www.exophase.com/game/balatro-steam/achievements/) shows different Steam and Xbox figures for the same achievements, so the numbers move with the sample. Xbox shows about 62.6% for reached ante 8 and 58.1% for won a run.
- **One player's log.** A [r/balatro post](https://lr.eu.psf.lt/r/balatro/comments/1bp932f/my_purpleorangegold_stakes_experience_data_and) (community, one player) reports a 17.5% win rate on Gold stake and 3.1% on the Black Deck. I only saw this through a search summary, so treat it as weak.
- **Per-run win rate:** No developer or tracker figure exists for it.

## 7. Why players lose

- **No measured data.** No dataset gives deaths per ante. Forum posts say two things. Gold-stake players lose many runs in antes 1 and 2. Bosses are described as the usual place runs end, and ante 8 bosses are named as repeat killers. All of this is community and anecdotal.
- **Dev warning on early jokers.** LocalThunk's [joker design post](https://lr.sudovanilla.org/r/balatro/comments/1czo9g0/guidelines_for_joker_design) says a joker picked early without enough scoring jokers will make you lose. That is Dev, and it is about build quality at ante 1 and 2, not about the curve.

## 8. What the developer has said

Source: [Rogueliker interview](https://rogueliker.com/balatro-interview/) (Dev).

- He admits "a lot of randomness, possibly too much."
- He calls balance ongoing tuning by feel, mostly changing a number.
- The interview does not address stakes, ante scaling, winning or endless mode.
- Earlier study entries add that he expects a couple of runs in about an hour, and that the stakes exist to push players into parts of the design they would skip.

## 9. Scoring shape

- **Formula:** A hand scores (chips) × (mult), then times-mult jokers multiply further. This is Wiki and well known. A weaker aggregator page also says late ante needs multiplied mult, not stacked +mult. I could not verify that.
- **Per-hand math:** Four hands a blind means an ante 1 small blind (300) needs about 75 a hand. The ante 8 boss (100,000) needs about 25,000 a hand. That is 333 times more per hand against 167 times more base requirement per ante. Calc. I did not find a sourced figure for typical build score per ante.
- **What this means for the shape:** The requirement curve is smooth and slowing at base: step ratios fall from 2.7 to 1.4. Player power is the thing that bends upward, so the curve is safe because builds are multiplicative. A player who never finds multiplication stalls in ante 4 to 6. Endless mode removes the safety: steps rise from 2.2x to 600x, so only compounding builds survive.

## What this means for a score-to-reach curve and a win structure

1. **Ramp fast then slow.** Base steps fall from 2.67x to 1.43x across eight antes, so a short run can start steep and flatten, while the total still grows 167 times.
2. **Keep the opening identical across difficulty.** Ante 1 is 300 at every stake, so a new player and an expert face the same start, and difficulty is added later in the curve.
3. **Make difficulty change the late curve, not the early one.** Purple's ante 8 is twice the base (200,000 against 100,000 at Green and 50,000 at base), while ante 2 only moves from 800 to 1,000.
4. **Let the final round be the hardest by size, not by surprise.** The boss is 2x the base blind, and the ante 8 boss at base is 100,000 against 600 at ante 1.
5. **Attach a rule change to the last round of each section.** Bosses change a rule, with eight mild ones at ante 1 and the joker-disabling ones saved for ante 8. That matches rounds 3, 6 and 9.
6. **Do not make winning the whole game the filter.** 96% of owners who reach ante 8 have a win, so the filter is the stake ladder: 71.5% win, 43.6% Red, 30.2% Black, 12.2% Gold.
7. **Set the filter by the number of ladder steps.** Each stake step in the data loses roughly a third to a half of the previous group, which is a usable shape for unlock difficulty.
8. **Keep a hard, optional layer of conditions.** Stakes add named conditions: no small-blind pay, fewer discards, perishable and rental jokers. They do not just raise a number.
9. **Make the score a separate goal from winning.** Ante 8 wins the game, and endless play jumps from 2.2x to 617x a step by ante 14, so a score race can run past the win without touching it.
10. **Keep money small against the curve.** Income is $12 a ante, jokers cost $4–10, and interest is capped at $5, so coins should buy choices, not the whole answer.

Not found: a measured death distribution by ante, a per-run win rate from any tracker, a developer statement on the ante numbers, and typical build score per ante.

## Research: Dead Cells, Hades, Slay the Spire

# Dead Cells, Hades and Slay the Spire: how difficulty steps and who finishes

Labels: **Steam** is public achievement data. **Wiki** is a fan wiki. **Dev** is the developer. **Community** is a forum or poll estimate. Steam percentages cover everyone who owns the game, including people who quit early, so they are floors on the real clear rate among people who play seriously.

## Dead Cells

**What winning is.** Winning is beating the Hand of the King. Mastery is the Boss Stem Cell (BSC) ladder, then no-hit boss kills. The BSC ladder is the five difficulty levels you unlock one at a time. The long tail is the Collector and no-hit achievements.

**What each BSC level changes.** Source: [Dead Cells wiki, Boss Stem Cells](https://deadcells.wiki.gg/wiki/Boss_Stem_Cells) (Wiki). The page gives no HP or damage multipliers.

| BSC | Healing | Enemies, loot, other |
|---|---|---|
| 1 | Health fountains at every other Passage | Early boss phases change. Item quality cap rises. |
| 2 | Fountains removed, one flask charge per Passage | Enemy cell drops x2 |
| 3 | 3 flask charges in the whole run | Item levels +1. Better cursed-chest items. |
| 4 | No flask charges | Enemies see further and most can teleport to you. Item levels +3. Cell drops x3. |
| 5 | No flask charges | Malaise turns on. A tougher final stage opens. |

BSC 1 to 3 mostly take away healing. BSC 4 and 5 add enemy behaviour and a run-long penalty.

**Scaling through a run.** Source: [wiki, Biomes](https://deadcells.wiki.gg/wiki/Biomes) (Wiki). I could not find the HP and damage multiplier for each tier. The wiki says they sit in game files.

| Stage | Enemy tier | Gear level |
|---|---|---|
| 1 Prisoners' Quarters | 1–3 | 1 |
| 2 Promenade, Sewers | 3–7 | 2–3 |
| 3 Ramparts, Ossuary | 6–13 | 3–4 |
| First boss | 11–13 | 3 |
| 4 Stilt Village, Graveyard | 14–20 | 4 |
| 5 Clock Tower | 19–24 | 5–7 |
| Second boss | 21–22 | 5–7 |
| 6 High Peak | 17–27 | 6 |
| Final boss | 27 | not listed |
| Optional true-ending stages | 37–46 | 10 |

Tier steps up about 3 to 6 per stage, close to a straight line. The sharp rise comes from the optional stages, which sit well above the main path. Gear rises one level per stage, so players can raise their power as fast as enemies rise.

**Who gets how far.** Source: [Steam global stats](https://steamcommunity.com/stats/588650/achievements) (Steam). Names come from the Steam API: [percentages](https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid=588650&format=json). The wiki names are in [wiki, Achievements](https://deadcells.wiki.gg/wiki/Achievements).

| Goal | % of owners |
|---|---|
| Reach stage 2 (Promenade) | 92.0 |
| Beat first boss (Concierge) | 72.2 |
| Beat second boss (Time Keeper) | 55.7 |
| Reach the Throne Room | 47.9 |
| **Beat the Hand of the King (win)** | **40.4** |
| Absorb 1st / 2nd / 3rd / 4th / 5th Boss Stem Cell | 41.1 / 23.0 / 15.2 / 11.8 / 8.6 |
| Finish the game with 1 / 2 / 3 / 4 BSC active | 21.6 / 13.9 / 10.7 / 8.2 |
| Beat the Collector | 5.8 |
| Beat Hand of the King with no hit | 7.4 |
| Beat the Collector with no hit | 3.5 |

The BSC mapping is inferred from the API names and from how well the numbers line up. The first stem cell (41.1) matches the Hand of the King kill (40.4). Reaching each stage loses about 2 to 10 points. From a first win, each BSC level keeps 53%, 64%, 77% and 77% of the players who beat the one before.

## Hades

**What winning is.** Winning is clearing the Temple of Styx. The long tail is clearing with every weapon, then Heat, then the epilogue after 10 clears.

**Attempts to a first clear.** I found no developer figure. The evidence is a [Steam thread](https://steamcommunity.com/app/1145360/discussions/0/2967267880891895395) (Community): 13 replies range from 5 to 44 runs. Reported counts are 5, 9, 10, 10 to 15, 11, 25 to 30, 33, 33, 34 and 44. About 30 is a typical figure. A [Reddit poll](https://lr.eu.psf.lt/r/HadesTheGame/comments/jx0cds/data_chart_how_many_runs_did_it_take_to_clear_the) (Community) is summarised in search results as 20 to 40 runs, with 14% not yet cleared. I could not open the page itself. Players who already hold permanent power from the Mirror of Night still need that many tries.

**Who gets how far.** Source: [Steam global stats](https://steamcommunity.com/stats/1145360/achievements) (Steam). The list covers 49 achievements.

| Goal | % of owners |
|---|---|
| Clear Tartarus / Asphodel / Elysium | 81.8 / 72.2 / 58.8 |
| Clear the Temple (first win) | 46.7 |
| Complete the story ("The Family Secret", 10 clears per [GamePressure](https://www.gamepressure.com/hades/trophies-achievements/z4d9d3)) | 23.3 |
| Win with each of the 6 weapons | 19.5 |
| Clear Elysium with Extreme Measures | 13.4 |
| Every Mirror talent used in a clear (inferred from the API name) | 8.9 |
| Epilogue | 8.4 |
| Every Pact condition tried (inferred) | 7.7 |

Each region keeps 88%, 81% and 79% of the players who cleared the one before. After that, hard goals stop being about progress and become optional challenges.

**Heat.** Source: [The Gamer](https://www.thegamer.com/hades-heat-pact-punishment-trivia/) (Community):
- There are 15 conditions.
- Maximum Heat is 63. One [RPG Site table](https://rpgsite.net/feature/10287-hades-pact-of-punishment-heat-modifiers-and-how-to-maximize-your-rewards) adds up to 61, so the sources disagree.
- Bounty rewards stop at Heat 20.
- Gates need 5, 10 and 15 Heat for the three regions.
- Skelly's prizes are at 8, 16 and 32 Heat.

I found no clear rate for any Heat level. The only Heat achievements on Steam are Extreme Measures and the Pact-condition one above. The 32 Heat run has no achievement.

## Slay the Spire

**What winning is.** Winning is the Act 3 boss. The Heart in Act 4 is the optional extra. Mastery is the Ascension ladder, which has 20 levels per character. Ascension is a single ladder of rule changes you opt into after a win.

**Act structure.** Source: [wiki, Bosses](https://slaythespire.wiki.gg/wiki/Bosses) (Wiki):
- Act bosses sit on floors 16, 33 and 50.
- The Heart is on floor 55.
- Ascension 20 adds a second Act 3 boss.

**Boss HP by act.** Source: wiki pages for each boss. Normal HP, then Ascension 9+.

| Act | Boss | HP |
|---|---|---|
| 1 | [Slime Boss](https://slaythespire.wiki.gg/wiki/Slime_Boss) | 140 / 150 |
| 2 | [Bronze Automaton](https://slaythespire.wiki.gg/wiki/Bronze_Automaton) | 300 / 320 |
| 3 | [Time Eater](https://slaythespire.wiki.gg/wiki/Time_Eater) | 456 / 480 |
| 4 | [Corrupt Heart](https://slaythespire.wiki.gg/wiki/Corrupt_Heart) | 750 / 800 |

Normal enemies are about 40 to 44 HP in Act 1 ([Jaw Worm](https://slaythespire.wiki.gg/wiki/Jaw_Worm)) and an Act 3 elite is 185 ([Nemesis](https://slaythespire.wiki.gg/wiki/Nemesis)). I could not find a developer statement on act scaling.

**Ascension, level by level.** Source: [wiki, Ascension](https://slaythespire.wiki.gg/wiki/Ascension) (Wiki). Each level keeps all earlier ones.

| Levels | What changes |
|---|---|
| 1–4 | More elites, then more damage from normal enemies, elites and bosses |
| 5–6 | Post-boss heal falls to 75%. Start with 10% less max HP. |
| 7–9 | More HP for normal enemies, elites and bosses |
| 10–11 | Start with a curse card. One fewer potion slot. |
| 12–16 | Fewer upgraded cards. Bosses pay 25% less gold. Lower max HP. Worse events. Shops cost 10% more. |
| 17–19 | Harder moves for normal enemies, elites and bosses |
| 20 | Two bosses at the end of Act 3 |

Early levels turn up the numbers. The middle takes away resources. The last levels change what the enemies do.

**Win rates.** Source: [Mega Crit Neowsletter, May 2026](https://megacrit.com/news/2026-5-22-neowsletter-issue-22/) (Dev):

| Ascension | Slay the Spire 1 | Slay the Spire 2 |
|---|---|---|
| 0 | 9% | 16% |
| 10 | not given | about 17% |
| 20 | 3% | not given |

The Neowsletter gives no win rate for Slay the Spire 1 at A1 to A9 or A11 to A19. It gives no split between average and top players. For top players I only found forum guesses of 40 to 50% at A20, which is not a measurement. Hardest-level wins are about 3% for everyone and an unverified guess for the best players.

**Who gets how far.** Source: [Steam global stats](https://steamcommunity.com/stats/646570/achievements) (Steam):

| Goal | % of owners |
|---|---|
| Beat Act 1 boss (Guardian) | 84.9 |
| Unlock Ascension | 66.3 |
| Beat the game with Ironclad / Silent / Defect / Watcher | 56.0 / 50.4 / 44.0 / 26.0 |
| Complete Ascension 10 | 14.8 |
| Complete Ascension 20 | 7.3 |

Only about 22% of players who unlock Ascension finish A10. About half of A10 finishers finish A20.

## What this means for a score-to-reach curve and a win structure

1. Reaching the first stage is near certain (92% in Dead Cells), so give the first round a score that nearly everyone beats.
2. Tier rises about 3 to 6 per stage in Dead Cells, so make each round's score step up by a similar fixed amount rather than doubling it.
3. Losses come as a steady fraction per step (Hades 88%, 81%, 79% keep playing), so aim for about 80% of players passing each round, with the harder rounds nearer 75%.
4. A first win is the big drop (Dead Cells reaches the Throne Room at 47.9% and wins at 40.4%), so the final round of a tier should be harder than the rounds before it by a clear step.
5. The biggest loss comes at the first extra step (Dead Cells 40.4% to 21.6%), so make the first stake a clear jump and let later stakes cost less (BSC 3 to 4 keeps 77%).
6. Opt-in difficulty with small stakes survives: Slay the Spire's A10 holds 14.8% and A20 holds 7.3% of owners.
7. Early stakes should raise numbers, middle ones should take resources away, and late ones should change how the molecule behaves (Ascension 1–9 are numbers, 10–16 take things, 17–20 change behaviour).
8. Half of Hades players never clear once (46.7%) and a first win takes about 30 tries, so a typical player taking many tries to win a six-round run fits the evidence.
9. A nine-round win should be one number everyone can see: about 8% of Slay the Spire owners finish A20, about 8% of Hades owners reach the epilogue, 3% of Slay the Spire 1 runs win at A20.
10. Nothing should be impossible: the hardest Dead Cells goals (3.5% to 5.8%) and Hades Heat 32 (no achievement) are optional extras, not the only way to open content.

## Research: Vampire Survivors and others

# Difficulty ramps and win structure in six games, for Overreact's score-to-reach curve

I read HARNESS.md lines 1 to 130, which cover sections A to W and the lines after them, plus ROGUELIKE_STUDY.md and LOOP.md. The study does not cover these six games' numbers. HARNESS.md and LOOP.md hold the flat targets, and the study records the number to beat growing 1.85 times a round.

Source types: Dev (developer), Wiki, Data (public achievement percentages), Community.

## Vampire Survivors

| Item | Number | Source |
|---|---|---|
| Enemy minimum alive, Mad Forest | 15 at 0:00, 30 at 1:00, 100 at 8:00, 300 at 11:00, 150 at 13:00, 300 at 21:00, 300 at 27:00 to 29:00 | Wiki, [Mad Forest](https://vampire.survivors.wiki/w/Mad_Forest) |
| Spawn interval | 1.0 s at the start, 0.1 s from minute 11 on most minutes | same |
| Enemy health, normal | x1, flat. Speed x1.1 plus 0.005 a minute | same |
| Enemy health, hyper | x3 plus 0.05 a minute. Minimum x1.25 | same |
| Alive cap | New spawns stop at 300 alive. Only bosses and events up to 500 | Wiki, [Enemies](https://vampire.survivors.wiki/w/Enemies) |
| Boss ladder | Bat or Mantichana-class boss at 1, 3, 5, 7, 9, 10, 11 and so on, growing in size to Giant Blue Venus at 25:00 | Wiki, Mad Forest |
| The Reaper | At 30:00, then one more each minute. Health 655,350 times player level. Damage 65,535. Speed 1,200 | Wiki, [The Reaper](https://vampire.survivors.wiki/w/The_Reaper) |
| Stage-clear payout | 500 gold, plus up to 400 for revives | same |
| Unlock pacing | Survive 1 min 97.8%, level 5 97.2%, level 10 95.4%, 10 min 93.5%, hold 6 weapons 92.7%, 20 min 84.0%, evolve Magic Wand 78.1%, beat the Hag (hyper Inlaid Library) 77.6% | Data, [Steam global stats](https://steamcommunity.com/stats/1794680/achievements) |

- **Shape of the ramp.** The stage does not raise enemy health. The count and the enemy type rise instead, and the wall is the Reaper at a fixed time.
- **Where average players fail.** The Steam page only showed the 26 most common achievements of 243, and 77.6% was the lowest of those. I could not find the 30-minute, Reaper or rarest percentages.
- **Winning versus score.** There is no win screen. Surviving to the limit pays 500 gold. Killing the Reaper is a special feat that needs a rare setup.
- **Not found.** Enemy health per minute for each enemy type. The experience needed per level. The 6-weapon and 6-passive cap is confirmed only by the 92.7% achievement.

## Brotato

Enemy health is the base plus (wave minus 1) times a per-wave gain. Source: Wiki, [Enemies](https://brotato.wiki.spellsandguns.com/Enemies).

| Wave | Baby Alien health | Chaser health | Charger health |
|---|---|---|---|
| 1 | 3 | 1 | 4 |
| 10 | 21 | 10 | 26.5 |
| 20 | 41 | 20 | 51.5 |

- **Wave timing.** Waves 1 to 9 last 20, 25, 30, 35, 40, 45, 50, 55 and 60 seconds, and wave 20 lasts 90. Endless waves last 60 seconds.

| Danger | Enemy health and damage | Other change | Steam win rate |
|---|---|---|---|
| 0 | none | none | 72.8% |
| 1 | none | new enemies | 60.8% |
| 2 | none | elites and hordes for 1 round | 54.5% |
| 3 | +12% | same | not found |
| 4 | +26% | elites and hordes for 3 rounds | not found |
| 5 | +40% | two bosses at wave 20, each with -25% health | 35.0% (Steam, Japanese page); 13% (Epic); 29.2% (PlayStation) |

Danger percentages are totals, not stacked. Sources: Wiki, [Dangers](https://brotato.wiki.spellsandguns.com/Dangers). Data, [Steam stats](https://steamcommunity.com/stats/1942280/achievements). The Danger 5 rates come from a search summary, [Epic](https://store.epicgames.com/achievements/brotato-ed4097) and [PlayStation](https://platpursuit.com/games/NPWR40773_00/j59up/), and I did not confirm them on the pages.

- **Winning versus score.** A win is surviving wave 20 and killing the boss. Endless is optional after that.

## Luck be a Landlord

Rent for payments 1 to 12, floor 2 and up. Floor 1 has 350 at payment 7, and floors 3 to 5 have 450 at payment 8. Source: Wiki, [Rent](https://luck-be-a-landlord.fandom.com/wiki/Rent), read through a search summary because the page itself would not load. The column-to-payment mapping is my reading.

| Payment | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Rent | 25 | 50 | 100 | 150 | 225 | 300 | 375 | 425 | 575 | 625 | 675 | 777 |
| Step ratio | | 2.00 | 2.00 | 1.50 | 1.50 | 1.33 | 1.25 | 1.13 | 1.35 | 1.09 | 1.08 | 1.15 |

- **Total.** The twelve payments sum to 4,302 and the last one is 31 times the first.
- **After payment 12.** The row continues with 1000 and "+500 per cycle". I read that as continued play but did not confirm it.
- **Spins.** A community Chinese wiki, via search summary, gives 5, 5, 6, 6, 7 spins for the first five payments. Later counts were not found.
- **Where players fail.** Steam win rates by floor run from 59.2% on floor 1 to 49.2% on floor 2 and 33.1% on floor 7. Five wins is 41.2% and "Landlord Defeated" is 33.9%. Source: Data, [Steam stats](https://steamcommunity.com/stats/1404850/achievements).
- **Winning versus score.** Winning is paying the 12th rent ([Wikipedia](https://en.wikipedia.org/wiki/Luck_Be_a_Landlord)). The floors form a ladder of 20 harder starts.

## Risk of Rain 2

The formula comes from Wiki, [Difficulty](https://riskofrain2.wiki.gg/wiki/Difficulty). Here coeff = (1 + minutes x 0.0506 x D) x 1.15^stages completed, for one player. D is 1 for Drizzle, 2 for Rainstorm and 3 for Monsoon.

| Minutes | Drizzle | Rainstorm | Monsoon |
|---|---|---|---|
| 10 | 1.51 | 2.01 | 2.52 |
| 30 | 2.52 | 4.04 | 5.55 |

These are my arithmetic, with zero stages completed. Each stage completed multiplies the value by 1.15, so five stages is 2.01 times.

- **Eclipse 1 to 8.** Each level keeps the ones before it. The steps are ally health -50%, teleporter radius -50%, fall damage doubled, enemy speed +40%, healing -50%, enemy gold -20%, enemy cooldowns -50%, and permanent damage curse. Source: Wiki, [Eclipse](https://riskofrain2.wiki.gg/wiki/Eclipse).
- **Win rate.** One achievement, "Washed Away", shows 52.1%. The page was incomplete and I did not confirm that it means beating the game. No other win rates were found ([Steam](https://steamcommunity.com/stats/632360/achievements)).
- **Winning versus score.** A win is beating Mithrix, and each win raises the Eclipse level. Looping continues after that.

## Monster Train and Peglin

| Item | Number | Source |
|---|---|---|
| Monster Train: defeat first boss | 96.5% | Data, [Steam](https://steamcommunity.com/stats/1102190/achievements) |
| Monster Train: win on Covenant 5 | 34.1% | same |
| Monster Train: win on Covenant 10 | 20.5% | same |
| Monster Train: covenant count | 25 | Community, [Steam forum](https://steamcommunity.com/app/1102190/discussions/0/4329623982985340769) |
| Peglin: Cruciball 1 to 5 | +1 enemy health; +1 enemy damage; more elites; fewer shop items; boss +1 health and +1 attack | Community, [ludo.guide](https://www.ludo.guide/guide/peglin/getting-started/difficulty-levels-cruciball/cruciball-level-unlocks-effects) |
| Peglin: Cruciball count | 20 | same |
| Peglin: finish Cruciball 5 | 25.7% | Data, [Steam](https://steamcommunity.com/stats/1296610/achievements) |
| Peglin: boss kills | 83.8, 81.8, 72.7, 71.1, 59.8, 54.2, 52.5, 47.3, 45.5% | same |

- **Not found.** The effects of each Monster Train covenant, and Peglin Cruciball levels 6 to 20.
- **Monster Train.** A win is beating the final boss, and the covenants are the ladder after it.
- **Peglin.** A win is beating the last boss.
- **Dev note.** The Peglin developer's [devlog](https://gedig.itch.io/peglin/devlog/383097/the-first-cruciball-levels-are-here-v0720) says the Cruciball unlocks after a completed base run. The first release had 7 levels.

## What this means for a score-to-reach curve and a win structure

1. Landlord rent steps fall from x2.00 to x1.08 to x1.15, so the early rounds should rise steeply and the late ones gently. The study's flat 1.85 a round does the opposite.
2. Landlord rent reaches 31 times its start in 12 payments. At 1.85 a round Overreact reaches about 137 times in nine rounds (my arithmetic).
3. Brotato Baby Alien health goes from 3 to 41, and Danger 5 adds only 40%. Put the big climb inside the run and keep the ladder steps small.
4. Brotato Dangers 0 to 2 change no numbers, only the enemy mix, and Peglin Cruciball 1 is +1 health. Early harder stakes should change a rule, not the score to reach.
5. Brotato win rates fall 72.8, 60.8, 54.5, then 35.0 at Danger 5. Each step costs 6 to 12 points, then about 20. Plan a steady slide with a cliff at the top.
6. Monster Train win rates go from 96.5% on the first boss to 34.1% at Covenant 5 and 20.5% at Covenant 10. Roughly one in three owners wins five levels up, and one in five wins ten.
7. Peglin boss kills fall from 83.8% to 45.5% over nine bosses. Pass rates should fall by round, but the Overreact median ends round nine at 74%, which is gentle.
8. Vampire Survivors holds the enemy minimum at 15 and then 100 by minute 8, and gets to 300 at minute 11. Put a visible spike in the middle of a run, not only a smooth curve.
9. The Reaper has 655,350 health times your level and arrives at a fixed time. Every game here ends with a fixed finish, so winning should be a separate event from the four marks. The marks stay an optional score layer.
10. Risk of Rain adds 1.15 per stage and a fixed amount per minute, so Overreact can use a fixed multiple per round for the climb and keep separate dials, such as redraw cost, for smaller steps.
