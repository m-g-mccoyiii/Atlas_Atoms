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
| Epoxidize | Turns every C=C into an epoxide. | Set off 3 different kinds of reflex in one round. | 3 |
| Extend | Turns an aldehyde or methyl ketone C=O into C=C beside a new ketone. | End a round with the molecule 10 or more atoms bigger than it was dealt. |  |
| Burn | Turns chain-end C=C, aldehydes and chain-end CH2-OH into COOH. | Lose 10 runs. | 10 |
| Hydroborate | Adds water across C=C with the OH on the carbon with more H. Also turns C=O into C-OH. | Have hydrate act 40 times. | 40 |
| Cyanate | Turns an aldehyde or methyl ketone C=O into C(OH)-COOH. Ammonia leaves. | Fire hydrate and then oxidize on one page, both acting, 30 times. | 30 |
| Reduce | Turns C=O into C-OH. Leaves C=C alone. | Have oxidize act 40 times. | 40 |
| Chlorinate | Swaps the OH of a primary or secondary alcohol for Cl. | Drive off acid fumes 20 times (a Cl closing a ring gives them off). | 20 |
| Formylate | Adds CHO and H across every C=C. The CHO goes on the carbon with more H. | Have grow act 60 times. | 60 |
| Cleave | Cuts every C=C into two C=O. | End 10 rounds with the molecule smaller than it was dealt. | 10 |
| Dihydroxylate | Puts an OH on both carbons of every C=C. | Have hydrate act 120 times. | 120 |
| Eliminate N | An NH2 leaves and a C=C forms toward the neighbor with more H. | Have aminate act 60 times. | 60 |
| Eliminate S | An OH leaves and a C=C forms toward the neighbor with more H. Sulfur comes off. | Have thiolate act 60 times. | 60 |
| Add methyl | Adds CH₃ to the carbon of C=O and leaves C-OH. | Buy the organometallics at the bench for 5 credit (the trade supplier must be open). | 5 |
| Methylenate | Swaps the O of C=O for CH₂ and leaves C=C. | Buy the ylides at the bench for 8 credit (the trade supplier must be open). | 8 |
| Polymerize | Starts a chain at C=C. Used again, it doubles every chain. | Buy the radicals at the bench for 14 credit (the trade supplier must be open). | 14 |
| Oxidize C=C | Turns C=C straight into C=O on the carbon with fewer H. | Fire hydrate or hydroborate and then oxidize so that the second follows on from the first, once. |  |
| Strip C=O | Takes the O off C=O and leaves CH₂. | Fire reduce or hydroborate, then dehydrate, then the finishing hydrogen, each following on from the last, once. |  |

## Reflexes (3)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| Seal | A COOH and an OH, NH2 or SH 3 or 4 carbons apart join in a ring; water comes off. Across the fold too, from round 4. | Close 100 rings. | 100 |
| Open | An OH 3 or 4 carbons from an epoxide opens it and closes a ring. Across the fold too, from round 4. | Have epoxidize act 10 times. | 10 |
| Fold | An epoxide with a carbon on both ends turns into a C=O. | Have epoxidize act 30 times. | 30 |

## Motifs (4)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| Spiro centre | Each atom that two rings share and nothing else: every step has its places counted 10 in 100 more. | Set off a chain of 9 reflex steps on one page. | 9 |
| Benzene ring | Each benzene ring on the molecule: every step has its places counted 30 in 100 more. | End a round at 1.41 times the number to beat. |  |
| Shared side | Each pair of rings that share a side: every step has its places counted 15 in 100 more. | Close 400 rings. | 400 |
| Cage | Each ring tied into a cage: every step has its places counted 3 in 100 more. | Close 1000 rings. | 1000 |

