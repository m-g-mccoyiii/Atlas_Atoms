# Overreact: hand-off to a fresh session (written 2026-11-14, evening)

You are taking over as lead on **Overreact**, a roguelike chemistry score-attack game for commercial release on Steam. The owner directs; you run builders (sub-agents), look at what they make, and put every choice to the owner. This page is the whole brief. Read it fully, then `docs/HARNESS.md` (top section: lines A to BG), before doing anything.

## 1. Standing rules (the owner's, verbatim where quoted; they never lapse)

- Repo: `C:\Work\atlas-atoms`, branch **`steam`**. "Never commit to main and never change the deployed site (m-g-mccoyiii.github.io/Atlas_Atoms). All game work goes to steam only."
- "Commit with: git -c user.name="m-g-mccoyiii" -c user.email="m.g.mccoyiii@gmail.com". Do not change git config. Commit and push often." Commit messages end with `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`.
- "Ignore C:\Work\atlas-atoms-damaged, C:\Users\mgmcc\dev\atlas-atoms and the OneDrive copy. They are stale."
- "Everything shipped must be licensed for commercial use. Check licences at the source. Ask before downloading any file." (RDKit is installed as a dev tool only.)
- The owner's email is private: never send it to an outside service.
- No daily challenge, no timers, no login streaks, no paid currency.
- King in Yellow rights: Chambers (1895) and Bierce only, in our own words; never the well-known three-armed Yellow Sign glyph or anything from later writers or games. It is an add-on and LOW priority. Yellow/gold on the page is kept for the sign only.
- `docs/HARNESS.md` holds every owner ruling (A to BG at the top). It wins over everything, including this page. Add each new ruling there (next letter: BH), commit, push.
- Saved notes for you: `C:\Users\mgmcc\.claude\projects\C--Work-atlas-atoms\memory\` (index `MEMORY.md`). Read them; keep them current.

## 2. How to talk to the owner

- Plain words, short, one thing at a time. No jargon, no hype, never parrot their examples back. Use the game's own names (`docs/NAMES.md`).
- Every decision goes to them as multiple choice (`AskUserQuestion`, at most 4 options a question, recommendation first). Design choices get three real options; a suggested mechanic gets a drawn picture and a plain worked example.
- They follow from another device (Remote Control). Send pictures and clips with `SendUserFile`. Full-size mp4s fail to upload: send the 960-wide copy from `.claude/shots/small/`.
- They judge by stills and short clips and will not play until it is polished. A still or 10 to 15 s clip after every single change, with two lines: what changed, what is still wrong.
- LOOK at every picture (and a frame sheet of every clip) before forwarding it, and say honestly what is wrong with it. If you did not look, say so.
- Game text must be terse: "Acid eats. Chew 2 atoms off the molecule. x1.41." No "in a page", no explaining tails, no "pays", no jokes or puns (the owner calls those "AI slop" and "Redditor slop").
- When they ask whether something is still running, CHECK (commits, files) before answering. I failed at this once today.

## 3. How to run the work (the owner's process rulings)

- **One builder at a time.** No recurring check (no cron). Builders message you when a file lands and when they finish.
- **Match the Anthropic model to the job** (Agent tool `model`): creature design and motion judged by eye: Fable (top); rules design, balance, harder code: `opus`; recording takes, simulator runs, manual wording, wiring: `sonnet`; frame sheets, file checks: `haiku`. The owner has not yet seen art from Opus; a trial pass on Opus was offered, not ordered.
- **Creatures one at a time**, stills approved before anything is animated, a verdict before the next creature. Batching wasted about 1.5 million tokens today.
- Builders run out of room after 3 or 4 items (about 300k tokens). Give each ONE narrow job, tell it to read `docs/PAGE_NOTES.md` (latest "Nth builder" section) and search for functions, not read `scheme.js`/`kitart.js` top to bottom, no sub-agents, commit after each saved file. Replace a spent builder with a fresh one and a written brief.
- The account has run out of usage twice (12 and 14 November). A builder cut off mid-run can be resumed with `SendMessage` to its id.
- One writer per file. Look builders own `apps/steam/js/react/scheme.js, feel.js, shot.js, marks.js, kitart.js` and work in a git worktree under `.claude/worktrees/<name>` on their own branch (`git worktree add -q -b <branch> .claude/worktrees/<dir> steam`); they never commit `scheme.html` and never push. Rules builders own `path.js, rules.js, run.js` and the rules docs, work in the main checkout on `steam`, bump only `path.js?v=` and push. `pen.js, sfx.js, music.js, notes_data.js` are not to be edited by look builders.
- When a look builder hands back: `git merge --no-edit <branch>` into `steam`, bump the `?v=` lines it names in `apps/steam/scheme.html`, commit, push.
- Recording: headless Edge only (`--use-angle=swiftshader --enable-unsafe-swiftshader`, `docs/HEADLESS.md`), below-normal priority, one take at a time, every command under `timeout`, kill only by recorded PID (never by name filter: a builder once killed 52 processes that way). ffmpeg: `C:\Users\mgmcc\AppData\Local\Programs\Python\Python312\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe`; small copy: `-vf scale=960:-2 -c:v libx264 -crf 30 -preset veryfast -c:a aac -b:a 192k -movflags +faststart`.
- Outputs go in `C:\Work\atlas-atoms\.claude\shots` (each with a two-line `.txt`), small copies in `shots/small/`.
- There are about 40 old worktrees under `.claude/worktrees` and a folder of stale browser profiles at `.claude\worktrees\page17\.claude\f17\prof` (possibly several GB). Do not delete them without the owner's word; it is theirs to decide.

## 4. The game as it stands

Vanilla JS on a global `AA`, Three.js r128, Canvas 2D ink, Web Audio, no build step. Entry page `apps/steam/scheme.html`. Version lines now: `scheme.js?v=394, kitart.js?v=86, feel.js?v=16, marks.js?v=4, path.js?v=271, rules.js?v=58, run.js?v=32, pen.js?v=5, sfx.js?v=28, music.js?v=7, notes_data.js?v=5, shot.js?v=13`.

- **The screen:** an open two-page lab notebook on a bench under a warm lamp. Right page: the molecule, the yield number, a track with four of our own alchemy marks, a strip of inked marks for the molecule's properties. Left page: goal pictures, round numeral and three tick boxes, three numbered queue places, margin notes. On the bench: reagent cards each with its bottle, a shelf of ten jars (fixed), the run's creature, instruments, a cash tin (gold), a coffee cup (the re-deal), the manual (a ledger).
- **A turn:** a page is three reagents queued; a round is three pages on one molecule; a run is 3, 6 or 9 rounds (bachelor's, master's, doctorate). Reagents act at every place that fits and set off reflexes that chain. Pencil curly arrows before each step. Only OVERREACT gets the big burst.
- **Rules in:** 18 reagents (six at the start), 13 reflexes plus 12 across-the-fold forms, molecules v2, flattened yields, twelve properties ("motifs", each multiplying a step by a rate per level), pass marks per run length, a ladder of unlocks as deeds, nine sigils bought with gold (cap of three, one gold per cleared round, Aqua Permanens lasts two rounds and pays 8), prestige (the sign, three laps), ten creatures with five stages kept across runs, each acting once a round (Brimstone once a run), instruments (two a round). Bare win rate for a careful player about 0.3 in 100 (owner's line: under 2).
- **Sound:** EDM soundtrack ("Chain Reactor") as the one default, effects on the music's clock. Approved.
- **Text:** the manual is reworded in the approved terse pattern. 402 margin notes are written (`notes_data.js`) but NOT wired into the page.
- **The profile is saved** between runs (localStorage) and a run's earnings are shown arriving; a true close-and-reopen has not been proven in a take.
- **Simulator:** `docs/tools_chem/sweep_*.py` on RDKit, 8 workers at below-normal priority; write-ups in `docs/RIG.md` (latest section "nineteenth"), `docs/SWEEP.md`, `docs/HOMUNCULI.md`, `docs/REFERENCE.md`.

## 5. What is being worked on right now: the creatures (homunculi), Water first

History you need, because the owner threw out a day of work:
- Ten creatures were drawn as characters holding props, with jump-and-act animations and part-by-part stage changes, in batches. Owner: "these all look really bad ... only do one at a time. let's start with water ... parts disconnecting during its idle animation ... when each of them runs back, we should see their behinds ... they should be more elemental in nature not objects."
- Water was redone as a **water spirit**: a figure rising from its own pool, ONE skinned mesh (nothing can come apart), five stages each with its own character (newborn droplet peeking over its puddle; child leaning on the puddle's edge; youth with a flung arm and a ribbon of water; poised adult with hair pouring into the pool; towering elder with a splash crown and foam beard). Stills: `.claude/shots/water25-spirit.jpg`.
- In the game it felt like "an animation happening on top of the game rather than a part of it": not standing in the scene, drawn in a different style, nothing reacts to it. Fixed in passes: pool flat on the surface, shadow, the book's edge hides it as it climbs on, a route past the cup (steam bends) and under a card (corner lifts), a real hand, touched atoms stay wet.
- Then: "its art doesn't match everthing else". Shown three styles (`style29-options.jpg`) the owner picked **PEN AND WASH**: black pen outline in the same hand as the page's marks, pale blue watercolour wash with paper showing through, pencil shade: a notebook drawing come alive. Confirmed: "Style is right". **This is the creature style for all ten.**
- Then: "the evolution sucks. It should be more magnificent, like curling up into a swirling sphere and then sprouting." And: "Each homculus should get its own evolution style and world interactions" (nothing shared between creatures).
- Earlier rulings that still hold for every creature: it travels in one unbroken move to the molecule and handles it by hand ("I would prefer if the sprites walked to the molecule and interacted with it"); nothing sprayed from afar; each act its own; alive at rest ("The fog should be moving and animated, same with the rest of these creatures in general"); seen from behind going home; the shelf is one fixed size with all ten jars, some empty.

**State of Water in the code** (all on `steam`): blocks `W24` to `W30` at the end of `kitart.js`, `S26` to `S30` in `scheme.js`. Switches: `AA.rxKit.spiritOn`, `AA.rxKit.belong27`, `AA.rxKit.react28`, `AA.rxKit.wash30` (pen and wash, on by default). Notes: `docs/PAGE_NOTES.md` "Twenty-fourth builder" to "Thirtieth builder". Latest pictures: `wash30-stills.jpg`, `wash30-stages.jpg`, `wash30.mp4`, `wash30-evolve.mp4`.

**Running when this was written:** look builder 31 (Fable), worktree `.claude/worktrees/page24`, branch `page-builder-24`, redoing ONLY Water's evolution as gathering, swirling sphere, sprouting. It was told to save `evolve31-strip.jpg` and one take of `evolve31.mp4`, leave command lines in PAGE_NOTES for recording each of the four stage steps, then stop. It reports to the OLD session. So, first thing: look at `git log page-builder-24`, `.claude/shots/evolve31-*` and PAGE_NOTES "Thirty-first builder". If it has finished and `steam` does not contain its commits, merge and bump as in section 3 (check `scheme.html` first so the versions are not bumped twice). Send the owner what it made. Then have a `sonnet` helper record all four steps back to back (`evolve31-all.mp4`).

**Known Water faults still open** (tell the owner; fix when they say):
- At real game size it is small and pale; the drawing is hard to see in the full view. Likely needs to be larger with stronger line and wash.
- The trip to the molecule and home is a flat sliding puddle; poses at each water are held too briefly; the bulge down the arm and the body's swell are slight; the reaching arm crosses its own pool.
- The face is still old 3D bits in ink colour, not pen strokes; pencil shading too faint at game size; the line jumps where the body moves fast; the blue rings on touched atoms are flat discs.
- On the page it still stands at the bench tilt, not in the paper's plane.
- In the jar it is about 25 px tall and the line breaks up; stage 1 needs checking that it reads when it peeks.
- Red "property lost" scribbles can still pile over the molecule during an act.
- Frame cost has only been timed in software rendering; unknown on a real graphics card.

**After Water is approved:** the next creature, one at a time, in pen and wash: three still directions first, then its own act by hand, its own world reactions, its own evolution. The other nine are still the old prop-based art in the game (Acid, Slime, Salt, Dry ice, Hydrogen, Wood spirit, Seedling, Ammonia, Brimstone). Dry ice was ruled to be made of fog ("foggier", not balls).

## 6. The queue after creatures (owner has seen this list; order is theirs to change)

1. **Rules, on `opus` or `sonnet`:** synergy over averages. Owner: "these combinations of homunculus, sigil, reagent, and play style should allow for people to massively chain stuff together, it can't always be about averages. things can have synergy if the player uncovers it." Picks: Brimstone counts sulfur (a number per sulfur on the molecule; builds with Sulphur's Mask and thiolate); "Try it on three first" (suggested: Acid per atom chewed, Seedling per atom added); judge each by what it does alone AND by the best combination; a found combination may reach about 100 times the number to beat; the bare game and a plain kit stay as they are. Also: Dry ice and Acid stop at x3.20; Sulphur's Mask becomes "An OH closes its ring before any other reflex. The first two count twice."; a creature's rack reagent is kept and shown as a picture on its manual page.
2. **Real compounds:** "it would be cool if we kept track of real compounds people accidentally made." Now: the profile records every distinct molecule made (a small rules-side hook). At the very end: names, the moment, a collection page. The name list needs a source licensed for commercial use: check, and ask before downloading.
3. **Between rounds and around a run:** the sigil shop screen (`P.sigilVisit`, `P.sigilGet`; rules are in, no screen); lost-round and end-of-run screens in the spread; reagent cards vanish at round end; the page turn into the catalog is a cut; tally counter and condenser have no art; prove the saved profile survives a real close and reopen.
4. **The manual:** pictures for the instruments and sigils that have none; the twelve property marks tab; counts as numbers, no bars.
5. **Core-turn faults:** one molecule layout with two atoms a hair under touching; a tangled knot of atoms seen on a large molecule in `hom20-act-3.mp4` (not measured); cages (the arm re-folds between steps, a ring fused onto a cage in play is drawn the old way); heat and overshoot on the track use old ratios; a margin note cut off mid-word; the 13 reaction kinds are hard to hear over the music; the won-run mark is now dark ink in code but unseen in a take.
6. **Life:** wire the plain margin notes into the page; idle life on the bench.
7. **Checks before anyone plays:** no layer has had a full independent review; a whole run start to finish in the real game with everything on; a career replayed in the simulator with the new creature numbers.
8. **Low priority:** King in Yellow add-ons (thread notes, the stain from beneath, the sign's marks); a 12-round postdoc run (built, off, undecided).

## 7. Questions the owner has not answered

- Whether to try creature art on Opus to save tokens (offered).
- Whether the bond snap on breaking is worth keeping; whether the molecule should vibrate when winning (off; it looked bad).
- How fast unlocks are handed over (two a run as built); whether instrument and sigil deeds count only in long runs.
- Whether the old worktrees and the stale profile folder may be deleted.

## 8. First things to do in this session

1. Read `docs/HARNESS.md` (top: A to BG) and the saved notes.
2. Check builder 31's state as in section 5; merge if needed; look at its files; send them to the owner with honest notes.
3. Ask the owner (multiple choice) what happens next with Water. Start nothing they have not chosen.
