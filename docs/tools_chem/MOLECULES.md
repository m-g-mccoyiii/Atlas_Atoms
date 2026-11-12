# The starting molecules, rounds 1 to 9

Written 12 November 2026 by the judge of three designers. Files: `docs/tools_chem/molecules2.py` (the table, the generator, the checks), `molecules2_feed.js` (the 216 pool molecules as rows for path.js), `molecules2_bank.js` (360 generated molecules for a game that cannot run the generator). Nothing existing was edited.

Why this exists: the game's 77 molecules hold only carbon, hydrogen and oxygen. Six of the twelve unlocked reagents never matter, five of the thirteen reflexes almost never fire, the ammonia and sulfur jars have no feeder, the rare motifs are missing, and the molecules look tame (HARNESS AF, AG, V, U).

## The short version

- 24 molecules for each of the 9 rounds (216), all parse in RDKit, none repeats, each inside its round's size window (10 to 12 heavy atoms in round 1, 31 to 35 in round 9). A generator with a filter is there for endless play.
- Every one of the 18 reagents can act on at least 29 percent of the molecules in rounds 4 to 9 (the game's 77: hofmann 0, reduce 12 and 2). Every jar can be fed from round 4. Every one of the twelve motifs turns up from round 4. All 24 kept specs can be offered.
- Seal, knit, cap and close now fire where they were nearly dead (knit 16 percent of turns against 6, close 7 against 2, seal 11 against 7, cap 9 against 5). Open (5), fold (7) and flip (3 to 5) are still thin.
- What molecules could NOT fix: oxidize stays in the best line on 68 to 75 percent of turns in rounds 1 to 6 (the 77: 73 to 81), and ozonolysis, epoxidation, hydroformylation and grow stay above 70. Section 7 lists these for the reagent and reflex owners.
- The new molecules pay less than the 77 (75 to 93 percent of their yield), so every yield mark has to be scaled (section 8).

## 1. What I checked first

`python test_engine.py` passes (23 tests, 0 failed). I did not re-run each designer's full 300-round measure. Instead I put all 438 molecules the three designers offered (plus the game's own 77 in each round they fit, and 100 fresh generator draws a round) through the same engine at 12 greedy plays each, in their own round. This is what came back (greedy yield / steps a turn / turns with no step / oxidize in the best line):

| set | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 |
|---|---|---|---|---|---|---|---|---|---|
| generator pool | 430/2.0/2%/75% | 520/2.4/2%/74% | 450/2.1/1%/79% | 604/2.2/13%/78% | 675/2.4/14%/77% | 743/2.5/15%/77% | 968/3.1/11%/61% | 880/2.8/15%/66% | 1019/3.0/15%/66% |
| real compounds | 316/1.5/5%/79% | 281/1.4/11%/77% | 327/1.6/8%/78% | 531/2.0/24%/80% | 511/1.9/25%/79% | 602/2.2/19%/77% | 830/2.7/17%/65% | 871/2.8/18%/63% | 902/2.7/18%/64% |
| puzzle first | 382/1.9/3%/76% | 425/2.0/1%/73% | 403/2.0/1%/76% | 635/2.3/16%/78% | 586/2.2/12%/78% | 722/2.5/19%/73% | 1022/3.2/14%/60% | 1083/3.2/15%/61% | 1176/3.5/10%/63% |
| the game's 77 | 487/2.3/0%/79% | 468/2.2/2%/80% | 474/2.3/2%/77% | 671/2.4/16%/79% | 759/2.6/16%/75% | 900/2.9/12%/74% | 1298/3.7/13%/65% | 1359/3.8/8%/66% | 1538/4.0/9%/64% |

The designers' headline claims hold: the generator and puzzle sets pay 75 to 95 percent of the 77, the real-compound set pays 55 to 75 percent and has the most turns with nothing to fire, and none of the three moves oxidize below the mid 70s in rounds 1 to 6 or below the mid 60s in rounds 7 to 9. (Designer 3 measured with single-reagent changes why: grow then oxidize is one line that works on any C=O. I did not re-run those.)

## 2. How the 24 a round were chosen

Candidates: 150 puzzle molecules, 144 real-compound molecules, 144 generator-pool molecules, the game's 77 where they fit a round, plus 100 fresh generator draws per round (1503 round-molecule pairs in all). Each was played 12 times (greedy, the carried sets of the harness) in its round. Then a search picked 24 per round, nine rounds in order, with these rules:

- Inside the round's size window, and its mean size near the round's aim (11, 12.8, 14.6, 17, 20, 23.5, 27.5, 31, 33.5 atoms).
- Yield within 0.72 to 1.38 of the round's median in rounds 1 to 3 and 0.62 to 1.5 after (named real compounds may go down to 0.5, since real molecules pay least). No more than 35 percent of turns with nothing to fire.
- Cover (as score, not as hard rules): each reagent acts on 30 to 45 percent of the pool, each held reflex fires on a quarter to a half of the molecules, each motif turns up twice (rounds 1 to 3 have lower asks and no fused, cage or spiro rings in rounds 1 and 2).
- Oxidize in the best line near 62 percent or lower, a small spread of yield, a mix of kinds (pushed toward 3 to 4 named real compounds, 3 near-relatives and 5 from each designer), no more than four raw generator draws, no more than 4 of one shape in rounds 4 to 9, no scaffold more than 3 times, a cap on groups per atom (so a molecule is not a pile of groups), at most 3 of the game's own, a molecule never repeated across rounds. The kinds were pushed, not forced: named real compounds came out at 1 to 4 a round and only 1 in round 9, because real molecules of 31 to 35 atoms are few and pay little.
- Round 1 to 3: chains and single rings first, at most 3 or 4 groups, at most four molecules with N, S or Cl in round 1.

Rejected: dull ones (a plain chain with one group), ones much easier or harder than their round, ones where one reagent was the only answer, and the sprawling raw generator output beyond four a round. The selection used the 12-play screen, so the final measure below uses fresh seeds.

What is in each pool, by kind and by shape:

| round | atoms | real compounds | near-relatives | made up | kept from the 77 | where from | shapes |
|---|---|---|---|---|---|---|---|
| 1 | 10 to 12 | 4 | 3 | 16 | 1 | game table 1, generator extra 4, generator pool 8, puzzle set 6, real-compounds set 5 | benzene 2, chain 12, ring 10 |
| 2 | 11 to 14 | 4 | 2 | 16 | 2 | game table 2, generator extra 4, generator pool 8, puzzle set 7, real-compounds set 3 | benzene 3, chain 10, ring 11 |
| 3 | 13 to 16 | 4 | 3 | 14 | 3 | game table 3, generator extra 4, generator pool 5, puzzle set 7, real-compounds set 5 | benzene 3, cage 1, chain 8, fused 2, ring 10 |
| 4 | 15 to 19 | 3 | 6 | 13 | 2 | game table 2, generator extra 4, generator pool 7, puzzle set 2, real-compounds set 9 | benzene 4, cage 4, chain 4, fused 4, ring 4, spiro 4 |
| 5 | 18 to 22 | 3 | 4 | 15 | 2 | game table 2, generator extra 4, generator pool 5, puzzle set 6, real-compounds set 7 | benzene 4, cage 4, chain 4, fused 4, ring 4, spiro 4 |
| 6 | 21 to 26 | 3 | 3 | 16 | 2 | game table 2, generator extra 4, generator pool 8, puzzle set 5, real-compounds set 5 | benzene 4, cage 4, chain 4, fused 4, ring 4, spiro 4 |
| 7 | 25 to 30 | 3 | 3 | 16 | 2 | game table 2, generator extra 4, generator pool 5, puzzle set 8, real-compounds set 5 | benzene 4, cage 4, chain 4, fused 4, ring 4, spiro 4 |
| 8 | 29 to 33 | 3 | 5 | 13 | 3 | game table 3, generator extra 4, generator pool 5, puzzle set 6, real-compounds set 6 | benzene 4, cage 4, chain 4, fused 4, ring 4, spiro 4 |
| 9 | 31 to 35 | 1 | 4 | 18 | 1 | game table 1, generator extra 4, generator pool 4, puzzle set 10, real-compounds set 5 | benzene 4, cage 4, chain 4, fused 4, ring 4, spiro 4 |


Shapes from round 4 are balanced on purpose, four each of chain, ring, benzene, fused rings, cage and spiro. That is a result of my cap, not a rule of the game. The kept game molecules are the ones with a ring or a benzene ring that still earn a place.

## 3. The pools, round by round

Columns: SMILES; heavy atoms; name or plain description; kind (real compound, near-relative of a real one with the stated change, made up, or kept from the 77); groups (counts as the engine reads them); motifs present; why it is there (shape, which reflexes it set off in the 12 plays, and the plan the designer wrote where there was one). "sets off" names the reflexes that fired on at least 12 percent of its turns.

### Round 1

Round 1 (10 to 12 heavy atoms). Short chains and single rings, two or three groups, one hetero atom at most. The N, S and benzene ones are few and plain.

| SMILES | atoms | name or description | kind | groups | motifs | why it is there |
|---|---|---|---|---|---|---|
| `C=C1CC(C)C(O)C1C=O` | 10 | carbon ring (cyclopentane) with OH, C=O, C=C | made up | OH 1 C=O 1 C=C 1 | ring | a carbon or hetero ring; in play it sets off dry, ring |
| `C=CC(O)CC(=O)CSC` | 10 | open chain with OH, C=O, C=C, S bridge | made up | OH 1 C=O 1 C=C 1 | sulfur | an open chain; in play it sets off ring, dry; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach |
| `C=CCCC(=O)CCC=O` | 10 | ketone with a vinyl-ended arm (3 carbons from the C=O) and an aldehyde arm (3 carbons from the C=O) | made up | C=O 2 C=C 1 |  | an open chain; in play it sets off ring |
| `C=CCCC1C=CCC1=O` | 10 | carbon ring (cyclopentane) with C=O, 2 C=C | made up | C=O 1 C=C 2 | ring | a carbon or hetero ring; in play it sets off ring, dry; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach |
| `NCC1CC=CC(C=O)C1` | 10 | cyclohexene carrying an aldehyde and an aminomethyl | made up | C=O 1 C=C 1 NH2 1 | ring amine | a carbon or hetero ring; in play it sets off dry, ring |
| `O=C1CC=CC1CCCO` | 10 | carbon ring (cyclopentane) with OH, C=O, C=C | made up | OH 1 C=O 1 C=C 1 | ring | a carbon or hetero ring; in play it sets off ring, dry; OH and C=O 3 to 4 apart: ring |
| `O=CC=Cc1ccccc1` | 10 | cinnamaldehyde | real compound | C=O 1 C=C 1 | arene resonance | a benzene ring; in play it sets off dry, ring |
| `C=C(C)C1=CCC(C)CC1=O` | 11 | near-relative of menthone | near-relative | C=O 1 C=C 2 | ring resonance | a carbon or hetero ring; in play it sets off ring, dry; two C=C in a row: a run of alternating double bonds |
| `C=C(C)CCC(=O)CC(=C)C` | 11 | ketone with an isopropenyl arm (2 carbons from the C=O) and an isopropenyl arm (3 carbons from the C=O) | made up | C=O 1 C=C 2 |  | an open chain; in play it sets off ring, dry |
| `C=CC(CCC)C(O)CC=O` | 11 | open chain with OH, C=O, C=C | made up | OH 1 C=O 1 C=C 1 |  | an open chain; in play it sets off ring, dry; OH two carbons from a C=O: dry |
| `C=CC1NCC(C(C)=O)C1O` | 11 | ring with an N (pyrrolidine) with OH, C=O, C=C | made up | OH 1 C=O 1 C=C 1 | ring amine | a carbon or hetero ring; in play it sets off dry, ring; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach |
| `C=CCC(=O)CCC(C)(C)O` | 11 | ketone with a vinyl-ended arm (2 carbons from the C=O) and a tertiary alcohol arm (3 carbons from the C=O) | made up | OH 1 C=O 1 C=C 1 |  | an open chain; in play it sets off ring, dry |
| `C=CCC(=O)c1ccccc1` | 11 | benzene ring (benzene) with C=O, C=C | made up | C=O 1 C=C 1 | arene resonance | a benzene ring; in play it sets off dry, ring |
| `CC(C)=C1CCC(C)CC1=O` | 11 | pulegone | real compound | C=O 1 C=C 1 | ring resonance | a carbon or hetero ring; in play it sets off dry, ring |
| `CC(C)=CCCC(C)=CC=O` | 11 | citral | real compound | C=O 1 C=C 2 | resonance | an open chain; in play it sets off dry, ring |
| `CCCCCC=CC=CC=O` | 11 | 2,4-decadienal | real compound | C=O 1 C=C 2 | resonance | an open chain; in play it sets off ring, dry |
| `C=C(C)C1CCC(C)C(=O)C1=O` | 12 | near-relative of menthone | near-relative | C=O 2 C=C 1 | ring resonance | a carbon or hetero ring; in play it sets off dry, ring; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach |
| `C=C(C)CC(=O)CCC(C)(C)O` | 12 | isopropenyl ketone with a tertiary alcohol | made up | OH 1 C=O 1 C=C 1 |  | an open chain; in play it sets off ring, dry |
| `C=C(C)CCC(=O)CCCC=O` | 12 | ketone with an isopropenyl arm (3 carbons from the C=O) and an aldehyde arm (4 carbons from the C=O) | made up | C=O 2 C=C 1 |  | an open chain; in play it sets off ring |
| `C=C(C)CCCC(=O)CCC=O` | 12 | ketone with an isopropenyl arm (4 carbons from the C=O) and an aldehyde arm (3 carbons from the C=O) | made up | C=O 2 C=C 1 |  | an open chain; in play it sets off ring, dry |
| `C=CC(O)CCCC1CCCC1` | 12 | a chain with a cyclopentane ring | made up | OH 1 C=C 1 | ring | a carbon or hetero ring; in play it sets off dry, ring |
| `C=CCCC(=O)CCC(C)(C)O` | 12 | from the current game table | current game molecule | OH 1 C=O 1 C=C 1 |  | an open chain; in play it sets off ring, dry |
| `CC(=O)C=CC1NCCCC1O` | 12 | ring with an N (piperidine) with OH, C=O, C=C | made up | OH 1 C=O 1 C=C 1 | ring amine resonance | a carbon or hetero ring; in play it sets off dry, ring; OH and C=O 3 to 4 apart: ring |
| `CC(C)=CCCC(=O)CCCO` | 12 | like sulcatone, with a 2-carbon alcohol arm on a methyl end | near-relative | OH 1 C=O 1 C=C 1 |  | an open chain; in play it sets off ring, dry |

