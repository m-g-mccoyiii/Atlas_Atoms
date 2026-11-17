# Overreact: how the game scores

Written 2026-11-16 from the code at commit `27beb19` (branch `fix-scoring`, cut from `steam`). Where an older doc or a margin note disagrees with the code, the code wins and the disagreement is listed in section 8.

Files: `P` = `apps/steam/js/react/path.js` (all rules; most numbers), `S` = `scheme.js` (the screen), `N` = `notes_data.js` (margin notes), `R` = `rules.js` (chemistry), `U` = `run.js` (old order game; only its 10 named routes are still read). Line numbers are for this commit.

Every example below was run in the real game code in headless Edge (kit `.claude/r154`, seed 3, the molecule `C=CCC(=O)CCC(O)CC=O`, a round-4 doctorate run). The numbers are copied from that output, not worked by hand.

## 0. The two scales (read this first)

The game keeps one raw number and shows another.

| Name | What it is | Where |
| --- | --- | --- |
| raw | `(bank + P x R) x E`. P = places, R = row, E = extra. | `P:1182` |
| yield | `sqrt(4770 x raw) x lift`. This is the number on the page, the track and every comparison with the number to beat. | `P:1178-1182` |
| lift | 1 without the sign. 1.2, 1.4, 1.6 after one, two, three signs. | `P:879` |

So anything that multiplies raw by k multiplies the yield by sqrt(k): raw x2 reads as yield x1.41, raw x4.80 as x2.19. Anything that adds to P, R or E is added inside the product first and is square-rooted with it. Raw 4,770 is yield 4,770 (the pivot).

- The book and the cards write numbers on the yield scale (`x1.36`, `x1.03`). The in-play callouts (`times 2`, `+0.1`) write raw values. The two scales are never labelled (see section 8).
- "made" is the yield (`made(g)`, `P:1182`). It is what the page shows and what the rounds compare. "held" (`P:1183`, `round(P x R x E)`, no bank, no square root) exists but the page does not use it.
- A round's total is `made(g)` taken when the round ends (`synEnd`, `P:1989`).

## 1. The shape of a run

