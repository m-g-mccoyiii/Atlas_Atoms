// Rules of a round played by choosing the product. Nothing here draws.
// An order offers some of the rack's reagents. Each bottle is one use and an order allows DIAL.steps reactions.
// A reagent reacts at every matching site. One group on the molecule is marked, and a batch delivered with it
// intact is multiplied. Equipment acts on the shared words of the game: site, step, chain link, loop, leaving group,
// first use, steps unused, marked group. No piece names a reagent, so any two pieces can work together.
// The main game does not load this file, so the dials set here do not change it.
(function (root) {
'use strict';
const AA = root.AA, RX = AA.rx, RUN = AA.rxRun;
const FEEDS = ['C=CCC(O)CC=C', 'CC(O)CCC=C', 'CC(=O)CCC(O)CC=C', 'C=CCC(O)CC(O)CC=C', 'C=CCC(=O)CCC(=O)CC=C', 'CC(O)CC(=O)CCC(Cl)CCC=C'];
// keep: batch multiplier at delivery when the marked group is intact. steps: reactions allowed in one order.
const DIAL = { keep: 3, steps: 3 };
RUN.TUNE.chain = 0.1; RUN.TUNE.route = 0.25; RUN.TUNE.siteBatch = 0;
// reagents whose reaction makes a group leave the molecule
const LEAVES = { pcc: 1, dehydrate: 1, socl2: 1, koh: 1, naoh: 1 };

// Equipment. site(c) fires for every site that reacts, step(c) once for every reaction, end(c) at delivery.
// Each returns [kind, value] or null: y adds yield, b adds batch, x multiplies batch. note is what is pencilled under it.
// c: hits, cont (the step continued a chain), len (links in the chain so far), loop (the product is a molecule the
// order has held before), leaves, first (first use of this reagent on the order), unused (steps not taken), kept, lost.
const GEAR = [
  { id: 'balance', note: 'site +15', name: 'balance', shape: 'box', site: () => ['y', 15] },
  { id: 'stirrer', note: 'step +2', name: 'stir plate', shape: 'box', step: () => ['b', 2] },
  { id: 'cannula', note: 'link +4', name: 'cannula', shape: 'column', step: c => (c.cont ? ['b', 4 * (c.len - 1)] : null) },
  { id: 'reflux', note: '3 links times 2', name: 'reflux condenser', shape: 'column', step: c => (c.cont && c.len >= 3 ? ['x', 2] : null) },
  { id: 'schlenk', note: '2 sites times 1.25', name: 'schlenk line', shape: 'flask', step: c => (c.hits >= 2 ? ['x', 1 + 0.25 * (c.hits - 1)] : null) },
  { id: 'cards', note: 'new reagent +3', name: 'index cards', shape: 'box', step: c => (c.first ? ['b', 3] : null) },
  { id: 'crystal', note: 'loop times 1.75', name: 'seed crystal', shape: 'round', step: c => (c.loop ? ['x', 1.75] : null) },
  { id: 'coldtrap', note: 'group leaves +4', name: 'cold trap', shape: 'funnel', step: c => (c.leaves ? ['b', 4] : null) },
  { id: 'rotovap', note: 'spare step times 1.75', name: 'rotary evaporator', shape: 'round', end: c => (c.unused ? ['x', 1 + 0.75 * c.unused] : null) },
  { id: 'hood', note: 'mark lost times 2.5', name: 'fume hood', shape: 'funnel', end: c => (c.lost ? ['x', 2.5] : null) },
  { id: 'glovebox', note: 'mark kept times 1.75', name: 'glove box', shape: 'flask', end: c => (c.kept ? ['x', 1.75] : null) }
];
const GEARS = {}; GEAR.forEach(q => { GEARS[q.id] = q; });

// offer: the reagents on the page for this order; the rest of the rack sits the order out
// keep: index of the oxygen that is marked, or null. gear: equipment ids, left to right
function begin(feed, relaxed, offer, keep, gear) {
  const run = RUN.newRun(7, {}); run.gear = [];
  RUN.beginOrder(run); RUN.chooseFeed(run, 0);
  const cur = run.cur, m = relaxed ? AA.Model.fromSmilesRelaxed(feed, 4) : RX.fromSmiles(feed), left = {};
  m.center();
  if (keep != null && m.atoms[keep] && m.atoms[keep].el === 'O') m.atoms[keep].keep = true;
  cur.feed = feed; cur.feedSig = RX.sigOf(m); cur.seen = new Set([cur.feedSig]); cur.spec = null; cur.keep = null; cur.cond = null; cur.stepsMax = 99;
  cur.yield = 0; cur.batch = 1; cur.path = []; cur.fresh = new Set();
  run.deck.forEach(id => { left[id] = (left[id] || 0) + 1; });
  return { run, cur, m, left, all: Object.keys(left), kinds: offer || Object.keys(left), keep: keep == null ? null : keep, gear: (gear || []).filter(id => GEARS[id]), spoiled: false, trail: [], dead: false };
}
// runs one reagent on a copy of the molecule
function tryOne(g, m, id) {
  const cur = g.cur, cm = RX.cloneMap(m), keep = cur.fresh, fresh = new Set();
  keep.forEach(a => { const c = cm.map.get(a); if (c) fresh.add(c); });
  cur.fresh = fresh;
  const r = RUN.react(g.run, cm.model, id);
  cur.fresh = keep;
  return { model: cm.model, r };
}
function options(g) {
  const cur = g.cur, out = {};
  if ((g.syn ? g.pageSteps : g.trail.length) >= DIAL.steps) return out;
  g.kinds.forEach(id => {
    if (!g.left[id]) return;
    const sites = RX.CARDS[id].find(g.m); if (!sites.length) return;
    const t = tryOne(g, g.m, id), r = t.r; if (!r.hits && !r.spoiled) return;
    const loop = cur.seen.has(r.sig), spoil = r.spoiled > 0;
    out[id] = { id, model: t.model, r, loop, spoil, cont: r.hits > 0 && r.hot && cur.path.length > 0 && !loop, atoms: sites.reduce((a, s) => a.concat(s.atoms), []) };
  });
  return out;
}
// scores one reaction: each site, then the chain, then the equipment that works once a step. Every change is
// returned as an event so the page can replay it. The caller updates what the order has seen and used afterwards.
function scoreStep(g, id, r, dry) {
  const cur = g.cur, ev = [], loop = cur.seen.has(r.sig), first = !cur.used.includes(id);
  const put = (src, o) => { if (!o) return; if (o[0] === 'y') cur.yield += o[1]; else if (o[0] === 'b') cur.batch += o[1]; else cur.batch *= o[1]; ev.push({ src, kind: o[0], val: o[1], yield: cur.yield, batch: cur.batch }); };
  for (let i = 0; i < r.hits; i++) {
    RUN.scoreSite(g.run, id, dry).forEach(e => ev.push(e));
    g.gear.forEach(q => { if (GEARS[q].site) put(q, GEARS[q].site({ hits: r.hits })); });
  }
  if (!r.hits) return ev;
  put('step', ['b', 1]);
  const link = RUN.playEnd(g.run, id, r.hits, dry, r); link.forEach(e => ev.push(e));
  const cont = link.some(e => e.src === 'chain'), c = { hits: r.hits, cont, len: cur.path.length, loop, leaves: !!LEAVES[id], first };
  g.gear.forEach(q => { if (GEARS[q].step) put(q, GEARS[q].step(c)); });
  return ev;
}
// what delivery adds: equipment that works at the end, then the marked group
function scoreEnd(g, steps, spoiled) {
  const cur = g.cur, ev = [], has = g.keep != null, c = { unused: Math.max(0, DIAL.steps - steps), kept: has && !spoiled, lost: has && spoiled };
  const put = (src, o) => { if (!o) return; if (o[0] === 'b') cur.batch += o[1]; else cur.batch *= o[1]; ev.push({ src, kind: o[0], val: o[1], yield: cur.yield, batch: cur.batch }); };
  if (!steps) return ev;
  g.gear.forEach(q => { if (GEARS[q].end) put(q, GEARS[q].end(c)); });
  if (c.kept) put('keep', ['x', DIAL.keep]);
  return ev;
}
function take(g, o) {
  const cur = g.cur;
  g.left[o.id]--; g.m = o.model;
  if (o.spoil) g.spoiled = true;
  const ev = scoreStep(g, o.id, o.r, false);
  cur.fresh = new Set(o.r.made); cur.seen.add(o.r.sig); cur.step++; cur.used.push(o.id);
  g.trail.push({ id: o.id, hits: o.r.hits, cont: o.cont, ev, spoil: o.spoil });
}
const deliver = g => scoreEnd(g, g.trail.length, g.spoiled);
// every path through the order, each scored as if delivered there
function survey(feed, depth, offer, keep, gear) {
  const g = begin(feed, false, offer, keep, gear), cur = g.cur, res = []; let nodes = 0;
  (function dfs(m, path, spoiled) {
    const y = cur.yield, b = cur.batch; scoreEnd(g, path.length, spoiled);
    res.push({ path: path.join(' '), spoiled, score: RUN.scoreOf(cur) }); cur.yield = y; cur.batch = b;
    if (path.length >= (depth || DIAL.steps) || nodes > 30000) return;
    g.kinds.forEach(id => {
      if (!g.left[id] || !RX.CARDS[id].find(m).length) return;
      const s = { y: cur.yield, b: cur.batch, path: cur.path, fresh: cur.fresh, seen: cur.seen, step: cur.step, used: cur.used.length };
      const t = tryOne(g, m, id), r = t.r;
      if (r.hits || r.spoiled) {
        nodes++;
        scoreStep(g, id, r, true);
        cur.fresh = new Set(r.made); cur.seen = new Set(s.seen).add(r.sig); cur.step++; cur.used.push(id); g.left[id]--; path.push(id);
        dfs(t.model, path, spoiled || r.spoiled > 0);
        path.pop(); g.left[id]++;
      }
      cur.yield = s.y; cur.batch = s.b; cur.path = s.path; cur.fresh = s.fresh; cur.seen = s.seen; cur.step = s.step; cur.used.length = s.used;
    });
  })(g.m, [], false);
  res.sort((a, b) => b.score - a.score);
  const best = res[0].score, near = res.filter(r => r.score >= best * 0.9), firsts = {}, alt = res.find(r => r.spoiled !== res[0].spoiled);
  res.forEach(r => { const f = r.path.split(' ')[0]; if (f && !(firsts[f] >= r.score)) firsts[f] = r.score; });
  return { feed, paths: res.length, best, bestPath: res[0].path, bestSpoils: res[0].spoiled, otherPct: alt && best ? Math.round(100 * alt.score / best) : 0, near: near.length, nearFirsts: Array.from(new Set(near.map(r => r.path.split(' ')[0]))),
    firsts: Object.keys(firsts).map(f => ({ id: f, pct: best ? Math.round(100 * firsts[f] / best) : 0 })).sort((a, b) => b.pct - a.pct) };
}
// the oxygens of a feedstock that an order can mark
const keeps = feed => RX.keepable(RX.fromSmiles(feed)).map(k => k.i);
// the reagents that can open on this feedstock without losing the marked group
function safe(feed, keep) { const g = begin(feed, false, null, keep); return g.all.filter(id => { if (!RX.CARDS[id].find(g.m).length) return false; const r = tryOne(g, g.m, id).r; return r.hits && !r.spoiled; }); }
// a random order: a marked group and n reagents, at least two of which can open safely
function deal(feed, n, rnd) {
  const R = rnd || Math.random, ks = keeps(feed), g = begin(feed, false);
  for (let t = 0; t < 60; t++) {
    const keep = ks.length ? ks[Math.floor(R() * ks.length)] : null, ok = safe(feed, keep), pool = g.all.slice(), out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
    if (out.filter(id => ok.includes(id)).length >= 2) return { offer: g.all.filter(id => out.includes(id)), keep };
  }
  return { offer: g.all, keep: null };
}
// n different pieces of equipment at random
function kit(n, rnd) { const R = rnd || Math.random, pool = GEAR.map(q => q.id), out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); return out; }

// ---------- a synthesis: one molecule carried through several pages ----------
// The product of a page is the starting molecule of the next. Everything scored and not yet stamped is the pile.
// The pile rides on the chain: a step that does not continue the chain loses it. Stamping banks the pile and ends
// the chain. Turning the page with a pile carries both into a new offer, and the stamp stays shut until the chain
// has been continued once on the new page. If nothing on the new page continues the chain, the pile is lost.
// The finishing reagent closes groups for good, so it is offered only on the last page and ends the synthesis.
const SYN = { pages: 3, offer: 5, uses: 2, finish: 'h2', finishMult: 0.5 };
const synRack = () => RX.LIST.map(c => c.id).filter(id => id !== SYN.finish);
const held = g => Math.round(g.cur.yield * g.cur.batch);
function synDeal(g, rnd) {
  const R = rnd || Math.random, rack = synRack(), live = rack.filter(id => RX.CARDS[id].find(g.m).length); let offer = [];
  for (let t = 0; t < 40; t++) {
    const pool = rack.slice(); offer = [];
    while (offer.length < SYN.offer && pool.length) offer.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
    if (offer.filter(id => live.includes(id)).length >= Math.min(2, live.length)) break;
  }
  g.kinds = rack.filter(id => offer.includes(id)); g.left = {}; g.kinds.forEach(id => { g.left[id] = SYN.uses; }); g.pageSteps = 0;
}
function synBegin(feed, relaxed, rnd) {
  const g = begin(feed, relaxed, [], null, []);
  g.syn = true; g.page = 1; g.total = 0; g.locked = false; g.lost = 0; g.over = false; g.pageSteps = 0;
  synDeal(g, rnd);
  return g;
}
const wipe = g => { const n = held(g); g.cur.yield = 0; g.cur.batch = 1; g.cur.path = []; g.cur.fresh = new Set(); g.locked = false; return n; };
// how many reagents of the whole rack would continue the chain from here
function outs(g) {
  if (!g.cur.path.length) return 0;
  const k = g.kinds, l = g.left, ps = g.pageSteps; g.kinds = synRack(); g.left = {}; g.kinds.forEach(id => { g.left[id] = 1; }); g.pageSteps = 0;
  const o = options(g), n = Object.keys(o).filter(id => o[id].cont).length;
  g.kinds = k; g.left = l; g.pageSteps = ps;
  return n;
}
// true when taking this option would lose the pile
const breaks = (g, o) => held(g) > 0 && g.cur.path.length > 0 && !o.cont;
function synTake(g, o) {
  let lost = 0;
  if (breaks(g, o)) { lost = wipe(g); g.lost += lost; }
  take(g, o); g.pageSteps++;
  if (o.cont) g.locked = false;
  return lost;
}
function bank(g) { if (g.locked) return 0; const n = wipe(g); g.total += n; return n; }
// turns to the next page. Returns what was lost, if the new offer cannot continue a carried chain
function turn(g, rnd) {
  if (g.page >= SYN.pages) return 0;
  g.page++; g.locked = held(g) > 0; synDeal(g, rnd);
  if (!g.locked) return 0;
  const o = options(g);
  if (Object.keys(o).some(id => o[id].cont)) return 0;
  const lost = wipe(g); g.lost += lost; return lost;
}
// the finishing reagent, on the last page only
function finishOpt(g) {
  if (g.page < SYN.pages || !RX.CARDS[SYN.finish].find(g.m).length) return null;
  const t = tryOne(g, g.m, SYN.finish), r = t.r; if (!r.hits) return null;
  return { id: SYN.finish, model: t.model, r, finish: true, loop: false, spoil: false, cont: true, atoms: RX.CARDS[SYN.finish].find(g.m).reduce((a, x) => a.concat(x.atoms), []) };
}
function synFinish(g, o) {
  g.left[SYN.finish] = 1; take(g, o);
  const m = 1 + SYN.finishMult * o.r.hits; g.cur.batch *= m;
  g.trail[g.trail.length - 1].ev.push({ src: 'finish', kind: 'x', val: m, yield: g.cur.yield, batch: g.cur.batch });
  g.locked = false; g.over = true; return bank(g);
}
function synEnd(g) { g.locked = false; g.over = true; return bank(g); }
// a plain player, used to set the quota: continues the chain when it can, carries when two or more reagents would continue
function synPlay(feed, rnd) {
  const g = synBegin(feed, false, rnd), R = rnd || Math.random;
  for (;;) {
    for (;;) {
      const o = options(g), ids = Object.keys(o); if (!ids.length) break;
      const cs = ids.filter(id => o[id].cont), safeIds = ids.filter(id => !breaks(g, o[id]));
      if (!cs.length && !safeIds.length) { if (!g.locked) bank(g); }
      const o2 = options(g), from = cs.length ? cs : Object.keys(o2);
      let best = from[0]; from.forEach(id => { if (o2[id].r.hits > o2[best].r.hits || (o2[id].r.hits === o2[best].r.hits && R() < 0.5)) best = id; });
      synTake(g, o2[best]);
    }
    if (g.page >= SYN.pages) { synEnd(g); break; }
    if (outs(g) < 2) bank(g);
    turn(g, rnd);
  }
  return g.total;
}
function synQuota(feed, n) {
  const a = []; for (let i = 0; i < (n || 40); i++) a.push(synPlay(feed)); a.sort((x, y) => x - y);
  const q = a[Math.floor(a.length * 0.25)], mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(10, q))) - 1));
  return Math.max(50, Math.round(q / mag) * mag);
}
AA.rxPath = { DIAL, FEEDS, GEAR, GEARS, OFFER: 4, begin, options, take, deliver, survey, deal, keeps, safe, kit,
  SYN, synRack, synBegin, synTake, synFinish, synEnd, synQuota, synPlay, held, outs, breaks, bank, turn, finishOpt };
})(typeof globalThis !== 'undefined' ? globalThis : window);
