# Overreact: what the molecule does by itself

2026-11-11. Three designers, a judge, a model and an artist. NOT yet checked against the full harness and NOT yet seen by the owner. Not built. The model is a small Python program (`docs/tools_self_model.py`), not the game. Pictures: `.claude/shots/self-set-1.png`, `self-set-2.png`, `self-web.png`, `self-chain.png`.

## The judge's twelve

**Convention:** distances are bonds between the two carbons. All twelve are drawn from the three designs; none was invented here. Judging notes: I dropped slip because with it held, any diol slips at once and flip can never fire. I dropped hook (the edit needs two sentences to predict), snip (it looks like dry and strip), and A's seal leaving a C=O (an ester is not a ketone a ring can use). I kept NH2 to one piece. There is no SH reaction in the starting six to feed pair, so it stays late.

**The twelve**

1. **ring.** WHEN: OH 3 or 4 from a C=O. BECOMES: the OH joins that carbon in a ring. LEAVES: a new OH where the C=O was. Sets off: dry, tuck, seal. Set off by: flip, weld, tuck.
2. **dry.** WHEN: OH 2 from a C=O. BECOMES: water comes off, a C=C forms beside the C=O. LEAVES: C=C beside C=O, water (water jar). Sets off: tuck, snap. Set off by: ring, weld.
3. **flip.** WHEN: OH on a carbon of a C=C. BECOMES: that carbon is C=O, the C=C goes single. LEAVES: a C=O. Sets off: ring, weld. Set off by: pop, dehydrate on a diol.
4. **shift.** WHEN: C=C whose near carbon is 2 from a C=O. BECOMES: the C=C slides one carbon toward the C=O. LEAVES: C=C beside C=O. Sets off: tuck. Set off by: snap, knit, dehydrate.
5. **tuck.** WHEN: C=C beside a C=O, and an OH 3 or 4 from the C=C's far carbon. BECOMES: the OH joins that carbon in a ring, the C=C goes single. LEAVES: the C=O. Eats an OH and a C=C. Sets off: ring, weld. Set off by: dry, shift, strip.
6. **weld.** WHEN: a carbon beside one C=O is 4 or 5 from a second C=O. BECOMES: they bond in a ring, the second C=O becomes OH. LEAVES: OH 2 from the first C=O. Spends two C=O. Sets off: dry. Set off by: flip, tuck.
7. **snap.** WHEN: two C=C side by side, a third 4 or 5 from their end. BECOMES: a six-ring. LEAVES: one C=C. Eats three C=C. Sets off: shift. Set off by: dry, strip, knit.
8. **strip.** WHEN: Cl 2 from a C=O. BECOMES: Cl comes off, C=C forms beside the C=O. LEAVES: C=C beside C=O, acid fumes (creature). Sets off: tuck, shift. Set off by: flip, tuck.
9. **knit.** WHEN: NH2 3 or 4 from a C=O. BECOMES: N joins that carbon in a ring, water comes off. LEAVES: a C=C, water. Eats the NH2 and C=O. Sets off: shift, snap. Set off by: flip, tuck, pop.
10. **pop.** WHEN: COOH 2 from a C=O. BECOMES: COOH leaves as carbon dioxide, the C=O turns to OH on a C=C. LEAVES: OH on C=C, carbon dioxide (creature). Eats the COOH. Sets off: flip. Set off by: the player's oxidize.
11. **seal.** WHEN: COOH and OH 3 or 4 apart. BECOMES: they join in a ring, water comes off. LEAVES: a ring, water. Ends a chain and takes an OH that ring or dry wanted. Set off by: ring, weld.
12. **pair.** WHEN: two SH 2 or 3 apart. BECOMES: they join through S to S in a ring, hydrogen comes off. LEAVES: a ring, hydrogen (creature). Ends a chain. Set off by: the player's reactions.

**The web**
- flip, tuck and (via oxidize) pop leave a C=O: ring and weld take it.
- ring and weld leave an OH: dry, tuck and seal take it.
- dry, shift and strip leave a C=C beside a C=O: tuck takes it.
- knit and snap leave a C=C: shift and snap take it.
- pop leaves OH on C=C: flip takes it.
- Loops through three or more kinds: ring, dry, tuck, back to ring. Weld, dry, tuck, ring, back to weld. Snap, shift, tuck, ring, dry, back to snap. Pop, flip, ring, dry, tuck.
- Chains end three ways: out of C=O, out of OH, or on seal or pair.
- Can hurt: dry (eats the OH a ring wanted), tuck, weld, snap, pop, knit.
- Creature food: water (dry, knit, seal), fumes (strip), carbon dioxide (pop), hydrogen (pair).

