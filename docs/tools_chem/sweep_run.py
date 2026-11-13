"""sweep_run.py: run any grid of experiments on every CPU core, resumable.

  python sweep_run.py <experiment> [--workers 12] [--limit N] [--fresh]
  python sweep_run.py list
  python sweep_run.py bench [--workers 12]          throughput: cold and warm, one core and all

An experiment is a function in sweep_exps.py that returns a list of jobs.  A job is a small dict:
  {'id': unique string, 'mods': ['perk:water', 'sigil:ouroboros', 'elem:Br'], 'params': {...}, 'length': 'bachelor',
   'rack': [...], 'player': 'median', 'seeds': [..]}                       (kind 'runs', the default)
The worker plays the runs with sweep_core and returns one summary row; rows go to docs/tools_chem/_sweep/<experiment>/rows.jsonl
(git-ignored by name: results are not committed, summaries are).  A job whose id is already in rows.jsonl is skipped, so a
stopped sweep carries on where it was.  The memo cache of (molecule, reagent) -> result is shared through disk
(_sweep/cache): workers write what they learn, the parent folds it into the base between waves, later waves start warm.
"""
import argparse
import itertools
import json
import math
import multiprocessing as mp
import os
import random
import sys
import time
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import sweep_core as SC

OUT = SC.SWEEP_DIR
MAX_WORKERS = 8
CACHE_LIMIT = 2500000
_GAMES = {}
_LAST_SAVE = [time.time()]


def low_priority():
    """Workers run below normal priority so the page builders and the browser rig keep the machine."""
    # Owner's ruling (13 November): the machine froze under twelve workers at normal priority.  Every worker runs below normal
    # and a pool has eight workers at most (MAX_WORKERS).  The cost: when other programs fill the machine the workers wait.
    if os.environ.get('SWEEP_LOW') == '0':
        return
    try:
        import psutil
        psutil.Process().nice(psutil.BELOW_NORMAL_PRIORITY_CLASS if os.name == 'nt' else 10)
        return
    except Exception:
        pass
    try:
        if os.name == 'nt':
            import ctypes
            ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), 0x00004000)
        else:
            os.nice(10)
    except Exception:
        pass


def build_mods(names):
    mods = []
    for nm in names or ():
        kind, _, arg = nm.partition(':')
        if kind == 'perk':
            import sweep_perks
            mods.append(sweep_perks.make(arg))
        elif kind == 'sigil':
            import sigil2_rules
            mods.append(sigil2_rules.make(arg))
        elif kind == 'hom':
            import sweep_homs
            mods.append(sweep_homs.make(arg))
        elif kind == 'elem':
            import sweep_elements
            mods.append(sweep_elements.make(arg))
        else:
            raise ValueError('no such mod ' + nm)
    return mods


def game_for(mods, params):
    k = (tuple(mods or ()), json.dumps(params or {}, sort_keys=True))
    G = _GAMES.get(k)
    if G is None:
        ms = build_mods(mods)
        chem = '+'.join(sorted(m.chem for m in ms if getattr(m, 'chem', ''))) or 'base'
        pk = {x: v for x, v in (params or {}).items() if x in ('max_heavy', 'most', 'motif_open', 'reopen')}
        if pk:
            chem += '|' + json.dumps(pk, sort_keys=True)
        if (params or {}).get('_cold'):
            chem = 'cold'
        G = SC.Game(key=chem, mods=ms, params=params, cache=(SC.MemStore() if chem == 'cold' else SC.shared_store()))
        _GAMES[k] = G
    return G


