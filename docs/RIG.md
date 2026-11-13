# Overreact: the measuring rig

Built 2026-11-10. The newest measure is the first section below (the thirteenth, 2026-11-13). This is the rig `BALANCE.md` asks for: whole runs played with no page by four simulated players, from seeds, with every round logged. Sections 1 and 2 of `PASS.md` are measured with it. The numbers are for a reviewer; nothing here says a section passes.

The rules of a round were changed later the same day (bounds, a budget of uses, forks in the chain, a hand, the redraw, the bank) and everything was measured again. That measure is the section "The measure after the rules of a round were changed". The measure made before it is kept below it, because it is the "before" of every comparison.

## The measure of 2026-11-13, thirteenth: the rulings of AR

One part for each of the owner's answers of the morning of 13 November, written as each was finished (so part 5 is first). Each ends with the choices left for the owner.

### 1. The shape of a long run, and what a lost run earns

Ruling AR: "a gentle start might be best but we want them to unlock stuff to try further". Both were built together.

**The rule as built** (`path.js`: `RULE.needParBy`, `RULE.specScaleLong`, `RULE.specBanByLong`; the simulator reads the same lines).

- A round of a long run is still cleared by the task AND a pass mark on the yield. The mark is now set for each length of run, as a share of the number to beat, by round:

| Run | Marks by round |
|---|---|
| Six rounds (master's) | 0.13, 0.28, 0.15, 0.40, 1.6, 1.2 |
| Nine rounds (doctorate) | 0.13, 0.28, 0.15, 0.40, 0.70, 0.53, 2.35, 4.15, 4.75 |
| Twelve rounds (postdoc, still switched off) | the nine, then 1.46, 1.21, 0.84 |

- The tasks of rounds 1 to 3 are smaller (0.3, 0.35, 0.7 of the table's numbers; they were 0.7, 0.5, 1), and the tasks a casual player seldom clears are not set in rounds 1 and 2, as in the first game.
- The last third of each length is the wall. In the six-round run the wall is softer than in the nine, because winning it is what opens the nine.

**A long run with nothing unlocked**, on deals the marks were not fitted on, stopped at the first round not cleared, the players aiming at the mark (`sweep_run.py final13`, `sweep_career.py final`):

| Player | Runs | Wins all nine, of 100 | Of the runs still alive, clear rounds 1 to 9 |
|---|---|---|---|
| Novice (looks at 4 lines) | 1,000 | 0 | 64, 43, 37, 28, 31 |
| Casual (looks at 12 lines) | 2,000 | 0 | 83, 70, 64, 48, 44, 38, 5 |
| Careful (reads every line) | 5,000 | 0.18 (9 runs; 0.06 to 0.30) | 94, 91, 84, 83, 79, 67, 31, 18, 10 |
| Reads every line and the next hand | 2,500 | 1.04 (26 runs; 0.64 to 1.44) | 96, 95, 90, 90, 89, 77, 43, 26, 18 |

| Player | Runs | Wins all six, of 100 | Of the runs still alive, clear rounds 1 to 6 |
|---|---|---|---|
| Casual | 2,000 | 0.8 | 84, 69, 62, 49, 24, 19 |
| Careful | 2,000 | 18 | 94, 91, 84, 82, 62, 49 |
| Reads two hands | 600 | 32 | 98, 94, 90, 88, 75, 58 |

- The casual player clears round 1 of a long run 83 times in 100 (it was 37). In the game's own rig, 80 runs of the casual player before the chlorine molecules went in: 80, 68, 66 for rounds 1 to 3.
- The bare nine-round win is under 2 in 100 for every player: the two-hand reader is at 1.0 (it was 2.4), the careful player at 0.2.
- Twelve rounds: no win in 4,000 runs of the careful player and 620 of the two-hand reader; laid over rounds played once the two-hand reader's rate is 1 to 3 in 10,000.
- The run for the two-hand reader's nine rounds was dealt with chlorine molecules at 0.22, the others at 0.32 (part 4); it moves rounds 1 to 3 by a point or two.

**What a run earns, won or lost: the ladder** (`path.js`: `LADDER`, `LADDER_CAP`, `ladderDue`, `ladderState`; `runResult` hands the page what the run earned as `earned`).

56 rungs, each earned once. A rung opens the next thing on one shelf (instrument, reagent, reflex, notebook, inspection, catalog, homunculus, the circle, or a cosmetic thing); which thing is the page's to say by the rules of `FINDINGS.md`.

| Kind | Rungs | Earned by |
|---|---|---|
| Getting further | 12 | the first time round 1, 2, ... 12 of a long run is cleared (five of them open an instrument) |
| Something done in a run | 12 | a page with a chain of 4, 6, 9; a round at 2, 4, 8 times the number to beat; 3 and 5 kinds of reflex in a round; all six reagents fired in a run; a round cleared with three reagents; a round lost by under 15 in 100; a molecule 10 atoms bigger |
| Lifetime counts | 32 | rounds played, rounds cleared, runs lost, reflex steps, rings, each at four to seven steps |

A run hands over two rungs at most; what is earned beyond that is handed over by the next runs. So a good run pays into the runs after it.

**A career, not single runs** (`sweep_career.py career`, 300 careers a player; the player always starts the longest run open; rounds are drawn from 800 to 2,000 other runs a player in which every round was played and the player did not yet aim at the mark; an instrument earned lifts the yield of later long runs 1.12 times, five carried at most, and a homunculus 1.3 times, which is the flat lift of the twelfth measure and is the weakest part of this table):

| Player | Runs to the first thing earned | To the tenth | Of the first 20 runs, earn something | Things earned after 10, 30, 100 runs | Deepest round of a long run cleared after 10, 30, 100 runs | First six-round win (run) | First nine-round win (run) | Careers with a nine-round win in 300 runs |
|---|---|---|---|---|---|---|---|---|
| Novice | 1 | 7 | 14 | 14, 27, 40 | 2.6, 3.9, 4.6 | none | none | 0 in 100 |
| Casual | 1 | 6 | 16 | 19, 34, 47 | 4.3, 5.4, 6.6 | 43 | none | 0 in 100 |
| Careful | 1 | 5 | 19 | 20, 43, 52 | 6.6, 8.3, 8.9 | 5 | 34 | 100 in 100 |

The same careers when nothing earned lifts the yield: the casual player's first six-round win comes at about run 180 to 210, not 43 (a noisy figure); the careful player's first nine-round win is seen in 33 careers of 100, not 100. With stronger helpers (an instrument 1.2 times, a homunculus 1.5): casual first six-round win at run 25 and a nine-round win in 25 careers of 100; careful first nine-round win at run 18. (An earlier pass with the two-hand reader, softer wall: first nine-round win at run 18 with the ladder, 44 without.)

Said plainly: with helpers as weak as the flat lift, the casual and novice players as modelled never win nine rounds. They do get further every ten runs, and 14 to 16 of their first 20 runs hand them something. Real helpers also help with the task, which this table does not count.

**Near misses.** The aim was a third of lost rounds within 15 in 100 of passing. It is not met: 6 to 13 lost rounds in 100 are that close (14 to 24 within 25 in 100). The cause is measured: a round's yield is spread very wide (for one player on one round, the tenth-best round in a hundred makes 25 times what the tenth-worst makes), and about three quarters of that spread is inside one molecule (hand to hand and line to line), not between molecules, so setting the mark by the molecule would not help. With that spread no fixed mark puts a third of the misses within 15 in 100. What would: flattening the chain multipliers (the game's best moment), or a mark the player can still reach after the round (choice 4).

**After review.** A fresh reviewer re-ran the tables and they hold. Fixed since: a lost round of a first game was counted as a near miss by the task alone (the game now counts near misses in long runs only, as the simulator does). Said here because it was not: the page does not call `runResult` yet, so in the played game no rung is handed over and the counts of runs are not kept; rungs 10 to 12 of "getting further" cannot be earned while the twelve-round run is switched off; the marks were set by hand from several fits (`sweep_career.py fit` with its listed targets gives softer ones) and then made a tenth harder in the wall. The reviewer's objection to the design stands for the owner (choice 6): a rung opens "the next thing on a shelf", so the thing and the deed do not belong together as the findings of `FINDINGS.md` do, 32 of the 56 are plain counts, and with two a run the careful player gets exactly two a run for the first ten runs whatever was done.

**Not done.** The page reads the pass mark but does not show what a run earned. The ladder's counters are counted by the game (`countersUpdate`) and were read once in the game's rig (6 runs: 16 rungs earned, 2 a run); the career table is from the simulator. The 56 rungs are not yet tied to the 166 things of `FINDINGS.md` one by one. The six-round run with the two-hand reader's 32 wins in 100 may be too easy for the best player.

**Choices for the owner**

1. The wall of the nine. (a) As built: careful 0.2, the strongest model 1.0 in 100 with nothing unlocked. (b) Softer, nearer the limit: careful about 0.5, strongest about 1.7. (c) Harder.
2. The six-round run. (a) As built: careful 18 in 100 bare, casual under 1. (b) Harder, like the nine: careful about 8. (c) Easier for the casual player: a lower wall still.
3. How strong helpers must be for a casual player to win nine rounds. (a) As modelled (never). (b) Each instrument about 1.2 times and a homunculus 1.5: one casual career in four gets there in 300 runs. (c) Stronger still.
4. Near misses. (a) Leave it: about 1 lost round in 10 is close. (b) A round lost by under 15 in 100 can be bought through with gold. (c) Flatter chain multipliers, so yields bunch nearer the mark.
5. Rungs a run. (a) Two at most, as built. (b) Three. (c) No limit (the first runs then hand over ten at once and later runs often nothing).
6. What a rung gives. (a) As built: the next thing on a shelf. (b) Each rung tied to one named thing that fits the deed, in `FINDINGS.md` (more writing, truer to "the finding and the thing belong together"). (c) Rungs give gold or credit only, and things stay with their own findings.

### 2. The sign: three laps

**As built** (`path.js`: `SIGN`, `RULE.prestige` now on; tests in the game `sign13.js`, 73 of 73).

- The sign can be taken three times (`meta.sign` 0 to 3). Each gives 20 in 100 more yield for good, added: 1.2, 1.4, 1.6 times. The collection starts over each time.
- It can be taken when 9 tenths of everything is held. It is offered, never forced.
- With each sign the number to beat, and the pass mark with it, rises 1.15 times (it was 1.12).
- `P.signState(meta, owned, total)` gives the page all of it: the level, the lift now and after the next sign, how far the number to beat has risen, whether it can be taken now and how many things that needs, what is kept aside and what starts over.
- Kept aside: the count of signs, the catalog, what the first game taught, the lifetime counts (a highest-ever count stays the highest, it is not added up). Starts over: the ladder of part 1, the counts that earn things and every other key of the saved profile. What is on the shelves (reagents, reflexes, instruments, homunculi, sigils, notebooks, the longer runs) is the page's to empty: `signState().reset` lists it.
- With the switch on and no sign taken nothing in play changes; the page has to offer it and hand the saved profile to a new run (`runNew` takes `meta`) before a player meets it.

**What should rise, by the numbers.** A nine-round run, wins of 100, read off the same 2,000 rounds a round (careful player) and 500 (the player who reads two hands), yields lifted and marks raised. "Nothing held" is the start of a lap; "collection back" is five instruments and a homunculus as the career model of part 1 counts them (2.3 times the yield).

| What rises with each sign | Careful, nothing held, laps 0 to 3 | Two-hand reader, nothing held | Careful, collection back | Two-hand reader, collection back |
|---|---|---|---|---|
| Nothing | 0.21, 0.42, 0.77, 1.13 | 0.70, 1.45, 2.49, 3.50 | 2.9, 4.3, 6.1, 7.5 | 7.7, 10.8, 13.6, 15.8 |
| The number to beat 1.12 times (as it was) | 0.21, 0.27, 0.33, 0.35 | 0.70, 0.93, 1.08, 1.16 | 2.9, 3.5, 3.7, 3.9 | 7.7, 8.7, 9.4, 10.0 |
| The number to beat 1.15 times (built) | 0.21, 0.24, 0.25, 0.25 | 0.70, 0.87, 0.90, 0.87 | 2.9, 3.2, 3.3, 3.3 | 7.7, 8.3, 8.5, 8.4 |
| The number to beat as much as the lift | 0.21 at every lap | 0.70 | 2.9 | 7.7 |

- If nothing rises, a start with nothing is five times easier by the third sign and the two-hand reader wins a bare run 3.5 times in 100, over the limit of 2.
- At 1.15 a start with nothing is within a fifth of the first at every lap for the careful player and within three tenths for the two-hand reader (0.70 against 0.87 to 0.90). These are small counts (0.21 in 100 is about 4 runs won in 2,000), so the second figure of each is not firm. What the sign really gives is small and said plainly: 4, 6 and 5 in 100 more yield against the mark, and a tenth more wins once the collection is back. The yield shown on the page is the full 1.2, 1.4, 1.6 times.
- At 1.12 the gain is a little more real and the bare run of the two-hand reader stays under 2 at every lap, with less room.

**Laps with the collection built again** (`sweep_career.py laps`, 200 careers a row; the collection here is the ladder of part 1, 56 things, the sign taken when 51 are held; the game's 166 things were not modelled):

| Player | Signs taken | Runs until the sign can be taken again | First six-round win in the lap (run) | First nine-round win in the lap (run) |
|---|---|---|---|---|
| Casual | 0, 1, 2, 3 | 297, 314, 299, 289 | 44, 37, 37, 31 | none in 600 runs |
| Careful | 0, 1, 2, 3 | 67, 65, 65, 66 | 5, 5, 5, 5 | 33, 35, 31, 36 |

Each lap is the same climb: no lap is shorter or longer than the first. The casual player takes about 300 runs a lap, so three signs are about 900 runs for that player.

**The story** (`STORY.md`, rewritten where it said gold or "nothing is reset"): the sign is never paid in gold; it takes the shelves, three times; the face is seen on the first OVERREACT after the third sign, not at everything unlocked. A new section says what the page and the notes show at 0, 1, 2 and 3 signs. The three endings are kept as options; the one that fits three laps best is the next tenant (each sign ends a tenancy, which is why the shelves are empty and what is kept is what a tenant leaves behind).

**Not done.** The novice never reaches the sign (no lap in 600 runs) and about 1 casual career in 5 finishes no lap in 600 runs. `sign13.js` and the run files are under folders git does not keep. The page does not offer or draw the sign. The laps were laid over rounds played once (a round carries nothing to the next), not played again with a sign in the simulator's own run. The game's rig was run with a sign only in the 73 tests.

**Choices for the owner**

1. What rises. (a) As built, 1.15: every lap as hard as the first, the real gain small. (b) 1.12: a little more real gain. (c) Nothing rises: each lap clearly easier, and the bare run goes over 2 in 100 for the strongest player.
2. The ending. (a) The next tenant (fits the reset best). (b) The second hand (cheapest, one chemist). (c) The refusal.
3. When it can be taken. (a) At 9 tenths, as built. (b) Only with everything. (c) At 3 quarters.

### 3. The weak homunculi, fixed

What each is now, with a worked example each, is in `docs/HOMUNCULI.md`. Built in `path.js` (`HOMS2K`, `HOM2LIT`, `hom2Use`, `homAfter`, `homPeek`) and in the simulator (`sweep_homs.py`). The game's test job (`homs2.js`) was brought up to the new rules: 133 of 133 cases, and on 7,168 pages (78,848 checks) the game's "lit" never differed from the rule.

| Creature | Was | Now |
|---|---|---|
| Wood spirit | last page only, last reagent a dud; near dead | any page; the FIRST reagent lined up is the dud; he pours the two bottles not lined up, free; times 1.25 if a pour lands |
| Slime | all three reagents each set off a reflex; came up on 6 pages in 100 | two of three (times 1.5) or all three (times 2.5); the bottles he stuck are shut on the next page |
| Hydrogen | any chain, no risk | the page's chain must be 3 or more; if the next page's own chain is shorter the balloon pops, yield times 0.6 |
| Brimstone | ended a round already won on the task | ends the round and burns the task (it counts as met); times 1.5 after page one, 1.25 after page two |
| Dry ice | 2 bottles shut | 3 bottles shut, times 2.5 |
| Seedling | 5 atoms; wilted only on a smaller page | 8 atoms, times 1.4, 1.8, 2.2; once tapped, any page that grows less wilts it (times 0.7) |
| Acid | any page that ended smaller (one water was enough) | 2 atoms smaller or more, times 2 |

**Each alone**, the careful player, 200 nine-round runs each on the same deals, every round played, the rule of part 1, the player weighing the tap when it picks a line. The win rate is the nine round rates multiplied. With no creature: 0.29 in 100.

| Creature | Its page comes up, of 100 pages | Tapped, of 100 pages | The line was picked for it, of 100 pages | Yield times | Wins nine, of 100 | Against none | The line it makes best |
|---|---|---|---|---|---|---|---|
| Wood spirit | 56 | 44 | 40 | 1.22 | 0.56 | 1.9 times | a bottle that cannot act put first; thiolene fired in 30 hands of 100, not 14; hydrate 48, not 60 |
| Hydrogen | 20 | 20 | 2 | 1.32 | 0.84 | 2.9 | oxidize last after a chain of three |
| Brimstone | 20 | 12 | 11 | 0.80 | 0.90 | 3.1 | thiolene early (25 of 100 hands, not 14); rounds 1 to 6 cleared 80 to 100 times in 100 |
| Dry ice | 14 | 14 | 21 | 1.22 | 0.50 | 1.7 | three bottles for the round: dehydrate 51 and hydrate 53, not 58 and 60 |
| Acid | 11 | 11 | 8 | 1.14 | 0.60 | 2.1 | two dehydrations or more on a page |
| Seedling | 24 | 24 | 9 | 1.13 | 0.51 | 1.8 | grow on every page |
| Slime | 36 | 36 | 10 | 1.14 | 0.42 | 1.4 | reagents that each start something: ritter 31 and thiolene 21, not 24 and 14; grow 69, not 74 |
| Ammonia (not changed) | 44 | 33 | 23 | 1.50 | 0.93 | 3.2 | the nitrogen reagent in the line: 38, not 24 |
| Water (not changed) | 22 | 20 | 10 | 1.17 | 0.83 | 2.9 | dehydrate 62, not 58 |
| Salt (not changed) | 16 | 16 | 13 | 1.32 | 0.70 | 2.4 | page two repeats page one |

"The line was picked for it" is the count the ruling asks for: pages on which the player took another line than it would have with no creature, because of the tap. At 200 runs a win rate is good to about a third either way, so the order of near neighbours is not firm.

What still does not answer the ruling, said plainly:
- Hydrogen has its risk now but the line is still picked for it on only 2 pages in 100: oxidize last after a chain is what a good line often is anyway.
- The Wood spirit went from dead to the creature that changes play most, and it comes up on more than half of all pages. At times 1.5 it won 3.9 times as often as none, so it was set to 1.25.
- Brimstone is strong where the task is the trouble (rounds 1 to 6) and cuts the yield; it does nothing for the wall.
- Slime comes up on a third of pages and the tap was never refused; at most two bottles can be shut (three of five always stay), so its cost is light.
- The Seedling is lit on 24 pages and aimed at on 9.

A fresh reviewer fails four of the seven against the ruling as they stand: Hydrogen, Slime and the Seedling are mostly lit by the line that was best anyway; the Wood spirit's cost (one dud) is too light for two free pours on half of all pages; Brimstone is a way to skip the task. Dry ice and Acid pass. How often the balloon popped or the Seedling wilted was not counted.

**Two at once** (all 45 pairs, 40 nine-round runs a pair, each creature with its own tap on a page; `sweep_run.py hompair13`):

| Held | Wins nine, of 100, average | Lowest | Highest |
|---|---|---|---|
| none | 0.29 | | |
| one | 0.68 | 0.42 | 0.93 |
| two | 0.95 | 0.37 | 1.76 |

- Highest: Hydrogen with Brimstone 1.76, Hydrogen with Ammonia 1.75, Ammonia with Brimstone 1.60.
- No pair did clearly better than its two creatures multiplied, so no pair is shown to do "what neither does alone". Some get in each other's way: the Wood spirit with the Seedling 0.37 and Ammonia with the Seedling 0.39 (pours and second firings undo the growth), the Slime with the Wood spirit 0.43.
- At 40 runs a pair these are good to about 4 parts in 10 either way.
- The game holds one creature. What it would take to hold two is in `HOMUNCULI.md`, "Two at once".

**In the game's own rig** the players now weigh the tap when they pick a line (`RULE.homAim`, `homPeek`; before, the game's players only tapped after the line was fired). Rates from the game, nine-round runs with offers between rounds, most cut by a 30 to 42 second clock on a busy machine, so the samples are small:

| Creature | Pages played | Its page came up, of 100 | Tapped, of 100 | The simulator's "came up" | Runs ended, cut by the clock, threw |
|---|---|---|---|---|---|
| Wood spirit | 141 | 74 | 64 | 56 | 7, 6, 0 |
| Hydrogen | 64 | 34 | 34 | 20 | 3, 6, 0 |
| Brimstone | 62 | 35 | 29 | 20 | 1, 5, 0 |
| Dry ice | 86 | 7 | 7 | 14 | 3, 6, 0 |
| Acid | 48 | 10 | 10 | 11 | 2, 4, 0 |
| Seedling | 82 | 48 | 48 | 24 | 3, 4, 0 |
| Slime | 164 | 32 | 32 | 36 | 3, 10, 0 |

No run threw. The game's rates are higher than the simulator's for the Wood spirit, Hydrogen and Brimstone: these runs take offers between rounds, so the hand holds more kinds of bottle, and the first Wood spirit runs were at times 1.5. They show the rules work in the game's own round; they are too few to rank anything.

**Not done.** The measures were run before three small repairs a reviewer asked for (the game's players now see the pop and the wilt when they pick a line; the game's Brimstone, where a run has no pass mark, burns only from page two as the simulator's does; the simulator shuts the Slime's bottles in the order of the line as the game does). Game-side win rates (the runs are too slow to finish in number). Pairs in the game. The page's pictures and tokens for the new rules beyond the two-line token text. `brings` (a reagent each of four creatures adds to the run) is as it was. The planner and the casual player were not run with creatures.

**Choices for the owner**

1. The Wood spirit. (a) As built: first bottle a dud, pours two free, times 1.25. (b) No multiplier: then it is worth nothing on average. (c) Only a dud put LAST lights it (rarer).
2. Brimstone burning the task. (a) As built. (b) It only halves the task. (c) Back to yield alone, at times 3.
3. Hydrogen. (a) As built: a real risk, seldom aimed at. (b) Also needs the chain to hold 2 kinds of reflex, so it has to be set up. (c) Leave.
4. How big one creature should be. (a) As measured: 1.4 to 3.2 times the wins of a bare run. (b) Evened out to about 2 to 2.5 each. (c) Bigger all round.
5. Two in the game. (a) One, as now. (b) Two, each with its own tap (the page and the saved run have to change; the rules do not).

### 4. Chlorine in the first rounds

**What was wrong.** No molecule of rounds 1 and 2 held a chlorine at all (0 of 64 each), and round 3 had two. The reflex was never the fault: in the reference chemistry a Cl closes a ring with an OH, NH2 or SH three to five carbons away, and four of the six starting reagents make such a partner (hydrate and grow an OH, thiolene an SH, ritter an NH2). On a molecule that holds a chlorine, `close` fires on about 9 lines in 10.

**What was built** (`path.js`: `FEED_CL`, `FEED_CL_ROWS`, `RULE.clEarly`; the simulator deals the same way). The reflex and the six reagents are untouched.

- 18 chlorine molecules, six for each of rounds 1 to 3, made from the rounds' own molecules by putting a Cl on a plain carbon (`sweep_chlorine.py make` tried every such place and kept those where the first Cl needs one of the player's reagents to land before the reflex fires). Four of each six carry two Cl, so chlorine can act on two pages of a round; the second Cl was not held to that test, and on two molecules of round 3 the reflex fires whatever is played.
- In rounds 1 to 3 each dealt molecule is one of these with chance 0.32, in every length of run. They are in no other pool, so nitrogen and sulfur molecules are dealt as before among the rest.

**Measured, 1,000 runs a player** (hands in which the reflex fired, of 100; a hand is one page; counted by the hand, so two rings shut on one page count once):

| | Round 1 | Round 2 | Round 3 |
|---|---|---|---|
| Before, any player | 0 | 0 | 0.5 |
| First game (three rounds), novice | 12.6 | 13.7 | 14.9 |
| First game, casual | 11.8 | 12.2 | 13.9 |
| First game, careful | 11.2 | 11.9 | 13.2 |
| Long run, casual | 11.4 | 11.5 | 13.3 |

