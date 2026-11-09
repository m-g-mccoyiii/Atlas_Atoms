(function (root) {
'use strict';
const AA = root.AA = root.AA || {};

// Valid JSON on purpose: tools/make_lesson_doc.py turns this into docs/LESSON_PLANS.md.
// done: {found:id} | {foundAll:[ids]} | {reacted:id} | {reactedAny:[ids]} | {reactedCount:n} | omitted = "Mark done" button
AA.LESSONS = [
  {
    "n": 1, "title": "Everything is made of atoms", "level": "Start here", "minutes": 15,
    "bigIdea": "Everything you can touch, from your desk to your dog, is built from tiny pieces called atoms. Atoms are far too small to see. A single human hair is hundreds of thousands of atoms wide.",
    "words": [["atom", "The tiny building block of everything."], ["matter", "Anything that takes up space and has weight."]],
    "tryIt": ["Open the Atoms tray on the left and drag one hydrogen atom onto the bench.", "Click the Hydrogen button (don't drag) to open its element card.", "Turn the view with your mouse. Zoom with the scroll wheel."],
    "check": [{"q": "Can you see atoms with your eyes?", "a": "No. They are far too small. Scientists use special tools, and games like this one, to picture them."}, {"q": "Name three things made of atoms.", "a": "Anything works: air, water, a chair, you."}],
    "realLife": "The air in the room, the water you drink and your own body are all atoms arranged in different ways.",
    "offScreen": "Look around the room and list 10 things. Each one is made of atoms."
  },
  {
    "n": 2, "title": "Elements and their symbols", "level": "Start here", "minutes": 15,
    "bigIdea": "An element is one kind of atom. Each element has a short symbol: H is hydrogen, C is carbon, N is nitrogen and O is oxygen. There are about 118 known elements.",
    "words": [["element", "A pure kind of atom, like all-hydrogen or all-oxygen."], ["symbol", "A one- or two-letter code for an element."]],
    "tryIt": ["Click each of H, C, N and O in the tray to read their cards.", "Look at the colors: the game uses the colors chemists use for these atoms.", "Find the atomic number on each card. It is the number of protons in the nucleus."],
    "check": [{"q": "What is the symbol for oxygen?", "a": "O."}, {"q": "What is the symbol for carbon?", "a": "C."}],
    "realLife": "The symbols are the same in every language. A chemist in any country knows what H₂O means.",
    "offScreen": "Make flash cards for H, C, N and O with the symbol on one side and the name on the other."
  },
  {
    "n": 3, "title": "Atoms have hands", "level": "Start here", "minutes": 20,
    "bigIdea": "Each kind of atom wants a certain number of bonds. In the game these are its hands: hydrogen has 1, oxygen has 2, nitrogen has 3 and carbon has 4. Chemists call this number the valence.",
    "words": [["bond", "A link between two atoms."], ["valence", "How many bonds an atom likes to make."]],
    "tryIt": ["Drag two hydrogen atoms onto the bench.", "Drop one on top of the other to make a bond.", "Watch the dots under each atom. Green dots are used hands. When every hand is used the atom smiles.", "Open the Atlas to see that you found Hydrogen gas."],
    "check": [{"q": "How many hands does oxygen have?", "a": "Two."}, {"q": "Why did the two hydrogens smile?", "a": "Each hydrogen has one hand, and the bond used it."}],
    "realLife": "Hydrogen gas (H₂) is what fills some balloons and fuels some rockets.",
    "offScreen": "Hold hands with a friend. You are each using one 'hand' to bond, like two hydrogens.",
    "done": {"found": "hydrogen"}
  },
  {
    "n": 4, "title": "Sharing makes a bond", "level": "Start here", "minutes": 20,
    "bigIdea": "A bond forms when two atoms share electrons. Sharing one pair makes a single bond. Sharing two pairs makes a double bond. Oxygen in the air is two oxygen atoms joined by a double bond.",
    "words": [["electron", "A tiny particle that moves around the nucleus. Atoms share them to bond."], ["double bond", "Two shared pairs of electrons between the same two atoms."]],
    "tryIt": ["Drop one oxygen onto another oxygen to make one bond.", "Drop one on the other again. The bond becomes a double bond and both atoms smile.", "Switch to the Electrons view and find the two lines between the O atoms."],
    "check": [{"q": "What do atoms share in a bond?", "a": "Electrons."}, {"q": "How many lines are between the atoms in O₂ in the Electrons view?", "a": "Two, for a double bond."}],
    "realLife": "The oxygen you breathe is O₂, with exactly this double bond.",
    "offScreen": "Take two paper clips and link them once, then twice with a rubber band. Which is harder to pull apart?",
    "done": {"found": "oxygen"}
  },
  {
    "n": 5, "title": "Your first molecule: water", "level": "Start here", "minutes": 20,
    "bigIdea": "Atoms bonded together make a molecule. A formula tells you how many of each atom. H₂O means 2 hydrogen atoms and 1 oxygen atom. The small number after a letter says how many.",
    "words": [["molecule", "Two or more atoms bonded together."], ["formula", "A short way to write which atoms are in a molecule and how many."]],
    "tryIt": ["Drag one oxygen onto the bench.", "Drop two hydrogens on it, one at a time.", "Look at the formula in the 'On your bench' panel. It should say H₂O.", "Poke an atom by clicking it. Read what the game tells you."],
    "check": [{"q": "What does the 2 in H₂O mean?", "a": "There are 2 hydrogen atoms."}, {"q": "How many atoms are in one water molecule?", "a": "Three: two hydrogens and one oxygen."}],
    "realLife": "Oceans, rain and about 60% of an adult human body are water.",
    "offScreen": "Fill a glass of water. Everything you see is billions upon billions of H₂O molecules.",
    "done": {"found": "water"}
  },
  {
    "n": 6, "title": "Shape matters", "level": "Building", "minutes": 25,
    "bigIdea": "Molecules have shapes, and shape comes from how the bonds and lone pairs push on each other. Water is bent. Carbon dioxide is a straight line.",
    "words": [["lone pair", "A pair of electrons on an atom that is not used in a bond."], ["linear", "Shaped like a straight line."]],
    "tryIt": ["Build water. Rotate it and see the bend.", "Switch to Orbitals. The gold lobes on oxygen are lone pairs. They push the two hydrogens closer together.", "Build CO₂: one carbon with a double bond to each of two oxygens. Look at its shape from every side."],
    "check": [{"q": "Is water bent or straight?", "a": "Bent, about 104.5°."}, {"q": "Why is CO₂ straight?", "a": "Carbon has no lone pairs, and the two double bonds spread as far apart as they can."}],
    "realLife": "Water's bent shape is part of why ice floats and why salt dissolves in water.",
    "offScreen": "Use two marshmallows and a toothpick or two to make a straight line and a bent shape.",
    "done": {"found": "co2"}
  },
  {
    "n": 7, "title": "The air around you", "level": "Building", "minutes": 25,
    "bigIdea": "Air is mostly two molecules: nitrogen (N₂, about 78%) and oxygen (O₂, about 21%). A little is argon, and a tiny amount is carbon dioxide (CO₂, about 0.04%).",
    "words": [["gas", "A state of matter where molecules fly around freely."], ["triple bond", "Three shared pairs of electrons between the same two atoms."]],
    "tryIt": ["Build N₂: drop one nitrogen on another three times to make a triple bond.", "Compare the nitrogen and oxygen bonds in the Electrons view.", "Open your Atlas and look at the real-life notes for N₂, O₂ and CO₂."],
    "check": [{"q": "What is most of the air made of?", "a": "Nitrogen, N₂."}, {"q": "Why does nitrogen rarely react?", "a": "Its triple bond is very strong."}],
    "realLife": "You breathe in O₂ and breathe out CO₂, and each breath has mostly nitrogen in it.",
    "offScreen": "Wave a piece of paper. You are pushing through air, the molecules you just built.",
    "done": {"found": "nitrogen"}
  },
  {
    "n": 8, "title": "Carbon, the builder", "level": "Building", "minutes": 25,
    "bigIdea": "Carbon makes four bonds, so it can connect to other atoms in many directions. That makes it the backbone of almost all of the molecules in living things.",
    "words": [["tetrahedron", "A pyramid-like shape with four faces. Four bonds on carbon point to its corners."], ["organic chemistry", "The chemistry of carbon compounds."]],
    "tryIt": ["Drop four hydrogens on one carbon to build methane, CH₄.", "Rotate it. Notice the hydrogens point to the corners of a tetrahedron.", "Check the angle: all four bonds are about 109.5° apart."],
    "check": [{"q": "How many bonds does carbon make?", "a": "Four."}, {"q": "What is the formula for methane?", "a": "CH₄."}],
    "realLife": "Methane is the main part of natural gas used in many stoves and furnaces.",
    "offScreen": "Build a tetrahedron from 4 gumdrops and 6 toothpicks.",
    "done": {"found": "methane"}
  },
  {
    "n": 9, "title": "Chains of carbon", "level": "Building", "minutes": 25,
    "bigIdea": "Carbon atoms can bond to each other to make chains. Add hydrogens to fill all the hands. Longer chains are heavier. That is one reason propane and butane are gases that can be squeezed into a liquid, and why gasoline, with longer chains, is a liquid.",
    "words": [["chain", "Atoms bonded one after another in a line."], ["fuel", "A material that is burned for energy."]],
    "tryIt": ["Build propane (three carbons in a row, with hydrogens on all the other hands).", "Build butane with four carbons.", "Look at the zig-zag. Why isn't it straight?"],
    "check": [{"q": "How many hydrogens are in propane?", "a": "Eight: C₃H₈."}, {"q": "Why does the chain zig-zag?", "a": "Each carbon's four bonds point to the corners of a tetrahedron, so the angles are about 109.5°."}],
    "realLife": "Propane fuels camp stoves and grills. Butane is in many lighters.",
    "offScreen": "Link paper clips into a chain, then try to make a straight chain. It naturally bends.",
    "done": {"found": "propane"}
  },
  {
    "n": 10, "title": "Double and triple bonds", "level": "Building", "minutes": 25,
    "bigIdea": "Carbon atoms can share more than one pair. Double and triple bonds are shorter and stronger. A C=C double bond is flat, and a C≡C triple bond is a straight line.",
    "words": [["unsaturated", "A molecule with a double or triple bond between carbons."]],
    "tryIt": ["Build ethylene, C₂H₄: two carbons joined by a double bond, with two hydrogens on each.", "Build acetylene, C₂H₂, with a triple bond.", "Rotate each. Which one is flat? Which one is a straight line?"],
    "check": [{"q": "Which is shorter, C–C or C=C?", "a": "C=C. More shared pairs pull the atoms closer."}, {"q": "How many hydrogens are in acetylene?", "a": "Two."}],
    "realLife": "Ripening fruit gives off ethylene. Welding torches burn acetylene.",
    "offScreen": "Put a ripe banana in a paper bag with a green tomato. Check each day.",
    "done": {"foundAll": ["ethene", "ethyne"]}
  },
  {
    "n": 11, "title": "Same atoms, different molecule", "level": "Exploring", "minutes": 30,
    "bigIdea": "The same atoms can connect in different ways to make different molecules. These are called isomers. Ethanol and dimethyl ether both have the formula C₂H₆O, but ethanol is a liquid at room temperature and dimethyl ether is a gas.",
    "words": [["isomer", "A molecule with the same atoms as another but a different arrangement."]],
    "tryIt": ["Build C₂H₆O as ethanol: C–C–O with the O at the end holding an H.", "Now build it a different way: C–O–C. Look at the 'On your bench' panel. It says right atoms, different arrangement.", "Try making two other arrangements of the same atoms."],
    "check": [{"q": "Can two different molecules have the same formula?", "a": "Yes. Arrangement matters."}, {"q": "What is an isomer?", "a": "A molecule with the same atoms as another but joined in a different way."}],
    "realLife": "Medicines often depend on exactly how atoms are arranged. A small change in arrangement can change how a molecule acts.",
    "offScreen": "Build two different shapes from the same 6 LEGO bricks.",
    "done": {"found": "ethanol"}
  },
  {
    "n": 12, "title": "Salt: a different kind of bond", "level": "Exploring", "minutes": 25,
    "bigIdea": "Not all bonds are shared electrons. In salt, sodium gives an electron to chlorine. Sodium becomes positive, chlorine becomes negative, and opposite charges attract. This is an ionic bond. The game draws it as a dashed line.",
    "words": [["ion", "An atom with an electric charge because it gained or lost electrons."], ["ionic bond", "An attraction between positive and negative ions."], ["covalent bond", "A bond where atoms share electrons."]],
    "tryIt": ["Find enough molecules to unlock sodium and chlorine in the tray.", "Drop sodium onto chlorine.", "Look for the dashed line and the + and − signs. Compare with a water bond."],
    "check": [{"q": "What does sodium do with its electron?", "a": "Gives it to chlorine."}, {"q": "What is different about an ionic bond and a covalent bond?", "a": "Ionic bonds come from giving and taking an electron. Covalent bonds share electrons."}],
    "realLife": "Table salt is sodium chloride. In a real grain of salt, huge numbers of ions stack in a crystal.",
    "offScreen": "Stir a spoon of salt into a glass of warm water until it disappears. The salt ions spread out among the water molecules. Do not drink it.",
    "done": {"found": "salt"}
  },
  {
    "n": 13, "title": "Acids in the kitchen", "level": "Exploring", "minutes": 25,
    "bigIdea": "Acids taste sour. Vinegar has acetic acid, lemons have citric acid, and fizzy water has a little carbonic acid. Many acids contain a –COOH group, which can give away its hydrogen.",
    "words": [["acid", "A substance that can give away a hydrogen ion."], ["functional group", "A small group of atoms, like –COOH, that gives a molecule its special behavior."]],
    "tryIt": ["Build acetic acid, CH₃COOH.", "Find the C(=O)OH group in the Electrons view.", "Build carbonic acid and compare."],
    "check": [{"q": "What is the sour part of vinegar?", "a": "Acetic acid."}, {"q": "Name an acid you can find in a fruit.", "a": "Citric acid in lemons and limes."}],
    "realLife": "Acids add tang to food and drinks. Never taste an unknown chemical.",
    "offScreen": "With an adult, put a spoon of baking soda in a cup and add a little vinegar. Watch the bubbles. They are carbon dioxide gas.",
    "done": {"foundAll": ["acetic", "carbonic"]}
  },
  {
    "n": 14, "title": "Heat makes atoms move", "level": "Exploring", "minutes": 20,
    "bigIdea": "Temperature is a measure of how fast the particles in something are moving. In a solid they jiggle in place. In a liquid they slide past each other. In a gas they fly freely.",
    "words": [["temperature", "How fast particles are moving, on average."], ["solid, liquid, gas", "The three common states of matter."]],
    "tryIt": ["Build a water molecule and put a few more on the bench.", "Slide the Heat slider all the way up and watch the atoms shake.", "Press Shake. Then turn Heat down. How does the motion change?"],
    "check": [{"q": "What happens to particles when something gets hotter?", "a": "They move faster."}, {"q": "In which state do particles move the most freely?", "a": "Gas."}],
    "realLife": "Ice melts because heat makes water molecules move enough to slide past each other.",
    "offScreen": "Put an ice cube in a warm bowl and a cold bowl. Which melts faster, and why?"
  },
  {
    "n": 15, "title": "Reactions rearrange atoms", "level": "Exploring", "minutes": 25,
    "bigIdea": "In a chemical reaction, bonds break and new bonds form. The atoms are the same, but they end up in new molecules.",
    "words": [["reaction", "A change where atoms are rearranged into new molecules."], ["reactant", "A molecule you start with."], ["product", "A molecule you end up with."]],
    "tryIt": ["Discover hydrogen, oxygen and water.", "In the Atlas, put two H₂ and one O₂ on the bench.", "Press Spark in the Reactions panel and watch the atoms move into new places."],
    "check": [{"q": "What are the reactants in 2 H₂ + O₂ → 2 H₂O?", "a": "Hydrogen and oxygen."}, {"q": "What is the product?", "a": "Water."}],
    "realLife": "Rocket engines can burn hydrogen with oxygen. The only product is water.",
    "offScreen": "Take apart a LEGO model and build a different one from the same bricks. That is a reaction.",
    "done": {"reacted": "rocket"}
  },
  {
    "n": 16, "title": "Atoms never disappear", "level": "Exploring", "minutes": 25,
    "bigIdea": "In every reaction, the number of each kind of atom stays the same. Atoms are rearranged, not made or destroyed. This is called conservation of mass.",
    "words": [["conservation of mass", "Matter is not created or destroyed in a chemical reaction."], ["balanced equation", "An equation with the same atoms on both sides."]],
    "tryIt": ["Run two different reactions from the Reactions panel.", "Before each Spark, count the atoms on the bench by element.", "After Spark, count again. They should match."],
    "check": [{"q": "Do the atoms change in a reaction?", "a": "No. Only how they are connected changes."}, {"q": "How many oxygen atoms are in 2 H₂O?", "a": "Two."}],
    "realLife": "Chemists count atoms to figure out how much of each ingredient a factory needs.",
    "offScreen": "Count 10 coins into a cup, then split them into two cups. The total is still 10.",
    "done": {"reactedCount": 2}
  },
  {
    "n": 17, "title": "Fire is a reaction", "level": "Challenge", "minutes": 25,
    "bigIdea": "Burning is a reaction between a fuel and oxygen. Burning a fuel made of carbon and hydrogen makes carbon dioxide, water and heat.",
    "words": [["combustion", "Burning: a fuel reacts with oxygen and gives off heat."]],
    "tryIt": ["Find methane, oxygen, CO₂ and water.", "Put one CH₄ and two O₂ on the bench and press Spark.", "Try the propane reaction, which needs five oxygen molecules."],
    "check": [{"q": "What does burning methane make?", "a": "Carbon dioxide and water."}, {"q": "Why does a fire need air?", "a": "Air has the oxygen the fuel reacts with."}],
    "realLife": "Gas stoves, camp stoves and car engines all use combustion. Always have an adult handle real fire.",
    "offScreen": "With an adult, light a candle and cover it with a jar. Why does it go out?",
    "done": {"reactedAny": ["stove", "camp", "ethanolburn"]}
  },
  {
    "n": 18, "title": "Smells and flavors", "level": "Challenge", "minutes": 30,
    "bigIdea": "You smell something when its molecules reach your nose. Many flavors and smells come from molecules with rings and small groups on them, like the –OH and C=O groups in vanillin.",
    "words": [["ring", "Atoms connected in a circle."], ["benzene ring", "A flat ring of six carbons."]],
    "tryIt": ["Build benzene: six carbons in a ring with alternating double bonds.", "Build vanillin by adding –OH, –OCH₃ and –CHO to the ring.", "Rotate vanillin and find the ring and each group."],
    "check": [{"q": "Which smell is vanillin?", "a": "Vanilla."}, {"q": "What shape is a benzene ring?", "a": "A flat hexagon."}],
    "realLife": "Vanilla flavor, many perfumes and many dyes come from molecules built on rings.",
    "offScreen": "Smell vanilla extract, lemon and mint. Each smell is a different molecule."
    ,"done": {"found": "vanillin"}
  },
  {
    "n": 19, "title": "Chemistry inside you", "level": "Challenge", "minutes": 30,
    "bigIdea": "Your body runs on molecules. Glucose is a sugar your cells use for energy. Amino acids like glycine link together to make proteins. Vitamin C helps your body build collagen in skin.",
    "words": [["protein", "A long chain of amino acids folded into a shape."], ["amino acid", "A building block of proteins."]],
    "tryIt": ["Build glycine, glucose and vitamin C.", "In the Atlas, compare their shapes in the Ball & Stick view.", "Find the –OH groups on glucose and vitamin C."],
    "check": [{"q": "What does your body use glucose for?", "a": "Energy."}, {"q": "What do amino acids make?", "a": "Proteins."}],
    "realLife": "Eating fruit, bread and eggs gives you glucose, vitamin C and amino acids.",
    "offScreen": "Make a food diary page: write which food has sugar, protein or vitamin C.",
    "done": {"foundAll": ["glycine", "glucose", "vitc"]}
  },
  {
    "n": 20, "title": "Patterns in the elements", "level": "Challenge", "minutes": 30,
    "bigIdea": "Elements in the same column of the periodic table behave alike. Oxygen and sulfur both make 2 bonds, so H₂O and H₂S have the same bent shape. Fluorine and chlorine both make 1 bond, so NaF and NaCl are alike.",
    "words": [["periodic table", "A chart that arranges the elements so that similar ones line up."], ["family (group)", "A column of elements with similar behavior."]],
    "tryIt": ["Build hydrogen sulfide, H₂S, and compare its shape with water.", "Build sodium fluoride and compare it with table salt.", "Predict: what would the molecule made from hydrogen and fluorine look like? Why?"],
    "check": [{"q": "Why are H₂O and H₂S shaped alike?", "a": "Oxygen and sulfur are in the same family and each makes 2 bonds with 2 lone pairs."}, {"q": "Which two elements in the game are like chlorine?", "a": "Fluorine is in the same family."}],
    "realLife": "Chemists predict how new materials will behave by using patterns like these.",
    "offScreen": "Sort a pile of buttons by color, size and holes. Different ways of sorting show different patterns, just like the periodic table.",
    "done": {"foundAll": ["h2s", "naf"]}
  }
];
})(typeof globalThis !== 'undefined' ? globalThis : window);
