# Creature recipe: act and change of stage

For the builder of the next creature. Brimstone took a day and about ten rounds with the owner. What it learned is now in shared parts (`AA.rxKit.stage` in `kitart.js` block `W105`, `AA.rxKit.scene` in `scheme.js` block `S105`). Call them. Write only your creature's centrepiece and its deed.

## 1. The owner's standard (check every clip against this)

From `docs/HARNESS.md`, rulings BH, BO, BP, BQ. In the owner's words where quoted.

- [ ] It comes to the centre, large, with depth. "Think Pokemon evolutions." (BH)
- [ ] One picture, not layers. "I want everything to be interacting rather than looking like two or three distinct layers." Contact, a true shadow, the lamp's light on it and on the paper, correct overlap. The pages do NOT move. (BH)
- [ ] It is the creature itself on screen: its own body and face change shape. No stand-in prop. "Is this a stock animation you're using?" (BO)
- [ ] Nothing switches on in one frame. Things grow, fold, stretch, fall or fade. "The seedling egg just pops out of nowhere?" (BO)
- [ ] The four changes of one creature differ at a glance. (BO)
- [ ] Nothing joined to it reads as a hard object (no dark rod, no stiff thread). (BO)
- [ ] Clean drawing: no stray black lines, loose outlines, smoke bands or gloss. A pale creature must read on white paper. (BP)
- [ ] Fewer, simpler, clean moves. Water's evolution is the standard. Judge motion, not stills. (BP)
- [ ] Fluid frame to frame. "It jerks a lot and stutters." Moves fill their time, eased, with follow-through. Nothing ever frozen, no pose pops. Check consecutive frames, not samples. (BQ)
- [ ] It touches the world: hand on the atom, atoms dip and spring, marks on paper that fade, it meets the book's edge as an object. (BQ)
- [ ] Reuse Water's machinery; reskin only the substance. "I don't understand why you can't mirror the parts that made the water." (BQ)
- [ ] Never send a clip with a fault you can already see. (BP)

## 2. Order of work

1. **Stills first.** The five stages as stills, liked by the owner, before any motion.
2. **One change: 3 to 4.** Water's staging runs it (see 4). Your centrepiece, your gathering, your way home. Record, check, fix.
3. **All four changes** (1 to 2, 2 to 3, 3 to 4, 4 to 5). They must differ at a glance.
4. **Four molecules** for the change you trust: a small one, a ring, a chain with heteroatoms, fused rings. Use these three plus one of your own: `OC1CC(O)CC(O)C1`, `CSCC(CS)CCSC`, `CC12CCC3C(CCC4CC(O)CCC34C)C1CCC2O`.
5. **Then the act** (its trip to the molecule and its deed), stage 3 first.

One creature at a time. Add new blocks; do not edit Water's or another creature's.

## 3. How Water's staging is borrowed

The change of stage runs on Water's clip and scheme (`play31`, `C26.evo`, `S31`/`S32`/`S33`/`S36`). Your blocks only wrap:

- `C26.evo` (last): zero Water's curl and ball (`e.curl = e.ball = e.R = e.cy = 0`), set your own `e.go`, `e.old`, `e.sk`. Your timeline from Water's slots: `e.a` gathering, `e.b` standing, `e.v` beats after the hit, `e.home`. (W97)
- `stage31`: hide Water's ball, wash, beads. (W97)
- `play26` (last): your own shaping on the bones. Never MULTIPLY a value the idle sets each frame (no idle runs in `evo`): SET it. (W97)
- `make31`/`ink31`/`S33.sheet`: your centrepiece and its light. (W95, W96)
- Stand and way: wrap `S36.on` at run time, as `S101` does; `S105` shows the same with the shared parts.

The act runs on `C26.act`, fed by ONE function of the act's time, `j.bites.w26.b99 = { at(t), ... }`, read by the scheme and by the clip at its lagged time, so every joint follows from the same motion. (W99, S99)

## 4. Which shared part for what

All in `AA.rxKit.stage` (call it `ST`) and `AA.rxKit.scene` (`SC`). No creature numbers live in them: you hand yours in.

### Stand: `ST.findStand(opts)`
A place clear of every atom and bond for your body at rest and at its widest, nearest a preferred point, smaller in steps if nothing fits.