That is 1 hand in 7 to 1 in 9, about 1 in 8. A chlorine is on 29 to 39 molecules in 100 and the reflex fires in 3 rounds in 10. Of all reflex steps in a first game, chlorine's share went from 0 to 14 (careful), 20 (casual) and 23 (novice) in 100; nitrogen's is 7 to 10 and sulfur's 1 to 5, a point or two under what they were, because a chlorine molecule takes the place of another.

The first game got a little easier for the novice: wins of 100 were 24, 54, 80 (novice, casual, careful) and are 30, 58, 82.

A first pass dealt them with chance 0.22. A reviewer found its count was of steps, not hands; by the hand it was about 1 in 11, under the aim, so the share was raised.

**Against the reference chemistry.** Each of the 18 molecules, twelve lines of three in the game's own round (`cl13.js`, `sweep_chlorine.py game`): 216 turns, the same count of `close` in all 216 (239 steps each side), the same reflexes in the same order in 214, the same molecule after in 213.

**Not done.** After round 3 chlorine falls back to 6 or 7 molecules in 100 and about 1 hand in 50, which is against "rarer elements become more common as the rounds get deeper". The same tool can make chlorine molecules for rounds 4 to 9; that moves the yields of the wall rounds, so the pass marks of part 1 would have to be fitted again. The page's pictures of these molecules were not looked at.

**Choices for the owner**

1. How much chlorine early. (a) As built: about 1 molecule in 3, the reflex in 1 hand in 8. (b) Less: 1 molecule in 5, 1 hand in 11. (c) More.
2. After round 3. (a) As built: it thins out to 1 molecule in 15. (b) Chlorine molecules for rounds 4 to 9 too, rising with the rounds, and the marks fitted again.
3. Two chlorines on a molecule. (a) As built: four of each six. (b) One only, so it acts once a round.

### 5. Agreement with the reference chemistry: back to 126 of 150

**The cause.** The game's chemistry did not change. The fall was in the test. The fold commit (e2e9c8a, 12 November) made a round hold the twelve across-the-fold reflexes whenever `RULE.holdAll` is set, and the parity job sets it. The 150 reference turns hold only the thirteen near reflexes (the reference's whole-turn function knows no fold), so the game took across steps the reference could not take.

| Rules as of | Exact | Ties | Unproven | Real differences |
|---|---|---|---|---|
| ffe8723 (just before the fold) | 126 | 22 | 2 | 0 |
| e2e9c8a (the fold) | 86 | 12 | 2 | 50 |
| today, old job | 93 | 13 | 2 | 42 |
| today, job with the fold off | 126 | 22 | 2 | 0 |

**The fix.** `parity_game.js` now switches the fold off for its turns (`RULE.fold = false`), throws if an across reflex is still held, and `far=1` gives the old behaviour. Run again in this checkout: 126 exact. `locks.js`: 24 of 24.

**The 24 turns that are not exact.** 17 take the same steps at another, equal place. 5 differ in steps but the game's answer is one the reference gives when equal places are taken another way (turns 8, 23, 33, 49, 70). 2 (turns 52 and 108) are not proven at the search limit of 4,000 states; at 60,000 both are inside the reference's set. No real difference is left.

**Not done.** The across reflexes have no whole-turn check against the reference; their own check is single steps (`foldpar.js`, 876 of 876 on 12 November). Which commit after the fold moved 86 to 93 was not looked for.

**The reviewer** (fresh, read the code and ran the compare again): the cause and the counts hold; all 22 ties pass the strict test. Three things to know. A turn that mixes across and near reflexes is checked nowhere. Inside a tie what comes off the molecule is not compared, and it differs in turns 8, 33, 49 and 108. The job lives under `.claude/`, which git does not keep, so the repair is on this machine only.

**Choices for the owner**: none; this was a repair.

## The measure of 2026-11-13, twelfth: the four rulings of AP

Measured on the fast simulator (`docs/tools_chem/sweep_*.py`), built in `path.js`. One part for each ruling; each ends with the choices left for the owner. An eleventh section was never written (that builder was stopped); its work is in the commits of 12 November.

### 1. How hard the nine rounds are for the careful player

**What was found first.** A run past the bachelor's is not "bare" in the game: carbon dioxide comes off (it fills a jar), so oxidize cuts a chain-end C=C. Every earlier bare measure had that switched off. With it on, as the game really plays a doctorate with nothing unlocked, the player who reads every line wins 19.9 in 100 (1,000 runs), not 16.5. The confirming runs below are measured the way the game plays it.

**The three levers the sweep named**, each alone, the player who reads every line, 2,000 nine-round runs on the same deals (the older bare chemistry, where the start is 15.3 in 100):

| Lever | Wins of 100 |
|---|---|
| nothing changed | 15.3 |
| bigger tasks, by asking for a rarer clear rate in rounds 4 to 9 (15 and 30 points rarer) | 12.5 and 11.9 |
| two tasks from round 4, not round 6 | 13.9 |
| every task number in rounds 4 to 9 half as big again | 6.0 |
| the yield must also pass a mark | any rate wanted: see below |

Bigger and doubled tasks hardly bite, because a task is only set when a hidden player has just proved it can be reached, and the careful player reads as much as that hidden player does. The yield is what a careful player cannot always reach, and it is what every helper, homunculus and the sign lift. So the third lever is the one built.

**The rule as built** (`RULE.needPar`, `RULE.specScaleLong`, `P.needYield(run)` for the page):

- In the master's, the doctorate and the postdoc a round is cleared when the task is met AND the yield passes a mark. The mark is a share of the number to beat, by round: 0.74, 0.90, 0.78, 1.36, 2.57, 1.07, 1.25, 1.59, 1.35, then 0.96, 0.60, 0.27 for rounds 10 to 12. The bachelor's keeps the task alone.
- Round 2 was the wall because its task numbers were too big for the molecules dealt now. In the long runs the task numbers of rounds 1 and 2 are now 0.7 and 0.5 of the table's. The run now gets harder round by round.
- The simulated players know the rule: they play for the task and for the yield still missing to the mark (`RULE.aimPar`).

**The nine-round run with nothing unlocked, 20,000 runs a player on deals the marks were not fitted on** (the planner 3,000), stopped at the first round not cleared:

| Player | Wins all nine | Wins all twelve (postdoc) | Of the runs still alive, clear rounds 1 to 9 |
|---|---|---|---|
| Novice (looks at 4 lines) | 0 of 20,000 | 0 | 14, 12, 11, 7 |
| Greedy (looks at 12 lines) | 0 of 20,000 | 0 | 37, 35, 31, 18, 17 |
| Reads every line of the hand | 103 (0.52 in 100; 0.42 to 0.61) | 3 (0.01) | 75, 75, 63, 56, 51, 50, 49, 46, 45 |
| Reads every line and the next hand | 71 of 3,000 (2.4; 1.8 to 2.9) | 8 (0.27) | 85, 84, 77, 68, 61, 59, 61, 57, 50 |

The careful player is under 1 in 100. The player who also reads every line of the next hand, which is more than a person can, wins 2.4 in 100: above the limit of ruling W3 (choice 1 below). The two casual players never win, but skill still shows in how far they get. Before the rule: 0.7, 16.5 and 30.

The six-round master's has the same rule and the same first six rounds. From the rates above the careful player wins it about 5 in 100 and the player who reads two hands about 13. It was not run by itself.

Round 1 of a long run is hard on a casual player: the greedy player meets its task 72 times in 100 but clears it 37, because of the yield mark. In the bachelor's the same player clears round 1 90 times in 100. The long runs are opened by winning the bachelor's, but the step up is steep (choice 5 below).

**What a helper is worth.** The same kind of runs with every yield lifted by a flat amount, which is what a helper does at its plainest (2,000 and 600 runs on the fitting deals, players not yet aiming at the mark, so the first row reads a little lower than the table above):

| Yield times | Reads every line: wins nine | Reads two hands: wins nine | Reads two hands: wins twelve |
|---|---|---|---|
| 1 | 0.35 | 1.5 | 0.2 |
| 1.2 (one sign) | 0.85 | 2.8 | 0.2 |
| 1.5 | 1.5 | 5.3 | 1.2 |
| 2 | 3.2 | 9.2 | 2.5 |
| 3 | 7.1 | 18.5 | 8.0 |
| 5 | 13.3 | 29.3 | 15.3 |

Each step up about doubles the odds and none makes the run safe: with five times the yield the careful player still loses 87 runs in 100, because the task still has to be met. The curve with real homunculi is in part 3.

**Is a lost round a close call?** Partly. Of the rounds the careful player loses, about 3 in 10 are lost on the task and 7 in 10 on the yield; 12 to 22 in 100 of all lost rounds had the task met and the yield within a quarter of the mark (17 to 26 for the planner). The yield of a round is spread wide (the middle half of rounds runs from about 0.6 to 4 times the number to beat), so most misses are not near ones. Narrowing that spread would mean flattening the chain multipliers, which is the game's best moment; not done.

