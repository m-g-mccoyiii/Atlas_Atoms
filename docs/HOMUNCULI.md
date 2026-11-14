# Overreact: the ten homunculi

**Second design, 2026-11-13, with seven of the ten changed the same day (ruling AR; see "The seven changed")** (ruling AP: "reward gameplay not averages"). Built in `path.js` behind `RULE.homs2` (on) and in the simulator (`docs/tools_chem/sweep_homs.py`); numbers are in `docs/RIG.md`, thirteenth measure, part 3 (the twelfth, part 3, for the design before the seven changes). The first design (settled 2026-11-11) is kept below for the record; its jars, names and pictures stand.

## The rule for all ten

- A homunculus is lit by HOW the page just fired was played. The player taps it before turning the page. One tap a page. Any number of pages a round.
- Each pays for one way of playing, and each asks for something in return.
- The game holds one homunculus in a run. Two at once exist only in the simulator; since 13 November each of the two has its own tap on a page (see "Two at once").
- Nothing is counted up across pages to feed it. Its food is what that one page made.
- The amounts are in one table (`HOMS2K`).

## The numbers as the player reads them (since 13 November, the flat rule)

Every "yield times" on this page multiplies the product a round makes (places times row times extra). Since the fourteenth measure the yield the player reads is the square root of that product, so each multiplier reads as its square root. The strength of a creature in rounds won did not change.

| On this page | As read on the yield |
|---|---|
| times 1.25 | 1.12 |
| times 1.4, 1.8, 2.2 | 1.18, 1.34, 1.48 |
| times 1.5 | 1.22 |
| times 2 | 1.41 |
| times 2.5 | 1.58 |
| times 0.6 (the balloon pops) | 0.77 |
| times 0.7 (the seedling wilts) | 0.84 |

Dry ice: the table of numbers in `path.js` (`HOMS2K.co2`) holds 1.36, which is for each of the three reagents left shut; three times over that is the 2.5 written here. The two always agreed; the comment above the table said so only in passing and has been rewritten.

## The five changed on 2026-11-13 (fifteenth measure), as the player reads them

These five lines replace the lines of the same creatures in the table below and in "The seven changed". Numbers and trials: `docs/RIG.md`, fifteenth, part 2.

**Hydrogen.** Fire only two reagents on a page, oxidize second: yield times 1.58 and the chain's count carries over the page turn. If the next page's own chain is shorter, yield times 0.77.
Round 1, `C=C(C)CCC(=O)CCCC=O`, page two. Lined up: grow, oxidize, and the third circle left empty. Grow lands on two places; oxidize lands on two and a dry, a tuck and a weld follow. Tap: the yield goes from 8,518 to 13,468 and page three starts counting at 3. The third reagent not fired is the price.

**Slime.** Fire the same bottle twice on a page, each time landing and each setting off a reflex: yield times 1.58. That bottle is empty for the rest of the round.
Round 1, `C=CCCC(Cl)C(O)CC=O`, page one. Lined up: oxidize, grow, oxidize. The first oxidize sets off a weld and a dry, the second a weld. Tap: 3,648 becomes 5,769, and oxidize cannot be used on pages two and three.

**Seedling.** End a page 12 atoms bigger: yield times 1.34, then 1.61, then 1.84 for each page in a row. Once tapped, a later page that grows less wilts it: yield times 0.84.
The same molecule, page two. Lined up: grow, oxidize, grow. Grow adds three carbons at two places, oxidize makes more C=O, the second grow lands on three. Tap: 7,012 becomes 9,408. Page three must grow 12 again or it wilts.

**Wood spirit.** Put a bottle that cannot act first: he drinks it and pours every dealt bottle you did not line up, a use of each; if one lands, yield times 1.22. The bottle he drank is empty for the rest of the round.
The same molecule, page two. Dealt: hydrate, oxidize, grow, thiolene, ritter. Lined up: oxidize (finds nothing), hydrate, hydrate. Tap: he pours grow (lands), thiolene (lands) and ritter (finds nothing). 5,588 becomes 6,934. Oxidize is gone for page three, and grow, thiolene and ritter each lost a use.

