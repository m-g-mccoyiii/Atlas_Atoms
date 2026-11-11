# Overreact: making the pieces combine

Written 2026-11-10 from a design review of the measured matrix (`MATRIX.md`). This is a proposal. None of it is built.

## Why sixty pieces make so few combos

1. Nearly every piece reads one noun ("any reaction", "each place") and writes one noun (extra, row, points). Nothing writes a noun that another piece reads, so a build is a sum of multipliers. 1,165 of 1,770 pairs do not interact.
2. Almost no piece makes or spends a thing. There are no marks, no stored by-products, no breaks used as currency, and no position on the shelf beyond the lab coat.
3. The few combos are loop pairs or whichever piece is largest, so there is one right pick.

## Eight engines

An engine is a pattern that lets pieces interact without naming each other. One piece makes a thing and another spends it.

| Engine | Pattern | Example |
|---|---|---|
| Mark | a piece marks a place or a reagent; another pays for marked ones | spatula |
| Ash | by-products that leave are kept as ash or water; others burn it | scrubber keeps, fume hood burns |
| Neighbor | a piece acts on the piece to its left or right, so shelf order matters | balance |
| Chorus | pays by how many pieces fired on this reaction | stir plate |
| Break | a break makes a token (a finger, a weight, a mouse) that others cash | hand of glory |
| Kind | keys off atom kind, family or size | crystal ball |
| Return | a loop triggers other pieces | mirror |
| Ruin | a piece is spent or ruined for a jump | monkey's paw |

## Rewrites

The object stays. What it does changes. Starred rows are the ones a player would tell a friend about.

| Piece | Rule now | New token | What it does | Engine |
|---|---|---|---|---|
| balance | each place +15 | both neighbors +1 level | the pans lift the piece on each side | Neighbor |
| spatula | one place +90 | marks one place | the place it scraped stays marked | Mark |
| magnet | row never under 2.5 | marks pay +20 | drawn to marked places | Mark |
| loupe | rare reagents more often | marks spread | a mark copies to a place beside it | Mark |
| seed crystal | loop times 1.2 | loop makes place times 3 | the place keeps it all round | Return |
| ouija board * | one reagent never runs out | planchette picks; obey twice | it slides to a reagent; using that one pays double | Mark |
| stir plate | each reaction +0.1 | +0.1 per piece firing | counts the pieces that fired | Chorus |
| carousel * | one more reagent | shelf turns each page | every piece moves one place along | Neighbor |
| clamp | broken row keeps three quarters | neighbors fire twice, pinned | clamped pieces do not turn with the carousel | Neighbor |
| lab coat * | copies the piece to its left | copies the last piece fired | the name tag changes | Chorus |
| mirror | loop +200 | loop: whole shelf fires again | it reflects every piece | Return |
| dropper | one more use | spent use pays +0.05 | each drop pays | Ash |
| drying tube | water +60 | 3 water: row times 3 | the tube fills, then pours | Ash |
| sieves | water row +0.6 | water refills a use | strained water becomes a use | Ash |
| scrubber | points for by-products | keeps every by-product as ash | ash piles on the shelf | Ash |
| fume hood | anything leaving +0.06 | 3 ash: all pieces fire twice | it burns the ash | Ash |
| homunculus * | last reaction counts three times | feed 5 by-products: hatches times 5 | the jar fills, then cracks | Ash |
| black cat * | a break pays +0.13 | break brings a mouse: +1 use | a dead mouse is left on the page | Break |
| hand of glory * | on a break, pieces still fire | 5 breaks, 5 fingers: times 5 | a finger lights for each break | Break |
| brass weights | off-row +0.5 | break adds a weight: +0.5 kept | the pan sinks | Break |
| monkey's paw * | a wish doubles the round | wish: times 3 a piece, neighbor ruined | a finger curls | Ruin |
| crystal ball * | shows the next page | shows a family; hit it times 3 | a ring or a sugar swims in the ball | Kind |
| the intern * | one free reaction a page | random reaction; a break fires it | fired means gone for the round | Ruin |
| goggles * | pays 1 credit | survives a blast, then times 5 | on the forehead; a lens cracks | Break |

## Builds the set should support

| Build | Pieces | The moment it pays |
|---|---|---|
| Break on purpose | hand of glory, black cat, brass weights, goggles, fire extinguisher | the fifth finger lights mid-page for times 5, and the cat's mice refill the rack |
| Ash baker | scrubber, fume hood, sieves, drying tube, homunculus | the jar hatches, the hood burns three ash, and every piece fires twice on one reaction |
| Spinning shelf | carousel, clamp, balance, lab coat, cursed idol | the turn lands the idol beside the clamped pair and the coat copies a doubled piece |
| Loop club | recycler, seed crystal, mirror, spatula, magnet | one loop on a marked place makes the whole shelf fire again |
| Wishful thinking | monkey's paw, goat, the intern, voodoo doll, ouija board | the paw triples the goat and ruins its weakest neighbor |

A sixth, "one giant atom", has only the crystal ball. It needs two new pieces keyed to atom kind and size.

## Rare events

Each is shown on the molecule or the shelf, never as a banner.

1. **Blast.** A row of thirteen or more with three or more ash held. The flask cracks, the row counts ten times once, and the piece beside the flask is scorched: ruined for the round.
2. **Séance.** One page in forty, and only if a piece was ruined earlier in the run. The ruined piece comes back on the shelf, faint, and fires three times for that page.
3. **Tail bite.** The molecule returns to its very first form with the row unbroken. The round total counts twice. A snake in ink draws round the molecule and bites its tail.

## To cut

Timer, coffee, unlabeled bottle, hourglass, poster, grant proposal, stopwatch, thermometer. All measure as dead or negative, none touches a shared noun, and several are copies of each other. The freed places go to Kind pieces and a second Break piece.

## Cautions

- The flask was removed from the page on 2026-11-10. The blast needs another object to crack, or the flask returns only for that event.
- "Ruined" pieces and a turning shelf need a shelf that shows state. That is new drawing work on every piece.
- Twenty-four rewrites and eight cuts change most of the measured matrix. The matrix has to be run again after each engine goes in, not once at the end.
