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
// (2026-11-11, the bare game: rounds two to six ask for less than they did, 14, 16.5, 19, 21.5 and 24 before, so a
// player who reads the page does not pull away from one who does not as fast: docs/RIG.md, fourth measure)
const FEEDSIZE = { rounds: [11.5, 12.5, 14, 16.5, 19.5, 23, 27, 31, 35], near: 3.5 };
const sizeFor = round => FEEDSIZE.rounds[Math.max(1, Math.min(9, round | 0)) - 1];
// the molecules of a family that suit a round: those near its size, or failing that the two nearest
// The shape of a molecule as dealt, counted from its SMILES: OH, C=C outside benzene rings, C=O.
// RULE.filter (rounds one to three, docs/TIER1_DEPTH.md): a molecule is rejected when it has two or more OH and no
// C=C, or a single C=O and no C=C, or only one kind of group; one with at most one OH and two or more C=C is
// preferred (it is twice as likely to be dealt). A round that would be left with nothing keeps what it had.
const SHAPE = {};
function feedShape(f) { if (SHAPE[f]) return SHAPE[f]; const m = RX.fromSmiles(f), ar = RX.aromaticAtoms(m); let oh = 0, ene = 0, one = 0; m.bonds.forEach(b => { if (b.order !== 2) return; if (b.a.el === 'C' && b.b.el === 'C') { if (!(ar.has(b.a) && ar.has(b.b))) ene++; } else if ((b.a.el === 'O') !== (b.b.el === 'O')) one++; }); m.atoms.forEach(a => { if (a.el !== 'O') return; const nb = m.neighbors(a); if (nb.length === 2 && nb.every(q => q.bond.order === 1) && nb.some(q => q.atom.el === 'H')) oh++; });
  const kinds = (oh ? 1 : 0) + (ene ? 1 : 0) + (one ? 1 : 0), bad = (oh >= 2 && !ene) || (one === 1 && !ene) || kinds <= 1; return (SHAPE[f] = { oh, ene, one, bad, good: !bad && oh <= 1 && ene >= 2 }); }
