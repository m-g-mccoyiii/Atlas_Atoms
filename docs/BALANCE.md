# Overreact: how the game is balanced

Written 2026-11-10. This is the method, not a set of final numbers. It was drafted by an independent reviewer from the measured matrix (`MATRIX.md`) and the roguelike study, and edited. Nothing in it is built except the matrix.

## What must be true

These are targets to measure against. The pass rates are judgment, not data, and should be corrected once people have played.

| Round | Pass rate, median player | Novice | Planner | Median margin over the number |
|---|---|---|---|---|
| 1 | not a target: see below | wins the three rounds within a few tries | not a target | about 2 to 4 times |
| 2 | not a target | the same | not a target | about 2 to 4 |
| 3, assay | not a target | the same | not a target | about 2 to 4 |
| 4 | 92% | 55% | 98% | 2 |
| 5 | 88% | 40% | 95% | 1.8 |
| 6, assay | 70% | 20% | 90% | 1.4 |
| 7 | 78% | 15% | 90% | 1.5 |
| 8 | 70% | 10% | 85% | 1.3 |
| 9, assay | 50% | 5% | 70% | 1.2 |

That is a win in about one run in eight for a median player and about four in ten for a planner. Median rounds beaten: novice 3, median player 6, planner 9.

**Rewritten 2026-11-11 to the owner's targets (`LOOP.md`, "How hard it is" and "Tiers").** The rows for rounds 1 to 3 above said margins of 3, 2.5 and 1.6 and pass rates of 98, 95 and 85; they contradicted what the owner asked and are replaced.

- Tier 1 (rounds 1 to 3, the bare game): a new player wins the three-round run within a few tries (measured as the share of novice runs that win all three: about 1 in 3). Each round is close, not beaten many times over: the median player beats it by about 2 to 4 times. Something is still undecided before the last page in at least 40 rounds in 100 (passing, or the next flag). The median player is expected to pass these rounds; what is in doubt for it is the flag reached.
- Tier 2 (rounds 1 to 6, helpers held): the median player wins the six-round run about 1 time in 4.
- Tier 3 (rounds 1 to 9, a creature too): the median player wins the nine-round run about 1 time in 10 and the planner about 1 in 3.
- So the rows for rounds 4 to 9 above are not targets any more. Rounds 4 to 9 are not to be fitted so that the median player passes each one most of the time: they are fitted to the run-level shares above, with helpers and creatures held, when those tiers are worked.


| Target | Value | Why |
|---|---|---|
| The last page decides the round | in 55% of passes from round 4 on | tension; reviewers found it dead when the number is beaten early |
| Passes by more than 5 times | under 8% | one test run passed by 42 times |
| Top tenth of builds against the bottom tenth | 6 to 10 times | builds must matter; round one now shows 9 |
| Best build against the median build | at most 10 times | the best found so far is 19 |
| A round | about 2.5 minutes | a win near 25 minutes, the study's range |

## The number to beat

Now: a baked table of 161 numbers, one per molecule and kind of round, times a growth per round. It goes stale with every rule change, and it is not tied to play: the same family has numbers of 210,000 and 470.

Proposed:

**number = Par for the round, times the square root of the molecule's size factor, times any stake the player chose.**

- **Par** is measured: the median total of the median simulated player in that round, over runs where failing is ignored. It is then fitted to a curve whose steps shrink, 1.9 falling by 0.07 a round, about 54 times over nine rounds. Each step is a smaller multiple than the last, as in Balatro.
- **The molecule factor** is that molecule's plain-play total over the average of all molecules, held between 0.35 and 3. Only half of the difference is taken (the square root), so a hard molecule stays risky and is worth more.
- **An assay** uses the same Par. Its difficulty is the rule that attacks the build, not a bigger number. Round nine is Par times 1.15.
- **Stake** is only for things the player chose: the pact, the idol.
- **It never reads the build.** If the number rose with the build, picks would be pointless.
- The table is made by a script and stamped with the version of the rules it was made from.

