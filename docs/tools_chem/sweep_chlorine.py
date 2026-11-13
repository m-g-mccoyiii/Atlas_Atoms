"""The thirteenth measure, part 4: chlorine in the first rounds (ruling AR), with the same six reagents and the reflex `close`
as the reference chemistry has it (library.close: a Cl and an OH, NH2, SH or COOH 3 to 5 carbons apart close a ring).

    python sweep_chlorine.py make            candidates: each pool and bank molecule of rounds 1 to 3 with one Cl put on a plain
                                             carbon; kept when a share of all lines of three from the six sets `close` off
    python sweep_chlorine.py rate            how often close acts, by round, in the runs of `sweep_run.py gentle` (tags given)
"""
import itertools
import json
import os
import random
import sys

from rdkit import Chem

import sweep_core as SC
import sweep_run as SR

OUT = os.path.join(SC.SWEEP_DIR, 'chlorine_candidates.json')


def variants(smi):
    """One Cl on each carbon that is sp3, carries a hydrogen, holds no other element and is not in a ring of three."""
    m = Chem.MolFromSmiles(smi)
    out = set()
    for a in m.GetAtoms():
        if a.GetSymbol() != 'C' or a.GetIsAromatic() or a.GetTotalNumHs() == 0 or str(a.GetHybridization()) != 'SP3':
            continue
        if any(n.GetSymbol() != 'C' for n in a.GetNeighbors()):
            continue
        rw = Chem.RWMol(m)
        cl = rw.AddAtom(Chem.Atom(17))
        rw.AddBond(a.GetIdx(), cl, Chem.BondType.SINGLE)
        try:
            Chem.SanitizeMol(rw)
            out.add(Chem.MolToSmiles(rw))
        except Exception:
            pass
    return sorted(out)


def score(G, smi, rnd):
    """Share of all lines of three (216) on which close fires on the first page; and whether it fires on lines where no
    reagent lands (the molecule closes by itself at the first chance)."""
    R = G.begin(smi, rnd, SC.START_SIX, 'plain', None, 1 if rnd <= 3 else 3)
    n = hit = 0
    alone = False
    memo = {}
    for line in itertools.product(SC.START_SIX, repeat=3):
        R2, page = G.run_line(R, line, memo)
        n += 1
        c = 'close' in page['chain']
        hit += 1 if c else 0
        if c and all(x[1] == 0 for x in page['circ']):
            alone = True
    return hit / float(n), alone


def make():
    G = SR.game_for([], {})
    res = {}
    for rnd in (1, 2, 3):
        rows = []
        base = SC.FEED_POOL[rnd] + SC.FEED_BANK[rnd]
        for smi in base:
            if 'Cl' in smi:
                continue
            for v in variants(smi):
                try:
                    sh, alone = score(G, v, rnd)
                except Exception as e:
                    continue
                if sh >= 0.25:
                    rows.append((round(sh, 3), alone, v, smi))
        rows.sort(reverse=True)
        res[rnd] = rows
        print('round', rnd, 'candidates', len(rows))
        for r in rows[:40]:
            print('   %.2f %s %-40s from %s' % (r[0], 'by itself' if r[1] else 'set up   ', r[2], r[3]))
    json.dump(res, open(OUT, 'w'), indent=0)


def rate(tags):
    import sweep_career as C
    for t in tags:
        var, pl = t.rsplit('/', 1)
        runs = C.load(var).get(pl) or []
        if not runs:
            print(t, 'no runs')
            continue
        out = []
        for i in range(min(9, max(len(r) for r in runs))):
            col = [r[i] for r in runs if len(r) > i]
            pages = sum(len(x[C.STEPS]) for x in col)
            cl_pages = sum(x[C.KINDS].get('close', 0) for x in col)      # close fires once a Cl: steps are hands, nearly
            rounds_cl = sum(1 for x in col if x[C.KINDS].get('close', 0))
            has = sum(1 for x in col if 'Cl' in x[C.MOL])
            out.append('r%d: Cl on %2.0f%% of molecules, close in %4.1f of 100 hands (1 in %s), in %2.0f%% of rounds' % (
                i + 1, 100.0 * has / len(col), 100.0 * cl_pages / max(1, pages), ('%.0f' % (pages / float(cl_pages))) if cl_pages else '-',
                100.0 * rounds_cl / len(col)))
        print(t, len(runs), 'runs')
        for o in out[:4]:
            print('   ' + o)


