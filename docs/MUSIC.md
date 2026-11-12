# Overreact music

One file: `apps/steam/js/music.js`, exposed as `AA.music`. Web Audio only. No audio files, no samples, no libraries, nothing downloaded: every sound is made by our own code, so the music is ours to sell.

**No human has listened to any of this.** It was built and judged from the written notes, measurements and spectrogram pictures only. The owner's ears decide.

## The three themes

All three are in D minor, the key of the effects. `AA.music.theme(1 | 2 | 3)` picks one (saved; `?music=1..3` in the address also works).

| | Name | In one line | Beat |
|---|---|---|---|
| 1 | Burner | Driving dark synth: a pumping bass, a running arpeggio, a saw lead with a rising riff. | 4/4, 108 a minute in round 1 to 124 in round 9 |
| 2 | Athanor | Alchemical and strange: a slow swaying chant of low voices, with bells, a frame drum, an anvil and a drone. | 6/8, 58 to 68 |
| 3 | Fuse | Tense and bare: a ticking pulse and a short figure that waits, then brass and drums blow up. | 4/4, 92 to 108 |

Each theme has two written 8-bar tunes (A and B) and chords for them, in the `TH` table at the top of the file. The tune comes back as written about two sections in five; the rest of the time single bars are turned, delayed, thinned, left open or end on another note, and the instrument and octave change.

## The states

`AA.music.state(name)`. A new state starts on the next bar line (at most one bar, 2.1 to 2.6 s, plus 0.35 s), with a soft swell into it. The six marked "at once" cut in at the call.

| State | When | What plays |
|---|---|---|
| `title` | title screen | two bars of opening, then the full tune with everything |
| `bench` | between runs | pieces of the tune over a held bass note, light drums |
| `shop` | the shop | the B tune first, bass and arpeggio forward, light drums |
| `pick` | choosing a molecule | the tune bent onto hanging chords, a question with no answer, ticking |
| `plan` | a round in play, the player is choosing | calm: bass, pad, pieces of the tune; leaves room for the queue and fire sounds |
| `chain` | from fire, while the molecule reacts (at once) | no beat of its own: a held bed that grows with intensity (see below) |
| `overreact` | the OVERREACT moment (at once) | the tune in octaves with everything, fading in over about a second so the effect's own hit is heard first; after 8 bars it eases off |
| `won` | round won (at once) | a three-bar close (Gm, A, open D), then a lighter loop |
| `lost` | round lost (at once) | a falling phrase that does not resolve, then a drone |
| `runwon` | run won (at once) | a rising phrase to D major, then the tune at full strength; eases off after 12 bars |
| `runlost` | run lost (at once) | the tune slow, sung low, with a bell |

Each state starts at its own intensity. `AA.music.intensity(0..1)` moves it: layers (drums, arpeggio, low voices, bells or stabs) come in at set levels.

### The chain

The effects play each step on the game's own timing (the gaps shrink from 0.93 s to 0.57 s), so there is no fixed tempo to share. In a chain the music therefore drops its beat and holds a bed: fifths through a filter that opens, a pulse that speeds up, a choir that gains one voice at a time (seven by the end), shivering high strings, rising noise, and near the top a note a semitone off. `AA.music.step(n)` at each hit sets the intensity to n/12, moves the bed to the effects' chord (Dm, Bb, Gm, A, three steps each, read from `sfx.js`), and sings one note of the theme's tune low, bent to that chord. So every step lands in key.

### Rounds: sane to unhinged (HARNESS line AM)

`AA.music.round(1..9)`. Round 1 is in tune and in time. By round 9: 15 to 19 percent faster and the tempo runs away through each 8 bars then snaps back; voices detune (twice as wide, each note drifting up to 15 cents); notes slip late; from round 4 every E in the tune falls to E flat, from round 6 the short A's fall to A flat, from round 8 the last bar of a section is doubled a tritone up and the bass steps to the tritone; a few random wrong notes (6 in 100 short tune notes, 7 in 100 arpeggio notes at round 9); the low voices come in sooner and up to three more join, the last a semitone off; drums, bass, lead and voices are driven harder. Loudness is held level (within 0.5 dB of round 1) so the room for the effects does not shrink.

## The API

```
AA.music.state(name)        // see the table; no argument reads it
AA.music.intensity(0..1)    // how hard the current state plays
AA.music.step(n)            // a chain step, 1 and up, at the hit
AA.music.round(1..9)        // later rounds faster and more unhinged
AA.music.theme(1|2|3)       // saved in localStorage 'overreact.music'
AA.music.volume(0..1)       // music only; saved
AA.music.seed(n)            // the run's seed: same seed, same choices
AA.music.duck(depth, ms)    // push the music down for a moment (only needed without the shared bus)
AA.music.stop()
AA.music.info()             // theme, state, intensity, round, shared bus or not, nodes made
AA.music.THEMES, AA.music.STATES
AA.music._renderTimeline(events, secs, opts)             // offline: [{ t: ms, n: 'state'|'intensity'|'step'|'round'|'theme'|'volume'|'duck'|'stop', a: [...] }] -> { l, r, bars, nodes, peak, ms }
AA.music._renderWithSfx(events, sfxEvents, secs, opts, sfxOpts)   // music and effects through the effects' bus -> { l, r }
AA.music._score(events, secs, opts)                      // no sound: the bar log, for counting repeats
```

