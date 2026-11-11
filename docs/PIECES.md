# Overreact: the pieces

Written 2026-11-11, revised the same day (the burner by the owner's rule, the clamp replaced). Measured, awaiting review.

The sixty pieces of equipment were made for the game as it was before the cascade. Most of them add a number. Five have been made again for the cascade game, and the rest are switched off until they are made again, five at a time.

## What a piece is now

A piece is a thing the player uses on the molecule. It is not a number on a shelf.

- The player clicks the piece, then clicks the molecule. Before the second click the page shows what would happen.
- A piece is used once a round, while the page is being lined up, before the go arrow.
- Two of the five are put at a place the player chooses, because where it goes is the decision. Three act on the whole molecule at once.
- A piece that changes the molecule sets the zip off at once, as a reagent does, if an OH then has a C=O in reach. The steps count on the page being lined up.
- What a piece drives off the molecule is seen leaving and is collected like a reagent's by-product.
- Nothing is allowed to grow the molecule past the size limit of 56 heavy atoms, and a mirrored molecule must stay six under it so that reagents can still add to it.
- No rule uses a vague word for what happens. Each one names which group becomes which group, and where.

## The five

### Mirror

- **Five words:** copies one side across.
- **Where it goes:** on a bond between two carbons that is not in a ring.
- **What it does, exactly:** everything on the far side of that bond is taken away. Everything on the near side is copied, the copy is reflected, and the two are joined by a new bond between the carbon at the bond and its own copy. The molecule becomes one side and its mirror image. The side that is kept is the side of the bond the pointer is nearer to.
- **Preview:** the reflected half is drawn as a faint ghost, with the bond that will join them dashed, and the side that goes is marked in red.
- **Why it fits:** a mirror set on a bond shows one side twice.
- **What it is for:** every OH and every C=O on the kept side is there twice, so the molecule zips from two ends at once. Where the mirror goes decides everything: put on the wrong bond it throws away the half that carried the chain.
- **Combines with:** the seed crystal (an OH put on one half before the mirror is on both halves after it), the magnet (a molecule pulled short fits under the size limit when doubled), the burette.

### Seed crystal

- **Five words:** adds OH here and zips.
- **Where it goes:** on a carbon that has a hydrogen and carries no oxygen.
- **What it does, exactly:** one hydrogen on that carbon becomes an OH. The molecule then zips from that OH at once, during the line-up, with no reagent: the OH closes a ring onto a C=O three or four carbons away, the C=O becomes an OH, and that OH goes on to the next C=O.
- **Preview:** "OH" is written over the carbon.
- **Why it fits:** a seed crystal dropped into a still solution starts it off from the spot where it lands.
- **What it is for:** a second start. A chain of C=O with no OH near it cannot zip; with the crystal it can, from the carbon the player picks.
- **Combines with:** the mirror, the burette (the burette makes the C=O, the crystal sets them off).

### Magnet

- **Five words:** pulls every gap shut.
- **Where it goes:** on the whole molecule. One click anywhere on it.
- **What it does, exactly:** every stretch of four or more plain CH2 carbons in a row loses all but its two end carbons, and those two are bonded. What stood on either side of the stretch is then three carbons apart, which is where a zip reaches.
- **Preview:** the carbons that will go are marked in red.
- **Why it fits:** a magnet pulls far things together.
- **What it is for:** many molecules carry more C=O beyond a stretch of six or eight carbons that no zip crosses. The magnet makes one chain of the two.
- **Combines with:** the mirror.

### Burner

- **Five words:** every OH becomes C=C.
- **Where it goes:** on the whole molecule. One click anywhere on it.
- **What it does, exactly:** the owner's rule. The burner heats the whole molecule: every OH that can lose water does, all at once. The OH leaves with a hydrogen from the carbon next door, and a C=C is left between the two carbons. Each water is seen coming off its own OH and flying to where water is kept. An OH that cannot lose water stays: one on a benzene ring, one whose neighbor carbons have no hydrogen or carry an oxygen, and the OH a zip leaves on its last ring.
- **Preview:** each OH that will go is struck through in red ink and "C=C" is written over it.
- **Why it fits:** a burner heats the whole flask, not one corner of it, and heat drives water off.
- **What it is for:** it turns every OH into a C=C in one act with no circle spent. A C=C is what the burette, hydrate and hydroborate work on. It also fills the water jar faster than anything else.
- **Combines with:** the burette (burner, then burette: every OH becomes a C=O).
- **It is weak alone, and harmful when used without thought.** See "The burner, plainly" below. The rule has not been changed.

### Burette

- **Five words:** every C=C becomes C=O.
- **Where it goes:** on the whole molecule. One click anywhere on it.
- **What it does, exactly:** one drop on every double bond. Every C=C that is not in a benzene ring becomes a C=O on the carbon of the pair that has fewer hydrogens, and the other carbon takes that carbon's hydrogen. A C=C whose carbons carry no hydrogen, or two each, is left as it is.
- **Preview:** "C=O" is written over every C=C that will change. No disc.
- **Why it fits:** a burette lets a reagent down a drop at a time, and here every double bond gets its drop.
- **What it is for:** with reagents it takes two circles to make a C=O out of a C=C (hydrate, then oxidize), and oxidize also takes the OH the chain starts from. The burette does every C=C in one act and touches no OH. On a chain of five C=C it sets up a zip of five.
- **Combines with:** the burner (above), the seed crystal, the mirror.
- This is the act the last builder gave the burner. The owner's burner now does something else, and the act was given to the object it fits. It replaced the clamp.

## Two ways to play

- **One long zip.** Burner, burette, magnet. Turn every OH and every C=C into C=O, pull the gaps shut, make one start with a reagent or the crystal, and fire a single chain that runs the length of the molecule.
- **Many zips at once.** Mirror, seed crystal. Double the molecule and give it a second start, so that two or three shorter zips run on one page and their steps count on from each other.

## Measured

Two readings off the structure alone (the recording page: `toolTable` and `toolLine` in `casc.js`). Neither says a section passes. 31 molecules of 14 to 31 heavy atoms, every second one of the list of 78 as it now stands.

- **As dealt:** the steps the molecule would zip as it stands once the pieces have been used, before any reagent.
- **Best line:** the steps of the best line of three of the six starting reagents fired after the pieces (the screen's `best`).

"Best place" tries every way of placing the pieces together, in either order for a pair, and may leave a piece unused. "Any place" uses every piece at a place taken at random (mean of 12 tries as dealt, 3 for the best line). The earlier table placed pieces one at a time, so its pair rows were lower; the single rows compare.

| Held | As dealt, best place | 6 or more | Longest | As dealt, any place | Best line, best place | 6 or more | 10 or more | Longest | Best line, any place |
|---|---|---|---|---|---|---|---|---|---|
| nothing | 1.03 | 0 | 2 | 1.03 | 3.23 | 6% | 0 | 6 | 3.23 |
| magnet | 1.16 | 0 | 3 | 1.16 | 3.35 | 10% | 0 | 6 | 3.35 |
| burner | 1.03 | 0 | 2 | 0.26 | 3.23 | 6% | 0 | 6 | 2.61 |
| burette | 1.74 | 3% | 6 | 1.74 | 3.52 | 10% | 0 | 6 | 3.32 |
| seed crystal | 1.81 | 0 | 4 | 1.24 | 3.77 | 6% | 0 | 6 | 3.46 |
| mirror | 2.00 | 0 | 4 | 0.80 | 4.29 | 26% | 0 | 8 | 2.69 |
| burner and burette | 1.74 | 3% | 6 | 0.35 | 4.10 | 10% | 0 | 6 | 3.52 |
| burner and magnet | 1.16 | 0 | 3 | 0.26 | 3.35 | 10% | 0 | 6 | 2.68 |
| burner and seed crystal | 1.81 | 0 | 4 | 0.58 | 3.84 | 6% | 0 | 6 | 2.97 |
| burner and mirror | 2.00 | 0 | 4 | 0.12 | 4.39 | 29% | 0 | 8 | 2.62 |
| burette and magnet | 1.94 | 3% | 6 | 1.87 | 3.61 | 13% | 0 | 6 | 3.42 |
| burette and seed crystal | 2.90 | 6% | 7 | 2.10 | 4.06 | 10% | 0 | 7 | 3.54 |
| burette and mirror | 3.29 | 10% | 8 | 1.11 | 4.81 | 29% | 0 | 8 | 2.92 |
| magnet and seed crystal | 1.87 | 0 | 4 | 1.33 | 3.90 | 10% | 0 | 6 | 3.58 |
| magnet and mirror | 2.45 | 6% | 6 | 0.85 | 4.97 | 45% | 3% | 10 | 2.96 |
| seed crystal and mirror | 3.68 | 26% | 7 | 0.95 | 5.90 | 61% | 6% | 10 | 2.99 |
| all five | 6.23 | 71% | 10 | 1.06 | 7.19 | 87% | 10% | 11 | 2.52 |

What it says:

- **Where a piece goes matters most for the mirror.** At its best bond it doubles the steps as dealt (1.03 to 2.00). At a bond taken at random it is worse than leaving it alone (0.80).
- **Pairs that make something neither piece does alone.** Seed crystal and mirror: 3.68 as dealt against 1.81 and 2.00, and 5.90 on the best line against 3.77 and 4.29. Burette and mirror: 3.29 against 1.74 and 2.00. Burette and seed crystal: 2.90 against 1.74 and 1.81. Magnet and mirror: 4.97 on the best line against 3.35 and 4.29, with the first lines of ten. Burner and burette: 4.10 on the best line against 3.23 and 3.52.
- **All five at their best places zip 6.23 steps before any reagent** and reach six on 71 molecules in 100. All five at random places: 1.06, the same as holding nothing.
- No pair loops. A piece is used once a round and the zip it sets off ends when no OH has a C=O in reach.

### The burner, plainly

The owner's burner removes every OH it can. An OH is what a zip starts from, so by itself the burner can only take a start away.

- As dealt, at its best: 1.03 steps, the same as not holding it, because the best thing to do with it on a bare molecule is not to use it. Used on every molecule: 0.26.
- With the best line of three reagents after it: 3.23, the same as nothing. Used on every molecule: 2.61, against 3.23.
- It pays with the burette (4.10 on the best line, against 3.52 for the burette alone), a little with the seed crystal (3.84 against 3.77) and with the mirror (4.39 against 4.29), and not at all with the magnet.

So alone it is a dead piece by these readings and a harmful one in careless hands, and it is a real half of one pair. Its other worth is not in these tables: every OH it removes is a water collected. In whole rounds played well (below) it is never used alone, it is worth 1.22 with the burette against 1.04 for the burette alone, and it adds nothing to the seed crystal or the mirror.

### Whole rounds

Run again on 2026-11-11 with players that use a piece when and where the structure says it lengthens the cascade (`toolRound` in the recording page; the rule of use is `useTools` in `tools_sim.js`). One round of three pages on each of the same 31 molecules, round five's deal, the six starting reagents. The player tries every line of the hand and fires the one that makes most.

How a piece is used here. At the start of a page the player reads, from the structure alone, the steps of the best line of its hand as the molecule stands, and the same after each piece it has not used at each of its places, and after each ordered pair of pieces. It uses a piece now only where that is worth one new step or more over not using it, and holds it otherwise; on the last page it uses a piece that adds anything. Before it commits, it plays the page both ways on a copy and drops the use if the page would make less with it (for the mirror, this page and the next). "At random" is the novice: each piece once, on a page and at a place taken at random.

Score is the round's total over the same round with the same pieces held and never used, as a geometric mean. (Not over a round with no piece: see the last point below.)

| Held | Steps a page | Pages with 6 or more | 10 or more | Longest | Score | Rounds it raised, lowered, of 31 |
|---|---|---|---|---|---|---|
| nothing | 3.95 | 19% | 0 | 7 | 1.00 | |
| mirror | 4.49 | 39% | 0 | 8 | 1.23 | 17, 3 |
| seed crystal | 4.24 | 25% | 0 | 9 | 1.13 | 9, 1 |
| magnet | 4.09 | 24% | 0 | 9 | 1.08 | 3, 0 |
| burner | 3.99 | 20% | 0 | 7 | 1.00 | 0, 0 |
| burette | 3.87 | 18% | 0 | 7 | 1.04 | 1, 0 |
| mirror and seed crystal | 4.70 | 43% | 0 | 9 | 1.27 | 20, 4 |
| mirror and magnet | 4.47 | 38% | 3% | 11 | 1.29 | 18, 2 |
| mirror and burner | 5.00 | 45% | 1% | 11 | 1.22 | 17, 6 |
| mirror and burette | 4.26 | 34% | 0 | 8 | 1.23 | 17, 3 |
| seed crystal and magnet | 4.27 | 27% | 0 | 9 | 1.15 | 10, 1 |
| seed crystal and burner | 4.28 | 26% | 0 | 9 | 1.14 | 9, 1 |
| seed crystal and burette | 4.15 | 25% | 0 | 9 | 1.14 | 10, 1 |
| magnet and burner | 4.13 | 25% | 0 | 9 | 1.09 | 3, 0 |
| magnet and burette | 4.01 | 23% | 0 | 9 | 1.13 | 4, 0 |
| burner and burette | 4.16 | 30% | 0 | 8 | 1.22 | 7, 0 |
| all five | 5.03 | 41% | 8% | 11 | 1.45 | 22, 4 |
| mirror, at random | 3.31 | 23% | 0 | 8 | 0.36 | 9, 22 |
| seed crystal, at random | 3.90 | 19% | 0 | 7 | 0.57 | 7, 23 |
| magnet, at random | 4.01 | 20% | 0 | 8 | 0.88 | 3, 8 |
| burner, at random | 3.22 | 13% | 0 | 9 | 0.72 | 10, 19 |
| burette, at random | 3.94 | 20% | 0 | 7 | 0.99 | 2, 2 |
| all five, at random | 3.51 | 22% | 0 | 8 | 0.44 | 7, 24 |

What it says:

- **A piece used well now lowers few rounds.** Alone: the mirror 3 of 31, the seed crystal 1, the others none. It was about half of the rounds a piece was used in. The worst is the mirror with the burner, 6 of 31.
- **Where and when a piece is used is most of its worth.** The mirror is 1.23 used well and 0.36 at a place and page taken at random; the seed crystal 1.13 and 0.57; all five 1.45 and 0.44. A novice is hurt by holding them.
- **The mirror is the strongest piece** (1.23, and six steps or more on 39 pages in 100 against 19). The seed crystal and the magnet are small and safe. The burette alone is close to nothing in a round (1.04): with reagents in hand, hydrate and oxidize already do its work.
- **The owner's burner, played well.** Alone it is never used: no page was found where taking every OH away was worth a step, so it is dead, not harmful (1.00, no round raised or lowered). With the burette it is a real pair: 1.22, 7 rounds raised and none lowered, against 1.04 and 1 for the burette alone. With the seed crystal it adds nothing (1.14 against 1.13). With the mirror it makes longer pages (5.00 steps against 4.49, ten or more on 1 page in 100) but not more score (1.22 against 1.23) and lowers 6 rounds. At random it is harmful: 0.72, 19 rounds of 31 lowered. Its rule was not changed.
- **Why the page is tried both ways before a piece is used.** The structure reads the steps of the cascade. A round's total is mostly the row: on one molecule the same three pages ran 3, 7, 7 steps for 217,000 without the seed crystal, and 4, 4, 5 steps for 47,000 with it used on page one, because the zip it set off left the reagents nothing to carry the row on with. And a mirror on page one can fill the molecule to the size limit, so that nothing can be added to it on pages two and three. A player who only read the steps lost both ways; the check stops that.
- **Found wrong, not fixed here:** a burner that is held and never used raises a round by 1.49 times. An old rule is still in `path.js` (`CATCH`: the burner adds 0.5 to the row for every hydrogen that leaves). It belongs to the old by-product system and should go when the jars are built. This is why the score above is taken against the same pieces held and unused.
- In 40 whole runs (seeds 1 to 40, the number to beat not fitted again) the median player used the mirror in 98 of the 124 rounds it held it, the seed crystal in 57 of 151, the burette in 45 of 157, the burner in 43 of 173, the magnet in 18 of 138. Six steps or more on 24.0 pages in 100, ten or more on 1.95.

## The fifth piece: three candidates

The clamp was the fifth. It was taken out because the wood spirit homunculus (docs/HOMUNCULI.md) does what it did. Three objects were built to take its place and read the same way. Pair rows are with each of the other four, as dealt and on the best line.

| Candidate | Five words | What it does, exactly | As dealt, best place, any place | Best line, best place, any place |
|---|---|---|---|---|
| burette (chosen) | every C=C becomes C=O | above | 1.74, 1.74 | 3.52, 3.32 |
| balance | OH and C=O trade places | on the whole molecule: every OH on a carbon with a hydrogen becomes a C=O and every C=O becomes an OH, at once, the hydrogens tipping from one side to the other. Needs one of each | 1.10, 0.97 | 3.23, 2.94 |
| mortar | cuts this ring bond | on a bond of a ring that is not a benzene ring: the bond is cut and each carbon takes a hydrogen, so the ring is ground open to a chain | 1.03, 1.03 | 3.23, 3.23 |

| With | burette | balance | mortar |
|---|---|---|---|
| burner, as dealt | 1.74 | 1.10 | 1.03 |
| burner, best line | 4.10 | 3.23 | 3.23 |
| magnet, as dealt | 1.94 | 1.23 | 1.16 |
| magnet, best line | 3.61 | 3.35 | 3.35 |
| seed crystal, as dealt | 2.90 | 1.94 | 1.84 |
| seed crystal, best line | 4.06 | 3.97 | 3.87 |
| mirror, as dealt | 3.29 | 2.13 | 2.06 |
| mirror, best line | 4.81 | 4.32 | 4.35 |

- **Burette, chosen.** The only one of the three that raises a molecule alone, the only one that makes the owner's burner worth holding, and it makes a pair with the mirror and with the seed crystal.
- **Balance.** On a chain of OH with one C=O it is a spectacle: every OH becomes a C=O, the one C=O becomes the start, and the chain zips its whole length at once. But most molecules are dealt the other way round (many C=O, one OH), where it ends the chain, and with reagents in hand oxidize already does most of what it does. Built and kept: `AA.rxPath.fifthSet('balance')`.
- **Mortar.** Dead on these molecules: few carry a ring that is not a benzene ring, and opening one brings nothing into reach. Built and kept: `fifthSet('mortar')`.

## The other pieces

Three pieces still do what they say in the cascade game and are offered beside the five. They are passive: carousel (one more reagent in the hand), dropper (one more use of every reagent), timer (a fourth circle on every page).

Where each is sold: seed crystal, burner, burette and dropper at the corner chemist; magnet and carousel at the trade supplier; mirror at the research supplier; timer at the instrument maker.

Switched off behind `RULE.five` in `path.js` (set it to false and call `fifthSet(null)` and all sixty are offered as before), to be made again five at a time: balance, spatula, schlenk line, rubber duck, poster, coffee, lab coat, expired milk, unlabeled bottle, goggles, grant proposal, extinguisher, the intern, stopper, mortar, cannula, reflux, clamp, recycler, stir plate, index cards, log book, brass weights, cold trap, drying tube, sieves, fume hood, scrubber, litmus paper, stopwatch, thermometer, loupe, philosopher's stone, lead into gold, aqua regia, ouroboros, homunculus in a jar, elixir of life, voodoo doll, the Tower, black cat, monkey's paw, cursed idol, grimoire, hourglass, raven, hand of glory, crystal ball, ouija board, black candle, goat sacrifice, a signed pact. That is 52.

## Tried first and taken out

- **The clamp** ("nothing changes this part": no reagent and no other piece changed the oxygen or the C=C it was put on, for the rest of the round). It read 1.13 steps as dealt, the same as nothing, because it changed what reagents could do and not the molecule. Taken out because the wood spirit homunculus protects one OH. The cap it put on an atom is still in the code for that.
- **The burner as "every C=C becomes C=O".** Not the owner's rule. The act is now the burette's.
- Before the owner's direction the five were built as passive rules: the zip waited for the whole line (seed crystal), a link was added every page (burette), a zip reached twice as far (magnet), the first zip ran twice (mirror), a wasted reagent made the chain zip again (recycler). They worked and were measured: the mirror alone multiplied a round by 5 and put ten steps or more on a third of pages. They were taken out because a piece is to be something the player does to the molecule.

## Next

The owner's idea for the next batch, noted and not built: pieces that are small real molecules. The player holds one and adds it to the shape, and it brings exactly the parts it has.

| Molecule | What it adds | How it would feed a zip |
|---|---|---|
| methanol | one carbon carrying an OH | a new OH at the end of a chain: a start, three or four carbons from the last C=O |
| formaldehyde | one carbon that is a C=O | one more C=O at the end: one more step for a chain that reaches it |
| ethylene | two carbons joined by a C=C | a C=C for hydrate or the burette to work on: a spare part that sets a chain off without harming it |
| acetic acid | two carbons ending in an acid | the acid end that the "link" kind of cascade needs (not built yet) |
| ammonia | an amine | the amine end for the same kind |

Each would be put on an end the player chooses, like the mirror.
