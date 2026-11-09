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

Tuning status: budgets and the 3-day par come from a computed check, not human playtests. They need real players.

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
