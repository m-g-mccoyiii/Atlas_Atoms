# Families of molecules

Why there is a list of starting molecules: each one belongs to a family, and each family scores by a rule of its own. The molecule a round is played on decides how that round is best played. Before a round the player picks one of three molecules, each from a family that is open.

| Family | Rule, paid on every reaction it fits | What it asks of the player | Opened by |
|---|---|---|---|
| chain | in a row: row +0.15 | keep the row going | start |
| ring | back to an earlier form: places times 2 | go round and round between two forms | start |
| arene | one place changed: extra +0.2 | exact single changes, not wide ones | trade supplier |
| sugar | each place past the first: row +0.2 | reagents that hit many places | research supplier |
| cage | a reaction by itself: extra +0.3 | everything on the chain at the end of a page | instrument maker |

23 starting molecules: chain 6, ring 4, arene 4, sugar 4, cage 5. Odds of a family being offered: chain 38, ring 24, arene 16, sugar 13, cage 9, among those open.

Each molecule has its own stored number to beat (161 figures, measured with the family rules in), so a family with a strong rule also has a higher number.

Not built: a reaction special to each family, a loadout chosen before a run, peptides, fused flat rings such as steroids. Not measured: whether each rule changes what a simulated player does, and run length with families in.

## Families are read from the molecule as it stands (later the same day)

A family is no longer fixed by the starting molecule. After every reaction the molecule is looked at again: rings that are not aromatic, aromatic rings, whether it is a cage, how many OH groups it has. Every rule that fits is paid, and a rule is paid more the more of that thing there is (two rings: the ring rule at level 2, up to 3). A molecule with nothing else is a chain.

So the player can build a family in the middle of a round. Hydrating a diene gives three OH groups and the molecule becomes a sugar. Close ring (new reagent, corner chemist, uncommon) joins two OH groups four or five carbons apart and the molecule becomes a ring. A molecule carried into the next round keeps what was built.

The starting family still decides which molecules are offered and what a supplier opens.

Not built: ways to build an arene or a cage, a loadout, reactions special to a family. Not measured: run length, and how strong stacked rules get.

## Building every family, and what a molecule does to itself (later again)

Two more reagents, so all five families can be reached from a chain:
- Snap shut (light, rare, research supplier): two C=C three to five carbons apart join into a four-ring. The chain folds into fused rings and counts as a cage.
- Aromatize (rare, trade supplier): a six-ring of carbon with a C=C in it gives up hydrogen and becomes a benzene ring.

Self-reaction. Once a page has been set off, the molecule may also react with itself, with no reagent held and none used up: close ring from the start, aromatize once the trade supplier is open, snap shut once the research supplier is open. A self-reaction always carries the row on. It is announced by name with "by itself". These run out by themselves, because each uses up the groups it needs.

Number to beat: round 1 is now 0.6 of the stored figure (was 0.9). With families and self-reactions in, a player who keeps the row beat 2 / 3 / 5 / 6 / 6 rounds at tier 0 (11 runs) and 1 / 2 / 3 / 5 / 9 at tier 3 (13 runs); a greedy player 0 / 1 / 1 / 2 / 3 (21 runs). These samples are small.

Ideas not built:
- Runaway: a self-reaction that makes the groups it needs again (a polymer end, a radical), so it goes on until something stops it, with the gain growing each turn.
- Catalyst: a piece of equipment that makes the last reaction happen again by itself, paying less each time until it is spent for the page.
- Inhibitor: a piece that stops a chain early and banks what it has made at a premium, for when the chain would wreck the molecule.

## Twist and resonance (later again)

Twist. A molecule no longer reacts with itself unasked. When it could (two OH groups in reach, two C=C in reach, a ring ready to become aromatic), a twist stands under it: two red arrows chasing round, with what it would make. The player clicks it or presses T, once a page. It uses none of the page's reactions and carries the row on. The molecule winds up, spins once and folds, and lands with a ring of ink. The old behaviour, reacting with itself during a chain, is kept behind ?self=auto.

Resonance. Not a family that is dealt: a state any molecule can be built into. Each single bond with a double bond on both sides is a link (C=C-C=C, C=C-C=O, three in a benzene ring). Every reaction multiplies extra by 1.05 per link, up to six links. It compounds, so a long chain on a molecule with resonance grows very fast. It is called out when a link is gained.

The numbers to beat were measured again with resonance in (161 figures). Run length was not measured again.

Not built: polymers that keep growing (runaway), catalyst, inhibitor.
