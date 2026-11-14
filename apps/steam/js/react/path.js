// Rules of a round played by choosing the product. Nothing here draws.
// An order offers some of the rack's reagents. Each bottle is one use and an order allows DIAL.steps reactions.
// A reagent reacts at every matching site. One group on the molecule is marked, and a batch delivered with it
// intact is multiplied. Equipment acts on the shared words of the game: site, step, chain link, loop, leaving group,
// first use, steps unused, marked group. No piece names a reagent, so any two pieces can work together.
// The main game does not load this file, so the dials set here do not change it.
(function (root) {
'use strict';
const AA = root.AA, RX = AA.rx, RUN = AA.rxRun;
// the cascade game's versions of hydroborate and reduce (rules.js, MODE): neither wipes out every C=O at once
RX.MODE.zip = true;
// One source for every random draw on the run path: dealing, salt, picks, rounds on offer, rare reagents, wishes, terms.
// seed(n) makes every draw repeatable from n, so a whole run can be played again. seed() goes back to the system's.
let SRC = Math.random;
const rand = () => SRC();
function seed(n) {
  if (n == null) { SRC = Math.random; return; }
  let a = (n >>> 0) || 1;
  SRC = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// The molecules a round is dealt, each with its family. Every one is built to cascade with the six reagents a run
// starts with (docs/CASCADES.md): a chain that carries C=O three or four carbons apart, where a zip can run from one
// to the next, and an OH or something that can be made into one at an end. As dealt most zip one or two steps. The
// rest is behind gaps the player has to fix: an OH or a C=C where a C=O should be (the starting reagents fix those),
// or a stretch of six or eight carbons with more C=O beyond it, which takes a bridge, a weld, a snap or a new OH at
// the far end to reach. They get longer by round: FEEDSIZE says how many heavy atoms a round asks for and runBriefs
// deals from the molecules near that.
const FEED = [
  // chains
  // the first eight are for rounds one and two. Each has an OH that oxidize cannot take (three carbons on its carbon) or an
  // aldehyde end that reduce turns into one, and a spare C=C or two that hydrate and hydroborate can act on without harm,
  // so that most lines of three set the zip off (docs/RIG.md, the novice)
  ['chain', 'O=CCCC(=O)CCC=C'], ['chain', 'CC(C)(O)CCC(=O)CCC=C'], ['chain', 'C=CCC(C)(O)CCC(=O)CCC=C'], ['chain', 'O=CCCC(=O)CCC(=O)CCC=C'],
  ['chain', 'O=CCCC(C)(O)CCC(=O)CCC=C'], ['chain', 'C=CCCC(C)(O)CCC(=O)CCC=C'], ['chain', 'O=CCCC(=O)CCC(C)(O)CCC=C'], ['chain', 'C=CCCC(=O)CCC(=O)CCCC=O'],
  ['chain', 'CC(O)CCC(=O)CCC=CCCC(=O)C'], ['chain', 'CC(C)(O)C=CC=CCCCC=CC(=O)CCC(=O)C'], ['chain', 'CC(C)(O)CCC(=O)CCCCCC(=O)CCC(=O)C'], ['chain', 'CC(C)(O)CCC(=O)CCC(O)CCC(=O)CCC=C'],
  ['chain', 'C=CCCC(=O)CCC(=O)CCCCCC(O)CCC(=O)C'], ['chain', 'O=CCCC(=O)CCC(O)CCCCCC(=O)CCC(=O)C'], ['chain', 'CC(=O)CCC(=O)CCC(O)CCCCCC(=O)CCC(=O)C'], ['chain', 'C=CCCC(O)CCC(=O)CCCCCCCC(=O)CCC(=O)C'],
  ['chain', 'CC(C)(O)C=CC=CCCCC=CC(=O)CCC(=O)CCC(=O)C'], ['chain', 'CC(C)(O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C'], ['chain', 'C=CCCC(=O)CCC(=O)CCC(O)CCCCCC(=O)CCC(=O)CCC(=O)C'], ['chain', 'C=CCCC(=O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C'],
  ['chain', 'O=CCCC(=O)CCC(O)CCC(=O)CCCCCCCC(=O)CCC(=O)CCC=C'], ['chain', 'CC(C)(O)CCC(=O)CCC(O)CCC(=O)CCCCCC(=O)CCC(=O)CCC(=O)C'], ['chain', 'CC(=O)CCC(=O)CCC(=O)CCC(O)CCCCCCCC(=O)CCC(=O)CCC(=O)C'], ['chain', 'CC(C)(O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C'],
  // a ring of carbon on the chain, or a C=O in a ring
  ['ring', 'C=CCCC(=O)CC1CCCC1=O'], ['ring', 'C=CCCC(O)CCC(=O)C1CCCC1'], ['ring', 'OC1(CCCC1)CCC(=O)CCC=C'], ['ring', 'C=CCCC(=O)CCC1(O)CCCC1'], ['ring', 'OC1(CCCC1)CCC(=O)CCCC=O'], ['ring', 'O=CCCC(=O)CCC1(O)CCCC1'],
  ['ring', 'C=CCCC(=O)CCC(=O)CC1CCCC1=O'], ['ring', 'C=CCCC(O)CCC(=O)CCC1(O)CCCC1'], ['ring', 'OC1(CCCCC1)CCC(=O)CCC(O)CCC(=O)C'], ['ring', 'CC(=O)CCC(O)CC1CCC(CC1)CC(O)CCC(=O)C'],
  ['ring', 'OC1(CCCCC1)C=CC=CCCCC=CC(=O)CCC(=O)C'], ['ring', 'OC1(CCCCC1)CCC(=O)CCCCCC(=O)CCC(=O)C'], ['ring', 'CC(=O)CCC(=O)CCC1(O)CCCC1CCCCCC(=O)CCC(=O)C'], ['ring', 'C=CCCC(=O)CCC(O)CCC1(O)CCCC1CCC(=O)CCC(=O)C'],
  ['ring', 'CC(=O)CCC(=O)CCC(O)CC1CCC(CC1)CCC(=O)CCC(=O)C'], ['ring', 'OC1(CCCCC1)CCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C'], ['ring', 'OC1(CCCCC1)CCC(=O)CCC(O)CCC(=O)CCCCCC(=O)CCC(=O)CCC=C'], ['ring', 'OC1(CCCCC1)CCC=CCCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C'],
  // a benzene ring: an OH on it can start a zip and nothing takes it away
  ['arene', 'OC1=CC=CC=C1CCC(=O)CCC=C'], ['arene', 'OC1=CC=CC=C1CCC(=O)CCCC=O'], ['arene', 'OC1=CC=CC=C1CCC(O)CCC(=O)C'], ['arene', 'OC1=CC=CC=C1CCC(=O)CCC(=O)CCC=C'], ['arene', 'OC1=CC=CC=C1CCC(=O)CCC(O)C'], ['arene', 'C=CCCC(=O)CCC(=O)C1=CC=CC=C1'],
  ['arene', 'OC1=CC=CC=C1CCC(=O)CCC(O)CCC(=O)C'], ['arene', 'CC(=O)CCC(O)CCC(=O)C1=CC=C(C=C1)C(C)=O'], ['arene', 'C=CCCC(=O)CCC(O)CCC(=O)C1=CC=C(C=C1)C(C)=O'], ['arene', 'C=CCCC(O)CCC(=O)CCC(=O)C1=CC=C(C=C1)C(=O)CCC(=O)C'],
  ['arene', 'OC(C1=CC=CC=C1)C=CC=CCCCC=CC(=O)CCC(=O)CCC(=O)C'], ['arene', 'OC1=CC=CC=C1CCC(=O)CCC=CCCC=CCCC=CCCC(=O)C'], ['arene', 'OC1=CC=CC=C1CCC(=O)CCC(O)CCC(=O)CCCCCC(=O)CCC(=O)C'], ['arene', 'OC1=CC=CC=C1CCC(=O)CCC=CCCC=CCCC=CCCC=CCCC(=O)C'],
  ['arene', 'OC1=CC=CC=C1CCC(=O)CCC(O)CCC(=O)CCCCCCCC(=O)CCC(=O)C'], ['arene', 'OC1=CC=CC=C1CCC(=O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C'],
  // many OH: every one can be made a C=O at once
  ['sugar', 'CC(C)(O)CCC(O)CCC(O)C'], ['sugar', 'OCCCC(O)CCC(O)CCC=C'], ['sugar', 'CC(C)(O)CCC(O)CCC(O)CCC=C'], ['sugar', 'CC(C)(O)CCC(O)CCC(O)CCCCCC(O)CCC(=O)C'],
  ['sugar', 'OCCCC(O)CCC(O)CCC(O)CCCCCC(=O)CCC(=O)C'], ['sugar', 'CC(C)(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)C'], ['sugar', 'C=CCCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)C'], ['sugar', 'CC(C)(O)CCC(O)CCC(O)CCC(O)CCCCCC(O)CCC(O)CCC=C'],
  ['sugar', 'OCCCC(O)CCC(O)CCC(=O)CCCCCC(O)CCC(O)CCC(O)CCC=C'], ['sugar', 'C=CCCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)C'],
  // a cage at the end of the chain
  ['cage', 'OC1(CCC(=O)CCC=C)CC2CCC1C2'], ['cage', 'C=CCCC(=O)CCC(C)(O)C1CC2CCC1C2'], ['cage', 'CC(=O)CCC(=O)CCC(O)C1CC2CCC1C2'], ['cage', 'CC(O)CCC(=O)CCC(=O)C12C3C4C1C5C2C3C45'], ['cage', 'C=CCCC(=O)CCC(O)C12CC3CC(CC(C3)C1)C2'],
  ['cage', 'CC(C)(O)CCC=CCCC=CCCC=CCCC(=O)C12C3C4C1C5C2C3C45'], ['cage', 'CC(=O)CCC(=O)CCCCCC(=O)CCC(O)C12CC3CC(CC(C3)C1)C2'], ['cage', 'C=CCCC(=O)CCC(O)CCC(=O)CCCCCC(=O)C12C3C4C1C5C2C3C45'], ['cage', 'CC(C)(O)C=CC=CCCCC=CC(=O)CCC(=O)CCC(=O)C12C3C4C1C5C2C3C45'],
  ['cage', 'CC(=O)CCC(=O)CCCCCC(=O)CCC(O)CCC(=O)CCC(O)C12CC3CC(CC(C3)C1)C2']
];
// MOLECULES V2 BEGIN (written by docs/tools_mol2_bake.py from docs/tools_chem/molecules2_feed.js and molecules2_bank.js; replace it wholesale)
const FEED2 = {"pool":[[1,"ring","C=C1CC(C)C(O)C1C=O"],[1,"chain","C=CC(O)CC(=O)CSC"],[1,"chain","C=CCCC(=O)CCC=O"],[1,"ring","C=CCCC1C=CCC1=O"],[1,"ring","NCC1CC=CC(C=O)C1"],[1,"ring","O=C1CC=CC1CCCO"],[1,"arene","O=CC=CC1=CC=CC=C1"],[1,"ring","C=C(C)C1=CCC(C)CC1=O"],[1,"chain","C=C(C)CCC(=O)CC(=C)C"],[1,"chain","C=CC(CCC)C(O)CC=O"],[1,"ring","C=CC1NCC(C(C)=O)C1O"],[1,"chain","C=CCC(=O)CCC(C)(C)O"],[1,"arene","C=CCC(=O)C1=CC=CC=C1"],[1,"ring","CC(C)=C1CCC(C)CC1=O"],[1,"chain","CC(C)=CCCC(C)=CC=O"],[1,"chain","CCCCCC=CC=CC=O"],[1,"ring","C=C(C)C1CCC(C)C(=O)C1=O"],[1,"chain","C=C(C)CC(=O)CCC(C)(C)O"],[1,"chain","C=C(C)CCC(=O)CCCC=O"],[1,"chain","C=C(C)CCCC(=O)CCC=O"],[1,"ring","C=CC(O)CCCC1CCCC1"],[1,"chain","C=CCCC(=O)CCC(C)(C)O"],[1,"ring","CC(=O)C=CC1NCCCC1O"],[1,"chain","CC(C)=CCCC(=O)CCCO"],[2,"ring","C=C(C)C1CC=C(C)C(=O)C1"],[2,"chain","C=CC(CC(=O)CCO)SC"],[2,"chain","CCCCCC(O)C=CC=O"],[2,"ring","CSCC1C(=O)CC=CC1O"],[2,"ring","O=CC(C=C1CCCC1)CO"],[2,"chain","C=C(C)CCCC(=O)CC(=C)C"],[2,"chain","C=CCCCC(=O)CCCC=O"],[2,"ring","CC(=O)C=CC1CNCCC1O"],[2,"chain","CC(C)=CCCC(=O)CCC=O"],[2,"chain","C=CC(=O)C(CC(C)(C)O)NCC"],[2,"ring","C=CCCC(=O)CC1CCCC1=O"],[2,"ring","C=CCCC1CCC(CC=O)C1=O"],[2,"ring","CC(C)=C1C(=O)CC(C)(O)CC1=O"],[2,"chain","CC(C)=CCC(=O)CCC(C)(C)O"],[2,"chain","O=CCCCC(=O)CCCCCO"],[2,"arene","C=CC(=O)C1=C(O)C(OC)=C(O)C=C1"],[2,"arene","C=CC(O)(CC=O)CC1=CC=CC=C1"],[2,"chain","C=CC(O)CC(=O)CCCCC(=O)O"],[2,"ring","C=CCC(O)CC(=O)C1CCCCN1"],[2,"ring","CC(=O)C=CC1C(C)=CCCC1(C)C"],[2,"ring","CC(=O)CC(O)C=CC1CCCSC1"],[2,"chain","CC(=O)CCC=C(C)CCC=C(C)C"],[2,"arene","CC(C=CC=O)C(O)C1=CC=CC=C1"],[2,"ring","O=CCCC(=O)CCC1(O)CCCC1"],[3,"ring","CC(C=O)=C1C(=O)CC(C)CC1O"],[3,"arene","OCC(O)COC1=CC=C(Cl)C=C1"],[3,"ring","C=C(C=O)CC1(O)CSC(CC=O)C1"],[3,"ring","C=CCC(=O)CCC1CC=CC(O)C1"],[3,"ring","C=CCCC(=O)CCC1(O)CCCC1"],[3,"chain","C=CCCCCCCCCC=CC=O"],[3,"ring","CC(=O)C=CC1=C(C)CCCC1(C)C"],[3,"chain","CC(C)=CCC(=O)CCCC(C)(C)O"],[3,"chain","CC(C)=CCCCC(=O)CCCC=O"],[3,"chain","CC(O)CCC(=O)CCCC(C)(C)O"],[3,"chain","CC(O)CCCCC(=O)CCCC=O"],[3,"cage","CC1(C)C2CCC1(CCCO)C(=O)C2"],[3,"ring","C=CC(C=C1CCNC1)C(=O)CC(C)=O"],[3,"ring","C=CCCC1CC(C(O)CC(C)N)C1=O"],[3,"chain","CC(C)(CO)C(O)C(=O)NCCC(=O)O"],[3,"chain","CC(O)CCCC(=O)CCCC(C)(C)O"],[3,"ring","CC1=CCCC(C)=CCC(C)(C)C=CC1"],[3,"ring","O=C(O)CCCC(O)C1CCC=CC1=O"],[3,"chain","O=CC=CC(O)CCCCCCCCO"],[3,"ring","O=CCCCC(=O)CCC1(O)CCCC1"],[3,"fused","C=CC(=O)C1=CC(CO)=C2CC=CCC2=C1"],[3,"arene","C=CCCC(=O)CCC(=O)C1=CC=CC=C1"],[3,"arene","C=CC1=CC(C(=O)O)=CC(C(O)CC=O)=C1"],[3,"fused","C=CC1=C2C(=C(CCO)C=C1)C(=O)CC2O"],[4,"spiro","C=C1CC(O)(CC=O)C(O)C12CCCC2"],[4,"chain","C=CC(=C)CCC=C(C)CCC=C(C)C"],[4,"chain","C=CC(O)(CCC=C(C)C)CCCCN"],[4,"fused","CC(=O)CCCC1=CCC2C(C1)C2(C)C"],[4,"ring","O=CC=C(C=O)CCCCC=CC1CO1"],[4,"fused","C=C(C)C1CCC2=CC(=O)CC(C)C2(C)C1"],[4,"chain","CC(=O)CCCCCCCC(O)C=CC=O"],[4,"fused","CC=CC(O)C1C(=O)C(Cl)C2=CC=CC=C21"],[4,"ring","O=C(O)CCCC(O)CC(=O)C1=CCCC1"],[4,"arene","O=CCCCC(=O)CCC1=CC=CC=C1O"],[4,"ring","CC1=CCCC(C)(C)C1C=CC(=O)CCCO"],[4,"chain","CC=CCC(CCCSC)C(S)C=CCC=O"],[4,"arene","CCC(N)C=CC(=O)CC(O)C1=CC=CC=C1"],[4,"cage","CCC1=C2C(CC=O)=C3CC1C(=O)C(C3)C2N"],[4,"fused","C=C(C)C1(O)CCC2=CC(=O)CC(CN)C2(C)C1"],[4,"spiro","C=CCC(=O)CSC1CCC(=O)C12CCC(N)C2"],[4,"cage","CC(=O)CCC(=O)CCC(O)C1CC2CCC1C2"],[4,"spiro","CCNCC(C=O)C=C1C=CC2(CCC(=O)C2)C1"],[4,"spiro","O=CCC(O)CCCC1CCCC12C=CC(=O)C2"],[4,"cage","C=CCC(O)CCC1CC2CC(CCC(C)=O)C1C2"],[4,"cage","CC(=O)C=CC1C2CCC(CC2O)C1CCCCN"],[4,"ring","CC(C=CC1(O)C(C)=CC(=O)CC1(C)C)=CC(=O)O"],[4,"arene","CC(O)CC(=O)CCC1=CC=C(CCCCN)C=C1"],[4,"arene","OCC1OC(OC2=CC=C(O)C=C2)C(S)C(O)C1O"],[5,"fused","C=C(C)C1(O)CCC2=CC(=O)CC(CO)C2(C)C1"],[5,"fused","C=C(C)C1CCC2=CC(=O)C(N)C(C)C2(C)C1=O"],[5,"arene","C=CC1C(=O)C1C1=C(O)C=C(C=O)C=C1CCC"],[5,"cage","C=CCCC(=O)CCC(C)(O)C1CC2CCC1C2"],[5,"spiro","CC(O)CCC1(O)C=CC2(CC(=O)CC(O)C2)C1"],[5,"fused","CC=C1CC2C(=O)CC(O)CC2C(C(C)=O)C1=O"],[5,"spiro","C=CC1CC(=O)CC12CC=CC=C2CC(CO)SC"],[5,"ring","CC(=O)C=CC1C(C)=CCCC1(C)CCCCCO"],[5,"ring","C=CC(=O)CC(O)C(N)CCCCCC1CCCSC1"],[5,"chain","C=CCC(O)CCCC(=O)CCCC(=O)CCCCN"],[5,"chain","CC(=O)CCC(=O)CCCCCC(=O)CCC(C)(C)O"],[5,"chain","CCC=CCC=CCC=CCCCCCCCC(=O)O"],[5,"cage","NC12CC=C(CC1)C2CCC(O)CC(=O)CCCC=O"],[5,"cage","O=CCC(O)CCCC(=O)C12CC(O)C(CCC1O)N2"],[5,"chain","C=CC(CCC)C(=O)C(CC=O)CC(N)C(C)CCSC"],[5,"spiro","C=CC(O)CCC1CCC2(CCC(CCC=O)C2)CC1N"],[5,"ring","CC(C=CC=C(C)C=CC1=C(C)CCCC1(C)C)=CC=O"],[5,"cage","CC12CC3CC(C)(C1)C(CCC(=O)CCC=O)C(N)(C3)C2"],[5,"spiro","COC1=C2OC3CC(=O)C=CC34CCN(C)CC(=C24)C=C1"],[5,"ring","O=C(O)CCCC1CCCCC1CC(=O)C=CCCCO"],[5,"fused","C=CC(C)(O)CCC1C(C)(O)CCC2C(C)(C)CCCC21C"],[5,"arene","C=CC(O)CCC1=CC(CC(O)CC=O)=CC(CCCCl)=C1"],[5,"arene","CC(C)(O)CCC(=O)CCC1=CC=C(CCCCC=O)C=C1"],[5,"arene","CC(C)=CCC(=O)CCC1=CC=CC=C1CCCCCC=O"],[6,"fused","CC12CCC(=O)C=C1CCC1C2CCC2(C)C(O)CCC12"],[6,"ring","NCCCC1C=CC(CC(O)CC=O)CC1CCCCO"],[6,"chain","C=CC(CC(N)(C=C(CCC)CSC)CCC(C)=O)C(C)=O"],[6,"cage","CCC=CCC(N)(CC1C2CCC(C2)C1O)C(O)CCC=O"],[6,"spiro","CCSCC=CCC(=O)C1C=CCC(S)C12CC(O)CC2=O"],[6,"arene","O=C(O)C=CCC(O)(C1=CC=CC(O)=C1)C1=CC(=O)CSC1"],[6,"fused","C=C(C)C1=CC2=CCC3C(C)(C(=O)O)CCCC3(C)C2CC1=O"],[6,"cage","C=C(C)CCC(=O)C1=C2CC(=O)C(SC(CCCl)C(C)O)(C2)C1"],[6,"ring","CC(=O)CCC(=O)C=CCCCC=CC=CC1(O)CCCCC1"],[6,"spiro","CC=C(CCO)CC1C(=O)C2(CCCC2)C(CCC(=O)O)C1O"],[6,"chain","CSCCCC=CC=CCCCC=CC(=O)CCCCC(C)=O"],[6,"arene","C=C(C)CCCCC(=O)CCC(O)CC(=O)CCC1=CC=CC=C1"],[6,"chain","C=C(C)CCCCC(O)CCCC(=O)CCC(=O)CCCCCN"],[6,"chain","CC(=O)CCC(=O)CCC(=O)C=CCCCC=CC=CC(C)(C)O"],[6,"spiro","CC1C(C(=O)C(O)C2CNCC(C=O)O2)=CCC12CC(O)CC2O"],[6,"arene","COC1=C(O)C=CC(CNC(=O)CCCC(O)C=CC(C)C=O)=C1"],[6,"cage","CSCCCC(=O)C1=C2CC(C(S)C(O)CCC(C)=O)C(N)(C2)C1"],[6,"cage","NC1(CCC23C4C5C6C4C2C6C53)C(=O)CC=CC1CC(=O)C(=O)O"],[6,"ring","NCCCC(=O)CCCC1CCCC(CC(=O)C=CCCCO)C1"],[6,"arene","C=CCCCC1=CC(CC(O)CC(C)=O)=CC(CC(S)CCC=O)=C1"],[6,"spiro","CC(=O)C=CC1CC(Cl)CC2(CCCC(CC(O)CCC=O)C2=O)C1"],[6,"ring","CCCCCC(O)C=CC1C(=O)CC(O)C1CC=CCCCC(=O)O"],[6,"fused","CC12CCC(=O)C=C1CCC1C2C(Cl)CC2(C=O)C(C(=O)CO)CCC12"],[6,"fused","CC12CCC(=O)C=C1CCC1C2C(O)CC2(C)C1CCC2(O)C(=O)CO"],[7,"arene","COC1=C(O)C=CC(CNC(=O)C(=O)CC(O)C(O)C=CC(C)C)=C1"],[7,"ring","NC(CCC=CCCC(O)CCCC=O)CCC1(C=O)CCCCC1"],[7,"spiro","C=C(CCC(=O)O)C(O)CC(=O)CCC1(O)CCC2(CCCC2N)CC1"],[7,"fused","C=CCCCCNCC(Cl)C(O)C(O)C1C(=O)C(N)CC2=CC=CC=C21"],[7,"chain","CC(=O)C=C(CCCC(=O)O)C(S)CC(O)(CCCC(C)O)CC(C)C"],[7,"cage","CC(=O)CCCN1CCC23C4=C5C=CC(O)=C4OC2C(O)C=CC3C1C5"],[7,"fused","CC12CCC(=O)C=C1CCC1C2C(O)CC2(C=O)C(C(=O)CO)CCC12"],[7,"cage","O=CCCCC(=O)CCC1CC2CC(CCCC(O)CCCCCl)C1C2"],[7,"arene","C=CCCC(=O)CCC1=CC(CCCCCO)=CC(CCCCC(C)=O)=C1"],[7,"ring","CC(=O)CCC(=O)CCC(O)CC1CCC(CCC(=O)CCC(C)=O)CC1"],[7,"fused","CC=CCC(=O)CCC1CCCC2C(CCC3OC3CCCCO)CCC12"],[7,"chain","CCCC(CC=O)C(O)C(CCCO)C(N)C(CC=CC=O)CCC(=O)O"],[7,"arene","COC1=C(O)C=CC(C=CC(=O)CC(=O)C=CC2=CC(OC)=C(O)C=C2)=C1"],[7,"cage","NC12CC3CC(C4=CC(O)CSC4CC=O)(C1)CC(CC(=O)CCl)(C2)C3O"],[7,"cage","CC(C)(O)CCC=CCCC=CCCC=CCCC(=O)C12C3C4C5C3C1C5C42"],[7,"fused","C=CCCC(=O)CC(CCCC=O)C(O)CC1=C(O)C(O)=CC2=C1CCC(O)C2"],[7,"spiro","CCCC1=C(O)C(CCC=C2C=CCC3(C2)C(=CCC=O)CCCC3O)=CC=C1"],[7,"chain","CSCCCC(=O)CC(O)CCC(=O)CCC(=O)CCCC(=O)CCCCCN"],[7,"spiro","NC(CCCC1CCC2(C1)C(O)CC(O)C2CCCCC=CC=O)CCC(=O)O"],[7,"spiro","NCCCC(=O)CCCC1CCC2(CC1)CCC(CC(=O)C=CCCCO)CC2"],[7,"ring","O=C(O)CCCC=CCC1C(O)CC(=O)C1C=CC(O)CCCCCCCCS"],[7,"arene","CC(=CCCCCC=O)CCCC(=O)CCC(O)CCC(=O)CCC1=CC=CC=C1"],[7,"chain","CC(C)=CCCC(C)=CCCC(C)=CCCC=C(C)CCC=C(C)CCC=C(C)C"],[7,"ring","CC=CCC(=O)CCC1CCC(CCCC(=O)O)C(CCC(=O)CCCC(C)=O)C1"],[8,"chain","C=CCCC(=O)CCCC(=O)CCC(O)CCCC(=O)CCC(=O)CCCSC"],[8,"ring","CCCC(N)C(C=O)C(=O)C1=CC(CC(CCC)C(N)CCCC(=O)O)CSC1"],[8,"arene","COC1=C(O)C=CC(C=CC(=O)CC(=O)C(O)C(O)C2=CC(OC)=C(O)C=C2)=C1"],[8,"ring","NCCCCCCCCC(O)C=CC1C(O)CC(O)C1CC=CCCCC(=O)O"],[8,"fused","C=C1C(=CC=C2CCCC3(C)C2CCC3C(C)CCCC(C)(C)O)CC(O)CC1O"],[8,"chain","CC(C)(CCCC(=O)CCC(=O)CCCN)OC(=O)CCCC(=O)CCCCC=O"],[8,"arene","CCSCCC1=CC(CCC(=O)CCCC=O)=CC(CCC2OC2CCCCO)=C1"],[8,"cage","NC(CCC(=O)O)CC(=O)C1C2C=C3CC(C2)CC1C3(S)CC(O)C1=CC=CC=C1"],[8,"fused","O=CC12CC(O)C3C(CCC4=CC(=O)CCC43CCCCCl)C1CCC2C(=O)CO"],[8,"spiro","O=CCCCC(=O)CCC1CCC2(CC1)CCC(CCC(O)CCCC(=O)O)CC2"],[8,"cage","C=CCC=CCC12CC3CC(C1)CC(C(=O)C=CCCCO)(C3)C2CC(N)CCC=O"],[8,"chain","C=CCCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(C)O"],[8,"cage","CC(C)(O)C=CC=CCCCC=CC(=O)CCC(=O)CCC(=O)C12C3C4C5C3C1C5C42"],[8,"ring","CC(C)=CCCC(C)=CCCC(C)=CCCC=C(C)CCC=C(C)CCC1OC1(C)C"],[8,"spiro","CCC1OC1CC1CCC2(CCC(C(=O)C=CCCCO)C2)CC1CC(=O)CCC=O"],[8,"spiro","CCCC(CC1CC2(CCCCC2O)CC(N)(CC=C(CC)C(=O)C=O)C1O)C(C)Cl"],[8,"spiro","C=CC(=O)CC(=O)C(CC1CC2(CCCC2)CC(O)C1=O)C(O)CCCCCCC(=O)O"],[8,"fused","CC(C)C(C)C=CC(CO)C1CCC2(O)C3=CC=C4CC(O)CCC4(C)C3CC(=O)C12C"],[8,"fused","CC(=CCC1=C(C)C(=O)C2=CC=CC=C2C1=O)CCCC(C)CCCC(C)CCCC(C)C"],[8,"arene","CC(=O)CCC(=O)CCCCCCCC(=O)CCC(O)CCC(=O)CCC1=CC=CC=C1O"],[8,"chain","CC(C)=CCCC(C)=CCCC(C)=CCCC=C(C)CCC=C(C)CC(O)C=C(C)C(=O)O"],[8,"arene","CC(N)CC(O)(CCC=CCCCC1=C(CC2=CC=CC=C2)CCC=C1)CC(Cl)CCC=O"],[8,"ring","CCC=C1CC(CCC(=O)O)CC(C(=O)CC(N)(CCCNC)CC2=CC(Cl)CCC2=O)C1"],[8,"cage","O=CCCCCC(O)CCC(=O)CCC(=O)C=CCCCC=CC=CCC1C2CCC1CC2"],[9,"fused","CC(=O)CCCC12CCC(=O)C=C1CCC1C2C(O)CC2(C=O)C(C(=O)CO)CCC12"],[9,"spiro","CC(C)(O)CCC(=O)CCC1CCC2(CC1)CCC(CCC1OC1CCCCO)CC2"],[9,"fused","CC(C)=CCCC(C)C1CCC2(C)C3=C(CCC12C)C1(C)CCC(O)C(C)(C)C1CC3"],[9,"ring","O=C(O)CCCC=CCC1C(O)CC(=O)C1C=CC(O)CCCCCCCCC(=O)O"],[9,"cage","C=CC(O)CCC12CC3CC(CCC(=O)CCC(C)=O)(C1)CC(CC(N)CCC=O)(C3)C2"],[9,"ring","CC(=O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC1(O)CCCCC1"],[9,"ring","CCCC1CC(C(=O)NC(C(C)Cl)C2OC(SC)C(O)C(O)C2O)N(CCCC(C)=O)C1"],[9,"fused","C=CCC(CC(CC(O)(CC(=C)C)C(C)=O)C(Cl)CC12CCCCC1C(O)CCC2)C(C)Cl"],[9,"chain","CC(=CCCCCC=O)CCCC(=O)CCC(O)CCCC(=O)CCC(=O)CCCCCN"],[9,"cage","CC(=O)CCCCC=CCC(=O)CCC(=O)C=CCCCC=CC=CCC1C2CCC1CC2"],[9,"ring","CC=CCC(=O)CCC1CCC(CCC(=O)CCCCCO)CC1CCCC(=O)CCCN"],[9,"chain","CC(C)=CCCC(C)=CCCC(C)=CCCC=C(C)CCC=C(C)CCC=C(C)CCCCN"],[9,"arene","CC(O)C(Cl)C(=CC1=CC(C2=CC=C(C3=CC=CC(O)=C3)C=C2)=CC=C1)C(N)C(CO)CC=O"],[9,"arene","NCCCC(=O)CCCC1=CC(CCCC(O)CCCCCl)=CC(CCC(=O)CCCC=O)=C1"],[9,"chain","C=CCC(CC=C)CC(=O)C(CC(O)CC(Cl)CC(=O)O)CC(CC=C)C(O)CCCCCCC"],[9,"arene","CC(=O)CCCC(=O)CCC1=CC(CCCC(=O)CCCS)=CC(CCCC(O)CCCCCl)=C1"],[9,"chain","CC(=O)CCCCC(O)CCCC(=O)CCC(=O)CCC(O)CCCC=CC(=O)CCCC(=O)O"],[9,"spiro","CCC(N)C(CC(=O)O)CC1(O)CC(O)CCC12CCC(O)(CC(=O)CCC1CC=CCO1)CC2"],[9,"spiro","CCCCCCC(O)CCCC(=CC(=O)CCCCC(C)O)C(O)C1CC(O)CC12CCCC2N"],[9,"spiro","CCCCSCC(O)C(C(=O)C(S)CC(O)C(O)CC=O)C(N)CCC1CCC(Cl)C12CCCC2"],[9,"cage","CCCSCC(=CC(=O)C(O)CCC(=O)O)CC1CC2OC1C(O)C2CCCCC(S)CCC=O"],[9,"arene","O=C(O)CCCC(O)CCC1=CC(CCC2OC2CCCCO)=CC(CCCC(=O)CCCS)=C1"],[9,"cage","O=CC(CC1=C2CCC(C2)C1)C1(O)CC2(CCCCC2O)C(=O)C1C1(O)CC2CC1(C=O)CC2O"],[9,"fused","O=CCCCCC(=O)C=CCCCC=CC=CCCC=CCC(=O)CC1CCCC2CCCCC21"]],"bank":[[1,"chain","C=C(C)C=C(CCC)CCC=O"],[1,"chain","C=CC(CC(C)=O)SCC"],[1,"ring","O=CCC1C=CCCC1=O"],[1,"chain","C=CCCCC(=O)CCC=O"],[1,"chain","C=C(CCC)C(=O)C(C)C=O"],[1,"chain","C=CCCC(=O)CCCCCC"],[1,"chain","CCC=CCC(=O)CCCC=O"],[1,"ring","C=CCCC(=O)C1NCCC1=O"],[1,"arene","O=CCC=CC1=CC=CC=C1"],[1,"ring","C=CC1CCNC(CC)C1=O"],[1,"chain","C=CCCC(=O)CCCCC"],[1,"chain","C=C(C)CCC(=O)CCC"],[1,"ring","C=C1CC(=O)CC(C(C)=O)C1"],[1,"chain","C=CCCC(=O)CCCC(C)O"],[1,"chain","C=CC(CCC(C)=O)C(C)O"],[1,"chain","CCCC=CCC(CO)C(C)=O"],[1,"chain","C=CCCC(=O)CCCC"],[1,"ring","CCC=CCC1=C(C)CCC1=O"],[1,"ring","C=C1CC(=O)C(C=O)CC1C"],[1,"ring","C=CC=CCC1CCOCC1=O"],[1,"chain","C=CCCC(CC=O)C(=O)CC"],[1,"chain","C=CC(C)C(=O)C(C)CC=O"],[1,"ring","C=CC1COC(CC=O)C(O)C1"],[1,"chain","C=CCCCC(=O)CC=CC"],[1,"ring","C=CC1CNCC(CO)C1=O"],[1,"ring","C=C(C)C1CC=C(C)C(=O)C1"],[1,"arene","O=CC=CC1=CC=CC=C1O"],[1,"chain","CC=CCCC=C(C)CC(C)=O"],[1,"chain","C=CCCCC(O)CC=O"],[1,"ring","CC1=CC(O)C(C=O)NC1"],[1,"chain","C=CCCCC(=O)CCC=C"],[1,"chain","C=CCCCC(C)(O)CC(C)=O"],[1,"chain","C=CCC(C=O)CCC=O"],[1,"ring","C=CCCC(=O)C1CCCCN1"],[1,"ring","C=C1CCC(=O)C(CO)C1"],[1,"chain","C=CCC(CC)C(=O)CCCO"],[1,"chain","CC=CCC(O)CC(=O)CCC"],[1,"chain","C=CCC(O)(CC)CCC(C)=O"],[1,"ring","C=CC1CCC(CC)CC1=O"],[1,"ring","C=CCC1CC=CCC1=O"],[2,"chain","C=CCCCC(=O)C(C)C(O)CCC"],[2,"chain","C=C(C)CCC(=O)CC(C)CC(=C)C"],[2,"ring","C=CCCC(=O)C(=O)C1CCCC1"],[2,"chain","CC(C)=CCCC(C)=CC=O"],[2,"ring","CCSCC(=O)CCC1=CCC=CC1"],[2,"chain","CCCCCC=CCCC(=O)CCO"],[2,"ring","O=CCC(=O)C=CC1CCCC(O)C1"],[2,"chain","C=C(CC)CC(=O)CC(C)C=O"],[2,"ring","CC(C)=C1CCC(C)CC1=O"],[2,"chain","C=CC(CC=O)CCCCCC"],[2,"chain","CCC=CCC(O)CCCC(C)=O"],[2,"arene","O=CC=CC1=CC=CC=C1O"],[2,"chain","C=CC(CC=O)CC(CC=O)C(C)O"],[2,"ring","C=C(C)C(O)CC1CCC(=O)CC1=O"],[2,"chain","C=CCC(=CCC=O)CCC"],[2,"arene","O=CCC=CCC=CC1=CC=CC=C1"],[2,"ring","C=CCC1=CC(C(O)CC=O)CCC1"],[2,"chain","CCC=CCC(=O)CCCCC"],[2,"ring","C=CC(=C)CC1CC(O)CC(C)C1=O"],[2,"ring","CC(=O)C=CC1=C(C)CCCC1(C)C"],[2,"chain","C=CCCCC(O)(CC)CC=O"],[2,"chain","C=CCC(O)(CCC=O)CCC=CC"],[2,"chain","C=C(C)CCC(O)C(C)CC=O"],[2,"chain","C=C(CCCC(=O)O)CCC(C)=O"],[2,"arene","C=CC(=O)C1=CC=CC=C1O"],[2,"ring","O=CC(CO)NCC1C=CCC1"],[2,"ring","CCC=CCC1=C(C)CCC1=O"],[2,"ring","CCC(C)CC1C=C(CC=O)CC1=O"],[2,"ring","C=C1CC(C(=O)C(C)C)C(O)C1C"],[2,"ring","CCC(=O)CC(=O)CC1=CCCCC1"],[2,"ring","O=CCC(O)CC=C1CCOC1"],[2,"ring","O=C(CC=C1CCCC1)CCO"],[2,"arene","C=CC1=CC(CC(=O)CCO)=CC=C1"],[2,"chain","C=CCCCC(=O)CCC=O"],[2,"ring","C=CCCC(=O)C1CCCCC1O"],[2,"chain","C=CC(=O)C(C)CC(C)(O)CC"],[2,"ring","C=CC(C)CC(=O)C1CCCC1O"],[2,"arene","C=C(C=O)C(=O)C1=CC=CC=C1O"],[2,"chain","C=CCC(CC=O)C(O)CC"],[2,"ring","C=CCC1CC(O)(CC)CC1=O"],[3,"ring","C=C1CC(=O)C(C=CC)CC(C(C)=O)C1"],[3,"ring","CC=CC1SCC(C(C)=O)C(O)C1O"],[3,"cage","C=CCC(=O)CC(=O)C1CC2=CC1CC2"],[3,"chain","CC(=O)CC(O)CCCC=CCCO"],[3,"fused","CC=C1C(=O)C(=CC=O)C2=CC=CC(O)=C12"],[3,"arene","C=CC(O)CC(=O)CC1=CC=CC=C1"],[3,"chain","C=CCCC(O)CCC(=O)CC(O)CC"],[3,"ring","C=CC(OC1CC=CC(=O)C1)C(C)=O"],[3,"cage","C=CC(CC)C(=O)C1CC2(C=C)C=CC1C2"],[3,"fused","CCC1(O)CC(=O)CC2C(=O)CC=CC21"],[3,"ring","CCCC1(O)CCC(CC=CC=O)C1=O"],[3,"ring","C=CCCC(C(=O)CCl)C(O)C1CCCC1"],[3,"ring","C=C1CC(CCCO)CC1CC(=O)CCO"],[3,"chain","CCC(C)=CC=C(C)C(=O)CCCO"],[3,"ring","CC(=O)C=CC1C(C)=CCCC1(C)C"],[3,"chain","CC(O)CC(=O)C=CCCCCCCC=O"],[3,"arene","CC=CCC(=O)C1=CC=CC(O)=C1"],[3,"fused","C=C(C)C1CCC2=CC(=O)CC(C)C2(C)C1"],[3,"chain","C=CCC(C=CCCC(=O)CCC)=CC"],[3,"ring","C=CCC(=O)CCC(O)C1CCC(O)C1"],[3,"ring","C=CC(CC(C)=O)C(N)C1CCOC1"],[3,"ring","CCOC1CCCC(O)(C=CC(C)=O)C1N"],[3,"chain","C=CCC(=O)CCCCCCCC(C)=O"],[3,"ring","C=CC(CC=O)CC1COC(C)C1"],[3,"arene","O=CC=CC1=C(O)C(CO)=CC=C1"],[3,"arene","CCC(=O)C=CCC(O)C1=CC=CC=C1"],[3,"ring","C=CCCC(=O)CC1C=CCSC1"],[3,"arene","C=CC(=O)C1=C(O)C=C(O)C(OC)=C1"],[3,"chain","CCCC=C(CCCC)C(=O)CC(O)CC"],[3,"arene","C=C(CC(O)C1=CC=CC=C1O)C(C)=O"],[3,"ring","CC=CCCCC1(O)CCC(=O)C1"],[3,"cage","CCC(O)(CC)CC1=C2CC(CC2=O)C1O"],[3,"chain","C=CCC(O)CCC(=O)CCCCC"],[3,"chain","CCC=C(CCC(O)CC)C(=O)CCOC"],[3,"ring","O=C(O)CCC(=O)CCC1(O)CC=CC1"],[3,"ring","CNC1C=CC(CC(N)C=O)C(O)C1"],[3,"ring","O=CCCCC(=O)CC=CC1CO1"],[3,"ring","CC(=O)CCC=CCC(=O)C1CCCC1O"],[3,"cage","CC(=O)C=CC1(O)CC2CC1CC2N"],[3,"ring","CC(=O)C1C=CC(C(=O)O)CC(C(C)O)C1"],[4,"arene","C=CCCC1=CC(O)=C(CCC=O)C=C1"],[4,"ring","CC=C(C)C(=O)C1CCC(C(O)CCC)C1N"],[4,"ring","CC(=O)C=CC1=C(C(=O)O)CC(N)CC1(C)C"],[4,"ring","CC(Cl)CCC1CC(C=CCCC=O)C1O"],[4,"chain","CCC(=CC(C)=O)CCC(C(O)CO)C(Cl)CC"],[4,"chain","CC(C)=CCCC(C)=CCCC(C)=CCO"],[4,"spiro","C=CC1(O)CCC2(CC(O)C(O)(CC(C)=O)C2)C1"],[4,"spiro","O=CCCCC=CCC1=CC(=O)CC12C=CCC2"],[4,"chain","C=CC(CCC(C=CC)C(O)C(C)C=C)C(C)=O"],[4,"ring","CC(O)CC1CC(CC=O)=CC(CO)C1"],[4,"ring","CCC=CCCC(O)CCC1=CCC(=O)C1"],[4,"chain","C=CCCC(C(=O)CC)C(=O)CC=CC(C)=O"],[4,"fused","C=CCC1CCC2CCCC(O)C2C1=O"],[4,"ring","CC(=O)CC(O)CC(O)CCC1C=CCO1"],[4,"chain","C=CCC(=O)C(=O)CCC(S)C=CCSC"],[4,"ring","O=CC=CC(CCC=O)CC1CCCCN1"],[4,"chain","CCCC(CC(=O)O)C(O)C(=CC(C)=O)CC"],[4,"ring","CCCC(O)(CC)CCC(O)C1C=CCCC1=O"],[4,"chain","C=C(C)CC(CC(=O)CCCO)C(Cl)CCC"],[4,"fused","O=CC=CCCCC1=CC=CC2=C1C(O)CC=C2"],[4,"ring","CCOCC(O)(CCO)CCC1C=CC(=O)C=C1"],[4,"chain","C=CC(CCC=CC(=O)CCCCl)CCC(C)Cl"],[4,"chain","C=CC(CC(CCO)C(=O)CCO)C(O)CC"],[4,"ring","C=CCC1COC(C(=O)CCC(=O)O)CC1=O"],[4,"ring","C=CC1CC(O)(CCC=O)CC(C)(O)C1O"],[4,"ring","CC(O)C(=CC(=O)C(=O)O)CC1CCCC1O"],[4,"fused","C=C1CCC2(O)CC(C(=O)O)C(=O)C2C1"],[4,"ring","CCC=CC=CC=CCC=CCC(O)CC1CO1"],[4,"chain","CC(=O)C=C(CCCC=O)CC(CC=O)CC=O"],[4,"ring","O=CCCC1C=CC(C(O)C(=O)CCS)CC1"],[4,"fused","CCOC1CC(=O)C2C(C=CC(C=O)C2N)C1=O"],[4,"ring","CC=CC=CCCCCC=CCC1CCC1O"],[4,"ring","CCCCCC(Cl)CC1CC=CC(=O)C1O"],[4,"ring","C=CC(=O)CC(O)C1COCC(C=CCC=O)O1"],[4,"chain","C=CCC(=O)CCCSCCCC(=O)O"],[4,"chain","CC(=O)CCCC=CC(=O)CCCC(C)=O"],[4,"arene","C=CCC(=O)C1=CC=CC(CCSC)=C1"],[4,"chain","CCCC=CCCC(O)CC(=O)C(O)COC"],[4,"cage","C=CC1(O)C2CC3(O)CC(C(=O)C1C3C)C2O"],[4,"ring","C=CC(=O)C(CC1CCCCC1)C(C)O"],[5,"chain","C=CCC(O)CC(CCC)CC(O)CC(=O)CC"],[5,"fused","C=C(CC1CCC(=O)C2CC=CCC12O)C(=O)COC"],[5,"fused","CC12CCC(=O)C=C1CCC1C2CCC2(C)C(O)CCC12"],[5,"cage","C=CC1CCC2(O)CC(=O)CC1C2C(O)CCC"],[5,"chain","CC(CS)CC(C)(O)CCSCCC=CC(=O)CO"],[5,"ring","CC(C=CC1(O)C(C)=CC(=O)CC1(C)C)=CC(=O)O"],[5,"ring","C=CCC(C=O)CC1CCC(CC=CC(C)=O)OC1"],[5,"ring","CC=CCC(O)C1C=CC(CC(CCCO)C(C)=O)O1"],[5,"chain","C=CCCC(O)CC(CCOC)C(O)C=CC(S)CCO"],[5,"arene","CC1=CC=C(C(=O)C=CC(=O)C2=CC=CC(C=O)=C2)C=C1"],[5,"chain","CC=CC(=CC(CCCC(=O)O)C(C)=O)CCCCO"],[5,"arene","CC1=C(O)C=CC=C1CCCCCC(=O)C=CCC=O"],[5,"chain","CCCC(=CCCC(=O)CCCCS)C(=O)CSC"],[5,"ring","C=CCC(O)CC1C(=O)C(CCC(N)CC(C)=O)CC1O"],[5,"ring","CC(C=CC1=C(C)CCCC1(C)C)=CC=CC(C)=CCO"],[5,"cage","C=CC(O)CC(=O)CCC(Cl)C1C(C)C2CCC1(C)C2"],[5,"fused","CC(CO)CC1=C2CCC(C=CC=O)C2C(O)CC1"],[5,"ring","NC(CCNCCC(=O)CCC=O)C1CC(O)C=CC1S"],[5,"fused","C=CC(=O)CC1C(=O)CCC2C(CC(C)(C)N)=CCCC12"],[5,"chain","CCC=CCCC(O)C(O)CC(=O)COCC(C)=O"],[5,"cage","C=CCC(=O)C(O)C12CC3CC(C1)C(O)C(C3)C2N"],[5,"ring","C=CCC(CC1CCCC(CC(Cl)CC)C1O)C(C)=O"],[5,"arene","CC(=O)CC1C=C(C(=O)C2=CC=CC(O)=C2)CCC1S"],[5,"ring","C=CC(C)C1OC1(C=CC=O)CC1NCCCC1O"],[5,"ring","O=CC1CC(O)(CC(C=O)C(=O)CC2CCCC2O)C1"],[5,"spiro","C=CC(CC(=O)C1(O)CCCC12CCCC2)C(=O)O"],[5,"ring","C=CCCC(O)C(=O)C(OC)C(N)C1C=CCC(N)C1"],[5,"chain","C=CCC(O)(CC=O)CCC(CC=O)CCCCO"],[5,"ring","CCC(=CC(=O)C(O)CC(C)C=O)CC1CNCC1O"],[5,"ring","CC(CO)CCC1C=C(C(=O)C(O)CCC(=O)O)CCC1"],[5,"cage","C=CCC(=O)CCCCCC(O)C1CC2C=CC(=O)C1N2"],[5,"arene","C=CCCC(O)(CCC(C)O)CC(=O)C1=CC=CC=C1"],[5,"chain","C=CC(=O)CC(CC(CCCl)CC(C)N)C(=O)CCCC"],[5,"chain","C=CC(=CCCCCC=CC(C=O)CCC)CC"],[5,"ring","C=CCCC(C)C(=O)C(C=C1CCOC1)CCO"],[5,"chain","C=C(C)CC(C=O)CC(=CC(C)CC(C=O)CC)CC"],[5,"fused","C=CCCCC(=O)CCC1(O)CC=C2CCCC(=O)C2C1"],[5,"ring","CC=CC=CC(CCC1CCCCC(O)C1)CC(C)=O"],[5,"fused","C=CCC(O)C12CCCCC1CCC(C(O)CC=O)C2O"],[5,"ring","CC(C=O)CC(O)CC(=O)C1C(N)C(CCCC=O)C1O"],[6,"ring","COC1CCNC(C)C1=CCC(O)C1CC(=O)C=CC1C"],[6,"ring","CC(C=CC=C(C)C=CC1=C(C)CCCC1(C)C)=CC=O"],[6,"cage","C=CCOC1C2=CC3CC(C2)C(CC(=O)C(=C)C)C1C3O"],[6,"ring","CCC=CCC(O)C1CCC(CC(Cl)C(O)CCCC=O)C1"],[6,"fused","CC(=O)CC(=O)C(O)CC1OC1C1CC=C2CC=CCC2C1"],[6,"fused","CC1C=CCC2=C(CC(O)(CC=O)CCC=O)C=CC=C21"],[6,"arene","C=C(CC)CC1=CC=C(CC2CC(=O)C(CCO)C(O)C2O)C=C1"],[6,"ring","CC(C=CC1=C(C)CCCC1(C)C)=CC=CC(C)=CCO"],[6,"ring","C=CCCC(=O)CC1CC(CC(=CCCC=O)CCC=C)CCC1O"],[6,"arene","C=CC1=CC(CC(C=C)CCC2=CC=C(C)C(=O)CC2)=CC=C1"],[6,"ring","CCCC(O)CCCCC(O)CCC=CC(=O)C1CC=CCC1"],[6,"chain","C=CCCCC(CC(O)CC(CC(C)O)C(=O)CC)C(O)CCC=C"],[6,"arene","C=CCC(O)(CC(=O)CSC1=CC=CC(O)=C1)C(=O)C(C)CN"],[6,"ring","CCC(C=C(CC(C)O)C(=O)C(O)(CC(C)O)CC1CCCO1)CO"],[6,"cage","C=CCC12CC(S)C(CC1=O)C(CC(=O)C1(O)CSSC1CC=O)C2"],[6,"ring","C=CCCCC1CC(=CCCCC)C1C=C(CCC=C)C(C)=O"],[6,"chain","CC(=O)CC(O)C(O)CCCC=CCCCCCCCC(=O)O"],[6,"chain","CCCCCCC(O)CC=CCCC(=O)CCC(O)CC(=O)O"],[6,"arene","C=CCC(C=CCC(=O)CC1=CC=CC=C1)CCC(N)CCCCl"],[6,"ring","C=CCC(CC)CC(CC=C)C(=O)C1CC1C=CC(=C)CC"],[6,"chain","CCCCC(N)CC(CCCC)C(N)C(=CC(C)=O)CC(O)CC"],[6,"arene","C=C(C)CC(CO)CCC1=CC(O)=C(CC(O)C(S)CC=O)C=C1"],[6,"fused","CC(C=O)C1=CC2=CCC3C(C)(C(=O)O)CCCC3(C)C2CC1O"],[6,"chain","CC(CCC(C=CC(=O)CCCO)CCCCO)CC(Cl)CCO"],[6,"arene","C=C(C)C=CC1=CC(CC(=C)CCC)=CC(C(=O)C(C)C(C)=O)=C1"],[6,"fused","NC(CCC(O)CCC(=O)CCO)C1=CC(O)=C2CCC=CC2=C1"],[6,"chain","C=CCCCCCC(O)(CCCCCCO)C(O)C(O)CCC(C)=O"],[6,"cage","C=CC(=CC(C)=O)CC1CN2CC(CC(=C)CCC)=C1C(O)C2"],[6,"ring","O=CCCC(=O)C(O)CC(O)CCC(O)CC=CC1CNCCO1"],[6,"ring","CCCC(=CC1=CC(CCO)C(CCCO)OC1)CC=O"],[6,"chain","C=CC(CC=O)CC(=O)CCC(N)CC(CC(C)Cl)NCCC"],[6,"arene","CC(=O)CC=CC=CC=CCC1=C(O)C=CC(O)=C1C1=CC=CC=C1"],[6,"arene","CC(=CC(=O)C1=CC=CC(O)=C1)C1=CC=CC(O)=C1C=O"],[6,"spiro","C=C(C)C=C(CC1C(O)CCC12C=CCC2C(O)CC)C(C)=O"],[6,"chain","CCC(=O)C(C=CC(C)=O)CC(=CC(CC)CCS)CC(C)C"],[6,"fused","CC(O)C(S)C(=O)C1=CC=C2C=CC(C=CC(=O)O)=CC2=C1O"],[6,"spiro","C=CCCCC(=O)CCCC1CCC2(CC(C)CC2C)C1Cl"],[6,"arene","CCC1=CC(C2=CC(O)=CC(O)=C2C(S)C(=O)C=CCO)=CC=C1"],[6,"ring","C=CCC(=O)CC(O)C(CC1=CCCCC1)CC(O)CCCC"],[6,"arene","NC(CC=CCC=O)CC(=O)CCCCC(O)C1=CC=CC=C1O"],[7,"chain","CC(CC(CC=CC(=O)CC(CCO)C(C)O)CCC(O)C(C)C)C(=O)O"],[7,"fused","CCC(=CC(=O)C(O)(CC1CC2CCCCC2(O)C1)C(O)C(C)C)CC=O"],[7,"cage","C=CC(=O)C1(O)C(CCCC2=CC=CC=C2)C2CC(C(O)C(Cl)CC=O)C1C2"],[7,"arene","CCC(O)C1=CC=CC(C2=C(O)C=CC=C2C=C(CC=O)C(=O)CCC=O)=C1"],[7,"spiro","C=CCC(CC1CC2(CC(O)CC2N)CC1(O)C1CSCC1O)C(=O)CCC=O"],[7,"cage","C=CCCC1C(=O)C2(CC(C=C)CC(CO)CCC(=O)O)C=CC1C2"],[7,"chain","CCCC(CCC(C)(O)CCC=O)CC(O)C(O)CC=CC(=O)CC"],[7,"cage","O=CNCCCC1C(=O)CCCC1=CCC(O)CC1CC2=CCC1(O)C2"],[7,"chain","C=C(C)C(=O)C(CCC(C)(O)CCCC)C(O)C(C)CC=C(C)CC(C)CO"],[7,"cage","CCC(Cl)C(C)CC(O)C12CC3CC(C1)C(CCC(N)C=CC=O)C(O)(C3)C2"],[7,"ring","CCC1CC(O)C(C=CC(S)CCCSCC(O)CC(O)CC(C)=O)N1"],[7,"arene","COCC1(N)CCC(O)C1C1(C(=O)O)C=C(C2=CC=C(O)C=C2)CC1=O"],[7,"fused","C=CCC(C)=CCC(=O)C1C(C(Cl)CC2=CC=CC=C2)CCC2CC=CC(=O)C21"],[7,"cage","CC(=O)CC1(C(=O)C=CC2=CC=CC=C2O)C2CCC(N2)C(C(C)=O)C1O"],[7,"fused","CCC(O)C(=O)CCC(S)(CC)C(Cl)C1=CCCC2=C1CCC1=C2CCCC1"],[7,"fused","C=CC(CC)CC(=O)C1=CC=CC2(CC(C)C)CCC3=C(C(O)CCC3Cl)C12"],[7,"fused","C=CC1=C(O)C2=CC(C(O)C(C=C3CCCCC3)CC(C)=O)=CC(O)=C2C=C1O"],[7,"cage","C=C(C)CC(OCC=O)C(=O)C(CC(O)CCC=O)C(N)C12CCC(CC1)CC2"],[7,"fused","C=C(CC=O)C(O)CC(C(=O)CC)C(O)C1=CC=C2C=CC(O)=CC2=C1"],[7,"cage","CC(=O)CCC(O)(CCO)CC1C2C=C(CCCCC=O)C(C2=O)C1O"],[7,"arene","C=CCC(O)CCCC1=C(O)C=CC(CCC(O)C(C=O)CC(C)O)=C1"],[7,"ring","CC(=O)C=CC(CCC1NC(COCC=CCC=O)CC1=O)C(O)C(C)O"],[7,"chain","C=CC(Cl)C(CC(=O)C(C)CSC(CC)CCC)C(S)C(N)CC(C)=O"],[7,"chain","O=C(O)CCCC=CCC=CCC=CCC=CC(O)CCCC(=O)O"],[7,"ring","CCC1(CC(O)C2COCC(O)C2CC(=O)O)CC=C(C(=O)C(C)=O)CC1N"],[7,"cage","NC1CC(CC=CC2CC3(N)C=C(C=CC3)C2=O)OC(=O)C1CCC(=O)O"],[7,"arene","C=CCC(C(=O)C1=CC(SC(CC)CCO)=CC(OCC)=C1O)C(=O)C(C)O"],[7,"fused","C=C1CCC(O)CC1=CC=C1CCCC2(C)C1CCC2C(C)CC=CC(C)C=O"],[7,"fused","CCCC(=CC1CC2=C(CCCC2C(=O)C(C)Cl)C(O)C1)CCC=O"],[7,"ring","O=CCC=CCC(O)CC(=O)CC1(C2CCCCC2=O)CCNCC1"],[7,"fused","C=CC12C(O)CC3C(CCC(O)(CC=O)C3C3CO3)C1CCC1C=CC(=O)C12"],[7,"fused","CC12CCC(=O)C=C1CCC1C2C(O)CC2(C=O)C1(O)CC(O)C2(O)C(=O)CO"],[7,"fused","CCC(O)C(C=O)=CC1=C2C(=CC(C(O)CCC(C)=O)=C1)CCCC2Cl"],[7,"fused","O=C(CC=CC(S)CC(O)CCC(=O)C(=O)O)CC1=CC2=CC=CC=C2C=C1"],[7,"fused","CC=CCC(=O)CC1=CC2=C(CC(O)CC=CC)C(O)=CC=C2C=C1"],[7,"arene","CCC1=CC(CC(N)CC2=CC=CC=C2CC(O)C(=O)C=CCC=O)=CC=C1"],[7,"ring","O=CCC(C(O)C1=CC(=O)CNC(CC(=O)O)C1O)C(S)C1CCOC1=O"],[7,"spiro","NC1C(O)CCC2(CCC(C3(O)C=CCCC3)C(=O)C2)C1(O)CCC(=O)O"],[7,"arene","C=CCCC(=O)C1OCCC1=CC1=CC=CC(O)=C1C(O)CCC(=O)O"],[7,"ring","C=CC1C(=O)C=CCC(C(C)O)C(O)CC(CCCC2CCSC2)CCC1O"],[8,"cage","C=C(CC=O)CC(O)CC1(C=C2C(=O)OCC2S)CC(C(O)CCCCC)C2NC1CC2Cl"],[8,"fused","C=C1CCC(O)CC1=CC=C1CCCC2(C)C(C(=C)CCC(=O)C(C)C)CCC12"],[8,"chain","CC(C)=CCCC(C)=CCCC(C)=CCCC=C(C)CCC=C(C)CCC=C(C)C"],[8,"fused","C=CCC(O)(CC12CCC(CC3=CC=CC=C3)CC1=CCC(CC(C)Cl)C2O)C(C)=O"],[8,"arene","CCCC(=CC(CCCCC(C)=O)C(N)CCC(Cl)C1=CC=CC=C1)C(=O)CO"],[8,"chain","CCC=CC(=O)CC(O)(CCCCCCC(C)=O)CCCC(O)C(CC(C)=O)CC(=O)O"],[8,"fused","O=CCCCC(O)CC1=CC=C(CCC2=C3C=CC(C(O)CCC=O)=CC3=CC(O)=C2)CC1"],[8,"fused","NC(CCCCC=C1CC(O)C2C(Cl)CC3C(C(=O)CC4CCC(O)C43)C2C1)CCC(=O)O"],[8,"chain","C=CC=C(CCCC)CCCC(CC(CCC=C)CC(N)C(=O)CCC(=O)O)C(C)Cl"],[8,"ring","C=CCCCC(=O)CCC(CC1CC1)CC(CCC(=O)CCC(=O)O)C(S)CCC=C"],[8,"spiro","C=CCCC(CC)C(=O)C(Cl)C(CCCSC)C(S)C1CC(O)C2(CCCC2=O)C1"],[8,"arene","C=CC(O)CCC(=O)CCCC1=CC(C(C)=CCC(O)C2OCCOC2C)=C(O)C=C1"],[8,"arene","CC(=O)CC=CC(CC(C)=O)C(O)C1CCCCC1(C)CCCC1=CC=CC(O)=C1"],[8,"cage","C=CC(CC=O)C(Cl)C(C(N)CC(O)(COC)CC(=O)O)C(O)CC1CC2CCN1CC2"],[8,"fused","CC(NC12CC=CC(O)C1(CC(=O)CCC1=CC=CC=C1)C(N)CC(=O)C2)C(=O)CC=O"],[8,"cage","C=CCC(CC(O)CCO)CC1(N)CC2CCC(CC(CC=O)CC(C)O)(C1)N2"],[8,"ring","CC(O)CCCC(O)C1(O)CCCCC(CCCC(=CC=CC=CC=O)C2CCCCN2)C1"],[8,"arene","O=C(O)C1CC(C(O)CCC2=CC(=O)C(C(O)CC=CC3=CC=CC=C3)NC2)OCC1=O"],[8,"cage","C=CC(CCC(O)C12C3C4C5C3C1(O)C5(C(O)CC(O)C1(O)CSSC1)C42)C(=O)C(C)C"],[8,"arene","O=CCC(O)CC(=O)CC(=O)CCCC1=CC=CC(O)=C1C(=O)CC(O)C1=CC=CC(O)=C1"],[8,"ring","NC(CCC(=O)O)CCC(CCC=O)CCCC(Cl)CCC=CC1(O)CCCOC1"],[8,"fused","CC(=O)C=CC(CC1CC2CCCCC2C2C(=O)CCC(N)C12)C(=O)CCCC=O"],[8,"fused","CC(C)CCCC(C)C1CCC2C3CC=C4C(O)C(O)C(=O)CC4(C)C3CCC12C"],[8,"arene","CCCCC1=C(O)C(CC2OC2(CCO)CC2(CCCC=O)CNCC(Cl)C2)=C(O)C=C1"],[8,"spiro","NC1C(C(O)CC=O)C=C(CCC(=O)CC2=CC=CC=C2)C2(CCC(S)CC2)C1C=O"],[8,"fused","C=CCCC(=O)C(CCC12CCCCC1CC(=O)C1CC(=O)CCC12)C(O)CCC=O"],[8,"chain","C=CCCC=C(C=CCCC(CCCCC)CC(=O)O)CC(O)CCCC(=O)O"],[8,"chain","CC(C)=CCCC(C)=CCCC(C)=CCC(N)C=C(C=O)CCC=C(C)CCC=C(C)C"],[8,"fused","CCCC(Cl)CCC(O)C1CCC2C(CCCC(CCC=O)C(O)CC=O)C=CCC2(O)C1"],[8,"ring","C=CCCC(O)CC(CCC(C(C)=O)C(Cl)CC1CCCC(C)C1O)C(O)CCCCC=O"],[8,"cage","C=CC(=O)C(O)CC1=C(C2C3CC4=CC(C3)CC2(C(N)CCC=O)C4)C=C(O)C=C1"],[8,"fused","C=CC(=C)CCCC(CCC(O)CC(=C)C=O)CCC(O)C1CCC2CCC(Cl)C2C1"],[8,"spiro","CCC1(CNC=O)CCCC2(CCC(N)(C(C(O)CC(=O)O)C3CC=CCC3)C(S)C2=O)C1"],[8,"arene","CCC(O)CC(=CCC(CC(O)CCO)C(C)O)CCC(=O)CCC1=CC=C(O)C=C1"],[8,"cage","C=CC1=CC(O)=C(CC(O)(CC(C)C(=O)O)C2(N)CC3CCC2(CCC(C)=O)O3)C(O)=C1"],[8,"fused","C=CCC(=O)CC(O)CC1(CC(O)CC2=CC(O)=C3C=CC(O)=CC3=C2)CCCCO1"],[8,"fused","CC12CCC(=O)C=C1CCC1C2C(O)C(O)C2(C=O)C1CC(O)C2(O)C(=O)CO"],[8,"ring","C=CC(CO)C(S)C(C=C(CCC(CC)CC)CC1CC(O)CN1)C(O)C(C=O)SC"],[8,"arene","CC(=O)C=CC1=C(O)C(CCCCC2CCNCC2O)=C(CCC(=O)O)C(O)=C1"],[8,"spiro","C=CC1(CCCC2CCC(C)C23C=CCCC3)C(=O)OC(C(=O)CC(=O)O)C1O"],[9,"cage","O=C(CCC1=CCCCC1)CC1(C23C4C5C6C4C2(C(=O)O)C6C53)CCCC(O)C1(O)CO"],[9,"fused","CCC(C)CC(=O)CC(=CCC(CC(C)C)C(=O)C(CC)CC)CC12CC=CC=C1C=CCC2"],[9,"arene","C=CC(=O)C(=O)C(O)(C=CCC1COC(=O)C1)C1=C(CC(N)CC)C=C(C(Cl)CC(C)C)C=C1"],[9,"fused","C=CC(C(=O)C(C)C)C(O)C1C(O)CCC2(C(N)CCC=O)CC(C3CO3)C3(O)CCCCC3C12"],[9,"fused","C=CCCC(CCC1=C2C=C(O)C=CC2=CC(C(S)C(O)CC(=O)CC(=O)O)=C1)C(=O)CSC"],[9,"spiro","C=CCCC(O)(CCCC(=O)O)CC1CCC(C(Cl)CCC(C)N)C(CC)C12CCCCC2"],[9,"fused","C=C(C)C=CCC(C)CCC=C(C)CCCC(C)=CCC1=C(C)C(=O)C2=CC=CC=C2C1=O"],[9,"fused","CC(C)=CCC(=O)C(C)=C1CCC2(C)C3=CCC4C(C)(C)C(O)CCC4(C)C3C(O)CC12C"],[9,"spiro","C=CCC(C1=CC=C(O)C=C1)C(O)CC1C(N)CCCC12C=CC(CCC(=O)O)C(N)C2"],[9,"fused","CC(=CCC1=C(C)C(=O)C2=CC=CC=C2C1=O)CCCC(C)CCCC(C)CCCC(C)C"],[9,"cage","C=CC(C)C(O)C1CCCCC1CCC(O)CC12CC(S)(CC(CCO)C(=O)O)C(CCC1O)N2"],[9,"cage","C=CCC12C=CC(C)(C=C1C(=O)CC1=CC=CC(CC=C(COC)C3=CC=CC(O)=C3)=C1)C2O"],[9,"cage","O=CC(CC1CC(=O)C2=CCC3C4C(O)CC(Cl)CC4CC(O)C3C21)C1CC2CCC1(S)C2"],[9,"ring","C=CCC(O)CCCC1(CCCC2CCC(CC(S)CC=C(C=C)CC)C(=O)C2)CC(Cl)C1"],[9,"fused","CCCC(C)C(S)CC(O)(CCC1CCC2CCCC2C1)CC1CCC(C=CC=CCCl)=CC1O"],[9,"fused","CC(C=CC(CO)C(C=O)CO)C1CCC2C3=CC=C4CC(O)CCC4(C)C3CCC21C"],[9,"fused","C=CCC(=O)CC(=O)CCCC1=CC2=C(C=C1)C(O)C(CC(O)CCCC(O)CCC(=O)O)C2"],[9,"arene","CC=C(CC(=O)C(O)(CCCCC(CN)CC(=O)O)CCC1=CC(O)=CC(O)=C1)CC(O)CC"],[9,"fused","CCCSCC1(C(O)CC2CCCC2)CCC2(C=C(C(=O)O)C(=O)CO)C(S)CCC(O)C2C1=O"],[9,"ring","CCCCCC(=O)C=CC(N)CCCC(=O)CCC(=O)C1(C2CCCC2)C(O)CCC1S"],[9,"arene","C=CCC(O)C(CC(O)CCC1=CC=CC=C1C1=C(O)C=C(O)C=C1)C(N)CC(C(C)=O)C(=O)O"],[9,"fused","O=CCC(O)C1=C(C2(CC3(O)CSCC(O)C3)CCC(O)(CCCO)C2)C=C2C=CCC2=C1"],[9,"chain","CC(C)=CCCC(C)=CCCC(C)=CCCC=C(C)CCC=C(C)CC(O)C=C(C)CN"],[9,"fused","CC(=CCC1=C(C)C(=O)C2=CC=CC=C2C1=O)CCC(O)C(C=O)CCCC(C)CCCC(C)C"],[9,"fused","CC(=CC(N)C1=C(C=O)C(=O)C2=CC=CC=C2C1=O)CCCC(C)CCCC(C)CCCC(C)C"],[9,"fused","C=CCC(O)CCCC1=CC2CCC3C(CC=C4CCCCC43CC=CCC(O)CC=O)C2C1"],[9,"arene","C=CCC(O)C1=C(CC(=O)C(N)C2(CC(=O)O)NCC(=O)CC2N)C=CC(C2=CC=CC=C2)=C1"],[9,"arene","CCCCC(CC)CC(=O)C(CCC(O)(CC=CC=O)CC(O)CCO)CC1=CC=CC(O)=C1"],[9,"fused","NCCC(CC(=O)O)CC1CCCC1CC1CC2CC=C3C4=C(CCC3C2CC1O)C(=O)CC4"],[9,"ring","CC(=O)CC(CC(CC(Cl)C1CC=C(C2CC(C)C(S)C2)C1)C1COCCC1O)C(C)N"],[9,"ring","C=CC(C)CC1OCCOC1C(O)CCCC1(O)CCCC1C(N)C(=O)C(CO)C(C)Cl"],[9,"chain","CC(C)=CCCC(C)=CCCC(C)=CCCC=C(C)C(O)CC=C(CCC=C(C)C)C(=O)O"],[9,"arene","NCCCC(Cl)CCCC1=CC=CC(C=CC2=CC(C(O)CCCC=CC=O)=CC=C2)=C1"],[9,"ring","CC=C(C=O)CCC(CCC)CC1CC(Cl)C(CCC(O)(CC(=O)O)C(O)C(C)NC)C1N"],[9,"fused","C=CCCC(C(C)=O)C(Cl)CC(=CC1=C(O)C=CC2=CC=CC=C21)CCCC(N)CCC(C)=O"],[9,"arene","CCCCCC(O)(CC(O)CC1=C(O)C=C(C=CCC(=O)CCCC)C=C1)C(Cl)CCC(=O)O"],[9,"ring","C=C(CC(C)CO)CC1(O)CC(C(Cl)C(CC(C)O)CC(C)S)OC(=O)C1CC(=CC)CC(C)O"],[9,"fused","CC=CC(CCC)C(O)CCCC12CCCCC1CC(O)(C(=O)C1=CCCC(O)C1)CC2O"],[9,"fused","CC(=CCC1=C(C)C(=O)C2=CC=CC=C2C1=O)CCCC(C)C(=O)CCC(C)C(=O)CCC(C)C"],[9,"fused","CCCC(O)CC(O)(CC12CC(CC(CC)CCC=O)CC(O)C1=CC(=O)CC2O)C1CCSS1"]]};
// MOLECULES V2 END
// the chlorine molecules of rounds 1 to 3 (RULE.clEarly, FEED_CL): known to the game, in no round's pool or bank, dealt only by clEarly
const FEED_CL_ROWS = [[1,"chain","C=CC(Cl)C(O)(CCCl)CCC(C)=O"],[1,"chain","C=C(C)CC(Cl)C(Cl)C(=O)CCC=O"],[1,"ring","C=CCC1C(=O)C(Cl)C=CC1Cl"],[1,"chain","C=CCCC(C(=O)CCCl)C(Cl)C=O"],[1,"chain","CCCCC(Cl)C=CC=CC=O"],[1,"chain","C=CCCC(Cl)C(O)CC=O"],[2,"chain","CC(=O)CCC=C(CCl)C(Cl)CC=C(C)C"],[2,"chain","C=CCCC(Cl)C(=O)C(Cl)CCC=O"],[2,"arene","C=CC1=CC(C(Cl)C(=O)C(Cl)CO)=CC=C1"],[2,"ring","C=CCCC1C(=O)C(CC=O)C(Cl)C1Cl"],[2,"chain","O=CC=CC(O)CCCCCCl"],[2,"ring","CC(=O)CC(O)C=CC1CSCCC1Cl"],[3,"ring","C=CC(CC1(Cl)COC(C)C1)C(Cl)C=O"],[3,"chain","O=CC=CC(O)C(Cl)CCCC(Cl)CCCO"],[3,"chain","CC(C)=CCCC(Cl)C(=O)C(Cl)CCC=O"],[3,"ring","C=CCCC1CC(Cl)(C(O)C(Cl)C(C)N)C1=O"],[3,"chain","C=CCCCCCC(Cl)CCC=CC=O"],[3,"ring","NC1CC2CC1CC2(O)C=CC(=O)CCl"]];
const FEED_ROUNDS = {}, FEED_BANK = {}, FAM2 = { fused: 'ring', spiro: 'ring', cage: 'cage', arene: 'arene', ring: 'ring', chain: 'chain' }, P_POOL = [0.9, 0.85, 0.8, 0.7, 0.65, 0.6, 0.55, 0.5, 0.5];
// the dealt molecules of docs/tools_chem/MOLECULES.md: a pool and a bank for each round; AA.rxFeedOld = true (before the scripts load) keeps the older table
if (!AA.rxFeedOld) { FEED.length = 0; const add = (r, bank) => { const smi = r[2]; if (!FEED_ROUNDS[smi]) { FEED.push([FAM2[r[1]] || 'chain', smi]); FEED_ROUNDS[smi] = []; } FEED_ROUNDS[smi].push(r[0]); if (bank) FEED_BANK[smi] = FEED_BANK[smi] !== 0; else FEED_BANK[smi] = 0; }; FEED2.pool.forEach(r => add(r, false)); FEED2.bank.forEach(r => { if (FEED_ROUNDS[r[2]] && FEED_BANK[r[2]] === 0) return; add(r, true); }); FEED_CL_ROWS.forEach(r => { if (!FEED_ROUNDS[r[2]]) { FEED.push([FAM2[r[1]] || 'chain', r[2]]); FEED_ROUNDS[r[2]] = []; FEED_BANK[r[2]] = 0; } }); }
const FEEDS = FEED.map(q => q[1]);
// heavy atoms of a molecule as it is dealt, read off its formula; what a round asks for; and how far off a molecule may be
const feedSize = smi => smi.replace(/Cl/g, 'X').replace(/[^A-Za-z]/g, '').length;
// (2026-11-11, the bare game: rounds two to six ask for less than they did, 14, 16.5, 19, 21.5 and 24 before, so a
// player who reads the page does not pull away from one who does not as fast: docs/RIG.md, fourth measure)
const FEEDSIZE = { rounds: [11.5, 12.5, 14, 16.5, 19.5, 23, 27, 31, 35], near: 3.5 };
const sizeFor = round => FEEDSIZE.rounds[Math.max(1, Math.min(9, round | 0)) - 1];
// the molecules of a family that suit a round: those near its size, or failing that the two nearest
// The shape of a molecule as dealt, counted from its SMILES: OH, C=C outside benzene rings, C=O.
// RULE.filter (rounds one to three, docs/TIER1_DEPTH.md): a molecule is rejected when it has two or more OH and no
// C=C, or a single C=O and no C=C, or only one kind of group; one with at most one OH and two or more C=C is
// preferred (it is twice as likely to be dealt). A round that would be left with nothing keeps what it had.
const SHAPE = {};
function feedShape(f) { if (SHAPE[f]) return SHAPE[f]; const m = RX.fromSmiles(f), ar = RX.aromaticAtoms(m); let oh = 0, ene = 0, one = 0; m.bonds.forEach(b => { if (b.order !== 2) return; if (b.a.el === 'C' && b.b.el === 'C') { if (!(ar.has(b.a) && ar.has(b.b))) ene++; } else if ((b.a.el === 'O') !== (b.b.el === 'O')) one++; }); m.atoms.forEach(a => { if (a.el !== 'O') return; const nb = m.neighbors(a); if (nb.length === 2 && nb.every(q => q.bond.order === 1) && nb.some(q => q.atom.el === 'H')) oh++; });
  const kinds = (oh ? 1 : 0) + (ene ? 1 : 0) + (one ? 1 : 0), bad = (oh >= 2 && !ene) || (one === 1 && !ene) || kinds <= 1; return (SHAPE[f] = { oh, ene, one, bad, good: !bad && oh <= 1 && ene >= 2 }); }
const FILTER = { upTo: 3, prefer: 2 };
// the twelve motifs replace the families (TRAITS.md): rate = pay per level; a step pays its places times the product of (1 + rate x level) of the motifs held and open.
// Eight are open from the start (sugar, resonance, ring, branch, chain, amine, sulfur, acid); the others are opened by findings (run.motifOpen). RULE.motifAll opens all twelve (testing).
const MOTIFS = { sugar: { rate: 0.07 }, resonance: { rate: 0.08 }, arene: { rate: 0.30 }, ring: { rate: 0.05 }, fusion: { rate: 0.15 }, cage: { rate: 0.03 }, spiro: { rate: 0.10 }, acid: { rate: 0.25 }, amine: { rate: 0.20 }, sulfur: { rate: 0.35 }, branch: { rate: 0.04 }, chain: { rate: 0.12 } };
// OFFER TABLE BEGIN (written by docs/tools_offer_bake.py from docs/tools_chem/reagent_stats.json; replace it wholesale)
const OFFER_STATS = {"hydrate":{"held":true,"worth":0.1637,"band":[0.1641,0.18,0.1492],"mean":0.1644,"reach":0.8991,"bonus":{"oxidize":0.015,"grow":-0.165,"thiolene":0.039,"dehydrate":0.107,"ritter":-0.064,"hydroborate":-0.121,"reduce":-0.008,"hwe":-0.006,"dihydroxylation":-0.184,"ozonolysis":-0.226,"permanganate":-0.021,"chlorination":-0.024,"cyanohydrin":0.018,"hofmann":-0.014,"chugaev":0.081,"hydroformylation":-0.191,"epoxidation":-0.173}},"oxidize":{"held":true,"worth":2.2496,"band":[1.8706,2.443,1.6926],"mean":2.002,"reach":0.9537,"bonus":{"hydrate":0.015,"grow":1.291,"thiolene":0.146,"dehydrate":-0.392,"ritter":-0.031,"hydroborate":0.215,"reduce":0.028,"hwe":0.284,"dihydroxylation":0.788,"ozonolysis":0.145,"permanganate":-0.11,"chlorination":-0.156,"cyanohydrin":0.051,"hofmann":-0.002,"chugaev":0.081,"hydroformylation":-0.214,"epoxidation":-0.184}},"grow":{"held":true,"worth":1.6161,"band":[1.5181,1.9726,0.9922],"mean":1.4943,"reach":0.938,"bonus":{"hydrate":-0.165,"oxidize":1.291,"thiolene":0.114,"dehydrate":-0.033,"ritter":-0.053,"hydroborate":0.106,"reduce":-0.028,"hwe":0.077,"dihydroxylation":0.474,"ozonolysis":1.376,"permanganate":-0.024,"chlorination":-0.004,"cyanohydrin":0.009,"hofmann":-0.088,"chugaev":0.022,"hydroformylation":0.845,"epoxidation":0.674}},"thiolene":{"held":true,"worth":0.0015,"band":[0.0169,-0.009,-0.0078],"mean":0.0,"reach":0.6009,"bonus":{"hydrate":0.039,"oxidize":0.146,"grow":0.114,"dehydrate":0.007,"ritter":-0.024,"hydroborate":-0.048,"reduce":-0.025,"hwe":-0.043,"dihydroxylation":-0.013,"ozonolysis":-0.054,"permanganate":0.004,"chlorination":0.01,"cyanohydrin":-0.025,"hofmann":-0.037,"chugaev":-0.002,"hydroformylation":-0.073,"epoxidation":-0.071}},"dehydrate":{"held":true,"worth":0.1907,"band":[0.1471,0.1863,0.1602],"mean":0.1645,"reach":0.787,"bonus":{"hydrate":0.107,"oxidize":-0.392,"grow":-0.033,"thiolene":0.007,"ritter":-0.042,"hydroborate":0.02,"reduce":0.0,"hwe":-0.061,"dihydroxylation":0.06,"ozonolysis":0.263,"permanganate":0.024,"chlorination":0.028,"cyanohydrin":-0.018,"hofmann":-0.013,"chugaev":-0.068,"hydroformylation":0.024,"epoxidation":0.086}},"ritter":{"held":true,"worth":-0.0174,"band":[-0.0271,-0.0181,-0.0196],"mean":-0.0216,"reach":0.3574,"bonus":{"hydrate":-0.064,"oxidize":-0.031,"grow":-0.053,"thiolene":-0.024,"dehydrate":-0.042,"hydroborate":-0.02,"reduce":-0.029,"hwe":-0.015,"dihydroxylation":-0.08,"ozonolysis":-0.076,"permanganate":0.011,"chlorination":-0.002,"cyanohydrin":-0.016,"hofmann":0.116,"chugaev":-0.046,"hydroformylation":-0.056,"epoxidation":-0.03}},"hydroborate":{"held":false,"worth":0.138,"band":[0.1144,0.1477,0.144],"mean":0.1354,"reach":0.5389,"bonus":{"hydrate":-0.121,"oxidize":0.215,"grow":0.106,"thiolene":-0.048,"dehydrate":0.02,"ritter":-0.02,"reduce":0.009,"hwe":-0.004,"dihydroxylation":-0.053,"ozonolysis":-0.098,"permanganate":0.013,"chlorination":-0.01,"cyanohydrin":-0.009,"hofmann":-0.005,"chugaev":0.034,"hydroformylation":0.005,"epoxidation":-0.056}},"reduce":{"held":false,"worth":0.0133,"band":[0.0071,0.0243,0.0059],"mean":0.0125,"reach":0.2407,"bonus":{"hydrate":-0.008,"oxidize":0.028,"grow":-0.028,"thiolene":-0.025,"dehydrate":0.0,"ritter":-0.029,"hydroborate":0.009,"hwe":0.013,"dihydroxylation":0.001,"ozonolysis":0.004,"permanganate":-0.002,"chlorination":-0.0,"cyanohydrin":-0.012,"hofmann":0.013,"chugaev":0.005,"hydroformylation":0.101,"epoxidation":-0.027}},"hwe":{"held":false,"worth":0.2622,"band":[0.2629,0.2842,0.2176],"mean":0.2549,"reach":0.6454,"bonus":{"hydrate":-0.006,"oxidize":0.284,"grow":0.077,"thiolene":-0.043,"dehydrate":-0.061,"ritter":-0.015,"hydroborate":-0.004,"reduce":0.013,"dihydroxylation":0.21,"ozonolysis":0.172,"permanganate":-0.011,"chlorination":0.004,"cyanohydrin":-0.043,"hofmann":0.015,"chugaev":-0.012,"hydroformylation":0.194,"epoxidation":0.17}},"dihydroxylation":{"held":false,"worth":0.4431,"band":[0.5162,0.4931,0.3336],"mean":0.4476,"reach":0.7398,"bonus":{"hydrate":-0.184,"oxidize":0.788,"grow":0.474,"thiolene":-0.013,"dehydrate":0.06,"ritter":-0.08,"hydroborate":-0.053,"reduce":0.001,"hwe":0.21,"ozonolysis":-0.214,"permanganate":0.039,"chlorination":-0.004,"cyanohydrin":0.028,"hofmann":-0.016,"chugaev":0.065,"hydroformylation":-0.094,"epoxidation":-0.176}},"ozonolysis":{"held":false,"worth":0.9419,"band":[1.0075,1.0642,0.8335],"mean":0.9684,"reach":0.8972,"bonus":{"hydrate":-0.226,"oxidize":0.145,"grow":1.376,"thiolene":-0.054,"dehydrate":0.263,"ritter":-0.076,"hydroborate":-0.098,"reduce":0.004,"hwe":0.172,"dihydroxylation":-0.214,"permanganate":-0.021,"chlorination":-0.047,"cyanohydrin":-0.046,"hofmann":-0.017,"chugaev":0.119,"hydroformylation":-0.165,"epoxidation":-0.325}},"permanganate":{"held":false,"worth":-0.0163,"band":[-0.0355,-0.0182,-0.0009],"mean":-0.0182,"reach":0.3389,"bonus":{"hydrate":-0.021,"oxidize":-0.11,"grow":-0.024,"thiolene":0.004,"dehydrate":0.024,"ritter":0.011,"hydroborate":0.013,"reduce":-0.002,"hwe":-0.011,"dihydroxylation":0.039,"ozonolysis":-0.021,"chlorination":0.0,"cyanohydrin":0.006,"hofmann":-0.013,"chugaev":0.008,"hydroformylation":0.029,"epoxidation":-0.012}},"chlorination":{"held":false,"worth":-0.0119,"band":[-0.0152,-0.011,-0.0108],"mean":-0.0123,"reach":0.3083,"bonus":{"hydrate":-0.024,"oxidize":-0.156,"grow":-0.004,"thiolene":0.01,"dehydrate":0.028,"ritter":-0.002,"hydroborate":-0.01,"reduce":-0.0,"hwe":0.004,"dihydroxylation":-0.004,"ozonolysis":-0.047,"permanganate":0.0,"cyanohydrin":-0.001,"hofmann":-0.005,"chugaev":-0.011,"hydroformylation":0.035,"epoxidation":-0.049}},"cyanohydrin":{"held":false,"worth":0.0296,"band":[-0.0012,0.0529,0.0331],"mean":0.0283,"reach":0.4352,"bonus":{"hydrate":0.018,"oxidize":0.051,"grow":0.009,"thiolene":-0.025,"dehydrate":-0.018,"ritter":-0.016,"hydroborate":-0.009,"reduce":-0.012,"hwe":-0.043,"dihydroxylation":0.028,"ozonolysis":-0.046,"permanganate":0.006,"chlorination":-0.001,"hofmann":-0.005,"chugaev":-0.033,"hydroformylation":0.042,"epoxidation":-0.053}},"hofmann":{"held":false,"worth":0.1052,"band":[0.0969,0.1129,0.1185],"mean":0.1094,"reach":0.4324,"bonus":{"hydrate":-0.014,"oxidize":-0.002,"grow":-0.088,"thiolene":-0.037,"dehydrate":-0.013,"ritter":0.116,"hydroborate":-0.005,"reduce":0.013,"hwe":0.015,"dihydroxylation":-0.016,"ozonolysis":-0.017,"permanganate":-0.013,"chlorination":-0.005,"cyanohydrin":-0.005,"chugaev":0.003,"hydroformylation":0.043,"epoxidation":-0.003}},"chugaev":{"held":false,"worth":0.1398,"band":[0.0914,0.1724,0.132],"mean":0.1319,"reach":0.5389,"bonus":{"hydrate":0.081,"oxidize":0.081,"grow":0.022,"thiolene":-0.002,"dehydrate":-0.068,"ritter":-0.046,"hydroborate":0.034,"reduce":0.005,"hwe":-0.012,"dihydroxylation":0.065,"ozonolysis":0.119,"permanganate":0.008,"chlorination":-0.011,"cyanohydrin":-0.033,"hofmann":0.003,"hydroformylation":0.144,"epoxidation":0.096}},"hydroformylation":{"held":false,"worth":0.5229,"band":[0.5675,0.6761,0.3868],"mean":0.5435,"reach":0.8343,"bonus":{"hydrate":-0.191,"oxidize":-0.214,"grow":0.845,"thiolene":-0.073,"dehydrate":0.024,"ritter":-0.056,"hydroborate":0.005,"reduce":0.101,"hwe":0.194,"dihydroxylation":-0.094,"ozonolysis":-0.165,"permanganate":0.029,"chlorination":0.035,"cyanohydrin":0.042,"hofmann":0.043,"chugaev":0.144,"epoxidation":-0.208}},"epoxidation":{"held":false,"worth":0.7477,"band":[-0.0384,1.0243,1.1345],"mean":0.7068,"reach":0.7204,"bonus":{"hydrate":-0.173,"oxidize":-0.184,"grow":0.674,"thiolene":-0.071,"dehydrate":0.086,"ritter":-0.03,"hydroborate":-0.056,"reduce":-0.027,"hwe":0.17,"dihydroxylation":-0.176,"ozonolysis":-0.325,"permanganate":-0.012,"chlorination":-0.049,"cyanohydrin":-0.053,"hofmann":-0.003,"chugaev":0.096,"hydroformylation":-0.208}}};
// OFFER TABLE END
const MOTIF_START = ['sugar', 'resonance', 'ring', 'branch', 'chain', 'amine', 'sulfur', 'acid'];
// THE OFFER (docs/tools_chem/OFFERS.md, offer_formula.py): the free pick of one from three after a round, and a fourth slot priced in gold.
//   weight(x) = U x R x A x P x M, from OFFER_STATS (one table, written by tools_offer_bake.py, replace it wholesale when the numbers change).
//   A run has a stock (4 reagents for a bachelor's, 5 for the others) drawn from the unlocked ones; each visit draws three from the stock without
//   repeats; one not shown comes back likelier (pity), one turned down twice less so. Only unlocked reagents are ever offered (P.unlocked(meta);
//   RULE.unlockAll unlocks all twelve for testing). RULE.offers (on) turns the whole thing on.
const OFFER_K = { u: 0.30, k: 2.5, t: 1, kappa: 2, pLo: 0.5, pHi: 2, pity: 0.20, decay: 0.6, shelfK: 0.4, c0: 2, c1: 7, step: 1, stock: { 3: 4, 6: 5, 9: 5 }, pityRun: 0.5 };
const OFFER_SIX = ['hydrate', 'thiolene', 'dehydrate', 'pcc', 'ritter', 'allyl'], OFFER_ID = { bh3: 'hydroborate', pcc: 'oxidize', nabh4: 'reduce', allyl: 'grow' };
const offerName = id => OFFER_ID[id] || id, offerBand = r => (r <= 3 ? 0 : r <= 6 ? 1 : 2);
const OFFER_REAGENTS = Object.keys(OFFER_STATS).filter(x => !OFFER_STATS[x].held && !OFFER_SIX.includes(x));
// the offer works in the statistics' names (hydroborate, reduce); the game's cards are bh3 and nabh4: offers leave and held lists arrive as card ids
const OFFER_CARD = { hydroborate: 'bh3', reduce: 'nabh4', oxidize: 'pcc', grow: 'allyl' }, offerCard = x => OFFER_CARD[x] || x;
// the saved state of the bench that decides what can be offered: meta.unlocked = { reagents: [...], reflexes: [...], motifs: [...] }
function unlocked(meta) {
  const u = (meta && meta.unlocked) || {};
  if (RULE.unlockAll) return { reagents: OFFER_REAGENTS.slice(), reflexes: SELF.map(q => q.id), motifs: Object.keys(MOTIFS) };
  return { reagents: (u.reagents || []).filter(x => OFFER_REAGENTS.includes(x)), reflexes: SELF.filter(q => q.tier === 0).map(q => q.id).concat(u.reflexes || []), motifs: MOTIF_START.concat(u.motifs || []) };
}
function offerWeight(x, rNext, L, held, drought, passed, shelf) {
  const s = OFFER_STATS[x], K = OFFER_K, U = K.u + (1 - K.u) * s.reach, R = Math.exp(-K.k * (shelf ? K.shelfK : 1) * Math.max(0, s.worth));
  let tot = 0, cnt = 0; for (let r = rNext; r <= L; r++) { tot += s.band[offerBand(r)]; cnt++; } const A = Math.pow((1 + (cnt ? tot / cnt : s.mean)) / (1 + s.mean), K.t);
  const clip = b => Math.max(-0.4, Math.min(0.6, b)); let Pf = 1;
  held.forEach(h => { if (h !== x && OFFER_REAGENTS.includes(h)) Pf *= Math.max(0.2, 1 + K.kappa * clip(s.bonus[h] || 0)); });
  OFFER_SIX.forEach(h => { const n = offerName(h); if (!held.includes(h) && !held.includes(n) && n !== x) Pf /= Math.max(0.2, 1 + K.kappa * clip(s.bonus[n] || 0)); });
  const Pp = Math.max(K.pLo, Math.min(K.pHi, Pf)), M = (1 + K.pity * (drought || 0)) * Math.pow(K.decay, passed || 0);
  return U * R * A * Pp * M;
}
function offerPick(pool, w, n, R) { pool = pool.slice(); w = w.slice(); const out = []; for (let k = 0; k < n && pool.length; k++) { let t = R() * w.reduce((a, b) => a + b, 0), j = 0; for (; j < w.length; j++) { t -= w[j]; if (t <= 0) break; } j = Math.min(j, pool.length - 1); out.push(pool.splice(j, 1)[0]); w.splice(j, 1); } return out; }
// the run's stock, drawn at the start of a run: run.unlockedReagents are the ones the bench has opened, run.runsOut how many runs each has been left out
function offerStock(run, R) {
  const L = run.span || 9, un = (RULE.unlockAll ? OFFER_REAGENTS : (run.unlockedReagents || [])).filter(x => OFFER_REAGENTS.includes(x)), size = Math.min(OFFER_K.stock[L] || 5, un.length), out = (run.runsOut) || {};
  run.stock = offerPick(un, un.map(x => offerWeight(x, 2, L, OFFER_SIX, 0, 0, false) * (1 + OFFER_K.pityRun * (out[x] || 0))), size, R); return run.stock;
}
// one visit: { free: [three ids], shelf: { id, price } or null }
function offerVisit(run, R) {
  const L = run.span || 9, next = (run.round || 1) + 1; if (!run.stock) offerStock(run, R); run.seen = run.seen || {}; run.passed = run.passed || {}; run.visits = (run.visits || 0) + 1;
  const held = (run.rack || []).map(offerName), pool = run.stock.filter(x => !held.includes(x)), un = (RULE.unlockAll ? OFFER_REAGENTS : (run.unlockedReagents || [])).filter(x => OFFER_REAGENTS.includes(x));
  const free = offerPick(pool, pool.map(x => offerWeight(x, next, L, held, run.visits - 1 - (run.seen[x] == null ? 0 : run.seen[x]), run.passed[x] || 0, false)), 3, R);
  free.forEach(x => { run.seen[x] = run.visits; }); run.lastOffer = free.map(offerCard);
  const rest = un.filter(x => !free.includes(x) && !held.includes(x)), sp = offerPick(rest, rest.map(x => offerWeight(x, next, L, held, 0, 0, true)), 1, R);
  run.shelf = sp.length ? { id: offerCard(sp[0]), name: sp[0], price: offerPrice(run, sp[0]) } : null; return { free: free.map(offerCard), freeNames: free, shelf: run.shelf };
}
const offerList = x => Math.max(1, Math.floor(OFFER_K.c0 + OFFER_K.c1 * Math.max(0, OFFER_STATS[x].worth) + 0.5));
const offerPrice = (run, x) => offerList(x) + OFFER_K.step * ((run && run.shelfBought) || 0);
function offerBuy(run, x) { if (!run.shelf || run.shelf.id !== x || (run.coins || 0) < run.shelf.price) return false; run.coins -= run.shelf.price; run.shelfBought = (run.shelfBought || 0) + 1; runTake(run, { kind: 'reagent', id: x }); run.shelf = null; return true; }
// THE COUNTERS (docs/tools_chem/FINDINGS.md, "What the game must count and save"). meta.counters is a flat object of lifetime counts, saved in the
// profile (meta); countersUpdate(meta, run, g) adds one round to it (called by roundEnd when the run carries run.meta; win or lose) and
// countersRun(meta, run) adds one run (called by runResult). findingsProgress(meta) gives each counted finding's count and target for the bench.
// The unlock triggers themselves are not built. Counters whose needs are not in the rules yet (notebooks, homunculus taps, instruments sold) are not counted.
const CNT_NAME = { pcc: 'oxidize', nabh4: 'reduce', allyl: 'grow', bh3: 'hydroborate' }, CNT_RING = ['ring', 'weld', 'tuck', 'knit', 'seal', 'cap', 'close', 'open', 'snap'];
// a reflex across the fold counts as its twin along the chain (ring_far as ring); every join across the fold closes a ring (sixteenth: they were not counted)
const cntBase = k => (k.slice(-4) === '_far' ? k.slice(0, -4) : k), cntRing = k => CNT_RING.includes(cntBase(k)) || k === 'bridge' || k === 'stitch' || k === 'link' || k === 'bridge_o';
const FINDING_COUNTS = [
  { id: 'tuck', name: 'Dry 100 times', counter: 'dry_steps', target: 100 }, { id: 'shift', name: 'Fire dehydrate 50 times', counter: 'dehydrate_fired', target: 50 },
  { id: 'recycler', name: 'Dry, then hydrate on one page, 20 times', counter: 'dry_then_hydrate_pages', target: 20 }, { id: 'dropper', name: 'Fire 150 reagents that act in one place only', counter: 'one_place', target: 150 },
{ id: 'mortar', name: 'End 30 rounds smaller than they began', counter: 'smaller_rounds', target: 30 },
  { id: 'clamp', name: 'One reagent in all three places, 5 lines', counter: 'one_reagent_lines', target: 5 }, { id: 'lean', name: 'Fire a third and last use 40 times', counter: 'third_uses', target: 40 },
  { id: 'gap', name: 'Meet the spec after an empty first page, 3 times', counter: 'met_after_empty', target: 3 }, { id: 'halide', name: 'Fire chlorination 30 times', counter: 'chlorination_fired', target: 30 },
  { id: 'wet', name: 'Hydrate 60 times', counter: 'hydrate_fired', target: 60 }, { id: 'capped', name: 'Hydroborate 40 times', counter: 'hydroborate_fired', target: 40 },
  { id: 'damp', name: '30 pages that drove off 5 or more waters', counter: 'water5_pages', target: 30 }, { id: 'runaway', name: 'End 10 rounds 10 or more atoms bigger than dealt', counter: 'bigger10_rounds', target: 10 },
  { id: 'six', name: '150 rings', counter: 'rings_by_ring', target: 150 }, { id: 'turnover', name: 'Oxidize 150 times', counter: 'oxidize_acted', target: 150 },
  { id: 'fresh', name: 'Hydrate, then oxidize, in one line, 10 times', counter: 'hydrate_then_oxidize', target: 10 }, { id: 'slot1', name: 'Close 1,000 rings', counter: 'ring_steps', target: 1000 },
  { id: 'redpencil', name: 'Meet the spec by under 5 percent, 5 times', counter: 'tight_rounds', target: 5 }, { id: 'linen', name: 'End 100 rounds at unstable or better', counter: 'rounds_unstable', target: 100 },
  { id: 'gold', name: 'End 15 rounds at overreact', counter: 'rounds_overreact', target: 15 }, { id: 'jar_hydrogen', name: '130 hydrogen', counter: 'off_hydrogen', target: 130 },
  { id: 'jar_water', name: '200 water', counter: 'off_water', target: 200 }, { id: 'jar_acid', name: '200 acid fumes', counter: 'off_acid_fumes', target: 200 },
  { id: 'jar_co2', name: '50 carbon dioxide', counter: 'off_carbon_dioxide', target: 50 }, { id: 'jar_slime', name: '70 hydroborate that acted', counter: 'hydroborate_acted', target: 70 },
  { id: 'jar_wood', name: '40 reduce that acted', counter: 'reduce_acted', target: 40 }, { id: 'jar_seed', name: '120 grow that acted', counter: 'grow_acted', target: 120 },
  { id: 'jar_ammonia', name: '40 ammonia', counter: 'off_ammonia', target: 40 }, { id: 'jar_sulfur', name: '80 sulfur', counter: 'off_sulfur', target: 80 },
  { id: 'cooh', name: 'Make 8 COOH', counter: 'cooh_made', target: 8 }, { id: 'sh', name: 'Put on 25 SH', counter: 'sh_made', target: 25 }
];
const countersNew = () => ({});
function countersUpdate(meta, run, g) {
  if (!meta || !g || !g.rec) return null; const c = meta.counters = meta.counters || {}, add = (k, n) => { c[k] = (c[k] || 0) + (n == null ? 1 : n); }, pages = g.rec.pages || [], f0 = g.rec.f0;
  let emptyFirst = false;
  pages.forEach((p, pi) => {
    const cs = p.circ.filter(x => !x.bank), nm = x => CNT_NAME[x.id] || x.id, names = cs.map(nm); let steps = p.chain.length;
    add('pages'); if (!steps) { add('empty_pages'); if (pi === 0) emptyFirst = true; }
    p.chain.forEach(k => { if (k === 'dry') add('dry_steps'); if (cntBase(k) === 'ring') add('rings_by_ring'); if (cntRing(k)) add('ring_steps'); });
    cs.forEach(x => { const n = nm(x); add('reagents_fired'); add(n + '_fired'); if (x.places > 0) add(n + '_acted'); if (x.places === 1) add('one_place'); if (x.places === 0) add('nowhere'); });
    const first = (a, b) => { const i = names.findIndex((x, k) => x === a && cs[k].places > 0); return i >= 0 && names.some((x, k) => k > i && x === b && cs[k].places > 0); };
    if (first('oxidize', 'reduce')) add('oxidize_then_reduce'); if (first('hydrate', 'oxidize')) add('hydrate_then_oxidize'); if (p.chain.includes('dry') && names.some((x, k) => x === 'hydrate' && cs[k].places > 0)) add('dry_then_hydrate_pages');
    if (cs.length === 3 && names.every(x => x === names[0])) add('one_reagent_lines');
    if ((p.off.water || 0) >= 5) add('water5_pages');
    Object.keys(p.off).forEach(k => { if (p.off[k]) add('off_' + k, p.off[k]); });
    cs.forEach(x => { if (nm(x) === 'permanganate' && x.places > 0) add('cooh_made', x.places); if (nm(x) === 'thiolene') add('sh_made', x.places); });
  });
  const last = pages.length ? pages[pages.length - 1].F : f0, a0 = f0.get('atoms'), a1 = last.get('atoms'), won = roundWon(g, run), marks = marksHit(g.total, run.quota || g.quota || 0);
  add('rounds'); if (won) add('rounds_won'); if (a1 >= a0 + 10) add('bigger10_rounds'); if (a1 < a0) add('smaller_rounds'); if (won && emptyFirst) add('met_after_empty');
  if (g.total >= (run.quota || g.quota || 0)) { if (marks >= 1) add('rounds_unstable'); if (marks >= 3) { add('rounds_overreact'); add('overreacts'); } }
  { const key = g.cur && g.cur.feedSig; if (key) { const M = meta.mols = meta.mols || {}, e = M[key] || { seen: 0, best: 0 }; M[key] = { seen: e.seen + 1, best: Math.max(e.best, g.total || 0) }; } }      // each molecule's history (facts: molseen, molbest)
  if (run) run.chainBest = Math.max(run.chainBest || 0, g.cascBest || 0, g.casc || 0);
  if (g.spec && won && g.spec.value < 1.05 * g.spec.n) add('tight_rounds');
  (g.kinds || []).forEach(id => { if (g.left && g.left[id] === 0) add('third_uses'); });
  run.firedKinds = run.firedKinds || {}; pages.forEach(p => p.circ.forEach(x => { if (!x.bank) run.firedKinds[CNT_NAME[x.id] || x.id] = 1; }));
  run.fumes = (run.fumes || 0) + pages.reduce((t, p) => t + (p.off.acid_fumes || 0), 0);
  if (!won) { add('lost_rounds'); if (pages.length && !pages[pages.length - 1].chain.length) add('lost_last_page_empty'); }
  // what the ladder reads (LADDER below): the longest chain of a page, the kinds of reflex in a round, the highest mark, a round lost by under 15 in 100, a round cleared with three reagents or fewer
  const top = (k, v) => { c[k] = Math.max(c[k] || 0, v); }, kindsR = {}, firedR = {}; let stepsR = 0;
  pages.forEach(p => { stepsR += p.chain.length; top('max_chain_page', p.chain.length); p.chain.forEach(k => { kindsR[k] = 1; }); p.circ.forEach(x => { if (!x.bank) firedR[CNT_NAME[x.id] || x.id] = 1; }); });
  add('reflex_steps', stepsR); top('max_kinds_round', Object.keys(kindsR).length); top('max_mark', g.total >= (run.quota || g.quota || 0) ? 1 + marks : 0);
  if (won && Object.keys(firedR).length <= 3) add('narrow_rounds');
  if (!won && roundNear(g, run)) add('near_rounds');
  if (!won && g.specDef && run.tierNo > 1 && !specMet(g) && g.total >= needYield(run)) add('task_lost_rounds');      // lost on the task alone: the yield was past the mark
  // sixteenth, item 2: what the deeds of the reference book read ("More deeds, fewer counts"). Each is a thing done on one page, in one round or
  // in one run; docs/tools_chem/sweep_deeds.py keeps the same counters on the simulator's rounds, which is where each deed's number of runs comes from.
  { const lg = run.tierNo > 1, addD = (k, n) => { add(k, n); if (lg) add('L:' + k, n); }, topD = (k, v) => { top(k, v); if (lg) top('L:' + k, v); }, nOf = (ch, b) => ch.filter(k => cntBase(k) === b).length, fin = SYN.finish, firedD = {}, het = run.hetRings = run.hetRings || {}; let nClose = 0, nCap = 0, co2P = 0, epoxP = 0, waterR = 0, prev = null;
    pages.forEach(p => {
      const cs = p.circ.filter(x => !x.bank && x.id !== fin), names = cs.map(x => CNT_NAME[x.id] || x.id), lands = (n, from) => cs.some((x, k) => k >= (from || 0) && names[k] === n && x.places > 0);
      cs.forEach((x, k) => { firedD[names[k]] = 1; if (['dehydrate', 'hydrate', 'oxidize', 'grow', 'epoxidation'].includes(names[k])) topD('max_' + names[k] + '_places', x.places || 0); });
      p.chain.forEach(k => { const b = cntBase(k); if (b === 'ring' || b === 'tuck') het.O = 1; if (b === 'knit') het.N = 1; if (b === 'cap') het.S = 1; });
      nClose += nOf(p.chain, 'close'); nCap += nOf(p.chain, 'cap'); topD('max_rings_page', p.chain.filter(cntRing).length);
      topD('max_co_gain', p.F.get('g:C=O') - f0.get('g:C=O')); topD('max_dbl_gain', p.F.get('dbl') - f0.get('dbl')); topD('max_cc_gain', p.F.get('g:C=C') - f0.get('g:C=C')); topD('max_both_gain', Math.min(p.F.get('g:C=C') - f0.get('g:C=C'), p.F.get('g:C=O') - f0.get('g:C=O'))); topD('max_water_page', p.off.water || 0); topD('max_h2_page', p.off.hydrogen || 0);
      waterR += p.off.water || 0; if ((p.off.carbon_dioxide || 0) > 0) co2P++;
      if (names.length === 3 && names[0] === 'hydrate' && names[1] === 'dehydrate' && names[2] === 'hydrate' && cs.every(x => x.places > 0)) addD('hdh_pages');
      if (lands('ritter') && nOf(p.chain, 'knit')) addD('n_ring_pages'); if (lands('thiolene') && nOf(p.chain, 'cap')) addD('s_ring_pages');
      if (lands('epoxidation')) epoxP++;
      if (cs.length >= 3 && cs.filter(x => x.set > 0).length >= 3) addD('all3_pages'); if (lg && cs.length >= 3 && names.every(x => x === names[0])) add('L:one_reagent_lines'); if (cs.length >= 3) topD('max_last_set', cs[cs.length - 1].set || 0);
      topD('max_limits_page', (nOf(p.chain, 'dry') >= 1 ? 1 : 0) + (nOf(p.chain, 'weld') >= 2 ? 1 : 0) + (nOf(p.chain, 'ring') >= 2 ? 1 : 0));
      if (prev && names.length && names.join() === prev.names && p.chain.length && prev.chain) addD('repeat_pages'); prev = { names: names.join(), chain: p.chain.length };
    });
    topD('max_kinds_fired_round', Object.keys(firedD).length); topD('max_close_round', nClose); topD('max_cap_round', nCap); topD('max_co2_pages_round', co2P); topD('max_epox_pages_round', epoxP);
    topD('max_rings_gain', last.get('rings') - f0.get('rings')); topD('max_chain_gain', last.get('chain') - f0.get('chain')); topD('max_fused_gain', last.get('fused_pairs') - f0.get('fused_pairs')); if (!won && pages.length) topD('max_lost_last_chain', pages[pages.length - 1].chain.length); topD('max_shrink_round', a0 - a1);
    if (run.tierNo > 1 && g.left && !g.usesFree) topD('max_spent_round', Object.keys(g.left).filter(id => g.left[id] === 0).length);
    if (f0.get('g:C=O') >= 2 && last.get('g:C=O') === 0) addD('co_cleared_rounds'); if (last.get('g:COOH') > f0.get('g:COOH')) addD('cooh_rounds');
    if (f0.get('aromatic') > 0 && marks >= 1) addD('arene_mark_rounds');
    if (pages.length >= 3 && pages.every(p => nOf(p.chain, 'dry') > 0)) addD('dry3_rounds'); if (pages.length >= 3 && pages.every(p => (p.off.water || 0) > 0)) addD('water3_rounds'); if (won && waterR === 0) addD('dry_free_rounds'); if (lg && won && emptyFirst) add('L:met_after_empty');
  }
  if (won && run.tierNo > 1) meta.deep = Math.max(meta.deep || 0, run.round || 1);
  return c;
}
function countersRun(meta, run) {
  if (!meta) return null; const c = meta.counters = meta.counters || {}, add = (k, n) => { c[k] = (c[k] || 0) + (n == null ? 1 : n); };
  add('runs'); if (runWon(run)) { add('runs_won'); add('won_' + (run.len || 'bachelor')); } else { add('runs_lost'); add('lost_' + (run.len || 'bachelor')); if ((run.round || 1) <= 2) add('lost_round_1_or_2'); const lr = 'lost_at_round_' + (run.round || 1); add(lr); }
  c.max_fumes_run = Math.max(c.max_fumes_run || 0, run.fumes || 0); c.max_het_rings_run = Math.max(c.max_het_rings_run || 0, Object.keys(run.hetRings || {}).length); if (run.tierNo > 1) c['L:max_het_rings_run'] = Math.max(c['L:max_het_rings_run'] || 0, Object.keys(run.hetRings || {}).length); c.max_kinds_run = Math.max(c.max_kinds_run || 0, Object.keys(run.firedKinds || {}).length);
  return c;
}
// THE LADDER (ruling AR; docs/RIG.md thirteenth, part 1): what a run earns, won or lost. A rung is earned once and for good. kind 'depth': the
// first time round n of a long run (master's or longer) is cleared (meta.deep). kind 'deed': something done in one page, round or run (a
// highest-ever counter). kind 'count': a lifetime count. `gives` is the shelf whose next thing opens (FINDINGS.md: the shelf's next thing by its
// Runs value); the page decides which thing that is. (Since the fourteenth measure, part 6: `gives` is the category and `thing` the one named thing
// the rung opens, chosen to fit the deed; a rung with `credit` pays that much credit, because the game holds fewer things than rungs; the three
// rungs marked closed cannot be earned while the twelve-round run is switched off.) ladderDue(meta) gives the rungs newly earned and writes them into meta.ladder (called by
// runResult, which hands them to the end screen as `earned`). ladderState(meta) gives every rung with its count and target for the bench.
const LADDER = [
  { id: 'deep1', kind: 'depth', n: 1, gives: 'credit', credit: 1 }, { id: 'deep2', kind: 'depth', n: 2, gives: 'credit', credit: 2 }, { id: 'deep3', kind: 'depth', n: 3, gives: 'soundtrack', thing: 'gothic' }, { id: 'deep4', kind: 'depth', n: 4, gives: 'credit', credit: 2 },
  { id: 'deep5', kind: 'depth', n: 5, gives: 'credit', credit: 2 }, { id: 'deep6', kind: 'depth', n: 6, gives: 'soundtrack', thing: 'baroque' }, { id: 'deep7', kind: 'depth', n: 7, gives: 'credit', credit: 3 }, { id: 'deep8', kind: 'depth', n: 8, gives: 'credit', credit: 5 },
  { id: 'deep9', kind: 'depth', n: 9, gives: 'credit', credit: 10 }, { id: 'deep10', kind: 'depth', n: 10, gives: 'closed' }, { id: 'deep11', kind: 'depth', n: 11, gives: 'closed' }, { id: 'deep12', kind: 'depth', n: 12, gives: 'closed' },
  { id: 'i_crystal', kind: 'deed', counter: 'met_after_empty', n: 1, gives: 'instrument', thing: 'crystal', long: 1 }, { id: 'i_burner', kind: 'deed', counter: 'water3_rounds', n: 1, gives: 'instrument', thing: 'bunsen', long: 1 },
  { id: 'i_burette', kind: 'deed', counter: 'max_oxidize_places', n: 5, gives: 'instrument', thing: 'burette', long: 1 }, { id: 'i_mirror', kind: 'deed', counter: 'one_reagent_lines', n: 1, gives: 'instrument', thing: 'mirror', long: 1 },
  { id: 'i_magnet', kind: 'deed', counter: 'max_chain_gain', n: 4, gives: 'instrument', thing: 'magnet', long: 1 }, { id: 'i_carousel', kind: 'deed', counter: 'max_kinds_fired_round', n: 6, gives: 'instrument', thing: 'carousel', long: 1 },
  { id: 'i_dropper', kind: 'deed', counter: 'max_spent_round', n: 4, gives: 'instrument', thing: 'dropper', long: 1 }, { id: 'i_timer', kind: 'deed', counter: 'all3_pages', n: 1, gives: 'instrument', thing: 'timer', long: 1 },
  { id: 'near', kind: 'deed', counter: 'near_rounds', n: 1, gives: 'instrument', thing: 'counter' }, { id: 'tasklost', kind: 'deed', counter: 'task_lost_rounds', n: 2, gives: 'instrument', thing: 'condenser' },
  { id: 'r_epoxidize', kind: 'deed', counter: 'max_dehydrate_places', n: 5, gives: 'reagent', thing: 'epoxidation' }, { id: 'big10', kind: 'deed', counter: 'bigger10_rounds', n: 1, gives: 'reagent', thing: 'hwe' },
  { id: 'r_burn', kind: 'deed', counter: 'max_co2_pages_round', n: 2, gives: 'reagent', thing: 'permanganate' }, { id: 'r_hydroborate', kind: 'deed', counter: 'hdh_pages', n: 1, gives: 'reagent', thing: 'hydroborate' },
  { id: 'r_cyanate', kind: 'deed', counter: 'max_co_gain', n: 3, gives: 'reagent', thing: 'cyanohydrin' }, { id: 'r_reduce', kind: 'deed', counter: 'co_cleared_rounds', n: 1, gives: 'reagent', thing: 'reduce' },
  { id: 'r_chlorinate', kind: 'deed', counter: 'max_close_round', n: 2, gives: 'reagent', thing: 'chlorination' }, { id: 'r_formylate', kind: 'deed', counter: 'max_grow_places', n: 4, gives: 'reagent', thing: 'hydroformylation' },
  { id: 'r_cleave', kind: 'deed', counter: 'max_cc_gain', n: 4, gives: 'reagent', thing: 'ozonolysis' }, { id: 'r_dihydroxylate', kind: 'deed', counter: 'max_hydrate_places', n: 4, gives: 'reagent', thing: 'dihydroxylation' },
  { id: 'r_eliminate_n', kind: 'deed', counter: 'n_ring_pages', n: 1, gives: 'reagent', thing: 'hofmann' }, { id: 'r_eliminate_s', kind: 'deed', counter: 's_ring_pages', n: 1, gives: 'reagent', thing: 'chugaev' },
  { id: 'm_spiro', kind: 'deed', counter: 'max_rings_page', n: 3, gives: 'motif', thing: 'spiro' }, { id: 'm_arene', kind: 'deed', counter: 'arene_mark_rounds', n: 1, gives: 'motif', thing: 'arene' }, { id: 'm_fusion', kind: 'deed', counter: 'max_fused_gain', n: 3, gives: 'motif', thing: 'fusion' },
  { id: 'm_cage', kind: 'deed', counter: 'max_rings_gain', n: 6, gives: 'motif', thing: 'cage' }, { id: 'x_seal', kind: 'deed', counter: 'cooh_rounds', n: 1, gives: 'reflex', thing: 'seal' }, { id: 'x_open', kind: 'deed', counter: 'max_epoxidation_places', n: 2, gives: 'reflex', thing: 'open' },
  { id: 'x_fold', kind: 'count', counter: 'epoxidation_acted', n: 3, gives: 'reflex', thing: 'fold' }, { id: 's_clepsydra', kind: 'deed', counter: 'max_lost_last_chain', n: 3, gives: 'sigil', thing: 'clepsydra', long: 1 },
  { id: 's_solve', kind: 'deed', counter: 'max_limits_page', n: 2, gives: 'sigil', thing: 'solve', long: 1 }, { id: 's_respiratio', kind: 'deed', counter: 'dry3_rounds', n: 1, gives: 'sigil', thing: 'respiratio', long: 1 },
  { id: 's_phlogiston', kind: 'deed', counter: 'max_h2_page', n: 5, gives: 'sigil', thing: 'phlogiston', long: 1 }, { id: 's_via', kind: 'deed', counter: 'max_het_rings_run', n: 3, gives: 'sigil', thing: 'via_humida', long: 1 },
  { id: 's_aqua', kind: 'deed', counter: 'dry_free_rounds', n: 1, gives: 'sigil', thing: 'aqua_permanens', long: 1 }, { id: 's_tetractys', kind: 'deed', counter: 'max_last_set', n: 4, gives: 'sigil', thing: 'tetractys', long: 1 },
  { id: 's_gemini', kind: 'deed', counter: 'max_both_gain', n: 1, gives: 'sigil', thing: 'gemini', long: 1 }, { id: 's_mask', kind: 'deed', counter: 'max_cap_round', n: 4, gives: 'sigil', thing: 'sulphurs_mask', long: 1 },
  { id: 'mark4', kind: 'deed', counter: 'max_mark', n: 4, gives: 'soundtrack', thing: 'metal' }, { id: 'kinds5', kind: 'deed', counter: 'max_kinds_round', n: 5, gives: 'soundtrack', thing: 'surf' }, { id: 'chain4', kind: 'deed', counter: 'max_chain_page', n: 4, gives: 'credit', credit: 1 },
  { id: 'chain6', kind: 'deed', counter: 'max_chain_page', n: 6, gives: 'credit', credit: 1 }, { id: 'chain9', kind: 'deed', counter: 'max_chain_page', n: 9, gives: 'credit', credit: 2 }, { id: 'mark2', kind: 'deed', counter: 'max_mark', n: 2, gives: 'credit', credit: 1 },
  { id: 'mark3', kind: 'deed', counter: 'max_mark', n: 3, gives: 'credit', credit: 2 }, { id: 'kinds3', kind: 'deed', counter: 'max_kinds_round', n: 3, gives: 'credit', credit: 1 }, { id: 'allsix', kind: 'deed', counter: 'max_kinds_run', n: 6, gives: 'credit', credit: 1 },
  { id: 'narrow', kind: 'deed', counter: 'narrow_rounds', n: 1, gives: 'credit', credit: 1 }, { id: 'rounds10', kind: 'count', counter: 'rounds', n: 10, gives: 'credit', credit: 1 }, { id: 'rounds20', kind: 'count', counter: 'rounds', n: 20, gives: 'credit', credit: 1 },
  { id: 'rounds30', kind: 'count', counter: 'rounds', n: 30, gives: 'credit', credit: 1 }, { id: 'rounds100', kind: 'count', counter: 'rounds', n: 100, gives: 'credit', credit: 2 }, { id: 'rounds200', kind: 'count', counter: 'rounds', n: 200, gives: 'credit', credit: 3 },
  { id: 'won5', kind: 'count', counter: 'rounds_won', n: 5, gives: 'credit', credit: 1 }, { id: 'won10', kind: 'count', counter: 'rounds_won', n: 10, gives: 'credit', credit: 1 }, { id: 'won20', kind: 'count', counter: 'rounds_won', n: 20, gives: 'credit', credit: 1 },
  { id: 'won60', kind: 'count', counter: 'rounds_won', n: 60, gives: 'credit', credit: 2 }, { id: 'won100', kind: 'count', counter: 'rounds_won', n: 100, gives: 'credit', credit: 3 }, { id: 'won150', kind: 'count', counter: 'rounds_won', n: 150, gives: 'credit', credit: 3 },
  { id: 'lost3', kind: 'count', counter: 'runs_lost', n: 3, gives: 'credit', credit: 1 }, { id: 'lost6', kind: 'count', counter: 'runs_lost', n: 6, gives: 'credit', credit: 1 }, { id: 'lost10', kind: 'count', counter: 'runs_lost', n: 10, gives: 'credit', credit: 2 },
  { id: 'lost30', kind: 'count', counter: 'runs_lost', n: 30, gives: 'credit', credit: 3 }, { id: 'steps50', kind: 'count', counter: 'reflex_steps', n: 50, gives: 'credit', credit: 1 }, { id: 'steps100', kind: 'count', counter: 'reflex_steps', n: 100, gives: 'credit', credit: 1 },
  { id: 'steps200', kind: 'count', counter: 'reflex_steps', n: 200, gives: 'credit', credit: 1 }, { id: 'steps600', kind: 'count', counter: 'reflex_steps', n: 600, gives: 'credit', credit: 2 }, { id: 'steps1000', kind: 'count', counter: 'reflex_steps', n: 1000, gives: 'credit', credit: 3 },
  { id: 'steps2000', kind: 'count', counter: 'reflex_steps', n: 2000, gives: 'credit', credit: 5 }, { id: 'rings100', kind: 'count', counter: 'ring_steps', n: 100, gives: 'credit', credit: 1 }, { id: 'rings200', kind: 'count', counter: 'ring_steps', n: 200, gives: 'credit', credit: 2 },
  { id: 'rings400', kind: 'count', counter: 'ring_steps', n: 400, gives: 'credit', credit: 2 }, { id: 'rings1000', kind: 'count', counter: 'ring_steps', n: 1000, gives: 'credit', credit: 3 }
];
// LADDER_CAP: a run hands over this many rungs at most (the depth rungs first, then the order of the table); a rung earned beyond that is handed
// over by the next run, so a good run pays into the runs after it and most runs give something.
const LADDER_CAP = 2;
// a rung marked long counts only what was done in a six-round or nine-round run (the counters kept under 'L:')
const ladderCount = (meta, r) => (r.kind === 'depth' ? (meta && meta.deep) || 0 : ((meta && meta.counters) || {})[(r.long ? 'L:' : '') + r.counter] || 0);
const ladderState = meta => LADDER.map(r => ({ id: r.id, kind: r.kind, gives: r.gives, thing: r.thing || null, credit: r.credit || 0, how: rungHow(r), count: Math.min(r.n, ladderCount(meta, r)), target: r.n, held: !!(meta && meta.ladder && meta.ladder[r.id]) }));
function ladderDue(meta) { if (!meta || RULE.ladder === false) return []; const L = meta.ladder = meta.ladder || {}, out = [], cap = LADDER_CAP || 99; LADDER.forEach(r => { if (r.gives === 'closed') return; if (out.length < cap && !L[r.id] && ladderCount(meta, r) >= r.n) { L[r.id] = (meta.counters && meta.counters.runs) || 1; if (r.credit) meta.credit = (meta.credit || 0) + r.credit; const t = r.thing ? thingOf(r.gives, r.thing) : null; out.push({ id: r.id, kind: r.kind, gives: r.gives, thing: r.thing || null, name: t ? t.name : r.credit ? r.credit + ' credit' : null, credit: r.credit || 0, how: rungHow(r) }); } }); return out; }
// THE REFERENCE BOOK (owner, 13 November: "some kind of reference notebook that shows all potential unlocks by category and how to unlock them.
// Also what they do so a player could theoretically plan"). P.reference(meta) is ONE table of every thing a player can get that a new game
// does not hold: { id, category, name, does, how, owned, count, target }. `does` is one plain line true to the rules; `how` is the one way it is
// got; count and target are given where the way is a count. The page hides `does` for a thing not owned (owner's pick). docs/REFERENCE.md is the
// same table written out. What is NOT in it, and why, is at the foot of that file.
// How a thing is got (owner, 13 November, ruling BA): a bare deed or a bare count, in the fewest words.
const RUNG_TXT = { max_chain_page: n => 'Chain ' + n + ' reflexes on one page.', max_mark: n => (n >= 4 ? 'End a round at OVERREACT.' : n === 3 ? 'End a round at 2 times the number to beat.' : 'End a round at 1.41 times the number to beat.'),
  max_kinds_round: n => 'Set off ' + n + ' kinds of reflex in one round.', max_kinds_run: () => 'Fire six different reagents in one run.', narrow_rounds: () => 'Clear a round firing three kinds of reagent or fewer.',
  near_rounds: () => 'Lose a round by under 15 in 100.', task_lost_rounds: n => 'Lose ' + n + ' rounds on the task alone.', bigger10_rounds: () => 'End a round 10 atoms bigger than dealt.', rounds: n => 'Play ' + n + ' rounds.', rounds_won: n => 'Clear ' + n + ' rounds.',
  runs_lost: n => 'Lose ' + n + ' runs.', reflex_steps: n => 'Set off ' + n + ' reflexes.', ring_steps: n => 'Close ' + n + ' rings.', oxidize_acted: n => n + ' uses of oxidize.', hydrate_fired: n => 'Fire hydrate ' + n + ' times.',
  water5_pages: n => 'Drive off 5 waters on a page, ' + n + ' times.', dry_steps: n => 'Set off dry ' + n + ' times.', dehydrate_fired: n => 'Fire dehydrate ' + n + ' times.', sh_made: n => 'Put on ' + n + ' SH.', hydrate_acted: n => n + ' uses of hydrate.', epoxidation_acted: n => n + ' uses of epoxidize.', hydrate_then_oxidize: n => 'Land hydrate then oxidize on one page, ' + n + ' times.',
  off_acid_fumes: n => 'Drive off acid fumes ' + n + ' times.',
  max_dehydrate_places: n => 'Make ' + n + ' C=C with one dehydrate.', max_co2_pages_round: n => 'Drive off carbon dioxide on ' + n + ' pages of one round.', hdh_pages: () => 'Land hydrate, dehydrate, hydrate on one page.',
  max_co_gain: n => 'End a page with ' + n + ' more C=O than dealt.', co_cleared_rounds: () => 'End a round with no C=O on a molecule dealt two or more.', max_close_round: n => 'Close ' + n + ' rings with chlorine in one round.',
  max_grow_places: n => 'Add ' + n + ' arms with one grow.', max_shrink_round: n => 'End a round ' + n + ' atoms smaller than dealt.', max_hydrate_places: n => 'Put on ' + n + ' OH with one hydrate.',
  n_ring_pages: () => 'Land aminate and close a ring through nitrogen on one page.', s_ring_pages: () => 'Land thiolate and close a ring through sulfur on one page.', cooh_rounds: () => 'End a round with a COOH the molecule was not dealt.',
  max_epoxidation_places: n => 'Make ' + n + ' epoxides with one epoxidize.', max_epox_pages_round: n => 'Land epoxidize on ' + n + ' pages of one round.', max_rings_page: n => 'Close ' + n + ' rings on one page.',
  arene_mark_rounds: () => 'End a round at 1.41 times the number to beat on a molecule with a benzene ring.', max_fused_gain: n => 'End a round with ' + n + ' more shared sides than dealt.', max_cc_gain: n => 'End a page with ' + n + ' more C=C than dealt.', max_rings_gain: n => 'End a round with ' + n + ' more rings than dealt.',
  met_after_empty: () => 'Clear a round whose first page set off no reflex.', max_water_page: n => 'Drive off ' + n + ' waters on one page.', water3_rounds: () => 'Drive off water on every page of a round.', max_both_gain: () => 'End a page with more C=C and more C=O than dealt.', max_oxidize_places: n => 'Turn ' + n + ' OH to C=O with one oxidize.',
  one_reagent_lines: () => 'Fill a page with one reagent.', max_chain_gain: n => 'End a round with the longest carbon chain ' + n + ' longer than dealt.', max_kinds_fired_round: n => 'Fire ' + n + ' different reagents in one round.',
  max_spent_round: n => 'Use up ' + n + ' reagents in one round.', all3_pages: () => 'Set off a reflex with each of a page\'s three reagents.', max_lost_last_chain: n => 'Lose a round whose last page chained ' + n + ' reflexes.',
  max_limits_page: () => 'Reach two of these on one page: dry once, weld twice, ring twice.', dry3_rounds: () => 'Set off dry on every page of a round.', max_h2_page: n => 'Drive off ' + n + ' hydrogens on one page.',
  max_het_rings_run: () => 'Close rings through oxygen, nitrogen and sulfur in one run.', dry_free_rounds: () => 'Clear a round without driving off water.', max_last_set: n => 'Set off ' + n + ' reflexes with the last reagent of a full page.',
  max_dbl_gain: n => 'End a page with ' + n + ' more double bonds than dealt.', max_cap_round: n => 'Close ' + n + ' rings with sulfur in one round.', grow_acted: n => n + ' uses of grow.', smaller_rounds: n => 'End ' + n + ' rounds smaller than dealt.', ritter_acted: n => n + ' uses of aminate.', thiolene_acted: n => n + ' uses of thiolate.' };
// A deed that counts only in a run of six rounds or more ends with one short mark, LONG_MARK (nineteenth; it was "In a run of six rounds or more.").
const LONG_MARK = 'Master\'s.';
const rungLong = r => (r.kind === 'depth' ? r.n <= 6 : !!r.long || r.counter === 'near_rounds' || r.counter === 'task_lost_rounds');
const rungHow = r => (r.kind === 'depth' ? 'Clear round ' + r.n + '.' : (RUNG_TXT[r.counter] || (n => r.counter + ' ' + n))(r.n)) + (rungLong(r) ? ' ' + LONG_MARK : '');
// THE MANUAL'S WORDS (ruling BA): the thing and one verb of its own; the act; then just the number. Everything is per page unless the line says
// otherwise. A side effect is a bare fact. No line explains itself. Every table below is in that voice; thingOf reads them.
// Reflexes: all of them, held from the start or earned, near and across the fold: [name, line].
const REF_REFLEX = { ring: ['Ring', 'Ring curls. An OH and a C=O join in a ring.'], dry: ['Dry', 'Dry parches. An OH near a C=O leaves as water and a C=C forms.'], weld: ['Weld', 'Weld fuses. Two C=O join in a ring.'],
  shift: ['Shift', 'Shift slides. A C=C two carbons from a C=O moves beside it.'], tuck: ['Tuck', 'Tuck nests. An OH adds to the far end of a C=C beside a C=O and closes a ring.'], flip: ['Flip', 'Flip turns. An OH on a C=C turns to C=O.'],
  snap: ['Snap', 'Snap springs. Two C=C side by side and a third nearby close a six-ring.'], close: ['Close', 'Close shuts. A Cl and an OH, NH2, SH or COOH join in a ring. Acid fumes leave.'], cap: ['Cap', 'Cap covers. An SH and a C=O join in a ring.'],
  knit: ['Knit', 'Knit loops. An NH2 and a C=O join in a ring.'], seal: ['Seal', 'Seal locks. A COOH and an OH, NH2 or SH 3 or 4 carbons apart join in a ring. Water leaves.'], open: ['Open', 'Open unlatches. An OH 3 or 4 carbons from an epoxide opens it and closes a ring.'],
  fold: ['Fold', 'Fold flattens. An epoxide with a carbon on both ends turns to C=O.'],
  ring_far: ['Ring across', 'Ring across arcs. An OH and a C=O facing across the fold join.'], cap_far: ['Cap across', 'Cap across vaults. An SH and a C=O facing across the fold join.'], knit_far: ['Knit across', 'Knit across threads. An NH2 and a C=O facing across the fold join as C=N. Water leaves.'],
  weld_far: ['Weld across', 'Weld across rivets. Two C=O facing across the fold join.'], seal_far: ['Seal across', 'Seal across clasps. A COOH and an OH, NH2 or SH facing across the fold join. Water leaves.'], close_far: ['Close across', 'Close across clamps. A Cl and an OH, NH2, SH or COOH facing across the fold join. Acid fumes leave.'],
  open_far: ['Open across', 'Open across pries. An epoxide and an OH facing across the fold join.'], tuck_far: ['Tuck across', 'Tuck across slips. An OH adds to the far end of a C=C beside a C=O across the fold.'], snap_far: ['Snap across', 'Snap across leaps. Two C=C side by side and a C=C facing them across the fold close a six-ring.'],
  bridge: ['Bridge', 'Bridge spans. Two SH facing across the fold join as S-S. Hydrogen leaves.'], stitch: ['Stitch', 'Stitch sews. Two C=C facing across the fold join in a four-ring.'], link: ['Link', 'Link ties. Two OH facing across the fold join as an ether. Water leaves.'] };
// Motifs, all twelve: [name, verb and act, the least count that pays]. The number is written by thingOf from MOTIFS[id].rate as the player reads it.
const REF_MOTIF = { sugar: ['Sugar', 'Sugar stacks. Keep a carbon with an OH.', 1], resonance: ['Resonance', 'Resonance ripples. Keep two double bonds one single bond apart.', 2], arene: ['Benzene ring', 'Benzene ring steadies. Keep a benzene ring.', 1],
  ring: ['Ring', 'Ring holds. Keep a ring outside benzene and cages.', 1], fusion: ['Shared side', 'Shared side braces. Keep two rings sharing a side.', 1], cage: ['Cage', 'Cage encloses. Keep rings tied into a cage.', 1],
  spiro: ['Spiro centre', 'Spiro centre pivots. Keep two rings meeting at one atom.', 1], acid: ['Acid group', 'Acid group anchors. Keep a COOH.', 1], amine: ['Amine', 'Amine hooks. Keep an amine nitrogen.', 1],
  sulfur: ['Sulfur bridge', 'Sulfur bridge joins. Keep a sulfur between two atoms.', 1], branch: ['Branch point', 'Branch point forks. Keep a carbon holding three carbons.', 1], chain: ['Long chain', 'Long chain trails. Keep three plain carbons in a row.', 1] };
const REF_GEAR = { crystal: 'Seed crystal seeds. A hydrogen on the carbon you pick turns to OH.', bunsen: 'Burner heats. Every OH that can lose water leaves a C=C.', burette: 'Burette drips. Every C=C outside a benzene ring turns to C=O.',
  magnet: 'Magnet pulls. Every run of four or more CH2 shuts to two carbons.', mirror: 'Mirror reflects. One side of the bond you pick is copied over the other.', carousel: 'Carousel deals. One more reagent on the first page of a round.', dropper: 'Dropper refills. Two more uses of every reagent.',
  timer: 'Timer widens. Four reagents a page.', counter: 'Tally counter tallies. One page counts twice toward the task.', condenser: 'Condenser returns. One more page, for the task only.' };
// Reagents, every one a run can hold, by the id the book uses: the reagent's name is its verb.
const REF_REAGENT = { hydrate: 'Hydrate wets. A C=C takes water, OH on the carbon with fewer H.', pcc: 'Oxidize tarnishes. A C-OH with an H to give turns to C=O.', allyl: 'Grow branches. A C=O takes a three-carbon arm with a C=C and turns to C-OH.',
  thiolene: 'Thiolate taints. Every C=C takes SH on the carbon with more H.', dehydrate: 'Dehydrate bakes. An alcohol loses water and leaves a C=C.', ritter: 'Aminate studs. Every C=C takes NH2 on the carbon with fewer H.',
  epoxidation: 'Epoxidize straddles. Every C=C turns to an epoxide.', hwe: 'Extend lengthens. An aldehyde or methyl ketone C=O turns to C=C beside a new ketone.', permanganate: 'Burn scorches. Chain-end C=C, aldehydes and chain-end CH2-OH turn to COOH.',
  hydroborate: 'Hydroborate soaks. A C=C takes OH on the carbon with more H and a C=O turns to C-OH.', cyanohydrin: 'Cyanate sours. An aldehyde or methyl ketone C=O turns to C(OH)-COOH. Ammonia leaves.', reduce: 'Reduce softens. C=O turns to C-OH.',
  chlorination: 'Chlorinate swaps. The OH of a primary or secondary alcohol turns to Cl.', hydroformylation: 'Formylate tips. Every C=C takes CHO on the carbon with more H.', ozonolysis: 'Cleave cuts. Every C=C splits into two C=O.',
  dihydroxylation: 'Dihydroxylate pairs. Every C=C takes an OH on both carbons.', hofmann: 'Eliminate N strips. An NH2 leaves and a C=C forms toward the neighbor with more H.', chugaev: 'Eliminate S sheds. An OH leaves and a C=C forms toward the neighbor with more H. Sulfur leaves.',
  memgbr: 'Add methyl plants. A C=O takes CH\u2083 and turns to C-OH.', wittig: 'Methylenate trades. The O of a C=O turns to CH\u2082, leaving C=C.', aibn: 'Polymerize chains. Every C=C starts a chain. A second use doubles each chain.',
  wacker: 'Oxidize C=C converts. A C=C turns to C=O on the carbon with fewer H.', wolff: 'Strip C=O scrubs. A C=O turns to CH\u2082.', h2: 'Hydrogenate fills. A C=C takes H\u2082.' };
REF_REAGENT.grow = REF_REAGENT.allyl; REF_REAGENT.oxidize = REF_REAGENT.pcc; REF_REAGENT.bh3 = REF_REAGENT.hydroborate; REF_REAGENT.nabh4 = REF_REAGENT.reduce;
const REF_TRACK = { gothic: 'Gothic hybrid', metal: 'Chain Lightning', surf: 'Monster-movie lab', baroque: 'Harpsichord unhinged' };
const REF_CARD = { hydroborate: 'bh3', reduce: 'nabh4' };
const REF_FEED = { water: 'waters driven off', h2: 'hydrogens driven off', co2: 'carbon dioxides driven off', acid: 'times hydrate or dehydrate acts', wood: 'times reduce acts', salt: 'times oxidize acts on an OH at the end of a chain', slime: 'times hydroborate acts', seedling: 'times grow acts', ammonia: 'times aminate acts or ammonia is driven off', brimstone: 'times thiolate acts or sulfur is driven off' };
// what a creature does (the numbers are read from HOMS2K; a multiplier is given as the player reads it on the yield)
// The manual's voice (ruling BA: "Acid eats. Chew 2 atoms off the molecule. x1.41."): the creature and one verb of its own; the act; the number.
// Every multiplier is written once, as xN.NN: the tap's own number times f, the factor of the creature's stage when RULE.homGrow is on; the
// book's rows also carry them as nums: [{ v, sign }]. Hydrogen, Wood spirit and Brimstone have one job each (RULE.homSimple; the lines of their
// older rules are REF_HOM0).
const REF_HOM0 = { h2: (K, f) => 'Hydrogen lifts. Put only two reagents on a page with oxidize second. x' + homX((K.k || 1) * f) + '. The chain carries into the next page; a shorter chain there: x' + homX(K.pop) + '.',
  wood: (K, f) => 'Wood spirit drinks. Line up first a reagent that finds nothing. He pours every dealt reagent left out; if one lands: x' + homX(K.k * f) + '. That bottle is empty all round.',
  brimstone: (K, f) => 'Brimstone burns. Put sulfur on the molecule with the task half done. The round ends; the task counts as met. x' + homX(K.k * f) + ' after page one, x' + homX(K.k2 * f) + ' after page two.' };
const REF_HOM = { water: (K, f) => 'Water floods. Wring out ' + K.need + ' waters. x' + homX(K.k * f) + '. Double bonds soak up OH; closed rings burst.',
  h2: (K, f) => (homSimple('h2') ? 'Hydrogen lifts. Drive off ' + HOMSIMPLE.h2.need + ' hydrogens. x' + homX(HOMSIMPLE.h2.k * f) + '.' : REF_HOM0.h2(K, f)),
  co2: (K, f) => 'Dry ice freezes. ' + (K.noCO2 ? 'Leave ' : 'Drive off carbon dioxide and leave ') + K.least + ' reagents untouched to the last page. x' + homX(Math.pow(K.k, K.most) * f) + '.',
  acid: (K, f) => 'Acid eats. Chew ' + K.loss + ' atoms off the molecule. x' + homX(K.k * f) + '.',
  wood: (K, f) => (homSimple('wood') ? 'Wood spirit drinks. Line up a reagent that finds nothing. x' + homX(HOMSIMPLE.wood.k * f) + '.' : REF_HOM0.wood(K, f)),
  salt: (K, f) => 'Salt preserves. ' + (K.match === 1 ? 'Open with last page\'s first reagent' : K.any ? 'Play last page\'s three reagents again' : 'Repeat last page\'s line') + '. x' + homX(K.k * f) + (K.match === 1 ? '. Its use returns.' : '. Uses return.'),
  slime: (K, f) => 'Slime clings. Land one reagent twice' + (K.steps === 0 ? '' : ', a reflex each time') + '. x' + homX(K.k * f) + '. That bottle is shut all round.',
  ammonia: (K, f) => 'Ammonia revives. Put nitrogen on the molecule. The three reagents go round again.' + ((K.k || 1) * f !== 1 ? ' x' + homX((K.k || 1) * f) + '.' : ''),
  seedling: (K, f) => 'Seedling sprouts. Add ' + K.gain + ' atoms. x' + homX(K.k * f) + (K.rise === false ? '.' : ', rising each page. Stall: x' + homX(K.wilt) + '.'),
  brimstone: (K, f) => (homSimple('brimstone') ? 'Brimstone burns. Put sulfur on the molecule. The round ends; the task counts as met.' + (HOMSIMPLE.brimstone.k ? ' x' + homX(HOMSIMPLE.brimstone.k * f) + '.' : '') : REF_HOM0.brimstone(K, f)) };
// how each is got, in the same voice (the count is its jar's size, JAR.full)
const REF_HOMHOW = { water: n => n + ' waters driven off.', h2: n => n + ' hydrogens driven off.', co2: n => n + ' carbon dioxides driven off.', acid: n => n + ' uses of hydrate or dehydrate.',
  wood: n => n + ' uses of reduce.', salt: n => n + ' chain-end OH oxidized.', slime: n => n + ' uses of hydroborate.', seedling: n => n + ' uses of grow.',
  ammonia: n => n + ' aminate landings or ammonias driven off.', brimstone: n => n + ' thiolate landings or sulfurs driven off.' };
// the multipliers written in a line, in order: [{ v, sign }], sign '+' for a rise and '-' for a drop (so the page need not read the sentence)
const capName = t => String(t || '').replace(/^./, c => c.toUpperCase());
const refNums = t => { const o = []; String(t || '').replace(/\bx(\d+(?:\.\d+)?)/g, (m, v) => { o.push({ v: +v, sign: +v >= 1 ? '+' : '-' }); return m; }); return o; };
const homK = k => (HOMS2K.asRead ? k : Math.round(Math.pow(k, FLAT.pow) * 100) / 100);
const homX = k => homK(k).toFixed(2);      // as the book writes it: always two decimals      // a creature's k multiplies extra; the player reads its square root (FLAT)
const REF_TERM = { glass: ['Glass', 'Glass shatters. A round ends at the first reagent that does not carry on. x1.73.', 'Beat a round in which six reagents in a row each carry on.'], occult: ['Occult', 'Occult conjures. The run starts with one random instrument. Every number to beat x1.22.', 'Clear 5 rounds in one run.'],
  lean: ['Lean', 'Lean pares. Three of the starting reagents, one more use of each.', 'Beat a round firing two kinds of reagent or fewer.'], long: ['Long', 'Long stretches. Four reagents a page, two pages a round.', 'Have ten reagents in a row each carry on, in one round.'], hoard: ['Hoard', 'Hoard stockpiles. The run starts with three random instruments and is offered no more.', 'Hold five instruments in one run.'] };
const REF_LENGTH = { master: ['Master\'s runs six rounds with instruments. Each needs its task and a pass mark.', 'Win a three-round run.'], doctorate: ['Doctorate runs nine rounds. Instruments and one homunculus allowed.', 'Win a six-round run.'] };
// thingOf(category, id): the name and the one line of what it does, from the rules' own tables
function thingOf(cat, id, f) {
  if (cat === 'reagent') { const c = RX.CARDS[REF_CARD[id] || id] || {}; return { name: c.verb || id, does: REF_REAGENT[id] || REF_REAGENT[REF_CARD[id]] || c.rule || c.note || '' }; }
  if (cat === 'reflex') { const r = REF_REFLEX[id] || [capName(id), '']; return { name: r[0], does: r[1] }; }
  if (cat === 'motif') { const r = REF_MOTIF[id], M = MOTIFS[id] || { rate: 0 }; return { name: r[0], does: r[1] + ' x' + homX(1 + M.rate * r[2]) + '.' }; }
  if (cat === 'instrument') { const G = GEARS[id] || {}, n = REF_GEAR[id] || G.note || ''; return { name: capName(G.name || id), does: n + (G.task || G.tool ? ' Once a round.' : '') }; }
  if (cat === 'soundtrack') return { name: REF_TRACK[id], does: 'A soundtrack.' };
  if (cat === 'sigil') { const S = SIGILS[id], ar = id === 'aqua_permanens' ? RULE.aquaRounds : 0; return { name: S.name, does: (ar ? S.does.replace(/\.$/, ' for ' + ar + ' rounds.') : RULE.sigilStrong && RULE.sigilStrong[id] ? S.does : S.doesPlain || S.does) + (sigilPays(id) ? ' Gives ' + sigilPays(id) + ' gold.' : '') }; }
  if (cat === 'homunculus') { const once = RULE.brimOnce && id === 'brimstone' ? ' Once a run.' : RULE.homOnce && id !== 'co2' ? ' Once a round.' : ''; return { name: capName(HOMS[id].name), does: REF_HOM[id](HOMS2K[id] || {}, f || 1).replace(/(x\d+\.\d\d\.)/, '$1' + once) }; }      // nineteenth (owner): the "Brings X." lines are gone from the book; the rule itself (HOMS[id].brings) stands
  if (cat === 'term') return { name: REF_TERM[id][0], does: REF_TERM[id][1] };
  if (cat === 'length') return { name: id === 'master' ? 'Master\'s' : 'Doctorate', does: REF_LENGTH[id][0] };
  return { name: id, does: '' };
}
// owned(meta): what the saved profile holds, by category. The ladder's rungs are read from meta.ladder; the rest from where the page keeps them
// (meta.hatched, meta.fam, meta.found, meta.sig, meta.reach, meta.sign).
function owned(meta) {
  const m = meta || {}, L = m.ladder || {}, o = { reagent: [], reflex: [], motif: [], instrument: [], soundtrack: [], sigil: [], homunculus: [], term: [], length: [], sign: [] };
  LADDER.forEach(r => { if (r.thing && L[r.id] && o[r.gives]) o[r.gives].push(r.thing); });
  Object.keys(HOMS).forEach(id => { if (m.hatched && m.hatched[id]) o.homunculus.push(id); });
  FAMILIES.forEach(f => { if (m.fam && m.fam[f.id]) f.reagents.forEach(x => o.reagent.push(x)); }); Object.keys(FOUND).forEach(k => { if (m.found && (m.found[k] || m.found[FOUND[k]])) o.reagent.push(FOUND[k]); });      // the page saves meta.found by the reagent's id
  Object.keys(REF_TERM).forEach(id => { if (m.sig && m.sig[id]) o.term.push(id); });
  const reach = Math.max(1, m.reach || 1, (m.counters && m.counters.won_master) ? 3 : (m.counters && m.counters.won_bachelor) ? 2 : 1); if (reach >= 2) o.length.push('master'); if (reach >= 3) o.length.push('doctorate');
  for (let k = 1; k <= signOf(m); k++) o.sign.push('sign' + k);
  return o;
}
function reference(meta) {
  const m = meta || {}, own = owned(m), c = m.counters || {}, out = [], has = (cat, id) => own[cat].includes(id);
  const add = (category, id, name, does, how, count, target) => out.push({ id, category, name, does, how, nums: refNums(does), owned: has(category, id), count: target ? Math.min(target, count || 0) : null, target: target || null });
  // a deed that is a mark reached has no count to show: 0 or 1
  // nineteenth: the eight motifs a new game holds have rows too (start: true, owned, nothing to count), so the book shows all twelve
  MOTIF_START.forEach(id => { const t = thingOf('motif', id); add('motif', id, t.name, t.does, 'From the start.', null, null); const row = out[out.length - 1]; row.owned = true; row.start = true; });
  LADDER.forEach(r => { if (!r.thing) return; const t = thingOf(r.gives, r.thing), mark = r.counter === 'max_mark'; add(r.gives, r.thing, t.name, t.does, rungHow(r), mark ? (ladderCount(m, r) >= r.n ? 1 : 0) : ladderCount(m, r), mark ? 1 : r.n); if (rungLong(r)) out[out.length - 1].long = true; });      // long: the deed counts only in a run of six rounds or more (its line ends with LONG_MARK)
  FAMILIES.forEach(f => f.reagents.forEach(x => { const t = thingOf('reagent', x); add('reagent', x, t.name, t.does, 'Buy the ' + f.name + '. ' + f.cost + ' credit.', Math.min(f.cost, m.credit || 0), f.cost); }));
  add('reagent', 'wacker', thingOf('reagent', 'wacker').name, thingOf('reagent', 'wacker').does, 'Oxidize an OH that hydrate or hydroborate just made.', has('reagent', 'wacker') ? 1 : 0, 1);
  add('reagent', 'wolff', thingOf('reagent', 'wolff').name, thingOf('reagent', 'wolff').does, 'Reduce or hydroborate, then dehydrate, then hydrogenate, each on what the last one made.', has('reagent', 'wolff') ? 1 : 0, 1);
  Object.keys(HOMS).forEach(id => { const hs = homStage({ meta: m }, id), t = thingOf('homunculus', id, RULE.homGrow ? homF(id, hs.stage) : 1), full = jarFull(id); add('homunculus', id, t.name, t.does, (RULE.jarStart && JARSTART.how[id] ? JARSTART.how[id] : REF_HOMHOW[id])(full), (m.jar && m.jar[id]) || 0, full); const row = out[out.length - 1]; row.stages = hs.mults; row.stage = RULE.homGrow === 'keep' || RULE.homGrow === 'both' ? homStage({ meta: m, homJobs: { [id]: 99 } }, id).stage : null; row.life = (m.jar && m.jar[id]) || 0; });      // stages: the five numbers the creature's multiplier climbs through (homStage); stage: how far this profile's has come
  Object.keys(REF_TERM).forEach(id => add('term', id, REF_TERM[id][0], REF_TERM[id][1], REF_TERM[id][2] + (RULE.termsGate ? ' After two runs that cleared six rounds.' : ''), m.sig && m.sig[id] ? 1 : 0, 1));
  add('length', 'master', 'Master\'s', REF_LENGTH.master[0], REF_LENGTH.master[1], c.won_bachelor || (has('length', 'master') ? 1 : 0), 1);
  add('length', 'doctorate', 'Doctorate', REF_LENGTH.doctorate[0], REF_LENGTH.doctorate[1], c.won_master || (has('length', 'doctorate') ? 1 : 0), 1);
  const total = out.filter(x => !x.start).length + SIGN.laps;      // the sign counts what can be got: the eight starting motifs' rows are left out, so its nine tenths is as it was
  for (let k = 1; k <= SIGN.laps; k++) add('sign', 'sign' + k, 'The sign, ' + (k === 1 ? 'first' : k === 2 ? 'second' : 'third') + ' time', 'The sign resets. The book keeps only the two found reagents. x' + (1 + SIGN.lift * k).toFixed(2) + '; the number to beat x' + Math.pow(SIGN.bar, k).toFixed(2) + '.', (k > 1 ? 'Take the sign ' + (k > 2 ? 'twice' : 'once') + '. ' : '') + 'Hold nine tenths of this book.', null, null);
  const n = out.filter(x => x.category !== 'sign' && x.owned && !x.start).length, need = Math.ceil(SIGN.share * (total - SIGN.laps));
  out.forEach(x => { if (x.category === 'sign') { x.count = Math.min(need, n); x.target = need; } });
  return out;
}
// stageOf(meta): what the page's own gate (meta.stage) should read from now on, worked out from the book and not kept apart from it: 1 a new
// profile; 2 once a six-round run is open (instruments and homunculi can be held, so the bench, the jars and the kit show); 3 once a nine-round
// run is open (terms of a run). gateOpen(meta, what) says the same by name: 'instruments', 'homunculi', 'terms'. An instrument, a homunculus or a
// term is then held back only by its own way in the book.
const stageOf = meta => { const o = owned(meta); return Math.max((meta && meta.stage) || 1, o.length.includes('doctorate') ? 3 : o.length.includes('master') ? 2 : 1); };      // never below what an older save already holds
const gateOpen = (meta, what) => stageOf(meta) >= (what === 'terms' ? 3 : 2);
// the categories of the book, in the order the page should show them, with the name of each
const REFERENCE_CATS = [['reagent', 'Reagents'], ['reflex', 'Reflexes'], ['motif', 'Motifs'], ['instrument', 'Instruments'], ['homunculus', 'Homunculi'], ['sigil', 'Sigils'], ['term', 'Terms of a run'], ['length', 'Longer runs'], ['soundtrack', 'Soundtracks'], ['sign', 'The sign']];
// profileOpts(meta): what runNew needs from the saved profile so that a run offers what is owned and nothing else: P.runNew(tier, extra, Object.assign({ tierNo, meta }, P.profileOpts(meta)))
function profileOpts(meta) { const o = owned(meta); return { meta, unlockedReagents: o.reagent.filter(x => OFFER_REAGENTS.includes(x)), unlocked: o.reflex.slice(), motifOpen: MOTIF_START.concat(o.motif), instruments: o.instrument.slice(), sigilsOwned: o.sigil.slice(), sign: signOf(meta) }; }
// THE NOTES' FACTS (docs/NOTES_WRITING.md, "rules side must compute"). facts(g, run, meta) gives the page, at any moment of a round:
//   gap         of the last reflex step: how far apart the two groups that reacted were, counted along the molecule from one group's carbon to the
//               other's (3 or 4 for a ring along the chain, 6 or more across the fold); null when no reflex has fired. Every reflex step also
//               carries it: g.trail[i].gap.
//   roundbest   the longest chain a page of this round has made so far (the page in play counted)
//   runbest     the same over the run (kept in run.chainBest)
//   careerbest  the same over every round finished before this one (meta.counters.max_chain_page); a new record is roundbest > careerbest
//   molseen     how many rounds this molecule was dealt in before this one, over the career;  molbest  its best yield in them (meta.mols)
//   loose       loose rings standing on the molecule now (the rings that open again when the page is turned)
//   overreacts  rounds ended at the top mark, over the career (meta.counters.overreacts)
// molseen, molbest, careerbest and overreacts need the saved profile (run.meta, or meta given); without it they are 0.
function facts(g, run, meta) {
  const m = meta || (run && run.meta) || null, c = (m && m.counters) || {}, steps = g.trail.filter(t => t.free && t.kind), last = steps[steps.length - 1] || null, roundbest = Math.max(g.cascBest || 0, g.casc || 0);
  if (run) run.chainBest = Math.max(run.chainBest || 0, roundbest);
  const key = g.cur && g.cur.feedSig, h = (m && m.mols && key && m.mols[key]) || null; let loose = 0; try { const cl = RX.cloneModel(g.m); loose = RX.ENG.reopen(cl) || 0; } catch (e) { loose = 0; }
  return { gap: last && last.gap != null ? last.gap : null, roundbest, runbest: run ? run.chainBest : roundbest, careerbest: c.max_chain_page || 0, molseen: h ? h.seen : 0, molbest: h ? h.best : 0, loose, overreacts: c.overreacts || 0 };
}
const findingsProgress = meta => FINDING_COUNTS.map(f => ({ id: f.id, name: f.name, count: Math.min(f.target, ((meta && meta.counters) || {})[f.counter] || 0), raw: ((meta && meta.counters) || {})[f.counter] || 0, target: f.target, counter: f.counter }));
const motifOpen = g => (RULE.motifAll ? Object.keys(MOTIFS) : (g && g.runRef && g.runRef.motifOpen) || MOTIF_START);
// the levels (above zero) of the motifs on a molecule as it stands: a loose ring is read open
// Where each motif sits (nineteenth, for the page's marks): { id: [[atom, ...], ...] }, the atoms being the model's own. Made by the code that
// counts (SX motifPlaces), on the molecule read as motifsOf reads it (a loose ring open). The number of places is the motif's count, except a
// cage: one place a cage, whose count is its rings less one (the place carries it as .n). What a place holds: sugar the carbon and its OH;
// resonance one double bond of the longest run; arene and ring the ring; fusion the two atoms of the shared side; cage the cage; spiro, amine,
// branch one atom; acid the carbon and its two oxygens; sulfur the S of C-S-C or the two S of S-S; chain three carbons of the longest run.
// It gives every motif on the molecule, open or not: motifOpen(g) says which pay.
function motifAtoms(m) { const cm = RX.cloneMap(m), back = new Map(); cm.map.forEach((c, a) => back.set(c, a)); RX.reopen(cm.model); const at = SX.motifAtomsOf(cm.model), out = {}; Object.keys(at).forEach(id => { out[id] = at[id].map(p => { const q = p.map(c => back.get(c)).filter(Boolean); if (p.n) q.n = p.n; return q; }); }); return out; }
function motifsOf(m) { const c = RX.cloneModel(m); RX.reopen(c); const f = SX.featOf(c), out = {}; Object.keys(MOTIFS).forEach(k => { const v = f.get('m:' + k); if (v > 0) out[k] = v; }); return out; }
const HETF = {}, hetFeed = f => (f in HETF ? HETF[f] : (HETF[f] = /[^CcOoHh0-9()=#\[\]@+\-\/\.%:]/.test(f)));
function feedsFor(kin, round, skip) {
  if (!AA.rxFeedOld) { const rr = Math.max(1, Math.min(9, round | 0)), inR = f => (FEED_ROUNDS[f] || []).includes(rr) && !(skip || []).includes(f); let pool = FEEDS.filter(f => inR(f) && !FEED_BANK[f]), bank = FEEDS.filter(f => inR(f) && FEED_BANK[f]); const fam = f => KIN_OF[f] === kin, p2 = pool.filter(fam), b2 = bank.filter(fam); if (p2.length) pool = p2; if (b2.length) bank = b2; return ((rand() < P_POOL[rr - 1] || !bank.length) && pool.length) ? pool : (bank.length ? bank : pool); }
  const of = FEEDS.filter(f => KIN_OF[f] === kin && !(skip || []).includes(f)), t = sizeFor(round), near = of.filter(f => Math.abs(feedSize(f) - t) <= FEEDSIZE.near); let out = near.length ? near : of.sort((a, b) => Math.abs(feedSize(a) - t) - Math.abs(feedSize(b) - t)).slice(0, 2);
  if (RULE.filter && round <= FILTER.upTo) { const ok = out.filter(f => !feedShape(f).bad); if (ok.length) { out = ok; const pref = out.filter(f => feedShape(f).good); for (let k = 1; k < FILTER.prefer; k++) out = out.concat(pref); } }
  return out; }
// Families. Every starting molecule belongs to one, and each family scores by a rule of its own, so the molecule a
// round is played on decides how it is best played. The rule is paid on every reaction it fits.
//   chain: keeps a row going.  ring: comes back round to a form it has had.  arene: one exact change at a time.
//   sugar: many places at once.  cage: reacts by itself.
const KIN = {
  chain: { name: 'chain', tier: 0, odds: 38, col: '#5a6475', tok: '{r} +0.15', note: 'in a row', fx: c => (c.cont ? { part: 'r', op: 'add', val: 0.15 } : null) },
  ring: { name: 'ring', tier: 0, odds: 24, col: '#2f8f6a', tok: '{p} twice', note: 'a loop', fx: c => (c.loop ? { part: 'h', op: 'mul', val: 2 } : null) },
  arene: { name: 'arene', tier: 1, odds: 16, col: '#a8791a', tok: '{e} +0.2', note: 'one place', fx: c => (c.hits === 1 ? { part: 'e', op: 'add', val: 0.2 } : null) },
  sugar: { name: 'sugar', tier: 2, odds: 13, col: '#c0489a', tok: '{r} +0.2', note: 'each extra place', fx: c => (c.hits > 1 ? { part: 'r', op: 'add', val: 0.2 * (c.hits - 1) } : null) },
  // not a family to be dealt: a state any molecule can be built into. Every reaction multiplies extra, more per link.
  // It was 1.05 a link until 2026-11-10: at six links that is 1.3 a reaction, and it alone put the four phenyl molecules
  // four times above the rest and doubled the spread of a round.
  resonance: { name: 'resonance', tier: 0, odds: 0, col: '#b0189a', tok: '{e} times 1.02', note: 'every reaction', fx: () => ({ part: 'e', op: 'mul', val: 1.02 }) },
  cage: { name: 'cage', tier: 3, odds: 9, col: '#c8261c', tok: '{e} +0.3', note: 'a free reaction', fx: c => (c.free ? { part: 'e', op: 'add', val: 0.3 } : null) }
};
const KIN_OF = {}; FEED.forEach(q => { KIN_OF[q[1]] = q[0]; });
// The families a molecule belongs to as it stands, each with a level. A molecule the player has built into a ring, or
// into several things at once, is paid by every rule that fits, and a rule is paid more the more of that thing there is.
function kinsOf(m) {
  const s = RX.shapeOf(m), out = [], cap = n => Math.min(3, n);
  if (s.cage) out.push({ id: 'cage', lv: 1 });
  if (s.ring && !s.cage) out.push({ id: 'ring', lv: cap(s.ring) });
  if (s.arene) out.push({ id: 'arene', lv: cap(s.arene) });
  if (s.oh >= 3) out.push({ id: 'sugar', lv: cap(Math.floor(s.oh / 3)) });
  if (!out.length) out.push({ id: 'chain', lv: 1 });
  if (s.conj) out.push({ id: 'resonance', lv: Math.min(6, s.conj) });
  return out;
}
// Every molecule dealt can zip with the starting reagents, so none is kept out of round one any more.
const NOZIP = [];
const kinOf = feed => (typeof feed === 'string' && KIN_OF[feed]) || 'chain';
// keep: batch multiplier at delivery when the marked group is intact. steps: reactions allowed in one order.
const DIAL = { keep: 3, steps: 3 };
// Rules of a round that bound it and make a turn a choice. Each can be switched off (0 or false) to measure without it.
//   atoms: a reaction that would grow the molecule past this many heavy atoms is not offered.
//   chain: the most free reactions one overreact chain can run.
//   loops: how many times a round a return to an earlier form may carry a row on.
//   loopsAll: any player may do that. Off, only the recycler allows it.
//   ground: a reaction carries the row on when it acts on what any of the last this-many reactions of the row made.
//         0 or 1: only the last one.
//   uses: how many times a reagent can be used in a whole round. Pages and the free chain spend the same uses. 0: two a page.
//   fork: a chain that could go on with two or more reagents stops for the player to choose.
//   hand: how many reagents of the rack a page shows. 0: five, dealt again up to forty times until two of them act.
//   redraw: once a page the hand can be dealt again for one use of the fullest reagent in it.
//   bank: closing the open row on purpose pays this many times what it holds (2, on a row of 3 or more: measured with
//         the rig so that the bank is the right move on about three in ten of the circles where it could be placed).
//         It takes one of the page's reactions,
//         or ends a chain that is stopped at a fork. bankMin: the shortest row that can be banked.
//   tiers: marks above the number to beat, each this many times the number. The number stays the pass line.
//   coins: the currency of a run (see COIN). Off, nothing is paid and nothing can be spent.
//   cascade: after a reagent has acted ('each') or after the whole line has ('end'), every reaction the molecule has
//         with itself happens, one at a time, until none is left. Each step is worth more than the one before.
//         With it on there is no free chain of reagents, no fork and no chain limit. Off: the chain as it was.
//   queue: a page is lined up and then fired. Reagents (and the bank) are placed in the page's circles in order, and
//         the molecule then runs through them. One that finds nothing to act on when its turn comes is wasted and
//         still spends its use. The redraw is allowed only before firing. Off: one click, one reaction, as before.
const RULE = { atoms: 32, chain: 6, loops: 2, loopsAll: true, ground: 2, uses: 3, fork: true, hand: 5, redraw: true, bank: 1.5, bankMin: 2, tiers: [1.41, 2, 2.83], coins: true, queue: true };
RULE.bank = 2; RULE.bankMin = 3; RULE.cascade = 'each';
//   reopen: a ring closed by a zip is loose. When a page is turned (and when a round starts) every such ring opens
//         again, so the next page begins with the chain as it was set up and can be set off again, longer if the
//         player has added to it. Rings made by a weld or a snap, and a zip whose OH has since been taken off, stay shut.
//   ban: reagents and kinds of cascade that are never offered, for measuring a run without them.
//   weld: 'ol' or 'ene', what a weld leaves behind (rules.js MODE.weld).
//   fresh: only the steps of a cascade past the longest of the round's earlier pages are paid in full (CASC.old).
RULE.co2 = true; RULE.atoms = 56; RULE.reopen = true; RULE.ban = ['extend', 'dione', 'phenol', 'couple', 'cyclize', 'hcl', 'koh', 'aromatize', 'socl2', 'naoh']; RULE.weld = 'ol'; RULE.fresh = true;
const heavy = m => { let n = 0; for (let i = 0; i < m.atoms.length; i++) if (m.atoms[i].el !== 'H') n++; return n; };
RUN.TUNE.chain = 0.1; RUN.TUNE.route = 0.25; RUN.TUNE.siteBatch = 0;
// reagents whose reaction makes a group leave the molecule
// What a molecule does to itself once it has been set off, with no reagent held: opened by how deep the suppliers go.
// With the cascade these happen by themselves. A run starts with the ones of tier 0; the others turn up on the
// take-one page once the supplier of their tier is open, and are active for the rest of the run once taken.
// docs/CASCADES.md: zip (the card lactol) is the first and only cascade a new player has. snap (the card snap6)
// comes with the research supplier and weld with the instrument maker. The other kinds (fold, run, link) are not built.
// the thirteen reflexes (docs/tools_chem/FINAL.md): the card ids are the page's older names for ring (lactol), dry (enone), flip (taut), snap (snap6), close (ether).
// A new game holds ring, dry, weld, shift, tuck, flip, snap and the three that work on N, S and Cl (knit, cap, close): owner's rulings AE (several kinds at once) and AF (more than carbon and oxygen); open, fold and seal need an epoxide or an acid and are opened by findings (UNLOCKS), in this order. RULE.holdAll holds all of them (for testing).
const SELF = [{ id: 'lactol', tier: 0 }, { id: 'enone', tier: 0 }, { id: 'weld', tier: 0 }, { id: 'shift', tier: 0 }, { id: 'tuck', tier: 0 }, { id: 'taut', tier: 0 }, { id: 'snap6', tier: 0 }, { id: 'open', tier: 2 }, { id: 'fold', tier: 2 }, { id: 'ether', tier: 0 }, { id: 'cap', tier: 0 }, { id: 'knit', tier: 0 }, { id: 'seal', tier: 3 }];
const SELF0 = SELF.filter(q => q.tier === 0).map(q => q.id);
const reflexesHeld = run => { if (RULE.holdAll) return SELF.map(q => q.id); const un = (run && run.unlocked) || []; return SELF.filter(q => q.tier === 0 || un.includes(q.id)).map(q => q.id); };
// The cascade. Step n of a page is worth n times the first: it adds place for its one place and that counts n times,
// and it adds n times step to extra, which multiplies everything the round makes. So three steps on a page add 0.6
// to extra, six add 2.1 and ten add 5.5: a round of threes ends near 3 times a round with no cascade, a round of
// sixes near 7 times and a round of tens near 17 times. It adds and does not multiply (mul: it multiplied extra by
// 1 + n step until 2026-11-11; ten steps then multiplied a round by 1,100, and with the zip opening again on every
// page one long cascade decided a run). row: what a step adds to the row (a reagent that follows on adds SYN.row).
// Measured on one molecule of round eight: with step 0.01 a line that set off six steps made 4,800 and a line that
// set off none made 4,440, because three reagents on a long molecule change many places; the count has to pay more
// than that. most: a page stops cascading after this many steps, so that it cannot stall.
// old: a step that is not new pays this share. A step is new when the page has run past the longest cascade of any
// earlier page of the round (RULE.fresh). A chain that is standing opens and zips again on every page; fired again
// as it is, it pays a quarter. What the three reagents of a page are for is making it longer than it has been.
const CASC = { step: 0.1, place: 50, row: 0.1, mul: false, most: 40, old: 0.25 };
const LEAVES = { aromatize: 1, cyclize: 1, pcc: 1, dehydrate: 1, socl2: 1, koh: 1, naoh: 1, wittig: 1, wolff: 1, extend: 1, dione: 1, phenol: 1, rcm: 1, couple: 1 };
// What leaves a molecule in a reaction, by what it is made of.
// what a group that left is counted as: the reagent or reflex that sent it says (grp.off), else its atoms do
const OFFKIND = { water: 'water', hydrogen: 'h2', carbon_dioxide: 'co2', acid_fumes: 'chloride' };
const kindOf = grp => { if (grp && grp.off) { const k = Object.keys(grp.off)[0]; return OFFKIND[k] || 'other'; } return byKind(grp); };
const tallyOff = (g, grp, kind) => { if (grp && grp.off) Object.keys(grp.off).forEach(k => { g.tally['off_' + k] = (g.tally['off_' + k] || 0) + grp.off[k]; if (k === 'ammonia') homEvent(g, 'nh3'); if (k === 'sulfur') homEvent(g, 'sulfur'); }); else { const ok = SPEC_OFF[kind] || 'other'; g.tally['off_' + ok] = (g.tally['off_' + ok] || 0) + 1; } };
const byKind = grp => { const k = grp.map(a => a.el).sort().join(''); return k === 'HHO' ? 'water' : k === 'HH' ? 'h2' : k === 'COO' ? 'co2' : k === 'O' ? 'oxide' : k.includes('Cl') ? 'chloride' : 'other'; };
// Equipment that catches a by-product as it leaves, and what that adds. A by-product nothing catches is collected
// if it is water or hydrogen: it goes to its jar (docs/JARS.md) and feeds the homunculus of the run.
const CATCH = (() => { const A = (part, val) => ({ part, op: 'add', val }), M = (part, val) => ({ part, op: 'mul', val }); return { coldtrap: { water: A('e', 0.12) }, candle: { h2: A('e', 0.25) }, litmus: { chloride: A('e', 0.4) }, regia: { any: M('e', 1.02) },
  dryer: { water: A('p', 60) }, sieves: { water: A('r', 0.6) }, hood: { any: A('e', 0.06) }, scrubber: { h2: A('p', 50), chloride: A('p', 80), oxide: A('p', 80) } }; })();
// a reagent found by doing counts for the whole row it stands for: its places count this many times and the row gets the name's bonus
const SHORT = { wacker: 3, wolff: 4 };
const BY = { tally: 1e9, pay: 50 };
// How rare a reagent is. A rarer one turns up less often among the three to take and adds more for each place.
// odds: weight among the reagents on offer.  place: what each place it changes adds.  dots: how it is marked.
const RARITY = { common: { odds: 60, place: 20, dots: 1, col: '#5a564e' }, uncommon: { odds: 28, place: 30, dots: 2, col: '#1f5fbf' }, rare: { odds: 10, place: 45, dots: 3, col: '#b0189a' }, legend: { odds: 2, place: 70, dots: 4, col: '#c8891a' } };
const TIER = { extend: 'uncommon', dione: 'rare', phenol: 'uncommon', couple: 'rare', rcm: 'rare', snap: 'rare', aromatize: 'rare', cyclize: 'uncommon', hcl: 'uncommon', koh: 'uncommon', socl2: 'uncommon', naoh: 'uncommon', memgbr: 'uncommon', wittig: 'uncommon', wacker: 'rare', wolff: 'rare', aibn: 'legend' };
const rarityOf = id => RARITY[TIER[id] || 'common'];
// Kinds of chemistry opened between runs with credit. Each adds its reagents to what any run can turn up.
const FAMILIES = [
  { id: 'metal', name: 'organometallics', cost: 5, reagents: ['memgbr'] },
  { id: 'ylide', name: 'ylides', cost: 8, reagents: ['wittig'] },
  { id: 'radical', name: 'radicals', cost: 14, reagents: ['aibn'] }
];
// A named row done for the first time adds the reagent that does it in one step to what any run can turn up.
const FOUND = { ketone: 'wacker', removal: 'wolff' };

// Equipment. site(c) fires for every site that reacts, step(c) once for every reaction, end(c) at delivery.
// Each returns [kind, value] or null: y adds yield, b adds batch, x multiplies batch. note is what is pencilled under it.
// c: hits, cont (the step continued a chain), len (links in the chain so far), loop (the product is a molecule the
// order has held before), leaves, first (first use of this reagent on the order), unused (steps not taken), kept, lost.
// What a round makes is three numbers multiplied together: places, row and extra.
//   places: every place a reagent changes adds to it.
//   row: goes up with every reaction that follows on from the last, and starts again when the row breaks.
//   extra: starts at 1 and is raised only by equipment, rare reagents and the finishing reagent.
// Each piece of equipment feeds one of the three. at: 'site' fires for every place, 'step' once for every reaction.
// fx returns what it does, or nothing. part 'p' is places, 'h' is the places of this reaction alone, 'r' is row, 'e' is extra.
// c: hits, cont (this reaction follows on), len (reactions in the row so far), loop (back to an earlier molecule),
// leaves, first (reagent not yet used this round), nth, page, pageStep, pageMax, cls, same, distinct.
const A = (part, val) => ({ part, op: 'add', val }), M = (part, val) => ({ part, op: 'mul', val });
const GEAR = [
  // places
  { id: 'balance', tok: '{p} +15', fam: 'places', note: 'each place: +15 places', name: 'balance', shape: 'box', at: 'site', fx: () => A('p', 15) },
  { id: 'spatula', tok: '{p} +90', fam: 'places', note: 'only one place changed: +90 places', name: 'spatula', shape: 'column', at: 'step', fx: c => (c.hits === 1 ? A('p', 90) : null) },
  { id: 'schlenk', tok: '{p} double', fam: 'places', note: '2 or more places at once: that reaction counts double', name: 'schlenk line', shape: 'flask', at: 'step', fx: c => (c.hits >= 2 ? M('h', 2) : null) },
  { id: 'duck', tok: '{e} +0.01', fam: 'extra', note: 'says nothing. extra +0.01 for every reaction it has watched this round', name: 'rubber duck', shape: 'round', at: 'step', fx: c => A('e', 0.01 * c.nth) },
  { id: 'poster', tok: '{r} +0.5', fam: 'row', note: 'the first reaction of a round: row +0.5. nothing after', name: 'poster', shape: 'box', at: 'step', fx: c => (c.nth === 1 ? A('r', 0.5) : null) },
  { id: 'coffee', tok: '+1 then -1', fam: 'rule', rule: true, note: 'one more reaction on pages one and two. one fewer after', name: 'coffee', shape: 'round' },
  { id: 'coat', tok: 'copy', fam: 'rule', note: 'copies the piece to its left', name: 'lab coat', shape: 'box' },
  { id: 'milk', tok: '{e} +0.1', fam: 'extra', note: 'expired. it grows: extra +0.1 at the start of a round for every round it has been kept', name: 'expired milk', shape: 'box' },
  { id: 'mystery', tok: '+1 unknown', fam: 'rule', rule: true, note: 'a reagent from anywhere, a different one on every page', name: 'unlabeled bottle', shape: 'column' },
  { id: 'goggles', tok: 'pays 1', fam: 'rule', rule: true, note: 'on forehead. protects nothing. pays 1 credit for every round beaten', name: 'goggles', shape: 'round' },
  { id: 'grant', tok: 'pays 5', fam: 'rule', rule: true, note: 'funded only if a round is beaten ten times over: pays 5 credit', name: 'grant proposal', shape: 'box' },
  { id: 'extinguisher', tok: 'times 1.5', fam: 'rule', rule: true, note: 'a click during a chain stops it and the round counts half again. once a round', name: 'extinguisher', shape: 'column' },
  { id: 'intern', tok: '+1 free', fam: 'rule', rule: true, note: 'does one reaction of its own choosing on every new page. it is not always a good one', name: 'the intern', shape: 'column' },
  { id: 'stopper', tok: '{p} times 4', fam: 'places', note: 'the first reaction of a new row counts four times', name: 'stopper', shape: 'funnel', at: 'step', fx: c => (!c.cont ? M('h', 4) : null) },
  { id: 'mirror', tok: 'copies one side|across', fam: 'tool', five: true, rule: true, tool: true, note: 'copies one side across', name: 'mirror', shape: 'box' },
  { id: 'mortar', tok: '{p} times 2.5', fam: 'places', note: '3 or more places at once: that reaction counts two and a half times', name: 'mortar', shape: 'round', at: 'step', fx: c => (c.hits >= 3 ? M('h', 2.5) : null) },
  // row
  { id: 'cannula', tok: '{r} +1', fam: 'row', note: 'each reaction in a row: row +1', name: 'cannula', shape: 'column', at: 'step', fx: c => (c.cont ? A('r', 1) : null) },
  { id: 'reflux', tok: '{r} times 1.06', fam: 'row', note: '3 or more in a row: row times 1.06', name: 'reflux', shape: 'column', at: 'step', fx: c => (c.cont && c.len >= 3 ? M('r', 1.06) : null) },
  { id: 'burette', tok: '{r} +1.5', fam: 'row', note: 'first reaction on a page: row +1.5', name: 'burette', shape: 'column', at: 'step', fx: c => (c.pageStep === 0 ? A('r', 1.5) : null) },
  { id: 'clamp', tok: 'nothing changes|this part', fam: 'tool', rule: true, tool: true, note: 'nothing changes this part', name: 'clamp', shape: 'column' },
  { id: 'magnet', tok: 'pulls every gap|shut', fam: 'tool', five: true, rule: true, tool: true, whole: true, note: 'pulls every gap shut', name: 'magnet', shape: 'round' },
  { id: 'recycler', tok: '{r} +0.5', fam: 'row', note: 'back to an earlier molecule: row +0.5', name: 'recycler', shape: 'flask', at: 'step', fx: c => (c.loop ? A('r', 0.5) : null) },
  // extra
  { id: 'stirrer', tok: '{e} +0.1', fam: 'extra', note: 'each reaction: extra +0.1', name: 'stir plate', shape: 'box', at: 'step', fx: () => A('e', 0.1) },
  { id: 'cards', tok: '{e} +0.25', fam: 'extra', note: 'a reagent not yet used this round: extra +0.25', name: 'index cards', shape: 'box', at: 'step', fx: c => (c.first ? A('e', 0.25) : null) },
  { id: 'logbook', tok: '{e} +0.02', fam: 'extra', note: 'each reaction: extra +0.02 for every different reagent used', name: 'log book', shape: 'box', at: 'step', fx: c => A('e', 0.02 * c.distinct) },
  { id: 'crystal', tok: 'adds OH here|and zips', fam: 'tool', five: true, rule: true, tool: true, note: 'adds OH here and zips', name: 'seed crystal', shape: 'round' },
  { id: 'scalepan', tok: '{e} +0.5', fam: 'extra', note: 'a reaction that is not in a row: extra +0.5', name: 'brass weights', shape: 'round', at: 'step', fx: c => (!c.cont ? A('e', 0.5) : null) },
  { id: 'coldtrap', tok: '{e} +0.12', fam: 'extra', note: 'catches water that leaves: extra +0.12', name: 'cold trap', shape: 'funnel' },
  { id: 'dryer', tok: '{p} +60', fam: 'places', note: 'catches water that leaves: +60 places', name: 'drying tube', shape: 'column' },
  { id: 'sieves', tok: '{r} +0.6', fam: 'row', note: 'catches water that leaves: row +0.6', name: 'sieves', shape: 'round' },
  { id: 'hood', tok: '{e} +0.06', fam: 'extra', note: 'catches anything that leaves: extra +0.06', name: 'fume hood', shape: 'box' },
  { id: 'scrubber', tok: '{p} +50', fam: 'places', note: 'catches hydrogen that leaves: +50 places. an oxygen or a chloride: +80', name: 'scrubber', shape: 'column' },
  { id: 'bunsen', tok: 'every OH|becomes C=C', fam: 'tool', five: true, rule: true, tool: true, whole: true, note: 'every OH becomes C=C', name: 'burner', shape: 'funnel' },
  { id: 'litmus', tok: '{e} +0.08', fam: 'extra', note: 'an acid: extra +0.08. catches a chloride that leaves: extra +0.4', name: 'litmus paper', shape: 'box', at: 'step', fx: c => (c.cls === 'acid' ? A('e', 0.08) : null) },
  { id: 'stopwatch', tok: '{e} +0.35', fam: 'extra', note: 'last reaction on a page: extra +0.35', name: 'stopwatch', shape: 'box', at: 'step', fx: c => (c.pageStep === c.pageMax - 1 ? A('e', 0.35) : null) },
  { id: 'thermometer', tok: '{e} +0.3', fam: 'extra', note: 'on page 3 and later: extra +0.3', name: 'thermometer', shape: 'column', at: 'step', fx: c => (c.page >= 3 ? A('e', 0.3) : null) },
  // pieces that change a rule of the round
  { id: 'carousel', tok: '+1 reagent', fam: 'rule', rule: true, note: 'one more reagent on the first page of a round', name: 'carousel', shape: 'round' },
  { id: 'dropper', tok: '+1 use', fam: 'rule', rule: true, note: 'two more uses of every reagent', name: 'dropper', shape: 'funnel' },
  { id: 'loupe', tok: 'rare', fam: 'rule', rule: true, note: 'rare reagents twice as often', name: 'loupe', shape: 'flask' },
  { id: 'timer', tok: '+1 reaction', fam: 'rule', rule: true, note: 'a fourth reaction on every page', name: 'timer', shape: 'box' },
  // Fifteenth measure, item 1: two instruments that help the round's task, not its yield (the player sets each on a page; neither passes the task by itself).
  { id: 'counter', tok: 'this page counts|twice for the task', fam: 'tool', five: true, rule: true, tool: true, whole: true, task: true, note: 'what this page adds toward the task counts twice', name: 'tally counter', shape: 'box' },
  { id: 'condenser', tok: 'one more page|not weighed', fam: 'tool', five: true, rule: true, tool: true, whole: true, task: true, note: 'one more page this round: it counts for the task and adds no yield', name: 'condenser', shape: 'column' },
  // From the alchemist. These do things chemistry does not allow.
  { id: 'stone', tok: '{e} times 1.05', kin: 'alchemy', fam: 'extra', note: 'every reaction: extra times 1.05', name: "philosopher's stone", shape: 'round', at: 'step', fx: () => M('e', 1.05) },
  { id: 'transmute', tok: '{p} +40', kin: 'alchemy', fam: 'places', note: 'each place: +40 places', name: 'lead into gold', shape: 'box', at: 'site', fx: () => A('p', 40) },
  { id: 'regia', tok: '{e} times 1.02', kin: 'alchemy', fam: 'extra', note: 'dissolves anything that leaves: extra times 1.02', name: 'aqua regia', shape: 'flask' },
  { id: 'ouroboros', tok: '{r} unbroken', kin: 'alchemy', fam: 'row', rule: true, note: 'the row never breaks', name: 'ouroboros', shape: 'round' },
  { id: 'homunculus', tok: '{p} again', kin: 'alchemy', fam: 'places', rule: true, note: 'the last reaction on a page counts three times', name: 'homunculus, in a jar', shape: 'column' },
  { id: 'elixir', tok: '+1 page', kin: 'alchemy', fam: 'rule', rule: true, note: 'one more page in every round', name: 'elixir of life', shape: 'flask' },
  // From Brenda. Nobody asks.
  { id: 'voodoo', tok: '{p} twice', kin: 'occult', fam: 'places', note: 'three pins: the first three places a reaction changes count twice. takes a reagent use each page', name: 'voodoo doll', shape: 'round', at: 'site', fx: c => (c.hit < 3 ? M('h', 2) : null) },
  { id: 'tower', tok: '{r} times 2', kin: 'occult', fam: 'row', note: 'the first time a row would break each round, it holds and doubles', name: 'the Tower', shape: 'box', at: 'step', fx: c => (c.saved ? M('r', 2) : null) },
  { id: 'cat', tok: '{e} +0.13', kin: 'occult', fam: 'extra', note: 'crosses the path: a row that breaks leaves extra +0.13 for every reaction that was in it', name: 'black cat', shape: 'round', at: 'step', fx: c => (c.was > 0 ? A('e', 0.13 * c.was) : null) },
  { id: 'paw', tok: 'wish', kin: 'occult', fam: 'rule', rule: true, note: 'three wishes a run, one a round. a wish doubles the round and takes a reagent for good', name: "monkey's paw", shape: 'round' },
  { id: 'idol', tok: 'twice', kin: 'occult', fam: 'rule', rule: true, note: 'every other occult piece fires twice. every number to beat: times 1.22', name: 'cursed idol', shape: 'round' },
  { id: 'grimoire', tok: '{p} twice', kin: 'occult', fam: 'places', note: 'the last reaction on each page counts twice', name: 'grimoire', shape: 'box', at: 'step', fx: c => (c.pageStep === c.pageMax - 1 ? M('h', 2) : null) },
  { id: 'hourglass', tok: '+1 page', kin: 'occult', fam: 'rule', rule: true, note: 'sand from a grave: one more page. every number to beat: times 1.12', name: 'hourglass', shape: 'column' },
  { id: 'raven', tok: 'again', kin: 'occult', fam: 'rule', rule: true, note: 'nevermore: the last reagent used on a page comes back on the next', name: 'raven', shape: 'round' },
  { id: 'glory', tok: '{r} lit', kin: 'occult', fam: 'row', rule: true, note: 'hand of glory: on a broken row, equipment still fires as if the row held', name: 'hand of glory', shape: 'column' },
  { id: 'orb', tok: 'next', kin: 'occult', fam: 'rule', rule: true, note: 'crystal ball: shows which reagents the next page adds and drops', name: 'crystal ball', shape: 'round' },
  { id: 'ouija', tok: 'endless', kin: 'occult', fam: 'rule', rule: true, note: 'one reagent on every page does not run out', name: 'ouija board', shape: 'box' },
  { id: 'candle', tok: '{e} times 2', kin: 'occult', fam: 'extra', note: 'every 13th reaction of a round: extra times 2. lights hydrogen that leaves: extra +0.25', name: 'black candle', shape: 'column', at: 'step', fx: c => (c.nth % 13 === 0 ? M('e', 2) : null) },
  { id: 'goat', tok: '{e} times 1.07', kin: 'occult', fam: 'extra', note: 'every reaction: extra times 1.07. takes a reagent use each page', name: 'goat sacrifice', shape: 'round', at: 'step', fx: () => M('e', 1.07) },
  { id: 'pact', tok: 'times 3', kin: 'occult', fam: 'rule', rule: true, note: 'everything made: times 1.73. every number to beat: times 1.41', name: 'a signed pact', shape: 'box' }
];
const GEARS = {}; GEAR.forEach(q => { GEARS[q.id] = q; });
// The pieces on offer (docs/PIECES.md). The sixty were made for the game before the cascade and most add a number.
// Five have been made again for this game. Each is a thing the player uses ON the molecule, once a round, while the
// page is being lined up (rules.js, tools). Three are put at a place the player chooses; two act on all of it.
//   mirror, on a bond: one side of the bond goes; the other is copied across it, joined to its own reflection.
//   burette, on the whole molecule: every C=C becomes a C=O (a drop on each).
//   seed crystal, on a carbon: a hydrogen there becomes an OH, and the molecule zips from it at once.
//   magnet, on the whole molecule: every stretch of four or more CH2 is pulled shut to two carbons.
//   burner, on the whole molecule: every OH loses water and becomes a C=C, all at once.
// Three more still do what they say and are passive: carousel (one more reagent in the hand), dropper (one more use),
// timer (a fourth circle). RULE.five: only these eight are offered, each from the supplier given here. Off: all sixty.
const FIVE = { crystal: 0, bunsen: 0, dropper: 0, counter: 0, magnet: 1, carousel: 1, condenser: 1, mirror: 2, timer: 3 };
// The fifth piece. The clamp was the fifth and was taken out (the wood spirit homunculus does what it did). Three
// candidates are built (rules.js, tools) and RULE.fifth names the one on offer; fifthSet(id) swaps it, and
// fifthSet(null) offers none and puts the old number-adding piece of that name back.
const FIFTH = { balance: { tok: 'OH and C=O|trade places', note: 'OH and C=O trade places', whole: true },
  mortar: { tok: 'cuts this|ring bond', note: 'cuts this ring bond' },
  burette: { tok: 'every C=C|becomes C=O', note: 'every C=C becomes C=O', whole: true } }, FIFTH0 = {};
function fifthSet(id) {
  Object.keys(FIFTH0).forEach(k => { const G = GEARS[k]; Object.keys(G).forEach(f => { delete G[f]; }); Object.assign(G, FIFTH0[k]); delete FIFTH0[k]; delete FIVE[k]; });
  RULE.fifth = id && FIFTH[id] ? id : null; if (!RULE.fifth) return;
  const G = GEARS[id], F = FIFTH[id]; FIFTH0[id] = Object.assign({}, G); delete G.at; delete G.fx; Object.assign(G, { tok: F.tok, note: F.note, fam: 'tool', five: true, rule: true, tool: true, whole: !!F.whole }); FIVE[id] = 0;
}
fifthSet('burette');
// how many times a round a piece can be used on the molecule
const TOOLUSES = 1;
// Fourteenth measure, part 2 (pick AT: each instrument about 1.2 times): every instrument was measured as it is and these were set.
// toolPay: the reflex steps a piece sets off count this many times (their places and what they add to extra). passive.dropper: the uses it adds.
// carouselFirst: the carousel's extra reagent is dealt on the first page of a round only (on every page it was worth six instruments).
RULE.toolPay = { bunsen: 2, magnet: 3, crystal: 0.5, burette: 0.5 };
RULE.passive = { dropper: 2 };
RULE.carouselFirst = true;
// Fifteenth measure, item 1. bench: instruments used on the molecule or the page in one round at most (0: no limit); the pieces that are always
// at work (carousel, dropper, timer) do not count. So a round's two uses are a choice: two for the yield, or one kept for the task.
RULE.bench = 2;
RULE.five = true;
// RULE.bare: the bare game (docs/ORDER.md, layers 1 to 4): no piece is offered or held and no creature is taken
RULE.bare = false;
// choose: before a round two molecules are shown and one is taken (docs/LOOP.md). Off: three kinds of round, as before.
RULE.choose = true;
// next: the hand of the next page is drawn when this page is dealt, from the same random source, and shown (g.nextHand).
//       What is shown is what is dealt. The last page of a round shows nothing.
// lastx: what the molecule does by itself after the THIRD reaction of the line pays double: every step of the cascade
//       that runs once the last circle of the page has acted (g.lastOn). A third circle that is wasted or is the
//       bank sets nothing off and doubles nothing. LASTX.mul is the factor.
// filter: the molecules of rounds one to three are picked by shape (docs/TIER1_DEPTH.md): see feedShape.
RULE.next = true; RULE.lastx = true; RULE.filter = true;
// spec: a round is won by meeting its spec (an at-least about the molecule or the round, see the block THE SPEC); yield only pays gold and letters the words
RULE.spec = true;
// specEase: added to the aiming player's clear rate each spec is tuned to, in the bachelor's (three rounds) only. The table's N was fitted
// on the Python engine with an aiming player; the game's players clear less (RIG.md, seventh measure, part two), so a new player's
// first run is eased. 0.2 gives the novice a win in about 3 tries. The longer runs are never eased (HARNESS W2).
RULE.specEase = 0;
// the bachelor's rounds are tuned for the new player (ruling W2, tenth pass): N of the table times a scale per round, and the chain spec 'opener' (cleared by 92 percent of novices) is not offered. Measured on molecules v2 (300 runs, scales 0.15, 0.36, 0.7): novice clears 72, 58, 30 percent.
RULE.foldPay2 = true;   // an across step is paid as two chain steps: median-player yield in rounds 4 to 9 (mean log total) 11.249 with, 11.197 without the fold, 10.915 with the fold and one step each (60 runs)
RULE.specScale = { 1: 0.15, 2: 0.36, 3: 0.45 }; RULE.specBan = ['opener'];
// The opening (ruling AP 3, RIG.md twelfth): round 3 of the bachelor's at 0.45 (was 0.7); the specs a beginner seldom clears are not offered in rounds 1 and 2 of
// the bachelor's (specBanBy); and a first game deals more molecules with N, S or Cl (hetCurveB). Measured on 1,000 runs: the novice clears 81, 68, 49 and wins 26 in 100.
RULE.specBanBy = { 1: ['cut_down', 'double_bonds', 'unsaturation', 'lean_turns'], 2: ['end_CO', 'off_hydrogen'] };
RULE.hetCurveB = [0.35, 0.40, 0.45];
// specRate: the bachelor's N by the novice's measured clear rate (t), within tol, and only specs the median player does not clear more than gap above the novice. Off: the scale above.
RULE.specRate = null;
// hetCurve: see runBriefs. The share rises every round (ruling AF2).
RULE.hetCurve = [0.15, 0.22, 0.30, 0.40, 0.55, 0.70, 0.80, 0.90, 0.95];
// clEarly (ruling AR, RIG.md thirteenth, part 4): chlorine has something to do in the first rounds. In rounds 1 to 3 each dealt molecule is, with this
// chance, one of the round's chlorine molecules (FEED_CL: a Cl three to five carbons from where hydrate, grow, thiolene or ritter put an OH, SH or
// NH2, so the reflex `close` shuts a ring and HCl leaves; four of the six carry two Cl). Decided before the hetCurve draw. null: off.
RULE.clEarly = [0.32, 0.32, 0.32];
// RULE.elLate (sixteenth, item 3; ruling AF2: "Rarer elements should become more common as the rounds get deeper"): in the rounds named, each
// dealt molecule is first, with the chance given, one of the round's own molecules that hold that element (chlorine tried first, then sulfur,
// then nitrogen). It lifts what hetCurve alone deals: chlorine fell to 1 molecule in 15 in rounds 4 and 5, and sulfur was 1 in 8. null: off.
RULE.elLate = { 4: { Cl: 0.29, S: 0.08, N: 0.17 }, 5: { Cl: 0.31, S: 0.10, N: 0.02 }, 6: { Cl: 0.26, S: 0.09, N: 0.14 }, 7: { Cl: 0.23, S: 0.11, N: 0.05 }, 8: { Cl: 0.10, S: 0.08 }, 9: { Cl: 0.07, S: 0.04, N: 0.08 } };
const EL_RE = { Cl: /Cl/, S: /S|s/, N: /N|n/ };
const FEED_CL = {1: ['C=CC(Cl)C(O)(CCCl)CCC(C)=O', 'C=C(C)CC(Cl)C(Cl)C(=O)CCC=O', 'C=CCC1C(=O)C(Cl)C=CC1Cl', 'C=CCCC(C(=O)CCCl)C(Cl)C=O', 'CCCCC(Cl)C=CC=CC=O', 'C=CCCC(Cl)C(O)CC=O'], 2: ['CC(=O)CCC=C(CCl)C(Cl)CC=C(C)C', 'C=CCCC(Cl)C(=O)C(Cl)CCC=O', 'C=CC1=CC(C(Cl)C(=O)C(Cl)CO)=CC=C1', 'C=CCCC1C(=O)C(CC=O)C(Cl)C1Cl', 'O=CC=CC(O)CCCCCCl', 'CC(=O)CC(O)C=CC1CSCCC1Cl'], 3: ['C=CC(CC1(Cl)COC(C)C1)C(Cl)C=O', 'O=CC=CC(O)C(Cl)CCCC(Cl)CCCO', 'CC(C)=CCCC(Cl)C(=O)C(Cl)CCC=O', 'C=CCCC1CC(Cl)(C(O)C(Cl)C(C)N)C1=O', 'C=CCCCCCC(Cl)CCC=CC=O', 'NC1CC2CC1CC2(O)C=CC(=O)CCl']};
// needPar (ruling AP 1, RIG.md twelfth): in the runs past the bachelor's a round is cleared only when the spec is met AND the yield
// passes this share of the number to beat, by round (the last entry stands for every later round). null: the spec alone clears a
// round. needParB: the same for the bachelor's. P.needYield(run) is the yield a round must reach (0: none), for the page.
RULE.needPar = [0.86, 0.95, 0.88, 1.17, 1.60, 1.03, 1.12, 1.26, 1.16, 0.98, 0.77, 0.52]; RULE.needParB = null;
// aimPar: the simulated players count the yield still missing to that mark as part of what they play for (not in a proof)
RULE.aimPar = true;
// homAim: the simulated players weigh the creature's tap when they choose a line (homPeek)
RULE.homAim = true;
// needParBy (ruling AR, RIG.md thirteenth, part 1): the pass marks by run length; where a length is listed it replaces needPar. The first
// rounds are gentle (the casual player clears round 1 about 80 times in 100) and the marks rise so that the last third of each length is the
// wall. Fitted on the simulator (docs/tools_chem/sweep_career.py fit) and confirmed on other deals.
// FLAT (fourteenth measure, part 1): these are the square roots of the thirteenth's marks (0.13, 0.28, 0.15, 0.40, 0.70, 0.53, 2.35, 4.15, 4.75; master 1.6, 1.2;
// postdoc 1.46, 1.21, 0.84), so the same rounds clear.
RULE.needParBy = { master: [0.36, 0.53, 0.39, 0.65, 1.16, 1.09], doctorate: [0.36, 0.53, 0.39, 0.65, 0.83, 0.70, 1.48, 2.04, 2.18], postdoc: [0.36, 0.53, 0.39, 0.65, 0.83, 0.70, 1.48, 2.04, 2.18, 1.21, 1.10, 0.92] };      // sixteenth, item 3: rounds 4 to 9 refitted under RULE.elLate (were 0.63, 0.84, 0.73, 1.53; rounds 8 and 9 kept at 2.04 and 2.18; master was 0.63, 1.26, 1.10)
// specBanByLong: the specs a casual player seldom clears are not set in rounds 1 and 2 of the long runs either (as specBanBy in the bachelor's)
RULE.specBanByLong = { 1: ['cut_down', 'double_bonds', 'unsaturation', 'lean_turns'], 2: ['end_CO', 'off_hydrogen'] };
// pairFrom: two specs from this round on. specShiftLong: { round: change } to the spec's target share in the runs past the bachelor's.
// specScaleLong: { round: N of the table times this } in the runs past the bachelor's (round 2's table N is too large on molecules v2).
RULE.pairFrom = 6; RULE.specShiftLong = null; RULE.specScaleLong = { 1: 0.3, 2: 0.35, 3: 0.7 };   // thirteenth: rounds 1 to 3 gentler (were 0.7, 0.5, 1)
// THE SIGN (ruling AP 4; docs/RIG.md, "The sign"). RULE.prestige on: when SIGN.share of everything is unlocked the player may take the yellow
// sign (signCan, signTake). The collection starts over; every yield is lifted by SIGN.lift for each sign taken, for good (added, not
// compounded: five signs are 2 times, not 2.5); meta.sign counts the signs taken and is what the page, the notes and the music read.
// What rises with it: the number to beat goes up SIGN.bar times for each sign. Switched off (SIGN.takes is empty; SIGN.takesAll is the measured list, RIG.md twelfth, part 4): each sign may also take one thing for good (SIGN.takes[k - 1] at
// sign k: 'pair4' two specs from round 4, 'tasks' every spec N a quarter bigger, 'pair1' two specs from round 1, 'uses' one use fewer of every
// reagent, 'hand' four dealt, not five). After SIGN.laps signs it cannot be taken again.
// Thirteenth (ruling AR): three laps. The number to beat (and with it the pass mark) rises 1.15 times a sign, so a start with nothing is about as
// hard at every lap (numbers in RIG.md, thirteenth, part 2).
// SIGN.kept and SIGN.reset say in the profile's own keys what is kept aside and what starts over, for the page.
RULE.prestige = true;
const SIGN = { lift: 0.2, bar: 1.15, share: 0.9, laps: 3, tasks: 1.25, takes: [], takesAll: ['pair4', 'tasks', 'uses', 'pair1', 'hand'], keep: ['sign', 'signLog', 'found', 'taught', 'coined', 'countersAll', 'mols'],
  kept: { sign: 'the signs taken', signLog: 'when each was taken', found: 'the catalog of compounds made', taught: 'what the first game taught', coined: 'names given', countersAll: 'the lifetime counts, set aside' },
  reset: ['reagents', 'reflexes', 'motifs', 'instruments', 'homunculi', 'sigils', 'notebooks', 'inspections', 'run lengths opened', 'the ladder (meta.ladder, meta.deep)', 'the counts that earn findings (meta.counters)', 'jars'] };
const signOf = x => { if (!RULE.prestige || !x) return 0; const v = x.sign != null ? x.sign : (x.meta && x.meta.sign); return Math.max(0, Math.min(SIGN.laps, v | 0)); };
const signLift = x => 1 + SIGN.lift * signOf(x), signBar = x => Math.pow(SIGN.bar, signOf(x));
const signHas = (x, what) => SIGN.takes.slice(0, signOf(x)).includes(what);
const signCan = (meta, owned, total) => !!RULE.prestige && signOf(meta) < SIGN.laps && total > 0 && owned / total >= SIGN.share;
// takes the sign: a new profile that keeps only SIGN.keep (the count of signs, the page's catalog `found`, what was taught and coined, the lifetime counts as countersAll; the notes
// read) and starts everything else again; null when it cannot be taken. signLog gets one entry a sign: { at, owned, total }.
function signTake(meta, owned, total, at) {
  if (!signCan(meta, owned, total)) return null; const m = {}; SIGN.keep.forEach(k => { if (meta && meta[k] != null) m[k] = meta[k]; });
  // the lifetime counts go on under countersAll (added up over every sign); counters starts at zero, so every finding has to be earned again
  const all = Object.assign({}, m.countersAll || {}); Object.keys((meta && meta.counters) || {}).forEach(k => { if (typeof meta.counters[k] === 'number') all[k] = k.indexOf('max_') === 0 ? Math.max(all[k] || 0, meta.counters[k]) : (all[k] || 0) + meta.counters[k]; }); m.countersAll = all; m.counters = countersNew();
  m.sign = signOf(meta) + 1; m.signLog = (m.signLog || []).concat([{ at: at || 0, owned, total }]); return m;
}
// what the page, the notes and the music read: the level, the lift, how far the number to beat has risen, what the sign has taken, what it takes next
// owned and total (what the page counts as unlocked and as everything) may be left out; with them `can` says whether the sign can be taken now and `need` how many things that takes
const signState = (meta, owned, total) => { const n = signOf(meta); return { on: !!RULE.prestige, level: n, laps: SIGN.laps, lift: signLift(meta), bar: signBar(meta), liftNext: n < SIGN.laps ? 1 + SIGN.lift * (n + 1) : null, barNext: n < SIGN.laps ? Math.pow(SIGN.bar, n + 1) : null, taken: SIGN.takes.slice(0, n), next: (n < SIGN.laps && SIGN.takes[n]) || null, last: n >= SIGN.laps,
  can: total > 0 ? signCan(meta, owned, total) : false, owned: owned || 0, total: total || 0, need: total > 0 ? Math.ceil(SIGN.share * total) : null, share: SIGN.share, kept: Object.assign({}, SIGN.kept), reset: SIGN.reset.slice(), log: ((meta && meta.signLog) || []).slice() }; };
const LASTX = { mul: 2 };
// Tiers (docs/LOOP.md): a run is three rounds, then six, then nine. Tier 1 is the bare game: the six starting
// reactions, no helper, no creature, nothing new offered between rounds. (run.tier is the supplier index, an older
// thing: the tier of a run is run.tierNo, and run.span is how many rounds it has.)
const TIERS = { 1: { rounds: 3, bare: true, helpers: false, creatures: false }, 2: { rounds: 6, bare: false, helpers: true, creatures: false }, 3: { rounds: 9, bare: false, helpers: true, creatures: true }, 4: { rounds: 12, bare: false, helpers: true, creatures: true } };
const tierRule = n => TIERS[n] || TIERS[3];
// The three lengths of a run (docs/NAMES.md): bachelor's (3 rounds), master's (6), doctorate (9). A run starts at the length the
// player has reached (opts.reach, the highest length opened, 1 to 3; or opts.length by name; or opts.tierNo as before). Winning a
// bachelor's opens master's, winning a master's opens doctorate (reachAfter).
const LENGTHS = [{ name: 'bachelor', rounds: 3, tierNo: 1 }, { name: 'master', rounds: 6, tierNo: 2 }, { name: 'doctorate', rounds: 9, tierNo: 3 }];
// RULE.postdoc (off): a fourth length of twelve rounds, opened by winning a doctorate. Rounds 10 to 12 deal round nine's molecules and specs for now; Par goes on by PAR.after.
const POSTDOC = { name: 'postdoc', rounds: 12, tierNo: 4 };
const lengthOf = n => ((n | 0) === 4 && RULE.postdoc ? POSTDOC : LENGTHS[Math.max(1, Math.min(3, n | 0)) - 1]);
function runTierNo(opts) { if (!opts) return 0; if (TIERS[opts.tierNo] && (opts.tierNo < 4 || RULE.postdoc)) return opts.tierNo; if (opts.length) { if (opts.length === 'postdoc' && RULE.postdoc) return 4; const i = LENGTHS.findIndex(l => l.name === opts.length); if (i >= 0) return i + 1; } if (opts.reach) return Math.max(1, Math.min(RULE.postdoc ? 4 : 3, opts.reach | 0)); return 0; }
// a run or a round (g) may be asked
const runOf = x => (x && x.runRef ? x.runRef : x);
const runLast = x => { const run = runOf(x); return (run && run.span) || 9; };
const runWon = x => { const run = runOf(x); return !!run && (run.beaten || 0) >= runLast(run); };
const bareRun = run => !!RULE.bare || !!(run && run.bare);
// The reaction rules read RX.MODE, which is one global. It is set from RULE and from the run every time rules are
// read for a run (a round begun, the pair read, the picks dealt), so no run plays under what the run before it left.
// The bare game has no jar to fill, so oxidize gives off no carbon dioxide there.
// THE NINE SIGILS (ruling AN: a sigil breaks or changes ONE rule; docs/RIG.md fourteenth, "The nine sigils in the game"; tested in the simulator
// as docs/tools_chem/sigil2_rules.py). A run holds them in run.sigils (runNew opts.sigils); RULE.sigil[id] = true switches one on for every run;
// the address ?sigil=id,id holds them for testing. does: what it does, one plain line. how: how it is unlocked for the career (counter and n are
// the lifetime count of countersUpdate that earns it). where: 'engine' (rules.js reads MODE.sig) or 'round' (read here by sigOn).
const SIGILS = {
  phlogiston: { name: 'Phlogiston', where: 'engine', does: 'Phlogiston draws hydrogen. Oxidize also takes two hydrogens beside every C=O and leaves a C=C.', how: 'Oxidize acts 150 times.', counter: 'oxidize_acted', n: 150 },
  clepsydra: { name: 'Clepsydra', where: 'round', does: 'Clepsydra slows the clock. Four pages a round.', how: 'Play 100 rounds.', counter: 'rounds', n: 100 },
  via_humida: { name: 'Via Humida', where: 'engine', does: 'Via Humida opens the wet way. Rings close through O, N or S as through carbon.', how: 'Fire hydrate 60 times.', counter: 'hydrate_fired', n: 60 },
  solve: { name: 'Solve', where: 'engine', does: 'Solve loosens. Dry, weld and ring have no limit. Once each across the fold.', how: 'Set off 600 reflex steps.', counter: 'reflex_steps', n: 600 },
  aqua_permanens: { name: 'Aqua Permanens', where: 'engine', does: 'Aqua Permanens stills. No water leaves.', how: 'Drive off 5 or more waters on a page, 30 times.', counter: 'water5_pages', n: 30 },
  tetractys: { name: 'Tetractys', where: 'round', does: 'Tetractys makes four. Four reagents a page. The fourth: x3.', doesPlain: 'Every page takes four reagents, not three. The last reagent of a page pays double, and that is now the fourth.', how: 'Line up one reagent in all three circles, 5 times.', counter: 'one_reagent_lines', n: 5 },
  respiratio: { name: 'Respiratio', where: 'round', does: 'Respiratio breathes. The limits on dry, weld and ring start again after every reagent.', how: 'Set off dry 100 times.', counter: 'dry_steps', n: 100 },
  gemini: { name: 'Gemini', where: 'round', does: 'Gemini doubles. Anything done to a C=C or C=O counts again. x2.', how: 'Fire dehydrate 50 times.', counter: 'dehydrate_fired', n: 50 },
  sulphurs_mask: { name: "Sulphur's Mask", where: 'engine', does: 'Sulphur\'s Mask disguises. Oxygen closes rings as sulfur does. The first two: x2.', doesPlain: 'Oxygen behaves as sulfur: an OH closes its ring before anything else happens and as often as it can on a page, and two OH that face each other across the fold join, oxygen to oxygen.', how: 'Put on 25 SH.', counter: 'sh_made', n: 25 }
};
RULE.sigil = {};
const SIGIL_Q = (() => { try { const m = typeof location !== 'undefined' && /[?&]sigil=([^&#]+)/.exec(location.search || ''); return m ? decodeURIComponent(m[1]).split(',').filter(id => SIGILS[id]) : []; } catch (e) { return []; } })();
const sigilsOf = run => Object.keys(SIGILS).filter(id => RULE.sigil[id] || SIGIL_Q.includes(id) || !!(run && run.sigils && run.sigils.includes(id)));
const sigSync = run => { const o = {}; sigilsOf(run).forEach(id => { o[id] = true; }); RX.MODE.sig = o; return o; };
const sigOn = id => !!(RX.MODE.sig && RX.MODE.sig[id]);
// THE STRONGER FORMS (seventeenth: Sulphur's Mask was worth 1.00 to a run and Tetractys 1.07, too little to feel). Each still bends its one rule:
//   sulphurs_mask 'mask_r2'  as before, and the first two rings an OH closes on a page each count as two steps of the chain (worth 1.17)
//   tetractys     'tet_x3'   as before, and the fourth reagent pays three times, not twice (worth 1.20)
// RULE.sigilStrong = null gives the plain forms back (SIGILS[id].doesPlain is their line). The simulator reads this line (sweep_sig17.py).
RULE.sigilStrong = { sulphurs_mask: 'mask_r2', tetractys: 'tet_x3' };
const sigStrong = id => (sigOn(id) && RULE.sigilStrong && RULE.sigilStrong[id]) || null;
// HOW SIGILS ARE GOT (ruling AW: "I'm towards buying them since it's alchemy"; up to three at work at once; docs/RIG.md sixteenth, item 1).
// Three ways behind one switch, all through the same two calls, so the page can show each:
//   RULE.sigilWay 'buy'    the catalog between rounds shows SIGIL_GET.shown sigils the profile owns, each with a price in gold (SIGIL_GET.price,
//                          set from the sigil's measured worth, plus SIGIL_GET.step for every sigil the run already holds); any shown one the
//                          run can pay for may be bought, from the visit after round one on.
//                 'start'  before rounds SIGIL_GET.startRounds (1, 4, 7) the player takes one of all the sigils owned, free.
//                 'offer'  after rounds SIGIL_GET.offerRounds (2, 4, 6) the player is offered SIGIL_GET.offerN owned ones drawn at random and
//                          takes one, free.
//                 null     off: a run holds only what runNew was given (opts.sigils).
//   RULE.sigilCap  how many a run may hold (3).  RULE.goldClear: gold paid for a round cleared, whatever its yield (0: as the game was).
// sigilVisit(run, R, next) gives { way, next, cap, held, room, gold, offers: [{ id, name, does, price, can }] } for the round about to be played
// (next; worked out from the run when left out) and keeps what was drawn in run.sigShelf, so asking twice shows the same.  sigilGet(run, id)
// takes one of the offers (pays the gold), true when it did.  A run with no profile (run.sigilsOwned null) is offered all nine.  Sigils are not
// offered in the bare three-round run.  What was got is logged in run.sigLog ({ round, id, price, way }).
const SIGIL_GET = { price: { phlogiston: 7, solve: 7, gemini: 5, via_humida: 3, clepsydra: 3, respiratio: 2, tetractys: 3, sulphurs_mask: 3, aqua_permanens: 1 }, step: 2, shown: 2, startRounds: [1, 4, 7], offerRounds: [2, 4, 6], offerN: 3, goldClear: 1, pay: { aqua_permanens: 8 }, payTry: [4, 6, 8] };
// Owner's picks of 13 November (HARNESS AY): bought with gold; one gold for each cleared round (goldClear 1); Aqua Permanens PAYS gold when taken
// (pay: it costs nothing and puts that much in the tin; RULE.aquaPay = 0 takes the payment off, payTry are the three sizes measured, RIG.md seventeenth).
RULE.extraOffer = 2; RULE.termsGate = true;      // the page still holds the terms back until two runs have each cleared six rounds (its meta.stage); the book says so while this is on
RULE.dealFlat = true; RULE.ammoniaLimits = true; RULE.sigilWay = 'buy'; RULE.sigilCap = 3; RULE.goldClear = SIGIL_GET.goldClear; RULE.aquaPay = SIGIL_GET.pay.aqua_permanens; RULE.aquaRounds = 2;      // aquaRounds n (owner's pick, 13 November: two rounds, 8 gold, then gone; 0 keeps it for good): Aqua Permanens works for n rounds and is then gone, its place free again; no payment makes it worth taking while it stays for good
const sigilPays = id => (RULE.sigilWay === 'buy' && id === 'aqua_permanens' ? Math.max(0, RULE.aquaPay | 0) : 0);      // gold the sigil pays when taken (0 for every other)
const sigilRoom = run => Math.max(0, (RULE.sigilCap || 3) - ((run && run.sigils) || []).length);
const sigilPool = run => (RULE.unlockAll || !run.sigilsOwned ? Object.keys(SIGILS) : run.sigilsOwned.filter(id => SIGILS[id])).filter(id => !(run.sigils || []).includes(id) && !(run.sigGone || []).includes(id));
const sigilPrice = (run, id) => (RULE.sigilWay === 'buy' && !sigilPays(id) ? SIGIL_GET.price[id] + SIGIL_GET.step * ((run.sigils || []).length) : 0);
function sigilVisit(run, R, next) {
  const way = RULE.sigilWay || null, nx = next || (run.endedRound === (run.round || 1) ? (run.round || 1) + 1 : (run.round || 1)), rnd = R || rand;
  const out = { way, next: nx, cap: RULE.sigilCap || 3, held: (run.sigils || []).slice(), room: sigilRoom(run), gold: run.coins || 0, offers: [] };
  if (!way || run.six || bareRun(run) || run.over || !out.room || nx > runLast(run)) { run.sigShelf = null; return out; }
  let sh = run.sigShelf;
  if (!sh || sh.next !== nx || sh.way !== way) {
    const pool = sigilPool(run); let ids = [];
    const draw = n => { const p = pool.slice(), o = []; while (o.length < n && p.length) o.push(p.splice(Math.floor(rnd() * p.length), 1)[0]); return o; };
    if (way === 'buy' && nx > 1) ids = draw(SIGIL_GET.shown);
    else if (way === 'start' && SIGIL_GET.startRounds.includes(nx)) ids = pool;
    else if (way === 'offer' && SIGIL_GET.offerRounds.includes(nx - 1)) ids = draw(SIGIL_GET.offerN);
    sh = run.sigShelf = { next: nx, way, ids, taken: false, asked: !!next };
  }
  const open = way === 'buy' || !sh.taken;
  out.offers = sh.ids.filter(id => !(run.sigils || []).includes(id)).map(id => { const price = sigilPrice(run, id); return { id, name: SIGILS[id].name, does: thingOf('sigil', id).does, price, pays: sigilPays(id), can: open && (run.coins || 0) >= price }; });
  if (!open) out.offers = [];
  return out;
}
function sigilGet(run, id) {
  const sh = run.sigShelf; if (!sh || run.over || !sh.ids.includes(id) || !SIGILS[id] || !sigilRoom(run) || (run.sigils || []).includes(id) || (sh.way !== 'buy' && sh.taken)) return false;
  // the shelf must be the one of the round about to be played, under the way now in force (an offer left untaken does not keep)
  if (sh.way !== RULE.sigilWay || (!sh.asked && sh.next !== (run.endedRound === (run.round || 1) ? (run.round || 1) + 1 : (run.round || 1)))) return false;      // asked: the page named the round itself
  const price = sigilPrice(run, id); if (!(price >= 0) || (run.coins || 0) < price) return false;
  const pays = sigilPays(id); run.coins = (run.coins || 0) - price + pays; run.sigils = (run.sigils || []).concat([id]); sh.taken = true; sh.ids = sh.ids.filter(x => x !== id);
  (run.sigLog = run.sigLog || []).push({ round: sh.next, id, price, pays, way: sh.way }); sigSync(run); return true;
}
// what Gemini doubles: the reagents and reflexes that work on a C=C or C=O (sweep_core.DBL_REAGENTS, DBL_REFLEX)
const GEM_REAGENT = ['hydrate', 'bh3', 'allyl', 'nabh4', 'hwe', 'dihydroxylation', 'ozonolysis', 'ritter', 'thiolene', 'cyanohydrin', 'hydroformylation', 'epoxidation', 'h2'], GEM_REFLEX = ['ring', 'dry', 'flip', 'shift', 'tuck', 'weld', 'snap', 'knit', 'cap', 'stitch'];
const ENGID = { pcc: 'oxidize', nabh4: 'reduce', bh3: 'hydroborate', allyl: 'grow' };
const modeSync = run => { sigSync(run); RX.MODE.weld = RULE.weld || 'ol'; RX.MODE.co2 = !!RULE.co2 && !bareRun(run); RX.MODE.eng = RULE.engine !== false; RX.MODE.oxNarrow = RULE.oxNarrow || null; RX.MODE.oxNoCleave = !!RULE.oxNoCleave; RX.MODE.hydrateKetone = !!RULE.hydrateKetone; };
// Do the three uses of a reaction ever run out? Measured for tier one (docs/RIG.md, fifth measure): never for a player
// who reads the page, outside a scarce assay; but a player placing at random meets a reaction with no use left on a
// third of pages, because rounds one to three deal the same four reactions on every page. So the uses do bind for
// the player the first run is for, and the page should keep the use marks: this says true.
// usesFree: in the three-round bare run no reaction runs out of uses, so the page hides the use marks there.
RULE.usesFree = true;
const usesFreeOn = run => !!RULE.usesFree && !!run && run.tierNo === 1;
const usesBind = run => !usesFreeOn(run);
const allFree = () => new Proxy({}, { get: (t, k) => !(RULE.usesBy && RULE.usesBy[k] != null), set: () => true });
// the round last begun, so the page can swap two queued circles by index alone
let cur0 = null;
const swapQueue = (i, j) => (cur0 ? queueSwap(cur0, i, j) : false);

// offer: the reagents on the page for this order; the rest of the rack sits the order out
// keep: index of the oxygen that is marked, or null. gear: equipment ids, left to right
function begin(feed, relaxed, offer, keep, gear) {
  const run = RUN.newRun(7, {}); run.gear = [];
  RUN.beginOrder(run); RUN.chooseFeed(run, 0);
  const cur = run.cur, m = feed && feed.atoms ? RX.cloneMap(feed).model : relaxed ? AA.Model.fromSmilesRelaxed(feed, 4) : RX.fromSmiles(feed), left = {};
  m.center();
  if (keep != null && m.atoms[keep] && m.atoms[keep].el === 'O') m.atoms[keep].keep = true;
  cur.feed = feed; cur.feedSig = RX.sigOf(m); cur.seen = new Set([cur.feedSig]); cur.spec = null; cur.keep = null; cur.cond = null; cur.stepsMax = 99;
  cur.yield = 0; cur.batch = 1; cur.path = []; cur.fresh = new Set();
  run.deck.forEach(id => { left[id] = (left[id] || 0) + 1; });
  return { run, cur, m, left, all: Object.keys(left), kinds: offer || Object.keys(left), keep: keep == null ? null : keep, gear: (gear || []).filter(id => GEARS[id]), spoiled: false, trail: [], dead: false };
}
// runs one reagent on a copy of the molecule
function tryOne(g, m, id) {
  const cur = g.cur, cm = RX.cloneMap(m), keep = cur.fresh, fresh = new Set();
  keep.forEach(a => { const c = cm.map.get(a); if (c) fresh.add(c); });
  cur.fresh = fresh;
  const r = RUN.react(g.run, cm.model, id);
  cur.fresh = keep;
  return { model: cm.model, r, map: cm.map };
}
// reactions allowed on a page
const stepsOf = g => (sigOn('tetractys') ? 1 : 0) + DIAL.steps + (RULE.stepsMore || 0) + (g.syn && g.gear.includes('timer') ? 1 : 0) + (g.syn && g.gear.includes('coffee') ? ((g.page || 1) <= 2 ? 1 : -1) : 0) + (g.termSteps || 0) + (g.more || 0);
function options(g, free) {
  const cur = g.cur, out = {}, self = free && SELFMODE.auto ? (g.self || []).filter(id => !g.kinds.includes(id)) : [];
  if (!free && (g.syn ? g.pageSteps : g.trail.length) >= stepsOf(g)) return out;
  const size = RULE.atoms ? heavy(g.m) : 0, back = (RULE.loopsAll || g.gear.includes('recycler')) && (!RULE.loops || (g.loopsCont || 0) < RULE.loops);
  g.kinds.concat(self).forEach(id => {
    const own = self.includes(id); if (!own && !(g.left[id] > 0) && !(g.free && g.free[id])) return;
    const sites = RX.CARDS[id].find(g.m); if (!sites.length) return;
    const t = tryOne(g, g.m, id), r = t.r; if (!r.hits && !r.spoiled) return;
    // past the size limit a molecule can still change, but it cannot grow
    if (RULE.atoms) { const n = heavy(t.model); if (n > RULE.atoms && n > size) return; }
    const loop = cur.seen.has(r.sig), spoil = r.spoiled > 0;
    out[id] = { id, model: t.model, map: t.map, r, loop, spoil, self: own, cont: r.hits > 0 && (r.hot || own) && cur.path.length > 0 && (!loop || back), atoms: sites.reduce((a, s) => a.concat(s.atoms), []) };
  });
  return out;
}
// What the molecule can do to itself as it stands, for the player to set going with a twist. No reagent is held or used.
const SELFMODE = { auto: false };
function selfOptions(g) {
  const out = []; if (g.over) return out;
  (g.self || []).forEach(id => { const sites = RX.CARDS[id].find(g.m); if (!sites.length) return; const t = tryOne(g, g.m, id), r = t.r; if (!r.hits) return; if (!g.kinds.some(k => RX.CARDS[k].find(t.model).length)) return;
    out.push({ id, model: t.model, map: t.map, r, loop: g.cur.seen.has(r.sig), spoil: false, self: true, cont: g.cur.path.length > 0, atoms: sites.reduce((a, q) => a.concat(q.atoms), []) }); });
  return out;
}
// scores one reaction: each site, then the chain, then the equipment that works once a step. Every change is
// returned as an event so the page can replay it. The caller updates what the order has seen and used afterwards.
// a piece of equipment at level n: what it adds is n times as much, and what it multiplies by stands n times as far above 1
const lvl = (g, q, o) => { const n = (g.gearLv && g.gearLv[q]) || 1; return !o || n === 1 ? o : o[0] === 'x' ? ['x', 1 + (o[1] - 1) * n] : [o[0], o[1] * n]; };
function scoreStep(g, id, r, dry) {
  const cur = g.cur, ev = [], loop = cur.seen.has(r.sig), first = !cur.used.includes(id);
  const put = (src, o) => { if (!o) return; if (o[0] === 'y') cur.yield += o[1]; else if (o[0] === 'b') cur.batch += o[1]; else cur.batch *= o[1]; ev.push({ src, kind: o[0], val: o[1], yield: cur.yield, batch: cur.batch }); };
  for (let i = 0; i < r.hits; i++) {
    RUN.scoreSite(g.run, id, dry).forEach(e => ev.push(e));
    g.gear.forEach(q => { if (GEARS[q].site) put(q, lvl(g, q, GEARS[q].site({ hits: r.hits }))); });
  }
  if (!r.hits) return ev;
  put('step', ['b', 1]);
  // with the recycler a molecule seen before still continues the run
  const info = loop && g.gear.includes('recycler') ? Object.assign({}, r, { sig: r.sig + '#' + cur.step }) : r;
  const link = RUN.playEnd(g.run, id, r.hits, dry, info); link.forEach(e => ev.push(e));
  const cont = link.some(e => e.src === 'chain'), c = { hits: r.hits, cont, len: cur.path.length, loop, leaves: !!LEAVES[id], first, nth: cur.step + 1, page: g.page || 1, pageStep: g.pageSteps || 0, pageMax: stepsOf(g), cls: RX.CARDS[id].cls, same: cur.used[cur.used.length - 1] === id, distinct: new Set(cur.used.concat(id)).size };
  g.gear.forEach(q => { if (GEARS[q].step) put(q, lvl(g, q, GEARS[q].step(c))); });
  return ev;
}
// what delivery adds: equipment that works at the end, then the marked group
function scoreEnd(g, steps, spoiled) {
  const cur = g.cur, ev = [], has = g.keep != null, c = { unused: Math.max(0, DIAL.steps - steps), kept: has && !spoiled, lost: has && spoiled };
  const put = (src, o) => { if (!o) return; if (o[0] === 'b') cur.batch += o[1]; else cur.batch *= o[1]; ev.push({ src, kind: o[0], val: o[1], yield: cur.yield, batch: cur.batch }); };
  if (!steps) return ev;
  g.gear.forEach(q => { if (GEARS[q].end) put(q, GEARS[q].end(c)); });
  if (c.kept) put('keep', ['x', DIAL.keep]);
  return ev;
}
function take(g, o) {
  const cur = g.cur;
  g.left[o.id]--; g.m = o.model;
  if (o.spoil) g.spoiled = true;
  const ev = scoreStep(g, o.id, o.r, false);
  cur.fresh = new Set(o.r.made); cur.seen.add(o.r.sig); cur.step++; cur.used.push(o.id);
  g.trail.push({ id: o.id, hits: o.r.hits, cont: o.cont, ev, spoil: o.spoil });
}
const deliver = g => scoreEnd(g, g.trail.length, g.spoiled);
// every path through the order, each scored as if delivered there
function survey(feed, depth, offer, keep, gear) {
  const g = begin(feed, false, offer, keep, gear), cur = g.cur, res = []; let nodes = 0;
  (function dfs(m, path, spoiled) {
    const y = cur.yield, b = cur.batch; scoreEnd(g, path.length, spoiled);
    res.push({ path: path.join(' '), spoiled, score: RUN.scoreOf(cur) }); cur.yield = y; cur.batch = b;
    if (path.length >= (depth || DIAL.steps) || nodes > 30000) return;
    g.kinds.forEach(id => {
      if (!g.left[id] || !RX.CARDS[id].find(m).length) return;
      const s = { y: cur.yield, b: cur.batch, path: cur.path, fresh: cur.fresh, seen: cur.seen, step: cur.step, used: cur.used.length };
      const t = tryOne(g, m, id), r = t.r;
      if (r.hits || r.spoiled) {
        nodes++;
        scoreStep(g, id, r, true);
        cur.fresh = new Set(r.made); cur.seen = new Set(s.seen).add(r.sig); cur.step++; cur.used.push(id); g.left[id]--; path.push(id);
        dfs(t.model, path, spoiled || r.spoiled > 0);
        path.pop(); g.left[id]++;
      }
      cur.yield = s.y; cur.batch = s.b; cur.path = s.path; cur.fresh = s.fresh; cur.seen = s.seen; cur.step = s.step; cur.used.length = s.used;
    });
  })(g.m, [], false);
  res.sort((a, b) => b.score - a.score);
  const best = res[0].score, near = res.filter(r => r.score >= best * 0.9), firsts = {}, alt = res.find(r => r.spoiled !== res[0].spoiled);
  res.forEach(r => { const f = r.path.split(' ')[0]; if (f && !(firsts[f] >= r.score)) firsts[f] = r.score; });
  return { feed, paths: res.length, best, bestPath: res[0].path, bestSpoils: res[0].spoiled, otherPct: alt && best ? Math.round(100 * alt.score / best) : 0, near: near.length, nearFirsts: Array.from(new Set(near.map(r => r.path.split(' ')[0]))),
    firsts: Object.keys(firsts).map(f => ({ id: f, pct: best ? Math.round(100 * firsts[f] / best) : 0 })).sort((a, b) => b.pct - a.pct) };
}
// the oxygens of a feedstock that an order can mark
const keeps = feed => RX.keepable(RX.fromSmiles(feed)).map(k => k.i);
// the reagents that can open on this feedstock without losing the marked group
function safe(feed, keep) { const g = begin(feed, false, null, keep); return g.all.filter(id => { if (!RX.CARDS[id].find(g.m).length) return false; const r = tryOne(g, g.m, id).r; return r.hits && !r.spoiled; }); }
// a random order: a marked group and n reagents, at least two of which can open safely
function deal(feed, n, rnd) {
  const R = rnd || rand, ks = keeps(feed), g = begin(feed, false);
  for (let t = 0; t < 60; t++) {
    const keep = ks.length ? ks[Math.floor(R() * ks.length)] : null, ok = safe(feed, keep), pool = g.all.slice(), out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
    if (out.filter(id => ok.includes(id)).length >= 2) return { offer: g.all.filter(id => out.includes(id)), keep };
  }
  return { offer: g.all, keep: null };
}
// n different pieces of equipment at random
// n different pieces that work inside a round: the ones that act on a site or on a reaction
function kitRound(n, rnd) { const R = rnd || rand, pool = GEAR.map(q => q.id), out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); return out; }
function kit(n, rnd) { const R = rnd || rand, pool = GEAR.map(q => q.id), out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); return out; }

// ---------- a round: one molecule carried through several pages ----------
// The molecule at the end of a page starts the next page. A reaction that acts on what the last reaction changed
// follows on, and the row goes up. A reaction that does not follow on breaks the row: what the row made is kept and
// the row starts again. Nothing made is ever taken away.
// The finishing reagent closes groups for good, so it is offered only on the last page and ends the round.
// every third reaction in a row gives the page one more reaction
const SYN = { strong: 2, streak: 3, pages: 3, offer: 5, uses: 2, finish: 'h2', finishExtra: 0.5, rare: 0.18, place: 20, row: 0.35 };
// Now and then a reagent on offer is a rare version for that page: double counts its places twice, strong adds 1
// to the row, plenty does not run out.
const RARE = ['double', 'strong', 'plenty'];
// Heavy atoms. Some atoms of a molecule that is dealt are a heavy isotope. A reaction at one adds to one of the
// three numbers. They stay on the molecule for as long as the atom does, so they can be reacted at again.
const ISO = { c13: { name: 'carbon-13', part: 'p', op: 'add', val: 60 }, o18: { name: 'oxygen-18', part: 'r', op: 'add', val: 1 }, c14: { name: 'carbon-14', part: 'e', op: 'mul', val: 1.25 } };
const ISOP = { c13: 0.1, c14: 0.02, o18: 0.2 };
function salt(m, rnd) { const R = rnd || rand, ar = RX.aromaticAtoms(m); m.atoms.forEach(a => { if (ar.has(a)) return; if (a.el === 'C') { const x = R(); if (x < ISOP.c14) a.iso = 'c14'; else if (x < ISOP.c14 + ISOP.c13) a.iso = 'c13'; } else if (a.el === 'O' && R() < ISOP.o18) a.iso = 'o18'; }); return m; }
// A brief changes what one round pays for, so a different set of equipment suits it. Every brief but the plain one
// asks for more and pays something when it is beaten.
const BRIEFS = [
  { id: 'plain', name: 'plain', note: '' },
  { id: 'carry', name: 'carry', note: 'half mult kept' },
  { id: 'broad', name: 'broad', note: 'points twice, rows half' },
  { id: 'loose', name: 'loose', note: 'no rows' },
  { id: 'each', name: 'each', note: 'no repeats' },
  { id: 'back', name: 'back', note: 'loops pay' },
  { id: 'scarce', name: 'scarce', note: '1 use' },
  { id: 'short', name: 'short', note: '2 pages' }
];
const BRIEF = {}; BRIEFS.forEach(b => { BRIEF[b.id] = b; });
const synRack = () => RX.LIST.map(c => c.id).filter(id => id !== SYN.finish && id !== 'aibn' && !Object.keys(FOUND).some(k => FOUND[k] === id));
// RULE.pages n: n more turns in every round (run-length option). RULE.stepsMore n: n more circles in every turn.
const pagesOf = g => (sigOn('clepsydra') ? 1 : 0) + SYN.pages + (RULE.pages || 0) + (g.gear.includes('elixir') ? 1 : 0) + (g.gear.includes('hourglass') ? 1 : 0) + (g.termPages || 0) - (g.brief === 'short' ? 1 : 0) + (g.condenser ? 1 : 0);
// everything made so far: what closed rows made plus the open row, all times extra
// FLAT (ruling AT: flatter chain bonuses, docs/RIG.md fourteenth, part 1). What a round makes is still places times row times extra, but the
// yield is that product raised to FLAT.pow (0.5: its square root), scaled so a product of FLAT.pivot stays FLAT.pivot. Every multiplier in the
// game (a longer chain, the last-reagent double, a motif, a row, an instrument, a creature) therefore counts at its square root: ten times the
// product is 3.2 times the yield. The order of any two lines is unchanged, so the best line by yield is the same line; what changes is how far apart
// yields land. The number to beat (PAR), the pass marks (needParBy), the inspections' factors (ASSAYF) and the marks above (RULE.tiers) were
// moved by the same rule, so a round played the same way is won or lost as before (the simulated players, who weigh the yield
// still missing against the task, choose a little differently). pow 1 is the old rule.
const FLAT = { pow: 0.5, pivot: 4770 };
const flat = raw => (FLAT.pow === 1 ? raw : Math.pow(FLAT.pivot, 1 - FLAT.pow) * Math.pow(Math.max(0, raw), FLAT.pow));
// yx(k): what extra must be multiplied by for the YIELD to be multiplied by k (a creature's "yield times k" is on the yield the player reads)
const yx = k => (FLAT.pow === 1 ? k : Math.pow(k, 1 / FLAT.pow));
const made = g => { const y = g.frozenAt || g; return Math.round(flat((y.bank + y.P * y.R) * y.E) * (g.lift || 1)); };    // g.lift: the sign (signLift), 1 without it
const held = g => Math.round(g.P * g.R * g.E);
const mult = g => g.R * g.E;
const rowStart = g => (g.gear.includes('magnet') && !RULE.five ? 2.5 : 1);
// how many times a reagent can be used in a round
const usesOf = (g, id) => Math.max(1, usesOf0(g, id) - (signHas(g.runRef, 'uses') ? 1 : 0));
const usesOf0 = (g, id) => (RULE.usesBy && RULE.usesBy[id] != null) ? RULE.usesBy[id] : (g.brief === 'scarce' ? Math.ceil(RULE.uses / 2) : TIER[id] === 'rare' ? Math.max(1, RULE.uses - 1) : RULE.uses) + ((g.usesPlus && g.usesPlus[id]) || 0) + (g.gear.includes('dropper') ? ((RULE.passive && RULE.passive.dropper) || 1) : 0) + (g.usesAll || 0);
const handOf = g => (RULE.hand || SYN.offer) + (g.gear.includes('carousel') && (!RULE.carouselFirst || (g.page || 1) <= 1) ? 1 : 0) - (signHas(g.runRef, 'hand') ? 1 : 0);
// n reagents from the rack. With a hand, reagents that still have uses come first and those in skip come last, and
// nothing is dealt again: a hand on which nothing acts is a hand the player has to deal with.
function draw(g, R, rack, n, skip) {
  const pull = (pool, out) => { while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); return out; };
  if (!RULE.hand) { const live = rack.filter(id => RX.CARDS[id].find(g.m).length); let offer = []; for (let t = 0; t < 40; t++) { offer = pull(rack.slice(), []); if (offer.filter(id => live.includes(id)).length >= Math.min(2, live.length)) break; } return offer; }
  const has = id => !RULE.uses || g.left[id] > 0, old = id => !!skip && skip.includes(id), out = [];
  pull(rack.filter(id => has(id) && !old(id)), out); pull(rack.filter(id => has(id) && old(id)), out); pull(rack.filter(id => !has(id)), out);
  return out;
}
// the reagents of a page: the hand, anything equipment adds to it, and which of them are a rare version on this page
function dealHand(g, R, rack, offer, again) {
  const was = again ? g.kinds.filter(id => !rack.includes(id)) : [];
  g.kinds = rack.filter(id => offer.includes(id)).concat(was);
  if (!RULE.uses) g.left = {};
  if (!again && g.gear.includes('mystery')) { const all = RUNG.start.concat(...SUPPLY.map(q => q.reagents)).filter((id, i, a) => a.indexOf(id) === i && RX.CARDS[id] && !PAIR[id] && !g.kinds.includes(id) && !rack.includes(id) && RX.CARDS[id].find(g.m).length); if (all.length) { const id = all[Math.floor(R() * all.length)]; g.kinds.push(id); if (RULE.uses) g.left[id] = 1; } }
  if (!again) { if (g.back && RX.CARDS[g.back] && !g.kinds.includes(g.back)) g.kinds.push(g.back); g.back = null; }
  if (!RULE.uses) g.kinds.forEach(id => { g.left[id] = (g.brief === 'scarce' || TIER[id] === 'rare' ? 1 : SYN.uses) + ((g.usesPlus && g.usesPlus[id]) || 0) + (g.gear.includes('dropper') ? ((RULE.passive && RULE.passive.dropper) || 1) : 0) + (g.usesAll || 0); });
  else g.kinds.forEach(id => { if (g.left[id] == null) g.left[id] = 1; });
  // plenty: with a budget of uses, a reagent that is plenty on a page spends none while that page is open
  const plenty = id => { g.rare[id] = 'plenty'; if (RULE.uses) g.free[id] = true; else g.left[id] = 9; };
  g.rare = {}; g.free = g.usesFree ? allFree() : {}; g.kinds.forEach(id => { if (g.rareOn !== false && R() < SYN.rare * (g.gear.includes('loupe') ? 2 : 1) * (g.rareMul || 1)) { const t = RARE[Math.floor(R() * RARE.length)]; if (t === 'plenty') plenty(id); else g.rare[id] = t; } });
  if (g.gear.includes('ouija') && g.kinds.length) plenty(g.kinds[Math.floor(R() * g.kinds.length)]);
}
// Opens every ring a zip has closed (RULE.reopen). The molecule is replaced by a copy, and what the row was built on is
// carried over to the copy. g.reopened tells the page how many rings opened and which atom became which.
function reopenAll(g) {
  g.reopened = null; if (!RULE.reopen || !RULE.cascade) return 0;
  const cm = RX.cloneMap(g.m), n = RX.reopen(cm.model); if (!n) return 0;
  const cur = g.cur, mp = S => { const T = new Set(); (S || []).forEach(a => { const c = cm.map.get(a); if (c) T.add(c); }); return T; };
  cur.fresh = mp(cur.fresh); cur.layers = (cur.layers || []).map(mp); g.m = cm.model; g.reopened = { n, map: cm.map }; return n;
}
function synDeal(g, rnd) {
  const R = rnd || rand, rack = g.rackIds || synRack(), n = handOf(g); let offer = draw(g, R, rack, n, null);
  if (g.fore) offer = g.fore.filter(id => rack.includes(id));
  g.fore = null; if ((g.gear.includes('orb') || RULE.next) && g.syn && (g.page || 1) < pagesOf(g)) { g.fore = draw(g, R, rack, n, null); g.fore = rack.filter(id => g.fore.includes(id)); }
  g.nextHand = RULE.next && g.fore ? g.fore.slice() : null;
  g.pageTrail = (g.trail || []).length; g.againFrom = null; g.pageSteps = 0; g.more = 0; g.chain = false; g.fired = false; g.chainLen = 0; g.redrawn = false; g.queue = []; g.shot = false; g.casc = 0; g.lastOn = false; hom2Page(g);
  dealHand(g, R, rack, offer, false); hom2Stuck(g);
  g.startTodo = []; g.mirrored = false; g.recycled = 0; g.wastedNow = 0; if (!g.manual) startRun(g);
  if ((g.gear.includes('goat') || g.gear.includes('voodoo')) && g.kinds.length) { const id = g.kinds[Math.floor(R() * g.kinds.length)]; if (g.left[id] > 0) g.left[id] = Math.max(1, g.left[id] - 1); }
}
// The redraw: once a page the hand is put back and dealt again from the rack, reagents that were not in it first.
// It costs one use of the reagent in the hand that has the most left.
function redrawCost(g) { let best = null; g.kinds.forEach(id => { if (g.free && g.free[id]) return; if (g.left[id] > 0 && (!best || g.left[id] > g.left[best])) best = id; }); return best; }
const canRedraw = g => !!RULE.redraw && !!RULE.hand && !!g.syn && !g.over && !g.chain && !g.redrawn && !(RULE.queue && g.shot) && (g.rackIds || synRack()).length > handOf(g) && (g.pageSteps < stepsOf(g)) && (!!g.usesFree || !!redrawCost(g));
// Why the cup said no in every state of a first game (found 2026-11-13): a re-deal is paid with one use of the reagent that has the most left,
// and in a round whose uses are free (g.usesFree: the first game) no reagent can pay, so redrawCost was null and canRedraw was false on every
// page. Now a round with free uses re-deals free of charge. It is still once a page. redrawInfo(g) gives the page all of it: can, why not
// ('off', 'over', 'chain' a reagent of this page has fired, 'done' already re-dealt this page, 'shot' the line is firing, 'rack' the rack is no
// bigger than the hand, 'full' the page's circles are used, 'uses' no reagent has a use left to pay), cost (the reagent that pays, null when
// free) and left (the pages of this round, this one included, on which a re-deal can still be made: the level of the cup).
const redrawInfo = g => { const why = !RULE.redraw || !RULE.hand || !g.syn ? 'off' : g.over ? 'over' : g.chain ? 'chain' : g.redrawn ? 'done' : (RULE.queue && g.shot) ? 'shot' : !((g.rackIds || synRack()).length > handOf(g)) ? 'rack' : !(g.pageSteps < stepsOf(g)) ? 'full' : !(g.usesFree || redrawCost(g)) ? 'uses' : null;
  const pagesLeft = Math.max(0, pagesOf(g) - (g.page || 1) + 1) - (g.redrawn || g.chain || g.shot ? 1 : 0), paid = g.usesFree ? 99 : (g.kinds || []).reduce((t, id) => t + (g.free && g.free[id] ? 0 : Math.max(0, g.left[id] || 0)), 0);
  return { can: !why, why, cost: g.usesFree ? null : redrawCost(g), left: g.over ? 0 : Math.max(0, Math.min(pagesLeft, paid)), of: pagesOf(g) }; };
function redraw(g, rnd) {
  if (!canRedraw(g)) return false;
  const R = rnd || rand, rack = g.rackIds || synRack(), pay = redrawCost(g), was = g.kinds.slice();
  g.queue = []; if (pay) g.left[pay]--; g.redrawn = true; g.paid = pay; g.tally.redraws = (g.tally.redraws || 0) + 1;
  dealHand(g, R, rack, draw(g, R, rack, handOf(g), was), true);
  return true;
}
// heldFor(run, round, base): the reflexes a round of this run holds: the run's own (base, or run.self, or the starting ones) and,
// from round 4 (RULE.fold, on; RULE.holdAll in any round), the across-the-fold ones whose near twin is held (bridge, stitch and
// link have no twin). The one place this list is made: synBegin uses it for the live round, and every reading of a molecule made
// without a live round (easeOf and its screen) uses it too, so the readings hold what the round will hold.
// the fold's line starts at one atom for the whole round: a reading without a live round fixes it on the molecule as dealt, as synBegin does
const anchorSet = m => { if (RX.MODE.eng) RX.ENG.anchorOf(RX.ENG.snapG(m)); return m; };
function heldFor(run, round, base) {
  const self = (base || (run && run.self) || SELF0).slice(), r = round || (run && run.round) || 1;
  if (RULE.fold !== false && RX.MODE.eng && (RULE.holdAll || (run && r >= 4))) { const ENG = RX.ENG, heldKinds = self.map(id => ENG.KIND[id]); ENG.FAR_IDS.forEach(id => { const tw = ENG.R[id].twin; if ((!tw || heldKinds.includes(tw) || RULE.holdAll) && !self.includes(id)) self.push(id); }); }
  return self;
}
function synBegin(feed, relaxed, rnd, gear, run) {
  sigSync(run);
  const g = begin(feed, relaxed, [], null, gear || []); g.manual = !!(run && run.manual); RX.MODE.reach = 4; g.tools = {};
  if (!(feed && feed.atoms)) salt(g.m, rnd);
  g.self = RULE.cascade ? ((run && run.self) || SELF0).slice() : SELF.filter(q => q.tier <= ((run && run.tier) || 0)).map(q => q.id); g.casc = 0;
  // the across-the-fold reflexes are held from round 4 (RULE.fold, on; RULE.holdAll holds them in any round)
  if (RX.MODE.eng) RX.ENG.anchorOf(RX.ENG.snapG(g.m));      // the line starts at this atom for the whole round
  g.self = heldFor(run, null, g.self);
  g.kin = feed && feed.atoms ? ((run && run.kin) || 'chain') : kinOf(feed);
  g.brief = (run && run.brief) || 'plain'; g.by = { water: 0, h2: 0, gauge: 0 }; HOMIDS.forEach(id => { g.by[id] = 0; }); g.hom = !bareRun(run) && run && !run.noHom && run.hom && HOMS[run.hom] && HOMS[run.hom].act ? { id: run.hom, fed: run.homFed ? HOMS[run.hom].need : 0, used: 0, frozen: 0 } : null; g.syn = true; g.page = 1; g.total = 0; g.over = false; g.pageSteps = 0; g.best = 0;
  g.P = 0; g.E = 1; g.bank = 0; g.grade = {}; g.gearLv = {}; g.R = rowStart(g); g.tally = { places: 0, loops: 0, kinds: 0, breaks: 0 };
  if (run) { g.grade = Object.assign({}, run.grade); g.gearLv = run.lv; g.usesPlus = run.uses; if (run.rack) g.rackIds = run.rack.filter(id => dealtIn(run, id)); g.rareOn = !!run.rare; g.usesAll = run.usesAll || 0; g.termSteps = run.steps || 0; g.termPages = run.pages || 0; g.rareMul = run.rareMul || 1; if (run.glass) { g.glass = true; g.E = 3; } if (run.term && run.term !== 'plain') { const C = CIRCLE[run.term] || CIRCLE.plain; g.ring = C.n; g.ringMul = C.mul; g.lit = 0; g.ringSet = []; } }
  if (g.brief === 'carry' && run && run.carryE) g.E = run.carryE;
  if (run && g.gear.includes('milk')) { run.milk = (run.milk || 0) + 1; g.E += 0.1 * run.milk; }
  modeSync(run); if (RULE.reopen && RULE.cascade) RX.reopen(g.m);
  g.runRef = run || null; g.left = {}; g.usesFree = usesFreeOn(run); g.free = g.usesFree ? allFree() : {}; g.rare = {}; g.loopsCont = 0; cur0 = g; if (RULE.uses) (g.rackIds || synRack()).forEach(id => { g.left[id] = usesOf(g, id); });
  g.runRef = run || null; g.lift = signLift(run); g.runLen = run ? { name: run.len || lengthOf(run.tierNo || 3).name, rounds: runLast(run), round: run.round || 1, tierNo: run.tierNo || 3 } : null;
  specBegin(g, run);
  synDeal(g, rnd);
  return g;
}
// closes the open row: what it made is kept, and the row starts again
function close(g) {
  g.chain = false; g.bank += g.P * g.R; g.P = 0;
  g.R = Math.max(rowStart(g), g.gear.includes('clamp') ? g.R * 0.75 : 1);
  g.lost = g.cur.path.length; g.cur.path = []; g.cur.fresh = new Set(); g.cur.layers = []; if (g.ringSet && g.lost > 0) { g.ringSet = g.ringSet.slice(0, -1); g.lit = g.ringSet.length; }
}
// true when this option would break the row that is open
const unbroken = g => g.gear.includes('ouroboros') || (g.gear.includes('tower') && !g.tower);
const breaks = (g, o) => g.cur.path.length > 0 && !o.cont && !unbroken(g);
// the longest named pair or longer that the row now ends on
function namedRow(path) {
  let best = null;
  RUN.ROUTES.forEach(r => { const n = r.seq.length, off = path.length - n; if (off < 0 || (best && best.seq.length >= n)) return; if (r.seq.every((alts, k) => alts.includes(path[off + k]))) best = r; });
  return best;
}
// Scores one reaction. Every change to places, row or extra is returned as an event, in the order it happened, so
// the page can replay it: the reagent at each place, then the row, then each piece of equipment.
function scoreRound(g, o, free) {
  const cur = g.cur, id = o.id, r = o.r, ev = [], loop = !o.casc && cur.seen.has(r.sig), first = !cur.used.includes(id); let h = 0;
  const emit = (src, fx, extra) => {
    if (!fx) return;
    const n = (GEARS[src] && g.gearLv[src]) || 1; let v = fx.val;
    if (n > 1) v = fx.op === 'mul' ? 1 + (v - 1) * n : v * n;
    if (fx.part === 'p') { if (fx.op === 'add') { g.P += v; h += v; } else g.P *= v; }
    else if (fx.part === 'h') { g.P += h * (v - 1); h *= v; }
    else if (fx.part === 'r') { if (fx.op === 'add') g.R += v; else g.R *= v; }
    else if (fx.op === 'add') g.E += v; else g.E *= v;
    ev.push(Object.assign({ src, part: fx.part, op: fx.op, val: v, P: g.P, R: g.R, E: g.E, made: made(g) }, extra || {}));
  };
  // the cursed idol fires every other occult piece a second time; the lab coat does what the piece to its left does
  const lit = () => (g.gear.includes('glory') && !c.cont && c.was > 0 ? Object.assign({}, c, { cont: true, len: c.was + 1 }) : c);
  const pieces = at => g.gear.forEach((q, i) => { const G = GEARS[q]; if (q === 'coat') { const L = GEARS[g.gear[i - 1]]; if (L && L.fx && L.at === at) emit('coat', L.fx(lit())); return; } if (G.fx && G.at === at) { emit(q, G.fx(lit())); if (G.kin === 'occult' && g.gear.includes('idol')) emit(q, G.fx(lit())); } });
  const saved = !o.cont && cur.path.length > 0 && !g.gear.includes('ouroboros') && unbroken(g);
  cur.path = o.cont || (cur.path.length > 0 && unbroken(g)) ? cur.path.concat(id) : [id];
  const was = o.cont ? 0 : g.lost || 0; g.lost = 0;
  const c = { hits: r.hits, saved, was, cont: o.cont, len: cur.path.length, loop, leaves: !!LEAVES[id], first, nth: cur.step + 1, page: g.page, pageStep: g.pageSteps, pageMax: stepsOf(g), cls: RX.CARDS[id].cls, same: cur.used[cur.used.length - 1] === id, distinct: new Set(cur.used.concat(id)).size };
  const lx = RULE.lastx && o.casc && g.lastOn ? (sigStrong('tetractys') === 'tet_x3' ? 3 : LASTX.mul) : 1;      // Tetractys, the stronger form: the fourth reagent pays three times
  const gem = sigOn('gemini') && (o.casc ? GEM_REFLEX.includes(String(RX.ENG.KIND[o.kind] || o.kind || '').replace(/_far$/, '')) : GEM_REAGENT.includes(id)) ? 2 : 1; if (gem > 1 && r.hits) g.sigNow = 'gemini';
  const b = g.brief, polyLen = id === 'aibn' ? Math.max(2, o.model.atoms.reduce((t, a) => t + (a.poly || 0), 0)) / 2 : 1, per = (o.casc ? CASC.place * lx : id === 'aibn' ? SYN.place * polyLen : id === 'allyl' ? SYN.place : rarityOf(id).place) * (1 + SYN.strong * ((g.grade[id] || 1) - 1)) * (b === 'broad' ? 2 : 1) * (b === 'each' && !first && !o.casc ? 0 : 1) * gem;
  // RULE.oxPay / RULE.ownPay { id: factor }: what a reagent's own places pay (1 as before); what it sets up pays as ever.
  // RULE.repeat { f, span: 'line' | 'round', chain }: the k-th time one reagent acts in a line (or in the round) its own places pay f to the k-1; with chain the reflex steps it sets off pay that too.
  // RULE.setPay { id: factor }: the reflex steps a reagent sets off pay this share (their places and what they add to extra).
  const repOf = (rid, upto) => { const rp = RULE.repeat; if (!rp) return 1; let k = 0, pg = 0; for (let i = upto - 1; i >= 0; i--) { const t = g.trail[i]; if (t.free) continue; if (rp.span !== 'round' && pg >= g.pageSteps - (o.casc ? 1 : 0)) break; pg++; if (!t.bank && t.id === rid && t.hits > 0) k++; } return Math.pow(rp.f, k); };
  let oxMul = 1, cascMul = 1;
  if (!o.casc) { oxMul = (id === 'pcc' && RULE.oxPay != null ? RULE.oxPay : 1) * (RULE.ownPay && RULE.ownPay[id] != null ? RULE.ownPay[id] : 1) * repOf(id, g.trail.length); }
  else if ((RULE.repeat && RULE.repeat.chain) || RULE.setPay) { let li = -1; for (let i = g.trail.length - 1; i >= 0; i--) { const t = g.trail[i]; if (!t.free && !t.bank) { li = i; break; } } if (li >= 0) { const rid = g.trail[li].id; cascMul = (RULE.repeat && RULE.repeat.chain ? repOf(rid, li) : 1) * (RULE.setPay && RULE.setPay[rid] != null ? RULE.setPay[rid] : 1); } }
  if (o.casc && g.toolPay) cascMul *= g.toolPay;      // RULE.toolPay: the steps a piece set off
  for (let i = 0; i < r.hits; i++) { c.hit = i; if (per) emit('bottle', A('p', per * oxMul * (o.casc ? cascMul : 1))); pieces('site'); }
const HETKIND = ['knit', 'cap', 'bridge'];   // the reflexes that join through N or S
  // RULE.hetPay n: a reflex step that joins through N or S counts n more times. RULE.kindFresh n: the first step of each kind of reflex in a round counts n more times.
  const base = k => String(RX.ENG.KIND[k] || k || '').replace(/_far$/, ''), hetX = RULE.hetPay && o.casc && HETKIND.includes(base(o.kind)) ? RULE.hetPay : 0, freshX = RULE.kindFresh && o.casc && o.kind && !g.trail.some(t => t.kind && base(t.kind) === base(o.kind)) ? RULE.kindFresh : 0;
  if (o.casc && r.hits) { const maskX = sigStrong('sulphurs_mask') === 'mask_r2' && o.kind === 'ring' && g.trail.slice(g.pageTrail || 0).filter(t => t.free && t.kind === 'ring').length < 2 ? 2 : 1;      // Sulphur's Mask, the stronger form: the first two rings an OH closes on a page each count twice
    if (maskX > 1 && !g.sigNow) g.sigNow = 'sulphurs_mask';
    for (let rp = 0, nrp = ((RULE.foldPay2 && o.via === 'fold' ? 2 : 1) + hetX + freshX) * maskX; rp < nrp; rp++) { g.casc = (g.casc || 0) + 1; const fresh = !RULE.fresh || g.casc > (g.cascBest || 0), w = fresh ? 1 : CASC.old; if (g.casc > 1) emit('cascade', M('h', 1 + (g.casc - 1) * w * cascMul)); emit('cascade', CASC.mul ? M('e', 1 + CASC.step * g.casc * w * lx * cascMul) : A('e', CASC.step * g.casc * w * lx * cascMul), { n: g.casc, fresh, lastx: lx > 1 }); g.tally.casc = Math.max(g.tally.casc || 0, g.casc); } }
  if (o.by && GEARS[o.by] && r.hits) ev.push({ src: o.by, act: true, part: 'e', op: 'add', val: 0, P: g.P, R: g.R, E: g.E, made: made(g) });
  if (SHORT[id] && r.hits) { emit('short', M('h', SHORT[id])); emit('short', A('r', 0.5 * (SHORT[id] - 1))); }
  new Set(o.atoms || []).forEach(a => { const I = a.iso && ISO[a.iso]; if (I) emit('iso', { part: I.part, op: I.op, val: I.val }, { iso: a.iso }); });
  // what leaves: caught by equipment, or collected, and always a stroke on the tally. Five strokes pay places, more the longer the row
  (r.gone || []).forEach((grp, gi) => {
    const kind = kindOf(grp); let caught = false;
    g.gear.forEach(q => { const fx = CATCH[q] && (CATCH[q][kind] || CATCH[q].any); if (fx) { emit(q, fx, { gone: gi, kind }); caught = true; } });
    if (kind === 'water' || kind === 'h2' || kind === 'co2') { homEvent(g, kind); if (!caught) ev.push({ src: 'collect', kind, gone: gi, part: 'p', op: 'add', val: 0, P: g.P, R: g.R, E: g.E, made: made(g) }); }
    tallyOff(g, grp, kind);
    g.by.gauge++; if (g.by.gauge >= BY.tally) { g.by.gauge -= BY.tally; emit('tally', A('p', BY.pay * Math.max(1, cur.path.length))); }
  });
  if (r.hits && RULE.motifs !== false) { const lv = motifsOf(o.model), op = motifOpen(g), mo = []; let mult = 1; Object.keys(lv).forEach(k => { if (op.includes(k)) { mult *= 1 + MOTIFS[k].rate * lv[k]; mo.push({ id: k, level: lv[k], rate: MOTIFS[k].rate }); } }); g.motifs = mo; if (mult > 1) emit('motif', { part: 'h', op: 'mul', val: mult }, { motifs: mo }); }
  else if (r.hits) kinsOf(o.model).forEach(q => { const fx = KIN[q.id].fx(Object.assign({ free: !!free }, c)); if (fx) emit('family', { part: fx.part, op: fx.op, val: fx.op === 'mul' ? 1 + (fx.val - 1) * q.lv : fx.val * q.lv }, { kin: q.id, lv: q.lv }); });
  if (o.cont && b !== 'loose') { emit('row', A('r', (o.casc ? CASC.row : SYN.row) * (b === 'broad' ? 0.5 : 1))); const nr = namedRow(cur.path); if (nr) emit('route', A('r', 0.5 * (nr.seq.length - 1)), { route: nr.id }); }
  pieces('step');
  if (b === 'loose') emit('brief', A('e', 0.3)); else if (b === 'each' && first) emit('brief', A('e', 0.5)); else if (b === 'back' && loop) emit('brief', A('e', 0.5));
  const rare = (g.rare && g.rare[id]) || null;
  if (rare === 'double') emit('rare', M('h', 2)); else if (rare === 'strong') emit('rare', A('r', 1));
  // the homunculus does the last reaction of the page a second time
  if (g.gear.includes('homunculus') && g.pageSteps === stepsOf(g) - 1) emit('homunculus', M('h', 3));
  g.tally.places += r.hits; if (loop) g.tally.loops++; if (first) g.tally.kinds++;
  if (g.ring) { if (!g.ringSet.includes(id)) g.ringSet = g.ringSet.concat(id); g.lit = g.ringSet.length; if (g.lit >= g.ring) { g.lit = 0; g.ringSet = []; emit('circle', { part: 'e', op: 'mul', val: g.ringMul }); } }
  return { ev, rare };
}
// What a reaction would do if it were taken now, without taking it: what it adds to each number, what it makes,
// whether it breaks the row and which pieces of equipment it sets off.
function peek(g, o) {
  const cur = g.cur, sv = { lit: g.lit, ringSet: g.ringSet, P: g.P, R: g.R, E: g.E, bank: g.bank, path: cur.path, fresh: cur.fresh, layers: cur.layers, lost: g.lost, casc: g.casc, tally: Object.assign({}, g.tally), by: Object.assign({}, g.by), hom: g.hom }, before = made(g), brk = breaks(g, o);
  if (brk) close(g);
  const sc = scoreRound(g, o); if (o.finish) g.E += SYN.finishExtra * o.r.hits;
  const out = { gain: made(g) - before, dP: g.P - (brk ? 0 : sv.P), dR: g.R - sv.R, dE: g.E - sv.E, breaks: brk, fires: sc.ev.filter(e => GEARS[e.src]).map(e => e.src) };
  g.lit = sv.lit; g.ringSet = sv.ringSet; g.P = sv.P; g.R = sv.R; g.E = sv.E; g.bank = sv.bank; cur.path = sv.path; cur.fresh = sv.fresh; cur.layers = sv.layers; g.lost = sv.lost; g.casc = sv.casc; g.tally = sv.tally; Object.assign(g.by, sv.by); g.hom = sv.hom;
  return out;
}
// A chain reaction. When a row reaches three, the molecule is set off: every reaction that carries the row on then
// happens by itself, one after another, without using up the page's reactions, until nothing on the page carries
// it on or the reagents run out. free marks a reaction that happened that way.
// A row of three or more charges the page. Once the page's own reactions are used up, the player can set it off.
const charged = g => { if (RULE.cascade || g.fired || g.over || g.cur.path.length < SYN.streak) return false; const o = options(g, true); return Object.keys(o).some(id => o[id].cont); };
function fire(g) { if (!charged(g)) return false; g.chain = true; g.fired = true; g.chainLen = 0; return true; }
// the reactions that would carry a running chain on. None, and the chain is over.
function chainOpts(g) {
  if (!g.chain || g.over) return [];
  if (RULE.chain && (g.chainLen || 0) >= RULE.chain) { g.chain = false; return []; }
  const o = options(g, true), out = Object.keys(o).filter(id => o[id].cont).map(id => o[id]);
  if (!out.length) g.chain = false;
  return out;
}
// The next link when the chain takes it by itself. With forks on and two or more reagents that could carry it on,
// nothing is returned and the chain stays open: the player chooses from chainOpts, or banks.
function chainNext(g) {
  const a = chainOpts(g); if (!a.length || (RULE.fork && a.length > 1)) return null;
  let best = null, top = -1; a.forEach(q => { const v = a.length > 1 ? peek(g, q).gain : 0; if (v > top) { top = v; best = q; } });
  return best;
}
// The bank: the open row is closed on purpose and pays RULE.bank times what it holds. It takes one of the page's
// reactions. At a fork of a chain it takes none and ends the chain.
const canBank = g => !!RULE.bank && !!g.syn && !g.over && g.cur.path.length >= RULE.bankMin && g.P > 0 && (g.chain || g.pageSteps < stepsOf(g));
const bankGain = g => Math.round(flat((g.bank + g.P * g.R * RULE.bank) * g.E) - flat((g.bank + g.P * g.R) * g.E));
function bank(g) {
  if (!canBank(g)) return false;
  const len = g.cur.path.length, v = g.P * g.R * (RULE.bank - 1), fork = !!g.chain; g.bank += v; close(g);
  if (g.chain) g.chain = false; else g.pageSteps++;
  g.tally.banks = (g.tally.banks || 0) + 1;
  g.trail.push({ id: '#bank', hits: 0, cont: false, bank: true, len, fork, page: g.page, last: !fork && g.pageSteps >= stepsOf(g), free: false, ev: [{ src: 'bank', part: 'p', op: 'mul', val: RULE.bank, P: g.P, R: g.R, E: g.E, made: made(g) }] });
  return true;
}
function synTake(g, o, free) {
  const cur = g.cur;
  const shatter = g.glass && breaks(g, o);
  if (breaks(g, o)) { close(g); g.tally.breaks++; }
  const hold = !o.cont && cur.path.length > 0 && !g.gear.includes('ouroboros') && unbroken(g);
  const sc = scoreRound(g, o, free); if (hold) g.tower = true;
  { const mk = new Set(o.r.made);
    if (RULE.ground > 1 && cur.path.length > 1 && o.map) { const live = new Set(o.model.atoms), prev = (cur.layers || []).slice(0, RULE.ground - 1).map(S => { const T = new Set(); S.forEach(a => { const c = o.map.get(a); if (c && live.has(c)) T.add(c); }); return T; }); cur.layers = [mk].concat(prev); cur.fresh = new Set(); cur.layers.forEach(S => S.forEach(a => cur.fresh.add(a))); }
    else { cur.layers = [mk]; cur.fresh = mk; } }
  cur.seen.add(o.r.sig); cur.step++; cur.used.push(o.id);
  if (o.loop && o.cont) g.loopsCont = (g.loopsCont || 0) + 1;
  if (!o.self && !(g.free && g.free[o.id]) && g.left[o.id] > 0) g.left[o.id]--;
  if (!o.self && o.r && o.r.hits) { homEvent(g, 'use:' + o.id); if (o.id === 'pcc' && RX.homs.endOls(g.m).length) homEvent(g, 'endox');
    if (RULE.jarStart && g.trail.slice(g.pageTrail || 0).filter(t => !t.free && !t.wasted && !t.bank && t.id === o.id && t.hits > 0).length === 1) homEvent(g, 'twice'); }      // jarStart: the second landing of one reagent on a page feeds the slime
  const bd = o.map && o.model ? bondDiff(g.m, o.model, o.map) : null;
  // what the game counts as runoff for this step, beside the atoms that really left: kind is the jar it goes to
  if (bd) bd.off = (o.r.gone || []).map(grp => ({ kind: grp && grp.off ? Object.keys(grp.off)[0] : (SPEC_OFF[byKind(grp)] || byKind(grp)), atoms: (grp || []).map(a => a.el) }));
  // sig: the sigils that changed this step, for the page (null when none): what the engine flagged, what a reagent did because of one, a
  // doubled count (Gemini), a fourth circle (Tetractys), a fourth page (Clepsydra)
  const sigs = []; if (o.sig) sigs.push(o.sig); if (!o.self && RX.MODE.eng) { const sr = RX.ENG.sigOf(g.m, ENGID[o.id] || o.id); if (sr) sigs.push(sr); } if (g.sigNow) { sigs.push(g.sigNow); g.sigNow = null; }
  if (sigOn('tetractys') && !free && g.pageSteps + 1 >= stepsOf(g)) sigs.push('tetractys'); if (sigOn('clepsydra') && g.page >= pagesOf(g)) sigs.push('clepsydra');
  g.m = o.model; if (!free) { g.toolPay = 0; g.pageSteps++; g.lastOn = !o.self && g.pageSteps >= stepsOf(g); } else if (g.chain) g.chainLen = (g.chainLen || 0) + 1; g.best = Math.max(g.best, cur.path.length);
  const set = false;
  g.trail.push(Object.assign({ id: o.id, hits: o.r.hits, cont: o.cont, held: hold, ev: sc.ev, rare: sc.rare, set, free: !!free, gap: o.gap != null ? o.gap : null, sig: sigs.length ? sigs : null, kind: o.kind, join: o.join ? o.join.map(a => a.id) : null, via: o.via || (o.kind ? 'chain' : null) }, bd || {}));
  if (shatter) synEnd(g);
}
// ---------- the page lined up, then fired ----------
// The state of a round is saved, something is tried, and the state is put back.
function snap(g) {
  const c = g.cur, s = { counterPage: g.counterPage, condenser: g.condenser, frozenAt: g.frozenAt, P: g.P, R: g.R, E: g.E, bank: g.bank, lit: g.lit, ringSet: g.ringSet, tally: Object.assign({}, g.tally), by: Object.assign({}, g.by), lost: g.lost, tower: g.tower, chain: g.chain, fired: g.fired, best: g.best, pageSteps: g.pageSteps, left: Object.assign({}, g.left), m: g.m, trail: g.trail.length, path: c.path, fresh: c.fresh, layers: c.layers, seen: c.seen, step: c.step, used: c.used.length, over: g.over, total: g.total, more: g.more, doused: g.doused, chainLen: g.chainLen, loopsCont: g.loopsCont, kinds: g.kinds, free: g.free, rare: g.rare, redrawn: g.redrawn, shot: g.shot, casc: g.casc, queue: (g.queue || []).slice(), startTodo: (g.startTodo || []).slice(), mirrored: g.mirrorUsed, tools: g.tools, hom: g.hom, recycled: g.recycled, wastedNow: g.wastedNow, cascBest: g.cascBest, lastOn: g.lastOn, rec: g.rec, spec: g.spec };
  c.seen = new Set(c.seen); return s;
}
function back(g, s) {
  const c = g.cur; g.counterPage = s.counterPage; g.condenser = s.condenser; g.frozenAt = s.frozenAt; g.P = s.P; g.R = s.R; g.E = s.E; g.bank = s.bank; g.lit = s.lit; g.ringSet = s.ringSet; g.tally = s.tally; Object.assign(g.by, s.by); g.lost = s.lost; g.tower = s.tower; g.chain = s.chain; g.fired = s.fired; g.best = s.best; g.pageSteps = s.pageSteps; g.left = s.left; g.m = s.m; g.trail.length = s.trail; c.path = s.path; c.fresh = s.fresh; c.layers = s.layers; c.seen = s.seen; c.step = s.step; c.used.length = s.used; g.over = s.over; g.total = s.total; g.more = s.more; g.doused = s.doused; g.chainLen = s.chainLen; g.loopsCont = s.loopsCont; g.kinds = s.kinds; g.free = s.free; g.rare = s.rare; g.redrawn = s.redrawn; g.shot = s.shot; g.casc = s.casc; g.queue = s.queue; g.startTodo = s.startTodo; g.mirrorUsed = s.mirrored; g.tools = s.tools; g.hom = s.hom; g.recycled = s.recycled; g.wastedNow = s.wastedNow; g.cascBest = s.cascBest; g.lastOn = s.lastOn; g.rec = s.rec; g.spec = s.spec;
}
const BANKID = '#bank';
// The next step of a cascade: the first reaction the molecule has with itself as it stands, or nothing. Every kind
// uses up a C=O or a C=C, so a cascade ends by itself. (Without RULE.reopen a step that would bring back a molecule
// the round has already held is not taken.)
// how many steps of each reflex kind the page in play has made (the engine's limits are per turn: dry once, weld twice, ring twice)
const againOn = g => !!(RULE.ammoniaLimits && g.againFrom != null && g.againFrom >= (g.pageTrail || 0));
function selfCounts(g, page) { const c = {}; let from = g.pageTrail || 0; if (!page && sigOn('respiratio')) for (let i = g.trail.length - 1; i >= from; i--) if (!g.trail[i].free) { from = i; break; }      // Respiratio: the limits start again after every reagent
  for (let i = from; i < g.trail.length; i++) { const t = g.trail[i], k = t.free && RX.ENG.KIND[t.id]; if (k) c[k] = (c[k] || 0) + 1; } return c; }
function cascadeNext(g) {
  if (!RULE.cascade || g.over || (g.casc || 0) >= CASC.most) return null;
  if (g.hom && g.hom.v2 && g.hom.hold === g.trail.length) return null;      // a creature's tap that changed nothing on the molecule sets no reflex off (hom2Use)
  if (RX.MODE.eng) {
    RX.MODE.limitsBack = againOn(g); const ENG = RX.ENG, held = (g.self || []).map(id => ENG.KIND[id]).filter(Boolean), nx = ENG.nextReflex(g.m, held, RX.MODE.limitsBack ? selfCounts(g, true) : selfCounts(g)); RX.MODE.limitsBack = false; if (!nx) return null;
    if (!nx.sig && sigOn('respiratio') && ENG.R[nx.id].per != null && (selfCounts(g, true)[nx.id] || 0) >= ENG.R[nx.id].per) nx.sig = 'respiratio';
    const id = ENG.CARDID[nx.id], sites = RX.CARDS[id].find(g.m); if (!sites.length) return null; const t = tryOne(g, g.m, id), r = t.r; if (!r.hits || (!RULE.reopen && g.cur.seen.has(r.sig))) return null;
    return { id, model: t.model, map: t.map, r, loop: false, spoil: false, self: true, casc: true, cont: true, gap: nx.site && nx.site.dist != null ? nx.site.dist : null, sig: nx.sig || null, by: sites[0].d > 4 ? 'magnet' : undefined, kind: nx.id, join: sites[0].join, via: sites[0].via, atoms: sites.reduce((a, q) => a.concat(q.atoms), []) };
  }
  for (const id of g.self || []) { const sites = RX.CARDS[id].find(g.m); if (!sites.length) continue; const t = tryOne(g, g.m, id), r = t.r; if (!r.hits || (!RULE.reopen && g.cur.seen.has(r.sig))) continue;
    return { id, model: t.model, map: t.map, r, loop: false, spoil: false, self: true, casc: true, cont: true, by: sites[0].d > 4 ? 'magnet' : undefined, atoms: sites.reduce((a, q) => a.concat(q.atoms), []) }; }
  return null;
}
// What a page does before any reagent (the burette, then the seed crystal). startDue gives the next such reaction
// and takes it off the list, so whoever asks must take it; startRun takes them all. A page played with no screen
// runs them when it is dealt; the page on screen (run.manual) plays them one at a time so they can be watched.
function startDue(g) {
  if (g.over || g.shot || !g.startTodo) return null;
  while (g.startTodo.length) {
    const k = g.startTodo[0];
    if (k === 'burette') { g.startTodo.shift(); const card = RX.CARDS.extend, sites = card ? card.find(g.m) : []; if (!sites.length) continue; const t = tryOne(g, g.m, 'extend'), r = t.r; if (!r.hits || (RULE.atoms && heavy(t.model) > RULE.atoms)) continue;
      return { id: 'extend', model: t.model, map: t.map, r, loop: false, spoil: false, self: true, by: 'burette', cont: g.cur.path.length > 0, atoms: sites.reduce((a, q) => a.concat(q.atoms), []) }; }
    g.startTodo.shift();
  }
  return null;
}
function startRun(g, each) { let n = 0; for (let o = startDue(g); o; o = startDue(g)) { if (each) each(o); synTake(g, o, true); n++; } return n; }
// (the passive versions of the pieces tried first, where the zip waited, ran twice or reached further by itself, were
// taken out: a piece is now something the player uses on the molecule)
const again = () => null, cascMode = () => RULE.cascade;
// ---------- pieces used on the molecule ----------
const benchUsed = g => Object.keys(g.tools || {}).reduce((t, k) => t + (g.tools[k] || 0), 0);
const benchLeft = g => (RULE.bench ? Math.max(0, RULE.bench - benchUsed(g)) : 99);
const canTool = (g, id) => !!RULE.five && !!g.syn && !g.over && !g.shot && g.gear.includes(id) && !!(GEARS[id] && GEARS[id].tool) && ((g.tools && g.tools[id]) || 0) < TOOLUSES && benchLeft(g) > 0 && (!GEARS[id].task || !!g.specDef);
const toolSpots = (g, id) => (canTool(g, id) ? (GEARS[id].task ? [{ whole: true }] : RX.tools.spots(g.m, id, RULE.atoms)) : []);
// The two instruments for the task. The tally counter is set on the page in play: whatever that page adds toward the task counts twice (counterBonus,
// read by specParts). The condenser adds one more page to the round; when that page is reached the yield is fixed as it stands (g.frozenAt, read by
// made), so the page counts for the task and for nothing else.
function taskToolUse(g, id) {
  if (id === 'counter') g.counterPage = g.page || 1; else if (id === 'condenser') g.condenser = 1; else return false;
  g.tools = Object.assign({}, g.tools); g.tools[id] = (g.tools[id] || 0) + 1; g.tally.tools = (g.tally.tools || 0) + 1; g.toolRun = false; g.toolPay = 0; specUpdate(g);
  return true;
}
function counterBonus(g, d, rec) { const k = g.counterPage; if (!k || rec.pages.length < k) return 0; const cut = n => specRead(d, { f0: rec.f0, pages: rec.pages.slice(0, n) }); return Math.max(0, cut(k) - cut(k - 1)); }
// Uses piece id at a spot (from toolSpots). The molecule is replaced by a changed copy, as when rings open, and
// g.reopened tells the page which atom became which. False when it cannot be done there (the size limit).
function toolUse(g, id, spot) {
  g.lastOn = false;
  if (!canTool(g, id) || !spot) return false;
  if (GEARS[id].task) return taskToolUse(g, id);
  const cm = RX.cloneMap(g.m), mp = v => (Array.isArray(v) ? v.map(mp) : cm.map.get(v)), sp = {}; Object.keys(spot).forEach(k => { sp[k] = spot[k] && typeof spot[k] === 'object' ? mp(spot[k]) : spot[k]; });
  const res = RX.tools.apply(cm.model, id, sp); if (!res) return false;
  if (RULE.atoms && heavy(cm.model) > RULE.atoms && heavy(cm.model) > heavy(g.m)) return false;
  const cur = g.cur, live = new Set(cm.model.atoms), mS = S => { const T = new Set(); (S || []).forEach(a => { const c = cm.map.get(a); if (c && live.has(c)) T.add(c); }); return T; };
  cur.fresh = mS(cur.fresh); cur.layers = (cur.layers || []).map(mS); g.m = cm.model; g.reopened = { n: 1, map: cm.map, made: res.made || [], gone: res.leaving || [] };
  // what a piece drives off is collected as a reagent's by-product is
  (res.leaving || []).forEach(grp => { const kind = kindOf(grp); if (kind === 'water' || kind === 'h2' || kind === 'co2') homEvent(g, kind); tallyOff(g, grp, kind); g.by.gauge++; });
  g.tools = Object.assign({}, g.tools); g.tools[id] = (g.tools[id] || 0) + 1; g.tally.tools = (g.tally.tools || 0) + 1; g.toolRun = id !== 'clamp'; g.toolPay = (RULE.toolPay && RULE.toolPay[id]) || 0;
  return true;
}
// A piece that changes the molecule sets the zip off at once, as a reagent that acted does (the clamp changes
// nothing and sets nothing off). toolGo uses a piece and runs whatever follows (for play with no page)
function toolGo(g, id, spot) { if (!toolUse(g, id, spot)) return false; if (g.toolRun) { g.toolRun = false; for (let o = cascadeNext(g); o; o = cascadeNext(g)) synTake(g, o, true); } return true; }
// What a placing is worth, read off the structure alone: how many steps the molecule would zip if it were set off
// (the screen's selfRun, on a copy with its rings open). toolBest gives the spot of a piece worth most, and what a
// spot is worth on average, so that how much the choice of place matters can be measured.
// toolTry: the molecule as it would be with the piece used there (a copy, rings open), or nothing where it cannot be
function toolTry(m, id, spot) { const cm = RX.cloneMap(m), mp = v => (Array.isArray(v) ? v.map(mp) : cm.map.get(v)), sp = {}; Object.keys(spot).forEach(k => { sp[k] = spot[k] && typeof spot[k] === 'object' ? mp(spot[k]) : spot[k]; }); if (!RX.tools.apply(cm.model, id, sp)) return null; if (RULE.atoms && heavy(cm.model) > RULE.atoms && heavy(cm.model) > heavy(m)) return null; RX.reopen(cm.model); return cm.model; }
function toolWorth(m, id, spot, self) { const t = toolTry(m, id, spot); return t ? selfRun(t, self || SELF0) : -1; }
function toolBest(m, id, self) { const m0 = RX.cloneModel(m); RX.reopen(m0); const base = selfRun(RX.cloneModel(m0), self || SELF0), spots = RX.tools.spots(m0, id, RULE.atoms); let best = null, top = -1, sum = 0, n = 0; spots.forEach(sp => { const v = toolWorth(m0, id, sp, self); if (v < 0) return; sum += v; n++; if (v > top) { top = v; best = sp; } }); return { base, best: top, mean: n ? sum / n : base, spots: n, spot: best, m: m0 }; }
// ---------- the jars and the homunculi (docs/HOMUNCULI.md, docs/JARS.md) ----------
// What comes off the molecule, and some things the player's reactions do, fill jars across runs; a jar is never
// emptied (the page keeps them in its saved progress; JAR.full is how much fills one). A homunculus grows in each jar
// and hatches when it is full. One hatched homunculus is taken into a run (run.hom). In a round it is fed by what its
// entry names; with `need` of them it is fed, and it is LIT when it is fed and there is something it can do. After a
// page has fired and before the next is dealt the player may tap it. Everything a creature is, is one entry here:
//   name, tok      what the page writes (tok: short tokens, lines split by |)
//   jar            how fast its jar fills: 'fast', 'medium', 'slow' (JAR.full[id] is the count)
//   feed           the events that feed it and fill its jar: 'water', 'h2', 'co2' (what leaves the molecule), or
//                  'use:<reagent id>' (that reagent acted). Other events are raised with homEvent(g, key)
//   need, uses     how many feeds make it fed, and how many times a round it can be tapped (it is empty after a tap)
//   whole          it acts on the whole molecule (one spot); otherwise the player taps a place
//   word           what the hover preview letters over each place it changes ('' for none)
//   spots(m, g)    the places it can act on molecule m as it stands; none means it is not lit
//   act(m, sp, g)  does it to m in place and returns { made }, with restart: true when the count of rings starts
//                  again (water), frozen: n when n more rings are frozen (carbon dioxide). The zip then runs
//   pay            carbon dioxide only: how many times over a frozen ring is paid at the start of a later page
//   now(g)         for the simulated players, when its worth cannot be read as steps: whether to tap it now
//   before         it is tapped BEFORE the page is lined up (salt, wood spirit), not after the page has fired
//   lasting        what it does stays for the round, so its worth is more than the steps it adds at once
//   act may also return over: true (the molecule may pass the size limit) and line: [ids] (wood spirit: the page's line)
//   offered        false: a creature not built yet. It has no jar, is never fed and cannot be taken
// ammonia and brimstone had no number here, so they could never hatch (found 2026-11-13): 40 and 80, as their jar findings say
const JAR = { full: { water: 200, h2: 130, co2: 50, acid: 200, wood: 40, salt: 50, slime: 70, seedling: 120, ammonia: 40, brimstone: 80 }, stages: [0.12, 0.5, 1] };
const closedRings = m => { const cm = RX.cloneMap(m), cuts = [], rev = new Map(); RX.reopen(cm.model, cuts); cm.map.forEach((c, a) => rev.set(c, a)); return cuts.map(q => ({ c: rev.get(q.c), o: rev.get(q.o) })).filter(q => q.c && q.o); };
const HOMS = {
  // water floods: every C=C outside a benzene ring becomes C-OH, every closed ring opens, the rings close again.
  // The count of rings starts again, so a ring that only closes again pays a quarter until the row passes the
  // longest of the round
  water: { name: 'water', jar: 'fast', feed: ['water'], need: 3, uses: 1, tok: 'C=C to OH|rings open', whole: true, word: 'OH',
    spots(m) { const cc = RX.CARDS.hydrate.find(m), rings = closedRings(m).length; return cc.length || rings ? [{ pairs: cc.map(q => (q.bond ? [q.bond.a, q.bond.b] : (q.atoms || []).slice(0, 2))).filter(p => p.length === 2) }] : []; },
    act(m) { RX.reopen(m); const before = new Set(m.atoms); RX.runCard(m, RX.CARDS.hydrate); return { made: m.atoms.filter(a => !before.has(a) && a.el === 'O'), restart: true }; } },
  // hydrogen floats over: where the rings stopped at a stretch too long, the first C=O on the far side becomes OH
  // and the rings carry on. A place is offered only if a ring would close from it
  h2: { name: 'hydrogen', jar: 'fast', feed: ['h2'], need: 3, uses: 1, tok: 'far C=O|to OH', word: 'OH',
    spots(m, g) {
      const nb = a => m.neighbors(a), cos = [], ohC = [];
      m.bonds.forEach(b => { if (b.order !== 2) return; const c = b.a.el === 'C' && b.b.el === 'O' ? b.a : b.b.el === 'C' && b.a.el === 'O' ? b.b : null; if (!c || c.fly) return; const o = c === b.a ? b.b : b.a; if (nb(c).some(q => q.atom !== o && q.atom.el !== 'C' && q.atom.el !== 'H')) return; cos.push({ c, o }); });
      if (!cos.length) return [];
      m.atoms.forEach(o => { if (o.el !== 'O' || o.fly) return; const q = nb(o); if (q.length === 2 && q.some(k => k.atom.el === 'H') && q.some(k => k.atom.el === 'C')) ohC.push(q.find(k => k.atom.el === 'C').atom); });
      const out = new Map();
      ohC.forEach(c0 => { const dist = new Map([[c0, 0]]), qu = [c0]; while (qu.length) { const a = qu.shift(); nb(a).forEach(k => { if (k.atom.el === 'C' && !dist.has(k.atom)) { dist.set(k.atom, dist.get(a) + 1); qu.push(k.atom); } }); }
        let best = 1e9; cos.forEach(q => { const d = dist.get(q.c); if (d > 0 && d < best) best = d; }); cos.forEach(q => { if (dist.get(q.c) === best && !out.has(q.c)) out.set(q.c, { c: q.c, o: q.o, d: best }); }); });
      const self = (g && g.self) || SELF0;
      return Array.from(out.values()).filter(sp => { const t = homTry(m, 'h2', sp); return !!t && selfRun(t, self) >= 1; });
    },
    act(m, sp) { const bond = m.findBond(sp.c, sp.o); if (!bond || bond.order !== 2) return null; const r = RX.CARDS.nabh4.apply(m, { bond, c: sp.c, o: sp.o }); return { made: [sp.o].concat(r.incoming || []) }; } },
  // carbon dioxide freezes: the rings the page closed stay shut for the rest of the round, are paid in full at the
  // start of every later page (frozenPay), and nothing opens them again. Nothing to gain on the last page
  co2: { name: 'dry ice', jar: 'medium', feed: ['co2'], need: 1, uses: 1, pay: 2, tok: 'rings freeze|pay each page', whole: true, word: '',
    spots(m, g) { if (g && g.page >= pagesOf(g)) return []; const rings = closedRings(m); return rings.length ? [{ rings: rings.map(q => [q.o, q.c]) }] : []; },
    act(m) { const rings = closedRings(m); if (!rings.length) return null; rings.forEach(q => { q.o.frz = true; }); return { made: rings.map(q => q.o), frozen: rings.length }; },
    now(g) { return g.page >= pagesOf(g) - 1 ? (g.casc || 0) >= 1 : (g.casc || 0) >= HOMSIM.freezeAt; } },
  // acid eats through: every stretch of four or more plain CH2 is eaten down to three, and for the rest of the round a
  // ring closes across up to six carbons. The rings then run, counting on
  acid: { name: 'acid', jar: 'medium', feed: ['use:hydrate', 'use:dehydrate'], need: 1, uses: 1, reach: 6, tok: 'eats long gaps|rings reach 6', whole: true, word: '', lasting: true,
    spots(m) { const runs = RX.homs.acidRuns(m); return runs.length || m.reach !== HOMS.acid.reach ? [{ runs }] : []; },
    act(m) { return RX.homs.acid(m, HOMS.acid.reach); } },
  // wood spirit, blind drunk: tapped BEFORE the page is lined up. The page fires every reaction dealt that has a use
  // left, in an order taken at random, each spending a use
  wood: { name: 'wood spirit', jar: 'medium', feed: ['use:nabh4'], need: 1, uses: 1, brings: 'nabh4', tok: 'fires all five|any order', whole: true, word: '', before: true,
    spots(m, g) { if (!g || !g.kinds) return []; return g.kinds.filter(id => (g.free && g.free[id]) || g.left[id] > 0).length >= 2 ? [{ all: true }] : []; },
    act(m, sp, g, rnd) { if (!g) return { made: [] }; const R = rnd || rand, ids = g.kinds.filter(id => (g.free && g.free[id]) || g.left[id] > 0); for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = ids[i]; ids[i] = ids[j]; ids[j] = t; } return { made: [], line: ids }; } },
  // salt cures: tapped BEFORE the page is lined up, on one C=O. For the round a ring that closes on it leaves it a
  // C=O, up to three rings a page, and no reaction changes it (rules.js, cure)
  salt: { name: 'salt', jar: 'medium', feed: ['endox'], need: 1, uses: 1, tok: 'cures a C=O|3 rings close on it', word: 'cured', before: true, lasting: true,
    spots(m) { return RX.homs.saltSpots(m); },
    act(m, sp) { return RX.homs.salt(m, sp); } },
  // slime sticks: two carbons are joined by two carbons of slime, so they count as three apart for the round and the
  // rings cross from one stretch to the other. A place is offered only if a ring would close across it
  slime: { name: 'slime', jar: 'medium', feed: ['use:bh3'], need: 1, uses: 1, brings: 'bh3', tok: 'sticks two carbons|3 apart', word: 'stuck', lasting: true,
    spots(m, g) { const self = (g && g.self) || SELF0; return RX.homs.slimeSpots(m).filter(sp => { const t = homTry(m, 'slime', sp); return !!t && selfRun(t, self) >= 1; }).slice(0, 12); },
    act(m, sp) { const r = RX.homs.slime(m, sp); return r ? { made: r.made, over: true } : null; } },
  // the seedling grows: six carbons with two C=O grow from the carbon tapped, stay for the round, and may pass the
  // size limit. A place is offered only if a ring would close onto the new arm
  seedling: { name: 'seedling', jar: 'slow', feed: ['use:allyl'], need: 1, uses: 1, arms: 1, tok: 'grows 3 carbons|1 C=O', word: '+3', lasting: true,
    spots(m, g) { const self = (g && g.self) || SELF0; return RX.homs.seedSpots(m).filter(sp => { const t = homTry(m, 'seedling', sp); return !!t && selfRun(t, self) >= 1; }); },
    act(m, sp) { const r = RX.homs.seed(m, sp, HOMS.seedling.arms); return r ? { made: r.made, over: true } : null; } },
  // not built yet (docs/HOMUNCULI.md, "To build, in order"): each becomes one entry like those above
  // ammonia, smelling salts: tapped after the page has fired. The reagents of the page that acted fire again by themselves, in the same order, and spend no use.
  // Its food is ammonia, which only the cyanohydrin route gives off: a run that holds this homunculus holds that reagent (brings), so the food can be made.
  ammonia: { name: 'ammonia', jar: 'slow', feed: ['nh3', 'use:ritter'], need: 1, uses: 1, tok: 'page fires again', whole: true, word: 'again', brings: 'cyanohydrin',
    spots(m, g) { return g && g.shot && pageLine(g).length ? [{ again: true }] : []; },
    act(m, sp, g) { return g ? { made: [], again: pageLine(g) } : { made: [] }; } },
  // brimstone, hellfire: tap a carbon; fire runs down the next plain carbons toward the chain end (4 to 8), writes an OH on the 4th and a C=O on the 8th.
  // Its food is sulfur, which only the Chugaev elimination gives off: a run that holds this homunculus holds that reagent.
  brimstone: { name: 'brimstone', jar: 'slow', feed: ['sulfur', 'use:thiolene'], need: 1, uses: 1, tok: 'burns 8 carbons|OH and C=O', word: 'burnt', brings: 'chugaev',
    spots(m, g) { const self = (g && g.self) || SELF0; const sp = RX.homs.brimSpots(m), good = sp.filter(q => { const t = homTry(m, 'brimstone', q); return !!t && selfRun(t, self) >= 1; }); return (good.length ? good : sp).slice(0, 12); },
    act(m, sp) { return RX.homs.brim(m, sp); } }
};
const HOMSIM = { freezeAt: 3 };
// the reagents that acted on the page that has just fired, in order (for the ammonia homunculus)
const pageLine = g => { const out = []; let n = g.pageSteps || 0; for (let i = g.trail.length - 1; i >= 0 && n > 0; i--) { const t = g.trail[i]; if (t.free) continue; n--; if (!t.bank && !t.wasted && t.hits > 0) out.unshift(t.id); } return out; };
// a reagent of the hand fired once more with no use spent
const takeFree = (g, id) => { const f = g.free; g.free = allFree(); let ok = false; try { const o = options(g, true)[id]; if (o) { synTake(g, o, true); ok = true; } } finally { g.free = f; } return ok; };
const HOMIDS = Object.keys(HOMS), homOn = id => !!HOMS[id] && HOMS[id].offered !== false && !!HOMS[id].act;
const homOf = g => (g && g.hom && HOMS[g.hom.id]) || null;
// ---------- the homunculi, second design (RULE.homs2; the spec is docs/tools_chem/sweep_homs.py) ----------
// Each creature is LIT by how the page just fired was played (never by a count of food), the player taps it, it pays, and it
// has a cost. One tap a page at most, any number of pages a round; not in a spec proof. HOMS2K holds every number (it is tuned
// from the sweeps). With RULE.homs2 on, HOMS[id] is the entry of HOMS2; off, the old entry (HOMS1). Setting RULE.homs2 swaps them.
//   water      K.need or more waters came off the page. Tap: yield times k, every C=C to C-OH, loose rings reopen, the reflexes run on.
//   h2         the last reagent of the line is oxidize, it acted, and the page's chain is K.need steps or more; not on the last page. Tap: the chain count is
//              carried over the page turn. A bet: if the next page's own chain is shorter than the chain that floated, the balloon pops (yield times K.pop).
//   co2        last page only: carbon dioxide came off this round and K.least or more reagents of the rack never acted in it. Tap: yield times k for
//              each such reagent, K.most at most. With least 3 and most 3 it is always three: 1.36 three times over is 2.5.
//   acid       the molecule has K.loss or more fewer heavy atoms than when the page began. Tap: yield times k.
//   wood       the FIRST reagent lined up found nothing to act on. Tap: he pours every dealt reagent not lined up, as further circles, spending no use;
//              if one of his pours lands the yield is times k.
//   salt       the line is the line of the page before, reagent for reagent. Tap: yield times k and each of the three gets a use back.
//   slime      two of the three reagents each acted and set off a reflex (yield times k2), or all three (k). The reagents he stuck are shut on the next page.
//   ammonia    ritter acted on this page, or a knit is in its chain. Tap: the line fires again as further circles, no use spent.
//   seedling   the molecule ends the page K.gain or more heavy atoms bigger. Tap: the row grows by one, yield times 1 + (k - 1) * row. Once tapped it
//              must be fed: after any later page that grows less (homAfter) it wilts (yield times K.wilt, the row starts again).
//   brimstone  thiolene acted on this page, or a cap is in its chain; not on the last page. Tap: the round ends now, what is left of the spec is burned
//              (it counts as met), yield times k after page one, k2 after page two.
// EVERY "yield times k" above multiplies extra. Since the flat rule (FLAT.pow 0.5) the player reads the square root of it on the yield: 1.5 reads as
// 1.22, 2 as 1.41, 2.5 as 1.58, the pop 0.6 as 0.77, the wilt 0.7 as 0.84. P.reference() gives each as read.
// g.hom carries the state of the round and is replaced, never changed in place (snap and back keep it): v2, tp (tapped on this page), a0 (heavy
// atoms when the page began), w0 (waters off when it began), t0 and t1 (where the page before and this page begin in g.trail), float (the chain
// count to carry over the turn), streak and wpage (seedling), end (brimstone: turn() says the round is over).
// Fifteenth measure, item 2 (the five a reviewer failed against "reward gameplay not averages"): each is now lit by a line the player has to choose.
//   h2: a page of TWO reagents (the third circle left empty), oxidize the second and landing: yield times k and the chain floats over the turn.
//   wood: the bottle he drank is empty for the rest of the round (empty) and his pours spend a use each (pay); times k if a pour lands.
//   slime: the SAME bottle twice on a page, both landing and each setting off a reflex of its own: times k; that bottle is empty for the round.
//   seedling: 12 atoms, and it pays more. brimstone: the fire takes only a task at least half done (half).
// Eighteenth (owner, 13 November: "Raise them to about 1.5 at stage 3" by raising the number and, where that alone could not do it or made
// rounds run away, by easing the job in one plain way; docs/RIG.md, eighteenth, part 2). The jobs eased: water 3 waters (it was 4); dry ice
// needs no carbon dioxide (noCO2); salt asks only for the first reagent of the page before (match 1; it was the whole line); slime no longer asks
// for a reflex each time (steps 0); seedling 6 atoms and a plain number (rise false: no rising in a row, no stall; it was 12). Ammonia has a
// number. Every k below that has a row in HOMGROW.read is set from that row's third number (homNumbers), so these are only the older values.
// HOMS2K_17 keeps the seventeenth's rules for a comparison: Object.assign(HOMS2K[id], HOMS2K_17[id]) and delete HOMGROW.read[id] gives one back.
const HOMS2K_17 = { water: { k: 1.5, need: 4 }, co2: { k: 1.36, noCO2: false }, acid: { k: 2 }, salt: { k: 2.5, match: 3 }, slime: { k: 2.5, k2: 2.5, steps: 1 }, ammonia: { k: 0 }, seedling: { k: 1.8, gain: 12, rise: true } };
const HOMS2K = { water: { k: 1.5, need: 3 }, h2: { pop: 0.6, need: 1, two: true, k: 2.5 }, co2: { k: 1.36, most: 3, least: 3, noCO2: true }, acid: { k: 2, loss: 2 }, wood: { first: true, k: 1.5, pay: true, empty: true }, salt: { k: 2.5, match: 1 }, slime: { k: 2.5, k2: 2.5, steps: 0, same: 2 }, ammonia: { k: 0 }, seedling: { k: 1.8, gain: 6, wilt: 0.7, rise: false }, brimstone: { k: 1.5, k2: 1.25, half: 0.5 } };
const HOMS1 = Object.assign({}, HOMS);
const hom2On = g => !!RULE.homs2 && !!g && !!g.hom && !!g.hom.v2;
// what a stretch of the trail was: the circles in order ({ id, places, set: reflex steps it set off }) and the reflex kinds
const hom2Circ = (g, a, b) => { const circ = [], chain = []; for (let i = Math.max(0, a); i < b; i++) { const t = g.trail[i]; if (t.free) { chain.push(RX.ENG.KIND[t.id] || t.id); if (circ.length) circ[circ.length - 1].set++; continue; } circ.push({ id: t.id, places: t.bank || t.wasted ? 0 : t.hits || 0, set: 0 }); } return { circ, chain }; };
const hom2Rec = g => hom2Circ(g, g.hom.t1, g.trail.length);
const hom2Line = p => p.circ.slice(0, 3).map(c => c.id);
// co2: the reagents of the rack that never acted this round (K.most at most)
const hom2Shut = g => Math.min(HOMS2K.co2.most, (g.rackIds || synRack()).filter(id => !g.trail.some(t => !t.free && !t.wasted && !t.bank && t.id === id && t.hits > 0)).length);
// wood: the dealt reagents that were not in the line and have a use left, in the order dealt
const hom2Rest = g => { if (!hom2On(g)) return []; const ln = hom2Rec(g).circ.map(c => c.id); return g.kinds.filter(id => !ln.includes(id) && ((g.free && g.free[id]) || g.left[id] > 0)); };
// slime: the reagents of the line that landed and set off a reflex of their own (K.steps steps or more)
const hom2Own = (p, K) => { const c3 = p.circ.slice(0, 3).filter(c => c.id !== SYN.finish && c.id !== BANKID), ok = c => c.places > 0 && c.set >= (K.steps == null ? 1 : K.steps);
  if (!K.same) return c3.filter(ok).map(c => c.id);
  for (const c of c3) { const tw = c3.filter(x => x.id === c.id); if (tw.length >= K.same && tw.every(ok)) return tw.map(x => x.id); }      // the same bottle twice, each landing and setting off a reflex
  return []; };
// "SIMPLIFY THE CREATURES" (owner, 13 November): one job a player can say in one sentence. RULE.homSimple = null (off: as they were) or
// { h2: 'a', wood: 'b', brimstone: 'a' }: the one-job version of each named creature (the letters are the options of RIG.md seventeenth, part 6;
// only the recommended one of each is built in the game, all nine are in the simulator: sweep_homs.py MODE).
//   h2 'a'         drive off HOMSIMPLE.h2.need hydrogens on the page: yield times k. No chain carried on, no bet, any page.
//   wood 'b'       a reagent of the page found nothing to act on: yield times k. He pours nothing and empties no bottle.
//   brimstone 'a'  sulfur went on the molecule, not on the last page: the round ends there and the task counts as met. No number, no half.
//   Eighteenth: brimstone works on the last page too (last) and has a number (k; 0 is none, as the owner's sentence has it: then it is worth
//   1.11 alone and cannot grow). The three k are set from HOMGROW.read (homNumbers).
const HOMSIMPLE = { h2: { need: 2, k: 1.4 }, wood: { k: 1.35 }, brimstone: { last: true, k: 0 } };
RULE.homSimple = { h2: 'a', wood: 'b', brimstone: 'a' };      // owner's pick, 13 November: all three on; null gives the older rules back
const homSimple = id => (RULE.homSimple && RULE.homSimple[id]) || null;
const HOM2LIT = {
  water: (g, p, K) => (g.tally.off_water || 0) - g.hom.w0 >= K.need,
  h2: (g, p, K) => { if (homSimple('h2')) return (g.tally.off_hydrogen || 0) - (g.hom.h0 || 0) >= HOMSIMPLE.h2.need; const c = p.circ[p.circ.length - 1]; return (!K.two || p.circ.length === 2) && !!c && c.id === 'pcc' && c.places > 0 && (g.casc || 0) >= (K.need || 1) && g.page < pagesOf(g); },
  co2: (g, p, K) => g.page >= pagesOf(g) && (K.noCO2 || (g.tally.off_carbon_dioxide || 0) >= 1) && hom2Shut(g) >= K.least,
  acid: (g, p, K) => g.hom.a0 - heavy(g.m) >= K.loss,
  wood: (g, p, K) => { const c3 = p.circ.slice(0, 3), dud = c => c.id !== SYN.finish && c.id !== BANKID && c.places === 0; if (homSimple('wood')) return c3.some(dud); return c3.length >= 3 && (K.first ? dud(c3[0]) : c3.some(dud)) && hom2Rest(g).length >= 1; },   // any page
  salt: (g, p, K) => { if (g.hom.t0 < 0 || p.circ.length < 3) return false; const a = hom2Line(p), b = hom2Line(hom2Circ(g, g.hom.t0, g.hom.t1)); if (b.length !== 3) return false; if (K.match && K.match < 3) return a.slice(0, K.match).every((x, i) => x === b[i] && x !== SYN.finish && x !== BANKID); if (K.any) { const x = a.slice().sort(), y = b.slice().sort(); return x.every((v, i) => v === y[i]); } return a.every((x, i) => x === b[i]); },      // any: the same three in any order
  slime: (g, p, K) => hom2Own(p, K).length >= 2,
  ammonia: (g, p) => p.circ.some(c => c.id === 'ritter' && c.places > 0) || p.chain.includes('knit'),
  seedling: (g, p, K) => heavy(g.m) - g.hom.a0 >= K.gain,
  brimstone: (g, p, K) => (g.page < pagesOf(g) || !!(homSimple('brimstone') && HOMSIMPLE.brimstone.last)) && (!K.half || homSimple('brimstone') || !g.specDef || specProg(g) >= K.half * g.specDef.parts.length) && (p.circ.some(c => c.id === 'thiolene' && c.places > 0) || p.chain.includes('cap'))
};
// the page has fired and the creature has not been tapped on it
// Nineteenth (owner, ruling BB): "a creature acts ONCE A ROUND (the player picks the page)". RULE.homOnce (on): the tap is spent for the round
// (g.hom.rt; a new round's g.hom has none). The page calls what it called: P.homLit(g) is false once the round's tap is spent and P.homUse(g, spot)
// spends it; P.homSpent(g) says why a creature is dark: null, 'round' (tapped this round) or 'run' (Brimstone's fire, gone for the run).
// "BRIMSTONE works ONCE A RUN and keeps its number". RULE.brimOnce (on): roundEnd writes run.homSpent = { brimstone: the round it ended } and
// the fire is not lit again in that run (a tap inside a snapshot leaves the run alone, so the bot's look ahead spends nothing).
RULE.homOnce = true; RULE.brimOnce = true;
const homSpent = g => { const h = g && g.hom; if (!h) return null; if (RULE.brimOnce && h.id === 'brimstone' && g.runRef && g.runRef.homSpent && g.runRef.homSpent.brimstone) return 'run'; return RULE.homOnce && h.rt ? 'round' : null; };
const hom2Open = g => hom2On(g) && !!g.syn && !g.over && !!g.shot && !(g.queue || []).length && !g.hom.tp && !homSpent(g);
const hom2Lit = g => hom2Open(g) && !!HOM2LIT[g.hom.id] && !!HOM2LIT[g.hom.id](g, hom2Rec(g), HOMS2K[g.hom.id] || {});
const HOM2TOK = {
  water: K => K.need + ' waters off|yield x' + homK(K.k), h2: K => (homSimple('h2') ? HOMSIMPLE.h2.need + ' hydrogens off|yield x' + homK(HOMSIMPLE.h2.k) : K.two ? 'two, oxidize last|x' + homK(K.k || 1) + ', chain on' : 'oxidize last|chain ' + K.need + '+ floats'), co2: K => K.least + ' bottles shut|x' + homK(Math.pow(K.k, K.most)), acid: K => K.loss + ' atoms smaller|yield x' + homK(K.k),
  wood: K => (homSimple('wood') ? 'a dud in line|yield x' + homK(HOMSIMPLE.wood.k) : (K.first ? 'first is a dud|' : 'a dud in line|') + 'pours rest x' + homK(K.k)), salt: K => (K.match === 1 ? 'same first reagent|x' + homK(K.k) + ', use back' : 'same line again|x' + homK(K.k) + ', uses back'), slime: K => (K.same ? 'one bottle twice|' + (K.steps === 0 ? 'yield x' : 'each chains x') + homK(K.k) : 'two chains x' + homK(K.k2) + '|three x' + homK(K.k)), ammonia: K => 'nitrogen goes on|line fires again' + (K.k ? ' x' + homK(K.k) : ''),
  seedling: K => 'grows ' + K.gain + ' atoms|x' + homK(K.k) + (K.rise === false ? '' : ' and rising'), brimstone: K => (homSimple('brimstone') ? 'sulfur goes on|round ends, task met' + (HOMSIMPLE.brimstone.k ? ' x' + homK(HOMSIMPLE.brimstone.k) : '') : (K.half ? 'S on, task half|ends round x' : 'sulfur goes on|burns spec x') + homK(K.k))
};      // every multiplier as the player reads it on the yield (homK)
const HOMS2 = {};
Object.keys(HOMS2K).forEach(id => {
  const o = HOMS1[id], e = { name: o.name, jar: o.jar, feed: o.feed, need: 1, uses: 1, whole: true, word: '', v2: true,
    // one spot when it is lit (water also names the C=C it will change, for the page), none when it is not
    spots(m, g) { if (!hom2Lit(g)) return []; const sp = { all: true }; if (id === 'water') { const w = HOMS1.water.spots(m)[0]; if (w) sp.pairs = w.pairs; } return [sp]; },
    // what it does to the molecule itself (only water changes it); everything else a tap does is in hom2Use
    act(m) { return id === 'water' ? { made: HOMS1.water.act(m).made } : { made: [] }; } };
  if (o.brings) e.brings = o.brings;
  Object.defineProperty(e, 'tok', { enumerable: true, get: () => HOM2TOK[id](HOMS2K[id] || {}) }); HOMS2[id] = e;
});
// RULE.homs2 is the switch: setting it puts the entries of that design into HOMS (the page reads HOMS[id])
let homs2Flag = RULE.homs2 == null ? true : !!RULE.homs2;
const homsSet = () => { const T = homs2Flag ? HOMS2 : HOMS1; Object.keys(HOMS1).forEach(id => { HOMS[id] = T[id] || HOMS1[id]; }); };
Object.defineProperty(RULE, 'homs2', { enumerable: true, configurable: true, get: () => homs2Flag, set: v => { homs2Flag = !!v; homsSet(); } });
homsSet();
// a page begins (synDeal): what the page starts from is kept, the tap is free again, and a chain count floated over the turn (h2) is put back
function hom2Page(g) {
  const h = g.hom; if (!h || !RULE.homs2 || (g.runRef && g.runRef.proof)) return;
  const fl = h.float || 0;
  g.hom = Object.assign({}, h, { v2: true, tp: false, a0: heavy(g.m), w0: (g.tally && g.tally.off_water) || 0, h0: (g.tally && g.tally.off_hydrogen) || 0, t0: h.t1 == null ? -1 : h.t1, t1: g.pageTrail || 0, float: 0, floated: fl, end: false, hold: -1, shut: h.stuck || null, stuck: null });
  if (fl) g.casc = fl;
}
// slime: the bottles he stuck on the page before are not in this page's hand (three bottles are always left). synDeal calls it after the hand is dealt
function hom2Stuck(g) { const h = g.hom; if (!h || !h.shut || !hom2On(g)) return; h.shut.forEach(id => { const i = g.kinds.indexOf(id); if (i >= 0 && g.kinds.length > 3) g.kinds.splice(i, 1); }); }
// what a creature does by itself once a page has fired, tapped or not (the seedling wilts). Once a page; turn() calls it
// the wood spirit: once his pours have fired, the yield is times K.k if one of them landed. hom2Go calls it; on the page homAfter does (at the turn)
function homWoodPay(g) { const h = g.hom; if (!h || h.id !== 'wood' || h.woodFrom == null || h.woodPaid || (g.queue || []).length) return false; const hit = g.trail.slice(h.woodFrom).some(t => !t.free && !t.wasted && !t.bank && t.hits > 0); if (hit) g.E *= HOMS2K.wood.k; g.hom = Object.assign({}, h, { woodPaid: true, woodHit: hit }); return hit; }
function homAfter(g) {
  if (!hom2On(g) || g.over) return false; const h = g.hom; if (h.id === 'wood') return homWoodPay(g);
  if (h.id === 'h2') {     // the bet: the chain that floated in was longer than this page's own chain, the balloon pops
    if (!h.floated || h.ppage === g.page) return false; const own = hom2Rec(g).chain.length, pop = own < h.floated;
    if (pop) { g.E *= HOMS2K.h2.pop; if (g.frozenAt) g.frozenAt = Object.assign({}, g.frozenAt, { E: g.frozenAt.E * HOMS2K.h2.pop }); } g.hom = Object.assign({}, h, { floated: 0, ppage: g.page, popped: (h.popped || 0) + (pop ? 1 : 0) }); return pop;
  }
  if (h.id !== 'seedling' || HOMS2K.seedling.rise === false) return false;
  // once tapped it must be fed every page: a page that grows less than K.gain wilts it (not the page of the tap itself)
  if (!(heavy(g.m) - h.a0 < HOMS2K.seedling.gain && (h.streak || 0) > 0 && h.wpage !== g.page && h.spage !== g.page)) return false;
  g.E *= HOMS2K.seedling.wilt; if (g.frozenAt) g.frozenAt = Object.assign({}, g.frozenAt, { E: g.frozenAt.E * HOMS2K.seedling.wilt }); g.hom = Object.assign({}, h, { streak: 0, wpage: g.page }); return true;
}
// the tap. Further circles (wood, ammonia) are put in the queue with room made for them: the page, or homGo, fires them
// HOMUNCULI GET BETTER AT THEIR JOBS (owner, 13 November: "the multiplier starts at a value but can grow gradually ... evolving through 4-5 stages";
// multiplier only: the same job, the number climbs). RULE.homGrow: null (off: every creature as it was, which is stage 3), 'run', 'keep', 'both'.
//   'run'   a creature starts every run at stage 1 and gains a stage when its own job has been done HOMGROW.run[i] times in the run
//   'keep'  its jar keeps counting after it hatches (meta.jar[id], the lifetime count; the page must go on adding to it past full); at
//           HOMGROW.keep[i] times the jar's size it gains a stage and stays there
//   'both'  the lifetime count sets how far it can go (2 at least); within a run it grows from stage 1 as in 'run'
// A stage multiplies what a tap does to the yield by HOMGROW.f (stage 1 a little weaker than the creature was, 3 as it was, 5 clearly stronger).
// homStage(run, id) -> { stage 1..5, mult (the number the player reads at that stage), mults (all five), count, next (the count that gives the next
// stage, null at the top or when off), of ('run' or 'life': what count is) }.  When a tap lifts the stage, g.homEvolved = { id, stage, from, mult, at }
// and the last entry of g.trail carries evolve: { id, stage, mult }.
// Eighteenth (owner, 13 November: "Raise them to about 1.5 at stage 3"): every creature has five numbers of its own, HOMGROW.k[id], fitted so
// that held alone it is worth about 1.2, 1.35, 1.5, 1.65, 1.8 at stages 1 to 5 (docs/RIG.md, eighteenth; sweep_hom18.py). They are what the tap
// multiplies by, as the rules count it; the player reads the square root (homK). The third is the tap's own number in HOMS2K or HOMSIMPLE
// (homBase), so with RULE.homGrow off a creature is its stage 3. HOMGROW.f is the older single ladder, used for a creature with no row in k.
// HOMGROW.read[id] is the five numbers as the player reads them (stage 1 to 5); homNumbers() squares them into HOMGROW.k (FLAT) and sets the
// tap's own number to the third. Call homNumbers() again after changing a row. A creature whose older rule is switched back on (RULE.homSimple
// null) has no row of its own for that rule and climbs HOMGROW.f.
// Nineteenth: a creature acts once a round (RULE.homOnce), so eight rows were fitted again for one tap a round (docs/RIG.md, nineteenth;
// sweep_run.py hom19). Dry ice was lit only on the last page already and Brimstone keeps its number (owner).
const HOMGROW = { f: [0.8, 0.9, 1, 1.15, 1.3], run: [2, 4, 7, 10], keep: [2, 4, 7, 11], k: {},
  read: { water: [1.36, 1.83, 2.19, 2.54, 2.92], h2: [1.50, 1.86, 2.15, 2.39, 2.75], co2: [1.91, 2.40, 2.82, 3.89, 4.50], acid: [1.96, 2.67, 3.17, 4.05, 4.50], wood: [1.54, 1.72, 1.88, 2.08, 2.38],
    salt: [1.54, 1.87, 2.13, 2.36, 2.64], slime: [1.55, 1.76, 1.98, 2.17, 2.38], ammonia: [1.24, 1.48, 1.73, 1.96, 2.21], seedling: [1.48, 1.71, 1.92, 2.26, 2.73], brimstone: [1.17, 1.30, 1.39, 1.52, 1.59] },
  // the eighteenth's numbers, fitted for a tap on every page (RULE.homOnce off): Object.assign(HOMGROW.read, HOMGROW.read18); homNumbers()
  read18: { water: [1.30, 1.50, 1.71, 1.93, 2.15], h2: [1.38, 1.62, 1.84, 2.11, 2.46], acid: [2.01, 2.58, 3.17, 3.95, 4.50], wood: [1.22, 1.33, 1.40, 1.45, 1.51], salt: [1.35, 1.49, 1.67, 1.92, 2.15], slime: [1.32, 1.45, 1.56, 1.66, 1.88], ammonia: [1.08, 1.23, 1.32, 1.45, 1.57], seedling: [1.30, 1.50, 1.67, 1.91, 2.25] } };
function homNumbers() {
  HOMGROW.k = {};
  Object.keys(HOMGROW.read).forEach(id => { const T = HOMGROW.read[id].map(r => Math.pow(r, 1 / FLAT.pow)), k3 = T[2]; HOMGROW.k[id] = T;
    if (HOMSIMPLE[id]) HOMSIMPLE[id].k = k3; else if (id === 'co2') HOMS2K.co2.k = Math.pow(k3, 1 / HOMS2K.co2.most); else { HOMS2K[id].k = k3; if (id === 'slime') HOMS2K.slime.k2 = k3; } });
}
homNumbers();
const homTable = id => { const T = HOMGROW.k && HOMGROW.k[id]; return T && (!HOMSIMPLE[id] || homSimple(id)) ? T : null; };
const homBase = id => { const K = HOMS2K[id] || {}; return id === 'co2' ? Math.pow(K.k, K.most) : homSimple(id) ? (HOMSIMPLE[id].k || 1) : (K.k || 1); };
const homF = (id, st) => { const T = homTable(id), b = homBase(id); return T ? T[st - 1] / b : b === 1 ? 1 : HOMGROW.f[st - 1]; };      // what the stage multiplies the tap by; a creature with no number is not scaled
RULE.homGrow = 'keep';      // owner's pick, 13 November: creatures grow across runs and keep it
function homStage(run, id) {
  const mode = RULE.homGrow || null, k = homBase(id), mults = k === 1 && !homTable(id) ? null : [1, 2, 3, 4, 5].map(st => homK(k * homF(id, st))), full = jarFull(id) || 1;
  if (!mode) return { stage: 3, mult: mults && mults[2], mults, count: 0, next: null, of: null };
  const meta = (run && run.meta) || null, life = (meta && meta.jar && meta.jar[id]) || 0, jobs = (run && run.homJobs && run.homJobs[id]) || 0;
  const up = (n, T) => 1 + T.filter(t => n >= t).length, nx = (n, T) => { const t = T.filter(x => n < x)[0]; return t == null ? null : t; };
  const ks = up(life, HOMGROW.keep.map(t => t * full)), rs = up(jobs, HOMGROW.run);
  if (mode === 'keep') return { stage: ks, mult: mults && mults[ks - 1], mults, count: life, next: nx(life, HOMGROW.keep.map(t => t * full)), of: 'life' };
  const cap = mode === 'both' ? Math.max(2, ks) : 5, st = Math.min(cap, rs);
  return { stage: st, mult: mults && mults[st - 1], mults, count: jobs, next: st >= cap ? null : nx(jobs, HOMGROW.run), of: 'run', cap };
}
function hom2Use(g, spot, rnd) {
  g.lastOn = false; if (!spot || !hom2Lit(g)) return false;
  const id = g.hom.id, K = HOMS2K[id] || {}, line = hom2Line(hom2Rec(g)).filter(x => x !== SYN.finish && x !== BANKID), up = { tp: true, rt: true, used: (g.hom.used || 0) + 1 };
  const give = ids => ids.forEach(x => { if (!(g.free && g.free[x])) g.left[x] = (g.left[x] || 0) + 1; }), more = ids => { g.queue = ids.slice(); g.more = (g.more || 0) + ids.length - (stepsOf(g) - g.pageSteps); };
  const cm = RX.cloneMap(g.m); let made = [];
  if (id === 'water') { g.E *= K.k; made = HOMS2.water.act(cm.model).made; }
  else if (id === 'h2' && homSimple('h2')) g.E *= HOMSIMPLE.h2.k;
  else if (id === 'wood' && homSimple('wood')) g.E *= HOMSIMPLE.wood.k;
  else if (id === 'brimstone' && homSimple('brimstone')) { if (HOMSIMPLE.brimstone.k) g.E *= HOMSIMPLE.brimstone.k; up.end = true; up.burnt = true; }
  else if (id === 'h2') { up.float = g.casc || 0; if (K.k) g.E *= K.k; }
  else if (id === 'co2') g.E *= Math.pow(K.k, hom2Shut(g));
  else if (id === 'acid') g.E *= K.k;
  else if (id === 'slime') { const own = hom2Own(hom2Rec(g), K); g.E *= own.length >= 3 || K.same ? K.k : K.k2; if (K.same) { if (!(g.free && g.free[own[0]])) g.left[own[0]] = 0; } else up.stuck = own.filter((x, i) => own.indexOf(x) === i); }      // same: that bottle is empty for the rest of the round
  else if (id === 'wood') { const rest = hom2Rest(g), dud = hom2Rec(g).circ[0]; if (!K.pay) give(rest); more(rest); if (K.empty && dud && !(g.free && g.free[dud.id])) g.left[dud.id] = 0; up.woodFrom = g.trail.length; up.woodPaid = false; }      // pay: his pours spend a use each; empty: the bottle he drank is empty for the round
  else if (id === 'salt') { g.E *= K.k; give(K.match && K.match < 3 ? hom2Line(hom2Rec(g)).slice(0, K.match) : line); }      // the repeated reagents get their use back
  else if (id === 'ammonia') { if (K.k) g.E *= K.k; give(line); more(line); if (RULE.ammoniaLimits) g.againFrom = g.trail.length; }      // ammoniaLimits (off): his second firing has the page's plain limits (dry once, weld twice, ring twice, counting what the page has already done), whatever sigil is held
  else if (id === 'seedling') { up.streak = (g.hom.streak || 0) + 1; up.spage = g.page; g.E *= K.rise === false ? K.k : 1 + (K.k - 1) * up.streak; }
  else if (id === 'brimstone') { g.E *= g.page <= 1 ? K.k : K.k2; up.end = true; up.burnt = true; }      // the spec is burned: it counts as met (specMet)
  const cur = g.cur, live = new Set(cm.model.atoms), mS = S => { const T = new Set(); (S || []).forEach(a => { const c = cm.map.get(a); if (c && live.has(c)) T.add(c); }); return T; };
  cur.fresh = mS(cur.fresh); cur.layers = (cur.layers || []).map(mS); g.m = cm.model; g.reopened = { n: 1, map: cm.map, made, gone: [] };
  // only water changes the molecule: after any other tap nothing zips until a further circle has fired (the page runs cascadeNext after every tap)
  if (id !== 'water') up.hold = g.trail.length;
  g.hom = Object.assign({}, g.hom, up); g.tally.homs = (g.tally.homs || 0) + 1; g.homAgain = null;
  if (RULE.homGrow) {      // the creature gets better at its job: the stage it holds scales this tap, the tap counts toward the next stage (homStage)
    const run = g.runRef || null, s0 = homStage(run, id); g.E *= homF(id, s0.stage); if (run) { run.homJobs = run.homJobs || {}; run.homJobs[id] = (run.homJobs[id] || 0) + 1; }
    const s1 = homStage(run, id); g.homEvolved = s1.stage > s0.stage ? { id, stage: s1.stage, from: s0.stage, mult: s1.mult, at: g.trail.length } : null;
    if (g.homEvolved && g.trail.length) g.trail[g.trail.length - 1].evolve = { id, stage: s1.stage, mult: s1.mult };
  }
  return true;
}
// the tap and everything that follows it, with no page: the reflexes, the further circles, the round's end. Returns the reflex steps added, or -1
function hom2Go(g, spot, rnd) {
  const t0 = g.trail.length; if (!hom2Use(g, spot, rnd)) return -1;
  for (let o = cascadeNext(g); o; o = cascadeNext(g)) synTake(g, o, true);
  while (g.queue.length && !g.over) queueStep(g);
  if (!g.over) homWoodPay(g);
  if (g.hom && g.hom.end && !g.over) synEnd(g);
  let n = 0; for (let i = t0; i < g.trail.length; i++) if (g.trail[i].free) n++; return n;
}
// what a player compares before and after a tap: progress toward the spec (with RULE.aimPar, plus the share of the pass mark reached), then the yield (as specTry)
// what a line is worth with the tap that would follow it (the round g stands after the line, inside a snapshot): null when the creature is not lit or
// the tap is not wanted. Hydrogen pays on the next page, so its float is counted as a tenth of the yield a step, up to K.safe steps (longer chains are
// seldom matched: the bet); brimstone is wanted only when it clears the round.
const HOMAIM = { h2Step: 0.1, h2Safe: 99 };
function homPeek(g, v0) {
  if (!hom2Lit(g)) return null; const id = g.hom.id, better = (a, b) => a.prog > b.prog || (a.prog === b.prog && a.made > b.made);
  if (id === 'h2') return (g.casc || 0) <= HOMAIM.h2Safe ? { prog: v0.prog, made: Math.round(v0.made * Math.pow(HOMS2K.h2.k || 1, FLAT.pow) * (1 + HOMAIM.h2Step * (g.casc || 0))) } : null;
  const met0 = !!g.specDef && specMet(g), made0 = made(g), need = g.runRef ? needYield(g.runRef) : 0;
  if (hom2Go(g, { all: true }) < 0) return null; const v1 = homValue(g);
  if (id === 'brimstone') return (need > 0 ? v1.made >= need && (!met0 || made0 < need) : !met0 && g.page >= 2) ? v1 : null;
  return better(v1, v0) ? v1 : null;
}
function homValue(g) {
  let prog = g.specDef ? specProg(g) : 0; const md = made(g), run = g.runRef, need = RULE.aimPar && g.specDef && run && !run.proof ? needYield(run) : 0;
  if (need > 0) prog = Math.round((prog + Math.min(1, md / need)) * 1e9) / 1e9;
  return { prog, made: md };
}
// Something happened that may feed a creature: every offered creature it feeds has its jar count raised (g.by, banked
// into the jars at the round's end), and the one held in the run is fed
// RULE.jarStart (off; RIG.md seventeenth part 5, way c): the wood spirit's and the slime's jars fill from reduce and hydroborate, which a new
// game does not hold, so almost no career hatches them. With the switch on a starting play feeds each as well: a reagent lined up that finds
// nothing feeds the wood spirit ('dud'), the second landing of one reagent on a page feeds the slime ('twice'), and the jars take JARSTART.full
// (250 and 70). Each feed is the creature's own job. jarFull(id) is the size the page and the book should read.
const JARSTART = { feed: { wood: 'dud', slime: 'twice' }, full: { wood: 250, slime: 70 }, how: { wood: n => n + ' reagents that found nothing, or uses of reduce.', slime: n => n + ' pages with one reagent landed twice, or uses of hydroborate.' } };
RULE.jarStart = true;      // owner's pick (ruling BB): on
const jarFull = id => (RULE.jarStart && JARSTART.full[id]) || JAR.full[id];
function homEvent(g, key) { if (!g.by) return; HOMIDS.forEach(id => { if (!homOn(id) || !(HOMS[id].feed.includes(key) || (RULE.jarStart && JARSTART.feed[id] === key))) return; g.by[id] = (g.by[id] || 0) + 1; if (g.hom && g.hom.id === id) g.hom = Object.assign({}, g.hom, { fed: g.hom.fed + 1 }); }); }
const homFed = g => { if (hom2On(g)) return hom2Open(g); const H = homOf(g); return !!H && !H.v2 && !!g.syn && !g.over && g.hom.fed >= H.need && (g.hom.used || 0) < (H.uses || 1); };
const homSpots = g => (hom2On(g) ? (hom2Lit(g) ? homOf(g).spots(g.m, g) : []) : homFed(g) &&!(homOf(g).before && (g.shot || g.pageSteps > 0)) ? homOf(g).spots(g.m, g) : []);
// lit: fed, not yet used up this round, and there is something it can do. homReady is the old name
const homLit = g => homSpots(g).length > 0, homReady = homFed;
// the molecule as it would be after the homunculus acted there (a copy), or nothing
function homTry(m, id, spot) { const cm = RX.cloneMap(m), mp = v => (Array.isArray(v) ? v.map(mp) : cm.map.get(v)), sp = {}; Object.keys(spot).forEach(k => { sp[k] = spot[k] && typeof spot[k] === 'object' ? mp(spot[k]) : spot[k]; }); return HOMS[id].act(cm.model, sp) ? cm.model : null; }
// Taps the homunculus at a spot (from homSpots). The molecule is replaced by a changed copy, as when a piece is
// used, and g.reopened tells the page which atom became which. It is then empty.
function homUse(g, spot, rnd) {
  if (hom2On(g)) return hom2Use(g, spot, rnd);
  g.lastOn = false;
  if (!homFed(g) || !spot) return false; if (homOf(g).before && (g.shot || g.pageSteps > 0)) return false;
  const H = homOf(g), cm = RX.cloneMap(g.m), mp = v => (Array.isArray(v) ? v.map(mp) : cm.map.get(v)), sp = {}; Object.keys(spot).forEach(k => { sp[k] = spot[k] && typeof spot[k] === 'object' ? mp(spot[k]) : spot[k]; });
  const res = H.act(cm.model, sp, g, rnd); if (!res) return false;
  if (!res.over && RULE.atoms && heavy(cm.model) > RULE.atoms && heavy(cm.model) > heavy(g.m)) return false;
  const cur = g.cur, live = new Set(cm.model.atoms), mS = S => { const T = new Set(); (S || []).forEach(a => { const c = cm.map.get(a); if (c && live.has(c)) T.add(c); }); return T; };
  cur.fresh = mS(cur.fresh); cur.layers = (cur.layers || []).map(mS); g.m = cm.model; g.reopened = { n: 1, map: cm.map, made: res.made || [], gone: [] };
  g.hom = { id: g.hom.id, fed: 0, used: (g.hom.used || 0) + 1, frozen: (g.hom.frozen || 0) + (res.frozen || 0) }; g.tally.homs = (g.tally.homs || 0) + 1;
  if (res.restart) { g.cascBest = Math.max(g.cascBest || 0, g.casc || 0); g.casc = g.hom.frozen || 0; }
  // wood spirit: the whole hand is lined up, with a circle for each
  g.homAgain = res.again || null;
  if (res.line) { g.queue = res.line.slice(); g.more = Math.max(0, res.line.length - (stepsOf(g) - (g.more || 0))); }
  return true;
}
// taps it and runs the zip that follows (for play with no page); returns the steps it added, or -1
function homGo(g, spot, rnd) { if (hom2On(g)) return hom2Go(g, spot, rnd); const pre =!!homOf(g) && !!homOf(g).before; if (!homUse(g, spot, rnd)) return -1; if (pre) { const c0 = g.casc || 0; if (!g.queue.length) return 0; while (g.queue.length && !g.over) queueStep(g); return (g.casc || 0) - c0; } let n = 0; if (g.homAgain) { const ids = g.homAgain; g.homAgain = null; ids.forEach(id => { if (g.over) return; if (!takeFree(g, id)) return; for (let c = cascadeNext(g); c; c = cascadeNext(g)) { synTake(g, c, true); n++; } }); } for (let o = cascadeNext(g); o; o = cascadeNext(g)) { synTake(g, o, true); n++; } return n; }
// A new page with frozen rings on it: they are counted again and paid in full, ring n as 50 places counted n times
// and n times 0.1 of extra and 0.1 of row, as when it closed, and the rings of the page count on from them
function frozenPay(g) { const n = (g.hom && g.hom.frozen) || 0; if (!n || g.over) return 0; const w = (homOf(g) && homOf(g).pay) || 1; let p = 0; for (let k = 1; k <= n; k++) { p += CASC.place * k * w; g.E += CASC.step * k * w; g.R += CASC.row * w; } g.P += p; g.casc = n; return p; }
// what a round gave off goes to the run's count, and from there to the jars
function runBank(run, g) { run.jar = run.jar || {}; const out = {}; HOMIDS.forEach(id => { if (!homOn(id)) return; out[id] = (g.by && g.by[id]) || 0; run.jar[id] = (run.jar[id] || 0) + out[id]; }); return out; }
const cascadeDue = g => (cascMode(g) === 'each' || (RULE.cascade && !(g.queue || []).length) ? cascadeNext(g) : null);
// everything that follows a circle's turn: the cascade if one is due, then each time a piece makes it zip again
function afterTurn(g, acted, each) { const take = o => { if (each) each(o); else synTake(g, o, true); }; if (acted || cascMode(g) === 'end') for (let o = cascadeDue(g); o; o = cascadeDue(g)) take(o); for (let by = again(g); by; by = again(g)) { if (each) each(null, by); for (let o = cascadeNext(g); o; o = cascadeNext(g)) take(o); } }
// runs the cascade to its end and returns how many steps it took
function cascade(g, each) { let n = 0; for (let o = cascadeNext(g); o; o = cascadeNext(g)) { if (each) each(o); synTake(g, o, true); n++; } return n; }
const queued = (g, id) => (g.queue || []).filter(q => q === id).length;
// uses of a reagent not yet spent or placed in a circle
const usesLeft = (g, id) => (g.free && g.free[id] ? 9 : (g.left[id] || 0) - queued(g, id));
const queueRoom = g => !!RULE.queue && !!g.syn && !g.over && !g.chain && !g.shot && (g.queue || []).length < stepsOf(g) - g.pageSteps;
// places a reagent of the hand, the bank, or on the last page the finishing reagent, in the next empty circle
function queueAdd(g, id) {
  if (!queueRoom(g)) return false;
  if (id === BANKID) { if (!RULE.bank || g.queue.includes(id)) return false; }
  else if (id === SYN.finish) { if (g.page < pagesOf(g) || g.queue.includes(id)) return false; }
  else if (!g.kinds.includes(id) || usesLeft(g, id) <= 0) return false;
  g.queue.push(id); return true;
}
// the circles are reordered freely before the page is fired: nothing is spent
function queueSwap(g, i, j) { const q = g.queue; if (g.shot || !q || i === j || i < 0 || j < 0 || i >= q.length || j >= q.length) return false; const t = q[i]; q[i] = q[j]; q[j] = t; return true; }
function queueMove(g, from, to) { const q = g.queue; if (g.shot || !q || from === to || from < 0 || to < 0 || from >= q.length || to >= q.length) return false; q.splice(to, 0, q.splice(from, 1)[0]); return true; }
// Does a reaction fit anywhere on the molecule AS IT STANDS NOW? This reads the present only: nothing is tried and
// nothing that the line would do first is counted. The page may grey a reaction (in the hand or in a circle) that
// fits nowhere now. The bank fits when it could be used now.
function fitsNow(g, id) { if (id === BANKID) return canBank(g); const c = RX.CARDS[id]; return !!c && c.find(g.m).length > 0; }
const queueFits = g => (g.queue || []).map(id => fitsNow(g, id));
function queueDrop(g, i) { if (g.shot || !g.queue || i < 0 || i >= g.queue.length) return false; g.queue.splice(i, 1); return true; }
// what the first thing in the queue will do when its turn comes now: take (a reaction), bank, finish, or waste
function queueHead(g) {
  const id = g.queue[0]; if (id == null) return null;
  if (id === BANKID) return { id, kind: canBank(g) ? 'bank' : 'waste' };
  if (id === SYN.finish) { const f = finishOpt(g); return f ? { id, kind: 'finish', o: f } : { id, kind: 'waste' }; }
  const o = options(g)[id]; return o ? { id, kind: 'take', o } : { id, kind: 'waste' };
}
// a circle whose reagent found nothing to act on: the reaction of the page is gone and so is the use
function waste(g, id) { const wsig = RX.MODE.eng && id !== BANKID ? RX.ENG.sigOf(g.m, ENGID[id] || id) : null; g.lastOn = false; if (RULE.jarStart && id !== BANKID && id !== SYN.finish) homEvent(g, 'dud');      // jarStart: a reagent that found nothing feeds the wood spirit
  if (id !== BANKID && id !== SYN.finish && !(g.free && g.free[id]) && g.left[id] > 0) g.left[id]--; g.pageSteps++; g.wastedNow = (g.wastedNow || 0) + 1; g.tally.wasted = (g.tally.wasted || 0) + 1; g.trail.push({ id, hits: 0, cont: false, wasted: true, free: false, sig: wsig ? [wsig] : null, ev: [] }); }
// takes the head of the queue off it; the page then plays what queueHead said it would do
function queueShift(g) { g.shot = true; return g.queue.shift(); }
// fires the head of the queue and returns what it did. A cascade is set off only by a reagent that acted: a wasted
// circle and the bank change nothing on the molecule and set nothing off
function queueStep(g) { const h = queueHead(g); if (!h) return null; queueShift(g); if (h.kind === 'bank') bank(g); else if (h.kind === 'finish') synFinish(g, h.o); else if (h.kind === 'take') synTake(g, h.o); else waste(g, h.id); if (h.kind !== 'finish') afterTurn(g, h.kind === 'take'); return h; }
// What the page may know while a line is being built (the owner, HARNESS P: nothing shows what a line will do before it is
// fired). Only the present: which reagents of the hand fit somewhere on the molecule as it stands now (o, with no places
// marked on the molecule), whether the bank could be used now, and for each queued circle whether it fits now (kinds:
// 'take', 'bank', 'finish' or 'waste'; fits is the same as booleans). Nothing is tried, nothing a queued circle would do first
// is counted, and no atom is mapped forward (fwd is null).
function queueView(g) {
  const live = g.over ? {} : options(g, true), o = {}; Object.keys(live).forEach(id => { o[id] = Object.assign({}, live[id], { atoms: [] }); });
  const fin = g.over ? null : finishOpt(g), row = g.cur.path.length, fits = queueFits(g);
  const kinds = (g.queue || []).map((id, i) => (id === BANKID ? (fits[i] ? 'bank' : 'waste') : id === SYN.finish ? (fin ? 'finish' : 'waste') : fits[i] ? 'take' : 'waste'));
  return { o, fin, bank: !g.over && !!RULE.bank && g.cur.path.length >= RULE.bankMin && g.P > 0, kinds, fits, fwd: null, row, casc: 0 };
}
// the fire extinguisher: stops a chain that is running; the round counts half again once the page is over
function douse(g) { if (!g.gear.includes('extinguisher') || !g.chain || g.doused) return false; g.chain = false; g.doused = 1; return true; }
const doused = g => { if (g.doused === 1) { g.E *= 1.5; g.doused = 2; } };
function turn(g, rnd) { doused(g); homAfter(g); specPage(g); if (g.page >= pagesOf(g) || (hom2On(g) && g.hom.end)) return false; g.cascBest = Math.max(g.cascBest || 0, g.casc || 0); g.page++; if (g.condenser && !g.frozenAt && g.page >= pagesOf(g)) g.frozenAt = { P: g.P, R: g.R, E: g.E, bank: g.bank }; g.back = g.gear.includes('raven') ? g.cur.used[g.cur.used.length - 1] : null; reopenAll(g); synDeal(g, rnd); frozenPay(g); return true; }
// the finishing reagent, on the last page only
function finishOpt(g) {
  if (g.page < pagesOf(g) || !RX.CARDS[SYN.finish].find(g.m).length) return null;
  const t = tryOne(g, g.m, SYN.finish), r = t.r; if (!r.hits) return null;
  return { id: SYN.finish, model: t.model, map: t.map, r, finish: true, loop: false, spoil: false, cont: true, atoms: RX.CARDS[SYN.finish].find(g.m).reduce((a, x) => a.concat(x.atoms), []) };
}
// The monkey's paw: one wish a round, three a run. The round is doubled and a reagent is gone from the run for good.
// Returns the reagent taken, '' when the rack was too short to take from, or null when no wish was made.
function wish(g, run) {
  if (!g.gear.includes('paw') || g.wished || g.over || (run.wishes || 0) >= 3) return null;
  g.wished = true; run.wishes = (run.wishes || 0) + 1; g.E *= 2;
  if (run.rack.length <= 3) return '';
  const id = run.rack[Math.floor(rand() * run.rack.length)]; run.rack = run.rack.filter(q => q !== id); return id;
}
function synEnd(g) { doused(g); specPage(g); close(g); if (g.gear.includes('pact')) g.E *= 3; g.total = made(g); g.over = true; }
function synFinish(g, o) {
  g.left[SYN.finish] = 1; synTake(g, o);
  const v = SYN.finishExtra * o.r.hits; g.E += v;
  g.trail[g.trail.length - 1].ev.push({ src: 'finish', part: 'e', op: 'add', val: v, P: g.P, R: g.R, E: g.E, made: made(g) });
  synEnd(g);
}
// Plain players, used to set the number to beat and to measure styles of play.
//   row: follows on when it can.  wide: changes the most places.  back: returns to an earlier molecule when it can.
//   apart: avoids following on.  mixed: prefers a reagent not yet used.
const STYLES = {
  row: (o, ids) => { const c = ids.filter(i => o[i].cont); return c.length ? c : ids; },
  wide: (o, ids) => { const m = Math.max(...ids.map(i => o[i].r.hits)); return ids.filter(i => o[i].r.hits === m); },
  back: (o, ids) => { const c = ids.filter(i => o[i].loop); return c.length ? c : ids; },
  apart: (o, ids) => { const c = ids.filter(i => !o[i].cont); return c.length ? c : ids; },
  mixed: (o, ids, g) => { const c = ids.filter(i => !g.cur.used.includes(i)); return c.length ? c : ids; }
};
// greedy: takes whatever would make the most right now. It is the nearest thing here to a player who reads the page,
// and it is kept out of STYLES so that the numbers to beat are not set by it.
const GREEDY = (o, ids, g) => { let best = ids[0], top = -1; ids.forEach(id => { const v = peek(g, o[id]).gain; if (v > top) { top = v; best = id; } }); return [best]; };
function synPlay(feed, rnd, gear, run, style) {
  const g = synBegin(feed, false, rnd, gear, run), R = rnd || rand, pick = style === 'greedy' ? GREEDY : STYLES[style || 'row'];
  for (;;) {
    for (;;) {
      const o = options(g), ids = Object.keys(o); if (!ids.length) break;
      const from = pick(o, ids, g); let best = from[0];
      from.forEach(id => { if (o[id].r.hits > o[best].r.hits || (o[id].r.hits === o[best].r.hits && R() < 0.5)) best = id; });
      synTake(g, o[best]);
    }
    if (fire(g)) for (let a = chainOpts(g); a.length; a = chainOpts(g)) { let c = a[0], top = -1; if (a.length > 1) a.forEach(q => { const v = peek(g, q).gain; if (v > top) { top = v; c = q; } }); synTake(g, c, true); }
    if (!turn(g, rnd)) break;
  }
  synEnd(g);
  return g.total;
}
function synQuota(feed, n, gear, run) {
  const a = []; for (let i = 0; i < (n || 40); i++) a.push(synPlay(feed, null, gear, run)); a.sort((x, y) => x - y);
  const q = a[Math.floor(a.length * 0.25)], mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(10, q))) - 1));
  return Math.max(50, Math.round(q / mag) * mag);
}

// ---------- the screen: what a molecule can cascade to, worked out from its structure alone ----------
// No round, no deal, no score: reagents and the kinds of cascade are applied to the bare graph. It answers in
// milliseconds, so molecules and sets of reagents are designed with it and whole runs are kept for the number to beat.
// selfRun: the molecule reacts with itself until nothing is left to react; returns the steps.
// far (optional): the across steps made so far this turn, by kind; it is added to, so a line of three makes each across kind once as a page does.
function selfRun(m, self, far) { if (RX.MODE.eng) { const ENG = RX.ENG, held = self.map(id => ENG.KIND[id]).filter(Boolean), st = ENG.settle(m, held, Object.assign({}, far), CASC.most).steps; if (far) st.forEach(k => { if (ENG.R[k].far) far[k] = (far[k] || 0) + 1; }); return st.length; } let n = 0; for (let go = true; go && n < CASC.most;) { go = false; for (const id of self) { const card = RX.CARDS[id]; if (!card.find(m).length) continue; card.apply(m).leaving.flat().forEach(a => m.removeAtom(a)); n++; go = true; break; } } return n; }
// one reagent on a copy, then the cascade. A reagent that finds nothing, or would grow the molecule past the size
// limit, changes nothing and sets nothing off (as a wasted circle on the page).
function screenStep(m, id, self, far) { const c = RX.cloneModel(m), h0 = heavy(c), t = RX.cloneModel(c); const hits = RX.runCard(t, RX.CARDS[id]); const use = hits > 0 && !(RULE.atoms && heavy(t) > RULE.atoms && heavy(t) > h0) ? t : c; return { m: use, n: use === t ? selfRun(use, self, far) : 0, acted: use === t }; }
// every ordered line of `depth` reagents from the pool on molecule m: Map of 'a b c' to { n: steps, m: what is left }
function screenLines(m, pool, self, depth) { const out = new Map(); (function go(mm, line, n, far) { if (line.length === (depth || 3)) { out.set(line.join(' '), { n, m: mm }); return; } pool.forEach(id => { const f2 = Object.assign({}, far), r = screenStep(mm, id, self, f2); go(r.m, line.concat(id), n + r.n, f2); }); })(m, [], 0, {}); return out; }
// screen(smiles or model, pool, self): the steps as dealt, the best line of three from the whole pool, the best from
// each deal of `hand` reagents of the pool (every deal counted once), and how many of all lines reach 1 and 3 steps.
function screen(feed, pool, self, hand) {
  pool = pool || RUNG.start; self = self || SELF0; const m0 = feed.atoms ? RX.cloneModel(feed) : RX.fromSmiles(feed); anchorSet(m0); RX.reopen(m0);
  const dealt = selfRun(RX.cloneModel(m0), self), lines = screenLines(m0, pool, self, 3); let best = -1, line = '', ge1 = 0, ge3 = 0;
  lines.forEach((v, k) => { if (v.n > best) { best = v.n; line = k; } if (v.n >= 1) ge1++; if (v.n >= 3) ge3++; });
  const k = Math.min(hand || RULE.hand || 5, pool.length), hands = [], pick = (from, got) => { if (got.length === k) { let b = 0; lines.forEach((v, key) => { if (v.n > b && key.split(' ').every(id => got.includes(id))) b = v.n; }); hands.push(b); return; } for (let i = from; i < pool.length; i++) pick(i + 1, got.concat(pool[i])); }; pick(0, []);
  return { heavy: heavy(m0), dealt, best, line, hands, ge1: ge1 / lines.size, ge3: ge3 / lines.size };
}
// screenRound: three pages on one molecule as a player who goes for the longest cascade would play them. Each page a
// hand is dealt from the pool (R is the source of chance), the line of three with the most steps is fired, every
// reagent has RULE.uses uses, and the zip rings open again before the next page. Returns the steps of each page.
function screenRound(feed, pool, self, R, pages) {
  pool = pool || RUNG.start; self = self || SELF0; R = R || rand; let m = feed.atoms ? RX.cloneModel(feed) : RX.fromSmiles(feed); anchorSet(m); RX.reopen(m);
  const left = {}, out = []; pool.forEach(id => { left[id] = TIER[id] === 'rare' ? Math.max(1, RULE.uses - 1) : RULE.uses; });
  for (let p = 0; p < (pages || SYN.pages); p++) {
    const bag = pool.filter(id => left[id] > 0), hand = []; while (hand.length < Math.min(RULE.hand || 5, bag.length)) hand.push(bag.splice(Math.floor(R() * bag.length), 1)[0]);
    let best = null; screenLines(m, hand, self, 3).forEach((v, key) => { const ids = key.split(' '), cnt = {}; ids.forEach(id => { cnt[id] = (cnt[id] || 0) + 1; }); if (ids.some(id => cnt[id] > left[id])) return; if (!best || v.n > best.n) best = { n: v.n, m: v.m, ids }; });
    if (!best) { out.push(selfRun(m, self)); } else { out.push(best.n); best.ids.forEach(id => { left[id]--; }); m = best.m; }
    m = RX.cloneModel(m); RX.reopen(m);
  }
  return out;
}
// ---------- a run: rounds one after another until one is missed ----------
// A run starts with four reagents and no equipment. Before the first round and after every round beaten the player
// takes one of three: a new reagent, a new piece of equipment, a level for a piece they hold, a stronger reagent,
// or one more use of a reagent on every page. What can turn up depends on the suppliers that have been opened.
// Each round has a number to beat that is set by the round and not by what the player holds, so a better build
// beats it by more.
// growth, late, knee, first and ask belonged to the old number to beat and are no longer read: see PAR
const RUNG = { slots: 5, growth: 1.75, late: 1.5, knee: 3, first: 0.6, ask: 1, start: ['hydrate', 'pcc', 'allyl', 'thiolene', 'dehydrate', 'ritter'] };   // ruling AF: thiolene (S) and ritter (N) replace hydroborate and reduce; RULE.oldSix is not kept
// The deal of the first rounds. Two of the starting reagents wreck a chain when they are fired at it open: dehydrate
// takes off the OH a zip starts from and grow turns every C=O into an OH. A player who does not yet read the page fires
// them first half the time. So round one is dealt from the other four, dehydrate joins the deal in round two and grow
// in round three. Measured with the screen (docs/RIG.md): with four, nine lines of three in ten set the zip off on the
// molecules of round one; with all six, six in ten.
// (2026-11-11, the bare game: dehydrate joined in round two and grow in round three. Dehydrate doubled what a reader
// makes and grow tripled it, and neither added anything for a player who places at random. Dehydrate now joins in
// round three and grow in round five: docs/RIG.md, fourth measure.)
// (2026-11-11, tier one: dehydrate now joins in round four, so the three rounds of a first run are dealt from four
// reactions. With dehydrate in round three a reader made 5.7 times what a player placing at random made there, and
// 2.8 times without it: docs/RIG.md, fifth measure.)
RUNG.from = { dehydrate: 4, allyl: 5 };
// RULE.deal6 (owner, 2026-11-11): all six starting reagents are in the deal from round one, five dealt from the six, three fired.
RULE.deal6 = true;
const dealtIn = (run, id) => RULE.deal6 || !(RUNG.from[id] > ((run && run.round) || 1));
// Suppliers are opened between runs with credit. Each one adds reagents and equipment to what a run can turn up.
// A run pays one credit for every round beaten.
// A reagent that makes a halide is a dead end without a base to take the halide off again, so the two come as one pick.
const PAIR = { hcl: 'koh', socl2: 'naoh' };
const SUPPLY = [
  { name: 'corner chemist', cost: 0, reagents: ['hwe', 'dihydroxylation', 'ozonolysis', 'permanganate', 'ritter', 'thiolene', 'chlorination', 'cyanohydrin', 'hofmann', 'chugaev', 'hydroformylation', 'epoxidation'], gear: ['balance', 'stirrer', 'cards', 'spatula', 'stopwatch', 'litmus', 'dryer', 'duck', 'poster', 'coffee', 'milk', 'goggles', 'intern'] },
  { name: 'trade supplier', cost: 6, kin: ['arene'], reagents: [], gear: ['cannula', 'coldtrap', 'schlenk', 'burette', 'logbook', 'scalepan', 'stopper', 'hood', 'scrubber', 'coat', 'mystery', 'grant', 'extinguisher'] },
  { name: 'research supplier', cost: 16, kin: ['sugar'], reagents: [], gear: ['reflux', 'crystal', 'mortar', 'thermometer', 'bunsen', 'dropper', 'mirror', 'sieves'], rare: true },
  { name: 'instrument maker', cost: 30, kin: ['cage'], reagents: [], gear: ['clamp', 'magnet', 'recycler', 'carousel', 'loupe', 'timer'] },
  { name: 'an alchemist, by appointment', cost: 50, reagents: [], gear: ['stone', 'transmute', 'regia', 'ouroboros', 'homunculus', 'elixir'] },
  { name: 'Brenda (deceased)', cost: 80, reagents: [], gear: ['ouija', 'candle', 'goat', 'pact', 'voodoo', 'tower', 'cat', 'paw', 'idol', 'grimoire', 'hourglass', 'raven', 'glory', 'orb'] }
];
// own: the instruments the profile holds (run.instruments, from profileOpts): when given, these are what a run can offer, whatever the supplier
const stock = (tier, own) => { const o = { reagents: [], gear: [], rare: false }; SUPPLY.forEach((sp, i) => { if (i <= tier) { o.reagents.push(...sp.reagents); o.gear.push(...sp.gear); if (sp.rare) o.rare = true; } }); if (RULE.cascade) { o.reagents = o.reagents.filter(id => !SELF.some(q => q.id === id) && !(RULE.ban || []).includes(id)); o.gear = o.gear.filter(id => id !== 'extinguisher'); } if (RULE.five) o.gear = Object.keys(FIVE).filter(id => FIVE[id] <= tier && !(RULE.ban || []).includes(id)); if (RULE.five && own) o.gear = Object.keys(FIVE).filter(id => own.includes(id) && !(RULE.ban || []).includes(id)); return o; };
// MODEL.relaxed false skips settling a new molecule into shape. The rules do not read the shape, so a simulation
// with no page turns it off to save the time.
const MODEL = { relaxed: true };
const modelOf = feed => { const m = feed.atoms ? RX.cloneMap(feed).model : MODEL.relaxed ? AA.Model.fromSmilesRelaxed(feed, 4) : RX.fromSmiles(feed); m.center(); return m; };
// No longer used for the number to beat (see runQuota). Kept so that briefBase can still be called.
// what a plain player makes from a molecule under a brief, with the starting reagents and the style that suits it best
// Measured on 2026-11-10 with 12 plays for each style of play, chains included: the lower quarter of the best style. Measure again
// after any change to the rules of a round, or delete the table and it is measured as needed.
const BASE = {"C=CCC(O)CC=C|plain":46717,"C=CCC(O)CC=C|broad":57346,"C=CCC(O)CC=C|loose":128628,"C=CCC(O)CC=C|each":19351,"C=CCC(O)CC=C|back":82100,"C=CCC(O)CC=C|scarce":11647,"C=CCC(O)CC=C|short":6199,"CC(O)CCC=C|plain":13164,"CC(O)CCC=C|broad":61230,"CC(O)CCC=C|loose":26778,"CC(O)CCC=C|each":9422,"CC(O)CCC=C|back":30005,"CC(O)CCC=C|scarce":4163,"CC(O)CCC=C|short":4301,"CC(=O)CCC(O)CC=C|plain":95219,"CC(=O)CCC(O)CC=C|broad":119267,"CC(=O)CCC(O)CC=C|loose":119873,"CC(=O)CCC(O)CC=C|each":25331,"CC(=O)CCC(O)CC=C|back":123612,"CC(=O)CCC(O)CC=C|scarce":15047,"CC(=O)CCC(O)CC=C|short":14040,"C=CCC(O)CC(O)CC=C|plain":125004,"C=CCC(O)CC(O)CC=C|broad":375348,"C=CCC(O)CC(O)CC=C|loose":689711,"C=CCC(O)CC(O)CC=C|each":73971,"C=CCC(O)CC(O)CC=C|back":307476,"C=CCC(O)CC(O)CC=C|scarce":21483,"C=CCC(O)CC(O)CC=C|short":38726,"C=CCC(=O)CCC(=O)CC=C|plain":120876,"C=CCC(=O)CCC(=O)CC=C|broad":229641,"C=CCC(=O)CCC(=O)CC=C|loose":372693,"C=CCC(=O)CCC(=O)CC=C|each":34118,"C=CCC(=O)CCC(=O)CC=C|back":196268,"C=CCC(=O)CCC(=O)CC=C|scarce":21522,"C=CCC(=O)CCC(=O)CC=C|short":24318,"CC(O)CC(=O)CCC(Cl)CCC=C|plain":40767,"CC(O)CC(=O)CCC(Cl)CCC=C|broad":64359,"CC(O)CC(=O)CCC(Cl)CCC=C|loose":171168,"CC(O)CC(=O)CCC(Cl)CCC=C|each":41693,"CC(O)CC(=O)CCC(Cl)CCC=C|back":96619,"CC(O)CC(=O)CCC(Cl)CCC=C|scarce":7737,"CC(O)CC(=O)CCC(Cl)CCC=C|short":7737,"O=C1CCC(CC=C)CC1|plain":15405,"O=C1CCC(CC=C)CC1|broad":29111,"O=C1CCC(CC=C)CC1|loose":38573,"O=C1CCC(CC=C)CC1|each":2897,"O=C1CCC(CC=C)CC1|back":28539,"O=C1CCC(CC=C)CC1|scarce":4153,"O=C1CCC(CC=C)CC1|short":3835,"C=CCC(O)C1=CC=CC=C1|plain":350785,"C=CCC(O)C1=CC=CC=C1|broad":608832,"C=CCC(O)C1=CC=CC=C1|loose":138106,"C=CCC(O)C1=CC=CC=C1|each":47051,"C=CCC(O)C1=CC=CC=C1|back":367459,"C=CCC(O)C1=CC=CC=C1|scarce":22044,"C=CCC(O)C1=CC=CC=C1|short":62183,"C=CC1CCC(O)CC1|plain":9506,"C=CC1CCC(O)CC1|broad":16834,"C=CC1CCC(O)CC1|loose":19529,"C=CC1CCC(O)CC1|each":3416,"C=CC1CCC(O)CC1|back":18213,"C=CC1CCC(O)CC1|scarce":2536,"C=CC1CCC(O)CC1|short":3172,"CC(=O)CCC(O)C1=CC=CC=C1|plain":163960,"CC(=O)CCC(O)C1=CC=CC=C1|broad":411858,"CC(=O)CCC(O)C1=CC=CC=C1|loose":353614,"CC(=O)CCC(O)C1=CC=CC=C1|each":59117,"CC(=O)CCC(O)C1=CC=CC=C1|back":394617,"CC(=O)CCC(O)C1=CC=CC=C1|scarce":31981,"CC(=O)CCC(O)C1=CC=CC=C1|short":42086,"C=CC12C3C4C1C5C2C3C45CO|plain":58019,"C=CC12C3C4C1C5C2C3C45CO|broad":180651,"C=CC12C3C4C1C5C2C3C45CO|loose":25895,"C=CC12C3C4C1C5C2C3C45CO|each":4322,"C=CC12C3C4C1C5C2C3C45CO|back":118597,"C=CC12C3C4C1C5C2C3C45CO|scarce":4671,"C=CC12C3C4C1C5C2C3C45CO|short":20028,"OC1C2CC3CC(C2)CC1C3|plain":782,"OC1C2CC3CC(C2)CC1C3|broad":1035,"OC1C2CC3CC(C2)CC1C3|loose":2664,"OC1C2CC3CC(C2)CC1C3|each":1488,"OC1C2CC3CC(C2)CC1C3|back":1143,"OC1C2CC3CC(C2)CC1C3|scarce":587,"OC1C2CC3CC(C2)CC1C3|short":194,"OC1CC2CC1C=C2|plain":3907,"OC1CC2CC1C=C2|broad":4012,"OC1CC2CC1C=C2|loose":6406,"OC1CC2CC1C=C2|each":2806,"OC1CC2CC1C=C2|back":5230,"OC1CC2CC1C=C2|scarce":7555,"OC1CC2CC1C=C2|short":4905,"OCC1OC(O)C(O)C(O)C1O|plain":384411,"OCC1OC(O)C(O)C(O)C1O|broad":731756,"OCC1OC(O)C(O)C(O)C1O|loose":1591225,"OCC1OC(O)C(O)C(O)C1O|each":13081,"OCC1OC(O)C(O)C(O)C1O|back":610022,"OCC1OC(O)C(O)C(O)C1O|scarce":24460,"OCC1OC(O)C(O)C(O)C1O|short":96330,"OC1CCC(O)CC1|plain":35008,"OC1CCC(O)CC1|broad":65311,"OC1CCC(O)CC1|loose":101874,"OC1CCC(O)CC1|each":12915,"OC1CCC(O)CC1|back":55218,"OC1CCC(O)CC1|scarce":6692,"OC1CCC(O)CC1|short":11205,"O=C1CCC(O)CC1C=C|plain":20534,"O=C1CCC(O)CC1C=C|broad":26143,"O=C1CCC(O)CC1C=C|loose":33406,"O=C1CCC(O)CC1C=C|each":30883,"O=C1CCC(O)CC1C=C|back":35918,"O=C1CCC(O)CC1C=C|scarce":9348,"O=C1CCC(O)CC1C=C|short":13563,"OC(C=C)C1=CC=CC=C1|plain":327810,"OC(C=C)C1=CC=CC=C1|broad":578890,"OC(C=C)C1=CC=CC=C1|loose":119936,"OC(C=C)C1=CC=CC=C1|each":21514,"OC(C=C)C1=CC=CC=C1|back":130020,"OC(C=C)C1=CC=CC=C1|scarce":11405,"OC(C=C)C1=CC=CC=C1|short":20474,"CC(O)CC(=O)C1=CC=CC=C1|plain":57484,"CC(O)CC(=O)C1=CC=CC=C1|broad":178753,"CC(O)CC(=O)C1=CC=CC=C1|loose":76813,"CC(O)CC(=O)C1=CC=CC=C1|each":22631,"CC(O)CC(=O)C1=CC=CC=C1|back":191117,"CC(O)CC(=O)C1=CC=CC=C1|scarce":17554,"CC(O)CC(=O)C1=CC=CC=C1|short":13522,"OCC12C3C4C1C5C2C3C45CO|plain":346953,"OCC12C3C4C1C5C2C3C45CO|broad":322296,"OCC12C3C4C1C5C2C3C45CO|loose":368786,"OCC12C3C4C1C5C2C3C45CO|each":20613,"OCC12C3C4C1C5C2C3C45CO|back":203959,"OCC12C3C4C1C5C2C3C45CO|scarce":17353,"OCC12C3C4C1C5C2C3C45CO|short":43710,"OC1CC2CCC1C=C2|plain":2399,"OC1CC2CCC1C=C2|broad":6591,"OC1CC2CCC1C=C2|loose":5820,"OC1CC2CCC1C=C2|each":2041,"OC1CC2CCC1C=C2|back":9853,"OC1CC2CCC1C=C2|scarce":7555,"OC1CC2CCC1C=C2|short":4808,"OCC(O)C(O)C(O)C(O)C=O|plain":1665738,"OCC(O)C(O)C(O)C(O)C=O|broad":3267744,"OCC(O)C(O)C(O)C(O)C=O|loose":6039791,"OCC(O)C(O)C(O)C(O)C=O|each":40777,"OCC(O)C(O)C(O)C(O)C=O|back":2293284,"OCC(O)C(O)C(O)C(O)C=O|scarce":79060,"OCC(O)C(O)C(O)C(O)C=O|short":448840,"OCC1OC(O)CC1O|plain":35822,"OCC1OC(O)CC1O|broad":157417,"OCC1OC(O)CC1O|loose":357133,"OCC1OC(O)CC1O|each":2771,"OCC1OC(O)CC1O|back":149263,"OCC1OC(O)CC1O|scarce":5677,"OCC1OC(O)CC1O|short":20057,"OCC(O)CO|plain":270180,"OCC(O)CO|broad":520615,"OCC(O)CO|loose":1143279,"OCC(O)CO|each":9833,"OCC(O)CO|back":442688,"OCC(O)CO|scarce":14091,"OCC(O)CO|short":64407};
function briefBase(feed, brief) {
  const k = (feed.atoms ? RX.sigOf(feed) : feed) + '|' + brief; if (BASE[k]) return BASE[k];
  const run = { rack: RUNG.start, grade: {}, lv: {}, uses: {}, rare: false, brief }; let top = 0;
  Object.keys(STYLES).forEach(sty => { const a = []; for (let i = 0; i < 12; i++) a.push(synPlay(feed, null, [], run, sty)); a.sort((x, y) => x - y); top = Math.max(top, a[3]); });
  return (BASE[k] = Math.max(20, top));
}
// An assay: every third round is one round and not a choice of three. Its kind is one of the harder kinds, fixed for
// each act when the run starts. A run is nine rounds in three acts; past round nine the assays come round again.
const ASSAYS = ['scarce', 'short', 'each', 'loose'];
function runAssays(run, rnd) { const R = rnd || rand, a = ASSAYS.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } run.assay = a.slice(0, 3); return run; }
const assayOf = (run, round) => { const r = round || run.round; return run.assay && r % 3 === 0 ? run.assay[(r / 3 - 1) % run.assay.length] : null; };
// before each round: three rounds to choose from, each a molecule, a brief, a number to beat and what it pays
function runBriefs(run, rnd) {
  modeSync(run);
  const R = rnd || rand, mix = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  const open = Object.keys(KIN).filter(k => KIN[k].tier <= (run.tier || 0)), draw = () => { let t = 0; open.forEach(k => { t += KIN[k].odds; }); let v = R() * t, pick = 'chain'; for (const k of open) { v -= KIN[k].odds; if (v < 0) { pick = k; break; } } return pick; };
  // RULE.hetCurve (ruling AF2: rarer elements become more common as the rounds get deeper): the share of dealt molecules that hold an element other than C, H and O, by round.
  // Each molecule is first decided to be one or not; it is then taken from the family drawn if that family has such a molecule for the round, else from any family of the round.
  // RULE.dealFlat (seventeenth, on): a molecule is drawn from ALL the round's molecules that fit, as the simulator deals and as every pass mark was fitted.
  // Off, the family was drawn first (chain 38, ring 24; arene and cage are not open in a new game) and the molecule from that family only: round 4 has two plain
  // chain molecules in its pool, so each came up about one deal in eight, and the round's arene and cage molecules were hardly dealt at all.
  const hcL = (run.tierNo === 1 && RULE.hetCurveB) || RULE.hetCurve;      // the bachelor's has its own curve (more N, S and Cl in a first game)
  const hc = !AA.rxFeedOld && hcL ? hcL[Math.max(1, Math.min(hcL.length, run.round | 0)) - 1] : null, rr0 = Math.max(1, Math.min(9, run.round | 0));
  const hetPick = (k, skip) => { const want = R() < hc, fit = f => hetFeed(f) === want; let of = RULE.dealFlat ? [] : feedsFor(k, run.round, skip).filter(fit); if (!of.length) { const all = FEEDS.filter(f => (FEED_ROUNDS[f] || []).includes(rr0) && !skip.includes(f) && fit(f)), pl = all.filter(f => !FEED_BANK[f]), bk = all.filter(f => FEED_BANK[f]); of = ((R() < P_POOL[rr0 - 1] || !bk.length) && pl.length) ? pl : (bk.length ? bk : pl); } return of.length ? of : (RULE.dealFlat ? FEEDS.filter(f => (FEED_ROUNDS[f] || []).includes(rr0) && !skip.includes(f)) : feedsFor(k, run.round, skip)); };
  const clL = !AA.rxFeedOld && RULE.clEarly && FEED_CL[run.round | 0] ? RULE.clEarly[(run.round | 0) - 1] || 0 : 0, clPick = skip => (clL > 0 && R() < clL ? FEED_CL[run.round | 0].filter(f => !skip.includes(f) && FEEDS.includes(f)) : []);
  const elL = !AA.rxFeedOld && RULE.elLate && run.tierNo !== 1 ? RULE.elLate[rr0] : null, elPick = skip => { if (!elL) return []; for (const el of ['Cl', 'S', 'N']) { if (elL[el] > 0 && R() < elL[el]) { const of = FEEDS.filter(f => (FEED_ROUNDS[f] || []).includes(rr0) && !skip.includes(f) && EL_RE[el].test(f)); if (of.length) return of; } } return []; };
  const feeds = []; for (let guard = 0; feeds.length < 3 && guard < 80; guard++) { const cl = clPick(feeds); if (cl.length) { feeds.push(cl[Math.floor(R() * cl.length)]); continue; } const el = elPick(feeds); if (el.length) { feeds.push(el[Math.floor(R() * el.length)]); continue; } const k = draw(), of = hc != null ? hetPick(k, feeds) : feedsFor(k, run.round, feeds); if (of.length && (hc != null || open.length < 3 || !feeds.some(f => KIN_OF[f] === k))) feeds.push(of[Math.floor(R() * of.length)]); }
  while (feeds.length < 3) feeds.push(feedsFor('chain', run.round, feeds)[0] || FEEDS.filter(f => !feeds.includes(f))[0]);
  const as = assayOf(run);
  // Choosing the molecule (docs/LOOP.md): two molecules of the round's size, one is taken, free. Both are plain rounds,
  // or both the round's assay. The one that is harder to set off by the screen pays coins on top when it is beaten.
  if (RULE.choose) { const n = run.single ? 1 : 2, br = as || 'plain', out = feeds.slice(0, n).map(f => ({ brief: br, pays: as ? 2 : null, assay: !!as, model: salt(modelOf(f), R), kin: kinOf(f), src: f, quota: runQuota(run, f, br), ease: easeOf(run, f), coins: 0 }));
    if (RULE.spec) out.forEach(o => { o.spec = specFor(run, o.model, R, o.brief); o.hurdle = { kind: o.spec.mark, n: o.spec.n }; });
    if (n === 2) { const hard = out[0].ease <= out[1].ease ? 0 : 1, d = Math.abs(out[0].ease - out[1].ease); out[hard].coins = d >= CHOOSE.two ? 2 : d >= CHOOSE.one ? 1 : 0; } return out; }
  if (as) return [{ brief: as, pays: 2, assay: true, model: salt(modelOf(feeds[0]), R), kin: kinOf(feeds[0]), src: feeds[0], quota: runQuota(run, feeds[0], as) }];
  const sp = mix(BRIEFS.filter(b => b.id !== 'plain' && b.id !== 'carry')), pay = mix([1, 2]);
  // the molecule left by the last round can be carried on with, while a reagent held still acts on it
  // (with a size limit, a reagent that could only grow a molecule already at the limit does not count)
  const carry = run.last && (() => { const g0 = begin(run.last, false, run.rack.slice(), null, []); g0.left = {}; run.rack.forEach(id => { g0.left[id] = 1; }); return Object.keys(options(g0)).length >= 1; })();
  return [{ brief: carry ? 'carry' : 'plain', pays: null }, { brief: sp[0].id, pays: pay[0] }, { brief: sp[1].id, pays: pay[1] }].map((o, i) => { const own = o.brief === 'carry'; o.model = own ? run.last : salt(modelOf(feeds[i]), R); o.kin = own ? (run.kin || 'chain') : kinOf(feeds[i]); o.src = own ? (run.src || null) : feeds[i]; o.quota = runQuota(run, own ? run.last : feeds[i], o.brief); return o; });
}
// How easy a molecule is to set off with the reactions the run holds, read off the structure (screen): the longest
// cascade a hand of five can set off, averaged over every hand, plus the share of all lines of three that set off any.
// CHOOSE: the harder of a pair pays one coin when it is this far behind, two when that far; `bad` and `coin` are what
// the simulated players go by (a pair worth drawing again; what a coin is worth in steps).
const CHOOSE = { one: 0.5, two: 2, most: 3, bad: 1.5, coin: 0.8 }, EASE = {};
function easeOf(run, src) { modeSync(run); const pool = run.rack || RUNG.start, self = heldFor(run), k = src + '|' + pool.join(',') + '|' + self.join(',') + '|' + [RX.MODE.co2 ? 1 : 0, RX.MODE.weld, RX.MODE.reach, RULE.atoms || 0, RULE.reopen ? 1 : 0, RULE.hand || 5].join(','); if (EASE[k] != null) return EASE[k]; const s = screen(src, pool, self), h = s.hands.length ? s.hands.reduce((a, b) => a + b, 0) / s.hands.length : s.best; return (EASE[k] = Math.round((h + s.ge1) * 100) / 100); }
// the pair drawn again: 1 coin, then 2, then 3 within one round; nothing when it cannot be paid or has been done three times
const pairCost = run => ((run.redraws || 0) >= CHOOSE.most ? null : 1 + (run.redraws || 0));
function runRedraw(run, rnd) { const c = pairCost(run); if (!RULE.choose || !RULE.coins || c == null || (run.coins || 0) < c) return null; run.coins -= c; run.redraws = (run.redraws || 0) + 1; return runBriefs(run, rnd); }
// the proof plays are played under the brief of the round (an assay changes the rules of the round)
const specFor = (run, model, R, brief) => specPick(model, run.round || 1, (run.rack || []).concat(run.self || SELF0), R, run.tierNo || 3, run.specHist || [], Object.assign({}, run, { brief: brief || run.brief }));
function runChoose(run, o) { { const H = run.hom && HOMS[run.hom]; if (H && H.brings && !bareRun(run) && !run.rack.includes(H.brings) && RX.CARDS[H.brings]) run.rack.push(H.brings); } run.spec = o.spec || null; if (o.spec) { run.specHist = (run.specHist || []).concat([o.spec.families]); } run.redraws = 0; run.payCoins = o.coins || 0; run.kin = o.kin || 'chain'; run.src = o.src || null; run.brief = o.brief; run.feed = o.model; run.quota = o.quota; run.pays = o.pays; run.carryE = 1 + ((run.lastE || 1) - 1) / 2; }
// keeps the molecule and the extra a beaten round ended on, for carrying on
function runKeep(run, g) { run.last = RX.cloneMap(g.m).model; run.lastE = g.E / (g.gear.includes('pact') ? 3 : 1); }
// pays the credit the brief promised and returns how much
function runPay(run) { const n = run.pays || 0; run.pays = null; run.bonus = (run.bonus || 0) + n; return n; }
// opts.tierNo: 1, 2 or 3 (TIERS). Without it a run is nine rounds with everything the switches allow, as before.
function runNew(tier, extra, opts) { const t = Math.max(0, Math.min(SUPPLY.length - 1, tier | 0)), st = stock(t), tn = runTierNo(opts), T = tn ? TIERS[tn] : null; return runAssays({ tierNo: tn || 3, len: lengthOf(tn || 3).name, span: T ? T.rounds : 9, bare: !!(T && T.bare), six: !!(T && T.bare), noGear: !!(T && !T.helpers), noHom: !!(T && !T.creatures), extra: (extra || []).slice(), round: 1, tier: t, rack: RUNG.start.slice(), rare: st.rare, gear: [], self: reflexesHeld(opts).slice(), unlocked: ((opts && opts.unlocked) || []).slice(), unlockedReagents: ((opts && opts.unlockedReagents) || []).slice(), sigils: ((opts && opts.sigils) || []).filter(id => SIGILS[id]).slice(0, RULE.sigilCap || 3), instruments: opts && opts.instruments ? opts.instruments.slice() : null, sigilsOwned: opts && opts.sigilsOwned ? opts.sigilsOwned.slice() : null, meta: (opts && opts.meta) || null, sign: opts && opts.sign != null ? (opts.sign | 0) : null, runsOut: Object.assign({}, (opts && opts.runsOut) || {}), motifOpen: (opts && opts.motifOpen) || null, lv: {}, grade: {}, uses: {}, base: {}, beaten: 0, over: false, brief: 'plain', feed: FEEDS[0], pays: null, bonus: 0, coins: 0, rerolls: 0, by: { water: 0, h2: 0, gauge: 0 } }); }
const runBegin = (run, feed, relaxed) => synBegin(feed, relaxed, null, run.gear, run);
// the number to beat is measured against a plain player with the starting four reagents and nothing else
// Terms are chosen before a run, one sigil for the whole run. Each changes the odds or the stakes and pays for it.
// The transmutation circle under the molecule. A reagent lights a rune the first time it is used; using it again
// lights nothing. A broken row puts out the last rune. A full circle multiplies the round and starts again. So the
// reagent that keeps the row going and the reagent that feeds the circle are often not the same one.
const CIRCLE = { plain: { n: 4, mul: 1.5 }, glass: { n: 3, mul: 2 }, occult: { n: 4, mul: 1.5 }, lean: { n: 3, mul: 1.5 }, long: { n: 5, mul: 2.5 }, hoard: { n: 4, mul: 1.5 } };
const TERMS = [
  { id: 'plain', name: 'plain', note: '' },
  { id: 'glass', name: 'glass', note: 'mult 3, one break', deed: 'no breaks' },
  { id: 'occult', name: 'occult', note: '+1 occult, beat 1.5', deed: 'round 5' },
  { id: 'lean', name: 'lean', note: '3 reagents, +1 use', deed: '2 reagents' },
  { id: 'long', name: 'long', note: '4 a page, 2 pages', deed: 'row of 10' },
  { id: 'hoard', name: 'hoard', note: '3 pieces, no more', deed: '5 pieces' }
];
// which sigils a finished round has earned: g is the round, run the run, pass whether the number was beaten
function deeds(g, run, pass) {
  const out = [];
  if (pass && g.tally.breaks === 0 && g.trail.length >= 6) out.push('glass');
  if (run.beaten >= 5) out.push('occult');
  if (pass && new Set(g.cur.used).size <= 2) out.push('lean');
  if (g.best >= 10) out.push('long');
  if (run.gear.length >= 5) out.push('hoard');
  return out;
}
function runTerm(run, id) {
  run.term = id; run.stake = 1; run.payMul = 1;
  if (id === 'glass') run.glass = true;
  else if (id === 'occult') { const occ = RULE.five ? Object.keys(FIVE) : Object.keys(GEARS).filter(k => GEARS[k].kin === 'occult' && k !== 'idol' && k !== 'pact'); run.gear.push(occ[Math.floor(rand() * occ.length)]); run.stake = 1.22; }
  else if (id === 'lean') { run.rack = RUNG.start.slice(0, 3); run.usesAll = 1; }
  else if (id === 'long') { run.steps = 1; run.pages = -1; }
  else if (id === 'hoard') { const pool = stock(run.tier, run.instruments).gear.slice(); for (let k = 0; k < 3 && pool.length; k++) run.gear.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]); run.noGear = true; }
  return run;
}
// The number to beat: Par for the round, times the square root of the molecule's size factor, times any stake the
// player chose (the pact, the idol, the hourglass, the terms of the run). It never reads the rest of the build, so a
// better build beats it by more. The method is in docs/BALANCE.md and the measurement in docs/RIG.md.
// GENERATED by the measuring rig (docs/RIG.md, docs/tools_sim.js) on 2026-11-11 from the rules at commit 53cbfa3.
// Do not edit by hand: measure again. Par of the bare game, fourth measure (docs/tools_par_bare.py): round one by the novice and the margin together, rounds two to five at a margin of 4 for the median player, rounds six to nine by its pass rate and margin.
// PAR.rounds: the number for a plain round on a molecule of average size in rounds one to nine, each fitted to the
// pass rate and the margin in docs/BALANCE.md together (docs/tools_par.py). after: the step for every round past nine.
// greedy median of the round total on molecules v2 (120 bare nine-round runs: 4770, 3500, 4118, 7340, 10295, 16248, 20038, 25187, 27028), made to rise by at least 1.15 a round
// FLAT (fourteenth measure): each is the square root rule applied to the table above it (4770, 5486, 6309, 7340, 10295, 16248, 20038, 25187, 28965; after 1.71)
const PAR = { rounds: [4770, 5115, 5486, 5917, 7008, 8804, 9777, 10961, 11754], after: 1.308, last: 1 };
// MOLF: what the median simulated player makes on each molecule inside runs, over the average of all the molecules.
// KINDF: what each kind of round makes against a plain one. ASSAYF: the same for the kind of an assay, for each of
// the three acts, over the average of the four kinds. Fitted together by docs/tools_factors.py. The number to beat is
// multiplied by all of them, so every kind of round and every molecule is beaten by a like margin.
const MOLF = {};   // the molecule factors were fitted on the old table (42 keys); molecules v2 have none until they are fitted again (tools_factors.py), so every molecule counts 1
const KINDF = {"plain":1.0,"carry":1.0,"broad":1.0,"loose":1.0,"each":1.0,"back":1.0,"scarce":1.0,"short":1.0};
const ASSAYF = {"scarce":[0.829,1.067,0.924],"short":[0.791,0.556,0.726],"each":[1.238,1.321,1.157],"loose":[1.232,1.278,1.288]};   // FLAT: the square roots of the fitted factors
const MOLD = { lo: 0.1, hi: 10, pow: 1 };
// Tier one (rounds one to three) baked again on 2026-11-12 after commit 3a7f800 (docs/tools_tier1_bake.py). ninth
// END GENERATED
// A molecule's size factor is held between lo and hi, and only its square root is taken: a molecule that makes more
// asks for more, but for less than it makes.
const parOf = round => { const r = Math.max(1, round | 0); return r <= 9 ? PAR.rounds[r - 1] * (r === 9 ? PAR.last : 1) : PAR.rounds[8] * PAR.last * Math.pow(PAR.after, r - 9); };
const molSize = key => Math.pow(Math.min(MOLD.hi, Math.max(MOLD.lo, MOLF[key] || 1)), MOLD.pow);
const kindSize = (run, brief, round) => { const r = round || run.round, a = assayOf(run, r) && ASSAYF[brief]; return a ? a[Math.min(2, Math.max(0, Math.floor(r / 3) - 1))] : KINDF[brief] || 1; };
// FLAT: these were 2, 1.5, 1.25 (and 1.5 for the occult supplier) on the old yield; they are the square roots, so each piece costs what it did
const stakeOf = run => (run.gear.includes('pact') ? 1.41 : 1) * (run.gear.includes('idol') ? 1.22 : 1) * (run.gear.includes('hourglass') ? 1.12 : 1) * (run.stake || 1);
// feed is the molecule's SMILES. A molecule carried on from the last round counts as the one it started as.
// A round that carries the last molecule on has no molecule factor: what it starts from is not what the factor measured.
const quotaParts = (run, feed, brief) => { const b = brief || run.brief || 'plain', st = stakeOf(run); return { par: parOf(run.round) * signBar(run), stake: st, mult: (b === 'carry' ? 1 : molSize(typeof feed === 'string' ? feed : run.src)) * kindSize(run, b) * st }; };
const nice = q => { const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(10, q))) - 1)); return Math.max(50, Math.round(q / mag) * mag); };
function runQuota(run, feed, brief) { const k = quotaParts(run, feed, brief); return nice(k.par * k.mult); }
// The marks above the number to beat, lowest first, and how many of them a total has reached. A total under the
// number has reached none.
const runMarks = quota => (RULE.tiers || []).map(t => nice(quota * t));
// marksOf(run): the four marks as multiples of the number to beat, for the page's heat and overshoot: [1, 1.41, 2, 2.83] (they were 1, 2, 4, 8
// before the flat rule). pass is the round's pass mark as the same kind of multiple (0 when the task alone clears the round); top is OVERREACT.
const marksOf = run => { const m = [1].concat(RULE.tiers || []); return { marks: m, top: m[m.length - 1], pass: run ? needShare(run) : 0, pow: FLAT.pow }; };
const marksHit = (total, quota) => (total >= quota ? runMarks(quota).filter(m => total >= m).length : 0);
// Coins live only inside a run. A beaten round pays one for each mark above the number that was reached, and coins
// already held pay interest first: one for every COIN.per held, COIN.cap at most. On the take-one page they are
// spent: the three offers are dealt again for 1, then 2, then 3 within one visit; a held piece of equipment is
// removed for COIN.bin. Leaving all three pays COIN.skip.
const COIN = { mark: 1, skip: 1, bin: 2, per: 3, cap: 2 };
const rerollCost = run => 1 + (run.rerolls || 0);
const interestOf = run => (RULE.coins ? Math.min(COIN.cap, Math.floor((run.coins || 0) / COIN.per)) : 0);
function runEarn(run, total, quota) { run.rerolls = 0; const extra = run.payCoins || 0; run.payCoins = 0; if (!RULE.coins || total < quota) return { marks: 0, interest: 0, extra: 0 }; const interest = interestOf(run), marks = marksHit(total, quota) * COIN.mark; run.coins = (run.coins || 0) + interest + marks + extra; return { marks, interest, extra }; }
function runReroll(run, rnd) { const c = rerollCost(run); if (!RULE.coins || (run.coins || 0) < c) return null; run.coins -= c; run.rerolls = (run.rerolls || 0) + 1; return runPicks(run, rnd); }
function runSkip(run) { run.rerolls = 0; if (RULE.coins) run.coins = (run.coins || 0) + COIN.skip; }
// The coin sink of a round (docs/LOOP.md, RIG.md): while a page is being lined up, coins buy one more use of a reaction
// of the hand, for this round only. The price rises with each one bought in the round (SINK.price) and starts again
// next round; past the end of the table no more can be bought that round. Nothing is ever locked without coins.
const SINK = { price: [1, 2, 3] };
RULE.sink = false;
const useCost = g => (RULE.sink && RULE.coins && RULE.uses && g && g.syn ? SINK.price[g.bought || 0] : undefined);
const canBuyUse = (g, run, id) => { const c = useCost(g); return c != null && !!run && !g.over && !g.shot && !g.chain && g.kinds.includes(id) && !(g.free && g.free[id]) && (run.coins || 0) >= c; };
function buyUse(g, run, id) { if (!canBuyUse(g, run, id)) return false; run.coins -= useCost(g); g.left[id] = (g.left[id] || 0) + 1; g.bought = (g.bought || 0) + 1; g.tally.bought = (g.tally.bought || 0) + 1; return true; }
function runBin(run, id) { if (!RULE.coins || (run.coins || 0) < COIN.bin || !run.gear.includes(id)) return false; run.coins -= COIN.bin; run.gear = run.gear.filter(q => q !== id); delete run.lv[id]; return true; }
function runPicks(run, rnd) {
  modeSync(run);
  const R = rnd || rand, any = a => a[Math.floor(R() * a.length)], st = stock(run.tier, run.instruments), out = [];
  // prof: the run was started from a saved profile (profileOpts): only what the profile holds is offered. One of the three is then an instrument
  // the profile holds, while the run can carry one more.
  const prof = !!run.instruments, gearNow = run.gear.length < RUNG.slots && !run.noGear && !bareRun(run) ? st.gear.filter(id => !run.gear.includes(id)) : [];
  if (RULE.offers !== false && !run.six && (RULE.unlockAll || (run.unlockedReagents || []).length)) { const v = offerVisit(run, R); if (v.free.length) { const picks = v.free.map(id => ({ kind: 'reagent', id })); if (prof && gearNow.length) picks[picks.length - 1] = { kind: 'gear', id: any(gearNow) };
      // sixteenth: the reagents bought with credit and the two found by a row (run.extra) were seldom offered once an earned reagent was owned,
      // because the offer draws from the earned ones alone. One visit in RULE.extraOffer (2) now shows one of them in the first place.
      const ex = (run.extra || []).filter(id => !run.rack.includes(id) && RX.CARDS[id] && !Object.keys(PAIR).some(k => PAIR[k] === id)); if (ex.length && RULE.extraOffer && R() < 1 / RULE.extraOffer) picks[0] = { kind: 'reagent', id: any(ex) };
      return picks; } }
  const newR = run.six ? [] : (prof ? [] : st.reagents).concat(run.extra || []).filter(id => !run.rack.includes(id) && !Object.keys(PAIR).some(k => PAIR[k] === id)), newG = run.gear.length < RUNG.slots && !run.noGear && !bareRun(run) ? st.gear.filter(id => !run.gear.includes(id)) : [];
  const newS = run.six || !RULE.pickSelf ? [] : RULE.cascade ? SELF.filter(q => q.tier <= run.tier && !(run.self || []).includes(q.id) && !(RULE.ban || []).includes(q.id)).map(q => q.id) : [];
  const from = { self: newS, reagent: newR, gear: newG, level: run.gear.filter(id => !GEARS[id].rule), strong: run.rack.filter(id => dealtIn(run, id)), bottle: run.rack.filter(id => dealtIn(run, id)) };
  // one new thing where there is one, then whatever else, three different kinds where possible
  let kinds = ['reagent', 'gear', 'self'].filter(k => from[k].length); for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = kinds[i]; kinds[i] = kinds[j]; kinds[j] = t; }
  const rest = ['strong', 'bottle', 'level'].filter(k => from[k].length); for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = rest[i]; rest[i] = rest[j]; rest[j] = t; }
  kinds = kinds.concat(rest).slice(0, 3);
  // a reagent is drawn by its odds, and each supplier opened makes the rarer ones a little likelier
  const drawR = list => { const w = list.map(id => rarityOf(id).odds * (rarityOf(id).odds < 60 ? 1 + 0.25 * run.tier : 1)); let x = R() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < list.length; i++) { x -= w[i]; if (x <= 0) return list[i]; } return list[list.length - 1]; };
  kinds.forEach(kind => out.push({ kind, id: kind === 'reagent' ? drawR(from[kind]) : any(from[kind]) }));
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = out[i]; out[i] = out[j]; out[j] = t; }
  return out;
}
function runTake(run, o) {
  run.rerolls = 0; if (o.kind === 'reagent' && run.lastOffer) { run.passed = run.passed || {}; run.lastOffer.forEach(id => { if (id !== o.id) run.passed[offerName(id)] = (run.passed[offerName(id)] || 0) + 1; }); run.lastOffer = null; }
  if (o.kind === 'reagent') { [o.id, PAIR[o.id]].forEach(id => { if (id && !run.rack.includes(id)) run.rack.push(id); }); }
  else if (o.kind === 'gear') { if (run.gear.length < RUNG.slots && !run.gear.includes(o.id)) run.gear.push(o.id); }
  else if (o.kind === 'self') { if (!run.self.includes(o.id)) run.self.push(o.id); }
  else if (o.kind === 'level') run.lv[o.id] = (run.lv[o.id] || 1) + 1;
  else if (o.kind === 'strong') run.grade[o.id] = (run.grade[o.id] || 1) + 1;
  else if (o.kind === 'bottle') run.uses[o.id] = (run.uses[o.id] || 0) + 1;
}
// one line saying what a pick does
function pickText(run, o) {
  if (o.kind === 'reagent') return '';
  if (o.kind === 'self') return 'by itself';
  if (o.kind === 'gear') return GEARS[o.id].note;
  if (o.kind === 'level') return 'level ' + ((run.lv[o.id] || 1) + 1) + ': ' + GEARS[o.id].note;
  if (o.kind === 'strong') return '+' + rarityOf(o.id).place * SYN.strong + ' a place';
  return '+1 use';
}
// =====================================================================================================================
// THE SPEC (docs/tools_chem/HURDLES.md, docs/SPEC_NOTES.md). A round is won by meeting its spec: an "at least N" about the
// molecule or about what happened in the round. Yield is separate (it pays gold at the four marks and letters the four words).
//   readers   : the structural readers on a plain graph of the game's molecule (port of docs/tools_chem/hurdle_graph.py)
//   record    : g.rec, what the round did, page by page (reagents fired and whether each acted, reflex steps, runoff by kind,
//               the molecule at the end of each page before the loose rings open again)
//   readings  : gain, loss, abs, last, range (HURDLES.md, "How a hurdle is read")
//   table     : SPEC_TABLE, one table of the specs, their readers, marks and the share of aiming players at each N, by round.
//               Written by docs/tools_spec_bake.py; replace it wholesale. Everything else reads it.
//   state     : g.spec = { kind, n, mark, name, text, value, met, parts } updated after every page; P.specValue, P.specMet
//   generator : P.specPick(molecule, round, carried, rnd, tier, hist, run) -> { kind, n, mark, ... } (table mode, reach checked by
//               aiming plays: a bounded search, see specReach)
// =====================================================================================================================
// SPEC RATE BEGIN (written by docs/tools_specrate_bake.py from the job specrate.js; replace it wholesale)
const SPEC_RATE = {"b":{"1":{"growth":{"novice":[100,100,99,98,97,66,48,45,42,18,15,12,10,2,2,2,2,1],"greedy":[100,100,100,100,98,76,60,59,58,31,26,24,22,10,7,6,4,1],"median":[100,99,99,99,99,86,74,74,72,46,38,37,36,16,12,12,10,6,5,5,4,2,2,1,1]},"branch":{"novice":[98,86,55,32,10,6,2,1],"greedy":[100,90,75,48,26,9,6,3,2],"median":[100,96,86,66,48,36,25,14,11,8,4,2,2,1]},"longest_chain":{"novice":[58,52,41,4,2,2],"greedy":[66,61,46,6,4,4],"median":[74,70,47,14,13,8]},"cut_down":{"novice":[5],"greedy":[13],"median":[38]},"lean_turns":{"novice":[49,2],"greedy":[67,6],"median":[80,16]},"hetero_atoms":{"novice":[100,94,56,11],"greedy":[100,98,70,25,6],"median":[100,99,79,37,14,2,1]},"double_bonds":{"novice":[38,7,1],"greedy":[64,27,4],"median":[92,61,12,2]},"unsaturation":{"novice":[54,22,4],"greedy":[78,52,23,5,1],"median":[98,80,59,36,14,5,1]},"end_CO":{"novice":[28,3],"greedy":[36,6],"median":[57,20]},"off_total":{"novice":[97,86,60,38,18,10,5,2],"greedy":[99,92,73,60,40,28,17,9,3,1,1,1],"median":[100,94,92,87,84,80,75,68,52,42,32,22,16,12,6,1]},"off_hydrogen":{"novice":[61,32,10,3],"greedy":[71,42,16,8,3],"median":[88,78,58,44,27,16,10,2,2]},"pure_gas":{"novice":[40,17,3,1],"greedy":[50,26,8,4],"median":[66,53,30,14,8,3,2]}},"2":{"growth":{"novice":[100,98,97,97,94,62,45,40,36,14,13,12,8,4,3,2,2],"greedy":[100,98,98,97,96,75,61,60,55,26,26,24,22,10,10,9,6,4,2,2,2],"median":[100,99,99,99,98,83,70,70,67,38,36,36,32,16,16,16,11,4,4,4,4,2,2,1,1]},"branch":{"novice":[98,81,52,30,14,6,2,1,1,1],"greedy":[100,94,74,48,28,14,7,4,3,2,2],"median":[100,98,90,72,55,30,22,16,10,8,6,3,2,1]},"longest_chain":{"novice":[68,53,30,10,4,2],"greedy":[71,60,36,10,4,2],"median":[78,68,44,12,4,3]},"hetero_atoms":{"novice":[97,88,46,6,1],"greedy":[100,96,61,20,5,1],"median":[100,98,78,32,10,2]},"double_bonds":{"novice":[44,13,2],"greedy":[60,32,6],"median":[90,66,26,4,4]},"conjugated":{"novice":[50,46,41,40,12,12,4,4],"greedy":[72,68,63,61,23,21,8,8],"median":[95,94,92,92,66,56,24,24,8,8]},"unsaturation":{"novice":[59,32,14,2,2,2],"greedy":[76,56,23,8,2,2],"median":[99,82,58,36,17,8,4,1]},"end_CO":{"novice":[13],"greedy":[22,3],"median":[48,10]},"off_total":{"novice":[99,88,60,40,24,15,7,6,4,2,2],"greedy":[99,94,82,68,49,34,20,12,6,4,3,3,2],"median":[100,98,92,90,86,81,72,66,50,44,37,30,20,16,5,4,2,2]},"off_hydrogen":{"novice":[50,22,10,5,2],"greedy":[62,32,18,9,2],"median":[88,74,58,40,30,18,10,4,2]},"pure_gas":{"novice":[29,14,4],"greedy":[41,20,9,1],"median":[57,42,32,16,10,4,2]}},"3":{"growth":{"novice":[98,98,96,89,86,63,56,53,46,30,21,19,14,9,7,6,5,3,2,2,2,2,1,1,1,1],"greedy":[99,99,98,94,91,74,66,64,54,41,33,32,27,18,16,16,13,8,7,7,6,4,3,2,2],"median":[99,99,98,97,94,82,77,72,64,52,42,41,37,26,24,22,20,16,14,14,12,9,6,6,3,2,1,1]},"branch":{"novice":[96,86,66,44,26,16,6,4,2],"greedy":[99,96,87,59,42,22,15,10,5,2,1],"median":[100,99,92,72,58,42,26,22,16,8,6,4,3,2,2]},"longest_chain":{"novice":[62,52,37,13,7,2],"greedy":[75,66,48,18,12,3],"median":[77,69,54,28,17]},"hetero_atoms":{"novice":[94,84,48,18,5,1],"greedy":[98,92,63,32,12,4,2],"median":[98,94,72,48,20,8,4,1]},"double_bonds":{"novice":[48,24,4],"greedy":[64,38,10,4,1],"median":[82,66,34,14,3,1]},"conjugated":{"novice":[48,48,34,34,5,5,4,3],"greedy":[72,72,54,54,12,12,4,4],"median":[92,92,78,76,42,42,13,13,2,1]},"unsaturation":{"novice":[67,46,24,7,2],"greedy":[83,66,39,16,8,3,1],"median":[96,92,70,45,28,9,4,2]},"end_CO":{"novice":[26,14,2],"greedy":[40,19,3],"median":[53,32,13]},"opener":{"novice":[88,46,9],"greedy":[93,60,12],"median":[92,63,12]},"off_total":{"novice":[95,88,68,44,27,16,11,4,2,1],"greedy":[99,98,86,69,52,40,28,16,10,8,6,4,1],"median":[100,99,93,88,82,76,64,60,50,44,34,29,22,16,14,8,5,4,2,1]},"off_hydrogen":{"novice":[62,34,16,6,2,1],"greedy":[76,48,28,12,5,2],"median":[87,77,62,49,36,26,18,10,6,3,2,2,1,1]},"pure_gas":{"novice":[42,22,9,1],"greedy":[58,35,18,6,2,1],"median":[72,56,42,30,19,9,6,4,2,1,1]}}}};
// SPEC RATE END
// SPEC TABLE BEGIN (written by docs/tools_spec_bake.py from the table of specs; replace it wholesale)
const SPEC_TABLE = {"six_rings":{"fam":"shape","plan":"rings","text":"at least {N} more six-atom rings","text1":"at least 1 more six-atom ring","read":"s","key":"ring6","mode":"gain","by":0,"mark":"ring6","need":null,"good":[6,8,9],"use":{"6":[[1,0.787]],"8":[[1,0.903]],"9":[[1,0.837]]},"cap":null},"fused_pairs":{"fam":"shape","plan":"rings","text":"at least {N} more rings sharing a side","text1":"at least 1 more ring sharing a side","read":"s","key":"fused_pairs","mode":"gain","by":0,"mark":"ring_pair","need":null,"good":[6,7],"use":{"6":[[1,0.667]],"7":[[1,0.733]]},"cap":null},"ring_systems":{"fam":"shape","plan":"rings","text":"at least {N} more separate ring groups","text1":"at least 1 more separate ring groups","read":"s","key":"ring_systems","mode":"gain","by":0,"mark":"islands","need":null,"good":[7,8],"use":{"7":[[2,0.753]],"8":[[2,0.817]]},"cap":null},"growth":{"fam":"size","plan":"big","text":"at least {N} atoms bigger than the start","text1":"at least 1 atom bigger than the start","read":"s","key":"atoms","mode":"gain","by":0,"mark":"grow","need":null,"good":[1,2,3,4,5,6,7,8,9],"use":{"1":[[6,0.887],[7,0.867],[8,0.843],[9,0.82],[10,0.77],[11,0.74],[12,0.717]],"2":[[11,0.74],[12,0.73],[13,0.687],[14,0.647],[15,0.63],[16,0.63]],"3":[[13,0.657],[14,0.613],[15,0.61],[16,0.61],[17,0.607]],"4":[[2,0.937],[3,0.92],[4,0.91],[5,0.87],[6,0.817]],"5":[[2,0.94],[3,0.933],[4,0.917],[5,0.867],[6,0.83],[7,0.787]],"6":[[2,0.94],[3,0.92],[4,0.907],[5,0.867],[6,0.833]],"7":[[1,0.943],[2,0.9],[3,0.877]],"8":[[1,0.947]],"9":[[1,0.943],[2,0.833]]},"cap":"start"},"branch":{"fam":"size","plan":"big","text":"at least {N} more forks in the molecule","text1":"at least 1 more fork in the molecule","read":"s","key":"branch","mode":"gain","by":0,"mark":"fork","need":null,"good":[1,2,3,4,5,6,7,8,9],"use":{"1":[[3,0.887],[4,0.77]],"2":[[5,0.693],[6,0.607]],"3":[[6,0.593]],"4":[[2,0.963],[3,0.883]],"5":[[3,0.907],[4,0.823]],"6":[[3,0.91],[4,0.87]],"7":[[3,0.9]],"8":[[3,0.907],[4,0.85]],"9":[[4,0.817]]},"cap":null},"longest_chain":{"fam":"size","plan":"big","text":"at least {N} longer chain than the start","text1":"at least 1 longer chain than the start","read":"s","key":"chain","mode":"gain","by":0,"mark":"ladder_chain","need":null,"good":[1,2,3],"use":{"1":[[1,0.88],[2,0.867],[3,0.8],[4,0.703]],"2":[[4,0.717],[5,0.66]],"3":[[4,0.653],[5,0.577]]},"cap":null},"cut_down":{"fam":"size","plan":"small","text":"at least {N} atoms smaller than the start","text1":"at least 1 atom smaller than the start","read":"s","key":"atoms","mode":"loss","by":0,"mark":"cut","need":null,"good":[1,6,7,8,9],"use":{"1":[[1,0.723]],"6":[[1,0.8]],"7":[[1,0.817]],"8":[[1,0.837]],"9":[[1,0.82]]},"cap":"half"},"finish_smaller":{"fam":"size","plan":"small","text":"at least {N} atoms smaller at the finish","text1":"at least 1 atom smaller at the finish","read":"s","key":"atoms","mode":"lastloss","by":0,"mark":"cut_end","need":null,"good":[6,7,8],"use":{"6":[[1,0.763]],"7":[[1,0.783]],"8":[[1,0.797]]},"cap":"half"},"lean_turns":{"fam":"size","plan":"small","text":"at least {N} turns ending smaller","text1":"at least 1 turn ending smaller","read":"e","key":"lean","mode":"","by":0,"mark":"lean","need":null,"good":[1,4,5,6,7,8,9],"use":{"1":[[1,0.863]],"4":[[1,0.94]],"5":[[1,0.903]],"6":[[1,0.92]],"7":[[1,0.91]],"8":[[1,0.897]],"9":[[1,0.9]]},"cap":null},"kinds_gain":{"fam":"makeup","plan":"kinds","text":"at least {N} more kinds of group","text1":"at least 1 more kind of group","read":"s","key":"kinds","mode":"gain","by":0,"mark":"groups","need":null,"good":[7,8],"use":{"7":[[1,0.767]],"8":[[1,0.767]]},"cap":null},"hetero_atoms":{"fam":"makeup","plan":"kinds","text":"at least {N} more non-carbon atoms","text1":"at least 1 more non-carbon atom","read":"s","key":"hetero","mode":"gain","by":0,"mark":"hetero","need":null,"good":[1,2,3,4,5,6,7,8,9],"use":{"1":[[3,0.837]],"2":[[4,0.643]],"3":[[4,0.627]],"4":[[1,0.95],[2,0.823]],"5":[[1,0.957],[2,0.807]],"6":[[1,0.943],[2,0.837]],"7":[[1,0.903]],"8":[[1,0.897]],"9":[[1,0.88]]},"cap":null},"double_bonds":{"fam":"makeup","plan":"bonds","text":"at least {N} more double bonds","text1":"at least 1 more double bond","read":"s","key":"dbl","mode":"gain","by":0,"mark":"double","need":null,"good":[1,2,3,4,5,6,7,8,9],"use":{"1":[[2,0.887],[3,0.76]],"2":[[4,0.63]],"3":[[4,0.603]],"4":[[1,0.903]],"5":[[1,0.847]],"6":[[1,0.843]],"7":[[1,0.847]],"8":[[1,0.89]],"9":[[1,0.847]]},"cap":null},"conjugated":{"fam":"makeup","plan":"bonds","text":"at least {N} more atoms in alternating bonds","text1":"at least 1 more atom in alternating bonds","read":"s","key":"conj","mode":"gain","by":0,"mark":"conjugated","need":null,"good":[2,3,6,7],"use":{"2":[[5,0.563],[6,0.56]],"3":[[5,0.513],[6,0.507]],"6":[[1,0.787],[2,0.763]],"7":[[1,0.757]]},"cap":null},"unsaturation":{"fam":"makeup","plan":"bonds","text":"at least {N} more rings and double bonds","text1":"at least 1 more ring and double bonds","read":"s","key":"unsat","mode":"gain","by":0,"mark":"unsat","need":null,"good":[1,2,3,4,5,6,7,8,9],"use":{"1":[[2,0.9],[3,0.78]],"2":[[4,0.637]],"3":[[4,0.62]],"4":[[3,0.83]],"5":[[3,0.853]],"6":[[2,0.937],[3,0.847]],"7":[[3,0.893]],"8":[[3,0.883]],"9":[[2,0.883],[3,0.813]]},"cap":null},"end_CO":{"fam":"makeup","plan":"keep","text":"at least {N} more C=O at the finish","text1":"at least 1 more C=O at the finish","read":"g","key":"C=O","mode":"lastgain","by":0,"mark":"keep_CO","need":null,"good":[1,2,3],"use":{"1":[[1,0.793]],"2":[[2,0.663]],"3":[[2,0.613]]},"cap":null},"end_CC":{"fam":"makeup","plan":"keep","text":"at least {N} more C=C at the finish","text1":"at least 1 more C=C at the finish","read":"g","key":"C=C","mode":"lastgain","by":0,"mark":"keep_CC","need":null,"good":[4,5,6,7,8,9],"use":{"4":[[1,0.907]],"5":[[1,0.88],[2,0.8]],"6":[[1,0.887],[2,0.787]],"7":[[1,0.907],[2,0.837]],"8":[[1,0.937],[2,0.87],[3,0.777]],"9":[[1,0.893],[2,0.823]]},"cap":null},"opener":{"fam":"chain","plan":"chains","text":"at least {N} reflexes after the first reagent","text1":"at least 1 reflex after the first reagent","read":"e","key":"opener","mode":"","by":0,"mark":"first","need":null,"good":[3,4,5,6,7,8],"use":{"3":[[1,0.483]],"4":[[1,0.833]],"5":[[1,0.803]],"6":[[1,0.84],[2,0.723]],"7":[[1,0.877],[2,0.8]],"8":[[1,0.887],[2,0.823]]},"cap":null},"closer":{"fam":"chain","plan":"chains","text":"at least {N} reflexes after the last reagent","text1":"at least 1 reflex after the last reagent","read":"e","key":"closer","mode":"","by":0,"mark":"third","need":null,"good":[6,7,8,9],"use":{"6":[[2,0.763]],"7":[[2,0.767],[3,0.66]],"8":[[2,0.797]],"9":[[2,0.72]]},"cap":null},"kind_ring":{"fam":"chain","plan":"chains","text":"at least {N} ring-closing reflexes","text1":"at least 1 ring-closing reflex","read":"e","key":"kind:ring","mode":"","by":0,"mark":"self_ring","need":["lactol"],"good":[7,8,9],"use":{"7":[[1,0.74]],"8":[[1,0.83],[2,0.767]],"9":[[1,0.773]]},"cap":null},"off_total":{"fam":"runoff","plan":"vent","text":"at least {N} runoff over the round","text1":"at least 1 runoff over the round","read":"e","key":"off:all","mode":"","by":0,"mark":"off_all","need":null,"good":[1,2,3,4,5,6,7,8],"use":{"1":[[7,0.86],[8,0.8],[9,0.743]],"2":[[10,0.737],[11,0.687],[12,0.63],[13,0.583]],"3":[[11,0.68],[12,0.59],[13,0.517]],"4":[[6,0.917],[7,0.88],[8,0.843]],"5":[[7,0.86],[8,0.833],[9,0.783]],"6":[[8,0.84],[9,0.793]],"7":[[8,0.87]],"8":[[9,0.83]]},"cap":null},"off_hydrogen":{"fam":"runoff","plan":"vent","text":"at least {N} hydrogen in the runoff","text1":"at least 1 hydrogen in the runoff","read":"e","key":"off:hydrogen","mode":"","by":0,"mark":"jar_hydrogen","need":["pcc","permanganate"],"good":[1,2,3,4,5,8,9],"use":{"1":[[3,0.84]],"2":[[4,0.74],[5,0.593]],"3":[[5,0.64]],"4":[[2,0.877]],"5":[[1,0.95],[2,0.883],[3,0.787]],"8":[[2,0.889]],"9":[[2,0.855]]},"cap":null},"off_carbon_dioxide":{"fam":"runoff","plan":"vent","text":"at least {N} carbon dioxide in the runoff","text1":"at least 1 carbon dioxide in the runoff","read":"e","key":"off:carbon_dioxide","mode":"","by":0,"mark":"jar_carbon_dioxide","need":["mode:co2","permanganate"],"good":[1,2,5],"use":{"1":[[3,0.77]],"2":[[3,0.74]],"5":[[1,0.86]]},"cap":null},"pure_water":{"fam":"runoff","plan":"pure","text":"at least {N} more water than other runoff","text1":"at least 1 more water than other runoff","read":"e","key":"pure_water","mode":"","by":0,"mark":"water_only","need":null,"good":[4,5,6,7,8,9],"use":{"4":[[1,0.983],[2,0.967],[3,0.94],[4,0.867]],"5":[[1,0.96],[2,0.91],[3,0.85],[4,0.77]],"6":[[1,0.967],[2,0.943],[3,0.903],[4,0.833]],"7":[[1,0.937],[2,0.91],[3,0.88],[4,0.85]],"8":[[1,0.903],[2,0.873],[3,0.853],[4,0.81]],"9":[[1,0.893],[2,0.847],[3,0.797]]},"cap":null},"pure_gas":{"fam":"runoff","plan":"pure","text":"at least {N} more gas than water","text1":"at least 1 more gas than water","read":"e","key":"pure_gas","mode":"","by":0,"mark":"gas_only","need":["pcc","socl2","hofmann","permanganate"],"good":[1,2,3],"use":{"1":[[1,0.89],[2,0.79]],"2":[[3,0.66]],"3":[[3,0.607],[4,0.49]]},"cap":null},"held_back":{"fam":"restraint","plan":"restraint","text":"at least {N} turns firing fewer than three","text1":"at least 1 turn firing fewer than three","read":"e","key":"held","mode":"","by":0,"mark":"held","need":null,"good":[6,7,8,9],"use":{"6":[[2,0.9]],"7":[[2,0.9]],"8":[[2,0.9]],"9":[[2,0.9]]},"cap":null,"rider":true}};
// SPEC TABLE END
// the clear rate the aiming player is tuned to, by round number (HURDLES.md); data, replace with the table
// the revised table (docs/tools_chem/SPECS.md): the new player model in rounds 1 to 3 (75, 65, 55 percent, plus the shift of 5 and 3 points in rounds 1 and 3),
// the middling player model in rounds 4 to 9 (90, 87, 81, 78, 73, 68; two specs together from round 6)
const SPEC_TARGET = { 1: 0.80, 2: 0.65, 3: 0.58, 4: 0.90, 5: 0.87, 6: 0.81, 7: 0.78, 8: 0.73, 9: 0.68 };
const SPEC_RIDER = { p: 0.25, factor: 0.97 };
// the families a player has open by run length (tierNo 1, 2, 3); chain, off and restraint are always open
const SPEC_FAMILY_TIER = { chain: 0, runoff: 0, off: 0, restraint: 0, size: 1, makeup: 1, shape: 2, timing: 2 };
// two specs that cannot sit in one round (they pull against each other, or are one count read twice)
const SPEC_CLASH = [['growth', 'cut_down'], ['growth', 'finish_smaller'], ['growth', 'lean_turns'], ['off_total', 'pure_water'], ['off_total', 'pure_gas'], ['pure_water', 'pure_gas']];
const SPEC_OFF = { water: 'water', h2: 'hydrogen', co2: 'carbon_dioxide', chloride: 'acid_fumes', oxide: 'other', other: 'other' };
const SPEC_JARS = ['water', 'hydrogen', 'carbon_dioxide', 'acid_fumes', 'ammonia', 'sulfur', 'trimethylamine', 'other'];
const SX = (() => {
  const bit = k => 1n << BigInt(k);
  // the heavy atoms of a model as a graph: el (elements), bonds [i, j, order] (kekule form), nh (hydrogens on each atom)
  function sgraph(m) {
    const idx = new Map(), el = [], nh = [];
    m.atoms.forEach(a => { if (a.el === 'H' || a.fly) return; idx.set(a, el.length); el.push(a.el); nh.push(0); });
    const bonds = [];
    m.bonds.forEach(b => { const i = idx.get(b.a), j = idx.get(b.b); if (i != null && j != null) bonds.push([i, j, Math.round(b.order)]); else if (i != null && b.b.el === 'H') nh[i]++; else if (j != null && b.a.el === 'H') nh[j]++; });
    return { el, bonds, nh };
  }
  function adjOf(n, bonds) { const a = Array.from({ length: n }, () => []); bonds.forEach(([i, j, o]) => { a[i].push([j, o]); a[j].push([i, o]); }); return a; }
  function pieces(n, adj) { let k = 0; const seen = new Array(n).fill(-1); for (let s = 0; s < n; s++) { if (seen[s] >= 0) continue; seen[s] = k; const q = [s]; for (let qi = 0; qi < q.length; qi++) for (const [y] of adj[q[qi]]) if (seen[y] < 0) { seen[y] = k; q.push(y); } k++; } return k; }
  const cmp = (a, b) => { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i]; return a.length - b.length; };
  // the smallest set of smallest rings (Horton's candidates, a minimum cycle basis over GF(2)); each ring is a list of atoms in order
  function ringsOf(n, bonds, adj) {
    const want = bonds.length - n + pieces(n, adj); if (want <= 0) return [];
    const eid = new Map(); bonds.forEach(([i, j], k) => { eid.set(i * 1000 + j, k); eid.set(j * 1000 + i, k); });
    const cands = new Map();
    for (let r = 0; r < n; r++) {
      const par = new Array(n).fill(-2); par[r] = -1; const q = [r];
      for (let qi = 0; qi < q.length; qi++) for (const [y] of adj[q[qi]]) if (par[y] === -2) { par[y] = q[qi]; q.push(y); }
      const path = x => { const p = []; while (x !== -1) { p.push(x); x = par[x]; } return p; };
      for (const [i, j] of bonds) {
        if (par[i] === -2 || par[j] === -2 || par[i] === j || par[j] === i) continue;
        const pi = path(i), pj = path(j), si = new Set(pi.slice(0, -1)); if (pj.slice(0, -1).some(x => si.has(x))) continue;
        const cyc = pi.slice().reverse().concat(pj.slice(0, -1)), ids = cyc.map((c, t) => eid.get(c * 1000 + cyc[(t + 1) % cyc.length])).sort((a, b) => a - b), key = ids.join(',');
        if (!cands.has(key)) cands.set(key, { cyc, ids });
      }
    }
    const order = [...cands.values()].sort((a, b) => a.cyc.length - b.cyc.length || cmp(a.ids, b.ids)), basis = [], chosen = [];
    for (const { cyc, ids } of order) { let v = 0n; for (const b of ids) v |= bit(b); for (const bv of basis) { const w = v ^ bv; if (w < v) v = w; } if (v) { basis.push(v); chosen.push(cyc); if (chosen.length === want) break; } }
    return chosen;
  }
  function uf(k) { const p = Array.from({ length: k }, (_, i) => i), find = x => { while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x; }; return { find, union: (a, b) => { p[find(a)] = find(b); } }; }
  const biggest = (keys) => { const c = new Map(); keys.forEach(k => c.set(k, (c.get(k) || 0) + 1)); return c.size ? Math.max(...c.values()) : 0; };
  function ringNums(G, adj) {
    const n = G.el.length, rs = ringsOf(n, G.bonds, adj), sets = rs.map(r => new Set(r)), out = { rs, inRing: new Set(), arom: new Set() };
    sets.forEach(s => s.forEach(a => out.inRing.add(a)));
    out.rings = rs.length; out.ring5 = rs.filter(r => r.length === 5).length; out.ring6 = rs.filter(r => r.length === 6).length;
    out.ring_small = rs.filter(r => r.length <= 4).length; out.ring_big = rs.filter(r => r.length >= 7).length;
    out.ring_sizes = new Set(rs.map(r => r.length)).size; out.ring_atoms = out.inRing.size;
    const f1 = uf(rs.length), f2 = uf(rs.length); let pairs = 0; const spiroAt = new Set(), bridgeAt = new Set();
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
      const com = new Set([...sets[i]].filter(a => sets[j].has(a)));
      if (com.size >= 2) { pairs++; f1.union(i, j); }
      if (com.size) f2.union(i, j);
      if (com.size === 1) com.forEach(a => spiroAt.add(a));
      if (com.size >= 3) com.forEach(a => { const r = rs[i], k = r.indexOf(a); let inner = 0; for (const d of [-1, 1]) if (com.has(r[(k + d + r.length) % r.length])) inner++; if (inner === 1) bridgeAt.add(a); });
    }
    out.fused_pairs = pairs; out.fused_block = rs.length ? biggest(rs.map((_, i) => f1.find(i))) : 0; out.ring_systems = new Set(rs.map((_, i) => f2.find(i))).size;
    out.spiro = spiroAt.size; out.spiroAt = [...spiroAt]; out.bridgehead = bridgeAt.size;
    out.ring_hetero = rs.filter(r => r.some(a => G.el[a] !== 'C')).length;
    out.ring_mixed = rs.filter(r => new Set(r.map(a => G.el[a]).filter(e => e !== 'C')).size >= 2).length;
    const bo = new Map(); G.bonds.forEach(([i, j, o]) => { bo.set(i * 1000 + j, o); bo.set(j * 1000 + i, o); });
    const arom = rs.filter(r => r.length === 6 && r.every(a => G.el[a] === 'C') && r.map((_, t) => bo.get(r[t] * 1000 + r[(t + 1) % 6])).slice().sort().join('') === '111222' && r.every((_, t) => bo.get(r[t] * 1000 + r[(t + 1) % 6]) !== bo.get(r[(t + 1) % 6] * 1000 + r[(t + 2) % 6])));
    out.aromatic = arom.length; arom.forEach(r => r.forEach(a => out.arom.add(a)));
    return out;
  }
  function longestChain(G, adj, inRing) {
    const nodes = []; G.el.forEach((e, i) => { if (e === 'C' && !inRing.has(i)) nodes.push(i); });
    const ns = new Set(nodes), nb = i => adj[i].map(x => x[0]).filter(y => ns.has(y));
    const far = s => { const seen = new Map([[s, 0]]), q = [s]; for (let qi = 0; qi < q.length; qi++) for (const y of nb(q[qi])) if (!seen.has(y)) { seen.set(y, seen.get(q[qi]) + 1); q.push(y); } let m = s; seen.forEach((d, k) => { if (d > seen.get(m)) m = k; }); return [m, seen.get(m), seen]; };
    const done = new Set(); let best = 0;
    for (const s of nodes) { if (done.has(s)) continue; const [a, , comp] = far(s); comp.forEach((_, k) => done.add(k)); best = Math.max(best, far(a)[1] + 1); }
    return best;
  }
  function diameter(n, adj) { let best = 0; for (let s = 0; s < n; s++) { const d = new Array(n).fill(-1); d[s] = 0; const q = [s]; for (let qi = 0; qi < q.length; qi++) for (const [y] of adj[q[qi]]) if (d[y] < 0) { d[y] = d[q[qi]] + 1; q.push(y); } best = Math.max(best, ...d); } return best; }
  function altRun(G, adj) {
    const n = G.el.length, pi = adj.map(a => a.some(([, o]) => o >= 2)), lone = G.el.map(e => e === 'O' || e === 'N' || e === 'S' || e === 'Cl'), f = uf(n), conj = new Set(), inc = new Set();
    G.bonds.forEach(([i, j, o]) => { if (o === 1 && ((pi[i] && pi[j]) || (pi[i] && lone[j]) || (pi[j] && lone[i]))) { conj.add(i); conj.add(j); f.union(i, j); inc.add(i); inc.add(j); } });
    G.bonds.forEach(([i, j, o]) => { if (o >= 2 && (conj.has(i) || conj.has(j))) { f.union(i, j); inc.add(i); inc.add(j); } });
    return inc.size ? biggest([...inc].map(f.find)) : 0;
  }
  // the 12 kinds of group (HURDLES.md), each counted as a small pattern at every atom
  function groupsOf(G, adj, arom) {
    const el = G.el, nh = G.nh, deg = i => adj[i].length + nh[i], cnt = { 'OH': 0, 'C=O': 0, 'C=C': 0, 'COOH': 0, 'NH2': 0, 'SH': 0, 'Cl': 0, 'ester': 0, 'ether': 0, 'amide': 0, 'S-S': 0, 'C=N': 0 };
    const dbl = (i, e) => adj[i].filter(([j, o]) => o === 2 && el[j] === e).map(x => x[0]);
    const isCO = c => el[c] === 'C' && dbl(c, 'O').some(o => adj[o].length === 1);
    const ketC = c => isCO(c) && deg(c) === 3 && adj[c].every(([j, o]) => o === 2 || el[j] === 'C');
    for (let i = 0; i < el.length; i++) {
      const e = el[i];
      if (e === 'O') {
        const sg = adj[i].filter(x => x[1] === 1);
        if (nh[i] === 1 && adj[i].length === 1 && sg.length === 1 && el[sg[0][0]] === 'C' && !isCO(sg[0][0])) cnt['OH']++;
        if (nh[i] === 1 && adj[i].length === 1 && sg.length === 1 && el[sg[0][0]] === 'C' && isCO(sg[0][0]) && deg(sg[0][0]) === 3) cnt['COOH']++;
        if (nh[i] === 0 && adj[i].length === 2 && sg.length === 2 && sg.every(([j]) => el[j] === 'C')) { if (sg.some(([j]) => isCO(j))) { if (sg.some(([j]) => isCO(j) && deg(j) === 3)) cnt['ester']++; } else cnt['ether']++; }
      } else if (e === 'C') {
        if (ketC(i)) cnt['C=O']++;
        if (deg(i) === 3 && dbl(i, 'N').some(nn => deg(nn) === 2)) cnt['C=N']++;
        if (isCO(i) && deg(i) === 3) adj[i].forEach(([j, o]) => { if (o === 1 && el[j] === 'N' && deg(j) === 3) cnt['amide']++; });
      } else if (e === 'N') {
        if (adj[i].length === 1 && nh[i] === 2 && adj[i][0][1] === 1 && el[adj[i][0][0]] === 'C' && !isCO(adj[i][0][0])) cnt['NH2']++;
      } else if (e === 'S') {
        if (adj[i].length === 1 && nh[i] === 1) cnt['SH']++;
        if (deg(i) === 2) adj[i].forEach(([j]) => { if (j > i && el[j] === 'S' && deg(j) === 2) cnt['S-S']++; });
      } else if (e === 'Cl') cnt['Cl']++;
    }
    G.bonds.forEach(([i, j, o]) => { if (o === 2 && el[i] === 'C' && el[j] === 'C' && !(arom.has(i) && arom.has(j))) cnt['C=C']++; });
    return cnt;
  }
  // every structural number a spec reads, worked out when asked for and kept

  // the twelve motifs (docs/tools_chem/TRAITS.md, traits.py): the places of each on the molecule, exact on the game's graph, as lists of atom numbers.
  // Nineteenth: the count is the sum over the places (motifCount below), checked equal to the older counting code on 587 molecules (job hom19.js).
  function motifPlaces(id, G, adj, rn) {
    const n = G.el.length, E = G.el, nbr = i => adj[i].map(x => x[0]), isH1 = o => E[o] === 'O' && adj[o].length === 1 && G.nh[o] === 1;
    const sp3 = i => adj[i].every(x => x[1] === 1), cn = i => nbr(i).filter(j => E[j] === 'C').length;
    const sets = rn.rs.map(r => new Set(r));
    const groups = () => { const p = sets.map((_, i) => i), f = x => { while (p[x] !== x) x = p[x]; return x; }; for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) if ([...sets[i]].some(a => sets[j].has(a))) p[f(i)] = f(j); const g = new Map(); sets.forEach((_, i) => { const k = f(i); if (!g.has(k)) g.set(k, []); g.get(k).push(i); }); return [...g.values()]; };
    // aromatic rings: six atoms of C or N in a ring system where every atom has a double bond to a partner in the same system (six pi electrons: benzene, naphthalene, pyridine)
    const aroR = () => { const gs = groups(), sysOf = new Map(); gs.forEach((g, gi) => g.forEach(i => sets[i].forEach(a => sysOf.set(a, gi)))); return rn.rs.filter(r => r.length === 6 && r.every(a => (E[a] === 'C' || E[a] === 'N') && adj[a].some(x => x[1] === 2 && sysOf.get(x[0]) === sysOf.get(a)))); };
    const aset = () => { const s2 = new Set(); aroR().forEach(r => r.forEach(a => s2.add(a))); return s2; };
    const cages = () => { const out = []; groups().forEach(g => { const atoms = new Set(); g.forEach(i => sets[i].forEach(a => atoms.add(a))); const rb = new Set(); g.forEach(i => { const r = rn.rs[i]; for (let t = 0; t < r.length; t++) { const a = r[t], b = r[(t + 1) % r.length]; rb.add(Math.min(a, b) * 1000 + Math.max(a, b)); } });
      const deg = new Map(); rb.forEach(k => { const a = Math.floor(k / 1000), b = k % 1000; deg.set(a, (deg.get(a) || 0) + 1); deg.set(b, (deg.get(b) || 0) + 1); });
      let bridged = false; for (let x = 0; x < g.length; x++) for (let y = x + 1; y < g.length; y++) if ([...sets[g[x]]].filter(a => sets[g[y]].has(a)).length >= 3) bridged = true;
      const shell = g.length >= 3 && [...atoms].every(a => deg.get(a) === 3), r = rb.size - atoms.size + 1; if ((bridged || shell) && r >= 2) out.push({ r, atoms }); }); return out; };
    switch (id) {
      case 'sugar': { const out = []; for (let i = 0; i < n; i++) if (E[i] === 'C' && adj[i].length + G.nh[i] === 4 && adj[i].some(x => x[1] === 1 && isH1(x[0]))) out.push([i].concat(adj[i].filter(x => x[1] === 1 && isH1(x[0])).map(x => x[0]))); return out; }
      case 'resonance': {
        const dbl = G.bonds.filter(b => b[2] === 2), m = dbl.length; if (m < 2) return []; const A = Array.from({ length: m }, () => []);
        for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) { const a = dbl[i], b = dbl[j]; if (a[0] === b[0] || a[0] === b[1] || a[1] === b[0] || a[1] === b[1]) continue; if ([a[0], a[1]].some(x => [b[0], b[1]].some(y => adj[x].some(q => q[0] === y && q[1] === 1)))) { A[i].push(j); A[j].push(i); } }
        let best = 1, path = null; const walk = (v, seen) => { if (seen.size > best) { best = seen.size; path = [...seen]; } A[v].forEach(w => { if (!seen.has(w)) { seen.add(w); walk(w, seen); seen.delete(w); } }); }; for (let v = 0; v < m; v++) walk(v, new Set([v])); return best >= 2 ? path.map(v => [dbl[v][0], dbl[v][1]]) : []; }      // one place for each double bond of the longest run
      case 'arene': return aroR().map(r => r.slice());
      case 'ring': { const ca = new Set(); cages().forEach(c => c.atoms.forEach(a => ca.add(a))); const as = aset(); return rn.rs.filter(r => !r.every(a => as.has(a)) && !r.every(a => ca.has(a))).map(r => r.slice()); }
      case 'fusion': { const ca = new Set(); cages().forEach(c => c.atoms.forEach(a => ca.add(a))); const rs = rn.rs.filter(r => !r.every(a => ca.has(a))).map(r => new Set(r)), out = []; for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) { const sh = [...rs[i]].filter(a => rs[j].has(a)); if (sh.length === 2 && adj[sh[0]].some(q => q[0] === sh[1])) out.push(sh); } return out; }      // the two atoms of the shared side
      case 'cage': return cages().map(c => { const p = [...c.atoms]; p.n = c.r - 1; return p; });      // one place a cage; it counts its rings less one (n)
      case 'spiro': return rn.spiroAt.map(a => [a]);
      case 'acid': { const out = []; for (let i = 0; i < n; i++) if (E[i] === 'C' && adj[i].length + G.nh[i] === 3 && adj[i].some(x => x[1] === 2 && E[x[0]] === 'O') && adj[i].some(x => x[1] === 1 && isH1(x[0]))) out.push([i].concat(adj[i].filter(x => (x[1] === 2 && E[x[0]] === 'O') || (x[1] === 1 && isH1(x[0]))).map(x => x[0]))); return out; }
      case 'amine': { const out = []; for (let i = 0; i < n; i++) { if (E[i] !== 'N' || adj[i].length + G.nh[i] !== 3) continue; if (adj[i].some(x => x[1] === 3 || ['N', 'O', 'S'].includes(E[x[0]]))) continue; if (adj[i].some(x => E[x[0]] === 'C' && adj[x[0]].length + G.nh[x[0]] === 3 && adj[x[0]].some(y => y[1] === 2 && ['O', 'S', 'N'].includes(E[y[0]])))) continue; if (adj[i].some(x => E[x[0]] === 'C')) out.push([i]); } return out; }
      case 'sulfur': { const out = []; for (let i = 0; i < n; i++) { if (E[i] !== 'S' || adj[i].length + G.nh[i] !== 2) continue; if (G.nh[i] === 0 && adj[i].length === 2 && adj[i].every(x => x[1] === 1 && E[x[0]] === 'C')) out.push([i]); adj[i].forEach(x => { if (x[1] === 1 && E[x[0]] === 'S' && adj[x[0]].length + G.nh[x[0]] === 2 && x[0] > i) out.push([i, x[0]]); }); } return out; }
      case 'branch': { const out = []; for (let i = 0; i < n; i++) if (E[i] === 'C' && sp3(i) && cn(i) >= 3) out.push([i]); return out; }
      case 'chain': { const ok = new Set(); for (let i = 0; i < n; i++) if (E[i] === 'C' && !rn.inRing.has(i) && (G.nh[i] === 2 || G.nh[i] === 3) && sp3(i)) ok.add(i);
        let best = 0, path = []; const walk = (v, seen) => { if (seen.size > best) { best = seen.size; path = [...seen]; } nbr(v).forEach(w => { if (ok.has(w) && !seen.has(w)) { seen.add(w); walk(w, seen); seen.delete(w); } }); };
        ok.forEach(v => { if (nbr(v).filter(w => ok.has(w)).length <= 1) walk(v, new Set([v])); }); const out = []; for (let t = 0; t + 3 <= path.length; t += 3) out.push(path.slice(t, t + 3)); return out; }      // the longest run, three carbons a place
    }
    throw new Error('motif: ' + id);
  }
  // the count of a motif is the sum over its places (a cage counts n; every other place counts one): one piece of code for the number and the atoms
  const motifCount = (id, G, adj, rn) => motifPlaces(id, G, adj, rn).reduce((t, p) => t + (p.n || 1), 0);
  // where each motif sits on a model as it stands (no ring is read open here; motifAtoms does that on a copy): { id: [[atom, ...], ...] }
  function motifAtomsOf(m) { const G = sgraph(m), adj = adjOf(G.el.length, G.bonds), rn = ringNums(G, adj), at = m.atoms.filter(a => !(a.el === 'H' || a.fly)), out = {}; Object.keys(MOTIFS).forEach(id => { const ps = motifPlaces(id, G, adj, rn); if (ps.length) out[id] = ps.map(p => { const q = p.map(i => at[i]); if (p.n) q.n = p.n; return q; }); }); return out; }
  function featOf(m) {
    const G = sgraph(m), n = G.el.length, adj = adjOf(n, G.bonds), memo = {};
    const rn = () => memo.rn || (memo.rn = ringNums(G, adj));
    const gr = () => memo.gr || (memo.gr = groupsOf(G, adj, rn().arom));
    const get = k => {
      if (k in memo) return memo[k];
      let v;
      if (k.charAt(0) === 'g' && k.charAt(1) === ':') v = gr()[k.slice(2)];
      else switch (k) {
        case 'atoms': v = n; break;
        case 'chain': v = longestChain(G, adj, rn().inRing); break;
        case 'diameter': v = n > 1 ? diameter(n, adj) : 0; break;
        case 'branch': v = adj.filter(a => a.length >= 3).length; break;
        case 'conj': v = altRun(G, adj); break;
        case 'dbl': v = G.bonds.filter(([i, j, o]) => o === 2 && ((G.el[i] === 'C' && (G.el[j] === 'C' || G.el[j] === 'O')) || (G.el[i] === 'O' && G.el[j] === 'C'))).length; break;
        case 'unsat': v = rn().rings + G.bonds.filter(b => b[2] === 2).length; break;
        case 'hetero': v = G.el.filter(e => e !== 'C').length; break;
        case 'elements': v = new Set(G.el.filter(e => e !== 'C')).size; break;
        case 'kinds': v = Object.values(gr()).filter(x => x > 0).length; break;
        case 'm:sugar': case 'm:resonance': case 'm:arene': case 'm:ring': case 'm:fusion': case 'm:cage': case 'm:spiro': case 'm:acid': case 'm:amine': case 'm:sulfur': case 'm:branch': case 'm:chain': v = motifCount(k.slice(2), G, adj, rn()); break;
        default: v = rn()[k]; if (v == null) throw new Error('spec: no reader for ' + k);
      }
      return (memo[k] = v);
    };
    return { get, G };
  }
  return { sgraph, adjOf, ringsOf, featOf, groupsOf, ringNums, motifAtomsOf, motifCount };
})();
// the numbers of one molecule model, as the readers see it: { key: value } for the keys asked for (tests and the Python check)
function specNumbers(m, keys) { const f = SX.featOf(m), out = {}; (keys || ['atoms', 'rings', 'ring5', 'ring6', 'ring_small', 'ring_big', 'ring_sizes', 'ring_atoms', 'fused_pairs', 'fused_block', 'ring_systems', 'spiro', 'bridgehead', 'ring_hetero', 'ring_mixed', 'aromatic', 'chain', 'diameter', 'branch', 'conj', 'dbl', 'unsat', 'hetero', 'elements', 'kinds']).forEach(k => { out[k] = f.get(k); }); const gk = ['OH', 'C=O', 'C=C', 'COOH', 'NH2', 'SH', 'Cl', 'ester', 'ether', 'amide', 'S-S', 'C=N']; if (!keys) gk.forEach(k => { out['g:' + k] = f.get('g:' + k); }); return out; }
// ---------- the record of a round ----------
const offOf = t => { const o = {}; SPEC_JARS.forEach(j => { o[j] = (t && t['off_' + j]) || 0; }); return o; };
// A page as the specs read it, from the trail since the page began: every circle (a reagent that acted, one that found nothing,
// the bank) with the reflex steps it set off, the reflex steps in order, what was driven off, and the molecule as it stands.
// What a step really did to the bonds, read off the molecule before and after it (not from the anchor atoms of the place).
// a, b are atom ids in the molecule AFTER the step (the atoms the page holds once the step is done); fromA, fromB are the same atoms' ids BEFORE the step
// (null for an atom the step added); elA, elB their elements. An end that left the molecule has a null id after the step unless the molecule still carries it as it lifts.
//   made    [{ a, b, order, fromA, fromB, elA, elB }]          bonds that were not there before
//   broken  [{ a, b, order, fromA, fromB, elA, elB }]          bonds that are gone
//   changed [{ a, b, was, order, fromA, fromB, elA, elB }]     bonds whose order changed (was -> order)
//   left    [{ id, from, el }]                                 every atom that left the molecule in this step
//   added   [{ id, el }]                                       every atom the step brought in (from the reagent)
//   moved   [{ from, to, el }]                                 a hydrogen that went from one atom to another inside the molecule (the engine takes it off and puts a new one on;
//                                                              it is not listed as left or added): from is its id before, to its id after
function bondDiff(m0, m1, map) {
  const live = new Set(m1.atoms), on = a => !!a && live.has(a) && !a.fly, idOf = a => (a && live.has(a) ? a.id : null), key = (a, b) => (a.id < b.id ? a.id + ':' + b.id : b.id + ':' + a.id);
  const inv = new Map(); map.forEach((n, o) => { inv.set(n, o); });
  const E = (na, nb, order, oa, ob, was) => { const e = { a: idOf(na), b: idOf(nb), order, fromA: oa ? oa.id : null, fromB: ob ? ob.id : null, elA: (na || oa).el, elB: (nb || ob).el }; if (was != null) e.was = was; return e; };
  const old = new Map(), made = [], broken = [], changed = [], left = [];
  m0.bonds.forEach(b => { if (b.a.fly || b.b.fly) return; const na = map.get(b.a), nb = map.get(b.b); if (!on(na) || !on(nb)) { broken.push(E(na, nb, b.order, b.a, b.b)); return; } old.set(key(na, nb), { a: na, b: nb, oa: b.a, ob: b.b, order: b.order }); });
  m1.bonds.forEach(b => { if (!on(b.a) || !on(b.b)) return; const k = key(b.a, b.b), o = old.get(k); if (!o) { made.push(E(b.a, b.b, b.order, inv.get(b.a), inv.get(b.b))); return; } if (o.order !== b.order) changed.push(E(o.a, o.b, b.order, o.oa, o.ob, o.order)); old.delete(k); });
  old.forEach(o => broken.push(E(o.a, o.b, o.order, o.oa, o.ob)));
  m0.atoms.forEach(a => { if (a.fly) return; const na = map.get(a); if (!on(na)) left.push({ id: idOf(na), from: a.id, el: a.el }); });
  const added = []; m1.atoms.forEach(a => { if (on(a) && !inv.has(a)) added.push({ id: a.id, el: a.el }); });
  const moved = []; for (let i = left.length - 1; i >= 0; i--) { if (left[i].el !== 'H') continue; const j = added.findIndex(x => x.el === 'H'); if (j < 0) break; moved.push({ from: left[i].from, to: added[j].id, el: 'H' }); left.splice(i, 1); added.splice(j, 1); }
  return { made, broken, changed, left, added, moved };
}
function pageFrom(g, mark, off0) {
  const circ = [], chain = [], steps = []; let cur = -1;
  for (const t of g.trail.slice(mark)) {
    if (t.free) { chain.push(RX.ENG.KIND[t.id] || t.id); steps.push({ kind: RX.ENG.KIND[t.id] || t.id, join: t.join || null, via: t.via || 'chain', made: t.made || null, broken: t.broken || null, changed: t.changed || null, left: t.left || null, added: t.added || null, moved: t.moved || null, off: t.off || null }); if (cur >= 0) circ[cur].set++; continue; }
    circ.push({ id: t.id, places: t.id === BANKID || t.wasted ? 0 : t.hits || 0, bank: t.id === BANKID, set: 0, made: t.made || null, broken: t.broken || null, changed: t.changed || null, left: t.left || null, added: t.added || null, moved: t.moved || null, off: t.off || null }); cur = circ.length - 1;
  }
  const o1 = offOf(g.tally), off = {}; let total = 0; SPEC_JARS.forEach(j => { off[j] = o1[j] - off0[j]; total += off[j]; });
  return { circ, chain, steps, off, total, F: SX.featOf(g.m) };
}
function specBegin(g, run) {
  g.specDef = RULE.spec && run && run.spec && run.spec.parts ? run.spec : null; g.spec = null; g.rec = null;
  if (!g.specDef) return;
  g.rec = { f0: SX.featOf(g.m), pages: [], mark: 0, off0: offOf(g.tally) }; specUpdate(g);
}
function specPage(g) {
  const r = g.rec; if (!r || g.page <= r.pages.length) return;
  g.rec = { f0: r.f0, pages: r.pages.concat([pageFrom(g, r.mark, r.off0)]), mark: g.trail.length, off0: offOf(g.tally) }; specUpdate(g);
}
function specRec(g, live) {
  const r = g.rec; if (!r) return null; let pages = r.pages;
  if (live !== false && g.page > pages.length && g.trail.length > r.mark) pages = pages.concat([pageFrom(g, r.mark, r.off0)]);
  return { f0: r.f0, pages };
}
function specEvent(d, pages, f0) {
  const circs = p => p.circ.filter(c => !c.bank), key = d.key;
  const sum = f => pages.reduce((t, p) => t + f(p), 0), most = f => pages.reduce((t, p) => Math.max(t, f(p)), 0);
  if (key === 'lean') { let prev = f0 ? f0.get('atoms') : 0, n = 0; pages.forEach(p => { const a = p.F.get('atoms'); if (a < prev) n++; prev = a; }); return n; }
  if (key === 'held') return sum(p => { const k = circs(p).length; return k > 0 && k < 3 ? 1 : 0; });
  if (key === 'pure_water') { const w = sum(p => p.off.water || 0), all = sum(p => p.total); return Math.max(0, w - (all - w)); }
  if (key === 'pure_gas') { const gas = sum(p => (p.off.hydrogen || 0) + (p.off.carbon_dioxide || 0) + (p.off.acid_fumes || 0) + (p.off.trimethylamine || 0)); return Math.max(0, gas - sum(p => p.off.water || 0)); }
  if (key === 'opener') return most(p => (p.circ.length ? p.circ[0].set : 0));
  if (key === 'closer') return most(p => (p.circ.length >= 3 ? p.circ[2].set : 0));
  if (key === 'kinds_in_turn') return most(p => new Set(p.chain).size);
  if (key === 'all_three_feed') return sum(p => (p.circ.length === 3 && p.circ.every(c => c.set >= 1) ? 1 : 0));
  if (key === 'no_dead') return sum(p => (p.circ.length === 3 && circs(p).length === 3 && circs(p).every(c => c.places > 0) ? 1 : 0));
  if (key === 'distinct_triggers') return new Set([].concat(...pages.map(p => circs(p).filter(c => c.set > 0).map(c => c.id)))).size;
  if (key.slice(0, 5) === 'kind:') return sum(p => p.chain.filter(x => x === key.slice(5)).length);
  if (key === 'off:all') return sum(p => p.total);
  if (key.slice(0, 4) === 'off:') return sum(p => p.off[key.slice(4)] || 0);
  if (key === 'jars') return SPEC_JARS.filter(j => pages.some(p => p.off[j] > 0)).length;
  if (key === 'puff') return most(p => p.total);
  if (key === 'acted') return sum(p => circs(p).filter(c => c.places > 0).length);
  if (key === 'acted_kinds') return new Set([].concat(...pages.map(p => circs(p).filter(c => c.places > 0).map(c => c.id)))).size;
  throw new Error('spec: no event reader ' + key);
}
// the value of one spec (a row of SPEC_TABLE) over a record { f0, pages }
function specRead(d, rec) {
  const pages = d.by ? rec.pages.slice(0, d.by) : rec.pages;
  if (d.read === 'e') return specEvent(d, pages, rec.f0);
  if (!pages.length) return 0;
  const k = d.read === 'g' ? 'g:' + d.key : d.key, f0 = rec.f0.get(k), vals = pages.map(p => p.F.get(k)), mx = Math.max(...vals), mn = Math.min(...vals);
  switch (d.mode) {
    case 'gain': return Math.max(0, mx - f0);
    case 'loss': return Math.max(0, f0 - mn);
    case 'abs': return mx;
    case 'last': return vals[vals.length - 1];
    case 'lastgain': return Math.max(0, vals[vals.length - 1] - f0);
    case 'lastloss': return Math.max(0, f0 - vals[vals.length - 1]);
    case 'range': return Math.max(mx, f0) - Math.min(mn, f0);
  }
  throw new Error('spec: no reading ' + d.mode);
}
// the values of the parts of the round's spec. live (default): the page in play counts as it stands
function specParts(g, live) { const rec = specRec(g, live), D = g.specDef; if (!rec || !D) return []; return D.parts.map(p => { const v = specRead(SPEC_TABLE[p.name], rec) + counterBonus(g, SPEC_TABLE[p.name], rec); return { name: p.name, n: p.n, mark: p.mark, value: v, met: v >= p.n }; }); }
const specValue = (g, live) => { const p = specParts(g, live); return p.length ? p[0].value : 0; };
const specMet = (g, live) => { if (g && g.hom && g.hom.burnt && g.specDef) return true; const p = specParts(g, live); return p.length > 0 && p.every(q => q.met); };
function specUpdate(g) {
  const D = g.specDef; if (!D) { g.spec = null; return; }
  const ps = specParts(g, false), a = ps[0] || D.parts[0];
  g.spec = { kind: a.mark, n: a.n, mark: a.mark, name: a.name, text: D.text, value: a.value || 0, met: ps.length > 0 && ps.every(q => q.met), parts: ps.length ? ps : D.parts.map(p => ({ name: p.name, n: p.n, mark: p.mark, value: 0, met: false })) };
}
// the round is won when the spec is met; with no spec on, when the yield passes the number to beat
// and, where RULE.needPar is set, the yield must also pass its share of the number to beat (needYield)
const needShare = run => { const L = run && (run.tierNo === 1 ? RULE.needParB : ((RULE.needParBy && RULE.needParBy[run.len]) || RULE.needPar)); if (!L) return 0; const r = Math.max(1, run.round || 1); return +(Array.isArray(L) ? L[Math.min(r, L.length) - 1] : L) || 0; };
const needYield = run => { run = runOf(run); return needShare(run) * ((run && run.quota) || 0); };
// a round lost by under 15 in 100: the spec met and the yield at least 0.85 of the pass mark, or the yield past the mark and at least 0.85 of the spec reached
function roundNear(g, run) { run = runOf(run); if (!g.specDef || !run || run.tierNo === 1 || roundWon(g, run)) return false;   // long runs only (the bachelor's has no mark)
  const need = needYield(run), y = need > 0 ? g.total / need : 9, ps = specParts(g, false), pr = ps.length ? ps.reduce((t, q) => t + Math.min(q.value, q.n) / q.n, 0) / ps.length : 0; return (pr >= 1 && y >= 0.85) || (y >= 1 && pr >= 0.85); }
const roundWon = (g, run) => (g.specDef ? specMet(g) && g.total >= needYield(run) : g.total >= ((run && run.quota) || g.quota || 0));
// ---------- aiming: how a player plays for the spec first and yield second ----------
// progress toward the spec after a line: each part counts min(value, n) / n (hurdles.py AimPlayer)
function specProg(g) { if (g && g.hom && g.hom.burnt && g.specDef) return g.specDef.parts.length; let t = 0; specParts(g, true).forEach(p => { t += Math.min(p.value, p.n) / p.n; }); return Math.round(t * 1e9) / 1e9; }
function specLines(g) {
  const L = stepsOf(g) - g.pageSteps; if (L <= 0) return [];
  const last = g.page >= pagesOf(g), fin = last ? finishOpt(g) : null; let ids = g.kinds.filter(id => usesLeft(g, id) > 0); if (fin) ids = ids.concat(['#finish']);
  const short = !!(g.specDef && g.specDef.parts.some(p => p.name === 'held_back')) || (hom2On(g) && g.hom.id === 'h2' && !!HOMS2K.h2.two), lines = [], rec = cur => { if (cur.length === L) { lines.push(cur); return; } if (short && cur.length >= 1) lines.push(cur); for (const id of ids) { if (id === '#finish' ? cur.includes(id) : !(g.free && g.free[id]) && cur.filter(x => x === id).length >= (g.left[id] || 0)) continue; rec(cur.concat(id)); } };
  rec([]); return lines;
}
function specTry(g, line) {
  const s = snap(g); g.queue = []; line.forEach(id => queueAdd(g, id === '#finish' ? SYN.finish : id)); while (g.queue.length && !g.over) queueStep(g);
  let v = { prog: specProg(g), made: made(g) }; const run = g.runRef, need = RULE.aimPar && run && !run.proof ? needYield(run) : 0;
  if (need > 0) v.prog = Math.round((v.prog + Math.min(1, v.made / need)) * 1e9) / 1e9;
  // RULE.homAim: the line is weighed with the creature's tap (as sweep_core.py choose with peek): what the round is worth if it is tapped after this line
  if (RULE.homAim && hom2On(g) && run && !run.proof && !g.over) { g.shot = true; if (homAfter(g)) v = homValue(g); const w = homPeek(g, v); if (w) v = w; }   // what it does by itself (the pop, the wilt) is seen first
  back(g, s); return v;
}
// The line this page would be given by a player who aims at the spec. look: how many lines it considers, picked at random from
// the lines the hand allows (null: all of them). Spec progress first, yield to break a tie.
function specLine(g, rnd, look) {
  const R = rnd || rand; let lines = specLines(g); if (!lines.length) return [];
  if (look && lines.length > look) { lines = lines.slice(); for (let i = lines.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = lines[i]; lines[i] = lines[j]; lines[j] = t; } lines = lines.slice(0, look); }
  let best = null, ties = 0;
  lines.forEach(l => { const v = specTry(g, l); if (!best || v.prog > best.v.prog || (v.prog === best.v.prog && v.made > best.v.made)) { best = { l, v }; ties = 1; } else if (v.prog === best.v.prog && v.made === best.v.made && R() < 1 / ++ties) best = { l, v }; });
  return best.l;
}
// plays a round on a molecule with an aiming player and says whether the spec was met: the proof that it can be reached
function specPlay(run, model, parts, rnd, look) {
  const R = rnd || rand, r2 = Object.assign({}, run, { manual: false, proof: true, spec: { parts, text: '' } }), g = synBegin(RX.cloneModel(model), false, R, r2.gear || [], r2);
  while (!g.over) {
    const line = specLine(g, R, look); line.forEach(id => queueAdd(g, id === '#finish' ? SYN.finish : id)); while (g.queue.length && !g.over) queueStep(g); g.queue = [];
    if (g.over) break; if (g.page >= pagesOf(g)) { synEnd(g); break; } turn(g, R);
  }
  return specMet(g, false);
}
// ---------- the generator ----------
const sfN = (sf, target) => { let n = 0; for (let k = 1; k < sf.length; k++) { if (sf[k] >= target) n = k; else break; } return n; };
function specNeed(d, carried) {
  if (!d.need) return true;
  return d.need.some(x => x === 'never' ? false : x === 'mode:co2' ? !!RX.MODE.co2 : x.slice(0, 6) === 'selfs:' ? carried.filter(c => SELF.some(q => q.id === c)).length >= +x.slice(6) : carried.includes(x));
}
const specClash = (a, b) => SPEC_TABLE[a].fam === SPEC_TABLE[b].fam || SPEC_TABLE[a].plan === SPEC_TABLE[b].plan || SPEC_CLASH.some(c => (c[0] === a && c[1] === b) || (c[0] === b && c[1] === a));
// molecule: a model or a SMILES. carried: the reagent ids and reflex ids the run holds. hist: the families of the earlier rounds of this
// run (a list of lists). run: the run, for the proof (aiming plays). Returns { kind, n, mark, name, text, family, parts, fell, tries, proof }.
// Table mode: N is the largest N whose share of aiming players is at least the round's target (SPEC_TARGET, from the table), and
// from round 6 two specs of different families, each at the square root of the target. A spec is offered only when an aiming
// player reached it in SPEC_REACH plays on this molecule (a bounded search: plays, not the full beam of hurdle_gen.py).
const SPEC_REACH = { plays: 3, look: 30 };
function specPick(molecule, round, carried, rnd, tier, hist, run) {
  round = Math.max(1, Math.min(9, round | 0));     // rounds past nine (the postdoc) are set round nine's specs, as the simulator does
  const R = rnd || rand, model = molecule && molecule.atoms ? RX.cloneModel(molecule) : RX.fromSmiles(molecule); RX.reopen(model);
  carried = carried || []; hist = hist || []; const last = hist.length ? hist[hist.length - 1] : [], recent = {}; hist.slice(-4).forEach(f => f.forEach(x => { recent[x] = (recent[x] || 0) + 1; }));
  const target = Math.max(0.05, Math.min(0.99, SPEC_TARGET[Math.max(1, Math.min(9, round))] + (run && run.tierNo === 1 ? (RULE.specEase || 0) + ((RULE.specShift || {})[round] || 0) : ((RULE.specShiftLong || {})[round] || 0)))), pair = round >= (signHas(run, 'pair1') ? 1 : signHas(run, 'pair4') ? Math.min(4, RULE.pairFrom || 6) : (RULE.pairFrom || 6)), rider = pair && SPEC_TABLE.held_back && SPEC_TABLE.held_back.good.includes(round) && !last.includes('restraint') && R() < SPEC_RIDER.p, t1 = pair ? Math.min(0.97, Math.sqrt(target / 0.9)) : target, t1r = Math.min(0.97, target / SPEC_RIDER.factor);
  const open = name => { const d = SPEC_TABLE[name]; if (run && run.tierNo === 1 && !RULE.specRate && ((RULE.specBan || []).includes(name) || ((RULE.specBanBy || {})[round] || []).includes(name))) return false; if (run && run.tierNo !== 1 && ((RULE.specBanByLong || {})[round] || []).includes(name)) return false; return !d.rider && d.good.includes(round) && (SPEC_FAMILY_TIER[d.fam] == null ? 3 : SPEC_FAMILY_TIER[d.fam]) <= (tier == null ? 3 : tier) && specNeed(d, carried); };
  const order = list => list.map(n => [n, R() * (1 + 2 * (recent[SPEC_TABLE[n].fam] || 0))]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
  const atoms0 = SX.featOf(model).get('atoms');
  const nOf = (name, tg) => { const d = SPEC_TABLE[name], u = d.use[round] || []; let best = 0, bd = 9; u.forEach(q => { const e = Math.abs(q[1] - tg); if (e < bd) { bd = e; best = q[0]; } }); const cap = d.cap === 'start' ? Math.min(atoms0, 56 - atoms0) : d.cap === 'half' ? Math.floor(atoms0 / 2) : 1e9; if (run && run.tierNo === 1 && RULE.specRate) {
      // the rate-based ease (RULE.specRate): N is the one the simulated NOVICE clears nearest the round's target rate, read from SPEC_RATE (measured in the game on these
      // molecules); a spec is not offered when no N comes within tol of the target, or when the median player clears that N more than gap above the novice (a spec won by
      // searching every line rather than by what is dealt and built)
      const T = RULE.specRate[round] || RULE.specRate[3], row = ((SPEC_RATE.b || {})[round] || {})[name]; if (!row || !row.novice) return 0;
      const want = 100 * Math.max(0.05, Math.min(0.99, T.t + (RULE.specEase || 0) + ((RULE.specShift || {})[round] || 0))); let bn = 0, be = 1e9;
      row.novice.forEach((v, i) => { const e = Math.abs(v - want); if (e < be) { be = e; bn = i + 1; } });
      if (!bn || be > 100 * T.tol || ((row.median || [])[bn - 1] || 0) - row.novice[bn - 1] > 100 * T.gap) return 0;
      return Math.min(bn, cap);
    }
    if (run && run.tierNo === 1) best = Math.max(1, Math.round(best * ((RULE.specScale || {})[round] || 1)));
    else if (best && RULE.specScaleLong) best = Math.max(1, Math.round(best * (RULE.specScaleLong[round] || 1)));
    if (best && signHas(run, 'tasks')) best = Math.max(1, Math.round(best * SIGN.tasks)); return Math.min(best, cap); };
  const reach = parts => { if (!run) return 1; for (let k = 0; k < SPEC_REACH.plays; k++) if (specPlay(run, model, parts, R, SPEC_REACH.look)) return k + 1; return 0; };
  const mk = (name, n) => ({ name, n, mark: SPEC_TABLE[name].mark, text: (n === 1 ? SPEC_TABLE[name].text1 : SPEC_TABLE[name].text.replace('{N}', n)), plan: SPEC_TABLE[name].plan, family: SPEC_TABLE[name].fam });
  const names = Object.keys(SPEC_TABLE).filter(open); let tries = 0, got = null;
  for (const a of order(names.filter(n => !last.includes(SPEC_TABLE[n].fam))).slice(0, 10)) {
    const na = nOf(a, t1); tries++; if (na < 1) continue;
    if (rider) { const ra = nOf(a, t1r), nr = nOf('held_back', 1); tries++; if (ra < 1 || nr < 1) continue; const ps = [mk(a, ra), mk('held_back', nr)], proof = reach(ps); if (proof) { got = { parts: ps, proof }; break; } continue; }
    if (!pair) { const proof = reach([mk(a, na)]); if (proof) { got = { parts: [mk(a, na)], proof }; break; } continue; }
    for (const b of order(names.filter(n => !specClash(a, n) && !last.includes(SPEC_TABLE[n].fam))).slice(0, 6)) { const nb = nOf(b, t1); tries++; if (nb < 1) continue; const ps = [mk(a, na), mk(b, nb)], proof = reach(ps); if (proof) { got = { parts: ps, proof }; break; } }
    if (got) break;
  }
  let fell = false;
  if (!got) { fell = true; for (const nm of ['off_total', 'growth', 'branch'].filter(x => SPEC_TABLE[x] && !last.includes(SPEC_TABLE[x].fam)).concat(['off_total', 'growth', 'branch'])) { if (!SPEC_TABLE[nm]) continue; const n = Math.max(1, nOf(nm, target)); got = { parts: [mk(nm, n)], proof: 0 }; if (reach(got.parts)) break; } if (!got) got = { parts: [mk('off_total' in SPEC_TABLE ? 'off_total' : Object.keys(SPEC_TABLE)[0], 1)], proof: 0 }; }
  const a = got.parts[0];
  return { kind: a.mark, n: a.n, mark: a.mark, name: a.name, text: got.parts.map(p => p.text).join(' and '), family: a.family, families: got.parts.map(p => p.family), parts: got.parts, fell, tries, proof: got.proof };
}
// The end of a round (the page and the rig call this once). The round is won by the spec (roundWon); yield is separate: it pays
// gold at the four marks (runEarn) whenever it passes the number to beat, and letters the words, spec met or not. A won round
// counts toward the run; a lost round ends it (run.over). Returns what the end screen needs.
const WORDS = ['stable', 'unstable', 'volatile', 'overreact'];
function roundEnd(g, run) {
  if (run.endedRound === (run.round || 1) && run.endedFor === g) return run.endedRes;
  const won = roundWon(g, run), ypass = g.total >= run.quota, extra = run.payCoins || 0, earn = runEarn(run, g.total, run.quota), marks = marksHit(g.total, run.quota);
  // a round won by the spec with a low yield still pays what the harder molecule promised
  if (won && !ypass && RULE.coins && extra) { run.coins = (run.coins || 0) + extra; earn.extra = extra; }
  if (won && RULE.coins && RULE.goldClear && !bareRun(run)) { run.coins = (run.coins || 0) + RULE.goldClear; earn.extra = (earn.extra || 0) + RULE.goldClear; earn.clear = RULE.goldClear; }      // sixteenth: gold for a round cleared (on at 1 since the seventeenth)
  if (won && RULE.aquaRounds && (run.sigils || []).includes('aqua_permanens')) { const e = (run.sigLog || []).filter(x => x.id === 'aqua_permanens').pop(); if (e && (run.round || 1) - e.round + 1 >= RULE.aquaRounds) { run.sigils = run.sigils.filter(x => x !== 'aqua_permanens'); run.sigGone = (run.sigGone || []).concat(['aqua_permanens']); sigSync(run); } }
  if (RULE.brimOnce && g.hom && g.hom.id === 'brimstone' && g.hom.burnt) run.homSpent = Object.assign({}, run.homSpent, { brimstone: run.round || 1 });      // nineteenth: Brimstone's fire is gone for the run
  if (!run.log) run.log = [];
  const word = ypass ? WORDS[Math.min(WORDS.length - 1, marks)] : null;
  if (run.meta) countersUpdate(run.meta, run, g);
  run.log.push({ round: run.round || 1, won, ypass, word, total: g.total, quota: run.quota, marks, gold: earn.marks + earn.interest + (earn.extra || 0), spec: g.spec ? { name: g.spec.name, n: g.spec.n, value: specValue(g, false), parts: specParts(g, false) } : null });
  if (won && !run.over) run.beaten = (run.beaten || 0) + 1; if (!won) run.over = true;
  const res = { won, ypass, word, marks, earn, spec: g.spec, runWon: runWon(run), last: (run.round || 1) >= runLast(run), run: run.len };
  run.endedRound = run.round || 1; run.endedFor = g; run.endedRes = res; return res;
}
// What a run earned, won or lost, for the end screen: rounds cleared, gold, the word reached in each round, credit, and the
// length it opens. Findings are not built: the counters they will read are in by.
function runResult(run) {
  const won = runWon(run), log = run.log || [];
  if (run.meta && !run.countedRun) { run.countedRun = true; countersRun(run.meta, run); run.earned = ladderDue(run.meta); }
  return { earned: run.earned || [], len: run.len, rounds: runLast(run), cleared: run.beaten || 0, won, lostAt: won ? null : Math.min(runLast(run), (run.beaten || 0) + 1), gold: log.reduce((t, r) => t + r.gold, 0), coins: run.coins || 0, words: log.map(r => r.word), credit: (run.beaten || 0) + (run.bonus || 0), opens: won && run.tierNo < 3 ? lengthOf(run.tierNo + 1).name : null, by: Object.assign({}, run.by), log };
}
// the highest length opened after a run: a won run opens the next
const reachAfter = (reach, run) => { const top = RULE.postdoc ? 4 : 3; return Math.max(Math.max(1, Math.min(top, reach | 0)), runWon(run) ? Math.min(top, (run.tierNo || 3) + 1) : 1); };
// the fold of a molecule for the page: rows, columns, which side each atom points to, who hosts whom, and the pairs that face across it
function foldOf(m, K) { const ENG = RX.ENG, G = ENG.snapG(m), f = ENG.foldOf(G, K), at = i => G.atoms[i]; const pos = new Map(), down = new Map(), host = new Map(); f.pos.forEach((v, i) => pos.set(at(i), v)); f.down.forEach((v, i) => down.set(at(i), v)); f.host.forEach((h, i) => host.set(at(i), at(h)));
  return { K: f.K, rows: f.rows, anchor: at(f.anchor), path: f.path.map(at), pos, down, host, rungs: f.rung.map(r => [at(r[0]), at(r[1])]), across: ENG.acrossPairs(G, K).map(p => [at(p[0]), at(p[1]), p[2]]), faces: (a, b) => ENG.faces(f, G.idx.get(a), G.idx.get(b)) }; }
AA.rxPath = { motifAtoms, homSpent, LONG_MARK, SXm: SX, homBase, homF, homNumbers, HOMS2K_17, JARSTART, jarFull, stageOf, gateOpen, SIGIL_GET, sigilVisit, sigilGet, sigilPrice, sigilPays, sigStrong, refNums, HOMSIMPLE, homSimple, HOMGROW, homStage, sigilRoom, facts, reference, REFERENCE_CATS, owned, profileOpts, thingOf, rungHow, marksOf, redrawInfo, SIGILS, sigilsOf, sigSync, sigOn, FLAT, flat, homPeek, HOMAIM, FEED_CL, LADDER, LADDER_CAP, ladderDue, ladderState, roundNear, SIGN, signOf, signLift, signBar, signHas, signCan, signTake, signState, needYield, needShare, heldFor, FEED_ROUNDS, FEED_BANK, foldOf, FINDING_COUNTS, findingsProgress, countersUpdate, countersRun, countersNew, OFFER_STATS, OFFER_K, unlocked, offerWeight, offerStock, offerVisit, offerPrice, offerBuy, MOTIFS, MOTIF_START, motifsOf, motifOpen, reflexesHeld, selfCounts, LENGTHS, lengthOf, roundEnd, runResult, reachAfter, SPEC_TABLE, SPEC_TARGET, SPEC_REACH, specNumbers, specValue, specMet, specParts, specPick, hetFeed, feedsFor, KIN_OF, bondDiff, specNeed, specLine, specPlay, specRec, specRead, roundWon, spec: { table: SPEC_TABLE, target: SPEC_TARGET, reach: SPEC_REACH, readers: SX, numbers: specNumbers, value: specValue, met: specMet, parts: specParts, pick: specPick, line: specLine, play: specPlay, roundWon }, swapQueue, usesFreeOn, modeSync, SINK, useCost, canBuyUse, buyUse, TIERS, tierRule, runLast, runWon, bareRun, usesBind, LASTX, FILTER, feedShape, queueSwap, queueMove, fitsNow, queueFits, FEEDSIZE, CHOOSE, easeOf, pairCost, runRedraw, JAR, HOMS, HOMSIM, homOn, homEvent, homFed, homLit, frozenPay, HOMS2K, HOMS1, HOMS2, homAfter, homValue, homRest: hom2Rest, homPageRec: g => (hom2On(g) ? hom2Rec(g) : null), homReady, homSpots, homTry, homUse, homGo, runBank, FIVE, FIFTH, fifthSet, TOOLUSES, canTool, toolSpots, toolUse, toolGo, benchLeft, benchUsed, toolTry, toolWorth, toolBest, startDue, startRun, again, cascMode, afterTurn, dealtIn, RULE, CASC, SELF0, selfRun, screenStep, screenLines, screen, screenRound, FEED, feedSize, sizeFor, feedsFor, reopenAll, cascadeNext, cascadeDue, cascade, snap, back, BANKID, queued, usesLeft, queueRoom, queueAdd, queueDrop, queueHead, queueShift, queueStep, queueView, waste, heavy, usesOf, handOf, chainOpts, canBank, bankGain, bank, canRedraw, redrawCost, redraw, seed, rand, MODEL, ASSAYS, runAssays, assayOf, TERMS, CIRCLE, runTerm, deeds, wish, douse, SELFMODE, selfOptions, SELF, KIN, kinOf, kinsOf, charged, fire, chainNext, byKind, CATCH, BY, RARITY, TIER, rarityOf, FAMILIES, FOUND, peek, PAIR, ISO, salt, runKeep, BRIEFS, BRIEF, runBriefs, runChoose, runPay, modelOf, briefBase, PAR, MOLF, MOLD, KINDF, ASSAYF, kindSize, parOf, quotaParts, runMarks, marksHit, COIN, rerollCost, interestOf, runEarn, runReroll, runSkip, runBin, pagesOf, stepsOf, SUPPLY, stock, RUNG, runNew, runBegin, runQuota, runPicks, runTake, pickText, DIAL, FEEDS, GEAR, GEARS, OFFER: 4, begin, options, take, deliver, survey, deal, keeps, safe, kit,
  SYN, RARE, STYLES, kitRound, synRack, synBegin, synTake, synFinish, synEnd, synQuota, synPlay, held, made, mult, breaks, turn, finishOpt };
})(typeof globalThis !== 'undefined' ? globalThis : window);
