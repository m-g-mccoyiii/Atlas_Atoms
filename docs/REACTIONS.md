# Overreact: the reactions the player fires

2026-11-11. Everything after the six starting reactions redone from nothing: three designers, a judge, a model, a chemistry and harness check, an artist. On paper only. Not built. The model is a small Python program (`docs/tools_pool_model.py`), not the game. Pictures: `.claude/shots/pool-*.png`.

## The judge's pool and rules

**Overreact: the pool after the six, as judged (paper only: nothing built, nothing measured, every line below worked by hand)**

**Judge's notes.**
- The six stay exactly as built, and oxidize keeps its end cut. Splitting oxidize, as Design A did, changes a built, measured piece.
- Ozonolysis therefore cuts only a C=C with carbons on both sides, and a ring C=C. A chain-end C=C stays oxidize's.
- Rejected:
  - Extend, chain on, add phenol and bridge each grew one chain end, and bridge ate C=C.
  - Aldol and Robinson repeat weld. Diels-Alder repeats snap.
  - Michael only works after a dry. Metathesis eats C=C and feeds a helper's gas to a creature.
  - Wacker is hydrate then oxidize. Grignard is grow without its arm.
  - Hydrohalogenation, Friedel-Crafts and Clemmensen each leave what another reaction already leaves, or nothing usable.

**1. THE POOL**

1 hydrate, 2 hydroborate, 3 dehydrate, 4 oxidize, 5 reduce and 6 grow (allylation) are unchanged.

Each entry reads: name (reagent), size. Change. Leaves. Off. With. Spoils.

7. Wittig (ylide), small. Every C=O becomes C=C with a new =CH2 end. Leaves C=C. Off none. With hydroborate, hydrogenation. Spoils ring, weld, reduce.
8. Dihydroxylation (osmium tetroxide), small. Every C=C becomes an OH on each of its two carbons. Leaves two OH side by side. Off none. With oxidize, dehydrate. Spoils hydrate.
9. Ozonolysis (ozone, zinc), small. Every inner or ring C=C is cut and each cut carbon becomes C=O. A chain loses its shorter piece and a ring opens. Leaves C=O at each cut. Off none. With reduce, Jones. Spoils snap.
10. Jones oxidation (chromic acid), small. Every chain-end C=O becomes COOH. Leaves an acid end. Off none. With decarboxylation. Spoils reduce.
11. Reductive amination (ammonia, hydride), small. Every C=O becomes NH2. Leaves NH2. Off water. With Hofmann. Spoils ring, weld.
12. Thiol-ene addition (hydrogen sulfide, light), small. Every C=C becomes SH on its end carbon. Leaves SH. Off none. With Raney nickel. Spoils hydrate, hydroborate.
13. Chlorination (thionyl chloride), small. Every OH becomes Cl. Leaves Cl. Off acid fumes. With Williamson, Suzuki. Spoils oxidize, ring, dry.
14. Williamson ether (base), join. A Cl and an OH 3 to 5 carbons apart close one ring through O. Leaves a ring. Off acid fumes. With chlorination, hydrate. Spoils Suzuki.
15. Suzuki coupling (hydroxyphenyl boronic acid, palladium), chunk. Every Cl becomes a benzene ring with an OH beside the join. Leaves that ring OH. Off none. With chlorination. Spoils Williamson.
16. Hofmann elimination (methyl iodide, silver oxide), small. Every NH2 becomes C=C toward the neighbor with MORE H (dehydrate goes to fewer). Leaves a C=C at the chain end. Off ammonia. With amination, oxidize. Spoils link.
17. Desulfurization (Raney nickel), small. Every SH becomes a plain C-H. Leaves a plain carbon. Off sulfur. With thiol-ene. Spoils disulfide.
18. Decarboxylation (heat), small. Every COOH loses its carbon, leaving C-H. Leaves a chain one carbon shorter. Off carbon dioxide. With Jones. Spoils link.
19. Hydrogenation (hydrogen, palladium), small. Every C=C becomes a single bond. Leaves plain carbons. Off none. With Wittig, thiol-ene. Spoils snap, hydrate.

Every group has a source. OH, C=O and C=C come from molecules. NH2 comes from 11, SH from 12, Cl from 13, COOH from 10 and the benzene ring from 15.