**Brimstone.** Land sulfur with the task at least half done, not on the last page: the round ends now and the task counts as met; yield times 1.22 after page one, 1.12 after page two.
The same molecule, task "one more C=O at the finish", page one. Lined up: oxidize, oxidize, thiolene. Oxidize makes the C=O; thiolene puts an SH on. Tap: the round ends, 1,525 becomes 1,868. With the task not yet half done he would not have lit.

## The ten

| Creature | Lit when | Tap | What it asks | The play it rewards |
|---|---|---|---|---|
| Water (floods) | the page gave off 4 or more waters | yield times 1.5; then the flood: every C=C becomes C-OH and the rings run again | the flood takes the double bonds the next reagents wanted | the wet page: set up OH, then dry it all at once |
| Hydrogen (floats over) | the page's last reagent is oxidize, it lands, and the page's chain is 3 steps or more; not on the last page | the chain floats over the page turn: the next page's chain counts on from this one | a bet: if the next page's own chain is shorter than the one that floated, the balloon pops and the yield is times 0.6; and oxidize must go last | order: a chain of three with oxidize last, then a bigger page |
| Dry ice (freezes) | on the last page, if carbon dioxide came off this round and 3 of the six reagents never acted in it | yield times 2.5 | the whole round played with three reagents | the narrow round: make carbon dioxide (grow, then oxidize) and leave three bottles shut |
| Acid (eats through) | the molecule ends the page 2 atoms smaller or more | yield times 2 | a smaller molecule: fewer places for the next page; one water off is not enough | the cutting page: two or more things driven off and no growth |
| Wood spirit (blind drunk) | on any page, the FIRST reagent lined up found nothing to act on | he drinks it and pours every dealt reagent that was not lined up, left to right, free of charge; if one of his pours lands the yield is times 1.25 | the first circle and one use thrown away; the order he pours in is the deal's, not the player's | a bottle that cannot act put first on purpose, two good ones after it, and two spare ones in the hand worth pouring |
| Salt (cures) | the line is the page before's line again, reagent for reagent | yield times 2.5 and the three get their use back | the same line lands on less the second time | a line that can be played twice |
| Slime (sticks) | two or three of the page's reagents each land and each set off a reflex of their own | yield times 1.5 for two, times 2.5 for three | the bottles he stuck are shut on the next page (three bottles are always left) | several small chains in one page in place of one long one |
| Ammonia (smelling salts) | nitrogen went on the molecule this page (the nitrogen reagent lands, or a knit) | the page's three reagents fire again, same order, no use spent | the nitrogen reagent in the line, or a molecule that knits by itself; firing again can undo | nitrogen lines |
| Seedling (grows) | the molecule ends the page at least 8 atoms bigger | yield times 1.4, then 1.8, then 2.2 for each page in a row | once tapped it must be fed: a later page that grows less than 8 and it wilts, yield times 0.7, the row starts again | growing hard every page of the round |
| Brimstone (hellfire) | sulfur went on the molecule this page (the sulfur reagent lands, or a cap); not on the last page | the round ends now and whatever is left of the spec is burned: it counts as met; yield times 1.5 after page one, times 1.25 after page two | the pages not played: the yield made so far must carry the round | the fast round: sulfur and a big first page when the spec looks out of reach |

## The seven changed on 2026-11-13, each with one worked example

Ruling AR: fix the weak ones now. The aim for each: lit by something the player sets up with the three reagents, pays enough to aim a page at, has a cost or a risk, and changes which line is best. Not all seven are there yet: the numbers, and which ones a reviewer still fails, are in `docs/RIG.md`, thirteenth, part 3. Every example below was played on the reference chemistry.

