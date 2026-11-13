# Overreact: writing the margin notes

2026-11-13, third writing. Rulings AI, AM, AM2, AM3, AM4, AM5 and the owner's ruling of the same day that every note is tied to play (below). The notes are in `apps/steam/js/react/notes_data.js`. The story they carry is in `STORY.md`. The first writing (12 November, 335 notes) and the second (13 November, plain voice with room and weather in it) are both replaced.

## What the notes are

A working chemist's jottings in the margin of his notebook about what has just happened in the game. There are 442. 190 are plain notes about the work. 252 are thread lines.

The owner's words, in order:

- "more unhinged the deeper into chemistry as we go" (AM); "gradually more and more desperate about seeing HIS FACE, the thing being the king in yellow" (AM3).
- "I feel like the angle of the king in yellow parts need to be peppered a bit better and can't only come from a full 3 run prestige but I do not want you to have it be Redditor stupid extra spoopy shit" (AM4).
- "The dry example you gave is a classic sign of Redditor slop stop it" (AM5).
- On the plain voice: "Yes, that's it." Then, on lines about a coffee cup: "Some of that writing still sucks. Like the coffee cup being dry, it's bad". What is wrong with the bad ones, all three ticked: nothing happens in them; trying to be poignant; hinting too hard. The fix chosen: tie every note to play.

## The rule

Every note is about something that has just happened on the page or the bench in the game: this molecule (its atoms, rings, size), the reagent just fired and what it did, the reflexes and their order, the chain's length, the yield against the spec and the mark, what came off, the creature that acted, the instrument, gold gained or spent, what was bought, the round and how it ended.

It is written as a chemist would jot it: an observation, a number, a correction, a next step. "Try {r3} before {r1} next time." is the register.

Four things are out:

1. **Trying to be spooky.** Capitals, a reveal held to the end of a line, watching and behind-him lines, anything that nudges the reader to feel a chill.
2. **Trying to be witty.** The clipped quip with a wry tag, performed deadpan, mock formality, anything that could end with "lol".
3. **Filler and scenery.** Lines where nothing happens. Cups, taps, chairs, windows, weather, sleep, the landlord, the cat. A note that only says something was written down.
4. **Poignant, or hinting.** Wistful moments written to sound meaningful. Coy "something is off" lines. A line reports; it does not hint.

The thread arrives through play as well. It is a result that is not possible given what was fired, stated as flatly as a yield: a count that is one too many, a ring nobody closed, a mark inked before the yield reached it, a reagent used that was not dealt, a creature lit by nothing. Later it is a second ink in the notebook with its own figures, then "he" with a column of yields of his own, then the King.

### Ten lines kept

| Line | The event | Why it stays |
|---|---|---|
| Try {r3} before {r1} next time. | a round lost | A next step, about the line played. |
| {reagent} set off {n} reflexes by itself. | a reagent fired | An observation with a number. |
| {dud} acted nowhere on the page that lost it. | a round lost | Says what went wrong. |
| One carbon is in the tally with five bonds. | rounds 7 to 9 | An impossible result, as a tally entry. |
| A ring closed across seven atoms. | a ring closed | Rings want five or six. No comment. |
| Lost by {short}; the page shows a yield of {spec} in pencil. | a round lost | Two figures that cannot both be true. |
| It overreacted on two reagents; the third was never fired and is spent. | an overreact | A use gone with no firing. |
| Seedling's row stands at four pages in a round of three. | Seedling owned | The creature's own count, one too many. |
| His entry for the round reads 'met' beside my 'lost'. | a round lost, rung 3 | "He" arrives as a ledger entry. |
| Offered {gold} gold at the bench for a sight of his face; the tin still holds {gold}. | rung 4 | The bargain, as a count of gold. |

### Ten lines cut

| Line | From | Why it went |
|---|---|---|
| HIS FACE HIS FACE HIS... ran out of margin | first writing | Capitals and repetition for effect. |
| Do not lick. (See Tuesday.) | first writing | Punchline in brackets. |
| Dear Sir: I enclose one (1) soul, slightly used. Kindly appear. | first writing | Comic formality, written for a reader. |
| Someone below is humming. Pike is away until Friday. | second writing | The second sentence proves the first impossible: a sting. |
| Poured a second cup at four and emptied it cold at six. | second writing | Nothing to do with play; written to be poignant. |
| Page one has a ring from a cup larger than mine. | second writing | Scenery, hinting. |
| I would like to see his face. | second writing | A feeling, not a result. |
| Finding entered in ink, with the date. | this writing | Only says something was written down. |
| The catalog gives the source of this compound as Carcosa. | this writing | A name dropped as a wink; nothing happened. |
| Overreact three pages running, and still only the chin. | this writing | A wry tag on the end. |

## The data

`AA.NOTES` is a list. Each note says in its own data what makes it eligible:

