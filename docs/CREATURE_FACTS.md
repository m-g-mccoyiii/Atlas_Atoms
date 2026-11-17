# Creature facts, from the code

Read from the code of branch `fix-scoring` on 2026-11-16. Where a doc and the code differ, the code is right and this file says so. "P:" is `apps/steam/js/react/path.js`, "S:" is `scheme.js`, "K:" is `kitart.js`. Nothing was run; every number below was read from the source. Anything that could only come from a simulator is marked "doc only".

## Facts that hold for all ten

- **Gate.** A creature can go into a run only in a Doctorate (9 rounds). `TIERS[3].creatures = true`; Bachelor's and Master's have `creatures: false`, so `run.noHom` is set (P:898, P:2168). Postdoc (12 rounds, `TIERS[4]`) would allow it but `RULE.postdoc` is off (P:904). The pick page shows only when the profile has reached Master's (`stageOf >= 2`) and a jar has been seen (S:1678).
- **Jars fill in every run length**, held or not, win or lose. Every event raises `g.by[id]` for every creature it feeds (`homEvent`, P:1887); `runBank` adds them to `run.jar` and `endRound` adds them to the saved `meta.jar` (P:1918, S:1853). Exception: carbon dioxide is not given off in a Bachelor's (bare) run (P:994, `RX.MODE.co2 = RULE.co2 && !bareRun`).
- **Hatch.** A jar hatches at the end of the round in which `meta.jar[id] >= JFULL(id)` (S:1853). After hatching the same counter keeps rising with no cap: it is the lifetime count that sets the stage. Before hatching it is capped at full.
- **Stages.** `RULE.homGrow = 'keep'` (P:1776). Stage 2, 3, 4, 5 start at lifetime count `[2, 4, 7, 11] x jar size` (`HOMGROW.keep`, P:1762; `homStage`, P:1777-1786). Stage is read from `meta.jar`, so it is kept across runs, and a creature not held in a run still raises it whenever its food comes off. At hatch the count is 1 x full, so a new creature is stage 1. In the three modes other than `keep`, stage would come from jobs done in the run (`HOMGROW.run`); that is not the live mode.
- **At every stage the only change in play is the yield multiplier.** `homF` (P:1775) scales the tap by `HOMGROW.read[id][stage-1] / stage-3 number`; nothing else reads the stage: no limit, no lit condition, no count. The three per-atom creatures (acid, seedling, brimstone) keep their per-atom step at every stage; only their base number changes with stage.
- **Numbers.** "x" values below are as the player reads them (the rules multiply the yield by the square, `FLAT.pow = 0.5`, P:1178). They are `HOMGROW.read` (P:1763-1764), with acid, seedling and brimstone replaced by `HOMCOUNT.read` because `RULE.homCount = true` (P:1797-1803).
- **When it can be tapped.** After a page has fired, before the next is dealt: the round must be live, a page shot, nothing queued, not tapped on this page, and the round's tap not spent (`hom2Open`, P:1697). Once a round (`RULE.homOnce`, P:1695); Brimstone once a run (`RULE.brimOnce`; written at round end, P:2705). Lit test is `HOM2LIT` (P:1677-1688).
- **What a tap does to the molecule.** Only Water changes the molecule (`HOMS2[id].act`, P:1706-1710; `hom2Use`, P:1821-1850). Every other tap only multiplies the yield (Ammonia and Wood in the old rule also queued more reagents; see their sections). After a non-Water tap nothing zips until a further circle fires (`up.hold`, P:1842).
- **Speed class** (`jar: 'fast' | 'medium' | 'slow'` in `HOMS`) is a label only. Nothing reads it; the jar size is `JAR.full` (P:1540). (Checked by search.)
- **Jar sizes the code uses.** Two tables disagree for the wood spirit; see "Contradictions" at the end.
- **Where jars appear.** Default bench (`?bench=a`, the default, S:193): a low shelf at the back left of the bench, ten fixed places for all ten jars, `x0 -35, dx 3.72, z -30.5` (`BNZ.jar`, S:139; `jarPos`, S:1295). Drawn only when the profile has reached Master's and a run exists, not in the shop or the creature-pick page (S:4725). The pick page has its own shelf (`jarShelf`, S:1686). While a creature is held, its jar stays on the shelf and shows the round's feed so far (fill `0.1 + by/12`, S:4734). A hatched jar shows a third of its substance so the creature is seen through the glass (S:4734). A count written under the jar ("38/200") is drawn only when `?bench=0` (S:4273); I found none on the default bench.
- **Where the held creature stands in a run.** By the notebook at `BNZ.hom` (x 5.6, z -25.6, S:139, S:1371).
- **Change of stage on screen.** `g.homEvolved` is never set by a tap in `keep` mode (the lifetime count only changes at round end, P:1844-1848). The change is played in a later round of the same run, when `P.homStage(...)` reads a higher stage than the standing figure (S:3169, S:3234), so a creature that crosses a threshold at the end of round n changes at the start of play in round n+1 (if it is the held one).
- **Reagent a held creature puts on the rack** (`brings`, `runChoose`, P:2162): Wood spirit `nabh4` (reduce), Slime `bh3` (hydroborate), Ammonia `cyanohydrin`, Brimstone `chugaev`. The book no longer says so (the "Brings X." lines were removed, HOMUNCULI.md nineteenth).
- **Average to fill.** The code only says how much a jar takes, not how long. Run counts in this file are from `docs/JARS.md`, `docs/HOMUNCULI.md` and `docs/RIG.md` (simulated players, older builds). I could not verify any of them and none was re-measured. `RIG.md:812-822` gives, for the careful and the casual simulated player, the run in which each jar hatches under `keep`: Dry ice 8/15, Water 10/23, Hydrogen 12/30, Seedling 13/24, Acid 17/34, Ammonia 19/22, Brimstone 78/60; wood spirit and slime "do not fill" there (written before `jarStart`), salt "not kept by the simulator".

