# Overreact: writing the margin notes

2026-11-13, fourth writing. Rulings AI, AM, AM2, AM3, AM4, AM5 and the owner's rulings of the same day (below). The notes are in `apps/steam/js/react/notes_data.js`. The story they carry is in `STORY.md`.

## What the notes are

A working chemist's jottings in the margin of his notebook about the play just made. There are 413: 141 plain notes and 272 thread lines.

The owner's words, in order:

- "more unhinged the deeper into chemistry as we go" (AM); "gradually more and more desperate about seeing HIS FACE, the thing being the king in yellow" (AM3).
- "I feel like the angle of the king in yellow parts need to be peppered a bit better and can't only come from a full 3 run prestige but I do not want you to have it be Redditor stupid extra spoopy shit" (AM4).
- "The dry example you gave is a classic sign of Redditor slop stop it" (AM5).
- "Some of that writing still sucks. Like the coffee cup being dry, it's bad": nothing happens in them, trying to be poignant, hinting too hard. The fix chosen: tie every note to play.
- On the third writing: "Thread good, plain ones dull". On the book: "Bring a little back".

## The rule

**Every note is about the play just made**, and is written as a chemist would jot it: an observation, a reason, a correction, a next step.

**A plain note says something the player can use and cannot read off the screen.** The screen already shows the molecule, the reagents, uses left, the yield, the spec, the marks, the chain counting up and the gold. A note that repeats those is a readout and is cut. What a plain note may be:

- why something happened ("A {kind} fired: {why}.", which fills as: A ring fired: an OH was three or four carbons from a C=O);
- why something did not ("{dud} found nothing: it needs {dudneeds}.");
- what would have gone further ("Best order of those three was {bestorder}: {bestn} reflexes to the {n} I got.");
- a near miss ("A {nearkind} is one carbon out: the groups are {neargap} apart and it wants {nearneed}.");
- what a creature needs ("{creature} was {homlack} short of lighting on that page.");
- a record ("Chain of {n}; the notebook's longest is {careerbest}.");
- a rule of the bench, stated as a result the player can test.

A beginner should learn the game from the margin over a few runs.

**Out, in every note:**

1. Trying to be spooky: capitals, a reveal held to the end of a line, watching and behind-him lines.
2. Trying to be witty: the clipped quip with a wry tag, performed deadpan, mock formality.
3. Filler and scenery: cups, weather, sleep, the room; a note that only says something was written down.
4. Poignant or hinting: wistful moments; coy "something is off" lines.
5. A readout of the screen.

**The thread arrives through play.** It is a result that is not possible, stated as flatly as a yield: a count one too many, a use never fired, a rule of the bench broken ("Oxidize took an OH from a carbon with no hydrogen on it; it needs one."). Where the broken rule is not obvious, the line carries the rule, so no thread line teaches something false. Later it is a second ink with its own figures, then "he", then the King.

### Ten lines kept

| Line | The event | What the player gets |
|---|---|---|
| {dud} found nothing: it needs {dudneeds}. | a page ended | Why the reagent was wasted. |
| Best order of those three was {bestorder}: {bestn} reflexes to the {n} I got. | a page ended | The order that would have gone further. |
| A {nearkind} is one carbon out: the groups are {neargap} apart and it wants {nearneed}. | any page | The near miss, and the distance to fix. |
| Page {page} ran {n} reflexes against {roundbest} earlier; only the steps past that paid in full. | a page ended | How the round pays for a chain. |
| Rings from ring, knit and cap are loose and open at the page turn; others stay shut. | fallback | Which rings can be closed again. |
| {creature} was {homlack} short of lighting on that page. | any page | How close the creature was. |
| Grow adds three carbons at every C=O; three C=O is nine atoms. | Seedling owned | How to reach Seedling's eight. |
| One carbon is in the tally with five bonds. | rounds 7 to 9 | Thread: an impossible tally entry. |
| Dehydrate gave off hydrogen; it gives off water. | any page | Thread: a rule broken, with the rule. |
| Offered {gold} gold at the bench for a sight of his face; the tin still holds {gold}. | rung 4 | Thread: the bargain, as a count of gold. |

### Ten lines cut

