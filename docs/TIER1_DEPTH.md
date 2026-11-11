# Overreact: making the bare turn a puzzle a new player can see

2026-11-11. Three designers each proposed and measured changes in a Python model (not the game); a judge picked. Nothing here is built.

## The judge

Baseline, from the three designers' runs. I did not re-run the model. They all measured 300 to 400 molecules of 12 to 17 carbons.

- **Order (a):** the best order beats the worst by over 20% on 91 to 93% of pages. Against the median order it is 67%.
- **Choice (b):** 60 to 69% of pages, on a looser count than the reviewers used.
- **Round totals (c):** random is 0.20 of greedy. Look-ahead is 1.18 to 1.46 times greedy.
- **Pages 2 and 3 (d):** they add rings past page 1's row on 45 to 78% of rounds.
- **Mismatch with the reviewers:** the model finds a real puzzle, but the reviewers find none. So the gap is that a new player cannot see it. All three models also miss the reviewers' "order matters little", so I trust the (c) shape more than the (a) and (d) figures.

**Pick 1: draw the whole queued line on the molecule, with drag to reorder.**
- Queue a reaction and the molecule shows which carbons change and which rings close. A ring that only closes again is drawn hollow. A reaction that finds nothing is greyed. Reordering redraws at once.
- Measured effect: a new player goes from 20% of greedy to 40% with 4 retries and 57% with 12. The other measures are unchanged. It adds nothing to read and is the five-second understanding.
- Rules builder: add a dry run that returns changed carbons, ring count and hollow flags for a queued line without committing. `tryOne` and `peek` in path.js look like the starting points. The page builder draws it and handles drag.
- Check: the novice rig should rise from about 20% of greedy toward 40% or more. Greedy, median and planner stay the same.

**Pick 2: show the next page's five face up.**
- A second row of five sits beside the current five. No rule changes.
- Measured effect: look-ahead over greedy goes from 1.18 to 1.30 in one model. The other model gives only 121% to 128%. Choice drops about 5 points. I take it because it is the only change that makes page 2 and page 3 depend on each other, and both models agree on the direction.
- Rules builder: expose the next deal before the page turn, drawn from the same random source so the shown five are the ones dealt.
- Check: planner minus greedy on the rig should widen. If it gains under 0.05, drop it.

**Pick 3: LASTX, rings that close after the third reaction pay double.**
- Mark the third slot "x2". No sentence on screen.
- Measured effect: orders within 20% of the best fall from 2.1 to 1.3, and (a) reaches 100%. Choice and look-ahead stay near baseline. It also doubles totals, so refit the numbers to beat.
- Rules builder: double the ring pay for rings closed after the third reaction in `scoreRound`. The page builder draws the mark and updates the preview.
- Check: on the structural screen, the share of pages with two or more good orders should fall. The median rig's spread over the planner should not shrink.

**Pick 4: a molecule filter, not a rule.**
- Reject molecules with two or more OH and no C=C, a single C=O and no C=C, or one kind of group in the row. Prefer one or fewer OH and two or more C=C.
- Measured effect: look-ahead over greedy was 1.20 to 1.34 on the good shapes and 1.04 to 1.10 on the bad ones.
- Rules builder: a filter in the molecule generator. Check the dealt-shape counts on the structural screen.

**Rejected**
- Two uses (USES2): adds a rule, and the median gain is flat.
- Waste halves pay (WASTE): choice falls from 69 to 56, and it scares new players.
- Dotted lines: they made new players worse.
- Page goal: no movement.
- Same five all round (P5): choice falls to 47.
- Best held back (P6): the missing reaction is unexplained.
- No repeat (P3): look-ahead is no stronger.
- Ene start (P1): pay falls 40%, with no gain beyond the filter.
- Keep, Novel, Carry and All3: dropped by the designers, and I agree.

Remove the "three uses" display from tier 1. A reaction fires once a page over three pages, so the limit never binds.

**What the base still lacks**
- Dead pages: 11% of look-ahead pages pay nothing.
- Pages 2 and 3 still lean on the same row. Pick 2 helps only a little.
- Rounds 1 to 3 may still be beaten by 9 to 25 times the number. Nobody measured it, so refit the numbers after LASTX.
- No chance event beyond the deal.
- The model uses chains, not the real 73 molecules, so every figure needs the real rig to confirm it.

## Rules designer

Foundation measurement for the tier 1 turn, from my Python model. Under rules as written, LASTX is the one change I recommend.

