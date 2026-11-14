# Overreact: the reference book

Everything a player can get that a new game does not hold, and the eight motifs it does hold, by category: what it is called, what it does, and the one way to get it. A way that ends "Master's." counts only in a run of six rounds or more. This file is written from the game's own table, `P.reference(meta)` in `path.js` (`python docs/tools_chem/sweep_refdoc.py` after the job `ref19.js` and `sweep_deeds.py career`), so it says what the rules say. Every line is in the pattern of the manual (ruling BA): the thing and one verb of its own, the act, then just the number; everything is per page unless the line says otherwise. In the game the book shows a thing that is not yet owned with its name and how to get it, and hides what it does.

Since the sixteenth measure every thing is got by a deed that fits it ("More deeds, fewer counts"). The lifetime counts left are the ten jars and Fold (epoxidize acts 3 times); the condenser asks for 2 rounds over all runs. No two things share a way. "Runs" is the run on which the thing is handed over in the middle career of 200 simulated careers of 300 runs, for the casual player and then the careful one; a run hands over two things at most, so in the first twenty runs a deed can be handed over up to about 19 runs after it was done. Both runs are given: the run the deed is done, then the run the thing is handed over.

For the page: `P.reference(meta)` gives one row a thing: `id`, `category`, `name`, `does`, `how`, `owned`, `nums` (the numbers of the line in order), and `count` and `target` where the way has a number; a homunculus also has `stages` (its five numbers) and `stage` (how far this profile has brought it). `P.thingOf(category, id)` gives the name and line of any thing, the ones a new game holds too. `P.REFERENCE_CATS` is the order and the names of the categories. `P.profileOpts(meta)` is what `P.runNew` needs so that a run offers what the profile holds and nothing else. `P.runResult(run).earned` lists what a run handed over, each with the thing's `name` and `how`. `P.stageOf(meta)` and `P.gateOpen(meta, what)` are what the page's own gate should read.

## How many

| Category | Things | How they are got |
|---|---|---|
| Reagents | 17 | Twelve by a deed in the reagent's own chemistry. Three bought with credit. Two found by firing others one after another. |
| Reflexes | 3 | Each by a deed that nearly makes it. All three need a reagent that is itself earned first. |
| Motifs | 12 | Eight are held from the start. The other four each by a deed with rings: many closed at once, many more than dealt, two that share a side, or a high yield on a benzene ring. More of a motif gives more: the number written is for the least that counts. |
| Instruments | 10 | Each by the kind of play it helps, done in a six-round or nine-round run. |
| Homunculi | 10 | Each hatches when its jar is full. These ten are the lifetime counts of the book (ruling K: jars fill across runs). |
| Sigils | 9 | Each by brushing against the rule it bends, in a six-round or nine-round run. |
| Terms of a run | 5 | Each by a deed, as the game had them. |
| Longer runs | 2 | Each by winning the run before it. |
| Soundtracks | 4 | Each by something reached. |
| The sign | 3 | By holding nine tenths of the book. |
| All | 75 | |

A new game holds: six reagents (hydrate, oxidize, grow, thiolate, dehydrate, aminate), ten reflexes (ring, dry, weld, shift, tuck, flip, snap, close, cap, knit), eight motifs, the three-round run, two soundtracks, and nothing else.