### Round 2

Round 2 (11 to 14). Rings, a benzene or two, one fused pair, first single N, S and Cl.

| SMILES | atoms | name or description | kind | groups | motifs | why it is there |
|---|---|---|---|---|---|---|
| `C=C(C)C1CC=C(C)C(=O)C1` | 11 | carvone | real compound | C=O 1 C=C 2 | ring resonance | a carbon or hetero ring; in play it sets off dry, ring |
| `C=CC(CC(=O)CCO)SC` | 11 | open chain with OH, C=O, C=C, S bridge | made up | OH 1 C=O 1 C=C 1 | sulfur | an open chain; in play it sets off ring, dry |
| `CCCCCC(O)C=CC=O` | 11 | 4-hydroxy-2-nonenal | real compound | OH 1 C=O 1 C=C 1 | resonance | an open chain; in play it sets off ring, dry |
| `CSCC1C(=O)CC=CC1O` | 11 | carbon ring (cyclohexane) with OH, C=O, C=C, S bridge | made up | OH 1 C=O 1 C=C 1 | ring sulfur | a carbon or hetero ring; in play it sets off dry, ring; OH two carbons from a C=O: dry |
| `O=CC(C=C1CCCC1)CO` | 11 | carbon ring (cyclopentane) with OH, C=O, C=C | made up | OH 1 C=O 1 C=C 1 | ring | a carbon or hetero ring; in play it sets off ring, dry; OH two carbons from a C=O: dry |
| `C=C(C)CCCC(=O)CC(=C)C` | 12 | ketone with an isopropenyl arm (2 carbons from the C=O) and an isopropenyl arm (4 carbons from the C=O) | made up | C=O 1 C=C 2 |  | an open chain; in play it sets off ring, dry |
| `C=CCCCC(=O)CCCC=O` | 12 | ketone with a vinyl-ended arm (4 carbons from the C=O) and an aldehyde arm (4 carbons from the C=O) | made up | C=O 2 C=C 1 |  | an open chain; in play it sets off ring, dry |
| `CC(=O)C=CC1CNCCC1O` | 12 | ring with an N (piperidine) with OH, C=O, C=C | made up | OH 1 C=O 1 C=C 1 | ring amine resonance | a carbon or hetero ring; in play it sets off dry, ring; OH and C=O 3 to 4 apart: ring |
| `CC(C)=CCCC(=O)CCC=O` | 12 | ketone with an isoprenyl arm (3 carbons from the C=O) and an aldehyde arm (3 carbons from the C=O) | made up | C=O 2 C=C 1 |  | an open chain; in play it sets off ring |
| `C=CC(=O)C(CC(C)(C)O)NCC` | 13 | open chain with OH, C=O, C=C | made up | OH 1 C=O 1 C=C 1 | amine resonance | an open chain; in play it sets off ring, dry; OH and C=O 3 to 4 apart: ring |
| `C=CCCC(=O)CC1CCCC1=O` | 13 | from the current game table | current game molecule | C=O 2 C=C 1 | ring | a carbon or hetero ring; in play it sets off ring |
| `C=CCCC1CCC(CC=O)C1=O` | 13 | carbon ring (cyclopentane) with 2 C=O, C=C | made up | C=O 2 C=C 1 | ring | a carbon or hetero ring; in play it sets off ring; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach |
| `CC(C)=C1C(=O)CC(C)(O)CC1=O` | 13 | near-relative of pulegone | near-relative | OH 1 C=O 2 C=C 1 | ring resonance | a carbon or hetero ring; in play it sets off dry, ring; OH two carbons from a C=O: dry |
| `CC(C)=CCC(=O)CCC(C)(C)O` | 13 | ketone with an isoprenyl arm (2 carbons from the C=O) and a tertiary alcohol arm (3 carbons from the C=O) | made up | OH 1 C=O 1 C=C 1 |  | an open chain; in play it sets off ring, dry |
| `O=CCCCC(=O)CCCCCO` | 13 | ketone with a primary alcohol arm (5 carbons from the C=O) and an aldehyde arm (4 carbons from the C=O) | made up | OH 1 C=O 2 |  | an open chain; in play it sets off ring, dry |
| `C=CC(=O)c1ccc(O)c(OC)c1O` | 14 | near-relative of eugenol | near-relative | OH 2 C=O 1 C=C 1 ether 1 | arene resonance | a benzene ring; in play it sets off ring, dry; OH two carbons from a C=O: dry |
| `C=CC(O)(CC=O)Cc1ccccc1` | 14 | benzene ring (benzene) with OH, C=O, C=C | made up | OH 1 C=O 1 C=C 1 | arene resonance | a benzene ring; in play it sets off ring, dry; OH two carbons from a C=O: dry |
| `C=CC(O)CC(=O)CCCCC(=O)O` | 14 | open chain with OH, C=O, C=C, COOH | made up | OH 1 C=O 1 C=C 1 COOH 1 | acid | an open chain; in play it sets off dry, ring; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach |
| `C=CCC(O)CC(=O)C1CCCCN1` | 14 | ring with an N (piperidine) with OH, C=O, C=C | made up | OH 1 C=O 1 C=C 1 | ring amine | a carbon or hetero ring; in play it sets off dry, ring; OH two carbons from a C=O: dry |
| `CC(=O)C=CC1C(C)=CCCC1(C)C` | 14 | alpha-ionone | real compound | C=O 1 C=C 2 | ring resonance | a carbon or hetero ring; in play it sets off ring, dry |
| `CC(=O)CC(O)C=CC1CCCSC1` | 14 | a chain with a ketone, an OH 2 carbons from it, a C=C, a thiane ring | made up | OH 1 C=O 1 C=C 1 | ring sulfur | a carbon or hetero ring; in play it sets off ring, dry |
| `CC(=O)CCC=C(C)CCC=C(C)C` | 14 | geranylacetone | real compound | C=O 1 C=C 2 |  | an open chain; in play it sets off ring, dry |
| `CC(C=CC=O)C(O)c1ccccc1` | 14 | benzene ring (benzene) with OH, C=O, C=C | made up | OH 1 C=O 1 C=C 1 | arene resonance | a benzene ring; in play it sets off ring, dry; a C=C two carbons from a C=O: shift, then more |
| `O=CCCC(=O)CCC1(O)CCCC1` | 14 | from the current game table | current game molecule | OH 1 C=O 2 | ring | a carbon or hetero ring; in play it sets off ring, dry |

### Round 3

Round 3 (13 to 16). First cage, fused and spiro rings, the first acids and amines.

| SMILES | atoms | name or description | kind | groups | motifs | why it is there |
|---|---|---|---|---|---|---|
| `CC(C=O)=C1C(=O)CC(C)CC1O` | 13 | near-relative of pulegone | near-relative | OH 1 C=O 2 C=C 1 | ring resonance | a carbon or hetero ring; in play it sets off dry, ring; OH and C=O 3 to 4 apart: ring |
| `OCC(O)COc1ccc(Cl)cc1` | 13 | chlorphenesin | real compound | OH 2 Cl 1 ether 1 | arene resonance | a benzene ring; in play it sets off dry, ring |
| `C=C(C=O)CC1(O)CSC(CC=O)C1` | 14 | ring with an S (thiolane) with OH, 2 C=O, C=C, S bridge | made up | OH 1 C=O 2 C=C 1 | ring sulfur resonance | a carbon or hetero ring; in play it sets off ring, dry; enone with an OH three or four from its far end: tuck |
| `C=CCC(=O)CCC1CC=CC(O)C1` | 14 | cyclohexenol with an allyl ketone chain | made up | OH 1 C=O 1 C=C 2 | ring | a carbon or hetero ring; in play it sets off ring, dry |
| `C=CCCC(=O)CCC1(O)CCCC1` | 14 | from the current game table | current game molecule | OH 1 C=O 1 C=C 1 | ring | a carbon or hetero ring; in play it sets off ring |
| `C=CCCCCCCCCC=CC=O` | 14 | like trans-2-nonenal, with a vinyl-ended arm on a methyl end | near-relative | C=O 1 C=C 2 | resonance | an open chain; in play it sets off dry, ring |
| `CC(=O)C=CC1=C(C)CCCC1(C)C` | 14 | beta-ionone | real compound | C=O 1 C=C 2 | ring resonance | a carbon or hetero ring; in play it sets off ring, dry |
| `CC(C)=CCC(=O)CCCC(C)(C)O` | 14 | ketone with an isoprenyl arm (2 carbons from the C=O) and a tertiary alcohol arm (4 carbons from the C=O) | made up | OH 1 C=O 1 C=C 1 |  | an open chain; in play it sets off ring, dry |
| `CC(C)=CCCCC(=O)CCCC=O` | 14 | ketone with an isoprenyl arm (4 carbons from the C=O) and an aldehyde arm (4 carbons from the C=O) | made up | C=O 2 C=C 1 |  | an open chain; in play it sets off ring |
| `CC(O)CCC(=O)CCCC(C)(C)O` | 14 | ketone with a secondary alcohol arm (3 carbons from the C=O) and a tertiary alcohol arm (4 carbons from the C=O) | made up | OH 2 C=O 1 |  | an open chain; in play it sets off ring, dry |
| `CC(O)CCCCC(=O)CCCC=O` | 14 | ketone with a secondary alcohol arm (5 carbons from the C=O) and an aldehyde arm (4 carbons from the C=O) | made up | OH 1 C=O 2 |  | an open chain; in play it sets off ring, dry |
| `CC1(C)C2CCC1(CCCO)C(=O)C2` | 14 | camphor with a hydroxypropyl arm | made up | OH 1 C=O 1 | cage | a cage; in play it sets off ring, dry |
| `C=CC(C=C1CCNC1)C(=O)CC(C)=O` | 15 | ring with an N (pyrrolidine) with 2 C=O, 2 C=C | made up | C=O 2 C=C 2 | ring amine | a carbon or hetero ring; in play it sets off dry, ring |
| `C=CCCC1CC(C(O)CC(C)N)C1=O` | 15 | carbon ring (cyclobutane) with OH, C=O, C=C, NH2 | made up | OH 1 C=O 1 C=C 1 NH2 1 | ring amine | a carbon or hetero ring; in play it sets off ring, dry; NH2 and C=O 3 to 4 apart: knit |
| `CC(C)(CO)C(O)C(=O)NCCC(=O)O` | 15 | pantothenic acid | real compound | OH 2 COOH 1 amide 1 | acid | an open chain; in play it sets off dry, ring |
| `CC(O)CCCC(=O)CCCC(C)(C)O` | 15 | ketone with a tertiary alcohol arm (4 carbons from the C=O) and a secondary alcohol arm (4 carbons from the C=O) | made up | OH 2 C=O 1 |  | an open chain; in play it sets off ring |
| `CC1=CCCC(C)=CCC(C)(C)C=CC1` | 15 | humulene | real compound | C=C 3 | ring | a carbon or hetero ring; in play it sets off ring, dry |
| `O=C(O)CCCC(O)C1CCC=CC1=O` | 15 | carbon ring (cyclohexane) with OH, C=O, C=C, COOH | made up | OH 1 C=O 1 C=C 1 COOH 1 | ring acid resonance | a carbon or hetero ring; in play it sets off dry, ring; COOH and an OH 3 to 4 apart: seal |
| `O=CC=CC(O)CCCCCCCCO` | 15 | like 4-hydroxy-2-nonenal, with a 3-carbon alcohol arm on a methyl end | near-relative | OH 2 C=O 1 C=C 1 | resonance | an open chain; in play it sets off ring, dry |
| `O=CCCCC(=O)CCC1(O)CCCC1` | 15 | from the current game table | current game molecule | OH 1 C=O 2 | ring | a carbon or hetero ring; in play it sets off ring |
| `C=CC(=O)c1cc(CO)c2c(c1)CC=CC2` | 16 | fused rings (tetralin) with OH, C=O, 2 C=C | made up | OH 1 C=O 1 C=C 2 | arene ring fusion resonance | fused rings; in play it sets off ring, dry; OH and C=O 3 to 4 apart: ring |
| `C=CCCC(=O)CCC(=O)c1ccccc1` | 16 | from the current game table | current game molecule | C=O 2 C=C 1 | arene resonance | a benzene ring; in play it sets off ring, dry |
| `C=Cc1cc(C(=O)O)cc(C(O)CC=O)c1` | 16 | benzene ring (benzene) with OH, C=O, C=C, COOH | made up | OH 1 C=O 1 C=C 1 COOH 1 | arene acid resonance | a benzene ring; in play it sets off dry, ring; COOH and an OH 3 to 4 apart: seal |
| `C=Cc1ccc(CCO)c2c1C(O)CC2=O` | 16 | fused rings (indane) with 2 OH, C=O, C=C | made up | OH 2 C=O 1 C=C 1 | arene ring fusion resonance | fused rings; in play it sets off dry, ring; C=O with an OH at 2 (dry) and an OH at 3 or 4 (ring) |

### Round 4

Round 4 (15 to 19). The seven reflexes of rounds 4 to 6 are held; every motif but the sulfur bridge can turn up.

