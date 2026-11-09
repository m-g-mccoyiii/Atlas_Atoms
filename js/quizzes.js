(function (root) {
'use strict';
const AA = root.AA = root.AA || {};

// One entry per lesson number. Each question: [question, right answer, wrong 1, wrong 2, why].
// These are the lesson "Check yourself" questions turned into multiple choice.
const RAW = {
  1: [["Can you see atoms with your eyes?", "No, they are too tiny", "Yes, if you look closely", "Only in the dark", "Atoms are far too small to see."],
      ["Which of these is made of atoms?", "All of them: a rock, water and air", "Only the rock", "Only living things", "Everything is made of atoms."]],
  2: [["What is the symbol for oxygen?", "O", "Ox", "Y", "O is oxygen."],
      ["What is the symbol for carbon?", "C", "Ca", "K", "C is carbon."]],
  3: [["How many hands does oxygen have?", "2", "1", "4", "Oxygen has two hands."],
      ["Why did the two hydrogens smile?", "Each one used its only hand", "They were cold", "They had no hands", "Hydrogen has one hand, and the bond used it."]],
  4: [["What do atoms share to make a bond?", "Electrons", "Colors", "Names", "Atoms share electrons."],
      ["How many lines are between the O atoms in O₂?", "2", "1", "3", "Two lines make a double bond."]],
  5: [["What does the little 2 in H₂O mean?", "2 hydrogen atoms", "2 oxygen atoms", "2 water molecules", "The little number counts the atom just before it."],
      ["How many atoms are in one water molecule?", "3", "2", "1", "Two hydrogens and one oxygen make 3."]],
  6: [["Is water bent or straight?", "Bent", "Straight", "Round", "Water is bent, like a boomerang."],
      ["Is carbon dioxide bent or straight?", "Straight", "Bent", "Round", "CO₂ is a straight line."]],
  7: [["What is most of the air?", "Nitrogen", "Oxygen", "Carbon dioxide", "About 78 of every 100 air molecules are nitrogen."],
      ["How many shared pairs are in N₂?", "3", "1", "2", "Three shared pairs make a triple bond."]],
  8: [["How many hands does carbon have?", "4", "2", "6", "Carbon has four hands."],
      ["What is the formula for methane?", "CH₄", "CO₂", "H₂O", "Methane is one carbon and four hydrogens."]],
  9: [["How many H atoms are in propane?", "8", "6", "3", "Propane is C₃H₈."],
      ["Why does a chain of carbons zig-zag?", "The bonds point to the corners of a tiny pyramid", "Carbons are lazy", "Hydrogens pull it sideways", "Four bonds spread out, so the chain bends."]],
  10: [["Which bond is shorter, single or double?", "Double", "Single", "They are the same", "More shared pairs pull atoms closer."],
       ["How many H atoms are in acetylene?", "2", "4", "6", "Acetylene is C₂H₂."]],
  11: [["Can two molecules have the same atoms but be different?", "Yes, if they are joined differently", "No, never", "Only if they are gases", "Different arrangements make isomers."],
       ["What is an isomer?", "Same atoms, different arrangement", "Same shape, different atoms", "A very small atom", "Isomers use the same atoms in a new arrangement."]],
  12: [["What does sodium do with its electron in salt?", "Gives it to chlorine", "Keeps it", "Shares it equally", "Sodium gives it away."],
       ["What is the dashed line in the game?", "An ionic bond", "A double bond", "A broken bond", "The dashed line shows an ionic bond."]],
  13: [["What makes vinegar sour?", "Acetic acid", "Salt", "Sugar", "Acetic acid is the sour part of vinegar."],
       ["Where do you find citric acid?", "Lemons and limes", "Rocks", "Salt", "Citrus fruit has citric acid."]],
  14: [["What does heat do to molecules?", "Makes them move faster", "Makes them stop", "Turns them into atoms", "Hotter means faster."],
       ["Which has molecules moving the most?", "Steam", "Ice", "Water", "Steam is the hottest of the three."]],
  15: [["What do you start with in 2 H₂ + O₂?", "Hydrogen and oxygen", "Water", "Carbon", "Those are the things that react."],
       ["What do you make?", "Water", "Salt", "Methane", "2 H₂ + O₂ makes 2 H₂O."]],
  16: [["Do atoms disappear in a reaction?", "No", "Yes, some do", "Only the small ones", "Atoms are only rearranged."],
       ["How many O atoms are in 2 H₂O?", "2", "1", "4", "Each water has one O, so two waters have 2."]],
  17: [["What does burning methane make?", "Carbon dioxide and water", "Salt and sugar", "Only heat", "CH₄ plus O₂ gives CO₂ and H₂O."],
       ["Why does fire need air?", "Air has the oxygen the fuel needs", "Air is cold", "Air is the fuel", "Burning needs oxygen."]],
  18: [["What does vanillin smell like?", "Vanilla", "Lemon", "Mint", "Vanillin is the smell of vanilla."],
       ["What shape is benzene?", "A flat ring", "A straight line", "A pyramid", "Benzene is a flat ring of six carbons."]],
  19: [["What does your body use glucose for?", "Energy", "Making bones only", "Breathing out", "Glucose is a sugar your body uses for energy."],
       ["What do amino acids build?", "Proteins", "Salt", "Water", "Amino acids link into proteins."]],
  20: [["Why are H₂O and H₂S shaped alike?", "Oxygen and sulfur are in the same family", "They are both gases", "They both have carbon", "Same family, so both have 2 hands."],
       ["Which element is in chlorine's family in the game?", "Fluorine", "Sodium", "Carbon", "Fluorine and chlorine both have 1 hand."]],
  21: [["What is an orbital?", "A cloud shape where an electron is likely to be", "A tiny planet", "A kind of bond", "Electrons are best pictured as clouds."],
      ["What shape is an s orbital?", "A ball", "A dumbbell", "A cube", "s orbitals are round."]],
  22: [["What shape is a p orbital?", "A dumbbell with two lobes", "A ball", "A ring", "A p orbital has two lobes."],
      ["How many p orbitals are in a set?", "3", "1", "6", "One each along x, y and z."]],
  23: [["What does carbon mix to make sp³ orbitals?", "One s and three p orbitals", "Two s orbitals", "Four d orbitals", "sp³ means one s and three p."],
      ["Where do sp³ orbitals point?", "To the corners of a tiny pyramid", "In a flat circle", "Straight up", "They point to the corners of a tetrahedron."]],
  24: [["Where is the π bond cloud?", "Above and below the atoms", "Inside the nucleus", "Far away from the molecule", "The π overlap is above and below the bond line."],
      ["Why is the C=C double bond in ethene flat?", "Twisting would pull the π cloud apart", "Carbon is flat", "The H atoms are heavy", "The side-by-side overlap only works when the molecule is flat."]],
  25: [["What do you get when two atomic orbitals overlap?", "Two molecular orbitals", "One atom", "Nothing", "Two orbitals in, two orbitals out."],
      ["Where are the electrons in a bonding orbital?", "Between the two nuclei", "Far from both", "Inside one nucleus only", "They pile up between the nuclei and hold them together."]],
  26: [["What is the bond order of H₂?", "1", "0", "2", "Two bonding electrons: (2 − 0) ÷ 2 = 1."],
      ["Why doesn't helium make He₂?", "Bonding and antibonding electrons cancel", "Helium is too heavy", "Helium has no electrons", "Four electrons fill both orbitals, so the bond order is zero."]]
};

AA.QUIZZES = {};
Object.keys(RAW).forEach(n => {
  AA.QUIZZES[n] = RAW[n].map(r => ({ q: r[0], right: r[1], wrong: [r[2], r[3]], why: r[4] }));
});
})(typeof globalThis !== 'undefined' ? globalThis : window);
