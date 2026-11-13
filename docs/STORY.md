# Overreact: the story of the whole game

2026-11-12; rewritten 2026-11-13 for the sign (rulings AP, AR), the peppering and the tone (AM4, AM5), the owner's ruling that every note is tied to play, the owner's choice of ending (a new tenant each lap, with the earlier tenants' hands in the margins), and "Bring a little back" on the book. The notes that carry it are written (`apps/steam/js/react/notes_data.js`, 402 of them); how they are written is in `NOTES_WRITING.md`. Nothing else here is built.

## In one breath

A working chemist makes compounds to spec and notes what each page did. From his first runs, now and then, the tally holds a result that is not possible: a ring nobody closed, a use gone from a bottle that was not dealt. He enters it as he enters a yield. Later a second ink is in the notebook with figures of its own; later the second ink is "he", with a better line and a column of yields; later the column is headed "the King", and at an overreact the flask shows part of a face. He runs chains long to see it and offers gold that is not taken. Near the end of the collection the sign can be taken. Dunmore collects everything on the shelf, and the next entries in the notebook are in a new chemist's hand. This happens three times. The fourth tenant sees his face.

## How it is told

No cutscenes. No pages of text. The player is never stopped to be told a story. It comes through the margin notes, and every note is about the play just made: this molecule, the reagent just fired, the chain, the yield against the spec, what came off, the creature, the gold. Notes are filled from the game. A plain note explains what has just happened and why ("{dud} found nothing: it needs {dudneeds}."), or states a record; it never gives the answer (no best order, no plan, nothing a creature needs before it has acted), because new players work the game out themselves. There is no scenery in them: no room, no weather, no cups.

**The thread arrives through play.** It is stated as flatly as a yield and never hints:

- a count that is one too many ("{n+1} reflexes counted from a line that gives {n}.");
- a rule of the bench broken, with the rule ("Dehydrate gave off hydrogen; it gives off water.");
- a thing in the tally that was not done ("It overreacted on two reagents; the third was never fired and is spent.");
- a mark or a figure on the page before it was earned ("Top mark at {yield}, with {yield+1} already written beside it.");
- a creature lit by nothing ("Ammonia lit with no nitrogen on the page.").

**It is peppered, not gated** (AM4). A new player meets a first impossible result within the first two or three runs. After that a thread line is about one note in ten in the first hour, one in five or six by five hours, one in four by twenty, one in three and a half on the laps, and never two together (`NOTES_WRITING.md`, "How often").

**It comes from six sources**: rounds 7 to 9 of any run; things that happen (an overreact, a chain, a lost round, a purchase, sulfur on the molecule); the creatures owned; lifetime counts; the share of unlocks and the runs played; and the laps of the sign.

Other carriers, not built: the names of findings and catalog entries, what the homunculi do in their jars, the title screen, the music, and one moment of a few seconds.

## Who writes

Four chemists, one after another, in the same notebook on the same bench. None has a name. Dunmore is the supplier.

| Tenant | Laps of the sign taken | How he writes |
|---|---|---|
| The first chemist | 0 | Fragments and short sentences. The whole ladder below is his. |
| The second | 1 | Whole sentences, "I". |
| The third | 2 | Abbreviates: rd, p., yld, refl. |
| The fourth | 3 | Dates every entry. |

## The ladder (the first chemist)

A rung is reached by the share of unlocks or by runs played, whichever comes first.

| Rung | What the notes report | Reached when | Notes that open |
|---|---|---|---|
| 1 An impossible result | Counts one too many, uses gone, marks inked early. Nobody is named. | from the first run | "One ring more on the molecule than I closed." / "A ring closed across nine atoms." |
| 2 A second ink | Lines and figures in the notebook that he did not enter, usually a page ahead of him. | an eighth of everything, or 8 runs | "A second figure under my yield for page {page}: {yield+1}." / "The next page has a line entered: {r3}, {r1}, {r2}." |
| 3 He | The second ink is "he": his line, his yield, his column, always a little better. At an overreact the flask shows part of a face. A thin book in yellow cloth comes in a delivery. | 35 in 100, or 25 runs | "Tried his line for the page; it gave his yield." / "The overreact showed a chin and the edge of a collar in the flask." |
| 4 The King | The column is headed "the King". He plays the King's line, enters his yields in the King's column, runs chains long for a sight of the face, and offers gold. | four fifths | "His column in the ledger is headed 'the King'." / "Offered {gold} gold at the bench for a sight of his face; the tin still holds {gold}." |

- His face is never drawn or described: a chin, a collar, a sleeve, a shoulder, the back of a head.
- "More and more desperate about seeing his face" (AM3) is carried by what he does in play: longer chains, the King's line in place of his own, gold offered again. No note says how he feels.
- The book is back a little, as a logged object (see "The book"). The lake is not named.

## The sign, and the tenants

At 9 tenths unlocked the sign can be taken (`P.signState(meta, owned, total).can`): "The sign can be taken now; Dunmore would collect everything on the shelf." Taking it ends that chemist's tenancy. How is never stated. The shelves are empty, the catalog is kept, every yield is a fifth higher, and the next page of the same notebook is in a new hand.

| Laps | Yield | The page | The notes |
|---|---|---|---|
| 0 | as dealt | No yellow but the sulfur. The sign is the unfinished mark at the bottom of the title page. | The first chemist; the ladder above. |
| 1 | 1.2 times | One stroke of the sign under the molecule at each OVERREACT. | The second tenant. He reads the earlier pages as a previous user's log: "The earlier hand records a yield of {yield+6} for this compound on his page 31." / "The earlier tenant's last entry is round nine, page two, yield 212." The first chemist's hand adds a few entries in his margins: "{dud} needs {dudneeds}." |
| 2 | 1.4 times | Two strokes, there all round. | The third tenant: "This cpd: 1st hand yld {yield+6}, 2nd hand {yield+2}, mine {yield}." Two earlier hands in the margins, more often. |
| 3 | 1.6 times | The sign whole under every molecule and on the title page. | The fourth tenant: "3 March. Yields for this compound: {yield+6}, {yield+2}, {yield+1}, and mine {yield}." Three earlier hands in the margins, more often again. "The King in Yellow" is written in full only here. |

- The margin entries are small corrections and figures about the play just made. Each earlier tenant keeps his way of writing there. They never address the reader and never explain.
- Each tenant meets the impossible results of rung 1 for himself. What he has in place of the second ink is the earlier tenants' pages, where the second column is already headed "the King".
- The creatures hatch again for each tenant and are lit by nothing in the same ways.
- Never the three-armed sign of 1989: our own mark, built from our four yield marks, a stroke a lap and whole at the third.

## The book

Five lines in the whole game, each a logged fact with an event behind it. It comes late, on the third rung, the way a parcel is entered: "Dunmore's delivery with {item}: also one thin book in yellow cloth, not on the invoice." One invoice gives a place of supply as Carcosa. Each later tenant finds it on the bench at the start of a run and notes how far he has read. The title is written once, by the fourth tenant: "22 March. The book on the bench is The King in Yellow, a play; read to page 61." Nobody says what is in it.

## The one moment

**The face** (once, the first OVERREACT after the third sign is taken). OVERREACT fills the screen as always. Then two seconds of nothing: no shake, no notes, the creatures still. One note, large and neat, in the fourth tenant's hand: "28 March. Saw his face in the flask at the top mark." Nothing is shown. Then the round ends as normal and the yield is counted. It is skipped by any key.

The earlier "second act" moment stays dropped: nobody in the notes says what is in the play.

## The last state

After the third sign nothing is taken again and nothing is locked.

- The fourth tenant keeps the bench. He plays on with the full lift, and the collection can be built to everything.
- The notebook has four hands in it. His dated entries go on; the three earlier hands go on correcting his figures in the margins.
- His ledger has two columns, his and the King's: "29 March. The King's column and mine agree for round {round}."
- The sign is whole under the molecule from the first page of every round.
- Nobody says what became of the first three.

## Milestones: what changes, and which notes open

| Milestone | What changes on screen | Notes that open |
|---|---|---|
| First runs | Nothing odd on the page. | One impossible result within the first two or three runs: "A use is gone from a bottle that was not dealt this page." |
| First OVERREACT | The word fills the screen as ruled. | "An overreact is the yield passing eight times the spec." Now and then: "The overreact mark was inked before the yield reached it." |
| Sulfur dealt (early) | The yellow ball on the molecule. | No plain note: nothing has happened yet. Now and then: "A yellow solid came off a page where no sulfur was fired." |
| First homunculus | Its jar on the bench. | What lights it; now and then: "Slime lit with one reagent landed." |
| The hundredth reagent | Nothing. | "Hundredth reagent fired, and 101 uses chalked off the slate." |
| Rounds 7 to 9 of any run | The late-run margin, crowded as ruled. | "One carbon is in the tally with five bonds." |
| Second rung | Title screen: a second ink in the margins. | "The second ink enters each yield one page ahead of mine." |
| Third rung | The title's letters cast two shadows. | "His line for this molecule gives {n+3} reflexes to my {n}." |
| Each sigil earned | One stroke on the unfinished mark at the bottom of the title screen. | "The sign under the molecule gained a stroke at the overreact." |
| Fourth rung | The ledger on the bench shows two columns. | "The King's yield for round {round} is {yield+9}." |
| 9 tenths unlocked | The sign is offered on the bench, never forced. | "The sign can be taken now; Dunmore would collect everything on the shelf." |
| A sign taken | A clean page in a new hand. The bench is bare but for the catalog and the notebook. | "The notebook was a third full in another hand when I began on this bench." |
| The third sign | The sign whole. The moment above at the first OVERREACT. | "28 March. Saw his face in the flask at the top mark." |

## Rules for everyone who adds to this

- Every note is about the play just made. No scenery, no mood, nothing wistful, nothing that hints.
- Never loud, never trying to be scary, never a quip (AM4, AM5).
- The ladder: an impossible result from the first run; a second ink; "he" and his face; "the King"; "The King in Yellow" only on the third lap. No capitals for him. His face is never drawn or described.
- Sources are Chambers's 1895 book and Bierce only. Never the three-armed sign of 1989, nor anything from later writers or games.
- The story is earned by play: a rung opens because of what the player has found, the runs played and the signs taken, never because of time passed.
- The sign is never paid in gold and is never forced.

## Not done

- Only the notes are written. The page does not pass them the game's figures, the laps, the lifetime counts or what has been seen, so most of this cannot show yet (`NOTES_WRITING.md`, "What the page must pass").
- The page has no other hands to draw the margin entries in.
- The title screen, jar, ledger and music changes are ideas in words.
- The rungs' thresholds are first guesses.
- The rules side of the sign is built (`path.js`); the page does not offer it or draw the strokes.
- The rules side does not yet hand over the seven facts some plain notes need (the distance between the groups that reacted, the longest chains, a molecule's history, loose rings).
