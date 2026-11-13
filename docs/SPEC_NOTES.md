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

## Lines that show many kinds

Found headless (job `.claude/headless/jobs/lines.js`) with a new game's seven reflexes held (ring, dry, weld, shift, tuck, flip, snap), on molecules of the game's table. Each row: the molecule, a line of three of the six starters fired in order, and the reflex steps of the one overreaction in order (the kinds are the names in the round record `g.rec.pages[i].steps[j].kind`, with `join` the two atom ids and `via` 'chain'; the first-kind-seen order is the third column).

| Molecule | Line of three | Steps in order | Kinds |
|---|---|---|---|
| `CC(C)(O)CCC(=O)CCC(O)CCC(=O)CCC=C` | hydrate, reduce, hydroborate | weld, dry, tuck, ring | 4 |
| `C=CCCC(=O)CCC(=O)CCCCCC(O)CCC(=O)C` | hydroborate, oxidize, oxidize | weld, dry, tuck, ring | 4 |
| `OC1(CCCC1)CCC(=O)CCCC=O` | grow, oxidize, dehydrate | dry, tuck, weld, ring | 4 |
| `O=CCCC(=O)CCC1(O)CCCC1` | grow, oxidize, grow | dry, tuck, weld, ring | 4 |
| `CC(C)(O)C=CC=CCCCC=CC(=O)CCC(=O)C` | dehydrate, grow, dehydrate | weld, dry, snap, snap | 3 |
| `O=CCCC(=O)CCC(O)CCCCCC(=O)CCC(=O)C` | oxidize, oxidize, hydrate | weld, dry, weld, ring | 3 |
| `CC(=O)CCC(=O)CCC(O)CCCCCC(=O)CCC(=O)C` | dehydrate, hydrate, oxidize | weld, dry, weld, ring | 3 |
| `OC1(CCCCC1)CCC(=O)CCCCCC(=O)CCC(=O)C` | dehydrate, grow, dehydrate | weld, dry, snap, snap | 3 |
| `CC(C)(O)CCC(O)CCC(O)CCCCCC(O)CCC(=O)C` | oxidize, hydrate, dehydrate | weld, dry, tuck, weld | 3 |
| `OCCCC(O)CCC(O)CCC(O)CCCCCC(=O)CCC(=O)C` | oxidize, oxidize, hydrate | weld, dry, weld, ring | 3 |

## Nitrogen, sulfur, chlorine and the thirteen reflex kinds (for the page and art builders)

