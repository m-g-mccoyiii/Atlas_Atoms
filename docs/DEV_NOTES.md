# Overreact: notes for whoever works on the code

Read this before changing anything. Then read `EVALUATOR_BRIEF.md`, `ARC.md`, `EVALUATION.md`, `BALANCE.md`, `ENGINES.md` and `PASS.md`.

## Hard rules

- Work only in `C:\Work\atlas-atoms` on branch `steam`. Never commit to `main`. Never touch the deployed site.
- Commit with `git -c user.name="m-g-mccoyiii" -c user.email="m.g.mccoyiii@gmail.com" commit`. Do not change git config. End every commit message with `Co-Authored-By: Claude <noreply@anthropic.com>`. Push to `origin steam` after every commit.
- Do not download any file. Everything shipped must be licensed for commercial use.
- Vanilla JS globals on `AA`, Three.js r128, Canvas 2D, Web Audio, localStorage. No node, no build step. The page has a CSP that forbids inline scripts.
- Any edited script or css needs its `?v=N` bumped in both `apps/steam/scheme.html` and `.claude/rec.html`.
- American spelling.

## The owner's taste, which decides what passes

- A fun, insane, fast game. Not textbook-like. Not like cheap mobile game ads.
- Words on a game screen are names, numbers and short tokens. No sentences. Only instructions may be wordy. No quips, no ominous hints, no second-person labels.
- No multiplication signs, middle dots or em dashes in text.
- UI is objects. Menus are full game screens, never a dialog with titled boxes.
- Rejected looks: dark navy, uppercase letter-spaced mono labels, serif headings, glow accents, flat signage, hard rectangles, cards like Balatro's, yellow pills and banners added for excitement, pulsing buttons, bursts, particle balls, check marks.
- Do not restyle the ball-and-stick molecule. Never put faces on atoms.
- Every new layer is unlocked by play. Nothing later than the player's stage is shown.
- No timers, login streaks or paid currency. No daily challenge.

## Files

| File | What it is |
|---|---|
| `apps/steam/js/react/path.js` | all rules: `AA.rxPath`. Scoring (`scoreRound`, `synTake`, `peek`), dealing (`synDeal`, `redraw`), chains (`charged`, `fire`, `chainOpts`, `chainNext`), the bank (`canBank`, `bank`), the switches for the rules of a round (`RULE`), runs (`runNew`, `runPicks`, `runTake`, `runBriefs`, `runChoose`, `runQuota`, `runTerm`, `deeds`), the simulated player (`synPlay`), tables `GEARS`, `SUPPLY`, `FEEDS`, `KIN`, `BRIEFS`, `TERMS`, `CIRCLE`, `BASE` |
| `apps/steam/js/react/rules.js` | reaction cards: `AA.rx`. Each card has `find`, `ok`, `apply` |
| `apps/steam/js/react/scheme.js` | the page: `AA.rxScheme`. Three.js scene, the ink canvas drawn in `drawInk`, modes `terms`, `pick`, `brief`, `play`, `move`, `fuse`, `done`, `shop`, saved `meta` (credit, tier, stage, sig) |
| `apps/steam/js/react/kitart.js` | 3D models of the sixty pieces from primitives: `AA.rxKit` |
| `apps/steam/js/react/pen.js` | the game's own lettering, drawn as strokes. `?font=classic` turns it off |
| `apps/steam/scheme.html` | the game page |
| `.claude/rec.html`, `.claude/rechelp.js`, `.claude/simhelp.js`, `.claude/sim.js` | recording and measuring page, not shipped, not in git. `sim.js` is the measuring rig; its versioned copy is `docs/tools_sim.js` |

## How to change code safely

These files have very long lines. Do not rewrite them. Write a small Python script with the Write tool into the scratchpad that does exact-string replacement with a count assertion, then run it:

```python
def rep(s, a, b):
    assert s.count(a) == 1, (a[:70], s.count(a)); return s.replace(a, b)
```

Heredocs with nested quotes fail in this shell; a script file does not.

## How to see the game

