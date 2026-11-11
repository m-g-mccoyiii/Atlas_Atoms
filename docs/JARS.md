# Overreact: the jars and the homunculi

## Changed 2026-11-11, later: one table for ten, and water, hydrogen and dry ice as settled

Measured, awaiting review. Nothing here says a section passes. `HOMUNCULI.md` was settled with the owner after the section below was written. This section says what is built now; where it differs from the section below, this one is right.

### One table

Everything a creature is, is one entry of `HOMS` in `path.js`: its name and token, how fast its jar fills, what feeds it, how many feeds it needs, how many taps a round, where it can act, what it does, and for the rig a rule of thumb. All ten have an entry. Three are built (water, hydrogen, dry ice). Seven are stubs marked `offered: false`: they have no jar, are never fed and cannot be taken. `DEV_NOTES.md` lists the fields and the three places a new creature touches.

- **Fed.** Things that happen in a round are raised as events: `water`, `h2`, `co2` when that leaves the molecule, `use:<reagent>` when a reagent acts. An event feeds the creature held if its entry names it, and counts toward that creature's jar whether it is held or not.
- **Lit.** A creature is lit when it is fed, has a tap left this round, and has somewhere to act. Its name is then written larger in its own ink and the figure lifts. Fed with nowhere to act, its drops are struck through.
- **Tap.** After a page has fired and before the next is dealt, a lit creature makes the page wait. A click on the figure taps it (hydrogen with several places: a click on the place). The turn arrow leaves it.
- **Once a round** (`uses: 1`), as in the model the strengths came from. After a tap it is empty.
- **Hover.** Pointing shows what would change: the bonds drawn heavy in the creature's ink, and the entry's `word` lettered where a group will be written. No discs.

### What the three do, as built

| | Jar | Fed by | Tap |
|---|---|---|---|
| water | fast | 3 waters coming off | every C=C outside a benzene ring becomes C-OH, every closed ring opens (not a frozen one), the rings close again. The count of rings starts again at one, so a ring that only closes again pays a quarter and a ring past the longest row of the round pays in full |
| hydrogen | fast | 3 hydrogens coming off (oxidize) | where the rings stopped, the first C=O beyond the stretch becomes OH and the rings carry on, counting on. A place is offered only if a ring would close from it |
| dry ice | medium | 1 carbon dioxide coming off | the rings the page closed are frozen: they stay shut for the rest of the round and nothing opens them. At the start of each later page they are counted again and paid 2 times over (ring n: 50 places counted n times, 0.1 n of extra, 0.1 of row), and the page's rings count on from them. Not offered on the last page |

Where the build departs from `HOMUNCULI.md`:

- **Dry ice is fed by one carbon dioxide, not three.** Oxidize gives off carbon dioxide only when it meets a C=C at the very end of a chain. That is 3.3 a run for the median player and 5.1 for the greedy one, under one in two rounds. With three it was almost never fed.
- **Frozen rings are paid 2 times over, not once.** Paid once, freezing lost more than it gave in the game (see the numbers): the frozen rings can no longer be worked on by the page's reagents, and most of a round's total comes from those.
- **Every creature is tapped after the page has fired.** The model also let some be tapped before the line. Not built.
- **Carbon dioxide comes off in every run** (`RULE.co2` is on), since the jar has to fill before the creature exists.

The count of carbon dioxide written into `HOMUNCULI_2.md` earlier (2.07 a round) was wrong: lines the player only tried were counted. Fixed here; the true figure is in the table below.

### The dry ice figure, the frost and the jar row

- `homco2` in `kitart.js`: a pale block on two thin legs, standing in mist.
- A frozen ring has the page under it washed pale blue, from the moment of the tap to the end of the round.
- A jar stands on the page once its substance has first come off (water and hydrogen from the start of stage II). Up to two jars stand full size with "38/200" under each. With more they share the same corner, smaller, in one row of up to five or two rows, with the count alone under each.
- The page before a run lays out up to eleven things (ten creatures and "none"): up to three as on the take-one page, up to six in one row, more in two rows. Seen with four. Not seen with more, since only three creatures exist.
- The figure in a run stands at the bottom right, lower than before, clear of a fifth reagent.

### Fill counts

What comes off in one whole run, 40 runs a player (12 for the median player), seeds from 1, no creature held, the game as it now stands:

| Player | Water | Hydrogen | Carbon dioxide |
|---|---|---|---|
| novice | 6.1 | 5.3 | 2.0 |
| greedy | 34.0 | 17.3 | 5.1 |
| median | 26.0 | 21.1 | 3.3 |

`JAR.full`: **water 200, hydrogen 130, carbon dioxide 50.** Runs to fill: water 5.9 (greedy) and 7.7 (median); hydrogen 7.5 and 6.2; carbon dioxide 9.9 and 15, about twice as long, as a medium jar. The greedy player gives off more than it did when the first counts were set (it beats more rounds now), so water went from 150 to 200 and hydrogen from 80 to 130.

### Measured

**The screen**, one round on each of 16 molecules (every fifth of the list), the starting reagents, round five's deal, every page the line that makes most (`homRound`). Score is the round's total over the same round with no creature.

| Held | Score, all 16 | Tapped in | Score where tapped | Raised, lowered |
|---|---|---|---|---|
| water | 1.18 | 10 | 1.31 | 10, 0 |
| hydrogen | 1.01 | 6 | 1.03 | 4, 2 |
| dry ice (fed by 1, paid 3 times, by the rule of thumb) | 1.21 | 6 | 1.66 | 5, 1 |

**Whole runs**, the median player, seeds 1 to 200, every run played through all nine rounds, each against the same seeds with no creature (`tools_hom_cmp.py`). The number to beat was not fitted again.

| Held | Rounds tapped in | Total where tapped, geometric mean | median | Total, all rounds | Rounds beaten, with and without | Band |
|---|---|---|---|---|---|---|
| water | 433 of 1,800 (24%) | 1.31 | 1.27 | 1.06 | 7.84, 7.79 | fast, 1.2 to 1.5: in |
| hydrogen | 63 of 1,800 (4%) | 1.60 | 1.29 | 1.02 | 7.83, 7.79 | fast, 1.2 to 1.5: the median is in, the mean is over (a few very large rounds) |
| dry ice, fed by 1, paid 2 times | 174 of 1,800 (10%) | 1.67 | 1.58 | 1.05 | 7.96, 7.79 | medium, 1.4 to 1.8: in |
| dry ice, fed by 1, paid 2.5 times (199 runs) | 199 of 1,791 (11%) | 2.12 | 1.89 | 1.08 | 7.94, 7.79 | over |
| dry ice, fed by 1, paid 3 times (60 runs) | 61 of 540 (11%) | 2.31 | 2.22 | 1.09 | 7.83, 7.70 | over |

- **The band is read where the creature was tapped.** Over all rounds each adds 2 to 6 in 100, because it is lit in few rounds: the simulated player does not feed it on purpose. No creature moves rounds beaten by more than 0.2.
- **Water** is in its band with the settled amounts (3 waters). In rounds four to six it is 1.37.
- **Hydrogen** was left at 3. Its strength has no amount to turn: fewer hydrogens only light it more often (first reads on 30 to 40 runs: tapped in 5, 8 and 13 rounds in 100 with 3, 2 and 1). It is rarely worth tapping.
- **Dry ice** was moved twice. Fed by 3 and paid once it was tapped in 2 rounds in 100 and made nothing (1.00 on 40 runs); with the rule of thumb in place of playing the round both ways it lowered the rounds it was used in to 0.59. Fed by 1 and paid 2 times it is in its band.
- The simulated player decides the freeze by playing the rest of the round both ways on its own deals and taps only if that makes more, so "where tapped" for dry ice is where freezing was right. A person will also freeze when it is wrong.

### Not done, and what is wrong

- The simulated players do not play to feed a creature. A person who fires dehydrate or oxidize on purpose will have it lit more often than these runs show.
- Hydrogen is rarely worth tapping: it needs two or more C=O beyond a stretch the rings could not cross.
- Dry ice is fed by one event that is rare. When it is fed and the page closed a long row, the page turn pays a great deal at once.
- The flood shows small waters leaving as the rings open, which reads as water coming off while water is going on.
- A frozen molecule can leave a page with no reagent that acts; the page then turns by itself.
- The choose page and the jar row were not seen with more than four and three.
- The pointing preview was seen in recorded frames with the pointer state set by hand, not under a real pointer.

## Built 2026-11-11 (the first build: superseded above where the two differ)


Measured, awaiting review. Nothing here says a section passes. What each homunculus does is the owner's rule from `HOMUNCULI_2.md` ("Water: agreed by the owner", "Hydrogen: agreed by the owner"). Each effect is one entry of the table `HOMS` in `path.js` and can be changed there without touching anything else.

