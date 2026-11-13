# Overreact: writing the margin notes

2026-11-13, second writing. Rulings AI, AM, AM2, AM3, AM4, AM5 in `HARNESS.md`. The notes are in `apps/steam/js/react/notes_data.js`. The story they carry is in `STORY.md`. The first writing (12 November, 335 notes in six bands, the thread locked to the share of unlocks) is replaced: every note was rewritten after AM5.

## What the notes are

One working chemist's notes to himself in the margin of a lab notebook. There are 556. 220 are plain notes about the work. 336 are thread lines: the thin book, someone in the room, the King in Yellow.

The owner's words:

- "things that are insane in the marginalia"; "more unhinged the deeper into chemistry as we go" (AM).
- "gradually more and more desperate about seeing HIS FACE, the thing being the king in yellow" (AM3).
- "I feel like the angle of the king in yellow parts need to be peppered a bit better and can't only come from a full 3 run prestige but I do not want you to have it be Redditor stupid extra spoopy shit" (AM4).
- On a clipped, wry sample line: "The dry example you gave is a classic sign of Redditor slop stop it" (AM5).

## Tone

The rule, from AM4 and AM5: not "Redditor stupid extra spoopy shit", and not "Redditor slop" of the dry kind either. Two registers are out, equally:

1. **Trying to be spooky.** Runs of capitals, "he is coming" lines, a word repeated for effect, eyes and watching, something behind him, a reveal held to the end of the line, a second sentence that proves the first is impossible, breakage of the text for effect, anything that nudges the reader to feel a chill.
2. **Trying to be witty.** The clipped quip with a wry tag on the end, performed deadpan, cute understatement, a punchline in brackets, mock formality, three-beat joke rhythm, a struck-out word as a gag, an aphorism, any line that could end with "lol".

What is written instead: a real chemist's notebook margin. The notes are for the writer, not for an audience: plain, specific, unperformed. Quantities, times, colours, smells, what was tried and what it did, reminders, small complaints, a name, a date. Whole ordinary sentences or honest fragments. If a line is funny it is because of what happened, stated flatly, and most lines are not jokes.

The thread arrives the same way. A wrong thing is recorded as plainly as a boiling point, with no comment and no reaction, and the next note is about glassware. The late part of the story is quiet: he leaves a card and a tin of gold on the sill and records that neither was moved.

The test for every line: would a person alone at a bench at 2 in the morning write this for himself, or is it written to be liked? Cut the second kind.

What the two cold readers found makes a good line: one observation with a number, a direction or a material in it; no second sentence that reacts; any action recorded is a bench action; usually one sentence.

### Ten lines kept

| Line | Why it stays |
|---|---|
| Balance reads 0.02 heavy. Subtract it until it is fixed. | A reminder to himself, with a figure. |
| Hydroborate needs the dry flask. The one on the rack is not dry. | What the work needs today. |
| Sulfur weighed 2.1 g on the paper and 2.1 g with the paper taken off. | A wrong thing, measured, no remark. |
| The distillate ran uphill in the condenser for about a minute. | Direction and time; he does not react. |
| The runoff jar was fuller after I emptied it. | One sentence, a bench action, nothing added. |
| Chlorine fumes went along the floor and under the door, against the draught. | A lab condition, recorded. |
| Five hundred reagents fired. The tally inside the back cover says 512. | Two numbers that do not agree. |
| Bound in a buff yellow cloth. The dye comes off on the fingers. | The book described as a material. |
| Ordered grey labels in place of the yellow ones. | An order to the supplier; the reason is not given. |
| Left the tin of gold on the sill overnight, 212; 212 in the morning. | The bargain, as a count. |

### Ten lines cut

