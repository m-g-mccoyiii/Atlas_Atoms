# Overreact: the next helpers

2026-11-11. Three designers, a judge, a model and two artists. Not seen by the owner yet, not built. Strength is from a small model (`docs/tools_help_model.py`), not the game. Pictures: `.claude/shots/help-<object>.png`.

## The judge's thirteen

**Fixes**

**Burner.** Act: heat drives water off.
- Rule: Every OH with no C=O 3 or 4 carbons away loses water and becomes C=C. An OH that could close a ring stays. Each water goes to the jar.
- Choice: when to fire it, after the reagents have set the molecule.
- Pair: burette. Each stray OH becomes C=C, then C=O.

**Burette.** Act: drops run down the chain.
- Rule: Tap a chain end. Going inward from it, every C=C becomes C=O, on the carbon with fewer hydrogens. The tapped end carbon takes an OH if it has none. The rings run.
- Choice: which end.
- Pair: magnet. The burette makes the C=O and the magnet spaces them.

**Magnet.** Act: pulls C=O into a ladder.
- Rule: Tap an OH or a C=O. Every C=O slides along the chain to stand 4 carbons from the one before it, nearest first. None passes another.
- Choice: the first group, which sets the way the ladder runs.
- Pair: burette, as above.

Fixes taken from A. B's burner is too complex and C's burner changes nothing, since the OH would have closed the ring anyway. B's magnet is a second crossing helper beside the new mortar.

**Ten new**

**1. Tower** (object). Act: lightning cuts the double bond.
- Rule: Tap a C=C. The molecule is cut there and each cut carbon becomes C=O. The side nearer the pointer stays and the other falls away.
- Choice: which C=C and which side.
- Pair: reduce. The new end C=O becomes OH, and that is a fresh start.

**2. Mortar** (object). Act: grinds two groups together.
- Rule: Tap an OH, then a C=O, at any distance. A ring closes between them, the C=O becomes OH, and the rings run on from it.
- Choice: both groups.
- Pair: magnet. The C=O left by the forced ring gets a ladder to run down.
- This is the one extra way to cross a long stretch.

**3. Voodoo doll** (object). Act: a pin here, a pin there.
- Rule: Tap an OH or a C=O. The same group is written on the twin carbon, as far from the other end as the tapped carbon is from this end.
- Choice: which group.
- Pair: monkey's paw. The paw writes a C=O at one end and the doll writes its twin at the far end.

**4. Recycler** (object). Act: what came off goes back.
- Rule: Each water collected this round, at most 3, is put back as an OH on a carbon with a hydrogen. The waters still count for the jar.
- Choice: where each OH goes.
- Pair: burner. Burn the strays, then set each water where a ring should start.

**5. Monkey's paw** (object). Act: one wish, with a price.
- Rule: Tap a carbon with a hydrogen and ask for an OH or a C=O on it. The last plain carbon of the longest chain falls off.
- Choice: the carbon and the group.
- Pair: mirror. A wish made before it stands on both halves after it.

**6. Cannula** (object). Act: carries a C=O along.
- Rule: Tap a C=O, then a carbon with a hydrogen. The first becomes CH2 and the second becomes C=O.
- Choice: both carbons.
- Pair: Tower. The cut can strand a stretch with no C=O, and the cannula brings one.

**7. Balance** (object). Act: two groups trade places.
- Rule: Tap an OH, then a C=O. The OH becomes C=O and the C=O becomes OH.
- Choice: both groups.
- Pair: cannula. Swap the start to the far end, then carry the C=O to meet it.

**8. Aqua regia** (object). Act: eats the plain tail.
- Rule: Tap a chain end. Plain carbons from that end inward dissolve up to the first group, and that group's carbon is the new end. Each dissolved carbon leaves as a fume.
- Choice: which end.
- Pair: acid creature, which is fed at once by 3 fumes. It also makes room under the size limit before a mirror.
- It differs from the acid creature, which shortens stretches in the middle.

**9. Methanol** (molecule). Act: puts an OH on the ends.
- Rule: Tap up to 3 chain ends. Each gets a CH2OH, a new carbon with an OH.
- Choice: which ends.
- Pair: burette. The burette makes the C=O along the chain and each new end is a start.