**Wood spirit.** Put a bottle that cannot act first, and he pours the two bottles you did not line up.
Round 2, a ring ketone with two C=C and no OH (`C=C(C)C1CC=C(C)C(=O)C1`). Dealt: dehydrate, grow, hydrate, oxidize, thiolene. Lined up: dehydrate, grow, hydrate. Dehydrate finds no OH: nothing. Grow adds three carbons at the C=O. Hydrate puts an OH on three C=C. No reflex yet; the yield stands at 159. Tap: he pours oxidize, which turns an OH into a C=O, and a dry and a ring follow; then thiolene, which puts an SH on. The yield is about 1,800. Lined up the plain way, oxidize would have had to take the place of grow or hydrate.

**Hydrogen.** End a page of three reflexes with oxidize, and the count carries over the page turn.
Round 4, `O=CC=C(C=O)CCCCC=CC1CO1`. Lined up: hydrate, hydrate, oxidize. Oxidize lands last; the page's reflexes are dry, weld, weld: three. Tap: the next page starts counting at 3, so its first reflex pays as a fourth. If the next page makes fewer than 3 reflexes of its own the balloon pops and the yield is times 0.6.

**Dry ice.** Play the whole round with three bottles and make carbon dioxide once.
Round 4, `C=C1CC(O)(CC=O)C(O)C12CCCC2`. Page one: dehydrate, dehydrate, grow. Page two: dehydrate, oxidize, grow. Page three: grow, oxidize, oxidize. Carbon dioxide comes off once (oxidize cuts a chain-end C=C that grow made). Hydrate, thiolene and ritter never acted. Tap on the last page: yield times 2.5.

**Acid.** Make the molecule lose two atoms or more on a page.
Round 5, `C=C(C)C1(O)CCC2=CC(=O)CC(CO)C2(C)C1`. Lined up: dehydrate, oxidize, oxidize. Dehydrate takes two waters off; the two oxidize find nothing left to act on; the molecule ends 2 atoms smaller. Tap: yield times 2. The next page has two OH fewer to work on.

**Slime.** Make each reagent start its own reflex.
Round 4, a three-ring amine (`CCC1=C2C(CC=O)=C3CC1C(=O)C(C3)C2N`). Lined up: grow, oxidize, hydrate. Each lands and each sets off one reflex (a snap, a shift, a dry). Tap: yield times 2.5. On the next page two of the three (grow and oxidize, the first two of the line) are shut: three bottles of the five dealt always stay. With only two of the three starting a reflex it is times 1.5.

**Seedling.** Grow by 8 atoms on a page, and then keep growing.
Round 4, `C=C1CC(O)(CC=O)C(O)C12CCCC2`. Lined up: oxidize, grow, hydrate. Oxidize makes a second C=O, grow adds three carbons at each: the molecule ends 9 atoms bigger. Tap: yield times 1.4. Grow 8 or more again on page two and it is times 1.8; grow less and it wilts, times 0.7.

**Brimstone.** Land sulfur early and end the round on the spot, the spec burned.
The same molecule. Page one: thiolene, hydrate, hydrate. Thiolene puts an SH on the C=C: lit. Tap: the round ends now, the spec counts as met whatever it asked for, and the yield of that one page is times 1.5. It is worth it only if that yield passes the round's mark.

## Two at once

The game holds one homunculus in a run. In the simulator two can be held and each has its own tap on a page, in the order held, so two taps can follow one another on a page: the Wood spirit pours the nitrogen reagent and Ammonia then fires the three of the line again. All 45 pairs are measured in `docs/RIG.md`, thirteenth, part 3: no pair was shown to do clearly more than its two creatures multiplied, and some get in each other's way.

What the game would need to hold two: the round's creature state (`g.hom`, one object: which creature, tapped this page or not, its row, its float) made a list; `homLit`, `homSpots`, `homUse` and `homGo` taking which creature is meant; the run holding two (`run.hom`); the page drawing two jars on the bench with a tap each; and the order of taps decided (left to right is what the simulator does). The rules of each creature do not change.

