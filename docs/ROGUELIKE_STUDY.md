# What successful roguelikes do, and what it means for Overreact

Written 9 November 2026 on the `steam` branch. Each claim is marked by how well it is supported.

- **Dev** means the developer said it in an interview or post.
- **Analysis** means a critic or a design write-up said it.
- **Own** means it comes from the writer's general knowledge and was not checked against a source in this pass.

Not researched in this pass: Blue Prince, Luck be a Landlord, Brotato, The Binding of Isaac, Risk of Rain 2, Noita, Into the Breach, Cult of the Lamb. Several sources below are secondary. One fetch of the Dead Cells art article and one of the Balatro joker guidelines failed, so those rest on search summaries.

## 1. Art style and screen layout

| Game | What the art does | Support |
|---|---|---|
| Balatro | The look started from pixel art drawn by one person with a mouse. Shaders were added to make it feel tactile, the CRT look came out of that, and the developer leaned into it. | Dev |
| Balatro | A house rule ties the pieces together: every Joker except the legendary ones has the word "Joker" somewhere in its art. | Dev |
| Hades | Planned as painterly, then changed to pen and ink when the tone changed. Pen and ink was also faster to produce, which mattered for the studio's largest game. Influences were Greek art, Mike Mignola and poster art. | Dev |
| Hades | Game design and story lead. Art ideas are provisional until those are settled. A colour script of the whole game was made early to find weak areas. | Dev |
| Dead Cells | One artist for about a year. Characters were built and animated as 3D models, then converted to low-resolution sprites by an in-house tool, so retakes did not need redrawing. | Analysis of a dev article |
| Slay the Spire | Information first. Fixed card anatomy: cost top left, picture in the middle, text below, rarity on the border. One colour per class. One palette per act. | Analysis |
| Slay the Spire | The game came together when each enemy showed an icon for its next move. | Dev, via summaries |
| Inscryption | No conventional interface. The information sits on objects on a table in a physical room. The solo developer used post-processing and shaders in place of bespoke assets, made no 3D art from scratch, and worried constantly about card legibility. | Dev and analysis |
| Vampire Survivors | The chest opening borrows from slot machines, where the developer used to work. The assets are cheap and the clarity comes from tuning. | Analysis |

### What these share
1. **One strong constraint.** Each look comes from a limit the team accepted: one artist, one tool, one line style.
2. **One unifying layer.** Balatro's shader and Inscryption's post-processing make simple assets belong together.
3. **A style chosen for production speed.** Hades and Dead Cells both picked the method a small team could sustain across hundreds of assets.
4. **Information before decoration.** Slay the Spire sold on readability with plain art.
5. **Fixed anatomy for the pieces.** A player learns where to look once.
6. **Colour carries meaning.** One colour per class or per quantity, used everywhere.
7. **Readings can live on objects.** Inscryption proves a card roguelike can drop the flat interface entirely.

### What this means for Overreact
- The art rules already set for this game match Inscryption most closely: objects are 3D and readings are drawn on the objects.
- The path test breaks those rules. It is a flat page with text on it, which is why it read as a web page.
- The game has no unifying layer and no house rule for its pieces yet. Those two are the cheapest missing parts.
- The reagents need a fixed anatomy. In the test each one has a fixed place on the ring, which is a start.

## 2. Meta-progression and unlocks

| Game | How it works | Support |
|---|---|---|
| Slay the Spire | Unlocks add cards and relics, not power. Ascension adds difficulty in steps, per character, and a loss does not drop the level. | Analysis and community |
| Balatro | 15 decks and 8 stakes form a grid of 120 runs to clear. Decks change rules and stakes add difficulty. Neither adds power. | Analysis |
| Balatro | Stakes, unlocks and challenges were added to push players out of comfort zones and teach the design space, not only to add hours. | Analysis of dev intent |
| Balatro | Players complain that climbing the stakes again for each deck is a grind. | Community |
| Hades | The Mirror of Night makes the character meaningfully stronger between runs, so knowledge and power grow together. | Dev |
| Hades | The Pact of Punishment opens after the first win and lets the player choose which difficulty conditions to add. It was inspired by Ascension. | Dev |
| Hades | Death returns story. The game watches the run and plays events that fit what happened, so each attempt feels worth making. | Dev |
| Dead Cells | The metagame exists so that a run that ends early still feels like progress. Character strength should track player skill and not be held back artificially. | Dev |
| Dead Cells | Cells are spent between areas and lost on death. Blueprints must be carried to a collector to count. Boss cells add difficulty tiers. | Own |