---

## 1. Water (`water`)

1. **Jar.** Fed by `water`: a group H2O leaving the molecule in a reaction (`r.gone`, kind `water`, P:1344), a piece used with water leaving (P:1503), or a step whose `off` is `{ water }` (`tallyOff`, P:665). The book's wording: "waters driven off" (P:438, P:459). Size `JAR.full.water` = 200 (P:1540). Class: fast (P:1546). A run feeds it with every water that leaves in any round. Average: JARS.md gives 5.9 runs (greedy) to 7.7 (median) at 200; RIG.md gives hatch at run 10 (careful) or 23 (casual). Doc only, not verified.
2. **Hatch / use.** Hatches at lifetime 200. Usable in a Doctorate only.
3. **Stages.** 2 to 5 at 400, 800, 1,400, 2,200. Multiplier x1.36, x1.83, x2.19, x2.54, x2.92 (P:1763). Only the multiplier changes. Kept across runs.
4. **Lit / tap.** Lit when 3 or more waters came off during this page (`HOM2LIT.water`, P:1678, `HOMS2K.water.need = 3`, P:1650). Tap (P:1826): the yield is multiplied by the stage number, every C=C outside a benzene ring becomes C-OH, every closed ring opens, the rings close again and the zip runs on (`HOMS1.water.act`, P:1548). Once a round.
5. **Shown.** Look: the blue water spirit, one skin with a pen-and-wash look, rising out of its own puddle; five forms: newborn (crown only), child, youth, adult (long hair as a fall, hand with spilling water), elder (crown of breaking water, foam beard) (K:1436-1475, K:1503). Idle: its own rest clip (K builder 26-30). Act: arm reaches over the molecule, a lump of water goes down the arm for each OH (K:8220-8355). Change of stage: its own curl-and-ball clip (K:2038, K:2177, K:8220, K:8829). Jar: on the shelf; blue (`0x3a6fd0`, S:1291).
6. **Odd.** HOMS2K.water.k (1.5) is overwritten at load by `homNumbers` from the stage-3 number (P:1767-1771); so the HOMS2K numbers in the source are not the live ones. JARS.md still calls the tap "the zip runs again, counting on" and says 3 waters feed it per tap; in the live rule the jar and the tap are separate (jar fills across runs; the tap needs 3 waters on this page).

## 2. Hydrogen (`h2`)

