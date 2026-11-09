// Headless bot for tuning quotas. It plays the bottle that raises the score most right now.
// Reward policy 'random' takes any offer; 'build' takes equipment when offered, otherwise the bottle it holds most of.
(function (root) {
'use strict';
const AA = root.AA, RX = AA.rx, RUN = AA.rxRun;

function choose(run, opts, policy) {
  if (policy !== 'build') return RUN.pick(run.r, opts);
  const gear = opts.find(o => o.kind === 'gear');
  if (gear) return gear;
  const count = id => run.deck.filter(d => d === id).length + 2 * (RUN.gradeOf(run, id) - 1);
  return opts.slice().sort((a, b) => count(b.id) - count(a.id))[0];
}
// feed: 'standard', 'large', or 'fit' (the large order when the rack's bottles react at two more sites than it has groups)
function bot(runs, seed, policy, noFail, feed, ropts) {
  const totals = Array.from({ length: RUN.ORDERS }, () => []), reached = new Array(RUN.ORDERS + 1).fill(0);
  let bonusHits = 0, orders = 0, doubles = 0, larges = 0;
  for (let i = 0; i < runs; i++) {
    const run = RUN.newRun((seed || 1) + i * 7919, ropts);
    RUN.beginOrder(run);
    for (;;) {
      const fit = RUN.coverage(run, run.offers[1].feed).reduce((t, c) => t + c.n, 0) >= run.offers[1].groups + 2;
      RUN.chooseFeed(run, feed === 'large' || (feed === 'fit' && fit) ? 1 : 0);
      const cur = run.cur, m = RX.fromSmiles(cur.feed);
      while (cur.step < cur.stepsMax) {
        let best = -1, bs = RUN.scoreOf(cur);
        cur.hand.forEach((c, k) => { const n = RX.CARDS[c.id].find(m).length; if (!n) return; const s = RUN.preview(run, c.id, n); if (s > bs) { bs = s; best = k; } });
        if (best < 0) { if (RUN.redraw(run)) continue; break; }
        const id = cur.hand[best].id, hits = RX.runCard(m, RX.CARDS[id]);
        for (let h = 0; h < hits; h++) RUN.scoreSite(run, id, false);
        RUN.commit(run, best, hits);
      }
      const res = RUN.endOrder(run, RX.probe(m));
      totals[cur.n].push(res.total / (cur.large ? RUN.LARGE : 1)); if (cur.large) larges++; orders++; if (res.hit) bonusHits++; if (res.total >= cur.quota * 2) doubles++;
      if (noFail) run.over = cur.n === RUN.ORDERS - 1;
      if (run.over) { reached[res.pass || noFail ? cur.n + 1 : cur.n]++; break; }
      const opts = RUN.rewards(run);
      for (let p = 0; p < res.picks && opts.length; p++) { const o = choose(run, opts, policy); RUN.take(run, o); opts.splice(opts.indexOf(o), 1); }
      // the supply room: equipment first, then a purification, then a bottle it already holds
      if (policy === 'build') { const shop = RUN.stock(run); ['gear', 'grade', 'bottle'].forEach(kind => shop.items.forEach((it, k) => { if (it.kind === kind && (kind !== 'bottle' || run.deck.includes(it.id))) RUN.buy(run, k); })); RUN.closeShop(run); }
      RUN.nextOrder(run);
    }
  }
  const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };
  return { runs, policy: policy || 'random', filled: reached, bonusRate: orders ? bonusHits / orders : 0, doubleRate: orders ? doubles / orders : 0, largeRate: orders ? larges / orders : 0,
    perOrder: totals.map((a, n) => ({ order: n + 1, n: a.length, quota: RUN.QUOTA[n], p10: q(a, 0.1), p25: q(a, 0.25), p50: q(a, 0.5), p75: q(a, 0.75), p90: q(a, 0.9), max: q(a, 1) })) };
}
RUN.bot = bot;
})(typeof globalThis !== 'undefined' ? globalThis : window);
