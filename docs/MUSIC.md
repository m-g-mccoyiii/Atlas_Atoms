# Overreact music

One file: `apps/steam/js/music.js`, exposed as `AA.music`. Web Audio only. No audio files, no samples downloaded, no libraries: every sound is made by our own code, so the music is ours to sell.

The owner chose theme 3, **Fuse** (12 November: "I like 3 but it's too Arcade-y can we use more than just 8 bit noise"). Fuse was rebuilt on made instruments in three arrangements for the owner to choose between. Themes 1 (Burner) and 2 (Athanor) are still in the file, on raw oscillators, shelved.

**No human has listened to the rebuilt Fuse.** It was built and judged from the written notes, measurements and spectrogram pictures only.

## Fuse

A clock ticks and wood knocks on strings in threes and twos while a tune waits to start; then it blows up into timpani, low brass, choir and an anvil. D minor (the key of the effects), 4/4, 92 beats a minute in round 1 to 108 in round 9.

The tune is two written 8-bar halves (`TH[3]` at the top of the file). A: a three-note figure that starts off the beat (D F E, then D F C sharp), climbs to B flat, half-closes on A, is repeated a fourth up, and closes on D. B: a long singing line over B flat, C, D minor. The tune comes back as written about two sections in five; otherwise single bars are turned, delayed, thinned or left open.

### The three arrangements

`AA.music.arrange('a' | 'b' | 'c')` (saved; `?fuse=a..c` in the address also works). The default is c.

| | Name | Who plays |
|---|---|---|
| a | Chamber | a clock, col legno and pizzicato strings, piano, a solo cello on the tune, shivering strings, bass clarinet, timpani; the blow-up is strings, piano, prepared piano, timpani, bass drum |
| b | Gothic | a clock, organ pedal, a choir, harp, tubular bells, a horn and the choir on the tune; the blow-up is trombones and horns, choir, timpani, bass drum, anvil, tam-tam |
| c | Hybrid | a's clock, wood, pizzicato, piano and cello, with b's brass, choir and bells joining as it gets louder, plus a soft low sine and a restrained kick and field drum |

### How the instruments are made

Each instrument is a short recording worked out by code the first time it is needed, kept in memory, and played back like a sample (`INST` table, section "MADE INSTRUMENTS").

- Held tones (cello, string section, double basses, horn, trombones, choir "ah" and "oh", organ, bass clarinet): the instrument's spectrum (harmonics smeared as a group of players smears them, shaped by the body or the mouth, breath or bow noise underneath) is written into a frequency table and turned into a 1.5 s loop by one inverse FFT. Solo tones also get a steady line under each harmonic so a held note does not swell by itself. A cello note starts with a short bow-on-string noise; an organ note with a puff.
- Plucked (pizzicato, harp, col legno): a string model (noise going round a damped delay line) through a small body.
- Struck (piano, prepared piano, celesta, tubular bell, glass, timpani, bass drum, field drum, anvil, tam-tam, clock tick and tock): a sum of ringing modes at each instrument's real mode ratios, each with its own decay, plus the noise of the blow.
- Things that repeat fast (clock, col legno, pizzicato, timpani, piano) are made in two or three slightly different takes, chosen at random.
- Playing: every note is a few milliseconds early or late and a little louder or softer (the clock is exact); struck harder is brighter; held tones are played twice, panned apart; everything goes to one made hall (a convolution reverb whose impulse is generated: 25 ms gap, a few early walls, a darkening tail; smaller for the chamber).

Cost of making them: about 0.5 to 0.9 s of work for one arrangement, 1.3 s and 64 MB of memory if all three are used in one session (about 40 MB for one). `warm()` makes the first set a little at a time when the music starts.

## The states

`AA.music.state(name)`. A new state starts on the next bar line (at most one bar, 2.6 s, plus 0.35 s) with a soft timpani roll into it. Those marked "at once" cut in at the call.

| State | When | What plays |
|---|---|---|
| `title` | title screen | two bars of clock and bass, then the full tune |
| `bench` | between runs | pieces of the tune over a held bass note |
| `shop` | the shop | the B half first, lighter |
| `pick` | choosing a molecule | the tune bent onto hanging chords, a question with no answer |
| `plan` | a round in play, the player is choosing | clock, wood, pizzicato, pieces of the tune; leaves room for the queue and fire sounds |
| `chain` | from fire, while the molecule reacts (at once) | no beat of its own: see below |
| `overreact` | the OVERREACT moment (at once) | tam-tam and bass drum, then the tune in octaves with everything, fading in over about a second so the effect's own hit is heard first; eases off after 8 bars |
| `won` | round won (at once) | a three-bar close (Gm, A, open D), then a lighter loop |
| `lost` | round lost (at once) | a falling phrase that does not resolve, then a drone |
| `runwon` | run won (at once) | a rising phrase to D major, then the tune at full strength; eases off after 12 bars |
| `runlost` | run lost (at once) | the tune slow, sung low by the choir |