| SMILES | atoms | name or description | kind | groups | motifs | why it is there |
|---|---|---|---|---|---|---|
| `C=C1CC(O)(CC=O)C(O)C12CCCC2` | 15 | spiro rings (spiro44) with 2 OH, C=O, C=C | made up | OH 2 C=O 1 C=C 1 | ring spiro | a spiro ring pair; in play it sets off ring, dry, weld; ketone with OH at 2 and 3: dry gives an enol, flip turns it to C=O |
| `C=CC(=C)CCC=C(C)CCC=C(C)C` | 15 | beta-farnesene | real compound | C=C 4 | resonance | an open chain; in play it sets off dry, weld, ring, shift |
| `C=CC(O)(CCC=C(C)C)CCCCN` | 15 | like linalool, with a 3-carbon amine arm on a methyl end | near-relative | OH 1 C=C 2 NH2 1 | amine | an open chain; in play it sets off dry, weld, ring, shift |
| `CC(=O)CCCC1=CCC2C(C1)C2(C)C` | 15 | like 3-carene, with a methyl ketone arm on a methyl end | near-relative | C=O 1 C=C 1 | ring fusion | fused rings; in play it sets off dry, ring, weld, snap |
| `O=CC=C(C=O)CCCCC=CC1CO1` | 15 | epoxide with 2 C=O, 2 C=C, epoxide, ether | made up | C=O 2 C=C 2 ether 1 | ring resonance | a carbon or hetero ring; in play it sets off dry, ring, weld, flip; a C=C right beside a C=O: dihydroxylation, then dry, then flip |
| `C=C(C)C1CCC2=CC(=O)CC(C)C2(C)C1` | 16 | nootkatone | real compound | C=O 1 C=C 2 | ring fusion resonance | fused rings; in play it sets off dry, shift, weld, snap |
| `CC(=O)CCCCCCCC(O)C=CC=O` | 16 | like 4-hydroxy-2-nonenal, with a methyl ketone arm on a methyl end | near-relative | OH 1 C=O 2 C=C 1 | resonance | an open chain; in play it sets off dry, ring, weld, tuck |
| `CC=CC(O)C1C(=O)C(Cl)c2ccccc21` | 16 | fused rings (indane) with OH, C=O, C=C, Cl | made up | OH 1 C=O 1 C=C 1 Cl 1 | arene ring fusion resonance | fused rings; in play it sets off dry, ring, weld, shift; C=C 3 to 4 from a C=O: Ritter puts the NH2, knit closes it; Cl and OH 3 to 5 apart: close |
| `O=C(O)CCCC(O)CC(=O)C1=CCCC1` | 16 | carbon ring (cyclopentane) with OH, C=O, C=C, COOH | made up | OH 1 C=O 1 C=C 1 COOH 1 | ring acid resonance | a carbon or hetero ring; in play it sets off dry, shift, weld, tuck; COOH and an OH 3 to 4 apart: seal; a C=C two carbons from a C=O: shift, then more |
| `O=CCCCC(=O)CCc1ccccc1O` | 16 | from the current game table | current game molecule | OH 1 C=O 2 | arene resonance | a benzene ring; in play it sets off dry, ring, weld |
| `CC1=CCCC(C)(C)C1C=CC(=O)CCCO` | 17 | like alpha-ionone, with a 2-carbon alcohol arm on a methyl end | near-relative | OH 1 C=O 1 C=C 2 | ring resonance | a carbon or hetero ring; in play it sets off dry, ring, weld, shift |
| `CC=CCC(CCCSC)C(S)C=CCC=O` | 17 | open chain with C=O, 2 C=C, SH, S bridge | made up | C=O 1 C=C 2 SH 1 | sulfur | an open chain; in play it sets off dry, weld, ring, shift; SH and C=O 3 to 4 apart: cap; inner C=C: epoxidize, then fold to a C=O |
| `CCC(N)C=CC(=O)CC(O)c1ccccc1` | 17 | a chain with a ketone, an OH 2 carbons from it, a C=C, an NH2, a benzene ring | made up | OH 1 C=O 1 C=C 1 NH2 1 | arene amine resonance | a benzene ring; in play it sets off dry, ring, weld, tuck |
| `CCC1=C2C(CC=O)=C3CC1C(=O)C(C3)C2N` | 17 | cage (adamantane) with 2 C=O, 2 C=C, NH2 | made up | C=O 2 C=C 2 NH2 1 | cage amine resonance | a cage; in play it sets off dry, shift, ring, weld; two C=C in a row: a run of alternating double bonds |
| `C=C(C)C1(O)CCC2=CC(=O)CC(CN)C2(C)C1` | 18 | near-relative of nootkatone | near-relative | OH 1 C=O 1 C=C 2 NH2 1 | ring fusion amine resonance | fused rings; in play it sets off dry, ring, weld, shift; NH2 on a saturated carbon: Hofmann takes it off as a C=C |
| `C=CCC(=O)CSC1CCC(=O)C12CCC(N)C2` | 18 | spiro rings (spiro44) with 2 C=O, C=C, NH2, S bridge | made up | C=O 2 C=C 1 NH2 1 | ring spiro amine sulfur | a spiro ring pair; in play it sets off dry, ring, weld, shift; NH2 and C=O 3 to 4 apart: knit; chain-end C=C 3 to 4 from a C=O: thiol-ene puts the SH, cap closes it |
| `CC(=O)CCC(=O)CCC(O)C1CC2CCC1C2` | 18 | from the current game table | current game molecule | OH 1 C=O 2 | cage | a cage; in play it sets off dry, ring, weld, shift |
| `CCNCC(C=O)C=C1C=CC2(CCC(=O)C2)C1` | 18 | spiro rings (spiro44) with 2 C=O, 2 C=C | made up | C=O 2 C=C 2 | ring spiro amine resonance | a spiro ring pair; in play it sets off dry, ring, snap, weld; C=C 3 to 4 from a C=O: Ritter puts the NH2, knit closes it; a C=C two carbons from a C=O: shift, then more |
| `O=CCC(O)CCCC1CCCC12C=CC(=O)C2` | 18 | spiro rings (spiro44) with OH, 2 C=O, C=C | made up | OH 1 C=O 2 C=C 1 | ring spiro resonance | a spiro ring pair; in play it sets off dry, weld, ring, shift; aldehyde with an OH near: cyanohydrin makes COOH, seal closes it; a C=C two carbons from a C=O: shift, then more |
| `C=CCC(O)CCC1CC2CC(CCC(C)=O)C1C2` | 19 | norbornane cage with an allyl alcohol arm and a methyl ketone arm | made up | OH 1 C=O 1 C=C 1 | cage | a cage; in play it sets off dry, ring, weld, shift |
| `CC(=O)C=CC1C2CCC(CC2O)C1CCCCN` | 19 | bicyclo[2.2.2]octane cage carrying an OH, a 4-carbon amine arm, an enone arm | made up | OH 1 C=O 1 C=C 1 NH2 1 | cage amine resonance | a cage; in play it sets off dry, ring, weld, snap |
| `CC(C=CC1(O)C(C)=CC(=O)CC1(C)C)=CC(=O)O` | 19 | abscisic acid | real compound | OH 1 C=O 1 C=C 3 COOH 1 | ring acid resonance | a carbon or hetero ring; in play it sets off dry, ring, weld, shift |
| `CC(O)CC(=O)CCc1ccc(CCCCN)cc1` | 19 | benzene ring with a ketone arm with an alcohol next door and an amine arm | made up | OH 1 C=O 1 NH2 1 | arene amine resonance | a benzene ring; in play it sets off dry, weld, ring |
| `OCC1OC(Oc2ccc(O)cc2)C(S)C(O)C1O` | 19 | like arbutin, with its OH swapped for SH | near-relative | OH 4 SH 1 ether 2 | arene ring resonance | a benzene ring; in play it sets off dry, weld, ring, shift |

### Round 5

Round 5 (18 to 22).

| SMILES | atoms | name or description | kind | groups | motifs | why it is there |
|---|---|---|---|---|---|---|
| `C=C(C)C1(O)CCC2=CC(=O)CC(CO)C2(C)C1` | 18 | near-relative of nootkatone | near-relative | OH 2 C=O 1 C=C 2 | ring fusion resonance | fused rings; in play it sets off dry, shift, snap, weld; secondary OH and tertiary OH: oxidize makes the C=O the other OH closes onto |
| `C=C(C)C1CCC2=CC(=O)C(N)C(C)C2(C)C1=O` | 18 | near-relative of nootkatone | near-relative | C=O 2 C=C 2 NH2 1 | ring fusion amine resonance | fused rings; in play it sets off dry, ring, snap, weld; NH2 and C=O 3 to 4 apart: knit |
| `C=CC1C(=O)C1c1c(O)cc(C=O)cc1CCC` | 18 | benzene ring (benzene) with OH, 2 C=O, C=C | made up | OH 1 C=O 2 C=C 1 | arene ring resonance | a benzene ring; in play it sets off dry, weld, shift, ring; chain-end C=C 3 to 4 from a C=O: thiol-ene puts the SH, cap closes it; aldehyde and OH: permanganate makes the COOH, seal closes it |
| `C=CCCC(=O)CCC(C)(O)C1CC2CCC1C2` | 18 | from the current game table | current game molecule | OH 1 C=O 1 C=C 1 | cage | a cage; in play it sets off dry, ring, weld, tuck |
| `CC(O)CCC1(O)C=CC2(CC(=O)CC(O)C2)C1` | 18 | spiro rings (spiro45) with 3 OH, C=O, C=C | made up | OH 3 C=O 1 C=C 1 | ring spiro | a spiro ring pair; in play it sets off dry, ring, weld, snap; C=C 3 to 4 from a C=O: Ritter puts the NH2, knit closes it; secondary OH and tertiary OH: oxidize makes the C=O the other OH closes onto |
| `CC=C1CC2C(=O)CC(O)CC2C(C(C)=O)C1=O` | 18 | fused rings (decalin) with OH, 3 C=O, C=C | made up | OH 1 C=O 3 C=C 1 | ring fusion resonance | fused rings; in play it sets off dry, ring, weld, shift; C=C 3 to 4 from a C=O: Ritter puts the NH2, knit closes it; OH and C=O 3 to 4 apart: ring |
| `C=CC1CC(=O)CC12CC=CC=C2CC(CO)SC` | 19 | spiro rings (spiro45) with OH, C=O, 3 C=C, S bridge | made up | OH 1 C=O 1 C=C 3 | ring spiro sulfur resonance | a spiro ring pair; in play it sets off dry, weld, ring, shift; chain-end C=C 3 to 4 from a C=O: thiol-ene puts the SH, cap closes it; two C=C in a row: a run of alternating double bonds |
| `CC(=O)C=CC1C(C)=CCCC1(C)CCCCCO` | 19 | like alpha-ionone, with a 4-carbon alcohol arm on a methyl end | near-relative | OH 1 C=O 1 C=C 2 | ring resonance | a carbon or hetero ring; in play it sets off dry, ring, weld |
| `C=CC(=O)CC(O)C(N)CCCCCC1CCCSC1` | 20 | a chain with a ketone, an OH 2 carbons from it, a C=C, an NH2, a thiane ring | made up | OH 1 C=O 1 C=C 1 NH2 1 | ring amine sulfur resonance | a carbon or hetero ring; in play it sets off dry, ring, weld, tuck |
| `C=CCC(O)CCCC(=O)CCCC(=O)CCCCN` | 20 | amino diketone with an allyl alcohol | made up | OH 1 C=O 2 C=C 1 NH2 1 | amine | an open chain; in play it sets off dry, weld, ring, tuck |
| `CC(=O)CCC(=O)CCCCCC(=O)CCC(C)(C)O` | 20 | from the current game table | current game molecule | OH 1 C=O 3 |  | an open chain; in play it sets off dry, shift, weld, ring |
| `CCC=CCC=CCC=CCCCCCCCC(=O)O` | 20 | linolenic acid | real compound | C=C 3 COOH 1 | acid | an open chain; in play it sets off dry, weld, ring |
| `NC12CC=C(CC1)C2CCC(O)CC(=O)CCCC=O` | 20 | cage (pinane) with OH, 2 C=O, C=C, NH2 | made up | OH 1 C=O 2 C=C 1 NH2 1 | cage amine | a cage; in play it sets off dry, weld, ring, tuck; NH2 on a saturated carbon: Hofmann takes it off as a C=C; an aldehyde and a ketone: reduce makes the OH that closes onto the ketone |
| `O=CCC(O)CCCC(=O)C12CC(O)C(CCC1O)N2` | 20 | cage with an N (tropane) with 3 OH, 2 C=O | made up | OH 3 C=O 2 | cage amine | a cage; in play it sets off dry, weld, ring, snap; ketone with OH at 2 and 3: dry gives an enol, flip turns it to C=O |
| `C=CC(CCC)C(=O)C(CC=O)CC(N)C(C)CCSC` | 21 | open chain with 2 C=O, C=C, NH2, S bridge | made up | C=O 2 C=C 1 NH2 1 | amine sulfur | an open chain; in play it sets off dry, shift, weld, ring; NH2 and C=O 3 to 4 apart: knit; chain-end C=C 3 to 4 from a C=O: thiol-ene puts the SH, cap closes it |
| `C=CC(O)CCC1CCC2(CCC(CCC=O)C2)CC1N` | 21 | spiro[4.5]decane carrying an aldehyde arm, an allylic alcohol arm, an NH2 | made up | OH 1 C=O 1 C=C 1 NH2 1 | ring spiro amine | a spiro ring pair; in play it sets off dry, weld, ring |
| `CC(C=CC=C(C)C=CC1=C(C)CCCC1(C)C)=CC=O` | 21 | retinal | real compound | C=O 1 C=C 5 | ring resonance | a carbon or hetero ring; in play it sets off dry, ring, weld, snap |
| `CC12CC3CC(C)(C1)C(CCC(=O)CCC=O)C(N)(C3)C2` | 21 | memantine-like cage with a keto-aldehyde chain | made up | C=O 2 NH2 1 | cage amine | a cage; in play it sets off dry, weld, ring, shift |
| `COc1ccc2c3c1OC1CC(=O)C=CC31CCN(C)C2` | 21 | like galantamine, with its OH turned into a C=O | near-relative | C=O 1 C=C 1 ether 2 | arene ring fusion spiro amine resonance | a spiro ring pair; in play it sets off dry, weld, ring, shift |
| `O=C(O)CCCC1CCCCC1CC(=O)C=CCCCO` | 21 | cyclohexane with an acid arm and an enone arm with an alcohol at its far end | made up | OH 1 C=O 1 C=C 1 COOH 1 | ring acid resonance | a carbon or hetero ring; in play it sets off dry, ring, weld, shift |
| `C=CC(C)(O)CCC1C(C)(O)CCC2C(C)(C)CCCC21C` | 22 | sclareol | real compound | OH 2 C=C 1 | ring fusion | fused rings; in play it sets off dry, weld, ring, tuck |
| `C=CC(O)CCc1cc(CCCCl)cc(CC(O)CC=O)c1` | 22 | benzene ring carrying a hydroxy-aldehyde arm, a 3-carbon chloride arm, an allylic alcohol arm | made up | OH 2 C=O 1 C=C 1 Cl 1 | arene resonance | a benzene ring; in play it sets off dry, shift, weld, ring |
| `CC(C)(O)CCC(=O)CCc1ccc(CCCCC=O)cc1` | 22 | benzene ring with a ketone arm ending in a tertiary alcohol and an aldehyde arm | made up | OH 1 C=O 2 | arene resonance | a benzene ring; in play it sets off dry, ring, shift, weld |
| `CC(C)=CCC(=O)CCc1ccccc1CCCCCC=O` | 22 | benzene ring with an isoprenyl ketone arm and a long aldehyde arm | made up | C=O 2 C=C 1 | arene resonance | a benzene ring; in play it sets off dry, shift, weld, ring |