| Field | What it is |
|---|---|
| `t` | the text, with slots in braces: `{reagent}`, `{n}`, `{yield+1}` |
| `slots` | the slot names in the text (worked out when the file loads). The note is only offered when the page has passed every one. |
| `cond` | `{ slot: [min, max] }`: the number in that slot must lie in the range (so "{n} reflexes" is not shown for one) |
| `when` | the event the note is about (a tag). No tag: a note about the molecule and the page as they stand. |
| `src` | `lab` for a plain note. For a thread line, the source: `run`, `event`, `hom`, `count`, `career`, `sign`. |
| `band` | 1 for a plain note; for a thread line, its rung plus 1 |
| `thread`, `rung`, `till` | a thread line; the rung of the ladder it needs; the last rung at which it is still shown |
| `sign` | `[min, max]` laps of the sign taken (`meta.sign`): which tenant is writing |
| `unlocks`, `round` | `[min, max]` share of unlocks owned; round of the run |
| `count` | `[key, from, to]`: a lifetime count inside that window |
| `by` | `tenant0`, `tenant1` or `tenant2`: written in the margin by an earlier tenant. 27 notes. |
| `fb` | a rule of thumb with no slots, offered only when nothing about the present page fits. 14 notes. |
| `hand` | `neat` or `shaky` |
| `big` | written large, alone. One note. |

`AA.notesPick(state)` returns the notes that fit; the list is all thread lines or all plain notes, as the budget decides. `AA.notesFill(note, ctx)` returns the text with the slots filled; `{n+1}` and `{n-1}` are sums it does itself, and a slot that opens a note gets a capital. `AA.notesReach`, `AA.notesRate`, `AA.notesDepth` and `AA.notesParse` are as before (no note is ranged on depth now).

## What the page must pass

`state` for `AA.notesPick`:

| Field | What | Passed today |
|---|---|---|
| `unlocks` | share of all unlocks owned, 0 to 1 | yes |
| `round` | round of the run | yes |
| `tag` | the event (below), one or a list | yes, the old tags |
| `homs` | keys of the creatures owned | yes |
| `used` | texts (`note.t`, slots unfilled) shown this run, in order | yes |
| `ctx` | the slot values (below) | **no** |
| `sign` | `meta.sign`, 0 to 3 | **no** |
| `counts` | lifetime counts: `runs`, `runs_won`, `runs_lost`, `reagents_fired`, `ring_steps` (from `meta.counters` added to `meta.countersAll`) and `overreacts` (not counted by the rules yet) | **no** |
| `seen` | every thread text ever shown (a list or a map), kept in the profile | **no** |
| `since` | plain notes shown since the last thread line, carried across runs | **no** |
| `seed` | any number that differs from run to run | **no** |

The page must show `AA.notesFill(note, ctx)` and keep `note.t` in `used`.

`state.ctx`: pass what is known at the moment; leave out what is not. A note needing a missing slot is not offered.

