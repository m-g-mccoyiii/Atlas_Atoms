# Overreact sound, second build

Builder: sound-builder-2. One game file: `apps/steam/js/sfx.js` (`AA.sfx`). Every sound is made in code with Web Audio; no audio file, sample or library was downloaded. The owner's rulings this answers: AH "The sounds aren't exciting enough", AK (a deeper layer that grows with the chain; sound for the whole game), the owner on the first comparison ("I kind of liked arcade (2) but ... less child game sounding").

Nobody has listened to any of this. Everything below was judged by measurement and by a director sub-agent reading the numbers and spectrograms.

## The switches

| Call | What it does | Saved under | Address |
|---|---|---|---|
| `style(n)` / `setStyle(n)` / `getStyle()` | 0 today, 1 bench, 2 arcade (the base), 3 boiler. `style()` with no argument reads it | `overreact.sfx.style` | `?sfx=0..3` |
| `arcade(v)` / `setArcade(v)` / `getArcade()` | the arcade variant: `'a'` dark synth (default), `'b'` industrial, `'c'` ominous, `'old'` the first arcade | `overreact.sfx.arcade` | `?arcade=a` |
| `deep(n)` / `setDeep(n)` / `getDeep()` | the growing deep layer: 0 off, 1 drone, 2 chant (default), 3 engine | `overreact.sfx.deep` | `?deep=0..3` |
| `styleName(n)`, `STYLES` | names | | |

Defaults with nothing saved: style 2, arcade a, deep 2. Recorders that wrap every `AA.sfx` call must use the `set...` names (their wrapper skips names starting with `set`); `style`, `arcade` and `deep` would be logged as sounds.

## The styles

- **0 today.** The first set, unchanged, mono.
- **1 bench.** Glass, wood and metal struck on a bench, in D major, marimba and gamelan tuning. A thump under every step, struck chord and a crash of glass partials on the last hit, a gong and two seconds of falling glass for OVERREACT.
- **2 arcade, grown up (the base).** D minor over Dm, Bb, Gm, A, three steps a chord; the A major pulls back to D minor on the last hit. Low register, FM and filtered-saw bass, dry heavy drums with drive, sparse low leads, the boiler's steam and knocks for texture. No square leads, no bright major bleeps, nothing slides up.
  - a, dark synth: FM bass in eighths then sixteenths, saw stabs, a snare that rolls into the last hit.
  - b, industrial: steam chuffs and metal on the offbeats, distorted bass, knocks that roll, a hiss bed.
  - c, ominous: half time, a low tom on the offbeat, low brass swells, the chant louder and from step 1.
  - The last hit: low D minor, distorted, with a semitone rub that dies first, metal crash, steam. OVERREACT: double hit, sub drop, the D minor torn by a semitone, metal, steam roaring for three seconds, a siren whistle falling, debris. Dangerous, not cheerful.
  - `'old'`: the first arcade (D major, bright), kept for reference only.
- **3 boiler.** Knocks and steam chuffs that speed up, bubbles for the count, a kettle whistle that climbs, metal pings, a valve pop and a huge double low boom.

### What every style does in an overreaction

Each reflex step is built in layers that come in with the step number: a thump (step 1), the kind's own voice on the beat and again on the offbeat (2), bass (3), a second chord note (4), sixteenths (6), a pad (7), the melody doubled (9), a roll into the next step (10). The fills are spaced from the measured gap since the step before, so as the page builder's steps shrink the sound accelerates into a groove. The last step's wind-up (`windup(n, ms, true)`) is a riser that stops 170 ms before the hit while the whole mix is held near silence (the held breath). The bed (pads, bass, the deep layer, risers) ducks under every hit.

The thirteen kinds each have their own voice in each style, their own register and their own knock: lactol, enone, taut, weld, snap6, ether, shift, tuck, knit, seal, cap, open, fold; the engine names ring, dry, flip, snap and close map to them.

### The deep layer (ruling AK)

Enters at step 2 (arcade c: step 1, 1.7 times louder) and grows every step: louder, thicker, lower. 1 drone: saws and a sine on the chord root, more detuned and more open each step, a fifth from step 5, the octave under from 8. 2 chant: low synthesised voices (a buzz through two vowel formants), one more voice every two steps, the vowel opening oo, oh, aw, ah. 3 engine: a low rumble whose pulse speeds up with the steps. Harmonics above 150 Hz so a phone plays it; on the ducked bed, so the held breath silences it; lands with the last hit and is at its biggest inside OVERREACT.