```js
const ST = AA.rxKit.stage, SC = AA.rxKit.scene, sh = ST.shape;
const st = ST.findStand({
  obs: SC.obsSeen(),                                  // atoms + 3 points a bond, as seen (raised atoms where the eye sees them)
  foot: (x, z) => SC.foot(x, z),                      // { X, Y, pp, pu } in the picture
  grid: { x0: -31.9, x1: 28, dx: 0.5, z0: zc - 3, z1: zc + 3.01, dz: 0.5 },
  shapes: [
    sh.ball({ u: Rl, up: 0.6, r: 1.5, sy: 1.15 }),    // your base (lump, pool)
    sh.prof({ u: Rb, base: 0.2, top: 5, w: MY_OUTLINE, grow: 0.05 }),   // your centrepiece at its widest: [[height, half width], ...]
    sh.box({ ux: H, uy: H, xs: 'pu', y0: 0.3, y1: 0.7, l: 0.74, r: 0.7, keep: { l: 40, r: 40 }, ink: 420 }),  // the new form's arms
    sh.zone({ ux: Rb, uy: Rb, l: 1.15, r: 1.15, y0: -0.2, y1: 4.8, keep: { t: 8, l: 12, r: 12 } })          // stay in the screen
  ],
  screen: SC.screen(), ink: SC.ink(MY_INK_1280),      // the page's own ink: a soft cost
  extra: (x, z, k) => SC.onBook(x, z, Rl * k) < 0.99 ? 50 : 0,
  prefer: { X: c0.X, Y: c0.Y, wy: 1.3 }, shrink: 0.95, tries: 9
});
// st = { x, z, k (the size it had to take), bad (0: clear), cover: [obstacles still covered], f: the foot in the picture }
```
Measure your shapes from your figure's joints in one take (S101 did it with `s101dbg().ext`). For the act, give `obs` from `SC.obsPage()` (atoms laid on the paper along the eye's line), `foot: (x, z) => ({ X: x, Y: z, pp: 1, pu: 1 })`, and keep the figure on its page with `extra` and `SC.page()` / `SC.offPage()`.

### Way: `ST.findPath(opts)`
```js
// change of stage: one curve, middle point searched (S101)
const way = ST.findPath({ kind: 'curve', from: [home.x, home.z], to: [st.x, st.z], n: 40,
  cost: (x, z, u) => { const g = ST.lay(sh.ball({ u: Rl * k, up: 0.6, r: 1.5, sy: 1.15 }), SC.foot(x, z), 1);
    let bad = 0; obs.forEach(o => { bad += ST.into(g, o, 10); }); return bad; } });
// act: round the molecule on a grid, pulled tight, corners rounded (S99)
const way2 = ST.findPath({ kind: 'grid', from: [a.x, a.z], to: [b.x, b.z], ok: (x, z) => clearOfAtoms(x, z),
  box: { x0: -32, x1: 31, z0: -21, z1: 12 }, gs: 0.5, near: 1.6 });
way.at(u);            // place at that part of the LENGTH: even speed
way.walk(t);          // eased ends (smoother step), t 0..1
ST.edgeAt(way, SC.onBook);   // where the book's edge is on it
```

### Travel on the ground: `ST.groundTravel(opts)`
```js
const st97 = {};   // keep per figure
const g = ST.groundTravel({ way, u: tripTime01, R: Rl, K: SC.onBook, lo: 0, hi: 0.26, ge, st: st97, back: false });
// g = { x, z, y, rx (tip), rz (rock), lift (in R), lx, lz (lean from real speed, for flames or hair) }
root.rotation.x += g.rx; root.rotation.z += g.rz; root.position.y = y0 + g.lift * lumpHeight;
```

### Hand-over at the clip's start and end: `ST.handOver(opts)`
```js
const H = ST.handOver({ ms: 300, frames: 10, fade: (S, k) => myFade(S, k), first: C => layLightNow(C) });
// in play26: clip 'rest' -> H.rest(S); first frames of the clip -> H.begin(copy); every clip frame -> H.hold(S);
// after the clip -> H.after(S) (into the idle over 10 frames, fade on); idle extras out at the start -> H.fadeIn(S, 450)
```
Lay the copy's light and tint on its FIRST frame (`first`). Fade the idle's extras over 8+ frames; never `hide` in one.