const FILTER = { upTo: 3, prefer: 2 };
function feedsFor(kin, round, skip) { const of = FEEDS.filter(f => KIN_OF[f] === kin && !(skip || []).includes(f)), t = sizeFor(round), near = of.filter(f => Math.abs(feedSize(f) - t) <= FEEDSIZE.near); let out = near.length ? near : of.sort((a, b) => Math.abs(feedSize(a) - t) - Math.abs(feedSize(b) - t)).slice(0, 2);
  if (RULE.filter && round <= FILTER.upTo) { const ok = out.filter(f => !feedShape(f).bad); if (ok.length) { out = ok; const pref = out.filter(f => feedShape(f).good); for (let k = 1; k < FILTER.prefer; k++) out = out.concat(pref); } }
  return out; }
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
// RULE.bare: the bare game (docs/ORDER.md, layers 1 to 4): no piece is offered or held and no creature is taken
RULE.bare = false;
// choose: before a round two molecules are shown and one is taken (docs/LOOP.md). Off: three kinds of round, as before.
RULE.choose = true;
// next: the hand of the next page is drawn when this page is dealt, from the same random source, and shown (g.nextHand).
//       What is shown is what is dealt. The last page of a round shows nothing.
// lastx: what the molecule does by itself after the THIRD reaction of the line pays double: every step of the cascade
//       that runs once the last circle of the page has acted (g.lastOn). A third circle that is wasted or is the
//       bank sets nothing off and doubles nothing. LASTX.mul is the factor.
// filter: the molecules of rounds one to three are picked by shape (docs/TIER1_DEPTH.md): see feedShape.
RULE.next = true; RULE.lastx = true; RULE.filter = true;
// spec: a round is won by meeting its spec (an at-least about the molecule or the round, see the block THE SPEC); yield only pays gold and letters the words
RULE.spec = true;
// specEase: added to the aiming player's clear rate each spec is tuned to, in the bachelor's (three rounds) only. The table's N was fitted
// on the Python engine with an aiming player; the game's players clear less (RIG.md, seventh measure, part two), so a new player's
// first run is eased. 0.2 gives the novice a win in about 3 tries. The longer runs are never eased (HARNESS W2).
RULE.specEase = 0.2;
const LASTX = { mul: 2 };
// Tiers (docs/LOOP.md): a run is three rounds, then six, then nine. Tier 1 is the bare game: the six starting
// reactions, no helper, no creature, nothing new offered between rounds. (run.tier is the supplier index, an older
// thing: the tier of a run is run.tierNo, and run.span is how many rounds it has.)
const TIERS = { 1: { rounds: 3, bare: true, helpers: false, creatures: false }, 2: { rounds: 6, bare: false, helpers: true, creatures: false }, 3: { rounds: 9, bare: false, helpers: true, creatures: true } };
const tierRule = n => TIERS[n] || TIERS[3];
// The three lengths of a run (docs/NAMES.md): bachelor's (3 rounds), master's (6), doctorate (9). A run starts at the length the
// player has reached (opts.reach, the highest length opened, 1 to 3; or opts.length by name; or opts.tierNo as before). Winning a
// bachelor's opens master's, winning a master's opens doctorate (reachAfter).
const LENGTHS = [{ name: 'bachelor', rounds: 3, tierNo: 1 }, { name: 'master', rounds: 6, tierNo: 2 }, { name: 'doctorate', rounds: 9, tierNo: 3 }];
const lengthOf = n => LENGTHS[Math.max(1, Math.min(3, n | 0)) - 1];
function runTierNo(opts) { if (!opts) return 0; if (TIERS[opts.tierNo]) return opts.tierNo; if (opts.length) { const i = LENGTHS.findIndex(l => l.name === opts.length); if (i >= 0) return i + 1; } if (opts.reach) return Math.max(1, Math.min(3, opts.reach | 0)); return 0; }
// a run or a round (g) may be asked
const runOf = x => (x && x.runRef ? x.runRef : x);
const runLast = x => { const run = runOf(x); return (run && run.span) || 9; };
const runWon = x => { const run = runOf(x); return !!run && (run.beaten || 0) >= runLast(run); };
const bareRun = run => !!RULE.bare || !!(run && run.bare);
// The reaction rules read RX.MODE, which is one global. It is set from RULE and from the run every time rules are
// read for a run (a round begun, the pair read, the picks dealt), so no run plays under what the run before it left.
// The bare game has no jar to fill, so oxidize gives off no carbon dioxide there.
const modeSync = run => { RX.MODE.weld = RULE.weld || 'ol'; RX.MODE.co2 = !!RULE.co2 && !bareRun(run); };
// Do the three uses of a reaction ever run out? Measured for tier one (docs/RIG.md, fifth measure): never for a player
// who reads the page, outside a scarce assay; but a player placing at random meets a reaction with no use left on a
// third of pages, because rounds one to three deal the same four reactions on every page. So the uses do bind for
// the player the first run is for, and the page should keep the use marks: this says true.
// usesFree: in the three-round bare run no reaction runs out of uses, so the page hides the use marks there.
RULE.usesFree = true;
const usesFreeOn = run => !!RULE.usesFree && !!run && run.tierNo === 1;
const usesBind = run => !usesFreeOn(run);
const allFree = () => new Proxy({}, { get: () => true, set: () => true });
// the round last begun, so the page can swap two queued circles by index alone
let cur0 = null;
const swapQueue = (i, j) => (cur0 ? queueSwap(cur0, i, j) : false);

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
  g.rare = {}; g.free = g.usesFree ? allFree() : {}; g.kinds.forEach(id => { if (g.rareOn !== false && R() < SYN.rare * (g.gear.includes('loupe') ? 2 : 1) * (g.rareMul || 1)) { const t = RARE[Math.floor(R() * RARE.length)]; if (t === 'plenty') plenty(id); else g.rare[id] = t; } });
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
  g.fore = null; if ((g.gear.includes('orb') || RULE.next) && g.syn && (g.page || 1) < pagesOf(g)) { g.fore = draw(g, R, rack, n, null); g.fore = rack.filter(id => g.fore.includes(id)); }
  g.nextHand = RULE.next && g.fore ? g.fore.slice() : null;
  g.pageSteps = 0; g.more = 0; g.chain = false; g.fired = false; g.chainLen = 0; g.redrawn = false; g.queue = []; g.shot = false; g.casc = 0; g.lastOn = false;
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
  g.brief = (run && run.brief) || 'plain'; g.by = { water: 0, h2: 0, gauge: 0 }; HOMIDS.forEach(id => { g.by[id] = 0; }); g.hom = !bareRun(run) && run && !run.noHom && run.hom && HOMS[run.hom] && HOMS[run.hom].act ? { id: run.hom, fed: run.homFed ? HOMS[run.hom].need : 0, used: 0, frozen: 0 } : null; g.syn = true; g.page = 1; g.total = 0; g.over = false; g.pageSteps = 0; g.best = 0;
  g.P = 0; g.E = 1; g.bank = 0; g.grade = {}; g.gearLv = {}; g.R = rowStart(g); g.tally = { places: 0, loops: 0, kinds: 0, breaks: 0 };
  if (run) { g.grade = Object.assign({}, run.grade); g.gearLv = run.lv; g.usesPlus = run.uses; if (run.rack) g.rackIds = run.rack.filter(id => dealtIn(run, id)); g.rareOn = !!run.rare; g.usesAll = run.usesAll || 0; g.termSteps = run.steps || 0; g.termPages = run.pages || 0; g.rareMul = run.rareMul || 1; if (run.glass) { g.glass = true; g.E = 3; } if (run.term && run.term !== 'plain') { const C = CIRCLE[run.term] || CIRCLE.plain; g.ring = C.n; g.ringMul = C.mul; g.lit = 0; g.ringSet = []; } }
  if (g.brief === 'carry' && run && run.carryE) g.E = run.carryE;
  if (run && g.gear.includes('milk')) { run.milk = (run.milk || 0) + 1; g.E += 0.1 * run.milk; }
  modeSync(run); if (RULE.reopen && RULE.cascade) RX.reopen(g.m);
  g.left = {}; g.usesFree = usesFreeOn(run); g.free = g.usesFree ? allFree() : {}; g.rare = {}; g.loopsCont = 0; cur0 = g; if (RULE.uses) (g.rackIds || synRack()).forEach(id => { g.left[id] = usesOf(g, id); });
  g.runRef = run || null; g.runLen = run ? { name: run.len || lengthOf(run.tierNo || 3).name, rounds: runLast(run), round: run.round || 1, tierNo: run.tierNo || 3 } : null;
  specBegin(g, run);
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
  const lx = RULE.lastx && o.casc && g.lastOn ? LASTX.mul : 1;
  const b = g.brief, polyLen = id === 'aibn' ? Math.max(2, o.model.atoms.reduce((t, a) => t + (a.poly || 0), 0)) / 2 : 1, per = (o.casc ? CASC.place * lx : id === 'aibn' ? SYN.place * polyLen : id === 'allyl' ? SYN.place : rarityOf(id).place) * (1 + SYN.strong * ((g.grade[id] || 1) - 1)) * (b === 'broad' ? 2 : 1) * (b === 'each' && !first && !o.casc ? 0 : 1);
  for (let i = 0; i < r.hits; i++) { c.hit = i; if (per) emit('bottle', A('p', per)); pieces('site'); }
  if (o.casc && r.hits) { g.casc = (g.casc || 0) + 1; const fresh = !RULE.fresh || g.casc > (g.cascBest || 0), w = fresh ? 1 : CASC.old; if (g.casc > 1) emit('cascade', M('h', 1 + (g.casc - 1) * w)); emit('cascade', CASC.mul ? M('e', 1 + CASC.step * g.casc * w * lx) : A('e', CASC.step * g.casc * w * lx), { n: g.casc, fresh, lastx: lx > 1 }); g.tally.casc = Math.max(g.tally.casc || 0, g.casc); }
  if (o.by && GEARS[o.by] && r.hits) ev.push({ src: o.by, act: true, part: 'e', op: 'add', val: 0, P: g.P, R: g.R, E: g.E, made: made(g) });
  if (SHORT[id] && r.hits) { emit('short', M('h', SHORT[id])); emit('short', A('r', 0.5 * (SHORT[id] - 1))); }
  new Set(o.atoms || []).forEach(a => { const I = a.iso && ISO[a.iso]; if (I) emit('iso', { part: I.part, op: I.op, val: I.val }, { iso: a.iso }); });
  // what leaves: caught by equipment, or collected, and always a stroke on the tally. Five strokes pay places, more the longer the row
  (r.gone || []).forEach((grp, gi) => {
    const kind = byKind(grp); let caught = false;
    g.gear.forEach(q => { const fx = CATCH[q] && (CATCH[q][kind] || CATCH[q].any); if (fx) { emit(q, fx, { gone: gi, kind }); caught = true; } });
    if (kind === 'water' || kind === 'h2' || kind === 'co2') { homEvent(g, kind); if (!caught) ev.push({ src: 'collect', kind, gone: gi, part: 'p', op: 'add', val: 0, P: g.P, R: g.R, E: g.E, made: made(g) }); }
    { const ok = SPEC_OFF[kind] || 'other'; g.tally['off_' + ok] = (g.tally['off_' + ok] || 0) + 1; }
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
  g.m = o.model; if (!free) { g.pageSteps++; g.lastOn = !o.self && g.pageSteps >= stepsOf(g); } else if (g.chain) g.chainLen = (g.chainLen || 0) + 1; g.best = Math.max(g.best, cur.path.length);
  const set = false;
  g.trail.push({ id: o.id, hits: o.r.hits, cont: o.cont, held: hold, ev: sc.ev, rare: sc.rare, set, free: !!free });
  if (shatter) synEnd(g);
}
// ---------- the page lined up, then fired ----------
// The state of a round is saved, something is tried, and the state is put back.
function snap(g) {
  const c = g.cur, s = { P: g.P, R: g.R, E: g.E, bank: g.bank, lit: g.lit, ringSet: g.ringSet, tally: Object.assign({}, g.tally), by: Object.assign({}, g.by), lost: g.lost, tower: g.tower, chain: g.chain, fired: g.fired, best: g.best, pageSteps: g.pageSteps, left: Object.assign({}, g.left), m: g.m, trail: g.trail.length, path: c.path, fresh: c.fresh, layers: c.layers, seen: c.seen, step: c.step, used: c.used.length, over: g.over, total: g.total, more: g.more, doused: g.doused, chainLen: g.chainLen, loopsCont: g.loopsCont, kinds: g.kinds, free: g.free, rare: g.rare, redrawn: g.redrawn, shot: g.shot, casc: g.casc, queue: (g.queue || []).slice(), startTodo: (g.startTodo || []).slice(), mirrored: g.mirrorUsed, tools: g.tools, hom: g.hom, recycled: g.recycled, wastedNow: g.wastedNow, cascBest: g.cascBest, lastOn: g.lastOn, rec: g.rec, spec: g.spec };
  c.seen = new Set(c.seen); return s;
}
function back(g, s) {
  const c = g.cur; g.P = s.P; g.R = s.R; g.E = s.E; g.bank = s.bank; g.lit = s.lit; g.ringSet = s.ringSet; g.tally = s.tally; Object.assign(g.by, s.by); g.lost = s.lost; g.tower = s.tower; g.chain = s.chain; g.fired = s.fired; g.best = s.best; g.pageSteps = s.pageSteps; g.left = s.left; g.m = s.m; g.trail.length = s.trail; c.path = s.path; c.fresh = s.fresh; c.layers = s.layers; c.seen = s.seen; c.step = s.step; c.used.length = s.used; g.over = s.over; g.total = s.total; g.more = s.more; g.doused = s.doused; g.chainLen = s.chainLen; g.loopsCont = s.loopsCont; g.kinds = s.kinds; g.free = s.free; g.rare = s.rare; g.redrawn = s.redrawn; g.shot = s.shot; g.casc = s.casc; g.queue = s.queue; g.startTodo = s.startTodo; g.mirrorUsed = s.mirrored; g.tools = s.tools; g.hom = s.hom; g.recycled = s.recycled; g.wastedNow = s.wastedNow; g.cascBest = s.cascBest; g.lastOn = s.lastOn; g.rec = s.rec; g.spec = s.spec;
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
  g.lastOn = false;
  if (!canTool(g, id) || !spot) return false;
  const cm = RX.cloneMap(g.m), mp = v => (Array.isArray(v) ? v.map(mp) : cm.map.get(v)), sp = {}; Object.keys(spot).forEach(k => { sp[k] = spot[k] && typeof spot[k] === 'object' ? mp(spot[k]) : spot[k]; });
  const res = RX.tools.apply(cm.model, id, sp); if (!res) return false;
  if (RULE.atoms && heavy(cm.model) > RULE.atoms && heavy(cm.model) > heavy(g.m)) return false;
  const cur = g.cur, live = new Set(cm.model.atoms), mS = S => { const T = new Set(); (S || []).forEach(a => { const c = cm.map.get(a); if (c && live.has(c)) T.add(c); }); return T; };
  cur.fresh = mS(cur.fresh); cur.layers = (cur.layers || []).map(mS); g.m = cm.model; g.reopened = { n: 1, map: cm.map, made: res.made || [], gone: res.leaving || [] };
  // what a piece drives off is collected as a reagent's by-product is
  (res.leaving || []).forEach(grp => { const kind = byKind(grp); if (kind === 'water' || kind === 'h2' || kind === 'co2') homEvent(g, kind); { const ok = SPEC_OFF[kind] || 'other'; g.tally['off_' + ok] = (g.tally['off_' + ok] || 0) + 1; } g.by.gauge++; });
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
  g.lastOn = false;
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
// the circles are reordered freely before the page is fired: nothing is spent
function queueSwap(g, i, j) { const q = g.queue; if (g.shot || !q || i === j || i < 0 || j < 0 || i >= q.length || j >= q.length) return false; const t = q[i]; q[i] = q[j]; q[j] = t; return true; }
function queueMove(g, from, to) { const q = g.queue; if (g.shot || !q || from === to || from < 0 || to < 0 || from >= q.length || to >= q.length) return false; q.splice(to, 0, q.splice(from, 1)[0]); return true; }
// Does a reaction fit anywhere on the molecule AS IT STANDS NOW? This reads the present only: nothing is tried and
// nothing that the line would do first is counted. The page may grey a reaction (in the hand or in a circle) that
// fits nowhere now. The bank fits when it could be used now.
function fitsNow(g, id) { if (id === BANKID) return canBank(g); const c = RX.CARDS[id]; return !!c && c.find(g.m).length > 0; }
const queueFits = g => (g.queue || []).map(id => fitsNow(g, id));
function queueDrop(g, i) { if (g.shot || !g.queue || i < 0 || i >= g.queue.length) return false; g.queue.splice(i, 1); return true; }
// what the first thing in the queue will do when its turn comes now: take (a reaction), bank, finish, or waste
function queueHead(g) {
  const id = g.queue[0]; if (id == null) return null;
  if (id === BANKID) return { id, kind: canBank(g) ? 'bank' : 'waste' };
  if (id === SYN.finish) { const f = finishOpt(g); return f ? { id, kind: 'finish', o: f } : { id, kind: 'waste' }; }
  const o = options(g)[id]; return o ? { id, kind: 'take', o } : { id, kind: 'waste' };
}
// a circle whose reagent found nothing to act on: the reaction of the page is gone and so is the use
function waste(g, id) { g.lastOn = false; if (id !== BANKID && id !== SYN.finish && !(g.free && g.free[id]) && g.left[id] > 0) g.left[id]--; g.pageSteps++; g.wastedNow = (g.wastedNow || 0) + 1; g.tally.wasted = (g.tally.wasted || 0) + 1; g.trail.push({ id, hits: 0, cont: false, wasted: true, free: false, ev: [] }); }
// takes the head of the queue off it; the page then plays what queueHead said it would do
function queueShift(g) { g.shot = true; return g.queue.shift(); }
// fires the head of the queue and returns what it did. A cascade is set off only by a reagent that acted: a wasted
// circle and the bank change nothing on the molecule and set nothing off
function queueStep(g) { const h = queueHead(g); if (!h) return null; queueShift(g); if (h.kind === 'bank') bank(g); else if (h.kind === 'finish') synFinish(g, h.o); else if (h.kind === 'take') synTake(g, h.o); else waste(g, h.id); if (h.kind !== 'finish') afterTurn(g, h.kind === 'take'); return h; }
// What the page may know while a line is being built (the owner, HARNESS P: nothing shows what a line will do before it is
// fired). Only the present: which reagents of the hand fit somewhere on the molecule as it stands now (o, with no places
// marked on the molecule), whether the bank could be used now, and for each queued circle whether it fits now (kinds:
// 'take', 'bank', 'finish' or 'waste'; fits is the same as booleans). Nothing is tried, nothing a queued circle would do first
// is counted, and no atom is mapped forward (fwd is null).
function queueView(g) {
  const live = g.over ? {} : options(g, true), o = {}; Object.keys(live).forEach(id => { o[id] = Object.assign({}, live[id], { atoms: [] }); });
  const fin = g.over ? null : finishOpt(g), row = g.cur.path.length, fits = queueFits(g);
  const kinds = (g.queue || []).map((id, i) => (id === BANKID ? (fits[i] ? 'bank' : 'waste') : id === SYN.finish ? (fin ? 'finish' : 'waste') : fits[i] ? 'take' : 'waste'));
  return { o, fin, bank: !g.over && !!RULE.bank && g.cur.path.length >= RULE.bankMin && g.P > 0, kinds, fits, fwd: null, row, casc: 0 };
}
// the fire extinguisher: stops a chain that is running; the round counts half again once the page is over
function douse(g) { if (!g.gear.includes('extinguisher') || !g.chain || g.doused) return false; g.chain = false; g.doused = 1; return true; }
const doused = g => { if (g.doused === 1) { g.E *= 1.5; g.doused = 2; } };
function turn(g, rnd) { doused(g); specPage(g); if (g.page >= pagesOf(g)) return false; g.cascBest = Math.max(g.cascBest || 0, g.casc || 0); g.page++; g.back = g.gear.includes('raven') ? g.cur.used[g.cur.used.length - 1] : null; reopenAll(g); synDeal(g, rnd); frozenPay(g); return true; }
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
function synEnd(g) { doused(g); specPage(g); close(g); if (g.gear.includes('pact')) g.E *= 3; g.total = made(g); g.over = true; }
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
// (2026-11-11, the bare game: dehydrate joined in round two and grow in round three. Dehydrate doubled what a reader
// makes and grow tripled it, and neither added anything for a player who places at random. Dehydrate now joins in
// round three and grow in round five: docs/RIG.md, fourth measure.)
// (2026-11-11, tier one: dehydrate now joins in round four, so the three rounds of a first run are dealt from four
// reactions. With dehydrate in round three a reader made 5.7 times what a player placing at random made there, and
// 2.8 times without it: docs/RIG.md, fifth measure.)
RUNG.from = { dehydrate: 4, allyl: 5 };
// RULE.deal6 (owner, 2026-11-11): all six starting reagents are in the deal from round one, five dealt from the six, three fired.
RULE.deal6 = true;
const dealtIn = (run, id) => RULE.deal6 || !(RUNG.from[id] > ((run && run.round) || 1));
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
  modeSync(run);
  const R = rnd || rand, mix = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  const open = Object.keys(KIN).filter(k => KIN[k].tier <= (run.tier || 0)), draw = () => { let t = 0; open.forEach(k => { t += KIN[k].odds; }); let v = R() * t, pick = 'chain'; for (const k of open) { v -= KIN[k].odds; if (v < 0) { pick = k; break; } } return pick; };
  const feeds = []; for (let guard = 0; feeds.length < 3 && guard < 80; guard++) { const k = draw(), of = feedsFor(k, run.round, feeds); if (of.length && (open.length < 3 || !feeds.some(f => KIN_OF[f] === k))) feeds.push(of[Math.floor(R() * of.length)]); }
  while (feeds.length < 3) feeds.push(feedsFor('chain', run.round, feeds)[0] || FEEDS.filter(f => !feeds.includes(f))[0]);
  const as = assayOf(run);
  // Choosing the molecule (docs/LOOP.md): two molecules of the round's size, one is taken, free. Both are plain rounds,
  // or both the round's assay. The one that is harder to set off by the screen pays coins on top when it is beaten.
  if (RULE.choose) { const n = run.single ? 1 : 2, br = as || 'plain', out = feeds.slice(0, n).map(f => ({ brief: br, pays: as ? 2 : null, assay: !!as, model: salt(modelOf(f), R), kin: kinOf(f), src: f, quota: runQuota(run, f, br), ease: easeOf(run, f), coins: 0 }));
    if (RULE.spec) out.forEach(o => { o.spec = specFor(run, o.model, R, o.brief); o.hurdle = { kind: o.spec.mark, n: o.spec.n }; });
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
function easeOf(run, src) { modeSync(run); const pool = run.rack || RUNG.start, self = run.self || SELF0, k = src + '|' + pool.join(',') + '|' + self.join(',') + '|' + [RX.MODE.co2 ? 1 : 0, RX.MODE.weld, RX.MODE.reach, RULE.atoms || 0, RULE.reopen ? 1 : 0, RULE.hand || 5].join(','); if (EASE[k] != null) return EASE[k]; const s = screen(src, pool, self), h = s.hands.length ? s.hands.reduce((a, b) => a + b, 0) / s.hands.length : s.best; return (EASE[k] = Math.round((h + s.ge1) * 100) / 100); }
// the pair drawn again: 1 coin, then 2, then 3 within one round; nothing when it cannot be paid or has been done three times
const pairCost = run => ((run.redraws || 0) >= CHOOSE.most ? null : 1 + (run.redraws || 0));
function runRedraw(run, rnd) { const c = pairCost(run); if (!RULE.choose || !RULE.coins || c == null || (run.coins || 0) < c) return null; run.coins -= c; run.redraws = (run.redraws || 0) + 1; return runBriefs(run, rnd); }
// the proof plays are played under the brief of the round (an assay changes the rules of the round)
const specFor = (run, model, R, brief) => specPick(model, run.round || 1, (run.rack || []).concat(run.self || SELF0), R, run.tierNo || 3, run.specHist || [], Object.assign({}, run, { brief: brief || run.brief }));
function runChoose(run, o) { run.spec = o.spec || null; if (o.spec) { run.specHist = (run.specHist || []).concat([o.spec.families]); } run.redraws = 0; run.payCoins = o.coins || 0; run.kin = o.kin || 'chain'; run.src = o.src || null; run.brief = o.brief; run.feed = o.model; run.quota = o.quota; run.pays = o.pays; run.carryE = 1 + ((run.lastE || 1) - 1) / 2; }
// keeps the molecule and the extra a beaten round ended on, for carrying on
function runKeep(run, g) { run.last = RX.cloneMap(g.m).model; run.lastE = g.E / (g.gear.includes('pact') ? 3 : 1); }
// pays the credit the brief promised and returns how much
function runPay(run) { const n = run.pays || 0; run.pays = null; run.bonus = (run.bonus || 0) + n; return n; }
// opts.tierNo: 1, 2 or 3 (TIERS). Without it a run is nine rounds with everything the switches allow, as before.
function runNew(tier, extra, opts) { const t = Math.max(0, Math.min(SUPPLY.length - 1, tier | 0)), st = stock(t), tn = runTierNo(opts), T = tn ? TIERS[tn] : null; return runAssays({ tierNo: tn || 3, len: lengthOf(tn || 3).name, span: T ? T.rounds : 9, bare: !!(T && T.bare), six: !!(T && T.bare), noGear: !!(T && !T.helpers), noHom: !!(T && !T.creatures), extra: (extra || []).slice(), round: 1, tier: t, rack: RUNG.start.slice(), rare: st.rare, gear: [], self: SELF0.slice(), lv: {}, grade: {}, uses: {}, base: {}, beaten: 0, over: false, brief: 'plain', feed: FEEDS[0], pays: null, bonus: 0, coins: 0, rerolls: 0, by: { water: 0, h2: 0, gauge: 0 } }); }
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
// GENERATED by the measuring rig (docs/RIG.md, docs/tools_sim.js) on 2026-11-11 from the rules at commit 53cbfa3.
// Do not edit by hand: measure again. Par of the bare game, fourth measure (docs/tools_par_bare.py): round one by the novice and the margin together, rounds two to five at a margin of 4 for the median player, rounds six to nine by its pass rate and margin.
// PAR.rounds: the number for a plain round on a molecule of average size in rounds one to nine, each fitted to the
// pass rate and the margin in docs/BALANCE.md together (docs/tools_par.py). after: the step for every round past nine.
const PAR = { rounds: [4500, 5600, 10000, 4960, 18800, 55300, 58200, 61300, 105000], after: 1.71, last: 1 };
// MOLF: what the median simulated player makes on each molecule inside runs, over the average of all the molecules.
// KINDF: what each kind of round makes against a plain one. ASSAYF: the same for the kind of an assay, for each of
// the three acts, over the average of the four kinds. Fitted together by docs/tools_factors.py. The number to beat is
// multiplied by all of them, so every kind of round and every molecule is beaten by a like margin.
const MOLF = {"C=CCC(C)(O)CCC(=O)CCC=C":0.594,"C=CCCC(=O)CC1CCCC1=O":0.393,"C=CCCC(=O)CCC(=O)CC1CCCC1=O":0.924,"C=CCCC(=O)CCC(=O)CCC(O)CCCCCC(=O)CCC(=O)CCC(=O)C":2.09,"C=CCCC(=O)CCC(=O)CCCC=O":2.264,"C=CCCC(=O)CCC(=O)CCCCCC(O)CCC(=O)C":1.286,"C=CCCC(=O)CCC(O)CCC1(O)CCCC1CCC(=O)CCC(=O)C":1.744,"C=CCCC(=O)CCC1(O)CCCC1":0.365,"C=CCCC(=O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C":1.418,"C=CCCC(C)(O)CCC(=O)CCC=C":0.731,"C=CCCC(O)CCC(=O)C1CCCC1":0.307,"C=CCCC(O)CCC(=O)CCC1(O)CCCC1":0.819,"C=CCCC(O)CCC(=O)CCCCCCCC(=O)CCC(=O)C":1.46,"CC(=O)CCC(=O)CCC(=O)CCC(O)CCCCCCCC(=O)CCC(=O)CCC(=O)C":0.36,"CC(=O)CCC(=O)CCC(O)CC1CCC(CC1)CCC(=O)CCC(=O)C":0.715,"CC(=O)CCC(=O)CCC(O)CCCCCC(=O)CCC(=O)C":0.724,"CC(=O)CCC(=O)CCC1(O)CCCC1CCCCCC(=O)CCC(=O)C":0.998,"CC(=O)CCC(O)CC1CCC(CC1)CC(O)CCC(=O)C":0.984,"CC(C)(O)C=CC=CCCCC=CC(=O)CCC(=O)C":1.495,"CC(C)(O)C=CC=CCCCC=CC(=O)CCC(=O)CCC(=O)C":1.957,"CC(C)(O)CCC(=O)CCC(O)CCC(=O)CCC=C":0.787,"CC(C)(O)CCC(=O)CCC(O)CCC(=O)CCCCCC(=O)CCC(=O)CCC(=O)C":1.282,"CC(C)(O)CCC(=O)CCC=C":0.387,"CC(C)(O)CCC(=O)CCCCCC(=O)CCC(=O)C":0.491,"CC(C)(O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C":1.907,"CC(C)(O)CCC=CCCC=CCCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C":3.017,"CC(O)CCC(=O)CCC=CCCC(=O)C":0.205,"O=CCCC(=O)CCC(=O)CCC=C":2.268,"O=CCCC(=O)CCC(C)(O)CCC=C":1.087,"O=CCCC(=O)CCC(O)CCC(=O)CCCCCCCC(=O)CCC(=O)CCC=C":1.67,"O=CCCC(=O)CCC(O)CCCCCC(=O)CCC(=O)C":1.117,"O=CCCC(=O)CCC1(O)CCCC1":0.513,"O=CCCC(=O)CCC=C":1.499,"O=CCCC(C)(O)CCC(=O)CCC=C":1.65,"OC1(CCCC1)CCC(=O)CCC=C":0.375,"OC1(CCCC1)CCC(=O)CCCC=O":0.942,"OC1(CCCCC1)C=CC=CCCCC=CC(=O)CCC(=O)C":1.983,"OC1(CCCCC1)CCC(=O)CCC(O)CCC(=O)C":0.687,"OC1(CCCCC1)CCC(=O)CCC(O)CCC(=O)CCCCCC(=O)CCC(=O)CCC=C":1.958,"OC1(CCCCC1)CCC(=O)CCCCCC(=O)CCC(=O)C":0.968,"OC1(CCCCC1)CCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C":1.655,"OC1(CCCCC1)CCC=CCCC=CCCC=CCCC=CCCC=CCCC=CCCC(=O)C":2.961};
const KINDF = {"plain":1.0,"carry":1.0,"broad":1.0,"loose":1.0,"each":1.0,"back":1.0,"scarce":1.0,"short":1.0};
const ASSAYF = {"scarce":[0.688,1.138,0.854],"short":[0.625,0.309,0.527],"each":[1.533,1.745,1.339],"loose":[1.519,1.632,1.66]};
const MOLD = { lo: 0.1, hi: 10, pow: 1 };
// Tier one (rounds one to three) baked again on 2026-11-11 after commit 1e859ea (docs/tools_tier1_bake.py). Par for the six-reagent deal (greedy median over 3).
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
// The coin sink of a round (docs/LOOP.md, RIG.md): while a page is being lined up, coins buy one more use of a reaction
// of the hand, for this round only. The price rises with each one bought in the round (SINK.price) and starts again
// next round; past the end of the table no more can be bought that round. Nothing is ever locked without coins.
const SINK = { price: [1, 2, 3] };
RULE.sink = false;
const useCost = g => (RULE.sink && RULE.coins && RULE.uses && g && g.syn ? SINK.price[g.bought || 0] : undefined);
const canBuyUse = (g, run, id) => { const c = useCost(g); return c != null && !!run && !g.over && !g.shot && !g.chain && g.kinds.includes(id) && !(g.free && g.free[id]) && (run.coins || 0) >= c; };
function buyUse(g, run, id) { if (!canBuyUse(g, run, id)) return false; run.coins -= useCost(g); g.left[id] = (g.left[id] || 0) + 1; g.bought = (g.bought || 0) + 1; g.tally.bought = (g.tally.bought || 0) + 1; return true; }
function runBin(run, id) { if (!RULE.coins || (run.coins || 0) < COIN.bin || !run.gear.includes(id)) return false; run.coins -= COIN.bin; run.gear = run.gear.filter(q => q !== id); delete run.lv[id]; return true; }
function runPicks(run, rnd) {
  modeSync(run);
  const R = rnd || rand, any = a => a[Math.floor(R() * a.length)], st = stock(run.tier), out = [];
  const newR = run.six ? [] : st.reagents.concat(run.extra || []).filter(id => !run.rack.includes(id) && !Object.keys(PAIR).some(k => PAIR[k] === id)), newG = run.gear.length < RUNG.slots && !run.noGear && !bareRun(run) ? st.gear.filter(id => !run.gear.includes(id)) : [];
  const newS = run.six ? [] : RULE.cascade ? SELF.filter(q => q.tier <= run.tier && !(run.self || []).includes(q.id) && !(RULE.ban || []).includes(q.id)).map(q => q.id) : [];
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
// =====================================================================================================================
// THE SPEC (docs/tools_chem/HURDLES.md, docs/SPEC_NOTES.md). A round is won by meeting its spec: an "at least N" about the
// molecule or about what happened in the round. Yield is separate (it pays gold at the four marks and letters the four words).
//   readers   : the structural readers on a plain graph of the game's molecule (port of docs/tools_chem/hurdle_graph.py)
//   record    : g.rec, what the round did, page by page (reagents fired and whether each acted, reflex steps, runoff by kind,
//               the molecule at the end of each page before the loose rings open again)
//   readings  : gain, loss, abs, last, range (HURDLES.md, "How a hurdle is read")
//   table     : SPEC_TABLE, one table of the specs, their readers, marks and the share of aiming players at each N, by round.
//               Written by docs/tools_spec_bake.py; replace it wholesale. Everything else reads it.
//   state     : g.spec = { kind, n, mark, name, text, value, met, parts } updated after every page; P.specValue, P.specMet
//   generator : P.specPick(molecule, round, carried, rnd, tier, hist, run) -> { kind, n, mark, ... } (table mode, reach checked by
//               aiming plays: a bounded search, see specReach)
// =====================================================================================================================
// SPEC TABLE BEGIN (written by docs/tools_spec_bake.py from the table of specs; replace it wholesale)
const SPEC_TABLE = {"rings":{"fam":"shape","text":"at least {N} more rings than the molecule starts with","read":"s","key":"rings","mode":"gain","by":0,"mark":"ring","need":null,"good":[5,6],"sf":{"1":[1.0,0.887,0.675,0.19,0.035,0.013,0.005,0.0],"2":[1.0,0.87,0.68,0.207,0.03,0.003,0.0],"3":[1.0,0.925,0.723,0.24,0.035,0.015,0.005,0.0],"4":[1.0,0.973,0.865,0.578,0.4,0.282,0.18,0.107,0.072,0.058,0.03,0.018,0.013,0.007,0.007,0.005,0.003,0.003,0.0],"5":[1.0,0.988,0.945,0.782,0.59,0.412,0.315,0.212,0.16,0.11,0.087,0.052,0.028,0.02,0.02,0.013,0.01,0.007,0.007,0.005,0.003,0.003,0.003,0.003,0.003,0.0],"6":[1.0,0.98,0.948,0.86,0.7,0.54,0.435,0.325,0.245,0.175,0.125,0.065,0.043,0.022,0.013,0.007,0.005,0.003,0.003,0.003,0.003,0.0],"7":[1.0,0.885,0.76,0.6,0.448,0.29,0.165,0.09,0.062,0.033,0.028,0.022,0.013,0.01,0.005,0.003,0.003,0.003,0.003,0.0],"8":[1.0,0.882,0.772,0.63,0.51,0.347,0.24,0.138,0.09,0.062,0.04,0.022,0.02,0.015,0.01,0.007,0.007,0.007,0.005,0.003,0.003,0.003,0.003,0.0],"9":[1.0,0.873,0.73,0.635,0.545,0.417,0.285,0.2,0.125,0.083,0.062,0.043,0.028,0.022,0.015,0.01,0.007,0.003,0.0]}},"five_rings":{"fam":"shape","text":"at least {N} more rings of five atoms","read":"s","key":"ring5","mode":"gain","by":0,"mark":"ring5","need":null,"good":[1,2,3,4,5,6],"sf":{"1":[1.0,0.858,0.59,0.182,0.055,0.028,0.005,0.0],"2":[1.0,0.853,0.605,0.23,0.068,0.018,0.005,0.003,0.0],"3":[1.0,0.9,0.647,0.263,0.08,0.015,0.005,0.0],"4":[1.0,0.93,0.667,0.4,0.212,0.095,0.04,0.022,0.01,0.005,0.003,0.003,0.0],"5":[1.0,0.95,0.792,0.585,0.318,0.188,0.1,0.065,0.035,0.022,0.02,0.013,0.013,0.007,0.005,0.003,0.003,0.0],"6":[1.0,0.96,0.833,0.637,0.427,0.225,0.14,0.077,0.037,0.025,0.01,0.007,0.005,0.003,0.003,0.0],"7":[1.0,0.805,0.598,0.393,0.23,0.122,0.07,0.03,0.015,0.003,0.0],"8":[1.0,0.802,0.6,0.4,0.273,0.165,0.09,0.048,0.022,0.01,0.003,0.003,0.003,0.0],"9":[1.0,0.8,0.557,0.385,0.278,0.168,0.087,0.05,0.033,0.018,0.013,0.003,0.0]}},"six_rings":{"fam":"shape","text":"at least {N} more rings of six atoms","read":"s","key":"ring6","mode":"gain","by":0,"mark":"ring6","need":null,"good":[4,5,6,7,8],"sf":{"1":[1.0,0.812,0.27,0.01,0.0],"2":[1.0,0.8,0.325,0.01,0.0],"3":[1.0,0.848,0.37,0.003,0.0],"4":[1.0,0.912,0.583,0.305,0.188,0.095,0.048,0.025,0.007,0.005,0.003,0.003,0.0],"5":[1.0,0.927,0.693,0.4,0.242,0.133,0.068,0.037,0.018,0.01,0.007,0.003,0.003,0.003,0.003,0.0],"6":[1.0,0.938,0.812,0.545,0.355,0.195,0.125,0.075,0.037,0.018,0.003,0.003,0.003,0.003,0.003,0.0],"7":[1.0,0.767,0.47,0.263,0.142,0.07,0.028,0.01,0.005,0.005,0.003,0.0],"8":[1.0,0.792,0.545,0.292,0.158,0.09,0.04,0.018,0.005,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"9":[1.0,0.81,0.595,0.383,0.25,0.147,0.085,0.048,0.013,0.01,0.005,0.005,0.0]}},"fused_pairs":{"fam":"shape","text":"at least {N} more pairs of rings that share a side","read":"s","key":"fused_pairs","mode":"gain","by":0,"mark":"joined","need":null,"good":[4,5,6],"sf":{"1":[1.0,0.273,0.018,0.0],"2":[1.0,0.253,0.015,0.0],"3":[1.0,0.237,0.015,0.0],"4":[1.0,0.78,0.495,0.403,0.325,0.282,0.228,0.185,0.17,0.15,0.128,0.102,0.095,0.085,0.083,0.08,0.075,0.072,0.062,0.06,0.05,0.043,0.04,0.035,0.03,0.028,0.028,0.028,0.028,0.028,0.018,0.015,0.015,0.015,0.015,0.015,0.013,0.01,0.01,0.01,0.01,0.01,0.01,0.007,0.005,0.005,0.005,0.005,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"5":[1.0,0.835,0.618,0.487,0.427,0.375,0.325,0.29,0.258,0.228,0.198,0.19,0.168,0.163,0.147,0.14,0.122,0.102,0.1,0.098,0.09,0.085,0.075,0.06,0.058,0.055,0.055,0.05,0.048,0.043,0.04,0.037,0.037,0.03,0.03,0.028,0.028,0.022,0.022,0.018,0.018,0.018,0.015,0.015,0.015,0.013,0.013,0.01,0.007,0.007,0.007,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"6":[1.0,0.89,0.728,0.605,0.535,0.492,0.427,0.403,0.362,0.33,0.3,0.26,0.24,0.223,0.2,0.18,0.17,0.155,0.145,0.138,0.13,0.113,0.107,0.085,0.08,0.072,0.062,0.058,0.055,0.048,0.037,0.033,0.03,0.03,0.03,0.022,0.022,0.02,0.018,0.013,0.013,0.007,0.007,0.007,0.005,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"7":[1.0,0.588,0.375,0.285,0.2,0.17,0.12,0.113,0.098,0.085,0.075,0.062,0.058,0.055,0.052,0.045,0.037,0.033,0.033,0.03,0.03,0.03,0.025,0.022,0.022,0.022,0.022,0.02,0.015,0.015,0.015,0.015,0.015,0.013,0.01,0.005,0.003,0.0],"8":[1.0,0.568,0.39,0.307,0.237,0.19,0.142,0.128,0.12,0.11,0.09,0.075,0.072,0.06,0.052,0.052,0.05,0.043,0.035,0.033,0.025,0.022,0.022,0.02,0.02,0.02,0.018,0.018,0.018,0.013,0.013,0.013,0.013,0.01,0.01,0.01,0.01,0.01,0.01,0.007,0.007,0.007,0.007,0.007,0.007,0.007,0.007,0.005,0.005,0.005,0.005,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"9":[1.0,0.547,0.372,0.265,0.198,0.165,0.145,0.133,0.105,0.102,0.092,0.085,0.072,0.068,0.06,0.058,0.052,0.048,0.045,0.033,0.033,0.033,0.03,0.028,0.025,0.02,0.02,0.02,0.013,0.013,0.01,0.01,0.01,0.01,0.007,0.007,0.007,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.003,0.003,0.003,0.003,0.0]}},"fused_block":{"fam":"shape","text":"a joined block of rings {N} bigger than the biggest at the start","read":"s","key":"fused_block","mode":"gain","by":0,"mark":"joined","need":null,"good":[4,5,6],"sf":{"1":[1.0,0.708,0.048,0.0],"2":[1.0,0.708,0.05,0.0],"3":[1.0,0.695,0.045,0.0],"4":[1.0,0.81,0.603,0.412,0.302,0.223,0.152,0.077,0.058,0.048,0.037,0.025,0.013,0.007,0.007,0.005,0.003,0.0],"5":[1.0,0.882,0.677,0.53,0.415,0.333,0.247,0.168,0.113,0.083,0.06,0.03,0.025,0.02,0.01,0.007,0.005,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"6":[1.0,0.89,0.775,0.613,0.497,0.427,0.343,0.258,0.2,0.138,0.107,0.05,0.04,0.02,0.01,0.007,0.005,0.005,0.005,0.003,0.003,0.0],"7":[1.0,0.688,0.405,0.28,0.203,0.135,0.087,0.068,0.037,0.028,0.028,0.022,0.013,0.01,0.005,0.003,0.003,0.0],"8":[1.0,0.733,0.43,0.287,0.188,0.13,0.098,0.068,0.055,0.03,0.02,0.015,0.01,0.007,0.005,0.005,0.005,0.005,0.005,0.003,0.003,0.003,0.0],"9":[1.0,0.703,0.38,0.26,0.182,0.135,0.107,0.072,0.048,0.04,0.035,0.02,0.018,0.01,0.005,0.005,0.003,0.0]}},"ring_systems":{"fam":"shape","text":"at least {N} more separate groups of rings","read":"s","key":"ring_systems","mode":"gain","by":0,"mark":"islands","need":null,"good":[3,6,7,8,9],"sf":{"1":[1.0,0.87,0.367,0.09,0.013,0.007,0.0],"2":[1.0,0.855,0.372,0.11,0.028,0.007,0.0],"3":[1.0,0.917,0.44,0.11,0.018,0.003,0.0],"4":[1.0,0.968,0.38,0.083,0.013,0.0],"5":[1.0,0.978,0.595,0.175,0.037,0.005,0.0],"6":[1.0,0.98,0.723,0.255,0.065,0.013,0.0],"7":[1.0,0.873,0.613,0.172,0.007,0.0],"8":[1.0,0.882,0.632,0.25,0.04,0.007,0.0],"9":[1.0,0.863,0.625,0.35,0.09,0.007,0.003,0.0]}},"spiro":{"fam":"shape","text":"at least {N} more atoms where two rings meet at a single point","read":"s","key":"spiro","mode":"gain","by":0,"mark":"spiro","need":null,"good":[1,3,4,5,6],"sf":{"1":[1.0,0.615,0.242,0.0],"2":[1.0,0.555,0.253,0.0],"3":[1.0,0.623,0.273,0.005,0.0],"4":[1.0,0.72,0.39,0.18,0.058,0.022,0.007,0.005,0.003,0.003,0.003,0.0],"5":[1.0,0.81,0.542,0.307,0.13,0.062,0.025,0.02,0.007,0.005,0.0],"6":[1.0,0.807,0.557,0.36,0.177,0.1,0.06,0.025,0.003,0.0],"7":[1.0,0.568,0.333,0.172,0.07,0.04,0.018,0.005,0.005,0.003,0.003,0.0],"8":[1.0,0.583,0.403,0.217,0.128,0.077,0.028,0.01,0.005,0.003,0.0],"9":[1.0,0.59,0.435,0.292,0.188,0.138,0.08,0.05,0.015,0.0]}},"bridgehead":{"fam":"shape","text":"at least {N} more bridgehead atoms (a cage)","read":"s","key":"bridgehead","mode":"gain","by":0,"mark":"cage","need":null,"good":[6],"sf":{"1":[1.0,0.0],"2":[1.0,0.0],"3":[1.0,0.0],"4":[1.0,0.362,0.362,0.255,0.23,0.182,0.13,0.09,0.043,0.025,0.018,0.007,0.007,0.005,0.003,0.003,0.0],"5":[1.0,0.512,0.512,0.355,0.33,0.255,0.198,0.128,0.105,0.062,0.048,0.025,0.022,0.013,0.007,0.007,0.003,0.003,0.003,0.003,0.003,0.0],"6":[1.0,0.608,0.608,0.438,0.412,0.318,0.27,0.205,0.117,0.08,0.062,0.025,0.02,0.015,0.01,0.003,0.003,0.0],"7":[1.0,0.278,0.278,0.135,0.13,0.09,0.07,0.048,0.04,0.033,0.022,0.013,0.005,0.005,0.003,0.003,0.003,0.0],"8":[1.0,0.29,0.29,0.182,0.168,0.105,0.083,0.06,0.037,0.028,0.013,0.007,0.005,0.003,0.003,0.003,0.003,0.003,0.0],"9":[1.0,0.31,0.31,0.16,0.158,0.11,0.09,0.065,0.048,0.03,0.028,0.018,0.007,0.005,0.003,0.0]}},"ring_hetero":{"fam":"shape","text":"at least {N} more rings with an oxygen, nitrogen or sulfur in them","read":"s","key":"ring_hetero","mode":"gain","by":0,"mark":"ring_o","need":null,"good":[4,5,6,7,8,9],"sf":{"1":[1.0,0.887,0.675,0.19,0.035,0.013,0.005,0.0],"2":[1.0,0.87,0.68,0.207,0.03,0.003,0.0],"3":[1.0,0.925,0.723,0.24,0.035,0.015,0.005,0.0],"4":[1.0,0.88,0.542,0.217,0.048,0.01,0.007,0.005,0.0],"5":[1.0,0.922,0.693,0.375,0.11,0.03,0.01,0.003,0.0],"6":[1.0,0.917,0.703,0.407,0.135,0.043,0.033,0.007,0.0],"7":[1.0,0.785,0.562,0.292,0.135,0.05,0.028,0.005,0.0],"8":[1.0,0.835,0.62,0.375,0.233,0.08,0.04,0.0],"9":[1.0,0.805,0.565,0.41,0.263,0.155,0.107,0.052,0.025,0.0]}},"ring_atoms":{"fam":"shape","text":"at least {N} more atoms inside rings","read":"s","key":"ring_atoms","mode":"gain","by":0,"mark":"ring_fill","need":null,"good":[1,2,3,4,5,6],"sf":{"1":[1.0,0.887,0.887,0.887,0.885,0.873,0.833,0.67,0.667,0.603,0.485,0.315,0.242,0.24,0.223,0.18,0.1,0.065,0.062,0.04,0.037,0.022,0.022,0.018,0.015,0.013,0.013,0.013,0.0],"2":[1.0,0.87,0.87,0.87,0.868,0.86,0.838,0.672,0.672,0.64,0.472,0.335,0.25,0.233,0.212,0.16,0.085,0.06,0.05,0.028,0.025,0.015,0.015,0.013,0.013,0.007,0.005,0.005,0.003,0.0],"3":[1.0,0.925,0.925,0.925,0.922,0.917,0.897,0.715,0.715,0.69,0.535,0.383,0.28,0.25,0.245,0.17,0.075,0.052,0.052,0.03,0.028,0.018,0.018,0.018,0.015,0.007,0.007,0.007,0.003,0.0],"4":[1.0,0.973,0.973,0.973,0.968,0.968,0.945,0.868,0.868,0.845,0.733,0.63,0.562,0.492,0.412,0.362,0.302,0.228,0.177,0.147,0.13,0.105,0.09,0.062,0.048,0.04,0.037,0.033,0.025,0.022,0.02,0.018,0.01,0.005,0.005,0.005,0.005,0.003,0.0],"5":[1.0,0.988,0.988,0.988,0.988,0.988,0.98,0.95,0.95,0.94,0.89,0.823,0.782,0.725,0.675,0.588,0.51,0.443,0.388,0.328,0.253,0.205,0.177,0.14,0.11,0.09,0.075,0.06,0.043,0.037,0.03,0.028,0.02,0.018,0.015,0.015,0.013,0.01,0.005,0.005,0.005,0.003,0.003,0.0],"6":[1.0,0.98,0.98,0.98,0.98,0.98,0.968,0.948,0.948,0.945,0.92,0.89,0.858,0.802,0.762,0.723,0.645,0.585,0.552,0.487,0.435,0.355,0.302,0.275,0.22,0.175,0.16,0.138,0.113,0.095,0.08,0.065,0.05,0.037,0.025,0.018,0.015,0.01,0.005,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"7":[1.0,0.885,0.885,0.885,0.885,0.877,0.83,0.76,0.76,0.752,0.743,0.677,0.6,0.57,0.52,0.45,0.417,0.38,0.33,0.292,0.26,0.2,0.16,0.133,0.095,0.075,0.058,0.05,0.043,0.035,0.033,0.02,0.013,0.01,0.007,0.007,0.007,0.005,0.005,0.005,0.003,0.0],"8":[1.0,0.882,0.882,0.882,0.882,0.877,0.838,0.775,0.775,0.767,0.745,0.705,0.66,0.625,0.603,0.578,0.52,0.487,0.46,0.427,0.362,0.3,0.275,0.242,0.215,0.17,0.117,0.098,0.083,0.07,0.04,0.022,0.018,0.013,0.01,0.01,0.005,0.0],"9":[1.0,0.873,0.873,0.873,0.873,0.865,0.805,0.733,0.733,0.73,0.723,0.705,0.662,0.63,0.627,0.618,0.57,0.542,0.495,0.448,0.42,0.39,0.365,0.323,0.305,0.273,0.242,0.217,0.198,0.165,0.145,0.117,0.102,0.095,0.077,0.06,0.048,0.043,0.035,0.035,0.033,0.005,0.005,0.003,0.0]}},"ring_sizes":{"fam":"shape","text":"at least {N} more different ring sizes","read":"s","key":"ring_sizes","mode":"gain","by":0,"mark":"ring_sizes","need":null,"good":[4],"sf":{"1":[1.0,0.855,0.328,0.0],"2":[1.0,0.843,0.3,0.0],"3":[1.0,0.887,0.33,0.0],"4":[1.0,0.94,0.472,0.037,0.003,0.0],"5":[1.0,0.955,0.527,0.048,0.003,0.003,0.0],"6":[1.0,0.97,0.545,0.052,0.0],"7":[1.0,0.835,0.345,0.015,0.003,0.0],"8":[1.0,0.855,0.405,0.025,0.003,0.0],"9":[1.0,0.85,0.367,0.05,0.003,0.0]}},"longest_chain":{"fam":"size","text":"a chain of carbons {N} longer than the longest at the start","read":"s","key":"chain","mode":"gain","by":0,"mark":"chain","need":null,"good":[1,2,3,4],"sf":{"1":[1.0,0.963,0.95,0.935,0.873,0.807,0.7,0.605,0.472,0.398,0.275,0.205,0.107,0.068,0.035,0.007,0.0],"2":[1.0,0.963,0.948,0.93,0.9,0.845,0.767,0.662,0.53,0.432,0.335,0.237,0.14,0.052,0.03,0.01,0.003,0.0],"3":[1.0,0.97,0.955,0.922,0.885,0.815,0.752,0.685,0.568,0.448,0.33,0.233,0.135,0.07,0.05,0.007,0.0],"4":[1.0,0.603,0.487,0.312,0.138,0.072,0.04,0.028,0.015,0.01,0.003,0.003,0.0],"5":[1.0,0.525,0.46,0.282,0.165,0.095,0.048,0.03,0.025,0.013,0.003,0.0],"6":[1.0,0.47,0.443,0.263,0.135,0.102,0.055,0.033,0.03,0.025,0.015,0.005,0.003,0.0],"7":[1.0,0.273,0.228,0.1,0.04,0.02,0.015,0.013,0.0],"8":[1.0,0.282,0.21,0.105,0.055,0.028,0.013,0.01,0.005,0.005,0.005,0.005,0.0],"9":[1.0,0.263,0.228,0.107,0.065,0.01,0.01,0.005,0.0]}},"diameter":{"fam":"size","text":"the molecule {N} bonds longer end to end","read":"s","key":"diameter","mode":"gain","by":0,"mark":"span","need":null,"good":[1,2,3,4,5,6],"sf":{"1":[1.0,0.973,0.953,0.93,0.873,0.815,0.738,0.62,0.485,0.388,0.323,0.185,0.152,0.052,0.048,0.005,0.005,0.0],"2":[1.0,0.968,0.958,0.943,0.895,0.835,0.74,0.65,0.53,0.405,0.318,0.198,0.135,0.05,0.035,0.003,0.003,0.0],"3":[1.0,0.973,0.953,0.927,0.88,0.82,0.72,0.642,0.522,0.393,0.28,0.15,0.11,0.035,0.03,0.005,0.005,0.0],"4":[1.0,0.84,0.685,0.575,0.403,0.268,0.193,0.133,0.087,0.043,0.018,0.01,0.005,0.0],"5":[1.0,0.787,0.65,0.557,0.35,0.253,0.177,0.12,0.087,0.04,0.025,0.003,0.003,0.003,0.003,0.0],"6":[1.0,0.71,0.608,0.497,0.355,0.268,0.203,0.115,0.065,0.043,0.022,0.007,0.003,0.0],"7":[1.0,0.41,0.285,0.172,0.113,0.072,0.062,0.02,0.013,0.003,0.0],"8":[1.0,0.445,0.233,0.172,0.06,0.025,0.013,0.01,0.005,0.0],"9":[1.0,0.45,0.228,0.165,0.07,0.033,0.015,0.01,0.005,0.005,0.0]}},"branch":{"fam":"size","text":"at least {N} more branch points","read":"s","key":"branch","mode":"gain","by":0,"mark":"fork","need":null,"good":[1,2,3,4,5,6,7,8,9],"sf":{"1":[1.0,0.993,0.968,0.92,0.873,0.81,0.73,0.613,0.535,0.422,0.365,0.253,0.2,0.14,0.117,0.09,0.087,0.062,0.037,0.022,0.02,0.005,0.003,0.0],"2":[1.0,0.993,0.978,0.932,0.887,0.812,0.745,0.635,0.575,0.475,0.41,0.302,0.223,0.155,0.133,0.092,0.07,0.065,0.035,0.03,0.022,0.005,0.0],"3":[1.0,1.0,0.98,0.935,0.882,0.843,0.787,0.672,0.595,0.482,0.42,0.34,0.275,0.185,0.158,0.107,0.092,0.08,0.035,0.02,0.013,0.0],"4":[1.0,1.0,0.968,0.917,0.815,0.693,0.578,0.443,0.355,0.258,0.2,0.15,0.115,0.095,0.065,0.048,0.037,0.035,0.02,0.013,0.01,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"5":[1.0,0.993,0.973,0.935,0.853,0.772,0.693,0.542,0.45,0.37,0.292,0.237,0.198,0.158,0.133,0.1,0.07,0.048,0.035,0.03,0.022,0.013,0.007,0.007,0.007,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"6":[1.0,0.995,0.983,0.96,0.92,0.863,0.782,0.66,0.555,0.47,0.398,0.292,0.237,0.172,0.128,0.098,0.058,0.04,0.033,0.018,0.013,0.007,0.007,0.007,0.007,0.005,0.005,0.005,0.0],"7":[1.0,0.885,0.802,0.672,0.56,0.44,0.347,0.282,0.233,0.172,0.14,0.102,0.087,0.05,0.04,0.028,0.02,0.013,0.01,0.005,0.0],"8":[1.0,0.875,0.787,0.693,0.605,0.53,0.43,0.33,0.287,0.24,0.193,0.155,0.12,0.1,0.068,0.043,0.03,0.022,0.015,0.01,0.01,0.007,0.007,0.003,0.003,0.003,0.0],"9":[1.0,0.865,0.77,0.713,0.61,0.515,0.43,0.355,0.278,0.247,0.215,0.172,0.142,0.11,0.077,0.06,0.037,0.018,0.013,0.007,0.005,0.005,0.003,0.003,0.0]}},"growth":{"fam":"size","text":"at least {N} atoms bigger than the start","read":"s","key":"atoms","mode":"gain","by":0,"mark":"big","need":null,"good":[1,2,3,4,5,6,7,8,9],"sf":{"1":[1.0,0.97,0.968,0.965,0.965,0.948,0.922,0.915,0.9,0.882,0.865,0.86,0.825,0.772,0.74,0.72,0.7,0.66,0.635,0.613,0.58,0.555,0.535,0.515,0.502,0.482,0.398,0.383,0.362,0.333,0.318,0.315,0.25,0.228,0.223,0.217,0.193,0.17,0.165,0.14,0.087,0.045,0.043,0.022,0.013,0.01,0.007,0.0],"2":[1.0,0.97,0.97,0.968,0.965,0.95,0.94,0.938,0.92,0.892,0.875,0.868,0.843,0.795,0.767,0.748,0.733,0.7,0.677,0.647,0.603,0.568,0.517,0.497,0.485,0.468,0.388,0.367,0.352,0.325,0.312,0.307,0.27,0.263,0.253,0.247,0.212,0.18,0.168,0.155,0.092,0.05,0.045,0.018,0.003,0.003,0.003,0.0],"3":[1.0,0.978,0.97,0.97,0.965,0.955,0.943,0.94,0.93,0.905,0.882,0.877,0.858,0.84,0.812,0.79,0.78,0.757,0.743,0.703,0.675,0.642,0.6,0.588,0.575,0.542,0.463,0.445,0.412,0.37,0.362,0.355,0.282,0.273,0.258,0.247,0.182,0.155,0.13,0.115,0.075,0.03,0.025,0.007,0.005,0.0],"4":[1.0,0.983,0.95,0.927,0.907,0.88,0.823,0.775,0.748,0.675,0.618,0.585,0.555,0.515,0.438,0.385,0.347,0.31,0.297,0.29,0.26,0.247,0.233,0.207,0.182,0.147,0.138,0.113,0.1,0.09,0.075,0.068,0.062,0.052,0.045,0.033,0.028,0.015,0.01,0.007,0.007,0.005,0.003,0.0],"5":[1.0,0.98,0.948,0.93,0.917,0.897,0.88,0.853,0.825,0.79,0.735,0.685,0.667,0.59,0.53,0.495,0.458,0.435,0.41,0.388,0.338,0.297,0.27,0.26,0.247,0.22,0.21,0.188,0.177,0.145,0.125,0.105,0.085,0.06,0.052,0.028,0.02,0.005,0.0],"6":[1.0,0.985,0.958,0.953,0.938,0.92,0.897,0.88,0.855,0.805,0.777,0.757,0.733,0.66,0.615,0.57,0.537,0.485,0.463,0.44,0.417,0.37,0.338,0.305,0.282,0.247,0.21,0.198,0.188,0.158,0.138,0.12,0.098,0.058,0.03,0.01,0.003,0.0],"7":[1.0,0.85,0.762,0.685,0.598,0.557,0.505,0.448,0.417,0.375,0.33,0.31,0.282,0.25,0.21,0.2,0.19,0.168,0.15,0.14,0.133,0.113,0.1,0.083,0.06,0.058,0.048,0.037,0.022,0.013,0.003,0.003,0.0],"8":[1.0,0.848,0.757,0.682,0.642,0.585,0.537,0.468,0.435,0.41,0.39,0.36,0.335,0.312,0.285,0.268,0.24,0.228,0.2,0.177,0.168,0.133,0.102,0.08,0.055,0.03,0.01,0.007,0.005,0.0],"9":[1.0,0.82,0.735,0.698,0.667,0.635,0.57,0.517,0.463,0.425,0.395,0.36,0.338,0.312,0.29,0.273,0.233,0.195,0.168,0.135,0.107,0.052,0.035,0.018,0.007,0.0]}},"cut_down":{"fam":"size","text":"at least {N} atoms smaller than the start","read":"s","key":"atoms","mode":"loss","by":0,"mark":"cut","need":null,"good":[4,5,6,7,8,9],"sf":{"1":[1.0,0.708,0.453,0.255,0.1,0.04,0.003,0.0],"2":[1.0,0.735,0.465,0.268,0.115,0.035,0.003,0.0],"3":[1.0,0.703,0.463,0.26,0.095,0.03,0.007,0.0],"4":[1.0,0.797,0.49,0.25,0.117,0.065,0.048,0.037,0.022,0.015,0.013,0.013,0.01,0.003,0.0],"5":[1.0,0.807,0.645,0.362,0.172,0.1,0.077,0.068,0.048,0.037,0.035,0.028,0.018,0.01,0.01,0.007,0.0],"6":[1.0,0.877,0.718,0.36,0.215,0.128,0.077,0.068,0.05,0.048,0.045,0.043,0.037,0.03,0.03,0.022,0.018,0.018,0.013,0.007,0.003,0.0],"7":[1.0,0.755,0.632,0.445,0.275,0.235,0.19,0.172,0.158,0.158,0.155,0.145,0.138,0.13,0.115,0.095,0.087,0.075,0.068,0.043,0.035,0.03,0.02,0.015,0.005,0.003,0.0],"8":[1.0,0.755,0.63,0.502,0.372,0.307,0.29,0.242,0.217,0.2,0.2,0.198,0.188,0.18,0.165,0.14,0.133,0.117,0.11,0.098,0.092,0.085,0.077,0.068,0.05,0.045,0.013,0.007,0.003,0.003,0.0],"9":[1.0,0.745,0.625,0.51,0.398,0.33,0.312,0.263,0.235,0.207,0.207,0.205,0.198,0.193,0.185,0.17,0.15,0.145,0.13,0.128,0.128,0.12,0.102,0.09,0.068,0.058,0.052,0.048,0.04,0.035,0.028,0.015,0.003,0.003,0.0]}},"size_range":{"fam":"size","text":"swing the size by at least {N} atoms between the smallest and the biggest","read":"s","key":"atoms","mode":"range","by":0,"mark":"size","need":null,"good":[1,2,3,4,5,6,7,8,9],"sf":{"1":[1.0,1.0,0.983,0.975,0.975,0.958,0.927,0.92,0.907,0.88,0.87,0.863,0.835,0.775,0.743,0.728,0.703,0.67,0.652,0.627,0.593,0.555,0.532,0.515,0.502,0.475,0.388,0.38,0.36,0.325,0.312,0.31,0.245,0.223,0.217,0.215,0.193,0.17,0.165,0.14,0.087,0.043,0.04,0.022,0.013,0.01,0.007,0.0],"2":[1.0,0.998,0.983,0.98,0.98,0.968,0.94,0.932,0.92,0.9,0.873,0.86,0.84,0.785,0.762,0.743,0.718,0.682,0.665,0.645,0.598,0.552,0.51,0.495,0.482,0.463,0.385,0.375,0.36,0.33,0.32,0.315,0.278,0.268,0.255,0.25,0.215,0.175,0.165,0.152,0.092,0.052,0.048,0.02,0.003,0.003,0.003,0.0],"3":[1.0,1.0,0.983,0.973,0.97,0.96,0.943,0.938,0.93,0.905,0.88,0.868,0.848,0.835,0.825,0.805,0.782,0.757,0.743,0.7,0.667,0.63,0.585,0.578,0.57,0.527,0.443,0.432,0.398,0.352,0.347,0.34,0.268,0.255,0.245,0.237,0.172,0.145,0.125,0.11,0.072,0.033,0.028,0.01,0.005,0.0],"4":[1.0,1.0,0.99,0.955,0.93,0.885,0.82,0.757,0.73,0.67,0.615,0.56,0.537,0.485,0.425,0.365,0.325,0.295,0.28,0.268,0.24,0.225,0.215,0.193,0.17,0.135,0.125,0.1,0.09,0.08,0.062,0.055,0.05,0.045,0.04,0.03,0.025,0.013,0.01,0.007,0.007,0.005,0.003,0.0],"5":[1.0,0.998,0.99,0.973,0.938,0.897,0.863,0.835,0.805,0.77,0.733,0.677,0.645,0.59,0.537,0.49,0.453,0.422,0.4,0.375,0.323,0.287,0.263,0.255,0.237,0.207,0.193,0.168,0.165,0.13,0.113,0.095,0.083,0.055,0.048,0.033,0.025,0.007,0.005,0.003,0.003,0.003,0.0],"6":[1.0,1.0,0.993,0.975,0.958,0.945,0.9,0.882,0.863,0.83,0.805,0.765,0.725,0.657,0.623,0.557,0.52,0.465,0.44,0.415,0.388,0.345,0.31,0.278,0.255,0.22,0.193,0.182,0.175,0.145,0.133,0.115,0.085,0.048,0.03,0.007,0.0],"7":[1.0,0.953,0.932,0.86,0.772,0.708,0.65,0.588,0.542,0.51,0.47,0.427,0.4,0.365,0.318,0.292,0.28,0.245,0.223,0.182,0.17,0.145,0.125,0.107,0.075,0.065,0.052,0.043,0.028,0.018,0.007,0.007,0.005,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"8":[1.0,0.97,0.922,0.858,0.818,0.77,0.718,0.65,0.598,0.568,0.537,0.505,0.485,0.45,0.415,0.383,0.345,0.318,0.29,0.263,0.255,0.217,0.18,0.15,0.11,0.085,0.04,0.025,0.022,0.015,0.013,0.007,0.005,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"9":[1.0,0.953,0.912,0.89,0.845,0.8,0.752,0.682,0.618,0.57,0.537,0.5,0.468,0.44,0.417,0.393,0.338,0.295,0.26,0.233,0.205,0.152,0.12,0.098,0.072,0.055,0.048,0.043,0.035,0.033,0.025,0.018,0.007,0.007,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.003,0.0]}},"kinds_at_once":{"fam":"makeup","text":"at least {N} different kinds of group on the molecule at once","read":"s","key":"kinds","mode":"abs","by":0,"mark":"kinds","need":null,"good":[1,2,3,4,5,6,7,8,9],"sf":{"1":[1.0,1.0,0.988,0.88,0.522,0.0],"2":[1.0,1.0,0.983,0.858,0.475,0.0],"3":[1.0,1.0,0.985,0.917,0.547,0.0],"4":[1.0,1.0,0.993,0.912,0.507,0.048,0.0],"5":[1.0,1.0,0.998,0.932,0.695,0.072,0.003,0.0],"6":[1.0,1.0,1.0,0.953,0.757,0.135,0.005,0.0],"7":[1.0,1.0,0.988,0.85,0.6,0.223,0.02,0.0],"8":[1.0,1.0,0.988,0.835,0.588,0.278,0.043,0.007,0.0],"9":[1.0,1.0,0.99,0.828,0.585,0.253,0.025,0.0]}},"left_CO":{"fam":"makeup","text":"at least {N} C=O groups still standing at the end","read":"g","key":"C=O","mode":"last","by":0,"mark":"keep_C=O","need":null,"good":[1,2,3,4,5,6,7,8,9],"sf":{"1":[1.0,0.99,0.95,0.863,0.713,0.57,0.46,0.338,0.273,0.247,0.122,0.072,0.068,0.0],"2":[1.0,0.99,0.938,0.855,0.708,0.555,0.435,0.297,0.24,0.217,0.105,0.045,0.043,0.0],"3":[1.0,0.99,0.95,0.9,0.77,0.605,0.512,0.338,0.263,0.235,0.1,0.065,0.065,0.003,0.003,0.0],"4":[1.0,0.988,0.863,0.52,0.29,0.168,0.098,0.05,0.033,0.02,0.013,0.007,0.003,0.003,0.0],"5":[1.0,0.985,0.922,0.713,0.468,0.297,0.195,0.105,0.058,0.04,0.018,0.013,0.005,0.0],"6":[1.0,0.99,0.945,0.762,0.532,0.302,0.215,0.14,0.083,0.045,0.025,0.018,0.013,0.01,0.003,0.003,0.0],"7":[1.0,0.938,0.84,0.662,0.49,0.31,0.195,0.145,0.077,0.037,0.02,0.007,0.005,0.003,0.0],"8":[1.0,0.897,0.765,0.625,0.49,0.343,0.22,0.128,0.1,0.052,0.037,0.025,0.018,0.005,0.0],"9":[1.0,0.927,0.785,0.677,0.588,0.435,0.268,0.147,0.115,0.075,0.058,0.037,0.025,0.018,0.01,0.0]}},"conjugated":{"fam":"makeup","text":"a run of alternating bonds {N} atoms longer than at the start","read":"s","key":"conj","mode":"gain","by":0,"mark":"conjugated","need":null,"good":[1,2,3,4,5,6,7,8,9],"sf":{"1":[1.0,0.887,0.833,0.802,0.8,0.715,0.7,0.475,0.417,0.128,0.107,0.052,0.052,0.028,0.028,0.005,0.005,0.003,0.003,0.0],"2":[1.0,0.87,0.85,0.818,0.818,0.74,0.718,0.448,0.385,0.11,0.092,0.045,0.045,0.02,0.02,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"3":[1.0,0.855,0.833,0.792,0.787,0.71,0.698,0.432,0.393,0.113,0.085,0.052,0.052,0.015,0.015,0.005,0.005,0.005,0.005,0.005,0.005,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"4":[1.0,0.858,0.843,0.81,0.8,0.637,0.627,0.415,0.378,0.21,0.193,0.107,0.102,0.048,0.048,0.028,0.025,0.02,0.018,0.01,0.01,0.01,0.01,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"5":[1.0,0.892,0.88,0.845,0.83,0.63,0.615,0.438,0.405,0.228,0.203,0.128,0.12,0.075,0.068,0.037,0.03,0.022,0.022,0.01,0.01,0.01,0.01,0.007,0.007,0.0],"6":[1.0,0.92,0.897,0.858,0.853,0.708,0.688,0.475,0.445,0.24,0.225,0.133,0.125,0.052,0.05,0.043,0.04,0.03,0.03,0.015,0.013,0.013,0.013,0.007,0.007,0.007,0.005,0.005,0.005,0.005,0.005,0.003,0.003,0.0],"7":[1.0,0.67,0.662,0.625,0.61,0.365,0.347,0.263,0.24,0.158,0.14,0.107,0.098,0.068,0.06,0.048,0.048,0.043,0.043,0.03,0.03,0.025,0.025,0.022,0.018,0.013,0.007,0.007,0.007,0.007,0.007,0.005,0.005,0.0],"8":[1.0,0.662,0.657,0.652,0.625,0.41,0.393,0.32,0.292,0.203,0.193,0.165,0.158,0.133,0.122,0.092,0.087,0.07,0.068,0.05,0.045,0.04,0.033,0.028,0.025,0.018,0.018,0.015,0.015,0.01,0.01,0.007,0.007,0.005,0.005,0.003,0.003,0.0],"9":[1.0,0.642,0.625,0.613,0.585,0.383,0.37,0.297,0.28,0.203,0.185,0.122,0.11,0.092,0.087,0.068,0.062,0.05,0.048,0.045,0.043,0.04,0.037,0.033,0.03,0.025,0.025,0.022,0.022,0.022,0.022,0.01,0.007,0.005,0.005,0.005,0.005,0.005,0.005,0.003,0.003,0.0]}},"double_bonds":{"fam":"makeup","text":"at least {N} more double bonds (C=C and C=O)","read":"s","key":"dbl","mode":"gain","by":0,"mark":"double","need":null,"good":[1,2,3,4,5,6,7,8,9],"sf":{"1":[1.0,0.998,0.932,0.848,0.718,0.623,0.505,0.37,0.312,0.273,0.233,0.193,0.152,0.14,0.107,0.055,0.035,0.013,0.007,0.003,0.0],"2":[1.0,0.995,0.94,0.863,0.777,0.662,0.56,0.385,0.323,0.265,0.207,0.147,0.107,0.102,0.08,0.025,0.013,0.0],"3":[1.0,1.0,0.953,0.89,0.805,0.72,0.61,0.438,0.375,0.295,0.235,0.177,0.135,0.125,0.107,0.06,0.052,0.007,0.005,0.003,0.0],"4":[1.0,0.95,0.823,0.603,0.345,0.22,0.133,0.087,0.055,0.037,0.025,0.013,0.01,0.005,0.005,0.0],"5":[1.0,0.943,0.833,0.698,0.477,0.333,0.215,0.155,0.107,0.07,0.052,0.04,0.022,0.005,0.0],"6":[1.0,0.958,0.853,0.723,0.583,0.432,0.255,0.185,0.133,0.085,0.043,0.037,0.03,0.013,0.01,0.007,0.007,0.005,0.005,0.003,0.003,0.0],"7":[1.0,0.655,0.48,0.367,0.297,0.237,0.16,0.122,0.087,0.06,0.05,0.03,0.028,0.018,0.01,0.007,0.005,0.003,0.003,0.0],"8":[1.0,0.67,0.522,0.4,0.315,0.265,0.193,0.13,0.087,0.07,0.048,0.043,0.033,0.028,0.015,0.015,0.013,0.01,0.005,0.003,0.003,0.0],"9":[1.0,0.65,0.517,0.403,0.33,0.273,0.23,0.168,0.113,0.085,0.068,0.055,0.04,0.035,0.022,0.022,0.02,0.018,0.01,0.01,0.01,0.005,0.005,0.003,0.003,0.003,0.0]}},"unsaturation":{"fam":"makeup","text":"at least {N} more rings and double bonds together","read":"s","key":"unsat","mode":"gain","by":0,"mark":"unsat","need":null,"good":[1,2,3,4,5,6,7,8,9],"sf":{"1":[1.0,0.998,0.943,0.865,0.72,0.6,0.507,0.36,0.3,0.26,0.198,0.155,0.128,0.1,0.05,0.037,0.015,0.003,0.003,0.003,0.0],"2":[1.0,0.995,0.948,0.87,0.772,0.652,0.547,0.388,0.32,0.258,0.2,0.133,0.098,0.087,0.048,0.033,0.005,0.0],"3":[1.0,1.0,0.958,0.895,0.807,0.708,0.593,0.407,0.335,0.255,0.205,0.14,0.115,0.095,0.048,0.033,0.022,0.007,0.005,0.003,0.0],"4":[1.0,0.995,0.932,0.825,0.64,0.51,0.385,0.302,0.233,0.177,0.128,0.1,0.07,0.058,0.043,0.037,0.03,0.022,0.013,0.005,0.003,0.003,0.0],"5":[1.0,0.978,0.953,0.875,0.762,0.623,0.535,0.403,0.31,0.247,0.207,0.172,0.155,0.12,0.105,0.083,0.062,0.05,0.035,0.025,0.013,0.007,0.005,0.003,0.003,0.003,0.003,0.0],"6":[1.0,0.985,0.968,0.905,0.848,0.752,0.627,0.527,0.432,0.357,0.282,0.203,0.147,0.11,0.085,0.06,0.048,0.04,0.028,0.022,0.02,0.018,0.013,0.007,0.007,0.005,0.003,0.003,0.003,0.003,0.0],"7":[1.0,0.77,0.698,0.598,0.463,0.375,0.297,0.237,0.2,0.177,0.155,0.128,0.098,0.075,0.062,0.04,0.028,0.022,0.02,0.018,0.01,0.005,0.005,0.005,0.0],"8":[1.0,0.8,0.703,0.598,0.525,0.432,0.343,0.263,0.215,0.18,0.142,0.115,0.08,0.065,0.05,0.043,0.04,0.03,0.028,0.022,0.022,0.02,0.015,0.007,0.005,0.003,0.003,0.0],"9":[1.0,0.728,0.672,0.568,0.512,0.435,0.36,0.307,0.263,0.215,0.185,0.15,0.122,0.098,0.083,0.075,0.065,0.058,0.04,0.037,0.028,0.022,0.02,0.015,0.01,0.01,0.007,0.005,0.005,0.003,0.003,0.003,0.003,0.003,0.003,0.0]}},"hetero_atoms":{"fam":"makeup","text":"at least {N} more atoms that are not carbon","read":"s","key":"hetero","mode":"gain","by":0,"mark":"hetero","need":null,"good":[1,2,3,4,5,6,7,8,9],"sf":{"1":[1.0,0.965,0.932,0.85,0.75,0.585,0.44,0.362,0.273,0.193,0.13,0.08,0.007,0.0],"2":[1.0,0.963,0.94,0.853,0.755,0.58,0.463,0.352,0.268,0.17,0.102,0.058,0.015,0.0],"3":[1.0,0.97,0.945,0.868,0.802,0.67,0.517,0.398,0.282,0.165,0.075,0.037,0.005,0.0],"4":[1.0,0.958,0.86,0.672,0.487,0.318,0.225,0.165,0.12,0.077,0.065,0.055,0.035,0.02,0.015,0.013,0.005,0.003,0.003,0.0],"5":[1.0,0.948,0.86,0.752,0.583,0.398,0.287,0.21,0.15,0.11,0.08,0.058,0.045,0.02,0.015,0.005,0.003,0.003,0.003,0.003,0.0],"6":[1.0,0.963,0.925,0.835,0.647,0.485,0.365,0.28,0.2,0.135,0.102,0.068,0.052,0.02,0.015,0.005,0.005,0.005,0.003,0.0],"7":[1.0,0.79,0.662,0.557,0.432,0.333,0.253,0.182,0.13,0.072,0.06,0.04,0.033,0.022,0.018,0.007,0.003,0.003,0.0],"8":[1.0,0.79,0.688,0.58,0.512,0.45,0.352,0.225,0.175,0.12,0.092,0.055,0.043,0.015,0.013,0.01,0.007,0.005,0.005,0.0],"9":[1.0,0.755,0.632,0.552,0.492,0.412,0.32,0.245,0.182,0.13,0.11,0.08,0.07,0.055,0.048,0.025,0.015,0.0]}},"elements":{"fam":"makeup","text":"at least {N} more different elements besides carbon","read":"s","key":"elements","mode":"gain","by":0,"mark":"elements","need":["never"],"good":[5,6,7,8],"sf":{"4":[1.0,0.699,0.048,0.0],"5":[1.0,0.718,0.077,0.0],"6":[1.0,0.751,0.051,0.0],"7":[1.0,0.749,0.201,0.008,0.0],"8":[1.0,0.784,0.199,0.014,0.0],"9":[1.0,0.808,0.177,0.009,0.0]}},"opener":{"fam":"chain","text":"the first reaction of a turn sets off at least {N} steps","read":"e","key":"opener","mode":"","by":0,"mark":"first","need":null,"good":[1,2,3,4,5,6,7,8,9],"sf":{"1":[1.0,0.797,0.515,0.098,0.007,0.0],"2":[1.0,0.8,0.54,0.122,0.005,0.0],"3":[1.0,0.818,0.6,0.152,0.007,0.0],"4":[1.0,0.897,0.782,0.375,0.16,0.02,0.01,0.0],"5":[1.0,0.925,0.863,0.593,0.345,0.06,0.043,0.005,0.003,0.003,0.0],"6":[1.0,0.958,0.91,0.713,0.515,0.085,0.06,0.015,0.01,0.0],"7":[1.0,0.853,0.755,0.603,0.47,0.17,0.13,0.05,0.02,0.015,0.01,0.007,0.007,0.005,0.005,0.005,0.005,0.005,0.005,0.005,0.0],"8":[1.0,0.833,0.715,0.593,0.527,0.32,0.212,0.07,0.048,0.025,0.01,0.007,0.0],"9":[1.0,0.835,0.713,0.63,0.555,0.41,0.305,0.115,0.083,0.013,0.01,0.007,0.0]}},"closer":{"fam":"chain","text":"the third reaction of a turn sets off at least {N} steps","read":"e","key":"closer","mode":"","by":0,"mark":"third","need":null,"good":[3,4,5,6,7,8,9],"sf":{"1":[1.0,0.938,0.805,0.33,0.19,0.102,0.08,0.028,0.007,0.0],"2":[1.0,0.932,0.802,0.38,0.223,0.102,0.072,0.015,0.005,0.0],"3":[1.0,0.953,0.853,0.453,0.263,0.152,0.133,0.043,0.02,0.007,0.005,0.0],"4":[1.0,0.978,0.88,0.68,0.505,0.207,0.133,0.085,0.04,0.033,0.01,0.007,0.007,0.003,0.003,0.0],"5":[1.0,0.988,0.945,0.82,0.675,0.372,0.265,0.185,0.092,0.052,0.025,0.01,0.007,0.005,0.0],"6":[1.0,0.978,0.958,0.87,0.765,0.515,0.39,0.265,0.14,0.068,0.043,0.015,0.007,0.0],"7":[1.0,0.877,0.772,0.637,0.552,0.32,0.24,0.133,0.08,0.05,0.028,0.015,0.01,0.003,0.0],"8":[1.0,0.855,0.765,0.647,0.58,0.405,0.295,0.163,0.13,0.09,0.072,0.037,0.013,0.007,0.005,0.005,0.003,0.003,0.003,0.003,0.0],"9":[1.0,0.858,0.728,0.655,0.598,0.505,0.425,0.233,0.18,0.113,0.08,0.048,0.03,0.022,0.007,0.005,0.005,0.0]}},"kinds_in_turn":{"fam":"chain","text":"at least {N} different self-reactions in one turn","read":"e","key":"kinds_in_turn","mode":"","by":0,"mark":"kinds_turn","need":["selfs:2"],"good":[5],"sf":{"1":[1.0,0.938,0.733,0.0],"2":[1.0,0.932,0.657,0.0],"3":[1.0,0.953,0.693,0.0],"4":[1.0,0.978,0.89,0.647,0.233,0.018,0.003,0.0],"5":[1.0,0.988,0.902,0.777,0.302,0.03,0.003,0.0],"6":[1.0,0.978,0.953,0.84,0.422,0.022,0.003,0.0],"7":[1.0,0.88,0.708,0.6,0.25,0.033,0.005,0.0],"8":[1.0,0.868,0.677,0.575,0.32,0.07,0.015,0.003,0.0],"9":[1.0,0.868,0.623,0.545,0.29,0.06,0.003,0.0]}},"all_three_feed":{"fam":"chain","text":"at least {N} turns where each of the three reactions sets something off","read":"e","key":"all_three_feed","mode":"","by":0,"mark":"three_feed","need":null,"good":[5,6],"sf":{"1":[1.0,0.34,0.018,0.0],"2":[1.0,0.338,0.005,0.0],"3":[1.0,0.333,0.007,0.0],"4":[1.0,0.52,0.117,0.022,0.0],"5":[1.0,0.613,0.15,0.035,0.0],"6":[1.0,0.72,0.195,0.055,0.0],"7":[1.0,0.378,0.125,0.02,0.0],"8":[1.0,0.378,0.125,0.025,0.0],"9":[1.0,0.318,0.105,0.02,0.0]}},"no_dead_reaction":{"fam":"restraint","text":"at least {N} turns where all three reactions found something to act on","read":"e","key":"no_dead","mode":"","by":0,"mark":"no_dead","need":null,"good":[7,8,9],"sf":{"1":[1.0,1.0,0.99,0.922,0.0],"2":[1.0,0.998,0.993,0.915,0.0],"3":[1.0,1.0,0.985,0.925,0.0],"4":[1.0,0.993,0.9,0.608,0.0],"5":[1.0,0.988,0.907,0.623,0.0],"6":[1.0,0.995,0.927,0.667,0.0],"7":[1.0,0.83,0.505,0.177,0.0],"8":[1.0,0.825,0.497,0.203,0.0],"9":[1.0,0.777,0.458,0.17,0.0]}},"distinct_triggers":{"fam":"chain","text":"at least {N} different reactions that set something off","read":"e","key":"distinct_triggers","mode":"","by":0,"mark":"trigger","need":null,"good":[1,2,3,4,5,6],"sf":{"1":[1.0,0.938,0.897,0.843,0.515,0.015,0.0],"2":[1.0,0.932,0.905,0.828,0.527,0.01,0.0],"3":[1.0,0.953,0.922,0.853,0.527,0.01,0.0],"4":[1.0,0.978,0.91,0.647,0.362,0.11,0.025,0.005,0.0],"5":[1.0,0.988,0.9,0.708,0.4,0.158,0.037,0.0],"6":[1.0,0.978,0.935,0.787,0.527,0.19,0.052,0.003,0.0],"7":[1.0,0.88,0.7,0.458,0.193,0.045,0.005,0.0],"8":[1.0,0.868,0.695,0.463,0.242,0.072,0.01,0.0],"9":[1.0,0.868,0.672,0.435,0.21,0.072,0.01,0.0]}},"kind_ring":{"fam":"chain","text":"at least {N} steps of ring over the round","read":"e","key":"kind:lactol","mode":"","by":0,"mark":"self_ring","need":["lactol"],"good":[1,2,3,4,5,6,7,8,9],"sf":{"1":[1.0,0.887,0.848,0.785,0.635,0.578,0.482,0.163,0.155,0.138,0.01,0.005,0.0],"2":[1.0,0.87,0.85,0.797,0.627,0.575,0.51,0.17,0.158,0.128,0.005,0.003,0.0],"3":[1.0,0.925,0.905,0.88,0.695,0.6,0.545,0.195,0.185,0.165,0.007,0.003,0.003,0.0],"4":[1.0,0.843,0.715,0.545,0.365,0.263,0.185,0.11,0.058,0.025,0.013,0.005,0.005,0.005,0.003,0.003,0.0],"5":[1.0,0.882,0.825,0.69,0.52,0.375,0.282,0.188,0.125,0.072,0.043,0.025,0.013,0.005,0.003,0.003,0.0],"6":[1.0,0.892,0.82,0.7,0.545,0.422,0.312,0.203,0.135,0.085,0.062,0.048,0.028,0.018,0.015,0.015,0.007,0.005,0.0],"7":[1.0,0.723,0.603,0.455,0.35,0.255,0.185,0.13,0.087,0.068,0.05,0.03,0.01,0.005,0.003,0.003,0.003,0.003,0.0],"8":[1.0,0.74,0.645,0.495,0.383,0.292,0.233,0.145,0.117,0.08,0.065,0.045,0.022,0.01,0.007,0.005,0.003,0.0],"9":[1.0,0.703,0.585,0.502,0.39,0.325,0.282,0.228,0.198,0.163,0.105,0.09,0.075,0.048,0.025,0.015,0.007,0.005,0.0]}},"kind_snap":{"fam":"chain","text":"at least {N} steps of snap over the round","read":"e","key":"kind:snap6","mode":"","by":0,"mark":"self_snap","need":["snap6"],"good":[5,6],"sf":{"4":[1.0,0.59,0.26,0.055,0.015,0.003,0.0],"5":[1.0,0.698,0.405,0.14,0.03,0.013,0.007,0.0],"6":[1.0,0.76,0.443,0.225,0.065,0.018,0.005,0.0],"7":[1.0,0.345,0.147,0.043,0.013,0.01,0.003,0.003,0.0],"8":[1.0,0.343,0.155,0.07,0.02,0.005,0.003,0.003,0.0],"9":[1.0,0.333,0.155,0.072,0.03,0.005,0.0]}},"off_total":{"fam":"off","text":"at least {N} things driven off over the round","read":"e","key":"off:all","mode":"","by":0,"mark":"off_all","need":null,"good":[1,2,3,4,5,6,7,8,9],"sf":{"1":[1.0,1.0,1.0,0.995,0.988,0.968,0.955,0.94,0.922,0.892,0.828,0.79,0.723,0.682,0.65,0.613,0.578,0.517,0.47,0.43,0.352,0.312,0.295,0.287,0.265,0.255,0.24,0.225,0.212,0.188,0.165,0.145,0.105,0.085,0.07,0.065,0.065,0.06,0.05,0.05,0.045,0.015,0.005,0.005,0.005,0.0],"2":[1.0,0.998,0.998,0.998,0.988,0.968,0.955,0.93,0.92,0.863,0.815,0.79,0.738,0.703,0.657,0.632,0.588,0.527,0.485,0.432,0.388,0.35,0.325,0.28,0.253,0.233,0.212,0.18,0.152,0.142,0.12,0.092,0.055,0.043,0.037,0.03,0.03,0.028,0.022,0.022,0.02,0.01,0.005,0.005,0.005,0.0],"3":[1.0,1.0,1.0,0.998,0.988,0.975,0.968,0.963,0.935,0.917,0.885,0.863,0.8,0.767,0.738,0.698,0.657,0.598,0.56,0.505,0.41,0.357,0.333,0.32,0.29,0.255,0.24,0.223,0.17,0.15,0.115,0.098,0.095,0.083,0.065,0.05,0.05,0.045,0.035,0.033,0.033,0.018,0.01,0.01,0.007,0.0],"4":[1.0,1.0,0.993,0.983,0.953,0.93,0.897,0.865,0.818,0.75,0.667,0.6,0.542,0.472,0.405,0.33,0.302,0.253,0.212,0.188,0.155,0.122,0.098,0.08,0.072,0.065,0.043,0.037,0.033,0.025,0.013,0.013,0.01,0.007,0.005,0.005,0.005,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"5":[1.0,1.0,1.0,0.99,0.98,0.96,0.943,0.915,0.885,0.828,0.782,0.713,0.665,0.623,0.56,0.495,0.43,0.388,0.338,0.297,0.265,0.23,0.198,0.163,0.145,0.125,0.105,0.098,0.075,0.065,0.052,0.04,0.033,0.025,0.025,0.018,0.018,0.01,0.007,0.007,0.005,0.005,0.005,0.003,0.003,0.0],"6":[1.0,0.998,0.995,0.995,0.99,0.983,0.965,0.938,0.91,0.885,0.868,0.792,0.748,0.708,0.657,0.608,0.542,0.485,0.44,0.39,0.355,0.305,0.26,0.23,0.198,0.158,0.145,0.125,0.105,0.077,0.068,0.06,0.045,0.033,0.033,0.03,0.028,0.022,0.02,0.015,0.007,0.007,0.005,0.005,0.005,0.005,0.005,0.005,0.003,0.003,0.003,0.0],"7":[1.0,0.925,0.917,0.87,0.828,0.77,0.708,0.62,0.557,0.512,0.468,0.4,0.36,0.3,0.26,0.23,0.198,0.177,0.152,0.145,0.117,0.095,0.077,0.068,0.055,0.05,0.033,0.033,0.02,0.018,0.015,0.013,0.01,0.007,0.007,0.007,0.007,0.007,0.005,0.0],"8":[1.0,0.948,0.922,0.905,0.877,0.838,0.762,0.708,0.642,0.595,0.525,0.448,0.41,0.37,0.343,0.312,0.275,0.245,0.223,0.185,0.172,0.15,0.13,0.125,0.11,0.098,0.068,0.05,0.045,0.04,0.033,0.03,0.022,0.02,0.018,0.015,0.015,0.013,0.013,0.013,0.01,0.01,0.007,0.007,0.007,0.007,0.005,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"9":[1.0,0.925,0.9,0.892,0.868,0.838,0.802,0.705,0.635,0.593,0.525,0.472,0.432,0.407,0.367,0.323,0.29,0.258,0.225,0.217,0.193,0.152,0.128,0.117,0.105,0.1,0.09,0.08,0.07,0.062,0.052,0.043,0.037,0.03,0.028,0.028,0.022,0.013,0.007,0.005,0.005,0.0]}},"off_water":{"fam":"off","text":"at least {N} water driven off","read":"e","key":"off:water","mode":"","by":0,"mark":"water","need":null,"good":[4,5,6,7,8,9],"sf":{"1":[1.0,1.0,0.998,0.975,0.892,0.87,0.8,0.745,0.69,0.56,0.472,0.38,0.325,0.235,0.198,0.155,0.083,0.072,0.072,0.05,0.048,0.04,0.015,0.015,0.013,0.005,0.005,0.005,0.005,0.0],"2":[1.0,0.998,0.998,0.983,0.895,0.865,0.797,0.738,0.652,0.578,0.495,0.412,0.36,0.25,0.205,0.16,0.075,0.058,0.05,0.04,0.03,0.02,0.013,0.01,0.007,0.007,0.007,0.007,0.007,0.003,0.003,0.0],"3":[1.0,1.0,0.998,0.988,0.925,0.912,0.892,0.838,0.797,0.675,0.562,0.47,0.395,0.265,0.21,0.165,0.102,0.085,0.077,0.045,0.043,0.028,0.015,0.01,0.01,0.01,0.01,0.007,0.005,0.0],"4":[1.0,0.995,0.983,0.973,0.91,0.848,0.79,0.688,0.562,0.465,0.38,0.268,0.17,0.125,0.065,0.048,0.035,0.022,0.015,0.003,0.0],"5":[1.0,0.99,0.99,0.968,0.943,0.912,0.86,0.807,0.715,0.618,0.517,0.445,0.367,0.29,0.215,0.147,0.11,0.092,0.068,0.058,0.045,0.022,0.02,0.02,0.018,0.015,0.01,0.005,0.005,0.003,0.003,0.003,0.0],"6":[1.0,0.995,0.993,0.988,0.978,0.97,0.932,0.873,0.833,0.75,0.657,0.555,0.472,0.375,0.325,0.245,0.182,0.147,0.117,0.08,0.06,0.05,0.037,0.03,0.02,0.018,0.013,0.007,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"7":[1.0,0.863,0.815,0.723,0.677,0.598,0.517,0.415,0.367,0.282,0.235,0.182,0.145,0.102,0.09,0.077,0.065,0.055,0.04,0.033,0.022,0.018,0.007,0.005,0.005,0.0],"8":[1.0,0.855,0.795,0.733,0.685,0.63,0.575,0.502,0.44,0.38,0.333,0.265,0.22,0.18,0.158,0.135,0.1,0.085,0.072,0.058,0.045,0.028,0.018,0.015,0.01,0.01,0.007,0.003,0.003,0.0],"9":[1.0,0.833,0.802,0.738,0.677,0.598,0.562,0.5,0.417,0.372,0.325,0.28,0.245,0.21,0.168,0.128,0.113,0.095,0.077,0.058,0.05,0.04,0.033,0.022,0.02,0.02,0.01,0.007,0.005,0.005,0.003,0.003,0.003,0.0]}},"off_hydrogen":{"fam":"off","text":"at least {N} hydrogen driven off","read":"e","key":"off:hydrogen","mode":"","by":0,"mark":"jar_hydrogen","need":["pcc"],"good":[1,2,3,4,5,6,7,8],"sf":{"1":[1.0,0.988,0.968,0.885,0.825,0.735,0.613,0.542,0.468,0.365,0.297,0.23,0.207,0.163,0.115,0.09,0.068,0.043,0.007,0.0],"2":[1.0,0.983,0.955,0.902,0.812,0.715,0.647,0.547,0.482,0.388,0.312,0.24,0.235,0.165,0.135,0.1,0.065,0.033,0.01,0.0],"3":[1.0,0.988,0.96,0.905,0.84,0.743,0.662,0.58,0.512,0.435,0.347,0.255,0.235,0.15,0.13,0.072,0.048,0.035,0.007,0.0],"4":[1.0,0.92,0.825,0.685,0.525,0.362,0.26,0.198,0.133,0.105,0.077,0.058,0.043,0.03,0.022,0.02,0.015,0.01,0.003,0.003,0.0],"5":[1.0,0.927,0.863,0.752,0.6,0.485,0.415,0.29,0.235,0.168,0.117,0.098,0.07,0.05,0.043,0.033,0.022,0.018,0.01,0.005,0.005,0.005,0.003,0.0],"6":[1.0,0.91,0.86,0.77,0.63,0.53,0.417,0.325,0.275,0.185,0.155,0.102,0.065,0.043,0.04,0.022,0.015,0.003,0.0],"7":[1.0,0.854,0.726,0.58,0.439,0.363,0.307,0.241,0.165,0.099,0.094,0.061,0.028,0.019,0.009,0.009,0.009,0.005,0.0],"8":[1.0,0.884,0.749,0.604,0.536,0.469,0.348,0.266,0.208,0.174,0.111,0.092,0.072,0.048,0.034,0.024,0.01,0.0],"9":[1.0,0.866,0.719,0.603,0.504,0.469,0.415,0.335,0.263,0.183,0.165,0.107,0.076,0.054,0.036,0.027,0.018,0.013,0.009,0.0]}},"off_carbon_dioxide":{"fam":"off","text":"at least {N} carbon dioxide driven off","read":"e","key":"off:carbon_dioxide","mode":"","by":0,"mark":"jar_carbon_dioxide","need":["mode:co2"],"good":[1,2,3,4,5],"sf":{"1":[1.0,0.96,0.915,0.828,0.693,0.507,0.393,0.302,0.217,0.117,0.087,0.055,0.005,0.005,0.0],"2":[1.0,0.953,0.912,0.825,0.71,0.502,0.383,0.285,0.207,0.098,0.077,0.035,0.003,0.0],"3":[1.0,0.96,0.922,0.83,0.733,0.555,0.453,0.32,0.217,0.077,0.058,0.035,0.0],"4":[1.0,0.802,0.657,0.432,0.265,0.14,0.065,0.037,0.02,0.01,0.01,0.003,0.003,0.0],"5":[1.0,0.805,0.672,0.46,0.312,0.172,0.135,0.095,0.06,0.025,0.015,0.005,0.0],"6":[1.0,0.775,0.693,0.55,0.403,0.242,0.16,0.098,0.055,0.018,0.007,0.007,0.005,0.003,0.003,0.0],"7":[1.0,0.347,0.24,0.172,0.128,0.101,0.074,0.048,0.03,0.015,0.009,0.003,0.003,0.0],"8":[1.0,0.34,0.222,0.186,0.136,0.118,0.089,0.053,0.027,0.009,0.009,0.006,0.003,0.003,0.0],"9":[1.0,0.365,0.22,0.154,0.14,0.11,0.083,0.068,0.042,0.024,0.015,0.009,0.003,0.0]}},"many_jars":{"fam":"off","text":"at least {N} different things driven off","read":"e","key":"jars","mode":"","by":0,"mark":"jars","need":null,"good":[4,5,6,7,8,9],"sf":{"1":[1.0,1.0,0.99,0.958,0.0],"2":[1.0,0.998,0.99,0.95,0.0],"3":[1.0,1.0,0.99,0.965,0.0],"4":[1.0,1.0,0.925,0.77,0.12,0.003,0.0],"5":[1.0,1.0,0.94,0.762,0.152,0.003,0.0],"6":[1.0,0.998,0.932,0.782,0.16,0.005,0.0],"7":[1.0,0.925,0.743,0.435,0.152,0.015,0.0],"8":[1.0,0.948,0.75,0.45,0.175,0.04,0.003,0.0],"9":[1.0,0.925,0.745,0.417,0.158,0.022,0.003,0.0]}},"big_puff":{"fam":"off","text":"at least {N} things driven off in one turn","read":"e","key":"puff","mode":"","by":0,"mark":"puff","need":null,"good":[1,2,3,4,5,6,7,8,9],"sf":{"1":[1.0,1.0,0.995,0.958,0.885,0.818,0.69,0.575,0.502,0.4,0.295,0.28,0.223,0.172,0.095,0.068,0.058,0.022,0.02,0.005,0.005,0.0],"2":[1.0,0.998,0.998,0.955,0.86,0.818,0.703,0.58,0.495,0.398,0.29,0.247,0.177,0.142,0.087,0.043,0.028,0.007,0.007,0.0],"3":[1.0,1.0,1.0,0.975,0.92,0.873,0.802,0.675,0.578,0.475,0.325,0.255,0.188,0.135,0.098,0.055,0.045,0.018,0.015,0.005,0.003,0.0],"4":[1.0,1.0,0.99,0.963,0.887,0.772,0.613,0.422,0.307,0.21,0.155,0.098,0.052,0.04,0.028,0.022,0.015,0.013,0.01,0.01,0.01,0.01,0.007,0.007,0.005,0.005,0.0],"5":[1.0,1.0,1.0,0.985,0.94,0.85,0.745,0.627,0.502,0.338,0.24,0.168,0.145,0.102,0.065,0.04,0.022,0.013,0.01,0.01,0.003,0.0],"6":[1.0,0.998,0.995,0.99,0.958,0.902,0.84,0.71,0.6,0.455,0.362,0.268,0.212,0.142,0.095,0.06,0.052,0.035,0.028,0.01,0.007,0.005,0.003,0.003,0.003,0.0],"7":[1.0,0.925,0.912,0.853,0.78,0.662,0.573,0.422,0.347,0.28,0.215,0.177,0.133,0.1,0.08,0.058,0.037,0.028,0.02,0.013,0.01,0.005,0.005,0.005,0.0],"8":[1.0,0.948,0.92,0.885,0.833,0.765,0.655,0.537,0.445,0.385,0.305,0.25,0.205,0.175,0.145,0.11,0.092,0.083,0.065,0.045,0.037,0.03,0.013,0.005,0.003,0.003,0.0],"9":[1.0,0.925,0.9,0.88,0.853,0.785,0.715,0.58,0.49,0.412,0.323,0.275,0.253,0.22,0.17,0.125,0.107,0.085,0.068,0.045,0.037,0.03,0.025,0.015,0.005,0.005,0.005,0.0]}},"acted_total":{"fam":"restraint","text":"at least {N} of the reactions fired found something to act on","read":"e","key":"acted","mode":"","by":0,"mark":"acted","need":null,"good":[7,8,9],"sf":{"1":[1.0,1.0,1.0,1.0,0.998,0.998,0.993,0.97,0.935,0.922,0.0],"2":[1.0,0.998,0.998,0.998,0.995,0.995,0.993,0.978,0.96,0.915,0.0],"3":[1.0,1.0,1.0,1.0,0.995,0.995,0.993,0.973,0.958,0.925,0.0],"4":[1.0,1.0,1.0,0.993,0.975,0.95,0.932,0.843,0.728,0.608,0.0],"5":[1.0,1.0,0.998,0.993,0.97,0.953,0.927,0.815,0.733,0.623,0.0],"6":[1.0,1.0,0.995,0.993,0.98,0.963,0.935,0.858,0.775,0.667,0.0],"7":[1.0,0.975,0.94,0.868,0.738,0.625,0.53,0.36,0.268,0.177,0.0],"8":[1.0,0.995,0.938,0.853,0.757,0.64,0.545,0.4,0.29,0.203,0.0],"9":[1.0,0.985,0.932,0.843,0.67,0.573,0.487,0.338,0.25,0.17,0.0]}},"distinct_acted":{"fam":"restraint","text":"at least {N} different reactions that found something to act on","read":"e","key":"acted_kinds","mode":"","by":0,"mark":"acted_kinds","need":null,"good":[4,7,8,9],"sf":{"1":[1.0,1.0,1.0,1.0,0.993,0.98,0.693,0.0],"2":[1.0,0.998,0.998,0.995,0.99,0.975,0.74,0.0],"3":[1.0,1.0,1.0,0.995,0.988,0.968,0.748,0.0],"4":[1.0,1.0,1.0,0.988,0.943,0.843,0.575,0.207,0.028,0.0],"5":[1.0,1.0,0.998,0.993,0.953,0.85,0.605,0.258,0.035,0.0],"6":[1.0,1.0,0.995,0.993,0.958,0.868,0.652,0.305,0.033,0.0],"7":[1.0,0.975,0.94,0.845,0.627,0.412,0.205,0.07,0.005,0.0],"8":[1.0,0.995,0.938,0.833,0.67,0.458,0.23,0.052,0.007,0.0],"9":[1.0,0.985,0.932,0.792,0.595,0.39,0.203,0.062,0.003,0.0]}},"by_two_rings":{"fam":"timing","text":"at least {N} more rings than the molecule starts with, by the end of the second turn","read":"s","key":"rings","mode":"gain","by":2,"mark":"ring","need":null,"good":[2,3,5,6],"sf":{"1":[1.0,0.853,0.63,0.142,0.01,0.0],"2":[1.0,0.84,0.615,0.155,0.003,0.0],"3":[1.0,0.9,0.67,0.198,0.013,0.0],"4":[1.0,0.948,0.81,0.455,0.265,0.152,0.083,0.035,0.022,0.015,0.01,0.003,0.003,0.003,0.0],"5":[1.0,0.963,0.902,0.672,0.448,0.297,0.205,0.102,0.072,0.052,0.035,0.02,0.015,0.007,0.005,0.003,0.003,0.003,0.003,0.0],"6":[1.0,0.965,0.917,0.75,0.573,0.415,0.302,0.182,0.138,0.102,0.048,0.018,0.01,0.007,0.005,0.005,0.003,0.003,0.003,0.0],"7":[1.0,0.865,0.738,0.57,0.405,0.25,0.122,0.058,0.035,0.022,0.02,0.018,0.007,0.005,0.003,0.0],"8":[1.0,0.855,0.743,0.583,0.455,0.29,0.172,0.098,0.065,0.043,0.03,0.018,0.013,0.007,0.005,0.005,0.005,0.003,0.003,0.0],"9":[1.0,0.85,0.705,0.603,0.525,0.385,0.25,0.165,0.098,0.062,0.05,0.033,0.018,0.015,0.01,0.003,0.003,0.003,0.0]}},"by_two_off_total":{"fam":"timing","text":"at least {N} things driven off over the round, by the end of the second turn","read":"e","key":"off:all","mode":"","by":2,"mark":"deadline_off_all","need":null,"good":[1,2,3,4,5,6,7,8,9],"sf":{"1":[1.0,0.998,0.993,0.975,0.94,0.922,0.863,0.78,0.713,0.603,0.54,0.398,0.352,0.325,0.292,0.265,0.247,0.228,0.212,0.18,0.13,0.1,0.085,0.048,0.037,0.037,0.033,0.028,0.028,0.0],"2":[1.0,0.995,0.993,0.983,0.932,0.895,0.858,0.775,0.725,0.608,0.56,0.438,0.393,0.35,0.282,0.233,0.205,0.17,0.135,0.102,0.085,0.065,0.06,0.028,0.018,0.018,0.015,0.013,0.013,0.0],"3":[1.0,0.995,0.993,0.985,0.955,0.935,0.907,0.835,0.782,0.68,0.605,0.472,0.407,0.357,0.292,0.275,0.247,0.223,0.175,0.128,0.1,0.06,0.058,0.043,0.033,0.03,0.02,0.015,0.015,0.0],"4":[1.0,0.985,0.965,0.945,0.91,0.865,0.8,0.708,0.603,0.477,0.398,0.305,0.25,0.203,0.158,0.11,0.09,0.068,0.048,0.035,0.02,0.015,0.01,0.01,0.003,0.003,0.003,0.003,0.003,0.003,0.003,0.0],"5":[1.0,0.985,0.983,0.965,0.927,0.895,0.858,0.792,0.723,0.62,0.557,0.47,0.405,0.323,0.282,0.21,0.17,0.142,0.115,0.092,0.065,0.05,0.033,0.022,0.013,0.01,0.01,0.005,0.003,0.0],"6":[1.0,0.985,0.98,0.978,0.963,0.948,0.897,0.858,0.805,0.725,0.68,0.583,0.495,0.432,0.372,0.318,0.263,0.223,0.18,0.135,0.107,0.085,0.07,0.048,0.028,0.025,0.02,0.02,0.018,0.018,0.018,0.01,0.01,0.003,0.0],"7":[1.0,0.9,0.882,0.83,0.787,0.718,0.637,0.547,0.497,0.43,0.375,0.312,0.245,0.188,0.163,0.14,0.115,0.1,0.077,0.058,0.05,0.037,0.03,0.02,0.015,0.01,0.003,0.0],"8":[1.0,0.912,0.882,0.853,0.818,0.777,0.7,0.632,0.562,0.492,0.425,0.362,0.33,0.287,0.26,0.225,0.193,0.16,0.147,0.128,0.115,0.092,0.072,0.068,0.055,0.043,0.033,0.03,0.022,0.018,0.018,0.015,0.007,0.007,0.005,0.005,0.005,0.003,0.003,0.003,0.003,0.003,0.0],"9":[1.0,0.895,0.87,0.848,0.83,0.792,0.75,0.642,0.58,0.53,0.455,0.4,0.362,0.333,0.305,0.255,0.22,0.182,0.165,0.147,0.122,0.092,0.085,0.068,0.055,0.048,0.04,0.03,0.028,0.02,0.018,0.01,0.007,0.003,0.0]}}};
// SPEC TABLE END
// the clear rate the aiming player is tuned to, by round number (HURDLES.md); data, replace with the table
const SPEC_TARGET = { 1: 0.85, 2: 0.80, 3: 0.65, 4: 0.75, 5: 0.70, 6: 0.55, 7: 0.65, 8: 0.60, 9: 0.45 };
// the families a player has open by run length (tierNo 1, 2, 3); chain, off and restraint are always open
const SPEC_FAMILY_TIER = { chain: 0, off: 0, restraint: 0, size: 1, makeup: 1, shape: 2, timing: 2 };
// two specs that cannot sit in one round (they pull against each other, or are one count read twice)
const SPEC_CLASH = [['growth', 'cut_down'], ['growth', 'size_range'], ['cut_down', 'size_range'], ['rings', 'five_rings'], ['rings', 'six_rings'], ['rings', 'by_two_rings'], ['off_total', 'by_two_off_total']];
const SPEC_OFF = { water: 'water', h2: 'hydrogen', co2: 'carbon_dioxide', chloride: 'acid_fumes', oxide: 'other', other: 'other' };
const SPEC_JARS = ['water', 'hydrogen', 'carbon_dioxide', 'acid_fumes', 'other'];
const SX = (() => {
  const bit = k => 1n << BigInt(k);
  // the heavy atoms of a model as a graph: el (elements), bonds [i, j, order] (kekule form), nh (hydrogens on each atom)
  function sgraph(m) {
    const idx = new Map(), el = [], nh = [];
    m.atoms.forEach(a => { if (a.el === 'H' || a.fly) return; idx.set(a, el.length); el.push(a.el); nh.push(0); });
    const bonds = [];
    m.bonds.forEach(b => { const i = idx.get(b.a), j = idx.get(b.b); if (i != null && j != null) bonds.push([i, j, Math.round(b.order)]); else if (i != null && b.b.el === 'H') nh[i]++; else if (j != null && b.a.el === 'H') nh[j]++; });
    return { el, bonds, nh };
  }
  function adjOf(n, bonds) { const a = Array.from({ length: n }, () => []); bonds.forEach(([i, j, o]) => { a[i].push([j, o]); a[j].push([i, o]); }); return a; }
  function pieces(n, adj) { let k = 0; const seen = new Array(n).fill(-1); for (let s = 0; s < n; s++) { if (seen[s] >= 0) continue; seen[s] = k; const q = [s]; for (let qi = 0; qi < q.length; qi++) for (const [y] of adj[q[qi]]) if (seen[y] < 0) { seen[y] = k; q.push(y); } k++; } return k; }
  const cmp = (a, b) => { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i]; return a.length - b.length; };
  // the smallest set of smallest rings (Horton's candidates, a minimum cycle basis over GF(2)); each ring is a list of atoms in order
  function ringsOf(n, bonds, adj) {
    const want = bonds.length - n + pieces(n, adj); if (want <= 0) return [];
    const eid = new Map(); bonds.forEach(([i, j], k) => { eid.set(i * 1000 + j, k); eid.set(j * 1000 + i, k); });
    const cands = new Map();
    for (let r = 0; r < n; r++) {
      const par = new Array(n).fill(-2); par[r] = -1; const q = [r];
      for (let qi = 0; qi < q.length; qi++) for (const [y] of adj[q[qi]]) if (par[y] === -2) { par[y] = q[qi]; q.push(y); }
      const path = x => { const p = []; while (x !== -1) { p.push(x); x = par[x]; } return p; };
      for (const [i, j] of bonds) {
        if (par[i] === -2 || par[j] === -2 || par[i] === j || par[j] === i) continue;
        const pi = path(i), pj = path(j), si = new Set(pi.slice(0, -1)); if (pj.slice(0, -1).some(x => si.has(x))) continue;
        const cyc = pi.slice().reverse().concat(pj.slice(0, -1)), ids = cyc.map((c, t) => eid.get(c * 1000 + cyc[(t + 1) % cyc.length])).sort((a, b) => a - b), key = ids.join(',');
        if (!cands.has(key)) cands.set(key, { cyc, ids });
      }
    }
    const order = [...cands.values()].sort((a, b) => a.cyc.length - b.cyc.length || cmp(a.ids, b.ids)), basis = [], chosen = [];
    for (const { cyc, ids } of order) { let v = 0n; for (const b of ids) v |= bit(b); for (const bv of basis) { const w = v ^ bv; if (w < v) v = w; } if (v) { basis.push(v); chosen.push(cyc); if (chosen.length === want) break; } }
    return chosen;
  }
  function uf(k) { const p = Array.from({ length: k }, (_, i) => i), find = x => { while (p[x] !== x) { p[x] = p[p[x]]; x = p[x]; } return x; }; return { find, union: (a, b) => { p[find(a)] = find(b); } }; }
  const biggest = (keys) => { const c = new Map(); keys.forEach(k => c.set(k, (c.get(k) || 0) + 1)); return c.size ? Math.max(...c.values()) : 0; };
  function ringNums(G, adj) {
    const n = G.el.length, rs = ringsOf(n, G.bonds, adj), sets = rs.map(r => new Set(r)), out = { rs, inRing: new Set(), arom: new Set() };
    sets.forEach(s => s.forEach(a => out.inRing.add(a)));
    out.rings = rs.length; out.ring5 = rs.filter(r => r.length === 5).length; out.ring6 = rs.filter(r => r.length === 6).length;
    out.ring_small = rs.filter(r => r.length <= 4).length; out.ring_big = rs.filter(r => r.length >= 7).length;
    out.ring_sizes = new Set(rs.map(r => r.length)).size; out.ring_atoms = out.inRing.size;
    const f1 = uf(rs.length), f2 = uf(rs.length); let pairs = 0; const spiroAt = new Set(), bridgeAt = new Set();
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
      const com = new Set([...sets[i]].filter(a => sets[j].has(a)));
      if (com.size >= 2) { pairs++; f1.union(i, j); }
      if (com.size) f2.union(i, j);
      if (com.size === 1) com.forEach(a => spiroAt.add(a));
      if (com.size >= 3) com.forEach(a => { const r = rs[i], k = r.indexOf(a); let inner = 0; for (const d of [-1, 1]) if (com.has(r[(k + d + r.length) % r.length])) inner++; if (inner === 1) bridgeAt.add(a); });
    }
    out.fused_pairs = pairs; out.fused_block = rs.length ? biggest(rs.map((_, i) => f1.find(i))) : 0; out.ring_systems = new Set(rs.map((_, i) => f2.find(i))).size;
    out.spiro = spiroAt.size; out.bridgehead = bridgeAt.size;
    out.ring_hetero = rs.filter(r => r.some(a => G.el[a] !== 'C')).length;
    out.ring_mixed = rs.filter(r => new Set(r.map(a => G.el[a]).filter(e => e !== 'C')).size >= 2).length;
    const bo = new Map(); G.bonds.forEach(([i, j, o]) => { bo.set(i * 1000 + j, o); bo.set(j * 1000 + i, o); });
    const arom = rs.filter(r => r.length === 6 && r.every(a => G.el[a] === 'C') && r.map((_, t) => bo.get(r[t] * 1000 + r[(t + 1) % 6])).slice().sort().join('') === '111222' && r.every((_, t) => bo.get(r[t] * 1000 + r[(t + 1) % 6]) !== bo.get(r[(t + 1) % 6] * 1000 + r[(t + 2) % 6])));
    out.aromatic = arom.length; arom.forEach(r => r.forEach(a => out.arom.add(a)));
    return out;
  }
  function longestChain(G, adj, inRing) {
    const nodes = []; G.el.forEach((e, i) => { if (e === 'C' && !inRing.has(i)) nodes.push(i); });
    const ns = new Set(nodes), nb = i => adj[i].map(x => x[0]).filter(y => ns.has(y));
    const far = s => { const seen = new Map([[s, 0]]), q = [s]; for (let qi = 0; qi < q.length; qi++) for (const y of nb(q[qi])) if (!seen.has(y)) { seen.set(y, seen.get(q[qi]) + 1); q.push(y); } let m = s; seen.forEach((d, k) => { if (d > seen.get(m)) m = k; }); return [m, seen.get(m), seen]; };
    const done = new Set(); let best = 0;
    for (const s of nodes) { if (done.has(s)) continue; const [a, , comp] = far(s); comp.forEach((_, k) => done.add(k)); best = Math.max(best, far(a)[1] + 1); }
    return best;
  }
  function diameter(n, adj) { let best = 0; for (let s = 0; s < n; s++) { const d = new Array(n).fill(-1); d[s] = 0; const q = [s]; for (let qi = 0; qi < q.length; qi++) for (const [y] of adj[q[qi]]) if (d[y] < 0) { d[y] = d[q[qi]] + 1; q.push(y); } best = Math.max(best, ...d); } return best; }
  function altRun(G, adj) {
    const n = G.el.length, pi = adj.map(a => a.some(([, o]) => o >= 2)), lone = G.el.map(e => e === 'O' || e === 'N' || e === 'S' || e === 'Cl'), f = uf(n), conj = new Set(), inc = new Set();
    G.bonds.forEach(([i, j, o]) => { if (o === 1 && ((pi[i] && pi[j]) || (pi[i] && lone[j]) || (pi[j] && lone[i]))) { conj.add(i); conj.add(j); f.union(i, j); inc.add(i); inc.add(j); } });
    G.bonds.forEach(([i, j, o]) => { if (o >= 2 && (conj.has(i) || conj.has(j))) { f.union(i, j); inc.add(i); inc.add(j); } });
    return inc.size ? biggest([...inc].map(f.find)) : 0;
  }
  // the 12 kinds of group (HURDLES.md), each counted as a small pattern at every atom
  function groupsOf(G, adj, arom) {
    const el = G.el, nh = G.nh, deg = i => adj[i].length + nh[i], cnt = { 'OH': 0, 'C=O': 0, 'C=C': 0, 'COOH': 0, 'NH2': 0, 'SH': 0, 'Cl': 0, 'ester': 0, 'ether': 0, 'amide': 0, 'S-S': 0, 'C=N': 0 };
    const dbl = (i, e) => adj[i].filter(([j, o]) => o === 2 && el[j] === e).map(x => x[0]);
    const isCO = c => el[c] === 'C' && dbl(c, 'O').some(o => adj[o].length === 1);
    const ketC = c => isCO(c) && deg(c) === 3 && adj[c].every(([j, o]) => o === 2 || el[j] === 'C');
    for (let i = 0; i < el.length; i++) {
      const e = el[i];
      if (e === 'O') {
        const sg = adj[i].filter(x => x[1] === 1);
        if (nh[i] === 1 && adj[i].length === 1 && sg.length === 1 && el[sg[0][0]] === 'C' && !isCO(sg[0][0])) cnt['OH']++;
        if (nh[i] === 1 && adj[i].length === 1 && sg.length === 1 && el[sg[0][0]] === 'C' && isCO(sg[0][0]) && deg(sg[0][0]) === 3) cnt['COOH']++;
        if (nh[i] === 0 && adj[i].length === 2 && sg.length === 2 && sg.every(([j]) => el[j] === 'C')) { if (sg.some(([j]) => isCO(j))) { if (sg.some(([j]) => isCO(j) && deg(j) === 3)) cnt['ester']++; } else cnt['ether']++; }
      } else if (e === 'C') {
        if (ketC(i)) cnt['C=O']++;
        if (deg(i) === 3 && dbl(i, 'N').some(nn => deg(nn) === 2)) cnt['C=N']++;
        if (isCO(i) && deg(i) === 3) adj[i].forEach(([j, o]) => { if (o === 1 && el[j] === 'N' && deg(j) === 3) cnt['amide']++; });
      } else if (e === 'N') {
        if (adj[i].length === 1 && nh[i] === 2 && adj[i][0][1] === 1 && el[adj[i][0][0]] === 'C' && !isCO(adj[i][0][0])) cnt['NH2']++;
      } else if (e === 'S') {
        if (adj[i].length === 1 && nh[i] === 1) cnt['SH']++;
        if (deg(i) === 2) adj[i].forEach(([j]) => { if (j > i && el[j] === 'S' && deg(j) === 2) cnt['S-S']++; });
      } else if (e === 'Cl') cnt['Cl']++;
    }
    G.bonds.forEach(([i, j, o]) => { if (o === 2 && el[i] === 'C' && el[j] === 'C' && !(arom.has(i) && arom.has(j))) cnt['C=C']++; });
    return cnt;
  }
  // every structural number a spec reads, worked out when asked for and kept
  function featOf(m) {
    const G = sgraph(m), n = G.el.length, adj = adjOf(n, G.bonds), memo = {};
    const rn = () => memo.rn || (memo.rn = ringNums(G, adj));
    const gr = () => memo.gr || (memo.gr = groupsOf(G, adj, rn().arom));
    const get = k => {
      if (k in memo) return memo[k];
      let v;
      if (k.charAt(0) === 'g' && k.charAt(1) === ':') v = gr()[k.slice(2)];
      else switch (k) {
        case 'atoms': v = n; break;
        case 'chain': v = longestChain(G, adj, rn().inRing); break;
        case 'diameter': v = n > 1 ? diameter(n, adj) : 0; break;
        case 'branch': v = adj.filter(a => a.length >= 3).length; break;
        case 'conj': v = altRun(G, adj); break;
        case 'dbl': v = G.bonds.filter(([i, j, o]) => o === 2 && ((G.el[i] === 'C' && (G.el[j] === 'C' || G.el[j] === 'O')) || (G.el[i] === 'O' && G.el[j] === 'C'))).length; break;
        case 'unsat': v = rn().rings + G.bonds.filter(b => b[2] === 2).length; break;
        case 'hetero': v = G.el.filter(e => e !== 'C').length; break;
        case 'elements': v = new Set(G.el.filter(e => e !== 'C')).size; break;
        case 'kinds': v = Object.values(gr()).filter(x => x > 0).length; break;
        default: v = rn()[k]; if (v == null) throw new Error('spec: no reader for ' + k);
      }
      return (memo[k] = v);
    };
    return { get, G };
  }
  return { sgraph, adjOf, ringsOf, featOf, groupsOf, ringNums };
})();
// the numbers of one molecule model, as the readers see it: { key: value } for the keys asked for (tests and the Python check)
function specNumbers(m, keys) { const f = SX.featOf(m), out = {}; (keys || ['atoms', 'rings', 'ring5', 'ring6', 'ring_small', 'ring_big', 'ring_sizes', 'ring_atoms', 'fused_pairs', 'fused_block', 'ring_systems', 'spiro', 'bridgehead', 'ring_hetero', 'ring_mixed', 'aromatic', 'chain', 'diameter', 'branch', 'conj', 'dbl', 'unsat', 'hetero', 'elements', 'kinds']).forEach(k => { out[k] = f.get(k); }); const gk = ['OH', 'C=O', 'C=C', 'COOH', 'NH2', 'SH', 'Cl', 'ester', 'ether', 'amide', 'S-S', 'C=N']; if (!keys) gk.forEach(k => { out['g:' + k] = f.get('g:' + k); }); return out; }
// ---------- the record of a round ----------
const offOf = t => { const o = {}; SPEC_JARS.forEach(j => { o[j] = (t && t['off_' + j]) || 0; }); return o; };
// A page as the specs read it, from the trail since the page began: every circle (a reagent that acted, one that found nothing,
// the bank) with the reflex steps it set off, the reflex steps in order, what was driven off, and the molecule as it stands.
function pageFrom(g, mark, off0) {
  const circ = [], chain = []; let cur = -1;
  for (const t of g.trail.slice(mark)) {
    if (t.free) { chain.push(t.id); if (cur >= 0) circ[cur].set++; continue; }
    circ.push({ id: t.id, places: t.id === BANKID || t.wasted ? 0 : t.hits || 0, bank: t.id === BANKID, set: 0 }); cur = circ.length - 1;
  }
  const o1 = offOf(g.tally), off = {}; let total = 0; SPEC_JARS.forEach(j => { off[j] = o1[j] - off0[j]; total += off[j]; });
  return { circ, chain, off, total, F: SX.featOf(g.m) };
}
function specBegin(g, run) {
  g.specDef = RULE.spec && run && run.spec && run.spec.parts ? run.spec : null; g.spec = null; g.rec = null;
  if (!g.specDef) return;
  g.rec = { f0: SX.featOf(g.m), pages: [], mark: 0, off0: offOf(g.tally) }; specUpdate(g);
}
function specPage(g) {
  const r = g.rec; if (!r || g.page <= r.pages.length) return;
  g.rec = { f0: r.f0, pages: r.pages.concat([pageFrom(g, r.mark, r.off0)]), mark: g.trail.length, off0: offOf(g.tally) }; specUpdate(g);
}
function specRec(g, live) {
  const r = g.rec; if (!r) return null; let pages = r.pages;
  if (live !== false && g.page > pages.length && g.trail.length > r.mark) pages = pages.concat([pageFrom(g, r.mark, r.off0)]);
  return { f0: r.f0, pages };
}
function specEvent(d, pages) {
  const circs = p => p.circ.filter(c => !c.bank), key = d.key;
  const sum = f => pages.reduce((t, p) => t + f(p), 0), most = f => pages.reduce((t, p) => Math.max(t, f(p)), 0);
  if (key === 'opener') return most(p => (p.circ.length ? p.circ[0].set : 0));
  if (key === 'closer') return most(p => (p.circ.length >= 3 ? p.circ[2].set : 0));
  if (key === 'kinds_in_turn') return most(p => new Set(p.chain).size);
  if (key === 'all_three_feed') return sum(p => (p.circ.length === 3 && p.circ.every(c => c.set >= 1) ? 1 : 0));
  if (key === 'no_dead') return sum(p => (p.circ.length === 3 && circs(p).length === 3 && circs(p).every(c => c.places > 0) ? 1 : 0));
  if (key === 'distinct_triggers') return new Set([].concat(...pages.map(p => circs(p).filter(c => c.set > 0).map(c => c.id)))).size;
  if (key.slice(0, 5) === 'kind:') return sum(p => p.chain.filter(x => x === key.slice(5)).length);
  if (key === 'off:all') return sum(p => p.total);
  if (key.slice(0, 4) === 'off:') return sum(p => p.off[key.slice(4)] || 0);
  if (key === 'jars') return SPEC_JARS.filter(j => pages.some(p => p.off[j] > 0)).length;
  if (key === 'puff') return most(p => p.total);
  if (key === 'acted') return sum(p => circs(p).filter(c => c.places > 0).length);
  if (key === 'acted_kinds') return new Set([].concat(...pages.map(p => circs(p).filter(c => c.places > 0).map(c => c.id)))).size;
  throw new Error('spec: no event reader ' + key);
}
// the value of one spec (a row of SPEC_TABLE) over a record { f0, pages }
function specRead(d, rec) {
  const pages = d.by ? rec.pages.slice(0, d.by) : rec.pages;
  if (d.read === 'e') return specEvent(d, pages);
  if (!pages.length) return 0;
  const k = d.read === 'g' ? 'g:' + d.key : d.key, f0 = rec.f0.get(k), vals = pages.map(p => p.F.get(k)), mx = Math.max(...vals), mn = Math.min(...vals);
  switch (d.mode) {
    case 'gain': return Math.max(0, mx - f0);
    case 'loss': return Math.max(0, f0 - mn);
    case 'abs': return mx;
    case 'last': return vals[vals.length - 1];
    case 'range': return Math.max(mx, f0) - Math.min(mn, f0);
  }
  throw new Error('spec: no reading ' + d.mode);
}
// the values of the parts of the round's spec. live (default): the page in play counts as it stands
function specParts(g, live) { const rec = specRec(g, live), D = g.specDef; if (!rec || !D) return []; return D.parts.map(p => { const v = specRead(SPEC_TABLE[p.name], rec); return { name: p.name, n: p.n, mark: p.mark, value: v, met: v >= p.n }; }); }
const specValue = (g, live) => { const p = specParts(g, live); return p.length ? p[0].value : 0; };
const specMet = (g, live) => { const p = specParts(g, live); return p.length > 0 && p.every(q => q.met); };
function specUpdate(g) {
  const D = g.specDef; if (!D) { g.spec = null; return; }
  const ps = specParts(g, false), a = ps[0] || D.parts[0];
  g.spec = { kind: a.mark, n: a.n, mark: a.mark, name: a.name, text: D.text, value: a.value || 0, met: ps.length > 0 && ps.every(q => q.met), parts: ps.length ? ps : D.parts.map(p => ({ name: p.name, n: p.n, mark: p.mark, value: 0, met: false })) };
}
// the round is won when the spec is met; with no spec on, when the yield passes the number to beat
const roundWon = (g, run) => (g.specDef ? specMet(g) : g.total >= ((run && run.quota) || g.quota || 0));
// ---------- aiming: how a player plays for the spec first and yield second ----------
// progress toward the spec after a line: each part counts min(value, n) / n (hurdles.py AimPlayer)
function specProg(g) { let t = 0; specParts(g, true).forEach(p => { t += Math.min(p.value, p.n) / p.n; }); return Math.round(t * 1e9) / 1e9; }
function specLines(g) {
  const L = stepsOf(g) - g.pageSteps; if (L <= 0) return [];
  const last = g.page >= pagesOf(g), fin = last ? finishOpt(g) : null; let ids = g.kinds.filter(id => usesLeft(g, id) > 0); if (fin) ids = ids.concat(['#finish']);
  const lines = [], rec = cur => { if (cur.length === L) { lines.push(cur); return; } for (const id of ids) { if (id === '#finish' ? cur.includes(id) : !(g.free && g.free[id]) && cur.filter(x => x === id).length >= (g.left[id] || 0)) continue; rec(cur.concat(id)); } };
  rec([]); return lines;
}
function specTry(g, line) {
  const s = snap(g); g.queue = []; line.forEach(id => queueAdd(g, id === '#finish' ? SYN.finish : id)); while (g.queue.length && !g.over) queueStep(g);
  const v = { prog: specProg(g), made: made(g) }; back(g, s); return v;
}
// The line this page would be given by a player who aims at the spec. look: how many lines it considers, picked at random from
// the lines the hand allows (null: all of them). Spec progress first, yield to break a tie.
function specLine(g, rnd, look) {
  const R = rnd || rand; let lines = specLines(g); if (!lines.length) return [];
  if (look && lines.length > look) { lines = lines.slice(); for (let i = lines.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)), t = lines[i]; lines[i] = lines[j]; lines[j] = t; } lines = lines.slice(0, look); }
  let best = null, ties = 0;
  lines.forEach(l => { const v = specTry(g, l); if (!best || v.prog > best.v.prog || (v.prog === best.v.prog && v.made > best.v.made)) { best = { l, v }; ties = 1; } else if (v.prog === best.v.prog && v.made === best.v.made && R() < 1 / ++ties) best = { l, v }; });
  return best.l;
}
// plays a round on a molecule with an aiming player and says whether the spec was met: the proof that it can be reached
function specPlay(run, model, parts, rnd, look) {
  const R = rnd || rand, r2 = Object.assign({}, run, { manual: false, spec: { parts, text: '' } }), g = synBegin(RX.cloneModel(model), false, R, r2.gear || [], r2);
  while (!g.over) {
    const line = specLine(g, R, look); line.forEach(id => queueAdd(g, id === '#finish' ? SYN.finish : id)); while (g.queue.length && !g.over) queueStep(g); g.queue = [];
    if (g.over) break; if (g.page >= pagesOf(g)) { synEnd(g); break; } turn(g, R);
  }
  return specMet(g, false);
}
// ---------- the generator ----------
const sfN = (sf, target) => { let n = 0; for (let k = 1; k < sf.length; k++) { if (sf[k] >= target) n = k; else break; } return n; };
function specNeed(d, carried) {
  if (!d.need) return true;
  return d.need.some(x => x === 'never' ? false : x === 'mode:co2' ? !!RX.MODE.co2 : x.slice(0, 6) === 'selfs:' ? carried.filter(c => SELF.some(q => q.id === c)).length >= +x.slice(6) : carried.includes(x));
}
const specClash = (a, b) => SPEC_TABLE[a].fam === SPEC_TABLE[b].fam || SPEC_CLASH.some(c => (c[0] === a && c[1] === b) || (c[0] === b && c[1] === a));
// molecule: a model or a SMILES. carried: the reagent ids and reflex ids the run holds. hist: the families of the earlier rounds of this
// run (a list of lists). run: the run, for the proof (aiming plays). Returns { kind, n, mark, name, text, family, parts, fell, tries, proof }.
// Table mode: N is the largest N whose share of aiming players is at least the round's target (SPEC_TARGET, from the table), and
// from round 6 two specs of different families, each at the square root of the target. A spec is offered only when an aiming
// player reached it in SPEC_REACH plays on this molecule (a bounded search: plays, not the full beam of hurdle_gen.py).
const SPEC_REACH = { plays: 3, look: 30 };
function specPick(molecule, round, carried, rnd, tier, hist, run) {
  const R = rnd || rand, model = molecule && molecule.atoms ? RX.cloneModel(molecule) : RX.fromSmiles(molecule); RX.reopen(model);
  carried = carried || []; hist = hist || []; const last = hist.length ? hist[hist.length - 1] : [], recent = {}; hist.slice(-4).forEach(f => f.forEach(x => { recent[x] = (recent[x] || 0) + 1; }));
  const target = Math.max(0.05, Math.min(0.99, SPEC_TARGET[Math.max(1, Math.min(9, round))] + (run && run.tierNo === 1 ? (RULE.specEase || 0) : 0))), pair = round >= 6, t1 = pair ? Math.min(0.97, Math.sqrt(target) * 1.04) : target;
  const open = name => { const d = SPEC_TABLE[name]; return d.good.includes(round) && (SPEC_FAMILY_TIER[d.fam] == null ? 3 : SPEC_FAMILY_TIER[d.fam]) <= (tier == null ? 3 : tier) && specNeed(d, carried); };
  const order = list => list.map(n => [n, R() * (1 + 2 * (recent[SPEC_TABLE[n].fam] || 0))]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
  const nOf = (name, tg) => sfN(SPEC_TABLE[name].sf[round] || [], tg);
  const reach = parts => { if (!run) return 1; for (let k = 0; k < SPEC_REACH.plays; k++) if (specPlay(run, model, parts, R, SPEC_REACH.look)) return k + 1; return 0; };
  const mk = (name, n) => ({ name, n, mark: SPEC_TABLE[name].mark, text: SPEC_TABLE[name].text.replace('{N}', n), family: SPEC_TABLE[name].fam });
  const names = Object.keys(SPEC_TABLE).filter(open); let tries = 0, got = null;
  for (const a of order(names.filter(n => !last.includes(SPEC_TABLE[n].fam))).slice(0, 10)) {
    const na = nOf(a, t1); tries++; if (na < 1) continue;
    if (!pair) { const proof = reach([mk(a, na)]); if (proof) { got = { parts: [mk(a, na)], proof }; break; } continue; }
    for (const b of order(names.filter(n => !specClash(a, n) && !last.includes(SPEC_TABLE[n].fam))).slice(0, 6)) { const nb = nOf(b, t1); tries++; if (nb < 1) continue; const ps = [mk(a, na), mk(b, nb)], proof = reach(ps); if (proof) { got = { parts: ps, proof }; break; } }
    if (got) break;
  }
  let fell = false;
  if (!got) { fell = true; for (const nm of ['off_total', 'growth', 'branch'].filter(x => SPEC_TABLE[x] && !last.includes(SPEC_TABLE[x].fam)).concat(['off_total', 'growth', 'branch'])) { if (!SPEC_TABLE[nm]) continue; const n = Math.max(1, nOf(nm, target)); got = { parts: [mk(nm, n)], proof: 0 }; if (reach(got.parts)) break; } if (!got) got = { parts: [mk('off_total' in SPEC_TABLE ? 'off_total' : Object.keys(SPEC_TABLE)[0], 1)], proof: 0 }; }
  const a = got.parts[0];
  return { kind: a.mark, n: a.n, mark: a.mark, name: a.name, text: got.parts.map(p => p.text).join(' and '), family: a.family, families: got.parts.map(p => p.family), parts: got.parts, fell, tries, proof: got.proof };
}
// The end of a round (the page and the rig call this once). The round is won by the spec (roundWon); yield is separate: it pays
// gold at the four marks (runEarn) whenever it passes the number to beat, and letters the words, spec met or not. A won round
// counts toward the run; a lost round ends it (run.over). Returns what the end screen needs.
const WORDS = ['stable', 'unstable', 'volatile', 'overreact'];
function roundEnd(g, run) {
  if (run.endedRound === (run.round || 1) && run.endedFor === g) return run.endedRes;
  const won = roundWon(g, run), ypass = g.total >= run.quota, extra = run.payCoins || 0, earn = runEarn(run, g.total, run.quota), marks = marksHit(g.total, run.quota);
  // a round won by the spec with a low yield still pays what the harder molecule promised
  if (won && !ypass && RULE.coins && extra) { run.coins = (run.coins || 0) + extra; earn.extra = extra; }
  if (!run.log) run.log = [];
  const word = ypass ? WORDS[Math.min(WORDS.length - 1, marks)] : null;
  run.log.push({ round: run.round || 1, won, ypass, word, total: g.total, quota: run.quota, marks, gold: earn.marks + earn.interest + (earn.extra || 0), spec: g.spec ? { name: g.spec.name, n: g.spec.n, value: specValue(g, false), parts: specParts(g, false) } : null });
  if (won && !run.over) run.beaten = (run.beaten || 0) + 1; if (!won) run.over = true;
  const res = { won, ypass, word, marks, earn, spec: g.spec, runWon: runWon(run), last: (run.round || 1) >= runLast(run), run: run.len };
  run.endedRound = run.round || 1; run.endedFor = g; run.endedRes = res; return res;
}
// What a run earned, won or lost, for the end screen: rounds cleared, gold, the word reached in each round, credit, and the
// length it opens. Findings are not built: the counters they will read are in by.
function runResult(run) {
  const won = runWon(run), log = run.log || [];
  return { len: run.len, rounds: runLast(run), cleared: run.beaten || 0, won, lostAt: won ? null : Math.min(runLast(run), (run.beaten || 0) + 1), gold: log.reduce((t, r) => t + r.gold, 0), coins: run.coins || 0, words: log.map(r => r.word), credit: (run.beaten || 0) + (run.bonus || 0), opens: won && run.tierNo < 3 ? lengthOf(run.tierNo + 1).name : null, by: Object.assign({}, run.by), log };
}
// the highest length opened after a run: a won run opens the next
const reachAfter = (reach, run) => Math.max(Math.max(1, Math.min(3, reach | 0)), runWon(run) ? Math.min(3, (run.tierNo || 3) + 1) : 1);
AA.rxPath = { LENGTHS, lengthOf, roundEnd, runResult, reachAfter, SPEC_TABLE, SPEC_TARGET, SPEC_REACH, specNumbers, specValue, specMet, specParts, specPick, specLine, specPlay, specRec, specRead, roundWon, spec: { table: SPEC_TABLE, target: SPEC_TARGET, reach: SPEC_REACH, readers: SX, numbers: specNumbers, value: specValue, met: specMet, parts: specParts, pick: specPick, line: specLine, play: specPlay, roundWon }, swapQueue, usesFreeOn, modeSync, SINK, useCost, canBuyUse, buyUse, TIERS, tierRule, runLast, runWon, bareRun, usesBind, LASTX, FILTER, feedShape, queueSwap, queueMove, fitsNow, queueFits, FEEDSIZE, CHOOSE, easeOf, pairCost, runRedraw, JAR, HOMS, HOMSIM, homOn, homEvent, homFed, homLit, frozenPay, homReady, homSpots, homTry, homUse, homGo, runBank, FIVE, FIFTH, fifthSet, TOOLUSES, canTool, toolSpots, toolUse, toolGo, toolTry, toolWorth, toolBest, startDue, startRun, again, cascMode, afterTurn, dealtIn, RULE, CASC, SELF0, selfRun, screenStep, screenLines, screen, screenRound, FEED, feedSize, sizeFor, feedsFor, reopenAll, cascadeNext, cascadeDue, cascade, snap, back, BANKID, queued, usesLeft, queueRoom, queueAdd, queueDrop, queueHead, queueShift, queueStep, queueView, waste, heavy, usesOf, handOf, chainOpts, canBank, bankGain, bank, canRedraw, redrawCost, redraw, seed, rand, MODEL, ASSAYS, runAssays, assayOf, TERMS, CIRCLE, runTerm, deeds, wish, douse, SELFMODE, selfOptions, SELF, KIN, kinOf, kinsOf, charged, fire, chainNext, byKind, CATCH, BY, RARITY, TIER, rarityOf, FAMILIES, FOUND, peek, PAIR, ISO, salt, runKeep, BRIEFS, BRIEF, runBriefs, runChoose, runPay, modelOf, briefBase, PAR, MOLF, MOLD, KINDF, ASSAYF, kindSize, parOf, quotaParts, runMarks, marksHit, COIN, rerollCost, interestOf, runEarn, runReroll, runSkip, runBin, pagesOf, stepsOf, SUPPLY, stock, RUNG, runNew, runBegin, runQuota, runPicks, runTake, pickText, DIAL, FEEDS, GEAR, GEARS, OFFER: 4, begin, options, take, deliver, survey, deal, keeps, safe, kit,
  SYN, RARE, STYLES, kitRound, synRack, synBegin, synTake, synFinish, synEnd, synQuota, synPlay, held, made, mult, breaks, turn, finishOpt };
})(typeof globalThis !== 'undefined' ? globalThis : window);
