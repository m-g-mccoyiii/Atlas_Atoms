# Overreact: findings, the path to everything a new game does not hold

**Revised after review, 2026-11-11.** What changed (from `FINDINGS_REVIEW.md`):
- Replaced 17 weak findings with ones that belong to their thing: methanol, magnet, scorched paper, extinguisher, ethylene, mortar, clamp stand, fountain pen, aqua regia, crystal ball, lab coat, circle slots 2 and 3, hazards 2, 4 and 6, and the schlenk line. Also replaced, to fit the same rules: the stir plate, the raven, hourglass, alarm clock and the heat at the turn inspection.
- No streaks in a row: the clamp stand, the fountain pen and the raven now count over all runs, never in a row. The crystal ball no longer shows anything ahead.
- Hazards: only hazard 1 asks for a won doctorate. Hazards 2 to 8 are each a count of the habit the label punishes.
- The bench draws one outline at a time, not one per shelf. Each shelf is ordered by how rare its findings are, so one rare thing cannot block the rest. A moment outline shows the shape to make.
- Plain words: about 100 findings rewritten so that a person who has never seen the game can read them at a glance, using the names in `NAMES.md`.
- Added: a player who never wins a run, two more findings fed by losing (hourglass, alarm clock), a list of what each changed finding still needs read on the engine, and new counters.
- Recounted the kinds, the share that need a win, the held-after-N table and the last ten. A Runs value with a `~` is an estimate for a changed finding, not yet read on the engine. The held-after-N figures were moved by the changed medians (a spread around each median), not by a new run of `fgate.py`.

2026-11-11. This is one path, built from three designs and checked on the chemistry engine. None of it is built in the game.

A finding is something done in play that opens something for good. Each finding below is tied to the thing it opens, so doing it shows the player what the thing is for. When a thing opens, the page replays the moment of the finding as three small pictures: the molecule before, the event, and the molecule after. Then the new thing does its own act once on that same molecule.

## What a new game holds

- Six reagents: hydrate, hydroborate, dehydrate, oxidize, reduce, grow.
- Two reflexes: ring and dry.
- The bachelor's run of three rounds.
- The plain notebook.
- The bench.
- No instrument, no homunculus, no inspection and no catalog entry.

Everything else is found. That is 166 things:

