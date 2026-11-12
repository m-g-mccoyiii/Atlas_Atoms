# Overreact: motifs (what a molecule has, and what it pays)

In short. The six families are replaced by twelve motifs: sugar, resonance, benzene ring, ring, shared side, cage, spiro centre, acid, amine, sulfur bridge, branch point, long chain. Each is a count read exactly from the molecule's SMILES. Every step the molecule takes by itself pays its places times (1 + rate x count) for every motif it holds, with no cap, so two sugars pay more than one and a run of five alternating double bonds pays more than a run of three. Measured on 300 rounds in each of rounds 1 to 3, 4 to 6 and 7 to 9: no motif gives more than a third of the motif yield (largest 31%), the yield of the same play rises by x1.4 to x1.6, x2.1 to x2.4 and x2.4 to x2.6, and a player who builds for the motifs beats one who does not by about 15% in rounds 1 to 3 and by 0 to 5% in rounds 4 to 9, which is short of the target there.

Written 2026-11-11. This replaces the six families (chain, ring, arene, sugar, cage, resonance) and the KIN table in `apps/steam/js/react/path.js`. The code is `docs/tools_chem/traits.py` (the file keeps the word "traits" in its name; the game word is below). Run `python traits.py test` for the 82 count tests and 5 pay checks, and `python traits.py study 300` for the measures.

## The question this answers

The owner asked: "What do words like sugar or resonance mean? Do they go up if we have two sugars? Extended resonance?" The answer built here is yes to each. A molecule has a count of each thing. Two sugars is a count of 2. A run of five alternating double bonds counts 5 and pays more than a run of three. Every step the molecule takes by itself pays more for every count it holds when the step lands.

## The name

**Motif.** A chemist calls a repeating unit that can be spotted in a structure a structural motif. It comes from the lab, it says what the thing is (a unit you can point at and count), it is short enough for a token, and no other game uses it for this. "Trait" is the stock word from other games and says nothing about chemistry. Alchemy has "virtue" (the active power in a substance), which was passed over: it says what a thing does and not what it is, and a page that says "3 virtues" reads as morals. "Family" is retired: a family is one label for a whole molecule and cannot be counted up. A motif is counted, and a molecule has many of them at once.

In the sentences below "level" is the count of one motif on one molecule.

## The twelve

