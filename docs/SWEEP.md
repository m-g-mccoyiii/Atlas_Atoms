# Overreact: testing on every core

The whole game is played by a simulator in Python on RDKit (`docs/tools_chem/sweep_*.py`, `sigil2_*.py`), on 12 workers at once.
This page says how fast it is, how closely it agrees with the game, and what the sweeps found.

## Speed

### In short

| | Before | Now |
|---|---|---|
| 12 workers, turns a second | 1 to 3 | 100 to 250 on new ground; 336 and 810 on the two big jobs as the store filled |
| One core, molecules already met | 9 | 700 to 2,400 |
| The check against the game's rig (17,588 turns, four player models) | 3,411 seconds | 70 seconds |

RDKit does not run on the GPU and did not need to. The fault was in the design: the simulator did the same chemistry again and again, and the workers did not share what they had worked out.

### Why it was slow

One worker was profiled on 210 turns (cProfile, greedy player, nine-round runs, empty cache): 74 seconds, 2.8 turns a second.

| Where the time went | Share |
|---|---|
| The check, before every round, that the round's task can be reached (it plays up to 3 hidden rounds, 30 lines a page) | 88% |
| The turns the run is counted by | 12% |

| What the work was | Share |
|---|---|
| RDKit chemistry on a molecule not met before: reagent, reflexes, fold layout, score multipliers | 96% |
| The scorer itself (Python) | 4% |

So the scorer was never slow. Each turn that was reported dragged about 100 pieces of new chemistry with it, most of them inside the hidden check, at about 2.5 thousandths of a second each. Five faults made that worse:

1. A run was not repeatable. The hidden check used the run's own dice, so the same run played twice went two ways and the cache missed even on a replay.
2. The cache key carried the per-turn limits and the whole reflex list, so one molecule and reagent was worked out again under many keys.
3. The workers shared nothing while they ran. Each kept its own cache; they were merged only between waves, with a new pool of processes and a reload of a 47 MB file for every wave.
4. All twelve score multipliers and the fold layout were worked out for every new molecule, used or not.
5. The workers ran at low priority. When other programs filled the machine (this evening: headless browsers of another job, taking 10 to 18 threads) each worker got 2 to 4 percent of a core.

### What was changed, and what each change did

This machine: Ryzen with 8 cores and 16 threads, 64 GB. Greedy player, nine-round runs with the starting six, unless said.

| Step | One core, turns a second | 12 workers, turns a second |
|---|---|---|
| As found, machine choked (the old log) | 0.2 to 1.3 | 1 to 3 |
| As found, machine free, empty cache | 2.8 | not run |
| As found, the same runs played a second time | 8.6 | |
| Chemistry kept in three small parts (a reagent on a molecule; which reflexes fit a molecule; one reflex on a molecule), so limits and lists no longer split the cache. Only the multipliers in use are counted. Lines that start the same way share their first circles. | 5.4 | |
| The hidden check has its own dice: a run is the same every time | 5.4 new; 700 to 2,400 played again | |
| Fold layout only when both facing groups are on the molecule | no clear gain | |
| The hidden check stops as soon as a task that cannot be lost again is met | 11% less chemistry | |
| First try at sharing: every worker writes one sqlite file | | 52 to 64 for four minutes, then it choked: the write-ahead file grew to 690 MB and the workers waited 97% of the time |
| Sharing as built: each worker appends what it learns to its own log and reads the others' logs every 6 seconds; one process alone folds the logs into the sqlite file that all read. One pool for the whole job, small chunks, small rows back, normal priority. | | 84 over the first four minutes from an empty store, 157 by the end of them |
| The rig check (all four player models, three- and nine-round runs), store part full | 29 | 250 |
| The sweep of 25 sigils (median player, each sigil its own chemistry, so little is shared) | 10 | 119 |
| 60,000 bare runs for the win rate (three player models, up to 12 rounds) | 28 | 336 |
| Every starting six: 18,564 sets, three player models, 967,653 turns in 20 minutes | 68 | 810 |