| Line (first writing, or my first draft of this one) | Why it went |
|---|---|
| HIS FACE HIS FACE HIS... ran out of margin | Capitals and repetition for effect, then a joke about it. |
| OVERREACT. AND HE LOOKED UP | Loud. A sting in capitals. |
| Carcosa Carcosa Carcosa. Is that how one knocks? | A word repeated to be eerie, with a quip on the end. |
| Do not lick. (See Tuesday.) | Punchline in brackets. |
| Coffee is NOT a reagent. Tested twice. | Clipped quip with a wry tag. |
| Dear Sir: I enclose one (1) soul, slightly used. Kindly appear. | Comic formality, written for a reader. |
| Someone below is humming. Pike is away until Friday. | The second sentence is there to prove the first is impossible. |
| The cat will not come past the door tonight. | The animal that senses it: a stock chill. |
| Spec met. I hope that was satisfactory. | Politeness played as a bit. |
| I was a good chemist. I am still a careful one. | A polished sentence. Nobody writes that to himself. |

## The data

`AA.NOTES` is a list. Each note says in its own data what makes it eligible:

| Field | What it is |
|---|---|
| `t` | the text. `~word~` is struck out and `_word_` underlined (the pen supports both; no note uses either now). |
| `src` | `lab` for a plain note. For a thread line, the source it comes from: `run`, `event`, `hom`, `count`, `career`, `sign` (below). |
| `band` | 1 for a plain note; for a thread line, its rung plus 1 (2 to 6). |
| `thread`, `rung`, `till` | a thread line; the rung of the ladder it needs; the last rung at which it is still shown |
| `depth` | `[min, max]` on the scale of `AA.notesDepth`, 0 to 1. Used by the plain notes (fresh early, tired late). |
| `unlocks` | `[min, max]` share of all unlocks owned |
| `sign` | `[min, max]` laps of the sign taken (`meta.sign`, 0 to 3) |
| `round` | `[min, max]` round of the run |
| `count` | `[key, from, to]`: a lifetime count inside that window |
| `when` | optional tag: the note answers something that happened, an element dealt, or a creature owned |
| `hand` | `neat` or `shaky`. Nothing is `frantic` now. |
| `by` | `other`: written by the second hand (17 notes, lap 3) |
| `big` | written large, alone. One note has it. |

`AA.notesPick(state)` returns the notes that fit. `state` is `{ depth, unlocks, round, tag, homs, used, sign, counts, since, seen, seed }`. Only the first six are sent by the page today, and the function works with those alone. The list it returns is all thread lines or all plain notes: the budget decides which.

- `tag` is one tag or a list. If any note with that tag fits, only those come back.
- With no tag, the untagged notes come back, plus the notes of the creatures named in `homs`.
- `used` is the texts already shown this run, in the order shown. Nothing is repeated while anything else is left, and the plain notes since the last thread line are counted from it.
- `sign` is `meta.sign`. `counts` is the lifetime counts (`meta.countersAll` and `meta.counters` added up; the keys used are `runs`, `runs_won`, `runs_lost`, `reagents_fired`, `ring_steps` and `overreacts`, the last of which the rules do not count yet).
- `since` is the plain notes shown since the last thread line, carried from the run before. `seen` is every thread text ever shown (a list or a map). `seed` varies the dice.
- It never comes back empty.

`AA.notesReach(state)` gives the rung of the ladder the player may read (1 to 5). `AA.notesRate(state)` gives the budget. `AA.notesDepth(unlocks, round, rounds, chain)` is unchanged (0.65 career, 0.30 run, 0.05 chain). `AA.notesParse(t)` is unchanged.

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

## The thread: six sources

A thread line can come from six places, so no one clock holds it back.

| Source (`src`) | When it can show | Lines | Example |
|---|---|---|---|
| `run` | rounds 7 to 9 of any run, any player | 20 | The shadow of the retort stand falls toward the lamp. |
| `event` | something happened: an overreact, a long chain, a lost round, a purchase, sulfur on the molecule (every tag) | 100 | Sulfur fumes settled on the bench in a ring about a foot across. |
| `hom` | a creature is owned. The creatures notice first. | 40 | The fog from the Dry ice jar goes up the glass, not down. |
| `count` | a lifetime count is reached: the hundredth reagent, the tenth lost run, the third run | 17 | All six caps were loose this morning. |
| `career` | the share of unlocks, or runs played: the rungs of the ladder | 94 | The tap ran warm for a minute on the cold side. |
| `sign` | the laps of the sign, 1 to 3 | 65 | Lamp down to half at nine. |

