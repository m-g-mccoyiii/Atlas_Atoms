# Overreact: the cascades

Designed 2026-11-10. This is the core of the game. It replaces every earlier note about "overreact", rows and free chains.

## The idea

The player lines up three reactions and fires. If that leaves two parts of the molecule close together that react with each other, they react by themselves. If that reaction leaves a new part that can react with its neighbor, it goes again. That is a cascade. Everything else in the game exists to make cascades bigger.

A cascade only keeps going if each step **makes the thing the next step needs**. So each kind of cascade below is a real one from chemistry where that is true. Each is a different shape of play, and each is unlocked by playing.

## Six kinds of cascade

| # | Name on the page | What reacts with what | What each step leaves behind | How it feels | Real chemistry |
|---|---|---|---|---|---|
| 1 | zip | an OH close to a C=O | a ring, and a new OH where the C=O was | a zipper running down a chain: each ring makes the OH that closes the next | hemiacetal and polyether ladders |
| 2 | fold | a trigger at one end of a chain of double bonds | a ring, and the trigger moved on to the next double bond | a floppy chain folding into four fused rings in one go | how the body makes cholesterol from squalene |
| 3 | snap | two double bonds side by side, and a third nearby | a six-ring with one new double bond in it | pieces clicking shut, often into bridges and cages | Diels-Alder cascades |
| 4 | run | a live end, and a loose unit with a double bond | the unit added, and the live end moved to its tip | a runaway that keeps adding until it is stopped or runs out | polymers |
| 5 | weld | a C=O close to another C=O | as built: a new ring with an OH on it, which can start a zip (see below for why not the double bond) | two small shapes fusing into a bigger ringed one | aldol and Robinson ring-building, also steroids |
| 6 | link | an acid end and an amine end | a link, and a new free end | a string of units where the order is the hand | peptides |

## Why this order

1. **zip** is first because it needs only the two parts a new player already has (OH and C=O) and it is one rule: red next to yellow. The setup is plain to see: put a C=O every few carbons, get one OH at the end.
2. **fold** is second because it is the big spectacle: one trigger, four rings. It teaches that a long shape set up right pays for itself.
3. **snap** brings bridges and cages, and its leftover double bond is a trigger for fold. This is the first place two kinds of cascade feed each other.
4. **run** has no natural end. It brings the question of when to stop.
5. **weld** builds carbon skeletons, so shapes get heavier during a round.
6. **link** makes order matter, like cards in a hand.

## How the kinds feed each other

This is where the depth is. A step of one kind can leave the part another kind needs.

- snap leaves a double bond. A double bond is what fold travels along.
- weld leaves a C=O next to a double bond. zip can take that C=O; snap can take that double bond.
- zip leaves an OH. An OH can be turned into a double bond with one reaction, which sets up fold or snap for the next page.
- run leaves a long chain of repeats. Any other kind then has many places to work at once.

A late-game page is: three reactions that set up one kind, whose leftovers set off a second kind, whose leftovers set off a third.

## What the player's reactions are for

A reaction is a setup move. It makes or moves a part so that two parts end up close together. Reactions come in sizes, and bigger ones are unlocked by play:

| Size | What it does | Examples |
|---|---|---|
| small | changes one part into another | OH to C=O, C=O to OH, OH to a double bond, a double bond to OH |
| grow | adds a short piece of chain | add three carbons with a double bond |
| chunk | attaches a whole group with several parts on it | attach a phenol, attach a sugar, attach an amino acid |
| bridge | ties two far ends together | so parts that were far apart are now neighbors |

A chunk or a bridge sets off a bigger cascade because it puts several reactive parts in range at once.

## What is random and what is skill

- **Random:** which reactions are dealt from the player's pool each page; which molecule the round gives; what is offered between rounds.
- **Skill:** reading where the parts are; choosing three reactions and their order so that the right parts end up close; keeping a pool that deals the pairs a cascade needs; leaving the molecule set up for the next page.

## Real compounds

Each kind of cascade builds a recognisable family, so finishing a round on a real molecule is an achievement:

- fold: the steroid skeleton, then cholesterol.
- zip: ladder polyethers.
- snap: cubane, adamantane, norbornene.
- run: polystyrene, nylon.
- weld: the Wieland-Miescher ketone, a classic steroid building block.
- link: small peptides.
- with small reactions only: aspirin, vanillin.

## What was built on 2026-11-11, and where it departs from the table above

Three kinds are built: zip, snap and weld. Fold, run and link are not. Everything below was measured; the numbers are in `RIG.md`.

### Decided

- **How close is close.** Zip: the carbon of the OH is 3 or 4 carbons from the carbon of the C=O, so the ring has five or six atoms. The OH may be on a benzene ring (a phenol). Either part may be in a ring as long as the new ring shares at most one bond with a small ring that is already there. Weld: the carbon beside one C=O is 4 or 5 carbons from the second C=O. Snap: the third C=C is 4 or 5 carbons from the end of the pair.
- **When a cascade runs.** After every reagent of the line that acted. A reagent that found nothing is wasted and sets nothing off. (For most of the day a wasted circle did set a standing chain off; a reviewer called that a free cascade and it was taken out.)
- **What a step is worth.** Step n of a page adds 50 places counted n times, and adds n times 0.1 to extra. It adds, it does not multiply. A round whose pages run three steps ends near 3 times a round with none, six steps near 7 times, ten steps near 17 times.