### The jars

- What comes off the molecule is collected: water in one jar, hydrogen in the other. Each by-product flies from the place it left to the mouth of its jar.
- The jars fill across runs. They are saved with the player's progress (`jar` and `hatched` in the saved `aa_scheme_meta`). A jar is never emptied.
- What a round gave off is banked when the round ends, whether it was beaten or not, so a lost run leaves something behind.
- A homunculus grows in each jar in three stages: a speck from 12 in 100 of full, a small figure from half, the full figure when the jar is full. A full jar hatches at once: the count under it becomes the name.
- The jars stand at the top left of the round page, where the beaker and the balloon stood, with the count under each ("38/150"). They show from stage II on, because `ARC.md` keeps water and hydrogen off the page in stage I. They are counted from the first run all the same.
- The old beaker and balloon are gone, with their spend (three waters for one more reaction, three hydrogens for one more use), `spendBy`, the click on them and their labels. The burner no longer adds to the row when hydrogen leaves (a leftover of the sixty pieces that distorted measures).

### Fill counts

What comes off in one whole run, 40 runs a player on unseen seeds (2,001 on), no homunculus held:

| Player | Rounds played | Water, mean (quartiles) | Hydrogen, mean (quartiles) |
|---|---|---|---|
| novice | 3.4 | 4.8 (1, 4, 7) | 4.5 (2, 4, 6) |
| greedy | 4.9 | 24.0 (14, 26, 36) | 9.6 (5, 8, 15) |
| median | 8.2 | 32.4 (22, 33, 41) | 27.6 (21, 27, 35) |

Chosen (`JAR.full` in `path.js`): **water 150, hydrogen 80**.

| Jar | Full at | Runs to fill: greedy | median | novice |
|---|---|---|---|---|
| water | 150 | 6.3 | 4.6 | 31 |
| hydrogen | 80 | 8.4 | 2.9 | 18 |

The greedy player is taken as ordinary play. A player who never gets past round three fills a jar very slowly; the players are 7 times apart in what they give off, so no one number puts all of them in five to eight runs.

### The page before a run

Once a homunculus has hatched, a new run opens on a page of its own, in the manner of the take-one page: the title "homunculus", each hatched figure standing on the page with its name, its rule as a short token and three drops for what feeds it, and an empty jar named "none". A click takes one. Keys 1 to 3 do the same. With none hatched the page does not appear. The jars stand at the top left of this page too.

### In a run

- The homunculus taken stands at the bottom right of the round page, beside the ladder, with its name and three drops. A drop fills each time its substance comes off the molecule in the round (dehydrate, the burner and anything else that drives water off feed the water one; oxidize feeds the hydrogen one).
- With three it is ready. When a page has fired and its cascade has ended, and the homunculus has somewhere to act, the page waits before the next page is dealt: the go arrow reads "turn", the figure rises a little, and the steps it would add are written beside it. The next deal is not on the page.
- A click on the figure sets it off. Hydrogen with more than one place: each place has an ink tick and its steps, and a click on a place sets it off there. Pointing shows what will change: the bonds drawn heavy in the figure's color and "OH" written where an OH will be. No discs.
- A click on the turn arrow (or Enter) leaves it and turns the page. It stays fed.
- With nothing ready, or nowhere to act, the page turns by itself as before. No waiting is added to a page that has no homunculus to offer.
- It goes to the molecule and back in under half a second (470 ms; the molecule changes at 210 ms). The water one runs, squashing, and leaves puddles on the paper that dry; it makes a squish (`sfx.squish`, synthesised). The hydrogen one drifts over on its string with a soft rising sound (`sfx.drift`).
- After it acts it is empty and must be fed three more. It can act again on a later page of the same round.

### What each does, as built

| | Fed by | Does | Costs |
|---|---|---|---|
| water | 3 waters coming off | every C=C outside a benzene ring becomes C-OH (the carbon hydrate would pick), every ring a zip closed opens, and the zip runs again. Its steps count on from the steps the page has already run | the C=C |
| hydrogen | 3 hydrogens coming off | one C=O becomes OH and the zip goes on from there. The places offered: for each OH, the nearest C=O along the chain (where the zip stopped, that is the first C=O beyond the stretch it could not cross). With no OH on the molecule, any C=O | that C=O |

Counting on is what makes them pay: a step is paid in full only past the longest cascade of an earlier page, and steps that follow a page of five are steps six and up.

