# Overreact: the measuring rig

Built 2026-11-10. This is the rig `BALANCE.md` asks for: whole runs played with no page by four simulated players, from seeds, with every round logged. It is what section 1 of `PASS.md` is measured with.

## What it is

| Piece | Where | What it does |
|---|---|---|
| One source of chance | `path.js`: `seed(n)`, `rand()` | Every draw on the run path (dealing, heavy atoms, picks, rounds on offer, rare reagents, wishes, terms, assays, the intern) comes from it. `seed(n)` makes a run repeatable. `seed()` returns to the system's. The game is unseeded unless the page is opened with `?seed=N`. |
| The simulation | `.claude/sim.js`, versioned copy `docs/tools_sim.js` | `runSim(player, seed, opts)` plays a run of up to nine rounds: take one of three, choose the round, play the pages as the page plays them (the intern, the chain, the twist, water and hydrogen, the finishing reagent, the wish, the extinguisher), compare with the number to beat, stop on a miss or after round nine. |
| Assays | `path.js`: `runAssays`, `assayOf` | Rounds 3, 6 and 9 are one round of a harder kind (scarce, short, each, loose). The three kinds are drawn when the run starts. |
| Analysis | `docs/tools_rig.py`, `tools_fit.py`, `tools_molf.py`, `tools_bake.py` | Read the logs and print the tables below, fit the Par curve, compute the molecule factors, and write both into `path.js`. |

### The four players

| Player | On a page | Take one of three | Choose the round |
|---|---|---|---|
| novice | the biggest gain six times in ten, anything otherwise; may finish early | at random | at random |
| greedy | the biggest gain now (the player `MATRIX.md` was measured with) | equipment, then reagent, level, stronger, one more use | the first on the page |
| median | never breaks a row when it can be kept; looks three reactions ahead and takes the line that makes most; twists; spends water; finishes when that pays | the highest "in a build" worth from `MATRIX.md` | the easiest by what the kind and the molecule make over the number |
| planner | searches the page three deep, may break a row, counts what a charged page will add and what the row will multiply later; twists; spends water and hydrogen; wishes on assays; stops a chain on its last link with the extinguisher | worth in a build times the measured pair synergy with what is held, with the pact, idol and hourglass marked down by what they add to the number | as the median player |

Three worths are guesses, not measurements: a stronger reagent 1.3, one more use 1.1, a level half of the piece's worth above 1.

### What a round logs

`seed, player, round, mol, carry, family, kind, assay, gear (with levels), rack (with grades and uses), offered, took, number, par, mult, pages (the total after each page), total, pass, chain (longest chain), row (longest row), steps, atoms (largest molecule), cut, live`.

Not logged yet: what each source added to the total.

### Limits

- **Large molecules are cut.** The rules let a molecule grow without limit, and every reaction on a molecule of a thousand atoms takes seconds. A round is stopped once the molecule passes 600 atoms (or three times its starting size), and what it had made is its total. The log marks these rounds. A molecule left with more than 300 atoms is not carried into the next round. The look-ahead is cut to two reactions past 100 atoms and to one past 250, and the twist is not looked for past 150.
- **Speed.** A run takes about 0.15 s for the novice and greedy players, 0.8 s for the median player and 1.9 s for the planner, with eight tabs measuring at once. The planner is over the one second asked for. The time goes on large molecules, in the rules and not in the player.
- **All six suppliers are open** (`tier` 5) and the run's terms are plain. A new player's game, with one supplier and no equipment, is not what was measured.

## How to run it

The preview server serves the repository at `http://localhost:8766`; the frame server on port 8767 saves what the page posts into the scratchpad `frames` folder (start `recsrv.py` if nothing is listening).

1. Open `http://localhost:8766/.claude/rec.html?name=none&r=1`.
2. One run: `runSim('median', 7)` or, to go on after a miss, `runSim('median', 7, { all: true })`.
3. A measure in pieces of one browser call each: `await simChunk('tag', ['novice','greedy','median','planner'], 1, 500, 120000, { all: true }, 22000)`. Call it again with the same arguments until it answers `done`. Each call posts its rounds as file `f120000.jpg`, `f120001.jpg` and so on (JSON, whatever the name).
4. The same measure shared by eight tabs: open the page in eight tabs and call `simPart('tag', k, 120000, { all: true })` in tab k, for k from 0 to 7. Each answers at once and works on in pieces of five seconds; `simStat()` says how far it is. Part k posts from file `120000 + 1000 k`.
5. Tables: `python docs/tools_rig.py tag 120000 127999`.
6. Molecule factors: `await simMols('molf', 'median', 40, 110000, 0, 5)` and on through the 23 molecules five at a call, then `python docs/tools_molf.py 110000 molf.json`.
7. Par: `python docs/tools_fit.py tag 120000 127999 par.json`, then `python docs/tools_bake.py par.json molf.json` writes both tables into `path.js` and bumps its version.

