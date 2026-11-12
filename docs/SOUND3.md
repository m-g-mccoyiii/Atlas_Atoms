# Overreact sound, third build: style 4, "lab orchestra"

Builder: sound-builder-3. One game file: `apps/steam/js/sfx.js` (`AA.sfx`). Styles 0 to 3 are untouched and still work; `docs/SOUND2.md` describes them. `music.js` was read, not edited.

**Nobody has listened to any of this.** It was built and judged from the recipes, measurements and spectrogram pictures, by the builder and by two director sub-agents who could not hear either.

## Why

The owner liked the arcade style's shape but not its sound ("less child game sounding"), and had the soundtrack rebuilt on real-sounding instruments ("can we use more than just 8 bit noise"). That left the effects as the arcade-sounding part: about 88 saw, square and triangle voices, about 10 dB over the music in a chain.

Style 4 keeps what the arcade does (a pulse, a build step by step, a clean drop, punch) and plays it on the same kind of instrument as the soundtrack, plus the lab itself. No bare saw, square or triangle voice is in its path.

## What it is

- **The bank (`LAB`).** Each instrument is a short recording worked out by code the first time it is needed, as `music.js` does it, and shared by every audio context.
  - Held tones (one inverse FFT of the spectrum): double basses, cello, shivering strings, low brass, horn, choir on oo, oh and ah, organ pedal, a burner's roar, steam.
  - Plucked (a string model): pizzicato, col legno, harp.
  - Struck (ringing modes): timpani, bass drum, field drum, anvil, tubular bell, tam-tam, piano, prepared piano, tuned glass, a clock tick.
  - The lab (modes, noise bursts, bubbles): glass clink, glass crack, glass shatter, a flask rung like a bowl, bubbles, a single bubble, a pour, a cork, a metal clamp, paper, a page, a drip, fizz, grains, a puff of gas, a coin, four eight-second room loops.
- **The hall** is the soundtrack's: the same generated impulse from the same seeds (arrangement c's length), on a send.
- **A chain step** (`reflex(kind, n, o)`), in D minor over Dm, Bb, Gm, A, three steps each, as `music.js step(n)` follows:
  1 bass drum, plucked bass, wood, the kind's voice; 2 wood on the offbeat, the kind answering itself, the deep layer; 3 plucked basses walk; 4 harp, a ghost drum, ticks; 5 timpani; 6 louder ticks; 7 shivering strings and a piano chord; 8 a low brass stab; 9 a bell and piano double the line; 10 a timpani roll into the next step; 11 an anvil and a field drum roll.
- **The deep layer** (ruling AK) is real double basses and a low choir on the ducked bed. It enters at step 2 and climbs 2 dB a step. One more singer joins every two steps (up to seven), the vowel opens oo, oh, ah, and from step 8 they sing two syllables a step. `deep(1)` basses only, `deep(2)` with the choir (default), `deep(3)` adds a heartbeat on the bass drum.
- **The wind-up before the last hit**: timpani and field drum rolls, choir and strings swelling on the A chord with a B flat inside it, steam and burner rising. All of it stops 170 ms before the hit (the held breath).
- **The last hit**: bass drum, timpani, low piano, low brass and horns on D minor, an E flat that rubs and dies first, the choir, anvil, tam-tam, a bell, cracked glass, the kind's own voice on top.
- **OVERREACT** (`flag(4)`): two blows of bass drum and timpani, tam-tam, two anvils, the bottom of the piano with a bolted E flat, organ pedal, low brass that sags, horns that hold, a choir torn upward, glass shattering twice, the burner swelling, timpani thunder, glass and clamps still falling 2.5 s later.
- **The marks on the way up** (`flag(1..3)`, no words now): a bell tolls once; twice with shivering strings; three times with a tritone, an anvil, a choir stab and cracking glass.
- **The thirteen kinds**, each its own instrument or object:

| Kind | Voice |
|---|---|
| lactol (ring) | a flask rung like a bowl, a tap of glass |
| enone (dry) | a puff of steam, a low whump of the burner, a drip |
| taut (flip) | low plucked strings, there and back, over a harp note |
| weld | an anvil and a short low brass blast |
| snap6 (snap) | glass cracks, twice, with splinters |
| ether (close) | one sung "oh" |
| shift | a cello slides up into its note |
| tuck | a kettledrum, a clamp, a plucked string |
| knit | a harp, three notes up |
| seal | a cork driven home, twice, and the air it pushes |
| cap | a piano string with a bolt in it, and a glass |
| open | a pour and a bubble |
| fold (rung, across) | paper creasing, two cellos on an open fifth over a low piano string, one far bell |

