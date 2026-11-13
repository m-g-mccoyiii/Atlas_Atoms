# Overreact sound, builder 5: build-up options and soundtrack options

Two files: `apps/steam/js/sfx.js` (effects, `AA.sfx`) and `apps/steam/js/music.js` (soundtrack, `AA.music`). Web Audio only. Nothing downloaded: every sound is made by our own code, so it is ours to sell.

**Nobody has listened to any of this.** It was built and judged from measurements of offline renders only. Read every number below as "it measures this way", not "it sounds good". The owner's ears decide.

What the owner asked for (12 November): the sounds "aren't exciting enough"; "the building up needs to be way longer"; "I need the sound to be more majestic with the buildup to reactions building. It's a bit flat. Needs to hit the dopamine", leaning on "Drums and a riser"; "several sound tracks", funk as the main one, "the gothic hybrid just tweak it a little", "an edm one, a metal one, etc."; "I said several sound options and never got them".

<!-- builder7 -->
<!-- builder8 -->
## 000. Builder 8 (13 November): a beat, a build and a drop, heavier sounds

The owner listened to whole-run videos and said the EDM soundtrack was "not EDM": "No real beat", "No build and drop"; of the ending: "too loud all at once", "the music changes too abruptly", "the silence before it". Then, on the first clip of this builder: "Still no": "Sounds thin or cheap", "No bass"; asked which EDM: "All of these". This section is the newest; where anything below disagrees with it, this wins.

**Every earlier section judged the sound by loudness tables, and the owner's ears said it had failed on exactly what the tables called fine.** The numbers below say what was measured, not that it feels right. Only the owner can confirm any of it. Nobody but the owner has listened.

### 000.1 What changed

- **A beat in every state that has drums** (title, planning, picking, shop, round won, the drop): a kick on every beat, a clap on 2 and 4, a hat on every off-beat, at 126 to 128 bpm, steady (the tempo no longer runs away inside a section; the half-time and dropped-beat bars of the later rounds are gone). Kick, clap and hats have buses of their own past the layer levels, the heat filter and the state's level, so they are the same in every state. Calm is made by thinning what is around the drums (bass filtered, no lead), not by taking drums out. Planning is a groove, no longer the breakdown.
- **Heavier sounds.** The kick is layered (a 2 to 5 kHz click, a body sweeping from about 180 Hz to 50 in 70 ms with second and third harmonics, a short sub tail, saturated). The clap has a 200 Hz body. The bass is a **line** (root, octave, fifth, seventh; four sets of patterns by heat) played by two voices: a clean sine sub and a mid-bass of three beating saws, a square and an octave above, driven hard. Plucks are seven saws wide. Pads, lead, plucks and stabs each go through a chorus (two wandering delays, one a side). Pads, bass, lead and plucks duck under every kick.
- **A master chain for this track** (`edmMaster`): low shelf (+1.5 dB at 95 Hz), high shelf (+3 dB at 8.5 kHz), everything under 120 Hz mono, a glue compressor, a soft clipper; the EDM track no longer goes through the tape. Its way out leans up through a build (to +1.6 dB) and is highest in the drop (+2.6 dB): the proportion of groove, build and drop is set in one place (`EDMM`).
- **The build is the music's own, on the grid** (it was the effects', tied to the arrows, with the music ducked 10 dB under it). As a chain climbs: the kick loses its low end, then leaves; the clap gives way to a snare roll that doubles (4, 8, 16, 32 to the bar) and climbs in pitch; white noise and two saws rise; the pad filter opens; the bass is pulled away. The effects keep the sweep into each hit, the one climbing tone, the hits and the kinds, and now duck the music by 2 dB, not 10. How high a build goes depends on the chain: 3 steps only lean in (the kick never leaves), 9 or more go to the top.
- **After the last hit the build hangs at its top for a bar.** If OVERREACT is called: see below. If not, it resolves: the hiss falls away and the beat is back, with no crash and no drop.
- **The drop.** On the call (`AA.sfx.flag(4)` and `AA.music.state('overreact')`, either first) the build stops; the drop lands on the music's next eighth at least 0.26 s on (so 0.26 to 0.5 s later: `Engine.dropAt`). In that breath: the hall's tail and the echo of the riser, a clap with a long tail on the call (the word lands on it), a cymbal backwards and a hiss swelling, one held high D opening. Then the first bar of OVERREACT is the drop: full kick, the bass line, the hook, the effects' impact (above 95 Hz), on the same instant. The old sequence (a blow past the limiter, 2 s of riser, a hole at -60 dB, the drop 2.95 s after the call) is gone when the EDM track plays; it remains for the other soundtracks.
- **The held breath before the last hit** is 0.32 s and no longer dead: the bus goes 9 dB down, not 38, so the build is heard through it. The last hit goes through the bus like the rest (nothing past the limiter) at 1.3 times an ordinary top hit, with half its old tail.
- **Every change of state is led into, in time** (`edmLeadIn`, `edmOut`): an ending (won, lost, run won, run lost) starts on the next beat at least 0.4 s on; planning, picking, shop and title start on the next half bar; each with a rising hiss and four snare strokes into the line (into a lost round: a falling hiss and three low knocks). The old state's drums and bass stop on the line; its pads, plucks and lead ring out under the new state for about a second. Nothing cuts in at once any more: a change comes 0.4 to 1.2 s after the page asks.
- **Four styles, one track** (the owner: "All of these"): house while planning in rounds 1 to 6; the festival build and drop for OVERREACT; in rounds 7 and 8, half time at 140 (kick on one, a heavy snare on three, a growling bass whose filter wobbles in eighths and sixteenths over a sine sub); in round 9, drum and bass at 172 (kick on one and the and of three, snare on two and four, sixteenth hats, long reese notes). Prestige laps and the postdoc have no call yet, so nothing changes for them.
- **A turn as three builds** (owner's ruling on pace, 13 November): `AA.music.run(k, of)` and `AA.sfx.reagent(k, of)` mark "reagent k of 3 starts its run". The build lets go (its hiss falls away) and starts again a little higher than the last one started (floor 0, 0.1, 0.2); runs before the last top out at 0.7 (the kick thins but the roll never reaches thirty-seconds) and get no held breath and no big last hit; only the last run can climb to the top and take the breath and the drop. The one climbing tone is let go over a twentieth of a second and made again on the next arrow. Steps are counted from 1 again whether or not the page restarts its numbers. (`AA.sfx.runStart` was already the name of the run-start act, so the effects' call is `reagent`.) **The page does not call these yet.**

### 000.2 Measured

Takes: `p1` 60 s of planning at three heats; `bd` planning, a 9-step chain, OVERREACT, planning, a 4-step chain; `rd` a whole round (title, three turns with chains of 3, 5 and 9, the drop, round won, shop, next round, a lost round). Music and effects together unless said. "Before" is the code as it was this morning, same events.

The beat (60 s of planning):

| | Before | Now |
| --- | --- | --- |
| Tempo found by autocorrelation of the onset envelope, bpm | 124.0 (but see next row) | 126.0 |
| Beats with a kick (a sharp click followed by low end) | 1 of 123 | 124 of 124 |
| Of the 40 loudest transients, on a beat | 9 | 36 |
| Level on the beat against the three sixteenths after it, dB (calm bars) | none to speak of | -9 against -12, -14, -13 |
| Loudness, calm / warm / hot, LUFS | -23.8 / -19.6 / -15.8 | -12.5 / -11.4 / -10.5 |

The kick's timing is written exactly on the grid; the measure of "within 5 ms" in the sound could not be made clean (claps, stabs and lead notes land on the same beats and blur which onset is the kick's), so it rests on the written times. The tempo detector is steady over 60 s but unsteady on 20 s stretches and should not be leaned on.

Bass (the bass layer alone, warm planning): 100 to 400 Hz: -22.4 dB (before -33.2); 400 Hz to 1 kHz: -31.0 (before -39.1). Whole mix, warm planning: 35 to 70 Hz -20.0 dB, 100 to 400 Hz -17.3, 400 Hz to 1 kHz -23.0; a phone (mono, 300 Hz high-pass) keeps all but 5.9 dB (calm 7.6, hot 4.7). Under 120 Hz the sides are 40 dB under the mix (mono).

The build and the drop (`bd`, round 1):

| Bar of the build | 1 | 2 | 3 | 4 | 5 | 6 (the last hit) |
| --- | --- | --- | --- | --- | --- | --- |
| Loudness, LUFS | -12.4 | -12.4 | -12.1 | -11.7 | -11.0 | -9.7 |
| Spectral centroid, Hz | 551 | 536 | 824 | 762 | 1544 | 4996 |
| Low end (35 to 120 Hz), dB | -18.6 | -19.4 | -19.3 | -19.4 | -20.0 | -26.3 |