`AA.music.intensity(0..1)` moves the level within a state: timpani, piano figures, choir, bells or brass come in at set levels.

### The chain

The effects play each step on the game's own timing (gaps shrink from 0.93 s to 0.57 s), so there is no fixed tempo to share. In a chain the music drops its beat: the clock speeds up, shivering strings open, a choir gains one voice at a time, low brass (cello and bass clarinet in the chamber) swells, wood knocks crowd in, a timpani roll grows, and near the top one string note sits a semitone off. `AA.music.step(n)` at each hit sets intensity to n/12, moves the bed to the effects' chord (Dm, Bb, Gm, A, three steps each, read from `sfx.js`), and plays one note of the tune on piano and pizzicato (harp and a bell in the gothic one), bent to that chord.

### Rounds: sane to unhinged (HARNESS line AM)

`AA.music.round(1..9)`. Round 1 is in tune and in time. By round 9: 18 percent faster, and the tempo runs away through each 8 bars then snaps back; every note drifts up to 17 cents and slips late; from round 4 each E in the tune falls to E flat, from round 6 the short A's fall to A flat, from round 8 the last bar of a section is doubled a tritone up and the bass steps to the tritone; a few random wrong notes; more and more piano notes are played on the prepared piano (bolts in the strings); the choir comes in sooner (in the chamber, where there is no choir, one creeps in from round 6) and up to three more voices join, one a semitone off every other bar; everything is driven harder. Loudness is held within 1.4 dB of round 1.

## The API

```
AA.music.state(name)        // see the table; no argument reads it
AA.music.intensity(0..1)
AA.music.step(n)            // a chain step, 1 and up, at the hit
AA.music.round(1..9)
AA.music.arrange('a'|'b'|'c')   // Fuse's arrangement; saved
AA.music.theme(1|2|3)       // 3 is Fuse and the default; 1 and 2 are shelved
AA.music.volume(0..1)       // music only; saved
AA.music.seed(n)            // the run's seed: same seed, same choices
AA.music.duck(depth, ms)    // only needed without the shared bus
AA.music.stop()
AA.music.info()
AA.music._renderTimeline(events, secs, opts)   // offline; opts: theme, arr, seed, round, volume, solo
AA.music._renderWithSfx(events, sfxEvents, secs, opts, sfxOpts)
AA.music._score(events, secs, opts)            // no sound: the bar log
```

## What the page builder must call, and where

1. Load `js/music.js` right after `js/sfx.js`, before the first sound.
2. Title screen: `AA.music.state('title')`. Sound starts on the first click or key, as the effects do.
3. Bench: `state('bench')`. Shop: `state('shop')`. Choosing between two molecules: `state('pick')`.
4. Run starts: `AA.music.seed(runSeed)`. Round n begins: `AA.music.round(n)` then `state('plan')`.
5. The line fires: `state('chain')`.
6. Each reflex hit, where `AA.sfx.reflex(kind, n, ...)` is called: `AA.music.step(n)`.
7. OVERREACT pops: `state('overreact')`, at the same moment as the effect.
8. Round ends: `state('won')` or `state('lost')`. Next page of the same round: `state('plan')`.
9. Run ends: `state('runwon')` or `state('runlost')`.
10. Stop calling the old `AA.sfx.startMusic()` / `setMusic` / `setIntensity`.
11. Settings: a music slider calls `AA.music.volume(v)`. On the shared bus the effects' volume and mute also act on the music.

## The bus

`sfx.js` keeps its audio context private, so `music.js` catches it by wrapping `AudioContext` when it loads, and plugs into the effects' ducked bed (`ctx.__ovsb.bed`) as soon as that exists. Then every effect hit pushes the music down, the held breath before the last hit silences it too, and both share one limiter. With no effects bus the music uses its own limiter. A one-line getter in `sfx.js` would replace the catch; that file belongs to the sound builder.

## Measurements (Fuse, after the second director's fixes)

