# Overreact: the jars and the first two homunculi

## Built 2026-11-11

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
