// m3_runs.js: n runs for a player from a seed, one short row a round, for the check of the molecule factors (docs/tools_molf2.py).
// player=greedy from=9001 n=38 opts={"all":true,"tier":0,"rule":{"bare":true,"co2":false}}
// -> { molf: keys in P.MOLF, rows: [[seed, round, molecule, kind of round, total, par, mult, number to beat, spec met 0/1]] }
HL.job = async function (q) {
  var P = AA.rxPath, player = q.player || 'greedy', from = +(q.from || 1), n = +(q.n || 25), opts = q.opts ? JSON.parse(q.opts) : {}, rows = [], t0 = performance.now();
  var m0 = JSON.stringify(AA.rx.MODE), r0 = JSON.stringify(P.RULE);
  for (var i = 0; i < n; i++) {
    var mm = JSON.parse(m0), rr = JSON.parse(r0); Object.keys(mm).forEach(function (k) { AA.rx.MODE[k] = mm[k]; }); Object.keys(rr).forEach(function (k) { P.RULE[k] = rr[k]; });
    var r = runSim(player, from + i, JSON.parse(JSON.stringify(opts)));
    r.rounds.forEach(function (w) { rows.push([w.seed, w.round, w.mol, w.kind, w.total, w.par, +(+w.mult).toFixed(4), w.number, w.pass]); });
    HL.hb({ done: i + 1, of: n }); await new Promise(function (res) { setTimeout(res, 0); });
  }
  return { player: player, from: from, n: n, molf: Object.keys(P.MOLF).length, rows: rows, ms: Math.round(performance.now() - t0) };
};