## Every call

Existing calls, same names and arguments (each goes to the chosen style; style 0 plays the first set): `queue(i)`, `fire()`, `strike(i, w)`, `handoff()`, `reflex(kind, n, o)` (o: bell, fast, echo, last), `ring(n)`, `snap(n, w)`, `boom(m)`, `drone(level, step, dur, low)`, `draw(n, dur)`, `tick(n)`, `swish(dur)`, `flag(k)`, `flagSoft(k)`, `clink(n, m)`, `wasted()`, `pageTurn()`, `lost()`, and the old set (`click`, `feed`, `pen`, `bond`, `stamp`, `good`, `lock`, `fanfare`, `quota`, `over`, `fuse`, `chain`, `squish`, `drift`, `bad`, music).

New calls:

| Call | When | |
|---|---|---|
| `windup(n, ms, last)` | where feel.js begins each reflex step (where it calls `swish`), ms = time to that step's hit | a pickup before ordinary steps; the riser and held breath before the last |
| `gold(n)` | gold earned | |
| `title()`, `runStart()`, `shopOpen()`, `buy()`, `cantBuy()`, `hover()`, `click()`, `pick()`, `redraw()`, `roundWon()`, `runWon()`, `runLost()`, `unlock()`, `finding()`, `creature()`, `instrument()` | the screens and acts below | style 0 falls back to the nearest old call |
| `ambience(kind, dur)` | entering a screen: `'title'`, `'bench'`, `'shop'`, `'pick'`; `ambience(null)` fades it out | the quiet bed for screens between reactions; dur only for a render |
| `_render(name, args, secs, opts)`, `_renderTimeline(events, secs, fns, opts)` | tests and recorders | opts: `style`, `arcade`, `deep`, `stereo` (resolves `{ l, r }`; without it one channel, left and right averaged) |

## The whole game: every screen and act

| Screen or act | Call | Voice in styles 1, 2, 3 | Called by the page today |
|---|---|---|---|
| title screen | `title()` + `ambience('title')` | done | no |
| starting a run | `runStart()` | done | no |
| the offer / shop | `shopOpen()` + `ambience('shop')` | done | no |
| buying | `buy()` | done | no |
| cannot afford | `cantBuy()` | done | no |
| coins | `gold(n)` | done | no |
| the bench (between runs) | `ambience('bench')` | done | no |
| picking a molecule | `pick()` + `ambience('pick')` | done | no |
| redrawing the pair | `redraw()` | done | no |
| hover on anything | `hover()` | done | no |
| click on anything | `click()` | done | old click, yes |
| placing a reagent | `queue(i)` | done | yes |
| firing | `fire()` | done | yes |
| a reagent landing | `strike(i, w)` | done | yes (feel.js) |
| the molecule taking over | `handoff()` | done | yes (feel.js) |
| each reflex step, by kind | `reflex(kind, n, o)` | done, 13 kinds | yes (feel.js) |
| the wind-up and held breath | `windup(n, ms, last)` | done | no: the page builder must add it |
| the count | `tick(n)` | done | yes |
| stable, unstable, volatile | `flag(1..3)` | done | yes |
| OVERREACT | `flag(4)` | done, the biggest sound | yes |
| runoff into a jar | `clink(n, m)` | done | yes |
| a wasted reagent | `wasted()` | done | yes |
| an instrument acting | `instrument()` | done | no |
| a creature acting | `creature()` | done | no |
| page turn | `pageTurn()` | done | yes |
| a round won | `roundWon()` | done | no |
| a round lost | `lost()` | done | yes |
| a run won | `runWon()` | done | no |
| a run lost | `runLost()` | done | no |
| an unlock | `unlock()` | done | no |
| a finding | `finding()` | done | no |
| inspections, sigils, each creature and instrument by name | | not done: one shared voice each for now | |

## The bus

Styled voices: hits and a ducked bed, a room (pre-delay, two Schroeder allpasses, six damped feedback combs, an allpass a side), a 32 Hz high-pass, the breath gain, trim 1.2 times the volume, a limiter (threshold -6 dB, ratio 20, 1 ms attack, 160 ms release), a soft clip that is straight to -2.5 dB. A Hadamard-mixed delay network was tried first: in Chrome it decayed far slower than its gains say, and with a low-pass in its loop it grew without end; the combs decay as set (measured: 20 dB per 0.5 s for a 1.5 s room).

