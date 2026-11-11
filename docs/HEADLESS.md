# Headless jobs: rules, tests and simulated runs without the browser pane

Several builders can run the rules, the screen and the rig at the same time, each in its own headless Edge, with no shared browser pane. The tool lives in `.claude/headless/` (not in git; copy the folder into a worktree's `.claude/` if you work in one, or point at the main one, see below).

## Run a job

```
cd /c/Work/atlas-atoms/.claude/headless
./hl.sh selftest.js st1 60
./hl.sh screen.js sc1 60 "" 'smiles=CC(=O)CCCC(O)CCC(=O)C'
./hl.sh sim1.js s1 120 "" player=median seed=7
./hl.sh simN.js a 600 "" player=median from=1 n=25
```

`hl.sh <job.js> <name> [timeout seconds] [repo root url] [key=value ...]`

- `<job.js>` is a file in `.claude/headless/jobs/`.
- `<name>` names the result: the JSON is saved as `.claude/headless/out/<name>.json` and printed. Use a name nobody else is using (it is also the profile folder name); a second run with the same name deletes the first result.
- timeout defaults to 120 seconds. On a timeout it prints `{"ok":false,"error":"hl.sh timeout ..."}` with the last heartbeat and exits 1.
- repo root url defaults to `http://localhost:8766`. `""` keeps the default when you need to give key=value arguments.
- Each `key=value` becomes a query parameter and arrives in the job as `q.key` (a string).
- The wall time is printed on stderr: `[hl.sh <name> wall 7s]`.

What `hl.sh` does: starts the results server (`ressrv.py`, port 8770, or `HL_PORT`) if it is not answering; makes a fresh profile folder `.claude/headless/prof/<name>`; starts `msedge.exe --headless=new` on `run.html?job=...`; waits for `out/<name>.json`; prints it; then stops only the Edge processes whose command line holds that profile folder, and deletes the folder. It never touches other Edge windows.

The result is `{"ok":true,"result":<what the job returned>,"ms":<job time>}` or `{"ok":false,"error":...,"stack":...,"ms":...}`. Any exception, a script that fails to load, an unhandled promise rejection, a job file that sets no `HL.job` all end in the error form. While a job runs, the page posts `out/<name>.hb.json` every 3 seconds (`{"t":ms,"info":...}`).

## What the page loads

`run.html` + `run.js` load, in order: `data.js`, `chem.js`, `model.js`, `spectra.js`, `rules.js`, `run.js`, `path.js` and `/.claude/sim.js` (the rig: `runSim`, `simChunk`, `simPart`, `SIM`). Not loaded: Three.js, `render3d.js`, `sfx.js`, `art.js`, `fx.js`, `kitart.js`, `pen.js`, `scheme.js`, `rechelp.js`, `simhelp.js`, `simdiag.js`, `feeds_try.js`, `casc.js`. Nothing is stubbed: `spectra.js` is needed (`rules.js` calls `describeGraph`; the first test failed for want of it) and nothing else needed a fake. A job that uses `scrTable`, `cascBox`, `homRound` or other helpers from the recording page must load them: add the script to the list in `run.js` (these may need Three.js or the page, untested).

If you add a script to the game's load order that `rules.js`, `run.js` or `path.js` needs at load time, add it to `LIST` in `run.js`.

## Write a job

A job file sets `HL.job` to a function (sync or async). It gets the query as `q` and returns anything that is JSON.

```js
HL.job = async function (q) {
  const r = AA.rxPath.screen(q.smiles);
  HL.hb({ step: 'screened' });          // optional: shows in the heartbeat file
  return r;
};
```

- Yield to the event loop now and then in a long job (`await new Promise(r => setTimeout(r, 0))`). The heartbeat needs it: a long synchronous run posts no heartbeat until it ends.
- Keep the result small. `sim1.js` returns the whole run (about 100 kB); `simN.js` returns the scalar fields of each run only.
- A result that is not JSON-able comes back as an error.

Jobs here: `selftest.js`, `screen.js` (`smiles`, optional `pool`, `kinds` as JSON), `sim1.js` (`player`, `seed`, optional `opts` as JSON), `simN.js` (`player`, `from`, `n`, optional `opts`; `leak=1` turns the state reset off), `leak.js` (which state does a run leave behind).

## Point it at a worktree

A builder in a git worktree serves its own tree with a static server on another port and gives that as the fourth argument:

```
python -m http.server 8801 --directory C:/Work/wt1        # in its own terminal
/c/Work/atlas-atoms/.claude/headless/hl.sh sim1.js mine 120 http://localhost:8801 player=median seed=7
```

The pages `run.html`, `run.js` and the job come from the same server as the game files, so the worktree must hold its own `.claude/headless/` (jobs, `run.html`, `run.js`) and `.claude/sim.js`: copy the folder in (`.claude` is not in git). Only `hl.sh` and the results server are used from wherever you start them. Use a different `HL_PORT` per builder if you want separate result servers; the shared one on 8770 is fine because names keep results apart.

## Many at once

Give each its own name and run them in the background:

```
for k in 0 1 2 3; do ./hl.sh simN.js q$k 600 "" player=median from=$((k*25+1)) n=25 >/dev/null 2>&1 & done; wait
```

Then read `out/q0.json` to `out/q3.json`. Each tab is its own process, so one job needs one core.

## Limits found

Measured 2026-11-11 on this machine, median player, seeds 1 to 100, `simN.js`:

| Run | Wall time |
| --- | --- |
| One job of 100 runs | 600 s (5.96 s a run) |
| Four jobs of 25 runs side by side | 170 s (5.75 s a run) |

So headless tabs run at full speed and in parallel: four at once took 28% of the time of one (3.5 times faster), and a run takes as long in a crowded machine as alone. The 170 s includes about 1 s of start-up and the slowest quarter (the quarters are not equal: 120 to 170 s). A start-up of a job is about 1 s, so a short job (a screen is 15 ms) costs a second of wall time.

Results: both measures give the median player 7.4 rounds beaten and 48 to 49 wins of nine in 100 (default `runSim`, no options). `docs/RIG.md` reports 6.1 to 6.4 rounds and 16 to 24 wins in 100 for the median player (third and fourth measures) and, for the fifth measure (tier one, three bare rounds), a different setup (`{ all: true, tier: 0, rule: { bare: true, co2: false } }` for the bare game); the numbers are not the same kind of run, and `path.js` and `rules.js` have changed since, so they were not expected to match. To compare with RIG.md, run the same options as the measure you compare with.
Same seed twice: seed 7, two pages at once, identical in every field but the time. The four-job and the single-job result agreed on 99 of 100 seeds; seed 85 differs (8 rounds, 9 rounds) and `path.js` was saved by someone else at 17:29, between the page loads of the two measures, which is the likeliest cause (not proved).

- `runSim` leaves `AA.rx.MODE.co2` switched on after some runs, so the next run in the same page starts under other rules. Seed 65 beaten alone: 6 rounds; run straight after seed 64: 0 rounds in 70 ms. `simN.js` puts `AA.rx.MODE` and `AA.rxPath.RULE` back to their start values before each run (`leak=1` turns that off). The recording page's `simChunk` and `simGo` run many in one tab and are likely hit by the same thing: not fixed here, no game file was edited. `leak.js` finds the changed state.
- A run is only repeatable while the game files stand still: `path.js` was being edited by someone else while the first test ran and the same seed gave a different number to beat (2800, then 2700). Two runs launched at once on unchanged files gave identical results for seed 7.
- `--dump-dom` prints nothing on this machine, so the result goes back by POST to `127.0.0.1:8770`. If that port is held by something else, set `HL_PORT`.
- The browser caches scripts: a job file is loaded with a time stamp, the game scripts are not. A fresh profile per run means nothing is cached across runs.
- A job that never ends (a loop) is stopped by the timeout, not before; Edge is then stopped by `hl.sh`.
- Do not pipe `hl.sh` into `head`: when the pipe closes the script is killed before it stops its Edge. Redirect to a file instead. If it happens, `powershell -File .claude/headless/killprof.ps1 <name>` stops that run's Edge.
- Windows only (Git Bash, PowerShell for the process kill). `killprof.ps1` does the kill.
