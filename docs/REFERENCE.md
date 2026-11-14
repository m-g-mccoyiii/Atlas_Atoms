# Overreact: the reference book

Everything a player can get that a new game does not hold, by category: what it is called, what it does, and the one way to get it. This file is written from the game's own table, `P.reference(meta)` in `path.js` (`python docs/tools_chem/sweep_refdoc.py` after the job `ref16.js` and `sweep_deeds.py career`), so it says what the rules say. In the game the book shows a thing that is not yet owned with its name and how to get it, and hides what it does.

Since the sixteenth measure every thing is got by a deed that fits it ("More deeds, fewer counts"). The lifetime counts left are the ten jars and Fold (epoxidize acts 3 times); the condenser asks for 2 rounds over all runs. No two things share a way. "Runs" is the run on which the thing is handed over in the middle career of 300 simulated careers of 300 runs, for the casual player and then the careful one; a run hands over two things at most, so in the first twenty runs a deed can be handed over up to about 19 runs after it was done. Both runs are given: the run the deed is done, then the run the thing is handed over.

For the page: `P.reference(meta)` gives one row a thing: `id`, `category`, `name`, `does`, `how`, `owned`, and `count` and `target` where the way has a number. `P.REFERENCE_CATS` is the order and the names of the categories. `P.profileOpts(meta)` is what `P.runNew` needs so that a run offers what the profile holds and nothing else. `P.runResult(run).earned` lists what a run handed over, each with the thing's `name` and `how`. `P.stageOf(meta)` and `P.gateOpen(meta, what)` are what the page's own gate should read.

## How many

| Category | Things | How they are got |
|---|---|---|
| Reagents | 17 | Twelve by a deed in the reagent's own chemistry. Three bought with credit. Two found by firing others one after another. |
| Reflexes | 3 | Each by a deed that nearly makes it. All three need a reagent that is itself earned first. |
| Motifs | 4 | Each by a deed with rings: many closed at once, many more than dealt, two that share a side, or a high yield on a benzene ring. |
| Instruments | 10 | Each by the kind of play it helps, done in a six-round or nine-round run. |
| Homunculi | 10 | Each hatches when its jar is full. These ten are the lifetime counts of the book (ruling K: jars fill across runs). |
| Sigils | 9 | Each by brushing against the rule it bends, in a six-round or nine-round run. |
| Terms of a run | 5 | Each by a deed, as the game had them. |
| Longer runs | 2 | Each by winning the run before it. |
| Soundtracks | 4 | Each by something reached. |
| The sign | 3 | By holding nine tenths of the book. |
| All | 67 | |

A new game holds: six reagents (hydrate, oxidize, grow, thiolate, dehydrate, aminate), ten reflexes (ring, dry, weld, shift, tuck, flip, snap, close, cap, knit), eight motifs, the three-round run, two soundtracks, and nothing else.

