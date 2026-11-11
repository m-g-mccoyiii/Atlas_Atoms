# Overreact: the homunculi, all at once

2026-11-11. The owner asked for the rest to be designed at once and all of them compared for strength. Three designers, a judge, a model and a comparison. Nothing here is built in the game. The model is a small Python program (`docs/tools_hom_model.py`), not the game.

## The five new ones, as the judge picked them

**1. WOOD SPIRIT** (merge of B's rule and C's food)
- Looks like: a tipsy little brown bottle on legs, wearing a lampshade.
- Fed by: 3 reduces. A C=O at a chain end becomes OH, which is how methanol is made. Reduce is a starting reaction, so no molecule changes are needed.
- Rule, tapped on a page before lining up:
  - The page fires all five dealt reactions instead of three.
  - They fire in a random order.
  - Each one spends a use.
- Chooses: which page, and whether to do it at all.
- Run effect: the player builds lines that work in any order and keeps uses in hand for one huge page.
- Rejected: A overlaps acid and hydrogen. A and B both need a new OCH3 molecule and a changed dehydrate. C's double pay is a plain bonus on top of the shuffle, and C's carbon-cost reroll adds complexity for little gain.

**2. SALT** (C's rule and food, A's protection line)
- Looks like: a white crab with a crusted shell, claws up.
- Fed by: 3 oxidizes on a chain-end OH. OH becomes C=O, then the acid end that makes a salt.
- Rule, tapped on a C=O:
  - It is cured for the round.
  - A ring that closes on it leaves it as C=O.
  - Up to 3 rings a page can close on it, all counted in the row.
  - No reaction changes it: oxidize, reduce and grow all skip it.
- Chooses: which C=O to cure.
- Run effect: one C=O becomes the engine of the round, and the player decides how far to push it against the size limit.
- Rejected: A has no cap, so it is untested and swings with molecule shape. B carries pieces across rounds, which depends on the owner's unanswered question about carrying shape. A and B both need a Cl molecule. C's crust-a-carbon line is dropped as extra.

**3. BRIMSTONE** (A)
- Looks like: a yellow lump with a match-head tuft, steaming, on a smouldering stone.
- Fed by: 2 sulfurs from oxidize acting on a C-SH, which becomes C=O. This needs molecules dealt with an SH, so it needs a rig measurement.
- Rule, tapped on a carbon:
  - Fire runs from there to the chain end.
  - Along that stretch, every 4th plain carbon becomes OH, then C=O, alternating and starting with OH.
  - Existing groups stay.
  - The rings then run.
- Chooses: where the fire starts, and so which end gets rewritten.
- Run effect: a bad half of the molecule is replaced with a ready zipper, so reactions go to the near half.
- Rejected: B is dead on straight chains. C's bridge looks like slime, its S ring-path rule is unsettled, and sulfur from dehydrate overlaps acid's source.

**4. SEEDLING** (C's food, B's limit line)
- Looks like: a green shoot in a clay pot, with a fruit swelling on it.
- Fed by: 2 grows. Each grow arm ends in C=C, the plant's growth signal. Grow is a starting reaction, so no switch is needed.
- Rule, tapped on a carbon:
  - Nine carbons with three C=O grow there.
  - They stay for the round.
  - They may pass the size limit by up to 9 carbons.
- Chooses: the carbon, and so where the new chain joins the rings.
- Run effect: the player plants it early so every later page starts longer, and big late molecules stop being a risk.
- Rejected: A's food shortens the chain and changes dehydrate. B's dehydrate food also needs a switch. C's extra growth every page has no cap and stacks with the limit.

**5. SLIME** (A)
- Looks like: a green blob in a lab coat, with two stretchy arms.
- Fed by: 3 boranes from hydroborate acting on a C=C. Hydroborate is a starting reaction.
- Rule, tapped on two carbons:
  - They are stuck together as neighbours.
  - They count as 3 carbons apart for the rest of the round.
  - The join stays shut at the page turn.
