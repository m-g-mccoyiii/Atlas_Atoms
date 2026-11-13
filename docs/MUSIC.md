# Overreact music

One file: `apps/steam/js/music.js`, exposed as `AA.music`. Web Audio only. No audio files, no samples downloaded, no libraries: every sound is made by our own code, so the music is ours to sell.

**Where it stands (12 November).** The owner heard the made-orchestra Fuse and chose its hybrid shape but said "the tone is still a bit too toony and now it's a little dark ... the building up needs to be way longer". So there are now three **grooves** for the owner to choose between, on a different set of instruments, in brighter modes, with a build that runs across the whole round. **No human has listened to the grooves.** They were built and judged from the written notes, measurements and spectrogram pictures only.

Still in the file, shelved: themes 1 Burner and 2 Athanor (raw oscillators) and theme 3 Fuse (made orchestra, three arrangements, `AA.music.arrange('a'|'b'|'c')`).

<!-- builder6 -->
## The six soundtracks, and EDM finished (builder 6, 12 November, late)

This section is newer than the rest of this page, which still describes the three grooves. Full tables: `docs/SOUND5.md`, section 0.

- Six tracks on one engine: `funk` (the default), `gothic`, `edm`, `metal`, `surf`, `baroque`. `AA.music.tracks()` lists them. The owner ticked EDM to keep and finish; nothing was removed.
- `AA.music.track(id)` now changes at once and without a click (the old track fades under the new one's first bar; a new hall rings in while the old rings out).
- `AA.music.defaultTrack(id)`: the soundtrack for a player who has never picked one (saved; `?maintrack=id`). `'funk'` until the owner says otherwise. `AA.music.unpick()` forgets the player's own pick.
- `AA.music.step(n, of)`: `of` (optional) is the number of steps in this chain. EDM uses it to time its build and to stop on the last hit.
- A track may give its own tone curve (`tone: I => Hz` in its `TRACK` table): EDM runs its deck filter from 10 to 20 kHz.
- EDM by state: planning is the breakdown; each turn opens the filter and adds layers; a chain is the build (snare roll doubling, risers, kick and bass gone for the last quarter); OVERREACT is the drop, landing on the lift of the effect 2.95 s after the call; round won is the release. Rounds 1 to 9: 124 to 134 beats a minute and wilder modulation by chance (stutters, half-time bars, filter sweeps, wrong notes, a fake drop, wobble bass).
- Measured (round 1): cool planning -25.3 LUFS, hot planning -17.9, a chain of 9 -21.6, the drop -13.6, round won -20.1, shop -20.6; over 4 kHz 0.4% (cool) to 4.0% (drop); under 120 Hz 6% (cool) to 27% (drop); no clipping in any of the eleven states; no four or eight bars the same inside 12 minutes; 0.054 s of render per second.
- Nobody has listened to it.

<!-- /builder6 -->

## The three grooves

`AA.music.groove(1 | 2 | 3)` (saved; `?groove=1..3` in the address also works). The default is 1 until the owner picks.

| | Name | In one line | Mode on D | Beat |
|---|---|---|---|---|
| 1 | Lab lounge | Electric piano, vibraphone, upright bass and brushes with a sly swung tune; heats to sticks, a full kit and a tonewheel organ. | dorian | swung, 104 a minute in round 1 to 122 in round 9 |
| 2 | Hypnotic | Two short figures of five and six notes drifting against each other on electric piano and marimba, warm pads, a slow tune, tape wobble; grows by layers. | mixolydian, a lydian touch in the second half | straight, 98 to 110 |
| 3 | Mad science funk | Clavinet, synth bass, a tight kit and lab glass as percussion; a gliding lead and synth brass stabs when hot. | mixolydian with blue notes | funk sixteenths, 100 to 116 |

No orchestra, no choir, no pizzicato, no minor-key brass. Instruments a computer plays honestly because they are electric or simple: an FM electric piano (soft and hard), vibraphone, marimba, upright and electric bass (a string model started as a finger starts it), a synth bass, clavinet, tonewheel organ through a turning speaker, an analog-style pad, a gliding lead, a kit (kick, snare, brushes, hats, ride, crash, toms, rim), shaker, conga, tambourine, clap, beakers, a glass break. Each is worked out by code the first time it is needed and kept (the `INST` table); a note is a little early or late and a little louder or softer; the whole groove goes through a made "tape": a slow wobble of pitch, a flutter, a soft squash.

Each groove has two written 8-bar tunes (`TH[4]`, `TH[5]`, `TH[6]`). The tune comes back as written about one section in four; otherwise single bars are turned, delayed, thinned or left open.

### The long build

The build is no longer inside one chain. It has two parts.

- **The slow value.** `AA.music.intensity(0..1)` is the heat of the round. Things join as it rises (per groove, in `playGroove`): for the lounge, brushes and two-to-the-bar bass first, then the tune, walking bass, ride and sticks, congas, organ, the full kit. The page raises it turn by turn and never resets it between turns. `AA.music.turn(result)` does that for you: `result` is 0 (nothing happened) to 1 (a great turn); the value goes up by 0.15 to 0.28, more for a better turn; a turn under 0.25 lets it sag by 0.05. `AA.music.round(n)` starts a new round cooler than the last one ended but warmer than round 1 did.
- **The surge.** A chain no longer stops the music. `AA.music.state('chain')` keeps the same groove playing; `AA.music.step(n)` at each hit pushes the heat up on top of the slow value (a 4-step chain a little, a 12-step chain most of the way, still growing to 16 steps), moves the harmony to the chain chord, and rings one climbing note. While a chain runs the music gets denser and brighter but steps back in level so the effects stay on top. When the chain ends (`state('plan')` again) the surge drains away over a few bars and the slow value stays.
- **OVERREACT** cuts in at once: kick on every beat, crashes, the tune an octave up, the organ fast (lounge) or brass stabs (funk).

Measured on the clip timeline (three turns; chains of 4, 7 and 12 steps whose gaps tighten from 1.5 s to 0.5 s; the last chain lasts 10.5 s): from the first sound of the round to the loudest point is **66 s (lounge), 57 s (hypnotic), 58 s (funk)**. In Fuse the whole build was one chain, about 9 s.

### The chain chords, for the effects builder

The effects are in D minor today (Dm, Bb, Gm, A). The grooves are not. A chain moves through four chords, three steps each, roots **D, G, C, A**:

| Steps | 1 Lab lounge | 2 Hypnotic | 3 Mad science funk |
|---|---|---|---|
| 1 to 3 | Dm7 | Dadd9 | D7 |
| 4 to 6 | G7 | G | G7 |
| 7 to 9 | Cmaj7 | Cadd9 | C7 |
| 10 to 12 | A7sus4 | Asus4 | A7 |

`AA.music.chainChords()` returns the current groove's four (name, root, notes). Notes safe in all three grooves on every chord: **D, E, G, A**. Safest: open fifths (D+A, G+D, C+G, A+E) or unpitched sounds. Avoid F, F sharp, B flat and C sharp. Until the effects change, their B flat and G minor rub against the grooves in steps 4 to 9. The music changes chord at its own bar line, so it can trail a step by up to about 2 s.

### Rounds: cool to unhinged (HARNESS line AM)

Wilder, looser and funnier, not sadder: nothing is flattened or darkened. By round 9 a groove is 14 to 18 percent faster and the tempo runs away through each 8 bars then snaps back; the tape wobbles more; everything but the drums plays looser; notes are slid into from a semitone under; the fourth bar of a phrase jumps up an octave like someone butting in; fills come every four bars; more ghost notes on the snare; the organ smears up into a bar; a glass breaks on a downbeat now and then when it is hot; everything is driven harder. Loudness is held within 1.3 dB of round 1.

### The endings

Won: G, A7sus4, D with a sixth and ninth (bright). Lost: a short falling shrug over G7, F, E minor, not a dirge. Run won: a rise to the same bright D. Run lost: the tune slow and low on the electric piano.

## The states

`AA.music.state(name)`: `title`, `bench`, `shop`, `pick`, `plan`, `chain`, `overreact`, `won`, `lost`, `runwon`, `runlost`. A new state starts on the next bar line (at most one bar, about 2.4 s, plus 0.35 s) with a soft shaker roll into it. `overreact` and the four endings cut in at once. In a groove `plan` and `chain` are the same music (see above), so going between them changes nothing but the surge.

## The API

```
AA.music.groove(1|2|3)      // which groove; saved
AA.music.state(name)
AA.music.intensity(0..1)    // the slow value: the heat of the round
AA.music.turn(result)       // a turn ended, 0..1 how it went: raises (or lets sag) the slow value
AA.music.step(n)            // a chain step, 1 and up, at the hit: the surge
AA.music.round(1..9)
AA.music.chainChords()      // the four chain chords of the current groove
AA.music.volume(0..1)       // music only; saved
AA.music.seed(n)            // the run's seed: same seed, same choices
AA.music.duck(depth, ms)    // only needed without the shared bus
AA.music.stop()
AA.music.info()
AA.music.theme(1..6)        // 4, 5, 6 are the grooves; 1 to 3 the shelved themes
AA.music.arrange('a'|'b'|'c')   // Fuse only
AA.music._renderTimeline(events, secs, opts)   // offline; events may also be 'turn'; opts: theme, arr, seed, round, volume, solo
AA.music._renderWithSfx(events, sfxEvents, secs, opts, sfxOpts)
AA.music._score(events, secs, opts)
```

## What the page builder must call, and where

1. Load `js/music.js` right after `js/sfx.js`, before the first sound.
2. Title screen: `AA.music.state('title')`. Sound starts on the first click or key.
3. Bench: `state('bench')`. Shop: `state('shop')`. Choosing a molecule: `state('pick')`.
4. Run starts: `AA.music.seed(runSeed)`. Round n begins: `AA.music.round(n)` then `state('plan')`.
5. The line fires: `state('chain')`.
6. Each reflex hit, where `AA.sfx.reflex(kind, n, ...)` is called: `AA.music.step(n)`.
7. The chain ends and the round goes on: `AA.music.turn(result)` then `state('plan')`. For `result` use how the turn did against what was needed, 0 to 1 (for example the page's yield divided by a third of the spec, capped at 1). Or set `AA.music.intensity(v)` yourself.
8. OVERREACT pops: `state('overreact')`, at the same moment as the effect.
9. Round ends: `state('won')` or `state('lost')`. Run ends: `state('runwon')` or `state('runlost')`.
10. Stop calling the old `AA.sfx.startMusic()` / `setMusic` / `setIntensity`.
11. Settings: a music slider calls `AA.music.volume(v)`. On the shared bus the effects' volume and mute also act on the music.

## The bus

`sfx.js` keeps its audio context private, so `music.js` catches it by wrapping `AudioContext` when it loads, and plugs into the effects' ducked bed as soon as that exists. Then every effect hit pushes the music down and both share one limiter. With no effects bus the music uses its own limiter. A one-line getter in `sfx.js` would replace the catch; that file belongs to the sound builder.

## Measurements (the grooves, after both directors' fixes)

Offline renders in headless Edge through the real code (`.claude/music/`, not in git: `gtl.py`, `gan.py`, `mkgroove.py`). Loudness is K-weighted and gated like LUFS, by our own script. Volume 0.7, round 1.

The round on the clip timeline (LUFS):

| | 1 Lab lounge | 2 Hypnotic | 3 Mad science funk |
|---|---|---|---|
| title | -17.3 | -21.3 | -16.6 |
| turn 1 planning | -23.7 | -23.7 | -25.6 |
| turn 1 chain of 4 | -30.6 | -26.6 | -26.9 |
| turn 2 planning | -19.4 | -21.2 | -19.9 |
| turn 2 chain of 7 | -28.4 | -25.2 | -21.2 |
| turn 3 planning | -15.2 | -20.7 | -17.0 |
| turn 3 chain of 12 | -26.2 | -22.2 | -20.6 |
| OVERREACT | -12.3 | -13.2 | -13.2 |
| round won | -19.7 | -22.2 | -19.2 |
| shop | -21.3 | -24.2 | -19.8 |
| Seconds from the first sound of the round to the loudest point | 66 | 57 | 58 |

Other states held 16 s (LUFS): bench -22.1 / -27.5 / -22.7; pick -25.0 / -27.6 / -25.4; lost -27.5 / -28.1 / -25.6; run won -13.3 / -14.0 / -14.4; run lost -25.1 / -27.8 / -22.8. Share of energy under 120 Hz in the title: 28% / 14% / 15%. Level lost through a phone speaker (300 Hz high-pass), title: 2.7 / 2.0 / 1.9 dB. No sample at full scale in any take; highest peak, music alone, -1.7 dBFS.

With the effects (arcade a, chant layer on, the logged 12-step chain, slow value 0.45, both through the effects' bus). The music level here is the music alone, before the bus pushes it down under each hit:

| | 1 | 2 | 3 |
|---|---|---|---|
| Room under an effect hit, middle of the 12 hits | 10.7 dB | 7.4 dB | 7.2 dB |
| Hits with at least 8 dB of room | 10 of 12 | 5 of 12 | 6 of 12 |
| Least room (a weak early hit) | 4.4 dB | 2.3 dB | -0.1 dB |
| Room at the last hit | 17.0 dB | 16.9 dB | 14.7 dB |
| Peak of the two together, clipped samples | -0.8 dBFS, 0 | -0.8, 0 | -0.8, 0 |

**The 8 dB rule is not met at every hit.** In Fuse the music fell near silence when a chain began; a groove keeps playing, so the early, quieter hits have less room. Stepping the music back further costs the feel of a surge. This is a choice for the owner to hear.

Brightness against the hybrid Fuse (all eleven states):

| | hybrid Fuse | 1 | 2 | 3 |
|---|---|---|---|---|
| Share of energy over 4 kHz | 1.3% | 4.6% | 5.1% | 2.5% |
| Share in 1 to 4 kHz | 11.6% | 11.8% | 15.9% | 18.7% |
| Centre of the spectrum | 602 Hz | 808 Hz | 970 Hz | 796 Hz |
| Stereo side level under the middle | -9.4 dB | -14.2 | -13.3 | -11.2 |

The grooves are narrower in stereo than Fuse.

The same eight bars at round 1, 5, 9: length 18.5 / 16.6 / 15.2 s (lounge), 19.6 / 18.1 / 16.8 (hypnotic), 19.2 / 17.4 / 16.0 (funk); loudness -17.0 / -16.8 / -16.8, -20.8 / -19.5 / -19.9, -16.0 / -15.6 / -16.2 LUFS.

Repeats, twelve minutes held in one state (title, planning, shop), counted on the notes written, before the last small fixes: no 4 bars and no 8 bars come back note for note in any groove; the tune alone first comes back as written after 39 to 442 s (meant to); 0 to 1.7% of bars equal another seed's bar at the same place.

Cost (30 s takes, best of three, before the last fixes): render time per second of sound 0.043 to 0.049 s in the title and 0.071 to 0.078 s in OVERREACT; at most 186 nodes alive at once. Making the instruments: about 0.5 s of work and 36 MB of memory for all three grooves in one session. The live player was run in headless Edge in all three grooves in title, overreact and chain: it starts, plays and switches. Live load in the game was not measured.

## What the two directors said

Two fresh sub-agents, one after the other, each asked above all "is it toony, is it gloomy", then "is it tiresome, does it fit a lab going wrong". Neither could hear.

First director (first build): groove 3 passed all four; groove 1 borderline (still a minor mode, dull, brushes too loud, bass an octave too high); groove 2 failed (the figures read as a ringtone, the tune opened 3-2-1 like a nursery tune, a bug made every hot note swoop an octave). All its fixes were made except the one in `sfx.js`.

Second director (after those fixes):

| | 1 Lab lounge | 2 Hypnotic | 3 Mad science funk |
|---|---|---|---|
| Toony | at risk: swung vibes, brushes and walking bass is the "sneaky cartoon cat" idiom; the organ is a tremolo | pass | at risk: a gliding lead on every note, glass tings every bar |
| Gloomy | fail: D dorian is still a D minor home and it measured duller than the hybrid | pass by design, but a minor scale leaked into the tune's turns (a bug) | pass, the brightest |
| Tiresome | pass | fail: tune far over the figures, level swinging, turn 3 quieter than turn 2 | at risk: a lot of energy at 1 to 4 kHz |
| Fits a lab going wrong | part: cool and sly | weak: little mischief | pass, best |

It would put **groove 3** forward first, and hold groove 1 back until brightened.

Fixed after its report: the turn on a long note now takes its neighbour from the groove's own scale; groove 1 brightened (harder electric piano, brighter vibes and ride, kit up: its share over 4 kHz went from 2% to 4.6% and its centre from 565 to 808 Hz); groove 2 rebalanced (tune down, figures and bass up, turn 3 now above turn 2); the peak no longer doubles its kick, hats and crashes; the step back in a chain set per groove; the funk lead slides only between notes that touch and comes in only when hot (clavinet and electric piano carry the tune before that), fewer glass tings when cool; groove 2 no longer gets quieter by round; the middle rounds odder; early planning up; a chord kept under a loss in groove 3.

Not done from its list: a true rotary speaker (two rotors, pan and doppler) for the organ, still one tremolo for the deck; a brighter home chord in groove 1's second half (it is still dorian, a minor mode). **The version in the clips is after these fixes and has not been judged again.**

What only ears can settle: whether the lounge reads as cool or as cartoon sneaking; whether the FM electric piano reads as a Rhodes; whether the brush reads as a brush; whether the glide lead reads as funk or goofy; whether the round-9 tape wobble is funny or seasick.

## Not done

- Nobody has listened to the grooves.
- Not wired into any game page. No page calls `AA.music` yet.
- The effects are still in D minor and still arcade-toned; with a groove under them the harmony rubs in steps 4 to 9 until `sfx.js` follows the chain chords above.
- The 8 dB room under effect hits is met at 10, 5 and 6 of 12 hits, not all.
- Groove 1 is still a minor mode (dorian).
- The organ's speaker is a tremolo, not a true rotary.
- A state change that is not a cut waits for the bar line; a chain's chord follows a step by up to a bar.
- No separate music mute on the shared bus; no pause or window-blur handling.
- Live CPU load not measured; only offline render time.
- `AA.sfx.ambience` and the music together not checked.

## Clips

In `C:\Work\atlas-atoms\.claude\shots`:
- `groove-1.mp4`, `groove-2.mp4`, `groove-3.mp4` (about 2 min 40 s each): title, a whole round of three turns with the slow build and a chain in each, OVERREACT, round won, shop, then the same eight bars at round 1, 5 and 9.
- `groove-compare.mp4`: the hybrid Fuse first, then 40 s of each groove.
- Earlier: `fuse-a/b/c.mp4`, `fuse-compare.mp4`, `fuse-with-effects.mp4` (the made orchestra), `music-*.mp4` (the three oscillator themes).

## Fuse and the older themes

Fuse (theme 3) is a clock and wood on strings that wait, then timpani, low brass, choir and an anvil, in D minor, in three arrangements (a chamber, b gothic, c hybrid). Its instruments are made the same way as the grooves' (held tones by spectrum-to-loop synthesis, plucked strings by a string model, struck things by ringing modes). Its chain is a bed with no beat that follows the effects' chords Dm, Bb, Gm, A. A director judged it free of arcade and 8-bit sound but at about "a good 1990s sound module": struck and plucked things close, sections recognisable, solo bowed and blown lines synthetic. A licensed sample set would add real bow noise and legato, loudness layers, several takes per note, real choir vowels and a real room; the biggest gain would be the solo cello, horn and choir. The full Fuse measurements are in the git history of this file (commit 1e00edf).