## Reagents (17)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Epoxidize | Turns every C=C into an epoxide. | Have dehydrate make 5 C=C in one go. | 11, 12; 4, 9 |
| Extend | Turns an aldehyde or methyl ketone C=O into C=C beside a new ketone. | End a round with the molecule 10 or more atoms bigger than it was dealt. | 2, 4; 1, 1 |
| Burn | Turns chain-end C=C, aldehydes and chain-end CH2-OH into COOH. | Drive off carbon dioxide on 2 pages of one round. | 4, 8; 3, 10 |
| Hydroborate | Adds water across C=C with the OH on the carbon with more H. Also turns C=O into C-OH. | Fire hydrate, dehydrate, hydrate on one page, all three landing. | 23, 23; 4, 10 |
| Cyanate | Turns an aldehyde or methyl ketone C=O into C(OH)-COOH. Ammonia leaves. | End a page with 3 more C=O on the molecule than it was dealt with. | 9, 11; 7, 11 |
| Reduce | Turns C=O into C-OH. Leaves C=C alone. | End a round with no C=O left on a molecule dealt with two or more. | 2, 2; 2, 9 |
| Chlorinate | Swaps the OH of a primary or secondary alcohol for Cl. | Have chlorine close 2 rings in one round. | 2, 3; 2, 11 |
| Formylate | Adds CHO and H across every C=C. The CHO goes on the carbon with more H. | Have grow add 4 arms in one go. | 8, 11; 5, 12 |
| Cleave | Cuts every C=C into two C=O. | End a page with 4 more C=C on the molecule than it was dealt with. | 10, 13; 7, 13 |
| Dihydroxylate | Puts an OH on both carbons of every C=C. | Have hydrate put on 4 OH in one go. | 5, 11; 3, 13 |
| Eliminate N | An NH2 leaves and a C=C forms toward the neighbor with more H. | On one page, have aminate land and a nitrogen close a ring. | 2, 9; 2, 13 |
| Eliminate S | An OH leaves and a C=C forms toward the neighbor with more H. Sulfur comes off. | On one page, have thiolate land and a sulfur close a ring. | 5, 12; 3, 14 |
| Add methyl | Adds CH₃ to the carbon of C=O and leaves C-OH. | Buy the organometallics at the bench for 5 credit (the trade supplier must be open). | not simulated |
| Methylenate | Swaps the O of C=O for CH₂ and leaves C=C. | Buy the ylides at the bench for 8 credit (the trade supplier must be open). | not simulated |
| Polymerize | Starts a chain at C=C. Used again, it doubles every chain. | Buy the radicals at the bench for 14 credit (the trade supplier must be open). | not simulated |
| Oxidize C=C | Turns C=C straight into C=O on the carbon with fewer H. | Fire hydrate or hydroborate and then oxidize, the oxidize working on the C-OH the first one just made. | 2, 2; 1, 1 |
| Strip C=O | Takes the O off C=O and leaves CH₂. | Fire reduce or hydroborate, then dehydrate, then the finishing hydrogen, each working on what the one before it just made. | not simulated |

## Reflexes (3)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Seal | A COOH and an OH, NH2 or SH 3 or 4 carbons apart join in a ring; water comes off. Across the fold too, from round 4. | End a round with a COOH on the molecule that it was not dealt with. | 12, 16; 13, 17 |
| Open | An OH 3 or 4 carbons from an epoxide opens it and closes a ring. Across the fold too, from round 4. | Have epoxidize make 2 epoxides in one go. | 37, 37; 42, 42 |
| Fold | An epoxide with a carbon on both ends turns into a C=O. | Have epoxidize act 3 times. | 45, 45; 55, 55 |

## Motifs (4)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Spiro centre | While two rings of the molecule meet at a single atom, everything a reagent or a reflex changes on it counts for 10 in 100 more. Each further such atom adds the same again. | Close 3 rings on one page. | 5, 13; 2, 15 |
| Benzene ring | While the molecule holds a benzene ring, everything a reagent or a reflex changes on it counts for 30 in 100 more. Two benzene rings count twice. | End a round at 1.41 times the number to beat on a molecule with a benzene ring. | 9, 14; 4, 15 |
| Shared side | While two rings of the molecule share a side, everything a reagent or a reflex changes on it counts for 15 in 100 more. Each further pair of rings that share a side adds the same again. | End a round with 3 more pairs of rings that share a side than the molecule was dealt with. | 3, 13; 2, 16 |
| Cage | While rings of the molecule are tied into a cage, everything a reagent or a reflex changes on it counts for 3 in 100 more for each ring of the cage. | End a round with 6 more rings than the molecule was dealt with. | 9, 15; 3, 16 |

## Instruments (10)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Seed crystal | Put it on a carbon: one hydrogen there becomes an OH, and whatever the molecule can then do by itself it does at once. Used on the molecule once a round. | Clear a round whose first page set off no reflex. It counts in a six-round or nine-round run. | 6, 7; 6, 6 |
| Burner | Heats the whole molecule: every OH that can lose water does, and a C=C is left where it was. Used on the molecule once a round. | Drive off water on every page of a round. It counts in a six-round or nine-round run. | 3, 4; 2, 5 |
| Burette | Every C=C outside a benzene ring becomes a C=O. Used on the molecule once a round. | Have oxidize turn 5 OH into C=O in one go. It counts in a six-round or nine-round run. | 8, 9; 5, 6 |
| Mirror | Put on a bond: one side of the bond goes and the other is copied across it. Used on the molecule once a round. | Fire one reagent and no other on a full page. It counts in a six-round or nine-round run. | 17, 17; 25, 25 |
| Magnet | Every stretch of four or more plain CH2 in a row is pulled shut to two carbons, so the groups at its two ends come close. Used on the molecule once a round. | End a round with the longest carbon chain 4 longer than it was dealt. It counts in a six-round or nine-round run. | 8, 9; 8, 9 |
| Carousel | One more reagent is dealt on the first page of every round. | Fire 6 different reagents in one round. It counts in a six-round or nine-round run. | 4, 5; 3, 6 |
| Dropper | Two more uses of every reagent. | End a round with 4 reagents used up. It counts in a six-round or nine-round run. | 10, 11; 7, 8 |
| Timer | Every page takes four reagents, not three. | Have three reagents of one page each set off a reflex. It counts in a six-round or nine-round run. | 13, 13; 4, 8 |
| Tally counter | Set on a page: whatever that page adds toward the task of the round counts twice. Used once a round. | Lose a round of a six-round or nine-round run by under 15 in 100. | 8, 9; 6, 9 |
| Condenser | One more page is played this round. It counts toward the task and adds nothing to the yield. Used once a round. | Lose 2 rounds of a six-round or nine-round run on the task alone, with the yield past its mark. | 7, 8; 8, 10 |