## Instruments (8)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| Seed crystal | Put on a carbon: one hydrogen there becomes an OH, and the reflexes run from it. Used on the molecule once a round. | Clear round 1 of a six-round or nine-round run. |  |
| Burner | Every OH that can lose water does, and becomes a C=C. Used on the molecule once a round. | Clear round 3 of a six-round or nine-round run. | 3 |
| Burette | Every C=C outside a benzene ring becomes a C=O. Used on the molecule once a round. | Clear round 5 of a six-round or nine-round run. | 5 |
| Mirror | Put on a bond: one side of the bond goes and the other is copied across it. Used on the molecule once a round. | Clear round 7 of a nine-round run. | 7 |
| Magnet | Every stretch of four or more plain CH2 in a row is pulled shut to two carbons. Used on the molecule once a round. | Set off a chain of 6 reflex steps on one page. | 6 |
| Carousel | One more reagent is dealt on every page. | Fire six different reagents in one run. | 6 |
| Dropper | One more use of every reagent. | Clear a round having fired three kinds of reagent or fewer. |  |
| Timer | A fourth circle on every page: four reagents fire. | Clear 20 rounds. | 20 |

## Homunculi (10)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| Water | When a page drives off 4 waters or more: yield times 1.22, then every C=C becomes C-OH and the rings run again. | Fill its jar: 200 waters driven off, over all runs. | 200 |
| Hydrogen | Not on the last page. When oxidize is fired last and lands and the page has a chain of 3 or more: the next page counts its chain on from this one. If the next chain is shorter, yield times 0.77. | Fill its jar: 130 hydrogens driven off, over all runs. | 130 |
| Dry ice | On the last page, if carbon dioxide came off this round and 3 of the reagents never acted in it: yield times 1.59. | Fill its jar: 50 carbon dioxides driven off, over all runs. | 50 |
| Acid | When the molecule ends a page 2 atoms smaller or more: yield times 1.41. | Fill its jar: 200 times hydrate or dehydrate acts, over all runs. | 200 |
| Wood spirit | When the first reagent lined up finds nothing to act on: he pours every dealt reagent that was not lined up, free; if one lands, yield times 1.12. While held, reduce is on the rack too. | Fill its jar: 40 times reduce acts, over all runs. | 40 |
| Salt | When the line is the line of the page before again: yield times 1.58 and the three reagents get their use back. | Fill its jar: 50 times oxidize acts on an OH at the end of a chain, over all runs. | 50 |
| Slime | When two of the page's reagents each set off a reflex: yield times 1.22; all three: times 1.58. The reagents he stuck are shut on the next page. While held, hydroborate is on the rack too. | Fill its jar: 70 times hydroborate acts, over all runs. | 70 |
| Seedling | When the molecule ends a page 8 atoms bigger or more: yield times 1.18, more for each page in a row. A later page that grows less: yield times 0.84. | Fill its jar: 120 times grow acts, over all runs. | 120 |
| Ammonia | When nitrogen goes on the molecule this page (aminate lands, or a knit closes): the page's three reagents fire again in the same order, no use spent. While held, cyanate is on the rack too. | Fill its jar: 40 ammonias driven off, over all runs. | 40 |
| Brimstone | When sulfur goes on the molecule, not on the last page: the round ends now and the task counts as met; yield times 1.22 after page one, 1.12 after page two. While held, eliminate s is on the rack too. | Fill its jar: 80 sulfurs driven off, over all runs. | 80 |

## Sigils (9)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| Clepsydra | A round has four pages, not three. | Play 100 rounds. | 100 |
| Solve | No reflex along the chain has a limit a page: dry (once), weld (twice) and ring (twice) go on for as long as they fit. Across the fold each still goes once. | Set off 600 reflex steps. | 600 |
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
| Glass | A run in which every round starts with extra at 3 (the yield reads 1.73 times) and the first reagent that does not follow on from the last ends the round. | Beat the number in a round of 6 or more steps with no broken row. It counts once two runs have each cleared six rounds. |  |
| Occult | A run that starts with one of the eight instruments drawn at random, held or not; every number to beat is 1.22 times. | Clear 5 rounds in one run. It counts once two runs have each cleared six rounds. |  |
| Lean | A run with three of the starting reagents and one more use of each. | Beat the number in a round having fired two kinds of reagent or fewer. It counts once two runs have each cleared six rounds. |  |
| Long | A run with four circles a page and two pages a round. | Make a row of 10 in one round. It counts once two runs have each cleared six rounds. |  |
| Hoard | A run that starts with three instruments drawn at random and is offered no more. | Hold five instruments in one run. It counts once two runs have each cleared six rounds. |  |

