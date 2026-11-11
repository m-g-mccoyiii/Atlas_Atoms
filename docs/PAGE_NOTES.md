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
