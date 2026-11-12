# Overreact: hurdles

2026-11-11. What a round asks for, built and tested on real molecules (`docs/tools_chem`). Read with `HARNESS.md` section Y: a win condition is an "at least", known at the start of the round, about the molecule or about what happened in the round. It never caps what the player may build. Points are a separate thing: they pay coins and letter the four words.

Files (all in `docs/tools_chem`):

| File | What it is |
|---|---|
| `hurdles.py` | the hurdles (`HURDLES`, 83 checks), the round log they read, the players that aim at them (`SeekPlayer`, `AimPlayer`) |
| `hurdle_gen.py` | the generator `pick_hurdle(molecule, round_number, carried, rng, tier)` (also reachable as `hurdles.pick_hurdle`), and a search that proves a hurdle can be reached |
| `hurdle_study.py` | the large test and the sorting (`run`, `table`, `report`) |
| `hurdle_gen_test.py` | the generator test over 2,007 rounds |
| `hurdle_graph.py` | the structural hurdles written on a plain graph, for the JavaScript game to port; checked against RDKit |
| `test_hurdles.py` | 9 tests (`python test_hurdles.py`) |
| `hurdle_table.json` | what the study found, read by the generator |
| `hurdle_numbers.tsv` | every number for every hurdle and round (N for 80, 60 and 40 percent, the three players' clear rates, room, points kept) |

## In short

- **Built:** 83 checks, 61 different kinds (a few kinds come in named variants: one per self-reaction, one per thing that comes off, one per group left standing). All can be checked exactly; none was dropped because it could not be.
- **Tested:** 3600 rounds, 400 for each round number 1 to 9, each played by three players. For every hurdle that applies to the round's carried set, a player aiming at it played the same round: 266,393 rounds played in all, in 993 seconds on 15 cores.
- **Kept:** 36 hurdles are GOOD in at least three rounds (families: shape 8, makeup 7, size 6, off 6, chain 4, restraint 3, timing 2). 6 more are GOOD in one or two rounds and are offered in those rounds only. 6 are twins of another (dropped), 4 are good on the numbers but held back because a player cannot read or steer them. The other hurdles (rejected), by label: TOO RARE 19, TRACKS THE SCORE 6, FIGHTS THE SCORE 3, DULL 3.
- **Generator:** over 2007 rounds in 223 runs of nine, in two modes; clear rates and spread are below.

## How a hurdle is read

A hurdle is a number. The round is won when the number is at least N. Structural ones read the molecule at the end of each turn's chain, before the loose rings open again, and one of five readings is used:

| Reading | Value |
|---|---|
| gain | the best end-of-turn molecule of the round minus the molecule at the start (never below 0) |
| loss | the start minus the smallest end-of-turn molecule |
| abs | the best end-of-turn molecule of the round |
| last | the molecule at the end of the last turn |
| range | the largest minus the smallest (start and every end of turn) |

Gain is the default so that a molecule that already has a cage or four rings does not clear a hurdle on page zero. The start molecule is the dealt molecule after the loose rings are opened. Event hurdles read a record of the round (below, "For the game builder").

## How it was tested

- **Rounds.** 400 per round number: 200 of the game's molecules as the game deals them (`molecules.deal_molecule`, tier 3) and 200 generated ones with a size within 2 atoms of the round's size (`molecules.generate`, any family). 3,600 rounds in all.
- **Carried and self-reactions.** Rounds 1 to 3: the starting six reactions with ring and dry (SELF_TIER1), no gating. Rounds 4 to 6: the six and two others drawn at random from 13 (jones, amination, thiolene, chlorination, wittig, ozonolysis, williamson, decarboxylation, hofmann, raney, hydrogenation, dihydroxylation, suzuki), with the first seven self-reactions. Rounds 7 to 9: three of the six and five of the 13 (eight carried), with all twelve self-reactions. So a hurdle that needs a feeder (sulfur needs raney, acid fumes need chlorination or williamson, and so on) is tested only in the rounds that carried one (`Hurdle.needs`).
- **Players.** *random*: three reactions of the hand at random. *points*: the engine's greedy player, most points this turn. *seek*: for each candidate line, the hurdle's value after the line (with the turns already played), then points; ties at random. It is greedy turn by turn, so it does not save a setup for a later turn: a hurdle that needs saving is a little harder for it than for a person who plans.
- **N for 80, 60 and 40 percent.** The largest whole number N such that the seek player's value was at least N in that share of its rounds. The points player's and the random player's clear rates are then counted at that same N.
- **Room above** is the 95th percentile of the seek player's values minus N for 60 percent.
- **Points kept** is the points of the seek player's rounds that cleared N, as a share of the points player's mean in the same rounds.
- **Labels**, for one hurdle in one round: TOO RARE (even N=1 is not cleared 40 percent of the time by the seek player); DULL (N for 80 and for 40 percent are the same number); TOO EASY (the points player clears N for 60 percent in 85 percent of rounds or more); TRACKS THE SCORE (the points player clears it within 10 points of the seek player: aiming adds no decision; not in the owner's five, added because it is a large group); FIGHTS THE SCORE (the seek player who clears it keeps under half the points, or the points player never clears it and the seek player keeps under 80 percent); GOOD (none of those, and room above is at least 1 and at least a fifth of N). A hurdle is GOOD when it is GOOD in at least three rounds. Counts of the 675 hurdle-and-round cells: GOOD 274, TOO RARE 182, TRACKS THE SCORE 104, DULL 52, FIGHTS THE SCORE 37, NO ROOM 15, TOO EASY 11.

## Kept hurdles (GOOD in at least three rounds)

Columns: rounds where it is GOOD; N for 60 percent in rounds 1 to 9 (a dot: not carried); N for 80, 60 and 40 percent in rounds 2, 5 and 8; the clear rate at N for 60 percent (seek / points / random, median over the good rounds, percent); the room above N (median over the good rounds). The full numbers are in `hurdle_numbers.tsv`.

| Hurdle | Family | Condition | Good in rounds | N60, rounds 1-9 | N80/60/40 in rounds 2 ; 5 ; 8 | Clear rate at N60: seek / points / random | Room above |
|---|---|---|---|---|---|---|---|
| five_rings | shape | at least N more rings of five atoms | 1-6 | 1 2 2 2 2 3 1 2 1 | 1/2/2 ; 1/2/3 ; 1/2/3 | 66 / 49 / 19 | 3 |
| six_rings | shape | at least N more rings of six atoms | 4-8 | 1 1 1 1 2 2 1 1 1 | 1/1/1 ; 1/2/3 ; 0/1/2 | 79 / 62 / 39 | 4 |
| fused_pairs | shape | at least N more pairs of rings that share a side | 4-6 | 0 0 0 1 2 3 0 0 0 | 0/0/0 ; 1/2/4 ; 0/0/1 | 62 / 42 / 13 | 25 |
| fused_block | shape | a joined block of rings N bigger than the biggest at the start | 4-6 | 1 1 1 2 2 3 1 1 1 | 0/1/1 ; 1/2/4 ; 0/1/2 | 61 / 44 / 14 | 8 |
| ring_systems | shape | at least N more separate groups of rings | 3,6-9 | 1 1 1 1 1 2 2 2 2 | 1/1/1 ; 1/1/2 ; 1/2/2 | 63 / 51 / 34 | 2 |
| spiro | shape | at least N more atoms where two rings meet at a single point | 1,3-6 | 1 0 1 1 1 1 0 0 0 | 0/0/1 ; 1/1/2 ; 0/0/2 | 72 / 56 / 25 | 3 |
| ring_hetero | shape | at least N more rings with an oxygen, nitrogen or sulfur in them | 4-9 | 2 2 2 1 2 2 1 2 1 | 1/2/2 ; 1/2/2 ; 1/2/2 | 74 / 53 / 35 | 2 |
| ring_atoms | shape | at least N more atoms inside rings | 1-6 | 9 9 9 11 14 16 12 14 15 | 6/9/10 ; 11/14/17 ; 6/14/19 | 64 / 49 / 16 | 10 |
| longest_chain | size | a chain of carbons N longer than the longest at the start | 1-4 | 7 7 7 1 0 0 0 0 0 | 5/7/9 ; 0/0/2 ; 0/0/0 | 63 / 1 / 4 | 6 |
| diameter | size | the molecule N bonds longer end to end | 1-6 | 7 7 7 2 2 2 0 0 0 | 5/7/9 ; 0/2/3 ; 0/0/1 | 65 / 5 / 11 | 6 |
| branch | size | at least N more branch points | 1-9 | 7 7 7 5 6 7 3 4 4 | 5/7/10 ; 4/6/8 ; 1/4/6 | 66 / 32 / 8 | 10 |
| growth | size | at least N atoms bigger than the start | 1-9 | 19 20 22 10 12 14 3 4 5 | 12/20/25 ; 8/12/18 ; 1/4/9 | 62 / 14 / 6 | 21 |
| cut_down | size | at least N atoms smaller than the start | 4-9 | 1 1 1 1 2 2 2 2 2 | 0/1/2 ; 1/2/2 ; 0/2/3 | 64 / 28 / 28 | 11 |
| size_range | size | swing the size by at least N atoms between the smallest and the biggest | 1-9 | 19 19 21 10 12 14 6 7 8 | 12/19/25 ; 8/12/18 ; 4/7/14 | 63 / 15 / 7 | 20 |
| kinds_at_once | makeup | at least N different kinds of group on the molecule at once | 1-9 | 3 3 3 3 4 4 4 3 3 | 3/3/4 ; 3/4/4 ; 3/3/4 | 84 / 61 / 25 | 1 |
| left_CO | makeup | at least N C=O groups still standing at the end | 1-9 | 4 4 5 2 3 3 3 3 3 | 3/4/6 ; 2/3/4 ; 1/3/4 | 71 / 29 / 14 | 6 |
| conjugated | makeup | a run of alternating bonds N atoms longer than at the start | 1-9 | 6 6 6 6 6 6 4 4 3 | 4/6/7 ; 4/6/8 ; 0/4/5 | 63 / 33 / 9 | 8 |
| double_bonds | makeup | at least N more double bonds (C=C and C=O) | 1-9 | 5 5 6 3 3 3 1 1 1 | 3/5/6 ; 2/3/4 ; 0/1/3 | 66 / 37 / 18 | 9 |
| unsaturation | makeup | at least N more rings and double bonds together | 1-9 | 5 5 5 4 5 6 2 2 2 | 3/5/6 ; 3/5/7 ; 1/2/5 | 65 / 47 / 12 | 9 |
| hetero_atoms | makeup | at least N more atoms that are not carbon | 1-9 | 4 4 5 3 3 4 2 2 2 | 3/4/6 ; 2/3/4 ; 0/2/5 | 67 / 18 / 14 | 8 |
| elements | makeup | at least N more different elements besides carbon | 5-8 | . . . 1 1 1 1 1 1 | . ; 0/1/1 ; 0/1/1 | 75 / 22 / 35 | 1 |
| opener | chain | the first reaction of a turn sets off at least N steps | 1-9 | 1 1 2 2 2 3 3 2 3 | 1/1/2 ; 2/2/3 ; 1/2/4 | 72 / 54 / 28 | 3 |
| closer | chain | the third reaction of a turn sets off at least N steps | 3-9 | 2 2 2 3 4 4 3 3 3 | 2/2/2 ; 3/4/4 ; 1/3/5 | 68 / 30 / 8 | 5 |
| no_dead_reaction | restraint | at least N turns where all three reactions found something to act on | 7-9 | 3 3 3 3 3 3 1 1 1 | 3/3/3 ; 2/3/3 ; 1/1/2 | 82 / 55 / 10 | 2 |
| distinct_triggers | chain | at least N different reactions that set something off | 1-6 | 3 3 3 3 3 3 2 2 2 | 3/3/4 ; 2/3/4 ; 1/2/3 | 81 / 68 / 8 | 2 |
| kind_ring | chain | at least N steps of ring over the round | 1-9 | 4 4 5 2 3 3 2 2 1 | 2/4/6 ; 2/3/4 ; 0/2/3 | 64 / 34 / 13 | 6 |
| off_total | off | at least N things driven off over the round | 1-9 | 15 15 16 11 13 15 7 8 8 | 10/15/19 ; 9/13/16 ; 5/8/12 | 62 / 40 / 2 | 18 |
| off_water | off | at least N water driven off | 4-9 | 8 8 9 7 9 10 4 5 4 | 5/8/11 ; 7/9/11 ; 1/5/8 | 67 / 47 / 13 | 12 |
| off_hydrogen | off | at least N hydrogen driven off | 1-8 | 6 6 6 3 4 4 2 3 3 | 4/6/8 ; 2/4/6 ; 1/3/5 | 64 / 27 / 12 | 9 |
| off_carbon_dioxide | off | at least N carbon dioxide driven off | 1-5 | 4 4 4 2 2 2 0 0 0 | 3/4/5 ; 1/2/3 ; 0/0/0 | 69 / 37 / 4 | 6 |
| many_jars | off | at least N different things driven off | 4-9 | 3 3 3 3 3 3 2 2 2 | 3/3/3 ; 2/3/3 ; 1/2/3 | 76 / 63 / 28 | 2 |
| big_puff | off | at least N things driven off in one turn | 1-9 | 6 6 7 6 7 8 5 6 6 | 5/6/8 ; 5/7/8 ; 4/6/8 | 66 / 49 / 11 | 8 |
| acted_total | restraint | at least N of the reactions fired found something to act on | 7-9 | 9 9 9 9 9 9 5 5 4 | 9/9/9 ; 7/9/9 ; 3/5/7 | 64 / 47 / 12 | 4 |
| distinct_acted | restraint | at least N different reactions that found something to act on | 4,7-9 | 6 6 6 5 6 6 4 4 3 | 5/6/6 ; 5/6/6 ; 3/4/5 | 73 / 43 / 16 | 3 |
| by_two_rings | timing | at least N more rings than the molecule starts with, by the end of the second turn | 2-3,5-6 | 2 2 2 2 3 3 2 2 3 | 1/2/2 ; 2/3/4 ; 1/2/4 | 67 / 52 / 21 | 4 |
| by_two_off_total | timing | at least N things driven off over the round, by the end of the second turn | 1-9 | 9 9 10 8 9 10 6 7 7 | 6/9/11 ; 6/9/12 ; 4/7/10 | 62 / 45 / 5 | 13 |

## GOOD in one or two rounds only

| Hurdle | Family | Condition | Good in rounds | N60, rounds 1-9 | N80/60/40 in rounds 2 ; 5 ; 8 | Clear rate at N60: seek / points / random | Room above |
|---|---|---|---|---|---|---|---|
| rings | shape | at least N more rings than the molecule starts with | 5-6 | 2 2 2 2 3 4 3 3 3 | 1/2/2 ; 2/3/5 ; 1/3/4 | 74 / 62 / 19 | 8 |
| bridgehead | shape | at least N more bridgehead atoms (a cage) | 6 | 0 0 0 0 0 2 0 0 0 | 0/0/0 ; 0/0/2 ; 0/0/0 | 61 / 39 / 9 | 8 |
| ring_sizes | shape | at least N more different ring sizes | 4 | 1 1 1 1 1 1 1 1 1 | 1/1/1 ; 1/1/2 ; 1/1/2 | 94 / 82 / 54 | 1 |
| kinds_in_turn | chain | at least N different self-reactions in one turn | 5 | 2 2 2 3 3 3 3 2 2 | 1/2/2 ; 2/3/3 ; 1/2/3 | 78 / 67 / 18 | 1 |
| all_three_feed | chain | at least N turns where each of the three reactions sets something off | 5-6 | 0 0 0 0 1 1 0 0 0 | 0/0/0 ; 0/1/1 ; 0/0/0 | 67 / 53 / 2 | 2 |
| kind_snap | chain | at least N steps of snap over the round | 5-6 | . . . 0 1 1 0 0 0 | . ; 0/1/2 ; 0/0/0 | 73 / 41 / 17 | 2 |

## Dropped and rejected

| Hurdle | Label | Why |
|---|---|---|
| small_rings | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 0 of 9 rounds; best round: 7% (round 6); highest value seen 2 |
| big_rings | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 0 of 9 rounds; best round: 6% (round 9); highest value seen 3 |
| aromatic | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 0 of 9 rounds; best round: 6% (round 8); highest value seen 5 |
| ring_mixed | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 0 of 6 rounds; best round: 0% (round 9); highest value seen 0 |
| weight | TWIN | twin of growth (the two read the same on the points player's rounds, correlation 0.9 or more) |
| left_OH | FIGHTS THE SCORE | clearing it costs points: the aiming player who clears it keeps 16% of the points of the points player (median over rounds) |
| left_CC | FIGHTS THE SCORE | clearing it costs points: the aiming player who clears it keeps 39% of the points of the points player (median over rounds) |
| mirror | HELD BACK | measured GOOD but held back: twin atoms are hard to see on the page |
| stereo | HELD BACK | measured GOOD but held back: handedness is never set by the engine: the count is a fact of the graph the player cannot steer or read |
| burn_down | FIGHTS THE SCORE | clearing it costs points: the aiming player who clears it keeps 43% of the points of the points player (median over rounds) |
| passing_through | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 6 of 9 rounds; best round: 50% (round 6); highest value seen 2 |
| busy | TRACKS THE SCORE | the points player clears the same N 64% of the time (median); aiming adds only 0 points of clear rate (needs 10): it is the score |
| long_chain | TRACKS THE SCORE | the points player clears the same N 66% of the time (median); aiming adds only 0 points of clear rate (needs 10): it is the score |
| every_turn | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 6 of 9 rounds; best round: 86% (round 3); highest value seen 13 |
| finish_strong | TRACKS THE SCORE | the points player clears the same N 69% of the time (median); aiming adds only 0 points of clear rate (needs 10): it is the score |
| kinds_in_round | TWIN | twin of kinds_in_turn (the two read the same on the points player's rounds, correlation 0.9 or more) |
| loop | HELD BACK | measured GOOD but held back: a kind coming round again is hard to read on screen |
| pile_on | TRACKS THE SCORE | the points player clears the same N 72% of the time (median); aiming adds only 1 points of clear rate (needs 10): it is the score |
| crescendo | HELD BACK | measured GOOD but held back: it asks for the turns in a rising order, which the player only learns at turn three |
| kind_dry | TWIN | twin of off_water (the two read the same on the points player's rounds, correlation 0.9 or more) |
| kind_flip | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 0 of 6 rounds; best round: 18% (round 7); highest value seen 7 |
| kind_shift | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 2 of 6 rounds; best round: 58% (round 6); highest value seen 7 |
| kind_tuck | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 1 of 6 rounds; best round: 44% (round 5); highest value seen 3 |
| kind_weld | TWIN | twin of loop (the two read the same on the points player's rounds, correlation 0.9 or more) |
| kind_strip | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 0 of 3 rounds; best round: 11% (round 7); highest value seen 4 |
| kind_knit | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 0 of 3 rounds; best round: 29% (round 8); highest value seen 3 |
| kind_pop | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 0 of 3 rounds; best round: 8% (round 8); highest value seen 4 |
| kind_seal | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 0 of 3 rounds; best round: 17% (round 9); highest value seen 3 |
| kind_pair | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 3 of 3 rounds; best round: 54% (round 8); highest value seen 4 |
| rare_close | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 1 of 3 rounds; best round: 42% (round 8); highest value seen 4 |
| order_ring_dry | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 5 of 9 rounds; best round: 58% (round 1); highest value seen 3 |
| order_dry_tuck | TWIN | twin of kind_tuck (the two read the same on the points player's rounds, correlation 0.9 or more) |
| order_weld_dry | TRACKS THE SCORE | the points player clears the same N 78% of the time (median); aiming adds only 1 points of clear rate (needs 10): it is the score |
| off_acid_fumes | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 5 of 6 rounds; best round: 53% (round 8); highest value seen 18 |
| off_sulfur | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 0 of 6 rounds; best round: 20% (round 9); highest value seen 9 |
| off_trimethylamine | TOO RARE | the player who aims at it reaches even 1 in 40% of rounds in only 0 of 6 rounds; best round: 30% (round 9); highest value seen 8 |
| variety | DULL | the value barely varies: the N for 80% and for 40% is the same in 9 of 9 rounds (typical value 7) |
| repeats | DULL | the value barely varies: the N for 80% and for 40% is the same in 9 of 9 rounds (typical value 6) |
| places | TWIN | twin of off_total (the two read the same on the points player's rounds, correlation 0.9 or more) |
| same_line | DULL | the value barely varies: the N for 80% and for 40% is the same in 6 of 9 rounds (typical value 1) |
| by_two_busy | TRACKS THE SCORE | the points player clears the same N 65% of the time (median); aiming adds only 0 points of clear rate (needs 10): it is the score |

What the sorting says, in plain words.

- **The hurdles that are the score.** More steps, a longer chain in one turn, the last turn strong, one self-reaction fired many times: a player who only plays for points clears them as often as one who aims (they are what the points count). They cost nothing and teach nothing new, so they are not offered. They would do as a first-run hurdle, where the owner wants a round to be winnable without a decision.
- **Ring counts track the score in rounds 1 to 3.** With ring and dry only, the greedy points line already makes the rings. Ring counts, rings with oxygen and the like become real hurdles from round 4, when more self-reactions are held.
- **Left standing.** Keeping C=O groups is good. Keeping OH or C=C fights the score: the self-reactions eat them and the points come from letting them.
- **Nothing reaches them yet.** Rings of three or four, rings of seven or more, a benzene ring made in play, a ring with two different odd atoms: no reaction or self-reaction here makes one (the highest value seen is under 6 percent of rounds). They need new chemistry first (a closure across 5 to 8 carbons for the big ring, an aromatise step). Acid fumes, sulfur and trimethylamine hurdles, and the self-reactions strip, knit, pop, seal and pair, are reachable only when the right feeder is carried and the molecule holds the right group; the game's own molecules hold only carbon and oxygen, so they fire in few rounds.
- **Dull.** How many different reactions are used and how many repeat are fixed by the shape of the round (nine slots), and the same line three times never happens.

## The generator

`pick_hurdle(molecule, round_number, carried, rng, tier=3, history=(), rules=None, mode='sim')` returns a `Pick`: a hurdle and its N (two hurdles from round 6), the clear rate the calibration saw, the lines of a round that reached it (the proof), and whether it had to fall back.

How it chooses:
1. Candidates are the hurdles the study found GOOD for this round, that the carried reactions and held self-reactions can feed, that are inside the tier (tier 0: chain, off, restraint; tier 1: and size, makeup; tier 2: and shape, timing), and that are not of the family used by the previous round (families used in the last four rounds are drawn less often).
2. **Sim mode.** The seek player plays the dealt molecule 14 times with different deals. N is the largest number cleared in at least the round's target share of those (targets 85, 80, 65 / 75, 70, 55 / 65, 60, 45 percent for rounds 1 to 9). **Table mode.** N comes from `hurdle_table.json` for the round (no play needed), and four rounds are played to see that it can be reached.
3. A hurdle is refused if N is 0, if no played round reached N, or if the points player cleared it in all 6 trial rounds (it asks nothing).
4. From round 6 two hurdles of different families (and not a known clash: growth and cut down, rings and five-rings, and so on) are picked, each at about the square root of the target, and the pair is played out by the aiming player; N is moved by 1 until the joint clear rate is within 15 points of the target.
5. Proof of reach: a round played out that reached every N, else a beam search that ignores the deal (`reach_search`). Finding lines proves it; the generator never offers a hurdle with no such lines unless it has fallen back (below).
6. Fall back: if no candidate passes in ten tries, the plain hurdles (steps over the round, things driven off, atoms grown) are tried at the target; if even they fail, steps over the round at 1.

Measured over 2007 rounds (223 runs of nine rounds in order, so the family history is real; the molecule is the game's or generated, alternating; carried sets as above). The player tested is `AimPlayer`: it plays toward the numbers, then for points. The calibration used different deals from the test round. Percent.

**Sim mode**

| round | target | aiming player clears | points player clears | random player clears | pairs | fell back | proof found | mean hurdles tried |
|---|---|---|---|---|---|---|---|---|
| 1 | 85 | 86 | 27 | 9 | 0 | 0 | 100 | 1.3 |
| 2 | 80 | 88 | 28 | 13 | 0 | 1 | 100 | 1.3 |
| 3 | 65 | 83 | 30 | 11 | 0 | 0 | 100 | 1.2 |
| 4 | 75 | 86 | 58 | 19 | 0 | 0 | 100 | 1.5 |
| 5 | 70 | 79 | 39 | 18 | 0 | 0 | 100 | 1.3 |
| 6 | 55 | 56 | 25 | 2 | 100 | 0 | 99 | 2.7 |
| 7 | 65 | 65 | 28 | 12 | 91 | 9 | 97 | 4.8 |
| 8 | 60 | 59 | 25 | 10 | 93 | 7 | 95 | 4.5 |
| 9 | 45 | 48 | 18 | 5 | 92 | 8 | 95 | 5.2 |

**Table mode**

| round | target | aiming player clears | points player clears | random player clears | pairs | fell back | proof found | mean hurdles tried |
|---|---|---|---|---|---|---|---|---|
| 1 | 85 | 87 | 38 | 17 | 0 | 1 | 100 | 1.8 |
| 2 | 80 | 86 | 37 | 15 | 0 | 2 | 98 | 1.7 |
| 3 | 65 | 79 | 40 | 13 | 0 | 0 | 100 | 1.6 |
| 4 | 75 | 83 | 57 | 23 | 0 | 0 | 100 | 1.4 |
| 5 | 70 | 83 | 53 | 23 | 0 | 0 | 100 | 1.5 |
| 6 | 55 | 56 | 23 | 3 | 100 | 0 | 99 | 3.2 |
| 7 | 65 | 68 | 43 | 13 | 75 | 25 | 96 | 8.5 |
| 8 | 60 | 65 | 38 | 16 | 84 | 16 | 96 | 7.0 |
| 9 | 45 | 53 | 21 | 6 | 91 | 9 | 90 | 4.8 |

- Fell back: sim mode 57 of 2007 (3 percent); table mode 119 (6 percent). By round in sim mode: round 2: 2, round 6: 1, round 7: 21, round 8: 15, round 9: 18.
- Families chosen, sim mode: makeup 559, size 520, off 483, chain 430, shape 352, restraint 259, timing 241. Table mode: size 513, makeup 509, off 469, chain 464, shape 334, timing 254, restraint 247.
- Hurdle kinds used: 43 in sim mode, 40 in table mode. Most used in sim mode: by_two_off_total 193, off_total 154, growth 126, branch 122, size_range 117, big_puff 110, left_CO 110, kind_ring 108, closer 103, acted_total 102, kinds_at_once 100, distinct_acted 100.
- The same family in two rounds running (counting any family of a pair): sim mode 16 of 1784 pairs of rounds, table mode 42.
- The clear rate the calibration saw (sim mode, mean by round): 1: 92, 2: 92, 3: 84, 4: 87, 5: 80, 6: 53, 7: 67, 8: 63, 9: 49.
- Points of the aiming player and the points player, mean by round (sim mode): 1: 1108 vs 770; 2: 979 vs 754; 3: 1041 vs 892; 4: 1178 vs 1306; 5: 1522 vs 1709; 6: 1676 vs 1965; 7: 1228 vs 1592; 8: 1366 vs 1663; 9: 2009 vs 2255.
- A pick takes 3.6 s in sim mode and 2.8 s in table mode in Python on one core (mean).

What the numbers say.

- Sim mode lands close in rounds 1, 6, 7, 8 and 9 (within 3 points of the target) and above it in rounds 2 to 5 (by 8, 18, 11 and 9 points). Two reasons: N is a whole number, so the share of players that clear it jumps (for a hurdle whose values run 0, 1, 2, 3 the choices are 90, 60, 25 percent and so on); and the player in the test stops chasing the number once it is cleared and plays for points, which the calibration player does not. The pair rounds (6 to 9) are tuned on the joint rate, so they sit closer.
- Table mode is a little further off (87, 86, 79, 83, 83, 56, 68, 65, 53 against 85, 80, 65, 75, 70, 55, 65, 60, 45) because one table serves every molecule of a round. It needs no play to find N and is the one to ship first; sim mode needs the engine at run time.
- The points player clears the offered hurdle by accident 18 to 58 percent of the time (mean about 30) and the random player 2 to 23 percent. A hurdle is therefore a thing a player has to work toward but not a thing the points fight.
- Falling back is rare in rounds 1 to 6 (0 to 2 percent) and 7 to 9 percent in rounds 7 to 9 in sim mode (9 to 25 percent in table mode), where two different-family hurdles that the carried set can feed and that fit the molecule are hard to find (a plain hurdle from the 'steps, things driven off, growth' group is offered then).
- The hurdle used most is `by_two_off_total` (about 10 percent of picks), then `off_total`, `growth` and `branch`; the generator thins out families used lately but not single hurdles. A weight by hurdle would even it out.
- Clearing costs points in the later rounds: the aiming player earns 77 to 90 percent of the points player's mean in rounds 4 to 9 (and more than it in rounds 1 to 3, where the hurdles line up with long chains).
- Reach is proved in 90 to 100 percent of rounds by playing the round out; the remaining picks are the fall-backs and pairs whose joint rate was estimated from a handful of plays and whose proof round was not among the first six deals. They are offered and may not be reachable in a given deal. Do not offer a pair without a proof in the game: re-check by the search (`reach_search`) and fall back if it finds nothing.


## For the game builder

The JavaScript game does not have RDKit. Everything below is plain graph work or counting. `hurdle_graph.py` is the structural part written on a bare graph (a list of elements and a list of bonds with orders 1, 2, 3 in kekule form); port it function by function. It agrees with RDKit on the molecules the engine makes as shown in "How close the graph version is".

### What the game must keep

A record of the round:
- `start`: the molecule at the start of the round (loose rings open).
- for each turn: `line` (the three reaction names in order), `places` (for each reaction, the number of places it acted; 0 means it found nothing and was wasted), `chain` (the names of the self-reactions in the order they fired), `set_off` (for each reaction of the line, the steps the self-reactions took after it), `off` (jar name to amount: from the reactions and from the self-reactions), `end` (the molecule after the chain, before the rings open again).

That is all the hurdles need. The engine already has every one of these.

### Event hurdles (counts over the record)

| Hurdle | Compute |
|---|---|
| busy | total length of the three chains |
| long_chain | length of the longest chain |
| every_turn | length of the shortest chain |
| finish_strong | length of the chain of turn 3 |
| opener / closer | largest `set_off` of the first / third reaction of a line over the turns |
| kinds_in_turn | most distinct names in one chain |
| all_three_feed | turns in which all three `set_off` are 1 or more |
| no_dead_reaction | turns in which all three reactions acted |
| distinct_triggers | distinct reaction names with `set_off` 1 or more in some turn |
| kind_ring, kind_snap and the other named ones | number of times that name appears in the chains |
| off_total | sum of all `off` over the turns; off_water, off_hydrogen, off_carbon_dioxide, off_acid_fumes, off_sulfur, off_trimethylamine: the same for one jar |
| many_jars | number of jars with something in them |
| big_puff | largest total of `off` in one turn |
| acted_total | number of fired reactions that acted (9 slots at most) |
| distinct_acted | distinct names among those that acted |
| by_two_rings, by_two_off_total | the same hurdle, counted over turns 1 and 2 only |

### Structural hurdles (counts on the end-of-turn molecule)

Heavy atoms only (hydrogens are not atoms). Read them with the reading in the table (gain unless stated): the best end-of-turn value over the three turns minus the start value, never below 0.

- **Rings.** Number of rings = bonds − atoms + separate pieces. The rings themselves: a smallest set of smallest rings (`rings` in `hurdle_graph.py`: for each atom, build the breadth-first tree; every bond that is not in the tree and closes a cycle with no repeated atom gives a candidate ring; sort candidates by length; keep one if it is not the sum, bond by bond, mod 2, of the ones already kept). Ring size is its atom count.
- **rings** = the number of rings. **five_rings**, **six_rings**: rings with exactly 5 or 6 atoms. **ring_atoms**: atoms that are in at least one ring. **ring_sizes**: the number of different ring sizes.
- **fused_pairs**: pairs of rings with 2 or more atoms in common. **fused_block**: join rings that share 2 or more atoms; the number of rings in the biggest joined group. **ring_systems**: join rings that share any atom; the number of groups.
- **spiro**: atoms that are the only atom two rings have in common. **bridgehead**: for each pair of rings with 3 or more atoms in common, the two end atoms of the shared stretch; count the distinct atoms.
- **ring_hetero**: rings with at least one atom that is not carbon.
- **longest_chain**: take the carbons that are in no ring; they form branches with no loops; the most atoms on one path (find the farthest atom from any atom by breadth-first search, then the farthest from that one). **diameter**: the largest number of bonds between any two atoms. **branch**: atoms with 3 or more neighbours. **growth** / **cut_down** / **size_range**: heavy atom counts (loss, and range, as in the table).
- **kinds_at_once** (reading abs): how many of these 12 kinds of group are on the molecule: OH (an O with an H on a carbon that is not a C=O carbon, so an acid OH does not count); C=O (a carbon double-bonded to O whose other neighbours are all carbon); C=C (a double bond between two carbons not in a benzene ring); COOH; ester (C(=O)-O-C); ether (O joined to two carbons, not an ester O); amide; NH2 (on a carbon that is not C=O); SH; Cl; S-S; C=N. Test each as a small pattern at every atom.
- **left_CO** (reading last): the number of C=O groups (defined above) on the molecule after the last turn.
- **conjugated**: a single bond is conjugated when both its atoms are in a double bond, or one is in a double bond and the other is O, N, S or Cl. A double bond is conjugated when one of its atoms is in such a single bond. Join atoms by conjugated bonds; the size of the biggest group (`alternating_run`). A lone C=C or C=O is not conjugated.
- **double_bonds**: C=C plus C=O bonds; a benzene ring counts 3. **unsaturation**: rings + all double bonds (benzene ring: 1 ring and 3). **hetero_atoms**: atoms that are not carbon. **elements**: the number of different elements besides carbon.

### How close the graph version is

`python hurdle_graph.py 150` compares each function with RDKit (`hurdles.feat`) on 388 molecules (the game's and the end-of-turn molecules of played rounds, rounds 1 to 9).

- Identical on all 388: rings of 4 or fewer atoms, rings of 7 or more, number of different ring sizes, atoms in rings, ring systems, rings with two different odd atoms, heavy atoms, longest chain, span, branch points, the alternating run.
- Differ on a few: rings 24, six-rings 23, ring pairs 24, joined block 22, spiro 3, bridgehead 6, rings with an odd atom 2, benzene-type rings 10, twin atoms 24. The ring differences are all cages: RDKit lists the symmetrised set of rings (it counts four six-ring faces of adamantane and six four-ring faces of cubane; the smallest-set count is three and five).
- What a hurdle reads is the gain over the start, and there the two agree in 96.5 to 100 percent of turns: rings 97.1, five-rings 99.8, six-rings 97.5, ring pairs 97.3, joined block 96.5, ring systems 100, spiro 99.2, bridgehead 98.6, rings with an odd atom 99.4, benzene-type 98.6, chain, span, branch points, twin atoms and the alternating run 100.
- The twin-atom count is the one to avoid porting (the graph version splits atoms RDKit keeps together); it is held back anyway.

### The generator in the game

- **Table.** Ship `hurdle_table.json`: for every hurdle and round, the share of aiming players at N = 0, 1, 2, ... N is the largest N whose share is at least the round's target. This costs nothing at run time and was measured above ("table mode").
- **Sim.** To fit N to the dealt molecule the game plays the molecule 14 times with the aiming player (its `SeekPlayer`: for each of the lines of the hand, the hurdle value after the line, then points) and reads N off those 14 values. The game already runs the same kind of sweep to rank the two molecules (`screen`), so the cost is of that order; the Python version takes about 3.6 s a pick.
- Each hurdle needs the carried set to be able to feed it: off_hydrogen needs oxidize; off_carbon_dioxide needs oxidize, decarboxylation or jones; off_acid_fumes needs chlorination or williamson; off_sulfur needs raney; off_trimethylamine needs hofmann; a named self-reaction must be held (strip needs chlorination, knit amination, pop and seal jones, pair thiolene). `Hurdle.needs(carried, rules)` says it.
- Do not offer: handedness (`stereo`), twin atoms (`mirror`), a kind coming round again (`loop`) and rising turns (`crescendo`): good on the numbers, but the page cannot show them.
- Families do not repeat in the next round. Pairs from round 6; never growth with cut down or size swing, never the same count read twice (rings with five-rings or six-rings).

## What could not be done

- **No independent judge.** I have no way to start a fresh evaluator from here, so the approach and the result have not been judged by anyone but me. The memory note says to run one before showing the owner.
- **The aiming player is greedy turn by turn.** It does not save a setup for a later turn or look at the next hand, so N for 80, 60 and 40 percent is a floor for hurdles that reward planning (last turn strong, every turn busy, rising turns). A player who plans clears more.
- **Whole numbers.** A hurdle whose values run 0 to 3 cannot be tuned to 85, 80, 65 percent; the generator's rates in rounds 2 to 5 sit 8 to 18 points over target for that reason.
- **Chemistry the engine does not have.** Small rings, big rings, a benzene ring made in play, a ring with two different odd atoms, and acid fumes, sulfur and trimethylamine in most rounds are built and checked but cannot be reached or are rarely reached. I did not edit the engine. The first three need new reactions; the rest need molecules that carry nitrogen, sulfur or chlorine (every molecule of the game's table holds only carbon and oxygen).
- **Carried sets are drawn at random** from the 13 other reactions, not from a real run's unlocks, so the numbers for rounds 4 to 9 are for a spread of pools and not for the pool a given player will have.
- **Ring counts follow RDKit's ring list**, which differs from a smallest-set count on cages (see "How close the graph version is").
- **Owner's two examples.** "At least 4 rings" is `rings` (N for 60 percent is 2 to 4 depending on the round, and from the table it is a real hurdle only in rounds 5 and 6; in rounds 1 to 3 it tracks the score). "At least 2 sulfur bridges" is `kind_pair` plus the S-S group: it fires in at most 54 percent of rounds even for the aiming player, only when thiolene is carried and the molecule has SH groups, and no game molecule has sulfur, so it is not offered in general. Both stay in the code as hurdles.
- **No test of how a hurdle reads on the page**; `mark` is only a name for the drawing.
- **The table and the generator's N were fitted on molecules from the same pool;** the generator test used different draws and deals (different seeds, mostly different molecules), not a held-out pool.
- **By-hurdle variety.** One hurdle (`by_two_off_total`) is picked more than twice as often as the average one.
