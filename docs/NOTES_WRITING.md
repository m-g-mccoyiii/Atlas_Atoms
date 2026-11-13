# Overreact: writing the margin notes

2026-11-13, fifth writing. Rulings AI, AM, AM2, AM3, AM4, AM5 and the owner's rulings of the same day (below). The notes are in `apps/steam/js/react/notes_data.js`. The story they carry is in `STORY.md`.

## What the notes are

A working chemist's jottings in the margin of his notebook about the play just made. There are 402: 108 plain notes and 294 thread lines.

The owner's words, in order:

- "more unhinged the deeper into chemistry as we go" (AM); "gradually more and more desperate about seeing HIS FACE, the thing being the king in yellow" (AM3).
- "I feel like the angle of the king in yellow parts need to be peppered a bit better and can't only come from a full 3 run prestige but I do not want you to have it be Redditor stupid extra spoopy shit" (AM4).
- "The dry example you gave is a classic sign of Redditor slop stop it" (AM5).
- "Some of that writing still sucks. Like the coffee cup being dry, it's bad". The fix chosen: tie every note to play.
- "Thread good, plain ones dull". On the book: "Bring a little back".
- On the plain notes that taught: "Good, but no answers". "New players are inexperienced that's the whole point". On the Carcosa invoice line: "Keep it".

## The rule

**Every note is about the play just made**, written as a chemist would jot it.

**A plain note explains what has just happened and why, or states a record.** It may say:

- why a reagent found nothing ("{dud} found nothing: it needs {dudneeds}.");
- what a reagent did ("With {reagent}, {all}.");
- why a reflex fired and what happened in it ("A {kind} fired: {why}.");
- what came off and from which step ("{left} came off; it comes from {leftfrom}.");
- what a creature did, after it acted ("Hydrogen lit: oxidize was last, it landed, and the page ran three reflexes.");
- how the page was paid ("Step {n} paid {n} times step one.");
- a record or a history, as a fact ("Chain of {n}; the notebook's longest is {careerbest}.").

**A plain note never gives the answer.** New players work the game out themselves. Out:

- the best order of the reagents, or any other order;
- "next time", a plan for the next page, what to follow a reagent with;
- a near miss that says what to change;
- what a creature needs, before the player has seen it act;
- what a group on the molecule will do, before it has done it;
- a rule of the bench stated ahead of the event that shows it.