Script: `C:\Users\mgmcc\AppData\Local\Temp\claude\c2e091f86aaa20cc\4b5d48b3-c4d4-47b4-ad30-ef7d19555645\scratchpad\tier1_model.py`. Run it as `KA=30 KB=20 python tier1_model.py 300 base,LASTX,...`. The numbers below are in `out_final.txt` and `out_combo.txt` in the same folder.

**Setup.** I measured 300 generated molecules of 12 to 17 carbons. Each page deals 5 of the 6 reactions and the player fires an ordered line of 3. The look-ahead player searches the top 30 and top 20 states, with future deals sampled. Random is the mean of 3 plays.

**Baseline**
- (a) Order: the best order beats the worst order of the best three by more than 20% on 91% of pages. That includes dead orders. Only 2.1 of the 6 orders reach 80% of the best, so orders do differ.
- (b) Choice: on 69% of pages the second-best line is within 30% of the best or leads to a higher total. On 64% of pages it is within 30% by pay alone, and 5% by total alone. This is higher than your 44%, so my definition is looser.
- (c) Round totals: random 186, greedy 931, look-ahead 1358 (medians 158, 750, 1262). Random is 0.20 of greedy, and look-ahead is 1.46 times greedy. Both are the shape you wanted.
- (d) Rings past the earlier row, on the look-ahead path: page 2 on 45% of rounds, page 3 on 72%. For greedy it is 49% and 47%.
- 98 of about 900 look-ahead pages (11%) have best pay of zero.

**Proposals** (flags in the script)
1. LASTX, the finisher: rings that close after the third reaction pay double.
2. USES2, two uses: each reaction can be fired twice a round, not three times, and a use is spent whether or not the reaction acted.
3. WASTE: if any of the three reactions finds nothing to change, the page pays half.

| Setup | Orders within 20% of best | (a) | (b) | Random / greedy | Look-ahead / greedy, mean (median) | (d) page 2, page 3 |
|---|---|---|---|---|---|---|
| Baseline | 2.1 | 91 | 69 | 0.20 | 1.46 (1.68) | 45, 72 |
| LASTX | 1.3 | 100 | 66 | 0.13 | 1.42 (1.60) | 44, 71 |
| USES2 | 2.1 | 92 | 67 | 0.27 | 1.82 (1.64) | 45, 77 |
| WASTE | 1.4 | 98 | 56 | 0.11 | 1.33 (1.34) | 41, 75 |

**What each did**
- **LASTX:** it makes the order decisive and costs nothing else. Totals double, which is only a rescale of the targets. The player can say it in four words: the third one counts double.
- **USES2:** the look-ahead mean gain is real but the median ratio is flat. Greedy players burn their reactions early, and page 3 then has few full rings for them (19% against 47%). It adds a rule to learn and does not help order.
- **WASTE:** it punishes random play hardest, but it cuts choice from 69 to 56 because many lines now look bad. It also makes a first-time player afraid to try a reaction.

**Tried and dropped**
- KEEP (the two unfired reactions stay in hand): choice 73, but look-ahead gain fell to 1.37.
- NOVEL (full pay for a ring on a new C=O place): no change.
- CARRY (a record row stays shut): choice 78, but order matters on only 71% of pages and page 2 gains fall to 24%.
- ALL3 (all three acting pays 1.5 times): like WASTE, with choice 55.
- LASTX plus USES2 gives a look-ahead gain of 1.79 and nothing new on order. LASTX plus WASTE leaves choice at 50.

**Recommendation:** adopt LASTX. It is the only change that clearly moves a measure you set out to fix. Orders within 20% of best drop from 2.1 to 1.3, and choice and look-ahead gain stay close to baseline.

**Where the model is too crude to trust**
- Molecules are chains with arms, not your 73 real ones. NH2, SH and branching are removed.
- The quarter pay is taken as 0.25 of the whole ring, not "1 plus a quarter of n minus 1" as `CASCADES.md` words it.
- The look-ahead player samples only 2 future deals and checks a limited set of lines, so it is probably a little weak or noisy.
- The model does not reproduce your finding that nothing beyond "do not oxidize first" matters for order, nor the weak pages 2 and 3. Its order measure and the small (d) shifts are therefore less reliable than the (c) shape.
- It cannot measure the missing preview of a turn, which I think matters more than any of these three rules.

## Molecules designer

Molecule shape barely moves the numbers. Showing the next page's five before firing is the only lever that does.

Script: C:\Users\mgmcc\AppData\Local\Temp\claude\c2e091f86aaa20cc\4b5d48b3-c4d4-47b4-ad30-ef7d19555645\scratchpad\found_model.py. Run it with `python found_model.py 300 base:D0 base:D4 ...`. The molecule search is in found_search.py in the same folder. Each row below is 900 molecules (300 each for rounds 1 to 3), 3 deal draws per molecule, and all three players face the same deals.