## Not done, and open

- The page does not draw any of this yet beyond the old tap (the interface is the old one: `homLit`, `homSpots`, `homUse`, `HOMS[id].tok`).
- `brings` is as it was (wood spirit brings reduce, slime hydroborate, ammonia cyanohydrin, brimstone chugaev). None of the new rules needs them.
- Jar speeds were not looked at again.

---

# The first design (2026-11-11), for the record

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
| 3 | Carbon dioxide (dry ice, freezes) | medium | 1 carbon dioxide (it was 3, see "Read in the game"): grow then oxidize (oxidize cuts the end carbon off a chain that ends in C=C) | the rings the page closed are frozen: shut for the rest of the round, paid in full on later pages, cannot be opened again | 1.9 |
| 4 | Acid (eats through) | medium | 1 fume (it was 3, see "Read in the game"): hydrate or dehydrate fired | eats the extra carbons out of every stretch too long, leaving 3; and for the rest of the round a ring can close across up to 6 carbons | 1.5 |
| 5 | Wood spirit (blind drunk) | medium | 1 reduce (it was 3) | tapped before lining up: the page fires all five dealt reactions, in a random order, each spending a use | 1.7 |
| 6 | Salt (cures) | medium | 1 oxidize on a chain-end OH (it was 3) | tap a C=O: it is cured for the round. A ring that closes on it leaves it a C=O, up to 3 rings a page, and no reaction changes it | 1.5 |
| 7 | Slime (sticks) | medium | 1 hydroborate (it was 3) | tap two carbons: they are stuck together and count as 3 apart for the round, so rings cross from one stretch to the other | 1.6 |
| 8 | Ammonia (smelling salts, wakes) | slow | 2 ammonias: oxidize on an NH2 | the page's three reactions fire again by themselves, in the same order, no uses spent | 2.2 |
| 9 | Seedling (grows) | slow | 1 grow (it was 3) | tap a carbon: 9 carbons with 3 C=O (it was 6 with 2) grow there, stay for the round, and may pass the size limit | 2.2 |
| 10 | Brimstone (hellfire) | slow | 2 sulfurs: oxidize on an SH | tap a carbon: fire burns the next 8 plain carbons toward the chain end and writes an OH on the 4th and a C=O on the 8th. Groups already there stay. Then the rings run | 2.3 |

## What the model cannot say

- Brimstone was first weakened to every 6th carbon. Groups 6 apart cannot close a ring, so that was dropped for a shorter fire with the groups 4 apart. Lengths 12, 16 and 20 gave 2.9, 3.1 and 3.1 in middle rounds.

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

## Read in the game, 2026-11-11: water, hydrogen, carbon dioxide

Built as one table (`HOMS` in `path.js`; `JARS.md` says how). Read on 200 runs of the median simulated player, seeds 1 to 200, all nine rounds, against the same seeds with no creature. "Where tapped" is a round's total over the same round without it, geometric mean, in the rounds it was tapped in. The player does not feed a creature on purpose, so it is lit in few rounds.

| Creature | Amounts in the game | Tapped in | Where tapped | The same, median | All rounds | Rounds beaten, with and without | Band |
|---|---|---|---|---|---|---|---|
| Water | 3 waters, once a round | 24% of rounds | 1.31 | 1.27 | 1.06 | 7.84, 7.79 | fast: in |
| Hydrogen | 3 hydrogens, once a round | 4% | 1.60 | 1.29 | 1.02 | 7.83, 7.79 | fast: median in, mean over |
| Carbon dioxide | 1 carbon dioxide, once a round, frozen rings paid 2 times over at each later page | 10% | 1.67 | 1.58 | 1.05 | 7.96, 7.79 | medium: in |

