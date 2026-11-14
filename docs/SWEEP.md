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

## 2. Sigils

In `docs/SIGILS2.md`: 25 sigils that each break one rule, alone, in pairs and with each homunculus; a ranked shortlist of twelve; and the last sigil that takes gold.

## 3. The ten homunculi

Each creature is fed inside a round by what `HOMUNCULI.md` names and can be tapped once a round. The simulated player taps it only where the task or the yield goes up. Every creature met exactly the same deals and tasks as the run with none, so a change of 0.00 means no run went differently. Two reagent sets: the starting six, and the six with reduce and hydroborate (which feed the wood spirit and the slime). 192 three-round runs, 96 six-round runs and 48 nine-round runs a creature.

| Creature | Fed, share of rounds | Tapped, share of rounds | Rounds cleared: three-round run | six | nine | Wins of 100: three, six, nine | Yield times, average | The line was chosen for it, share of pages |
|---|---|---|---|---|---|---|---|---|
| none | | | 2.36 | 2.28 | 2.46 | 57, 25, 8 | | |
| Seedling | 98 | 93 | 2.71 (+0.35) | 3.97 (+1.69) | 4.60 (+2.15) | 79, 54, 23 | 5.38 | 20.5 |
| Water | 68 | 41 | 2.34 (-0.02) | 2.40 (+0.11) | 2.48 (+0.02) | 55, 27, 8 | 1.05 | 7.7 |
| Acid | over 100 | 42 | 2.35 (-0.01) | 2.28 (0.00) | 2.35 (-0.10) | 56, 23, 6 | 1.09 | 9.3 |
| Hydrogen | 27 | 24 | 2.37 (+0.01) | 2.27 (-0.01) | 2.42 (-0.04) | 58, 24, 6 | 1.09 | 4.1 |
| Salt | 29 | 16 | 2.35 (-0.01) | 2.23 (-0.05) | 2.42 (-0.04) | 56, 22, 8 | 1.04 | 3.0 |
| Dry ice | 17 | 17 | 2.36 (0.00) | 2.10 (-0.18) | 2.23 (-0.23) | 57, 21, 8 | 0.99 | 0.9 |
| Ammonia | 11 | 7 | 2.36 (0.00) | 2.28 (0.00) | 2.46 (0.00) | 57, 25, 8 | 1.06 | 0.0 |
| Slime | 9 (18 with hydroborate carried, 0 without) | 9 | 2.36 (0.00) | 2.28 (0.00) | 2.46 (0.00) | 57, 25, 8 | 1.01 | 1.9 |
| Wood spirit | 9 (17 with reduce carried, 0 without) | 0 | 2.36 (0.00) | 2.28 (0.00) | 2.46 (0.00) | 57, 25, 8 | 1.00 | 0.0 |
| Brimstone | under 1 | 0 | 2.36 (0.00) | 2.28 (0.00) | 2.42 (-0.04) | 57, 25, 6 | 1.00 | 0.1 |

Pairs and triples (all 45 pairs and all 120 triples, six-round runs, 8 runs each):

- Every pair and triple with the Seedling clears about 3.9 rounds more than no creature. Every one without it clears about the same as no creature.
- No pair or triple did more than its members do alone, once the Seedling is counted.
- The biggest single round in any pair or triple was 58 times Par (Salt, Slime and Seedling). Nothing ran away.

What it says:

- **Dominant: the Seedling.** It is fed by one grow, which is in nearly every hand, so it is tapped in 93 of 100 rounds. It triples the nine-round win rate (8 to 23) and multiplies yield by 5. On one page in five the player chose a different line because of it. It is the only creature that changes which play is best in a big way, and it is the best pick in every pair and triple.
- **Dead as built: Brimstone and the Wood spirit.** Brimstone is almost never fed (it needs two sulfurs from oxidize on an SH, which the molecules and reagents rarely give). The Wood spirit is fed in 17 of 100 rounds when reduce is carried and is never worth tapping: five reagents in a random order never beat the three the player would choose.
- **Rare: Ammonia and Slime.** Fed in about one round in ten. When tapped they add a little yield and clear no more rounds.
- **Alive but weak: Water, Acid, Hydrogen, Salt.** Tapped in 16 to 42 of 100 rounds, yield up 4 to 9 percent, no more rounds cleared. Water and Acid do change the line chosen on 8 to 9 pages in 100.
- **Slightly harmful: Dry ice.** Freezing rings shut costs a fifth of a round in the longer runs: a shut ring cannot take part in the next chain.
- `HOMUNCULI.md` guessed 1.5 to 2.3 times the yield for each. Measured: 1.0 to 1.1 for nine of them and 5.4 for the Seedling.

The limits of this: the simulated player taps a creature only for a gain it can see at once. A real player who plans a round around a creature will get more from Salt, Slime and Dry ice than this shows.

Choices for the owner:

1. The Seedling. (a) Cut it down: 6 carbons with 2 C=O as it was first, or fed by 3 grows not 1. (b) Keep it strong and make it the slowest jar to fill. (c) Leave it.
2. The eight weak ones. (a) Make each about as strong as `HOMUNCULI.md` meant (1.5 to 2 times the yield), then test again. (b) Leave them small and make them cheap and early. (c) Mix: strong ones in slow jars, small ones in fast jars, as the jar speeds already suggest.
3. Brimstone and Ammonia, which are almost never fed. (a) Feed them from what the reagents make often (any sulfur or nitrogen put on the molecule). (b) Do as `HOMUNCULI.md` says and always deal a molecule that carries the group while the creature is held; this was not simulated. (c) Leave them rare on purpose.
4. The Wood spirit. (a) Give the drunk page something a chosen line cannot have: all five reagents and each one pays double. (b) Let it spend no uses. (c) Replace it.
5. Dry ice. (a) Frozen rings still count for the next chain. (b) Leave it as a creature for yield only and say so on the card.

## 4. Elements beyond C, H and O, by round

Ruling AF2: "Rarer elements should become more common as the rounds get deeper."

What the game deals today (its own table, measured on 1,000 deals a round): the share of dealt molecules that hold any element past C, H and O is 16 in 100 in round 1, 57 in round 5 and 95 in round 9. So the ruling is already met for N, S and Cl taken together.

Ten elements were each given one real reagent, and a reflex where one exists, and played for nine rounds by the player who reads every line: 36 runs a cell. The element's reagent took the place of reduce in a set of six. "Rising" deals the element to one of the two molecules offered more often each round (common: 25 to 65 in 100; uncommon: 8 to 50; rare: 2 to 34). "Level" deals it at the same average rate every round. N, S and Cl are in the game now. The rest are candidates and are in no build.

| Element | Its reagent | Its reflex | Reagent fired, share of the hands it was in | Reflex, share of all reflex steps | Molecule still holds it at the end of a round (rising deal) | Reflex steps a turn (none of it: 1.95) | Kinds of reflex a run (none: 10.6) |
|---|---|---|---|---|---|---|---|
| N | ritter | knit | 21 | 13 | 77 | 1.80 | 10.6 |
| S | thiolene | cap | 12 | 9 | 55 | 1.95 | 11.4 |
| Cl | chlorination | close | 21 | 13 | 33 | 1.82 | 10.4 |
| Br | hydrobromination | a ring closes on C-Br | 15 | 7 | 20 | 1.87 | 11.2 |
| P | phosphorylation | a cyclic phosphate closes | 32 | 19 | 65 | 1.87 | 10.7 |
| B | borylation | a cyclic boronic ester closes | 29 | 16 | 59 | 1.69 | 10.6 |
| I | iodocyclization | a ring closes on C-I | 12 | 2 | 5 | 1.92 | 10.8 |
| F | deoxyfluorination | none (C-F is inert) | 14 | 0 | 26 | 1.93 | 10.5 |
| Si | silylation | none (a protected OH) | 18 | 0 | 33 | 1.79 | 10.5 |
| Se | selenoxide elimination | none (makes C=C beside C=O) | 36 | 0 | 13 | 2.30 | 11.7 |

