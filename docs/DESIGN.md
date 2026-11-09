# Steam edition design

Working title: Meitner Analytical.

## The game

You run a small analytical lab. Each case file gives an unknown sample and a client who needs an answer. You have a day budget. Every instrument run costs one day.

Loop:

1. Read the file.
2. Run an instrument: mass spectrometer, infrared, hydrogen NMR. A quick scan is noisy and loses weak peaks and splitting. A high-resolution run costs another day.
3. Build a candidate on the 3D bench from atoms in the tins.
4. Your structure's predicted spectrum is drawn in red pencil over each printout, with a match meter per instrument.
5. Optionally search the spectral library (one day) for the closest known compounds.
6. Declare. A wrong declaration costs a day and a reviewer says which instrument disagrees. A right one closes the file.

Rating: 3 stars for few days used, 2 for a few more, 1 otherwise. Standing is the running score.

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