## Reagents (17)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Epoxidize | Epoxidize straddles. Every C=C turns to an epoxide. | Make 5 C=C with one dehydrate. | 13, 13; 3, 9 |
| Extend | Extend lengthens. An aldehyde or methyl ketone C=O turns to C=C beside a new ketone. | End a round 10 atoms bigger than dealt. | 2, 3; 1, 1 |
| Burn | Burn scorches. Chain-end C=C, aldehydes and chain-end CH2-OH turn to COOH. | Drive off carbon dioxide on 2 pages of one round. | 4, 8; 3, 10 |
| Hydroborate | Hydroborate soaks. A C=C takes OH on the carbon with more H and a C=O turns to C-OH. | Land hydrate, dehydrate, hydrate on one page. | 24, 24; 4, 10 |
| Cyanate | Cyanate sours. An aldehyde or methyl ketone C=O turns to C(OH)-COOH. Ammonia leaves. | End a page with 3 more C=O than dealt. | 12, 13; 7, 11 |
| Reduce | Reduce softens. C=O turns to C-OH. | End a round with no C=O on a molecule dealt two or more. | 2, 2; 2, 10 |
| Chlorinate | Chlorinate swaps. The OH of a primary or secondary alcohol turns to Cl. | Close 2 rings with chlorine in one round. | 2, 3; 2, 11 |
| Formylate | Formylate tips. Every C=C takes CHO on the carbon with more H. | Add 4 arms with one grow. | 8, 11; 5, 12 |
| Cleave | Cleave cuts. Every C=C splits into two C=O. | End a page with 4 more C=C than dealt. | 11, 13; 7, 13 |
| Dihydroxylate | Dihydroxylate pairs. Every C=C takes an OH on both carbons. | Put on 4 OH with one hydrate. | 6, 11; 2, 13 |
| Eliminate N | Eliminate N strips. An NH2 leaves and a C=C forms toward the neighbor with more H. | Land aminate and close a ring through nitrogen on one page. | 3, 8; 2, 14 |
| Eliminate S | Eliminate S sheds. An OH leaves and a C=C forms toward the neighbor with more H. Sulfur leaves. | Land thiolate and close a ring through sulfur on one page. | 4, 11; 4, 14 |
| Add methyl | Add methyl plants. A C=O takes CH₃ and turns to C-OH. | Buy the organometallics. 5 credit. | not simulated |
| Methylenate | Methylenate trades. The O of a C=O turns to CH₂, leaving C=C. | Buy the ylides. 8 credit. | not simulated |
| Polymerize | Polymerize chains. Every C=C starts a chain. A second use doubles each chain. | Buy the radicals. 14 credit. | not simulated |
| Oxidize C=C | Oxidize C=C converts. A C=C turns to C=O on the carbon with fewer H. | Oxidize an OH that hydrate or hydroborate just made. | 2, 2; 1, 1 |
| Strip C=O | Strip C=O scrubs. A C=O turns to CH₂. | Reduce or hydroborate, then dehydrate, then hydrogenate, each on what the last one made. | not simulated |

## Reflexes (3)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Seal | Seal locks. A COOH and an OH, NH2 or SH 3 or 4 carbons apart join in a ring. Water leaves. | End a round with a COOH the molecule was not dealt. | 12, 15; 13, 17 |
| Open | Open unlatches. An OH 3 or 4 carbons from an epoxide opens it and closes a ring. | Make 2 epoxides with one epoxidize. | 35, 35; 44, 44 |
| Fold | Fold flattens. An epoxide with a carbon on both ends turns to C=O. | 3 uses of epoxidize. | 45, 45; 58, 58 |

## Motifs (12)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Sugar | Sugar stacks. Keep a carbon with an OH. x1.03. | From the start. | not simulated |
| Resonance | Resonance ripples. Keep two double bonds one single bond apart. x1.08. | From the start. | not simulated |
| Ring | Ring holds. Keep a ring outside benzene and cages. x1.02. | From the start. | not simulated |
| Branch point | Branch point forks. Keep a carbon holding three carbons. x1.02. | From the start. | not simulated |
| Long chain | Long chain trails. Keep three plain carbons in a row. x1.06. | From the start. | not simulated |
| Amine | Amine hooks. Keep an amine nitrogen. x1.10. | From the start. | not simulated |
| Sulfur bridge | Sulfur bridge joins. Keep a sulfur between two atoms. x1.16. | From the start. | not simulated |
| Acid group | Acid group anchors. Keep a COOH. x1.12. | From the start. | not simulated |
| Spiro centre | Spiro centre pivots. Keep two rings meeting at one atom. x1.05. | Close 3 rings on one page. | 5, 12; 2, 15 |
| Benzene ring | Benzene ring steadies. Keep a benzene ring. x1.14. | End a round at 1.41 times the number to beat on a molecule with a benzene ring. | 10, 15; 4, 15 |
| Shared side | Shared side braces. Keep two rings sharing a side. x1.07. | End a round with 3 more shared sides than dealt. | 3, 13; 2, 16 |
| Cage | Cage encloses. Keep rings tied into a cage. x1.01. | End a round with 6 more rings than dealt. | 9, 15; 4, 17 |

