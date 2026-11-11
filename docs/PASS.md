# Overreact: what "passing" means

Set 2026-11-10. The owner asked that work continue until independent reviewers pass every section of gameplay. This is the bar for each section. A section passes when its measured gates are met and a reviewer who has read `EVALUATOR_BRIEF.md` gives it a pass without being told what was changed.

## 1. The number to beat

- Measured on 500 or more whole simulated runs per player, same seeds.
- Median player: pass rate within 12 points of the target for every round in `BALANCE.md`.
- Rounds passed by more than 5 times: under 8%.
- No molecule more than 3 times harder or easier than another in the same round.

## 2. Decisions

- On a median page, at least two reagents are each the best choice for some sensible goal. Measured: in at least half of turns, the second-best option is within 30% of the best, or leads to a higher total two turns later.
- There is a verb for a bad deal.
- A break is sometimes right: a simulated player that may break on purpose beats one that may not, on at least a fifth of builds.
- Reviewer: "a turn is a small puzzle", pass or fail.

## 3. Pieces combine

- Fewer than half of all pairs are inert (within 5% of no interaction). Now 66%.
- At least 150 pairs are combos of 1.25 or more. Now 59.
- No pair above 2.5 times its parts. No piece above 3.0 alone or below 0.9.
- At most 3 pieces dead alone.
- Median worth by shelf rises: lab below alchemy below occult.
- Reviewer: can name five different builds from the rules, each with a moment it pays. Pass or fail.

## 4. Spectacle and speed

- The overreact chain shows on the molecule and gets faster as it goes. A chain of twenty finishes in under four seconds.
- Nothing is waited on for more than a third of a second outside the chain.
- At most one screen between the end of a round and the next reaction.
- Reviewer, from a strip of frames of one chain: "I would clip this", pass or fail.

## 5. The page

- A reader who has never seen the game explains every element on the round page, the take-one page and the suppliers page.
- No sentences on any game screen.
- Overlapping text in under 1% of frames, by the text-box counter.
- None of the rejected looks in `EVALUATOR_BRIEF.md`.
- The sixty pieces look drawn by one hand; at least 50 named correctly at first sight in a blind check.

## 6. Progression

- A first run shows only the bare game.
- Every unlock arrives as an object and has a visible counter toward it.
- A lost run leaves something behind.
- Credit has something to buy at every stage.
- Reviewer: pass or fail on "I always know what I am working toward".

## 7. Fun

- Reviewer, from recordings of three different runs: would they start another run, and what would they tell a friend about. Pass needs a yes and a specific answer to the second.

## Record

| Section | Status | Date | Note |
|---|---|---|---|
| 1 Number to beat | measured, awaiting review | 2026-11-10 | `RIG.md`, "The measure after the rules of a round were changed". 500 runs for each of four players, seeds 1 to 500, rules at commit `0220c1c` with Par fitted again. Median player within 12 points in every round: met, worst miss 7.1 (round 3, 92% against 85%), and 6.5 on 500 seeds no fit has seen. Passed by more than 5 times: not met, 58.6% against under 8% (it was 73.0%). Molecules in the same round: not met, 2.8 to 7.7 times against 3 (it was 27 to 254); two rounds of nine are within 3. Spread of a round, 90th percentile over 10th: 9 to 34 by round (it was 103 to 2,079); seven rounds of nine under 30. The last page decided 28% of passes from round 4 on (27% before, target 55%). |
| 2 Decisions | measured, awaiting review | 2026-11-10 | `RIG.md`, same section. Built: a budget of three uses a reagent a round, a chain that stops at forks, a hand of five with a redraw, the bank. Second option within 30% of the best or better two turns later: 53.4% of the median player's turns, 60.0% of the planner's (44.3% before; 41.4% novice, 43.6% greedy). Verb for a bad deal: the redraw. A player that may break and bank beats one that may not on 70.6% of 269 builds (gate: a fifth). A row is still open with at most one reagent that keeps it in 63% of the median player's turns. Reviewer's "a turn is a small puzzle": not asked. |
| 3 Pieces combine | fail | 2026-11-10 | 66% of pairs inert, 59 combos |
| 4 Spectacle and speed | fail | 2026-11-10 | chain is a tag and a number; three screens before a round |
| 5 The page | fail | 2026-11-10 | navy ink, yellow pills, unexplained ovals and chevrons |
| 6 Progression | fail | 2026-11-10 | stages built; no counters, nothing left by a lost run |
| 7 Fun | fail | 2026-11-10 | reviewers: tension dead when the number is beaten early |