- **Rounds** (`round(1..9)`, ruling AM). Round 1 is sane. Deeper in:
  - tuned notes drift up to 12 cents and some sag or creep 60 cents after they start;
  - piano notes turn into prepared piano;
  - choir voices sit a semitone off;
  - glass cracks on the steps, a wrong echo a tritone away, a drum that jumps the beat, a wrong note from nowhere, a bass note a tritone off;
  - brass from step 5 and the anvil from step 8 instead of 8 and 11;
  - the hall send grows; the chain is up to 2 dB louder;
  - OVERREACT gains a third blow (from round 4) and a fourth with more glass (from round 6).
- **The other screens** (`ACTS4`): one gesture each, no tunes and no runs up, because the soundtrack carries the tune. Room tone (`ambience`) is two copies of the burner at different speeds and two room loops of different lengths.

## API

Everything in `docs/SOUND2.md` still holds. New or changed:

| Call | What it does |
|---|---|
| `style(4)` / `setStyle(4)` / `?sfx=4` | the lab orchestra. The default is still 2 until the owner chooses. Setting 4 starts making the bank in small slices |
| `round(n)` / `setRound(n)` / `getRound()` | the round, 1 to 9; only style 4 uses it. Not saved |
| `warm()` | make style 4's instruments ahead of time in slices; `warm(true)` all at once |
| `reflex(kind, n, o)` | kinds as before; `rung` and `across` now mean `fold` |
| `clink(n, m)` | m names what came off: `'water'` (or 0, 3), `'heavy'` (1), `'gas'` (2), `'acid'` (4), `'salt'` (5), `'oil'` (6) |
| `deep(1..3)` | in style 4: basses; basses and choir; both and a heartbeat |
| `_render` / `_renderTimeline` opts | also `round` |
| `_kind(kind, n)`, `_inst(i, m, g, x)`, `_lab()` | test hooks: one kind alone, one instrument alone, what the bank has made |

`arcade()` does nothing in style 4.

## What the page builder must call

1. `AA.sfx.setStyle(4)` (or `?sfx=4`) once, early, so the bank is made before the first chain.
2. `AA.sfx.round(n)` when round n begins, beside `AA.music.round(n)`.
3. `windup(n, ms, last)` where each reflex step begins: without it there is no riser and no held breath.
4. `reflex(kind, n, o)` at each hit, with `AA.music.step(n)` beside it; `flag(4)` with `AA.music.state('overreact')`.
5. `flag(1..3)` when the lower marks are passed (sound only now).
6. `clink(n, m)` with the name of what came off.
7. The screen acts and `ambience(kind)` from the screens in the table of `docs/SOUND2.md`; `ambience(null)` when a chain starts.
8. In recorders use `setStyle`, `setRound`, `setDeep`.
9. Bump the `sfx.js?v=` number in the pages.

## Measurements: style 4 against arcade a