1. **Jar.** Fed by `h2`: a group HH leaving (kind `h2`, P:1344; `off.hydrogen` steps, e.g. oxidize on an OH at a chain end, `rules.js:879`, `896`, `913`, bridge `768`/`778`, the phlogiston sigil). Book: "hydrogens driven off". Size 130. Class: fast. Average: JARS.md 7.5 / 6.2 runs; RIG.md hatch at run 12 / 30. Doc only.
2. **Hatch / use.** Lifetime 130; Doctorate only.
3. **Stages.** 2 to 5 at 260, 520, 910, 1,430. Multiplier x1.50, x1.86, x2.15, x2.39, x2.75. Only the multiplier. Kept.
4. **Lit / tap.** Lit when 2 or more hydrogens came off during this page (`HOMSIMPLE.h2.need = 2`, P:1674; `HOM2LIT.h2`, P:1679). Tap (P:1827): the yield is multiplied; nothing else. No chain carried on, no bet, any page. Once a round.
5. **Shown.** Look: a floating mote of two lobes with a face on the big one, thin wisp arms, a pale sky wash with rose-lilac edges; stage 4 adds one smaller mote on a thread of light, stage 5 four (K:6919-6933). Idle: its own, floats and wobbles (K:7068). Act: the whole figure flies to the molecule; stage change: its own rising-ball clip (K:7232, K:8552, K:8673). Jar: shelf, rose (`0xe58a7c`).
6. **Odd.** The older rule (two reagents with oxidize second, a chain floated to the next page, a "pop" of 0.6) is still in the code (`HOMS2K.h2.pop`, `REF_HOM0`, `homAfter`, P:1733) but `RULE.homSimple.h2 = 'a'` switches it off (P:1675). The HOMS entry `need: 3` (P:1551) is the old rule's and is not read in the live rule. JARS.md and HOMUNCULI.md first tables describe the old tap (a C=O becomes OH); that is not what the tap does now.

## 3. Dry ice (`co2`)

1. **Jar.** Fed by `co2`: a group COO leaving (kind `co2`, P:1344), which only oxidize on a C=C at the very end of a chain gives (`rules.js:883`, `893`; docs/HOMUNCULI_2.md:311). Not given off in Bachelor's. Size 50. Class: medium. Average: JARS.md 9.9 / 15 runs; RIG.md hatch at run 8 / 15. Doc only.
2. **Hatch / use.** Lifetime 50; Doctorate only.
3. **Stages.** 2 to 5 at 100, 200, 350, 550. Multiplier x1.91, x2.40, x2.82, x3.89, x4.50. Only the multiplier. Kept.
4. **Lit / tap.** Lit on the last page only, when 3 or more reagents of the rack never acted this round (`HOM2LIT.co2`, P:1680; `hom2Shut`, P:1658; `noCO2: true`, so no carbon dioxide is needed in the round). Tap (P:1831): the yield is multiplied by the stage number (the stage number is the base number to the third power; `most: 3`). Once a round.
5. **Shown.** Look: the "shy one", a round heavy fog figure hugging or holding a small frosted ice block, banks of fog rolling along the bench, cold white and grey-violet wash; stage 5 an old hooded figure bowed over the block, frost ferns (K:3390-3401). Idle: its own (fog rolls, mist, wisps; K:3551). Act: it slides over as a tide of fog and frost falls on the atoms (K:3696). Change: "the whiteout" (K:3779). Jar: shelf, pale blue (`0xa9d8ee`).
6. **Odd.** The tap does not freeze rings in the live rule. `HOMS.co2.act` (freeze, `pay: 2`, P:1566-1569) is replaced by the v2 entry, whose `act` returns nothing (P:1710). JARS.md describes freezing and pay-twice, and the frost wash of K:3531 (`rime49`) is art for it; neither has any effect. The book says "Keep 3 reagents idle to the last page" (P:450) which matches the live rule.

## 4. Acid (`acid`)

