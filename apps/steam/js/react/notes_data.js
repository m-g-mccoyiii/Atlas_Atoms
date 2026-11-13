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
//           el:N el:S el:Cl el:Br   hom:water hom:h2 hom:co2 hom:acid hom:wood hom:salt hom:slime hom:seedling hom:ammonia hom:brimstone
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
//   wait    it uses a slot the rules side has to work out and the page cannot pass yet; held back until it is passed
// Sources: R. W. Chambers, The King in Yellow (1895) and Ambrose Bierce only. Nothing later. See the rights rule in NOTES_WRITING.md.
// Every row below is one line and is valid JSON, so the check script can read it without running the file.
(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
const NOTES = [];
// Slots the page cannot fill today: the rules side has to work them out (NOTES_WRITING.md, "What the page must pass"). A note that
// uses one is marked wait: true and is held back until the page passes it.
const RULES_SLOTS = ['bestorder', 'bestn', 'bestsame', 'gap', 'nearkind', 'neargap', 'nearneed', 'roundbest', 'runbest', 'careerbest', 'molseen', 'molbest', 'loose', 'homlack'];
// What the notes know about the bench themselves (docs/tools_chem/FINAL.md), so the page only has to pass a name.
// From the reagent just fired: {does} what it leaves, {feeds} what that is good for. From a reagent that found nothing: {dudneeds}.
const REAGENT = {
  hydrate: { needs: 'a C=C', does: 'an OH on the carbon with fewer hydrogens', feeds: 'an OH, which rings onto a C=O three or four carbons off' },
  hydroborate: { needs: 'a C=C', does: 'an OH on the carbon with more hydrogens', feeds: 'an OH nearer the chain end than hydrate gives' },
  dehydrate: { needs: 'an OH with no other oxygen on its carbon or the next', does: 'a C=C where the OH was, and water off', feeds: 'a C=C, which shifts if a C=O is two carbons off' },
  oxidize: { needs: 'an OH on a carbon that still has a hydrogen, or a C=C at a chain end', does: 'a C=O where the OH was, and hydrogen off', feeds: 'a C=O for a ring, weld, knit or cap to close onto' },
  reduce: { needs: 'a C=O at the end of a chain', does: 'a CH2-OH where the end C=O was', feeds: 'an end OH, which rings onto a C=O three or four carbons off' },
  grow: { needs: 'a C=O', does: 'an OH and a three-carbon arm ending in C=C', feeds: 'a C=C arm for hydrate or the sulfur and nitrogen reagents' },
  thiolene: { needs: 'a C=C', does: 'an SH on the carbon with more hydrogens', feeds: 'an SH, which caps onto a C=O three or four carbons off' },
  ritter: { needs: 'a C=C', does: 'an NH2 on the carbon with fewer hydrogens', feeds: 'an NH2, which knits onto a C=O three or four carbons off' },
  hwe: { needs: 'an aldehyde or a methyl ketone not already beside a C=C', does: 'a C=C beside a new ketone', feeds: 'a C=C beside a C=O, which a tuck can use' },
  dihydroxylation: { needs: 'a C=C', does: 'an OH on each carbon of the C=C', feeds: 'two OH, one of which can dry or ring' },
  ozonolysis: { needs: 'a C=C with carbon on both sides', does: 'a C=O at each cut carbon', feeds: 'two C=O for rings and welds to close onto' },
  permanganate: { needs: 'a chain-end C=C, an aldehyde or a chain-end CH2-OH', does: 'a COOH at the chain end', feeds: 'a COOH, which seals with an OH three or four carbons off' },
  chlorination: { needs: 'an OH that is not on a ring and not on a carbon with three carbons', does: 'a Cl where the OH was, and acid fumes off', feeds: 'a Cl, which closes with an OH three to five carbons off' },
  cyanohydrin: { needs: 'an aldehyde or a methyl ketone', does: 'an OH and a COOH on one carbon', feeds: 'a COOH, which seals with an OH three or four carbons off' },
  hofmann: { needs: 'an NH2 on a carbon with no double bond', does: 'a C=C where the NH2 was', feeds: 'a C=C, which shifts if a C=O is two carbons off' },
  chugaev: { needs: 'an OH with no other oxygen on its carbon or the next', does: 'a C=C toward the neighbour with more hydrogens, and sulfur off', feeds: 'a C=C on the other side from the one dehydrate gives' },
  hydroformylation: { needs: 'a C=C', does: 'a CHO on the carbon with more hydrogens', feeds: 'an aldehyde, one carbon longer, for an OH to ring onto' },
  epoxidation: { needs: 'a C=C', does: 'an epoxide where the C=C was', feeds: 'an epoxide, which an OH three or four carbons off opens into a ring' }
};
const ALIAS = { pcc: 'oxidize', allyl: 'grow', bh3: 'hydroborate', nabh4: 'reduce', 'thiol-ene': 'thiolene', 'the sulfur reagent': 'thiolene', 'the nitrogen reagent': 'ritter', lactol: 'ring', enone: 'dry', taut: 'flip', snap6: 'snap', ether: 'close' };
// From the reflex just fired: {why} it fired, {after} what it leaves.
const KIND = {
  ring: { why: 'an OH was three or four carbons from a C=O', after: 'a loose ring that opens again at the page turn' },
  dry: { why: 'an OH was two carbons from a C=O', after: 'a C=C beside the C=O, which a tuck can use' },
  weld: { why: 'two C=O were four or five carbons apart', after: 'a ring that stays shut, and a new OH' },
  shift: { why: 'a C=C was two carbons from a C=O', after: 'a C=C beside the C=O, which a tuck can use' },
  tuck: { why: 'a C=C sat beside a C=O with an OH three or four carbons past it', after: 'a ring ether that stays shut' },
  flip: { why: 'an OH sat on a carbon of a C=C', after: 'a new C=O' },
  snap: { why: 'two C=C lay side by side with a third near', after: 'a six-ring that stays shut' },
  knit: { why: 'an NH2 was three or four carbons from a C=O', after: 'a loose ring that opens again at the page turn' },
  cap: { why: 'an SH was three or four carbons from a C=O', after: 'a loose ring that opens again at the page turn' },
  close: { why: 'a Cl was three to five carbons from an OH, NH2 or SH', after: 'a ring that stays shut, and acid fumes off' },
  open: { why: 'an epoxide and an OH were three or four carbons apart', after: 'a ring ether and a new OH' },
  fold: { why: 'an epoxide had a carbon on both ends', after: 'a new C=O' },
  seal: { why: 'a COOH was three or four carbons from an OH, NH2 or SH', after: 'a ring that stays shut, and water off' }
};
// From what came off: {leftfrom} what gives it off.
const LEFT = { water: 'a dehydrate or a dry step', hydrogen: 'an oxidize', 'carbon dioxide': 'oxidize cutting a chain-end C=C', 'acid fumes': 'a close', ammonia: 'the cyanohydrin route', sulfur: 'a Chugaev' };
const low = v => { const k = String(v == null ? '' : v).toLowerCase(); return ALIAS[k] || k; };
function derive(ctx) {
  const c = Object.assign({}, ctx || {}), r = REAGENT[low(c.reagent)], d = REAGENT[low(c.dud)], k = KIND[low(c.kind)], l = LEFT[low(c.left)];
  if (r) { c.does = r.does; c.feeds = r.feeds; } if (d) c.dudneeds = d.needs; if (k) { c.why = k.why; c.after = k.after; } if (l) c.leftfrom = l;
  return c;
}
function push(r, base) {
  const o = r[2] || {}, n = Object.assign({ t: r[0] }, base), seen = {};
  if (o.u) n.unlocks = o.u; if (o.hand) n.hand = o.hand; if (o.s) n.sign = o.s;
  if (r[1]) n.when = r[1];
  if (o.big) n.big = true; if (o.round) n.round = o.round; if (o.till) n.till = o.till; if (o.count) n.count = o.count; if (o.by) n.by = o.by; if (o.c) n.cond = o.c; if (o.fb) n.fb = true;
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
// Each says something the player can use and cannot read off the screen: why a thing happened, what would have gone further,
// what a creature needs, a record, a plan that follows from the page. Every rule stated here is in docs/tools_chem/FINAL.md,
// docs/HOMUNCULI.md or path.js (RULE, CASC, HOM2LIT); see NOTES_WRITING.md, "What was checked against the rules".

// ---- rules of the bench, no slots: only when nothing about the present page fits ----
lab([0, 3], 'neat', [
  ["An OH three or four carbons from a C=O closes a ring by itself.", null, {"fb": true}],
  ["An OH two carbons from a C=O dries: water off, and a C=C beside the C=O.", null, {"fb": true}],
  ["A C=C two carbons from a C=O shifts over to sit beside it.", null, {"fb": true}],
  ["A C=C beside a C=O tucks if an OH is three or four carbons past it.", null, {"fb": true}],
  ["A weld wants two C=O, four or five carbons apart.", null, {"fb": true}],
  ["An OH on a carbon of a C=C flips to a C=O.", null, {"fb": true}],
  ["Dehydrate is the reagent; dry is the reflex and needs a C=O two carbons from the OH.", null, {"fb": true}],
  ["Rings from ring, knit and cap are loose and open at the page turn; others stay shut.", null, {"fb": true}],
  ["Oxidize turns an OH into a C=O if the OH's carbon has a hydrogen.", null, {"fb": true}],
  ["Oxidize cuts the end carbon off a chain-end C=C and gives off carbon dioxide.", null, {"fb": true}],
  ["Hydrate puts the OH on the carbon with fewer hydrogens; beside a C=O, on the far carbon.", null, {"fb": true}],
  ["Dehydrate will not take an OH whose next carbon carries an oxygen.", null, {"fb": true}],
  ["Grow turns every C=O into an OH with a three-carbon arm ending in C=C.", null, {"fb": true}],
  ["The sulfur reagent puts an SH on every C=C, on the carbon with more hydrogens.", null, {"fb": true}],
  ["The nitrogen reagent puts an NH2 on every C=C, on the carbon with fewer hydrogens.", null, {"fb": true}],
  ["A reagent acts at every place on the molecule that fits it.", null, {"fb": true}],
  ["A reagent that finds nothing still spends its use.", null, {"fb": true}],
  ["The tenth reflex of a page pays ten times the first.", null, {"fb": true}],
  ["Chain steps up to the round's longest earlier chain pay a quarter; steps past it pay in full.", null, {"fb": true}],
  ["The marks stand at two, four and eight times the spec; the last is the overreact.", null, {"fb": true}],
  ["Gold is paid for each mark passed, and only when the spec is met.", null, {"fb": true}],
  ["An SH three or four carbons from a C=O caps into a ring.", null, {"fb": true}],
  ["An NH2 three or four carbons from a C=O knits into a ring.", null, {"fb": true}],
  ["A Cl three to five carbons from an OH closes a ring and gives off acid fumes.", null, {"fb": true}],
  ["Two C=C side by side and a third four or five bonds off snap into a six-ring.", null, {"fb": true}]
]);

// ---- the molecule and the page as they stand (no tag): the first chemist ----
lab([0, 0], 'neat', [
  ["No C=C on this molecule, so hydrate and the sulfur and nitrogen reagents will find nothing.", null, {"c": {"ene": [0, 0]}}],
  ["No OH on this molecule; dehydrate needs one made first.", null, {"c": {"oh": [0, 0]}}],
  ["No C=O here: grow has nothing to take, and no ring, weld, knit or cap can close.", null, {"c": {"co": [0, 0]}}],
  ["Best order of the last three was {bestorder}: {bestn} reflexes to my {n}."],
  ["Next time on this molecule: {bestorder}."],
  ["A {nearkind} is one carbon out: the groups are {neargap} apart and it wants {nearneed}."],
  ["{loose} loose rings will open when the page turns; a longer chain can close them again.", null, {"c": {"loose": [2, 99]}}],
  ["The loose ring opens again when the page turns.", null, {"c": {"loose": [1, 1]}}],
  ["Longest chain on an earlier page this round was {roundbest}; steps up to that pay a quarter now.", null, {"c": {"roundbest": [1, 999]}}],
  ["Longest chain this run {runbest}; longest in the notebook {careerbest}."],
  ["{reagent} has one use left; it gives {feeds}.", null, {"c": {"uses": [1, 1]}}],
  ["The molecule is at {atoms} atoms, not counting hydrogen; nothing grows past 56.", null, {"c": {"atoms": [45, 56]}}],
  ["{creature} was {homlack} short of lighting on that page."],
  ["{dud} found nothing on the last page: it needs {dudneeds}."]
]);

// ---- what has just happened ----
lab([0, 3], 'neat', [
  ["New round; count the carbons between each OH and each C=O before lining up.", "start"],
  ["{co} C=O and {oh} OH at the start; look for a pair three or four carbons apart.", "start", {"c": {"co": [1, 99], "oh": [1, 99]}}],
  ["No OH at the start; hydrate a C=C to make the first one.", "start", {"c": {"oh": [0, 0], "ene": [1, 99]}}],
  ["No C=C at the start; grow at a C=O adds one.", "start", {"c": {"ene": [0, 0], "co": [1, 99]}}],
  ["This molecule came up {molseen} times before; best yield with it {molbest}.", "start", {"c": {"molseen": [2, 999]}}],

  ["{reagent} left {does}.", "fire"],
  ["{reagent} gives {feeds}.", "fire"],
  ["{reagent} set off {n} reflexes by itself.", "fire", {"c": {"n": [2, 999]}}],
  ["{reagent} acted, but the order {bestorder} would have run {bestn} reflexes.", "fire"],

  ["A {kind} fired: {why}.", "reflex"],
  ["The {kind} leaves {after}.", "reflex"],

  ["The ring closed because the two groups were {gap} carbons apart.", "ring"],
  ["{loose} loose rings standing; they open at the page turn and can close again in a longer chain.", "ring", {"c": {"loose": [2, 99]}}],
  ["A ring or a weld leaves a new OH on the old C=O carbon.", "ring"],

  ["{left} came off; it comes from {leftfrom}.", "left"],
  ["{left} off that page: {leftn}; Water lights at four waters on one page.", "left", {"c": {"leftn": [1, 3]}}],
  ["Each thing driven off makes the molecule smaller; Acid lights at two atoms.", "left"],

  ["Best order of those three was {bestorder}: {bestn} reflexes to the {n} I got.", "page"],
  ["That was the best order of those three.", "page", {"c": {"bestsame": [1, 1]}}],
  ["Page {page} ran {n} reflexes against {roundbest} earlier; only the steps past that paid in full.", "page", {"c": {"roundbest": [1, 999]}}],
  ["{dud} found nothing: it needs {dudneeds}.", "page"],
  ["A {nearkind} was one carbon out on that page: groups {neargap} apart, and it wants {nearneed}.", "page"],

  ["Mark {mark} is worth gold if the round is met.", "mark"],

  ["Spec met; anything past it counts toward the marks at two, four and eight times.", "win"],
  ["Met it; {bestorder} would have given {bestn} reflexes on the last page.", "win"],

  ["Under spec; most of a round's yield comes from the chain, not the three reagents.", "loss"],
  ["Under by {short}; {dud} was wasted, and it needs {dudneeds}.", "loss"],
  ["Under by {short}; the order {bestorder} would have run {bestn} reflexes on the last page.", "loss"],
  ["A {nearkind} was one carbon out on the last page: {neargap} apart, wants {nearneed}.", "loss"],
  ["Next time on this molecule: {bestorder} on page one.", "loss"],

  ["An overreact is the yield passing eight times the spec.", "overreact"],
  ["Overreact on {r1}, {r2}, {r3}; fired again this round the same chain pays a quarter.", "overreact"],

  ["A chain is each reflex leaving what the next one needs.", "chain"],
  ["Chain of {n}; the notebook's longest is {careerbest}.", "chain", {"c": {"n": [2, 999]}}],
  ["Step {n} paid {n} times step one.", "chain", {"c": {"n": [2, 999]}}],

  ["A reagent that finds nothing in first place is what lights Wood spirit.", "waste"],
  ["{dud} acted nowhere; it wants {dudneeds}.", "waste"],

  ["Gold kept in the tin earns interest each round the spec is met.", "shop"],

  ["Gold spent is gold that earns no interest next round.", "buy"],

  ["A finding opens the next thing on its shelf.", "unlock"],


  ["Each sigil breaks one rule for the round.", "sigil"],
  ["{sigil} is on for round {round}; a line that worked before may not hold.", "sigil"],

  ["Gold is paid for the marks passed and as interest on what was kept.", "gold"],
  ["{gained} gold: for the marks passed, and interest on the tin.", "gold"],


  ["A compound in the catalog stays there when everything else on the shelf goes.", "catalog"],

  ["NH2 on the molecule: it knits onto a C=O three or four carbons away.", "el:N"],
  ["A knit ring is loose and opens again at the page turn.", "el:N"],
  ["The nitrogen reagent landing, or a knit, lights Ammonia.", "el:N"],
  ["SH on the molecule: it caps onto a C=O three or four carbons away.", "el:S"],
  ["The sulfur reagent wants a C=C; the SH lands on the carbon with more hydrogens.", "el:S"],
  ["Sulfur going on lights Brimstone, except on the last page.", "el:S"],
  ["Cl on the molecule: it closes a ring with an OH three to five carbons away.", "el:Cl"],
  ["A close gives off acid fumes, and its ring stays shut over the page turn.", "el:Cl"],
  ["A close can make a ring of seven, which no other reflex here can.", "el:Cl"]
]);

// ---- the creatures: what lights each and what it asks ----
lab([0, 3], 'neat', [
  ["Water lights when one page gives off four waters.", "hom:water"],
  ["Water's flood turns every C=C to C-OH and runs the rings again.", "hom:water"],
  ["Dehydrate and dry steps are what give off water.", "hom:water"],
  ["Hydrogen lights when oxidize is last, lands, and the page ran three reflexes.", "hom:h2"],
  ["Hydrogen carries the chain's count to the next page; if that page's chain is shorter, the yield drops.", "hom:h2"],
  ["Hydrogen does not light on the last page.", "hom:h2"],
  ["Dry ice lights on the last page if carbon dioxide came off and three reagents never acted.", "hom:co2"],
  ["Carbon dioxide comes off when oxidize cuts a chain-end C=C; grow makes one.", "hom:co2"],
  ["For Dry ice, three of the six reagents must not act all round.", "hom:co2"],
  ["Acid lights when the page ends the molecule two atoms smaller.", "hom:acid"],
  ["One water off is one atom gone, hydrogens not counted; Acid wants two.", "hom:acid"],
  ["Grow on the same page undoes what Acid needs.", "hom:acid"],
  ["Wood spirit lights when the first reagent lined up finds nothing.", "hom:wood"],
  ["Wood spirit pours every dealt reagent not lined up, in the order dealt, at no use.", "hom:wood"],
  ["For Wood spirit, put a reagent that cannot act in first place.", "hom:wood"],
  ["Salt lights when the line is the page before's, reagent for reagent.", "hom:salt"],
  ["Salt gives the three uses back.", "hom:salt"],
  ["Salt's repeated line finds fewer places the second time, since the first changed them.", "hom:salt"],
  ["Slime lights when two of the page's reagents each set off a reflex of their own.", "hom:slime"],
  ["Slime pays more when all three reagents each set off a reflex.", "hom:slime"],
  ["After Slime is tapped, the reagents that lit it cannot be used on the next page.", "hom:slime"],
  ["Seedling lights when the page ends the molecule eight atoms bigger, hydrogens not counted.", "hom:seedling"],
  ["Seedling pays more each page in a row; a page that grows less than eight cuts the yield.", "hom:seedling"],
  ["Grow adds three carbons at every C=O; three C=O is nine atoms.", "hom:seedling"],
  ["Ammonia lights when the nitrogen reagent lands or a knit fires.", "hom:ammonia"],
  ["Ammonia fires the page's three again in the same order, no use spent.", "hom:ammonia"],
  ["With Ammonia the three fire again; a dehydrate after a hydrate takes back the OH.", "hom:ammonia"],
  ["Brimstone lights when the sulfur reagent lands or a cap fires, not on the last page.", "hom:brimstone"],
  ["Brimstone ends the round and counts the spec as met.", "hom:brimstone"],
  ["Brimstone ends the round at once; the pages left are not played.", "hom:brimstone"]
]);

// ---- the later tenants' own plain notes: the second writes whole sentences, the third abbreviates, the fourth dates everything ----
lab([1, 1], 'neat', [
  ["A ring closes when an OH is three or four carbons from a C=O."],
  ["The best order of the last three was {bestorder}, which gives {bestn} reflexes."],
  ["A {nearkind} is one carbon out here: the groups are {neargap} apart and it wants {nearneed}."],
  ["The longest chain earlier this round was {roundbest}, and steps up to it pay a quarter.", null, {"c": {"roundbest": [1, 999]}}],
  ["There are {loose} loose rings, which will open when the page turns.", null, {"c": {"loose": [2, 99]}}],
  ["{dud} found nothing because it needs {dudneeds}."]
]);
lab([2, 2], 'neat', [
  ["OH 3 or 4 C from C=O = ring."],
  ["Best order: {bestorder}. Refl. {bestn}."],
  ["{nearkind} 1 C out: {neargap} apart, wants {nearneed}."],
  ["Rd best {roundbest}; refl. up to that pay 1/4.", null, {"c": {"roundbest": [1, 999]}}],
  ["Loose rings {loose}; open at pg turn.", null, {"c": {"loose": [1, 99]}}],
  ["{dud}: needs {dudneeds}."]
]);
lab([3, 3], 'neat', [
  ["4 March. OH three or four carbons from C=O: ring."],
  ["5 March. Best order {bestorder}, {bestn} reflexes."],
  ["7 March. A {nearkind} one carbon out, {neargap} apart, wants {nearneed}."],
  ["8 March. Round's longest {roundbest}; steps to there pay a quarter.", null, {"c": {"roundbest": [1, 999]}}],
  ["11 March. Loose rings {loose}, open at the turn.", null, {"c": {"loose": [1, 99]}}],
  ["13 March. Nothing for {dud}: it needs {dudneeds}."]
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
  ["His order for the page is {bestorder}."],
  ["His column in the ledger is filled to round {round+1}."],
  ["His line for this molecule gives {bestn} reflexes to my {n}."],
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
  ["His line for this molecule was {bestorder}.", null, {"s": [1, 1]}],
  ["He records {bestn} reflexes from these three reagents, in another order.", null, {"s": [1, 1]}],
  ["There is a correction under my yield for page {page}, in the earlier hand.", null, {"s": [1, 1]}],
  ["The earlier hand has changed my {yield-3} to {yield}, which the tally confirms.", null, {"s": [1, 1]}],
  ["His last full round had the same spec as my round {round}, {spec}.", null, {"s": [1, 1]}],
  ["First run on this bench, with the earlier tenant's line for round one.", "start", {"s": [1, 1]}],
  ["One stroke of the sign under the molecule at the overreact.", "overreact", {"s": [1, 1]}],
  ["The finding I entered today is also on his page 9.", "unlock", {"s": [1, 1]}],
  ["Lost at round {round}, where his first run also stopped.", "loss", {"s": [1, 1]}],
  ["Met the spec by {over}; his entry for the same round is {over+2}.", "win", {"s": [1, 1]}],
  ["The earlier hand fires the sulfur first on every page.", "el:S", {"s": [1, 1]}],
  ["Order should have been {bestorder}.", null, {"s": [1, 1], "by": "tenant0"}],
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
  ["1st hand's line here: {bestorder}.", null, {"s": [2, 2]}],
  ["2nd hand gets {bestn} refl. from the same three.", null, {"s": [2, 2]}],
  ["New corr. under my yld p. {page}, 1st hand.", null, {"s": [2, 2]}],
  ["2nd hand corrected my sum to {yield}.", null, {"s": [2, 2]}],
  ["Run 1 this bench. Line for rd 1 from 2nd hand's card.", "start", {"s": [2, 2]}],
  ["Spec met w. 1st hand's line.", "win", {"s": [2, 2]}],
  ["Under spec by {short}. 2nd hand lost same rd.", "loss", {"s": [2, 2]}],
  ["Top mark; two strokes of the sign.", "overreact", {"s": [2, 2]}],
  ["1st hand: S first every pg.", "el:S", {"s": [2, 2]}],
  ["Dead pg. {dud}, nothing to act on.", "waste", {"s": [2, 2]}],
  ["{bestorder} runs {bestn}.", null, {"s": [2, 2], "by": "tenant0"}],
  ["Yield {yield}, not {yield+1}.", null, {"s": [2, 2], "by": "tenant0"}],
  ["Page {page}: {dud} needs {dudneeds}.", null, {"s": [2, 2], "by": "tenant0"}],
  ["The chain could reach {bestn}.", "chain", {"s": [2, 2], "by": "tenant0"}],
  ["The yield for page {page} should read {yield}.", null, {"s": [2, 2], "by": "tenant1"}],
  ["The order {bestorder} is better on this molecule.", null, {"s": [2, 2], "by": "tenant1"}],
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
  ["9 March. The third hand's line for this molecule: {bestorder}.", null, {"s": [3, 3]}],
  ["12 March. New entry in the first hand under my page {page}.", null, {"s": [3, 3]}],
  ["14 March. The second hand has corrected my sum to {yield}.", null, {"s": [3, 3]}],
  ["29 March. The King's column and mine agree for round {round}.", null, {"s": [3, 3]}],
  ["23 March. Round {round} begun, spec {spec}.", "start", {"s": [3, 3]}],
  ["24 March. The sign whole under the molecule.", "sigil", {"s": [3, 3]}],
  ["25 March. Spec met by {over}.", "win", {"s": [3, 3]}],
  ["26 March. Under spec by {short}.", "loss", {"s": [3, 3]}],
  ["28 March. Saw his face in the flask at the top mark.", "overreact", {"s": [3, 3], "big": true}],
  ["1 April. Chain of {n}; the face stayed for all of it.", "chain", {"s": [3, 3], "c": {"n": [2, 999]}}],
  ["{bestorder} here.", null, {"s": [3, 3], "by": "tenant0"}],
  ["Yield {yield}.", null, {"s": [3, 3], "by": "tenant0"}],
  ["The chain can reach {bestn}.", null, {"s": [3, 3], "by": "tenant0"}],
  ["Met by {over}.", "win", {"s": [3, 3], "by": "tenant0"}],
  ["The spec for this round is {spec}.", null, {"s": [3, 3], "by": "tenant1"}],
  ["The round was lost by {short}.", "loss", {"s": [3, 3], "by": "tenant1"}],
  ["The top mark came at reflex {n}.", "overreact", {"s": [3, 3], "by": "tenant1", "c": {"n": [1, 999]}}],
  ["Yld p. {page} = {yield}.", null, {"s": [3, 3], "by": "tenant2"}],
  ["{bestorder} next pg.", null, {"s": [3, 3], "by": "tenant2"}],
  ["Refl. {n}, poss. {bestn}.", null, {"s": [3, 3], "by": "tenant2"}],
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
  const unused = n => used.indexOf(n.t) < 0;
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
