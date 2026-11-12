# Overreact: making the action exciting

2026-11-11. The owner watched the first gameplay videos and said: "The action itself doesn't feel exciting at all." A game-feel director timed the videos frame by frame, two researchers gathered how the best games make their central moment land, a designer wrote three directions with exact numbers, and a reviewer went over them. The builder builds all three behind a switch and records each with sound; the owner picks.

**Where the review below gives replacement text, the review wins.**

**Overreact: three directions to make the overreaction feel exciting**

All timings are in milliseconds (ms) or seconds (s). "Frame" means 1/60 s. "Step n" is the nth reflex in an overreaction, and N is the number of steps in it. The rest pose and the "55 percent band" are the molecule's normal size and place on the page. Bond lengths never change anywhere in this design. Groups of atoms move as rigid pieces.

## 1. The diagnosis

1. Nothing moves before the payoff. Videos 1, 4 and 5 hold still for 2.3 s, then for another 3.3 s, then go 1.1 s from the last reagent to fire. Video 3 goes 1.4 s from the last reagent (f214) to fire (f256).
2. The reagents are ticked, not thrown. Each one is a one-frame swap of a pill in its slot (v1 f231, f255, f279). Then come three equal changes of 7 to 8 frames each (v3 f262 to f284), with no build between them.
3. A reflex has no wind-up. In video 3 a ring closes in 3 to 4 frames (f294 to f298). The atom starts moving on the frame its step begins, with no draw-back.
4. A reflex has no impact. Across f284 to f338 no frame freezes, the molecule does not recoil, the page does not jolt and the camera does not move. Frame difference stays at 3 to 6.
5. The speed-up runs out before it can be felt. Steps 5, 6 and 7 come 6, 6 and 4 frames apart (f324, f330, f334). The largest gains (+3,120, +7,759, +13,216) land in the shortest windows.
6. The molecule is small and gets smaller as it grows. It fills 26 to 33 percent of the width in video 3 and folds down to about 18 percent in video 2 round 2.
7. The eye has to cover too much ground. The yield sits at the far left (f330, 5,107). The gain is grey 12 to 15 px text that fades in about 0.5 s (f296, +940). The step number is a small "1" on a plumb line under the molecule.
8. Passing a yield flag is not an event. "Stable" is overwritten at "stal" (f328 to f331), "unstable" is skipped in one jump, and "overreact" is typed under the page curl (f339).
9. The page curl lands on the payoff. In video 3 it starts 5 frames after the last step, and in video 1 (f358) the yield is still counting when it starts. Then 3.4 s of stillness follows (v3 f378 to f483).
10. Runoff cannot be seen and goes nowhere. It is 6 px white pairs drifting off the top (v3 f286 to f296). The lost run (v4 f622) has no moment of falling short and then holds for 5.4 s.

## 2. What all three directions share

The builder puts all of this in first. The three directions only change the constants marked "per direction".

### 2.1 Cut the dead time
- The "take one" screen goes from 2.3 s to 0.6 s.
- The round intro goes from 3.3 s to at most 1.2 s, and a click skips it.
- The page assembles in 9 frames, as today.
- The recording rig waits 350 ms from the last placement to fire. A human player takes as long as they like.
- The end of a page waits for the last yield word to be fully written, plus 600 ms. Then it turns by itself after 1.6 s, or at once on a click.
- The page curl never starts while anything is counting or being written. Right now it overlaps the payoff.
- The lost screen drops from 5.4 s to 2.0 s, and input is accepted after 0.8 s.
- The won-round growth from video 5 moves onto the final hit. The molecule is already at full size when the last step lands, not 0.67 s later.

### 2.2 Placing a reagent
- The token travels from the hand to its slot on a 40 px high arc: 180 ms, easeOutCubic.
- It lands with 60 ms of easeOutBack (overshoot 1.4) and a 3 px drop.
- `queue(i)` plays on the landing frame, not on the click.
- The coloured name pill that shows each change ("found oxidize c=c", v3 f296) is removed. The change is read on the molecule.

### 2.3 Firing the three reagents
- **0 ms.** `fire()` plays. The whole page dips 3 px over 60 ms (easeOutQuad) and comes back over 140 ms (easeOutBack 1.2).
- **The throw.** Each token leaves its slot and flies to the atom it changes, as a thrown object:
  - an arc that peaks 80 px above the straight line between slot and atom
  - 220 ms of easeInQuad, so it speeds up and arrives hard
  - no rotation
  - the throws start 300 ms apart (the default; directions change this)
- **The wind-up.** 120 ms before arrival, the target atoms draw back 3 px, away from the incoming token.
- **The impact.** The token shrinks to nothing in 40 ms, inside the target atom. The change happens in 200 ms (easeOutCubic), and the molecule settles over 160 ms.
- **Recoil.** The rest of the molecule is knocked 4 px along the throw's direction and springs back over 220 ms.
- **Build across the three.** The impacts get heavier:
  - recoil is 4, 5 and 7 px
  - each impact plays a new `strike(i)`: a wood knock at 190 Hz, 213 Hz and 240 Hz, at levels 1.0, 1.15 and 1.35
  - the third knock also has the low part of `fire()` under it
- **The +20.** It is pen-lettered at 28 px, 30 px outside the molecule's outline, then flies to the yield (see 2.6).
- **Before the first reflex.** The molecule waits 300 ms (per direction) after the third change settles. Only the third knock's decay is heard.

### 2.4 One reflex step, in four parts
Each step has an interval T(n), set per direction.

