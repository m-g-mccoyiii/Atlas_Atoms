"""Write docs/REFERENCE.md from the game's own table (P.reference), as the job ref16.js printed it, with the simulated number of
runs each thing takes (sweep_deeds.py career, which writes _sweep/deed16/earn.json).

    bash .claude/headless/hlow.sh jobs/ref18.js ref18 120      (ref16.js until the eighteenth measure)
    python docs/tools_chem/sweep_deeds.py career 300
    python docs/tools_chem/sweep_refdoc.py
"""
import json
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
o = json.load(open(os.path.join(ROOT, '.claude', 'headless', 'out', 'ref18.json'), encoding='utf-8'))['result']
ref, cats, ladder, start = o['ref'], o['cats'], o['ladder'], o.get('start') or []
try:
    E = json.load(open(os.path.join(ROOT, 'docs', 'tools_chem', '_sweep', 'deed16', 'earn.json'), encoding='utf-8'))
except Exception:
    E = {'earn': {}, 'runs': 300, 'careers': 0}
KIND = {
    'reagent': 'Twelve by a deed in the reagent\'s own chemistry. Three bought with credit. Two found by firing others one after another.',
    'reflex': 'Each by a deed that nearly makes it. All three need a reagent that is itself earned first.',
    'motif': 'Each by a deed with rings: many closed at once, many more than dealt, two that share a side, or a high yield on a benzene ring.',
    'instrument': 'Each by the kind of play it helps, done in a six-round or nine-round run.',
    'homunculus': 'Each hatches when its jar is full. These ten are the lifetime counts of the book (ruling K: jars fill across runs).',
    'sigil': 'Each by brushing against the rule it bends, in a six-round or nine-round run.',
    'term': 'Each by a deed, as the game had them.',
    'length': 'Each by winning the run before it.',
    'soundtrack': 'Each by something reached.',
    'sign': 'By holding nine tenths of the book.',
}


def runs(x):
    e = E['earn'].get('%s:%s' % (x['category'], x['id']))
    if not e:
        return 'not simulated'
    f = lambda v: 'not in %d' % E['runs'] if v is None else str(v)
    return '%s, %s; %s, %s' % (f(e['casual_done']), f(e['casual']), f(e['careful_done']), f(e['careful']))


n_long = sum(1 for r in ladder if r['thing'] and r['long'])
n_thing = sum(1 for r in ladder if r['thing'])
n_credit = sum(1 for r in ladder if r['credit'])
L = ['# Overreact: the reference book', '',
     'Everything a player can get that a new game does not hold, by category: what it is called, what it does, and the one way to get it. This file is written from the game\'s own table, `P.reference(meta)` in `path.js` (`python docs/tools_chem/sweep_refdoc.py` after the job `ref18.js` and `sweep_deeds.py career`), so it says what the rules say. Every line is in the pattern of the manual (ruling BA): the thing and one verb of its own, the act, then just the number; everything is per page unless the line says otherwise. In the game the book shows a thing that is not yet owned with its name and how to get it, and hides what it does.', '',
     'Since the sixteenth measure every thing is got by a deed that fits it ("More deeds, fewer counts"). The lifetime counts left are the ten jars and Fold (epoxidize acts 3 times); the condenser asks for 2 rounds over all runs. No two things share a way. "Runs" is the run on which the thing is handed over in the middle career of %d simulated careers of %d runs, for the casual player and then the careful one; a run hands over two things at most, so in the first twenty runs a deed can be handed over up to about 19 runs after it was done. Both runs are given: the run the deed is done, then the run the thing is handed over.' % (E.get('careers', 0), E.get('runs', 300)), '',
     'For the page: `P.reference(meta)` gives one row a thing: `id`, `category`, `name`, `does`, `how`, `owned`, `nums` (the numbers of the line in order), and `count` and `target` where the way has a number; a homunculus also has `stages` (its five numbers) and `stage` (how far this profile has brought it). `P.thingOf(category, id)` gives the name and line of any thing, the ones a new game holds too. `P.REFERENCE_CATS` is the order and the names of the categories. `P.profileOpts(meta)` is what `P.runNew` needs so that a run offers what the profile holds and nothing else. `P.runResult(run).earned` lists what a run handed over, each with the thing\'s `name` and `how`. `P.stageOf(meta)` and `P.gateOpen(meta, what)` are what the page\'s own gate should read.', '',
     '## How many', '', '| Category | Things | How they are got |', '|---|---|---|']
for cid, cname in cats:
    n = sum(1 for x in ref if x['category'] == cid)
    L.append('| %s | %d | %s |' % (cname, n, KIND[cid]))
