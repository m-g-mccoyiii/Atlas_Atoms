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
