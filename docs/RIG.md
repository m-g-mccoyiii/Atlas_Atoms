# Overreact: the measuring rig

Built 2026-11-10. This is the rig `BALANCE.md` asks for: whole runs played with no page by four simulated players, from seeds, with every round logged. Sections 1 and 2 of `PASS.md` are measured with it. The numbers are for a reviewer; nothing here says a section passes.

The rules of a round were changed later the same day (bounds, a budget of uses, forks in the chain, a hand, the redraw, the bank) and everything was measured again. That measure is the section "The measure after the rules of a round were changed". The measure made before it is kept below it, because it is the "before" of every comparison.

## What it is

| Piece | Where | What it does |
|---|---|---|
| One source of chance | `path.js`: `seed(n)`, `rand()` | Every draw on the run path (dealing, heavy atoms, picks, rounds on offer, rare reagents, wishes, terms, assays, the intern) comes from it. `seed(n)` makes a run repeatable. `seed()` returns to the system's. The game is unseeded unless the page is opened with `?seed=N`. |
| The simulation | `.claude/sim.js`, versioned copy `docs/tools_sim.js` | `runSim(player, seed, opts)` plays a run of up to nine rounds: take one of three, choose the round, play the pages as the page plays them (the hand, the redraw, the bank, the intern, the chain and its forks, the twist, water and hydrogen, the finishing reagent, the wish, the extinguisher), compare with the number to beat, stop on a miss or after round nine. |
| The switches | `path.js`: `RULE` | The rules of a round added on 2026-11-10 can each be turned off: `atoms`, `chain`, `loops`, `loopsAll`, `ground`, `uses`, `fork`, `hand`, `redraw`, `bank`. `runSim(..., { rule: {...} })` overrides them for one run, so a rule is measured on and off on the same seeds. |
| Assays | `path.js`: `runAssays`, `assayOf` | Rounds 3, 6 and 9 are one round of a harder kind (scarce, short, each, loose). Three of the four are drawn when the run starts, one for each act. |
| The number to beat | `path.js`: `runQuota`, `PAR`, `MOLF` | Par for the round, times the square root of the molecule's factor held between 0.35 and 3, times the pact (2), the idol (1.5), the hourglass (1.25) and the stake of the run's terms. Round nine is Par times 1.15. Both tables are generated. |
| Analysis | `docs/tools_rig.py`, `tools_fit.py`, `tools_molf.py`, `tools_bake.py`, `tools_round.py` | Read the logs and print the tables below, fit the Par curve, compute the molecule factors, and write both into `path.js`. `tools_round.py` prints how wide a round is, how much of a choice a turn was, and the paired test of breaking on purpose. |

### The four players

| Player | On a page | Take one of three | Choose the round |
|---|---|---|---|
| novice | the biggest gain six times in ten, anything otherwise; may finish early. Banks whenever the die says so, redraws one decision in eight for no reason, and at a fork takes the biggest link six times in ten and otherwise a random one or the bank | at random | at random |
| greedy | the biggest gain now (the player `MATRIX.md` was measured with). The bank is one more number to it, on a page and at a fork. Redraws only when nothing acts | equipment, then reagent, level, stronger, one more use | the first on the page |
| median | never breaks a row when it can be kept; looks three reactions ahead and takes the line that makes most; twists; spends water; finishes when that pays. Redraws when a row of two or more is open and nothing in the hand keeps it, and banks when even then nothing does. Takes the biggest link at a fork | the highest "in a build" worth from `MATRIX.md` | the easiest: what the kind and the molecule make, over the number |
| planner | searches the page three deep with the bank as one of the moves, may break a row, counts what a charged page will add and what the row will multiply later; twists; spends water and hydrogen; wishes on assays; stops a chain on its last link with the extinguisher. At a fork it plays each way out to the end of the chain and compares that with banking there. Redraws as the median player does, and also a hand with fewer than two live reagents | worth in a build times the measured pair synergy with what is held, with the pact, idol and hourglass marked down by what they add to the number | as the median player |
| keeper | the planner with no way to end a row on purpose: it keeps the row whenever it can and never banks. Used only for the paired test of breaking | as the planner | as the planner |

