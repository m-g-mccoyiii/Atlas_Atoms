# Overreact: writing the margin notes

2026-11-12. Rulings AI, AM, AM2, AM3 in `HARNESS.md`. The notes are in `apps/steam/js/react/notes_data.js`. The story they carry is in `STORY.md`. Nothing here is wired into the page yet: `scheme.js` still draws its three old lists (`TIER0`, `TIER1`, `TIER2`).

## What the notes are

One chemist's notes in the margin of a lab notebook, over a whole career. Funny first, then uneasy, then desperate, then calm. There are 335.

The owner's words: "things that are insane in the marginalia"; "more unhinged the deeper into chemistry as we go"; "a hundred or more messages... change with the number of unlocks... gradually more and more desperate about seeing HIS FACE, the thing being the king in yellow".

## The data

`AA.NOTES` is a list. Each note:

| Field | What it is |
|---|---|
| `t` | the text. `~word~` is struck out. `_word_` is underlined. Capitals are his own. |
| `depth` | `[min, max]` on the madness scale, 0 to 1 |
| `unlocks` | `[min, max]` share of all unlocks owned, 0 to 1. This is the story clock. |
| `when` | optional tag: the note is a reaction to something (list below) |
| `hand` | `neat`, `shaky` or `frantic` |
| `big` | optional `true`: written large, alone. Five notes have it. |

`AA.notesPick(state)` returns the notes that fit. `state` is `{ depth, unlocks, round, tag, homs, used }`.

- `tag` is one tag or a list. If any note with that tag fits, only those come back.
- With no tag (or none that fits), the untagged notes come back, plus the notes of the creatures named in `homs` (their keys in `path.js`: `water`, `h2`, `co2`, `acid`, `wood`, `salt`, `slime`, `seedling`, `ammonia`, `brimstone`).
- `used` is a list of texts already shown this run. They are left out unless nothing else is left.
- It never comes back empty. It widens the unlocks range first, then the depth.

`AA.notesDepth(unlocks, round, rounds, chain)` is the madness scale the notes were written for: 0.65 from the career, 0.30 from how far the run has gone, 0.05 from a long chain. A new player ends a nine-round run at 0.30. A player with everything starts a run at 0.65.

`AA.notesParse(t)` splits a text into pieces marked struck or underlined, for the pen.

### Tags

| Tag | Shown when |
|---|---|
| `start` | a run or round begins |
| `win`, `loss` | the spec is met, or not |
| `overreact` | the yield reaches the top mark |
| `chain` | a long run of reflexes is going |
| `waste` | a reagent acts nowhere, or a page sets nothing off |
| `shop`, `buy` | in the shop; something is bought |
| `unlock` | a finding is made |
| `instrument`, `sigil` | one is used |
| `gold`, `spec`, `catalog` | gold changes hands; the spec is shown; a catalog entry fills |
| `el:N`, `el:S`, `el:Cl`, `el:Br` | that element is on the molecule dealt |
| `hom:<key>` | that creature is owned or tapped |

Rule for the page: show a tagged note at most once a run for each tag. After that, use the untagged ones. Several tags have only one note in a band (see the table).

## The arc

| Band | Depth | Unlocks | Hand | What he is like |
|---|---|---|---|---|
| 1 sane | 0 to 0.2 | 0 to 0.4 | neat | A dry, able chemist. Coffee, labels, the landlord, the cat. Nothing odd at all. |
| 2 wrong | 0.2 to 0.4 | 0 to 0.6 | neat | Small wrong things, noticed and waved away. Sums that do not add up. Creatures behaving oddly. |
| 3 the book | 0.4 to 0.6 | 0.25 to 0.8 | shaky | A thin book turns up. It is a play. He reads act one. The creatures hum. First "he". Yellow is avoided. |
| 4 to see | 0.6 to 0.8 | 0.5 to 0.97 | shaky | He has read act two. He wants to see. Carcosa, the lake, two suns, a pale mask. He writes to HIM. |
| 5 desperate | 0.8 to 1 | 0.75 to 0.97 | frantic | Pleading and bargaining. Gold offered. The sign found. "The King" is written at last. |
| after | 0.6 to 1 | 0.97 to 1 | neat | Everything is found. Quiet, changed, terribly calm. "In Yellow" is written only here. |