## Measurements

| | today | arcade old | arcade a | arcade b | arcade c | bench | boiler |
|---|---|---|---|---|---|---|---|
| step 1 RMS (dB) | -27.1 | -21.6 | -18.9 | -19.5 | -19.7 | -20.7 | -20.1 |
| step 11 RMS | -14.3 | -16.7 | -13.3 | -14.1 | -11.9 | -11.4 | -15.1 |
| last step RMS | -11.6 | -9.3 | -10.2 | -10.6 | -10.7 | -9.7 | -9.4 |
| rise per step, steps 1 to 11 (dB) | 1.05 | 0.88 | 0.91 | 0.89 | 0.93 | 1.04 | 0.8 |
| last step minus steps 1 to 3 (dB) | 14.5 | 13.4 | 10.3 | 10.1 | 9.2 | 11.0 | 12.1 |
| brightness rise per step (Hz) | 35.29 | 102.35 | 6.52 | 37.0 | 20.41 | -8.92 | 62.01 |
| share under 120 Hz (%) | 53.3 | 45.8 | 61.7 | 52.9 | 56.0 | 50.3 | 56.2 |
| phone loss: full minus 300 Hz high-pass (dB) | 7.6 | 4.5 | 6.6 | 5.3 | 6.4 | 6.1 | 6.4 |
| stereo side vs mid (dB) | -160.6 | -12.7 | -12.6 | -10.1 | -12.9 | -10.5 | -9.7 |
| crest factor (dB) | 17.5 | 17.8 | 15.4 | 16.7 | 15.7 | 15.5 | 17.0 |
| quietest moment before the last hit | -33.3 | -45.2 | -40.4 | -39.1 | -40.4 | -45.4 | -50.2 |
| last hit peak | -0.8 | -0.8 | -1.1 | -1.1 | -1.3 | -1.4 | -1.3 |
| last hit, first second RMS | -16.7 | -13.7 | -13.1 | -14.6 | -15.2 | -13.0 | -12.2 |
| OVERREACT peak | -0.7 | -1.2 | -1.4 | -1.2 | -1.4 | -1.1 | -1.3 |
| OVERREACT, first second RMS | -11.6 | -11.7 | -10.4 | -10.3 | -10.3 | -10.9 | -10.9 |
| OVERREACT on a phone (300 Hz high-pass) | -21.7 | -20.0 | -19.9 | -19.3 | -19.6 | -19.3 | -21.7 |
| OVERREACT 2 s on, vs its peak (dB) | -44.0 | -22.2 | -4.0 | -7.1 | -10.3 | -16.4 | -19.4 |

Per-step RMS (dB), steps 1 to 12:

| | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| today | -27.1 | -26.5 | -24.6 | -25.6 | -25.3 | -27.0 | -23.4 | -23.3 | -15.1 | -22.5 | -14.3 | -11.6 |
| arcade old | -21.6 | -24.8 | -21.6 | -20.1 | -23.7 | -17.4 | -18.7 | -17.5 | -14.1 | -14.8 | -16.7 | -9.3 |
| arcade a | -18.9 | -24.7 | -17.9 | -18.9 | -21.0 | -17.5 | -15.9 | -16.0 | -12.8 | -13.1 | -13.3 | -10.2 |
| arcade b | -19.5 | -24.6 | -17.9 | -18.7 | -20.7 | -17.8 | -16.5 | -16.9 | -12.4 | -12.9 | -14.1 | -10.6 |
| arcade c | -19.7 | -22.6 | -17.3 | -17.0 | -18.5 | -16.5 | -14.9 | -15.3 | -12.4 | -12.3 | -11.9 | -10.7 |
| bench | -20.7 | -23.5 | -17.8 | -16.1 | -14.2 | -14.5 | -12.8 | -14.3 | -13.1 | -11.4 | -11.4 | -9.7 |
| boiler | -20.1 | -23.7 | -20.6 | -20.7 | -19.4 | -18.2 | -16.9 | -17.0 | -15.2 | -14.6 | -15.1 | -9.4 |

