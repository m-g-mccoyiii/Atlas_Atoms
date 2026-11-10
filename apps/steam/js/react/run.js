(function (root) {
'use strict';
const AA = root.AA, RX = AA.rx;

// The run: eight orders. Each order gives a feedstock, a quota and a spec compound. Bottles come from a
// rack (the deck) into a hand. The score of an order is yield times batch. Every site that reacts adds yield and
// batch; equipment adds to either or multiplies batch; bottles gain grades that last for the run.
// At delivery three instruments check the product against the spec, and each check passed raises batch.
// A filled order leaves surplus product, counted in kg, which is traded in the supply room between orders.
// Surplus exists only inside a run: every run starts with the same amount and nothing carries over.
// From order 3 every feedstock has one marked group to keep. A site that reacts there scores nothing and halves
// batch at delivery. Capping the marked group costs one step and stops every bottle reacting there.
// Nothing in this file touches the page, so the same code drives the game and the headless bot.

const ORDERS = 8, STEPS = 5, HAND = 5, REDRAWS = 2, GEAR_SLOTS = 5, YIELD = 20, SCHLENK = 1.5;
const STARTER = ['hydrate', 'hydrate', 'pcc', 'pcc', 'nabh4', 'nabh4', 'dehydrate', 'dehydrate', 'h2', 'hcl'];
const TIER = [0, 0, 1, 1, 2, 2, 3, 3];
const QUOTA = [200, 1000, 6000, 10000, 30000, 60000, 130000, 180000];
// surplus (run.money): a filled order leaves PAY, a large one PAY_LARGE more, each step not used PAY_STEP, and each
// time the score doubles the quota PAY_DOUBLE, up to DOUBLE_CAP doublings. Surplus already held earns 1 for every
// HOLD_PER at the end of an order, up to HOLD_CAP. Equipment sells for SELL plus 1 for each order it has been held.
const PAY = 4, PAY_LARGE = 3, PAY_STEP = 1, PAY_DOUBLE = 1, DOUBLE_CAP = 4, HOLD_PER = 5, HOLD_CAP = 5, START_CASH = 4, REROLL = 2, REMOVE = 3, SELL = 2, SELL_CAP = 8, MIN_RACK = 6;
const COST = { y: 5, b: 5, x: 8, grow: 7, tool: 6 };
// batch multiplier for 0, 1, 2 or 3 checks passed
const CHECK_MULT = [1, 1.25, 1.5, 2];
// the first order (counted from 0) whose feedstock has a group to keep
const KEEP_FROM = 2;
// Kits: a starting rack and one rule change. Levels: each adds one handicap to all the levels below it.
// All but the first of each are unlocked by play. The rule fields are read by mods() below.
const RACKS = {
  standard: { name: 'General kit', rule: 'One more hand swap on every order.', tags: ['+1 swap'], deck: STARTER, redraws: 1 },
  halide: { name: 'Halide kit', rule: 'One more step on every order. One bottle fewer in the hand.', tags: ['+1 step', '-1 hand'], steps: 1, hand: -1,
    deck: ['hcl', 'hcl', 'socl2', 'socl2', 'koh', 'koh', 'naoh', 'naoh', 'hydrate', 'h2'] },
  redox: { name: 'Redox kit', rule: 'Starts with an Ice bath.', tags: ['Ice bath'], gear: ['icebath'],
    deck: ['pcc', 'pcc', 'pcc', 'nabh4', 'nabh4', 'nabh4', 'bh3', 'bh3', 'h2', 'hydrate'] },
  protect: { name: 'Protecting kit', rule: 'Marked groups from order 1. Capping costs no step.', tags: ['Keep from order 1', 'Free cap'], deck: STARTER, keepFrom: 0, freeCap: true },
  pilot: { name: 'Pilot plant kit', rule: 'Starts with 12 kg of surplus. Filled orders leave 2 kg less.', tags: ['12 kg', '-2 kg an order'], deck: STARTER, cash: 8, pay: -2 }
};
const LEVELS = [
  { text: 'Standard quotas' },
  { text: 'Quotas times 1.5', tag: 'Quota 1.5', quota: 1.5 },
  { text: 'Orders 2 and 6 also carry a condition', tag: '+2 conditions', conds: [1, 5] },
  { text: 'One hand swap fewer on every order', tag: '-1 swap', redraws: -1 },
  { text: 'Filled orders leave 2 kg less surplus', tag: '-2 kg an order', pay: -2 },
  { text: 'Quotas times 2.5', tag: 'Quota 2.5', quota: 2.5 }
];
function mods(rack, level) {
  const m = { steps: 0, hand: 0, redraws: 0, pay: 0, quota: 1, conds: [3, 7], keepFrom: KEEP_FROM, freeCap: false };
  const put = s => {
    ['steps', 'hand', 'redraws', 'pay'].forEach(f => { m[f] += s[f] || 0; });
    if (s.quota) m.quota = Math.max(m.quota, s.quota);
    if (s.conds) m.conds = m.conds.concat(s.conds);
    if (s.keepFrom != null) m.keepFrom = s.keepFrom;
    if (s.freeCap) m.freeCap = true;
  };
  put(RACKS[rack]);
  for (let i = 1; i <= level; i++) put(LEVELS[i]);
  return m;
}
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
const LEAVES = { pcc: 1, dehydrate: 1, socl2: 1, koh: 1, naoh: 1, wittig: 1 };

// Equipment fires left to right along the bench, once for every site that reacts.
// kind: y adds yield, b adds batch, x multiplies batch, grow gets stronger during the run, tool changes a rule.
const GEAR = [
  { id: 'balance', kind: 'y', name: 'Analytical balance', text: 'Every site: +15 yield.', y: 15 },
  { id: 'desiccator', kind: 'y', name: 'Desiccator', text: 'Every site: +2 yield for each kg of surplus held.' },
  { id: 'notebook', kind: 'y', name: 'Lab notebook', text: 'Every site: +10 yield for each different bottle already used on this order.' },
  { id: 'icebath', kind: 'b', name: 'Ice bath', text: 'Reduce and Hydroborate sites: +3 batch.', ids: ['nabh4', 'bh3'], b: 3 },
  { id: 'dryingtube', kind: 'b', name: 'Drying tube', text: 'Oxidize sites: +3 batch.', ids: ['pcc'], b: 3 },
  { id: 'parr', kind: 'b', name: 'Parr shaker', text: 'Hydrogenate sites: +6 batch.', ids: ['h2'], b: 6 },
  { id: 'scrubber', kind: 'b', name: 'Gas scrubber', text: 'Add HCl and Chlorinate sites: +3 batch.', ids: ['hcl', 'socl2'], b: 3 },
  { id: 'stirrer', kind: 'b', name: 'Stir plate', text: 'Every bottle played: +2 batch.' },
  { id: 'deanstark', kind: 'x', name: 'Dean-Stark trap', text: 'Dehydrate sites: batch times 1.5.', ids: ['dehydrate'], x: 1.5 },
  { id: 'mantle', kind: 'x', name: 'Heating mantle', text: 'Eliminate and Substitute sites: batch times 1.5.', ids: ['koh', 'naoh'], x: 1.5 },
  { id: 'schlenk', kind: 'x', name: 'Schlenk line', text: 'A bottle that reacts at 3 or more sites: batch times ' + SCHLENK + '.' },
  { id: 'rotovap', kind: 'x', name: 'Rotary evaporator', text: 'The last step of an order: batch doubled.' },
  { id: 'column', kind: 'x', name: 'Chromatography column', text: 'Passing all three checks multiplies batch by 4 instead of 2.', bonus: 4 },
  { id: 'glovebox', kind: 'x', name: 'Glove box', text: 'Delivering with the kept group untouched: batch times 2.' },
  { id: 'syringe', kind: 'x', name: 'Syringe pump', text: 'The last site of every bottle counts twice.' },
  { id: 'cannula', kind: 'x', name: 'Cannula', text: 'Every chain link multiplies batch by 0.25 more.' },
  { id: 'coldtrap', kind: 'grow', name: 'Cold trap', text: 'Catches every group that leaves a molecule. Each order starts with +1 batch for every 2 caught.' },
  { id: 'seed', kind: 'grow', name: 'Seed crystal', text: 'At delivery: batch times 1, plus 0.5 for every order that has passed all three checks this run.' },
  { id: 'stock', kind: 'grow', name: 'Stock solution', text: 'Every site: +5 yield for each grade gained by any bottle this run.' },
  { id: 'reflux', kind: 'tool', name: 'Reflux condenser', text: 'One more step on every order.', steps: 1 },
  { id: 'rack', kind: 'tool', name: 'Bottle carrier', text: 'One more bottle in the hand.', hand: 1 },
  { id: 'funnel', kind: 'tool', name: 'Separating funnel', text: 'One more hand swap on every order.', redraws: 1 },
  { id: 'winchester', kind: 'tool', name: 'Winchester bottle', text: 'The first bottle played on each order returns to the hand.' },
  { id: 'fraction', kind: 'tool', name: 'Fraction collector', text: 'Every filled order leaves 3 kg more surplus.', pay: 3 },
  { id: 'drum', kind: 'tool', name: 'Storage drum', text: 'Held surplus can earn up to 10 kg an order instead of 5.', hold: 5 }
];
const GEARS = {};
GEAR.forEach(g => { GEARS[g.id] = g; g.cost = COST[g.kind] || 6; });

// Chains. A play continues the chain when it reacts at an atom the previous play made or changed and the product
// is a structure this order has not held before, so oxidising and reducing the same carbon back and forth does not count.
// Link L of a chain multiplies batch by 1 + CHAIN * (L - 1).
// Routes are named chains. Each step lists the bottles that can do it. A route fires when the end of the chain
// matches it, and only the longest match fires. Its multiplier is x at level 1 and rises by up for each level bought.
const CHAIN = 0.25;
// test dials: chain replaces CHAIN when set, route scales how far a route multiplier stands above 1, siteBatch is the batch a site adds,
// chainAdd, when set, makes link L of a chain add chainAdd * (L - 1) batch in place of multiplying
const TUNE = { chain: null, route: 1, siteBatch: 1, chainAdd: null };
const ROUTES = [
  { id: 'ketone', name: 'Alkene to ketone', seq: [['hydrate', 'bh3'], ['pcc']], x: 2, up: 1 },
  { id: 'deoxy', name: 'Deoxygenation', seq: [['dehydrate'], ['h2']], x: 2, up: 1 },
  { id: 'dehalo', name: 'Dehalogenation', seq: [['koh'], ['h2']], x: 2, up: 1 },
  { id: 'isomer', name: 'Alkene isomerization', seq: [['hcl', 'hydrate'], ['koh', 'dehydrate']], x: 2, up: 1 },
  { id: 'shift', name: 'Alcohol transposition', seq: [['dehydrate'], ['hydrate', 'bh3']], x: 2, up: 1 },
  { id: 'chloro', name: 'Ketone to chloride', seq: [['nabh4', 'bh3'], ['socl2']], x: 2, up: 1 },
  { id: 'viacl', name: 'Chloride elimination', seq: [['socl2'], ['koh']], x: 2, up: 1 },
  { id: 'hydrolysis', name: 'Chloride to ketone', seq: [['naoh'], ['pcc']], x: 2, up: 1 },
  { id: 'removal', name: 'Carbonyl removal', seq: [['nabh4', 'bh3'], ['dehydrate'], ['h2']], x: 4, up: 2 },
  { id: 'carbshift', name: 'Carbonyl transposition', seq: [['nabh4', 'bh3'], ['dehydrate'], ['hydrate', 'bh3'], ['pcc']], x: 8, up: 4 }
];
const ROUTE = {};
ROUTES.forEach(r => { ROUTE[r.id] = r; });
const routeLevel = (run, id) => run.routeLv[id] || 1;
const routeMult = (run, id) => 1 + (ROUTE[id].x + ROUTE[id].up * (routeLevel(run, id) - 1) - 1) * TUNE.route;
const routeSteps = r => r.seq.map(alts => alts.map(id => RX.CARDS[id].verb).join(' or ')).join(', then ');
const routeFits = (run, r) => r.seq.every(alts => alts.some(id => run.deck.includes(id)));
function matchRoute(path) {
  let best = null;
  ROUTES.forEach(r => {
    const n = r.seq.length, off = path.length - n;
    if (off < 0 || (best && best.seq.length >= n)) return;
    if (r.seq.every((alts, k) => alts.includes(path[off + k]))) best = r;
  });
  return best;
}

// Feats. Each one is a named goal that unlocks one thing for later runs. `how` is shown to the player;
// achieved() below tests each one.
const UNLOCKS = [
  { id: 'schlenk', kind: 'gear', feat: 'Three orders', name: 'Schlenk line', how: 'Fill 3 orders in one run' },
  { id: 'syringe', kind: 'gear', feat: 'Large order', name: 'Syringe pump', how: 'Fill a large order' },
  { id: 'column', kind: 'gear', feat: 'Clean product', name: 'Chromatography column', how: 'Pass all three checks on one order' },
  { id: 'halide', kind: 'rack', feat: 'Four orders', name: 'Halide kit', how: 'Fill 4 orders in one run' },
  { id: 'rotovap', kind: 'gear', feat: 'Ten thousand', name: 'Rotary evaporator', how: 'Score 10,000 on one order' },
  { id: 'cannula', kind: 'gear', feat: 'Four links', name: 'Cannula', how: 'Build a chain of 4 links' },
  { id: 'redox', kind: 'rack', feat: 'Three routes', name: 'Redox kit', how: 'Complete 3 named routes in one run' },
  { id: 'winchester', kind: 'gear', feat: 'Grade 3', name: 'Winchester bottle', how: 'Raise a bottle to grade 3' },
  { id: 'seed', kind: 'gear', feat: 'Clean run', name: 'Seed crystal', how: 'Pass all three checks 3 times in one run' },
  { id: 'glovebox', kind: 'gear', feat: 'Capped and doubled', name: 'Glove box', how: 'Deliver an order with the marked group capped and the quota doubled' },
  { id: 'protect', kind: 'rack', feat: 'Three kept', name: 'Protecting kit', how: 'Fill 3 orders in one run with the marked group untouched' },
  { id: 'pilot', kind: 'rack', feat: 'Full store', name: 'Pilot plant kit', how: 'Hold 25 kg of surplus at once' }
].concat(LEVELS.slice(1).map((l, i) => ({ id: 'level' + (i + 2), kind: 'level', feat: 'Level ' + (i + 1) + ' cleared', name: 'Level ' + (i + 2), how: 'Fill all 8 orders on level ' + (i + 1) })));
function achieved(run) {
  const filled = run.history.filter(q => q.pass), out = [];
  if (filled.length >= 3) out.push('schlenk');
  if (filled.some(q => q.large)) out.push('syringe');
  if (run.stats.triple >= 1) out.push('column');
  if (filled.length >= 4) out.push('halide');
  if (run.history.some(q => q.total >= 10000)) out.push('rotovap');
  if (run.stats.chain >= 4) out.push('cannula');
  if (Object.keys(run.routeDone).reduce((t, id) => t + run.routeDone[id], 0) >= 3) out.push('redox');
  if (Object.keys(run.grade).some(id => run.grade[id] >= 3)) out.push('winchester');
  if (run.stats.triple >= 3) out.push('seed');
  if (filled.some(q => q.capped && q.kept && q.total >= q.quota * 2)) out.push('glovebox');
  if (filled.filter(q => q.kept).length >= 3) out.push('protect');
  if (run.stats.maxMoney >= 25) out.push('pilot');
  if (run.won && run.level + 1 < LEVELS.length) out.push('level' + (run.level + 2));
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
  const o = opts || {}, rack = RACKS[o.rack] ? o.rack : 'standard', level = Math.max(0, Math.min(LEVELS.length - 1, o.level | 0));
  const cash = START_CASH + (RACKS[rack].cash || 0);
  return { r: rng(seed == null ? (Math.random() * 4294967296) >>> 0 : seed), n: 0, total: 0, deck: RACKS[rack].deck.slice(), gear: (RACKS[rack].gear || []).slice(), grade: {},
    rack, level, mod: mods(rack, level), locked: new Set(o.locked || []), money: cash, shop: null,
    stats: { triple: 0, maxMoney: cash, chain: 0 }, routeLv: {}, routeDone: {}, got: {},
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
function makeSpec(run, feed, feedSig, tier, keep) {
  for (let t = 0; t < 60; t++) {
    const m = RX.fromSmiles(feed), left = {}, route = [], len = tier === 0 ? 2 : 2 + (run.r() < 0.6 ? 1 : 0);
    if (keep) m.atoms[keep.i].prot = true;                 // the spec never needs the kept group to react
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
  const m = RX.fromSmiles(feed), feedSig = RX.sigOf(m), ks = n >= run.mod.keepFrom ? RX.keepable(m) : [], keep = ks.length ? pick(run.r, ks) : null;
  return { keep, feed, feedSig, feedName: RX.label(m), groups, large, quota: Math.round(QUOTA[n] * run.mod.quota * (large ? LARGE : 1)), extra: large ? 1 : 0,
    pay: PAY + (large ? PAY_LARGE : 0), spec: makeSpec(run, feed, feedSig, TIER[n], keep) };
}
// puts the kept-group mark on a model built from the offer's feedstock
function mark(m, keep) { if (keep && m.atoms[keep.i] && m.atoms[keep.i].el === 'O') m.atoms[keep.i].keep = true; return m; }
const touchesKeep = s => s.atoms.some(a => a.keep);
// an order starts as two offers; chooseFeed turns one of them into the order being worked
function beginOrder(run) {
  const n = run.n;
  run.cur = null;
  run.cond = run.mod.conds.includes(n) ? pick(run.r, CONDS) : null;
  run.offers = [offer(run, n, LEAN[n], false), offer(run, n, LEAN[n] + 1, true)];
  return run.offers;
}
function chooseFeed(run, i) {
  const o = run.offers[i], n = run.n, cond = run.cond;
  run.cur = {
    n, feed: o.feed, feedSig: o.feedSig, feedName: o.feedName, quota: o.quota, large: o.large, extra: o.extra, cond,
    stepsMax: STEPS + run.mod.steps + gearSum(run, 'steps') + ((cond && cond.steps) || 0), step: 0,
    redraws: Math.max(0, REDRAWS + run.mod.redraws + gearSum(run, 'redraws') + ((cond && cond.redraws) || 0)),
    handSize: HAND + run.mod.hand + gearSum(run, 'hand'), hand: [], draw: shuffle(run.r, run.deck.slice()), discard: [],
    yield: 0, batch: 1 + (has(run, 'coldtrap') ? Math.floor(run.grow.caught / 2) : 0),
    used: [], log: [], back: false, keep: o.keep, spoiled: false, done: false, spec: o.spec,
    path: [], fresh: new Set(), seen: new Set([o.feedSig])
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
  if (!halved && TUNE.siteBatch) add('bottle', 'b', TUNE.siteBatch);
  run.gear.forEach(g => {
    const G = GEARS[g];
    if (G.ids && !G.ids.includes(id)) return;
    const y = g === 'desiccator' ? 2 * run.money : g === 'notebook' ? 10 * new Set(cur.used).size : g === 'stock' ? 5 * run.grow.grades : (G.y || 0);
    if (y) add(g, 'y', y);
    if (G.b) add(g, 'b', G.b);
    if (G.x) add(g, 'x', G.x);
  });
  if (!dry && LEAVES[id] && has(run, 'coldtrap')) { run.grow.caught++; ev.push({ src: 'coldtrap', kind: 'catch', val: run.grow.caught, yield: cur.yield, batch: cur.batch }); }
  return ev;
}
// info describes a play: hot is true when one of its sites holds an atom the previous play made or changed,
// sig is the structure the play leaves behind, made lists the atoms it made or changed.
function linkOf(run, id, info) {
  const cur = run.cur, cont = !!(info && info.hot && info.sig && cur.path.length && !cur.seen.has(info.sig));
  const path = cont ? cur.path.concat(id) : [id];
  return { cont, len: path.length, path, route: cont ? matchRoute(path) : null };
}
const chainMult = (run, len) => 1 + ((TUNE.chain == null ? CHAIN : TUNE.chain) + (has(run, 'cannula') ? 0.25 : 0)) * (len - 1);
// the bottle has finished reacting at `hits` sites: equipment that works once per bottle, the chain and any route
// it completes, then the grade check
function playEnd(run, id, hits, dry, info) {
  const cur = run.cur, ev = [], add = adder(cur, ev);
  if (!hits) return ev;
  const link = linkOf(run, id, info);
  cur.path = link.path;
  if (has(run, 'syringe')) scoreSite(run, id, dry).forEach((e, k) => { if (!k) e.again = true; ev.push(e); });
  run.gear.forEach(g => {
    if (g === 'stirrer') add(g, 'b', 2);
    else if (g === 'schlenk' && hits >= 3) add(g, 'x', SCHLENK);
    else if (g === 'rotovap' && cur.step + 1 >= cur.stepsMax) add(g, 'x', 2);
  });
  if (link.cont) {
    if (TUNE.chainAdd != null) add('chain', 'b', TUNE.chainAdd * (link.len - 1)); else add('chain', 'x', chainMult(run, link.len));
    ev[ev.length - 1].len = link.len;
    if (has(run, 'cannula')) ev[ev.length - 1].gear = 'cannula';
    if (link.route) { add('route', 'x', routeMult(run, link.route.id)); ev[ev.length - 1].route = link.route.id; }
    if (!dry) { run.stats.chain = Math.max(run.stats.chain, link.len); if (link.route) run.routeDone[link.route.id] = (run.routeDone[link.route.id] || 0) + 1; }
  }
  if (!dry && hits > gradeOf(run, id)) { run.grade[id] = gradeOf(run, id) + 1; run.grow.grades++; ev.push({ src: 'bottle', kind: 'grade', val: run.grade[id], yield: cur.yield, batch: cur.batch }); }
  return ev;
}
// what the order would score after playing this bottle at n sites, without changing anything
function preview(run, id, n, info) {
  const cur = run.cur, y = cur.yield, b = cur.batch, path = cur.path;
  for (let i = 0; i < n; i++) scoreSite(run, id, true);
  playEnd(run, id, n, true, info);
  const s = scoreOf(cur);
  cur.yield = y; cur.batch = b; cur.path = path;
  return s;
}
const isHot = (cur, sites) => cur.path.length > 0 && sites.some(s => s.atoms.some(a => cur.fresh.has(a)));
// what playing this bottle on model m would do, without changing anything: sites, chain link, route and score
function look(run, m, id) {
  const cur = run.cur, card = RX.CARDS[id], all = card.find(m), none = { n: 0, spoils: 0, cont: false, len: 0, route: null, score: scoreOf(cur) };
  const n = all.filter(s => !touchesKeep(s)).length;
  none.spoils = all.length - n;
  if (!n) return none;
  const info = { hot: isHot(cur, all), sig: null };
  if (info.hot) { const c = RX.cloneModel(m); RX.runCard(c, card); info.sig = RX.sigOf(c); }
  const link = linkOf(run, id, info);
  return { n, spoils: all.length - n, info, cont: link.cont, len: link.len, route: link.route, score: preview(run, id, n, info) };
}
// applies a bottle to every site of m in place, without animation, and returns the info that commit needs
function react(run, m, id) {
  const card = RX.CARDS[id], sites = card.find(m), hot = isHot(run.cur, sites), made = [], gone = [];
  let hits = 0, spoiled = 0;
  sites.forEach(s => {
    if (!card.ok(m, s)) return;
    const sp = touchesKeep(s), r = card.apply(m, s);
    if (sp) { s.atoms.forEach(a => { a.keep = false; }); spoiled++; } else hits++;
    r.focus.concat(r.incoming).forEach(a => made.push(a));
    r.leaving.forEach(grp => gone.push(grp.slice())); r.leaving.flat().forEach(a => m.removeAtom(a));
  });
  return { hits, spoiled, hot, made, gone, sig: RX.sigOf(m) };
}
// records a played bottle after its sites have been scored
function commit(run, handIdx, hits, info) {
  const cur = run.cur, hc = cur.hand[handIdx], before = cur.log.length ? cur.log[cur.log.length - 1].score : 0;
  const ev = playEnd(run, hc.id, hits, false, info), score = scoreOf(cur);
  cur.fresh = new Set((info && info.made) || []); if (info && info.sig) cur.seen.add(info.sig);
  if (info && info.spoiled) cur.spoiled = true;
  cur.step++; cur.used.push(hc.id); cur.log.push({ id: hc.id, hits, score, pts: score - before });
  if (has(run, 'winchester') && !cur.back) cur.back = true;            // the bottle stays in the hand
  else { cur.hand.splice(handIdx, 1); cur.discard.push(hc.id); }
  fill(run);
  return { ev, score, gained: score - before };
}
// capping the marked group costs one step (none with the Protecting kit) and nothing else: the chain and the lit atoms stay as they were
function canCap(run, m) { const cur = run.cur; return !!cur.keep && !cur.spoiled && cur.step < cur.stepsMax && m.atoms.some(a => a.keep && !a.prot); }
function cap(run, m) { if (!canCap(run, m)) return null; const a = m.atoms.find(x => x.keep && !x.prot); a.prot = true; run.cur.capped = true; if (!run.mod.freeCap) run.cur.step++; return a; }
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
const keepMult = run => (run.cur.spoiled ? 0.5 : run.cur.keep && has(run, 'glovebox') ? 2 : 1);
const endMult = (run, p) => { const k = checks(run, p).n; return keepMult(run) * checkMult(run, k) * (has(run, 'seed') ? seedMult(run) + (k === 3 ? 0.5 : 0) : 1); };
const projected = (run, p) => Math.round(run.cur.yield * run.cur.batch * endMult(run, p));

// what the surplus now held will earn at the end of this order
const holdPay = run => Math.min(HOLD_CAP + gearSum(run, 'hold'), Math.floor(run.money / HOLD_PER));
const sellValue = (run, id) => Math.min(SELL_CAP, SELL + Math.max(0, run.n - (run.got[id] == null ? run.n : run.got[id])));
function endOrder(run, p) {
  const cur = run.cur, ck = checks(run, p), hit = ck.n === 3, ev = [], add = adder(cur, ev), y0 = cur.yield, b0 = cur.batch;
  if (hit) { run.grow.bonus++; run.stats.triple++; }
  if (cur.spoiled) add('kept', 'x', 0.5);
  if (ck.n) add('checks', 'x', checkMult(run, ck.n));
  if (has(run, 'seed') && seedMult(run) > 1) add('seed', 'x', seedMult(run));
  if (cur.keep && !cur.spoiled && has(run, 'glovebox')) add('glovebox', 'x', 2);
  const total = scoreOf(cur), pass = total >= cur.quota, picks = pass ? 1 + cur.extra : 0;
  const paid = { order: 0, steps: 0, stepsLeft: 0, doubles: 0, doubled: 0, held: 0 };
  if (pass) {
    paid.order = Math.max(0, PAY + run.mod.pay + (cur.large ? PAY_LARGE : 0) + gearSum(run, 'pay'));
    paid.stepsLeft = Math.max(0, cur.stepsMax - cur.step); paid.steps = paid.stepsLeft * PAY_STEP;
    paid.doubled = Math.min(DOUBLE_CAP, Math.floor(Math.log2(total / cur.quota))); paid.doubles = paid.doubled * PAY_DOUBLE;
    paid.held = holdPay(run);
  }
  const pay = paid.order + paid.steps + paid.doubles + paid.held;
  cur.done = true; cur.final = total; cur.hit = hit; cur.pass = pass;
  run.money += pay; run.stats.maxMoney = Math.max(run.stats.maxMoney, run.money);
  run.total += total; run.history.push({ n: cur.n, total, quota: cur.quota, hit, pass, large: cur.large, capped: !!cur.capped, kept: !!cur.keep && !cur.spoiled });
  if (!pass) run.over = true; else if (cur.n === ORDERS - 1) { run.over = true; run.won = true; }
  return { yield: y0, batch: b0, ev, checks: ck, mult: checkMult(run, ck.n), total, pass, hit, picks, pay, paid };
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
function take(run, opt) { if (opt.kind === 'gear') { if (run.gear.length < GEAR_SLOTS && !has(run, opt.id)) { run.gear.push(opt.id); run.got[opt.id] = run.n; } } else run.deck.push(opt.id); }
// moves a piece of equipment one place to the left on the bench, so it fires earlier
function moveGear(run, i) { if (i > 0 && i < run.gear.length) { const g = run.gear; [g[i - 1], g[i]] = [g[i], g[i - 1]]; } }

// ---------- the supply room between orders ----------
// two bottles, two pieces of equipment and one purification, which raises a bottle in the rack by one grade
function stock(run) {
  const ids = shuffle(run.r, RX.LIST.map(c => c.id)), items = [];
  items.push({ kind: 'bottle', id: ids[0], cost: 3 }, { kind: 'bottle', id: ids[1], cost: 3 });
  shuffle(run.r, GEAR.filter(g => !has(run, g.id) && !run.locked.has(g.id))).slice(0, 2).forEach(g => items.push({ kind: 'gear', id: g.id, cost: g.cost }));
  const own = pick(run.r, Array.from(new Set(run.deck)));
  items.push({ kind: 'grade', id: own, cost: 4 + gradeOf(run, own) });
  // one route to level up: one this run has already completed if there is one, otherwise one the rack can perform
  const fits = ROUTES.filter(r => routeFits(run, r)), done = fits.filter(r => run.routeDone[r.id]);
  const rt = done.length && run.r() < 0.7 ? pick(run.r, done) : fits.length ? pick(run.r, fits) : null;
  if (rt) items.push({ kind: 'route', id: rt.id, cost: 3 + routeLevel(run, rt.id) });
  run.shop = { items, reroll: run.shop && run.shop.open ? run.shop.reroll : REROLL, open: true };
  return run.shop;
}
const canBuy = (run, it) => !!it && !it.sold && run.money >= it.cost && (it.kind !== 'gear' || run.gear.length < GEAR_SLOTS);
function buy(run, i) {
  const it = run.shop && run.shop.items[i];
  if (!canBuy(run, it)) return false;
  run.money -= it.cost; it.sold = true;
  if (it.kind === 'grade') { run.grade[it.id] = gradeOf(run, it.id) + 1; run.grow.grades++; }
  else if (it.kind === 'route') run.routeLv[it.id] = routeLevel(run, it.id) + 1;
  else take(run, it);
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
  run.money += sellValue(run, id); run.gear.splice(i, 1); run.stats.maxMoney = Math.max(run.stats.maxMoney, run.money);
  return true;
}
function closeShop(run) { if (run.shop) run.shop.open = false; }

AA.rxRun = { TUNE, ORDERS, GEAR, GEARS, GEAR_SLOTS, QUOTA, LARGE, FEED, YIELD, RACKS, LEVELS, mods, UNLOCKS, CHECK_MULT, REMOVE, SELL, MIN_RACK, PAY_STEP, HOLD_PER, holdPay, sellValue,
  ROUTES, ROUTE, routeLevel, routeMult, routeSteps, routeFits, chainMult, look, react, playEnd, mark, cap, canCap, KEEP_FROM,
  newRun, beginOrder, chooseFeed, coverage, nextOrder, gradeOf, live, scoreOf, scoreSite, preview, commit, redraw,
  checks, checkMult, projected, endMult, endOrder, rewards, take, moveGear, has, pick, achieved, stock, canBuy, buy, reroll, removeBottle, sellGear, closeShop };
})(typeof globalThis !== 'undefined' ? globalThis : window);
