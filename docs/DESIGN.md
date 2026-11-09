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

## The game: forensic chemist, then the rules break

Entry point: `apps/steam/noir.html`. You run an independent lab. Detectives and inspectors send samples. You identify each one on the bench, read what it means, and say who or what is responsible. Chemistry is the means. The game is the cases, the reputation and the money.

Systems that exist:
- Lab hours per case (8, plus upgrades). Each assay costs one hour, so feedback is a decision, not a free hint.
- Scan tokens per sample. The mass spectrum is free, and one token reads a second instrument.
- Assays reveal peak by peak with rising chimes. Explanations and the 3D atom highlight unlock only for peaks you have earned.
- Evidence board, suspects, accusation with supporting findings, three outcomes (solved, thin evidence, wrong person) with real cost.
- Cash, reputation, upgrades, casebook, endings.
- Five cases. Act I (cases 1 to 4) teaches real chemistry. Act II starts with case 5.

The arc, written so each act changes what the player is allowed to believe:
1. Act I, grounded. Everything obeys the tables. The player learns the instruments and trusts them.
2. Act II, anomalies. A sample matches a known compound except for one signal no structure can make. Case 5 does this with a hydrogen NMR line at -3.2 ppm. The player can only report it. Nothing explains it yet.
3. Act III, the pattern. Anomalies recur across unrelated cases. The player starts building a model of what they have in common, and the bench gains tools that break the rules (bonds above the normal limit, an entry in the periodic table that is not there).
4. Act IV, new laws. The player deduces the rules of the new chemistry the way they learned the old ones, from evidence, and uses them.

Act II as built (cases 5 to 8): the scientific method is the plot. Each act offers a rational explanation and the player's own tests refute it.
- Case 5, one hydrogen line at -3.2 ppm in an archive ampoule. Hypotheses: contamination, instrument fault, something not in the tables. Two are refuted by samples.
- Cases 6 and 7 are ordinary customs and hospital cases. Each also contains an unexplained line, at -2.4 ppm (2 H) and -1.6 ppm (3 H). Reporting it puts it in the anomaly ledger.
- Case 8 requires a prediction. The ledger plots the entries. The player must find the rule (the shift rises by 0.8 and the hydrogen count by 1 each time), enter the next shift and count, and cannot open the next package until they do. A correct prediction pays cash and reputation, and a miss costs reputation. The hypotheses (tracer, drift, own sequence) are tested with a real commercial tracer control (-6.0 ppm, not on the sequence) and a fresh-ethanol run (no line).
- Act II ends on a plain fact: the next line is predicted at 0.0 ppm with 5 hydrogens, which is where the instrument's own reference sits.

Writing rule for every act: state plain facts. The impossible parts are impossible numbers, for example "no organic hydrogen resonates below 0 ppm", not hints or mood.

Why this can sell: one-sentence hook ("a forensic chemist whose lab results start to break chemistry"); a shareable first-anomaly moment; mastery that compounds (every rule learned is used again); a clear store pitch for detective, puzzle and mystery players who have no chemistry background.

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
