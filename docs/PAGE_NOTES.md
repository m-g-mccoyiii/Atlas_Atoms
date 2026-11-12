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
