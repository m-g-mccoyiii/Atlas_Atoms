"""molecules2.py: the starting molecules for Overreact, rounds 1 to 9, and the generator for endless play.

Built by the judge of the three designers (mol2_generator.py, mol2_real-compounds.py, mol2_puzzle-first.py) from 24 molecules a round
that were screened on the engine of this folder.  Read MOLECULES.md first.

  POOLS[round]            list of dicts: smiles, name, kind, heavy, groups, motifs, why, origin, frame
  pool(round)             the dicts of one round;  smiles(round) the SMILES strings
  generate(round, rng)    one new molecule from the generator, held to the filter below (endless play)
  deal(round, rng, avoid) one molecule for a round: from the pool with chance P_POOL[round], else generated
  check()                 parse, size, no repeats
  python molecules2.py check | show [round] | atoms | sample [round] [n] | js | bank [n]

Nothing existing is edited.  The generator is mol2_generator.deal with the dials below as a filter.
"""
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

from rdkit import Chem, RDLogger  # noqa: E402

RDLogger.DisableLog('rdApp.*')

# heavy atoms a round asks for (the window the pool and the generator are held to)
SIZE = {1: (10, 12), 2: (11, 14), 3: (13, 16), 4: (15, 19), 5: (18, 22), 6: (21, 26), 7: (25, 30), 8: (29, 33), 9: (31, 35)}

# the generator dials: what a generated molecule must satisfy before it is dealt (on top of mol2_generator.DIALS)
GEN_FILTER = {
    'max_group_density': {1: 0.30, 2: 0.30, 3: 0.30, 4: 0.32, 5: 0.32, 6: 0.32, 7: 0.34, 8: 0.34, 9: 0.34},   # groups per heavy atom
    'max_hetero_kinds': {1: 1, 2: 2, 3: 2},      # N, S, Cl kinds in one molecule in rounds 1 to 3 (later rounds: no limit)
    'round1_rings': 'one ring system, no fused or spiro rings; round 2 no spiro, at most two rings',
}
# the chance that a dealt molecule is taken from the hand-checked pool (the rest are generated)
P_POOL = {1: 0.9, 2: 0.85, 3: 0.8, 4: 0.7, 5: 0.65, 6: 0.6, 7: 0.55, 8: 0.5, 9: 0.5}