## Homunculi (10)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Water | When a page drives off 4 waters or more: yield times 1.22, then every C=C becomes C-OH and the rings run again. | Fill its jar: 200 waters driven off, over all runs. | 23, 23; 10, 10 |
| Hydrogen | Not on the last page. When a page fires only two reagents, oxidize is the second and it lands: yield times 1.58, and the next page counts its chain on from this one. If the next chain is shorter, yield times 0.77. | Fill its jar: 130 hydrogens driven off, over all runs. | 29, 29; 12, 12 |
| Dry ice | On the last page, if carbon dioxide came off this round and 3 of the reagents never acted in it: yield times 1.59. | Fill its jar: 50 carbon dioxides driven off, over all runs. | 15, 15; 8, 8 |
| Acid | When the molecule ends a page 2 atoms smaller or more: yield times 1.41. | Fill its jar: 200 times hydrate or dehydrate acts, over all runs. | 35, 35; 17, 17 |
| Wood spirit | When the first reagent lined up finds nothing to act on: he pours every dealt reagent that was not lined up, a use of each; if one lands, yield times 1.22. The bottle he drank is empty for the rest of the round. While held, reduce is on the rack too. | Fill its jar: 40 times reduce acts, over all runs. | not in 300, not in 300; not in 300, not in 300 |
| Salt | When the line is the line of the page before again: yield times 1.58 and the three reagents get their use back. | Fill its jar: 50 times oxidize acts on an OH at the end of a chain, over all runs. | not simulated |
| Slime | When the same reagent is fired twice on a page and each time lands and sets off a reflex: yield times 1.58. That bottle is empty for the rest of the round. While held, hydroborate is on the rack too. | Fill its jar: 70 times hydroborate acts, over all runs. | not in 300, not in 300; not in 300, not in 300 |
| Seedling | When the molecule ends a page 12 atoms bigger or more: yield times 1.34, more for each page in a row. A later page that grows less: yield times 0.84. | Fill its jar: 120 times grow acts, over all runs. | 24, 24; 13, 13 |
| Ammonia | When nitrogen goes on the molecule this page (aminate lands, or a knit closes): the page's three reagents fire again in the same order, no use spent. While held, cyanate is on the rack too. | Fill its jar: 40 times aminate acts or ammonia is driven off, over all runs. | 22, 22; 19, 19 |
| Brimstone | When sulfur goes on the molecule and the task is at least half done, not on the last page: the round ends now and the task counts as met; yield times 1.22 after page one, 1.12 after page two. While held, eliminate s is on the rack too. | Fill its jar: 80 times thiolate acts or sulfur is driven off, over all runs. | 62, 62; 78, 78 |

