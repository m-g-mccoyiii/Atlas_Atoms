// specrate.js: what each spec is worth in the game. For a round number, n rounds are dealt as a run deals them (runNew, runBriefs,
// runChoose); every spec of the table that is good for the round is then played on that same molecule by each simulated player aiming at
// it (specLine, the lines it looks at: novice 4, greedy 12, median all). The spec is given an N nobody reaches, so the player pushes the
// value as far as it can; the value the round ended with is recorded. The clear rate at any N is the share of rounds with value >= N.
// Params: round=1 n=200 from=30001 tier=1|3 players=novice,greedy,median specs=a,b (default: all good for the round) rule={...}
// Result: { round, tier, specs: { name: { player: [count of rounds ending with value 0, 1, 2, ...] } }, n }
HL.job = async function (q) {
  ["rule", "opts"].forEach(function (k) { if (q[k + "64"]) q[k] = atob(q[k + "64"]); });   // JSON arguments come base64-coded (quotes do not survive the shells)
  const P = AA.rxPath, r = +(q.round || 1), n = +(q.n || 200), from = +(q.from || 30001), tier = +(q.tier || 3), players = (q.players || 'novice,greedy,median').split(',');
  const LOOK = { novice: 4, greedy: 12, median: null, planner: null }, rule = q.rule ? JSON.parse(q.rule) : {};
  Object.assign(P.RULE, rule); const T = P.SPEC_TABLE;
  const names = q.specs ? q.specs.split(',') : Object.keys(T).filter(k => !T[k].rider && T[k].good.includes(r));
  const out = { round: r, tier, n, specs: {}, err: 0, skipped: {} }; names.forEach(k => { out.specs[k] = {}; players.forEach(p => { out.specs[k][p] = []; }); });
  const mk = (name, N) => ({ name, n: N, mark: T[name].mark, text: '', plan: T[name].plan, family: T[name].fam });
  for (let i = 0; i < n; i++) {
    P.RULE.spec = false; P.seed(from + i * 17 + r * 100003); const rnd = P.rand, run = P.runNew(0, [], { tierNo: tier }); run.noGear = true; run.round = r;
    const briefs = P.runBriefs(run, rnd), b = briefs[Math.floor(rnd() * briefs.length)]; P.runChoose(run, b); P.RULE.spec = true;
    const carried = (run.rack || []).concat(run.self || []);
    for (const name of names) {
      if (P.specNeed && !P.specNeed(T[name], carried)) { out.skipped[name] = (out.skipped[name] || 0) + 1; continue; }
      for (const pl of players) {
        try {
          P.seed(from + i * 17 + r * 100003 + 7); const R = P.rand, r2 = Object.assign({}, run, { manual: false, spec: { parts: [mk(name, 999)], text: '' } });
          const g = P.synBegin(AA.rx.cloneModel(run.feed), false, R, r2.gear || [], r2);
          while (!g.over) { const line = P.specLine(g, R, LOOK[pl]); line.forEach(id => P.queueAdd(g, id === '#finish' ? P.SYN.finish : id)); while (g.queue.length && !g.over) P.queueStep(g); g.queue = []; if (g.over) break; if (g.page >= P.pagesOf(g)) { P.synEnd(g); break; } P.turn(g, R); }
          const v = Math.max(0, Math.floor(P.specParts(g, false)[0].value || 0)), a = out.specs[name][pl]; while (a.length <= v) a.push(0); a[v]++;
        } catch (e) { out.err++; out.lastErr = String(e && e.stack || e).slice(0, 300); }
      }
    }
    if (i % 3 === 2) { HL.hb({ r, i }); await new Promise(res => setTimeout(res, 0)); }
  }
  return out;
};