POOLS = {int(k): v for k, v in {
 "1": [
  {
   "smiles": "C=C1CC(C)C(O)C1C=O",
   "name": "carbon ring (cyclopentane) with OH, C=O, C=C",
   "kind": "made up",
   "heavy": 10,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "ring",
   "why": "a carbon or hetero ring; in play it sets off dry, ring",
   "pay": 415,
   "steps": 1.97,
   "frame": "ring",
   "origin": "generator extra"
  },
  {
   "smiles": "C=CC(O)CC(=O)CSC",
   "name": "open chain with OH, C=O, C=C, S bridge",
   "kind": "made up",
   "heavy": 10,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "sulfur",
   "why": "an open chain; in play it sets off ring, dry; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach",
   "pay": 479,
   "steps": 2.22,
   "frame": "chain",
   "origin": "generator pool"
  },
  {
   "smiles": "C=CCCC(=O)CCC=O",
   "name": "ketone with a vinyl-ended arm (3 carbons from the C=O) and an aldehyde arm (3 carbons from the C=O)",
   "kind": "made up",
   "heavy": 10,
   "groups": "C=O 2 C=C 1",
   "motifs": "",
   "why": "an open chain; in play it sets off ring",
   "pay": 375,
   "steps": 2.0,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=CCCC1C=CCC1=O",
   "name": "carbon ring (cyclopentane) with C=O, 2 C=C",
   "kind": "made up",
   "heavy": 10,
   "groups": "C=O 1 C=C 2",
   "motifs": "ring",
   "why": "a carbon or hetero ring; in play it sets off ring, dry; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach",
   "pay": 350,
   "steps": 1.86,
   "frame": "ring",
   "origin": "generator extra"
  },
  {
   "smiles": "NCC1CC=CC(C=O)C1",
   "name": "cyclohexene carrying an aldehyde and an aminomethyl",
   "kind": "made up",
   "heavy": 10,
   "groups": "C=O 1 C=C 1 NH2 1",
   "motifs": "ring amine",
   "why": "a carbon or hetero ring; in play it sets off dry, ring",
   "pay": 330,
   "steps": 1.61,
   "frame": "ring",
   "origin": "real-compounds set"
  },
  {
   "smiles": "O=C1CC=CC1CCCO",
   "name": "carbon ring (cyclopentane) with OH, C=O, C=C",
   "kind": "made up",
   "heavy": 10,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "ring",
   "why": "a carbon or hetero ring; in play it sets off ring, dry; OH and C=O 3 to 4 apart: ring",
   "pay": 385,
   "steps": 1.97,
   "frame": "ring",
   "origin": "generator pool"
  },
  {
   "smiles": "O=CC=Cc1ccccc1",
   "name": "cinnamaldehyde",
   "kind": "real compound",
   "heavy": 10,
   "groups": "C=O 1 C=C 1",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off dry, ring",
   "pay": 300,
   "steps": 1.42,
   "frame": "benzene",
   "origin": "real-compounds set"
  },
  {
   "smiles": "C=C(C)C1=CCC(C)CC1=O",
   "name": "near-relative of menthone",
   "kind": "near-relative",
   "heavy": 11,
   "groups": "C=O 1 C=C 2",
   "motifs": "ring resonance",
   "why": "a carbon or hetero ring; in play it sets off ring, dry; two C=C in a row: a run of alternating double bonds",
   "pay": 438,
   "steps": 1.94,
   "frame": "ring",
   "origin": "generator pool"
  },
  {
   "smiles": "C=C(C)CCC(=O)CC(=C)C",
   "name": "ketone with an isopropenyl arm (2 carbons from the C=O) and an isopropenyl arm (3 carbons from the C=O)",
   "kind": "made up",
   "heavy": 11,
   "groups": "C=O 1 C=C 2",
   "motifs": "",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 445,
   "steps": 2.17,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=CC(CCC)C(O)CC=O",
   "name": "open chain with OH, C=O, C=C",
   "kind": "made up",
   "heavy": 11,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "",
   "why": "an open chain; in play it sets off ring, dry; OH two carbons from a C=O: dry",
   "pay": 468,
   "steps": 2.14,
   "frame": "chain",
   "origin": "generator pool"
  },
  {
   "smiles": "C=CC1NCC(C(C)=O)C1O",
   "name": "ring with an N (pyrrolidine) with OH, C=O, C=C",
   "kind": "made up",
   "heavy": 11,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "ring amine",
   "why": "a carbon or hetero ring; in play it sets off dry, ring; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach",
   "pay": 450,
   "steps": 2.19,
   "frame": "ring",
   "origin": "generator extra"
  },
  {
   "smiles": "C=CCC(=O)CCC(C)(C)O",
   "name": "ketone with a vinyl-ended arm (2 carbons from the C=O) and a tertiary alcohol arm (3 carbons from the C=O)",
   "kind": "made up",
   "heavy": 11,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 397,
   "steps": 2.03,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=CCC(=O)c1ccccc1",
   "name": "benzene ring (benzene) with C=O, C=C",
   "kind": "made up",
   "heavy": 11,
   "groups": "C=O 1 C=C 1",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off dry, ring",
   "pay": 457,
   "steps": 2.06,
   "frame": "benzene",
   "origin": "generator pool"
  },
  {
   "smiles": "CC(C)=C1CCC(C)CC1=O",
   "name": "pulegone",
   "kind": "real compound",
   "heavy": 11,
   "groups": "C=O 1 C=C 1",
   "motifs": "ring resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, ring",
   "pay": 434,
   "steps": 2.11,
   "frame": "ring",
   "origin": "generator pool"
  },
  {
   "smiles": "CC(C)=CCCC(C)=CC=O",
   "name": "citral",
   "kind": "real compound",
   "heavy": 11,
   "groups": "C=O 1 C=C 2",
   "motifs": "resonance",
   "why": "an open chain; in play it sets off dry, ring",
   "pay": 332,
   "steps": 1.56,
   "frame": "chain",
   "origin": "generator pool"
  },
  {
   "smiles": "CCCCCC=CC=CC=O",
   "name": "2,4-decadienal",
   "kind": "real compound",
   "heavy": 11,
   "groups": "C=O 1 C=C 2",
   "motifs": "resonance",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 497,
   "steps": 2.28,
   "frame": "chain",
   "origin": "real-compounds set"
  },
  {
   "smiles": "C=C(C)C1CCC(C)C(=O)C1=O",
   "name": "near-relative of menthone",
   "kind": "near-relative",
   "heavy": 12,
   "groups": "C=O 2 C=C 1",
   "motifs": "ring resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, ring; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach",
   "pay": 589,
   "steps": 2.61,
   "frame": "ring",
   "origin": "generator extra"
  },
  {
   "smiles": "C=C(C)CC(=O)CCC(C)(C)O",
   "name": "isopropenyl ketone with a tertiary alcohol",
   "kind": "made up",
   "heavy": 12,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 406,
   "steps": 2.08,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=C(C)CCC(=O)CCCC=O",
   "name": "ketone with an isopropenyl arm (3 carbons from the C=O) and an aldehyde arm (4 carbons from the C=O)",
   "kind": "made up",
   "heavy": 12,
   "groups": "C=O 2 C=C 1",
   "motifs": "",
   "why": "an open chain; in play it sets off ring",
   "pay": 375,
   "steps": 2.0,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=C(C)CCCC(=O)CCC=O",
   "name": "ketone with an isopropenyl arm (4 carbons from the C=O) and an aldehyde arm (3 carbons from the C=O)",
   "kind": "made up",
   "heavy": 12,
   "groups": "C=O 2 C=C 1",
   "motifs": "",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 419,
   "steps": 2.11,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=CC(O)CCCC1CCCC1",
   "name": "a chain with a cyclopentane ring",
   "kind": "made up",
   "heavy": 12,
   "groups": "OH 1 C=C 1",
   "motifs": "ring",
   "why": "a carbon or hetero ring; in play it sets off dry, ring",
   "pay": 324,
   "steps": 1.53,
   "frame": "ring",
   "origin": "real-compounds set"
  },
  {
   "smiles": "C=CCCC(=O)CCC(C)(C)O",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 12,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 375,
   "steps": 2.0,
   "frame": "chain",
   "origin": "game table"
  },
  {
   "smiles": "CC(=O)C=CC1NCCCC1O",
   "name": "ring with an N (piperidine) with OH, C=O, C=C",
   "kind": "made up",
   "heavy": 12,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "ring amine resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, ring; OH and C=O 3 to 4 apart: ring",
   "pay": 465,
   "steps": 2.22,
   "frame": "ring",
   "origin": "generator pool"
  },
  {
   "smiles": "CC(C)=CCCC(=O)CCCO",
   "name": "like sulcatone, with a 2-carbon alcohol arm on a methyl end",
   "kind": "near-relative",
   "heavy": 12,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 438,
   "steps": 2.17,
   "frame": "chain",
   "origin": "real-compounds set"
  }
 ],
 "2": [
  {
   "smiles": "C=C(C)C1CC=C(C)C(=O)C1",
   "name": "carvone",
   "kind": "real compound",
   "heavy": 11,
   "groups": "C=O 1 C=C 2",
   "motifs": "ring resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, ring",
   "pay": 434,
   "steps": 2.08,
   "frame": "ring",
   "origin": "real-compounds set"
  },
  {
   "smiles": "C=CC(CC(=O)CCO)SC",
   "name": "open chain with OH, C=O, C=C, S bridge",
   "kind": "made up",
   "heavy": 11,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "sulfur",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 405,
   "steps": 2.0,
   "frame": "chain",
   "origin": "generator extra"
  },
  {
   "smiles": "CCCCCC(O)C=CC=O",
   "name": "4-hydroxy-2-nonenal",
   "kind": "real compound",
   "heavy": 11,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "resonance",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 407,
   "steps": 2.06,
   "frame": "chain",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CSCC1C(=O)CC=CC1O",
   "name": "carbon ring (cyclohexane) with OH, C=O, C=C, S bridge",
   "kind": "made up",
   "heavy": 11,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "ring sulfur",
   "why": "a carbon or hetero ring; in play it sets off dry, ring; OH two carbons from a C=O: dry",
   "pay": 365,
   "steps": 1.75,
   "frame": "ring",
   "origin": "generator pool"
  },
  {
   "smiles": "O=CC(C=C1CCCC1)CO",
   "name": "carbon ring (cyclopentane) with OH, C=O, C=C",
   "kind": "made up",
   "heavy": 11,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "ring",
   "why": "a carbon or hetero ring; in play it sets off ring, dry; OH two carbons from a C=O: dry",
   "pay": 402,
   "steps": 2.03,
   "frame": "ring",
   "origin": "generator extra"
  },
  {
   "smiles": "C=C(C)CCCC(=O)CC(=C)C",
   "name": "ketone with an isopropenyl arm (2 carbons from the C=O) and an isopropenyl arm (4 carbons from the C=O)",
   "kind": "made up",
   "heavy": 12,
   "groups": "C=O 1 C=C 2",
   "motifs": "",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 414,
   "steps": 2.0,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=CCCCC(=O)CCCC=O",
   "name": "ketone with a vinyl-ended arm (4 carbons from the C=O) and an aldehyde arm (4 carbons from the C=O)",
   "kind": "made up",
   "heavy": 12,
   "groups": "C=O 2 C=C 1",
   "motifs": "",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 419,
   "steps": 2.11,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC(=O)C=CC1CNCCC1O",
   "name": "ring with an N (piperidine) with OH, C=O, C=C",
   "kind": "made up",
   "heavy": 12,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "ring amine resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, ring; OH and C=O 3 to 4 apart: ring",
   "pay": 466,
   "steps": 2.22,
   "frame": "ring",
   "origin": "generator pool"
  },
  {
   "smiles": "CC(C)=CCCC(=O)CCC=O",
   "name": "ketone with an isoprenyl arm (3 carbons from the C=O) and an aldehyde arm (3 carbons from the C=O)",
   "kind": "made up",
   "heavy": 12,
   "groups": "C=O 2 C=C 1",
   "motifs": "",
   "why": "an open chain; in play it sets off ring",
   "pay": 375,
   "steps": 2.0,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=CC(=O)C(CC(C)(C)O)NCC",
   "name": "open chain with OH, C=O, C=C",
   "kind": "made up",
   "heavy": 13,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "amine resonance",
   "why": "an open chain; in play it sets off ring, dry; OH and C=O 3 to 4 apart: ring",
   "pay": 601,
   "steps": 2.69,
   "frame": "chain",
   "origin": "generator pool"
  },
  {
   "smiles": "C=CCCC(=O)CC1CCCC1=O",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 13,
   "groups": "C=O 2 C=C 1",
   "motifs": "ring",
   "why": "a carbon or hetero ring; in play it sets off ring",
   "pay": 366,
   "steps": 1.94,
   "frame": "ring",
   "origin": "game table"
  },
  {
   "smiles": "C=CCCC1CCC(CC=O)C1=O",
   "name": "carbon ring (cyclopentane) with 2 C=O, C=C",
   "kind": "made up",
   "heavy": 13,
   "groups": "C=O 2 C=C 1",
   "motifs": "ring",
   "why": "a carbon or hetero ring; in play it sets off ring; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach",
   "pay": 375,
   "steps": 2.0,
   "frame": "ring",
   "origin": "generator extra"
  },
  {
   "smiles": "CC(C)=C1C(=O)CC(C)(O)CC1=O",
   "name": "near-relative of pulegone",
   "kind": "near-relative",
   "heavy": 13,
   "groups": "OH 1 C=O 2 C=C 1",
   "motifs": "ring resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, ring; OH two carbons from a C=O: dry",
   "pay": 515,
   "steps": 2.28,
   "frame": "ring",
   "origin": "generator pool"
  },
  {
   "smiles": "CC(C)=CCC(=O)CCC(C)(C)O",
   "name": "ketone with an isoprenyl arm (2 carbons from the C=O) and a tertiary alcohol arm (3 carbons from the C=O)",
   "kind": "made up",
   "heavy": 13,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 464,
   "steps": 2.17,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "O=CCCCC(=O)CCCCCO",
   "name": "ketone with a primary alcohol arm (5 carbons from the C=O) and an aldehyde arm (4 carbons from the C=O)",
   "kind": "made up",
   "heavy": 13,
   "groups": "OH 1 C=O 2",
   "motifs": "",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 406,
   "steps": 2.08,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=CC(=O)c1ccc(O)c(OC)c1O",
   "name": "near-relative of eugenol",
   "kind": "near-relative",
   "heavy": 14,
   "groups": "OH 2 C=O 1 C=C 1 ether 1",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off ring, dry; OH two carbons from a C=O: dry",
   "pay": 607,
   "steps": 2.67,
   "frame": "benzene",
   "origin": "generator pool"
  },
  {
   "smiles": "C=CC(O)(CC=O)Cc1ccccc1",
   "name": "benzene ring (benzene) with OH, C=O, C=C",
   "kind": "made up",
   "heavy": 14,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off ring, dry; OH two carbons from a C=O: dry",
   "pay": 392,
   "steps": 1.97,
   "frame": "benzene",
   "origin": "generator pool"
  },
  {
   "smiles": "C=CC(O)CC(=O)CCCCC(=O)O",
   "name": "open chain with OH, C=O, C=C, COOH",
   "kind": "made up",
   "heavy": 14,
   "groups": "OH 1 C=O 1 C=C 1 COOH 1",
   "motifs": "acid",
   "why": "an open chain; in play it sets off dry, ring; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach",
   "pay": 569,
   "steps": 2.61,
   "frame": "chain",
   "origin": "generator pool"
  },
  {
   "smiles": "C=CCC(O)CC(=O)C1CCCCN1",
   "name": "ring with an N (piperidine) with OH, C=O, C=C",
   "kind": "made up",
   "heavy": 14,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "ring amine",
   "why": "a carbon or hetero ring; in play it sets off dry, ring; OH two carbons from a C=O: dry",
   "pay": 481,
   "steps": 2.28,
   "frame": "ring",
   "origin": "generator extra"
  },
  {
   "smiles": "CC(=O)C=CC1C(C)=CCCC1(C)C",
   "name": "alpha-ionone",
   "kind": "real compound",
   "heavy": 14,
   "groups": "C=O 1 C=C 2",
   "motifs": "ring resonance",
   "why": "a carbon or hetero ring; in play it sets off ring, dry",
   "pay": 450,
   "steps": 2.19,
   "frame": "ring",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC(=O)CC(O)C=CC1CCCSC1",
   "name": "a chain with a ketone, an OH 2 carbons from it, a C=C, a thiane ring",
   "kind": "made up",
   "heavy": 14,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "ring sulfur",
   "why": "a carbon or hetero ring; in play it sets off ring, dry",
   "pay": 447,
   "steps": 2.08,
   "frame": "ring",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC(=O)CCC=C(C)CCC=C(C)C",
   "name": "geranylacetone",
   "kind": "real compound",
   "heavy": 14,
   "groups": "C=O 1 C=C 2",
   "motifs": "",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 324,
   "steps": 1.64,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC(C=CC=O)C(O)c1ccccc1",
   "name": "benzene ring (benzene) with OH, C=O, C=C",
   "kind": "made up",
   "heavy": 14,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off ring, dry; a C=C two carbons from a C=O: shift, then more",
   "pay": 431,
   "steps": 2.06,
   "frame": "benzene",
   "origin": "generator pool"
  },
  {
   "smiles": "O=CCCC(=O)CCC1(O)CCCC1",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 14,
   "groups": "OH 1 C=O 2",
   "motifs": "ring",
   "why": "a carbon or hetero ring; in play it sets off ring, dry",
   "pay": 412,
   "steps": 2.11,
   "frame": "ring",
   "origin": "game table"
  }
 ],
 "3": [
  {
   "smiles": "CC(C=O)=C1C(=O)CC(C)CC1O",
   "name": "near-relative of pulegone",
   "kind": "near-relative",
   "heavy": 13,
   "groups": "OH 1 C=O 2 C=C 1",
   "motifs": "ring resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, ring; OH and C=O 3 to 4 apart: ring",
   "pay": 662,
   "steps": 2.94,
   "frame": "ring",
   "origin": "generator pool"
  },
  {
   "smiles": "OCC(O)COc1ccc(Cl)cc1",
   "name": "chlorphenesin",
   "kind": "real compound",
   "heavy": 13,
   "groups": "OH 2 Cl 1 ether 1",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off dry, ring",
   "pay": 443,
   "steps": 1.89,
   "frame": "benzene",
   "origin": "real-compounds set"
  },
  {
   "smiles": "C=C(C=O)CC1(O)CSC(CC=O)C1",
   "name": "ring with an S (thiolane) with OH, 2 C=O, C=C, S bridge",
   "kind": "made up",
   "heavy": 14,
   "groups": "OH 1 C=O 2 C=C 1",
   "motifs": "ring sulfur resonance",
   "why": "a carbon or hetero ring; in play it sets off ring, dry; enone with an OH three or four from its far end: tuck",
   "pay": 441,
   "steps": 2.14,
   "frame": "ring",
   "origin": "generator pool"
  },
  {
   "smiles": "C=CCC(=O)CCC1CC=CC(O)C1",
   "name": "cyclohexenol with an allyl ketone chain",
   "kind": "made up",
   "heavy": 14,
   "groups": "OH 1 C=O 1 C=C 2",
   "motifs": "ring",
   "why": "a carbon or hetero ring; in play it sets off ring, dry",
   "pay": 472,
   "steps": 2.22,
   "frame": "ring",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=CCCC(=O)CCC1(O)CCCC1",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 14,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "ring",
   "why": "a carbon or hetero ring; in play it sets off ring",
   "pay": 370,
   "steps": 1.97,
   "frame": "ring",
   "origin": "game table"
  },
  {
   "smiles": "C=CCCCCCCCCC=CC=O",
   "name": "like trans-2-nonenal, with a vinyl-ended arm on a methyl end",
   "kind": "near-relative",
   "heavy": 14,
   "groups": "C=O 1 C=C 2",
   "motifs": "resonance",
   "why": "an open chain; in play it sets off dry, ring",
   "pay": 382,
   "steps": 1.78,
   "frame": "chain",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC(=O)C=CC1=C(C)CCCC1(C)C",
   "name": "beta-ionone",
   "kind": "real compound",
   "heavy": 14,
   "groups": "C=O 1 C=C 2",
   "motifs": "ring resonance",
   "why": "a carbon or hetero ring; in play it sets off ring, dry",
   "pay": 446,
   "steps": 2.14,
   "frame": "ring",
   "origin": "generator extra"
  },
  {
   "smiles": "CC(C)=CCC(=O)CCCC(C)(C)O",
   "name": "ketone with an isoprenyl arm (2 carbons from the C=O) and a tertiary alcohol arm (4 carbons from the C=O)",
   "kind": "made up",
   "heavy": 14,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 470,
   "steps": 2.22,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC(C)=CCCCC(=O)CCCC=O",
   "name": "ketone with an isoprenyl arm (4 carbons from the C=O) and an aldehyde arm (4 carbons from the C=O)",
   "kind": "made up",
   "heavy": 14,
   "groups": "C=O 2 C=C 1",
   "motifs": "",
   "why": "an open chain; in play it sets off ring",
   "pay": 375,
   "steps": 2.0,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC(O)CCC(=O)CCCC(C)(C)O",
   "name": "ketone with a secondary alcohol arm (3 carbons from the C=O) and a tertiary alcohol arm (4 carbons from the C=O)",
   "kind": "made up",
   "heavy": 14,
   "groups": "OH 2 C=O 1",
   "motifs": "",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 425,
   "steps": 2.14,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC(O)CCCCC(=O)CCCC=O",
   "name": "ketone with a secondary alcohol arm (5 carbons from the C=O) and an aldehyde arm (4 carbons from the C=O)",
   "kind": "made up",
   "heavy": 14,
   "groups": "OH 1 C=O 2",
   "motifs": "",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 450,
   "steps": 2.19,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC1(C)C2CCC1(CCCO)C(=O)C2",
   "name": "camphor with a hydroxypropyl arm",
   "kind": "made up",
   "heavy": 14,
   "groups": "OH 1 C=O 1",
   "motifs": "cage",
   "why": "a cage; in play it sets off ring, dry",
   "pay": 369,
   "steps": 1.81,
   "frame": "cage",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=CC(C=C1CCNC1)C(=O)CC(C)=O",
   "name": "ring with an N (pyrrolidine) with 2 C=O, 2 C=C",
   "kind": "made up",
   "heavy": 15,
   "groups": "C=O 2 C=C 2",
   "motifs": "ring amine",
   "why": "a carbon or hetero ring; in play it sets off dry, ring",
   "pay": 662,
   "steps": 2.94,
   "frame": "ring",
   "origin": "generator extra"
  },
  {
   "smiles": "C=CCCC1CC(C(O)CC(C)N)C1=O",
   "name": "carbon ring (cyclobutane) with OH, C=O, C=C, NH2",
   "kind": "made up",
   "heavy": 15,
   "groups": "OH 1 C=O 1 C=C 1 NH2 1",
   "motifs": "ring amine",
   "why": "a carbon or hetero ring; in play it sets off ring, dry; NH2 and C=O 3 to 4 apart: knit",
   "pay": 418,
   "steps": 2.03,
   "frame": "ring",
   "origin": "generator extra"
  },
  {
   "smiles": "CC(C)(CO)C(O)C(=O)NCCC(=O)O",
   "name": "pantothenic acid",
   "kind": "real compound",
   "heavy": 15,
   "groups": "OH 2 COOH 1 amide 1",
   "motifs": "acid",
   "why": "an open chain; in play it sets off dry, ring",
   "pay": 369,
   "steps": 1.64,
   "frame": "chain",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC(O)CCCC(=O)CCCC(C)(C)O",
   "name": "ketone with a tertiary alcohol arm (4 carbons from the C=O) and a secondary alcohol arm (4 carbons from the C=O)",
   "kind": "made up",
   "heavy": 15,
   "groups": "OH 2 C=O 1",
   "motifs": "",
   "why": "an open chain; in play it sets off ring",
   "pay": 370,
   "steps": 1.97,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC1=CCCC(C)=CCC(C)(C)C=CC1",
   "name": "humulene",
   "kind": "real compound",
   "heavy": 15,
   "groups": "C=C 3",
   "motifs": "ring",
   "why": "a carbon or hetero ring; in play it sets off ring, dry",
   "pay": 282,
   "steps": 1.42,
   "frame": "ring",
   "origin": "real-compounds set"
  },
  {
   "smiles": "O=C(O)CCCC(O)C1CCC=CC1=O",
   "name": "carbon ring (cyclohexane) with OH, C=O, C=C, COOH",
   "kind": "made up",
   "heavy": 15,
   "groups": "OH 1 C=O 1 C=C 1 COOH 1",
   "motifs": "ring acid resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, ring; COOH and an OH 3 to 4 apart: seal",
   "pay": 441,
   "steps": 2.11,
   "frame": "ring",
   "origin": "generator pool"
  },
  {
   "smiles": "O=CC=CC(O)CCCCCCCCO",
   "name": "like 4-hydroxy-2-nonenal, with a 3-carbon alcohol arm on a methyl end",
   "kind": "near-relative",
   "heavy": 15,
   "groups": "OH 2 C=O 1 C=C 1",
   "motifs": "resonance",
   "why": "an open chain; in play it sets off ring, dry",
   "pay": 469,
   "steps": 2.17,
   "frame": "chain",
   "origin": "real-compounds set"
  },
  {
   "smiles": "O=CCCCC(=O)CCC1(O)CCCC1",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 15,
   "groups": "OH 1 C=O 2",
   "motifs": "ring",
   "why": "a carbon or hetero ring; in play it sets off ring",
   "pay": 375,
   "steps": 2.0,
   "frame": "ring",
   "origin": "game table"
  },
  {
   "smiles": "C=CC(=O)c1cc(CO)c2c(c1)CC=CC2",
   "name": "fused rings (tetralin) with OH, C=O, 2 C=C",
   "kind": "made up",
   "heavy": 16,
   "groups": "OH 1 C=O 1 C=C 2",
   "motifs": "arene ring fusion resonance",
   "why": "fused rings; in play it sets off ring, dry; OH and C=O 3 to 4 apart: ring",
   "pay": 392,
   "steps": 1.97,
   "frame": "fused",
   "origin": "generator extra"
  },
  {
   "smiles": "C=CCCC(=O)CCC(=O)c1ccccc1",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 16,
   "groups": "C=O 2 C=C 1",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off ring, dry",
   "pay": 400,
   "steps": 2.06,
   "frame": "benzene",
   "origin": "game table"
  },
  {
   "smiles": "C=Cc1cc(C(=O)O)cc(C(O)CC=O)c1",
   "name": "benzene ring (benzene) with OH, C=O, C=C, COOH",
   "kind": "made up",
   "heavy": 16,
   "groups": "OH 1 C=O 1 C=C 1 COOH 1",
   "motifs": "arene acid resonance",
   "why": "a benzene ring; in play it sets off dry, ring; COOH and an OH 3 to 4 apart: seal",
   "pay": 401,
   "steps": 1.97,
   "frame": "benzene",
   "origin": "generator pool"
  },
  {
   "smiles": "C=Cc1ccc(CCO)c2c1C(O)CC2=O",
   "name": "fused rings (indane) with 2 OH, C=O, C=C",
   "kind": "made up",
   "heavy": 16,
   "groups": "OH 2 C=O 1 C=C 1",
   "motifs": "arene ring fusion resonance",
   "why": "fused rings; in play it sets off dry, ring; C=O with an OH at 2 (dry) and an OH at 3 or 4 (ring)",
   "pay": 350,
   "steps": 1.64,
   "frame": "fused",
   "origin": "generator pool"
  }
 ],
 "4": [
  {
   "smiles": "C=C1CC(O)(CC=O)C(O)C12CCCC2",
   "name": "spiro rings (spiro44) with 2 OH, C=O, C=C",
   "kind": "made up",
   "heavy": 15,
   "groups": "OH 2 C=O 1 C=C 1",
   "motifs": "ring spiro",
   "why": "a spiro ring pair; in play it sets off ring, dry, weld; ketone with OH at 2 and 3: dry gives an enol, flip turns it to C=O",
   "pay": 712,
   "steps": 2.61,
   "frame": "spiro",
   "origin": "generator extra"
  },
  {
   "smiles": "C=CC(=C)CCC=C(C)CCC=C(C)C",
   "name": "beta-farnesene",
   "kind": "real compound",
   "heavy": 15,
   "groups": "C=C 4",
   "motifs": "resonance",
   "why": "an open chain; in play it sets off dry, weld, ring, shift",
   "pay": 640,
   "steps": 2.14,
   "frame": "chain",
   "origin": "real-compounds set"
  },
  {
   "smiles": "C=CC(O)(CCC=C(C)C)CCCCN",
   "name": "like linalool, with a 3-carbon amine arm on a methyl end",
   "kind": "near-relative",
   "heavy": 15,
   "groups": "OH 1 C=C 2 NH2 1",
   "motifs": "amine",
   "why": "an open chain; in play it sets off dry, weld, ring, shift",
   "pay": 689,
   "steps": 2.44,
   "frame": "chain",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC(=O)CCCC1=CCC2C(C1)C2(C)C",
   "name": "like 3-carene, with a methyl ketone arm on a methyl end",
   "kind": "near-relative",
   "heavy": 15,
   "groups": "C=O 1 C=C 1",
   "motifs": "ring fusion",
   "why": "fused rings; in play it sets off dry, ring, weld, snap",
   "pay": 484,
   "steps": 2.0,
   "frame": "fused",
   "origin": "real-compounds set"
  },
  {
   "smiles": "O=CC=C(C=O)CCCCC=CC1CO1",
   "name": "epoxide with 2 C=O, 2 C=C, epoxide, ether",
   "kind": "made up",
   "heavy": 15,
   "groups": "C=O 2 C=C 2 ether 1",
   "motifs": "ring resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, ring, weld, flip; a C=C right beside a C=O: dihydroxylation, then dry, then flip",
   "pay": 585,
   "steps": 2.22,
   "frame": "ring",
   "origin": "generator extra"
  },
  {
   "smiles": "C=C(C)C1CCC2=CC(=O)CC(C)C2(C)C1",
   "name": "nootkatone",
   "kind": "real compound",
   "heavy": 16,
   "groups": "C=O 1 C=C 2",
   "motifs": "ring fusion resonance",
   "why": "fused rings; in play it sets off dry, shift, weld, snap",
   "pay": 438,
   "steps": 1.83,
   "frame": "fused",
   "origin": "generator extra"
  },
  {
   "smiles": "CC(=O)CCCCCCCC(O)C=CC=O",
   "name": "like 4-hydroxy-2-nonenal, with a methyl ketone arm on a methyl end",
   "kind": "near-relative",
   "heavy": 16,
   "groups": "OH 1 C=O 2 C=C 1",
   "motifs": "resonance",
   "why": "an open chain; in play it sets off dry, ring, weld, tuck",
   "pay": 589,
   "steps": 2.19,
   "frame": "chain",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC=CC(O)C1C(=O)C(Cl)c2ccccc21",
   "name": "fused rings (indane) with OH, C=O, C=C, Cl",
   "kind": "made up",
   "heavy": 16,
   "groups": "OH 1 C=O 1 C=C 1 Cl 1",
   "motifs": "arene ring fusion resonance",
   "why": "fused rings; in play it sets off dry, ring, weld, shift; C=C 3 to 4 from a C=O: Ritter puts the NH2, knit closes it; Cl and OH 3 to 5 apart: close",
   "pay": 577,
   "steps": 2.36,
   "frame": "fused",
   "origin": "generator pool"
  },
  {
   "smiles": "O=C(O)CCCC(O)CC(=O)C1=CCCC1",
   "name": "carbon ring (cyclopentane) with OH, C=O, C=C, COOH",
   "kind": "made up",
   "heavy": 16,
   "groups": "OH 1 C=O 1 C=C 1 COOH 1",
   "motifs": "ring acid resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, shift, weld, tuck; COOH and an OH 3 to 4 apart: seal; a C=C two carbons from a C=O: shift, then more",
   "pay": 624,
   "steps": 2.19,
   "frame": "ring",
   "origin": "generator pool"
  },
  {
   "smiles": "O=CCCCC(=O)CCc1ccccc1O",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 16,
   "groups": "OH 1 C=O 2",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off dry, ring, weld",
   "pay": 606,
   "steps": 2.28,
   "frame": "benzene",
   "origin": "game table"
  },
  {
   "smiles": "CC1=CCCC(C)(C)C1C=CC(=O)CCCO",
   "name": "like alpha-ionone, with a 2-carbon alcohol arm on a methyl end",
   "kind": "near-relative",
   "heavy": 17,
   "groups": "OH 1 C=O 1 C=C 2",
   "motifs": "ring resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, ring, weld, shift",
   "pay": 625,
   "steps": 2.5,
   "frame": "ring",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC=CCC(CCCSC)C(S)C=CCC=O",
   "name": "open chain with C=O, 2 C=C, SH, S bridge",
   "kind": "made up",
   "heavy": 17,
   "groups": "C=O 1 C=C 2 SH 1",
   "motifs": "sulfur",
   "why": "an open chain; in play it sets off dry, weld, ring, shift; SH and C=O 3 to 4 apart: cap; inner C=C: epoxidize, then fold to a C=O",
   "pay": 569,
   "steps": 2.22,
   "frame": "chain",
   "origin": "generator pool"
  },
  {
   "smiles": "CCC(N)C=CC(=O)CC(O)c1ccccc1",
   "name": "a chain with a ketone, an OH 2 carbons from it, a C=C, an NH2, a benzene ring",
   "kind": "made up",
   "heavy": 17,
   "groups": "OH 1 C=O 1 C=C 1 NH2 1",
   "motifs": "arene amine resonance",
   "why": "a benzene ring; in play it sets off dry, ring, weld, tuck",
   "pay": 611,
   "steps": 2.22,
   "frame": "benzene",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CCC1=C2C(CC=O)=C3CC1C(=O)C(C3)C2N",
   "name": "cage (adamantane) with 2 C=O, 2 C=C, NH2",
   "kind": "made up",
   "heavy": 17,
   "groups": "C=O 2 C=C 2 NH2 1",
   "motifs": "cage amine resonance",
   "why": "a cage; in play it sets off dry, shift, ring, weld; two C=C in a row: a run of alternating double bonds",
   "pay": 943,
   "steps": 2.78,
   "frame": "cage",
   "origin": "generator extra"
  },
  {
   "smiles": "C=C(C)C1(O)CCC2=CC(=O)CC(CN)C2(C)C1",
   "name": "near-relative of nootkatone",
   "kind": "near-relative",
   "heavy": 18,
   "groups": "OH 1 C=O 1 C=C 2 NH2 1",
   "motifs": "ring fusion amine resonance",
   "why": "fused rings; in play it sets off dry, ring, weld, shift; NH2 on a saturated carbon: Hofmann takes it off as a C=C",
   "pay": 499,
   "steps": 1.97,
   "frame": "fused",
   "origin": "generator pool"
  },
  {
   "smiles": "C=CCC(=O)CSC1CCC(=O)C12CCC(N)C2",
   "name": "spiro rings (spiro44) with 2 C=O, C=C, NH2, S bridge",
   "kind": "made up",
   "heavy": 18,
   "groups": "C=O 2 C=C 1 NH2 1",
   "motifs": "ring spiro amine sulfur",
   "why": "a spiro ring pair; in play it sets off dry, ring, weld, shift; NH2 and C=O 3 to 4 apart: knit; chain-end C=C 3 to 4 from a C=O: thiol-ene puts the SH, cap closes it",
   "pay": 712,
   "steps": 2.69,
   "frame": "spiro",
   "origin": "generator pool"
  },
  {
   "smiles": "CC(=O)CCC(=O)CCC(O)C1CC2CCC1C2",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 18,
   "groups": "OH 1 C=O 2",
   "motifs": "cage",
   "why": "a cage; in play it sets off dry, ring, weld, shift",
   "pay": 780,
   "steps": 2.67,
   "frame": "cage",
   "origin": "game table"
  },
  {
   "smiles": "CCNCC(C=O)C=C1C=CC2(CCC(=O)C2)C1",
   "name": "spiro rings (spiro44) with 2 C=O, 2 C=C",
   "kind": "made up",
   "heavy": 18,
   "groups": "C=O 2 C=C 2",
   "motifs": "ring spiro amine resonance",
   "why": "a spiro ring pair; in play it sets off dry, ring, snap, weld; C=C 3 to 4 from a C=O: Ritter puts the NH2, knit closes it; a C=C two carbons from a C=O: shift, then more",
   "pay": 438,
   "steps": 1.69,
   "frame": "spiro",
   "origin": "generator pool"
  },
  {
   "smiles": "O=CCC(O)CCCC1CCCC12C=CC(=O)C2",
   "name": "spiro rings (spiro44) with OH, 2 C=O, C=C",
   "kind": "made up",
   "heavy": 18,
   "groups": "OH 1 C=O 2 C=C 1",
   "motifs": "ring spiro resonance",
   "why": "a spiro ring pair; in play it sets off dry, weld, ring, shift; aldehyde with an OH near: cyanohydrin makes COOH, seal closes it; a C=C two carbons from a C=O: shift, then more",
   "pay": 718,
   "steps": 2.5,
   "frame": "spiro",
   "origin": "generator pool"
  },
  {
   "smiles": "C=CCC(O)CCC1CC2CC(CCC(C)=O)C1C2",
   "name": "norbornane cage with an allyl alcohol arm and a methyl ketone arm",
   "kind": "made up",
   "heavy": 19,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "cage",
   "why": "a cage; in play it sets off dry, ring, weld, shift",
   "pay": 526,
   "steps": 2.11,
   "frame": "cage",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC(=O)C=CC1C2CCC(CC2O)C1CCCCN",
   "name": "bicyclo[2.2.2]octane cage carrying an OH, a 4-carbon amine arm, an enone arm",
   "kind": "made up",
   "heavy": 19,
   "groups": "OH 1 C=O 1 C=C 1 NH2 1",
   "motifs": "cage amine resonance",
   "why": "a cage; in play it sets off dry, ring, weld, snap",
   "pay": 748,
   "steps": 2.69,
   "frame": "cage",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC(C=CC1(O)C(C)=CC(=O)CC1(C)C)=CC(=O)O",
   "name": "abscisic acid",
   "kind": "real compound",
   "heavy": 19,
   "groups": "OH 1 C=O 1 C=C 3 COOH 1",
   "motifs": "ring acid resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, ring, weld, shift",
   "pay": 693,
   "steps": 2.25,
   "frame": "ring",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC(O)CC(=O)CCc1ccc(CCCCN)cc1",
   "name": "benzene ring with a ketone arm with an alcohol next door and an amine arm",
   "kind": "made up",
   "heavy": 19,
   "groups": "OH 1 C=O 1 NH2 1",
   "motifs": "arene amine resonance",
   "why": "a benzene ring; in play it sets off dry, weld, ring",
   "pay": 493,
   "steps": 1.97,
   "frame": "benzene",
   "origin": "puzzle set"
  },
  {
   "smiles": "OCC1OC(Oc2ccc(O)cc2)C(S)C(O)C1O",
   "name": "like arbutin, with its OH swapped for SH",
   "kind": "near-relative",
   "heavy": 19,
   "groups": "OH 4 SH 1 ether 2",
   "motifs": "arene ring resonance",
   "why": "a benzene ring; in play it sets off dry, weld, ring, shift",
   "pay": 501,
   "steps": 1.86,
   "frame": "benzene",
   "origin": "real-compounds set"
  }
 ],
 "5": [
  {
   "smiles": "C=C(C)C1(O)CCC2=CC(=O)CC(CO)C2(C)C1",
   "name": "near-relative of nootkatone",
   "kind": "near-relative",
   "heavy": 18,
   "groups": "OH 2 C=O 1 C=C 2",
   "motifs": "ring fusion resonance",
   "why": "fused rings; in play it sets off dry, shift, snap, weld; secondary OH and tertiary OH: oxidize makes the C=O the other OH closes onto",
   "pay": 555,
   "steps": 2.17,
   "frame": "fused",
   "origin": "generator pool"
  },
  {
   "smiles": "C=C(C)C1CCC2=CC(=O)C(N)C(C)C2(C)C1=O",
   "name": "near-relative of nootkatone",
   "kind": "near-relative",
   "heavy": 18,
   "groups": "C=O 2 C=C 2 NH2 1",
   "motifs": "ring fusion amine resonance",
   "why": "fused rings; in play it sets off dry, ring, snap, weld; NH2 and C=O 3 to 4 apart: knit",
   "pay": 725,
   "steps": 2.56,
   "frame": "fused",
   "origin": "generator extra"
  },
  {
   "smiles": "C=CC1C(=O)C1c1c(O)cc(C=O)cc1CCC",
   "name": "benzene ring (benzene) with OH, 2 C=O, C=C",
   "kind": "made up",
   "heavy": 18,
   "groups": "OH 1 C=O 2 C=C 1",
   "motifs": "arene ring resonance",
   "why": "a benzene ring; in play it sets off dry, weld, shift, ring; chain-end C=C 3 to 4 from a C=O: thiol-ene puts the SH, cap closes it; aldehyde and OH: permanganate makes the COOH, seal closes it",
   "pay": 464,
   "steps": 2.06,
   "frame": "benzene",
   "origin": "generator extra"
  },
  {
   "smiles": "C=CCCC(=O)CCC(C)(O)C1CC2CCC1C2",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 18,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "cage",
   "why": "a cage; in play it sets off dry, ring, weld, tuck",
   "pay": 603,
   "steps": 2.19,
   "frame": "cage",
   "origin": "game table"
  },
  {
   "smiles": "CC(O)CCC1(O)C=CC2(CC(=O)CC(O)C2)C1",
   "name": "spiro rings (spiro45) with 3 OH, C=O, C=C",
   "kind": "made up",
   "heavy": 18,
   "groups": "OH 3 C=O 1 C=C 1",
   "motifs": "ring spiro",
   "why": "a spiro ring pair; in play it sets off dry, ring, weld, snap; C=C 3 to 4 from a C=O: Ritter puts the NH2, knit closes it; secondary OH and tertiary OH: oxidize makes the C=O the other OH closes onto",
   "pay": 602,
   "steps": 2.36,
   "frame": "spiro",
   "origin": "generator pool"
  },
  {
   "smiles": "CC=C1CC2C(=O)CC(O)CC2C(C(C)=O)C1=O",
   "name": "fused rings (decalin) with OH, 3 C=O, C=C",
   "kind": "made up",
   "heavy": 18,
   "groups": "OH 1 C=O 3 C=C 1",
   "motifs": "ring fusion resonance",
   "why": "fused rings; in play it sets off dry, ring, weld, shift; C=C 3 to 4 from a C=O: Ritter puts the NH2, knit closes it; OH and C=O 3 to 4 apart: ring",
   "pay": 909,
   "steps": 3.0,
   "frame": "fused",
   "origin": "generator extra"
  },
  {
   "smiles": "C=CC1CC(=O)CC12CC=CC=C2CC(CO)SC",
   "name": "spiro rings (spiro45) with OH, C=O, 3 C=C, S bridge",
   "kind": "made up",
   "heavy": 19,
   "groups": "OH 1 C=O 1 C=C 3",
   "motifs": "ring spiro sulfur resonance",
   "why": "a spiro ring pair; in play it sets off dry, weld, ring, shift; chain-end C=C 3 to 4 from a C=O: thiol-ene puts the SH, cap closes it; two C=C in a row: a run of alternating double bonds",
   "pay": 681,
   "steps": 2.53,
   "frame": "spiro",
   "origin": "generator extra"
  },
  {
   "smiles": "CC(=O)C=CC1C(C)=CCCC1(C)CCCCCO",
   "name": "like alpha-ionone, with a 4-carbon alcohol arm on a methyl end",
   "kind": "near-relative",
   "heavy": 19,
   "groups": "OH 1 C=O 1 C=C 2",
   "motifs": "ring resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, ring, weld",
   "pay": 607,
   "steps": 2.36,
   "frame": "ring",
   "origin": "real-compounds set"
  },
  {
   "smiles": "C=CC(=O)CC(O)C(N)CCCCCC1CCCSC1",
   "name": "a chain with a ketone, an OH 2 carbons from it, a C=C, an NH2, a thiane ring",
   "kind": "made up",
   "heavy": 20,
   "groups": "OH 1 C=O 1 C=C 1 NH2 1",
   "motifs": "ring amine sulfur resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, ring, weld, tuck",
   "pay": 683,
   "steps": 2.58,
   "frame": "ring",
   "origin": "real-compounds set"
  },
  {
   "smiles": "C=CCC(O)CCCC(=O)CCCC(=O)CCCCN",
   "name": "amino diketone with an allyl alcohol",
   "kind": "made up",
   "heavy": 20,
   "groups": "OH 1 C=O 2 C=C 1 NH2 1",
   "motifs": "amine",
   "why": "an open chain; in play it sets off dry, weld, ring, tuck",
   "pay": 680,
   "steps": 2.42,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC(=O)CCC(=O)CCCCCC(=O)CCC(C)(C)O",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 20,
   "groups": "OH 1 C=O 3",
   "motifs": "",
   "why": "an open chain; in play it sets off dry, shift, weld, ring",
   "pay": 685,
   "steps": 2.47,
   "frame": "chain",
   "origin": "game table"
  },
  {
   "smiles": "CCC=CCC=CCC=CCCCCCCCC(=O)O",
   "name": "linolenic acid",
   "kind": "real compound",
   "heavy": 20,
   "groups": "C=C 3 COOH 1",
   "motifs": "acid",
   "why": "an open chain; in play it sets off dry, weld, ring",
   "pay": 492,
   "steps": 1.94,
   "frame": "chain",
   "origin": "real-compounds set"
  },
  {
   "smiles": "NC12CC=C(CC1)C2CCC(O)CC(=O)CCCC=O",
   "name": "cage (pinane) with OH, 2 C=O, C=C, NH2",
   "kind": "made up",
   "heavy": 20,
   "groups": "OH 1 C=O 2 C=C 1 NH2 1",
   "motifs": "cage amine",
   "why": "a cage; in play it sets off dry, weld, ring, tuck; NH2 on a saturated carbon: Hofmann takes it off as a C=C; an aldehyde and a ketone: reduce makes the OH that closes onto the ketone",
   "pay": 714,
   "steps": 2.53,
   "frame": "cage",
   "origin": "generator pool"
  },
  {
   "smiles": "O=CCC(O)CCCC(=O)C12CC(O)C(CCC1O)N2",
   "name": "cage with an N (tropane) with 3 OH, 2 C=O",
   "kind": "made up",
   "heavy": 20,
   "groups": "OH 3 C=O 2",
   "motifs": "cage amine",
   "why": "a cage; in play it sets off dry, weld, ring, snap; ketone with OH at 2 and 3: dry gives an enol, flip turns it to C=O",
   "pay": 605,
   "steps": 2.03,
   "frame": "cage",
   "origin": "generator pool"
  },
  {
   "smiles": "C=CC(CCC)C(=O)C(CC=O)CC(N)C(C)CCSC",
   "name": "open chain with 2 C=O, C=C, NH2, S bridge",
   "kind": "made up",
   "heavy": 21,
   "groups": "C=O 2 C=C 1 NH2 1",
   "motifs": "amine sulfur",
   "why": "an open chain; in play it sets off dry, shift, weld, ring; NH2 and C=O 3 to 4 apart: knit; chain-end C=C 3 to 4 from a C=O: thiol-ene puts the SH, cap closes it",
   "pay": 591,
   "steps": 2.25,
   "frame": "chain",
   "origin": "generator pool"
  },
  {
   "smiles": "C=CC(O)CCC1CCC2(CCC(CCC=O)C2)CC1N",
   "name": "spiro[4.5]decane carrying an aldehyde arm, an allylic alcohol arm, an NH2",
   "kind": "made up",
   "heavy": 21,
   "groups": "OH 1 C=O 1 C=C 1 NH2 1",
   "motifs": "ring spiro amine",
   "why": "a spiro ring pair; in play it sets off dry, weld, ring",
   "pay": 450,
   "steps": 1.72,
   "frame": "spiro",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC(C=CC=C(C)C=CC1=C(C)CCCC1(C)C)=CC=O",
   "name": "retinal",
   "kind": "real compound",
   "heavy": 21,
   "groups": "C=O 1 C=C 5",
   "motifs": "ring resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, ring, weld, snap",
   "pay": 958,
   "steps": 3.22,
   "frame": "ring",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC12CC3CC(C)(C1)C(CCC(=O)CCC=O)C(N)(C3)C2",
   "name": "memantine-like cage with a keto-aldehyde chain",
   "kind": "made up",
   "heavy": 21,
   "groups": "C=O 2 NH2 1",
   "motifs": "cage amine",
   "why": "a cage; in play it sets off dry, weld, ring, shift",
   "pay": 811,
   "steps": 2.78,
   "frame": "cage",
   "origin": "puzzle set"
  },
  {
   "smiles": "COc1ccc2c3c1OC1CC(=O)C=CC31CCN(C)C2",
   "name": "like galantamine, with its OH turned into a C=O",
   "kind": "near-relative",
   "heavy": 21,
   "groups": "C=O 1 C=C 1 ether 2",
   "motifs": "arene ring fusion spiro amine resonance",
   "why": "a spiro ring pair; in play it sets off dry, weld, ring, shift",
   "pay": 455,
   "steps": 1.78,
   "frame": "spiro",
   "origin": "real-compounds set"
  },
  {
   "smiles": "O=C(O)CCCC1CCCCC1CC(=O)C=CCCCO",
   "name": "cyclohexane with an acid arm and an enone arm with an alcohol at its far end",
   "kind": "made up",
   "heavy": 21,
   "groups": "OH 1 C=O 1 C=C 1 COOH 1",
   "motifs": "ring acid resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, ring, weld, shift",
   "pay": 519,
   "steps": 2.17,
   "frame": "ring",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=CC(C)(O)CCC1C(C)(O)CCC2C(C)(C)CCCC21C",
   "name": "sclareol",
   "kind": "real compound",
   "heavy": 22,
   "groups": "OH 2 C=C 1",
   "motifs": "ring fusion",
   "why": "fused rings; in play it sets off dry, weld, ring, tuck",
   "pay": 444,
   "steps": 1.78,
   "frame": "fused",
   "origin": "real-compounds set"
  },
  {
   "smiles": "C=CC(O)CCc1cc(CCCCl)cc(CC(O)CC=O)c1",
   "name": "benzene ring carrying a hydroxy-aldehyde arm, a 3-carbon chloride arm, an allylic alcohol arm",
   "kind": "made up",
   "heavy": 22,
   "groups": "OH 2 C=O 1 C=C 1 Cl 1",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off dry, shift, weld, ring",
   "pay": 634,
   "steps": 2.58,
   "frame": "benzene",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC(C)(O)CCC(=O)CCc1ccc(CCCCC=O)cc1",
   "name": "benzene ring with a ketone arm ending in a tertiary alcohol and an aldehyde arm",
   "kind": "made up",
   "heavy": 22,
   "groups": "OH 1 C=O 2",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off dry, ring, shift, weld",
   "pay": 459,
   "steps": 1.94,
   "frame": "benzene",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC(C)=CCC(=O)CCc1ccccc1CCCCCC=O",
   "name": "benzene ring with an isoprenyl ketone arm and a long aldehyde arm",
   "kind": "made up",
   "heavy": 22,
   "groups": "C=O 2 C=C 1",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off dry, shift, weld, ring",
   "pay": 599,
   "steps": 2.31,
   "frame": "benzene",
   "origin": "puzzle set"
  }
 ],
 "6": [
  {
   "smiles": "CC12CCC(=O)C=C1CCC1C2CCC2(C)C(O)CCC12",
   "name": "testosterone",
   "kind": "real compound",
   "heavy": 21,
   "groups": "OH 1 C=O 1 C=C 1",
   "motifs": "ring fusion resonance",
   "why": "fused rings; in play it sets off dry, ring, weld, shift",
   "pay": 420,
   "steps": 1.86,
   "frame": "fused",
   "origin": "real-compounds set"
  },
  {
   "smiles": "NCCCC1C=CC(CC(O)CC=O)CC1CCCCO",
   "name": "cyclohexene ring carrying a hydroxy-aldehyde arm, a 3-carbon amine arm, a 4-carbon alcohol arm",
   "kind": "made up",
   "heavy": 21,
   "groups": "OH 2 C=O 1 C=C 1 NH2 1",
   "motifs": "ring amine",
   "why": "a carbon or hetero ring; in play it sets off dry, shift, weld, tuck",
   "pay": 544,
   "steps": 1.92,
   "frame": "ring",
   "origin": "real-compounds set"
  },
  {
   "smiles": "C=CC(CC(N)(C=C(CCC)CSC)CCC(C)=O)C(C)=O",
   "name": "open chain with 2 C=O, 2 C=C, NH2, S bridge",
   "kind": "made up",
   "heavy": 22,
   "groups": "C=O 2 C=C 2 NH2 1",
   "motifs": "amine sulfur",
   "why": "an open chain; in play it sets off dry, weld, shift, snap; NH2 and C=O 3 to 4 apart: knit; chain-end C=C 3 to 4 from a C=O: thiol-ene puts the SH, cap closes it",
   "pay": 614,
   "steps": 2.14,
   "frame": "chain",
   "origin": "generator pool"
  },
  {
   "smiles": "CCC=CCC(N)(CC1C2CCC(C2)C1O)C(O)CCC=O",
   "name": "cage (pinane) with 2 OH, C=O, C=C, NH2",
   "kind": "made up",
   "heavy": 22,
   "groups": "OH 2 C=O 1 C=C 1 NH2 1",
   "motifs": "cage amine",
   "why": "a cage; in play it sets off dry, shift, weld, ring; OH and NH2 3 to 4 apart: oxidize makes the C=O, knit closes it; aldehyde with an OH near: cyanohydrin makes COOH, seal closes it",
   "pay": 653,
   "steps": 2.42,
   "frame": "cage",
   "origin": "generator extra"
  },
  {
   "smiles": "CCSCC=CCC(=O)C1C=CCC(S)C12CC(O)CC2=O",
   "name": "spiro rings (spiro45) with OH, 2 C=O, 2 C=C, SH, S bridge",
   "kind": "made up",
   "heavy": 22,
   "groups": "OH 1 C=O 2 C=C 2 SH 1",
   "motifs": "ring spiro sulfur",
   "why": "a spiro ring pair; in play it sets off dry, shift, tuck, snap; OH and SH 3 to 4 apart: oxidize makes the C=O, cap closes it; a C=C two carbons from a C=O: shift, then more",
   "pay": 747,
   "steps": 2.36,
   "frame": "spiro",
   "origin": "generator extra"
  },
  {
   "smiles": "O=C(O)C=CCC(O)(C1=CC(=O)CSC1)c1cccc(O)c1",
   "name": "benzene ring (benzene) with 2 OH, C=O, 2 C=C, COOH, S bridge",
   "kind": "made up",
   "heavy": 22,
   "groups": "OH 2 C=O 1 C=C 2 COOH 1",
   "motifs": "arene ring acid sulfur resonance",
   "why": "a benzene ring; in play it sets off dry, ring, tuck, weld; COOH and an OH 3 to 4 apart: seal; a C=C two carbons from a C=O: shift, then more",
   "pay": 528,
   "steps": 2.08,
   "frame": "benzene",
   "origin": "generator pool"
  },
  {
   "smiles": "C=C(C)C1=CC2=CCC3C(C)(C(=O)O)CCCC3(C)C2CC1=O",
   "name": "near-relative of abietic acid",
   "kind": "near-relative",
   "heavy": 23,
   "groups": "C=O 1 C=C 3 COOH 1",
   "motifs": "ring fusion acid resonance",
   "why": "fused rings; in play it sets off dry, ring, weld, shift; chain-end C=C 3 to 4 from a C=O: thiol-ene puts the SH, cap closes it",
   "pay": 770,
   "steps": 2.64,
   "frame": "fused",
   "origin": "generator pool"
  },
  {
   "smiles": "C=C(C)CCC(=O)C1=C2CC(=O)C(SC(CCCl)C(C)O)(C2)C1",
   "name": "cage (norbornane) with OH, 2 C=O, 2 C=C, Cl, S bridge",
   "kind": "made up",
   "heavy": 23,
   "groups": "OH 1 C=O 2 C=C 2 Cl 1",
   "motifs": "cage sulfur resonance",
   "why": "a cage; in play it sets off ring, dry, shift, weld; chain-end C=C 3 to 4 from a C=O: thiol-ene puts the SH, cap closes it; a C=C two carbons from a C=O: shift, then more",
   "pay": 700,
   "steps": 2.56,
   "frame": "cage",
   "origin": "generator pool"
  },
  {
   "smiles": "CC(=O)CCC(=O)C=CCCCC=CC=CC1(O)CCCCC1",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 23,
   "groups": "OH 1 C=O 2 C=C 3",
   "motifs": "ring resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, weld, ring, snap",
   "pay": 1044,
   "steps": 2.97,
   "frame": "ring",
   "origin": "game table"
  },
  {
   "smiles": "CC=C(CCO)CC1C(=O)C2(CCCC2)C(CCC(=O)O)C1O",
   "name": "spiro rings (spiro44) with 2 OH, C=O, C=C, COOH",
   "kind": "made up",
   "heavy": 23,
   "groups": "OH 2 C=O 1 C=C 1 COOH 1",
   "motifs": "ring spiro acid",
   "why": "a spiro ring pair; in play it sets off dry, ring, weld, shift; OH two carbons from a C=O: dry",
   "pay": 1045,
   "steps": 3.42,
   "frame": "spiro",
   "origin": "generator pool"
  },
  {
   "smiles": "CSCCCC=CC=CCCCC=CC(=O)CCCCC(C)=O",
   "name": "long chain carrying 2 ketones or aldehydes, 3 C=C bonds",
   "kind": "made up",
   "heavy": 23,
   "groups": "C=O 2 C=C 3",
   "motifs": "sulfur resonance",
   "why": "an open chain; in play it sets off dry, weld, ring, snap",
   "pay": 942,
   "steps": 2.72,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=C(C)CCCCC(=O)CCC(O)CC(=O)CCc1ccccc1",
   "name": "chain with 1 ring carrying 2 ketones or aldehydes, 1 alcohol, 1 C=C",
   "kind": "made up",
   "heavy": 24,
   "groups": "OH 1 C=O 2 C=C 1",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off dry, weld, ring, snap",
   "pay": 692,
   "steps": 2.47,
   "frame": "benzene",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=C(C)CCCCC(O)CCCC(=O)CCC(=O)CCCCCN",
   "name": "long chain carrying 2 ketones or aldehydes, 1 alcohol, 1 C=C, 1 amine",
   "kind": "made up",
   "heavy": 24,
   "groups": "OH 1 C=O 2 C=C 1 NH2 1",
   "motifs": "amine",
   "why": "an open chain; in play it sets off dry, ring, weld, tuck",
   "pay": 654,
   "steps": 2.44,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC(=O)CCC(=O)CCC(=O)C=CCCCC=CC=CC(C)(C)O",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 24,
   "groups": "OH 1 C=O 3 C=C 3",
   "motifs": "resonance",
   "why": "an open chain; in play it sets off dry, ring, weld, snap",
   "pay": 1136,
   "steps": 3.5,
   "frame": "chain",
   "origin": "game table"
  },
  {
   "smiles": "CC1C(C(=O)C(O)C2CNCC(C=O)O2)=CCC12CC(O)CC2O",
   "name": "spiro rings (spiro44) with 3 OH, 2 C=O, C=C, ether",
   "kind": "made up",
   "heavy": 24,
   "groups": "OH 3 C=O 2 C=C 1 ether 1",
   "motifs": "ring spiro amine resonance",
   "why": "a spiro ring pair; in play it sets off dry, weld, tuck, ring; enone with an OH three or four from its far end: tuck",
   "pay": 656,
   "steps": 2.22,
   "frame": "spiro",
   "origin": "generator pool"
  },
  {
   "smiles": "COc1cc(CNC(=O)CCCC(O)C=CC(C)C=O)ccc1O",
   "name": "near-relative of capsaicin",
   "kind": "near-relative",
   "heavy": 24,
   "groups": "OH 2 C=O 1 C=C 1 ether 1 amide 1",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off dry, weld, ring, shift; OH and C=O 3 to 4 apart: ring",
   "pay": 628,
   "steps": 2.22,
   "frame": "benzene",
   "origin": "generator pool"
  },
  {
   "smiles": "CSCCCC(=O)C1=C2CC(C(S)C(O)CCC(C)=O)C(N)(C2)C1",
   "name": "cage (norbornane) with OH, 2 C=O, C=C, NH2, SH, S bridge",
   "kind": "made up",
   "heavy": 24,
   "groups": "OH 1 C=O 2 C=C 1 NH2 1 SH 1",
   "motifs": "cage amine sulfur resonance",
   "why": "a cage; in play it sets off dry, shift, weld, snap; OH and NH2 3 to 4 apart: oxidize makes the C=O, knit closes it; SH and C=O 3 to 4 apart: cap; a C=C right beside a C=O: dihydroxylation, then dry, then flip",
   "pay": 812,
   "steps": 2.78,
   "frame": "cage",
   "origin": "generator pool"
  },
  {
   "smiles": "NC1(CCC23C4C5C6C4C2C6C53)C(=O)CC=CC1CC(=O)C(=O)O",
   "name": "cage (cubane) with 2 C=O, C=C, COOH, NH2",
   "kind": "made up",
   "heavy": 24,
   "groups": "C=O 2 C=C 1 COOH 1 NH2 1",
   "motifs": "ring cage acid amine resonance",
   "why": "a cage; in play it sets off dry, ring, weld, shift; COOH and NH2 3 to 4 apart: seal makes a lactam; two C=O four to six apart: weld closes a ring",
   "pay": 668,
   "steps": 2.42,
   "frame": "cage",
   "origin": "generator extra"
  },
  {
   "smiles": "NCCCC(=O)CCCC1CCCC(CC(=O)C=CCCCO)C1",
   "name": "cyclohexane with an enone arm with an alcohol at its far end and an amino ketone arm",
   "kind": "made up",
   "heavy": 24,
   "groups": "OH 1 C=O 2 C=C 1 NH2 1",
   "motifs": "ring amine resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, ring, weld, tuck",
   "pay": 560,
   "steps": 2.25,
   "frame": "ring",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=CCCCc1cc(CC(O)CC(C)=O)cc(CC(S)CCC=O)c1",
   "name": "benzene ring carrying a thiol-aldehyde arm, a pentenyl arm, a hydroxy-ketone arm",
   "kind": "made up",
   "heavy": 25,
   "groups": "OH 1 C=O 2 C=C 1 SH 1",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off dry, weld, ring, shift",
   "pay": 870,
   "steps": 3.0,
   "frame": "benzene",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC(=O)C=CC1CC(Cl)CC2(CCCC(CC(O)CCC=O)C2=O)C1",
   "name": "spiro rings (spiro55) with OH, 3 C=O, C=C, Cl",
   "kind": "made up",
   "heavy": 25,
   "groups": "OH 1 C=O 3 C=C 1 Cl 1",
   "motifs": "ring spiro resonance",
   "why": "a spiro ring pair; in play it sets off dry, ring, weld, shift; aldehyde with an OH near: cyanohydrin makes COOH, seal closes it; inner C=C: epoxidize, then fold to a C=O",
   "pay": 1076,
   "steps": 3.22,
   "frame": "spiro",
   "origin": "generator extra"
  },
  {
   "smiles": "CCCCCC(O)C=CC1C(=O)CC(O)C1CC=CCCCC(=O)O",
   "name": "prostaglandin E2",
   "kind": "real compound",
   "heavy": 25,
   "groups": "OH 2 C=O 1 C=C 2 COOH 1",
   "motifs": "ring acid",
   "why": "a carbon or hetero ring; in play it sets off dry, ring, shift, weld",
   "pay": 881,
   "steps": 2.83,
   "frame": "ring",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC12CCC(=O)C=C1CCC1C2C(Cl)CC2(C=O)C(C(=O)CO)CCC12",
   "name": "like aldosterone, with its OH swapped for Cl",
   "kind": "near-relative",
   "heavy": 26,
   "groups": "OH 1 C=O 3 C=C 1 Cl 1",
   "motifs": "ring fusion resonance",
   "why": "fused rings; in play it sets off dry, weld, ring, flip",
   "pay": 995,
   "steps": 3.33,
   "frame": "fused",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC12CCC(=O)C=C1CCC1C2C(O)CC2(C)C1CCC2(O)C(=O)CO",
   "name": "cortisol",
   "kind": "real compound",
   "heavy": 26,
   "groups": "OH 3 C=O 2 C=C 1",
   "motifs": "ring fusion resonance",
   "why": "fused rings; in play it sets off dry, ring, snap, weld",
   "pay": 829,
   "steps": 2.72,
   "frame": "fused",
   "origin": "puzzle set"
  }
 ],
 "7": [
  {
   "smiles": "COc1cc(CNC(=O)C(=O)CC(O)C(O)C=CC(C)C)ccc1O",
   "name": "near-relative of capsaicin",
   "kind": "near-relative",
   "heavy": 25,
   "groups": "OH 3 C=O 1 C=C 1 ether 1 amide 1",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off dry, ring, tuck, weld; C=O with an OH at 2 (dry) and an OH at 3 or 4 (ring)",
   "pay": 734,
   "steps": 2.5,
   "frame": "benzene",
   "origin": "generator pool"
  },
  {
   "smiles": "NC(CCC=CCCC(O)CCCC=O)CCC1(C=O)CCCCC1",
   "name": "a chain with an amine, a spiro-capable cyclohexane",
   "kind": "made up",
   "heavy": 25,
   "groups": "OH 1 C=O 2 C=C 1 NH2 1",
   "motifs": "ring amine",
   "why": "a carbon or hetero ring; in play it sets off knit, dry, weld, ring",
   "pay": 982,
   "steps": 3.25,
   "frame": "ring",
   "origin": "real-compounds set"
  },
  {
   "smiles": "C=C(CCC(=O)O)C(O)CC(=O)CCC1(O)CCC2(CCCC2N)CC1",
   "name": "spiro rings (spiro45) with 2 OH, C=O, C=C, COOH, NH2",
   "kind": "made up",
   "heavy": 26,
   "groups": "OH 2 C=O 1 C=C 1 COOH 1 NH2 1",
   "motifs": "ring spiro acid amine",
   "why": "a spiro ring pair; in play it sets off dry, ring, seal, weld; OH and NH2 3 to 4 apart: oxidize makes the C=O, knit closes it; COOH and an OH 3 to 4 apart: seal; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach",
   "pay": 919,
   "steps": 3.17,
   "frame": "spiro",
   "origin": "generator extra"
  },
  {
   "smiles": "C=CCCCCNCC(Cl)C(O)C(O)C1C(=O)C(N)Cc2ccccc21",
   "name": "fused rings (tetralin) with 2 OH, C=O, C=C, NH2, Cl",
   "kind": "made up",
   "heavy": 26,
   "groups": "OH 2 C=O 1 C=C 1 NH2 1 Cl 1",
   "motifs": "arene ring fusion amine resonance",
   "why": "fused rings; in play it sets off dry, ring, knit, close; Cl and NH2 3 to 5 apart: close makes a ring amine; ketone with OH at 2 and 3: dry gives an enol, flip turns it to C=O",
   "pay": 942,
   "steps": 3.06,
   "frame": "fused",
   "origin": "generator pool"
  },
  {
   "smiles": "CC(=O)C=C(CCCC(=O)O)C(S)CC(O)(CCCC(C)O)CC(C)C",
   "name": "open chain with 2 OH, C=O, C=C, COOH, SH",
   "kind": "made up",
   "heavy": 26,
   "groups": "OH 2 C=O 1 C=C 1 COOH 1 SH 1",
   "motifs": "acid resonance",
   "why": "an open chain; in play it sets off cap, dry, ring, weld; SH and C=O 3 to 4 apart: cap; inner C=C: epoxidize, then fold to a C=O",
   "pay": 822,
   "steps": 2.86,
   "frame": "chain",
   "origin": "generator extra"
  },
  {
   "smiles": "CC(=O)CCCN1CCC23c4c5ccc(O)c4OC2C(O)C=CC3C1C5",
   "name": "like morphine, with a methyl ketone arm on a methyl end",
   "kind": "near-relative",
   "heavy": 26,
   "groups": "OH 2 C=O 1 C=C 1 ether 1",
   "motifs": "arene cage spiro amine resonance",
   "why": "a cage; in play it sets off dry, ring, weld, cap",
   "pay": 810,
   "steps": 2.75,
   "frame": "cage",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC12CCC(=O)C=C1CCC1C2C(O)CC2(C=O)C(C(=O)CO)CCC12",
   "name": "aldosterone",
   "kind": "real compound",
   "heavy": 26,
   "groups": "OH 2 C=O 3 C=C 1",
   "motifs": "ring fusion resonance",
   "why": "fused rings; in play it sets off dry, weld, ring, flip",
   "pay": 1168,
   "steps": 3.25,
   "frame": "fused",
   "origin": "real-compounds set"
  },
  {
   "smiles": "O=CCCCC(=O)CCC1CC2CC(CCCC(O)CCCCCl)C1C2",
   "name": "norbornane cage with a keto-aldehyde arm and a chloro alcohol arm",
   "kind": "made up",
   "heavy": 26,
   "groups": "OH 1 C=O 2 Cl 1",
   "motifs": "cage",
   "why": "a cage; in play it sets off dry, weld, ring, close",
   "pay": 1016,
   "steps": 3.22,
   "frame": "cage",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=CCCC(=O)CCc1cc(CCCCCO)cc(CCCCC(C)=O)c1",
   "name": "benzene ring with a ketone arm with a vinyl end, a methyl ketone arm and a primary alcohol arm",
   "kind": "made up",
   "heavy": 27,
   "groups": "OH 1 C=O 2 C=C 1",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off dry, weld, ring, seal",
   "pay": 759,
   "steps": 2.61,
   "frame": "benzene",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC(=O)CCC(=O)CCC(O)CC1CCC(CCC(=O)CCC(C)=O)CC1",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 27,
   "groups": "OH 1 C=O 4",
   "motifs": "ring",
   "why": "a carbon or hetero ring; in play it sets off dry, weld, ring, shift",
   "pay": 1391,
   "steps": 4.0,
   "frame": "ring",
   "origin": "game table"
  },
  {
   "smiles": "CC=CCC(=O)CCC1CCCC2C(CCC3OC3CCCCO)CCC12",
   "name": "hydrindane with an epoxide-and-alcohol arm and a ketone arm with the C=C one carbon too far",
   "kind": "made up",
   "heavy": 27,
   "groups": "OH 1 C=O 1 C=C 1 ether 1",
   "motifs": "ring fusion",
   "why": "fused rings; in play it sets off dry, weld, ring, shift",
   "pay": 1099,
   "steps": 3.19,
   "frame": "fused",
   "origin": "puzzle set"
  },
  {
   "smiles": "CCCC(CC=O)C(O)C(CCCO)C(N)C(CC=CC=O)CCC(=O)O",
   "name": "open chain with 2 OH, 2 C=O, C=C, COOH, NH2",
   "kind": "made up",
   "heavy": 27,
   "groups": "OH 2 C=O 2 C=C 1 COOH 1 NH2 1",
   "motifs": "acid amine resonance",
   "why": "an open chain; in play it sets off dry, weld, ring, seal; COOH and NH2 3 to 4 apart: seal makes a lactam; a C=C right beside a C=O: dihydroxylation, then dry, then flip",
   "pay": 1061,
   "steps": 3.28,
   "frame": "chain",
   "origin": "generator pool"
  },
  {
   "smiles": "COc1cc(C=CC(=O)CC(=O)C=Cc2ccc(O)c(OC)c2)ccc1O",
   "name": "curcumin",
   "kind": "real compound",
   "heavy": 27,
   "groups": "OH 2 C=O 2 C=C 2 ether 2",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off dry, weld, ring, shift",
   "pay": 928,
   "steps": 3.25,
   "frame": "benzene",
   "origin": "real-compounds set"
  },
  {
   "smiles": "NC12CC3CC(C4=CC(O)CSC4CC=O)(C1)CC(CC(=O)CCl)(C2)C3O",
   "name": "cage (adamantane) with 2 OH, 2 C=O, C=C, NH2, Cl, S bridge",
   "kind": "made up",
   "heavy": 27,
   "groups": "OH 2 C=O 2 C=C 1 NH2 1 Cl 1",
   "motifs": "ring cage amine sulfur",
   "why": "a cage; in play it sets off dry, weld, ring, close; Cl and NH2 3 to 5 apart: close makes a ring amine; aldehyde and OH: permanganate makes the COOH, seal closes it; OH and C=O 3 to 4 apart: ring",
   "pay": 1202,
   "steps": 3.86,
   "frame": "cage",
   "origin": "generator pool"
  },
  {
   "smiles": "CC(C)(O)CCC=CCCC=CCCC=CCCC(=O)C12C3C4C5C3C1C5C42",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 28,
   "groups": "OH 1 C=O 1 C=C 3",
   "motifs": "cage",
   "why": "a cage; in play it sets off dry, ring, weld, tuck",
   "pay": 874,
   "steps": 2.86,
   "frame": "cage",
   "origin": "game table"
  },
  {
   "smiles": "C=CCCC(=O)CC(CCCC=O)C(O)Cc1c(O)c(O)cc2c1CCC(O)C2",
   "name": "fused rings (tetralin) with 4 OH, 2 C=O, C=C",
   "kind": "made up",
   "heavy": 29,
   "groups": "OH 4 C=O 2 C=C 1",
   "motifs": "arene ring fusion resonance",
   "why": "fused rings; in play it sets off dry, weld, ring, shift; aldehyde and OH: permanganate makes the COOH, seal closes it; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach",
   "pay": 1393,
   "steps": 4.33,
   "frame": "fused",
   "origin": "generator extra"
  },
  {
   "smiles": "CCCc1cccc(CCC=C2C=CCC3(C2)C(=CCC=O)CCCC3O)c1O",
   "name": "spiro rings (spiro55) with 2 OH, C=O, 3 C=C",
   "kind": "made up",
   "heavy": 29,
   "groups": "OH 2 C=O 1 C=C 3",
   "motifs": "arene ring spiro resonance",
   "why": "a spiro ring pair; in play it sets off dry, ring, weld, shift; aldehyde and OH: permanganate makes the COOH, seal closes it; diene and a third C=C four to five away: snap closes a six-ring",
   "pay": 1197,
   "steps": 3.47,
   "frame": "spiro",
   "origin": "generator extra"
  },
  {
   "smiles": "CSCCCC(=O)CC(O)CCC(=O)CCC(=O)CCCC(=O)CCCCCN",
   "name": "long chain carrying 4 ketones or aldehydes, 1 alcohol, 1 amine",
   "kind": "made up",
   "heavy": 29,
   "groups": "OH 1 C=O 4 NH2 1",
   "motifs": "amine sulfur",
   "why": "an open chain; in play it sets off dry, weld, ring, knit",
   "pay": 1339,
   "steps": 3.75,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "NC(CCCC1CCC2(C1)C(O)CC(O)C2CCCCC=CC=O)CCC(=O)O",
   "name": "spiro rings (spiro44) with 2 OH, C=O, C=C, COOH, NH2",
   "kind": "made up",
   "heavy": 29,
   "groups": "OH 2 C=O 1 C=C 1 COOH 1 NH2 1",
   "motifs": "ring spiro acid amine resonance",
   "why": "a spiro ring pair; in play it sets off dry, weld, seal, ring; COOH and NH2 3 to 4 apart: seal makes a lactam; a C=C right beside a C=O: dihydroxylation, then dry, then flip",
   "pay": 822,
   "steps": 2.75,
   "frame": "spiro",
   "origin": "generator pool"
  },
  {
   "smiles": "NCCCC(=O)CCCC1CCC2(CC1)CCC(CC(=O)C=CCCCO)CC2",
   "name": "spiro[5.5]undecane with an amino ketone arm and an enone arm with an alcohol at its far end",
   "kind": "made up",
   "heavy": 29,
   "groups": "OH 1 C=O 2 C=C 1 NH2 1",
   "motifs": "ring spiro amine resonance",
   "why": "a spiro ring pair; in play it sets off knit, dry, weld, ring",
   "pay": 1222,
   "steps": 3.89,
   "frame": "spiro",
   "origin": "puzzle set"
  },
  {
   "smiles": "O=C(O)CCCC=CCC1C(O)CC(=O)C1C=CC(O)CCCCCCCCS",
   "name": "like prostaglandin E2, with a 3-carbon thiol arm on a methyl end",
   "kind": "near-relative",
   "heavy": 29,
   "groups": "OH 2 C=O 1 C=C 2 COOH 1 SH 1",
   "motifs": "ring acid",
   "why": "a carbon or hetero ring; in play it sets off dry, ring, weld, shift",
   "pay": 1105,
   "steps": 3.36,
   "frame": "ring",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC(=CCCCCC=O)CCCC(=O)CCC(O)CCC(=O)CCc1ccccc1",
   "name": "chain with 1 ring carrying 3 ketones or aldehydes, 1 alcohol, 1 C=C",
   "kind": "made up",
   "heavy": 30,
   "groups": "OH 1 C=O 3 C=C 1",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off dry, weld, ring, shift",
   "pay": 1142,
   "steps": 3.67,
   "frame": "benzene",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC(C)=CCCC(C)=CCCC(C)=CCCC=C(C)CCC=C(C)CCC=C(C)C",
   "name": "squalene",
   "kind": "real compound",
   "heavy": 30,
   "groups": "C=C 6",
   "motifs": "",
   "why": "an open chain; in play it sets off dry, weld, open, fold",
   "pay": 988,
   "steps": 2.67,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC=CCC(=O)CCC1CCC(CCCC(=O)O)C(CCC(=O)CCCC(C)=O)C1",
   "name": "cyclohexane with a diketone arm, an acid arm and a ketone arm with the C=C one carbon too far",
   "kind": "made up",
   "heavy": 30,
   "groups": "C=O 3 C=C 1 COOH 1",
   "motifs": "ring acid",
   "why": "a carbon or hetero ring; in play it sets off dry, weld, ring, shift",
   "pay": 1051,
   "steps": 3.53,
   "frame": "ring",
   "origin": "puzzle set"
  }
 ],
 "8": [
  {
   "smiles": "C=CCCC(=O)CCCC(=O)CCC(O)CCCC(=O)CCC(=O)CCCSC",
   "name": "long chain carrying 4 ketones or aldehydes, 1 alcohol, 1 C=C",
   "kind": "made up",
   "heavy": 29,
   "groups": "OH 1 C=O 4 C=C 1",
   "motifs": "sulfur",
   "why": "an open chain; in play it sets off dry, weld, ring, shift",
   "pay": 1291,
   "steps": 3.36,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "CCCC(N)C(C=O)C(=O)C1=CC(CC(CCC)C(N)CCCC(=O)O)CSC1",
   "name": "ring with an S (thiane) with 2 C=O, C=C, COOH, 2 NH2, S bridge",
   "kind": "made up",
   "heavy": 29,
   "groups": "C=O 2 C=C 1 COOH 1 NH2 2",
   "motifs": "ring acid amine sulfur resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, ring, knit, seal; COOH and NH2 3 to 4 apart: seal makes a lactam; a C=C two carbons from a C=O: shift, then more",
   "pay": 990,
   "steps": 3.25,
   "frame": "ring",
   "origin": "generator pool"
  },
  {
   "smiles": "COc1cc(C=CC(=O)CC(=O)C(O)C(O)c2ccc(O)c(OC)c2)ccc1O",
   "name": "like curcumin, with a C=C turned into a dihydroxy pair",
   "kind": "near-relative",
   "heavy": 29,
   "groups": "OH 4 C=O 2 C=C 1 ether 2",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off dry, ring, weld, flip",
   "pay": 1084,
   "steps": 3.58,
   "frame": "benzene",
   "origin": "real-compounds set"
  },
  {
   "smiles": "NCCCCCCCCC(O)C=CC1C(O)CC(O)C1CC=CCCCC(=O)O",
   "name": "like prostaglandin F2 alpha, with a 3-carbon amine arm on a methyl end",
   "kind": "near-relative",
   "heavy": 29,
   "groups": "OH 3 C=C 2 COOH 1 NH2 1",
   "motifs": "ring acid amine",
   "why": "a carbon or hetero ring; in play it sets off dry, ring, weld, seal",
   "pay": 872,
   "steps": 2.56,
   "frame": "ring",
   "origin": "real-compounds set"
  },
  {
   "smiles": "C=C1C(=CC=C2CCCC3(C)C2CCC3C(C)CCCC(C)(C)O)CC(O)CC1O",
   "name": "calcitriol",
   "kind": "real compound",
   "heavy": 30,
   "groups": "OH 3 C=C 3",
   "motifs": "ring fusion resonance",
   "why": "fused rings; in play it sets off dry, shift, ring, snap",
   "pay": 579,
   "steps": 2.19,
   "frame": "fused",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC(C)(CCCC(=O)CCC(=O)CCCN)OC(=O)CCCC(=O)CCCCC=O",
   "name": "long chain carrying 4 ketones or aldehydes, 1 amine, 1 ester",
   "kind": "made up",
   "heavy": 30,
   "groups": "C=O 4 NH2 1 ester 1",
   "motifs": "amine",
   "why": "an open chain; in play it sets off ring, knit, dry, weld",
   "pay": 1383,
   "steps": 4.03,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "CCSCCc1cc(CCC(=O)CCCC=O)cc(CCC2OC2CCCCO)c1",
   "name": "benzene ring with a thioether arm, an epoxide-and-alcohol arm and a keto-aldehyde arm",
   "kind": "made up",
   "heavy": 30,
   "groups": "OH 1 C=O 2 ether 1",
   "motifs": "arene ring sulfur resonance",
   "why": "a benzene ring; in play it sets off dry, weld, ring, fold",
   "pay": 1010,
   "steps": 3.03,
   "frame": "benzene",
   "origin": "puzzle set"
  },
  {
   "smiles": "NC(CCC(=O)O)CC(=O)C1C2C=C3CC(C2)CC1C3(S)CC(O)c1ccccc1",
   "name": "cage (adamantane) with OH, C=O, C=C, COOH, NH2, SH",
   "kind": "made up",
   "heavy": 30,
   "groups": "OH 1 C=O 1 C=C 1 COOH 1 NH2 1 SH 1",
   "motifs": "arene cage acid amine resonance",
   "why": "a cage; in play it sets off dry, weld, seal, ring; SH and C=O 3 to 4 apart: cap; COOH and NH2 3 to 4 apart: seal makes a lactam",
   "pay": 844,
   "steps": 2.67,
   "frame": "cage",
   "origin": "generator extra"
  },
  {
   "smiles": "O=CC12CC(O)C3C(CCC4=CC(=O)CCC43CCCCCl)C1CCC2C(=O)CO",
   "name": "like aldosterone, with a 3-carbon chloride arm on a methyl end",
   "kind": "near-relative",
   "heavy": 30,
   "groups": "OH 2 C=O 3 C=C 1 Cl 1",
   "motifs": "ring fusion resonance",
   "why": "fused rings; in play it sets off dry, weld, flip, close",
   "pay": 1123,
   "steps": 3.19,
   "frame": "fused",
   "origin": "real-compounds set"
  },
  {
   "smiles": "O=CCCCC(=O)CCC1CCC2(CC1)CCC(CCC(O)CCCC(=O)O)CC2",
   "name": "spiro[5.5]undecane with a keto-aldehyde arm and a hydroxy acid arm",
   "kind": "made up",
   "heavy": 30,
   "groups": "OH 1 C=O 2 COOH 1",
   "motifs": "ring spiro acid",
   "why": "a spiro ring pair; in play it sets off dry, weld, ring, seal",
   "pay": 910,
   "steps": 3.08,
   "frame": "spiro",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=CCC=CCC12CC3CC(C1)CC(C(=O)C=CCCCO)(C3)C2CC(N)CCC=O",
   "name": "adamantane cage carrying a skipped-diene arm, an enone-alcohol arm, an amino-aldehyde arm",
   "kind": "made up",
   "heavy": 31,
   "groups": "OH 1 C=O 2 C=C 3 NH2 1",
   "motifs": "cage amine resonance",
   "why": "a cage; in play it sets off dry, ring, weld, knit",
   "pay": 1315,
   "steps": 4.19,
   "frame": "cage",
   "origin": "real-compounds set"
  },
  {
   "smiles": "C=CCCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(C)O",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 31,
   "groups": "OH 7 C=C 1",
   "motifs": "",
   "why": "an open chain; in play it sets off dry, weld, ring, tuck",
   "pay": 1429,
   "steps": 3.75,
   "frame": "chain",
   "origin": "game table"
  },
  {
   "smiles": "CC(C)(O)C=CC=CCCCC=CC(=O)CCC(=O)CCC(=O)C12C3C4C5C3C1C5C42",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 31,
   "groups": "OH 1 C=O 3 C=C 3",
   "motifs": "cage resonance",
   "why": "a cage; in play it sets off dry, ring, weld, snap",
   "pay": 1244,
   "steps": 3.75,
   "frame": "cage",
   "origin": "game table"
  },
  {
   "smiles": "CC(C)=CCCC(C)=CCCC(C)=CCCC=C(C)CCC=C(C)CCC1OC1(C)C",
   "name": "squalene epoxide",
   "kind": "real compound",
   "heavy": 31,
   "groups": "C=C 5 ether 1",
   "motifs": "ring",
   "why": "a carbon or hetero ring; in play it sets off dry, ring, weld, fold",
   "pay": 824,
   "steps": 2.36,
   "frame": "ring",
   "origin": "puzzle set"
  },
  {
   "smiles": "CCC1OC1CC1CCC2(CCC(C(=O)C=CCCCO)C2)CC1CC(=O)CCC=O",
   "name": "spiro[4.5]decane carrying an enone-alcohol arm, an epoxide arm, a keto-aldehyde arm",
   "kind": "made up",
   "heavy": 31,
   "groups": "OH 1 C=O 3 C=C 1 ether 1",
   "motifs": "ring spiro resonance",
   "why": "a spiro ring pair; in play it sets off dry, weld, ring, tuck",
   "pay": 1419,
   "steps": 3.94,
   "frame": "spiro",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CCCC(CC1CC2(CCCCC2O)CC(N)(CC=C(CC)C(=O)C=O)C1O)C(C)Cl",
   "name": "spiro rings (spiro55) with 2 OH, 2 C=O, C=C, NH2, Cl",
   "kind": "made up",
   "heavy": 31,
   "groups": "OH 2 C=O 2 C=C 1 NH2 1 Cl 1",
   "motifs": "ring spiro amine resonance",
   "why": "a spiro ring pair; in play it sets off ring, knit, dry, weld; NH2 and C=O 3 to 4 apart: knit; Cl and OH 3 to 5 apart: close; a C=C two carbons from a C=O: shift, then more",
   "pay": 1172,
   "steps": 3.64,
   "frame": "spiro",
   "origin": "generator extra"
  },
  {
   "smiles": "C=CC(=O)CC(=O)C(CC1CC2(CCCC2)CC(O)C1=O)C(O)CCCCCCC(=O)O",
   "name": "spiro rings (spiro45) with 2 OH, 3 C=O, C=C, COOH",
   "kind": "made up",
   "heavy": 32,
   "groups": "OH 2 C=O 3 C=C 1 COOH 1",
   "motifs": "ring spiro acid resonance",
   "why": "a spiro ring pair; in play it sets off dry, ring, weld, tuck; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach",
   "pay": 1078,
   "steps": 3.28,
   "frame": "spiro",
   "origin": "generator pool"
  },
  {
   "smiles": "CC(C)C(C)C=CC(CO)C1CCC2(O)C3=CC=C4CC(O)CCC4(C)C3CC(=O)C12C",
   "name": "near-relative of ergosterol",
   "kind": "near-relative",
   "heavy": 32,
   "groups": "OH 3 C=O 1 C=C 3",
   "motifs": "ring fusion resonance",
   "why": "fused rings; in play it sets off dry, ring, weld, shift; C=O with an OH at 2 (dry) and an OH at 3 or 4 (ring)",
   "pay": 1181,
   "steps": 3.42,
   "frame": "fused",
   "origin": "generator extra"
  },
  {
   "smiles": "CC(=CCC1=C(C)C(=O)c2ccccc2C1=O)CCCC(C)CCCC(C)CCCC(C)C",
   "name": "vitamin K1",
   "kind": "real compound",
   "heavy": 33,
   "groups": "C=O 2 C=C 2",
   "motifs": "arene ring fusion resonance",
   "why": "fused rings; in play it sets off dry, ring, tuck, weld",
   "pay": 654,
   "steps": 2.11,
   "frame": "fused",
   "origin": "generator pool"
  },
  {
   "smiles": "CC(=O)CCC(=O)CCCCCCCC(=O)CCC(O)CCC(=O)CCc1ccccc1O",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 33,
   "groups": "OH 2 C=O 4",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off dry, ring, weld, tuck",
   "pay": 1318,
   "steps": 3.97,
   "frame": "benzene",
   "origin": "game table"
  },
  {
   "smiles": "CC(C)=CCCC(C)=CCCC(C)=CCCC=C(C)CCC=C(C)CC(O)C=C(C)C(=O)O",
   "name": "near-relative of squalene",
   "kind": "near-relative",
   "heavy": 33,
   "groups": "OH 1 C=C 6 COOH 1",
   "motifs": "acid resonance",
   "why": "an open chain; in play it sets off dry, seal, weld, ring; COOH and an OH 3 to 4 apart: seal",
   "pay": 890,
   "steps": 2.36,
   "frame": "chain",
   "origin": "generator pool"
  },
  {
   "smiles": "CC(N)CC(O)(CCC=CCCCC1=C(Cc2ccccc2)CCC=C1)CC(Cl)CCC=O",
   "name": "benzene ring (benzene) with OH, C=O, 3 C=C, NH2, Cl",
   "kind": "made up",
   "heavy": 33,
   "groups": "OH 1 C=O 1 C=C 3 NH2 1 Cl 1",
   "motifs": "arene ring amine resonance",
   "why": "a benzene ring; in play it sets off dry, ring, weld, close; Cl and NH2 3 to 5 apart: close makes a ring amine; aldehyde and OH: permanganate makes the COOH, seal closes it; diene and a third C=C four to five away: snap closes a six-ring",
   "pay": 936,
   "steps": 3.08,
   "frame": "benzene",
   "origin": "generator extra"
  },
  {
   "smiles": "CCC=C1CC(CCC(=O)O)CC(C(=O)CC(N)(CCCNC)CC2=CC(Cl)CCC2=O)C1",
   "name": "carbon ring (cyclohexane) with 2 C=O, 2 C=C, COOH, NH2, Cl",
   "kind": "made up",
   "heavy": 33,
   "groups": "C=O 2 C=C 2 COOH 1 NH2 1 Cl 1",
   "motifs": "ring acid amine resonance",
   "why": "a carbon or hetero ring; in play it sets off dry, knit, weld, ring; Cl and NH2 3 to 5 apart: close makes a ring amine; a C=C right beside a C=O: dihydroxylation, then dry, then flip",
   "pay": 1128,
   "steps": 3.61,
   "frame": "ring",
   "origin": "generator pool"
  },
  {
   "smiles": "O=CCCCCC(O)CCC(=O)CCC(=O)C=CCCCC=CC=CCC1C2CCC1CC2",
   "name": "chain with 2 rings carrying 3 ketones or aldehydes, 1 alcohol, 3 C=C bonds",
   "kind": "made up",
   "heavy": 33,
   "groups": "OH 1 C=O 3 C=C 3",
   "motifs": "cage resonance",
   "why": "a cage; in play it sets off dry, weld, ring, snap",
   "pay": 1175,
   "steps": 3.08,
   "frame": "cage",
   "origin": "puzzle set"
  }
 ],
 "9": [
  {
   "smiles": "CC(=O)CCCC12CCC(=O)C=C1CCC1C2C(O)CC2(C=O)C(C(=O)CO)CCC12",
   "name": "like aldosterone, with a methyl ketone arm on a methyl end",
   "kind": "near-relative",
   "heavy": 31,
   "groups": "OH 2 C=O 4 C=C 1",
   "motifs": "ring fusion resonance",
   "why": "fused rings; in play it sets off dry, ring, weld, flip",
   "pay": 1453,
   "steps": 3.89,
   "frame": "fused",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC(C)(O)CCC(=O)CCC1CCC2(CC1)CCC(CCC1OC1CCCCO)CC2",
   "name": "spiro[5.5]undecane with a ketone arm ending in a tertiary alcohol and an epoxide-and-alcohol arm",
   "kind": "made up",
   "heavy": 31,
   "groups": "OH 2 C=O 1 ether 1",
   "motifs": "ring spiro",
   "why": "a spiro ring pair; in play it sets off dry, ring, weld, fold",
   "pay": 1053,
   "steps": 3.19,
   "frame": "spiro",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC(C)=CCCC(C)C1CCC2(C)C3=C(CCC12C)C1(C)CCC(O)C(C)(C)C1CC3",
   "name": "lanosterol",
   "kind": "real compound",
   "heavy": 31,
   "groups": "OH 1 C=C 2",
   "motifs": "ring fusion",
   "why": "fused rings; in play it sets off dry, ring, weld, seal",
   "pay": 559,
   "steps": 2.17,
   "frame": "fused",
   "origin": "puzzle set"
  },
  {
   "smiles": "O=C(O)CCCC=CCC1C(O)CC(=O)C1C=CC(O)CCCCCCCCC(=O)O",
   "name": "like prostaglandin E2, with a 3-carbon acid arm on a methyl end",
   "kind": "near-relative",
   "heavy": 31,
   "groups": "OH 2 C=O 1 C=C 2 COOH 2",
   "motifs": "ring acid",
   "why": "a carbon or hetero ring; in play it sets off dry, weld, ring, shift",
   "pay": 1182,
   "steps": 3.44,
   "frame": "ring",
   "origin": "real-compounds set"
  },
  {
   "smiles": "C=CC(O)CCC12CC3CC(CCC(=O)CCC(C)=O)(C1)CC(CC(N)CCC=O)(C3)C2",
   "name": "adamantane cage carrying an allylic alcohol arm, a diketone arm, an amino-aldehyde arm",
   "kind": "made up",
   "heavy": 32,
   "groups": "OH 1 C=O 3 C=C 1 NH2 1",
   "motifs": "cage amine",
   "why": "a cage; in play it sets off dry, knit, weld, ring",
   "pay": 1538,
   "steps": 4.39,
   "frame": "cage",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC(=O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC1(O)CCCCC1",
   "name": "from the current game table",
   "kind": "current game molecule",
   "heavy": 32,
   "groups": "OH 1 C=O 1 C=C 5",
   "motifs": "ring",
   "why": "a carbon or hetero ring; in play it sets off dry, weld, ring, seal",
   "pay": 1241,
   "steps": 3.75,
   "frame": "ring",
   "origin": "game table"
  },
  {
   "smiles": "CCCC1CC(C(=O)NC(C(C)Cl)C2OC(SC)C(O)C(O)C2O)N(CCCC(C)=O)C1",
   "name": "like clindamycin, with a methyl ketone arm on a methyl end",
   "kind": "near-relative",
   "heavy": 32,
   "groups": "OH 3 C=O 1 Cl 1 ether 1 amide 1",
   "motifs": "ring amine sulfur",
   "why": "a carbon or hetero ring; in play it sets off dry, weld, ring, close",
   "pay": 807,
   "steps": 2.83,
   "frame": "ring",
   "origin": "real-compounds set"
  },
  {
   "smiles": "C=CCC(CC(CC(O)(CC(=C)C)C(C)=O)C(Cl)CC12CCCCC1C(O)CCC2)C(C)Cl",
   "name": "fused rings (decalin) with 2 OH, C=O, 2 C=C, 2 Cl",
   "kind": "made up",
   "heavy": 33,
   "groups": "OH 2 C=O 1 C=C 2 Cl 2",
   "motifs": "ring fusion",
   "why": "fused rings; in play it sets off dry, weld, ring, close; Cl and OH 3 to 5 apart: close; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach",
   "pay": 1211,
   "steps": 3.67,
   "frame": "fused",
   "origin": "generator extra"
  },
  {
   "smiles": "CC(=CCCCCC=O)CCCC(=O)CCC(O)CCCC(=O)CCC(=O)CCCCCN",
   "name": "long chain carrying 4 ketones or aldehydes, 1 alcohol, 1 C=C, 1 amine",
   "kind": "made up",
   "heavy": 33,
   "groups": "OH 1 C=O 4 C=C 1 NH2 1",
   "motifs": "amine",
   "why": "an open chain; in play it sets off dry, weld, ring, tuck",
   "pay": 1101,
   "steps": 3.33,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC(=O)CCCCC=CCC(=O)CCC(=O)C=CCCCC=CC=CCC1C2CCC1CC2",
   "name": "chain with 2 rings carrying 3 ketones or aldehydes, 4 C=C bonds",
   "kind": "made up",
   "heavy": 33,
   "groups": "C=O 3 C=C 4",
   "motifs": "cage resonance",
   "why": "a cage; in play it sets off dry, weld, ring, snap",
   "pay": 1625,
   "steps": 4.53,
   "frame": "cage",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC=CCC(=O)CCC1CCC(CCC(=O)CCCCCO)CC1CCCC(=O)CCCN",
   "name": "cyclohexane with an amino ketone arm, a ketone arm with the C=C one carbon too far and a ketone arm with a primary alcohol",
   "kind": "made up",
   "heavy": 33,
   "groups": "OH 1 C=O 3 C=C 1 NH2 1",
   "motifs": "ring amine",
   "why": "a carbon or hetero ring; in play it sets off dry, knit, weld, shift",
   "pay": 1422,
   "steps": 4.17,
   "frame": "ring",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC(C)=CCCC(C)=CCCC(C)=CCCC=C(C)CCC=C(C)CCC=C(C)CCCCN",
   "name": "like squalene, with a 3-carbon amine arm on a methyl end",
   "kind": "near-relative",
   "heavy": 34,
   "groups": "C=C 6 NH2 1",
   "motifs": "amine",
   "why": "an open chain; in play it sets off dry, weld, ring, knit",
   "pay": 712,
   "steps": 1.81,
   "frame": "chain",
   "origin": "real-compounds set"
  },
  {
   "smiles": "CC(O)C(Cl)C(=Cc1cccc(-c2ccc(-c3cccc(O)c3)cc2)c1)C(N)C(CO)CC=O",
   "name": "two rings joined (biphenyl) with 3 OH, C=O, C=C, NH2, Cl",
   "kind": "made up",
   "heavy": 34,
   "groups": "OH 3 C=O 1 C=C 1 NH2 1 Cl 1",
   "motifs": "arene amine resonance",
   "why": "a benzene ring; in play it sets off dry, weld, knit, close; OH and NH2 3 to 4 apart: oxidize makes the C=O, knit closes it; Cl and OH 3 to 5 apart: close",
   "pay": 1058,
   "steps": 3.33,
   "frame": "benzene",
   "origin": "generator extra"
  },
  {
   "smiles": "NCCCC(=O)CCCc1cc(CCCC(O)CCCCCl)cc(CCC(=O)CCCC=O)c1",
   "name": "benzene ring with a keto-aldehyde arm, a chloro alcohol arm and an amino ketone arm",
   "kind": "made up",
   "heavy": 34,
   "groups": "OH 1 C=O 3 NH2 1 Cl 1",
   "motifs": "arene amine resonance",
   "why": "a benzene ring; in play it sets off dry, weld, ring, knit",
   "pay": 1214,
   "steps": 3.81,
   "frame": "benzene",
   "origin": "puzzle set"
  },
  {
   "smiles": "C=CCC(CC=C)CC(=O)C(CC(O)CC(Cl)CC(=O)O)CC(CC=C)C(O)CCCCCCC",
   "name": "open chain with 2 OH, C=O, 3 C=C, COOH, Cl",
   "kind": "made up",
   "heavy": 35,
   "groups": "OH 2 C=O 1 C=C 3 COOH 1 Cl 1",
   "motifs": "acid",
   "why": "an open chain; in play it sets off dry, weld, ring, seal; COOH and an OH 3 to 4 apart: seal; a chain-end C=C and a C=O: hydrate or hydroborate puts the OH in reach",
   "pay": 1470,
   "steps": 3.83,
   "frame": "chain",
   "origin": "generator extra"
  },
  {
   "smiles": "CC(=O)CCCC(=O)CCc1cc(CCCC(=O)CCCS)cc(CCCC(O)CCCCCl)c1",
   "name": "benzene ring with a chloro alcohol arm, a thiol ketone arm and a diketone arm",
   "kind": "made up",
   "heavy": 35,
   "groups": "OH 1 C=O 3 SH 1 Cl 1",
   "motifs": "arene resonance",
   "why": "a benzene ring; in play it sets off cap, dry, ring, weld",
   "pay": 1105,
   "steps": 3.58,
   "frame": "benzene",
   "origin": "puzzle set"
  },
  {
   "smiles": "CC(=O)CCCCC(O)CCCC(=O)CCC(=O)CCC(O)CCCC=CC(=O)CCCC(=O)O",
   "name": "long chain carrying 4 ketones or aldehydes, 2 alcohols, 1 C=C, 1 acid",
   "kind": "made up",
   "heavy": 35,
   "groups": "OH 2 C=O 4 C=C 1 COOH 1",
   "motifs": "acid resonance",
   "why": "an open chain; in play it sets off dry, weld, ring, snap",
   "pay": 1615,
   "steps": 3.92,
   "frame": "chain",
   "origin": "puzzle set"
  },
  {
   "smiles": "CCC(N)C(CC(=O)O)CC1(O)CC(O)CCC12CCC(O)(CC(=O)CCC1CC=CCO1)CC2",
   "name": "spiro rings (spiro55) with 3 OH, C=O, C=C, COOH, NH2, ether",
   "kind": "made up",
   "heavy": 35,
   "groups": "OH 3 C=O 1 C=C 1 COOH 1 NH2 1 ether 1",
   "motifs": "ring spiro acid amine",
   "why": "a spiro ring pair; in play it sets off dry, ring, weld, seal; COOH and NH2 3 to 4 apart: seal makes a lactam; secondary OH and tertiary OH: oxidize makes the C=O the other OH closes onto",
   "pay": 1015,
   "steps": 3.14,
   "frame": "spiro",
   "origin": "generator extra"
  },
  {
   "smiles": "CCCCCCC(O)CCCC(=CC(=O)CCCCC(C)O)C(O)C1CC(O)CC12CCCC2N",
   "name": "spiro rings (spiro44) with 4 OH, C=O, C=C, NH2",
   "kind": "made up",
   "heavy": 35,
   "groups": "OH 4 C=O 1 C=C 1 NH2 1",
   "motifs": "ring spiro amine resonance",
   "why": "a spiro ring pair; in play it sets off dry, weld, ring, tuck; enone with an OH three or four from its far end: tuck",
   "pay": 907,
   "steps": 2.86,
   "frame": "spiro",
   "origin": "generator pool"
  },
  {
   "smiles": "CCCCSCC(O)C(C(=O)C(S)CC(O)C(O)CC=O)C(N)CCC1CCC(Cl)C12CCCC2",
   "name": "spiro rings (spiro44) with 3 OH, 2 C=O, NH2, SH, Cl, S bridge",
   "kind": "made up",
   "heavy": 35,
   "groups": "OH 3 C=O 2 NH2 1 SH 1 Cl 1",
   "motifs": "ring spiro amine sulfur",
   "why": "a spiro ring pair; in play it sets off dry, cap, ring, weld; Cl and NH2 3 to 5 apart: close makes a ring amine; OH and SH 3 to 4 apart: oxidize makes the C=O, cap closes it; ketone with OH at 2 and 3: dry gives an enol, flip turns it to C=O",
   "pay": 1159,
   "steps": 3.39,
   "frame": "spiro",
   "origin": "generator pool"
  },
  {
   "smiles": "CCCSCC(=CC(=O)C(O)CCC(=O)O)CC1CC2OC1C(O)C2CCCCC(S)CCC=O",
   "name": "cage with an O bridge (oxanorbornane) with 2 OH, 2 C=O, C=C, COOH, SH, S bridge, ether",
   "kind": "made up",
   "heavy": 35,
   "groups": "OH 2 C=O 2 C=C 1 COOH 1 SH 1 ether 1",
   "motifs": "cage acid sulfur resonance",
   "why": "a cage; in play it sets off cap, dry, ring, seal; SH and C=O 3 to 4 apart: cap; COOH and an OH 3 to 4 apart: seal; enone with an OH three or four from its far end: tuck",
   "pay": 1138,
   "steps": 3.39,
   "frame": "cage",
   "origin": "generator pool"
  },
  {
   "smiles": "O=C(O)CCCC(O)CCc1cc(CCCC(=O)CCCS)cc(CCC2OC2CCCCO)c1",
   "name": "benzene ring with an epoxide-and-alcohol arm, a thiol ketone arm and a hydroxy acid arm",
   "kind": "made up",
   "heavy": 35,
   "groups": "OH 2 C=O 1 COOH 1 SH 1 ether 1",
   "motifs": "arene ring acid resonance",
   "why": "a benzene ring; in play it sets off cap, dry, weld, fold",
   "pay": 1260,
   "steps": 3.58,
   "frame": "benzene",
   "origin": "puzzle set"
  },
  {
   "smiles": "O=CC(CC1=C2CCC(C2)C1)C1(O)CC2(CCCCC2O)C(=O)C1C1(O)CC2CC1(C=O)CC2O",
   "name": "spiro rings (spiro45) with 4 OH, 3 C=O, C=C",
   "kind": "made up",
   "heavy": 35,
   "groups": "OH 4 C=O 3 C=C 1",
   "motifs": "ring cage spiro",
   "why": "a cage; in play it sets off ring, dry, shift, weld; secondary and tertiary OH: chlorination makes the Cl, close closes it; an aldehyde and a ketone: reduce makes the OH that closes onto the ketone",
   "pay": 1084,
   "steps": 3.06,
   "frame": "cage",
   "origin": "generator pool"
  },
  {
   "smiles": "O=CCCCCC(=O)C=CCCCC=CC=CCCC=CCC(=O)CC1CCCC2CCCCC21",
   "name": "chain with 2 rings carrying 3 ketones or aldehydes, 4 C=C bonds",
   "kind": "made up",
   "heavy": 35,
   "groups": "C=O 3 C=C 4",
   "motifs": "ring fusion resonance",
   "why": "fused rings; in play it sets off dry, ring, weld, snap",
   "pay": 1567,
   "steps": 3.78,
   "frame": "fused",
   "origin": "puzzle set"
  }
 ]
}.items()}


def pool(rnd):
    return POOLS[rnd]


def smiles(rnd):
    return [m['smiles'] for m in POOLS[rnd]]


_PATS = [Chem.MolFromSmarts(p) for p in ('[CX4][OX2H]', '[CX3]=[OX1]', '[CX3]=[CX3]', '[NX3;H2][CX4]', '[SX2H]', '[Cl]')]


def _groups(mol):
    return sum(len(mol.GetSubstructMatches(p)) for p in _PATS)


def passes_filter(smi, rnd):
    mol = Chem.MolFromSmiles(smi)
    if mol is None:
        return False
    lo, hi = SIZE[rnd]
    h = mol.GetNumHeavyAtoms()
    if not lo <= h <= hi:
        return False
    if _groups(mol) / float(h) > GEN_FILTER['max_group_density'][rnd]:
        return False
    if rnd <= 3:
        rings = [set(r) for r in mol.GetRingInfo().AtomRings()]
        fused = any(len(a & b) >= 2 for i, a in enumerate(rings) for b in rings[i + 1:])
        spiro = any(len(a & b) == 1 for i, a in enumerate(rings) for b in rings[i + 1:])
        if rnd == 1 and (fused or spiro or len(rings) > 1):
            return False
        if rnd == 2 and (spiro or len(rings) > 2):
            return False
        hk = len({a.GetSymbol() for a in mol.GetAtoms()} & {'N', 'S', 'Cl'})
        if hk > GEN_FILTER['max_hetero_kinds'][rnd]:
            return False
    return True


def generate(rnd, rng, avoid=(), tries=400):
    """One generated molecule (dict: smiles, name, kind, why, origin) for a round."""
    import mol2_generator as G
    for _ in range(tries):
        d = G.deal(rnd, rng, avoid=avoid)
        if d['smiles'] in avoid or not passes_filter(d['smiles'], rnd):
            continue
        kind = {'real': 'real compound', 'relative': 'near-relative'}.get(d['source'], 'made up')
        return {'smiles': d['smiles'], 'name': d['name'], 'kind': kind, 'why': d.get('note', ''), 'origin': 'generator'}
    raise RuntimeError('no generated molecule passed the filter for round %d' % rnd)


def deal(rnd, rng, avoid=()):
    """One molecule for a round: the pool with chance P_POOL, else the generator.  `avoid`: SMILES not to repeat."""
    ps = [m for m in POOLS[rnd] if m['smiles'] not in avoid]
    if ps and rng.random() < P_POOL[rnd]:
        return rng.choice(ps)
    return generate(rnd, rng, avoid)


def atoms_and_bonds():
    elems, arom, charged, bonds, rings = set(), 0, 0, set(), set()
    for rnd, ms in POOLS.items():
        for m in ms:
            mol = Chem.MolFromSmiles(m['smiles'])
            for a in mol.GetAtoms():
                elems.add(a.GetSymbol())
                arom += a.GetIsAromatic()
                charged += a.GetFormalCharge() != 0
            for b in mol.GetBonds():
                bonds.add(str(b.GetBondType()))
            for r in mol.GetRingInfo().AtomRings():
                rings.add(len(r))
    return sorted(elems), arom, charged, sorted(bonds), sorted(rings)


def check():
    bad = 0
    seen = {}
    for rnd, ms in POOLS.items():
        lo, hi = SIZE[rnd]
        for m in ms:
            mol = Chem.MolFromSmiles(m['smiles'])
            if mol is None:
                print('does not parse', rnd, m['smiles'])
                bad += 1
                continue
            h = mol.GetNumHeavyAtoms()
            if not lo <= h <= hi:
                print('size', rnd, h, m['smiles'])
                bad += 1
            if m['smiles'] in seen:
                print('repeat', rnd, seen[m['smiles']], m['smiles'])
                bad += 1
            seen[m['smiles']] = rnd
    print('problems: %d; molecules: %s' % (bad, {r: len(v) for r, v in POOLS.items()}))
    return bad


def kekule(smi):
    mol = Chem.MolFromSmiles(smi)
    Chem.Kekulize(mol, clearAromaticFlags=True)
    return Chem.MolToSmiles(mol, kekuleSmiles=True)


FAMILY = {'chain': 'chain', 'ring': 'ring', 'benzene': 'arene', 'fused': 'fused', 'cage': 'cage', 'spiro': 'spiro'}


def feed_rows():
    """[(round, family, kekule SMILES)] in the shape of the FEED table of path.js (['family', 'SMILES'])."""
    return [(r, FAMILY[m['frame']], kekule(m['smiles'])) for r in sorted(POOLS) for m in POOLS[r]]


def frame_of(smi):
    """The family of a molecule: cage, spiro, fused, benzene, ring or chain (from traits.counts)."""
    import traits as TR
    c = TR.counts(Chem.CanonSmiles(smi))
    for key, fam in (('cage', 'cage'), ('spiro', 'spiro'), ('fusion', 'fused'), ('arene', 'benzene'), ('ring', 'ring')):
        if c.get(key, 0):
            return fam
    return 'chain'


def bank(n_per_round=40, seed='bank'):
    """A fixed list of generated molecules for a game that cannot run the generator: [(round, family, kekule SMILES, name)]."""
    rows = []
    for r in range(1, 10):
        rng = random.Random('%s/%d' % (seed, r))
        seen = set(smiles(r))
        for _ in range(n_per_round):
            d = generate(r, rng, avoid=seen)
            seen.add(d['smiles'])
            rows.append((r, FAMILY[frame_of(d['smiles'])], kekule(d['smiles']), d['name'].split('. Plan:')[0]))
    return rows


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'check'
    if cmd == 'check':
        sys.exit(1 if check() else 0)
    elif cmd == 'show':
        rs = [int(sys.argv[2])] if len(sys.argv) > 2 else range(1, 10)
        for r in rs:
            print('round %d' % r)
            for m in POOLS[r]:
                print('  %2d %-14s %s | %s' % (m['heavy'], m['kind'], m['smiles'], m['name']))
    elif cmd == 'js':
        print('// molecules2.py, one line per round: [round, family, SMILES]')
        for r, f, k in feed_rows():
            print("  [%d, '%s', '%s']," % (r, f, k))
    elif cmd == 'bank':
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 40
        print('// molecules2.py bank: generated molecules, [round, family, SMILES], not in the pool')
        for r, f, k, nm in bank(n):
            print("  [%d, '%s', '%s'],  // %s" % (r, f, k, ' '.join(nm.split())))
    elif cmd == 'atoms':
        print(atoms_and_bonds())
    elif cmd == 'sample':
        r = int(sys.argv[2]) if len(sys.argv) > 2 else 5
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 8
        rng = random.Random('sample')
        for _ in range(n):
            d = deal(r, rng)
            print('%-14s %s | %s' % (d['kind'], d['smiles'], d['name']))
