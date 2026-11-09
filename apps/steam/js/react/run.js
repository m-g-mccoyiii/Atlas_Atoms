(function (root) {
'use strict';
const AA = root.AA, RX = AA.rx;

// The run: eight orders. Each order gives a feedstock, a quota and a bonus compound. Bottles come from a
// rack (the deck) into a hand. The score of an order is YIELD × BATCH. Every site that reacts adds yield and
// batch; equipment adds to either or multiplies batch; bottles gain grades that last for the run.
// Nothing in this file touches the page, so the same code drives the game and the headless bot.

const ORDERS = 8, STEPS = 5, HAND = 5, REDRAWS = 2, GEAR_SLOTS = 5, YIELD = 20;
const STARTER = ['hydrate', 'hydrate', 'pcc', 'pcc', 'nabh4', 'nabh4', 'dehydrate', 'dehydrate', 'h2', 'hcl'];
const TIER = [0, 0, 1, 1, 2, 2, 3, 3];
const QUOTA = [100, 300, 1200, 2500, 6000, 12000, 30000, 60000];
const FEED = [
  ['C=CCCCC', 'CC(O)CCC=C', 'C=CCCC=C', 'CC(=O)CCC=C', 'OCCCCC=C', 'CC(O)CCC(O)C'],
  ['C=CCC(O)CC=C', 'CC(O)CCC(O)CC=C', 'C=CCC(=O)CCC=C', 'C=CCC(O)CC(Cl)C', 'CC(=O)CCC(O)CC=C', 'C=CCCC(O)CCC=C'],
  ['C=CCC(O)CC(O)CC=C', 'C=CCC(=O)CCC(=O)CC=C', 'C=CCC(O)CC(O)CC(O)CC=C', 'C=CCCC(O)CCC(=O)CCC=C', 'CC(O)CC(=O)CCC(Cl)CCC=C'],
  ['C=CCC(O)CC(O)CC(O)CC(O)CC=C', 'C=CCC(O)CCC(=O)CCC(O)CCC=C', 'C=CCC(Cl)CC(O)CC(O)CC(Cl)CC=C', 'CC(O)CC(O)CC(O)CC(O)CC(O)C', 'C=CCC(=O)CC(=O)CC(=O)CC=C']
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
  { id: 'deanstark', kind: 'x', name: 'Dean–Stark trap', text: 'Dehydrate sites: batch ×1.5.', ids: ['dehydrate'], x: 1.5 },
  { id: 'mantle', kind: 'x', name: 'Heating mantle', text: 'Eliminate and Substitute sites: batch ×1.5.', ids: ['koh', 'naoh'], x: 1.5 },
  { id: 'schlenk', kind: 'x', name: 'Schlenk line', text: 'A bottle that reacts at 3 or more sites: batch ×2.' },
  { id: 'rotovap', kind: 'x', name: 'Rotary evaporator', text: 'The last step of an order: batch ×2.' },
  { id: 'column', kind: 'x', name: 'Chromatography column', text: 'The bonus compound multiplies batch by 4 instead of 2.', bonus: 4 },
  { id: 'syringe', kind: 'x', name: 'Syringe pump', text: 'The last site of every bottle counts twice.' },
  { id: 'coldtrap', kind: 'grow', name: 'Cold trap', text: 'Catches every group that leaves a molecule. Each order starts with +1 batch for every 2 caught.' },
  { id: 'seed', kind: 'grow', name: 'Seed crystal', text: 'At delivery: batch ×1, plus 0.5 for every bonus compound delivered this run.' },
  { id: 'stock', kind: 'grow', name: 'Stock solution', text: 'Every site: +5 yield for each grade your bottles have gained this run.' },
  { id: 'reflux', kind: 'tool', name: 'Reflux condenser', text: 'One more step on every order.', steps: 1 },
  { id: 'rack', kind: 'tool', name: 'Bottle carrier', text: 'Hold one more bottle in your hand.', hand: 1 },
  { id: 'funnel', kind: 'tool', name: 'Separating funnel', text: 'One more hand swap on every order.', redraws: 1 },
  { id: 'winchester', kind: 'tool', name: 'Winchester bottle', text: 'The first bottle you play on each order comes back to your hand.' }
];
const GEARS = {};
GEAR.forEach(g => { GEARS[g.id] = g; });

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

function newRun(seed) {
  return { r: rng(seed == null ? (Math.random() * 4294967296) >>> 0 : seed), n: 0, total: 0, deck: STARTER.slice(), gear: [], grade: {},
    grow: { caught: 0, bonus: 0, grades: 0 }, fed: [], cur: null, over: false, won: false, history: [] };
}
// the number a growing piece of equipment currently stands at, for its tag
function live(run, id) {
  if (id === 'coldtrap') return '+' + Math.floor(run.grow.caught / 2) + ' batch (' + run.grow.caught + ' caught)';
  if (id === 'seed') return '×' + seedMult(run);
  if (id === 'stock') return '+' + 5 * run.grow.grades + ' yield';
  return '';
}

// the bonus compound: two or three bottles from the rack applied to the feedstock
function makeBonus(run, feed, feedSig, tier) {
  for (let t = 0; t < 60; t++) {
    const m = RX.fromSmiles(feed), left = {}, route = [], len = tier === 0 ? 2 : 2 + (run.r() < 0.6 ? 1 : 0);
    run.deck.forEach(id => { left[id] = (left[id] || 0) + 1; });
    for (let k = 0; k < len; k++) {
      const opts = Object.keys(left).filter(id => left[id] > 0 && id !== route[route.length - 1] && RX.CARDS[id].find(m).length);
      if (!opts.length) break;
      const id = pick(run.r, opts);
      RX.runCard(m, RX.CARDS[id]); left[id]--; route.push(id);
    }
    const sig = RX.sigOf(m), name = RX.nameOf(m);
    if (route.length < 2 || sig === feedSig || !name) continue;
    return { sig, name, desc: RX.describe(m), route };
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

function beginOrder(run) {
  const n = run.n, tier = TIER[n], cond = (n === 3 || n === 7) ? pick(run.r, CONDS) : null;
  const pool = FEED[tier].filter(s => !run.fed.includes(s)), feed = pick(run.r, pool.length ? pool : FEED[tier]);
  run.fed.push(feed);
  const m = RX.fromSmiles(feed), feedSig = RX.sigOf(m);
  run.cur = {
    n, feed, feedSig, feedName: RX.label(m), quota: QUOTA[n], cond,
    stepsMax: STEPS + gearSum(run, 'steps') + ((cond && cond.steps) || 0), step: 0,
    redraws: Math.max(0, REDRAWS + gearSum(run, 'redraws') + ((cond && cond.redraws) || 0)),
    handSize: HAND + gearSum(run, 'hand'), hand: [], draw: shuffle(run.r, run.deck.slice()), discard: [],
    yield: 0, batch: 1 + (has(run, 'coldtrap') ? Math.floor(run.grow.caught / 2) : 0),
    used: [], log: [], kept: false, done: false, bonus: makeBonus(run, feed, feedSig, tier), bonusMult: Math.max(2, gearSum(run, 'bonus'))
  };
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
    else if (g === 'schlenk' && hits >= 3) add(g, 'x', 2);
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
const endMult = (run, sig) => { const c = run.cur, on = !!c.bonus && sig === c.bonus.sig; return (on ? c.bonusMult : 1) * (has(run, 'seed') ? seedMult(run) + (on ? 0.5 : 0) : 1); };
const projected = (run, sig) => Math.round(run.cur.yield * run.cur.batch * endMult(run, sig));

function endOrder(run, sig) {
  const cur = run.cur, hit = !!cur.bonus && sig === cur.bonus.sig, ev = [], add = adder(cur, ev), y0 = cur.yield, b0 = cur.batch;
  if (hit) { add('bonus', 'x', cur.bonusMult); run.grow.bonus++; }
  if (has(run, 'seed') && seedMult(run) > 1) add('seed', 'x', seedMult(run));
  const total = scoreOf(cur), pass = total >= cur.quota, picks = pass ? (total >= cur.quota * 2 ? 2 : 1) : 0;
  cur.done = true; cur.final = total; cur.hit = hit; cur.pass = pass;
  run.total += total; run.history.push({ n: cur.n, total, quota: cur.quota, hit, pass });
  if (!pass) run.over = true; else if (cur.n === ORDERS - 1) { run.over = true; run.won = true; }
  return { yield: y0, batch: b0, ev, mult: hit ? cur.bonusMult : 1, total, pass, hit, picks };
}
function nextOrder(run) { run.n++; return beginOrder(run); }

// three things to choose from after a filled order: two bottles and one piece of equipment
function rewards(run) {
  const out = [], owned = new Set(run.deck), ids = shuffle(run.r, RX.LIST.map(c => c.id));
  const fresh = ids.filter(id => !owned.has(id)), first = fresh.length ? fresh[0] : ids[0];
  out.push({ kind: 'bottle', id: first });
  out.push({ kind: 'bottle', id: ids.find(id => id !== first) });
  const gearLeft = GEAR.filter(g => !has(run, g.id));
  if (run.gear.length < GEAR_SLOTS && gearLeft.length) out.push({ kind: 'gear', id: pick(run.r, gearLeft).id });
  else out.push({ kind: 'bottle', id: ids.find(id => id !== first && id !== out[1].id) });
  return out;
}
function take(run, opt) { if (opt.kind === 'gear') { if (run.gear.length < GEAR_SLOTS && !has(run, opt.id)) run.gear.push(opt.id); } else run.deck.push(opt.id); }
// moves a piece of equipment one place to the left on the bench, so it fires earlier
function moveGear(run, i) { if (i > 0 && i < run.gear.length) { const g = run.gear; [g[i - 1], g[i]] = [g[i], g[i - 1]]; } }

AA.rxRun = { ORDERS, GEAR, GEARS, GEAR_SLOTS, QUOTA, FEED, YIELD, newRun, beginOrder, nextOrder, gradeOf, live, scoreOf, scoreSite, preview, commit, redraw,
  projected, endMult, endOrder, rewards, take, moveGear, has, pick };
})(typeof globalThis !== 'undefined' ? globalThis : window);