Sulfur has ten thread lines, more than any other tag except the overreact: it is yellow and it is dealt early.

### The ladder

| Rung | What may be written | Reached when | Band |
|---|---|---|---|
| 1 | An oddity. Nobody is named. | from the first run | 2 |
| 2 | The thin book; someone in the room | an eighth of everything unlocked, or 8 runs played | 3 |
| 3 | "he"; his face (never described); Carcosa, Hali, the two suns, the pale mask | 35 in 100 unlocked, or 25 runs played | 4 |
| 4 | "the King"; the card and the gold on the sill | four fifths unlocked, or any lap of the sign | 5 |
| 5 | "The King in Yellow", in full | 97 in 100 unlocked, or the third lap, or the second lap at four fifths | 6 |

- Rungs 2 and 3 can be reached on runs played alone, so a player who unlocks slowly still reads them within a few hours.
- A story beat that has passed is dropped (`till`): once he has read act two, "Do not read the second act until the week's work is done" is no longer shown.
- Rungs 2 to 4 belong to the first time through. On a lap he does not find the book again; the lap's own lines carry it.
- His face is never described. Capitals are not used for him: he is "he", then "the King".

### The laps of the sign

Taking the sign empties the shelves and the share of unlocks falls to nothing. The voice does not go back.

| Laps taken | The voice | Lines | Example |
|---|---|---|---|
| 1 | He knows. He records what comes back without surprise. | 18, and 10 for creatures hatched again | The thin book stayed on the bench when the shelf was cleared. |
| 2 | He is polite about it. Shown only as what he does: a second stool, the lamp turned down, the page written out fair. | 19 | Poured a second cup at four and emptied it cold at six. |
| 3 | The notes are partly in another hand. It writes as a second chemist would: corrections, with figures. | 28, of which 17 in the other hand | Bath was 42, not 40. |

The page should draw `by: 'other'` notes in a different hand. It does not yet.

### The thread budget

`AA.notesRate(state)` sets what share of notes may be thread lines, and `AA.notesPick` keeps to it.

- **How far along** (`c`, 0 to 1) is the largest of: the share of unlocks; 0.6 times runs played over 60; and, after a sign, 0.65, 0.8 or 0.95 for laps 1, 2 and 3.
- **The rate** is 0.10 + 0.22 times `c`, plus 0.05 in rounds 7 to 9, and never over 0.36.
- **The gap** is the fewest plain notes between two thread lines: 3 while the rate is under 0.15, then 2, then 1 from 0.28. Two thread lines never come back to back at any stage.
- **The dice.** Once the gap has passed, each note has a fixed chance of being a thread line, set so the long-run share comes out at the rate. The dice are a hash of the run's notes so far, so the same run shows the same notes.
- **Owed lines.** A run that has shown five notes and no thread line gets one. If the page passes `seen` and `counts`, a player who has never seen a thread line gets one in the second run.
- **What is picked.** A lifetime count that has just been reached comes first. Otherwise seven times in ten the line is from the newest rungs, the late-run lines or the lap's own lines, and three times in ten from anything that fits.
- The first note of a run is never a thread line.

### How often, for a typical player

Measured with a Python copy of the picker (`notes_sim.py`, kept with the check script), 600 runs at each point. The four players are assumptions, not measurements: runs played, share unlocked, laps taken, run length, rounds reached. Notes a round are the page's own (1, 2, 3, 4, 5, 6, 8, 9, 11).

