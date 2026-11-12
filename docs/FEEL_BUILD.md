# Overreact: the feel build

Branch `feel-builder`. The moment of play lives in `apps/steam/js/react/feel.js` (`AA.rxFeel`). `scheme.js` hands the sequence to it through small hooks; with feel 0, or with feel.js not loaded, the page plays exactly as before.

## Interim note

The first comparison video was delivered early at `C:\Work\atlas-atoms\.claude\shots\feel-compare-long.mp4` (the old sequence, then directions 1, 2 and 3 on the same 12-step line, each after a half-second number card, with sound). It has since been rebuilt from the later takes.

## The switch

- `AA.rxFeel.set(0 | 1 | 2 | 3)` in the console, or `?feel=0..3` in the address. Saved in localStorage under `overreact.feel`.
- 0 is the old sequence. With nothing saved and no `?feel`, the page uses direction 1.
- `AA.rxFeel.state()` reports the page being played (steps, planned N, shown count, zoom, shake, words, speed).
- A click or Space or Enter while a page plays doubles the speed of the rest of the page; once everything has landed a click turns the page at once.

## What is built (all three directions share it)

- **The plan.** At fire the whole page is worked out on a saved copy (`P.snap`, the queue, `P.cascadeNext`, `P.back`), so the sequence knows N, the yield after each step and which step is the last before anything moves.
- **The throw.** Each reagent leaves its circle as a token of its own color and flies on an arc to the atoms it changes (ease-in, so it arrives hard). It touches the molecule's edge and the change starts. Each impact knocks the molecule along the throw and plays `strike(i)`, heavier for each of the three.
- **The page dip at fire** and the count taking each reagent's gain as it lands.
- **The hand-off.** One low bell (`handoff`) where the molecule takes over.
- **Each reflex step** in four parts: a wind-up (the moving atoms draw back along their own path, eased out), a committed swing (ease-in to a power, fastest at contact), a hit-stop (the joined pair tremble along the line of contact, everything else holds), then the joined group carries past its end and rings down on a damped spring while the rest of the molecule is knocked the other way and turns, as one rigid piece. Bond lengths are not stretched: the group moves along its own path and the molecule moves and turns whole.
- **Each new drawing is laid onto the old one** (a best-fit turn and shift in the plane of the page) before it moves, so only what changed moves and the molecule no longer flips about between steps.
- **The time law.** T(n) = max(Tmin, T1 r^(n-1)), never under 10 frames; T(n) holds the wind-up, the swing and the hit-stop; the settle overlaps the next wind-up. The hit-stop is capped at 35 percent of T(n).
- **The last step is always the biggest.** A longer wind-up held at full draw (direction 2: a held breath), the longest hit-stop, the biggest recoil and drop, `boom` under the bell, and the overreact word only after the final hit has landed.
- **The framing.** At fire the molecule eases (450 ms) into the free part of the page and is scaled up to fill it, then eases back (600 ms) before the page turns. Two free boxes are tried, the full width above the left column or the part right of it reaching lower, and the one that frames the molecule larger is used. The molecule is never allowed to clip.
- **The count.** The yield is drawn by feel.js while a page plays: it takes each gain only when the gain arrives, is set down on each arrival (it drops and springs back, it never scales), turns green at the spec and steps up in size with each flag passed. `tick` sounds while it moves (at most one every 45 ms).
- **The numerals.** At each hit the step number is written by the game's pen under the molecule at the join, larger each step; the one before fades as it is replaced. The gain is written under it and flies to the yield.
- **The flags.** Passed by the shown count, not by the rules' total. The flag fills, its pole jolts and rings, `flag(k)` plays, and the word is written in the pen on the yield's line; the earlier words step down to 60 percent. Two flags passed together fire in order. The overreact flag passed early fills quietly (`flagSoft`); its word and `flag(4)` wait for the last hit and land last, in heavy ink above the line.
- **Runoff** leaves as the art's runoff objects (`ro_water`, `ro_h2`, `ro_co2`), kicked up from where it left, falling to where it is kept, with a `clink` on landing.
- **The end of the page** waits until the count has landed, every gain has arrived and every word is written, then holds, then turns. The page never starts to turn while anything is landing.
- **Each kind of reflex has its own sound color** (`reflex(kind, n, o)`): a ring closing is a bell, a water loss a hollow wood, a C=C shift a plucked string; the pitch climbs the pentatonic scale per step. The bare game has one kind (`lactol`), so the recorded lines use the bell.

## The three directions