- Water, read in the game: in its band as settled. On the structural screen (16 molecules, one round each) it was tapped in 10 and those rounds made 1.31.
- Hydrogen, read in the game: left at 3. It is rarely worth a tap (it needs two or more C=O beyond the stretch), and no amount changes how strong a tap is. On the screen it was tapped in 6 of 16 rounds for 1.03.
- Carbon dioxide, read in the game: two amounts changed. Oxidize gives off carbon dioxide only at a C=C on the very end of a chain: 3.3 a run for the median player, 5.1 for the greedy one. Fed by 3 it was almost never lit, so it is fed by 1. Paid once ("in full"), freezing made nothing (1.00 on 40 runs, tapped in 2 rounds in 100) because frozen rings cannot be worked on by the next page's reagents; paid 2 times over it is 1.67, 2.5 times 2.12, 3 times 2.31. The carbon dioxide count measured earlier (2.07 a round, in `HOMUNCULI_2.md`) counted lines that were only tried and was about five times too high.
- Jars: water 200, hydrogen 130, carbon dioxide 50 (about 6 to 8, 6 to 8 and 10 to 15 runs of greedy or median play).
- Frames: `.claude/shots/hom-water-game.jpg`, `hom-hydrogen-game.jpg`, `hom-co2-game.jpg`.

## Read in the game, 2026-11-11, later: acid, wood spirit, salt, slime, seedling

Built as entries of the same table. Read on runs of the median simulated player, seeds 1 to 200, all nine rounds, against the same seeds with no creature (`tools_hom_cmp.py`). "Where tapped" is a round's total over the same round without it, geometric mean, in the rounds it was tapped in. Measured, awaiting review.

| Creature | Amounts in the game | Runs | Tapped in | Where tapped | The same, median | All rounds | Rounds beaten, with and without | Band |
|---|---|---|---|---|---|---|---|---|
| Acid | 1 fume, once a round, stretches eaten to 3, rings reach 6 | 108 | 19% of rounds | 1.31 | 1.25 | 1.05 | 7.83, 7.79 | medium, 1.4 to 1.8: under |
| Wood spirit | 1 reduce, once a round | 35 | never | | | 1.00 | 7.80, 7.80 | medium: not reached, see below |
| Salt | 1 oxidize on a chain-end OH, once a round, 3 rings a page | 200 | 6% | 1.11 | 1.12 | 1.01 | 7.86, 7.79 | medium: under |
| Slime | 1 hydroborate, once a round | 200 | 14% | 1.24 | 1.27 | 1.04 | 7.84, 7.79 | medium: under |
| Seedling | 1 grow, once a round, 9 carbons with 3 C=O | 196 | 37% | 2.10 | 2.18 | 1.31 | 8.03, 7.78 | slow, 1.8 to 2.5: in |