The same 12-step chain (twelve different kinds, the page builder's logged timing), then OVERREACT. Stereo, 44.1 kHz, rendered offline through the real `sfx.js` in headless Edge. Per step means the 300 ms after each hit.

| | arcade a | style 4 | round 5 | round 9 |
|---|---|---|---|---|
| step 1 RMS (dB) | -19.1 | -25.3 | -24.7 | -23.7 |
| step 11 RMS | -14.5 | -18.5 | -17.2 | -17.8 |
| last step RMS | -10.7 | -13.9 | -14.2 | -13.9 |
| rise per step, steps 1 to 11 (dB) | 0.86 | 0.78 | 0.83 | 0.59 |
| last step minus steps 1 to 3 (dB) | 9.8 | 10.0 | 9.5 | 7.9 |
| brightness rise per step (Hz) | 21 | -101 | -90 | -68 |
| share under 120 Hz (%) | 48.4 | 37.3 | 28.5 | 33.3 |
| phone loss, whole take: full minus 300 Hz high-pass (dB) | 5.3 | 3.9 | 3.0 | 3.1 |
| stereo side vs mid (dB) | -10.3 | -11.7 | -10.5 | -10.7 |
| crest factor (dB) | 16.6 | 16.8 | 17.0 | 16.5 |
| quietest moment before the last hit | -40.4 | -50.3 | -50.4 | -50.0 |
| last hit peak | -1.1 | -2.5 | -2.1 | -2.0 |
| last hit, first second RMS | -15.2 | -16.4 | -16.0 | -16.4 |
| last hit on a phone, first second | -26.9 | -20.6 | -19.6 | -19.1 |
| last hit phone loss (dB) | 11.7 | 4.2 | 3.6 | 2.7 |
| OVERREACT peak | -1.1 | -0.9 | -1.5 | -1.4 |
| OVERREACT, first second RMS | -10.5 | -11.1 | -11.9 | -11.4 |
| OVERREACT on a phone, first second | -19.6 | -17.1 | -16.6 | -16.0 |
| OVERREACT phone loss (dB) | 9.1 | 6.0 | 5.3 | 4.6 |
| OVERREACT over the last hit, first second (dB) | 4.7 | 5.3 | 4.1 | 5.0 |
| OVERREACT 2 s on, vs its peak (dB) | -10.6 | -3.0 | -1.4 | -0.9 |
| whole take loudness (LUFS) | -14.4 | -14.8 | -14.6 | -14.5 |
| clipped samples | 0 | 0 | 0 | 0 |

Per-step RMS (dB):

| | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| arcade a | -19.1 | -24.6 | -17.9 | -18.8 | -20.5 | -17.9 | -15.5 | -16.7 | -12.5 | -13.0 | -14.5 | -10.7 |
| style 4 | -25.3 | -24.9 | -21.6 | -23.2 | -20.0 | -23.5 | -21.0 | -18.4 | -17.4 | -17.2 | -18.5 | -13.9 |
| round 9 | -23.7 | -22.6 | -19.2 | -20.6 | -17.8 | -21.0 | -18.9 | -17.4 | -17.8 | -16.0 | -17.8 | -13.9 |

Per-step level after a 300 Hz high-pass (a phone speaker):

| | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| arcade a | -21.8 | -27.1 | -18.6 | -24.2 | -26.1 | -19.8 | -16.3 | -29.8 | -15.5 | -14.1 | -18.3 | -23.4 |
| style 4 | -32.3 | -26.2 | -25.3 | -24.5 | -20.3 | -24.0 | -22.3 | -23.4 | -22.3 | -18.8 | -23.5 | -18.6 |

Step 8 no longer falls out on a phone (arcade -29.8, style 4 -23.4, 1.1 dB under step 7).

### How different the thirteen kinds sound

RMS difference in dB of level-normalized third-octave spectra (`kinds.py`):

| | step 1 mean | step 1 closest | step 6 mean | step 6 closest |
|---|---|---|---|---|
| today (from SOUND2.md) | 9.5 | 0.0 | 9.4 | 0.0 |
| arcade a | 14.6 | 5.2 | 8.1 | 3.8 |
| style 4 | 17.8 | 7.5 (weld, seal) | 10.8 | 5.4 (taut, cap) |
| style 4, each voice alone | | | 19.0 | 7.5 |

Alone, the thirteen voices are within 2 dB of each other in level.

### With the soundtrack (Fuse, arrangement c, through `_renderWithSfx`)

| | arcade a | style 4 |
|---|---|---|
| chain loudness, effects alone (LUFS) | -15.8 | -18.7 |
| chain loudness, music alone | -25.6 | -25.6 |
| effects over music in the chain (dB) | 9.8 | 6.9 |
| chain, both together | -16.0 | -18.1 |
| least room over the music at a hit (dB) | 8.5 | 6.3 |
| first second of OVERREACT, effect / music (dB) | -10.5 / -21.5 | -11.0 / -21.5 |
| peak of both together, clipped samples | -0.7 dBFS, 0 | -0.9 dBFS, 0 |

The walk under the music, loudness per state (LUFS):

| | title | planning | chain | OVERREACT | round won | shop |
|---|---|---|---|---|---|---|
| arcade a | -18.9 | -28.0 | -15.7 | -14.0 | -20.6 | -21.5 |
| style 4 | -19.3 | -28.0 | -18.0 | -12.6 | -20.1 | -22.2 |

With the arcade the chain is louder than the OVERREACT stretch. With style 4 the order is planning, chain, OVERREACT, 5 dB between the last two.

### Cost

About 200 recordings for a session that plays everything: about 1.0 s of work and 48 MB (97 MB if every pitch of every instrument is made). This is on top of the music's 40 to 64 MB. Offline render time per second of sound is about the arcade's.

## The directors

**First** (before fixes). Failed it on: cartoon bloops (bubbles and drips were sine chirps rising 25 to 110 percent); arcade jingles in the screen acts; coin trills; an OVERREACT that was a slab on the limiter with a sparkle for a shatter; eight learnable families, not thirteen; round 9 as "a sour, blurry school band". Passed: one world with the soundtrack; the build and the drop.

Fixed after it: bubbles and drips rise 5 to 10 percent, an octave lower, with a splash; new screen acts with no runs; one dull coin; ticks on one pitch; a new shatter (crash, thud, 300 noisy splinters); OVERREACT's held voices strike, fall back and swell, brass sags while the choir is torn upward, no coins in the debris; kinds leveled and pulled apart; detune capped at 12 cents with later rounds louder and brassier instead; wood on the beat from step 1 and ticks from step 4; room tone doubled at different speeds; the bugs it found.

**Second** (fresh, checking the fixes):
- Arcade or children's game anywhere: **pass**.
- One world with the soundtrack: **pass**.
- Each kind distinct: **pass**.
- Exciting: **fail**. "The payoff is a flat block, and a deep run sounds almost the same as round 1."
- OVERREACT the biggest and dangerous: **fail, narrowly**. Biggest by length, not by blow; its first 150 ms is only 1.7 dB over the last hit's.
- Of the nine fixes: bloops, act jingles and kinds fixed; the rest partly.

Changed after the second director, **not judged again**: OVERREACT's roar now starts 0.3 s late and swells, organ and tam-tam lower, the held voices fall further before they swell; later rounds add a third and fourth blow to OVERREACT; the wrong echo, wrong note and cracks of later rounds twice as loud; the anvil's earlier entry fixed; a run won sings D major; the jar rings one note; `open` starts on the beat; weld and ether lifted.

## Failed or not done

- Nobody has listened.
- **OVERREACT is still a slab.** Measured after the last change: it sits between -10 and -14 dB for 3 s. The strike, fall and swell does not show in the level.
- OVERREACT's phone loss at round 1 is 6.0 dB against a target of under 6.
- Effects are 6.9 dB over the music in a chain against a target of about 6.
- Round 9 against round 1: louder steps, more onsets, same last hit. Whether it reads as more unhinged was not judged after the last change.
- The chain gets darker as it builds (-101 Hz a step); the arcade got brighter.
- Step levels still follow the kind: steps 4, 6 and 11 are quieter than the step before. Step 1 loses 7 dB on a phone.
- Counting-up leftovers the second director named: the three `queue` clinks rise in thirds, the knit harp runs up, the third mark's three bells rise.
- Room tone still loops (1.5 s burner, 8 s rooms); one copy runs slow, so its flask notes are about 40 cents flat.
- `PAL[4]` (the old act palette, with a boing) is still in the file but nothing calls it.
- Live play was not tried: only offline renders. A sound whose instrument is not yet made waits for it (a few to 60 ms); `setStyle(4)` early avoids this.
- Inspections, sigils, and each creature and instrument by name still share one voice each.
- No page calls any of this yet.

## Clips (C:\Work\atlas-atoms\.claude\shots)

Each was decoded end to end without error.

- `fx4-compare.mp4`: arcade a, then style 4, the same chain; cards 1 and 2. 40 s.
- `fx4-with-music.mp4`: style 4 under Fuse c: title, planning, chain, OVERREACT, round won, shop. 64 s.
- `fx4-arcade-with-music.mp4`: arcade a under the same. 64 s.
- `fx4-kinds.mp4`: the 13 kinds, named on cards; each alone, then as step 6 of a chain. 40 s.
- `fx4-rounds.mp4`: the same chain at round 1, 5, 9. 60 s.
- `fx4-whole-game.mp4`: every screen and act in style 4, a card each. 105 s.

## How to render and measure

Tools in `.claude/snd/` of the worktree (not in git), copied from sound builder 2 and the music builder and adapted:

- `srv.py` (port 8843), `render.sh <jobs.json> <tag>`, `page.html`: headless Edge renders each job through the real `sfx.js` and `music.js`. Job kinds: effects alone, `both`, `music`, `fxm` (effects through the music's path, music muted), `lab` (bank cost).
- `mk_tl4.py`, `mk4.py`: timelines and jobs. `all.sh`: every render and measurement. `measure.sh` writes `out/measure4.txt`.
- `analyze.py`, `sum.py`, `kinds.py`, `kinds2.py`, `acts.py`, `man.py`, `fxan4.py`, `walk.py`: the numbers above. `mk_clips4.py`: the clips and the decode check.
