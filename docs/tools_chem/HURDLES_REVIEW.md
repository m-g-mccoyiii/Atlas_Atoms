# Specs: the independent review of the first tested set, 2026-11-11

Verdict: fail, with exact changes. The fix pass works from this.

**FAIL.** The set is real work, but it needs the changes below before the owner sees it. I ran `test_hurdles.py` (9 of 9 pass). I also spot-checked 8 hurdles on 10 molecules each, in rounds 2, 5 and 8, with the greedy points player against the aiming player. I did not run the generator.

**1. "At least" with room above?** Mostly yes, and none is an exact recipe. Three problems:
- **Room of 1.** `kinds_at_once` (84% for the aiming player, room 1) and `elements` (room 1) are close to ceilings. There are only 12 kinds of group, so N = 3 or 4 is nearly the maximum. `kinds_in_turn` and `ring_sizes` are no better (`ring_sizes` has N = 1 and a 94% clear).
- **Free on page zero.** `kinds_at_once` and `left_CO` read the absolute or last value, not the gain. A molecule that starts with 4 kinds clears it before any play. Table mode applies one N to every molecule, so this bites there. In my spot-check the points player already had 3 or 4 kinds in 7 of 10 round-2 molecules.
- **The "restraint" family has no restraint.** `no_dead_reaction`, `acted_total` and `distinct_acted` all reward using more reactions. "Cleared with few different reactions" was built as `variety` and `repeats`, then dropped as DULL. That kind is missing from the set.

**2. Different ways of playing.** The kept set pulls in about seven directions: build rings, grow big, vent gas, stack kinds of group, trigger chains, avoid wasted reactions, and shrink. Several hurdles pull the same way:
- **Rings:** `rings`, `five_rings`, `six_rings`, `ring_atoms`, `fused_pairs`, `fused_block`, `ring_systems`, `ring_hetero`, `by_two_rings`, `kind_ring` and `unsaturation`. That is 11 hurdles for one plan.
- **Size:** `growth` and `size_range` have the same N (19/19/21 against 19/20/22) and the same room. In my run their values were identical in 7 of 10 round-2 molecules. They are twins.
- **Reach:** `longest_chain` and `diameter` are twins. N is 7/7/7 in both, the clear rates are 63/1/4 and 65/5/11, and both are dead from round 5, when the aiming player reaches 0 to 4 in round 5 and 0 to 2 in round 8.
- **Venting:** `off_total`, `by_two_off_total` and `big_puff`.
- **Waste:** `acted_total` and `no_dead_reaction`.

**3. Trust in the testing.**
- **Circular rate.** "60% clears" is true by construction, because N is defined as the value the aiming player reaches 60% of the time.
- **One greedy player.** No human-like player was used, so "clear rate" means "clear rate for a bot that knows the number".
- **Not held out.** The table was fitted and judged on the same molecule pool.
- **Random carried sets.** Rounds 4 to 9 use random pools, not a real run's unlocks.
- **No evaluator.** The memory rule to run one is unmet.
- **Round 1 and 9.** Round 1 sits at 85% only for the aiming player. The points player gets 27 to 38% and the random player 9 to 17%, so a new player with no hints is well below 85%.
- **Compounded win rate.** The aiming player's per-round targets multiply to about 2% for a nine-round run.
- **Overshoot.** Rounds 2 to 5 land 8 to 18 points above target.

**4. Leaning on the owner's examples.** No. The set goes well beyond them, with 7 families and 43 kinds in use. The sulfur-bridge example is correctly not offered, because no game molecule has sulfur. Ring counts are over-represented, as noted in item 2.

**5. Realism.**
- **Chemistry:** fine. The unreachable chemistry was dropped.
- **Size:** `growth` N is 19 to 22 in rounds 1 to 3. The aiming player ends at 25 to 46 atoms above an 11-atom start, which is far larger than the round-9 start of about 31.
- **Dead later:** `longest_chain` and `diameter` are N = 0 in rounds 5 to 9, so they are not real hurdles there.
- **Whole-number granularity:** counts running 0 to 3 cannot be tuned to the targets.

**6. HARNESS A to Y.**
- **S (plain words) fails.** The condition text uses game jargon: "sets off", "driven off", "found something to act on", "steps by itself", "self-reactions", "kinds of group at once", "joined block of rings", "separate groups of rings", "bridgehead", "spiro". The owner has said this at least 17 times.
- **W (difficulty) is not shown.** Nothing tested whether a new player can win rounds 1 to 3.
- **P:** the display was never tested, so I can't say whether the hurdle gives hints.
- **Y** is satisfied. Each hurdle is an "at least" and not an exact recipe, subject to the room problems in item 1.

