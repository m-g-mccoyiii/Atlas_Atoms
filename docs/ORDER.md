# Overreact: the order of work

Set by the owner 2026-11-11: foundations first, then up. Every later layer and unlock must enhance the foundational gameplay. Nothing higher is built on a layer that has not passed review.

A layer passes when its gates in `PASS.md` are met on the current rules and a reviewer who was not told what changed passes it.

| # | Layer | What it is | Sections of PASS.md | State |
|---|---|---|---|---|
| 1 | The turn | three reactions lined up and fired, the rings close by themselves; a turn is a small puzzle with no creature, helper or unlock | 2 | passed narrowly on old measures; to be measured again |
| 2 | The page | every element on the round page understood by a first-time player, no sentences, nothing overlapping, none of the rejected looks | 5 | failed |
| 3 | The chain reaction on screen | the rings closing is the thing worth watching | 4 | passed narrowly |
| 4 | The round and the run | tier 1: a run of three rounds on the six starting reactions is tense, and a new player wins it within a few tries (see Tiers in LOOP.md) | 1 | failed: rounds 1 to 3 far too easy |
| 5 | Between rounds | choosing the molecule, the pick of one from three, coins with something to buy | 1, 2 | built; coins have no sink |
| 6 | Between runs | a lost run shows what was earned; the next thing to earn is seen with its count | 6 | failed: not built |
| 7 | Helpers | each one enhances layer 1: it changes what three reactions the player wants to line up | 3 | 5 live, 3 weak alone; 8 more designed |
| 8 | Creatures | each one enhances layers 1 and 4: it changes how a round is planned | 3 | 8 built, barely measured |
| 9 | Kits, the book, stakes | reasons to start a different run | 6, 7 | designed |
| 10 | More kinds of chain reaction, more molecules, sigils | | | not started |

## The test for anything above layer 4

Before it is built, say in one line which foundational decision it changes: which three reactions to line up, in what order, on which page, or on which molecule. If it changes none, it is a plain bonus and is not built.

## What this changes now

Layers 1 to 4 are worked and reviewed with every helper and creature switched off, on the six starting reactions. Work on layers 7 and up stops until 1 to 4 pass: no new helpers, no ammonia or brimstone, no bench art. What is already built above layer 4 stays in the code behind its switches.

## The build path, as told to the owner 2026-11-11 (this replaces the table above where they differ)

1. The chemistry engine: any molecule as SMILES, every reaction exact, in RDKit (`docs/tools_chem/`). Being built.
2. The reactions as one set: the ones the player fires (about 19) and what the molecule does by itself (about 12), tuned together on the engine. Being worked.
3. That set goes into the game, replacing the 10 reactions and 3 self-reactions there now.
4. The first three rounds on the six starting reactions: tense, a clear page, sound. Being worked in the game.
5. Helpers, retested on the engine against the new set; unlocked by deeds, bought with coins.
6. Creatures, retested on the engine; jars and feeding.
7. Rounds 4 to 9, balanced with helpers held, then with a creature too.
8. Between runs: what was earned, what is next, kits, real compounds.
9. Polish. Then the owner plays. Every step is reviewed by a fresh reviewer before the next is built on it.

## Open with the owner

- **Sigils.** What a sigil does and what it transmutes is not decided (the owner, 2026-11-11: "Don't forget sigils which we haven't decided they do or what they transmute as"). Fixed so far: a later layer earned by play, one per run, drawn under the molecule as a circle of thick hand-drawn lines, fills as the molecule changes, then does something nothing else can. Three complete options are being designed and tested on the chemistry engine for the owner to choose from. Nothing about sigils is built until that choice is made.
- Whether part of a molecule carries into the next round.