**Tier 1.** Start with ring and dry. Both use only OH and C=O. Ring leaves the OH dry takes, so a chain shows at once. One OH 2 from one C=O and 3 from another is a first real choice. The first seven run on OH, C=O and C=C alone.

**Unlock order**
1. ring: held.
2. dry: held.
3. tuck: dry 3 times in one run.
4. flip: dehydrate an OH that sits next to another OH.
5. weld: oxidize 2 OH on one page.
6. shift: dehydrate an OH 3 from a C=O.
7. snap: hold 3 C=C on one page.
8. strip: win a round on a molecule holding a Cl.
9. knit: win a round holding an NH2.
10. pop: win a round holding a COOH.
11. seal: close 2 rings on a page holding a COOH.
12. pair: win a round holding two SH.

**Worked chain.** Chain C1 to C13. Start: C1=C2, C6=O, C8=O, OH on C13. Nothing fires yet (no C=O is 2 from an OH, no pair is in weld range). The player fires hydrate, oxidize, hydrate.

1. Hydrate: OH lands on C2. Ring: C2 joins C6 (4 apart), new OH on C6.
2. Dry: that OH is 2 from C8=O. Water comes off, C6=C7 forms. Water goes to the jar.
3. Oxidize: the only free OH is on C13, which becomes C=O. The OH on C2 is inside a ring, so it is safe. Weld: C9 (beside C8) is 4 from C13. They bond in a five-ring, C13 becomes OH.
4. Dry: that OH is 2 from C8=O. Water comes off, C9=C13 forms. (Tuck could also take it, 4 from C6; the closer C=O goes first.)
5. Hydrate: both C=C take OH, on C6 and C9. Dry: the OH on C6 is 2 from C8=O. Water comes off again, C6=C7 returns.

Five steps, three kinds (ring, dry, weld), three waters.

## The model

The model is `self_model.py`, with `run.py` and the results in `out.txt`, all in the scratchpad folder. It uses 300 molecules per stage, with early, middle and late sized 12-16, 19-25 and 29-35 carbons. The player is greedy (best line each page), random, or looks two pages ahead, and a chain is the self-reaction steps in a page. Six reactions give 120 ordered lines of three.

**Tables.** Greedy player, per page. "Kinds" is the share of pages whose chain used 2, 3 or 4 different self-reactions.

| Set (cumulative) | Mean steps E/M/L | 3+ steps, early | 6+ steps, early | 10+ steps, E/M/L | Kinds 2+/3+/4+, early |
|---|---|---|---|---|---|
| ring | 1.4 / 2.4 / 3.1 | 60% | 24% | 1 / 10 / 23 | 0 |
| +dry (tier 1) | 1.9 / 3.1 / 4.1 | 75% | 34% | 2 / 13 / 31 | 31 / 0 / 0 |
| +tuck, +flip | 1.9 / 3.0 / 3.9 | 75% | 33% | 3 / 14 / 30 | 33 / 7 / 1 |
| +weld | 3.8 / 5.8 / 8.3 | 86% | 58% | 30 / 47 / 58 (as 10+ in the table above, read as 3+/24/41 for 10+) | 69 / 31 / 6 |
| +shift | 3.8 / 6.0 / 8.4 | 85% | 58% | same | 68 / 39 / 13 |
| +snap | 3.6 / 5.9 / 8.4 | 76% | 48% | 9 / 27 / 36 | 59 / 38 / 17 |
| +strip through +pair | 3.7 / 6.1 / 8.5 | 76% | 47% | 10 / 28 / 36 | 59 / 39 / 20 |

For "10+ steps, E/M/L", the weld row's correct reading is 3 / 24 / 41. The random player averages 1.4 / 2.5 / 3.7 steps with the full set.

| Rule | Share of steps | Pages it fires on | Ends a chain | Best line without it (page 1) |
|---|---|---|---|---|
| dry | 42% | 75% | 32% | worse in 98% of molecules, by 5.6 steps |
| weld | 24% | 46% | 2% | worse in 98%, by 7.0 steps |
| ring | 13% | 50% | 31% | better in 38%, by 2.7 steps |
| snap | 9.5% | 38% | 17% | worse in 62% |
| shift | 3.6% | 16% | 4% | worse in 27% |
| tuck | 2.9% | 16% | 5% | worse in 10%, better in 4% |
| pair | 1.2% | 7% (33% of molecules with SH) | 3% | worse in 21% |
| flip | 1.0% | 6% | 2% | worse in 5%, better in 1% |
| knit | 0.9% | 6% (25% with NH2) | 1% | worse in 6%, better in 7% |
| seal | 0.8% | 5% (22% with COOH) | 3% | worse in 4%, better in 5% |
| strip | 0.6% | 4% (17% with Cl) | 0% | worse in 7% |
| pop | 0.3% | 2% (7% with COOH) | 0% | worse in 3% |

