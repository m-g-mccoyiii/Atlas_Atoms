# Overreact: sigils, tested

A sigil breaks or changes one rule for a whole run (ruling AN: "like carbons can have 5 bonds or other fun alchemy things"). Twenty-five were written as real rule changes in the simulator (`docs/tools_chem/sigil2_rules.py`) and played. The last sigil, our own yellow sign that takes gold, is `sigil2_last.py`. How the simulator was checked against the game is in `SWEEP.md`.

How to read the numbers. The player is the one who reads every line of the hand. "Cleared" is how many rounds in a row were cleared from the start of a run. Every sigil met the same deals as the run with no sigil. One caution: the tasks were not always the same between the two, so small differences in rounds cleared are noise. The "+-" says how much. Yield and the feel of play are steadier than rounds cleared.

## 1. Each sigil alone

Two reagent sets (the starting six; the six with reduce and hydroborate added). Three-round runs: 144 a sigil. Six-round runs: 72 a sigil.

| Sigil | The rule it changes | Three rounds: cleared (change) | Six rounds: cleared (change) | Wins of 100: three, six rounds | Yield times: middle round, average | Biggest round, times Par | Reflex steps a turn | Kinds of reflex a run |
|---|---|---|---|---|---|---|---|---|
| none | | 2.13 | 2.36 | 52, 24 | | 32 | 1.34 | 5.81 |
| Pansophia | The hand is every reagent carried | 2.92 (+0.78 +-0.21) | 4.76 (+2.40 +-0.88) | 92, 69 | 2.05, 2.54 | 195 | 1.87 | 6.29 |
| Phlogiston | Hydrogen is shown and can be taken | 2.52 (+0.39 +-0.17) | 3.18 (+0.82 +-0.50) | 74, 31 | 1.16, 1.50 | 71 | 1.53 | 6.36 |
| Clepsydra | A round has four pages | 2.31 (+0.18 +-0.12) | 2.75 (+0.39 +-0.47) | 61, 25 | 1.28, 1.35 | 69 | 1.19 | 6.26 |
| Via Humida | Distance is counted through any atom | 2.29 (+0.16 +-0.13) | 2.72 (+0.36 +-0.49) | 59, 32 | 1.00, 1.23 | 59 | 1.57 | 5.92 |
| Solve | No reflex has a limit a turn | 2.31 (+0.18 +-0.13) | 2.62 (+0.26 +-0.57) | 62, 26 | 1.40, 1.86 | 319 | 1.96 | 5.61 |
| Gemini | Every double bond counts twice | 2.21 (+0.08 +-0.14) | 2.58 (+0.22 +-0.51) | 58, 25 | 1.88, 1.82 | 60 | 1.37 | 5.97 |
| Rebis | A reagent fires twice | 2.26 (+0.13 +-0.15) | 2.53 (+0.17 +-0.61) | 59, 31 | 1.00, 1.01 | 38 | 1.36 | 5.94 |
| Respiratio | The limits a turn start again after every reagent | 2.31 (+0.17 +-0.14) | 2.50 (+0.14 +-0.48) | 60, 28 | 1.00, 1.20 | 82 | 1.54 | 5.75 |
| Renovatio | A repeated step pays in full | 2.18 (+0.05 +-0.14) | 2.46 (+0.10 +-0.38) | 57, 22 | 1.09, 1.13 | 40 | 1.39 | 5.95 |
| Multiplicatio | The first reflex of each kind in a round counts three times | 2.34 (+0.21 +-0.15) | 2.46 (+0.10 +-0.58) | 61, 22 | 46.6, 36.3 | 54,251 | 1.33 | 6.06 |
| Magnum Opus | The molecule may grow to 80 atoms, not 56 | 2.27 (+0.14 +-0.13) | 2.44 (+0.08 +-0.40) | 58, 21 | 1.00, 1.02 | 95 | 1.36 | 5.87 |
| Transmutation | Once a round one atom becomes the next element | 2.19 (+0.06 +-0.13) | 2.39 (+0.03 +-0.56) | 53, 25 | 1.00, 1.00 | 38 | 1.33 | 5.88 |
| Distillatio | Whatever comes off counts as a reflex step | 2.27 (+0.14 +-0.18) | 2.39 (+0.03 +-0.49) | 60, 22 | 6.98, 6.83 | 12,145 | 1.31 | 5.78 |
| Retrograde | Reflexes fire in reverse order | 2.35 (+0.22 +-0.16) | 2.38 (+0.01 +-0.47) | 58, 25 | 1.00, 0.89 | 28 | 1.24 | 5.69 |
| Hexad | The fold has rows of six, not eight | 2.17 (+0.04 +-0.13) | 2.28 (-0.08 +-0.42) | 52, 24 | 1.00, 0.98 | 30 | 1.32 | 5.99 |
| Ouroboros | A ring may close at any size | 2.28 (+0.15 +-0.14) | 2.26 (-0.10 +-0.37) | 58, 21 | 1.00, 1.04 | 41 | 1.38 | 5.91 |
| The Serpent | The fold works from round one and has no limit a turn | 2.13 (+0.00 +-0.13) | 2.26 (-0.10 +-0.56) | 51, 22 | 1.00, 0.89 | 42 | 1.25 | 6.00 |
| Tetractys | A line has four circles | 2.16 (+0.03 +-0.18) | 2.21 (-0.15 +-0.55) | 56, 21 | 1.01, 1.11 | 60 | 1.37 | 5.99 |
| Sulphur's Mask | Oxygen behaves as sulfur | 2.33 (+0.20 +-0.14) | 2.18 (-0.18 +-0.51) | 58, 21 | 1.00, 0.89 | 47 | 1.21 | 5.63 |
| Coniunctio | The double pay follows every reagent, not only the last | 2.22 (+0.08 +-0.14) | 2.15 (-0.21 +-0.50) | 56, 21 | 1.19, 1.25 | 37 | 1.38 | 5.95 |
| Coagula | A ring that closed stays closed | 1.93 (-0.20 +-0.16) | 2.04 (-0.32 +-0.55) | 44, 22 | 1.00, 0.77 | 31 | 1.10 | 5.56 |
| Aqua Permanens | Water never leaves | 2.49 (+0.36 +-0.18) | 2.00 (-0.36 +-0.61) | 70, 18 | 0.32, 0.34 | 11 | 0.83 | 3.84 |
| Alkahest | Two OH join by themselves | 2.20 (+0.07 +-0.16) | 1.99 (-0.38 +-0.65) | 51, 22 | 0.81, 0.64 | 25 | 1.14 | 5.58 |
| Quintessence | A carbon may hold five bonds | 2.12 (-0.01 +-0.15) | 1.78 (-0.58 +-0.50) | 51, 17 | 1.00, 0.77 | 41 | 1.12 | 5.61 |
| Mortificatio | Each reagent once a round; every reflex step pays double | 1.88 (-0.25 +-0.22) | 1.39 (-0.97 +-0.57) | 38, 11 | 0.58, 0.51 | 23 | 0.82 | 4.96 |

