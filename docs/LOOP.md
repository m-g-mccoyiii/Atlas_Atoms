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

Nothing is on the bench before it has happened once.

1. First run: no bench. A lost run goes straight to a new run.
2. The record appears after the first run.
3. The reagent cabinet and the first supplier appear when round three is first beaten.
4. The helper shelf appears with the first helper.
5. The jars appear the first time three waters have come off.
6. The kits appear when the second kit is earned.
7. The book appears when the first real compound is made.
8. The stakes appear after the first win.

### Kits

A kit is chosen before a run. It sets the starting pool and one rule. It is the reason two runs start differently. One kit is held at the start; the rest are earned.

These are first proposals. Each must be measured on the rig before it is offered, and changed if the median player's rounds beaten moves by more than one round against the plain kit.

| Kit | Starting pool | Rule | Earned by |
|---|---|---|---|
| plain | the six starters | none | held from the start |
| long | the starters with extend in place of reduce | molecules are dealt one size up | a cascade of six steps |
| lean | hydrate, oxidize, dehydrate, grow | each reaction has five uses a round | a round beaten using three reactions only |
| ring | the starters with weld in place of hydroborate | a weld or a snap counts as two steps | twenty rings closed in one run |
| heavy | the starters with add phenol in place of reduce | two uses a round, each step adds 75 places | a molecule of forty atoms |
| flush | the starters | a helper is offered after every round, reactions never | five helpers held at once |

### The book

- A list of real compounds that can be reached by play. Only compounds a builder has shown can be reached on the rig go in the list.
- First candidates: aspirin, vanillin, the Wieland-Miescher ketone, norbornene, a ladder polyether, and cholesterol once fold is built.
- A compound is entered at the moment the molecule on the page matches it, on any page.
- The page shows the compound's name once at that moment and the entry is kept.
- Each entry pays credit once.

### Stakes

After a win the next stake opens. Each raises the number to beat (`ASSAYF` and the stakes factor in `path.js`). A record is kept for each kit at each stake.

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