- **Wind-up (0.30 times T(n)).** The group that will swing (for example the OH arm) turns 6 degrees away from its target about its pivot (easeOutSine). The atom it will join leans 2 px toward it. Only motion signals it: no colour change, no outline, no disc.
- **Swing (0.25 times T(n)).** The group rotates rigidly into place on easeInCubic, so it falls into contact and is fastest at the moment of contact.
- **Hit-stop (H(n) frames, per direction).** Every atom in the molecule holds its pose. The two joining atoms shake on a 1.5 px tremor at 30 Hz, along the line of contact. The sound clock does not stop: the bell rings through the freeze.
- **Overshoot and settle.** The group carries on past its final angle by 7 percent of the swing, at most 9 degrees, then settles on a damped spring: 6 Hz, damping 0.35, two visible swings, done in 320 ms. The settle overlaps the next step's wind-up.
- **Recoil.** The rest of the molecule moves the opposite way, scaled to the swinging group's mass times its angular speed: up to 6 px of travel and 1.5 degrees of turn, on a 4 Hz spring with damping 0.45. Light atoms (H and end groups) swing twice as far as the core.
- **Each reflex kind has its own move**, because the owner asked that each piece fire its own way:
  - an OH joining a C=O swings on an arc
  - a water loss kicks the molecule away from where the water leaves
  - a C=C shift slides its atoms along the chain
- **The last step always differs:**
  - wind-up 450 ms, held at full draw for the last 150 ms
  - hit-stop of at least 12 frames
  - settle 700 ms
  - then 900 ms with nothing moving except the yield count landing

### 2.5 How the steps speed up
- T(n) = max(Tmin, T1 times r^(n-1)). T1, r and Tmin are set per direction.
- Default: T1 = 560, r = 0.86, Tmin = 200.
- Bands step every effect up together, so each band is clearly heavier than the one before:
  - **Band 1, steps 1 and 2:** bell only, no shake.
  - **Band 2, steps 3 to 5:** the snap and the drone come in, and the page starts to shake.
  - **Band 3, steps 6 to 9:** heavier snap, louder drone, larger numbers.
  - **Band 4, steps 10 and up:** everything at its cap.

### 2.6 The camera and where the eye goes
**Framing.**
- At fire, over 450 ms (easeInOutCubic), the camera moves from the rest framing to the action framing.
- The action framing fits the molecule's outline to 62 percent of the screen width or 60 percent of its height, whichever is reached first.
- Its centre sits 40 percent down from the top, nudged 15 percent of the way toward the current join.
- After every step it refits with a damped follow (time constant 180 ms). The molecule never shrinks as it grows, and an 8 percent margin stops anything clipping at the frame edge.
- After the final hold it eases back to the 55 percent band over 600 ms (easeInOutSine).
- The zoom applies to the molecule band only. The track and the yield stay put on screen.

**Page shake.**
- Every effect, the track included, is on the page, so the whole sheet shakes as one.
- A shake level t goes up by 0.08 + 0.02n at each hit, is capped at 0.9, and falls by 1.6 per second.
- The page moves 9 px times t squared and turns 0.6 degrees times t squared, driven by smooth 18 Hz noise and leaning along the direction of the join.
- Steps 1 and 2 add no shake.

**The yield moves to the track.**
- During an overreaction the yield number leaves the far left and sits just above the head of the track fill, at 64 px.
- The eye then has only two places to look: the molecule above and the track head below.
- When the page ends, the yield goes back to its place over 300 ms.

