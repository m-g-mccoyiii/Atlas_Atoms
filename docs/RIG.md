# Overreact: the measuring rig

Built 2026-11-10. This is the rig `BALANCE.md` asks for: whole runs played with no page by four simulated players, from seeds, with every round logged. Section 1 of `PASS.md` is measured with it. The numbers at the end are for a reviewer; nothing here says the section passes.

## What it is

| Piece | Where | What it does |
|---|---|---|
| One source of chance | `path.js`: `seed(n)`, `rand()` | Every draw on the run path (dealing, heavy atoms, picks, rounds on offer, rare reagents, wishes, terms, assays, the intern) comes from it. `seed(n)` makes a run repeatable. `seed()` returns to the system's. The game is unseeded unless the page is opened with `?seed=N`. |
| The simulation | `.claude/sim.js`, versioned copy `docs/tools_sim.js` | `runSim(player, seed, opts)` plays a run of up to nine rounds: take one of three, choose the round, play the pages as the page plays them (the intern, the chain, the twist, water and hydrogen, the finishing reagent, the wish, the extinguisher), compare with the number to beat, stop on a miss or after round nine. |
| Assays | `path.js`: `runAssays`, `assayOf` | Rounds 3, 6 and 9 are one round of a harder kind (scarce, short, each, loose). Three of the four are drawn when the run starts, one for each act. |
| The number to beat | `path.js`: `runQuota`, `PAR`, `MOLF` | Par for the round, times the square root of the molecule's factor held between 0.35 and 3, times the pact (2), the idol (1.5), the hourglass (1.25) and the stake of the run's terms. Round nine is Par times 1.15. Both tables are generated. |
| Analysis | `docs/tools_rig.py`, `tools_fit.py`, `tools_molf.py`, `tools_bake.py` | Read the logs and print the tables below, fit the Par curve, compute the molecule factors, and write both into `path.js`. |

### The four players

| Player | On a page | Take one of three | Choose the round |
|---|---|---|---|
| novice | the biggest gain six times in ten, anything otherwise; may finish early | at random | at random |
| greedy | the biggest gain now (the player `MATRIX.md` was measured with) | equipment, then reagent, level, stronger, one more use | the first on the page |
| median | never breaks a row when it can be kept; looks three reactions ahead and takes the line that makes most; twists; spends water; finishes when that pays | the highest "in a build" worth from `MATRIX.md` | the easiest: what the kind and the molecule make, over the number |
| planner | searches the page three deep, may break a row, counts what a charged page will add and what the row will multiply later; twists; spends water and hydrogen; wishes on assays; stops a chain on its last link with the extinguisher | worth in a build times the measured pair synergy with what is held, with the pact, idol and hourglass marked down by what they add to the number | as the median player |

Guesses, not measurements: a stronger reagent is worth 1.3, one more use 1.1, a level half of the piece's worth above 1. What each kind of round makes against a plain one (plain 1, carry 0.4, broad 1.4, loose 1.1, each 0.6, back 1, scarce 0.3, short 0.4) was rounded from a first measure of the median player.

### What a round logs

`seed, player, round, mol, carry, family, kind, assay, gear (with levels), rack (with grades and uses), offered, took, number, par, mult, pages (the total after each page), total, pass, chain (longest chain), row (longest row), steps, atoms (largest molecule), cut, live`.

Not logged: what each source added to the total.

### Limits

- **Large molecules are cut.** The rules let a molecule grow without limit, and a reaction on a molecule of a thousand atoms takes most of a second. A round is stopped once the molecule passes 600 atoms (or three times its starting size), and what it had made is its total. A molecule left with more than 300 atoms is not carried into the next round. The look-ahead is cut to two reactions past 100 atoms and to one past 250, and the twist is not looked for past 150 atoms. In the final measure 0.1% of the novice's rounds were cut, 0.6% of the greedy player's, 3.4% of the median player's and 13% of the planner's. Seven cut rounds of 18,000 were then counted as missed; the rest were far over the number.
- **Speed.** With eight tabs measuring at once a run takes 0.3 s for the novice and greedy players, 1.5 s for the median player and 2.9 s for the planner. Only the first two are under the second that was asked for. The time goes on large molecules, inside the rules (`shapeOf`, the reaction search and the signature all grow faster than the molecule), not in the players.
- **All six suppliers are open** (`tier` 5) and the run's terms are plain, unless `opts` says otherwise.
- **The fit and the players share one measure.** Par was fitted on seeds 1 to 500 of the median player. Seeds 501 to 1,000 were then played as a check.

## How to run it