## Sigils (9)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Clepsydra | A round has four pages, not three. | Lose a round whose last page set off a chain of 3 or more. It counts in a six-round or nine-round run. | 23, 23; 11, 18 |
| Solve | A page normally lets dry happen once, weld twice and ring twice. With Solve each goes on for as long as it can. Across the fold each still happens once. | On one page have two of these happen: dry once, weld twice, ring twice. It counts in a six-round or nine-round run. | 7, 16; 3, 18 |
| Respiratio | A page normally lets dry happen once, weld twice and ring twice. With Respiratio that count starts again after every reagent, so each can happen after each of the three. | Set off dry on every page of a round. It counts in a six-round or nine-round run. | 5, 16; 3, 19 |
| Phlogiston | Oxidize also takes two hydrogens from the carbons beside every C=O: a C=C appears there and hydrogen comes off. | Drive off 5 hydrogens on one page. It counts in a six-round or nine-round run. | 21, 21; 7, 19 |
| Via Humida | A ring closes when an OH is 3 or 4 atoms from a C=O. Normally only carbons may lie between the two; with Via Humida an O, N or S may lie there too. | Close a ring through oxygen, one through nitrogen and one through sulfur in one run. It counts in a six-round or nine-round run. | 6, 18; 4, 20 |
| Aqua Permanens | Water never leaves the molecule: dehydrate finds nothing to do, and the reflexes that give off water (dry, seal, link) do not happen. | Clear a round without driving off any water. It counts in a six-round or nine-round run. | 8, 18; 20, 22 |
| Tetractys | Every page takes four reagents, not three. The last reagent of a page pays double, and that is now the fourth. | Have the last reagent of a full page set off 4 or more reflex steps. It counts in a six-round or nine-round run. | 15, 20; 4, 21 |
| Gemini | Every double bond counts twice: whatever a reagent or a reflex does to a C=C or a C=O is paid as if it had been done two times. | End a page with more C=C and more C=O on the molecule than it was dealt with. It counts in a six-round or nine-round run. | 7, 19; 4, 21 |
| Sulphur's Mask | Oxygen behaves as sulfur: an OH closes its ring before anything else happens and as often as it can on a page, and two OH that face each other across the fold join, oxygen to oxygen. | Have sulfur close 4 rings in one round. It counts in a six-round or nine-round run. | 68, 68; 29, 29 |

## Terms of a run (5)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Glass | A run in which every round starts with its yield at 1.73 times, and the round ends at the first reagent that does not carry on from the one before it. | Pass the number to beat in a round of six or more reagents in which every one carried on from the one before. It counts once two runs have each cleared six rounds. | not simulated |
| Occult | A run that starts with one of the eight instruments drawn at random, held or not; every number to beat is 1.22 times. | Clear 5 rounds in one run. It counts once two runs have each cleared six rounds. | not simulated |
| Lean | A run with three of the starting reagents and one more use of each. | Pass the number to beat in a round having fired two kinds of reagent or fewer. It counts once two runs have each cleared six rounds. | not simulated |
| Long | A run in which a page takes four reagents and a round has two pages. | In one round, have ten reagents in a row each carry on from the one before. It counts once two runs have each cleared six rounds. | not simulated |
| Hoard | A run that starts with three instruments drawn at random and is offered no more. | Hold five instruments in one run. It counts once two runs have each cleared six rounds. | not simulated |

## Longer runs (2)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Master's | A run of six rounds. Instruments can be held. A round is cleared by the task and a pass mark on the yield. | Win a three-round run. | 1, 1; 1, 1 |
| Doctorate | A run of nine rounds. Instruments and one homunculus can be held. | Win a six-round run. | 25, 25; 5, 5 |

## Soundtracks (4)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| Gothic hybrid | A soundtrack to play the game to. | Clear round 3 of a six-round or nine-round run. | 4, 4; 2, 3 |
| Harpsichord unhinged | A soundtrack to play the game to. | Clear round 6 of a six-round or nine-round run. | 25, 25; 5, 6 |
| Chain Lightning | A soundtrack to play the game to. | End a round at OVERREACT (2.83 times the number to beat). | 11, 20; 3, 22 |
| Monster-movie lab | A soundtrack to play the game to. | Set off 5 different kinds of reflex in one round. | 6, 20; 2, 22 |

## The sign (3)

| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |
|---|---|---|---|
| The sign, first time | Everything in this book is given up and earned again, but for the two reagents found by firing others one after another; the yield is 1.2 times for good and the number to beat 1.15 times. | Hold nine tenths of everything in this book. | not simulated |
| The sign, second time | Everything in this book is given up and earned again, but for the two reagents found by firing others one after another; the yield is 1.4 times for good and the number to beat 1.32 times. | After the sign has been taken 1 time: hold nine tenths of everything in this book. | not simulated |
| The sign, third time | Everything in this book is given up and earned again, but for the two reagents found by firing others one after another; the yield is 1.6 times for good and the number to beat 1.52 times. | After the sign has been taken 2 times: hold nine tenths of everything in this book. | not simulated |

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