Per-step level after a 300 Hz high-pass (a phone speaker):

| | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| today | -32.6 | -29.7 | -26.7 | -36.4 | -34.2 | -30.0 | -25.1 | -25.2 | -22.1 | -24.8 | -16.2 | -15.3 |
| arcade old | -22.0 | -26.4 | -23.2 | -21.1 | -29.4 | -18.2 | -19.7 | -18.3 | -16.0 | -15.3 | -19.1 | -19.6 |
| arcade a | -21.5 | -27.3 | -18.7 | -24.4 | -27.7 | -20.0 | -17.2 | -29.6 | -15.9 | -14.7 | -17.9 | -23.6 |
| arcade b | -22.5 | -27.1 | -18.6 | -24.2 | -25.7 | -19.6 | -17.4 | -29.6 | -15.5 | -13.6 | -17.9 | -23.4 |
| arcade c | -23.8 | -27.3 | -18.8 | -24.1 | -26.7 | -20.3 | -17.4 | -29.3 | -16.8 | -14.5 | -18.0 | -23.8 |
| bench | -21.8 | -24.2 | -20.7 | -19.6 | -16.8 | -18.2 | -16.2 | -19.3 | -19.7 | -25.4 | -15.4 | -20.6 |
| boiler | -21.7 | -25.7 | -21.9 | -27.0 | -21.6 | -21.3 | -19.4 | -27.1 | -18.8 | -15.7 | -17.8 | -21.8 |

