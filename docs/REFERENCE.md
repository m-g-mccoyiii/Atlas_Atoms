# Overreact: the reference book

Everything a player can get that a new game does not hold, by category: what it is called, what it does, and the one way to get it. This file is written from the game's own table, `P.reference(meta)` in `path.js` (`python docs/tools_chem/sweep_refdoc.py` after the job `ref14.js`), so it says what the rules say. In the game the book shows a thing that is not yet owned with its name and how to get it, and hides what it does.

For the page: `P.reference(meta)` gives one row a thing: `id`, `category`, `name`, `does`, `how`, `owned`, and `count` and `target` where the way is a count. `P.REFERENCE_CATS` is the order and the names of the categories. `P.profileOpts(meta)` is what `P.runNew` needs so that a run offers what the profile holds and nothing else. `P.runResult(run).earned` lists what a run handed over, each with the thing's `name` and `how`.

## How many

| Category | Things | Ways invented for this book |
|---|---|---|
| Reagents | 17 | The twelve earned by a deed are new ways: until now the game handed all of them to any long run, or (hydroborate, reduce) only with a creature. The three bought with credit and the two found by a row are as the game already had them. |
| Reflexes | 3 | All three are new ways: the game had no way to get them. |
| Motifs | 4 | All four are new ways: the game had no way to open them. |
| Instruments | 8 | All eight are new ways: until now an instrument was on offer once its supplier had been bought with credit. |
| Homunculi | 10 | None invented: each hatches when its jar is full, as built. Ammonia and brimstone had no jar size in the game and could never hatch; they now have 40 and 80. |
| Sigils | 9 | All nine are new ways (first proposals; how sigils are got is still the owner's to decide). |
| Terms of a run | 5 | None invented: each is earned by a deed the game already had. |
| Longer runs | 2 | None invented. |
| Soundtracks | 4 | All four are new ways: nothing gated a soundtrack. The page has to call the music with what is owned. |
| The sign | 3 | None invented. |
| All | 65 | |

A new game holds: six reagents (hydrate, oxidize, grow, thiolate, dehydrate, aminate), ten reflexes (ring, dry, weld, shift, tuck, flip, snap, close, cap, knit), eight motifs, the three-round run, two soundtracks, and nothing else.

## Reagents (17)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| Hydroborate | Adds water across C=C with the OH on the carbon with more H. Also turns C=O into C-OH. | Clear round 2 of a six-round or nine-round run. | 2 |
| Cyanate | Turns an aldehyde or methyl ketone C=O into C(OH)-COOH. Ammonia leaves. | Clear round 8 of a nine-round run. | 8 |
| Reduce | Turns C=O into C-OH. Leaves C=C alone. | Set off a chain of 4 reflex steps on one page. | 4 |
| Chlorinate | Swaps the OH of a primary or secondary alcohol for Cl. | End a round at 2 times the number to beat. | 3 |
| Epoxidize | Turns every C=C into an epoxide. | Set off 3 different kinds of reflex in one round. | 3 |
| Formylate | Adds CHO and H across every C=C. The CHO goes on the carbon with more H. | Set off 5 different kinds of reflex in one round. | 5 |
| Cleave | Cuts every C=C into two C=O. | Lose a round of a six-round or nine-round run by under 15 in 100. |  |
| Extend | Turns an aldehyde or methyl ketone C=O into C=C beside a new ketone. | End a round with the molecule 10 or more atoms bigger than it was dealt. |  |
| Dihydroxylate | Puts an OH on both carbons of every C=C. | Play 30 rounds. | 30 |
| Eliminate N | An NH2 leaves and a C=C forms toward the neighbor with more H. | Clear 60 rounds. | 60 |
| Eliminate S | An OH leaves and a C=C forms toward the neighbor with more H. | Clear 150 rounds. | 150 |
| Burn | Turns chain-end C=C, aldehydes and chain-end CH2-OH into COOH. | Lose 10 runs. | 10 |
| Add methyl | Adds CHâ‚ƒ to the carbon of C=O and leaves C-OH. | Buy the organometallics at the bench for 5 credit (the trade supplier must be open). | 5 |
| Methylenate | Swaps the O of C=O for CHâ‚‚ and leaves C=C. | Buy the ylides at the bench for 8 credit (the trade supplier must be open). | 8 |
| Polymerize | Starts a chain at C=C. Used again, it doubles every chain. | Buy the radicals at the bench for 14 credit (the trade supplier must be open). | 14 |
| Oxidize C=C | Turns C=C straight into C=O on the carbon with fewer H. | Fire hydrate or hydroborate and then oxidize so that the second follows on from the first, once. |  |
| Strip C=O | Takes the O off C=O and leaves CHâ‚‚. | Fire reduce or hydroborate, then dehydrate, then the finishing hydrogen, each following on from the last, once. |  |

## Reflexes (3)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| Open | An OH 3 or 4 carbons from an epoxide opens it and closes a ring. Across the fold too, from round 4. | Clear round 4 of a six-round or nine-round run. | 4 |
| Seal | A COOH and an OH, NH2 or SH 3 or 4 carbons apart join in a ring; water comes off. Across the fold too, from round 4. | Close 100 rings. | 100 |
| Fold | An epoxide with a carbon on both ends turns into a C=O. | Close 200 rings. | 200 |

## Motifs (4)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| Spiro centre | Each atom that two rings share and nothing else: every step has its places counted 10 in 100 more. | Set off a chain of 9 reflex steps on one page. | 9 |
| Benzene ring | Each benzene ring on the molecule: every step has its places counted 30 in 100 more. | End a round at 1.41 times the number to beat. | 2 |
| Shared side | Each pair of rings that share a side: every step has its places counted 15 in 100 more. | Close 400 rings. | 400 |
| Cage | Each ring tied into a cage: every step has its places counted 3 in 100 more. | Close 1000 rings. | 1000 |

## Instruments (8)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| Seed crystal | adds OH here and zips. Used on the molecule once a round. | Clear round 1 of a six-round or nine-round run. |  |
| Burner | every OH becomes C=C. Used on the molecule once a round. | Clear round 3 of a six-round or nine-round run. | 3 |
| Burette | every C=C becomes C=O. Used on the molecule once a round. | Clear round 5 of a six-round or nine-round run. | 5 |
| Mirror | copies one side across. Used on the molecule once a round. | Clear round 7 of a nine-round run. | 7 |
| Magnet | pulls every gap shut. Used on the molecule once a round. | Set off a chain of 6 reflex steps on one page. | 6 |
| Carousel | one more reagent on every page. | Fire all six starting reagents in one run. | 6 |
| Dropper | one more use of every reagent. | Clear a round having fired three kinds of reagent or fewer. |  |
| Timer | a fourth reaction on every page. | Clear 20 rounds. | 20 |

## Homunculi (10)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| Water | When a page drives off 4 waters or more: yield times 1.22, then every C=C becomes C-OH and the rings run again. | Fill its jar: 200 waters driven off, over all runs. | 200 |
| Hydrogen | When oxidize is fired last and lands and the page has a chain of 3 or more: the next page counts its chain on from this one. If the next chain is shorter, yield times 0.77. | Fill its jar: 130 hydrogens driven off, over all runs. | 130 |
| Dry ice | On the last page, if carbon dioxide came off this round: yield times 1.17 for each reagent that never acted in the round, up to 3. | Fill its jar: 50 carbon dioxides driven off, over all runs. | 50 |
| Acid | When the molecule ends a page 2 atoms smaller or more: yield times 1.41. | Fill its jar: 200 times hydrate or dehydrate acts, over all runs. | 200 |
| Wood spirit | When the first reagent lined up finds nothing to act on: he pours every dealt reagent that was not lined up, free; if one lands, yield times 1.12. | Fill its jar: 40 times reduce acts, over all runs. | 40 |
| Salt | When the line is the line of the page before again: yield times 1.58 and the three reagents get their use back. | Fill its jar: 50 times oxidize acts on an OH at the end of a chain, over all runs. | 50 |
| Slime | When two of the page's reagents each set off a reflex: yield times 1.22; all three: times 1.58. The reagents he stuck are shut on the next page. | Fill its jar: 70 times hydroborate acts, over all runs. | 70 |
| Seedling | When the molecule ends a page 8 atoms bigger or more: yield times 1.18, more for each page in a row. A later page that grows less: yield times 0.84. | Fill its jar: 120 times grow acts, over all runs. | 120 |
| Ammonia | When nitrogen goes on the molecule this page: the page's three reagents fire again in the same order, no use spent. | Fill its jar: 40 ammonias driven off, over all runs. | 40 |
| Brimstone | When sulfur goes on the molecule, not on the last page: the round ends now and the task counts as met; yield times 1.22 after page one, 1.12 after page two. | Fill its jar: 80 sulfurs driven off, over all runs. | 80 |

## Sigils (9)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| Clepsydra | A round has four pages, not three. | Play 100 rounds. | 100 |
| Solve | No reflex has a limit a page: dry (once), weld (twice) and ring (twice) go on for as long as they fit. | Set off 600 reflex steps. | 600 |
| Phlogiston | Oxidize also takes two hydrogens from the carbons beside every C=O: a C=C appears there and hydrogen comes off. | Have oxidize act 150 times. | 150 |
| Via Humida | A ring closes by counting its 3 or 4 steps through any atom, so an OH reaches a C=O past an O, N or S in the chain. | Fire hydrate 60 times. | 60 |
| Aqua Permanens | Water never leaves: dehydrate finds nothing, and the reflexes that give off water (dry, seal, link) do not happen. | Drive off 5 or more waters on a page, 30 times. | 30 |
| Tetractys | A page has four circles, not three: four reagents fire, and the double pay is after the fourth. | Line up one reagent in all three circles, 5 times. | 5 |
| Respiratio | The limits of dry, weld and ring start again after every reagent, not once for the page. | Set off dry 100 times. | 100 |
| Gemini | Every double bond counts twice: a reagent or reflex that works on a C=C or C=O has its places counted twice. | Fire dehydrate 50 times. | 50 |
| Sulphur's Mask | Oxygen behaves as sulfur: an OH closes its ring first and without the limit of two a page, and two OH facing across the fold join O-O. | Put on 25 SH. | 25 |

## Terms of a run (5)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| Glass | A run in which every round starts with extra at 3 (the yield reads 1.73 times) and the first reagent that does not follow on from the last ends the round. | Beat the number in a round of 6 or more steps with no broken row. |  |
| Occult | A run that starts with one instrument drawn at random; every number to beat is 1.22 times. | Clear 5 rounds in one run. |  |
| Lean | A run with three of the starting reagents and one more use of each. | Beat the number in a round having fired two kinds of reagent or fewer. |  |
| Long | A run with four circles a page and two pages a round. | Make a row of 10 in one round. |  |
| Hoard | A run that starts with three instruments drawn at random and is offered no more. | Hold five instruments in one run. |  |

## Longer runs (2)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| Master's | A run of six rounds. Instruments can be held. A round is cleared by the task and a pass mark on the yield. | Win a three-round run. |  |
| Doctorate | A run of nine rounds. Instruments and one homunculus can be held. | Win a six-round run. |  |

## Soundtracks (4)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| Harpsichord unhinged | A soundtrack to play the game to. | Clear round 6 of a six-round or nine-round run. | 6 |
| Chain Lightning | A soundtrack to play the game to. | End a round at OVERREACT (2.83 times the number to beat). | 4 |
| Gothic hybrid | A soundtrack to play the game to. | Lose 3 runs. | 3 |
| Monster-movie lab | A soundtrack to play the game to. | Set off 200 reflex steps. | 200 |

## The sign (3)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| The sign, first time | Everything in this book is given up and earned again; the yield is 1.2 times for good and the number to beat 1.15 times. | Hold nine tenths of everything in this book. | 56 |
| The sign, second time | Everything in this book is given up and earned again; the yield is 1.4 times for good and the number to beat 1.32 times. | After the sign has been taken 1 time: hold nine tenths of everything in this book. | 56 |
| The sign, third time | Everything in this book is given up and earned again; the yield is 1.6 times for good and the number to beat 1.52 times. | After the sign has been taken 2 times: hold nine tenths of everything in this book. | 56 |

## The ladder: what each rung hands over

A run hands over two rungs at most; what is earned beyond that comes with the next runs. 40 of the 56 rungs open one named thing (they are in the tables above). 13 pay credit, because the game holds fewer things than the ladder has rungs: clear round 9 of a nine-round run (10 credit); 2,000 reflex steps (5); 200 rounds played, 100 rounds cleared, 30 runs lost, 1,000 reflex steps (3 each); 10 and 20 rounds played, 5 and 10 rounds cleared, 6 runs lost, 50 and 100 reflex steps (1 each). 3 rungs (clearing rounds 10, 11 and 12) are closed while the twelve-round run is switched off.

## What is not in the book, and why

- The suppliers (five, bought with credit at the bench). Until now a supplier put its instruments on offer. Once the page starts a run from the profile (`P.profileOpts`), instruments come from the book and a supplier gates only the three bought reagents (the trade supplier). Whether suppliers stay is for the owner.
- The 53 older instruments in the code (balance, stir plate, the occult pieces and the rest): none is on offer in the game as it stands.
- Notebooks, hazards, the catalog of compounds and cosmetic things: `FINDINGS.md` designs them; nothing of them is in the game's rules, so nothing can be got.
- Inspections: all four are dealt from the first run; there is nothing to unlock.
- The twelve across-the-fold reflexes: each comes by itself from round 4 when its near twin is held.
- The twelve-round run: switched off.
- Credit and gold: they are spent, not held.

## What the page still has to do

- Start a run with `P.runNew(tier, extra, Object.assign({ tierNo }, P.profileOpts(meta)))`. Until it does, the counts are not kept and no rung is handed over.
- Save `meta.ladder`, `meta.counters`, `meta.deep`, `meta.reach` and `meta.sign` with the profile (`reach` and `sign` are not restored on load today).
- Call the music with the soundtracks owned (`P.owned(meta).soundtrack`).
- Sigils: a run holds those passed as `sigils` (three at most) out of `P.profileOpts(meta).sigilsOwned`; how the player picks or buys them is not decided.
