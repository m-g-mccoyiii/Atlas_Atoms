// Overreact: the margin notes (rulings AI, AM, AM2, AM3, AM4, AM5, AM6; the story is docs/STORY.md; how to write more is docs/NOTES_WRITING.md).
// A working chemist's notes to himself about what has just happened on the page: this molecule, the reagent just fired, the reflexes and
// their order, the yield against the spec, what came off, the creature, the instrument, the gold. No scenery, no mood. Notes carry slots
// ({reagent}, {n}, {yield} ...) that the page fills from the game.
// A thread runs through them (a second ink, then "he", then the King in Yellow). It arrives through play as well: a result that is not
// possible given what was fired, reported as flatly as a yield. It is peppered in from the first runs, from six sources.
// Each lap of the sign a new tenant has the bench and the same notebook, and the earlier tenants' hands turn up in the margins.
//   AA.NOTES             every note: { t, band, src, sign, unlocks, depth, hand, when, slots, cond, thread, rung, till, round, count, by, big, fb }
//   AA.notesPick(state)  the notes that fit a state { depth, unlocks, round, tag, homs, used, ctx, sign, counts, since, seen, seed }
//   AA.notesFill(note, ctx)  the note's text with its slots filled from ctx
//   AA.notesDepth(unlocks, round, rounds, chain)  the old scale 0..1 (career 0.65, run 0.30, chain 0.05); kept for the page, no note is ranged on it now
//   AA.notesReach(state) how far up the reveal ladder this player may read, 1..5
//   AA.notesRate(state)  the thread budget: { rate, gap, p, c }
//   AA.notesParse(t)     splits ~struck~ and _under_ marks into pieces for the pen
// What makes a note eligible is in its own data:
//   when    the event it is about (a tag): start fire reflex ring left page mark win loss overreact chain waste shop buy unlock instrument sigil gold spec catalog
//           el:N el:S el:Cl   hom:<key> (a creature is owned: thread lines only)   tap:<key> (that creature has just acted)
//           keys: water h2 co2 acid wood salt slime seedling ammonia brimstone
//           (no tag: a note about the molecule and the page as they stand)
//   slots   the names in {braces} in its text; the note is only offered when state.ctx has every one. {n+1} and {n-1} are sums done here.
//   cond    { slot: [min, max] } the number in that slot must lie in the range
//   src     'lab' (plain) or, for a thread line: 'run' (rounds 7 to 9 of any run), 'event' (its tag), 'hom' (a creature owned),
//           'count' (a lifetime count), 'career' (the ladder, by unlocks or runs played), 'sign' (laps of the sign)
//   rung    the ladder: 1 an impossible result, nobody named; 2 a second ink; 3 he and his face; 4 the King; 5 the King in Yellow
//   till    the last rung at which the line is still shown
//   sign    [min, max] laps of the sign taken (meta.sign, 0 to 3): which tenant is writing
//   count   [key, from, to] a lifetime count (meta.counters added to meta.countersAll) inside that window
//   by      'tenant0' | 'tenant1' | 'tenant2': written in the margin by an earlier tenant (laps 1 to 3). The page should draw each in its own hand.
//   fb      a rule of the bench with no slots: only offered when nothing about the present page fits (as when the page passes no ctx)
//   again   its text changes with the reagent or the reflex named, so it may be shown more than once a run (not within four notes)
//   wait    it uses a slot the rules side has to work out and the page cannot pass yet; held back until it is passed
// Sources: R. W. Chambers, The King in Yellow (1895) and Ambrose Bierce only. Nothing later. See the rights rule in NOTES_WRITING.md.
// Every row below is one line and is valid JSON, so the check script can read it without running the file.
(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
const NOTES = [];
// Slots the page cannot fill today: the rules side has to work them out (NOTES_WRITING.md, "What the page must pass"). A note that
// uses one is marked wait: true and is held back until the page passes it.
const RULES_SLOTS = ['gap', 'roundbest', 'runbest', 'careerbest', 'molseen', 'molbest', 'loose'];
// What the notes know about the bench themselves (docs/tools_chem/FINAL.md), so the page only has to pass a name.
// From the reagent just fired: {does} what it left, {all} what it did at every place. From a reagent that found nothing: {dudneeds} what it needs. Nothing here says what to do next.
const REAGENT = {
  hydrate: { all: 'every C=C took an OH and an H', needs: 'a C=C', does: 'an OH on the carbon with fewer hydrogens' },
  hydroborate: { all: 'every C=C took an OH on the carbon with more hydrogens', needs: 'a C=C', does: 'an OH on the carbon with more hydrogens' },
  dehydrate: { all: 'every OH it could take left as water', needs: 'an OH with no other oxygen on its carbon or the next', does: 'a C=C where the OH was, and water off' },
  oxidize: { all: 'every OH on a carbon with a hydrogen became C=O', needs: 'an OH on a carbon that still has a hydrogen, or a C=C at a chain end', does: 'a C=O where the OH was, and hydrogen off' },
  reduce: { all: 'every chain-end C=O became CH2-OH', needs: 'a C=O at the end of a chain', does: 'a CH2-OH where the end C=O was' },
  grow: { all: 'every C=O became an OH with a three-carbon arm', needs: 'a C=O', does: 'an OH and a three-carbon arm ending in C=C' },
  thiolene: { all: 'every C=C took an SH', needs: 'a C=C', does: 'an SH on the carbon with more hydrogens' },
  ritter: { all: 'every C=C took an NH2', needs: 'a C=C', does: 'an NH2 on the carbon with fewer hydrogens' },
  hwe: { all: 'every aldehyde and methyl ketone became a C=C beside a new ketone', needs: 'an aldehyde or a methyl ketone not already beside a C=C', does: 'a C=C beside a new ketone' },
  dihydroxylation: { all: 'every C=C became two OH', needs: 'a C=C', does: 'an OH on each carbon of the C=C' },
  ozonolysis: { all: 'every C=C was cut into two C=O', needs: 'a C=C with carbon on both sides', does: 'a C=O at each cut carbon' },
  permanganate: { all: 'every chain end it could take became COOH', needs: 'a chain-end C=C, an aldehyde or a chain-end CH2-OH', does: 'a COOH at the chain end' },
  chlorination: { all: 'every OH it could take became Cl', needs: 'an OH that is not on a ring and not on a carbon with three carbons', does: 'a Cl where the OH was, and acid fumes off' },
  cyanohydrin: { all: 'every aldehyde and methyl ketone became an OH and a COOH', needs: 'an aldehyde or a methyl ketone', does: 'an OH and a COOH on one carbon' },
  hofmann: { all: 'every NH2 left and a C=C formed', needs: 'an NH2 on a carbon with no double bond', does: 'a C=C where the NH2 was' },
  chugaev: { all: 'every OH it could take left and a C=C formed', needs: 'an OH with no other oxygen on its carbon or the next', does: 'a C=C toward the neighbour with more hydrogens, and sulfur off' },
  hydroformylation: { all: 'every C=C took a CHO', needs: 'a C=C', does: 'a CHO on the carbon with more hydrogens' },
  epoxidation: { all: 'every C=C became an epoxide', needs: 'a C=C', does: 'an epoxide where the C=C was' }
};
const ALIAS = { pcc: 'oxidize', allyl: 'grow', bh3: 'hydroborate', nabh4: 'reduce', 'thiol-ene': 'thiolene', 'the sulfur reagent': 'thiolene', 'the nitrogen reagent': 'ritter', lactol: 'ring', enone: 'dry', taut: 'flip', snap6: 'snap', ether: 'close' };
// From the reflex just fired: {why} it fired, {what} happened in it, {after} what it leaves.
const KIND = {
  ring: { what: 'the OH oxygen joined the C=O carbon', why: 'an OH was three or four carbons from a C=O', after: 'a loose ring that opens again at the page turn' },
  dry: { what: 'the OH left as water and a C=C formed beside the C=O', why: 'an OH was two carbons from a C=O', after: 'a C=C beside the C=O' },
  weld: { what: 'the carbon beside one C=O joined the other C=O carbon', why: 'two C=O were four or five carbons apart', after: 'a ring that stays shut, and a new OH' },
  shift: { what: 'the C=C slid one carbon toward the C=O', why: 'a C=C was two carbons from a C=O', after: 'a C=C beside the C=O' },
  tuck: { what: 'the OH oxygen joined the far carbon of the C=C', why: 'a C=C sat beside a C=O with an OH three or four carbons past it', after: 'a ring ether that stays shut' },
  flip: { what: 'the C=C went single and its carbon became C=O', why: 'an OH sat on a carbon of a C=C', after: 'a new C=O' },
  snap: { what: 'three C=C closed into a six-ring with one C=C left', why: 'two C=C lay side by side with a third near', after: 'a six-ring that stays shut' },
  knit: { what: 'the nitrogen joined the C=O carbon', why: 'an NH2 was three or four carbons from a C=O', after: 'a loose ring that opens again at the page turn' },
  cap: { what: 'the sulfur joined the C=O carbon', why: 'an SH was three or four carbons from a C=O', after: 'a loose ring that opens again at the page turn' },
  close: { what: 'the Cl left and the other group joined its carbon', why: 'a Cl was three to five carbons from an OH, NH2 or SH', after: 'a ring that stays shut, and acid fumes off' },
  open: { what: 'the OH oxygen joined the nearer epoxide carbon', why: 'an epoxide and an OH were three or four carbons apart', after: 'a ring ether and a new OH' },
  fold: { what: 'the epoxide became a C=O', why: 'an epoxide had a carbon on both ends', after: 'a new C=O' },
  seal: { what: 'the acid OH left and the other group joined the acid carbon', why: 'a COOH was three or four carbons from an OH, NH2 or SH', after: 'a ring that stays shut, and water off' }
};
// From what came off: {leftfrom} what gives it off.
const LEFT = { water: 'a dehydrate or a dry step', hydrogen: 'an oxidize', 'carbon dioxide': 'oxidize cutting a chain-end C=C', 'acid fumes': 'a close', ammonia: 'the cyanohydrin route', sulfur: 'a Chugaev' };
const low = v => { const k = String(v == null ? '' : v).toLowerCase(); return ALIAS[k] || k; };
function derive(ctx) {
  const c = Object.assign({}, ctx || {}), r = REAGENT[low(c.reagent)], d = REAGENT[low(c.dud)], k = KIND[low(c.kind)], l = LEFT[low(c.left)];
  if (r) { c.does = r.does; c.all = r.all; } if (d) c.dudneeds = d.needs; if (k) { c.why = k.why; c.after = k.after; c.what = k.what; } if (l) c.leftfrom = l;
  return c;
}
function push(r, base) {
  const o = r[2] || {}, n = Object.assign({ t: r[0] }, base), seen = {};
  if (o.u) n.unlocks = o.u; if (o.hand) n.hand = o.hand; if (o.s) n.sign = o.s;
  if (r[1]) n.when = r[1];
  if (o.big) n.big = true; if (o.round) n.round = o.round; if (o.till) n.till = o.till; if (o.count) n.count = o.count; if (o.by) n.by = o.by; if (o.c) n.cond = o.c; if (o.fb) n.fb = true; if (o.again) n.again = true;
  n.slots = []; n.t.replace(/\{([a-z0-9]+)(?:[+-]\d+)?\}/g, (m, k) => { if (!seen[k]) { seen[k] = 1; n.slots.push(k); } return m; });
  if (n.cond) Object.keys(n.cond).forEach(k => { if (n.slots.indexOf(k) < 0) n.slots.push(k); });   // a condition needs its slot too
  if (n.slots.some(k => RULES_SLOTS.indexOf(k) >= 0)) n.wait = true;
  NOTES.push(n);
}
// plain notes: the laps they belong to, a hand, rows of [text, when, overrides]
function lab(sign, hand, rows) { rows.forEach(r => push(r, { band: 1, src: 'lab', depth: [0, 1], unlocks: [0, 1], sign, hand })); }
// thread lines: a source, a rung of the ladder, a hand, rows of [text, when, overrides]. Rungs 2 to 4 belong to the first tenant (sign 0)
// unless a row says otherwise; rung 1 is read by every tenant.
function thr(src, rung, hand, rows) {
  rows.forEach(r => push(r, { band: rung + 1, src, thread: true, rung, till: 5, depth: [0, 1], unlocks: [0, 1], sign: rung === 1 ? [0, 3] : [0, 0], hand }));
}

// ================= PLAIN NOTES (band 1). No thread. =================
// Each explains what has just happened and why, or states a record. None gives the answer: no best order, no plan for the next
// page, no near miss, nothing about what a creature needs before it has acted. New players work the game out themselves.
// Every rule stated here is in docs/tools_chem/FINAL.md, docs/HOMUNCULI.md or path.js (RULE, CASC, HOM2LIT).

// ---- how the bench keeps score, no slots: only when nothing about the present page fits ----
lab([0, 3], 'neat', [
  ["A reagent acts at every place on the molecule that fits it.", null, {"fb": true}],
  ["A reagent that finds nothing still spends its use.", null, {"fb": true}],
  ["The tenth reflex of a page pays ten times the first.", null, {"fb": true}],
  ["Chain steps up to the round's longest earlier chain pay a quarter; steps past it pay in full.", null, {"fb": true}],
  ["Gold is paid for each mark passed, and only when the spec is met.", null, {"fb": true}],
  ["Some rings open again when the page turns and some stay shut.", null, {"fb": true}]
]);

// ---- the molecule and the page as they stand (no tag): the first chemist ----
lab([0, 0], 'neat', [
  ["{loose} loose rings on the molecule; they open when the page turns.", null, {"c": {"loose": [2, 99]}}],
  ["The loose ring opens again when the page turns.", null, {"c": {"loose": [1, 1]}}],
  ["Longest chain on an earlier page this round was {roundbest}; steps up to that pay a quarter now.", null, {"c": {"roundbest": [1, 999]}}],
  ["Longest chain this run {runbest}; longest in the notebook {careerbest}."],
  ["This molecule was dealt {molseen} times before; best yield with it {molbest}.", null, {"c": {"molseen": [2, 999]}}],
  ["The molecule is at {atoms} atoms, not counting hydrogen; nothing grows past 56.", null, {"c": {"atoms": [45, 56]}}],
  ["{dud} found nothing on the last page: it needs {dudneeds}.", null, {"again": true}],
  ["{left} came off the last page, from {leftfrom}.", null, {"again": true}],
  ["The last reflex was a {kind}: {why}.", null, {"again": true}],
  ["The last reagent fired was {reagent}; it left {does}.", null, {"again": true}]
]);

// ---- what has just happened ----
lab([0, 3], 'neat', [
  ["New round: each reagent has its uses back.", "start"],
  ["This molecule came up {molseen} times before; best yield with it {molbest}.", "start", {"c": {"molseen": [2, 999]}}],

  ["{reagent} left {does}.", "fire", {"again": true}],
  ["{reagent} set off {n} reflexes by itself.", "fire", {"c": {"n": [2, 999]}}],
  ["With {reagent}, {all}.", "fire", {"again": true}],
  ["{reagent} landed at {places} places at once: {all}.", "fire", {"again": true, "c": {"places": [2, 99]}}],

  ["A {kind} fired: {why}.", "reflex", {"again": true}],
  ["The {kind} leaves {after}.", "reflex", {"again": true}],
  ["In the {kind}, {what}.", "reflex", {"again": true}],

  ["The ring closed because the two groups were {gap} carbons apart.", "ring"],
  ["{loose} loose rings standing; they open at the page turn.", "ring", {"c": {"loose": [2, 99]}}],
  ["A ring or a weld leaves a new OH on the old C=O carbon.", "ring"],

  ["{left} came off; it comes from {leftfrom}.", "left", {"again": true}],

  ["Page {page} ran {n} reflexes against {roundbest} earlier; only the steps past that paid in full.", "page", {"c": {"roundbest": [1, 999]}}],
  ["{dud} found nothing: it needs {dudneeds}.", "page", {"again": true}],
  ["Page {page} set off no reflex: no two groups stood at a distance that reacts.", "page", {"c": {"n": [0, 0]}}],
  ["No reflex on page {page}; the three reagents alone made {pageyield}.", "page", {"c": {"n": [0, 0]}}],

  ["Mark {mark} is worth gold if the round is met.", "mark"],

  ["Spec met; anything past it counts toward the marks at two, four and eight times.", "win"],
  ["Met with {n} reflexes on the last page; the round's longest before was {roundbest}.", "win", {"c": {"n": [2, 999], "roundbest": [1, 999]}}],
  ["Round met with a longest chain of {roundbest}; the run's longest is {runbest}.", "win", {"c": {"roundbest": [1, 999]}}],

  ["Under spec; most of a round's yield comes from the chain, not the three reagents.", "loss"],
  ["Under by {short}; {dud} was wasted, and it needs {dudneeds}.", "loss"],
  ["Under by {short}; the longest chain of the round was {roundbest}.", "loss", {"c": {"roundbest": [1, 999]}}],

  ["An overreact is the yield passing eight times the spec.", "overreact"],
  ["Overreact with a chain of {n}; the notebook's longest chain is {careerbest}.", "overreact", {"c": {"n": [2, 999]}}],

  ["A chain is each reflex leaving what the next one needs.", "chain"],
  ["Chain of {n}; the notebook's longest is {careerbest}.", "chain", {"c": {"n": [2, 999]}}],
  ["Step {n} paid {n} times step one.", "chain", {"c": {"n": [2, 999]}}],
  ["The chain stopped when no two groups were left at a distance that reacts.", "chain"],

  ["That reagent found nothing and its use is spent.", "waste"],
  ["{dud} acted nowhere; it wants {dudneeds}.", "waste", {"again": true}],

  ["Gold kept in the tin earns interest each round the spec is met.", "shop"],
  ["Gold spent is gold that earns no interest next round.", "buy"],
  ["A finding opens the next thing on its shelf.", "unlock"],
  ["Each sigil breaks one rule for the round.", "sigil"],
  ["{sigil} is on for round {round}; a line that worked before may not hold.", "sigil"],
  ["Gold is paid for the marks passed and as interest on what was kept.", "gold"],
  ["{gained} gold: for the marks passed, and interest on the tin.", "gold"],
  ["A compound in the catalog stays there when everything else on the shelf goes.", "catalog"]
]);

// ---- the creatures: only after one has acted (the tag tap:<key>), what lit it and what it did ----
lab([0, 3], 'neat', [
  ["Water lit: that page gave off four waters.", "tap:water"],
  ["Water's flood turned every C=C to C-OH and ran the rings again.", "tap:water"],
  ["The waters came from the dehydrate and dry steps.", "tap:water"],
  ["Water paid one and a half times the page's yield.", "tap:water"],
  ["Hydrogen lit: oxidize was last, it landed, and the page ran three reflexes.", "tap:h2"],
  ["Hydrogen carried the chain's count to the next page.", "tap:h2"],
  ["With Hydrogen, if the next page's chain is shorter than the one carried, the yield drops.", "tap:h2"],
  ["Dry ice lit: carbon dioxide came off this round and three reagents never acted.", "tap:co2"],
  ["The carbon dioxide came from oxidize cutting a chain-end C=C.", "tap:co2"],
  ["Acid lit: the page ended the molecule two atoms smaller.", "tap:acid"],
  ["One water off is one atom gone, hydrogens not counted.", "tap:acid"],
  ["Acid doubled the page's yield.", "tap:acid"],
  ["Wood spirit lit: the first reagent lined up found nothing.", "tap:wood"],
  ["Wood spirit poured every dealt reagent not lined up, in the order dealt, at no use.", "tap:wood"],
  ["One of Wood spirit's pours landed, and the yield went up a quarter.", "tap:wood"],
  ["Salt lit: the line was the page before's, reagent for reagent.", "tap:salt"],
  ["Salt gave the three uses back.", "tap:salt"],
  ["Salt paid two and a half times the page's yield.", "tap:salt"],
  ["The repeated line found fewer places, since the first pass changed them.", "tap:salt"],
  ["Slime lit: two of the page's reagents each set off a reflex of their own.", "tap:slime"],
  ["The reagents that lit Slime are shut for the next page.", "tap:slime"],
  ["Slime pays more when three reagents each set off a reflex than when two do.", "tap:slime"],
  ["Seedling lit: the page ended the molecule eight atoms bigger, hydrogens not counted.", "tap:seedling"],
  ["Seedling pays more each page in a row it is tapped.", "tap:seedling"],
  ["Seedling, once tapped, cuts the yield on a page that grows less.", "tap:seedling"],
  ["Ammonia lit: nitrogen went on the molecule this page.", "tap:ammonia"],
  ["Ammonia fired the page's three again in the same order, no use spent.", "tap:ammonia"],
  ["Brimstone lit: sulfur went on the molecule this page.", "tap:brimstone"],
  ["Brimstone ended the round there; the pages left were not played.", "tap:brimstone"],
  ["Brimstone counted the spec as met.", "tap:brimstone"],
  ["Brimstone pays more after page one than after page two.", "tap:brimstone"]
]);

// ---- the later tenants' own plain notes: the second writes whole sentences, the third abbreviates, the fourth dates everything ----
lab([1, 1], 'neat', [
  ["The longest chain earlier this round was {roundbest}, and steps up to it pay a quarter.", null, {"c": {"roundbest": [1, 999]}}],
  ["There are {loose} loose rings, which will open when the page turns.", null, {"c": {"loose": [2, 99]}}],
  ["{dud} found nothing because it needs {dudneeds}.", null, {"again": true}],
  ["The longest chain in this notebook is {careerbest}, and in this run {runbest}."],
  ["With {reagent}, the result was that {all}.", null, {"again": true}],
  ["At the {kind}, {what}.", null, {"again": true}],
  ["The last reflex was a {kind}, because {why}.", null, {"again": true}]
]);
lab([2, 2], 'neat', [
  ["Rd best {roundbest}; refl. up to that pay 1/4.", null, {"c": {"roundbest": [1, 999]}}],
  ["Loose rings {loose}; open at pg turn.", null, {"c": {"loose": [1, 99]}}],
  ["{dud}: needs {dudneeds}.", null, {"again": true}],
  ["Longest chain: run {runbest}, notebook {careerbest}."],
  ["{reagent}: {all}.", null, {"again": true}],
  ["{kind}: {what}.", null, {"again": true}],
  ["Last refl. {kind}: {why}.", null, {"again": true}]
]);
lab([3, 3], 'neat', [
  ["8 March. Round's longest {roundbest}; steps to there pay a quarter.", null, {"c": {"roundbest": [1, 999]}}],
  ["11 March. Loose rings {loose}, open at the turn.", null, {"c": {"loose": [1, 99]}}],
  ["13 March. Nothing for {dud}: it needs {dudneeds}.", null, {"again": true}],
  ["9 March. Longest chain, run {runbest}; notebook {careerbest}."],
  ["6 March. {reagent}: {all}.", null, {"again": true}],
  ["7 March. {kind}: {what}.", null, {"again": true}],
  ["10 March. Last reflex a {kind}: {why}.", null, {"again": true}]
]);

// ================= THE THREAD =================
// A result that is not possible given what was fired, reported as a figure. No line hints, comments or reacts.

// ---- source (a): late in any run. Rounds 7 to 9, any player, nobody named. ----
thr('run', 1, 'neat', [
  ["Two reflexes fired at once on the same atom.", null, {"round": [7, 9]}],
  ["The chain ran one step on after the molecule had nothing left to move.", null, {"round": [7, 9]}],
  ["A weld formed on a molecule with one C=O; a weld needs two.", null, {"round": [7, 9]}],
  ["One carbon is in the tally with five bonds.", null, {"round": [7, 9]}],
  ["Yield went up between pages with nothing fired.", null, {"round": [7, 9]}],
  ["A reagent fired a fourth time this round.", null, {"round": [7, 9]}],
  ["The molecule began this page a ring larger than it ended the last.", null, {"round": [7, 9]}],
  ["Water came off a molecule with no OH on it.", null, {"round": [7, 9]}],
  ["A ring opened and closed again with nothing fired.", null, {"round": [7, 9]}],
  ["A tuck closed onto a carbon that already had four bonds.", null, {"round": [7, 9]}],
  ["Round {round}: grow added four carbons at one C=O; it adds three.", null, {"round": [7, 9]}],
  ["Round {round}, page {page}: a welded ring opened at the page turn; welds stay shut.", null, {"round": [7, 9]}]
]);

// ---- source (e), first rung: any round, from the first run ----
thr('career', 1, 'neat', [
  ["One ring more on the molecule than I closed."],
  ["A use is gone from a bottle that was not dealt this page."],
  ["A fourth mark is inked on the yield track, past the overreact."],
  ["One more reflex in the tally than the line can give."],
  ["The yield was entered on the page before the last reagent fired."],
  ["A fourth reagent is entered in this page's line; three were lined up."],
  ["The product weighs more than the atoms on the page allow."],
  ["Runoff in the jar that nothing on the page gave off."],
  ["A reflex fired between pages, with nothing lined up."],
  ["The slate shows a use chalked off that I did not fire."],
  ["{rings+1} rings counted on the molecule; {rings} were closed."],
  ["Oxidize took an OH from a carbon with no hydrogen on it; it needs one."],
  ["{n+1} reflexes counted from a line that gives {n}."],
  ["The slate shows {uses} uses left on {reagent}; the bottle holds {uses+1}."],
  ["Dehydrate gave off hydrogen; it gives off water."],
  ["Tin holds {gold+1} gold against {gold} in the ledger."],
  ["Hydrate put its OH on the carbon with more hydrogens, not fewer."],
  ["Yield for page {page} was on the page before {r3} fired."]
]);

// ---- source (b): something happened. Nobody named; any player. ----
thr('event', 1, 'neat', [
  ["The overreact mark was inked before the yield reached it.", "overreact"],
  ["It overreacted on two reagents; the third was never fired and is spent.", "overreact"],
  ["Top mark at {yield}, with {yield+1} already written beside it.", "overreact"],
  ["The top mark is eight times the spec; this page passed it at six.", "overreact"],
  ["The chain's fourth step is a weld between two rings the molecule does not have.", "chain"],
  ["The chain closed a ring it had already closed.", "chain"],
  ["Chain of {n+1} in the tally; the molecule shows {n}.", "chain"],
  ["The yield stood over the spec at the last reflex and under it when the page was totalled.", "loss"],
  ["Under spec with a reagent unfired that I had lined up.", "loss"],
  ["Lost by {short}; the page shows a yield of {spec} in pencil.", "loss"],
  ["The spec was ticked as met before the last page.", "win"],
  ["Met by {over}; the entry above mine has it met by {over+1}.", "win"],
  ["The reagent acted nowhere and the molecule changed.", "waste"],
  ["{dud} acted nowhere; one atom fewer on the molecule after it.", "waste"],
  ["Dunmore's list has a seventh reagent.", "shop"],
  ["Dunmore's list has {item} at {price} and again at nothing.", "shop"],
  ["The instrument bought today is already in my ledger, at the same price.", "buy"],
  ["{item} was on the bench before it was paid for.", "buy"],
  ["The finding was already entered in the back pages.", "unlock"],
  ["{finding} is entered twice, the first before today.", "unlock"],
  ["The instrument acted on a page I did not use it on.", "instrument"],
  ["{instrument} shows a reading for a fourth page.", "instrument"],
  ["The sigil was under the molecule before I drew it.", "sigil"],
  ["The sigil broke a second rule besides its own.", "sigil"],
  ["One coin more in the tin than the round paid.", "gold"],
  ["Gold was paid for a mark the yield did not pass.", "gold"],
  ["The spec card and my copy of it differ by two.", "spec"],
  ["The spec changed between page one and page two of the round.", "spec"],
  ["The catalog entry was filled before the compound was made.", "catalog"],
  ["{compound} is in the catalog twice.", "catalog"],
  ["Page one of the round has a line entered already.", "start"],
  ["The molecule dealt for round {round} has a ring the card does not show.", "start"],
  ["A cap closed onto a C=O the molecule does not have.", "el:S"],
  ["A yellow solid came off a page where no sulfur was fired.", "el:S"],
  ["Sulfur count on the molecule is one over the formula.", "el:S"],
  ["An NH2 knitted onto a C=O six carbons away.", "el:N"],
  ["The Cl left as acid fumes with nothing three to five carbons from it.", "el:Cl"],
  ["{reagent} acted in {places+1} places on a molecule with {places}.", "fire"],
  ["The jar shows {left} at {leftn+1} from a page that gave {leftn}.", "left"],
  ["Mark {mark} was inked before the yield reached it.", "mark"],
  ["A ring closed across nine atoms.", "ring"],
  ["A {kind} fired that the molecule has no place for.", "reflex"],
  ["Page {page} is totalled at {pageyield+1}; the steps add to {pageyield}.", "page"]
]);

// ---- source (b), further up the ladder: a second ink, then he, then the King ----
thr('event', 2, 'neat', [
  ["The overreact is entered at the top of the page in a second ink, with the yield.", "overreact", {"till": 3}],
  ["The second ink has the chain's kinds in order, written before it ran.", "chain", {"till": 3}],
  ["The second ink has this round as met.", "loss", {"till": 3}],
  ["The second ink met this spec a page sooner.", "win", {"till": 3}],
  ["The second ink has a different third reagent for this page.", "waste", {"till": 3}],
  ["{item} was already in the ledger as bought.", "buy", {"till": 3}],
  ["The ledger's gold column is added up in a second ink.", "gold", {"till": 3}],
  ["The second ink has the sulfur fired first on this page.", "el:S", {"till": 3}],
  ["The round's first line is entered in a second ink.", "start", {"till": 3}],
  ["The spec is on this page twice, the second time in the second ink.", "spec", {"till": 3}]
]);
thr('event', 3, 'neat', [
  ["The overreact showed a chin and the edge of a collar in the flask.", "overreact"],
  ["Today's overreact showed a sleeve, to the elbow.", "overreact"],
  ["At the eighth reflex there was a shoulder in the flask.", "chain"],
  ["His entry for the round reads 'met' beside my 'lost'.", "loss"],
  ["Met the spec by {over}; his entry met it by {over+5}.", "win"],
  ["He did not line up {dud}; his page has no dead reagent.", "waste"],
  ["He has {item} in his column since round one.", "buy"],
  ["His gold column stands at {gold+40}.", "gold"],
  ["He writes the sulfur into the line first on every page.", "el:S"],
  ["His line for page one is entered above mine.", "start"],
  ["His spec for the round is {spec-20}.", "spec"]
]);
thr('event', 4, 'shaky', [
  ["Overreact at {yield}; the flask showed his collar for {n} reflexes.", "overreact"],
  ["The sign under the molecule gained a stroke at the overreact.", "overreact"],
  ["Chain of {n}; the flask showed the King's sleeve from the sixth reflex on.", "chain"],
  ["Lost the round; the King's column has it met at {spec+9}.", "loss"],
  ["Met the spec by {over}; entered it in the King's column as well.", "win"],
  ["Nothing reacted on the page; the King's column shows a chain of seven for it.", "waste"],
  ["Bought {item} for longer chains; the flask shows more of him past nine reflexes.", "buy"],
  ["Offered {gold} gold again; the tin still holds {gold}.", "gold"],
  ["Fired the sulfur first, as the King's line has it.", "el:S"],
  ["Round {round} begun from the King's line, not mine.", "start"],
  ["The spec for the round is entered in the King's column as {spec+9}.", "spec"]
]);

// ---- source (c): what is owned. A creature fed by nobody; then a creature tapped by nobody. ----
thr('hom', 1, 'neat', [
  ["Water was lit at the start of the page, before anything came off.", "hom:water"],
  ["Hydrogen carried a chain over a page turn that had no chain.", "hom:h2"],
  ["Dry ice paid for three unfired reagents; two were unfired.", "hom:co2"],
  ["Acid lit on a page that ended with a larger molecule.", "hom:acid"],
  ["Wood spirit poured a reagent that was not dealt.", "hom:wood"],
  ["Salt gave back four uses from a line of three.", "hom:salt"],
  ["Slime lit with one reagent landed.", "hom:slime"],
  ["Seedling's row stands at four pages in a round of three.", "hom:seedling"],
  ["Ammonia lit with no nitrogen on the page.", "hom:ammonia"],
  ["Brimstone lit with no sulfur on the page.", "hom:brimstone"]
]);
thr('hom', 2, 'neat', [
  ["Water's flood is in the tally for page two; Water was not touched.", "hom:water", {"s": [0, 3]}],
  ["Hydrogen's tap for this page is entered above my line.", "hom:h2", {"s": [0, 3]}],
  ["Dry ice paid for a round that had not ended.", "hom:co2", {"s": [0, 3]}],
  ["Acid lit before the reagent that shrank the molecule was fired.", "hom:acid", {"s": [0, 3]}],
  ["Wood spirit poured in an order written at the foot of the page beforehand.", "hom:wood", {"s": [0, 3]}],
  ["Salt repeated a line from a page I have not played.", "hom:salt", {"s": [0, 3]}],
  ["Slime lit for a line of three entered in a second ink.", "hom:slime", {"s": [0, 3]}],
  ["Seedling grew the molecule by five atoms between pages.", "hom:seedling", {"s": [0, 3]}],
  ["Ammonia fired the page a third time.", "hom:ammonia", {"s": [0, 3]}],
  ["Brimstone ended a round the tally shows as already ended.", "hom:brimstone", {"s": [0, 3]}]
]);

// ---- source (d): lifetime counts. Each is shown once, inside its window (the page passes `seen`). ----
thr('count', 1, 'neat', [
  ["Hundredth reagent fired, and 101 uses chalked off the slate.", null, {"count": ["reagents_fired", 100, 140]}],
  ["Five hundred reagents fired; the tally inside the back cover says 512.", null, {"count": ["reagents_fired", 500, 560]}],
  ["A thousand firings; the slate shows 1,000 uses and the bottles 994.", null, {"count": ["reagents_fired", 1000, 1080]}],
  ["Third run in this notebook; the first run's yields are entered a second time.", null, {"count": ["runs", 2, 5]}],
  ["Ten runs; the notebook has eleven first pages.", null, {"count": ["runs", 10, 14]}],
  ["Ten runs lost; the tally of lost runs inside the cover says eleven.", null, {"count": ["runs_lost", 10, 14]}],
  ["First run won; the yield was already on the last page in pencil.", null, {"count": ["runs_won", 1, 3]}],
  ["A thousand rings closed; the tally of rings stands at 1,003.", null, {"count": ["ring_steps", 1000, 1100]}],
  ["Tenth overreact; the top mark has eleven strokes beside it.", null, {"count": ["overreacts", 10, 14]}]
]);
thr('count', 2, 'neat', [
  ["Twenty-five runs; a second column of yields runs beside mine from run one.", null, {"count": ["runs", 25, 30], "till": 3}],
  ["Fifty runs; the best yield of each is listed inside the back cover in a second ink.", null, {"count": ["runs", 50, 56], "till": 4}]
]);
thr('count', 3, 'neat', [
  ["Thirty runs lost; his column shows the same thirty as met.", null, {"count": ["runs_lost", 30, 36]}],
  ["Fifty overreacts; part of his face has shown in the flask at eleven of them.", null, {"count": ["overreacts", 50, 58]}]
]);

// ---- source (e): the career. Rung 2: a second ink in the notebook. An eighth of everything, or eight runs. ----
thr('career', 2, 'neat', [
  ["The slate shows this round's uses chalked off before page one was fired.", null, {"till": 3}],
  ["A second ink has the reflexes for this page in order, before they fired.", null, {"till": 3}],
  ["The slate has two tallies of uses for this round.", null, {"till": 3}],
  ["The second ink enters each yield one page ahead of mine.", null, {"till": 3}],
  ["A structure is drawn beside the molecule with one ring more than it has.", null, {"till": 3}],
  ["The reagent cards lie in the order of a line I have not played yet.", null, {"till": 3}],
  ["The second ink totals this round at {yield+3}.", null, {"till": 3}],
  ["A second figure under my yield for page {page}: {yield+1}.", null, {"till": 3}],
  ["The line {r1}, {r2}, {r3} was on the page before I lined them up.", null, {"till": 3}],
  ["The next page has a line entered: {r3}, {r1}, {r2}.", null, {"till": 3}],
  ["The spec for round {round+1} is entered at the foot of this page.", null, {"till": 3}],
  ["My sum for the page is corrected from {yield-2} to {yield} in a second ink.", null, {"till": 3}]
]);

// ---- rung 3: he, and his face. About a third of everything, or twenty-five runs. ----
thr('career', 3, 'neat', [
  ["He fired the third reagent of the page; I had lined up two."],
  ["At the top mark the flask shows part of a face for as long as the chain runs."],
  ["Longer chains show more: a chin at nine reflexes, nothing at six."],
  ["At the last overreact the flask showed the back of a head."],
  ["His page for this round has four reagents in the line."],
  ["Tried his line for the page; it gave his yield."],
  ["His yield for page {page} is {yield+4}; mine is {yield}."],
  ["His order for the page is not mine."],
  ["His column in the ledger is filled to round {round+1}."],
  ["His line for this molecule gives {n+3} reflexes to my {n}."],
  ["He has met the spec for round {round} already, by his entry."]
]);

// ---- rung 4: the King. The bargain is made in yield and gold. Four fifths of everything. ----
thr('career', 4, 'shaky', [
  ["His column in the ledger is headed 'the King'.", null, {"hand": "neat"}],
  ["Played the King's line for the page, reagent for reagent."],
  ["Entered the round's yield in the King's column, not mine."],
  ["The sign under the molecule has five strokes; I have drawn four sigils."],
  ["Three overreacts this round; the flask showed the chin at each."],
  ["The sign can be taken now; Dunmore would collect everything on the shelf.", null, {"u": [0.9, 1], "hand": "neat"}],
  ["Offered {gold} gold at the bench for a sight of his face; the tin still holds {gold}."],
  ["Chain of {n} for a sight of his face; the flask showed the chin from reflex nine.", null, {"c": {"n": [9, 999]}}],
  ["The King's yield for round {round} is {yield+9}."],
  ["Spec for round {round} is signed 'the King' under Dunmore's stamp."],
  ["Yield {yield+9} would match the King's for the round; made {yield}."]
]);

// ---- source (f): the sign. Taking it ends a tenancy. Each lap a new tenant has the bench and the same notebook, ----
// ---- with the earlier pages in it. From lap 1 the earlier tenants' hands add entries in the margins (`by`), more each lap. ----

// lap 1: the second tenant. Whole sentences. He reads the first tenant's pages as one reads a previous user's log.
thr('sign', 4, 'neat', [
  ["The notebook was a third full in another hand when I began on this bench.", null, {"s": [1, 1]}],
  ["The earlier tenant's last entry is round nine, page two, yield 212.", null, {"s": [1, 1]}],
  ["Yields on this bench run a fifth above what the method gives.", null, {"s": [1, 1]}],
  ["One stroke of the sign shows under the molecule at the top mark.", null, {"s": [1, 1]}],
  ["His tally of uses is still chalked on the slate, and it matches mine for this round.", null, {"s": [1, 1]}],
  ["The earlier hand keeps a second column in his ledger from page 80, headed 'the King'.", null, {"s": [1, 1]}],
  ["The earlier hand records a yield of {yield+6} for this compound on his page 31.", null, {"s": [1, 1]}],
  ["His line for this molecule is entered a page before mine.", null, {"s": [1, 1]}],
  ["He records a longer chain than mine from these three reagents.", null, {"s": [1, 1]}],
  ["There is a correction under my yield for page {page}, in the earlier hand.", null, {"s": [1, 1]}],
  ["The earlier hand has changed my {yield-3} to {yield}, which the tally confirms.", null, {"s": [1, 1]}],
  ["His last full round had the same spec as my round {round}, {spec}.", null, {"s": [1, 1]}],
  ["First run on this bench, with the earlier tenant's line for round one.", "start", {"s": [1, 1]}],
  ["One stroke of the sign under the molecule at the overreact.", "overreact", {"s": [1, 1]}],
  ["The finding I entered today is also on his page 9.", "unlock", {"s": [1, 1]}],
  ["Lost at round {round}, where his first run also stopped.", "loss", {"s": [1, 1]}],
  ["Met the spec by {over}; his entry for the same round is {over+2}.", "win", {"s": [1, 1]}],
  ["The earlier hand fires the sulfur first on every page.", "el:S", {"s": [1, 1]}],
  ["Page {page} gave {pageyield}, not {pageyield-2}.", null, {"s": [1, 1], "by": "tenant0"}],
  ["Chain was {n}, not {n-1}.", null, {"s": [1, 1], "by": "tenant0", "c": {"n": [2, 999]}}],
  ["Yield {yield}. The sum above is out.", null, {"s": [1, 1], "by": "tenant0"}],
  ["{dud} needs {dudneeds}.", "waste", {"s": [1, 1], "by": "tenant0"}]
]);
// lap 2: the third tenant. He abbreviates. Two earlier hands in the margins.
thr('sign', 4, 'neat', [
  ["Notebook: two hands before mine, 140 pp.", null, {"s": [2, 2]}],
  ["Last entries: 1st hand rd 9 p. 2, 2nd hand rd 6 p. 1.", null, {"s": [2, 2]}],
  ["Yld 2/5 over calc., method unchanged.", null, {"s": [2, 2]}],
  ["Two strokes of the sign under mol., all rd.", null, {"s": [2, 2]}],
  ["Both hands keep a 2nd ledger col., headed 'the King'.", null, {"s": [2, 2]}],
  ["This cpd: 1st hand yld {yield+6}, 2nd hand {yield+2}, mine {yield}.", null, {"s": [2, 2]}],
  ["1st hand's line for this mol. is on his p. 31.", null, {"s": [2, 2]}],
  ["2nd hand's chain from the same three: longer.", null, {"s": [2, 2]}],
  ["New corr. under my yld p. {page}, 1st hand.", null, {"s": [2, 2]}],
  ["2nd hand corrected my sum to {yield}.", null, {"s": [2, 2]}],
  ["Run 1 this bench. Line for rd 1 from 2nd hand's card.", "start", {"s": [2, 2]}],
  ["Spec met w. 1st hand's line.", "win", {"s": [2, 2]}],
  ["Under spec by {short}. 2nd hand lost same rd.", "loss", {"s": [2, 2]}],
  ["Top mark; two strokes of the sign.", "overreact", {"s": [2, 2]}],
  ["1st hand: S first every pg.", "el:S", {"s": [2, 2]}],
  ["Dead pg. {dud}, nothing to act on.", "waste", {"s": [2, 2]}],
  ["The reflexes on page {page} were {kinds}, in that order.", null, {"s": [2, 2], "by": "tenant0"}],
  ["Yield {yield}, not {yield+1}.", null, {"s": [2, 2], "by": "tenant0"}],
  ["Page {page}: {dud} needs {dudneeds}.", null, {"s": [2, 2], "by": "tenant0"}],
  ["Chain {n}; my longest was 31.", "chain", {"s": [2, 2], "by": "tenant0"}],
  ["The yield for page {page} should read {yield}.", null, {"s": [2, 2], "by": "tenant1"}],
  ["The last reflex fired because {why}.", null, {"s": [2, 2], "by": "tenant1"}],
  ["The spec was met on page {page}.", "win", {"s": [2, 2], "by": "tenant1"}]
]);
// lap 3: the fourth tenant. He dates everything. Three earlier hands in the margins. The King in Yellow is written in full only here.
thr('sign', 5, 'neat', [
  ["2 March. Notebook in three hands before mine, 210 pages.", null, {"s": [3, 3]}],
  ["4 March. Last entries of the three hands: round 9, round 6, round 8.", null, {"s": [3, 3]}],
  ["6 March. Three strokes of the sign under the molecule for the whole round.", null, {"s": [3, 3]}],
  ["7 March. Yield three fifths over the method.", null, {"s": [3, 3]}],
  ["15 March. Each earlier hand keeps a second column of yields, headed 'the King'.", null, {"s": [3, 3]}],
  ["27 March. The sign is whole under the molecule from page one.", null, {"s": [3, 3]}],
  ["3 March. Yields for this compound: {yield+6}, {yield+2}, {yield+1}, and mine {yield}.", null, {"s": [3, 3]}],
  ["9 March. The third hand played this molecule on his page 188.", null, {"s": [3, 3]}],
  ["12 March. New entry in the first hand under my page {page}.", null, {"s": [3, 3]}],
  ["14 March. The second hand has corrected my sum to {yield}.", null, {"s": [3, 3]}],
  ["29 March. The King's column and mine agree for round {round}.", null, {"s": [3, 3]}],
  ["23 March. Round {round} begun, spec {spec}.", "start", {"s": [3, 3]}],
  ["24 March. The sign whole under the molecule.", "sigil", {"s": [3, 3]}],
  ["25 March. Spec met by {over}.", "win", {"s": [3, 3]}],
  ["26 March. Under spec by {short}.", "loss", {"s": [3, 3]}],
  ["28 March. Saw his face in the flask at the top mark.", "overreact", {"s": [3, 3], "big": true}],
  ["1 April. Chain of {n}; the face stayed for all of it.", "chain", {"s": [3, 3], "c": {"n": [2, 999]}}],
  ["Nothing here for {dud}.", null, {"s": [3, 3], "by": "tenant0"}],
  ["Yield {yield}.", null, {"s": [3, 3], "by": "tenant0"}],
  ["My longest chain on this bench was 31.", null, {"s": [3, 3], "by": "tenant0"}],
  ["Met by {over}.", "win", {"s": [3, 3], "by": "tenant0"}],
  ["The spec for this round is {spec}.", null, {"s": [3, 3], "by": "tenant1"}],
  ["The round was lost by {short}.", "loss", {"s": [3, 3], "by": "tenant1"}],
  ["The top mark came at reflex {n}.", "overreact", {"s": [3, 3], "by": "tenant1", "c": {"n": [1, 999]}}],
  ["Yld p. {page} = {yield}.", null, {"s": [3, 3], "by": "tenant2"}],
  ["{left} from {leftfrom}.", null, {"s": [3, 3], "by": "tenant2"}],
  ["Refl. {n}. My best 27.", null, {"s": [3, 3], "by": "tenant2"}],
  ["{dud} wants {dudneeds}.", "waste", {"s": [3, 3], "by": "tenant2"}],
  ["Rd {round}. Spec {spec}.", "start", {"s": [3, 3], "by": "tenant2"}]
]);

// ---- more of source (b) for the newer tags and for nitrogen and chlorine: a rule of the bench, broken ----
thr('event', 1, 'neat', [
  ["{reagent} acted at a place it had already changed.", "fire"],
  ["{reagent} fired from a bottle with no uses left.", "fire"],
  ["{reagent} left two different groups at one place.", "fire"],
  ["A {kind} fired twice on the same two atoms.", "reflex"],
  ["A {kind} fired before the reagent that set it up.", "reflex"],
  ["A dry step gave off no water; each gives one.", "reflex"],
  ["A ring of three closed and held; rings want five or six.", "ring"],
  ["The ring that closed is not in the count of rings.", "ring"],
  ["A loose ring stayed shut through the page turn; loose rings open.", "ring"],
  ["{left} came off a page that had nothing to give it.", "left"],
  ["The jar took {left} before the reagent fired.", "left"],
  ["Page {page} ended with a reagent still to fire.", "page"],
  ["A fourth page was played this round.", "page"],
  ["Gold was paid for mark {mark} twice.", "mark"],
  ["Mark {mark} stands below the spec on the yield track.", "mark"],
  ["The nitrogen reagent put its NH2 on the carbon with more hydrogens, not fewer.", "el:N"],
  ["The molecule carries a nitrogen that no reagent put on and the deal did not show.", "el:N"],
  ["A knit ring stayed shut through the page turn; knit rings open.", "el:N"],
  ["A close made a ring of nine; seven is the most.", "el:Cl"],
  ["Two Cl on the molecule and three in the formula.", "el:Cl"],
  ["A close gave off water, not acid fumes.", "el:Cl"]
]);

// ---- more of source (b): the thin tags, and a creature that has just acted (tap:<key>) doing what it cannot ----
thr('event', 1, 'neat', [
  ["The instrument was used twice on one page.", "instrument"],
  ["{instrument} is on the bench and still on Dunmore's list as unsold.", "instrument"],
  ["Dunmore's list offers the same reagent three times; he lists each once.", "shop"],
  ["Dunmore's list prices a reagent that is already on the shelf.", "shop"],
  ["The catalog entry for {compound} shows one carbon more than was made.", "catalog"],
  ["A compound is entered in the catalog that this molecule cannot become.", "catalog"],
  ["The finding's count stands past its target.", "unlock"],
  ["The yield passed mark {mark} and then stood below it.", "mark"],
  ["Carbon dioxide came off a page where nothing was cut.", "left"],
  ["Page {page} paid every chain step at the rate for step one; steps pay more as they go.", "page"],
  ["Water's flood left a C=C standing; it takes every one.", "tap:water"],
  ["Hydrogen carried the count to a page that was never played.", "tap:h2"],
  ["Dry ice lit on page one; it lights on the last.", "tap:co2"],
  ["Acid doubled a page that made nothing and left a figure.", "tap:acid"],
  ["Wood spirit poured in an order that was not the deal's.", "tap:wood"],
  ["Salt gave the uses back to a different three reagents.", "tap:salt"],
  ["Slime shut a reagent that had not been in the line.", "tap:slime"],
  ["Seedling's row went on through a page that shrank the molecule.", "tap:seedling"],
  ["Ammonia fired the three again in reverse order.", "tap:ammonia"],
  ["Brimstone ended the round and a third page is in the tally.", "tap:brimstone"],
  ["The formula shows one nitrogen and the molecule carries two NH2.", "el:N"],
  ["A Cl closed onto an OH eight carbons away; five is the most.", "el:Cl"]
]);

// ---- the book: a handful of logged facts, late. The title is written once, on the last rung. ----
thr('event', 3, 'neat', [
  ["Dunmore's delivery with {item}: also one thin book in yellow cloth, not on the invoice.", "buy"]
]);
thr('event', 4, 'neat', [
  ["Dunmore's invoice for {item} gives the place of supply as Carcosa.", "buy"]
]);
thr('sign', 4, 'neat', [
  ["On the bench at the start: six bottles, the notebook, and a thin book in yellow cloth.", "start", {"s": [1, 1]}],
  ["Yellow bk on bench; read to p. 40 between rds.", "start", {"s": [2, 2]}]
]);
thr('sign', 5, 'neat', [
  ["22 March. The book on the bench is The King in Yellow, a play; read to page 61.", "start", {"s": [3, 3]}]
]);

AA.NOTES = NOTES; AA.NOTES_RULES_SLOTS = RULES_SLOTS;
const THREAD_T = {}; NOTES.forEach(n => { if (n.thread) THREAD_T[n.t] = n; });
const clamp = v => Math.max(0, Math.min(1, v || 0));

// the old scale: the career (unlocks) carries most of it, the run and the chain the rest. No note is ranged on it now.
AA.notesDepth = function (unlocks, round, rounds, chain) {
  const u = clamp(unlocks), n = Math.max(2, rounds || 9), r = clamp(((round || 1) - 1) / (n - 1));
  const c = clamp((chain || 0) / 14);
  return clamp(u * 0.65 + r * 0.3 + c * 0.05);
};

// The reveal ladder. 1: impossible results, from the first run. 2: a second ink (an eighth of everything, or eight runs).
// 3: he and his face (35 in 100 of everything, or twenty-five runs). 4: the King (four fifths, or any lap of the sign).
// 5: the King in Yellow, in full (the third lap only).
AA.notesReach = function (state) {
  const s = state || {}, u = clamp(s.unlocks), g = Math.max(0, Math.min(3, s.sign | 0)), runs = (s.counts && s.counts.runs) || 0;
  if (g >= 3) return 5;
  if (u >= 0.8 || g >= 1) return 4;
  if (u >= 0.35 || runs >= 25) return 3;
  if (u >= 0.12 || runs >= 8) return 2;
  return 1;
};

// The thread budget. rate is the share of notes that may be thread lines: about 1 in 10 for a new player, 1 in 5 by mid-career,
// 1 in 3 late. c is how far along the player is, taken from the share of unlocks, the runs played and the laps of the sign
// (a lap does not put it back). Rounds 7 to 9 of a run add a little. gap is the fewest plain notes between two thread lines
// (3 early, then 2, then 1: never back to back). p is the chance at each note once the gap has passed.
AA.notesRate = function (state) {
  const s = state || {}, u = clamp(s.unlocks), g = Math.max(0, Math.min(3, s.sign | 0)), runs = (s.counts && s.counts.runs) || 0;
  const c = Math.max(u, 0.6 * Math.min(1, runs / 60), g ? 0.5 + 0.15 * g : 0);
  const rate = Math.min(0.36, 0.10 + 0.22 * c + ((s.round || 0) >= 7 ? 0.05 : 0));
  const gap = rate < 0.15 ? 3 : rate < 0.28 ? 2 : 1;
  return { rate, gap, p: Math.min(1, 1 / (1 / rate - gap)), c };
};

function hash01(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; return ((h >>> 0) % 100000) / 100000; }

// is a thread line due at this note? `used` is this run's notes (their texts as in the data, slots unfilled) in the order shown; the plain
// notes since the last thread line are counted from it. A new run starts as if two plain notes had passed (or state.since, if the page
// carries the count across runs).
const OWED = 9;
function threadDue(s, used) {
  let last = -1; for (let i = used.length - 1; i >= 0; i--) if (THREAD_T[used[i]]) { last = i; break; }
  const since = last >= 0 ? used.length - 1 - last : used.length + (s.since == null ? 2 : s.since), b = AA.notesRate(s);
  if (!used.length || since < b.gap) return false;                       // never the first note of a run, never inside the gap
  if (last < 0 && used.length >= OWED) return true;                      // a run of that many notes with none yet: one is owed
  const seen = s.seen, runs = (s.counts && s.counts.runs) || 0;
  if (seen && runs >= 1 && !Object.keys(THREAD_T).some(t => (Array.isArray(seen) ? seen.indexOf(t) >= 0 : seen[t]))) return true;  // none ever, by the second run
  return hash01((s.seed || 0) + '|' + used.length + '|' + (used[used.length - 1] || '') + '|' + (s.round || 0)) < b.p;
}

// state: { depth, unlocks 0..1, round, tag (a string or a list), homs (keys of the creatures owned), used (texts shown this run, in order),
//          ctx (what the slots are filled from: see NOTES_WRITING.md, "What the page must pass"), sign (laps taken, 0..3), counts (lifetime
//          counts), since (plain notes since the last thread line, across runs), seen (thread texts ever shown: a list or a map), seed }
// Only unlocks, tag, homs and used are needed; without ctx only notes with no slots come back.
// Returns the notes that fit, and decides by the budget whether this note is a thread line or a plain one: the list is all one or the other.
// With a tag that has notes here, only those. Otherwise the untagged notes and the notes of owned creatures. Never returns an empty list.
// The page shows AA.notesFill(note, ctx) and keeps note.t in `used`.
AA.notesPick = function (state) {
  const s = state || {}, u = clamp(s.unlocks), g = Math.max(0, Math.min(3, s.sign | 0)), ctx = derive(s.ctx);
  const tags = s.tag == null ? [] : [].concat(s.tag), homs = (s.homs || []).map(h => 'hom:' + h), used = s.used || [], counts = s.counts || {};
  const seen = s.seen, wasSeen = t => !!seen && (Array.isArray(seen) ? seen.indexOf(t) >= 0 : !!seen[t]);
  const inR = (v, r) => v >= r[0] && v <= r[1];
  const okRound = n => !n.round || (s.round != null && s.round >= n.round[0] && s.round <= n.round[1]);
  const okWhen = n => tags.length ? (n.when && tags.indexOf(n.when) >= 0) : (!n.when || homs.indexOf(n.when) >= 0);
  const okSlots = n => n.slots.every(k => ctx[k] != null && ctx[k] !== '') && (!n.cond || Object.keys(n.cond).every(k => ctx[k] >= n.cond[k][0] && ctx[k] <= n.cond[k][1]));
  const unused = n => n.again ? used.slice(-4).indexOf(n.t) < 0 : used.indexOf(n.t) < 0;   // an `again` note may return once four others have passed
  const key = (s.seed || 0) + '|' + used.length + '|' + (used[used.length - 1] || '');
  // notes about the present page (with slots) come before the ones without, four times in five
  const present = l => { const w = l.filter(n => n.slots.length); return w.length >= 2 && hash01('w|' + key) < 0.8 ? w : l; };
  if (threadDue(s, used)) {
    const reach = AA.notesReach(s);
    const ok = n => n.thread && n.rung <= reach && reach <= n.till && inR(g, n.sign) && inR(u, n.unlocks) && okRound(n) && okSlots(n) && unused(n);
    const due = NOTES.filter(n => ok(n) && n.count && (counts[n.count[0]] || 0) >= n.count[1] && (counts[n.count[0]] || 0) <= n.count[2] && !wasSeen(n.t));
    if (due.length && !tags.length) return due;                          // a lifetime count comes first, once
    const l = NOTES.filter(n => ok(n) && !n.count && okWhen(n));
    if (l.length) {                                                      // seven times in ten the newest rungs, the late-run lines and the tenant's own; else anything that fits
      const top = l.filter(n => n.rung >= reach - 1 || n.src === 'sign' || n.src === 'run'), near = top.length >= 4 && hash01('t|' + key) < 0.7;
      const f = near ? top : l, nw = f.filter(n => !wasSeen(n.t)); return present(nw.length ? nw : f); }
  }
  const plain = NOTES.filter(n => !n.thread && inR(g, n.sign) && inR(u, n.unlocks) && okSlots(n));
  const fresh = l => { const f = l.filter(unused); return f.length ? f : l; };
  const live = l => { const f = l.filter(n => !n.fb); return f.length ? f : l; };   // rules of thumb only when nothing else fits
  if (tags.length) { const l = plain.filter(n => n.when && tags.indexOf(n.when) >= 0); if (l.length) return present(fresh(l)); }
  const l = plain.filter(n => !n.when || homs.indexOf(n.when) >= 0);
  if (g && hash01('own|' + key) < 0.5) { const own = l.filter(n => !n.when && n.sign[0] === g && unused(n)); if (own.length) return present(own); }   // on a lap, half the plain notes are the tenant's own
  if (l.length) return present(live(fresh(live(l))));
  return fresh(NOTES.filter(n => !n.thread && !n.slots.length && inR(g, n.sign)));
};

// the note's text with its slots filled: {name}, and {name+2} or {name-1} for a number. A slot that opens the note is given a capital.
AA.notesFill = function (note, ctx) {
  const c = derive(ctx), t = typeof note === 'string' ? note : note.t;
  const out = t.replace(/\{([a-z0-9]+)(?:([+-])(\d+))?\}/g, (m, k, sg, d) => { const v = c[k]; if (v == null) return m; return sg ? String(Number(v) + (sg === '+' ? 1 : -1) * Number(d)) : String(v); });
  return t.charAt(0) === '{' ? out.charAt(0).toUpperCase() + out.slice(1) : out;
};

// '~struck~ and _under_' to [{ s, struck, under }] so the pen can draw a line through or under a piece
AA.notesParse = function (t) {
  const out = []; let m; const re = /~([^~]+)~|_([^_]+)_|([^~_]+)/g;
  while ((m = re.exec(t))) out.push(m[1] != null ? { s: m[1], struck: true } : m[2] != null ? { s: m[2], under: true } : { s: m[3] });
  return out;
};

if (typeof module !== 'undefined' && module.exports) module.exports = { NOTES, notesPick: AA.notesPick, notesFill: AA.notesFill, notesDepth: AA.notesDepth, notesReach: AA.notesReach, notesRate: AA.notesRate, notesParse: AA.notesParse };
})(typeof globalThis !== 'undefined' ? globalThis : window);