What it says:

- **Too strong: Pansophia.** Seeing every reagent every turn takes the luck out of the deal. Six-round wins go from 24 to 69 in 100.
- **Scoring broken: Multiplicatio and Distillatio.** Yield goes up 36 times and 7 times on average, with single rounds at 54,251 and 12,145 times Par. They do not change what the player does, only the number.
- **Does nothing a player would feel: Transmutation, Rebis, Hexad, Magnum Opus, Ouroboros.** Yield 0.98 to 1.04 times, same steps, same kinds. Rebis fires each reagent twice, but the second firing nearly always finds nothing left to change.
- **Hurts as written: Quintessence, Coagula, Alkahest, Mortificatio.** Quintessence is the owner's own example (a carbon with five bonds). As written the fifth bond keeps a ring shut for good, and a shut ring stops the chain: yield falls to 0.77. It needs a new form to be the fun one.
- **A real trade: Aqua Permanens.** Short runs get easier (70 wins in 100 against 52) and yield falls to a third. It also changes play the most of any sigil.
- **Good as they are: Phlogiston, Clepsydra, Via Humida, Solve, Respiratio, Gemini.** Each lifts something a player sees (longer chains, more kinds, a fourth page, bigger numbers) without breaking the score.

## 2. On other reagent sets, and with each homunculus

Each sigil on twelve other starting sixes (three rounds, 8 runs a set). Rounds cleared against the same set with no sigil:

| Sigil | Average change | Worst and best set | Sets it helps, of 12 |
|---|---|---|---|
| Pansophia | +0.36 | -0.12 to +1.12 | 9 |
| Aqua Permanens | +0.20 | -0.12 to +0.88 | 7 |
| Tetractys | +0.16 | -0.12 to +0.62 | 9 |
| Sulphur's Mask | +0.14 | -0.62 to +0.50 | 7 |
| Distillatio | +0.10 | -0.25 to +0.62 | 4 |
| Retrograde | +0.09 | -0.50 to +0.38 | 6 |
| Phlogiston | +0.06 | 0.00 to +0.38 | 2 |
| Hexad, Magnum Opus | 0.00 | 0.00 to 0.00 | 0 |
| Mortificatio | -0.14 | -0.38 to +0.38 | 3 |
| all others | -0.03 to +0.05 | | 1 to 6 |

Hexad and Magnum Opus changed nothing on any of the twelve sets in three rounds: the fold starts in round 4, and no molecule reaches 56 atoms that early.