Guesses, not measurements: a stronger reagent is worth 1.3, one more use 1.1, a level half of the piece's worth above 1. What each kind of round makes against a plain one (plain 1, carry 0.45, broad 1.2, loose 1.6, each 1.6, back 1.3, scarce 0.55, short 0.85) was rounded from 150 runs of the median player under the new rules. Stale: the worth of each piece and pair (`MATRIX.md`) was measured under the old rules and the players still pick by it.

### What a round logs

`seed, player, round, mol, carry, family, kind, assay, gear (with levels), rack (with grades and uses), offered, took, number, par, mult, pages (the total after each page), total, pass, chain (longest chain), row (longest row), steps, atoms (largest molecule), heavy (heavy atoms at the end), cut, live, banks, bankAt (where each bank was made and how long the row was), redraws, forks, idle (reactions of a page left unused), left (uses left at the end)`. With `{ dec: true }` also `dec`: for every turn of a page, how many options there were and whether the second was worth taking.

Not logged: what each source added to the total.

### Limits

- **Large molecules were cut, and no longer need to be.** Since the size limit of 32 heavy atoms no round has been cut and the largest molecule in 18,000 rounds had 90 atoms with its hydrogens. The cut is still in the rig. Before the limit: the rules let a molecule grow without limit, and a reaction on a molecule of a thousand atoms takes most of a second. A round is stopped once the molecule passes 600 atoms (or three times its starting size), and what it had made is its total. A molecule left with more than 300 atoms is not carried into the next round. The look-ahead is cut to two reactions past 100 atoms and to one past 250, and the twist is not looked for past 150 atoms. In the final measure 0.1% of the novice's rounds were cut, 0.6% of the greedy player's, 3.4% of the median player's and 13% of the planner's. Seven cut rounds of 18,000 were then counted as missed; the rest were far over the number.
- **Speed.** With eight tabs measuring at once and every turn weighed (`dec`), a run now takes 0.25 s for the novice and greedy players, 0.7 s for the median player and 1.3 s for the planner. Before the size limit it was 0.3, 1.5 and 2.9 s without weighing turns, and the time went on large molecules inside the rules.
- **All six suppliers are open** (`tier` 5) and the run's terms are plain, unless `opts` says otherwise.
- **The fit and the players share one measure.** Par was fitted on seeds 1 to 500 of the median player. Seeds 501 to 1,000 were then played as a check.

## How to run it

The preview server serves the repository at `http://localhost:8766`; the frame server on port 8767 saves what the page posts into the scratchpad `frames` folder (start `recsrv.py` if nothing is listening).

1. Open `http://localhost:8766/.claude/rec.html?name=none&r=1`.
2. One run: `runSim('median', 7)`, or to go on after a miss `runSim('median', 7, { all: true })`. Options: `tier`, `noGear`, `term`, `rounds`, `noCarry`, `relaxed`.
3. A measure, one browser call for each piece of about 22 seconds: `await simChunk('tag', ['novice','greedy','median','planner'], 1, 500, 120000, { all: true }, 22000)`. Call it again with the same arguments until it answers `done`. Each call posts its rounds as file `f120000.jpg`, `f120001.jpg` and so on (JSON, whatever the name). This is roughly a hundred calls.
4. The same measure shared by eight tabs, which is how the tables here were made: open the page in eight tabs and call `simPart('tag', k, 120000, { all: true })` in tab k, for k from 0 to 7. Each answers at once and works on in pieces of five seconds, each ended by its post; no call runs long and no timer is used. `simStat()` says how far a tab is. Part k posts from file `120000 + 1000 k`. A whole measure takes about seven minutes.
5. Tables: `python docs/tools_rig.py tag 120000 127999`. Spread of a round and the turn measures (the measure must have been made with `dec: true`): `python docs/tools_round.py tag 120000 127999`.
6. Molecule factors: `await simMols('molf', 'median', 40, 110000, 0, 8)`, then `8, 16`, `16, 23`; then `python docs/tools_molf.py 110000 molf.json`.
7. Par: `python docs/tools_fit.py tag 120000 127999 par.json - - - 0.07` fits a curve whose steps fall by at least 0.07 a round. `python docs/tools_fit.py tag 120000 127999 x.json 3700 2.5 0.07` reports what a given curve would do. `python docs/tools_bake.py par.json molf.json` writes both tables into `path.js`, stamps them and bumps the version.

