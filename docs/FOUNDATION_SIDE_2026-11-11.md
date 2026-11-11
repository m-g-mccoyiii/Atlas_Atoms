# Overreact: side work on the foundations, 2026-11-11

Four read-only jobs. None changed the game.

## The bare-game page, reviewed cold

Frames: base-1 is the take-one page; 2 to 7 are one round page at different moments; 8 is the end of the round.

**What a first-time player understands**
- Frame 1: two molecules, two red flags with numbers, a plus and a copper coin under the right one. They would see "pick one, the right one pays more, the left one needs 10,000". The small 1 and 2 are unclear. The words "chain" and "ring" are names with no meaning to them.
- Frame 2: the big 0 is the score. The red flag at 10,000 on the track is the goal. The five reactions on the right are readable as "this to that". Not clear: the three empty ovals with an arrow, "times 2" with the tray icon, "0 times 1", the "C" with a drop at the top right, the drop rows under each reaction, and the faint 20,000/40,000/80,000 flags with beige pills.
- Frames 3 to 7: the number rises and the molecule changes, so cause is partly visible. Not clear: the blue 140 times 1.2, the big 2 and 4 at top right, "ring 2", "ring 3", and the grey +805.
- Frame 8: green 41,015 and "beaten" read at once. The coin count 2 with +2 reads as a reward.

**Every word on screen**
- Names: round 4, chain, ring, sugar (a molecule family), hydrate, oxidize, hydroborate, dehydrate, grow, reduce, Hop, next.
- Tokens: C=C, OH, C=O, +3C, "*O" on atoms.
- Numbers: 10,000, 20,000, 40,000, 80,000, 0, 3,024, 109, 12,925, 41,015, 1 2 3, the big 2 and 4, 140, 390, 540, 720, 1.2, 2.1, 2.6, 16.7, +187, +805, +20, -10,000, +2, 2.
- Sentences: none. "beaten" is the word the owner said is out; the flag words (stable, unstable, volatile, overreact) are not shown.
- Odd: "times" appears three ways, as a word between numbers, after the tray icon, and in "0 times 1". Under the owner's rules, "times" is a multiplication word.

**Overlaps and cut-offs**
- Frame 7: the grey "OH" reaction chip and arrow sit over the top of the molecule, and "Hop row +0.5" floats loose. A page curl at right covers the reactions list edge.
- Frame 7: the strike through the 10,000 label overlaps its digits and the "+20" ghost sits above the flag.
- Frame 6 and 5: +187 sits on top of the molecule's bonds.
- Frame 8: strikes run through all three flag numbers, so they are hard to read. The "beaten" sticker outline is soft.
- A pink diagonal line at top left in every frame. It looks like a stray mark.
- Frame 4: the orange dashes under the molecule are unlabeled.

**Rejected looks**
- The molecule keeps the beige shadow ovals, which look like a grid of blobs. The brief does not list them as rejected, but they read as clutter.
- The three oval slots with a "pill" and an arrow in a grey bar resemble a hard-rectangle slot row. No navy, no serif, no glow, no uppercase mono. The cream page and handwriting hold up.

**Section 5 (the page): fail.** A first-time player cannot explain the slots, "times" lines, the C-and-drop mark, the big 2/4, the drop rows, or the future flags. The words "beaten" and "times" break the owner's rules. Overlaps are in more than 1% of these frames (frames 4, 5, 6, 7, 8).

**Section 4 (spectacle): fail on these frames.** The rings closing show as a count (ring 2, ring 3, big 2, 4) and a floating +number, but the ring itself is not seen forming on the molecule. Frame 8's score jump from 12,925 to 41,015 has no visible cause. I cannot judge speed from stills, and a chain strip was not supplied, so "I would clip this" is not shown.

**Five fixes, most important first**
1. Make the cause of each jump visible on the molecule: light the closing ring and carry a number from it into the score, not a loose +number.
2. Replace the "N times M" line with one drawn formula the player can read once. Remove the extra "times" in the tray line and drop "0 times 1" before the first reaction.
3. Explain or remove the slot row, the C-and-drop mark and the big 2/4. Put the ring count on the ring.
4. Fix the overlaps: chips and "Hop" over the molecule, the strikes on the flag numbers, and the page curl over the reactions. Remove the pink diagonal line.
5. Replace "beaten" with the flag word. Make the take-one page show what 1 and 2 mean, or drop them, and give "chain", "ring" and "sugar" a drawn token in place of the words.

## Sound: what exists and a plan for the foundation

Audit of Overreact sound (scheme.html and js/react/scheme.js). I changed nothing.

**What exists**
- One module, `apps/steam/js/sfx.js`, Web Audio only: oscillators, filtered looped noise, and a noise buffer made in code. There are no audio files anywhere in apps/steam, so licensing does not come up. The code and docs name no sound sources. `LICENSING.md` says everything shipped must be commercially usable.
- `scheme.html` has no mute button. It never starts the music (`startMusic` and `setIntensity` are not called), and no setting turns sound off.