if __name__ == '__main__':
    if sys.argv[1] == 'make':
        make()
    elif sys.argv[1] == 'rate':
        rate(sys.argv[2:])


def pages_with_close(G, smi, rnd, plays=24, seed=1):
    """Mean number of the round's three hands in which close fires, random lines from random hands of five."""
    rng = random.Random('%s/%d' % (smi, seed))
    tot = 0
    for _ in range(plays):
        R = G.begin(smi, rnd, SC.START_SIX, 'plain', None, 1)
        for pg in range(3):
            hand = SC.deal_hand(SC.START_SIX, R, rng, 5)
            lines = G.lines(R, hand)
            if not lines:
                break
            R2, page = G.run_line(R, rng.choice(lines))
            R2.rec = R.rec + [G.page_rec(page)]
            tot += 1 if 'close' in page['chain'] else 0
            R = R2
            if R.over or pg == 2:
                break
            G.turn(R)
    return tot / float(plays)


def two():
    """Two chlorines: the best single candidates with a second Cl, kept when close fires in more hands of a round."""
    G = SR.game_for([], {})
    res = json.load(open(OUT))
    out = {}
    for rnd in ('1', '2', '3'):
        rows = []
        parents = []
        seen = set()
        for sh, alone, v, src in res[rnd]:
            if src in seen or alone:
                continue
            seen.add(src)
            parents.append(v)
            if len(parents) >= 30:
                break
        for v in parents:
            one = pages_with_close(G, v, int(rnd))
            best = (one, v)
            for w in variants(v)[:12]:
                if w.count('Cl') != 2:
                    continue
                try:
                    pw = pages_with_close(G, w, int(rnd), plays=12)
                except Exception:
                    continue
                if pw > best[0]:
                    best = (pw, w)
            rows.append((round(one, 2), v, round(best[0], 2), best[1]))
        rows.sort(key=lambda r: -r[2])
        out[rnd] = rows
        print('round', rnd)
        for r in rows:
            print('   one Cl %.2f hands  %-36s two Cl %.2f hands  %s' % r)
    json.dump(out, open(OUT.replace('.json', '2.json'), 'w'), indent=0)


if len(sys.argv) > 1 and sys.argv[1] == 'two':
    two()


def game(fp=None):
    """Compare the game's own turns on the chlorine molecules (.claude/headless/jobs/cl13.js) with the reference chemistry:
    the reflex kinds in order, the count of close, and the molecule after (canonical SMILES)."""
    fp = fp or os.path.join(SC.ROOT, '.claude', 'headless', 'out', 'cl13.json')
    d = json.load(open(fp))['result']
    G = SR.game_for([], {'co2': False, 'far_from': 99})
    ID = {'pcc': 'oxidize', 'allyl': 'grow'}
    n = same_steps = same_close = same_mol = close_ref = close_game = 0
    bad = []
    for mrow in d['mols']:
        for line, g in zip(d['lines'], mrow['rows']):
            n += 1
            if 'err' in g:
                bad.append((mrow['smi'], line, g['err']))
                continue
            R = G.begin(mrow['smi'], mrow['round'], SC.START_SIX, 'plain', None, 1)
            R2, page = G.run_line(R, tuple(line))
            ref = list(page['chain'])
            cr, cg = ref.count('close'), g['steps'].count('close')
            close_ref += cr
            close_game += cg
            a = Chem.MolFromSmiles(g['after'])
            ga = Chem.MolToSmiles(a) if a else g['after']
            ra = Chem.MolToSmiles(Chem.MolFromSmiles(R2.smi))
            same_steps += 1 if ref == g['steps'] else 0
            same_close += 1 if cr == cg else 0
            same_mol += 1 if ga == ra else 0
            if cr != cg:
                bad.append((mrow['smi'], line, 'reference %s, game %s' % (ref, g['steps'])))
    print('turns %d | same count of close %d | same reflexes in the same order %d | same molecule after %d | close steps: reference %d, game %d' % (
        n, same_close, same_steps, same_mol, close_ref, close_game))
    for b in bad[:12]:
        print('  ', b)


if len(sys.argv) > 1 and sys.argv[1] == 'game':
    game(sys.argv[2] if len(sys.argv) > 2 else None)