**10. Ethylene** (molecule). Act: two carbons with a double bond.
- Rule: Tap a chain end. Two carbons ending in C=C are added there.
- Choice: which end.
- Pair: dry ice creature. Oxidize on a chain-end C=C gives off carbon dioxide. The C=C also feeds the burette.

**Builds**

1. **One long row:** burette, magnet, mortar, cannula, and the burner clearing strays first.
2. **Many starts:** mirror, seed crystal, voodoo doll, methanol, monkey's paw.
3. **Cut and double:** Tower, aqua regia, mirror, reduce. Cut to the best half, then double it.
4. **Fill the jars:** burner, recycler (water creature), aqua regia (acid creature), ethylene (dry ice creature).
5. **Move the start:** balance, cannula, monkey's paw, Tower. Rebuild where the row begins.

**Dropped**
- **Reflux and hourglass:** they repeat the water creature, which opens the rings and closes them again.
- **Lead into gold:** it repeats the salt creature.
- **Cannula as a tube (A) and the second cannula (B):** the tube repeats the slime creature, and the other does the same job as the spatula.
- **Thermometer, fume hood, stopper, extinguisher:** they are number bonuses, repeat dry ice, or only reorder rings.
- **Sieves and B's mortar:** they only remove carbons, which the mirror and acid already do.
- **Spatula:** it overlaps the Tower and the mirror, which already cuts.

Nothing here has been measured, and I did not read CASCADES.md, LOOP.md or EQUIPMENT.md, only PIECES.md and HOMUNCULI.md. Balance and aqua regia are the weakest picks. The rig should check them first, along with the mortar for crossing too much.

## The model

**Files:** the model is `C:\Users\mgmcc\AppData\Local\Temp\claude\c2e091f86aaa20cc\4b5d48b3-c4d4-47b4-ad30-ef7d19555645\scratchpad\help_model.py`. Raw results are in `res150.json` in the same folder. It ran at 150 molecules per stage with `NEW=1`. I read CASCADES.md and PIECES.md. HOMUNCULI, LOOP, EQUIPMENT and the rules section of the review I only skimmed or skipped, so the creature interactions in the builds are not modeled. The seed crystal rule was clear in PIECES.md, so it is in.

**Each helper alone**
Ratio of the round total with the helper to without it, over every round. Values are early / middle / late.

| helper | beat % | median | p90 | mean |
|---|---|---|---|---|
| mirror | 97/90/83 | 2.44/2.12/1.58 | 3.68/3.45/2.55 | 2.50/2.20/1.70 |
| seed crystal | 97/96/97 | 1.66/1.42/1.40 | 3.09/2.06/1.79 | 1.90/1.53/1.43 |
| burner | 17/15/17 | 1.00/1.00/1.00 | 1.30/1.16/1.20 | 1.08/1.05/1.04 |
| burette | 85/85/82 | 1.36/1.25/1.17 | 2.53/2.17/1.57 | 1.59/1.44/1.24 |
| magnet | 51/72/89 | 1.03/1.20/1.32 | 1.64/1.75/1.75 | 1.20/1.32/1.37 |
| Tower | 7/7/11 | 1.00/1.00/1.00 | 1.00/1.00/1.09 | 1.03/1.03/1.03 |
| mortar | 38/52/49 | 1.00/1.04/1.00 | 1.41/1.36/1.33 | 1.12/1.14/1.13 |
| voodoo doll | 85/87/94 | 1.36/1.41/1.31 | 2.22/2.08/1.75 | 1.55/1.52/1.40 |
| recycler | 90/95/98 | 2.30/1.72/1.76 | 4.23/2.98/2.50 | 2.52/1.93/1.82 |
| monkey's paw | 80/73/86 | 1.33/1.32/1.30 | 2.29/2.13/1.73 | 1.58/1.48/1.36 |
| cannula | 79/87/88 | 1.29/1.32/1.25 | 2.07/1.87/1.59 | 1.38/1.43/1.33 |
| balance | 23/37/37 | 1.00/1.00/1.00 | 1.26/1.33/1.26 | 1.06/1.10/1.09 |
| aqua regia | 20/17/19 | 1.00/1.00/1.00 | 1.31/1.25/1.18 | 1.07/1.06/1.04 |
| methanol | 100/99/99 | 2.42/2.05/1.61 | 4.40/3.99/2.74 | 2.77/2.56/1.80 |
| ethylene | 62/76/74 | 1.11/1.21/1.16 | 1.75/1.51/1.39 | 1.27/1.26/1.18 |