1. **Jar.** Fed by `use:hydrate` and `use:dehydrate`: each time hydrate or dehydrate acts (`homEvent(g,'use:'+id)` when `r.hits`, P:1416). Book: "uses of hydrate or dehydrate". Size 200. Class: medium. Average: HOMUNCULI.md says about 12 runs (median simulated player, old build); RIG.md hatch at 17 / 34. Doc only.
2. **Hatch / use.** Lifetime 200; Doctorate only.
3. **Stages.** 2 to 5 at 400, 800, 1,400, 2,200. Base number x1.92, x2.50, x3.11, x3.20, x3.20 (`HOMCOUNT.read.acid`, P:1798; stage 4 and 5 are held at x3.20 by `HOMCOUNT.cap`, P:1797). Per-atom bonus at every stage: each atom more than 2 chewed off multiplies by x1.20, and that step is not capped (P:1797, P:1816-1817). Nothing else changes with stage. Kept.
4. **Lit / tap.** Lit when the molecule has 2 or more fewer heavy atoms than when the page began (`HOM2LIT.acid`, P:1681, `loss: 2`). Tap (P:1832): the yield is multiplied by base x 1.20^(atoms chewed - 2) at tap time. Once a round.
5. **Shown.** Look: the "sneak", a lean green flame-headed spirit with slanted eyes and long clawed fingers, rising from a pit eaten in the wood; five forms from a spark peeping over its pit to a "devourer" with five flames (K:2685-2695). Idle: its own (K:2840). Act: eats the leavings off the page, a claw lifts each, a jaw opens (K:3172, K:9200, K:9365). Change: its own body melts, heaves and rises (K:2985, K:3291, K:8848). Jar: shelf, yellow-green (`0xd4e21a`).
6. **Odd.** The tap does not chew the molecule: the atoms must already be gone (by other reagents) for it to light. The old text ("eats down long CH2 stretches, rings close across six", P:1572) is the old entry `HOMS1.acid`, no longer used. JARS.md still lists that rule. The count at tap time is read from the molecule as it stands (`homCountN`, P:1808).

## 5. Wood spirit (`wood`)