**Baseline (random deal of five, old-style molecules)**
- (a) Best order beats worst order by more than 20 percent on 92 percent of pages. That is mostly because the worst order wastes a reaction. Against the median order it is 67 percent. This does not match the reviewers, who said order matters little.
- (b) A second line within 30 percent, or a look-ahead pick that differs from greedy, comes up on 60 percent of pages. The within-30-percent part alone is 50 percent.
- (c) Random play gets 0.19 of greedy. Look-ahead gets 1.18 times greedy.
- (d) Greedy play adds full-pay rings on 46 percent of pages 2 and 3. Look-ahead does so on 60 percent.

**Proposals**

Molecules (the deal stays random):
- P1, ene start. No OH. About half C=C and half C=O, 3 or 4 carbons apart, at least 2 C=C and 1 C=O. Half the time a C=O sits at the far end.
- P2, dense row. A head OH, then a group every 3 carbons: 40 percent C=O, 30 percent OH, 30 percent C=C.

Deals (same molecules as baseline):
- P3, no repeat. One of the three reactions fired last page is held back from the next five. The same row cannot be fired again.
- P4, next five shown. This page's five and the next page's five are both face up.
- P5, same five all round. Chosen at the start of the round.
- P6, best held back. One reaction of the best line is held back. The hidden version of "held back half the pages" is nearly the same.

| Case | random/greedy | look/greedy | (a) vs median | (b) | (d) greedy / look | greedy mean (baseline 938) |
|---|---|---|---|---|---|---|
| Baseline | 0.19 | 1.18 | 67% | 60% | 46 / 60% | 938 |
| P1 ene | 0.18 | 1.21 | 60% | 60% | 51 / 60% | 592 |
| P2 dense | 0.19 | 1.20 | 66% | 63% | 49 / 62% | 883 |
| P3 no repeat | 0.22 | 1.19 | 63% | 63% | 41 / 54% | 808 |
| P4 next five shown | 0.19 | 1.30 | 69% | 55% | 46 / 64% | 938 |
| P5 same five | 0.17 | 1.35 | 69% | 47% | 42 / 59% | 1012 |
| P6 best held back | 0.29 | 1.23 | 47% | 74% | 22 / 39% | 506 |
| P1 + P4 | 0.18 | 1.36 | 61% | 56% | 51 / 65% | 592 |

**What did not move.** Molecule shape (P1, P2 and four others: locked ladder, forked arm, mixed links, two heads) changed look/greedy by 0.03 or less. P3 does not make look-ahead stronger. It only lowers greedy pay and slightly lifts (b).

**Clarity cost for a new player**
- P1 and P2: none, but P1 cuts pay by about 40 percent, so the numbers to beat would need refitting.
- P3: low, but a player may feel a reaction was taken away for no reason.
- P4: none. It is one more row of five on the table, like Slay the Spire intents.
- P5: none. It is the clearest plan, but it removes the chance between pages.
- P6: the player cannot tell why the best option is missing, and pay halves.

**Molecule rules, from 8000 random molecules.** Look-ahead beats greedy most (1.2 to 1.34) when there is at most one OH, 2 to 4 C=C and 1 or 2 C=O. Avoid these shapes (look/greedy 1.04 to 1.10, (b) near 0.5):
- 2 or more OH with no C=C.
- A single C=O with no C=C.
- Rows with only one kind of group.

**Recommendation.** Show the next page's five face up (P4) and deal molecules with one or fewer OH and 2 or more C=C. Look-ahead rises from 1.18 to 1.30 to 1.36 times greedy, and each page's pick now depends on the page after it. It costs (b) five points.

**Where the model is too crude**
- Molecules are straight chains with grown arms. The real 73 include rings and phenols.
- The look-ahead player is a beam of 4 lines and 2 sampled deals. It understates planning gain, so every look/greedy figure is a floor.
- Hydrate and hydroborate are modeled as a one-carbon shift. Oxidize ignores hydrogen counts.
- The quarter-pay rule is simplified.
- There is no number to beat, so the 9 to 25 times figure cannot be checked.
- My (a) and (b) definitions differ from the reviewers', so the baselines do not match theirs.

## Information designer

Reading the model: the page's five dealt reactions and the three uses a round turn out not to bind. A reaction can fire only once a page, so three pages never spend more than three uses of any one.

