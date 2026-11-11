# Overreact: the pieces

Written 2026-11-11. Measured, awaiting review.

The sixty pieces of equipment were made for the game as it was before the cascade. Most of them add a number. Five have been made again for the cascade game, and the rest are switched off until they are made again, five at a time.

## What a piece is now

A piece is a thing the player uses on the molecule. It is not a number on a shelf.

- The player clicks the piece, then clicks the molecule. Before the second click the page shows what would happen: the places the piece can go are dotted under the molecule, and the place under the pointer shows the change in faint ink.
- A piece is used once a round, while the page is being lined up, before the go arrow.
- Three of the five are put at a place the player chooses, because where it goes is the decision. Two act on the whole molecule at once.
- Nothing is allowed to grow the molecule past the size limit of 56 heavy atoms.
- No rule uses a vague word for what happens. Each one names which group becomes which group, and where.

## The five

### Mirror

- **Five words:** copies one side across.
- **Where it goes:** on a bond between two carbons that is not in a ring.
- **What it does, exactly:** everything on the far side of that bond is taken away. Everything on the near side is copied, the copy is reflected, and the two are joined by a new bond between the carbon at the bond and its own copy. The molecule becomes one side and its mirror image. The side that is kept is the side of the bond the pointer is nearer to.
- **Preview:** the reflected half is drawn as a faint ghost, with the bond that will join them dashed, and the side that goes is marked in red.
- **Why it fits:** a mirror set on a bond shows one side twice.
- **What it is for:** every OH and every C=O on the kept side is there twice, so the molecule zips from two ends at once. Where the mirror goes decides everything: put on the wrong bond it throws away the half that carried the chain.
- **Combines with:** the seed crystal (an OH put on one half before the mirror is on both halves after it, and the two zips meet at the join), the burner (a chain of C=C turned to C=O and then doubled), the clamp (a clamped part is copied clamped).

### Seed crystal

- **Five words:** adds OH here and zips.
- **Where it goes:** on a carbon that has a hydrogen and carries no oxygen.
- **What it does, exactly:** one hydrogen on that carbon becomes an OH. The molecule then zips from that OH at once, during the line-up, with no reagent: the OH closes a ring onto a C=O three or four carbons away, the C=O becomes an OH, and that OH goes on to the next C=O.
- **Preview:** the carbon is lit and "OH" is written over it.
- **Why it fits:** a seed crystal dropped into a still solution starts it off from the spot where it lands.
- **What it is for:** a second start. A chain of C=O with no OH near it cannot zip; with the crystal it can, from the carbon the player picks. It is also the only way to zip a stretch that lies beyond a gap.
- **Combines with:** the mirror (above), the burner (the burner makes the C=O, the crystal sets them off).

### Clamp

- **Five words:** nothing changes this part.
- **Where it goes:** on an oxygen, or on a C=C.
- **What it does, exactly:** for the rest of the round no reagent and no other piece changes that oxygen or that C=C. Oxidize does not turn a clamped OH into a C=O, dehydrate does not turn it into a C=C, grow does not turn a clamped C=O into an OH, and the burner leaves a clamped C=C as it is. The molecule's own zip still uses a clamped OH or C=O.
- **Preview:** the part is lit. Once clamped, the atom wears a steel collar for the rest of the round.
- **Why it fits:** a clamp holds one thing still while the work goes on around it.
- **What it is for:** reagents act on every place they fit. Oxidize turns every OH with a hydrogen on its carbon into a C=O, including the OH the chain starts from. With that OH clamped, the same oxidize makes a row of C=O out of every other OH and leaves the start alone.
- **Combines with:** the burner (clamp one C=C to keep it for hydrate, burn the rest), the mirror.

### Magnet

- **Five words:** pulls every gap shut.
- **Where it goes:** on the whole molecule. One click anywhere on it.
- **What it does, exactly:** every stretch of four or more plain CH2 carbons in a row loses all but its two end carbons, and those two are bonded. What stood on either side of the stretch is then three carbons apart, which is where a zip reaches.
- **Preview:** the carbons that will go are marked in red.
- **Why it fits:** a magnet pulls far things together.
- **What it is for:** many molecules carry more C=O beyond a stretch of six or eight carbons that no zip crosses. The magnet makes one chain of the two.
- **Combines with:** the mirror (a molecule pulled short fits under the size limit when doubled), the burner.