| Kind | Things |
|---|---|
| reagents | 13 |
| reflexes | 10 |
| instruments | 50 (every drawn lab object and occult object; the ten drawings that are not tools are bench props, below) |
| homunculi | 10 |
| notebooks | 6 |
| longer runs | 2 (master's, doctorate) |
| hazard levels | 8 |
| inspections | 13 |
| catalog entries | 20 |
| sigil slots | 6 (what a sigil does is not decided; each slot only opens) |
| cosmetic things | 28, all added here: 3 papers, 2 pens, 3 sets of flags, 10 bench props, 10 homunculus hats |

## The rules of finding

1. **One outline on the bench at a time.**
   - Each shelf keeps one next thing: the thing whose needs are met that has the lowest Runs value among those not yet found. A rare thing at the head of a shelf never blocks an easier one, because the order is by Runs, not by position in the table.
   - The bench draws only one of these outlines: on the shelf of the last thing the player opened, or, if nothing opened, the shelf whose count moved most in the last run.
   - Nothing later is drawn. Shelves that are not drawn still show what is held.
2. **A moment counts only while its thing is its shelf's next thing.** This applies to a moment, a first, a failure, a choice and a collection. The outline that is drawn is a goal to aim at; the next things on the other shelves count too, unseen.
3. **A count runs across all runs, won or lost.** It starts from the run in which the thing's needs are met, or from the first run when it has none. If its thing becomes the next thing with the count already past the number, the thing opens at the end of that run. A count never needs runs in a row.
4. **At most one new thing per shelf per run.**
5. **Exceptions:**
   - Secrets have no outline and open whenever they are done.
   - Catalog entries fill whenever the compound is made, in any order.
   - Jars fill by themselves. A full jar hatches when the player opens it.
6. **The picture on an outline.** A count shows a number over a number. A collection shows a row of pips. A moment shows one empty pip and a small picture of the shape to make, drawn as the real molecule with the parts that matter filled in and the rest blank: for "OH on three carbons in a row", three bonded carbons with an OH on each. Without the picture a player who sees no sentences would have nothing to aim at.

Rules 2 to 4 set the pace. In the model without them, a middling player held 98 things by run 20 and 125 by run 40. With them it is 60 and 94.

## Kinds of trigger

| Kind | What it is |
|---|---|
| WIN | a run won |
| MOMENT | one event in a page or a round |
| COUNT | a lifetime count |
| FIRST | the first time ever |
| COLLECTION | a set made, held or met |
| FAILURE | losing, wasting or spilling in a particular way |
| CHOICE | restraint, or taking the harder way |
| CARE | the same thing kept over runs, counted over all runs; never a clock, a login or a streak in a row |
| SECRET | no outline, found by curiosity; its mechanism is in the condition |

"Runs" in the tables is the median run on which a middling player finds the thing, from the career model in "The pace". The measured rates are in "The check". A value with a `~` is an estimate for a finding changed after review, not yet read on the engine.

## The table

### Reagent cabinet (appears the first time round 3 is beaten)

| Thing | Finding | Kind | Exact condition | Why they belong | Runs | Needs |
|---|---|---|---|---|---|---|
| Wittig | Turn a C=O into a C=C | MOMENT | A page ends with fewer C=O and more C=C than it began with | Wittig turns every C=O into a C=C in one go; the player has just done it the long way | 2 | none |
| Dihydroxylation | Put an OH on two neighboring carbons | MOMENT | A page ends with two bonded carbons that each hold an OH, a pair that was not there when the page began | The bottle puts an OH on both carbons of a C=C at once | 4 | none |
| Jones | Have four C=O at chain ends at once | MOMENT | 4 or more chain-end C=O at the end of a page | Jones takes exactly those ends one step further, to acid ends | 9 | none |
| Hydrogenation | Take every C=C off a molecule that had 3 or more | MOMENT | A page begins with 3 or more C=C and ends with none | Hydrogenation takes every C=C away | 12 | none |
| Reductive amination | Fire reduce 8 times at a C=O in the middle of a chain, where it cannot act | FAILURE (count) | Reduce is fired and acts nowhere while the molecule holds a C=O with carbon on both sides; 8 times across all runs | Reduce only takes a chain-end C=O; amination takes every C=O, inner ones too | 13 | none |
| Chlorination | Lose a round with 4 or more OH left over | FAILURE | A round is lost and the molecule ends its last page with 4 or more OH | The unused OH are exactly what chlorination swaps for Cl | 21 | none |
| Thiol-ene | Use all three of hydrate and of hydroborate in one round | COLLECTION | Hydrate and hydroborate each fire all 3 of their uses in one round | The third way to add across a C=C, after the two the player has emptied | 31 | none |
| Williamson | A Cl and an OH 3 to 5 carbons apart | MOMENT | A page ends with a Cl and an OH 3 to 5 carbons apart | That pair is what Williamson closes into a ring through O | 36 | chlorination |
| Hofmann | Three NH2 at once | MOMENT | 3 or more NH2 on the molecule at the end of a page | Hofmann turns each NH2 into a C=C and gives off ammonia | 43 | amination |
| Decarboxylation | Make 8 COOH ends | COUNT | Jones turns 8 chain ends into COOH across all runs | It takes the carbon off the ends Jones made, as carbon dioxide | 44 | Jones |
| Suzuki | A Cl meets a benzene ring | FIRST | The first time a Cl and a benzene ring stand on the molecule at once | Suzuki joins a benzene ring where a Cl sat | 57 | chlorination |
| Raney nickel | Put on 25 SH | COUNT | Thiol-ene puts SH on 25 places across all runs | Nickel takes sulfur off; the player has been putting it on | 58 | thiol-ene |
| Ozonolysis | Finish a round three atoms smaller than dealt | SECRET (moment) | At the end of a round the molecule has 3 or more fewer heavy atoms than as dealt | Ozone cuts molecules; the player found a way to cut before having the bottle | 9 | none |

### Reflex board (appears with the cabinet)

| Thing | Finding | Kind | Exact condition | Why they belong | Runs | Needs |
|---|---|---|---|---|---|---|
| tuck | Dry 100 times | COUNT | The dry reflex fires 100 times across all runs | Every dry leaves a C=C beside a C=O, which is what tuck closes | 4 | none |
| weld | One oxidize makes five C=O | MOMENT | One oxidize acts at 5 or more places | Weld joins two C=O; five made at once is where pairs stand in reach | 6 | tuck |
| shift | Fire dehydrate 50 times | COUNT | Dehydrate fired 50 times across all runs | Shift slides the C=C that dehydrate makes toward a C=O | 12 | none |
| snap | Five C=C on the molecule | MOMENT | 5 or more C=C at the end of a page | Snap joins three C=C into a six-ring | 15 | shift |
| pop | A COOH two carbons from a C=O | MOMENT | A page ends with a COOH whose carbon is two carbons from a C=O | That is exactly what pop throws off as carbon dioxide | 24 | Jones |
| seal | Meet the spec with a COOH still on the molecule | CHOICE | A round's spec is met with a COOH still on the molecule at the end | Seal closes an acid onto an OH; first the player has to keep one | 32 | Jones |
| pair | Two SH at once | MOMENT | 2 or more SH at the end of a page | Pair joins two SH | 46 | thiol-ene |
| strip | Lose a round with a Cl stuck on | FAILURE | A round is lost with 1 or more Cl on the molecule at the end | The ruined batch shows the stuck Cl; strip is what takes it off | 48 | chlorination |
| knit | An NH2 and a C=O 3 or 4 carbons apart | MOMENT | A page ends with an NH2 and a C=O 3 or 4 carbons apart | That pair is what knit closes through N | 67 | amination |
| flip | Oxidize, then reduce, in one line, 5 times | SECRET (count) | A line in which oxidize acts and a later reduce acts; 5 times across all runs | The player turns an OH to a C=O and back by hand; flip does it by itself | 10 | none |

### Glassware shelf (appears after the first run)

| Thing | Finding | Kind | Exact condition | Why they belong | Runs | Needs |
|---|---|---|---|---|---|---|
| burner | One dehydrate drives off three waters | MOMENT | Dehydrate acts at 3 or more places in one firing | The burner makes every OH lose water at once; this is a small version | 3 | none |
| recycler | Dry a molecule, then hydrate it on the same page, 20 times | COUNT | On one page dry fires and a later hydrate in the line acts; 20 such pages | What came off goes back on | 6 | none |
| cold trap | Carbon dioxide from four places at once | MOMENT | 4 or more carbon dioxide on one page | A cold trap catches the gas that escapes | 8 | none |
| burette | Hydrate five C=C in one firing | MOMENT | Hydrate acts at 5 or more places in one firing | A burette works down the chain a drop at a time | 12 | none |
| goggles | Lose a round after one page drove off 8 or more runoff | FAILURE | A round is lost in which one page drove off 8 or more runoff of any kind | Goggles come after the splash | 19 | none |
| litmus paper | The first COOH | FIRST | The first COOH ever at the end of a page | Litmus is how acid is first seen | 27 | Jones |
| dropper | Fire 150 reagents that act in one place only | COUNT | 150 reagents that acted at exactly one place, across all runs | A dropper puts one drop on one place | 26 | none |
| reflux | 500 steps that only repeat an earlier page | COUNT | 500 reflex steps that only match an earlier page of the round (the ones paid a quarter), across all runs | Reflux sends the vapor back to do it again | 27 | none |
| stopper | 100 runoff arriving at a full jar | FAILURE (count) | 100 runoff arrive at jars that are already full, across all runs | A stopper is for what spills over | 33 | a full jar |
| sieves | Go from 4 or more OH to none in one round | MOMENT | In one round a page ends with 4 or more OH, and the last page ends with none | A sieve leaves nothing wet behind | 40 | none |
| schlenk line | Fire eight different reagents in one run | COLLECTION | 8 different reagents each fired at least once in one run | A row of flasks, one for each bottle used | ~60 | doctorate, 4 later reagents |
| drying tube | Meet the spec with no water driven off | CHOICE | A round's spec is met with no water driven off in it | Dryness kept on purpose | 57 | none |
| fume hood | Lose a round with 6 acid fumes off | FAILURE | A round is lost in which 6 or more acid fumes came off | The hood takes the fumes away | 81 | none |
| cannula | Meet the spec firing only 3 kinds of reagent | CHOICE | A round's spec is met firing 3 kinds of reagent or fewer in the whole round | A cannula carries one thing down one narrow line | 100 | none |
| scrubber | Cl, NH2 and SH in one run | COLLECTION | Each of Cl, NH2 and SH stands on the molecule at the end of some page of one run | The scrubber washes exactly those three off | 111 | chlorination, amination, thiol-ene |

### Tool rack (appears after the first run)

| Thing | Finding | Kind | Exact condition | Why they belong | Runs | Needs |
|---|---|---|---|---|---|---|
| carousel | Fire all six starting reagents | COLLECTION | Hydrate, hydroborate, dehydrate, oxidize, reduce and grow each fired in one round | A carousel turns through every bottle | 2 | none |
| stir plate | Each reagent sets off more than the one before | MOMENT | On one page the first reagent sets off 1 or more steps, the second more than the first, the third more than the second | Stirring builds as it goes | ~8 | none |
| mirror | End a page on a molecule that is its own mirror image | MOMENT | A page ends with a molecule of 10 or more heavy atoms in which every atom but at most two has a twin by symmetry, and the page did not start that way | A mirror shows one half twice | 20 | none |
| seed crystal | One reagent sets off four steps by itself | MOMENT | The first reagent of a page sets off 4 or more steps by itself | A speck starts a whole crystal | 22 | none |
| stopwatch | Page 3 sets off more than pages 1 and 2 together | MOMENT | Page 3 sets off 3 or more steps, and more than pages 1 and 2 together | The last page beats the clock | 26 | none |
| spatula | Carbon dioxide comes off on all three pages | MOMENT | Carbon dioxide comes off on all three pages of a round | Oxidize scrapes one end carbon off each page | 32 | none |
| brass weights | End a round as big as it began, after 6 or more steps | MOMENT | A round ends with exactly as many heavy atoms as dealt, after 6 or more steps | Weights check that nothing was gained or lost | 36 | none |
| thermometer | Set off 12 steps on one page | MOMENT | 12 or more steps on one page | The reading of a hot page | 41 | none |
| magnet | Weld two pairs of C=O ends on one page | MOMENT | Weld fires twice on one page | A magnet draws two ends together; here two pairs are drawn together at once | ~45 | weld |
| extinguisher | A page of 6 or more steps, then a page of none | MOMENT | One page of a round sets off 6 or more steps and the next page of that round sets off none | The fire is put out: a hot page, then nothing left to burn | ~40 | none |
| loupe | Every family taken | COLLECTION | A molecule of each family (chain, ring, benzene ring, sugar, cage) taken at least once | A loupe tells close things apart | 55 | none |
| ethylene | Grow, then dehydrate, to leave a C=C arm | MOMENT | In one line grow acts and a later dehydrate acts, so that a page ends with a new two-carbon arm that holds a C=C | Ethylene is the two-carbon arm with a C=C; grow gives the arm and dehydrate gives the C=C | ~35 | none |
| methanol | End a page with a CH2OH end after carbon dioxide came off it | MOMENT | A page ends with a CH2OH chain end, and carbon dioxide came off on that same page | A reduced chain end is a CH2OH, which is methanol's own shape; the page that loses an end carbon is left holding one | ~40 | none |
| mortar | End 30 rounds smaller than they began | COUNT | 30 rounds across all runs end with fewer heavy atoms than the molecule dealt | A mortar grinds a thing down to smaller pieces | ~45 | none |
| hourglass | Lose a round on an empty last page | FAILURE | A round is lost and its last page set off nothing | Time that ran out with nothing to show | ~12 | none |
| clamp stand | One reagent in all three places of a line, 5 times | COUNT | 5 lines across all runs fire one reagent in all three slots | A clamp holds one thing in place; here one bottle holds every place | ~50 | none |
| balance | As many OH as C=O | MOMENT | A round ends with as many OH as C=O, 3 or more of each | The balance trades an OH and a C=O | 109 | none |
| alarm clock | Lose a round by less than a quarter | FAILURE | A round is lost with a yield of 75 percent of the spec or more | One more page is what a near miss wanted | ~14 | none |

### Occult cabinet (appears when the first homunculus hatches)

| Thing | Finding | Kind | Exact condition | Why they belong | Runs | Needs |
|---|---|---|---|---|---|---|
| crystal ball | Page 2 sets off exactly what page 1 did | MOMENT | Page 2 of a round sets off the same number of steps as page 1, and that number is not 0 | A crystal ball shows the same sight twice | ~14 | a homunculus |
| tower | Fall at the top | FAILURE | A run is lost in its last round (3, 6 or 9) | The tower falls from its top | 17 | a homunculus |
| monkey's paw | Meet the spec after two weak pages | MOMENT | Pages 1 and 2 make under half the spec, and the round's spec is met | A wish granted at the last moment | 25 | a homunculus |
| grimoire | Fill 8 catalog entries | COLLECTION | 8 catalog entries filled | A book of what was made | 27 | a homunculus |
| poison bottle | A round where no page sets anything off | FAILURE | A round in which no page set off anything | A batch spoiled from start to finish | 35 | a homunculus |
| elixir | Tap a homunculus on the last page and meet the spec | MOMENT | The player taps a homunculus on the last page, and the round's spec is met only after the tap (the player decides the tap; the creature does not choose) | The drink that brings a round back | 44 | a homunculus |
| goat | Put a reagent back to take another, 10 times | CHOICE (count) | 10 reagents put back to take others, across all runs | The scapegoat, given up for something wanted | 45 | doctorate |
| voodoo doll | Two reagents of one line each close 2 or more rings | MOMENT | Two reagents of one line each set off 2 or more ring-closing steps | Two pins, two rows | 51 | magnet |
| black candle | Lose rounds under 5 different inspections | FAILURE (collection) | Rounds lost under 5 different inspections | One candle lit for each loss | 71 | master's |
| cursed idol | Lose a run while holding 20 gold | FAILURE | A run is lost while 20 or more gold is held | Gold kept for gold's sake | 86 | master's |
| aqua regia | Dissolve a plain tail | MOMENT | A round ends with the molecule having lost a stretch of 6 plain carbons (no group on them) that it was dealt with | Aqua regia dissolves what nothing else will; here it dissolves the plain tail | ~70 | a homunculus |
| transmute | Sell 5 instruments back for gold | CHOICE (count) | 5 instruments sold back for gold, across all runs | Lead into gold | 126 | a homunculus |
| hand of glory | Five instruments in one round | COLLECTION | 5 different instruments used in one round | A candle on every finger | 151 | 12 instruments |
| philosopher's stone | Hatch all ten homunculi | COLLECTION | All ten homunculi hatched | What alchemy was always after | 185 | all ten homunculi |
| ouija board | End a round on a molecule of exactly 13 atoms besides hydrogen | SECRET (moment) | A round ends on a molecule of exactly 13 heavy atoms | The spirits' number | 8 | none |
| mystery bottle | Fire three reagents that act nowhere on one page | SECRET (failure) | All three reagents of a page find nothing to act on | A bottle whose label is gone | 3 | none |
| ouroboros | Close a ring on every page of a run | SECRET (moment) | A ring closes on every page of a whole run of 3 rounds or more | The snake that eats its tail | 117 | none |

### Jars and homunculi

Each jar appears the first time its runoff comes off. A full jar hatches when the player opens it.

| Thing | Finding | Kind | Exact condition | Why they belong | Runs | Needs |
|---|---|---|---|---|---|---|
| Hydrogen | Fill the hydrogen jar | COUNT | 130 hydrogen | A balloon is a bag of it | 10 | none |
| Water | Fill the water jar | COUNT | 200 water | Its body is the water | 13 | none |
| Salt | Fill the salt jar | COUNT | 50 oxidize on a chain-end OH | Each one adds a crumb of the cure | 19 | none |
| Acid | Fill the acid jar | COUNT | 200 acid fumes | It eats what it is fed | 20 | none |
| Slime | Fill the slime jar | COUNT | 70 hydroborate that acted | It sticks where the OH was put | 20 | none |
| Wood spirit | Fill the wood spirit jar | COUNT | 40 reduce that acted | Wood spirit is what reducing makes | 22 | none |
| Carbon dioxide | Fill the dry ice jar | COUNT | 50 carbon dioxide | Dry ice is the solid of it | 24 | none |
| Seedling | Fill the seedling jar | COUNT | 120 grow that acted | Each grow is a seed planted | 32 | none |
| Ammonia | Fill the smelling salts jar | COUNT and FAILURE | 40: each ammonia from Hofmann adds 1, and each run lost adds 1 once the jar is on the bench | Smelling salts wake the one who fainted; losing is fainting | 81 | Hofmann |
| Brimstone | Fill the brimstone jar | COUNT | 80: each sulfur from Raney nickel adds 1, and each round that reaches overreact adds 2 | Fire and brimstone | 173 | Raney nickel |

The first eight jar sizes are the settled ones in `HOMUNCULI.md`. The ammonia and brimstone sizes are set here.

### Notebook shelf (appears after the first run)

| Thing | Finding | Kind | Exact condition | Why they belong | Runs | Needs |
|---|---|---|---|---|---|---|
| lean | Run out of uses 40 times | COUNT | 40 times a reagent fired its third and last use of a round, across all runs | Lean gives four reagents five uses each; the player keeps running out | 8 | none |
| long | A molecule of 45 atoms | MOMENT | 45 or more heavy atoms at the end of a page | The long notebook deals bigger molecules | 12 | none |
| gap | Meet the spec after an empty first page, 3 times | COUNT | 3 rounds whose spec is met after a first page that set off nothing | Gap deals every molecule with a hole to repair; the player already can | 19 | none |
| reverse | Win a long run | WIN | A run of 6 or 9 rounds is won | Reverse fires each line last first: going back over a won run | 33 | master's |
| halide | Fire chlorination 30 times | COUNT | Chlorination fired 30 times across all runs | The halide notebook swaps reduce and hydroborate for chlorination and Williamson | 62 | chlorination, Williamson |
| anchor | Use the same line on all three pages | MOMENT | The same three reagents in the same order on all three pages of a round | The anchor notebook fires the first line again on every page | 135 | none |

The halide notebook replaces phenol, since add-phenol was rejected in `REACTIONS.md`.

### Wall of degrees and hazard labels

| Thing | Finding | Kind | Exact condition | Why they belong | Runs | Needs |
|---|---|---|---|---|---|---|
| Master's (6 rounds) | Win a bachelor's | WIN | A 3-round run is won | Each degree is won to open the next | 1 | none |
| Doctorate (9 rounds) | Win a master's | WIN | A 6-round run is won | Each degree is won to open the next | 4 | master's |
| Hazard 1, late notice | Win a doctorate | WIN | A 9-round run is won | A rating is earned by finishing the whole course | 13 | doctorate |
| Hazard 2, dirty glass | Meet the spec 4 times with 3 or fewer waters driven off | COUNT | 4 rounds at hazard 1 are met with 3 or fewer waters driven off in the round | Dirty glass makes water cost something; this is keeping a round dry | ~30 | hazard 1 |
| Hazard 3, two-part spec | End 5 rounds with 3 or more ring-closing steps and 3 or more OH | COUNT | 5 rounds at hazard 2 end with 3 or more ring-closing steps in the round and 3 or more OH on the molecule | A two-part spec asks for two kinds of thing at once; this is two kinds at once | ~45 | hazard 2 |
| Hazard 4, one family | Take the same family 25 times | COUNT | 25 rounds at hazard 3 in which the molecule taken is of one family; the count is kept for each family and the first to reach 25 counts | One family means the deal gives one family; this is the habit of favoring one | ~60 | hazard 3 |
| Hazard 5, short reach | Close 20 rings across 5 carbons | COUNT | 20 rings closed across 5 carbons, counted from hazard 4 on | Short reach cuts the long reach; this is the habit of using it | ~80 | hazard 4 |
| Hazard 6, early rule | Beat rounds 1 and 2 at unstable or better, 10 runs | COUNT | 10 runs at hazard 5 in which rounds 1 and 2 both end at unstable or better | An early rule asks the first rounds to do more; this is doing them well | ~100 | hazard 5 |
| Hazard 7, hungry jar | Tap a homunculus in 40 rounds | COUNT | A homunculus is tapped in 40 rounds across all runs from hazard 6 on | A hungry jar punishes leaning on the creature | ~130 | hazard 6 |
| Hazard 8, twice over | Overreact 3 times at hazard 7 | COUNT | 3 rounds at hazard 7 end at overreact | The last label asks for the top word | ~190 | hazard 7 |

The rule of each level is in `DIFFICULTY_2.md` section 4. Hazard 1's rule now reads: the spec is hidden until round 4 is met. Only hazard 1 asks for a won doctorate. Hazards 2 to 8 each ask for a count of the habit the label punishes, so the ladder is not "win to open the next level".

### Inspection book (appears after the first run)

A new game holds no inspection. Each found inspection enters the draw for rounds 3, 6 or 9. Each one is opened by the habit it attacks, so meeting it shows the player what the habit was.

| Thing | Finding | Kind | Exact condition | Why they belong | Runs | Needs |
|---|---|---|---|---|---|---|
| Wet flask (every C=C dealt with an OH on it) | Hydrate 60 times | COUNT | Hydrate fired 60 times across all runs | A lab always wetting draws a visit about wet work | 7 | none |
| Capped ends (chain ends cannot change) | Hydroborate 40 times | COUNT | Hydroborate fired 40 times | A habit of working chain ends draws a visit about the ends | 9 | none |
| Two flasks (both molecules played at once) | Take the harder molecule | FIRST | The first time the harder molecule of a pair is taken | A player who chooses has to work both | 12 | none |
| Damp-proof (no water comes off) | 30 pages that drive off 5 or more waters | COUNT | 30 pages that drove off 5 or more waters | A lab living on water is made to do without | 13 | master's |
| Runaway (every C=O grows an arm between pages) | End 10 rounds 10 or more atoms bigger than dealt | COUNT | 10 rounds ending 10 or more atoms bigger than dealt | A molecule grown by hand meets one that grows by itself | 15 | doctorate |
| Six only (rings close only across 4 carbons) | 150 rings | COUNT | The ring reflex closes 150 rings | A lab fond of every ring size gets one size | 18 | none |
| Turnover (every C=O becomes OH and back between pages) | Oxidize 150 times | COUNT | Oxidize acts 150 times | A lab of oxidizing gets everything turned over | 23 | doctorate |
| Fresh only (a group made this page cannot change again) | Hydrate, then oxidize, in one line, 10 times | COUNT | 10 lines where hydrate acts and a later oxidize acts | Stacking changes on one spot draws a ban on it | 27 | master's |
| Heat at the turn (the OH nearest a C=O loses water before each page) | Dehydrate beside a C=O, 25 times | COUNT | Dehydrate acts on an OH that sits next to a C=O, 25 times across all runs | A lab always drying beside the C=O draws a visit that does it for the player first | ~60 | master's |
| Shut jar (runoff does not feed the homunculus) | Tap a homunculus in 3 rounds of one run | MOMENT | A homunculus tapped in 3 rounds of one run | Leaning on the creature shuts its jar | 72 | doctorate, a homunculus |
| Blind pair (the pair shows family names only) | Draw the pair again 3 times in one round | CHOICE | The pair drawn again 3 times in one round | Looking hard at the pair earns names only | 106 | master's |
| Short reach (whole-molecule instruments act on one side) | Use whole-molecule instruments 40 times | COUNT | 40 uses of the burner, the magnet or another whole-molecule instrument | Heavy use draws a limit on it | 107 | master's, burner |
| Shut fast (loose rings stay shut at the turn) | Repeat a line 6 times | COUNT | 6 times the same line of three on two pages in a row | Repeating draws a rule that stops repeating | 108 | master's |

### Catalog (appears after the first run)

The catalog fills in any order. Its outline shows the next blank page. An entry fills the first time the molecule at the end of a page carries the compound's ring and groups. That is the core of the compound, not the whole compound. Each entry pays credit once.

| Thing | Finding | Kind | Exact condition (new on that page) | Why they belong | Runs | Needs |
|---|---|---|---|---|---|---|
| Tetrahydrofuran | The catalog's first page | FIRST | A saturated ring of 4 carbons and an O | The plainest ring a lab names; it shows what the catalog is | 1 | none |
| Olean (olive fly scent) | Two oxygen rings on one carbon | MOMENT | Two rings through O sharing one carbon | Two rings on one carbon is the olive fly's scent | 1 | none |
| Vitamin E ring (chroman) | A ring on a phenol | MOMENT | A benzene ring fused to a ring through its O | The ring at the heart of vitamin E | 3 | none |
| Ribose ring | The RNA sugar's ring | MOMENT | A ring of 4 C and an O, with an OH on the carbon beside the ring O and on the next carbon | The sugar of RNA is this ring with its OH | 4 | none |
| Glycerol | Three OH in a row | MOMENT | OH on three carbons in a row | Three OH in a row is glycerol | 6 | none |
| Glucose ring | The blood sugar's ring | MOMENT | A ring of 5 C and an O, with an OH on the carbon beside the ring O and on the next carbon | The sugar of blood is this ring with its OH | 7 | none |
| Decalin | Two carbon six-rings sharing a side | MOMENT | Two fused carbon six-rings | The frame many natural compounds sit on | 7 | weld |
| Menthol ring | A carbon ring with an OH | MOMENT | A carbon six-ring with an OH on a ring carbon | Mint's cooling ring | 8 | weld |
| Carvone ring | A ring C=C beside a ring C=O | MOMENT | A carbon six-ring with a C=C beside its C=O | Spearmint's ring | 8 | weld |
| Acetogenin core | Two oxygen five-rings side by side | MOMENT | Two rings of 4 C and an O joined side by side | The core of a fruit tree's toxin | 14 | none |
| Norbornene | A bridged ring | MOMENT | The bridged 7-carbon frame with one C=C | The bridge is the shape in the name | 18 | snap |
| Wieland-Miescher ketone | Two fused six-rings with a C=O | MOMENT | Two fused carbon six-rings with a ring C=O | Two fused six-rings and a C=O | 20 | weld, snap |
| Steroid frame | Four fused rings | MOMENT | Three six-rings and a five-ring fused as in a steroid | The frame every steroid is built on | 28 | weld, snap |
| Adipic acid | A COOH at each end of a chain | MOMENT | A chain with a COOH at each end | What nylon starts from | 39 | Jones |
| Butyrolactone | A COOH closed into a ring | MOMENT | A five-ring through O with a C=O beside the O | The ring seal makes | 51 | seal |
| Lipoic acid ring | Two sulfurs in a ring | MOMENT | A five-ring holding S-S | The ring of lipoic acid | 51 | pair |
| Pyrroline | Nitrogen in a ring | MOMENT | Any ring holding an N | The ring knit makes | 104 | knit |
| Ladder polyether | Oxygen six-rings in a row | MOMENT | Two oxygen six-rings fused side by side | The ladder of red tide toxins | 108 | tuck, Williamson |
| Cholesterol | The steroid with its OH | MOMENT | The steroid frame with an OH on its first ring | The last step of a long road | 127 | steroid frame |
| Adamantane | A cage of four six-rings | SECRET (moment) | The 10-carbon cage of four six-rings | A piece of diamond, built without being told to | 38 | weld, snap |

### The circle (drawn under the molecule once five homunculi have hatched, about run 20)

| Thing | Finding | Kind | Exact condition | Why they belong | Runs | Needs |
|---|---|---|---|---|---|---|
| Slot 1 | Close 1,000 rings | COUNT | 1,000 ring-closing steps of every reflex across all runs | A circle drawn one ring at a time | 61 | five homunculi |
| Slot 2 | Lose a run at each of the three lengths | FAILURE (collection) | A run lost in a bachelor's, a run lost in a master's and a run lost in a doctorate, each at least once | A circle of three failures, one for each length | ~28 | five homunculi, doctorate |
| Slot 3 | Show all ten jars | COLLECTION | All ten jars have appeared on the bench | The circle drawn in everything that comes off, one point for each jar | ~75 | five homunculi, Hofmann, Raney nickel |
| Slot 4 | Drive off six kinds of runoff in one run | COLLECTION | Water, hydrogen, carbon dioxide, acid fumes, ammonia and sulfur each driven off in one run | The six points of the star | 75 | five homunculi, Hofmann, Raney nickel |
| Slot 5 | Win a doctorate with every round at unstable or better | WIN | A doctorate won with every round at unstable or better | The circle closed by a run without a weak round | 98 | five homunculi, doctorate |
| Slot 6 | Take each of the ten homunculi into a run | COLLECTION | Each of the ten homunculi taken into at least one run | Ten made lives around the circle | 175 | all ten homunculi |

### The drawer (cosmetic: papers, pens, flags, bench props and hats; nothing here changes a rule)

| Thing | Finding | Kind | Exact condition | Why they belong | Runs | Needs |
|---|---|---|---|---|---|---|
| graph paper | Reach stable, unstable, volatile and overreact in one run | COLLECTION | Stable, unstable, volatile and overreact each reached in one run | Paper for plotting the whole curve | 15 | none |
| red pencil | Meet the spec by under 5 percent, 5 times | COUNT | 5 rounds met with a yield under 105 percent of the spec | The grader's mark for a bare pass | 29 | none |
| linen flags | End 100 rounds at unstable or better | COUNT | 100 rounds ending at unstable or better | Plain cloth for steady work | 33 | none |
| striped flags | Open hazard 1 | FIRST | Hazard 1 opened | Hazard stripes | 34 | hazard 1 |
| fountain pen | Start 40 runs on one notebook | CARE | 40 runs across all runs started with the same notebook; not in a row | A pen for a hand that has settled on its book | ~100 | two notebooks |
| scorched paper | Lose a round whose hottest page set off 8 or more steps | FAILURE | A round is lost and one of its pages set off 8 or more steps | The page shows the burn of a round that ran hot and still failed | ~50 | none |
| parchment | Open the first jar | FIRST | The first jar opened | Alchemy's own paper | 48 | a homunculus |
| gold-thread flags | End 15 rounds at overreact | COUNT | 15 rounds ending at overreact | Gold thread for the top word | 53 | none |
| lab coat | Spill 30 acid fumes in one run | FAILURE | 30 or more acid fumes come off in one run | A coat stained by what spilled | ~120 | none |
| intern | Take the easier molecule 50 times | COUNT | The easier molecule of the pair taken 50 times | The intern gets the easy work | 13 | none |
| index cards | Be dealt 120 different molecules | COLLECTION | 120 different molecules dealt | One card for each molecule met | 19 | none |
| scroll | Every inspection met | COLLECTION | All 13 inspections met in a round | The inspector's full list of rules | 111 | all inspections |
| clipboard | Start a run with each of the 7 notebooks | COLLECTION | A run started with each of the 7 notebooks | A record sheet with every line filled | 159 | all notebooks |
| duck | Seven waters on one page | SECRET (moment) | 7 or more waters driven off on one page | A bath duck floats where water gathers | 3 | none |
| cat | Lose a round with under a tenth of the spec | SECRET (failure) | A round lost with a yield under a tenth of the spec | A cat walked across the work | 8 | none |
| milk carton | Leave a full jar unopened for 3 runs | SECRET (care) | A full jar left unopened through 3 runs | Milk left out turns | 18 | a full jar |
| raven | Lose in round 1 or 2, 5 times | SECRET (failure) | 5 runs across all runs are lost in round 1 or 2; not in a row | An omen after an early fall | ~26 | none |
| coffee cup | Reach round 9 with no empty page | SECRET (moment) | A run reaches round 9 with no page that set off nothing | What a long night runs on | 22 | doctorate |
| a hat for each homunculus (10) | Take it along 8 times | CARE | That homunculus taken into 8 runs | A hat for the one that stood by the player | hydrogen 32, water 53, acid 76, salt 76, slime 78, wood spirit 84, carbon dioxide 86, seedling 97, ammonia 152, brimstone 255 | that homunculus |

## Counts by kind (166 things)

A thing counts under the first word of its kind ("FAILURE (count)" is a FAILURE, "COUNT and FAILURE" is a COUNT). The ten hats are one idea repeated, so they are shown apart.

| Kind | Things |
|---|---|
| MOMENT | 53 |
| COUNT | 44 (10 of them are the jars) |
| FAILURE | 15 (20 counting the four secrets and the ammonia jar that turn a loss or a waste to use) |
| COLLECTION | 15 |
| SECRET | 11 (ozonolysis, flip, ouija board, mystery bottle, ouroboros, adamantane, duck, cat, milk carton, raven, coffee cup) |
| FIRST | 6 |
| CHOICE | 6 |
| WIN | 5 |
| CARE | 1 (the fountain pen), and the 10 hats |

- MOMENT is 53 of 166, 32 percent. It is the largest kind because most of the game is things that happen on a page. The other eight kinds are each used at least once outside the hats.
- **Need a run won:** 5 of 166, 3 percent. They are the master's, the doctorate, hazard 1, the reverse notebook and circle slot 5.
- **Need a round's spec met, but no run won:** 8 more: seal, cannula, gap, monkey's paw, drying tube, red pencil, elixir and hazard 2. With these it is 13 of 166, 8 percent.
- **Sit behind a won run:** 30 of 166, 18 percent. These are the 5 wins above, hazards 2 to 8, the striped flags, the 8 things behind the master's (damp-proof, fresh only, heat at the turn, blind pair, short reach, shut fast, black candle, cursed idol), the clipboard and the scroll, and what the open doctorate lets in (runaway, turnover, shut jar, goat, schlenk line, coffee cup, circle slot 2). The hazard ladder is 9 of the 30 and is one chain.
- **A player who never wins a nine-round run** (the model with every doctorate lost):
  - holds 60 of the 73 reagents, reflexes and instruments by run 80, 69 by run 150 and 72.7 by run 300;
  - four fifths of 73 is 59;
  - none of the 73 needs a doctorate won.
- **A player who never wins any run:** see "A player who never wins a run" in the check below. 87 of 166 can open and 79 stay shut.
- **Secrets:** 11. **Losing, wasting or spilling:** 20.
- **Fed by a loss, early (median run 5 to 20):** tower 17, goggles 19, chlorination 21, hourglass 12 and alarm clock 14. The last two are new.

## The check

### How it was checked

- **Engine:** `engine_paper.py` with `library_paper.py`, which holds the judged pool of 19 reagents and the twelve reflexes.
  - The player is the greedy one: it takes the most yield on each page.
  - Molecules are dealt as the game deals them (`molecules.deal_molecule`, tier 3).
- **Runs:** 300 of each length, 16,200 pages played. 11,700 pages count, because a run ends at its first lost round.
  - **Bachelor's runs:** the six, with ring and dry.
  - **Master's runs:** the six plus two of Wittig, dihydroxylation, hydrogenation, Jones and ozonolysis (one from round 2, both from round 4), with seven reflexes.
  - **Doctorate runs:** the six plus one later reagent in rounds 1 to 3 and two in rounds 4 to 6. Rounds 7 to 9 carry three of the six plus five later reagents. All twelve reflexes are held.
- **Losing:** the engine has no spec, so a lost round is read from its yield.
  - A round is lost when its yield falls below the line that the target share of rounds of that number fail.
  - The pass shares are from `DIFFICULTY_2.md` section 5: 90, 87, 82, 89, 82, 75, 87 and 80 percent, and 85, 65 and 45 percent for the last round of each length.
  - Many rounds tie at that line, so the share of runs won came out at 75, 36 and 17 percent against targets of 66, 30 and 11.
  - Findings that need a loss are therefore a little rarer in the game than measured here.
- **Rates:**
  - A "run" rate is the share of runs in which the thing happened at least once.
  - For a count it is the mean count per run.
  - A finding that needs a later reagent was read only on doctorate runs that carried it ("carrying X").

### Measured, per run (bachelor's / master's / doctorate)

| Finding | Measured | Number set |
|---|---|---|
| Wittig: fewer C=O, more C=C | 0.33 / 0.81 / 0.80 | moment |
| Dihydroxylation: new neighbor OH pair | 0.24 / 0.59 / 0.56 | moment |
| Jones: chain-end C=O at once | 3 or more: 0.78 / 0.38 / 0.32; 4 or more: 0.41 / 0.17 / 0.14 | raised from 3 to 4 (3 was about one run) |
| Hydrogenation: 3 or more C=C to none | 0.05 / 0.20 / 0.41 | moment |
| Ozonolysis: 3 atoms smaller | 0.003 / 0.06 / 0.14 | moment |
| Amination: reduce wasted on an inner C=O | 0.70 / 0.89 / 1.15 a run | 8 |
| Thiol-ene: both used up | 0.04 / 0.06 / 0.09 | collection |
| Chlorination: lose with 4 OH | 0.003 / 0.07 / 0.12 | moment |
| Decarboxylation: COOH made by Jones | 0.34 (master's carrying Jones) / 1.07 (doctorate carrying Jones) a run | 8 |
| Williamson: Cl and OH 3 to 5 apart | 0.38 carrying chlorination | moment |
| Suzuki: Cl and benzene ring | 0.19 carrying chlorination | first |
| Hofmann: 3 NH2 | 0.36 carrying amination | moment |
| Raney nickel: SH made | 6.2 a run carrying thiol-ene | 25 |
| tuck: dry fired | 16 / 34 / 34 a run; dry twice on one page was 0.93 a run | 100 (twice on a page was trivial) |
| flip: oxidize then reduce in a line | 1.07 / 0.42 / 0.42 a run | 5 (the exact line oxidize, reduce, oxidize was 0.14 in bachelor's runs and 0.003 later, which would strand a player) |
| shift: dehydrate fired | 2.5 / 3.9 / 5.1 a run | 50 (shift's own trigger never stood at the end of a page in 900 runs) |
| weld: one oxidize at 5 places | 0.76 / 0.55 / 0.47; at 2 places 0.94 | raised from 2 to 5 |
| snap: C=C at once | 3 or more 0.67; 5 or more 0.19 / 0.15 / 0.25 | raised from 3 to 5 |
| pop: acid end two from a C=O | 0.03 (master's carrying Jones, pop not held); pop fired in 0.26 of doctorate runs carrying Jones | moment, read as 0.2 |
| seal: spec met with a COOH | 0.20 / 0.21 carrying Jones | choice |
| pair: two SH | 0.42 carrying thiol-ene | moment |
| strip: lose with a Cl | 0.26 carrying chlorination | moment |
| knit: NH2 and C=O 3 or 4 apart | 0.05 standing at page end plus 0.08 where knit fired: 0.12 carrying amination | moment |
| burner: dehydrate at 3 places | 0.09 / 0.47 / 0.51 | moment |
| recycler: hydrate after a dry on one page | 0.88 a run as a moment; 2.4 / 4.5 / 4.5 a run as a count | 20 (a moment was trivial) |
| cold trap: 4 carbon dioxide on a page | 0.43 / 0.44 / 0.38 | moment |
| burette: hydrate at 5 places | 0.06 / 0.12 / 0.19 | moment |
| goggles: lose after an 8-runoff page | 0.01 / 0.16 / 0.13 | moment |
| litmus: first COOH | 0.24 / 0.30 carrying Jones | first |
| dropper: acted at one place | 8.4 / 13 / 14 a run | 150 |
| reflux: steps repeating a page | 15 / 28 / 27 a run | 500 |
| sieves: 4 OH to none | 0.02 / 0.10 / 0.13 | moment |
| drying tube: met with no water | 0.02 / 0.007 / 0.08 | choice |
| fume hood: lose with 6 fumes | 0 / 0 / 0.03; with 10 fumes 0.007 | lowered from 10 to 6 |
| cannula: met with 3 kinds | 0.03 / 0.06 / 0.04 | choice |
| carousel: all six in a round | 0.41 / 0.28 / 0.32 | collection |
| (old trigger, replaced) stir plate: rising pages | 0.35 / 0.26 / 0.28 | moment |
| mirror: own reflection | 0.023 / 0.033 / 0.05 (looser symmetry gave the same) | moment |
| seed crystal: first reagent sets off 4 | 0.06 / 0.50 / 0.59 | moment |
| stopwatch: page 3 beats 1 and 2 | 0.24 / 0.32 / 0.27 | moment |
| spatula: carbon dioxide every page | 0.24 / 0.18 / 0.17 | moment |
| brass weights | 0.25 / 0.11 / 0.24 | moment |
| thermometer: 12 steps | 0.04 / 0.29 / 0.22 | moment |
| (old trigger, replaced) magnet: 5 rings on a page | 0 / 0.25 / 0.26 | moment |
| (old trigger, replaced) extinguisher: first overreact | 0.07 / 0.18 / 0.39 | first |
| (old trigger, replaced) ethylene: grow twice in a line | 0.003 / 0.09 / 0.18 | moment |
| (old trigger, replaced) methanol: reduce acted | 1.6 / 1.1 / 1.2 a run; reduce at 3 places 0.51 / 0.10 / 0.05 | 20 |
| (old trigger, replaced) mortar: reagents fired | 26 / 41 / 51 a run | 600 |
| (old trigger, replaced) hourglass: empty pages | 0.13 / 1.4 / 3.1 a run | 40 |
| balance | 0.02 / 0.04 / 0.04 | moment |
| (old trigger, replaced) alarm clock: lose within 5 percent | 0.02 / 0.04 / 0.02 | moment |
| (old trigger, replaced) crystal ball: volatile on page 1 | 0 / 0.23 / 0.43; stable on page 1 was 0.45 / 0.85 / 0.88 | raised from stable to volatile |
| tower: lose in the last round | 0.14 / 0.17 / 0.14 | moment |
| monkey's paw | 0.05 / 0.09 / 0.11 | moment |
| voodoo doll | 0 / 0.25 / 0.26 | moment |
| poison bottle: round with no steps | 0.003 / 0.003 / 0.12 | moment |
| (old trigger, replaced) aqua regia: lose with a 6-carbon tail | 0 / 0.003 / 0.04 | moment |
| ouija board: 13 atoms | 0.06 / 0.04 / 0.14 | moment |
| mystery bottle: page of three wasted | 0.03 / 0.39 / 0.69 | moment |
| ouroboros: ring on every page of a run | 0.04 / 0.013 / 0 | moment (a secret; the long tail is on purpose) |
| lean: third uses | 3.4 / 5.1 / 6.2 a run | 40 |
| long: 45 atoms | 0.013 / 0.12 / 0.17 | moment |
| gap: met after an empty first page | 0.05 / 0.11 / 0.19 a run | 3 |
| anchor: one line all round | 0.023 / 0.017 / 0 | moment (rare unless aimed at; a person can choose to do it) |
| halide: chlorination fired | 3.3 a run carrying chlorination | 30 |
| wet flask, capped ends | hydrate 5.9 / 9.5 / 10.5, hydroborate 4.1 / 4.1 / 5.0 a run | 60, 40 |
| damp-proof: pages with 5 waters | 0.5 / 2.8 / 2.8 a run | 30 |
| runaway: 10 atoms bigger | 1.0 / 1.2 / 1.2 a run | 10 |
| six only: ring reflex | 11 / 7 / 9 a run | 150 |
| turnover: oxidize acted | 5.7 / 7.6 / 8.1 a run | 150 |
| fresh only: hydrate then oxidize | 0.17 / 0.36 / 0.41 a run | 10 |
| (old trigger, replaced) heat at the turn: lose with a 6-step page | 0 / 0.10 / 0.02 | moment |
| shut fast: line repeated on the next page | 0.19 / 0.17 / 0.10 a run | 6 |
| (old trigger, replaced) scorched paper: 15 steps | 0.013 / 0.11 / 0.09 | moment |
| red pencil: met within 5 percent | 0.27 / 0.06 / 0.18 a run | 5 |
| linen flags: unstable rounds | 1.3 / 2.4 / 3.3 a run | 100 |
| gold-thread flags: overreact rounds | 0.07 / 0.22 / 0.72 a run (the engine's line for the spec is low, so this is high; 0.3 used) | 15 |
| (old trigger, replaced) lab coat: wasted reagents | 4.6 / 6.7 / 14 a run | 100 |
| duck: 7 waters on a page | 0.17 / 0.38 / 0.39 | moment |
| cat: lose under a tenth | 0.003 / 0.03 / 0.20 | moment |
| (old trigger, replaced) raven: run lost in round 1 or 2 | 0.11 / 0.20 / 0.19 a run, so two in a row about 0.01 / 0.04 / 0.04 | moment |

Catalog cores, new on a page (per run, bachelor's / master's / doctorate):

| Entry | Measured |
|---|---|
| tetrahydrofuran | 0.97 / 0.91 / 0.92 |
| olean | 0.67 / 0.37 / 0.44 |
| vitamin E ring | 0.26 / 0.18 / 0.26 |
| ribose ring | 0.07 / 0.32 / 0.27 |
| glycerol | 0.01 / 0.20 / 0.13 |
| glucose ring | 0.03 / 0.11 / 0.13 |
| menthol ring | 0 / 0.68 / 0.62 |
| decalin | 0 / 0.64 / 0.68 |
| carvone ring | 0 / 0.30 / 0.33 |
| norbornene | 0 / 0.35 / 0.34 |
| Wieland-Miescher ketone | 0 / 0.19 / 0.18 |
| steroid frame | 0 / 0.09 / 0.07 |
| cholesterol | 0 / 0 / 0.007 |
| acetogenin core | 0.007 / 0.05 / 0.05 |
| adamantane | 0 / 0.017 / 0.03 |
| butyrolactone | 0.11 carrying Jones |
| lipoic acid ring | 0.49 carrying thiol-ene |
| pyrroline | 0.08 carrying amination |
| adipic acid | 0.05 carrying Jones |

### Flagged and fixed

**Under one run (trivial), changed.** Each was raised or turned into a count, as in the table:
- Jones at 3 chain ends.
- Weld at 2 OH.
- Snap at 3 C=C.
- Tuck as two drys on a page.
- The recycler as a moment.
- The crystal ball at stable.
- The spatula's first version, a shorter chain (1.0 a run).
- A cannula for a C=O five carbons from an OH (0.64 a run).

**Kept on purpose:**
- Tetrahydrofuran fills in the first run so the catalog shows what it is.
- Olean, the menthol ring and decalin come in one or two runs once their reflexes are held. They are the catalog's easy pages.

**Over 300 runs (out of reach), changed:**
- **Glucose:** three OH on its ring was 0.003 a run, about 300 runs while outlined. It now asks for two.
- **Ladder polyether:** never made in 900 runs by a player playing for yield. `DIFFICULTY_2.md` found a line on 1 dealt molecule in 18. Its rate is set for a player who aims at it: 0.01 a doctorate run, about 100 runs. It must be read on the rig before it is listed.
- **Fume hood:** 10 fumes was 0.007 a run. It is now 6.

**Dropped, never made in 900 runs:**
- Acetone as an exact end group (0).
- A phenol made by Suzuki (0). Suzuki acts only on a Cl beside a C=C or a benzene ring, which the dealt molecules seldom give.
- A six-ring with a group on every corner (0).
- Cubane: no reflex makes a four-ring.
- Two lines were also dropped as findings: oxidize, reduce, oxidize (0.003 after the bachelor's runs) and a line followed by its reverse on the next page (0.003).

### Could not be checked on the engine, and why the numbers are what they are

**Run results and hazards.**
- Win chances are from `DIFFICULTY_2.md` section 5: bachelor's 66, master's 30 and doctorate 10 percent.
- At hazards 1 to 8 they are 7, 6, 4.8, 4.1, 3.3, 2.5, 1.6 and 0.8 percent. Each level keeps the share of the level before given in section 4.
- These set the WIN findings and how many runs reach each hazard. Hazard 1 is the only hazard that needs a win.
- Hazards 2 to 8 are counts of the habit the label punishes, with estimated medians. Each must be read on the engine at its own hazard before it is listed.

**Jars.**
- The engine's runoff differs from the game's: its greedy player makes 3 to 4 times the carbon dioxide the game measured. So the jars use the game's own reads in `HOMUNCULI.md`.
- Per round: water 3.4, hydrogen 2.8, acid fumes 2.1, grow 0.75, hydroborate 0.71, oxidize on a chain-end OH 0.55, carbon dioxide 0.43, reduce 0.38.
- A run lasts 2.7, 4.4 or 5.3 rounds, by length.
- **Ammonia:** Hofmann gave 0.33 a run in doctorate runs that carried it. With each lost run adding 1, a jar of 40 fills about 40 runs after Hofmann.
- **Brimstone:** Raney nickel gave 0.32 sulfur a run when carried, and about 0.3 rounds a run reach overreact for a middling player. A jar of 80 fills about 115 runs after Raney, which makes it the slowest jar.

**Homunculus use** (hats, elixir, shut jar, milk carton, circle slot 6, philosopher's stone).
- One homunculus is taken each run, drawn evenly from those hatched.
- Hats at 8 runs each land between run 30 and run 100 for the eight fast jars.
- **Elixir:** a tap on the last page that turns a lost round into a met one, about 1 run in 10 once a homunculus is held.

**Gold and buying** (cursed idol, transmute, goat, hand of glory, short reach).
- The target is a run ending with about 5 gold (`DIFFICULTY_2.md` section 7). So holding 20 gold when a run is lost is a real choice: about 5 to 8 runs in 100.
- Selling an instrument pays half its price, so it is rare: about 1 sale every 20 runs, and 5 sales take about 100 runs.
- Ten put-backs need many swaps of the pool within a run: about 0.4 put-backs a doctorate run.
- Five instruments used in one round needs a deep shelf: about 4 runs in 100 once 12 are held.
- Whole-molecule instruments are used about 1.5 times a doctorate run.
- The clamp stand (one reagent in all three places of a line) is a line a player seldom picks by yield; 5 such lines is an estimate, not read on the engine.

**The bench and the pair** (loupe, two flasks, blind pair, intern, index cards, fountain pen, clipboard, scroll, raven).
- The median player takes the harder molecule in 14 percent of pairs (`LOOP.md`). The first time is about run 2 once the pair shows, and 50 easier ones take about 13 runs.
- Five families taken: about 1 run in 7 to fill in the last one.
- Drawing the pair three times costs 6 gold and is chosen, not met: about 3 runs in 100.

**Inspections met and lost under** (black candle, scroll). An inspection is met in rounds 3, 6 and 9. Losing under five different ones takes about 70 runs.

### Replaced after review: not yet read on the engine

Each of these changed trigger has an estimated Runs value in the tables and needs a read on the rig before it is listed: methanol, magnet, scorched paper, extinguisher, ethylene, mortar, clamp stand, fountain pen, aqua regia, crystal ball, lab coat, circle slots 2 and 3, hazards 2 to 8, the schlenk line, the stir plate, hourglass, alarm clock, the heat at the turn inspection and the raven. The old readings stay in the measured table, marked, as a guide to how often the plain version of each happened.

### A player who never wins a run

- **Shut behind a win:** 30 of 166 (the master's, the doctorate, the hazards, the striped flags, the reverse notebook, circle slots 2 and 5, and what the open degrees let in).
- **Shut behind the reagent cabinet and reflex board:** those two shelves open at the first beaten round 3, which in a three-round run is the first win. So this player never holds the 13 later reagents or the 10 later reflexes, and 26 more things that need them. In all 79 of 166 stay shut and 87 can open.
- **Open point for the owner:** if the cabinet and board opened at the first beaten round 2 instead, only the 30 stay shut for a player who never wins a run and a few that need a doctorate. This is not changed here because the first-win trigger is already in `LOOP.md`.
- **What still pays a player who loses:** the tower (17), goggles (19), chlorination (21), strip (48), the ammonia jar, and the findings added after review, the hourglass (12) and the alarm clock (14), which are both lost rounds. The raven, lab coat and scorched paper also feed on loss or spill.
- **Fewer moments:** a run lost in round 1 or 2 ends before pages 2 and 3, so the moments that need three pages (stopwatch, spatula, stir plate, crystal ball) come slowly. Counts and the jars are not affected.

## The pace

These numbers come from the career model (`fgate.py`, 500 careers). A middling player always plays the longest run open and finds each thing at its measured or reasoned rate. The bench rules above apply.

### Held after N runs (mean)

The earlier model's figures, moved by the findings changed after review (each changed finding's median moved, with a spread around it). `fgate.py` has not been run again.

| Runs | Reagents (13) | Reflexes (10) | Instruments (50) | Homunculi (10) | Notebooks (6) | Run lengths (2) | Hazards (8) | Inspections (13) | Catalog (20) | Circle (6) | Cosmetic (28) | All (166) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 0.3 | 0 | 0.7 | 0 | 0 | 0.7 | 0 | 0 | 2.0 | 0 | 0.2 | 4 |
| 3 | 1.6 | 0.1 | 2.4 | 0 | 0 | 1.4 | 0 | 0 | 3.5 | 0 | 0.8 | 10 |
| 5 | 2.4 | 1.4 | 3.9 | 0 | 0 | 1.7 | 0.1 | 0 | 4.5 | 0 | 1.2 | 15 |
| 10 | 4.0 | 2.6 | 7.7 | 0.6 | 1.3 | 2.0 | 0.4 | 2.2 | 8.2 | 0 | 2.2 | 31 |
| 20 | 6.3 | 5.3 | 14.8 | 4.5 | 2.7 | 2.0 | 1.0 | 5.9 | 11.3 | 0.1 | 5.5 | 60 |
| 40 | 9.4 | 7.4 | 27.0 | 8.0 | 3.6 | 2.0 | 2.4 | 8.5 | 14.4 | 0.5 | 11.2 | 94 |
| 80 | 12.5 | 9.5 | 40.9 | 8.5 | 4.9 | 2.0 | 4.6 | 10.2 | 17.3 | 3.9 | 19.6 | 134 |
| 150 | 13.0 | 10.0 | 47.3 | 9.1 | 5.6 | 2.0 | 6.5 | 12.2 | 18.9 | 4.9 | 25.1 | 154 |
| 300 | 13.0 | 10.0 | 50.0 | 10.0 | 5.9 | 2.0 | 8.0 | 13.0 | 19.8 | 6.0 | 27.7 | 165 |

What moved: the hazards come earlier because hazards 3, 5 and 7 are counts, not wins (hazard 7 from about run 188 to 130, hazard 8 from 246 to 190). Instruments come earlier from run 20 on (hourglass, alarm clock, ethylene, mortar, clamp stand, aqua regia, methanol, extinguisher come sooner; the schlenk line comes later). The drawer is slower because the lab coat now asks for 30 fumes in one run and the fountain pen for 40 runs on one notebook.

### How often something new comes

| Runs | New things | Per run | Runs that bring something | One new thing every |
|---|---|---|---|---|
| 1 to 5 | 15 | 3.0 | 5 of 5 | run |
| 6 to 10 | 16 | 3.2 | 5 of 5 | run |
| 11 to 20 | 29 | 2.9 | 9.5 of 10 | run |
| 21 to 40 | 34 | 1.7 | 17 of 20 | 1.2 runs |
| 41 to 80 | 40 | 1.0 | 26 of 40 | 1.6 runs |
| 81 to 150 | 20 | 0.3 | 18 of 70 | 4 runs |
| 151 to 300 | 11 | 0.07 | 10 of 150 | 15 runs |
| after 300 | 1 or 2 | | | 200 runs |

- **Runs 1 to 10:**
  - The master's opens at run 1 or 2, and the doctorate by about run 4.
  - The early reagents, the first reflexes and the easy tools and glass come about one a run or faster.
  - The catalog fills its easy pages.
- **Runs 10 to 40:**
  - The jars fill: the first at run 10, eight by run 33.
  - The occult cabinet opens with the first homunculus.
  - The inspections arrive.
  - The later reagents come as their parents are carried.
- **Runs 40 to 150:** the circle, hazards 2 to 7, the rarer moments (balance, cannula, anchor) and the slow catalog pages.
- **The long tail:**
  - A middling player has everything at about run 325 (the median). 98 in 100 have it by run 800.
  - A skilled player wins about three times as often. Only hazard 1 needs a won doctorate now, so this speeds the ladder less than before.

### The last ten, and why few reach them

| Median run | Thing | Why |
|---|---|---|
| 255 | brimstone's hat | eight runs with the last homunculus to hatch |
| 190 | hazard 8 | three overreacts at hazard 7, where a round reaches overreact about 1 time in 20 |
| 185 | philosopher's stone | needs all ten homunculi, so it waits for brimstone |
| 175 | circle slot 6 | needs every homunculus taken into a run, so it also waits for brimstone |
| 173 | brimstone | the slowest jar |
| 159 | clipboard | needs every notebook, so it waits for the anchor |
| 152 | ammonia's hat | the second slowest homunculus |
| 151 | hand of glory | five instruments in one round, with twelve held |
| 135 | anchor | the same line on all three pages is a line few would pick by chance |
| 130 | hazard 7 | 40 homunculus taps at hazard 6 and above (an estimate) |

The hazard ladder is the longest chain, but it gates only itself and the striped flags. No reagent, reflex or instrument sits behind it. Its first step is the only one that needs a win.

## The chains

**Degrees:**
- A won bachelor's opens the master's. A won master's opens the doctorate. A won run of 6 or 9 rounds opens the reverse notebook.
- The master's opens damp-proof, fresh only, heat at the turn, blind pair, short reach, shut fast, the black candle and the cursed idol.
- The doctorate opens runaway, turnover, shut jar, the goat, the schlenk line, the coffee cup and circle slots 2 and 5.
- A won doctorate opens hazard 1. Hazards 2 to 8 then open in order, each by a count of the habit its label punishes. Hazard 1 opens the striped flags.

**Reagents to what they feed:**
- Jones opens decarboxylation, pop, seal, litmus paper and adipic acid. Seal opens butyrolactone.
- Amination opens Hofmann and knit. Knit opens pyrroline. Hofmann opens the ammonia jar.
- Chlorination opens Williamson, Suzuki and strip. Williamson opens the halide notebook (with chlorination) and the ladder polyether (with tuck).
- Thiol-ene opens Raney nickel and pair. Pair opens the lipoic acid ring. Raney nickel opens the brimstone jar.
- Hofmann and Raney nickel together open circle slot 4.
- Chlorination, amination and thiol-ene together open the scrubber.

**Reflexes:**
- Tuck opens weld. Shift opens snap.
- Weld opens the menthol ring, decalin and the carvone ring.
- Snap opens norbornene.
- Weld and snap together open the Wieland-Miescher ketone, the steroid frame and adamantane.
- The steroid frame opens cholesterol.

**Instruments:**
- Weld opens the magnet. The magnet opens the voodoo doll.
- The burner opens short reach.
- Twelve instruments open the hand of glory.

**Homunculi:**
- The first one hatched opens the occult cabinet, parchment, the elixir, the stopper, shut jar and the milk carton.
- Each homunculus opens its own hat.
- Five hatched draw the circle.
- All ten open the philosopher's stone and circle slot 6.

**Catalog:** eight entries open the grimoire.

**What feeds back:**
- Reagents make runoff. Runoff fills jars. Homunculi change what a page can do and make more runoff.
- Reagents make groups (COOH, NH2, Cl, SH). The reflexes they open use those groups, and the catalog entries they open are the rings those reflexes close.
- A finding about a habit (hydrate, hydroborate, oxidize) opens the inspection that attacks that habit. So the game gets harder exactly where the player leans.

## What the game must count and save

### Lifetime counters

Each counter starts when its thing's needs are met, and is saved per profile.

1. dry steps
2. dehydrate fired
3. rings closed by the ring reflex
4. ring-closing steps of every reflex
5. reagents fired
6. reagents that acted at exactly one place
7. reagents fired that acted nowhere
8. reduce fired that acted nowhere while an inner C=O stood
9. lines with oxidize acting and a later reduce acting
10. hydrate fired
11. hydroborate fired
12. oxidize acted
13. lines with hydrate acting and a later oxidize acting
14. reduce acted
15. COOH made by Jones
16. SH made by thiol-ene
17. chlorination fired
18. third uses fired
19. steps that only match an earlier page of the round
20. pages that set off nothing
21. pages that drove off 5 or more waters
22. pages with a dry and a later hydrate acting
23. rounds ending 10 or more atoms bigger than dealt
24. rounds met after a first page that set off nothing
25. rounds ending at unstable or better
26. rounds ending at overreact
27. rounds met with a yield under 105 percent of the spec
28. runoff of each kind (the ten jars), and in all
29. runoff arriving at a full jar
30. runs lost (for the ammonia jar, once its jar shows)
31. rounds at hazard 1 met with 3 or fewer waters, rounds at hazard 2 ending with 3 or more ring-closing steps and 3 or more OH, rounds at hazard 3 for each family taken
32. rings closed across 5 carbons from hazard 4 on, runs at hazard 5 with rounds 1 and 2 at unstable or better, homunculus taps from hazard 6 on
33. rounds at overreact at hazard 7
34. reagents put back
35. instruments sold back
36. uses of whole-molecule instruments
37. runs each homunculus was taken into
38. the easier molecule taken
39. runs started with each notebook (a count for each notebook, never in a row)

### Sets (saved per profile)

40. families of molecule taken
41. different molecules dealt
42. inspections met
43. inspections lost under
44. round numbers at which a run was lost
45. notebooks a run was started with

More counters added after review (each starts when its thing's needs are met, saved per profile):

54. lines that fire one reagent in all three slots
55. rounds ending with fewer atoms than dealt
56. dehydrate that acted on an OH next to a C=O
57. runs lost in round 1 or 2
58. runs lost, by length (bachelor's, master's, doctorate)
59. rounds lost whose last page set off nothing
60. rounds lost with a yield of 75 percent of the spec or more
61. the most acid fumes in one run, and the number of different reagents fired in one run
62. runs started with each notebook, for the fountain pen
63. jars shown
46. homunculi taken into a run

### Flags and states

47. each thing found, with the run it was found on
48. each catalog entry, with the run
49. each shelf shown
50. the outline on each shelf
51. each jar: shown, full, opened, and how many runs it has stood full and unopened
52. homunculi hatched, and how many
53. the highest hazard opened

### Read on each page and round (not saved; the game must detect these)

- The molecule at the end of each page, before loose rings open.
- The molecule at the page's start, and the round's dealt molecule.
- Each reagent's places acted, and the steps each reagent set off.
- Runoff by kind on each page.
- The yield of each page and of the round, and whether the spec was met.
- A homunculus tap, and on which page.

Every condition in the tables is a read of these. The catalog cores and the group counts are SMARTS reads, written in `fana.py`. The game port can use the graph checks in `hurdle_graph.py`.

## How the bench shows it

**Shelves, and when they appear:**
- **After the first run:** the record, the notebook shelf, the catalog, the tool rack, the glassware shelf, the inspection book, the wall of degrees and the drawer.
- **When round 3 is first beaten:** the reagent cabinet and the reflex board.
- **The first time three waters have come off:** the jars (`LOOP.md`). Each jar appears when its own runoff first comes off.
- **With the first homunculus:** the occult cabinet.
- **When the doctorate opens:** the hazard labels.
- **When five homunculi have hatched:** the circle.

**One outline at a time.**
- Each shelf shows what is held at full ink. Only one shelf also shows an outline: the next thing on it, chosen in order of rarity (the Runs value, lowest first).
- That shelf is the one of the last thing opened, or, if nothing opened, the shelf whose count moved most in the last run. The other shelves keep their next thing for counting, unseen.
- A thing whose needs are not met is not drawn at all.
- There is no list and no total.

**What the outline carries:**
- The thing's silhouette.
- A small picture of the finding: a drop for water, a ring for rings, a torn flag for a lost round. For a moment about a shape on the molecule (OH on three carbons in a row, a Cl and an OH 3 to 5 carbons apart) the picture is that shape drawn as a small molecule, with the parts that matter filled in and the rest blank.
- The count: a number over a number for a count (for example 37 over 60), one empty pip for a moment, a row of pips for a collection.
- No sentences. The name shows under the pointer.

**Shelves with their own look:**
- Jars show their fill, never a number.
- The catalog shows its filled pages and one blank page.
- The circle starts as a plain ring and gains a point for each slot.
- Each hatched homunculus shows its own hat outline beside its jar.

**Secrets** have no outline and leave no gap. When one is found, the thing drops onto its shelf, the page letters its name once, and the shelf gains a place.

**Opening.** At the end of a run each shelf may open one thing. It is shown with the three pictures of its finding. Then the new thing does its act once on that molecule, and then it joins the pool.

## What this path changes in other documents

- The mirror and the seed crystal are no longer given for the first win (`LOOP.md`). The seed crystal arrives about run 22 and the mirror about run 20.
- The bench draws one outline at a time, not one on each shelf of the ten (`HARNESS.md` M and the owner's one-outline ruling).
- A new game holds no inspection. Round 3 is plain until wet flask is found, about run 7.
- Instruments sit on three shelves (glassware, tools, occult), each with its own outline. The occult cabinet opens with the first homunculus (`HARNESS.md` line 161: the occult comes after a certain tier).
- A full jar waits for the player to open it. That is what makes the milk carton and the stopper possible.
- The ammonia jar is 40 and gains 1 for each lost run once it shows. The brimstone jar is 80 and gains 2 for each round at overreact.
- Catalog entries are cores (a compound's ring and groups), checked on the molecule at the end of a page.
  - Out: acetone and cubane.
  - In: the vitamin E ring, decalin, the steroid frame, butyrolactone, the lipoic acid ring, pyrroline and adipic acid.
  - Every entry must still be shown reachable on the rig before it is listed.
- These instruments have no act written yet, and each needs a physical act before it is built: litmus paper, loupe, goggles, fume hood, cold trap, extinguisher, alarm clock, hourglass, stopwatch, thermometer, dropper, carousel, spatula, stir plate, scrubber, stopper, elixir, philosopher's stone, transmute, crystal ball, ouroboros, goat, grimoire, hand of glory, ouija board, black candle, cursed idol, poison bottle, mystery bottle, schlenk line, drying tube, clamp stand, brass weights, reflux, sieves.
  - `HELPERS_NEXT.md` dropped reflux, hourglass, transmute, fume hood, stopper, extinguisher, thermometer, sieves and spatula as repeats. Each needs a new act that is not a repeat.
- Held back until each act is written (rule I: each instrument is a physical act that does what the real object does): none of the 35 above is to be built or listed in the game before it has one. The crystal ball's act must not show what a page will do, because there are no previews (P). The elixir stays only while the tap is the player's own (L). Until the acts are written, the 166 counts these 35 as planned.
- These are bench props, cosmetic, with no act: duck, cat, coffee cup, milk carton, raven, lab coat, intern, clipboard, scroll, index cards.

## Copies of other games, replaced

- **Play counts.** "Play 100 runs" and "play 350 rounds" are the generic play counts many Steam games use.
  - The coffee cup is now a run that reaches round 9 with no empty page.
  - The lab coat is now 30 acid fumes spilled in one run.
- **Loss counts.** "Lose N runs" is the death count of many roguelikes.
  - The black candle is now a loss under five different inspections.
  - The lifetime loss count survives only inside the ammonia jar, where it is the smelling salts.
- **Gold counts.** "Earn or spend N gold" is the currency count of Vampire Survivors and others.
  - The philosopher's stone is now all ten homunculi.
  - The cursed idol is now a loss while holding 20 gold.
- **No buying.** "Win without buying anything" is a common self-set challenge in shop roguelikes. Circle slot 5 is now a doctorate with every round at unstable or better.
- **Losing streak.** "Lose three runs in a row" (the black cat of one design) was dropped. The raven now asks for 5 losses in round 1 or 2 over all runs, not in a row.
- **Streaks of any kind.** The clamp stand (same reagent 20 runs in a row) and the fountain pen (same notebook 15 runs in a row) were streaks and fought "every run different". The clamp stand is now one reagent in all three places of a line, 5 times. The fountain pen is 40 runs on one notebook, never in a row.
- **Win to open the next level.** Hazards 3, 5 and 7 asked for a win at the level before, the stake ladder of Balatro, Slay the Spire and Hades. Each is now a count of the habit its label punishes.
- **Previews.** The crystal ball (page 1 reaches volatile) was a preview. It is now page 2 setting off exactly what page 1 did.