Offline renders in headless Edge through the real code (`.claude/music/`, not in git). Loudness is K-weighted and gated like LUFS, by our own script. Volume 0.7, round 1.

Loudness per state (LUFS), share of energy under 120 Hz, level lost through a phone speaker (300 Hz high-pass):

| State | a chamber | b gothic | c hybrid |
|---|---|---|---|
| title | -20.1, 9%, 2.4 dB | -19.6, 12%, 2.4 dB | -19.1, 16%, 2.1 dB |
| bench | -24.2, 7%, 1.7 dB | -25.2, 14%, 1.9 dB | -25.3, 17%, 2.0 dB |
| pick | -26.7, 9%, 2.3 dB | -27.5, 13%, 2.4 dB | -26.9, 13%, 2.3 dB |
| plan | -26.0, 22%, 3.4 dB | -27.6, 22%, 2.9 dB | -27.4, 36%, 3.8 dB |
| chain (steps 1 to 12) | -26.8, 23%, 3.3 dB | -27.1, 15%, 2.6 dB | -25.6, 13%, 2.3 dB |
| overreact | -15.3, 26%, 3.8 dB | -15.2, 18%, 2.5 dB | -14.5, 20%, 2.2 dB |
| won | -21.5, 9%, 2.6 dB | -20.1, 12%, 2.5 dB | -21.6, 18%, 2.4 dB |
| shop | -22.2, 4%, 1.4 dB | -21.5, 12%, 2.1 dB | -23.4, 20%, 2.1 dB |
| lost | -26.6, 9%, 3.3 dB | -24.8, 9%, 2.0 dB | -26.4, 17%, 2.9 dB |
| runwon | -16.4, 18%, 3.0 dB | -15.8, 14%, 2.2 dB | -15.4, 18%, 2.1 dB |
| runlost | -23.7, 6%, 3.9 dB | -21.4, 6%, 1.7 dB | -23.5, 11%, 3.0 dB |

No sample at full scale in any take. Highest peak, music alone: -2.2 dBFS.

