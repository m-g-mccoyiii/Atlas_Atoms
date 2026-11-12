# Overreact: specs

Written 2026-11-11 23:02. This is the document of record for what a round asks for. It replaces `HURDLES.md`, the first tested set that the independent review failed (`HURDLES_REVIEW.md`); that page now says so at the top. The names are those of `docs/NAMES.md`: what a round asks for is the spec, points are yield, what the molecule does by itself is a reflex, a run of them is an overreaction, what comes off is runoff, a reaction fired is a reagent. The code keeps its old file names (`hurdles.py`, `hurdle_gen.py`, `hurdle_study.py`, `hurdle_gen_test.py`, `hurdle_graph.py`, `hurdle_table.json`, `hurdle_numbers.tsv`).

Read with `HARNESS.md` section Y: a spec is an "at least", known at the start of the round. It is a floor. It never caps what the player may build, and it is never an exact molecule. Yield is a separate thing: it pays gold and sets the four words.

## In short

- **Kept: 24 specs**, plus one rider (`held_back`) that only appears beside another spec. By family: makeup 7, size 6, runoff 5, shape 3, chain 3. By plan (the direction of play a spec pulls in): rings 3, big 3, small 3, bonds 3, chains 3, vent 3, kinds 2, keep 2, pure 2. No plan holds more than three.
- **Built and tested: 44 specs** that a player aims at, and 15 more that were only measured or were dropped on the review's order. Of the first set (83 checks in `HURDLES.md`), the repeats, twins, the ones that read an absolute value and the ones with no room are gone.
- **Added: 17 new specs** built for this pass (against the grain, restraint, finish-readings, runoff of one kind). Kept from them: `end_CO`, `end_CC`, `finish_smaller`, `lean_turns`, `pure_water`, `pure_gas`, `kinds_gain`.
- **Dropped: 19 of the tested ones**, each with a reason in the table below.
- **Honest testing.** The molecules were split by a hash of their SMILES into a fitting pool and a held-out pool that the table never saw. A new-player model that is not told what the reflexes will do plays as a person learning would. Rounds 1 to 3 were set from that model (it clears about 75, 65 and 55 percent), rounds 4 to 9 from a middling model.
- **Nine rounds.** On the held-out pool the product of the per-round clear rates is 0.076 for the middling player and 0.352 for the skilled player (the aims were 0.10 and 0.33). In the 90 runs of nine played end to end the middling player won 8 of 90 and the skilled player 33 of 90. A new player wins the three-round run about 0.24 of the time (one try in four).
- **Generator.** 810 rounds on the held-out pool; every pick has a proof it can be reached, 0 fell back to a plain spec (0.0 percent).

## What the review asked, and what was done

| # | The review asked | What was done |
|---|---|---|
| 1 | Drop the twins; at most three specs to a plan | Rank agreement (Spearman, median over rounds 1 to 9) was measured between every pair of the specs that sort GOOD, on the very same plays by the yield-only and the random player. Above 0.85 the one that reads less plain went. On the review's order these went whatever the number: `size_range`, `acted_total`, `ring_sizes`, `diameter`, `by_two_off_total` (measured agreement with the nearest spec: `size_range` with `growth` 0.91; `acted_total` with `clean_turns` 0.89; `by_two_off_total` with `off_total` 0.86; `ring_sizes` with `rings` 0.66; `diameter` with `longest_chain` 0.58). Specs that count the same thing in another dress (`rings`, `five_rings`, `six_rings`, `ring_atoms`, `by_two_rings`; `fused_pairs`, `fused_block`) are one cluster, and one of a cluster is kept. Plans are capped at three: the ring plan is down from eleven specs to three. The largest agreement left among the kept specs is 0.82 (`off_total` and `unsaturation`); next: `off_total`/`unsaturation` 0.82, `double_bonds`/`unsaturation` 0.81, `cut_down`/`lean_turns` 0.72, `off_carbon_dioxide`/`off_total` 0.71. |
| 2 | Read the gain over the start; drop `elements` and `kinds_in_turn`; room of at least 2 | Every structural spec reads a gain or a loss (see "How a spec is read"). No spec reads an absolute value, so none can be cleared on page zero (`test_hurdles.py` checks that every spec reads 0 for a round with no turn). `kinds_at_once` became `kinds_gain`; `left_CO` became `end_CO` (the C=O at the finish minus the C=O at the start). `elements` and `kinds_in_turn` are dropped. Room is tested for every spec in every round it is offered: the 90th percentile of the value the aiming player reaches must be at least N plus 2, or, for a count that tops out (kinds of runoff, turns, reagents), at least twice N. |
| 3 | Real restraint, written as a floor | Built: `unused_reagents` (at least N reagents left unused), `clean_turns` (at least N turns with no wasted reagent), `held_back` (at least N turns firing fewer than three). The first has no room (with six to eight reagents carried it tops out at three to five), the second tops out at 3 so only N=1 has room and the aiming player clears that nearly always; both are out. `held_back` is kept as a rider: see "The held-back rider". |
| 4 | At least eight new specs that pull against the grain | 17 built (list below). Each makes the player give something up: keep a group alive to the finish, finish smaller, a late overreaction after two quiet turns, runoff of one kind and not another, an overreaction that carries on past a named reflex, fewer reagents. Kept: `end_CO`, `end_CC`, `finish_smaller`, `lean_turns`, `pure_water`, `pure_gas`, `kinds_gain`. |
| 5 | Plain words, at most eight, "at least N ..." | Every condition starts "at least N", is at most eight words, and uses none of the banned words (`test_plain_words_and_marks`). Each has a mark name and one line saying what the icon shows (tables below). With N = 1 the page says the singular (`condition(1)`). |
| 6 | Size cap | `growth` cannot ask for more than the start size (so at most twice the dealt size) or more than 56 atoms in all. `cut_down` and `finish_smaller` ask for at most half the start size. The cap is applied to the molecule at the moment of the pick and in the fit. In the generator test, 127 of the 127 growth picks asked for at most the start size and at most 56 atoms in all (the largest N was 1.00 times the start size). |
| 7 | Held-out pool; a new-player model; set N from it; real carried sets | All done: see "How it was tested". |
| 8 | Retest the generator, 2,000 rounds | 810 rounds on the held-out pool: see "The generator". |
| 9 | Write this page | You are reading it. |

The new specs that were built for this pass: `end_CO`, `end_OH`, `end_CC` (more of the group at the finish than at the start), `finish_smaller`, `lean_turns`, `fewer_groups`, `quiet_then_loud`, `through_ring`, `through_dry`, `pure_water`, `pure_gas`, `opening_burst`, `unused_reagents`, `clean_turns`, `held_back`, `kinds_gain` and `ring_oxygen`.

## How a spec is read

A spec is one number. The round is won when the number is at least N at the end of the round. The molecule is read at the end of each turn's chain of reflexes, before the loose rings open again. Four readings:

| Reading | The number |
|---|---|
| gain | the best end-of-turn molecule of the round minus the molecule at the start (never below 0) |
| loss | the start minus the smallest end-of-turn molecule |
| lastgain | the molecule after the last turn minus the start (never below 0) |
| lastloss | the start minus the molecule after the last turn (never below 0) |