## What the page builder must call, and where

1. Load `js/music.js` right after `js/sfx.js` (it must load before the first sound, see "the bus").
2. Title screen shown: `AA.music.state('title')`. Sound starts on the first click or key, as the effects do.
3. Bench: `state('bench')`. Shop: `state('shop')`. Choosing between two molecules: `state('pick')`.
4. Run starts: `AA.music.seed(runSeed)`. Round n begins: `AA.music.round(n)` then `state('plan')`.
5. The line fires: `state('chain')`.
6. Each reflex hit, where `AA.sfx.reflex(kind, n, ...)` is called: `AA.music.step(n)`.
7. OVERREACT pops: `state('overreact')`, at the same moment as the effect.
8. Round ends: `state('won')` or `state('lost')`. Next page of the same round with no ending: `state('plan')`.
9. Run ends: `state('runwon')` or `state('runlost')`.
10. Stop calling the old `AA.sfx.startMusic()` / `setMusic` / `setIntensity`. If `AA.sfx.ambience(...)` is used on the same screen, the two beds play together; that mix has not been checked.
11. Settings: a music slider calls `AA.music.volume(v)`. On the shared bus the effects' volume and mute also act on the music (they are the master).

## The bus

`sfx.js` keeps its audio context private, so `music.js` catches it by wrapping `AudioContext` when it loads, and plugs into the effects' ducked bed (`ctx.__ovsb.bed`) as soon as that exists. Then every effect hit pushes the music down, the held breath before the last hit silences it too, and both go through one limiter. If there is no effects bus (style 0, or `sfx.js` absent) the music uses its own limiter. A one-line getter in `sfx.js` (for example `AA.sfx.bus()`) would replace the catch; that file belongs to the sound builder.

## Measurements

Offline renders in headless Edge through the real code (`.claude/music/`, not in git: `render.sh`, `man.py`, `segs.py`, `fxan.py`, `rounds.py`, `rep.py`, `mkclips.py`). Loudness is K-weighted and gated like LUFS, computed by our own script (not a certified meter). All at volume 0.7, round 1.

Loudness per state (LUFS), share of energy under 120 Hz, level lost through a phone speaker (300 Hz high-pass):

| State | 1 Burner | 2 Athanor | 3 Fuse |
|---|---|---|---|
| title | -19.1, 28%, 3.0 dB | -19.3, 29%, 4.6 dB | -21.2, 36%, 3.8 dB |
| bench | -24.2, 25%, 2.6 dB | -26.0, 34%, 5.0 dB | -24.0, 24%, 2.8 dB |
| pick | -25.8, 18%, 2.3 dB | -26.4, 22%, 3.8 dB | -25.6, 18%, 2.6 dB |
| plan | -25.9, 42%, 4.6 dB | -27.3, 53%, 6.5 dB | -25.6, 30%, 3.5 dB |
| chain (steps 1 to 12) | -24.0, 11%, 3.9 dB | -26.2, 13%, 2.8 dB | -27.7, 9%, 1.8 dB |
| overreact | -14.3, 26%, 2.4 dB | -14.7, 31%, 5.0 dB | -14.4, 37%, 3.7 dB |
| won | -20.5, 28%, 3.0 dB | -20.2, 33%, 4.4 dB | -21.7, 18%, 2.3 dB |
| shop | -22.5, 31%, 2.6 dB | -22.2, 36%, 4.8 dB | -21.8, 19%, 1.5 dB |
| lost | -25.3, 24%, 3.5 dB | -25.9, 31%, 4.1 dB | -24.8, 13%, 3.8 dB |
| runwon | -15.4, 27%, 2.7 dB | -15.4, 28%, 3.7 dB | -15.5, 37%, 3.6 dB |
| runlost | -22.9, 16%, 3.0 dB | -22.7, 22%, 4.2 dB | -21.1, 8%, 2.1 dB |

Clipping: no sample at full scale in any take. Highest peak, music alone: -1.5 dBFS (overreact).