- Chooses: both carbons, to bring two far stretches into reach so the rings cross from one to the other.
- Run effect: the molecule becomes a map to bridge. It is the first creature that joins two parts of a chain.
- Rejected: Silver mirror does not touch the molecule, and B says to drop it. Bleach is only a cash-out, and its food is doubtful.

**Strength notes**
- Slime and acid both close gaps, but slime joins one chosen pair and cannot trim a whole stretch.
- Salt's cap of 3 and seedling's limit pass need measuring before any amounts are fixed.
- Brimstone and the wood spirit need no new reaction code, but brimstone needs SH molecules dealt on purpose.

## The model of the first six

Water is far out of line: it roughly triples a round, about twice what any other creature does. Acid and hydrogen are the weakest.

Script: `C:\Users\mgmcc\AppData\Local\Temp\claude\c2e091f86aaa20cc\4b5d48b3-c4d4-47b4-ad30-ef7d19555645\scratchpad\hom_model.py`. Run it with `python hom_model.py 150` (about 20 seconds). Each creature is one small function (`water`, `hydrogen`, `carbon_dioxide`, `acid`, `ammonia`, `sprout`), registered in `CREATURES`.

The run was 450 random molecules, 150 each at about 14, 22 and 33 carbons. Mean round totals without a creature were 1376, 1930 and 2213.

**Table.** "fed" is the share of rounds where the jar can be filled in the round. "used" is the share where using it beats the best play without it. The median and 90th percentile are the ratio of round total with it to without it, over rounds where it was used. "mean" is the mean ratio over all rounds.

| creature | stage | fed % | used % | median | p90 | mean |
|---|---|---|---|---|---|---|
| water | early | 100 | 95 | 3.28 | 4.02 | 2.98 |
| water | middle | 100 | 99 | 3.32 | 4.75 | 3.36 |
| water | late | 100 | 99 | 3.22 | 3.75 | 3.12 |
| hydrogen | early | 100 | 40 | 1.50 | 2.54 | 1.26 |
| hydrogen | middle | 100 | 65 | 1.67 | 3.51 | 1.61 |
| hydrogen | late | 100 | 62 | 1.23 | 2.38 | 1.30 |
| carbon dioxide | early | 99 | 73 | 1.60 | 3.70 | 1.81 |
| carbon dioxide | middle | 100 | 87 | 1.85 | 4.14 | 2.15 |
| carbon dioxide | late | 100 | 91 | 1.53 | 2.46 | 1.61 |
| acid | early | 100 | 3 | 1.61 | 1.94 | 1.02 |
| acid | middle | 100 | 27 | 1.30 | 2.79 | 1.14 |
| acid | late | 100 | 47 | 1.24 | 1.78 | 1.17 |
| ammonia | early | 10 | 8 | 2.31 | 4.08 | 1.16 |
| ammonia | middle | 26 | 25 | 2.17 | 5.85 | 1.50 |
| ammonia | late | 39 | 37 | 1.56 | 2.47 | 1.26 |
| sprout | early | 100 | 100 | 2.14 | 3.50 | 2.42 |
| sprout | middle | 100 | 99 | 1.92 | 2.86 | 2.10 |
| sprout | late | 100 | 98 | 1.71 | 2.35 | 1.76 |

**Assumptions**
- A molecule is a tree of carbons (OH, C=O, C=C, NH2). A ring closes when an OH is 3 or 4 carbons from a C=O. Grow adds a three-carbon arm with a C=C end. The size limit is 56.
- A reaction acts everywhere it fits, and the zip runs only after a reaction that acted. Carbons in a ring are protected, and rings open again at the page turn.
- The player has all six reactions every page and picks an ordered line of three different ones. The player looks ahead: the top 5 lines on page 1, then the top 5 on page 2, then the best on page 3.
- Scoring follows the rules you gave. A ring that only closes again on a later page pays a quarter.
- Feeding is counted inside one round. Water is one per OH dehydrated, hydrogen one per OH oxidized, acid fumes one per hydrate or dehydrate that acted, and carbon dioxide one per terminal C=C cut off by oxidize. Ammonia is one per NH2 oxidized.
- Molecules carry 2 or 3 NH2 with probability 0.1, 0.3 and 0.4 by stage. That number sets the ammonia fed rate, so it is a guess.
- A creature is used at most once a round, on the page and at the start or end of the line where it pays best. Where the feed comes from is also chosen: either the best-scoring lines, or lines that favour feeding it.
- Frozen rings pay in full on every later page. Rings after a flood or a second pass count on from the last ring number.

