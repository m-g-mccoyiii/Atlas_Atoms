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