| Slot | Value | Example |
|---|---|---|
| `round`, `page` | round of the run; page of the round (1 to 3) | 4, 2 |
| `formula` | the molecule's formula now | C8H14O2 |
| `atoms`, `atoms0` | heavy atoms now; at the start of the last page fired | 10, 7 |
| `rings`, `rings0` | rings now; at the start of the last page fired | 2, 1 |
| `r1`, `r2`, `r3` | the three reagents of the last page fired, in order, by their game names | oxidize, grow, hydrate |
| `reagent` | the reagent that fired last | reduce |
| `places` | how many places that reagent acted in | 3 |
| `uses` | uses that reagent has left this round | 2 |
| `dud` | a reagent of the last page that acted nowhere; leave out if none | reduce |
| `kind` | the reflex that fired last, by its name | tuck |
| `kinds` | the reflexes of the page so far, in order, as one string | tuck, weld, tuck |
| `n` | reflexes on the page (the chain's length) | 9 |
| `yield` | the round's yield so far | 166 |
| `pageyield` | the yield of the last page alone | 64 |
| `spec` | the number to beat this round | 180 |
| `over`, `short` | yield minus spec when it is positive; spec minus yield when it is positive. Pass only the one that applies. | 22; 14 |
| `mark` | the yield mark just reached: stable, unstable or volatile | volatile |
| `left`, `leftn` | what came off, and how many | water, 4 |
| `gold`, `gained` | gold held now; gold the round paid | 41, 12 |
| `item`, `price` | the thing bought or offered (with "the" if it needs it); its price | the clamp, 30 |
| `finding` | the finding's name | Dry 100 times |
| `compound` | the catalog compound's name | menthol |
| `instrument`, `sigil` | the one used, by name | the dropper |

New tags the page should raise, each with its slots: `fire` (a reagent has acted), `reflex`, `ring` (a ring closed), `left` (something came off), `page` (a page ended), `mark` (a yield mark reached). The old tags stand: `start win loss overreact chain waste shop buy unlock instrument sigil gold spec catalog`, `el:N el:S el:Cl el:Br`, `hom:<key>`.

Without `ctx` only the 213 notes with no slots come back, and for a note with no tag the plain ones are the 14 rules of thumb. That is too few for a long run: `ctx` is needed before these notes go on the page.

## The thread: six sources

| Source (`src`) | When it can show | Lines | Example |
|---|---|---|---|
| `run` | rounds 7 to 9 of any run, any player | 12 | A reagent fired a fourth time this round. |
| `event` | something happened (every tag) | 76 | {dud} acted nowhere; one atom fewer on the molecule after it. |
| `hom` | a creature is owned | 20 | Brimstone lit with no sulfur on the page. |
| `count` | a lifetime count is reached | 13 | Five hundred reagents fired; the tally inside the back cover says 512. |
| `career` | the share of unlocks, or runs played: the rungs of the ladder | 52 | {rings+1} rings counted on the molecule; {rings} were closed. |
| `sign` | the laps of the sign: the later tenants and the margins | 79 | The earlier hand records a yield of {yield+6} for this compound on his page 31. |

Sulfur has eight thread lines; the other three elements have one each.

### The ladder

| Rung | What may be written | Reached when | Band |
|---|---|---|---|
| 1 | A result that is not possible. Nobody is named. | from the first run | 2 |
| 2 | A second ink in the notebook: figures and lines he did not enter | an eighth of everything unlocked, or 8 runs played | 3 |
| 3 | "he": his line, his yield, his column. His face in the flask at an overreact (a chin, a collar, a sleeve; never described) | 35 in 100 unlocked, or 25 runs | 4 |
| 4 | "the King": the column is headed so. Gold offered and not taken. Chains run long for a sight of his face. | four fifths unlocked, or any lap of the sign | 5 |
| 5 | "The King in Yellow", in full | the third lap only | 6 |

No capitals are used for him. Carcosa, Hali and the play are not named in the notes now: a name with no event behind it was cut as hinting.

### The tenants

Taking the sign ends a tenancy. How is never said: "The sign can be taken now; Dunmore would collect everything on the shelf." A new chemist has the bench and the same notebook.

| Laps taken | Who writes | His voice | Earlier hands in the margins (`by`) | Lines |
|---|---|---|---|---|
| 0 | the first chemist | fragments and short sentences | none | the ladder, rungs 1 to 4 |
| 1 | the second tenant | whole sentences, "I" | `tenant0`: 5 entries | 23, and 6 plain |
| 2 | the third tenant | abbreviates: "Rd {round} p. {page}: spec {spec}, yld {yield}." | `tenant0` 4, `tenant1` 4 | 24, and 6 plain |
| 3 | the fourth tenant | dates every entry | `tenant0` 5, `tenant1` 4, `tenant2` 5 | 32, and 6 plain |

- A new tenant reads the earlier pages as a previous user's log: a predecessor's yield for the same compound, his line for the same molecule, where his last entry stands.
- The margin entries are corrections and figures about the play just made ("{r3} should have gone before {r1}." / "Chain was {n}, not {n-1}."). Each keeps its writer's voice: `tenant2` abbreviates in the margins too. They never address anyone and never explain.
- On a lap, the notes with no tag are the tenant's own. Notes for an event (a reagent fired, a round lost) are shared by all four and are in the first chemist's voice; a set for each tenant is not written.
- Rung-1 results are read by every tenant. Rungs 2 to 4 belong to the first chemist.

### The thread budget

- **How far along** (`c`, 0 to 1): the largest of the share of unlocks; 0.6 times runs played over 60; and 0.65, 0.8 or 0.95 on laps 1, 2 and 3.
- **The rate**: 0.10 + 0.22 times `c`, plus 0.05 in rounds 7 to 9, never over 0.36.
- **The gap**: at least 3 plain notes between two thread lines while the rate is under 0.15, then 2, then 1. Never back to back.
- **Owed lines**: a run that has shown nine notes and no thread line gets one (it was five; raised to bring the early rate to 1 in 10). With `seen` and `counts` passed, a player who has never seen one gets one in the second run.
- **What is picked**: a lifetime count just reached comes first. Notes with slots come before notes without, four times in five.

### How often, for a typical player

A Python copy of the picker, 600 runs at each point, with made-up slot values. The four players are assumptions, and so is how often the page raises a tag (here, for most notes).

| Hours played | The player assumed | Notes a run | Thread lines a run | One thread line in | run | event | creature | count | career | sign |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 8 runs, 4 in 100 unlocked, three-round runs | 3.3 | 0.34 | 9.8 notes | 0% | 84% | 0% | 6% | 10% | 0% |
| 5 | 35 runs, 22 in 100, six-round runs, one creature | 11.4 | 2.02 | 5.6 | 0% | 75% | 15% | 2% | 8% | 0% |
| 20 | 110 runs, 65 in 100, nine-round runs | 26.1 | 6.53 | 4.0 | 4% | 72% | 12% | 0% | 13% | 0% |
| 60 | 300 runs, second lap, half unlocked again | 29.2 | 8.29 | 3.5 | 4% | 67% | 10% | 0% | 4% | 15% |

- Back-to-back thread lines in 2,400 runs: none.
- A new player's first thread line: in run 1 for 29 of 100, by run 2 for 77, by run 3 for 92 (page passing `counts` and `seen`). Without those and without `ctx`: 19, 34, 47, and 76 by run 6.

## How many

| Source | 1 plain | 2 | 3 | 4 | 5 | 6 | All |
|---|---|---|---|---|---|---|---|
| lab (plain) | 190 | | | | | | 190 |
| run | | 12 | | | | | 12 |
| event | | 44 | 10 | 11 | 11 | | 76 |
| hom | | 10 | 10 | | | | 20 |
| count | | 9 | 2 | 2 | | | 13 |
| career | | 18 | 12 | 11 | 11 | | 52 |
| sign | | | | | 47 | 32 | 79 |
| **All** | **190** | **93** | **34** | **24** | **69** | **32** | **442** |

229 notes have slots. 13 notes have more than one sentence. 16 run past 14 words; the longest is 18.

Thin spots: one thread line each for `fire`, `reflex`, `ring`, `left`, `page`, `mark`, nitrogen, chlorine and bromine; the creatures have no thread lines above rung 2.

## The rights rule

- Allowed sources: Robert W. Chambers, *The King in Yellow* (1895), and Ambrose Bierce. Both are in the public domain.
- Used in the notes now: the King, the King in Yellow, his face never seen, the sign as an idea, yellow.
- Not allowed: anything from later writers or from games. No "Hastur". Never the three-armed sign of 1989: our sign is our own mark, built from our four yield marks.
- No note quotes Chambers.

## Writing more

- Start from an event and its slots. If the line would read the same with nothing having happened, cut it.
- One sentence. 3 to 14 words; 18 at most.
- A label and a figure is a good shape and avoids plurals: "Places acted on by {reagent}: {places}." Use `cond` where a plural would go wrong.
- A thread line is two figures that cannot both be true, or a thing in the tally that was not done. No second clause that reacts.
- Chemistry words are the game's own (`NAMES.md`): yield, the spec, reagent, reflex, runoff, finding, catalog, gold; oxidize, reduce, hydrate, dehydrate, hydroborate, grow; tuck, weld, knit, pair, strip.
- A creature note says what lights the creature or what it did (`HOMUNCULI.md`).
- The third cold reader found these overused; do not add more: a figure and the same figure plus one (33 lines); "before" and "already" (26); "second ink" (13); "sum corrected to {yield}" (9); a chin, a sleeve, a collar (7).
- Each row of the data file is one line of valid JSON.

## How it was checked

- No node on this machine, so the JavaScript was not run. A Python script reads every data row as JSON and checks: brackets and strings of the whole file balance; every slot is one of the 33 in the table above; no scenery words; no capitals for effect, exclamation marks or brackets; "King" only from rung 4 and "in Yellow" only at rung 5; no repeats; lengths. All pass. The functions were read, not run; the rate table is from a Python copy of them and can differ if I copied wrongly.
- Three fresh sub-agents have read the notes cold, one after each writing. The third read all 468 lines of this writing with sample figures and three questions (spooky? witty? filler, poignant or hinting?). It flagged 29 of 207 plain notes (13 firmly, all for only saying something was written down) and 49 of 261 thread lines (15 firmly, nearly all in the lines about him, the King, the face and the tenants). All 28 firm ones were cut or rewritten, with about 40 borderline ones and 20 it found unclear. The rewritten lines have not been read again.
- The rules of thumb (`fb`) and the creature notes state rules of the game. They were taken from `HOMUNCULI.md` and the earlier notes and have not been checked against `path.js`.
- The check and simulation scripts are in the session's scratch folder, not in the repository.

## Not done

- The page does not pass `ctx`, `sign`, `counts`, `seen`, `since` or `seed`, does not call `AA.notesFill`, and does not raise the six new tags. Until it does, about half the notes cannot show and the pool for a note with no tag is 14 rules.
- The page has no other hands to draw `by` notes in.
- `overreacts` is not counted by the rules.
- Notes for an event are not written in each tenant's voice.
- The about 20 label-and-figure notes ("Rings on the molecule: {rings}.") are the flattest in the file; the third reader said so. They are tied to play but say little.
- The owner has read five lines of the second writing and none of this one.