**Where the eye goes on each step.**
- **Step number and gain.** At impact, the pen writes the step number n at a point 30 px outside the molecule's outline, on the line from the molecule's centre through the join. It is written in 90 ms, in ink, at 28 + 5n px, capped at 96 px.
- **The gain flies to the yield.** The "+gain" figure (at 60 percent of the step number's size) is written under it, holds 250 ms, then flies on a 160 ms easeInCubic arc to the yield.
- **The yield takes the hit.** On arrival the yield scales from 1.00 to 1.08 in 50 ms and back over 180 ms (easeOutBack). It counts from the old value to the new one over 0.8 times T(n), at most 400 ms (easeOutQuart), and the track head moves on the same curve.
- **The numeral lingers.** It fades to 30 percent ink and stays until the next one replaces it.
- **Nothing covers the molecule.** Nothing is ever drawn inside its outline.

### 2.7 Each yield flag
The head of the fill reaches the pole:
- **The flag.** It fills from outline to ink in one frame. The pole jolts 4 px back and rings two cycles over 300 ms.
- **The track.** It takes 2 extra frames of hit-stop.
- **The sound.** `flag(k)` plays on the frame the flag fills.
- **The gold.** The coin drops onto the pole on easeOutBounce over 260 ms.
- **The word.** The pen writes it in the top margin above the molecule, in 220 ms however long the word is. Sizes are stable 40 px, unstable 48, volatile 60 and overreact 96.
  - A word is never overwritten.
  - When the next word comes, the earlier ones shrink to 50 percent and slide left into a row. "Stable unstable volatile" then reads as a line.
  - If two flags pass on one step, they fire 280 ms apart, in order.
- **Overreact waits for the end.** If the yield passes the overreact flag mid-chain, the flag fills at the crossing with a muted `flag(2)`. The word and `flag(4)` wait for the last hit. The biggest payoff always lands last.
- **Falling short of the spec.**
  - The count slows over its last 900 ms (easeOutQuart) and stops short.
  - 400 ms of silence follows.
  - The gap on the track is inked as a bracket, with the shortfall written in red pen ("1,608 short").
  - `lost()` plays. Nothing is celebrated.

### 2.8 Runoff
- **Water.** It leaves as a real three-atom ball-and-stick molecule at true scale (O 22 px, H 14 px), not dots:
  - it is kicked out along the broken bond at 600 px/s
  - gravity is 1,800 px/s squared
  - its arc is solved to land in its jar in 520 ms
  - it does not rotate
  - the molecule kicks 5 px the opposite way
- **Hydrogen.** H2 is lighter: 800 px/s, gravity 900, a 600 ms flight to its jar.
- **The jars.** They are new art, at the right end of the track:
  - on each landing the jar drops 3 px and comes back over 120 ms
  - its fill line steps up one notch
  - `clink(n)` plays, one octave above that step's bell

### 2.9 Sound at each beat
**Today's voices, used as they are:**
- `queue(i)`: plays as each token lands in its slot
- `fire()`: plays at fire
- `ring(n)`: plays on the impact frame of each step, not at its start
- `flag(k)`: plays as each flag fills
- `lost()`: plays when a round falls short of the spec
- `pageTurn()`: plays as the page turns

**New voices to add to `sfx.js`:**
- **`strike(i)`.** The impact knock of a thrown reagent (see 2.3).
- **`snap(n, w)`.** A short low body hit under the bell, from step 3. It is a sine sweep from 160 Hz to 60 Hz in 80 ms plus a click at 2 kHz. Its level is 0.5 + 0.06n (capped at 1.1) times a weight w set per direction. Its low-pass rises from 400 Hz by 120 Hz per step.
- **`drone(level, semis)`.** A held voice, started and changed while it plays:
  - two sines at C2 and G2, each detuned plus and minus 6 cents
  - it comes in at step 3 at -24 dB and rises 2 dB a step to -8 dB
  - it moves up one note of the pentatonic scale every 3 steps
  - it cuts to silence 220 ms before the last step's impact
  - this held breath is the one silence in the overreaction
- **`draw(n)`.** A rising swell of band-passed noise for each wind-up from step 4, lasting the length of the wind-up. It is quiet.
- **`tick()`.** The yield count: one tick at most every 45 ms, with pitch varied plus or minus 30 cents.
- **`clink(n)`.** The runoff landing in its jar.
- **Pitch variation.** Every `ring` and `snap` is shifted by a random plus or minus 8 cents, so repeated steps do not wear.

**Before the overreact word:** 300 ms of total silence, then `flag(4)`.

### 2.10 What never appears
These are on the owner's rejected list: pulsing, bursts, particle balls, glow, pills, banners, screen flashes, colour flashes on the molecule, a fuse, spinning, stretched or squashed bonds, circles or discs on the molecule, check marks, and anything drawn inside the molecule's outline.

## 3. The three directions

All timings are from fire = 0.0 s. To fill in the second-by-second runs, the recorded lines are picked so that:
- the 3-step run passes stable on its last step
- the 8-step run passes stable at step 5, unstable at step 7 and volatile at step 8
- the 15-step run passes stable at 6, unstable at 9, volatile at 12 and overreact on 15

### Direction A: Mass

**The idea:** the molecule is heavy, and every join is a hammer blow on the page.

**How it differs from the other two:**
- **Reagents.** The throws start 340 ms apart, the arc peaks at 120 px, and the third throw arrives 15 percent slower and lands harder (recoil 9 px). The molecule waits 400 ms before the first reflex.
- **Step law.** T1 = 640, r = 0.90, Tmin = 300. The beat never blurs: it ends as a steady pile-driver you can count.
- **Wind-up.** 0.38 times T(n), with a draw-back of 9 degrees (A only). The swing takes 0.22 times T(n) on easeInQuint, so it is heavy and late.
- **Hit-stop.** H(n) = min(3 + n, 10) frames. The last step gets 14.
- **Overshoot.** Only 3 percent, as a hard stop. The contact itself is the event, and the spring is stiff (9 Hz, damping 0.55).
- **Recoil.** Up to 10 px and 2.5 degrees.
- **Page drop.** The whole page drops 2 + 0.4n px (capped at 7) on each impact and comes back over 180 ms. The track and the yield ride with it.
- **Shake.** Shake gain 1.3, at a lower 12 Hz, so it reads as a thud and not a buzz.
- **Numbers.** The yield takes each hit by dropping 4 px and returning, not by scaling, as if it were set down. The step numerals are written thicker each step, from stroke weight 2 to 5.
- **Flags.** On a flag, the pole is struck: it leans 6 degrees and swings back over 400 ms. Each word is written at 1.2 times its default size.
- **Runoff.** Gravity is 2,400 px/s squared, so it drops into the jar. The clink has a low thunk added.
- **Sound.**
  - `snap` weight w = 1.6, starting at step 2
  - `drone` stays one octave lower (C1 and G1), so it is felt more than heard
  - the bell plays at 0.8 of its level so the hits lead
- **Finale.** 600 ms of held breath with the group drawn back, then one hit with 14 frames of hit-stop, a 7 px page drop, a heavy snap, the bell and the flag together.

**3-step run, second by second:**
- **0 to 1.0.** Three throws thud into the molecule, the third clearly heavier.
- **1.0 to 1.4.** Stillness, with only the last knock ringing out.
- **1.4 to 1.8.** The first arm draws back slowly and slams in. A 4-frame freeze and the low bell.
- **2.0 to 2.4.** The second slams in: a 5-frame freeze and a deeper hit.
- **2.6 to 3.2.** A long draw-back in silence, then the final slam. A 14-frame freeze, the page drops, the yield counts to 1,200, the stable flag fills and the pole leans, and "stable" is written in the margin.
- **4.2.** The yield is still.
- **5.1.** The page turns.

**8-step run:**
- **0 to 1.4.** The throws.
- **1.4 to 2.6.** Steps 1 and 2 land slow and heavy, with the bell only.
- **2.6 to 4.0.** Steps 3 to 5 land about half a second apart. The snap and the low drone come in, the page begins to rumble, and stable is struck at step 5.
- **4.0 to 4.7.** Steps 6 and 7 land 380 then 340 ms apart. Unstable is struck at step 7.
- **4.74 to 5.35.** The last wind-up, with the drone cut.
- **5.35.** The slam: 14 frames, and volatile is struck.
- **6.3.** Settled.
- **7.2.** The page turns.

**15-step run:**
- **0 to 1.4.** The throws.
- **1.4 to 4.0.** Steps 1 to 5.
- **4.0 to 6.85.** Steps 6 to 14 at a steady 300 to 380 ms beat. The page is at full rumble and the drone at the top of its rise. Stable is struck at 6, unstable at 9 and volatile at 12.
- **6.85 to 7.46.** The last wind-up in silence.
- **7.46.** The slam. The overreact flag fills, then 300 ms of silence.
- **7.9.** `flag(4)`, and the word is written at 115 px.
- **9.3.** The page turns.

### Direction B: Runaway

**The idea:** the overreaction runs away faster and faster with the count racing, stops dead for one held breath, then lands once, hugely.

**How it differs from the other two:**
- **Reagents.** The throws start 200 ms apart and arrive one after another with almost no gap. The molecule waits only 150 ms before the first reflex.
- **Step law.** T1 = 480, r = 0.80, Tmin = 95. From step 9 the steps come about 10 a second.
- **Wind-up.** 0.20 times T(n). The swing takes 0.40 times T(n) on easeInCubic.
- **Hit-stop.** 1 frame on every step but the last. B's weight comes from speed.
- **Settle.** Shortened to 0.6 times T(n), so it never piles up.
- **The yield never stops counting.** From step 1 it counts toward each new value at a rate that doubles every 3 steps, with ticks at the 45 ms cap from step 6, like a rattling counter. The track head runs with it, and its line is drawn 1 px thicker per band.
- **The held breath.** Before the last step, everything freezes for min(520, 80 + 40N) ms:
  - the molecule is held at full draw-back
  - the count freezes mid-number
  - the drone cuts dead on the first frame of the freeze
- **The landing.**
  - the last swing takes 180 ms
  - then 12 frames of hit-stop
  - the yield jumps the rest of the way in one 250 ms easeOutBack, overshooting 4 percent
  - every flag passed during the freeze fires in order, 180 ms apart
- **Camera.** It does not move per step. It pushes in steadily through the overreaction, 1.5 percent per step up to 18 percent, and pulls back on the landing over 500 ms.
- **Shake.** Shake gain 0.7 during the run. A single drop at 0.9 on the landing.
- **Sound.**
  - `ring(n)` needs a fast mode: its decay shrinks to 0.12 s when the gap is under 130 ms
  - the drone rises one note every 2 steps, not every 3, and gets 3 dB louder per band
  - `snap` weight 0.8
  - from step 6 a quiet noise layer comes in, rising in level, so the run sounds like it is gathering speed
- **Runoff.** 900 px/s with low gravity. The jar clinks become a rapid rattle.

**3-step run:**
- **0 to 0.9.** Three throws in a quick drumroll.
- **1.05 to 1.9.** Two steps, with the bell rising and the count rolling.
- **1.92 to 2.12.** A short held breath: everything stops.
- **2.3.** The landing. The yield jumps to its final value, stable fills, "stable" is written.
- **3.3.** Settled.
- **4.2.** The page turns.

**8-step run:**
- **0 to 0.9.** The throws.
- **1.05 to 2.0.** Steps 1 to 3, at 480 to 300 ms.
- **2.0 to 2.95.** Steps 4 to 7, at 250 to 125 ms. The drone climbs, the counter rattles, and stable and unstable fill as the head runs past.
- **2.95 to 3.35.** The held breath, with the drone cut mid-note.
- **3.53.** The landing. Volatile is written.
- **4.5.** Settled.
- **5.4.** The page turns.

**15-step run:**
- **0 to 0.9.** The throws.
- **1.05 to 2.4.** Steps 1 to 5.
- **2.4 to 3.62.** Steps 6 to 14 in a little over a second. A blur of joins, the bells running into a scale, the counter racing, and stable, unstable and volatile written as the head runs past.
- **3.62 to 4.14.** Half a second of dead silence and stillness.
- **4.32.** The landing, then 300 ms of silence, then `flag(4)` and "overreact".
- **5.6.** Settled.
- **6.5.** The page turns.

### Direction C: Close-up

**The idea:** the camera directs. It dives in to watch each join from close up and pulls back as the count climbs, so the whole molecule ends larger than it has ever been, and each flag gets its own held beat.

**How it differs from the other two:**
- **Reagents.** The camera follows each throw to its target at 1.6 times zoom, then pulls back over 300 ms. The first reflex starts at 1.70 s.
- **Step law.** T1 = 700, r = 0.85, Tmin = 220.
- **The dive.** For each step the camera eases to the join:
  - the move takes 0.40 times T(n) on easeInOutCubic and arrives as the wind-up completes
  - the zoom Z(n) falls in a straight line from 2.4 times the rest framing at step 1 to 1.15 at step 8
  - from step 9 it holds wide and only drifts toward each join, by 10 percent
  - the band crops the molecule while zoomed in, and nothing is drawn over it
- **Hit-stop.** H(n) = min(2 + n, 8) frames. On each hit the camera pushes in 3 percent and eases back over 200 ms.
- **Wind-up.** 0.30 times T(n), as in the shared default.
- **Overshoot.** 10 percent, the largest of the three, since the close camera makes the swing big on screen.
- **Recoil.** As in the shared default.
- **Shake.** Shake gain 0.5. In C the camera does the work.
- **Numbers.** The step numeral is written at 1.5 times the default size near the join, because the view is close. As the camera pulls back it shrinks to its true size.
- **Flags.** Each flag is its own beat:
  - the count holds at the flag's value for 260 ms
  - the camera pulls back 3 percent on the word's first stroke
  - the word is written at 1.3 times its default size
  - for overreact, the camera pulls all the way back to the wide frame over 500 ms, holds 1 s in silence, then writes the word
- **Sound.**
  - **Bell.** `ring(n)` keeps its long 0.55 s decay throughout, and a new short room echo is added (a feedback delay of 90 ms at 0.25), so each bell rings in space.
  - **Camera move.** A new `swish(dur)`: low noise along with each camera move, at -20 dB.
  - **Drone.** Comes in only from step 6, at -18 dB.
  - **Snap.** Weight 1.0.
  - **Room before each flag.** A 150 ms gap before each flag sound.
- **Runoff.** Seen leaving the close view. A row of small jars stays in shot at the edge of the track.

**3-step run:**
- **0 to 1.4.** The camera rides each throw to its atom.
- **1.7 to 2.1.** It dives close on the first OH, watches it draw back and swing in, and the hit rings.
- **2.4 to 2.8.** It eases across to the next join: draw-back, swing, hit.
- **3.0 to 3.7.** The last join, close, with a long draw-back and the hit.
- **3.7 to 4.3.** It pulls back to the whole molecule at full size. The count holds at 1,200 for 260 ms, stable fills, and "stable" is written.
- **5.6.** The page turns.

**8-step run:**
- **1.7 to 3.8.** Steps 1 to 4 from close, each camera move a little wider.
- **3.8 to 4.87.** Steps 5 to 7, the camera nearly wide. A beat on stable at step 5, then on unstable at step 7.
- **4.87 to 5.57.** The last join, from medium distance.
- **5.57.** The hit, then the volatile beat.
- **6.4.** The camera returns to rest.
- **7.6.** The page turns.

**15-step run:**
- **1.7 to 4.9.** Steps 1 to 7, the camera stepping back with each.
- **4.9 to 6.42.** Steps 8 to 14, wide, at 220 ms, with a short beat on unstable (step 9) and volatile (step 12). Stable got its beat at step 6.
- **6.42 to 7.12.** The last join.
- **7.12.** The hit.
- **7.2 to 8.7.** The camera pulls back to the widest frame, holds 1 s in silence, then `flag(4)` and "overreact" are written at 125 px.
- **10.0.** The page turns.

## 4. Risks against what the owner has rejected

**A: Mass**
- **Risk: shake and page drops look like a cheap ad, or wear the player out.** The shake is capped at 0.9 and dies fast. There is no shake on steps 1 and 2, and no colour change at any time.
- **Risk: too slow for a snappy game.** The 15-step run takes 9.3 s, and Tmin of 300 ms keeps it under 10 s. If it still drags, cut T1 to 560 before anything else.
- **Risk: a hard stop reads as squashed bonds.** The groups are rigid and bond lengths never change. Only angles overshoot.

**B: Runaway**
- **Risk: the owner cannot see what happens.** No smear frames, motion trails or blur are drawn. Each step stays a rigid move of real atoms, so a frame-by-frame look shows every join, and the numeral keeps counting.
- **Risk: the held breath feels like lag.** It is capped at 520 ms. The drone cuts on its first frame, so it reads as deliberate.
- **Risk: rising noise feels like a mobile ad.** It stays under the bells, and no visuals come with it.

**C: Close-up**
- **Risk: cropping hides the change.** At every zoom, both joining atoms and one bond on each side stay in view. The view always returns to the whole molecule for the last hit and the flags.
- **Risk: big written words become banners.** They are pen ink only, with no box and no fill, always in the top margin and never over the molecule.
- **Risk: motion sickness.** Camera moves are at least 120 ms and always easeInOutCubic. There are no cuts, and no camera roll.
- **Risk: too slow, with all the flag beats.** Each flag beat is capped at 260 ms. Overreact is the only long hold.

## 5. What to record
1. **One switch.** A setting, `feel=A|B|C`, plus the old feel as `feel=0`, all in one build.
2. **Fixed lines for comparison.** The same molecule and line in all four feels, at three lengths:
   - **Short:** the video 1 molecule, extended to 3 steps.
   - **Medium:** the video 3 molecule with an 8-step line.
   - **Long:** a new molecule with a 15-step line that reaches overreact on its last step.
   - **Lost:** the video 4 molecule falling short of the spec.

   This one comparison is the only place where repeating a run is the point. Every other demo keeps rotating molecules.
3. **Capture.**
   - 1280x720 at 60 fps, since 30 fps loses the 2 to 4 frame hit-stops
   - sound taken from the audio output, at one fixed level
   - each clip starts 0.5 s before fire and ends 1 s after the page turns
4. **Files.**
   - 16 clips (4 feels times 4 lengths), named `feel-A-08.mp4` and so on
   - one stacked video per length, with A, B and C side by side and in sync from fire
   - a quarter-speed copy of steps 3 to 5 of each 8-step clip, to judge the craft
5. **Judging.** A fresh sub-agent judges each clip against the lines in section 2.10 before anything goes to the owner.

## 6. What the rules and art sides must supply

### Rules
At fire, the engine resolves the whole overreaction and hands back an ordered list, so the page can plan the end before it starts (the held breath and the last-step hold need to know N).

**For each reagent:**
- the target atom ids
- the kind of change
- the gain

**For each reflex step:**
- the kind of reflex
- the ids of the two joining atoms
- the ids of the moving group and its pivot atom
- the bonds made and broken
- the runoff, with the atoms it comes from
- the gain
- the yield before and after
- the yield words crossed
- whether it is the last step

**For the round:** N, the spec, and the gap if the round falls short.

**For recording:** a seeded way to load a given molecule and line.

### Art
- pen.js numerals and words that stay sharp up to 160 px, and an option to vary the stroke weight from 2 to 5
- the jars (inked toy-set style, not a flask, beaker or balloon), with a fill line in steps
- water and H2 as small ball-and-stick molecules
- the yield flag in three states, outline, filled and struck, with a pole that can lean
- the reagent token drawn so it can fly free of its slot
- the ink bracket and the red "short" lettering for a lost round

### Sound
New calls in `apps/steam/js/sfx.js`:
- `strike(i)`
- `snap(n, w)`
- `drone(level, semis)`
- `draw(n)`
- `tick()`
- `clink(n)`
- `swish(dur)`
- a fast-decay mode for `ring(n)`
- a short room echo, used by direction C

# The review

**Verdict:** the shared skeleton (anticipation, hit-stop, recoil, silence before the last hit) is right. The numbers are not sized for 1280x720, and the three directions are one idea with three sets of constants. I judged from the design and HARNESS.md, not the videos.

**1. Is it still timid?**
- **Pixel sizes.** A 4 to 7 px recoil, 3 px dip, 2 px lean and 1.5 px tremor are under 1 percent of a 700 px molecule. Nobody will see them. This is the main timidity.
- **Shake never builds.** It rises 0.08 + 0.02n per hit and falls 1.6 per second. On A's 300 ms beat it falls 0.48 per beat while a hit adds at most 0.36. It stays around 0.3, which squared is about 1 px of movement. Only B ever reaches the 0.9 cap.
- **Escalation is mostly sound and shake.** Step 12 swings the same way as step 2.
- **A short run is slow.** A's 3-step run takes 5.1 s to the page turn for three events.

**2. Rejected things under other names**
- Yield scale 1.00 to 1.08 and C's "camera pushes 3 percent on each hit" are pulses.
- B's rising noise layer, plus `draw(n)` on every wind-up from step 4, is a mobile-ad riser.
- The token shrinking "inside the target atom" contradicts "nothing is ever drawn inside its outline".
- The overreact word at 96 to 125 px in the top margin is a banner. The action framing puts the molecule from 10 to 70 percent of the height, so the margin is 72 px. The word cannot fit without covering the molecule.

**3. Are the three different?** B is genuinely different, with a tempo shape that accelerates, holds, then lands. C is different through the camera. A is the shared default with bigger constants. A also has the most stacked effects (page drop, shake, recoil, freeze, tremor, snap).

**4. Timings**
- **Hit-stop is not inside T.** A's freeze is up to 10 frames (167 ms) on a 300 ms beat. A's wind-up and swing are 60 percent of T, which is 180 ms. 180 plus 167 is 347 ms, more than the beat. Adding H(n) beat by beat, A's 15-step run is about 11.3 s, not 9.3 s. C has the same problem.
- **First reflex.** The reagent figures don't add up. A's first reflex is at about 1.7 s, not the stated 1.4 s. B's is about 1.15 s, not 1.05 s.
- **B's step 1 to 5 end** is at 2.66 s, not the stated 2.4 s.
- **B is unreadable.** Tmin 95 ms is under 6 frames, which is the blur already diagnosed. The numeral takes 90 ms to write and the gain takes 410 ms to hold and fly, so ten numerals are alive at once.
- **C contradicts itself.** The camera move is 0.4 times 220, which is 88 ms. Its own rule says at least 120 ms.

**5. Sound.** There is plenty of it. The gaps:
- **Low end.** A 32 to 65 Hz drone vanishes on laptop speakers and stream capture.
- **Reflex kinds.** All of them use the same bell, so "each piece fires its own way" is silent.
- **Handoff.** Nothing marks the moment the player's three actions end and the molecule starts alone.

**6. Copied.**
- The pitch rise per step, the jittered tick and the score numeral growing and flying to the total are Balatro.
- The held breath and the camera diving to the last hit are Peggle's last-peg moment.
- Ours so far are the pen-written words, the gold, the jars, the flag pole and the groups swinging as rigid pieces.

**7. Missing**
- A speed-up on click, since a full run is about 27 pages.
- Shake and zoom sliders.
- A marker for the handoff.
- A before-and-after frame worth clipping.

**Replacement text**

- **2.4 and 2.5.** "T(n) includes the freeze: T(n) is wind-up plus swing plus hit-stop, and the settle overlaps the next step. T(n) = max(Tmin, T1 times r^(n-1)). Default T1 = 520, r = 0.88, Tmin = 170, never under 10 frames. A: T1 640, r 0.90, Tmin 240. B: T1 480, r 0.82, Tmin 130. C: T1 600, r 0.86, Tmin 200, camera move at least 120 ms. Target for the 15-step run: first reflex by 1.5 s, last hit by about 6 s, page turn by 8 s. A click during any run plays it at double speed."
- **Sizes.** "All distances are a share of the molecule's drawn width W. Draw-back 2 percent. Reagent recoil 1.5, 2.5 and 4 percent. Reflex recoil 1.5 percent rising to 4 percent by step 8. Page drop 1 to 2.5 percent. Shake peak 2 percent."
- **Shake rule.** "Level rises 0.25 + 0.03n per hit, falls 1.0 per second, cap 0.9. Level reaches about 0.7 by step 8 on a 300 ms beat."
- **Pulses.** "The yield takes each hit by dropping 4 px and returning, never by scaling. Remove the camera push on each hit. A hit is a freeze plus a 1.5 percent W nudge along the join."
- **Token.** "The token ends on the atom's outer edge and the change begins as it touches. Nothing is drawn inside the outline."
- **Words.** "Words are 40 to 72 px in the action framing. Overreact is written after the camera has returned to rest, at up to 110 px in the rest layout's margin."
- **Numerals.** "When T(n) is under 400 ms the gain figure does not hold. It flies to the yield at once."
- **Drone.** "Add an octave and a fifth above (C3, G3, or a low-passed saw). A's drone is C2 and G2, not C1."
- **Reflex kinds.** "Each kind gets its own bell timbre: ring-closing is a bell, water loss a hollow wood, C=C shift a plucked string."
- **B.** "Cut the noise layer. `draw(n)` plays only from step 8 and is very quiet."
- **First-reflex marker.** "One low bell at the start of the first reflex, so the player hears where the molecule takes over."

**One addition per direction**
- **A:** the molecule's cast shadow slams tight to the paper on each hit and springs back. This gives weight with nothing drawn on the molecule.
- **B:** a pen tally in the margin, one stroke per step, bundled in fives. It keeps the count readable when the steps blur.
- **C:** at the final pull-back the pen draws the starting molecule small beside the finished one. It makes a before and after frame that can be clipped and shared.

# The frame-by-frame diagnosis

**Frame data for the five videos, for building the feel fix.** All five are silent, 1280x720 at 30 fps. Frame f = 30 x t + 1. Frames and sheets are in `C:\Users\mgmcc\AppData\Local\Temp\claude\c2e091f86aaa20cc\4b5d48b3-c4d4-47b4-ad30-ef7d19555645\scratchpad\feel_critic\` (folders v1 to v5 at 640x360, full3 at full size, sheets s*.jpg).

How I measured:
- Frame differencing found the moments, and I read frames at full rate around them.
- Pixel figures are read from frames and rounded. They are good to about 20 percent.
- "Atom" means one ball, about 22 to 26 px across. "Bond" means about 45 px.
- The one video I only skimmed is play-02: I read one overview sheet and the round 2 reflex frames, and its motion-segment pass did not finish.

## 1. Timeline of one turn

**The scripted lead-in, videos 1, 4 and 5 (identical timings):**

| Time | What happens |
|---|---|
| 0.00 to 2.30 s | Nothing moves at all (68 frames of a static "take one" screen). |
| 2.30 s | A 6-frame cut to the round intro. |
| 2.5 to 5.8 s | Nothing moves again (about 3.3 s). Idle sway is a frame difference of 0.1 to 0.2, which is invisible. |
| 5.80 to 6.07 s | The page assembles in 9 frames. |
| 7.67, 8.47, 9.27 s (v1) | The three reagents are placed, 24 frames apart (0.8 s). Each placement is a one-frame pill swap in the slot with no travel, no drop and no landing. |
| 10.43 s (f313) | Fire. |

- First fire is about 10.4 s into the clip. About 8 s of that has nothing moving but a slot pill.
- Last placement to fire is 34 frames (1.13 s) in v1.
- Video 3 is cut tighter. The molecule scales up from tiny over 0.3 s, then is idle until 4.5 s. Reagents are placed at about 5.0, 6.0 and 7.1 s (f151, f182, f214). Then there is 42 frames (1.4 s) of dead stillness before fire at f256 (8.5 s).

**Fire to first movement:**
- v3: the arrow greys and the right-hand list fades over f256 to f261. The first change starts at f262. That is 6 frames, 0.2 s, and it is the only well-timed gap in the turn.
- v1: fire at f313, first pill at f318. That is 5 frames.

**Each reagent (video 3, f262 to f284):**
- Reagent 1: f262 to 268, 7 frames. Reagent 2: f269 to 276, 8 frames. Reagent 3: f277 to 284, 8 frames.
- That is about 0.25 s each, 0.73 s for all three, with the same length for all three and no build between them.
- Each starts with one spike at its first frame (frame difference 8.8, 7.3, 8.9), then eases out.
- A small coloured pill at the top shows the change (for example "C=C to OH"). Gain per reagent is only +20.

**Reflex steps (video 3), by when the hand-lettered step number appears:**

| Step | Frame | Time |
|---|---|---|
| 1 | f284 | 9.43 s |
| 2 | f298 | 9.90 s |
| 3 | f308 | 10.23 s |
| 4 | f318 | 10.57 s |
| 5 | f324 | 10.77 s |
| 6 | f330 | 10.97 s |
| 7 | f334 | 11.10 s |

- Intervals are 14, 10, 10, 6, 6, 4 frames (0.47, 0.33, 0.33, 0.20, 0.20, 0.13 s). Steps do speed up.
- The whole chain is f284 to f338, 54 frames, 1.8 s. No frame in it is frozen. The lowest motion is 1.9, so there is no hit-stop or beat.

**Everything after the chain:**
- The page curl starts at f339 (11.27 s), 5 frames after step 7. It runs about 0.5 s.
- The score counts up behind it, 12,866 to 168,854 by f378 (12.6 s).
- Then nothing moves for 3.4 s until the clip ends at 16.3 s. The static end state is the word "overreact", the original molecule, 168,854 and four green flags.

**Totals:**
- Video 3: fire to the score finishing is about 4.1 s (f256 to f378). The action itself, f262 to f338, is 2.5 s.
- Video 1, page 1 (2 reflex steps only): fire f313, step 1 at f330, step 2 at f346, page curl at f358 (11.93 s). That is 1.5 s from fire to curl.
- Videos 4 and 5 are the same length: about 1.7 s for a short page, 2.6 s for video 5 page 1.
- Every turn is about 8 to 10 s of lead-up for about 2 s of action.

## 2. The moment a reflex happens

- **Molecule size.**
  - Video 3 molecule: about 330 to 420 px wide by 140 to 180 px tall, which is 26 to 33 percent of frame width and 20 to 25 percent of height.
  - Video 1 molecule: a thin line about 550 px wide but only about 100 px tall.
  - After folding in video 2 round 2 it shrinks to about 230 px wide (18 percent). The molecule gets smaller as the chain grows.
  - During the chain the ring cluster stays at about 20 to 26 percent of width.
- **Movement.**
  - A ring closing (video 3 step 2, f294 to f298) takes 3 to 4 frames. The tail OH and the six ring atoms travel roughly 80 to 130 px.
  - The final unroll at step 7 (f334 to f338) re-lays the whole molecule from a stack into one straight ladder of rings in 4 frames. Overall frame difference peaks at 13.8, then 17.3 at the page curl.
- **Anticipation.** None. A change begins on the frame after its pill appears. There is no wind-up, pull-back, squash or telegraph on the atom that is about to move.
- **Settle.** Barely any. Atoms ease for 3 to 5 frames with at most 10 to 15 px of wobble in the molecule's extent. Nothing rings or bounces.
- **Camera.**
  - There is no zoom, push, shake or trauma anywhere in the chain.
  - The molecule recentres sideways as it grows, 20 to 60 px.
  - The only camera-like moves are the end-of-round growth in video 5 (item 3 below) and the page curl.
- **What else reacts.**
  - Score digits jump.
  - A small grey "+N" text fades up under the molecule.
  - The track bar extends.
  - The step number (about 20 px, light) appears with a thin plumb line.
  - The right-hand list is faded out from fire onward.
  - The flag turns green and a word types in at top centre.
  - Nothing flashes, the background does not change, and the molecule's own colour does not change when a step lands.
- **Runoff.** Water or hydrogen leaves as pairs of tiny white dots, about 6 px, drifting up over about 20 frames and leaving the frame (video 3 f286 to f296). No jar or other destination is visible. They are nearly invisible against the cream page.

## 3. How the number grows

- **Where the eye is asked to look.** The big score is at bottom-left, about 45 px tall. The action is top-centre. They are far apart, so the eye has to choose. The "+940" style gain is about 12 to 15 px of grey, mid-bottom, and fades fast. The step number is next to the molecule, small and light.
- **Is the gain felt?** Weakly.
  - The total jumps in chunks, not a roll: 40, 822, 1,040, 1,170, 1,987, 5,107, 12,866 (video 3). Digits change but nothing scales or kicks.
  - Per-step gains are +20, +940, +210, +817, +3,120, +7,759, +13,216. The largest gain arrives on the fastest step (4 frames), which is the least time the eye has to read it.
- **Escalation.** After the chain ends the score runs 12,866, 26,082, 49,280, 87,131, 168,854 in about 1 s (f346 to f378). This is the only point where growth is felt.
- **Is passing a flag an event?**
  - No. A flag turns green and a small coin pill appears. The word is typed letter by letter at about 35 px, taking 3 to 4 frames per letter.
  - In video 3 the word "stable" reached "stal" at f328 and was overwritten by "volatile" at f331. Stable was never read in full. "Unstable" was skipped, because the score jumped from 1,987 to 5,107 across two flags.
  - "Volatile" reached "volal" at f338 and was overwritten by "overreact", which was typed while the page curl was already covering it.
  - In video 1 the word has time (stable, then unstable). It is still just green text.
- **Collision.** In video 2 round 2 (f456 to f496, about 1.3 s) the small "6 in a row" label sits directly on top of the word "unstable" and the two are unreadable together.

## 4. Flat, timid, slow, small, late or easy to miss (ranked)

1. **The reflex has no weight.** Video 3 f284 to f338, every step. No anticipation, no hit-stop, no impact frame, no camera move, no flash or colour on landing, no shake. Mean frame difference stays at 3 to 6 against a peak of 14. This is the core problem.
2. **The big beats are covered or cut off by the page curl.**
   - Video 3: the curl starts at f339, 5 frames after step 7, and "overreact" types underneath it.
   - Video 1 (f358): the curl starts 12 frames after step 2, while the score is still counting.
   - Video 2 round 2 (f456): the curl starts while the last reflex is still running.
   - The payoff and the page change are sharing the same half-second.
3. **The molecule is small and shrinks as the chain grows.** Video 3 sits at 26 to 33 percent of width. Video 2 round 2 folds down to about 18 percent. The action happens in a quarter of the frame while the page is mostly empty cream.
4. **The score is far from the action.** Bottom-left, 45 px, against top-centre molecule changes. Gain text is 12 to 15 px, grey, and gone in about 0.5 s. The step numbers are tiny.
5. **The speed-up ends too fast to feel.** Steps 5, 6 and 7 are 6, 6 and 4 frames apart in video 3 (f324, f330, f334). The biggest gains (+3,120, +7,759, +13,216) arrive in the shortest windows, so the escalation is not readable.
6. **Dead time everywhere around the action.**
   - 2.3 s frozen at the start of videos 1, 4 and 5, then 3.3 s of a static intro.
   - 1.4 s idle after the last reagent in video 3.
   - 3.4 s frozen at the end of video 3 (f378 to f483).
   - 3.7 s frozen at the end of video 5 (22.1 to 25.9 s).
   - 5.4 s frozen on the lost screen in video 4 (20.7 to 26.1 s).
7. **Reagents are instant and identical.** One-frame slot swaps (video 1 f231, f255, f279), then 7 to 8 frames each and a +20 gain. Three equal soft taps, no build.
8. **Flag passes are not events.** See item 3 above: words typed at 3 to 4 frames a letter and overwritten before finished; stable and unstable skipped in a jump.
9. **Runoff is invisible.** About 6 px white pairs drifting off the top (video 3 f286 to f296), with no destination.
10. **The lost run has no event.** Video 4: the score counts to 1,092 by f614, then 8 frames later (f622) the molecule enlarges and holds for 5.4 s under red "1,608 short". The molecule's right edge is clipped by the frame, and there is no marker for the gap on the track in the frame.
11. **The end-of-round growth in video 5 comes after the climax, not with it.** The molecule grows from 25 to about 65 percent of width over f655 to f675 (0.67 s). Its right atom touches the frame edge (f695 on). The coins (3, +3) are tiny at the track end.
12. **The first change per page is fine, but the list fades before it.** The right-hand list is faded from f250, before the molecule has moved, so the page empties just as the action begins.

## 5. The three moments that come closest to feeling good

1. **Video 3 f318 to f338 (10.57 to 11.27 s), steps 4 to 7.** The steps run at 6, 6 and 4 frames and the word "volatile" starts typing, then the whole stack of rings unrolls into a single straight ladder in 4 frames (frame difference 13.8, the highest in the chain). It works because the rhythm accelerates, the molecule makes one large silhouette change, and the track shows a flag landing at the same time.
2. **Video 3 f346 to f378 (11.5 to 12.57 s).** The score doubles in steps (12,866, 26,082, 49,280, 87,131, 168,854, about 8 frames each) while all four flags are green and "overreact" is on screen. It is the one place where the number gets bigger fast enough to feel, but it is under the page curl and the molecule is already off.
3. **Video 5 f625 to f675 (20.8 to 22.5 s).** "Overreact" types in over about 0.67 s, three steps land (1, 2, 3) with +3,155 and +9,196 on screen, then the molecule scales to about 65 percent of the frame. This is the only place the molecule is large while something is happening, and it is the best size read of the whole set. It still arrives after the steps, not on them, and then freezes for 3.7 s.
