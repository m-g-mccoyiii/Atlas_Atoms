# Overreact: the whole loop

Written 2026-11-10. The first part is what the game does now. The second part is designed and not built.

## What is built

### A run

1. **Terms.** A run opens on a page of six sigils. One is taken. It sets the terms of the run and lies under the molecule as a transmutation circle.
2. **Take one of three.** Before every round the page offers three things: a new reagent, a piece of equipment, a level for a piece already owned, a stronger reagent, or more uses of one. Up to five pieces of equipment are held.
3. **Choose the round.** Three molecules stand on the page. Each shows what the round asks, the number to beat and what it pays.
4. **The round.** Three pages, three reactions a page.
5. **Beat the number** and the run goes on to the next round with a higher number. Miss it and the run is over.
6. **Suppliers.** After a run, each round beaten pays one credit. Credit opens suppliers and families for every later run.

### A round

- A page deals reagents from the rack, each with a limited number of uses. A reagent is clicked and the molecule reacts at every place the reagent fits.
- **Score.** The page shows a total, and under it points times multiplier. Places changed add points. The multiplier is the row times extra.
- **Row.** A reaction that acts on what the last reaction just made continues the row and raises the multiplier. A reaction that does not breaks the row: what the row made is kept and the row starts again.
- **Overreact.** If a page ends with a row of three or more, the molecule keeps reacting by itself, free, until nothing continues the row.
- **Families.** The shape the molecule is in gives a bonus: chain, ring, arene, sugar, cage, and resonance, which builds up as the molecule gains linked double bonds. The player builds these during a round with reagents that close rings, make arenes and snap cages.
- **By-products.** Water and hydrogen that leave the molecule are collected. Three water give one more reaction on the page; three hydrogen give every reagent one more use.
- **The circle.** A reagent lights a rune on the circle the first time it is used. A broken row puts out the last rune. A full circle multiplies the round and starts again. The reagent that keeps the row and the reagent that feeds the circle are often different.

### What a run collects

- **Reagents.** Four to start: add water, oxidize, grow, lose water. More come from the take-one-of-three.
- **Equipment.** Sixty pieces on three shelves: lab (steady), alchemy (strong, with a condition), occult (strongest, with a price). Rules for all sixty are in `EQUIPMENT.md`.
- **Sigils.** plain, glass, occult, lean, long, hoard.

### What carries over between runs

| Unlock | How | What it adds |
|---|---|---|
| Suppliers, six tiers | credit: 0, 6, 16, 30, 50, 80 | more reagents and equipment in the offers; the last two are the alchemist and Brenda (deceased), who sell the alchemy and occult shelves |
| Families of reagents | credit: 5, 8, 14 | organometallics, ylides, radicals |
| Found reactions | doing a named row for the first time | the one-step reagent for that row |
| Self-reactions | supplier tier | close a ring, make an arene, snap a cage |

There are no timers, login streaks or paid currency.

## Designed, not built

### Sigils that grant transmutations

The owner's direction: a sigil should let the player do a new transmutation, not only multiply. The plan is that a full circle performs the sigil's transmutation on the molecule, free:

| Sigil | Transmutation on a full circle |
|---|---|
| ring sigil | closes a ring |
| cage sigil | snaps two double bonds into a cage |
| arene sigil | turns a ring into an arene |
| growth sigil | the molecule grows by three carbons |
| gold sigil | one atom becomes a heavy isotope, which scores more wherever it is touched |

This ties the sigil to the families: the sigil chosen before the run decides which family the run can build toward. Terms such as glass and lean would become a second, separate choice (stakes), the way Balatro separates deck from stake. Sigils would be unlocked by deeds, for example the cage sigil by making a cage in a run.

### Pets (homunculi)

The owner's direction: turn the homunculus from a shelf piece into a pet that is unlocked and does things, about ten of them, animated.

Assessment: this is a better home for anything that acts by itself. The intern, the raven and the homunculus are already "something that does a thing for the player"; as shelf pieces they are words under an object. As a pet the action is visible: the creature walks to the molecule and does it. One pet is taken into a run, which adds a third choice at the start after sigil and stakes.

Ten candidates, each one action the player can watch:

1. Homunculus: does the last reaction of each page again.
2. Raven: carries the last reagent of a page to the next.
3. Intern: does one reaction of its own choosing on each page.
4. Black cat: walks across the row; a broken row pays for what it lost.
5. Rat: eats a by-product and turns it into points.
6. Toad: swallows the worst reagent on the page and spits out a random one.
7. Moth: goes to the heaviest atom; that place counts twice.
8. Imp: steals one use of a reagent each page and doubles another.
9. Snail: slow. Lights one rune of the circle every page by itself.
10. Golem: holds a broken row once a round.

Building it needs a creature that moves on the page: a walk to a point, an action pose, a return. That animation rig does not exist yet and is the main cost. The raven, the intern, the cat and the homunculus would leave the shelf when they become pets.

### Interaction and balance matrix

The owner asked for a full interaction and evaluation matrix. The plan:

1. **Solo worth.** Every piece of equipment alone, 41 simulated rounds each, as now.
2. **Pairs.** All 1,770 pairs of the sixty pieces. A pair worth much more than the product of its two solo worths is a combo; much less is an anti-combo. This finds the broken pairs and the dead pieces.
3. **Sigil by piece.** Six sigils against sixty pieces, same measure.
4. **Run survival.** For each sigil, how many rounds a simulated player beats, with equipment taken first and with reagents taken first.
5. **A better player.** The simulated player is greedy: it never breaks a row on purpose, never wishes, never feeds the circle. Pieces that reward those (black cat, monkey's paw, the circle) cannot be measured until it can.

The output is one table in `docs/` with a flag on every outlier, and the balance pass is made from it.

## Known weak points

- The numbers to beat were measured before the circle and the sigils existed, so rounds are easier than intended.
- Clicks on the monkey's paw, the fire extinguisher, the beaker, the balloon and the sigils have been triggered by script, never by a real mouse.
- Sound has not been tested.
- Large molecules still become dense tangles.