Every jar has a feeder:
- Water: 3, 11.
- Hydrogen: 4.
- Carbon dioxide: 4 (chain-end C=C) and 18.
- Acid fumes: 13, 14.
- Ammonia: 16.
- Sulfur: 17.

**2. FAMILIES AND BUILDS**

Families:
- Move OH and C=O: 1 to 6.
- Acid: 10, 18.
- Nitrogen: 11, 16.
- Sulfur: 12, 17.
- Halide: 13, 14, 15.
- Reshape C=C: 7, 8, 9, 19.

Builds:
- **Ladder:** hydroborate, oxidize, Jones, decarboxylation. It makes an acid end and trims one carbon each turn, so spacing shifts into ring range. Wins on the hydrogen and carbon dioxide jars.
- **Drip:** dihydroxylation, dehydrate, hydrate, amination. Wins by flooding the water jar.
- **Fumes:** chlorination, hydrate, Williamson, Suzuki. Wins on acid fumes and heavy molecules.
- **Amide:** amination, Jones, Hofmann, oxidize. Wins on link and the ammonia creature.
- **Splice:** ozonolysis, Wittig, hydrogenation, hydroborate. It opens rings and rebuilds ends. Wins on weld and snap.
- **Brimstone:** thiol-ene, Raney nickel, dehydrate, hydrate. Dehydrate keeps making the C=C that thiol-ene needs. Wins on the sulfur jar.

**3. THE DEAL (which five you are handed)**

Each carried reaction (at most eight) holds 2 tickets. Five are drawn one at a time and none is put back.
- A reaction left out of last turn's five holds 3.
- A reaction with no uses left holds 0.
- Carrying five or fewer hands out all of them.
- No odds are shown.

How the player bends it:
- **Copy** (pick of one from three): the second copy takes a slot and holds 4 tickets.
- **Carry fewer:** putting one back raises the others' share.
- **Hold** (coins: free once a round, then 1): keep one dealt reaction, and it comes first next turn.
- **Swap** (coins, 1): send one of the five back and draw another.
- **Cannula** (helper): a reaction the player names joins the five. This rule is proposed.
- **Lean kit:** four carried with five uses each, so the same four come up again.
- **Molecule pair:** a molecule with no C=O turns Wittig, amination and Jones into dead cards. The harder molecule pays the coins for swaps.
- **Burner** (helper, every OH becomes C=C) and **salt** (creature, cures a C=O) change the molecule, not the draw.

**4. THE WEB**

1. hydrate: leaves OH, used by oxidize, dehydrate, chlorination; set off: ring, dry.
2. hydroborate: leaves OH at the chain end, used by oxidize, chlorination; set off: ring.
3. dehydrate: leaves C=C, used by hydrate, thiol-ene, dihydroxylation; set off: snap, flip.
4. oxidize: leaves C=O, used by Jones, amination, Wittig, reduce; set off: ring, weld.
5. reduce: leaves chain-end OH, used by oxidize, chlorination; set off: ring, dry.
6. grow: leaves OH with a C=C arm, used by thiol-ene, oxidize; set off: snap, ring.
7. Wittig: leaves C=C, used by hydroborate, thiol-ene, hydrogenation; set off: snap.
8. dihydroxylation: leaves two OH, used by oxidize, dehydrate, chlorination; set off: flip.
9. ozonolysis: leaves C=O at each cut, used by reduce, Jones, amination; set off: ring, weld.
10. Jones: leaves COOH, used by decarboxylation; set off: link.
11. amination: leaves NH2, used by Hofmann; set off: link.
12. thiol-ene: leaves SH, used by Raney nickel; set off: disulfide (proposed: two SH join, hydrogen off).
13. chlorination: leaves Cl, used by Williamson, Suzuki; set off: none.
14. Williamson: leaves a ring, used by none (it pays a ring); set off: none.
15. Suzuki: leaves a ring OH, used by none; set off: ring.
16. Hofmann: leaves a chain-end C=C, used by hydroborate, oxidize; set off: snap.
17. Raney nickel: leaves a plain carbon, used by thiol-ene again; set off: none.
18. decarboxylation: leaves a chain one shorter, used by dry and ring through the shift; set off: ring, weld.
19. hydrogenation: leaves plain bonds, used by hydroborate (it guards a C=C); set off: none.