The `end_` specs and `finish_smaller` use the last readings: a group made in turn 1 and used up by turn 3 does not count. That is what makes them hard to cheat and fun: the reflexes want to use the group up.

Event specs read a record of the round (below, "For the game builder"). Some count over the whole round and a few read one turn.

## How it was tested

**Pools.** Every molecule goes to the fitting pool or the held-out pool by the parity of an md5 of its canonical SMILES. The table was fitted on the fitting pool only; the generator and the per-spec numbers in this page come from the held-out pool. Half the rounds deal the game's own molecules as the game deals them (`molecules.deal_weights`, restricted to the pool), half deal generated ones within 2 atoms of the round's size. A test in `test_hurdles.py` checks that no molecule is in both pools.

**Reagents carried** are those a real run holds (`hurdles.run_carried`): the six in rounds 1 to 3; one more from round 4; one or two more from round 5; eight from round 6; from round 7 the eight stay and one is swapped now and then for a newly found one. The extras are drawn from the 13 reagents of `library.py` beyond the six. The reflexes held are ring and dry in rounds 1 to 3, the first seven in rounds 4 to 6, all twelve in rounds 7 to 9.

**Engine.** The numbers were measured on the engine and library as they stood at 17:52 and 17:44 on 11 November (kept by the other agent as `engine_paper.py` and `library_paper.py`). `engine.py` and `library.py` changed at about 20:30 (new reagents and a new reflex order). The table is not fitted on the new ones: see "What could not be done" for how to re-run.

**Players.** All six play the same molecule with the same deals.

| Player | What it is |
|---|---|
| yield-only | the engine's greedy player: three reagents for the most yield this turn. It does not know the spec. It is the "clears by accident" player. |
| random | three reagents of the hand at random. |
| new player | A person learning. It sees the spec, N, the molecule and what each reagent does on its own (the card says it), so it can tell which reagents will find something and judge how a line moves the molecule toward the spec. It does not see what the reflexes will do afterwards and it never plays a line out to look: its judgement of a line is the spec's value on the molecule after the reagents alone, scaled over the lines of the turn, plus a liking (0.15) for lines where every reagent finds something, plus noise (sd 0.25); now and then (10 percent of turns) it just fires something. `test_new_player_looks_at_nothing_ahead` checks it plays out only the line it fires. |
| aiming | told the spec and N. Each turn it takes the line that gets closest to N (all the specs of the round, scaled), then yield. It stops caring once N is met. Greedy turn by turn, it does not save a setup for a later turn. |
| middling | each turn, with chance 0.5 plays like the aiming player, else like the new player. |
| skilled | each turn, with chance 0.95 plays like the aiming player, else like the new player (one turn in twenty is misjudged). |