### What these share
1. **Two tracks.** One track widens what can appear in a run. The other raises difficulty by the player's choice.
2. **A failed run still pays something.** It pays in unlock progress, currency or story.
3. **Difficulty is opt-in and built from named conditions**, not a single slider.
4. **Power between runs is a real split.** Hades and Dead Cells grant it. Slay the Spire and Balatro do not.

### What this means for Overreact
- The request was for deep unlock trees with real returns on purchases. That is the Hades and Dead Cells model, not the Balatro model. The two should not be mixed up when designing it.
- Overreact already has kits, stacked difficulty levels and named feats. It has no currency that survives a failed run and no tree to spend it on.
- A fit that respects both: a spend between runs that buys options and small permanent tools, and a set of named handicaps the player switches on for more reward.

## 3. Run structure and build depth

| Game | How it works | Support |
|---|---|---|
| Balatro | LocalThunk's rule for Jokers: effects should act on the game's core words and numbers so that combinations emerge. A Joker that names one specific partner will rarely find it in a large pool. | Dev |
| Balatro | Unspent money earns interest, 1 for every 5 held up to a cap. Rerolls cost more each time within one shop. | Analysis |
| Balatro | Boss blinds change a rule for one round, and the milder ones come first. | Analysis |
| Balatro | Additive effects are forgettable and multiplicative effects are memorable. | Analysis |
| Monster Train | A run is eight bosses. The chosen path decides which shops and events appear. Cards are added and removed often. | Analysis |
| Dead Cells | Players optimise for efficiency, not for the style the designers pictured. The fix that worked was to give the strong option a cost, not to remove it. | Dev |

### What these share
1. **Build pieces key off shared nouns**, so any two can interact.
2. **The shop has a savings decision.** Holding money pays, so every purchase has a price beyond its cost.
3. **Something attacks the build on a schedule** the player can see coming.
4. **The dominant line gets a cost.**

### What this means for Overreact
- Most equipment names specific reagents, for example a bonus on Oxidise sites only. By LocalThunk's rule this makes combinations rare. Equipment should key off the shared nouns: site, chain, yield, batch, group type, steps left.
- The path survey found one route winning most orders. Dead Cells met the same problem and solved it with a cost on the strong line.
- Held surplus already earns interest. Order conditions exist but only twice per run.

## 4. Sound, feedback and onboarding

| Game | How it works | Support |
|---|---|---|
| Dead Cells | Feedback is modelled on fighting games. A critical hit freezes the game for one frame, then slows it for a few tenths of a second, with a spray and its own sound. | Dev |
| Dead Cells | Control starts within a second. There is no cutscene and no objective marker. | Analysis |
| Balatro | The sound escalates as the numbers tick up. The music is widely praised and was made by a freelance composer. | Analysis |
| Balatro | The game borrows poker's words, so the nouns are already known. The tutorial is light, and the game names the hand as cards are selected. | Analysis |
| Hades | One person did all sound design and voice direction. The music was implemented so it holds up over hundreds of hours. | Dev |
| Vampire Survivors | The chest jingle is the reward moment players remember. | Analysis |

### What this means for Overreact
- Chemistry gives no borrowed words to a general player. The product preview is the substitute, because it shows the result without naming it. Naming the product on hover would do what Balatro's hand name does.
- All sound is synthesised and there is no composed music. Every game above has a recognisable score.
- The first input should come within a second of starting a run.

