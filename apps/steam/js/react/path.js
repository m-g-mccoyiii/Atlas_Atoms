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
  // paid for every place a reagent changes
  { id: 'balance', note: 'each place: +15', name: 'balance', shape: 'box', site: () => ['y', 15] },
  // paid for reactions in a row
  { id: 'cannula', note: 'each in a row: +4', name: 'cannula', shape: 'column', step: c => (c.cont ? ['b', 4 * (c.len - 1)] : null) },
  { id: 'reflux', note: '3 in a row: times 2', name: 'reflux condenser', shape: 'column', step: c => (c.cont && c.len >= 3 ? ['x', 2] : null) },
  // paid for reactions that do not follow on
  { id: 'scalepan', note: 'not in a row: +8', name: 'scale pan', shape: 'round', step: c => (!c.cont ? ['b', 8] : null) },
  // paid for how many places change at once
  { id: 'spatula', note: 'only one place: +5', name: 'spatula', shape: 'column', step: c => (c.hits === 1 ? ['b', 5] : null) },
  { id: 'schlenk', note: '2 or more places: times 1.25', name: 'schlenk line', shape: 'flask', step: c => (c.hits >= 2 ? ['x', 1 + 0.25 * (c.hits - 1)] : null) },
  { id: 'mortar', note: '3 or more places: times 2', name: 'mortar', shape: 'round', step: c => (c.hits >= 3 ? ['x', 2] : null) },
  // paid for where in the round a reaction falls
  { id: 'stirrer', note: 'each reaction: +2', name: 'stir plate', shape: 'box', step: () => ['b', 2] },
  { id: 'burette', note: 'first on a page: times 2', name: 'burette', shape: 'column', step: c => (c.pageStep === 0 ? ['x', 2] : null) },
  { id: 'stopwatch', note: 'last on a page: +6', name: 'stopwatch', shape: 'box', step: c => (c.pageStep === c.pageMax - 1 ? ['b', 6] : null) },
  { id: 'thermometer', note: 'on page 3: times 1.5', name: 'thermometer', shape: 'column', step: c => (c.page === 3 ? ['x', 1.5] : null) },
  // paid for which reagents are used
  { id: 'cards', note: 'new reagent +3', name: 'index cards', shape: 'box', step: c => (c.first ? ['b', 3] : null) },
  { id: 'logbook', note: 'each reaction: +1 for each different reagent used', name: 'log book', shape: 'box', step: c => ['b', c.distinct] },
  { id: 'bunsen', note: 'same reagent twice running: times 1.5', name: 'burner', shape: 'funnel', step: c => (c.same ? ['x', 1.5] : null) },
  { id: 'litmus', note: 'an acid: +4', name: 'litmus paper', shape: 'box', step: c => (c.cls === 'acid' ? ['b', 4] : null) },
  // paid for what the reaction does to the molecule
  { id: 'crystal', note: 'back to an old one: times 1.75', name: 'seed crystal', shape: 'round', step: c => (c.loop ? ['x', 1.75] : null) },
  { id: 'coldtrap', note: 'something leaves: +4', name: 'cold trap', shape: 'funnel', step: c => (c.leaves ? ['b', 4] : null) },
  // pieces that change a rule. They have no level.
  { id: 'clamp', rule: true, note: 'a broken run keeps half its multiplier', name: 'clamp', shape: 'column' },
  { id: 'magnet', rule: true, note: 'the multiplier never starts below 3', name: 'stir bar', shape: 'round' },
  { id: 'recycler', rule: true, note: 'going back to an old molecule still counts as in a row', name: 'recycler', shape: 'flask' },
  { id: 'carousel', rule: true, note: 'one more reagent on every page', name: 'carousel', shape: 'round' },
  { id: 'dropper', rule: true, note: 'one more use of every reagent', name: 'dropper', shape: 'funnel' },
  { id: 'loupe', rule: true, note: 'rare reagents twice as often', name: 'loupe', shape: 'flask' },
  { id: 'timer', rule: true, note: 'a fourth reaction on every page', name: 'timer', shape: 'box' },
  // pieces for the old single-page test: they work at delivery
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
// reactions allowed on a page
const stepsOf = g => DIAL.steps + (g.syn && g.gear.includes('timer') ? 1 : 0);
function options(g) {
  const cur = g.cur, out = {};
  if ((g.syn ? g.pageSteps : g.trail.length) >= stepsOf(g)) return out;
  g.kinds.forEach(id => {
    if (!g.left[id]) return;
    const sites = RX.CARDS[id].find(g.m); if (!sites.length) return;
    const t = tryOne(g, g.m, id), r = t.r; if (!r.hits && !r.spoiled) return;
    const loop = cur.seen.has(r.sig), spoil = r.spoiled > 0;
    out[id] = { id, model: t.model, r, loop, spoil, cont: r.hits > 0 && r.hot && cur.path.length > 0 && (!loop || g.gear.includes('recycler')), atoms: sites.reduce((a, s) => a.concat(s.atoms), []) };
  });
  return out;
}
// scores one reaction: each site, then the chain, then the equipment that works once a step. Every change is
// returned as an event so the page can replay it. The caller updates what the order has seen and used afterwards.
// a piece of equipment at level n: what it adds is n times as much, and what it multiplies by stands n times as far above 1
const lvl = (g, q, o) => { const n = (g.gearLv && g.gearLv[q]) || 1; return !o || n === 1 ? o : o[0] === 'x' ? ['x', 1 + (o[1] - 1) * n] : [o[0], o[1] * n]; };
function scoreStep(g, id, r, dry) {
  const cur = g.cur, ev = [], loop = cur.seen.has(r.sig), first = !cur.used.includes(id);
  const put = (src, o) => { if (!o) return; if (o[0] === 'y') cur.yield += o[1]; else if (o[0] === 'b') cur.batch += o[1]; else cur.batch *= o[1]; ev.push({ src, kind: o[0], val: o[1], yield: cur.yield, batch: cur.batch }); };
  for (let i = 0; i < r.hits; i++) {
    RUN.scoreSite(g.run, id, dry).forEach(e => ev.push(e));
    g.gear.forEach(q => { if (GEARS[q].site) put(q, lvl(g, q, GEARS[q].site({ hits: r.hits }))); });
  }
  if (!r.hits) return ev;
  put('step', ['b', 1]);
  // with the recycler a molecule seen before still continues the run
  const info = loop && g.gear.includes('recycler') ? Object.assign({}, r, { sig: r.sig + '#' + cur.step }) : r;
  const link = RUN.playEnd(g.run, id, r.hits, dry, info); link.forEach(e => ev.push(e));
  const cont = link.some(e => e.src === 'chain'), c = { hits: r.hits, cont, len: cur.path.length, loop, leaves: !!LEAVES[id], first, page: g.page || 1, pageStep: g.pageSteps || 0, pageMax: stepsOf(g), cls: RX.CARDS[id].cls, same: cur.used[cur.used.length - 1] === id, distinct: new Set(cur.used.concat(id)).size };
  g.gear.forEach(q => { if (GEARS[q].step) put(q, lvl(g, q, GEARS[q].step(c))); });
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
// n different pieces that work inside a round: the ones that act on a site or on a reaction
function kitRound(n, rnd) { const R = rnd || Math.random, pool = GEAR.filter(q => !q.end).map(q => q.id), out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); return out; }
function kit(n, rnd) { const R = rnd || Math.random, pool = GEAR.map(q => q.id), out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); return out; }