The preview server serves the repository at `http://localhost:8766`; the frame server on port 8767 saves what the page posts into the scratchpad `frames` folder (start `recsrv.py` if nothing is listening).

1. Open `http://localhost:8766/.claude/rec.html?name=none&r=1`.
2. One run: `runSim('median', 7)`, or to go on after a miss `runSim('median', 7, { all: true })`. Options: `tier`, `noGear`, `term`, `rounds`, `noCarry`, `relaxed`.
3. A measure, one browser call for each piece of about 22 seconds: `await simChunk('tag', ['novice','greedy','median','planner'], 1, 500, 120000, { all: true }, 22000)`. Call it again with the same arguments until it answers `done`. Each call posts its rounds as file `f120000.jpg`, `f120001.jpg` and so on (JSON, whatever the name). This is roughly a hundred calls.
4. The same measure shared by eight tabs, which is how the tables here were made: open the page in eight tabs and call `simPart('tag', k, 120000, { all: true })` in tab k, for k from 0 to 7. Each answers at once and works on in pieces of five seconds, each ended by its post; no call runs long and no timer is used. `simStat()` says how far a tab is. Part k posts from file `120000 + 1000 k`. A whole measure takes about seven minutes.
5. Tables: `python docs/tools_rig.py tag 120000 127999`.
6. Molecule factors: `await simMols('molf', 'median', 40, 110000, 0, 5)`, then `5, 10`, `10, 15`, `15, 19`, `19, 23`; then `python docs/tools_molf.py 110000 molf.json`.
7. Par: `python docs/tools_fit.py tag 120000 127999 par.json - - - 0.07` fits a curve whose steps fall by at least 0.07 a round. `python docs/tools_fit.py tag 120000 127999 x.json 3700 2.5 0.07` reports what a given curve would do. `python docs/tools_bake.py par.json molf.json` writes both tables into `path.js`, stamps them and bumps the version.

Measures are made with `{ all: true }`: a run goes on after a miss, and the analysis stops each run at its first miss. Nothing in a run reads whether the last round was beaten or what the number was (the choice of round reads only how the numbers on the page compare), so this gives the same rounds as stopping, and one measure can be read against any Par curve.

The scripts carry the path of the scratchpad `frames` folder at the top.

## How the tables in `path.js` were made

**Molecule factors.** The median player, a plain round, the starting four reagents, no equipment, 40 seeded plays of each of the 23 molecules. The factor is the molecule's median over the average of the 23 medians (of logarithms). They run from 0.11 (the bridged ring `OC1CC2CCC1C=C2`) to 37.7 (the open sugar `OCC(O)C(O)C(O)C(O)C=O`): a spread of 343 times. Thirteen of the 23 lie outside 0.35 to 3 and are held at the edge.

**Par.** The median player, 500 runs that go on after a miss, with the number's molecule and stake factors divided out. Median total by round:

| Round | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| Median total | 83,600 | 109,000 | 96,200 | 412,000 | 639,000 | 310,000 | 2,990,000 | 4,590,000 | 1,270,000 |
| Par, baked | 3,700 | 9,250 | 22,500 | 53,000 | 121,000 | 270,000 | 580,000 | 1,210,000 | 2,420,000 |

The medians do not climb smoothly: every assay falls back, and round 9 makes less than round 7. Par is a curve of three numbers, a start and steps that shrink by a fixed amount, chosen so that the median player's pass rate is as near the targets in `BALANCE.md` as it can be in every round: **start 3,700, first step 2.5, each step 0.07 smaller** (2.5, 2.43, 2.36, 2.29, 2.22, 2.15, 2.08, 2.01), 655 times over nine rounds. `BALANCE.md` guessed 1.9 falling by 0.07, 54 times; builds grow much faster than that. `BALANCE.md` also says the number is Par and Par is the median total, which would give a pass rate of one in two in every round; its own table of pass rates was taken as what binds, so Par sits well under the median.

Tuning: one fit, then a measure with the baked numbers, then a check on 500 new seeds. A second fit on all 1,000 runs found no curve with a worst miss under 7.3 points against 8.0 for the baked one, so nothing was changed. No piece was touched.

## The measure: the new number to beat

500 runs for each player on seeds 1 to 500, rules at commit `b2f39b6`. Pass rate by round, of the runs that reached it (how many reached it in brackets):

