(function (root) {
'use strict';
const AA = root.AA = root.AA || {};

// Case files. `id` is a molecule id from the shared core library. `tier` is difficulty (1 to 4) and sets the day budget.
// `notes` are what the client can tell you. `tips` are one-time pointers shown on the desk for new players.
AA.CASES = [
  { id: 'water', tier: 1, title: 'Unlabeled flask', client: 'Dr. Okafor, teaching lab',
    story: 'A flask on the shelf lost its label. The liquid is clear and has no smell. A drop on a hot plate does not burn.',
    notes: ['Clear, no smell.', 'Does not burn.', 'Boils at 100 °C.'],
    tips: ['Run the mass spectrometer, then click a peak and say what it is. The strong peak farthest right is usually the whole molecule, M⁺. Correct readings go in your notebook.',
           'Build a candidate on the bench. Its predicted spectrum is drawn in red over your printouts, and each notebook entry gets a tick if your structure explains it. When everything agrees, declare.'] },
  { id: 'co2', tier: 1, title: 'Soda machine cylinder', client: 'Ines, beverage service',
    story: 'An unmarked cylinder sits behind a soda machine. The gas does not burn. Bubbled through limewater it makes the water cloudy.',
    notes: ['Does not burn.', 'Turns limewater cloudy.', 'Heavier than air.'],
    tips: ['Infrared shows which bonds a molecule has. Each dip is a vibration. Compare the dip positions with the reference sheet.',
           'A symmetrical molecule can be invisible in infrared. A flat line is information too.'] },
  { id: 'ethanol', tier: 2, title: 'Sanitizer batch', client: 'Marlow Pharmacy',
    story: 'A batch of hand sanitizer was mixed without a record. The main ingredient is a clear liquid with a sharp smell.',
    notes: ['Mixes with water.', 'Burns with a pale blue flame.', 'Carbon, hydrogen and oxygen.'],
    tips: ['Hydrogen NMR counts the different kinds of hydrogen. A quick scan blurs the splitting. A high-resolution run costs another day and shows triplets and quartets.',
           'Two molecules can have the same mass. The NMR is what tells them apart.'] },
  { id: 'acetone', tier: 2, title: 'Back room bottle', client: 'Nails by Dana',
    story: 'A bottle in the back room strips polish in seconds. Nobody remembers what is in it.',
    notes: ['Evaporates very fast.', 'Dissolves nail polish.', 'No O–H group.'] },
  { id: 'acetic', tier: 2, title: 'Two sour bottles', client: 'Kitchen at Pell Street',
    story: 'A cleaner and a salad dressing both smell sour. Someone swears one substance is in both.',
    notes: ['Sour smell.', 'Turns blue litmus red.', 'A weak acid.'] },
  { id: 'butane', tier: 2, title: 'Lighter refills', client: 'Hillside Outfitters',
    story: 'A pressurized gas refills lighters. The label peeled off the supply tank.',
    notes: ['Burns with a yellow flame.', 'Carbon and hydrogen only.', 'Heavier than propane (mass 44).'] },
  { id: 'ethyne', tier: 3, title: 'Torch fuel', client: 'Gantry Welding',
    story: 'A tank feeds a torch that runs hotter than anything else in the shop.',
    notes: ['Carbon and hydrogen only.', 'Hot, sooty flame.', 'Only two carbons.'] },
  { id: 'benzene', tier: 3, title: 'Archive solvent', client: 'City museum conservator',
    story: 'An old can of solvent turned up in the archive. It smells sweet. It is toxic, so only the simulator will handle it.',
    notes: ['Sweet smell.', 'Smoky flame.', 'All of its hydrogens are alike.'] },
  { id: 'ammonia', tier: 3, title: 'Cleaner fumes', client: 'Building maintenance',
    story: 'A gas from a cleaning product makes eyes water. It turns red litmus paper blue.',
    notes: ['A base.', 'Only four atoms per molecule.', 'Contains nitrogen.'] },
  { id: 'aspirin', tier: 4, title: 'Tablet, no box', client: 'Corner drugstore',
    story: 'White crystals from a pain-relief tablet. The mass spectrum shows 180. The next case also shows 180. Do not trust the mass alone.',
    notes: ['Weakly acidic.', 'Mass 180.', 'Has a ring.'] },
  { id: 'glucose', tier: 4, title: 'Sweet crystals', client: 'Pike Candy Works',
    story: 'White crystals that dissolve in water and taste very sweet. Mass 180, like the tablet.',
    notes: ['Very sweet.', 'Dissolves easily in water.', 'Mass 180.'],
    decide: 'The sugar is an aldose: the ring carbon bonded to two oxygens still carries a hydrogen. A ketose such as fructose has a CH₂OH on that carbon instead.' },
  { id: 'vanillin', tier: 4, title: 'Bakery complaint', client: 'Hollis Bakery',
    story: 'A baker wants to know which molecule makes vanilla smell like vanilla.',
    notes: ['Smells of vanilla.', 'Has a ring.', 'Oxygen sits in three different groups.'],
    decide: 'The ring carries the aldehyde and a hydroxyl group on opposite sides (positions 1 and 4), with the methoxy group next to the hydroxyl, as in vanilla bean extract.' }
];
})(typeof globalThis !== 'undefined' ? globalThis : window);