With the effects (arcade a, chant layer on, the logged 12-step chain, both through the effects' bus):

| | 1 | 2 | 3 |
|---|---|---|---|
| Least room under an effect hit (hit level minus music level in the same 0.3 s) | 8.3 dB | 8.7 dB | 11.7 dB |
| Room at the last hit | 14.8 dB | 15.9 dB | 18.1 dB |
| Chain loudness: effects alone / music alone | -15.6 / -24.9 | -15.6 / -27.0 | -15.6 / -28.3 |
| First second of OVERREACT: effect / music | -10.6 / -19.1 dB | -10.6 / -20.2 | -10.6 / -21.4 |
| Peak of the two together, clipped samples | -0.8 dBFS, 0 | -0.8, 0 | -0.8, 0 |

The same eight bars at round 1, 5, 9: length 17.8 / 16.3 / 14.9 s (Burner), 16.6 / 15.0 / 13.6 (Athanor), 20.9 / 18.9 / 17.2 (Fuse); loudness -18.6 / -18.5 / -18.9, -19.0 / -18.6 / -19.0, -20.4 / -20.2 / -20.9 LUFS.

Repeats, twelve minutes held in one state (the hardest case), counted on the notes written, not on the sound:

| | 1 | 2 | 3 |
|---|---|---|---|
| First time any 8 bars come back note for note, all instruments (title) | never in 12 min | never | never |
| Worst state for that | never | bench, at 11 min | never |
| First time 8 bars of the tune alone come back (title); meant to, it is the tune | 93 s | 120 s | 89 s |
| Different 8-bar tune sections out of all played (title) | 35 of 40 | 42 of 43 | 34 of 34 |
| Bars equal to another seed's bar at the same place | 0 to 1.2% | 0 to 1.1% | 0% |

Cost (30 s takes, written a second ahead as the live clock does, best of three because the machine was shared):

| | 1 | 2 | 3 |
|---|---|---|---|
| Render time per second of sound, title / overreact | 0.070 / 0.080 s | 0.072 / 0.085 s | 0.049 / 0.077 s |
| Nodes made per second, title / overreact | 150 / 183 | 114 / 159 | 63 / 129 |
| Most nodes alive at once, title / overreact | 142 / 193 | 200 / 220 | 112 / 194 |

A voice that has ended is taken off the graph at once; before that fix the same takes cost four times as much. Live load in the game was not measured (the browser's load meter is not available in headless Edge). The live player was run in headless Edge for all three themes in title, overreact and chain: it starts, plays and switches.

## The music director's judgement

One fresh sub-agent read the harness, the code, the measurements and the pictures. It could not hear either. Before the fixes:

| | 1 Burner | 2 Athanor | 3 Fuse |
|---|---|---|---|
| Passes as a Steam soundtrack for adults | pass (a guess) | pass only if the chant reads as voices (a guess) | fail when calm, pass in OVERREACT |
| Fits a lab going wrong | half: a chase, not a notebook | pass, the most alchemical | pass: tick, wait, blow up |
| Childish | no | no; many high bells in OVERREACT could read as a music box | calm states: woodblock and high pings read as mobile-puzzle music |
| Tiresome | narrowly no; title and OVERREACT flat and busy | same register in every state | a held high string through six states |

Its pick: Athanor, if a human confirms the chant sounds like voices; otherwise Burner.

All twelve of its fixes were made: the pick state bends the tune onto its own chords; the unhinged curve bites from the middle rounds and uses set changes rather than mostly random errors; Fuse's held string only plays in the second half of a section or when loud and at half level, its pings are an octave lower and quieter, its calm states are 3 dB up with a low pad; one clashing bar each in Athanor, Burner and Fuse rewritten (Fuse no longer shares a bar with Burner); the chain's low note is an octave up and grows to step 12; the title opening is 2 bars, not 4; OVERREACT and run-won ease off after their first statement; Burner's OVERREACT has a brass lead the title lacks; Athanor's calm states are barer and its OVERREACT bells are three a bar an octave lower; the extra drive is oversampled.

The fixed version was measured again (the tables above) but was not sent back to the director.

## Not done

- Nobody has listened. Whether the chant sounds like voices or like a buzz, whether the tunes are good, whether round 9 sounds mad or broken: unknown.
- Not wired into any game page. No page calls `AA.music` yet.
- The three chain beds are the same build with a different mix per theme.
- The mid-chain bed has little energy between 60 and 120 Hz of its own; the deep sound in a chain is mostly the effects' chant layer.
- Almost nothing above 4 kHz; it may sound muffled.
- A state change that is not a cut waits for the bar line (up to about 3 s in Fuse).
- No separate mute for music on the shared bus; no fade on window blur; no pause when the game pauses.
- Live CPU load not measured; only offline render time.
- `AA.sfx.ambience` and the music together not checked.
- Catching the effects' audio context by wrapping `AudioContext` is a stopgap until `sfx.js` offers its bus.

## Clips

In `C:\Work\atlas-atoms\.claude\shots`: `music-theme-1.mp4`, `-2`, `-3` (title, planning, chain, OVERREACT, round won, shop, then the same eight bars at round 1, 5, 9), `music-compare.mp4` (30 s of each), `music-with-effects-1.mp4`, `-2`, `-3` (under the effects on the 12-step chain).