## The measuring rig

The matrix used one greedy player. That is not enough. Four simulated players:

| Player | What it does |
|---|---|
| Novice | takes the biggest number six times in ten and a random reagent otherwise; takes picks at random; ignores the assay's rule |
| Median | keeps the row, looks three reactions ahead on a page, takes picks by their measured worth in a build |
| Greedy | the existing one, kept as a baseline |
| Planner | searches ahead, takes picks for pairs, breaks rows on purpose, wishes, uses the extinguisher |

- 2,000 whole runs per player on the same seeds. A change is judged on the same seeds before and after. At that size a pass rate is good to about 2 points.
- Logged every round: seed, player, molecule, family, kind of round, the build, the number, the total after each page, what each source added, chain length, what was offered and taken.
- Compared against the targets: pass rate by round, rounds beaten, margin, how often the last page decided, top tenth against bottom tenth, the largest share of a run's score from one source, and how much taking each piece lifts the win rate.

Every random draw must come from one seeded source first. Some still use the system's.

## Budgets for content

So that a new piece, seal or familiar can be added without retuning everything. Worth is the matrix's "in a build" column.

| Kind of piece | Shelf | Worth in a build |
|---|---|---|
| Adds | lab | 1.1 to 1.6 |
| Multiplies | alchemy | 1.4 to 2.2 |
| Changes a rule | occult | 0.7 to 3.0, and no more than 3 times apart across the six families |
| Pays credit | any | 0.85 to 1.0 in score, plus its pay |

- No piece above 3.0 alone. No pair above 2.5 times its parts, none below 0.6.
- At most 3 pieces may be dead alone, and each of those needs two partners that make a combo of 1.5 or more.
- Seals 1.5 to 2.5 and within 1.3 times of each other. Familiars 1.3 to 1.8 and within 1.25.
- **To add a piece:** measure it alone, with all 59 others, and in 100 random builds that contain it. It goes in only if every figure is in its band.

## One balance pass

1. Freeze the seeds and measure.
2. Flag outliers: a piece outside 0.9 to 3.0 alone or outside its band in a build; a pair above 2.5 or below 0.6; a family spread above 4; one source giving more than 35% of the score in more than a fifth of runs; a piece that more than doubles or halves the win rate.
3. Change at most 5 things, each by no more than a quarter of how far it is out. Growth per round moves by at most 0.05 at a time.
4. Measure again on the same seeds.
5. Keep a change only if it moved its figure toward the band and nothing else moved by more than 5%.

Order: content first, then the molecule factors, then Par. A piece is never fixed with the number to beat, and the number is never fixed with a piece. Stop when everything is in band, or when two passes move nothing by more than 5%.

## What simulation cannot tell

Whether a pick feels like a decision. Whether the last page is tense. Whether a loss feels fair. Whether an assay reads as a threat. How fast a person really plays.

The cheapest signal: eight to ten people who have not seen the game, three runs each, with the same log written to a file. After each loss, two questions: what killed the run (luck, the build, or the play), and would they start again. The novice player's randomness is then tuned until its curve matches theirs.

## The first pass, in order

1. Seed every random draw.
2. Write a whole-run simulation with a nine-round cap.
3. Add the logging.
4. Write the novice, median and planner players.
5. Run 2,000 runs per player and compare with the targets.
6. Fix the known outliers one at a time: the recycler's loop exploit (a pair worth 24), the black candle (5.55 alone), the twelve dead pieces, the carousel (0.44).
7. Measure Par from runs where failing is ignored.
8. Replace the baked table with the formula.
9. Measure again, record it here, and start the sessions with people.

## Where balance meets the redesign

`ENGINES.md` proposes rewriting 24 pieces and cutting 8 so that pieces combine. That changes most of the matrix. The rig comes first, because without it there is no way to tell whether a rewrite helped. Then the engines go in one at a time, with a pass after each.