**Sounds and where they fire (scheme.js)**
- feed (paper rustle, 7 noise bursts): screen changes, page turn (778), redraw, unqueue.
- stamp (thump): taking a pick or molecule, and a creature chosen.
- click: tool and helper select.
- bad (low saw): refused action, round lost (764), wasted reaction (961).
- good (rising triple): bank (882, 1012), cascade row (852), finish (853), tool use, creature done.
- lock(i) (triangle ping): queueing a line (869), ring close (826), equipment fired (885), flag marks 2 to 4 (1653).
- chain(i) (square blip): each free cascade step (1051).
- quota (low thump plus chord): the first flag (1653).
- fanfare: round won (763), found reaction (851), shop unlock.
- over plus fuse: the "overreact" callout (727).
- bond: the page lands after a morph (1611, 796).
- squish and drift: creatures.

**Foundation plan**
- Turn: a soft click on each queued reaction, rising a semitone each, then one low wood knock when the line fires. Triangle plus a 30 ms noise tick.
- Rings closing, getting faster: a bell-like sine with a quiet second partial at 2.76 times, one per ring. Pitch climbs a scale step per ring, and the gap shrinks with `stepMs`. The pitch is set by ring count, not by a cap.
- Stable: one soft low bell, a single note.
- Unstable: the same bell, a fifth above, plus a quiet noise swell.
- Volatile: two detuned saws through a rising low-pass, with a short crackle of noise.
- Overreact: a sub drop (sine, 90 down to 38 Hz), a bright noise crash, then a held cluster chord. Make it the loudest sound in the game by far.
- Wasted reaction: a dull muted thud, low-passed noise with a short downward sine slide. No saw buzz.
- Page turn: one paper sweep, a single band-passed noise burst rising from 600 to 3000 Hz over 200 ms.
- Round lost: a slow falling minor third on triangle with the high end filtered away, then silence. No noise.

**What is wrong**
- The four word flags do not have four sounds. The first is `quota`, a big chord. The second to fourth all use `lock(8+k)`, the same ping a step higher. Nothing marks "volatile", and "overreact" fires `over` from the callout rather than from the flag.
- Ring closing and the queue share `lock`. The player cannot tell a ring from a queued reaction, and the pitch caps at step 12.
- `chain(i)` caps at 14 and is a short square blip. The gap speeds up (`stepMs`) but nothing changes in the sound except pitch.
- `bad` is used for refused actions, wasted reactions and a lost round alike. A lost round has no sound of its own.
- `feed` is a 0.5 s rustle used for every screen change, including the page turn. It does not fit a fast game.
- `fanfare` and `good` are overused. `good` fires on bank, finish, tool and creature alike.
- The tone gain is a flat 0.07 across the board. There is no master bus, no limiter and no loudness ladder, so stacked sounds can clip.
- The `AudioContext` is created lazily on the first sound. Chrome blocks it until a gesture, so early sounds are lost silently.
- The `tone` oscillators have no filter and no vibrato, so they sound like generic chip beeps.
- The music exists but nothing in the current game calls it.

## The helper deeds, checked

Every deed below is first shown after tier 1 is won, so it is first seen and done on tier 2. Tier 1 has no helpers. The docs have no measured rate for any deed. The run counts are my estimates from `RIG.md` (mean 3.7 rings a page, 6 or more on 24% of pages, margins over the number in rounds 4 to 6 of about 1.5 to 2.5).

**Judgments**
- **Burner** (10 waters in a run) can be done, but it teaches the wrong thing. It rewards firing dehydrate over and over, which wipes out zip starts. It is done by accident in 1 to 2 runs. Replace it.
- **Magnet** (row of 5 rings) is done by accident in 1 to 2 runs, because the average page already has 3.7. It does not teach spacing. I raised it to 6 rings.
- **Burette** (5 C=C turned into OH on one page) is almost impossible. Few molecules carry 5 C=C, and the deed does not end in a C=O. Replace it.
- **Recycler** (3 waters on one page) is done by accident. It teaches burning OH away, the opposite of what the recycler is for. Replace it.
- **Voodoo doll** is vague. "Two rows" can come free from a mirror. Make it rings closing from both ends of one chain.
- **Methanol** (5 chain ends reduced) is trivial. Reduce is a starter and 5 uses in a run is nothing. Replace it.
- **Ethylene** (5 arms grown) is trivial. Grow is a starter and one use grows an arm on every C=O. Replace it.
- **Cannula** (a round on three reactions only) duplicates the lean kit's deed and teaches nothing about moving a C=O. Replace it.
- **Monkey's paw** stays. Early margins are far over the number. From round 4 the last page decides 28 to 70% of rounds, so it comes up in rounds 4 to 6 of tier 2.

**Final table** (all first seen on tier 2)