### The target, and the floor

The target was 300 turns a second per core for the greedy player. It is met for molecules already in the store (700 to 2,400). It is not met on new ground, and this is the floor:

- One new (molecule, reagent) pair costs about 2 thousandths of a second: match, rewrite, sanitise, canonical SMILES, the reflex search, the fold, the multipliers. That is RDKit plus the game's reference chemistry in Python (`chemlib.py`, `engine.py`, `fold.py`, `traits.py`), which this work was not allowed to change.
- A nine-round game does not stay on old ground. By the third page of a late round nearly every molecule is new, and the hidden check alone looks at up to 270 lines a round.
- So on new ground a core does 7 to 30 reported turns a second (about 1,000 to 4,000 lines scored), and 12 workers do 100 to 250. Every pair is worked out once, by any worker, and then kept.

What a rewrite could still gain: the chemistry files written again on plain arrays instead of RDKit objects (perhaps 5 to 10 times on new ground), at the cost of proving the new code against the game again.

### Could a GPU help?

No, not as things stand. The machine has an RTX 5080, but neither PyTorch nor CuPy is installed, and RDKit's substructure matching, graph rewriting and sanitising run on the CPU only. A GPU version would mean writing the game's chemistry again as batched matrix code (its own pattern matcher, valence rules, canonical naming) and proving it gives the game's answers: weeks of work. The scorer, the only part that would move over easily, is already the fast part. Nothing was installed and no GPU version was built.

### Agreement with the game

Single steps, against the game's own recorded answers (`.claude/headless`):

| Check | Same as the game |
|---|---|
| One reagent on one molecule | 518 of 540 (96%) |
| A molecule left to react with itself to the end | 281 of 300 (94%) |
| A whole turn of three reagents: same reflexes in the same order | 143 of 150 (95%) |
| A whole turn: everything the same (places, reflexes, molecule after) | 126 of 150 (84%) |

These counts are the same before and after the speed work, case for case: the speed changes did not change one answer.

Whole runs, against the game's rig (`docs/RIG.md`, tenth measure; the same number of runs here; the deal as it was then, before the rising share of other elements was switched on). Percent of runs that clear each round, then wins:

| Run, player | The game | The simulator |
|---|---|---|
| Three rounds, novice (300 runs) | 72, 58, 30; wins 10.0% | 61, 56, 27; wins 8.3% |
| Three rounds, greedy | 78, 81, 48; wins 31.0% | 79, 80, 51; wins 33.3% |
| Three rounds, median | 93, 91, 75; wins 63.7% | 95, 95, 75; wins 68.0% |
| Nine rounds bare, novice (120 runs) | 30, 17, 54, 50, 58, 40, 42, 41, 36; wins 0 of 120 | 32, 13, 52, 57, 53, 46, 30, 29, 33; wins 0 of 120 |
| Nine rounds bare, greedy | 50, 39, 59, 68, 76, 55, 61, 54, 53; wins 2 of 120 | 52, 31, 78, 70, 68, 59, 73, 62, 56; wins 2 of 120 |
| Nine rounds bare, median | 74, 62, 79, 92, 96, 93, 88, 83, 82; wins 18 of 120 | 75, 60, 89, 84, 92, 85, 93, 83, 81; wins 20 of 120 |

The agreement figure: the clear rate of a round differs from the game's by 3 points on average in the three-round runs and 6 points in the nine-round runs. Chance alone moves a cell of 120 runs by about 9 points and a cell of 300 by about 5, so most cells are inside chance.

Where it does not agree:

- The novice's first round of three: 61 here, 72 in the game.
- The greedy player's rounds 3 and 7 of nine: 78 and 73 here, 59 and 61 in the game.
- One turn in six differs in some detail. The cause is known: "follows on" is tracked by atoms in the game and by a count of places here; and where two places tie, the game and RDKit number atoms in a different order.
- Not in the simulator: isotopes, rare versions of a reagent, instruments, the redraw, the shop between rounds, the family weights of the molecule draw.