| Round | novice | target | greedy | median | target | planner | target |
|---|---|---|---|---|---|---|---|
| 1 | 87% (500) | 90% | 96% (500) | 93% (500) | 98% | 98% (500) | 99% |
| 2 | 73% (436) | 80% | 94% (482) | 88% (464) | 95% | 94% (491) | 99% |
| 3, assay | 46% (318) | 55% | 66% (453) | 84% (406) | 85% | 91% (460) | 97% |
| 4 | 45% (145) | 55% | 97% (297) | 84% (343) | 92% | 91% (419) | 98% |
| 5 | 46% (65) | 40% | 98% (287) | 79% (289) | 88% | 91% (381) | 95% |
| 6, assay | 13% (30) | 20% | 31% (281) | 62% (229) | 70% | 87% (348) | 90% |
| 7 | 25% (4) | 15% | 77% (88) | 82% (142) | 78% | 90% (303) | 90% |
| 8 | 0% (1) | 10% | 68% (68) | 78% (116) | 70% | 91% (273) | 85% |
| 9, assay | none reached | 5% | 2% (46) | 46% (91) | 50% | 76% (249) | 70% |

| Player | Runs | Rounds beaten at 10, 25, 50, 75, 90 percent | Mean | Target median | Wins | Passed by more than 5 times | Last page decided, round 4 on |
|---|---|---|---|---|---|---|---|
| novice | 500 | 0, 1, 2, 3, 4 | 2.0 | 3 | 0.0% | 54.7% of 999 | 38% |
| greedy | 500 | 2, 2, 5, 5, 7 | 4.0 |  | 0.2% | 69.4% of 2,003 | 16% |
| median | 500 | 1, 2, 4, 6, 8 | 4.2 | 6 | 8.4% | 73.0% of 2,122 | 27% |
| planner | 500 | 2, 4, 7, 9, 9 | 6.2 | 9 | 37.6% | 80.4% of 3,112 | 18% |

Median margin over the number, of the runs that reached the round:

| Round | novice | greedy | median | planner | target, median player |
|---|---|---|---|---|---|
| 1 | 6.27 | 7.30 | 22.50 | 22.62 | 3 |
| 2 | 2.80 | 15.85 | 12.01 | 23.53 | 2.5 |
| 3 | 0.78 | 1.66 | 4.85 | 11.05 | 1.6 |
| 4 | 0.80 | 16.62 | 11.62 | 24.33 | 2 |
| 5 | 0.88 | 41.09 | 7.04 | 47.46 | 1.8 |
| 6 | 0.11 | 0.36 | 1.93 | 10.67 | 1.4 |
| 7 | 0.87 | 11.02 | 14.47 | 41.51 | 1.5 |
| 8 | 0.08 | 7.89 | 13.86 | 39.39 | 1.3 |
| 9 |  | 0.02 | 0.78 | 6.85 | 1.2 |

**The check on new seeds.** The median player on seeds 501 to 1,000, same baked numbers: 95, 86, 82, 85, 84, 61, 80, 77, 53 percent. Rounds beaten 1, 2, 4, 6, 8 at the same five points; wins 9.4%; 71% of passes by more than five times.

## The gates of section 1

| Gate | Measured | Met |
|---|---|---|
| 500 or more whole runs for each player on the same seeds | 500 each on seeds 1 to 500, and 500 more for the median player | yes |
| Median player within 12 points of the target in every round | misses of -5.2, -7.5, -0.5, -7.7, -8.8, -8.0, +3.7, +8.4, -3.8; worst 8.8 (round 5). On the new seeds: worst 9.1 (round 2) | yes |
| Rounds passed by more than 5 times under 8% | median player 73.0% of 2,122 passed rounds (71.4% on the new seeds) | no |
| No molecule more than 3 times harder or easier than another in the same round | the easiest molecule is beaten by 27 to 254 times more than the hardest, by round (median margin, every molecule with eight plays or more) | no |

**Why the 5 times gate cannot be met by the number.** The gate needs most of a round's totals to lie within five times of each other. They do not. For the median player the 90th percentile of a round's total is 100 to 2,100 times the 10th, whatever the number is. In round 1, a number that 98% of runs pass is passed by more than five times by 91% of them; in round 9, a number that half pass is passed by more than five times by 57% of those. Holding the molecule and the kind of round fixed does not help: in round 1 the same molecule under the same kind still spreads 47 times from the 10th to the 90th percentile. The spread comes from the build and the deal, which the number must not read. Only a change to the rules can close it (what a pick is worth, what a deal can be, how far a chain can run).

**Why the molecule gate cannot be met by the number.** The number may differ between molecules by the square root of a factor held between 0.35 and 3, which is 2.9 times at most. Plain play differs by 343 times. And the plain factor does not carry into a run: with the whole factor in the number and no hold, molecules in the same round would still differ by 15 to 360 times, because a build changes which molecules pay. The diene `C=CCC(O)CC=C` has a plain factor of 1.59 and is the hardest molecule in every one of the nine rounds. This needs the molecules brought closer in the rules, or a factor measured for each molecule inside runs, round by round.