All on the same 12-step chain (the timing of the page builder's long take feel2-5-long, twelve different kinds of reflex), stereo, 44.1 kHz, rendered offline through the real sfx.js in headless Edge. Arcade a, b and c carry the deep layer as drone, engine and chant; bench and boiler carry the chant. Bench and boiler were measured on the render before the last darkening of the arcade (the shared kind registers changed slightly since). Per step means the 300 ms after each hit.

What changed from today: the first steps are 7 to 8 dB louder and fuller; the mix is stereo; the held breath before the last hit falls to -39 to -50 dB (today -33); OVERREACT holds for seconds (-4 to -19 dB two seconds on, today -44); OVERREACT now tops the last hit by 2.7 to 4.9 dB in its first second in the grown-up arcade (today 5 dB, but only because today's last hit is thin). What did not improve enough: the climb from the first three steps to the last is 9 to 12 dB, a little less than today's 14.5 (today starts much quieter); the last step of the grown-up arcade loses its body on a phone (-23.6 dB after the high-pass against -10 dB full); step 8 dips on a phone in the arcade (the tuck kind sits low).

### How different the thirteen kinds sound

Mean and smallest RMS difference, in dB, of their level-normalized third-octave spectra (`kinds.py`), each kind alone at step 1 and under all the shared layers at step 6:

| | step 1 mean | step 1 closest | step 6 mean | step 6 closest |
|---|---|---|---|---|
| today | 9.5 | 0.0 (identical pairs) | 9.4 | 0.0 |
| bench | 14.7 | 7.3 | 13.5 | 5.1 |
| boiler | 15.2 | 3.1 | 10.0 | 3.2 |
| arcade a | 15.1 | 4.4 | 8.2 | 4.9 |
| arcade b | 14.9 | 4.2 | 8.0 | 4.3 |
| arcade c | 14.9 | 4.3 | 11.6 | 4.5 |

Today's mean hides that five pairs are the same sound. Arcade a and b are under today's mean at step 6 (8.2 and 8.0 against 9.4), because their drums and bass are louder than the kind's own voice there; every pair is now apart by at least 4 dB.

### Sync

Under the gameplay picture the sound is the take's own logged calls rendered offline, so it is in step by construction. Measured on feel2-5-long: 0 ms offset (onset correlation 0.92), the video's own onsets within a median 5.9 ms of the logged hits. The newest clips use the frames of feel3-6-mid (re-recorded by the page builder at 08:58; its own mp4 does not decode cleanly, so the picture was re-encoded from its frames) and that take's log.

## The director's verdicts

First (bench, first arcade, boiler against today): "arcade has the best bones (a pulse, a clear build, a clean drop) but needs a much bigger, longer flag4 and more phone-speaker mid. Boiler is a close second, for its payoff alone. Today and bench should not ship as they stand." Acted on: quieter early steps, bench pad and roll down 6 dB, the arcade bass ducking under the kick, a mid knock on every boom, a held mid chord in OVERREACT.

Second (the grown-up arcade, against "would this pass in a game for adults on Steam"): "arc_c with the deep layer from arc_a, but it is not finished: the payoff is not yet clearly bigger than the last hit, and the deep layer is a wash, not a rising voice." It named bright pluck lines on steps 3 to 7 as the child-game remnant. Acted on: the last hit about 3 dB smaller and OVERREACT given a distorted low brass stab (it now tops the last hit by 2.7 to 4.9 dB); the deep layer rebuilt as a staircase (+1.6 dB a step, -16 dB at step 2 to full at step 12) with saw harmonics at two and three times its root for a phone; the leads moved down (melody from A3, capped at A5) and the metal and pluck partials low-passed at 2.2 to 2.6 kHz. Not judged again after these changes.

## Clips for the owner (C:Worktlas-atoms.claudeshots)

- `arcade-compare.mp4`: the first arcade, then a, b, c, a numbered card between. `arcade-a.mp4`, `arcade-b.mp4`, `arcade-c.mp4` alone.
- `deep-layer-a.mp4` (drone), `deep-layer-b.mp4` (chant), `deep-layer-c.mp4` (engine), each under arcade a.
- `whole-game-sound.mp4`: every act in order with a caption card each (arcade a, drone), 55 s.
- `sound-on-video-a.mp4`, `-b`, `-c` (arcade variants) and `-1`, `-2`, `-3` (bench, arcade a, boiler) under the picture of feel3-6-mid (shift, weld, dry, snap, fold; it has no OVERREACT).
- `sound-style-0..3.mp4` and `sound-compare.mp4` (today, bench, arcade a, boiler), `sound-kinds-0..3.mp4` (the 13 kinds at step 6), `sound-events-2.mp4` (the other sounds in arcade a). `sound-events-0`, `-1`, `-3` are from the first pass.

## For the page builder

- Call `windup(n, ms, last)` where feel.js begins each step (beside `swish`): without it there is no riser and no held breath.
- Call the act functions and `ambience()` from the screens in the table above.
- In recorders use `setStyle`, `setArcade`, `setDeep`.
- Bump `sfx.js?v=22` in scheme.html.

## Not done

- Nobody has listened.
- The second director's last points were acted on but not judged again.
- Arcade a and b kinds at step 6 are under today's mean distance.
- The last step of the arcade is weak on a phone.
- Inspections, sigils, and each creature and instrument by name have one shared voice, not their own.
- The page does not call the act functions or `windup` yet.


## How to render and analyze

Tools in `.claude/snd/` of the worktree (not in git):

- `srv.py`: a static server for the worktree on 8841 that saves POSTs into `out/`. `render.sh <jobs.json> <tag>` opens headless Edge on `page.html`, which renders each job through the real `sfx.js` with `_renderTimeline(events, secs, null, { style, arcade, deep, stereo: true })` and posts raw float32 stereo.
- `make_tl.py`: the timelines from the logged takes of the page builder (`page3/.claude/feel/feel2_5_long.json`, 12 steps, all four flags): `tl_video.json` (the log plus a `windup` where each step begins), `tl_demo.json` (the same times, twelve different kinds, jar landings). `tl_video3.json` is the newest video with several kinds (`feel3_6_mid`: shift, weld, dry, snap, fold; no OVERREACT in it). `tl_kinds*.json`, `tl_events.json`, `tl_game.json` are the samplers.
- `analyze.py` / `show.py` / `sum.py`: short-term RMS (100 ms), peak and crest, energy under 120 Hz, level after a 300 Hz high-pass (a phone speaker), stereo side level, per step (the 300 ms after each hit): RMS, peak, high-passed RMS, attack, onsets to the next step, centroid, tonal peaks, five bands; the slopes over steps 1 to 11; the quietest moment in the 400 ms before the last hit; the last hit's peak, level and tail; OVERREACT's peak, level, phone level, and its level 2 s on. `--png` writes a spectrogram with the loudness curve.
- `kinds.py`: how different the 13 kinds sound: the RMS difference in dB of their level-normalized third-octave spectra, mean and closest pair.
- `sync.py`: cross-correlates onset envelopes of the video's own audio and a render of its log.
- `make_all2.py`: every clip for the owner.