**5. GAINING THEM**

Each is unlocked for good by one deed, then offered in the pick of one from three. The counts are guesses and unchecked on the rig. The order of arrival is three groups.

First, doable with the six:
- Dihydroxylation: two OH on neighboring carbons at once.
- Wittig: reduce then dehydrate in one line.
- Hydrogenation: end a page with no C=C on a molecule that began with three.
- Ozonolysis: end a round 3 atoms smaller than dealt.
- Jones: make 3 chain-end C=O on one page.

Second:
- Amination: 6 waters off in one run.
- Chlorination: 4 OH on the molecule at once.
- Decarboxylation: 3 COOH made in one run.
- Thiol-ene: hydrate and hydroborate each fired 3 times in one run.

Third:
- Hofmann: 3 NH2 made in one run.
- Williamson: a Cl and an OH 3 to 5 apart at the end of a page.
- Suzuki: a Cl on the molecule at the end of a round.
- Raney nickel: 2 SH on the molecule at once.

**6. TEN LINES OF THREE**

1. But-1-ene. Dihydroxylation puts OH on both C=C carbons. Oxidize turns both OH to C=O, 2 hydrogens off. Amination turns both C=O to NH2, 2 waters off.
2. Pent-4-en-1-amine (an NH2 molecule). Hydroborate puts OH on the end carbon. Oxidize makes it C=O, hydrogen off. Jones makes it COOH. Link closes a six-ring with the NH2, water off.
3. Hex-5-en-1-ol. Chlorination turns the OH to Cl, fumes off. Hydrate puts OH on carbon 5. Williamson closes a six-ring through O, fumes off. Hydrate first would lose its OH to chlorination.
4. Cyclohexene. Ozonolysis opens it to a six-carbon chain with C=O at both ends. Jones makes both ends COOH. Decarboxylation drops both as 2 carbon dioxide, leaving butane.
5. Pentan-2-one. Amination turns C=O to NH2, water off. Hofmann turns NH2 to C=C toward the methyl, ammonia off. Hydroborate puts OH on the end carbon. The C=O has moved to a chain-end alcohol.
6. Propanone. Grow makes (CH3)2C(OH) with an allyl arm. Oxidize skips the OH (no H) and cuts the arm end off as carbon dioxide, leaving C=O. Dry fires: water off, C=C beside C=O. Jones makes the C=O a COOH.
7. Propanone. Wittig makes isobutene. Hydroborate puts OH on the CH2 end. Oxidize makes it C=O, hydrogen off.
8. Pent-4-en-2-ol. Thiol-ene puts SH on the end carbon. Dehydrate makes a C=C toward the neighbor with fewer H, water off. Raney nickel removes the SH, sulfur off.
9. Hydroxyacetone. Chlorination turns OH to Cl, fumes off. Suzuki puts a hydroxyphenyl ring on it. Ring closes the ring OH onto the C=O. Oxidize then skips that OH (no H).
10. Hex-5-en-2-one. Hydrogenation makes the C=C single. Wittig turns C=O to C=C with a =CH2 end. Hydroborate puts OH on the =CH2 end only, since the first C=C is gone.

**7. WHAT THE OTHER ELEMENTS MUST CHANGE**

- **Helpers:** burette (C=C to OH), methanol (reduce) and ethylene (grow) each copy a reaction. Re-judge each so it does a physical thing no reaction does.
- **Creatures:**
  - Ammonia is now fed by Hofmann, not by oxidize on NH2.
  - Brimstone is fed by Raney nickel.
  - Carbon dioxide gains decarboxylation as a second feeder.
  - Acid is fed by chlorination and Williamson.
  - Seedling stays fed by grow.
- **Kits:**
  - Add a halide kit: chlorination and Williamson in place of reduce and hydroborate.
  - Lean and anchor stay as they are.
- **Molecules:**
  - Screen all 73 against the full pool of 19, and add molecules with a ring C=C and a chain-end C=C.
  - One molecule of each pair carries NH2 or SH while a creature needs it.
  - Rounds that deal no C=O molecule are rare.

## The model

The model says the pool after the six is mostly dead weight. Of the 13 added reactions, only dihydroxylation reliably helps a line, and ozonolysis helps only when weld and snap exist. The other 11 almost never change what the best line is. I measured this on the 19-reaction model plus the self-reactions ring, flip, dry and link. Nothing here has been seen in the real game.