(That table is from the render before the master's lean-up was added; with it the 1 s loudness through the build reads -12.5, -12.0, -11.4, -10.5, -10.1, -9.0.) Loudness and brightness climb; the low end leaves in the last bar. The onset rate does not climb cleanly by this measure (22 to 26 a second throughout: the hats and plucks of the groove already fill the sixteenths), so the roll's doubling is in the writing, not shown by the number.

| | Before | Now |
| --- | --- | --- |
| From the call to the drop, s | 2.95 | 0.31 (`bd`), 0.40 (`rd`) |
| Quietest 50 ms in it, dB | -62.9 | -26.3 (the second before: -14.0) |
| Loudest second of the build, LUFS | -7.0 | -8.4 |
| Second around the last hit, LUFS | -7.2 | -8.5 |
| First second of the drop, LUFS | -8.4 | -8.0 |
| Drop over the loudest second of the build, dB | -1.5 | +0.4 |
| 2 to 6 kHz, first second of the drop against the second before the call, dB | -0.1 | +0.5 |
| Low end, first half second of the drop against the half second before the call, dB | +3.6 | +8.4 |
| Low end at half its level after the bar line, ms | 13 | 39 |
| Loudness, groove before / drop held, LUFS | -16 / -11 | -12 / -8.7 |
| Peak, dBFS; clipped samples | +0.11; 1 | -0.9; 0 |

The 4-step chain of `bd` rises to -9.8 LUFS at its last hit and is back at -11 a second later, with no drop.

Changes of state (`rd`): the spectrum of the 200 ms after the change against the 200 ms one beat earlier (0 = the same, 1 = nothing in common), and when the change came after the page asked:

| Into | Before: flux, level jump dB, s after the call | Now |
| --- | --- | --- |
| planning (from title) | 0.83, -10.2, 2.25 | 0.22, -0.5, 1.18 |
| OVERREACT | 0.89, +10.8, 0.03 | 0.82, +5.2, 0.40 |
| round won | 0.65, -0.1, 0.03 | 0.35, -0.8, 0.45 |
| shop | 0.62, -0.1, 1.27 | 0.21, -0.2, 0.62 |
| planning (next round) | 0.65, -5.2, 0.51 | 0.26, -1.1, 0.69 |
| a lost round | 0.64, +4.2, 0.03 | 0.75, +2.3, 0.87 |

Measured against the 200 ms just before the change instead, the new version reads worse (0.6 to 1.3 against 0.6 to 0.9): a kick now lands on every change and the window before it has none. The table above compares like with like within the beat. The drop is meant to be a change. **The lost round is not smoother by this measure** (0.75 against 0.64): the drums stop there.

### 000.3 Calls (new or changed)

```
AA.music.run(k, of)        // reagent k of `of` (1 to 3) starts its run of steps: the build starts again; only the last run can reach the top
AA.sfx.reagent(k, of)      // the same for the effects: the tone, the sweep and the count start again without a click
AA.sfx.arrow / reflex / flag(4), AA.music.state / step      // unchanged; flag(4) and state('overreact') still in the same moment
AA.sfx.ownsBuild()         // now means only: the effects are in the EDM palette (the EDM soundtrack plays the build itself)
```

The drop now lands 0.26 to 0.5 s after the call, not 2.95 s: anything on the page timed to the old 2.95 s (the word, the count) should be looked at.

### 000.4 Not done, and what failed

- Nobody but the owner has listened; the owner has heard only the first clip (the beat, before the new sounds) and said "Still no".
- The steps of a chain land where the game puts them, off the beat; only the build around them is on the grid. A kick within 50 ms of a hit is taken out; otherwise hit and kick both sound.
- The thirteen kinds, the room under each hit and the phone loss of each hit were not measured again. The music is now 8 dB less ducked under a chain, so the kinds very likely read less clearly than in section 00's tables.
- The acts of the other screens were not levelled again against the louder music; title, run start, lost and round won were rendered inside the round clip but not measured one by one; redraw, run won, run lost, unlock, finding, creature, instrument are still unrendered.
- Rounds 5 to 9 were not rendered as whole chains; the dubstep and drum-and-bass styles were rendered only as planning. The build and the drop in rounds 7 to 9 play at those tempos with the festival patterns; unheard and unmeasured.
- "Plate-style reverb": the hall is still the made impulse of before (decaying noise, darker towards the end); no new reverb was written.
- The live game was not run: the page's real timing of calls, live CPU (each deck now has eight more nodes for the chorus and the track a master chain), and the look-ahead (a drop 0.26 s after the call is inside the 0.35 s the live clock writes ahead: it should hold, not checked).
- Only the EDM track has the beat, the build, the lead-ins and the master. The other five soundtracks are as they were.
- Tried and dropped: the first heavier mix (kick at 0.44 with a 75 ms tail: 75% of the energy under 120 Hz, every heat the same loudness to 0.1 dB because the clipper was doing all the work); the log-energy tempo detector (it locked to the dotted pluck figure at 84 bpm).

### 000.5 Clips (builder 8)

In `C:\Work\atlas-atoms\.claude\shots` (960-wide copies under `small\`, a `.txt` beside each). Music and effects together.

- `snd8-01-beat.mp4`: planning at three heats (the beat, before the new sounds; the owner: "Still no").
- `snd8-05-heavier.mp4`: the same with the new kick, bass line, chorus and master; then as a phone plays it.
- `snd8-02-build-and-drop.mp4`: a 9-step chain to OVERREACT, then a 4-step chain that resolves with no drop.
- `snd8-06-three-runs.mp4`: one turn as three builds (runs of 3, 4, 6), the third to the drop.
- `snd8-07-house.mp4`, `snd8-08-festival.mp4`, `snd8-09-dubstep.mp4`, `snd8-10-dnb.mp4`: the four styles.
- `snd8-03-a-round.mp4`: a whole round, 88 s.
- `snd8-04-before-after.mp4`: the same 20 s of events, this morning's and now.

<!-- /builder8 -->

## 00. Builder 7 (13 November): one clock, one world

The owner, late on 12 November: "I want the EDM soundtrack for sure but for everything", and, asked what the effects should be, "Sound matched to EDM". This section is the newest; where anything below disagrees with it, this wins.

**Still nobody but the owner has listened.** Everything here was built and judged from measurements of offline renders. The numbers say what it measures, not that it sounds good.

### 00.1 One clock

- `AA.music.clock()` gives the tempo, the time of the next beat and of the next bar line (on the audio clock). Inside, the effects ask the music of their own audio context for its grid at every call (`beats(t0, t1, div)`): bars already written are exact, bars to come are worked out the way the music will write them. When no music with a beat plays, the effects keep a grid of their own at the round's tempo.
- **The heartbeat** is a kick on the beat and its echo a sixteenth later; from half way up the build it also beats on the off-beat. It runs on between the arrows and leaves before the last hit (it stops 45% of the way through the last arrow).
- **The snare roll** is on the grid: eighths, then sixteenths, then thirty-seconds as the build climbs.
- **The riser** (white noise swept up, and on the last arrow two saws climbing) is not quantised: it ends on the hit, wherever the hit falls.
- **The boom of a hit is on the hit.** When the arrow starts the effects tell the music when the hit will land; the music's drums and bass step back 24 dB around it, and the heartbeat leaves out any beat within 0.11 s of a hit. So a kick and a boom never land a few hundredths apart.
- **One build, not two.** While build c is on with the synth palette (`AA.sfx.ownsBuild()`), the EDM track writes no snare roll, no kick and no riser of its own in a chain: the effects' are the build. The music keeps its pads (the filter opening), plucks, hats, the hammered chord and the bass. Without the effects (muted, another build, another style) the music plays its own build as before.
- **Before the last hit** the kick is gone, the lows of the soundtrack are swept out (a high-pass on the music's bus, 20 to 420 Hz across the last arrow) and both stop for the held silence, which is the same silence: the music passes through the same gate.
- **The drop.** Whichever of `AA.sfx.flag(4)` and `AA.music.state('overreact')` is called first says when the drop is (2.95 s after the call) and the other lands on it: the music's first bar of the drop starts on the very time the effects' impact is written.
- Offline renders now call the effects when their time comes, between the music's bars, as the game does (they used to be written all at once before the music existed).

### 00.2 The palette: synthesisers, in the soundtrack's key

All made by our own code, as before; nothing downloaded.

- **A hit**: a kick tuned to the chain chord's root (D, G, C, A) with a sub under it whose tail lengthens with the build and a low rumble in the hall; a short supersaw stab on root and fifth and a knock in the middle (what reads over the music and on a phone); a clap with a snare's body from the first step; a hiss and a white-noise crash that come in by degrees; one clink of lab glass.
- **The one tone** is a supersaw lead (eight saws, three octaves). It is made on the first arrow and lives until the held silence before the last hit: it glides to each step's note (D, E, G, A), swells through each arrow, opens its filter as the build climbs and pumps on the beat. It is never started again.
- **The thirteen kinds** are thirteen synth voices on D, E, G, A: a bell (lactol), falling hiss and a closing stab (enone), two square plucks there and back (taut), a driven low stab and a clang (weld), a rim shot and a blip (snap6), a gated supersaw chord (ether), a sliding saw lead (shift), a tuned tom (tuck), four plucks running up (knit), a thud and a falling zap (seal), a hard metal key (cap), rising hiss and a rising sine (open), a wide soft fifth (fold). Each is levelled by measurement. Glass is kept in three of them.
- **OVERREACT**: 90 ms of silence; the strike, one blow past the limiter (kick, a sub falling an octave and a half, claps, hiss, D in seven octaves of supersaw snapping shut, glass breaking); the riser and the roll into the drop while the music holds its chord; a hole of a fifth of a second; the drop: the effects' impact (above 95 Hz only), crash, clap and D across the octaves on the same instant as the music's kick, sub and hook. **The pay-out is no longer glass and coins**: a gated arpeggio climbs in sixteenths on the music's grid with a stab on each beat, as long as the yield counts (rounded to whole bars), and lands on a bar line with the chord, a clap and a crash. A far clink of glass every half bar is all that is left of the lab.
- **Low end**: at the strike the music has no kick or bass and is held 16 dB down; at the drop the effects stay above 95 Hz and the music's kick and sub have the bottom; in a chain the music's bass and drums step back around every hit. Table below.
- **Rounds**: deeper in the run the heartbeat skips beats, the lead wavers, the boom sags and echoes off the beat, the clap flams, glass falls, the pay-out jumps octaves, a clap lands off the beat after the drop. Level is not raised.
- `AA.sfx.palette('orch')` brings back builder 6's orchestra for build c (and the music's own build with it); `AA.sfx.palette('edm')` is the default. Not saved between sessions.

### 00.3 Every screen

In style 4 with the synth palette, the acts of the other screens are plucks, stabs, claps and sweeps in D. Each starts on the music's next sixteenth (at most about an eighth of a second after the call) and what follows inside it is counted in the music's sixteenths. Hover and click sound at once.

| Act | What plays |
| --- | --- |
| title | a kick, a wide D chord, a crash, one high pluck a beat later |
| runStart | a sweep up for a beat, then kick, clap and chord |
| pick (a molecule) | a kick, a short chord, a pluck an eighth later |
| fire (the line fires) | a kick on the grid and a sweep up out of it |
| shopOpen | three plucks up, a clink of glass |
| buy | a small kick and pluck, then a higher pluck with a clap and a coin far back |
| cantBuy | two low square notes |
| hover, click | a tiny high tick; a short pluck with a click |
| redraw | hiss falling, two plucks |
| roundWon | three plucks up to the beat, then kick, clap, crash and the D chord |
| lost | four plucks falling, filter closing, a low note sinking |
| runWon | G, A sus, D major, a beat each, an arpeggio running up out of it |
| runLost | the lead falls and its filter closes onto a low D |
| unlock | a sweep and four plucks up to a clap and chord, a flask ringing |
| finding, creature, instrument | two plucks and glass; a wet low growl; a sweep into kick and chord |

Left as they were (lab glass and bench sounds, as texture): a reagent set down (`queue`), a reagent landing (`strike`), `handoff`, the yield tick, runoff into its jar (`clink`), `gold`, `wasted`, the tremble, the room ambience.

Checked in the 90 s walk (round 1): the quantised acts start within a few thousandths of a second of a grid point; pick, fire, buy, roundWon, shopOpen, cantBuy, click and hover were then set against the music by level. **Not rendered at all**: title, runStart, redraw, lost, runWon, runLost, unlock, finding, creature, instrument. Their levels are guesses from the acts that were.

### 00.4 Measured

The 9-step chain to OVERREACT over EDM, round 1. "Effects alone" is the same calls with the music silent (its clock still running).

| Step (round 1, effects alone unless said) | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 (last) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Hit, dB | -25.1 | -21.0 | -21.6 | -18.9 | -18.8 | -18.5 | -16.5 | -17.0 | -12.1 |
| Arrow, dB | -23.3 | -22.9 | -20.7 | -21.2 | -20.9 | -20.2 | -19.9 | -17.8 | -16.7 |
| Centre of the hit, Hz | 872 | 614 | 553 | 1622 | 1017 | 1291 | 2134 | 3547 | 7169 |
| Share of the hit over 2 kHz, % | 4.6 | 4.9 | 3.4 | 30.7 | 10.7 | 16.8 | 20.3 | 53.9 | 67.5 |
| Share of the hit from 300 Hz to 2 kHz, % | 80.4 | 47.1 | 52.9 | 38.0 | 15.9 | 37.8 | 59.3 | 15.2 | 13.7 |
| Hit lost through a phone speaker, dB | 0.8 | 3.1 | 2.3 | 2.0 | 3.5 | 2.2 | 1.1 | 1.0 | 1.8 |
| Room under the hit, ducked, dB | 18.6 | 20.0 | 20.7 | 24.4 | 25.0 | 21.7 | 22.3 | 22.2 | 43.8 |
| Room under the hit, un-ducked, dB | 4.2 | 9.1 | 7.8 | 9.9 | 10.6 | 9.3 | 10.7 | 10.1 | 15.1 |
| Room under the arrow, ducked, dB | 11.9 | 14.4 | 15.2 | 14.8 | 16.8 | 14.8 | 15.0 | 16.6 | 19.5 |
| Room under the arrow, un-ducked, dB | 4.1 | 7.0 | 8.8 | 7.7 | 8.3 | 7.9 | 7.5 | 9.5 | 10.6 |
| Builder 6: share of the hit over 2 kHz, % | 1.0 | 1.5 | 2.1 | 3.7 | 5.7 | 12.3 | 11.6 | 16.1 | 24.8 |
| Builder 6: hit lost through a phone speaker, dB | 9.4 | 8.0 | 7.7 | 7.7 | 7.4 | 5.8 | 5.6 | 4.0 | 3.0 |
| Builder 6: room under the hit, un-ducked, dB | 2.9 | 3.4 | 3.4 | 3.7 | 5.2 | 5.2 | 6.0 | 6.0 | 13.0 |

Every take:

| Take | Rise, hit 1 to 8, dB | Steps 1 to 8, dB | Steps not louder | Last hit over hit 8, dB | First four hits lost on a phone, dB | Room under the first arrow, dB | Least room under a hit, ducked / un-ducked, dB | Held silence before the last hit, dB | Peak, dBFS | Clipped samples |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| round 1 | 8.1 | 4.1 -0.6 2.7 0.1 0.3 2.0 -0.5 | 2 | 4.9 | 0.8 3.1 2.3 2.0 | 11.9 | 18.6 / 4.2 | -70.5 | -0.12 | 0 |
| round 5 | 8.6 | 3.5 -0.8 2.8 1.1 -0.4 2.0 0.4 | 2 | 4.1 | 1.4 5.0 1.8 2.5 | 7.8 | 18.2 / 1.3 | -69.3 | -0.06 | 0 |
| round 9 | 9.6 | 6.0 -1.3 2.5 1.0 -0.8 2.5 -0.3 | 3 | 4.2 | 1.4 5.5 1.9 2.3 | 7.7 | 14.1 / 0.1 | -66.6 | -0.11 | 0 |
| round 1, hot planning (the chain of 9 of the walk) | 8.5 | 3.0 0.1 1.3 2.1 0.0 1.7 0.3 | 1 | 3.5 | 3.1 3.4 2.3 1.4 | 7.0 | 15.4 / 1.7 | -68.2 | -0.1 | 0 |
| builder 6, round 1 (before) | 8.0 | 1.2 1.3 0.5 1.5 1.0 1.5 1.0 | 0 | 6.2 | 9.4 8.0 7.7 7.7 | 6.9 | 14.7 / 2.9 | -63.8 | -0.35 | 0 |

One clock:

| Take | Heartbeats written | Furthest from the music's grid, ms | Music's bar line at the drop, ms from the effect's drop | Music's kick heard (30 to 100 Hz), ms after | Effect's impact heard (over 1 kHz), ms after | Gap, ms |
| --- | --- | --- | --- | --- | --- | --- |
| round 1 | 21 | 0.4 | 0.0 | 22.1 | 10.1 | 12.0 |
| round 5 | 19 | 0.5 | 0.0 | 22.3 | 10.2 | 12.2 |
| round 9 | 22 | 0.4 | 0.0 | 22.4 | 10.2 | 12.2 |
| round 1, hot planning (the chain of 9 of the walk) | 46 | 0.4 | 0.0 | 22.1 | 10.2 | 11.9 |
| builder 6, round 1 (before) | 0 | None | 0.0 | 16.0 | -150.0 | 166.0 |

OVERREACT:

| Take | Silence before the strike, dB | Strike, first 100 ms, dB | Strike, 50 ms steps to 0.8 s, dB | Fallen after 300 ms, dB | The hole before the drop, dB | Second before the drop, dB | Drop, first 100 ms, dB | Drop, first 2 s, dB | Pay-out: effects / music, dB | 30 to 60 Hz at the strike: effects / music, dB | 30 to 60 Hz at the drop: effects / music, dB | LUFS, chain / drop |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| round 1 | -45.9 | -7.7 | -7.3 -8.2 -8.8 -14.2 -16.9 -18.3 -26.5 | -9.6 | -60.7 | -18.2 | -12.4 | -14.2 | -17.9 / -17.1 | -15.4 / -103.1 | -41.7 / -34.4 | -14.7 / -11.2 |
| round 5 | -45.7 | -7.7 | -7.3 -8.1 -9.1 -14.0 -17.0 -18.4 -26.1 | -9.7 | -59.8 | -18.7 | -12.3 | -13.7 | -17.6 / -16.8 | -15.7 / -95.1 | -40.9 / -34.1 | -14.6 / -10.9 |
| round 9 | -45.6 | -7.6 | -7.4 -7.8 -8.9 -14.7 -17.2 -18.3 -26.0 | -9.8 | -60.8 | -18.2 | -12.7 | -13.9 | -16.6 / -17.7 | -15.7 / -95.4 | -42.5 / -34.2 | -14.5 / -11.3 |
| round 1, hot planning (the chain of 9 of the walk) | -47.3 | -7.6 | -7.0 -8.3 -10.0 -14.0 -17.5 -19.1 -27.1 | -10.5 | -61.2 | -18.5 | -12.7 | -13.9 | -17.7 / -16.6 | -15.9 / -103.4 | -44.9 / -36.6 | -14.4 / -11.3 |
| builder 6, round 1 (before) | -41.2 | -5.7 | -5.5 -5.9 -7.2 -7.7 -10.9 -14.5 -18.7 | -5.4 | -12.5 | -13.0 | -10.6 | -10.5 | -10.5 / -23.9 | -12.2 / -92.4 | -21.1 / -24.6 | -17.2 / -9.8 |

The thirteen kinds, mean and smallest difference of their level-normalised third-octave spectra, dB (alone: mean, closest (19.2, 5.8); in a step-6 hit: mean, closest (10.0, 1.1)). Wanted: at least 9.4 in a step-6 hit.

What the numbers say, and do not:

- **One clock**: every heartbeat was written within half a millisecond of the music's grid (the half millisecond is the rounding of the bar log). The drop: the music's bar line and the effects' impact are written on the same time (0.0 ms apart). In the sound, the music's kick passes 10% of its level 22 ms after that time and the effects' impact 10 ms after: 12 ms apart, under the 20 asked for, but the two are measured in different bands (a kick's body rises slower than noise), and about 6 ms of both is the limiter's own delay. Whether the heartbeats are on the grid *in the sound* could not be measured cleanly (a low thump has no sharp start); it rests on the written times.
- **The first hits**: 3 to 5% of the first hits is over 2 kHz in round 1 (it was 1 to 2%), and 47 to 80% is between 300 Hz and 2 kHz. Each of the first four hits loses 0.8 to 5.5 dB on a phone (it was 7.7 to 9.4): under 6 in every take. Un-ducked, the first hit is 4.2 dB over the music in round 1 but only 0.1 to 1.7 dB over it in round 9 and after hot planning: the first hit still leans on the duck there.
- **Brightness and size still climb, but not evenly.** The rise from hit 1 to hit 8 is 8.1 to 9.6 dB. One to three of the seven steps in each take are flat or slightly down (by 0.3 to 1.3 dB): each kind's own voice is now loud enough to be told apart, and it sets the level and the brightness of its step more than the step does. Builder 6's climb was even; its kinds were buried. This is a trade and the owner should hear it.
- **The first arrow** has 7.0 to 11.9 dB of room (asked: 6).
- **The last hit is 3.5 to 4.9 dB over the hit before** (asked: 6; builder 6: 6.2). Not reached: the blow is already at its ceiling and the ordinary hits were kept up for the sake of room.
- **The strike is a blow**: 10 dB down 300 ms after it starts, 19 dB down after 800 ms (builder 6: 5 and 13). It is 1.6 to 2 dB quieter at its top than builder 6's (-7.7 against -5.7 dB): driven harder the two ceilings clipped.
- **The drop** is 4 to 5 dB over the second before it and comes out of a hole at -60 dB. It is quieter overall than builder 6's (-11 against -9.8 LUFS): the glass, coins, brass and drums that filled it are gone, and the music's own drop is what plays. The pay-out's arpeggio is level with the music (within 1 dB). Whether that reads as a reward or as thin is unheard.
- **Low end**: from 30 to 60 Hz the effects are alone at the strike (the music 80 dB under) and 7 to 8 dB under the music at the drop.
- **Clipping**: see the table; the last change (the bus opening more slowly behind the last hit) was made to remove one to three clipped samples 0.22 s after the last hit.
- **Kinds**: the mean distance in a step-6 hit meets the 9.4 asked; the closest pair is only about 1 dB apart in this measure, so at least two kinds are near twins inside a hit (alone, the closest pair is 5.8 dB apart).

### 00.5 Calls (new or changed)

```
AA.music.clock()            // { bpm, spu (seconds a sixteenth), upb, beat, bar, state } or null
AA.sfx.ownsBuild()          // true while the effects make a chain's roll, kick and risers (the music then leaves its own out)
AA.sfx.palette('edm'|'orch')// the palette of build c; 'edm' by default
AA.sfx.arrow(n, ms, { last, of, gap })   // unchanged, and now more important: `of` and `gap` let the heartbeat and the tone be written up to the next arrow
AA.music.step(n, of)        // unchanged
```

Order does not matter between `AA.sfx.flag(4)` and `AA.music.state('overreact')`, but both must be called within the same moment (the drop is 2.95 s after the first of them).

### 00.6 Not done, and what failed

- Nobody has listened. The synth voices are oscillators through filters, written blind: whether the lead reads as a club lead or as a toy, whether the claps are claps, whether the kinds are pleasant, is unheard.
- The last hit is under 6 dB over the hit before; some steps of the climb are flat; un-ducked, the first hit is level with hot music (all above).
- The heartbeat is quantised only if the page passes `gap` or the arrows come at a steady pace; a hit that comes later than its arrow said lands where the page puts it, and the heartbeat's gap around it was cut for the time the arrow gave.
- In rounds 5 to 9 the music's tempo drifts inside a section; the effects follow bars not yet written by working them out, and a bar that starts a new section could be off by a few milliseconds. Not measured beyond the heartbeats above (0.5 ms at rounds 5 and 9).
- Only EDM answers the effects (leaves out its own roll, kick and riser; ducks drums and bass around a hit). Over funk, gothic, metal, surf and baroque the effects still follow the grid, but both builds play.
- A live game was not run: the page's order and timing of calls, live CPU (the lead is nine oscillators for the length of a chain; a hit is about forty short voices), and the half-second look-ahead of the live music clock were not checked.
- Ten acts were never rendered (00.3). `queue`, `strike`, `clink`, `gold` and the rest of the bench sounds are still builder 4's lab sounds.
- Tried and dropped: both blows driven as hard as builder 6's (the sum of the two ceilings clipped by 1.2 dB); the kinds at half the level of the hit's drums (mean distance 5.2 dB: they could not be told apart); a heavy sub on every hit (9 to 12 dB lost on a phone); letting `ac()` resume an offline render (the first arrow of every render went missing).

### 00.7 Clips (builder 7)

In `C:\Work\atlas-atoms\.claude\shots` (960-wide copies under `small\`, a two-line `.txt` beside each). Every clip is effects and EDM together.

- `snd7-01-one-clock.mp4`: a 9-step chain to OVERREACT, (1) as builder 6 left it, (2) now.
- `snd7-02-overreact-drop.mp4`: three OVERREACTs: rounds 1, 5 and 9.
- `snd7-03-a-round.mp4`: about 90 s: planning over three turns, chains of 3, 5 and 9, the drop, round won, shop, with the acts of the screens.
- `snd7-04-kinds.mp4`: the thirteen kinds, each at step 6 of 9, over EDM.

<!-- /builder7 -->

<!-- builder6 -->
## 0. Builder 6 (12 November, late): the owner's two picks, finished

The owner heard builder 5's clips and picked build-up **c, cinematic**, and of the six soundtracks ticked **EDM** to keep and finish. This section is the newer one; where sections 1 to 7 below disagree with it, this wins.

**Still nobody but the owner has listened.** Everything here was built and judged from measurements of offline renders. The numbers say what it measures, not that it sounds good.

### 0.1 Build-up c is the default

`AA.sfx.build()` now answers `'c'` on a fresh install. The choice is saved between sessions (`overreact.sfx.build`); `?build=a|b|c|off` in the address wins. A build only plays in style 4 (the default style); the older styles sound as themselves.

What was rebuilt in c:

- **The boom** is a new made drum (`boomc`): a sub at 37 Hz, drum modes from 73 to 700 Hz (the body), a thud and a crack a phone can play, a long low tail, and a heavy send to the hall. With it a barrel drum, a kick, two toms and a dark snare.
- **The riser**: the one climbing tone (D, E, G, A, step by step, sliding up while the arrow is drawn, held until the next arrow) is now stacked in up to four octaves; low brass swells into every hit on the chain chord's root, fifth and octave; a cymbal roll opens under it; the cymbal played backwards still runs from each hit to the next.
- **The heartbeat** has a knock above 300 Hz and quickens as the chain goes on.
- **Every layer's level is one smooth curve** of the place in the chain, so no layer "joins" on a step. The bright layers (snare top, crack, cymbal, gong, hiss) all sit on one curve, 11 dB down at step 1. The kind's own voice goes through a filter that opens with the chain, so the step sets the brightness more than the kind does.
- **The soundtrack is pushed down** 9.6 dB under each arrow and 12 dB under each hit (it was 4.4 and 10.5), and comes back by itself if no hit follows.
- **The last hit** goes past the bus's limiter for its first 0.12 s (as OVERREACT's strike does) and the bus opens behind it with the tail, brass on D and a second cymbal. The held silence (0.32 s) is unchanged.
- **OVERREACT**: the resolve is now the smaller landing (its drums and brass at 45%, the whole bus held half down, the soundtrack half down again); 0.92 s later the **lift** lets everything go: a boom, a crash, snare, gong, brass and pads from D2 to D6, a cymbal backwards and a snare roll up to it; then a cascade of glass and coins falls and the pay-out counts up.
- **Rounds** (`AA.sfx.round`): deeper in the run the heartbeat races and skips beats, the tone wavers and a wrong note leans up into it, the boom sags in pitch and echoes off the beat, the snare flams, glass falls after each hit. Level is not raised.

### 0.2 Build-up c, measured

Per step (the 9-step chain, alone, round 1). Levels are RMS in dB under full scale: the arrow over its whole length, the hit over its first 300 ms.

| Step | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 (last) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Arrow, dB | -28.2 | -27.0 | -25.9 | -25.4 | -23.9 | -22.9 | -22.3 | -21.1 | -20.4 |
| Hit, dB | -26.6 | -25.5 | -24.1 | -23.7 | -22.3 | -20.9 | -19.6 | -18.7 | -12.6 |
| Hit over the 100 ms before it, dB | 9.6 | 8.9 | 8.5 | 9.8 | 9.3 | 8.0 | 9.0 | 7.5 | 59.9 |
| Centre of the hit, Hz | 180 | 229 | 251 | 327 | 512 | 556 | 856 | 1066 | 2009 |
| Share of the hit over 2 kHz, % | 1.0 | 1.5 | 2.1 | 3.3 | 4.9 | 7.0 | 13.0 | 16.1 | 28.0 |
| Centre of the arrow, Hz | 118 | 156 | 173 | 169 | 219 | 267 | 409 | 432 | 651 |
| Hit lost through a phone speaker, dB | 9.4 | 8.5 | 8.0 | 7.5 | 6.2 | 5.8 | 4.8 | 4.5 | 3.2 |


The same measures for every take.

| Take | Rise, hit 1 to hit 8, dB | Step sizes 1 to 8, dB | Steps not louder | Steps not brighter (share over 2 kHz) | Steps not brighter (centre) | Last hit over hit 8, dB | Last hit over the last arrow, dB | Held silence, dB | OVERREACT strike, dB | Resolve, dB | Lift, dB | Lift over resolve, dB | Pay-out, dB | Phone loss, chain, dB | Phone loss, strike, dB | Peak, dBFS | Clipped samples |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| alone, round 1 | 7.9 | 0.4 to 1.4 | 0 | 0 | 0 | 6.1 | 7.8 | -65.1 | -7.0 | -12.3 | -10.9 | 1.4 | -11.3 | 3.5 | 6.5 | -0.12 | 0 |
| alone, round 1, other kinds | 7.9 | 0.2 to 1.6 | 0 | 1 | 0 | 6.8 | 8.8 | -65.1 | -7.2 | -12.3 | -11.1 | 1.2 | -11.1 | 3.2 | 6.4 | -0.39 | 0 |
| alone, round 5 | 7.4 | 0.5 to 1.6 | 0 | 0 | 0 | 6.8 | 8.9 | -64.8 | -6.9 | -12.8 | -10.4 | 2.4 | -11.0 | 3.1 | 6.8 | -0.33 | 0 |
| alone, round 9 | 6.7 | 0.2 to 1.8 | 0 | 0 | 0 | 7.1 | 8.6 | -64.1 | -6.8 | -12.4 | -10.8 | 1.6 | -11.3 | 3.2 | 6.1 | -0.26 | 0 |
| with EDM (the mix) | 7.9 | 0.7 to 1.5 | 0 | 1 | 0 | 6.3 | 7.9 | -64.6 | -6.8 | -13.0 | -10.8 | 2.2 | -11.4 | 3.1 | 6.7 | -0.35 | 0 |
| with funk (the mix) | 7.6 | 0.7 to 1.5 | 0 | 2 | 0 | 6.9 | 8.2 | -64.2 | -6.9 | -12.9 | -11.1 | 1.8 | -11.3 | 2.6 | 6.1 | -0.39 | 0 |


Room over the soundtrack under each hit and each arrow: the level of the effects alone against what is left of the soundtrack in the mix at that moment (the mix less the effects, same calls), and against the soundtrack alone with nothing pushing it down ("un-ducked").

|  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | Least |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EDM: under the hit, dB | 14.5 | 14.4 | 15.7 | 17.3 | 18.6 | 18.1 | 17.1 | 19.9 | 31.3 | 14.4 |
| EDM: under the arrow, dB | 3.6 | 7.8 | 7.0 | 7.9 | 9.2 | 10.2 | 10.4 | 11.2 | 12.9 | 3.6 |
| EDM: hit, un-ducked, dB | 1.0 | 3.0 | 3.6 | 4.3 | 6.0 | 6.1 | 5.9 | 7.2 | 13.5 | 1.0 |
| funk: under the hit, dB | 11.9 | 10.5 | 13.3 | 9.7 | 11.1 | 11.1 | 13.8 | 13.1 | 32.3 | 9.7 |
| funk: under the arrow, dB | 4.6 | 7.3 | 10.8 | 8.9 | 5.7 | 7.1 | 7.8 | 8.0 | 11.1 | 4.6 |
| funk: hit, un-ducked, dB | -0.7 | 0.7 | 2.8 | 1.3 | 0.6 | 1.2 | 2.8 | 2.6 | 12.9 | -0.7 |


What the numbers say, and do not:

- **Level**: every step is louder than the one before in every take. The rise from hit 1 to hit 8 is 6.7 to 7.9 dB (builder 5's c: 7.4), the steps are 0.2 to 1.8 dB each: rising, but not equal, and the smallest ones are too small to hear as a step.
- **Brightness**: the centre of the hit rises on every step in every take. The share over 2 kHz rises on every step in four takes; in the two takes over a soundtrack one or two steps do not (the kind of that step still shows through).
- **Last hit**: 6.1 to 7.1 dB over the hit before, 7.8 to 8.9 dB over the last arrow, no clipped samples. The margin over 6 dB is thin.
- **Lift**: 1.2 to 2.4 dB over the resolve: above it, not by much. That was got by making the resolve smaller, not the lift louder: the bus's limiter holds everything dense near -10 dB. OVERREACT's strike (-7) is still the loudest moment and what follows is under it.
- **Room**: under every hit the effects are at least 9.7 dB (funk) and 14.4 dB (EDM) over what is left of the soundtrack. **That is only because the soundtrack is ducked.** Un-ducked, the first hits are level with it (-0.7 to 1.0 dB). Under the first arrow the room is 3.6 to 4.6 dB.
- **Phone speaker**: the chain as a whole loses 2.6 to 3.6 dB through a 300 Hz high-pass (it was 9.4). The first four hits still lose 7.5 to 9.4 dB each: they are low thuds. The climbing tone was not measured by itself; the arrow's centre climbs from 118 to 715 Hz.
- **Held silence**: -64 dB in an offline render with perfect timing. Live, a late hit would let the bus open early (see 0.6).
- **Rounds 5 and 9**: the tables barely move, as meant (manner, not level). Whether round 9 reads as unhinged or as a mess is unheard.

### 0.3 The EDM soundtrack ("Chain Reactor"), finished

What it does now, by game state:

- **Planning is the breakdown**: supersaw pads through a closed filter, a filtered pluck figure, a long clean sub, space. Each turn's result (`AA.music.turn`) opens the filter and adds layers: off-beat hats, a soft filtered kick, the bass off the beat, claps, the saw lead, stabs.
- **A chain is the build**: a snare roll that doubles (quarters, eighths, sixteenths, thirty-seconds) and climbs in pitch, a hiss riser and a two-saw pitch riser, the chord hammered in eighths then sixteenths. The kick loses its low end half way up and is gone, with the bass, for the last quarter. **New:** if the game says how long the chain is (`AA.music.step(n, of)`), the build is timed to it and stops dead on the last hit; if not, it is timed as if every chain had 16 steps (as before).
- **OVERREACT is the drop**. **New:** the first bar is stretched to end exactly on the effect's lift (2.95 s after the call): a hiss and two saws climbing two octaves to D, the D sus chord with its filter opening, a snare roll doubling. On the lift: impact, crash, the full kick, sub and bass, and the hook (the tune, three octaves of supersaw) from its first bar.
- **Round won is the release**: its own four bars landing on D, then easing off bar by bar. Shop, title, bench, pick, lost, run won, run lost all play (table below).
- **Sidechain**: bass, pads, stabs, lead, plucks and the new air layer dip at every kick.
- **Top end**: the deck's own filter now runs from 10 to 20 kHz (it was 6.5 to 20), pads and plucks open further, hats and open hats are up 4 to 5 dB, and a band of hiss at 9.5 kHz sits over the pads and pumps with them.
- **Low end**: kick down 1.6 dB, sub down 3 dB and down again when hot, the bass layer down 3.5 dB. The sub is a sine with a trace of second harmonic and is mono (its side signal is 20 to 34 dB under its middle).
- **Rounds**: 124 beats a minute in round 1 to 134 in round 9; later rounds add a stuttered or missing last beat, half-time bars, wild filter sweeps, wrong notes in the figure, a fake drop inside the bar before the drop, and (new) bars of wobble bass in triplets, eighths or sixteenths. All by chance, so one round may show little of it.
- Key D (mixolydian), chain roots D, G, C, A: unchanged, shared with the effects.

### 0.4 EDM, measured


Round 1 (the 90 s walk, music alone unless said).

| State | LUFS | With effects, LUFS | Centre, Hz | Under 60 Hz, % | Under 120 Hz, % | 1 to 4 kHz, % | Over 4 kHz, % | Over 10 kHz, % | Side under middle, dB | Side under middle below 120 Hz, dB | Phone loss, dB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| planning, turn 1 (cool) | -25.3 | -25.2 | 564 | 2.7 | 6.0 | 12.0 | 0.4 | 0.06 | -6.6 | -19.9 | 1.9 |
| a chain of 3 | -26.5 | -13.2 | 879 | 2.5 | 11.8 | 16.6 | 3.5 | 0.62 | -7.4 | -24.4 | 1.8 |
| planning, turn 2 (warmer) | -20.6 | -20.5 | 685 | 3.7 | 16.1 | 14.0 | 1.1 | 0.17 | -9.0 | -28.2 | 2.5 |
| a chain of 5 | -23.3 | -15.4 | 1564 | 0.9 | 4.8 | 26.3 | 10.0 | 2.24 | -8.6 | -23.2 | 1.2 |
| planning, turn 3 (hot) | -17.9 | -17.7 | 652 | 6.0 | 30.0 | 11.4 | 2.5 | 0.52 | -9.3 | -29.2 | 2.7 |
| a chain of 9 | -21.6 | -16.7 | 1015 | 3.6 | 14.8 | 17.5 | 4.9 | 0.99 | -9.0 | -26.4 | 1.7 |
| OVERREACT: the drop | -13.6 | -10.8 | 902 | 10.7 | 27.0 | 18.0 | 4.0 | 0.81 | -9.8 | -24.8 | 2.4 |
| round won | -20.1 | -19.9 | 868 | 5.6 | 27.0 | 25.3 | 3.5 | 0.5 | -9.3 | -27.3 | 2.8 |
| shop | -20.6 | -20.5 | 710 | 5.7 | 22.5 | 15.0 | 1.3 | 0.2 | -11.8 | -31.9 | 2.0 |


Room under the hits, dB (ducked / un-ducked): chain of 3: 17.5 / 6.3, 19.4 / 8.0, 39.2 / 18.0; chain of 5: 15.5 / 2.9, 16.9 / 2.7, 17.8 / 6.0, 20.1 / 6.9, 37.0 / 13.9; chain of 9: 11.3 / -1.3, 13.1 / 0.9, 14.8 / 1.5, 14.4 / 1.9, 16.5 / 3.3, 18.1 / 4.0, 16.5 / 5.1, 16.5 / 6.0, 30.4 / 11.8. Least ducked 11.3, least un-ducked -1.3. Peak of the music -2.42 dBFS, of the mix -0.33; clipped samples 0.

The second before the drop -18.8 dB, the first two seconds of the drop -14.5 dB. Bass under 120 Hz under the last arrow -41.2 dB, under the arrow of step 5 -30.9 dB (the kick and bass have left).


Round 5 (the 90 s walk, music alone unless said).

| State | LUFS | With effects, LUFS | Centre, Hz | Under 60 Hz, % | Under 120 Hz, % | 1 to 4 kHz, % | Over 4 kHz, % | Over 10 kHz, % | Side under middle, dB | Side under middle below 120 Hz, dB | Phone loss, dB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| planning, turn 1 (cool) | -24.0 | -23.9 | 656 | 2.3 | 4.9 | 14.7 | 0.6 | 0.11 | -7.4 | -20.6 | 1.5 |
| a chain of 3 | -23.7 | -14.0 | 1675 | 0.6 | 4.1 | 34.0 | 11.0 | 1.57 | -9.5 | -20.6 | 0.7 |
| planning, turn 2 (warmer) | -19.8 | -19.7 | 643 | 4.3 | 21.7 | 14.3 | 1.3 | 0.27 | -9.1 | -28.7 | 2.3 |
| a chain of 5 | -22.6 | -15.2 | 1629 | 0.7 | 4.6 | 32.6 | 10.1 | 2.02 | -8.7 | -23.9 | 0.9 |
| planning, turn 3 (hot) | -17.0 | -16.8 | 719 | 5.3 | 22.2 | 14.9 | 2.6 | 0.43 | -9.4 | -28.3 | 2.5 |
| a chain of 9 | -20.5 | -16.3 | 1124 | 2.8 | 12.1 | 21.3 | 5.3 | 0.93 | -9.2 | -26.4 | 1.4 |
| OVERREACT: the drop | -12.6 | -10.4 | 973 | 8.6 | 22.7 | 20.6 | 3.9 | 0.81 | -10.0 | -24.8 | 1.9 |
| round won | -19.0 | -18.9 | 847 | 5.8 | 25.2 | 21.5 | 3.3 | 0.46 | -9.6 | -27.7 | 2.4 |
| shop | -18.5 | -18.4 | 734 | 3.8 | 16.0 | 15.2 | 1.3 | 0.14 | -12.0 | -32.2 | 1.8 |


Room under the hits, dB (ducked / un-ducked): chain of 3: 17.1 / 4.2, 19.4 / 7.7, 35.6 / 14.3; chain of 5: 16.5 / 2.6, 16.2 / 4.1, 16.6 / 5.6, 19.6 / 7.2, 36.6 / 14.0; chain of 9: 10.5 / -2.4, 10.6 / -1.4, 14.7 / 1.4, 15.9 / 2.4, 16.3 / 3.6, 16.2 / 3.2, 16.7 / 4.6, 17.4 / 4.6, 30.5 / 11.2. Least ducked 10.5, least un-ducked -2.4. Peak of the music -2.66 dBFS, of the mix 0.06; clipped samples 1.

The second before the drop -17.9 dB, the first two seconds of the drop -14.0 dB. Bass under 120 Hz under the last arrow -47.2 dB, under the arrow of step 5 -30.8 dB (the kick and bass have left).


Round 9 (the 90 s walk, music alone unless said).

| State | LUFS | With effects, LUFS | Centre, Hz | Under 60 Hz, % | Under 120 Hz, % | 1 to 4 kHz, % | Over 4 kHz, % | Over 10 kHz, % | Side under middle, dB | Side under middle below 120 Hz, dB | Phone loss, dB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| planning, turn 1 (cool) | -22.9 | -22.8 | 688 | 2.2 | 4.5 | 16.4 | 0.9 | 0.1 | -8.4 | -21.4 | 1.3 |
| a chain of 3 | -23.0 | -13.4 | 2542 | 0.3 | 1.7 | 32.0 | 18.8 | 4.2 | -9.3 | -20.9 | 0.7 |
| planning, turn 2 (warmer) | -19.5 | -19.4 | 619 | 4.2 | 21.5 | 12.2 | 1.2 | 0.29 | -9.8 | -29.0 | 2.4 |
| a chain of 5 | -22.1 | -15.0 | 1686 | 1.2 | 7.5 | 32.1 | 10.6 | 2.12 | -9.0 | -24.8 | 1.0 |
| planning, turn 3 (hot) | -16.7 | -16.6 | 741 | 5.7 | 25.9 | 14.8 | 3.0 | 0.52 | -9.2 | -29.0 | 2.4 |
| a chain of 9 | -20.2 | -16.6 | 1401 | 1.9 | 8.8 | 31.2 | 7.2 | 1.26 | -9.3 | -25.9 | 1.2 |
| OVERREACT: the drop | -13.4 | -10.5 | 925 | 11.1 | 27.7 | 18.4 | 4.2 | 0.83 | -9.9 | -24.9 | 2.4 |
| round won | -19.5 | -19.3 | 826 | 7.0 | 29.4 | 22.5 | 3.5 | 0.49 | -9.8 | -28.3 | 3.1 |
| shop | -18.9 | -18.7 | 716 | 5.1 | 20.4 | 14.1 | 1.3 | 0.19 | -12.1 | -33.6 | 1.9 |


Room under the hits, dB (ducked / un-ducked): chain of 3: 19.5 / 8.1, 19.4 / 6.4, 35.4 / 15.2; chain of 5: 14.8 / 3.1, 16.8 / 2.3, 17.9 / 4.5, 19.7 / 7.1, 37.5 / 13.9; chain of 9: 11.1 / -1.3, 12.9 / -0.8, 13.6 / 0.7, 14.4 / 1.4, 15.8 / 2.7, 16.0 / 4.0, 15.8 / 4.7, 16.9 / 5.3, 30.4 / 11.5. Least ducked 11.1, least un-ducked -1.3. Peak of the music -2.59 dBFS, of the mix -0.12; clipped samples 0.

The second before the drop -17.7 dB, the first two seconds of the drop -14.6 dB. Bass under 120 Hz under the last arrow -44.5 dB, under the arrow of step 5 -30.7 dB (the kick and bass have left).


Every state, the checks builder 5 skipped:

| State (round 1, 16 s each, music alone) | LUFS | Peak, dBFS | Under 120 Hz, % | Clipped |
| --- | --- | --- | --- | --- |
| title | -18.2 | -5.5 | 28.7 | 0 |
| bench | -22.8 | -6.6 | 6.4 | 0 |
| pick | -24.0 | -9.4 | 2.1 | 0 |
| plan (cool) | -24.7 | -11.2 | 5.3 | 0 |
| chain (12 steps, length not told) | -23.8 | -9.6 | 5.6 | 0 |
| overreact | -13.4 | -2.5 | 25.5 | 0 |
| won | -20.6 | -8.4 | 29.8 | 0 |
| shop | -20.4 | -7.0 | 20.8 | 0 |
| lost | -26.1 | -9.7 | 5.8 | 0 |
| runwon | -14.7 | -3.6 | 26.5 | 0 |
| runlost | -22.8 | -9.1 | 2.5 | 0 |


- **Rounds 1, 5, 9** (eight bars of the title): 15.5, 14.6, 13.8 s; -17.7, -16.6, -16.7 LUFS. Faster; about 1 dB louder from round 5.
- **Repeats in 12 minutes** (title, planning, shop; two seeds each): no four bars and no eight bars ever come back the same. The eight-bar tune alone comes back as written after 128 s (title), 159 s (planning), 33 s (shop): that is the hook returning, on purpose. Two seeds share 0% of their bars.
- **Cost**: 72 recordings made in 0.19 s (12.6 MB); offline render 0.054 s per second of music; at most 193 voices at once in the states take, 244 in a round 9 chain. Live CPU in the game was not measured.
- **Before and after** (round 1): over 4 kHz in the drop 1.9% to 4.0%, in hot planning 1.2% to 2.5%, in cool planning 0.0% to 0.4%; under 120 Hz in the drop 38.6% to 27%, in hot planning 41% to 30%.

What the numbers say, and do not:

- It is brighter and less bass-heavy than the draft, and about where funk measures on top (funk's drop: 3.4% over 4 kHz). Cool planning is still nearly all under 4 kHz: a breakdown is meant to be filtered, but it may read as dull.
- Hot planning has as much bass share as the drop (30% against 27%), and the drop's first two seconds are only 4.3 dB over the second before it. The drop is marked by the kick, sub and hook arriving, not by a big jump in level.
- The music of a chain is quieter than the planning before it (-21.6 against -17.9 LUFS): on purpose (the effects are the star, and the bus ducks it further), so the music's own build is mostly felt in the gaps.
- Room under every effect hit: 10.4 dB or more at rounds 1, 5 and 9, ducked. Un-ducked the first hits are up to 2.4 dB under the music.
- The drop was placed on the lift by arithmetic (2.92 s from the deck's start); the gap in milliseconds was not measured in the mix.
- Whether the hook can be hummed, whether the supersaw reads as a club lead or as a toy, whether the drop lands: unheard.

### 0.5 Choosing and switching soundtracks

- `AA.music.track(id)` as before; it now changes **at once**: the new track's first bar starts 10 ms after the call, the old one fades under it in about 0.3 s, both on smooth ramps, and a track with a different hall gets a new room while the old one rings out. Measured (funk to EDM to gothic to funk in planning, to EDM in the shop): no step from one sample to the next larger than the music's own (0.4 to 0.6 times the largest elsewhere), the new track at level within half a second except funk coming in 5 dB over gothic (the tracks' own levels differ).
- **New:** `AA.music.defaultTrack(id)` sets which soundtrack a player hears who has never picked one (saved; `?maintrack=id` also works). It is `'funk'` until the owner says otherwise. `AA.music.track(id)` is the player's own pick and wins; `AA.music.unpick()` forgets it. The default track always counts as found.
- Nothing was removed: funk, gothic, EDM, metal, surf and baroque are all still there.

### 0.6 Calls the page must make (new or changed)

```
AA.sfx.arrow(n, ms, { last, of, gap })   // as section 3; build c is now on by default
AA.music.step(n, of)                     // of: how many steps this chain has. Without it EDM cannot time its build or stop on the last hit
AA.music.defaultTrack('edm')             // when the owner chooses the main soundtrack
```

`AA.sfx.windup(n, ms, last)` still works as an arrow but passes neither `of` nor `gap`: the build then assumes 12 steps and a 1.5 s gap.

### 0.7 Not done, and what failed

- Nobody has listened to any of it.
- No game page was checked for calling `AA.sfx.arrow` with `of`, or `AA.music.step` with `of`. Without them short chains never reach the top of either build.
- The effect's heartbeat and snare roll run on their own clock, not the soundtrack's beat. Over EDM the two builds (the effect's and the music's) are not locked; the music's is ducked 10 to 18 dB under the effect's, so it should mostly hide, but what shows may flam.
- The held silence opens at the time the arrow said the hit would come. A hit that comes late opens the bus early.
- The first hits are dark (1% over 2 kHz, 9 dB lost on a phone). Made so that brightness can climb; maybe too dull.
- The climbing tone starts again on every arrow (70 ms attack, then a slide up from the last note): one tone by pitch, not one unbroken sound. Past step 13 it stops climbing.
- The pay-out is still glass and coins, the part most at risk of the "child game" sound; only the cascade after the lift was added.
- At the lift the effect's boom (37 Hz), the music's impact (38 Hz), kick (55 Hz) and sub land together through one limiter.
- Tried and dropped: sending every hit past the limiter (the tails rang through the held silence); a louder lift past the limiter (it clipped: the two outputs add); a last hit 7 dB up (clipped by 1 to 4 samples in rounds 5 and 9 until its first 0.12 s and its tail were split).
- EDM was not checked against the tremble or the ambience. Metal, surf and baroque are untouched drafts. Build-ups a and b are as builder 5 left them (they share the arrow's new release, nothing else).

### 0.8 Clips (builder 6)

In `C:\Work\atlas-atoms\.claude\shots` (960-wide copies under `small\`, a two-line `.txt` beside each):

- `snd6-01-cinematic.mp4`: build-up c, a 9-step chain to OVERREACT, alone, then over EDM, then over funk.
- `snd6-02-cinematic-rounds.mp4`: the same at rounds 1, 5 and 9, alone.
- `snd6-03-edm.mp4`: EDM through a round: three turns of planning warming up (chains of 3, 5 and 9), the drop, round won, shop.
- `snd6-04-edm-rounds.mp4`: EDM at rounds 1, 5 and 9: hot planning, a chain of 9, the drop.

### 0.9 What the judge said

One fresh sub-agent, as a hard audio director, read the code and the tables (it could not listen). Fixed from its list: a wrong note (C7) in the top octave of the tone from step 9; the soundtrack left ducked if an arrow has no hit; a kettledrum doubled at the lift; the glass run at the resolve not lowered with the rest; the riser before the drop ending off key in later rounds; a snare roll in round 9 fast enough to buzz. Its other points are in 0.7 as they stand.

<!-- /builder6 -->

## 1. The build-up: three options

`AA.sfx.build('a' | 'b' | 'c')` chooses one. `AA.sfx.build('')` goes back to style 4's own chain. The default is now `'c'` and the choice is saved (section 0.1). `?build=a` in the address also works.

| | Name | The arrow (anticipation) | The hit (release) | Between hits |
|---|---|---|---|---|
| a | Timpani and toms | a kettledrum roll that swells under the arrow, a rising whoosh, from step 3 a run of toms climbing into the hit | toms, a kettledrum on the chain chord's root, then a bass drum, a cymbal and a gong join as the chain goes on: a bigger drum each hit | from step 5 the kettledrum roll never stops |
| b | War drums | horn and pad risers a fifth below sliding up into the note, stacked in one to four octaves, a whoosh, rim clicks closing up | every player together | a steady pattern: 2 strokes to the gap in steps 1 to 3, 4 in steps 4 to 6, 8 from step 7; a player joins each step (big drum, rim, second drum, snare, third drum, toms, bass drum, cymbals) |
| c | Cinematic | a heartbeat on a low kick, a snare roll from step 3, one tone (horn, pad, a low drone) that climbs D, E, G, A step by step and never starts again | a low boom with a crack of glass, a snare in a big room, then cymbal and gong | a cymbal played backwards from each hit, swelling to end on the next |

In all three: the arrow and the hit are different sounds; each step is meant to be bigger than the one before (the tables show where it is not); before the last hit everything stops dead for 0.32 s (the soundtrack too); the last hit is the biggest of the chain; the kind of each step still plays its own voice on top of the drums, climbing D, E, G, A; the soundtrack is pushed down under each arrow and further under each hit.

OVERREACT with a build chosen is style 4's reward (held breath, strike, fall, swell, resolve, pay-out, tail) with this added: a boom, bass drum, kettledrum and gong on the strike; through the swell a kettledrum roll on A, a snare roll, a cymbal backwards and horns opening on A sus; on the resolve the whole section lands on D with a run of glass up D, E, G, A; then the lift: a kettledrum on A with the horn up to D, then a kettledrum and bass drum on D with a high A and a fall of coins; then the pay-out counts up as before.

New instruments, all made by code in `sfx.js`: big barrel drums (`taiko`), their rim (`ka`), a field snare (`snr`), a low boom (`boom`), a cymbal played backwards (`rcym`). The kettledrums, bass drum, gong, cymbal, horn and toms were already in the file; a build plays them as themselves (the table that swaps the old orchestra voices for band voices is skipped for a build).

### Measured (the 9-step chain of the clips, round 1, volume default)

The chain: an arrow is drawn for 0.4 s, then the hit; steps start 1.5 s apart and close 9% a step; the last arrow lasts 0.9 s (0.58 s of sound, 0.32 s of nothing); OVERREACT 1.5 s after the last hit. Levels are RMS of the 300 ms after a hit (or of the arrow), in dB under full scale.

| Hit level, dB | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 (last) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| style 4 as it was | -26.5 | -25.9 | -25.9 | -24.3 | -22.5 | -20.4 | -22.5 | -21.1 | -20.1 |
| a timpani and toms | -25.4 | -23.1 | -18.4 | -17.7 | -16.8 | -16.1 | -12.7 | -13.4 | -10.8 |
| b war drums | -26.8 | -26.0 | -24.5 | -22.5 | -20.8 | -18.9 | -15.1 | -14.5 | -11.7 |
| c cinematic | -21.9 | -20.5 | -19.4 | -17.7 | -17.0 | -16.2 | -15.6 | -14.5 | -11.6 |

| Arrow level, dB | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 (last) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| a | -33.9 | -33.7 | -30.3 | -26.4 | -24.7 | -23.8 | -21.0 | -20.3 | -16.1 |
| b | -39.4 | -36.2 | -34.2 | -31.4 | -27.7 | -26.1 | -24.5 | -19.3 | -16.5 |
| c | -26.6 | -24.5 | -22.6 | -20.9 | -19.2 | -17.6 | -15.9 | -14.2 | -11.0 |

| Centre of the hit, Hz | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 (last) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| style 4 as it was | 227 | 493 | 203 | 281 | 605 | 1102 | 479 | 350 | 787 |
| a | 316 | 290 | 156 | 260 | 385 | 466 | 375 | 462 | 769 |
| b | 250 | 327 | 361 | 726 | 628 | 1116 | 530 | 1047 | 396 |
| c | 184 | 191 | 211 | 330 | 457 | 431 | 769 | 425 | 528 |

| Share of the hit over 2 kHz, % | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 (last) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| style 4 as it was | 0.7 | 7.3 | 0.9 | 2.2 | 8.8 | 9.7 | 4.9 | 4.6 | 7.9 |
| a | 1.5 | 2.7 | 0.9 | 2.3 | 4.0 | 6.9 | 4.9 | 6.0 | 10.5 |
| b | 2.0 | 4.6 | 3.8 | 11.5 | 8.0 | 24.3 | 7.4 | 16.6 | 4.2 |
| c | 1.4 | 2.0 | 1.5 | 5.3 | 5.1 | 5.5 | 13.2 | 6.0 | 5.4 |

|  | Rise, hit 1 to hit 8, dB | Steps quieter than the one before | Jump from arrow to hit, dB (mean) | Held breath, dB | Last hit, dB | OVERREACT strike, dB | The fall, dB | Resolve, dB | The lift, dB | Pay-out, dB | Chain, LUFS | OVERREACT, LUFS | Peak, dBFS | Clipped samples | Phone-speaker loss, chain, dB | Phone-speaker loss, strike, dB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| style 4 as it was | 5.4 | 1 | 38.5 | -21.2 | -20.1 | -5.5 | -17.6 | -9.8 | -15.8 | -15.1 | -23.3 | -11.5 | -0.4 | 0 | 3.9 | 6.0 |
| a | 12.0 | 1 | 7.9 | -59.4 | -10.8 | -5.9 | -14.2 | -9.9 | -10.6 | -11.5 | -16.0 | -9.8 | -0.23 | 0 | 9.0 | 6.1 |
| b | 12.3 | 0 | 11.4 | -62.0 | -11.7 | -5.7 | -14.2 | -9.5 | -10.6 | -11.2 | -17.8 | -9.7 | -0.22 | 0 | 6.9 | 6.6 |
| c | 7.4 | 0 | 9.1 | -55.0 | -11.6 | -5.8 | -15.1 | -9.7 | -11.1 | -11.6 | -16.5 | -9.7 | -0.2 | 0 | 9.4 | 6.4 |

| Over the funk soundtrack | Room under each hit, steps 1 to 9, dB | Least | Middle | Peak of both, dBFS | Clipped |
| --- | --- | --- | --- | --- | --- |
| a | 0.8 2.5 9.8 8.4 5.5 7.4 11.4 11.0 14.2 | 0.8 | 8.4 | -0.2 | 0 |
| b | -1.4 -2.4 -0.3 3.2 6.4 7.0 12.4 10.3 15.1 | -2.4 | 6.4 | -0.21 | 0 |
| c | 4.1 5.8 8.8 8.3 5.3 6.5 8.2 9.8 13.8 | 4.1 | 8.2 | -0.21 | 0 |

"Room" is the level of the mix in the 300 ms after a hit over the level of the soundtrack alone around that hit, before the bus pushes the soundtrack down (so the true room is larger). **The 6 dB rule is not met on the first hits.**

What the numbers say, and do not say:

- Style 4 as it was rose 5.4 dB over the same eight hits and one step was quieter than the one before: "a bit flat" is visible. The options rise 12.0 (a), 12.3 (b) and 7.4 (c) dB.
- In a and b the arrow sits well under its hit, so anticipation and release are two events. In c the arrow is only a few dB under its hit and the last arrow is as loud as the last hit.
- The held breath is near silence in all three.
- OVERREACT's strike is the loudest moment. The last hit is the loudest of the chain, by 2 to 3 dB.
- Brightness does not climb evenly. The centre of the hit goes up and down from step to step in all three (a chord change puts a lower drum in; in b the cymbal and snare players join on some steps). b ends brightest in its late steps, c is the darkest.
- A lot of the weight is low: through a phone speaker the chain loses 9.0 dB (a), 6.9 dB (b), 9.4 dB (c); style 4 lost 3.9 dB. On small speakers a and c will be thinner than they measure here.
- Whether any of it is "majestic" or "a dopamine hit" cannot be measured.

## 2. The soundtracks: six

`AA.music.track(id)` chooses one (saved; `?track=id` also works). `AA.music.tracks()` lists them. Every track: key centre D, chain chords with roots D, G, C, A (three steps each), so the effects (the kettledrums follow the roots; everything else is D, E, G, A) fit every track. Every track runs on the same engine: planning starts sparse and warms turn by turn (`AA.music.intensity`, `AA.music.turn`), a chain is a surge of the same music (`AA.music.step`), OVERREACT is the peak.

| | id | Name | What it is | Where it came from |
|---|---|---|---|---|
| 1 | `funk` | Mad science funk | clavinet, synth bass, a tight kit, lab glass as percussion, brass stabs for the blow-up | the main soundtrack; unchanged by builder 5 |
| 2 | `gothic` | Gothic hybrid | a clock, strings that wait, a cello tune; then kettledrums, low brass, organ and choir with a restrained modern bass and drums | the hybrid the owner liked, tweaked a little by builder 5 (below) |
| 3 | `edm` | Chain Reactor | supersaw pads and plucks over four-on-the-floor; planning is the breakdown, the chain is the build, OVERREACT is the drop | an earlier builder's draft, found uncommitted and brought in; bass turned down a quarter by builder 5 |
| 4 | `metal` | Chain Lightning | drop-D guitars by string model through an amp and cabinet, twin leads, double kick | an earlier builder's draft, brought in as found |
| 5 | `surf` | Monster-movie lab | twangy guitar through a spring tank, combo organ, picked bass, a surf beat | an earlier builder's draft, brought in as found |
| 6 | `baroque` | Harpsichord unhinged | harpsichord, cello, organ, violins and oboe in counterpoint that runs off the rails; trumpets and drums for the blow-up | an earlier builder's draft, brought in as found |

The gothic tweak, in full: it now runs on the grooves' engine (so it has the long build and never stops for a chain); D dorian in place of D minor (G major and C where G minor, B flat and a diminished chord were; the tune's B flats raised to B); the wood-of-the-bow strokes only on the three accents (they were on scattered sixteenths, the cartoon tiptoe); the bass bowed, plucked only on the accents; strings opened up; a harp answer and a celesta now and then; the choir waits until it is warm; endings land on D major. Same tune, same instruments, same tempo.

### Measured (one 57 s walk each: calm planning, warmer planning, a 9-step chain with a build-up, OVERREACT, round won)

| Music alone, LUFS | planning, calm | planning, warmer | a chain building | OVERREACT | round won | Calm planning to OVERREACT, dB |
| --- | --- | --- | --- | --- | --- | --- |
| funk | -26.7 | -15.9 | -22.4 | -13.3 | -18.3 | 13.4 |
| gothic | -26.4 | -19.6 | -25.5 | -13.5 | -21.4 | 12.9 |
| edm | -24.2 | -18.0 | -22.6 | -13.5 | -19.8 | 10.7 |
| metal | -23.8 | -18.2 | -23.1 | -13.8 | -18.7 | 10.0 |
| surf | -24.4 | -17.4 | -23.5 | -13.0 | -20.4 | 11.4 |
| baroque | -24.8 | -18.2 | -29.0 | -13.9 | -20.0 | 10.9 |

|  | Centre, Hz (warm planning / OVERREACT) | Over 4 kHz, % (warm / OVERREACT) | Under 120 Hz, % (warm / OVERREACT) | Side under middle, dB | Phone-speaker loss, dB (warm / OVERREACT) | Peak music, dBFS | Peak with effects, dBFS | Clipped |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| funk | 668 / 1021 | 1.3 / 3.7 | 12.6 / 11.5 | -9.9 | 1.6 / 1.6 | -2.14 | -0.25 | 0 |
| gothic | 643 / 647 | 1.8 / 1.0 | 8.9 / 9.2 | -7.5 | 1.7 / 1.8 | -3.26 | -0.26 | 0 |
| edm | 401 / 629 | 0.8 / 1.9 | 42.1 / 39.0 | -10.8 | 4.8 / 3.6 | -2.79 | -0.23 | 0 |
| metal | 763 / 971 | 1.8 / 3.1 | 19.1 / 27.7 | -9.6 | 3.8 / 2.9 | -2.39 | -0.23 | 0 |
| surf | 664 / 979 | 3.1 / 4.4 | 22.5 / 15.0 | -10.6 | 3.7 / 2.1 | -2.1 | -0.25 | 0 |
| baroque | 955 / 1065 | 3.3 / 3.5 | 13.2 / 12.3 | -11.3 | 1.8 / 1.7 | -3.51 | -0.24 | 0 |

|  | Build-up used | Room under each hit, steps 1 to 9, dB | Least | Middle | Hits under 6 dB |
| --- | --- | --- | --- | --- | --- |
| funk | a | 1.1 4.4 8.6 7.7 8.9 10.1 12.5 13.2 13.6 | 1.1 | 8.9 | 2 |
| gothic | c | 4.7 7.7 9.8 10.7 11.9 12.3 13.4 15.0 17.5 | 4.7 | 11.9 | 1 |
| edm | b | -1.2 0.6 2.0 2.3 4.6 6.0 10.0 10.6 13.5 | -1.2 | 4.6 | 5 |
| metal | a | 0.2 4.5 9.5 9.2 10.0 10.4 12.8 12.4 17.5 | 0.2 | 10.0 | 2 |
| surf | c | 3.4 7.3 7.9 9.8 10.2 12.0 11.5 11.3 14.2 | 3.4 | 10.2 | 1 |
| baroque | b | -0.2 6.4 8.7 10.4 11.7 13.3 18.1 19.0 20.8 | -0.2 | 11.7 | 1 |

What the numbers say, and do not say:

- Every track gets louder from calm planning to OVERREACT and none clips.
- EDM measures dark and bass-heavy (under 2% of its energy over 4 kHz, about 40% under 120 Hz) and leaves the effects the least room. Gothic is the dullest on top after EDM. Baroque falls furthest back in a chain (-29 LUFS).
- Whether the metal sounds like guitars, the EDM like a club, the surf like a spring tank, the baroque like a harpsichord: not judged by builder 5 at all. The earlier builders' own genre measurements were not found with the drafts. These four are first drafts for the owner to hear, not finished tracks.
- The full checks the earlier music builder ran on each groove (all eleven states held, the same eight bars at rounds 1, 5, 9, repeats over twelve minutes, cost) were **not** rerun on any of the six by builder 5.

## 3. The calls the page must make

Effects (new):

```
AA.sfx.build('a' | 'b' | 'c' | '')     // which build-up; '' is style 4's own chain
AA.sfx.arrow(n, ms, o)                 // when the arrow for step n STARTS being drawn; its hit comes ms later.
                                       //   o.last: true for the last step (the sound stops 320 ms before the hit: make this arrow about 900 ms)
                                       //   o.of:   how many steps this chain has, if known (the build is spread over them; 12 is assumed if not)
                                       //   o.gap:  ms from this arrow to the next arrow, if known (otherwise 1500, then 9% shorter than the last gap)
AA.sfx.reflex(kind, n, { last })       // the hit, as before
AA.sfx.flag(4, { count })              // OVERREACT, as before
```

With a build chosen, `AA.sfx.windup(n, ms, last)` is the same as `arrow`. With no build chosen, `arrow` does nothing except on the last step, where it is style 4's wind-up. The cymbal backwards (c) and the war-drum pattern (b) are written at a hit to end at the next one, so they need the next hit's time: pass `o.gap` if the page's timing is not the 9% rule.

Soundtrack (unchanged calls, more ids): `AA.music.track('funk' | 'gothic' | 'edm' | 'metal' | 'surf' | 'baroque')`, `AA.music.tracks()`, `AA.music.unlocked(list)`, `AA.music.shuffle(bool)`; per round `round(n)`, `state('plan')`; `state('chain')` when the line fires; `step(n)` at each hit; `turn(result)` then `state('plan')` after a chain; `state('overreact')` with the effect; `state('won' | 'lost' | 'runwon' | 'runlost')`. See `docs/MUSIC.md`.

## 4. Not done

- Nobody but the owner has listened. The owner chose c; see section 0.
- No game page calls `AA.sfx.arrow` or `AA.sfx.build` yet.
- The first hits of a chain have less than 6 dB of room over the soundtrack.
- In a build the kind of a step is only a quiet voice on top of the drums; the thirteen kinds are harder to tell apart than in style 4.
- A build with rounds 2 to 9 (the "more unhinged" rule) was not rendered: the drums are played straight; only the kind voice and OVERREACT's old layers get wilder.
- The tremble and the ambience were not checked against the builds.
- EDM, metal, surf, baroque: drafts by earlier builders, brought in and rendered, not reviewed, not tuned (except the EDM bass).
- Gothic: its tune notes that begin before a chord move inside a chain are dropped until the next bar (an engine rule; the held parts were fixed for this track only).
- `docs/MUSIC.md` still describes three grooves; this page is the newer one for tracks.
- Live CPU load in the game not measured; only offline renders.

## 5. Clips

In `C:\Work\atlas-atoms\.claude\shots` (a 960-wide copy of each under `small\`, a two-line `.txt` beside each):

- `snd5-01-buildup-a.mp4`, `-b`, `-c`: the same 9-step chain, alone and then over the funk soundtrack.
- `snd5-02-buildup-compare.mp4`: a, b, c back to back, numbered.
- `snd5-11-track-funk.mp4`, `snd5-12-track-gothic.mp4`, `snd5-13-track-edm.mp4`, `snd5-14-track-metal.mp4`, `snd5-15-track-surf.mp4`, `snd5-16-track-baroque.mp4`: 57 s each.
- `snd5-20-tracks-compare.mp4`: 20 s of each, numbered.

The clips rotate the build-up (a, c, b, a, c, b across the six tracks) and the kinds of the steps, so no two show the same run.

## 6. How it was rendered and measured

Offline renders in headless Edge through the real `sfx.js` and `music.js` (`AA.music._renderWithSfx`, `AA.sfx._renderTimeline` with `opts.build`). Tools in `.claude/snd5/` (not in git): `mk_build.py`, `mk_tracks.py` (timelines), `an_build.py`, `an_track.py` (measures), `mk_bclips.py`, `mk_tclips.py` (clips), `mkdoc.py` (this page's tables). Loudness is K-weighted and gated like LUFS by our own script (`man.py`, from the earlier music builder). Phone-speaker loss is the level lost through a 300 Hz high-pass.

## 7. What the judge said

One fresh sub-agent, as a hard audio director, read the build-up code and the measurements (it could not listen). It would put **a** forward first (the largest rise, the cleanest split between arrow and hit, and it is plainly drums), with c's climbing tone grafted on. It marked b down for a timbre that lurches rather than grows and an arrow that the pattern plays through, and c for being the darkest ("the owner already said a little dark") with an arrow almost as loud as its hit. Of OVERREACT it said the weight and sparkle are there but the lift measures under the resolve.

Done from its list: the last hit raised and the last arrow lowered; resolve and lift horns raised and the extra boom on the resolve removed; a's roll starts louder and brighter and has a horn sliding up a fifth under it (the pitched riser); a's snare and cymbal come in sooner; b no longer props up its first steps and has a drum under every arrow; c's boom no longer drops in pitch, its heartbeat is brighter, its tone quieter.

Still true after those fixes, by measurement: in a, step 8 measures 0.7 dB under step 7 (the late hits press on the limiter); in c the last arrow is as loud as the last hit; the lift after the resolve still measures about 1 dB under the resolve; b's first hits are under the funk soundtrack. The judge has not seen the version in the clips.

