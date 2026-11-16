# Overreact: the creatures (hand-over to another agent)

Written 2026-11-16. The owner paused all creature work and asked for another AI (Codex) to design and animate the creatures, because the designs and animations made so far "just don't seem to work that well". This is everything that agent needs. Read it first, then `docs/HARNESS.md` (every owner ruling), `docs/CREATURE_RECIPE.md` (the standard, the shared code, recording), `docs/HEADLESS.md`.

## 0. Hard rules (from the owner; they outrank anything here)
- Work on branch `steam`, or a branch cut from it. NEVER commit to `main`, never change the deployed site (m-g-mccoyiii.github.io/Atlas_Atoms).
- Commit with `git -c user.name="m-g-mccoyiii" -c user.email="m.g.mccoyiii@gmail.com"`. Do not change git config. Commit and push often to `steam` (or your branch).
- Everything shipped must be licensed for commercial use; check licences at the source. ASK before downloading any file. Generated art must be owned/usable commercially.
- The owner's email address is private: never put it in a request to an outside service.
- Never edit `apps/steam/scheme.html` except to bump `?v=` numbers on the script tags; never edit `path.js, rules.js, run.js, pen.js, sfx.js, music.js, notes_data.js` for creature work (they hold the rules and the pen); creature work is in `kitart.js` (blocks `Wnn`) and `scheme.js` (blocks `Snn`), add new numbered blocks, avoid editing old ones.
- No yellow or gold on a creature (reserved for the sign). No daily challenge, timers, streaks, paid currency.
- Recording: headless Edge only, one take at a time, every command under `timeout`, kill only by recorded PID (never by name), no polling cron.

## 1. The game, in one paragraph
Overreact is a roguelike chemistry score-attack game for Steam (vanilla JS on global `AA`, Three.js r128 for the creatures and atoms, Canvas 2D for the pen-and-wash ink, no build step; entry `apps/steam/scheme.html`). The player makes molecules on book pages with reagents; leftovers and reactions score points. Ten "homunculi" (creatures) live on the bench as perks: each is fed by something that happens on a page, and when the player taps it, it does a deed that multiplies the yield. Each has five growth stages (the "change of stage" animation plays when it grows) and idles at home on the bench at the top of the screen.

## 2. The roster (ids in `path.js` `HOMS`) and what is decided
Each creature: a spirit figure (a little person made of its substance, with a face, like Water), flat pen-and-wash, firm ink outline, readable on WHITE PAPER and on the brown bench. Zany is welcome; they may break chemistry for the joke ([[homunculi are perks]]).

| id | creature | substance / look today | fed by (rule, do not change) | tap does | status |
| --- | --- | --- | --- | --- | --- |
| `water` | Water | pale blue liquid column on a pool | 3 waters driven off on a page | hydrate: every C=C takes OH (+ multiplier) | APPROVED: figure, act, change of stage (ball on left page) are in the game. |
| `acid` | Acid | green horned imp | molecule 2+ atoms smaller than at page start | multiplies yield, molecule unchanged | act APPROVED ("eats the leavings off the page"); change = own body melts to a slick and rises (merged, rough) |
| `brimstone` | Brimstone | grey smoke body on a glowing coal lump, small blue flames | thiolate lands or cap reflex fires | ends the round, task counts met, yield multiplied | act fixed and merged; change = own smoke body billows and blends (merged, rough, cross-fade overlaps ~8 frames) |
| `h2` | Hydrogen | design A chosen (red balloon person, round "o" mouth, arm nubs, string tail; stage 5 an airship) | 2 hydrogens driven off on a page | multiplies yield, molecule unchanged | NOT in the game. Act chosen: small balloons tie onto the atoms that lost a hydrogen, it pops them one by one, yield steps per pop. Unfinished work on branch `hydrogen-117`. |
| `co2` | Dry ice | white cloud with a cube | keep 3 reagents idle to the last page | multiplier | old work, not redone |
| `slime` | Slime | purple blob | one reagent landed twice on a page | multiplier | old work, not redone |
| `salt` | Salt | crystal cube with legs | open with last page's first reagent | multiplier | old work, not redone |
| `seedling` | Seedling | sprout with leaf and roots | molecule 6+ atoms bigger | multiplier | old work, not redone |
| `ammonia` | Ammonia | blue-green droplet with wisps | aminate lands or a knit reflex fires | page's line fires again | old work, not redone |
| `wood` | Wood spirit | white wooden sitting figure | a reagent that finds nothing | multiplier | weak, no act or change |

Newest decision (2026-11-16, not built anywhere): EVERY creature gets a comic BUTT (rounded rear end in its own substance that wiggles and jiggles with its idle and moves) "to make it funny". Cartoon, tasteful, at all five stages. The owner thought all creatures already had butts; they do not (see the lineup `.claude/shots/small/creatures-lineup-stage3.jpg`).

Stills and clips of everything above are in `.claude/shots` and `.claude/shots/small` (names: `water112-act-phone.mp4`, `acid126-act-phone.mp4`, `acid142-evolve-phone.mp4`, `brimstone118-act-phone.mp4`, `brimstone140-evolve-phone.mp4`, `hydrogen136-ABC.jpg` (the three Hydrogen designs, A chosen), `creatures-lineup-stage3.jpg`, ...). Watch them before designing anything.

