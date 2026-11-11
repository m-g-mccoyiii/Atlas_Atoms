# tools_chem: the Overreact engine on real molecules

Every design is tested on real molecules written as SMILES, with RDKit. Reactions are reaction SMARTS. Needs `python -c "import rdkit"` to work.

Files: `molecules.py` (the game's molecules, read from `apps/steam/js/react/path.js`, and a generator), `chemlib.py` (building blocks), `library.py` (the reactions and self-reactions), `engine.py` (turn, round, players, measures), `test_engine.py`.

**Add a reaction.** In `library.py`, write `Reaction('name', 'Label', [SmartsStep('[C:1]=[O:2]>>[C:1]=C', adds='CH2', loses='O', off={'water': 1})])` and put it in `REACTIONS`. A step acts at every place it fits, one place at a time. `adds` and `loses` are the formulas the reagent brings and what leaves (the engine checks the atoms balance). `off` is what the jars count. If two carbons need a tie rule, pass `choose=function(mol, cand)` (see `zaitsev`). Add two rows to `R` in `test_engine.py`: SMILES before, SMILES after, places, what came off.

**Add a self-reaction.** For one group: `SmartsSelfRule('name', '<reaction SMARTS>', dist, off=..., loses=...)`. For two groups a number of carbons apart: `GraphRule('name', finder, editor)` where `finder` is `pair_sites(mol, smartsA, smartsB, anchorA, anchorB, lo, hi, ring='lactol')` and `editor(rw, site)` edits the RDKit graph. Put it in `SELF_RULES` and `SELF_ORDER`. Distances are bonds along carbons only, the shortest way. Add two rows to `S` in `test_engine.py`.

**Run a measure.**
```python
from engine import *
rs = run_rounds(Engine(), deal_source(), SIX, SELF_RING, 'greedy', range(300), gating=True)   # 300 rounds
print(format_summary(summarize(rs)))        # steps a turn, spread, self-reactions fired, what comes off, best-line table
print(compare_carried(Engine(), SIX, SIX[:5] + ('wittig',), ['C=CCCC(=O)CCC=O'], range(40)))   # how two sets differ
print(best_line_stats(Engine(), 'C=CCCC(=O)CCC=O', SIX))        # every line for one molecule and one hand
```
Players: `'random'`, `'greedy'` (most pay this turn), `'greedy_steps'`, `'lookahead'` (this turn and the next, the next hand is known). Self-reaction sets: `SELF_RING` (the game as built), `SELF_TIER1`, `SELF_ALL`, or any tuple of names.

**Commands** (from this folder).
- `python test_engine.py` runs the tests; `python test_engine.py --game` adds the comparison with the game.
- `python molecules.py` lists the molecules, how many parse and the rounds each is dealt in.
- `python engine.py demo` plays 60 rounds for each player; `python engine.py game 10` is the comparison with the game; `python engine.py time` times 300 rounds.

Not in the paper designs as real chemistry: see the list in the report of 2026-11-11 (Suzuki on an alkyl chloride, knit leaving a C=C, ozonolysis at a chain-end C=C, Raney nickel keeping the C=C, Hofmann giving ammonia, the pay rule's hand-picked numbers). `Reaction.note` and `SelfRule.doc` say what each one does and where it departs.