- Fed by 3, as first settled, none of the five was lit: in 24 to 29 runs each, acid was tapped in 6 rounds of 261, slime in 1, seedling in 1, salt in none. The things that feed them happen 0.3 to 1.8 times a round (per run: fumes 16.1, grows 5.7, hydroborates 5.4, oxidizes on a chain-end OH 4.2, reduces 2.9). So each is now fed by 1.
- Acid, read in the game: under its band with every amount tried. Fed by 2 with reach 6: 1.15 where tapped (71 runs, tapped in 7 rounds in 100). Fed by 1 with reach 7: 1.20 (69 runs). Fed by 1 with reach 8: 1.18 (54 runs). Fed by 1 with reach 6, as kept: 1.31. A wider reach adds nothing, so the settled 6 stays. Fed before page one (not a real setting, 15 runs) it was 1.26.
- Wood spirit, read in the game: a player that reads the page never taps it. It plays the page both ways on a copy (the wood spirit three times, with orders of its own) and the best line of three made more every time. Made to tap it on page one of every round (33 runs) the round made 0.74 of what it made without, and rounds beaten fell from 7.94 to 7.12. A random order of all five is worse than three in the right order: oxidize or dehydrate fired before the rings close takes the OH they start from. No amount changes that. The rule was not changed.
- Salt, read in the game: under its band. A ring that closes on the cured C=O leaves no new OH there, so the row stops at it; it pays only where two or three OH sit round one C=O. Fed before page one (12 runs) it was 1.69 where tapped, median 1.27.
- Slime, read in the game: under its band, a little. Two taps a round in place of one made no difference (1.25 on 158 runs), so it stays at one.
- Seedling, read in the game: with 6 carbons and 2 C=O, fed by 2 it was 1.58 (76 runs) and fed by 1 it was 1.68 (86 runs), under the slow band. With 9 carbons and 3 C=O it is in the band. It is the only one of the five that moves rounds beaten (by a quarter of a round).
- The structural screen (`homTable`) was not run for these five: it has no tap before the line. The reads above are whole runs.
- Jars: acid 200, wood spirit 40, salt 50, slime 70, seedling 120 (about 12, 14, 12, 13 and 21 runs of the median player).
- Frames: `.claude/shots/hom-acid-game.jpg`, `hom-wood-game.jpg`, `hom-salt-game.jpg`, `hom-slime-game.jpg`, `hom-seedling-game.jpg` (the seedling frame shows the arm of 6 carbons, recorded before it became 9).

## Seventeenth measure, 2026-11-13: growth, three made simpler, two jars, the manual's lines

Full tables: `docs/RIG.md`, seventeenth, parts 5 to 7. Everything here is behind a switch that is off; the creatures play as before.

**Each alone on the deal as it stands** (careful player, 100 runs; worth 1.0 is no creature): Ammonia 1.16, Water 1.12, Slime 1.10, Wood spirit 1.09, Salt 1.07, Brimstone 1.07, Acid 1.06, Dry ice 1.05, Hydrogen 1.03, Seedling 0.99. None is near the 1.5 that ruling AT asks for.

**Getting better at their jobs** (`RULE.homGrow`: `'run'`, `'keep'`, `'both'`; `P.homStage(run, id)`; `HOMGROW`). Five stages; a stage multiplies what the job does to the yield by 0.8, 0.9, 1, 1.15, 1.3 (stage 3 is the creature as it is).

- `'keep'`: the jar keeps counting after it hatches; stages 2 to 5 at 2, 4, 7, 11 times the jar's size. Dry ice, the creature used most, reaches stage 5 at about run 62 (careful) or 129 (casual); Water at 98 or 223.
- `'run'`: stage 1 at the start of every run; a stage at 2, 4, 7, 10 jobs done in the run. Only the Wood spirit (12 jobs a run) gets near stage 5; most stay at stage 1 or 2.
- All ten alone, wins of nine in 100: stage 1 0.36, as they are 0.51, stage 5 0.80, growing in the run 0.54.

**Three made simpler** (`RULE.homSimple`, the recommended one of each in the game; all nine in `sweep_homs.py` as `MODE`):

- Hydrogen: drive off 2 hydrogens, x1.18 (worth 1.07; it is 1.03 now and does its job once a run, this one seven times).
- Wood spirit: line up a reagent that finds nothing, x1.16 (worth 1.04 at x1.12 and 1.20 at x1.22; he no longer pours).
- Brimstone: put sulfur on the molecule; the round ends and the task counts as met (worth 1.05; it is 1.07 now).

**The wood spirit's and the slime's jars** (simulator only). As they are neither hatches in 300 runs. Smaller jars (15 and 25): the wood spirit at about run 173, the slime never. Fed by a starting play too (a reagent that found nothing; a page on which one reagent landed twice): the wood spirit at run 5 to 7 with its jar of 40 (a jar of 250 would put it at about run 30), the slime at run 25 (careful) or 70 (casual).

