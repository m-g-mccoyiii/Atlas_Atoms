// cell.js: n runs of one player; returns clear counts by round, runs won, and the specs met/offered. player= from= n= opts={runSim opts} 
HL.job = async function (q) {
  ["rule", "opts"].forEach(function (k) { if (q[k + "64"]) q[k] = atob(q[k + "64"]); });   // JSON arguments come base64-coded (quotes do not survive the shells)
  var player = q.player || 'median', from = +(q.from || 1001), n = +(q.n || 50), opts = q.opts ? JSON.parse(q.opts) : {}, clear = [], seen = [], wins = 0, specs = {}, ms = 0, ylog = [], steps = 0, pages = 0, beaten = 0;
  for (var i = 0; i < n; i++) {
    var t = performance.now(), r = runSim(player, from + i, JSON.parse(JSON.stringify(opts))); ms += performance.now() - t; if (r.won) wins++; beaten += r.beaten;
    r.rounds.forEach(function (x) { var k = x.round - 1; seen[k] = (seen[k] || 0) + 1; if (x.pass) clear[k] = (clear[k] || 0) + 1; else clear[k] = clear[k] || 0; var s = specs[x.spec + ':' + x.specN] || (specs[x.spec + ':' + x.specN] = [0, 0]); s[0]++; if (x.pass) s[1]++; ylog[k] = (ylog[k] || 0) + Math.log(Math.max(1, x.total)); steps += x.steps || 0; pages += x.pgN || 0; });
    HL.hb({ done: i + 1, of: n }); await new Promise(function (res) { setTimeout(res, 0); });
  }
  return { player: player, from: from, n: n, wins: wins, beaten: beaten, clear: clear, seen: seen, specs: specs, ylog: ylog, steps: steps, pages: pages, msPerRun: Math.round(ms / n) };
};