### Burner

- **Five words:** every C=C becomes C=O.
- **Where it goes:** on the whole molecule. One click anywhere on it.
- **What it does, exactly:** every C=C that is not in a benzene ring becomes a C=O on the carbon of the pair that has fewer hydrogens, and the other carbon takes that carbon's hydrogen. A C=C whose carbons carry no hydrogen, or two each, is left as it is.
- **Preview:** "C=O" is written over every C=C that will change.
- **Why it fits:** a burner heats the whole flask, not one corner of it.
- **What it is for:** with reagents it takes two circles to make a C=O out of a C=C (hydrate, then oxidize), and oxidize also takes the OH the chain starts from. The burner does every C=C in one act and touches no OH. On a chain of five C=C it sets up a zip of five.
- **Combines with:** the seed crystal, the mirror, the clamp.

## Two ways to play

- **One long zip.** Burner, magnet, clamp. Make every C=O the molecule can carry, pull the gaps shut, keep the one OH safe, and fire a single chain that runs the length of the molecule and gets longer each page.
- **Many zips at once.** Mirror, seed crystal. Double the molecule and give it a second start, so that two or three shorter zips run on one page and their steps count on from each other.

## Measured

MEASURES

## The other pieces

Three pieces still do what they say in the cascade game and are offered beside the five. They are passive: carousel (one more reagent in the hand), dropper (one more use of every reagent), timer (a fourth circle on every page).

Where each is sold: seed crystal, clamp, burner and dropper at the corner chemist; magnet and carousel at the trade supplier; mirror at the research supplier; timer at the instrument maker.

Switched off behind `RULE.five` in `path.js` (set it to false and all sixty are offered as before), to be made again five at a time: balance, spatula, schlenk line, rubber duck, poster, coffee, lab coat, expired milk, unlabeled bottle, goggles, grant proposal, extinguisher, the intern, stopper, mortar, cannula, reflux, burette, recycler, stir plate, index cards, log book, brass weights, cold trap, drying tube, sieves, fume hood, scrubber, litmus paper, stopwatch, thermometer, loupe, philosopher's stone, lead into gold, aqua regia, ouroboros, homunculus in a jar, elixir of life, voodoo doll, the Tower, black cat, monkey's paw, cursed idol, grimoire, hourglass, raven, hand of glory, crystal ball, ouija board, black candle, goat sacrifice, a signed pact. That is 52.

The beaker of water and the balloon of hydrogen are not pieces and were not changed. They belong to a separate system (what comes off the molecule is collected) that is to be designed with the owner.

## Tried first and taken out

Before the owner's direction the five were built as passive rules: the zip waited for the whole line (seed crystal), a link was added every page (burette), a zip reached twice as far (magnet), the first zip ran twice (mirror), a wasted reagent made the chain zip again (recycler). They worked and were measured: the mirror alone multiplied a round by 5 and put ten steps or more on a third of pages. They were taken out because a piece is to be something the player does to the molecule.

## Next

The owner's idea for the next batch, noted and not built: pieces that are small real molecules. The player holds one and adds it to the shape, and it brings exactly the parts it has.

| Molecule | What it adds | How it would feed a zip |
|---|---|---|
| methanol | one carbon carrying an OH | a new OH at the end of a chain: a start, three or four carbons from the last C=O |
| formaldehyde | one carbon that is a C=O | one more C=O at the end: one more step for a chain that reaches it |
| ethylene | two carbons joined by a C=C | a C=C for hydrate or the burner to work on: a spare part that sets a chain off without harming it |
| acetic acid | two carbons ending in an acid | the acid end that the "link" kind of cascade needs (not built yet) |
| ammonia | an amine | the amine end for the same kind |

Each would be put on an end the player chooses, like the mirror.