| Line | From | Why it went |
|---|---|---|
| HIS FACE HIS FACE HIS... ran out of margin | first writing | Capitals and repetition for effect. |
| Do not lick. (See Tuesday.) | first writing | Punchline in brackets. |
| Someone below is humming. Pike is away until Friday. | second writing | The second sentence is a sting. |
| Poured a second cup at four and emptied it cold at six. | second writing | Scenery, written to be poignant. |
| Met the spec by {over}. | third writing | A readout: the screen shows it. |
| {reagent} acted in {places} places. | third writing | A readout. |
| Rings on the molecule: {rings}. | third writing | A readout. |
| Page {page}: {r1}, {r2}, {r3}; yield {pageyield}. | third writing | A readout. |
| {mark} at a yield of {yield}. | third writing | A readout, and it used the dropped stage words. |
| The pair reflex needs two SH. | third writing | False: the rules have no pair reflex. |

## The data

`AA.NOTES` is a list. Each note says in its own data what makes it eligible:

| Field | What it is |
|---|---|
| `t` | the text, with slots in braces: `{dud}`, `{bestorder}`, `{yield+1}` |
| `slots` | the slot names the note needs (from its text and its `cond`). It is only offered when all are there. |
| `cond` | `{ slot: [min, max] }`: the number in that slot must lie in the range |
| `wait` | the note needs a slot the rules side has to work out (below). 48 notes. They are held back until the page passes it. |
| `when` | the event the note is about (a tag). No tag: a note about the molecule and the page as they stand. |
| `src` | `lab` for a plain note. For a thread line, the source: `run`, `event`, `hom`, `count`, `career`, `sign`. |
| `band` | 1 for a plain note; for a thread line, its rung plus 1 |
| `thread`, `rung`, `till` | a thread line; the rung of the ladder it needs; the last rung at which it is still shown |
| `sign` | `[min, max]` laps of the sign taken (`meta.sign`): which tenant is writing |
| `unlocks`, `round` | `[min, max]` share of unlocks owned; round of the run |
| `count` | `[key, from, to]`: a lifetime count inside that window |
| `by` | `tenant0`, `tenant1` or `tenant2`: written in the margin by an earlier tenant. 23 notes. |
| `fb` | a rule of the bench with no slots, offered only when nothing about the present page fits. 25 notes. |
| `hand`, `big` | `neat` or `shaky`; written large (one note) |

`AA.notesPick(state)` returns the notes that fit; the list is all thread lines or all plain notes, as the budget decides. `AA.notesFill(note, ctx)` returns the text with the slots filled; `{n+1}` and `{n-1}` are sums it does itself, and a slot that opens a note gets a capital. `AA.NOTES_RULES_SLOTS` lists the slots that make a note wait.

## What the page must pass

`state` for `AA.notesPick`: `unlocks`, `round`, `tag`, `homs`, `used` (passed today), and `ctx`, `sign` (`meta.sign`), `counts` (`runs`, `runs_won`, `runs_lost`, `reagents_fired`, `ring_steps` from `meta.counters` added to `meta.countersAll`, and `overreacts`, which the rules do not count yet), `seen` (every thread text ever shown), `since`, `seed` (none passed today). The page shows `AA.notesFill(note, ctx)` and keeps `note.t` in `used`.

### `state.ctx`, part 1: the page has these already

Pass what is known at the moment; leave out what is not.

| Slot | Value | Where it is today |
|---|---|---|
| `round`, `page` | round of the run; page of the round | `run.round`, `g.page` |
| `formula`, `atoms` | the molecule's formula; its atoms not counting hydrogen | `g.m` (`heavy(g.m)`) |
| `oh`, `co`, `ene` | how many OH, C=O and C=C (outside benzene rings) the molecule has now | count on `g.m` as `feedShape` does for a dealt one |
| `r1`, `r2`, `r3` | the three reagents of the last page fired, in order | the page's circles in `g.trail` |
| `reagent`, `uses` | the reagent that fired last; its uses left | `g.trail`, `g.left` |
| `places` | how many places it acted in | the trail step's `hits` |
| `dud` | a reagent of the last page that acted nowhere; leave out if none | the trail step's `wasted` |
| `kind`, `kinds` | the reflex that fired last; the page's reflexes in order, as one string | the free steps of `g.trail`, by `RX.ENG.KIND` |
| `n` | reflexes on the page | `g.casc` |
| `yield`, `pageyield`, `spec` | the round's yield; the last page's; the number to beat | `g.total`, `run.quota` |
| `over`, `short` | yield minus spec if positive; spec minus yield if positive. Only the one that applies. | from the two above |
| `mark` | the number of the mark just passed, 1 to 3 (never a stage word) | `runMarks(quota)` |
| `left`, `leftn` | what came off on the last page (water, hydrogen, carbon dioxide, acid fumes, ammonia, sulfur) and how many | `g.tally.off_*`, as a difference over the page |
| `gold`, `gained` | gold held; gold the round paid | `run.coins`, `runEarn` |
| `item`, `price`, `finding`, `compound`, `instrument`, `sigil`, `creature` | names, as the page shows them | the page |