## The game as it was: the old number to beat

500 runs for each player on the same seeds with the rules at commit `bb371d6`: the old table of 161 numbers, growth 1.75 a round to round 3 and 1.5 after, the same four players, the same assays. The round that carries the last molecule on was left out, because the old number for it was made by playing sixty rounds every time the page of rounds came up.

| Round | novice | target | greedy | median | target | planner | target |
|---|---|---|---|---|---|---|---|
| 1 | 50% (500) | 90% | 45% (500) | 83% (500) | 98% | 90% (500) | 99% |
| 2 | 43% (249) | 80% | 47% (225) | 82% (417) | 95% | 90% (451) | 99% |
| 3, assay | 45% (108) | 55% | 67% (105) | 67% (343) | 85% | 78% (406) | 97% |
| 4 | 33% (49) | 55% | 57% (70) | 83% (229) | 92% | 91% (316) | 98% |
| 5 | 38% (16) | 40% | 72% (40) | 85% (191) | 88% | 94% (288) | 95% |
| 6, assay | 50% (6) | 20% | 66% (29) | 85% (162) | 70% | 87% (270) | 90% |
| 7 | 33% (3) | 15% | 37% (19) | 92% (138) | 78% | 96% (235) | 90% |
| 8 | 0% (1) | 10% | 14% (7) | 91% (127) | 70% | 95% (226) | 85% |
| 9, assay | none reached | 5% | 0% (1) | 84% (116) | 50% | 94% (215) | 70% |

| Player | Runs | Rounds beaten at 10, 25, 50, 75, 90 percent | Mean | Wins | Passed by more than 5 times | Last page decided, round 4 on |
|---|---|---|---|---|---|---|
| novice | 500 | 0, 0, 0, 1, 2 | 0.9 | 0.0% | 37.0% of 432 | 42% |
| greedy | 500 | 0, 0, 0, 1, 3 | 1.0 | 0.0% | 34.5% of 496 | 51% |
| median | 500 | 0, 1, 2, 7, 9 | 3.6 | 19.6% | 62.0% of 1,821 | 29% |
| planner | 500 | 1, 2, 5, 9, 9 | 5.2 | 40.6% | 77.4% of 2,610 | 13% |

The old number was hardest in round one, where half of the novice's runs and one in six of the median player's ended, and easier after: the median player passed round 8 more often than round 1. Its worst miss against the targets was 34 points (round 9). Molecules in the same round differed by 19 to 224 times.

## What else the rig found

- **Assays are not equally hard.** In round 9 the median player passes a loose assay 91% of the time, each 72%, scarce 26%, short 4%. Loose and each are passed more often than scarce and short in every act, so an assay's difficulty is mostly which kind was drawn.
- **Hydroborate.** `MATRIX.md` puts it at 81 times a plain rack, so the median player and the planner take it whenever it is offered. That is probably why the first rounds are easier with one supplier, where it is offered early in most runs; this was not measured apart.
- **Carrying a molecule on** made about a quarter of a new plain round in round 2 and caught up only by round 8, in the first measure of the median player.
- **Fewer suppliers is easier early and harder late.** Median player, same numbers:

| Suppliers open | Runs | Pass rate, rounds 1 to 9 | Median rounds beaten | Wins |
|---|---|---|---|---|
| one, no equipment (a first run) | 150 | 100, 99, 89, 92, 77, 41, 53, 45, 0 | 5 | 0% |
| two | 300 | 97, 99, 87, 93, 92, 59, 85, 84, 31 | 5 | 9.3% |
| four | 300 | 92, 87, 82, 86, 81, 58, 74, 64, 39 | 4 | 5.0% |
| six (seeds 1 to 300 of the measure) | 300 | 92, 86, 82, 85, 77, 61, 81, 76, 43 | 4 | 6.7% |

  A run with no equipment cannot be won. The novice with one supplier and no equipment: 93, 82, 45, 63, 44, 36, 60, 0, median 2 rounds.
- **Molecules grow without limit.** A run reaches 1,000 atoms (2,565 was seen before the cut). On such a molecule one look for the twist took 6.2 seconds and one link of a chain 0.3 to 0.7 seconds. The page calls the same functions, so the game will stall there too.
- **The old number for a carried round** played sixty simulated rounds each time the page of rounds was shown. The new number plays none.
- **The last page decides** 27% of the median player's passes from round 4 on. The target is 55%.