### A zip opens again when the page turns

This is the largest change and it is not in the table. A ring closed by a zip is loose (a hemiketal): when a page is turned every such ring opens, back to the OH and the C=O it was made from. So the next page starts with the chain as it was set up, and the first reagent fired sets it off again.

Why: a zip uses up its C=O. With rings that stayed shut, the best play fired everything on page one and pages two and three had nothing left; a cascade came on about half of pages at best. No reaction the player holds makes new C=O on a chain that is already zipped. With rings that open again the molecule is an engine: each page fires it, and the three reagents of the page are spent on making it longer (fix a gap, add a piece) or are wasted. A weld or a snap makes carbon to carbon bonds and stays shut.

What it asks of the player: the first reagent of a page meets the chain open. Oxidize fired first turns the OH that starts the zip into a C=O and the chain is dead; fired second, after the zip has run, the same OH is inside a ring and safe. Order matters on every page.

The OH that a zip leaves on its last ring cannot be dehydrated, so a zip can always open again.

### Weld leaves an OH, not a double bond

The table says a weld leaves a double bond beside a C=O. Built that way (`RULE.weld = 'ene'`) it uses up two C=O for one step and leaves nothing a zip can start from. Built as the same reaction stopped before water leaves (`'ol'`, the one played), the second C=O becomes an OH on the new ring, and that OH starts a zip on whatever C=O are next along. The player's own dehydrate finishes it to the double bond. Measured over 100 runs each with weld held from round one, the two were the same within noise (mean steps a page 2.63 and 2.61 against 2.70 without weld), and weld raised the share of pages with any cascade from 84 to 90 percent, because a chain with no OH now starts itself. Weld does not make cascades longer.

### Snap is the Diels-Alder of the table, not the four-ring it was

The snap in the code before this was a four-ring from any two C=C a few carbons apart. Held from round one it cut the mean from 2.70 steps a page to 1.96, because it used up the C=C that zips are started from. Snap is now what the table says: two C=C side by side and a third nearby close a six-ring. What hung beside the first C=C then sits three carbons from what hangs beside the third, so an OH and a C=O that were ten carbons apart can zip. On the molecules built for it a snap turns no cascade into four steps. Across all molecules it changes nothing (2.43 steps a page with and without), because few molecules carry the three C=C.

### Reactions in sizes, as built

| Size | Reagent | What it does | Where it is unlocked | What it adds to the steps of a page when held |
|---|---|---|---|---|
| small | hydrate, hydroborate | C=C to OH, on one carbon or the other | start | |
| small | oxidize | every OH with a hydrogen on its carbon to C=O | start | |
| small | dehydrate | OH to C=C | start | |
| small | reduce | a C=O at the end of a chain to OH | start | |
| grow | grow | every C=O becomes an OH with a three-carbon arm that ends in C=C | start | |
| grow | extend | a chain that ends in C(=O)CH3 grows by three carbons with a new C=O | corner chemist | 0.6 |
| chunk | chain on | the same end grows by six carbons with two C=O; two uses a round | trade supplier | 1.0 |
| chunk | add phenol | the same end takes on a benzene ring with an OH, which starts a zip from that end and cannot be taken away | trade supplier | 0.8 |
| bridge | bridge | two ends C(=O)CH3 join through their CH3 carbons, so a zip that reaches one end crosses to the other | research supplier | 0.3 |

The last column is from the screen (`path.js`, `screenRound`: a player who always fires the line with the most steps, starting reagents plus the one named, all 73 molecules weighted as rounds deal them). The base is 2.4 steps a page.

Two changes to old reagents, in this game only: hydroborate no longer turns C=O into OH, and reduce takes only a C=O at the end of a chain. Before, either one fired on a chain wiped out every C=O on it.

Extend was tried in the starting rack and moved out: with it there, three or more steps came on 62 percent of pages and every round grew by one step a page.

A first bridge, ring-closing metathesis of two C=C, was built and measured and is not offered: it lowered the mean from 2.70 to 2.43 because it uses up the C=C that zips are started from.

### Molecules

73 molecules replace the 25. Every one can zip with the six starting reagents. As dealt most zip one or two steps. The rest is behind gaps: an OH or a C=C where a C=O should be (the starting reagents fix those), or a stretch of six or eight carbons with more C=O beyond it, which takes a chunk, a bridge, a snap or a weld to reach. A few long chains of C=C or of OH zip six to eight steps once two reagents are fired in the right order. Rounds ask for 11.5, 14, 16.5, 19, 21.5, 24, 27, 31 and 35 heavy atoms and deal from the molecules within 3.5 of that. The size limit is 56.

### How to design a molecule or a reagent now

`AA.rxPath.screen(smiles, pool, kinds)` returns in about 25 ms the steps as dealt, the best line of three, and the best from every deal of five. `screenRound` plays three pages. Neither needs a round, a deal or a run. They agree with the game on 16 of 16 molecules tried.

## Not decided

- Whether a step that already ran on an earlier page of the round should pay as much as a new one. A reviewer proposed that only new steps climb.
- Whether weld and snap are worth having as they are: neither makes cascades longer on average.
- Fold, run and link.