**Pairs**
I do not know which six the judge named, so I picked these. Pair mean against the product of the two alone means, then the median gain over that product.

| pair | pair mean | product of alone | gain over product (median) |
|---|---|---|---|
| burner + burette | 1.99/1.69/1.47 | 1.79/1.53/1.29 | 1.06 each stage |
| burette + magnet | 2.60/2.57/2.17 | 1.96/1.94/1.73 | 1.37/1.28/1.23 |
| mortar + magnet | 1.38/1.55/1.70 | 1.38/1.52/1.57 | 1.00/1.00/1.10 |
| voodoo doll + monkey's paw | 2.76/2.47/1.96 | 2.61/2.36/1.98 | 1.18/1.06/1.02 |
| Tower + cannula | 1.47/1.51/1.46 | 1.43/1.49/1.38 | 1.00 each stage |
| recycler + burner | 3.17/2.74/2.26 | 2.76/2.04/1.90 | 1.05/1.24/1.14 |

Only burette + magnet and recycler + burner clearly beat a plain product. The rest roughly multiply.

**Dead alone (mean under 1.1)**
Burner, Tower, aqua regia, balance and mortar. Mortar (1.12 to 1.14) is only just above the line.
- **Burner:** turning a stray OH into C=O instead of C=C gives 1.39/1.30/1.12. That is a rule change, not a number.
- **Tower:** letting it cut at an OH or C=O as well as a C=C gives 1.12/1.13/1.08. Only 7 to 11 pages in 100 had a C=C worth cutting.
- **Mortar:** two forced rings per use gives 1.11/1.18/1.19.
- **Balance:** two swaps per use gives 1.06/1.12/1.11, which barely moves it.
- **Aqua regia:** eating from every end at once changes nothing (1.07/1.06/1.05). Its worth is the fumes feeding the acid creature, which this model does not have.

**Too strong (over 2.5)**
Methanol (2.77 early, 2.56 middle) and recycler (2.52 early). Neither is far over.
- **Recycler:** a cap of 2 waters instead of 3 gives 2.23/1.66/1.58.
- **Methanol:** 2 ends instead of 3 still reads 2.57 early. 1 end gives 2.08/1.65/1.32.

**Where the model is too crude to trust**
- It reads high on the two known pieces. Mirror averages about 2.2 here against 1.23 in the game's own reading, and seed crystal about 1.5 against 1.13. Judge every row against the mirror and seed crystal, not against the raw 1.1 and 2.5 lines.
- Helpers that put in OH or C=O (methanol, recycler, seed crystal) are inflated most. The player is greedy over lines and sees each helper's best 4 places, ranked by rings closed right away. That undercounts helpers that set up a later step, such as Tower, balance and cannula.
- It has no creatures, so the jar builds (burner, recycler, aqua regia, ethylene) are not tested. The model's C=C is one tagged carbon, which is crude for Tower and ethylene.
- The recycler only has water after a dehydrate has run on an earlier page.
- The magnet is modeled as the new ladder rule, not the older gap-closing magnet in PIECES.md.
- Pair search uses 40 lines and 2 states per page.

## Pictures

Seven pictures are saved, 1080 wide and portrait. I read each back with Read and fixed the cut-off and overlap problems I found. I did not re-read the Burner, Voodoo doll and Recycler images after the last edits.

Each picture has the title, steps 1 to 3 (before, object used, after) and the "Pairs with" lines. The scripts are in the scratchpad folder: `help_lib.py` holds the shared drawing code and `help_all.py` holds the seven pictures.

