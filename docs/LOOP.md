# Overreact: page, round, run, and between runs

Written 2026-11-11. This is the one place that says how the pieces of the game fit in time. Where it disagrees with `ARC.md`, this is newer. `ARC.md` was written before the cascade.

## Three sizes

| Word | What it is | How many |
|---|---|---|
| page | one turn: three reactions are lined up and fired, and the cascade runs | 3 in a round |
| round | one molecule, and one number to beat | 9 in a run |
| run | one whole game, start to loss or win | as many as the player likes |

## Inside a round

- The molecule is dealt. The number to beat is shown.
- Each page deals five reactions from the player's pool. Three are lined up and fired.
- Each reaction can be used three times in a round.
- A ring closed by a zip opens again when the page turns, so the next page can set it off again and make it longer.
- A helper is used on the molecule when the player chooses.
- The total after page three is set against the number.

## Choosing the molecule (decided by the owner 2026-11-11, built the same day)

- Before each round two molecules of the round's size are shown side by side. One is taken. Taking is always free.
- The one that is harder to set off pays more: 1 or 2 coins on top, by how far apart the two are on the structural screen (`screen` in `path.js`). The easier one pays nothing extra.
- The pair can be drawn again for coins: 1, then 2, then 3 within one round. The price starts again at 1 every round.
- The owner's rule for this and for every coin sink: resource management that is not punishing. A player with no coins still chooses between two and is never stuck. Coins buy more choice, never the right to play.
- Round one of a first run shows one molecule only; the pair appears from the second run, the redraw the first time a coin is held.

### Built and measured, 2026-11-11

Built behind `RULE.choose` (on). Measured, awaiting review.

- **The screen.** The old page of three kinds of round is now this page. Two real molecules stand side by side, each with its family name, its number to beat in red, and under the harder one a plus and one or two copper coins. A click on a molecule takes it. Under them a turning arrow with the coins it costs draws the pair again. The coins held stand at the bottom left. No sentences.
- **Kinds of round.** With two molecules to choose from, a plain round is always plain: the special kinds (short, scarce and the rest) are no longer offered between assays, and carrying the last molecule on is gone, as this file says. Rounds 3, 6 and 9 still change one rule: both molecules are shown under that rule, named once between them.
- **Harder.** Each molecule is read by `screen` with the reactions the run holds: the longest cascade a hand of five can set off, averaged over every hand, plus the share of all lines of three that set off any zip (`easeOf`). The lower of the two is the harder one. It pays 1 coin when it is 0.5 or more behind and 2 coins when it is 2 or more behind (`CHOOSE`). The coins are paid when the round is beaten.
- **Drawing again.** 1 coin, then 2, then 3, then no more that round (the mark is struck through). The price is 1 again next round. With too few coins the mark and its coins are drawn faint and a click does nothing; both molecules can still be taken.
- **Order of appearing.** A first run shows one molecule. The pair shows from the second run. The redraw mark shows from the first time a coin is held (saved as `coined`).
- **Simulated players.** The median player and the planner take the one that reads better once a coin is counted as 0.8 of a step (a mark above the number pays one coin and takes about one more step on a page to reach), and draw again only when both read under 1.5 and a coin would be left. The greedy player takes the one that reads better. The novice takes either.

200 median runs, seeds 1 to 200, the number to beat as it stood (not fitted again), against the same seeds with the old page of three kinds:

| | Old page | Two molecules |
|---|---|---|
| Rounds beaten, mean | 7.56 | 7.61 |
| Wins | 41% | 44.5% |
| Pass by round | 100, 100, 100, 100, 94, 94, 86, 77, 70 | 100, 100, 100, 100, 96, 91, 85, 82, 74 |
| Coins held at the start of rounds 2 to 9 | 2.4, 6.0, 10.4, 14.7, 18.7, 22.2, 24.7, 26.7 | 2.4, 5.9, 10.3, 15.0, 19.4, 23.2, 26.4, 28.2 |

- The number to beat still fits: no round moves by more than 5 points.
- Of 1,632 pairs, 612 were too close to pay anything, 848 offered 1 coin and 172 offered 2. The median player took the harder one in 228 (14%), always for 1 coin and never for 2.
- It never drew a pair again: no pair read under 1.5 on both sides.

What is weak:

- The median player ends a run holding 28 coins, so one or two more are a small reason to take the harder molecule. That is the coin economy as it stood, not this screen. The coins need a sink before this choice has weight.
- The harder molecule usually also has the lower number to beat, because the number already carries a factor for each molecule. A player may read the lower number as the easier round.
- The redraw was clicked for real but the simulated players never use it, so its price is not measured.
- Frames: `.claude/shots/choose-1.jpg` to `choose-4.jpg`.

## Between rounds

- The molecule is put away. It does not carry.
- Three things are offered and one is taken: a reaction for the pool, or a helper.
- Beating the number by 2, 4 or 8 times pays coins. Coins reroll the offer, or buy.
- What carries: the pool of reactions, the helpers, the coins, the homunculus.
- Rounds 3, 6 and 9 change one rule.

Open, not built: whether part of the shape should carry to the next round. The owner was asked and has not answered. Do not build it.

## Between runs