**Findings**
- **Water is far out of line.** It reopens the rings and closes them again with higher ring numbers, so a page pays about three times. It is also always fed, because grow then dehydrate gives plenty of water.
- **Sprout is next strongest.** It gives about 2x with no feeding at all, because it adds three rings every round.
- **Carbon dioxide is strong and varies a lot.** It pays well when the chain is long enough that the frozen rings pay in full on every later page.
- **Hydrogen and acid are the weakest.** Hydrogen helps only when a gap stops the chain, and acid helps only when long stretches are the main block, which is rare in early rounds. Both pay about 1.2 to 1.7 times when used.
- **Ammonia is gated by its source.** It is strong when it fires but cannot be fed in most rounds, so its strength depends on how many molecules carry NH2.
- **Arithmetic, not luck.** Grow then oxidize feeds hydrogen and carbon dioxide at once, and grow then dehydrate feeds water. A sensible player can fill several jars cheaply.

## All of them compared

Hom_model.py now has all eleven creatures. I ran it at 150 molecules per stage; the six old rows match your earlier table. The script is `C:\Users\mgmcc\AppData\Local\Temp\claude\c2e091f86aaa20cc\4b5d48b3-c4d4-47b4-ad30-ef7d19555645\scratchpad\hom_model.py`. A copy of the old version is `hom_model_orig.py` in the same folder.

Each cell is fed% / used% / median / p90. The ratio is round total with the creature over round total without it, over rounds where it was used.

| creature | early | middle | late |
|---|---|---|---|
| water | 100/95/3.28/4.02 | 100/99/3.32/4.75 | 100/99/3.22/3.75 |
| hydrogen | 100/40/1.50/2.54 | 100/65/1.67/3.51 | 100/62/1.23/2.38 |
| carbon dioxide | 99/73/1.60/3.70 | 100/87/1.85/4.14 | 100/91/1.53/2.46 |
| acid | 100/3/1.61/1.94 | 100/27/1.30/2.79 | 100/47/1.24/1.78 |
| ammonia | 10/8/2.31/4.08 | 26/25/2.17/5.85 | 39/37/1.56/2.47 |
| sprout | 100/100/2.14/3.50 | 100/99/1.92/2.86 | 100/98/1.71/2.35 |
| wood spirit | 98/51/1.74/3.30 | 99/61/1.70/3.56 | 100/54/1.37/2.34 |
| salt | 98/35/1.47/2.43 | 99/47/1.51/2.02 | 100/69/1.34/2.12 |
| brimstone | 10/10/2.03/4.47 | 30/30/3.17/6.21 | 43/43/3.53/6.53 |
| seedling | 100/100/2.39/4.77 | 100/100/2.45/5.10 | 100/100/1.99/3.04 |
| slime | 100/83/1.72/3.28 | 100/89/1.62/3.72 | 100/78/1.28/1.89 |

**Too strong**
- **Water:** about 3.3 times, far above a fast jar.
- **Brimstone:** about 3.2 to 3.5 times in middle and late rounds, when it can be fed at all.
- **Seedling:** about 2.4 times, from a jar that 2 grows fill every round.
- **Sprout (the kept one):** about 2 times, with no feed at all.

**Too weak**
- **Acid:** it is almost never used early, and the mean gain is 1.02 to 1.17 times.
- **Ammonia:** strong when it fires, but it is fed in only 10 to 39% of rounds.

