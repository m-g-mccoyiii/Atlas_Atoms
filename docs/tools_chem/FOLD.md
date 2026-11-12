# Close across the fold: the rule, what it does, and what a new game should hold

Written 12 November 2026 for the owner's rulings AD, AE and AF (docs/HARNESS.md). Code: `docs/tools_chem/fold.py` (the fold, the facing pairs, twelve across reflexes, the engine that carries them, `python fold.py test`). Nothing existing was edited. All numbers below come from RDKit and the engine of this folder.

How the numbers were made. Molecules: the game's 77 (`molecules.deal_molecule`, as the game deals them) and 400 per round of the new generator (`mol2_generator.deal`, which carries N, S, Cl, acid groups, benzene, fused rings, cages). Reagents: the six in rounds 1 to 3, six plus ozonolysis and dihydroxylation in 4 to 6, six plus epoxidation and Ritter in 7 to 9. Reflexes held: ring and dry in rounds 1 to 3, the first seven in 4 to 6, all thirteen in 7 to 9. "Without the rule" is the same hand, the same molecule and the same seed with no across reflex held; "with" adds the across twin of every held reflex that has one, plus bridge, stitch and link. 300 rounds per stage for the greedy player (100 per round number), 120 per stage for the look-ahead player in stages 2 and 3 (look-ahead is slow; the last mol2 stage-3 cells hold 20 to 40 rounds, treat them as rough). Expect 3 to 4 points of noise on a share.

## The rule in ten plain lines

1. A molecule is drawn as one snake: the longest unbroken line of atoms, laid in rows of 8 atoms, left to right, then right to left, and so on. Each turn is one short bond straight across.
2. The snake starts at the end the molecule was first drawn from, and keeps that end for the whole round, so nothing already drawn moves when the far end grows or shrinks.
3. At a fork the snake follows the longer way. A ring of 8 atoms or fewer is drawn whole and sits in the line; it is never split across a turn. Short arms (up to 3 atoms) are groups; long arms and side rings hang on the outside.
4. A last row of 2 atoms or fewer is not turned: it runs on straight.
5. Two groups face each other when their atoms are in neighbouring rows and no more than one place apart (straight across, or one to either side).
6. Facing groups that are 6 or more bonds apart along the molecule can change each other. Nearer than that, the old rules already reach them.
7. A change across the fold joins them with a new bond. That makes a big ring, a loop of 8 or more atoms, in place of a small one.
8. A bond made across the fold is remembered as a rung. The drawing leaves rungs out, so a loop does not move the molecule. A new loop never re-folds what is already drawn.
9. Across changes happen last in a chain: only after everything close along the chain has settled, and at most once per kind per turn.
10. Only one thing moves the drawing: a change in the length of the line itself (an atom added or cut in the middle). Everything after that atom slides along; everything before it stays.

## 1. The fold

### 1.1 Three ways to set the row length and the turn