**The manual's lines** follow the owner's pattern of 13 November (name and one verb; the act; the number alone; a side effect as a bare fact; how it is got as a bare count): Acid, Water, Salt, Seedling, Slime, Dry ice, Ammonia. Hydrogen, Wood spirit and Brimstone wait for the version picked.

## Eighteenth measure, 2026-11-13: the owner's picks on, every creature refitted

Full tables: `docs/RIG.md`, eighteenth, parts 1 and 2. This section is how the ten stand in the game now; where a section above disagrees, this one wins.

**On, by the owner's picks:** creatures keep what they grow (`RULE.homGrow = 'keep'`); Hydrogen, Wood spirit and Brimstone have one job each (`RULE.homSimple`).

**Refitted** (owner: "Raise them to about 1.5 at stage 3"). Held alone a creature is worth about 1.2 at stage 1, 1.35 at stage 2, 1.5 at stage 3, 1.65 at stage 4 and 1.8 at stage 5 to the careful player (worth 1.5: as much help as every yield times 1.5). Each has five numbers of its own (`HOMGROW.read`), and six had their job eased in one plain way because the number alone could not do it or made rounds of 50 times the number to beat and more.

| Creature | Its line on a new profile (stage 1) | Its number at stages 1 to 5 | What changed in the job |
|---|---|---|---|
| Water | Water floods. Wring out 3 waters. x1.30. Double bonds soak up OH; closed rings burst. | x1.30, x1.50, x1.71, x1.93, x2.15 | 3 waters (it was 4) |
| Hydrogen | Hydrogen lifts. Drive off 2 hydrogens. x1.38. | x1.38, x1.62, x1.84, x2.11, x2.46 | the one job |
| Dry ice | Dry ice freezes. Leave 3 reagents untouched to the last page. x1.91. | x1.91, x2.40, x2.82, x3.89, x4.50 | no carbon dioxide needed |
| Acid | Acid eats. Chew 2 atoms off the molecule. x2.01. | x2.01, x2.58, x3.17, x3.95, x4.50 | nothing: the number only |
| Wood spirit | Wood spirit drinks. Line up a reagent that finds nothing. x1.22. | x1.22, x1.33, x1.40, x1.45, x1.51 | the one job |
| Salt | Salt preserves. Open with last page's first reagent. x1.35. Its use returns. | x1.35, x1.49, x1.67, x1.92, x2.15 | the first reagent only (it was the whole line) |
| Slime | Slime clings. Land one reagent twice. x1.32. That bottle is shut all round. | x1.32, x1.45, x1.56, x1.66, x1.88 | no reflex asked for |
| Ammonia | Ammonia revives. Put nitrogen on the molecule. The three reagents go round again. x1.08. | x1.08, x1.23, x1.32, x1.45, x1.57 | a number of its own |
| Seedling | Seedling sprouts. Add 6 atoms. x1.30. | x1.30, x1.50, x1.67, x1.91, x2.25 | 6 atoms (it was 12); a plain number: no rising, no stall |
| Brimstone | Brimstone burns. Put sulfur on the molecule. The round ends; the task counts as met. x1.17. | x1.17, x1.30, x1.39, x1.52, x1.59 | the one job; on the last page too; a number |

- Measured alone, careful player, 100 runs a cell: stage 1 worth 1.16 to 1.22, stage 3 1.46 to 1.55, stage 5 1.70 to 1.84. Nine-round wins in 100: 0.32 with none, 1.1 at stage 1, 3.0 at stage 3, 5.7 at stage 5.
- The casual player: the middle creature is worth 1.54 at stage 3, but he still wins almost no nine-round run with a creature alone (0.02 in 100). Slime is weak for him (1.19).
- Big rounds: at stage 3 the biggest round is 23 times the number to beat. At stage 5 Hydrogen (55 times), Seedling (47), Water (43) and Acid (38) make very big rounds.
- Brimstone's number is a choice for the owner: his sentence for it has none, and with none it is worth 1.11 and cannot grow.
- The older rules are kept: `HOMS2K_17` for the seven whose table changed, `RULE.homSimple = null` for the three.
- The two jars that never fill: `RULE.jarStart` (off) feeds the wood spirit from a reagent that finds nothing and the slime from one reagent landed twice, with jars of 250 and 70.

