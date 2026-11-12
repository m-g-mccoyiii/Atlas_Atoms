# The final set: eighteen reactions, thirteen things the molecule does by itself

Written 11 November 2026. Every number below was measured by running `docs/tools_chem` on the game's 77 molecules with RDKit. The reactions and self-reactions are in `library.py`, the engine in `engine.py`, a test for every piece in `test_engine.py`, the unlock order and its deeds in `unlocks.py`.

How the numbers were made: a greedy player (takes the line that pays most this turn), 150 rounds per set of eight, molecules dealt by round size as the game deals them. Expect about 3 to 4 points of noise on any share. The pay rule is the one in `docs/CASCADES.md` and has not changed.

Three tuners each built a working set on the game's molecules. I re-ran tuner B's scripts first and got its numbers again; it met the most targets, so it is the base. From tuner A I took fold and the dry that fires on any OH two carbons from a C=O (the paper's dry; B had limited it to tertiary and ring carbons). I tried tuner A's slip and thread: slip lifts the six alone from 3.2 to 4.1 steps a turn and the carbonyl set to 7.1 steps, so it is out; thread fired on 9% of turns at most, so it is out. I made ring go last when several fit, which took ring from 34 to 37% of the steps in six sets down to 30% or less. Tuner A reported 13 of 19 reactions and 10 of 21 self-reactions at the bar, and tuner C reported random eights at 0.45 of the six against the 0.6 target; both were below tuner B's figures, I did not re-run them, and neither set is used. The sets of eight for thiol-ene, cyanohydrin and the flip check were searched and re-measured here. Every change was run.

---

## 1. REACTIONS

The player fires a reaction; it makes its one change at every place it fits, one place at a time. SMARTS are the main step; where a reaction has extra steps for equal hydrogen counts or a C=C beside a C=O, the full list is in `library.py`.

### The six the player starts with

1. **Hydration** (water, acid). Every C=C takes an OH on one carbon and an H on the other; the OH goes on the carbon with fewer H (beside a C=O, on the far carbon). Leaves: alcohol. Comes off: nothing.
   `[C;H0:1]=[C;H1,H2:2]>>[C:1](-O)-[C:2]`
2. **Hydroboration** (borane, then hydrogen peroxide and base). Every C=C takes an OH on one carbon and an H on the other; the OH goes on the carbon with more H. Leaves: alcohol. Comes off: nothing.
   `[C;H0:1]=[C;H1,H2:2]>>[C:1]-[C:2]-O`
3. **Dehydration** (acid, heat). Every OH on a saturated carbon leaves and a C=C forms toward the neighbour with fewer H. Not on a carbon with two O, not beside a carbon that carries O. Leaves: C=C. Comes off: water (water jar).
   `[CX4;!$(C(-[!#6])-[!#6]);!$(C-[#6]~[#8]):1](-[OX2H:2])-[CX4;!H0;!$(C-[!#6]):3]>>[C:1]=[C:3]`
4. **Oxidation** (PCC). Every OH on a carbon that has an H becomes C=O; a C=C at the very end of a chain loses its end carbon and the next carbon becomes C=O. Leaves: C=O. Comes off: hydrogen (hydrogen jar); carbon dioxide (carbon dioxide jar) for the chain-end C=C.
   `[CX4;!H0;!$(C(-[!#6])-[!#6]):1]-[OX2H:2]>>[C:1]=[O:2]` and `[CH2D1:1]=[CH1D2:2]>>[C:2]=O`
5. **Reduction** (sodium borohydride). Every C=O at the end of a chain (an aldehyde) becomes CH2-OH. Leaves: alcohol. Comes off: nothing.
   `[CX3;!$(C(=O)-[!#6]);H1,H2:1]=[O:2]>>[C:1]-[O:2]`
6. **Grow** (allylmagnesium bromide, then water). Every C=O becomes C-OH with a CH2-CH=CH2 arm on the same carbon. Leaves: alcohol and a new C=C. Comes off: nothing.
   `[CX3;!$(C(=O)-[!#6]):1]=[O:2]>>[C:1](-[O:2])-C-C=C`

### The twelve unlocked later

7. **Horner-Wadsworth-Emmons** (dimethyl 2-oxopropylphosphonate, base). Every aldehyde and every methyl ketone C=O that is not already beside a C=C becomes C=CH-C(=O)-CH3. Leaves: a C=C beside a new ketone. Comes off: nothing.
   `[CX3;$(C(=O)[CH3]),$([CX3H1]);!$(C(=O)-[!#6]);!$(C-[#6]=[#6]):1]=[O:2]>>[C:1]=C-C(=O)C`
8. **Dihydroxylation** (osmium tetroxide, NMO). Every C=C becomes two OH, one on each carbon. Leaves: diol. Comes off: nothing.
   `[C:1]=[C:2]>>[C:1](-O)-[C:2]-O`
9. **Ozonolysis** (ozone, then zinc). Every C=C is cut and both cut carbons become C=O; a ring opens; a chain keeps its longer piece. Leaves: C=O at each cut. Comes off: the shorter piece (formaldehyde for a chain-end C=C), no jar.
   `[C:1]=[C:2]>>([C:1]=O.[C:2]=O)`
10. **Hot permanganate** (potassium permanganate, heat, acid). Every chain-end C=C becomes COOH on the next carbon and loses its end carbon; every aldehyde becomes COOH; every chain-end CH2-OH becomes COOH. Leaves: COOH. Comes off: carbon dioxide (carbon dioxide jar) for the C=C; hydrogen (hydrogen jar) for the CH2-OH.
    `[CH2D1:1]=[CH1D2:2]>>[C:2](=O)O`, `[CX3H1;!$(C(=O)-[!#6]):1]=[O:2]>>[C:1](=[O:2])O`, `[CH2X4;D2;$(C-[#6]):1]-[OX2H:2]>>[C:1](=O)-[O:2]`
11. **Ritter amination** (acetonitrile in strong acid, then boiling aqueous acid). Every C=C takes an NH2 on one carbon and an H on the other; the NH2 goes on the carbon with fewer H. Leaves: amine. Comes off: nothing.
    `[C;H0:1]=[C;H1,H2:2]>>[C:1](-N)-[C:2]`
12. **Thiol-ene** (thioacetic acid with light, then base). Every C=C takes an SH on one carbon and an H on the other; the SH goes on the carbon with more H. Leaves: thiol. Comes off: nothing.
    `[C;H0:1]=[C;H1,H2:2]>>[C:1]-[C:2]-S`
13. **Chlorination** (thionyl chloride). Every primary or secondary OH becomes Cl. Not a tertiary OH, a phenol OH, a COOH or a ring OH. Leaves: Cl. Comes off: acid fumes (acid fumes jar).
    `[CX4;!H0;!$(C(-[!#6])-[!#6]):1]-[OX2H]>>[C:1]-Cl`
14. **Cyanohydrin route** (sodium cyanide, then boiling acid). Every aldehyde and every methyl ketone C=O becomes C(OH)-COOH, one carbon longer. Leaves: OH and COOH on one carbon. Comes off: ammonia (ammonia jar).
    `[CX3;$(C(=O)[CH3]),$([CX3H1]);!$(C(=O)-[!#6]):1]=[O:2]>>[C:1](-[O:2])C(=O)O`
15. **Hofmann elimination** (excess methyl iodide, silver oxide, heat). Every NH2 on a saturated carbon leaves and a C=C forms toward the neighbour with more H. Leaves: C=C. Comes off: trimethylamine and water (water jar).
    `[CX4;!$(C(-[!#6])-[!#6]):1](-[NX3H2:2])-[CX4;!H0;!$(C-[!#6]):3]>>[C:1]=[C:3]`
16. **Chugaev elimination** (carbon disulfide, base, methyl iodide, heat). Every OH on a saturated carbon leaves and a C=C forms toward the neighbour with more H, the other way from dehydration. Leaves: C=C. Comes off: sulfur (sulfur jar).
    `[CX4;!$(C(-[!#6])-[!#6]);!$(C-[#6]~[#8]):1](-[OX2H:2])-[CX4;!H0;!$(C-[!#6]):3]>>[C:1]=[C:3]`
17. **Hydroformylation** (carbon monoxide, hydrogen, rhodium catalyst). Every C=C takes a CHO on one carbon and an H on the other; the CHO goes on the carbon with more H. Leaves: aldehyde, one carbon longer. Comes off: nothing.
    `[C;H0:1]=[C;H1,H2:2]>>[C:1]-[C:2]-C=O`
18. **Epoxidation** (mCPBA). Every C=C becomes an epoxide, a three-ring with one O. Leaves: epoxide. Comes off: nothing.
    `[C:1]=[C:2]>>[C:1]1[C:2]O1`

Atoms balance on every use (the engine checks it on all 77 molecules). Williamson, Suzuki, Raney nickel, decarboxylation, hydrogenation, Jones and reductive amination from the paper list are gone. Williamson is now the self-reaction close.

---

## 2. WHAT THE MOLECULE DOES BY ITSELF

After each reaction that changed the molecule, the molecule makes these changes one place at a time, until none fits. Each is one step of the turn's chain.

Which goes first when several fit: seal, close, knit, cap and open first (the rarer groups), then dry, flip, shift, tuck, weld, snap and fold, then ring. Among those in one group, the pair of groups nearest each other goes first. Limits in one turn: dry once, weld twice, ring twice. The rings that ring, knit and cap close are loose and open again when the turn ends; the others stay.

| Name | WHEN | BECOMES | LEAVES | Comes off |
|---|---|---|---|---|
| **ring** (held at start) | an OH is 3 or 4 carbons from a C=O | the OH oxygen joins the C=O carbon and closes a ring of 5 or 6 atoms; the C=O becomes C-OH | a ring with an OH on its ring carbon (loose) | nothing |
| **dry** (held at start) | an OH is 2 carbons from a C=O, and its carbon has no second O | the OH leaves and a C=C forms beside the C=O | a C=C beside a C=O (an enol if the next carbon also had an OH) | water |
| **weld** | a CH beside a C=O and a second C=O are 4 or 5 carbons apart | that carbon joins the second C=O carbon and closes a ring of 5 or 6; the second C=O becomes C-OH | a ring with an OH; the first C=O stays | nothing |
| **shift** | a C=C has its near carbon 2 carbons from a C=O and is not yet beside it | the C=C slides one carbon toward the C=O | a C=C beside a C=O | nothing |
| **tuck** | a C=C is beside a C=O and an OH is 3 or 4 carbons from the far end of the C=C | the OH oxygen joins the far carbon and closes a ring of 5 or 6; the C=C goes single | a C=O and a ring ether | nothing |
| **flip** | an OH sits on a carbon of a C=C | the C=C goes single and the carbon becomes C=O | a C=O | nothing |
| **snap** | two C=C lie side by side and a third C=C has its near carbon 4 or 5 bonds from the end of the pair | the three close a six-ring; one C=C is left between the two middle carbons | a six-ring with one C=C | nothing |
| **knit** | an NH2 is 3 or 4 carbons from a C=O | the N joins the C=O carbon and closes a ring of 5 or 6; the C=O becomes C-OH | a ring with an OH and an NH (loose) | nothing |
| **seal** | a COOH and an OH, NH2 or SH are 3 or 4 carbons apart | the O, N or S joins the acid carbon and the acid OH leaves; a ring of 5 or 6 | a lactone, lactam or thiolactone | water |
| **cap** | an SH is 3 or 4 carbons from a C=O | the S joins the C=O carbon and closes a ring of 5 or 6; the C=O becomes C-OH | a ring with an OH and an S (loose) | nothing |
| **close** | a Cl and an OH, NH2, SH or COOH are 3 to 5 carbons apart | the Cl leaves and the O, N or S joins the Cl's carbon; a ring of 5 to 7 | an ether, amine, thioether or lactone ring | acid fumes |
| **open** | an epoxide and an OH are 3 or 4 carbons apart | the OH oxygen joins the nearer epoxide carbon and closes a ring of 5 or 6; the epoxide O stays as an OH on the other carbon | a ring ether and an OH | nothing |
| **fold** | an epoxide has a carbon on both ends (no chain-end epoxide) | the epoxide O stays on one carbon as C=O and an H moves to the other | a C=O | nothing |

---

## 3. HOW THEY FEED EACH OTHER

- **OH**: made by hydration, hydroboration, grow, dihydroxylation, reduction, and left behind by weld, open and the cyanohydrin route; used by dehydration, oxidation, chlorination, Chugaev, permanganate (chain-end CH2-OH), and by ring, tuck, open, seal and close, which join through it; dry takes it away as water.
- **C=O**: made by oxidation, ozonolysis, hydroformylation, HWE (the new ketone), flip and fold; used by reduction, grow, HWE and the cyanohydrin route (aldehydes and methyl ketones), and by ring, weld, knit and cap, which join onto it; shift, dry and tuck each need a C=O at a set distance from the group they work on.
- **C=C**: made by dehydration, Chugaev, Hofmann, grow (the allyl arm), HWE, dry and shift; used by hydration, hydroboration, Ritter, thiol-ene, epoxidation, dihydroxylation, ozonolysis, hydroformylation, oxidation and permanganate (chain-end only), and by snap.
- **C=C beside a C=O (enone)**: made by HWE, dry and shift; used by tuck, and by dihydroxylation, whose OH on the near carbon sits two carbons from the C=O and so feeds dry.
- **OH on a C=C (enol)**: made by dry when the next carbon also carries an OH (after dihydroxylation); used by flip.
- **Epoxide**: made by epoxidation; used by open (with an OH nearby) and fold (with carbon on both ends).
- **NH2**: made by Ritter amination; used by knit, seal, close and Hofmann.
- **SH**: made by thiol-ene; used by cap, seal and close.
- **Cl**: made by chlorination; used by close.
- **COOH**: made by permanganate and the cyanohydrin route; used by seal and close.
- **Loose rings** (ring, knit, cap): open again when the turn ends, so the next turn starts with the OH, NH2 or SH and the C=O back in place.
- **What comes off**: water from dehydration, dry, seal and Hofmann; hydrogen from oxidation and permanganate; carbon dioxide from oxidation and permanganate; acid fumes from chlorination and close; ammonia from the cyanohydrin route; sulfur from Chugaev. Each of the six jars has a reaction that sends something to it.

---

## 4. WHAT A PLAYER HOLDS AT THE START, AND THE ORDER THE REST ARE OPENED

**Start:** the six reactions (hydration, hydroboration, dehydration, oxidation, reduction, grow) and two self-reactions, ring and dry. With these a turn makes 2.15 steps (greedy) and 2.32 (look-ahead); ring alone makes 1.72.

Each deed is done in one turn with the pieces already held. At some point in the turn (right after a reaction, or when the chain it set off has settled) the molecule shows a pattern it did not show at the start of the turn. The pattern is what the new piece works on. The last column is how many game molecules the deed can be done on (out of those that do not already show the pattern), checked by playing every line of up to three held reactions (`python unlocks.py 77`; `test_every_deed_can_be_done` runs it).

| # | Piece | The deed | What it teaches | Doable on | A worked line |
|---|---|---|---|---|---|
| 1 | weld (self) | Have a CH beside a C=O and a second C=O four or five carbons from that carbon. | The carbon beside one C=O can join the second C=O and close a ring. | 33 of 33 | `C=CCCC(=O)CCC(C)(C)O`: oxidize |
| 2 | shift (self) | Have a C=C two carbons from a C=O. | A C=C two carbons from a C=O slides over to sit beside it. | 40 of 77 | `C=CCCC(=O)CCC=O`: oxidize, grow, oxidize |
| 3 | HWE (reaction) | Have an aldehyde or a methyl ketone with an OH three or four carbons from it. | The C=O becomes C=CH-CO-CH3: a C=C next to a new C=O, which the OH can then close onto. | 66 of 69 | `C=CCCC(=O)CCC=O`: oxidize, hydrate |
| 4 | tuck (self) | Have a C=C beside a C=O and an OH three or four carbons from the far end of the C=C. | The OH adds to the far carbon and closes a ring. | 66 of 77 | `C=CCCC(=O)CCC=O`: oxidize, reduce |
| 5 | epoxidation (reaction) | Have a C=C and an OH three or four carbons apart. | The C=C becomes an epoxide, and an OH nearby can open it into a ring. | 55 of 55 | `C=CCCC(=O)CCC=O`: reduce |
| 6 | open (self) | Have an epoxide and an OH three or four carbons apart. | The OH opens the epoxide and closes a ring. | 77 of 77 | `C=CCCC(=O)CCC=O`: grow, epoxidation |
| 7 | fold (self) | Have an epoxide with a carbon on both ends. | Such an epoxide turns into a C=O. | 77 of 77 | `C=CCCC(=O)CCC=O`: oxidize, epoxidation |
| 8 | dihydroxylation (reaction) | Have a C=C beside a C=O. | Both carbons of the C=C take an OH, and one of them lands two carbons from the C=O. | 72 of 72 | `C=CCCC(=O)CCC=O`: oxidize |
| 9 | flip (self) | Have an OH on a carbon of a C=C. | That OH turns the C=C into a C=O. | 16 of 77 | `C=CCCC(=O)CCC(C)(C)O`: dehydrate, dihydroxylation |
| 10 | chlorination (reaction) | Have two OH three to five carbons apart. | One OH becomes Cl, and the other OH can close onto it. | 66 of 66 | `C=CCCC(=O)CCC=O`: grow |
| 11 | close (self) | Have a Cl and an OH, NH2, SH or COOH three to five carbons apart. | The Cl leaves as acid fumes and the other group closes a ring through its O, N or S. | 77 of 77 | `C=CCCC(=O)CCC=O`: grow, chlorination |
| 12 | ozonolysis (reaction) | Have a C=C that has a carbon on both ends of both its carbons (not at the end of a chain). | The C=C is cut and both cut carbons become C=O. | 63 of 63 | `C=CCCC(=O)CCC=O`: oxidize |
| 13 | snap (self) | Have three C=C, two of them side by side. | The side-by-side pair and the third C=C close a six-ring. | 61 of 72 | `C=CCCC(=O)CCC=O`: hwe |
| 14 | thiol-ene (reaction) | Have a C=C and a C=O three to five carbons apart. | The C=C takes an SH, and that SH can close onto the C=O. | 38 of 38 | `CC(O)CCC(O)CCC(C)(C)O`: dehydrate, epoxidation |
| 15 | cap (self) | Have an SH and a C=O three or four carbons apart. | The SH closes a ring onto the C=O. | 68 of 77 | `C=CCCC(=O)CCC=O`: thiolene |
| 16 | Ritter amination (reaction) | Have two C=C and a C=O on the molecule at once. | Every C=C takes an NH2, and an NH2 near a C=O can close onto it. | 62 of 62 | `C=CCCC(=O)CCC=O`: hwe |
| 17 | knit (self) | Have an NH2 and a C=O three or four carbons apart. | The NH2 closes a ring onto the C=O. | 67 of 77 | `C=CCCC(=O)CCC=O`: ritter |
| 18 | Hofmann (reaction) | Have an NH2 on a carbon. | The NH2 leaves and a C=C forms in its place. | 77 of 77 | `C=CCCC(=O)CCC=O`: ritter |
| 19 | Chugaev (reaction) | Have an OH on a carbon whose two neighbours are both CH2. | The OH leaves and the C=C forms toward the neighbour with more H, the other way from dehydrate. | 42 of 42 | `C=CCCC(=O)CCC=O`: grow |
| 20 | hydroformylation (reaction) | Have a C=C and an OH two or three carbons apart. | The C=C takes a CHO, one carbon longer, which an OH nearby can close onto. | 55 of 55 | `C=CCCC(=O)CCC=O`: reduce |
| 21 | permanganate (reaction) | Have a C=C at the end of a chain and an OH three to five carbons from it. | The chain end becomes COOH, which the OH can close onto. | 65 of 65 | `C=CCCC(=O)CCC=O`: reduce |
| 22 | cyanohydrin route (reaction) | Have an aldehyde or a methyl ketone with an OH two to four carbons from it. | The C=O becomes C(OH)-COOH, and the COOH can close onto the other OH. | 69 of 69 | `C=CCCC(=O)CCC=O`: hydroformylation |
| 23 | seal (self) | Have a COOH and an OH, NH2 or SH three or four carbons apart. | They join into a ring and water comes off. | 77 of 77 | `C=CCCC(=O)CCC=O`: grow, permanganate |

Why this order: weld and shift first (they use only what the player holds and give the first longer chains); HWE, tuck, epoxidation, open and fold next (the C=C and epoxide group); dihydroxylation, flip, chlorination, close and ozonolysis then widen the OH and C=O supply; snap and thiol-ene and cap bring in a third group; Ritter, knit, Hofmann, Chugaev and hydroformylation bring in nitrogen and the second elimination; permanganate, the cyanohydrin route and seal last, because the acid group needs an OH or NH2 already in place.

---

## 5. FIVE SETS OF EIGHT

All five pay more than the six alone (1.00 = 947 places a round). Each is a different way to play.

1. **Nitrogen** (hydrate, oxidize, reduce, grow, Ritter, Hofmann, HWE, ozonolysis), 1.17, 3.54 steps a turn. Ritter puts an NH2 on a chain-end C=C, then knit closes it onto a C=O and weld, dry and ring follow. On `C=CCCC(=O)CCC=O`: Ritter, ozonolysis, grow gives knit, weld, dry, ring, ring.
2. **Oxirane** (epoxidation, dihydroxylation, hydrate, oxidize, dehydrate, hydroborate, reduce, grow), 1.28, 3.10 steps a turn. Epoxidation makes the epoxide, grow and dehydrate bring the OH and C=C, then open and fold work on it. On `CC(=O)CCC(=O)CCCCCC(=O)CCC(C)(C)O`: dehydrate, grow, epoxidation gives shift, weld, dry, open, open, fold, fold.
3. **Thiol** (thiol-ene, oxidize, dehydrate, ozonolysis, chlorination, grow, HWE, reduce), 1.30, 3.76 steps a turn. Thiol-ene is needed on 19 of every 100 turns it is dealt; the SH lands on a C=O and cap closes it, and chlorination feeds close. On `C=CCCC(=O)CCC(O)CCC(=O)CCC(C)(C)O`: dehydrate, oxidize, thiol-ene gives shift, shift, weld, dry, weld, cap.
4. **Cyanide** (cyanohydrin, chlorination, oxidize, dehydrate, grow, ozonolysis, HWE, reduce), 1.25, 3.53 steps a turn. The cyanohydrin route makes C(OH)-COOH and seal closes it onto an OH; it sends ammonia to the jar (0.97 a round) and chlorination sends acid fumes. On `CC(=O)CCC(=O)CCCCCC(O)CCC(=O)CCC=O`: HWE, ozonolysis, cyanohydrin gives weld, dry, weld, ring, ring, seal.
5. **Chain** (HWE, dihydroxylation, oxidize, hydroformylation, reduce, ozonolysis, Chugaev, Ritter), 1.27, 3.67 steps a turn. HWE and Chugaev make C=C beside a C=O, dihydroxylation puts an OH on it, and dry then flip run. Sulfur goes to the jar (1.41 a round). On `O=CCCCC(=O)CCC1(O)CCCC1`: Chugaev, dihydroxylation, HWE gives shift, dry, flip, weld, ring.

---

## 6. THE MEASURES AGAINST THE SEVEN TARGETS

Measured on 15 named sets of eight (the five above, the six, and nine others listed at the end) and 12 random eights drawn from the eighteen. 150 rounds each.

**1. Every reaction is needed (the best line of three gets worse without it) on at least 15% of the turns it is dealt, in some set; none is needed on more than 70% of its turns in every set.** 18 of 18.
Highest need, with the set: ozonolysis 72 (mixed), grow 70 (oxirane), oxidize 68 (the six), epoxidation 65 (oxirane), chlorination 49 (a random eight), HWE 47 (chain), dehydrate 43 (carbonyl), Chugaev 40 (a random eight), hydroformylation 40 (a random eight), Ritter 29 (amide), Hofmann 28 (amide), dihydroxylation 26 (chain), hydrate 23 (a random eight), cyanohydrin 19 (a random eight), hydroborate 19 (amide), thiol-ene 19 (thiol), reduction 18 (oxo), permanganate 16 (lean_acid). The most any reaction is needed in its lowest set is 44 (grow, in nitrogen). Permanganate, reduction, thiol-ene, cyanohydrin and hydroborate are within 4 points of the bar.

**2. Every self-reaction is used on at least 10% of turns in some set; none is more than a third of the steps.** 13 of 13 on use: cap 26, close 25, dry 88, flip 19, fold 34, knit 21, open 30, ring 66, seal 16, shift 28, snap 20, tuck 32, weld 69 (percent of turns, best set). On the third: in all 15 named sets the largest share is 31 (weld in cyanide) and ring is at most 28; dry is at most 27 (the six). One of the 12 random eights, a weak one with 1.7 steps a turn (chlorination, hydrate, hydroborate, hydroformylation, dihydroxylation, Ritter, Hofmann, grow), has ring at 37.

**3. A random eight pays at least 0.6 of the six.** Mean 0.92 over 12 random eights (range 0.44 to 1.43); 10 of 12 are at 0.6 or more, the two below are 0.44 and 0.52. Named sets: nitrogen 1.17, oxirane 1.28, thiol 1.30, cyanide 1.25, chain 1.27, carbonyl 1.20, splice 1.18, mixed 1.29, oxo 1.05, fumes 0.92, acid 0.81, amide 0.67, lean_oxo 0.57, lean_acid 0.52.

**4. Two random eights share few best lines.** 4% of best lines are the same (80 pairs); 12% share the same core reactions.

**5. Chains with three or more kinds of self-reaction on at least 25% of turns in rounds 4 to 9, in every set.** The lowest is 31 (lean_oxo); the five sets above run 53 to 76; the six runs 63.

**6. The six plus the start pieces make 2 to 4 steps a turn, and look-ahead beats greedy.** Ring and dry: 2.15 steps greedy, 2.32 look-ahead; pay 459 greedy, 503 look-ahead. Random play: 0.88 steps. With all thirteen: 2.52 greedy, 2.93 look-ahead.

**7. Every jar is fed.** Per round, in the set that feeds it most among the five (and the six): water 5.9 (the six), hydrogen 3.7 (carbonyl) and 3.4 (the six), carbon dioxide 2.0 (the six), acid fumes 0.43 (cyanide) and 0.39 (thiol), ammonia 0.97 (cyanide), sulfur 1.41 (chain), trimethylamine 0.70 (nitrogen). Water: dehydration, dry, seal. Hydrogen and carbon dioxide: oxidation, permanganate. Acid fumes: chlorination, close. Ammonia: the cyanohydrin route. Sulfur: Chugaev.

**What is still short**
- Target 2: ring is 37% of the steps in one random eight of 12.
- Target 3: two random eights of 12 are below 0.6 (0.44 and 0.52). Sets with no oxidize or grow (lean_acid, lean_oxo) make 1.6 and 1.8 steps a turn, with 38% of turns doing nothing.
- Target 1: five reactions sit at 16 to 19 against the bar of 15.
- The flip deed can be done on 16 of 77 molecules (21%) and shift's on 40 of 77.
- Not run in the game's JS: all of this is the Python engine. The game has to carry the order and the per-turn limits in section 2.

The other nine named sets (eight reactions each): carbonyl (the six, dihydroxylation, ozonolysis); splice (ozonolysis, HWE, epoxidation, hydroborate, hydrate, oxidize, dehydrate, reduce); amide (hydroborate, dehydrate, oxidize, reduce, Chugaev, permanganate, Ritter, Hofmann); acid (permanganate, cyanohydrin, hydrate, dehydrate, reduce, ozonolysis, chlorination, epoxidation); fumes (chlorination, dihydroxylation, dehydrate, hydrate, reduce, hydroborate, HWE, ozonolysis); oxo (hydroformylation, dehydrate, hydrate, ozonolysis, reduce, dihydroxylation, Chugaev, epoxidation); mixed (Hofmann, Ritter, HWE, ozonolysis, oxidize, grow, dehydrate, reduce); lean_acid (permanganate, cyanohydrin, hydroborate, Chugaev, reduce, dihydroxylation, Ritter, HWE); lean_oxo (hydroformylation, HWE, permanganate, cyanohydrin, Ritter, hydroborate, reduce, chlorination).

---

## 7. THREE WORKED EXAMPLES

All three molecules are in the game's list. Each line is one turn: three reactions, with the self-reactions that follow each one, as the engine plays them (`test_three_worked_examples_step_by_step`).

**1. Nitrogen set. `C=CCCC(=O)CCC(=O)CCC=O`: Ritter, ozonolysis, grow. 5 steps, 4 kinds (knit, weld, dry, ring).**
- Ritter (NH2 on the C=C): `CC(N)CCC(=O)CCC(=O)CCC=O`
- 1 knit (the NH2 closes onto the first ketone): `CC1CCC(O)(CCC(=O)CCC=O)N1`
- 2 weld (a CH beside the second ketone joins the aldehyde): `CC1CCC(O)(CC2C(=O)CCC2O)N1`
- 3 dry (the new ring OH leaves as water): `CC1CCC(O)(CC2=CCCC2=O)N1`
- 4 ring (the OH on the knit ring closes onto the ring C=O): `CC1CCC2(CC3=CCCC3(O)O2)N1`
- Ozonolysis (the ring C=C is cut): `CC1CCC2(CC(=O)C(O)(CCC=O)O2)N1`
- 5 ring: `CC1CCC2(CC(=O)C3(CCC(O)O3)O2)N1`
- Grow: `C=CCC1(O)CC2(CCC(C)N2)OC12CCC(O)O2`

**2. Thiol set. `C=CCCC(=O)CCC(O)CCC(=O)CCC(C)(C)O`: dehydrate, oxidize, thiol-ene. 6 steps, 4 kinds (shift, weld, dry, cap).**
- Dehydrate: `C=CCCC(=O)CC=CCCC(=O)CC=C(C)C`
- 1 shift: `C=CCCC(=O)C=CCCCC(=O)CC=C(C)C`
- 2 shift: `C=CCCC(=O)C=CCCCC(=O)C=CC(C)C`
- 3 weld: `C=CCCC1(O)C=CCCC1C(=O)C=CC(C)C`
- 4 dry: `C=CCCC1=C(C(=O)C=CC(C)C)CCC=C1`
- Oxidize (the chain-end C=C loses its end carbon as carbon dioxide and becomes C=O): `CC(C)C=CC(=O)C1=C(CCC=O)C=CCC1`
- 5 weld: `CC(C)C=CC1(O)C2=C(C=CCC2)CC1C=O`
- Thiol-ene (an SH on every C=C): `CC(C)CC(S)C1(O)C(C=O)CC2CC(S)CCC21S`
- 6 cap (an SH closes onto the aldehyde): `CC(C)CC1SC(O)C2CC3CC(S)CCC3(S)C12O`
- Off: carbon dioxide 1, water 3.

**3. Oxirane set. `CC(=O)CCC(=O)CCCCCC(=O)CCC(C)(C)O`: dehydrate, grow, epoxidation. 7 steps, 5 kinds (shift, weld, dry, open, fold).**
- Dehydrate: `CC(=O)CCC(=O)CCCCCC(=O)CC=C(C)C`
- 1 shift: `CC(=O)CCC(=O)CCCCCC(=O)C=CC(C)C`
- 2 weld: `CC(C)C=CC(=O)CCCCCC1(O)CCC(=O)C1`
- 3 dry: `CC(C)C=CC(=O)CCCCCC1=CC(=O)CC1`
- Grow (an allyl arm on every C=O): `C=CCC(O)(C=CC(C)C)CCCCCC1=CC(O)(CC=C)CC1`
- Epoxidation (every C=C): `CC(C)C1OC1C(O)(CCCCCC12CCC(O)(CC3CO3)C1O2)CC1CO1`
- 4 open: `CC(C)C1OC1C(O)(CCCCCC12CCC3(CC(O)CO3)C1O2)CC1CO1`
- 5 open: `CC(C)C1OC1C1(CCCCCC23CCC4(CC(O)CO4)C2O3)CC(O)CO1`
- 6 fold: `CC(C)CC(=O)C1(CCCCCC23CCC4(CC(O)CO4)C2O3)CC(O)CO1`
- 7 fold: `CC(C)CC(=O)C1(CCCCCC2CCC3(CC(O)CO3)C2=O)CC(O)CO1`
- Off: water 2.

---

## Files

- `library.py`: the eighteen reactions and thirteen self-reactions, with the order and per-turn limits as attributes (`prio`, `per_turn`).
- `engine.py`: runs the order and limits; `trace_line` gives every state of a turn.
- `test_engine.py`: 23 tests, 115 worked cases (67 reactions, 48 self-reactions, at least two acting cases for every piece), the order and limits, the three worked examples, every deed. All pass.
- `unlocks.py`: the order of section 4 and its deeds; `python unlocks.py 77` prints the table.
- `library_paper.py`, `engine_paper.py`, `test_engine_paper.py`: the files as they were before this set.
- `hurdles.py` and `sigils.py` still name the old reactions (jones, williamson, wittig and others) in their lists; those names need replacing by the ones above.