L += ['| All | %d | |' % len(ref), '',
      'A new game holds: six reagents (hydrate, oxidize, grow, thiolate, dehydrate, aminate), ten reflexes (ring, dry, weld, shift, tuck, flip, snap, close, cap, knit), eight motifs, the three-round run, two soundtracks, and nothing else.', '']
for cid, cname in cats:
    rows = [x for x in ref if x['category'] == cid]
    L += ['## %s (%d)' % (cname, len(rows)), '', '| Name | What it does | How it is got | Runs: casual done, handed over; careful done, handed over |', '|---|---|---|---|']
    for x in rows:
        L.append('| %s | %s | %s | %s |' % (x['name'][0].upper() + x['name'][1:], x['does'], x['how'], runs(x)))
    L.append('')
    if cid == 'homunculus':
        L += ['The line above is a new profile\'s (stage 1). A homunculus keeps what it grows: its jar goes on counting after it hatches, and at 2, 4, 7 and 11 times the jar\'s size it reaches stages 2 to 5. Its number at each stage:', '',
              '| Name | Stage 1 | 2 | 3 | 4 | 5 |', '|---|---|---|---|---|---|']
        for x in rows:
            L.append('| %s | %s |' % (x['name'], ' | '.join('x%.2f' % v for v in (x.get('stages') or [])) or 'no number'))
        L.append('')
if start:
    L += ['## What a new game already holds, in the same words', '', 'Not in the book (there is nothing to get); `P.thingOf` gives these lines to the page.', '']
    for cid, cname in (('reagent', 'Reagents: the starting six and the finishing hydrogen'), ('reflex', 'Reflexes: the starting ten, and the twelve across the fold'), ('motif', 'Motifs: all twelve (four of them are in the book above)')):
        L += ['### ' + cname, '', '| Name | What it does |', '|---|---|']
        L += ['| %s | %s |' % (x['name'], x['does']) for x in start if x['category'] == cid]
        L.append('')
L += ['## The ladder: what each rung hands over', '',
      'A run hands over two rungs at most; what is earned beyond that comes with the next runs, instruments first. The ladder has %d rungs. %d hand over one named thing (they are in the tables above); %d of those count only what is done in a six-round or nine-round run. %d pay credit, 1 to 10 each: the plain counts of rounds played and cleared, runs lost, reflex steps and rings, and the older deeds whose thing now has a way that fits it better. 3 rungs (clearing rounds 10, 11 and 12) are closed while the twelve-round run is switched off.' % (len(ladder), n_thing, n_long, n_credit), '',
      '## What is not in the book, and why', '',
      '- The suppliers (five, bought with credit at the bench). Once the page starts a run from the profile (`P.profileOpts`), instruments come from the book and a supplier gates only the three bought reagents (the trade supplier). Whether suppliers stay is for the owner.',
      '- The 53 older instruments in the code (balance, stir plate, the occult pieces and the rest): none is on offer in the game as it stands.',
      '- Notebooks, hazards, the catalog of compounds and cosmetic things: `FINDINGS.md` designs them; nothing of them is in the game\'s rules, so nothing can be got.',
      '- Inspections: all four are dealt from the first run; there is nothing to unlock.',
      '- The twelve across-the-fold reflexes: each comes by itself from round 4 when its near twin is held.',
      '- The twelve-round run: switched off.',
      '- Credit and gold: they are spent, not held.',
      '- Second ways that exist beside the one in the book: a homunculus held in a run puts its own reagent on the rack whether that reagent is owned or not (the wood spirit reduce, the slime hydroborate, ammonia cyanate, brimstone eliminate S).', '',
      '## What the page still has to do', '',
      '- Start a run with `P.runNew(tier, extra, Object.assign({ tierNo }, P.profileOpts(meta)))`. Until it does, the counts are not kept and no rung is handed over.',
      '- Save `meta.ladder`, `meta.counters`, `meta.deep`, `meta.reach` and `meta.sign` with the profile (`reach` and `sign` are not restored on load today).',
      '- Its own gate: read `P.stageOf(meta)` wherever it reads `meta.stage` (scheme.js: the bench, the jars, the kit shelf, the terms and the supplier limit), and stop raising `meta.stage` by hand. Then set `P.RULE.termsGate = false` so the book no longer says that a term waits for two six-round runs.',
      '- Call the music with the soundtracks owned (`P.owned(meta).soundtrack`).',
      '- Sigils: `P.sigilVisit(run)` and `P.sigilGet(run, id)` between rounds (RIG.md, sixteenth, item 1).', '']
open(os.path.join(ROOT, 'docs', 'REFERENCE.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(L))
print(len(ref), 'things;', ', '.join('%s %d' % (cn, sum(1 for x in ref if x['category'] == c)) for c, cn in cats))