| Thing | Value | Condition / note | Where |
| --- | --- | --- | --- |
| Run lengths | Bachelor's 3 rounds, Master's 6, Doctorate 9 | A run starts at the longest length the profile has opened (`meta.reach`). Winning a Bachelor's opens Master's; winning a Master's opens Doctorate. A 12-round Postdoc exists in code, switched off. | `P:903-907`, `S:1851-1855` |
| What each length has | Bachelor's: no instruments, no creature, uses unlimited, no gold for clearing. Master's: instruments, no creature. Doctorate: instruments and one creature. | `TIERS` bare / helpers / creatures. `usesFree` makes uses unlimited in the Bachelor's only. | `P:898`, `P:1000-1002`, `P:2703` |
| Pages per round | 3 | +1 Clepsydra, +1 Condenser used. -1 term Long. Assay "short": -1. | `P:1145`, `P:1169` |
| Circles (reagents fired) per page | 3 | +1 Tetractys, +1 Timer, +1 term Long. Assay "short" does not change this. This is "the three-reagent line". | `P:601`, `P:1031` |
| Hand (reagents dealt per page) | 5, from a rack of 6 starting reagents plus what the run took | +1 on page 1 only with the Carousel. -1 per sign only if `SIGN.takes` held it (it is empty, so never). | `P:625`, `P:1189` |
| Uses per reagent per round | 3 (2 for the rare-tier reagents Wacker, Wolff; 2 in the "scarce" assay) | +2 Dropper, +1 per use picked ("bottle" pick), +1 term Lean. Unlimited in the Bachelor's. | `P:1187-1188`, `P:2285-2292` |
| How a page is played | The player puts up to 3 reagents (or the Bank) into the circles, in order, then fires. Each circle runs in turn: the reagent acts at every place it fits, then the molecule sets off every reflex it can by itself, one at a time. A reagent that finds nothing is wasted: it still takes its circle and a use. | Re-ordering is free before firing. | `P:1929-1959` |
| Re-deal (the cup) | Once a page, before firing. Costs one use of the reagent with most uses left (free in the Bachelor's). | | `P:1233-1250` |
| The finisher | Hydrogenate (`h2`) can be placed only on the last page. It adds E +0.5 per place it changes and ends the round at once; circles after it are not played. | It is not in the hand. | `P:1976-1995`, `P:1145` |
| What ends a page | All circles used and fired (then the creature tap, instrument use and Bank window), or a click when nothing can be played. The page then turns: loose rings open again, the next hand is dealt. | | `S:1870-1886`, `S:2264` |
| What ends a round | The last page turns (or the finisher, Brimstone's tap, or a Glass break fires). `synEnd` closes the open row, applies the pact if held, and stores the total. | | `P:1974`, `P:1989` |
| What ends a run | A lost round (the run is over at once), or the last round of the length cleared. | | `P:2710` |
| Round order | After round 1: shop page (take one of three), then pick one of two molecules, then play. Round 1: pick one of two molecules only. | | `S:1593-1594`, `S:2346` |
| Molecule size | Heavy atoms dealt by round: 11.5, 12.5, 14, 16.5, 19.5, 23, 27, 31, 35 (average). A reaction that would take the molecule past 56 heavy atoms is not offered. | | `P:71`, `P:625-633` |
| Assay rounds | Rounds 3, 6, 9 are an assay: both molecules carry one rule change (scarce: 2 uses; short: 2 pages; each: a repeated reagent pays 0 places and a first use adds E +0.5 (extra); loose: no row, E +0.3 each reaction). The number to beat changes (section 3). | Three of the four are drawn for a run. | `P:1156-1165`, `P:2118-2121`, `P:1321-1352` |

Run order, in play: pick creature (Doctorate, if a jar has hatched) -> pick term (only if two or more are open) -> round 1 pair -> play -> after each clear: shop -> pair -> play (`S:1678-1679`).

## 2. The yield (the number)

### 2.1 The three parts

| Part | Starts | What raises it | Reset |
| --- | --- | --- | --- |
| P places | 0 | Every place a reagent or reflex changes (table 2.3). | Row break or Bank: P x R is banked, P goes to 0 (`close`, `P:1284`). |
| R row | 1 | +0.35 per reagent that follows on; +0.1 per reflex step; named routes (2.5); the rare version "strong" +1; Oxygen-18 +1. | Back to 1 when the row closes. |
| E extra | 1 (3 with term Glass) | Reflex steps (+0.1 x n x w x lx); the finisher (+0.5 per place); creature taps (x); terms' circle (x); Carbon-14 (x1.25). | Never reset in a round. |
| bank | 0 | Closed rows: P x R each, and Bank pays P x R twice. | Never reset in a round. |

A reaction "follows on" (row continues) when it acts at atoms the last two reactions made or changed (`RULE.ground` 2) and, if it returns the molecule to a form already held this round, only while that has happened fewer than twice (`RULE.loops` 2). A reagent that does not follow on breaks the row: what the row made is banked, P = 0, R = 1. Nothing made is ever taken away. Reflex steps always follow on. The first reaction of a round does not break anything. The row carries across page turns.

### 2.2 The order things apply (one reaction, fixed order)

`scoreRound`, `P:1300-1360`. Each item is applied in this order, every time. h = the places this reaction has added so far.

| # | Applies to | Condition | Effect (raw) | Reads on the yield as | Where |
| --- | --- | --- | --- | --- | --- |
| 1 | Reagent, each place | always | P += 20 (common), 30 (uncommon: Add methyl, Methylenate), 45 (rare: Wacker, Wolff), 20 for Grow, own rule for Polymerize. Times `1 + 2 x (grade - 1)`. | adds | `P:1321`, `P:676-677`, `P:2291` |
| 1 | Reflex step, each place | always | P += 50 x lx x gem x toolPay | adds | `P:1321` |
| 2 | Reflex step | n = steps so far this page, counting repeats | If n > 1: h x (1 + (n-1) x w). E += 0.1 x n x w x lx x toolPay. | h x n gives places only, E is +0.1n | `P:1334-1336` |
| 3 | Wacker, Wolff | always | h x3 and R +1.0 (Wacker); h x4 and R +1.5 (Wolff) | | `P:1338`, `P:672` |
| 4 | Isotopes at the atoms acted on | an atom dealt as one | Carbon-13: P +60. Oxygen-18: R +1. Carbon-14: E x1.25. Dealt on a molecule: each non-aromatic carbon is C13 with 10 in 100, C14 with 2 in 100; each oxygen is O18 with 20 in 100. | | `P:1339`, `P:1151-1153` |
| 5 | Motifs | open motifs on the molecule as it now stands | h x product over open motifs of `(1 + rate x level)` (2.6) | | `P:1348` |
| 6 | Row | the reaction follows on | R +0.35 (reagent) or +0.1 (reflex step). If the row now ends in a named route: R +0.5 x (links - 1). | | `P:1350` |
| 7 | Brief (assay) | rounds 3, 6, 9 | loose: E +0.3 each reaction. each: E +0.5 on a first use. | | `P:1352` |
| 8 | Rare version of the reagent on this page | `run.rare` (supplier 3 bought) and 18 in 100 per reagent per page | double: h x2. strong: R +1. plenty: no use spent. | | `P:1210`, `P:1354` |
| 9 | Terms' circle | term not plain | A reagent lights a rune the first time it is used. A full circle: E x mul, then starts again. A broken row puts out the last rune. | | `P:1358`, `P:2175` |

Dead in the live game (instruments that add numbers; see 5.3): `RULE.five` offers only ten instruments, none of which add to P, R or E, so the "site"/"step" pieces (balance, cannula, stir plate ...) never fire.

Constants: `lx` = 2 for a reflex step that runs after the page's last circle's reagent (the "last reagent pays double"); 3 with Tetractys in its strong form; else 1 (`P:1319`, `P:894`). `gem` = 2 for Gemini on a reagent or reflex that works on a C=C or C=O, else 1 (`P:1320`). `w` = 1 for a step beyond the longest cascade any earlier page of the round reached, 0.25 for a step up to it (`CASC.old`, `RULE.fresh`; `P:659`, `P:1336`). `toolPay` is in 5.3.

### 2.3 Reagents and reflex steps (what one place pays)

| Source | Raw pay per place | Reads on yield | Notes |
| --- | --- | --- | --- |
| The six starting reagents (Hydrate, Oxidize, Grow, Thiolate, Dehydrate, Aminate) | 20 places | | `RUNG.start` `P:2071` |
| Earned reagents (12) | 20 places each | | OFFER_STATS `P:86` |
| Add methyl, Methylenate (bought families) | 30 | | `P:677` |
| Wacker, Wolff (found by routes) | 45, x3 / x4 on the reaction, 2 uses | | `P:672`, `P:1188` |
| Polymerize | 20 x chain length | | `P:1321` |
| Grade (bachelor's "strong" pick) | x3 at grade 2 (+40 on a 20-place reagent), x5 at grade 3 | | `SYN.strong` 2, `P:1321`, `P:2291` |
| Reflex step (ring, dry, weld, ...) | 50 places per place, x n (see 2.2 line 2), E +0.1n | | `CASC` `P:659` |
| A reflex across the fold counts twice | Two repeats: n goes up by 2 and E gets two additions | | `RULE.foldPay2`, `P:1336` |
| Which reflex goes next, and how many a page | Fixed by priority and closeness; the page limit for ring is 2, dry 1, weld 2, each across-the-fold kind 1. | Does not change what a step pays. | `R:788`; ENG.R `per` |
| Hydrogenate as finisher | its places + E +0.5 per place; round ends | | `P:1990-1995` |

### 2.4 The cascade (reflex steps) in detail

Step n of a page is worth n times step 1 in places, and adds n tenths to E.

| n | Places of the step (x its base 50) | E added (w = 1, lx = 1) |
| --- | --- | --- |
| 1 | x1 | +0.1 |
| 2 | x2 | +0.2 |
| 3 | x3 | +0.3 |
| 10 | x10 | +1.0 |

- "Tenth reflex, ten times the first" is true of the step's own places and of E's addition. It is not compounding: R only gains 0.1 per step.
- The quarter rule: a step is paid in full only if n is past the longest cascade of any earlier page this round (`cascBest`). A standing chain that opens and zips again on every page pays a quarter of the n-bonus on the steps up to that length. The base 50 places per place are always paid in full.
- A page stops cascading at 40 steps (`CASC.most`).
- Loose rings (rings a zip closed) open again at every page turn, so the chain can be set off again.

### 2.5 Named routes (row bonus)

R += 0.5 x (links - 1) when the row's last reagents match a route, longest match only (`namedRow`, `P:1293`; routes `U:115-126`). Live ones (the others need banned reagents):

| Route (tag) | Links | Bonus to R |
| --- | --- | --- |
| Ketone: Hydrate or Hydroborate, then Oxidize | 2 | +0.5 |
| Slide: Hydrate, then Dehydrate | 2 | +0.5 |
| Hop: Dehydrate, then Hydrate or Hydroborate | 2 | +0.5 |
| Strip: Dehydrate, then Hydrogenate (finisher only) | 2 | +0.5 |
| Wipe: Reduce or Hydroborate, Dehydrate, Hydrogenate | 3 | +1.0 |
| Long hop: Reduce or Hydroborate, Dehydrate, Hydrate or Hydroborate, Oxidize | 4 | +1.5 |

Routes also count for the finds: Ketone unlocks Wacker, Wipe unlocks Wolff (`P:686`).

### 2.6 Motifs (all twelve)

A motif pays on each reaction, on the molecule as it stands after that reaction. Multiplier on that reaction's places: `1 + rate x level`, multiplied across all open motifs (`P:1348`). Level = how many of it the molecule holds (`motifPlaces`, `P:2437-2466`). A loose ring is read as open, so ring-type motifs count only rings that stay shut (weld, snap, ...).

| Motif | Rate (raw per level) | One level reads as | What counts as one level | Open |
| --- | --- | --- | --- | --- |
| Sugar | 0.07 | x1.03 | a carbon with an OH (sp3, no other heteroatom) | start |
| Resonance | 0.08 | x1.04 per level | one per double bond in the longest run of double bonds one single bond apart (min 2) | start |
| Ring | 0.05 | x1.02 | a ring that is not benzene and not in a cage | start |
| Branch point | 0.04 | x1.02 | a carbon holding three carbons (sp3) | start |
| Long chain | 0.12 | x1.06 | three plain sp3 carbons in a row, counted in threes along the longest run, not in a ring | start |
| Amine | 0.20 | x1.10 | an N with three single bonds, not next to N, O, S, a C=X or a C#, with a carbon | start |
| Sulfur bridge | 0.35 | x1.16 | C-S-C, or S-S | start |
| Acid group | 0.25 | x1.12 | a COOH carbon | start |
| Benzene ring | 0.30 | x1.14 | a six-ring of C or N, each with a double bond inside its ring system | Deed |
| Shared side | 0.15 | x1.07 | two rings sharing a bond | Deed |
| Spiro centre | 0.10 | x1.05 | an atom shared by two rings | Deed |
| Cage | 0.03 | x1.01 | a cage counts (its rings - 1) | Deed |

Example (run in game): after Hydrate, the molecule held two sugar carbons: level 2, multiplier 1 + 0.07 x 2 = 1.14 raw. The book shows one level as x1.03.

### 2.7 What leaves the molecule

Water, hydrogen, carbon dioxide and acid fumes pay nothing by themselves (`collect` events add 0). They feed jars (lifetime creature counts, 6.4) and some specs and creatures. Catching equipment (cold trap, drying tube ...) exists in `CATCH` (`P:669`) but none of it is offered with `RULE.five`.

### 2.8 The Bank

`P:1394-1403`. Place the Bank in a circle. Needs a row of 3 or more and P above 0. It takes one circle. It adds P x R once more to the bank, so the open row counts twice, then closes the row (P 0, R 1).

Example (run): after a page of Thiolate, row of 3 reflexes: P 213.8, R 1.2, E 1.3, made 1,261. Bank: made 1,784. (213.8 x 1.2 = 256.6 added to the bank; raw 667 x 1.3 gives 1,784.) Cost: one circle and a broken row.

### 2.9 Worked example 1: one page, every event

Molecule `C=CCC(=O)CCC(O)CC=O`. Line: Thiolate, Hydrate, Oxidize. Result: made 3,675.

| Step | Event | P | R | E | made |
| --- | --- | --- | --- | --- | --- |
| Thiolate (1 place) | bottle +20 | 20 | 1 | 1 | 309 |
| | motif x1.198 (sulfur, sugar) | 23.97 | 1 | 1 | 338 |
| Cap (reflex, n 1) | bottle +50 | 73.97 | 1 | 1 | 594 |
| | cascade E +0.1 | | | 1.1 | 623 |
| | motif x1.198 | 83.89 | | | 663 |
| | row +0.1 | | 1.1 | | 696 |
| Dry (reflex, n 2) | bottle +50 | 133.89 | 1.1 | 1.1 | 879 |
| | cascade x2 on its places | 183.89 | | | 1,030 |
| | cascade E +0.2 | | | 1.3 | 1,120 |
| | motif x1.299 | 213.81 | | | 1,208 |
| | row +0.1 | | 1.2 | | 1,261 |
| Hydrate | bottle +20, motif x1.198 | 237.78 | 1.2 | 1.3 | 1,330 |
| | row +0.35 (follows on) | | 1.55 | | 1,512 |
| Oxidize | bottle +20, motif x1.12 | 260.18 | 1.55 | 1.3 | 1,581 |
| | row +0.35, route Ketone +0.5 | | 2.4 | | 1,968 |
| Ring (reflex, n 3, after the last circle, lx 2) | bottle +100 (50 x 2) | 360.18 | 2.4 | 1.3 | 2,315 |
| | cascade x3 on its places | 560.18 | | | 2,887 |
| | cascade E +0.6 (0.1 x 3 x 2) | | | 1.9 | 3,491 |
| | motif x1.12 | 596.18 | | | 3,601 |
| | row +0.1 | | 2.5 | | 3,675 |

### 2.10 Worked example 2: the second page (quarter rule, fold, double last)

Page 2, line Grow, Hydrate, Oxidize. Page 1's longest cascade was 3 steps, so steps 1 to 3 are "old" (w 0.25). Total after page 2: 9,940.

| Step | Event | Raw | made after |
| --- | --- | --- | --- |
| Stitch (across the fold: counts twice) | +50 places; E +0.025 (0.1 x 1 x 0.25); then step 2: places x1.25, E +0.05 | | 4,477 |
| Dry (last circle's reagent, lx 2, still old) | +100 places; places x1.5 (1 + 2 x 0.25); E +0.15 | | 6,828 |
| Tuck (step 4, past page 1's 3: new, w 1, lx 2) | +100 places; places x4; E +0.8 | E 2.925 | 9,940 |

### 2.11 Terms (what a run can start with)

Offered only when two or more terms are open (earned by deeds, only after a Doctorate is open; the gate text in the book is switched off, `S:1180`). One term per run.

| Term | Effect | Circle (runes, x on E) | Reads | Where |
| --- | --- | --- | --- | --- |
| Plain | none | none | | |
| Glass | E starts at 3. The first row break ends the round. | 3 runes, E x2 | x1.73 at the start; circle x1.41 | `P:2194-2196`, `P:1287` |
| Occult | One random instrument to start. The number to beat x1.22. | 4 runes, x1.5 | circle x1.22 | `P:2197` |
| Lean | Only the first three starting reagents (Hydrate, Oxidize, Grow), one more use of each. | 3 runes, x1.5 | circle x1.22 | `P:2198` |
| Long | 4 circles a page, 2 pages a round. | 5 runes, x2.5 | circle x1.58 | `P:2199` |
| Hoard | Three random instruments to start, no more offered. | 4 runes, x1.5 | circle x1.22 | `P:2200` |

A rune is lit the first time a reagent is used; a full circle multiplies E and starts again; a broken row puts the last rune out.

## 3. The spec (the task) and the number to beat

### 3.1 What a round is won by

A round is won when BOTH hold (`roundWon`, `P:2609`):

1. the spec is met (every part of it), and
2. the yield is at least the pass line: `needShare x number to beat` (`P:2604-2605`).

In the Bachelor's the pass share is 0 (`RULE.needParB` null): the spec alone wins. Yield then pays gold only.

| Run length | Pass share of the number to beat, by round | Where |
| --- | --- | --- |
| Bachelor's | 0 (spec alone) | `P:849` |
| Master's | 0.36, 0.53, 0.39, 0.65, 1.16, 1.09 | `P:859` |
| Doctorate | 0.36, 0.53, 0.39, 0.65, 0.83, 0.70, 1.48, 2.04, 2.18 | `P:859` |

### 3.2 The number to beat

`nice(PAR[round] x signBar x molecule factor x brief factor x stake)` (`P:2232-2234`). Molecule factor is 1 (no table). `nice` rounds to two significant digits.

| Round | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Number to beat | 4,800 | 5,100 | 5,500 | 5,900 | 7,000 | 8,800 | 9,800 | 11,000 | 12,000 |
| Mark 1 (x1.41) | 6,800 | 7,200 | 7,800 | 8,300 | 9,900 | 12,000 | 14,000 | 16,000 | 17,000 |
| Mark 2 (x2) | 9,600 | 10,000 | 11,000 | 12,000 | 14,000 | 18,000 | 20,000 | 22,000 | 24,000 |
| Mark 3 (x2.83, OVERREACT) | 14,000 | 14,000 | 16,000 | 17,000 | 20,000 | 25,000 | 28,000 | 31,000 | 34,000 |
| Doctorate pass line | 1,728 | 2,703 | 2,145 | 3,835 | 5,810 | 6,160 | 14,504 | 22,440 | 26,160 |
| Master's pass line | 1,728 | 2,703 | 2,145 | 3,835 | 8,120 | 9,592 | | | |

Assay rounds (3, 6, 9) multiply the number to beat by (round 3 / 6 / 9): scarce 0.83 / 1.07 / 0.92, short 0.79 / 0.56 / 0.73, each 1.24 / 1.32 / 1.16, loose 1.23 / 1.28 / 1.29 (`P:2219`). Stakes multiply it: Occult x1.22 (the pact x1.41, idol x1.22, hourglass x1.12 are not obtainable now). Each sign multiplies it by 1.15 (1.15, 1.32, 1.52) (`P:879`).

### 3.3 The spec

One spec a round (two from round 6 in the Master's and Doctorate; both must be met). It is shown as a goal picture and a count. Each is an "at least N" read from the molecule or the round (`P:2304-2330`, `SPEC_TABLE`). N is the largest whose share of aiming test players clears the target for the round: 80, 65, 58, 90, 87, 81, 78, 73, 68 in 100 for rounds 1 to 9, then scaled: Bachelor's rounds 1 to 3 x0.15, x0.36, x0.45; Master's/Doctorate rounds 1 to 3 x0.30, x0.35, x0.70 (`P:825-830`, `P:864`, `P:2658-2695`).

| Family | Specs ("at least N ...") | Open from |
| --- | --- | --- |
| shape | more six-atom rings; more rings sharing a side; more separate ring groups | Master's |
| size | atoms bigger than the start; more forks; longer chain; atoms smaller (start / finish); turns ending smaller | all |
| makeup | more kinds of group; non-carbon atoms; double bonds; atoms in alternating bonds; rings and double bonds; C=O at the finish; C=C at the finish | all |
| chain | reflexes after the first reagent (banned in the Bachelor's); reflexes after the last reagent; ring-closing reflexes | all |
| runoff | runoff over the round; hydrogen in the runoff; carbon dioxide in the runoff; more water than other runoff; more gas than water | all |
| restraint | turns firing fewer than three (a rider, round-dependent) | all |

Banned in Bachelor's/long rounds 1 to 2: cut_down, double_bonds, unsaturation, lean_turns (round 1); end_CO, off_hydrogen (round 2) (`P:830`, `P:861`). Two specs never share a family or a plan (`specClash`).

Tally counter: the chosen page counts twice toward the spec (`counterBonus`, `P:1490`). Brimstone's tap counts the spec as met (`specMet`, `P:2596`).

### 3.4 Pass, near miss

- Passing the number to beat is its own thing: it earns the marks and interest below. It is not the same as winning the round in the Master's/Doctorate (the pass line is a different number, usually lower early and higher late).
- A near miss (lost by under 15 in 100: spec met and yield >= 0.85 of the pass line, or yield >= the pass line and spec >= 0.85 done) feeds an unlock (`roundNear`, `P:2607`).

## 4. The marks and the gold

### 4.1 The track

Four lines on the track, in raw multiples of the number to beat: 1, 1.41, 2, 2.83 (`RULE.tiers` `[1.41, 2, 2.83]`, `P:625`; `marksOf` `P:2240`). These are NOT 2x, 4x, 8x (see 8.1). The code letters a word at each: stable, unstable, volatile, overreact (`S:4292`, `WORDS` `P:2697`). The marks are `nice` rounded: with number 9,800 the marks are 14,000, 20,000, 28,000. Exactly reaching the number to beat reaches no mark (9,800 -> 0 marks; 14,000 -> 1; 20,000 -> 2; 28,000 -> 3).

### 4.2 What pays gold (a round's gold)

| Source | Gold | Condition | Where |
| --- | --- | --- | --- |
| Each mark above the number | 1 each, 0 to 3 | yield >= number to beat | `COIN.mark`, `P:2246-2249` |
| Interest | floor(gold held / 3), at most 2 | yield >= number to beat; counted on gold held before this round's pay | `P:2248` |
| Cleared a round | 1 | spec and pass line met; not in the Bachelor's | `P:2703` |
| The harder molecule of the pair | 1 if its ease is 0.5 below the other, 2 if 2.0 below | paid if the round is won (even under the number to beat) | `P:2141-2143`, `P:2702` |
| Leave the shop with nothing (the door) | 1 | | `COIN.skip` `P:2251` |
| Aqua Permanens taken | 8 | and the sigil is gone after 2 rounds | `P:956-960`, `P:2704` |

Example (run): gold held 7, number to beat 9,800, total 20,000. Marks reached: 2 (14,000 and 20,000) = 2 gold. Interest: floor(7 / 3) = 2. Clear: 1. Total 5, so the tin holds 12. (`runEarn` alone returned 4 and left 11; the clear gold is added afterwards in `roundEnd`.)

Maximum one round: 3 marks + 2 interest + 1 clear + 2 hard molecule = 8.

Gold lives inside a run only. It is called the tin on the page. Credit (a separate currency, 6.1) is not gold.

### 4.3 What gold buys

| Item | Price | Where |
| --- | --- | --- |
| Pair re-deal (two new molecules) | 1, then 2, then 3 in a round; a fourth is refused | `pairCost`, `P:2158`; from round 2 |
| Shop re-deal of the three picks (the bell) | 1, then 2, then 3, then 4 ... in one visit | `rerollCost`, `P:2247` |
| The shelf reagent (a fourth, priced pick) | list price + 1 for every shelf reagent already bought this run | `offerList`, `P:130-132` |
| Throw an instrument away (`runBin`) | 2 | `COIN.bin` `P:2260`; the call is in the older pick screen (`S:1445`); not checked in the bench shop |
| A sigil | 1 to 7, plus 2 for each sigil already held | `SIGIL_GET`, `P:956`, `P:964` |
| A use of a reagent (`RULE.sink`) | 1, 2, 3 | switched off | `P:2255-2259` |

Shelf prices (list, before the +1s): Hydroborate 3, Reduce 2, Extend (hwe) 4, Dihydroxylate 5, Cleave 9, Burn 2, Chlorinate 2, Cyanate 2, Eliminate N 3, Eliminate S 3, Formylate 6, Epoxidize 7 = `max(1, floor(2 + 7 x worth + 0.5))` (`P:130`).

The three free picks in the shop (Master's/Doctorate with earned reagents): three reagents drawn from the run's stock (5 reagents drawn from the earned ones at the start of the run, `OFFER_K.stock`). One of the three is replaced by an owned instrument when the run carries fewer than 5 (`P:2267`). In the Bachelor's, or with nothing earned: two picks, a grade for one reagent (x3 places) and +1 use of one (`P:2261-2284`).

## 5. Multipliers and rule changes

### 5.1 Reflexes

The thirteen kinds are held from the start except Seal (earned), Open and Fold (earned). Across-the-fold kinds are held from round 4. Every reflex step pays the same (2.3, 2.4) wherever it is. What differs: the step limits per page (ring 2, dry 1, weld 2, each across kind 1), what leaves (dry: water; close: acid fumes; bridge: hydrogen; seal, knit across, link: water) and whether Gemini or the mask touch it (5.4).

| Reflex | Does | Gives off | Deed to earn |
| --- | --- | --- | --- |
| Ring, Dry, Weld, Shift, Tuck, Flip, Snap, Close, Cap, Knit | start | Dry: water. Close: acid fumes | start |
| Seal | A COOH and an OH, NH2 or SH join in a ring | water | End a round with a COOH the molecule was not dealt |
| Open | An OH springs an epoxide into a ring | | Make 2 epoxides with one Epoxidize |
| Fold | An epoxide turns to C=O | | 3 uses of Epoxidize |
| Across the fold (12: Ring, Weld, Tuck, Snap, Seal, Close, Knit, Cap, Open across; Bridge, Stitch, Link) | The near twin, facing across the fold | | From round 4 with the twin held |

### 5.2 Reagents

Only places (2.3) and the Wacker/Wolff/finisher extras. No reagent changes yield in any other way. Instruments of reagents: there are no levels (the level pick cannot appear: every live instrument is a rule piece).

### 5.3 Instruments (the ten live ones)

Only instruments of `FIVE` are offered (`P:783`, `RULE.five`). Used while a page is lined up. At most 2 uses on the whole round (`RULE.bench`, `P:806`); each tool once a round (`TOOLUSES`, `P:797`). Carousel, Dropper and Timer are always on and do not count against the 2. Steps a tool sets off pay x `toolPay` (their places, E and the n-multiplier), until the next reagent is fired.

| Instrument | Effect | toolPay | Where |
| --- | --- | --- | --- |
| Seed crystal | One H on a chosen carbon becomes OH; the molecule zips | x0.5 | `P:801` |
| Burner (bunsen) | Every OH that can lose water does | x2 | `P:801` |
| Burette | Every C=C becomes C=O at its CH | x0.5 | `P:801`, `P:795` |
| Magnet | Every run of 4 or more plain CH2 shuts to 2 | x3 | `P:801` |
| Mirror | A bond: one side goes, the other copies across it | x1 | `P:717` |
| Carousel | +1 reagent in the hand on page 1 | | `P:1189` |
| Dropper | +2 uses of every reagent | | `P:802` |
| Timer | A fourth circle every page | | `P:1031` |
| Tally counter | One page counts twice toward the spec | | `P:1490` |
| Condenser | One more page, for the spec only. The yield is frozen when it starts. | | `P:1974` |

### 5.4 Sigils (the nine)

Rules: up to 3 held (`RULE.sigilCap`). Bought with gold (price 1 to 7 + 2 per held), from the visit after round 1, two shown (`P:956`, `P:965`). **No screen in the game offers them** (section 8.2). In the code each does this:

| Sigil | Rule change | Score effect | Price | Where |
| --- | --- | --- | --- | --- |
| Phlogiston | Oxidize also takes two hydrogens beside every C=O and leaves a C=C | more reaction places | 7 | `P:921` |
| Clepsydra | 4 pages a round | one more page of everything | 3 | `P:1169` |
| Via Humida | Rings close through O, N or S as through carbon | more reflex steps | 3 | `P:923` |
| Solve | Dry, weld and ring have no limit; once each across the fold | more reflex steps | 7 | `P:924` |
| Aqua Permanens | No water leaves (reflexes that give off water are off) | none; pays 8 gold, lasts 2 rounds | pays 8 | `P:925`, `P:2704` |
| Tetractys | 4 circles a page; the reflexes after the last reagent pay x3, not x2 | lx 3 | 3 | `P:926`, `P:1319` |
| Respiratio | The limits on dry, weld, ring start again after every reagent | more reflex steps | 2 | `P:927` |
| Gemini | A reagent or reflex that works on a C=C or C=O: its places x2 | places x2 on those | 5 | `P:928`, `P:992` |
| Sulphur's Mask | An OH closes its ring first, like sulfur. The first two rings an OH closes on a page each count twice. | two extra steps a page | 3 | `P:929`, `P:1334` |

### 5.5 Creatures (the ten)

A creature acts once a round: after a page has fired and before it turns, when its condition holds, the player taps it (`RULE.homOnce`, `P:1695`). A tap multiplies E, so it multiplies everything made so far and later. Only in a Doctorate. One creature goes into a run, chosen from those whose jar has filled. Brimstone works once a run (`RULE.brimOnce`).

The five numbers are the yield multiplier at stages 1 to 5, read on the yield scale (`HOMGROW.read`, `P:1763`; the tap multiplies E by the square). A creature's stage is set by its jar's lifetime count and kept across runs (`RULE.homGrow` 'keep'): stage n+1 at `[2, 4, 7, 11] x jar size` (`P:1762`, `P:1783`).

| Creature | Lit when (a page, with the tap) | Tap | Stage 1 to 5 | Jar size / stage 2, 3, 4, 5 at | Fed by (lifetime) | Where |
| --- | --- | --- | --- | --- | --- | --- |
| Water | 3 waters driven off this page | Flood: every C=C outside a benzene ring becomes C-OH, loose rings burst and close again; the zip then runs | 1.36, 1.83, 2.19, 2.54, 2.92 | 200: 400, 800, 1,400, 2,200 | waters driven off | `P:1678`, `P:1826` |
| Hydrogen | 2 hydrogens driven off this page | x | 1.50, 1.86, 2.15, 2.39, 2.75 | 130: 260, 520, 910, 1,430 | hydrogens driven off | `P:1679`, `P:1827` |
| Dry ice | Last page only, with 3 reagents of the rack that never acted this round | x | 1.91, 2.40, 2.82, 3.89, 4.50 | 50: 100, 200, 350, 550 | carbon dioxide driven off | `P:1680`, `P:1831` |
| Acid | The molecule 2 or more atoms smaller than at the page start | x; each atom more x1.20 | 1.92, 2.50, 3.11, 3.20, 3.20; cap x3.20 on the stage number only | 200: 400, 800, 1,400, 2,200 | uses of Hydrate or Dehydrate | `P:1681`, `P:1832`, `P:1797` |
| Wood spirit | A reagent in the page's 3 circles found nothing | x | 1.54, 1.72, 1.88, 2.08, 2.38 | 250: 500, 1,000, 1,750, 2,750 | reagents that found nothing, uses of Reduce | `P:1682`, `P:1828` |
| Salt | This page's first reagent is last page's first reagent | x; that reagent's use returns | 1.54, 1.87, 2.13, 2.36, 2.64 | 50: 100, 200, 350, 550 | chain-end OH oxidized | `P:1683`, `P:1835` |
| Slime | One reagent landed twice on the page, both landing | x; that bottle is empty for the round | 1.55, 1.76, 1.98, 2.17, 2.38 | 70: 140, 280, 490, 770 | pages with one reagent landed twice, uses of Hydroborate | `P:1684`, `P:1833` |
| Ammonia | Aminate landed, or a Knit step | x; the line fires again (uses return, circles added) | 1.24, 1.48, 1.73, 1.96, 2.21 | 40: 80, 160, 280, 440 | Aminate landings, ammonias driven off | `P:1685`, `P:1836` |
| Seedling | 6 atoms added this page | x; each atom more x1.06 | 1.19, 1.38, 1.54, 1.79, 2.16 | 120: 240, 480, 840, 1,320 | uses of Grow | `P:1686`, `P:1837` |
| Brimstone | Thiolate landed, or a Cap step; any page | x; each sulfur past the first x1.12; the round ends and the spec counts as met; once a run | 1.17, 1.30, 1.39, 1.52, 1.59 | 80: 160, 320, 560, 880 | Thiolate landings, sulfurs driven off | `P:1687`, `P:1829` |

Per-atom creatures, read values by count above the creature's base (Acid base 2 atoms, Seedling 6, Brimstone 1 sulfur; with the Mask every OH counts as a sulfur), at the third stage:

| Past base | 0 | 1 | 2 | 3 | 4 | 6 | 10 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Acid (stage 3) | 3.11 | 3.73 | 4.48 | 5.37 | 6.45 | 9.29 | 19.26 |
| Acid (stage 5) | 3.20 | 3.84 | 4.61 | 5.53 | 6.64 | 9.56 | 19.81 |
| Seedling (stage 3) | 1.54 | 1.63 | 1.73 | 1.83 | 1.94 | 2.18 | 2.76 |
| Brimstone (stage 3) | 1.39 | 1.56 | 1.74 | 1.95 | 2.19 | 2.74 | 4.32 |

Example (run): Water at stage 3, 4 waters off the page. Before the tap: made 1,471 (E 1.3). After: made 3,222 (E 6.235). Ratio 2.19. The tap works on everything already made.

### 5.6 The sign (prestige)

Needs 58 of the 64 things of the book (`SIGN.share` 0.9). Three laps. Each: yield lift +0.2 (added: x1.2, x1.4, x1.6), number to beat x1.15 (compounding: 1.15, 1.32, 1.52). The collection starts again; the catalog of compounds made, what was taught, names given and lifetime counts are kept (`P:875-893`).

## 6. Deeds, unlocks and progress

### 6.1 What is counted for what

| Counter | Affects score? | Affects unlocks? |
| --- | --- | --- |
| Creature jars (lifetime) | Yes: stage numbers (5.5) | Hatching a creature |
| Signs taken | Yes: lift and number to beat | |
| Credit | No | Buys suppliers (6, 16, 30, 50, 80) and families (5, 8, 14). Earned: 1 per round cleared, +2 per assay cleared, plus the ladder. Whether the supplier shop can be reached in normal play was not checked. |
| All other counters (`meta.counters`) | No | Yes, through the ladder |

### 6.2 The ladder (`P:231-264`)

A rung is earned once. At most 2 rungs are handed out per run (`LADDER_CAP`; the rest wait for the next run). Deeds marked "Master's" count only in a Master's or Doctorate run. A depth rung is the first clear of round n in a long run.

| Thing | How |
| --- | --- |
| Master's | Win a Bachelor's |
| Doctorate | Win a Master's |
| Instruments | Seed crystal: clear a round whose first page set off no reflex. Burner: drive off water on every page of a round. Burette: turn 5 OH to C=O with one Oxidize. Mirror: fill a page with one reagent. Magnet: end a round with the longest carbon chain 4 longer than dealt. Carousel: fire 6 different reagents in one round. Dropper: use up 4 reagents in one round. Timer: set off a reflex with each of a page's three reagents. Tally counter: lose a round by under 15 in 100. Condenser: lose 2 rounds on the spec alone. (all Master's) |
| Reagents | Epoxidize: make 5 C=C with one Dehydrate. Extend: end a round 10 atoms bigger. Burn: carbon dioxide on 2 pages of one round. Hydroborate: land Hydrate, Dehydrate, Hydrate on one page. Cyanate: end a page with 3 more C=O. Reduce: end a round with no C=O on a molecule dealt two or more. Chlorinate: close 2 rings with chlorine in a round. Formylate: add 4 arms with one Grow. Cleave: end a page with 4 more C=C. Dihydroxylate: put on 4 OH with one Hydrate. Eliminate N: land Aminate and close a ring through N on a page. Eliminate S: land Thiolate and close a ring through S. Wacker: Oxidize an OH Hydrate/Hydroborate just made. Wolff: Reduce or Hydroborate, then Dehydrate, then Hydrogenate on what the last made. Families: Add methyl (5 credit), Methylenate (8), Polymerize (14). |
| Motifs | Spiro: close 3 rings on one page. Benzene: end a round at 1.41 x the number to beat on a molecule with a benzene ring. Shared side: end a round with 3 more shared sides. Cage: end a round with 6 more rings. |
| Reflexes | Seal, Open, Fold (5.1) |
| Sigils (all Master's) | Clepsydra: lose a round whose last page chained 3 reflexes. Solve: reach two limits on one page. Respiratio: Dry on every page of a round. Phlogiston: drive off 5 hydrogens on one page. Via Humida: close rings through O, N and S in one run. Aqua Permanens: clear a round with no water driven off. Tetractys: 4 reflexes with a full page's last reagent. Gemini: end a page with more C=C and more C=O. Sulphur's Mask: close 4 rings with sulfur in one round. |
| Soundtracks | Gothic: clear round 3 (Master's). Harpsichord: clear round 6 (Master's). Chain Lightning: end a round at OVERREACT (2.83 x). Monster-movie lab: 5 kinds of reflex in one round. |
| Terms | Glass: beat a round with no row break in 6 or more circles. Occult: clear 5 rounds in a run. Lean: beat a round firing 2 kinds of reagent or fewer. Long: a row of 10. Hoard: hold 5 instruments in a run (`deeds`, `P:2185`). |
| Credit | Depth rungs 1, 2, 2, 2, 3, 5, 10 for rounds 1, 2, 4, 5, 7, 8, 9 (rounds 3 and 6 give the soundtracks); chain 4 / 6 / 9 give 1 / 1 / 2; marks 1.41 / 2 give 1 / 2; counts of rounds, wins, losses, reflexes and rings give 1 to 5 each. 82 credit in all. |

### 6.3 Which creature jar fills from what

See the "Fed by" column in 5.5. The counts are banked at the end of every round, win or lose (`runBank`, `S:1853`). A creature hatches when its jar is full; the Wood spirit and Slime jars also fill from an ordinary play (`RULE.jarStart`, `P:1884`).

## 7. What loses points or ends things

| Thing | What happens | Where |
| --- | --- | --- |
| A lost round | The run is over. A round is lost if the spec is unmet or (long runs) the yield is under the pass line. | `P:2710` |
| A row break | The row's P x R is banked (kept); R goes back to 1 and P to 0. Nothing already made is removed. | `P:1284` |
| Glass: first row break | The round ends there, no later pages. | `P:1406-1428` |
| Brimstone's tap | Ends the round at once (spec met). Pages left are not played. Gone for the run. | `P:1687`, `P:2705` |
| The finisher | Ends the round at once; circles after it are not played. | `P:1990` |
| A wasted circle | A reagent that finds nothing takes its circle and a use; nothing is added. Feeds Wood spirit. | `P:1953` |
| A page where nothing can be played | The page turns itself; the three circles of it are not spent (no yield lost, no use lost). | `S:1886` |
| Loose rings at a page turn | Rings a zip closed open again. Ring motifs do not count them (2.6). The chain is set off again. | `P:1215`, `P:562` |
| Aqua Permanens | Gone after 2 rounds (it paid 8 gold when taken). | `P:2704` |
| Gold not spent | Earns interest only up to 2. | `P:2248` |
| Slime's tap | That reagent is empty for the round. | `P:1833` |
| Reagent uses | A reagent with no use left cannot be fired. | `P:1926` |
| Instrument bench | Two instrument uses per round. | `P:806` |
| "Struck" motifs | A motif stops paying the moment the molecule no longer holds it (read after every reaction). The page strikes the mark through. | `P:1348` |

## 8. Things that are unclear or look wrong

### 8.1 Where the docs, notes and code disagree (code wins)

| What | Docs / notes say | Code does |
| --- | --- | --- |
| Marks above the number | "2, 4 and 8 times" (`docs/RIG.md:2873`, `docs/HARNESS.md:293`, `docs/PASS.md:80`; notes: "Marks at x2, x4, x8", "An overreact is the yield passing eight times the spec", `N:162`, `N:170`; and your brief) | 1.41, 2, 2.83 times the number to beat (the square roots; `P:625`). The notes also say "the spec" where the code means "the number to beat". |
| Creature numbers in the margin notes | Water "one and a half times", Acid "doubled", Salt "two and a half times", Wood "up a quarter" (`N:196-223`) | 1.36 to 2.92 (Water), 1.92 to 3.20+ (Acid), 1.54 to 2.64 (Salt), 1.54 to 2.38 (Wood), by stage |
| Seedling | Notes: "pays more each page in a row", "cuts the yield on a page that grows less" (`N:216-217`) | One flat number per stage, no rise, no wilt (`rise: false`) |
| Hydrogen | Notes: "oxidize last, three reflexes, carries the chain, a shorter chain drops the yield" (`N:196-199`) | Drive off 2 hydrogens: x. No carry, no pop (simplified) |
| Brimstone | Notes: "pays more after page one than after page two" (`N:223`) | One number, any page; each sulfur x1.12 |
| Dry ice | Notes: "carbon dioxide came off and three reagents never acted" | No carbon dioxide needed (`noCO2`) |
| Water | Notes: "four waters" | 3 waters |
| Interest | Notes (`N:181`): "interest each round the spec is met" | Needs the yield past the number to beat, not the spec (`P:2249`) |
| `run.js` header | "eight orders ... yield times batch" | That is the old game. The live game is `path.js`. `run.js` is read only for its 10 routes and test dials. |
| HARNESS AJ | "OVERREACT alone ... No word at the lower marks" | The code letters four words (stable, unstable, volatile, overreact) at the four marks (`S:4292`). Not checked on screen. |
| Sigils | HARNESS AW and AY: bought with gold; the book lists nine unlockable sigils | The buy code exists (`sigilVisit`, `sigilGet`) but nothing in `scheme.js` calls it. A sigil can be held only by `?sigil=` in the address or the debug hook (`S:5103`). |

### 8.2 Looks wrong or unbalanced

1. **Two scales, never labelled.** Callouts write raw numbers ("times 2", "+0.1"); the book writes yield numbers ("x1.03"). A player who adds callouts cannot reproduce the page's number. The P x multiplier readout is switched off in code (`if (false)`, `S:4086`).
2. **Sigils cannot be had** in a normal game, yet they are in the book as unlockable, are priced, and notes mention them.
3. **Acid stages 4 and 5 are the same** (x3.20): the cap on the stage number removes the reason to evolve. Only atoms past 2 differ (x1.20 each, uncapped).
4. **Uneven creature steps.** Dry ice jumps 2.82 -> 3.89 -> 4.50; Acid is flat at the top; Hydrogen/Ammonia are the weakest (1.24 to 2.75). Per-atom creatures can run very high: Acid stage 3 with 10 atoms past base is x19.26 (a tap on the yield).
5. **"Number to beat" is not the pass line in long runs.** In the Master's and Doctorate the pass line is 0.36 to 2.18 times it: 36 per cent of it in round 1, 218 per cent in round 9 of a Doctorate. The briefing shows the pass line there (`S:1657`); the track shows the number to beat.
6. **Gold is thin.** At most 8 in a round; prices 2 to 9 per shelf reagent, +1 each; a sigil 3 to 7+. No gold at all for clearing in the Bachelor's.
7. **Passing the number to beat pays no mark.** The first mark gold is at 1.41 times. A round won at 1.0 to 1.4 times pays only the clear gold and interest.
8. **A win without the number** (spec met, yield above a low pass line) pays no marks and no interest; it pays only the clear gold and the hard-molecule gold.
9. **Hidden costs.** A reagent that finds nothing still takes its circle and a use. The re-deal costs a use (except in a Bachelor's). The Bank and the finisher end rows and rounds. The finisher's tail circles are lost.
10. **Last circle doubles reflexes.** Whatever the last circle sets off pays x2 places and x2 E-addition. Nothing on screen says the order of the three matters this way (notes do not mention it either).
11. **Fold steps count twice** in n (and so in the n-multiplier and E). Nothing says so.
12. **Quarter rule is easy to miss.** A chain that zips again on every page earns only 25 per 100 of the n-bonus up to the best earlier length. The note exists (`N:116`) but only as a filler line.
13. **Ring motifs ignore loose rings.** A ring that a zip closes is read as open (`motifsOf`, `P:562`), so it pays nothing for Ring, Shared side, Cage, Spiro or Benzene. The same ring is drawn shut on the page. Players will expect it to pay.
14. **Instrument levels cannot exist** (no level picks), and 50 older instruments with numbers are in `GEAR` but never offered (`RULE.five`); the book rows and old docs may still list them.
15. **Seed/molecule factors:** the molecule-size factor table is empty (`MOLF`), so a large and a small molecule of the same round have the same number to beat, but the large one pays more places.
16. **Rare reagent versions** (double, strong, plenty; 18 in 100 per reagent per page) occur only when the profile has opened the research supplier (supplier 3, 16 credit; `run.rare`, `P:2100`, `P:2168`). Whether the credit shop that opens suppliers is reachable in normal play was not determined.
17. **Credit shop.** Suppliers (6 to 80 credit) and families (5 to 14) exist in `S:1748-1749`. The ladder pays 82 credit in all plus 1 a cleared round. Not checked further.
18. **Carousel/Dropper/Timer** are always on and do not use the 2 bench uses, while the others compete for them. Not told to the player.
19. **Tally counter / Condenser** change only the spec, not the yield. The Condenser freezes the yield before its page.
20. **Not determined from the code**: the per-round value of N for each spec (stored in `SPEC_TABLE[k].use`, baked by a script); the exact pair rule for the hard-molecule gold in the assay rounds; what the term's gate says to a player (switched off).

## 9. What the player is told today

| Fact | Where it is told | How | Gap |
| --- | --- | --- | --- |
| The goal and the number (spec picture, number to beat or pass line) | Briefing page (`S:1657`) | A picture and a number | Number meaning (number to beat vs pass line) is not said |
| The four marks and the four words | The track (`S:4151`), lettering (`S:4292`) | Lines and words | The multiples (1.41, 2, 2.83) are not shown; only the numbers on the track |
| A reaction's places, row, extra | Callouts during play (`S:1915`) | "+20", "times 1.14", "row +0.1", "n in a row" | Raw scale, not the yield scale |
| What one motif pays | The book (`S:4930`) | The level dot, an arrow, "x1.03" | Level definitions are drawn; the raw/read split is not said |
| Creature numbers by stage | The book (row.stages), the evolve screen (`S:2884`) | Five numbers per creature | Per-atom steps are in the line ("Each atom more: x1.20"); lit conditions only partly |
| What a creature needs to be lit | The book line ("Wring out 3 waters. x1.36.") | One sentence | Notes say other things (8.1) |
| What an instrument does | The book (`REF_GEAR`, `P:421`) | One line each | The 2-uses-per-round limit, toolPay (x0.5 to x3) are told nowhere |
| What a reagent does | The card, the book (`REF_REAGENT`) | One line, drawn cases | Place values (20/30/45) are told nowhere |
| What a sigil does | The book | One line | There is no way to buy one |
| How to unlock a thing | The book | "How" line with a count | Credit amounts are told nowhere |
| Cascade n-multiplier | Notes `N:115-116`, `N:175` ("Step {n} paid {n} times step one"; the quarter note) | A margin note when it applies | Only some notes carry it; not in the book |
| The last-circle double (lx 2, or 3 with Tetractys) | Tetractys book line ("The fourth: x3") only | | Told nowhere for the base game |
| The Bank | A drawn object, a word "bank" (`S:4204`) | | What it pays (twice the open row) is told nowhere |
| Row growth (+0.35 reagent, +0.1 reflex), routes (+0.5 per extra link) | Route callout tags (`S:1958`) | A tag (Ketone, Slide ...) | The numbers are told nowhere |
| Gold sources and uses | Notes `N:181-187` ("Marks pay gold. Spec first.", interest), the shop objects | Short notes, pictures | Interest cap (2), clear gold (1), hard molecule (1 or 2) are told nowhere; note says "spec" for interest wrongly |
| Pass line and its share by round | Briefing (long runs) | A number | The share (0.36 to 2.18) is told nowhere |
| Yield = square root of the product | Nowhere | | Told nowhere (callouts vs book scale) |
| Uses (3 per reagent per round; unlimited in Bachelor's) | The use marks on the page | Pips | The Bachelor's exception and the rare 2 are told nowhere |
| Assay rules (rounds 3, 6, 9) | Nowhere visible (the label is `if (false)`, `S:3953`) | | Told nowhere |
| Terms' circle | Drawn under the molecule ("times 1.5"; `S:4006`) | The circle and its multiplier | Raw, not yield |
| Sign | The book row ("x1.20; the number to beat x1.15") | | |
| Isotopes (C13 +60, O18 +1 row, C14 x1.25) | Callouts | | The rule and chances are told nowhere |
| Loose rings do not pay ring motifs | Nowhere | | |
| Finisher (E +0.5 per place, ends the round) | A letter "F" on the circle | | Told nowhere |

Facts explained nowhere (for the in-game scoring page): yield is the square root of places x row x extra, banked rows, the 20 / 30 / 45 place values, 50 places for a reflex step, the row's +0.35 / +0.1, route bonuses, the last circle's double, fold steps counting twice, the quarter rule's exact size, the finisher, the Bank's pay, the pass line versus the number to beat, gold sources and caps, the assay rules, tool pay (x0.5 to x3) and the 2-use bench limit.