Reagent and reflex names may be the game's names or the card ids (`pcc`, `allyl`, `lactol`, `enone`...); the notes file maps them.

### `state.ctx`, part 2: the rules side must work these out

No note that needs one of these can show until it exists. Each is marked `wait: true`.

| Slot | Value | What it takes |
|---|---|---|
| `bestorder`, `bestn` | the order of the same three reagents that gives the longest chain on the molecule as it stood, as a string ("grow, hydrate, oxidize"), and that chain's length. Pass only when it beats the order played. | play the six orders on a copy of the page, as the simulator's careful player does |
| `bestsame` | 1 when the order played was the best of the six | the same |
| `gap` | carbons between the two groups that reacted in the last ring-closing reflex | the reflex's match, in `rules.js` |
| `nearkind`, `neargap`, `nearneed` | a reflex that is one carbon from firing: its name, the distance found, and the distance it wants as text ("3 or 4") | a second pass of each reflex's pattern with the distance widened by one |
| `roundbest` | the longest chain of an earlier page this round | already kept for `RULE.fresh`; needs handing to the page |
| `runbest`, `careerbest` | the longest chain this run, and ever | two new counters |
| `molseen`, `molbest` | how many times this starting molecule was dealt before, and the best yield with it | a new table in the profile, keyed by the molecule |
| `loose` | loose rings standing (from ring, knit, cap) that will open at the page turn | the list `RULE.reopen` uses |
| `homlack` | what the creature held still lacked to light on the last page, as text ("one water", "oxidize in last place") | from `HOM2LIT`, one phrase per creature |

### Slots the notes file works out itself

From `reagent`: `{does}` (what it leaves) and `{feeds}` (what that is good for). From `dud`: `{dudneeds}`. From `kind`: `{why}` and `{after}`. From `left`: `{leftfrom}`. The tables (`REAGENT`, `KIND`, `LEFT` in the file) cover all eighteen reagents and thirteen reflexes.

### Tags

`start fire reflex ring left page mark win loss overreact chain waste shop buy unlock instrument sigil gold spec catalog`, `el:N el:S el:Cl`, `hom:<key>`. The page raises the old ones today; `fire`, `reflex`, `ring`, `left`, `page` and `mark` are new. There is no bromine on any dealt molecule, so `el:Br` is gone.

Without `ctx`, 241 notes can show (81 plain, 160 thread); for a note with no tag the plain ones are the 25 rules of the bench.

## What was checked against the rules

Every plain note that states a rule was checked against `docs/tools_chem/FINAL.md` (the eighteen reactions and thirteen reflexes), `docs/HOMUNCULI.md` and `path.js` (`RULE`, `CASC`, `HOMS2K`, `HOM2LIT`, `runMarks`, `runEarn`). `rules.js` was read only at its head; `FINAL.md` is its description.

Found false and cut or corrected:

- "The pair reflex needs two SH" and "strip takes the Cl off": the rules have neither. An SH caps onto a C=O; a Cl leaves in a close.
- "A weld needs two rings side by side": a weld needs two C=O four or five carbons apart.
- "Reduce only acts on C=O": in this game it takes only a C=O at the end of a chain.
- "Rings want five or six" is true of every reflex but close, which makes five to seven. The thread's "A ring closed across seven atoms" became nine.
- Slime lights with two reagents, not three; Seedling at eight atoms, not five; Acid at two atoms smaller; Hydrogen needs a chain of three; Wood spirit needs the dud in first place.
- The stage words (stable, unstable, volatile) are out; a mark has a number.
- Bromine notes: no dealt molecule carries bromine.