Rising against level deal: no difference that 36 runs can show in rounds cleared, chain length or kinds. The two give the same amount of the element over a run; rising only moves it later. So the choice between them is about feel, not balance.

By round, on the rising deal, the share of rounds whose final molecule holds the element:

| Element | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 |
|---|---|---|---|---|---|---|---|---|---|
| N | 61 | 61 | 69 | 61 | 81 | 89 | 86 | 92 | 89 |
| S | 44 | 31 | 50 | 39 | 58 | 69 | 69 | 64 | 72 |
| Cl | 36 | 14 | 28 | 28 | 33 | 39 | 47 | 31 | 39 |
| P | 64 | 58 | 64 | 53 | 61 | 69 | 72 | 72 | 67 |
| B | 58 | 56 | 58 | 58 | 53 | 67 | 50 | 61 | 67 |
| Br | 14 | 11 | 28 | 11 | 14 | 25 | 28 | 22 | 31 |
| F | 25 | 17 | 19 | 28 | 31 | 17 | 19 | 36 | 44 |
| Si | 31 | 53 | 31 | 25 | 28 | 31 | 28 | 39 | 31 |
| Se | 8 | 3 | 3 | 11 | 22 | 8 | 11 | 22 | 31 |
| I | 3 | 0 | 3 | 8 | 6 | 3 | 6 | 8 | 6 |

What it says:

- **Lively and worth building: phosphorus and boron.** Their reagents are fired in about 30 of 100 hands, and their ring-closing reflexes make 16 to 19 of every 100 reflex steps, more than N, S or Cl manage. Boron shortens chains a little (1.69 steps a turn against 1.95).
- **Strong, perhaps too strong: the selenium reagent.** It is fired most of all (36 of 100 hands), lengthens chains to 2.30 steps a turn and adds a kind of reflex a run. Rounds cleared rose by about 1.6 of 9 on all three deals. The selenium itself leaves at once, so the player never sees the element: it is a good reagent more than a new element.
- **Dead as built: iodine.** Its reflex is 2 in 100 steps at best and the molecule holds iodine at the end of 5 rounds in 100. The reagent needs a C=C with an OH just the right distance away, which is rare.
- **Quiet: fluorine and silicon.** No reflex. They cap an OH so it takes no more part. Fired in 14 to 18 of 100 hands. They are tools for a careful player, not fireworks.
- **Middling: bromine.** It does what chlorine does, less often.
- Rounds cleared differ between cells by up to 1.9 of 9, but with 36 runs and a different set of six in each cell, only selenium's gain is clear of chance.

Choices for the owner:

1. Which new elements to build. (a) Phosphorus and boron first: they do the most by themselves. (b) Also the selenium reagent, as a reagent. (c) Also fluorine and silicon as quiet "lock this OH" tools. (d) Also bromine and iodine for the look of them, knowing iodine needs a new reagent to matter.
2. When they appear. (a) As the game does now for N, S and Cl: a few in round 1, nearly every molecule by round 9. (b) In steps: N, S, Cl from round 1; P, B, Br from round 4; F, Si, Se, I from round 7. (c) Rare elements only on molecules the player chooses to take, for a reward.
3. Selenium. (a) Tone its reagent down (one place only). (b) Keep it strong and make it a late unlock. (c) Leave it out.

## 5. Every starting six of the 18 reagents

All 18,564 sets of six were played: three rounds, by the novice, the greedy player and the player who reads every line; 2 runs a set and player on 32 shared deals (111,384 runs, 967,653 turns, 20 minutes). Then the 40 best, 20 worst and 40 random sets by a straight-line fit, with the two sets the game has had, were played again on 60 new deals each.