1. **Jar.** Fed by `use:nabh4` (reduce acts) and, because `RULE.jarStart = true` (P:1885), also by `dud`: any reagent lined up that finds nothing (`waste`, P:1953). Book: "reagents that found nothing, or uses of reduce" (P:1884). Size: `JAR.full.wood` = 40 (P:1540) but `JARSTART.full.wood` = 250 (P:1884); the book and the stage thresholds read 250 (`jarFull`, P:1886) while the page's hatch test reads 40 (S:1293). See "Contradictions". Class: medium. Average: HOMUNCULI.md says about run 30 at a jar of 250 (simulator, old); RIG.md says it did not fill before `jarStart`. Doc only.
2. **Hatch / use.** On the page's test it hatches at lifetime 40 (S:1853). Doctorate only.
3. **Stages.** With the jar size the stage code uses (250): 500, 1,000, 1,750, 2,750. Multiplier x1.54, x1.72, x1.88, x2.08, x2.38. Only the multiplier. Kept. (If the stage code used 40 they would be 80, 160, 280, 440; it does not.)
4. **Lit / tap.** Lit when one of the page's first three reagents found nothing to act on (a "dud") (`HOMSIMPLE.wood`, `HOM2LIT.wood`, P:1682). Tap (P:1828): the yield is multiplied; he pours nothing and empties no bottle. Any page. Once a round.
5. **Shown.** Look: a seated figure of clear thin liquid, round belly, legs out, one arm raised in a toast with a pale flame on its fingers, vapour off its head, faint warm rose wash (K:7635-7648). Idle: its own (K:7789). Act: none of its own found (the page falls back to Water's clip, per K:7635 and the lack of a wood act block). Change of stage: none of its own found; same fallback. Jar: shelf, brown (`0x9a6b3a`).
6. **Odd.** The jar-size contradiction above. The older rule (pours every dealt reagent, `pay`, `empty`, `first`) is still in `HOMS2K.wood` and `hom2Use` (P:1834) but switched off by `homSimple`. The entry's `tok` text is the old one, `HOM2TOK.wood` gives the live text.

## 6. Salt (`salt`)

1. **Jar.** Fed by `endox`: oxidize (`pcc`) landed while the molecule has an OH on a CH2 at a chain end (`RX.homs.endOls(g.m).length`, P:1416; `rules.js:1317`). Book: "chain-end OH oxidized". Size 50. Class: medium. Average: HOMUNCULI.md about 12 runs (old build); RIG.md: the simulator did not keep salt's jar. Doc only.
2. **Hatch / use.** Lifetime 50; Doctorate only.
3. **Stages.** 2 to 5 at 100, 200, 350, 550. Multiplier x1.54, x1.87, x2.13, x2.36, x2.64. Only the multiplier. Kept.
4. **Lit / tap.** Lit when this page's first reagent is the first reagent of the previous page, both pages having three circles, and not a finishing or bank circle (`HOM2LIT.salt`, `match: 1`, P:1683). Tap (P:1835): the yield is multiplied and that first reagent gets its use back. Once a round.
5. **Shown.** Look: a living crystal cluster, one cube tipped on a corner that is body and face, small cubes budding out of it, one or two shard hands, flat pale grey-blue and grey-violet wash; stage 5 a great cube on a bed of crystals with a halo of shards (K:4586-4598). Idle: its own (K:4812). Act: walks like a tipping box (K:4948). Change: "the geode" (K:5055). Jar: shelf, off-white (`0xe9e4d6`).
6. **Odd.** The old tap (cure a C=O, rings close on it) is `HOMS1.salt` and not used; JARS.md still describes it. The jar's source (an oxidize on a chain-end OH) is narrow; nothing in the code says how often it happens (unverified).

## 7. Slime (`slime`)

1. **Jar.** Fed by `use:bh3` (hydroborate acts) and, with `jarStart`, by `twice`: the second landing of one reagent on a page (P:1417). Book: "pages with one reagent landed twice, or uses of hydroborate". Size 70 (both tables agree). Class: medium. Average: HOMUNCULI.md: run 25 (careful) or 70 (casual) with `jarStart`, simulator, old. Doc only.
2. **Hatch / use.** Lifetime 70; Doctorate only.
3. **Stages.** 2 to 5 at 140, 280, 490, 770. Multiplier x1.55, x1.76, x1.98, x2.17, x2.38. Only the multiplier. Kept.
4. **Lit / tap.** Lit when one reagent of the page's first three landed twice, each landing (`same: 2`, `steps: 0`, `hom2Own`, P:1662-1665, P:1684). Tap (P:1833): the yield is multiplied and that bottle is empty for the rest of the round. Once a round.
5. **Shown.** Look: a low wide heap with no head, face in the mass, a thick drooping arm with strings back to the body, dusky violet-pink wash; five forms from a small blob with a thread to a vast mire (K:3978-3991). Idle: its own (K:4105). Act: throws a pseudopod and leaves strings on what it touches (K:4284). Change: "the pull" (K:4367). Jar: shelf, violet (`0x8a5ad0`).
6. **Odd.** The old tap (stick two carbons with two of slime; rings cross) is `HOMS1.slime` and unused. `HOMS2K.slime.k2` and `stuck` (shut the bottles for the next page, P:1727) belong to the old rule and are dead with `same` set.

## 8. Seedling (`seedling`)

1. **Jar.** Fed by `use:allyl` (grow acts). Book: "uses of grow". Size 120. Class: slow. Average: HOMUNCULI.md about 21 runs (old); RIG.md hatch at run 13 / 24. Doc only.
2. **Hatch / use.** Lifetime 120; Doctorate only.
3. **Stages.** 2 to 5 at 240, 480, 840, 1,320. Base number x1.19, x1.38, x1.54, x1.79, x2.16 (`HOMCOUNT.read.seedling`). Per-atom bonus at every stage: each atom added beyond 6 multiplies by x1.06 (P:1797). Nothing else changes with stage. Kept.
4. **Lit / tap.** Lit when the molecule ends the page 6 or more heavy atoms bigger (`gain: 6`, `HOM2LIT.seedling`, P:1686). Tap (P:1837): the yield is multiplied by base x 1.06^(atoms added - 6) at tap time (`homCountOn` needs `rise === false`, true). Once a round.
5. **Shown.** Look: a spirit that grows from a cracked seed (brown-violet) with a hooked stem and nodding bud head, to a bloom with petals (pink) and leaves (green), on root feet (K:5168-5181). Idle: its own (K:5306). Act: tendrils reach each atom, leaf marks are left (K:6797). Change: "the sprouting" (K:7351). Jar: shelf, green (`0x3f9a4f`).
6. **Odd.** The tap does not grow anything. The old tap (grow nine carbons with three C=O, `HOMS1.seedling`) and the rising or wilting rule (`rise`, `wilt`, `homAfter`, P:1737-1740) are inactive. The book text "Add 6 atoms" means the player must add them with other means for it to light.

## 9. Ammonia (`ammonia`)

1. **Jar.** Fed by `nh3` (an `off.ammonia` group leaves, only the `cyanohydrin` reagent gives it, `rules.js:904`; P:665) and `use:ritter` (aminate acts). Book: "aminate landings or ammonias driven off". Size 40 (P:1540; the comment at S:1293 saying the table has no count for it is stale). Class: slow. Average: RIG.md hatch at run 19 / 22 (simulated). Doc only. Whether a new profile has aminate or cyanohydrin in its rack was not checked.
2. **Hatch / use.** Lifetime 40; Doctorate only.
3. **Stages.** 2 to 5 at 80, 160, 280, 440. Multiplier x1.24, x1.48, x1.73, x1.96, x2.21. Only the multiplier. Kept.
4. **Lit / tap.** Lit when aminate (`ritter`) acted on this page, or a knit step is in its chain (`HOM2LIT.ammonia`, P:1685). Tap (P:1836): the yield is multiplied by the stage number; the page's line (up to three reagents) gets a use back and fires again as further circles. Once a round.
5. **Shown.** Look: "the whiff", a pale teal gust reared up on a slant with a pointed head, streaks of vapour swept back, needle arms, a three-toed foot (K:7522-7534). Idle: its own (K:7946). Act: a "fencer" of straight lines and dead stops (K:8081). Change of stage: none of its own found; the stage clip falls back to Water's (K:8213 plays only the act). Jar: shelf, pale blue-grey (`0xbcd6dc`).
6. **Odd.** `HOMS2K.ammonia.k` is 0 in the source and set to the stage-3 number at load (P:1650, P:1770); `HOM2TOK` text shows a number only if k is non-zero. `RULE.ammoniaLimits` (off, P:1836) would give the second firing the page's usual limits. The held creature puts `cyanohydrin` on the rack (`brings`).

## 10. Brimstone (`brimstone`)

1. **Jar.** Fed by `sulfur` (an `off.sulfur` group leaves; only the `chugaev` reagent gives it, `rules.js:907`, P:665) and `use:thiolene` (thiolate acts). Book: "thiolate landings or sulfurs driven off". Size 80. Class: slow. Average: RIG.md hatch at run 78 / 60 (simulated, old); the slowest. Doc only.
2. **Hatch / use.** Lifetime 80; Doctorate only.
3. **Stages.** 2 to 5 at 160, 320, 560, 880. Base number x1.17, x1.30, x1.39, x1.52, x1.59 (`HOMCOUNT.read.brimstone`). Per-sulfur bonus at every stage: each sulfur beyond the first multiplies by x1.12 (P:1797); with the sigil Sulphur's Mask held each OH on the molecule counts as a sulfur (`maskOH`, P:1810). Nothing else changes with stage. Kept.
4. **Lit / tap.** Lit when thiolate acted on this page or a cap step is in its chain, on any page including the last (`HOMSIMPLE.brimstone.last`, `HOM2LIT.brimstone`, P:1687). Tap (P:1829): the yield is multiplied by base x 1.12^(sulfurs on the molecule - 1) (zero extra if there is none); the round ends now and the task counts as met (`up.end`, `up.burnt`, `specMet`, P:2596). Once a run (`homSpent`, P:1696, P:2705).
5. **Shown.** Look: a crusted lump of burning sulfur with a creature of smoke rising out of it, ember eyes, small blue flames; umber, charcoal, red cracks, no yellow in the figure; five forms from an ember to a burning mountain (K:5457-5471). Idle: its own (K:5632). Act: rides its lump to touch the sulfurs (K:6693, K:6770, K:8384). Change: its own body changing (K:6129, K:8422). Jar: shelf, gold (`0xc9a227`).
6. **Odd.** `HOMSIMPLE.brimstone.k` is 0 in the source and set to the stage-3 number at load. The old half-done rule with k2 (x after page two) and `half` is inactive. The held creature puts `chugaev` on the rack.

---

## Contradictions and stale text found

1. **Wood spirit jar size.** Page says 40 (`JFULL = P.JAR.full`, S:1293, used by the hatch test, S:1853, the fill level S:4734 and the pick page S:1688). Book and stage thresholds say 250 (`jarFull`, P:1886, P:1778, P:513). So it hatches at 40, but stage 2 comes only at lifetime 500, and the book row shows "250".
2. **JARS.md and HOMUNCULI.md first tables describe taps that are not in the live code** (acid chews and reach 6, salt cures, slime sticks, seedling grows, dry ice freezes, hydrogen turns C=O to OH, wood pours). They are `HOMS1` entries, used only if `RULE.homs2` is off. The live tap is the `HOMS2` entry: only Water changes the molecule.
3. **`need: 3` / `fed` feeds of the old design** (HOMS entries, `g.hom.fed`, `homFed`) are not read by the live rule. Creatures are lit by play, not by a count of food.
4. **Numbers in `HOMS2K` and `HOMSIMPLE` are overwritten at load** (`homNumbers`, P:1767-1772) by the stage-3 numbers.
5. **Jar speed labels are not used by any code**; the sizes are not in proportion (water 200 "fast", dry ice 50 "medium", ammonia 40 "slow").
6. **Jar counts are drawn as text only with `?bench=0`**; on the default bench none was found.
7. **Wood spirit and Ammonia have no change-of-stage clip of their own and Wood has no act of its own** in `kitart.js` (searched by builder headers; they fall back to Water's clips). Not played in a browser.
8. **Rules the player is not told:** a held Wood spirit, Slime, Ammonia or Brimstone adds a reagent to the rack; a hatched jar keeps counting and sets the stage; the stage is raised even when the creature is not held; the stage change is shown in a round after the count crosses.

---

## Table

Stage multiplier = what the player reads on the yield. Per-atom: acid x1.20 per atom beyond 2 chewed, seedling x1.06 per atom beyond 6 added, brimstone x1.12 per sulfur beyond 1.

| Creature | Fed by | Jar size (hatch) | Stage 2, 3, 4, 5 at lifetime | x at stages 1 to 5 | Tap |
|---|---|---|---|---|---|
| Water | waters off | 200 | 400, 800, 1,400, 2,200 | 1.36, 1.83, 2.19, 2.54, 2.92 | multiplies yield; C=C to C-OH, rings open and close again; lit by 3 waters off this page |
| Hydrogen | hydrogens off | 130 | 260, 520, 910, 1,430 | 1.50, 1.86, 2.15, 2.39, 2.75 | multiplies yield only; lit by 2 hydrogens off this page |
| Dry ice | carbon dioxide off | 50 | 100, 200, 350, 550 | 1.91, 2.40, 2.82, 3.89, 4.50 | multiplies yield only; lit on the last page with 3 rack reagents never acted |
| Acid | hydrate or dehydrate acts | 200 | 400, 800, 1,400, 2,200 | 1.92, 2.50, 3.11, 3.20, 3.20 (+ x1.20 per atom beyond 2) | multiplies yield only; lit when 2+ atoms gone this page |
| Wood spirit | reduce acts, or a reagent finds nothing | 40 on the page, 250 in the book | 500, 1,000, 1,750, 2,750 (from 250) | 1.54, 1.72, 1.88, 2.08, 2.38 | multiplies yield only; lit when a reagent of the first three found nothing |
| Salt | oxidize on a chain-end OH | 50 | 100, 200, 350, 550 | 1.54, 1.87, 2.13, 2.36, 2.64 | multiplies yield; first reagent gets its use back; lit when this page's first reagent = last page's first |
| Slime | hydroborate acts, or one reagent lands twice | 70 | 140, 280, 490, 770 | 1.55, 1.76, 1.98, 2.17, 2.38 | multiplies yield; that bottle empty for the round; lit when one reagent landed twice |
| Seedling | grow acts | 120 | 240, 480, 840, 1,320 | 1.19, 1.38, 1.54, 1.79, 2.16 (+ x1.06 per atom beyond 6) | multiplies yield only; lit when the page added 6+ atoms |
| Ammonia | aminate acts, or ammonia off | 40 | 80, 160, 280, 440 | 1.24, 1.48, 1.73, 1.96, 2.21 | multiplies yield; the page's line fires again, uses back; lit by aminate landed or a knit |
| Brimstone | thiolate acts, or sulfur off | 80 | 160, 320, 560, 880 | 1.17, 1.30, 1.39, 1.52, 1.59 (+ x1.12 per sulfur beyond 1) | multiplies yield; round ends, task met; once a run; lit by thiolate landed or a cap |