**Why most of them are dead.** Only self-reaction steps score. The self-reactions I could use all act on OH, C=O and C=C. Reactions that make NH2, SH, Cl, COOH or a benzene ring leave nothing for them, unless a partner group happens to sit 3 or 4 carbons away.

**1. Each reaction alone** (600 molecules, 3 pages each, X handed in place of one of the six; six alone averages 2,246 per round)

| Reaction | In best line when handed | Best line worse without it | Round total change |
|---|---|---|---|
| dihydroxylation | 79% | 58% | +33% |
| ozonolysis | 47% | 22% | -40% |
| Wittig | 29% | 1% | -44% |
| Jones | 34% | 1% | -44% |
| thiol-ene | 29% | 0% | -44% |
| Hofmann | 34% | 3% | -42% |
| amination, chlorination, Williamson, Suzuki, Raney nickel, decarboxylation, hydrogenation | 26 to 34% | 0% | -42 to -45% |

- A reaction that adds nothing costs a slot and drops the round total by about 44%.
- The 26 to 34% "in best line" figures are filler. Many lines tie, and the pick among them is random.
- None is never chosen, but 10 of the 13 are never needed. Dihydroxylation is the one chosen almost always.
- With weld, snap, tuck and shift added, ozonolysis rises to 86% in the best line and +75% on the round total. The verdict on ozonolysis depends on which self-reactions exist.

**2. Run variety** (60 runs, 40 pages each)

| Carried | Different best threes | Share of top three | Two runs differ | Pages with no step | New reaction needed |
|---|---|---|---|---|---|
| six plus two | 242 (20 use only the six) | 12.5% | 76% | 2% | 9% of pages |
| any eight of 19 | 640 | 2% | 98% | 13 to 16% | not measured |

- The variety in the six-plus-two runs is mostly filler ties.
- A random eight scores about one fifth of the six (491 against 2,338 per round). The six still carry the game.

**3. The judge's builds** (300 molecules, 3 pages; the Williamson ring counted as a step, which moved Fumes by about 30% at most)

| Carried | Round total | Mean chain |
|---|---|---|
| random eight | 491 | 1.02 |
| six | 2,338 | 2.90 |
| Drip plus 4 random | 1,022 | 1.61 |
| Ladder plus 4 random | 628 | 1.19 |
| Brimstone plus 4 random | 497 | 1.04 |
| Fumes plus 4 random | 442 | 1.04 |
| Amide plus 4 random | 464 | 0.94 |
| Splice plus 4 random | 440 | 0.90 |

- Only Drip beats a random eight clearly.
- Planning one page ahead raises Drip by 69% and every other build by 0 to 4%.

**4. The ten lines.** In the model every line does exactly the change claimed, step by step. Hydrate before chlorination wastes Williamson, as the line says. Only lines 2 (link), 6 (dry) and 9 (ring) set off a self-reaction. The other seven pay nothing from the page.

**5. What each reaction sets off.** Ring takes 70 to 85% of the steps from hydrate, hydroborate, dihydroxylation, ozonolysis, reduce, thiol-ene and hydrogenation. Dry takes most of the rest. Flip comes almost only from dehydrate and Wittig. Link comes only from Jones and amination, and only if the molecule already has NH2. Chlorination, Williamson, Hofmann and decarboxylation set off nothing.

**Cut:** Raney nickel, decarboxylation and Williamson. They were needed in 0 to 4% of pages under all four self-reaction sets, and they set off at most 0.02 steps per use. That leaves 16.

**Change** (Hofmann, amination, Suzuki and the rest need the same fix; none of these changes is tested):
- **Thiol-ene** lives only if SH-SH joining exists. Needed in 31 to 40% of pages with it, 0% without.
- **Chlorination, Jones and amination** each need a self-reaction partner that fires from one group already on every molecule. I added strip, knit and seal. That raised them only to 8%, 12% and 5% needed.
- **Hydrogenation** should become a scored finishing move. As is, it undoes a C=C and is needed in 3 to 16% of pages.
- **Dihydroxylation** will dominate until others come alive.

