# Overreact: the spec in the game (for the page builder and whoever tunes it)

Written 2026-11-11 with the rules builder's port (`path.js`, the block "THE SPEC"). The list of specs themselves is data and is being revised (`docs/tools_chem/SPECS.md`); this page says what the code does, whatever the list.

## What the page gets

- `b.spec` on each molecule of the pair, and `run.spec` / `g.spec` in the round. `{ kind, n, mark, name, text, value, met, parts }`. `kind` and `mark` are the same: the name of the mark to draw. `n` is the number. `value` is the number so far, updated after every page (`g.spec`), `met` is true when every part has `value >= n`. From round 6 `parts` has two entries (each `{ name, n, mark, value, met }`); the top level is the first.
- `AA.rxPath.specValue(g, live)`, `specMet(g, live)`, `specParts(g, live)`: with `live` (the default) the page in play counts as it stands now; `false` counts finished pages only.
- `AA.rxPath.roundWon(g, run)`: the round is won when the spec is met, else (no spec on the round, or `RULE.spec` off) when the total reaches the number. The page still uses `g.total >= st.quota` in `scheme.js`; it should call `roundWon`. Yield stays: `runEarn` pays gold at the four marks whether or not the spec was met, and the words are lettered from the total as before. A round that does not meet its spec is lost.
- `P.fitsNow(g, id)` and `P.queueFits(g)` are all the page may know about a reagent before the line is fired. `queueView(g)` now reads the present only (no atoms marked, `fwd` null, a circle is `waste` only when its reagent fits nowhere on the molecule as it stands).

## The readings

`gain` (the best end-of-page value minus the start, never below 0), `loss` (the start minus the smallest), `lastgain` and `lastloss` (the same, read on the last page only: `end_CO`, `end_CC`, `finish_smaller`). The molecule is read at the end of each page, before the loose rings open again, and the start is the dealt molecule with its loose rings open. Event specs read the record `g.rec`: for each page the circles (a reagent, whether it acted and where, the bank), the reflex steps each circle set off, the reflex steps in order, and what was driven off by kind (water, hydrogen, carbon dioxide, acid fumes, other).

## Marks

The revised list (docs/tools_chem/SPECS.md): 24 specs and one rider, written into `SPEC_TABLE` by `python docs/tools_spec_bake.py`. A spec is an "at least N"; `text` has the number in it and `text1` is the singular for N = 1. Each row below: the mark name the page draws (`g.spec.mark`, one drawing for each), the spec name (`g.spec.name`), the plain condition, what the drawing shows, the family and plan, and the rounds it is offered in. Mark names are unique. The marks of the first list that are no longer used (`ring`, `joined`, `cage`, `big`, `size`, `kinds`, `water`, `chain`, `five_rings`, `spiro`, `span`, `unsat` as before, and the rest) can be dropped from the page.

