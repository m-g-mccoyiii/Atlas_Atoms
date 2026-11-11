// Rules of a round played by choosing the product. Nothing here draws.
// An order offers some of the rack's reagents. Each bottle is one use and an order allows DIAL.steps reactions.
// A reagent reacts at every matching site. One group on the molecule is marked, and a batch delivered with it
// intact is multiplied. Equipment acts on the shared words of the game: site, step, chain link, loop, leaving group,
// first use, steps unused, marked group. No piece names a reagent, so any two pieces can work together.
// The main game does not load this file, so the dials set here do not change it.
(function (root) {
'use strict';
const AA = root.AA, RX = AA.rx, RUN = AA.rxRun;
// the cascade game's versions of hydroborate and reduce (rules.js, MODE): neither wipes out every C=O at once
RX.MODE.zip = true;
// One source for every random draw on the run path: dealing, salt, picks, rounds on offer, rare reagents, wishes, terms.
// seed(n) makes every draw repeatable from n, so a whole run can be played again. seed() goes back to the system's.
let SRC = Math.random;
const rand = () => SRC();
function seed(n) {
  if (n == null) { SRC = Math.random; return; }
  let a = (n >>> 0) || 1;
  SRC = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// The molecules a round is dealt, each with its family. Every one is built to cascade with the six reagents a run
// starts with (docs/CASCADES.md): a chain that carries C=O three or four carbons apart, where a zip can run from one
// to the next, and an OH or something that can be made into one at an end. As dealt most zip one or two steps. The
// rest is behind gaps the player has to fix: an OH or a C=C where a C=O should be (the starting reagents fix those),
// or a stretch of six or eight carbons with more C=O beyond it, which takes a bridge, a weld, a snap or a new OH at
// the far end to reach. They get longer by round: FEEDSIZE says how many heavy atoms a round asks for and runBriefs
// deals from the molecules near that.
const FEED = [
  // chains
  // the first eight are for rounds one and two. Each has an OH that oxidize cannot take (three carbons on its carbon) or an
  // aldehyde end that reduce turns into one, and a spare C=C or two that hydrate and hydroborate can act on without harm,
  // so that most lines of three set the zip off (docs/RIG.md, the novice)
  ['chain', 'O=CCCC(=O)CCC=C'], ['chain', 'CC(C)(O)CCC(=O)CCC=C'], ['chain', 'C=CCC(C)(O)CCC(=O)CCC=C'], ['chain', 'O=CCCC(=O)CCC(=O)CCC=C'],
  ['chain', 'O=CCCC(C)(O)CCC(=O)CCC=C'], ['chain', 'C=CCCC(C)(O)CCC(=O)CCC=C'], ['chain', 'O=CCCC(=O)CCC(C)(O)CCC=C'], ['chain', 'C=CCCC(=O)CCC(=O)CCCC=O'],
  ['chain', 'CC(O)CCC(=O)CCC=CCCC(=O)C'], ['chain', 'CC(C)(O)C=CC=CCCCC=CC(=O)CCC(=O)C'], ['chain', 'CC(C)(O)CCC(=O)CCCCCC(=O)CCC(=O)C'], ['chain', 'CC(C)(O)CCC(=O)CCC(O)CCC(=O)CCC=C'],
  ['chain', 'C=CCCC(=O)CCC(=O)CCCCCC(O)CCC(=O)C'], ['chain', 'O=CCCC(=O)CCC(O)CCCCCC(=O)CCC(=O)C'], ['chain', 'CC(=O)CCC(=O)CCC(O)CCCCCC(=O)CCC(=O)C'], ['chain', 'C=CCCC(O)CCC(=O)CCCCCCCC(=O)CCC(=O)C'],
  ['chain', 'CC(C)(O)C=CC=CCCCC=CC(=O)CCC(=O)CCC(=O)C'], ['chain', 'CC(C)(O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C'], ['chain', 'C=CCCC(=O)CCC(=O)CCC(O)CCCCCC(=O)CCC(=O)CCC(=O)C'], ['chain', 'C=CCCC(=O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C'],
  ['chain', 'O=CCCC(=O)CCC(O)CCC(=O)CCCCCCCC(=O)CCC(=O)CCC=C'], ['chain', 'CC(C)(O)CCC(=O)CCC(O)CCC(=O)CCCCCC(=O)CCC(=O)CCC(=O)C'], ['chain', 'CC(=O)CCC(=O)CCC(=O)CCC(O)CCCCCCCC(=O)CCC(=O)CCC(=O)C'], ['chain', 'CC(C)(O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C'],
  // a ring of carbon on the chain, or a C=O in a ring
  ['ring', 'C=CCCC(=O)CC1CCCC1=O'], ['ring', 'C=CCCC(O)CCC(=O)C1CCCC1'], ['ring', 'OC1(CCCC1)CCC(=O)CCC=C'], ['ring', 'C=CCCC(=O)CCC1(O)CCCC1'], ['ring', 'OC1(CCCC1)CCC(=O)CCCC=O'], ['ring', 'O=CCCC(=O)CCC1(O)CCCC1'],
  ['ring', 'C=CCCC(=O)CCC(=O)CC1CCCC1=O'], ['ring', 'C=CCCC(O)CCC(=O)CCC1(O)CCCC1'], ['ring', 'OC1(CCCCC1)CCC(=O)CCC(O)CCC(=O)C'], ['ring', 'CC(=O)CCC(O)CC1CCC(CC1)CC(O)CCC(=O)C'],
  ['ring', 'OC1(CCCCC1)C=CC=CCCCC=CC(=O)CCC(=O)C'], ['ring', 'OC1(CCCCC1)CCC(=O)CCCCCC(=O)CCC(=O)C'], ['ring', 'CC(=O)CCC(=O)CCC1(O)CCCC1CCCCCC(=O)CCC(=O)C'], ['ring', 'C=CCCC(=O)CCC(O)CCC1(O)CCCC1CCC(=O)CCC(=O)C'],
  ['ring', 'CC(=O)CCC(=O)CCC(O)CC1CCC(CC1)CCC(=O)CCC(=O)C'], ['ring', 'OC1(CCCCC1)CCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C'], ['ring', 'OC1(CCCCC1)CCC(=O)CCC(O)CCC(=O)CCCCCC(=O)CCC(=O)CCC=C'], ['ring', 'OC1(CCCCC1)CCC=CCCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C'],
  // a benzene ring: an OH on it can start a zip and nothing takes it away
  ['arene', 'OC1=CC=CC=C1CCC(=O)CCC=C'], ['arene', 'OC1=CC=CC=C1CCC(=O)CCCC=O'], ['arene', 'OC1=CC=CC=C1CCC(O)CCC(=O)C'], ['arene', 'OC1=CC=CC=C1CCC(=O)CCC(=O)CCC=C'], ['arene', 'OC1=CC=CC=C1CCC(=O)CCC(O)C'], ['arene', 'C=CCCC(=O)CCC(=O)C1=CC=CC=C1'],
  ['arene', 'OC1=CC=CC=C1CCC(=O)CCC(O)CCC(=O)C'], ['arene', 'CC(=O)CCC(O)CCC(=O)C1=CC=C(C=C1)C(C)=O'], ['arene', 'C=CCCC(=O)CCC(O)CCC(=O)C1=CC=C(C=C1)C(C)=O'], ['arene', 'C=CCCC(O)CCC(=O)CCC(=O)C1=CC=C(C=C1)C(=O)CCC(=O)C'],
  ['arene', 'OC(C1=CC=CC=C1)C=CC=CCCCC=CC(=O)CCC(=O)CCC(=O)C'], ['arene', 'OC1=CC=CC=C1CCC(=O)CCC=CCCC=CCCC=CCCC(=O)C'], ['arene', 'OC1=CC=CC=C1CCC(=O)CCC(O)CCC(=O)CCCCCC(=O)CCC(=O)C'], ['arene', 'OC1=CC=CC=C1CCC(=O)CCC=CCCC=CCCC=CCCC=CCCC(=O)C'],
  ['arene', 'OC1=CC=CC=C1CCC(=O)CCC(O)CCC(=O)CCCCCCCC(=O)CCC(=O)C'], ['arene', 'OC1=CC=CC=C1CCC(=O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C'],
  // many OH: every one can be made a C=O at once
  ['sugar', 'CC(C)(O)CCC(O)CCC(O)C'], ['sugar', 'OCCCC(O)CCC(O)CCC=C'], ['sugar', 'CC(C)(O)CCC(O)CCC(O)CCC=C'], ['sugar', 'CC(C)(O)CCC(O)CCC(O)CCCCCC(O)CCC(=O)C'],
  ['sugar', 'OCCCC(O)CCC(O)CCC(O)CCCCCC(=O)CCC(=O)C'], ['sugar', 'CC(C)(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)C'], ['sugar', 'C=CCCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)C'], ['sugar', 'CC(C)(O)CCC(O)CCC(O)CCC(O)CCCCCC(O)CCC(O)CCC=C'],
  ['sugar', 'OCCCC(O)CCC(O)CCC(=O)CCCCCC(O)CCC(O)CCC(O)CCC=C'], ['sugar', 'C=CCCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)C'],
  // a cage at the end of the chain
  ['cage', 'OC1(CCC(=O)CCC=C)CC2CCC1C2'], ['cage', 'C=CCCC(=O)CCC(C)(O)C1CC2CCC1C2'], ['cage', 'CC(=O)CCC(=O)CCC(O)C1CC2CCC1C2'], ['cage', 'CC(O)CCC(=O)CCC(=O)C12C3C4C1C5C2C3C45'], ['cage', 'C=CCCC(=O)CCC(O)C12CC3CC(CC(C3)C1)C2'],
  ['cage', 'CC(C)(O)CCC=CCCC=CCCC=CCCC(=O)C12C3C4C1C5C2C3C45'], ['cage', 'CC(=O)CCC(=O)CCCCCC(=O)CCC(O)C12CC3CC(CC(C3)C1)C2'], ['cage', 'C=CCCC(=O)CCC(O)CCC(=O)CCCCCC(=O)C12C3C4C1C5C2C3C45'], ['cage', 'CC(C)(O)C=CC=CCCCC=CC(=O)CCC(=O)CCC(=O)C12C3C4C1C5C2C3C45'],
  ['cage', 'CC(=O)CCC(=O)CCCCCC(=O)CCC(O)CCC(=O)CCC(O)C12CC3CC(CC(C3)C1)C2']
];
const FEEDS = FEED.map(q => q[1]);
// heavy atoms of a molecule as it is dealt, read off its formula; what a round asks for; and how far off a molecule may be
const feedSize = smi => smi.replace(/Cl/g, 'X').replace(/[^A-Za-z]/g, '').length;
const FEEDSIZE = { rounds: [11.5, 14, 16.5, 19, 21.5, 24, 27, 31, 35], near: 3.5 };
const sizeFor = round => FEEDSIZE.rounds[Math.max(1, Math.min(9, round | 0)) - 1];
// the molecules of a family that suit a round: those near its size, or failing that the two nearest
function feedsFor(kin, round, skip) { const of = FEEDS.filter(f => KIN_OF[f] === kin && !(skip || []).includes(f)), t = sizeFor(round), near = of.filter(f => Math.abs(feedSize(f) - t) <= FEEDSIZE.near); return near.length ? near : of.sort((a, b) => Math.abs(feedSize(a) - t) - Math.abs(feedSize(b) - t)).slice(0, 2); }
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
  // It was 1.05 a link until 2026-11-10: at six links that is 1.3 a reaction, and it alone put the four phenyl molecules
  // four times above the rest and doubled the spread of a round.
  resonance: { name: 'resonance', tier: 0, odds: 0, col: '#b0189a', tok: '{e} times 1.02', note: 'every reaction', fx: () => ({ part: 'e', op: 'mul', val: 1.02 }) },
  cage: { name: 'cage', tier: 3, odds: 9, col: '#c8261c', tok: '{e} +0.3', note: 'a free reaction', fx: c => (c.free ? { part: 'e', op: 'add', val: 0.3 } : null) }
};
const KIN_OF = {}; FEED.forEach(q => { KIN_OF[q[1]] = q[0]; });
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
// Every molecule dealt can zip with the starting reagents, so none is kept out of round one any more.
const NOZIP = [];
const kinOf = feed => (typeof feed === 'string' && KIN_OF[feed]) || 'chain';
// keep: batch multiplier at delivery when the marked group is intact. steps: reactions allowed in one order.
const DIAL = { keep: 3, steps: 3 };
// Rules of a round that bound it and make a turn a choice. Each can be switched off (0 or false) to measure without it.
//   atoms: a reaction that would grow the molecule past this many heavy atoms is not offered.
//   chain: the most free reactions one overreact chain can run.
//   loops: how many times a round a return to an earlier form may carry a row on.
//   loopsAll: any player may do that. Off, only the recycler allows it.
//   ground: a reaction carries the row on when it acts on what any of the last this-many reactions of the row made.
//         0 or 1: only the last one.
//   uses: how many times a reagent can be used in a whole round. Pages and the free chain spend the same uses. 0: two a page.
//   fork: a chain that could go on with two or more reagents stops for the player to choose.
//   hand: how many reagents of the rack a page shows. 0: five, dealt again up to forty times until two of them act.
//   redraw: once a page the hand can be dealt again for one use of the fullest reagent in it.
//   bank: closing the open row on purpose pays this many times what it holds (2, on a row of 3 or more: measured with
//         the rig so that the bank is the right move on about three in ten of the circles where it could be placed).
//         It takes one of the page's reactions,
//         or ends a chain that is stopped at a fork. bankMin: the shortest row that can be banked.
//   tiers: marks above the number to beat, each this many times the number. The number stays the pass line.
//   coins: the currency of a run (see COIN). Off, nothing is paid and nothing can be spent.
//   cascade: after a reagent has acted ('each') or after the whole line has ('end'), every reaction the molecule has
//         with itself happens, one at a time, until none is left. Each step is worth more than the one before.
//         With it on there is no free chain of reagents, no fork and no chain limit. Off: the chain as it was.
//   queue: a page is lined up and then fired. Reagents (and the bank) are placed in the page's circles in order, and
//         the molecule then runs through them. One that finds nothing to act on when its turn comes is wasted and
//         still spends its use. The redraw is allowed only before firing. Off: one click, one reaction, as before.
const RULE = { atoms: 32, chain: 6, loops: 2, loopsAll: true, ground: 2, uses: 3, fork: true, hand: 5, redraw: true, bank: 1.5, bankMin: 2, tiers: [2, 4, 8], coins: true, queue: true };
RULE.bank = 2; RULE.bankMin = 3; RULE.cascade = 'each';
//   reopen: a ring closed by a zip is loose. When a page is turned (and when a round starts) every such ring opens
//         again, so the next page begins with the chain as it was set up and can be set off again, longer if the
//         player has added to it. Rings made by a weld or a snap, and a zip whose OH has since been taken off, stay shut.
//   ban: reagents and kinds of cascade that are never offered, for measuring a run without them.
//   weld: 'ol' or 'ene', what a weld leaves behind (rules.js MODE.weld).
//   fresh: only the steps of a cascade past the longest of the round's earlier pages are paid in full (CASC.old).
RULE.co2 = true; RULE.atoms = 56; RULE.reopen = true; RULE.ban = []; RULE.weld = 'ol'; RULE.fresh = true;
const heavy = m => { let n = 0; for (let i = 0; i < m.atoms.length; i++) if (m.atoms[i].el !== 'H') n++; return n; };
RUN.TUNE.chain = 0.1; RUN.TUNE.route = 0.25; RUN.TUNE.siteBatch = 0;
// reagents whose reaction makes a group leave the molecule
// What a molecule does to itself once it has been set off, with no reagent held: opened by how deep the suppliers go.
// With the cascade these happen by themselves. A run starts with the ones of tier 0; the others turn up on the
// take-one page once the supplier of their tier is open, and are active for the rest of the run once taken.
// docs/CASCADES.md: zip (the card lactol) is the first and only cascade a new player has. snap (the card snap6)
// comes with the research supplier and weld with the instrument maker. The other kinds (fold, run, link) are not built.
const SELF = [{ id: 'lactol', tier: 0 }, { id: 'snap6', tier: 2 }, { id: 'weld', tier: 3 }];
const SELF0 = SELF.filter(q => q.tier === 0).map(q => q.id);
// The cascade. Step n of a page is worth n times the first: it adds place for its one place and that counts n times,
// and it adds n times step to extra, which multiplies everything the round makes. So three steps on a page add 0.6
// to extra, six add 2.1 and ten add 5.5: a round of threes ends near 3 times a round with no cascade, a round of
// sixes near 7 times and a round of tens near 17 times. It adds and does not multiply (mul: it multiplied extra by
// 1 + n step until 2026-11-11; ten steps then multiplied a round by 1,100, and with the zip opening again on every
// page one long cascade decided a run). row: what a step adds to the row (a reagent that follows on adds SYN.row).
// Measured on one molecule of round eight: with step 0.01 a line that set off six steps made 4,800 and a line that
// set off none made 4,440, because three reagents on a long molecule change many places; the count has to pay more
// than that. most: a page stops cascading after this many steps, so that it cannot stall.
// old: a step that is not new pays this share. A step is new when the page has run past the longest cascade of any
// earlier page of the round (RULE.fresh). A chain that is standing opens and zips again on every page; fired again
// as it is, it pays a quarter. What the three reagents of a page are for is making it longer than it has been.
const CASC = { step: 0.1, place: 50, row: 0.1, mul: false, most: 40, old: 0.25 };
const LEAVES = { aromatize: 1, cyclize: 1, pcc: 1, dehydrate: 1, socl2: 1, koh: 1, naoh: 1, wittig: 1, wolff: 1, extend: 1, dione: 1, phenol: 1, rcm: 1, couple: 1 };
// What leaves a molecule in a reaction, by what it is made of.
const byKind = grp => { const k = grp.map(a => a.el).sort().join(''); return k === 'HHO' ? 'water' : k === 'HH' ? 'h2' : k === 'COO' ? 'co2' : k === 'O' ? 'oxide' : k.includes('Cl') ? 'chloride' : 'other'; };
// Equipment that catches a by-product as it leaves, and what that adds. A by-product nothing catches is collected
// if it is water or hydrogen: it goes to its jar (docs/JARS.md) and feeds the homunculus of the run.
const CATCH = (() => { const A = (part, val) => ({ part, op: 'add', val }), M = (part, val) => ({ part, op: 'mul', val }); return { coldtrap: { water: A('e', 0.12) }, candle: { h2: A('e', 0.25) }, litmus: { chloride: A('e', 0.4) }, regia: { any: M('e', 1.02) },
  dryer: { water: A('p', 60) }, sieves: { water: A('r', 0.6) }, hood: { any: A('e', 0.06) }, scrubber: { h2: A('p', 50), chloride: A('p', 80), oxide: A('p', 80) } }; })();
// a reagent found by doing counts for the whole row it stands for: its places count this many times and the row gets the name's bonus
const SHORT = { wacker: 3, wolff: 4 };
const BY = { tally: 1e9, pay: 50 };
// How rare a reagent is. A rarer one turns up less often among the three to take and adds more for each place.
// odds: weight among the reagents on offer.  place: what each place it changes adds.  dots: how it is marked.
const RARITY = { common: { odds: 60, place: 20, dots: 1, col: '#5a564e' }, uncommon: { odds: 28, place: 30, dots: 2, col: '#1f5fbf' }, rare: { odds: 10, place: 45, dots: 3, col: '#b0189a' }, legend: { odds: 2, place: 70, dots: 4, col: '#c8891a' } };
const TIER = { extend: 'uncommon', dione: 'rare', phenol: 'uncommon', couple: 'rare', rcm: 'rare', snap: 'rare', aromatize: 'rare', cyclize: 'uncommon', hcl: 'uncommon', koh: 'uncommon', socl2: 'uncommon', naoh: 'uncommon', memgbr: 'uncommon', wittig: 'uncommon', wacker: 'rare', wolff: 'rare', aibn: 'legend' };
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
  { id: 'mirror', tok: 'copies one side|across', fam: 'tool', five: true, rule: true, tool: true, note: 'copies one side across', name: 'mirror', shape: 'box' },
  { id: 'mortar', tok: '{p} times 2.5', fam: 'places', note: '3 or more places at once: that reaction counts two and a half times', name: 'mortar', shape: 'round', at: 'step', fx: c => (c.hits >= 3 ? M('h', 2.5) : null) },
  // row
  { id: 'cannula', tok: '{r} +1', fam: 'row', note: 'each reaction in a row: row +1', name: 'cannula', shape: 'column', at: 'step', fx: c => (c.cont ? A('r', 1) : null) },
  { id: 'reflux', tok: '{r} times 1.06', fam: 'row', note: '3 or more in a row: row times 1.06', name: 'reflux', shape: 'column', at: 'step', fx: c => (c.cont && c.len >= 3 ? M('r', 1.06) : null) },
  { id: 'burette', tok: '{r} +1.5', fam: 'row', note: 'first reaction on a page: row +1.5', name: 'burette', shape: 'column', at: 'step', fx: c => (c.pageStep === 0 ? A('r', 1.5) : null) },
  { id: 'clamp', tok: 'nothing changes|this part', fam: 'tool', rule: true, tool: true, note: 'nothing changes this part', name: 'clamp', shape: 'column' },
  { id: 'magnet', tok: 'pulls every gap|shut', fam: 'tool', five: true, rule: true, tool: true, whole: true, note: 'pulls every gap shut', name: 'magnet', shape: 'round' },
  { id: 'recycler', tok: '{r} +0.5', fam: 'row', note: 'back to an earlier molecule: row +0.5', name: 'recycler', shape: 'flask', at: 'step', fx: c => (c.loop ? A('r', 0.5) : null) },
  // extra
  { id: 'stirrer', tok: '{e} +0.1', fam: 'extra', note: 'each reaction: extra +0.1', name: 'stir plate', shape: 'box', at: 'step', fx: () => A('e', 0.1) },
  { id: 'cards', tok: '{e} +0.25', fam: 'extra', note: 'a reagent not yet used this round: extra +0.25', name: 'index cards', shape: 'box', at: 'step', fx: c => (c.first ? A('e', 0.25) : null) },
  { id: 'logbook', tok: '{e} +0.02', fam: 'extra', note: 'each reaction: extra +0.02 for every different reagent used', name: 'log book', shape: 'box', at: 'step', fx: c => A('e', 0.02 * c.distinct) },
  { id: 'crystal', tok: 'adds OH here|and zips', fam: 'tool', five: true, rule: true, tool: true, note: 'adds OH here and zips', name: 'seed crystal', shape: 'round' },
  { id: 'scalepan', tok: '{e} +0.5', fam: 'extra', note: 'a reaction that is not in a row: extra +0.5', name: 'brass weights', shape: 'round', at: 'step', fx: c => (!c.cont ? A('e', 0.5) : null) },
  { id: 'coldtrap', tok: '{e} +0.12', fam: 'extra', note: 'catches water that leaves: extra +0.12', name: 'cold trap', shape: 'funnel' },
  { id: 'dryer', tok: '{p} +60', fam: 'places', note: 'catches water that leaves: +60 places', name: 'drying tube', shape: 'column' },
  { id: 'sieves', tok: '{r} +0.6', fam: 'row', note: 'catches water that leaves: row +0.6', name: 'sieves', shape: 'round' },
  { id: 'hood', tok: '{e} +0.06', fam: 'extra', note: 'catches anything that leaves: extra +0.06', name: 'fume hood', shape: 'box' },
  { id: 'scrubber', tok: '{p} +50', fam: 'places', note: 'catches hydrogen that leaves: +50 places. an oxygen or a chloride: +80', name: 'scrubber', shape: 'column' },
  { id: 'bunsen', tok: 'every OH|becomes C=C', fam: 'tool', five: true, rule: true, tool: true, whole: true, note: 'every OH becomes C=C', name: 'burner', shape: 'funnel' },
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
// The pieces on offer (docs/PIECES.md). The sixty were made for the game before the cascade and most add a number.
// Five have been made again for this game. Each is a thing the player uses ON the molecule, once a round, while the
// page is being lined up (rules.js, tools). Three are put at a place the player chooses; two act on all of it.
//   mirror, on a bond: one side of the bond goes; the other is copied across it, joined to its own reflection.
//   burette, on the whole molecule: every C=C becomes a C=O (a drop on each).
//   seed crystal, on a carbon: a hydrogen there becomes an OH, and the molecule zips from it at once.
//   magnet, on the whole molecule: every stretch of four or more CH2 is pulled shut to two carbons.
//   burner, on the whole molecule: every OH loses water and becomes a C=C, all at once.
// Three more still do what they say and are passive: carousel (one more reagent in the hand), dropper (one more use),
// timer (a fourth circle). RULE.five: only these eight are offered, each from the supplier given here. Off: all sixty.
const FIVE = { crystal: 0, bunsen: 0, dropper: 0, magnet: 1, carousel: 1, mirror: 2, timer: 3 };
// The fifth piece. The clamp was the fifth and was taken out (the wood spirit homunculus does what it did). Three
// candidates are built (rules.js, tools) and RULE.fifth names the one on offer; fifthSet(id) swaps it, and
// fifthSet(null) offers none and puts the old number-adding piece of that name back.
const FIFTH = { balance: { tok: 'OH and C=O|trade places', note: 'OH and C=O trade places', whole: true },
  mortar: { tok: 'cuts this|ring bond', note: 'cuts this ring bond' },
  burette: { tok: 'every C=C|becomes C=O', note: 'every C=C becomes C=O', whole: true } }, FIFTH0 = {};
function fifthSet(id) {
  Object.keys(FIFTH0).forEach(k => { const G = GEARS[k]; Object.keys(G).forEach(f => { delete G[f]; }); Object.assign(G, FIFTH0[k]); delete FIFTH0[k]; delete FIVE[k]; });
  RULE.fifth = id && FIFTH[id] ? id : null; if (!RULE.fifth) return;
  const G = GEARS[id], F = FIFTH[id]; FIFTH0[id] = Object.assign({}, G); delete G.at; delete G.fx; Object.assign(G, { tok: F.tok, note: F.note, fam: 'tool', five: true, rule: true, tool: true, whole: !!F.whole }); FIVE[id] = 0;
}
fifthSet('burette');
// how many times a round a piece can be used on the molecule
const TOOLUSES = 1;
RULE.five = true;
// choose: before a round two molecules are shown and one is taken (docs/LOOP.md). Off: three kinds of round, as before.
RULE.choose = true;

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
  const size = RULE.atoms ? heavy(g.m) : 0, back = (RULE.loopsAll || g.gear.includes('recycler')) && (!RULE.loops || (g.loopsCont || 0) < RULE.loops);
  g.kinds.concat(self).forEach(id => {
    const own = self.includes(id); if (!own && !(g.left[id] > 0) && !(g.free && g.free[id])) return;
    const sites = RX.CARDS[id].find(g.m); if (!sites.length) return;
    const t = tryOne(g, g.m, id), r = t.r; if (!r.hits && !r.spoiled) return;
    // past the size limit a molecule can still change, but it cannot grow
    if (RULE.atoms) { const n = heavy(t.model); if (n > RULE.atoms && n > size) return; }
    const loop = cur.seen.has(r.sig), spoil = r.spoiled > 0;
    out[id] = { id, model: t.model, map: t.map, r, loop, spoil, self: own, cont: r.hits > 0 && (r.hot || own) && cur.path.length > 0 && (!loop || back), atoms: sites.reduce((a, s) => a.concat(s.atoms), []) };
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
  const R = rnd || rand, ks = keeps(feed), g = begin(feed, false);
  for (let t = 0; t < 60; t++) {
    const keep = ks.length ? ks[Math.floor(R() * ks.length)] : null, ok = safe(feed, keep), pool = g.all.slice(), out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
    if (out.filter(id => ok.includes(id)).length >= 2) return { offer: g.all.filter(id => out.includes(id)), keep };
  }
  return { offer: g.all, keep: null };
}
// n different pieces of equipment at random
// n different pieces that work inside a round: the ones that act on a site or on a reaction
function kitRound(n, rnd) { const R = rnd || rand, pool = GEAR.map(q => q.id), out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); return out; }
function kit(n, rnd) { const R = rnd || rand, pool = GEAR.map(q => q.id), out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); return out; }

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
function salt(m, rnd) { const R = rnd || rand, ar = RX.aromaticAtoms(m); m.atoms.forEach(a => { if (ar.has(a)) return; if (a.el === 'C') { const x = R(); if (x < ISOP.c14) a.iso = 'c14'; else if (x < ISOP.c14 + ISOP.c13) a.iso = 'c13'; } else if (a.el === 'O' && R() < ISOP.o18) a.iso = 'o18'; }); return m; }
// A brief changes what one round pays for, so a different set of equipment suits it. Every brief but the plain one
// asks for more and pays something when it is beaten.
const BRIEFS = [
  { id: 'plain', name: 'plain', note: '' },
  { id: 'carry', name: 'carry', note: 'half mult kept' },
  { id: 'broad', name: 'broad', note: 'points twice, rows half' },
  { id: 'loose', name: 'loose', note: 'no rows' },
  { id: 'each', name: 'each', note: 'no repeats' },
  { id: 'back', name: 'back', note: 'loops pay' },
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
const rowStart = g => (g.gear.includes('magnet') && !RULE.five ? 2.5 : 1);
// how many times a reagent can be used in a round
const usesOf = (g, id) => (g.brief === 'scarce' ? Math.ceil(RULE.uses / 2) : TIER[id] === 'rare' ? Math.max(1, RULE.uses - 1) : RULE.uses) + ((g.usesPlus && g.usesPlus[id]) || 0) + (g.gear.includes('dropper') ? 1 : 0) + (g.usesAll || 0);
const handOf = g => (RULE.hand || SYN.offer) + (g.gear.includes('carousel') ? 1 : 0);
// n reagents from the rack. With a hand, reagents that still have uses come first and those in skip come last, and
// nothing is dealt again: a hand on which nothing acts is a hand the player has to deal with.
function draw(g, R, rack, n, skip) {
  const pull = (pool, out) => { while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]); return out; };
  if (!RULE.hand) { const live = rack.filter(id => RX.CARDS[id].find(g.m).length); let offer = []; for (let t = 0; t < 40; t++) { offer = pull(rack.slice(), []); if (offer.filter(id => live.includes(id)).length >= Math.min(2, live.length)) break; } return offer; }
  const has = id => !RULE.uses || g.left[id] > 0, old = id => !!skip && skip.includes(id), out = [];
  pull(rack.filter(id => has(id) && !old(id)), out); pull(rack.filter(id => has(id) && old(id)), out); pull(rack.filter(id => !has(id)), out);
  return out;
}
// the reagents of a page: the hand, anything equipment adds to it, and which of them are a rare version on this page
function dealHand(g, R, rack, offer, again) {
  const was = again ? g.kinds.filter(id => !rack.includes(id)) : [];
  g.kinds = rack.filter(id => offer.includes(id)).concat(was);
  if (!RULE.uses) g.left = {};
  if (!again && g.gear.includes('mystery')) { const all = RUNG.start.concat(...SUPPLY.map(q => q.reagents)).filter((id, i, a) => a.indexOf(id) === i && RX.CARDS[id] && !PAIR[id] && !g.kinds.includes(id) && !rack.includes(id) && RX.CARDS[id].find(g.m).length); if (all.length) { const id = all[Math.floor(R() * all.length)]; g.kinds.push(id); if (RULE.uses) g.left[id] = 1; } }
  if (!again) { if (g.back && RX.CARDS[g.back] && !g.kinds.includes(g.back)) g.kinds.push(g.back); g.back = null; }
  if (!RULE.uses) g.kinds.forEach(id => { g.left[id] = (g.brief === 'scarce' || TIER[id] === 'rare' ? 1 : SYN.uses) + ((g.usesPlus && g.usesPlus[id]) || 0) + (g.gear.includes('dropper') ? 1 : 0) + (g.usesAll || 0); });
  else g.kinds.forEach(id => { if (g.left[id] == null) g.left[id] = 1; });
  // plenty: with a budget of uses, a reagent that is plenty on a page spends none while that page is open
  const plenty = id => { g.rare[id] = 'plenty'; if (RULE.uses) g.free[id] = true; else g.left[id] = 9; };
  g.rare = {}; g.free = {}; g.kinds.forEach(id => { if (g.rareOn !== false && R() < SYN.rare * (g.gear.includes('loupe') ? 2 : 1) * (g.rareMul || 1)) { const t = RARE[Math.floor(R() * RARE.length)]; if (t === 'plenty') plenty(id); else g.rare[id] = t; } });
  if (g.gear.includes('ouija') && g.kinds.length) plenty(g.kinds[Math.floor(R() * g.kinds.length)]);
}
// Opens every ring a zip has closed (RULE.reopen). The molecule is replaced by a copy, and what the row was built on is
// carried over to the copy. g.reopened tells the page how many rings opened and which atom became which.
function reopenAll(g) {
  g.reopened = null; if (!RULE.reopen || !RULE.cascade) return 0;
  const cm = RX.cloneMap(g.m), n = RX.reopen(cm.model); if (!n) return 0;
  const cur = g.cur, mp = S => { const T = new Set(); (S || []).forEach(a => { const c = cm.map.get(a); if (c) T.add(c); }); return T; };
  cur.fresh = mp(cur.fresh); cur.layers = (cur.layers || []).map(mp); g.m = cm.model; g.reopened = { n, map: cm.map }; return n;
}
function synDeal(g, rnd) {
  const R = rnd || rand, rack = g.rackIds || synRack(), n = handOf(g); let offer = draw(g, R, rack, n, null);
  if (g.fore) offer = g.fore.filter(id => rack.includes(id));
  g.fore = null; if (g.gear.includes('orb') && g.syn && (g.page || 1) < pagesOf(g)) { g.fore = draw(g, R, rack, n, null); g.fore = rack.filter(id => g.fore.includes(id)); }
  g.pageSteps = 0; g.more = 0; g.chain = false; g.fired = false; g.chainLen = 0; g.redrawn = false; g.queue = []; g.shot = false; g.casc = 0;
  dealHand(g, R, rack, offer, false);
  g.startTodo = []; g.mirrored = false; g.recycled = 0; g.wastedNow = 0; if (!g.manual) startRun(g);
  if ((g.gear.includes('goat') || g.gear.includes('voodoo')) && g.kinds.length) { const id = g.kinds[Math.floor(R() * g.kinds.length)]; if (g.left[id] > 0) g.left[id] = Math.max(1, g.left[id] - 1); }
}
// The redraw: once a page the hand is put back and dealt again from the rack, reagents that were not in it first.
// It costs one use of the reagent in the hand that has the most left.
function redrawCost(g) { let best = null; g.kinds.forEach(id => { if (g.free && g.free[id]) return; if (g.left[id] > 0 && (!best || g.left[id] > g.left[best])) best = id; }); return best; }
const canRedraw = g => !!RULE.redraw && !!RULE.hand && !!g.syn && !g.over && !g.chain && !g.redrawn && !(RULE.queue && g.shot) && (g.rackIds || synRack()).length > handOf(g) && (g.pageSteps < stepsOf(g)) && !!redrawCost(g);
function redraw(g, rnd) {
  if (!canRedraw(g)) return false;
  const R = rnd || rand, rack = g.rackIds || synRack(), pay = redrawCost(g), was = g.kinds.slice();
  g.queue = []; g.left[pay]--; g.redrawn = true; g.paid = pay; g.tally.redraws = (g.tally.redraws || 0) + 1;
  dealHand(g, R, rack, draw(g, R, rack, handOf(g), was), true);
  return true;
}
function synBegin(feed, relaxed, rnd, gear, run) {
  const g = begin(feed, relaxed, [], null, gear || []); g.manual = !!(run && run.manual); RX.MODE.reach = 4; g.tools = {};
  if (!(feed && feed.atoms)) salt(g.m, rnd);
  g.self = RULE.cascade ? ((run && run.self) || SELF0).slice() : SELF.filter(q => q.tier <= ((run && run.tier) || 0)).map(q => q.id); g.casc = 0;
  g.kin = feed && feed.atoms ? ((run && run.kin) || 'chain') : kinOf(feed);
  g.brief = (run && run.brief) || 'plain'; g.by = { water: 0, h2: 0, gauge: 0 }; HOMIDS.forEach(id => { g.by[id] = 0; }); g.hom = run && run.hom && HOMS[run.hom] && HOMS[run.hom].act ? { id: run.hom, fed: run.homFed ? HOMS[run.hom].need : 0, used: 0, frozen: 0 } : null; g.syn = true; g.page = 1; g.total = 0; g.over = false; g.pageSteps = 0; g.best = 0;
  g.P = 0; g.E = 1; g.bank = 0; g.grade = {}; g.gearLv = {}; g.R = rowStart(g); g.tally = { places: 0, loops: 0, kinds: 0, breaks: 0 };
  if (run) { g.grade = Object.assign({}, run.grade); g.gearLv = run.lv; g.usesPlus = run.uses; if (run.rack) g.rackIds = run.rack.filter(id => dealtIn(run, id)); g.rareOn = !!run.rare; g.usesAll = run.usesAll || 0; g.termSteps = run.steps || 0; g.termPages = run.pages || 0; g.rareMul = run.rareMul || 1; if (run.glass) { g.glass = true; g.E = 3; } if (run.term && run.term !== 'plain') { const C = CIRCLE[run.term] || CIRCLE.plain; g.ring = C.n; g.ringMul = C.mul; g.lit = 0; g.ringSet = []; } }
  if (g.brief === 'carry' && run && run.carryE) g.E = run.carryE;
  if (run && g.gear.includes('milk')) { run.milk = (run.milk || 0) + 1; g.E += 0.1 * run.milk; }
  RX.MODE.weld = RULE.weld || 'ol'; RX.MODE.co2 = !!RULE.co2; if (RULE.reopen && RULE.cascade) RX.reopen(g.m);
  g.left = {}; g.free = {}; g.rare = {}; g.loopsCont = 0; if (RULE.uses) (g.rackIds || synRack()).forEach(id => { g.left[id] = usesOf(g, id); });
  synDeal(g, rnd);
  return g;
}
// closes the open row: what it made is kept, and the row starts again
function close(g) {
  g.chain = false; g.bank += g.P * g.R; g.P = 0;
  g.R = Math.max(rowStart(g), g.gear.includes('clamp') ? g.R * 0.75 : 1);
  g.lost = g.cur.path.length; g.cur.path = []; g.cur.fresh = new Set(); g.cur.layers = []; if (g.ringSet && g.lost > 0) { g.ringSet = g.ringSet.slice(0, -1); g.lit = g.ringSet.length; }
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
  const cur = g.cur, id = o.id, r = o.r, ev = [], loop = !o.casc && cur.seen.has(r.sig), first = !cur.used.includes(id); let h = 0;
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
  const b = g.brief, polyLen = id === 'aibn' ? Math.max(2, o.model.atoms.reduce((t, a) => t + (a.poly || 0), 0)) / 2 : 1, per = (o.casc ? CASC.place : id === 'aibn' ? SYN.place * polyLen : id === 'allyl' ? SYN.place : rarityOf(id).place) * (1 + SYN.strong * ((g.grade[id] || 1) - 1)) * (b === 'broad' ? 2 : 1) * (b === 'each' && !first && !o.casc ? 0 : 1);
  for (let i = 0; i < r.hits; i++) { c.hit = i; if (per) emit('bottle', A('p', per)); pieces('site'); }
  if (o.casc && r.hits) { g.casc = (g.casc || 0) + 1; const fresh = !RULE.fresh || g.casc > (g.cascBest || 0), w = fresh ? 1 : CASC.old; if (g.casc > 1) emit('cascade', M('h', 1 + (g.casc - 1) * w)); emit('cascade', CASC.mul ? M('e', 1 + CASC.step * g.casc * w) : A('e', CASC.step * g.casc * w), { n: g.casc, fresh }); g.tally.casc = Math.max(g.tally.casc || 0, g.casc); }
  if (o.by && GEARS[o.by] && r.hits) ev.push({ src: o.by, act: true, part: 'e', op: 'add', val: 0, P: g.P, R: g.R, E: g.E, made: made(g) });
  if (SHORT[id] && r.hits) { emit('short', M('h', SHORT[id])); emit('short', A('r', 0.5 * (SHORT[id] - 1))); }
  new Set(o.atoms || []).forEach(a => { const I = a.iso && ISO[a.iso]; if (I) emit('iso', { part: I.part, op: I.op, val: I.val }, { iso: a.iso }); });
  // what leaves: caught by equipment, or collected, and always a stroke on the tally. Five strokes pay places, more the longer the row
  (r.gone || []).forEach((grp, gi) => {
    const kind = byKind(grp); let caught = false;
    g.gear.forEach(q => { const fx = CATCH[q] && (CATCH[q][kind] || CATCH[q].any); if (fx) { emit(q, fx, { gone: gi, kind }); caught = true; } });
    if (kind === 'water' || kind === 'h2' || kind === 'co2') { homEvent(g, kind); if (!caught) ev.push({ src: 'collect', kind, gone: gi, part: 'p', op: 'add', val: 0, P: g.P, R: g.R, E: g.E, made: made(g) }); }
    g.by.gauge++; if (g.by.gauge >= BY.tally) { g.by.gauge -= BY.tally; emit('tally', A('p', BY.pay * Math.max(1, cur.path.length))); }
  });
  if (r.hits) kinsOf(o.model).forEach(q => { const fx = KIN[q.id].fx(Object.assign({ free: !!free }, c)); if (fx) emit('family', { part: fx.part, op: fx.op, val: fx.op === 'mul' ? 1 + (fx.val - 1) * q.lv : fx.val * q.lv }, { kin: q.id, lv: q.lv }); });
  if (o.cont && b !== 'loose') { emit('row', A('r', (o.casc ? CASC.row : SYN.row) * (b === 'broad' ? 0.5 : 1))); const nr = namedRow(cur.path); if (nr) emit('route', A('r', 0.5 * (nr.seq.length - 1)), { route: nr.id }); }
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
  const cur = g.cur, sv = { lit: g.lit, ringSet: g.ringSet, P: g.P, R: g.R, E: g.E, bank: g.bank, path: cur.path, fresh: cur.fresh, layers: cur.layers, lost: g.lost, casc: g.casc, tally: Object.assign({}, g.tally), by: Object.assign({}, g.by), hom: g.hom }, before = made(g), brk = breaks(g, o);
  if (brk) close(g);
  const sc = scoreRound(g, o); if (o.finish) g.E += SYN.finishExtra * o.r.hits;
  const out = { gain: made(g) - before, dP: g.P - (brk ? 0 : sv.P), dR: g.R - sv.R, dE: g.E - sv.E, breaks: brk, fires: sc.ev.filter(e => GEARS[e.src]).map(e => e.src) };
  g.lit = sv.lit; g.ringSet = sv.ringSet; g.P = sv.P; g.R = sv.R; g.E = sv.E; g.bank = sv.bank; cur.path = sv.path; cur.fresh = sv.fresh; cur.layers = sv.layers; g.lost = sv.lost; g.casc = sv.casc; g.tally = sv.tally; Object.assign(g.by, sv.by); g.hom = sv.hom;
  return out;
}
// A chain reaction. When a row reaches three, the molecule is set off: every reaction that carries the row on then
// happens by itself, one after another, without using up the page's reactions, until nothing on the page carries
// it on or the reagents run out. free marks a reaction that happened that way.
// A row of three or more charges the page. Once the page's own reactions are used up, the player can set it off.
const charged = g => { if (RULE.cascade || g.fired || g.over || g.cur.path.length < SYN.streak) return false; const o = options(g, true); return Object.keys(o).some(id => o[id].cont); };
function fire(g) { if (!charged(g)) return false; g.chain = true; g.fired = true; g.chainLen = 0; return true; }
// the reactions that would carry a running chain on. None, and the chain is over.
function chainOpts(g) {
  if (!g.chain || g.over) return [];
  if (RULE.chain && (g.chainLen || 0) >= RULE.chain) { g.chain = false; return []; }
  const o = options(g, true), out = Object.keys(o).filter(id => o[id].cont).map(id => o[id]);
  if (!out.length) g.chain = false;
  return out;
}
// The next link when the chain takes it by itself. With forks on and two or more reagents that could carry it on,
// nothing is returned and the chain stays open: the player chooses from chainOpts, or banks.
function chainNext(g) {
  const a = chainOpts(g); if (!a.length || (RULE.fork && a.length > 1)) return null;
  let best = null, top = -1; a.forEach(q => { const v = a.length > 1 ? peek(g, q).gain : 0; if (v > top) { top = v; best = q; } });
  return best;
}
// The bank: the open row is closed on purpose and pays RULE.bank times what it holds. It takes one of the page's
// reactions. At a fork of a chain it takes none and ends the chain.
const canBank = g => !!RULE.bank && !!g.syn && !g.over && g.cur.path.length >= RULE.bankMin && g.P > 0 && (g.chain || g.pageSteps < stepsOf(g));
const bankGain = g => Math.round(g.P * g.R * (RULE.bank - 1) * g.E);
function bank(g) {
  if (!canBank(g)) return false;
  const len = g.cur.path.length, v = g.P * g.R * (RULE.bank - 1), fork = !!g.chain; g.bank += v; close(g);
  if (g.chain) g.chain = false; else g.pageSteps++;
  g.tally.banks = (g.tally.banks || 0) + 1;
  g.trail.push({ id: '#bank', hits: 0, cont: false, bank: true, len, fork, page: g.page, last: !fork && g.pageSteps >= stepsOf(g), free: false, ev: [{ src: 'bank', part: 'p', op: 'mul', val: RULE.bank, P: g.P, R: g.R, E: g.E, made: made(g) }] });
  return true;
}
function synTake(g, o, free) {
  const cur = g.cur;
  const shatter = g.glass && breaks(g, o);
  if (breaks(g, o)) { close(g); g.tally.breaks++; }
  const hold = !o.cont && cur.path.length > 0 && !g.gear.includes('ouroboros') && unbroken(g);
  const sc = scoreRound(g, o, free); if (hold) g.tower = true;
  { const mk = new Set(o.r.made);
    if (RULE.ground > 1 && cur.path.length > 1 && o.map) { const live = new Set(o.model.atoms), prev = (cur.layers || []).slice(0, RULE.ground - 1).map(S => { const T = new Set(); S.forEach(a => { const c = o.map.get(a); if (c && live.has(c)) T.add(c); }); return T; }); cur.layers = [mk].concat(prev); cur.fresh = new Set(); cur.layers.forEach(S => S.forEach(a => cur.fresh.add(a))); }
    else { cur.layers = [mk]; cur.fresh = mk; } }
  cur.seen.add(o.r.sig); cur.step++; cur.used.push(o.id);
  if (o.loop && o.cont) g.loopsCont = (g.loopsCont || 0) + 1;
  if (!o.self && !(g.free && g.free[o.id]) && g.left[o.id] > 0) g.left[o.id]--;
  if (!o.self && o.r && o.r.hits) { homEvent(g, 'use:' + o.id); if (o.id === 'pcc' && RX.homs.endOls(g.m).length) homEvent(g, 'endox'); }
  g.m = o.model; if (!free) g.pageSteps++; else if (g.chain) g.chainLen = (g.chainLen || 0) + 1; g.best = Math.max(g.best, cur.path.length);
  const set = false;
  g.trail.push({ id: o.id, hits: o.r.hits, cont: o.cont, held: hold, ev: sc.ev, rare: sc.rare, set, free: !!free });
  if (shatter) synEnd(g);
}
// ---------- the page lined up, then fired ----------
// The state of a round is saved, something is tried, and the state is put back.
function snap(g) {
  const c = g.cur, s = { P: g.P, R: g.R, E: g.E, bank: g.bank, lit: g.lit, ringSet: g.ringSet, tally: Object.assign({}, g.tally), by: Object.assign({}, g.by), lost: g.lost, tower: g.tower, chain: g.chain, fired: g.fired, best: g.best, pageSteps: g.pageSteps, left: Object.assign({}, g.left), m: g.m, trail: g.trail.length, path: c.path, fresh: c.fresh, layers: c.layers, seen: c.seen, step: c.step, used: c.used.length, over: g.over, total: g.total, more: g.more, doused: g.doused, chainLen: g.chainLen, loopsCont: g.loopsCont, kinds: g.kinds, free: g.free, rare: g.rare, redrawn: g.redrawn, shot: g.shot, casc: g.casc, queue: (g.queue || []).slice(), startTodo: (g.startTodo || []).slice(), mirrored: g.mirrorUsed, tools: g.tools, hom: g.hom, recycled: g.recycled, wastedNow: g.wastedNow, cascBest: g.cascBest };
  c.seen = new Set(c.seen); return s;
}
function back(g, s) {
  const c = g.cur; g.P = s.P; g.R = s.R; g.E = s.E; g.bank = s.bank; g.lit = s.lit; g.ringSet = s.ringSet; g.tally = s.tally; Object.assign(g.by, s.by); g.lost = s.lost; g.tower = s.tower; g.chain = s.chain; g.fired = s.fired; g.best = s.best; g.pageSteps = s.pageSteps; g.left = s.left; g.m = s.m; g.trail.length = s.trail; c.path = s.path; c.fresh = s.fresh; c.layers = s.layers; c.seen = s.seen; c.step = s.step; c.used.length = s.used; g.over = s.over; g.total = s.total; g.more = s.more; g.doused = s.doused; g.chainLen = s.chainLen; g.loopsCont = s.loopsCont; g.kinds = s.kinds; g.free = s.free; g.rare = s.rare; g.redrawn = s.redrawn; g.shot = s.shot; g.casc = s.casc; g.queue = s.queue; g.startTodo = s.startTodo; g.mirrorUsed = s.mirrored; g.tools = s.tools; g.hom = s.hom; g.recycled = s.recycled; g.wastedNow = s.wastedNow; g.cascBest = s.cascBest;
}
const BANKID = '#bank';
// The next step of a cascade: the first reaction the molecule has with itself as it stands, or nothing. Every kind
// uses up a C=O or a C=C, so a cascade ends by itself. (Without RULE.reopen a step that would bring back a molecule
// the round has already held is not taken.)
function cascadeNext(g) {
  if (!RULE.cascade || g.over || (g.casc || 0) >= CASC.most) return null;
  for (const id of g.self || []) { const sites = RX.CARDS[id].find(g.m); if (!sites.length) continue; const t = tryOne(g, g.m, id), r = t.r; if (!r.hits || (!RULE.reopen && g.cur.seen.has(r.sig))) continue;
    return { id, model: t.model, map: t.map, r, loop: false, spoil: false, self: true, casc: true, cont: true, by: sites[0].d > 4 ? 'magnet' : undefined, atoms: sites.reduce((a, q) => a.concat(q.atoms), []) }; }
  return null;
}
// What a page does before any reagent (the burette, then the seed crystal). startDue gives the next such reaction
// and takes it off the list, so whoever asks must take it; startRun takes them all. A page played with no screen
// runs them when it is dealt; the page on screen (run.manual) plays them one at a time so they can be watched.
function startDue(g) {
  if (g.over || g.shot || !g.startTodo) return null;
  while (g.startTodo.length) {
    const k = g.startTodo[0];
    if (k === 'burette') { g.startTodo.shift(); const card = RX.CARDS.extend, sites = card ? card.find(g.m) : []; if (!sites.length) continue; const t = tryOne(g, g.m, 'extend'), r = t.r; if (!r.hits || (RULE.atoms && heavy(t.model) > RULE.atoms)) continue;
      return { id: 'extend', model: t.model, map: t.map, r, loop: false, spoil: false, self: true, by: 'burette', cont: g.cur.path.length > 0, atoms: sites.reduce((a, q) => a.concat(q.atoms), []) }; }
    g.startTodo.shift();
  }
  return null;
}
function startRun(g, each) { let n = 0; for (let o = startDue(g); o; o = startDue(g)) { if (each) each(o); synTake(g, o, true); n++; } return n; }
// (the passive versions of the pieces tried first, where the zip waited, ran twice or reached further by itself, were
// taken out: a piece is now something the player uses on the molecule)
const again = () => null, cascMode = () => RULE.cascade;
// ---------- pieces used on the molecule ----------
const canTool = (g, id) => !!RULE.five && !!g.syn && !g.over && !g.shot && g.gear.includes(id) && !!(GEARS[id] && GEARS[id].tool) && ((g.tools && g.tools[id]) || 0) < TOOLUSES;
const toolSpots = (g, id) => (canTool(g, id) ? RX.tools.spots(g.m, id, RULE.atoms) : []);
// Uses piece id at a spot (from toolSpots). The molecule is replaced by a changed copy, as when rings open, and
// g.reopened tells the page which atom became which. False when it cannot be done there (the size limit).
function toolUse(g, id, spot) {
  if (!canTool(g, id) || !spot) return false;
  const cm = RX.cloneMap(g.m), mp = v => (Array.isArray(v) ? v.map(mp) : cm.map.get(v)), sp = {}; Object.keys(spot).forEach(k => { sp[k] = spot[k] && typeof spot[k] === 'object' ? mp(spot[k]) : spot[k]; });
  const res = RX.tools.apply(cm.model, id, sp); if (!res) return false;
  if (RULE.atoms && heavy(cm.model) > RULE.atoms && heavy(cm.model) > heavy(g.m)) return false;
  const cur = g.cur, live = new Set(cm.model.atoms), mS = S => { const T = new Set(); (S || []).forEach(a => { const c = cm.map.get(a); if (c && live.has(c)) T.add(c); }); return T; };
  cur.fresh = mS(cur.fresh); cur.layers = (cur.layers || []).map(mS); g.m = cm.model; g.reopened = { n: 1, map: cm.map, made: res.made || [], gone: res.leaving || [] };
  // what a piece drives off is collected as a reagent's by-product is
  (res.leaving || []).forEach(grp => { const kind = byKind(grp); if (kind === 'water' || kind === 'h2' || kind === 'co2') homEvent(g, kind); g.by.gauge++; });
  g.tools = Object.assign({}, g.tools); g.tools[id] = (g.tools[id] || 0) + 1; g.tally.tools = (g.tally.tools || 0) + 1; g.toolRun = id !== 'clamp';
  return true;
}
// A piece that changes the molecule sets the zip off at once, as a reagent that acted does (the clamp changes
// nothing and sets nothing off). toolGo uses a piece and runs whatever follows (for play with no page)
function toolGo(g, id, spot) { if (!toolUse(g, id, spot)) return false; if (g.toolRun) { g.toolRun = false; for (let o = cascadeNext(g); o; o = cascadeNext(g)) synTake(g, o, true); } return true; }
// What a placing is worth, read off the structure alone: how many steps the molecule would zip if it were set off
// (the screen's selfRun, on a copy with its rings open). toolBest gives the spot of a piece worth most, and what a
// spot is worth on average, so that how much the choice of place matters can be measured.
// toolTry: the molecule as it would be with the piece used there (a copy, rings open), or nothing where it cannot be
function toolTry(m, id, spot) { const cm = RX.cloneMap(m), mp = v => (Array.isArray(v) ? v.map(mp) : cm.map.get(v)), sp = {}; Object.keys(spot).forEach(k => { sp[k] = spot[k] && typeof spot[k] === 'object' ? mp(spot[k]) : spot[k]; }); if (!RX.tools.apply(cm.model, id, sp)) return null; if (RULE.atoms && heavy(cm.model) > RULE.atoms && heavy(cm.model) > heavy(m)) return null; RX.reopen(cm.model); return cm.model; }
function toolWorth(m, id, spot, self) { const t = toolTry(m, id, spot); return t ? selfRun(t, self || SELF0) : -1; }
function toolBest(m, id, self) { const m0 = RX.cloneModel(m); RX.reopen(m0); const base = selfRun(RX.cloneModel(m0), self || SELF0), spots = RX.tools.spots(m0, id, RULE.atoms); let best = null, top = -1, sum = 0, n = 0; spots.forEach(sp => { const v = toolWorth(m0, id, sp, self); if (v < 0) return; sum += v; n++; if (v > top) { top = v; best = sp; } }); return { base, best: top, mean: n ? sum / n : base, spots: n, spot: best, m: m0 }; }
// ---------- the jars and the homunculi (docs/HOMUNCULI.md, docs/JARS.md) ----------
// What comes off the molecule, and some things the player's reactions do, fill jars across runs; a jar is never
// emptied (the page keeps them in its saved progress; JAR.full is how much fills one). A homunculus grows in each jar
// and hatches when it is full. One hatched homunculus is taken into a run (run.hom). In a round it is fed by what its
// entry names; with `need` of them it is fed, and it is LIT when it is fed and there is something it can do. After a
// page has fired and before the next is dealt the player may tap it. Everything a creature is, is one entry here:
//   name, tok      what the page writes (tok: short tokens, lines split by |)
//   jar            how fast its jar fills: 'fast', 'medium', 'slow' (JAR.full[id] is the count)
//   feed           the events that feed it and fill its jar: 'water', 'h2', 'co2' (what leaves the molecule), or
//                  'use:<reagent id>' (that reagent acted). Other events are raised with homEvent(g, key)
//   need, uses     how many feeds make it fed, and how many times a round it can be tapped (it is empty after a tap)
//   whole          it acts on the whole molecule (one spot); otherwise the player taps a place
//   word           what the hover preview letters over each place it changes ('' for none)
//   spots(m, g)    the places it can act on molecule m as it stands; none means it is not lit
//   act(m, sp, g)  does it to m in place and returns { made }, with restart: true when the count of rings starts
//                  again (water), frozen: n when n more rings are frozen (carbon dioxide). The zip then runs
//   pay            carbon dioxide only: how many times over a frozen ring is paid at the start of a later page
//   now(g)         for the simulated players, when its worth cannot be read as steps: whether to tap it now
//   before         it is tapped BEFORE the page is lined up (salt, wood spirit), not after the page has fired
//   lasting        what it does stays for the round, so its worth is more than the steps it adds at once
//   act may also return over: true (the molecule may pass the size limit) and line: [ids] (wood spirit: the page's line)
//   offered        false: a creature not built yet. It has no jar, is never fed and cannot be taken
const JAR = { full: { water: 200, h2: 130, co2: 50, acid: 200, wood: 40, salt: 50, slime: 70, seedling: 120 }, stages: [0.12, 0.5, 1] };
const closedRings = m => { const cm = RX.cloneMap(m), cuts = [], rev = new Map(); RX.reopen(cm.model, cuts); cm.map.forEach((c, a) => rev.set(c, a)); return cuts.map(q => ({ c: rev.get(q.c), o: rev.get(q.o) })).filter(q => q.c && q.o); };
const HOMS = {
  // water floods: every C=C outside a benzene ring becomes C-OH, every closed ring opens, the rings close again.
  // The count of rings starts again, so a ring that only closes again pays a quarter until the row passes the
  // longest of the round
  water: { name: 'water', jar: 'fast', feed: ['water'], need: 3, uses: 1, tok: 'C=C to OH|rings open', whole: true, word: 'OH',
    spots(m) { const cc = RX.CARDS.hydrate.find(m), rings = closedRings(m).length; return cc.length || rings ? [{ pairs: cc.map(q => [q.bond.a, q.bond.b]) }] : []; },
    act(m) { RX.reopen(m); const c = RX.CARDS.hydrate, made = []; c.find(m).forEach(q => { if (c.ok(m, q)) c.apply(m, q).incoming.forEach(a => made.push(a)); }); return { made, restart: true }; } },
  // hydrogen floats over: where the rings stopped at a stretch too long, the first C=O on the far side becomes OH
  // and the rings carry on. A place is offered only if a ring would close from it
  h2: { name: 'hydrogen', jar: 'fast', feed: ['h2'], need: 3, uses: 1, tok: 'far C=O|to OH', word: 'OH',
    spots(m, g) {
      const nb = a => m.neighbors(a), cos = [], ohC = [];
      m.bonds.forEach(b => { if (b.order !== 2) return; const c = b.a.el === 'C' && b.b.el === 'O' ? b.a : b.b.el === 'C' && b.a.el === 'O' ? b.b : null; if (!c || c.fly) return; const o = c === b.a ? b.b : b.a; if (nb(c).some(q => q.atom !== o && q.atom.el !== 'C' && q.atom.el !== 'H')) return; cos.push({ c, o }); });
      if (!cos.length) return [];
      m.atoms.forEach(o => { if (o.el !== 'O' || o.fly) return; const q = nb(o); if (q.length === 2 && q.some(k => k.atom.el === 'H') && q.some(k => k.atom.el === 'C')) ohC.push(q.find(k => k.atom.el === 'C').atom); });
      const out = new Map();
      ohC.forEach(c0 => { const dist = new Map([[c0, 0]]), qu = [c0]; while (qu.length) { const a = qu.shift(); nb(a).forEach(k => { if (k.atom.el === 'C' && !dist.has(k.atom)) { dist.set(k.atom, dist.get(a) + 1); qu.push(k.atom); } }); }
        let best = 1e9; cos.forEach(q => { const d = dist.get(q.c); if (d > 0 && d < best) best = d; }); cos.forEach(q => { if (dist.get(q.c) === best && !out.has(q.c)) out.set(q.c, { c: q.c, o: q.o, d: best }); }); });
      const self = (g && g.self) || SELF0;
      return Array.from(out.values()).filter(sp => { const t = homTry(m, 'h2', sp); return !!t && selfRun(t, self) >= 1; });
    },
    act(m, sp) { const bond = m.findBond(sp.c, sp.o); if (!bond || bond.order !== 2) return null; const r = RX.CARDS.nabh4.apply(m, { bond, c: sp.c, o: sp.o }); return { made: [sp.o].concat(r.incoming || []) }; } },
  // carbon dioxide freezes: the rings the page closed stay shut for the rest of the round, are paid in full at the
  // start of every later page (frozenPay), and nothing opens them again. Nothing to gain on the last page
  co2: { name: 'dry ice', jar: 'medium', feed: ['co2'], need: 1, uses: 1, pay: 2, tok: 'rings freeze|pay each page', whole: true, word: '',
    spots(m, g) { if (g && g.page >= pagesOf(g)) return []; const rings = closedRings(m); return rings.length ? [{ rings: rings.map(q => [q.o, q.c]) }] : []; },
    act(m) { const rings = closedRings(m); if (!rings.length) return null; rings.forEach(q => { q.o.frz = true; }); return { made: rings.map(q => q.o), frozen: rings.length }; },
    now(g) { return g.page >= pagesOf(g) - 1 ? (g.casc || 0) >= 1 : (g.casc || 0) >= HOMSIM.freezeAt; } },
  // acid eats through: every stretch of four or more plain CH2 is eaten down to three, and for the rest of the round a
  // ring closes across up to six carbons. The rings then run, counting on
  acid: { name: 'acid', jar: 'medium', feed: ['use:hydrate', 'use:dehydrate'], need: 1, uses: 1, reach: 6, tok: 'eats long gaps|rings reach 6', whole: true, word: '', lasting: true,
    spots(m) { const runs = RX.homs.acidRuns(m); return runs.length || m.reach !== HOMS.acid.reach ? [{ runs }] : []; },
    act(m) { return RX.homs.acid(m, HOMS.acid.reach); } },
  // wood spirit, blind drunk: tapped BEFORE the page is lined up. The page fires every reaction dealt that has a use
  // left, in an order taken at random, each spending a use
  wood: { name: 'wood spirit', jar: 'medium', feed: ['use:nabh4'], need: 1, uses: 1, tok: 'fires all five|any order', whole: true, word: '', before: true,
    spots(m, g) { if (!g || !g.kinds) return []; return g.kinds.filter(id => (g.free && g.free[id]) || g.left[id] > 0).length >= 2 ? [{ all: true }] : []; },
    act(m, sp, g, rnd) { if (!g) return { made: [] }; const R = rnd || rand, ids = g.kinds.filter(id => (g.free && g.free[id]) || g.left[id] > 0); for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = ids[i]; ids[i] = ids[j]; ids[j] = t; } return { made: [], line: ids }; } },
  // salt cures: tapped BEFORE the page is lined up, on one C=O. For the round a ring that closes on it leaves it a
  // C=O, up to three rings a page, and no reaction changes it (rules.js, cure)
  salt: { name: 'salt', jar: 'medium', feed: ['endox'], need: 1, uses: 1, tok: 'cures a C=O|3 rings close on it', word: 'cured', before: true, lasting: true,
    spots(m) { return RX.homs.saltSpots(m); },
    act(m, sp) { return RX.homs.salt(m, sp); } },
  // slime sticks: two carbons are joined by two carbons of slime, so they count as three apart for the round and the
  // rings cross from one stretch to the other. A place is offered only if a ring would close across it
  slime: { name: 'slime', jar: 'medium', feed: ['use:bh3'], need: 1, uses: 1, tok: 'sticks two carbons|3 apart', word: 'stuck', lasting: true,
    spots(m, g) { const self = (g && g.self) || SELF0; return RX.homs.slimeSpots(m).filter(sp => { const t = homTry(m, 'slime', sp); return !!t && selfRun(t, self) >= 1; }).slice(0, 12); },
    act(m, sp) { const r = RX.homs.slime(m, sp); return r ? { made: r.made, over: true } : null; } },
  // the seedling grows: six carbons with two C=O grow from the carbon tapped, stay for the round, and may pass the
  // size limit. A place is offered only if a ring would close onto the new arm
  seedling: { name: 'seedling', jar: 'slow', feed: ['use:allyl'], need: 1, uses: 1, arms: 3, tok: 'grows 9 carbons|3 C=O', word: '+9', lasting: true,
    spots(m, g) { const self = (g && g.self) || SELF0; return RX.homs.seedSpots(m).filter(sp => { const t = homTry(m, 'seedling', sp); return !!t && selfRun(t, self) >= 1; }); },
    act(m, sp) { const r = RX.homs.seed(m, sp, HOMS.seedling.arms); return r ? { made: r.made, over: true } : null; } },
  // not built yet (docs/HOMUNCULI.md, "To build, in order"): each becomes one entry like those above
  ammonia: { name: 'ammonia', jar: 'slow', feed: ['nh3'], need: 2, uses: 1, tok: 'page fires again', whole: true, offered: false },
  brimstone: { name: 'brimstone', jar: 'slow', feed: ['sulfur'], need: 2, uses: 1, tok: 'burns 8 carbons', offered: false }
};
const HOMSIM = { freezeAt: 3 };
const HOMIDS = Object.keys(HOMS), homOn = id => !!HOMS[id] && HOMS[id].offered !== false && !!HOMS[id].act;
const homOf = g => (g && g.hom && HOMS[g.hom.id]) || null;
// Something happened that may feed a creature: every offered creature it feeds has its jar count raised (g.by, banked
// into the jars at the round's end), and the one held in the run is fed
function homEvent(g, key) { if (!g.by) return; HOMIDS.forEach(id => { if (!homOn(id) || !HOMS[id].feed.includes(key)) return; g.by[id] = (g.by[id] || 0) + 1; if (g.hom && g.hom.id === id) g.hom = Object.assign({}, g.hom, { fed: g.hom.fed + 1 }); }); }
const homFed = g => { const H = homOf(g); return !!H && !!g.syn && !g.over && g.hom.fed >= H.need && (g.hom.used || 0) < (H.uses || 1); };
const homSpots = g => (homFed(g) && !(homOf(g).before && (g.shot || g.pageSteps > 0)) ? homOf(g).spots(g.m, g) : []);
// lit: fed, not yet used up this round, and there is something it can do. homReady is the old name
const homLit = g => homSpots(g).length > 0, homReady = homFed;
// the molecule as it would be after the homunculus acted there (a copy), or nothing
function homTry(m, id, spot) { const cm = RX.cloneMap(m), mp = v => (Array.isArray(v) ? v.map(mp) : cm.map.get(v)), sp = {}; Object.keys(spot).forEach(k => { sp[k] = spot[k] && typeof spot[k] === 'object' ? mp(spot[k]) : spot[k]; }); return HOMS[id].act(cm.model, sp) ? cm.model : null; }
// Taps the homunculus at a spot (from homSpots). The molecule is replaced by a changed copy, as when a piece is
// used, and g.reopened tells the page which atom became which. It is then empty.
function homUse(g, spot, rnd) {
  if (!homFed(g) || !spot) return false; if (homOf(g).before && (g.shot || g.pageSteps > 0)) return false;
  const H = homOf(g), cm = RX.cloneMap(g.m), mp = v => (Array.isArray(v) ? v.map(mp) : cm.map.get(v)), sp = {}; Object.keys(spot).forEach(k => { sp[k] = spot[k] && typeof spot[k] === 'object' ? mp(spot[k]) : spot[k]; });
  const res = H.act(cm.model, sp, g, rnd); if (!res) return false;
  if (!res.over && RULE.atoms && heavy(cm.model) > RULE.atoms && heavy(cm.model) > heavy(g.m)) return false;
  const cur = g.cur, live = new Set(cm.model.atoms), mS = S => { const T = new Set(); (S || []).forEach(a => { const c = cm.map.get(a); if (c && live.has(c)) T.add(c); }); return T; };
  cur.fresh = mS(cur.fresh); cur.layers = (cur.layers || []).map(mS); g.m = cm.model; g.reopened = { n: 1, map: cm.map, made: res.made || [], gone: [] };
  g.hom = { id: g.hom.id, fed: 0, used: (g.hom.used || 0) + 1, frozen: (g.hom.frozen || 0) + (res.frozen || 0) }; g.tally.homs = (g.tally.homs || 0) + 1;
  if (res.restart) { g.cascBest = Math.max(g.cascBest || 0, g.casc || 0); g.casc = g.hom.frozen || 0; }
  // wood spirit: the whole hand is lined up, with a circle for each
  if (res.line) { g.queue = res.line.slice(); g.more = Math.max(0, res.line.length - (stepsOf(g) - (g.more || 0))); }
  return true;
}
// taps it and runs the zip that follows (for play with no page); returns the steps it added, or -1
function homGo(g, spot, rnd) { const pre = !!homOf(g) && !!homOf(g).before; if (!homUse(g, spot, rnd)) return -1; if (pre) { const c0 = g.casc || 0; if (!g.queue.length) return 0; while (g.queue.length && !g.over) queueStep(g); return (g.casc || 0) - c0; } let n = 0; for (let o = cascadeNext(g); o; o = cascadeNext(g)) { synTake(g, o, true); n++; } return n; }
// A new page with frozen rings on it: they are counted again and paid in full, ring n as 50 places counted n times
// and n times 0.1 of extra and 0.1 of row, as when it closed, and the rings of the page count on from them
function frozenPay(g) { const n = (g.hom && g.hom.frozen) || 0; if (!n || g.over) return 0; const w = (homOf(g) && homOf(g).pay) || 1; let p = 0; for (let k = 1; k <= n; k++) { p += CASC.place * k * w; g.E += CASC.step * k * w; g.R += CASC.row * w; } g.P += p; g.casc = n; return p; }
// what a round gave off goes to the run's count, and from there to the jars
function runBank(run, g) { run.jar = run.jar || {}; const out = {}; HOMIDS.forEach(id => { if (!homOn(id)) return; out[id] = (g.by && g.by[id]) || 0; run.jar[id] = (run.jar[id] || 0) + out[id]; }); return out; }
const cascadeDue = g => (cascMode(g) === 'each' || (RULE.cascade && !(g.queue || []).length) ? cascadeNext(g) : null);
// everything that follows a circle's turn: the cascade if one is due, then each time a piece makes it zip again
function afterTurn(g, acted, each) { const take = o => { if (each) each(o); else synTake(g, o, true); }; if (acted || cascMode(g) === 'end') for (let o = cascadeDue(g); o; o = cascadeDue(g)) take(o); for (let by = again(g); by; by = again(g)) { if (each) each(null, by); for (let o = cascadeNext(g); o; o = cascadeNext(g)) take(o); } }
// runs the cascade to its end and returns how many steps it took
function cascade(g, each) { let n = 0; for (let o = cascadeNext(g); o; o = cascadeNext(g)) { if (each) each(o); synTake(g, o, true); n++; } return n; }
const queued = (g, id) => (g.queue || []).filter(q => q === id).length;
// uses of a reagent not yet spent or placed in a circle
const usesLeft = (g, id) => (g.free && g.free[id] ? 9 : (g.left[id] || 0) - queued(g, id));
const queueRoom = g => !!RULE.queue && !!g.syn && !g.over && !g.chain && !g.shot && (g.queue || []).length < stepsOf(g) - g.pageSteps;
// places a reagent of the hand, the bank, or on the last page the finishing reagent, in the next empty circle
function queueAdd(g, id) {
  if (!queueRoom(g)) return false;
  if (id === BANKID) { if (!RULE.bank || g.queue.includes(id)) return false; }
  else if (id === SYN.finish) { if (g.page < pagesOf(g) || g.queue.includes(id)) return false; }
  else if (!g.kinds.includes(id) || usesLeft(g, id) <= 0) return false;
  g.queue.push(id); return true;
}
function queueDrop(g, i) { if (g.shot || !g.queue || i < 0 || i >= g.queue.length) return false; g.queue.splice(i, 1); return true; }
// what the first thing in the queue will do when its turn comes now: take (a reaction), bank, finish, or waste
function queueHead(g) {
  const id = g.queue[0]; if (id == null) return null;
  if (id === BANKID) return { id, kind: canBank(g) ? 'bank' : 'waste' };
  if (id === SYN.finish) { const f = finishOpt(g); return f ? { id, kind: 'finish', o: f } : { id, kind: 'waste' }; }
  const o = options(g)[id]; return o ? { id, kind: 'take', o } : { id, kind: 'waste' };
}
// a circle whose reagent found nothing to act on: the reaction of the page is gone and so is the use
function waste(g, id) { if (id !== BANKID && id !== SYN.finish && !(g.free && g.free[id]) && g.left[id] > 0) g.left[id]--; g.pageSteps++; g.wastedNow = (g.wastedNow || 0) + 1; g.tally.wasted = (g.tally.wasted || 0) + 1; g.trail.push({ id, hits: 0, cont: false, wasted: true, free: false, ev: [] }); }
// takes the head of the queue off it; the page then plays what queueHead said it would do
function queueShift(g) { g.shot = true; return g.queue.shift(); }
// fires the head of the queue and returns what it did. A cascade is set off only by a reagent that acted: a wasted
// circle and the bank change nothing on the molecule and set nothing off
function queueStep(g) { const h = queueHead(g); if (!h) return null; queueShift(g); if (h.kind === 'bank') bank(g); else if (h.kind === 'finish') synFinish(g, h.o); else if (h.kind === 'take') synTake(g, h.o); else waste(g, h.id); if (h.kind !== 'finish') afterTurn(g, h.kind === 'take'); return h; }
// The page as it would stand once everything queued has had its turn: what each reagent of the hand would then do,
// whether the bank could then be used, what each queued thing does when its turn comes, and for every atom of the
// molecule as it is now the atom it will be by then (fwd), so that places can be shown on the molecule on the page.
function queueView(g) {
  const s = snap(g), kinds = []; let fwd = null;
  const adv = (o, free) => { const live = new Set(o.model.atoms), nf = new Map(); if (fwd) fwd.forEach((a, a0) => { const b = o.map.get(a); if (b && live.has(b)) nf.set(a0, b); }); else o.map.forEach((b, a0) => { if (live.has(b)) nf.set(a0, b); }); fwd = nf; synTake(g, o, free); };
  while (g.queue.length && !g.over) {
    const h = queueHead(g); queueShift(g); kinds.push(h.kind);
    if (h.kind === 'take') adv(h.o, false);
    else if (h.kind === 'bank') bank(g); else if (h.kind === 'finish') break; else waste(g, h.id);
    afterTurn(g, h.kind === 'take', (o, by) => { if (o) return adv(o, true); const mp = g.reopened.map; if (fwd) { const nf = new Map(); fwd.forEach((a, a0) => { const b = mp.get(a); if (b) nf.set(a0, b); }); fwd = nf; } else fwd = new Map(mp); });
  }
  const done = kinds.includes('finish'), o = g.over || done ? {} : options(g, true), fin = g.over || done ? null : finishOpt(g), bankOk = !done && !!RULE.bank && g.cur.path.length >= RULE.bankMin && g.P > 0, row = g.cur.path.length;
  back(g, s);
  return { o, fin, bank: bankOk, kinds, fwd, row, casc: 0 };
}
// the fire extinguisher: stops a chain that is running; the round counts half again once the page is over
function douse(g) { if (!g.gear.includes('extinguisher') || !g.chain || g.doused) return false; g.chain = false; g.doused = 1; return true; }
const doused = g => { if (g.doused === 1) { g.E *= 1.5; g.doused = 2; } };
function turn(g, rnd) { doused(g); if (g.page >= pagesOf(g)) return false; g.cascBest = Math.max(g.cascBest || 0, g.casc || 0); g.page++; g.back = g.gear.includes('raven') ? g.cur.used[g.cur.used.length - 1] : null; reopenAll(g); synDeal(g, rnd); frozenPay(g); return true; }
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
  const id = run.rack[Math.floor(rand() * run.rack.length)]; run.rack = run.rack.filter(q => q !== id); return id;
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
  const g = synBegin(feed, false, rnd, gear, run), R = rnd || rand, pick = style === 'greedy' ? GREEDY : STYLES[style || 'row'];
  for (;;) {
    for (;;) {
      const o = options(g), ids = Object.keys(o); if (!ids.length) break;
      const from = pick(o, ids, g); let best = from[0];
      from.forEach(id => { if (o[id].r.hits > o[best].r.hits || (o[id].r.hits === o[best].r.hits && R() < 0.5)) best = id; });
      synTake(g, o[best]);
    }
    if (fire(g)) for (let a = chainOpts(g); a.length; a = chainOpts(g)) { let c = a[0], top = -1; if (a.length > 1) a.forEach(q => { const v = peek(g, q).gain; if (v > top) { top = v; c = q; } }); synTake(g, c, true); }
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

// ---------- the screen: what a molecule can cascade to, worked out from its structure alone ----------
// No round, no deal, no score: reagents and the kinds of cascade are applied to the bare graph. It answers in
// milliseconds, so molecules and sets of reagents are designed with it and whole runs are kept for the number to beat.
// selfRun: the molecule reacts with itself until nothing is left to react; returns the steps.
function selfRun(m, self) { let n = 0; for (let go = true; go && n < CASC.most;) { go = false; for (const id of self) { const card = RX.CARDS[id]; if (!card.find(m).length) continue; card.apply(m).leaving.flat().forEach(a => m.removeAtom(a)); n++; go = true; break; } } return n; }
// one reagent on a copy, then the cascade. A reagent that finds nothing, or would grow the molecule past the size
// limit, changes nothing and sets nothing off (as a wasted circle on the page).
function screenStep(m, id, self) { const c = RX.cloneModel(m), h0 = heavy(c), t = RX.cloneModel(c); const hits = RX.runCard(t, RX.CARDS[id]); const use = hits > 0 && !(RULE.atoms && heavy(t) > RULE.atoms && heavy(t) > h0) ? t : c; return { m: use, n: use === t ? selfRun(use, self) : 0, acted: use === t }; }
// every ordered line of `depth` reagents from the pool on molecule m: Map of 'a b c' to { n: steps, m: what is left }
function screenLines(m, pool, self, depth) { const out = new Map(); (function go(mm, line, n) { if (line.length === (depth || 3)) { out.set(line.join(' '), { n, m: mm }); return; } pool.forEach(id => { const r = screenStep(mm, id, self); go(r.m, line.concat(id), n + r.n); }); })(m, [], 0); return out; }
// screen(smiles or model, pool, self): the steps as dealt, the best line of three from the whole pool, the best from
// each deal of `hand` reagents of the pool (every deal counted once), and how many of all lines reach 1 and 3 steps.
function screen(feed, pool, self, hand) {
  pool = pool || RUNG.start; self = self || SELF0; const m0 = feed.atoms ? RX.cloneModel(feed) : RX.fromSmiles(feed); RX.reopen(m0);
  const dealt = selfRun(RX.cloneModel(m0), self), lines = screenLines(m0, pool, self, 3); let best = -1, line = '', ge1 = 0, ge3 = 0;
  lines.forEach((v, k) => { if (v.n > best) { best = v.n; line = k; } if (v.n >= 1) ge1++; if (v.n >= 3) ge3++; });
  const k = Math.min(hand || RULE.hand || 5, pool.length), hands = [], pick = (from, got) => { if (got.length === k) { let b = 0; lines.forEach((v, key) => { if (v.n > b && key.split(' ').every(id => got.includes(id))) b = v.n; }); hands.push(b); return; } for (let i = from; i < pool.length; i++) pick(i + 1, got.concat(pool[i])); }; pick(0, []);
  return { heavy: heavy(m0), dealt, best, line, hands, ge1: ge1 / lines.size, ge3: ge3 / lines.size };
}
// screenRound: three pages on one molecule as a player who goes for the longest cascade would play them. Each page a
// hand is dealt from the pool (R is the source of chance), the line of three with the most steps is fired, every
// reagent has RULE.uses uses, and the zip rings open again before the next page. Returns the steps of each page.
function screenRound(feed, pool, self, R, pages) {
  pool = pool || RUNG.start; self = self || SELF0; R = R || rand; let m = feed.atoms ? RX.cloneModel(feed) : RX.fromSmiles(feed); RX.reopen(m);
  const left = {}, out = []; pool.forEach(id => { left[id] = TIER[id] === 'rare' ? Math.max(1, RULE.uses - 1) : RULE.uses; });
  for (let p = 0; p < (pages || SYN.pages); p++) {
    const bag = pool.filter(id => left[id] > 0), hand = []; while (hand.length < Math.min(RULE.hand || 5, bag.length)) hand.push(bag.splice(Math.floor(R() * bag.length), 1)[0]);
    let best = null; screenLines(m, hand, self, 3).forEach((v, key) => { const ids = key.split(' '), cnt = {}; ids.forEach(id => { cnt[id] = (cnt[id] || 0) + 1; }); if (ids.some(id => cnt[id] > left[id])) return; if (!best || v.n > best.n) best = { n: v.n, m: v.m, ids }; });
    if (!best) { out.push(selfRun(m, self)); } else { out.push(best.n); best.ids.forEach(id => { left[id]--; }); m = best.m; }
    m = RX.cloneModel(m); RX.reopen(m);
  }
  return out;
}
// ---------- a run: rounds one after another until one is missed ----------
// A run starts with four reagents and no equipment. Before the first round and after every round beaten the player
// takes one of three: a new reagent, a new piece of equipment, a level for a piece they hold, a stronger reagent,
// or one more use of a reagent on every page. What can turn up depends on the suppliers that have been opened.
// Each round has a number to beat that is set by the round and not by what the player holds, so a better build
// beats it by more.
// growth, late, knee, first and ask belonged to the old number to beat and are no longer read: see PAR
const RUNG = { slots: 5, growth: 1.75, late: 1.5, knee: 3, first: 0.6, ask: 1, start: ['hydrate', 'pcc', 'allyl', 'bh3', 'dehydrate', 'nabh4'] };
// The deal of the first rounds. Two of the starting reagents wreck a chain when they are fired at it open: dehydrate
// takes off the OH a zip starts from and grow turns every C=O into an OH. A player who does not yet read the page fires
// them first half the time. So round one is dealt from the other four, dehydrate joins the deal in round two and grow
// in round three. Measured with the screen (docs/RIG.md): with four, nine lines of three in ten set the zip off on the
// molecules of round one; with all six, six in ten.
RUNG.from = { dehydrate: 2, allyl: 3 };
const dealtIn = (run, id) => !(RUNG.from[id] > ((run && run.round) || 1));
// Suppliers are opened between runs with credit. Each one adds reagents and equipment to what a run can turn up.
// A run pays one credit for every round beaten.
// A reagent that makes a halide is a dead end without a base to take the halide off again, so the two come as one pick.
const PAIR = { hcl: 'koh', socl2: 'naoh' };
const SUPPLY = [
  { name: 'corner chemist', cost: 0, reagents: ['extend', 'cyclize'], gear: ['balance', 'stirrer', 'cards', 'spatula', 'stopwatch', 'litmus', 'dryer', 'duck', 'poster', 'coffee', 'milk', 'goggles', 'intern'] },
  { name: 'trade supplier', cost: 6, kin: ['arene'], reagents: ['hcl', 'koh', 'aromatize', 'dione', 'phenol'], gear: ['cannula', 'coldtrap', 'schlenk', 'burette', 'logbook', 'scalepan', 'stopper', 'hood', 'scrubber', 'coat', 'mystery', 'grant', 'extinguisher'] },
  { name: 'research supplier', cost: 16, kin: ['sugar'], reagents: ['socl2', 'naoh', 'couple'], gear: ['reflux', 'crystal', 'mortar', 'thermometer', 'bunsen', 'dropper', 'mirror', 'sieves'], rare: true },
  { name: 'instrument maker', cost: 30, kin: ['cage'], reagents: [], gear: ['clamp', 'magnet', 'recycler', 'carousel', 'loupe', 'timer'] },
  { name: 'an alchemist, by appointment', cost: 50, reagents: [], gear: ['stone', 'transmute', 'regia', 'ouroboros', 'homunculus', 'elixir'] },
  { name: 'Brenda (deceased)', cost: 80, reagents: [], gear: ['ouija', 'candle', 'goat', 'pact', 'voodoo', 'tower', 'cat', 'paw', 'idol', 'grimoire', 'hourglass', 'raven', 'glory', 'orb'] }
];
const stock = tier => { const o = { reagents: [], gear: [], rare: false }; SUPPLY.forEach((sp, i) => { if (i <= tier) { o.reagents.push(...sp.reagents); o.gear.push(...sp.gear); if (sp.rare) o.rare = true; } }); if (RULE.cascade) { o.reagents = o.reagents.filter(id => !SELF.some(q => q.id === id) && !(RULE.ban || []).includes(id)); o.gear = o.gear.filter(id => id !== 'extinguisher'); } if (RULE.five) o.gear = Object.keys(FIVE).filter(id => FIVE[id] <= tier && !(RULE.ban || []).includes(id)); return o; };
// MODEL.relaxed false skips settling a new molecule into shape. The rules do not read the shape, so a simulation
// with no page turns it off to save the time.
const MODEL = { relaxed: true };
const modelOf = feed => { const m = feed.atoms ? RX.cloneMap(feed).model : MODEL.relaxed ? AA.Model.fromSmilesRelaxed(feed, 4) : RX.fromSmiles(feed); m.center(); return m; };
// No longer used for the number to beat (see runQuota). Kept so that briefBase can still be called.
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
// An assay: every third round is one round and not a choice of three. Its kind is one of the harder kinds, fixed for
// each act when the run starts. A run is nine rounds in three acts; past round nine the assays come round again.
const ASSAYS = ['scarce', 'short', 'each', 'loose'];
function runAssays(run, rnd) { const R = rnd || rand, a = ASSAYS.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } run.assay = a.slice(0, 3); return run; }
const assayOf = (run, round) => { const r = round || run.round; return run.assay && r % 3 === 0 ? run.assay[(r / 3 - 1) % run.assay.length] : null; };
// before each round: three rounds to choose from, each a molecule, a brief, a number to beat and what it pays
function runBriefs(run, rnd) {
  const R = rnd || rand, mix = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  const open = Object.keys(KIN).filter(k => KIN[k].tier <= (run.tier || 0)), draw = () => { let t = 0; open.forEach(k => { t += KIN[k].odds; }); let v = R() * t, pick = 'chain'; for (const k of open) { v -= KIN[k].odds; if (v < 0) { pick = k; break; } } return pick; };
  const feeds = []; for (let guard = 0; feeds.length < 3 && guard < 80; guard++) { const k = draw(), of = feedsFor(k, run.round, feeds); if (of.length && (open.length < 3 || !feeds.some(f => KIN_OF[f] === k))) feeds.push(of[Math.floor(R() * of.length)]); }
  while (feeds.length < 3) feeds.push(feedsFor('chain', run.round, feeds)[0] || FEEDS.filter(f => !feeds.includes(f))[0]);
  const as = assayOf(run);
  // Choosing the molecule (docs/LOOP.md): two molecules of the round's size, one is taken, free. Both are plain rounds,
  // or both the round's assay. The one that is harder to set off by the screen pays coins on top when it is beaten.
  if (RULE.choose) { const n = run.single ? 1 : 2, br = as || 'plain', out = feeds.slice(0, n).map(f => ({ brief: br, pays: as ? 2 : null, assay: !!as, model: salt(modelOf(f), R), kin: kinOf(f), src: f, quota: runQuota(run, f, br), ease: easeOf(run, f), coins: 0 }));
    if (n === 2) { const hard = out[0].ease <= out[1].ease ? 0 : 1, d = Math.abs(out[0].ease - out[1].ease); out[hard].coins = d >= CHOOSE.two ? 2 : d >= CHOOSE.one ? 1 : 0; } return out; }
  if (as) return [{ brief: as, pays: 2, assay: true, model: salt(modelOf(feeds[0]), R), kin: kinOf(feeds[0]), src: feeds[0], quota: runQuota(run, feeds[0], as) }];
  const sp = mix(BRIEFS.filter(b => b.id !== 'plain' && b.id !== 'carry')), pay = mix([1, 2]);
  // the molecule left by the last round can be carried on with, while a reagent held still acts on it
  // (with a size limit, a reagent that could only grow a molecule already at the limit does not count)
  const carry = run.last && (() => { const g0 = begin(run.last, false, run.rack.slice(), null, []); g0.left = {}; run.rack.forEach(id => { g0.left[id] = 1; }); return Object.keys(options(g0)).length >= 1; })();
  return [{ brief: carry ? 'carry' : 'plain', pays: null }, { brief: sp[0].id, pays: pay[0] }, { brief: sp[1].id, pays: pay[1] }].map((o, i) => { const own = o.brief === 'carry'; o.model = own ? run.last : salt(modelOf(feeds[i]), R); o.kin = own ? (run.kin || 'chain') : kinOf(feeds[i]); o.src = own ? (run.src || null) : feeds[i]; o.quota = runQuota(run, own ? run.last : feeds[i], o.brief); return o; });
}
// How easy a molecule is to set off with the reactions the run holds, read off the structure (screen): the longest
// cascade a hand of five can set off, averaged over every hand, plus the share of all lines of three that set off any.
// CHOOSE: the harder of a pair pays one coin when it is this far behind, two when that far; `bad` and `coin` are what
// the simulated players go by (a pair worth drawing again; what a coin is worth in steps).
const CHOOSE = { one: 0.5, two: 2, most: 3, bad: 1.5, coin: 0.8 }, EASE = {};
function easeOf(run, src) { const pool = run.rack || RUNG.start, self = run.self || SELF0, k = src + '|' + pool.join(',') + '|' + self.join(','); if (EASE[k] != null) return EASE[k]; const s = screen(src, pool, self), h = s.hands.length ? s.hands.reduce((a, b) => a + b, 0) / s.hands.length : s.best; return (EASE[k] = Math.round((h + s.ge1) * 100) / 100); }
// the pair drawn again: 1 coin, then 2, then 3 within one round; nothing when it cannot be paid or has been done three times
const pairCost = run => ((run.redraws || 0) >= CHOOSE.most ? null : 1 + (run.redraws || 0));
function runRedraw(run, rnd) { const c = pairCost(run); if (!RULE.choose || !RULE.coins || c == null || (run.coins || 0) < c) return null; run.coins -= c; run.redraws = (run.redraws || 0) + 1; return runBriefs(run, rnd); }
function runChoose(run, o) { run.redraws = 0; run.payCoins = o.coins || 0; run.kin = o.kin || 'chain'; run.src = o.src || null; run.brief = o.brief; run.feed = o.model; run.quota = o.quota; run.pays = o.pays; run.carryE = 1 + ((run.lastE || 1) - 1) / 2; }
// keeps the molecule and the extra a beaten round ended on, for carrying on
function runKeep(run, g) { run.last = RX.cloneMap(g.m).model; run.lastE = g.E / (g.gear.includes('pact') ? 3 : 1); }
// pays the credit the brief promised and returns how much
function runPay(run) { const n = run.pays || 0; run.pays = null; run.bonus = (run.bonus || 0) + n; return n; }
function runNew(tier, extra) { const t = Math.max(0, Math.min(SUPPLY.length - 1, tier | 0)), st = stock(t); return runAssays({ extra: (extra || []).slice(), round: 1, tier: t, rack: RUNG.start.slice(), rare: st.rare, gear: [], self: SELF0.slice(), lv: {}, grade: {}, uses: {}, base: {}, beaten: 0, over: false, brief: 'plain', feed: FEEDS[0], pays: null, bonus: 0, coins: 0, rerolls: 0, by: { water: 0, h2: 0, gauge: 0 } }); }
const runBegin = (run, feed, relaxed) => synBegin(feed, relaxed, null, run.gear, run);
// the number to beat is measured against a plain player with the starting four reagents and nothing else
// Terms are chosen before a run, one sigil for the whole run. Each changes the odds or the stakes and pays for it.
// The transmutation circle under the molecule. A reagent lights a rune the first time it is used; using it again
// lights nothing. A broken row puts out the last rune. A full circle multiplies the round and starts again. So the
// reagent that keeps the row going and the reagent that feeds the circle are often not the same one.
const CIRCLE = { plain: { n: 4, mul: 1.5 }, glass: { n: 3, mul: 2 }, occult: { n: 4, mul: 1.5 }, lean: { n: 3, mul: 1.5 }, long: { n: 5, mul: 2.5 }, hoard: { n: 4, mul: 1.5 } };
const TERMS = [
  { id: 'plain', name: 'plain', note: '' },
  { id: 'glass', name: 'glass', note: 'mult 3, one break', deed: 'no breaks' },
  { id: 'occult', name: 'occult', note: '+1 occult, beat 1.5', deed: 'round 5' },
  { id: 'lean', name: 'lean', note: '3 reagents, +1 use', deed: '2 reagents' },
  { id: 'long', name: 'long', note: '4 a page, 2 pages', deed: 'row of 10' },
  { id: 'hoard', name: 'hoard', note: '3 pieces, no more', deed: '5 pieces' }
];
// which sigils a finished round has earned: g is the round, run the run, pass whether the number was beaten
function deeds(g, run, pass) {
  const out = [];
  if (pass && g.tally.breaks === 0 && g.trail.length >= 6) out.push('glass');
  if (run.beaten >= 5) out.push('occult');
  if (pass && new Set(g.cur.used).size <= 2) out.push('lean');
  if (g.best >= 10) out.push('long');
  if (run.gear.length >= 5) out.push('hoard');
  return out;
}
function runTerm(run, id) {
  run.term = id; run.stake = 1; run.payMul = 1;
  if (id === 'glass') run.glass = true;
  else if (id === 'occult') { const occ = RULE.five ? Object.keys(FIVE) : Object.keys(GEARS).filter(k => GEARS[k].kin === 'occult' && k !== 'idol' && k !== 'pact'); run.gear.push(occ[Math.floor(rand() * occ.length)]); run.stake = 1.5; }
  else if (id === 'lean') { run.rack = RUNG.start.slice(0, 3); run.usesAll = 1; }
  else if (id === 'long') { run.steps = 1; run.pages = -1; }
  else if (id === 'hoard') { const pool = stock(run.tier).gear.slice(); for (let k = 0; k < 3 && pool.length; k++) run.gear.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]); run.noGear = true; }
  return run;
}
// The number to beat: Par for the round, times the square root of the molecule's size factor, times any stake the
// player chose (the pact, the idol, the hourglass, the terms of the run). It never reads the rest of the build, so a
// better build beats it by more. The method is in docs/BALANCE.md and the measurement in docs/RIG.md.
// GENERATED by the measuring rig (docs/RIG.md, docs/tools_sim.js) on 2026-11-11 from the rules at commit 6cf2f7c.
// Do not edit by hand: measure again. Factors fitted on 480 runs of the median player choosing rounds at random (seeds 1 to 480). Par fitted on the measure g1 (novice 202 runs, greedy 201, median 257, planner 120, seeds from 1): rounds one to three are what 90, 80 and 55 in 100 novices reach (round three is held by the cap), no round asks more than 2.6 times the one before, and from round four Par is fitted to the median player's pass rate and margin together. Measured, awaiting review.
// PAR.rounds: the number for a plain round on a molecule of average size in rounds one to nine, each fitted to the
// pass rate and the margin in docs/BALANCE.md together (docs/tools_par.py). after: the step for every round past nine.
const PAR = { rounds: [675, 958, 2490, 6480, 16800, 43600, 92600, 130000, 225000], after: 1.74, last: 1 };
// MOLF: what the median simulated player makes on each molecule inside runs, over the average of all the molecules.
// KINDF: what each kind of round makes against a plain one. ASSAYF: the same for the kind of an assay, for each of
// the three acts, over the average of the four kinds. Fitted together by docs/tools_factors.py. The number to beat is
// multiplied by all of them, so every kind of round and every molecule is beaten by a like margin.
const MOLF = {"C=CCC(C)(O)CCC(=O)CCC=C":0.691,"C=CCCC(=O)CC1CCCC1=O":0.304,"C=CCCC(=O)CCC(=O)C1=CC=CC=C1":0.461,"C=CCCC(=O)CCC(=O)CC1CCCC1=O":0.601,"C=CCCC(=O)CCC(=O)CCC(O)CCCCCC(=O)CCC(=O)CCC(=O)C":1.535,"C=CCCC(=O)CCC(=O)CCCC=O":1.752,"C=CCCC(=O)CCC(=O)CCCCCC(O)CCC(=O)C":1.252,"C=CCCC(=O)CCC(C)(O)C1CC2CCC1C2":0.46,"C=CCCC(=O)CCC(O)C12CC3CC(CC(C3)C1)C2":0.406,"C=CCCC(=O)CCC(O)CCC(=O)C1=CC=C(C=C1)C(C)=O":2.998,"C=CCCC(=O)CCC(O)CCC(=O)CCCCCC(=O)C12C3C4C1C5C2C3C45":0.825,"C=CCCC(=O)CCC(O)CCC1(O)CCCC1CCC(=O)CCC(=O)C":0.904,"C=CCCC(=O)CCC1(O)CCCC1":0.577,"C=CCCC(=O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C":1.107,"C=CCCC(C)(O)CCC(=O)CCC=C":0.935,"C=CCCC(O)CCC(=O)C1CCCC1":0.608,"C=CCCC(O)CCC(=O)CCC(=O)C1=CC=C(C=C1)C(=O)CCC(=O)C":2.163,"C=CCCC(O)CCC(=O)CCC1(O)CCCC1":0.896,"C=CCCC(O)CCC(=O)CCCCCCCC(=O)CCC(=O)C":0.804,"C=CCCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)C":4.506,"C=CCCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)C":4.728,"CC(=O)CCC(=O)CCC(=O)CCC(O)CCCCCCCC(=O)CCC(=O)CCC(=O)C":1.377,"CC(=O)CCC(=O)CCC(O)C1CC2CCC1C2":0.696,"CC(=O)CCC(=O)CCC(O)CC1CCC(CC1)CCC(=O)CCC(=O)C":0.66,"CC(=O)CCC(=O)CCC(O)CCCCCC(=O)CCC(=O)C":1.208,"CC(=O)CCC(=O)CCC1(O)CCCC1CCCCCC(=O)CCC(=O)C":0.429,"CC(=O)CCC(=O)CCCCCC(=O)CCC(O)C12CC3CC(CC(C3)C1)C2":0.876,"CC(=O)CCC(=O)CCCCCC(=O)CCC(O)CCC(=O)CCC(O)C12CC3CC(CC(C3)C1)C2":1.962,"CC(=O)CCC(O)CC1CCC(CC1)CC(O)CCC(=O)C":0.665,"CC(=O)CCC(O)CCC(=O)C1=CC=C(C=C1)C(C)=O":3.244,"CC(C)(O)C=CC=CCCCC=CC(=O)CCC(=O)C":1.396,"CC(C)(O)C=CC=CCCCC=CC(=O)CCC(=O)CCC(=O)C":1.248,"CC(C)(O)C=CC=CCCCC=CC(=O)CCC(=O)CCC(=O)C12C3C4C1C5C2C3C45":0.47,"CC(C)(O)CCC(=O)CCC(O)CCC(=O)CCC=C":1.537,"CC(C)(O)CCC(=O)CCC(O)CCC(=O)CCCCCC(=O)CCC(=O)CCC(=O)C":1.005,"CC(C)(O)CCC(=O)CCC=C":0.425,"CC(C)(O)CCC(=O)CCCCCC(=O)CCC(=O)C":0.873,"CC(C)(O)CCC(O)CCC(O)C":0.698,"CC(C)(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)CCC(O)C":2.528,"CC(C)(O)CCC(O)CCC(O)CCC(O)CCCCCC(O)CCC(O)CCC=C":1.35,"CC(C)(O)CCC(O)CCC(O)CCC=C":1.048,"CC(C)(O)CCC(O)CCC(O)CCCCCC(O)CCC(=O)C":0.625,"CC(C)(O)CCC=CCCC=CCCC=CCCC(=O)C12C3C4C1C5C2C3C45":0.654,"CC(C)(O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C":0.574,"CC(C)(O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C":0.325,"CC(O)CCC(=O)CCC(=O)C12C3C4C1C5C2C3C45":0.31,"CC(O)CCC(=O)CCC=CCCC(=O)C":1.252,"O=CCCC(=O)CCC(=O)CCC=C":2.131,"O=CCCC(=O)CCC(C)(O)CCC=C":1.015,"O=CCCC(=O)CCC(O)CCC(=O)CCCCCCCC(=O)CCC(=O)CCC=C":1.095,"O=CCCC(=O)CCC(O)CCCCCC(=O)CCC(=O)C":1.113,"O=CCCC(=O)CCC1(O)CCCC1":0.624,"O=CCCC(=O)CCC=C":1.61,"O=CCCC(C)(O)CCC(=O)CCC=C":1.088,"OC(C1=CC=CC=C1)C=CC=CCCCC=CC(=O)CCC(=O)CCC(=O)C":1.929,"OC1(CCC(=O)CCC=C)CC2CCC1C2":0.532,"OC1(CCCC1)CCC(=O)CCC=C":0.508,"OC1(CCCC1)CCC(=O)CCCC=O":0.84,"OC1(CCCCC1)C=CC=CCCCC=CC(=O)CCC(=O)C":0.469,"OC1(CCCCC1)CCC(=O)CCC(O)CCC(=O)C":0.557,"OC1(CCCCC1)CCC(=O)CCC(O)CCC(=O)CCCCCC(=O)CCC(=O)CCC=C":0.895,"OC1(CCCCC1)CCC(=O)CCCCCC(=O)CCC(=O)C":0.278,"OC1(CCCCC1)CCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C":0.601,"OC1(CCCCC1)CCC=CCCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C":0.81,"OC1=CC=CC=C1CCC(=O)CCC(=O)CCC=C":1.577,"OC1=CC=CC=C1CCC(=O)CCC(O)C":0.81,"OC1=CC=CC=C1CCC(=O)CCC(O)CCC(=O)C":2.134,"OC1=CC=CC=C1CCC(=O)CCC(O)CCC(=O)CCCCCC(=O)CCC(=O)C":0.891,"OC1=CC=CC=C1CCC(=O)CCC(O)CCC(=O)CCCCCCCC(=O)CCC(=O)C":1.092,"OC1=CC=CC=C1CCC(=O)CCC=C":1.209,"OC1=CC=CC=C1CCC(=O)CCC=CCCC=CCCC=CCCC(=O)C":3.16,"OC1=CC=CC=C1CCC(=O)CCC=CCCC=CCCC=CCCC=CCCC(=O)C":3.215,"OC1=CC=CC=C1CCC(=O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C":3.326,"OC1=CC=CC=C1CCC(=O)CCCC=O":0.942,"OC1=CC=CC=C1CCC(O)CCC(=O)C":1.419,"OCCCC(O)CCC(O)CCC(=O)CCCCCC(O)CCC(O)CCC(O)CCC=C":1.498,"OCCCC(O)CCC(O)CCC(O)CCCCCC(=O)CCC(=O)C":0.94,"OCCCC(O)CCC(O)CCC=C":2.955};
const KINDF = {"plain":1.0,"carry":1.108,"broad":1.911,"loose":1.397,"each":1.708,"back":1.243,"scarce":1.032,"short":0.472};
const ASSAYF = {"scarce":[0.953,0.915,1.032],"short":[0.314,0.407,0.393],"each":[2.062,1.494,1.487],"loose":[1.62,1.799,1.658]};
const MOLD = { lo: 0.1, hi: 10, pow: 1 };
// END GENERATED
// A molecule's size factor is held between lo and hi, and only its square root is taken: a molecule that makes more
// asks for more, but for less than it makes.
const parOf = round => { const r = Math.max(1, round | 0); return r <= 9 ? PAR.rounds[r - 1] * (r === 9 ? PAR.last : 1) : PAR.rounds[8] * PAR.last * Math.pow(PAR.after, r - 9); };
const molSize = key => Math.pow(Math.min(MOLD.hi, Math.max(MOLD.lo, MOLF[key] || 1)), MOLD.pow);
const kindSize = (run, brief, round) => { const r = round || run.round, a = assayOf(run, r) && ASSAYF[brief]; return a ? a[Math.min(2, Math.max(0, Math.floor(r / 3) - 1))] : KINDF[brief] || 1; };
const stakeOf = run => (run.gear.includes('pact') ? 2 : 1) * (run.gear.includes('idol') ? 1.5 : 1) * (run.gear.includes('hourglass') ? 1.25 : 1) * (run.stake || 1);
// feed is the molecule's SMILES. A molecule carried on from the last round counts as the one it started as.
// A round that carries the last molecule on has no molecule factor: what it starts from is not what the factor measured.
const quotaParts = (run, feed, brief) => { const b = brief || run.brief || 'plain', st = stakeOf(run); return { par: parOf(run.round), stake: st, mult: (b === 'carry' ? 1 : molSize(typeof feed === 'string' ? feed : run.src)) * kindSize(run, b) * st }; };
const nice = q => { const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(10, q))) - 1)); return Math.max(50, Math.round(q / mag) * mag); };
function runQuota(run, feed, brief) { const k = quotaParts(run, feed, brief); return nice(k.par * k.mult); }
// The marks above the number to beat, lowest first, and how many of them a total has reached. A total under the
// number has reached none.
const runMarks = quota => (RULE.tiers || []).map(t => nice(quota * t));
const marksHit = (total, quota) => (total >= quota ? runMarks(quota).filter(m => total >= m).length : 0);
// Coins live only inside a run. A beaten round pays one for each mark above the number that was reached, and coins
// already held pay interest first: one for every COIN.per held, COIN.cap at most. On the take-one page they are
// spent: the three offers are dealt again for 1, then 2, then 3 within one visit; a held piece of equipment is
// removed for COIN.bin. Leaving all three pays COIN.skip.
const COIN = { mark: 1, skip: 1, bin: 2, per: 3, cap: 2 };
const rerollCost = run => 1 + (run.rerolls || 0);
const interestOf = run => (RULE.coins ? Math.min(COIN.cap, Math.floor((run.coins || 0) / COIN.per)) : 0);
function runEarn(run, total, quota) { run.rerolls = 0; const extra = run.payCoins || 0; run.payCoins = 0; if (!RULE.coins || total < quota) return { marks: 0, interest: 0, extra: 0 }; const interest = interestOf(run), marks = marksHit(total, quota) * COIN.mark; run.coins = (run.coins || 0) + interest + marks + extra; return { marks, interest, extra }; }
function runReroll(run, rnd) { const c = rerollCost(run); if (!RULE.coins || (run.coins || 0) < c) return null; run.coins -= c; run.rerolls = (run.rerolls || 0) + 1; return runPicks(run, rnd); }
function runSkip(run) { run.rerolls = 0; if (RULE.coins) run.coins = (run.coins || 0) + COIN.skip; }
function runBin(run, id) { if (!RULE.coins || (run.coins || 0) < COIN.bin || !run.gear.includes(id)) return false; run.coins -= COIN.bin; run.gear = run.gear.filter(q => q !== id); delete run.lv[id]; return true; }
function runPicks(run, rnd) {
  const R = rnd || rand, any = a => a[Math.floor(R() * a.length)], st = stock(run.tier), out = [];
  const newR = st.reagents.concat(run.extra || []).filter(id => !run.rack.includes(id) && !Object.keys(PAIR).some(k => PAIR[k] === id)), newG = run.gear.length < RUNG.slots && !run.noGear ? st.gear.filter(id => !run.gear.includes(id)) : [];
  const newS = RULE.cascade ? SELF.filter(q => q.tier <= run.tier && !(run.self || []).includes(q.id) && !(RULE.ban || []).includes(q.id)).map(q => q.id) : [];
  const from = { self: newS, reagent: newR, gear: newG, level: run.gear.filter(id => !GEARS[id].rule), strong: run.rack.filter(id => dealtIn(run, id)), bottle: run.rack.filter(id => dealtIn(run, id)) };
  // one new thing where there is one, then whatever else, three different kinds where possible
  let kinds = ['reagent', 'gear', 'self'].filter(k => from[k].length); for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = kinds[i]; kinds[i] = kinds[j]; kinds[j] = t; }
  const rest = ['strong', 'bottle', 'level'].filter(k => from[k].length); for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = rest[i]; rest[i] = rest[j]; rest[j] = t; }
  kinds = kinds.concat(rest).slice(0, 3);
  // a reagent is drawn by its odds, and each supplier opened makes the rarer ones a little likelier
  const drawR = list => { const w = list.map(id => rarityOf(id).odds * (rarityOf(id).odds < 60 ? 1 + 0.25 * run.tier : 1)); let x = R() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < list.length; i++) { x -= w[i]; if (x <= 0) return list[i]; } return list[list.length - 1]; };
  kinds.forEach(kind => out.push({ kind, id: kind === 'reagent' ? drawR(from[kind]) : any(from[kind]) }));
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = out[i]; out[i] = out[j]; out[j] = t; }
  return out;
}
function runTake(run, o) {
  run.rerolls = 0;
  if (o.kind === 'reagent') { [o.id, PAIR[o.id]].forEach(id => { if (id && !run.rack.includes(id)) run.rack.push(id); }); }
  else if (o.kind === 'gear') { if (run.gear.length < RUNG.slots && !run.gear.includes(o.id)) run.gear.push(o.id); }
  else if (o.kind === 'self') { if (!run.self.includes(o.id)) run.self.push(o.id); }
  else if (o.kind === 'level') run.lv[o.id] = (run.lv[o.id] || 1) + 1;
  else if (o.kind === 'strong') run.grade[o.id] = (run.grade[o.id] || 1) + 1;
  else if (o.kind === 'bottle') run.uses[o.id] = (run.uses[o.id] || 0) + 1;
}
// one line saying what a pick does
function pickText(run, o) {
  if (o.kind === 'reagent') return '';
  if (o.kind === 'self') return 'by itself';
  if (o.kind === 'gear') return GEARS[o.id].note;
  if (o.kind === 'level') return 'level ' + ((run.lv[o.id] || 1) + 1) + ': ' + GEARS[o.id].note;
  if (o.kind === 'strong') return '+' + rarityOf(o.id).place * SYN.strong + ' a place';
  return '+1 use';
}
AA.rxPath = { CHOOSE, easeOf, pairCost, runRedraw, JAR, HOMS, HOMSIM, homOn, homEvent, homFed, homLit, frozenPay, homReady, homSpots, homTry, homUse, homGo, runBank, FIVE, FIFTH, fifthSet, TOOLUSES, canTool, toolSpots, toolUse, toolGo, toolTry, toolWorth, toolBest, startDue, startRun, again, cascMode, afterTurn, dealtIn, RULE, CASC, SELF0, selfRun, screenStep, screenLines, screen, screenRound, FEED, feedSize, sizeFor, feedsFor, reopenAll, cascadeNext, cascadeDue, cascade, snap, back, BANKID, queued, usesLeft, queueRoom, queueAdd, queueDrop, queueHead, queueShift, queueStep, queueView, waste, heavy, usesOf, handOf, chainOpts, canBank, bankGain, bank, canRedraw, redrawCost, redraw, seed, rand, MODEL, ASSAYS, runAssays, assayOf, TERMS, CIRCLE, runTerm, deeds, wish, douse, SELFMODE, selfOptions, SELF, KIN, kinOf, kinsOf, charged, fire, chainNext, byKind, CATCH, BY, RARITY, TIER, rarityOf, FAMILIES, FOUND, peek, PAIR, ISO, salt, runKeep, BRIEFS, BRIEF, runBriefs, runChoose, runPay, modelOf, briefBase, PAR, MOLF, MOLD, KINDF, ASSAYF, kindSize, parOf, quotaParts, runMarks, marksHit, COIN, rerollCost, interestOf, runEarn, runReroll, runSkip, runBin, pagesOf, stepsOf, SUPPLY, stock, RUNG, runNew, runBegin, runQuota, runPicks, runTake, pickText, DIAL, FEEDS, GEAR, GEARS, OFFER: 4, begin, options, take, deliver, survey, deal, keeps, safe, kit,
  SYN, RARE, STYLES, kitRound, synRack, synBegin, synTake, synFinish, synEnd, synQuota, synPlay, held, made, mult, breaks, turn, finishOpt };
})(typeof globalThis !== 'undefined' ? globalThis : window);