**Too crude to trust:**
- Only self steps score. Jars, creatures and coins are not modeled.
- The molecule generator is mine; NH2 appears on 15% of molecules and SH on 10%.
- The player is greedy for one page, with one page of lookahead in the build test.
- Ring distances are approximate.
- The jar wins claimed for the builds are unmeasured.

Files are in `C:\Users\mgmcc\AppData\Local\Temp\claude\c2e091f86aaa20cc\4b5d48b3-c4d4-47b4-ad30-ef7d19555645\scratchpad`:
- `pool_model.py`
- `meas.py`
- `lines10.py`
- `look.py`
- `extra.py`

## Chemistry and harness check

**HARNESS CHECK (lines that apply)**

- 3 PASS. "Carrying five or fewer hands out all of them", "at most eight", and the pool reaches 19.
- 4, 5 FAIL. Section 7 gives helpers, creatures and kits only "re-judge" and "must change" notes. There is no unlock deed, cost or "made from" for any helper or creature. Self-reactions (link, weld, snap, flip, dry) are never listed as a set with their own unlocks. "Disulfide (proposed)" is the only new one.
- 6 PASS for the deal ("Five are drawn one at a time").
- 7 FAIL. Sizes are covered ("small", "join", "chunk"). Heavier compounds and real compounds to make are missing.
- 9 FAIL on 14. "A Cl and an OH 3 to 5 carbons apart close one ring" does not apply everywhere it fits. Entry 12 has the same problem: "SH on its end carbon" has no meaning for an inner or ring C=C.
- 10 FAIL. Entries 7 and 3 both leave "C=C". Entry 16 leaves a "chain-end C=C", which is also what 7 leaves with its =CH2 end. Entries 17 and 19 both "Leaves plain carbons". Entries 9 and 4 both leave C=O. Entry 10 (Jones) overlaps with 4 (oxidize), since real chromic acid already takes an alcohol straight to the acid.
- 11 FAIL.
  - Cannula: "a reaction the player names joins the five" is a pulled reaction dressed as a helper.
  - Burner: "every OH becomes C=C" is dehydrate.
  - Burette, methanol and ethylene "each copy a reaction", which the design itself admits.
- 13 FAIL. The ammonia creature is "fed by Hofmann", which is a third-group unlock. A run without it cannot fill the jar, so the creature is wasted. The same applies to Brimstone through Raney nickel.
- 14 PASS (hold is free once a round).
- 15 FAIL. Nothing says how the nineteen are held back by stage. Section 5's three groups are a start but are not tied to rounds.
- 16 PASS. "No odds are shown." The web section must stay internal and never be shown to the player.
- 22 PASS. No multiplication signs, middle dots or em dashes, and the spelling is American.
- 24 FAIL. See the word list below.
- 26 PASS.
- 30 PASS. It says "paper only".
- 2 PARTIAL. There is variety in the deal. But the six named builds with "Wins on..." are fixed recipes, and the owner wants odds and interactions bent, not solved lines.
- 1, 8, 12, 17–21, 23, 25, 27–29, 31–33: not applicable to a paper pool.

**CHEMISTRY ERRORS**

1. Decarboxylation (heat), entry 18 and line 4: heat alone does not strip CO2 from a plain acid. Adipic acid on heating gives cyclopentanone, not butane. Fix: soda lime (sodium hydroxide and calcium oxide) with heat, or Hunsdiecker. Heat alone works only on acids with a C=O or second acid one carbon over.
2. Hofmann (16): what comes off is trimethylamine and water, not ammonia. It needs exhaustive methylation first. "Leaves a C=C at the chain end" is true only when the NH2 sits next to a CH3. The ammonia jar feeder is therefore wrong.
3. Suzuki (15): alkyl chlorides are poor Suzuki partners because of beta-hydride loss. It needs an aryl or vinyl halide. "Hydroxyphenyl" must read 2-hydroxyphenyl. Line 9's "no H" on a phenol OH is the wrong reason: a phenol has no carbon-H on that carbon.
4. Raney nickel (17): it also saturates C=C, so line 8's alkene would be lost, and the step duplicates hydrogenation.
5. Dihydroxylation line 1: vicinal diols oxidize to cleavage products. A 1,2-dione with ammonia gives imidazoles, not a 1,2-diamine. The "Drip" build's "dehydrate" on a diol gives a carbonyl (pinacol type), not a C=C.
6. Thiol-ene (12): the real reaction adds a thiol, RSH. H2S radical addition over-reacts to sulfides. It also needs anti-Markovnikov wording.
7. Ozonolysis (9): real ozone cuts chain-end C=C too. That is a game rule, not chemistry, and it should be said as one.
8. Chlorination (13): "every OH" would turn COOH into an acyl chloride, and phenol OH does not react. Tertiary OH tends to eliminate instead.
9. Williamson (14): "3 to 5 apart" gives rings from 6 to 8, and eight-membered rings do not form. Say 4 to 6 carbons apart (rings of 5 to 7).
10. Line 2: free amines are attacked by chromic acid. Protect the amine or accept it.