// ---------- a round: one molecule carried through several pages ----------
// The molecule at the end of a page starts the next page. A reaction that acts on what the last reaction changed
// continues the run, and a run multiplies everything scored on it. A reaction that does not continue the run
// closes it: what the run made is kept and the multiplier starts again at 1. Nothing made is ever taken away.
// The finishing reagent closes groups for good, so it is offered only on the last page and ends the round.
const SYN = { pages: 3, offer: 5, uses: 2, finish: 'h2', finishMult: 0.5, rare: 0.18 };
// Now and then a reagent on offer is a rare version for that page: double scores its sites twice, strong multiplies
// by 1.5, plenty does not run out.
const RARE = ['double', 'strong', 'plenty'];
const synRack = () => RX.LIST.map(c => c.id).filter(id => id !== SYN.finish);
// what the open run is worth, and everything made so far
const held = g => Math.round(g.cur.yield * g.cur.batch);
const made = g => g.total + held(g);
function synDeal(g, rnd) {
  const R = rnd || Math.random, rack = g.rackIds || synRack(), live = rack.filter(id => RX.CARDS[id].find(g.m).length); let offer = [];
  for (let t = 0; t < 40; t++) {
    const pool = rack.slice(); offer = [];
    while (offer.length < SYN.offer + (g.gear.includes('carousel') ? 1 : 0) && pool.length) offer.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
    if (offer.filter(id => live.includes(id)).length >= Math.min(2, live.length)) break;
  }
  g.kinds = rack.filter(id => offer.includes(id)); g.left = {}; g.kinds.forEach(id => { g.left[id] = SYN.uses + ((g.usesPlus && g.usesPlus[id]) || 0) + (g.gear.includes('dropper') ? 1 : 0); }); g.pageSteps = 0;
  g.rare = {}; g.kinds.forEach(id => { if (g.rareOn !== false && R() < SYN.rare * (g.gear.includes('loupe') ? 2 : 1)) { const t = RARE[Math.floor(R() * RARE.length)]; g.rare[id] = t; if (t === 'plenty') g.left[id] = 9; } });
}
function synBegin(feed, relaxed, rnd, gear, run) {
  const g = begin(feed, relaxed, [], null, gear || []);
  g.syn = true; g.page = 1; g.total = 0; g.over = false; g.pageSteps = 0; g.best = 0;
  if (g.gear.includes('magnet')) g.cur.batch = 3;
  if (run) { g.run.grade = Object.assign({}, run.grade); g.gearLv = run.lv; g.usesPlus = run.uses; if (run.rack) g.rackIds = run.rack.slice(); g.rareOn = !!run.rare; }
  synDeal(g, rnd);
  return g;
}
// closes the open run: its amount is kept and the multiplier starts again
const close = g => { g.total += held(g); const keep = g.gear.includes('clamp') ? g.cur.batch * 0.5 : 1; g.cur.yield = 0; g.cur.batch = Math.max(1, keep, g.gear.includes('magnet') ? 3 : 1); g.cur.path = []; g.cur.fresh = new Set(); };
// true when this option would not continue the run that is open
const breaks = (g, o) => g.cur.path.length > 0 && !o.cont;
function synTake(g, o) {
  if (breaks(g, o)) close(g);
  const y0 = g.cur.yield, rare = (g.rare && g.rare[o.id]) || null;
  take(g, o); g.pageSteps++; g.best = Math.max(g.best, g.cur.path.length);
  const t = g.trail[g.trail.length - 1]; t.rare = rare;
  if (rare === 'double') { const dy = g.cur.yield - y0; g.cur.yield += dy; t.ev.push({ src: 'rare', kind: 'y', val: dy, yield: g.cur.yield, batch: g.cur.batch }); }
  else if (rare === 'strong') { g.cur.batch *= 1.5; t.ev.push({ src: 'rare', kind: 'x', val: 1.5, yield: g.cur.yield, batch: g.cur.batch }); }
}
function turn(g, rnd) { if (g.page >= SYN.pages) return false; g.page++; synDeal(g, rnd); return true; }
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
  close(g); g.over = true;
}
function synEnd(g) { close(g); g.over = true; }
// a plain player, used to set the number to beat: continues the run when it can, otherwise reacts at the most sites
function synPlay(feed, rnd, gear, run) {
  const g = synBegin(feed, false, rnd, gear, run), R = rnd || Math.random;
  for (;;) {
    for (;;) {
      const o = options(g), ids = Object.keys(o); if (!ids.length) break;
      const cs = ids.filter(id => o[id].cont), from = cs.length ? cs : ids;
      let best = from[0]; from.forEach(id => { if (o[id].r.hits > o[best].r.hits || (o[id].r.hits === o[best].r.hits && R() < 0.5)) best = id; });
      synTake(g, o[best]);
    }
    if (!turn(g, rnd)) break;
  }
  synEnd(g);
  return g.total;
}
function synQuota(feed, n, gear, run) {
  const a = []; for (let i = 0; i < (n || 40); i++) a.push(synPlay(feed, null, gear, run)); a.sort((x, y) => x - y);
  const q = a[Math.floor(a.length * 0.25)], mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(10, q))) - 1));
  return Math.max(50, Math.round(q / mag) * mag);
}