Every count is read from the molecule as it stands. A ring that a reflex closed loosely (the game's zip, which opens again when the turn ends) is read open, so only what stays counts. All counts are exact from SMILES with RDKit (`traits.py`, tests in `CASES`: 82 cases, at least five for every motif).

| Motif | One level is | Exact check | How it counts up | The mark |
|---|---|---|---|---|
| sugar | a carbon with an OH | sp3 carbons matching `[CX4]-[OX2H]`, each carbon counted once (a carbon with two OH counts once; phenol and acid OH do not count) | two sugars is level 2; seven OH on seven carbons is level 7 | a stack of sugar cubes, one cube a level |
| resonance | a double bond in the longest alternating run | on the Kekule form, the longest chain of double bonds joined by single bonds (double, single, double, single); level is the number of double bonds in it, and a run of one is not counted | butadiene 2, hexatriene 3, benzene 3, benzoic acid 4 (ring plus C=O), naphthalene 5, retinol 5, beta-carotene 11 | a wave with one hump a level |
| benzene ring | an aromatic ring | rings whose every atom is aromatic | benzene 1, biphenyl 2, naphthalene 2 | a hexagon with a circle inside, repeated |
| ring | a ring that is not aromatic and not in a cage | all rings minus the aromatic ones and the ones inside a cage system | cyclopentane 1, decalin 2 | a plain polygon, repeated |
| shared side | two rings that share one side | pairs of rings that share exactly two atoms joined by a bond (not inside a cage) | decalin 1, naphthalene 1, a steroid's four rings 3 | two polygons touching along an edge, one pair a level |
| cage | a ring tied into a bridged or closed shell, minus one | ring systems where two rings share three or more atoms, or where three or more rings have every ring atom on three ring bonds; level is the rings in the system (ring bonds minus ring atoms plus one) minus one | norbornane 1, adamantane 2, cubane 4 | a cube drawn in outline, one extra edge a level |
| spiro centre | one atom that two rings share and nothing else | `rdMolDescriptors.CalcNumSpiroAtoms` | spiro[4.4]nonane 1, two spiro centres in a row 2 | two polygons touching at a point |
| acid | a COOH | carbons matching `[CX3](=[OX1])[OX2H1]` | succinic acid 2, citric acid 3 | a drop, one drop a level |
| amine | an amine nitrogen | `[NX3;!a;!$(N-[CX3]=[O,S,N]);!$(N-[#7,#8,#16]);!$(N-C#N)]-[#6]`: not an amide, not aromatic, not a nitrile | ethylamine 1, putrescine 2, lysine 2 | three short prongs |
| sulfur bridge | a sulfur holding two atoms together | each C-S-C counts one and each S-S bond counts one | dimethyl sulfide 1, cystine 1, a trisulfide 2 | a yellow arch |
| branch point | a carbon holding three or four other carbons | sp3 carbons with at least three carbon neighbours | isobutane 1, neopentane 1, 2,4-dimethylpentane 2 | a fork |
| long chain | three plain carbons in a row, in the longest stretch | longest path of non-ring sp3 CH2 or CH3 carbons joined to each other; level is that length divided by 3, rounded down | hexane 2, nonane 3 | a zigzag, one bend a level |

Why twelve and why these. Each one is a thing a person can point at on a ball-and-stick picture: an OH, a wave of alternating double bonds, a hexagon, two polygons on an edge, a cube, an acid end, an N, an S between two carbons. None is a count of the whole molecule. The three that depend on the nitrogen, sulfur and COOH groups exist only if the run holds a reagent that makes them (ritter or knit for an amine, thiolene with close or seal for a sulfur bridge, permanganate or the cyanohydrin route for an acid). The eight that are about carbon and OH exist in every run.

One motif was tried and dropped: the carbon with two oxygens (an acetal, and the C(OH)(O-ring) a zip leaves). It is there in every zip and in nothing that stays, so it paid only for the zip itself, gave the player nothing to build, and took a third of all motif yield in rounds 1 to 3 on its own.


## What they do

### Three ways to pay

| | The rule | What it asks of the player | Why it was or was not picked |
|---|---|---|---|
| A | Every step the molecule takes by itself pays its places times one factor per motif held, (1 + rate x level) for each motif. | Build motifs before the chain, then set it off through them. | Picked. A step that lands on a molecule holding sugar 3 and a run of 5 pays more than the same step on a bare molecule, and the player sees it step by step. Building before the chain pays at every step after; building during the chain pays from there on. |
| B | One multiplier at the end of the round: yield times (1 + rate x the best level the round reached). | Reach a high count at some point. | Not picked. The count only has to exist once, so the chain does not need to run through it, and the page has no moment to show it. |
| C | Each motif strengthens particular reflexes (resonance helps shift and dry, sugar helps ring, and so on). | Know which motif goes with which reflex. | Not picked. Twelve motifs and thirteen reflexes is a table nobody can say aloud after seeing it once. |

### The rule as built (A)

After each step in a turn's chain, read the molecule as it stands (a ring a reflex closed loosely is read open). Every motif it holds with level L and rate r gives a factor 1 + r x L. The step's places are multiplied by the product of the factors. Nothing is capped: more is worth more, without end.

Rates, as a part of one level:

| Motif | Rate | One level is worth | | Motif | Rate | One level is worth |
|---|---|---|---|---|---|---|
| sugar | 0.07 | 7% | | spiro centre | 0.10 | 10% |
| resonance | 0.08 | 8% | | acid | 0.25 | 25% |
| branch point | 0.04 | 4% | | amine | 0.20 | 20% |
| ring | 0.05 | 5% | | sulfur bridge | 0.35 | 35% |
| cage | 0.03 | 3% | | benzene ring | 0.30 | 30% |
| long chain | 0.12 | 12% | | shared side | 0.15 | 15% |

The pattern is one sentence: what a run builds a lot of pays a little a level, what is rare pays a lot a level. The page prints the percent next to each mark, so the table is read off the screen and not learned.

Worked: a molecule holding two sugars pays x1.14 a step. Give it a run of five alternating double bonds as well and it pays x1.14 times x1.40, which is x1.60. A run of three alone is x1.24; a run of five alone is x1.40; a run of eleven (beta-carotene) is x1.88. Extended resonance pays more than a short run, and two sugars pay more than one.

Because the factors multiply, a second kind of motif raises what the first is worth. That is what makes a player want several kinds at once as well as many of one kind.

Where it enters the yield: the engine's pay for step k of a chain is 50 x (1 + (k - 1) x w), w being 1 for a step past the longest earlier chain of the round and 0.25 for one that is not. With the motifs that figure is multiplied by the step's factor. Extra (the 0.1 per step) is not changed. Round yield stays places times extra.

Why the motifs are read as the molecule stands and not while a ring is shut: read with the shut ring, the ring carbon with two oxygens, the new ring and the new spiro centre are all present in every zip, paid 33% of all motif yield in rounds 1 to 3 on one motif and gave the player nothing to choose. Read as it stands, only what the player's reagents and the permanent reflexes (dry, shift, weld, tuck, snap, seal, close) leave behind is paid.

## How they fit

### The spec

A spec is an "at least". These motifs make the natural ones, because each is a count the page already shows. Read as the specs read a molecule: the best level during the round, or the gain over the start. From the 300 rounds per stage below, with a player who ignores the motifs (so a spec set here is one a player has to aim at):

| Rounds | Spec | Reached by a player who does not aim |
|---|---|---|
| 1 to 3 | at least 3 sugars at once | 40% |
| 1 to 3 | at least 3 alternating double bonds | 24% |
| 1 to 3 | at least 3 branch points | 21% |
| 4 to 6 | at least 3 rings | 57% |
| 4 to 6 | at least 5 sugars | 12% |
| 4 to 6 | at least 5 alternating double bonds | 9% |
| 4 to 6 | at least 5 rings | 13% |
| 4 to 6 | at least 1 shared side | 55% |
| 4 to 6 | at least 3 shared sides | 10% |
| 7 to 9 | at least 5 sugars | 31% |
| 7 to 9 | at least 5 rings | 38% |
| 7 to 9 | at least 5 branch points | 57% |
| 7 to 9 | at least 1 acid, or at least 1 amine | 17% and 12% (these rounds carried the reagent that makes it; most do not) |

A spec on a motif whose reagent is not carried is never offered (acid needs permanganate or the cyanohydrin route, amine needs ritter or knit, sulfur needs thiolene with close or seal). Benzene ring and cage are never built in a round by any reagent here, so they are not specs; they are reasons to take one dealt molecule and not the other. Going past a spec is still the point: the yield and the four words reward the count, not the line.

### Reagents and reflexes

Each row is the mean change in the level of a motif when the reagent was used on 400 dealt molecules (one reagent, one molecule, standing read). Only changes of 0.05 or more are shown.

| Reagent | Builds | Takes away |
|---|---|---|
| hydrate, hydroborate | sugar +1.75 | resonance -0.17 |
| dihydroxylation | sugar +3.5 | resonance -0.17 |
| grow | sugar +2.4, branch +2.2 | |
| reduce | sugar +1.0 | |
| cyanohydrin | sugar +1.2, acid +1.2, branch +0.9 | |
| permanganate | acid +1.3 | |
| ritter | amine +1.75 | resonance -0.17 |
| hwe | resonance +1.5 | |
| dehydrate | resonance +0.35 | sugar -1.6, branch -0.6 |
| chugaev | | sugar -1.6, branch -0.6 |
| chlorination | | sugar -1.7 |
| oxidize | | sugar -1.1 |
| epoxidation | ring +1.75 | |
| hydroformylation | branch +0.9, chain +0.7 | |
| thiolene | chain +0.7 | |

Reflexes, mean change over the steps seen in 400 random lines (the change between one step and the next, so a reagent between two steps is counted in the later one; read it as a direction, not an exact figure):

| Reflex | Builds | Takes away |
|---|---|---|
| dry | resonance +1.6 | sugar -0.9, branch -1.3 |
| shift | resonance +1.3 | sugar -1.2 |
| weld | ring +1.0, sugar +1.0, branch +1.5 | |
| tuck | ring +1.0, shared side +0.5, spiro +0.4, branch +1.3 | resonance -1.7, sugar -1.0 |
| snap | ring +1.7, shared side +1.1, cage +0.5, branch +3.7 | resonance -1.1, sugar -1.1 |
| seal | ring +1.0, spiro +0.4, branch +0.4 | sugar -0.8, acid -0.6 |
| close | ring +1.0, branch +1.1, sugar +0.5 | sugar -1.9 |
| knit | amine +1.9 | resonance -0.4 |
| ring (the zip) | sugar +0.8 | |

What this gives a player: sugar and resonance are built with a reagent the player chooses and are taken away by oxidize, dehydrate and chlorination. Ring, shared side, spiro and branch come with the permanent reflexes. Three of the pairs pull against each other, which is what makes a line a choice: dry and shift build resonance and cost sugar; dehydrate builds resonance and costs sugar; tuck and snap build rings and cost the run of double bonds.

### Instruments

Not simulated; this is what each does to the counts, from the rules in `PIECES.md`.

| Instrument | On the motifs |
|---|---|
| mirror | the kept half is there twice, so every count on that half doubles (sugar, ring, branch); a run of double bonds across the join is not joined |
| seed crystal | one OH on a chosen carbon: sugar +1 at once |
| magnet | cuts every plain stretch of four or more to its two ends: long chain goes to 0 on that molecule, other counts unchanged |
| burner | every OH that can lose water becomes a C=C: sugar goes down by that many, and the new C=C can join a run: resonance up |
| burette | every C=C becomes C=O: a run is broken where it was; sugar unchanged |

### Homunculi

| Homunculus | On the motifs |
|---|---|
| water | every C=C becomes C-OH: sugar up, resonance down |
| hydrogen | the first C=O past a long stretch becomes OH: sugar +1 |
| carbon dioxide | rings the page closed are frozen shut: ring (and the shared sides and spiro centres they make) held for the rest of the round |
| acid | eats the stretches down to 3 carbons: long chain down; lets rings close across 6 carbons: ring up |
| wood spirit | fires all five reagents: whatever the five build, in random order |
| salt | keeps a C=O: keeps a ring from using it, holds sugar down |
| slime | two carbons counted 3 apart: rings, shared sides and spiro centres become reachable that were not |
| ammonia | the page's three reagents fire again: every build repeats; fed by oxidize on an NH2, so it comes with amine |
| seedling | 9 carbons with 3 C=O grow at a carbon: branch up, and sugar after a reduce |
| brimstone | an OH on the 4th and a C=O on the 8th plain carbon: sugar +1 at once; fed by sulfur, so it comes with the sulfur bridge |

### The catalog of real compounds

An entry fills when the compound is made. The motifs give each one a signature that is a hurdle and not a match (HARNESS item Y): the entry fills at "at least", whatever else the molecule also holds. Counts read with `traits.py` from the real SMILES.

| Compound | Signature (at least) | Also holds |
|---|---|---|
| glycerol | sugar 3 | |
| pentaerythritol | sugar 4 and branch 1 | |
| mannitol | sugar 6 | |
| glucose, ring form | sugar 5 and ring 1 | |
| tartaric acid | sugar 2 and acid 2 | |
| citric acid | sugar 1 and acid 3 | |
| naphthalene | benzene ring 2, shared side 1, resonance 5 | |
| benzoic acid | benzene ring 1, resonance 4, acid 1 | |
| retinol | resonance 5 and ring 1 | sugar 1 |
| beta-carotene | resonance 11 and ring 2 | |
| cholesterol | shared side 3 and ring 4 | sugar 1, long chain 1 |
| norbornane, camphor | cage 1 | |
| adamantane | cage 2 | |
| cubane | cage 4 | |
| cystine | sulfur bridge 1, amine 2, acid 2 | |
| methionine | sulfur bridge 1, amine 1, acid 1 | |
| lysine | amine 2 and acid 1 | long chain 1 |
| penicillin G | ring 2, shared side 1, sulfur bridge 1, acid 1, benzene ring 1 | resonance 3 |
| 1,7-dioxaspiro[5.5]undecane | spiro 1 and ring 2 | |

Making beta-carotene means holding a run of 11, which pays x1.88 a step on its own: the compound and the motif pay for the same thing. Cholesterol (item H of the harness) needs three shared sides, which only tuck, snap and the cage-making reflexes give.

### Findings (unlocks)

A motif pays and is marked from the first run only if it is one of five: sugar, resonance, ring, branch point and long chain. The other seven are opened by a finding, and the finding is the first time the player holds one.

| Opens | The finding | Kind |
|---|---|---|
| benzene ring | finish a round on a molecule with a benzene ring | first |
| shared side | hold two rings that share a side at the end of a turn | first |
| cage | hold a cage at the end of a round | first |
| spiro centre | hold a spiro centre at the end of a round | first |
| acid | make a COOH | first |
| amine | make an amine | first |
| sulfur bridge | hold a sulfur bridge | first |

Later findings use the counts as lifetime events and single moments, none needing a win:

- hold 5 sugars at once: opens the mannitol entry in the catalog and the seed crystal;
- hold a run of 7 alternating double bonds: opens the burette;
- hold 4 rings at once, then 10 in all across runs: opens the snap reflex;
- end a round on a molecule holding no motif at all (a bare chain): a secret, opens a notebook that starts a run with the pay off and the yield doubled for the first round.

These are proposals for the findings list in the harness; none was built.

## The measures

Setup, from `traits.py`. Rounds 1 to 3: the six starting reagents and the reflexes ring and dry. Rounds 4 to 6: the six and two drawn at random from the twelve others, with ring, dry, flip, shift, tuck, weld and snap. Rounds 7 to 9: three of the six and five of the twelve, with all thirteen reflexes. Molecules are dealt as `molecules.deal_molecule` deals them (tier 3). 300 rounds per stage, the same 300 molecules, hands and carried sets for every player. The greedy player takes the line with the most yield this turn. The look-ahead player takes the best of the 8 lines with the most yield this turn, counting the best next turn (the next hand is known). The ignoring versions count yield without the motifs; the seeking versions count it with them (the same choice, the same hands). The turn is the engine's turn with the molecule kept after every step (checked: same steps and end molecule as `Engine.run_line` on 12 lines).

### Count tests

`python traits.py test`: 82 cases (5 to 10 for each motif, SMILES in and count out) and 5 pay checks (two sugars is x1.14; two sugars and a run of five is x1.60; a run of five pays more than a run of three; nothing held is x1; the stepped turn equals the engine's). All pass. `python test_engine.py` was run first: 22 tests, 21 pass; the one that fails is `test_the_ten_lines_of_docs_reactions_md`, which this work does not touch.

### How often each motif is there, and how high it gets (greedy player who ignores the motifs)

Each cell: share of rounds with the motif / mean level where present. Start is the dealt molecule. Peak is the highest level at any step of the round. End is the molecule left after the last turn, with loose rings open. Max is the highest level seen. The look-ahead player is within about 3 points and 0.3 levels of these in every cell.

| Motif | R1-3 start | peak | end | max | R4-6 start | peak | end | max | R7-9 start | peak | end | max |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sugar | 70% / 1.4 | 100% / 2.3 | 97% / 1.8 | 7 | 91% / 1.5 | 100% / 3.0 | 73% / 2.6 | 10 | 89% / 1.9 | 100% / 4.0 | 67% / 2.9 | 16 |
| resonance | 18% / 3.3 | 80% / 2.4 | 47% / 2.5 | 4 | 27% / 3.2 | 99% / 2.9 | 51% / 2.6 | 7 | 21% / 2.9 | 86% / 2.7 | 48% / 2.5 | 6 |
| benzene ring | 18% / 1.0 | 18% / 1.0 | 18% / 1.0 | 1 | 16% / 1.0 | 17% / 1.0 | 17% / 1.0 | 1 | 16% / 1.0 | 17% / 1.0 | 16% / 1.0 | 1 |
| ring | 21% / 1.0 | 21% / 1.0 | 21% / 1.0 | 1 | 26% / 1.0 | 98% / 3.0 | 79% / 2.8 | 9 | 26% / 1.0 | 99% / 4.2 | 97% / 4.0 | 12 |
| shared side | 0 | 0 | 0 | 0 | 0 | 55% / 1.9 | 40% / 1.8 | 8 | 0 | 53% / 1.7 | 43% / 1.7 | 6 |
| cage | 10% / 1.0 | 10% / 1.0 | 10% / 1.0 | 1 | 9% / 1.7 | 37% / 4.1 | 36% / 4.1 | 15 | 6% / 3.2 | 17% / 3.4 | 16% / 3.4 | 9 |
| spiro centre | 0 | 0 | 0 | 0 | 0 | 48% / 1.7 | 48% / 1.7 | 8 | 0 | 54% / 1.7 | 54% / 1.7 | 6 |
| acid | 0 | 0 | 0 | 0 | 0 | 4% / 1.4 | 5% / 1.3 | 2 | 0 | 17% / 1.5 | 12% / 1.5 | 4 |
| amine | 0 | 0 | 0 | 0 | 0 | 2% / 1.5 | 3% / 1.8 | 3 | 0 | 12% / 2.6 | 9% / 2.4 | 7 |
| sulfur bridge | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2% / 1.0 | 2% / 1.0 | 1 |
| branch point | 61% / 1.4 | 85% / 2.0 | 85% / 2.0 | 5 | 63% / 1.5 | 99% / 5.9 | 99% / 5.9 | 24 | 56% / 1.7 | 98% / 6.0 | 97% / 5.9 | 18 |
| long chain | 17% / 1.0 | 59% / 1.0 | 35% / 1.0 | 1 | 35% / 1.1 | 64% / 1.1 | 29% / 1.1 | 2 | 59% / 1.2 | 84% / 1.2 | 69% / 1.2 | 2 |

What it shows: in rounds 1 to 3 only five motifs ever appear (the dealt molecules carry a benzene ring or a cage in about one in six and one in ten), which is the "not every layer on the first run" the harness asks for. Rings that stay, shared sides and spiro centres arrive with the permanent reflexes in rounds 4 to 6. Acid, amine and sulfur appear only where the reagent is carried and are rare (sulfur 2% of rounds 7 to 9). The 4% to 17% of rounds with an acid are the rounds that carried permanganate or the cyanohydrin route.

### Yield with the pay on and off, and where it comes from

Ratio is the round yield with the motifs over the same play without them. Share is each motif's part of what the motifs add (the part of the product's gain is split by the logarithm of each factor). Most-paying is the motif that paid most in a round, counted over the 300 rounds.

| Rounds | Player | Ratio | Largest share | Spread of round yield (sd/mean) off to on | Different motifs that paid most |
|---|---|---|---|---|---|
| 1-3 | greedy, ignoring | 1.39 | sugar 28% | 0.375 to 0.390 | 5 (sugar 138, resonance 51, benzene 41, chain 39, branch 31) |
| 1-3 | look-ahead, ignoring | 1.41 | resonance 29% | 0.321 to 0.347 | 5 |
| 1-3 | greedy, seeking | 1.51 | sugar 30% | 0.354 to 0.364 | 5 |
| 1-3 | look-ahead, seeking | 1.57 | sugar 31% | 0.286 to 0.293 | 5 |
| 4-6 | greedy, ignoring | 2.14 | branch 22% | 0.841 to 1.231 | 10 (branch 94, resonance 60, sugar 39, benzene 31, ring 26, shared side 22, chain 15, spiro 6, acid 4, amine 2) |
| 4-6 | look-ahead, ignoring | 2.26 | branch 22% | 0.864 to 1.181 | 10 |
| 4-6 | greedy, seeking | 2.16 | branch 22% | 0.815 to 0.991 | 10 |
| 4-6 | look-ahead, seeking | 2.40 | branch 22% | 0.791 to 1.035 | 10 |
| 7-9 | greedy, ignoring | 2.43 | branch 19% | 0.983 to 1.247 | 10 (ring 65, branch 63, sugar 50, chain 36, benzene 36, resonance 17, amine 14, acid 9, shared side 8, sulfur 2) |
| 7-9 | look-ahead, ignoring | 2.44 | branch 19% | 0.901 to 1.095 | 10 |
| 7-9 | greedy, seeking | 2.54 | branch 18% | 1.018 to 1.244 | 11 |
| 7-9 | look-ahead, seeking | 2.59 | branch 18% | 0.928 to 1.090 | 10 |

No motif is above a third of all motif yield at any stage; the largest is sugar at 31% in rounds 1 to 3 (five motifs share it there). Rounds differ more with the motifs on: the spread of round yield rises from 0.84 to 1.23 in rounds 4 to 6 for the greedy player, and which motif pays most changes from round to round (ten different ones in rounds 4 to 9; the top one is under 35% of rounds).

Full share lines (greedy, ignoring): rounds 1-3 sugar 28, resonance 28, benzene 13, branch 15, chain 13, ring 3, cage 1; rounds 4-6 sugar 15, resonance 17, benzene 6, ring 13, shared side 9, cage 3, spiro 7, acid 1, amine 0, branch 22, chain 6; rounds 7-9 sugar 13, resonance 13, benzene 6, ring 18, shared side 8, cage 1, spiro 6, acid 2, amine 2, sulfur 0, branch 19, chain 11.

### Does building for them beat ignoring them

The seeking player chooses by yield with the motifs counted; the ignoring player by yield without. Both are scored with the motifs on, paired round by round (300 pairs per stage).

| Rounds | Player | Seeker ahead of ignorer (ratio of mean yield) | Typical round (geometric mean) | Median round | Ahead / behind |
|---|---|---|---|---|---|
| 1-3 | greedy | 1.15 | x1.16 | x1.09 | 76% / 10% |
| 1-3 | look-ahead | 1.14 | x1.16 | x1.09 | 81% / 8% |
| 4-6 | greedy | 1.01 | x1.05 | x1.00 | 42% / 20% |
| 4-6 | look-ahead | 1.04 | x1.04 | x1.00 | 44% / 20% |
| 7-9 | greedy | 1.02 | x1.00 | x1.00 | 36% / 20% |
| 7-9 | look-ahead | 0.98 | x0.95 | x1.00 | 39% / 25% |

In rounds 1 to 3 the margin is clear (about 15% on a mean round, ahead in three rounds of four). In rounds 4 to 9 it is small (a typical round 0 to 5% better, ahead twice as often as behind, an even mean). Tried and not helpful: counting the motifs as a sum of the rates instead of a product (rounds 1 to 3 about 10%, rounds 4 to 9 the same as above); rates one and a half times higher (same); raising sugar and resonance and lowering ring and branch (same); the seeker also taking the better of two dealt molecules by the motifs it starts with (no gain). The cause is in the numbers: in rounds 4 to 9 most of what the motifs pay (ring, branch, shared side, spiro) arrives with the permanent reflexes as the chain runs, so the line that makes the longest chain is also the line that builds them, and the two players take lines of equal yield in about four rounds in ten. A player who builds for them wins where there is a real choice to make between a line for the chain and a line for the count, and that choice is thin once the molecule is large. What would widen it is in "What could not be done".

## For the game builder

Replaces the `KIN` table, `KIN_OF`, `kinOf` and `kinsOf` in `apps/steam/js/react/path.js`, and the `'family'` emit in `fire` (the line that loops over `kinsOf(o.model)`).

1. **Delete** `KIN`, `KIN_OF`, `kinOf`, `kinsOf` and the family emit. Keep the first column of `FEED` as a name for how molecules are grouped when a round is dealt, but stop showing it anywhere: the tier and odds in `KIN` (`tier`, `odds`) used by `runBriefs` to pick a family move into a small `DEAL` table of the same numbers, keyed by the same five group names, so the deal stays as it is.
2. **Add** `MOTIFS = { sugar: { rate: 0.07, count: m => ... }, resonance: { rate: 0.08, ... }, ... }` with the twelve rates of the table above, and `motifsOf(model)` returning `{ id: level }` for the levels above zero. Read it on a copy of the model with `RX.reopen` applied, so a loose ring counts open. The twelve counts are written in `traits.py` (`n_sugar`, `run_of_double_bonds`, `n_arene`, `n_ring`, `n_fusion`, `n_cage`, `n_spiro`, `n_acid`, `n_amine`, `n_sulfur`, `n_branch`, `n_chain`); each is a few lines of graph work on the model's atoms and bonds. Resonance needs a Kekule form of aromatic rings (three double bonds for a six ring); use the one `RX.aromaticAtoms` already implies and test fused rings (naphthalene is 5).
3. **Test** by porting `CASES` from `traits.py` (82 rows, `python -c "import traits, json; print(json.dumps(traits.CASES))"`): SMILES through `RX.fromSmiles`, count out, the same as RDKit's. The JS counts must match these before anything else is built.
4. **Pay.** For each step of a chain (the place where `CASC` pays step n), take `motifsOf` of the molecule after the step, compute `mult = product over motifs of (1 + rate * level)`, and emit one `{ part: 'p', op: 'mul', val: mult }` on that step, with the levels in the event so the page can show them. Only motifs the player has opened are included (see the findings table). Extra is untouched.
5. **Opening.** Start open: sugar, resonance, ring, branch, chain. The other seven open by the findings table; save the open set in the profile.
6. **Spec.** Add a reader `motif:<id>` to `SX` with the two readings the structural specs already use (gain, and best during the round). Offer a spec on a motif only if the run carries a reagent or reflex that builds it (the table above).
7. **Pair screen.** Where the chosen-molecule screen showed the family name, show the marks of the motifs the molecule holds (no words).
8. **Numbers to beat.** The yield of the same play rises by x1.4 in rounds 1 to 3 and by x2.2 to x2.4 in rounds 4 to 9 with all twelve open, so `PAR` and the spec marks have to be fitted again. With only the five opening motifs open the rise is smaller (sugar, resonance, branch point and long chain carry it). I did not refit them.
9. **Save** the levels at the end of each turn into the round record for the finding checks.

## For the page

No sentence anywhere. A column of marks stands beside the molecule on its far side, never on it. Each mark is a small pen-drawn picture, its level, and its percent.

- **The picture is the count.** Sugar is a stack of cubes, one cube a level. Resonance is a wave with one hump a level, so a run of five is visibly longer than a run of three. Ring is a row of polygons, shared side two polygons touching along an edge with a pair a level, cage a cube outline with an edge more a level, spiro two polygons touching at a point, benzene ring a hexagon with a circle, acid a drop, amine three short prongs, sulfur a yellow arch, branch a fork, chain a zigzag with a bend a level. Past six pieces the picture stops growing and a number counts on.
- **The number.** Beside the picture, the level in the pen's numerals, and under it the percent it pays ("+14%"). At the head of the column, the product of all of them as one figure ("x1.60") in a chip.
- **Colours** (one hue each, kept from the old families where there was one): sugar #c0489a, resonance #b0189a, ring #2f8f6a, benzene ring #a8791a, cage #c8261c, long chain #5a6475; new: shared side #1f8a8a, spiro #3466b8, acid #d9731a, amine #6a4fc2, sulfur #d6b21a, branch #7a5a3a.
- **Only held motifs show.** A motif at level 0 has no mark. A motif the player has not opened has no mark and no pay. When a spec names a motif at 0, its mark stands in outline with the number to reach.
- **When the molecule changes.** When a level rises, a piece pops onto the picture and the number counts up; when it falls, a piece drops away. The chip changes with it.
- **During the overreaction.** At each step the marks that are held light up left to right, each adding its percent to the step's number as it passes, and the chip's figure lands on the step's number as a multiply. A player sees the multiply build up step by step before the number moves.
- **At the choice of one molecule from two.** Each molecule has its marks beneath it, as many as it holds, with the chip. That is the whole difference between two molecules of the same size: the one with the longer wave and the taller stack is worth more.
- **No flicker.** A zip's loose ring is not counted, so no mark changes when a ring shuts and opens; the marks change only when a reagent or a permanent reflex changes the molecule.
- **On the end screen** the motifs the round used are listed as the same marks, with how much each added, largest first.

## What could not be done

- The trait-seeking player's margin over the ignoring player is clear only in rounds 1 to 3 (about 15%). In rounds 4 to 9 it is 0 to 5% on a typical round and the look-ahead seeker in rounds 7 to 9 is a little behind (0.95 to 0.98): the 8-line cut in the look-ahead search and the heavy tail of round yield both add noise at that size, and I did not enlarge the search. The target of a clear but not absurd margin is met in rounds 1 to 3 and missed in rounds 4 to 9. Widening it needs a lever the player controls at that size: a reagent or instrument that adds a motif without adding steps (the seed crystal's OH is one), and specs that ask for a motif by name. Neither is in this run's engine.
- The choices that span a whole run (which molecule to take, which reagents and instruments to carry, which homunculus to hatch) are not simulated, and they are where building for a motif most plainly pays. Only one of them was tried (the better of two molecules by the motifs it starts with) and it did nothing.
- Benzene ring and cage cannot be built in a round by any reagent here (a benzene ring is only ever dealt, a cage is rare), so they are choices of molecule and not of line. Sulfur bridge appears in 2% of rounds 7 to 9, acid in 17%, amine in 12%, and only in rounds that carry the right reagent.
- The numbers to beat and the spec marks were not refitted for the new yield.
- Instruments and homunculi are described from their rules, not measured on the motifs.
- The reflex table is read between steps and includes the reagents fired between them.
- Resonance in fused aromatic rings reads RDKit's Kekule form of the canonical molecule; two equal Kekule forms of a fused ring could give a different count on an unusual molecule. The 10 resonance tests include naphthalene (5).
- `library_paper.py` and `engine_paper.py` (the newer reagent and reflex lists) were not used; the numbers are for the 18 reagents and 13 reflexes of `library.py`.
- `test_engine.py` has one failing test already (`test_the_ten_lines_of_docs_reactions_md`).
