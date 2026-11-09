(function (root) {
'use strict';
const AA = root.AA = root.AA || {};

// Written for a very advanced 7-year-old working with a grown-up nearby.
// Valid JSON on purpose: tools/make_lesson_doc.py turns this into docs/LESSON_PLANS.md.
// done: {found:id} | {foundAll:[ids]} | {reacted:id} | {reactedAny:[ids]} | {reactedCount:n} | omitted = "Mark done" button
AA.LESSONS = [
    {
      "n": 1,
      "title": "Everything is made of atoms",
      "level": "Start here",
      "minutes": 10,
      "bigIdea": "Everything is made of atoms. Atoms are so tiny that you cannot see them. One hair on your head is hundreds of thousands of atoms wide.",
      "words": [
        [
          "atom",
          "A tiny piece of stuff. Everything is built from atoms."
        ],
        [
          "matter",
          "Anything you can touch or hold."
        ]
      ],
      "tryIt": [
        "Drag one white H atom onto the bench.",
        "Spin the view with your mouse. Scroll to zoom.",
        "Click the H button on the left (do not drag) to read about hydrogen."
      ],
      "check": [
        {
          "q": "Can you see atoms with your eyes?",
          "a": "No. They are too tiny."
        },
        {
          "q": "Name something that is made of atoms.",
          "a": "Anything works: a rock, water, air, you."
        }
      ],
      "realLife": "The air, the water you drink and your own body are all made of atoms.",
      "offScreen": "Walk around and find 10 things. Each one is made of atoms.",
      "grownup": "Ask: What do you think is inside a rock? Inside a puddle? Inside you?"
    },
    {
      "n": 2,
      "title": "Meet the elements",
      "level": "Start here",
      "minutes": 10,
      "bigIdea": "An element is one kind of atom. Each element has a short code called a symbol. H is hydrogen. C is carbon. N is nitrogen. O is oxygen.",
      "words": [
        [
          "element",
          "One kind of atom, like all hydrogen."
        ],
        [
          "symbol",
          "A short code for an element, like H or O."
        ]
      ],
      "tryIt": [
        "Click H, C, N and O on the left to open their cards.",
        "Look at each atom's color. Chemists use these colors too.",
        "Find the number called atomic number on each card."
      ],
      "check": [
        {
          "q": "What is the symbol for oxygen?",
          "a": "O."
        },
        {
          "q": "What is the symbol for carbon?",
          "a": "C."
        }
      ],
      "realLife": "Every chemist in every country uses the same symbols.",
      "offScreen": "Make four cards: H, C, N, O. Write the name on the back.",
      "grownup": "Quiz game: say a symbol and let them say the element. Then swap."
    },
    {
      "n": 3,
      "title": "Atoms have hands",
      "level": "Start here",
      "minutes": 10,
      "bigIdea": "Each atom likes to hold a certain number of other atoms. We call these its hands. Hydrogen has 1 hand. Oxygen has 2. Nitrogen has 3. Carbon has 4. Chemists call this number the valence.",
      "words": [
        [
          "bond",
          "A link that holds two atoms together."
        ],
        [
          "valence",
          "How many bonds an atom likes to make."
        ]
      ],
      "tryIt": [
        "Drag two H atoms onto the bench.",
        "Drop one on top of the other to make a bond.",
        "Watch the dots under each atom. Green means a hand is used. When all hands are used, the atom smiles."
      ],
      "check": [
        {
          "q": "How many hands does oxygen have?",
          "a": "Two."
        },
        {
          "q": "Why did the hydrogens smile?",
          "a": "Each has one hand, and the bond used it."
        }
      ],
      "realLife": "Two hydrogens joined together make hydrogen gas. It can fill balloons and fuel rockets.",
      "offScreen": "Hold hands with someone. You each used one hand, just like two hydrogens.",
      "grownup": "Ask: If an atom has 3 hands, how many other atoms can it hold?",
      "done": {
        "found": "hydrogen"
      }
    },
    {
      "n": 4,
      "title": "Sharing makes a bond",
      "level": "Start here",
      "minutes": 10,
      "bigIdea": "Atoms hold on to each other by sharing tiny bits called electrons. One shared pair is a single bond. Two shared pairs make a double bond. The oxygen you breathe has a double bond.",
      "words": [
        [
          "electron",
          "A tiny bit that atoms share to make a bond."
        ],
        [
          "double bond",
          "Two shared pairs between the same two atoms."
        ]
      ],
      "tryIt": [
        "Drag two O atoms. Drop one on the other to make a bond.",
        "Tap the gold + on the bond (or drop one O on the other again) to make a double bond. Now both smile.",
        "Click Electrons in the view buttons. Count the lines between the O atoms."
      ],
      "check": [
        {
          "q": "What do atoms share to make a bond?",
          "a": "Electrons."
        },
        {
          "q": "How many lines are between the O atoms?",
          "a": "Two. That is a double bond."
        }
      ],
      "realLife": "Every breath of oxygen you take is made of atoms joined by a double bond.",
      "offScreen": "Link two paper clips once. Then link them twice. Which is harder to pull apart?",
      "grownup": "Say: Sharing is how atoms stay together. Ask what else we hold on to by sharing.",
      "done": {
        "found": "oxygen"
      }
    },
    {
      "n": 5,
      "title": "Your first molecule: water",
      "level": "Start here",
      "minutes": 15,
      "bigIdea": "A molecule is atoms joined together. A formula tells you which atoms are in it. H₂O means 2 hydrogens and 1 oxygen. The little number tells you how many.",
      "words": [
        [
          "molecule",
          "Two or more atoms joined together."
        ],
        [
          "formula",
          "A short way to write which atoms are in a molecule."
        ]
      ],
      "tryIt": [
        "Drag one O atom onto the bench.",
        "Drop two H atoms on it, one at a time.",
        "Look at the formula under 'On your bench'. It says H₂O.",
        "Click an atom to poke it and read about it."
      ],
      "check": [
        {
          "q": "What does the little 2 in H₂O mean?",
          "a": "There are 2 hydrogen atoms."
        },
        {
          "q": "How many atoms are in one water molecule?",
          "a": "Three."
        }
      ],
      "realLife": "Oceans, rain and your body are mostly water.",
      "offScreen": "Fill a glass with water. It holds more water molecules than there are stars you can see.",
      "grownup": "Ask: What is the formula for two water molecules? (2 H₂O means 4 hydrogens and 2 oxygens.)",
      "done": {
        "found": "water"
      }
    },
    {
      "n": 6,
      "title": "Shape matters",
      "level": "Getting good",
      "minutes": 15,
      "bigIdea": "Molecules have shapes. Water is bent, like a boomerang. Carbon dioxide is straight, like a stick. The shape depends on how the atoms push on each other.",
      "words": [
        [
          "lone pair",
          "Two electrons on an atom that are not in a bond."
        ],
        [
          "straight",
          "Atoms in a line. Chemists say linear."
        ]
      ],
      "tryIt": [
        "Build water and turn it around to see the bend.",
        "Click Orbitals. The gold lobes on the O are lone pairs. They push the hydrogens close.",
        "Build CO₂: one C with a double bond to two O atoms. Is it bent or straight?"
      ],
      "check": [
        {
          "q": "Is water bent or straight?",
          "a": "Bent."
        },
        {
          "q": "Is carbon dioxide bent or straight?",
          "a": "Straight."
        }
      ],
      "realLife": "Water's bent shape is a big reason ice floats and salt can dissolve in it.",
      "offScreen": "Use marshmallows and toothpicks to make a bent molecule and a straight one.",
      "grownup": "Ask: Why do you think the gold lobes make the hydrogens squeeze together?",
      "done": {
        "found": "co2"
      }
    },
    {
      "n": 7,
      "title": "The air around you",
      "level": "Getting good",
      "minutes": 15,
      "bigIdea": "Air is mostly two molecules. About 78 out of every 100 are nitrogen, N₂. About 21 out of every 100 are oxygen, O₂. A tiny bit is carbon dioxide, CO₂.",
      "words": [
        [
          "gas",
          "Molecules flying around with lots of room."
        ],
        [
          "triple bond",
          "Three shared pairs between the same two atoms."
        ]
      ],
      "tryIt": [
        "Build N₂: drop one N on another three times to make a triple bond.",
        "Compare the O₂ and N₂ bonds in the Electrons view.",
        "Open My Atlas and read about N₂, O₂ and CO₂."
      ],
      "check": [
        {
          "q": "What is most of the air?",
          "a": "Nitrogen."
        },
        {
          "q": "How many shared pairs are in N₂?",
          "a": "Three, a triple bond."
        }
      ],
      "realLife": "You breathe in oxygen and breathe out carbon dioxide. Most of each breath is nitrogen.",
      "offScreen": "Wave a piece of paper and feel the air push back.",
      "grownup": "Ask: Why can't we see air if it is made of molecules?",
      "done": {
        "found": "nitrogen"
      }
    },
    {
      "n": 8,
      "title": "Carbon has four hands",
      "level": "Getting good",
      "minutes": 15,
      "bigIdea": "Carbon has four hands, so it can hold lots of atoms. That makes carbon the main building block of living things.",
      "words": [
        [
          "tetrahedron",
          "A shape like a tiny pyramid with four points."
        ],
        [
          "methane",
          "One carbon with four hydrogens."
        ]
      ],
      "tryIt": [
        "Drag one C onto the bench.",
        "Drop four H atoms on it.",
        "Turn it around. The H atoms point to the corners of a tiny pyramid."
      ],
      "check": [
        {
          "q": "How many hands does carbon have?",
          "a": "Four."
        },
        {
          "q": "What is the formula for methane?",
          "a": "CH₄."
        }
      ],
      "realLife": "Methane is the main part of the natural gas that heats many homes.",
      "offScreen": "Make a pyramid from 4 gumdrops and 6 toothpicks.",
      "grownup": "Ask: Why do you think the four H atoms spread out instead of bunching up?",
      "done": {
        "found": "methane"
      }
    },
    {
      "n": 9,
      "title": "Chains of carbon",
      "level": "Getting good",
      "minutes": 15,
      "bigIdea": "Carbon atoms can hold on to each other and make a chain. Fill the rest of the hands with hydrogen. Propane has three carbons in a row.",
      "words": [
        [
          "chain",
          "Atoms joined one after another."
        ],
        [
          "fuel",
          "Something we burn to get heat."
        ]
      ],
      "tryIt": [
        "Join three C atoms in a row.",
        "Fill every open hand with an H. You need 8 H atoms.",
        "Turn it. Why does the chain zig-zag?"
      ],
      "check": [
        {
          "q": "How many H atoms are in propane?",
          "a": "Eight."
        },
        {
          "q": "Why does the chain zig-zag?",
          "a": "Each carbon's four bonds point to the corners of a tiny pyramid."
        }
      ],
      "realLife": "Propane is the fuel in camp stoves and grills.",
      "offScreen": "Link paper clips into a chain. Try to make it perfectly straight.",
      "grownup": "Ask: How many H atoms would a chain of four carbons need? (10, and that is butane.)",
      "done": {
        "found": "propane"
      }
    },
    {
      "n": 10,
      "title": "Double and triple bonds",
      "level": "Getting good",
      "minutes": 15,
      "bigIdea": "Carbons can share more than one pair. A double bond is shorter and stronger than a single bond. A triple bond is even shorter and stronger. A double bond keeps atoms flat. A triple bond makes a straight line.",
      "words": [
        [
          "flat",
          "All the atoms sit on one flat sheet."
        ]
      ],
      "tryIt": [
        "Build ethylene: two C atoms with a double bond and two H on each.",
        "Build acetylene: two C atoms with a triple bond and one H on each.",
        "Which one is flat? Which one is a line?"
      ],
      "check": [
        {
          "q": "Which bond is shorter, single or double?",
          "a": "Double."
        },
        {
          "q": "How many H atoms are in acetylene?",
          "a": "Two."
        }
      ],
      "realLife": "Ripe bananas give off ethylene, and it makes nearby fruit ripen faster.",
      "offScreen": "Put a ripe banana in a paper bag with a green tomato. Check each day.",
      "grownup": "Ask: Why do you think carbon needs fewer H atoms when it has more bonds to another carbon?",
      "done": {
        "foundAll": [
          "ethene",
          "ethyne"
        ]
      }
    },
    {
      "n": 11,
      "title": "Same atoms, different molecule",
      "level": "Big kid chemistry",
      "minutes": 20,
      "bigIdea": "The same atoms can join in different ways to make different molecules. These are called isomers. Ethanol and dimethyl ether both have 2 C, 6 H and 1 O. Ethanol is a liquid. Dimethyl ether is a gas.",
      "words": [
        [
          "isomer",
          "A molecule that has the same atoms as another but joined in a different way."
        ]
      ],
      "tryIt": [
        "Build ethanol: C–C–O, with H atoms on every other hand.",
        "Now build the same atoms as C–O–C. The bench says: right atoms, different arrangement.",
        "Can you find a third way? (Hint: you cannot. Try!)"
      ],
      "check": [
        {
          "q": "Can two molecules have the same atoms but be different?",
          "a": "Yes. How they are joined matters."
        },
        {
          "q": "What is an isomer?",
          "a": "Same atoms, different arrangement."
        }
      ],
      "realLife": "Medicines can work very differently when the atoms are joined in a different way.",
      "offScreen": "Build two different things from the same 6 LEGO bricks.",
      "grownup": "Ask: What is the same about two isomers? What is different?",
      "done": {
        "found": "ethanol"
      }
    },
    {
      "n": 12,
      "title": "Salt: giving, not sharing",
      "level": "Big kid chemistry",
      "minutes": 15,
      "bigIdea": "In water, atoms share. In salt, sodium gives away one electron to chlorine. Now sodium is positive and chlorine is negative. Opposite charges stick together. This is an ionic bond. The game draws it as a dashed line.",
      "words": [
        [
          "ion",
          "An atom with a charge because it gave or took an electron."
        ],
        [
          "ionic bond",
          "Positive and negative atoms sticking together."
        ]
      ],
      "tryIt": [
        "Find enough molecules to unlock Na and Cl.",
        "Drop Na onto Cl.",
        "Look for the dashed line and the + and − signs."
      ],
      "check": [
        {
          "q": "What does sodium do with its electron?",
          "a": "It gives it to chlorine."
        },
        {
          "q": "What is the dashed line?",
          "a": "An ionic bond."
        }
      ],
      "realLife": "Table salt is sodium chloride. A grain of salt is a crystal of billions of ions.",
      "offScreen": "Stir a spoon of salt into warm water until it disappears. Do not drink it.",
      "grownup": "Ask: How is giving different from sharing?",
      "done": {
        "found": "salt"
      }
    },
    {
      "n": 13,
      "title": "Sour acids",
      "level": "Big kid chemistry",
      "minutes": 15,
      "bigIdea": "Acids taste sour. Vinegar has acetic acid. Lemons have citric acid. Fizzy water has a little carbonic acid. Many acids have a COOH group on them.",
      "words": [
        [
          "acid",
          "Something that tastes sour and can give away a hydrogen."
        ],
        [
          "group",
          "A small bunch of atoms stuck on a molecule, like COOH."
        ]
      ],
      "tryIt": [
        "Build acetic acid. Find the COOH end in the Electrons view.",
        "Build carbonic acid.",
        "Compare them."
      ],
      "check": [
        {
          "q": "What makes vinegar sour?",
          "a": "Acetic acid."
        },
        {
          "q": "Where do you find citric acid?",
          "a": "Lemons and limes."
        }
      ],
      "realLife": "Acids give lemons, vinegar and many candies their tang. Never taste unknown chemicals.",
      "offScreen": "With a grown-up, put a spoon of baking soda in a cup and add a little vinegar. The bubbles are carbon dioxide.",
      "grownup": "Ask: What is bubbling when baking soda meets vinegar? (Carbon dioxide gas.)",
      "done": {
        "foundAll": [
          "acetic",
          "carbonic"
        ]
      }
    },
    {
      "n": 14,
      "title": "Heat makes atoms move",
      "level": "Big kid chemistry",
      "minutes": 10,
      "bigIdea": "Heat makes molecules move faster. In ice they just wiggle in place. In water they slide around. In steam they zoom everywhere.",
      "words": [
        [
          "temperature",
          "How fast the tiny pieces are moving."
        ],
        [
          "solid, liquid, gas",
          "Three ways stuff can be: hard, runny or airy."
        ]
      ],
      "tryIt": [
        "In the Lab, open How reactions happen.",
        "Slide Heat all the way up and watch the molecules speed up.",
        "Slide Heat down again. How does the motion change?"
      ],
      "check": [
        {
          "q": "What does heat do to molecules?",
          "a": "Makes them move faster."
        },
        {
          "q": "Which has molecules moving most, ice, water or steam?",
          "a": "Steam."
        }
      ],
      "realLife": "Ice melts because heat makes water molecules move enough to slide.",
      "offScreen": "Put an ice cube in warm water and another in cold water. Which melts faster?",
      "grownup": "Ask: Why does a hot drink stop steaming as it cools?"
    },
    {
      "n": 15,
      "title": "Reactions rearrange atoms",
      "level": "Big kid chemistry",
      "minutes": 15,
      "bigIdea": "In a reaction, bonds break and new bonds form. The atoms are the same, but they join up in new ways to make new molecules.",
      "words": [
        [
          "reaction",
          "Atoms joining up in new ways."
        ],
        [
          "product",
          "The new molecule you make."
        ]
      ],
      "tryIt": [
        "Find hydrogen, oxygen and water.",
        "Open My Atlas and put two H₂ and one O₂ on the bench.",
        "Press Spark in the Reactions box and watch."
      ],
      "check": [
        {
          "q": "What do you start with in 2 H₂ + O₂?",
          "a": "Hydrogen and oxygen."
        },
        {
          "q": "What do you make?",
          "a": "Water."
        }
      ],
      "realLife": "Rockets can burn hydrogen with oxygen. All you get out is water.",
      "offScreen": "Take apart a LEGO model and build a new one with the same bricks.",
      "grownup": "Ask: Where did the water's atoms come from?",
      "done": {
        "reacted": "rocket"
      }
    },
    {
      "n": 16,
      "title": "Atoms never disappear",
      "level": "Challenge",
      "minutes": 15,
      "bigIdea": "In a reaction, no atoms are made and no atoms vanish. You end up with exactly the same atoms you started with, just joined differently. This is called conservation of mass.",
      "words": [
        [
          "conservation of mass",
          "The atoms never disappear or appear."
        ]
      ],
      "tryIt": [
        "Do two different reactions from the Reactions box.",
        "Before each Spark, count the atoms on the bench.",
        "After Spark, count again. Same numbers!"
      ],
      "check": [
        {
          "q": "Do atoms disappear in a reaction?",
          "a": "No."
        },
        {
          "q": "How many O atoms are in 2 H₂O?",
          "a": "Two."
        }
      ],
      "realLife": "Chemists count atoms to know how much of each ingredient to use.",
      "offScreen": "Put 10 coins in a cup. Split them into two cups. There are still 10.",
      "grownup": "Ask: If you start with 4 H atoms, how many H atoms must you end with?",
      "done": {
        "reactedCount": 2
      }
    },
    {
      "n": 17,
      "title": "Fire is a reaction",
      "level": "Challenge",
      "minutes": 15,
      "bigIdea": "Burning is a reaction between a fuel and oxygen. It makes heat. When a fuel made of carbon and hydrogen burns, it makes carbon dioxide and water.",
      "words": [
        [
          "burning",
          "A fuel joining with oxygen and giving off heat."
        ]
      ],
      "tryIt": [
        "Find methane, oxygen, carbon dioxide and water.",
        "Put one CH₄ and two O₂ on the bench. Press Spark.",
        "Try propane: it needs five O₂."
      ],
      "check": [
        {
          "q": "What does burning methane make?",
          "a": "Carbon dioxide and water."
        },
        {
          "q": "Why does fire need air?",
          "a": "Air has the oxygen the fuel needs."
        }
      ],
      "realLife": "Gas stoves, camp stoves and car engines all burn fuel. Only grown-ups handle real fire.",
      "offScreen": "With a grown-up, light a candle and cover it with a jar. Watch what happens.",
      "grownup": "Ask: Why does the candle go out under the jar?",
      "done": {
        "reactedAny": [
          "stove",
          "camp",
          "ethanolburn"
        ]
      }
    },
    {
      "n": 18,
      "title": "Smells and flavors",
      "level": "Challenge",
      "minutes": 20,
      "bigIdea": "You smell something when its molecules float to your nose. Many smells and flavors come from molecules with a flat ring of carbons. Vanillin, the smell of vanilla, is one.",
      "words": [
        [
          "ring",
          "Atoms joined in a circle."
        ],
        [
          "benzene",
          "A flat ring of six carbons."
        ]
      ],
      "tryIt": [
        "Build benzene: six C atoms in a ring with alternating double bonds.",
        "Vanillin is big. Build it with a grown-up, or press Show me the shape.",
        "Turn it around and find the ring."
      ],
      "check": [
        {
          "q": "What does vanillin smell like?",
          "a": "Vanilla."
        },
        {
          "q": "What shape is benzene?",
          "a": "A flat ring."
        }
      ],
      "realLife": "Vanilla, many perfumes and many dyes are made of ring molecules.",
      "offScreen": "Smell vanilla, lemon and mint. Each smell is a different molecule.",
      "grownup": "Ask: How does a smell get from the bottle to your nose?",
      "done": {
        "found": "vanillin"
      }
    },
    {
      "n": 19,
      "title": "Chemistry inside you",
      "level": "Challenge",
      "minutes": 20,
      "bigIdea": "Your body is full of molecules. Glucose is a sugar your body uses for energy. Amino acids join in chains to make proteins. Vitamin C helps your skin stay healthy.",
      "words": [
        [
          "protein",
          "A long chain of amino acids."
        ],
        [
          "amino acid",
          "A small building block of proteins."
        ]
      ],
      "tryIt": [
        "Build glycine, then glucose, then vitamin C. Use Show me the shape for help.",
        "Compare their shapes in My Atlas.",
        "Find the OH groups on glucose."
      ],
      "check": [
        {
          "q": "What does your body use glucose for?",
          "a": "Energy."
        },
        {
          "q": "What do amino acids build?",
          "a": "Proteins."
        }
      ],
      "realLife": "Fruit, bread and eggs give you glucose, vitamin C and amino acids.",
      "offScreen": "Draw your lunch and write which part gives sugar, protein or vitamins.",
      "grownup": "Ask: What do you think your muscles are made of?",
      "done": {
        "foundAll": [
          "glycine",
          "glucose",
          "vitc"
        ]
      }
    },
    {
      "n": 20,
      "title": "Patterns in the elements",
      "level": "Challenge",
      "minutes": 20,
      "bigIdea": "Elements in the same column of the periodic table act alike. Oxygen and sulfur both have 2 hands, so water, H₂O, and H₂S are both bent. Fluorine and chlorine both have 1 hand, so NaF and NaCl are alike.",
      "words": [
        [
          "periodic table",
          "A chart that puts similar elements together."
        ],
        [
          "family",
          "A column of elements that act alike."
        ]
      ],
      "tryIt": [
        "Build H₂S and compare its shape with water.",
        "Build NaF and compare it with salt.",
        "Guess: what would H and F make?"
      ],
      "check": [
        {
          "q": "Why are H₂O and H₂S shaped alike?",
          "a": "Oxygen and sulfur are in the same family and both have 2 hands."
        },
        {
          "q": "Which element is chlorine's family member in the game?",
          "a": "Fluorine."
        }
      ],
      "realLife": "Chemists use patterns like these to guess how new materials will behave.",
      "offScreen": "Sort buttons by color, then by size, then by holes. Different sorting shows different patterns.",
      "grownup": "Ask: What is another pattern you can find in the tray of atoms?",
      "done": {
        "foundAll": [
          "h2s",
          "naf"
        ]
      }
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
    },
    {
      "n": 27,
      "title": "Reactions start with a crash",
      "level": "Advanced",
      "minutes": 20,
      "bigIdea": "For molecules to react, they have to bump into each other. A gentle bump does nothing. The bump has to be hard enough, and the molecules have to hit the right way around. Only then do old bonds break and new bonds form.",
      "words": [
        [
          "collision",
          "Two molecules bumping into each other."
        ],
        [
          "collision theory",
          "The idea that a reaction needs a hard enough bump, the right way around."
        ]
      ],
      "tryIt": [
        "Open the Molecule Lab and choose How reactions happen.",
        "Watch the red pairs and green pairs zoom around the box.",
        "Look at the numbers under the box. How many bumps were too gentle? How many were the wrong way round?",
        "Wait for a reaction. A red pair and a green pair swap partners and flash gold."
      ],
      "check": [
        {
          "q": "What has to happen for molecules to react?",
          "a": "They bump hard enough, the right way around."
        },
        {
          "q": "What happens in a bump that is too gentle?",
          "a": "The molecules bounce off and stay the same."
        }
      ],
      "realLife": "Wood does not burn just because it sits in air full of oxygen. The molecules need hard enough bumps, which is why you have to light it. Real reactions can have extra steps, and this lab is a simplified model.",
      "offScreen": "Roll two toy cars into each other slowly, then fast. A slow bump just bounces. Only a hard bump does something.",
      "grownup": "Ask: Why do you think most bumps do not make a reaction?",
      "done": {
        "lab": "rxn_react"
      }
    },
    {
      "n": 28,
      "title": "Breaking and making bonds",
      "level": "Advanced",
      "minutes": 20,
      "bigIdea": "In a reaction, old bonds break and new bonds form. Breaking bonds takes energy in. Making bonds gives energy out. If more energy comes out than went in, the reaction gives off heat. That is exothermic. If more goes in than comes out, it takes in heat. That is endothermic.",
      "words": [
        [
          "exothermic",
          "A reaction that gives off heat."
        ],
        [
          "endothermic",
          "A reaction that takes in heat."
        ]
      ],
      "tryIt": [
        "In the Lab, How reactions happen, find the energy hill picture.",
        "Slide Energy change toward 'gives off heat'. The products end lower than the reactants.",
        "Slide it the other way. Now the products end higher.",
        "Watch the box. When a reaction gives off heat, the new molecules zoom away faster."
      ],
      "check": [
        {
          "q": "What does exothermic mean?",
          "a": "The reaction gives off heat."
        },
        {
          "q": "What happens when bonds break?",
          "a": "Energy goes in."
        }
      ],
      "realLife": "A campfire gives off heat and light. Plants take in light energy to make sugar, so that reaction takes in energy.",
      "offScreen": "Feel a warm hand warmer or a cold pack with a grown-up. One gives out heat, and one takes it in.",
      "grownup": "For a grown-up: in H₂ + Cl₂ → 2 HCl, breaking H–H (about 436 kJ/mol) and Cl–Cl (about 243) costs about 679. Making two H–Cl bonds (about 431 each) returns about 862. The net is about 183 kJ/mol released. Ask: which side was bigger, breaking or making?",
      "done": {
        "lab": "rxn_dh"
      }
    },
    {
      "n": 29,
      "title": "The energy hill",
      "level": "Advanced",
      "minutes": 20,
      "bigIdea": "Even reactions that give off lots of heat need a push to start. The push is called activation energy, and we draw it as a hill. Molecules need enough energy to get over the top. A spark gives hydrogen and oxygen enough energy to get over the hill, and then they react all at once.",
      "words": [
        [
          "activation energy",
          "The energy push needed to start a reaction."
        ]
      ],
      "tryIt": [
        "In the Lab, How reactions happen, slide Hill height up and down.",
        "Set the hill high. How many bumps are hard enough now?",
        "Set it low. What happens in the box?",
        "Find a hill height where the reaction is slow, and one where it is fast."
      ],
      "check": [
        {
          "q": "What is activation energy?",
          "a": "The push needed to start a reaction."
        },
        {
          "q": "What does a higher hill do to a reaction?",
          "a": "Fewer bumps are hard enough, so it is slower."
        }
      ],
      "realLife": "Hydrogen and oxygen can sit together in a tank without reacting. Add a spark and they react at once.",
      "offScreen": "Roll a ball toward a small hill and a big hill. It needs a bigger push for the big one.",
      "grownup": "Ask: Why is a spark needed even though the reaction gives off lots of heat?",
      "done": {
        "lab": "rxn_ea"
      }
    },
    {
      "n": 30,
      "title": "Making reactions faster",
      "level": "Advanced",
      "minutes": 20,
      "bigIdea": "Three things speed up reactions. Heat makes molecules move faster, so more bumps are hard enough. Crowding puts more molecules in the same space, so there are more bumps. A catalyst is a helper that makes the hill lower. A catalyst is not used up.",
      "words": [
        [
          "catalyst",
          "A helper that speeds up a reaction and is not used up."
        ],
        [
          "concentration",
          "How crowded the molecules are."
        ]
      ],
      "tryIt": [
        "In the Lab, How reactions happen, press Start again and turn Heat up. Watch the reaction speed.",
        "Turn Heat down, then tick Add a catalyst. Does it still react?",
        "Try more Crowding.",
        "Which one helped the most?"
      ],
      "check": [
        {
          "q": "What does a catalyst do?",
          "a": "It lowers the hill so reactions are faster."
        },
        {
          "q": "Why does heat speed up a reaction?",
          "a": "Molecules move faster, so more bumps are hard enough."
        }
      ],
      "realLife": "Enzymes in your body are catalysts that help break down food. A car has a catalytic converter that helps clean its exhaust. A fridge slows down the reactions that spoil food.",
      "offScreen": "With a grown-up, drop the same amount of sugar into warm and cold water. Which dissolves faster? Heat speeds up many changes.",
      "grownup": "Ask: Why does food spoil more slowly in the fridge?",
      "done": {
        "labAll": [
          "rxn_hot",
          "rxn_cat"
        ]
      }
    },
    {
      "n": 31,
      "title": "Balancing equations",
      "level": "Advanced",
      "minutes": 20,
      "bigIdea": "A chemical equation is a recipe. The molecules you start with are on the left and the molecules you make are on the right. Atoms never disappear, so each kind of atom must have the same count on both sides. Balancing means adding numbers in front of molecules until the counts match, like 2 H₂ + O₂ → 2 H₂O.",
      "words": [
        [
          "equation",
          "A recipe for a reaction, written with formulas."
        ],
        [
          "coefficient",
          "The big number in front of a molecule."
        ]
      ],
      "tryIt": [
        "Open the Reactions box on the bench and read each equation.",
        "Pick CH₄ + 2 O₂ → CO₂ + 2 H₂O. Count the C, H and O on each side.",
        "Put the molecules on the bench from My Atlas and press Spark.",
        "Run at least four different reactions."
      ],
      "check": [
        {
          "q": "How many hydrogen atoms are in 2 H₂O?",
          "a": "Four."
        },
        {
          "q": "Why must an equation balance?",
          "a": "Atoms never disappear or appear."
        }
      ],
      "realLife": "Chemists balance equations to know exactly how much of each ingredient a factory needs.",
      "offScreen": "Count the wheels on 3 bikes and 2 cars. Balancing is counting parts on both sides.",
      "grownup": "Ask: If you start with 6 oxygen atoms, how many must you end with?",
      "done": {
        "reactedCount": 4
      }
    },
    {
      "n": 32,
      "title": "Inside the atom",
      "level": "Inside the atom",
      "minutes": 15,
      "bigIdea": "An atom has a tiny center called the nucleus. It holds protons, which are positive, and neutrons, which have no charge. Electrons, which are negative, are outside the nucleus in clouds. An atom usually has as many electrons as protons, so it has no overall charge.",
      "words": [
        [
          "proton",
          "A positive particle in the nucleus."
        ],
        [
          "neutron",
          "A particle with no charge in the nucleus."
        ],
        [
          "electron",
          "A tiny negative particle outside the nucleus."
        ]
      ],
      "tryIt": [
        "Click H, C and O in the atom tray to open their cards.",
        "Count the dots on each card. Each dot is an electron.",
        "Hydrogen has 1 electron, carbon has 6 and oxygen has 8."
      ],
      "check": [
        {
          "q": "Which particle has a positive charge?",
          "a": "Proton. Protons are positive, electrons are negative and neutrons have no charge."
        },
        {
          "q": "How many electrons does a carbon atom have?",
          "a": "6. Carbon has 2 electrons in its first shell and 4 in its second."
        }
      ],
      "quiz": [
        [
          "Which particle has a positive charge?",
          "Proton",
          "Electron",
          "Neutron",
          "Protons are positive, electrons are negative and neutrons have no charge."
        ],
        [
          "How many electrons does a carbon atom have?",
          "6",
          "4",
          "12",
          "Carbon has 2 electrons in its first shell and 4 in its second."
        ]
      ],
      "realLife": "Everything you touch is made of these three particles.",
      "offScreen": "Draw an atom with a nucleus in the middle and electrons around it. Label the protons and neutrons.",
      "grownup": "Ask: If an atom has 8 protons and no overall charge, how many electrons does it have?"
    },
    {
      "n": 33,
      "title": "The nucleus is tiny",
      "level": "Inside the atom",
      "minutes": 15,
      "bigIdea": "The nucleus is incredibly small compared with the whole atom. If an atom were as big as a football stadium, the nucleus would be about the size of a grain of sand in the middle. Almost all of the atom's weight is in that tiny nucleus. Most of an atom is empty space where the electron cloud is.",
      "words": [
        [
          "mass",
          "How much stuff something is made of."
        ]
      ],
      "tryIt": [
        "Open the Molecule Lab, then Orbitals, and look at the 1s cloud.",
        "Find the tiny gold dot in the middle. That is the nucleus.",
        "Compare the size of the dot with the whole cloud."
      ],
      "check": [
        {
          "q": "Where is most of an atom's weight?",
          "a": "In the tiny nucleus. Protons and neutrons are much heavier than electrons."
        },
        {
          "q": "What is most of an atom's volume?",
          "a": "Empty space with an electron cloud. The nucleus is tiny and the cloud is large."
        }
      ],
      "quiz": [
        [
          "Where is most of an atom's weight?",
          "In the tiny nucleus",
          "In the electron cloud",
          "Spread out evenly",
          "Protons and neutrons are much heavier than electrons."
        ],
        [
          "What is most of an atom's volume?",
          "Empty space with an electron cloud",
          "Solid metal",
          "The nucleus",
          "The nucleus is tiny and the cloud is large."
        ]
      ],
      "realLife": "Even a solid steel bar is mostly empty space at the atom level. It feels solid because of the forces between atoms.",
      "offScreen": "Imagine a speck of dust in the middle of a big empty hall. That is about how small a nucleus is compared with its atom.",
      "grownup": "Ask: If atoms are mostly empty space, why can't you walk through a wall?"
    },
    {
      "n": 34,
      "title": "Atomic number: what makes an element",
      "level": "Inside the atom",
      "minutes": 15,
      "bigIdea": "The number of protons decides which element an atom is. Hydrogen has 1 proton, carbon has 6 and oxygen has 8. This number is called the atomic number. Change the number of protons and you have a different element.",
      "words": [
        [
          "atomic number",
          "The number of protons in an atom."
        ]
      ],
      "tryIt": [
        "Open the cards for H, C, N and O.",
        "Find the atomic number on each card.",
        "Put the four elements in order from smallest to largest atomic number."
      ],
      "check": [
        {
          "q": "What decides which element an atom is?",
          "a": "The number of protons. The atomic number is the number of protons."
        },
        {
          "q": "Which has more protons, nitrogen or oxygen?",
          "a": "Oxygen (8 compared with 7). Nitrogen is number 7 and oxygen is number 8."
        }
      ],
      "quiz": [
        [
          "What decides which element an atom is?",
          "The number of protons",
          "The number of neutrons",
          "Its color",
          "The atomic number is the number of protons."
        ],
        [
          "Which has more protons, nitrogen or oxygen?",
          "Oxygen (8 compared with 7)",
          "Nitrogen",
          "They are the same",
          "Nitrogen is number 7 and oxygen is number 8."
        ]
      ],
      "realLife": "Gold has 79 protons. Lead has 82. Changing one into the other would mean changing the nucleus, which chemical reactions cannot do.",
      "offScreen": "Write the numbers 1 to 20 and next to each write the element you know. Count how many you can find.",
      "grownup": "Ask: What would an atom with 1 proton be?"
    },
    {
      "n": 35,
      "title": "Electron shells",
      "level": "Inside the atom",
      "minutes": 15,
      "bigIdea": "Electrons sit in layers called shells around the nucleus. The first shell holds up to 2 electrons. The second shell holds up to 8. Electrons fill the inner shells first.",
      "words": [
        [
          "shell",
          "A layer where electrons live around the nucleus."
        ]
      ],
      "tryIt": [
        "Open the card for oxygen. Count 2 electrons in the inner ring and 6 in the outer ring.",
        "Open the card for carbon. How many in each ring?",
        "Find the gold dots. These are the outer electrons."
      ],
      "check": [
        {
          "q": "How many electrons fit in the first shell?",
          "a": "2. The first shell is small and holds only 2."
        },
        {
          "q": "Oxygen has 8 electrons in total. How many are in its outer shell?",
          "a": "6. Two go in the first shell and the other 6 go in the second."
        }
      ],
      "quiz": [
        [
          "How many electrons fit in the first shell?",
          "2",
          "8",
          "1",
          "The first shell is small and holds only 2."
        ],
        [
          "Oxygen has 8 electrons in total. How many are in its outer shell?",
          "6",
          "8",
          "2",
          "Two go in the first shell and the other 6 go in the second."
        ]
      ],
      "realLife": "The outer electrons decide how an atom bonds, which is why chemistry mostly cares about them.",
      "offScreen": "Stack a small cup inside a bigger cup. The small one is the first shell and the bigger one is the second.",
      "grownup": "Ask: Why do you think the inner shell fills up first?"
    },
    {
      "n": 36,
      "title": "Outer electrons and the hands",
      "level": "Inside the atom",
      "minutes": 20,
      "bigIdea": "The outer electrons are called valence electrons. Atoms like to have a full outer shell, which is 2 electrons for hydrogen and 8 for most others. The hands you see in the game show how many electrons an atom needs to fill its outer shell. Oxygen has 6 and needs 2 more, so it has 2 hands.",
      "words": [
        [
          "valence electron",
          "An electron in the outer shell that can make bonds."
        ]
      ],
      "tryIt": [
        "Look at the gold dots on the cards for H, C, N and O.",
        "Count how many more electrons each would need to fill its outer shell.",
        "Check that this matches its hands: 1, 4, 3 and 2.",
        "Build water and watch the oxygen's hands fill up."
      ],
      "check": [
        {
          "q": "How many outer electrons does oxygen have?",
          "a": "6. Oxygen has 6 outer electrons."
        },
        {
          "q": "Why does oxygen make 2 bonds?",
          "a": "It needs 2 more electrons to fill its outer shell. Each bond shares one more electron with oxygen."
        }
      ],
      "quiz": [
        [
          "How many outer electrons does oxygen have?",
          "6",
          "2",
          "8",
          "Oxygen has 6 outer electrons."
        ],
        [
          "Why does oxygen make 2 bonds?",
          "It needs 2 more electrons to fill its outer shell",
          "It has 2 protons",
          "It likes the number 2",
          "Each bond shares one more electron with oxygen."
        ]
      ],
      "realLife": "This idea, the octet rule, helps chemists guess the formulas of thousands of molecules.",
      "offScreen": "Make an egg carton with 8 cups. Put 6 beans in it. How many more does it need to be full?",
      "grownup": "Ask: How many hands would an atom with 7 outer electrons have?",
      "done": {
        "found": "water"
      }
    },
    {
      "n": 37,
      "title": "Isotopes",
      "level": "Inside the atom",
      "minutes": 15,
      "bigIdea": "Atoms of the same element can have different numbers of neutrons. These are called isotopes. Carbon-12 has 6 neutrons and carbon-14 has 8. They are both carbon because they both have 6 protons.",
      "words": [
        [
          "isotope",
          "A version of an element with a different number of neutrons."
        ]
      ],
      "tryIt": [
        "Open the card for carbon and find its atomic number, 6.",
        "Carbon-12 has 6 neutrons. Carbon-14 has 8. How many protons does each have?",
        "Which part of the atom is the same, and which is different?"
      ],
      "check": [
        {
          "q": "What is different between isotopes of an element?",
          "a": "The number of neutrons. Isotopes have the same protons but different neutrons."
        },
        {
          "q": "Carbon-12 and carbon-14 both have how many protons?",
          "a": "6. Same element means the same number of protons."
        }
      ],
      "quiz": [
        [
          "What is different between isotopes of an element?",
          "The number of neutrons",
          "The number of protons",
          "The element's name",
          "Isotopes have the same protons but different neutrons."
        ],
        [
          "Carbon-12 and carbon-14 both have how many protons?",
          "6",
          "12",
          "14",
          "Same element means the same number of protons."
        ]
      ],
      "realLife": "Scientists measure carbon-14 in old wood and bones to find out how old they are.",
      "offScreen": "Make two models from the same number of red beads (protons) but different numbers of white beads (neutrons).",
      "grownup": "Ask: Why does carbon-14 still behave like carbon in chemistry?"
    },
    {
      "n": 38,
      "title": "The periodic table",
      "level": "Inside the atom",
      "minutes": 20,
      "bigIdea": "The periodic table lists the elements in order of atomic number. The rows are called periods and the columns are called groups. Elements in the same group act alike because they have the same number of outer electrons.",
      "words": [
        [
          "period",
          "A row of the periodic table."
        ],
        [
          "group",
          "A column of the periodic table."
        ]
      ],
      "tryIt": [
        "Open the cards for oxygen and sulfur. Both have 6 outer electrons.",
        "Open the cards for fluorine and chlorine. Both have 7.",
        "Notice that each pair makes the same number of bonds."
      ],
      "check": [
        {
          "q": "What are the columns of the periodic table called?",
          "a": "Groups. Columns are groups and rows are periods."
        },
        {
          "q": "Why do oxygen and sulfur act alike?",
          "a": "They are in the same group, with the same number of outer electrons. Same group means the same number of outer electrons."
        }
      ],
      "quiz": [
        [
          "What are the columns of the periodic table called?",
          "Groups",
          "Periods",
          "Shells",
          "Columns are groups and rows are periods."
        ],
        [
          "Why do oxygen and sulfur act alike?",
          "They are in the same group, with the same number of outer electrons",
          "They are both gases",
          "They have the same color",
          "Same group means the same number of outer electrons."
        ]
      ],
      "realLife": "Dmitri Mendeleev built an early periodic table in 1869 and used the patterns to predict elements nobody had found yet.",
      "offScreen": "Sort a handful of buttons into a table with columns for color and rows for size.",
      "grownup": "Ask: What pattern in the tray of atoms can you find?"
    },
    {
      "n": 39,
      "title": "Metals and nonmetals",
      "level": "Inside the atom",
      "minutes": 15,
      "bigIdea": "Most elements are metals. Metals are shiny, they carry heat and electricity well, and they can be bent. Nonmetals like oxygen, carbon and chlorine are usually dull and brittle in solid form. In a bond, a metal tends to give electrons away and a nonmetal tends to take them.",
      "words": [
        [
          "metal",
          "A shiny element that conducts heat and electricity."
        ],
        [
          "nonmetal",
          "An element that is usually dull and does not conduct well."
        ]
      ],
      "tryIt": [
        "Open the card for sodium. Read what it says about its properties.",
        "Build table salt, NaCl.",
        "Find the dashed line. Sodium, a metal, gives its electron to chlorine, a nonmetal."
      ],
      "check": [
        {
          "q": "What does a metal usually do with its outer electrons in a bond?",
          "a": "Gives them away. Metals lose electrons and become positive ions."
        },
        {
          "q": "Which of these is a metal?",
          "a": "Sodium. Sodium is a soft, shiny metal."
        }
      ],
      "quiz": [
        [
          "What does a metal usually do with its outer electrons in a bond?",
          "Gives them away",
          "Takes more",
          "Keeps all of them",
          "Metals lose electrons and become positive ions."
        ],
        [
          "Which of these is a metal?",
          "Sodium",
          "Chlorine",
          "Oxygen",
          "Sodium is a soft, shiny metal."
        ]
      ],
      "realLife": "Wires are made of metals because they carry electricity well.",
      "offScreen": "Find five things in your home made of metal. What do they have in common?",
      "grownup": "Ask: Why might a pan be metal but its handle be plastic?",
      "done": {
        "found": "salt"
      }
    },
    {
      "n": 40,
      "title": "Noble gases",
      "level": "Inside the atom",
      "minutes": 15,
      "bigIdea": "Helium, neon and argon are noble gases. Their outer shells are already full, so they hardly ever bond with anything. They exist as single atoms, not molecules.",
      "words": [
        [
          "noble gas",
          "An element with a full outer shell that rarely reacts."
        ]
      ],
      "tryIt": [
        "In the Lab, open Molecular orbitals and set Electrons to 4.",
        "That is like two helium atoms: the bonding and antibonding electrons cancel out.",
        "Read what the game says about He₂."
      ],
      "check": [
        {
          "q": "Why do noble gases rarely react?",
          "a": "Their outer shell is already full. A full outer shell means no need to share or take electrons."
        },
        {
          "q": "What is a helium balloon filled with?",
          "a": "Single helium atoms. Helium atoms do not join up."
        }
      ],
      "quiz": [
        [
          "Why do noble gases rarely react?",
          "Their outer shell is already full",
          "They are too heavy",
          "They are very rare",
          "A full outer shell means no need to share or take electrons."
        ],
        [
          "What is a helium balloon filled with?",
          "Single helium atoms",
          "He₂ molecules",
          "Hydrogen molecules",
          "Helium atoms do not join up."
        ]
      ],
      "realLife": "Neon makes bright orange-red glowing signs, and helium makes balloons float.",
      "offScreen": "Blow up a balloon and let it go. Air is mostly N₂ and O₂. A helium balloon would float, because helium is lighter than air.",
      "grownup": "Ask: What would it take to make helium react?"
    },
    {
      "n": 41,
      "title": "Sharing or giving? Electronegativity",
      "level": "Bonds and groups",
      "minutes": 20,
      "bigIdea": "Electronegativity is how hard an atom pulls on shared electrons. Fluorine pulls hardest, then oxygen. Hydrogen pulls less, and sodium pulls very little. If two atoms pull about the same, they share the electrons. If one pulls much harder, it takes the electron away, and you get an ionic bond.",
      "words": [
        [
          "electronegativity",
          "How strongly an atom pulls on shared electrons."
        ]
      ],
      "tryIt": [
        "Build H₂ and notice the atoms pull equally, so they share evenly.",
        "Build HCl. Chlorine pulls harder than hydrogen.",
        "Build NaCl and compare. Sodium pulls so weakly that chlorine takes its electron."
      ],
      "check": [
        {
          "q": "Which atom pulls on electrons harder, oxygen or hydrogen?",
          "a": "Oxygen. Oxygen is more electronegative than hydrogen."
        },
        {
          "q": "What kind of bond forms when one atom takes an electron from another?",
          "a": "Ionic bond. Ionic bonds come from giving and taking."
        }
      ],
      "quiz": [
        [
          "Which atom pulls on electrons harder, oxygen or hydrogen?",
          "Oxygen",
          "Hydrogen",
          "They pull equally",
          "Oxygen is more electronegative than hydrogen."
        ],
        [
          "What kind of bond forms when one atom takes an electron from another?",
          "Ionic bond",
          "Single bond",
          "Double bond",
          "Ionic bonds come from giving and taking."
        ]
      ],
      "realLife": "This tug-of-war explains why salt behaves so differently from sugar.",
      "offScreen": "Play tug-of-war with a friend. If you are equally strong, the rope shares evenly. If one is much stronger, that person wins the whole rope.",
      "grownup": "Ask: In tug-of-war, who is like fluorine?",
      "done": {
        "found": "hcl"
      }
    },
    {
      "n": 42,
      "title": "Polar bonds",
      "level": "Bonds and groups",
      "minutes": 20,
      "bigIdea": "In water, oxygen pulls the shared electrons closer than hydrogen does. That makes the oxygen end slightly negative and the hydrogen ends slightly positive. A molecule with a positive end and a negative end is called polar. CO₂ has polar bonds too, but its straight shape makes the pulls cancel.",
      "words": [
        [
          "polar",
          "Having a slightly positive end and a slightly negative end."
        ]
      ],
      "tryIt": [
        "Build water. Notice the bent shape that keeps its ends different.",
        "Build CO₂. It is straight, so the two pulls cancel.",
        "Which molecule has a negative end and a positive end?"
      ],
      "check": [
        {
          "q": "Why is water polar?",
          "a": "Oxygen pulls the shared electrons closer than hydrogen does. The unequal pull makes the oxygen end slightly negative."
        },
        {
          "q": "Is CO₂ polar overall?",
          "a": "No, the two pulls cancel because the molecule is straight. Equal pulls in opposite directions cancel out."
        }
      ],
      "quiz": [
        [
          "Why is water polar?",
          "Oxygen pulls the shared electrons closer than hydrogen does",
          "It has no electrons",
          "It is a gas",
          "The unequal pull makes the oxygen end slightly negative."
        ],
        [
          "Is CO₂ polar overall?",
          "No, the two pulls cancel because the molecule is straight",
          "Yes, strongly",
          "Only when hot",
          "Equal pulls in opposite directions cancel out."
        ]
      ],
      "realLife": "Water's polarity is why it dissolves so many things and why it is so important for life.",
      "offScreen": "Rub a balloon on your hair and hold it near a thin stream of water from a tap. The stream bends toward the balloon.",
      "grownup": "Ask: Why does the stream of water bend?",
      "done": {
        "foundAll": [
          "water",
          "co2"
        ]
      }
    },
    {
      "n": 43,
      "title": "Why water dissolves salt",
      "level": "Bonds and groups",
      "minutes": 15,
      "bigIdea": "Salt is made of positive sodium ions and negative chloride ions. Water is polar. The slightly negative oxygen ends pull on the sodium ions, and the slightly positive hydrogen ends pull on the chloride ions. The ions get pulled away from the crystal and float in the water.",
      "words": [
        [
          "dissolve",
          "Spread out evenly in a liquid."
        ],
        [
          "ion",
          "An atom with an electric charge."
        ]
      ],
      "tryIt": [
        "Build NaCl and notice the + and − signs.",
        "Build water and find its negative and positive ends.",
        "Imagine water molecules surrounding each ion."
      ],
      "check": [
        {
          "q": "Which part of water pulls on positive sodium ions?",
          "a": "The slightly negative oxygen end. Opposite charges attract."
        },
        {
          "q": "What does water do to the ions in salt?",
          "a": "Pulls them apart and surrounds them. Water molecules surround each ion."
        }
      ],
      "quiz": [
        [
          "Which part of water pulls on positive sodium ions?",
          "The slightly negative oxygen end",
          "The hydrogen end",
          "Nothing",
          "Opposite charges attract."
        ],
        [
          "What does water do to the ions in salt?",
          "Pulls them apart and surrounds them",
          "Turns them into atoms",
          "Makes them bigger",
          "Water molecules surround each ion."
        ]
      ],
      "realLife": "This is why seawater is salty.",
      "offScreen": "Stir a spoon of salt into warm water. Where does the salt go? Leave a small dish in the sun and look again in a few days. Do not drink it.",
      "grownup": "Ask: What do you think is left when the water evaporates?"
    },
    {
      "n": 44,
      "title": "Hydrogen bonds",
      "level": "Bonds and groups",
      "minutes": 20,
      "bigIdea": "A hydrogen bond is a weak attraction between molecules. The slightly positive hydrogen of one water molecule is attracted to the slightly negative oxygen of another. These attractions make water special. They give it a high boiling point, they make water droplets stick together, and they make ice float.",
      "words": [
        [
          "hydrogen bond",
          "A weak attraction between a hydrogen on one molecule and an oxygen or nitrogen on another."
        ]
      ],
      "tryIt": [
        "Build two water molecules on the bench.",
        "Imagine a dotted line from a hydrogen of one to the oxygen of the other.",
        "Think about what happens to these weak links when the molecules move faster, as in the reaction box in the Lab."
      ],
      "check": [
        {
          "q": "What is a hydrogen bond?",
          "a": "A weak attraction between molecules. It is weaker than a bond between atoms in a molecule."
        },
        {
          "q": "Why does ice float?",
          "a": "Its molecules are held in an open pattern, so ice is less dense than water. Hydrogen bonds hold ice in a spread-out pattern."
        }
      ],
      "quiz": [
        [
          "What is a hydrogen bond?",
          "A weak attraction between molecules",
          "A bond inside a hydrogen atom",
          "A bond between two hydrogens only",
          "It is weaker than a bond between atoms in a molecule."
        ],
        [
          "Why does ice float?",
          "Its molecules are held in an open pattern, so ice is less dense than water",
          "Ice has fewer atoms",
          "Ice is full of air",
          "Hydrogen bonds hold ice in a spread-out pattern."
        ]
      ],
      "realLife": "Because ice floats, lakes freeze from the top and fish can live underneath.",
      "offScreen": "Put an ice cube in a glass of water and watch where it floats.",
      "grownup": "Ask: What would happen to lakes if ice sank?"
    },
    {
      "n": 45,
      "title": "Drawing Lewis structures",
      "level": "Bonds and groups",
      "minutes": 20,
      "bigIdea": "A Lewis structure shows every outer electron. Lines are bonds, and dots are lone pairs. To draw one, add up the outer electrons of all the atoms. Water has 6 + 1 + 1 = 8 electrons, which makes 4 pairs: 2 bonds and 2 lone pairs.",
      "words": [
        [
          "lone pair",
          "Two outer electrons that are not in a bond."
        ]
      ],
      "tryIt": [
        "Switch to the Electrons view and look at water.",
        "Count the lines and dots. Do you get 8 electrons in all?",
        "Build CO₂ and count. It should use 16 electrons."
      ],
      "check": [
        {
          "q": "How many outer electrons does a water molecule use in all?",
          "a": "8. Oxygen has 6, and each hydrogen has 1."
        },
        {
          "q": "In the Electrons view, what do the gold dots show?",
          "a": "Lone pairs. Dots are pairs of electrons that are not in a bond."
        }
      ],
      "quiz": [
        [
          "How many outer electrons does a water molecule use in all?",
          "8",
          "6",
          "10",
          "Oxygen has 6, and each hydrogen has 1."
        ],
        [
          "In the Electrons view, what do the gold dots show?",
          "Lone pairs",
          "Bonds",
          "Protons",
          "Dots are pairs of electrons that are not in a bond."
        ]
      ],
      "realLife": "Chemists draw Lewis structures to predict how a molecule will behave.",
      "offScreen": "Draw H₂O and CO₂ on paper. Use dots for lone pairs and lines for bonds.",
      "grownup": "Ask: How many outer electrons does ammonia (NH₃) use in all?",
      "done": {
        "found": "water"
      }
    },
    {
      "n": 46,
      "title": "Benzene's shared secret",
      "level": "Bonds and groups",
      "minutes": 20,
      "bigIdea": "In the game, benzene is drawn with alternating double and single bonds. In real benzene, the electrons are shared around the whole ring, so all six carbon-carbon bonds are the same length. They are in between a single and a double bond. This makes the ring very stable.",
      "words": [
        [
          "delocalized",
          "Spread out over several atoms."
        ]
      ],
      "tryIt": [
        "Build benzene, C₆H₆.",
        "Look at the Orbitals view and notice the electrons are not stuck in one place.",
        "Think of the ring as having a shared cloud of electrons."
      ],
      "check": [
        {
          "q": "In real benzene, how do the six carbon-carbon bonds compare?",
          "a": "They are all the same length. The electrons are shared evenly around the ring."
        },
        {
          "q": "Why does the game draw alternating bonds?",
          "a": "It is a simple way to count the electrons. The real bonds are in between."
        }
      ],
      "quiz": [
        [
          "In real benzene, how do the six carbon-carbon bonds compare?",
          "They are all the same length",
          "Three are short and three are long",
          "They are all single bonds",
          "The electrons are shared evenly around the ring."
        ],
        [
          "Why does the game draw alternating bonds?",
          "It is a simple way to count the electrons",
          "Benzene really has alternating bonds",
          "It looks prettier",
          "The real bonds are in between."
        ]
      ],
      "realLife": "Many dyes, smells and medicines contain a benzene ring.",
      "offScreen": "Draw a hexagon and shade the middle to show a cloud of shared electrons.",
      "grownup": "Ask: Why might sharing the electrons around the ring make it more stable?",
      "done": {
        "found": "benzene"
      }
    },
    {
      "n": 47,
      "title": "Predicting shapes",
      "level": "Bonds and groups",
      "minutes": 20,
      "bigIdea": "Groups of electrons repel each other, so they spread out as far as they can. Two groups point in a straight line. Three make a flat triangle, 120° apart. Four make a tetrahedron, 109.5° apart. Lone pairs push a little harder than bonds, so they squeeze the bond angles.",
      "words": [
        [
          "VSEPR",
          "A rule for predicting shapes: electron groups spread out as far apart as possible."
        ]
      ],
      "tryIt": [
        "Build CO₂ (2 groups, straight).",
        "Build methane (4 groups, tetrahedron).",
        "Build water and ammonia (4 groups with lone pairs).",
        "Compare their bond angles."
      ],
      "check": [
        {
          "q": "What shape do 4 groups of electrons make around an atom?",
          "a": "Tetrahedron. Four groups spread to the corners of a tetrahedron."
        },
        {
          "q": "What shape do 2 groups of electrons make?",
          "a": "Straight line. Two groups get as far apart as they can."
        }
      ],
      "quiz": [
        [
          "What shape do 4 groups of electrons make around an atom?",
          "Tetrahedron",
          "Flat square",
          "Straight line",
          "Four groups spread to the corners of a tetrahedron."
        ],
        [
          "What shape do 2 groups of electrons make?",
          "Straight line",
          "Bent",
          "Triangle",
          "Two groups get as far apart as they can."
        ]
      ],
      "realLife": "Shape matters in life. Your nose recognizes smells partly by the shapes of molecules.",
      "offScreen": "Tie 3 balloons together at their necks and let them spread. They make a flat triangle. Now try 4.",
      "grownup": "Ask: Why do the balloons spread out?",
      "done": {
        "foundAll": [
          "methane",
          "ammonia"
        ]
      }
    },
    {
      "n": 48,
      "title": "Bond length and strength",
      "level": "Bonds and groups",
      "minutes": 15,
      "bigIdea": "More shared pairs make a shorter and stronger bond. A carbon-carbon triple bond is shorter and stronger than a double bond, and a double bond is shorter and stronger than a single bond. That is why nitrogen gas, with its triple bond, is so unreactive.",
      "words": [
        [
          "bond length",
          "How far apart the two atoms are in a bond."
        ]
      ],
      "tryIt": [
        "Build ethane (C–C), ethylene (C=C) and acetylene (C≡C).",
        "Compare how far apart the carbons are.",
        "Build N₂ and note the very short bond."
      ],
      "check": [
        {
          "q": "Which bond is the shortest?",
          "a": "Triple. More shared pairs pull the atoms closer."
        },
        {
          "q": "Which bond is the hardest to break?",
          "a": "Triple bond. A triple bond has three shared pairs."
        }
      ],
      "quiz": [
        [
          "Which bond is the shortest?",
          "Triple",
          "Double",
          "Single",
          "More shared pairs pull the atoms closer."
        ],
        [
          "Which bond is the hardest to break?",
          "Triple bond",
          "Single bond",
          "They are all equal",
          "A triple bond has three shared pairs."
        ]
      ],
      "realLife": "It takes a lot of energy to break the triple bond in N₂, which is why factories need high heat and pressure to make ammonia.",
      "offScreen": "Tie one rubber band between two pencils, then three. Which is harder to pull apart?",
      "grownup": "Ask: Why does a stronger bond make a molecule less reactive?",
      "done": {
        "found": "nitrogen"
      }
    },
    {
      "n": 49,
      "title": "The –OH group: alcohols",
      "level": "Bonds and groups",
      "minutes": 15,
      "bigIdea": "A functional group is a small group of atoms that gives a molecule its personality. An –OH group makes a molecule an alcohol. Alcohols can mix with water because the –OH is polar.",
      "words": [
        [
          "functional group",
          "A small group of atoms with a particular behavior."
        ],
        [
          "alcohol",
          "A molecule with an –OH group."
        ]
      ],
      "tryIt": [
        "Build ethanol, CH₃CH₂OH.",
        "Find the –OH group on the end.",
        "Compare it with propane, which has no –OH."
      ],
      "check": [
        {
          "q": "What does an –OH group make a molecule?",
          "a": "An alcohol. Molecules with –OH are alcohols."
        },
        {
          "q": "Which molecule in the game has an –OH group?",
          "a": "Ethanol. Ethanol has an –OH on the end."
        }
      ],
      "quiz": [
        [
          "What does an –OH group make a molecule?",
          "An alcohol",
          "An acid",
          "A gas",
          "Molecules with –OH are alcohols."
        ],
        [
          "Which molecule in the game has an –OH group?",
          "Ethanol",
          "Methane",
          "Propane",
          "Ethanol has an –OH on the end."
        ]
      ],
      "realLife": "Hand sanitizer contains ethanol. Glucose and water also have –OH groups.",
      "offScreen": "Find an ingredient label that includes the word alcohol. Do not taste anything.",
      "grownup": "Ask: Why do you think the –OH group helps something mix with water?",
      "done": {
        "found": "ethanol"
      }
    },
    {
      "n": 50,
      "title": "The –COOH group: acids",
      "level": "Bonds and groups",
      "minutes": 15,
      "bigIdea": "The group –COOH is called a carboxylic acid group. It can give away its hydrogen, which makes it an acid. Vinegar has one –COOH group. Citric acid has three, so it tastes very sour.",
      "words": [
        [
          "carboxylic acid",
          "A molecule with a –COOH group."
        ]
      ],
      "tryIt": [
        "Build acetic acid, CH₃COOH.",
        "Find the C(=O)OH end.",
        "Compare it with lactic acid and citric acid in My Atlas."
      ],
      "check": [
        {
          "q": "What group makes acetic acid an acid?",
          "a": "–COOH. The –COOH group can give away its hydrogen."
        },
        {
          "q": "How many –COOH groups does citric acid have?",
          "a": "3. Citric acid has three."
        }
      ],
      "quiz": [
        [
          "What group makes acetic acid an acid?",
          "–COOH",
          "–OH only",
          "–NH₂",
          "The –COOH group can give away its hydrogen."
        ],
        [
          "How many –COOH groups does citric acid have?",
          "3",
          "1",
          "2",
          "Citric acid has three."
        ]
      ],
      "realLife": "Vinegar, lemons, yogurt and many candies get their tang from carboxylic acids.",
      "offScreen": "Taste a lemon slice with a grown-up and see how it feels. That sour taste comes from citric acid.",
      "grownup": "Ask: Which do you think is more sour, one –COOH group or three?",
      "done": {
        "found": "acetic"
      }
    },
    {
      "n": 51,
      "title": "Amines and amino acids",
      "level": "Bonds and groups",
      "minutes": 15,
      "bigIdea": "The group –NH₂ is called an amine group. An amino acid has an amine group on one end and a –COOH group on the other. Glycine is the simplest amino acid. Amino acids link up to make proteins.",
      "words": [
        [
          "amine",
          "A group with a nitrogen and two hydrogens, –NH₂."
        ],
        [
          "amino acid",
          "A molecule with both an amine group and an acid group."
        ]
      ],
      "tryIt": [
        "Build glycine, NH₂CH₂COOH.",
        "Find the –NH₂ end and the –COOH end.",
        "Use Show me the shape if the molecule is hard to build."
      ],
      "check": [
        {
          "q": "What are the two ends of an amino acid?",
          "a": "An amine group and an acid group. Amino acids have –NH₂ and –COOH."
        },
        {
          "q": "What do amino acids link up to make?",
          "a": "Proteins. Long chains of amino acids fold into proteins."
        }
      ],
      "quiz": [
        [
          "What are the two ends of an amino acid?",
          "An amine group and an acid group",
          "Two –OH groups",
          "Two –COOH groups",
          "Amino acids have –NH₂ and –COOH."
        ],
        [
          "What do amino acids link up to make?",
          "Proteins",
          "Salt",
          "Water",
          "Long chains of amino acids fold into proteins."
        ]
      ],
      "realLife": "Your muscles, hair and skin are all made of proteins.",
      "offScreen": "Link paper clips into a chain. Each clip is an amino acid.",
      "grownup": "Ask: Why might different chains do different jobs?",
      "done": {
        "found": "glycine"
      }
    },
    {
      "n": 52,
      "title": "Reading a molecule",
      "level": "Bonds and groups",
      "minutes": 20,
      "bigIdea": "Chemists scan a molecule for its functional groups to guess how it will behave. Vanillin has an aldehyde group (–CHO), an –OH group and an ether group (–OCH₃) on a benzene ring. Aspirin has an ester group and a carboxylic acid group on a benzene ring.",
      "words": [
        [
          "aldehyde",
          "A group with a C=O at the end, –CHO."
        ],
        [
          "ester",
          "A group with a C(=O)O–C in the middle."
        ]
      ],
      "tryIt": [
        "In My Atlas, open vanillin and find its ring.",
        "Find the –CHO, –OH and –OCH₃ groups attached to the ring.",
        "Open aspirin and find its two groups."
      ],
      "check": [
        {
          "q": "Which group in vanillin makes it an aldehyde?",
          "a": "–CHO. An aldehyde has a C=O and an H on the end."
        },
        {
          "q": "Which two groups does aspirin have next to its ring?",
          "a": "An ester and a carboxylic acid. Aspirin is acetylsalicylic acid."
        }
      ],
      "quiz": [
        [
          "Which group in vanillin makes it an aldehyde?",
          "–CHO",
          "–COOH",
          "–NH₂",
          "An aldehyde has a C=O and an H on the end."
        ],
        [
          "Which two groups does aspirin have next to its ring?",
          "An ester and a carboxylic acid",
          "Two alcohols",
          "Two amines",
          "Aspirin is acetylsalicylic acid."
        ]
      ],
      "realLife": "Spotting groups helps chemists design new medicines and flavors.",
      "offScreen": "Pick a molecule from My Atlas and circle every group you can find in a drawing of it.",
      "grownup": "Ask: Which group do you recognize most easily?"
    },
    {
      "n": 53,
      "title": "Naming carbon chains",
      "level": "Carbon and life",
      "minutes": 20,
      "bigIdea": "A chain of carbons with only single bonds, filled up with hydrogens, is called an alkane. The names start with a counting word: meth- is 1 carbon, eth- is 2, prop- is 3 and but- is 4. Then come pent-, hex-, hept- and oct-. Alkane names end in -ane. With n carbons, the formula is CₙH₂ₙ₊₂.",
      "words": [
        [
          "alkane",
          "A carbon chain with only single bonds."
        ],
        [
          "hydrocarbon",
          "A molecule made only of carbon and hydrogen."
        ]
      ],
      "tryIt": [
        "Build methane, propane and butane.",
        "Count the carbons and hydrogens in each. Does H = 2 × C + 2 work every time?",
        "Predict the formula for pentane, with 5 carbons."
      ],
      "check": [
        {
          "q": "What do meth, eth, prop and but stand for?",
          "a": "1, 2, 3 and 4 carbons. Meth is 1, eth is 2, prop is 3 and but is 4 carbons."
        },
        {
          "q": "How many hydrogens does a 5-carbon alkane have?",
          "a": "12. H = 2 × 5 + 2 = 12."
        }
      ],
      "quiz": [
        [
          "What do meth, eth, prop and but stand for?",
          "1, 2, 3 and 4 carbons",
          "Four colors",
          "The number of hydrogens",
          "Meth is 1, eth is 2, prop is 3 and but is 4 carbons."
        ],
        [
          "How many hydrogens does a 5-carbon alkane have?",
          "12",
          "10",
          "14",
          "H = 2 × 5 + 2 = 12."
        ]
      ],
      "realLife": "Natural gas, camp fuel and lighter fuel are all alkanes.",
      "offScreen": "Make a table with rows for 1 to 8 carbons. Fill in the name and number of hydrogens.",
      "grownup": "Ask: Can you explain why the pattern for hydrogens is 2 × C + 2?",
      "done": {
        "foundAll": [
          "methane",
          "propane",
          "butane"
        ]
      }
    },
    {
      "n": 54,
      "title": "Branched isomers",
      "level": "Carbon and life",
      "minutes": 20,
      "bigIdea": "Butane and isobutane both have 4 carbons and 10 hydrogens, but in isobutane the carbons branch. They are isomers, and their properties differ a little. Butane boils at about −1 °C and isobutane at about −12 °C.",
      "words": [
        [
          "branch",
          "A carbon chain that splits off to the side."
        ]
      ],
      "tryIt": [
        "Build butane in a straight chain.",
        "Now build isobutane: one carbon in the middle bonded to three other carbons, then add hydrogens.",
        "The bench says 'right atoms, different arrangement'. Press Is it real? (ask a grown-up) to ask PubChem."
      ],
      "check": [
        {
          "q": "What do butane and isobutane have in common?",
          "a": "The same formula, C₄H₁₀. They are isomers."
        },
        {
          "q": "How do you make isobutane from the same atoms?",
          "a": "Branch the carbon chain. The carbons are joined in a branched way."
        }
      ],
      "quiz": [
        [
          "What do butane and isobutane have in common?",
          "The same formula, C₄H₁₀",
          "The same shape",
          "The same boiling point",
          "They are isomers."
        ],
        [
          "How do you make isobutane from the same atoms?",
          "Branch the carbon chain",
          "Use different atoms",
          "Add another carbon",
          "The carbons are joined in a branched way."
        ]
      ],
      "realLife": "Fuel canisters often hold a mix of butane and isobutane.",
      "offScreen": "Arrange 4 paper clips in a straight line, then in a T-shape. The same pieces make two different shapes.",
      "grownup": "Ask: Why can the same atoms behave differently?"
    },
    {
      "n": 55,
      "title": "Double and triple bond names",
      "level": "Carbon and life",
      "minutes": 15,
      "bigIdea": "Hydrocarbons with a C=C double bond end in -ene, like ethene. Ones with a C≡C triple bond end in -yne, like ethyne, which is also called acetylene. Double and triple bonds are more reactive than single bonds, and they let molecules link into long chains.",
      "words": [
        [
          "alkene",
          "A hydrocarbon with a C=C double bond."
        ],
        [
          "alkyne",
          "A hydrocarbon with a C≡C triple bond."
        ]
      ],
      "tryIt": [
        "Build ethene and ethyne.",
        "Find the double and the triple bond.",
        "Count the hydrogens. Ethene has 4 and ethyne has 2."
      ],
      "check": [
        {
          "q": "What ending is used for a molecule with a C=C double bond?",
          "a": "-ene. Ethene, propene and so on end in -ene."
        },
        {
          "q": "What ending is used for a C≡C triple bond?",
          "a": "-yne. Ethyne and propyne end in -yne."
        }
      ],
      "quiz": [
        [
          "What ending is used for a molecule with a C=C double bond?",
          "-ene",
          "-ane",
          "-yne",
          "Ethene, propene and so on end in -ene."
        ],
        [
          "What ending is used for a C≡C triple bond?",
          "-yne",
          "-ene",
          "-ane",
          "Ethyne and propyne end in -yne."
        ]
      ],
      "realLife": "Ethene is the starting molecule for polyethylene, the plastic in many bags and bottles.",
      "offScreen": "Look at the recycling symbol on a plastic bottle. Find the number inside. Number 2 is high-density polyethylene.",
      "grownup": "Ask: Why might a double bond help molecules link into chains?",
      "done": {
        "foundAll": [
          "ethene",
          "ethyne"
        ]
      }
    },
    {
      "n": 56,
      "title": "Carbon rings",
      "level": "Carbon and life",
      "minutes": 20,
      "bigIdea": "Carbon chains can close into rings. Cyclohexane has six carbons in a ring with only single bonds and 12 hydrogens, and its ring is puckered. Benzene has six carbons in a flat ring with 6 hydrogens. Rings are in sugars, vitamins and many medicines.",
      "words": [
        [
          "ring",
          "Atoms joined in a circle."
        ]
      ],
      "tryIt": [
        "Build benzene and notice it is flat.",
        "Try to build a ring of six carbons with single bonds only. Drop the last carbon onto the first to close the ring.",
        "Fill every open hand with hydrogen. How many do you need?",
        "Press Is it real? (ask a grown-up) to ask PubChem."
      ],
      "check": [
        {
          "q": "How many hydrogens does cyclohexane have?",
          "a": "12. Each carbon in the ring has two hydrogens, so 6 × 2 = 12."
        },
        {
          "q": "Which is flat, benzene or cyclohexane?",
          "a": "Benzene. Cyclohexane puckers because its carbons are tetrahedral."
        }
      ],
      "quiz": [
        [
          "How many hydrogens does cyclohexane have?",
          "12",
          "6",
          "14",
          "Each carbon in the ring has two hydrogens, so 6 × 2 = 12."
        ],
        [
          "Which is flat, benzene or cyclohexane?",
          "Benzene",
          "Cyclohexane",
          "Both are flat",
          "Cyclohexane puckers because its carbons are tetrahedral."
        ]
      ],
      "realLife": "Glucose and vitamin C are built on rings.",
      "offScreen": "Make a ring from 6 paper clips. Try to flatten it, then to pucker it.",
      "grownup": "Ask: Why do tetrahedral carbons make a ring pucker?",
      "done": {
        "found": "benzene"
      }
    },
    {
      "n": 57,
      "title": "Sugars",
      "level": "Carbon and life",
      "minutes": 15,
      "bigIdea": "Glucose and fructose are both C₆H₁₂O₆, but their atoms are arranged differently, so they are isomers. Table sugar, or sucrose, is a glucose and a fructose joined together. Sugars are covered with –OH groups, which is why they dissolve so well in water.",
      "words": [
        [
          "sugar",
          "A small carbohydrate with many –OH groups."
        ]
      ],
      "tryIt": [
        "Open glucose in My Atlas and count its atoms.",
        "Find the –OH groups on the ring. There are five.",
        "Think about why many –OH groups make sugar mix with water."
      ],
      "check": [
        {
          "q": "What do glucose and fructose have in common?",
          "a": "The same formula, C₆H₁₂O₆. They are isomers of each other."
        },
        {
          "q": "What is table sugar made of?",
          "a": "Glucose and fructose joined together. Sucrose is one glucose linked to one fructose."
        }
      ],
      "quiz": [
        [
          "What do glucose and fructose have in common?",
          "The same formula, C₆H₁₂O₆",
          "The same taste",
          "The same shape",
          "They are isomers of each other."
        ],
        [
          "What is table sugar made of?",
          "Glucose and fructose joined together",
          "Only glucose",
          "Only fructose",
          "Sucrose is one glucose linked to one fructose."
        ]
      ],
      "realLife": "Fruit gets its sweetness from fructose and glucose.",
      "offScreen": "Dissolve a spoon of sugar in warm water and look at it. Where did the sugar go?",
      "grownup": "Ask: Why do you think sugar dissolves in water but oil does not?",
      "done": {
        "found": "glucose"
      }
    },
    {
      "n": 58,
      "title": "Fats and oils",
      "level": "Carbon and life",
      "minutes": 20,
      "bigIdea": "Fats and oils have long carbon chains full of hydrogens. These chains have no polar ends, so they do not mix with water. Fats with only single bonds have straight chains that pack together and are solid. Oils have some C=C double bonds that bend the chains, so they stay liquid. Fats also store lots of energy.",
      "words": [
        [
          "nonpolar",
          "Without a positive end and a negative end."
        ]
      ],
      "tryIt": [
        "Look at butane and propane, which have no polar ends.",
        "Find the –COOH on acetic acid. Imagine a very long carbon chain in its place. That is a fatty acid.",
        "Which would mix with water better, ethanol or butane?"
      ],
      "check": [
        {
          "q": "Why do oil and water not mix?",
          "a": "Water is polar and oil is not. Polar and nonpolar substances do not mix."
        },
        {
          "q": "What do double bonds in the chains of oils do?",
          "a": "Bend the chains so oils stay liquid. Bent chains cannot pack tightly together."
        }
      ],
      "quiz": [
        [
          "Why do oil and water not mix?",
          "Water is polar and oil is not",
          "Oil is a gas",
          "Water is too cold",
          "Polar and nonpolar substances do not mix."
        ],
        [
          "What do double bonds in the chains of oils do?",
          "Bend the chains so oils stay liquid",
          "Make them solid",
          "Make them heavier",
          "Bent chains cannot pack tightly together."
        ]
      ],
      "realLife": "Butter is solid and olive oil is liquid because of their chains.",
      "offScreen": "Stir a spoon of oil into a glass of water. Watch what happens as it settles.",
      "grownup": "Ask: What do you think soap does to oil and water?"
    },
    {
      "n": 59,
      "title": "Proteins",
      "level": "Carbon and life",
      "minutes": 20,
      "bigIdea": "Proteins are long chains of amino acids. Your body uses about 20 different amino acids. The chain folds into a special shape, and the shape decides what the protein does. Amino acids join by peptide bonds: the –COOH of one meets the –NH₂ of the next and water comes out.",
      "words": [
        [
          "peptide bond",
          "The bond that links two amino acids."
        ]
      ],
      "tryIt": [
        "Build glycine.",
        "Imagine two glycines side by side. The –OH from one –COOH and an H from the next –NH₂ leave as water.",
        "What bond holds them together now?"
      ],
      "check": [
        {
          "q": "About how many different amino acids make proteins in your body?",
          "a": "20. Your body uses about 20."
        },
        {
          "q": "What decides what a protein does?",
          "a": "Its folded shape. Shape lets a protein grab things or build things."
        }
      ],
      "quiz": [
        [
          "About how many different amino acids make proteins in your body?",
          "20",
          "2",
          "100",
          "Your body uses about 20."
        ],
        [
          "What decides what a protein does?",
          "Its folded shape",
          "Its color",
          "Its smell",
          "Shape lets a protein grab things or build things."
        ]
      ],
      "realLife": "Muscles, hair, enzymes and antibodies are all made of proteins.",
      "offScreen": "Make a chain of 20 beads in different colors. Each color is an amino acid.",
      "grownup": "Ask: Why might changing one bead change how the chain folds?",
      "done": {
        "found": "glycine"
      }
    },
    {
      "n": 60,
      "title": "DNA",
      "level": "Carbon and life",
      "minutes": 20,
      "bigIdea": "DNA is a very long molecule that holds the instructions for building a living thing. It has two strands twisted into a double helix. Each strand has four kinds of bases, called A, T, G and C. A always pairs with T, and G always pairs with C. Hydrogen bonds hold the pairs together.",
      "words": [
        [
          "DNA",
          "The molecule that stores instructions for living things."
        ],
        [
          "base",
          "One of the four letters, A, T, G or C, in DNA."
        ]
      ],
      "tryIt": [
        "Write a strand of bases: A T G C.",
        "Write its partner strand using the pairing rules.",
        "You should get T A C G."
      ],
      "check": [
        {
          "q": "Which bases pair together?",
          "a": "A with T and G with C. Pairing is A–T and G–C."
        },
        {
          "q": "What holds the two DNA strands together?",
          "a": "Hydrogen bonds. Many weak hydrogen bonds hold the strands."
        }
      ],
      "quiz": [
        [
          "Which bases pair together?",
          "A with T and G with C",
          "A with G",
          "T with C",
          "Pairing is A–T and G–C."
        ],
        [
          "What holds the two DNA strands together?",
          "Hydrogen bonds",
          "Ionic bonds",
          "Glue",
          "Many weak hydrogen bonds hold the strands."
        ]
      ],
      "realLife": "Every cell in your body carries a copy of your DNA.",
      "offScreen": "Make a twisted ladder from a strip of paper. Use the rungs for the pairs.",
      "grownup": "Ask: Why do you think the weak hydrogen bonds are useful?"
    },
    {
      "n": 61,
      "title": "Polymers and plastics",
      "level": "Carbon and life",
      "minutes": 15,
      "bigIdea": "A polymer is a very long molecule made by linking thousands of small molecules called monomers. Polyethylene, a common plastic, is made from many ethene molecules. Proteins, DNA and cellulose are natural polymers.",
      "words": [
        [
          "polymer",
          "A long molecule made of many repeating pieces."
        ],
        [
          "monomer",
          "A small molecule that links into a polymer."
        ]
      ],
      "tryIt": [
        "Build ethene.",
        "Imagine thousands of ethenes opening their double bonds and linking in a chain.",
        "What is the repeating piece?"
      ],
      "check": [
        {
          "q": "What is a monomer?",
          "a": "A small molecule that links into a chain. Monomers are the links of a polymer."
        },
        {
          "q": "What small molecule is polyethylene made from?",
          "a": "Ethene. Polyethylene is made of linked ethene molecules."
        }
      ],
      "quiz": [
        [
          "What is a monomer?",
          "A small molecule that links into a chain",
          "A big plastic bag",
          "A kind of metal",
          "Monomers are the links of a polymer."
        ],
        [
          "What small molecule is polyethylene made from?",
          "Ethene",
          "Methane",
          "Water",
          "Polyethylene is made of linked ethene molecules."
        ]
      ],
      "realLife": "Plastic bags, bottles and toys are polymers.",
      "offScreen": "Link paper clips into a long chain. Each clip is a monomer.",
      "grownup": "Ask: How is a plastic different from a single small molecule like water?",
      "done": {
        "found": "ethene"
      }
    },
    {
      "n": 62,
      "title": "How soap works",
      "level": "Carbon and life",
      "minutes": 20,
      "bigIdea": "A soap molecule has two ends. The head is polar and loves water. The tail is a long nonpolar chain and loves oil and grease. Soap tails grab grease while the heads face the water, so the grease gets surrounded and washed away.",
      "words": [
        [
          "soap",
          "A molecule with a water-loving head and a grease-loving tail."
        ]
      ],
      "tryIt": [
        "Remember that water is polar and oil is not.",
        "Imagine a soap molecule between oil and water.",
        "Which end points into the oil, and which into the water?"
      ],
      "check": [
        {
          "q": "Which end of a soap molecule loves water?",
          "a": "The head. The polar head attracts water."
        },
        {
          "q": "Why does soap help wash grease away?",
          "a": "The tails grab grease while the heads hold on to water. Soap connects oil to water."
        }
      ],
      "quiz": [
        [
          "Which end of a soap molecule loves water?",
          "The head",
          "The tail",
          "Neither",
          "The polar head attracts water."
        ],
        [
          "Why does soap help wash grease away?",
          "The tails grab grease while the heads hold on to water",
          "It melts the grease",
          "It makes the grease heavier",
          "Soap connects oil to water."
        ]
      ],
      "realLife": "Soap, shampoo and dish liquid all work this way.",
      "offScreen": "Put a few drops of oil in a bowl of water and add a drop of dish soap. Watch what the oil does.",
      "grownup": "Ask: Why does washing with only water not clean greasy hands?"
    },
    {
      "n": 63,
      "title": "Solids, liquids and gases",
      "level": "Matter and energy",
      "minutes": 15,
      "bigIdea": "In a solid, particles are packed close in a fixed pattern and only jiggle in place. In a liquid, they are close but slide past each other. In a gas, they are far apart and fly freely. Heat can change one state into another.",
      "words": [
        [
          "state of matter",
          "Whether something is a solid, a liquid or a gas."
        ]
      ],
      "tryIt": [
        "In the Lab, open How reactions happen. The box is like a gas, with molecules flying and bumping.",
        "Slide Heat from low to high and watch how the molecules move.",
        "Imagine the same molecules packed close together in a liquid, and in a solid."
      ],
      "check": [
        {
          "q": "In which state are particles in a fixed pattern?",
          "a": "Solid. Solid particles only jiggle in place."
        },
        {
          "q": "In which state are particles far apart and free?",
          "a": "Gas. Gas particles fly around freely."
        }
      ],
      "quiz": [
        [
          "In which state are particles in a fixed pattern?",
          "Solid",
          "Liquid",
          "Gas",
          "Solid particles only jiggle in place."
        ],
        [
          "In which state are particles far apart and free?",
          "Gas",
          "Solid",
          "Liquid",
          "Gas particles fly around freely."
        ]
      ],
      "realLife": "Water can be ice, liquid water or steam, with the same H₂O molecules.",
      "offScreen": "Fill a cup with ice. Watch it melt on a warm day.",
      "grownup": "Ask: What changes when ice melts: the molecules or how they move?"
    },
    {
      "n": 64,
      "title": "Melting and boiling points",
      "level": "Matter and energy",
      "minutes": 20,
      "bigIdea": "The stronger the attractions between molecules, the more heat it takes to melt or boil them. Water boils at 100 °C because its molecules hold on to each other with hydrogen bonds. Methane has no hydrogen bonds, so it boils at about −162 °C.",
      "words": [
        [
          "boiling point",
          "The temperature where a liquid turns into a gas."
        ],
        [
          "melting point",
          "The temperature where a solid turns into a liquid."
        ]
      ],
      "tryIt": [
        "Build water and methane.",
        "Compare them. Water has polar bonds and can make hydrogen bonds. Methane does not.",
        "Which would you expect to need more heat to boil?"
      ],
      "check": [
        {
          "q": "Why does water boil at a higher temperature than methane?",
          "a": "Water molecules attract each other more strongly. Hydrogen bonds hold water molecules together."
        },
        {
          "q": "What happens when a liquid boils?",
          "a": "Molecules gain enough energy to break free into a gas. Boiling frees molecules from the liquid."
        }
      ],
      "quiz": [
        [
          "Why does water boil at a higher temperature than methane?",
          "Water molecules attract each other more strongly",
          "Water is bigger",
          "Methane is heavier",
          "Hydrogen bonds hold water molecules together."
        ],
        [
          "What happens when a liquid boils?",
          "Molecules gain enough energy to break free into a gas",
          "They turn into atoms",
          "They freeze",
          "Boiling frees molecules from the liquid."
        ]
      ],
      "realLife": "Methane is a gas at room temperature and water is a liquid.",
      "offScreen": "Heat a little water in a pot with a grown-up and watch for the steam. Keep your hands away.",
      "grownup": "Ask: What do you think happens to the strength of the attractions as the water warms?",
      "done": {
        "foundAll": [
          "water",
          "methane"
        ]
      }
    },
    {
      "n": 65,
      "title": "Evaporation and condensation",
      "level": "Matter and energy",
      "minutes": 15,
      "bigIdea": "Evaporation happens when the fastest molecules at the surface of a liquid escape into the air, even below boiling. Condensation is the opposite: gas molecules lose energy and join a liquid, making dew, clouds and fog.",
      "words": [
        [
          "evaporation",
          "A liquid slowly turning into a gas from its surface."
        ],
        [
          "condensation",
          "A gas turning into a liquid."
        ]
      ],
      "tryIt": [
        "In the Lab, open How reactions happen and slide Heat up.",
        "Imagine the fast ones near the top escaping.",
        "Think about what happens when they cool down again."
      ],
      "check": [
        {
          "q": "What is evaporation?",
          "a": "Surface molecules escaping into the air as a gas. The fastest molecules at the surface escape."
        },
        {
          "q": "What forms when water vapor cools and turns back into liquid?",
          "a": "Dew or clouds. That is condensation."
        }
      ],
      "quiz": [
        [
          "What is evaporation?",
          "Surface molecules escaping into the air as a gas",
          "Water freezing",
          "A gas turning into a solid",
          "The fastest molecules at the surface escape."
        ],
        [
          "What forms when water vapor cools and turns back into liquid?",
          "Dew or clouds",
          "Salt",
          "Metal",
          "That is condensation."
        ]
      ],
      "realLife": "Puddles dry up by evaporation, and clouds form by condensation.",
      "offScreen": "On a warm day, watch drops form on the outside of a cold glass of water. The water comes from the air.",
      "grownup": "Ask: Where did the drops on the cold glass come from?"
    },
    {
      "n": 66,
      "title": "Dissolving",
      "level": "Matter and energy",
      "minutes": 15,
      "bigIdea": "When sugar dissolves in water, water molecules pull sugar molecules away from the crystal and spread them out. The solid is the solute and the liquid is the solvent. Together they make a solution, a mixture that looks the same all through. Warm water usually dissolves solids faster.",
      "words": [
        [
          "solute",
          "The thing that dissolves."
        ],
        [
          "solvent",
          "The liquid that does the dissolving."
        ],
        [
          "solution",
          "A solute spread evenly in a solvent."
        ]
      ],
      "tryIt": [
        "Build NaCl and imagine water pulling its ions apart.",
        "Build water and find its polar ends.",
        "Which is the solute and which is the solvent in salt water?"
      ],
      "check": [
        {
          "q": "In sugar water, what is the solvent?",
          "a": "Water. The solvent is the liquid that does the dissolving."
        },
        {
          "q": "What is a solution?",
          "a": "A mixture that looks the same all the way through. A dissolved mixture is the same throughout."
        }
      ],
      "quiz": [
        [
          "In sugar water, what is the solvent?",
          "Water",
          "Sugar",
          "Both",
          "The solvent is the liquid that does the dissolving."
        ],
        [
          "What is a solution?",
          "A mixture that looks the same all the way through",
          "Any liquid",
          "A kind of metal",
          "A dissolved mixture is the same throughout."
        ]
      ],
      "realLife": "Fizzy drinks, seawater and tea are all solutions.",
      "offScreen": "Stir sugar into cold water and into warm water. Which dissolves faster?",
      "grownup": "Ask: Why do you think warm water dissolves things faster?",
      "done": {
        "found": "salt"
      }
    },
    {
      "n": 67,
      "title": "Mixtures and compounds",
      "level": "Matter and energy",
      "minutes": 15,
      "bigIdea": "A compound has atoms joined by chemical bonds in a fixed recipe, like H₂O. A mixture just has different substances mixed together without bonding, like air or a salad. You can separate a mixture by physical means. To break a compound apart, you need a chemical reaction.",
      "words": [
        [
          "compound",
          "A substance whose atoms are bonded in a fixed recipe."
        ],
        [
          "mixture",
          "Different substances mixed but not bonded."
        ]
      ],
      "tryIt": [
        "Build water. It is a compound.",
        "Think about air. It is a mixture of N₂, O₂ and CO₂.",
        "Why is the formula of water always H₂O but the recipe for air changes?"
      ],
      "check": [
        {
          "q": "Which is a compound?",
          "a": "Water. Water has bonded atoms in a fixed recipe."
        },
        {
          "q": "How can you separate a mixture?",
          "a": "By physical ways, like filtering or evaporating. No bonds have to break."
        }
      ],
      "quiz": [
        [
          "Which is a compound?",
          "Water",
          "Air",
          "A salad",
          "Water has bonded atoms in a fixed recipe."
        ],
        [
          "How can you separate a mixture?",
          "By physical ways, like filtering or evaporating",
          "Only with a chemical reaction",
          "You cannot",
          "No bonds have to break."
        ]
      ],
      "realLife": "Seawater is a mixture. Pure water is a compound.",
      "offScreen": "Mix sand and sugar. Can you separate them? How?",
      "grownup": "Ask: Is orange juice a mixture or a compound? Why?",
      "done": {
        "found": "water"
      }
    },
    {
      "n": 68,
      "title": "Separating mixtures",
      "level": "Matter and energy",
      "minutes": 20,
      "bigIdea": "Different tricks separate different mixtures. A filter catches solids from water. Evaporation leaves salt behind when the water leaves. A magnet pulls iron out. Distillation boils a liquid and cools the vapor to collect it. Chromatography uses paper to separate the colors of an ink, because different molecules travel at different speeds.",
      "words": [
        [
          "filtration",
          "Separating a solid from a liquid with a filter."
        ],
        [
          "chromatography",
          "Separating a mixture by how fast its parts travel."
        ]
      ],
      "tryIt": [
        "Think of how you would separate sand from salt water.",
        "Think of how you would get salt back from salt water.",
        "Which tool would you use for each?"
      ],
      "check": [
        {
          "q": "How can you get salt back from salt water?",
          "a": "Let the water evaporate. The water leaves as vapor and the salt stays."
        },
        {
          "q": "What does chromatography separate?",
          "a": "The colors in an ink by how far they travel on paper. Different molecules travel at different speeds."
        }
      ],
      "quiz": [
        [
          "How can you get salt back from salt water?",
          "Let the water evaporate",
          "Use a magnet",
          "Filter it with a sieve",
          "The water leaves as vapor and the salt stays."
        ],
        [
          "What does chromatography separate?",
          "The colors in an ink by how far they travel on paper",
          "Metals",
          "Gases only",
          "Different molecules travel at different speeds."
        ]
      ],
      "realLife": "Water treatment plants use filters, and some places make fresh water from seawater by distillation.",
      "offScreen": "Draw a dot with washable marker near the bottom of a coffee filter and dip the bottom in water. Watch the colors spread.",
      "grownup": "Ask: Why did the colors go different distances?"
    },
    {
      "n": 69,
      "title": "Concentration",
      "level": "Matter and energy",
      "minutes": 15,
      "bigIdea": "Concentration tells you how much solute is in a certain amount of solution. A little juice in lots of water is dilute. A lot of juice in a little water is concentrated. A more concentrated solution has more particles bumping around, which can make reactions faster.",
      "words": [
        [
          "concentrated",
          "Having a lot of solute in a small amount of liquid."
        ],
        [
          "dilute",
          "Having only a little solute."
        ]
      ],
      "tryIt": [
        "In the Lab, open How reactions happen.",
        "Slide Crowding up and down. This is like changing the concentration.",
        "Which makes more bumps?"
      ],
      "check": [
        {
          "q": "Which is more concentrated?",
          "a": "Strong juice with only a little water. More solute in the same amount makes it more concentrated."
        },
        {
          "q": "What does adding water to a solution do?",
          "a": "Dilutes it. More solvent means the solution is weaker."
        }
      ],
      "quiz": [
        [
          "Which is more concentrated?",
          "Strong juice with only a little water",
          "Juice with lots of water added",
          "Plain water",
          "More solute in the same amount makes it more concentrated."
        ],
        [
          "What does adding water to a solution do?",
          "Dilutes it",
          "Concentrates it",
          "Freezes it",
          "More solvent means the solution is weaker."
        ]
      ],
      "realLife": "Juice concentrate is mixed with water before you drink it.",
      "offScreen": "Make two glasses of drink mix, one strong and one weak. Taste the difference.",
      "grownup": "Ask: Why might a more crowded mixture react faster?"
    },
    {
      "n": 70,
      "title": "Density",
      "level": "Matter and energy",
      "minutes": 15,
      "bigIdea": "Density is how much mass is packed into a certain volume. Oil floats on water because it is less dense. Ice floats because it is less dense than liquid water. A heavy-looking thing can float if it is spread out, like a big boat.",
      "words": [
        [
          "density",
          "How much mass is in a certain volume."
        ]
      ],
      "tryIt": [
        "Think of water and oil in a glass.",
        "Which layer goes on top?",
        "Why does ice float although it is water too? Remember the hydrogen bonds."
      ],
      "check": [
        {
          "q": "What is density?",
          "a": "How much mass is packed into a certain volume. Density is mass divided by volume."
        },
        {
          "q": "Why does oil float on water?",
          "a": "Oil is less dense than water. Less dense liquids float on denser ones."
        }
      ],
      "quiz": [
        [
          "What is density?",
          "How much mass is packed into a certain volume",
          "How hot something is",
          "How big something is",
          "Density is mass divided by volume."
        ],
        [
          "Why does oil float on water?",
          "Oil is less dense than water",
          "Oil is warmer",
          "Oil is a gas",
          "Less dense liquids float on denser ones."
        ]
      ],
      "realLife": "Ships float because their overall density is less than water.",
      "offScreen": "Pour honey, water and oil carefully into a clear glass. They make layers. Which is on the bottom?",
      "grownup": "Ask: What would happen to a drop of water poured into the oil?"
    },
    {
      "n": 71,
      "title": "Gas pressure",
      "level": "Matter and energy",
      "minutes": 20,
      "bigIdea": "Gas pressure comes from molecules hitting the walls of their container. Heating a gas makes the molecules move faster and hit harder, so the pressure goes up. Squeezing the same gas into a smaller space makes more hits, so the pressure goes up too. A sealed can can burst if it is heated.",
      "words": [
        [
          "pressure",
          "How hard molecules push on a surface."
        ]
      ],
      "tryIt": [
        "In the Lab, open How reactions happen.",
        "Turn the Heat up and watch the molecules hit the walls harder.",
        "Turn Crowding up. What happens to the number of hits?"
      ],
      "check": [
        {
          "q": "What causes gas pressure?",
          "a": "Molecules hitting the walls. Many tiny hits add up to a push."
        },
        {
          "q": "What happens to the pressure if you heat a sealed gas?",
          "a": "It goes up. Faster molecules hit harder and more often."
        }
      ],
      "quiz": [
        [
          "What causes gas pressure?",
          "Molecules hitting the walls",
          "Gravity only",
          "Gas turning into liquid",
          "Many tiny hits add up to a push."
        ],
        [
          "What happens to the pressure if you heat a sealed gas?",
          "It goes up",
          "It goes down",
          "It stays the same",
          "Faster molecules hit harder and more often."
        ]
      ],
      "realLife": "A tire is full of air pressure, and a hot day raises the pressure a bit.",
      "offScreen": "Blow up a balloon. The air inside pushes outward on every part of the balloon.",
      "grownup": "Ask: Why should you never heat a closed can?"
    },
    {
      "n": 72,
      "title": "Temperature scales",
      "level": "Matter and energy",
      "minutes": 15,
      "bigIdea": "On the Celsius scale, water freezes at 0 °C and boils at 100 °C at sea level. On the Fahrenheit scale, water freezes at 32 °F and boils at 212 °F. Scientists also use Kelvin, which starts at absolute zero, the coldest possible temperature, at −273.15 °C.",
      "words": [
        [
          "Celsius",
          "A temperature scale where water freezes at 0 and boils at 100."
        ],
        [
          "absolute zero",
          "The coldest possible temperature, 0 K."
        ]
      ],
      "tryIt": [
        "In the Lab, open How reactions happen and slide Heat. Imagine it as a temperature.",
        "Write the freezing and boiling points of water on the three scales.",
        "At what point would molecules stop moving almost completely?"
      ],
      "check": [
        {
          "q": "At what Celsius temperature does water boil at sea level?",
          "a": "100. Water boils at 100 °C."
        },
        {
          "q": "What is absolute zero?",
          "a": "The coldest possible temperature. At absolute zero particles have almost no motion."
        }
      ],
      "quiz": [
        [
          "At what Celsius temperature does water boil at sea level?",
          "100",
          "0",
          "212",
          "Water boils at 100 °C."
        ],
        [
          "What is absolute zero?",
          "The coldest possible temperature",
          "Where water freezes",
          "Where water boils",
          "At absolute zero particles have almost no motion."
        ]
      ],
      "realLife": "Weather reports use Celsius or Fahrenheit, and scientists use Celsius and Kelvin.",
      "offScreen": "Put a thermometer in a cup of ice water and then in warm tap water. Write down the readings.",
      "grownup": "Ask: Why do you think Kelvin has no negative numbers?"
    },
    {
      "n": 73,
      "title": "Heat and temperature",
      "level": "Matter and energy",
      "minutes": 20,
      "bigIdea": "Temperature tells how fast the particles are moving on average. Heat is the energy that flows from something hotter to something colder. A bathtub of warm water holds more heat than a cup of hotter water, because it has many more molecules.",
      "words": [
        [
          "heat",
          "Energy that flows from something hot to something cold."
        ],
        [
          "temperature",
          "How fast particles move on average."
        ]
      ],
      "tryIt": [
        "In the Lab, open How reactions happen and use the water-bath idea.",
        "Think about two boxes with the same temperature but different numbers of molecules.",
        "Which has more total energy?"
      ],
      "check": [
        {
          "q": "Which holds more heat, a bathtub of warm water or a cup of hot water?",
          "a": "The bathtub. More molecules mean more total thermal energy."
        },
        {
          "q": "What does temperature measure?",
          "a": "How fast particles move on average. Temperature is about average motion."
        }
      ],
      "quiz": [
        [
          "Which holds more heat, a bathtub of warm water or a cup of hot water?",
          "The bathtub",
          "The cup",
          "They are equal",
          "More molecules mean more total thermal energy."
        ],
        [
          "What does temperature measure?",
          "How fast particles move on average",
          "How much stuff there is",
          "How heavy something is",
          "Temperature is about average motion."
        ]
      ],
      "realLife": "A bath keeps you warm longer than a cup of tea because it has more water.",
      "offScreen": "Hold a metal spoon and a wooden spoon from a cup of hot water. Which feels hotter, and why?",
      "grownup": "Ask: If heat flows from hot to cold, what happens to an ice cube in your hand?"
    },
    {
      "n": 74,
      "title": "Why water heats slowly",
      "level": "Matter and energy",
      "minutes": 15,
      "bigIdea": "Water needs a lot of energy to warm up. It takes about 4.18 joules to warm 1 gram of water by 1 °C, which is much more than most metals need. That is why the sea warms slowly in summer and cools slowly in winter, and why oceans keep coastal weather mild.",
      "words": [
        [
          "specific heat",
          "How much energy it takes to warm 1 gram by 1 degree."
        ]
      ],
      "tryIt": [
        "Remember how many hydrogen bonds water has.",
        "Why might it take extra energy to make water molecules move faster?",
        "Compare a metal pan and the water in it on a stove."
      ],
      "check": [
        {
          "q": "Which warms up faster in the sun, metal or water?",
          "a": "Metal. Metals need less energy per degree."
        },
        {
          "q": "Why does the sea keep coastal weather mild?",
          "a": "Water heats up and cools down slowly. Water stores a lot of heat."
        }
      ],
      "quiz": [
        [
          "Which warms up faster in the sun, metal or water?",
          "Metal",
          "Water",
          "They warm at the same rate",
          "Metals need less energy per degree."
        ],
        [
          "Why does the sea keep coastal weather mild?",
          "Water heats up and cools down slowly",
          "Water is blue",
          "The sea is salty",
          "Water stores a lot of heat."
        ]
      ],
      "realLife": "Sandy beaches are hot at noon, but the sea stays cooler.",
      "offScreen": "Put sand in one cup and water in another in the sun. Feel them after 20 minutes.",
      "grownup": "Ask: Why is it a good thing that your body is mostly water?"
    },
    {
      "n": 75,
      "title": "Combination reactions",
      "level": "Reactions in action",
      "minutes": 15,
      "bigIdea": "In a combination reaction, two or more simple substances join to make one product, like A + B → AB. Hydrogen and oxygen combine to make water: 2 H₂ + O₂ → 2 H₂O. Nitrogen and hydrogen combine to make ammonia.",
      "words": [
        [
          "combination reaction",
          "A reaction where simple substances join into one product."
        ]
      ],
      "tryIt": [
        "Open My Atlas and put 2 H₂ and 1 O₂ on the bench.",
        "Press Spark on the rocket fuel reaction.",
        "Count how many different products you made."
      ],
      "check": [
        {
          "q": "What happens in a combination reaction?",
          "a": "Simple substances join to make one product. A + B → AB."
        },
        {
          "q": "Which of these is a combination reaction?",
          "a": "2 H₂ + O₂ → 2 H₂O. Hydrogen and oxygen join to make a single product, water."
        }
      ],
      "quiz": [
        [
          "What happens in a combination reaction?",
          "Simple substances join to make one product",
          "One substance splits in two",
          "Atoms disappear",
          "A + B → AB."
        ],
        [
          "Which of these is a combination reaction?",
          "2 H₂ + O₂ → 2 H₂O",
          "2 H₂O₂ → 2 H₂O + O₂",
          "CH₄ + 2 O₂ → CO₂ + 2 H₂O",
          "Hydrogen and oxygen join to make a single product, water."
        ]
      ],
      "realLife": "A rocket engine burning hydrogen is a combination reaction.",
      "offScreen": "Click two LEGO bricks together. Two pieces made one.",
      "grownup": "Ask: What would the reverse of a combination reaction look like?",
      "done": {
        "reacted": "rocket"
      }
    },
    {
      "n": 76,
      "title": "Decomposition reactions",
      "level": "Reactions in action",
      "minutes": 15,
      "bigIdea": "In a decomposition reaction, one substance breaks into simpler ones, like AB → A + B. Hydrogen peroxide breaks down into water and oxygen: 2 H₂O₂ → 2 H₂O + O₂. Heat, light, electricity or a catalyst can make this happen.",
      "words": [
        [
          "decomposition",
          "A reaction where one substance breaks into simpler ones."
        ]
      ],
      "tryIt": [
        "Put two hydrogen peroxide molecules on the bench from My Atlas.",
        "Press Spark on the elephant toothpaste reaction.",
        "Which products were made?"
      ],
      "check": [
        {
          "q": "What happens in a decomposition reaction?",
          "a": "One substance breaks into simpler ones. AB → A + B."
        },
        {
          "q": "What does hydrogen peroxide break down into?",
          "a": "Water and oxygen. 2 H₂O₂ → 2 H₂O + O₂."
        }
      ],
      "quiz": [
        [
          "What happens in a decomposition reaction?",
          "One substance breaks into simpler ones",
          "Two substances join",
          "Nothing changes",
          "AB → A + B."
        ],
        [
          "What does hydrogen peroxide break down into?",
          "Water and oxygen",
          "Hydrogen and carbon",
          "Salt and water",
          "2 H₂O₂ → 2 H₂O + O₂."
        ]
      ],
      "realLife": "Hydrogen peroxide is sold in dark brown bottles, because light slowly breaks it down.",
      "offScreen": "Take apart a LEGO model into single bricks. One thing became many.",
      "grownup": "Ask: What do you think the oxygen bubbles do in the elephant toothpaste demo?",
      "done": {
        "reacted": "peroxide"
      }
    },
    {
      "n": 77,
      "title": "Burning with too little air",
      "level": "Reactions in action",
      "minutes": 20,
      "bigIdea": "A fuel burns best with plenty of oxygen and makes carbon dioxide and water. With too little oxygen, it can make carbon monoxide, CO, and soot, which is carbon. Carbon monoxide is a poisonous gas with no color or smell. That is why gas heaters need fresh air and homes with gas appliances need carbon monoxide alarms.",
      "words": [
        [
          "carbon monoxide",
          "A poisonous gas, CO, made when a fuel burns without enough oxygen."
        ]
      ],
      "tryIt": [
        "Run the gas stove reaction: CH₄ + 2 O₂.",
        "Notice that the products are CO₂ and water.",
        "Think about what could happen if there was less oxygen."
      ],
      "check": [
        {
          "q": "Which poisonous gas can form when a fuel burns without enough oxygen?",
          "a": "Carbon monoxide. Not enough oxygen makes CO."
        },
        {
          "q": "What should a home with gas appliances have?",
          "a": "A carbon monoxide alarm. CO has no smell, so an alarm is needed."
        }
      ],
      "quiz": [
        [
          "Which poisonous gas can form when a fuel burns without enough oxygen?",
          "Carbon monoxide",
          "Water",
          "Nitrogen",
          "Not enough oxygen makes CO."
        ],
        [
          "What should a home with gas appliances have?",
          "A carbon monoxide alarm",
          "A bigger flame",
          "Closed windows",
          "CO has no smell, so an alarm is needed."
        ]
      ],
      "realLife": "Cars, grills and heaters can make carbon monoxide, so never run them in closed spaces.",
      "offScreen": "With a grown-up, check that your home has a carbon monoxide alarm and test it.",
      "grownup": "Ask: Why is it dangerous that carbon monoxide has no smell?",
      "done": {
        "reacted": "stove"
      }
    },
    {
      "n": 78,
      "title": "The pH scale",
      "level": "Reactions in action",
      "minutes": 20,
      "bigIdea": "The pH scale goes from 0 to 14. Below 7 is acidic, 7 is neutral and above 7 is basic, also called alkaline. Lemon juice is about 2, pure water is 7, baking soda in water is about 8 and soap is about 9 to 10. pH tells how many hydrogen ions are in the water, and each step is 10 times different.",
      "words": [
        [
          "pH",
          "A number that shows how acidic or basic something is."
        ],
        [
          "base",
          "A substance that can cancel an acid."
        ]
      ],
      "tryIt": [
        "Draw a number line from 0 to 14.",
        "Put lemon juice, water, baking soda solution and soap on it.",
        "Which side is acid and which is base?"
      ],
      "check": [
        {
          "q": "What pH is neutral?",
          "a": "7. Pure water is neutral at pH 7."
        },
        {
          "q": "Which is an acid?",
          "a": "Lemon juice. Lemon juice has a low pH."
        }
      ],
      "quiz": [
        [
          "What pH is neutral?",
          "7",
          "0",
          "14",
          "Pure water is neutral at pH 7."
        ],
        [
          "Which is an acid?",
          "Lemon juice",
          "Soap",
          "Pure water",
          "Lemon juice has a low pH."
        ]
      ],
      "realLife": "Your stomach acid is very acidic, around pH 1 to 2.",
      "offScreen": "Write down five things in your kitchen and guess whether each is an acid or a base. Do not taste unknown things.",
      "grownup": "Ask: Why do you think soap is not very acidic?"
    },
    {
      "n": 79,
      "title": "Acids meet bases",
      "level": "Reactions in action",
      "minutes": 20,
      "bigIdea": "When an acid and a base react, they neutralize each other and make a salt and water. For example, hydrochloric acid plus sodium hydroxide makes sodium chloride and water: HCl + NaOH → NaCl + H₂O. Antacid tablets neutralize extra stomach acid.",
      "words": [
        [
          "neutralization",
          "An acid and a base canceling each other to make a salt and water."
        ]
      ],
      "tryIt": [
        "Build HCl, the acid in your stomach.",
        "Build NaCl, table salt.",
        "Think about how the H from the acid and the OH from the base join to make water."
      ],
      "check": [
        {
          "q": "What do an acid and a base make when they react?",
          "a": "A salt and water. Neutralization makes a salt and water."
        },
        {
          "q": "Why do antacid tablets help an upset stomach?",
          "a": "They neutralize extra acid. A base cancels an acid."
        }
      ],
      "quiz": [
        [
          "What do an acid and a base make when they react?",
          "A salt and water",
          "Two acids",
          "A metal",
          "Neutralization makes a salt and water."
        ],
        [
          "Why do antacid tablets help an upset stomach?",
          "They neutralize extra acid",
          "They make more acid",
          "They warm the stomach",
          "A base cancels an acid."
        ]
      ],
      "realLife": "Antacid tablets contain bases such as calcium carbonate or magnesium hydroxide, which neutralize extra stomach acid.",
      "offScreen": "Read the label on an antacid with a grown-up and find the base listed. Do not take it.",
      "grownup": "Ask: What would happen to your stomach if there were no acid at all?",
      "done": {
        "foundAll": [
          "hcl",
          "salt"
        ]
      }
    },
    {
      "n": 80,
      "title": "Color-changing indicators",
      "level": "Reactions in action",
      "minutes": 20,
      "bigIdea": "An indicator changes color to show whether something is an acid or a base. Red cabbage juice is pink or red in acids, purple in neutral liquids and blue or green in bases. The color comes from a molecule called anthocyanin.",
      "words": [
        [
          "indicator",
          "A substance that changes color in acids and bases."
        ]
      ],
      "tryIt": [
        "Predict what color red cabbage juice would turn in vinegar and in baking soda water.",
        "Look at the pH scale from the last lesson and match colors to numbers.",
        "Plan an experiment with three liquids."
      ],
      "check": [
        {
          "q": "What color does red cabbage juice turn in vinegar?",
          "a": "Pink or red. Acids turn it pink or red."
        },
        {
          "q": "What is an indicator?",
          "a": "Something that changes color to show if a liquid is acid or base. Indicators show acidity by color."
        }
      ],
      "quiz": [
        [
          "What color does red cabbage juice turn in vinegar?",
          "Pink or red",
          "Blue",
          "Green",
          "Acids turn it pink or red."
        ],
        [
          "What is an indicator?",
          "Something that changes color to show if a liquid is acid or base",
          "A kind of metal",
          "A thermometer",
          "Indicators show acidity by color."
        ]
      ],
      "realLife": "Chemists use indicators and meters to check pools, soil and drinks.",
      "offScreen": "With a grown-up, blend red cabbage with warm water and strain it. Add a few drops to vinegar, lemon juice and baking soda in water. Do not drink the test liquids.",
      "grownup": "Ask: What did you predict, and what happened?"
    },
    {
      "n": 81,
      "title": "Rust",
      "level": "Reactions in action",
      "minutes": 15,
      "bigIdea": "Rusting is a slow reaction between iron, oxygen and water. It makes iron oxide, called rust. Rust is crumbly and flakes off, so the iron slowly weakens. Paint, oil, or a coating of zinc keeps oxygen and water away.",
      "words": [
        [
          "rust",
          "The reddish-brown iron oxide formed when iron reacts with oxygen and water."
        ]
      ],
      "tryIt": [
        "Think about which of the three things rust needs: iron, oxygen, and water.",
        "How would you stop rust by removing one of them?",
        "Look at your atom tray: which atoms are in rust?"
      ],
      "check": [
        {
          "q": "What do iron, oxygen and water make together?",
          "a": "Rust. Rust is iron oxide."
        },
        {
          "q": "How does paint protect iron?",
          "a": "It keeps oxygen and water away. No contact means no rusting."
        }
      ],
      "quiz": [
        [
          "What do iron, oxygen and water make together?",
          "Rust",
          "Salt",
          "Steel",
          "Rust is iron oxide."
        ],
        [
          "How does paint protect iron?",
          "It keeps oxygen and water away",
          "It makes the iron lighter",
          "It cools the iron",
          "No contact means no rusting."
        ]
      ],
      "realLife": "Bridges and cars are painted or coated to slow rusting.",
      "offScreen": "With a grown-up, put a steel wool pad in a damp cup and another in a dry cup. Check both after a day or two.",
      "grownup": "Ask: Why does rust happen faster near the sea?"
    },
    {
      "n": 82,
      "title": "Losing and gaining electrons",
      "level": "Reactions in action",
      "minutes": 20,
      "bigIdea": "Many reactions move electrons from one atom to another. Losing electrons is called oxidation. Gaining electrons is called reduction. They always happen together, so the reaction is called redox. A memory trick: OIL RIG means Oxidation Is Loss and Reduction Is Gain.",
      "words": [
        [
          "oxidation",
          "Losing electrons."
        ],
        [
          "reduction",
          "Gaining electrons."
        ]
      ],
      "tryIt": [
        "Build table salt, NaCl.",
        "Which atom lost an electron?",
        "Which atom gained one?"
      ],
      "check": [
        {
          "q": "What happens to an atom that is oxidized?",
          "a": "It loses electrons. Oxidation is loss of electrons."
        },
        {
          "q": "When sodium and chlorine make salt, which atom is reduced?",
          "a": "Chlorine. Chlorine gains an electron."
        }
      ],
      "quiz": [
        [
          "What happens to an atom that is oxidized?",
          "It loses electrons",
          "It gains electrons",
          "It disappears",
          "Oxidation is loss of electrons."
        ],
        [
          "When sodium and chlorine make salt, which atom is reduced?",
          "Chlorine",
          "Sodium",
          "Both",
          "Chlorine gains an electron."
        ]
      ],
      "realLife": "Rusting, burning and batteries are all redox reactions.",
      "offScreen": "Pass a ball from one friend to another. The one who gave it away is oxidized and the one who got it is reduced.",
      "grownup": "Ask: Can one atom lose an electron if no other atom gains it?",
      "done": {
        "found": "salt"
      }
    },
    {
      "n": 83,
      "title": "Batteries",
      "level": "Reactions in action",
      "minutes": 20,
      "bigIdea": "A battery uses a redox reaction. One material loses electrons and another gains them, but the electrons have to go through a wire to get there. That flow of electrons is electricity. When most of the chemicals have reacted, the battery goes flat.",
      "words": [
        [
          "electric current",
          "A flow of electrons."
        ]
      ],
      "tryIt": [
        "Think about oxidation and reduction from the last lesson.",
        "Where do the electrons go in a battery?",
        "What happens when the reaction runs out?"
      ],
      "check": [
        {
          "q": "What flows through the wire of a battery?",
          "a": "Electrons. Moving electrons are an electric current."
        },
        {
          "q": "What happens when a battery goes flat?",
          "a": "Most of the chemicals have reacted. The reaction has used up its reactants."
        }
      ],
      "quiz": [
        [
          "What flows through the wire of a battery?",
          "Electrons",
          "Atoms",
          "Water",
          "Moving electrons are an electric current."
        ],
        [
          "What happens when a battery goes flat?",
          "Most of the chemicals have reacted",
          "The wire breaks",
          "The electrons disappear",
          "The reaction has used up its reactants."
        ]
      ],
      "realLife": "Phones, flashlights and toys run on batteries, and rechargeable batteries can run the reaction backward.",
      "offScreen": "With a grown-up, push a copper coin and a zinc-coated nail into a lemon and touch a voltmeter to both. You will measure a small voltage.",
      "grownup": "Ask: Why can a rechargeable battery be used again?"
    },
    {
      "n": 84,
      "title": "Splitting water with electricity",
      "level": "Reactions in action",
      "minutes": 15,
      "bigIdea": "Electricity can split water into hydrogen and oxygen. This is the reverse of rocket fuel: 2 H₂O → 2 H₂ + O₂. The reaction makes twice as much hydrogen gas as oxygen gas by volume. This process is called electrolysis.",
      "words": [
        [
          "electrolysis",
          "Using electricity to split a compound."
        ]
      ],
      "tryIt": [
        "Run the rocket-fuel reaction and see how the atoms move.",
        "Imagine running the movie backward.",
        "Count the hydrogen and oxygen atoms."
      ],
      "check": [
        {
          "q": "How much more hydrogen than oxygen gas is made, by volume, when water is split?",
          "a": "Twice as much. 2 H₂O gives 2 H₂ and 1 O₂."
        },
        {
          "q": "What kind of energy splits water in electrolysis?",
          "a": "Electricity. Electrical energy drives the reaction."
        }
      ],
      "quiz": [
        [
          "How much more hydrogen than oxygen gas is made, by volume, when water is split?",
          "Twice as much",
          "The same",
          "Half as much",
          "2 H₂O gives 2 H₂ and 1 O₂."
        ],
        [
          "What kind of energy splits water in electrolysis?",
          "Electricity",
          "Sound",
          "Cold",
          "Electrical energy drives the reaction."
        ]
      ],
      "realLife": "Some hydrogen fuel is made by splitting water with electricity.",
      "offScreen": "Watch a video of electrolysis with a grown-up. Do not try it yourself, because salt water and a battery can make harmful gases.",
      "grownup": "Ask: Why is the reverse reaction, burning hydrogen, useful for rockets?",
      "done": {
        "reacted": "rocket"
      }
    },
    {
      "n": 85,
      "title": "Photosynthesis",
      "level": "Reactions in action",
      "minutes": 20,
      "bigIdea": "Plants use light energy to turn carbon dioxide and water into glucose and oxygen: 6 CO₂ + 6 H₂O + light → C₆H₁₂O₆ + 6 O₂. Chlorophyll, the green stuff in leaves, catches the light. This reaction takes in energy, so it is endothermic.",
      "words": [
        [
          "photosynthesis",
          "How plants make sugar from CO₂, water and light."
        ],
        [
          "chlorophyll",
          "The green molecule that catches light in leaves."
        ]
      ],
      "tryIt": [
        "Build carbon dioxide and glucose.",
        "Count the atoms in 6 CO₂ + 6 H₂O. Do they match C₆H₁₂O₆ + 6 O₂?",
        "Where does the energy come from?"
      ],
      "check": [
        {
          "q": "What do plants make in photosynthesis?",
          "a": "Glucose and oxygen. Plants make sugar and oxygen."
        },
        {
          "q": "Where does the energy for photosynthesis come from?",
          "a": "Sunlight. Light energy is captured by chlorophyll."
        }
      ],
      "quiz": [
        [
          "What do plants make in photosynthesis?",
          "Glucose and oxygen",
          "Carbon dioxide and water",
          "Salt and water",
          "Plants make sugar and oxygen."
        ],
        [
          "Where does the energy for photosynthesis come from?",
          "Sunlight",
          "Soil",
          "Water",
          "Light energy is captured by chlorophyll."
        ]
      ],
      "realLife": "The oxygen you breathe is made by plants and algae.",
      "offScreen": "Put a green leaf in the sun and a similar one in the dark closet. Look at both after a few days.",
      "grownup": "Ask: Why do plants need light but animals do not?",
      "done": {
        "foundAll": [
          "co2",
          "glucose"
        ]
      }
    },
    {
      "n": 86,
      "title": "Respiration",
      "level": "Reactions in action",
      "minutes": 20,
      "bigIdea": "Your cells react glucose with oxygen to release energy: C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + energy. It is like photosynthesis in reverse. The CO₂ goes out when you breathe out, and the energy powers everything you do.",
      "words": [
        [
          "respiration",
          "Cells releasing energy from glucose and oxygen."
        ]
      ],
      "tryIt": [
        "Compare the equation with photosynthesis. What is different?",
        "Where do the atoms of glucose end up?",
        "Which of the products do you breathe out?"
      ],
      "check": [
        {
          "q": "What do your cells release when they react glucose with oxygen?",
          "a": "Energy, carbon dioxide and water. That is cellular respiration."
        },
        {
          "q": "Which gas do you breathe out that your cells make?",
          "a": "Carbon dioxide. CO₂ is a product of respiration."
        }
      ],
      "quiz": [
        [
          "What do your cells release when they react glucose with oxygen?",
          "Energy, carbon dioxide and water",
          "Sugar",
          "Only oxygen",
          "That is cellular respiration."
        ],
        [
          "Which gas do you breathe out that your cells make?",
          "Carbon dioxide",
          "Oxygen",
          "Nitrogen",
          "CO₂ is a product of respiration."
        ]
      ],
      "realLife": "Running faster makes you breathe harder because your muscles need more oxygen.",
      "offScreen": "Run on the spot for a minute and notice your breathing and heartbeat.",
      "grownup": "Ask: How are photosynthesis and respiration like opposite reactions?"
    },
    {
      "n": 87,
      "title": "Fermentation",
      "level": "Reactions in action",
      "minutes": 20,
      "bigIdea": "Yeast can get energy from sugar even without oxygen. It makes ethanol and carbon dioxide: C₆H₁₂O₆ → 2 C₂H₅OH + 2 CO₂. The CO₂ bubbles make bread dough rise. The ethanol evaporates when the bread bakes.",
      "words": [
        [
          "fermentation",
          "Yeast turning sugar into ethanol and carbon dioxide."
        ]
      ],
      "tryIt": [
        "Build ethanol and carbon dioxide.",
        "Check that the atoms in glucose match the atoms in the products.",
        "Which product makes dough rise?"
      ],
      "check": [
        {
          "q": "What gas makes bread dough rise?",
          "a": "Carbon dioxide. Yeast makes CO₂ bubbles."
        },
        {
          "q": "What does yeast turn sugar into?",
          "a": "Ethanol and carbon dioxide. That is fermentation."
        }
      ],
      "quiz": [
        [
          "What gas makes bread dough rise?",
          "Carbon dioxide",
          "Oxygen",
          "Hydrogen",
          "Yeast makes CO₂ bubbles."
        ],
        [
          "What does yeast turn sugar into?",
          "Ethanol and carbon dioxide",
          "Water and oxygen",
          "Salt",
          "That is fermentation."
        ]
      ],
      "realLife": "Bread, yogurt and many foods are made with fermentation.",
      "offScreen": "With a grown-up, mix a spoon of yeast and a spoon of sugar in warm water in a bottle, and put a balloon over the top. Watch the balloon fill.",
      "grownup": "Ask: What is the gas that fills the balloon?",
      "done": {
        "foundAll": [
          "ethanol",
          "co2"
        ]
      }
    },
    {
      "n": 88,
      "title": "Enzymes",
      "level": "Reactions in action",
      "minutes": 20,
      "bigIdea": "Enzymes are proteins that act as catalysts in living things. Each enzyme has a special shape that fits one kind of molecule, like a key in a lock. Enzymes lower the activation energy, so reactions can go quickly at body temperature. Too much heat can change an enzyme's shape so it stops working.",
      "words": [
        [
          "enzyme",
          "A protein that speeds up a reaction in a living thing."
        ]
      ],
      "tryIt": [
        "Remember the energy hill and the catalyst.",
        "Imagine the catalyst is a protein with a special shape.",
        "What would happen to the shape if it got too hot?"
      ],
      "check": [
        {
          "q": "What are enzymes?",
          "a": "Proteins that speed up reactions in living things. Enzymes are biological catalysts."
        },
        {
          "q": "Why can too much heat stop an enzyme?",
          "a": "It changes the enzyme's shape. The shape no longer fits its molecule."
        }
      ],
      "quiz": [
        [
          "What are enzymes?",
          "Proteins that speed up reactions in living things",
          "A kind of salt",
          "Gases",
          "Enzymes are biological catalysts."
        ],
        [
          "Why can too much heat stop an enzyme?",
          "It changes the enzyme's shape",
          "It makes the enzyme smaller",
          "It freezes the enzyme",
          "The shape no longer fits its molecule."
        ]
      ],
      "realLife": "An enzyme in your saliva starts breaking starch into sugar, so bread tastes slightly sweeter the longer you chew it.",
      "offScreen": "Chew a plain cracker for a minute without swallowing. Does the taste change?",
      "grownup": "Ask: Why do you think a fever that is too high can be dangerous?"
    },
    {
      "n": 89,
      "title": "Greenhouse gases",
      "level": "Chemistry in the world",
      "minutes": 20,
      "bigIdea": "Some gases, like carbon dioxide and methane, trap heat in the air. This keeps Earth warm enough for life. But burning lots of fuel adds extra CO₂, which can warm the planet too much. Nitrogen and oxygen, the main gases in air, do not trap heat.",
      "words": [
        [
          "greenhouse gas",
          "A gas that traps heat in the air."
        ]
      ],
      "tryIt": [
        "Build CO₂ and methane.",
        "Build N₂ and O₂ for comparison.",
        "Greenhouse gases have bonds that can wiggle and absorb heat energy in ways N₂ and O₂ cannot."
      ],
      "check": [
        {
          "q": "Which gas traps heat in the air?",
          "a": "Carbon dioxide. CO₂ absorbs heat."
        },
        {
          "q": "What adds extra CO₂ to the air?",
          "a": "Burning fuels like coal, oil and gas. Burning carbon fuels makes CO₂."
        }
      ],
      "quiz": [
        [
          "Which gas traps heat in the air?",
          "Carbon dioxide",
          "Nitrogen",
          "Oxygen",
          "CO₂ absorbs heat."
        ],
        [
          "What adds extra CO₂ to the air?",
          "Burning fuels like coal, oil and gas",
          "Blowing bubbles",
          "Boiling water",
          "Burning carbon fuels makes CO₂."
        ]
      ],
      "realLife": "Scientists measure the CO₂ in the air to track climate change.",
      "offScreen": "Find three ways your family can use less fuel, like walking or turning off lights.",
      "grownup": "Ask: Why is a little CO₂ good for Earth but a lot too much?",
      "done": {
        "foundAll": [
          "co2",
          "methane"
        ]
      }
    },
    {
      "n": 90,
      "title": "Clean water",
      "level": "Chemistry in the world",
      "minutes": 15,
      "bigIdea": "Water treatment first filters out dirt, then adds a small amount of chlorine to kill germs. Some places also add fluoride, which helps protect teeth. Water from a clean tap is a mixture of water with tiny amounts of salts and other things.",
      "words": [
        [
          "disinfect",
          "Kill germs."
        ]
      ],
      "tryIt": [
        "Open the card for chlorine.",
        "Read what it says about swimming pools.",
        "Build chlorine gas, Cl₂, if you have unlocked it."
      ],
      "check": [
        {
          "q": "What is added to tap water to kill germs?",
          "a": "A small amount of chlorine. Chlorine disinfects water."
        },
        {
          "q": "What does fluoride in some water and toothpaste help?",
          "a": "Teeth. Fluoride helps protect tooth enamel."
        }
      ],
      "quiz": [
        [
          "What is added to tap water to kill germs?",
          "A small amount of chlorine",
          "Sugar",
          "Salt",
          "Chlorine disinfects water."
        ],
        [
          "What does fluoride in some water and toothpaste help?",
          "Teeth",
          "Eyes",
          "Hair",
          "Fluoride helps protect tooth enamel."
        ]
      ],
      "realLife": "Clean drinking water saves millions of lives.",
      "offScreen": "Look at where your tap water comes from. Ask a grown-up to help find out how it is cleaned.",
      "grownup": "Ask: Why do you think the amount of chlorine has to be small?"
    },
    {
      "n": 91,
      "title": "Fuels and energy",
      "level": "Chemistry in the world",
      "minutes": 20,
      "bigIdea": "Fuels store energy in their chemical bonds. When they burn, the products have stronger bonds and the extra energy comes out as heat. Fossil fuels like coal, oil and gas make CO₂. Hydrogen burns to make only water. Batteries and fuel cells make electricity straight from chemical reactions.",
      "words": [
        [
          "fossil fuel",
          "A fuel made from ancient plants and animals, like coal, oil or gas."
        ]
      ],
      "tryIt": [
        "Run the rocket-fuel reaction and the gas-stove reaction.",
        "Compare the products. Which makes CO₂?",
        "Which fuel might be better for the air?"
      ],
      "check": [
        {
          "q": "What does burning hydrogen make?",
          "a": "Only water. 2 H₂ + O₂ → 2 H₂O."
        },
        {
          "q": "Where is the energy stored in a fuel?",
          "a": "In its chemical bonds. Bonds hold chemical energy."
        }
      ],
      "quiz": [
        [
          "What does burning hydrogen make?",
          "Only water",
          "CO₂ and water",
          "Carbon monoxide",
          "2 H₂ + O₂ → 2 H₂O."
        ],
        [
          "Where is the energy stored in a fuel?",
          "In its chemical bonds",
          "In its color",
          "In its name",
          "Bonds hold chemical energy."
        ]
      ],
      "realLife": "Some buses and cars run on hydrogen fuel cells and give out only water.",
      "offScreen": "Make a list of five things at home that use energy. Where does the energy come from?",
      "grownup": "Ask: What is one way to use less energy at home?",
      "done": {
        "reacted": "rocket"
      }
    },
    {
      "n": 92,
      "title": "Fertilizer and nitrogen",
      "level": "Chemistry in the world",
      "minutes": 20,
      "bigIdea": "Plants need nitrogen to make proteins, but the N₂ in air is too unreactive for them to use. Factories make ammonia from N₂ and H₂, in the Haber process, and turn it into fertilizers like urea. Lightning and some bacteria in soil also turn N₂ into forms plants can use.",
      "words": [
        [
          "fertilizer",
          "A substance that gives plants the nutrients they need."
        ]
      ],
      "tryIt": [
        "Run the fertilizer factory reaction in the game.",
        "Build ammonia and urea.",
        "Find the nitrogen atoms in each."
      ],
      "check": [
        {
          "q": "Why can't plants use the N₂ in air directly?",
          "a": "Its triple bond is very strong. They need nitrogen in other molecules."
        },
        {
          "q": "Which molecule is made from N₂ and H₂ for fertilizer?",
          "a": "Ammonia. N₂ + 3 H₂ → 2 NH₃."
        }
      ],
      "quiz": [
        [
          "Why can't plants use the N₂ in air directly?",
          "Its triple bond is very strong",
          "It is too heavy",
          "It is too cold",
          "They need nitrogen in other molecules."
        ],
        [
          "Which molecule is made from N₂ and H₂ for fertilizer?",
          "Ammonia",
          "Water",
          "Methane",
          "N₂ + 3 H₂ → 2 NH₃."
        ]
      ],
      "realLife": "The fertilizer made this way helps grow food for billions of people.",
      "offScreen": "Plant bean seeds in two cups of soil. Give one a little plant food with a grown-up's help. Compare them in two weeks.",
      "grownup": "Ask: Why do you think nitrogen is in proteins?",
      "done": {
        "reacted": "fertilizer"
      }
    },
    {
      "n": 93,
      "title": "Medicines",
      "level": "Chemistry in the world",
      "minutes": 20,
      "bigIdea": "The pain-relieving chemical in willow bark was turned by chemists into aspirin, which is gentler on the stomach. Medicines are molecules that fit into molecules in your body, like a key in a lock. Medicines can hurt you if used the wrong way, so only a grown-up should give them to you.",
      "words": [
        [
          "medicine",
          "A molecule that helps the body when used correctly."
        ]
      ],
      "tryIt": [
        "Open aspirin in My Atlas and look at the ring and groups.",
        "Find the –COOH group.",
        "Why is the shape of a medicine so important?"
      ],
      "check": [
        {
          "q": "Where did the idea for aspirin come from?",
          "a": "Willow bark. Willow bark has a similar chemical."
        },
        {
          "q": "Who should give you medicine?",
          "a": "A grown-up. Medicines can be harmful if used wrongly."
        }
      ],
      "quiz": [
        [
          "Where did the idea for aspirin come from?",
          "Willow bark",
          "Salt water",
          "Rocks",
          "Willow bark has a similar chemical."
        ],
        [
          "Who should give you medicine?",
          "A grown-up",
          "Anyone",
          "Nobody",
          "Medicines can be harmful if used wrongly."
        ]
      ],
      "realLife": "Chemists test thousands of molecules to find new medicines.",
      "offScreen": "Look in a medicine cabinet with a grown-up and read the labels. Do not open any.",
      "grownup": "Ask: Why do medicines have instructions about how much to take?"
    },
    {
      "n": 94,
      "title": "Baking chemistry",
      "level": "Chemistry in the world",
      "minutes": 20,
      "bigIdea": "Baking soda is sodium bicarbonate, a base. When it meets an acid, like vinegar, lemon juice or buttermilk, it makes carbon dioxide bubbles. These bubbles make cakes and muffins rise. Baking powder already has baking soda and a dry acid mixed together.",
      "words": [
        [
          "baking soda",
          "A base that makes CO₂ when it meets an acid."
        ]
      ],
      "tryIt": [
        "Build carbon dioxide.",
        "Remember that the bubbles in baking are CO₂.",
        "Think about why an acid is needed."
      ],
      "check": [
        {
          "q": "What gas makes baked goods rise when baking soda reacts?",
          "a": "Carbon dioxide. Acid plus baking soda makes CO₂."
        },
        {
          "q": "What does baking soda react with to make bubbles?",
          "a": "An acid. Baking soda is a base."
        }
      ],
      "quiz": [
        [
          "What gas makes baked goods rise when baking soda reacts?",
          "Carbon dioxide",
          "Oxygen",
          "Hydrogen",
          "Acid plus baking soda makes CO₂."
        ],
        [
          "What does baking soda react with to make bubbles?",
          "An acid",
          "Salt",
          "Oil",
          "Baking soda is a base."
        ]
      ],
      "realLife": "Pancakes and muffins are fluffy because of tiny CO₂ bubbles.",
      "offScreen": "Bake muffins with a grown-up and watch them rise in the oven window.",
      "grownup": "Ask: What do you think happens if you forget the baking powder?",
      "done": {
        "found": "co2"
      }
    },
    {
      "n": 95,
      "title": "The chemistry of color",
      "level": "Chemistry in the world",
      "minutes": 20,
      "bigIdea": "Colored substances absorb some colors of light and reflect the rest. Many dyes and pigments have rings or long chains with alternating double and single bonds, which lets them absorb visible light. Chlorophyll absorbs red and blue light and reflects green, so leaves look green.",
      "words": [
        [
          "pigment",
          "A colored substance that absorbs some light."
        ]
      ],
      "tryIt": [
        "Build benzene and see its alternating bonds.",
        "Think of many rings joined together as a dye.",
        "Why do leaves look green?"
      ],
      "check": [
        {
          "q": "Why do leaves look green?",
          "a": "Chlorophyll reflects green light. Chlorophyll absorbs red and blue and reflects green."
        },
        {
          "q": "What kind of bonds do many dyes have in long chains or rings?",
          "a": "Alternating double and single bonds. This pattern lets them absorb visible light."
        }
      ],
      "quiz": [
        [
          "Why do leaves look green?",
          "Chlorophyll reflects green light",
          "Leaves are painted",
          "Leaves absorb green light",
          "Chlorophyll absorbs red and blue and reflects green."
        ],
        [
          "What kind of bonds do many dyes have in long chains or rings?",
          "Alternating double and single bonds",
          "Only single bonds",
          "Ionic bonds",
          "This pattern lets them absorb visible light."
        ]
      ],
      "realLife": "Fruit, flowers and your clothes get their colors from pigments and dyes.",
      "offScreen": "Look at a leaf, a flower and a berry. Which colors do they reflect?",
      "grownup": "Ask: Why do you think leaves change color in autumn?",
      "done": {
        "found": "benzene"
      }
    },
    {
      "n": 96,
      "title": "Metals and alloys",
      "level": "Chemistry in the world",
      "minutes": 15,
      "bigIdea": "An alloy is a mixture of a metal with other elements. Steel is iron with a little carbon, and it is much stronger than pure iron. Bronze is copper and tin. Brass is copper and zinc. Alloys can be stronger, harder or rust less than the pure metal.",
      "words": [
        [
          "alloy",
          "A mixture of a metal with other elements."
        ]
      ],
      "tryIt": [
        "Think about iron on the periodic table.",
        "What would adding a little carbon do?",
        "Name three things made of steel."
      ],
      "check": [
        {
          "q": "What is steel mostly made of?",
          "a": "Iron with a little carbon. Steel is an iron and carbon alloy."
        },
        {
          "q": "What is an alloy?",
          "a": "A mixture of a metal with other elements. Alloys can be stronger than pure metals."
        }
      ],
      "quiz": [
        [
          "What is steel mostly made of?",
          "Iron with a little carbon",
          "Aluminum",
          "Copper",
          "Steel is an iron and carbon alloy."
        ],
        [
          "What is an alloy?",
          "A mixture of a metal with other elements",
          "A kind of gas",
          "A pure element",
          "Alloys can be stronger than pure metals."
        ]
      ],
      "realLife": "Bridges, cars and knives are made of steel.",
      "offScreen": "Find a coin, a key and a paper clip. Look at what they are made of and what they might be alloyed with.",
      "grownup": "Ask: Why might engineers prefer steel to pure iron?"
    },
    {
      "n": 97,
      "title": "Recycling and atoms",
      "level": "Chemistry in the world",
      "minutes": 15,
      "bigIdea": "Atoms are not used up. When a metal can is recycled, its aluminum atoms are melted and made into something new. Recycling uses much less energy than making new metal from rock. When we burn or bury things, the atoms are still there, just moved somewhere else.",
      "words": [
        [
          "recycle",
          "Use the same materials again."
        ]
      ],
      "tryIt": [
        "Think of the conservation of mass lesson.",
        "Where do the atoms go when you recycle a can?",
        "Where might the atoms in an apple end up?"
      ],
      "check": [
        {
          "q": "What happens to atoms when we recycle?",
          "a": "They are reused. Atoms are never destroyed."
        },
        {
          "q": "Why does recycling aluminum save energy?",
          "a": "Melting a can takes much less energy than making new aluminum. Making aluminum from rock takes a lot of energy."
        }
      ],
      "quiz": [
        [
          "What happens to atoms when we recycle?",
          "They are reused",
          "They are destroyed",
          "They turn into gas",
          "Atoms are never destroyed."
        ],
        [
          "Why does recycling aluminum save energy?",
          "Melting a can takes much less energy than making new aluminum",
          "Cans are small",
          "Aluminum is cold",
          "Making aluminum from rock takes a lot of energy."
        ]
      ],
      "realLife": "Recycling helps keep waste out of landfills and saves energy.",
      "offScreen": "Sort your family's recycling for a week. Count how many of each kind you find.",
      "grownup": "Ask: What is one thing you could reuse instead of throwing away?"
    },
    {
      "n": 98,
      "title": "Lab safety",
      "level": "Chemistry in the world",
      "minutes": 15,
      "bigIdea": "Chemists follow safety rules. Wear eye protection. Have a grown-up nearby. Read labels. Never taste or smell unknown chemicals. Tie back long hair. Wash your hands afterward. Never mix unknown cleaning products, because some, like bleach and ammonia, make poisonous gases.",
      "words": [
        [
          "hazard",
          "Something that could cause harm."
        ]
      ],
      "tryIt": [
        "Read the safety notes in the lessons you have done.",
        "Make your own list of five lab rules.",
        "Why is each rule important?"
      ],
      "check": [
        {
          "q": "What should you never do with an unknown chemical?",
          "a": "Taste it. Never taste or sniff unknown chemicals."
        },
        {
          "q": "Which two household cleaners must never be mixed?",
          "a": "Bleach and ammonia. They make poisonous gases."
        }
      ],
      "quiz": [
        [
          "What should you never do with an unknown chemical?",
          "Taste it",
          "Read its label",
          "Ask a grown-up",
          "Never taste or sniff unknown chemicals."
        ],
        [
          "Which two household cleaners must never be mixed?",
          "Bleach and ammonia",
          "Salt and sugar",
          "Water and soap",
          "They make poisonous gases."
        ]
      ],
      "realLife": "Real chemists follow these rules every day.",
      "offScreen": "Make a lab safety poster for your home with the five most important rules.",
      "grownup": "Ask: Which rule would you teach a younger child first?"
    },
    {
      "n": 99,
      "title": "Fair tests",
      "level": "Chemistry in the world",
      "minutes": 20,
      "bigIdea": "A fair test changes only one thing at a time and keeps everything else the same. The thing you change is the independent variable and the thing you measure is the dependent variable. Repeating the test helps you be sure the result is real and not luck.",
      "words": [
        [
          "variable",
          "Something that can change in an experiment."
        ],
        [
          "fair test",
          "An experiment that changes only one thing."
        ]
      ],
      "tryIt": [
        "In the Lab, open How reactions happen.",
        "Change only Heat, and count the reactions in 20 seconds.",
        "Press Start again and repeat at the same heat. Do you get the same number?"
      ],
      "check": [
        {
          "q": "In a fair test, how many things do you change at a time?",
          "a": "One. Changing one thing shows what caused the result."
        },
        {
          "q": "Why repeat an experiment?",
          "a": "To check the result is reliable. Repeats show whether a result is luck."
        }
      ],
      "quiz": [
        [
          "In a fair test, how many things do you change at a time?",
          "One",
          "All of them",
          "None",
          "Changing one thing shows what caused the result."
        ],
        [
          "Why repeat an experiment?",
          "To check the result is reliable",
          "To use more materials",
          "To make it longer",
          "Repeats show whether a result is luck."
        ]
      ],
      "realLife": "Scientists repeat each other's experiments to check they are right.",
      "offScreen": "Test which paper plane flies farthest. Change only one thing, like the wing shape, each time.",
      "grownup": "Ask: What would be unfair about testing two planes made of different paper?",
      "done": {
        "lab": "rxn_hot"
      }
    },
    {
      "n": 100,
      "title": "You are a chemist",
      "level": "Chemistry in the world",
      "minutes": 30,
      "bigIdea": "You have learned about atoms, bonds, molecules, shapes, reactions, energy, and chemistry in the world. Now choose one molecule from your Atlas and make a one-page poster: its name, formula, picture, shape, functional groups, what it is used for, and one fact you found out. Present it to a grown-up.",
      "words": [
        [
          "chemist",
          "A scientist who studies what things are made of and how they change."
        ]
      ],
      "tryIt": [
        "Pick a molecule from My Atlas.",
        "Use the Molecule Lab to find its weight, bonds and shape.",
        "Open the Wikipedia link with a grown-up and find one new fact.",
        "Draw or build the poster and present it."
      ],
      "check": [
        {
          "q": "What is a molecule?",
          "a": "Two or more atoms joined together. Bonded atoms make a molecule."
        },
        {
          "q": "What do reactions do to atoms?",
          "a": "Rearrange them but never destroy them. Atoms are conserved in every reaction."
        }
      ],
      "quiz": [
        [
          "What is a molecule?",
          "Two or more atoms joined together",
          "A single atom",
          "A kind of cloud",
          "Bonded atoms make a molecule."
        ],
        [
          "What do reactions do to atoms?",
          "Rearrange them but never destroy them",
          "Destroy them",
          "Make new ones",
          "Atoms are conserved in every reaction."
        ]
      ],
      "realLife": "Chemists work in labs, kitchens, hospitals, factories and space missions.",
      "offScreen": "Make a poster about your favorite molecule with a drawing and three facts.",
      "grownup": "Ask: What was the most surprising thing you learned about chemistry?"
    }
  ];

// Unit headings for the Lessons screen: [first lesson, last lesson, name]
AA.LESSON_UNITS = [[1, 10, "Atoms and bonds"], [11, 20, "Molecules and reactions"], [21, 26, "Orbitals"], [27, 31, "How reactions happen"], [32, 40, "Inside the atom"], [41, 52, "Bonds, shapes and groups"], [53, 62, "Carbon and life"], [63, 74, "States, mixtures and energy"], [75, 88, "Acids, electrons and living reactions"], [89, 100, "Chemistry in the world"]];
})(typeof globalThis !== 'undefined' ? globalThis : window);