All sets together:

| Player | Wins all three rounds | Clears rounds 1, 2, 3 | Kinds of reflex a run | Reflex steps a turn |
|---|---|---|---|---|
| Novice | 24 in 100 | 73, 72, 43 | 3.7 | 0.9 |
| Greedy | 49 | 90, 85, 64 | 4.0 | 1.1 |
| Reads every line | 70 | 95, 93, 79 | 4.2 | 1.4 |

Each reagent, over the 6,188 sets that hold it. Win columns: points of win rate a set gains by holding it, against the average reagent. "In the line": of the hands it was dealt in, the share where the careful player fired it.

| Reagent | Novice wins | Greedy wins | Careful wins | In the line | the same in the lowest and highest tenth of sets | Kinds a run | Steps a turn |
|---|---|---|---|---|---|---|---|
| grow | +7.9 | +8.0 | +12.3 | 72 | 50 to 93 | +0.18 | +0.41 |
| cyanohydrin | +4.4 | +3.7 | +0.7 | 47 | 23 to 71 | -0.27 | -0.27 |
| hydroformylation | +4.2 | +2.5 | +4.8 | 62 | 40 to 86 | +0.30 | +0.44 |
| oxidize | +3.1 | +3.0 | +1.8 | 62 | 38 to 86 | +0.20 | +0.20 |
| hwe | +2.6 | +2.4 | +3.9 | 61 | 33 to 88 | +0.52 | +0.45 |
| dihydroxylation | +2.3 | +1.8 | +1.8 | 55 | 33 to 77 | +0.59 | +0.14 |
| chlorination | +1.6 | +3.9 | +1.5 | 48 | 23 to 72 | -0.03 | -0.27 |
| epoxidation | 0.0 | -0.1 | -2.9 | 30 | 11 to 50 | -0.43 | -0.30 |
| hofmann | -0.3 | -0.1 | -2.5 | 42 | 15 to 71 | -0.24 | -0.15 |
| chugaev | -0.4 | -0.4 | -0.6 | 54 | 31 to 78 | +0.09 | -0.03 |
| permanganate | -1.2 | +1.0 | -1.1 | 46 | 23 to 69 | -0.60 | -0.38 |
| dehydrate | -1.8 | -1.6 | -2.1 | 52 | 31 to 77 | -0.02 | -0.08 |
| reduce | -2.9 | -1.7 | -3.3 | 38 | 14 to 64 | -0.27 | -0.19 |
| hydroborate | -2.9 | -3.8 | -2.4 | 43 | 20 to 69 | -0.23 | -0.15 |
| hydrate | -3.0 | -3.8 | -2.4 | 50 | 25 to 77 | -0.06 | 0.00 |
| ozonolysis | -4.2 | -5.7 | -1.4 | 64 | 43 to 86 | +0.54 | +0.61 |
| thiolene | -4.5 | -4.0 | -4.7 | 30 | 12 to 53 | -0.20 | -0.23 |
| ritter | -5.0 | -5.1 | -3.4 | 45 | 21 to 71 | -0.05 | -0.18 |

The picked sets on 60 new deals (wins in 100; the range is what chance allows):