**Not done.**
- The page does not draw the mark yet. Until it does, a player can meet the task, pass the number shown and still lose the round. `P.needYield(run)` gives the page the yield to draw. Setting `RULE.needPar = null` turns the rule off.
- The marks are shares of the number to beat as it stands and are uneven (round 5 is 2.57) because the number to beat was fitted on another player and other molecules.
- The marks were fitted three times (first on the older chemistry with no carbon dioxide, then a tenth harder, then on the game's real long-run chemistry). The table is from the third set, on deals that set was not fitted on.
- The postdoc is still switched off in the game (`RULE.postdoc`); its column is from the simulator. Rounds 10 to 12 are set round nine's tasks in both.
- The simulator applies the rule only when a run asks for it (`T12` in `sweep_exps.py`); the older experiments still measure the old rule.

**Choices for the owner**

1. Who the limit is for. (a) As built: the careful player wins 0.5 in 100, the player who reads two hands 2.4. (b) A tenth harder marks: by the table about 0.4 and 1.9. (c) Easier: say the rate.
2. One number or two on the page. (a) Move the number to beat itself to the mark, so there is one line to pass (the gold marks then move with it). (b) Keep the number to beat for gold and the big word, and draw the pass mark as a second, plain line.
3. The bachelor's. (a) As built: the task alone clears a round there, the yield rule arrives with the master's. (b) A low mark in the bachelor's too, so the rule is learned early.
4. The postdoc. (a) As measured: rounds 10 to 12 with their own marks, careful player 1 run in 10,000, the two-hand reader 3 in 1,000. (b) Bigger molecules of its own for rounds 10 to 12 (not built).
5. Rounds 1 to 3 of a long run. (a) As built: the marks start high, a casual player clears round 1 about 37 times in 100. (b) Lower marks in rounds 1 to 3 and higher ones later, the same win rate, a gentler start.

### 2. The opening

Kept: the nitrogen and sulfur reagents in the first six. Changed, in the bachelor's only (`RULE.specScale`, `RULE.specBanBy`, `RULE.hetCurveB`):

- Round 3's task numbers are 0.45 of the table's (they were 0.7).
- The tasks a beginner seldom clears are not set in round 1 (shrink the molecule, make double bonds, raise unsaturation, lean turns: cleared 15 to 47 in 100) or in round 2 (a C=O at the chain end, hydrogen off: 18 and 25).
- A first game deals more molecules with N, S or Cl: 35, 40, 45 in 100 in rounds 1 to 3 (it was 15, 22, 30). The longer runs keep their curve.

Three-round runs, 1,000 a player (600 for "before"), every round played:

| Player | Before: clears rounds 1, 2, 3 | Before: wins | Now: clears | Now: wins |
|---|---|---|---|---|
| Novice | 68, 62, 28 | 13.5 | 81, 68, 49 | 26.1 |
| Greedy | 84, 81, 54 | 36.8 | 90, 85, 75 | 56.0 |
| Reads every line | 94, 94, 78 | 70.0 | 95, 95, 92 | 82.7 |

The nine-round run is not touched by any of this.

N, S and Cl doing things by themselves, share of all reflex steps in the three rounds, before and now: knit (N) 11 and 14 for the novice, 5 and 7 for the careful player; cap (S) 6 and 6, 1 and 2; close (Cl) 0 and 0. More such molecules moves it a little. Chlorine never acts: none of the six reagents puts a chlorine on or makes its partner. What does give N and S work is part 3: the Ammonia and Brimstone homunculi are lit by the nitrogen and sulfur reagents landing.

**Choices for the owner**

1. The beginner's rate. (a) As built, 26 in 100. (b) Nearer 20: round 3 at 0.55. (c) Nearer 30: round 2's hard tasks out as well.
2. More N, S and Cl molecules in rounds 1 to 3 of the long runs too. (a) No, as built. (b) Yes (the marks of part 1 then need fitting again).
3. Chlorine. (a) Leave it as a thing seen on molecules. (b) Swap one starting reagent for chlorination (the sweep had it at +1.5 to +3.9 points of win rate). (c) Give the Cl reflex a wider reach.

### 3. The ten homunculi, second design ("reward gameplay not averages")

What each one is now is in `docs/HOMUNCULI.md` (one table). In short: a homunculus is lit by how the page was played, not by a count; the player taps it; each asks for something back. Built in `path.js` behind `RULE.homs2` (on; the old ten come back with it off), amounts in `HOMS2K`. A test job in the game (`.claude/headless/jobs/homs2.js`) brought up to the amounts as they stand, passes 127 of 127 cases, and on 7,168 pages (78,848 checks) the game's "lit" never differed from the rule.

Each alone, the player who reads every line, 300 nine-round runs each on the same deals, every round played, the rule of part 1. The win rate is the nine round rates multiplied (a round carries nothing to the next). "No creature" wins 0.54 in 100.

| Creature | The page that lights it comes up, share of pages | Tapped, share of rounds | Wins nine, of 100 | Against none | Yield times | The line was chosen for it, share of pages | The line of play it makes best |
|---|---|---|---|---|---|---|---|
| Hydrogen | 31 | 61 | 1.37 | 2.5 times | 1.75 | 5 | oxidize put last, and a big page after it |
| Ammonia | 43 | 55 | 1.18 | 2.2 | 1.41 | 22 | the nitrogen reagent in the line: fired in 37 of 100 hands, not 23 |
| Dry ice | 21 (the last page of 6 rounds in 10) | 59 | 1.14 | 2.1 | 1.28 | 23 | a round played with few reagents; hydrate and dehydrate left shut more often |
| Salt | 14 | 31 | 1.07 | 2.0 | 1.29 | 11 | page two repeats page one |
| Acid | 22 | 51 | 0.94 | 1.7 | 1.19 | 13 | cutting pages: grow fired in 69 of 100 hands, not 74 |
| Seedling | 44 | 73 | 0.93 | 1.7 | 1.22 | 12 | growth every page; dehydrate fired 56, not 60 |
| Water | 23 (some water comes off on 85) | 40 | 0.91 | 1.7 | 1.17 | 11 | dehydrate fired 64, not 60: set up OH and dry it in one page |
| Brimstone | 14 | 16 | 0.77 | 1.4 | 0.94 | 5 | the sulfur reagent fired 19, not 13; the round cut short when that clears it |
| Slime | 6 | 14 | 0.68 | 1.3 | 1.11 | 3 | three reagents that each set something off |
| Wood spirit | 13 | 20 | 0.60 | 1.1 | 1.02 | 5 | a dud lined up last on the last page |
| none | | | 0.54 | | 1 | | |

The Seedling no longer rules: it was 5.4 times the yield in 93 of 100 rounds; it is 1.2 times. A reviewer's sample of 60 fresh runs gave the same lit, tap and yield figures.

What does not yet answer the ruling, said plainly:
- The Wood spirit is as good as dead (1.02 times the yield): his pour in the deal's order is seldom better than a third reagent chosen.
- The Slime is too rare (its page comes up 6 times in 100).
- Hydrogen is still close to a flat lift: lit on 31 pages in 100, always worth tapping, and the line is changed for it on only 5. It has no risk yet.
- Brimstone is tapped only when it clears the round, so it is a safety net, not a choice.
- Dry ice, the Seedling and Acid come up often without much change of play (Acid is lit by any dehydrate that lands).

**Pairs and triples** (all 45 and all 120, 40 nine-round runs a set: enough for the averages, too few to rank two sets near each other):

| Held | Wins nine, of 100, average | Lowest set | Highest set |
|---|---|---|---|
| none | 0.54 | | |
| one | 0.95 | 0.60 | 1.37 |
| two | 1.68 | 1.03 | 2.56 |
| three | 2.10 | 1.22 | 3.35 |

- This is the curve of win rate against helpers held, for the creatures alone: each one more adds about half again. Instruments and sigils are not in it.
- Only the averages can be trusted. At 40 runs a set one set's rate is good to about 4 parts in 10 either way, so no pair or triple is named here as best or worst.
- In the simulator only one of the held creatures can be tapped on a page, and the game itself holds one creature at a time. So a pair doing something neither does alone (the Wood spirit pouring the nitrogen reagent and Ammonia then firing the line again) is NOT built or measured. It needs a tap for each creature on a page.
- Nothing ran away: the best triple wins 3.4 in 100.

**Limits.** The simulated player taps for what it can see on the page; it does not plan a round around a creature, so Dry ice, Salt and the Seedling are worth more to a person than shown. In the game's own rig the players do not yet weigh a tap when they choose a line. Twelve full runs a creature were played in the game and none threw; they were cut at 60 seconds by a busy machine, so the game's own rates are not measured.

**Choices for the owner**

0. The weak five above. (a) Fix them next, one change each: Hydrogen loses a fifth of the yield if the next page's chain is shorter than the one carried; the Wood spirit's pours spend no use and he may pour on any page; Brimstone may be tapped at any time; Dry ice needs 3 bottles shut; the Slime is lit by two of three. Then measure again. (b) Leave them and tune by play.
1. How big one creature should be. (a) As built: one creature about doubles the odds of a nine-round win (0.5 to about 1 in 100), three make it 2 to 3. (b) Bigger: every amount up by half, then measure again. (c) Smaller.
2. The Wood spirit. (a) As built: last page only, weak alone, good with Ammonia and Acid. (b) He also pays: yield times 1.5 when he pours. (c) He may pour on any page (measured: that loses rounds, because he empties the bottles).
3. The Slime. (a) As built: rare and strong (2.5 times). (b) Easier to light: any two of the three reagents setting something off. (c) Another trick for it.
4. Brimstone. (a) As built: a safety net, it ends a round that is already won on the task. (b) Let it be tapped at any time for the gamble.
5. What a creature brings. (a) Nothing: drop the old rule that the Wood spirit, Slime, Ammonia and Brimstone each add a reagent to the run. (b) Keep it.

### 4. The sign

Ruling AP: "the yellow sign is our prestige. you start over but it gives you +20%"; "makes the yellow sign manifest more"; "+20% yield, forever". This replaces the idea of a last sigil that spends gold.

**As built** (`path.js`, behind `RULE.prestige`, off until the page has it; the table is `SIGN`):

- When 9 tenths of everything is unlocked the player may take the sign (`P.signCan(meta, owned, total)`; the page counts what is owned).
- Taking it (`P.signTake`) gives back a new saved profile: the collection starts over (reagents, reflexes, motifs, instruments, homunculi, sigils, lengths opened). Kept: the count of signs, the catalog of compounds made, what the first game taught, and the lifetime counts (set aside: the counts that earn findings start at zero, so everything is earned again).
- Every yield is then 20 in 100 higher for good, and each further sign adds another 20 (added, not multiplied: five signs are 2 times the yield, ten would be 3 times, not 6.2).
- `meta.sign` is the number of signs taken (0 to 5). `P.signState(meta)` gives the page, the notes and the music the level, the lift and what has risen.
- With each sign the number to beat rises 12 in 100, and so does the pass mark of part 1.
- It can be taken 5 times. After the fifth it is whole.

**Three ways to make a lap different, measured.** Nine rounds with nothing unlocked (which is where a player stands right after taking it), the player who reads every line, 800 runs a cell, every round played. With no sign this run is won 0.54 in 100.

| Signs taken | A. The lift alone | B. The lift, and the number to beat rises 12 in 100 a sign (built) | C. As B, and the sign takes one thing a time |
|---|---|---|---|
| 1 | 0.85 | 0.66 | 0.49 (two tasks from round 4) |
| 2 | about 1.3 | 0.76 | 0.18 (and every task a quarter bigger) |
| 3 | about 1.8 | 0.86 | 0.04 (and one use fewer of each reagent) |
| 4 | about 2.5 | | 0.01 (and two tasks from round 1) |
| 5 | 3.2 | 0.83 | 0.00 (and four dealt, not five) |

(Column A is read off the flat-lift table of part 1.)

- A makes every lap easier than the last. By the fifth the fresh start is six times easier than a new player's. The climb back up would feel shorter each time.
- B keeps the fresh start about level (0.5 to 0.9 in 100 at every lap), so each lap is the same climb with bigger numbers on the page: by lap five yields are 2 times and the numbers to beat 1.76 times. Said plainly: the rising number takes back most of the +20; what is left is 7 to 14 in 100 of real gain at any lap. In whole runs won, the 800 runs of each cell had 3, 3, 6 and 5 wins (the table multiplies the nine round rates). Four signs under B was not run.
- C gets hard fast. By the third sign a careful player with nothing unlocked wins 4 runs in 10,000. It may still be right once a full collection is back, but that was not measured. The five takes are built and switched off (`SIGN.takes` is empty; put names in it to turn them on).

**How many laps.** Five. The four yield marks on the page each add a stroke and build to the sign (ruling AL10); the fifth stroke is the sign itself, drawn by taking it. After five the story is at "After" (`STORY.md`) and the lift stays at 2 times.

**What the page, notes and music should show**

| Signs | The page | Notes and music |
|---|---|---|
| 0 | No yellow anywhere. The sign is only the unfinished mark at the bottom of the title page, one stroke for each sigil earned. | The story as `STORY.md` has it. |
| 1 | The first stroke of the sign, pale, under the molecule on every OVERREACT, gone when the page turns. The yield track has one yellow tick at +20. | The notes start again sane, with one line now and then in a second hand. One new quiet part in the music. |
| 2 | Two strokes. One coffee stain in three dries in the shape of the strokes so far. | The chemist notices the stains. The new part is a little louder. |
| 3 | Three strokes, and they stay on the page all round, very pale, under the molecule. The homunculi face it when a chain runs long. | He stops pretending not to see it. |
| 4 | Four strokes. The reagent cards carry it small in a corner. The lamp light on the bench is a shade warmer. | The second hand writes more than he does. |
| 5 | The sign whole, under every molecule from the first page, and on the title page in place of the unfinished mark. | The "after" notes. The tune is played outright once a run. |

Never the three-armed sign of 1989: our own mark, built from our four yield marks (`STORY.md`, rules).

**Not done.** The page does not offer or show the sign, does not hand the saved profile to a new run (so the lift is not applied in play yet even with the switch on) and works out one yield figure of its own without the lift. `STORY.md` still says the last sigil takes gold and that nothing is reset, and its last moment needs everything unlocked while the sign can be taken at 9 tenths: the story has to be brought in line with the ruling. What "everything" counts is the page's to say (166 things in `FINDINGS.md`). Laps with a rebuilt collection were not simulated, only the fresh start of each. The game's rig was not run with a sign.

**Choices for the owner**

1. What rises with the sign. (a) B, as built: the number to beat rises 12 in 100 a sign, the fresh start stays about as hard. (b) A: nothing rises, each lap is easier. (c) C: the sign also takes one thing each time (the five above, or others).
2. How the +20 stacks. (a) Added, as built: 2 times after five. (b) Multiplied: 2.5 times after five.
3. How many times. (a) Five, as built. (b) Three. (c) No end: the sign is whole at five and the lift goes on.
4. When it can be taken. (a) At 9 tenths of everything, as built. (b) Only with everything. (c) At 3 quarters.
5. What is kept. (a) As built: the catalog, what was taught, the lifetime counts set aside. (b) Also one thing of the player's choice from the old collection.

### Agreement with the reference chemistry

No reaction or reflex was changed in this measure: `rules.js`, `engine.py`, `library.py`, `fold.py` and `traits.py` are as they were. The game parity job (`parity_game.js`, 150 whole turns) gives 93 exact with the rules as they stand, and the same 93 with the rules as they were before this measure (commit cf44b1c), so nothing here moved it. The ninth measure had 126 exact: the fall to 93 came with the commits of 12 November after it (the fold and what followed) and was not looked into here. `locks.js`: 24 of 24.

## The measure of 2026-11-12, tenth: the fold, molecules v2, the opening, oxidize

Measured headless, awaiting review. Commits e2e9c8a (fold), d2d2d3c (across paid as two), affcf72 (molecules v2), the Par and scale commits, 97e4eec (review fixes). Tools: `tools_foldpar.py`, `tools_mol2_bake.py`, jobs `foldpar.js`, `foldx.js`, `locks.js`, `oxbest2.js`.

### 1. The fold
`ENG.foldOf`, `faces`, `acrossPairs` and the twelve across reflexes (rules.js), `P.foldOf(m)` for the page, anchor flag on the atom and rung flag on the bond (carried by cloneMap and the mirror), across steps only when no near reflex fits (rare groups first, ring across last, nearest first, once a kind a turn), held from round 4 and only with their near twin (bridge, stitch, link without), step record `kind`, `join` (the two anchor atom ids), `via: 'fold'`. Against fold.py (ties to the lower atom index in both): 1,500 molecules, 0 mismatches in anchor, path, row and column of every atom, and facing pairs; the twelve across reflexes on 876 first places: 876 agree. Test of paying an across step as two chain steps (median player, bare nine rounds, 60 runs a row, mean log of the round total over rounds 4 to 9): no fold 11.197; fold, one step each 10.915; fold, two steps each 11.249. Kept (`RULE.foldPay2`, on). Wins of the nine rounds in these 60 runs: 10, 9, 6 (noise). Not done: screens (`easeOf`, the spec proof) do not hold the across kinds; the page's drawing of the fold is the page builder's.

### 2. Speed
A median run went from 19 s to 3.9 s: the signature (`sigOf`, 6.3 s of 19) is an integer hash now, and the aromatic search is skipped below three C=C. Orphan Edge processes were killed by hand after batches (hl.sh leaves some when a page fails); hl.sh was not changed.

### 3. Hydroborate and reduce, feeds
The offer works in the statistics' names and returns card ids (bh3, nabh4); the pass-over key is by name. OFFER_STATS: only the held flags were rebaked (the worth numbers are from the old six; reagent_stats.py has to be run again, hours). Ammonia and sulfur now reach the page record (cyanohydrin and chugaev); the ammonia and brimstone creatures stay unoffered. The finding `reflux` was removed (its counter never existed).

### 4. Rebake
MOTIF_START holds amine, sulfur, acid; benzene rings are in 4 of 24 pool molecules from round 1 in molecules v2.

### 5. Locks
Reagents leave prot, cure, clamp alone; reflexes leave prot alone; the instruments (mirror, burette, bunsen, balance, magnet, acid, crystal, mortar) and the cut piece honour all three. `locks.js`: 19 cases, among them 6,468 per-atom trials (lock one atom with each flag, use every reagent and instrument, the atom and its bonds must not change): all pass. Not done: the clamp tool on a locked second atom of a C=C.

### 6. Molecules v2 and the opening
The 216 pool and 360 bank molecules replace the old and interim ones (deal: pool with chance 0.9, 0.85, 0.8, 0.7, 0.65, 0.6, 0.55, 0.5, 0.5, else bank; exact round; fused and spiro count as ring). `RULE.filter` does not apply to them. Par for rounds 1 to 9 fitted on them (greedy median of the round total, 120 bare nine-round runs): 4770, 3500, 4118, 7340, 10295, 16248, 20038, 25187, 27028, made to rise 1.15 a round at least (4770, 5486, 6309, 7340, 10295, 16248, 20038, 25187, 28965). The molecule factors (MOLF, 42 keys of the old table) are cleared. Bachelor's, 300 unseen runs a player (seeds 1,001 to 1,300), spec N times a scale per round (0.15, 0.36, 0.7), the spec `opener` not offered, ease 0:

| Player | Clear rounds 1, 2, 3 | Wins all three |
|---|---|---|
| novice | 72, 58, 30 | 10.0 |
| greedy | 78, 81, 48 | 31.0 |
| median | 93, 91, 75 | 63.7 |

Targets (novice 75 to 85, 50, 35; median wins 25 to 35): the novice is near them; the median player is not (64 percent). The gap between the simulated novice and the median player is wide, and a spec hard enough to hold the median at 30 percent would leave the novice nothing; the greedy player (31) sits at the target. An earlier scale (0.2, 0.3, 0.55) on the same molecules gave 70, 58, 45 / 77, 81, 64 / 93, 92, 83. Reviewer: scaling N and flooring it at 1 makes most round 1 specs "do any one thing" and breaks the table's rate-to-N link; a rate-based ease would be better (recorded, not done).

### 7. The bare nine-round run (ruling W2, about 2 in 100), molecules v2, 120 runs (seeds 5,001 on)
| Player | Wins all nine | Clear rate by round, 1 to 9 |
|---|---|---|
| novice | 0 of 120 | 30, 17, 54, 50, 58, 40, 42, 41, 36 |
| greedy | 2 of 120 | 50, 39, 59, 68, 76, 55, 61, 54, 53 |
| median | 18 of 120 | 74, 62, 79, 92, 96, 93, 88, 83, 82 |
| planner | not finished (about 100 s a run) | |
Before molecules v2 (old table, 150 runs): novice 0, greedy 2, planner 26 of 150. Greedy is at the target; the median and planner players are at 15 to 17 percent, far above it. Not tuned (ruling: do not make it easier).

### 8. Oxidize (owner: should it be worth less?)
Method: `oxbest2.js`, molecules v2 rounds 1 to 6, 24 pool molecules a round, 2 hands of five from the six per molecule, every line of three, pay proxy 50 a place plus 25 k(k+1) for k reflex steps; "in a best line" counts any tied best line, so a filler reagent sits near 40 (thiolene 38, ritter 36) and the every-best-line baseline is about 0 to 5. It is not look-ahead and not the game's real pay (reviewer: the proxy overstates place pay about 2.5 times against chain pay, and scores the first page only); real greedy and look-ahead yield by real play were NOT measured. Percent of hands holding the reagent in which it is in a best line (in every best line):

| Variant | oxidize | hydrate | grow | dehydrate | thiolene | ritter | kinds per chain | mean pay |
|---|---|---|---|---|---|---|---|---|
| baseline | 89 (81) | 78 (61) | 95 (87) | 59 (43) | 38 (5) | 36 (3) | 2.31 | 582 |
| (a) oxPay 0.75 | 82 (80) | 78 | 94 | 59 | 38 | 36 | 2.30 | 557 |
| (a) oxPay 0.5 | 80 (74) | 80 | 94 | 65 | 40 | 37 | 2.25 | 534 |
| (a) oxPay 0.25 | 74 (71) | 81 | 94 | 68 | 41 | 37 | 2.20 | 512 |
| (b) secondary OH only | 88 (79) | 79 (61) | 95 | 61 | 40 | 37 | 2.25 | 566 |
| (b) one place only | 84 (74) | 73 (47) | 95 | 65 | 44 | 42 | 2.20 | 545 |
| (b') no chain-end cleavage (`oxNoCleave`; the bare rounds do this anyway) | 79 (65) | 97 (82) | 95 (86) | 63 (49) | 44 | 45 | 2.03 | 536 |
| (b'') secondary only and no cleavage | 75 (61) | 99 (84) | 94 | 66 | 46 | 47 | 1.97 | 523 |
| (c) hydrate as a Wacker (`hydrateKetone`) | 80 (57) | 84 (64) | 98 (95) | 58 | 39 | 35 | 2.65 | 616 |
| (c) + oxPay 0.5 | 62 (51) | 91 | 97 | 62 | 38 | 35 | 2.62 | 585 |

Findings: (1) oxidize's lead in this proxy comes from its second step, the chain-end C=C cut to an aldehyde with carbon dioxide; without it oxidize falls from 89 to 79 and hydrate rises to 97. (2) Paying oxidize's own step less barely moves it, because its value is the C=O it sets up (oxPay 0.25: 74). (3) Narrowing the sites does little. (4) The reagent in the most best lines in every variant is grow (94 to 98), not oxidize. (5) The target (none above 55 in rounds 1 to 6) is met by no variant; with three slots from five a reagent is in a line about 40 percent by chance and the useful ones are always more, so this proxy cannot meet it. (6) `hydrateKetone` raises kinds and pay but turns hydrate's alcohol into a ketone, which breaks "named things do what the real thing does" (hydrate is aqueous acid): I would not ship it. I would take the cleavage switch (b'), `RULE.oxNoCleave`, as the evidence-based one, with oxPay left at 1 or mild. All switches are off by default (`RULE.oxPay`, `RULE.oxNarrow`, `RULE.oxNoCleave`, `RULE.hydrateKetone`) for the owner's pick.

### Not done
Real-play look-ahead and yield for the oxidize variants; the planner nine-round cell; refit of MOLF and of the OFFER_STATS worth numbers; a rate-based ease; screens holding the across kinds; 500-run cells for the final scales (300 runs). One reviewer was run for each of: the fold; feeds and locks; molecules v2 with the opening and Par; the oxidize experiment. Their findings were fixed where listed above.

## The measure of 2026-11-12, ninth: N, S and Cl in a new game, the turn parity closed, locks, Par refit

Measured headless, awaiting review. Commits: 2a8ae35, tools_parity, Par refit, hetero ring molecules.

### 1. Nitrogen, sulfur, chlorine in the first rounds (ruling AF)
The six are now hydrate, oxidize, grow, thiolene (S), dehydrate, ritter (N); hydroborate and reduce left the six. A new game holds ten reflexes: ring, dry, weld, shift, tuck, flip, snap, knit (N), cap (S), close (Cl). The chain and ring molecules of up to 19 heavy atoms are replaced by 16 chain and 7 ring molecules holding N, S or Cl (`FEED_HET`, `FEED_HET_RING`, interim until MOLECULES.md; `AA.rxFeedOld = true` keeps the old table). Steps by kind, random lines of three of the six, round 1 to 3 pool (960 lines, 1,985 steps, chain molecules): ring 24, knit 16, weld 15, close 15, cap 13, dry 11, tuck 2, snap 2, shift 2 percent; no kind above 35, six kinds above 5, 44 percent of steps touch N, S or Cl (bar: 25). Flip and snap are rare here. Reviewer (fresh Sonnet): conditional pass; it found the ring-kin molecules had no N, S, Cl (fixed: 7 hetero ring molecules), hydroborate and reduce now cannot be had in a new game (the offer excludes them and the card ids differ from the offer ids; the wood spirit and slime homunculi, the findings capped, jar_slime and oxidize-then-reduce cannot be earned; OPEN), OFFER_STATS is stale for the new six (OPEN), MOTIF_START omits amine, sulfur, acid (OPEN), no benzene ring in rounds 1 to 3 (OPEN).

### 2. The 40 of 150 turns that diverged
Cause found: the test, not the game. A round opens its loose rings first (`synBegin` reopens; engine `play_round` reopens); the Python turn cases started from unsettled products that still had loose rings. With the cases reopened (`tools_parity.py make`): 126 of 150 turns agree exactly (same steps, structure, hits, reopened result), 22 are ties, 2 unresolved (a raised search cap puts both inside the engine's set). Reviewer: the method is sound; the tie test is lenient (equal places count as ties when the engine step has no choice function, runoff is not compared inside a tie set, structure-only fallbacks exist) so "150 match" means 126 exact, 22 ties, 2 unproven.

### 3. Locks
Reagents leave prot, cure and clamp atoms alone; the molecule's own reflexes leave only prot alone (a cured C=O still takes the ring). A protected site is filtered before the order is decided, so it cannot stall the cascade (reviewer confirmed). Not done: tools, `dropPieces` and mirror ignore locks; no test case holds a locked atom.

### 4. Page notes
SPEC_NOTES.md: N, S, Cl colors and labels, runoff kinds, one line per reflex kind.

### 5. The fold
FOLD.md landed late. NOT ported (ENG.NEAR is still the hook, via 'chain' only). Needs the fold of fold.py (rows of 8, rungs, anchor) and twelve across reflexes.

### 6. Par and clear rates
Par for rounds 1 to 3 refitted (greedy median of the round total, 75 runs): 6,069, 5,872, 9,599 (were 4,500, 5,600, 10,000). Bachelor's, 120 unseen runs (seeds 1,001 to 1,120) a player (not 500: the run takes 15 to 30 s now), code of commit 2a8ae35 plus Par (before the hetero ring molecules):

| Player, specEase | Clear rounds 1, 2, 3 | Wins all three |
|---|---|---|
| novice 0 | 30, 5, 57 | 0.8 |
| greedy 0 | 51, 32, 67 | 10.0 |
| median 0 | 78, 51, 76 | 23.3 |
| median 0.2 (default) | 83, 58, 70 | 31.7 |

Before this pass (500 runs, old six and molecules): median 94, 81, 82 and 62 percent wins; so the median player no longer walks over it, and round 2 is a wall for the novice (5 percent) and half the greedy players. Round 1 teaches little: the novice clears only 30 percent of round 1. The bare nine-round run (ruling W2, 2 in 100) was not measured.

### Not done
Fold port; 500-run cells; the bare nine-round measure; refit of OFFER_STATS and motif yield; the unlock path for hydroborate and reduce; reviewers for items 4 and 6 (no reviewer was run for the page notes or the Par refit).

## The measure of 2026-11-12, eighth: the revised spec table, the engine, motifs, offers, counters

Measured headless, awaiting review. Tools: `docs/tools_parity.py`, `docs/tools_spec_bake.py`, `docs/tools_offer_bake.py`; jobs `parity.js`, `parity_game.js`, `motif.js`, `offers.js`, `kinds.js`, `lines.js`.

### 1. Revised spec table (24 specs and the held-back rider)
Bachelor's, 500 unseen runs (seeds 1,001 to 500) per player, code before the engine. Clear rate in rounds 1, 2, 3 and runs won:

| Player, specEase | Clear 1, 2, 3 | Wins all three |
|---|---|---|
| novice 0 | 51, 23, 32 | 3.8 |
| novice 0.1 and 0.2 (the same N chosen) | 60, 28, 36 | 5.0 |
| greedy 0 | 81, 51, 54 | 20.6 |
| greedy 0.1 and 0.2 | 88, 59, 62 | 31.4 |
| median 0 | 94, 81, 82 | 62.0 |
| median 0.1 and 0.2 | 98, 86, 85 | 70.8 |

Ease 0.1 and 0.2 give the same table row because only one or two N are usable per round; the step is in N, not in ease. The planner was not run (it is the median player's line). Rounds are not close: the median player ends at twice N or more in 34 to 56 percent of rounds; the new-player target (75, 65, 55) is met only in round 1 by the median. Novice round 2 (23 to 28 percent) is far under 65. The JS readers against Python: 0 mismatches against the graph version, the same cage differences against RDKit.

### 2 to 4. Engine against RDKit (2,140 cases, `tools_parity.py`)
Reagents 540 (every one of the 18 on 30 molecules): 519 agree, 21 are ties. Reflexes 520 (every one of the 13 on 40): 498 agree, 22 ties. Settled to the end 300: 281 agree, 19 ties. Whole turns of three reagents 150 (engine functions): 129 agree, 20 ties, 1 unresolved. A tie is a case where the engine's own answer changes with the order the molecule is read in or the choice among equal places, and the game's answer is one the engine can give. The same 150 turns played through the game's own round (`parity_game.js`): see the reviewer below; a reviewer found 40 real divergences (queue and per-page counting) and the runoff kind lost in `react` (fixed in 2cabbb2). Not closed.

### 5. Motifs
Counts of the twelve on the game's graph against `traits.py`: 4,584 of 4,584 on 382 molecules (the 82 CASES and 300 of the pool). Pay is a multiplier on the step's places (`RULE.motifs`). Yield by round and the refit of Par were NOT done.

### 6. Offers
300 careers a length (all twelve unlocked, reader picker): different carried sets 117 (3 rounds), 252 (6), 167 (9). Every reagent stocked in 24 to 48 percent of runs; seen and taken counts are in `out/of3.json` and so on (taken 73 to 145 of 300 for the 6 best, chlorination and cyanohydrin 17 to 76). The Par fit was not redone.

### 7. Counters
`countersUpdate`, `countersRun`, `findingsProgress` are in; not measured on a run.

### Reflex kinds in a first run
Round 1 to 3 molecules, random lines of the six: holding ring and dry only, 93 percent of steps are ring; holding the seven (ring, dry, weld, shift, tuck, flip, snap) ring is 24 percent (best-of-20 lines 11 percent), the rest weld 29, dry 27, tuck 15, shift 3, snap 3. Flip never fired on those molecules.

### Not done
Item 5 yield refit; item 6 cost in the page; findings triggers; the fold (hook `ENG.NEAR` only); N, S, Cl molecules in the table (waiting for MOLECULES.md); clamps and protected atoms in the engine; turn-level reconciliation of the game's loop with the engine; the rig runs about three times slower (15 s a median run).

## The measure of 2026-11-11, seventh, part two: the spec, run lengths, the preview removed

Measured, awaiting review. Headless, tier one (`{ tierNo: 1, tier: 0, all: true, rule: { co2: false } }`), `RULE.spec` on, every player plays for the spec first and the yield second. Tools: `docs/tools_deal.py <tag>`, `docs/tools_spec_check.py`. Tags: g0 (seeds 1 to 300, `RULE.specEase` 0), u4 (unseen seeds 1,001 to 1,500, the default, ease 0.2), L1b (novice, one line looked at, seeds 1,001 to 1,300). The first measures of this part (tags s2, f0, f0.1, f0.2, u3, L1) were made while a trial line the aiming player played and took back could leave a page in the round record (`snap` and `back` did not keep `g.rec`); a reviewer found it, it was fixed in commit after c774b4e, and g0, u4 and L1b were made again. The old numbers are not used below except where said.

### What was built

| Piece | Where | Switch |
|---|---|---|
| Readers on the game's own molecule: rings (smallest set of smallest rings), by size, fused pairs and blocks, spiro, bridgehead, hetero rings, atoms in rings, longest carbon chain, diameter, branch points, the alternating run, the twelve kinds of group, double bonds, hetero atoms, elements | `SX` in `path.js` (port of `hurdle_graph.py`) | |
| The record of a round: per page the circles (reagent, whether it acted and where, the bank), the reflex steps each set off, the reflex steps in order, runoff by kind, the molecule at the end of the page before the loose rings open | `g.rec`, `specBegin`, `specPage` | |
| Five readings: gain, loss, abs, last, range | `specRead` | |
| The table of specs: 42 rows, with the share of aiming players at each N by round | `SPEC_TABLE`, written by `tools_spec_bake.py` | replace wholesale |
| State: `g.spec = { kind, n, mark, name, text, value, met, parts }` after every page; `P.specValue`, `P.specMet`, `P.specParts`; the round won by the spec: `P.roundWon`, `P.roundEnd` | | `RULE.spec` (on) |
| The generator `P.specPick(molecule, round, carried, rnd, tier, hist, run)`: table mode, never the same family twice running, two specs from round 6, each reached by an aiming player in up to 3 plays on this molecule played under the brief of the round | | |
| Run lengths: `P.LENGTHS`, `runNew(.., { reach, length, tierNo })`, `run.len`, `g.runLen`, `P.runWon(g or run)`, `P.runLast`, `P.runResult(run)`, `P.reachAfter` | | |
| `queueView` reads the present only | | |

### The JavaScript against Python

`jobs/spec_dump.js` dumps the graph and the JS values for 300 molecules (the game's 78 and 222 more from the Python generator, in the Kekule form the game reads) and for 300 end-of-page molecules of rounds played by the aiming player on the game's table. `tools_spec_check.py` compares them with `hurdle_graph.py` on the same graph and with RDKit (`hurdles.feat`) on the molecule built from the same graph.

| | Molecules | JS against the graph version | JS against RDKit |
|---|---|---|---|
| the game's table and the generated ones | 300 | 0 mismatches in 20 readers | 12 molecules differ on rings, rings of 3 or 4, rings of 6, fused pairs, fused block, rings plus double bonds |
| end states of played rounds | 300 | 0 mismatches | 15 molecules differ on the same readers |

The differences from RDKit are all cages (cubane, adamantane): RDKit lists the symmetrised set of rings, the smallest-set count is lower (`HURDLES.md`, "How close the graph version is"). The counts of the twelve kinds of group agree with RDKit on every molecule. Only OH, C=O, C=C, ether and ester occur in these molecules: no game molecule holds nitrogen, sulfur or chlorine, so the readers of COOH, NH2, SH, Cl, amide, S-S and C=N were not exercised.

### Spec clear rate by round

Every run counted in every round (a failed round does not stop the run: `all`). The Python generator's tested target for an aiming player in rounds 1 to 3 is 85, 80, 65 percent. Seeds 1 to 300 (tags f0, f0.1, f0.2) and, last, unseen seeds 1,001 to 1,500 with the default (u3).

| Player | Clear rate, rounds 1, 2, 3, ease 0 (seeds 1 to 300) | Unseen, default (ease 0.2, seeds 1,001 to 1,500) |
|---|---|---|
| novice (4 lines looked at) | 51, 44, 27 | 93, 93, 45 |
| greedy (12 lines) | 81, 78, 56 | 99, 99, 75 |
| median (every line) | 97, 96, 82 | 100, 100, 94 |
| planner | the same as the median player: the line it is given under the spec is the median player's | |

The Python aiming player clears 85, 80 and 65 percent in those rounds; the median player here clears 97, 96 and 82 at ease 0. The table was fitted on the Python engine; the game's aiming players clear less in round 3 (round three is an assay and short has two pages), so the first run is eased by `RULE.specEase = 0.2` (bachelor's only).

### Yield, separate from the win

Share of rounds (every run counted) in which the total passes the number to beat (the first of the four marks), then the 2, 4 and 8 times marks (stable, unstable, volatile, overreact). Unseen seeds, default.

| Player | Number to beat | Twice | Four times | Eight times |
|---|---|---|---|---|
| novice | 73, 67, 49 | 50, 40, 26 | 21, 17, 10 | 6, 5, 4 |
| greedy | 87, 89, 79 | 69, 70, 52 | 41, 39, 27 | 18, 20, 13 |
| median | 99, 99, 97 | 97, 98, 90 | 92, 92, 74 | 78, 78, 58 |

Gold is paid by these marks whether or not the spec was met, as before.

### Run lengths: who wins a bachelor's

Unseen seeds 1,001 to 1,500, 500 runs a player, the default.

| Player | Wins the three rounds | Tries to a win | Pass, rounds 1, 2, 3 (of runs that reached it) |
|---|---|---|---|
| novice | 39.8 percent | 2.5 | 93, 93, 46 |
| greedy | 73.6 | 1.4 | 99, 99, 75 |
| median | 94.0 | 1.1 | 100, 100, 94 |
| planner | the same as the median player | | |

Without the ease (seeds 1 to 300): novice 7.3 percent (13.6 tries), greedy 33.0 (3.0), median 76.3 (1.3). The eases 0.1 and 0.2 were swept before the fix (novice 18.0 and 33.0 percent, greedy 47.7 and 64.3, median 83.7 and 89.3) and not swept again; with the record fixed the default 0.2 is easier than that sweep said, so a lower ease (0.15 or less) is the next thing to try when the revised list is in.

Against the owner's targets:

- A new player wins within a few tries: met by the novice at ease 0.2 (2.5 tries), not at ease 0 (13.6). The novice is a model: it looks at four lines of the hand and keeps the one that comes closest to the spec. A novice that looks at one line only (places blind, tag L1b, seeds 1,001 to 1,300; old code, before the fix, see above) wins 6.3 percent of runs (15.8 tries) and passes rounds 1, 2, 3 at 67, 72 and 13 percent. How much a real new player sees of the effect of a line before it is fired is the thing this number rests on, and no person has been measured.
- Each round is close: not met. Counting a round as close when the final number is within a quarter of N (or 1), the median player is close in 27, 15 and 53 percent of rounds 1, 2, 3 and reaches twice N or more in 92, 94 and 33. Many specs sit far under what a player who reads can make. The revised list and its N (`docs/tools_chem/SPECS.md`) are to fix that; the machinery takes them wholesale.
- An average player does not win everything as a matter of course: the greedy player wins 73.6 percent, the median player 94.0. The median player is the better of the two and is not an average player.

### The preview, removed

`queueView` no longer plays the queued circles. It reads the molecule as it stands: which reagents of the hand fit somewhere now (`o`, with no atoms marked), whether the bank could be used now, and for each queued circle whether it fits now (`kinds`, `fits`); `fwd` is null. `P.peek` is still there for the page's hover; the page must stop drawing from it (HARNESS P).

### What the reviewers said

Part one (the deal): a conditional pass on the mechanism and the numbers, a fail on the balance result, which the document did not say plainly: under the yield the new player could no longer win the first run (3.6 percent), the median and planner players won 97 to 99 percent, rounds four to nine were not touched, molecule factors were not fitted again, and Par was fitted on the seeds it is reported on. Those hold for the yield; the spec (this part) is what decides a win now. Rounds four to nine are still not fitted. Part two (the spec, lengths, the preview): conditional pass on the mechanism and the stored numbers; fail on three points, all taken up: (1) the round record was not restored after a trial line (fixed: `snap` and `back` keep `g.rec` and `g.spec`; the numbers above were made again; the greedy player went from 62.6 to 73.6 percent and the novice from 34.8 to 39.8); (2) the preview is not gone from the page: `queueView` is cut down, but `o` still carries the full option of each reagent and `scheme.js` still calls `P.peek` and reads `st.view.fwd`; this is the page builder's to remove and stays open; (3) in rounds 6 to 9 the second spec could repeat the last round's family and the fall-back was unproved (fixed in `specPick`; rounds 6 to 9 not measured); the end-of-run result was not complete or safe (fixed: `roundEnd` once only, pays the harder molecule's coins on a spec win, logs `ypass` and the word; `runResult.gold` is the gold earned, `coins` the purse). It also found that the port is faithful on everything the game's molecules exercise, with unexercised differences in the readers for C=N, S-S and the aromatic C=C exclusion, which no game molecule has.

### What is not done

- The list of specs is the first set (42 rows); the revised list is not in. Reach is checked by up to three aiming plays, not by a beam search; the spec is not checked against the points player (the Python generator refuses a spec the points player always clears). Families open by run length is a guess (`SPEC_FAMILY_TIER`).
- Round six on (two specs): not measured here, the run lengths of six and nine were not played; the long-run rates wait for instruments and homunculi (HARNESS W2).
- The planner has no next-hand reading under the spec.
- The page still decides a win by `g.total >= st.quota`; it must call `P.roundWon` (`SPEC_NOTES.md`). Marks the page does not draw yet show nothing.
- Findings: only the counters (`run.by`) are in `runResult`.

## The measure of 2026-11-11, seventh, part one: five dealt from the six (`RULE.deal6`)

Measured, awaiting review. Headless, 500 runs a player, seeds 1 to 500, `{ tierNo: 1, tier: 0, all: true, rule: { co2: false } }`; tools `docs/tools_deal.py <tag>` (reads `.claude/headless/out` directly). Tags d6on (Par as it was), d6b (Par fitted again), d6d (turn measures, 80 runs, `dec` and `deep`).

### What changed

- The three-round bare run was dealt from four reagents (dehydrate joined in round four and grow in round five, `RUNG.from`), so five slots of the hand held four reagents and nothing was dealt. `RULE.deal6` (on) puts all six in the deal from round one: five are dealt from the six, three are fired. `RUNG.from` is kept and read only with the switch off.
- Grow and dehydrate make most of the yield. With the six, the median player makes 24, 27 and 15 times the old Par (it made 3 to 4), the novice 3 times: the old numbers are far too low (d6on: everybody passes, median 100 percent, novice wins all three 54.6 percent). Par for rounds one to three was fitted again, once: greedy player's median over 3 (`tools_tier1_bake.py`): 4,500, 5,600 and 10,000 (were 1,210, 1,920 and 2,580). Molecule and assay factors were not fitted again.
- Yield is not the win condition once `RULE.spec` is built (next parts), so the pass rates below only say where the four marks fall.

### The turn

| | Four dealt (sixth measure) | Five from six: novice | median player |
|---|---|---|---|
| Second option within 30 percent of the best, or better two turns on | 21.5 and 17.9 percent | 56.7 | 61.3 |
| of which within 30 percent | | 38.4 | 27.5 |
| One option only | 66.6 and 67.6 | 14.1 | 11.5 |
| Options a turn | 1.41 and 1.42 | 2.63 | 2.70 |
| Best ordered play over the obvious one by over a fifth, pages | 28.3 and 17.5 | 73.6 | 80.9 |
| Over 5 percent | | 79.2 | 85.6 |

The gate (half the turns) is met by both players. Order is decisive on three pages in four. The numbers of the left column are from the sixth measure (the median player and the novice, 80 runs each).

### Pass table at the new Par

| Player | Pass, rounds 1, 2, 3 (of runs that reached it) | Wins all three | Median total over the number |
|---|---|---|---|
| novice | 38, 34, 28 | 3.6 percent | 0.79, 0.72, 0.51 |
| greedy | 92, 90, 87 | 71.8 | 2.99, 3.08, 3.00 |
| median | 100, 100, 99 | 99.0 | 23.9, 27.1, 15.1 |
| planner | 99, 99, 99 | 96.8 | 25.1, 25.1, 11.1 |

### What it says

- The turn is a choice now: the gate is passed by 5 to 6 times the old rate.
- Yield now spreads wider than the four marks (2, 4, 8 times the number) can cover: the median player is 15 to 27 times the number, the novice under 1. One Par cannot put the novice at the first mark and the median player short of the last. That is a property of grow doubling, not of the Par; yield no longer decides a win once the spec does.
- Not done: unseen seeds, the molecule factors, a run with `deal6` off on the new Par.

## The measure of 2026-11-11, sixth: the leak in the rig, and tier one again, headless

Measured, awaiting review: nothing here says a section passes. No rule of play and no number to beat was changed. What changed is the rig, where it runs, and one thing in `path.js` that makes the game match what was measured. The section after this one is the tier one measure this checks.

### The leak

The reaction rules read one global, `AA.rx.MODE` (in `rules.js`). `path.js` set it from `RULE` only when a round began (`synBegin`). Everything read before the first round of a run, which is the reading of the pair of molecules (`easeOf`, the structural screen), ran under whatever the run before had left. On a fresh page that was `co2` off, although `RULE.co2` is on by default. Two faults came from it.

1. The first run on a page, and any run that followed a run with other options, read its first pair under the wrong rule. The median player then took a different molecule and the whole run differed. Seed 65 alone beat 6 rounds; after seed 64 it beat 0. The 0 is the right answer under the rules as they stand: with `co2` on at the pair, the player takes a molecule on which it makes 1,119 against 1,200.
2. `easeOf` keeps its readings in a table keyed by molecule, reagents and kinds of cascade, and not by the mode. A reading made with `co2` off was used again with it on, and the other way round, for as long as the page lived.

### The fix

- `path.js`: `modeSync(run)` sets the modes from `RULE` and from the run. It is called when a round begins, when the pair is drawn or read, and when the picks are dealt. The table in `easeOf` is keyed by the modes and by the size limit as well.
- `path.js`: a bare run (`RULE.bare`, or tier 1) gives off no carbon dioxide whatever `RULE.co2` says, since it has no jar to fill. Before this a tier 1 run on the page played with `co2` on, while the fifth measure was made with `co2` off. The game now plays what was measured.
- `sim.js`: `runSim` saves `P.RULE` and `AA.rx.MODE`, sets the modes from the rules before the run, and puts both back in a `finally`, so an error cannot leave a rule behind. `simChunk`, `simGo`, `simPart` and the sink job all go through `runSim`.
- Not changed: `scrRound` and `gapRound` in `casc.js` set `RULE.atoms` and `RULE.fresh` and put them back at the end without a `finally`. They do not touch the modes.

### The proof

All headless, each in its own page.

| Check | Result |
|---|---|
| `leak.js` (every value of `AA.rxPath` and `AA.rx` before and after a run) | nothing changed (it reported `rx.MODE` before the fix) |
| Seed 65 after seed 64 against seed 65 alone, median player, default options | the same |
| 60 runs, seeds 1 to 60, median player, default options: forwards, backwards, and split over two pages | the same in every round of every run |
| 60 runs, tier one options, median player: forwards and backwards | the same |
| 60 runs, novice, default options: forwards and backwards | the same |

### What the leak did to earlier numbers

- **The fifth measure (tier one) was not touched.** It passed `co2: false`, so the mode never differed from the rule. The 1,200 unseen runs (tag u2, seeds 1,001 to 1,300, four players) were run again headless on the fixed rig (tag hu2): every round of every run is the same, molecule, number and total. The seen runs (tag t2) were played before the numbers were baked, so they cannot be compared round by round; played again on the baked numbers (tag h2) they give the same tables to within a point (below).
- **The fourth measure (the bare game) passed `co2: false` as well** and is untouched for the same reason. Its rounds four to nine are out of date for another reason: see "The gap" below.
- **Runs made with default options after `RULE.co2` became the default** are touched a little: the first run of each page load, and the first run after a change of options in one tab. Seeds 1 to 100 of the median player with the pair read under the wrong rule in every run (the old `simN.js`) against the fixed rig: 2 or 3 runs in 100 differ (seeds 47, 65, 85), and rounds beaten is 7.4 both ways. In the recording page only one run in a page load was wrong, so under 1 run in 100.
- **Not to be trusted without a rerun:** any comparison that switched `co2` on and off in one tab, because of the table in `easeOf`. That is the carbon dioxide source read in `HOMUNCULI_2.md` (100 median runs on and off) and the dry ice reads in `HOMUNCULI.md` and `JARS.md`. The creature and helper reads of the same day used one setting of `co2` throughout and are off by the first run of a page at most.

### Tier one again, clean

Options as the fifth measure: `{ tierNo: 1, tier: 0, all: true, rule: { co2: false } }`, the baked Par 1,210, 1,920, 2,580. Three measures: seeds 1 to 500 (tag h2), seeds 1,001 to 1,300 (tag hu2, the same runs as u2), and a new unseen measure four times the size the gate asks, seeds 2,001 to 4,000 (tag hv). A pass rate is of the runs that reached the round.

| | Fifth measure, seen | Clean, seeds 1 to 500 | Fifth, unseen (300) | Clean, the same 300 | Clean, 2,000 unseen |
|---|---|---|---|---|---|
| Novice pass, rounds 1, 2, 3 | 85, 65, 66 | 85, 65, 66 | 82, 69, 60 | 82, 69, 60 | 81, 66, 66 |
| Greedy pass | 97, 90, 90 | 97, 90, 90 | 97, 92, 91 | 97, 92, 91 | 98, 91, 92 |
| Median pass | 100, 99, 96 | 100, 99, 96 | 100, 100, 98 | 100, 100, 98 | 100, 99, 97 |
| Planner pass | 100, 99, 98 | 100, 99, 98 | 100, 100, 99 | 100, 100, 99 | 100, 99, 98 |
| Wins all three: novice, greedy, median, planner | 36.4, 79.2, 95.0, 97.0 | 36.2, 79.0, 95.0, 97.2 | 33.7, 81.7, 97.3, 98.3 | 33.7, 81.7, 97.3, 98.3 | 35.6, 81.5, 95.8, 97.3 |
| Novice, tries to win | 2.7 | 2.8 | 3.0 | 3.0 | 2.8 |
| Median margin over the number | 4.05, 2.98, 3.01 | 4.05, 2.98, 3.02 | 5.23, 3.28, 2.80 | 5.23, 3.28, 2.80 | 4.20, 3.10, 3.00 |
| Novice margin | | 2.17, 1.34, 1.41 | | 2.08, 1.46, 1.24 | 2.08, 1.46, 1.49 |
| Last page changes the flag reached, median | 43, 47, 41 | 43, 47, 41 | 47, 54, 43 | 47, 54, 43 | 45, 47, 42 |
| The same, novice | 38, 31, 40 | 38, 31, 40 | | 35, 35, 31 | 35, 32, 36 |
| Novice over greedy, medians | 0.74, 0.58, 0.59 | 0.74, 0.58, 0.58 | | | 0.66, 0.67, 0.62 |
| Planner over greedy, medians | 2.07, 1.86, 1.50 | 2.07, 1.85, 1.48 | | | 1.92, 1.89, 1.50 |
| Molecules in a round, most over least, median player | 2.2, 2.5, 2.0 | 2.2, 2.5, 2.0 | 4.1 in round 1 | 4.1, 2.3, 1.9 | 1.6, 1.5, 1.4 |

Flags reached on the 2,000 unseen runs, share of every run, none / stable / unstable / volatile / overreact:

| | Round 1 | Round 2 | Round 3 |
|---|---|---|---|
| novice | 19 / 28 / 32 / 15 / 6 | 35 / 31 / 22 / 11 / 2 | 34 / 31 / 22 / 10 / 2 |
| greedy | 2 / 23 / 38 / 25 / 13 | 9 / 36 / 31 / 17 / 7 | 8 / 31 / 33 / 19 / 9 |
| median | 0 / 9 / 38 / 31 / 22 | 1 / 19 / 43 / 24 / 13 | 3 / 23 / 39 / 22 / 12 |
| planner | 0 / 3 / 27 / 34 / 35 | 1 / 10 / 38 / 33 / 19 | 2 / 16 / 38 / 29 / 15 |

What it says:

- **The tier one numbers stand.** The leak moved nothing, so Par for rounds one to three was not fitted again.
- **The two misses a reviewer found on unseen seeds were the size of the sample.** With 300 runs a molecule is played about 8 to 20 times in a round and one unlucky molecule read 4.1 times apart; on 2,000 runs, with 50 to 250 plays each, the molecules are 1.6, 1.5 and 1.4 times apart and the round one margin is 4.2, not 5.2. The molecule factors were left alone: a cap was not needed.
- **Against the owner's targets** (`LOOP.md`, "How hard it is"): the novice wins the three rounds 36 runs in 100, 2.8 tries (met). The median player beats the rounds by 4.2, 3.1 and 3.0 times (round one a little over "about 2 to 4"). The last page changes the flag reached in 45, 47 and 42 rounds in 100 for the median player (met, two of them close to the gate of 40) and 35, 32, 36 for the novice (under).
- **Still true from the fifth measure, and not a matter of numbers:** the median player wins tier one 96 times in 100, so only the flag is in doubt for it; a dealt reaction has no use left on a third of the novice's pages; the molecule does at most three things by itself on a page; every page shows the same four reactions. The turn measures (second option worth taking on 18 turns in 100) were not run again: they do not depend on the leak.
- `BALANCE.md` rows for rounds one to three were rewritten to the owner's targets, which the old rows (margins 3, 2.5, 1.6) contradicted.

### The gap between the headless default and the earlier sections

`HEADLESS.md` found 7.4 rounds beaten and 48 wins in 100 for the median player with default options, against 6.1 to 6.4 rounds and 16 to 24 wins in the third and fourth measures. It is not the leak: the fixed rig gives 7.39 rounds and 49 wins on the same 100 seeds. It is the options and the rules. Same seeds (1 to 200, median player, failing ignored and the runs read again against each Par):

| Run | Rounds beaten | Wins in 100 |
|---|---|---|
| Default now: all suppliers, pieces held and used by the reading, baked Par | 7.67 | 60.0 |
| The same runs read against the Par of the third measure (675 to 225,000) | 7.50 | 42.0 |
| Third reaction double off, at the third Par | 6.90 | 30.5 |
| Double, next hand, filter, choosing the molecule and carbon dioxide all off, at the third Par | 6.43 | 26.5 |
| The third measure as written (268 runs, the players wasting the pieces) | 6.4 | 19.0 |
| No piece held, default rules, at the third Par | 6.70 | 27.5 |

And for the bare game (first supplier only, nine rounds, 500 runs of the median player, seeds 1 to 500):

| Run | Rounds beaten | Wins in 100 | Pass by round |
|---|---|---|---|
| The fourth measure as written | 6.1 | | 100, 95, 100, 96, 92, 68, 73, 70, 56 |
| Bare now, baked Par | 7.43 | 43.6 | 100, 100, 100, 98, 96, 85, 87, 89, 71 |
| Bare now, third reaction double off, read at the Par of the fourth measure (200 runs) | 5.00 | 12.0 | 100, 91, 81, 93, 88, 66, 74, 77, 52 |

So three things, in order of size: the Par of rounds seven to nine was set by the bare fit of the fourth measure (58,200, 61,300, 105,000, where the third measure had 92,600, 130,000, 225,000) and is far too low for a run with pieces; the third reaction's double (fifth measure) raised every round's total and rounds four to nine were not fitted again; the players now use the pieces by the reading. With the double off, rounds four to nine of the bare game read as the fourth measure wrote them, to within the noise of 200 runs. The novice in the bare nine rounds now: 80, 68, 64, 35, 8 and 1.83 rounds beaten.

**Rounds four to nine are not fitted to anything now.** They wait for the helper and creature tiers, and the owner's bar for those is by the run (a six-round run won about 1 time in 4 by the median player with helpers; nine rounds about 1 in 10, the planner about 1 in 3), which today's numbers miss by far (43 to 60 wins in 100).

### Which earlier sections to trust

- Fifth (tier one): stands; rerun and identical on unseen seeds.
- Fourth (the bare game): rounds one to three are replaced by the fifth; rounds four to nine are out of date since the third reaction's double.
- Third and earlier: older rules. Not touched by this leak (there was no `co2` mode then).
- Outside this file: the carbon dioxide source on and off, and the dry ice reads, as said above.

### Measuring headless now

The browser pane is no longer used for measures (`HEADLESS.md`). In `.claude/headless/`:

- `jobs/simR.js`: `player`, `from`, `n`, `opts`, `tag`, `order=rev`. Returns every round row of the rig.
- `hlmany.sh <tag> <player> <from> <n> <pages> <timeout s> '<opts json>'` splits a measure over several pages at once and runs again a page that failed to load. The static server on 8766 answers one request at a time: twelve pages started in the same second lost scripts, so start at most six together.
- `python docs/tools_hl.py gather <tag> <base>` writes the results where `tools_rig.py`, `tools_tier1.py` and the rest read them. `python docs/tools_hl.py same <tag a> <tag b>` says how many runs are the same in two measures (it reads the whole frames folder and takes some minutes).
- Tier one, 500 runs: novice 6 s, greedy and median 13 s, planner 18 s of job time on one page; with start-up, all four players in under two minutes. 2,000 runs a player took about five minutes for all four. A nine-round run of the median player with pieces is about 6 s; 200 runs over five pages took about five minutes.

### What is still wrong

- Round one's margin for the median player is 4.2, just over the band, and the novice passes round one 81 to 85 times in 100, not 9 in 10. One number cannot do both; the fifth measure's table of trade-offs still holds.
- The novice's last page changes the flag in 32 to 36 rounds in 100, under the gate of 40.
- Rounds four to nine have no fitted number.
- The turn measures, the break test and the redraw price were not run again.
- `scrRound` and `gapRound` in the recording page still restore their rule without a `finally`.

### Added later the same day: uses are free in tier one, and two hooks for the page

- `RULE.usesFree` (on): in the three-round bare run (`run.tierNo === 1`) no reaction runs out of uses, so the page can hide the use marks there. `P.usesFreeOn(run)` and `P.usesBind(run)` say whether it applies.
- `P.swapQueue(i, j)` swaps two queued circles of the round last begun, at no cost.
- Measured headless, 500 runs a player, seeds 1 to 500, Par 1,210, 1,920, 2,580 kept.

| Player | Pass, rounds 1, 2, 3, uses binding | Uses free | Wins all three, binding | Free |
|---|---|---|---|---|
| novice | 85, 65, 66 | 89, 69, 69 | 36.2% | 42.4% (2.4 tries) |
| greedy | 97, 90, 90 | 97, 90, 90 | 79.0% | 79.0% |
| median | 100, 99, 96 | 100, 99, 96 | 95.0% | 95.0% |
| planner | 100, 99, 98 | 100, 99, 98 | 97.2% | 97.2% |

- Median margins: 4.03, 2.98, 3.17 (were 4.03, 2.98, 3.01). Novice margins: 2.44, 1.52, 1.46 (were 2.16, 1.36, 1.37).
- Only the novice moves, as expected: uses ran out on a third of its pages and on almost none of the others'. Par was not refit. Unseen seeds were not rerun with uses free.

## The measure of 2026-11-11, fifth: tier one, three bare rounds

**Checked 2026-11-11 on the fixed rig (the section above): the unseen runs are the same run for run and the tables stand. The spread of molecules and the round one margin on unseen seeds were the size of the sample.**

Measured on the rules as committed with this section. Measured, awaiting review: nothing here says a section passes. A first run is now rounds one to three with no helper and no creature (`LOOP.md`, "Tiers"). Only those three rounds were fitted. The numbers of rounds four to nine were left as the fourth measure set them; they are to be fitted later with helpers held. The section after this one is the "before".

A measure is `simGo(tag, players, from, to, base, { tierNo: 1, tier: 0, all: true, rule: { co2: false } })`. `python docs/tools_tier1.py <tag> <first> <last> fit 4,3,3` prints every table here; `tools_tier1_bake.py` writes the numbers into `path.js`.

### What was built

| Thing | What it is | Switch |
|---|---|---|
| Tiers | a run is 3, 6 or 9 rounds. `runNew(tier, extra, { tierNo })` sets `run.tierNo`, `run.span`, and for tier 1 `run.bare` (no helper, no creature) and `run.six` (nothing new on the take-one page: only a stronger reagent or one more use). Without `tierNo` a run is nine rounds as before. `runLast(run)`, `runWon(run)`, `tierRule(n)` | `TIERS` |
| The next hand | the hand of the next page is drawn when this page is dealt, from the same random source, and kept in `g.nextHand`. The next deal uses it. The last page of a round has none | `RULE.next` |
| The third reaction | every step the molecule takes by itself after the third reaction of the line has acted pays double: twice the places and twice what it adds to extra. A third circle that is wasted or is the bank sets nothing off and doubles nothing. `g.lastOn` says it is on; the scoring event carries `lastx: true` | `RULE.lastx`, `LASTX.mul` |
| The shape filter | in rounds one to three a molecule is rejected when it has two or more OH and no C=C, or a single C=O and no C=C, or one kind of group only; one with at most one OH and two or more C=C is twice as likely to be dealt | `RULE.filter`, `feedShape`, `FILTER` |
| Reordering | `queueSwap(g, i, j)` and `queueMove(g, from, to)` reorder the circles before the page is fired. Nothing is spent | |
| What fits now | `fitsNow(g, id)` and `queueFits(g)`: does a reaction fit anywhere on the molecule as it stands now. It reads the present only | |
| When dehydrate joins | round four (it was round three). Rounds one to three are dealt from four reactions: hydrate, oxidize, hydroborate, reduce | `RUNG.from` |
| The planner | when the next hand is known it plays the next page out on it, the biggest number at each circle, and counts what the round would then have made (`nextVal` in `tools_sim.js`). The median player, the greedy player and the novice do not look at the next hand. The novice was given no dry run and learns nothing ahead of firing | |

There is no dry run and no preview of what a line will do: the owner ruled it out.

### Each switch on and off

200 runs for each player, seeds 1 to 200, the other two switches on, on the final deal and factors (tags xn, xl, xf, x0; "all on" is tag t2, 500 runs). Totals have the molecule and assay factors divided out. Ratios are of medians; the ratio of means is in brackets.

| | novice over greedy, rounds 1, 2, 3 | planner over greedy | median player over novice |
|---|---|---|---|
| all three on | 0.74, 0.58, 0.59 (0.40, 0.37, 0.38) | 2.07, 1.86, 1.50 (1.71, 1.66, 1.50) | 1.86, 2.24, 2.11 |
| next hand off | 0.67, 0.69, 0.57 (0.34, 0.39, 0.35) | 1.67, 1.64, 1.54 (1.76, 1.86, 1.36) | 1.87, 2.06, 2.34 |
| third reaction off | 0.69, 0.64, 0.59 (0.38, 0.37, 0.39) | 1.79, 1.73, 1.60 (1.58, 1.56, 1.38) | 1.72, 1.81, 2.04 |
| filter off | 0.65, 0.74, 0.52 (0.38, 0.41, 0.33) | 1.79, 1.95, 1.58 (2.03, 1.90, 1.42) | 2.22, 2.31, 2.49 |
| all three off | 0.74, 0.68, 0.67 (0.38, 0.40, 0.43) | 1.37, 1.35, 1.35 (1.49, 1.24, 1.20) | 1.56, 1.70, 1.78 |

- **The novice is already at two fifths of greedy by the mean and over half by the median**, with no help. The model in `TIER1_DEPTH.md` had it at a fifth. None of the three switches moves it.
- **The next hand.** The planner over the greedy player goes from 1.67, 1.64, 1.54 to 2.07, 1.86, 1.50 by the median, and does not move by the mean. Read with care: in tier one the rack is four reactions and the hand is five, so every page is dealt the same four and the "next hand" is always the hand already on the page. What the planner gained is looking a page ahead at all, not anything the page newly shows. The switch will mean something once a round deals from six or more.
- **The third reaction.** It is the one that changes the turn. Every ordered line of three of the hand was played on every page of 40 runs (`lineStudy` in the recording page; the player takes the best line of the page): of about 55 lines a page, the lines within a fifth of the best fall from 16.0 to 9.1; the best order of the best three beats their median order by over a fifth on 78 pages in 100, where it was 19. The cost: the median player pulls away from the novice (1.72, 1.81, 2.04 to 1.86, 2.24, 2.11), and pages on which the best line makes nothing go from 19 to 29 in 100 for a player who takes the best line of each page.
- **The filter** rejects nothing that tier one deals: none of the sixteen molecules of rounds one to three has a rejected shape. It doubles the odds of the two molecules of the preferred shape and no measure moves outside noise. It is left on because it is harmless.
- All six reactions from round one (with the three switches on, 57 runs): the median player makes 36 to 60 times what the novice makes, because of grow. Dehydrate from round two: 7.5 times in round two. Dehydrate in round three: 5.7 times there, 2.8 without it. That is why tier one is dealt from four.

### The numbers

Molecule factors for the sixteen molecules of tier one and the first act of the assay factors were fitted again (700 runs of the median player choosing at random, tag tf, `tools_factors.py`): the sixteen were 7.5 to 12 times apart in a round on the old factors. Then Par for rounds one to three, once, on tag t2: the median player's median total over a margin of 4, 3 and 3.

Par: 1,210, 1,920, 2,580 (they were 1,230, 2,790, 4,620). Rounds four to nine unchanged: 4,960, 18,800, 55,300, 58,200, 61,300, 105,000.

What other margins would give, same runs, every run counted in every round:

| Margins, rounds 1, 2, 3 | novice passes | novice wins all three | tries | greedy wins | median player wins | last page changes the flag, median player |
|---|---|---|---|---|---|---|
| 2, 2, 2 | 56, 46, 47 | 11.8% | 8.5 | 40.8% | 70.6% | 48, 45, 43 |
| 3, 3, 3 | 72, 66, 66 | 30.4% | 3.3 | 75.6% | 94.6% | 45, 47, 41 |
| **4, 3, 3** | 86, 66, 66 | 36.8% | 2.7 | 79.2% | 95.2% | 43, 47, 41 |
| 4, 4, 4 | 86, 75, 80 | 51.2% | 2.0 | 90.8% | 99.2% | 43, 39, 40 |
| 5, 4, 4 | 93, 75, 80 | 55.0% | 1.8 | 93.2% | 99.2% | 45, 39, 40 |

4, 3, 3 was taken: it is inside the band of 2 to 4, the novice wins inside three tries, and the last page is open in over 40 rounds in 100. With the third reaction paying double switched off, the same margins give the novice 45.5 wins in 100 (200 runs).

### Pass rates

500 runs for each player, seeds 1 to 500, tag t2, read against the Par fitted on them. Unseen: 300 runs for each player, seeds 1,001 to 1,300, tag u2, played on the baked numbers. A pass rate is of the runs that reached the round.

| Round | novice | unseen | greedy | unseen | median | unseen | planner | unseen |
|---|---|---|---|---|---|---|---|---|
| 1 | 85% (500) | 82% (300) | 97% (500) | 97% (300) | 100% (500) | 100% (300) | 100% (500) | 100% (300) |
| 2 | 65% (423) | 69% (245) | 90% (486) | 92% (292) | 99% (500) | 100% (300) | 99% (500) | 100% (300) |
| 3, assay | 66% (276) | 60% (168) | 90% (439) | 91% (270) | 96% (495) | 98% (299) | 98% (497) | 99% (299) |
| wins all three | 36.4% | 33.7% | 79.2% | 81.7% | 95.0% | 97.3% | 97.0% | 98.3% |
| tries a win takes | 2.7 | 3.0 | | | | | | |

Median margin over the number: median player 4.05, 2.98, 3.01 (unseen 5.23, 3.28, 2.80); planner 6.03, 4.28, 3.58; greedy 2.91, 2.33, 2.43; novice 2.17, 1.34, 1.42.

The last page changes the flag reached (missed, or which of the four flags), every run counted: median player 43, 47, 41 rounds in 100 (unseen 47, 54, 43); novice 38, 31, 40 (unseen 35, 35, 31); greedy 49, 42, 45; planner 51, 58, 48.

Flags reached, rounds in 100, seen seeds: none / stable / unstable / volatile / overreact.

| Round | novice | greedy | median | planner |
|---|---|---|---|---|
| 1 | 15 / 29 / 31 / 17 / 7 | 3 / 26 / 36 / 21 / 15 | 0 / 10 / 40 / 26 / 24 | 0 / 4 / 29 / 32 / 35 |
| 2 | 34 / 36 / 21 / 7 / 2 | 10 / 31 / 33 / 17 / 9 | 1 / 21 / 40 / 25 / 13 | 1 / 10 / 35 / 36 / 18 |
| 3 | 35 / 30 / 22 / 11 / 3 | 10 / 30 / 33 / 18 / 9 | 4 / 26 / 34 / 23 / 13 | 2 / 19 / 34 / 30 / 15 |

Molecules in a round, median player, median of total over number for each molecule: 2.2, 2.5 and 2.0 times apart in rounds one to three (unseen 4.1, 2.4, 2.0). Round three by kind of assay, total over number: each 2.57, loose 3.81, scarce 3.52, short 2.70 (unseen 2.48, 2.50, 3.38, 2.62).

What the molecule did by itself on a page, pages in 100 with 1 or more, 3 or more, 6 or more: novice 75, 5, 0; greedy 80, 15, 0; median 79, 20, 0; planner 89, 17, 0. The longest on any page of any player is 3. Mean 1.22, 1.67, 1.71, 1.87.

Coins held after rounds one, two, three: novice 1.3, 1.7, 2.1; median player 1.7, 2.8, 3.9. The harder molecule of the pair is taken by the median player in 22 pairs in 100. The pair is never drawn again and the hand is never dealt again: with four reactions and a hand of five there is nothing to deal again.

**The three uses.** A dealt reaction had no use left on 33, 32 and 32 pages in 100 of the novice's rounds one to three, and on none of the other players' outside a scarce assay (4 to 5 in 100 in round three). The same four reactions are dealt on every page, so a player placing at random fires one three times in six circles and finds it empty. The uses bind for the player a first run is for. `usesBind()` says true.

### The turn, measured again

80 runs each of the median player and the novice, seeds 1 to 80, `{ dec: true, deep: true }`, tags d2 (final rules) and d0 (the three switches off). An option is a thing that can go in the circle whose turn it is as the line fires: a reaction that acts there, or the bank.

| | gate | final rules, median player | novice | three switches off, median player | novice |
|---|---|---|---|---|---|
| second option within 30% of the best, or better two turns on | half | 17.9% | 21.5% | 14.4% | 26.3% |
| one option only | | 67.6% | 66.6% | 71.7% | 62.3% |
| options a turn | | 1.42 | 1.41 | 1.37 | 1.49 |
| best ordered play over the greedy one by over a fifth, pages | | 17.5% | 28.3% | 13.3% | 34.0% |
| bank right when offered (the only move) | | 79.9% (59.8%) | 76.3% (62.7%) | 90.6% (79.4%) | 69.6% (57.7%) |
| hand dealt again | | never | never | never | never |

The gate is missed by far, and it is lower than the 35% of the fourth measure. With four reactions and a molecule of 12 to 14 heavy atoms, two thirds of circles have one thing that acts. The three switches moved it from 14.4 to 17.9. Counted by whole lines instead of circles the page looks different (above: 9 of 55 lines within a fifth of the best, order decisive on 78 pages in 100), so the choice in tier one is the order of the line, not what goes in a circle. Breaking a row on purpose was not run (`simBreak` cannot play the bare game).

### A coin sink, measured (added later the same day)

Measured, awaiting review. Coins had nothing in a round to be spent on. One sink was built behind `RULE.sink` (off): while a page is being lined up, coins buy one more use of a reaction of the hand, for this round only. The price is 1, then 2, then 3 within a round (`SINK.price`) and starts again next round. `P.useCost(g)`, `P.canBuyUse(g, run, id)`, `P.buyUse(g, run, id)`. Nothing is locked without coins.

The players (`buyUses` in `tools_sim.js`): the median player and the planner find their best line with one more use of each reaction they hold one or none of, and buy when that line sets off 0.8 of a step more for each coin of the price (the rate used for the pair of molecules) or makes a quarter of the number to beat more for each coin. The greedy player buys a reaction it has run out of when its line then makes more. The novice buys, half the time, one use of a reaction of the hand that has run out and still fits the molecule.

Tier one, three bare rounds, 200 runs a player, the same seeds with the sink off and on (`sinkJob` in `tools_sinkjob.js`):

| Player | Price | Uses bought in rounds 1, 2, 3 | Rounds with a use bought, in 100 | Coins held after rounds 1, 2, 3 | Round total over the same round with the sink off | Pass | Wins all three |
|---|---|---|---|---|---|---|---|
| median | off | | | 1.7, 3.4, 5.3 | | 100, 99, 97 | 96.0% |
| median | 1, 2, 3 | 0, 0.01, 0.07 | 0, 1, 7 | 1.7, 3.4, 5.2 | 1.000, 1.001, 1.019 | 100, 99, 97 | 96.0% |
| median | 1, 1, 2 | 0, 0.01, 0.10 | 0, 1, 7 | 1.7, 3.4, 5.2 | 1.000, 1.001, 1.025 | 100, 99, 97 | 96.0% |
| median | 2, 3, 4 | 0, 0.01, 0.04 | 0, 1, 5 | 1.7, 3.4, 5.2 | 1.000, 1.001, 1.015 | 100, 99, 97 | 96.0% |
| greedy | off | | | 1.2, 1.5, 1.7 | | 99, 92, 90 | 82.0% |
| greedy | 1, 2, 3 | 0, 0, 0.04 | 0, 0, 5 | 1.2, 1.5, 1.7 | 1.000, 1.000, 1.011 | 99, 92, 90 | 82.0% |
| novice | off | | | 1.2, 1.9, 2.7 | | 85, 69, 64 | 38.5% |
| novice | 1, 2, 3 | 0.04, 0.07, 0.09 | 5, 8, 9 | 1.2, 1.8, 2.6 | 1.031, 1.037, 1.040 | 86, 71, 68 | 42.0% |
| novice | 2, 3, 4 | 0, 0.03, 0.05 | 0, 3, 5 | 1.2, 1.8, 2.5 | 1.000, 1.016, 1.017 | 85, 69, 64 | 38.5% |

Nine rounds, every supplier and the five pieces, the median player, 200 runs, the same seeds (`python docs/tools_sink.py`):

| Price | Uses bought a run | Most in one round | Coins held after rounds 3, 6, 9 | Coins at the end of a run | Rounds beaten | Round total over off, rounds 3 and 4 |
|---|---|---|---|---|---|---|
| off | 0 | | 9.5, 21.7, 31.4 | 27.1 | 7.67 | |
| 1, 2, 3 | 0.41 | 0.15 in round 3 (13 rounds in 100) | 9.2, 21.2, 30.9 | 26.8 | 7.71 | 1.053, 1.030 |
| 1, 1, 2 | 0.41 | 0.15 in round 3 | 9.2, 21.2, 30.9 | 26.9 | 7.74 | 1.061, 1.045 |
| 2, 3, 4 | 0.31 | 0.13 in round 3 | 9.1, 20.9, 30.6 | 26.5 | 7.72 | 1.046, 1.012 |

What it says:

- **This sink does not change the round.** A player who reads the page buys a use in 0 to 13 rounds in 100 and under half a use in a whole run. It ends a run with 27 coins either way. No price changes that: the price is not what holds the player back, the use is seldom wanted.
- The reason is the one the fifth measure found: three uses of a reaction do not bind for a player who reads. A reaction of the hand is empty on 0 to 4 pages in 100 for the median player in tier one. Round 3, the first assay, is where most uses are bought.
- Uses do bind for the novice (a reaction of the hand is empty on a third of its pages), and a novice that buys at random gains 3 to 4 in 100 on a round and wins tier one 42 times in 100 against 38.5. But the novice holds one or two coins, so it buys in under one round in ten. The move is within the noise of 200 runs: the numbers of tier one do not need fitting again for it.
- The pair of molecules was drawn again 0 times in 1,600 rounds. The reroll and the redraw of the pair are not starved, because almost nothing is spent.
- The price kept is 1, 2, 3. The switch is left off: the page does not draw it yet, and with it on the simulated players would do what a person cannot.
- **What would be a sink.** Coins have to buy something that binds. Read from these runs: (1) helpers bought with coins between rounds, priced from their measured worth, which is the owner's decision in `LOOP.md` and belongs to a layer above; (2) in the bare game, a fourth circle on one page, since players fill all three circles on nearly every page and rings pay by their count; (3) uses, only if a reaction had two a round and not three. None of these is built or measured.

### What is still wrong, found in this measure

- **A turn in tier one is not a choice by the measure in `PASS.md`**: a second option is worth taking on 18 turns in 100.
- **Nothing is dealt in tier one.** Four reactions, a hand of five: every page shows the same four, the next hand is the same four, the hand cannot be dealt again. The only chance is the pair of molecules and the assay.
- **The molecule never does more than three things by itself on a page** in tier one, and three or more on 20 pages in 100 for the median player.
- **Pages on which the best line makes nothing**: 29 in 100 for a player who takes the best line of every page.
- **The median player wins tier one 95 times in 100.** The margins are in the band that was asked for; the round is not in doubt for it.
- **Round one on unseen seeds is over the band** for the median player (5.2) and the molecules of round one are 4.1 times apart there.
- **Tier one is dealt from four reactions, not six.** Dehydrate joins in round four and grow in round five, which are tier two.
- **Rounds four to nine were not fitted** and their numbers now follow a different round three.
- The planner was taught the next hand; the median player was not.

## The measure of 2026-11-11, fourth: the bare game

**Out of date (see the sixth measure): rounds one to three were fitted again in the fifth measure, and the third reaction's double has since raised every round, so the pass rates of rounds four to nine below are no longer what the game gives (the median player now beats 7.4 bare rounds, not 6.1).**

Measured on the rules as committed with this section. Measured, awaiting review: nothing here says a section passes. This is layers 1 and 4 of `ORDER.md`: no helper, no creature. The section after this one is the game with pieces and is the "before" of the comparisons here.

### What the bare game is for the rig

| Thing | Setting | How |
|---|---|---|
| Helpers and creatures | none offered, none held | `RULE.bare`. Checked: no round of any player in these measures logs a piece |
| Choosing the molecule | on: two molecules, the harder pays a coin, the pair can be drawn again for coins | `RULE.choose` |
| Carbon dioxide from oxidize | off. The code turns it on for every run, but only so that a jar can fill, and there is no jar here | `rule: { co2: false }` |
| Suppliers | the first one only, as on a first run | `tier: 0`. The take-one page then offers extend, a stronger reagent or one more use. Every earlier measure had all six suppliers open |
| Coins, marks, the bank, the redraw | as they are | |

A measure is `simGo(tag, players, from, to, base, { all: true, tier: 0, rule: { bare: true, co2: false } })`.

Why the first supplier only: with all six open the pick before round one already decides the round. The median player made 10,600 to 13,600 in round one after taking a kind of cascade it could not use, 30,000 after taking add phenol or extend and 76,500 after taking chain on (400 runs, tag f1). That is layer 5, and it hid the bare game.

### The gap between the novice and the median player

Before anything was fitted. Totals with the molecule and assay factors divided out, every run, missed or not. "Spread" is the 90th run over the 10th.

| Round | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| Median player's total over the novice's, as the game stood (tag b1, all suppliers) | 2.9 | 5.5 | 11.7 | 13.1 | 14.6 | 13.1 | 24.1 | 12.9 | 12.2 |
| The same on the final rules (tag b3) | 3.4 | 3.9 | 5.4 | 6.1 | 17.6 | 17.7 | 17.8 | 11.3 | 13.2 |
| Spread of the novice's own total, final rules | 9 | 9 | 8 | 9 | 15 | 18 | 19 | 18 | 21 |
| Spread of the median player's own total, final rules | 8 | 9 | 7 | 9 | 16 | 11 | 8 | 9 | 6 |

**One number cannot serve both.** A margin is the median player's median total over the number. With the two players 3.4 times apart and each spread 8 to 9 times, the number that nine novices in ten pass in round one gives the median player a margin of 9.5. The number that gives the median player a margin of 4 passes 58 novices in 100 in round one, 51 in round two and 34 in round three (every novice run counted). At a margin of 2 it is 26, 22 and 10.

The targets for the median player alone also pull apart: with its total spread 8 times, a margin of 2.5 goes with a pass rate near 85 in 100, not 95.

### What was changed, and why

| Thing | Before | Now | Why |
|---|---|---|---|
| When dehydrate and grow join the deal | rounds two and three | rounds three and five (`RUNG.from`) | Each one multiplied what a reader makes and added nothing for a player who places at random. Round two with dehydrate and 14 heavy atoms had a gap of 5.5; without dehydrate and with 12.5 it is 3.3 (tags b1 and e1). The round grow joined, the median player's total tripled (20,100 to 79,100 from round four to five on the final rules) and the novice's did not move. Grow in round four put the gap at 14.1 there (tag b2); in round five it is 6.1 there |
| Heavy atoms a round asks for | 11.5, 14, 16.5, 19, 21.5, 24, 27, 31, 35 | 11.5, 12.5, 14, 16.5, 19.5, 23, 27, 31, 35 (`FEEDSIZE`) | A longer molecule is a longer chain for a reader and nothing for the novice |
| Molecule and assay factors | fitted with pieces held and all suppliers open | fitted again on 480 runs of the median player choosing at random (tag f3, `tools_factors.py`) | The molecules were 5.6 to 20 times apart in a round under the old factors |
| Par | 675, 958, 2,490, 6,480, 16,800, 43,600, 92,600, 130,000, 225,000 | 1,230, 2,790, 4,620, 4,960, 18,800, 55,300, 58,200, 61,300, 105,000 | below |

Nothing was changed in what a ring pays, in the rule for a ring that only closes again, or on the page. `BALANCE.md` was not changed.

**How Par was fitted** (`tools_par_bare.py`, on tag b3, once):

- Round one: where the worst of three misses is least. The novice's pass rate under nine in ten, in units of 12 points and counted double. The median player's margin over 4, in units of a factor of 1.5. The median player's pass rate off its target, in units of 12 points.
- Rounds two to five: the median player's median total, among its runs still alive, over 4. This is the top of the band that was asked for. The novice's targets in `BALANCE.md` (80, 55, 55, 40) cannot be met with it.
- Rounds six to nine, which no novice reaches: the median player's pass rate and margin against their targets. No round asks less than 1.05 times the one before (it was 1.15: with the first supplier only the median player makes no more in round eight than in round six).

Steps from round to round: 2.26, 1.66, 1.08, 3.80, 2.94, 1.05, 1.05, 1.71. The climb is not even. Round five is where grow joins. Round six is where the fit changes from a margin of 4 to the old targets.

### Pass rates

500 runs for each player, seeds 1 to 500, tag b3, read against the Par fitted on them. Unseen: 300 runs for each player, seeds 1,001 to 1,300, tag u3, played on the baked numbers.

| Round | novice | unseen | target | greedy | unseen | median | unseen | target | planner | unseen | target |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 81% (500) | 85% (300) | 90% | 98% (500) | 98% (300) | 100% (500) | 100% (300) | 98% | 100% (500) | 100% (300) | 99% |
| 2 | 49% (405) | 49% (256) | 80% | 84% (491) | 86% (295) | 95% (499) | 93% (300) | 95% | 96% (499) | 95% (300) | 99% |
| 3, assay | 37% (198) | 38% (125) | 55% | 81% (410) | 83% (253) | 100% (476) | 99% (278) | 85% | 99% (479) | 98% (284) | 97% |
| 4 | 23% (73) | 35% (48) | 55% | 74% (333) | 77% (211) | 96% (474) | 98% (276) | 92% | 98% (475) | 98% (277) | 98% |
| 5 | 6% (17) | 6% (17) | 40% | 48% (246) | 43% (162) | 92% (457) | 89% (270) | 88% | 88% (466) | 87% (272) | 95% |
| 6, assay | 0% (1) | 0% (1) | 20% | 11% (118) | 13% (69) | 68% (420) | 66% (239) | 70% | 67% (412) | 64% (236) | 90% |
| 7 | none reached | none reached | 15% | 15% (13) | 11% (9) | 73% (285) | 73% (158) | 78% | 75% (276) | 76% (152) | 90% |
| 8 | none reached | none reached | 10% | 50% (2) | 0% (1) | 70% (207) | 81% (116) | 70% | 78% (208) | 74% (116) | 85% |
| 9, assay | none reached | none reached | 5% | 0% (1) | none reached | 56% (144) | 48% (94) | 50% | 51% (162) | 56% (86) | 70% |

Rounds beaten, mean: novice 1.4 (unseen 1.5), greedy 3.2 (3.3), median 6.1 (5.9), planner 6.1 (5.9). Wins of all nine: 0, 0, 16.0% (15.0%), 16.4% (16.0%). With nothing but the six reactions and extend the planner has nothing to plan with and plays as the median player does.

Median margin over the number, median player: 7.12, 3.92, 4.00, 4.05, 4.08, 1.50, 1.54, 1.38, 1.04. Unseen: 6.68, 3.76, 3.93, 3.97, 3.29, 1.65, 1.73, 1.84, 1.00. They were 10.3, 19.0, 15.5, 8.7, 5.2, 3.2, 2.2, 1.5, 1.0 on the bare game as it stood (tag b1). The targets in `BALANCE.md` are 3, 2.5, 1.6, 2, 1.8, 1.4, 1.5, 1.3, 1.2.

**Tier one** (`LOOP.md`: a first run is rounds one to three). A run that beats all three: novice 15 in 100 (unseen 16), greedy 66 (70), median 95 (92), planner 95 (92). What other numbers for rounds one to three would give, on the same runs:

| Margins asked of the median player in rounds 1, 2, 3 | Par | Novice wins tier one | Novice passes round one | Greedy wins | Median wins |
|---|---|---|---|---|---|
| 9.5, 8, 6 | 911, 1,395, 3,058 | 42% | 89% | 93% | 98% |
| 7, 6, 6 | 1,236, 1,856, 3,072 | 32% | 81% | 89% | 97% |
| 7, 5, 5 | 1,236, 2,228, 3,687 | 23% | 81% | 80% | 96% |
| 7, 4, 4 (baked) | 1,230, 2,790, 4,620 | 15% | 81% | 66% | 95% |
| 4, 4, 4 | 2,163, 2,790, 4,570 | 11% | 58% | 60% | 90% |
| 4, 3, 3 | 2,163, 3,721, 5,975 | 6% | 58% | 40% | 84% |
| 3, 2.5, 2.5 | 2,885, 4,497, 6,574 | 3% | 46% | 30% | 70% |

### The gates of section 1, measured, awaiting review

| Gate | Seeds 1 to 500 | Unseen seeds | Met |
|---|---|---|---|
| 500 or more whole runs for each player, same seeds | 500 each | 300 each | yes |
| Median player within 12 points of the target in every round | off +2, 0, +15, +4, +4, -2, -5, 0, +6 | +2, -2, +14, +6, +1, -4, -5, +11, -2 | no: round three, an assay, is passed 99 to 100 times in 100 against 85 |
| From round 4 on, passing or the next mark still undecided before the last page in 40% of rounds | 70.9% of 1,987 rounds (the pass itself in 36.1%). Planner 71.5%, greedy 42.1%, novice 18.7% of 91 | 70.9% of 1,153 (36.6%) | yes |
| Median margin within 1.5 times of the target in every round | 2.4, 1.6, 2.5, 2.0, 2.3, 1.07, 1.03, 1.06, 1.15 times off | 2.2, 1.5, 2.5, 2.0, 1.8, 1.18, 1.15, 1.42, 1.2 | no in rounds one to five against the targets of `BALANCE.md`. Rounds two to five sit at 3.3 to 4.1, the top of the band of 2 to 4 that was asked for after the review. Round one is at 6.7 to 7.1 |
| No kind of round more than 2 times easier than another | the special kinds are no longer offered: every round is plain but the assays (confirmed: rounds 1, 2, 4, 5, 7, 8 log only plain). Assays, margin by kind: round three 3.7 to 4.5, round six 1.27 to 1.72, round nine 1.02 to 1.23. Widest apart 1.35 | 1.17, 1.68, 1.17 | yes |
| No molecule more than 3 times harder or easier than another in the same round | easiest over hardest, molecules with 8 plays or more: 4.5, 2.8, 3.6, 7.9, 3.8, 2.4, 1.4, 1.8, 1.3 | 3.3, 2.4, 2.6, 7.5, 4.0, 4.0, 2.1, 1.9, 1.7 | no: round four is 7.5 to 7.9, rounds one, three, five and six pass 3 on one set of seeds or the other |

Choosing the molecule, median player: a harder one was on offer in 2,160 pairs and taken in 30% of them, always for one coin (two coins were on offer and taken never). The pair was drawn again 0 times in 3,462. Coins held at the start of rounds one to nine: 0, 2.8, 5.7, 7.0, 6.9, 7.0, 6.9, 6.7, 6.3. The novice takes the harder one 47% of the time (at random).

### Steps of cascade on a page

Every page of every round, tag b3. With pieces (the section below) the median player had 6 or more on 24% of pages and 10 or more on 2.0%.

| Player | 1 or more | 3 or more | 6 or more | 10 or more | longest | mean |
|---|---|---|---|---|---|---|
| novice | 54.0% | 14.1% | 0.8% | 0 | 9 | 1.09 |
| greedy | 65.3% | 24.2% | 2.8% | 0.01% | 10 | 1.59 |
| median | 89.6% | 55.9% | 12.5% | 0 | 9 | 3.05 |
| planner | 81.3% | 43.6% | 9.5% | 0.04% | 10 | 2.51 |

By round the median player's pages run 2.2, 2.3, 2.6, 2.7, 3.0, 2.9, 3.3, 3.8 and 4.9 steps.

### Layer 1: the turn, measured again

80 runs for each player with every turn weighed (tag d3, `tools_round.py`). An option is taken as the rig takes it: at each circle of the line as it fires, each reagent of the hand that would act on the molecule as it then stands, and the bank where it can be placed. Its worth is what it adds at that circle.

| Measure | novice | greedy | median | planner | Gate |
|---|---|---|---|---|---|
| Turns | 5,710 | 5,535 | 5,524 | 5,581 | |
| Options a turn | 2.14 | 2.02 | 2.06 | 2.15 | |
| One option only | 30.7% | 35.2% | 35.9% | 32.5% | |
| Second option within 30% of the best | 20.5% | 19.3% | 18.1% | 19.3% | |
| or better two turns on | 16.5% | 14.4% | 17.2% | 18.4% | |
| Either | 37.0% | 33.7% | 35.3% | 37.8% | at least 50%: not met |
| Pages where the best ordered play adds over 20% more than the greedy one | 51.9% of 1,902 | 46.7% | 47.5% of 1,867 | 51.9% | |
| Circles where the bank could go on which it was right | 52.9% | 60.0% | 67.8% | 51.8% | |
| of those, the bank was the only move | 34.7% | 40.8% | 52.0% | 38.2% | |
| Redraws a round | 0.27 | 0.06 | 0.51 | 0.93 | |

- The second option was worth taking on 52.4% of the median player's turns in the first measure of the day and is 35.3% here. The bare hand is four to six reagents of which two act at a circle on average; a third of turns have one thing that acts.
- The best ordered play beat the greedy one by over 20% on 60 to 66% of pages before; it is 47.5% here.
- **The redraw.** Used in 39% of the median player's rounds. Same seeds with the redraw taken away (200 runs, tag r3): rounds beaten 6.52 without it against 6.25 with it, which is inside the noise of 200 runs. In the 598 rounds where both runs still held the same molecule and reagents the redraw was used in 42; there the round made 1.14 times what it made without (more in 45%, less in 36%). It is a verb for a bad deal that does not measurably help this player.
- **Breaking a row on purpose** was not run: the paired test (`simBreak`) builds its rounds from runs with pieces and takes no rules, so it does not play the bare game.

### What is still wrong, found in this measure

- **The novice and the reader are still 3.4 to 6 times apart in rounds one to four and 17 times from round five.** No number serves both. The baked one gives the median player 4 and lets 15 novices in 100 win tier one. The simulated novice places at random for ever; a person learns, so this is a floor.
- **Round one is still passed by 7 times** by the median player, because it is held where eight novices in ten pass.
- **Grow is the wall.** The round it joins the deal, a reader's total triples and a random player's does not move. Moving it later moved the wall from round four to round five; it did not take it down.
- **Round three, the first assay, is no test**: the median player passes it 99 times in 100.
- **Rounds six to nine do not climb in the bare game.** With the first supplier only the median player makes 83,000 to 107,000 in each of rounds six to nine. `LOOP.md` now fits rounds four to nine to players who hold helpers and creatures, so the numbers baked here for those rounds are a floor to be fitted again with them.
- **Molecules in a round are up to 7.9 times apart** (round four) after the factors.
- **The second option is worth taking on 35% of turns**, under the gate of half, and a third of turns have one thing that acts.
- **The redraw does not measurably help** and the pair of molecules is never drawn again: coins pile up to 7 and are not spent.
- **With all six suppliers open these numbers are far too low**: the first pick alone is worth 3 to 7 times. Not measured on the baked numbers.
- The players' easiest-pair reading (`easeOf`) costs most of a run once the pool passes ten reagents: a run of the greedy player with all suppliers open takes 10 seconds.

## The measure of 2026-11-11, third: new steps pay, forgiving first rounds, five pieces used on the molecule

**Out of date (see the sixth measure): the rules, the players' use of pieces and Par have all changed since; the same options now give 7.7 rounds beaten and 60 wins in 100.**

Measured on the rules as committed with this section. Measured, awaiting review: nothing here says a section passes. The section after this one is the "before" of every comparison here.

**This measure is smaller than the gate asks.** `PASS.md` asks for 500 runs a player. This one has 205 novice, 205 greedy, 268 median and 120 planner runs (tag g1, seeds from 1), and 150 novice and 200 median runs on unseen seeds (tag u1, seeds from 1,001). The pieces were rebuilt twice on the owner's direction during the work and there was not time for the full measure.

### What changed

| Rule | What it is | Switch |
|---|---|---|
| New steps pay | a step of a cascade is paid in full only when the page has run past the longest cascade of any earlier page of the round. A step that repeats pays a quarter | `RULE.fresh`, `CASC.old` |
| A zip travels | the OH the last step left goes before any other OH, and an OH takes the nearest C=O in reach, so a cascade runs along the chain from where it was set off | `rules.js` `lactolable` |
| The deal of rounds one to three | round one is dealt from four reagents (hydrate, oxidize, hydroborate, reduce). Dehydrate joins in round two and grow in round three | `RUNG.from` |
| Molecules of rounds one and two | 18 new small molecules. Most have an OH oxidize cannot take or an aldehyde end reduce turns into one, and a spare C=C that hydrate and hydroborate can work on without harm. 13 small ones that most lines could not set off were taken out | `FEED` |
| Pieces | five pieces used on the molecule (docs/PIECES.md): mirror, seed crystal, clamp, magnet, burner. A piece that changes the molecule sets the zip off at once. Carousel, dropper and timer are still offered. The other 52 are off | `RULE.five`, `FIVE` |
| The players | they use a piece at the start of a page, each once a round: the median player, the planner and the greedy player where the bare structure reads best, the novice at a place taken at random on half its pages | `tools_sim.js` `useTools` |
| The number | rounds one to three are what 90, 80 and 55 in 100 novices who reach the round make, and no round asks more than 2.6 times the one before | `tools_par.py` |

### How the players use the pieces, changed 2026-11-11 (after this measure)

The numbers in this section were made with players that used every piece on the first page by the bare structure. That is changed (`tools_sim.js`, `useTools`, `readTools`); the tables below have not been made again and the number to beat has not been fitted again. That is the next full measure.

| Player | How it uses a piece now |
|---|---|
| median | at the start of a page it reads the steps of the best line of its hand as the molecule stands, and after each unused piece at each place, and after each ordered pair of pieces. It uses one now only for a new step or more, else holds it; on the last page for anything. It plays the page both ways on a copy first and drops a use that makes the page worth less |
| planner | the same, and it also counts what the molecule the line leaves would zip by itself on the pages still to come |
| greedy | where the bare structure reads better than leaving the piece, and only then |
| novice | each piece on a page taken at random, at a place taken at random |

On 40 runs each, seeds 1 to 40, played on the baked numbers: the median player beat 7.65 rounds (it was 6.4) and passed 100, 100, 100, 100, 90, 97, 86, 87, 73 percent; six steps or more on 24.0 pages in 100 and ten or more on 1.95. The novice beat 2.30 rounds (95, 74, 71, 30, 0 percent). A median run takes about 2.2 times as long to play as before (about 430 ms a round against 200), most of it the page played both ways. Whole rounds with each piece are in `PIECES.md`.

### The gap between extending a chain and firing it again

One round on each of the 73 molecules as they then stood, the six starting reagents, the same deals, two players: one fires the line with the most steps on every page, the other on pages two and three fires the line with the most steps that is not longer than the chain already was (`gapRound` in the recording page).

| | Paid in full every page (before) | New steps only (now) |
|---|---|---|
| Rounds where the chain could be made longer | 48 of 73 | 48 of 73 |
| The extender's total over the refirer's, geometric mean | 2.67 | 2.59 |
| The same, median | 2.92 | 2.64 |
| A round where the chain was only fired again: total now over total before | | 0.55 |
| The extender's own total now over before | | 0.64 |

The rule did what it was asked: a round that only fires the standing chain again now makes 55 in 100 of what it made. It did not widen the gap between the two players, which stayed near 2.6 times, because the extender's own repeats (its page three on a chain it lengthened on page two) are paid a quarter as well.

### Why the novice died in round two, and what was done

Read with the screen (`scrNov` in the recording page: three reagents a page taken at random from those of the hand that act on the molecule as it stands). On the molecules of rounds one to three, with all six starting reagents, 6 to 63 lines of three in 100 set any zip off, and on 11 of the small molecules a novice had no cascade on any page in half its rounds or more. Three causes, all structural:

1. A wasted circle sets nothing off, and a molecule dealt already able to zip often had nothing a harmless reagent could act on.
2. Oxidize takes the OH a chain starts from when it is fired first, and so does dehydrate.
3. Grow turns every C=O into an OH, which ends the chain.

With the four reagents of round one and the new molecules, 88 to 98 lines of three in 100 set a zip off on the new chain molecules, and a novice round with no cascade on any page falls to 0 to 4 in 100. With dehydrate added (round two) it is 78 to 94.

### Steps of cascade on a page

Every page of every round, tag g1.

| Player | | 1 or more | 3 or more | 6 or more | 10 or more | longest | mean |
|---|---|---|---|---|---|---|---|
| novice | before | 45.7% | 12.8% | 1.6% | 0.03% | 10 | 0.97 |
| novice | now | 60.3% | 17.1% | 2.5% | 0.00% | 9 | 1.32 |
| greedy | before | 55.0% | 10.5% | 1.2% | 0 | 9 | 1.01 |
| greedy | now | 71.9% | 32.5% | 10.5% | 0.36% | 12 | 2.16 |
| median | before | 92.0% | 56.0% | 14.0% | 0.26% | 11 | 3.13 |
| median | now | 90.5% | 61.2% | 24.0% | 2.00% | 12 | 3.68 |
| planner | before | 82.6% | 46.1% | 12.0% | 0.25% | 11 | 2.64 |
| planner | now | 87.5% | 57.7% | 23.7% | 1.88% | 12 | 3.53 |

Ten steps or more: asked for about 1 page in 100 for a good player. It is 2.0 for the median player and 1.9 for the planner (2.3 for the median player on unseen seeds). That is twice what was asked. It comes from the pieces: before them it was 0.26.

### Pass rates

Par: 675, 958, 2,490, 6,480, 16,800, 43,600, 92,600, 130,000, 225,000 (334 times over nine rounds). Read against the Par fitted on the same runs (`tools_reread.py`).

| Round | novice | target | greedy | median | target | planner | target |
|---|---|---|---|---|---|---|---|
| 1 | 90% (205) | 90% | 98% (205) | 96% (268) | 98% | 96% (120) | 99% |
| 2 | 79% (184) | 80% | 82% (200) | 97% (256) | 95% | 99% (115) | 99% |
| 3, assay | 62% (146) | 55% | 99% (165) | 100% (248) | 85% | 100% (114) | 97% |
| 4 | 34% (91) | 55% | 87% (164) | 98% (248) | 92% | 99% (114) | 98% |
| 5 | 29% (31) | 40% | 67% (142) | 95% (244) | 88% | 96% (113) | 95% |
| 6, assay | 11% (9) | 20% | 77% (95) | 87% (231) | 70% | 92% (108) | 90% |
| 7 | 0% (1) | 15% | 56% (73) | 73% (201) | 78% | 77% (99) | 90% |
| 8 | none reached | 10% | 61% (41) | 64% (146) | 70% | 68% (76) | 85% |
| 9, assay | none reached | 5% | 48% (25) | 55% (93) | 50% | 56% (52) | 70% |

Rounds beaten, mean: novice 2.3 (it was 1.5), greedy 4.5 (2.5), median 6.4 (5.7), planner 6.8 (5.7). Wins: 0, 5.9%, 19.0%, 24.2%.

Median margin over the number, median player: 8.8, 22.6, 24.6, 12.1, 6.0, 3.1, 1.82, 1.62, 1.09 against targets 3, 2.5, 1.6, 2, 1.8, 1.4, 1.5, 1.3, 1.2. Round one came down from 58.5 to 8.8. Rounds two to four did not: they are set by the novice and by the cap of 2.6 times a round, and the median player is 12 to 25 times over them.

**Unseen seeds, played on the baked numbers** (tag u1, seeds 1,001 on): novice 91, 82, 65, 40, 14 percent (150 runs); median player 94, 98, 100, 99, 95, 91, 71, 81, 64 (200 runs), margins 10.5, 21.9, 16.6, 14.0, 6.3, 3.7, 1.76, 1.71, 1.29.

Molecule factors were fitted again on 480 runs of the median player choosing rounds at random (tag fd): the molecules are 17 times apart before the factor (they were 12,000 times apart in a first try, in which a mirror could fill the molecule to the size limit and leave nothing a reagent could add to; the mirror now has to leave six heavy atoms of room).

### What is still wrong, found in this measure

- **The measure is short of 500 runs a player**, and the unseen check has no planner or greedy runs.
- **Rounds two to four are far too easy for a player who reads the page** (12 to 25 times over). The novice sets them. The gap between the novice and the median player is the problem, not the number.
- **The novice falls off at round four** (34% against 55%) and reaches round six in 9 runs of 205.
- **Ten steps or more is twice what was asked.**
- **The simulated players used the pieces badly** in this measure: on the first page, by the bare structure. This has since been changed (see "How the players use the pieces" above); the number to beat here is still the one fitted to players who wasted them.
- **Round one is thin on pages two and three.** With four reagents and one spare C=C, a molecule often has nothing left to set it off after page one: the median player's pages of round one average 1.7 steps.
- **The turn measures were not run again** (second option worth taking, the bank, the best ordered play).
- **Kinds of round are 4.1 times apart** before their factor (short rounds make half a plain one, broad ones twice).

## The measure of 2026-11-11, second: cascades on every page

Measured on the rules as committed with this section. Measured, awaiting review: nothing here says a section passes. The section after this one is the game as it stood this morning and is the "before" of every comparison here. What was built and why is in `CASCADES.md` ("What was built on 2026-11-11").

### What changed

| Rule | What it is | Switch |
|---|---|---|
| A zip opens again | every ring a zip closed opens when a page turns, so the chain is set off again on the next page | `RULE.reopen` |
| What sets a cascade off | only a reagent that acted. A wasted circle and the bank set nothing off | |
| The combo | step n of a page adds 50 places counted n times and n times 0.1 to extra | `CASC` |
| Molecules | 73, every one built to zip, dealt by size: 11.5 heavy atoms asked in round one, 35 in round nine. Size limit 56 | `FEED`, `FEEDSIZE`, `RULE.atoms` |
| Starting reagents | hydrate, oxidize, grow, hydroborate (C=C only), dehydrate, reduce (a C=O at the end of a chain only) | `RUNG.start`, `rules.js MODE.zip` |
| Sizes | extend (corner chemist), chain on and add phenol (trade supplier), bridge (research supplier) | `SUPPLY` |
| Kinds | zip from the start; snap (a Diels-Alder) with the research supplier; weld (leaves an OH) with the instrument maker | `SELF`, `RULE.weld` |
| The players | the median player and the planner try every ordered line of the hand, may break a row for a cascade, count what the chain left standing will do on later pages, and deal again when their best line sets off no cascade. Before, the median player kept the row whenever it could, and so could not line up a cascade | `tools_sim.js` |
| The number | round one is what 88 in 100 novice first rounds reach; no round asks more than 2.6 times the one before | `tools_par.py` |

### Steps of cascade on a page

Every page of every round of 500 runs for each player (492 for the planner), tag d6, seeds 1 to 500, all six suppliers open.

| Player | | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 1 or more | 3 or more | 6 or more | 10 or more | longest | mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| novice | before | 88.8% | 10.0% | 0.7% | 0.1% | 0.4% | | 0.0% | | | | | | 11.2% | 0.4% | 0.0% | 0 | 6 | |
| novice | now | 54.3% | 19.1% | 13.9% | 6.4% | 3.3% | 1.4% | 0.9% | 0.5% | 0.2% | 0.1% | 0.0% | | 45.7% | 12.8% | 1.6% | 0.03% | 10 | 0.97 |
| greedy | before | 79.1% | 18.1% | 2.4% | 0.2% | 0.2% | | | | | | | | 20.9% | 0.4% | 0.0% | 0 | 4 | |
| greedy | now | 45.0% | 29.1% | 15.4% | 5.8% | 2.2% | 1.2% | 0.7% | 0.4% | 0.1% | 0.0% | | | 55.0% | 10.5% | 1.2% | 0 | 9 | 1.01 |
| median | before | 60.8% | 24.5% | 11.8% | 1.1% | 1.8% | 0.0% | | | | | | | 39.2% | 2.9% | 0.0% | 0 | 5 | |
| median | now | 8.0% | 13.4% | 22.6% | 18.2% | 14.9% | 9.0% | 7.0% | 3.8% | 2.2% | 0.7% | 0.2% | 0.0% | 92.0% | 56.0% | 14.0% | 0.26% | 11 | 3.13 |
| planner | before | 63.3% | 21.4% | 10.3% | 2.9% | 2.0% | 0.1% | | | | | | | 36.7% | 5.0% | 0.0% | 0 | 5 | |
| planner | now | 17.4% | 20.5% | 15.9% | 15.0% | 11.9% | 7.3% | 5.6% | 3.3% | 2.1% | 0.7% | 0.2% | 0.0% | 82.6% | 46.1% | 12.0% | 0.25% | 11 | 2.64 |

Against the targets for the median player (1 or more on 75%, 3 or more on 35%, 6 or more on 8%, 10 or more on about 1%): 92, 56, 14 and 0.26. The first three are over. Ten or more is a quarter of what was asked: 33 pages of 12,628.

The planner has fewer cascades than the median player. Its search still weighs what an open row will multiply later, and it gives up cascades for that.

### Heavy atoms by round

Median over the median player's 500 runs: at the start of the round, and at its end.

| Round | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| Start | 14 | 14 | 15 | 18 | 22 | 24 | 27 | 31 | 33 |
| End | 25 | 26 | 29 | 32 | 38 | 42 | 44 | 46 | 49 |
| Steps a page, mean | 2.2 | 2.2 | 2.4 | 2.6 | 3.0 | 3.4 | 3.8 | 3.9 | 4.7 |

The growth inside a round is mostly grow (three carbons on every C=O). The largest molecule in the depth measure below had 56 heavy atoms, the limit, and 142 atoms with its hydrogens.

### From a deal of five, is there a line of three that sets up three steps

The screen (`path.js screen`), page one, the six starting reagents, zip only, every deal of five of the six, every molecule counted once.

| Heavy atoms as dealt | Molecules | Deals with 1 step or more | 2 or more | 3 or more | 6 or more |
|---|---|---|---|---|---|
| 11 to 16 | 21 | 95% | 86% | 20% | 0 |
| 17 to 24 | 21 | 100% | 88% | 57% | 0 |
| 25 to 37 | 31 | 97% | 91% | 80% | 24% |

Over all molecules 56% of deals have a line of three steps or more. On the small molecules of the first rounds it is one deal in five: they carry two C=O. 23 of the 73 zip nothing as dealt and need setting up; every one of the 73 can be made to zip.

### Pass rates

The measure d6 read against the Par fitted on it (`tools_reread.py`). It is not a replay on the baked numbers and no unseen seeds were played; coins make a reading against another Par slightly inexact.

Par: 2,360, 6,140, 16,000, 41,400, 75,400, 129,000, 221,000, 436,000, 739,000 (313 times over nine rounds).

| Round | novice | target | greedy | median | target | planner | target |
|---|---|---|---|---|---|---|---|
| 1 | 88% (500) | 90% | 100% (500) | 100% (500) | 98% | 100% (492) | 99% |
| 2 | 52% (438) | 80% | 68% (500) | 100% (500) | 95% | 100% (492) | 99% |
| 3, assay | 28% (229) | 55% | 82% (338) | 99% (499) | 85% | 98% (491) | 97% |
| 4 | 12% (64) | 55% | 29% (276) | 88% (493) | 92% | 93% (480) | 98% |
| 5 | 12% (8) | 40% | 57% (79) | 81% (436) | 88% | 78% (445) | 95% |
| 6, assay | 0% (1) | 20% | 38% (45) | 66% (351) | 70% | 69% (348) | 90% |
| 7 | none reached | 15% | 59% (17) | 70% (233) | 78% | 68% (240) | 90% |
| 8 | none reached | 10% | 30% (10) | 66% (164) | 70% | 61% (162) | 85% |
| 9, assay | none reached | 5% | 0% (3) | 53% (109) | 50% | 40% (99) | 70% |

| Player | Runs | Rounds beaten at 10, 25, 50, 75, 90 percent | Mean | Target median | Wins | Last page changed the level reached, round 4 on |
|---|---|---|---|---|---|---|
| novice | 500 | 0, 1, 1, 2, 3 | 1.5 | 3 | 0.0% | 11% of 73 |
| greedy | 500 | 1, 1, 3, 3, 4 | 2.5 | | 0.0% | 28% of 430 |
| median | 500 | 3, 4, 5, 7, 9 | 5.7 | 6 | 11.6% | 70% of 1,786 |
| planner | 492 | 4, 4, 5, 7, 8 | 5.7 | 9 | 8.1% | 67% of 1,774 |

Median margin over the number, median player: 58.5, 24.5, 7.9, 3.4, 2.3, 1.55, 1.82, 1.54, 1.09 against targets 3, 2.5, 1.6, 2, 1.8, 1.4, 1.5, 1.3, 1.2. Novice: 2.97, 1.08, 0.52, 0.25.

**The novice's round one is fixed and its round two is not.** The 12th percentile of the novice's first round is 2,360 in units of Par; the median player's median first round is 139,000. They are 59 times apart, where they were nine times apart this morning: a player who lines up a cascade and keeps it now makes far more than one who does not. A number the novice passes 88 times in 100 is passed 59 times over by the median player. With the climb held to 2.6 times a round the median player is over its margin in rounds one to four (worst miss on the pass rate 13.6 points, round three) and on target from round five (misses of -7.3, -3.3, -6.2, -4.5, +2.7). The novice passes round two 52 times in 100 against 80.

Molecules in the same round, median player, easiest over hardest with 8 plays or more: 2.7, 3.6, 3.2, 3.5, 6.0, 4.3, 2.8, 18.9, 13.6. The factors were fitted before a wasted circle stopped setting a cascade off and were not fitted again.

### Ordering and choice

- **The best ordered play of a page against the greedy one**: over 20% more on 60.0% of 922 pages, over 5% more on 66.1% (median player, 40 runs, seeds 1,001 to 1,040, `{ dec: true, deep: true }`). It was 65.6% before the cascade was narrowed to zip.
- Second option within 30% of the best, or better two turns on: 44.1% of 2,978 turns (it was 52.4%). The gate asks for half.
- The bank is the right move on 47.2% of the 1,066 circles where it could be placed (it was 27.8%). It is taken 1.8 times a round.
- Rounds beaten: novice 1.5, greedy 2.5, median 5.7, planner 5.7.

### What each unlock adds

Two instruments. Neither is the final rules to the letter: both were run before a wasted circle stopped setting a cascade off.

Whole runs, median player, the thing named held from round one and the other five never offered, 150 runs each on seeds 1 to 150 (first table) and 120 runs on seeds 1 to 120 after bridge and snap were rebuilt (second table):

| Held | 1 or more | 3 or more | 6 or more | 10 or more | longest | mean steps a page |
|---|---|---|---|---|---|---|
| nothing | 83.6% | 52.3% | 7.0% | 0 | 7 | 2.70 |
| extend | 91.2% | 61.5% | 8.6% | 0.03% | 10 | 3.04 |
| chain on, three uses | 91.8% | 67.2% | 21.5% | 0.85% | 11 | 3.65 |
| add phenol | 92.1% | 61.4% | 8.7% | 0 | 8 | 3.09 |
| bridge as ring-closing metathesis (not kept) | 83.3% | 44.9% | 5.8% | 0 | 7 | 2.43 |
| snap as a four-ring (not kept), 122 runs | 73.3% | 32.9% | 4.5% | 0 | 7 | 1.96 |
| weld leaving an OH, 94 runs | 89.7% | 49.6% | 4.7% | 0 | 8 | 2.63 |
| weld leaving a C=C, 103 runs | 88.0% | 48.8% | 5.3% | 0 | 8 | 2.61 |

| Held | 1 or more | 3 or more | 6 or more | 10 or more | longest | mean |
|---|---|---|---|---|---|---|
| nothing | 82.7% | 51.3% | 7.9% | 0 | 8 | 2.64 |
| bridge as the coupling of two ends | 85.0% | 49.1% | 6.8% | 0 | 7 | 2.54 |
| snap as a Diels-Alder | 81.1% | 39.5% | 4.3% | 0 | 7 | 2.19 |
| chain on, two uses | 90.8% | 65.6% | 20.0% | 0.46% | 11 | 3.48 |

The median player of those runs did not yet count what a standing chain is worth later, and it spent C=C and OH on a snap or a bridge for one step now. So the second table reads bridge and snap low.

The screen (`screenRound`: a player who fires the line with the most steps, all 73 molecules weighted as rounds deal them, three rounds each):

| Pool | 1 or more | 3 or more | 6 or more | 10 or more | mean |
|---|---|---|---|---|---|
| the six starting reagents, zip | 95.2% | 39.4% | 5.6% | 0 | 2.43 |
| and extend | 93.4% | 59.1% | 7.2% | 0.1% | 3.00 |
| and chain on | 96.1% | 60.3% | 18.8% | 1.1% | 3.42 |
| and add phenol | 96.8% | 57.3% | 11.8% | 0 | 3.19 |
| and bridge | 96.8% | 44.6% | 7.2% | 0 | 2.68 |
| and snap | 93.3% | 41.9% | 5.3% | 0 | 2.43 |
| and weld | 93.8% | 36.9% | 4.0% | 0 | 2.35 |
| everything | 96.6% | 72.3% | 26.3% | 1.5% | 4.02 |

On the final rules the same screen gives 58.2%, 23.4%, 3.9% and 0 for the six starting reagents (mean 1.46) and 88.2%, 67.9%, 24.7% and 1.1% with everything (mean 3.80). The fall with the starting six is the screen's player, not the game: it fires whatever gives most steps now, and once a wasted circle sets nothing off, the reagent it fires to set the chain off again is often one that wrecks it. The median player of the runs, which looks ahead, has a cascade on 92% of pages.

In short: chain on adds about one step a page and makes nearly all the pages of ten; add phenol and extend add about half a step; bridge adds a quarter of a step in the screen and nothing in runs; snap adds four steps on the one chain built for it and nothing on average; weld adds no length and starts chains that have no OH.

### How the screen was checked against the game

16 molecules across the five families, 11 to 35 heavy atoms: the best line of three and the share of all 216 lines with 1 and with 3 steps were the same from `screen` and from the game's own round (`cascLines` in the recording page). 0.4 seconds against 17.

### What is still wrong, found in this measure

- **Monsters are rare.** Ten steps or more come on 0.26% of the median player's pages, not 1%. They need chain on held, and the players seldom pick it.
- **Three steps is ordinary, not good.** 56% of the median player's pages have three or more against a target of 35%.
- **The novice dies in round two** (52% against 80%) and the median player is 59 times over the number in round one.
- **The planner is worse than the median player** at cascades and under its targets from round five (wins 8.1% against 40%).
- **Weld and snap do not make cascades longer.**
- **Factors are one rule behind**, and molecules in rounds eight and nine are 14 to 19 times apart.
- **Second option worth taking fell to 44%**, under the gate of half.
- **The worth tables the players pick by are guesses** for every new reagent and stale for the rest.
- **Nothing on equipment was retuned.** No piece was switched off: every one still fires. Pieces that pay "each reaction" (stir plate, philosopher's stone, goat, rubber duck, log book) and the cage family's rule now fire on every step of a cascade and were not measured.
- **A measure takes 25 minutes**: the median player tries all 125 lines of a hand.

## The measure of 2026-11-11: the page lined up and fired, the zip, coins and marks

Measured on the rules as committed with this section. Measured, awaiting review: nothing here says a section passes. Everything below this section describes the game before these rules and is kept as the "before".

### What changed

| Rule | What it is | Switch in `RULE` |
|---|---|---|
| Marks | three marks above the number to beat, at 2, 4 and 8 times it. The last page of a round multiplied its total by 1.9 at the median, so a step of 2 puts the next mark within one page | `tiers` |
| Coins | a mark reached pays 1 at the end of a beaten round, after interest on coins held (1 for every 3, at most 2). On the take-one page: deal the three again for 1, 2, then 3; leave all three for +1; bin a held piece for 2 | `coins` |
| The page | reagents are placed in the page's circles in order and the page is then fired. One that finds nothing to act on at its turn is wasted and still spends its use. No number is shown before firing. The redraw is only before firing | `queue` |
| The bank | a token placed in a circle like a reagent. Pays 2 times what the row holds, on a row of 3 or more | `bank`, `bankMin` |
| The cascade | after each queued reagent the molecule reacts with itself until nothing is left to react. Step n counts its places n times and multiplies extra by 1 + 0.2 n. There is no free chain of reagents, no fork and no chain limit | `cascade` ('each', or 'end' for after the whole line) |
| Zip | the only cascade a run starts with (`docs/CASCADES.md`, kind 1; the card `lactol` in `rules.js`): an OH whose carbon is 3 or 4 carbons from the carbon of a C=O closes a ring of 5 or 6, and the C=O becomes C-OH, which can zip onto the next C=O | `SELF` in `path.js` |
| Snap | two C=C a few carbons apart close a ring between them. Turns up on the take-one page once the research supplier is open | `SELF` |
| The number | Par for the round, times a factor for the kind of round (`KINDF`, `ASSAYF` by act), times a factor for the molecule measured inside runs (`MOLF`, taken whole), times any stake | generated block |

Off while the cascade is on: the twist, the extinguisher (not offered), and the reagents Close, Aromatize and Snap (not offered: Snap happens by itself).

### How the tables were made

1. `simGo('ci', ['median'], a, b, base, { all: true, pickRound: 'random' })` on seeds 1 to 800, then `python docs/tools_factors.py ci 650000 657999 fa.json`: least squares on log(total / (Par times stake)) = round + kind + molecule. Kinds were 2.7 times apart in what they make and molecules 27 times.
2. `python docs/tools_bake.py - fa.json`, then the standard measure without `dec`, then `python docs/tools_par.py d3 660000 667999 par.json`: round by round, Par is set where the worse of two misses is least, the pass rate in units of 12 points and the margin in units of 1.5 times. No round asks less than 1.15 times the one before. `python docs/tools_bake.py par.json -`.
3. Coins make a run depend on its margins (marks pay coins, coins buy deals), so a measure can no longer be read exactly against another Par. The final measure below was played on the baked numbers.

Par: 2,880, 4,940, 8,730, 10,100, 14,500, 32,600, 52,100, 121,000, 439,000 (153 times over nine rounds).

### Pass rates, 500 runs for each player, seeds 1 to 500 (tag h4)

| Round | novice | target | greedy | median | target | planner | target |
|---|---|---|---|---|---|---|---|
| 1 | 21% (500) | 90% | 71% (500) | 92% (500) | 98% | 97% (500) | 99% |
| 2 | 11% (105) | 80% | 48% (356) | 87% (462) | 95% | 95% (487) | 99% |
| 3, assay | 8% (12) | 55% | 52% (172) | 78% (402) | 85% | 90% (464) | 97% |
| 4 | 0% (1) | 55% | 58% (90) | 84% (315) | 92% | 92% (416) | 98% |
| 5 | none reached | 40% | 62% (52) | 79% (264) | 88% | 94% (382) | 95% |
| 6, assay | none reached | 20% | 59% (32) | 68% (208) | 70% | 80% (358) | 90% |
| 7 | none reached | 15% | 32% (19) | 74% (141) | 78% | 76% (286) | 90% |
| 8 | none reached | 10% | 0% (6) | 64% (104) | 70% | 65% (217) | 85% |
| 9, assay | none reached | 5% | none reached | 39% (67) | 50% | 36% (140) | 70% |

Rounds beaten, mean: novice 0.2, greedy 1.5, median 4.0, planner 5.6. Wins: 0, 0, 5.2%, 10.2%.

Median margin over the number: median player 4.15, 2.99, 2.16, 2.96, 2.45, 1.77, 2.09, 1.48, 0.81 against targets 3, 2.5, 1.6, 2, 1.8, 1.4, 1.5, 1.3, 1.2. Planner 7.20, 5.49, 3.86, 5.05, 4.50, 2.77, 2.45, 1.73, 0.71.

**Unseen seeds** (median player, seeds 1,001 to 1,500, which no fit has read): pass 91, 84, 78, 85, 80, 72, 69, 61, 50 percent; margin 4.05, 2.87, 2.19, 3.35, 3.02, 1.82, 1.74, 1.39, 1.03.

### The gates of section 1, measured, awaiting review

| Gate | Seeds 1 to 500 | Unseen seeds | Met |
|---|---|---|---|
| 500 or more whole runs for each player, same seeds | 500 each | 500 more, median player | yes |
| Median player within 12 points of the target in every round | misses -5.6, -8.0, -6.6, -8.2, -9.2, -2.2, -4.2, -5.6, -11.2; worst 11.2 (round 9) | worst 10.7 (round 2) | yes, with little room |
| From round 4 on, passing or the next mark still undecided before the last page in 40% of rounds | 50.0% of 1,099 rounds (the pass itself in 27.0%). Planner 58.6%, greedy 40.2% | 52.0% | yes |
| Median margin within 1.5 times of the target in every round | 1.38, 1.20, 1.35, 1.48, 1.36, 1.27, 1.39, 1.14, 1.50 (round 9 is under its target: 0.81 against 1.2) | 1.35, 1.15, 1.37, 1.68, 1.68, 1.30, 1.16, 1.07, 1.17: rounds 4 and 5 are over | on the fitted seeds yes, at the limit in rounds 4 and 9; on unseen seeds no in rounds 4 and 5 |
| No kind of round more than 2 times easier than another | each kind's margin over the median margin of its round: scarce 0.98, loose 1.01, back 1.12, short 0.98, broad 0.97, each 1.05. Widest apart 1.16 | 1.22 | yes |
| No molecule more than 3 times harder or easier than another in the same round | easiest over hardest by round, molecules with 16 plays or more among runs still alive: 2.3, 2.3, 3.2, 2.9, 2.4 (rounds 1 to 5; later rounds have too few plays). With 8 plays or more: 2.3, 4.5, 3.3, 5.1, 7.5, 8.5, 5.0, 4.2 | not computed | no. With 20 plays a molecule, chance alone gives about 2.7 |

"Undecided" is counted as: the round ended at another level (missed, passed, mark 1, 2 or 3) than it stood at before its last page.

Assays in round nine, every run counted: scarce 20% of 115, loose 14% of 135, short 15% of 132, each 14% of 118. They were 91, 72, 26 and 4 percent apart before the factors.

Plain and carried rounds are almost never chosen by the median player and the planner (they choose what is easiest for what it pays, and the factors make every kind as easy), so those two kinds are not in the comparison.

### The gates of section 2, measured, awaiting review

| Measure | novice | greedy | median | planner |
|---|---|---|---|---|
| Turns (circles of a page as they are fired) | 33,668 | 34,365 | 32,724 | 37,311 |
| Second option within 30% of the best, or better two turns on: the gate asks for half | 45.2% | 46.9% | 52.4% | 56.0% |
| Circles where the bank could be placed on which it was the right move | 22.1% | 24.8% | 27.8% | 17.6% |
| Reactions wasted a round | 4.25 | 0 | 0 | 0 |

- The turn measure is the old one, taken at each circle as the page fires: the options are the reagents that would act there and the bank; the gain of each is what the page's own preview used to print.
- "Right" for the bank is the planner's own reckoning: the page searched three deep with the bank first, against each reaction first, counting what an open row multiplies later.
- **Depth of a page**: on 65.6% of 784 pages (median player, 40 runs, measured before the cascade was narrowed to zip and snap) the best ordered play of the page added over 20% more than the greedy one-at-a-time play. Under the free chain it was 64.0% of 1,165 pages. Not measured again on the final rules.
- **Gap between players**, rounds beaten: novice 0.2, greedy 1.5, median 4.0, planner 5.6.
- **A verb for a bad deal**: the redraw, before firing, for one use.
- **The paired test of the bank** (the planner against the same planner with no bank, on builds from all four players' runs and from first runs, 5 plays each) was run only under the free chain: the planner with the bank had the higher median on 88.6% of 387 builds, median ratio 1.62. So the bank at 2 is right on about a quarter of the circles it could go in and still worth having on nine builds in ten. Not run again with the cascade.

### Cascades

Steps of cascade on a page, share of pages (all 500 runs of each player, every round):

| Player | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 3 or more | 6 or more | longest |
|---|---|---|---|---|---|---|---|---|---|---|
| novice | 88.8% | 10.0% | 0.7% | 0.1% | 0.4% | | 0.0% | 0.4% | 0.0% | 6 |
| greedy | 79.1% | 18.1% | 2.4% | 0.2% | 0.2% | | | 0.4% | 0.0% | 4 |
| median | 60.8% | 24.5% | 11.8% | 1.1% | 1.8% | 0.0% | | 2.9% | 0.0% | 5 |
| planner | 63.3% | 21.4% | 10.3% | 2.9% | 2.0% | 0.1% | | 5.0% | 0.0% | 5 |

With seven reactions a molecule had with itself (an enol shift, a water loss beside a C=O, two OH closing a ring, an aldol, the zip, an OH and a Cl closing a ring, a ring to an arene, and snap), measured the same way before the set was narrowed: the planner had 3 or more on 8.0% of pages, 6 or more on 0.6%, longest 9. Those cards are still in `rules.js` and are not in `SELF`.

**Which starting molecules can zip.** Every line of up to three of the six starting reagents was tried on each molecule, first page, zip only. Zip steps at best: `CC(O)CCC(=O)CCC(=O)CCC(=O)CCC(=O)C` 4 with any first move; `C=CCCC(=O)CCC(=O)CCC(=O)CCC(=O)C` 4 after hydrate (both added for the zip); `CC(=O)CCC(O)CC=C` 2; `C=CCC(=O)CCC(=O)CC=C` 2; the open sugar `OCC(O)C(O)C(O)C(O)C=O` 2; one step on `CC(O)CCC=C`, `C=CCC(O)CC(O)CC=C`, `CC(O)CC(=O)CCC(Cl)CCC=C`, `O=C1CCC(CC=C)CC1`, `CC(=O)CCC(O)C1=CC=CC=C1`, `OCC1OC(O)C(O)C(O)C1O`, `O=C1CCC(O)CC1C=C`, `CC(O)CC(=O)C1=CC=CC=C1`, `OCC1OC(O)CC1O`. None at all on eleven: `C=CCC(O)CC=C`, `C=CCC(O)C1=CC=CC=C1`, `C=CC1CCC(O)CC1`, the two cubanes, adamantanol, the two bridged rings, `OC1CCC(O)CC1`, `OC(C=C)C1=CC=CC=C1`, glycerol. Those eleven (`NOZIP` in `path.js`) are not dealt in round one.

### Coins

Median player: 1.12 coins a round from marks and 0.53 from interest; deals the three again 0.54 times a round, skips 0.07, bins nothing. It holds 2, 3, 3, 5, 7, 8, 9, 10, 10 by round. Planner: 1.51 and 1.03, deals again 0.89, skips 0.16, holds 11 from round 5. Coins pile up late: there is not enough to spend them on.

### What is still wrong, found in this measure

- **A player who does not line a page up in order cannot pass round one.** The novice passes round one 21% of the time and the greedy player 71%, against a target of 90% for the novice. Par follows the median player's margin, and the median player makes nine times what the novice makes.
- **Cascades are short.** With zip and snap, a page has 3 or more steps 3 to 5% of the time for the players that look for them and never 6. Most of the starting molecules allow one zip step or none.
- **The planner is far under its targets late** (76, 65, 36 percent in rounds 7 to 9).
- **Round 9** is under its margin (0.81) because Par may not fall and climbs 3.6 times from round 8.
- **Molecules** are still 3 to 8 times apart by round when every molecule with 8 plays is counted.
- **The worth tables the players pick by are older still**; a self-reaction on offer is worth a guessed 1.6.
- **Nothing on equipment was retuned for the cascade.** Pieces that pay on a row still work, because a cascade step carries the row on.

## What it is

| Piece | Where | What it does |
|---|---|---|
| One source of chance | `path.js`: `seed(n)`, `rand()` | Every draw on the run path (dealing, heavy atoms, picks, rounds on offer, rare reagents, wishes, terms, assays, the intern) comes from it. `seed(n)` makes a run repeatable. `seed()` returns to the system's. The game is unseeded unless the page is opened with `?seed=N`. |
| The simulation | `.claude/sim.js`, versioned copy `docs/tools_sim.js` | `runSim(player, seed, opts)` plays a run of up to nine rounds: take one of three, choose the round, play the pages as the page plays them (the hand, the redraw, the bank, the intern, the chain and its forks, the twist, water and hydrogen, the finishing reagent, the wish, the extinguisher), compare with the number to beat, stop on a miss or after round nine. |
| The switches | `path.js`: `RULE` | The rules of a round added on 2026-11-10 can each be turned off: `atoms`, `chain`, `loops`, `loopsAll`, `ground`, `uses`, `fork`, `hand`, `redraw`, `bank`. `runSim(..., { rule: {...} })` overrides them for one run, so a rule is measured on and off on the same seeds. |
| Assays | `path.js`: `runAssays`, `assayOf` | Rounds 3, 6 and 9 are one round of a harder kind (scarce, short, each, loose). Three of the four are drawn when the run starts, one for each act. |
| The number to beat | `path.js`: `runQuota`, `PAR`, `MOLF` | Par for the round, times the square root of the molecule's factor held between 0.35 and 3, times the pact (2), the idol (1.5), the hourglass (1.25) and the stake of the run's terms. Round nine is Par times 1.15. Both tables are generated. |
| Analysis | `docs/tools_rig.py`, `tools_fit.py`, `tools_molf.py`, `tools_bake.py`, `tools_round.py` | Read the logs and print the tables below, fit the Par curve, compute the molecule factors, and write both into `path.js`. `tools_round.py` prints how wide a round is, how much of a choice a turn was, and the paired test of breaking on purpose. |

### The four players

| Player | On a page | Take one of three | Choose the round |
|---|---|---|---|
| novice | the biggest gain six times in ten, anything otherwise; may finish early. Banks whenever the die says so, redraws one decision in eight for no reason, and at a fork takes the biggest link six times in ten and otherwise a random one or the bank | at random | at random |
| greedy | the biggest gain now (the player `MATRIX.md` was measured with). The bank is one more number to it, on a page and at a fork. Redraws only when nothing acts | equipment, then reagent, level, stronger, one more use | the first on the page |
| median | never breaks a row when it can be kept; looks three reactions ahead and takes the line that makes most; twists; spends water; finishes when that pays. Redraws when a row of two or more is open and nothing in the hand keeps it, and banks when even then nothing does. Takes the biggest link at a fork | the highest "in a build" worth from `MATRIX.md` | the easiest: what the kind and the molecule make, over the number |
| planner | searches the page three deep with the bank as one of the moves, may break a row, counts what a charged page will add and what the row will multiply later; twists; spends water and hydrogen; wishes on assays; stops a chain on its last link with the extinguisher. At a fork it plays each way out to the end of the chain and compares that with banking there. Redraws as the median player does, and also a hand with fewer than two live reagents | worth in a build times the measured pair synergy with what is held, with the pact, idol and hourglass marked down by what they add to the number | as the median player |
| keeper | the planner with no way to end a row on purpose: it keeps the row whenever it can and never banks. Used only for the paired test of breaking | as the planner | as the planner |

Guesses, not measurements: a stronger reagent is worth 1.3, one more use 1.1, a level half of the piece's worth above 1. What each kind of round makes against a plain one (plain 1, carry 0.45, broad 1.2, loose 1.6, each 1.6, back 1.3, scarce 0.55, short 0.85) was rounded from 150 runs of the median player under the new rules. Stale: the worth of each piece and pair (`MATRIX.md`) was measured under the old rules and the players still pick by it.

### What a round logs

`seed, player, round, mol, carry, family, kind, assay, gear (with levels), rack (with grades and uses), offered, took, number, par, mult, pages (the total after each page), total, pass, chain (longest chain), row (longest row), steps, atoms (largest molecule), heavy (heavy atoms at the end), cut, live, banks, bankAt (where each bank was made and how long the row was), redraws, forks, idle (reactions of a page left unused), left (uses left at the end)`. With `{ dec: true }` also `dec`: for every turn of a page, how many options there were and whether the second was worth taking.

Not logged: what each source added to the total.

### Limits

- **Large molecules were cut, and no longer need to be.** Since the size limit of 32 heavy atoms no round has been cut and the largest molecule in 18,000 rounds had 90 atoms with its hydrogens. The cut is still in the rig. Before the limit: the rules let a molecule grow without limit, and a reaction on a molecule of a thousand atoms takes most of a second. A round is stopped once the molecule passes 600 atoms (or three times its starting size), and what it had made is its total. A molecule left with more than 300 atoms is not carried into the next round. The look-ahead is cut to two reactions past 100 atoms and to one past 250, and the twist is not looked for past 150 atoms. In the final measure 0.1% of the novice's rounds were cut, 0.6% of the greedy player's, 3.4% of the median player's and 13% of the planner's. Seven cut rounds of 18,000 were then counted as missed; the rest were far over the number.
- **Speed.** With eight tabs measuring at once and every turn weighed (`dec`), a run now takes 0.25 s for the novice and greedy players, 0.7 s for the median player and 1.3 s for the planner. Before the size limit it was 0.3, 1.5 and 2.9 s without weighing turns, and the time went on large molecules inside the rules.
- **All six suppliers are open** (`tier` 5) and the run's terms are plain, unless `opts` says otherwise.
- **The fit and the players share one measure.** Par was fitted on seeds 1 to 500 of the median player. Seeds 501 to 1,000 were then played as a check.

## How to run it

The preview server serves the repository at `http://localhost:8766`; the frame server on port 8767 saves what the page posts into the scratchpad `frames` folder (start `recsrv.py` if nothing is listening).

1. Open `http://localhost:8766/.claude/rec.html?name=none&r=1`.
2. One run: `runSim('median', 7)`, or to go on after a miss `runSim('median', 7, { all: true })`. Options: `tier`, `noGear`, `term`, `rounds`, `noCarry`, `relaxed`.
3. A measure, one browser call for each piece of about 22 seconds: `await simChunk('tag', ['novice','greedy','median','planner'], 1, 500, 120000, { all: true }, 22000)`. Call it again with the same arguments until it answers `done`. Each call posts its rounds as file `f120000.jpg`, `f120001.jpg` and so on (JSON, whatever the name). This is roughly a hundred calls.
4. The same measure shared by eight tabs, which is how the tables here were made: open the page in eight tabs and call `simPart('tag', k, 120000, { all: true })` in tab k, for k from 0 to 7. Each answers at once and works on in pieces of five seconds, each ended by its post; no call runs long and no timer is used. `simStat()` says how far a tab is. Part k posts from file `120000 + 1000 k`. A whole measure takes about seven minutes.
5. Tables: `python docs/tools_rig.py tag 120000 127999`. Spread of a round and the turn measures (the measure must have been made with `dec: true`): `python docs/tools_round.py tag 120000 127999`.
6. Molecule factors: `await simMols('molf', 'median', 40, 110000, 0, 8)`, then `8, 16`, `16, 23`; then `python docs/tools_molf.py 110000 molf.json`.
7. Par: `python docs/tools_fit.py tag 120000 127999 par.json - - - 0.07` fits a curve whose steps fall by at least 0.07 a round. `python docs/tools_fit.py tag 120000 127999 x.json 3700 2.5 0.07` reports what a given curve would do. `python docs/tools_bake.py par.json molf.json` writes both tables into `path.js`, stamps them and bumps the version.

8. Breaking on purpose: `simBreak('tag', 320000, 1001, 1030, 5)` takes every round of the planner's runs on those seeds as a build and plays each five times with the planner and five with the keeper on the same seeds; `simStat()` says how far it is; then `python docs/tools_round.py break 320000`.
9. Never start a second `simGo`, `simPart` or `simBreak` in a tab where one is running. Reload the tab first.

Measures are made with `{ all: true }`: a run goes on after a miss, and the analysis stops each run at its first miss. Nothing in a run reads whether the last round was beaten or what the number was (the choice of round reads only how the numbers on the page compare), so this gives the same rounds as stopping, and one measure can be read against any Par curve.

The scripts carry the path of the scratchpad `frames` folder at the top.

## How the tables in `path.js` were made

**Molecule factors.** The median player, a plain round, the starting four reagents, no equipment, 40 seeded plays of each of the 23 molecules. The factor is the molecule's median over the average of the 23 medians (of logarithms). They run from 0.11 (the bridged ring `OC1CC2CCC1C=C2`) to 37.7 (the open sugar `OCC(O)C(O)C(O)C(O)C=O`): a spread of 343 times. Thirteen of the 23 lie outside 0.35 to 3 and are held at the edge.

**Par.** The median player, 500 runs that go on after a miss, with the number's molecule and stake factors divided out. Median total by round:

| Round | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| Median total | 83,600 | 109,000 | 96,200 | 412,000 | 639,000 | 310,000 | 2,990,000 | 4,590,000 | 1,270,000 |
| Par, baked | 3,700 | 9,250 | 22,500 | 53,000 | 121,000 | 270,000 | 580,000 | 1,210,000 | 2,420,000 |

The medians do not climb smoothly: every assay falls back, and round 9 makes less than round 7. Par is a curve of three numbers, a start and steps that shrink by a fixed amount, chosen so that the median player's pass rate is as near the targets in `BALANCE.md` as it can be in every round: **start 3,700, first step 2.5, each step 0.07 smaller** (2.5, 2.43, 2.36, 2.29, 2.22, 2.15, 2.08, 2.01), 655 times over nine rounds. `BALANCE.md` guessed 1.9 falling by 0.07, 54 times; builds grow much faster than that. `BALANCE.md` also says the number is Par and Par is the median total, which would give a pass rate of one in two in every round; its own table of pass rates was taken as what binds, so Par sits well under the median.

Tuning: one fit, then a measure with the baked numbers, then a check on 500 new seeds. A second fit on all 1,000 runs found no curve with a worst miss under 7.3 points against 8.0 for the baked one, so nothing was changed. No piece was touched.

## The measure after the rules of a round were changed

Measured 2026-11-10 on the rules at commit `0220c1c` with the tables baked after it. For a reviewer: nothing here says a section passes.

### What changed in a round

| Rule | What it is now | Chosen how |
|---|---|---|
| Size | a reaction that would grow the molecule past 32 heavy atoms is not offered | 28 and 40 gave the same spread; 32 was taken between them so that a molecule stays readable on the page and a reaction stays quick |
| Chain | a free chain runs six links at most | 5, 6, 8 and 10 tried, with no clear difference in spread between 5, 6 and 8. Six was kept as the shortest at which a round with a chain of five or six still makes 2.1 to 3.5 times one with two or fewer. A third of the median player's rounds reach the limit |
| Loops | a return to an earlier form carries a row on at most twice a round, for any player. The recycler no longer decides it; it still adds to the row on a loop | with a budget of uses a loop cannot run away, and letting a loop continue gives a second way on in turns that had one |
| Follows on | a reaction carries the row on when it acts on what either of the last two reactions of the row made (it was the last one only) | two and three and "any" measured the same; two is the least change |
| Resonance | multiplies extra by 1.02 a link, not 1.05 | at six links 1.05 is 1.3 a reaction. It alone put the four phenyl molecules four times above the rest and it halved the spread when lowered |
| Uses | three uses of each reagent for the whole round (two for a rare one, half in a scarce round), spent by the pages and the chain alike | 3 and 4 tried; 4 widens the spread again |
| Forks | a chain that could go on with two or more reagents stops for a click | 2.2 forks a round for the median player, 4.0 for the planner |
| Hand | six reagents to start (reduce and hydroborate added), a page shows five, reagents with uses left first, and the deal is not repeated | with the old four, one reagent took each group and most turns had one way on. With six to start, a hand of four gives 44% of turns a second option worth taking, five 49% and six 52% |
| Redraw | once a page, for one use of the fullest reagent in the hand | used 1.4 times a round by the median player |
| Bank | closes the open row for one and a half times what it holds; takes one reaction of the page, or ends a chain stopped at a fork | 1.5 and 2 tried. At 2 the bank is taken more and turns score a little higher on the measure; 1.5 was kept as asked |

Dropped: a hand of four from a rack of four or five (it removed options and the redraw gave back the same hand). A limit of 40 atoms and a chain of 8 or 10 (no gain). Four uses. A halved arene bonus (no change once resonance was lowered).

Not changed: any piece of equipment. The recycler's role changed with the loop rule and nothing else was touched.

### One step at a time

The median player on seeds 1 to 150, every run played to round nine, the old number to beat. Spread is the 90th percentile of a round's total over the 10th, by round, every run counted. A turn has "a second option" when the second biggest gain is within 30% of the biggest, or when taking it and then the biggest gain for two more turns (and the chain, if the page ends charged) makes more.

| Rules | Spread of a round, least to most over nine rounds | Rounds under 30 | Turns with a second option | Row open and at most one reagent keeps it |
|---|---|---|---|---|
| as they were | 52 to 2,680 | 0 | 44% | 57% |
| bounds: size, chain, loops, follows on, resonance | 23 to 91 | 1 | 40% | 56% |
| and a budget of uses | 20 to 95 | 4 | 36% | 59% |
| and forks (planner: no change in totals) | as above | | | |
| and the hand of five with the redraw | 17 to 109 | 5 | 35% | 67% |
| and the bank | 15 to 102 | 6 | 49% | 68% |
| the same on 500 runs with the players choosing rounds by the new table | 10 to 47 | 7 | 53% | 63% |

Bounds and the budget cut the spread. They also removed options, and turns got worse until the bank and the second reagent for every group were in.

### The tables in `path.js`

**Molecule factors**, measured as before (median player, plain round, starting rack, no equipment, 40 plays each). They run from 0.11 (adamantanol) to 2.5 (three of the phenyl molecules): 22 times, where it was 343. Two of the 23 lie outside the hold of 0.35 to 3, where it was thirteen.

**Par**: start 2,530, first step 2.11, each step 0.072 smaller, 138 times over nine rounds (it was 3,700, 2.5 and 0.07: 655 times). Two fits. The first, on seeds 1 to 500, gave 3,080 and steps from 2.0; checked on seeds 501 to 1,000 it missed round 8 by 13 points. The second, on all 1,000 runs, is the one baked. It was then measured on seeds 1 to 500 again and on seeds 1,001 to 1,500, which no fit has seen.

Baked: 2,530, 5,330, 10,900, 21,400, 40,400, 73,700, 129,000, 216,000, 347,000.

### Pass rates

500 runs for each player on seeds 1 to 500. Pass rate by round, of the runs that reached it:

| Round | novice | target | greedy | median | target | planner | target |
|---|---|---|---|---|---|---|---|
| 1 | 86% (500) | 90% | 98% (500) | 100% (500) | 98% | 100% (500) | 99% |
| 2 | 77% (432) | 80% | 88% (492) | 99% (500) | 95% | 99% (499) | 99% |
| 3, assay | 57% (331) | 55% | 82% (435) | 92% (493) | 85% | 97% (496) | 97% |
| 4 | 53% (190) | 55% | 81% (356) | 94% (454) | 92% | 98% (479) | 98% |
| 5 | 33% (100) | 40% | 74% (287) | 88% (425) | 88% | 92% (471) | 95% |
| 6, assay | 21% (33) | 20% | 35% (213) | 64% (375) | 70% | 83% (435) | 90% |
| 7 | 57% (7) | 15% | 65% (74) | 74% (239) | 78% | 84% (363) | 90% |
| 8 | 0% (4) | 10% | 56% (48) | 75% (178) | 70% | 78% (304) | 85% |
| 9, assay | none reached | 5% | 4% (27) | 47% (133) | 50% | 68% (236) | 70% |

| Player | Runs | Rounds beaten at 10, 25, 50, 75, 90 percent | Mean | Target median | Wins | Passed by more than 5 times | Last page decided, round 4 on |
|---|---|---|---|---|---|---|---|
| novice | 500 | 0, 1, 2, 3, 4 | 2.2 | 3 | 0.0% | 44.9% of 1,097 | 39% |
| greedy | 500 | 1, 2, 4, 5, 6 | 3.9 |  | 0.2% | 48.1% of 1,933 | 19% |
| median | 500 | 3, 5, 5, 8, 9 | 5.7 | 6 | 12.4% | 58.6% of 2,859 | 28% |
| planner | 500 | 4, 5, 7, 9, 9 | 6.9 | 9 | 32.0% | 69.8% of 3,443 | 19% |

Median margin over the number, of the runs that reached the round:

| Round | novice | greedy | median | planner | target, median player |
|---|---|---|---|---|---|
| 1 | 5.65 | 5.95 | 20.20 | 31.43 | 3 |
| 2 | 2.80 | 3.86 | 11.50 | 20.97 | 2.5 |
| 3 | 1.32 | 2.78 | 4.69 | 10.10 | 1.6 |
| 4 | 1.07 | 3.40 | 4.88 | 8.72 | 2 |
| 5 | 0.57 | 2.49 | 3.86 | 5.72 | 1.8 |
| 6 | 0.33 | 0.59 | 1.50 | 3.02 | 1.4 |
| 7 | 1.12 | 1.66 | 2.39 | 4.04 | 1.5 |
| 8 | 0.23 | 1.22 | 2.09 | 3.53 | 1.3 |
| 9 |  | 0.08 | 0.89 | 2.06 | 1.2 |

**New seeds.** The median player on seeds 1,001 to 1,500, same baked numbers: 100, 99, 91, 92, 86, 66, 78, 71, 44 percent; worst miss 6.5 points (round 3). Rounds beaten 3, 4, 5, 8, 9 at the same five points; wins 11.4%; 61.5% of passes by more than five times; the last page decided 24%.

### The gates of section 1, measured, awaiting review

| Gate | Before | Now | Met |
|---|---|---|---|
| 500 or more whole runs for each player on the same seeds | 500 each | 500 each on seeds 1 to 500, and 500 more for the median player on new seeds | yes |
| Median player within 12 points of the target in every round | worst 8.8 | misses of +2.0, +3.6, +7.1, +1.6, +0.2, -6.3, -3.5, +4.7, -3.4; worst 7.1 (round 3). New seeds: worst 6.5 | yes |
| Rounds passed by more than 5 times under 8% | 73.0% of the median player's passed rounds | 58.6% of 2,859 (61.5% on new seeds) | no |
| No molecule more than 3 times harder or easier than another in the same round | 27 to 254 times | 2.8 to 7.7 times by round (median margin, every molecule with eight plays or more): 3.9, 3.0, 7.7, 5.9, 5.1, 7.6, 2.8, 5.8, 3.5. Two rounds of nine are within 3 | no |

How wide a round is, for the median player: the 90th percentile of the total over the number, over the 10th, of the runs that reached the round.

| Round | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| Before | 198 | 1,144 | 103 | 686 | 1,278 | 233 | 893 | 1,497 | 2,079 |
| Now | 8.6 | 11.0 | 19.9 | 13.4 | 19.7 | 23.3 | 32.4 | 34.2 | 27.1 |

The aim was under 30 in every round. Seven rounds of nine are; rounds 7 and 8 are just over. Counting every run in every round and the raw total (so nothing depends on the number): 9.6, 10.8, 20.3, 14.6, 18.1, 29.8, 28.0, 36.0, 46.7. The planner is wider (15 to 47) and so is the novice (30 to 64).

**Why the 5 times gate is still not met.** In round one the median player's 10th percentile is at 0.3 of its median and the target is that 98% pass. A number that 98% pass is then passed by more than five times by most of them: the median margin is 20. The gate needs a round's totals within about five times of each other while 98% pass. They are within nine. What is left of the spread: the deal and the line of play (a round with a chain of five or six makes 2.1 to 3.5 times one with two or fewer, and pages on which little acts make a low tail), the kind of round (a plain round is beaten by 9.0 at the median, a scarce one by 1.0), the molecule (4 to 8 times after the number's factor), and late in a run the build. The largest single cause late is a level on a piece that multiplies: the highest totals of rounds 7 to 9 are a goat at level 7, a pact with a voodoo doll at level 2 or 3, a candle. Levels are not a rule of a round and were not touched.

**The last page** decided 28% of the median player's passes from round 4 on (27% before; the target is 55%). It follows from the same margin.

### The gates of section 2, measured, awaiting review

Turns: every reaction of a page, in the runs above. The options of a turn are the reactions on offer and the bank.

| Measure | Before (median player, 150 runs) | novice | greedy | median | planner |
|---|---|---|---|---|---|
| Turns | 14,654 | 34,111 | 38,495 | 41,087 | 45,468 |
| Second option within 30% of the best | 28.7% | 29.7% | 34.1% | 28.9% | 36.0% |
| Not that, but better two turns later | 15.5% | 11.7% | 9.5% | 24.6% | 23.9% |
| Either: the gate asks for half | 44.3% | 41.4% | 43.6% | 53.4% | 60.0% |
| Turns with one option only | 24.4% | 27.2% | 26.7% | 15.8% | 11.0% |
| Row open and at most one reagent keeps it | 57.2% | 64.6% | 69.5% | 63.4% | 50.5% |
| Options a turn | 1.99 | 2.21 | 2.18 | 2.52 | 2.66 |
| Forks a round | (the chain did not stop) | 1.0 | 1.1 | 2.2 | 4.0 |
| Banks a round | | 1.2 | 1.4 | 1.0 | 1.2 |
| Redraws a round | | 1.3 | 0.6 | 1.4 | 2.2 |

| Gate | Measured | Met |
|---|---|---|
| In at least half of turns the second-best option is within 30% of the best or leads to a higher total two turns later | 53.4% of the median player's turns and 60.0% of the planner's. 41.4% of the novice's and 43.6% of the greedy player's: a player who plays badly reaches worse turns | yes for the two players the gate is about, by a small margin |
| There is a verb for a bad deal | the redraw, once a page, for one use | yes |
| A player that may break on purpose beats one that may not on at least a fifth of builds | 269 builds from the planner's runs on seeds 1,001 to 1,030, each played five times by the planner and five by the keeper on the same seeds. The planner's median is higher on 70.6% of builds (by more than 5% on 66.5%), lower on 25.3%, equal on 4.1%. Median ratio 1.23 | yes |
| Reviewer: "a turn is a small puzzle" | not asked | |

Where the planner banks (166 banks in 135 rounds): 85 in the middle of a page, 56 at a fork, 18 as the last reaction of a page, 7 as the last reaction of the round. The row banked is 10.8 long on average.

Read with care: the turn measure counts a second option that is nearly as good now as a choice, whether or not a person would feel one. A row is still open with at most one reagent that keeps it in 63% of the median player's turns; what made the measure pass is the bank standing beside that one reagent, and the two-turn clause. The gate says a break is "sometimes" right and the test says the player who may bank wins on seven builds in ten, so the bank may be too good at 1.5.

### What is still wrong, found in this measure

- **Round one is beaten by 20 times at the median.** The spread fell by tens of times and the number cannot do the rest.
- **Kinds of round are 9 times apart** in what they are beaten by (plain 9.0, back 6.7, broad 6.4, loose 3.9, each 3.5, short 1.6, scarce 1.0). A scarce round halves the budget of uses, which costs far more than half. Assays are scarce or short half the time, which is why rounds 3, 6 and 9 sag.
- **Levels on multiplying pieces** make the top of rounds 7 to 9. Not a rule of a round.
- **The worth tables the players pick by are stale** (`MATRIX.md` was measured under the old rules, and hydroborate, worth 81 there, is now a starting reagent).
- **A first run has one new reagent to find** (close a ring), because reduce and hydroborate moved from the corner chemist into the starting rack. Later picks in a first run are a stronger reagent or one more use.
- **The planner is short of its targets late** (84, 78, 68 percent in rounds 7 to 9 against 90, 85, 70) and wins 32% against 40%. The novice is on target to round 6.
- **The preview no longer spends what a broken row leaves for the black cat.** That was a bug in `peek`; fixing it means a build with the cat does not reproduce the old logs exactly.

## Before the rules of a round were changed: the first measure of the new number to beat

500 runs for each player on seeds 1 to 500, rules at commit `b2f39b6`. Pass rate by round, of the runs that reached it (how many reached it in brackets):

| Round | novice | target | greedy | median | target | planner | target |
|---|---|---|---|---|---|---|---|
| 1 | 87% (500) | 90% | 96% (500) | 93% (500) | 98% | 98% (500) | 99% |
| 2 | 73% (436) | 80% | 94% (482) | 88% (464) | 95% | 94% (491) | 99% |
| 3, assay | 46% (318) | 55% | 66% (453) | 84% (406) | 85% | 91% (460) | 97% |
| 4 | 45% (145) | 55% | 97% (297) | 84% (343) | 92% | 91% (419) | 98% |
| 5 | 46% (65) | 40% | 98% (287) | 79% (289) | 88% | 91% (381) | 95% |
| 6, assay | 13% (30) | 20% | 31% (281) | 62% (229) | 70% | 87% (348) | 90% |
| 7 | 25% (4) | 15% | 77% (88) | 82% (142) | 78% | 90% (303) | 90% |
| 8 | 0% (1) | 10% | 68% (68) | 78% (116) | 70% | 91% (273) | 85% |
| 9, assay | none reached | 5% | 2% (46) | 46% (91) | 50% | 76% (249) | 70% |

| Player | Runs | Rounds beaten at 10, 25, 50, 75, 90 percent | Mean | Target median | Wins | Passed by more than 5 times | Last page decided, round 4 on |
|---|---|---|---|---|---|---|---|
| novice | 500 | 0, 1, 2, 3, 4 | 2.0 | 3 | 0.0% | 54.7% of 999 | 38% |
| greedy | 500 | 2, 2, 5, 5, 7 | 4.0 |  | 0.2% | 69.4% of 2,003 | 16% |
| median | 500 | 1, 2, 4, 6, 8 | 4.2 | 6 | 8.4% | 73.0% of 2,122 | 27% |
| planner | 500 | 2, 4, 7, 9, 9 | 6.2 | 9 | 37.6% | 80.4% of 3,112 | 18% |

Median margin over the number, of the runs that reached the round:

| Round | novice | greedy | median | planner | target, median player |
|---|---|---|---|---|---|
| 1 | 6.27 | 7.30 | 22.50 | 22.62 | 3 |
| 2 | 2.80 | 15.85 | 12.01 | 23.53 | 2.5 |
| 3 | 0.78 | 1.66 | 4.85 | 11.05 | 1.6 |
| 4 | 0.80 | 16.62 | 11.62 | 24.33 | 2 |
| 5 | 0.88 | 41.09 | 7.04 | 47.46 | 1.8 |
| 6 | 0.11 | 0.36 | 1.93 | 10.67 | 1.4 |
| 7 | 0.87 | 11.02 | 14.47 | 41.51 | 1.5 |
| 8 | 0.08 | 7.89 | 13.86 | 39.39 | 1.3 |
| 9 |  | 0.02 | 0.78 | 6.85 | 1.2 |

**The check on new seeds.** The median player on seeds 501 to 1,000, same baked numbers: 95, 86, 82, 85, 84, 61, 80, 77, 53 percent. Rounds beaten 1, 2, 4, 6, 8 at the same five points; wins 9.4%; 71% of passes by more than five times.

## The gates of section 1 as they stood before the rules of a round were changed

| Gate | Measured | Met |
|---|---|---|
| 500 or more whole runs for each player on the same seeds | 500 each on seeds 1 to 500, and 500 more for the median player | yes |
| Median player within 12 points of the target in every round | misses of -5.2, -7.5, -0.5, -7.7, -8.8, -8.0, +3.7, +8.4, -3.8; worst 8.8 (round 5). On the new seeds: worst 9.1 (round 2) | yes |
| Rounds passed by more than 5 times under 8% | median player 73.0% of 2,122 passed rounds (71.4% on the new seeds) | no |
| No molecule more than 3 times harder or easier than another in the same round | the easiest molecule is beaten by 27 to 254 times more than the hardest, by round (median margin, every molecule with eight plays or more) | no |

**Why the 5 times gate cannot be met by the number.** The gate needs most of a round's totals to lie within five times of each other. They do not. For the median player the 90th percentile of a round's total is 100 to 2,100 times the 10th, whatever the number is. In round 1, a number that 98% of runs pass is passed by more than five times by 91% of them; in round 9, a number that half pass is passed by more than five times by 57% of those. Holding the molecule and the kind of round fixed does not help: in round 1 the same molecule under the same kind still spreads 47 times from the 10th to the 90th percentile. The spread comes from the build and the deal, which the number must not read. Only a change to the rules can close it (what a pick is worth, what a deal can be, how far a chain can run).

**Why the molecule gate cannot be met by the number.** The number may differ between molecules by the square root of a factor held between 0.35 and 3, which is 2.9 times at most. Plain play differs by 343 times. And the plain factor does not carry into a run: with the whole factor in the number and no hold, molecules in the same round would still differ by 15 to 360 times, because a build changes which molecules pay. The diene `C=CCC(O)CC=C` has a plain factor of 1.59 and is the hardest molecule in every one of the nine rounds. This needs the molecules brought closer in the rules, or a factor measured for each molecule inside runs, round by round.

## The game as it was: the old number to beat

500 runs for each player on the same seeds with the rules at commit `bb371d6`: the old table of 161 numbers, growth 1.75 a round to round 3 and 1.5 after, the same four players, the same assays. The round that carries the last molecule on was left out, because the old number for it was made by playing sixty rounds every time the page of rounds came up.

| Round | novice | target | greedy | median | target | planner | target |
|---|---|---|---|---|---|---|---|
| 1 | 50% (500) | 90% | 45% (500) | 83% (500) | 98% | 90% (500) | 99% |
| 2 | 43% (249) | 80% | 47% (225) | 82% (417) | 95% | 90% (451) | 99% |
| 3, assay | 45% (108) | 55% | 67% (105) | 67% (343) | 85% | 78% (406) | 97% |
| 4 | 33% (49) | 55% | 57% (70) | 83% (229) | 92% | 91% (316) | 98% |
| 5 | 38% (16) | 40% | 72% (40) | 85% (191) | 88% | 94% (288) | 95% |
| 6, assay | 50% (6) | 20% | 66% (29) | 85% (162) | 70% | 87% (270) | 90% |
| 7 | 33% (3) | 15% | 37% (19) | 92% (138) | 78% | 96% (235) | 90% |
| 8 | 0% (1) | 10% | 14% (7) | 91% (127) | 70% | 95% (226) | 85% |
| 9, assay | none reached | 5% | 0% (1) | 84% (116) | 50% | 94% (215) | 70% |

| Player | Runs | Rounds beaten at 10, 25, 50, 75, 90 percent | Mean | Wins | Passed by more than 5 times | Last page decided, round 4 on |
|---|---|---|---|---|---|---|
| novice | 500 | 0, 0, 0, 1, 2 | 0.9 | 0.0% | 37.0% of 432 | 42% |
| greedy | 500 | 0, 0, 0, 1, 3 | 1.0 | 0.0% | 34.5% of 496 | 51% |
| median | 500 | 0, 1, 2, 7, 9 | 3.6 | 19.6% | 62.0% of 1,821 | 29% |
| planner | 500 | 1, 2, 5, 9, 9 | 5.2 | 40.6% | 77.4% of 2,610 | 13% |

The old number was hardest in round one, where half of the novice's runs and one in six of the median player's ended, and easier after: the median player passed round 8 more often than round 1. Its worst miss against the targets was 34 points (round 9). Molecules in the same round differed by 19 to 224 times.

## What else the rig found, before the rules of a round were changed

- **Assays are not equally hard.** In round 9 the median player passes a loose assay 91% of the time, each 72%, scarce 26%, short 4%. Loose and each are passed more often than scarce and short in every act, so an assay's difficulty is mostly which kind was drawn.
- **Hydroborate.** `MATRIX.md` puts it at 81 times a plain rack, so the median player and the planner take it whenever it is offered. That is probably why the first rounds are easier with one supplier, where it is offered early in most runs; this was not measured apart.
- **Carrying a molecule on** made about a quarter of a new plain round in round 2 and caught up only by round 8, in the first measure of the median player.
- **Fewer suppliers is easier early and harder late.** Median player, same numbers:

| Suppliers open | Runs | Pass rate, rounds 1 to 9 | Median rounds beaten | Wins |
|---|---|---|---|---|
| one, no equipment (a first run) | 150 | 100, 99, 89, 92, 77, 41, 53, 45, 0 | 5 | 0% |
| two | 300 | 97, 99, 87, 93, 92, 59, 85, 84, 31 | 5 | 9.3% |
| four | 300 | 92, 87, 82, 86, 81, 58, 74, 64, 39 | 4 | 5.0% |
| six (seeds 1 to 300 of the measure) | 300 | 92, 86, 82, 85, 77, 61, 81, 76, 43 | 4 | 6.7% |

  A run with no equipment cannot be won. The novice with one supplier and no equipment: 93, 82, 45, 63, 44, 36, 60, 0, median 2 rounds.
- **Molecules grew without limit** (fixed: see the size limit above). A run reached 1,000 atoms (2,565 was seen before the cut). On such a molecule one look for the twist took 6.2 seconds and one link of a chain 0.3 to 0.7 seconds. The page calls the same functions, so the game will stall there too.
- **The old number for a carried round** played sixty simulated rounds each time the page of rounds was shown. The new number plays none.
- **The last page decides** 27% of the median player's passes from round 4 on. The target is 55%.