| Helper | Deed | Doable on tier 2 | Runs for a middling player | Accident or aim |
|---|---|---|---|---|
| mirror, seed crystal | given when tier 1 is won | yes | 0 | given |
| burner | on one page, dehydrate, then hydrate or hydroborate, then oxidize, and a ring closes. This is the burner and burette path by hand. | yes, needs an OH with a C=O 3 to 4 carbons from its new spot | 4 to 6 | aim |
| magnet | 6 rings on one page | yes, 24% of pages for a good player | 2 to 3 | mostly accident |
| burette | a ring closes on a C=O made on the same page from a C=C (hydrate, then oxidize) | yes, small molecules carry a spare C=C | 3 to 4 | aim |
| recycler | a ring closes on an OH made by hydrate from a C=C that dehydrate made on an earlier page of the round | yes, needs dehydrate and hydrate in hand | 4 to 6 | aim |
| voodoo doll | rings close from both ends of one chain on one page | yes, hydroborate or hydrate can put an OH at each end | 4 to 6 | aim |
| methanol | a zip of 3 rings or more that starts from an OH reduce made at a chain end | yes, only molecules with a C=O at a chain end | 3 to 5 | aim |
| ethylene | a ring closes on an OH made from an arm that grow added, on the same page | yes, from round 3 when grow is dealt | 4 to 6 | aim |
| cannula | a ring closes that needed a C=O the molecule did not have at the start of the round | yes, via a gap fix | 3 to 5 | aim |
| monkey's paw | beat a round on the last page from under half the number | yes, rounds 4 to 6 | 3 to 5 | accident, then aimed |

**Open items**
- **Unchecked deeds.** The six replacement deeds that rely on a specific order of reactions are untested. Run `screen` to confirm each can happen on the molecules rounds 1 to 6 deal before building any of them.
- **When progress counts.** Deed progress should count from the first run, even though the shelf shows only after tier 1 is won. Otherwise a player who has done a deed gets no credit for it.
- **Order of deeds.** The shelf shows one outline at a time, so put the accident deeds first (magnet, paw) and the aimed ones after.

## The foundation test on everything above layer 4

All ten creatures, four of the five reads in HELPERS_NEXT's "Hold" and "Drop" rows aside, are judged from the docs alone. I ran nothing and checked none of the numbers.

**Creatures** (feeding needs a reaction in the line, so I count a creature only if tapping also changes a choice)
1. Water: which page to flood, and dehydrate in the line.
2. Hydrogen: oxidize in the line, and which molecule has a stretch too long.
3. Carbon dioxide: which page to freeze, and grow then oxidize.
4. Acid: which molecule (long stretches), and hydrate or dehydrate.
5. Wood spirit: plain bonus. It replaces the choice of order with chance, and a reading player never taps it.
6. Salt: which molecule (OH round one C=O). Nearly a plain bonus at 1.01.
7. Slime: hydroborate in the line, and which two carbons.
8. Ammonia: which line, since it fires twice, and which molecule (NH2).
9. Seedling: which page. It works on any carbon, so it is close to a plain bonus.
10. Brimstone: which molecule (SH).

**Helpers in PIECES.md**
- Mirror: which molecule and which page, because of the size limit.
- Seed crystal: order, since it gives a second start.
- Magnet: which molecule (gaps).
- Burette: which reactions, since it frees two slots. Alone it is 1.04.
- Burner: fails alone (1.00, dead). It only pairs with the burette.
- Carousel, dropper, timer: plain bonus.

**The eight to build**
- Burette, new rule: which end, and which reactions.
- Magnet, new rule: which first group, and which molecule.
- Voodoo doll: which group, giving a second start.
- Recycler: dehydrate becomes an OH source, so it changes the reactions chosen.
- Monkey's paw: acts as a fourth reaction, and the carbon is chosen.
- Cannula: which two carbons, to fix a gap.
- Methanol: which ends. It is too strong.
- Ethylene: hydrate first.

**Kits**
- Plain: the baseline.
- Lean: which three reactions, with four held.
- Long: which molecule, one size up.
- Gap: the first-page reaction is always a repair.
- Phenol: reduce is swapped for a chunk.
- Anchor: which line goes first.
- Reverse: the order runs backward.

**Fail the test**
- Wood spirit.
- Burner alone.
- Carousel, dropper and timer.
- Salt and seedling are borderline.

**Pairs that change the same decision the same way**
- Many starts: mirror, voodoo doll, seed crystal, methanol and monkey's paw.
- Crossing a long stretch: magnet (both rules), cannula, slime and acid.
- Hydrogen and acid: both restart rings that stop at a stretch too long.
- Ammonia and the anchor kit: both fire the line again.
- Seedling and brimstone: both write a run of groups at a tapped carbon.
- Long and phenol: both swap reduce for a larger reaction.

**Gaps worth designing for**
- Nothing acts on the choice of the two molecules. Only the NH2 and SH offer rule touches it. A coin buys a redraw, but no helper or creature changes how the pair is read.
- Nothing acts on which reactions the pool keeps. The pick of one from three, with eight slots, is touched only by kits.
- Order is touched only by seed crystal, anchor and reverse. Nothing rewards a deliberate order of the three beyond "do not oxidize first".
- Page 2 and 3 pay a quarter for rings that only close again. Only water and carbon dioxide help beat that rule. Nothing lets a player build toward a longer row across pages, such as carrying the most row forward or setting up page 3 on page 1.
- Tier 1 has none of this. The six starting reactions have no choice of order to teach.