Rules with no page: `homReady`, `homSpots`, `homTry`, `homUse`, `homGo`, `runBank` in `path.js`. `run.hom` is the one taken; `g.hom` is `{ id, fed, used }`.

### Measured

**One round on each of 32 molecules** (14 to 31 heavy atoms, every second one of the list; the six starting reagents; round five's deal; every page the line that makes most is fired; `homRound` in the recording page). Score is the round's total over the same round with no homunculus, as a geometric mean.

| Held, and how it is set off | Steps a page | Pages with 6 or more | 10 or more | Score | Rounds raised, lowered of 32 | Rounds it was ready in |
|---|---|---|---|---|---|---|
| none | 3.79 | 21% | 0 | 1.00 | | |
| water, where it adds a step or more | 4.75 | 31% | 15% | 1.85 | 18, 0 | 20 |
| hydrogen, at the place that adds most, if a step or more | 3.92 | 21% | 0 | 1.08 | 6, 1 | 29 |
| hydrogen, at a place taken at random every time it is ready | 3.72 | 23% | 0 | 0.92 | 5, 21 | 29 |

- **Water is ready late and then very strong.** With the starting reagents three waters had come off only by page three: it was ready in 20 rounds of 32, on page three every time. Set off there it turned a last page of 7 steps into 14, and the 18 rounds it raised were raised 3.0 times on average. Ten steps or more went from no page to 15 pages in 100. So in this measure there was no choice of page to compare; the choice is whether the molecule keeps a chain worth running twice.
- **Hydrogen is ready early and worth little.** It was ready in 29 rounds of 32 (on page one in 20 of them), was worth setting off in 7, and raised 6. Where it goes matters: at the best place 1.08, at a random place every time 0.92 with 21 rounds lowered, because it costs a C=O the chain needed.

**Whole runs**, 12 runs a player on seeds 3,001 on, the number to beat as it stands (not fitted again):

| Player | Held | Rounds beaten | Pages it was ready on | Set off | Steps it added | Pages with 10 or more |
|---|---|---|---|---|---|---|
| median | none | 7.4 | | | | 4 of 273 |
| median | water | 7.2 | 31 | 21 | 53 | 7 of 265 |
| median | hydrogen | 7.4 | 34 | 4 | 7 | 4 of 273 |
| novice | none | 2.2 | | | | 0 |
| novice | water | 2.2 | 12 | 10 | 4 | 0 |
| novice | hydrogen | 2.3 | 7 | 7 | 1 | 0 |

In whole runs neither moves rounds beaten on 12 runs. Water was ready on about one round in three. These are few runs; the refit of the number to beat decides what a run is assumed to hold.

### The simulated players

`useHom` in `tools_sim.js`, after a page has fired. Median and planner: set it off on a copy at every place and do it where that adds most, if it adds a step or more. Greedy: where the bare structure reads most steps. Novice: half the times it is ready, at a place taken at random. `runSim(player, seed, { hom: 'water' })` takes one into a run; the default is none, so earlier measures do not move. The round log has `water`, `h2` (what came off) and `hom` (the pages it was set off on).

### Testing

`AA.rxScheme.debugJar({ water, h2 })`, `debugHom(id)`, `debugFeedHom(n)`, `homState()`, `homUse(i)`, `homSkip()`, `showHoms()`, `chooseHom(i)`; `recHom`, `homRound`, `homTable` in the recording page. See `DEV_NOTES.md`.

### Not done, and what is wrong

- **Water's worth with a choice of page was not measured**: with the starting reagents it is never ready before the last page. With the burner held (every OH gives a water at once) it would be ready on page one; that pair was not measured.
- **Water on the last page is too strong for the 10-step target** (15 pages in 100 in the round measure, against about 1 asked). The rule was not changed.
- The hydrogen places are "the nearest C=O to each OH", which is where the zip stopped when the zip left the only OH. On a molecule with several OH it offers a place for each, some worth nothing (they are marked "+0" in pencil).
- The figure stands at the bottom right, by the ladder, not hard against the molecule: the left of the molecule is taken by the count and the row.
- The pointing preview was seen in recorded frames, not under a real pointer. Real clicks on the page before a run, on the figure and on a place were made and worked.
- Homunculi are gated by the jars only. They are meant for the last stage of progression; that gate is not built.
- The planner does not look a page ahead for the homunculus. No homunculus is offered a choice of page by the players beyond "now, if it adds a step".
- Carbon dioxide and the other seven are not built.
