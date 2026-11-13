# Page notes (builder of the page, 2026-11-11)

Branch `worktree-agent-a1738abd5583b0bf2`, cut from `steam` (the worktree first came up on main; it was reset to steam before any work).

## Changed

- Words at the flags: `stable`, `unstable`, `volatile`, `overreact` are lettered in pen.js as the total passes flags 1 to 4, written left to right, sizes 64, 92, 128, 172. The biggest one reached stays at the old "beaten" place (top middle) at round end. A missed round shows the number short and no word. "beaten" is gone, also from the lost-round line. The old `overreact` callout at set-off is removed so the name is seen only at flag 4.
- Sound: `AA.sfx.flag(k)` at each flag, `queue(i)` on placing a reaction or the tray, `fire()` on the go arrow, `ring(n)` on ring n of a row (the per-beat `lock` no longer plays in a cascade), `wasted()`, `pageTurn()`, `lost()`. The foundation `sfx.js` (53cbfa3) is cherry-picked in; `?v` bumped. Old `over()` is no longer called.
- Molecule fills the free page: take-one-molecule page (single up to 3.2 times, pair up to 2.4 times, sized to the half page), round end (the middle takes everything under the word, 37 by 14.5 units, eased in), and on the round page the molecule is now centered on its own box inside a lane of 20.4 units so it no longer touches the go arrow or the reaction list.
- Words removed: `times 2` by the tray (tray icon kept as a plain drawer), `0 times 1` and every `N times M` line under the total (not drawn at all in play), the small 1 and 2 on the take-one page. Reaction names under the tokens stay (they are names).
- Gains: loose +numbers are gone in the bare game (the bonus motes are off). Each ring writes its count under the molecule at the ring, and its gain (+805) runs left along the strip under the molecule to the right of the total, clear of molecule, total and multiplier. A reaction on the page writes its gain the same way. The count is no longer the big 2 or 4 at top right.
- Other overlaps: the landed reaction chip now sits above the molecule box and no longer covers the page numbers; the strike through flag numbers is off; the red margin line (the pink diagonal) is removed from the paper; sun shadows are off (the beige blobs under the molecule are gone).

## Seen on the page (1280 by 720, port 8791)

Round start, three reactions lined up, fired (chip flying above molecule, total counting 5, 10, 14), page turn, round end with `stable` and `unstable` and `overreact` (the last on an earlier round), the take-one pages (single and pair). I did not catch a real ring chain on screen: the pane was hidden, timers ran slow and screenshots land late. I checked the ring count and the traveling gain by putting a test ring and gain into `AA.rxScheme.st` and looking at the result: count under the molecule, gain running left clear of everything.

## Not done

- Three empty ovals with an arrow, the C and drop redraw mark, the drops under each reaction, the beige coin pills at the faint flags, the "three pages" hint: not touched. They are objects, but not yet explained without words.
- Ring lit on the molecule: the existing dashed arc stays above the ring; I did not add a light on the atoms. The count and gain are under the molecule, not at the arc.
- Page curl over the reactions list: not seen in my frames, not touched.
- Non-bare pages (equipment, creatures) still use the old gain and formula code paths in part.
- The words have no sound of their own beyond `sfx.flag(k)`.

## For path.js

Nothing needed. If rings carried the atoms of the ring (`o.atoms` of four or more), the arc and count would sit exactly at the ring; today `st.pair` uses atoms 0 and 3 of the step.

## Browser

The one tab I could open (`seed`) was navigated away by another agent to 8792 and 8766 three times; I reloaded 8791 and rechecked each time.

## Second pass (after the merge as c6b53c7)

