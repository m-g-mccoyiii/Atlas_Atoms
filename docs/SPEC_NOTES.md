# Overreact: the spec in the game (for the page builder and whoever tunes it)

Written 2026-11-11 with the rules builder's port (`path.js`, the block "THE SPEC"). The list of specs themselves is data and is being revised (`docs/tools_chem/SPECS.md`); this page says what the code does, whatever the list.

## What the page gets

- `b.spec` on each molecule of the pair, and `run.spec` / `g.spec` in the round. `{ kind, n, mark, name, text, value, met, parts }`. `kind` and `mark` are the same: the name of the mark to draw. `n` is the number. `value` is the number so far, updated after every page (`g.spec`), `met` is true when every part has `value >= n`. From round 6 `parts` has two entries (each `{ name, n, mark, value, met }`); the top level is the first.
- `AA.rxPath.specValue(g, live)`, `specMet(g, live)`, `specParts(g, live)`: with `live` (the default) the page in play counts as it stands now; `false` counts finished pages only.
- `AA.rxPath.roundWon(g, run)`: the round is won when the spec is met, else (no spec on the round, or `RULE.spec` off) when the total reaches the number. The page still uses `g.total >= st.quota` in `scheme.js`; it should call `roundWon`. Yield stays: `runEarn` pays gold at the four marks whether or not the spec was met, and the words are lettered from the total as before. A round that does not meet its spec is lost.
- `P.fitsNow(g, id)` and `P.queueFits(g)` are all the page may know about a reagent before the line is fired. `queueView(g)` now reads the present only (no atoms marked, `fwd` null, a circle is `waste` only when its reagent fits nowhere on the molecule as it stands).

## The readings

`gain` (the best end-of-page value minus the start, never below 0), `loss`, `abs`, `last` (the last page), `range`. The molecule is read at the end of each page, before the loose rings open again, and the start is the dealt molecule with its loose rings open. Event specs read the record `g.rec`: for each page the circles (a reagent, whether it acted and where, the bank), the reflex steps each circle set off, the reflex steps in order, and what was driven off by kind (water, hydrogen, carbon dioxide, acid fumes, other).

## Marks

Existing marks used: `ring` (rings), `joined` (fused pairs, fused block), `cage` (bridgehead), `big` (growth), `size` (size swing), `kinds` (kinds of group at once), `water` (water driven off), `chain` (longest carbon chain). `few` is not used: it always means at most, and no kept spec is an at most.

New marks the page must draw (the name the table gives, with the spec): `ring5` five_rings, `ring6` six_rings, `islands` ring_systems, `spiro` spiro, `ring_o` ring_hetero, `ring_fill` ring_atoms, `ring_sizes` ring_sizes, `span` diameter, `fork` branch, `cut` cut_down, `keep_C=O` left_CO, `conjugated` conjugated, `double` double_bonds, `unsat` unsaturation, `hetero` hetero_atoms, `elements` elements (never offered today: nothing feeds it), `first` opener, `third` closer, `kinds_turn` kinds_in_turn, `three_feed` all_three_feed, `trigger` distinct_triggers, `self_ring` kind_ring, `self_snap` kind_snap, `off_all` off_total, `jar_hydrogen` off_hydrogen, `jar_carbon_dioxide` off_carbon_dioxide, `jars` many_jars, `puff` big_puff, `no_dead` no_dead_reaction, `acted` acted_total, `acted_kinds` distinct_acted, `deadline_off_all` by_two_off_total. `by_two_rings` shares `ring` with rings, so the page cannot say "by turn two"; give it its own mark if it is kept.

Until a mark is drawn, `drawHurdle` draws nothing for it (the number is not shown either). `g.spec.text` is plain words with the number in it, for a hover or the end screen.

## What the code does and where

| Piece | Where |
|---|---|
| Readers on a plain graph (rings by smallest set of smallest rings, fused, spiro, bridgehead, chain, diameter, branch points, alternating run, 12 kinds of group, double bonds, hetero) | `SX` in `path.js` (port of `hurdle_graph.py`); `P.spec.numbers(model)` |
| The record of a round, hooks | `specBegin` (end of `synBegin`), `specPage` (in `turn` and `synEnd`), runoff counted by kind in `g.tally.off_*` |
| The table of specs | `SPEC_TABLE` between `// SPEC TABLE BEGIN` and `// SPEC TABLE END`; written by `python docs/tools_spec_bake.py [--head] [table.json]` from `hurdle_table.json` and `hurdles.py`; each row `{ fam, text, read, key, mode, by, mark, need, good, sf }` |
| The generator | `P.specPick(molecule, round, carried, rnd, tier, hist, run)`: table mode; reach is checked by up to `SPEC_REACH.plays` (3) rounds played out by an aiming player on this molecule, 30 lines looked at a page. That is a bounded search by play, not the beam search of `hurdle_gen.py`. From round 6 two specs of different families, each at the square root of the target, no joint retuning |
| Aiming players | `P.specLine(g, rnd, look)`, `P.specPlay`; the rig gives every player this line when `RULE.spec` is on (`SPECLOOK` in `sim.js`: novice 4 lines, greedy 12, median and planner all) |

Not done: the offered spec is not checked against the points player (the Python generator refuses a spec the points player always clears); families open by run length follow `SPEC_FAMILY_TIER` with the run length as the tier number; handedness, twin atoms, loops and rising turns are not ported (held back in `HURDLES.md`).