**7. Fun.**
- **Most fun:**
  - `cut_down` (the only hurdle that pulls against the grain).
  - `left_CO` (keep something while the score wants to burn it; the points player clears 29%).
  - `fused_block` (a visible shape that needs a real decision; 61/44/14).
- **Should go:**
  - `by_two_off_total` (a twin of `off_total`, and 10% of picks).
  - `size_range` (a twin of `growth`).
  - `acted_total` (a twin of `no_dead_reaction`).
  - `ring_sizes` (trivial).
  - `diameter` (a twin of `longest_chain`).

**Exact changes needed**
1. Drop the twins above. Limit any one plan to about 3 kept hurdles, so cut the ring family to `fused_block`, `ring_hetero`, `spiro` and `rings`.
2. Switch `kinds_at_once` and `left_CO` to a gain over the start, or reject the hurdle when the start molecule already clears N. Drop `elements` and `kinds_in_turn`. Cap N so room is at least 2.
3. Add a real restraint hurdle: clear with at most N different reactions, or with fewer than N waste reactions. This must be an "at least" in form, such as "at least N unused reactions in hand".
4. Rewrite every condition in plain words and test it on the page. Replace "driven off" with "gas released" and "steps by itself" with a plain count of the molecule's own changes.
5. Run a held-out molecule pool, and a weaker player that is not told the number. Re-derive the rate targets from that player, so round 1 is winnable by a new player.
6. Cap `growth` at the round's intended size so it stays real chemistry.
7. Run an independent evaluator before showing the owner.

## The artist's report

Four of the five PNGs are drawn and checked with Read. Page 2 of the kinds set was regenerated after its last fix and I did not look at it again. Everything is in `C:\Work\atlas-atoms\.claude\shots`, 1080 wide.

**Files**
- `hurdle-idea.png` (1080x1976): title "A hurdle, not a ceiling". One chain molecule with the hurdle "at least 2 rings of five atoms". Below it are three results (1 ring short, 2 rings just clears, 4 rings far past), each with a ring bar, a hurdle line and a points bar.
- `hurdle-kinds-1.png` (1080x2037): Shape (8) and Chains of steps (4).
- `hurdle-kinds-2.png` (1080x2363): Size (6) and Makeup (7). This is the one I did not re-view after the growth fix.
- `hurdle-kinds-3.png` (1080x2085): Driven off (6), No waste (3) and Early (2).
- `hurdle-rounds.png` (1080x1859): rounds 1 to 9, each with an example hurdle (two hurdles from round 6) and ten squares filled from the generator's measured clear rate in sim mode. The rates are 86, 88, 83, 86, 79, 56, 65, 59 and 48 percent.

**Not drawn or not measured**
- **Illustrative numbers:** the points on the idea page (250, 600, 1500) and the ring counts are made up for the picture, not measured. The N values in the kind cards are examples. Each round sets its own.
- **Round examples:** the examples in `hurdle-rounds.png` are hurdles the table says are good for those rounds. The clear rate shown is the round's overall rate from the generator test, not a per-hurdle measurement. The round 6 to 9 pair values are my own picks, set a little below the single-hurdle numbers.
- **Not covered:** the six hurdles that are good in only one or two rounds are not drawn, only the 36 kept ones. The held-back and rejected ones are not drawn either.
- **Starting values:** the "start 0, now N" notes in the cards are illustrative starting molecules, not data.
- **Simplified drawings:** the chain-of-steps and no-waste cards use letter tiles and "ring", "dry" and "flip" pills in place of real reaction names. Jar contents are tokens: a droplet for water, two circles for hydrogen, red-grey-red for carbon dioxide.
- **Folded chains:** the size-swing and longest-chain cards are plain zigzag chains. The joined-block drawing is small.
- **Size swing changed:** I changed the size-swing example from 12 to 10 atoms so it fits the card. The table's size-range numbers run higher, so the picture shows the idea, not the table's N.
- **Hand-drawn style:** drawn with PIL in the hand style. No RDKit depiction, browser or git was used.

Scripts are in `C:\Users\mgmcc\AppData\Local\Temp\claude\c2e091f86aaa20cc\4b5d48b3-c4d4-47b4-ad30-ef7d19555645\scratchpad`: `hlib.py`, `idea.py`, `kinds.py` and `rounds.py`.