Not verified in code, taken from `HOMUNCULI.md` alone: "After Slime is tapped, the reagents that lit it cannot be used on the next page"; "Brimstone ends the round and counts the spec as met". Dry ice's multiplier differs between the doc (2.5) and `HOMS2K` (1.36), so no note gives it. "A finding opens the next thing on its shelf" and the interest on gold are from comments in `path.js`.

## The thread: six sources

| Source (`src`) | When it can show | Lines | Example |
|---|---|---|---|
| `run` | rounds 7 to 9 of any run, any player | 12 | A reagent fired a fourth time this round. |
| `event` | something happened (every tag) | 98 | A dry step gave off no water; each gives one. |
| `hom` | a creature is owned | 20 | Brimstone lit with no sulfur on the page. |
| `count` | a lifetime count is reached | 13 | Five hundred reagents fired; the tally inside the back cover says 512. |
| `career` | the share of unlocks, or runs played: the rungs | 52 | {rings+1} rings counted on the molecule; {rings} were closed. |
| `sign` | the laps of the sign: the later tenants and the margins | 77 | The earlier hand records a yield of {yield+6} for this compound on his page 31. |

The device of a figure and the same figure plus one is down from about 33 lines to 10 on the first rung. The others are now a rule broken, a thing in the tally that was not done, or a thing out of order. The six new tags have three or four thread lines each; nitrogen and chlorine four each; sulfur eight.

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

The title is in no other note. The lake is not named. The Carcosa line is the one a reader is most likely to take as a wink; the fourth cold reader did.

### The tenants

Taking the sign ends a tenancy; how is never said. A new chemist has the bench and the same notebook.

| Laps | Who writes | His voice | Earlier hands in the margins (`by`) | Lines |
|---|---|---|---|---|
| 0 | the first chemist | fragments and short sentences | none | the ladder, rungs 1 to 4 |
| 1 | the second tenant | whole sentences | `tenant0`: 4 | 23, and 6 plain |
| 2 | the third tenant | abbreviates | `tenant0` 4, `tenant1` 3 | 24, and 6 plain |
| 3 | the fourth tenant | dates every entry | `tenant0` 4, `tenant1` 3, `tenant2` 5 | 30, and 6 plain |

- A new tenant reads the earlier pages as a previous user's log. The earlier tenant's line for a molecule is the best order of the three ("His line for this molecule was {bestorder}."), so even these lines tell the player something.
- The margin entries are corrections about the play just made ("Order should have been {bestorder}." / "{dud} needs {dudneeds}."). Each keeps its writer's voice. They never address anyone.
- Notes for an event are shared by all four tenants; only the notes with no tag and the lap lines are in each tenant's own voice.

### The thread budget

- **How far along** (`c`): the largest of the share of unlocks; 0.6 times runs played over 60; and 0.65, 0.8 or 0.95 on laps 1, 2 and 3.
- **The rate**: 0.10 + 0.22 times `c`, plus 0.05 in rounds 7 to 9, never over 0.36.
- **The gap**: at least 3 plain notes between two thread lines while the rate is under 0.15, then 2, then 1. Never back to back.
- **Owed lines**: a run of nine notes with no thread line gets one. With `seen` and `counts` passed, a player who has never seen one gets one in the second run.
- Notes with slots come before notes without, four times in five; a rule of the bench (`fb`) only when nothing else fits.

### How often, for a typical player

A Python copy of the picker, 600 runs at each point, made-up slot values. The four players and how often the page raises a tag are assumptions.

| Hours played | The player assumed | Notes a run | Thread lines a run | One thread line in | run | event | creature | count | career | sign |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 8 runs, 4 in 100 unlocked, three-round runs | 3.3 | 0.34 | 9.7 notes | 0% | 83% | 0% | 7% | 10% | 0% |
| 5 | 35 runs, 22 in 100, six-round runs, one creature | 11.1 | 1.89 | 5.9 | 0% | 74% | 15% | 3% | 8% | 0% |
| 20 | 110 runs, 65 in 100, nine-round runs | 25.2 | 6.30 | 4.0 | 4% | 71% | 12% | 0% | 13% | 0% |
| 60 | 300 runs, second lap, half unlocked again | 25.6 | 7.36 | 3.5 | 4% | 65% | 11% | 0% | 4% | 16% |

