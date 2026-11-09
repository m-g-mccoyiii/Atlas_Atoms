// Headless bot for tuning quotas. With depth 1 it plays the bottle that raises the score most right now.
// With depth 2 or more it tries every sequence of that many bottles from the hand it holds and plays the first
// bottle of the best one, so it finds chains and routes that a greedy player misses.
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
// best score reachable by playing up to `depth` of the bottles in ids on model m. Nothing is changed.
// the move that caps the marked group
const CAP = -2;
const val = cur => RUN.scoreOf(cur) * (cur.spoiled ? 0.5 : 1);
function plan(run, m, ids, depth) {
  const cur = run.cur, out = { score: val(cur), k: -1 };
  if (!depth || cur.step >= cur.stepsMax) return out;
  if (RUN.canCap(run, m)) {
    const s = { fresh: cur.fresh, step: cur.step }, cm = RX.cloneMap(m), fresh = new Set();
    s.fresh.forEach(a => { const c = cm.map.get(a); if (c) fresh.add(c); });
    cur.fresh = fresh; RUN.cap(run, cm.model);
    const sub = plan(run, cm.model, ids, depth - 1);
    if (sub.score > out.score) { out.score = sub.score; out.k = CAP; }
    cur.fresh = s.fresh; cur.step = s.step;
  }
  const tried = new Set();
  ids.forEach((id, k) => {
    if (tried.has(id)) return;
    tried.add(id);
    if (!RX.CARDS[id].find(m).length) return;
    const s = { y: cur.yield, b: cur.batch, path: cur.path, fresh: cur.fresh, seen: cur.seen, step: cur.step, used: cur.used.length, spoiled: cur.spoiled };
    const cm = RX.cloneMap(m), fresh = new Set();
    s.fresh.forEach(a => { const c = cm.map.get(a); if (c) fresh.add(c); });
    cur.fresh = fresh;
    const r = RUN.react(run, cm.model, id);
    if (r.hits || r.spoiled) {
      for (let i = 0; i < r.hits; i++) RUN.scoreSite(run, id, true);
      RUN.playEnd(run, id, r.hits, true, r); cur.fresh = new Set(r.made); cur.seen = new Set(s.seen).add(r.sig);
      if (r.spoiled) cur.spoiled = true;
      cur.step++; cur.used.push(id);
      const sub = plan(run, cm.model, ids.filter((x, j) => j !== k), depth - 1);
      if (sub.score > out.score) { out.score = sub.score; out.k = k; }
    }
    cur.yield = s.y; cur.batch = s.b; cur.path = s.path; cur.fresh = s.fresh; cur.seen = s.seen; cur.step = s.step; cur.used.length = s.used; cur.spoiled = s.spoiled;
  });
  return out;
}
// feed: 'standard', 'large', or 'fit' (the large order when the rack's bottles react at two more sites than it has groups)
function bot(runs, seed, policy, noFail, feed, ropts, depth) {
  const totals = Array.from({ length: RUN.ORDERS }, () => []), reached = new Array(RUN.ORDERS + 1).fill(0);
  let bonusHits = 0, orders = 0, doubles = 0, larges = 0, plays = 0, links = 0, routes = 0, longest = 0;
  for (let i = 0; i < runs; i++) {
    const run = RUN.newRun((seed || 1) + i * 7919, ropts);
    RUN.beginOrder(run);
    for (;;) {
      const fit = RUN.coverage(run, run.offers[1].feed).reduce((t, c) => t + c.n, 0) >= run.offers[1].groups + 2;
      RUN.chooseFeed(run, feed === 'large' || (feed === 'fit' && fit) ? 1 : 0);
      const cur = run.cur, m = RUN.mark(RX.fromSmiles(cur.feed), cur.keep);
      while (cur.step < cur.stepsMax) {
        const best = plan(run, m, cur.hand.map(c => c.id), depth || 1).k;
        if (best === CAP) { RUN.cap(run, m); continue; }
        if (best < 0) { if (RUN.redraw(run)) continue; break; }
        const id = cur.hand[best].id, r = RUN.react(run, m, id);
        for (let h = 0; h < r.hits; h++) RUN.scoreSite(run, id, false);
        const res = RUN.commit(run, best, r.hits, r);
        plays++; res.ev.forEach(e => { if (e.src === 'chain') { links++; longest = Math.max(longest, e.len); } else if (e.src === 'route') routes++; });
      }
      const res = RUN.endOrder(run, RX.probe(m));
      totals[cur.n].push(res.total / (cur.large ? RUN.LARGE : 1)); if (cur.large) larges++; orders++; if (res.hit) bonusHits++; if (res.total >= cur.quota * 2) doubles++;
      if (noFail) run.over = cur.n === RUN.ORDERS - 1;
      if (run.over) { reached[res.pass || noFail ? cur.n + 1 : cur.n]++; break; }
      const opts = RUN.rewards(run);
      for (let p = 0; p < res.picks && opts.length; p++) { const o = choose(run, opts, policy); RUN.take(run, o); opts.splice(opts.indexOf(o), 1); }
      // the supply room: equipment first, then a route level, then a purification, then a bottle it already holds
      if (policy === 'build') { const shop = RUN.stock(run); ['gear', 'route', 'grade', 'bottle'].forEach(kind => shop.items.forEach((it, k) => { if (it.kind === kind && (kind !== 'bottle' || run.deck.includes(it.id))) RUN.buy(run, k); })); RUN.closeShop(run); }
      RUN.nextOrder(run);
    }
  }
  const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };
  return { runs, policy: policy || 'random', depth: depth || 1, filled: reached, bonusRate: orders ? bonusHits / orders : 0, doubleRate: orders ? doubles / orders : 0, largeRate: orders ? larges / orders : 0,
    linkRate: plays ? links / plays : 0, routesPerRun: routes / runs, longest,
    perOrder: totals.map((a, n) => ({ order: n + 1, n: a.length, quota: RUN.QUOTA[n], p10: q(a, 0.1), p25: q(a, 0.25), p50: q(a, 0.5), p75: q(a, 0.75), p90: q(a, 0.9), max: q(a, 1) })) };
}
RUN.bot = bot;
})(typeof globalThis !== 'undefined' ? globalThis : window);