### Follow-through and the idle layer: `ST.follow`, `ST.lagged`, `ST.idle`
```js
const F = ST.follow({ n: chain.length, stiff: 60, damp: 9, gain: [0, 0.3, 0.7, 1] });
const off = F.step(vx, vy, vz, dtMs);           // real velocity in; each joint's lag offset out
const v = ST.lagged(t => pose(t).lean, t, [0, 70, 150, 230]);   // Water's way: the same motion, later per joint
ST.addInto(q, ST.idle(t, 1, myPhase));          // never-stopping breath, sway, glances, blink
```

### Helpers and errors
`ST.cl, sm, smm, eo, ei, eio, pulse, G2, lerp, wrap`. `ST.dbg()` gives the errors and the last plan of each part; `AA.rxKit.s105dbg()` the proof. Put both in your take job's output.

## 5. Recording

Kit: copy a builder's `.claude/rNN` (scripts only), change its ports and paths. `python srv.py`, `python fsrv.py` first. Headless Edge only, one take at a time, every command under `timeout`, kill only PIDs you started (`docs/HEADLESS.md`).

- Graphics card (a take in under a minute): `EDGEFLAGS="--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist"` in front of every take.
- Change of stage: `JOBN=a105 TMO=400 ./t.sh <name> "&hom=<creature>&part=evo&stage=<N>&lead=1000&hold=8400&smi=<SMILES, = as %3D>" 24`
- 60 frames a second: add `PAGE=vid60.html` (the recorder steps 16.67 ms). Give it more time (`TMO`).
- Frames land in `frames/<name>/f00001.jpg ...`, the job's output in `frames/<name>/log.json`.

## 6. The checker: `tools/anim_check.py`

```
FF=C:/Users/mgmcc/AppData/Local/Programs/Python/Python312/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe
python tools/anim_check.py .claude/r105/frames/<name> --ffmpeg "$FF" --crop 560,40,200,140 --on 30:60 --home 520,0,240,170 --tiles home.jpg
```
- JUMPS: frames over 2.2 times their two neighbours (encoder keyframes every 250 and cuts to number cards are left out). Exit code 1 if any.
- FROZEN: 10+ frames where the crop box hardly changes. Make the crop TIGHT on the creature: a large box hides a small figure's motion and reports a freeze that is not there.
- Tiles: first and last 15 frames on the home spot, for the hand-over.
- Look at every flagged frame (crop frames n-1, n, n+1 side by side) before you call it fixed or not yours.

## 7. Faults already seen (do not repeat)

Brimstone:
- Moves that snap across in 2 or 3 frames, then freeze for 6 to 8 (the first rebuilt clips). Fill the time, ease, follow through.
- A squash that starts at FULL strength the frame a branch begins; every lagged joint repeats the step later (the "eye flicker"). Every pose number must be a smooth function of time and run on from the branch before.
- The gaze and face stepping between clip branches (`lookx` 1 to 0.6 to 0).
- First frame of a change: the copy of the old figure shown at the new stage's size, its light not laid until frame two, its wisps out in one frame. Use `handOver` with `first`.
- At home the turn snapped from 5.3 radians to 0. Blend into the idle the short way round.
- The new figure's light kept at 0 because its idle was made while its light was out: the glow went out and stayed out.
- The lamp's round, the flash, the shade taking a new size in one frame. Follow them over 6+ frames.
- An idle number MULTIPLIED each frame in a clip with no idle: the glow grew without end. Set it.
- Water's curl into a glassy ball and its float through the air kept: "the sphere is still just like the water". The creature gathers its own way, on the ground.
- A flame as flat sheets: "a slapped on sticker". Give the centrepiece a body with depth in the room.
- Small flames that read as drops: a narrow foot, a belly, a long point drawn to its tip.
- A thread back to the lump drawn as a hard dark rod.
- A stand that covers the molecule, or wedged so the lump went through the chain on its way; a stand off the page or over the score ink.
- A fixed stand that put the act at the page's top edge, out of reach.
- A long way between two stands taken too fast.
- The ffmpeg "blip at 250" is the encoder's keyframe, not the picture. Check raw frames first.

Acid:
- The mouth-wave figure: rejected as an idea and as drawing ("hard to tell what it looks like"). A spirit with a face, readable at a glance.
- The pit as one flat painted sheet: seen low it is a disc. Model depth, do not paint it.
- Fume puffs as flat cards facing the eye.
- Arms stretching thin from a shoulder under the page while the claws are up.
- Looked at in stills only; sound not heard. Judge motion, on a clip.