def summarize(runs, n_rounds, watch=None, per_round=False):
    """One row for a list of runs (dicts of sweep_core.play_run).  watch: an element symbol to count in the molecules."""
    n = len(runs)
    row = {'n': n, 'won': sum(r['won'] for r in runs), 'cleared': sum(r['cleared'] for r in runs)}
    row['gold'] = round(sum(r.get('gold', 0) for r in runs) / n, 2)
    row['spent'] = round(sum(r.get('spent', 0) for r in runs) / n, 2)
    row['uses'] = round(sum(r.get('uses', 0) for r in runs) / n, 2)
    row['used_runs'] = sum(1 for r in runs if r.get('uses', 0))
    at = [a for r in runs for a in r.get('at', [])]
    if at:
        row['at'] = at[:200]
    row['dec'] = [sum(rd['dec'][0] for r in runs for rd in r['rounds']), sum(rd['dec'][1] for r in runs for rd in r['rounds'])]
    row['tot'] = [[rd['total'] for rd in r['rounds']] for r in runs] if n <= 12 else None
    # each run, each round: 1 when the spec was met, and the yield over the number to beat (what any pass mark is read from)
    row['rr'] = [[[int(rd['met']), round(rd['total'] / rd['par'], 3)] for rd in r['rounds']] for r in runs] if n <= 12 else None
    row['ok'] = [sum(1 for r in runs if len(r['rounds']) > i and r['rounds'][i].get('ok')) for i in range(n_rounds)]
    sp = {}
    for r in runs:
        for rd in r['rounds']:
            for nm, _n in rd['spec']:
                c = sp.setdefault('%d/%s' % (rd['r'], nm), [0, 0])
                c[0] += 1
                c[1] += int(rd['met'])
    row['sp'] = sp                       # round/spec name: [times set, times the round's spec was met]
    row['alive'] = [sum(1 for r in runs if len(r['rounds']) > i) for i in range(n_rounds)]
    per = []
    for i in range(n_rounds if per_round else 0):
        d = {'kinds': Counter(), 'dealt': Counter(), 'used': Counter(), 'steps': 0, 'turns': 0, 'el_start': 0, 'el_end': 0, 'tap': 0}
        for r in runs:
            if len(r['rounds']) <= i:
                continue
            rd = r['rounds'][i]
            d['kinds'].update(rd['kinds'])
            d['dealt'].update(rd['dealt'])
            d['used'].update(rd['used'])
            d['steps'] += sum(rd['steps'])
            d['turns'] += len(rd['steps'])
            d['tap'] += rd.get('tap', 0)
            if watch:
                d['el_start'] += _has(rd['mol'], watch)
                d['el_end'] += _has(rd['end'], watch)
        per.append({k: (dict(v) if isinstance(v, Counter) else v) for k, v in d.items()})
    if per_round:
        row['per'] = per
    row['met'] = [sum(1 for r in runs if len(r['rounds']) > i and r['rounds'][i]['met']) for i in range(n_rounds)]
    row['logtot'] = [round(sum(math.log(max(1, r['rounds'][i]['total'])) for r in runs if len(r['rounds']) > i) / n, 4) for i in range(n_rounds)]
    row['marks'] = [round(sum(r['rounds'][i]['marks'] for r in runs if len(r['rounds']) > i) / n, 3) for i in range(n_rounds)]
    kinds, dealt, used = Counter(), Counter(), Counter()
    per_run_kinds, steps, longest, turns, taps, far = [], 0, 0, 0, 0, 0
    hists, ends, ratio = [], set(), []
    for r in runs:
        c = Counter()
        for rd in r['rounds']:
            c.update(rd['kinds'])
            dealt.update(rd['dealt'])
            used.update(rd['used'])
            steps += sum(rd['steps'])
            longest = max(longest, max(rd['steps'] or [0]))
            turns += len(rd['steps'])
            taps += rd.get('tap', 0)
            ratio.append(rd['total'] / rd['par'])
        kinds.update(c)
        per_run_kinds.append(len(c))
        hists.append(c)
        ends.add(r['rounds'][-1]['end'])
    row['kinds'] = dict(kinds)
    row['kinds_run'] = round(sum(per_run_kinds) / n, 3)
    row['steps_turn'] = round(steps / max(1, turns), 3)
    row['longest'] = longest
    row['turns'] = turns
    row['taps'] = taps
    row['dealt'] = dict(dealt)
    row['used'] = dict(used)
    row['ends'] = len(ends)
    ratio.sort()
    row['ratio_med'] = round(ratio[len(ratio) // 2], 3)
    row['ratio_max'] = round(ratio[-1], 1)
    row['ratio_p90'] = round(ratio[int(len(ratio) * 0.9)], 2)
    # how different two runs are: total-variation distance between their reflex-kind histograms, over pairs
    rg = random.Random(n)
    tv, m = 0.0, 0
    for _ in range(min(40, n * (n - 1) // 2)):
        a, b = rg.sample(hists, 2)
        sa, sb = sum(a.values()), sum(b.values())
        if sa and sb:
            tv += 0.5 * sum(abs(a.get(k, 0) / sa - b.get(k, 0) / sb) for k in set(a) | set(b))
            m += 1
    row['tv'] = round(tv / m, 3) if m else None
    return row


_HAS = {}


def _has(smi, el):
    k = (smi, el)
    v = _HAS.get(k)
    if v is None:
        from rdkit import Chem
        m = Chem.MolFromSmiles(smi)
        v = _HAS[k] = int(m is not None and any(a.GetSymbol() == el for a in m.GetAtoms()))
    return v


def do_job(job):
    t0 = time.time()
    try:
        G = game_for(job.get('mods'), job.get('params'))
        miss0 = G.stats['seg_miss']
        pr0 = G.stats['proofs']
        length = job.get('length', 'bachelor')
        extra = None
        for m in G.mods:
            if hasattr(m, 'deal_extra'):
                extra = m.deal_extra
        first, last = job.get('first', 1), job.get('last')
        nr = (last - first + 1) if last else SC.LENGTHS[length][0]
        players = job.get('players') or [job.get('player', 'median')]
        by = {}
        for m in G.mods:
            if hasattr(m, 'reset'):
                m.reset()
        for pl in players:
            runs = [SC.play_run(G, s, length, tuple(job['rack']), pl, extra=extra, first=first, last=last, stop=bool(job.get('stop')))
                    for s in job['seeds']]
            by[pl] = summarize(runs, nr, job.get('watch'), bool(job.get('watch') or job.get('per')))
            if job.get('full'):          # every round of every run, for the career tables (sweep_career.py)
                by[pl]['full'] = [[[rd['mol'], int(rd['met']), rd['total'], rd['par'], rd.get('prog'), rd['steps'], rd['kinds'], rd['used'],
                                    [n for n, _ in rd['spec']], rd['end']] for rd in r['rounds']] for r in runs]
        row = dict(by[players[0]]) if len(players) == 1 else {'by': by, 'turns': sum(v['turns'] for v in by.values())}
        for m in G.mods:
            if hasattr(m, 'report'):
                row.setdefault('mod', {}).update(m.report())
        row['miss'] = G.stats['seg_miss'] - miss0
        row['proofs'] = G.stats['proofs'] - pr0
        G.store.keep = True
        G.store.flush()
        row['id'] = job['id']
        row['secs'] = round(time.time() - t0, 3)
        for k in ('rack', 'player', 'players', 'length', 'mods', 'tag', 'first', 'last'):
            if k in job:
                row[k] = job[k]
        return row
    except Exception as e:
        import traceback
        return {'id': job['id'], 'error': '%s: %s' % (type(e).__name__, e), 'trace': traceback.format_exc()[-1500:],
                'secs': round(time.time() - t0, 3)}


def _flush(_):
    n = 0
    for G in _GAMES.values():
        n += G.store.flush(True)
    time.sleep(0.2)                      # so every worker takes one of these
    return n


def do_chunk(jobs):
    """Several jobs in one message to a worker; the rows come back together (small dicts)."""
    out = [do_job(j) for j in jobs]
    for G in _GAMES.values():
        G.store.flush(True)
    return out


def rows_of(name):
    fp = os.path.join(OUT, name, 'rows.jsonl')
    out = []
    if os.path.exists(fp):
        with open(fp, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        out.append(json.loads(line))
                    except Exception:
                        pass
    return out


def run(name, jobs, workers=12, waves=None, quiet=False, keep_errors=False, chunk=None, every=30, seconds=None):
    """Run the jobs not yet done on one pool of workers that lives for the whole call.  The workers share what they learn
    through the sqlite store as they go (sweep_core.Store), so there are no waves and nothing is merged.  Returns the stats."""
    workers = max(1, min(MAX_WORKERS, workers))
    d = os.path.join(OUT, name)
    os.makedirs(d, exist_ok=True)
    done = {r['id'] for r in rows_of(name) if 'error' not in r or keep_errors}
    todo = [j for j in jobs if j['id'] not in done]
    stats = {'jobs': len(jobs), 'todo': len(todo), 'turns': 0, 'core_secs': 0.0, 'errors': 0, 'miss': 0, 'proofs': 0}
    if not todo:
        return stats
    random.Random(1).shuffle(todo)
    t0 = time.time()
    fp = os.path.join(d, 'rows.jsonl')
    if seconds is None and os.environ.get('SWEEP_SECONDS'):
        seconds = float(os.environ['SWEEP_SECONDS'])       # stop cleanly after this long (the pool is closed, nothing is orphaned)
    if chunk is None:
        chunk = max(1, min(4, len(todo) // (workers * 20) or 1))
    parts = [todo[i:i + chunk] for i in range(0, len(todo), chunk)]
    n_done, t_last, turns_last = 0, t0, 0
    folder = SC.Folder()
    folder.fold(final=True)              # logs left by a run that was stopped
    t_fold = time.time()
    with open(fp, 'a', encoding='utf-8') as f, mp.Pool(workers, initializer=low_priority) as pool:
        for rows in pool.imap_unordered(do_chunk, parts, chunksize=1):
            for row in rows:
                f.write(json.dumps(row) + '\n')
                n_done += 1
                if 'error' in row:
                    stats['errors'] += 1
                    if stats['errors'] <= 3:
                        print('ERROR', row['id'], row['error'], row.get('trace', '')[-600:], flush=True)
                else:
                    stats['turns'] += row.get('turns', 0)
                    stats['miss'] += row.get('miss', 0)
                    stats['proofs'] += row.get('proofs', 0)
                stats['core_secs'] += row.get('secs', 0)
            now = time.time()
            if now - t_fold >= 90:
                folder.fold()
                t_fold = time.time()
            if not quiet and now - t_last >= every:
                f.flush()
                print('[%s] %d/%d jobs, %d turns, wall %.0f s, %.0f turns/s all cores (%.0f in the last %.0f s), %.1f turns/s a core, new pairs %d, proofs %d' % (
                    name, n_done, len(todo), stats['turns'], now - t0, stats['turns'] / (now - t0),
                    (stats['turns'] - turns_last) / (now - t_last), now - t_last,
                    stats['turns'] / max(stats['core_secs'], 1e-9), stats['miss'], stats['proofs']), flush=True)
                t_last, turns_last = now, stats['turns']
            if seconds and now - t0 > seconds:
                stats['stopped'] = True
                pool.terminate()
                break
        else:
            pool.map(_flush, range(workers), chunksize=1)
    folder.fold(final=True)
    stats['store'] = folder.count()
    folder.close()
    stats['wall'] = time.time() - t0
    if not quiet:
        print('[%s] done: %d jobs, %d turns, wall %.0f s, %.0f turns/s all cores, %.1f turns/s a core, new pairs %d, proofs %d' % (
            name, len(todo), stats['turns'], stats['wall'], stats['turns'] / stats['wall'],
            stats['turns'] / max(stats['core_secs'], 1e-9), stats['miss'], stats['proofs']), flush=True)
    with open(os.path.join(d, 'stats.jsonl'), 'a', encoding='utf-8') as f:
        f.write(json.dumps(dict(stats, workers=workers, at=time.strftime('%Y-%m-%d %H:%M'))) + '\n')
    return stats


def bench(workers=12, n=24):
    """Turns a second: one core cold, one core warm, all cores warm."""
    out = {}
    for label, ws, fresh in (('one core, cold cache', 1, True), ('one core, warm cache', 1, False), ('%d workers, warm cache' % workers, workers, False)):
        name = 'bench_%d_%s' % (ws, 'cold' if fresh else 'warm')
        fp = os.path.join(OUT, name, 'rows.jsonl')
        if os.path.exists(fp):
            os.remove(fp)
        cold = os.path.join(OUT, 'cache', 'base_cold.pkl')
        if os.path.exists(cold):
            os.remove(cold)
        jobs = [{'id': 'b%d_%s' % (i, pl), 'mods': [], 'params': {'_cold': True} if fresh else {},
                 'length': 'doctorate' if i % 3 == 0 else 'bachelor', 'rack': list(SC.START_SIX), 'player': pl, 'seeds': [1000 + i]}
                for i in range(n * (ws if ws > 1 else 1)) for pl in ('novice', 'greedy', 'median')]
        st = run(name, jobs, workers=ws, waves=(1.0,), quiet=True)
        out[label] = {'turns': st['turns'], 'wall_s': round(st['wall'], 1), 'turns_per_s': round(st['turns'] / st['wall'], 1),
                      'turns_per_core_s': round(st['turns'] / st['core_secs'], 1)}
        print(label, out[label], flush=True)
    return out


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('experiment')
    ap.add_argument('--workers', type=int, default=int(os.environ.get('SWEEP_WORKERS', '8')))
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--fresh', action='store_true')
    ap.add_argument('--arg', default='')
    a = ap.parse_args()
    if a.experiment == 'bench':
        bench(a.workers)
        sys.exit(0)
    import sweep_exps
    if a.experiment == 'list':
        for k, fn in sorted(sweep_exps.EXPERIMENTS.items()):
            print('%-14s %s' % (k, (fn.__doc__ or '').strip().split('\n')[0]))
        sys.exit(0)
    fn = sweep_exps.EXPERIMENTS[a.experiment]
    jobs = fn(a.arg) if a.arg else fn()
    if a.limit:
        jobs = jobs[:a.limit]
    if a.fresh:
        fp = os.path.join(OUT, a.experiment, 'rows.jsonl')
        if os.path.exists(fp):
            os.remove(fp)
    st = run(a.experiment, jobs, a.workers)
    print(json.dumps(st))