## Longer runs (2)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| Master's | A run of six rounds. Instruments can be held. A round is cleared by the task and a pass mark on the yield. | Win a three-round run. |  |
| Doctorate | A run of nine rounds. Instruments and one homunculus can be held. | Win a six-round run. |  |

## Soundtracks (4)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| Harpsichord unhinged | A soundtrack to play the game to. | Clear round 6 of a six-round or nine-round run. | 6 |
| Chain Lightning | A soundtrack to play the game to. | End a round at OVERREACT (2.83 times the number to beat). |  |
| Gothic hybrid | A soundtrack to play the game to. | Lose 3 runs. | 3 |
| Monster-movie lab | A soundtrack to play the game to. | Set off 200 reflex steps. | 200 |

## The sign (3)

| Name | What it does | How it is got | Count |
|---|---|---|---|
| The sign, first time | Everything in this book but the two reagents found by a row is given up and earned again; the yield is 1.2 times for good and the number to beat 1.15 times. | Hold nine tenths of everything in this book. | 56 |
| The sign, second time | Everything in this book but the two reagents found by a row is given up and earned again; the yield is 1.4 times for good and the number to beat 1.32 times. | After the sign has been taken 1 time: hold nine tenths of everything in this book. | 56 |
| The sign, third time | Everything in this book but the two reagents found by a row is given up and earned again; the yield is 1.6 times for good and the number to beat 1.52 times. | After the sign has been taken 2 times: hold nine tenths of everything in this book. | 56 |

## The ladder: what each rung hands over

A run hands over two rungs at most; what is earned beyond that comes with the next runs. The ladder has 67 rungs. 40 open one named thing (they are in the tables above). 24 pay credit, 1 to 10 each, because the game holds fewer things than the ladder has rungs: these are the plain counts of rounds played and cleared, runs lost and reflex steps, clearing rounds 2, 4, 8 and 9 of a long run, and the deeds whose thing was moved to a count that fits it better after review (a chain of 4, the 2-times mark, 5 kinds of reflex, a round lost by a little). 3 rungs (clearing rounds 10, 11 and 12) are closed while the twelve-round run is switched off.

## What is not in the book, and why

- The suppliers (five, bought with credit at the bench). Until now a supplier put its instruments on offer. Once the page starts a run from the profile (`P.profileOpts`), instruments come from the book and a supplier gates only the three bought reagents (the trade supplier). Whether suppliers stay is for the owner.
- The 53 older instruments in the code (balance, stir plate, the occult pieces and the rest): none is on offer in the game as it stands.
- Notebooks, hazards, the catalog of compounds and cosmetic things: `FINDINGS.md` designs them; nothing of them is in the game's rules, so nothing can be got.
- Inspections: all four are dealt from the first run; there is nothing to unlock.
- The twelve across-the-fold reflexes: each comes by itself from round 4 when its near twin is held.
- The twelve-round run: switched off.
- Credit and gold: they are spent, not held.
- Second ways that exist beside the one in the book: a homunculus held in a run puts its own reagent on the rack whether that reagent is owned or not (the wood spirit reduce, the slime hydroborate, ammonia cyanate, brimstone eliminate S).
- The page's own gate `meta.stage` (it rises after three rounds are beaten, and again after two runs that clear six rounds): until it has risen the page offers no instruments, homunculi or terms. It is the page's, not the rules', and should go or be shown once the book is in.
- The three bought reagents and the two found by a row reach a run through the page (`extra`), and once any earned reagent is owned they are seldom offered. Not fixed.

## What the page still has to do

- Start a run with `P.runNew(tier, extra, Object.assign({ tierNo }, P.profileOpts(meta)))`. Until it does, the counts are not kept and no rung is handed over.
- Save `meta.ladder`, `meta.counters`, `meta.deep`, `meta.reach` and `meta.sign` with the profile (`reach` and `sign` are not restored on load today).
- Call the music with the soundtracks owned (`P.owned(meta).soundtrack`).
- Sigils: a run holds those passed as `sigils` (three at most) out of `P.profileOpts(meta).sigilsOwned`; how the player picks or buys them is not decided.