## 5. Sources
- Balatro: [r/Games AMA](https://axebps-redlib.hf.space/r/Games/comments/1bdtmlg/ama_i_am_localthunk_developer_and_artist_for), [Playday interview](https://playday.one/2024/03/09/there-is-a-lot-more-design-to-explore-within-balatro-an-interview-with-localthunk/), [Joker design guidelines](https://lr.sudovanilla.org/r/balatro/comments/1czo9g0/guidelines_for_joker_design), [decks and stakes analysis](https://saschb2b.github.io/game-mechanics/games/balatro/decks-and-stakes), [shop economy analysis](https://saschb2b.github.io/game-mechanics/games/balatro/shop-economy), [Unpacking Balatro](https://errorandexp.substack.com/p/unpacking-balatros-addicting-game), [NY Game Critics](https://nygamecritics.com/2024/12/13/games-of-the-year-balatro-can-grab-anyones-attention-even-players-who-didnt-previously-like-poker/), [Why it feels familiar](https://games.gg/news/balatro-isnt-poker-but-heres-why-it-feels-so-familiar/)
- Hades: [MCV on the art of Hades](https://mcvuk.com/business-news/behind-the-art-of-hades-we-value-artistic-integrity-and-excellence-in-artistic-craft-at-supergiant-however-were-first-and-foremost-a-game-design-lead-team/), [Game Developer on narrative rewards](https://www.gamedeveloper.com/design/how-supergiant-weaves-narrative-rewards-into-i-hades-i-cycle-of-perpetual-death), [Tom's Guide interview](https://www.tomsguide.com/features/hades-exclusive-interview-supergiant), [Echoes and Dust with Darren Korb](https://echoesanddust.com/?p=91735), [Jen Zee on Wikipedia](https://en.wikipedia.org/wiki/Jen_Zee)
- Dead Cells: [80 Level on the art pipeline](https://80.lv/articles/case-study-dead-cells-character-art-pipeline/), [Game Developer on watching players](https://gamedeveloper.com/design/how-watching-people-play-i-dead-cells-i-incorrectly-influenced-its-designers), [Game Informer interview](https://www.gameinformer.com/interview/2018/12/30/dead-cells-designer-discusses-scrapped-ideas-roguelikes-and-the-potential-for), [Game Developer on weapons](https://www.gamedeveloper.com/design/designing-each-of-the-50-weapons-in-i-dead-cells-i-to-feel-distinctive)
- Slay the Spire: [visual design analysis](https://halabaojia.pages.dev/collection/20260112-slay-the-spire-visual-design-analysis), [Ascension analysis](https://saschb2b.github.io/game-mechanics/games/slay-the-spire/ascension), [Road to the IGF](https://www.gamedeveloper.com/game-platforms/road-to-the-igf-mega-crit-games-i-slay-the-spire-i-), [PC Gamer best design 2019](https://pcgamer.com/best-design-2019-slay-the-spire)
- Inscryption: [Game Developer interview](https://www.gamedeveloper.com/design/how-game-jam-sacrifices-became-inscryption), [Problem Machine essay](https://www.patreon.com/ProblemMachine/posts/inscryption-and-58748955), [Wikipedia](https://en.wikipedia.org/wiki/Inscryption)
- Vampire Survivors: [University of Portsmouth blog](https://csd.docstore.port.ac.uk/news-events-and-blogs/blogs/popular-culture/vampire-survivors-how-developers-used-gambling-psychology-to-create-a-bafta-winning-game), [80 Level interview](https://80.lv/articles/vampire-survivors-developer-on-its-design-sudden-success), [Wikipedia](https://en.wikipedia.org/wiki/Vampire_Survivors)
- Monster Train: [PC Gamer review](https://www.pcgamer.com/monster-train-review/), [Going Rogue: Monster Train](https://medium.com/@gwenckatz/going-rogue-monster-train-de73fde50fea)

---

# Part 2. The wide comparison: core loop, run, meta loop, longevity

Added 9 November 2026. Two research agents covered 24 games, one on the core loop and run, one on the meta loop and longevity. Their reports were then spot-checked and a few gaps filled by hand. The same marks apply: **Dev**, **Analysis**, **Own**, plus **Wiki** for a plain fact from an encyclopedia or fan wiki and **Data** for a stats site.

## How far to trust this part
- **No developer explains a structural number.** Neither agent found a statement of why Balatro has eight antes or five joker slots, why Slay the Spire has three acts, or why any cap is 5 or 6. Those numbers cannot be borrowed with their reasoning, because the reasoning is not published.
- **Six games came back empty on the core loop:** Rogue Legacy 2, Enter the Gungeon, Noita, Blue Prince, Cult of the Lamb, Cobalt Core. Peglin and Cobalt Core came back empty on the meta loop.
- **Hours-played data is nearly absent.** Only Slay the Spire and Balatro have any figures, from secondary sites that disagree.
- **Many plain facts are Own.** They are listed as leads, not as evidence.

## 5. Core loop and run

| Game | One decision | A run | Choice points | Build limit | Support |
|---|---|---|---|---|---|
| Balatro | Pick up to 5 cards. 4 hands and 3 discards per blind, hand of 8. | 8 antes of 3 blinds, 24 blinds. The developer plays "a couple of runs" in about an hour. | Shop after every blind | 5 joker slots, about 150 jokers | Wiki, Dev for session length |
| Slay the Spire | Play cards within 3 energy | 3 acts, about 50 floors. Players report 30 to 90 minutes. | 1 of 3 cards after fights, map paths, shops | No cap. A big deck dilutes itself. | Wiki, community |
| Monster Train | Place units on floors, play spells | 8 to 10 battles, about 30 minutes | Path choice, frequent add and remove | Floor capacity | Analysis, sources disagree on count |
| Luck be a Landlord | Pick 1 of 3 symbols after each spin | 12 rent payments, each about 6 to 8 spins apart | After every spin | A fixed grid | Wiki, Analysis |
| Brotato | Buy in a shop between waves | 20 waves of 20 to 90 seconds | Shop after every wave | 6 weapons | Dev for waves, Wiki for cap |
| Vampire Survivors | Pick 1 of 3 on level-up | One stage of 15, 20 or 30 minutes | Level-ups, chests | 6 weapons and 6 accessories | Wiki |
| Dicey Dungeons | Assign dice to equipment | 6 episodes per character | Equipment at each level | Per character, for example a 6-slot spellbook | Dev for the slot count |
| Peglin | Aim one shot | 3 acts | Map, relic choice of 2 | Orb deck, 117 orbs and 183 relics | Wiki |
| Hades, Dead Cells, FTL, Isaac, Risk of Rain 2 | Real-time play | 20 to 60 minutes | After rooms or areas | Varies, several uncapped | Own |

**Balatro's score target** rises from 300 at ante 1 to 50,000 at ante 8, about 167 times, and each step is a smaller multiple than the last. Wiki.

### Developer statements that bear on structure
- **Into the Breach:** numbers are kept small so the step from 1 to 2 matters, and every map fits on one screen. Analysis of a Dev talk.
- **Dicey Dungeons:** an unused die is a design flaw, because the turn feels wasted. Dev.
- **Dead Cells:** fewer items with more impact, so runs differ. Dev.
- **Balatro:** jokers need short text, and balance is tuned by feel in small edits. Dev.
- **Slay the Spire 2:** the team tried a smaller card pool and players rejected it. Dev.
- **Risk of Rain:** difficulty follows the clock to keep players moving. Tying it to kill speed was tried and dropped because it flattened the highs and lows. Wiki relaying Dev.
- **Monster Train:** unlocks that only appear after a top-difficulty win were a mistake, because most players never saw them. Dev.

### Patterns
1. **Short rounds go with many rounds.** Brotato has 20 waves under 90 seconds. Balatro has 24 blinds of a few minutes. Slay the Spire has about 50 fights. A whole run still lands between 20 and 60 minutes. This is an inference from the table, and no source states it.
2. **Build caps sit near 5 or 6 where there is a cap,** against pools of 100 or more. Slay the Spire, Isaac and Risk of Rain 2 have no cap and rely on dilution or stacking.
3. **A choice follows every encounter** in the score builders: Balatro, Brotato, Luck be a Landlord.
4. **The thing that pushes back attacks a rule, not only a number:** boss blinds, Peglin bosses that change the board.
5. **Bad luck always has a verb:** discards and rerolls, card removal, path choice.
6. **Open-ended games scale by clock, authored games use a small fixed count.**

## 6. Meta loop and longevity

| Game | What carries over | What a failed run pays | Ladder after a win | Support |
|---|---|---|---|---|
| Balatro | Unlocks only | Nothing found | 8 stakes, per deck, chosen by the player | Wiki |
| Slay the Spire | Unlocks only | Points toward unlocks, win or lose | 20 Ascensions per character | Wiki |
| Binding of Isaac | Unlocks only, about 33 characters, 22 endings | Nothing special | Not found | Wiki |
| Monster Train | Clan levels unlock cards and artefacts | Clan progress, not verified | Covenant levels, 20 or 25 | Dev, Analysis |
| Brotato | Characters unlock by kills, wins and challenges | Kills count toward unlocks | Danger 0 to 5 | Analysis |
| Hades | Permanent power and story | Currency and new dialogue every run | Pact of Punishment, player-chosen conditions | Wiki, Dev |
| Dead Cells | Permanent upgrades and unlocks | Cells, but only once banked | 5 Boss Cells | Wiki |
| Rogue Legacy 2 | Permanent upgrades bought with gold | Gold | Not found | Wiki |
| Vampire Survivors | Gold buys characters and permanent power-ups | Gold from every run | Hyper, limit break, endless | Wiki |
| Inscryption | Story, plus a card made from the dead character | The death card | Kaycee's Mod challenge levels | Wiki |
| Wildfrost | The winning leader becomes the next boss | Allies can survive a lost run | Storm Bells | Wiki |
| Into the Breach | One pilot keeps experience | The pilot sent back | An added hardest setting | Wiki |
| Blue Prince | Knowledge and a few small permanent boosts | What was learned | None, harder puzzles after the credits | Wiki |

### Developer statements on why
- **Balatro:** stakes, unlocks and challenges push players into parts of the design they would skip, and give those who want it an optional list of goals. He pictures a couple of runs in about an hour, and a low-stakes feel closer to a crossword. Dev.
- **Dead Cells:** the metagame exists so that a run ending early still feels like progress. Dev.
- **Hades:** story and permanent progress were added so that dying stays interesting and no run feels wasted. Dev.
- **Monster Train:** fast power with no experience grind is the appeal of the genre, and content gated behind top difficulty goes unseen. Dev.

### Patterns
1. **A failed run pays in one of three ways:** currency (Hades, Dead Cells, Vampire Survivors), state that changes the next run (Inscryption, Wildfrost, Into the Breach), or progress toward unlocks (Slay the Spire, Brotato).
2. **A ladder per character or deck multiplies replay and draws grind complaints.** Slay the Spire and Balatro both do it. Dead Cells uses one global ladder.
3. **Unlocks must be reachable.** Monster Train's own developer says so.
4. **The long-lived games share a large pool, a ladder or secrets, and years of new content.** Isaac, Risk of Rain 2, Vampire Survivors, Dead Cells and Slay the Spire all fit. Content updates seem to extend life more than any meta system, but with no hours data this is a hypothesis.
5. **Complaints by model:** power between runs makes the early game trivial and invites grind. Variety alone leaves little after the first win. Knowledge alone can be opaque.

### The little longevity data found
- **Slay the Spire:** median playtime between about 20 and 35 hours depending on the source and year, with a far higher mean. Data, sources disagree.
- **Balatro:** about 8 hours to a first finish and about 250 hours for full completion, from secondary copies of HowLongToBeat. Data, weak.

## 7. What Overreact's own tests add
- A round is three clicks and takes well under a minute. That is shorter than every game above except a Luck be a Landlord spin.
- With the starter rack, one route wins most orders. Three steps per order and an offer of four reagents cut the luck of the deal from 25 to 150 times down to about 5 to 7 times.
- A marked group that loses the order when destroyed leaves a median of 4 legal paths. As a reward for keeping it, the best play still destroys it on 59% of orders.
- One piece of equipment changes the best line on 0% to 44% of orders. Across twelve builds the median order has two different best lines.

## 8. Three whole-game structures for Overreact

Each is a complete shape. None keeps a number because Balatro has it.

### Structure 1: many short pages
- **Round:** one page, three steps, four reagents on offer.
- **Run:** 15 pages in three sections of five, about 18 minutes. The last page of each section is an inspection that attacks one kind of build, shown from the start of the section.
- **Between pages:** take 1 of 3 after every page. A full supply page only after each inspection.
- **Build limit:** six pieces of equipment, with a pool to grow past 60. The rack holds at most twelve bottles.
- **Growth:** the quota rises about 40 times across the run, and batch stays in small whole numbers.
- **Meta:** every stamped page pays credit. One global set of named handicaps chosen by the player, not a ladder per kit.
- **Drawn from:** Brotato for wave count and a choice after every wave, Vampire Survivors for 1 of 3, Into the Breach for small numbers, Monster Train for reachable unlocks, Dead Cells for one global ladder.
- **Risk:** fifteen repeats of a three-click round may feel the same unless the molecules and reagents vary a great deal.

### Structure 2: one molecule, one long synthesis
- **Round:** one page, three steps. The product of a page is the starting molecule of the next page.
- **Run:** three syntheses of three pages each, nine pages, about 15 minutes. A chain can run across pages, so one synthesis can be a chain of nine.
- **The risk choice:** at the end of a page, stamp to bank what the chain is worth, or carry it to the next page for more. A carried chain that breaks pays less. This is the overreact decision.
- **Between pages:** take 1 of 3 inside a synthesis. A supply page between syntheses.
- **Build limit:** four pieces of equipment while the pool is small, rising as the pool grows.
- **Growth:** sites give the base number and chain length gives the multiplier. Each synthesis ends on a target, such as delivering a ketone, which acts as the boss.
- **Meta:** every stamped page pays credit. Chains made for the first time fill a reference page, which is the collection.
- **Drawn from:** Dead Cells for banking under risk, Slay the Spire for three acts each with a boss, Blue Prince for knowledge kept between runs, and this project's own first idea that a product becomes the next starting material.
- **Risk:** not measured. A molecule may run out of places to react well before nine steps. This has to be surveyed before anything is built.

### Structure 3: draft every page, pay every third
- **Round:** one page, three steps.
- **Run:** twelve pages with a deadline every third page, about 12 minutes. The quota is the total of the three pages, so one bad deal is averaged out.
- **Between pages:** take 1 of 3 after every page. There is no shop and no money inside a run.
- **Build limit:** no cap on equipment, but each piece takes bench space out of seven, and removals are scarce.
- **Growth:** mostly additive, with the quota rising about 20 times.
- **Meta:** credit for every deadline met. A ladder per kit.
- **Drawn from:** Luck be a Landlord for a pick after every spin and rent deadlines, Slay the Spire for dilution in place of a cap, Vampire Survivors for a short fixed length.
- **Risk:** the weakest big-number payoff of the three, and the request was for a power fantasy.

### Recommendation
Survey Structure 2 first. It is the only one built on what this game has that the others do not, and it puts chaining at the centre. If molecules cannot sustain long syntheses, fall back to Structure 1 and take the summed quota from Structure 3 to soften bad deals.

## Part 3: Raccoin (coin pusher roguelike, Doraccoon and Playstack, March 2026)

Sources are two reviews and search summaries of others. Nothing here was played. Treat numbers as reported, not checked.

What it is. The base action is dropping coins from the left or the right onto a pusher shelf. Reviewers call that action dull on its own. Everything that holds attention is layered on top of it.

Loop inside a round. Coins that fall off the edge score. Falls in quick succession raise a combo, and a full combo meter fires a bonus wheel, a shower of coins or a coin tower. Special coins sit in the machine and act on touch, while they stay in the machine, or at the start or end of a round. The machine keeps its contents from round to round, so a round also sets up the next one.

Loop of a run. 15 rounds, each with a higher score to reach. A shop after every round. Four kinds of thing to hold: special coins (over 150), chips fitted to a card with a limit (passives), prizes (used once) and stickers on the table. Bad coins are added every few rounds and are cleared by pushing them out.

Before a run. Five choices: cabinet, character (6), ticket (8 levels of difficulty), card (one large passive) and bonus wheel.

Between runs. Unlocks come in chains tied to a goal with a named character: round 9 with the Biologist opens the Chemist, elemental coins and a kind of prize; round 10 with the Chemist opens the Trader, chaos coins and the editable wheel.

Complaints. A wall at rounds 9 and 10. Luck over skill. Waiting for the shelf to move. A bonus wheel that pays little unless the meter is full. A base action too simple to carry interest.

What Overreact can take, and what it should not.

| Raccoin | Overreact now | Gap |
| --- | --- | --- |
| The machine keeps its coins between rounds | Each round starts from a new molecule | Nothing made in one round shapes the next |
| A combo meter that fires an event mid-round | The row raises a number | No event fires inside a round |
| Coins, chips, prizes, stickers | Reagents and equipment | Nothing used once, nothing fixed to the page |
| Bad coins added on a schedule, cleared by play | None | Nothing unwanted to deal with |
| Five choices before a run | None | Starting notebooks, workers and habits are planned |
| Unlock chains tied to a goal with a character | Credit buys the next supplier | Contracts are planned |
| Wall at rounds 9 and 10 | Number to beat grows 1.85 times a round | Same risk, untested past round 5 |
| Waiting for the shelf | No waiting | Keep it that way |
