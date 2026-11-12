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