### Round 6

Round 6 (21 to 26).

| SMILES | atoms | name or description | kind | groups | motifs | why it is there |
|---|---|---|---|---|---|---|
| `CC12CCC(=O)C=C1CCC1C2CCC2(C)C(O)CCC12` | 21 | testosterone | real compound | OH 1 C=O 1 C=C 1 | ring fusion resonance | fused rings; in play it sets off dry, ring, weld, shift |
| `NCCCC1C=CC(CC(O)CC=O)CC1CCCCO` | 21 | cyclohexene ring carrying a hydroxy-aldehyde arm, a 3-carbon amine arm, a 4-carbon alcohol arm | made up | OH 2 C=O 1 C=C 1 NH2 1 | ring amine | a carbon or hetero ring; in play it sets off dry, shift, weld, tuck |
| `C=CC(CC(N)(C=C(CCC)CSC)CCC(C)=O)C(C)=O` | 22 | open chain with 2 C=O, 2 C=C, NH2, S bridge | made up | C=O 2 C=C 2 NH2 1 | amine sulfur | an open chain; in play it sets off dry, weld, shift, snap; NH2 and C=O 3 to 4 apart: knit; chain-end C=C 3 to 4 from a C=O: thiol-ene puts the SH, cap closes it |
| `CCC=CCC(N)(CC1C2CCC(C2)C1O)C(O)CCC=O` | 22 | cage (pinane) with 2 OH, C=O, C=C, NH2 | made up | OH 2 C=O 1 C=C 1 NH2 1 | cage amine | a cage; in play it sets off dry, shift, weld, ring; OH and NH2 3 to 4 apart: oxidize makes the C=O, knit closes it; aldehyde with an OH near: cyanohydrin makes COOH, seal closes it |
| `CCSCC=CCC(=O)C1C=CCC(S)C12CC(O)CC2=O` | 22 | spiro rings (spiro45) with OH, 2 C=O, 2 C=C, SH, S bridge | made up | OH 1 C=O 2 C=C 2 SH 1 | ring spiro sulfur | a spiro ring pair; in play it sets off dry, shift, tuck, snap; OH and SH 3 to 4 apart: oxidize makes the C=O, cap closes it; a C=C two carbons from a C=O: shift, then more |
| `O=C(O)C=CCC(O)(C1=CC(=O)CSC1)c1cccc(O)c1` | 22 | benzene ring (benzene) with 2 OH, C=O, 2 C=C, COOH, S bridge | made up | OH 2 C=O 1 C=C 2 COOH 1 | arene ring acid sulfur resonance | a benzene ring; in play it sets off dry, ring, tuck, weld; COOH and an OH 3 to 4 apart: seal; a C=C two carbons from a C=O: shift, then more |
| `C=C(C)C1=CC2=CCC3C(C)(C(=O)O)CCCC3(C)C2CC1=O` | 23 | near-relative of abietic acid | near-relative | C=O 1 C=C 3 COOH 1 | ring fusion acid resonance | fused rings; in play it sets off dry, ring, weld, shift; chain-end C=C 3 to 4 from a C=O: thiol-ene puts the SH, cap closes it |
| `C=C(C)CCC(=O)C1=C2CC(=O)C(SC(CCCl)C(C)O)(C2)C1` | 23 | cage (norbornane) with OH, 2 C=O, 2 C=C, Cl, S bridge | made up | OH 1 C=O 2 C=C 2 Cl 1 | cage sulfur resonance | a cage; in play it sets off ring, dry, shift, weld; chain-end C=C 3 to 4 from a C=O: thiol-ene puts the SH, cap closes it; a C=C two carbons from a C=O: shift, then more |
| `CC(=O)CCC(=O)C=CCCCC=CC=CC1(O)CCCCC1` | 23 | from the current game table | current game molecule | OH 1 C=O 2 C=C 3 | ring resonance | a carbon or hetero ring; in play it sets off dry, weld, ring, snap |
| `CC=C(CCO)CC1C(=O)C2(CCCC2)C(CCC(=O)O)C1O` | 23 | spiro rings (spiro44) with 2 OH, C=O, C=C, COOH | made up | OH 2 C=O 1 C=C 1 COOH 1 | ring spiro acid | a spiro ring pair; in play it sets off dry, ring, weld, shift; OH two carbons from a C=O: dry |
| `CSCCCC=CC=CCCCC=CC(=O)CCCCC(C)=O` | 23 | long chain carrying 2 ketones or aldehydes, 3 C=C bonds | made up | C=O 2 C=C 3 | sulfur resonance | an open chain; in play it sets off dry, weld, ring, snap |
| `C=C(C)CCCCC(=O)CCC(O)CC(=O)CCc1ccccc1` | 24 | chain with 1 ring carrying 2 ketones or aldehydes, 1 alcohol, 1 C=C | made up | OH 1 C=O 2 C=C 1 | arene resonance | a benzene ring; in play it sets off dry, weld, ring, snap |
| `C=C(C)CCCCC(O)CCCC(=O)CCC(=O)CCCCCN` | 24 | long chain carrying 2 ketones or aldehydes, 1 alcohol, 1 C=C, 1 amine | made up | OH 1 C=O 2 C=C 1 NH2 1 | amine | an open chain; in play it sets off dry, ring, weld, tuck |
| `CC(=O)CCC(=O)CCC(=O)C=CCCCC=CC=CC(C)(C)O` | 24 | from the current game table | current game molecule | OH 1 C=O 3 C=C 3 | resonance | an open chain; in play it sets off dry, ring, weld, snap |
| `CC1C(C(=O)C(O)C2CNCC(C=O)O2)=CCC12CC(O)CC2O` | 24 | spiro rings (spiro44) with 3 OH, 2 C=O, C=C, ether | made up | OH 3 C=O 2 C=C 1 ether 1 | ring spiro amine resonance | a spiro ring pair; in play it sets off dry, weld, tuck, ring; enone with an OH three or four from its far end: tuck |
| `COc1cc(CNC(=O)CCCC(O)C=CC(C)C=O)ccc1O` | 24 | near-relative of capsaicin | near-relative | OH 2 C=O 1 C=C 1 ether 1 amide 1 | arene resonance | a benzene ring; in play it sets off dry, weld, ring, shift; OH and C=O 3 to 4 apart: ring |
| `CSCCCC(=O)C1=C2CC(C(S)C(O)CCC(C)=O)C(N)(C2)C1` | 24 | cage (norbornane) with OH, 2 C=O, C=C, NH2, SH, S bridge | made up | OH 1 C=O 2 C=C 1 NH2 1 SH 1 | cage amine sulfur resonance | a cage; in play it sets off dry, shift, weld, snap; OH and NH2 3 to 4 apart: oxidize makes the C=O, knit closes it; SH and C=O 3 to 4 apart: cap; a C=C right beside a C=O: dihydroxylation, then dry, then flip |
| `NC1(CCC23C4C5C6C4C2C6C53)C(=O)CC=CC1CC(=O)C(=O)O` | 24 | cage (cubane) with 2 C=O, C=C, COOH, NH2 | made up | C=O 2 C=C 1 COOH 1 NH2 1 | ring cage acid amine resonance | a cage; in play it sets off dry, ring, weld, shift; COOH and NH2 3 to 4 apart: seal makes a lactam; two C=O four to six apart: weld closes a ring |
| `NCCCC(=O)CCCC1CCCC(CC(=O)C=CCCCO)C1` | 24 | cyclohexane with an enone arm with an alcohol at its far end and an amino ketone arm | made up | OH 1 C=O 2 C=C 1 NH2 1 | ring amine resonance | a carbon or hetero ring; in play it sets off dry, ring, weld, tuck |
| `C=CCCCc1cc(CC(O)CC(C)=O)cc(CC(S)CCC=O)c1` | 25 | benzene ring carrying a thiol-aldehyde arm, a pentenyl arm, a hydroxy-ketone arm | made up | OH 1 C=O 2 C=C 1 SH 1 | arene resonance | a benzene ring; in play it sets off dry, weld, ring, shift |
| `CC(=O)C=CC1CC(Cl)CC2(CCCC(CC(O)CCC=O)C2=O)C1` | 25 | spiro rings (spiro55) with OH, 3 C=O, C=C, Cl | made up | OH 1 C=O 3 C=C 1 Cl 1 | ring spiro resonance | a spiro ring pair; in play it sets off dry, ring, weld, shift; aldehyde with an OH near: cyanohydrin makes COOH, seal closes it; inner C=C: epoxidize, then fold to a C=O |
| `CCCCCC(O)C=CC1C(=O)CC(O)C1CC=CCCCC(=O)O` | 25 | prostaglandin E2 | real compound | OH 2 C=O 1 C=C 2 COOH 1 | ring acid | a carbon or hetero ring; in play it sets off dry, ring, shift, weld |
| `CC12CCC(=O)C=C1CCC1C2C(Cl)CC2(C=O)C(C(=O)CO)CCC12` | 26 | like aldosterone, with its OH swapped for Cl | near-relative | OH 1 C=O 3 C=C 1 Cl 1 | ring fusion resonance | fused rings; in play it sets off dry, weld, ring, flip |
| `CC12CCC(=O)C=C1CCC1C2C(O)CC2(C)C1CCC2(O)C(=O)CO` | 26 | cortisol | real compound | OH 3 C=O 2 C=C 1 | ring fusion resonance | fused rings; in play it sets off dry, ring, snap, weld |

### Round 7

Round 7 (25 to 30). All thirteen reflexes are held from here.

