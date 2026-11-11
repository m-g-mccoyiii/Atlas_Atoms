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