With each of the ten homunculi (250 cells, four rounds, 4 runs a cell, so only big effects show):

- Only the Seedling changes a sigil's result. With any sigil, the cell with the Seedling clears 1 to 2 rounds more than the same sigil with any other creature. The other nine creatures leave each sigil where it was.
- Multiplicatio with the Seedling gave a round of 50,244 times Par. Multiplicatio with any creature gave 566 to 1,132 times Par.
- Nothing else broke.

## 3. Pairs of sigils

All 300 pairs, starting six, rounds 1 to 4, 12 runs a pair (3,600 runs). With no sigil the same 12 deals clear 2.50 rounds of 4. Twelve runs show only big effects: a pair has to move by about 0.8 of a round to be clear of chance.

| What was asked | Answer |
|---|---|
| Pairs that clear the most | The top ten all hold Pansophia: +0.8 to +1.3 rounds of 4. Solve with Pansophia is first (+1.33, 92 wins in 100, a round of 294 times Par). |
| The best without Pansophia | Phlogiston with Via Humida (+0.58), Clepsydra with Via Humida (+0.50), Phlogiston with Tetractys (+0.33). None is clear of chance. |
| A sigil's average over the 24 pairs it is in | Pansophia +0.69, Phlogiston +0.08, Clepsydra +0.04. Every other sigil -0.2 to -0.5, which is the noise of the 12 deals. Coagula -1.11, Mortificatio -0.90, Alkahest -0.75, Quintessence -0.71. |
| Pairs that clear the least | All eight at the bottom hold Coagula (-1.5 to -1.6 rounds). A ring that stays shut blocks whatever the other sigil adds. |
| Pairs that do more together than apart | Only pairs with Mortificatio, and only because it is so bad alone: Pansophia undoes its limit of one use (+1.25 together, against -1.67 for Mortificatio alone). No pair of two good sigils did clearly more than the two added. |
| Runaway numbers | The ten biggest rounds all hold Multiplicatio or Distillatio: Multiplicatio with The Serpent 140,094 times Par, with Distillatio 127,081, with Hexad 34,094; Solve with Distillatio 21,131. |
| Biggest round with neither of those two | Rebis with Solve: 1,173 times Par. Then Solve with The Serpent 664, with Gemini 580, with Renovatio 406. Solve is in all of them: with no limit a turn, anything that adds steps stacks on it. |

What it says for the shortlist:

- Two sigils held together do not break the game unless one of them is Multiplicatio, Distillatio or Pansophia. The other nine of the shortlist can be mixed freely.
- Solve is the one to watch in pairs. It is the source of every big round that is not a scoring bug, which is what it is for, but with Rebis it reached 1,173 times Par.
- Coagula should not be offered as it is: it spoils every pair.

## 4. The ranked shortlist of twelve

Ranked by: the player can feel it, it changes what is worth doing, it does not break the score, and it does not win the run alone.

| Rank | Sigil | Why | What it needs first |
|---|---|---|---|
| 1 | Phlogiston (hydrogen can be taken) | Best all-round: more rounds cleared, longer chains, most kinds of reflex | nothing |
| 2 | Clepsydra (a fourth page) | Simple to understand, steady gain, more variety | nothing |
| 3 | Via Humida (distance through any atom) | Rings close through O, N and S: chains 17% longer, makes the other elements matter | nothing |
| 4 | Solve (no limit a turn) | The longest chains (1.96 steps a turn) and the rare huge round (319 times Par): the "overreact" sigil | nothing |
| 5 | Aqua Permanens (water never leaves) | The one true trade: easier tasks, a third of the yield, and play changes most | nothing |
| 6 | Tetractys (a fourth circle) | Helps 9 of 12 reagent sets; a clear thing to do every turn | nothing |
| 7 | Respiratio (limits restart after each reagent) | Longer chains with no runaway; rewards ordering the line | nothing |
| 8 | Gemini (double bonds count twice) | Makes one kind of molecule worth chasing; yield 1.8 times | nothing |
| 9 | Sulphur's Mask (oxygen behaves as sulfur) | Changes the chemistry itself; helps 7 of 12 sets and hurts some: a gamble | nothing |
| 10 | Pansophia (the whole rack in hand) | Players will love it; far too strong | a cost: for example one use fewer of each reagent, or only from round 4 |
| 11 | Distillatio (what comes off counts as a step) | The only sigil that makes run-off the goal | a cap: each page counts at most 3 things off |
| 12 | Quintessence (a carbon with five bonds) | The owner's own example and the best name | a new form: the fifth bond should let the ring close and the chain go on, not shut the ring for good |