## Nineteenth measure, 2026-11-14: once a round, Brimstone once a run

Full tables: `docs/RIG.md`, nineteenth. This section is how the ten stand in the game now; where a section above disagrees, this one wins.

Owner (ruling BB): a homunculus acts once a round, on the page the player picks; Brimstone works once a run and keeps its number; the wood spirit's and the slime's jars are fed by an ordinary play too; Ammonia's second go keeps the page's limits when Solve is held; the "Brings X." lines are gone from the book (the rule itself stands: a homunculus held in a run still puts its reagent on the rack).

Eight were fitted again for one tap a round, so that alone each is still worth about 1.2, 1.35, 1.5, 1.65 and 1.8 at stages 1 to 5. Dry ice was lit only on the last page already and keeps its numbers. Brimstone keeps its numbers by the owner's pick.

| Homunculus | Its line on a new profile | Its number at stages 1 to 5 | The eighteenth's numbers (a tap on every page) |
|---|---|---|---|
| Water | Water floods. Wring out 3 waters. x1.36. Once a round. Double bonds soak up OH; closed rings burst. | x1.36, x1.83, x2.19, x2.54, x2.92 | x1.30 to x2.15 |
| Hydrogen | Hydrogen lifts. Drive off 2 hydrogens. x1.50. Once a round. | x1.50, x1.86, x2.15, x2.39, x2.75 | x1.38 to x2.46 |
| Dry ice | Dry ice freezes. Leave 3 reagents untouched to the last page. x1.91. | x1.91, x2.40, x2.82, x3.89, x4.50 | the same |
| Acid | Acid eats. Chew 2 atoms off the molecule. x1.96. Once a round. | x1.96, x2.67, x3.17, x4.05, x4.50 | x2.01 to x4.50 |
| Wood spirit | Wood spirit drinks. Line up a reagent that finds nothing. x1.54. Once a round. | x1.54, x1.72, x1.88, x2.08, x2.38 | x1.22 to x1.51 |
| Salt | Salt preserves. Open with last page's first reagent. x1.54. Once a round. Its use returns. | x1.54, x1.87, x2.13, x2.36, x2.64 | x1.35 to x2.15 |
| Slime | Slime clings. Land one reagent twice. x1.55. Once a round. That bottle is shut all round. | x1.55, x1.76, x1.98, x2.17, x2.38 | x1.32 to x1.88 |
| Seedling | Seedling sprouts. Add 6 atoms. x1.48. Once a round. | x1.48, x1.71, x1.92, x2.26, x2.73 | x1.30 to x2.25 |
| Ammonia | Ammonia revives. Put nitrogen on the molecule. The three reagents go round again. x1.24. Once a round. | x1.24, x1.48, x1.73, x1.96, x2.21 | x1.08 to x1.57 |
| Brimstone | Brimstone burns. Put sulfur on the molecule. The round ends; the task counts as met. x1.17. Once a run. | x1.17, x1.30, x1.39, x1.52, x1.59 | the same |

In the rules (`path.js`): `RULE.homOnce` and `RULE.brimOnce` (both on). The round's state says a tap is spent (`g.hom.rt`); the run's says Brimstone's fire is gone (`run.homSpent.brimstone`, the round it burned in, written at the round's end). `P.homSpent(g)` gives `null`, `'round'` or `'run'`. `HOMGROW.read18` keeps the eighteenth's numbers for a creature switched back to a tap on every page.

Jars: the wood spirit's takes 250 (reagents that found nothing, or uses of reduce), the slime's 70 (pages with one reagent landed twice, or uses of hydroborate); `P.jarFull(id)`.
