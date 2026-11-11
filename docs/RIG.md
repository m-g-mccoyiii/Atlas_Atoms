# Overreact: the measuring rig

Built 2026-11-10. The newest measure is the first section below (the fifth of 2026-11-11: tier one). This is the rig `BALANCE.md` asks for: whole runs played with no page by four simulated players, from seeds, with every round logged. Sections 1 and 2 of `PASS.md` are measured with it. The numbers are for a reviewer; nothing here says a section passes.

The rules of a round were changed later the same day (bounds, a budget of uses, forks in the chain, a hand, the redraw, the bank) and everything was measured again. That measure is the section "The measure after the rules of a round were changed". The measure made before it is kept below it, because it is the "before" of every comparison.

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