| Mark | Spec | Condition | What the drawing shows | Family / plan | Rounds |
|---|---|---|---|---|---|
| `ring6` | `six_rings` | at least {N} more six-atom rings | a ring drawn with six dots | shape / rings | 6,8,9 |
| `ring_pair` | `fused_pairs` | at least {N} more rings sharing a side | two rings drawn with one side in common | shape / rings | 6,7 |
| `islands` | `ring_systems` | at least {N} more separate ring groups | ring clusters drawn apart from each other | shape / rings | 7,8 |
| `grow` | `growth` | at least {N} atoms bigger than the start | the start molecule with a larger one drawn after it | size / big | 1,2,3,4,5,6,7,8,9 |
| `fork` | `branch` | at least {N} more forks in the molecule | a tree that splits | size / big | 1,2,3,4,5,6,7,8,9 |
| `ladder_chain` | `longest_chain` | at least {N} longer chain than the start | a straight zigzag with a ruler along it | size / big | 1,2,3 |
| `cut` | `cut_down` | at least {N} atoms smaller than the start | the start molecule with a ghost outline of the atoms that went | size / small | 1,6,7,8,9 |
| `cut_end` | `finish_smaller` | at least {N} atoms smaller at the finish | the start molecule and a smaller one at the end of an arrow | size / small | 6,7,8 |
| `lean` | `lean_turns` | at least {N} turns ending smaller | three small boxes, each with a down arrow when the molecule got smaller | size / small | 1,4,5,6,7,8,9 |
| `groups` | `kinds_gain` | at least {N} more kinds of group | coloured tiles, one for each kind of group on the molecule | makeup / kinds | 7,8 |
| `hetero` | `hetero_atoms` | at least {N} more non-carbon atoms | the red and blue atoms circled | makeup / kinds | 1,2,3,4,5,6,7,8,9 |
| `double` | `double_bonds` | at least {N} more double bonds | double lines, one for each double bond | makeup / bonds | 1,2,3,4,5,6,7,8,9 |
| `conjugated` | `conjugated` | at least {N} more atoms in alternating bonds | a zigzag of single and double lines lit up end to end | makeup / bonds | 2,3,6,7 |
| `unsat` | `unsaturation` | at least {N} more rings and double bonds | ring outlines and double lines counted together | makeup / bonds | 1,2,3,4,5,6,7,8,9 |
| `keep_CO` | `end_CO` | at least {N} more C=O at the finish | the group drawn in a box that stays lit to the end of the round | makeup / keep | 1,2,3 |
| `keep_CC` | `end_CC` | at least {N} more C=C at the finish | the group drawn in a box that stays lit to the end of the round | makeup / keep | 4,5,6,7,8,9 |
| `first` | `opener` | at least {N} reflexes after the first reagent | a lit bolt after the first of three bottles | chain / chains | 3,4,5,6,7,8 |
| `third` | `closer` | at least {N} reflexes after the last reagent | a lit bolt after the third of three bottles | chain / chains | 6,7,8,9 |
| `self_ring` | `kind_ring` | at least {N} ring-closing reflexes | a chain being closed into a ring | chain / chains | 7,8,9 |
| `off_all` | `off_total` | at least {N} runoff over the round | jars filling with drops and bubbles | runoff / vent | 1,2,3,4,5,6,7,8 |
| `jar_hydrogen` | `off_hydrogen` | at least {N} hydrogen in the runoff | a jar of hydrogen | runoff / vent | 1,2,3,4,5,8,9 |
| `jar_carbon_dioxide` | `off_carbon_dioxide` | at least {N} carbon dioxide in the runoff | a jar of carbon dioxide | runoff / vent | 1,2,5 |
| `water_only` | `pure_water` | at least {N} more water than other runoff | a full water jar beside empty ones | runoff / pure | 4,5,6,7,8,9 |
| `gas_only` | `pure_gas` | at least {N} more gas than water | bubbles rising from a jar with no water in it | runoff / pure | 1,2,3 |
| `held` | `held_back` | at least {N} turns firing fewer than three | a turn with one empty slot | restraint / restraint | 6,7,8,9 |

`held` (held_back) is a rider: it is only ever the second spec of a pair, in rounds 6 to 9, N = 2, and the round must let a turn be fired with one or two reagents (a turn with one empty slot). Until a mark is drawn, `drawHurdle` draws nothing for it (the number is not shown either). `g.spec.text` is plain words with the number in it, for a hover or the end screen. `g.spec.parts[i].plan` and `.family` are given too.

## What the code does and where

| Piece | Where |
|---|---|
| Readers on a plain graph (rings by smallest set of smallest rings, fused, spiro, bridgehead, chain, diameter, branch points, alternating run, 12 kinds of group, double bonds, hetero) | `SX` in `path.js` (port of `hurdle_graph.py`); `P.spec.numbers(model)` |
| The record of a round, hooks | `specBegin` (end of `synBegin`), `specPage` (in `turn` and `synEnd`), runoff counted by kind in `g.tally.off_*` |
| The table of specs | `SPEC_TABLE` between `// SPEC TABLE BEGIN` and `// SPEC TABLE END`; written by `python docs/tools_spec_bake.py [--head] [table.json]` from `hurdle_table.json` and `hurdles.py`; each row `{ fam, text, read, key, mode, by, mark, need, good, sf }` |
| The generator | `P.specPick(molecule, round, carried, rnd, tier, hist, run)`: table mode; reach is checked by up to `SPEC_REACH.plays` (3) rounds played out by an aiming player on this molecule, 30 lines looked at a page. That is a bounded search by play, not the beam search of `hurdle_gen.py`. From round 6 two specs of different families, each at the square root of the target, no joint retuning |
| Aiming players | `P.specLine(g, rnd, look)`, `P.specPlay`; the rig gives every player this line when `RULE.spec` is on (`SPECLOOK` in `sim.js`: novice 4 lines, greedy 12, median and planner all) |

Not done: the offered spec is not checked against the points player (the Python generator refuses a spec the points player always clears); families open by run length follow `SPEC_FAMILY_TIER` with the run length as the tier number; handedness, twin atoms, loops and rising turns are not ported (held back in `HURDLES.md`).
