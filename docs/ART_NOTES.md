# Overreact: art notes (kitart.js)

Everything here is in `apps/steam/js/react/kitart.js` (`AA.rxKit`). Nothing else was touched. Pictures are in `.claude/shots/art-*.png`; the test page that made them is `.claude/art/grid.html` (not in git).

## What changed

- The ten creatures are redrawn in the hand of the equipment: thick ink line, flat color from the palette, one white highlight, no faces on anything (two small dots for eyes on water, acid, wood, salt, slime, seedling, brimstone; none on hydrogen, dry ice, ammonia).
- A jar for each creature, with a fill level and three stages.
- The weak pieces are redrawn: goat, ouroboros (was a wreath), stone (was a red hexagon), transmute (the two slabs), candle (skull), ouija, homunculus (jar, now faceless), scalepan weights.
- One coin, in 3D and in 2D.
- Every piece is fitted to one box.
- Methanol and ethylene as small ball-and-stick molecules on a wooden foot.
- `build(id, T, group, color, extra)` has a new fifth argument `extra` (`{ raw: true }` skips the box fitting, `{ ink: n }` sets the ink thickness, `{ jar: true }` leaves out what lies on the page). The old four-argument calls work as before. `AA.rxKit.finish(T, grp, thickness)` takes an optional thickness.

## The ids