8. Breaking on purpose: `simBreak('tag', 320000, 1001, 1030, 5)` takes every round of the planner's runs on those seeds as a build and plays each five times with the planner and five with the keeper on the same seeds; `simStat()` says how far it is; then `python docs/tools_round.py break 320000`.
9. Never start a second `simGo`, `simPart` or `simBreak` in a tab where one is running. Reload the tab first.

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

## The measure after the rules of a round were changed

Measured 2026-11-10 on the rules at commit `0220c1c` with the tables baked after it. For a reviewer: nothing here says a section passes.

### What changed in a round

| Rule | What it is now | Chosen how |
|---|---|---|
| Size | a reaction that would grow the molecule past 32 heavy atoms is not offered | 28 and 40 gave the same spread; 32 was taken between them so that a molecule stays readable on the page and a reaction stays quick |
| Chain | a free chain runs six links at most | 5, 6, 8 and 10 tried, with no clear difference in spread between 5, 6 and 8. Six was kept as the shortest at which a round with a chain of five or six still makes 2.1 to 3.5 times one with two or fewer. A third of the median player's rounds reach the limit |
| Loops | a return to an earlier form carries a row on at most twice a round, for any player. The recycler no longer decides it; it still adds to the row on a loop | with a budget of uses a loop cannot run away, and letting a loop continue gives a second way on in turns that had one |
| Follows on | a reaction carries the row on when it acts on what either of the last two reactions of the row made (it was the last one only) | two and three and "any" measured the same; two is the least change |
| Resonance | multiplies extra by 1.02 a link, not 1.05 | at six links 1.05 is 1.3 a reaction. It alone put the four phenyl molecules four times above the rest and it halved the spread when lowered |
| Uses | three uses of each reagent for the whole round (two for a rare one, half in a scarce round), spent by the pages and the chain alike | 3 and 4 tried; 4 widens the spread again |
| Forks | a chain that could go on with two or more reagents stops for a click | 2.2 forks a round for the median player, 4.0 for the planner |
| Hand | six reagents to start (reduce and hydroborate added), a page shows five, reagents with uses left first, and the deal is not repeated | with the old four, one reagent took each group and most turns had one way on. With six to start, a hand of four gives 44% of turns a second option worth taking, five 49% and six 52% |
| Redraw | once a page, for one use of the fullest reagent in the hand | used 1.4 times a round by the median player |
| Bank | closes the open row for one and a half times what it holds; takes one reaction of the page, or ends a chain stopped at a fork | 1.5 and 2 tried. At 2 the bank is taken more and turns score a little higher on the measure; 1.5 was kept as asked |

Dropped: a hand of four from a rack of four or five (it removed options and the redraw gave back the same hand). A limit of 40 atoms and a chain of 8 or 10 (no gain). Four uses. A halved arene bonus (no change once resonance was lowered).

Not changed: any piece of equipment. The recycler's role changed with the loop rule and nothing else was touched.

### One step at a time

The median player on seeds 1 to 150, every run played to round nine, the old number to beat. Spread is the 90th percentile of a round's total over the 10th, by round, every run counted. A turn has "a second option" when the second biggest gain is within 30% of the biggest, or when taking it and then the biggest gain for two more turns (and the chain, if the page ends charged) makes more.

