(function (root) {
'use strict';
const AA = root.AA, RX = AA.rx;

// The run: eight orders. Each order gives a feedstock, a quota and a bonus compound. Bottles come from a
// rack (the deck) into a hand. Meeting a quota lets the player take a bottle or a piece of equipment
// into the next order. Missing a quota ends the run. Nothing in this file touches the page, so the same
// code drives the game and the headless bot that the quotas were tuned with.

const ORDERS = 8, BASE = 100, STEPS = 5, HAND = 5, REDRAWS = 2, GEAR_SLOTS = 5;
const STARTER = ['hydrate', 'hydrate', 'pcc', 'pcc', 'nabh4', 'nabh4', 'dehydrate', 'dehydrate', 'h2', 'hcl'];
const TIER = [0, 0, 1, 1, 1, 2, 2, 2];
const QUOTA = [200, 400, 1100, 1500, 2000, 3400, 4400, 5500];
const FEED = [
  ['C=CCCCC', 'CC(O)CCC=C', 'C=CCCC=C', 'CC(=O)CCC=C', 'OCCCCC=C', 'CC(O)CCC(O)C'],
  ['C=CCC(O)CC=C', 'CC(O)CCC(O)CC=C', 'C=CCC(=O)CCC=C', 'C=CCC(O)CC(Cl)C', 'CC(=O)CCC(O)CC=C', 'C=CCCC(O)CCC=C'],
  ['C=CCC(O)CC(O)CC=C', 'C=CCC(=O)CCC(=O)CC=C', 'C=CCC(O)CC(O)CC(O)CC=C', 'C=CCCC(O)CCC(=O)CCC=C', 'CC(O)CC(=O)CCC(Cl)CCC=C']
];

// Equipment. One rule each. card: pay multiplier for named bottles.
const GEAR = [
  { id: 'deanstark', name: 'Dean–Stark trap', text: 'Dehydrate pays double.', card: { dehydrate: 2 } },
  { id: 'icebath', name: 'Ice bath', text: 'Reduce and Hydroborate pay double.', card: { nabh4: 2, bh3: 2 } },
  { id: 'dryingtube', name: 'Drying tube', text: 'Oxidise pays double.', card: { pcc: 2 } },
  { id: 'parr', name: 'Parr shaker', text: 'Hydrogenate pays triple.', card: { h2: 3 } },
  { id: 'scrubber', name: 'Gas scrubber', text: 'Add HCl and Chlorinate pay double.', card: { hcl: 2, socl2: 2 } },
  { id: 'mantle', name: 'Heating mantle', text: 'Eliminate and Substitute pay double.', card: { koh: 2, naoh: 2 } },
  { id: 'reflux', name: 'Reflux condenser', text: 'One more step on every order.', steps: 1 },
  { id: 'rack', name: 'Bottle carrier', text: 'Hold one more bottle in your hand.', hand: 1 },
  { id: 'funnel', name: 'Separating funnel', text: 'One more hand swap on every order.', redraws: 1 },
  { id: 'winchester', name: 'Winchester bottle', text: 'The first bottle you play on each order comes back to your hand.' },
  { id: 'column', name: 'Chromatography column', text: 'The bonus compound pays ×3 instead of ×2.', bonus: 3 },
  { id: 'balance', name: 'Analytical balance', text: 'Every site pays 25 more.', site: 25 },
  { id: 'rotovap', name: 'Rotary evaporator', text: 'From step 4 on, each step counts one higher.' },
  { id: 'notebook', name: 'Lab notebook', text: 'Every site pays 50 more for each different bottle already used on this order.' }
];
const GEARS = {};
GEAR.forEach(g => { GEARS[g.id] = g; });

// Conditions attached to orders 4 and 8.
const CONDS = [
  { id: 'acid', text: 'Acid bottles pay half', half: ['acid'] },
  { id: 'redox', text: 'Oxidants and hydrides pay half', half: ['oxidant', 'hydride'] },
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
let uid = 0;

function newRun(seed) {
  return { r: rng(seed == null ? (Math.random() * 4294967296) >>> 0 : seed), n: 0, total: 0, deck: STARTER.slice(), gear: [], fed: [], cur: null, over: false, won: false, history: [] };
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
    score: 0, used: [], log: [], kept: false, done: false, bonus: makeBonus(run, feed, feedSig, tier), bonusMult: Math.max(2, gearSum(run, 'bonus'))
  };
  fill(run);
  return run.cur;
}

// which step the next bottle counts as, and what one site pays for a given bottle on that step
function stepIndex(run) { const s = run.cur.step + 1; return s + (has(run, 'rotovap') && s >= 4 ? 1 : 0); }
function sitePoints(run, id) {
  const c = RX.CARDS[id], cur = run.cur;
  let per = BASE + gearSum(run, 'site'), mult = 1;
  if (has(run, 'notebook')) per += 50 * new Set(cur.used).size;
  run.gear.forEach(g => { const k = GEARS[g].card; if (k && k[id]) mult *= k[id]; });
  if (cur.cond && cur.cond.half && cur.cond.half.includes(c.cls)) mult *= 0.5;
  return Math.round(per * stepIndex(run) * mult);
}
// records a played bottle after its sites have reacted
function commit(run, handIdx, hits) {
  const cur = run.cur, hc = cur.hand[handIdx], per = sitePoints(run, hc.id), gained = per * hits;
  cur.score += gained; cur.step++; cur.used.push(hc.id); cur.log.push({ id: hc.id, hits, pts: gained });
  if (has(run, 'winchester') && !cur.kept) cur.kept = true;            // the bottle stays in the hand
  else { cur.hand.splice(handIdx, 1); cur.discard.push(hc.id); }
  fill(run);
  return { per, gained };
}
function redraw(run) {
  const cur = run.cur;
  if (cur.redraws <= 0) return false;
  cur.redraws--;
  cur.hand.forEach(c => cur.discard.push(c.id)); cur.hand = [];
  fill(run);
  return true;
}
const projected = (run, sig) => { const c = run.cur; return c.score * (c.bonus && sig === c.bonus.sig ? c.bonusMult : 1); };

function endOrder(run, sig) {
  const cur = run.cur, hit = !!cur.bonus && sig === cur.bonus.sig, mult = hit ? cur.bonusMult : 1, total = cur.score * mult, pass = total >= cur.quota;
  cur.done = true; cur.final = total; cur.hit = hit; cur.pass = pass;
  run.total += total; run.history.push({ n: cur.n, total, quota: cur.quota, hit, pass });
  if (!pass) run.over = true; else if (cur.n === ORDERS - 1) { run.over = true; run.won = true; }
  return { base: cur.score, mult, total, pass, hit };
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
function take(run, opt) { if (opt.kind === 'gear') run.gear.push(opt.id); else run.deck.push(opt.id); }

// ---------- headless bot: plays the bottle that pays most right now, takes rewards at random ----------
function bot(runs, seed, noFail) {
  const totals = Array.from({ length: ORDERS }, () => []), reached = new Array(ORDERS + 1).fill(0);
  let bonusHits = 0, orders = 0;
  for (let i = 0; i < runs; i++) {
    const run = newRun((seed || 1) + i * 7919);
    beginOrder(run);
    for (;;) {
      const cur = run.cur, m = RX.fromSmiles(cur.feed);
      while (cur.step < cur.stepsMax) {
        let best = -1, bp = 0;
        cur.hand.forEach((c, k) => { const p = RX.CARDS[c.id].find(m).length * sitePoints(run, c.id); if (p > bp) { bp = p; best = k; } });
        if (best < 0) { if (redraw(run)) continue; break; }
        const hits = RX.runCard(m, RX.CARDS[cur.hand[best].id]);
        commit(run, best, hits);
      }
      const res = endOrder(run, RX.sigOf(m));
      totals[cur.n].push(res.total); orders++; if (res.hit) bonusHits++;
      if (noFail) { run.over = cur.n === ORDERS - 1; }
      if (run.over) { reached[res.pass || noFail ? cur.n + 1 : cur.n]++; break; }
      take(run, pick(run.r, rewards(run)));
      nextOrder(run);
    }
  }
  const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };
  return { runs, filled: reached, bonusRate: orders ? bonusHits / orders : 0, perOrder: totals.map((a, n) => ({ order: n + 1, n: a.length, quota: QUOTA[n], p10: q(a, 0.1), p25: q(a, 0.25), p50: q(a, 0.5), p75: q(a, 0.75), p90: q(a, 0.9) })) };
}

AA.rxRun = { ORDERS, GEAR, GEARS, GEAR_SLOTS, QUOTA, FEED, newRun, beginOrder, nextOrder, stepIndex, sitePoints, commit, redraw, projected, endOrder, rewards, take, has, bot };
})(typeof globalThis !== 'undefined' ? globalThis : window);
