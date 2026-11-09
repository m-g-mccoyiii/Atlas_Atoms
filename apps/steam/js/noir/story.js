(function (root) {
'use strict';
const AA = root.AA = root.AA || {};

// The campaign. Every sample is a compound from the shared library (`compound` is its id).
// A clue either points at suspects (`against`) or clears them (`clears`). The culprit is the one suspect
// the clues do not clear and that at least two clues point at, or that remains once the others are cleared.
AA.NOIR = {
  hoursBase: 8,
  pay: { correct: 1, partial: 0.5 },
  cases: [
    {
      id: 'sanitizer', title: 'The Sanitizer Shelf', client: 'Det. Imani Reyes, Consumer Fraud', place: "Marlow's Pharmacy", pay: 400,
      brief: [
        ['Reyes', "Three customers at Marlow's Pharmacy used the hand sanitizer on shelf B and still caught the same stomach bug. The label says ethanol. I need to know what is in the bottle and who put it there."],
        ['Reyes', 'You get eight hours of instrument time. Each assay uses one hour. Ask for samples one at a time and do not waste them.'],
        ['Lab', 'Tip: you start with the mass spectrum. Build a molecule on the bench, then run an assay to see which peaks it explains. Assays cost hours, so think before you run one.']
      ],
      suspects: [
        { id: 'marlow', name: 'Gene Marlow', role: 'Owner, 22 years', says: '"I have not changed the sanitizer or the supplier in years. Same bottles, same shelf."' },
        { id: 'rae', name: 'Rae Okonkwo', role: 'Clerk, hired last month', says: '"I put out what the delivery brings. I have a key to the back office so I can open up."' },
        { id: 'kovac', name: 'Ana Kovac', role: 'Supplier', says: '"My invoices say ethanol. I have never had a key to the shop."' }
      ],
      culprit: 'rae',
      samples: [
        { id: 's1', label: 'Bottle from shelf B', where: 'Shelf B', compound: 'water', family: 'A very small molecule with one oxygen.',
          clue: 'The shelf B bottle is water. Ana Kovac\'s invoices list ethanol and she has no key, so the swap happened after delivery.', against: [], clears: ['kovac'] },
        { id: 's2', label: 'Old bottle from a customer', where: 'Bought 14 months ago', compound: 'ethanol', family: 'An alcohol with two carbons.',
          clue: 'Old stock is real ethanol. The sanitizer was genuine until about a month ago, so the change is recent. Gene Marlow says nothing changed in years; Rae Okonkwo started last month.', against: ['rae'], clears: [] },
        { id: 's3', label: 'Drum in the back office', where: 'Back office, residue and smell', compound: 'acetic', family: 'A weak acid with two carbons.',
          clue: 'The drum smells of vinegar (acetic acid), which is used to rinse out a drum. Someone emptied and rinsed it in the back office. Only Gene Marlow and Rae Okonkwo have keys.', against: ['marlow', 'rae'], clears: ['kovac'] }
      ],
      win: 'Reyes arrests Rae Okonkwo. She admits she poured the ethanol out of the drum, sold it, and refilled the bottles with water to cover the shortage. Marlow\'s recalls shelf B.',
      lose: 'Reyes arrests the person you named. Two weeks later the empty drum is found in Rae Okonkwo\'s garage, and the person you named is released. Marlow\'s recalls shelf B anyway.'
    },
    {
      id: 'backdoor', title: 'The Back Door', client: 'Tom Haddad, Fire Investigator', place: 'Nails by Dana', pay: 500,
      brief: [
        ['Haddad', 'A fire at Nails by Dana started at the rear door and burned the salon. Three people had a reason. I cannot tell from the burn pattern which fuel was used.'],
        ['Haddad', 'Two of the samples are ordinary salon supplies. One is not. Work out which compound does not belong there.']
      ],
      suspects: [
        { id: 'dana', name: 'Dana Cruz', role: 'Owner, insured', says: '"I would not burn my own shop. I lost every client list in there."' },
        { id: 'priya', name: 'Priya Nair', role: 'Fired employee, has a rear-door key', says: '"I was angry, not stupid. I was home that night."' },
        { id: 'theo', name: 'Theo Lund', role: 'Landlord, runs Hillside Outfitters', says: '"I wanted the lease renewed, that is all. I was at the store."' }
      ],
      culprit: 'theo',
      samples: [
        { id: 's1', label: 'Bottle from the salon shelf', where: 'Salon shelf, intact', compound: 'acetone', family: 'A ketone with three carbons.',
          clue: 'The salon\'s own stock is acetone. It burns, but the fire started outside at the rear door, so this does not explain it. It does not point at Dana Cruz.', against: [], clears: ['dana'] },
        { id: 's2', label: 'Residue on the rear threshold', where: 'Rear door, where the fire started', compound: 'butane', family: 'A hydrocarbon with four carbons.',
          clue: 'Butane is lighter fuel. A salon does not stock it. Hillside Outfitters, which Theo Lund runs, sells lighter refills.', against: ['theo'], clears: [] },
        { id: 's3', label: "Stain on Priya's apron", where: "Priya Nair's apron", compound: 'ethanol', family: 'An alcohol with two carbons.',
          clue: 'Ethanol is hand sanitizer, which every salon worker carries. It says nothing about Priya Nair.', against: [], clears: ['priya'] }
      ],
      win: 'Haddad finds a receipt for lighter refills in Theo Lund\'s truck and a bag of empty canisters behind his store. Lund is charged with arson. Dana Cruz reopens in a new unit.',
      lose: 'The person you named is arrested. A month later the receipts from Hillside Outfitters turn up and Theo Lund is charged instead. The first suspect has already lost their job.'
    },
    {
      id: 'bakery', title: 'Two Cleaners', client: 'Gwen Alder, Public Health Inspector', place: 'Hollis Bakery', pay: 600,
      brief: [
        ['Alder', 'Four staff at Hollis Bakery started coughing at the same time after cleaning the mixer. Nobody poisoned them on purpose. I need to know what mixed in that bottle and who did it.'],
        ['Alder', 'One sample is the supplied cleaner. One is from a staff locker. One is a harmless control. Two of these should never be mixed.']
      ],
      suspects: [
        { id: 'hollis', name: 'Walt Hollis', role: 'Owner', says: '"I buy the cleaner and the ingredients. I buy nothing else."' },
        { id: 'jun', name: 'Jun Park', role: 'Night cleaner', says: '"I only use the spray bottle the owner gave me."' },
        { id: 'marta', name: 'Marta Silva', role: 'Apprentice', says: '"The spray is weak, so I bring my own tablets from home."' }
      ],
      culprit: 'marta',
      samples: [
        { id: 's1', label: 'Spray bottle from the owner', where: 'Supplied cleaner', compound: 'ammonia', family: 'A gas of nitrogen and hydrogen.',
          clue: 'The supplied cleaner is ammonia. By itself it is an irritant, not a disaster.', against: [], clears: [] },
        { id: 's2', label: "Tablet tub in Marta's locker", where: 'Staff locker', compound: 'chlorine', family: 'A diatomic gas with no hydrogen.',
          clue: 'The tub gives off chlorine, from bleach. Chlorine mixed with ammonia makes toxic chloramine gas. The tub is in Marta Silva\'s locker, and she says she brings her own tablets.', against: ['marta'], clears: ['hollis', 'jun'] },
        { id: 's3', label: 'Rinse bottle on the shelf', where: 'Shelf above the sink', compound: 'acetic', family: 'A weak acid with two carbons.',
          clue: 'The rinse bottle is vinegar (acetic acid), which is harmless here. Walt Hollis supplied it. It does not point at anyone.', against: [], clears: ['hollis'] }
      ],
      win: 'Alder confirms Marta Silva poured bleach into the ammonia spray bottle to clean the mixer. Nobody is charged; she is retrained, and the bakery adds a label to every bottle.',
      lose: 'The person you named is suspended. The inspector later confirms the bleach tablets were Marta Silva\'s and she was retrained, but the person you named lost two weeks of pay.'
    },
    {
      id: 'gala', title: 'Blood Thinner', client: 'Det. Imani Reyes, with Dr. Samira Ahn', place: 'Vail house', pay: 800,
      brief: [
        ['Ahn', 'Edmund Vail took a blood thinner every day. He bled internally at a dinner on Saturday and is in intensive care. The cause is aspirin, and nobody gave it to him on purpose in front of a witness.'],
        ['Reyes', 'His pillbox has a bottle labelled vitamin C. Three people could have filled it. This is the hard one. Take your time and keep your hours.']
      ],
      suspects: [
        { id: 'lena', name: 'Lena Ortiz', role: 'Assistant, fills the pillbox', says: '"I refill his pillbox every Sunday from the bottles in the cabinet."' },
        { id: 'ames', name: 'Dr. Felix Ames', role: 'His physician', says: '"I prescribed the blood thinner. I told everyone in the house what it does."' },
        { id: 'victor', name: 'Victor Vail', role: 'Nephew, heir', says: '"I was at the dinner. I drank brandy from my flask."' }
      ],
      culprit: 'lena',
      samples: [
        { id: 's1', label: 'Bottle labelled vitamin C', where: 'The pillbox', compound: 'aspirin', family: 'A ring with two different groups on neighbouring carbons.',
          clue: 'The vitamin C bottle holds aspirin. Whoever filled it knew Edmund Vail takes a blood thinner. Only Lena Ortiz and Dr. Ames fill or handle the pillbox.', against: ['lena', 'ames'], clears: ['victor'] },
        { id: 's2', label: "Victor's flask", where: 'Victor Vail\'s coat', compound: 'ethanol', family: 'An alcohol with two carbons.',
          clue: 'The flask holds ethanol, which is brandy. It does not touch the pillbox. It does not point at Victor Vail.', against: [], clears: ['victor'] },
        { id: 's3', label: "Powder in Dr. Ames's bag", where: "Dr. Ames's medical bag", compound: 'urea', family: 'A carbonyl with two nitrogens.',
          clue: 'The powder is urea, a skin cream ingredient Dr. Ames gives to patients. It is harmless and it explains why his bag has powder. It does not point at him.', against: [], clears: ['ames'] }
      ],
      win: 'Reyes finds that Lena Ortiz replaced the vitamin C with aspirin tablets she had crushed and refilled to hide a theft from Edmund\'s accounts. Edmund survives.',
      lose: 'The person you named is arrested. The accounts and a receipt for the crushed tablets later point to Lena Ortiz, and she is charged. The person you named is released.'
    },
    {
      id: 'ampoule', title: 'Ampoule 14', client: 'Dr. Ines Varga, University Archive', place: 'Archive vault, basement', pay: 1000, kind: 'mystery', act: 2, accuseTitle: 'Name the explanation',
      brief: [
        ['Varga', 'The archive holds 31 sealed glass ampoules from a 1931 laboratory. The notebook says ampoule 14 holds ethanol. A graduate student ran it on a hydrogen NMR and saw a line at minus 3.2 ppm. She says that is impossible. I want to know whether she is right.'],
        ['Varga', 'Only the NMR showed it. A mass spectrum or an infrared would not show one stray hydrogen. Choose your second instrument carefully.'],
        ['Lab', 'Ordinary organic hydrogens appear between 0 and 12 ppm. Hydrogens bonded to a metal (metal hydrides) can appear below 0. If your structure explains every signal except one, report that signal as an anomaly.']
      ],
      suspects: [
        { id: 'contam', name: 'Contamination', role: 'Hypothesis', says: '"A metal hydride from the vault shelf got into the ampoule. That would explain a negative shift."' },
        { id: 'fault', name: 'Instrument fault', role: 'Hypothesis', says: '"The student\'s NMR is old. A false line near minus 3 ppm is a known artefact on that machine."' },
        { id: 'new', name: 'A signal not in the tables', role: 'Hypothesis', says: '"The ampoule is ethanol plus one hydrogen that no table on this bench can place."' }
      ],
      culprit: 'new',
      samples: [
        { id: 's1', label: 'Ampoule 14, opened', where: 'Archive vault', compound: 'ethanol', anomaly: { shift: -3.2, hs: 1 }, family: 'An alcohol with two carbons.', resultLabel: 'Ethanol, plus one unexplained hydrogen signal at -3.2 ppm',
          clue: 'Everything in the ampoule is ethanol except one hydrogen signal at -3.2 ppm, where no organic hydrogen sits. Metal hydrides can do that, so the next samples test for metal and for instrument error.', against: ['new'], clears: [] },
        { id: 's2', label: 'Dust from the vault shelf', where: 'Shelf under ampoule 14', compound: 'water', family: 'A very small molecule with one oxygen.',
          clue: 'The shelf dust is water and nothing else. There is no metal in it that could form a hydride, so contamination from the shelf does not fit.', against: [], clears: ['contam'] },
        { id: 's3', label: 'Fresh ethanol from your shelf', where: 'Run on the same NMR', compound: 'ethanol', family: 'An alcohol with two carbons.',
          clue: 'The same NMR, run on fresh ethanol, shows no line at -3.2 ppm. The instrument is fine, so it is not an artefact.', against: [], clears: ['fault'] }
      ],
      win: 'Varga logs ampoule 14 as unexplained and orders the other 30 ampoules opened. Two more show the same signal.',
      lose: 'You named the wrong explanation. Varga finds the shelf dust and the NMR both clean and logs the signal as unexplained anyway. The other 30 ampoules are opened a month later than they should have been.'
    }
  ],
  upgrades: [
    { id: 'hours', name: 'Extra lab hours', desc: '+2 instrument hours in every case.', cost: 250, max: 2 },
    { id: 'tokens', name: 'Spare reagent', desc: '+1 scan token on every sample, so you can read a second instrument.', cost: 300, max: 1 },
    { id: 'opinion', name: 'Second opinion', desc: 'Once per case, ask a colleague what family a sample belongs to.', cost: 200, max: 1 }
  ],
  endings: [
    { min: 130, text: 'The lab has a waiting list. Detectives ask for you by name.' },
    { min: 70, text: 'The lab pays its bills. Detectives send you work, and some of them check it twice.' },
    { min: 0, text: 'The lab stays open, but only a few detectives still send you samples.' }
  ]
};
})(typeof globalThis !== 'undefined' ? globalThis : window);