Left out: Multiplicatio (breaks the score and changes nothing else), Coniunctio and Renovatio (small yield gains, not felt), Retrograde, Hexad, The Serpent, Ouroboros, Magnum Opus, Transmutation, Rebis (nothing a player would notice), Coagula, Alkahest, Mortificatio (only hurt).

## 5. The last sigil: our own yellow sign

The three concepts of `docs/NOTES_WRITING.md` (the Open Crown, the Mask, the Tatters) and two more from the lead's list (the Pledge, the Second Act), each with one or more ways of using it. Starting six. Gold is earned as in the game: one for each of the 2, 4 and 8 times marks a round's yield passes, plus interest.

The player who reads every line. Six-round runs: 60 a row. Nine-round runs: 48 a row.

| Version, how it is used | Six rounds: cleared | wins of 100 | Nine rounds: cleared | wins of 100 | Runs that used it | Gold given up a run | Gold left (nine rounds) |
|---|---|---|---|---|---|---|---|
| no sigil | 3.50 | 45 | 4.58 | 23 | | | 12.2 |
| The Mask, only when the task needs it | 3.90 | 53 | 5.12 | 35 | 85% | 5.1 | 5.2 |
| The Mask, the same but never paying the second time | 3.90 | 53 | 5.17 | 38 | 85% | 3.4 | 6.5 |
| The Mask, whenever it helps at all | 3.82 | 50 | 4.79 | 29 | 100% | 6.2 | 1.6 |
| The Second Act (pay to fire the page again), only when needed | 3.92 | 53 | 5.29 | 31 | 48% | 1.3 | 10.8 |
| The Second Act, whenever it helps | 3.83 | 52 | 5.04 | 27 | 100% | 6.0 | 2.7 |
| The Open Crown, only when needed | 3.67 | 48 | 4.52 | 19 | 69% | 1.3 | 9.9 |
| The Open Crown, whenever it helps | 3.15 | 30 | 3.42 | 10 | 100% | 4.9 | 3.3 |
| The Pledge, debt of 3 | 3.48 | 33 | 4.48 | 19 | 100% | 3.0 | 9.1 |
| The Pledge, debt of 6 | 3.48 | 13 | 4.48 | 10 | 100% | 5.4 | 5.1 |
| The Tatters, tearing from round 4 | 3.78 | 42 | 3.81 | 4 | 100% | 5.5 | 3.9 |
| The Tatters, tearing as early as it can | 3.48 | 35 | 3.35 | 4 | 100% | 5.4 | 4.2 |

With 48 to 60 runs a row, a difference of 10 wins in 100 is about the size of chance. The big gaps are real; the small ones are not settled.

What it says:

- **The Mask works as written.** Nine-round wins go from 23 to 35 in 100, and it costs about half the gold a run earns. That is a real trade: the gold would have bought instruments.
- **The Mask's second payment is not a choice.** Never paying it won as often (38 against 35) and kept more gold. Clearing a round depends on the task, not the yield, so losing half the yield costs almost nothing. For the choice to bite, yield has to matter more, or the unpaid mask has to take something else.
- **The Open Crown loses as written.** Used with care it changes nothing (19 against 23). Used freely it halves the wins (10), because every use that does not end in OVERREACT raises the next task.
- **The Tatters is a trap as written.** Nine-round wins fall from 23 to 4 in 100 however it is used. Each tear raises every later task by a tenth, and a fourth circle or a full hand is not worth that.
- **The Second Act is the best value** (31 wins for 1.3 gold) and the simplest. It is not one of the three concepts.
- **Only a strong player can use any of them.** The casual player ends a nine-round run with 2.5 gold and clears no more rounds with any version. Gold comes from passing the 2, 4 and 8 times marks, and only a player who is already winning passes them.

## Choices for the owner

1. The twelve. (a) Take the shortlist as ranked. (b) Take the nine that need nothing and hold Pansophia, Distillatio and Quintessence until they are reworked. (c) Name any you want in or out.
2. Quintessence, the carbon with five bonds. (a) Rework it so the ring closes and the chain goes on. (b) Keep it as a risky sigil that shuts rings for good. (c) Drop it.
3. Pansophia. (a) Give it a cost and keep it. (b) Make it the rare prize sigil, as strong as it is. (c) Drop it.
4. Multiplicatio and Distillatio, the two that blow up the number. (a) Cap them. (b) Keep one uncapped on purpose as the "big number" sigil. (c) Drop both.
5. The last sigil. (a) The Mask, with the second payment changed so it is a real choice. (b) The Tatters, with the rise in later tasks taken out or made smaller, since as written it always loses. (c) The Open Crown, with the penalty softened. (d) The Second Act, the plain one that tested best.
6. Who the last sigil is for. (a) Leave it as a thing only strong players can afford. (b) Give every player some gold to spend on it, for example gold for each round cleared.