Back-to-back thread lines in 2,400 runs: none. A new player's first thread line: in run 1 for 26 of 100, by run 2 for 76, by run 3 for 91 (page passing `counts` and `seen`).

## How many

| Source | 1 plain | 2 | 3 | 4 | 5 | 6 | All |
|---|---|---|---|---|---|---|---|
| lab (plain) | 141 | | | | | | 141 |
| run | | 12 | | | | | 12 |
| event | | 64 | 10 | 12 | 12 | | 98 |
| hom | | 10 | 10 | | | | 20 |
| count | | 9 | 2 | 2 | | | 13 |
| career | | 18 | 12 | 11 | 11 | | 52 |
| sign | | | | | 47 | 30 | 77 |
| **All** | **141** | **113** | **34** | **25** | **70** | **30** | **413** |

Of the 141 plain notes: 25 rules of the bench, 30 creature notes, 18 in the later tenants' voices, 68 others. 33 of them wait on the rules side. No note is over 18 words.

## The rights rule

- Allowed sources: Robert W. Chambers, *The King in Yellow* (1895), and Ambrose Bierce. Both are in the public domain.
- Used now: the King, the title once, his face never seen, the sign as an idea, yellow, the thin book as a play, Carcosa once as a place name on an invoice.
- Not allowed: anything from later writers or from games. No "Hastur". Never the three-armed sign of 1989: our sign is our own mark, built from our four yield marks.
- No note quotes Chambers.

## Writing more

- Start from an event. Ask what the player would want to know about it that the screen does not show. If the answer is a number already on screen, there is no note.
- A plain note that states a rule must be checked against `FINAL.md`, `HOMUNCULI.md` or `path.js` first.
- A thread line that breaks a rule should carry the rule unless it is plain to anyone ("it gives off water").
- One sentence. 18 words at most.
- Bench words to avoid without a gloss: "plain carbon", "heavy atoms", "dud", "pops", "wilts".
- Repeated too often already, by the fourth reader's count: "three or four carbons" (20 plain lines), the best-order note (11), "opens at the page turn" (10), the earlier hand's line as the best order (14 thread lines), strokes of the sign (7), part of a face in the flask (6).
- Each row of the data file is one line of valid JSON.

## How it was checked

- No node on this machine, so the JavaScript was not run. A Python script reads every data row as JSON and checks: brackets and strings balance; every slot is known; no scenery words, stage words, pair, strip or bromine; no capitals for effect, exclamation marks or brackets; "King" only from rung 4, "in Yellow" only at rung 5 and only once; no repeats; no note over 18 words. All pass. The rate table is from a Python copy of the picker and can differ if I copied wrongly.
- Four fresh sub-agents have read the notes cold, one after each writing. The fourth read every plain note and the 116 new or changed thread lines with four questions (spooky? witty? filler, poignant or hinting? a readout of the screen?). Plain: 35 of 167 flagged, 13 firmly (12 as readouts). All 13 and 16 of the borderline ones were cut; the notes it found unclear or contradictory (the quarter rule in three versions, "plain carbon", "heavy atoms", which rings stay shut) were rewritten. Thread: 37 of 116 flagged, 18 firmly.
- **Thread flags not acted on, on purpose.** The fourth reader flagged as "spooky" the lines where the flask shows a chin, a collar or a sleeve, the strokes of the sign, and the book and Carcosa lines. The owner had read samples of the thread and said "Thread good", and asked for the book back, so these stand. The five thread lines it flagged as readouts were rewritten, and the thirteen that broke a rule without stating it now state it.
- The lines changed after the fourth read have not been read again.

## Not done

- The page does not pass `ctx`, `sign`, `counts`, `seen`, `since` or `seed`, does not call `AA.notesFill`, and does not raise the six new tags.
- The rules side does not work out the fourteen slots of part 2. The most useful plain notes (the best order, the near miss, how close a creature was) wait on it.
- The page has no other hands to draw `by` notes in.
- `overreacts` is not counted by the rules.
- Notes for an event are not written in each tenant's voice.
- `shop`, `buy`, `unlock`, `instrument`, `sigil`, `gold`, `spec` and `catalog` have one or two plain notes each and they are general: the notes file does not know what each instrument, sigil or finding does. A table of one line for each, like the reagent table, would fix that.
- The owner has not read this writing.