Mean kinds per page is 2.0 / 2.8 / 3.3 for early, middle and late with the full set.

**Findings**
- **Dead:** pop, flip, strip, knit and seal fire on a few percent of pages. Even on molecules that hold their trigger group they fire on 7 to 25% of pages. Flip is dead for a different reason: it needs a diol dehydrated first. Tuck is near dead (16% of pages, 3% of steps).
- **Swamping:** weld doubles the mean steps at once. At 6+ steps it moves early pages from 34% to 58%, and with pay growing as n squared it would drown everything before it. Dry is the other big share. They need to be priced or held back later, or weld should spend both C=O as the set text says.
- **Loops:** none remain, and the 40-step cap was never hit in about 11,000 greedy and random rounds. My first shift looped, sliding a C=C back and forth between two C=O. I broke it by letting shift run only when the C=C is not already beside a C=O. Keep that rule.
- **Hurt:** ring hurts the best line in 38% of molecules, because it uses the OH that dry or weld wanted. That is a real choice, not a flaw. Knit, seal, tuck and flip are hurt-neutral to slightly harmful.
- **Tier 1 spread:** it holds. On plain early molecules with ring and dry, the totals for three pages are random 135, greedy 604 and look-ahead 1050. Greedy beats random 4.5 times, and look-ahead beats greedy in 82% of molecules by 1.7 times. Ring alone gives a smaller look-ahead gain, 1.27 times.

**Where the model is too crude to trust**
- The molecule generator is mine. Groups sit every 3 to 4 carbons, so absolute steps are too high: the full-set best line on page 1 averages 12.6 steps. Trust only the ordering of rules and the relative jumps, not the levels.
- Changes persist across pages. I did not reopen rings at page end.
- A ring bond counts as one bond for distance. Hydrogen counts are approximate.
- Strip, knit, pop, seal and pair appear only on molecules I seeded with Cl, NH2, COOH or SH at 10 to 35%. Their rates track that choice.
- The set text says weld "spends two C=O", but the worked chain keeps the first. I modeled the worked chain.
- Look-ahead is a pruned search, not a true optimum.

Files are in `C:\Users\mgmcc\AppData\Local\Temp\claude\c2e091f86aaa20cc\4b5d48b3-c4d4-47b4-ad30-ef7d19555645\scratchpad`:
- `self_model.py`
- `run.py`
- `out.txt`

## Pictures

All four PNGs are saved and I looked at each one with Read; no cut-off or overlapping text remains. The drawings match their rules, with the stretches listed below. The "legend" (one color per group) in the set pictures sits at the top of each, and the web picture has its own key.

Paths:
- C:\Work\atlas-atoms\.claude\shots\self-set-1.png (ring, dry, flip, shift, tuck, weld)
- C:\Work\atlas-atoms\.claude\shots\self-set-2.png (snap, strip, knit, pop, seal, pair)
- C:\Work\atlas-atoms\.claude\shots\self-web.png
- C:\Work\atlas-atoms\.claude\shots\self-chain.png

Scripts are in the scratchpad: chemlib.py, selfset.py, selfweb.py, webdraw.py and selfchain.py. The old self-reactions.png was not touched.

What I could not draw cleanly, or had to decide:
- **Snap:** the rule is ambiguous about "4 or 5 from their end". I drew the real intramolecular version: the diene's end carbon is 4 bonds from the third C=C's near carbon. The result is a six-ring fused to a five-ring, with one C=C left.
- **Seal:** I counted the COOH as a ring atom. Drawn that way, 3 apart gives a six-ring rather than the five-ring that ring gives for 3. The ring-count convention differs between the two rules, so check that this is what you want.
- **Pop:** the rule does not say which carbon the new C=C lands on. I put it between the carbon beside the C=O and the old C=O carbon, with the OH on the old C=O carbon.
- **Weld:** the rule says "spends two C=O", but the worked chain keeps the first C=O (C8=O dries later). I drew it that way, so only one C=O is spent.
- **Web edges, from your "Sets off" lists:** I added weld to tuck and weld to seal (the OH bullet and seal's own list). I dropped the arrows that appear only in the "Set off by" lists:
  - weld to ring
  - strip to snap
  - flip and tuck to strip and to knit
  - pop to knit
- **Pop via oxidize:** the web shows only pop to flip. The "pop leaves a C=O via oxidize" route is not drawn.
- **Web layout:** the layout was found by an automatic search. Two arrows still cross near tuck, because ring, tuck and weld feed each other in both directions.
- **Worked chain:** step 5 is split into two panels, hydrate and then dry, so the chain shows seven drawings for five steps. The oxidize state before the weld is not drawn on its own.