| Hours played | The player assumed | Notes a run | Thread lines a run | One thread line in | run | event | creature | count | career | sign |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 8 runs, 4 in 100 unlocked, three-round runs | 3.3 | 0.45 | 7.4 notes | 0% | 47% | 0% | 11% | 42% | 0% |
| 5 | 35 runs, 22 in 100, six-round runs, one creature | 10.8 | 1.96 | 5.5 | 0% | 45% | 18% | 3% | 34% | 0% |
| 20 | 110 runs, 65 in 100, nine-round runs | 26.9 | 6.95 | 3.9 | 12% | 40% | 15% | 0% | 34% | 0% |
| 60 | 300 runs, second lap, half unlocked again | 29.8 | 8.54 | 3.5 | 13% | 33% | 11% | 0% | 15% | 27% |

- Back-to-back thread lines in all 2,400 runs: none.
- Rungs shown: at 1 hour, rungs 1 and 2; at 5 hours, rungs 1 to 3; at 20 hours, rungs 1 to 3 (the King comes at four fifths); at 60 hours, mostly rungs 1 and 4.
- At 1 hour the share is higher than the 1 in 10 asked for, because a short run that reaches its fifth note is owed a line. Raising the owed mark from five notes to eight brings it to about 1 in 9 and makes the first line later.
- **The first line.** A new player sees a first thread line in run 1 in 43 of 100 careers, by run 2 in 81, by run 3 in 94 (page passing `counts` and `seen`). With the page as it is today (neither passed): 41, 65, 79, and 96 by run 6.

## How many

By tag and band:

| Tag | 1 plain | 2 oddity | 3 the book | 4 he | 5 the King | 6 in Yellow | All |
|---|---|---|---|---|---|---|---|
| no tag | 94 | 50 | 27 | 23 | 46 | 31 | 271 |
| start | 8 | 2 | 1 | 1 | 3 | 1 | 16 |
| win | 8 | 2 | 1 | 1 | 2 | 2 | 16 |
| loss | 8 | 3 | 1 | 2 | 4 | 2 | 20 |
| overreact | 6 | 4 | 1 | 3 | 4 | 2 | 20 |
| chain | 6 | 3 | 1 | 2 | 1 | 2 | 15 |
| waste | 6 | 2 | 1 | 1 | 2 | 2 | 14 |
| shop | 6 | 2 | 1 | 1 | 1 | 1 | 12 |
| buy | 6 | 2 | 1 | 1 | 2 | 1 | 13 |
| unlock | 6 | 2 | 1 | 1 | 2 | 0 | 12 |
| instrument | 6 | 2 | 1 | 1 | 1 | 1 | 12 |
| sigil | 4 | 2 | 1 | 1 | 1 | 1 | 10 |
| gold | 5 | 1 | 1 | 1 | 1 | 1 | 10 |
| spec | 5 | 1 | 1 | 1 | 1 | 0 | 9 |
| catalog | 4 | 1 | 1 | 1 | 1 | 0 | 8 |
| the four elements | 12 | 7 | 2 | 2 | 4 | 1 | 28 |
| the ten creatures | 30 | 20 | 10 | 10 | 0 | 0 | 70 |
| **All** | **220** | **106** | **53** | **53** | **76** | **48** | **556** |

By source and band:

| Source | 1 | 2 | 3 | 4 | 5 | 6 | All |
|---|---|---|---|---|---|---|---|
| lab (plain) | 220 | | | | | | 220 |
| run | | 20 | | | | | 20 |
| event | | 36 | 16 | 20 | 18 | 10 | 100 |
| hom | | 20 | 10 | 10 | | | 40 |
| count | | 14 | 2 | 1 | | | 17 |
| career | | 16 | 25 | 22 | 21 | 10 | 94 |
| sign | | | | | 37 | 28 | 65 |

Hands: 493 neat, 63 shaky. Mean length 10 words; 104 notes run past 12 words, 20 past 14; the longest is 18.

Thin spots: bands 3 to 6 have one line for most tags; nitrogen and bromine have few thread lines; the creatures have no lines of their own at rungs 4 and 5.

## The rights rule