| Rules | Spread of a round, least to most over nine rounds | Rounds under 30 | Turns with a second option | Row open and at most one reagent keeps it |
|---|---|---|---|---|
| as they were | 52 to 2,680 | 0 | 44% | 57% |
| bounds: size, chain, loops, follows on, resonance | 23 to 91 | 1 | 40% | 56% |
| and a budget of uses | 20 to 95 | 4 | 36% | 59% |
| and forks (planner: no change in totals) | as above | | | |
| and the hand of five with the redraw | 17 to 109 | 5 | 35% | 67% |
| and the bank | 15 to 102 | 6 | 49% | 68% |
| the same on 500 runs with the players choosing rounds by the new table | 10 to 47 | 7 | 53% | 63% |

Bounds and the budget cut the spread. They also removed options, and turns got worse until the bank and the second reagent for every group were in.

### The tables in `path.js`

**Molecule factors**, measured as before (median player, plain round, starting rack, no equipment, 40 plays each). They run from 0.11 (adamantanol) to 2.5 (three of the phenyl molecules): 22 times, where it was 343. Two of the 23 lie outside the hold of 0.35 to 3, where it was thirteen.

**Par**: start 2,530, first step 2.11, each step 0.072 smaller, 138 times over nine rounds (it was 3,700, 2.5 and 0.07: 655 times). Two fits. The first, on seeds 1 to 500, gave 3,080 and steps from 2.0; checked on seeds 501 to 1,000 it missed round 8 by 13 points. The second, on all 1,000 runs, is the one baked. It was then measured on seeds 1 to 500 again and on seeds 1,001 to 1,500, which no fit has seen.

Baked: 2,530, 5,330, 10,900, 21,400, 40,400, 73,700, 129,000, 216,000, 347,000.

### Pass rates

500 runs for each player on seeds 1 to 500. Pass rate by round, of the runs that reached it:

| Round | novice | target | greedy | median | target | planner | target |
|---|---|---|---|---|---|---|---|
| 1 | 86% (500) | 90% | 98% (500) | 100% (500) | 98% | 100% (500) | 99% |
| 2 | 77% (432) | 80% | 88% (492) | 99% (500) | 95% | 99% (499) | 99% |
| 3, assay | 57% (331) | 55% | 82% (435) | 92% (493) | 85% | 97% (496) | 97% |
| 4 | 53% (190) | 55% | 81% (356) | 94% (454) | 92% | 98% (479) | 98% |
| 5 | 33% (100) | 40% | 74% (287) | 88% (425) | 88% | 92% (471) | 95% |
| 6, assay | 21% (33) | 20% | 35% (213) | 64% (375) | 70% | 83% (435) | 90% |
| 7 | 57% (7) | 15% | 65% (74) | 74% (239) | 78% | 84% (363) | 90% |
| 8 | 0% (4) | 10% | 56% (48) | 75% (178) | 70% | 78% (304) | 85% |
| 9, assay | none reached | 5% | 4% (27) | 47% (133) | 50% | 68% (236) | 70% |

| Player | Runs | Rounds beaten at 10, 25, 50, 75, 90 percent | Mean | Target median | Wins | Passed by more than 5 times | Last page decided, round 4 on |
|---|---|---|---|---|---|---|---|
| novice | 500 | 0, 1, 2, 3, 4 | 2.2 | 3 | 0.0% | 44.9% of 1,097 | 39% |
| greedy | 500 | 1, 2, 4, 5, 6 | 3.9 |  | 0.2% | 48.1% of 1,933 | 19% |
| median | 500 | 3, 5, 5, 8, 9 | 5.7 | 6 | 12.4% | 58.6% of 2,859 | 28% |
| planner | 500 | 4, 5, 7, 9, 9 | 6.9 | 9 | 32.0% | 69.8% of 3,443 | 19% |

Median margin over the number, of the runs that reached the round:

