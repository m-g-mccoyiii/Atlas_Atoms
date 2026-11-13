// m3_molf.js: every molecule of molecules v2 by itself, for the molecule factors (MOLF in path.js; baked by docs/tools_molf2.py).
// For each molecule and each round it is dealt in: n bare rounds (the six starting reagents, no instruments, no homunculus,
// a plain round, the round's spec picked as the game picks it) by the rig's greedy player (aiming at the spec, 12 lines looked at).
// set=pool|bank  part=k parts=K (molecule index mod K)  n=12  base=70000
// -> { rows: [[smiles, round, bank 0/1, par, [totals...]]], ms }
HL.job = async function (q) {
  var P = AA.rxPath, RX = AA.rx, n = +(q.n || 12), K = +(q.parts || 1), k = +(q.part || 0), set = q.set || 'pool', base = +(q.base || 70000);
  var m0 = JSON.stringify(RX.MODE), r0 = JSON.stringify(P.RULE), rows = [], t0 = performance.now();
  var list = P.FEEDS.map(function (s, i) { return [s, i]; }).filter(function (x) { return (set === 'bank') === !!P.FEED_BANK[x[0]]; }).filter(function (x, j) { return j % K === k; });
  var pol0 = SIM.PLAYERS.greedy;
  function one(smi, round, seed) {
    var mm = JSON.parse(m0), rr = JSON.parse(r0); Object.keys(mm).forEach(function (x) { RX.MODE[x] = mm[x]; }); Object.keys(P.RULE).forEach(function (x) { if (!(x in rr)) delete P.RULE[x]; }); Object.keys(rr).forEach(function (x) { P.RULE[x] = rr[x]; });
    P.RULE.bare = true; P.RULE.co2 = false; P.modeSync(null);
    var pol = pol0; if (P.RULE.spec && P.specLine) pol = Object.assign({}, pol0, { line: function (g2, fin, r2) { return P.specLine(g2, r2, 12); } });
    P.seed(seed); P.MODEL.relaxed = false; var rnd = P.rand, run = P.runNew(0, []); run.assay = []; run.round = round;
    var o = { brief: 'plain', pays: null, assay: false, model: P.salt(P.modelOf(smi), rnd), kin: P.kinOf(smi), src: smi, quota: P.runQuota(run, smi, 'plain'), coins: 0 };
    if (P.RULE.spec) o.spec = P.specPick(o.model, round, run.rack.concat(run.self), rnd, run.tierNo || 3, [], Object.assign({}, run, { brief: 'plain' }));
    P.runChoose(run, o); run.assayNow = false;
    var g = P.synBegin(run.feed, false, rnd, run.gear, run), t = SIM.playRound(g, run, pol, rnd, null);
    P.seed(); P.MODEL.relaxed = true; return t;
  }
  for (var i = 0; i < list.length; i++) {
    var smi = list[i][0], rs = P.FEED_ROUNDS[smi] || [];
    for (var j = 0; j < rs.length; j++) { var tot = []; for (var s = 0; s < n; s++) { try { tot.push(one(smi, rs[j], base + list[i][1] * 100 + rs[j] * 1000003 % 9973 + s)); } catch (e) { tot.push(-1); } }
      rows.push([smi, rs[j], P.FEED_BANK[smi] ? 1 : 0, P.parOf(rs[j]), tot]); }
    HL.hb({ done: i + 1, of: list.length }); await new Promise(function (res) { setTimeout(res, 0); });
  }
  return { set: set, part: k, parts: K, n: n, molf: Object.keys(P.MOLF).length, rows: rows, ms: Math.round(performance.now() - t0) };
};