Branch reset to steam first. Frames are in `C:\Work\atlas-atoms\.claude\shots\page2-1.jpg` to `page2-10.jpg` (1 to 3 and 10: a real ring step, played through the page's own functions and slowed five times with a clock wrapper in the test page only; 4: circles; 5: the pair page; 6: a 34-atom molecule; 7: a lost round; 8: a won round; 9: the single molecule page).

### Done and seen

1. A ring step is seen on the molecule: a short bar under each of the two parts, the new bond drawn closing between them, the count sitting just above that spot, the gain written at that spot, then it drops out under the molecule and runs left to the total. The old dashed arc is gone. Seen on a real chain (round 1, molecule `O=CCCC(=O)CCC(C)(O)CCC=C`, hydrate, pcc, bh3): the count 1, +142, the bond line and both bars. The gain starts on the molecule, so it overlaps atoms for a moment; it does not overlap the total.
2. Circles: an empty one carries its place in the order (faint 1, 2, 3); a placed one is only the color of its reaction (no digit, no waste preview, since the harness says no preview). Click still takes one back (tried with a real click). Dragging one circle onto another calls `AA.rxPath.swapQueue`; it does nothing because path.js has none. Needed: `swapQueue(g, i, j)` or `swapQueue(i, j)` (either is handled by arity), which must swap `g.queue[i]` and `g.queue[j]` and keep the page's view right.
3. Drops under each reaction are not drawn when `AA.rxPath.RULE.usesFree`, `infiniteUses` or `unlimitedUses` is true (checked with `usesFree`; no rule sets it yet; path.js must pick one name). The redraw mark loses its struck drop in the same case. The coin pills at the marks are bigger (copper, solid at the marks that are passed, lighter at the others).
4. Pair page: each molecule at most 2.8 times, sized to its half; the redraw is a turning arrow with its price as coins and the coins held are a stack; the harder one shows its extra coins. No sentences. The title still carries the round's rule word (`assay`, `short`, `2 pages`) when the rules give one.
5. Round end: the word reached, coins as copper coins, the next arrow. A lost round shows the shortfall as a number in red and the coins earned beside it as a stack with its count; "beaten" and "best" are gone. The leftover ring marks no longer show on the end page.
6. A 34-atom folded molecule stays clear of the reaction list, the total and the go arrow (round 9 frame). The label of a round rule (`scarce`, `1 use`) moved to the left column, above the round number, off the molecule.

### Not done or seen but not mine

- The yellow `Pr` beads on a folded molecule (the fold option `bead`) are discs on the molecule. I did not change the default fold.
- Ring 2 and later of a chain: in the slowed test the pane did not draw the molecule while the second ring ran, with the old code as well as the new, so I only have clean frames of ring 1 and of the whole chain at normal speed.
- The word sounds are `sfx.flag(k)` only.

## Third pass

Frames: `.claude/shots/page3-1.jpg` (pair page with two hurdle marks), 2 (ring 1 frozen on a real chain: count under the molecule, thin line from the spot, bond closing, bars), 3 (atoms plain, tracer marks as bars), 4 (round 9 folded molecule, no discs), 5 (round page with a hurdle mark at top left), 6 and 7 (ring 2 frozen; crowded, see below).

- Count and gain now stand under the molecule outline at the x of the spot, joined to it by a thin pencil line; the gain runs left along that strip. Page gains and ring gains have two fixed lanes. Seen on ring 1. On ring 2 (page3-6, 3-7) the strip is tight when the molecule is low on the page: the count and a gain still touch the track flags in those frames. Not solved; the audit's fixed gain lane is the next step.
- Blue, orange and magenta atoms were not element colors: they were tracer (isotope) tints on atoms with `iso`. Atoms are no longer recolored; each such atom gets a short bar of the tracer color on the paper under it, and in the bare game the bars are not drawn at all.
- The yellow `Pr` discs are gone: the default fold is now `none`, so every atom is drawn.
- Rule words (`assay`, `short`, `2 pages`, `scarce`, `1 use`) are off the pair page and the round page. `drawHurdle(g, cx, cy, hurdle)` draws a named hand-drawn mark and a count from the table ring, joined, big, cage, size, kinds, water, chain, few, with a small caret for at least (up) or at most (down; `few` always). It runs when `b.hurdle` is on a brief (pair page, beside the flag) or `g.hurdle` or `st.hurdle` is set (round page, top left). Absent: nothing is drawn.
- Guards kept: `AA.rxPath.swapQueue` (drag a circle onto another) and `RULE.usesFree` (drops hidden).
- Test method: the pane draws the molecule badly when the page clock is slowed (the molecule scales in again after every step), so frames of a chain were taken by freezing the page clock a set time after a ring began.

## Round 7 (stage, spec, run length, end screens)

- Stage: the molecule sits in a band across the top, about 55 percent of the canvas width (page7-1), the left stack and the list below and beside it, the list at the far right with its fragments smaller, the next five shown as small pairs left of the list (RULE.next), the redraw mark at the bottom of the list, the word at the very top. The gain lane runs along the line of the total, from under the molecule to the total, with its dotted rule. Use marks are hidden when `P.usesFreeOn(run)`.
- Coin: `coin` and `rcoin` now call `AA.rxKit.drawCoin`. The 3D coin and the jars are not yet used.
- Spec: `drawHurdle` takes `{kind or mark, n, value, met}` from `g.spec`, `b.spec` (pair) or `st.hurdle`: the mark, the count, a ruled line drawn to value over n, and the whole in green with a heavier line when met (page7-2, page7-3). At the top right of the round page and beside each molecule on the pair page. New mark names must be added to the `HURDLE` table.
- Run length: `newRun` passes `{ tierNo: meta.reach }` (1 first, so three rounds); winning a run sets `meta.reach` one higher up to 3; the last round is `P.runLast(run)`.
- End screens: the round end and the run end show the word reached, the coins dropping in one at a time (the single coin), one flag per round of the run (green for beaten), `next` or `new run`. Seen won (page7-4) and lost (page7-5).
- Test hook: shot.js takes `round`, `quota`, `lose`, `end`, `pre`, `spec`, `next`, `free` in the address.
- Not done: the jars and creatures with the new kitart calls, the 3D coin, the left stack still draws on the end screens, the multiplier object, the ink stroke to what a change sets off.


## Second builder

Branch `worktree-agent-a91f980f51482bfbf`, reset to `steam` first. Frames are in `C:\Work\atlas-atoms\.claude\shots` (`page9-*`, `paper-*`). Test rig: `?shot=x&script=/dev/<file>.js` in shot.js loads a script that defines `window.SHOT({ S, P, run, save, now, base, q })` and drives the page on the hand-stepped clock; the files are in `dev/` (`s1.js` jar screen, `s2.js` bench, `s3.js` round page with a homunculus and three instruments, `paper.js` the three frames for a paper look). Frames are posted to a local server that writes them (a Python static server with a `/__save` and a `/__log` route; not in git). Run one Edge at a time: three at once lost frames and a script.

### Done and seen

1. Jars and homunculus (`page9-jar-1` to `-5`). The screen before a run is the kit's shelf with the kit's jars (`AA.rxKit.jar`) at their saved fill and growth (speck, half grown, ready). A jar not yet seen is absent. One outline jar stands after the last, with a drop and the count it takes (50 in the frame). Picking up a ready jar lifts it, its homunculus steps out and walks to the place beside the stage, and the run begins with it. A jar that is not ready shakes. No word "none": the notebook object at the lower right starts the run with no homunculus. Names show on hover. The screen is shown only to a run that has creatures (`run.noHom` false, tier 3); the corner jars on the round page now use the kit's jars too, without the "n/N" text. Ammonia and brimstone are in the color and id tables (`JARC`, `JARINK`, `HOMID`); `JAR.full` has no entry for them and `homOn` leaves them out, so no jar for them shows yet.
2. The homunculus in play (`page9-play-2`, `-3`). It stands at the lower right beside the stage with the kit's model; the pose hook leans it by how fed it is, stretches it tall and reaches when it is ready, and `poseToward` reaches it toward the place when it is set off. How fed it is: the drops under it, filled or empty (as before; no number). Seen: standing, not the reach (the pane did not catch a tap).
3. Runoff. `flyer` builds the art's `ro_water`, `ro_h2`, `ro_co2`, `ro_acid` (for `chloride`) in place of the three balls. The flight and the destination are the feel builder's; the jar position (`byTarget`) is the one the shelf-free corner uses. Not seen in flight. Wanted from the feel builder: let `byKind` in path.js return `nh3` and `sulfur` (the objects `ro_nh3`, `ro_sulfur` are mapped already), fly the object upright and not spun on its side (they were made to be read upright), and scale it near 0.5 of the molecule's scale (it is built in a 2.5 box).
4. Instruments (`page9-play-0`, `-2`). Held instruments stand on the kit's shelf (five places) on the round page and on the pick page; an offered instrument stands on a short plank. The text under every instrument (what it does) and its name under it are gone; the name is shown on hover only. A used instrument gets `AA.rxKit.use` with a rise and fall over the 0.7 s of its act (in `animKit`). No price: the rules give no price to an instrument (the pick is free; coins pay for a redraw, a skip and the bin). The tag appears only on the bench, for the next supplier.
5. The bench (`page9-bench-1`, `-2`). One place: coins paid by the run (green plus) and held coins; the jar shelf with its one outline and count; a shelf of the instruments of the suppliers opened with one faded instrument of the next supplier, hung with the kit's price tag and its price in coins; the reagents known as before and after pictures with one faded picture of the next (a family, else the supplier's) and its price; the notebook to start the run. Buying is a press on the faded instrument or the faded picture. No supplier rows. Not done: the instruments cut at ten of the supplier's thirteen; the hover ring on the faded instrument is only a ring.
6. Whole first run by real play. Not done as a whole. I saw the pick of one of two (`paper-*-b`), a round in play (`paper-*-a`), a round end with a word (`paper-*-c`), the jar screen, the bench. I did not play rounds two and three or a run end to the bench in one pass.

### The five paper looks (owner picks)

`?paper=1` to `5`, remembered in `aa_paper`; default 1. Drawn in code in `paperDraw` (noise, fibers, stains, grid): 1 aged notebook with ruled lines, a margin and stained edges; 2 parchment; 3 pale green blotter with a fine grid; 4 dark warm bench top with chalk-white ink; 5 kraft with white chalk lines. Each sets its own ink colors, the color of the molecule's contact shadow, the table beyond the sheet and the wash over the view (`PAPERS`). `paper-<n>-a.jpg`, `-b.jpg`, `-c.jpg` are the same three frames for each; `paper-compare.jpg` puts them side by side. On the dark one the molecule's atoms stay as they are (carbon slate blue), and read well.

### White fringes (item B)

- Paper-colored cut-outs behind lettering. 16 `strokeText` calls drew a round stroke in the sheet color behind numbers and words. On a paper with grain, ruling or a grid the stroke cut a flat patch out of it, and on any other sheet it was the wrong color. Fixed at the cause: the ink canvas ignores any stroke in those two colors, so nothing is cut out. No before and after crop was taken.
- The old jars were white cylinders; they are the kit's jars now.
- Not mine and not fixed: some kit models have a white highlight bar that reads as a sliver at the edge (the belly of the water homunculus, the glass of a jar). The ghost jar on the bench is paler than the sheet inside.
- Not found: a canvas sprite cut square, a premultiplied-alpha fringe on the ink texture, a model clipped by the frame.

### Family words (item C)

`ring 2`, `sugar` and the like are not lettered on any screen: the names on the pair page, the line on the round page and the word beside the page's family gain are off.

### Not done

- The three frames were taken for each look with a seeded run, not by a full run through every page.
- Item 6 as a whole run, the 3D coin, the multiplier object.
- Merge notes: `scheme.html` is not committed; version lines to set are `scheme.js?v=361` and `shot.js?v=12`. Lines I touched inside the feel builder's area: `flyer` (the model of what leaves), `animKit` (one `use` line), `land` (family name removed from the ping), the hom block in `frame` (a pose line).

## Third builder

Branch `page-builder-3`, cut from `steam`. Frames `page10-*`, `run-a-*`, `run-b-*`, `mark-sheet.png` in `C:\Work\atlas-atoms\.claude\shots`. Test rig: `?shot=x&script=/dev/<file>.js` as before; `shot.js` now also logs `console.error` and `console.warn` and any script error to `/__log`. The frame server and the Edge runner are in `.claude/p3` (not in git): `srv.py` (port 8821), `shot.sh <name> <script> [&query]`.