**Also out, in every note:** trying to be spooky; trying to be witty; filler and scenery; anything poignant or hinting; a readout of what the screen already shows (the molecule, the reagents, uses, yield, spec, marks, the chain's count, gold).

**The thread arrives through play.** It is a result that is not possible, stated as flatly as a yield: a count one too many, a use never fired, a rule of the bench broken. Where the broken rule is not obvious the line carries it ("Dehydrate gave off hydrogen; it gives off water."). Later it is a second ink with its own figures, then "he", then the King.

### Ten lines kept

| Line | The event | What it is |
|---|---|---|
| {dud} found nothing: it needs {dudneeds}. | a page ended | Why the reagent was wasted, after it was. |
| With {reagent}, {all}. | a reagent fired | What it just did, at every place. |
| A {kind} fired: {why}. | a reflex fired | Why it fired, after it did. |
| The ring closed because the two groups were {gap} carbons apart. | a ring closed | The distance that worked. |
| Page {page} ran {n} reflexes against {roundbest} earlier; only the steps past that paid in full. | a page ended | How that page was paid. |
| Hydrogen lit: oxidize was last, it landed, and the page ran three reflexes. | Hydrogen has just acted | Its condition, only after it acted. |
| Chain of {n}; the notebook's longest is {careerbest}. | a long chain | A record, with no advice. |
| One carbon is in the tally with five bonds. | rounds 7 to 9 | Thread: an impossible tally entry. |
| Dehydrate gave off hydrogen; it gives off water. | any page | Thread: a rule broken, with the rule. |
| Offered {gold} gold at the bench for a sight of his face; the tin still holds {gold}. | rung 4 | Thread: the bargain, as a count of gold. |

### Ten lines cut

| Line | From | Why it went |
|---|---|---|
| HIS FACE HIS FACE HIS... ran out of margin | first writing | Capitals and repetition for effect. |
| Do not lick. (See Tuesday.) | first writing | Punchline in brackets. |
| Poured a second cup at four and emptied it cold at six. | second writing | Scenery, written to be poignant. |
| Met the spec by {over}. | third writing | A readout of the screen. |
| The pair reflex needs two SH. | third writing | False: the rules have no pair reflex. |
| Best order of those three was {bestorder}: {bestn} reflexes to the {n} I got. | fourth writing | Gives the answer. |
| A {nearkind} is one carbon out: the groups are {neargap} apart and it wants {nearneed}. | fourth writing | Coaching: says what to change. |
| {reagent} gives {feeds}. | fourth writing | Says what to follow it with. |
| Hydrogen lights when oxidize is last, lands, and the page ran three reflexes. | fourth writing | A creature's need, before it has acted. |
| No OH at the start; hydrate a C=C to make the first one. | fourth writing | A plan. |

## The data

`AA.NOTES` is a list. Each note says in its own data what makes it eligible:

| Field | What it is |
|---|---|
| `t` | the text, with slots in braces: `{dud}`, `{why}`, `{yield+1}` |
| `slots` | the slot names the note needs (from its text and its `cond`). It is only offered when all are there. |
| `cond` | `{ slot: [min, max] }`: the number in that slot must lie in the range |
| `wait` | the note needs a slot the rules side has to work out (below). 23 notes, all plain. Held back until the page passes it. |
| `again` | its text changes with the reagent or reflex named, so it may be shown more than once a run, but not within four notes. 25 notes. |
| `when` | the event the note is about (a tag). No tag: a note about the last page. |
| `src` | `lab` for a plain note. For a thread line, the source: `run`, `event`, `hom`, `count`, `career`, `sign`. |
| `band` | 1 for a plain note; for a thread line, its rung plus 1 |
| `thread`, `rung`, `till` | a thread line; the rung of the ladder it needs; the last rung at which it is still shown |
| `sign` | `[min, max]` laps of the sign taken (`meta.sign`): which tenant is writing |
| `unlocks`, `round` | `[min, max]` share of unlocks owned; round of the run |
| `count` | `[key, from, to]`: a lifetime count inside that window |
| `by` | `tenant0`, `tenant1` or `tenant2`: written in the margin by an earlier tenant. 23 notes. |
| `fb` | a fact about how the bench keeps score, no slots, offered only when nothing about the present page fits. 6 notes. |
| `hand`, `big` | `neat` or `shaky`; written large (one note) |

`AA.notesPick(state)` returns the notes that fit; the list is all thread lines or all plain notes, as the budget decides. `AA.notesFill(note, ctx)` returns the text with the slots filled; `{n+1}` and `{n-1}` are sums it does itself, and a slot that opens a note gets a capital. `AA.NOTES_RULES_SLOTS` lists the slots that make a note wait.

## What the page must pass

`state` for `AA.notesPick`: `unlocks`, `round`, `tag`, `homs`, `used` (passed today), and `ctx`, `sign` (`meta.sign`), `counts` (`runs`, `runs_won`, `runs_lost`, `reagents_fired`, `ring_steps` from `meta.counters` added to `meta.countersAll`, and `overreacts`, which the rules do not count yet), `seen` (every thread text ever shown), `since`, `seed` (none passed today).

The page shows `AA.notesFill(note, ctx)` and keeps `note.t` in `used`, in order. It must let a note marked `again` through even when its `t` is already in `used`; the picker keeps it four notes apart.

### `state.ctx`, part 1: the page has these already

Pass what is known at the moment; leave out what is not.

| Slot | Value | Where it is today |
|---|---|---|
| `round`, `page` | round of the run; page of the round | `run.round`, `g.page` |
| `atoms` | the molecule's atoms, not counting hydrogen | `heavy(g.m)` |
| `reagent` | the reagent that fired last | `g.trail` |
| `places` | how many places it acted in | the trail step's `hits` |
| `dud` | a reagent of the last page that acted nowhere; leave out if none | the trail step's `wasted` |
| `kind`, `kinds` | the reflex that fired last; the page's reflexes in order, as one string | the free steps of `g.trail`, by `RX.ENG.KIND` |
| `n` | reflexes on the page | `g.casc` |
| `yield`, `pageyield`, `spec` | the round's yield; the last page's; the number to beat | `g.total`, `run.quota` |
| `over`, `short` | yield minus spec if positive; spec minus yield if positive. Only the one that applies. | from the two above |
| `mark` | the number of the mark just passed, 1 to 3 (never a stage word) | `runMarks(quota)` |
| `left`, `leftn` | what came off on the last page (water, hydrogen, carbon dioxide, acid fumes, ammonia, sulfur) and how many | `g.tally.off_*`, as a difference over the page |
| `gold`, `gained` | gold held; gold the round paid | `run.coins`, `runEarn` |
| `r1`, `r2`, `r3`, `uses`, `formula`, `rings`, `item`, `price`, `finding`, `compound`, `instrument`, `sigil` | as the page shows them. Used mostly by thread lines. | the page |

Reagent and reflex names may be the game's names or the card ids (`pcc`, `allyl`, `lactol`, `enone`...); the notes file maps them.

### `state.ctx`, part 2: the rules side must work these out

Seven slots, all facts about what has happened. A note that needs one is marked `wait: true`.

| Slot | Value | What it takes |
|---|---|---|
| `gap` | carbons between the two groups that reacted in the last ring-closing reflex | the reflex's match, in `rules.js` |
| `roundbest` | the longest chain of an earlier page this round | already kept for `RULE.fresh`; needs handing to the page |
| `runbest`, `careerbest` | the longest chain this run, and ever | two new counters |
| `molseen`, `molbest` | how many times this starting molecule was dealt before, and the best yield with it | a new table in the profile, keyed by the molecule |
| `loose` | loose rings standing (from ring, knit, cap) that will open at the page turn | the list `RULE.reopen` uses |

Dropped with the notes they served: `bestorder`, `bestn`, `bestsame`, `nearkind`, `neargap`, `nearneed`, `homlack`, and the derived `feeds`. The check script fails if any note uses one.

### Slots the notes file works out itself

From `reagent`: `{does}` (what it left) and `{all}` (what it did at every place). From `dud`: `{dudneeds}`. From `kind`: `{why}` it fired, `{what}` happened in it, `{after}` what it leaves. From `left`: `{leftfrom}`. The tables (`REAGENT`, `KIND`, `LEFT` in the file) cover all eighteen reagents and thirteen reflexes.

### Tags

| Tag | Raised when | Raised today |
|---|---|---|
| `start win loss overreact chain waste shop buy unlock instrument sigil gold spec catalog` | as before | yes |
| `el:N`, `el:S`, `el:Cl` | that element is on the molecule dealt. Thread lines only. | yes |
| `hom:<key>` | that creature is owned. Thread lines only. | yes |
| `tap:<key>` | that creature has just acted. This is the only place a creature's condition is stated. | **no** |
| `fire`, `reflex`, `ring`, `left`, `page`, `mark` | a reagent has acted; a reflex fired; a ring closed; something came off; a page ended; a mark was passed | **no** |

Without `ctx`, 236 notes can show (51 plain, 185 thread); for a note with no tag the plain ones are the 6 scoring facts.

## What was checked against the rules

Every plain note that states a rule was checked against `docs/tools_chem/FINAL.md` (the eighteen reactions and thirteen reflexes), `docs/HOMUNCULI.md` and `path.js` (`RULE`, `CASC`, `HOMS2K`, `HOM2LIT`, `runMarks`, `runEarn`). `rules.js` was read only at its head; `FINAL.md` is its description.

- Cut as false in the fourth writing: a "pair" reflex and "strip" (neither exists); "a weld needs two rings"; "reduce acts on any C=O"; five wrong creature thresholds; bromine (no dealt molecule has it); the stage words.
- Creature payments now stated, from `HOMS2K`: Water 1.5 times, Acid 2 times, Salt 2.5 times, a Wood spirit pour that lands 1.25 times, Brimstone more after page one than after page two.
- From `HOMUNCULI.md` alone, not found in code: "The reagents that lit Slime are shut for the next page"; "Brimstone counted the spec as met". Dry ice's multiplier differs between the doc (2.5) and `HOMS2K` (1.36), so no note gives it.
- "A finding opens the next thing on its shelf" and the interest on gold are from comments in `path.js`.

## The thread: six sources

| Source (`src`) | When it can show | Lines | Example |
|---|---|---|---|
| `run` | rounds 7 to 9 of any run, any player | 12 | A reagent fired a fourth time this round. |
| `event` | something happened (every tag, and a creature that has acted) | 120 | A dry step gave off no water; each gives one. |
| `hom` | a creature is owned | 20 | Brimstone lit with no sulfur on the page. |
| `count` | a lifetime count is reached | 13 | Five hundred reagents fired; the tally inside the back cover says 512. |
| `career` | the share of unlocks, or runs played: the rungs | 52 | {rings+1} rings counted on the molecule; {rings} were closed. |
| `sign` | the laps of the sign: the later tenants and the margins | 77 | The earlier hand records a yield of {yield+6} for this compound on his page 31. |

A thread line that breaks a rule does show the rule. That is the one place a new player can meet a rule before working it out; the owner has read the thread and passed it, but did so before this ruling.

### The ladder

| Rung | What may be written | Reached when |
|---|---|---|
| 1 | A result that is not possible. Nobody is named. | from the first run |
| 2 | A second ink in the notebook: figures and lines he did not enter | an eighth of everything unlocked, or 8 runs |
| 3 | "he": his line, his yield, his column. Part of a face in the flask at an overreact. The yellow book arrives in a delivery. | 35 in 100 unlocked, or 25 runs |
| 4 | "the King": the column is headed so. Gold offered and not taken. | four fifths unlocked, or any lap of the sign |
| 5 | "The King in Yellow", written once | the third lap only |

### The book

Five lines in all, each a logged fact with an event behind it:

| Line | Event | Who |
|---|---|---|
| Dunmore's delivery with {item}: also one thin book in yellow cloth, not on the invoice. | a purchase, rung 3 | the first chemist |
| Dunmore's invoice for {item} gives the place of supply as Carcosa. | a purchase, rung 4 | the first chemist |
| On the bench at the start: six bottles, the notebook, and a thin book in yellow cloth. | a run starts, lap 1 | the second tenant |
| Yellow bk on bench; read to p. 40 between rds. | a run starts, lap 2 | the third tenant |
| 22 March. The book on the bench is The King in Yellow, a play; read to page 61. | a run starts, lap 3 | the fourth tenant |

The title is in no other note. The lake is not named. The owner has ruled that the Carcosa line stays.

### The tenants

Taking the sign ends a tenancy; how is never said. A new chemist has the bench and the same notebook.

| Laps | Who writes | His voice | Earlier hands in the margins (`by`) | Lines |
|---|---|---|---|---|
| 0 | the first chemist | fragments and short sentences | none | the ladder, rungs 1 to 4 |
| 1 | the second tenant | whole sentences | `tenant0`: 4 | 23, and 7 plain |
| 2 | the third tenant | abbreviates | `tenant0` 4, `tenant1` 3 | 24, and 7 plain |
| 3 | the fourth tenant | dates every entry | `tenant0` 4, `tenant1` 3, `tenant2` 5 | 30, and 7 plain |

- A new tenant reads the earlier pages as a previous user's log: a predecessor's yield for the same compound, where his last entry stands.
- The margin entries are corrections to a figure or a reason for what happened ("{dud} needs {dudneeds}." / "Page {page} gave {pageyield}, not {pageyield-2}."). None gives an order to play. Each keeps its writer's voice.
- Notes for an event are shared by all four tenants; only the notes with no tag and the lap lines are in each tenant's own voice.

### The thread budget

- **How far along** (`c`): the largest of the share of unlocks; 0.6 times runs played over 60; and 0.65, 0.8 or 0.95 on laps 1, 2 and 3.
- **The rate**: 0.10 + 0.22 times `c`, plus 0.05 in rounds 7 to 9, never over 0.36.
- **The gap**: at least 3 plain notes between two thread lines while the rate is under 0.15, then 2, then 1. Never back to back.
- **Owed lines**: a run of nine notes with no thread line gets one. With `seen` and `counts` passed, a player who has never seen one gets one in the second run.
- Notes with slots come before notes without, four times in five; a scoring fact (`fb`) only when nothing else fits.

### How often, for a typical player

A Python copy of the picker, 600 runs at each point, made-up slot values. The four players and how often the page raises a tag are assumptions. The copy does not know `again`, so it runs out of plain notes in long runs and its notes-a-run figures for 20 and 60 hours are low.

| Hours played | The player assumed | Thread lines a run | One thread line in | run | event | creature | count | career | sign |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 8 runs, 4 in 100 unlocked, three-round runs | 0.35 | 9.6 notes | 0% | 80% | 0% | 7% | 13% | 0% |
| 5 | 35 runs, 22 in 100, six-round runs, one creature | 1.87 | 5.8 | 0% | 72% | 18% | 3% | 8% | 0% |
| 20 | 110 runs, 65 in 100, nine-round runs | 5.18 | 4.0 | 2% | 71% | 13% | 0% | 13% | 0% |
| 60 | 300 runs, second lap, half unlocked again | 5.17 | 3.4 | 3% | 63% | 16% | 0% | 3% | 15% |

Back-to-back thread lines in 2,400 runs: none. A new player's first thread line: in run 1 for 27 of 100, by run 2 for 75, by run 3 for 92 (page passing `counts` and `seen`).

## How many

| Source | 1 plain | 2 | 3 | 4 | 5 | 6 | All |
|---|---|---|---|---|---|---|---|
| lab (plain) | 108 | | | | | | 108 |
| run | | 12 | | | | | 12 |
| event | | 86 | 10 | 12 | 12 | | 120 |
| hom | | 10 | 10 | | | | 20 |
| count | | 9 | 2 | 2 | | | 13 |
| career | | 18 | 12 | 11 | 11 | | 52 |
| sign | | | | | 47 | 30 | 77 |
| **All** | **108** | **135** | **34** | **25** | **70** | **30** | **402** |

Of the 108 plain notes: 6 scoring facts, 31 for a creature that has acted, 21 in the later tenants' voices, 50 others. 23 wait on the rules side. No note is over 18 words.

## The rights rule

- Allowed sources: Robert W. Chambers, *The King in Yellow* (1895), and Ambrose Bierce. Both are in the public domain.
- Used now: the King, the title once, his face never seen, the sign as an idea, yellow, the thin book as a play, Carcosa once as a place name on an invoice.
- Not allowed: anything from later writers or from games. No "Hastur". Never the three-armed sign of 1989: our sign is our own mark, built from our four yield marks.
- No note quotes Chambers.

## Writing more

- Start from an event that has happened. Say what happened in it or why. If the line tells the player what to do, or what will happen, cut it.
- A creature's condition goes only under `tap:<key>`.
- A plain note that states a rule must be checked against `FINAL.md`, `HOMUNCULI.md` or `path.js` first.
- A thread line that breaks a rule should carry the rule unless it is plain to anyone.
- One sentence. 18 words at most.
- Each row of the data file is one line of valid JSON.

## How it was checked

- No node on this machine, so the JavaScript was not run. A Python script reads every data row as JSON and checks: brackets and strings balance; every slot is known and none is a dropped answer slot; no advice words in a plain note ("next time", "try", "look for", "should", "plan"); no scenery words, stage words, pair, strip or bromine; no capitals for effect, exclamation marks or brackets; "King" only from rung 4, "in Yellow" only at rung 5 and only once; no repeats; no note over 18 words. All pass. The rate table is from a Python copy of the picker and can differ if I copied wrongly.
- Four fresh sub-agents have read the notes cold, one after each of the first four writings. This fifth writing has not had a cold read: the plain notes were cut down to the "no answers" rule and about 45 lines were added after the fourth.
- The fourth reader flagged as "spooky" the flask showing a chin, a collar or a sleeve, the strokes of the sign, and the book lines. The owner had read the thread and said "Thread good", so these stand.

## Not done

- The page does not pass `ctx`, `sign`, `counts`, `seen`, `since` or `seed`, does not call `AA.notesFill`, does not let `again` notes repeat, and does not raise `tap:<key>` or the six newer tags.
- The rules side does not work out the seven slots of part 2.
- **The plain pool is small.** 108 plain notes, of which a first-lap player can see about 87, against up to 49 notes in a nine-round run. The `again` notes are what keep a long run from running dry; without them the page would fall back to its old lists.
- `spec`, `instrument`, `buy`, `shop`, `unlock` and `catalog` have one plain note each or none: the notes file does not know what each instrument, sigil or finding does, so it cannot say what one just did.
- The page has no other hands to draw `by` notes in. `overreacts` is not counted by the rules.
- Notes for an event are not written in each tenant's voice.
- The owner has not read this writing.