## 3. What the owner wants from the animation (their standard, in their words and rulings)
- FLUID: no one-frame jumps or pops; everything eased over real TIME in milliseconds (the game runs at 60 fps; never count frames). "Things jerk around because it's only animated in specific ways": the WHOLE creature is alive ALL the time (an idle layer that never switches off, follow-through and lag on every joint, overlapping actions, anticipation and settle).
- IN THE WORLD: it goes to the molecule and handles it with its OWN BODY; nothing thrown or sprayed from afar. Contact, true shadow and light on page and atoms; it meets the book as an object; leaves marks that fade. Pages, cards, cup and molecule as a whole do not move. Nothing is left on the page or bench afterwards.
- NOT FLAT / NOT SLAPPED ON: "the flame looks like a slapped-on sticker"; "you keep just slapping shit animations on everything". A change of stage is the creature's OWN BODY transforming (it puffs up and deflates, billows, melts and re-forms): never a separate effect object (a ball, a column, a pit, a fire teardrop) with the old and new figures swapped behind it. No frame may show the next stage before the change has earned it ("you can see the next stage for water before the bubble forms").
- NO FLICKER: wash and pen patterns on large flat areas must stay locked to the skin (object space); a measured rejected change flickered 52 times in 160 frames. The jump checker is blind to flicker: use the flicker measure in section 6.
- READABLE: large on a phone (the owner judges every clip on a phone); a pale creature must read on white paper; clear face; never tiny; each of the four changes must differ at a glance; creatures must differ from each other in silhouette and colour.
- CLEAR STORY: the deed must visibly show what the rule does, cause then effect, with nothing appearing from nowhere ("molecules arise out of nowhere and then the creature just adds them?" was rejected); what the line drives off visibly goes somewhere; the creature visibly spends it.
- PLACEMENT: its stand and path are chosen per page, whole figure on the paper and inside the screen, clear of every atom and bond, the short way (not round the edge of the book). A change of stage happens on the EMPTY LEFT PAGE, clear of the molecule and of the page's writing where possible.
- SOUND: every beat has a sound within about 50 ms, audible under the music, no clipping, no dead silence over 1 s during action.
- TEXT: any game text is terse and sounds like a game, not a rule sheet: no "Name verbs." openers, no explaining tails (ruling BA).

## 4. How the current figures are built (so you can decide what to keep)
- All ten creatures are skinned Three.js figures built on Water's rig (skin, joints, face, pen outline); the pen draws a boiling ink outline from the mesh's silhouette; the wash is a shader. See `apps/steam/js/react/kitart.js` (look for `// ==== Wnn BEGIN` markers; Water's is W26..W44, W108..W120; Acid's W55/W104/W121/W126/W139; Brimstone's W73/W95..W101/W109/W118/W133; Hydrogen's W75..W79, W136, W138) and `scheme.js` (`Snn`).
- Shared parts for every creature are `AA.rxKit.stage` (ease, `findStand`, `findPath`, `groundTravel`, `follow`, `lagged`, `idle`, pose hand-overs) and `AA.rxKit.scene` (page/atom positions, `foot`, `obsSeen`, `ink`): blocks `W105`/`S105`, explained in `docs/CREATURE_RECIPE.md` section 4.
- Behaviour switches: every block has an `AA.rxKit.<name>` flag and a URL param (e.g. `?w108=0`) to restore the previous behaviour.

## 5. What has gone wrong so far (be honest about it; do not repeat it)
The previous builders were Claude models writing procedural character animation in JavaScript and judging it from sampled video frames. The owner rejected most of the output: messy drawing, stiff or ugly motion, too much going on, not like Water's, effect objects slapped on, the next stage showing early, flicker, creatures covering the atoms, a hidden swap between old and new figure. What worked: Water's figure and act, once made to the standard above; the "idea first" working order (show the owner ONE take of an idea, get a yes, only then spend time on checks). Time was lost by running long check lists on ideas the owner then rejected.

If you think a different method will serve better (for example concept art first, or modelling and animating the figures in Blender and exporting glTF with skeleton and clips for Three.js to play, keeping the pen-and-wash outline by drawing the silhouette from the playing mesh), say so and show a test on ONE creature; the owner decides. Whatever the method, the result must run in the game as a vanilla-JS page with no build step, with the pen-and-wash look, at 60 fps in a browser.

## 6. How to run, record and check
- Serve the repo root over HTTP (the kits use a tiny `srv.py`); the game is `apps/steam/scheme.html`. Test jobs (`part=rest|act|evo`, `hom=<id>`, `stage=1..5`, `smi=<SMILES>`, `lines=`, `rack=`) are in the recording kits under `.claude/worktrees/*/.claude/r*` (copy a kit, change its ports); `docs/HEADLESS.md` explains the headless recorder; use the graphics card: `EDGEFLAGS="--use-angle=d3d11 --enable-gpu --ignore-gpu-blocklist"` (about six times faster than the default software drawing).
- Phone clips for the owner: a square crop on the action scaled 900x900 (`-c:v libx264 -crf 24 -preset veryfast -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart`), with sound, no caption burned in. Look at 30 to 40 CONSECUTIVE frames of every beat at full size, not samples.
- `python tools/anim_check.py frames/<take> --ffmpeg <ffmpeg> --crop 0,0,1280,720` finds one-frame jumps (the game's own flags: the fire-press jolt, the round end). Flicker: for a crop on the creature take the mean brightness per frame and count sign flips of the frame-to-frame change above 0.15; a steady shot gives almost none.
- Working order: IDEA FIRST. One take, shown to the owner on a phone, a yes, then the full check list (all five stages, several molecules, fired early and late, 30 and 60 fps, sound, real play). The owner answers quickly (yes / no / what is off); do not ask them questions you can answer from this document.

## 7. Suggested first steps for the new agent
1. Watch the clips named in section 2 and read the rulings in `docs/HARNESS.md` (search for creature, homunculus, evolution, animation).
2. Propose, in pictures, ONE creature to start with (the owner will choose; Hydrogen is the one in flight, with design A and the balloon-popping act decided), including its butt.
3. Show an idea take on a phone. Only then build out the rest.