With the effects (arcade a, chant layer on, the logged 12-step chain, both through the effects' bus):

| | a | b | c |
|---|---|---|---|
| Least room under an effect hit (hit level minus music level in the same 0.3 s) | 9.7 dB | 11.8 dB | 8.3 dB |
| Chain loudness: effects alone / music alone | -16.0 / -27.1 | -16.0 / -27.7 | -16.0 / -25.6 |
| First second of OVERREACT: effect / music | -10.5 / -22.7 dB | -10.5 / -22.8 | -10.5 / -21.5 |
| Peak of the two together, clipped samples | -0.8 dBFS, 0 | -0.8, 0 | -0.8, 0 |

Fullness against the Fuse the owner heard (all eleven states, 176 s):

| | old Fuse (oscillators) | a | b | c |
|---|---|---|---|---|
| Share of energy over 4 kHz, whole / title | 0.55% / 0.07% | 1.9% / 2.7% | 1.1% / 1.3% | 1.3% / 1.2% |
| Separate partials within 40 dB of the strongest, per frame | 47 | 154 | 162 | 145 |
| Flatness of the spectrum (0 = a few bare tones) | 0.0036 | 0.027 | 0.026 | 0.025 |
| Stereo side level under the middle | -14.4 dB | -10.7 | -9.0 | -9.4 |
| Layer of the tune over the next loudest layer, title | (not measured) | +5.1 dB | +3.6 dB | +6.1 dB |

A first build had 3.5 to 4.7% over 4 kHz, but the director showed most of that was hiss from the noise put under the choir and strings, not overtones. The hiss was cut, so the figure fell. The top is still thin.

The same eight bars at round 1, 5, 9: 20.9 / 18.8 / 17.2 s in all three; loudness a -19.0 / -19.4 / -19.7, b -18.7 / -19.2 / -20.1, c -19.1 / -18.8 / -20.0 LUFS.

Repeats, twelve minutes held in one state, counted on the notes written: 8 bars never come back note for note in any arrangement or state; 4 bars come back once in b (shop at 5 min, title at 11.7 min) and never in a or c; the tune alone first comes back as written after 84 s or more (meant to); 0 to 4% of bars equal another seed's bar at the same place.

Cost (30 s takes written a second ahead as the live clock does, best of three on a shared machine):

| | a | b | c |
|---|---|---|---|
| Render time per second of sound, title / overreact | 0.054 / 0.080 s | 0.050 / 0.079 s | 0.071 / 0.090 s |
| Nodes made per second, title / overreact | 57 / 108 | 51 / 85 | 80 / 133 |
| Most nodes alive at once, title / overreact | 141 / 253 | 156 / 240 | 214 / 321 |

No AudioWorklet was needed. Live load in the game was not measured (the browser's load meter is absent in headless Edge). The live player was run in headless Edge in all three arrangements in title, overreact and chain: it starts, plays and switches.

## The second director's judgement

One fresh sub-agent, asked "does any of this still sound like an arcade or 8-bit game". It could not hear either. Judged before the last fixes:

- Arcade, 8-bit, mobile-puzzle: pass for all three arrangements in every state, music alone. No bare oscillator is left in Fuse's path except the hybrid's soft low sine and its kick.
- The new risk is different: "1990s sound module". Struck and plucked things (pizzicato, piano, timpani, bass drum, tubular bell, clock) are likely close. Sections (strings, choir, trombones) are likely recognisable. Solo bowed and blown lines (the cello and horn on the tune) stay synthetic, because the life of those is in how notes start and join, which a steady loop does not have.
- **During a chain the effects, not the music, will still sound arcade.** `sfx.js` has 88 saw, square and triangle voices and sits about 10 dB over the music there. That file is the sound builder's and was not touched.
- The tune: a real, hummable 8-bar tune; one sour bar (fixed).
- It would put forward c (hybrid): the most convincing wait (clock, wood, pizzicato) and the only blow-up with real weight. Fallback: a with c's blow-up. b leans hardest on the weakest sounds (choir and organ loops).

Fixed after its report: choir hiss cut; solo tones steadied so tune notes are even; a bow noise under each cello start and a puff under organ notes; the tune 3 dB up, pad down, the hybrid's calm pad thinned; the sour bar; strings changed from a bright pad towards a section; bass clarinet no longer a filtered-square spectrum; two or three takes of the fast-repeating instruments; struck harder is brighter; a gap before the hall's tail, a smaller hall for the chamber, less of the tune in it; the middle rounds made odder; the off choir voice only every other bar; piano rings longer; timpani thud; tam-tam blooms; anvil at one pitch; the gothic clock in eighths; the cello never sent an octave up. Not done from its list: true legato joins on the tune (each note is still struck afresh); a second, brassier horn set. The fixed version was measured again but not sent back to the director.

## How close synthesis gets, and what a licensed sample set would add

Judged from recipes and measurements, not by ear: this tops out at about "a good 1990s sound module in a nice hall". It is not chip music, and it is not a recorded orchestra.

A licensed sample set would add: real bow noise, bow changes and true legato on cello and horn; three to five loudness layers where the tone itself changes (brass that turns brassy, piano that hardens); several real takes of each note; real choir vowels with breath and consonants; a real room and real release tails; true col legno, timpani rolls and tam-tam bloom. The biggest gain would be the solo cello and horn that carry the tune, and the choir. Piano, pizzicato, bells, timpani and the clock could stay made by code. A set would add download size (hundreds of MB for an orchestral one unless trimmed to these few instruments) and a licence to check for a commercial game.

## Not done

- Nobody has listened to the rebuilt Fuse.
- Not wired into any game page. No page calls `AA.music` yet.
- The sound effects still sound arcade in a chain; that is `sfx.js`.
- No legato between tune notes; one loudness layer per instrument (brightness is a filter).
- Little energy over 4 kHz (1 to 2%).
- A state change that is not a cut waits for the bar line (up to about 3 s).
- 40 MB of memory for one arrangement, 64 MB if all three are used; the first bar of a new state can wait up to about 0.1 s for a low piano note to be made if `warm()` has not reached it.
- No separate music mute on the shared bus; no pause or window-blur handling.
- Live CPU load not measured; only offline render time.
- `AA.sfx.ambience` and the music together not checked.
- Themes 1 and 2 are untouched oscillator versions; their measurements are in git history of this file.

## Clips

In `C:\Work\atlas-atoms\.claude\shots`: `fuse-a.mp4`, `fuse-b.mp4`, `fuse-c.mp4` (title, planning, chain, OVERREACT, round won, shop, then the same eight bars at round 1, 5, 9; 152 s each), `fuse-compare.mp4` (the Fuse the owner heard first, then a, b, c on the same 30 s), `fuse-with-effects.mp4` (a, b, c each under the effects on the 12-step chain). The earlier `music-*.mp4` clips are the three oscillator themes.
