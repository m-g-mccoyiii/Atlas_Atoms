# Overreact: the whole loop

Written 2026-11-10. The first part is what the game does now. The second part is designed and not built.

## Progression comes first

The owner's rule, 2026-11-10: sigils, pets and the like are unlocked by play. A first run must be the bare game, and each new layer arrives because the player did something.

| Stage | What the player has | How the next thing is earned |
|---|---|---|
| First run | a molecule, four reagents, rows, a number to beat, the take-one-of-three | play |
| Sigils (built) | none at first, and no page of sigils and no circle | each sigil by a deed: glass by a round with no broken row, lean by a round beaten with two reagents, long by a row of ten, hoard by holding five pieces, occult by beating five rounds in a run |
| Suppliers (built) | the corner chemist | credit from rounds beaten |
| Pets (not built) | none | to be earned by deeds, one at a time |
| Sigil transmutations (not built) | none | to come with the sigil that grants them |

The page of sigils appears only after the first sigil is earned. Sigils not yet earned are drawn faint with the deed that earns them.

## What is built

### A run

1. **Terms.** Once a sigil has been earned, a run opens on the page of sigils. One is taken. It sets the terms of the run and lies under the molecule as a transmutation circle. A run on the plain sigil has no circle.
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

The whole arc, with stages, the nine-round run, the seven seals, familiars, the pact and the stone, is in `ARC.md`. The balance matrix is step 3 of its order of work.

## Known weak points

- The numbers to beat were measured before the circle and the sigils existed, so rounds are easier than intended.
- Clicks on the monkey's paw, the fire extinguisher, the beaker, the balloon and the sigils have been triggered by script, never by a real mouse.
- Sound has not been tested.
- Large molecules still become dense tangles.
