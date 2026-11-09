(function (root) {
'use strict';
const AA = root.AA = root.AA || {};

// Hand-checked facts for the Molecule Lab. state = at normal room temperature and pressure.
AA.MOLINFO = {
  water:    { shape: 'bent', state: 'liquid' },
  hydrogen: { shape: 'linear', state: 'gas' },
  oxygen:   { shape: 'linear', state: 'gas' },
  co2:      { shape: 'linear', state: 'gas' },
  nitrogen: { shape: 'linear', state: 'gas' },
  methane:  { shape: 'tetrahedral', state: 'gas' },
  hcl:      { shape: 'linear', state: 'gas' },
  salt:     { shape: 'ionic pair (a crystal in real life)', state: 'solid' },
  ammonia:  { shape: 'trigonal pyramid', state: 'gas' },
  peroxide: { shape: 'bent chain', state: 'liquid' },
  h2s:      { shape: 'bent', state: 'gas' },
  so2:      { shape: 'bent', state: 'gas' },
  naf:      { shape: 'ionic pair (a crystal in real life)', state: 'solid' },
  propane:  { shape: 'zig-zag chain', state: 'gas' },
  ethene:   { shape: 'flat', state: 'gas' },
  ethyne:   { shape: 'linear', state: 'gas' },
  ethanol:  { shape: 'chain', state: 'liquid' },
  acetic:   { shape: 'chain with a flat COOH end', state: 'liquid' },
  acetone:  { shape: 'chain with a flat middle', state: 'liquid' },
  urea:     { shape: 'flat middle with two NH₂ arms', state: 'solid' },
  carbonic: { shape: 'flat middle', state: 'only in water' },
  h2so4:    { shape: 'tetrahedral center', state: 'liquid (oily)' },
  h3po4:    { shape: 'tetrahedral center', state: 'solid' },
  glycine:  { shape: 'chain', state: 'solid' },
  butane:   { shape: 'zig-zag chain', state: 'gas' },
  benzene:  { shape: 'flat ring', state: 'liquid' },
  vanillin: { shape: 'flat ring with three groups', state: 'solid' },
  chlorine: { shape: 'linear', state: 'gas' },
  lactic:   { shape: 'chain', state: 'syrupy liquid' },
  citric:   { shape: 'chain', state: 'solid' },
  aspirin:  { shape: 'flat ring with two groups', state: 'solid' },
  glucose:  { shape: 'six-sided ring with a tail', state: 'solid' },
  vitc:     { shape: 'five-sided ring with a tail', state: 'solid' }
};

// molar mass in grams per mole from a counts object like {H:2, O:1}
AA.molarMass = function (counts) {
  let m = 0;
  for (const el in counts) m += counts[el] * AA.ELEMENTS[el].mass;
  return m;
};

// number of single / double / triple / ionic bonds in a molecule's SMILES
AA.bondTally = function (smiles) {
  const g = AA.chem.parseSmiles(smiles), t = { single: 0, double: 0, triple: 0, ionic: 0 };
  g.bonds.forEach(b => {
    if (AA.chem.isIonic(g.atoms[b.a].el, g.atoms[b.b].el)) t.ionic++;
    else t[['single', 'double', 'triple'][b.order - 1]]++;
  });
  return t;
};
if (typeof module !== 'undefined') module.exports = AA;
})(typeof globalThis !== 'undefined' ? globalThis : window);