| SMILES | atoms | name or description | kind | groups | motifs | why it is there |
|---|---|---|---|---|---|---|
| `COc1cc(CNC(=O)C(=O)CC(O)C(O)C=CC(C)C)ccc1O` | 25 | near-relative of capsaicin | near-relative | OH 3 C=O 1 C=C 1 ether 1 amide 1 | arene resonance | a benzene ring; in play it sets off dry, ring, tuck, weld; C=O with an OH at 2 (dry) and an OH at 3 or 4 (ring) |
| `NC(CCC=CCCC(O)CCCC=O)CCC1(C=O)CCCCC1` | 25 | a chain with an amine, a spiro-capable cyclohexane | made up | OH 1 C=O 2 C=C 1 NH2 1 | ring amine | a carbon or hetero ring; in play it sets off knit, dry, weld, ring |
| `C=C(CCC(=O)O)C(O)CC(=O)CCC1(O)CCC2(CCCC2N)CC1` | 26 | spiro rings (spiro45) with 2 OH, C=O, C=C, COOH, NH2 | made up | OH 2 C=O 1 C=C 1 COOH 1 NH2 1 | ring spiro acid amine | a spiro ring pair; in play it sets off dry, ring, seal, weld; OH and NH2 3 to 4 apart: oxidize makes the C=O, knit closes it; COOH and an OH 3 to 4 apart: seal; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach |
| `C=CCCCCNCC(Cl)C(O)C(O)C1C(=O)C(N)Cc2ccccc21` | 26 | fused rings (tetralin) with 2 OH, C=O, C=C, NH2, Cl | made up | OH 2 C=O 1 C=C 1 NH2 1 Cl 1 | arene ring fusion amine resonance | fused rings; in play it sets off dry, ring, knit, close; Cl and NH2 3 to 5 apart: close makes a ring amine; ketone with OH at 2 and 3: dry gives an enol, flip turns it to C=O |
| `CC(=O)C=C(CCCC(=O)O)C(S)CC(O)(CCCC(C)O)CC(C)C` | 26 | open chain with 2 OH, C=O, C=C, COOH, SH | made up | OH 2 C=O 1 C=C 1 COOH 1 SH 1 | acid resonance | an open chain; in play it sets off cap, dry, ring, weld; SH and C=O 3 to 4 apart: cap; inner C=C: epoxidize, then fold to a C=O |
| `CC(=O)CCCN1CCC23c4c5ccc(O)c4OC2C(O)C=CC3C1C5` | 26 | like morphine, with a methyl ketone arm on a methyl end | near-relative | OH 2 C=O 1 C=C 1 ether 1 | arene cage spiro amine resonance | a cage; in play it sets off dry, ring, weld, cap |
| `CC12CCC(=O)C=C1CCC1C2C(O)CC2(C=O)C(C(=O)CO)CCC12` | 26 | aldosterone | real compound | OH 2 C=O 3 C=C 1 | ring fusion resonance | fused rings; in play it sets off dry, weld, ring, flip |
| `O=CCCCC(=O)CCC1CC2CC(CCCC(O)CCCCCl)C1C2` | 26 | norbornane cage with a keto-aldehyde arm and a chloro alcohol arm | made up | OH 1 C=O 2 Cl 1 | cage | a cage; in play it sets off dry, weld, ring, close |
| `C=CCCC(=O)CCc1cc(CCCCCO)cc(CCCCC(C)=O)c1` | 27 | benzene ring with a ketone arm with a vinyl end, a methyl ketone arm and a primary alcohol arm | made up | OH 1 C=O 2 C=C 1 | arene resonance | a benzene ring; in play it sets off dry, weld, ring, seal |
| `CC(=O)CCC(=O)CCC(O)CC1CCC(CCC(=O)CCC(C)=O)CC1` | 27 | from the current game table | current game molecule | OH 1 C=O 4 | ring | a carbon or hetero ring; in play it sets off dry, weld, ring, shift |
| `CC=CCC(=O)CCC1CCCC2C(CCC3OC3CCCCO)CCC12` | 27 | hydrindane with an epoxide-and-alcohol arm and a ketone arm with the C=C one carbon too far | made up | OH 1 C=O 1 C=C 1 ether 1 | ring fusion | fused rings; in play it sets off dry, weld, ring, shift |
| `CCCC(CC=O)C(O)C(CCCO)C(N)C(CC=CC=O)CCC(=O)O` | 27 | open chain with 2 OH, 2 C=O, C=C, COOH, NH2 | made up | OH 2 C=O 2 C=C 1 COOH 1 NH2 1 | acid amine resonance | an open chain; in play it sets off dry, weld, ring, seal; COOH and NH2 3 to 4 apart: seal makes a lactam; a C=C right beside a C=O: dihydroxylation, then dry, then flip |
| `COc1cc(C=CC(=O)CC(=O)C=Cc2ccc(O)c(OC)c2)ccc1O` | 27 | curcumin | real compound | OH 2 C=O 2 C=C 2 ether 2 | arene resonance | a benzene ring; in play it sets off dry, weld, ring, shift |
| `NC12CC3CC(C4=CC(O)CSC4CC=O)(C1)CC(CC(=O)CCl)(C2)C3O` | 27 | cage (adamantane) with 2 OH, 2 C=O, C=C, NH2, Cl, S bridge | made up | OH 2 C=O 2 C=C 1 NH2 1 Cl 1 | ring cage amine sulfur | a cage; in play it sets off dry, weld, ring, close; Cl and NH2 3 to 5 apart: close makes a ring amine; aldehyde and OH: permanganate makes the COOH, seal closes it; OH and C=O 3 to 4 apart: ring |
| `CC(C)(O)CCC=CCCC=CCCC=CCCC(=O)C12C3C4C5C3C1C5C42` | 28 | from the current game table | current game molecule | OH 1 C=O 1 C=C 3 | cage | a cage; in play it sets off dry, ring, weld, tuck |
| `C=CCCC(=O)CC(CCCC=O)C(O)Cc1c(O)c(O)cc2c1CCC(O)C2` | 29 | fused rings (tetralin) with 4 OH, 2 C=O, C=C | made up | OH 4 C=O 2 C=C 1 | arene ring fusion resonance | fused rings; in play it sets off dry, weld, ring, shift; aldehyde and OH: permanganate makes the COOH, seal closes it; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach |
| `CCCc1cccc(CCC=C2C=CCC3(C2)C(=CCC=O)CCCC3O)c1O` | 29 | spiro rings (spiro55) with 2 OH, C=O, 3 C=C | made up | OH 2 C=O 1 C=C 3 | arene ring spiro resonance | a spiro ring pair; in play it sets off dry, ring, weld, shift; aldehyde and OH: permanganate makes the COOH, seal closes it; diene and a third C=C four to five away: snap closes a six-ring |
| `CSCCCC(=O)CC(O)CCC(=O)CCC(=O)CCCC(=O)CCCCCN` | 29 | long chain carrying 4 ketones or aldehydes, 1 alcohol, 1 amine | made up | OH 1 C=O 4 NH2 1 | amine sulfur | an open chain; in play it sets off dry, weld, ring, knit |
| `NC(CCCC1CCC2(C1)C(O)CC(O)C2CCCCC=CC=O)CCC(=O)O` | 29 | spiro rings (spiro44) with 2 OH, C=O, C=C, COOH, NH2 | made up | OH 2 C=O 1 C=C 1 COOH 1 NH2 1 | ring spiro acid amine resonance | a spiro ring pair; in play it sets off dry, weld, seal, ring; COOH and NH2 3 to 4 apart: seal makes a lactam; a C=C right beside a C=O: dihydroxylation, then dry, then flip |
| `NCCCC(=O)CCCC1CCC2(CC1)CCC(CC(=O)C=CCCCO)CC2` | 29 | spiro[5.5]undecane with an amino ketone arm and an enone arm with an alcohol at its far end | made up | OH 1 C=O 2 C=C 1 NH2 1 | ring spiro amine resonance | a spiro ring pair; in play it sets off knit, dry, weld, ring |
| `O=C(O)CCCC=CCC1C(O)CC(=O)C1C=CC(O)CCCCCCCCS` | 29 | like prostaglandin E2, with a 3-carbon thiol arm on a methyl end | near-relative | OH 2 C=O 1 C=C 2 COOH 1 SH 1 | ring acid | a carbon or hetero ring; in play it sets off dry, ring, weld, shift |
| `CC(=CCCCCC=O)CCCC(=O)CCC(O)CCC(=O)CCc1ccccc1` | 30 | chain with 1 ring carrying 3 ketones or aldehydes, 1 alcohol, 1 C=C | made up | OH 1 C=O 3 C=C 1 | arene resonance | a benzene ring; in play it sets off dry, weld, ring, shift |
| `CC(C)=CCCC(C)=CCCC(C)=CCCC=C(C)CCC=C(C)CCC=C(C)C` | 30 | squalene | real compound | C=C 6 |  | an open chain; in play it sets off dry, weld, open, fold |
| `CC=CCC(=O)CCC1CCC(CCCC(=O)O)C(CCC(=O)CCCC(C)=O)C1` | 30 | cyclohexane with a diketone arm, an acid arm and a ketone arm with the C=C one carbon too far | made up | C=O 3 C=C 1 COOH 1 | ring acid | a carbon or hetero ring; in play it sets off dry, weld, ring, shift |

### Round 8

Round 8 (29 to 33).

| SMILES | atoms | name or description | kind | groups | motifs | why it is there |
|---|---|---|---|---|---|---|
| `C=CCCC(=O)CCCC(=O)CCC(O)CCCC(=O)CCC(=O)CCCSC` | 29 | long chain carrying 4 ketones or aldehydes, 1 alcohol, 1 C=C | made up | OH 1 C=O 4 C=C 1 | sulfur | an open chain; in play it sets off dry, weld, ring, shift |
| `CCCC(N)C(C=O)C(=O)C1=CC(CC(CCC)C(N)CCCC(=O)O)CSC1` | 29 | ring with an S (thiane) with 2 C=O, C=C, COOH, 2 NH2, S bridge | made up | C=O 2 C=C 1 COOH 1 NH2 2 | ring acid amine sulfur resonance | a carbon or hetero ring; in play it sets off dry, ring, knit, seal; COOH and NH2 3 to 4 apart: seal makes a lactam; a C=C two carbons from a C=O: shift, then more |
| `COc1cc(C=CC(=O)CC(=O)C(O)C(O)c2ccc(O)c(OC)c2)ccc1O` | 29 | like curcumin, with a C=C turned into a dihydroxy pair | near-relative | OH 4 C=O 2 C=C 1 ether 2 | arene resonance | a benzene ring; in play it sets off dry, ring, weld, flip |
| `NCCCCCCCCC(O)C=CC1C(O)CC(O)C1CC=CCCCC(=O)O` | 29 | like prostaglandin F2 alpha, with a 3-carbon amine arm on a methyl end | near-relative | OH 3 C=C 2 COOH 1 NH2 1 | ring acid amine | a carbon or hetero ring; in play it sets off dry, ring, weld, seal |
| `C=C1C(=CC=C2CCCC3(C)C2CCC3C(C)CCCC(C)(C)O)CC(O)CC1O` | 30 | calcitriol | real compound | OH 3 C=C 3 | ring fusion resonance | fused rings; in play it sets off dry, shift, ring, snap |
| `CC(C)(CCCC(=O)CCC(=O)CCCN)OC(=O)CCCC(=O)CCCCC=O` | 30 | long chain carrying 4 ketones or aldehydes, 1 amine, 1 ester | made up | C=O 4 NH2 1 ester 1 | amine | an open chain; in play it sets off ring, knit, dry, weld |
| `CCSCCc1cc(CCC(=O)CCCC=O)cc(CCC2OC2CCCCO)c1` | 30 | benzene ring with a thioether arm, an epoxide-and-alcohol arm and a keto-aldehyde arm | made up | OH 1 C=O 2 ether 1 | arene ring sulfur resonance | a benzene ring; in play it sets off dry, weld, ring, fold |
| `NC(CCC(=O)O)CC(=O)C1C2C=C3CC(C2)CC1C3(S)CC(O)c1ccccc1` | 30 | cage (adamantane) with OH, C=O, C=C, COOH, NH2, SH | made up | OH 1 C=O 1 C=C 1 COOH 1 NH2 1 SH 1 | arene cage acid amine resonance | a cage; in play it sets off dry, weld, seal, ring; SH and C=O 3 to 4 apart: cap; COOH and NH2 3 to 4 apart: seal makes a lactam |
| `O=CC12CC(O)C3C(CCC4=CC(=O)CCC43CCCCCl)C1CCC2C(=O)CO` | 30 | like aldosterone, with a 3-carbon chloride arm on a methyl end | near-relative | OH 2 C=O 3 C=C 1 Cl 1 | ring fusion resonance | fused rings; in play it sets off dry, weld, flip, close |
| `O=CCCCC(=O)CCC1CCC2(CC1)CCC(CCC(O)CCCC(=O)O)CC2` | 30 | spiro[5.5]undecane with a keto-aldehyde arm and a hydroxy acid arm | made up | OH 1 C=O 2 COOH 1 | ring spiro acid | a spiro ring pair; in play it sets off dry, weld, ring, seal |
| `C=CCC=CCC12CC3CC(C1)CC(C(=O)C=CCCCO)(C3)C2CC(N)CCC=O` | 31 | adamantane cage carrying a skipped-diene arm, an enone-alcohol arm, an amino-aldehyde arm | made up | OH 1 C=O 2 C=C 3 NH2 1 | cage amine resonance | a cage; in play it sets off dry, ring, weld, knit |
| `C=CCCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(C)O` | 31 | from the current game table | current game molecule | OH 7 C=C 1 |  | an open chain; in play it sets off dry, weld, ring, tuck |
| `CC(C)(O)C=CC=CCCCC=CC(=O)CCC(=O)CCC(=O)C12C3C4C5C3C1C5C42` | 31 | from the current game table | current game molecule | OH 1 C=O 3 C=C 3 | cage resonance | a cage; in play it sets off dry, ring, weld, snap |
| `CC(C)=CCCC(C)=CCCC(C)=CCCC=C(C)CCC=C(C)CCC1OC1(C)C` | 31 | squalene epoxide | real compound | C=C 5 ether 1 | ring | a carbon or hetero ring; in play it sets off dry, ring, weld, fold |
| `CCC1OC1CC1CCC2(CCC(C(=O)C=CCCCO)C2)CC1CC(=O)CCC=O` | 31 | spiro[4.5]decane carrying an enone-alcohol arm, an epoxide arm, a keto-aldehyde arm | made up | OH 1 C=O 3 C=C 1 ether 1 | ring spiro resonance | a spiro ring pair; in play it sets off dry, weld, ring, tuck |
| `CCCC(CC1CC2(CCCCC2O)CC(N)(CC=C(CC)C(=O)C=O)C1O)C(C)Cl` | 31 | spiro rings (spiro55) with 2 OH, 2 C=O, C=C, NH2, Cl | made up | OH 2 C=O 2 C=C 1 NH2 1 Cl 1 | ring spiro amine resonance | a spiro ring pair; in play it sets off ring, knit, dry, weld; NH2 and C=O 3 to 4 apart: knit; Cl and OH 3 to 5 apart: close; a C=C two carbons from a C=O: shift, then more |
| `C=CC(=O)CC(=O)C(CC1CC2(CCCC2)CC(O)C1=O)C(O)CCCCCCC(=O)O` | 32 | spiro rings (spiro45) with 2 OH, 3 C=O, C=C, COOH | made up | OH 2 C=O 3 C=C 1 COOH 1 | ring spiro acid resonance | a spiro ring pair; in play it sets off dry, ring, weld, tuck; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach |
| `CC(C)C(C)C=CC(CO)C1CCC2(O)C3=CC=C4CC(O)CCC4(C)C3CC(=O)C12C` | 32 | near-relative of ergosterol | near-relative | OH 3 C=O 1 C=C 3 | ring fusion resonance | fused rings; in play it sets off dry, ring, weld, shift; C=O with an OH at 2 (dry) and an OH at 3 or 4 (ring) |
| `CC(=CCC1=C(C)C(=O)c2ccccc2C1=O)CCCC(C)CCCC(C)CCCC(C)C` | 33 | vitamin K1 | real compound | C=O 2 C=C 2 | arene ring fusion resonance | fused rings; in play it sets off dry, ring, tuck, weld |
| `CC(=O)CCC(=O)CCCCCCCC(=O)CCC(O)CCC(=O)CCc1ccccc1O` | 33 | from the current game table | current game molecule | OH 2 C=O 4 | arene resonance | a benzene ring; in play it sets off dry, ring, weld, tuck |
| `CC(C)=CCCC(C)=CCCC(C)=CCCC=C(C)CCC=C(C)CC(O)C=C(C)C(=O)O` | 33 | near-relative of squalene | near-relative | OH 1 C=C 6 COOH 1 | acid resonance | an open chain; in play it sets off dry, seal, weld, ring; COOH and an OH 3 to 4 apart: seal |
| `CC(N)CC(O)(CCC=CCCCC1=C(Cc2ccccc2)CCC=C1)CC(Cl)CCC=O` | 33 | benzene ring (benzene) with OH, C=O, 3 C=C, NH2, Cl | made up | OH 1 C=O 1 C=C 3 NH2 1 Cl 1 | arene ring amine resonance | a benzene ring; in play it sets off dry, ring, weld, close; Cl and NH2 3 to 5 apart: close makes a ring amine; aldehyde and OH: permanganate makes the COOH, seal closes it; diene and a third C=C four to five away: snap closes a six-ring |
| `CCC=C1CC(CCC(=O)O)CC(C(=O)CC(N)(CCCNC)CC2=CC(Cl)CCC2=O)C1` | 33 | carbon ring (cyclohexane) with 2 C=O, 2 C=C, COOH, NH2, Cl | made up | C=O 2 C=C 2 COOH 1 NH2 1 Cl 1 | ring acid amine resonance | a carbon or hetero ring; in play it sets off dry, knit, weld, ring; Cl and NH2 3 to 5 apart: close makes a ring amine; a C=C right beside a C=O: dihydroxylation, then dry, then flip |
| `O=CCCCCC(O)CCC(=O)CCC(=O)C=CCCCC=CC=CCC1C2CCC1CC2` | 33 | chain with 2 rings carrying 3 ketones or aldehydes, 1 alcohol, 3 C=C bonds | made up | OH 1 C=O 3 C=C 3 | cage resonance | a cage; in play it sets off dry, weld, ring, snap |