- `C:\Work\atlas-atoms\.claude\shots\help-burner.png`: a stray OH becomes C=C and a water goes to the jar. The OH 4 carbons from a C=O stays, and no ring is drawn there.
- `C:\Work\atlas-atoms\.claude\shots\help-burette.png`: three C=C become C=O from the tapped end, the end carbon takes an OH, and 3 rings close.
- `C:\Work\atlas-atoms\.claude\shots\help-magnet.png`: C=O at 6, 8 and 15 slide to 5, 9 and 13, which gives 3 rings from the OH.
- `C:\Work\atlas-atoms\.claude\shots\help-tower.png`: lightning cuts the C=C, the pointer side stays with 1 ring, and the far side is drawn faded as falling away.
- `C:\Work\atlas-atoms\.claude\shots\help-mortar.png`: an OH and a C=O 9 carbons apart are ground together, which closes ring 1. That C=O becomes OH, and ring 2 runs on to the next C=O.
- `C:\Work\atlas-atoms\.claude\shots\help-voodoo-doll.png`: a faceless cloth doll puts a pin in the tapped C=O and writes its twin at the mirrored carbon, which gives 2 rings, one on each side.
- `C:\Work\atlas-atoms\.claude\shots\help-recycler.png`: 2 waters go from the jar back as OH on the chain, which gives 2 rings, and the jar still holds 2.

- **After state:** after rings close, the picture shows each ring-end C=O as a red OH, following the rule that the C=O becomes OH. This differs from brimstone, which kept the C=O yellow.
- **Burette tie-break:** the rule says the C=O goes on the carbon with fewer hydrogens, but each C=C in the drawing is CH=CH, so the two carbons tie. I put the C=O on the carbon farther along, and that choice is mine. A reader checking hydrogen counts could object.
Six pictures are saved in C:\Work\atlas-atoms\.claude\shots. I read each one back and fixed the clipped text, the overlapping labels and the cramped step spacing, then looked again. I did not re-open the balance and aqua regia pictures after their last small edits (wording, and a smaller ring around the C=O). They regenerated without errors.

Each is 1080 wide, portrait, with the numbered steps (molecule, object in use, molecule after) and a "Pairs with" block.

- **Monkey's paw** (`C:\Work\atlas-atoms\.claude\shots\help-monkeys-paw.png`): a paw wishes a C=O onto the carbon 4 from the OH and the last carbon falls off, so 1 ring closes. Pairs with the mirror.
- **Cannula** (`C:\Work\atlas-atoms\.claude\shots\help-cannula.png`): a tube carries the C=O from 8 carbons along to 4 from the OH, so 1 ring closes. Pairs with the Tower.
- **Balance** (`C:\Work\atlas-atoms\.claude\shots\help-balance.png`): a beam balance swaps the OH and a C=O 7 apart, and the new OH lands 3 from another C=O, so 1 ring closes. Pairs with the cannula.
- **Aqua regia** (`C:\Work\atlas-atoms\.claude\shots\help-aqua-regia.png`): a beaker dissolves 3 plain carbons up to the first C=O, which becomes the end, with 3 fumes and no rings. Pairs with the acid creature.
- **Methanol** (`C:\Work\atlas-atoms\.claude\shots\help-methanol.png`): a CH2OH is added on both ends of a chain with two C=O, so 2 rings close, numbered in the order tapped. Pairs with the burette.
- **Ethylene** (`C:\Work\atlas-atoms\.claude\shots\help-ethylene.png`): a C=C pair is added at one chain end, making the chain 2 carbons longer with no rings. Pairs with the dry ice creature.

The scripts are `help_lib.py` and `help_six.py` in the scratchpad directory (`C:\Users\mgmcc\AppData\Local\Temp\claude\c2e091f86aaa20cc\4b5d48b3-c4d4-47b4-ad30-ef7d19555645\scratchpad`).

- **Ring counts:** I worked them out by hand from the 3-or-4-carbon rule, not from the game rig.
- **Methanol:** the picture taps 2 ends, although the helper allows up to 3.

## What to do with them (decided after the model, 2026-11-11)

The model reads high: it gives the mirror about 2.2 where the game read 1.23. So compare rows with each other, not with the creatures.

- **Build next (8):** burette (new rule), magnet (new rule), voodoo doll, recycler capped at 2 waters, monkey's paw, cannula, methanol on 1 end, ethylene.
- **Burner:** stays as the owner made it (every OH loses water and becomes C=C). It is weak alone and its worth is water for the jar, the water creature and the recycler. The pair recycler and burner is one of two that clearly beat the two apart.
- **Hold (2):** mortar and tower. Dead alone in the model, which undercounts helpers that set up a later page. Read them on the game's structural screen before building.
- **Drop (2):** balance and aqua regia.
- Pairs that clearly beat the two apart: burette with magnet, recycler with burner. The others only multiply. More real pairs are needed before section 3 of `PASS.md` can pass.