| Round | novice | greedy | median | planner | target, median player |
|---|---|---|---|---|---|
| 1 | 5.65 | 5.95 | 20.20 | 31.43 | 3 |
| 2 | 2.80 | 3.86 | 11.50 | 20.97 | 2.5 |
| 3 | 1.32 | 2.78 | 4.69 | 10.10 | 1.6 |
| 4 | 1.07 | 3.40 | 4.88 | 8.72 | 2 |
| 5 | 0.57 | 2.49 | 3.86 | 5.72 | 1.8 |
| 6 | 0.33 | 0.59 | 1.50 | 3.02 | 1.4 |
| 7 | 1.12 | 1.66 | 2.39 | 4.04 | 1.5 |
| 8 | 0.23 | 1.22 | 2.09 | 3.53 | 1.3 |
| 9 |  | 0.08 | 0.89 | 2.06 | 1.2 |

**New seeds.** The median player on seeds 1,001 to 1,500, same baked numbers: 100, 99, 91, 92, 86, 66, 78, 71, 44 percent; worst miss 6.5 points (round 3). Rounds beaten 3, 4, 5, 8, 9 at the same five points; wins 11.4%; 61.5% of passes by more than five times; the last page decided 24%.

### The gates of section 1, measured, awaiting review

| Gate | Before | Now | Met |
|---|---|---|---|
| 500 or more whole runs for each player on the same seeds | 500 each | 500 each on seeds 1 to 500, and 500 more for the median player on new seeds | yes |
| Median player within 12 points of the target in every round | worst 8.8 | misses of +2.0, +3.6, +7.1, +1.6, +0.2, -6.3, -3.5, +4.7, -3.4; worst 7.1 (round 3). New seeds: worst 6.5 | yes |
| Rounds passed by more than 5 times under 8% | 73.0% of the median player's passed rounds | 58.6% of 2,859 (61.5% on new seeds) | no |
| No molecule more than 3 times harder or easier than another in the same round | 27 to 254 times | 2.8 to 7.7 times by round (median margin, every molecule with eight plays or more): 3.9, 3.0, 7.7, 5.9, 5.1, 7.6, 2.8, 5.8, 3.5. Two rounds of nine are within 3 | no |

How wide a round is, for the median player: the 90th percentile of the total over the number, over the 10th, of the runs that reached the round.

| Round | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| Before | 198 | 1,144 | 103 | 686 | 1,278 | 233 | 893 | 1,497 | 2,079 |
| Now | 8.6 | 11.0 | 19.9 | 13.4 | 19.7 | 23.3 | 32.4 | 34.2 | 27.1 |

The aim was under 30 in every round. Seven rounds of nine are; rounds 7 and 8 are just over. Counting every run in every round and the raw total (so nothing depends on the number): 9.6, 10.8, 20.3, 14.6, 18.1, 29.8, 28.0, 36.0, 46.7. The planner is wider (15 to 47) and so is the novice (30 to 64).