**Choosing N.** For each spec and round the fit pool gives, for every N, the clear rate of each player. Rounds 1 to 3: the new player must clear about 75, 65 and 55 percent (the owner: a new player wins the short run within a few tries). Rounds 4 to 9: the middling player must clear round 4 90, round 5 87, round 6 81, round 7 78, round 8 73, round 9 68 percent, which is where the nine-round arithmetic below lands (the round's rate is the product of the two rates when two specs are offered, rounds 6 to 9). An option is offered in a round when its clear rate for that model is within 10 points of the round's target (one spec, rounds 1 to 5) or between 55 and 97 percent (rounds 6 to 9, where the generator picks two whose product is near the target). Because N is a whole number a spec often has only one or two N that fit; the table keeps all of them (`options`, `usable`) and the generator draws among them.

**What sorts GOOD** (all measured on the fitting pool, for the option nearest the target): room (see above); the aiming player clears it at least 10 points more often than the yield-only player and the yield-only player clears it at most 85 percent of the time (otherwise it TRACKS THE SCORE, aiming adds no decision); the player who aims and clears keeps at least half the yield of the yield-only player, or 30 percent for a spec that makes the player give something up (otherwise it FIGHTS THE SCORE); the seeking player (the aiming player who is not told N) reaches it at least 78 percent of the time in rounds 1 to 3, 82 in rounds 4 and 5, 88 in rounds 6 to 8 and 86 in round 9 (deals are random, so a spec that a good player reaches only 70 percent of the time would sink the nine-round arithmetic). A spec is kept when it is GOOD in at least two rounds, is not a twin, and its plan has room.

**Calibration.** The first fit was followed by five generator runs on the fitting pool (45 to 90 runs of nine) to see how far the real clear rates were from the targets. They were low in round 1 (new player) and in rounds 6 to 9 (two specs together). The fixes: N for round 1 and round 3 is chosen for a rate 5 and 3 points higher (`SHIFT`: {"1": 0.05, "3": 0.03}), and two specs are picked so that the product of their fitted rates times {"6": 0.9, "7": 0.9, "8": 0.9, "9": 0.9} is near the target (the failures are not quite independent). The held-out pool saw none of this.

**How much was played.** Fit: 2700 molecules-with-reagents, about 479,988 rounds played, 1320 s on 15 cores. Held-out per-spec test: 2250 units, about 160,480 rounds, 2988 s. Held-out generator test: 810 rounds in 90 runs of nine, about 14,580 rounds played (six players each, and the trial rounds of the pick), 367 s. Together about 655,048 rounds, not counting the five calibration runs and the rider test (400 units).

## The kept specs

Columns: the condition as the page says it (N is the number); the mark name and what it shows; the family and the plan; the rounds it is offered in; the N the table uses in each round (the one nearest the target; the generator may draw a neighbour); the held-out clear rate of the new player, the yield-only player and the aiming player at that N, averaged over the rounds it is offered (the three players asked for; middling and skilled are in `hurdle_numbers.tsv`); the room above N (90th percentile of the value the aiming player reaches, minus N, median over the rounds).

| Spec | The condition (what the page says) | Mark: what it shows | Family / plan | Rounds | N by round, 1 to 9 | New player / yield-only / aiming, clear on held-out | Room above N |
|---|---|---|---|---|---|---|---|
| `closer` | at least N reflexes after the last reagent | `third`: a lit bolt after the third of three bottles | chain / chains | 6,7,8,9 | . . . . . 2 2 2 2 | 25 / 73 / 94 | +8 |
| `kind_ring` | at least N ring-closing reflexes | `self_ring`: a chain being closed into a ring | chain / chains | 7,8,9 | . . . . . . 1 1 1 | 55 / 73 / 92 | +11 |
| `opener` | at least N reflexes after the first reagent | `first`: a lit bolt after the first of three bottles | chain / chains | 3,4,5,6,7,8 | . . 1 1 1 1 1 2 . | 55 / 77 / 92 | +3 |
| `conjugated` | at least N more atoms in alternating bonds | `conjugated`: a zigzag of single and double lines lit up end to end | makeup / bonds | 2,3,6,7 | . 5 5 . . 1 1 . . | 52 / 56 / 81 | +8 |
| `double_bonds` | at least N more double bonds | `double`: double lines, one for each double bond | makeup / bonds | 1,2,3,4,5,6,7,8,9 | 3 4 4 1 1 1 1 1 1 | 71 / 50 / 91 | +7 |
| `unsaturation` | at least N more rings and double bonds | `unsat`: ring outlines and double lines counted together | makeup / bonds | 1,2,3,4,5,6,7,8,9 | 3 4 4 3 3 2 3 3 3 | 71 / 63 / 87 | +11 |
| `end_CC` | at least N more C=C at the finish | `keep_C=C`: the group drawn in a box that stays lit to the end of the round | makeup / keep | 4,5,6,7,8,9 | . . . 1 1 1 1 2 2 | 78 / 38 / 96 | +7 |
| `end_CO` | at least N more C=O at the finish | `keep_C=O`: the group drawn in a box that stays lit to the end of the round | makeup / keep | 1,2,3 | 1 2 2 . . . . . . | 57 / 37 / 92 | +7 |
| `hetero_atoms` | at least N more non-carbon atoms | `hetero`: the red and blue atoms circled | makeup / kinds | 1,2,3,4,5,6,7,8,9 | 3 4 4 1 2 1 1 1 1 | 78 / 47 / 90 | +7 |
| `kinds_gain` | at least N more kinds of group | `groups`: coloured tiles, one for each kind of group on the molecule | makeup / kinds | 7,8 | . . . . . . 1 1 . | 39 / 61 / 89 | +1 (tops out: twice N) |
| `pure_gas` | at least N more gas than water | `gas_only`: bubbles rising from a jar with no water in it | runoff / pure | 1,2,3 | 2 3 3 . . . . . . | 60 / 20 / 89 | +11 |
| `pure_water` | at least N more water than other runoff | `water_only`: a full water jar beside empty ones | runoff / pure | 4,5,6,7,8,9 | . . . 4 3 3 3 3 2 | 78 / 56 / 92 | +12 |
| `off_carbon_dioxide` | at least N carbon dioxide in the runoff | `jar_carbon_dioxide`: a jar of carbon dioxide | runoff / vent | 1,2,5 | 3 3 . . 1 . . . . | 75 / 60 / 85 | +6 |
| `off_hydrogen` | at least N hydrogen in the runoff | `jar_hydrogen`: a jar of hydrogen | runoff / vent | 1,2,3,4,5,8,9 | 3 5 5 2 2 . . 2 2 | 71 / 48 / 85 | +10 |
| `off_total` | at least N runoff over the round | `off_all`: jars filling with drops and bubbles | runoff / vent | 1,2,3,4,5,6,7,8 | 8 12 12 6 7 8 8 9 . | 73 / 68 / 90 | +20 |
| `fused_pairs` | at least N more rings sharing a side | `ring_pair`: two rings drawn with one side in common | shape / rings | 6,7 | . . . . . 1 1 . . | 36 / 77 / 90 | +18 |
| `ring_systems` | at least N more separate ring groups | `islands`: ring clusters drawn apart from each other | shape / rings | 7,8 | . . . . . . 2 2 . | 45 / 66 / 86 | +2 |
| `six_rings` | at least N more six-atom rings | `ring6`: a ring drawn with six dots | shape / rings | 6,8,9 | . . . . . 1 . 1 1 | 60 / 85 / 96 | +6 |
| `branch` | at least N more forks in the molecule | `fork`: a tree that splits | size / big | 1,2,3,4,5,6,7,8,9 | 4 6 6 3 3 3 3 4 4 | 78 / 57 / 91 | +12 |
| `growth` | at least N atoms bigger than the start | `grow`: the start molecule with a larger one drawn after it | size / big | 1,2,3,4,5,6,7,8,9 | 9 14 17 4 5 4 3 1 2 | 80 / 54 / 92 | +27 |
| `longest_chain` | at least N longer chain than the start | `ladder_chain`: a straight zigzag with a ruler along it | size / big | 1,2,3 | 3 5 5 . . . . . . | 70 / 5 / 88 | +7 |
| `cut_down` | at least N atoms smaller than the start | `cut`: the start molecule with a ghost outline of the atoms that went | size / small | 1,6,7,8,9 | 1 . . . . 1 1 1 1 | 68 / 28 / 80 | +5 |
| `finish_smaller` | at least N atoms smaller at the finish | `cut_end`: the start molecule and a smaller one at the end of an arrow | size / small | 6,7,8 | . . . . . 1 1 1 . | 60 / 11 / 83 | +5 |
| `lean_turns` | at least N turns ending smaller | `lean`: three small boxes, each with a down arrow when the molecule got smaller | size / small | 1,4,5,6,7,8,9 | 1 . . 1 1 1 1 1 1 | 86 / 39 / 93 | +1 (tops out: twice N) |

Room on the held-out pool: the rule (90th percentile of the aiming player's value at least N plus 2, or twice N for a count that tops out) holds in 124 of 125 spec-and-round cells; the cells that fall short: `opener` round 3 (N 1, p90 2).

`growth`: N is cut to the start size for each molecule (the N in the table is the fit's; the cap is per molecule), so the round never asks for more than twice the dealt size or more than 56 atoms.

The full per-round numbers for every kept spec on the held-out pool (all six players) are in `hurdle_numbers.tsv`. The same, as a table:

<details><summary>Held-out clear rates by spec and round (percent)</summary>

| Spec | Round | N | New | Yield | Random | Aim | Middling | Skilled | Room |
|---|---|---|---|---|---|---|---|---|---|
| `branch` | 1 | 4 | 78 | 31 | 9 | 89 | 85 | 87 | +12 |
| `branch` | 2 | 6 | 61 | 15 | 6 | 82 | 70 | 81 | +10 |
| `branch` | 3 | 6 | 57 | 14 | 2 | 80 | 68 | 79 | +9 |
| `branch` | 4 | 3 | 80 | 68 | 29 | 94 | 88 | 93 | +11 |
| `branch` | 5 | 3 | 90 | 76 | 35 | 97 | 94 | 97 | +12 |
| `branch` | 6 | 3 | 88 | 74 | 37 | 96 | 92 | 96 | +11 |
| `branch` | 7 | 3 | 90 | 82 | 60 | 96 | 94 | 96 | +12 |
| `branch` | 8 | 4 | 78 | 76 | 39 | 90 | 87 | 91 | +12 |
| `branch` | 9 | 4 | 76 | 80 | 50 | 92 | 88 | 92 | +12 |
| `closer` | 6 | 2 | 20 | 72 | 18 | 97 | 74 | 94 | +6 |
| `closer` | 7 | 2 | 26 | 73 | 21 | 95 | 74 | 95 | +7 |
| `closer` | 8 | 2 | 27 | 74 | 19 | 94 | 81 | 90 | +8 |
| `closer` | 9 | 2 | 26 | 73 | 21 | 91 | 72 | 91 | +9 |
| `conjugated` | 2 | 5 | 51 | 50 | 12 | 80 | 68 | 79 | +5 |
| `conjugated` | 3 | 5 | 48 | 47 | 4 | 75 | 62 | 71 | +4 |
| `conjugated` | 6 | 1 | 52 | 62 | 36 | 85 | 70 | 82 | +11 |
| `conjugated` | 7 | 1 | 58 | 66 | 41 | 84 | 75 | 84 | +11 |
| `cut_down` | 1 | 1 | 69 | 12 | 19 | 72 | 70 | 75 | +2 |
| `cut_down` | 6 | 1 | 71 | 29 | 34 | 83 | 72 | 80 | +3 |
| `cut_down` | 7 | 1 | 70 | 33 | 35 | 86 | 78 | 84 | +5 |
| `cut_down` | 8 | 1 | 66 | 32 | 42 | 84 | 80 | 82 | +13 |
| `cut_down` | 9 | 1 | 65 | 31 | 35 | 78 | 75 | 78 | +12 |
| `double_bonds` | 1 | 3 | 72 | 34 | 20 | 88 | 79 | 87 | +10 |
| `double_bonds` | 2 | 4 | 64 | 21 | 6 | 82 | 67 | 80 | +10 |
| `double_bonds` | 3 | 4 | 64 | 24 | 4 | 80 | 74 | 80 | +8 |
| `double_bonds` | 4 | 1 | 80 | 63 | 54 | 98 | 90 | 97 | +6 |
| `double_bonds` | 5 | 1 | 82 | 75 | 54 | 99 | 92 | 98 | +6 |
| `double_bonds` | 6 | 1 | 81 | 70 | 52 | 98 | 89 | 98 | +7 |
| `double_bonds` | 7 | 1 | 68 | 57 | 44 | 92 | 86 | 91 | +7 |
| `double_bonds` | 8 | 1 | 64 | 54 | 39 | 90 | 84 | 89 | +7 |
| `double_bonds` | 9 | 1 | 69 | 54 | 38 | 88 | 84 | 89 | +7 |
| `end_CC` | 4 | 1 | 80 | 42 | 35 | 99 | 92 | 98 | +5 |
| `end_CC` | 5 | 1 | 88 | 52 | 38 | 100 | 94 | 99 | +7 |
| `end_CC` | 6 | 1 | 87 | 48 | 36 | 98 | 89 | 98 | +6 |
| `end_CC` | 7 | 1 | 77 | 33 | 32 | 97 | 91 | 97 | +7 |
| `end_CC` | 8 | 2 | 66 | 24 | 22 | 90 | 80 | 89 | +7 |
| `end_CC` | 9 | 2 | 69 | 26 | 20 | 91 | 84 | 90 | +7 |
| `end_CO` | 1 | 1 | 61 | 52 | 26 | 97 | 86 | 96 | +8 |
| `end_CO` | 2 | 2 | 56 | 28 | 10 | 90 | 69 | 87 | +7 |
| `end_CO` | 3 | 2 | 55 | 31 | 10 | 90 | 72 | 89 | +7 |
| `finish_smaller` | 6 | 1 | 62 | 9 | 16 | 82 | 68 | 79 | +4 |
| `finish_smaller` | 7 | 1 | 59 | 11 | 16 | 85 | 74 | 83 | +5 |
| `finish_smaller` | 8 | 1 | 59 | 12 | 20 | 82 | 73 | 80 | +14 |
| `fused_pairs` | 6 | 1 | 31 | 73 | 26 | 87 | 68 | 88 | +16 |
| `fused_pairs` | 7 | 1 | 40 | 80 | 37 | 92 | 74 | 91 | +20 |
| `growth` | 1 | 9 | 76 | 27 | 17 | 91 | 86 | 91 | +31 |
| `growth` | 2 | 14 | 68 | 15 | 10 | 85 | 79 | 88 | +28 |
| `growth` | 3 | 17 | 58 | 12 | 5 | 82 | 72 | 80 | +23 |
| `growth` | 4 | 4 | 80 | 63 | 39 | 94 | 88 | 92 | +27 |
| `growth` | 5 | 5 | 83 | 62 | 44 | 94 | 88 | 93 | +28 |
| `growth` | 6 | 4 | 84 | 64 | 49 | 96 | 92 | 96 | +28 |
| `growth` | 7 | 3 | 90 | 74 | 67 | 94 | 92 | 93 | +25 |
| `growth` | 8 | 1 | 93 | 88 | 76 | 97 | 96 | 96 | +24 |
| `growth` | 9 | 2 | 89 | 84 | 64 | 95 | 94 | 95 | +20 |
| `hetero_atoms` | 1 | 3 | 72 | 30 | 19 | 87 | 82 | 86 | +7 |
| `hetero_atoms` | 2 | 4 | 61 | 17 | 12 | 79 | 75 | 82 | +7 |
| `hetero_atoms` | 3 | 4 | 55 | 14 | 7 | 79 | 73 | 78 | +6 |
| `hetero_atoms` | 4 | 1 | 86 | 58 | 61 | 97 | 94 | 97 | +7 |
| `hetero_atoms` | 5 | 2 | 77 | 35 | 32 | 92 | 84 | 89 | +7 |
| `hetero_atoms` | 6 | 1 | 88 | 57 | 60 | 96 | 94 | 96 | +8 |
| `hetero_atoms` | 7 | 1 | 87 | 70 | 63 | 94 | 93 | 95 | +9 |
| `hetero_atoms` | 8 | 1 | 86 | 70 | 60 | 95 | 93 | 94 | +10 |
| `hetero_atoms` | 9 | 1 | 87 | 70 | 58 | 94 | 88 | 92 | +10 |
| `kind_ring` | 7 | 1 | 53 | 69 | 54 | 92 | 79 | 92 | +9 |
| `kind_ring` | 8 | 1 | 52 | 73 | 51 | 93 | 82 | 92 | +11 |
| `kind_ring` | 9 | 1 | 60 | 76 | 56 | 92 | 76 | 91 | +11 |
| `kinds_gain` | 7 | 1 | 39 | 59 | 32 | 90 | 70 | 88 | +1 |
| `kinds_gain` | 8 | 1 | 38 | 63 | 29 | 88 | 71 | 85 | +1 |
| `lean_turns` | 1 | 1 | 84 | 17 | 37 | 86 | 88 | 88 | +2 |
| `lean_turns` | 4 | 1 | 89 | 42 | 56 | 94 | 90 | 92 | +1 |
| `lean_turns` | 5 | 1 | 86 | 41 | 56 | 95 | 95 | 94 | +1 |
| `lean_turns` | 6 | 1 | 89 | 35 | 57 | 92 | 89 | 92 | +1 |
| `lean_turns` | 7 | 1 | 88 | 48 | 57 | 95 | 92 | 96 | +1 |
| `lean_turns` | 8 | 1 | 83 | 49 | 59 | 96 | 94 | 95 | +1 |
| `lean_turns` | 9 | 1 | 81 | 44 | 52 | 92 | 89 | 93 | +1 |
| `longest_chain` | 1 | 3 | 83 | 9 | 28 | 91 | 89 | 91 | +9 |
| `longest_chain` | 2 | 5 | 70 | 3 | 12 | 88 | 77 | 88 | +7 |
| `longest_chain` | 3 | 5 | 57 | 2 | 9 | 86 | 79 | 84 | +7 |
| `off_carbon_dioxide` | 1 | 3 | 70 | 48 | 7 | 83 | 79 | 83 | +7 |
| `off_carbon_dioxide` | 2 | 3 | 74 | 52 | 8 | 84 | 75 | 82 | +6 |
| `off_carbon_dioxide` | 5 | 1 | 81 | 79 | 27 | 88 | 83 | 88 | +6 |
| `off_hydrogen` | 1 | 3 | 74 | 42 | 23 | 91 | 87 | 90 | +12 |
| `off_hydrogen` | 2 | 5 | 58 | 18 | 5 | 78 | 64 | 77 | +11 |
| `off_hydrogen` | 3 | 5 | 54 | 18 | 4 | 78 | 67 | 77 | +10 |
| `off_hydrogen` | 4 | 2 | 75 | 56 | 21 | 88 | 84 | 88 | +8 |
| `off_hydrogen` | 5 | 2 | 80 | 62 | 28 | 88 | 83 | 88 | +10 |
| `off_hydrogen` | 8 | 2 | 80 | 71 | 34 | 89 | 85 | 90 | +9 |
| `off_hydrogen` | 9 | 2 | 76 | 73 | 33 | 86 | 84 | 88 | +10 |
| `off_total` | 1 | 8 | 79 | 58 | 14 | 95 | 89 | 94 | +25 |
| `off_total` | 2 | 12 | 56 | 39 | 5 | 80 | 64 | 80 | +19 |
| `off_total` | 3 | 12 | 56 | 42 | 2 | 80 | 70 | 80 | +18 |
| `off_total` | 4 | 6 | 81 | 78 | 25 | 95 | 90 | 94 | +18 |
| `off_total` | 5 | 7 | 83 | 87 | 27 | 96 | 90 | 95 | +21 |
| `off_total` | 6 | 8 | 73 | 77 | 21 | 88 | 82 | 87 | +19 |
| `off_total` | 7 | 8 | 82 | 84 | 33 | 94 | 89 | 95 | +24 |
| `off_total` | 8 | 9 | 71 | 80 | 20 | 90 | 88 | 90 | +23 |
| `opener` | 3 | 1 | 48 | 67 | 42 | 86 | 72 | 85 | +1 |
| `opener` | 4 | 1 | 58 | 72 | 46 | 88 | 82 | 88 | +3 |
| `opener` | 5 | 1 | 56 | 81 | 56 | 96 | 83 | 94 | +3 |
| `opener` | 6 | 1 | 60 | 77 | 51 | 97 | 84 | 95 | +3 |
| `opener` | 7 | 1 | 63 | 87 | 59 | 96 | 86 | 98 | +5 |
| `opener` | 8 | 2 | 46 | 77 | 47 | 90 | 78 | 88 | +4 |
| `pure_gas` | 1 | 2 | 71 | 25 | 25 | 93 | 84 | 92 | +13 |
| `pure_gas` | 2 | 3 | 55 | 17 | 11 | 86 | 71 | 87 | +11 |
| `pure_gas` | 3 | 3 | 54 | 18 | 11 | 86 | 68 | 85 | +10 |
| `pure_water` | 4 | 4 | 68 | 34 | 17 | 89 | 83 | 88 | +9 |
| `pure_water` | 5 | 3 | 81 | 60 | 31 | 96 | 90 | 94 | +11 |
| `pure_water` | 6 | 3 | 76 | 58 | 36 | 92 | 87 | 92 | +12 |
| `pure_water` | 7 | 3 | 86 | 58 | 38 | 94 | 92 | 95 | +13 |
| `pure_water` | 8 | 3 | 81 | 60 | 32 | 92 | 86 | 91 | +15 |
| `pure_water` | 9 | 2 | 78 | 65 | 42 | 90 | 86 | 89 | +18 |
| `ring_systems` | 7 | 2 | 43 | 65 | 47 | 88 | 73 | 91 | +2 |
| `ring_systems` | 8 | 2 | 47 | 66 | 44 | 84 | 74 | 83 | +2 |
| `six_rings` | 6 | 1 | 54 | 73 | 51 | 94 | 78 | 92 | +5 |
| `six_rings` | 8 | 1 | 60 | 90 | 59 | 97 | 85 | 95 | +6 |
| `six_rings` | 9 | 1 | 65 | 93 | 65 | 97 | 86 | 96 | +6 |
| `unsaturation` | 1 | 3 | 73 | 41 | 20 | 88 | 80 | 88 | +10 |
| `unsaturation` | 2 | 4 | 65 | 35 | 8 | 81 | 67 | 78 | +7 |
| `unsaturation` | 3 | 4 | 66 | 37 | 5 | 78 | 76 | 79 | +7 |
| `unsaturation` | 4 | 3 | 65 | 63 | 29 | 85 | 79 | 83 | +9 |
| `unsaturation` | 5 | 3 | 76 | 79 | 41 | 94 | 90 | 94 | +11 |
| `unsaturation` | 6 | 2 | 88 | 90 | 51 | 98 | 94 | 98 | +11 |
| `unsaturation` | 7 | 3 | 72 | 76 | 42 | 91 | 81 | 89 | +12 |
| `unsaturation` | 8 | 3 | 70 | 76 | 34 | 89 | 86 | 88 | +12 |
| `unsaturation` | 9 | 3 | 62 | 73 | 36 | 82 | 76 | 84 | +12 |

</details>

### The held-back rider

`held_back` ("at least N turns firing fewer than three") is not offered alone: it is a restraint, and by itself the aiming player clears it by firing one reagent. It is offered in rounds 6 to 9 as the second spec of a pair, beside one spec taken a little easier (rate times 0.95 to 0.98). N is 2 in every round: {"6": 2, "7": 2, "8": 2, "9": 2}. The game must let a turn be fired with one or two reagents in those rounds. Measured on the fitting pool (400 units), percent:

| Round | Yield-only, base spec | Yield-only, with rider | Aiming, base | Aiming, with rider | Middling, base | Middling, with rider |
|---|---|---|---|---|---|---|
| 6 | 62 | 0 | 93 | 90 | 82 | 79 |
| 7 | 63 | 0 | 94 | 93 | 83 | 81 |
| 8 | 64 | 0 | 93 | 94 | 86 | 84 |
| 9 | 63 | 0 | 90 | 89 | 83 | 81 |

The rider costs the aiming and the middling player only two to four points of clear rate, because a spec can often be met early and the rest of the turns held back. The yield-only player never clears it (it always fires three). The real price is the yield the player gives up in the turns held back. It sorts GOOD as a restraint: nobody clears it by accident, and it is a floor.

## The specs that were dropped

| Spec | Why it is out |
|---|---|
| `big_puff` | twin of off_total (rank agreement 0.92) |
| `by_two_rings` | the yield-only player clears it nearly as often as the aiming player, so it asks for no decision (sorted GOOD in rounds 7 only) |
| `clean_turns` | no room above N (the aiming player gets at most N plus 1) (sorted GOOD in rounds 9 only) |
| `distinct_triggers` | the yield-only player clears it nearly as often as the aiming player, so it asks for no decision |
| `end_OH` | clearing it costs most of the yield |
| `fewer_groups` | even the aiming player reaches it too seldom (deals decide) (sorted GOOD in rounds 9 only) |
| `five_rings` | the same count as six_rings (ring count) |
| `fused_block` | the yield-only player clears it nearly as often as the aiming player, so it asks for no decision (sorted GOOD in rounds 6 only) |
| `many_jars` | the yield-only player clears it nearly as often as the aiming player, so it asks for no decision |
| `off_water` | twin of off_total (rank agreement 0.91) |
| `opening_burst` | the yield-only player clears it nearly as often as the aiming player, so it asks for no decision |
| `quiet_then_loud` | even the aiming player reaches it too seldom (deals decide) |
| `ring_atoms` | the yield-only player clears it nearly as often as the aiming player, so it asks for no decision (sorted GOOD in rounds 7 only) |
| `ring_oxygen` | twin of kind_ring (rank agreement 0.90) |
| `rings` | the yield-only player clears it nearly as often as the aiming player, so it asks for no decision |
| `spiro` | even the aiming player reaches it too seldom (deals decide) (sorted GOOD in rounds 7 only) |
| `through_dry` | the yield-only player clears it nearly as often as the aiming player, so it asks for no decision |
| `through_ring` | even the aiming player reaches it too seldom (deals decide) (sorted GOOD in rounds 8 only) |
| `unused_reagents` | no room above N (the aiming player gets at most N plus 1) (sorted GOOD in rounds 4 only) |
| `acted_total` | ordered by the review: twin of `clean_turns`, and it rewards using more reagents (rank agreement with `clean_turns` 0.89) |
| `bridgehead` | good in one round only (first test) |
| `busy` | tracks the score; twin of `kind_dry` (rank agreement with `kind_dry` 0.94) |
| `by_two_off_total` | ordered by the review: twin of `off_total` (rank agreement with `off_total` 0.86) |
| `diameter` | ordered by the review: twin of `longest_chain` by the review reading (rank agreement with `longest_chain` 0.58) |
| `distinct_acted` | the review: it rewards using more reagents (twin of `acted_total`) (rank agreement with `acted_total` 0.80) |
| `elements` | ordered by the review: room of 1 |
| `finish_strong` | tracks the score (first test) (rank agreement with `busy` 0.72) |
| `kind_dry` | twin of `through_dry` and `busy` (rank agreement with `through_dry` 0.94) |
| `kinds_in_turn` | ordered by the review: room of 1 |
| `mirror` | held back: twin atoms are hard to see on the page |
| `ring_sizes` | ordered by the review: N = 1 was cleared by 94 percent (trivial) (rank agreement with `rings` 0.66) |
| `size_range` | ordered by the review: twin of `growth` (rank agreement with `growth` 0.91) |
| `stereo` | held back: handedness is never set by the engine |
| `weight` | twin of `growth` (rank agreement with `growth` 0.97) |
| `kinds_at_once`, `left_CO` | became `kinds_gain` and `end_CO` (read the gain over the start) |

The other specs of `HURDLES.md` that were TOO RARE, TWIN or HELD BACK there (small and big rings, aromatic, mixed rings, bridgehead, handedness, twin atoms, the named reflexes strip, knit, pop, seal and pair, acid fumes, sulfur and trimethylamine runoff, `busy`, `long_chain`, `finish_strong`, `pile_on`, `loop`, `crescendo`, `kind_dry`, `weight`, `places`, `variety`, `repeats`) were not built again: nothing in the engine or the molecules changed that would move them. `elements` and `kinds_in_turn` are dropped on the review's order. They are still in `hurdles.py` (with `live = False`) so their values can be compared.

## The generator

`hurdle_gen.pick_spec(molecule, round_number, carried, rng, tier, history, rules)` returns a `Pick`: one spec and its N, or two from round 6 on. Table mode only; the sim mode of the first version is gone (it needed the engine at run time and could not use the new-player model).

1. Candidates are the kept specs the table offers in this round, that the carried reagents and held reflexes can feed, that are inside the tier (tier 0: chain, runoff, restraint; tier 1: and size, makeup; tier 2: and shape, timing), and that are not of the family used by the previous round. Every usable N of a spec is a candidate.
2. One is drawn with weights: a fitted clear rate near the round's target; a spec not used earlier in the run (a spec used before is a third as likely); a low clear rate for the yield-only player (weight exp(-2 y)).
3. N is cut to the molecule's cap.
4. From round 6, a second spec of another family and another plan (and not a known clash) is drawn so that the product of the two fitted rates times {"6": 0.9, "7": 0.9, "8": 0.9, "9": 0.9} is near the target. One pair in four is a spec taken a little easier plus the held-back rider.
5. Proof: six trial rounds are played by the aiming player on other deals of this molecule. If none reaches every N, a beam search that ignores the deal looks for three lines that do (`reach_search`). With no proof the pick is refused. It is also refused if the yield-only player clears it in all six trial rounds (it asks nothing).
6. Fall back: if no candidate passes in twenty draws, `off_total`, `growth` or `opener` at the table's N is tried; failing that, 1 runoff over the round.

**Results on the held-out pool**, 810 rounds, 90 runs of nine in order (so the family history and the reagents carried are real). Percent. The target is for the model named: the new player in rounds 1 to 3, the middling player after.

| Round | Target (model) | New player | Yield-only | Random | Aiming | Middling | Skilled | Pairs % | Fell back % | Proof % | Kinds | Families |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 75 (new) | 76 | 30 | 24 | 88 | 83 | 90 | 0 | 0 | 100 | 12 | 3 |
| 2 | 65 (new) | 54 | 32 | 4 | 80 | 60 | 81 | 0 | 0 | 100 | 12 | 3 |
| 3 | 55 (new) | 58 | 31 | 8 | 86 | 83 | 89 | 0 | 0 | 100 | 11 | 3 |
| 4 | 90 (middling) | 73 | 40 | 31 | 89 | 84 | 90 | 0 | 0 | 100 | 11 | 4 |
| 5 | 87 (middling) | 72 | 51 | 23 | 92 | 77 | 93 | 0 | 0 | 100 | 12 | 4 |
| 6 | 81 (middling) | 64 | 30 | 11 | 84 | 72 | 86 | 100 | 0 | 100 | 16 | 6 |
| 7 | 78 (middling) | 62 | 28 | 18 | 89 | 76 | 91 | 100 | 0 | 100 | 19 | 6 |
| 8 | 73 (middling) | 49 | 22 | 18 | 96 | 71 | 94 | 100 | 0 | 100 | 19 | 6 |
| 9 | 68 (middling) | 57 | 37 | 31 | 86 | 72 | 88 | 100 | 0 | 100 | 14 | 6 |

- **Yield-only clears by accident** 22 to 51 percent of rounds, by round as in the table (more in rounds 4 and 5, one spec at a time; less in the pair rounds).
- **Variety.** 25 different specs were used. Families chosen: size 340, makeup 295, runoff 272, chain 109, restraint 87, shape 67. Plans: big 213, pure 165, small 127, keep 112, bonds 111, chains 109, vent 107, restraint 87, kinds 72, rings 67. The same family in two rounds running: 14 of 720 (the generator excludes the last round's family; the count is for a pair that shares a family when one of them is a pair). The same spec twice running: 14 of 720.
- **How often each spec was used:** `pure_water` 137, `growth` 127, `end_CC` 96, `held_back` 87, `lean_turns` 68, `hetero_atoms` 64, `off_hydrogen` 61, `opener` 57, `six_rings` 55, `branch` 54, `unsaturation` 51, `double_bonds` 44, `off_total` 40, `cut_down` 35, `kind_ring` 33, `longest_chain` 32, `pure_gas` 28, `finish_smaller` 24, `closer` 19, `end_CO` 16, `conjugated` 16, `ring_systems` 9, `kinds_gain` 8, `off_carbon_dioxide` 6, `fused_pairs` 3.
- **Pairs.** From round 6 every pick is a pair (the table shows the share that really was two specs; the rest fell back).
- **Fall-backs:** 0 of 810 (0.0 percent).
- **Proof of reach.** A round played out reached every N in 810 minus 0 picks; 1 were proved by the search only.
- A pick takes 3.3 s on average (longest 31 s) in Python on one core.

## The nine-round arithmetic

The owner: a new player wins the short three-round run within a few tries; an average player does not win everything as a matter of course; a full nine-round run is won about 1 time in 10 by a middling player and 1 in 3 by a skilled one.

How the models are built: the middling player plays each turn like the aiming player with chance 0.5, else like the new player; the skilled player with chance 0.95. The per-round clear rates that were chosen (the target for each model) are: new player 75, 65 and 55 percent in rounds 1 to 3, middling player round 4 90, round 5 87, round 6 81, round 7 78, round 8 73, round 9 68 percent in rounds 4 to 9 (in rounds 6 to 9 for two specs together). Their product with the middling player's rates in rounds 1 to 3 is the 1 in 10.

Measured on the held-out pool (percent clear by round, and the product):

| Round | Middling | Skilled | New player | Aiming |
|---|---|---|---|---|
| 1 | 0.833 | 0.900 | 0.756 | 0.878 |
| 2 | 0.600 | 0.811 | 0.544 | 0.800 |
| 3 | 0.833 | 0.889 | 0.578 | 0.856 |
| 4 | 0.844 | 0.900 | 0.733 | 0.889 |
| 5 | 0.767 | 0.933 | 0.722 | 0.922 |
| 6 | 0.722 | 0.856 | 0.644 | 0.844 |
| 7 | 0.756 | 0.911 | 0.622 | 0.889 |
| 8 | 0.711 | 0.944 | 0.489 | 0.956 |
| 9 | 0.722 | 0.878 | 0.567 | 0.856 |
| product, rounds 1 to 3 | 0.417 | 0.649 | 0.238 | 0.601 |
| product, rounds 1 to 9 | 0.076 | 0.352 | 0.014 | 0.302 |
| full runs won of 90 | 8 | 33 | 1 | 28 |

- Product over the nine rounds: middling 0.076 (wanted 0.10), skilled 0.352 (wanted 0.33), aiming player 0.302, new player 0.014.
- Full runs actually won in the 90 runs: middling 8 of 90, skilled 33 of 90, aiming 28 of 90, new player 1 of 90. A run of nine rounds is a small sample; the product is the better estimate.
- The three-round run (rounds 1 to 3): the new player wins it 0.24 of the time, so within a few tries.
- The aiming player's own ceiling is about 0.302 for nine rounds, because the deals are random and a good player cannot always reach the number. That is why the skilled player is close to it.
- Not in these numbers: picking one of the two molecules offered before a round, paying to redraw, instruments, homunculi and gold. All of them help the player, so the real rates are at or above these.

## For the game builder

The JavaScript game has no RDKit. Everything is counting or plain graph work. `hurdle_graph.py` is the structural part on a bare graph (a list of elements, a list of bonds with orders 1, 2, 3 in kekule form, the hydrogens on each atom); port it function by function. It agrees with RDKit on all but a few cage molecules (the ring count in a cage is the smallest set of smallest rings; RDKit lists a symmetrised set), and the gain over the start agrees on 95 to 100 percent of turns (`python hurdle_graph.py 150`).

### What the game keeps for the round

- `start`: the molecule at the start of the round (loose rings open), as a graph.
- `carried`: the reagents the player holds this round.
- for each turn: `line` (the one to three reagent names fired, in order), `fired` (for each, the number of places it acted; 0 means it found nothing), `chain` (the names of the reflexes, in the order they fired), `set_off` (for each reagent of the line, how many reflexes ran after it), `off` (runoff kind to amount, from the reagents and from the reflexes), `end` (the molecule after the chain, before the rings open again).

### What each kept spec computes

| Spec | Reading | What the game computes |
|---|---|---|
| `branch` | gain | atoms with 3 or more heavy neighbours, minus start; best turn |
| `closer` | event | largest number of reflexes started by the third reagent of a line, over the turns |
| `conjugated` | gain | atoms in the biggest connected set of conjugated bonds (RDKit), minus start; best turn |
| `cut_down` | loss | heavy atoms at the start minus the fewest at the end of any turn; N is at most half the start size |
| `double_bonds` | gain | C=C plus C=O double bonds (an aromatic ring counts 3), minus start; best turn |
| `end_CC` | lastgain | count of the group on the molecule after the last turn minus the count at the start |
| `end_CO` | lastgain | count of the group on the molecule after the last turn minus the count at the start |
| `finish_smaller` | lastloss | heavy atoms at the start minus heavy atoms after the last turn; N is at most half the start size |
| `fused_pairs` | gain | pairs of rings with 2 or more atoms in common, end of a turn minus start; best turn |
| `growth` | gain | heavy atoms at the end of a turn minus heavy atoms at the start; best turn; N is at most the start size and the total at most 56 |
| `hetero_atoms` | gain | atoms other than carbon, minus start; best turn |
| `kind_ring` | event | count of the ring reflex in the chains |
| `kinds_gain` | gain | number of the 12 group kinds (OH, C=O, C=C, COOH, NH2, SH, Cl, ester, ether, amide, S-S, C=N) present, end of a turn minus start; best turn |
| `lean_turns` | event | turns whose end-of-turn heavy atoms are fewer than at the end of the turn before (the start for turn 1) |
| `longest_chain` | gain | atoms on the longest path through carbons that are not in rings, minus start; best turn |
| `off_carbon_dioxide` | event | amount of carbon dioxide that came off, over the turns |
| `off_hydrogen` | event | amount of hydrogen that came off, over the turns |
| `off_total` | event | sum of everything that came off, over the turns |
| `opener` | event | largest number of reflexes started by the first reagent of a line, over the turns |
| `pure_gas` | event | hydrogen, carbon dioxide, acid fumes and trimethylamine that came off minus water, over the turns |
| `pure_water` | event | water that came off minus everything else that came off, over the turns |
| `ring_systems` | gain | groups of rings that touch at no atom (rings joined if they share any atom), end of a turn minus start; best turn |
| `six_rings` | gain | rings of exactly 6 atoms, end of a turn minus start; best turn |
| `unsaturation` | gain | rings plus double bonds (an aromatic ring counts 1 ring and 3 bonds), minus start; best turn |
| `held_back` | event | turns in which fewer than three reagents were fired |

The molecule numbers (heavy atoms only, hydrogens are not atoms): rings = bonds - atoms + pieces, with the rings themselves from a smallest set of smallest rings (`hurdle_graph.rings`); six-atom rings and rings holding oxygen from that set; fused rings (`fused_pairs`) are pairs of rings with two or more atoms in common; separate ring groups join rings that share any atom; forks are atoms with three or more neighbours; the longest chain is the most atoms on one path through carbons that are in no ring; double bonds are C=C plus C=O (a benzene ring counts 3); non-carbon atoms; alternating bonds is the size of the biggest connected set of conjugated bonds (`hurdle_graph.alternating_run`); the 12 kinds of group and their counts are `hurdle_graph.group_counts` (OH, C=O, C=C, COOH, NH2, SH, Cl, ester, ether, amide, S-S, C=N).

Caps on N, per molecule:

| Spec | Cap on N |
|---|---|
| `cut_down` | N at most half the start size |
| `finish_smaller` | N at most half the start size |
| `growth` | N at most the start size, and start plus N at most 56 atoms |

### What to ship

`hurdle_table.json`. For every kept spec and every round it is offered in: `options` (each N with the clear rate of every player on the fitting pool, in `rates`: Y yield-only, R random, W new, S seeker, M middling, K skilled), `usable` (the N the generator may offer), `ref` (the typical N), `label`. `riders.held_back` gives the held-back N by round. `_meta` holds the targets, `shift`, `pair_corr`, `rider_factor` and the player settings. The generator reads only this.

At run time the game needs: the usable options for the round; the family and plan of each; the caps; the proof (play the molecule with a simple aiming player on a few deals, or search three lines; the Python `reach_search` is a beam search on the lines); and the refusal if the start molecule already clears N (none of the kept specs can, since all read a gain; the check is kept for specs added later).

### The marks

Each spec has a mark name for a small drawn icon, and one line saying what it shows. The mark names are unique.

| Mark name | Spec | What the small drawn icon shows |
|---|---|---|
| `fork` | `branch` | a tree that splits |
| `third` | `closer` | a lit bolt after the third of three bottles |
| `conjugated` | `conjugated` | a zigzag of single and double lines lit up end to end |
| `cut` | `cut_down` | the start molecule with a ghost outline of the atoms that went |
| `double` | `double_bonds` | double lines, one for each double bond |
| `keep_C=C` | `end_CC` | the group drawn in a box that stays lit to the end of the round |
| `keep_C=O` | `end_CO` | the group drawn in a box that stays lit to the end of the round |
| `cut_end` | `finish_smaller` | the start molecule and a smaller one at the end of an arrow |
| `ring_pair` | `fused_pairs` | two rings drawn with one side in common |
| `grow` | `growth` | the start molecule with a larger one drawn after it |
| `hetero` | `hetero_atoms` | the red and blue atoms circled |
| `self_ring` | `kind_ring` | a chain being closed into a ring |
| `groups` | `kinds_gain` | coloured tiles, one for each kind of group on the molecule |
| `lean` | `lean_turns` | three small boxes, each with a down arrow when the molecule got smaller |
| `ladder_chain` | `longest_chain` | a straight zigzag with a ruler along it |
| `jar_carbon_dioxide` | `off_carbon_dioxide` | a jar of carbon dioxide |
| `jar_hydrogen` | `off_hydrogen` | a jar of hydrogen |
| `off_all` | `off_total` | jars filling with drops and bubbles |
| `first` | `opener` | a lit bolt after the first of three bottles |
| `gas_only` | `pure_gas` | bubbles rising from a jar with no water in it |
| `water_only` | `pure_water` | a full water jar beside empty ones |
| `islands` | `ring_systems` | ring clusters drawn apart from each other |
| `ring6` | `six_rings` | a ring drawn with six dots |
| `unsat` | `unsaturation` | ring outlines and double lines counted together |
| `held` | `held_back` | a turn with one empty slot |

### Do not offer

`stereo` and `mirror` (the page cannot show them), `loop` and `crescendo` (hard to read), and the specs in the dropped table.

## What could not be done

- **No independent evaluator.** I have no way to start another agent from this session, so the approach and the result were judged by me only, against the review's seven changes and the checks in `test_hurdles.py` (13 pass). The memory note says to run a fresh evaluator before showing the owner. Please run one.
- **The engine moved while I worked.** The fit and every run here use the first library (the six reagents and the 13 after them, the 12 first reflexes), taken from `engine_paper.py` and `library_paper.py`. `engine.py` and `library.py` now hold other reagents (`hwe`, `permanganate`, `ritter`, `cyanohydrin`, `chugaev`, `hydroformylation`, `epoxidation`) and other reflexes. The code in this folder does not name the old reagents (the extras are read from `library.POOL19`, the reflex bands from names that exist), but the table must be fitted again for the new engine. Commands, in this folder, about 25 minutes of fit and 50 of tests on 15 cores: `python hurdle_study.py fit 300 fit.pkl`; `python hurdle_study.py table fit.pkl table.json`; `python hurdle_study.py rider fit 100 table.json rider.pkl`; `python hurdle_study.py addrider table.json rider.pkl hurdle_table.json`; `python hurdle_gen_test.py run fit 90 cal.pkl 1000` and `python hurdle_gen_test.py report cal.pkl` (change `SHIFT`, `PAIR_CORR` and `MID_TARGET` in `hurdle_study.py` until the rates match, then fit the table again); `python hurdle_study.py told heldout 250 hurdle_table.json told.pkl`; `python hurdle_gen_test.py run heldout 250 gen.pkl 0`.
- **The new-player model is a model.** It plays the way a person who has read the cards but cannot foresee a reflex would. No person was tested. If real new players do better or worse, change `NEW_EPS`, `NEW_SIGMA` and `NEW_ACTED` in `hurdles.py` and fit again; the targets stay.
- **Greedy aiming.** The aiming player does not plan a setup across turns and does not see the next hand (the game does not show it). A person who plans does better on `end_CO`, `end_CC`, `finish_smaller` and `lean_turns`.
- **Restraint is thin.** Only `held_back` works, and only as a rider. `unused_reagents` has no room and `clean_turns` has room only at N = 1, where it is nearly always met. A real restraint spec with room needs the game to let a player stop early across many turns or to carry more reagents.
- **Specs that sorted TOO HARD TO REACH or TRACKS THE SCORE here** may deserve another look after an engine change: `spiro`, `through_ring`, `through_dry`, `quiet_then_loud`, `fewer_groups`, `fused_block`. The aiming player reaches them only 70 to 88 percent of the time, or the yield-only player gets them for free.
- **Owner's examples.** "At least 4 rings" is `rings`; it tracks the score here (the yield-only line already builds the rings), so a ring spec is `six_rings`, `fused_pairs` or `ring_systems`, from round 6. "At least 2 sulfur bridges" cannot be offered: no molecule of the game has sulfur.
- **Mark and wording on the page** were not tested on the page, only checked for length and banned words.
- **Whole numbers.** Counts that run 0 to 3 cannot be tuned finely; the table keeps every N that fits and the generator draws among them.
