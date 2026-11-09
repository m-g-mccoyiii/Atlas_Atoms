(function (root) {
'use strict';
const AA = root.AA, RX = AA.rx;

// The run: eight orders. Each order gives a feedstock, a quota and a spec compound. Bottles come from a
// rack (the deck) into a hand. The score of an order is yield times batch. Every site that reacts adds yield and
// batch; equipment adds to either or multiplies batch; bottles gain grades that last for the run.
// At delivery three instruments check the product against the spec, and each check passed raises batch.
// A filled order pays money, which is spent in the supply room between orders.
// Nothing in this file touches the page, so the same code drives the game and the headless bot.

const ORDERS = 8, STEPS = 5, HAND = 5, REDRAWS = 2, GEAR_SLOTS = 5, YIELD = 20, SCHLENK = 1.5;
const STARTER = ['hydrate', 'hydrate', 'pcc', 'pcc', 'nabh4', 'nabh4', 'dehydrate', 'dehydrate', 'h2', 'hcl'];
const TIER = [0, 0, 1, 1, 2, 2, 3, 3];
const QUOTA = [100, 250, 1200, 2000, 6000, 12000, 30000, 45000];
// money: paid for a filled order, more for a large one, for each check passed and for twice the quota
const PAY = 4, PAY_LARGE = 3, PAY_CHECK = 1, PAY_DOUBLE = 3, START_CASH = 3, REROLL = 2, REMOVE = 3, SELL = 2, MIN_RACK = 6;
const COST = { y: 5, b: 5, x: 8, grow: 7, tool: 6 };
// batch multiplier for 0, 1, 2 or 3 checks passed
const CHECK_MULT = [1, 1.25, 1.5, 2];
// starting racks and difficulty levels; all but the first of each are unlocked by play
const RACKS = {
  standard: { name: 'General rack', deck: STARTER },
  halide: { name: 'Halide rack', deck: ['hcl', 'hcl', 'socl2', 'socl2', 'koh', 'koh', 'naoh', 'naoh', 'hydrate', 'h2'] },
  redox: { name: 'Redox rack', deck: ['pcc', 'pcc', 'pcc', 'nabh4', 'nabh4', 'nabh4', 'bh3', 'bh3', 'h2', 'hydrate'] }
};
const LEVELS = [1, 1.5, 2.5];
// Every order offers two feedstocks. The standard one has LEAN[n] reactive groups. The large one has one more,
// needs LARGE times the quota and pays one more pick and more money.
const LEAN = [2, 2, 3, 3, 4, 4, 5, 5], LARGE = 3.5;
// feedstocks by number of reactive groups: FEED[0] has two, FEED[4] has six
const FEED = [
  ['CC(O)CCC=C', 'C=CCCC=C', 'CC(=O)CCC=C', 'OCCCCC=C', 'CC(O)CCC(O)C', 'CC(Cl)CCC=C'],
  ['C=CCC(O)CC=C', 'CC(O)CCC(O)CC=C', 'C=CCC(=O)CCC=C', 'C=CCC(O)CC(Cl)C', 'CC(=O)CCC(O)CC=C', 'C=CCCC(O)CCC=C'],
  ['C=CCC(O)CC(O)CC=C', 'C=CCC(=O)CCC(=O)CC=C', 'C=CCCC(O)CCC(=O)CCC=C', 'CC(O)CC(=O)CCC(Cl)CCC=C', 'CC(O)CC(O)CC(O)CCC=C', 'C=CCC(Cl)CCC(O)CC=C'],
  ['C=CCC(O)CC(O)CC(O)CC=C', 'C=CCC(O)CCC(=O)CCC(O)CCC=C', 'C=CCC(=O)CC(=O)CC(=O)CC=C', 'CC(O)CC(O)CC(O)CC(O)CC(O)C', 'C=CCC(Cl)CC(O)CC(=O)CCC=C', 'C=CCC(O)CC(=O)CCC(O)CC=C'],
  ['C=CCC(O)CC(O)CC(O)CC(O)CC=C', 'C=CCC(Cl)CC(O)CC(O)CC(Cl)CC=C', 'CC(O)CC(O)CC(O)CC(O)CC(O)CC=C', 'C=CCC(=O)CC(O)CC(O)CC(=O)CC=C', 'C=CCC(O)CC(=O)CC(O)CC(=O)CC=C']
];
// bottles whose reaction makes a group leave the molecule
const LEAVES = { pcc: 1, dehydrate: 1, socl2: 1, koh: 1, naoh: 1 };

// Equipment fires left to right along the bench, once for every site that reacts.
// kind: y adds yield, b adds batch, x multiplies batch, grow gets stronger during the run, tool changes a rule.
const GEAR = [
  { id: 'balance', kind: 'y', name: 'Analytical balance', text: 'Every site: +15 yield.', y: 15 },
  { id: 'notebook', kind: 'y', name: 'Lab notebook', text: 'Every site: +10 yield for each different bottle already used on this order.' },
  { id: 'icebath', kind: 'b', name: 'Ice bath', text: 'Reduce and Hydroborate sites: +3 batch.', ids: ['nabh4', 'bh3'], b: 3 },
  { id: 'dryingtube', kind: 'b', name: 'Drying tube', text: 'Oxidise sites: +3 batch.', ids: ['pcc'], b: 3 },
  { id: 'parr', kind: 'b', name: 'Parr shaker', text: 'Hydrogenate sites: +6 batch.', ids: ['h2'], b: 6 },
  { id: 'scrubber', kind: 'b', name: 'Gas scrubber', text: 'Add HCl and Chlorinate sites: +3 batch.', ids: ['hcl', 'socl2'], b: 3 },
  { id: 'stirrer', kind: 'b', name: 'Stir plate', text: 'Every bottle played: +2 batch.' },
  { id: 'deanstark', kind: 'x', name: 'Dean-Stark trap', text: 'Dehydrate sites: batch times 1.5.', ids: ['dehydrate'], x: 1.5 },
  { id: 'mantle', kind: 'x', name: 'Heating mantle', text: 'Eliminate and Substitute sites: batch times 1.5.', ids: ['koh', 'naoh'], x: 1.5 },
  { id: 'schlenk', kind: 'x', name: 'Schlenk line', text: 'A bottle that reacts at 3 or more sites: batch times ' + SCHLENK + '.' },
  { id: 'rotovap', kind: 'x', name: 'Rotary evaporator', text: 'The last step of an order: batch doubled.' },
  { id: 'column', kind: 'x', name: 'Chromatography column', text: 'Passing all three checks multiplies batch by 4 instead of 2.', bonus: 4 },
  { id: 'syringe', kind: 'x', name: 'Syringe pump', text: 'The last site of every bottle counts twice.' },
  { id: 'coldtrap', kind: 'grow', name: 'Cold trap', text: 'Catches every group that leaves a molecule. Each order starts with +1 batch for every 2 caught.' },
  { id: 'seed', kind: 'grow', name: 'Seed crystal', text: 'At delivery: batch times 1, plus 0.5 for every order that has passed all three checks this run.' },
  { id: 'stock', kind: 'grow', name: 'Stock solution', text: 'Every site: +5 yield for each grade your bottles have gained this run.' },
  { id: 'reflux', kind: 'tool', name: 'Reflux condenser', text: 'One more step on every order.', steps: 1 },
  { id: 'rack', kind: 'tool', name: 'Bottle carrier', text: 'Hold one more bottle in your hand.', hand: 1 },
  { id: 'funnel', kind: 'tool', name: 'Separating funnel', text: 'One more hand swap on every order.', redraws: 1 },
  { id: 'winchester', kind: 'tool', name: 'Winchester bottle', text: 'The first bottle you play on each order comes back to your hand.' }
];
const GEARS = {};
GEAR.forEach(g => { GEARS[g.id] = g; g.cost = COST[g.kind] || 6; });

// Things that stay unlocked between runs. `how` is shown to the player; achieved() below tests each one.
const UNLOCKS = [
  { id: 'schlenk', kind: 'gear', name: 'Schlenk line', how: 'Fill 3 orders in one run' },
  { id: 'syringe', kind: 'gear', name: 'Syringe pump', how: 'Fill a large order' },
  { id: 'column', kind: 'gear', name: 'Chromatography column', how: 'Pass all three checks on one order' },
  { id: 'seed', kind: 'gear', name: 'Seed crystal', how: 'Pass all three checks 3 times in one run' },
  { id: 'rotovap', kind: 'gear', name: 'Rotary evaporator', how: 'Score 10,000 on one order' },
  { id: 'winchester', kind: 'gear', name: 'Winchester bottle', how: 'Raise a bottle to grade 3' },
  { id: 'halide', kind: 'rack', name: 'Halide rack', how: 'Fill 4 orders in one run' },
  { id: 'redox', kind: 'rack', name: 'Redox rack', how: 'Hold $15 at once' },
  { id: 'level2', kind: 'level', name: 'Level 2', how: 'Fill all 8 orders' },
  { id: 'level3', kind: 'level', name: 'Level 3', how: 'Fill all 8 orders on level 2' }
];
function achieved(run) {
  const filled = run.history.filter(q => q.pass), out = [];
  if (filled.length >= 3) out.push('schlenk');
  if (filled.some(q => q.large)) out.push('syringe');
  if (run.stats.triple >= 1) out.push('column');
  if (run.stats.triple >= 3) out.push('seed');
  if (run.history.some(q => q.total >= 10000)) out.push('rotovap');
  if (Object.keys(run.grade).some(id => run.grade[id] >= 3)) out.push('winchester');
  if (filled.length >= 4) out.push('halide');
  if (run.stats.maxMoney >= 15) out.push('redox');
  if (run.won) out.push('level2');
  if (run.won && run.level >= 1) out.push('level3');
  return out;
}

// Conditions attached to orders 4 and 8.
const CONDS = [
  { id: 'acid', text: 'Acid bottles give half yield and no batch', half: ['acid'] },
  { id: 'redox', text: 'Oxidants and hydrides give half yield and no batch', half: ['oxidant', 'hydride'] },
  { id: 'short', text: 'One step fewer', steps: -1 },
  { id: 'noswap', text: 'No hand swaps', redraws: -99 }
];

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (r, a) => a[Math.floor(r() * a.length)];
const shuffle = (r, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
const has = (run, id) => run.gear.includes(id);
const gearSum = (run, key) => run.gear.reduce((s, id) => s + (GEARS[id][key] || 0), 0);
const gradeOf = (run, id) => run.grade[id] || 1;
const seedMult = run => 1 + 0.5 * run.grow.bonus;
const scoreOf = cur => Math.round(cur.yield * cur.batch);
let uid = 0;

// opts: { rack, level, locked }. locked is a list of equipment ids that cannot turn up in this run.
function newRun(seed, opts) {
  const o = opts || {}, rack = RACKS[o.rack] ? o.rack : 'standard';
  return { r: rng(seed == null ? (Math.random() * 4294967296) >>> 0 : seed), n: 0, total: 0, deck: RACKS[rack].deck.slice(), gear: [], grade: {},
    rack, level: Math.max(0, Math.min(LEVELS.length - 1, o.level | 0)), locked: new Set(o.locked || []), money: START_CASH, shop: null,
    stats: { triple: 0, maxMoney: START_CASH },
    grow: { caught: 0, bonus: 0, grades: 0 }, fed: [], cur: null, over: false, won: false, history: [] };
}
// the number a growing piece of equipment currently stands at, for its tag
function live(run, id) {
  if (id === 'coldtrap') return '+' + Math.floor(run.grow.caught / 2);
  if (id === 'seed') return 'times ' + seedMult(run);
  if (id === 'stock') return '+' + 5 * run.grow.grades;
  return '';
}

// the bonus compound: two or three bottles from the rack applied to the feedstock
function makeSpec(run, feed, feedSig, tier) {
  for (let t = 0; t < 60; t++) {
    const m = RX.fromSmiles(feed), left = {}, route = [], len = tier === 0 ? 2 : 2 + (run.r() < 0.6 ? 1 : 0);
    run.deck.forEach(id => { left[id] = (left[id] || 0) + 1; });
    for (let k = 0; k < len; k++) {
      const opts = Object.keys(left).filter(id => left[id] > 0 && id !== route[route.length - 1] && RX.CARDS[id].find(m).length);
      if (!opts.length) break;
      const id = pick(run.r, opts);
      RX.runCard(m, RX.CARDS[id]); left[id]--; route.push(id);
    }
    const p = RX.probe(m), name = RX.nameOf(m);
    if (route.length < 2 || p.sig === feedSig || !name) continue;
    return { sig: p.sig, mass: p.mass, grp: p.grp, name, desc: RX.describe(m), route };
  }
  return null;
}

function fill(run) {
  const c = run.cur;
  while (c.hand.length < c.handSize) {
    if (!c.draw.length) { if (!c.discard.length) break; c.draw = shuffle(run.r, c.discard); c.discard = []; }
    c.hand.push({ id: c.draw.pop(), uid: ++uid });
  }
}

// how many sites each different bottle in the rack would react at on this feedstock
function coverage(run, feed) {
  const m = RX.fromSmiles(feed), out = [];
  Array.from(new Set(run.deck)).forEach(id => { const n = RX.CARDS[id].find(m).length; if (n) out.push({ id, n }); });
  return out.sort((x, y) => y.n - x.n);
}
function offer(run, n, groups, large) {
  const all = FEED[groups - 2], pool = all.filter(f => !run.fed.includes(f)), feed = pick(run.r, pool.length ? pool : all);
  run.fed.push(feed);
  const m = RX.fromSmiles(feed), feedSig = RX.sigOf(m);
  return { feed, feedSig, feedName: RX.label(m), groups, large, quota: Math.round(QUOTA[n] * LEVELS[run.level] * (large ? LARGE : 1)), extra: large ? 1 : 0,
    pay: PAY + (large ? PAY_LARGE : 0), spec: makeSpec(run, feed, feedSig, TIER[n]) };
}
// an order starts as two offers; chooseFeed turns one of them into the order being worked
function beginOrder(run) {
  const n = run.n;
  run.cur = null;
  run.cond = (n === 3 || n === 7) ? pick(run.r, CONDS) : null;
  run.offers = [offer(run, n, LEAN[n], false), offer(run, n, LEAN[n] + 1, true)];
  return run.offers;
}
function chooseFeed(run, i) {
  const o = run.offers[i], n = run.n, cond = run.cond;
  run.cur = {
    n, feed: o.feed, feedSig: o.feedSig, feedName: o.feedName, quota: o.quota, large: o.large, extra: o.extra, cond,
    stepsMax: STEPS + gearSum(run, 'steps') + ((cond && cond.steps) || 0), step: 0,
    redraws: Math.max(0, REDRAWS + gearSum(run, 'redraws') + ((cond && cond.redraws) || 0)),
    handSize: HAND + gearSum(run, 'hand'), hand: [], draw: shuffle(run.r, run.deck.slice()), discard: [],
    yield: 0, batch: 1 + (has(run, 'coldtrap') ? Math.floor(run.grow.caught / 2) : 0),
    used: [], log: [], kept: false, done: false, spec: o.spec
  };
  run.offers = null;
  fill(run);
  return run.cur;
}

// ---------- scoring. Every change to yield or batch is recorded as a trigger so the screen can replay it. ----------
function adder(cur, ev) {
  return (src, kind, val) => {
    if (kind === 'y') cur.yield += val; else if (kind === 'b') cur.batch += val; else cur.batch *= val;
    ev.push({ src, kind, val, yield: cur.yield, batch: cur.batch });
  };
}
// one site has reacted: the bottle scores, then each piece of equipment in bench order
function scoreSite(run, id, dry) {
  const cur = run.cur, ev = [], add = adder(cur, ev), halved = !!(cur.cond && cur.cond.half && cur.cond.half.includes(RX.CARDS[id].cls));
  add('bottle', 'y', Math.round(YIELD * gradeOf(run, id) * (halved ? 0.5 : 1)));
  if (!halved) add('bottle', 'b', 1);
  run.gear.forEach(g => {
    const G = GEARS[g];
    if (G.ids && !G.ids.includes(id)) return;
    const y = g === 'notebook' ? 10 * new Set(cur.used).size : g === 'stock' ? 5 * run.grow.grades : (G.y || 0);
    if (y) add(g, 'y', y);
    if (G.b) add(g, 'b', G.b);
    if (G.x) add(g, 'x', G.x);
  });
  if (!dry && LEAVES[id] && has(run, 'coldtrap')) { run.grow.caught++; ev.push({ src: 'coldtrap', kind: 'catch', val: run.grow.caught, yield: cur.yield, batch: cur.batch }); }
  return ev;
}
// the bottle has finished reacting at `hits` sites: equipment that works once per bottle, then the grade check
function playEnd(run, id, hits, dry) {
  const cur = run.cur, ev = [], add = adder(cur, ev);
  if (!hits) return ev;
  if (has(run, 'syringe')) scoreSite(run, id, dry).forEach((e, k) => { if (!k) e.again = true; ev.push(e); });
  run.gear.forEach(g => {
    if (g === 'stirrer') add(g, 'b', 2);
    else if (g === 'schlenk' && hits >= 3) add(g, 'x', SCHLENK);
    else if (g === 'rotovap' && cur.step + 1 >= cur.stepsMax) add(g, 'x', 2);
  });
  if (!dry && hits > gradeOf(run, id)) { run.grade[id] = gradeOf(run, id) + 1; run.grow.grades++; ev.push({ src: 'bottle', kind: 'grade', val: run.grade[id], yield: cur.yield, batch: cur.batch }); }
  return ev;
}
// what the order would score after playing this bottle at n sites, without changing anything
function preview(run, id, n) {
  const cur = run.cur, y = cur.yield, b = cur.batch;
  for (let i = 0; i < n; i++) scoreSite(run, id, true);
  playEnd(run, id, n, true);
  const s = scoreOf(cur);
  cur.yield = y; cur.batch = b;
  return s;
}
// records a played bottle after its sites have been scored
function commit(run, handIdx, hits) {
  const cur = run.cur, hc = cur.hand[handIdx], before = cur.log.length ? cur.log[cur.log.length - 1].score : 0;
  const ev = playEnd(run, hc.id, hits, false), score = scoreOf(cur);
  cur.step++; cur.used.push(hc.id); cur.log.push({ id: hc.id, hits, score, pts: score - before });
  if (has(run, 'winchester') && !cur.kept) cur.kept = true;            // the bottle stays in the hand
  else { cur.hand.splice(handIdx, 1); cur.discard.push(hc.id); }
  fill(run);
  return { ev, score, gained: score - before };
}
function redraw(run) {
  const cur = run.cur;
  if (cur.redraws <= 0) return false;
  cur.redraws--;
  cur.hand.forEach(c => cur.discard.push(c.id)); cur.hand = [];
  fill(run);
  return true;
}
// The three checks. p is RX.probe of the product. The mass spectrum passes on the same molecular mass, the infrared
// on the same kinds of functional group, and the NMR only on the same structure.
function checks(run, p) {
  const sp = run.cur && run.cur.spec, ms = !!sp && p.mass === sp.mass, ir = !!sp && p.grp === sp.grp, nmr = !!sp && p.sig === sp.sig;
  return { ms, ir, nmr, n: (ms ? 1 : 0) + (ir ? 1 : 0) + (nmr ? 1 : 0) };
}
const checkMult = (run, k) => (k === 3 ? Math.max(CHECK_MULT[3], gearSum(run, 'bonus')) : CHECK_MULT[k]);
const endMult = (run, p) => { const k = checks(run, p).n; return checkMult(run, k) * (has(run, 'seed') ? seedMult(run) + (k === 3 ? 0.5 : 0) : 1); };
const projected = (run, p) => Math.round(run.cur.yield * run.cur.batch * endMult(run, p));

function endOrder(run, p) {
  const cur = run.cur, ck = checks(run, p), hit = ck.n === 3, ev = [], add = adder(cur, ev), y0 = cur.yield, b0 = cur.batch;
  if (hit) { run.grow.bonus++; run.stats.triple++; }
  if (ck.n) add('checks', 'x', checkMult(run, ck.n));
  if (has(run, 'seed') && seedMult(run) > 1) add('seed', 'x', seedMult(run));
  const total = scoreOf(cur), pass = total >= cur.quota, picks = pass ? 1 + cur.extra : 0;
  const pay = pass ? PAY + (cur.large ? PAY_LARGE : 0) + ck.n * PAY_CHECK + (total >= cur.quota * 2 ? PAY_DOUBLE : 0) : 0;
  cur.done = true; cur.final = total; cur.hit = hit; cur.pass = pass;
  run.money += pay; run.stats.maxMoney = Math.max(run.stats.maxMoney, run.money);
  run.total += total; run.history.push({ n: cur.n, total, quota: cur.quota, hit, pass, large: cur.large });
  if (!pass) run.over = true; else if (cur.n === ORDERS - 1) { run.over = true; run.won = true; }
  return { yield: y0, batch: b0, ev, checks: ck, mult: checkMult(run, ck.n), total, pass, hit, picks, pay };
}
function nextOrder(run) { run.n++; return beginOrder(run); }

// three things to choose from after a filled order: two bottles and one piece of equipment
function rewards(run) {
  const out = [], owned = new Set(run.deck), ids = shuffle(run.r, RX.LIST.map(c => c.id));
  const fresh = ids.filter(id => !owned.has(id)), first = fresh.length ? fresh[0] : ids[0];
  out.push({ kind: 'bottle', id: first });
  out.push({ kind: 'bottle', id: ids.find(id => id !== first) });
  const gearLeft = GEAR.filter(g => !has(run, g.id) && !run.locked.has(g.id));
  if (run.gear.length < GEAR_SLOTS && gearLeft.length) out.push({ kind: 'gear', id: pick(run.r, gearLeft).id });
  else out.push({ kind: 'bottle', id: ids.find(id => id !== first && id !== out[1].id) });
  return out;
}
function take(run, opt) { if (opt.kind === 'gear') { if (run.gear.length < GEAR_SLOTS && !has(run, opt.id)) run.gear.push(opt.id); } else run.deck.push(opt.id); }
// moves a piece of equipment one place to the left on the bench, so it fires earlier
function moveGear(run, i) { if (i > 0 && i < run.gear.length) { const g = run.gear; [g[i - 1], g[i]] = [g[i], g[i - 1]]; } }

// ---------- the supply room between orders ----------
// two bottles, two pieces of equipment and one purification, which raises a bottle you own by one grade
function stock(run) {
  const ids = shuffle(run.r, RX.LIST.map(c => c.id)), items = [];
  items.push({ kind: 'bottle', id: ids[0], cost: 3 }, { kind: 'bottle', id: ids[1], cost: 3 });
  shuffle(run.r, GEAR.filter(g => !has(run, g.id) && !run.locked.has(g.id))).slice(0, 2).forEach(g => items.push({ kind: 'gear', id: g.id, cost: g.cost }));
  const own = pick(run.r, Array.from(new Set(run.deck)));
  items.push({ kind: 'grade', id: own, cost: 4 + gradeOf(run, own) });
  run.shop = { items, reroll: run.shop && run.shop.open ? run.shop.reroll : REROLL, open: true };
  return run.shop;
}
const canBuy = (run, it) => !!it && !it.sold && run.money >= it.cost && (it.kind !== 'gear' || run.gear.length < GEAR_SLOTS);
function buy(run, i) {
  const it = run.shop && run.shop.items[i];
  if (!canBuy(run, it)) return false;
  run.money -= it.cost; it.sold = true;
  if (it.kind === 'grade') { run.grade[it.id] = gradeOf(run, it.id) + 1; run.grow.grades++; } else take(run, it);
  return true;
}
function reroll(run) {
  const c = run.shop.reroll;
  if (run.money < c) return false;
  run.money -= c; stock(run); run.shop.reroll = c + 1;
  return true;
}
function removeBottle(run, id) {
  const i = run.deck.indexOf(id);
  if (i < 0 || run.money < REMOVE || run.deck.length <= MIN_RACK) return false;
  run.deck.splice(i, 1); run.money -= REMOVE;
  return true;
}
function sellGear(run, id) {
  const i = run.gear.indexOf(id);
  if (i < 0) return false;
  run.gear.splice(i, 1); run.money += SELL; run.stats.maxMoney = Math.max(run.stats.maxMoney, run.money);
  return true;
}
function closeShop(run) { if (run.shop) run.shop.open = false; }

AA.rxRun = { ORDERS, GEAR, GEARS, GEAR_SLOTS, QUOTA, LARGE, FEED, YIELD, RACKS, LEVELS, UNLOCKS, CHECK_MULT, REMOVE, SELL, MIN_RACK, PAY_CHECK, PAY_DOUBLE,
  newRun, beginOrder, chooseFeed, coverage, nextOrder, gradeOf, live, scoreOf, scoreSite, preview, commit, redraw,
  checks, checkMult, projected, endMult, endOrder, rewards, take, moveGear, has, pick, achieved, stock, canBuy, buy, reroll, removeBottle, sellGear, closeShop };
})(typeof globalThis !== 'undefined' ? globalThis : window);