### Round 9

Round 9 (31 to 35).

| SMILES | atoms | name or description | kind | groups | motifs | why it is there |
|---|---|---|---|---|---|---|
| `CC(=O)CCCC12CCC(=O)C=C1CCC1C2C(O)CC2(C=O)C(C(=O)CO)CCC12` | 31 | like aldosterone, with a methyl ketone arm on a methyl end | near-relative | OH 2 C=O 4 C=C 1 | ring fusion resonance | fused rings; in play it sets off dry, ring, weld, flip |
| `CC(C)(O)CCC(=O)CCC1CCC2(CC1)CCC(CCC1OC1CCCCO)CC2` | 31 | spiro[5.5]undecane with a ketone arm ending in a tertiary alcohol and an epoxide-and-alcohol arm | made up | OH 2 C=O 1 ether 1 | ring spiro | a spiro ring pair; in play it sets off dry, ring, weld, fold |
| `CC(C)=CCCC(C)C1CCC2(C)C3=C(CCC12C)C1(C)CCC(O)C(C)(C)C1CC3` | 31 | lanosterol | real compound | OH 1 C=C 2 | ring fusion | fused rings; in play it sets off dry, ring, weld, seal |
| `O=C(O)CCCC=CCC1C(O)CC(=O)C1C=CC(O)CCCCCCCCC(=O)O` | 31 | like prostaglandin E2, with a 3-carbon acid arm on a methyl end | near-relative | OH 2 C=O 1 C=C 2 COOH 2 | ring acid | a carbon or hetero ring; in play it sets off dry, weld, ring, shift |
| `C=CC(O)CCC12CC3CC(CCC(=O)CCC(C)=O)(C1)CC(CC(N)CCC=O)(C3)C2` | 32 | adamantane cage carrying an allylic alcohol arm, a diketone arm, an amino-aldehyde arm | made up | OH 1 C=O 3 C=C 1 NH2 1 | cage amine | a cage; in play it sets off dry, knit, weld, ring |
| `CC(=O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC1(O)CCCCC1` | 32 | from the current game table | current game molecule | OH 1 C=O 1 C=C 5 | ring | a carbon or hetero ring; in play it sets off dry, weld, ring, seal |
| `CCCC1CC(C(=O)NC(C(C)Cl)C2OC(SC)C(O)C(O)C2O)N(CCCC(C)=O)C1` | 32 | like clindamycin, with a methyl ketone arm on a methyl end | near-relative | OH 3 C=O 1 Cl 1 ether 1 amide 1 | ring amine sulfur | a carbon or hetero ring; in play it sets off dry, weld, ring, close |
| `C=CCC(CC(CC(O)(CC(=C)C)C(C)=O)C(Cl)CC12CCCCC1C(O)CCC2)C(C)Cl` | 33 | fused rings (decalin) with 2 OH, C=O, 2 C=C, 2 Cl | made up | OH 2 C=O 1 C=C 2 Cl 2 | ring fusion | fused rings; in play it sets off dry, weld, ring, close; Cl and OH 3 to 5 apart: close; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach |
| `CC(=CCCCCC=O)CCCC(=O)CCC(O)CCCC(=O)CCC(=O)CCCCCN` | 33 | long chain carrying 4 ketones or aldehydes, 1 alcohol, 1 C=C, 1 amine | made up | OH 1 C=O 4 C=C 1 NH2 1 | amine | an open chain; in play it sets off dry, weld, ring, tuck |
| `CC(=O)CCCCC=CCC(=O)CCC(=O)C=CCCCC=CC=CCC1C2CCC1CC2` | 33 | chain with 2 rings carrying 3 ketones or aldehydes, 4 C=C bonds | made up | C=O 3 C=C 4 | cage resonance | a cage; in play it sets off dry, weld, ring, snap |
| `CC=CCC(=O)CCC1CCC(CCC(=O)CCCCCO)CC1CCCC(=O)CCCN` | 33 | cyclohexane with an amino ketone arm, a ketone arm with the C=C one carbon too far and a ketone arm with a primary alcohol | made up | OH 1 C=O 3 C=C 1 NH2 1 | ring amine | a carbon or hetero ring; in play it sets off dry, knit, weld, shift |
| `CC(C)=CCCC(C)=CCCC(C)=CCCC=C(C)CCC=C(C)CCC=C(C)CCCCN` | 34 | like squalene, with a 3-carbon amine arm on a methyl end | near-relative | C=C 6 NH2 1 | amine | an open chain; in play it sets off dry, weld, ring, knit |
| `CC(O)C(Cl)C(=Cc1cccc(-c2ccc(-c3cccc(O)c3)cc2)c1)C(N)C(CO)CC=O` | 34 | two rings joined (biphenyl) with 3 OH, C=O, C=C, NH2, Cl | made up | OH 3 C=O 1 C=C 1 NH2 1 Cl 1 | arene amine resonance | a benzene ring; in play it sets off dry, weld, knit, close; OH and NH2 3 to 4 apart: oxidize makes the C=O, knit closes it; Cl and OH 3 to 5 apart: close |
| `NCCCC(=O)CCCc1cc(CCCC(O)CCCCCl)cc(CCC(=O)CCCC=O)c1` | 34 | benzene ring with a keto-aldehyde arm, a chloro alcohol arm and an amino ketone arm | made up | OH 1 C=O 3 NH2 1 Cl 1 | arene amine resonance | a benzene ring; in play it sets off dry, weld, ring, knit |
| `C=CCC(CC=C)CC(=O)C(CC(O)CC(Cl)CC(=O)O)CC(CC=C)C(O)CCCCCCC` | 35 | open chain with 2 OH, C=O, 3 C=C, COOH, Cl | made up | OH 2 C=O 1 C=C 3 COOH 1 Cl 1 | acid | an open chain; in play it sets off dry, weld, ring, seal; COOH and an OH 3 to 4 apart: seal; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach |
| `CC(=O)CCCC(=O)CCc1cc(CCCC(=O)CCCS)cc(CCCC(O)CCCCCl)c1` | 35 | benzene ring with a chloro alcohol arm, a thiol ketone arm and a diketone arm | made up | OH 1 C=O 3 SH 1 Cl 1 | arene resonance | a benzene ring; in play it sets off cap, dry, ring, weld |
| `CC(=O)CCCCC(O)CCCC(=O)CCC(=O)CCC(O)CCCC=CC(=O)CCCC(=O)O` | 35 | long chain carrying 4 ketones or aldehydes, 2 alcohols, 1 C=C, 1 acid | made up | OH 2 C=O 4 C=C 1 COOH 1 | acid resonance | an open chain; in play it sets off dry, weld, ring, snap |
| `CCC(N)C(CC(=O)O)CC1(O)CC(O)CCC12CCC(O)(CC(=O)CCC1CC=CCO1)CC2` | 35 | spiro rings (spiro55) with 3 OH, C=O, C=C, COOH, NH2, ether | made up | OH 3 C=O 1 C=C 1 COOH 1 NH2 1 ether 1 | ring spiro acid amine | a spiro ring pair; in play it sets off dry, ring, weld, seal; COOH and NH2 3 to 4 apart: seal makes a lactam; secondary OH and tertiary OH: oxidize makes the C=O the other OH closes onto |
| `CCCCCCC(O)CCCC(=CC(=O)CCCCC(C)O)C(O)C1CC(O)CC12CCCC2N` | 35 | spiro rings (spiro44) with 4 OH, C=O, C=C, NH2 | made up | OH 4 C=O 1 C=C 1 NH2 1 | ring spiro amine resonance | a spiro ring pair; in play it sets off dry, weld, ring, tuck; enone with an OH three or four from its far end: tuck |
| `CCCCSCC(O)C(C(=O)C(S)CC(O)C(O)CC=O)C(N)CCC1CCC(Cl)C12CCCC2` | 35 | spiro rings (spiro44) with 3 OH, 2 C=O, NH2, SH, Cl, S bridge | made up | OH 3 C=O 2 NH2 1 SH 1 Cl 1 | ring spiro amine sulfur | a spiro ring pair; in play it sets off dry, cap, ring, weld; Cl and NH2 3 to 5 apart: close makes a ring amine; OH and SH 3 to 4 apart: oxidize makes the C=O, cap closes it; ketone with OH at 2 and 3: dry gives an enol, flip turns it to C=O |
| `CCCSCC(=CC(=O)C(O)CCC(=O)O)CC1CC2OC1C(O)C2CCCCC(S)CCC=O` | 35 | cage with an O bridge (oxanorbornane) with 2 OH, 2 C=O, C=C, COOH, SH, S bridge, ether | made up | OH 2 C=O 2 C=C 1 COOH 1 SH 1 ether 1 | cage acid sulfur resonance | a cage; in play it sets off cap, dry, ring, seal; SH and C=O 3 to 4 apart: cap; COOH and an OH 3 to 4 apart: seal; enone with an OH three or four from its far end: tuck |
| `O=C(O)CCCC(O)CCc1cc(CCCC(=O)CCCS)cc(CCC2OC2CCCCO)c1` | 35 | benzene ring with an epoxide-and-alcohol arm, a thiol ketone arm and a hydroxy acid arm | made up | OH 2 C=O 1 COOH 1 SH 1 ether 1 | arene ring acid resonance | a benzene ring; in play it sets off cap, dry, weld, fold |
| `O=CC(CC1=C2CCC(C2)C1)C1(O)CC2(CCCCC2O)C(=O)C1C1(O)CC2CC1(C=O)CC2O` | 35 | spiro rings (spiro45) with 4 OH, 3 C=O, C=C | made up | OH 4 C=O 3 C=C 1 | ring cage spiro | a cage; in play it sets off ring, dry, shift, weld; secondary and tertiary OH: chlorination makes the Cl, close closes it; an aldehyde and a ketone: reduce makes the OH that closes onto the ketone |
| `O=CCCCCC(=O)C=CCCCC=CC=CCCC=CCC(=O)CC1CCCC2CCCCC21` | 35 | chain with 2 rings carrying 3 ketones or aldehydes, 4 C=C bonds | made up | C=O 3 C=C 4 | ring fusion resonance | fused rings; in play it sets off dry, ring, weld, snap |


## 4. The generator, for endless play

`molecules2.generate(round, rng)` calls `mol2_generator.deal` (a seeded builder: a core ring or cage, arms placed at the distances the reflexes need, N, S, Cl and acid groups, real compounds and one-change relatives) and keeps only what passes the filter in `GEN_FILTER`:

| dial | value |
|---|---|
| size | the round's window: 10-12, 11-14, 13-16, 15-19, 18-22, 21-26, 25-30, 29-33, 31-35 heavy atoms |
| groups per heavy atom (OH, C=O, C=C, NH2, SH, Cl) | at most 0.30 in rounds 1 to 3, 0.32 in 4 to 6, 0.34 in 7 to 9 |
| rings in round 1 | one ring system, no fused or spiro; round 2 no spiro, at most two rings |
| N, S, Cl kinds in one molecule | at most 1 in round 1, 2 in rounds 2 and 3, no limit after |
| chance a deal comes from the pool (`P_POOL`) | 0.9, 0.85, 0.8, 0.7, 0.65, 0.6, 0.55, 0.5, 0.5 by round |

The builder's own dials (`mol2_generator.DIALS`: shape odds, N, S, Cl and acid chance, groups per arm, how many plans) were tuned by designer 1 and are left as they are. I tried the filter on 100 fresh draws a round: it removes nothing in rounds 1, 7 and 8, under 10 percent in rounds 4 to 6, and about a quarter in rounds 2, 3 and 9. The draws pay about the same as the pool (448 to 1136 greedy yield by round, spread 0.18 to 0.34) and carry N, S or Cl in 5 percent of round 1 draws, 29 percent in round 4 and about 60 percent from round 6. Oxidize is in the best line for 77 to 80 percent of draws in rounds 1 to 6 (pool: 68 to 75): so the pool is the better source for the early rounds, and the generator is the filler. A fixed bank of 360 generated molecules (40 a round) is in `molecules2_bank.js`.

Commands: `python molecules2.py check | show [round] | atoms | sample [round] [n] | js | bank [n]`.

## 5. The measures

Same engine, same players and carried sets for both columns, 300 rounds per round number for each of three plays: greedy (takes the most yield this turn), look-ahead (looks one turn further) and greedy with a random hand of eight reagents. The 77 are dealt as path.js deals them. Expect 3 to 4 points of noise on any share. Each cell reads "new pool / current 77". "In a best line" counts ties, so it runs high.

### Reagents, rounds 1-3 (new pool / current 77)

