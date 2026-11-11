# Overreact: how hard it gets, second version

2026-11-11. Rebuilt from this game's own pieces after the first version copied other games. Checked on the chemistry engine. Not built.

**Read this first.** Section 1 (winning as one goal the molecule must become) was written before the owner ruled that win conditions are hurdles, not ceilings (`HARNESS.md` line Y). It is superseded by `docs/tools_chem/HURDLES.md` when that lands. Its measured findings still hold and are worth keeping: which structures are reachable on dealt molecules, and that a player who plays only for the longest chain meets some conditions by accident and others almost never. Sections 2 onward (the curve, the special rounds, harder levels, who wins how often, getting everything, coins) stand, to be joined with the hurdles.

# Overreact: winning and how hard it gets, second version

Checked on 11 November with the RDKit engine in `docs/tools_chem` (scripts in the scratchpad, listed at the end). Nothing is built.

## 1. Winning

**The rule.** Before round 1 the player is shown two goals and takes one, the same way a molecule is picked from two. A goal is something the molecule must become. It stays on screen for the whole run.

- **Every round before the last:** the total must reach stable to go on.
- **The last round has no number to beat.** The run is won if, at the end of any page of that round, the molecule is in the goal form. The goal is checked after the loose rings have opened again, so it counts only what stays.
- **How it is checked:** a SMILES pattern, read with RDKit.

**Building toward it.**

- Every pick of a reaction or helper can be aimed at the goal.
- If an earlier round's molecule is brought into the goal form, the plate lights up and the last round gets one extra page (at most two). It also pays 2 coins.
- At least one of the two molecules offered for the last round can reach the goal with the reactions held. This is checked on the screen before the pair is shown, so no run ends on a goal that cannot be made.

**Score and goal against each other.** The four marks (stable, unstable, volatile, overreact) stay as the score: they pay coins and are kept in the record.

- **Huge score, goal missed:** the run is lost. The last round's marks still pay credit for the bench, the record keeps the score, and the end screen shows the part of the goal that was missing.
- **Goal made, small score:** the run is won, and the word for the last round stays blank.
- **Where score still counts after winning:** some later deeds and the harder levels ask for "won with volatile or better on the last round".
- **Why they pull apart (measured):** a player who plays only for the longest chain hits "no free OH and two C=O" on 34 of 100 small molecules, while a line exists on 20 of 24. Hydrate opens chains, and this goal needs no OH left.

**Goal kinds:** shape, group count, the core of a real compound, and something given off in the last round.

**How goals step up:**

- **Three-round run:** one goal with one condition, offered from goals 1 to 6.
- **Six-round run:** goals 4 to 9, either two conditions together or a real core.
- **Nine-round run:** goals 9 to 12. These need a self-reaction that is unlocked over many runs.

**The book.** Every real core is a book entry. The next blank entry in the book is always one of the two goals offered. A run won with it fills in the entry.

**Twelve goals, easiest first.** "Plays for score" is the share of rounds in which a player picking the longest chain makes the goal without trying. "A line exists" counts the dealt molecules where at least one line of play gets there within two pages. Both use the six starters, with ring and dry as the self-reactions unless the row says otherwise.

