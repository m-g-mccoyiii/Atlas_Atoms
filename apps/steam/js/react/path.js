// Rules of a round played by choosing the product. Nothing here draws.
// An order offers some of the rack's reagents. Each bottle is one use and an order allows DIAL.steps reactions.
// A reagent reacts at every matching site. One group on the molecule is marked, and a batch delivered with it
// intact is multiplied. Equipment acts on the shared words of the game: site, step, chain link, loop, leaving group,
// first use, steps unused, marked group. No piece names a reagent, so any two pieces can work together.
// The main game does not load this file, so the dials set here do not change it.
(function (root) {
'use strict';
const AA = root.AA, RX = AA.rx, RUN = AA.rxRun;
const FEEDS = ['C=CCC(O)CC=C', 'CC(O)CCC=C', 'CC(=O)CCC(O)CC=C', 'C=CCC(O)CC(O)CC=C', 'C=CCC(=O)CCC(=O)CC=C', 'CC(O)CC(=O)CCC(Cl)CCC=C',
  // rings, and a benzene ring that nothing here acts on
  'O=C1CCC(CC=C)CC1', 'C=CCC(O)C1=CC=CC=C1', 'C=CC1CCC(O)CC1', 'CC(=O)CCC(O)C1=CC=CC=C1',
  // cages and a sugar: a cube with two handles, adamantanol, a bridged ring, glucose
  'C=CC12C3C4C1C5C2C3C45CO', 'OC1C2CC3CC(C2)CC1C3', 'OC1CC2CC1C=C2', 'OCC1OC(O)C(O)C(O)C1O',
  'OC1CCC(O)CC1', 'O=C1CCC(O)CC1C=C', 'OC(C=C)C1=CC=CC=C1', 'CC(O)CC(=O)C1=CC=CC=C1', 'OCC12C3C4C1C5C2C3C45CO', 'OC1CC2CCC1C=C2',
  'OCC(O)C(O)C(O)C(O)C=O', 'OCC1OC(O)CC1O', 'OCC(O)CO'];
// Families. Every starting molecule belongs to one, and each family scores by a rule of its own, so the molecule a
// round is played on decides how it is best played. The rule is paid on every reaction it fits.
//   chain: keeps a row going.  ring: comes back round to a form it has had.  arene: one exact change at a time.
//   sugar: many places at once.  cage: reacts by itself.
const KIN = {
  chain: { name: 'chain', tier: 0, odds: 38, col: '#5a6475', tok: '{r} +0.15', note: 'in a row', fx: c => (c.cont ? { part: 'r', op: 'add', val: 0.15 } : null) },
  ring: { name: 'ring', tier: 0, odds: 24, col: '#2f8f6a', tok: '{p} twice', note: 'a loop', fx: c => (c.loop ? { part: 'h', op: 'mul', val: 2 } : null) },
  arene: { name: 'arene', tier: 1, odds: 16, col: '#a8791a', tok: '{e} +0.2', note: 'one place', fx: c => (c.hits === 1 ? { part: 'e', op: 'add', val: 0.2 } : null) },
  sugar: { name: 'sugar', tier: 2, odds: 13, col: '#c0489a', tok: '{r} +0.2', note: 'each extra place', fx: c => (c.hits > 1 ? { part: 'r', op: 'add', val: 0.2 * (c.hits - 1) } : null) },
  // not a family to be dealt: a state any molecule can be built into. Every reaction multiplies extra, more per link.
  resonance: { name: 'resonance', tier: 0, odds: 0, col: '#b0189a', tok: '{e} times 1.05', note: 'every reaction', fx: () => ({ part: 'e', op: 'mul', val: 1.05 }) },
  cage: { name: 'cage', tier: 3, odds: 9, col: '#c8261c', tok: '{e} +0.3', note: 'a free reaction', fx: c => (c.free ? { part: 'e', op: 'add', val: 0.3 } : null) }
};
const KIN_OF = {};
[['chain', 0, 6], ['ring', 6, 7], ['arene', 7, 8], ['ring', 8, 9], ['arene', 9, 10], ['cage', 10, 13], ['sugar', 13, 14], ['ring', 14, 16], ['arene', 16, 18], ['cage', 18, 20], ['sugar', 20, 23]].forEach(q => { for (let k = q[1]; k < q[2]; k++) KIN_OF[FEEDS[k]] = q[0]; });
// The families a molecule belongs to as it stands, each with a level. A molecule the player has built into a ring, or
// into several things at once, is paid by every rule that fits, and a rule is paid more the more of that thing there is.
function kinsOf(m) {
  const s = RX.shapeOf(m), out = [], cap = n => Math.min(3, n);
  if (s.cage) out.push({ id: 'cage', lv: 1 });
  if (s.ring && !s.cage) out.push({ id: 'ring', lv: cap(s.ring) });
  if (s.arene) out.push({ id: 'arene', lv: cap(s.arene) });
  if (s.oh >= 3) out.push({ id: 'sugar', lv: cap(Math.floor(s.oh / 3)) });
  if (!out.length) out.push({ id: 'chain', lv: 1 });
  if (s.conj) out.push({ id: 'resonance', lv: Math.min(6, s.conj) });
  return out;
}
const kinOf = feed => (typeof feed === 'string' && KIN_OF[feed]) || 'chain';
// keep: batch multiplier at delivery when the marked group is intact. steps: reactions allowed in one order.
const DIAL = { keep: 3, steps: 3 };
RUN.TUNE.chain = 0.1; RUN.TUNE.route = 0.25; RUN.TUNE.siteBatch = 0;
// reagents whose reaction makes a group leave the molecule
// What a molecule does to itself once it has been set off, with no reagent held: opened by how deep the suppliers go.
const SELF = [{ id: 'cyclize', tier: 0 }, { id: 'aromatize', tier: 1 }, { id: 'snap', tier: 2 }];
const LEAVES = { aromatize: 1, cyclize: 1, pcc: 1, dehydrate: 1, socl2: 1, koh: 1, naoh: 1, wittig: 1, wolff: 1 };
// What leaves a molecule in a reaction, by what it is made of.
const byKind = grp => { const k = grp.map(a => a.el).sort().join(''); return k === 'HHO' ? 'water' : k === 'HH' ? 'h2' : k === 'O' ? 'oxide' : k.includes('Cl') ? 'chloride' : 'other'; };
// Equipment that catches a by-product as it leaves, and what that adds. A by-product nothing catches is collected
// if it is water or hydrogen: three of either can be spent. Every by-product also adds a stroke to the tally.
const CATCH = (() => { const A = (part, val) => ({ part, op: 'add', val }), M = (part, val) => ({ part, op: 'mul', val }); return { coldtrap: { water: A('e', 0.12) }, bunsen: { h2: A('r', 0.5) }, candle: { h2: A('e', 0.25) }, litmus: { chloride: A('e', 0.4) }, regia: { any: M('e', 1.02) },
  dryer: { water: A('p', 60) }, sieves: { water: A('r', 0.6) }, hood: { any: A('e', 0.06) }, scrubber: { h2: A('p', 50), chloride: A('p', 80), oxide: A('p', 80) } }; })();
// a reagent found by doing counts for the whole row it stands for: its places count this many times and the row gets the name's bonus
const SHORT = { wacker: 3, wolff: 4 };
const BY = { need: 3, tally: 1e9, pay: 50 };
// spends three of what has been collected. Water gives one more reaction on this page. Hydrogen gives every reagent on the page one more use.
function spendBy(g, kind, rnd) {
  if (!g.by || g.by[kind] < BY.need || g.over) return false;
  g.by[kind] -= BY.need;
  if (kind === 'water') g.more = (g.more || 0) + 1;
  else g.kinds.forEach(id => { g.left[id] = (g.left[id] || 0) + 1; });
  return true;
}
// How rare a reagent is. A rarer one turns up less often among the three to take and adds more for each place.
// odds: weight among the reagents on offer.  place: what each place it changes adds.  dots: how it is marked.
const RARITY = { common: { odds: 60, place: 20, dots: 1, col: '#5a564e' }, uncommon: { odds: 28, place: 30, dots: 2, col: '#1f5fbf' }, rare: { odds: 10, place: 45, dots: 3, col: '#b0189a' }, legend: { odds: 2, place: 70, dots: 4, col: '#c8891a' } };
const TIER = { snap: 'rare', aromatize: 'rare', cyclize: 'uncommon', hcl: 'uncommon', koh: 'uncommon', socl2: 'uncommon', naoh: 'uncommon', memgbr: 'uncommon', wittig: 'uncommon', wacker: 'rare', wolff: 'rare', aibn: 'legend' };
const rarityOf = id => RARITY[TIER[id] || 'common'];
// Kinds of chemistry opened between runs with credit. Each adds its reagents to what any run can turn up.
const FAMILIES = [
  { id: 'metal', name: 'organometallics', cost: 5, reagents: ['memgbr'] },
  { id: 'ylide', name: 'ylides', cost: 8, reagents: ['wittig'] },
  { id: 'radical', name: 'radicals', cost: 14, reagents: ['aibn'] }
];
// A named row done for the first time adds the reagent that does it in one step to what any run can turn up.
const FOUND = { ketone: 'wacker', removal: 'wolff' };

// Equipment. site(c) fires for every site that reacts, step(c) once for every reaction, end(c) at delivery.
// Each returns [kind, value] or null: y adds yield, b adds batch, x multiplies batch. note is what is pencilled under it.
// c: hits, cont (the step continued a chain), len (links in the chain so far), loop (the product is a molecule the
// order has held before), leaves, first (first use of this reagent on the order), unused (steps not taken), kept, lost.
// What a round makes is three numbers multiplied together: places, row and extra.
//   places: every place a reagent changes adds to it.
//   row: goes up with every reaction that follows on from the last, and starts again when the row breaks.
//   extra: starts at 1 and is raised only by equipment, rare reagents and the finishing reagent.
// Each piece of equipment feeds one of the three. at: 'site' fires for every place, 'step' once for every reaction.
// fx returns what it does, or nothing. part 'p' is places, 'h' is the places of this reaction alone, 'r' is row, 'e' is extra.
// c: hits, cont (this reaction follows on), len (reactions in the row so far), loop (back to an earlier molecule),
// leaves, first (reagent not yet used this round), nth, page, pageStep, pageMax, cls, same, distinct.
const A = (part, val) => ({ part, op: 'add', val }), M = (part, val) => ({ part, op: 'mul', val });
const GEAR = [
  // places
  { id: 'balance', tok: '{p} +15', fam: 'places', note: 'each place: +15 places', name: 'balance', shape: 'box', at: 'site', fx: () => A('p', 15) },
  { id: 'spatula', tok: '{p} +90', fam: 'places', note: 'only one place changed: +90 places', name: 'spatula', shape: 'column', at: 'step', fx: c => (c.hits === 1 ? A('p', 90) : null) },
  { id: 'schlenk', tok: '{p} double', fam: 'places', note: '2 or more places at once: that reaction counts double', name: 'schlenk line', shape: 'flask', at: 'step', fx: c => (c.hits >= 2 ? M('h', 2) : null) },
  { id: 'duck', tok: '{e} +0.01', fam: 'extra', note: 'says nothing. extra +0.01 for every reaction it has watched this round', name: 'rubber duck', shape: 'round', at: 'step', fx: c => A('e', 0.01 * c.nth) },
  { id: 'poster', tok: '{r} +0.5', fam: 'row', note: 'the first reaction of a round: row +0.5. nothing after', name: 'poster', shape: 'box', at: 'step', fx: c => (c.nth === 1 ? A('r', 0.5) : null) },
  { id: 'coffee', tok: '+1 then -1', fam: 'rule', rule: true, note: 'one more reaction on pages one and two. one fewer after', name: 'coffee', shape: 'round' },
  { id: 'coat', tok: 'copy', fam: 'rule', note: 'copies the piece to its left', name: 'lab coat', shape: 'box' },
  { id: 'milk', tok: '{e} +0.1', fam: 'extra', note: 'expired. it grows: extra +0.1 at the start of a round for every round it has been kept', name: 'expired milk', shape: 'box' },
  { id: 'mystery', tok: '+1 unknown', fam: 'rule', rule: true, note: 'a reagent from anywhere, a different one on every page', name: 'unlabeled bottle', shape: 'column' },
  { id: 'goggles', tok: 'pays 1', fam: 'rule', rule: true, note: 'on forehead. protects nothing. pays 1 credit for every round beaten', name: 'goggles', shape: 'round' },
  { id: 'grant', tok: 'pays 5', fam: 'rule', rule: true, note: 'funded only if a round is beaten ten times over: pays 5 credit', name: 'grant proposal', shape: 'box' },
  { id: 'extinguisher', tok: 'times 1.5', fam: 'rule', rule: true, note: 'a click during a chain stops it and the round counts half again. once a round', name: 'extinguisher', shape: 'column' },
  { id: 'intern', tok: '+1 free', fam: 'rule', rule: true, note: 'does one reaction of its own choosing on every new page. it is not always a good one', name: 'the intern', shape: 'column' },
  { id: 'stopper', tok: '{p} times 4', fam: 'places', note: 'the first reaction of a new row counts four times', name: 'stopper', shape: 'funnel', at: 'step', fx: c => (!c.cont ? M('h', 4) : null) },
  { id: 'mirror', tok: '{p} +200', fam: 'places', note: 'back to an earlier molecule: +200 places', name: 'mirror', shape: 'box', at: 'step', fx: c => (c.loop ? A('p', 200) : null) },
  { id: 'mortar', tok: '{p} times 2.5', fam: 'places', note: '3 or more places at once: that reaction counts two and a half times', name: 'mortar', shape: 'round', at: 'step', fx: c => (c.hits >= 3 ? M('h', 2.5) : null) },
  // row
  { id: 'cannula', tok: '{r} +1', fam: 'row', note: 'each reaction in a row: row +1', name: 'cannula', shape: 'column', at: 'step', fx: c => (c.cont ? A('r', 1) : null) },
  { id: 'reflux', tok: '{r} times 1.06', fam: 'row', note: '3 or more in a row: row times 1.06', name: 'reflux', shape: 'column', at: 'step', fx: c => (c.cont && c.len >= 3 ? M('r', 1.06) : null) },
  { id: 'burette', tok: '{r} +1.5', fam: 'row', note: 'first reaction on a page: row +1.5', name: 'burette', shape: 'column', at: 'step', fx: c => (c.pageStep === 0 ? A('r', 1.5) : null) },
  { id: 'clamp', tok: '{r} most kept', fam: 'row', rule: true, note: 'a broken row keeps three quarters', name: 'clamp', shape: 'column' },
  { id: 'magnet', tok: '{r} from 2.5', fam: 'row', rule: true, note: 'row never starts below 2.5', name: 'magnet', shape: 'round' },
  { id: 'recycler', tok: '{r} +0.5', fam: 'row', note: 'back to an earlier molecule: row +0.5', name: 'recycler', shape: 'flask', at: 'step', fx: c => (c.loop ? A('r', 0.5) : null) },
  // extra
  { id: 'stirrer', tok: '{e} +0.1', fam: 'extra', note: 'each reaction: extra +0.1', name: 'stir plate', shape: 'box', at: 'step', fx: () => A('e', 0.1) },
  { id: 'cards', tok: '{e} +0.25', fam: 'extra', note: 'a reagent not yet used this round: extra +0.25', name: 'index cards', shape: 'box', at: 'step', fx: c => (c.first ? A('e', 0.25) : null) },
  { id: 'logbook', tok: '{e} +0.02', fam: 'extra', note: 'each reaction: extra +0.02 for every different reagent used', name: 'log book', shape: 'box', at: 'step', fx: c => A('e', 0.02 * c.distinct) },
  { id: 'crystal', tok: '{e} times 1.2', fam: 'extra', note: 'back to an earlier molecule: extra times 1.2', name: 'seed crystal', shape: 'round', at: 'step', fx: c => (c.loop ? M('e', 1.2) : null) },
  { id: 'scalepan', tok: '{e} +0.5', fam: 'extra', note: 'a reaction that is not in a row: extra +0.5', name: 'brass weights', shape: 'round', at: 'step', fx: c => (!c.cont ? A('e', 0.5) : null) },
  { id: 'coldtrap', tok: '{e} +0.12', fam: 'extra', note: 'catches water that leaves: extra +0.12', name: 'cold trap', shape: 'funnel' },
  { id: 'dryer', tok: '{p} +60', fam: 'places', note: 'catches water that leaves: +60 places', name: 'drying tube', shape: 'column' },
  { id: 'sieves', tok: '{r} +0.6', fam: 'row', note: 'catches water that leaves: row +0.6', name: 'sieves', shape: 'round' },
  { id: 'hood', tok: '{e} +0.06', fam: 'extra', note: 'catches anything that leaves: extra +0.06', name: 'fume hood', shape: 'box' },
  { id: 'scrubber', tok: '{p} +50', fam: 'places', note: 'catches hydrogen that leaves: +50 places. an oxygen or a chloride: +80', name: 'scrubber', shape: 'column' },
  { id: 'bunsen', tok: '{e} times 1.4', fam: 'extra', note: 'same reagent twice running: extra times 1.4. burns hydrogen that leaves: row +0.5', name: 'burner', shape: 'funnel', at: 'step', fx: c => (c.same ? M('e', 1.4) : null) },
  { id: 'litmus', tok: '{e} +0.08', fam: 'extra', note: 'an acid: extra +0.08. catches a chloride that leaves: extra +0.4', name: 'litmus paper', shape: 'box', at: 'step', fx: c => (c.cls === 'acid' ? A('e', 0.08) : null) },
  { id: 'stopwatch', tok: '{e} +0.35', fam: 'extra', note: 'last reaction on a page: extra +0.35', name: 'stopwatch', shape: 'box', at: 'step', fx: c => (c.pageStep === c.pageMax - 1 ? A('e', 0.35) : null) },
  { id: 'thermometer', tok: '{e} +0.3', fam: 'extra', note: 'on page 3 and later: extra +0.3', name: 'thermometer', shape: 'column', at: 'step', fx: c => (c.page >= 3 ? A('e', 0.3) : null) },
  // pieces that change a rule of the round
  { id: 'carousel', tok: '+1 reagent', fam: 'rule', rule: true, note: 'one more reagent on every page', name: 'carousel', shape: 'round' },
  { id: 'dropper', tok: '+1 use', fam: 'rule', rule: true, note: 'one more use of every reagent', name: 'dropper', shape: 'funnel' },
  { id: 'loupe', tok: 'rare', fam: 'rule', rule: true, note: 'rare reagents twice as often', name: 'loupe', shape: 'flask' },
  { id: 'timer', tok: '+1 reaction', fam: 'rule', rule: true, note: 'a fourth reaction on every page', name: 'timer', shape: 'box' },
  // From the alchemist. These do things chemistry does not allow.
  { id: 'stone', tok: '{e} times 1.05', kin: 'alchemy', fam: 'extra', note: 'every reaction: extra times 1.05', name: "philosopher's stone", shape: 'round', at: 'step', fx: () => M('e', 1.05) },
  { id: 'transmute', tok: '{p} +40', kin: 'alchemy', fam: 'places', note: 'each place: +40 places', name: 'lead into gold', shape: 'box', at: 'site', fx: () => A('p', 40) },
  { id: 'regia', tok: '{e} times 1.02', kin: 'alchemy', fam: 'extra', note: 'dissolves anything that leaves: extra times 1.02', name: 'aqua regia', shape: 'flask' },
  { id: 'ouroboros', tok: '{r} unbroken', kin: 'alchemy', fam: 'row', rule: true, note: 'the row never breaks', name: 'ouroboros', shape: 'round' },
  { id: 'homunculus', tok: '{p} again', kin: 'alchemy', fam: 'places', rule: true, note: 'the last reaction on a page counts three times', name: 'homunculus, in a jar', shape: 'column' },
  { id: 'elixir', tok: '+1 page', kin: 'alchemy', fam: 'rule', rule: true, note: 'one more page in every round', name: 'elixir of life', shape: 'flask' },
  // From Brenda. Nobody asks.
  { id: 'voodoo', tok: '{p} twice', kin: 'occult', fam: 'places', note: 'three pins: the first three places a reaction changes count twice. takes a reagent use each page', name: 'voodoo doll', shape: 'round', at: 'site', fx: c => (c.hit < 3 ? M('h', 2) : null) },
  { id: 'tower', tok: '{r} times 2', kin: 'occult', fam: 'row', note: 'the first time a row would break each round, it holds and doubles', name: 'the Tower', shape: 'box', at: 'step', fx: c => (c.saved ? M('r', 2) : null) },
  { id: 'cat', tok: '{e} +0.13', kin: 'occult', fam: 'extra', note: 'crosses the path: a row that breaks leaves extra +0.13 for every reaction that was in it', name: 'black cat', shape: 'round', at: 'step', fx: c => (c.was > 0 ? A('e', 0.13 * c.was) : null) },
  { id: 'paw', tok: 'wish', kin: 'occult', fam: 'rule', rule: true, note: 'three wishes a run, one a round. a wish doubles the round and takes a reagent for good', name: "monkey's paw", shape: 'round' },
  { id: 'idol', tok: 'twice', kin: 'occult', fam: 'rule', rule: true, note: 'every other occult piece fires twice. every number to beat: times 1.5', name: 'cursed idol', shape: 'round' },
  { id: 'grimoire', tok: '{p} twice', kin: 'occult', fam: 'places', note: 'the last reaction on each page counts twice', name: 'grimoire', shape: 'box', at: 'step', fx: c => (c.pageStep === c.pageMax - 1 ? M('h', 2) : null) },
  { id: 'hourglass', tok: '+1 page', kin: 'occult', fam: 'rule', rule: true, note: 'sand from a grave: one more page. every number to beat: times 1.25', name: 'hourglass', shape: 'column' },
  { id: 'raven', tok: 'again', kin: 'occult', fam: 'rule', rule: true, note: 'nevermore: the last reagent used on a page comes back on the next', name: 'raven', shape: 'round' },
  { id: 'glory', tok: '{r} lit', kin: 'occult', fam: 'row', rule: true, note: 'hand of glory: on a broken row, equipment still fires as if the row held', name: 'hand of glory', shape: 'column' },
  { id: 'orb', tok: 'next', kin: 'occult', fam: 'rule', rule: true, note: 'crystal ball: shows which reagents the next page adds and drops', name: 'crystal ball', shape: 'round' },
  { id: 'ouija', tok: 'endless', kin: 'occult', fam: 'rule', rule: true, note: 'one reagent on every page does not run out', name: 'ouija board', shape: 'box' },
  { id: 'candle', tok: '{e} times 2', kin: 'occult', fam: 'extra', note: 'every 13th reaction of a round: extra times 2. lights hydrogen that leaves: extra +0.25', name: 'black candle', shape: 'column', at: 'step', fx: c => (c.nth % 13 === 0 ? M('e', 2) : null) },
  { id: 'goat', tok: '{e} times 1.07', kin: 'occult', fam: 'extra', note: 'every reaction: extra times 1.07. takes a reagent use each page', name: 'goat sacrifice', shape: 'round', at: 'step', fx: () => M('e', 1.07) },
  { id: 'pact', tok: 'times 3', kin: 'occult', fam: 'rule', rule: true, note: 'everything made: times 3. every number to beat: times 2', name: 'a signed pact', shape: 'box' }
];
const GEARS = {}; GEAR.forEach(q => { GEARS[q.id] = q; });

// offer: the reagents on the page for this order; the rest of the rack sits the order out
// keep: index of the oxygen that is marked, or null. gear: equipment ids, left to right
function begin(feed, relaxed, offer, keep, gear) {
  const run = RUN.newRun(7, {}); run.gear = [];
  RUN.beginOrder(run); RUN.chooseFeed(run, 0);
  const cur = run.cur, m = feed && feed.atoms ? RX.cloneMap(feed).model : relaxed ? AA.Model.fromSmilesRelaxed(feed, 4) : RX.fromSmiles(feed), left = {};
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
  return { model: cm.model, r, map: cm.map };
}
// reactions allowed on a page
const stepsOf = g => DIAL.steps + (g.syn && g.gear.includes('timer') ? 1 : 0) + (g.syn && g.gear.includes('coffee') ? ((g.page || 1) <= 2 ? 1 : -1) : 0) + (g.termSteps || 0) + (g.more || 0);
function options(g, free) {
  const cur = g.cur, out = {}, self = free && SELFMODE.auto ? (g.self || []).filter(id => !g.kinds.includes(id)) : [];
  if (!free && (g.syn ? g.pageSteps : g.trail.length) >= stepsOf(g)) return out;
  g.kinds.concat(self).forEach(id => {
    const own = self.includes(id); if (!own && !g.left[id]) return;
    const sites = RX.CARDS[id].find(g.m); if (!sites.length) return;
    const t = tryOne(g, g.m, id), r = t.r; if (!r.hits && !r.spoiled) return;
    const loop = cur.seen.has(r.sig), spoil = r.spoiled > 0;
    out[id] = { id, model: t.model, map: t.map, r, loop, spoil, self: own, cont: r.hits > 0 && (r.hot || own) && cur.path.length > 0 && (!loop || g.gear.includes('recycler')), atoms: sites.reduce((a, s) => a.concat(s.atoms), []) };
  });
  return out;
}
// What the molecule can do to itself as it stands, for the player to set going with a twist. No reagent is held or used.
const SELFMODE = { auto: false };
function selfOptions(g) {
  const out = []; if (g.over) return out;
  (g.self || []).forEach(id => { const sites = RX.CARDS[id].find(g.m); if (!sites.length) return; const t = tryOne(g, g.m, id), r = t.r; if (!r.hits) return; if (!g.kinds.some(k => RX.CARDS[k].find(t.model).length)) return;
    out.push({ id, model: t.model, map: t.map, r, loop: g.cur.seen.has(r.sig), spoil: false, self: true, cont: g.cur.path.length > 0, atoms: sites.reduce((a, q) => a.concat(q.atoms), []) }); });
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
  const cont = link.some(e => e.src === 'chain'), c = { hits: r.hits, cont, len: cur.path.length, loop, leaves: !!LEAVES[id], first, nth: cur.step + 1, page: g.page || 1, pageStep: g.pageSteps || 0, pageMax: stepsOf(g), cls: RX.CARDS[id].cls, same: cur.used[cur.used.length - 1] === id, distinct: new Set(cur.used.concat(id)).size };
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
function kitRound(n, rnd) { const R = rnd || Math.random, pool = GEAR.map(q => q.id), out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); return out; }
function kit(n, rnd) { const R = rnd || Math.random, pool = GEAR.map(q => q.id), out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); return out; }

// ---------- a round: one molecule carried through several pages ----------
// The molecule at the end of a page starts the next page. A reaction that acts on what the last reaction changed
// follows on, and the row goes up. A reaction that does not follow on breaks the row: what the row made is kept and
// the row starts again. Nothing made is ever taken away.
// The finishing reagent closes groups for good, so it is offered only on the last page and ends the round.
// every third reaction in a row gives the page one more reaction
const SYN = { strong: 2, streak: 3, pages: 3, offer: 5, uses: 2, finish: 'h2', finishExtra: 0.5, rare: 0.18, place: 20, row: 0.35 };
// Now and then a reagent on offer is a rare version for that page: double counts its places twice, strong adds 1
// to the row, plenty does not run out.
const RARE = ['double', 'strong', 'plenty'];
// Heavy atoms. Some atoms of a molecule that is dealt are a heavy isotope. A reaction at one adds to one of the
// three numbers. They stay on the molecule for as long as the atom does, so they can be reacted at again.
const ISO = { c13: { name: 'carbon-13', part: 'p', op: 'add', val: 60 }, o18: { name: 'oxygen-18', part: 'r', op: 'add', val: 1 }, c14: { name: 'carbon-14', part: 'e', op: 'mul', val: 1.25 } };
const ISOP = { c13: 0.1, c14: 0.02, o18: 0.2 };
function salt(m, rnd) { const R = rnd || Math.random, ar = RX.aromaticAtoms(m); m.atoms.forEach(a => { if (ar.has(a)) return; if (a.el === 'C') { const x = R(); if (x < ISOP.c14) a.iso = 'c14'; else if (x < ISOP.c14 + ISOP.c13) a.iso = 'c13'; } else if (a.el === 'O' && R() < ISOP.o18) a.iso = 'o18'; }); return m; }
// A brief changes what one round pays for, so a different set of equipment suits it. Every brief but the plain one
// asks for more and pays something when it is beaten.
const BRIEFS = [
  { id: 'plain', name: 'plain', note: '' },
  { id: 'carry', name: 'carry on', note: 'half the multiplier kept' },
  { id: 'broad', name: 'broad', note: 'points double, rows half' },
  { id: 'loose', name: 'loose', note: 'no rows' },
  { id: 'each', name: 'one of each', note: 'repeats make nothing' },
  { id: 'back', name: 'there and back', note: 'going back pays' },
  { id: 'scarce', name: 'scarce', note: '1 use' },
  { id: 'short', name: 'short', note: '2 pages' }
];
const BRIEF = {}; BRIEFS.forEach(b => { BRIEF[b.id] = b; });
const synRack = () => RX.LIST.map(c => c.id).filter(id => id !== SYN.finish && id !== 'aibn' && !Object.keys(FOUND).some(k => FOUND[k] === id));
const pagesOf = g => SYN.pages + (g.gear.includes('elixir') ? 1 : 0) + (g.gear.includes('hourglass') ? 1 : 0) + (g.termPages || 0) - (g.brief === 'short' ? 1 : 0);
// everything made so far: what closed rows made plus the open row, all times extra
const made = g => Math.round((g.bank + g.P * g.R) * g.E);
const held = g => Math.round(g.P * g.R * g.E);
const mult = g => g.R * g.E;
const rowStart = g => (g.gear.includes('magnet') ? 2.5 : 1);
function synDeal(g, rnd) {
  const R = rnd || Math.random, rack = g.rackIds || synRack(), live = rack.filter(id => RX.CARDS[id].find(g.m).length), n = SYN.offer + (g.gear.includes('carousel') ? 1 : 0); let offer = [];
  for (let t = 0; t < 40; t++) {
    const pool = rack.slice(); offer = [];
    while (offer.length < n && pool.length) offer.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
    if (offer.filter(id => live.includes(id)).length >= Math.min(2, live.length)) break;
  }
  if (g.fore) offer = g.fore.filter(id => rack.includes(id));
  g.fore = null; if (g.gear.includes('orb') && g.syn && (g.page || 1) < pagesOf(g)) { const pool = rack.slice(); g.fore = []; while (g.fore.length < n && pool.length) g.fore.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); g.fore = rack.filter(id => g.fore.includes(id)); }
  g.kinds = rack.filter(id => offer.includes(id)); g.left = {}; g.pageSteps = 0; g.more = 0; g.chain = false; g.fired = false;
  if (g.gear.includes('mystery')) { const all = RUNG.start.concat(...SUPPLY.map(q => q.reagents)).filter((id, i, a) => a.indexOf(id) === i && RX.CARDS[id] && !PAIR[id] && !g.kinds.includes(id) && RX.CARDS[id].find(g.m).length); if (all.length) g.kinds.push(all[Math.floor(R() * all.length)]); }
  if (g.back && RX.CARDS[g.back] && !g.kinds.includes(g.back)) g.kinds.push(g.back); g.back = null;
  g.kinds.forEach(id => { g.left[id] = (g.brief === 'scarce' || TIER[id] === 'rare' ? 1 : SYN.uses) + ((g.usesPlus && g.usesPlus[id]) || 0) + (g.gear.includes('dropper') ? 1 : 0) + (g.usesAll || 0); });
  g.rare = {}; g.kinds.forEach(id => { if (g.rareOn !== false && R() < SYN.rare * (g.gear.includes('loupe') ? 2 : 1) * (g.rareMul || 1)) { const t = RARE[Math.floor(R() * RARE.length)]; g.rare[id] = t; if (t === 'plenty') g.left[id] = 9; } });
  if (g.gear.includes('ouija') && g.kinds.length) { const id = g.kinds[Math.floor(R() * g.kinds.length)]; g.left[id] = 9; g.rare[id] = 'plenty'; }
  if ((g.gear.includes('goat') || g.gear.includes('voodoo')) && g.kinds.length) { const id = g.kinds[Math.floor(R() * g.kinds.length)]; g.left[id] = Math.max(1, g.left[id] - 1); }
}
function synBegin(feed, relaxed, rnd, gear, run) {
  const g = begin(feed, relaxed, [], null, gear || []);
  if (!(feed && feed.atoms)) salt(g.m, rnd);
  g.self = SELF.filter(q => q.tier <= ((run && run.tier) || 0)).map(q => q.id);
  g.kin = feed && feed.atoms ? ((run && run.kin) || 'chain') : kinOf(feed);
  g.brief = (run && run.brief) || 'plain'; g.by = (run && run.by) || { water: 0, h2: 0, gauge: 0 }; g.syn = true; g.page = 1; g.total = 0; g.over = false; g.pageSteps = 0; g.best = 0;
  g.P = 0; g.E = 1; g.bank = 0; g.grade = {}; g.gearLv = {}; g.R = rowStart(g); g.tally = { places: 0, loops: 0, kinds: 0, breaks: 0 };
  if (run) { g.grade = Object.assign({}, run.grade); g.gearLv = run.lv; g.usesPlus = run.uses; if (run.rack) g.rackIds = run.rack.slice(); g.rareOn = !!run.rare; g.usesAll = run.usesAll || 0; g.termSteps = run.steps || 0; g.termPages = run.pages || 0; g.rareMul = run.rareMul || 1; if (run.glass) { g.glass = true; g.E = 3; } if (run.term) { const C = CIRCLE[run.term] || CIRCLE.plain; g.ring = C.n; g.ringMul = C.mul; g.lit = 0; g.ringSet = []; } }
  if (g.brief === 'carry' && run && run.carryE) g.E = run.carryE;
  if (run && g.gear.includes('milk')) { run.milk = (run.milk || 0) + 1; g.E += 0.1 * run.milk; }
  synDeal(g, rnd);
  return g;
}
// closes the open row: what it made is kept, and the row starts again
function close(g) {
  g.chain = false; g.bank += g.P * g.R; g.P = 0;
  g.R = Math.max(rowStart(g), g.gear.includes('clamp') ? g.R * 0.75 : 1);
  g.lost = g.cur.path.length; g.cur.path = []; g.cur.fresh = new Set(); if (g.ringSet && g.lost > 0) { g.ringSet = g.ringSet.slice(0, -1); g.lit = g.ringSet.length; }
}
// true when this option would break the row that is open
const unbroken = g => g.gear.includes('ouroboros') || (g.gear.includes('tower') && !g.tower);
const breaks = (g, o) => g.cur.path.length > 0 && !o.cont && !unbroken(g);
// the longest named pair or longer that the row now ends on
function namedRow(path) {
  let best = null;
  RUN.ROUTES.forEach(r => { const n = r.seq.length, off = path.length - n; if (off < 0 || (best && best.seq.length >= n)) return; if (r.seq.every((alts, k) => alts.includes(path[off + k]))) best = r; });
  return best;
}
// Scores one reaction. Every change to places, row or extra is returned as an event, in the order it happened, so
// the page can replay it: the reagent at each place, then the row, then each piece of equipment.
function scoreRound(g, o, free) {
  const cur = g.cur, id = o.id, r = o.r, ev = [], loop = cur.seen.has(r.sig), first = !cur.used.includes(id); let h = 0;
  const emit = (src, fx, extra) => {
    if (!fx) return;
    const n = (GEARS[src] && g.gearLv[src]) || 1; let v = fx.val;
    if (n > 1) v = fx.op === 'mul' ? 1 + (v - 1) * n : v * n;
    if (fx.part === 'p') { if (fx.op === 'add') { g.P += v; h += v; } else g.P *= v; }
    else if (fx.part === 'h') { g.P += h * (v - 1); h *= v; }
    else if (fx.part === 'r') { if (fx.op === 'add') g.R += v; else g.R *= v; }
    else if (fx.op === 'add') g.E += v; else g.E *= v;
    ev.push(Object.assign({ src, part: fx.part, op: fx.op, val: v, P: g.P, R: g.R, E: g.E, made: made(g) }, extra || {}));
  };
  // the cursed idol fires every other occult piece a second time; the lab coat does what the piece to its left does
  const lit = () => (g.gear.includes('glory') && !c.cont && c.was > 0 ? Object.assign({}, c, { cont: true, len: c.was + 1 }) : c);
  const pieces = at => g.gear.forEach((q, i) => { const G = GEARS[q]; if (q === 'coat') { const L = GEARS[g.gear[i - 1]]; if (L && L.fx && L.at === at) emit('coat', L.fx(lit())); return; } if (G.fx && G.at === at) { emit(q, G.fx(lit())); if (G.kin === 'occult' && g.gear.includes('idol')) emit(q, G.fx(lit())); } });
  const saved = !o.cont && cur.path.length > 0 && !g.gear.includes('ouroboros') && unbroken(g);
  cur.path = o.cont || (cur.path.length > 0 && unbroken(g)) ? cur.path.concat(id) : [id];
  const was = o.cont ? 0 : g.lost || 0; g.lost = 0;
  const c = { hits: r.hits, saved, was, cont: o.cont, len: cur.path.length, loop, leaves: !!LEAVES[id], first, nth: cur.step + 1, page: g.page, pageStep: g.pageSteps, pageMax: stepsOf(g), cls: RX.CARDS[id].cls, same: cur.used[cur.used.length - 1] === id, distinct: new Set(cur.used.concat(id)).size };
  const b = g.brief, polyLen = id === 'aibn' ? Math.max(2, o.model.atoms.reduce((t, a) => t + (a.poly || 0), 0)) / 2 : 1, per = (id === 'aibn' ? SYN.place * polyLen : id === 'allyl' ? SYN.place : rarityOf(id).place) * (1 + SYN.strong * ((g.grade[id] || 1) - 1)) * (b === 'broad' ? 2 : 1) * (b === 'each' && !first ? 0 : 1);
  for (let i = 0; i < r.hits; i++) { c.hit = i; if (per) emit('bottle', A('p', per)); pieces('site'); }
  if (SHORT[id] && r.hits) { emit('short', M('h', SHORT[id])); emit('short', A('r', 0.5 * (SHORT[id] - 1))); }
  new Set(o.atoms || []).forEach(a => { const I = a.iso && ISO[a.iso]; if (I) emit('iso', { part: I.part, op: I.op, val: I.val }, { iso: a.iso }); });
  // what leaves: caught by equipment, or collected, and always a stroke on the tally. Five strokes pay places, more the longer the row
  (r.gone || []).forEach((grp, gi) => {
    const kind = byKind(grp); let caught = false;
    g.gear.forEach(q => { const fx = CATCH[q] && (CATCH[q][kind] || CATCH[q].any); if (fx) { emit(q, fx, { gone: gi, kind }); caught = true; } });
    if (!caught && (kind === 'water' || kind === 'h2')) { g.by[kind]++; ev.push({ src: 'collect', kind, gone: gi, part: 'p', op: 'add', val: 0, P: g.P, R: g.R, E: g.E, made: made(g) }); }
    g.by.gauge++; if (g.by.gauge >= BY.tally) { g.by.gauge -= BY.tally; emit('tally', A('p', BY.pay * Math.max(1, cur.path.length))); }
  });
  if (r.hits) kinsOf(o.model).forEach(q => { const fx = KIN[q.id].fx(Object.assign({ free: !!free }, c)); if (fx) emit('family', { part: fx.part, op: fx.op, val: fx.op === 'mul' ? 1 + (fx.val - 1) * q.lv : fx.val * q.lv }, { kin: q.id, lv: q.lv }); });
  if (o.cont && b !== 'loose') { emit('row', A('r', SYN.row * (b === 'broad' ? 0.5 : 1))); const nr = namedRow(cur.path); if (nr) emit('route', A('r', 0.5 * (nr.seq.length - 1)), { route: nr.id }); }
  pieces('step');
  if (b === 'loose') emit('brief', A('e', 0.3)); else if (b === 'each' && first) emit('brief', A('e', 0.5)); else if (b === 'back' && loop) emit('brief', A('e', 0.5));
  const rare = (g.rare && g.rare[id]) || null;
  if (rare === 'double') emit('rare', M('h', 2)); else if (rare === 'strong') emit('rare', A('r', 1));
  // the homunculus does the last reaction of the page a second time
  if (g.gear.includes('homunculus') && g.pageSteps === stepsOf(g) - 1) emit('homunculus', M('h', 3));
  g.tally.places += r.hits; if (loop) g.tally.loops++; if (first) g.tally.kinds++;
  if (g.ring) { if (!g.ringSet.includes(id)) g.ringSet = g.ringSet.concat(id); g.lit = g.ringSet.length; if (g.lit >= g.ring) { g.lit = 0; g.ringSet = []; emit('circle', { part: 'e', op: 'mul', val: g.ringMul }); } }
  return { ev, rare };
}
// What a reaction would do if it were taken now, without taking it: what it adds to each number, what it makes,
// whether it breaks the row and which pieces of equipment it sets off.
function peek(g, o) {
  const cur = g.cur, sv = { lit: g.lit, ringSet: g.ringSet, P: g.P, R: g.R, E: g.E, bank: g.bank, path: cur.path, fresh: cur.fresh, tally: Object.assign({}, g.tally), by: Object.assign({}, g.by) }, before = made(g), brk = breaks(g, o);
  if (brk) close(g);
  const sc = scoreRound(g, o); if (o.finish) g.E += SYN.finishExtra * o.r.hits;
  const out = { gain: made(g) - before, dP: g.P - (brk ? 0 : sv.P), dR: g.R - sv.R, dE: g.E - sv.E, breaks: brk, fires: sc.ev.filter(e => GEARS[e.src]).map(e => e.src) };
  g.lit = sv.lit; g.ringSet = sv.ringSet; g.P = sv.P; g.R = sv.R; g.E = sv.E; g.bank = sv.bank; cur.path = sv.path; cur.fresh = sv.fresh; g.tally = sv.tally; Object.assign(g.by, sv.by);
  return out;
}
// A chain reaction. When a row reaches three, the molecule is set off: every reaction that carries the row on then
// happens by itself, one after another, without using up the page's reactions, until nothing on the page carries
// it on or the reagents run out. free marks a reaction that happened that way.
// A row of three or more charges the page. Once the page's own reactions are used up, the player can set it off.
const charged = g => !g.fired && !g.over && g.cur.path.length >= SYN.streak && Object.keys(options(g, true)).some(id => options(g, true)[id].cont);
function fire(g) { if (!charged(g)) return false; g.chain = true; g.fired = true; return true; }
function chainNext(g) {
  if (!g.chain || g.over) return null;
  const o = options(g, true); let best = null, top = -1;
  Object.keys(o).forEach(id => { if (!o[id].cont) return; const v = peek(g, o[id]).gain; if (v > top) { top = v; best = o[id]; } });
  if (!best) g.chain = false;
  return best;
}
function synTake(g, o, free) {
  const cur = g.cur;
  const shatter = g.glass && breaks(g, o);
  if (breaks(g, o)) { close(g); g.tally.breaks++; }
  const hold = !o.cont && cur.path.length > 0 && !g.gear.includes('ouroboros') && unbroken(g);
  const sc = scoreRound(g, o, free); if (hold) g.tower = true;
  cur.fresh = new Set(o.r.made); cur.seen.add(o.r.sig); cur.step++; cur.used.push(o.id);
  g.left[o.id]--; g.m = o.model; if (!free) g.pageSteps++; g.best = Math.max(g.best, cur.path.length);
  const set = false;
  g.trail.push({ id: o.id, hits: o.r.hits, cont: o.cont, held: hold, ev: sc.ev, rare: sc.rare, set, free: !!free });
  if (shatter) synEnd(g);
}
// the fire extinguisher: stops a chain that is running; the round counts half again once the page is over
function douse(g) { if (!g.gear.includes('extinguisher') || !g.chain || g.doused) return false; g.chain = false; g.doused = 1; return true; }
const doused = g => { if (g.doused === 1) { g.E *= 1.5; g.doused = 2; } };
function turn(g, rnd) { doused(g); if (g.page >= pagesOf(g)) return false; g.page++; g.back = g.gear.includes('raven') ? g.cur.used[g.cur.used.length - 1] : null; synDeal(g, rnd); return true; }
// the finishing reagent, on the last page only
function finishOpt(g) {
  if (g.page < pagesOf(g) || !RX.CARDS[SYN.finish].find(g.m).length) return null;
  const t = tryOne(g, g.m, SYN.finish), r = t.r; if (!r.hits) return null;
  return { id: SYN.finish, model: t.model, map: t.map, r, finish: true, loop: false, spoil: false, cont: true, atoms: RX.CARDS[SYN.finish].find(g.m).reduce((a, x) => a.concat(x.atoms), []) };
}
// The monkey's paw: one wish a round, three a run. The round is doubled and a reagent is gone from the run for good.
// Returns the reagent taken, '' when the rack was too short to take from, or null when no wish was made.
function wish(g, run) {
  if (!g.gear.includes('paw') || g.wished || g.over || (run.wishes || 0) >= 3) return null;
  g.wished = true; run.wishes = (run.wishes || 0) + 1; g.E *= 2;
  if (run.rack.length <= 3) return '';
  const id = run.rack[Math.floor(Math.random() * run.rack.length)]; run.rack = run.rack.filter(q => q !== id); return id;
}
function synEnd(g) { doused(g); close(g); if (g.gear.includes('pact')) g.E *= 3; g.total = made(g); g.over = true; }
function synFinish(g, o) {
  g.left[SYN.finish] = 1; synTake(g, o);
  const v = SYN.finishExtra * o.r.hits; g.E += v;
  g.trail[g.trail.length - 1].ev.push({ src: 'finish', part: 'e', op: 'add', val: v, P: g.P, R: g.R, E: g.E, made: made(g) });
  synEnd(g);
}
// Plain players, used to set the number to beat and to measure styles of play.
//   row: follows on when it can.  wide: changes the most places.  back: returns to an earlier molecule when it can.
//   apart: avoids following on.  mixed: prefers a reagent not yet used.
const STYLES = {
  row: (o, ids) => { const c = ids.filter(i => o[i].cont); return c.length ? c : ids; },
  wide: (o, ids) => { const m = Math.max(...ids.map(i => o[i].r.hits)); return ids.filter(i => o[i].r.hits === m); },
  back: (o, ids) => { const c = ids.filter(i => o[i].loop); return c.length ? c : ids; },
  apart: (o, ids) => { const c = ids.filter(i => !o[i].cont); return c.length ? c : ids; },
  mixed: (o, ids, g) => { const c = ids.filter(i => !g.cur.used.includes(i)); return c.length ? c : ids; }
};
// greedy: takes whatever would make the most right now. It is the nearest thing here to a player who reads the page,
// and it is kept out of STYLES so that the numbers to beat are not set by it.
const GREEDY = (o, ids, g) => { let best = ids[0], top = -1; ids.forEach(id => { const v = peek(g, o[id]).gain; if (v > top) { top = v; best = id; } }); return [best]; };
function synPlay(feed, rnd, gear, run, style) {
  const g = synBegin(feed, false, rnd, gear, run), R = rnd || Math.random, pick = style === 'greedy' ? GREEDY : STYLES[style || 'row'];
  for (;;) {
    for (;;) {
      const o = options(g), ids = Object.keys(o); if (!ids.length) break;
      const from = pick(o, ids, g); let best = from[0];
      from.forEach(id => { if (o[id].r.hits > o[best].r.hits || (o[id].r.hits === o[best].r.hits && R() < 0.5)) best = id; });
      synTake(g, o[best]);
    }
    if (fire(g)) for (let c = chainNext(g); c; c = chainNext(g)) synTake(g, c, true);
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
// the number to beat climbs by growth each round up to the knee, then by late
const RUNG = { slots: 5, growth: 1.75, late: 1.5, knee: 3, first: 0.6, ask: 1, start: ['hydrate', 'pcc', 'allyl', 'dehydrate'] };
// Suppliers are opened between runs with credit. Each one adds reagents and equipment to what a run can turn up.
// A run pays one credit for every round beaten.
// A reagent that makes a halide is a dead end without a base to take the halide off again, so the two come as one pick.
const PAIR = { hcl: 'koh', socl2: 'naoh' };
const SUPPLY = [
  { name: 'corner chemist', cost: 0, reagents: ['bh3', 'cyclize', 'nabh4'], gear: ['balance', 'stirrer', 'cards', 'spatula', 'stopwatch', 'litmus', 'dryer', 'duck', 'poster', 'coffee', 'milk', 'goggles', 'intern'] },
  { name: 'trade supplier', cost: 6, kin: ['arene'], reagents: ['hcl', 'koh', 'aromatize'], gear: ['cannula', 'coldtrap', 'schlenk', 'burette', 'logbook', 'scalepan', 'stopper', 'hood', 'scrubber', 'coat', 'mystery', 'grant', 'extinguisher'] },
  { name: 'research supplier', cost: 16, kin: ['sugar'], reagents: ['socl2', 'naoh', 'snap'], gear: ['reflux', 'crystal', 'mortar', 'thermometer', 'bunsen', 'dropper', 'mirror', 'sieves'], rare: true },
  { name: 'instrument maker', cost: 30, kin: ['cage'], reagents: [], gear: ['clamp', 'magnet', 'recycler', 'carousel', 'loupe', 'timer'] },
  { name: 'an alchemist, by appointment', cost: 50, reagents: [], gear: ['stone', 'transmute', 'regia', 'ouroboros', 'homunculus', 'elixir'] },
  { name: 'Brenda (deceased)', cost: 80, reagents: [], gear: ['ouija', 'candle', 'goat', 'pact', 'voodoo', 'tower', 'cat', 'paw', 'idol', 'grimoire', 'hourglass', 'raven', 'glory', 'orb'] }
];
const stock = tier => { const o = { reagents: [], gear: [], rare: false }; SUPPLY.forEach((sp, i) => { if (i <= tier) { o.reagents.push(...sp.reagents); o.gear.push(...sp.gear); if (sp.rare) o.rare = true; } }); return o; };
const modelOf = feed => { const m = feed.atoms ? RX.cloneMap(feed).model : AA.Model.fromSmilesRelaxed(feed, 4); m.center(); return m; };
// what a plain player makes from a molecule under a brief, with the starting reagents and the style that suits it best
// Measured on 2026-11-10 with 12 plays for each style of play, chains included: the lower quarter of the best style. Measure again
// after any change to the rules of a round, or delete the table and it is measured as needed.
const BASE = {"C=CCC(O)CC=C|plain":46717,"C=CCC(O)CC=C|broad":57346,"C=CCC(O)CC=C|loose":128628,"C=CCC(O)CC=C|each":19351,"C=CCC(O)CC=C|back":82100,"C=CCC(O)CC=C|scarce":11647,"C=CCC(O)CC=C|short":6199,"CC(O)CCC=C|plain":13164,"CC(O)CCC=C|broad":61230,"CC(O)CCC=C|loose":26778,"CC(O)CCC=C|each":9422,"CC(O)CCC=C|back":30005,"CC(O)CCC=C|scarce":4163,"CC(O)CCC=C|short":4301,"CC(=O)CCC(O)CC=C|plain":95219,"CC(=O)CCC(O)CC=C|broad":119267,"CC(=O)CCC(O)CC=C|loose":119873,"CC(=O)CCC(O)CC=C|each":25331,"CC(=O)CCC(O)CC=C|back":123612,"CC(=O)CCC(O)CC=C|scarce":15047,"CC(=O)CCC(O)CC=C|short":14040,"C=CCC(O)CC(O)CC=C|plain":125004,"C=CCC(O)CC(O)CC=C|broad":375348,"C=CCC(O)CC(O)CC=C|loose":689711,"C=CCC(O)CC(O)CC=C|each":73971,"C=CCC(O)CC(O)CC=C|back":307476,"C=CCC(O)CC(O)CC=C|scarce":21483,"C=CCC(O)CC(O)CC=C|short":38726,"C=CCC(=O)CCC(=O)CC=C|plain":120876,"C=CCC(=O)CCC(=O)CC=C|broad":229641,"C=CCC(=O)CCC(=O)CC=C|loose":372693,"C=CCC(=O)CCC(=O)CC=C|each":34118,"C=CCC(=O)CCC(=O)CC=C|back":196268,"C=CCC(=O)CCC(=O)CC=C|scarce":21522,"C=CCC(=O)CCC(=O)CC=C|short":24318,"CC(O)CC(=O)CCC(Cl)CCC=C|plain":40767,"CC(O)CC(=O)CCC(Cl)CCC=C|broad":64359,"CC(O)CC(=O)CCC(Cl)CCC=C|loose":171168,"CC(O)CC(=O)CCC(Cl)CCC=C|each":41693,"CC(O)CC(=O)CCC(Cl)CCC=C|back":96619,"CC(O)CC(=O)CCC(Cl)CCC=C|scarce":7737,"CC(O)CC(=O)CCC(Cl)CCC=C|short":7737,"O=C1CCC(CC=C)CC1|plain":15405,"O=C1CCC(CC=C)CC1|broad":29111,"O=C1CCC(CC=C)CC1|loose":38573,"O=C1CCC(CC=C)CC1|each":2897,"O=C1CCC(CC=C)CC1|back":28539,"O=C1CCC(CC=C)CC1|scarce":4153,"O=C1CCC(CC=C)CC1|short":3835,"C=CCC(O)C1=CC=CC=C1|plain":350785,"C=CCC(O)C1=CC=CC=C1|broad":608832,"C=CCC(O)C1=CC=CC=C1|loose":138106,"C=CCC(O)C1=CC=CC=C1|each":47051,"C=CCC(O)C1=CC=CC=C1|back":367459,"C=CCC(O)C1=CC=CC=C1|scarce":22044,"C=CCC(O)C1=CC=CC=C1|short":62183,"C=CC1CCC(O)CC1|plain":9506,"C=CC1CCC(O)CC1|broad":16834,"C=CC1CCC(O)CC1|loose":19529,"C=CC1CCC(O)CC1|each":3416,"C=CC1CCC(O)CC1|back":18213,"C=CC1CCC(O)CC1|scarce":2536,"C=CC1CCC(O)CC1|short":3172,"CC(=O)CCC(O)C1=CC=CC=C1|plain":163960,"CC(=O)CCC(O)C1=CC=CC=C1|broad":411858,"CC(=O)CCC(O)C1=CC=CC=C1|loose":353614,"CC(=O)CCC(O)C1=CC=CC=C1|each":59117,"CC(=O)CCC(O)C1=CC=CC=C1|back":394617,"CC(=O)CCC(O)C1=CC=CC=C1|scarce":31981,"CC(=O)CCC(O)C1=CC=CC=C1|short":42086,"C=CC12C3C4C1C5C2C3C45CO|plain":58019,"C=CC12C3C4C1C5C2C3C45CO|broad":180651,"C=CC12C3C4C1C5C2C3C45CO|loose":25895,"C=CC12C3C4C1C5C2C3C45CO|each":4322,"C=CC12C3C4C1C5C2C3C45CO|back":118597,"C=CC12C3C4C1C5C2C3C45CO|scarce":4671,"C=CC12C3C4C1C5C2C3C45CO|short":20028,"OC1C2CC3CC(C2)CC1C3|plain":782,"OC1C2CC3CC(C2)CC1C3|broad":1035,"OC1C2CC3CC(C2)CC1C3|loose":2664,"OC1C2CC3CC(C2)CC1C3|each":1488,"OC1C2CC3CC(C2)CC1C3|back":1143,"OC1C2CC3CC(C2)CC1C3|scarce":587,"OC1C2CC3CC(C2)CC1C3|short":194,"OC1CC2CC1C=C2|plain":3907,"OC1CC2CC1C=C2|broad":4012,"OC1CC2CC1C=C2|loose":6406,"OC1CC2CC1C=C2|each":2806,"OC1CC2CC1C=C2|back":5230,"OC1CC2CC1C=C2|scarce":7555,"OC1CC2CC1C=C2|short":4905,"OCC1OC(O)C(O)C(O)C1O|plain":384411,"OCC1OC(O)C(O)C(O)C1O|broad":731756,"OCC1OC(O)C(O)C(O)C1O|loose":1591225,"OCC1OC(O)C(O)C(O)C1O|each":13081,"OCC1OC(O)C(O)C(O)C1O|back":610022,"OCC1OC(O)C(O)C(O)C1O|scarce":24460,"OCC1OC(O)C(O)C(O)C1O|short":96330,"OC1CCC(O)CC1|plain":35008,"OC1CCC(O)CC1|broad":65311,"OC1CCC(O)CC1|loose":101874,"OC1CCC(O)CC1|each":12915,"OC1CCC(O)CC1|back":55218,"OC1CCC(O)CC1|scarce":6692,"OC1CCC(O)CC1|short":11205,"O=C1CCC(O)CC1C=C|plain":20534,"O=C1CCC(O)CC1C=C|broad":26143,"O=C1CCC(O)CC1C=C|loose":33406,"O=C1CCC(O)CC1C=C|each":30883,"O=C1CCC(O)CC1C=C|back":35918,"O=C1CCC(O)CC1C=C|scarce":9348,"O=C1CCC(O)CC1C=C|short":13563,"OC(C=C)C1=CC=CC=C1|plain":327810,"OC(C=C)C1=CC=CC=C1|broad":578890,"OC(C=C)C1=CC=CC=C1|loose":119936,"OC(C=C)C1=CC=CC=C1|each":21514,"OC(C=C)C1=CC=CC=C1|back":130020,"OC(C=C)C1=CC=CC=C1|scarce":11405,"OC(C=C)C1=CC=CC=C1|short":20474,"CC(O)CC(=O)C1=CC=CC=C1|plain":57484,"CC(O)CC(=O)C1=CC=CC=C1|broad":178753,"CC(O)CC(=O)C1=CC=CC=C1|loose":76813,"CC(O)CC(=O)C1=CC=CC=C1|each":22631,"CC(O)CC(=O)C1=CC=CC=C1|back":191117,"CC(O)CC(=O)C1=CC=CC=C1|scarce":17554,"CC(O)CC(=O)C1=CC=CC=C1|short":13522,"OCC12C3C4C1C5C2C3C45CO|plain":346953,"OCC12C3C4C1C5C2C3C45CO|broad":322296,"OCC12C3C4C1C5C2C3C45CO|loose":368786,"OCC12C3C4C1C5C2C3C45CO|each":20613,"OCC12C3C4C1C5C2C3C45CO|back":203959,"OCC12C3C4C1C5C2C3C45CO|scarce":17353,"OCC12C3C4C1C5C2C3C45CO|short":43710,"OC1CC2CCC1C=C2|plain":2399,"OC1CC2CCC1C=C2|broad":6591,"OC1CC2CCC1C=C2|loose":5820,"OC1CC2CCC1C=C2|each":2041,"OC1CC2CCC1C=C2|back":9853,"OC1CC2CCC1C=C2|scarce":7555,"OC1CC2CCC1C=C2|short":4808,"OCC(O)C(O)C(O)C(O)C=O|plain":1665738,"OCC(O)C(O)C(O)C(O)C=O|broad":3267744,"OCC(O)C(O)C(O)C(O)C=O|loose":6039791,"OCC(O)C(O)C(O)C(O)C=O|each":40777,"OCC(O)C(O)C(O)C(O)C=O|back":2293284,"OCC(O)C(O)C(O)C(O)C=O|scarce":79060,"OCC(O)C(O)C(O)C(O)C=O|short":448840,"OCC1OC(O)CC1O|plain":35822,"OCC1OC(O)CC1O|broad":157417,"OCC1OC(O)CC1O|loose":357133,"OCC1OC(O)CC1O|each":2771,"OCC1OC(O)CC1O|back":149263,"OCC1OC(O)CC1O|scarce":5677,"OCC1OC(O)CC1O|short":20057,"OCC(O)CO|plain":270180,"OCC(O)CO|broad":520615,"OCC(O)CO|loose":1143279,"OCC(O)CO|each":9833,"OCC(O)CO|back":442688,"OCC(O)CO|scarce":14091,"OCC(O)CO|short":64407};
function briefBase(feed, brief) {
  const k = (feed.atoms ? RX.sigOf(feed) : feed) + '|' + brief; if (BASE[k]) return BASE[k];
  const run = { rack: RUNG.start, grade: {}, lv: {}, uses: {}, rare: false, brief }; let top = 0;
  Object.keys(STYLES).forEach(sty => { const a = []; for (let i = 0; i < 12; i++) a.push(synPlay(feed, null, [], run, sty)); a.sort((x, y) => x - y); top = Math.max(top, a[3]); });
  return (BASE[k] = Math.max(20, top));
}
// before each round: three rounds to choose from, each a molecule, a brief, a number to beat and what it pays
function runBriefs(run, rnd) {
  const R = rnd || Math.random, mix = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  const open = Object.keys(KIN).filter(k => KIN[k].tier <= (run.tier || 0)), draw = () => { let t = 0; open.forEach(k => { t += KIN[k].odds; }); let v = R() * t, pick = 'chain'; for (const k of open) { v -= KIN[k].odds; if (v < 0) { pick = k; break; } } return pick; };
  const feeds = []; for (let guard = 0; feeds.length < 3 && guard < 80; guard++) { const k = draw(), of = FEEDS.filter(f => KIN_OF[f] === k && !feeds.includes(f)); if (of.length && (open.length < 3 || !feeds.some(f => KIN_OF[f] === k))) feeds.push(of[Math.floor(R() * of.length)]); }
  while (feeds.length < 3) feeds.push(FEEDS[feeds.length]);
  const sp = mix(BRIEFS.filter(b => b.id !== 'plain' && b.id !== 'carry')), pay = mix([1, 2]);
  // the molecule left by the last round can be carried on with, while a reagent held still acts on it
  const carry = run.last && run.rack.filter(id => RX.CARDS[id].find(run.last).length).length >= 1;
  return [{ brief: carry ? 'carry' : 'plain', pays: null }, { brief: sp[0].id, pays: pay[0] }, { brief: sp[1].id, pays: pay[1] }].map((o, i) => { const own = o.brief === 'carry'; o.model = own ? run.last : salt(modelOf(feeds[i]), R); o.kin = own ? (run.kin || 'chain') : kinOf(feeds[i]); o.quota = runQuota(run, own ? run.last : feeds[i], o.brief); return o; });
}
function runChoose(run, o) { run.kin = o.kin || 'chain'; run.brief = o.brief; run.feed = o.model; run.quota = o.quota; run.pays = o.pays; run.carryE = 1 + ((run.lastE || 1) - 1) / 2; }
// keeps the molecule and the extra a beaten round ended on, for carrying on
function runKeep(run, g) { run.last = RX.cloneMap(g.m).model; run.lastE = g.E / (g.gear.includes('pact') ? 3 : 1); }
// pays the credit the brief promised and returns how much
function runPay(run) { const n = run.pays || 0; run.pays = null; run.bonus = (run.bonus || 0) + n; return n; }
function runNew(tier, extra) { const t = Math.max(0, Math.min(SUPPLY.length - 1, tier | 0)), st = stock(t); return { extra: (extra || []).slice(), round: 1, tier: t, rack: RUNG.start.slice(), rare: st.rare, gear: [], lv: {}, grade: {}, uses: {}, base: {}, beaten: 0, over: false, brief: 'plain', feed: FEEDS[0], pays: null, bonus: 0, by: { water: 0, h2: 0, gauge: 0 } }; }
const runBegin = (run, feed, relaxed) => synBegin(feed, relaxed, null, run.gear, run);
// the number to beat is measured against a plain player with the starting four reagents and nothing else
// Terms are chosen before a run, one sigil for the whole run. Each changes the odds or the stakes and pays for it.
// The transmutation circle under the molecule. A reagent lights a rune the first time it is used; using it again
// lights nothing. A broken row puts out the last rune. A full circle multiplies the round and starts again. So the
// reagent that keeps the row going and the reagent that feeds the circle are often not the same one.
const CIRCLE = { plain: { n: 4, mul: 1.5 }, glass: { n: 3, mul: 2 }, occult: { n: 4, mul: 1.5 }, lean: { n: 3, mul: 1.5 }, long: { n: 5, mul: 2.5 }, hoard: { n: 4, mul: 1.5 } };
const TERMS = [
  { id: 'plain', name: 'plain', note: 'no terms' },
  { id: 'glass', name: 'glass', note: 'mult starts at 3. a break ends it' },
  { id: 'occult', name: 'occult', note: 'an occult piece. beat times 1.5' },
  { id: 'lean', name: 'lean', note: 'three reagents, used once more' },
  { id: 'long', name: 'long', note: 'four reactions, two pages' },
  { id: 'hoard', name: 'hoard', note: 'three pieces now, none later' }
];
function runTerm(run, id) {
  run.term = id; run.stake = 1; run.payMul = 1;
  if (id === 'glass') run.glass = true;
  else if (id === 'occult') { const occ = Object.keys(GEARS).filter(k => GEARS[k].kin === 'occult' && k !== 'idol' && k !== 'pact'); run.gear.push(occ[Math.floor(Math.random() * occ.length)]); run.stake = 1.5; }
  else if (id === 'lean') { run.rack = RUNG.start.slice(0, 3); run.usesAll = 1; }
  else if (id === 'long') { run.steps = 1; run.pages = -1; }
  else if (id === 'hoard') { const pool = stock(run.tier).gear.slice(); for (let k = 0; k < 3 && pool.length; k++) run.gear.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); run.noGear = true; }
  return run;
}
function runQuota(run, feed, brief) {
  const br = brief || run.brief || 'plain';
  const q = briefBase(feed, br) * RUNG.first * (br === 'plain' || br === 'carry' ? 1 : RUNG.ask) * Math.pow(RUNG.growth, Math.min(run.round, RUNG.knee) - 1) * Math.pow(RUNG.late, Math.max(0, run.round - RUNG.knee)) * (run.gear.includes('pact') ? 2 : 1) * (run.gear.includes('idol') ? 1.5 : 1) * (run.gear.includes('hourglass') ? 1.25 : 1) * (run.stake || 1), mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(10, q))) - 1));
  return Math.max(50, Math.round(q / mag) * mag);
}
function runPicks(run, rnd) {
  const R = rnd || Math.random, any = a => a[Math.floor(R() * a.length)], st = stock(run.tier), out = [];
  const newR = st.reagents.concat(run.extra || []).filter(id => !run.rack.includes(id) && !Object.keys(PAIR).some(k => PAIR[k] === id)), newG = run.gear.length < RUNG.slots && !run.noGear ? st.gear.filter(id => !run.gear.includes(id)) : [];
  const from = { reagent: newR, gear: newG, level: run.gear.filter(id => !GEARS[id].rule), strong: run.rack, bottle: run.rack };
  // one new thing where there is one, then whatever else, three different kinds where possible
  let kinds = ['reagent', 'gear'].filter(k => from[k].length); for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = kinds[i]; kinds[i] = kinds[j]; kinds[j] = t; }
  const rest = ['strong', 'bottle', 'level'].filter(k => from[k].length); for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = rest[i]; rest[i] = rest[j]; rest[j] = t; }
  kinds = kinds.concat(rest).slice(0, 3);
  // a reagent is drawn by its odds, and each supplier opened makes the rarer ones a little likelier
  const drawR = list => { const w = list.map(id => rarityOf(id).odds * (rarityOf(id).odds < 60 ? 1 + 0.25 * run.tier : 1)); let x = R() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < list.length; i++) { x -= w[i]; if (x <= 0) return list[i]; } return list[list.length - 1]; };
  kinds.forEach(kind => out.push({ kind, id: kind === 'reagent' ? drawR(from[kind]) : any(from[kind]) }));
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = out[i]; out[i] = out[j]; out[j] = t; }
  return out;
}
function runTake(run, o) {
  if (o.kind === 'reagent') { [o.id, PAIR[o.id]].forEach(id => { if (id && !run.rack.includes(id)) run.rack.push(id); }); }
  else if (o.kind === 'gear') { if (run.gear.length < RUNG.slots && !run.gear.includes(o.id)) run.gear.push(o.id); }
  else if (o.kind === 'level') run.lv[o.id] = (run.lv[o.id] || 1) + 1;
  else if (o.kind === 'strong') run.grade[o.id] = (run.grade[o.id] || 1) + 1;
  else if (o.kind === 'bottle') run.uses[o.id] = (run.uses[o.id] || 0) + 1;
}
// one line saying what a pick does
function pickText(run, o) {
  if (o.kind === 'reagent') return PAIR[o.id] ? 'two new reactions for this run' : 'a new reaction for this run';
  if (o.kind === 'gear') return GEARS[o.id].note;
  if (o.kind === 'level') return 'level ' + ((run.lv[o.id] || 1) + 1) + ': ' + GEARS[o.id].note;
  if (o.kind === 'strong') return 'each place it changes: +' + rarityOf(o.id).place * SYN.strong + ' places';
  return 'one more use on every page';
}
AA.rxPath = { TERMS, CIRCLE, runTerm, wish, douse, SELFMODE, selfOptions, SELF, KIN, kinOf, kinsOf, charged, fire, chainNext, byKind, CATCH, BY, spendBy, RARITY, TIER, rarityOf, FAMILIES, FOUND, peek, PAIR, ISO, salt, runKeep, BRIEFS, BRIEF, runBriefs, runChoose, runPay, modelOf, briefBase, pagesOf, stepsOf, SUPPLY, stock, RUNG, runNew, runBegin, runQuota, runPicks, runTake, pickText, DIAL, FEEDS, GEAR, GEARS, OFFER: 4, begin, options, take, deliver, survey, deal, keeps, safe, kit,
  SYN, RARE, STYLES, kitRound, synRack, synBegin, synTake, synFinish, synEnd, synQuota, synPlay, held, made, mult, breaks, turn, finishOpt };
})(typeof globalThis !== 'undefined' ? globalThis : window);