Creatures (`build(id, ...)`; the page's `HOMID` already has the first eight): `homwater`, `homh2`, `homco2`, `homacid`, `homwood`, `homsalt`, `homslime`, `homammonia`, `homseed`, `hombrimstone`. `AA.rxKit.HOMID` maps the keys of `P.HOMS` (water, h2, co2, acid, wood, salt, slime, ammonia, seedling, brimstone) to these. New: `homammonia` (stoppered bottle of smelling salts, fuming), `hombrimstone` (sulfur lump on a smouldering stone). `homclay` is the faceless clay man inside the homunculus jar.

Jars: `jar_<key>` (one jar, half full), `jars_<key>` (three jars at speck, half grown, ready, for looking at). Equipment: `homunculus` (now a jar with a faceless clay man), `coin`, `methanol`, `ethylene`.

## Posing a creature (the page does not need to know the parts)

```js
const fig = AA.rxKit.creature(T, 'water', color);   // a Group, feet at y = 0, about 2.4 tall; null if the key is unknown
AA.rxKit.pose(fig, { lean: [dx, dz], reach: 0..1, squash: -1..1, t: seconds });
AA.rxKit.poseToward(fig, T, worldPoint, reach, squash, t);   // the same, but give it a point in world space
```

- `fig` is a Group; `build('homwater', T, group, color)` into your own group works too and sets `group.userData.rig`; pose that group.
- `lean` is a direction on the page in the creature's own frame (x right, z toward the viewer). Its length (0 to 1) is how far the body tips from its feet. The arms swing toward the same direction as far as `reach` says (0 hangs, 1 stretched out toward it). Slime's arms also grow longer with reach.
- `squash` 1 is flat and wide (a step lands), -1 tall and thin (a stretch or hop). 0 is the rest pose.
- `t` adds a slow breath. Calling `pose(fig, {})` returns to rest. Seedling's shoot also leans toward a reach.
- If the creature sits inside a tilted group, `poseToward` works out the direction with `worldToLocal`, so give it the world position of whatever it reaches for.

## Drawing a jar's fill (no "0/150" text needed)

```js
const j = AA.rxKit.jar(T, 'water');      // a Group about 2.5 tall, 2 wide, foot on y = 0
j.userData.set(fill, stage);             // fill 0..1 = count / P.JAR.full[key]; stage optional
```

- Fill is the level of the substance in the glass, from empty to the lid. If `stage` is left out it is chosen from the fill: under about a third a speck sits on the foot, up to just short of full the creature stands in it half grown, and at 1 it stands there ready (the page's `P.JAR.stages` are 0.12, 0.5 and 1: pass `stage` 0, 1 or 2 yourself to use those).
- Each jar builds its creature twice (small and big) when made, so make the jars once and call `set` each frame or when the count changes.
- The jar is built in the toy look, like the equipment, and stands upright at its own size; the page tilts it and scales it as it does now (the old page code leans the group by -0.8 and scales by 1.2).

## The coin

Every coin is the same drawing:

- On the ink canvas: `AA.rxKit.drawCoin(ctx, x, y, r, { turn: 0..1, alpha })`. `turn` spins it (a coin flipping on its height).
- In 3D: `AA.rxKit.build('coin', T, group, color)`. It lies face up (it is in `FLAT`); about 2 across.

The page must call these in place of its three coin drawings.

## Scale

`build()` now fits every piece (not creatures, jars or the coin) to one box: 2.5 wide at most and 3.1 tall at most, flat pieces (`FLAT`) 2.9 wide, scaled up as well as down (limits 0.25 to 2.4). The page's own fitting in `piece()` (`Math.min(1.7, 3.0 / ..., 3.3 / ...)`) then comes out about the same for everything, so that line still works; it may be dropped. The ink thickness is kept the same on screen after the scaling. `transmute` is no longer in `FLAT` (it stands and is seen from the front).

## What the page builder must change in scheme.js to use these

1. Jars: replace the jar code (`jars` built near `JGLASS`, the `fill`, `speck`, `small`, `full` meshes) with `AA.rxKit.jar(T, key)` and call `j.userData.set(count / P.JAR.full[key], stage)`. `homFig` can use `AA.rxKit.creature(T, key, color)`; add `ammonia: 'homammonia'` and `brimstone: 'hombrimstone'` to `HOMID` or use `AA.rxKit.HOMID`. `JARC` needs an entry for ammonia and brimstone if the page still uses it.
2. Posing: where creatures hop or squash, call `AA.rxKit.pose` or `poseToward` on the creature's group (see above). The old creatures were one flat set of parts, so any code that scaled or rotated them as a whole still works.
3. Coins: use `drawCoin` (2D) and `build('coin')` (3D) everywhere.
4. The `FIRE` table in `piece()` has ids that still exist; the new ids `coin`, `methanol`, `ethylene` are not in it (they hop).
5. Bump `kitart.js?v=` in `scheme.html` and `.claude/rec.html` (not done here, those are not this builder's files).

## Not done

- No `docs/VISUAL_AUDIT.md` existed on the branch, so the weak pieces were chosen from the pictures and the brief, not from the audit's numbered faults.
- Not redrawn (still hard to read at 70 px): `schlenk`, `cannula`, `reflux`, `recycler`, `sieves`, `scrubber`. They are tangles of glass and pipe; a tidy silhouette needs a decision on what each should be.
- Not seen in the real page, only on the test page (headless Edge, software GL, 1280 by 720). The test page has no shadows on the objects themselves (the page has none either), only a soft shadow on the ground.
- The idle breath and a hop are not animated here; the page drives `pose` over time.

## Second pass (names: instrument, homunculus, runoff, gold)

Pictures: `.claude/shots/art2-*.png`.

### Hooks

- `AA.rxKit.pose(fig, { lean, reach, squash, t, tuck })`: `tuck: true` folds a creature's arms in and gives it the character it has in a jar (crab hunched low, balloon rising and bobbing with `t`, string coiled, bottle leaning, ammonia leaning the other way, slime slumped, acid slumped forward).
- `AA.rxKit.use(group, s)`: the in-use pose of an instrument, `s` 0 (rest) to 1 (in use), any value between. No parts needed. Calling `use(g, 0)` returns to rest; a built instrument is already at 0.
  - mirror: 1 tilts back to face the work. crystal: 0 is the seed, 1 grown. magnet: 1 leans in. bunsen: 0 flame low, 1 flame high.
  - burette: 0 to 0.5 a drop forms, 0.5 to 1 it falls into the flask. voodoo: 0 to 0.5 the first pin goes in, 0.5 to 1 the second.
  - paw: the fingers curl one at a time, thumb first (0.2 per finger). recycler: 1 is a third of a turn (turn it again for a loop).
  - cannula: 0 to 1 a drop runs along the needle from the left flask to the right.
- `AA.rxKit.jarReport(T)`: for every creature at the speck, half and ready stages, how far from the jar's axis it reaches and its lowest and highest point, against the glass (kept to 0.84 of 0.9) and the lid (kept to 2.2 of 2.3). All 30 rows pass; the table is `art2-jars-table.png`. Ready creatures press toward the glass (wood and ammonia lean to 0.78, the crab to 0.8) but never touch it.
- Jar ids for looking: `jar_<key>` (half full), `jarr_<key>` (ready), `jarh_<key>` (half grown), `jars_<key>` (all three).

### New or redrawn ids

- Redrawn to be bold: `schlenk` (three taps, three flasks), `cannula` (long needle arching between two flasks), `reflux` (flask over a flame, water jacket, a red arrow up and a blue arrow down), `recycler` (three green arrows chasing round a triangle), `sieves` (a wire sieve with a drop in it), `scrubber` (wash bottle with bubbles), `stopper` (flask, big cork, arrow), `coldtrap` (ice bucket with a drop falling in), `hood` (cabinet with an arrow up the duct), `transmute` (lead bar, arrow, three gold bars), `spatula` and `crystal` (bigger), `burette` (thicker tube, bigger drop).
- Instruments with an in-use pose: `mirror`, `crystal` (the seed crystal), `magnet`, `bunsen` (the burner), `burette`, `voodoo`, `paw`, `recycler`, `cannula`.
- Runoff, each one bold shape readable at 24 px: `ro_water` (drop), `ro_h2` (two hydrogens bonded), `ro_co2` (O=C=O), `ro_acid` (green fumes), `ro_nh3` (pale puff with two pungent dashes), `ro_sulfur` (crumb). Like other pieces they are fitted to the same box; the page scales them.
- Yield marks, flags on poles: `mark_stable` (blue, a disc), `mark_unstable` (yellow, saw edge), `mark_volatile` (red, a flame), `mark_overreact` (black, a hot center, a second flag). `coin` / `drawCoin` at 16 and 24 px is in `art2-coin-16-24px.png`.

### The audit at 70 and 140 px (all pages, `art2-audit-*.png`)

A first-time player could name (from the shape alone): balance, mortar and pestle, mirror, clamp stand, magnet, hot plate, card box, notebook, burner, thermometer, stopwatch, magnifier, hourglass (and timer), dropper, coin, methanol, ethylene, goat, ouija board, skull candle, snake ring, crystal ball, duck, cat, coffee cup, lab coat, milk carton, raven, goggles, clipboard, extinguisher, voodoo doll, grimoire, scroll, recycle arrows, flasks joined by a needle, row of flasks, sieve, wash bottle, flask and cork, ice bucket, U tube, and the five runoff and four marks.

Could not (at first sight): spatula, litmus fan, carousel, poison bottle, idol, glory hand, intern, mystery bottle, elixir flask, tower picture, hood, the paw as a paw, and two hourglasses that look the same (`timer` and `hourglass`). Redrawn from that list: spatula, crystal, transmute, hood, burette. Not redrawn: litmus, carousel, regia, idol, glory, intern, mystery, elixir, tower, paw (a hand with the fingers up reads as a hand, the in-use curl makes it a paw), and the timer and hourglass pair, which still need one of them dropped or changed. The honest limit: a name needs the page's label under it at 70 px for the pieces that are ideas more than objects (litmus, carousel, stopper).

### What the page builder does

Call `AA.rxKit.use(group, s)` where an instrument is used (the group is the one passed to `build`, not its parent). The `ro_*` ids are for the things that fly to a jar; `mark_*` for the track.