Correct as stated: Wittig and isobutene; ozonolysis of cyclohexene to hexanedial; Jones to adipic acid; Zaitsev for dehydrate; hydroborate placement; the six-ring lactam in line 2; the six-ring ether in line 3; the benzofuran ring in line 9.

**WORDS A PLAYER OR THE OWNER WOULD NOT KNOW**

- Ylide: "phosphorus reagent".
- Hydride: "sodium borohydride".
- Cannula: "pipette". It should not exist as a helper in any case.
- Tickets, drawn, deal, hand out: "chances", "picked", "the five you get".
- Feeder: "what fills the jar".
- Spoils, Set off: "breaks", "starts".
- Web, Families, Builds: "how they link", "groups", "sets of reactions".
- Chain-end: "end of the chain".
- Chunk and Join: "adds a big piece" and "joins two ends".
- Link, weld, snap, flip, dry: each needs one plain sentence saying what it does to the molecule.
- Kit, Lean kit, anchor: "starting set".
- Brimstone: "sulfur".
- Burette: "measuring tube".
- Rig: "test run".
- Design A, Judge's notes: remove.
- Page: "turn".

**Verdict:** the chemistry in entries 15, 16, 18 and 17 must be fixed before this goes to the owner. The helpers and creatures section and the self-reaction set are the main gaps in the design itself.

## Pictures

Five PNGs are in `C:\Work\atlas-atoms\.claude\shots\`, all 1080 wide, and I looked at each after saving.

- `pool-1.png` has reactions 1 to 6, redrawn in the same style as `six-reactions.png`.
- `pool-2.png` has reactions 7 to 12.
- `pool-3.png` has reactions 13 to 19.
- `pool-builds.png` has the six builds, each as a row of numbered chips with its reactions and one plain line on how it wins.
- `pool-line.png` has line 6 step by step: propanone, then grow, oxidize, dry (the self-reaction), Jones. The molecule is redrawn after each change, with carbon counts and the carbon dioxide and water drawn off to the side. I picked line 6 because it has the dry self-reaction, the oxidize end cut and the OH-skipped-for-no-H case.

The script is `C:\Users\mgmcc\AppData\Local\Temp\claude\c2e091f86aaa20cc\4b5d48b3-c4d4-47b4-ad30-ef7d19555645\scratchpad\pool.py`.

Where I went beyond the pool text, or could not draw it exactly:
- **Oxidize (row 4):** I added a second drawing for the chain-end C=C cut off as carbon dioxide, because the judge's note and line 6 both rely on it.
- **Ozonolysis (row 9):** The pool says "Off none", but a chain loses its shorter piece. I drew that piece beside the result and labelled it "shorter piece". The ring case is drawn as a second example, cyclohexene opening to a six-carbon chain with C=O at both ends.
- **Williamson (row 14):** I read "3 to 5 carbons apart" as bond distance, so Cl on carbon 1 and OH on carbon 5 gives the six-ring in line 3. The pool text does not say this outright.
- **Suzuki (row 15):** The Cl simply disappears and nothing is drawn beside the result, since the pool says "Off none".
- **Colors:** Ring O has no color in your list, so I added a coral one. Br brown is left out of the legend because nothing in the pool uses Br.
- **Layout and wording:** Row 3 now shows water off and row 4 shows hydrogen off, which the earlier six picture did not. Reagents sit in small grey text beside each name. Raney nickel carries "desulfurization" as its small text.
- **Tight spots:** The Suzuki benzene ring is small, so its inner double-bond lines sit close together. The pool-2 ozonolysis row is crowded but nothing overlaps.

I did not draw the other nine lines of three, the web or the deal.
