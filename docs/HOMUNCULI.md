# Overreact: the ten homunculi

Settled with the owner 2026-11-11. This replaces the first version of this file. How it was reached is in `HOMUNCULI_2.md` and `HOMUNCULI_3.md`. Pictures: `.claude/shots/hom-<name>.png`. Strength numbers are from a small model (`docs/tools_hom_model.py`, run with `NEW=1`), not from the game. Nothing here is built yet except the jars.

## Rules for all of them

- What comes off the molecule fills jars across runs. A creature hatches from each full jar. One is taken into a run.
- They are perks. They do what the substance is known for in plain terms, and they are big.
- Each must make a run deeper. None is a reaction the player could be dealt.
- Each is fed during a round by something the player's reactions make. When fed it lights up. The player taps it on the page wanted. It lights only when it can do something, so it is never wasted. On hover the page shows what it would do.
- If a creature's food needs a group that only some molecules carry (NH2, SH), then while that creature is held, one of the two molecules offered before each round always carries it.
- The amounts below are first numbers and will be tuned in the game.

## The ten

| # | Creature | Jar | Fed by | Tap, and what happens | Times a round's total, model, middle rounds |
|---|---|---|---|---|---|
| 1 | Water (floods) | fast | 3 waters: dehydrate, the burner | every C=C becomes C-OH, every closed ring opens, the rings close again. Rings that only close again pay a quarter until they pass the longest row of the round | 1.5 |
| 2 | Hydrogen (a balloon, floats over) | fast | 3 hydrogens: oxidize | when the rings stop at a stretch too long, the first C=O on the far side becomes OH and the rings carry on | 1.6 |
| 3 | Carbon dioxide (dry ice, freezes) | medium | 3 carbon dioxides: grow then oxidize (oxidize cuts the end carbon off a chain that ends in C=C) | the rings the page closed are frozen: shut for the rest of the round, paid in full on later pages, cannot be opened again | 1.9 |
| 4 | Acid (eats through) | medium | 3 fumes: hydrate or dehydrate fired | eats the extra carbons out of every stretch too long, leaving 3; and for the rest of the round a ring can close across up to 6 carbons | 1.5 |
| 5 | Wood spirit (blind drunk) | medium | 3 reduces | tapped before lining up: the page fires all five dealt reactions, in a random order, each spending a use | 1.7 |
| 6 | Salt (cures) | medium | 3 oxidizes on a chain-end OH | tap a C=O: it is cured for the round. A ring that closes on it leaves it a C=O, up to 3 rings a page, and no reaction changes it | 1.5 |
| 7 | Slime (sticks) | medium | 3 hydroborates | tap two carbons: they are stuck together and count as 3 apart for the round, so rings cross from one stretch to the other | 1.6 |
| 8 | Ammonia (smelling salts, wakes) | slow | 2 ammonias: oxidize on an NH2 | the page's three reactions fire again by themselves, in the same order, no uses spent | 2.2 |
| 9 | Seedling (grows) | slow | 3 grows | tap a carbon: 6 carbons with 2 C=O grow there, stay for the round, and may pass the size limit | 2.2 |
| 10 | Brimstone (hellfire) | slow | 2 sulfurs: oxidize on an SH | tap a carbon: fire runs from there to the chain end and every 6th plain carbon becomes OH, then C=O, in turn. Then the rings run | 2.3 |

## What the model cannot say

- Acid's wider reach was found by the model and has not been seen on real molecules.
- Ammonia and brimstone were measured on made-up molecules carrying NH2 and SH. No such molecules are in the game yet.
- Salt, slime and seedling were tapped at a few spots only, so a good player gets more from them than the numbers show.
- Wood spirit's page ignores the three uses of a reaction.
- Hydrogen is a little above the fast band in middle rounds; carbon dioxide a little above the medium band. Left for tuning in the game.

## To build, in order

1. The feeding and tap flow for all ten behind one table, with hover preview.
2. Water and hydrogen (the jars are being built).
3. The change to oxidize that gives off carbon dioxide, then the freeze.
4. Acid, salt, slime, seedling, wood spirit.
5. Molecules that carry NH2 and SH, the offer rule, then ammonia and brimstone.
6. Each read on the structural screen and on 200 runs, and the amounts changed until each sits in its band.