**In range**
- Wood spirit, salt and slime sit at 1.3 to 1.7 times. Hydrogen is a bit above the fast band when used.

**Smallest changes** (each retested at 150 per stage):
- **Water:** after a flood, rings count from the first row again and pay a quarter until they pass the longest row of the round. The median drops to 1.53 early, 1.52 middle and 1.32 late. Changing how much it is fed does nothing, since it is fed 100% already.
- **Seedling:** 6 carbons with 2 C=O instead of 9 with 3. It drops to 2.0 early, 2.1 middle and 1.65 late, so it is a medium jar. Feeding it 3 grows instead of 2 would slow it toward the 1.8 to 2.5 band.
- **Brimstone:** every 6th plain carbon instead of every 4th gives 2.1 middle and 2.5 late. Every 8th gives about 1.9 and 2.0, which is a slow jar. Every 5th still gave 2.6 and 3.0.
- **Salt:** raising the cap from 3 to 4 rings a page changed nothing, so the cap never binds. Leave it at 3.
- **Acid:** no number fixes it. It eats only stretches longer than 3, and early molecules rarely have any. It needs a second effect, or a different trigger such as eating any stretch.
- **Ammonia:** its strength is set by how many molecules carry NH2, which is a guess.

**Where the model is too crude to trust**
- **Wood spirit:**
  - Hand: the player gets the best 5 of 6 reactions, not 5 dealt at random.
  - Order: the order is the median of 8 random orders.
  - Uses: use limits are ignored. The three-uses-a-reaction cap never bound, but the spirit's page may cost more uses than the model charges.
- **Brimstone:** the sulfur is a flag on the molecule, the same 0.1, 0.3 and 0.4 rates as NH2. Its fed rate is a guess, and the oxidized SH adds no C=O.
- **Slime and salt:** taps are chosen from 7 and 8 spread-out candidates, which understates a good player.
- **Salt and wood spirit:** both are used at the start of a page only.
- **Seedling and sprout:** they tap only a few carbons, so their strength is a floor.
- **All creatures:** one use per round per creature, and one molecule shape family. Ring pay on long molecules is the most sensitive part, since that is what water, carbon dioxide and seedling feed on.
- **Small effects (under about 0.1):** noise at 150 per stage.

## Pictures

C:\Work\atlas-atoms\.claude\shots\hom-wood.png: Wood spirit. A bottle in a lampshade is fed by 3 reduces (C=O to OH). The page's five reactions are numbered 3, 1, 5, 2, 4 for their random firing order. The result is 4 rings.

C:\Work\atlas-atoms\.claude\shots\hom-salt.png: Salt. A crab is fed by 3 oxidizes (OH, then C=O, then the acid end). A ring normally uses up a C=O. The tapped C=O is cured, and 3 rings close on it while it stays C=O.

C:\Work\atlas-atoms\.claude\shots\hom-brimstone.png: Brimstone. A sulfur lump on a stone is fed by 2 oxidizes on a C-SH (it becomes C=O and sulfur comes off). From a tapped carbon the fire runs to the chain end and every 4th plain carbon becomes OH, C=O, OH. Then 3 rings close.

C:\Work\atlas-atoms\.claude\shots\hom-seedling.png: Seedling. A potted shoot is fed by 2 grows (each arm ends in C=C). A molecule at the size limit gets a 9-carbon branch with 3 C=O at the tapped carbon. Then 4 rings close and the chain runs past the size limit.

C:\Work\atlas-atoms\.claude\shots\hom-slime.png: Slime. A blob in a lab coat is fed by 3 hydroborates (BH2 added on a C=C). Two far-apart stretches get two tapped carbons grabbed by its arms and counted as 3 apart. Then 4 rings close across the green join.

All five are 1080 px wide and portrait, and no text runs past 1040 px. I looked at each one and fixed overlaps and cramped spacing before the final save.