Measures are made with `{ all: true }`: a run goes on after a miss, and the analysis stops each run at its first miss. Nothing in a run reads whether the last round was beaten, so this gives the same rounds as stopping, and it lets one measure be read against any Par curve.

## The game as it was: the old number to beat

500 runs for each player on seeds 1 to 500, at commit `6d03e4d`: the old table of 161 numbers, growth 1.75 a round to round 3 and 1.5 after. The round that carries the last molecule on was left out of this measure, because the old number for it was made by playing sixty rounds each time the page of rounds came up.

Pass rate by round, of the runs that reached it (how many reached it in brackets):

| Round | novice | target | greedy | median | target | planner | target |
|---|---|---|---|---|---|---|---|
| 1 | 50% (500) | 90% | 45% (500) | 82% (500) | 98% | 90% (500) | 99% |
| 2 | 43% (249) | 80% | 47% (225) | 83% (411) | 95% | 90% (451) | 99% |
| 3, assay | 45% (108) | 55% | 67% (105) | 67% (343) | 85% | 78% (405) | 97% |
| 4 | 33% (49) | 55% | 57% (70) | 84% (231) | 92% | 89% (317) | 98% |
| 5 | 38% (16) | 40% | 72% (40) | 84% (193) | 88% | 94% (282) | 95% |
| 6, assay | 50% (6) | 20% | 66% (29) | 85% (163) | 70% | 88% (265) | 90% |
| 7 | 33% (3) | 15% | 37% (19) | 88% (139) | 78% | 96% (232) | 90% |
| 8 | 0% (1) | 10% | 14% (7) | 93% (122) | 70% | 94% (222) | 85% |
| 9, assay | none reached | 5% | 0% (1) | 80% (114) | 50% | 95% (209) | 70% |

| Player | Runs | Rounds beaten at 10, 25, 50, 75, 90 percent | Mean | Target median | Wins | Passed by more than 5 times | Last page decided, round 4 on |
|---|---|---|---|---|---|---|---|
| novice | 500 | 0, 0, 0, 1, 2 | 0.9 | 3 | 0.0% | 37.0% of 432 | 42% |
| greedy | 500 | 0, 0, 0, 1, 3 | 1.0 |  | 0.0% | 34.5% of 496 | 51% |
| median | 500 | 0, 1, 2, 6, 9 | 3.6 | 6 | 18.2% | 60.4% of 1807 | 31% |
| planner | 500 | 1, 2, 5, 9, 9 | 5.2 | 9 | 39.8% | 77.0% of 2582 | 12% |

Median margin over the number, of the runs that reached the round:

| Round | novice | greedy | median | planner | target, median player |
|---|---|---|---|---|---|
| 1 | 0.98 | 0.84 | 4.66 | 6.72 | 3 |
| 2 | 0.74 | 0.95 | 5.01 | 11.76 | 2.5 |
| 3 | 0.93 | 1.85 | 2.28 | 6.48 | 1.6 |
| 4 | 0.31 | 1.54 | 7.84 | 21.31 | 2 |
| 5 | 0.78 | 3.00 | 8.07 | 38.24 | 1.8 |
| 6 | 8.09 | 2.16 | 4.49 | 20.61 | 1.4 |
| 7 | 0.55 | 0.37 | 10.23 | 81.58 | 1.5 |
| 8 | 0.91 | 0.09 | 14.33 | 87.72 | 1.3 |
| 9 |  | 0.01 | 5.54 | 31.39 | 1.2 |

- **The old number does not sort players by round.** It is hardest in round one (half of novice runs end there, and 18% of median runs) and gets easier: the median player passes round 8 more often than round 1.
- **Molecules in the same round** (median player, every molecule with at least eight plays): the easiest is beaten by 166 times more than the hardest in round 1, and by between 26 and 860 times in later rounds.
- **Six in ten rounds the median player passes are passed by more than five times.** The target is under 8%.
- Rounds cut short for size: novice 0.2%, greedy 0.2%, median 1.3%, planner 6.4%. Three of them were then counted as missed.