Rules of the arc:

- In bands 1 and 2 nobody mentions a book, a play, HIM, Carcosa or a fear of yellow. Band 2 may hint (two shadows from one lamp, dim stars) if he waves it away.
- "he" for the King first appears in band 3, lower case and doubted. HE, HIM, HIS FACE in capitals from band 4. "The King" from band 5 and 0.8 of unlocks. "The King in Yellow" only after everything is found. After that he writes "He", calmly.
- HIS FACE is never described. A chin and a sleeve are the most anyone gets.
- The more is unlocked, the more he names what the player owns: creatures, sigils, the catalog, findings. Late on, the collection is the road to HIM.
- Callbacks are kept on purpose: "Do not lick", the eyebrows, the dirty window and the black stars, the string on the hydrogen creature, coffee is not a reagent, 12 + 7 = 20, the cat on the bench. Do not add a new note that uses one of these without paying it off.

## How many

| Tag | 1 sane | 2 wrong | 3 the book | 4 to see | 5 desperate | after | All |
|---|---|---|---|---|---|---|---|
| no tag | 17 | 16 | 18 | 19 | 19 | 12 | 101 |
| start | 3 | 2 | 2 | 2 | 2 | 2 | 13 |
| win | 3 | 2 | 2 | 2 | 2 | 2 | 13 |
| loss | 3 | 2 | 2 | 2 | 2 | 2 | 13 |
| overreact | 2 | 2 | 2 | 3 | 2 | 2 | 13 |
| chain | 2 | 2 | 2 | 2 | 2 | 1 | 11 |
| waste | 2 | 2 | 2 | 2 | 2 | 1 | 11 |
| shop | 2 | 2 | 2 | 2 | 2 | 1 | 11 |
| buy | 2 | 2 | 2 | 2 | 1 | 1 | 10 |
| unlock | 2 | 2 | 2 | 2 | 2 | 1 | 11 |
| instrument | 2 | 2 | 2 | 2 | 2 | 1 | 11 |
| sigil | 0 | 2 | 2 | 2 | 3 | 1 | 10 |
| gold | 2 | 1 | 1 | 2 | 2 | 1 | 9 |
| spec | 2 | 2 | 1 | 1 | 1 | 1 | 8 |
| catalog | 1 | 1 | 1 | 1 | 1 | 1 | 6 |
| el:N, el:S, el:Cl, el:Br | 1 each | 1 each | 1 each | 1 each | 1 each | 1 each | 6 each |
| each of the ten creatures | 1 | 1 | 1 | 1 | 1 | 1 | 6 each |
| **All** | **59** | **56** | **57** | **60** | **59** | **44** | **335** |

Sigils are not owned in band 1, so it has no sigil notes. Hands: 160 neat, 114 shaky, 61 frantic. Fifteen notes run past 12 words; the longest is 17.

Thin spots, to fill next: the four elements, `catalog`, `spec` and `gold` have one note in most bands.

## The rights rule

- Allowed sources: Robert W. Chambers, *The King in Yellow* (1895), and Ambrose Bierce's earlier Carcosa and Hali. Both are in the public domain.
- From them we may use: the play that harms its readers, its two acts, Carcosa, the lake of Hali, the Hyades, the Pallid Mask, the tatters of the King, the Yellow Sign as an idea, Cassilda and Camilla, twin suns, black stars.
- Not allowed: anything from later writers or from games. No names from Lovecraft's stories. No "Hastur". Nothing from tabletop or video games.
- Never draw, describe or point to the well-known three-armed Yellow Sign. It is a 1989 game design and is not ours to use. Our sign is our own mark (below).
- Do not quote Chambers at length. A few words at a time at most, and our own wording is better.
- The cold reader marked one line as too close to a later writer (a colour with no name). It was rewritten.

## Writing more

