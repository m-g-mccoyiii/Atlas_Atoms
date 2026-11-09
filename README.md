# Atlas’ Atoms

A 3D chemistry playground for a kid who is getting curious about chemistry. Drag atoms onto a bench, bond them, and discover real molecules. Each discovery shows where the molecule shows up in real life and one thing about why it has its shape. There are 20 lesson plans that start from “what is an atom?”, written for a very advanced 7-year-old working with a grown-up. A Read aloud switch uses the browser's built-in voice.

## Play

Open `index.html` in a browser. There is no build step and nothing to install.

Or serve it locally:

```bash
python -m http.server 8765
```

Then visit http://localhost:8765.

## What you can do

- **Build molecules in 3D.** Drag atoms from the tray and drop one on another to bond. Drop again for a double or triple bond. Each atom shows its bonding “hands” as dots, and smiles when all are used. Click an atom to poke it and read about it.
- **Move everything.** Drag empty space to orbit (it keeps spinning when you let go), scroll or pinch to zoom, Shift-drag or right-drag to pan. The Heat slider makes atoms jiggle, and Shake kicks them all.
- **Four ways to look at a molecule.** Ball & Stick, Space-filling, Electrons (Lewis dot diagrams), and Orbitals (shared-electron clouds, lone-pair lobes, and s/p orbitals on lone atoms).
- **Missions.** Each mission gives a formula to build. Same atoms, wrong arrangement? The game says so (isomers).
- **My Atlas.** 33 molecules to find, from water and CO₂ to glucose, vanillin, aspirin and vitamin C. Found molecules spin in 3D and can be put back on the bench.
- **Reactions.** Put the right molecules on the bench and press Spark: rocket fuel, a gas stove, fertilizer, fizzy water, “elephant toothpaste”. Atoms visibly rearrange and are never created or destroyed.
- **Lessons.** 20 lessons with vocabulary, game activities, check-yourself questions and safe off-screen activities. The game ticks a lesson off when the activity is done. A printable version is in [docs/LESSON_PLANS.md](docs/LESSON_PLANS.md).
- **Element cards.** Click an element in the tray for a Bohr diagram and a fact. New elements unlock as you find molecules.
- Progress is saved in the browser (`localStorage`).

## Project layout

| File | Purpose |
| --- | --- |
| `js/data.js` | Elements, molecules (as SMILES), reactions, and the kid-facing text |
| `js/lessons.js` | The 20 lessons (valid JSON inside a JS wrapper) |
| `js/chem.js` | SMILES parser, formulas, valence rules, molecule fingerprinting |
| `js/model.js` | Atoms/bonds and a small 3D physics relaxer (bond lengths, VSEPR-style angles) |
| `js/render3d.js` | Three.js renderer and 3D drag/orbit input |
| `js/game.js` | UI, missions, discoveries, reactions, Atlas, lessons |
| `vendor/three.min.js` | Three.js r128 (MIT), bundled so the game works offline |
| `tests/index.html` | Open in a browser to run the tests (no Node needed) |
| `tools/make_lesson_doc.py` | Rebuilds `docs/LESSON_PLANS.md` from `js/lessons.js` |

## Add a molecule

Add an entry to `AA.MOLECULES` in `js/data.js`. `smiles` supports `C N O S P F Cl`, bracket atoms like `[Na]` and `[H]`, `-` `=` `#`, branches `( )` and ring digits. Hydrogens on unbracketed atoms are implied. Then open `tests/index.html`: it checks that the molecule has valid valences, a unique fingerprint, and a sensible 3D shape.

## Edit the lessons

Change `js/lessons.js`, then run `python tools/make_lesson_doc.py` to refresh the printable document.

## Assets and licensing

Everything except Three.js is drawn in code: no images, fonts or audio files. Sounds are synthesized with the Web Audio API. Emoji on the molecule cards use the viewer’s operating-system emoji font. [Three.js](https://threejs.org) is MIT licensed, which allows commercial use. Its licence text is kept at the top of `vendor/three.min.js` and in `vendor/LICENSE-three.txt`. Choose a licence for the rest of the repo before releasing it.

## Ideas for later

- More elements (Ca, K, Fe) and ionic crystals
- More reactions (rusting, photosynthesis)
- A “why does it smell?” gallery grouped by functional group
- Quizzes that read the lesson questions, and a parent progress page
- A packaged app (Electron/Tauri) if it should be sold
