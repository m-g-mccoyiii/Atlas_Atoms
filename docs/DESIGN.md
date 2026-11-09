# Steam edition design

Working title: Meitner Analytical.

## The game

You run a small analytical lab. Each case file gives an unknown sample and a client who needs an answer. You have a day budget. Every instrument run costs one day.

Loop:

1. Read the file.
2. Run an instrument (one day each): mass spectrometer, infrared, hydrogen NMR. Quick scans hide information. High-res mass spec adds the M+1 isotope peak (about 1.1% of M per carbon, so it counts carbons). High-res NMR resolves splitting (n neighbours give n+1 lines). IR has one setting.
3. Click a signal on a printout and say what it is, from five choices. Right answers go in the notebook. Wrong answers count as misreads.
4. Build a candidate on the 3D bench. Its predicted spectrum is drawn in red over the printouts. Each notebook entry gets a tick or cross for whether the structure explains it. Formula, nominal mass and unsaturation are shown, and mass is checked against the measured M.
5. Optionally search the lab's library (one day). It holds only some known compounds and, after the first file, never the answer. It returns a ranked list, not a structure.
6. Declare. A wrong declaration costs a day, and peer review names a notebook entry the structure fails to explain. A right one closes the file.

Budget is 5 plus the file's tier in days. Rating: 3 stars for 3 days or fewer, 2 for 5 or fewer, 1 otherwise, minus one star for 5 or more misreads.

## Direction after design review

The labelling-and-notebook loop above plays like a worksheet. The new core loop, prototyped in `apps/steam/proto.html`, is live tuning:

- Build from fragments (CH3, OH, C=O, ring) with open bonds filled by implied hydrogen, like a skeletal drawing.
- Your spectrum redraws on every change over the target. Explained peaks lock with a tick, a green flash and a chime. Unexplained peaks pulse.
- Scans are a scarce choice: mass spectrum free, one token for a second instrument.
- Point at a peak and the atoms that cause it glow on the 3D molecule, with a plain explanation (n + 1 splitting, deshielding, isotopes). IR peaks make the matching bond vibrate.

Still to build: fragmentation animation for mass spec, orbital and electron-density views tied to peaks, mixtures and impurity peaks, hinted scans, daily puzzle, then the reaction lab.

## Playtest results (automated, files 3 to 12)

A bot labelled every signal correctly for each combination of instrument runs, then listed which of 69 compounds (the 33 in the library plus 36 decoy isomers and look-alikes) could still explain all its findings.

- Choices for each signal are picked by closeness (wavenumber, shift, or mass arithmetic) and merged where chemists would call two labels the same. 294 option sets were checked: always five choices, one right answer, no duplicates, no wrong choice that also fits the mass arithmetic.
- After one quick MS, one IR and one quick NMR, files 3 to 10 leave no rival among the 69 compounds.
- Two files cannot be settled by the instruments. Vanillin and isovanillin give identical spectra on all three instruments. Glucose and fructose are identical on MS and IR, and NMR scores 0.88. The simulator uses textbook rules and does not model these differences. Both files carry a `decide` note from the client. A structure that fits every instrument but is not the sample costs no day and shows the note.
- This measures whether the data identify the answer. It does not measure how hard the puzzle is for a person: the bottleneck is building a structure from the evidence, and a bot cannot judge that. Budgets (5 plus tier) and the 3-day par stay as set until real players try the files.

Known gaps: the simulator cannot separate ring positional isomers or sugar ring forms; the decoy list is hand-picked; no human has played files 3 to 12.

Why it works: the player forms a hypothesis, tests it against evidence, and decides when to spend a limited resource. Cases are built so that mass alone is not enough (for example aspirin and glucose both weigh 180).

## Honest limits

- Spectra are simulated with textbook rules. They are for teaching, not for real analysis, and the game says so.
- 12 cases exist. This is a vertical slice, not a full game.

## Later, in order

1. More cases and mixtures, with tier and difficulty tuning from playtests.
2. Reference sheet unlocks and a notebook the player fills in.
3. Synthesis campaign: plan a reaction route to make a target compound.
4. Plant automation: scale a route into a production line.
5. Workshop support for user-made cases.

Scope advice: finish and playtest the spectra game before starting the synthesis campaign. Each later stage needs its own data licensing check (see LICENSING.md).