A run ends by a missed number or by beating round nine. The player is then at the bench. The bench is a game screen made of objects, not a menu. Each object below is one thing that stays and grows from run to run. Each shows how far it is from its next step as a count, never a sentence.

| # | Object on the bench | What grows | How |
|---|---|---|---|
| 1 | the jars | what came off the molecules in every run | a full jar hatches a homunculus; see `HOMUNCULI.md` |
| 2 | the reagent cabinet | reactions the player may be dealt | bought from suppliers with credit; a lost run pays credit for every round beaten |
| 3 | the helper shelf | helpers that may be offered | each arrives by its own deed |
| 4 | the kits | ways to start a run | each arrives by its own deed |
| 5 | the book | real compounds made | a compound is entered the first time the molecule on the page is that compound |
| 6 | the record | best total, longest cascade, furthest round, kept for each kit | by playing |
| 7 | the stakes | a harder run | each win opens the next |

Sigils come after all of this and are not on the bench until then.

### Order things appear

Revised after review, 2026-11-11. The reviewer failed the first order: a player could not see what there was to earn. The owner's rule is that nothing later than the player's stage is shown. Both are kept this way: **each object shows what is held, and the one next thing to earn as a blank outline with its count.** Never the whole list.

1. First run: no bench. A lost run goes straight to a new run.
2. After the first run the bench appears with the record, the kits (plain, and the outline of the next kit with its count) and the book (empty, with the outline of the first compound).
3. The reagent cabinet and the first supplier appear when round three is first beaten.
4. The helper shelf appears with the first helper, and then always shows the outline of the next helper with its count.
5. The jars appear the first time three waters have come off.
6. The stakes appear after the first win.

### Kits

A kit is chosen before a run. It sets the starting pool and one rule. It is the reason two runs start differently. A kit must change what the player does on the first page, not only a number. One kit is held at the start; the rest are earned in the order below, one outline at a time.

Each must be measured on the rig before it is offered, and changed if the median player's rounds beaten moves by more than one round against the plain kit.

| Kit | Starting pool | Rule | Earned by |
|---|---|---|---|
| plain | the six starters | none | held from the start |
| lean | hydrate, oxidize, dehydrate, grow | each reaction has five uses a round | a round beaten using three reactions only |
| long | the starters with extend in place of reduce | molecules are dealt one size up | a cascade of six steps |
| gap | the starters | every molecule is dealt with one C=O taken out of its chain, so each round opens with a repair | three rounds beaten in which the first page had no cascade |
| phenol | the starters with add phenol in place of reduce | none | a molecule of forty atoms |
| anchor | the starters | the first line fired in a run is kept: it fires by itself, in that order, at the start of every later page, without spending uses | the same line of three fired on all three pages of a round |
| reverse | the starters | a line fires last circle first, and a zip starts from the far end of the chain | a win |

Held back: a kit that is offered helpers only (it needs a deeper helper shelf first). Cut: a kit that made weld and snap count double, because those two were measured as not making cascades longer.

### The book

- A list of real compounds that can be reached by play. Only compounds a builder has shown can be reached on the rig go in the list.
- First candidates: aspirin, vanillin, the Wieland-Miescher ketone, norbornene, a ladder polyether, and cholesterol once fold is built.
- A compound is entered at the moment the molecule on the page matches it, on any page.
- The page shows the compound's name once at that moment and the entry is kept.
- Each entry pays credit once.

### Stakes

After a win the next stake opens. A stake must change a rule, not only raise the number, or it is a grind. First proposals, each on top of the last: 1 the number is higher; 2 one fewer redraw a round; 3 the three rule-change rounds are drawn from a harder set; 4 a wasted reaction costs two uses; 5 the hand is four. A record is kept for each kit at each stake, shown as a grid that fills in.

## What the review found that is not answered yet

- By run 60 there is little left. The cure is content: more helpers, the other three cascades (fold, run, link), more molecules, more compounds in the book. This is the standing work, not a design gap.
- Rounds 3, 6 and 9 need names and marks so a player knows them on sight.
- The molecule not carrying is a weakness for the feeling of a build growing. One small way: the last OH or C=O left on the final page is carried onto a free end of the next molecule. Not built. The owner has not decided.

## What is built on 2026-11-11

| Thing | State |
|---|---|
| page, round, run of nine | built |
| take one of three, coins, reroll | built |
| suppliers and credit | built |
| stages that hide later layers | built, on the old order |
| jars and the first homunculi | being built; what each homunculus does is being decided again |
| helper deeds | not built: five helpers are offered from stage 2 |
| kits | not built |
| the bench as one screen | not built |
| the book | not built |
| record for each kit | not built |
| stakes | the factor exists; the choice is not on a screen |

## The pool in a run stays small (the owner, 2026-11-11)

Reactions are unlocked for good over many runs, and the list of unlocked ones may grow long. The pool carried in one run may not, or there is no strategy. The model is Vampire Survivors: many things unlocked, few slots in a run.

First proposal, to be measured: a run's pool holds at most eight reactions. It starts with the kit's six. Taking a ninth means putting one back. Which unlocked reactions are offered in a run is drawn from everything unlocked, so two runs see different ones.
