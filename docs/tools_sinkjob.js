// measuring the coin sink (RULE.sink): jobs that run by themselves in a tab and keep their rows in window.__sk
(function () {
  const P = AA.rxPath, J = window.__sk = window.__sk || {};
  window.sinkJob = (tag, pl, from, to, opts, price) => {
    const o = J[tag] = { done: 0, rows: {}, err: null, fin: false };
    (async () => { for (let sd = from; sd <= to;) { const t0 = performance.now(); while (sd <= to && performance.now() - t0 < 3000) { P.SINK.price = price || [1, 2, 3]; const r = runSim(pl, sd, opts); o.rows[sd] = r.rounds.map(q => [q.round, Math.round(q.total), q.number, q.pass, q.coins, q.bought || 0, q.live, q.dryPg || 0, q.pgN || 0, q.redrew || 0]); o.beaten = (o.beaten || 0) + r.beaten; sd++; o.done++; } await fetch('http://127.0.0.1:8767/?i=999999', { method: 'POST', body: 'x' }); } o.fin = true; })().catch(e => { o.err = String(e && e.stack || e); });
    return 'started ' + tag;
  };
  window.sinkStat = () => Object.keys(J).map(k => k + ':' + J[k].done + (J[k].fin ? ' fin' : '') + (J[k].err ? ' ERR ' + J[k].err : '')).join('  ');
  window.sinkDump = tag => JSON.stringify(J[tag]);
})();
