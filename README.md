# Atlas’ Atoms

A 3D chemistry playground for a kid who is getting curious about chemistry. Drag atoms onto a bench, bond them, and discover real molecules. Each discovery shows where the molecule shows up in real life and one thing about why it has its shape. There are 100 lesson plans that start from “what is an atom?”, written for a very advanced 7-year-old working with a grown-up. A Read aloud switch uses the browser's built-in voice.

## Play

Open `index.html` in a browser. There is no build step and nothing to install.

Or serve it locally:

```bash
python -m http.server 8765
```

Then visit http://localhost:8765.

## What you can do

- **Build molecules in 3D.** Drag atoms from the tray and drop one on another to bond. Tap the gold + on a bond (or drop again) for a double or triple bond. Each atom shows its bonding “hands” as dots, and smiles when all are used. Click an atom to poke it and read about it.
- **Move everything.** Drag empty space to orbit (it keeps spinning when you let go), scroll or pinch to zoom, Shift-drag or right-drag to pan. Shake gives every atom a kick if you want to see them settle again.
- **Four ways to look at a molecule.** Ball & Stick, Space-filling, Electrons (Lewis dot diagrams), and Orbitals (shared-electron clouds, lone-pair lobes, and s/p orbitals on lone atoms).
- **Missions.** Each mission gives a formula to build. Same atoms, wrong arrangement? The game says so (isomers).
- **My Atlas.** 33 molecules to find, from water and CO₂ to glucose, vanillin, aspirin and vitamin C. Found molecules spin in 3D and can be put back on the bench.
- **Reactions.** Put the right molecules on the bench and press Spark: rocket fuel, a gas stove, fertilizer, fizzy water, “elephant toothpaste”. Atoms visibly rearrange and are never created or destroyed.
- **Lessons.** 100 lessons in ten units, from "everything is made of atoms" to a capstone chemist poster. Each lesson has vocabulary, game activities, two quiz questions, a grown-up question and a safe off-screen activity. The game ticks a lesson off when the activity is done. A printable version is in [docs/LESSON_PLANS.md](docs/LESSON_PLANS.md).
- **Molecule Lab.** Three tabs. *Explore* lists every molecule you have found with its weight, atom and bond counts, shape and state at room temperature. *Orbitals* shows 1s, 2s and p orbitals as shapes and as clouds of electron dots (each dot is one possible position of the electron, sampled from the real wave function), plus sp³ hybridisation (watch the s and p orbitals blend into four) and the π bond in ethene. *Molecular orbitals* builds the bonding (σ) and antibonding (σ*) orbitals of H₂, with an energy diagram, a nuclei-distance slider with an overlap readout, and an electron counter that takes you from H₂⁺ and H₂ to He₂⁺ and He₂ (bond order zero, so helium does not bond).
- **How reactions happen.** A fourth Lab tab: red and green molecules collide in a box. Turn up the heat, crowd them together or add a catalyst and watch reactions speed up, with a linked energy-hill diagram (activation energy, exothermic and endothermic). A simplified collision-theory model of A₂ + B₂ → 2 AB. Five advanced lessons use it.
- **Real compounds.** Every molecule in the Atlas is verified against PubChem (formula must match exactly) and linked to its Wikipedia article, behind an "ask a grown-up" screen. For molecules a kid invents that are not in the Atlas, an 🔎 Is it real? button asks PubChem and shows the real name if it exists. `python tools/verify_compounds.py` re-checks the data.
- **Layout toggle.** The 📱 button in the header cycles Auto, iPhone and iPad layouts, so either can be forced on any screen. iPad has a left tray, a big touch-friendly bench, and a side panel that slides over in portrait.
- **Phones.** The bench fills the screen, atoms sit in a scrollable strip (swipe up from an atom to pull it out, tap it for its card), info lives in a slide-up sheet, and the Lab and lessons go full-screen. Pinch to zoom, one finger to orbit. Works in portrait and landscape. The page has a web-app manifest, so it can be added to a home screen.
- **Profiles.** Each child has a name and a picture and their own progress. Switch players from the header, add a brother or sister, and back up to a file (or a copy-paste code) to keep progress safe or move it to another device. Restoring always creates a new profile, so it can never overwrite anyone's progress. Progress is stored in the browser; Safari may clear it after about a week of not using the site, so a backup (or adding to the Home Screen) is the safe route.
- **Badges.** 29 badges: one for each of the ten lesson units, plus milestones for molecules found, reactions, lessons finished, perfect quizzes, exploring the Lab, asking PubChem, and a Certified Chemist trophy for all 100 lessons. A pop-up celebrates each new one.
- **Progress page for grown-ups.** Open Badges, then "Progress page for grown-ups": totals, progress by unit, the next lesson with a talking point, quizzes worth another look, recent activity, copy-to-clipboard and print. Everything stays on the device.
- **Offline.** After the first visit the game is cached by a service worker (`sw.js`) and works with no connection. When online it fetches fresh files, so updates still arrive.
- **Quizzes.** Every lesson has a 2-question multiple-choice quiz made from its check-yourself questions. Each answer is explained, a perfect score gives three stars and completes the lesson.
- **Element cards.** Click an element in the tray for a Bohr diagram and a fact. New elements unlock as you find molecules.
- Progress is saved in the browser (`localStorage`).

## Project layout

| File | Purpose |
| --- | --- |
| `js/data.js` | Elements, molecules (as SMILES), reactions, and the kid-facing text |
| `js/lessons.js` | The 20 lessons (valid JSON inside a JS wrapper) |
| `js/quizzes.js` | Multiple-choice questions for each lesson |
| `js/molinfo.js` | Shape and state facts, molar mass and bond counts for the Lab |
| `js/orbitals.js` | 3D orbital scenes (wave-function sampling, hybrids, molecular orbitals) |
| `js/reactionsim.js` | The collision-theory reaction box and energy-hill drawing |
| `js/realdata.js` | Generated: PubChem IDs and Wikipedia links for every molecule |
| `js/real.js` | Real-compound box, leave-the-game confirmation, "Is it real?" lookup |
| `js/profiles.js` | Profiles, saving, migration of old saves, backup and restore (with checking of backup files) |
| `js/profileui.js` | First-run name screen and the profile screen |
| `js/progress.js` | Lesson-completion rule, badges, and the grown-up progress page |
| `js/lab.js` | The Molecule Lab screens |
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

Everything except Three.js is drawn in code: no images, fonts or audio files. Sounds are synthesized with the Web Audio API. Emoji on the molecule cards use the viewer’s operating-system emoji font. [Three.js](https://threejs.org) is MIT licensed, which allows commercial use. Its licence text is kept at the top of `vendor/three.min.js` and in `vendor/LICENSE-three.txt`. The rest of the repo is proprietary: see `LICENSE` and `THIRD_PARTY_NOTICES.md`.

## Ideas for later

- More elements (Ca, K, Fe) and ionic crystals
- More reactions (rusting, photosynthesis)
- A “why does it smell?” gallery grouped by functional group
- More lessons for the Lab (orbitals, hybridisation, bond order) and a parent progress page
- A packaged app (Electron/Tauri) if it should be sold
