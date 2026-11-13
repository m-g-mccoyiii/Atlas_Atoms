# Overreact sound, builder 5: build-up options and soundtrack options

Two files: `apps/steam/js/sfx.js` (effects, `AA.sfx`) and `apps/steam/js/music.js` (soundtrack, `AA.music`). Web Audio only. Nothing downloaded: every sound is made by our own code, so it is ours to sell.

**Nobody has listened to any of this.** It was built and judged from measurements of offline renders only. Read every number below as "it measures this way", not "it sounds good". The owner's ears decide.

What the owner asked for (12 November): the sounds "aren't exciting enough"; "the building up needs to be way longer"; "I need the sound to be more majestic with the buildup to reactions building. It's a bit flat. Needs to hit the dopamine", leaning on "Drums and a riser"; "several sound tracks", funk as the main one, "the gothic hybrid just tweak it a little", "an edm one, a metal one, etc."; "I said several sound options and never got them".

## 1. The build-up: three options

`AA.sfx.build('a' | 'b' | 'c')` chooses one. `AA.sfx.build('')` goes back to style 4's own chain (the default until the owner picks). `?build=a` in the address also works. The choice is not saved yet.

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

- Nobody has listened. No option has been chosen. `build` defaults to off.
- No game page calls `AA.sfx.arrow` or `AA.sfx.build` yet.
- The build choice is not saved between sessions.
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

