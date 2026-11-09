(function (root) {
'use strict';
const AA = root.AA = root.AA || {};

// Written for a very advanced 7-year-old working with a grown-up nearby.
// Valid JSON on purpose: tools/make_lesson_doc.py turns this into docs/LESSON_PLANS.md.
// done: {found:id} | {foundAll:[ids]} | {reacted:id} | {reactedAny:[ids]} | {reactedCount:n} | omitted = "Mark done" button
AA.LESSONS = [
  {
    "n": 1, "title": "Everything is made of atoms", "level": "Start here", "minutes": 10,
    "bigIdea": "Everything is made of atoms. Atoms are so tiny that you cannot see them. One hair on your head is hundreds of thousands of atoms wide.",
    "words": [["atom", "A tiny piece of stuff. Everything is built from atoms."], ["matter", "Anything you can touch or hold."]],
    "tryIt": ["Drag one white H atom onto the bench.", "Spin the view with your mouse. Scroll to zoom.", "Click the H button on the left (do not drag) to read about hydrogen."],
    "check": [{"q": "Can you see atoms with your eyes?", "a": "No. They are too tiny."}, {"q": "Name something that is made of atoms.", "a": "Anything works: a rock, water, air, you."}],
    "realLife": "The air, the water you drink and your own body are all made of atoms.",
    "offScreen": "Walk around and find 10 things. Each one is made of atoms.",
    "grownup": "Ask: What do you think is inside a rock? Inside a puddle? Inside you?"
  },
  {
    "n": 2, "title": "Meet the elements", "level": "Start here", "minutes": 10,
    "bigIdea": "An element is one kind of atom. Each element has a short code called a symbol. H is hydrogen. C is carbon. N is nitrogen. O is oxygen.",
    "words": [["element", "One kind of atom, like all hydrogen."], ["symbol", "A short code for an element, like H or O."]],
    "tryIt": ["Click H, C, N and O on the left to open their cards.", "Look at each atom's color. Chemists use these colors too.", "Find the number called atomic number on each card."],
    "check": [{"q": "What is the symbol for oxygen?", "a": "O."}, {"q": "What is the symbol for carbon?", "a": "C."}],
    "realLife": "Every chemist in every country uses the same symbols.",
    "offScreen": "Make four cards: H, C, N, O. Write the name on the back.",
    "grownup": "Quiz game: say a symbol and let them say the element. Then swap."
  },
  {
    "n": 3, "title": "Atoms have hands", "level": "Start here", "minutes": 10,
    "bigIdea": "Each atom likes to hold a certain number of other atoms. We call these its hands. Hydrogen has 1 hand. Oxygen has 2. Nitrogen has 3. Carbon has 4. Chemists call this number the valence.",
    "words": [["bond", "A link that holds two atoms together."], ["valence", "How many bonds an atom likes to make."]],
    "tryIt": ["Drag two H atoms onto the bench.", "Drop one on top of the other to make a bond.", "Watch the dots under each atom. Green means a hand is used. When all hands are used, the atom smiles."],
    "check": [{"q": "How many hands does oxygen have?", "a": "Two."}, {"q": "Why did the hydrogens smile?", "a": "Each has one hand, and the bond used it."}],
    "realLife": "Two hydrogens joined together make hydrogen gas. It can fill balloons and fuel rockets.",
    "offScreen": "Hold hands with someone. You each used one hand, just like two hydrogens.",
    "grownup": "Ask: If an atom has 3 hands, how many other atoms can it hold?",
    "done": {"found": "hydrogen"}
  },
  {
    "n": 4, "title": "Sharing makes a bond", "level": "Start here", "minutes": 10,
    "bigIdea": "Atoms hold on to each other by sharing tiny bits called electrons. One shared pair is a single bond. Two shared pairs make a double bond. The oxygen you breathe has a double bond.",
    "words": [["electron", "A tiny bit that atoms share to make a bond."], ["double bond", "Two shared pairs between the same two atoms."]],
    "tryIt": ["Drag two O atoms. Drop one on the other to make a bond.", "Tap the gold + on the bond (or drop one O on the other again) to make a double bond. Now both smile.", "Click Electrons in the view buttons. Count the lines between the O atoms."],
    "check": [{"q": "What do atoms share to make a bond?", "a": "Electrons."}, {"q": "How many lines are between the O atoms?", "a": "Two. That is a double bond."}],
    "realLife": "Every breath of oxygen you take is made of atoms joined by a double bond.",
    "offScreen": "Link two paper clips once. Then link them twice. Which is harder to pull apart?",
    "grownup": "Say: Sharing is how atoms stay together. Ask what else we hold on to by sharing.",
    "done": {"found": "oxygen"}
  },
  {
    "n": 5, "title": "Your first molecule: water", "level": "Start here", "minutes": 15,
    "bigIdea": "A molecule is atoms joined together. A formula tells you which atoms are in it. H₂O means 2 hydrogens and 1 oxygen. The little number tells you how many.",
    "words": [["molecule", "Two or more atoms joined together."], ["formula", "A short way to write which atoms are in a molecule."]],
    "tryIt": ["Drag one O atom onto the bench.", "Drop two H atoms on it, one at a time.", "Look at the formula under 'On your bench'. It says H₂O.", "Click an atom to poke it and read about it."],
    "check": [{"q": "What does the little 2 in H₂O mean?", "a": "There are 2 hydrogen atoms."}, {"q": "How many atoms are in one water molecule?", "a": "Three."}],
    "realLife": "Oceans, rain and your body are mostly water.",
    "offScreen": "Fill a glass with water. It holds more water molecules than there are stars you can see.",
    "grownup": "Ask: What is the formula for two water molecules? (2 H₂O means 4 hydrogens and 2 oxygens.)",
    "done": {"found": "water"}
  },
  {
    "n": 6, "title": "Shape matters", "level": "Getting good", "minutes": 15,
    "bigIdea": "Molecules have shapes. Water is bent, like a boomerang. Carbon dioxide is straight, like a stick. The shape depends on how the atoms push on each other.",
    "words": [["lone pair", "Two electrons on an atom that are not in a bond."], ["straight", "Atoms in a line. Chemists say linear."]],
    "tryIt": ["Build water and turn it around to see the bend.", "Click Orbitals. The gold lobes on the O are lone pairs. They push the hydrogens close.", "Build CO₂: one C with a double bond to two O atoms. Is it bent or straight?"],
    "check": [{"q": "Is water bent or straight?", "a": "Bent."}, {"q": "Is carbon dioxide bent or straight?", "a": "Straight."}],
    "realLife": "Water's bent shape is a big reason ice floats and salt can dissolve in it.",
    "offScreen": "Use marshmallows and toothpicks to make a bent molecule and a straight one.",
    "grownup": "Ask: Why do you think the gold lobes make the hydrogens squeeze together?",
    "done": {"found": "co2"}
  },
  {
    "n": 7, "title": "The air around you", "level": "Getting good", "minutes": 15,
    "bigIdea": "Air is mostly two molecules. About 78 out of every 100 are nitrogen, N₂. About 21 out of every 100 are oxygen, O₂. A tiny bit is carbon dioxide, CO₂.",
    "words": [["gas", "Molecules flying around with lots of room."], ["triple bond", "Three shared pairs between the same two atoms."]],
    "tryIt": ["Build N₂: drop one N on another three times to make a triple bond.", "Compare the O₂ and N₂ bonds in the Electrons view.", "Open My Atlas and read about N₂, O₂ and CO₂."],
    "check": [{"q": "What is most of the air?", "a": "Nitrogen."}, {"q": "How many shared pairs are in N₂?", "a": "Three, a triple bond."}],
    "realLife": "You breathe in oxygen and breathe out carbon dioxide. Most of each breath is nitrogen.",
    "offScreen": "Wave a piece of paper and feel the air push back.",
    "grownup": "Ask: Why can't we see air if it is made of molecules?",
    "done": {"found": "nitrogen"}
  },
  {
    "n": 8, "title": "Carbon has four hands", "level": "Getting good", "minutes": 15,
    "bigIdea": "Carbon has four hands, so it can hold lots of atoms. That makes carbon the main building block of living things.",
    "words": [["tetrahedron", "A shape like a tiny pyramid with four points."], ["methane", "One carbon with four hydrogens."]],
    "tryIt": ["Drag one C onto the bench.", "Drop four H atoms on it.", "Turn it around. The H atoms point to the corners of a tiny pyramid."],
    "check": [{"q": "How many hands does carbon have?", "a": "Four."}, {"q": "What is the formula for methane?", "a": "CH₄."}],
    "realLife": "Methane is the main part of the natural gas that heats many homes.",
    "offScreen": "Make a pyramid from 4 gumdrops and 6 toothpicks.",
    "grownup": "Ask: Why do you think the four H atoms spread out instead of bunching up?",
    "done": {"found": "methane"}
  },
  {
    "n": 9, "title": "Chains of carbon", "level": "Getting good", "minutes": 15,
    "bigIdea": "Carbon atoms can hold on to each other and make a chain. Fill the rest of the hands with hydrogen. Propane has three carbons in a row.",
    "words": [["chain", "Atoms joined one after another."], ["fuel", "Something we burn to get heat."]],
    "tryIt": ["Join three C atoms in a row.", "Fill every open hand with an H. You need 8 H atoms.", "Turn it. Why does the chain zig-zag?"],
    "check": [{"q": "How many H atoms are in propane?", "a": "Eight."}, {"q": "Why does the chain zig-zag?", "a": "Each carbon's four bonds point to the corners of a tiny pyramid."}],
    "realLife": "Propane is the fuel in camp stoves and grills.",
    "offScreen": "Link paper clips into a chain. Try to make it perfectly straight.",
    "grownup": "Ask: How many H atoms would a chain of four carbons need? (10, and that is butane.)",
    "done": {"found": "propane"}
  },
  {
    "n": 10, "title": "Double and triple bonds", "level": "Getting good", "minutes": 15,
    "bigIdea": "Carbons can share more than one pair. A double bond is shorter and stronger than a single bond. A triple bond is even shorter and stronger. A double bond keeps atoms flat. A triple bond makes a straight line.",
    "words": [["flat", "All the atoms sit on one flat sheet."]],
    "tryIt": ["Build ethylene: two C atoms with a double bond and two H on each.", "Build acetylene: two C atoms with a triple bond and one H on each.", "Which one is flat? Which one is a line?"],
    "check": [{"q": "Which bond is shorter, single or double?", "a": "Double."}, {"q": "How many H atoms are in acetylene?", "a": "Two."}],
    "realLife": "Ripe bananas give off ethylene, and it makes nearby fruit ripen faster.",
    "offScreen": "Put a ripe banana in a paper bag with a green tomato. Check each day.",
    "grownup": "Ask: Why do you think carbon needs fewer H atoms when it has more bonds to another carbon?",
    "done": {"foundAll": ["ethene", "ethyne"]}
  },
  {
    "n": 11, "title": "Same atoms, different molecule", "level": "Big kid chemistry", "minutes": 20,
    "bigIdea": "The same atoms can join in different ways to make different molecules. These are called isomers. Ethanol and dimethyl ether both have 2 C, 6 H and 1 O. Ethanol is a liquid. Dimethyl ether is a gas.",
    "words": [["isomer", "A molecule that has the same atoms as another but joined in a different way."]],
    "tryIt": ["Build ethanol: C–C–O, with H atoms on every other hand.", "Now build the same atoms as C–O–C. The bench says: right atoms, different arrangement.", "Can you find a third way? (Hint: you cannot. Try!)"],
    "check": [{"q": "Can two molecules have the same atoms but be different?", "a": "Yes. How they are joined matters."}, {"q": "What is an isomer?", "a": "Same atoms, different arrangement."}],
    "realLife": "Medicines can work very differently when the atoms are joined in a different way.",
    "offScreen": "Build two different things from the same 6 LEGO bricks.",
    "grownup": "Ask: What is the same about two isomers? What is different?",
    "done": {"found": "ethanol"}
  },
  {
    "n": 12, "title": "Salt: giving, not sharing", "level": "Big kid chemistry", "minutes": 15,
    "bigIdea": "In water, atoms share. In salt, sodium gives away one electron to chlorine. Now sodium is positive and chlorine is negative. Opposite charges stick together. This is an ionic bond. The game draws it as a dashed line.",
    "words": [["ion", "An atom with a charge because it gave or took an electron."], ["ionic bond", "Positive and negative atoms sticking together."]],
    "tryIt": ["Find enough molecules to unlock Na and Cl.", "Drop Na onto Cl.", "Look for the dashed line and the + and − signs."],
    "check": [{"q": "What does sodium do with its electron?", "a": "It gives it to chlorine."}, {"q": "What is the dashed line?", "a": "An ionic bond."}],
    "realLife": "Table salt is sodium chloride. A grain of salt is a crystal of billions of ions.",
    "offScreen": "Stir a spoon of salt into warm water until it disappears. Do not drink it.",
    "grownup": "Ask: How is giving different from sharing?",
    "done": {"found": "salt"}
  },
  {
    "n": 13, "title": "Sour acids", "level": "Big kid chemistry", "minutes": 15,
    "bigIdea": "Acids taste sour. Vinegar has acetic acid. Lemons have citric acid. Fizzy water has a little carbonic acid. Many acids have a COOH group on them.",
    "words": [["acid", "Something that tastes sour and can give away a hydrogen."], ["group", "A small bunch of atoms stuck on a molecule, like COOH."]],
    "tryIt": ["Build acetic acid. Find the COOH end in the Electrons view.", "Build carbonic acid.", "Compare them."],
    "check": [{"q": "What makes vinegar sour?", "a": "Acetic acid."}, {"q": "Where do you find citric acid?", "a": "Lemons and limes."}],
    "realLife": "Acids give lemons, vinegar and many candies their tang. Never taste unknown chemicals.",
    "offScreen": "With a grown-up, put a spoon of baking soda in a cup and add a little vinegar. The bubbles are carbon dioxide.",
    "grownup": "Ask: What is bubbling when baking soda meets vinegar? (Carbon dioxide gas.)",
    "done": {"foundAll": ["acetic", "carbonic"]}
  },
  {
    "n": 14, "title": "Heat makes atoms move", "level": "Big kid chemistry", "minutes": 10,
    "bigIdea": "Heat makes molecules move faster. In ice they just wiggle in place. In water they slide around. In steam they zoom everywhere.",
    "words": [["temperature", "How fast the tiny pieces are moving."], ["solid, liquid, gas", "Three ways stuff can be: hard, runny or airy."]],
    "tryIt": ["Build a molecule or two on the bench.", "Slide the Heat slider all the way up.", "Press Shake. Then turn Heat down."],
    "check": [{"q": "What does heat do to molecules?", "a": "Makes them move faster."}, {"q": "Which has molecules moving most, ice, water or steam?", "a": "Steam."}],
    "realLife": "Ice melts because heat makes water molecules move enough to slide.",
    "offScreen": "Put an ice cube in warm water and another in cold water. Which melts faster?",
    "grownup": "Ask: Why does a hot drink stop steaming as it cools?"
  },
  {
    "n": 15, "title": "Reactions rearrange atoms", "level": "Big kid chemistry", "minutes": 15,
    "bigIdea": "In a reaction, bonds break and new bonds form. The atoms are the same, but they join up in new ways to make new molecules.",
    "words": [["reaction", "Atoms joining up in new ways."], ["product", "The new molecule you make."]],
    "tryIt": ["Find hydrogen, oxygen and water.", "Open My Atlas and put two H₂ and one O₂ on the bench.", "Press Spark in the Reactions box and watch."],
    "check": [{"q": "What do you start with in 2 H₂ + O₂?", "a": "Hydrogen and oxygen."}, {"q": "What do you make?", "a": "Water."}],
    "realLife": "Rockets can burn hydrogen with oxygen. All you get out is water.",
    "offScreen": "Take apart a LEGO model and build a new one with the same bricks.",
    "grownup": "Ask: Where did the water's atoms come from?",
    "done": {"reacted": "rocket"}
  },
  {
    "n": 16, "title": "Atoms never disappear", "level": "Challenge", "minutes": 15,
    "bigIdea": "In a reaction, no atoms are made and no atoms vanish. You end up with exactly the same atoms you started with, just joined differently. This is called conservation of mass.",
    "words": [["conservation of mass", "The atoms never disappear or appear."]],
    "tryIt": ["Do two different reactions from the Reactions box.", "Before each Spark, count the atoms on the bench.", "After Spark, count again. Same numbers!"],
    "check": [{"q": "Do atoms disappear in a reaction?", "a": "No."}, {"q": "How many O atoms are in 2 H₂O?", "a": "Two."}],
    "realLife": "Chemists count atoms to know how much of each ingredient to use.",
    "offScreen": "Put 10 coins in a cup. Split them into two cups. There are still 10.",
    "grownup": "Ask: If you start with 4 H atoms, how many H atoms must you end with?",
    "done": {"reactedCount": 2}
  },
  {
    "n": 17, "title": "Fire is a reaction", "level": "Challenge", "minutes": 15,
    "bigIdea": "Burning is a reaction between a fuel and oxygen. It makes heat. When a fuel made of carbon and hydrogen burns, it makes carbon dioxide and water.",
    "words": [["burning", "A fuel joining with oxygen and giving off heat."]],
    "tryIt": ["Find methane, oxygen, carbon dioxide and water.", "Put one CH₄ and two O₂ on the bench. Press Spark.", "Try propane: it needs five O₂."],
    "check": [{"q": "What does burning methane make?", "a": "Carbon dioxide and water."}, {"q": "Why does fire need air?", "a": "Air has the oxygen the fuel needs."}],
    "realLife": "Gas stoves, camp stoves and car engines all burn fuel. Only grown-ups handle real fire.",
    "offScreen": "With a grown-up, light a candle and cover it with a jar. Watch what happens.",
    "grownup": "Ask: Why does the candle go out under the jar?",
    "done": {"reactedAny": ["stove", "camp", "ethanolburn"]}
  },
  {
    "n": 18, "title": "Smells and flavors", "level": "Challenge", "minutes": 20,
    "bigIdea": "You smell something when its molecules float to your nose. Many smells and flavors come from molecules with a flat ring of carbons. Vanillin, the smell of vanilla, is one.",
    "words": [["ring", "Atoms joined in a circle."], ["benzene", "A flat ring of six carbons."]],
    "tryIt": ["Build benzene: six C atoms in a ring with alternating double bonds.", "Vanillin is big. Build it with a grown-up, or press Show me the shape.", "Turn it around and find the ring."],
    "check": [{"q": "What does vanillin smell like?", "a": "Vanilla."}, {"q": "What shape is benzene?", "a": "A flat ring."}],
    "realLife": "Vanilla, many perfumes and many dyes are made of ring molecules.",
    "offScreen": "Smell vanilla, lemon and mint. Each smell is a different molecule.",
    "grownup": "Ask: How does a smell get from the bottle to your nose?",
    "done": {"found": "vanillin"}
  },
  {
    "n": 19, "title": "Chemistry inside you", "level": "Challenge", "minutes": 20,
    "bigIdea": "Your body is full of molecules. Glucose is a sugar your body uses for energy. Amino acids join in chains to make proteins. Vitamin C helps your skin stay healthy.",
    "words": [["protein", "A long chain of amino acids."], ["amino acid", "A small building block of proteins."]],
    "tryIt": ["Build glycine, then glucose, then vitamin C. Use Show me the shape for help.", "Compare their shapes in My Atlas.", "Find the OH groups on glucose."],
    "check": [{"q": "What does your body use glucose for?", "a": "Energy."}, {"q": "What do amino acids build?", "a": "Proteins."}],
    "realLife": "Fruit, bread and eggs give you glucose, vitamin C and amino acids.",
    "offScreen": "Draw your lunch and write which part gives sugar, protein or vitamins.",
    "grownup": "Ask: What do you think your muscles are made of?",
    "done": {"foundAll": ["glycine", "glucose", "vitc"]}
  },
  {
    "n": 20, "title": "Patterns in the elements", "level": "Challenge", "minutes": 20,
    "bigIdea": "Elements in the same column of the periodic table act alike. Oxygen and sulfur both have 2 hands, so water, H₂O, and H₂S are both bent. Fluorine and chlorine both have 1 hand, so NaF and NaCl are alike.",
    "words": [["periodic table", "A chart that puts similar elements together."], ["family", "A column of elements that act alike."]],
    "tryIt": ["Build H₂S and compare its shape with water.", "Build NaF and compare it with salt.", "Guess: what would H and F make?"],
    "check": [{"q": "Why are H₂O and H₂S shaped alike?", "a": "Oxygen and sulfur are in the same family and both have 2 hands."}, {"q": "Which element is chlorine's family member in the game?", "a": "Fluorine."}],
    "realLife": "Chemists use patterns like these to guess how new materials will behave.",
    "offScreen": "Sort buttons by color, then by size, then by holes. Different sorting shows different patterns.",
    "grownup": "Ask: What is another pattern you can find in the tray of atoms?",
    "done": {"foundAll": ["h2s", "naf"]}
  },
  {
    "n": 21,
    "title": "Electrons live in clouds",
    "level": "Deep dive",
    "minutes": 15,
    "bigIdea": "An electron is not a tiny ball zooming around like a planet. It is better to picture a fuzzy cloud. The cloud is thick where the electron is likely to be. Chemists call each cloud shape an orbital. The simplest one, s, is a ball.",
    "words": [
      [
        "orbital",
        "A cloud shape that shows where an electron is likely to be."
      ],
      [
        "node",
        "A spot inside an orbital where the electron is never found."
      ]
    ],
    "tryIt": [
      "Open the Molecule Lab (the microscope button) and choose the Orbitals tab.",
      "Look at the 1s orbital. Each dot is one place the electron might be.",
      "Press Dots, then Shape, then both. Spin it around.",
      "Now press 2s. Find the ball inside a bigger ball. The gap between them is a node."
    ],
    "check": [
      {
        "q": "What is an orbital?",
        "a": "A cloud shape where an electron is likely to be."
      },
      {
        "q": "What shape is an s orbital?",
        "a": "A ball."
      }
    ],
    "realLife": "Hydrogen, the atom in every water molecule, has one electron in a 1s cloud.",
    "offScreen": "Spin a fan or a pencil very fast. It looks like a blurry shape instead of a single thing. An electron cloud is a little like that.",
    "grownup": "Ask: Why do you think chemists draw clouds instead of tiny circles?",
    "done": {
      "labAll": [
        "1s",
        "2s"
      ]
    }
  },
  {
    "n": 22,
    "title": "Dumbbells: the p orbitals",
    "level": "Deep dive",
    "minutes": 15,
    "bigIdea": "Bigger atoms also have p orbitals. A p orbital looks like a dumbbell with two lobes. There are three of them, pointing along x, y and z at right angles. The blue and orange colors show phase, like the up and down of a wave.",
    "words": [
      [
        "lobe",
        "One round part of an orbital."
      ],
      [
        "phase",
        "Whether the wave is up (blue) or down (orange)."
      ]
    ],
    "tryIt": [
      "In the Lab, Orbitals tab, press 2p (one).",
      "Find the two lobes and the node in the middle.",
      "Press 2p (all three) and spin it. Which way does each one point?"
    ],
    "check": [
      {
        "q": "What shape is a p orbital?",
        "a": "A dumbbell with two lobes."
      },
      {
        "q": "How many p orbitals are in a set?",
        "a": "Three."
      }
    ],
    "realLife": "Carbon, nitrogen and oxygen use p orbitals to make their bonds.",
    "offScreen": "Hold three pencils at right angles, like the corner of a box. Those are x, y and z.",
    "grownup": "Ask: What is the same about the three p orbitals? What is different?",
    "done": {
      "labAll": [
        "2p",
        "2p3"
      ]
    }
  },
  {
    "n": 23,
    "title": "Mixing orbitals: sp³",
    "level": "Deep dive",
    "minutes": 15,
    "bigIdea": "A carbon atom mixes its s orbital and its three p orbitals into four new matching orbitals called sp³. They point to the corners of a tiny pyramid. This is why methane and so many carbon molecules have that pyramid shape.",
    "words": [
      [
        "hybrid",
        "A new orbital made by mixing others."
      ],
      [
        "sp³",
        "One s and three p orbitals mixed together."
      ]
    ],
    "tryIt": [
      "In the Lab, Orbitals tab, press sp³ hybrid.",
      "Press Mix! and watch the ball and dumbbells turn into four lobes.",
      "Spin it. The white balls are hydrogens. Where do the lobes point?"
    ],
    "check": [
      {
        "q": "What does carbon mix to make sp³ orbitals?",
        "a": "One s and three p orbitals."
      },
      {
        "q": "Where do the four sp³ orbitals point?",
        "a": "To the corners of a tiny pyramid."
      }
    ],
    "realLife": "Every carbon with four single bonds, in methane, propane and sugar, uses sp³ orbitals.",
    "offScreen": "Mix blue and yellow paint to get green. Mixing makes something new, like mixing orbitals does.",
    "grownup": "Ask: Why might four matching orbitals be better for making four bonds?",
    "done": {
      "lab": "sp3"
    }
  },
  {
    "n": 24,
    "title": "The π bond: why double bonds stay flat",
    "level": "Deep dive",
    "minutes": 15,
    "bigIdea": "In ethene, the sticks are σ bonds, made by orbitals meeting head to head. The leftover p orbitals meet side by side above and below. That cloud is a π bond. To twist the molecule you would have to pull the π cloud apart, so the double bond stays flat.",
    "words": [
      [
        "σ bond (sigma)",
        "A bond where orbitals meet head to head."
      ],
      [
        "π bond (pi)",
        "A bond where p orbitals meet side by side."
      ]
    ],
    "tryIt": [
      "In the Lab, Orbitals tab, press π bond.",
      "Find the sticks (σ bonds) and the blue and orange clouds (π bond).",
      "Spin it. Is the molecule flat?"
    ],
    "check": [
      {
        "q": "Where is the π bond cloud?",
        "a": "Above and below the atoms."
      },
      {
        "q": "Why is the C=C double bond in ethene flat?",
        "a": "Twisting would pull the π cloud apart."
      }
    ],
    "realLife": "The flat double bond in the molecule that gives ripe bananas their signal, ethene, comes from its π bond.",
    "offScreen": "Hold two pencils side by side with a rubber band around them. You cannot twist one without the band resisting.",
    "grownup": "Ask: What do you think happens to a molecule if the π bond breaks?",
    "done": {
      "lab": "pi"
    }
  },
  {
    "n": 25,
    "title": "Molecular orbitals: two become two",
    "level": "Deep dive",
    "minutes": 20,
    "bigIdea": "When two atoms come close, their orbitals overlap and make two molecular orbitals. Adding the waves makes the bonding orbital, with electrons piled up between the nuclei. Subtracting them makes the antibonding orbital, with a node in the middle. Bond order = (bonding electrons − antibonding electrons) ÷ 2.",
    "words": [
      [
        "bonding orbital",
        "A molecular orbital that holds atoms together."
      ],
      [
        "antibonding orbital",
        "A molecular orbital that pushes atoms apart."
      ],
      [
        "bond order",
        "How many bonds: (bonding − antibonding) ÷ 2."
      ]
    ],
    "tryIt": [
      "In the Lab, open Molecular orbitals.",
      "Look at the σ bonding orbital. Where are most dots?",
      "Press σ* antibonding. Find the empty plane in the middle.",
      "Slide the distance. When do the orbitals overlap the most?"
    ],
    "check": [
      {
        "q": "What do you get when two atomic orbitals overlap?",
        "a": "Two molecular orbitals."
      },
      {
        "q": "Where are the electrons in a bonding orbital?",
        "a": "Between the two nuclei."
      }
    ],
    "realLife": "Chemists use molecular orbitals to design new materials, medicines and solar cells.",
    "offScreen": "Drop two pebbles in a pond near each other. The ripples add up in some places and cancel in others, a bit like orbitals do.",
    "grownup": "Ask: What do you think happens to the overlap when the atoms are very far apart?",
    "done": {
      "labAll": [
        "mo",
        "sigmastar"
      ]
    }
  },
  {
    "n": 26,
    "title": "Why helium stays alone",
    "level": "Deep dive",
    "minutes": 15,
    "bigIdea": "Use the electron counter to fill the orbitals. Two electrons go in the bonding orbital: a strong bond, bond order 1. With four electrons, both orbitals are full. The bonding and antibonding electrons cancel, so the bond order is zero. That is why helium atoms do not stick together.",
    "words": [
      [
        "noble gas",
        "An element like helium that does not like to bond."
      ]
    ],
    "tryIt": [
      "In the Lab, Molecular orbitals tab, slide Electrons to 1, 2, 3 and 4.",
      "Watch the arrows fill the diagram and the bond order change.",
      "Which count gives bond order 0? What does that mean?"
    ],
    "check": [
      {
        "q": "What is the bond order of H₂?",
        "a": "One."
      },
      {
        "q": "Why doesn't helium make He₂?",
        "a": "The bonding and antibonding electrons cancel."
      }
    ],
    "realLife": "Helium floats in party balloons as single atoms, because it never joins up with itself.",
    "offScreen": "Tug-of-war with two equal teams goes nowhere. Bonding and antibonding electrons are like two equal teams.",
    "grownup": "Ask: Why do you think hydrogen forms H₂ but helium does not form He₂?",
    "done": {
      "lab": "he2"
    }
  }
];
})(typeof globalThis !== 'undefined' ? globalThis : window);
