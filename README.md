# Atlas’ Atoms

A chemistry playground for a kid who is getting curious about chemistry. Drag atoms onto a bench, bond them, and discover real molecules. Each discovery shows where the molecule shows up in real life and one thing about why it has its shape.

## Play

Open `index.html` in a browser. There is no build step and nothing to install.

Or serve it locally:

```bash
python -m http.server 8765
```

Then visit http://localhost:8765.

## What you can do

- **Build molecules.** Drag atoms from the tray and drop one on another to bond. Drop again for a double or triple bond. Each atom shows its bonding “hands” as dots, and smiles when all are used.
- **Three ways to look at a molecule.** Ball & Stick, Space-filling, and Orbitals (shared-electron clouds, lone pairs, and s/p orbitals on lone atoms). Drag empty space to rotate, scroll to zoom.
- **Missions.** Each mission gives a formula to build. Same atoms, wrong arrangement? The game says so (isomers).
- **My Atlas.** 29 molecules to find, from water and CO₂ to glucose, vanillin and vitamin C. Found molecules spin in 3D and can be put back on the bench.
- **Reactions.** Put the right molecules on the bench and press Spark: rocket fuel, a gas stove, fertilizer, “elephant toothpaste”. Atoms are visibly rearranged, never created or destroyed.
- **Element cards.** Click an element in the tray for a Bohr diagram and a fact. New elements unlock as you find molecules.
- Progress is saved in the browser (`localStorage`).

## Project layout

| File | Purpose |
| --- | --- |
| `js/data.js` | Elements, molecules (as SMILES), reactions, and all the kid-facing text |
| `js/chem.js` | SMILES parser, formulas, valence rules, molecule fingerprinting |
| `js/model.js` | Atoms/bonds and a small 3D physics relaxer (bond lengths, VSEPR-style angles) |
| `js/render.js` | Canvas renderer and drag/rotate input |
| `js/game.js` | UI, missions, discoveries, reactions, Atlas |
| `tests/index.html` | Open in a browser to run the tests (no Node needed) |

## Add a molecule

Add an entry to `AA.MOLECULES` in `js/data.js`. `smiles` supports `C N O S P F Cl`, bracket atoms like `[Na]` and `[H]`, `-` `=` `#`, branches `( )` and ring digits. Hydrogens on unbracketed atoms are implied. Then open `tests/index.html`: it checks that the molecule has valid valences, a unique fingerprint, and a sensible 3D shape.

## Assets and licensing

Everything is drawn in code. There are no images, fonts, audio files, or third-party libraries, so nothing here carries an outside licence. Sounds are synthesized with the Web Audio API. Emoji on the molecule cards use the viewer’s operating-system emoji font. Choose a licence for the repo before releasing it.

## Ideas for later

- More elements (Ca, K, Fe) and ionic crystals
- Lewis dot view and electron-sharing animation
- More reactions (rusting, baking soda + vinegar, photosynthesis)
- A “why does it smell?” gallery grouped by functional group
- Touch pinch-zoom, and a packaged app (Electron/Tauri) if it should be sold