| # | Goal | Kind | Pattern checked | Plays for score | A line exists | Ours because |
|---|---|---|---|---|---|---|
| 1 | four waters come off in the last round | given off | jar count of water, 4 or more | 73% (10-16 atoms) | 24/24 | water is a real product of dry and dehydrate, and it feeds a jar |
| 2 | two C=C each beside a C=O | group | `[C;!a]=[C;!a]-[CX3]=[OX1]`, 2 or more | 51% | 24/24 | built by dry, the molecule's own act |
| 3 | a ring that stays shut | shape | non-benzene rings above the dealt count, after reopening | 44% | yes (needs dry; 0/24 with ring alone) | loose rings open at each page turn; only one whose OH was taken stays |
| 4 | no free OH, two C=O | group | `[OX2H]` none, `[CX3]=[OX1]` 2 or more | 34% | 20/24 | fights hydrate, which starts most chains |
| 5 | glucose's ring: five carbons and an O, shut | real core | `[O;R]1@C@C@C@C@C@1` new | 29% | yes | the sugar ring made by ring, locked by dry |
| 6 | ribose's ring: four carbons and an O, shut | real core | `[O;R]1@C@C@C@C@1` new | 22% | yes | ring at 3 apart instead of 4 |
| 7 | two shut rings | shape | non-benzene rings +2 | 36% (20-26 atoms) | 18/18 | two locked rings on one molecule |
| 8 | ribose's ring and no free OH | group + core | goal 6 and `[OX2H]` none | 7% | 18/18 | the ring's own OH must go too |
| 9 | olean: two O six-rings on one carbon (the olive fly's scent) | real core | `O1CCCCC12OCCCC2` new | 2% | 10/18 (20-26), 7/18 (31-40); with weld held only 3/18 | a goal that gets harder when weld is held: weld uses up the C=O olean needs |
| 10 | carvone's ring: a six-ring of carbon with a C=C beside its C=O | real core | `[#6;R]1=[#6;R]-[#6;R](=O)-[#6;R]-[#6;R]-[#6;R]-1` new | 5% (20-26), 18% (31-40) | 23/24, 18/18 (needs weld or snap) | it needs a self-reaction that joins carbon to carbon |
| 11 | Wieland-Miescher ketone core: two carbon six-rings sharing a bond, C=O on a ring | real core | decalin with ring C=O, SMARTS in `goals3.py` | 0% | 11/18 (20-26), 14/18 (31-40) | made only by weld and snap together |
| 12 | acetogenin core: two O five-rings side by side | real core | `[O;R]1CCCC1-C1CCCO1`, ring atoms | 0% | 2/24, 1/18, 0/18 (two pages) | very few dealt molecules allow it; the screen must offer one |

All twelve were found reachable on real dealt molecules. Goals 1 to 4 can be made with the six starters and ring alone. Goals 3, 5 to 9 need dry, which the self-reaction design holds from the start. Goals 10 to 12 need weld or snap. Two O six-rings sharing a bond (a polyether ladder) was reached on 1 molecule in 18 and goes in the book only, not in the goal list.

## 2. The curve

**Assumptions.**

- A page pays 25 times n times (n+1) for a chain of n steps: 1 step pays 50, 2 pay 150, 3 pay 300, 4 pay 500, 6 pay 1,050.
- A round is three pages.
- Middling steps a page come from `RIG.md`: 2.2, 2.35, 2.6 in rounds 1 to 3, with 3 or more on about 56 pages in 100. The new player and the skilled player are set at about half and 1.25 times the middling player.
- A special round keeps 80% of a new player's steps, 88% of a middling player's and 94% of a skilled player's.
- Each mark is the middling median total divided by a chosen margin, so pass chances come out forward from the margins and are not fitted backward to a headline.

| Round | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| Atoms dealt | 11.5 | 12.5 | 14 | 16.5 | 19.5 | 23 | 27 | 31 | 35 |
| Mark (points) | 175 | 250 | 300 | 475 | 675 | 725 | 975 | 1,375 | 1,400 |
| Multiple of round 1 | 1 | 1.43 | 1.71 | 2.71 | 3.86 | 4.14 | 5.57 | 7.86 | 8.0 |
| Step from the round before | | 1.43 | 1.20 | 1.58 | 1.42 | 1.07 | 1.34 | 1.41 | 1.02 |
| Middling steps a page | 2.2 | 2.35 | 2.3 (rule) | 3.55 | 3.75 | 3.5 (rule) | 5.0 | 5.25 | 4.85 (rule) |
| Middling median total | 600 | 650 | 600 | 1,300 | 1,400 | 1,250 | 2,350 | 2,600 | 2,250 |
| Margin | 3.4 | 2.6 | 2.0 | 2.7 | 2.1 | 1.7 | 2.4 | 1.9 | 1.6 |
| Power comes from | the six starters, ring, dry | same | same, under a rule | first helper (free) plus one bought; a seventh reaction | second helper | under a rule | the creature joins | creature fed | under a rule |
| Felt as | easy | tighter | tight | release | tighter | tight | release | tighter | tight |

**Rounds 1 to 3 add up with no helpers.**

- **Round 1 (175):** passed with one 2-step page and one 1-step page. A middling player's usual 2, 2, 3 pays 600.
- **Round 3 (300):** passed with one 3-step page, or with two 2-step pages. The rule cuts the middling player to about 2.3 steps a page, which still pays a median of 600.
- **The new player:** at 1.2 steps a page usually makes 1, 1, 1 for 150, so passes round 1 62 times in 100.

**Where the curve rises.** The mark rises most at rounds 4 and 7, where new power arrives, and least at rounds 6 and 9, where the rule does the work.

- **Round 4:** the mark goes up 1.58 times while middling power goes up 2.2 times (600 to 1,300).
- **Round 7:** the mark goes up 1.34 times while power goes up 1.9 times.
- **Reason from the research:** Balatro shows that what the player can do must grow faster than the target. Here, what grows is the new piece arriving.
- **Ours because:** the steps of the curve are where a helper is first bought and where the creature arrives on the molecule.

**Self-reactions unlocked over many runs** (tuck, flip, weld and the rest) make rounds 1 to 3 quick for a player who has them. Each run length is fitted to what a player holds when that length opens.

## 3. The special rounds

**How the player sees what is coming.** A row of nine round marks runs along the top of the pair screen.

- Round 3's rule is face up from the start. Round 6's turns face up when round 3 is beaten, and round 9's when round 6 is beaten.
- Both molecules on offer are shown under the rule.
- On the last round, the rule is drawn only from rules that leave the goal reachable on one of the two molecules offered. The screen checks this.

Rules 1 to 5 go in round 3, 6 to 10 in round 6, and 11 to 13 in round 9. A later round may also draw an earlier rule.

| # | Rule | Way of playing it attacks | A prepared player | Reason (research) | Ours because |
|---|---|---|---|---|---|
| 1 | Wet flask: every C=C has an OH on it as the molecule is dealt | opening every page with hydrate or hydroborate on a C=C | carries dehydrate, or opens with oxidize | an early test takes away one resource | changes the molecule dealt |
| 2 | Capped ends: the last carbon at each chain end cannot be changed | hydroborate and oxidize at the ends, reduce on an end C=O | plays the middle groups; grow | hit one habit, not everything | built on the chain |
| 3 | Six only: ring closes only when the OH is 4 from the C=O, never 3 | chains spaced for five-rings | picks the molecule with 4-apart spacing; grow shifts the spacing | change what fits, not a number | changes a self-reaction's reach |
| 4 | Two flasks: no choice; both molecules are played at once, every reaction changing both | lines tuned to one molecule's shape | reactions that fit anywhere; the total of both counts | take the planning crutch away | "exact change everywhere it fits" on two molecules |
| 5 | Blind pair: the pair shows family names only until one is taken | picking by eye | reads the family's trait (chain, ring, benzene ring, sugar, cage) | hidden choice tests knowledge | the families are this game's own |
| 6 | Shut fast: loose rings do not open when the page turns | the same chain fired again on each page | opens new parts each page; dry to lock and move on | stop the repeated best line | the reopening is ours |
| 7 | Fresh only: a group a reaction made this page cannot be changed again until the next page | hydrate then oxidize in one line | lines on groups present at the page's start; setups across pages | attack the combo, not the score | what a reaction leaves |
| 8 | Damp-proof: no water can come off, so dry and dehydrate do nothing | water chains and water-jar feeding | ring and weld chains, a C=C made another way | attack the strongest engine | what comes off |
| 9 | Heat at the turn: before each page, the OH nearest a C=O loses water by itself | lines that need that OH | hydrate it back first, or use the new C=C | the board moves against the player | the molecule acts by itself |
| 10 | Short reach: a helper that acts on the whole molecule acts only on the side of the bond the player taps | leaning on the burner's whole-molecule act | taps well, or carries a helper that is placed anyway (mirror) | late tests attack the build | helpers are physical acts |
| 11 | Turnover: between pages every C=O becomes OH and every OH becomes C=O | setting up page 2 on page 1 | sets up for the turned molecule; light use of reduce and oxidize | change behaviour late | a chemistry swap |
| 12 | Shut jar: what comes off this round does not feed the creature | firing the creature on tap | brings food into round 9 by not spending it in round 8 | late tests attack the build | the jars carry across rounds |
| 13 | Runaway: between pages every C=O grows an arm, as grow does | tight plans on a fixed molecule | uses the new OH with its C=C arm, aims chains through it | the board moves against the player | the molecule grows by itself |

## 4. Harder levels after a full win

Each level keeps the ones before it.

**Data.** The only per-run data is Slay the Spire's: 9 runs in 100 win at the lowest level and 3 in 100 at the top (Mega Crit). Its sequel stays flat (16 and 17), because players at higher levels are better players. Dead Cells (53, 64, 77, 77) and Balatro are shares of owners, not runs. They are used only for the shape: the first drop is the biggest. The shares below are targets with no data behind them.

| Level | Change | Of the level before | Of nine-round winners | Ours because |
|---|---|---|---|---|
| 1 | Late notice: only the goal's kind shows until round 4 is beaten | 70% | 70% | building toward the molecule is cut short |
| 2 | Dirty glass: each molecule is dealt with one Cl on a middle carbon, blocking that carbon; strip, once held, turns it into a C=C | 85% | 60% | a group a prepared player can use |
| 3 | Two-part goal: the goal adds "and no free OH" | 80% | 48% | checked from SMILES |
| 4 | One family: both molecules on offer are of the same family | 85% | 41% | the families |
| 5 | Short reach (rule 10) holds for the whole run | 80% | 33% | helpers are physical acts |
| 6 | Round 9's rule shows from round 7 and holds for rounds 7 to 9 | 75% | 24% | the special rounds |
| 7 | Hungry jar: the creature needs twice the food in a run | 65% | 16% | the jars |
| 8 | Twice over: the goal must be on the molecule twice at once (not yet checked) | 50% | 8% | the goal is a part of the molecule |

## 5. Who wins how often

These targets are built forward from pass chances per round. The last round's chance is the chance of making the goal.

| Player | Pass chance by round | Goal on the last round (3 / 6 / 9 rounds) | Wins 3 / 6 / 9 rounds |
|---|---|---|---|
| New | 62, 52, 36, 51, 37, 22, 41, 28, 16 | 55 / 30 / 20 | 17 / not open / not open |
| Average | 90, 87, 82, 89, 82, 75, 87, 80, 74 | 85 / 65 / 45 | 66 / 30 / 10 |
| Skilled | 95, 94, 93, 95, 92, 90, 95, 92, 91 | 95 / 85 / 62 | 85 / 62 / 35 |

**The new player.** The simulated new player places reactions at random and never learns, so 17 is the lowest it can be. Wins by the fifth run are to be measured.

**Where an average nine-round run ends.** Of all average losses:

| Rounds 1-3 | Rounds 4-6 | Rounds 7-8 | Round 9, goal missed |
|---|---|---|---|
| 40% | 33% | 12% | 15% |

The hardest rounds are:

- **Round 3:** the tightest margin with no helpers, under the first rule.
- **Round 6:** the tightest margin of the run, under a rule that attacks the build.
- **Round 9:** a goal that only weld and snap can make, on a molecule of 35 atoms.

The goal chances are targets. A player that aims for the goal has not been simulated yet, so playing for score gives the low edge and "a line exists" gives the high edge.

## 6. Getting everything

| Runs | Reactions | Self-reactions | Helpers | Creatures | Kits | Book | Open |
|---|---|---|---|---|---|---|---|
| 1 | 6 | 2 | 0 | 0 | 1 | 0 | three rounds |
| 5 | 7 | 3 | 2 | 0 | 1 | 2 | six rounds |
| 20 | 10 | 5 | 5 | 1 | 3 | 4 | nine rounds |
| 60 | 14 | 8 | 8 | 4 | 5 | 7 | levels 1-3 |
| 150 | 18 | 11 | 10 | 8 | 7 | 9 of 12 | levels 4-6 |

**What only a few reach:**

- level 8: about 2% of players;
- the acetogenin and ladder entries in the book: about 4%, because few molecules allow them;
- the tenth creature, from the slowest jar: about 5%;
- every kit at every level: about 1%.

**No unlock is impossible:** the screen guarantees a reachable molecule for every goal. Cholesterol enters the book only once the self-reaction that folds four rings exists.

**Nothing is given for showing up:** every unlock is a deed, and a lost run pays only for rounds beaten.

**Ours because:** the book fills with real compounds the molecule became.

## 7. Coins against the curve

| Income | Coins |
|---|---|
| stable / unstable / volatile / overreact | 3 / 4 / 5 / 7 |
| took the harder molecule | +1 or +2 |
| goal made in an earlier round | +2 |
| Average player, per round | about 4.3 (about 13 by round 4, about 38 in a run) |

| Price | Coins |
|---|---|
| plain helper / better / best (sold from round 4) | 4 / 7 / 10 |
| one more use of a reaction this round | 1, then 2, then 3 |
| draw the pair again | 1, 2, 3 |
| draw the offer again | 2, 3, 4 |
| sell a helper back | half its price |

**Prices stay flat while marks rise eight times.** This works because a helper does its act on the whole molecule: a burner on 35 atoms reaches far more OH than on 12, so a helper bought early grows in worth.

**Nothing leaves a player stuck.** All of these are free:

- the pick of one from three each round;
- one helper from two after rounds 3 and 6;
- the creature at round 7;
- taking either molecule of the pair.

There is no interest on coins and no coin tax. The target is an average player ending a run with about 5 coins, against 28 now.

**Ours because:** what coins buy grows with the molecule.

## 8. What each part has that no other game could

| Part | Ours because |
|---|---|
| Winning | the molecule must become a shape checked from SMILES |
| Curve | rises where a helper or the creature lands on the molecule |
| Special rounds | each one bends a chemical act |
| Harder levels | change the molecule, the jars, the helpers' reach |
| Odds | goals that weld helps or hurts |
| Getting everything | the book of real compounds |
| Coins | a helper's worth grows with the atoms |

Scripts, all in `C:\Users\mgmcc\AppData\Local\Temp\claude\c2e091f86aaa20cc\4b5d48b3-c4d4-47b4-ad30-ef7d19555645\scratchpad\`:

- `goals.py`, `goals2.py`, `goals3.py`: goal checks and searches;
- `blind.py`: play for score only;
- `curve2.py`: marks and pass chances;
- `b_*.txt`, `c_*.txt`, `d_*.txt`, `e_*.txt`: results.

## The review

**FAIL.** The structure is sound: the goal is chosen up front, checked from SMILES, and a different act from scoring. But the new-player arithmetic breaks, half the rules are copies, and goals 4 and 8 break line Y.

**(1) Copies**
- Rule 2 copies Window/Head (part of the board is dead).
- Rule 5 copies House/Mark (face-down).
- Rule 7 copies the Eye (no repeating).
- Rule 8 copies Crimson Heart (the strong engine is switched off).
- Rule 10 is the first version's rule 9 (helper off) renamed.
- Rule 12 is the first version's rule 11 (creature sleeps) renamed.
- Rules 9, 11 and 13 are the first version's rule 12 (the molecule is altered between turns) three times over.
- Level 2 is Spire's A10 curse card. Level 7 is "shops cost more". Level 8 is A20's second boss. Level 1 is hidden information. Levels 5 and 6 reuse rules.
- Coin prices and sell-for-half follow Balatro.
- Rules 1, 3, 4 and 6 are the only ones that are the game's own.
- The "Reason (research)" column is generic ("hit one habit") and does not back anything.

**(2) Winning**
- Known from the start, a different act, and built on the molecule: yes.
- Goal 1 is made by 73% of players who play for score alone. At that level winning is scoring.
- "No free OH" (goals 4 and 8, level 3) is a ceiling, not a hurdle, and it punishes building more. That breaks Y.
- "All twelve reachable" is false. Goal 12 is 0/18 at 31 to 40 atoms and goal 9 is 3/18 with weld held, but round 9 deals 35 atoms. The screen's guarantee therefore removes the real choice of molecule.

**(3) Rounds 1 to 3 do not add up**
- The new player "usually makes 1, 1, 1 for 150". That is under the 175 mark. A 62% pass rate cannot follow from a usual result that fails.
- The middling player's maths holds: 2, 2, 3 pays 600 against 175.
- Marks of 250 and 300 need 2 and 2 steps or one 3-step page.

**(4) The curve**
- Mark multiples are 1, 1.43, 1.71, 2.71, 3.86, 4.14, 5.57, 7.86, 8.0. That is a sawtooth, and it is non-linear.
- Pass rates move only between 74 and 90, with no drop over 15 points, so nothing is felt as a cliff.
- The "power arrives at rounds 4 and 7" steps (3.55 and 5.0 steps a page) are assumed, not simulated.
- The rules are modelled as a blanket 80/88/94% of steps, not run.
- Rule 4 counts both molecules against the same mark, so it makes the round easier.

**(5) Average and new players**
- An average player wins nine rounds 10% of the time and six rounds 30%, so most full runs are lost. That passes.
- The new player wins the short run 17% of the time. That is 43% within three tries, and the doc admits it is a floor.
- The last-round pass of 74% in the nine-round table is unused, because the last round has no number.

**(6) Special rounds**
- Rule 12 does nothing to a player who has no creature yet.
- Rule 10 is weak when a player holds one helper.
- Rule 5's answer, "read the family's trait", is a knowledge test the first run cannot pass.
- Rules 4, 9 and 13 have no cost measured.

**(7) HARNESS failures**
- Y: "no free OH".
- S: every "Ours because" column, the "Reason (research)" column and section 8 are labels. Also the jargon (see 8), no schematic, and the length.
- LOOP (the pair shows from run 2) and the progression-by-play memory: "shown two goals before round 1" is a new layer on run 1.

**(8) Words a player would not know**
- Mark, margin, goal form, plate, bench, kit, book, credit, family, flask.
- Hydroborate, olean, carvone, Wieland-Miescher, acetogenin, polyether ladder, decalin, C=O, C=C, SMILES.
- Weld, snap, tuck, strip, flip (until unlocked).

**Replacement text**

- **Round 1 and 2 marks.** "Round 1 mark 125, round 2 mark 200. Three 1-step pages pay 150, so a new player passes round 1 unless a page does nothing. Margins become 4.8 and 3.25. Re-run the pass chances."
- **First runs.** "Runs 1 to 4: one fixed goal, goal 1 (four waters), shown at the start. The choice of two goals appears at run 5. Round 3's rule is off in a three-round run until the player has won once."
- **Goals 4 and 8, and level 3.** "Goal 4: at least two C=O and at least one shut ring. Goal 8: ribose's ring and at least two C=O. Level 3: the goal adds 'at least two C=O'." This needs a new RDKit measure of how far the goal pulls from score. Drop "no free OH" everywhere.
- **Reachability.** "Goals 11 and 12 are offered only in the six- and nine-round runs once 18 of 18 sampled molecules reach them in three pages. Otherwise remove them. Goal 9 is checked with weld held."
- **Rules, replacements.**
  - Rule 2: "A chain's last two carbons keep their groups: nothing is added, and nothing is removed from them."
  - Rule 5: delete it.
  - Rule 7: "A group a reaction made this page cannot start a second reaction until the next page." Rewrite it as a cap on chain depth if the first wording still copies the Eye.
  - Rule 8: "Dry and dehydrate do nothing, and the player holds three water-free reactions." Only offer it where the goal is not water-built.
  - Rules 9, 11 and 13: keep 13 (the molecule grows by itself) and delete 9 and 11.
  - Rule 10: "A helper acts on one tapped bond only."
  - Rule 12: "What comes off is not counted this round." Draw it only if the player holds a creature.
  - Rule 4: "Two molecules, one mark, and the total of both is halved."
- **Levels.** Delete levels 2, 7 and 8. Add three that change the molecule: "the first page of each round is a free page the player cannot use," "one reaction of the three is chosen for you," and "the pair is never shown, only the first is dealt."
- **Cuts and wording.**
  - Delete the "Ours because" and "Reason" columns and section 8.
  - Replace "mark" with "number to beat".
  - Replace "goal form" with "what the molecule must become".
  - Replace "family" with the picture of the molecule.
  - Add one schematic per goal.

## Pictures

Five PNGs are saved and each was opened with Read and checked for cut-off or overlapping text. I fixed the overlaps I found, and the last look at each shows no cut-off or overlapping text. I did not open `win-1.png` again after its final small tweak, which moved the last goal's ring clear of the bottom edge.

- `C:\Work\atlas-atoms\.claude\shots\win-1.png` (1080x2206): "Winning".
- `C:\Work\atlas-atoms\.claude\shots\win-2.png` (1080x1314): "How hard it gets".
- `C:\Work\atlas-atoms\.claude\shots\win-3.png` (1080x1234): "Who wins".
- `C:\Work\atlas-atoms\.claude\shots\win-4.png` (1080x1630): "The special rounds".
- `C:\Work\atlas-atoms\.claude\shots\win-5.png` (1080x2216): "Getting everything".

I wrote the drawing scripts in the scratchpad folder: `winlib.py`, `win1.py`, `win23.py` and `win45.py`. Each picture is drawn by hand in the `tiers.py` / `selfr.py` style: grey carbons, red OH, yellow C=O, double lines for C=C and C=O. RDKit was not used.

**What I changed from the design, following the reviewer:**
- **Marks:** round 1 is 125 and round 2 is 200. The other seven are unchanged, so the multiples are 1x, 1.6x, 2.4x, 3.8x, 5.4x, 5.8x, 7.8x, 11x and 11.2x.
- **Goal in `win-1.png`:** "a shut ring and at least two C=O", the reviewer's corrected goal 4. "No free OH" appears nowhere.
- **The four smaller goals in `win-1.png`:** four waters, two C=C each next to a C=O, the five-carbon sugar ring, and the four-carbon ring with two C=O (goal 8 as corrected).
- **Rules in `win-4.png`:** the six drawn are the reviewer's rewritten 1, 2, 3, 4, 6 and 7. Rule 5 is deleted. The two-molecules rule says "their total is halved".
- **Wording:** "number to beat" replaces "mark", and the pictures have no "Ours because" lines.

**What I could not draw, or drew with a caveat:**
- **Score words in `win-1.png`:** the stable, unstable, volatile and overreact words appear as a ladder beside each molecule, with the molecule's score lit.
- **No-number last round:** the last round of a run having no number is stated in one line in `win-2.png`. Rounds 3, 6 and 9 still show bars, because they are middle rounds in the longer runs.
- **Fractions in `win-3.png`:** the squares are partly filled where the percentage is not a whole tenth, for example 17 in 100.
- **New player:** the 6-round and 9-round rows are drawn greyed out as "not open yet". The 17 in 100 is the design's floor from a random-placement player, and the picture does not say that.
- **Rule 5 in `win-4.png`:** the "Rings stay" picture shows the crossed-out arrow and the word "open". It does not draw the opened chain.
- **Some words are still jargon:** "kits", "self-reactions" and "compounds" (the book) appear in `win-5.png`, because the design gives no plainer name or explanation for them. "C=O" and "C=C" are kept, because the legend and style use them.
- **Reached by few:** this is a separate block of 100-dot grids below the timeline. The "top harder level" is still drawn at 2 in 100 even though the reviewer deleted some levels. I could not confirm that the top level still exists under the replacement levels.
