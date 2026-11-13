# Overreact sound, builder 5: build-up options and soundtrack options

Two files: `apps/steam/js/sfx.js` (effects, `AA.sfx`) and `apps/steam/js/music.js` (soundtrack, `AA.music`). Web Audio only. Nothing downloaded: every sound is made by our own code, so it is ours to sell.

**Nobody has listened to any of this.** It was built and judged from measurements of offline renders only. Read every number below as "it measures this way", not "it sounds good". The owner's ears decide.

What the owner asked for (12 November): the sounds "aren't exciting enough"; "the building up needs to be way longer"; "I need the sound to be more majestic with the buildup to reactions building. It's a bit flat. Needs to hit the dopamine", leaning on "Drums and a riser"; "several sound tracks", funk as the main one, "the gothic hybrid just tweak it a little", "an edm one, a metal one, etc."; "I said several sound options and never got them".

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

