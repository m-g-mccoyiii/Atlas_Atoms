# Overreact sound

One file: `apps/steam/js/sfx.js`, exposed as `AA.sfx`. Web Audio only, no audio files, nothing downloaded.

## Bus and loudness

Every voice goes to one master gain, then a DynamicsCompressor used as a limiter (threshold -6 dB, ratio 20, 2 ms attack), then a soft clip, then the speakers. The loudness ladder multiplies each voice: ui 0.5, ring 0.8, flag 1.1, over 2.4. The context is created on first use and resumed by a one-time pointerdown or keydown listener, so the first sounds are not lost.

`setMuted(bool)` and `setVolume(0..1)` are kept in localStorage under `overreact.sfx`. `isMuted()`, `getVolume()`, `resume()` also exist. Music is not started by anything.

## Foundation set

| Call | When | How it is made |
|---|---|---|
| `queue(i)` i 0 to 2 | each reaction added to the line | soft triangle click, 620 Hz up a semitone per i, plus a 20 ms noise tick. Quiet. |
| `fire()` | the line fires | one low wood knock: sine 190 to 82 Hz in 120 ms, a short higher tap, a 30 ms band-passed tick |
| `ring(n)` n 1 and up | ring n of a row closes, one call per ring | sine bell plus a quiet partial at 2.76 times. Major pentatonic from C4, one step per ring. No cap: after 4 octaves it keeps stepping through the top two. Higher rings are softer. Decay 0.55 s shrinking to 0.26 s, so rings 130 ms apart stay separate. |
| `flag(1)` stable | first word | one soft low bell at 220 Hz |
| `flag(2)` unstable | second word | the same bell a fifth up (330 Hz) plus a quiet noise swell |
| `flag(3)` volatile | third word | two saws detuned plus and minus 9 cents through a low-pass rising 250 to 3600 Hz, plus six short noise crackles |
| `flag(4)` overreact | fourth word | sine drop 90 to 38 Hz, bright high-passed noise crash, low-passed noise whoosh, a held six-note cluster chord and a low fifth for 2.8 s. Loudest by far. |
| `wasted()` | a reaction that did nothing | muted thud: sine 150 to 52 Hz plus low-passed noise. No saw. |
| `pageTurn()` | the page turns | one band-passed noise sweep 600 to 3000 Hz over 200 ms |
| `lost()` | round lost | triangle through a closing low-pass: G4 sliding slightly, then E-flat4 (falling minor third), then silence. No noise. |
| `demo()` | console self-test | plays three queues, fire, eight rings from 380 ms gaps down to 130 ms, the four flags, wasted, pageTurn, lost. Returns the length in ms. |

## Older calls, kept, now on the bus

`click, feed, pen(ms), bond, stamp, good, lock(i), fanfare, quota, over, fuse, chain(i), squish, drift, bad, startMusic, setMusic, musicOn, setIntensity`. Same names and arguments. `feed` is now three tiny bursts over about 90 ms instead of seven over half a second.

## Testing

`AA.sfx._render(name, args, seconds)` runs one call into an OfflineAudioContext and resolves the samples. No speakers needed.

## Not yet wired

`scheme.js` still calls the old names. Using the new ones, and bumping the `sfx.js?v=N` number in `scheme.html`, belongs to the owner of those files.