// ---------- a run: rounds one after another until one is missed ----------
// A run starts with four reagents and no equipment. Before the first round and after every round beaten the player
// takes one of three: a new reagent, a new piece of equipment, a level for a piece they hold, a stronger reagent,
// or one more use of a reagent on every page. What can turn up depends on the suppliers that have been opened.
// Each round has a number to beat that is set by the round and not by what the player holds, so a better build
// beats it by more.
const RUNG = { slots: 4, growth: 1.85, first: 0.8, start: ['hydrate', 'pcc', 'nabh4', 'dehydrate'] };
// Suppliers are opened between runs with credit. Each one adds reagents and equipment to what a run can turn up.
// A run pays one credit for every round beaten.
const SUPPLY = [
  { name: 'corner chemist', cost: 0, reagents: ['hcl', 'bh3'], gear: ['balance', 'stirrer', 'cards', 'spatula', 'stopwatch', 'litmus'] },
  { name: 'trade supplier', cost: 6, reagents: ['socl2', 'koh'], gear: ['cannula', 'coldtrap', 'schlenk', 'burette', 'logbook', 'scalepan'] },
  { name: 'research supplier', cost: 16, reagents: ['naoh'], gear: ['reflux', 'crystal', 'mortar', 'thermometer', 'bunsen', 'dropper'], rare: true },
  { name: 'instrument maker', cost: 30, reagents: [], gear: ['clamp', 'magnet', 'recycler', 'carousel', 'loupe', 'timer'] }
];
const stock = tier => { const o = { reagents: [], gear: [], rare: false }; SUPPLY.forEach((sp, i) => { if (i <= tier) { o.reagents.push(...sp.reagents); o.gear.push(...sp.gear); if (sp.rare) o.rare = true; } }); return o; };
function runNew(tier) { const t = Math.max(0, Math.min(SUPPLY.length - 1, tier | 0)), st = stock(t); return { round: 1, tier: t, rack: RUNG.start.slice(), rare: st.rare, gear: [], lv: {}, grade: {}, uses: {}, base: {}, beaten: 0, over: false }; }
const runBegin = (run, feed, relaxed) => synBegin(feed, relaxed, null, run.gear, run);
// the number to beat is measured against a plain player with the starting four reagents and nothing else
function runQuota(run, feed) {
  if (!run.base[feed]) run.base[feed] = synQuota(feed, 40, [], { rack: RUNG.start, grade: {}, lv: {}, uses: {}, rare: false });
  const q = run.base[feed] * RUNG.first * Math.pow(RUNG.growth, run.round - 1), mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(10, q))) - 1));
  return Math.max(50, Math.round(q / mag) * mag);
}
function runPicks(run, rnd) {
  const R = rnd || Math.random, any = a => a[Math.floor(R() * a.length)], st = stock(run.tier), out = [];
  const newR = st.reagents.filter(id => !run.rack.includes(id)), newG = run.gear.length < RUNG.slots ? st.gear.filter(id => !run.gear.includes(id)) : [];
  const from = { reagent: newR, gear: newG, level: run.gear.filter(id => !GEARS[id].rule), strong: run.rack, bottle: run.rack };
  // one new thing where there is one, then whatever else, three different kinds where possible
  let kinds = ['reagent', 'gear'].filter(k => from[k].length); for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = kinds[i]; kinds[i] = kinds[j]; kinds[j] = t; }
  const rest = ['strong', 'bottle', 'level'].filter(k => from[k].length); for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = rest[i]; rest[i] = rest[j]; rest[j] = t; }
  kinds = kinds.concat(rest).slice(0, 3);
  kinds.forEach(kind => out.push({ kind, id: any(from[kind]) }));
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = out[i]; out[i] = out[j]; out[j] = t; }
  return out;
}
function runTake(run, o) {
  if (o.kind === 'reagent') { if (!run.rack.includes(o.id)) run.rack.push(o.id); }
  else if (o.kind === 'gear') { if (run.gear.length < RUNG.slots && !run.gear.includes(o.id)) run.gear.push(o.id); }
  else if (o.kind === 'level') run.lv[o.id] = (run.lv[o.id] || 1) + 1;
  else if (o.kind === 'strong') run.grade[o.id] = (run.grade[o.id] || 1) + 1;
  else if (o.kind === 'bottle') run.uses[o.id] = (run.uses[o.id] || 0) + 1;
}
// one line saying what a pick does
function pickText(run, o) {
  if (o.kind === 'reagent') return 'a new reaction for this run';
  if (o.kind === 'gear') return GEARS[o.id].note;
  if (o.kind === 'level') return 'level ' + ((run.lv[o.id] || 1) + 1) + ': ' + GEARS[o.id].note;
  if (o.kind === 'strong') return 'each place it changes: +' + RUN.YIELD;
  return 'one more use on every page';
}
AA.rxPath = { stepsOf, SUPPLY, stock, RUNG, runNew, runBegin, runQuota, runPicks, runTake, pickText, DIAL, FEEDS, GEAR, GEARS, OFFER: 4, begin, options, take, deliver, survey, deal, keeps, safe, kit,
  SYN, RARE, kitRound, synRack, synBegin, synTake, synFinish, synEnd, synQuota, synPlay, held, made, breaks, turn, finishOpt };
})(typeof globalThis !== 'undefined' ? globalThis : window);
