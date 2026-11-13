"""Write docs/REFERENCE.md from the game's own table (P.reference), as the job ref14.js printed it.

    bash .claude/headless/hlow.sh ref14.js ref14 60
    python docs/tools_chem/sweep_refdoc.py
"""
import json
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
o = json.load(open(os.path.join(ROOT, '.claude', 'headless', 'out', 'ref14.json')))['result']
ref, cats = o['ref'], o['cats']
INVENTED = {
    'reagent': 'The twelve earned by a deed are new ways: until now the game handed all of them to any long run, or (hydroborate, reduce) only with a creature. The three bought with credit and the two found by a row are as the game already had them.',
    'reflex': 'All three are new ways: the game had no way to get them.',
    'motif': 'All four are new ways: the game had no way to open them.',
    'instrument': 'All eight are new ways: until now an instrument was on offer once its supplier had been bought with credit.',
    'homunculus': 'None invented: each hatches when its jar is full, as built. Ammonia and brimstone had no jar size in the game and could never hatch; they now have 40 and 80.',
    'sigil': 'All nine are new ways (first proposals; how sigils are got is still the owner\'s to decide).',
    'term': 'None invented: each is earned by a deed the game already had.',
    'length': 'None invented.',
    'soundtrack': 'All four are new ways: nothing gated a soundtrack. The page has to call the music with what is owned.',
    'sign': 'None invented.',
}
L = ['# Overreact: the reference book', '',
     'Everything a player can get that a new game does not hold, by category: what it is called, what it does, and the one way to get it. This file is written from the game\'s own table, `P.reference(meta)` in `path.js` (`python docs/tools_chem/sweep_refdoc.py` after the job `ref14.js`), so it says what the rules say. In the game the book shows a thing that is not yet owned with its name and how to get it, and hides what it does.', '',
     'For the page: `P.reference(meta)` gives one row a thing: `id`, `category`, `name`, `does`, `how`, `owned`, and `count` and `target` where the way is a count. `P.REFERENCE_CATS` is the order and the names of the categories. `P.profileOpts(meta)` is what `P.runNew` needs so that a run offers what the profile holds and nothing else. `P.runResult(run).earned` lists what a run handed over, each with the thing\'s `name` and `how`.', '',
     '## How many', '', '| Category | Things | Ways invented for this book |', '|---|---|---|']
for cid, cname in cats:
    n = sum(1 for x in ref if x['category'] == cid)
    L.append('| %s | %d | %s |' % (cname, n, INVENTED[cid]))
L += ['| All | %d | |' % len(ref), '',
      'A new game holds: six reagents (hydrate, oxidize, grow, thiolate, dehydrate, aminate), ten reflexes (ring, dry, weld, shift, tuck, flip, snap, close, cap, knit), eight motifs, the three-round run, two soundtracks, and nothing else.', '']
for cid, cname in cats:
    rows = [x for x in ref if x['category'] == cid]
    L += ['## %s (%d)' % (cname, len(rows)), '', '| Name | What it does | How it is got | Count |', '|---|---|---|---|']
    for x in rows:
        L.append('| %s | %s | %s | %s |' % (x['name'][0].upper() + x['name'][1:], x['does'], x['how'], x['target'] if x['target'] and x['target'] > 1 else ''))
    L.append('')
L += ['## The ladder: what each rung hands over', '',
      'A run hands over two rungs at most; what is earned beyond that comes with the next runs. 40 of the 56 rungs open one named thing (they are in the tables above). 13 pay credit, because the game holds fewer things than the ladder has rungs: clear round 9 of a nine-round run (10 credit); 2,000 reflex steps (5); 200 rounds played, 100 rounds cleared, 30 runs lost, 1,000 reflex steps (3 each); 10 and 20 rounds played, 5 and 10 rounds cleared, 6 runs lost, 50 and 100 reflex steps (1 each). 3 rungs (clearing rounds 10, 11 and 12) are closed while the twelve-round run is switched off.', '',
      '## What is not in the book, and why', '',
      '- The suppliers (five, bought with credit at the bench). Until now a supplier put its instruments on offer. Once the page starts a run from the profile (`P.profileOpts`), instruments come from the book and a supplier gates only the three bought reagents (the trade supplier). Whether suppliers stay is for the owner.',
      '- The 53 older instruments in the code (balance, stir plate, the occult pieces and the rest): none is on offer in the game as it stands.',
      '- Notebooks, hazards, the catalog of compounds and cosmetic things: `FINDINGS.md` designs them; nothing of them is in the game\'s rules, so nothing can be got.',
      '- Inspections: all four are dealt from the first run; there is nothing to unlock.',
      '- The twelve across-the-fold reflexes: each comes by itself from round 4 when its near twin is held.',
      '- The twelve-round run: switched off.',
      '- Credit and gold: they are spent, not held.', '',
      '## What the page still has to do', '',
      '- Start a run with `P.runNew(tier, extra, Object.assign({ tierNo }, P.profileOpts(meta)))`. Until it does, the counts are not kept and no rung is handed over.',
      '- Save `meta.ladder`, `meta.counters`, `meta.deep`, `meta.reach` and `meta.sign` with the profile (`reach` and `sign` are not restored on load today).',
      '- Call the music with the soundtracks owned (`P.owned(meta).soundtrack`).',
      '- Sigils: a run holds those passed as `sigils` (three at most) out of `P.profileOpts(meta).sigilsOwned`; how the player picks or buys them is not decided.', '']
open(os.path.join(ROOT, 'docs', 'REFERENCE.md'), 'w', encoding='utf-8', newline='\n').write('\n'.join(L))
print(len(ref), 'things;', ', '.join('%s %d' % (cn, sum(1 for x in ref if x['category'] == c)) for c, cn in cats))