| | 1 Mass | 2 Runaway | 3 Close-up |
|---|---|---|---|
| idea | the molecule is heavy; every join is a hammer blow on the page | it runs away faster and faster with the count racing, holds one breath, then lands once | the camera directs: it dives to each join and pulls back as the count climbs |
| T1, r, Tmin (ms) | 600, 0.90, 240 | 480, 0.82, 167 | 600, 0.86, 200 |
| wind-up, swing (share of T) | 0.38, 0.22 (ease-in power 5) | 0.20, 0.40 (power 3) | 0.30, 0.25 (power 3) |
| hit-stop (frames) | min(3 + n, 10), last 14 | 1, last 12 | min(2 + n, 8), last 12 |
| draw-back (share of W) | 0.06 + 0.004 n | 0.035 | 0.05 |
| overshoot, spring | 4 percent, 9 Hz, damping 0.55 (hard stop) | 6 percent, 6 Hz, 0.35 | 12 percent, 6 Hz, 0.35 |
| recoil (share of W), turn | 4.5 rising to 8.5 percent, 3.5 degrees | 2.5 rising to 5 percent, 2 degrees | 3 rising to 6.5 percent, 2.5 degrees |
| page | drops 2.5 to 5.3 percent of W on each hit, the molecule is slammed down onto the paper | still; the molecule grows 2.2 percent a step | still; the camera moves |
| shake | gain 1.3, 12 Hz, peak 3 percent of W | gain 0.8, 18 Hz | gain 0.5 |
| throws | 340 ms apart, 240 ms flight, 120 px arc | 200 ms apart, 200 ms flight | 360 ms apart, 260 ms flight, the camera rides each throw in at 1.6 times |
| first reflex waits | 300 ms | 150 ms | 250 ms |
| count | set down on each gain | races toward each new value, faster every 3 steps; freezes in the held breath; jumps the rest on the landing | set down on each gain; holds 260 ms at each flag |
| last step | 600 ms wind-up held 200 ms at full draw, then the slam | 520 ms held breath (drone cut, count frozen), 180 ms swing | 500 ms wind-up held 150 ms, the camera pulls back first; after the hit a second of silence, then the word |
| extra | heavier numerals each step (pen stroke weight 2 to 5) | a pen tally in the margin, one stroke a step, bundled in fives | the molecule as it started drawn small beside the finished one; bells with a small room echo; a swish with each camera move |
| sound | snap weight 1.6 from step 2, low drone | fast bells, snap 0.8, drone up a note every 2 steps, a quiet draw swell from step 8 | snap 1.0, drone from step 6 |

All three keep: no pulsing, no bursts or particles, no glow, no flashes, no pills or banners, no button, no fuse, no spin, nothing drawn inside the molecule's outline, no change of bond lengths.

## How to record

The tools are in `.claude/feel/` of the worktree (not in git). They were copied from `.claude/video/base` and changed: a static server on 8796 (`python -m http.server 8796 --bind 127.0.0.1` from the worktree root), frames and sound posted to a frame server on 8797 (`fsrv.py`, started by `run.sh`), headless Edge with its own profile under `.claude/feel/prof`.

- `vid.html`: the game with feel.js, the recorder (`vh.js`, which steps the page clock by hand, 30 frames a second, and logs every `AA.sfx` call with the page-clock time of the first frame that shows it) and the job loader.
- `j_line.js`: one page of a fixed molecule and line at real pace. Address keys: `smi`, `rack`, `line`, `quota` (`auto`: the overreact flag on the last step; `vol`: volatile on the last step; `first`: stable on the last step; or a number), `feel`. It dry-runs the page to read the yield after every step, places the line, fires, waits for the page to turn, then renders the logged sounds offline through the same sfx code (`AA.sfx._renderTimeline`) and posts the track.
- `recall.sh <short|mid|long> <0..3>` records and encodes one take; `batch.sh "long:1 long:2 ..."` runs takes two at a time; `enc.sh` muxes the frames and the sound (AAC); `compare.py` joins takes with half-second number cards.
- `analyze.py <take>.json` prints the per-step numbers, `sync.py <take>` the offset between the frame of contact and the sound's onset, `levels.py <take>` the level of each sound.

The lines recorded (the spec number is set for the recording so the flags fall on these steps):

- short: `C=CCCC(=O)CCC(=O)CCC(=O)C`, allyl, bh3, pcc; three reagents then 3 steps; stable passed on the last step.
- mid: `C=CCCCC(O)CCCC(=O)CCCC(=O)CCC(O)CCC(=O)CC(=O)CC(=O)CCCC(=O)CCC(O)CCC=CCCC(O)C=O`, pcc, nabh4, bh3; three reagents then 8 steps; volatile passed on the last step.
- long: `C=CCCC(=O)CCCC(=O)CCC(O)CCC(=O)CCC(O)CCC(=O)CCCC(=O)CCCC(=O)CCC(O)CCC(=O)CCC(O)CCC(=O)C`, pcc, hydrate; 12 steps after the second reagent; overreact passed on the last step. 12 was the longest found: a search of 2,300 made-up chains under the hand of five found no line of three reagents followed by more than 12 steps; a third reagent on this molecule finds nothing left to act on, so the long page is fired with two.

## What scheme.html needs (not committed)

Add before the `scheme.js` line, and bump the two edited scripts:

```html
<script src="js/react/feel.js?v=1"></script>
<script src="js/sfx.js?v=22"></script>          (was ?v=21)
<script src="js/react/scheme.js?v=367"></script> (was ?v=366)
```

`.claude/rec.html` needs the same three lines if it is used.

## The hooks in scheme.js

One `attach` line before `size()`, and guarded calls: `FEEL.fire` in `doFire`; `FEEL.throwThen` for each reagent in `fireNext`; `FEEL.pageEnd` where the page would turn; `FEEL.onReact` after `land`; `FEEL.unlock` for when the next thing starts; `FEEL.k` for the step's curve; `FEEL.hit` on the frame of contact; `FEEL.ease` for a reagent's change; `FEEL.frame` once a frame; `FEEL.ink` at the end of `drawInk`; `stepMs` asks `FEEL.stepMs`. While feel plays a page (`fe()`), the old tile, lane gains, step numeral, join bars, yield drawing, word, flag sounds, beat sounds, reward sounds and the beat's freeze are skipped.