Since 13 November the pool is held to 8 workers at below-normal priority, because the machine froze under 12 at normal priority. The numbers above were measured before that, with 12. With 8 low-priority workers expect about two thirds of them on a free machine, and far less while other programs fill it.

## 1. Can the bare game be won? (ruling: clearly under 2 in 100)

The starting six, no instrument, no creature, no sigil. Each run goes on until a round is not cleared, up to twelve rounds. Clearing nine is the nine-round run won; clearing twelve is the "postdoc" won (rounds 10 to 12 use round nine's molecules and tasks; the number to beat goes up 1.71 times a round). The deal is the game's as it stands, with the rising share of other elements. The same 20,000 deals for every player.

| Player | Runs | Clears rounds 1 to 3 | Clears 1 to 6 | Wins all nine | Wins all twelve |
|---|---|---|---|---|---|
| Novice (looks at 4 lines, picks a molecule at random) | 20,000 | 1.9% | 0.16% | 1 run (0.01%) | 0 |
| Greedy (looks at 12 lines) | 20,000 | 12.6% | 3.9% | 146 (0.73%; 0.62 to 0.86) | 26 (0.13%) |
| Median (reads every line of the hand) | 20,000 | 42.0% | 28.7% | 3,303 (16.5%; 16.0 to 17.0) | 1,852 (9.3%) |
| Planner (reads every line and the next hand) | 3,000 | 56.3% | 44.5% | 904 (30.1%; 28.5 to 31.8) | 621 (20.7%) |

Of the runs still alive, the share that clear each round:

| Player | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10 | R11 | R12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Novice | 33 | 10 | 55 | 44 | 47 | 41 | 31 | 3 of 10 | 1 of 3 | 1 of 1 | 0 of 1 | |
| Greedy | 56 | 31 | 74 | 65 | 73 | 64 | 58 | 55 | 60 | 51 | 63 | 55 |
| Median | 77 | 65 | 85 | 87 | 91 | 86 | 85 | 83 | 82 | 85 | 83 | 79 |
| Planner | 86 | 74 | 89 | 92 | 93 | 92 | 91 | 88 | 85 | 89 | 89 | 87 |

What it says:

- A new or casual player (novice, greedy) wins the bare nine rounds less than 1 time in 100. The ruling holds for them.
- A player who reads every line of every hand wins 16 in 100, and one who also reads the next hand wins 30 in 100. The ruling does not hold for them. The planner had 3,000 runs, not 20,000: it is the slowest player, and its rate is nowhere near the line, so more runs would not change the answer.
- The wall is round 2, for every player. Rounds 4 to 9 are easier than rounds 1 and 2 for the two careful players: once past round 3 the median player clears each later round 82 to 91 times in 100. Nine rounds at 85 each is still 23 in 100.
- The postdoc adds little: rounds 10 to 12 are cleared as often as round 9. Only the number to beat grows, and a run is won by the task, not by the number.
- How far to trust it: the simulator's median player won 20 of 120 where the game's own rig won 18 of 120 (see Agreement).

Choices for the owner:

1. Who the "under 2 in 100" is for. (a) The casual player: then nothing needs to change. (b) A player who reads every line: then rounds 4 to 9 must each be cleared about 65 times in 100, not 85. (c) Somewhere between: say which player and what rate.
2. If (b) or (c), how to make the late rounds harder. (a) Bigger task numbers in rounds 4 to 9. (b) Two tasks from round 4, not round 6. (c) The number to beat must also be passed to clear a round (today only the task counts).
3. Round 2. (a) Leave it as the wall. (b) Ease it so that the difficulty climbs round by round (today round 2 is harder than round 6 for every player).
4. The postdoc. (a) Keep it as three more rounds like round nine. (b) Give rounds 10 to 12 their own bigger molecules and tasks, since as built they hardly thin the field.

The sections that follow are added as each sweep is written up.