## Instruments (10)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Seed crystal | Seed crystal seeds. A hydrogen on the carbon you pick turns to OH. Once a round. | Clear a round whose first page set off no reflex. Master's. | 7, 7; 5, 6 |
| Burner | Burner heats. Every OH that can lose water leaves a C=C. Once a round. | Drive off water on every page of a round. Master's. | 3, 5; 2, 5 |
| Burette | Burette drips. Every C=C outside a benzene ring turns to C=O. Once a round. | Turn 5 OH to C=O with one oxidize. Master's. | 8, 9; 5, 6 |
| Mirror | Mirror reflects. One side of the bond you pick is copied over the other. Once a round. | Fill a page with one reagent. Master's. | 21, 21; 15, 15 |
| Magnet | Magnet pulls. Every run of four or more CH2 shuts to two carbons. Once a round. | End a round with the longest carbon chain 4 longer than dealt. Master's. | 9, 10; 9, 9 |
| Carousel | Carousel deals. One more reagent on the first page of a round. | Fire 6 different reagents in one round. Master's. | 4, 5; 3, 6 |
| Dropper | Dropper refills. Two more uses of every reagent. | Use up 4 reagents in one round. Master's. | 11, 11; 7, 8 |
| Timer | Timer widens. Four reagents a page. | Set off a reflex with each of a page's three reagents. Master's. | 11, 12; 4, 8 |
| Tally counter | Tally counter tallies. One page counts twice toward the task. Once a round. | Lose a round by under 15 in 100. Master's. | 8, 9; 6, 9 |
| Condenser | Condenser returns. One more page, for the task only. Once a round. | Lose 2 rounds on the task alone. Master's. | 6, 8; 10, 10 |

## Homunculi (10)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Water | Water floods. Wring out 3 waters. x1.36. Once a round. Double bonds soak up OH; closed rings burst. | 200 waters driven off. | 23, 23; 10, 10 |
| Hydrogen | Hydrogen lifts. Drive off 2 hydrogens. x1.50. Once a round. | 130 hydrogens driven off. | 30, 30; 12, 12 |
| Dry ice | Dry ice freezes. Leave 3 reagents untouched to the last page. x1.91. | 50 carbon dioxides driven off. | 15, 15; 8, 8 |
| Acid | Acid eats. Chew 2 atoms off the molecule. x1.96. Once a round. | 200 uses of hydrate or dehydrate. | 34, 34; 17, 17 |
| Wood spirit | Wood spirit drinks. Line up a reagent that finds nothing. x1.54. Once a round. | 250 reagents that found nothing, or uses of reduce. | not in 300, not in 300; not in 300, not in 300 |
| Salt | Salt preserves. Open with last page's first reagent. x1.54. Once a round. Its use returns. | 50 chain-end OH oxidized. | not simulated |
| Slime | Slime clings. Land one reagent twice. x1.55. Once a round. That bottle is shut all round. | 70 pages with one reagent landed twice, or uses of hydroborate. | not in 300, not in 300; not in 300, not in 300 |
| Seedling | Seedling sprouts. Add 6 atoms. x1.48. Once a round. | 120 uses of grow. | 24, 24; 13, 13 |
| Ammonia | Ammonia revives. Put nitrogen on the molecule. The three reagents go round again. x1.24. Once a round. | 40 aminate landings or ammonias driven off. | 22, 22; 19, 19 |
| Brimstone | Brimstone burns. Put sulfur on the molecule. The round ends; the task counts as met. x1.17. Once a run. | 80 thiolate landings or sulfurs driven off. | 60, 60; 78, 78 |

A homunculus acts once a round, on the page the player picks; Brimstone once a run; Dry ice only on the last page. The line above is a new profile's (stage 1). A homunculus keeps what it grows: its jar goes on counting after it hatches, and at 2, 4, 7 and 11 times the jar's size it reaches stages 2 to 5. Its number at each stage:

| Name | Stage 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Water | x1.36 | x1.83 | x2.19 | x2.54 | x2.92 |
| Hydrogen | x1.50 | x1.86 | x2.15 | x2.39 | x2.75 |
| Dry ice | x1.91 | x2.40 | x2.82 | x3.89 | x4.50 |
| Acid | x1.96 | x2.67 | x3.17 | x4.05 | x4.50 |
| Wood spirit | x1.54 | x1.72 | x1.88 | x2.08 | x2.38 |
| Salt | x1.54 | x1.87 | x2.13 | x2.36 | x2.64 |
| Slime | x1.55 | x1.76 | x1.98 | x2.17 | x2.38 |
| Seedling | x1.48 | x1.71 | x1.92 | x2.26 | x2.73 |
| Ammonia | x1.24 | x1.48 | x1.73 | x1.96 | x2.21 |
| Brimstone | x1.17 | x1.30 | x1.39 | x1.52 | x1.59 |