- A preview server serves the repo at `http://localhost:8766`. The game is `/apps/steam/scheme.html`. The recording page is `/.claude/rec.html?name=none&r=<any number>`.
- A frame server on port 8767 saves POSTed frames as `fNNNNN.jpg` into the scratchpad `frames` folder. If nothing is listening there, start `recsrv.py` from the scratchpad in the background.
- In the recording page: `await recClip(base, '', {feed, kit, rack, by, term}, n)` plays n reactions and saves every frame from number `base`; `recStill`, `recTick(ms, {base, label, i})`. `window.__fast = true` speeds the player. `window.__nopost = true` runs without saving frames.
- Resize the browser to 1280 by 720 before recording and only reset it after the recording has finished.
- The browser's JavaScript tool times out near 45 seconds. For long work, do it in chunks of about 22 seconds, one call per chunk. Background timers in the pane are throttled to about one a minute, so never rely on `setTimeout` loops for long jobs.
- `AA.rxScheme.debugStage(n)`, `debugTerm(i)`, `debugKit(ids)`, `debugRack(ids)`, `debugFeed(smiles)` set up a state. `AA.rxScheme.meta` is the saved progress.
- To measure: `AA.rxPath.synPlay(feed, rnd, gear, run, 'greedy')` plays one round and returns the total. Pass a seeded `rnd` so two measurements see the same deals. `docs/MATRIX.md` was made this way; the script that builds it is `matrix.py` in the scratchpad.
- To measure whole runs: `runSim(player, seed, opts)` and the rest of the rig, in `.claude/sim.js` (copy in `docs/tools_sim.js`). `docs/RIG.md` says how. `opts.rule` overrides `AA.rxPath.RULE` for one run, so a rule can be measured on and off on the same seeds; `opts.dec` logs how much of a choice each turn was. `python docs/tools_round.py <tag> <first> <last>` prints the spread of a round and the turn measures.
- Never start `simGo` or `simPart` in a tab where one is still running: the two fight over one job and neither ends. Reload the tab first.
- `AA.rxScheme.bank()`, `redraw()` and `turn()` do what the three new marks do. `state()` reports `fork`, `canBank`, `canRedraw`, `stuck` and `left`. `AA.rxPath.seed(n)` seeds every draw on the run path; `AA.rxScheme.debugRound(n)` jumps the page to a round.
- The page is lined up and fired: `AA.rxScheme.pick(i)` places slot i of the hand in the next circle, `unqueue(k)` takes circle k back (-1 for the last), `bank()` places the bank token, `fire()` fires. `state()` reports `queue`, `will` (what each queued thing will do), `lining`, `casc`, `coins`. On the take-one page `reroll()`, `skip()`, `bin(i)`. `recQ(base, opts, pages, plan)` in the recording page records pages lined up and fired. Never take a screenshot of the recording page: it runs the page's own clock against the recording clock and the view breaks.
- Judge whole frames, not crops. Look at what you built before saying it works.
- **To design a molecule or a reagent, do not play runs.** `AA.rxPath.screen(smiles, pool, kinds)` works a cascade out from the structure alone in about 25 ms: the steps as dealt, the best line of three, the best from every deal of five. `screenRound(smiles, pool, kinds, rnd)` plays three pages. In the recording page `scrTable(pool, kinds, n, ms)` runs every molecule as rounds deal them and prints the share of pages with 1, 3, 6 and 10 steps; call it again until it stops answering `left`. `cascBox(list)` gives the steps as dealt for a list of `[family, smiles]`. Whole runs are for the number to beat and the pass-rate table only. `python docs/tools_casc.py <tag> <first> <last>` prints the cascade lengths in a measure.
- A measure of 500 runs for each of the four players takes about 25 minutes over eight tabs now: the median player tries every line of the hand. Keep the tab you are looking at idle while it runs.
- Pieces are used on the molecule (`PIECES.md`): `AA.rxScheme.toolArm(id)` picks one up, `st.toolList` holds the places, `toolPeek(i)` shows one, `toolUse(i)` uses it. `AA.rxPath.toolSpots`, `toolUse`, `toolGo`, `toolWorth`, `toolBest` are the rules; `RULE.five = false` brings all sixty old pieces back. The five are mirror, seed crystal, magnet, burner and burette; `AA.rxPath.fifthSet('balance')` or `'mortar'` swaps the fifth for a candidate that was built and not chosen. A piece that drives something off returns it as `leaving` and the page flies it away (`g.reopened.gone`, `flyer` in scheme.js). In the recording page `recTool(base, feed, kit, id)` records one piece used at its best place, `toolTable(mols, sets)` reads pieces off the structure (steps as dealt), `toolLine(mols, sets)` starts a job that reads the best line of three reagents after the pieces (`lineStat`, `lineRows`), `toolRound` plays a round with them. A real click on a piece must land on its foot or its name, not its top. The simulated players use pieces through `useTools(g, rnd, mode, only, pageOf)` in `sim.js` (modes `read`, `plan`, `best`, `random`); `SIM.toolStat` counts what was held, proposed, dropped and used. In `toolRound(smi, seed, gear, how)` pass `'read'` or `'random'`, and compare with the same gear and no `how`, not with no gear.
- Layout is checked by number, not by eye alone: `AA.rxScheme.debugShape(smiles, { tool, spot, zips, show })` lays a molecule out (after a piece or some zip steps if asked) and returns the worst bond length over the normal one (`worst`), the nearest two atoms that are not bonded (`near`, in bond lengths), the box (`w`, `d`), the box before it turned back (`uw`, `ud`), the radius of the turn (`fr`, 0 when straight) and the scale (`sc`). Sweep every molecule in `AA.rxPath.FEEDS` with it after touching `tidy`, `closeRings` or the turn. `toolWorths()` gives what each place of the piece picked up is worth, `toolGhost()` the mirror's ghost, `debugMorph()` the move being played.
- On the page the go arrow sits after the last circle, so it moves when a piece of equipment adds a circle. Read where it is from a screenshot before clicking it.

## What is known to be wrong

See `EVALUATION.md` and `RIG.md` ("What is still wrong, found in this measure"). In short: a round is bounded now (32 heavy atoms, a chain of six, two loops, three uses a reagent) and its spread is 9 to 34 times where it was hundreds, but 59% of passed rounds are still passed by more than five times and the last page decides 28%; molecules in the same round differ by 3 to 8 times; kinds of round differ by 9 times and a scarce round is far the hardest; a turn has a second option worth taking in 53% of the median player's turns, which is just over the gate; the bank wins on seven builds in ten and may be too good; levels on multiplying pieces make the top of late rounds; the worth tables the simulated players pick by are stale; two thirds of piece pairs do not interact; twelve pieces are dead and seven harmful (measured under the old rules); the overreact chain is not a spectacle; the page has rejected looks (navy ink, yellow pills), and product thumbnails at the right edge can be cut by the frame.