| Set | Novice | Greedy | Careful | Kinds a run | Fired most, share of its hands |
|---|---|---|---|---|---|
| The six of a new game now: hydrate, oxidize, grow, thiolene, dehydrate, ritter | 10 (5 to 20) | 33 (23 to 46) | 65 (52 to 76) | 5.2 | hydrate 78 |
| The six before ruling AF: hydrate, hydroborate, dehydrate, oxidize, reduce, grow | 22 (13 to 34) | 55 (42 to 67) | 80 (68 to 88) | 5.2 | oxidize 83 |
| oxidize, grow, hwe, ozonolysis, chugaev, hydroformylation | 42 (30 to 54) | 72 (59 to 81) | 90 (80 to 95) | 5.7 | grow 88 |
| oxidize, grow, dihydroxylation, cyanohydrin, chugaev, hydroformylation | 42 (30 to 54) | 72 (59 to 81) | 98 (91 to 100) | 6.0 | grow 88 |
| grow, hwe, dihydroxylation, chlorination, chugaev, hydroformylation | 38 (27 to 51) | 67 (54 to 77) | 88 (78 to 94) | 6.2 | hydroformylation 63 |
| oxidize, grow, hwe, dihydroxylation, chlorination, chugaev | 37 (26 to 49) | 67 (54 to 77) | 80 (68 to 88) | 6.7 | dihydroxylation 83 |
| The 40 best by the fit, together | 28.5 | 63.0 | 87.1 | | |
| 40 sets at random, together | 19.0 | 49.6 | 71.1 | | |
| The 20 worst by the fit, together | 5.4 | 24.7 | 39.1 | | |
| Worst played: hydrate, hydroborate, reduce, ritter, thiolene, epoxidation | 0 (0 to 6) | 10 (5 to 20) | 10 (5 to 20) | 2.7 | reduce 61 |

Which reflexes the player sees, all sets: dry 27 in 100 steps, ring 23, weld 23, shift 9, tuck 5, knit 3, close 3, flip 3, snap 2, cap 1.

What it says:

- **Is one reagent always the best play? No, but grow comes closest.** It is fired in 72 of 100 hands it is dealt in, in 50 of 100 even in the sets that use it least and 93 in those that use it most, and a set with it wins 8 to 12 points more. No other reagent passes 64. Inside one set, though, a single reagent can rule: in the starting six hydrate is in 78 of 100 lines, and in the old six oxidize was in 83.
- **No reagent is dead.** The least used (thiolene and epoxidation, 30 of 100 hands) are still fired in 11 to 53 of 100 depending on the set.
- **The reagents that make a first game hard are the two added for nitrogen and sulfur.** Ritter and thiolene are the worst and third worst for the novice. The starting six that holds both is won by 10 novices in 100, against 22 for the six before them and 19 for a set taken at random. The game's own rig measured 10 in 100 for the same six.
- **The best sets win a novice 35 to 42 in 100** and show more kinds of reflex (5.7 to 6.7 a run against 5.2). They share grow, hwe, hydroformylation and dihydroxylation. None of them holds ritter or thiolene; the other elements come in through chlorination and cyanohydrin.
- **The set matters about as much as the player.** The 20 worst sets give the careful player 39 wins in 100; the 40 best give the novice 29.
- **Ring-closing is not all the player sees** (ruling AE): dry, ring and weld are each about a quarter of all steps. But knit, close and cap, the reflexes of N, Cl and S, are 3, 3 and 1 in 100. The other elements are on the molecules; they seldom do anything by themselves.
- The straight-line fit explains only 5 in 100 of the spread between sets at 2 runs a set, so the per-reagent numbers are averages over thousands of sets, not a way to score one set. The second stage on 60 deals is what to trust for a named set.

One more finding, from the homunculus runs: adding reduce and hydroborate to the starting six lowers the careful player's three-round wins from 71 to 42 in 100, because five are dealt from eight and the reagent wanted comes up less often. A bigger carried set is harder, not easier. (300 carried sets of eight were also played on rounds 4 to 6; the rows are kept, the table is not written up here.)

Choices for the owner:

1. The first game's six. (a) Keep the six with ritter and thiolene: nitrogen and sulfur from the first minute (ruling AF), a novice wins 10 in 100. (b) Swap ritter for chlorination and thiolene for cyanohydrin: still other elements, and by the fit about twice the novice wins (not yet played on 60 deals). (c) Take one of the top sets (for example oxidize, grow, hwe, dihydroxylation, chlorination, chugaev: most kinds of reflex, a novice wins 37 in 100) and bring N and S in by the molecules dealt. (d) Keep the six and ease rounds 1 to 3 instead.
2. Grow. (a) Leave it as the reagent every set wants. (b) Take a little off it (one place a turn, or a smaller piece). (c) Put it in every set on purpose and balance the rest around it.
3. Nitrogen and sulfur doing so little by themselves. (a) Widen knit and cap so they fire more. (b) Give ritter and thiolene more places to act. (c) Leave it and let the deal do the work.
4. Growing the carried set past six. (a) Deal more than five when more than six are carried. (b) Leave it: a bigger set is a real cost. (c) Let the player bench reagents before a round.