| reagent | can act at the start, % | in a best line, % | best line worse without it, % | acts when dealt, % |
|---|---|---|---|---|
| hydrate | 88 / 89 | 66 / 55 | 28 / 15 | 59 / 43 |
| hydroborate | 88 / 89 | 49 / 54 | 15 / 13 | 41 / 41 |
| dehydrate | 57 / 69 | 40 / 45 | 9 / 15 | 27 / 35 |
| oxidize | 65 / 89 | 71 / 79 | 44 / 59 | 59 / 72 |
| reduce | 36 / 28 | 39 / 43 | 5 / 7 | 22 / 29 |
| grow | 94 / 87 | 51 / 46 | 29 / 24 | 38 / 35 |

### Reagents, rounds 4-6 (new pool / current 77)

| reagent | can act at the start, % | in a best line, % | best line worse without it, % | acts when dealt, % | in a best line, random eights, % |
|---|---|---|---|---|---|
| hydrate | 89 / 57 | 53 / 48 | 29 / 23 | 44 / 36 | 59 / 53 |
| hydroborate | 89 / 57 | 40 / 40 | 16 / 14 | 32 / 29 | 43 / 41 |
| dehydrate | 64 / 90 | 52 / 59 | 32 / 40 | 39 / 47 | 52 / 64 |
| oxidize | 68 / 79 | 73 / 76 | 59 / 62 | 62 / 64 | 63 / 70 |
| reduce | 35 / 12 | 31 / 31 | 8 / 7 | 15 / 13 | 41 / 38 |
| grow | 93 / 91 | 74 / 68 | 61 / 54 | 63 / 59 | 72 / 66 |
| hwe | 46 / 64 | 62 / 62 | 47 / 44 | 56 / 49 | 69 / 68 |
| dihydroxylation | 89 / 57 | 66 / 59 | 45 / 32 | 50 / 40 | 63 / 52 |
| ozonolysis | 89 / 57 | 81 / 86 | 69 / 75 | 80 / 80 | 78 / 80 |
| permanganate | 60 / 54 | 24 / 24 | 0 / 1 | 12 / 7 | 30 / 30 |
| ritter | 89 / 57 | 39 / 37 | 23 / 19 | 29 / 25 | 32 / 33 |
| thiolene | 89 / 57 | 25 / 25 | 2 / 0 | 13 / 14 | 26 / 27 |
| chlorination | 57 / 61 | 28 / 29 | 1 / 3 | 12 / 10 | 31 / 37 |
| cyanohydrin | 51 / 64 | 34 / 34 | 4 / 11 | 15 / 16 | 40 / 42 |
| hofmann | 29 / 0 | 50 / 41 | 30 / 18 | 29 / 20 | 46 / 39 |
| chugaev | 64 / 90 | 53 / 60 | 32 / 38 | 48 / 51 | 58 / 69 |
| hydroformylation | 89 / 57 | 77 / 71 | 62 / 51 | 70 / 66 | 72 / 64 |
| epoxidation | 89 / 57 | 21 / 23 | 1 / 0 | 12 / 10 | 26 / 27 |

### Reagents, rounds 7-9 (new pool / current 77)

| reagent | can act at the start, % | in a best line, % | best line worse without it, % | acts when dealt, % | in a best line, random eights, % |
|---|---|---|---|---|---|
| hydrate | 82 / 68 | 44 / 39 | 21 / 17 | 31 / 27 | 47 / 45 |
| hydroborate | 82 / 68 | 30 / 32 | 10 / 11 | 19 / 18 | 36 / 38 |
| dehydrate | 76 / 88 | 49 / 60 | 30 / 44 | 36 / 47 | 55 / 58 |
| oxidize | 79 / 65 | 63 / 64 | 47 / 47 | 54 / 54 | 63 / 67 |
| reduce | 39 / 2 | 28 / 31 | 8 / 11 | 15 / 17 | 34 / 36 |
| grow | 89 / 93 | 72 / 69 | 60 / 55 | 64 / 59 | 73 / 66 |
| hwe | 53 / 79 | 62 / 57 | 43 / 37 | 47 / 43 | 63 / 63 |
| dihydroxylation | 82 / 68 | 46 / 43 | 24 / 22 | 33 / 28 | 52 / 48 |
| ozonolysis | 82 / 68 | 80 / 74 | 69 / 60 | 71 / 63 | 71 / 64 |
| permanganate | 57 / 35 | 37 / 38 | 15 / 17 | 22 / 25 | 35 / 36 |
| ritter | 82 / 68 | 37 / 40 | 14 / 19 | 27 / 29 | 34 / 42 |
| thiolene | 82 / 68 | 41 / 40 | 25 / 24 | 36 / 33 | 29 / 36 |
| chlorination | 79 / 63 | 23 / 22 | 5 / 5 | 14 / 11 | 44 / 43 |
| cyanohydrin | 56 / 79 | 40 / 43 | 15 / 20 | 25 / 27 | 47 / 43 |
| hofmann | 35 / 0 | 45 / 43 | 27 / 21 | 32 / 23 | 41 / 36 |
| chugaev | 76 / 88 | 54 / 65 | 31 / 47 | 38 / 51 | 57 / 67 |
| hydroformylation | 82 / 68 | 64 / 62 | 46 / 44 | 48 / 47 | 56 / 51 |
| epoxidation | 82 / 68 | 87 / 90 | 78 / 83 | 67 / 72 | 83 / 84 |

### Reflexes: share of turns in which each fires (greedy / look-ahead), new pool vs current 77

Rounds 1-3
| reflex | new pool, % | current 77, % |
|---|---|---|
| ring | 90 / 88 | 99 / 96 |
| dry | 70 / 89 | 47 / 76 |

Rounds 4-6
| reflex | new pool, % | current 77, % |
|---|---|---|
| ring | 37 / 44 | 42 / 49 |
| dry | 72 / 77 | 72 / 73 |
| flip | 3 / 3 | 2 / 3 |
| shift | 20 / 31 | 20 / 32 |
| tuck | 12 / 11 | 19 / 16 |
| weld | 36 / 48 | 50 / 57 |
| snap | 12 / 17 | 12 / 15 |

Rounds 7-9
| reflex | new pool, % | current 77, % |
|---|---|---|
| seal | 11 / 10 | 7 / 7 |
| close | 7 / 5 | 2 / 1 |
| knit | 16 / 17 | 6 / 7 |
| cap | 9 / 8 | 5 / 3 |
| open | 5 / 4 | 6 / 4 |
| fold | 7 / 8 | 4 / 6 |
| dry | 67 / 73 | 72 / 78 |
| flip | 5 / 6 | 3 / 4 |
| shift | 16 / 22 | 19 / 27 |
| tuck | 12 / 11 | 21 / 17 |
| weld | 48 / 61 | 58 / 72 |
| snap | 9 / 13 | 10 / 14 |
| ring | 46 / 53 | 53 / 64 |

### By round (new pool / current 77): oxidize, spread within a round, yield, steps a turn, look-ahead against greedy

| round | oxidize in a best line % | oxidize in every best line % | spread of yield between molecules (sd/mean) | p90/p10 | greedy yield | steps a turn | turns with no step % | look-ahead yield / greedy yield | kinds of reflex in a chain |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 72 / 81 | 44 / 62 | 0.22 / 0.23 | 2.0 / 1.7 | 404 / 483 | 1.98 / 2.28 | 1 / 2 | 1.35 / 1.13 | 1.6 / 1.4 |
| 2 | 68 / 78 | 38 / 58 | 0.18 / 0.23 | 1.4 / 1.7 | 447 / 479 | 2.16 / 2.27 | 1 / 1 | 1.26 / 1.18 | 1.6 / 1.4 |
| 3 | 74 / 77 | 50 / 56 | 0.20 / 0.22 | 1.4 / 1.8 | 426 / 489 | 2.05 / 2.30 | 3 / 1 | 1.24 / 1.14 | 1.6 / 1.5 |
| 4 | 75 / 80 | 61 / 66 | 0.31 / 0.28 | 2.2 / 2.0 | 582 / 680 | 2.16 / 2.37 | 17 / 18 | 1.77 / 1.61 | 1.8 / 2.1 |
| 5 | 74 / 77 | 60 / 62 | 0.30 / 0.30 | 2.2 / 2.5 | 606 / 753 | 2.23 / 2.56 | 15 / 18 | 1.96 / 1.65 | 1.9 / 2.1 |
| 6 | 71 / 73 | 55 / 56 | 0.26 / 0.19 | 2.0 / 1.5 | 700 / 888 | 2.45 / 2.89 | 16 / 14 | 1.79 / 1.51 | 2.0 / 2.3 |
| 7 | 62 / 64 | 47 / 47 | 0.25 / 0.18 | 1.9 / 1.7 | 982 / 1311 | 3.13 / 3.67 | 13 / 13 | 1.68 / 1.60 | 2.5 / 2.7 |
| 8 | 64 / 65 | 48 / 49 | 0.25 / 0.20 | 2.0 / 1.7 | 1147 / 1400 | 3.34 / 3.75 | 15 / 12 | 1.58 / 1.58 | 2.6 / 2.7 |
| 9 | 64 / 63 | 46 / 46 | 0.30 / 0.25 | 2.7 / 1.9 | 1125 / 1494 | 3.30 / 3.75 | 13 / 15 | 1.56 / 1.43 | 2.7 / 2.6 |

### Runoff per round (greedy, new pool / current 77)

| round | water | hydrogen | carbon dioxide | acid fumes | ammonia | sulfur | trimethylamine |
|---|---|---|---|---|---|---|---|
| 1 | 2.83 / 2.57 | 1.95 / 3.07 | 1.60 / 2.85 | 0.00 / 0.00 | 0.00 / 0.00 | 0.00 / 0.00 | 0.00 / 0.00 |
| 2 | 2.88 / 2.48 | 1.70 / 2.64 | 1.55 / 2.45 | 0.00 / 0.00 | 0.00 / 0.00 | 0.00 / 0.00 | 0.00 / 0.00 |
| 3 | 3.07 / 2.63 | 2.85 / 2.69 | 2.03 / 2.57 | 0.00 / 0.00 | 0.00 / 0.00 | 0.00 / 0.00 | 0.00 / 0.00 |
| 4 | 3.57 / 3.69 | 2.25 / 1.96 | 1.27 / 1.51 | 0.04 / 0.05 | 0.05 / 0.07 | 0.29 / 0.26 | 0.20 / 0.09 |
| 5 | 3.86 / 4.24 | 2.50 / 2.33 | 1.36 / 1.20 | 0.08 / 0.07 | 0.08 / 0.05 | 0.37 / 0.32 | 0.15 / 0.10 |
| 6 | 4.14 / 4.82 | 2.24 / 2.47 | 1.45 / 1.15 | 0.07 / 0.03 | 0.07 / 0.06 | 0.26 / 0.49 | 0.21 / 0.20 |
| 7 | 3.66 / 4.06 | 1.67 / 1.86 | 1.08 / 1.02 | 0.28 / 0.21 | 0.30 / 0.48 | 0.39 / 0.65 | 0.21 / 0.14 |
| 8 | 3.55 / 4.01 | 1.52 / 2.05 | 0.89 / 1.00 | 0.31 / 0.25 | 0.30 / 0.30 | 0.55 / 0.83 | 0.21 / 0.08 |
| 9 | 3.65 / 4.27 | 1.78 / 1.92 | 0.84 / 0.90 | 0.47 / 0.09 | 0.32 / 0.34 | 0.48 / 0.87 | 0.22 / 0.18 |

Runoff per round with random eights

| rounds | water | hydrogen | carbon dioxide | acid fumes | ammonia | sulfur | trimethylamine |
|---|---|---|---|---|---|---|---|
| 4-6 | 2.14 / 2.32 | 0.71 / 0.70 | 0.31 / 0.35 | 0.27 / 0.26 | 0.25 / 0.20 | 0.48 / 0.73 | 0.21 / 0.10 |
| 7-9 | 2.47 / 2.69 | 0.86 / 1.05 | 0.32 / 0.31 | 0.90 / 0.76 | 0.27 / 0.24 | 0.58 / 0.93 | 0.19 / 0.17 |

### Motifs present at the start, % of molecules (new pool / current 77)

| round | sugar | resonance | arene | ring | fusion | cage | spiro | acid | amine | sulfur | branch | chain |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 46 / 69 | 33 / 16 | 8 / 16 | 42 / 24 | 0 / 0 | 0 / 9 | 0 / 0 | 0 / 0 | 12 / 0 | 4 / 0 | 54 / 60 | 29 / 21 |
| 2 | 62 / 70 | 38 / 16 | 12 / 16 | 46 / 24 | 0 / 0 | 0 / 9 | 0 / 0 | 4 / 0 | 12 / 0 | 12 / 0 | 58 / 64 | 21 / 19 |
| 3 | 75 / 70 | 46 / 16 | 21 / 16 | 50 / 24 | 8 / 0 | 4 / 9 | 0 / 0 | 12 / 0 | 8 / 0 | 4 / 0 | 62 / 66 | 42 / 19 |
| 4 | 62 / 79 | 71 / 20 | 21 / 16 | 54 / 24 | 17 / 0 | 17 / 9 | 17 / 0 | 8 / 0 | 33 / 0 | 8 / 0 | 67 / 68 | 46 / 20 |
| 5 | 67 / 90 | 54 / 25 | 21 / 16 | 54 / 24 | 21 / 0 | 17 / 9 | 17 / 0 | 8 / 0 | 38 / 0 | 12 / 0 | 83 / 62 | 54 / 37 |
| 6 | 83 / 100 | 71 / 32 | 17 / 16 | 58 / 24 | 17 / 0 | 17 / 9 | 17 / 0 | 21 / 0 | 33 / 0 | 25 / 0 | 83 / 58 | 50 / 58 |
| 7 | 88 / 95 | 54 / 26 | 33 / 16 | 54 / 24 | 17 / 0 | 17 / 9 | 21 / 0 | 25 / 0 | 38 / 0 | 8 / 0 | 79 / 61 | 67 / 56 |
| 8 | 79 / 87 | 75 / 18 | 25 / 16 | 58 / 24 | 17 / 0 | 17 / 9 | 17 / 0 | 29 / 0 | 33 / 0 | 12 / 0 | 75 / 52 | 75 / 60 |
| 9 | 88 / 89 | 42 / 16 | 17 / 16 | 58 / 24 | 17 / 0 | 17 / 9 | 21 / 0 | 25 / 0 | 42 / 0 | 12 / 0 | 75 / 58 | 71 / 54 |