### Step 0: does the merged page load
Yes. Real page headless, parchment (PAPERN 2) by default, no console error and no unhandled rejection in a whole bare round (first screen, pick, molecule, three pages, round end, 13 frames, `page10-0-*`). Capture was checked by throwing a test error (it was logged). Found and changed: with nothing saved feel.js used direction 1; it is now 3 (the owner's stated default). Seen but not caused by the merge: the close-up of direction 3 cuts the molecule off at the top edge on some pages (`run-b-06`).

### Done
1. The spec decides the round: `endRound` calls `P.roundEnd(g, run)`; `st.pass` is the spec result, `st.ypass` the yield; gold comes from `res.earn`; the page no longer counts `run.beaten` or sets `run.over` itself. The round page shows the spec at top left (mark, N with a caret, pips or a ruled line, the mark itself filled from the bottom to value over N); met: it turns green and settles (spring and drop 0.56 s, a soft bell and a strike). Two parts (round 6 on) are drawn side by side. End screen: the spec result at the left, large, red and partly filled when lost (seen: 2 of 9), green when met (seen). Pair page: the spec mark and N beside each molecule. Seen: `page10-1-*`, `page10-1L-*`.
2. `marks.js` (new, needs a script line, see below): 45 hand-drawn marks with the names of SPEC_NOTES and of the kept table (`keep_CO`, `ring_pair`, `grow`, `cut_end`, `lean`, `water_only`, ...) as aliases; `AA.rxMarks.draw / resolve / plain`. `mark-sheet.png` shows each large, at 28 px, half filled, met, with its plain condition. Not every mark is equally easy at 28 px (lean, islands, trigger are the weakest).
3. Nothing shows the future: `P.peek`, `st.view.fwd`, the hover outline marks, the per-reagent gain preview and the mirror's hover ghost are removed. A queued circle that fits nowhere (`P.queueFits`) is paler (alpha 0.3), nothing more. Not seen in a frame.
4. Motifs: `drawMotifs(g)` reads `g.motifs = { id: level }` or `{ id: { level, pct } }` and `g.motifMult`. A column at the right of the stage (max 6 rows) with the picture (one piece a level, up to six), the level, the percent, and the product at the head. A rise pops a piece in and bumps the numeral; a fall lets a piece drop. `b.motifs` draws a row under a molecule on the pair page (not seen). Seen with injected state: `page10-4-*`. Twelve held at once overflow; six are shown.
5. Whole run: `dev/p5.js` plays a run by the page's own functions. See the report for what was and was not recorded. No video was recorded.
6. Feel: in direction 3 the yield now keeps its place and size on the screen while the camera is pushed in (`inkAtScreen` in feel.js; seen, `run-b-06`). The page-curl wedge is not touched.

### scheme.html
Add before the feel.js line: `<script src="js/react/marks.js?v=1"></script>`; bump `scheme.js?v=369`, `feel.js?v=2`, `shot.js?v=13`.

### Third builder, second part (camera mixes, centering, notebook page, marginalia, kinds of reflex)

Frames and videos are in `C:\Work\atlas-atoms\.claude\shots`. Recorder: `.claude/feel` of the page3 worktree (copied from the feel builder's, ports 8821 and 8822, `recall2.sh` records again when frames are lost, `center.py` prints the centering numbers, `j_kinds.js` scouts lines with several kinds of reflex, `j_runb.js` records a whole run).

- Directions 4, 5, 6 in feel.js (data beside 1 to 3): 4 keeps the whole molecule in shot with a slight drift to the join (pan 0.15), the page jolts on each hit as in 2, one push-in (1.8 times) on the last hit only; 5 pushes in 1.4 times easing to 1.2 and pulls back over the settle; 6 stays wide with the count racing and goes close for the last three hits (1.7, 1.85, 2.0). `?pace=new` gives any direction the new pace. New pace: first step about 800 ms, 8 percent shorter each step, never under 420 ms, a 150 ms breath between steps; measured periods 967, 1033, 1000, 934, 866 ms and so on (the longest line 967 down to 600 in the earlier long take).
- Framing: the molecule is laid in a box centered on the camera's look point and the camera is fitted to its box each frame (margin 0.78 of half the frame, the look point clamped so the page edge never shows; if it does not fit, the camera goes back to the rest framing). Measured on ten frames of each take (center of the atoms' box, share of frame): x 0.46 to 0.56, y 0.33 to 0.55 over all six final takes (the low y values are in the first 700 ms while the molecule moves into the frame); during the action mostly within 0.40 to 0.55.
- Zoom (camera) ranges measured: 4 long 0.79 to 1.30, 4 mid 1.12 to 1.30, 5 long 1.16 to 1.30, 5 mid 0.96 to 1.30, 6 long 1.29 to 1.30, 6 mid 0.74 to 1.30 (the push-ins of 4, 5, 6 are held back when the molecule is wide, so on long chains they stay near 1).
- A mark at each join (what joined or parted), by kind: closing arc (ring, close), drops rising (dry, enone, open), crossed bars with rays (weld, knit, seal), a curved arrow (shift, taut), a hook (tuck, cap), a double arrow (flip, fold), a crack (snap). Drawn from the step's `join`. A change of kind adds a 150 ms beat, a twist, a drop of the page and a louder bell. The runoff kinds nh3, tma, amine, sulfur, sulfide, so2, fumes, hcl are mapped to the art's objects.
- Lab notebook paper: `?paper=6` (ruled, red margin), 7 (graph grid, blue margin), 8 (aged: three punched holes, a taped corner). Pale off-white with a quiet blue-grey, a coffee ring and a reagent drip placed away from the middle. Default 6. The stored choice is now `aa_paper2`, so a saved parchment choice does not hold.
- Marginalia: `?notes=0|1|2` (stored in `aa_notes`; default 1): 1 sketches and numbers only, 2 adds short notes. Seeded, a different set on each screen, none repeated in a run, only in the strip along the top, the corner at the bottom right and the left margin.
- Not done: the fold layout of FOLD.md (rows of eight, rungs across the fold) is not built; the page still folds a long molecule into a U when it is too wide. N, S and Cl atoms are drawn with the elements' colors from data.js; I did not check their labels in a frame.

### The animations of a turn (written for the owner's ruling AL; values from feel.js, direction 4 at the new pace unless said)

Times are in ms. T(n) is the step's period: 800 at step 1, 8 percent shorter each step, never under 420, plus the 150 ms breath (and 140 more when the kind of reflex changes). A click doubles the speed of everything below.

| Animation | Duration | Easing | Overlaps |
|---|---|---|---|
| fire: the page dips, the molecule eases into the centered frame | 450 in, held to the page turn | in-out cubic | the first throw |
| reagent strike: a token flies from its circle to the atoms it changes | 260 (200 in direction 2) | ease-in (it arrives hard), an arc of 90 px | the next throw starts 360 after the last (direction 3) |
| strike on the molecule: the molecule is knocked along the throw | spring 4 Hz, damping 0.45, about 600 | damped spring | the next reagent |
| hand-off between reagents | 120 to 350 wait (350 before the first reflex) | none (a pause) | nothing |
| reflex wind-up (atoms draw back along their path) | 26 percent of T(n): 208 at step 1, 109 at the floor | ease-out sine | the settle of the step before |
| reflex swing (the committed move) | 20 percent of T(n): 160 down to 84 | ease-in, power 3 | none |
| hit-stop (the joined pair tremble, all else holds) | 2 + n frames (3 to 8 frames, 50 to 133), the last hit 16 frames | none | none |
| settle (the joined group carries past and rings down) | about 500 | damped spring 6 Hz, damping 0.62, 8 percent overshoot | the breath and the next wind-up |
| recoil and turn of the whole molecule | about 600 | damped spring 4 Hz | the settle |
| page jolt (direction 4 to 6) | 200 drop, then 18 Hz shake decaying | out-back | the hit |
| step numeral and gain (beside the molecule) | written in 70 ms, held 250, the gain flies 160 to the yield | ease-in cubic | the next step |
| each kind of reflex: the mark at the join (closing arc, rising drops, crossed bars, an arrow, a hook, a double arrow, a crack) | 1100, faded in over 15 percent | none | the next step |
| change of kind: an extra beat, a twist, a page drop, a louder bell | +150 at full draw, +140 in the period | spring 3 Hz | none |
| across-the-fold rung | not built (FOLD.md): the rows are not laid out by the rule yet | | |
| runoff leaving | 560 flight, falls under gravity, clink on landing | parabola | the next step |
| jar landing | the clink at the end of the flight | none | |
| yield count | 260 to 400 per gain, set down on each arrival | out-quart | the next numeral |
| camera moves (direction 4: drift 0.15 toward the join over wind-up and swing; 5: push to 1.4 over the wind-up, pull back over the settle; 6: wide, then 1.7, 1.85, 2.0 for the last three) | wind-up length, never under 150 to 250 | in-out cubic | the wind-up |
| OVERREACT over the whole screen | paper wash 220, word written in 260, held 900 | linear write, a 6 percent overshoot | after the last hit has landed |
| page turn | the old curl, 0.7 s | not touched | |

Not measured by frame stepping: the dead frames, the velocity jumps and the camera moving against the molecule (the owner's list in AL). I measured only the step periods (967, 1033, 1000, 934, 866 ms and down to 600) and the centering. The `windup(n, ms, last)` call is made at each step start. Pace switch `?pace=1|2|3` (unhurried: T1 1000, ratio 0.94, floor 560, breath 220; brisk: 700, 0.9, 360, 100; fast-building: 900, 0.8, 300, 90) is built; `pace-compare.mp4` is recorded only if listed in the report.

### Third builder, part three

- Paper (items AI): three clearly different lab notebook pages. `?paper=6` ruled with pale blue lines, a double red margin, a printed header strip (Expt. no., Date, Page 47), punched holes, two whole coffee rings. `?paper=7` graph grid with a blue-grey major grid, a single red margin, a boxed header, a spiral binding, a chemical splash and a ring. `?paper=8` aged: a grey cream sheet, rules, holes, a taped corner, a scorch mark and a ring. The ink and the molecule stay the loudest thing. The calibration of the visible page: the canvas is seen in perspective, so at the bottom row the visible ink x runs from about 282 to 1750 and at the top row from about 50 to 1990; every note and stain is placed with that in mind.
- The madness (ruling AM, `?notes=0` off, `?notes=1` the progression, 2 the same): `madLevel()` is 0..1 from the round (80 percent) and the length of the chain (20 percent). It drives: how many notes (1 at the start, up to 4) and doodles (0 to 3, from flask and tally to eyes, homunculi and skulls), three tiers of notes (22 neat lines, 22 doubting lines, 26 unhinged lines), the handwriting (neat, then each letter off its line and askew, then heavy), stains (up to 7: rings, scorch, ink blots), a torn corner after 0.55, tape after 0.4, ruled lines that wobble after 0.62, and late hits that shake the page more and throw ink drops (st.splats). Notes never go over the molecule: they stay in the strip along the bottom (below the yield), the corner at the bottom right, the top strip over the printed header and the top right. Seen at rounds 1, 3, 5, 7, 9 in madness-compare.jpg.
- Sound: the calls title, runStart, shopOpen, buy, cantBuy, hover, click, pick, redraw, roundWon, runWon, runLost, unlock, finding, creature, instrument, gold and ambience(kind) are made from scheme.js through a guarded `sfxN`. `windup(n, ms, last)` is called at each step start in feel.js.
- Centering (feel.js): the frame is refitted every frame: the molecule's box is centered on the camera's look point, the fitted camera backs off to the rest framing if it does not fit, the push-ins are limited so the box stays inside 72 percent of the width and 50 percent of the height (so the molecule cannot cover the yield at the bottom left), and the framing ease takes 260 ms.
- Motions by kind (feel.js `KIND_FEEL`): each family has its own wind-up length, swing length and curve, hold at contact and overshoot (weld: long held press; snap: short and violent; shift: a long smooth glide with no hold; dry: quick with drops; tuck and flip: a large carry-past), plus its own mark at the join. They are different in timing, curve and overshoot, not different atom paths: the atoms still move by the rules' drawing change.
- Not built: the fold layout of FOLD.md (rows of eight, rungs across the fold).

## Fourth builder

Branch `page-builder-4`, cut from `steam`. Files changed: `apps/steam/js/react/scheme.js`, `feel.js`. `shot.js` and `marks.js` are not changed. Recorder and measuring scripts are in the page4 worktree, `.claude/f4` (not in git): `srv.py` (port 8861, serves the worktree and stamps every script address so nothing is cached), `fsrv.py` (8862, takes frames), `rec.sh <name> <query>` (records `frames/<name>` and `<name>.json`), `takes.sh` (several, two at a time), `make4.py <out.mp4> <take>[=label] ...` (encodes into `.claude/shots` and decodes the result), `frame4.py` (framing with atom radii), `anim4.py` (dead frames, velocity jumps), `riser.py` (the wind-up riser in the sound track), `j_scout.js` (finds lines on the molecules `P.runBriefs` deals), `j_line.js` (one page), `j_still.js` (one still of a round as dealt), `j_run4.js` (a whole run). Headless Edge only. `P.runBriefs(run)` works when it is given the page's own run (`S.debugRun()`) after `debugRound`; it deals molecules with N, S or Cl in rounds 1 to 5 and none in rounds 7 to 9 (the long molecules of the table are carbon and oxygen only). `debugFeed` salts the molecule from the seed, so a recorder must call `P.seed(n)` just before it to get the same molecule twice.

### What was built

1. OVERREACT (ruling AJ). A second overlay canvas sits above the 3D canvas and the veil (`overC` in scheme.js, handed to feel.js as `api.over`). `overStart` and `drawOver` in feel.js draw on it in screen pixels: white flash, the page blanched, an ink burst, the word slammed down from 2.4 times its size in 140 ms, shake for 800 ms, held, torn off after 2.3 s. The word is fitted to 86 percent of the frame width. The page under it shakes, drops, the molecule is knocked and ink is thrown on the paper. The old words (`stable`, `unstable`, `volatile`, the green `overreact` at the top, the red one on the paper) are not drawn any more. The overlay is cleared by resetting the canvas, not by `clearRect`.
2. Framing. The molecule has one home (`HOME` in scheme.js) in the middle of the frame. `flHome` centres the box of what is drawn at that moment, measured with the atoms' radii, at a height worked out through the camera (`zFor`), and slides there; the scale is at most 1.7 and does not grow while a line is playing. The camera never travels: it only shakes and drops. The yield and the four marks are one band along the bottom (`MADE`, `TRK`), the step numeral and the gain have their own place in the left margin, the reflex legend is at the very top.
3. The fold (FOLD.md). `foldLay` in scheme.js lays every molecule out from `P.foldOf`: rows of eight from the start end, a turn at each row end, rings of eight or fewer as one body set down whole (fused ring systems are untangled flat first), groups standing off their atom (leaning aside in a gap, pointing outward on a turn atom), longer arms zigzagging on. Positions are kept in the frame of the start end. A rung (`bond.rung`, or a bond the fold left out) is drawn as a long bond from row to row. The U fold and its bending are not used when the fold layout is on (`?lay=old` brings the old layout back). When the line itself changes length, `slideSet` and `slideEval` carry every atom to its new place along the snake, round the turns, with its groups and rings riding on it.
4. Motions by kind. `actOf` and `pose` in feel.js: each kind moves the atoms that join or change in its own way through the wind-up and the swing (ring: drawn apart, then round in an arc; weld: lifted, drawn back, hammered; knit: weaves in; cap: rises and comes down on top; tuck: round the side in a hook; seal: the two ends twist shut; close: trembles while the chlorine goes, then straight in; open: springs apart and jumps in; snap: all six breathe out and clap shut; dry: pulled apart, then pinched; shift: a wave along the atoms; flip: over the top; fold: laid down to one side). An across step leans the two groups together, grows the rung from one atom to the other in red, then leaves the rows where they were. Runoff takes 950 ms to leave and lifts off at contact.
5. Excitement. Each hit: wind-up, a flash and lines of force at the join on the overlay, ink thrown on the paper (more with each step), shake that grows with the step number, the hit-stop, a swell of the molecule, the settle. The yield jumps with each gain, shakes harder the longer the chain, and burns from the first mark on (flames behind the number, the number turning red). An idle float keeps the molecule from standing dead still. The wind-up eases in and out. `?pace=1|2|3` is kept. Directions 4, 5, 6 now differ by how the molecule itself swells (4 steady, 5 leans in on every step, 6 stays small and leans in for the last three), not by a camera move.
6. The page. N, S and Cl are 1.3 times larger with a letter that fills the ball. Notes are wrapped onto lines in four places that touch nothing (top strip, upper left twice, upper right); stains and the paper's ring and scorch are moved off the bottom band. The aged page (`?paper=8`) is the default and its tape is grey. `AA.music` is called behind a guard (`musN` in scheme.js, `mus` in feel.js): `seed` and `state('title')` at a new run, `bench`, `pick`, `round(n)` and `plan` at a round and at each new page, `chain` at fire, `step(n)` at each hit, `overreact`, then `won`, `lost`, `runwon` or `runlost`.

### scheme.html
Add after the sfx.js line: `<script src="js/music.js?v=1"></script>`. Bump `scheme.js?v=371` and `feel.js?v=4`.

### Not done
- The pair page and the end screens were not looked at with the fold layout.
- Flip, snap, knit, open and fold have their motion written but were not seen in a recorded frame; no line with them was recorded.
- Rounds 7 to 9 deal no molecule with N, S or Cl; in the round 8 clips nitrogen comes in with a reagent.
- A wide ring system or a long side arm can still be laid over a neighbouring row.

### Fourth builder, after the first judge and the owner's ruling on pace (12 November)
- Pace: `PACES` in feel.js. 2 is the default (no `?pace` needed): the first step lasts 1.5 s and each next one 9 percent less, never under 0.5 s, with a 150 ms breath between steps, 250 ms more when the kind of reflex changes, and a longer held beat before the last hit (wind-up 900 ms, held 350 ms). Four steps last about 5 s, twelve about 11 s. Pace 1 is slower still (1.9 s first, 7 percent less each, floor 0.65 s). Pace 3 is the old brisk one (0.7 s first, floor 0.36 s).
- Intensity is carried across the round: on the second and third turn of a round the shake, the swell, the flash and the ink thrown are each larger than on the turn before (`turnK` in `hit`).
- Hits are harder: a larger and longer flash (360 ms), more and longer lines of force, more shake; the page can no longer be shaken so far that the bottom row leaves the frame.
- Notes: the top one is under the printed header, the right one under the column of numerals; frantic lettering keeps its letters in order. `next` and `new run` stand above the marks row. The gain stands up and to the right of the step numeral.
- A play sequence now ends with its round (`AA.rxFeel.reset()` from `load` and `endRound`); before, a round that ended in the middle of a page left its yield and numeral on the next round's page.
- Not fixed from the judge's list: a molecule can still be drawn tangled for a moment while it changes, and after a ring forms near the start end the whole drawing re-flows (the fold rule moves everything after the change); on the last page of a round the end screen can cut the finish of the sequence short.

## Sixth builder

Branch `page-builder-5` (worktree `page5`; builder 5 left nothing). Scope after the split into five builders: the clean molecule (layout and motion), the showable run, leftovers. Files: `scheme.js` (layout, motion, title), `feel.js` (two small lines). Recorder and measuring tools: `.claude/f6` of the page5 worktree (not in git; ports 8961 page server, 8962 frames): `take.sh <name> <query>` records a line and prints the measures, `JOBN=run6 take.sh` records a whole run from the title, `lay.sh <tag>` checks the layout of dealt molecules and what random lines make of them with no drawing (30 s), `rsearch.sh <seeds>` plays whole runs without recording to find a seed, `pts.py` draws one layout, `make4.py` encodes (stereo now).

### The clean molecule

- Measured on every recorded frame (`AA.rxScheme.measure()`, summed by the recorder): the nearest two heavy atoms in screen pixels as a share of their two radii (under 0.9 is an overlap), and the longest drawn bond that is not a rung as a share of a normal bond (over 1.3 is stretched). Builder 4's look4-c line: nearest 0.06, 435 of 554 frames overlapping, longest bond 1.72, every frame over. Now on the same line: nearest 0.95, longest 1.35 before the last guard and 1.23 after it.
- The turn: the last two atoms of a row droop into the gap and the first two of the next row rise, so the bond across the turn is a normal bond (it was 1.55 times normal on every folded molecule). Rows are 5.0 apart (`FL.RG`); where something in one row would touch something in the next, the rows below are moved down.
- Ring bodies are drawn from scratch as a chemist draws them (first ring a regular polygon, each next ring on the edge or atom it shares, on the free side; a bridge strung between its ends), then set down where they land on nothing; a body too big for its row is set on its first row's places and the line carries on from where it lets out.
- After placing, bonds are evened and atoms nearer than their balls allow are pushed apart (`apartOf`), with each atom drawn back to its place.
- Motion: on every frame of a change `untangle` keeps every old bond its length and pushes apart what comes too near; new atoms ride with the atom they hang from. `layoutSafe` is the last guard for everything drawn, also for what feel.js moves (settle, tremble, snap, pose): no drawn bond over 1.22, no balls touching.
- Two parts (`stageMid`, `stageTwo`; `?staged=0` turns it off): first the atoms that change, and the ring they are in, take their new shape in place while everything before stands still and everything after is carried along as it was; only then does the rest re-flow along the snake. The next step waits 330 ms more when there is a re-flow.
- The molecule is larger: scale up to 2.3 (was 1.7) in a slightly larger home.
- A title cover (`titleC`, `?title=0` leaves it out): the notebook page with the name and a drawn snake; click or key opens it.
- `?see=0` (feel.js) switches off the outlines, glow and names on reacting atoms.

### Not done
- Big fused ring systems (steroid-like, spiro pairs) in rounds 5 to 9 can still crowd in the static layout: `lay.sh` reports the count.
- Recording the music: the states `overreact`, `won`, `lost`, `runwon`, `runlost` make `AA.music._renderWithSfx` hang offline, so the recorder leaves those states out (the groove plays on through them). Live play was not checked.

### scheme.html
No new script. Bump `scheme.js?v=` and `feel.js?v=`.

### Sixth builder, the clear-screen pass (12 November, after the owner watched show6-run)

The owner's rulings applied here: no words in the game (only numerals, the margin notes and OVERREACT are writing); no ink specks on ordinary hits; no coloured outlines or glow; nothing moves that is not part of the step; no drops, plus signs or prices on the first choice; the round as a numeral with boxes that get ticked; the art (jars, creatures, instruments) on the play screen.

- Play screen (`drawInk`, play mode): the spec mark and its count at the top left; the round numeral and three boxes (ticked in green as each turn is used); the speed control as chevrons (one, two, three; two and a bar is skip; drawn in feel.js `uiDraw`); three large numbered places (`STEP`, `STEPD` 3.3) that fill with the reagent's after-picture; the fire arrow under them (`FIREP`); the yield numeral at the bottom left; the flags track along the bottom; the reagents as one shelf in a pencil bracket at the right (`LAB`, `SPOT`, rows up to 3.3 apart), each a before -> after picture (`TILE`, `FRAG`: every reagent has one now, with N, S, acid, epoxide, aldehyde). Removed: reagent names (also on hover), the row of kinds along the top and the column of multipliers (`?legend=1` brings both back), the faint next-reagents strip, the dark page corner, the use drops, the names under jars and instruments, the word and drops beside the homunculus.
- First choice: `showPicks` goes straight to the two molecules before round 1 (`run.picked1`); the coin marks, the purse and the re-deal are not drawn on the round 1 choice. On later rounds the upgrade screen shows the pictures only (no drops, no +40).
- The bench: `benchOn()`; a ten-place shelf across the top of the play area (`shelfAt(10, -3, -10.5, 1.42)`), jars in a row at its left end (`jarPos`), instruments from x -8.6 every 5.3 at scale 1.55 (`KITP`), the homunculus at the right end at scale 1.9 (`HOMP`). The molecule's home gives up its top 5.4 units while the bench shows (`homeNow`).
- feel.js: `splat` throws ink only when called from OVERREACT; `VIBE` is off unless `?vibe=1`; the idle float, the knock and turn of the whole molecule on a strike or a hit, and the ringing after arrival are removed (`rec`, `yaw`, `ov` set to 0).
- Layout: a ring that the fold rule moves to the next row (it never splits a ring across a turn) is drawn where the row ran on (`turnIn`), the rest of the line turning under it; a ring keeps the handedness it had on the page; a cage that cannot be drawn ring by ring is spread as a flat net (`?cage=1` is a trial of a view in space with depth cues; off).

Timing of everything that appears, changes or leaves on the play screen (ms; the action itself is in the table above):

| Thing | Motion | Time | Easing |
|---|---|---|---|
| title cover leaving | slides left, turns, fades | 520 | quadratic in |
| a reagent chosen | its picture flies from the shelf to its place on a low arc | 220 | cubic out |
| the place filling | pops 35 percent and settles | 260 | damped cosine |
| a turn's box ticked | the tick is drawn, down stroke then up stroke | 260 | linear in two parts |
| reagent thrown at the molecule | token on an arc | 260 | quadratic in |
| the yield counting | counts to each gain | 260 to 400 | quartic out |
| a flag passed | the pole jolts back and rings | 1500 | spring 3.3 Hz |
| a new atom | grows in with a 10 percent overshoot | 300 | back out |
| a change in place, then the re-flow | two parts | step time, then 400 | the step's curve, then cubic out |
| an instrument firing | rise and fall | 700 | sine |
| page turn | the old curl | 700 | not touched |
| speed mark chosen | pulses once | 420 | spring 6 Hz |

Not done in this pass: the flags do not fill with a drawn motion (they switch); the upgrade screen of later rounds has no picture for what a choice gives; the end screens were not retimed.

### Sixth builder, last additions

- Nothing moves between steps: `flHome` slides and scales the molecule only while a morph is moving it (toward the box of the layout the step ends in) and sets it exactly between steps; the charge shake, the squash and pop, the swell on a hit are removed. The recorder logs it (`V.wobSum()`: atoms moved outside a step, whole molecule moved outside a step); before 212 of 454 idle frames, after 0.
- Reagents: no bracket, no strike. `slots[i].o` is null when the reagent has no place to act on the molecule as it stands: its left picture is drawn pale in a dashed outline.
- The target is a finish post drawn in ink (the first 3D flag is hidden), the bar is 18 wide and starts at the yield numeral (`TRK`, `MADE`).
- The goal (`drawHurdle` with `goal`): the mark drawn once per one needed (up to 6), dashed outline until had, filled and ticked after.
- Stains: `pageStains` draws a seeded set per run, round and page under all ink; `keepClear()` lists the rectangles; `AA.rxScheme.stainCheck(50)` gives the worst reach inside (0.099 of a unit). The stains baked into the aged paper and the madness stains of `buildMargin` are off.
- `?bench=a|b|c`: mock views of the page on a wooden bench with the objects on the bench; `?cage=1`: the trial of cages drawn in space.
- Not done: hand-made cage templates; the molecule part that meets the goal lighting the outline; jars as large as the instruments and the homunculus acting in a take; the upgrade screen's picture language; the stains clip of five pages; show6-run.mp4 re-recorded from this state (the file in shots is the first version, seed 3, from before the clear-screen pass).

## Eighth builder (12 November, night)

Branch `page-builder-8` (worktree `page8`). Files: `scheme.js`, `feel.js`, `marks.js`. Recorder: `.claude/f8` of the worktree (not in git; ports 8981 page, 8982 frames; `bc.sh`, `still.sh`, `sweep.ps1` as in f7; `j_bclip.js` takes `quota=` to set the target for a take and `cup=1` to force the cup's visit and print the stain check).

- Hydrogens (`HYD`, `?hyd=a|b|c|0`; the owner picked b, the default): full size, further out, a stick to its atom. `hydFix` in `layout` sets every shown hydrogen on every frame, whatever moved the atoms: on a circle round its own atom (gap `hydGap`, measured as the camera sees it), in the direction it was given unless something is in the way; then turned round its atom by the least turn to a free side, tried nearer in (0.62 of the gap) and further out (1.5) when crowded. The turn is remembered per hydrogen so it does not flick. The stick to a hydrogen is always drawn.
- Reagents (`REAG`, `?reag=cards|bottles`; default `both`, the owner's pick): one index card per reagent in a column right of the page (`bothDraw`: picture on the left, numeral of its place in a pencil ring and warm paper when it is in the line, grey when it has nothing to act on), its bottle standing on the card's right end (open when usable, stoppered when not). Firing (`bottlePour`, `pourMs` 720): the bottle leaves its card, is carried to just beside the atoms it acts on (`tgt.sites` from feel.js `throwThen`: one place per cluster of changed atoms, up to three, nearest the card first), tips, one stream falls, and it goes back.
- Yield marks (`YMARKS`, `AA.rxMarks.yieldMark` in marks.js): four of our own marks, each adding a stroke to the last (ring; stem; two rays; bar, point and lightning). Thin outline until passed, then inked stroke by stroke (340 ms, 520 for the last); the target is larger and red; the three bonus marks have a pale gold ring that fills. The 3D flags are not built, the post, the flag drawings, the coin pictures and the purse on the track are not drawn. Coins fly to the pile from the mark that was passed.
- `flHome` arrives on a step's last frame (it was one frame late: the logged whole-molecule move outside a step).
- Sound: feel.js calls `AA.sfx.build('c')` once at load when no build is set, and `AA.sfx.arrow(n, ms, { last, of, gap })` where `windup` was called (falls back to `windup` when `arrow` is absent).
- The cup goes to the ring nearest its own place.

Measured (one 14 s clip each, every frame; nearest heavy pair / nearest pair with a hydrogen, as a share of the two radii): round 1 1.08 / 1.45, round 5 1.24 / 1.22, round 7 1.04 / 1.15, round 9 1.08 / 1.25. Whole molecule moved outside a step: 0 frames (19 during OVERREACT, which shakes it on purpose). Stain check on the bench: 50 pages, worst 0.091 inside.

Not done: jars with shadows, the homunculus larger and acting, the turn control's place (a faint round arrow drawn at a fixed place inside the molecule's area, about 766, 314 on a 1280 frame, was not found in the code), pick, shop, round-end, run-end and title screens in the bench view, cage drawings. One recording stalled at frame 368 once and did not repeat in four re-runs of the same take.

scheme.html: bump `scheme.js?v=`, `feel.js?v=`, `marks.js?v=`.

## Ninth builder (13 November)

Branch `page-builder-9` (worktree `page9`). Files: `scheme.js`, `feel.js`. Recorder: `.claude/f9` of the worktree (not in git; ports 8991 page, 8992 frames). `run.sh` now starts Edge at below-normal priority (`startedge.ps1`, `lowprio.ps1`) and holds a lock so only one take runs at a time; `sweep.ps1` after every take. `j_sc9.js` scouts seeds for lines with an across step; `j_run9.js` is the whole-run job (`hold=1` sets `RULE.holdAll`, `qk=a,b,c` scales each round's target in percent, the homunculus is used when it waits).

- **A join across the fold is a real ring** (`ACROSS`, `?across=rung` brings the old long bond back). In `foldLay`, when the molecule has a rung, the rung is an ordinary bond of the layout graph, so the loop it closes is a ring body (`bd.macro`). That body is drawn largest ring first: a regular polygon up to 8 atoms, from 9 an oval of the same rim length (`oval`), smaller rings set on its outside. It is set down by the best rigid fit (either face) on the places its atoms had in the fold, so it stays put from step to step. The two ends of the line that run on from it are carried with their atom on the ring and turned about it (`carry`): of the turns that leave no atom on another and no bond across a bond, the pair that lets the drawing fill its area best. Groups on a ring atom point away from that atom's own ring bonds. `fl.rungSet` is empty in this mode, so no stick is a rung and nothing is ever drawn from row to row. `fl.ring` marks the mode.
- **The move**: a step into, out of or within such a drawing is one move (`morph.ringy`: no two-part staging, no slide along the snake): every atom goes straight to its place, old bonds keep their length on the way (the slow branch's bond pass and `untangle`), and the new bond is drawn only once its atoms are within 1.15 of a bond (the rule `layout` already had). In feel.js an across step has no pull-back, a wind-up of at least 760 ms and a swing of at least 1250 ms (in-out), and no rung is grown.
- **Measure**: `measure()` now counts every drawn bond in `bl`, a rung too.
- **Step name**: 25 px pencil grey scrawl beside the new bond, written in 220 ms, gone 1 s after the hit, never during OVERREACT. An across step uses its kind's own name (`seeName`).
- **No white-out**: the wash of paper over the rest of the molecule is off (`SEE_WASH`); the flash of a hit is small (44 px plus 5 a step), pale, 240 ms. The ring a step closes is traced in pencil only when it has 7 atoms or fewer and is not an across step.
- **Queue circles**, the states: empty (pencil ring); queued (picture, warm fill, ink ring); fired (picture dimmed with a green tick); had nothing to act on when its turn came (`wasted` in the trail: the picture sinks and fades out of the circle in 0.9 s and the circle is left empty; there is no X any more); banked (the tray).
- **Sound**: an across step is paid as two chain steps, so `g.casc` jumped (1, 2, 4) and the builds were told a step was missing. Each step now has its own count `S.sn` (1, 2, 3 ...) and `of` is the number of steps the plan really has (`plan.S`): `AA.sfx.arrow(sn, ms, { last, of, gap })`, `AA.sfx.reflex(kind, sn, ...)`, `AA.music.step(sn, of)`.
- **Hydrogens**: ball and stick are one white shape in one dark outline (`HOUT`, `hEdge` in the ink colour; the stick of a hydrogen is 0.125 thick, white, with a back-face hull of its own). Same on leaving groups (`flyerReal`) and on the pencil hydrogens of a step (feel.js `seeFrame`).
- Words removed: "turn" under the arrow, "next" and "new run" on the round end (an arrow; a round arrow before it when the run starts again).

Not done: pick, shop, round-end, run-end and title screens are not rebuilt on the bench with large pictures (only the two words above went); "bank", "terms", "new sigil", "times" are still lettered; a drawing with a ring across is often taller than wide and so sits smaller than its area allows; the first reagent of a page can still re-lay a whole chain when it acts.

scheme.html: bump `scheme.js?v=`, `feel.js?v=`.

## Tenth builder (13 November)

Branch `page-builder-10` (worktree `page10`). File: `scheme.js` only. Recorder: `.claude/f10` of the worktree (not in git; ports 9101 page, 9102 frames). `c.sh <name> - "<query>"` records with `j_r10.js` (a run played through the page's own functions; `segs=` names the stretches to record: `title`, `pick1`, `shop2`, `play1L` (last page of round 1), `end1`, `runend`, `turn1`, or `all`; `jump=2&coins=6` starts at round 2's shop; `stop=pick1` ends there); `cutk.py` cuts a take; `pub.sh` encodes to shots and shots/small with the two-line note. A take records at about 5 frames a second.

Every screen below is in the bench view of play (`BENCHV`); with `?bench=0` the old flat screens are untouched.

- **The shape does not leap** (`easeLay`, `?ease=0` turns it off). After `foldLay` has made a fresh drawing, `buildMol` asks whether it leaps: what is left of each seeded atom's move when the slide of the whole is taken out. Under 0.3 of a bond on average and 1.6 at most, the fresh drawing is kept. Otherwise the drawing is not laid out afresh: every heavy atom starts where it stood in the last drawing (`seed`), a new atom a bond out from the atom it hangs on, and the whole is relaxed: bonds to their length, pairs two bonds apart to 1.5 bonds, others kept apart, each atom held lightly to where it was; every ring of 8 or fewer is held to the chords of a regular polygon. It is tried with the rings held, then with only the bonds held. If a bond is still off its length, two atoms are on each other or a bond lies across a bond, the fresh drawing is used after all (`fl.why` says which: `still`, `ok`, `bond`, `near`, `cross`, `seed`). An eased drawing is marked `fl.ring` so the move is the straight one builder 9 made for rings, and it has no rungs.
- **The step log** (`AA.rxScheme.stepLog()`): one record per step of a line and per page turn: `n` atoms that did not react, `mean` and `max` distance they were carried as a share of the play area's width (`HOME.w`), `shape` and `shapeMax` the same with the whole molecule's slide and change of size taken out, `sc` the change of scale, `eased`, `why`.
- **Round end without a cut.** `endRound` no longer moves or resizes anything. For `RES_MS` (3 s) the molecule stands exactly where it was (`flHome` returns early in `done`) while the gold flies to the pile; then, for a round that was passed, `st.pinned` starts one eased move (`PIN_MS` 1.3 s, position and scale together) to `PINH`, the top right corner of the page, where pencil corners and a strip of tape are drawn: the record. A lost round is struck through in red, two strokes, and the molecule stays. The arrow to go on comes only after that. No coins are drawn flat on the page, no words ("new sigil" and the sigil's name are gone; the sigil itself is still drawn). What the effects left on the glass over the page (ink specks of OVERREACT, a traced ring, a step's name) is faded out from 0.9 s to 2.6 s after the end and wiped on every other screen (it used to stay over the next screens). The first click during the 3 s skips the wait, not the move.
- **Pick a molecule** (`briefInk`, `briefDone`): the two sketches each on its half of the play area (`BX`, `BZ`), under each the first yield mark in red with the number, then the goal picture; the round's numeral ringed in pencil at the top left; a dashed pencil line between the halves. The harder one's extra gold stands as coins on the bench above its sketch (`briefCoins`), never in round 1. Choosing (`st.choose`, `CHOOSE_MS` 1.5 s): the pick is circled in pen, the other crossed out in pencil and shrunk away, and `load()` starts the molecule in play at the sketch's own place and size and carries it to its home in 0.8 s.
- **The shop** (mode `pick`; `shopBuild`, `shopFrame`, `shopInk`, `shopHit`): the three offers stand on the bench right of the page: a reagent as the note card with its bottle (`bottleMake`), an instrument as itself (`piece`). Nothing stands beside them: taking one is free. The bell (`doReroll`) has `P.rerollCost(run)` coins stacked beside it; the door (`doSkip`) has the coin it pays standing in the doorway; the run's priced extra bottle (`run.shelf`, bought with `P.offerBuy`) stands on the far bench with its stack. Under the pointer a thing grows and lifts and the page draws what it does, large, in a 2.6 s loop (before, arrow, after; reagents only). Paying sends coins from the pile to the thing; a price that cannot be paid shakes its stack (`shopBad`, `cantBuy`); the thing taken flies to its place (cards column or the kit row) and the rest sink.
- **The title** (`titleBench`, `coverMake`, `coverDraw`): a closed notebook (a cloth cover with a taped spine and a label) lies over the page; the frame starts dark, the lamp flickers on, OVERREACT is lettered on the label by `AA.rxPen.write` (its `t`), an arrow (a mesh on the cover) asks for it to be opened. `titleGo` swings the cover over to the left in 1.25 s; the first page (the two sketches) is under it and its molecules grow in as the cover clears them. The jars stand on the bench on every screen of a run, the title too, and the instruments are no longer cleared between rounds.
- **The page between rounds** (`leafStart`, `leafFrame`): on `next()` the paper and its ink are copied onto one sheet hinged at the left edge, which turns over in 1 s; the next screen is already under it.
- **The end of a run**: along the top one of our marks for each round of the run, inked in green for each round beaten; a run that is won inks the whole sign large in gold where the molecule stood, after it has gone to the corner. A run that is lost has the red strokes of its last round.
- Sound calls: `pick` (a molecule, an offer), `click` (the lamp, the strokes of the cross-out and of a lost page, the door), `pageTurn` (the cover, the move to the corner, the leaf), `shopOpen`, `hover`, `cantBuy`, `redraw`, `buy`, `gold`, `coin`, `unlock` (the sign at a run won).

Not done: an instrument in the shop has no acted picture on the page; the door and the bell are plain shapes; the offers are small because the bench beside the page is narrow; the pair-redraw mark on the page of two sketches is still a turning arrow with flat coins on the paper; the reagent cards vanish at the instant a round ends; a faint pencil ring from the last step can stay under the molecule at the round end; the small pinned sketch vanishes as the leaf lifts; the screens `terms`, `hom` and the bench between runs (`shop` mode) are not rebuilt; "times" by the transmutation circle and "bank" are still lettered where those are on.

Measured on the whole run of `scr10-run.mp4` (seed 5, three rounds, 20 steps): atoms that did not react were carried 6.4% of the play area's width on average (4.0% with the whole molecule's slide and change of size taken out); 11 drawings were eased; 4 steps were over 10%: 25% (round 2 page 1, refused: rings not regular), 22% (round 1 page 1, refused: a bond off its length), 18% (round 1 page 2, ten atoms added, scale 0.79) and 11% (round 2 page 3, all of it the change of scale). A refused step still re-lays the drawing in the old time; its own longer beat is not built. The ink specks of OVERREACT (`st.splats`) fade from 0.9 s after the round's end and are drawn on no other screen.

scheme.html: bump `scheme.js?v=`.

## Eleventh builder (13 November)

Branch `page-builder-11` (worktree `page11`). Files: `scheme.js`, one line of `feel.js`. Recorder: `.claude/f11` of the worktree (not in git; ports 9111 page, 9112 frames). `s.sh <name> "<steps>" "<query>"` takes stills or a recording by a small script of steps (`j_s.js`: `round:N`, `take:i`, `brief:i`, `own`, `gear:a,b`, `coins:n`, `hover:i`, `shot`, `rec`, `w:ms`, `go`, `f:name,arg`, `dbg:bench|need|made:N`); a still takes about 20 s. `c.sh` records with `j_r10.js` as before (new: `reach=3` for a long run, `plan=task` plays for the task with the least yield, `sign=N`). The sound is rendered with the game's default track, read back from the render (`track`, `palette`, `build`, `owns` are printed): it is `edm`, which is theme 8 in `music.js` (`TRACK(8, 'edm')`), so builders 9 and 10 rendered EDM too.

What changed, as seen in frames:

- **One scale for the bench** (`UCM`, bench units to a centimetre, 1.0; `REALCM` widths and heights; `topRow()` lays the jars, the instruments at their own widths and the creature along the top and shrinks them together if the row is too long). Mug 9.4 across on a saucer with steam, jars 8.8, balance 18.7, duck 8, coins 2.8. The camera stands 12% further back and looks further right and up (`BCAM`), so the page and molecule are 0.89 of their old size on screen. A true 21 cm page would need 3 units a centimetre: it does not fit a screen. Cards and bottles are not resized.
- **The track**: starts further right (`TRK.x0`); the running yield has its own place left of it and shrinks to its room (`madeMax()`, also used by `feel.js`). Checked at 4, 6 and 8 digits on a still page.
- **The yield a round needs** (`needNow()`, from `P.needYield(run)` when the round has a task): the first mark of the track is that line (a red bar across the track with its number; the gold marks stand in order of their numbers, `trackPos`), it is also drawn beside the goal pictures at the top, both tick green when crossed (`st.needT`); on the end page it is ticked or ringed in red beside the goal picture, with the red gap on the track. The pick page shows that number in a long run.
- **The pick page**: each sketch fitted by the box of its drawn atoms (`liveBox`) into its own half and centred there; one scale for both unless that leaves one unreadable; the target on one line and the goal pictures on the next.
- **A lost round** (`LOSS`, `lossFrame`): unmet target first, two pen strokes as meshes above the molecule, the page (a snapshot with the molecule drawn flat) crumples into a ball that rolls off onto the bench, the gold is swept from the pile (`GP.sweep`), a clean page with the start-again arrow.
- **The shop**: the camera eases back and aside (`st.shopK`); offers in a row on clear bench at the bench scale; bell and door stand up; an instrument pointed at acts one step on the page with the numeral of its `tok`.
- **The title**: the camera stands back and left while the notebook is closed (`st.titleK`) and comes in as the cover lands; the sign by `meta.sign` or `?sign=0..3` on the cover and scratched in the bench (`signN`, `signBench`).
- **Mocks** `?bleed=a|b|c&bleedd=0..3` (`bleedMock`, under all ink): writing from the other side, a stain from beneath, pressure marks. Depth is given by hand; nothing is wired to the run.

Not done: creatures as shop offers (the rules' shop deals none); instruments on the title bench (none are kept between runs); the reagent cards still vanish when a round ends; the record sketch and the bending leaf; the redraw mark as a bench object; the three steps that re-lay the drawing.

## Twelfth builder (13 November)

Branch `page-builder-12` (worktree `page12`). Files: `scheme.js`, `feel.js`. Recorder: `.claude/f12` of the worktree (not in git; ports 9121 page, 9122 frames; same scripts as `f11`; `ci.sh "<message>"` commits). New steps for `s.sh` go through `f:name,arg` on `AA.rxScheme`: `cupAct`, `cupHov,1|0`, `coined`, `cupState`, `fitLog[,1]` (1 resets), `paceLog`, and `dbg:mol`.

- **The notebook is an open spread** (`SHAPE`, `SHP`; default `a`; `?shape=0` the old wide sheet, `?shape=b` one upright page, a picture only). Two pages 34 by 40.9, gutter at x = -2 (`shapeDress`: boards, page edges, gutter shadow, stitches). Right page: the molecule's home (`SHP.home`, 0.4 to 30.5 across: `keepSeen` lets the drawing reach 0.9 past it, which is still clear of the gutter), running yield, track (`SHP.trk`), speed marks (`SHP.speed`, `gap` read by `feel.js`). Left page: goal, round and boxes, the three places and arrow (`SHP.step`, `SHP.round`), margin notes, and the records (`recSnap` at the moment a passed round is pinned, `recSlot`, `recMock` draws them; kept for the run in `RECS`). Camera `SHP.cam`. A wide molecule is about 400 px across (460 was asked; an upright page that fits 720 high does not allow it).
- **Title in the spread**: the closed notebook is one page wide and hinged at the gutter; a clip plane (`CLIP`, `clipL`) keeps the left page out of sight until the cover has come over. Pick page: one sketch on each page.
- **What leaves the molecule** goes up over the top edge of the right page and along the bench to its jar (the Bezier in the flyer loop). `fitWatch` / `fitLog` measure, on every frame of play, pixels of any atom past the gutter, the right page's edges or the track.
- **The cup is the re-deal** (`cupMake`, `cupFrame`, `cupAct`, `cupLeft`; the old `cupMakeOld`, `cupFrameOld` are dead code). Level = what the rules leave (`P.canRedraw(g)` in play, `CHOOSE.most - run.redraws` on the pick page, gold by `P.pairCost`). The round arrows are not drawn in the bench view. In every state recorded `P.canRedraw` was false in play although redraw, hand 5, rack 6, no shot, not redrawn: find out why before trusting the in-play sweep and deal.
- **The shop is a catalog page** (`SHOPV`, default `b` in the spread; `?shopv=0` the bench shop, `a` crate and `c` case are pictures only). `catInk` draws the plates (`eplate`, `eball`, `ebond`, `ebottle`, `ecoin`, `engrave2` for instruments from `snapPiece`); `ENGR` switches `fball`/`fbond` to engraving (1) or pencil (2, the acted picture on the right page). Picking: circle, then the real thing comes in from the bench's right edge (`shopFrame`, the `SHOPV === 'b'` branch).
- **Pace** (`feel.js`, `onReact`): `S.rn` counts steps inside one reagent's run and is set to 0 at each strike; `phases`, `Tn` and the arrow sound use it; `AA.sfx.arrow` gets `{ run, turn, turnOf }` too; `AA.sfx.runStart(run)` is called at each strike if it exists.
- Margin doodles: only flask, tally, sums and ring are left.

Not done: the stain from beneath; the life pass (arrivals with weight, idle life, camera overshoot); passing state to `AA.notesPick` and the second handwriting; the leftovers (lost round's second stroke and paper ball, cards staying at round end, card sizes, the bachelor's red mark, gold leaving on a loss); the leaf turn into and out of the catalog; the end-of-run and lost-round screens were not checked in the spread; `?shape=b` and the crate and case are not maintained.

scheme.html: bump `scheme.js?v=` and `feel.js?v=`.