## Seventeenth measure, 2026-11-13: what was run

Everything on the deal as it stands (`RULE.elLate` read from `path.js`). Pools are 8 workers at below-normal priority (checked: the workers report the below-normal class). Results: `docs/RIG.md`, seventeenth.

| Experiment (`sweep_run.py <name> --arg ...`) | What | Read by |
|---|---|---|
| `sig17` `0,both,200`, `1,both,200` | none and each sigil alone, plain forms; trials of stronger forms (`sig17:<form>,both,100`) | `sweep_sig17.py worth`, `alone` |
| `sig17s` `1,both,200`, `2,both,60`, `3,both,20` | every set that holds Sulphur's Mask or Tetractys, in the stronger form | `sweep_sig17.py table`, `aqua`, `aquar` (buying, 20,000 runs laid together a row) |
| `sig17n` `2,both,60`, `3,both,20` | the other pairs and threes | the same |
| `sig17p`, `sig17q` with `SWEEP_P` | Solve with Ammonia, the two forms of the fix | `sweep_sig17.py big <experiment> <sets>` |
| `sig17m` | each sigil alone on six rounds | `sweep_sig17.py other` |
| `sig17k` | the same beside a kit of three instruments (not finished) | `sweep_sig17.py other` |
| `hom17` `now`, `s1`, `s5`, `run`, `cap3`, `m1` to `m3` | each creature at a stage of growth; one-job versions of three | `sweep_sig17.py grow` |
| `deed17` `b`, `none`, `plus`, `kit` | the deeds' pools again | `SWEEP_DEEDS=deed17 python sweep_deeds.py career`, `credit`, `jars`, `grow` |
| `final16` `<player>,1000,master` | six-round runs with nothing unlocked | counted in RIG.md, seventeenth, part 3 |

The wood spirit's and the slime's jars, three ways (`sweep_deeds.py jars`): as they are neither hatches in 300 runs; with jars of 15 and 25 the wood spirit hatches at about run 173 and the slime never; fed by a starting play too, the wood spirit at run 5 to 7 and the slime at run 25 to 70.

## Eighteenth measure, 2026-11-13: what was run

Results: `docs/RIG.md`, eighteenth. Pools of 8 workers at below-normal priority, one at a time.

| Experiment (`sweep_run.py hom18 --arg <player>,<runs>,<held beside it>,<spec;spec;...>`) | What | Read by |
|---|---|---|
| three grids, careful player, 100 runs a spec | each creature at five sizes of its number, as it was and with its job eased (`water@4.0~NEED=3`, `salt@2.56~MATCH=1`, `co2@1.48~NEEDC=0`, `slime@4.0~K2=4.0~OWN=0`, `seedling@3.24~GAIN=6~RISE=0`, `brimstone~MODE=1~LASTP=1~KB=1.96`, `ammonia~KN=1.69`) | `sweep_hom18.py` (every spec), `sweep_hom18.py fit` (the number at which a creature is worth 1.2 to 1.8) |
| `both,100,,` and `python sweep_hom18_specs.py stages` | the ten as fitted, at their five stages, both players on the same deals | `sweep_hom18_table.py stages` |
| `both,50,carousel+burette+crystal+sigil:gemini+sigil:clepsydra+sigil:via_humida,` and `python sweep_hom18_specs.py three` | a full kit with each creature at stage 3 and with none | `sweep_hom18_table.py kit` |
| the same specs with `SWEEP_SEED=r`, `both,200,,` | the ten at stage 3 and none on deals the numbers were not fitted on | `sweep_hom18_table.py fresh` |