- 2 to 12 words. A few may run to 18.
- A joke first. Dread second. No gore, nothing grim for its own sake, nothing a store would flag. No modern slang.
- One joke per note, and no joke twice. The cold reader found these overused; do not add more: handwriting that is not his, one thing too many, a clock gone wrong, things all facing one way, a note ending on a short question.
- Chemistry words are the game's own (`NAMES.md`) and must mean what they mean in the game: yield, the spec, reagent, reflex, runoff, finding, catalog, inspection, credit, gold; oxidize, reduce, hydrate, dehydrate, hydroborate; tuck, weld, knit, pair, strip.
- A creature note fits what the creature does (`HOMUNCULI.md`).
- Vary the shape: a question, a list, a struck word, an underline, capitals, a letter.

## The last sigil: our own yellow sign

The owner: "Perhaps the final sigil can be our version of the yellow sign and it lets you sacrifice gold or something to do things (the most complex tradeoffs)". A sigil breaks or changes one rule (ruling AN). Three ideas for the sigil designers. None is tested on the engine. Each mark is ours and is described in words; none has three arms or turns about a centre.

### 1. The Open Crown (pay to break any one rule, for a page)

The mark: one pen stroke that never lifts. A flat line, then five uneven points like a child's drawing of a crown. The fifth point is not finished: the line runs off the edge of the circle. One small dot sits under it, off to the left.

What it does: before any page, pay gold to switch off one rule of the player's choice for that page. The price doubles each time in a run. If the round ends at OVERREACT, the gold paid that round comes back. If it does not, the next spec goes up by the gold spent.

The tradeoff: gold also buys instruments, so every use is an instrument not bought; and it is a bet on reaching OVERREACT.

Notes that point to it: "Each sigil breaks one rule. How many rules stand between us?" / "The sign wants gold. So HE can be bought. So I am SAVED. So I am poor." / "Would HE take gold? Landlords do. Is HE grander than a landlord?"

### 2. The Mask (pay to have a group counted as another, and pay again to keep what it earned)

The mark: a tall narrow oval, a little crooked, with nothing inside it. One short line crosses its edge low on the right, like a tear in paper. It is drawn in two strokes that do not quite meet at the top.

What it does: pay gold and tap one group on the molecule. Until the round ends, every reflex and the spec read that group as another group the player names (a C=O as an OH, a Cl as an NH2). When the round ends the mask comes off. Pay the same gold again to keep the yield made through it, or keep the gold and lose half of that yield.

The tradeoff: the price is paid twice or the gain is halved, and the choice is made after the player has seen what the mask earned. A masked group cannot feed a creature.

Notes that point to it: "A pale mask in the steam. Asked it to unmask. It laughed." / "No mask. No MASK? Then what have I been looking at." / "No mask. I checked. Twice, as a chemist should."

### 3. The Tatters (pay to break a rule for the whole run, seven times, each one dearer)

The mark: a short thick bar with seven strokes hanging from it, all of different lengths, like the torn hem of a cloth. A stroke is rubbed out each time the sign is used.

What it does: at the start of any round, pay gold to tear one stroke off. Each tear breaks one rule for the rest of the run (the player picks from three offered). Each tear costs more than the last, raises every later spec by a tenth, and shuts one place in the shop. If all seven are torn, the last page of the run counts three times and all gold left is taken.

The tradeoff: it is a plan for the whole run. Early tears are cheap and last longest but make every later round harder and the shop smaller. The seventh tear is only worth it for a player who can still meet the spec with seven rules gone.

Notes that point to it: "Hung up the lab coat. It hangs in tatters. It was new." / "Tatters. I saw tatters. The hem of HIM, across page three." / "All my gold for a look. Half for a glance. A coin for the hem?" / "The sign took the coins. Then the SHINE off the rest."

Which I would build first: the Tatters. It asks the most of the player across a whole run, and it is the one the other two cannot be mistaken for. The Open Crown is the simplest to build and test.

## How it was checked

- No node on this machine. The file was read by a Python script that checks the brackets and strings of the data part, reads every row with a pattern, and counts bands, tags, word lengths, repeats, banned names, and where "King" and "in Yellow" first appear. The three functions at the bottom of the file have not been run.
- One fresh sub-agent read all the notes cold. It marked about 45 weak lines, 20 groups of repeated jokes, one borrowed image, three breaks in the arc and 35 long lines. About 120 lines were rewritten or cut down and 20 were added. The rewritten lines have not had a second cold read.