### A new player's first three rounds (six reagents; ring and dry only)

| round | steps a turn | turns with no step % | ring fires % | dry fires % | greedy yield | look-ahead yield |
|---|---|---|---|---|---|---|
| 1 | 1.98 / 2.28 | 1 / 2 | 86 / 98 | 73 / 46 | 404 / 483 | 546 / 548 |
| 2 | 2.16 / 2.27 | 1 / 1 | 94 / 99 | 70 / 45 | 447 / 479 | 562 / 568 |
| 3 | 2.05 / 2.30 | 3 / 1 | 90 / 99 | 67 / 49 | 426 / 489 | 530 / 559 |


### Specs

Kept specs the table lists, how many can be offered on a third of the molecules, and the clear rate of the offers for a new player (rounds 1 to 3) or a middling one (4 to 9):

| round | kept specs listed | offered on a third of molecules | offered on at least one | offers per molecule | clear rate, new or middling player % | aiming player % | yield-only player % | target |
|---|---|---|---|---|---|---|---|---|
| 1 | 13 | 13 | 13 | 11.8 | 73 | 95 | 19 | 0.75 |
| 2 | 12 | 12 | 12 | 10.7 | 57 | 89 | 12 | 0.65 |
| 3 | 12 | 12 | 12 | 9.9 | 61 | 92 | 16 | 0.55 |
| 4 | 11 | 10 | 11 | 7.4 | 80 | 89 | 37 | 0.90 |
| 5 | 12 | 12 | 12 | 8.6 | 83 | 91 | 42 | 0.87 |
| 6 | 16 | 14 | 16 | 10.3 | 82 | 92 | 36 | 0.81 |
| 7 | 18 | 16 | 18 | 10.5 | 77 | 89 | 38 | 0.78 |
| 8 | 18 | 16 | 18 | 9.8 | 75 | 89 | 39 | 0.73 |
| 9 | 13 | 11 | 13 | 7.6 | 81 | 93 | 42 | 0.68 |


All 24 of 24 kept specs can be offered on at least a third of the molecules in some round. Clear rates for a new or middling player are within 0.10 of the targets, except round 9 (0.81 against 0.68). The yield-only player clears far fewer than the aiming player (12 to 42 percent against 89 to 95), as intended.

## 6. Against the targets

| target | result |
|---|---|
| every reagent has something to act on, from the round it can be held | met. Lowest in rounds 1 to 3: reduce 36, dehydrate 57. Lowest in 4 to 9: hofmann 29 to 35, reduce 35 to 39, hwe 46 to 53 (the 77: 0, 12 and 2, and hwe higher at 64 and 79) |
| every reflex fires at a healthy rate | met for ring, dry, shift, weld, snap, tuck, seal, knit, cap, close. Thin: open 5, fold 7, flip 3 to 5 |
| no reagent in the best line more than about 70 percent | NOT met. Rounds 4 to 6: ozonolysis 81, hydroformylation 77, grow 74, oxidize 73. Rounds 7 to 9: epoxidation 87, ozonolysis 80, grow 72. With random hands: epoxidation 83, ozonolysis 78, grow 73. The 77 are the same or higher |
| oxidize | 72, 68, 74, 75, 74, 71, 62, 64, 64 percent of turns by round (the 77: 81, 78, 77, 80, 77, 73, 64, 65, 63). Down 2 to 10 points in rounds 1 to 6, level in 7 to 9, and only round 2 is under 70 in rounds 1 to 6 |
| every jar's runoff can be made | met from round 4. Ammonia is 0.05 to 0.08 a round in rounds 4 to 6 (the 77: 0.05 to 0.07) and sulfur is lower than the 77 in rounds 6 to 9 |
| every motif turns up | met from round 4 (sulfur bridge in every round, fused, cage, spiro from round 3 or 4). Rounds 1 and 2 hold no fused, cage or spiro rings on purpose |
| kept specs can be offered | met, 24 of 24 |
| molecules in one round not wildly unequal | spread of yield between molecules (sd over mean) 0.18 to 0.31, the 77: 0.19 to 0.30. Round 9 is wider (0.30 against 0.25; p90 over p10 2.7 against 1.9) |
| first three rounds simple | steps a turn 2.0 to 2.2 (the 77: 2.3), nothing to fire on 1 to 3 percent of turns. Round 1 has 12 chains, 10 single rings, 2 benzene rings, and 4 molecules with N, S or Cl. Dry fires on 67 to 73 percent of turns against 46 (too dry-heavy, see section 7) |
| clearly different kinds in a round, so a choice of two is a real choice | six shapes from round 4 (four each), plus 4 to 6 near-relatives of real compounds and 1 to 4 real compounds a round |
| planning pays | look-ahead yield over greedy yield is 1.24 to 1.96 (the 77: 1.13 to 1.65), more in every round but 8, where they are equal |

Reading the first row of the round table: the new molecules pay less. Greedy yield against the 77 is 84, 93, 87, 86, 80, 79, 75, 82 and 75 percent by round. Look-ahead yield in rounds 1 to 3 equals the 77's (546, 562, 530 against 548, 568, 559), so what the new molecules take away from a greedy player is given back to a planner.

## 7. What still cannot be fixed by molecules

For the reagent and reflex owners. Each has a number and a cause.

1. Oxidize is in the best line on 68 to 75 percent of turns in rounds 1 to 6. It is the only one of the starting six that makes a C=O except grow-then-oxidize, and ring, dry, weld and tuck all need a C=O. Pools full of keto-alcohols moved it from 97 percent (REAGENT_STATS) to the 70s and no further; designer 3 found the lowest tenth of about 3000 candidates still at 66 to 71. Designer 3 also measured that taking the chain-end C=C clause out of oxidize lowers it to 66 to 70 in rounds 1 to 3 and 48 to 57 in rounds 7 to 9, with yield 9 to 16 percent lower in rounds 1 to 3 (their run, not repeated here). A second C=O maker in the starting hands of rounds 4 to 6 (hwe or ozonolysis in every pair) also lowers it, to about 63.
2. Ozonolysis (80), hydroformylation (77 in rounds 4 to 6), grow (72 to 74) and epoxidation (87 in rounds 7 to 9, needed on 78 percent of turns): each feeds weld, ring, open or fold in one move. Epoxidation is the only maker of the epoxide that open and fold use. Letting fold or open also take epoxides from other routes, or limiting fold to once a turn, would bring it down.
3. Permanganate, thiolene, chlorination and epoxidation are needed on 0 to 2 percent of turns in rounds 4 to 6 (best line 21 to 28 percent). The reflexes that use their products (cap, close, seal, open, fold, knit) are held only from round 7. Hold them from round 4, or draw the rounds 4 to 6 pairs only from reagents whose product has a held reflex.
4. Flip fires on 3 percent of turns in rounds 4 to 6 and 5 in rounds 7 to 9. It needs an OH on a C=C, and only dihydroxylation then dry makes one. Let dehydrate on a diol make the enol, or widen flip to any C=C beside a C=O.
5. Open (5) and fold (7) and close (7): close needs a Cl and a partner three to five carbons away and a Cl only appears if chlorination was fired. Widen close to two to six carbons, and let open take an epoxide three to five from the OH.
6. Dry fires on 67 to 73 percent of turns in rounds 1 to 3 (the 77: 46) because any OH two carbons from a C=O dries. Taking those OH out of the early pool would leave ring as the only reflex. If the owner wants a wider mix in rounds 1 to 3 the fix is a third early reflex (shift or tuck), not a different molecule.
7. Ammonia comes only from the cyanohydrin route (0.05 to 0.08 a round in rounds 4 to 6). Let Ritter or knit send a little ammonia. Dehydrate and chugaev can act on fewer of the new molecules (64 and 76 percent against 90 and 88 for the 77) and hwe on fewer (46 and 53 against 64 and 79): they like plain chains with an OH and a methyl ketone, which the new shapes have less of. Sulfur from chugaev is lower than in the 77 in rounds 6 to 9 (0.26 to 0.55 against 0.49 to 0.87) because the new molecules have fewer plain OH groups for chugaev to take.
8. Reduce is in the best line on 28 to 39 percent of turns but needed on only 5 to 8: it removes the C=O that ring wants. Make it leave the C=O it was needed for, or add a reflex that needs CH2-OH.
9. Tuck (12 against 19 to 21) and weld (36 to 48 against 50 to 58) fire less than on the 77, because rings and branches block chain runs. This is a price of the more interesting shapes, not a fault.
10. Turns with nothing to fire are 13 to 17 percent in rounds 4 to 9, the same as the 77 (12 to 18).

Things I could not do or did not check: the owner's marks, instruments and homunculi are not in these numbers; motif pay is not in the engine's yield; I did not look at how the molecules draw (a 35-atom cage with four arms may be hard to read on screen); the late-round made-up molecules are crowded with groups (round 9 has several with 6 to 9) and a human should look at them.

## 8. For the game builder

**How the new table replaces the FEED table in path.js.** Today `FEED` is `['family', 'SMILES']` rows, `KIN_OF[smiles]` gives the family, `feedsFor(kin, round, skip)` takes the rows whose letter count (`feedSize`) is within `FEEDSIZE.near` (3.5) of `FEEDSIZE.rounds[round-1]`, and `draw()` picks a family from the family odds (`FAMILY_ODDS` in molecules.py: chain, ring, arene, sugar, cage). The new rows in `molecules2_feed.js` are `[round, family, SMILES]` with aromatic rings written in Kekule form, the way FEED_ARENE already writes them. Two ways to use them:

1. Keep the size rule: push `[family, SMILES]` into `FEED` and set `FEEDSIZE.rounds` to `[11, 12.8, 14.6, 17, 20, 23.5, 27.5, 31, 33.5]`. The pool sizes then fall in the right round (the windows overlap on purpose, so a molecule can be dealt in two neighbouring rounds).
2. Better: add the round to each row and have `feedsFor` filter on it. Then the round is exact and the sizes do not matter.

Either way: remove the `FEED_HET`, `FEED_ARENE`, `FEED_HET_RING` interim block and the `AA.rxFeedOld` switch, and drop the `sugar` family (the 77's sugars are gone) or fold it into `chain`. The families in the new rows are `chain`, `ring`, `arene`, `fused`, `cage`, `spiro`. Either teach `draw()` the three new ones or map `fused` and `spiro` to `ring`. Shape counts per round are in the table in section 2; from round 4 they are four each.

**Not at the right spot yet: the rounds 1 to 3 filter.** `RULE.filter` (`FILTER_UP_TO = 3` in molecules.py) rejects shapes that cannot cascade (two OH and no C=C, one C=O and no C=C, or only one kind of group). Six round 3 molecules fail it: `OCC(O)COc1ccc(Cl)cc1`, `CC(O)CCC(=O)CCCC(C)(C)O`, `CC1(C)C2CCC1(CCCO)C(=O)C2`, `CC(C)(CO)C(O)C(=O)NCCC(=O)O`, `CC(O)CCCC(=O)CCCC(C)(C)O`, `CC1=CCCC(C)=CCC(C)(C)C=CC1`. They pay 370 to 445 in the engine, so I left them in. Either loosen the rule for round 3 or drop these six.

**What the molecule model must read.** Everything below is used in the 216 molecules; check each against the JavaScript model, which I did not open:

| thing | used |
|---|---|
| atoms | C, N, O, S, Cl. N is in 63 molecules, S in 31, Cl in 20. No other element, no charges, no isotopes, no stereo marks, no explicit H |
| bonds | single, double, aromatic (benzene and biphenyl rings; carbon only, never an aromatic N, O or S). No triple bonds. In Kekule form the aromatic bonds become alternating single and double |
| rings | sizes 3 (epoxides), 4, 5, 6, 7. Fused (two rings share a bond: decalin, hydrindane, indane, tetralin, steroids), spiro (two rings share one atom), bridged cages (norbornane, bicyclooctane, adamantane, pinane, cubane in three molecules, tropane, quinuclidine, oxanorbornane), up to 7 rings in one molecule (the cubane ones) |
| groups | OH on sp3 carbon, phenol OH, ketone, aldehyde, C=C (chain-end, inside a chain, conjugated, up to 6 in one molecule), COOH, primary NH2 on sp3 carbon (48 molecules), secondary and tertiary amine (14), thiol SH (12), thioether C-S-C (24), Cl on sp3 carbon (19), epoxide (7), ether C-O-C (21), methoxy (6), amide (4), ester and lactone (1), alpha-keto acid (4), no disulfide, no nitro, no nitrile |
| size | 10 to 35 heavy atoms |

The reagents need nothing new: the engine in this folder already runs all of it, and test_engine.py covers each reaction. The drawing needs to place N, S and Cl labels and draw benzene, fused, spiro and cage layouts; the families and tags the game needs are: family (6 values), kind (real compound, near-relative, made up, kept from the 77), name, round, and for the page the motifs and groups shown in section 3 (the engine's `traits.counts` and `hurdles.feat` recompute them from the SMILES, so they need not be stored).

**Marks.** The new molecules pay less than the 77: greedy yield is 84, 93, 87, 86, 80, 79, 75, 82, 75 percent of the 77's by round (section 6). Multiply the round marks (stable, unstable, volatile, overreact) by those numbers, or by 0.8 if one number is wanted. The spread between molecules is the same, so one scale per round is enough.

**Endless play.** The generator needs RDKit, so it runs in Python only. A browser build should either ship `molecules2_bank.js` (360 generated molecules, 40 a round, each a family and a Kekule SMILES, none in the pool) and deal from the pool and the bank with the `P_POOL` odds, or run the generator on a server. I measured 100 fresh generator draws a round (section 4), not the 360 in the bank one by one.