## Sigils (9)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Clepsydra | Clepsydra slows the clock. Four pages a round. | Lose a round whose last page chained 3 reflexes. Master's. | 13, 17; 14, 18 |
| Solve | Solve loosens. Dry, weld and ring have no limit. Once each across the fold. | Reach two of these on one page: dry once, weld twice, ring twice. Master's. | 7, 16; 3, 18 |
| Respiratio | Respiratio breathes. The limits on dry, weld and ring start again after every reagent. | Set off dry on every page of a round. Master's. | 5, 16; 3, 19 |
| Phlogiston | Phlogiston draws hydrogen. Oxidize also takes two hydrogens beside every C=O and leaves a C=C. | Drive off 5 hydrogens on one page. Master's. | 23, 23; 7, 19 |
| Via Humida | Via Humida opens the wet way. Rings close through O, N or S as through carbon. | Close rings through oxygen, nitrogen and sulfur in one run. Master's. | 6, 17; 5, 20 |
| Aqua Permanens | Aqua Permanens stills. No water leaves for 2 rounds. Gives 8 gold. | Clear a round without driving off water. Master's. | 8, 18; 23, 23 |
| Tetractys | Tetractys makes four. Four reagents a page. The fourth: x3. | Set off 4 reflexes with the last reagent of a full page. Master's. | 14, 20; 4, 21 |
| Gemini | Gemini doubles. Anything done to a C=C or C=O counts again. x2. | End a page with more C=C and more C=O than dealt. Master's. | 8, 19; 4, 21 |
| Sulphur's Mask | Sulphur's Mask disguises. Oxygen closes rings as sulfur does. The first two: x2. | Close 4 rings with sulfur in one round. Master's. | 73, 73; 34, 34 |

## Terms of a run (5)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Glass | Glass shatters. A round ends at the first reagent that does not carry on. x1.73. | Beat a round in which six reagents in a row each carry on. After two runs that cleared six rounds. | not simulated |
| Occult | Occult conjures. The run starts with one random instrument. Every number to beat x1.22. | Clear 5 rounds in one run. After two runs that cleared six rounds. | not simulated |
| Lean | Lean pares. Three of the starting reagents, one more use of each. | Beat a round firing two kinds of reagent or fewer. After two runs that cleared six rounds. | not simulated |
| Long | Long stretches. Four reagents a page, two pages a round. | Have ten reagents in a row each carry on, in one round. After two runs that cleared six rounds. | not simulated |
| Hoard | Hoard stockpiles. The run starts with three random instruments and is offered no more. | Hold five instruments in one run. After two runs that cleared six rounds. | not simulated |

## Longer runs (2)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Master's | Master's runs six rounds with instruments. Each needs its task and a pass mark. | Win a three-round run. | 1, 1; 1, 1 |
| Doctorate | Doctorate runs nine rounds. Instruments and one homunculus allowed. | Win a six-round run. | 18, 18; 6, 6 |

## Soundtracks (4)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Gothic hybrid | A soundtrack. | Clear round 3. Master's. | 4, 4; 2, 3 |
| Harpsichord unhinged | A soundtrack. | Clear round 6. Master's. | 18, 18; 6, 6 |
| Chain Lightning | A soundtrack. | End a round at OVERREACT. | 10, 20; 3, 22 |
| Monster-movie lab | A soundtrack. | Set off 5 kinds of reflex in one round. | 6, 20; 3, 23 |

## The sign (3)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| The sign, first time | The sign resets. The book keeps only the two found reagents. x1.20; the number to beat x1.15. | Hold nine tenths of this book. | not simulated |
| The sign, second time | The sign resets. The book keeps only the two found reagents. x1.40; the number to beat x1.32. | Take the sign once. Hold nine tenths of this book. | not simulated |
| The sign, third time | The sign resets. The book keeps only the two found reagents. x1.60; the number to beat x1.52. | Take the sign twice. Hold nine tenths of this book. | not simulated |

## What a new game already holds, in the same words

Not in the book (there is nothing to get); `P.thingOf` gives these lines to the page.

### Reagents: the starting six and the finishing hydrogen

| Name | What it does |
|---|---|
| Hydrate | Hydrate wets. A C=C takes water, OH on the carbon with fewer H. |
| Oxidize | Oxidize tarnishes. A C-OH with an H to give turns to C=O. |
| Grow | Grow branches. A C=O takes a three-carbon arm with a C=C and turns to C-OH. |
| Thiolate | Thiolate taints. Every C=C takes SH on the carbon with more H. |
| Dehydrate | Dehydrate bakes. An alcohol loses water and leaves a C=C. |
| Aminate | Aminate studs. Every C=C takes NH2 on the carbon with fewer H. |
| Hydrogenate | Hydrogenate fills. A C=C takes H₂. |