**Why the 5 times gate is still not met.** In round one the median player's 10th percentile is at 0.3 of its median and the target is that 98% pass. A number that 98% pass is then passed by more than five times by most of them: the median margin is 20. The gate needs a round's totals within about five times of each other while 98% pass. They are within nine. What is left of the spread: the deal and the line of play (a round with a chain of five or six makes 2.1 to 3.5 times one with two or fewer, and pages on which little acts make a low tail), the kind of round (a plain round is beaten by 9.0 at the median, a scarce one by 1.0), the molecule (4 to 8 times after the number's factor), and late in a run the build. The largest single cause late is a level on a piece that multiplies: the highest totals of rounds 7 to 9 are a goat at level 7, a pact with a voodoo doll at level 2 or 3, a candle. Levels are not a rule of a round and were not touched.

**The last page** decided 28% of the median player's passes from round 4 on (27% before; the target is 55%). It follows from the same margin.

### The gates of section 2, measured, awaiting review

Turns: every reaction of a page, in the runs above. The options of a turn are the reactions on offer and the bank.

| Measure | Before (median player, 150 runs) | novice | greedy | median | planner |
|---|---|---|---|---|---|
| Turns | 14,654 | 34,111 | 38,495 | 41,087 | 45,468 |
| Second option within 30% of the best | 28.7% | 29.7% | 34.1% | 28.9% | 36.0% |
| Not that, but better two turns later | 15.5% | 11.7% | 9.5% | 24.6% | 23.9% |
| Either: the gate asks for half | 44.3% | 41.4% | 43.6% | 53.4% | 60.0% |
| Turns with one option only | 24.4% | 27.2% | 26.7% | 15.8% | 11.0% |
| Row open and at most one reagent keeps it | 57.2% | 64.6% | 69.5% | 63.4% | 50.5% |
| Options a turn | 1.99 | 2.21 | 2.18 | 2.52 | 2.66 |
| Forks a round | (the chain did not stop) | 1.0 | 1.1 | 2.2 | 4.0 |
| Banks a round | | 1.2 | 1.4 | 1.0 | 1.2 |
| Redraws a round | | 1.3 | 0.6 | 1.4 | 2.2 |

| Gate | Measured | Met |
|---|---|---|
| In at least half of turns the second-best option is within 30% of the best or leads to a higher total two turns later | 53.4% of the median player's turns and 60.0% of the planner's. 41.4% of the novice's and 43.6% of the greedy player's: a player who plays badly reaches worse turns | yes for the two players the gate is about, by a small margin |
| There is a verb for a bad deal | the redraw, once a page, for one use | yes |
| A player that may break on purpose beats one that may not on at least a fifth of builds | 269 builds from the planner's runs on seeds 1,001 to 1,030, each played five times by the planner and five by the keeper on the same seeds. The planner's median is higher on 70.6% of builds (by more than 5% on 66.5%), lower on 25.3%, equal on 4.1%. Median ratio 1.23 | yes |
| Reviewer: "a turn is a small puzzle" | not asked | |

Where the planner banks (166 banks in 135 rounds): 85 in the middle of a page, 56 at a fork, 18 as the last reaction of a page, 7 as the last reaction of the round. The row banked is 10.8 long on average.

Read with care: the turn measure counts a second option that is nearly as good now as a choice, whether or not a person would feel one. A row is still open with at most one reagent that keeps it in 63% of the median player's turns; what made the measure pass is the bank standing beside that one reagent, and the two-turn clause. The gate says a break is "sometimes" right and the test says the player who may bank wins on seven builds in ten, so the bank may be too good at 1.5.

### What is still wrong, found in this measure

- **Round one is beaten by 20 times at the median.** The spread fell by tens of times and the number cannot do the rest.
- **Kinds of round are 9 times apart** in what they are beaten by (plain 9.0, back 6.7, broad 6.4, loose 3.9, each 3.5, short 1.6, scarce 1.0). A scarce round halves the budget of uses, which costs far more than half. Assays are scarce or short half the time, which is why rounds 3, 6 and 9 sag.
- **Levels on multiplying pieces** make the top of rounds 7 to 9. Not a rule of a round.
- **The worth tables the players pick by are stale** (`MATRIX.md` was measured under the old rules, and hydroborate, worth 81 there, is now a starting reagent).
- **A first run has one new reagent to find** (close a ring), because reduce and hydroborate moved from the corner chemist into the starting rack. Later picks in a first run are a stronger reagent or one more use.
- **The planner is short of its targets late** (84, 78, 68 percent in rounds 7 to 9 against 90, 85, 70) and wins 32% against 40%. The novice is on target to round 6.
- **The preview no longer spends what a broken row leaves for the black cat.** That was a bug in `peek`; fixing it means a build with the cat does not reproduce the old logs exactly.

## Before the rules of a round were changed: the first measure of the new number to beat

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

## The gates of section 1 as they stood before the rules of a round were changed

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

## What else the rig found, before the rules of a round were changed

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
- **Molecules grew without limit** (fixed: see the size limit above). A run reached 1,000 atoms (2,565 was seen before the cut). On such a molecule one look for the twist took 6.2 seconds and one link of a chain 0.3 to 0.7 seconds. The page calls the same functions, so the game will stall there too.
- **The old number for a carried round** played sixty simulated rounds each time the page of rounds was shown. The new number plays none.
- **The last page decides** 27% of the median player's passes from round 4 on. The target is 55%.