- Allowed sources: Robert W. Chambers, *The King in Yellow* (1895), and Ambrose Bierce's earlier Carcosa and Hali. Both are in the public domain.
- From them we may use: the play that harms its readers, its two acts, Carcosa, the lake of Hali, the Hyades, the Pallid Mask, the tatters of the King, the Yellow Sign as an idea, Cassilda and Camilla, twin suns, black stars.
- Not allowed: anything from later writers or from games. No names from Lovecraft's stories. No "Hastur". Nothing from tabletop or video games.
- Never draw, describe or point to the well-known three-armed Yellow Sign. It is a 1989 game design and is not ours to use. Our sign is our own mark, built from our four yield marks (`STORY.md`).
- Do not quote Chambers at length. No note quotes him now; the names are the only borrowed words.

## Writing more

- One sentence if it can be one. 4 to 14 words; 18 at the most.
- One observation, with a number, a time, a colour, a direction or a material in it.
- No second sentence that reacts to the first, proves it impossible, or shrugs. If a second sentence is needed it is a bench action or a reminder.
- No capitals for effect, no exclamation marks, no brackets, no struck words as a joke, no modern slang.
- People have names: Dunmore the supplier, Mr Pike the landlord downstairs. The cat has none.
- Chemistry words are the game's own (`NAMES.md`) and must mean what they mean in the game: yield, the spec, reagent, reflex, runoff, finding, catalog, inspection, credit, gold; oxidize, reduce, hydrate, dehydrate, hydroborate, grow; tuck, weld, knit, pair, strip.
- A creature note fits what the creature does (`HOMUNCULI.md`).
- The cold readers found these overused; do not add more: things found changed "this morning"; "at the top mark" as an opening; two suns; one thing more than there should be; things written before he wrote them; the door and the stool; anything turning east; the King "stayed".
- Each row of the data file is one line of valid JSON, so the check script can read it.

## The sign

The sign is the game's prestige (rulings AP and AR; `RIG.md`, twelfth part 4 and thirteenth): taken at 9 tenths, three times, the collection starts over, every yield is a fifth higher for good. The three ideas for a last sigil that spends gold, which stood here in the first writing, are retired. In the notes the gold is offered and not taken ("Left the tin of gold on the sill overnight, 212; 212 in the morning.").

## How it was checked

- No node on this machine, so the JavaScript was not run. A Python script (`notes_check.py`) checks that the brackets and strings of the whole file balance, reads every data row as JSON, and counts sources, bands, tags, word lengths, repeats, runs of capitals, exclamation marks, brackets, banned names, and that "King" appears only from rung 4, "in Yellow" only at rung 5 and Carcosa, Hali and the Hyades only from rung 3. All pass. The functions at the bottom of the file were read, not run; the rate table comes from a Python copy of them, which can differ from the JavaScript if I copied wrongly.
- Two fresh sub-agents read every note cold, each asked both questions: is it trying to be spooky, and is it trying to be witty. The first flagged 168 of 538 lines (44 in 100 of the thread). The thread was rewritten whole and 29 plain notes changed. The second flagged 85 of 540, 10 of them firmly; all 10 were rewritten, with about 40 of the borderline ones. The lines changed after the second read, and the 16 added after it, have not had a third.
- Both scripts are in the session's scratch folder, not in the repository.

## Not done

- The page (`scheme.js`) calls `AA.notesPick` but does not pass `sign`, `counts`, `since` or `seen`. Until it does: laps have no effect on the notes, lifetime-count lines never show, and rungs 2 and 3 open by unlocks only.
- `overreacts` is not a counter in the rules yet.
- The page has no second hand to draw `by: 'other'` notes in.
- About 60 in 100 of the plain notes are still two short sentences. The second cold reader called that rhythm the main remaining fault of the plain block.
- The second cold reader's borderline list was not cleared in full. Left on purpose: the lines that name Carcosa, Hali and the King plainly, the book being back on the bench, and "Saw his face at the top mark tonight."
- The owner has not read any of it.
