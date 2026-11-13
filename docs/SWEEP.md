# Overreact: testing on every core

The whole game is played by a simulator in Python on RDKit (`docs/tools_chem/sweep_*.py`, `sigil2_*.py`), on 12 workers at once.
This page says how fast it is, how closely it agrees with the game, and what the sweeps found.

## Speed

Status on 12 November, 20:30: the design fault is found and the first fixes are in and measured. The work goes on; this section is updated as it does.

### Why it was slow

One worker was profiled on 210 turns (cProfile, greedy player, nine-round runs, empty cache): 74 seconds, 2.8 turns a second.

| Where the time went | Share |
|---|---|
| The check, before every round, that the round's task can be reached (it plays up to 3 hidden rounds, 30 lines a page) | 88% |
| The real turns the run is counted by | 12% |

| What the work was | Share |
|---|---|
| RDKit chemistry on a molecule not seen before: reagent, reflexes, fold layout, score multipliers | 96% |
| The scorer itself (Python) | 4% |

So the simulator was not slow at scoring. It was doing about 100 pieces of new chemistry for every turn it reported, most of them inside the hidden check, at about 2.5 thousandths of a second each. Four things made that worse:

1. A run was not repeatable: the hidden check used the run's own dice, so a run played twice went two different ways and the cache missed even on a replay.
2. The cache key carried the per-turn limits and the full reflex list, so the same molecule and reagent was worked out again under many keys.
3. The 12 workers shared nothing while they ran. Each kept its own cache and they were merged only between waves, with a new pool of processes and a reload of a 47 MB pickle for every wave.
4. All twelve score multipliers and the fold layout were worked out for every new molecule, used or not.

### What was changed, and what each change did

Measured on this machine (Ryzen, 8 cores / 16 threads), greedy player, nine-round runs with the starting six, same seeds.

| Step | Turns a second, one core | Turns a second, 12 workers |
|---|---|---|
| As found, machine choked (the old log) | 0.2 to 1.3 | 1 to 3 |
| As found, machine free, empty cache | 2.8 | not run |
| As found, same runs played again | 8.6 | |
| Chemistry kept in three small parts (reagent on molecule; which reflexes fit a molecule; one reflex on a molecule), so limits and lists no longer split the cache. Only the multipliers in use are counted. Lines that start the same way share their first circles. | 5.4 | |
| The hidden check has its own dice, so a run is the same every time | 5.4 new, 700 to 2,400 played again | |
| Fold layout only when both facing groups are on the molecule | 4.8 to 5.4 (no clear gain) | |
| One sqlite store read and written by all workers as they go; one pool for the whole job; jobs sent in small chunks; small rows back | | 52 to 64 from an empty store |

In plain terms: 12 workers went from 1 to 3 turns a second to about 60 from an empty store, and a turn whose molecules are already in the store costs under a thousandth of a second (700 to 2,400 turns a second on one core).

### The target, and the floor

The target was 300 turns a second per core for the greedy player. It is met only for molecules already in the store. For molecules never seen before it is not met, and this is the floor:

- One new (molecule, reagent) pair costs about 2 thousandths of a second in RDKit and the game's Python chemistry: match, rewrite, sanitise, canonical SMILES, the reflex search, the fold layout, the multipliers. These files (`chemlib.py`, `engine.py`, `fold.py`, `traits.py`) are the game's reference chemistry and were not changed.
- One reported turn of the greedy player still drags about 100 new pairs with it on an empty store (40 when 12 workers share the store), nearly all inside the hidden check.
- So a cold core does 5 to 10 reported turns a second, which is about 800 lines scored and 2,400 reagent firings a second. The rate climbs as the store fills, because every pair is worked out once, ever, by any worker.

What is being done next about the floor: measure how fast the store fills on the big job (20,000 bare runs), and keep the hidden check's answers in the store too so each (molecule, task, rack) is proved once.

### Could a GPU help?

Not as things stand. This machine has an RTX 5080, but neither PyTorch nor CuPy is installed, and RDKit's substructure matching, graph rewriting and sanitising run on the CPU only. A GPU version would mean writing the game's chemistry again as batched matrix code (own pattern matcher, valence rules, canonical naming), then proving it gives the game's answers. That is weeks of work, and the part that is already fast (the scorer) is the only part that would move easily. The store gets the same result on the CPU: each molecule is paid for once.

### Agreement with the game (first check after the speed work)

The game's own recorded answers (headless runs, `.claude/headless`) against the fast simulator:

| Check | Same as the game |
|---|---|
| One reagent on one molecule | 518 of 540 (96%) |
| A molecule left to react with itself to the end | 281 of 300 (94%) |
| A whole turn of three reagents: same reflexes in the same order | 143 of 150 (95%) |
| A whole turn: everything the same (places, reflexes, molecule after) | 126 of 150 (84%) |

These are the same counts as before the speed work, case for case, so the speed changes did not change any answer. The comparison of whole-run results (clear rates and yields) is being run again and will be added here.