| | Rule | Folded molecules (game's, round 1 to 3 / 4 to 6 / 7 to 9) | How much moves when one atom is added in the middle / at the far end / a loop closes | Verdict |
|---|---|---|---|---|
| A | Rows of 8 from the anchor, last row of 2 or fewer runs on | 66-70% / 80-100% / 100% (3 rows or more: 0 / 0-15% / 97-100%) | 42% of atoms / 0% / 1% | picked |
| B | Rows of 10, same turn | 7-19% / 41-100% / 100% | 41% / 0% / 2% | no across steps at all before round 4 (0% of dealt molecules have a facing pair), and never 3 rows before round 7 |
| C | Rows balanced: rows = atoms divided by 12, every row the same length | 0-4% / 15-84% / 100% | 49% / 24% / 1% | worse: adding or cutting an atom at the far end moves 24% to 33% of all atoms and half of all edits move more than half the molecule |

Why A. It is the only one of the three where growing or shrinking the far end moves nothing (0%) and cutting off the far two atoms moves 4%. B and C start the fold too late or reflow everything. The one case that cannot be helped is an atom added or cut in the middle: every atom after it slides by one place (42% of atoms, and facing pairs after it change). That is the planning lever of section 4, not a flaw. The row length also sets which loop sizes appear: with 8 atoms in a row, facing pairs are 6 to 15 bonds apart, so loops of 8 to 17 atoms.

The stability test: 250 to 700 edits of each kind on molecules of rounds 3 to 9 (840 drawn, those with 10 or more backbone atoms kept) (`fold.py` functions `fold` and `neighbors_across` on edited graphs; edit script kept in the scratch folder). Arm of three added in the middle: 2% of atoms move. Far two atoms cut: 4%. A loop closed by an across join: 1%.

### 1.2 The exact fold (this is what to port)

Constants: K = 8 atoms a row, TAIL = 2, SMALL = 8, SHORT_ARM = 3.

Inputs: the heavy atoms and bonds; the anchor atom (remembered for the round); the rung bonds (remembered).

1. Layout graph: the molecule without its rung bonds.
2. Bodies: every ring of SMALL atoms or fewer in the layout graph. Rings that share an atom form one body.
3. Nodes: each body is one node; every other atom is its own node. Two nodes are joined where a bond runs between them.
4. If the nodes still contain a cycle (a ring of 9 or more atoms that no join made: it was dealt that way), remove the one bond whose removal leaves the longest backbone (tie: lower id), and repeat until no cycle is left.
5. Anchor: when a molecule is dealt, one end of its longest path; of the two ends, the lower atom id. It is kept until that atom is cut off; then the next end of the longest path becomes the anchor. An end that is a single hetero atom with one bond (the O of a C=O, an OH, an NH2, a Cl) is never chosen.
6. Backbone: walk from the anchor. At each fork take the branch with the longest way on, where a body counts as the atoms on the shortest way through it (enter at the atom the walk arrives at, leave at the atom the next bond starts from; at the end of the walk, to the farthest atom). A tie goes to the branch with more atoms, then to the one whose first atom has the lower id. A hetero atom with one bond at the end of a branch adds nothing to the length (it is a group).
7. Number the backbone atoms 0, 1, 2 in walk order. The atoms of a body that are on the walk are kept together: if they would cross a turn, skip places so they start the next row. Position p: row = p div K, step = p mod K; column = step on even rows, K - 1 - step on odd rows.
8. If the last row holds TAIL atoms or fewer and none belongs to a body, those atoms are not turned: they stay in the row before, past its end (column K, K + 1 on an even row; column -1, -2 on an odd row).
9. Direction: the atom points into the gap below its row when (column + row + K - 1) is even, otherwise into the gap above. The last atom of every row but the final one points into the gap, so the turn bond is short. The first row's upward atoms and the last row's downward atoms point to the outside and face nothing.
10. Hosts: a backbone atom is its own host. For each atom next to the backbone and not on it: the whole arm that starts there (its atoms, not passing back through the backbone and not through a rung) is a group if it has 3 atoms or fewer and holds no body atom; all its atoms take the backbone atom's place as host. Any other arm, and any body atom off the walk, has no host and faces nothing.
11. Facing (mode W): atoms a and b face when both have hosts, the hosts are in neighbouring rows, and their columns differ by 0 or 1. (Mode E, used only for the comparison, needs the same column and the upper atom pointing down.)
12. Across pair: a and b face and are at least MIN_D = 6 bonds apart along the molecule (shortest way through any bonds, including rungs).

Check: `python fold.py test` (8 across reflexes on chains built so that their groups face, atom balance, folds of 8 to 35 carbons, symmetry of facing). A text picture: `python fold.py "CCCCC(=O)CCCCCCCCCCC(O)CC"` (first atom marked ^, one-atom groups under or over the atoms).

How it changes during a round:
- an atom added or cut at the far end of the line: nothing moves;
- a group or arm of 3 atoms or fewer added or removed: almost nothing moves (2% of atoms in the test);
- an atom added or cut in the middle of the line: everything after it slides one place and may turn a row sooner or later; everything before stays;
- an arm longer than what remains of the line takes over as the line (rare: 1% of edits in the test, and only atoms after the fork move);
- a join across the fold: nothing moves; the join is drawn as a bridge between rows;
- a ring closed by a reflex close along the chain (the old reflexes, rings of 5 to 7): it is a body, so nothing moves.

## 2. What facing means

Picked (mode W): two atoms face when they are in neighbouring rows and no more than one place apart. A group points into the gap or away; that is not counted. The page turns a facing group toward its partner (section 7).

| | Rule | Dealt molecules with an across pair, round 5 / 7 / 9 (game's) | Reading |
|---|---|---|---|
| E | same column only, and both pointing into the gap | 21% / 6% / 19% | needs two parities to line up; players could not predict it; rare |
| W | same column or one to either side | 63% / 75% / 100% | three nearest atoms on the other row; readable at a glance |
| W with both pointing in | not built | | would halve W and add a second thing to read |

Rows next to each other only. Two rows apart do not face. One more reason for W: with E, facing pairs are always 4k + 1 bonds apart (1, 5, 9, 13), so only loops of 10, 14, 18 could ever form.

## 3. What happens when two groups face each other

A step across the fold is the old reflex done at a distance: the same two kinds of group, a join in place of the small ring. Twelve across reflexes: nine twins of near reflexes, three that exist only across the fold. Four near reflexes have no across form because they need one group or two atoms two apart: dry, shift, flip, fold.

| Near reflex | Across form (name on the page) | What it makes | What leaves | Real chemistry | Stays? |
|---|---|---|---|---|---|
| ring (OH, C=O) | ring across | the OH oxygen joins the C=O carbon: a loop of 8 or more atoms; the C=O becomes C-OH | nothing | a large hemiketal (real but unstable) | loose: opens again when the turn ends, like ring |
| cap (SH, C=O) | cap across | the S joins the C=O carbon, big loop; C=O becomes C-OH | nothing | large thiohemiketal | loose |
| knit (NH2, C=O) | knit across | C=N forms (an imine) between them, big loop through it | water | macrocyclic Schiff-base rings are real | stays |
| weld (CH beside C=O, second C=O) | weld across | the carbon joins the second C=O carbon (a large aldol); second C=O becomes C-OH | nothing | macrocyclic aldol is real, rare | stays |
| seal (COOH with OH, NH2 or SH) | seal across | a large lactone, lactam or thiolactone | water | macrolactones (erythromycin) and macrolactams: real | stays |
| close (Cl with OH, NH2, SH, COOH) | close across | the Cl leaves, the other group closes a big ether, amine, thioether or lactone ring (crown-ether-like) | acid fumes | macrocyclisation by alkylation, as in crown ethers: real | stays |
| open (epoxide with OH) | open across | the OH opens the epoxide: big ether ring, the other epoxide carbon keeps an OH | nothing | polyether ring-forming cascades (monensin) are real | stays |
| tuck (C=C beside C=O, OH) | tuck across | the OH adds to the far carbon of the C=C: big ether ring, C=C goes single | nothing | macro oxa-Michael: real, uncommon | stays |
| snap (two C=C side by side, third C=C) | snap across | a six-ring forms and the line between becomes a loop (transannular Diels-Alder) | nothing | intramolecular and macrocyclic Diels-Alder are real | stays |
| new: bridge | bridge | two SH facing join as S-S, a disulfide bridge | hydrogen | the disulfide bridge of proteins and rubber: real, and it already counts for the sulfur-bridge motif | stays |
| new: stitch | stitch | two C=C facing join into a four-ring; both go single; two rungs, side by side | nothing | intramolecular [2+2] cycloaddition: real with light, here without | stays |
| new: link | link | two OH facing join as one ether C-O-C, a big ether ring | water | dehydrative etherification; crown ethers are the picture | stays |

Honest points. Loops of 8 to 11 atoms are strained in real chemistry; the rule has no dead zone (anything facing at 6 or more bonds joins) because the owner's line is that what is drawn close is close. If this matters, set MIN_D to 8 and accept pairs near the turn doing nothing. Knit across is an imine, not the loose carbinolamine of the near knit, so that the nitrogen reflex gives a different effect and a water.

The across steps that were seen: stitch 292, link 285, ring across 140, weld across 111, tuck across 34, open across 31, snap across 26, knit across 16, close across 9, cap across 4, seal across 3 (all greedy rounds, game and generated molecules together). The common ones need only C, O and C=C. The ones that use N, S, Cl and acid groups are rare because those atoms are rare in the molecules (section 6).

## 4. What it does to the game (engine, with and without)

### 4.1 Steps, kinds, and how common across steps are

Greedy player, 300 rounds a stage. "Ring-closing" counts every reflex that closes a ring (ring, weld, tuck, knit, seal, cap, close, open, snap and every across step). "Ring reflex" counts only the reflex called ring.

| Molecules | Stage | Rule | Steps a turn (spread) | Ring reflex share of steps | Ring-closing share | Across share of steps | Turns with an across step | Rounds with one | Kinds in a turn: 1 / 2 / 3 / 4+ | Yield a round |
|---|---|---|---|---|---|---|---|---|---|---|
| game's | 1 (rounds 1-3) | without | 1.14 (0.94) | 97% | 97% | | | | 61 / 4 / 0 / 0 (35% of turns do nothing) | 230 |
| game's | 1 | with | 1.14 (0.94) | 96% | 96% | 0% | 0% | 0% | 61 / 4 / 0 / 0 | 229 |
| game's | 2 (4-6) | without | 3.03 (1.95) | 25% | 68% | | | | 9 / 16 / 38 / 20 | 964 |
| game's | 2 | with | 2.99 (2.01) | 23% | 68% | 8.4% | 18% | 40% | 9 / 14 / 32 / 25 | 971 |
| game's | 3 (7-9) | without | 3.54 (2.96) | 11% | 66% | | | | 20 / 14 / 15 / 30 | 1675 |
| game's | 3 | with | 3.51 (2.69) | 13% | 68% | 12.1% | 32% | 69% | 17 / 18 / 14 / 33 | 1554 |
| generated | 1 | without / with | 1.16 (0.93) / 1.16 (0.93) | 58% / 58% | 58% / 58% | 0.2% | 0% | 1% | 35 / 35 / 0 / 0 both | 224 / 224 |
| generated | 2 | without | 2.97 (1.86) | 29% | 63% | | | | 10 / 17 / 39 / 18 | 915 |
| generated | 2 | with | 2.95 (1.87) | 27% | 65% | 6.0% | 15% | 33% | 9 / 16 / 35 / 22 | 908 |
| generated | 3 | without | 2.86 (2.24) | 10% | 58% | | | | 18 / 19 / 19 / 22 | 1048 |
| generated | 3 | with | 2.80 (2.27) | 10% | 61% | 7.2% | 18% | 45% | 18 / 18 / 19 / 24 | 1039 |

Look-ahead player (120 rounds a stage; game's molecules): stage 2 steps 3.77 without, 3.90 with, yield 1484 / 1481, across steps 7.0% of steps, in 45% of rounds. Stage 3: steps 4.43 / 4.37, yield 3261 / 2529, across 10.4% of steps in 75% of rounds, turns of 10 steps or more 22% / 12%, turns doing nothing 32% / 19%. Generated molecules, stage 2: steps 3.62 / 3.06 (rough, 60 rounds with), stage 3: 3.92 / 3.96, yield 2158 / 1931, across 6.3% of steps in 48% of rounds.

What this says.
- Steps a turn do not change (3.03 to 2.99, 3.54 to 3.51): across steps replace steps that were ending anyway. The rule does not make overreactions longer. The longest turns get a little shorter (look-ahead, game's, stage 3: turns of 10 or more steps 22% to 12%).
- Yield does not go up. For the greedy player it is flat (-1% to +6%) in stages 1 and 2 and falls 7% in stage 3 (game's, 1675 to 1554; round by round: -12% in rounds 8 and 9). For the look-ahead player it falls 22% in stage 3 (3261 to 2529: -12%, -21%, -31% in rounds 7, 8, 9). Reason: a join across the fold uses up two groups for good (except the two loose ones), and in a molecule that the best line was running as a long chain through those same groups, the joins end the chain earlier. So the rule works against the best-planned runs, not for them. If the owner wants the big overreactions to stay as big, give an across step more pay than a near step (for instance count it as two steps in the chain) or let the player hold it back; I did not test either.
- Kinds a turn go up a little: in stage 3 turns with 4 or more kinds 30% to 33%, mean kinds 2.81 to 3.10 (game's); stage 2 mean 2.88 to 3.02. Counting an across step as the same kind as its near twin gives 31% for 4 or more, so most of the gain is real new kinds (stitch, link, weld across), not twins.
- Ring-closing share of steps: 66% to 68% in stage 3. Across steps close a ring by definition, so this share cannot fall. The owner's line is about variety, and the table shows the ring reflex itself is already a small share from round 4 (25%, then 11%). The weak place is rounds 1 to 3: 97% of the steps on the game's molecules are the ring reflex (section 6).

### 4.2 From what size it matters

Share of rounds with at least one across step, by the backbone length of the dealt molecule (K = 8, both sources, rule on, greedy):

| Backbone atoms | up to 8 | 9 | 10-11 | 12 | 13 | 14-18 | 19-22 | 23-24 |
|---|---|---|---|---|---|---|---|---|
| rounds with an across step | 0-3% | 7% | 12-13% | 22% | 39% | 52-61% | 30-65% | 76-78% |

By round number (rule on, game's and generated together): round 1 0%, 2 1%, 3 0%, 4 10%, 5 50%, 6 50%, 7 54%, 8 60%, 9 56% of rounds, 0.8 to 1.0 across steps a round from round 5. So the rule starts to matter at about 12 backbone atoms (about 17 heavy atoms in a chain), that is round 5, and is fully there from round 7. In rounds 1 to 3 the dealt molecules have 8 to 10 backbone atoms, one or two rows, and across steps hardly happen even though 66% of the game's molecules are already drawn folded in two rows. The across steps in rounds 1 to 3 would need a shorter row (K = 6 gives an across pair in 10% to 19% of dealt molecules in rounds 3, but folds every molecule from round 1), or longer chains early.

Loops that stay at the end of the round (a new ring of 9 or more atoms): stage 2 21% of rounds, stage 3 46%.

### 4.3 Can a player use it on purpose

Over 144 hands (turn 1 of rounds 4 to 9, 12 molecules a round, game's and generated; every line of three reagents tried):
- some line gives an across step in 55% of hands, and 21% of all lines contain one (game's, rounds 7 to 9: 78% of hands, 38% of lines);
- of the lines that contain one, 45% had a facing pair already at the start of the turn (so it is read straight off the page); 41% needed a reagent to make the groups (an OH from hydrate, a C=O from oxidize); 15% had the groups but not facing until the line changed the molecule; in 35% of those lines the length of the backbone had changed before the across step;
- the best line has an across step in 35% of hands (game's, rounds 7 to 9: 58%); the best yield in the hand is 5.5% lower with the rule than without in the whole sample (game's rounds 4 to 6 +3.5%, rounds 7 to 9 -12.6%).

Look-ahead against greedy: greedy yield 1675 and look-ahead 3261 in game's stage 3 without the rule (ratio 1.95); with it 1554 and 2529 (ratio 1.63). Stage 2: 964 vs 1484 without (1.54), 971 vs 1481 with (1.53). So planning ahead is worth about the same in the middle rounds and a little less in the late ones. The rule gives the planner a second thing to aim at (which reagent makes the groups meet), but it does not reward planning more than the near reflexes already do. Reagents that change the line's length (cyanohydrin and hydroformylation at an end, HWE, ozonolysis) shift what faces what after the point of change: this is real (35% of the across lines had a length change) and the page can show it, but I could not separate how much of the look-ahead's gain is that.

### 4.4 What it does to the specs and the motifs

- A loop is a ring in the old count (`traits.py` ring motif counts every non-aromatic ring not in a cage): one join adds one ring and 8 to 17 ring atoms at once. Specs that count ring atoms ("at least N more atoms inside rings", N of 9 to 16 in `HURDLES.md`) become easy: one loop is worth the whole N. Specs that count rings of five or six are unaffected.
- The spec `big_rings` (rings of 9 or more) was "too rare" (0 of 9 rounds reached even one). With the rule 21% of stage 2 rounds and 46% of stage 3 rounds end with one. It becomes a usable spec for rounds 5 to 9.
- Bridge makes S-S bonds: the sulfur-bridge motif already counts them, so "at least 2 sulfur bridges" can now be reached across the fold.
- New motif suggested: **loop**, level = the number of rings of 9 or more atoms (a crown has a ring of 12 to 18 atoms and 3 or more ether oxygens in it; call that one level more). New specs: "at least N loops" and "a loop of at least 12 atoms". Not built into `traits.py` or `hurdles.py` (they were not to be edited).
- Stitch makes a four-ring: a small ring size the specs never saw (`ring_sizes`).

## 5. What I would change after testing

1. Pay: give an across step more than a near step, or the best-planned runs lose a fifth of their yield in rounds 7 to 9 (look-ahead stage 3 yield -22%). Untested options: count an across step as two steps in the chain; or let a loop that stays at the end of the round count as a motif level for the yield.
2. Rounds 1 to 3: with ring and dry the game's molecules give 1.2 kinds in nine turns (97% ring). Fix this with the reflexes of section 6, not with the fold. Across steps cannot appear there because the molecules are too short.
3. Keep K = 8 and facing W. Do not use E (rare) or K = 10 (no across steps before round 4).
4. Keep across steps last and once a kind a turn. I did not test the other order (across steps with their twin's priority), a total cap per turn, or MIN_D = 8.
5. Name stitch, link and bridge as new kinds on the page; ring across, weld across and the other twins read as "the same thing, far", so count them as new kinds only for the owner's variety measure when they look different on the page.
6. Use the generator's longer chains in rounds 4 to 6. The generated molecules in rounds 1 to 3 have 8 backbone atoms on average (the game's: 10), so they rarely fold.

## 6. The first runs: which reflexes a new game should hold, and which atoms to bring in

### 6.1 Reflexes (rounds 1 to 3, the six starting reagents; a first run is 3 rounds, 9 turns; 150 runs a cell, greedy, 50 runs look-ahead)

Kinds seen in a first run (names of reflexes; an across form counts as its own kind):

| Held at the start | Game's molecules: mean kinds, runs with 3 or more, 4 or more | Generated molecules: same | Ring reflex share of steps (game's / generated) |
|---|---|---|---|
| ring, dry (today) | 1.21, 0%, 0% | 1.99, 0%, 0% | 97% / 58% |
| ring, dry, shift | 1.21, 0%, 0% | 2.43, 44%, 0% | 97% / 52% |
| ring, dry, shift, tuck | 1.21, 0%, 0% | 2.98, 73%, 25% | 97% / 44% |
| ring, dry, shift, weld | 3.07, 99%, 7% | 3.27, 86%, 41% | 38% / 31% |
| ring, dry, shift, weld, tuck, snap | 3.73, 100%, 73% | 3.68, 93%, 60% | 20% / 24% |
| the above and across: ring, weld, tuck, snap, link, stitch | 3.67, 100%, 63% | 3.69, 93%, 60% | 13% / 24% |
| ring, dry, with across ring, link, stitch only | 1.21, 0%, 0% | 2.01, 3%, 0% | 97% / 58% |
| the above plus seal, knit, cap, close and their across forms and bridge | 3.67, 100%, 63% | 3.75, 94%, 62% | 13% / 23% |

Look-ahead player, 50 runs: ring and dry 1.36 kinds (game's) and 1.96 (generated); with weld, tuck, snap added 4.06 (100% three or more, 96% four or more) and 3.82.

Answer. **Weld is the one reflex that fixes the first runs.** Adding it to ring and dry takes the game's molecules from 1.2 to 3.1 kinds (99% of first runs see three or more) and cuts the ring reflex from 97% of the steps to 38%. A first-time player sees three or four kinds of change in their first runs if the new game holds **ring, dry, weld, tuck and snap** (73% of runs see four or more, game's molecules; 60% generated). Shift does little on the game's molecules (1% of steps) and little with weld (7% on generated ones): keep it for round 4. The across forms add nothing in rounds 1 to 3 (the molecules are too short to fold into facing pairs); hold them back until round 4 or 5 (the lead's rule: new layers are earned).

The order I would give the player: ring and dry at the start; weld as the first earned reflex (it is the one that turns the first runs from "ring over and over" into "weld, dry, ring"); then tuck, then snap. The harness rule that not every layer is present on the first run is kept: five reflexes is the first run of this table, one more than today per earned step.

### 6.2 Atoms beyond carbon and oxygen in rounds 1 to 3

Generated molecules of rounds 1 to 3 (450 rounds, with ring, dry, shift, weld, tuck, snap, seal, knit, cap, close and across forms held). Feature, share of molecules that have it, and the share of those that used each reflex in a turn:

| Group | Share of molecules | What it lets a reflex do |
|---|---|---|
| NH2 | 2% | knit fired in 50% of the molecules that had it |
| ring NH (piperidine, pyrrolidine) | 4% | nothing yet (no reflex uses a ring NH); it is readable and costs no row |
| SH | under 1% | none seen (cap needs an SH three or four carbons from a C=O) |
| S between two carbons (thioether) | 2% | nothing yet; readable |
| Cl | under 1% | close fired in 100% of the few that had it |
| COOH | 2% | seal fired in 45% |
| benzene ring (phenol OH) | 8% | ring fired in 79%, weld in 42% |

The numbers say the groups work when they are there and are almost never there: the generator in rounds 1 to 3 gives NH2, SH, Cl and COOH to under 2% of molecules each. My recommendation, as a short list, for rounds 1 to 3:
1. **Carboxylic acid (COOH)**, in about a quarter of the molecules, placed three or four carbons from an OH: it is one extra O (an acid is an end-of-chain C(=O)OH, already a shape the player reads), it makes seal (a lactone and water off) and gives permanganate and the cyanohydrin route something to make later.
2. **Amine NH2**, in about a fifth, three or four carbons from a C=O: knit fires in half of them. One N, drawn blue, no new bond type.
3. **Benzene ring with an OH (phenol)** at the end of a chain, in about a fifth: already works with ring and weld, is easy to read, and is a motif (benzene ring).
4. **Chlorine**, in about one in ten, three to five carbons from an OH: close fires every time (acid fumes jar), one atom and a colour.
5. **Sulfur: a thioether S in the chain** (readable, no reflex yet, it adds the sulfur-bridge motif) and **SH** in about one in ten from round 3 only (cap needs a C=O three or four away; bridge needs two SH facing, which means a long chain: round 5 and later).
Keep each molecule to 14 heavy atoms or fewer in rounds 1 to 3, at most 3 different elements besides C and H, and at most 4 kinds of group at once. I did not test readability with players; those limits are the ones the game's current molecules already meet.

## 7. For the rules builder

Port `fold.py` as is. The pieces:

**Memory the game must keep on the round's molecule.** (a) `anchor`: the atom the line starts from. (b) `rungs`: a set of bonds an across join made. Both go with the atom and bond objects, so they survive reactions that leave the atoms in place; if the anchor atom is removed, take the next end of the longest path.

**The fold:** section 1.2, exactly. Constants K = 8, TAIL = 2, SMALL = 8, SHORT_ARM = 3, MIN_D = 6. Facing mode W (|column difference| at most 1, rows next to each other, both atoms have a host). Ties by lower atom id.

**Order and limits (in the turn's chain).** After every reagent that changed the molecule, the molecule makes its changes one at a time until none fits (as now): first the near reflexes in the order of `FINAL.md` section 2 (seal, close, knit, cap and open; then dry, flip, shift, tuck, weld, snap and fold; ring last), nearest pair first; only when none of them fits, one across step, in this order: rare groups first (seal across, close across, knit across, cap across, open across, bridge), then (weld across, tuck across, snap across, stitch, link), ring across last; nearest pair first within a group. Every across step is a step of the chain and pays like any other. Each across reflex once per turn. After an across step, the near reflexes run again (a loop makes new close neighbours, which is where the next near step comes from). The loose ones, ring across and cap across, open again at the end of the turn like ring and cap; the rest stay. Mark the bonds a stitch, bridge, link or any join made as rungs; mark the bond a loose one made too, and unmark it when it opens.

**The across form of each reflex** (find: a pair of groups whose anchor atoms are an across pair, section 1.2 step 12; edit: the join). Anchor atoms are named so the same group search as the near reflex can be reused.
- ring across: OH on a saturated carbon (one hetero neighbour at most) and a ketone or aldehyde C=O; the O of the OH bonds to the C=O carbon, C=O becomes C-OH. Loose.
- cap across: SH on a saturated carbon and a C=O; the S bonds to the C=O carbon, C=O becomes C-OH. Loose.
- knit across: NH2 on a saturated carbon and a C=O; delete the O of the C=O; N gets a double bond to that carbon; water comes off.
- weld across: a carbon with H beside a C=O (not in a ring) and a second C=O (not in a ring); bond the first carbon to the second C=O carbon; the second C=O becomes C-OH.
- seal across: a COOH and an OH, NH2 or SH on a saturated carbon; bond the O, N or S to the acid carbon; delete the acid OH; water comes off.
- close across: a Cl on a saturated carbon and an OH, NH2, SH or COOH; the O, N or S bonds to the Cl's carbon; delete the Cl; acid fumes come off.
- open across: an epoxide and an OH; the OH oxygen bonds to the epoxide carbon that faces it (the nearer one if both do) and that carbon loses its bond to the epoxide O; the O stays on the other carbon as OH.
- tuck across: a C=C beside a C=O and an OH on a saturated carbon, the OH facing the far carbon of the C=C; the OH oxygen bonds to that carbon, C=C goes single.
- snap across: a diene C1=C2-C3=C4 and a separate C=C (not aromatic) that does not share an atom with it, with any atom of the diene facing any atom of the C=C; C1=C2 and C3=C4 go single, C2-C3 goes double, the C=C goes single, and C1 and C4 bond to its two carbons.
- bridge: two SH on saturated carbons facing; bond S to S; hydrogen comes off.
- stitch: two non-ring C=C (not aromatic) facing; both go single; bond the facing atom of one to the facing atom of the other, and its partner to the other's partner (four-ring); two rungs.
- link: two OH on saturated carbons facing; the O of the less crowded carbon's OH bonds to the other carbon, the other O is deleted; water comes off.

**Checks.** Every across reflex changes atoms exactly as listed (formula tests in `fold.py selftest`: ring across, cap across, weld across and the loose ones change nothing; knit across -H2O; seal across -H2O; close across -HCl; bridge -H2; link -H2O). An across pair needs at least 6 bonds along the molecule, so a loop is 8 or more atoms (an across pair of exactly 6 gives 8; 7 gives 9).

**Specs and motifs.** Add the motif "loop" (rings of 9 or more atoms) and the specs "at least N loops" and "a loop of at least 12 atoms" to the lists in `traits.py` and `hurdles.py`; the sulfur-bridge motif already counts bridge.

## 8. For the page builder

The page must draw the molecule in the fold of section 1.2: the same backbone, the same rows, the same turn, the same direction of each atom. If the page's own layout (apps/steam/js/react/scheme.js, which bends a long drawing into a U only when it is too wide) disagrees, the page loses: rows of 8 from the anchor are the rule, whether or not the drawing would fit in one row. In the page's units the row spacing must be small enough that a one-atom group on each side of the gap is about a bond apart (the lead's picture: an OH and a C=O across the gap with a short space left). Rings of 8 atoms or fewer are drawn flat and whole where the line passes through them; side rings and long arms are drawn on the outside of the fold, away from the gap.

**Showing what faces what with nothing added to the molecule.** Do not put a mark, a line or a glow on the molecule. The closeness is the information: the gap is narrow, atoms of neighbouring rows are lined up column by column (the turn bond is straight across, so columns match), and the one-atom groups on atoms that have a facing partner lean into the gap toward it (a group points toward the nearest atom on the other row, whichever way its atom would point alone). A player counts across by eye: straight across, or one place to either side. When the facing set changes (a length change in the middle), the rows slide: show that move slowly, from the point of the change to the end, so the player sees which atoms now face which.

**How an across join looks.** In order: (1) the two groups lean toward each other for a moment, (2) a new bond grows across the gap from the one atom to the other (the O, N or S group reaches the carbon; for a stitch, two bonds grow side by side, like a zip; for a bridge, a short two-sulfur bar), (3) the groups that leave (water, hydrogen, acid fumes) leave from the gap, (4) the new loop stays drawn flat across the gap with the rows left where they were. A loose one (ring across, cap across) shows the same growth and then pulls back at the end of the turn. The molecule must not re-fold or re-centre during the join. Colour only the new bond, for the length of its growth, then as every other bond.

**Where the ring bonds are drawn.** A join across the fold is a rung: it connects rows, it is not part of the line. Do not use it to pick the rows. When the loop closes, the page keeps every position it already had (the rung memory of section 7 gives the same answer in the rules and on the page).

**What to show first.** Nothing different for the first rounds: molecules there have one or two rows and no across steps. The across forms arrive with the molecules of round 5; when the first across step of a run happens, slow it down and let the player see the gap being crossed; it is the only thing on the page that proves close means close.