Script: `C:\Users\mgmcc\AppData\Local\Temp\claude\c2e091f86aaa20cc\4b5d48b3-c4d4-47b4-ad30-ef7d19555645\scratchpad\ox\tier1_see.py`. Run it as `python tier1_see.py 400 3`; the last number is the uses a round. Output is in `out3.txt` and `out2.txt` in the same folder. All numbers are 400 molecules of 12 to 17 carbons, six reactions only.

**Baseline**

| Measure | Result |
|---|---|
| (a) best order of the best three beats the worst order by over 20% | 93% of pages (76% against the second-best order) |
| (b) second-best line within 30% of the best | 68% of pages |
| (b) second-best line leads to a higher round total | 6% of pages |
| (c) mean round total: random / greedy / look-ahead | 168 / 841 / 1020 |
| (c) random as a share of greedy | 20% |
| (c) look-ahead as a share of greedy | 121% |
| (d) page 2 or 3 closes a full-pay ring past page 1's row, greedy / look-ahead | 61% / 78% |

Pages 2 and 3 carry 56% of the total under greedy.

The model finds a real puzzle in the structure: random is far below greedy, and look-ahead is clearly above it. The gap is a search problem for a new player, not a missing puzzle. This conflicts with your reviewers' "order matters little" and "44 in 100". My "second-best" counts any different end state, so it is generous.

**Proposals (new-player total as a share of greedy)**

| Proposal | New player | Look-ahead | (a) | (b) | (d) |
|---|---|---|---|---|---|
| Baseline, no preview | 20% | 121% | 93% | 68% | 61% |
| 1. Drawn preview of the whole queued line, retry 4 / 8 / 12 times | 40 / 51 / 57% | unchanged | unchanged | unchanged | unchanged |
| 1b. Preview slot by slot | 46% | unchanged | unchanged | unchanged | unchanged |
| 1c. Reactions that find nothing drawn grey | 40% alone, 47% with 1b | unchanged | unchanged | unchanged | unchanged |
| 1d. Dotted lines from an open OH to a C=O 3 or 4 away | 35%, worse | unchanged | unchanged | unchanged | unchanged |
| 2. Next page's five shown on this page | n/a | 128% (all pages seen: 129%) | unchanged | unchanged | 78% to 83% |
| 3. Two uses a round, as pips | 25% | 118% | 90% | 15% on the strict count | 49% |
| 4. Page goal "close a ring past the row" | 47% | unchanged | unchanged | unchanged | unchanged |

Two lines each:
1. After each reaction is queued, the molecule shows which carbons change and which rings close, hollow if it only closes again. Reordering redraws it at once. Only a preview that is cheap to retry matters. Four tries close a quarter of the gap from random to greedy, and twelve close under half.
2. The next page's five reactions are shown ahead. It adds 5% to a look-ahead player's total, which is small.
3. Each reaction gets two uses, drawn as pips. This is a rule change, but the only lever here that alters the puzzle. It doubles the pages where the runner-up leads to a higher total, from 6% to 13% to 15%.
4. The goal was the same as the preview with pay as the choice. It did not move anything.

Did not work:
- Grey reactions alone, slot-by-slot previews, dotted lines (worse, because they steer toward the wrong ties) and the goal each moved a new player by less than 10 points.
- No information lever lifts a new player past about 57% of greedy.
- No lever fixes the weak pages 2 and 3: they already carry over half the total.

**Cost in clarity**
- A drawn preview with free reordering costs nothing to understand. It is the five-second read.
- Pips are cheap to draw but add a rule to the first screen.
- Showing the next page adds a second row of cards to look at, for 5%.

**Recommendation:** build the whole-line drawn preview with drag-to-reorder, hollow rings for repeats, and greyed reactions that find nothing. Pair it with two uses a round only if you accept a rule change. I would not build the goal, the dotted lines or the next-page row.

**Where the model is too crude**
- Hands are a fixed random five, with no redraw and no "at least two act" rule.
- The runner-up counts any different end state, so choice (b) is overstated.
- Look-ahead keeps only the five best states a page.
- The "new player" is random plus a rule, not a person.
- Carbon chains are single trees: no real geometry, no rings in the molecule, and no heavy atoms.
- The molecule generator is the old early stage with no NH2 and no SH.

## The owner's ruling, 2026-11-11

Pick 1 is rejected: nothing shows what a line will do before it is fired. "New players are inexperienced, that's the whole point of playing the game." Learning to read the molecule by firing and watching is the game; a preview plays it for them. Kept from pick 1: the three queued circles can be reordered freely. Picks 2, 3 and 4 go ahead, each measured in the game.
