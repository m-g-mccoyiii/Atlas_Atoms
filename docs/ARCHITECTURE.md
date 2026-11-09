# Architecture

## Layout

```
/                      Kids' web game (GitHub Pages): index.html, css/, js/
packages/core/         Shared chemistry engine used by both editions
  js/data.js           Elements, colours, valences
  js/chem.js           Molecule library, SMILES parser, graph signature
  js/model.js          Atoms, bonds, relaxation physics, analysis of a built structure
  js/render3d.js       Viewer: ball and stick, space filling, orbitals, drag and bond
  js/spectra.js        Simulated MS, IR and 1H NMR, quick-scan degrading, similarity scoring
  vendor/              Three.js r128 (MIT)
apps/steam/            Steam edition (Electron shell, not published on Pages)
  js/cases.js          Case files
  js/paper.js          Instrument printouts drawn on canvas
  js/sfx.js            Synthesised sound
  js/game.js           Screens and rules
tests/                 Browser test page, open tests/index.html
docs/                  Lesson plans, deploy notes, licensing, design
```

Scripts are classic `<script>` tags that attach to a global `AA` object. Both editions load the same files from `packages/core/js`.

## Shared core rules

- Core never touches the DOM outside the canvas it is given.
- Core has no dependency on either app. Apps depend on core.
- A change to core must keep `tests/index.html` green and the kids' app working.

## Core API used by the Steam game

- `AA.chem.library()` returns `{ list, byId }` of known molecules.
- `AA.Model` holds atoms and bonds. `model.analyze()` returns connected pieces with formula, open-bond atoms and the matching library molecule.
- `AA.Viewer(canvas, model, opts)` renders and handles dragging atoms onto each other to bond.
- `AA.spectra.describe(smiles)` and `describeGraph(atoms, bonds)` produce spectrum data. `degrade(data)` makes a quick-scan version. `compare(a, b)` returns a 0 to 1 match per instrument.

## Fork workflow

The Steam edition lives in the same repository so core fixes reach both. Release flow:

1. Work on `main`. The Pages workflow removes `apps/`, `docs/` and `tools/` before publishing, so the unreleased game never goes public.
2. For Steam builds run `npm install` then `npm run dist` inside `apps/steam`. This stages the game and core into `apps/steam/stage` and packages it with Electron.

## Status

The Electron files (`main.js`, `preload.js`, `scripts/stage.js`, `package.json`) were written without Node installed and have not been run. Dependency versions in `package.json` must be checked on first install.