### Reflexes: the starting ten, and the twelve across the fold

| Name | What it does |
|---|---|
| Ring | Ring curls. An OH and a C=O join in a ring. |
| Dry | Dry parches. An OH near a C=O leaves as water and a C=C forms. |
| Weld | Weld fuses. Two C=O join in a ring. |
| Shift | Shift slides. A C=C two carbons from a C=O moves beside it. |
| Tuck | Tuck nests. An OH adds to the far end of a C=C beside a C=O and closes a ring. |
| Flip | Flip turns. An OH on a C=C turns to C=O. |
| Snap | Snap springs. Two C=C side by side and a third nearby close a six-ring. |
| Close | Close shuts. A Cl and an OH, NH2, SH or COOH join in a ring. Acid fumes leave. |
| Cap | Cap covers. An SH and a C=O join in a ring. |
| Knit | Knit loops. An NH2 and a C=O join in a ring. |
| Ring across | Ring across arcs. An OH and a C=O facing across the fold join. |
| Cap across | Cap across vaults. An SH and a C=O facing across the fold join. |
| Knit across | Knit across threads. An NH2 and a C=O facing across the fold join as C=N. Water leaves. |
| Weld across | Weld across rivets. Two C=O facing across the fold join. |
| Seal across | Seal across clasps. A COOH and an OH, NH2 or SH facing across the fold join. Water leaves. |
| Close across | Close across clamps. A Cl and an OH, NH2, SH or COOH facing across the fold join. Acid fumes leave. |
| Open across | Open across pries. An epoxide and an OH facing across the fold join. |
| Tuck across | Tuck across slips. An OH adds to the far end of a C=C beside a C=O across the fold. |
| Snap across | Snap across leaps. Two C=C side by side and a C=C facing them across the fold close a six-ring. |
| Bridge | Bridge spans. Two SH facing across the fold join as S-S. Hydrogen leaves. |
| Stitch | Stitch sews. Two C=C facing across the fold join in a four-ring. |
| Link | Link ties. Two OH facing across the fold join as an ether. Water leaves. |

## The ladder: what each rung hands over

A run hands over two rungs at most; what is earned beyond that comes with the next runs, instruments first. The ladder has 85 rungs. 42 hand over one named thing (they are in the tables above); 17 of those count only what is done in a six-round or nine-round run. 40 pay credit, 1 to 10 each: the plain counts of rounds played and cleared, runs lost, reflex steps and rings, and the older deeds whose thing now has a way that fits it better. 3 rungs (clearing rounds 10, 11 and 12) are closed while the twelve-round run is switched off.

## What is not in the book, and why

- The suppliers (five, bought with credit at the bench). Once the page starts a run from the profile (`P.profileOpts`), instruments come from the book and a supplier gates only the three bought reagents (the trade supplier). Whether suppliers stay is for the owner.
- The 53 older instruments in the code (balance, stir plate, the occult pieces and the rest): none is on offer in the game as it stands.
- Notebooks, hazards, the catalog of compounds and cosmetic things: `FINDINGS.md` designs them; nothing of them is in the game's rules, so nothing can be got.
- Inspections: all four are dealt from the first run; there is nothing to unlock.
- The twelve across-the-fold reflexes: each comes by itself from round 4 when its near twin is held.
- The twelve-round run: switched off.
- Credit and gold: they are spent, not held.
- Second ways that exist beside the one in the book: a homunculus held in a run puts its own reagent on the rack whether that reagent is owned or not (the wood spirit reduce, the slime hydroborate, ammonia cyanate, brimstone eliminate S).

## What the page still has to do

- Start a run with `P.runNew(tier, extra, Object.assign({ tierNo }, P.profileOpts(meta)))`. Until it does, the counts are not kept and no rung is handed over.
- Save `meta.ladder`, `meta.counters`, `meta.deep`, `meta.reach` and `meta.sign` with the profile (`reach` and `sign` are not restored on load today).
- Its own gate: read `P.stageOf(meta)` wherever it reads `meta.stage` (scheme.js: the bench, the jars, the kit shelf, the terms and the supplier limit), and stop raising `meta.stage` by hand. Then set `P.RULE.termsGate = false` so the book no longer says that a term waits for two six-round runs.
- Call the music with the soundtracks owned (`P.owned(meta).soundtrack`).
- Sigils: `P.sigilVisit(run)` and `P.sigilGet(run, id)` between rounds (RIG.md, sixteenth, item 1).