**Atoms.** N, S and Cl are in the molecule model (valence N 3, S 2, Cl 1; SMILES in and out). The page needs a color and a label for each: N blue-violet with `N`, S yellow with `S`, Cl green with `Cl` (`AA.ELEMENTS` already holds `color`: N #4f7cff, S #ffd23f, Cl #37d67a). Groups that now occur: NH2 (amine), SH (thiol), Cl on carbon, COOH, epoxide (three-ring with O), ring N (NH in a ring) and ring S. A new game's first three rounds deal molecules that hold N, S or Cl (interim table `FEED_HET` in path.js).

**Runoff kinds** (`g.tally.off_<kind>`, `g.rec.pages[i].off`): water, hydrogen, carbon_dioxide, acid_fumes (SO2 and HCl from chlorination and close), ammonia (cyanohydrin), sulfur (chugaev), trimethylamine (hofmann; it comes with water). A leaving group carries `.off` = `{kind: amount}`; the jar names for the page are those.

**The step record.** Each reflex step in `g.trail` and `g.rec.pages[i].steps[j]` carries `kind` (one of the thirteen below), `join` (the ids of the two anchor atoms it joined) and `via` ('chain'; 'fold' is reserved for the across steps, not built).

**What each kind's picture must show** (atoms that join or part):
- ring: the O of an OH reaches the carbon of a C=O; a ring closes; the C=O oxygen becomes an OH (it opens again at the page turn).
- dry: an OH two carbons from a C=O parts as water; a C=C appears beside the C=O.
- weld: the carbon beside one C=O joins the carbon of a second C=O four or five carbons away; a ring closes; the second C=O becomes an OH.
- shift: a C=C two carbons from a C=O slides one place toward it; no atom joins or parts.
- tuck: an OH oxygen joins the far carbon of a C=C that sits beside a C=O; the C=C becomes single; a ring ether closes.
- flip: an OH on a C=C carbon becomes a C=O; the C=C goes single; the H moves to the other carbon.
- snap: two C=C side by side and a third C=C close a six-ring; one C=C is left between the two middle carbons.
- knit: an NH2 nitrogen joins the carbon of a C=O three or four carbons away; a ring with N closes; the C=O becomes an OH (loose).
- cap: an SH sulfur joins the carbon of a C=O three or four carbons away; a ring with S closes; the C=O becomes an OH (loose).
- close: a Cl parts (acid fumes) and an OH, NH2, SH or COOH joins that carbon; a ring of 5 to 7 closes.
- seal: a COOH and an OH, NH2 or SH join into a ring (lactone, lactam, thiolactone); the acid OH parts as water.
- open: an OH oxygen joins one epoxide carbon, the epoxide opens, its oxygen stays as an OH on the other carbon; a ring ether closes.
- fold: an epoxide with carbon on both ends turns into a C=O; the O stays on one carbon, an H moves to the other.

## What a step really did (for the page builders), 2026-11-12

Every step in `g.trail`, and so every reflex step `g.rec.pages[i].steps[j]` and every circle `g.rec.pages[i].circ[k]`, carries the bonds as they changed. They are read off the molecule before and after the step (`P.bondDiff`), not from the place's anchor atoms, so they cannot disagree with the molecule. `join` is unchanged and is still only the two anchor atoms.

| Field | Entries | Meaning |
|---|---|---|
| `made` | `{ a, b, order, fromA, fromB, elA, elB }` | a bond that was not there before |
| `broken` | the same | a bond that is gone |
| `changed` | the same plus `was` | a bond whose order changed, `was` to `order` |
| `left` | `{ id, from, el }` | an atom that left the molecule |
| `added` | `{ id, el }` | an atom the reagent brought in |
| `moved` | `{ from, to, el }` | a hydrogen that went from one atom to another inside the molecule. It is not in `left` or `added` |
| `off` | `{ kind, atoms }` | what the game counts for a jar in this step, and the elements of the group that carried it |

`a` and `b` are atom ids in the molecule after the step; `fromA` and `fromB` are the same atoms' ids before it (null for an atom the step added); an end that left has a null id after the step unless the molecule still carries it while it lifts. Bonds to hydrogen are listed too; skip entries with `elA` or `elB` equal to `H` if they are not drawn.

What leaves the molecule and what the jar counts are not always the same atoms, because part of what comes off was the reagent's:
- oxidize on a chain-end C=C: the end carbon and its two hydrogens leave the molecule (`left` C, H, H). The carbon dioxide counted is that carbon with two oxygens from the oxidant; those oxygens were never on the molecule.
- Chugaev: an O and two H leave the molecule. The sulfur counted comes from the reagent (carbon disulfide and methyl iodide go in, the O leaves inside a sulfur-bearing fragment). Draw the O leaving with a yellow S from the bottle, not the O turning yellow.
- cyanohydrin: nothing leaves the molecule; a carbon, an oxygen and hydrogens are added. The ammonia counted is the reagent's nitrogen.
- ring, knit, cap, weld, tuck, shift, flip: no atom leaves. One hydrogen moves (`moved`).
- dry, link, seal and dehydrate: water (`left` H, H, O). close: Cl and H. bridge: two H.
- weld, snap and stitch are the only reflexes that make a carbon to carbon bond (checked on every step played by `stepdiff.js`).

Test: `.claude/headless/jobs/stepdiff.js` (copy in `docs/tools_jobs/`). It replays each record on the bonds before the step and compares with the bonds after it.

## Elements other than C, H, O in the deal (ruling AF2)

`RULE.hetCurve` (on): the share of dealt molecules holding an element other than C, H and O, by round: 0.15, 0.22, 0.30, 0.40, 0.55, 0.70, 0.80, 0.90, 0.95. `runBriefs` first decides for each molecule whether it is one, then takes it from the family drawn if that family has one for the round, else from any family of the round. Set it to null for the plain deal.