A spec is a creature as `sweep_homs.make` reads it, with `~` for `/`. The simulator's own default numbers are still the seventeenth's; the eighteenth's are `sweep_hom18_specs.py` (`READ`: what the player reads at stages 1 to 5; the rules multiply by the square). New switches of a creature in `sweep_homs.py`: Water `NEED`, Dry ice `NEEDC`, Salt `MATCH` and `ANY`, Slime `OWN`, Seedling `GAIN` and `RISE`, Ammonia `KN`, Brimstone `LASTP` and `KB`. `sweep_deal18.py` lays the game's deal of a round (job `deal17.js`) beside the simulator's.

## Nineteenth measure, 2026-11-14: what was run

Results: `docs/RIG.md`, nineteenth. Pools of 8 workers at below-normal priority, one at a time. Everything is in `_sweep/hom19` (`sweep_run.py hom19`, the same jobs as `hom18`, kept apart).

| Experiment (`sweep_run.py hom19 --arg <player>,<runs>,<held beside it>,<spec;spec;...>`) | What | Read by |
|---|---|---|
| `median,100,,` and `python sweep_hom19_specs.py grid` | eight creatures tapped once a round (`~ONCE=1`) at six sizes of the number (x1.25 to x4.50 as read) | `sweep_hom18.py fit hom19` |
| `both,100,,` and `python sweep_hom19_specs.py stages`, `brim` | the ten as fitted at their five stages, both players; Brimstone at stage 3 once a run, once a round, and as it was | `sweep_hom18_table.py stages 19`, `sweep_hom18.py hom19` |
| `both,50,carousel+burette+crystal+sigil:gemini+sigil:clepsydra+sigil:via_humida,` and `python sweep_hom19_specs.py three`, then `five` | a full kit with each creature at stage 3 and with none; the same at stage 5 | `sweep_hom18_table.py kit 19`, `kit5 19` |
| `both,200,sig17:mask1_twice,none` (also `mask1_first`, `mask1_free`, `mask_r2`) | Sulphur's Mask cut to one rule, three ways, and the form as built | `sweep_hom18.py hom19` (the sets named `none&mask1_...`) |
| `both,200,,` and `both,50,<the kit>,` with `brimstone~MODE=1~LASTP=1~KB=1.9321~ONCE=1~ONCERUN=2` and `ONCERUN=3` | Brimstone with two and three fires a run | `sweep_hom18.py hom19` |

New switches in `sweep_homs.py`: every creature `ONCE` (1: one tap a round; path.js `RULE.homOnce`); Brimstone `ONCERUN` (n fires a run; path.js `RULE.brimOnce` is 1) and `WALL`. With `ONCERUN` the careful player saves the fire: he burns only on a round's last page when the round is lost without it, or from round 7 on any page where the task is unmet; the casual player burns the first time the fire clears a round. `sweep_homs.make('water*')` or `make('water*5')` builds a creature as the game has it today, at stage 3 or the stage given (`sweep_hom19_specs.py`: `READ` is `path.js` `HOMGROW.read`); the class defaults are still the seventeenth's so that older experiments play as they did. New forms in `sweep_sig17.py`: `mask1_twice`, `mask1_first`, `mask1_free`.

Game jobs (`bash .claude/headless/hlow.sh jobs/<job>.js <name> <seconds>`): `hom19.js` (creatures once a round, Brimstone once a run, the jars, Ammonia's limits, `P.motifAtoms` against the counts on 587 molecules, the twelve motif rows; it takes `hom18.js`'s place), `ref19.js` (the manual's wording checks and the book for `sweep_refdoc.py`; it takes `ref18.js`'s place), `run19.js` (whole runs with a creature at stages 2, 4 and 5 and Brimstone ending a round), `sig17.js` (two checks updated to the switches now on).
