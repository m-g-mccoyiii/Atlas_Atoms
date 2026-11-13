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
//   fb      a rule of thumb with no slots: only offered when nothing about the present page fits (as when the page passes no ctx)
// Sources: R. W. Chambers, The King in Yellow (1895) and Ambrose Bierce only. Nothing later. See the rights rule in NOTES_WRITING.md.
// Every row below is one line and is valid JSON, so the check script can read it without running the file.
(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
const NOTES = [];
function push(r, base) {
  const o = r[2] || {}, n = Object.assign({ t: r[0] }, base), seen = {};
  if (o.u) n.unlocks = o.u; if (o.hand) n.hand = o.hand; if (o.s) n.sign = o.s;
  if (r[1]) n.when = r[1];
  if (o.big) n.big = true; if (o.round) n.round = o.round; if (o.till) n.till = o.till; if (o.count) n.count = o.count; if (o.by) n.by = o.by; if (o.c) n.cond = o.c; if (o.fb) n.fb = true;
  n.slots = []; n.t.replace(/\{([a-z0-9]+)(?:[+-]\d+)?\}/g, (m, k) => { if (!seen[k]) { seen[k] = 1; n.slots.push(k); } return m; });
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

// ---- rules of thumb, no slots: only when nothing about the present page fits ----
lab([0, 3], 'neat', [
  ["Rings want five or six atoms.", null, {"fb": true}],
  ["Check for a C=O before lining up reduce.", null, {"fb": true}],
  ["Oxidize fired last leaves its C=O too late for the page's rings.", null, {"fb": true}],
  ["Dehydrate straight after hydrate puts the molecule back.", null, {"fb": true}],
  ["Third use of a reagent is the last.", null, {"fb": true}],
  ["Hydrate puts the OH on the inner carbon, hydroborate on the end one.", null, {"fb": true}],
  ["Dehydrate leaves a C=C where the OH was.", null, {"fb": true}],
  ["Grow adds three carbons each time.", null, {"fb": true}],
  ["The pair reflex needs two SH.", null, {"fb": true}],
  ["A knit wants the nitrogen near a C=O.", null, {"fb": true}],
  ["Strip is the only thing that takes a Cl off.", null, {"fb": true}],
  ["A line repeated on the next page gives less.", null, {"fb": true}],
  ["Oxidize then reduce brings it back to where it started, with losses.", null, {"fb": true}],
  ["A reagent that acts nowhere still spends its use.", null, {"fb": true}]
]);

// ---- the molecule and the page as they stand (no tag) ----
lab([0, 0], 'neat', [
  ["{atoms} heavy atoms on the molecule at the start of page {page}."],
  ["{formula} at the start of round {round}."],
  ["Rings on the molecule: {rings}."],
  ["Uses left on {reagent}: {uses}."],
  ["Round {round}, page {page}: spec {spec}, yield so far {yield}."],
  ["Short of the spec by {short} with page {page} to play."],
  ["Over the spec by {over} already."],
  ["Last page: {r1}, {r2}, {r3}, for {n} reflexes.", null, {"c": {"n": [2, 999]}}],
  ["{dud} added nothing on the last page."],
  ["The molecule went from {atoms0} to {atoms} heavy atoms on the last page."],
  ["Try {r2} before {r1} on the next page."],
  ["{formula}: {rings} rings, {atoms} heavy atoms."],
  ["Yield after page {page}: {yield} against a spec of {spec}."],
  ["Reflexes on the last page, in order: {kinds}."],
  ["{left} given off so far this round: {leftn}."],
  ["Gold in the tin: {gold}."],
  ["{r3} went last on that page; try it first."],
  ["Rings before the last page {rings0}, after it {rings}."]
]);

// ---- what has just happened ----
lab([0, 3], 'neat', [
  ["New round; count the C=O and the OH before lining up.", "start"],
  ["Round {round}. Spec {spec}.", "start"],
  ["Starting molecule {formula}, {atoms} heavy atoms.", "start"],
  ["Round {round} begins with {rings} rings on the molecule.", "start"],
  ["Round {round} of this run, gold in the tin {gold}.", "start"],

  ["{reagent} acted in {places} places.", "fire", {"c": {"places": [2, 99]}}],
  ["{reagent} found one place only.", "fire", {"c": {"places": [1, 1]}}],
  ["Places acted on by {reagent}: {places}.", "fire"],
  ["{reagent} has {uses} uses left after that.", "fire", {"c": {"uses": [2, 9]}}],
  ["Next use of {reagent} is the last.", "fire", {"c": {"uses": [1, 1]}}],
  ["{reagent} is spent for the round.", "fire", {"c": {"uses": [0, 0]}}],
  ["{reagent} set off {n} reflexes by itself.", "fire", {"c": {"n": [2, 999]}}],
  ["Fired {r1}, then {r2}, then {r3}.", "fire"],

  ["A {kind} fired without a reagent.", "reflex"],
  ["First reflex of the page was a {kind}.", "reflex"],
  ["{kind} straight after {reagent}.", "reflex"],
  ["Reflexes so far this page: {kinds}.", "reflex"],

  ["Ring number {rings} closed on this molecule.", "ring"],
  ["{rings} rings now, from {rings0} at the start of the page.", "ring"],
  ["The ring closed after {reagent}.", "ring"],
  ["A ring closed by {kind}.", "ring"],

  ["That page gave off {left}, {leftn} in all.", "left"],
  ["{left} off into the jar: {leftn}.", "left"],
  ["{left} came off at the {kind} step.", "left"],
  ["The {left} jar took {leftn} from page {page}.", "left"],

  ["Page {page} made {pageyield}.", "page"],
  ["Page {page}: {r1}, {r2}, {r3}; yield {pageyield}.", "page"],
  ["{n} reflexes on page {page}.", "page", {"c": {"n": [2, 999]}}],
  ["Page {page} left the molecule at {atoms} heavy atoms and {rings} rings.", "page"],
  ["Yield stands at {yield} of {spec} after page {page}.", "page"],
  ["Try {r3} first on the next page.", "page"],

  ["Reached {mark} on page {page}.", "mark"],
  ["{mark} at a yield of {yield}.", "mark"],
  ["The {mark} mark came at reflex {n}.", "mark", {"c": {"n": [1, 999]}}],
  ["{mark} reached with {r1}, {r2}, {r3}.", "mark"],

  ["Spec met; the same line again next round if the five dealt allow it.", "win"],
  ["Met the spec by {over}.", "win"],
  ["Round {round} met: {yield} against {spec}.", "win"],
  ["Spec met on page {page}.", "win"],
  ["{r1}, {r2}, {r3} on page {page} is the line that met it.", "win"],
  ["Met it with {n} reflexes on the last page.", "win", {"c": {"n": [2, 999]}}],

  ["Under spec; count the places before lining up next time.", "loss"],
  ["Lost the round; the order on the last page was wrong.", "loss"],
  ["Under the spec by {short}.", "loss"],
  ["Round {round} lost at {yield} of {spec}.", "loss"],
  ["Try {r3} before {r1} next time.", "loss"],
  ["{dud} acted nowhere on the page that lost it.", "loss"],
  ["Lost at round {round}, page {page}.", "loss"],

  ["It went on reacting after the third reagent.", "overreact"],
  ["Top mark, and the chain made it, not the three reagents.", "overreact"],
  ["Overreact at a yield of {yield}.", "overreact"],
  ["Overreact from {r1}, {r2}, {r3} on page {page}.", "overreact"],
  ["Top mark after {n} reflexes.", "overreact", {"c": {"n": [2, 999]}}],
  ["Overreact; {left} given off, {leftn}.", "overreact"],
  ["Overreact on round {round}: {over} over a spec of {spec}.", "overreact"],

  ["Each ring that closed set up the next.", "chain"],
  ["The chain ran without another reagent.", "chain"],
  ["{n} reflexes from one line.", "chain", {"c": {"n": [2, 999]}}],
  ["Chain of {n}: {kinds}.", "chain", {"c": {"n": [2, 999]}}],
  ["{n} reflexes after {reagent}.", "chain", {"c": {"n": [2, 999]}}],
  ["Chain of {n} on page {page} of round {round}.", "chain", {"c": {"n": [2, 999]}}],

  ["That reagent acted nowhere and the use is gone.", "waste"],
  ["Nothing on the molecule for that reagent to act on.", "waste"],
  ["{dud} acted nowhere.", "waste"],
  ["{dud} had nothing to act on in {formula}.", "waste"],
  ["Do not line up {dud} on this molecule again.", "waste"],
  ["Check for a place before lining up {dud}.", "waste"],

  ["Buy for the page that failed last round.", "shop"],
  ["Gold {gold} at Dunmore's.", "shop"],
  ["{gold} gold to spend before round {round}.", "shop"],
  ["Dunmore has {item} at {price}.", "shop"],

  ["New piece on the bench; try it on page one.", "buy"],
  ["Bought {item} for {price}.", "buy"],
  ["{item} bought; {gold} gold left.", "buy"],
  ["{price} gold to Dunmore for {item}.", "buy"],
  ["{item} goes on the bench for round {round}.", "buy"],

  ["A finding opens the next thing on Dunmore's shelf.", "unlock"],
  ["Finding: {finding}.", "unlock"],
  ["{finding}, entered on round {round}.", "unlock"],
  ["{finding}; Dunmore says it opens the next shelf.", "unlock"],

  ["Instrument used; compare this page's yield with the page before.", "instrument"],
  ["{instrument} used on page {page}.", "instrument"],
  ["Used {instrument}; yield for the page {pageyield}.", "instrument"],
  ["{instrument} before {r1} this time.", "instrument"],

  ["Each sigil breaks one rule for the round.", "sigil"],
  ["{sigil} drawn for round {round}.", "sigil"],
  ["With {sigil} on, yield {yield} against {spec}.", "sigil"],

  ["Gold is paid on the round's yield.", "gold"],
  ["{gained} gold from round {round}.", "gold"],
  ["{gained} in; tin at {gold}.", "gold"],
  ["Tin at {gold} after round {round}.", "gold"],

  ["Check whether the spec asks for a group as well as a yield.", "spec"],
  ["Spec {spec} for round {round}.", "spec"],
  ["Spec {spec}; yield so far {yield}.", "spec"],
  ["{short} to go against the spec.", "spec"],

  ["A real compound made, and the catalog takes it.", "catalog"],
  ["{compound} made; catalog entry filled.", "catalog"],
  ["{compound}: {formula}.", "catalog"],
  ["{compound} on round {round}, page {page}.", "catalog"],

  ["Nitrogen knits a ring if a C=O is near.", "el:N"],
  ["NH2 on this molecule; plan the knit.", "el:N"],
  ["N in {formula} this round.", "el:N"],
  ["Two SH close together will pair.", "el:S"],
  ["Sulfur on this one; the pair reflex is open.", "el:S"],
  ["S in {formula} this round.", "el:S"],
  ["Only strip takes the Cl off.", "el:Cl"],
  ["Chlorine on this one; plan a strip.", "el:Cl"],
  ["Cl in {formula} this round.", "el:Cl"],
  ["Bromine on this one; check what strips it.", "el:Br"],
  ["Br in {formula} this round.", "el:Br"]
]);

// ---- the creatures: what each is lit by and what it did ----
lab([0, 3], 'neat', [
  ["Water lit after four waters came off the page.", "hom:water"],
  ["Water's flood turned every C=C to OH and the rings ran again.", "hom:water"],
  ["Water takes the double bonds the next reagents wanted.", "hom:water"],
  ["Hydrogen lit with oxidize last and a chain on the page.", "hom:h2"],
  ["Hydrogen carried the chain over the page turn.", "hom:h2"],
  ["For Hydrogen, oxidize goes last and the next page must not fizzle.", "hom:h2"],
  ["Dry ice lit on the last page with two bottles never opened.", "hom:co2"],
  ["Dry ice pays for each reagent left unfired, three at most.", "hom:co2"],
  ["For Dry ice: grow, then oxidize, and leave bottles shut.", "hom:co2"],
  ["Acid lit when the molecule ended the page smaller.", "hom:acid"],
  ["Acid pays for a cutting page and leaves fewer places for the next.", "hom:acid"],
  ["For Acid: dehydrate and dry, no growth.", "hom:acid"],
  ["Wood spirit drank the reagent that found nothing and poured the rest.", "hom:wood"],
  ["Wood spirit pours in the order dealt, not mine.", "hom:wood"],
  ["Wood spirit wants the last reagent of the last page to find nothing.", "hom:wood"],
  ["Salt lit on the repeated line and gave the three uses back.", "hom:salt"],
  ["Same line as the page before, reagent for reagent, for Salt.", "hom:salt"],
  ["For Salt the repeated line finds fewer places.", "hom:salt"],
  ["Slime lit when all three reagents landed and each set off a reflex.", "hom:slime"],
  ["Slime wants a reflex from each of the three reagents.", "hom:slime"],
  ["Three small chains on one page for Slime.", "hom:slime"],
  ["Seedling wants five more atoms on the molecule every page.", "hom:seedling"],
  ["Seedling wilted when the page ended smaller.", "hom:seedling"],
  ["Seedling pays more for each page in a row it is tapped.", "hom:seedling"],
  ["Ammonia fired the page's three reagents again in the same order.", "hom:ammonia"],
  ["Ammonia lights only when nitrogen goes on.", "hom:ammonia"],
  ["Firing again with Ammonia can undo the page.", "hom:ammonia"],
  ["Brimstone ended the round at page one for three times the yield.", "hom:brimstone"],
  ["Brimstone lit when sulfur went on, and not on the last page.", "hom:brimstone"],
  ["Brimstone costs the pages not played.", "hom:brimstone"]
]);

// ---- the later tenants' own plain notes: the second writes whole sentences, the third abbreviates, the fourth dates everything ----
lab([1, 1], 'neat', [
  ["The spec for round {round} is {spec}, and the yield stands at {yield}."],
  ["I lined up {r1}, {r2} and {r3}, in that order."],
  ["The molecule has {atoms} heavy atoms and {rings} rings at this page."],
  ["I will try {r2} before {r1} on the next page."],
  ["There are {uses} uses of {reagent} remaining."],
  ["The reflexes of the last page were, in order: {kinds}."]
]);
lab([2, 2], 'neat', [
  ["Rd {round} p. {page}: spec {spec}, yld {yield}."],
  ["{r1} > {r2} > {r3}. Refl.: {n}."],
  ["Atoms {atoms}, rings {rings}."],
  ["Next: {r2} before {r1}."],
  ["{reagent}: uses left {uses}."],
  ["Refl. order: {kinds}."]
]);
lab([3, 3], 'neat', [
  ["4 March. Round {round}, spec {spec}, yield {yield}."],
  ["5 March. Fired {r1}, {r2}, {r3}; reflexes {n}."],
  ["7 March. Heavy atoms {atoms}, rings {rings}."],
  ["8 March. Next page, {r2} before {r1}."],
  ["11 March. {reagent}, uses left {uses}."],
  ["12 March. Reflexes in order: {kinds}."]
]);

// ================= THE THREAD =================
// A result that is not possible given what was fired, reported as a figure. No line hints, comments or reacts.

// ---- source (a): late in any run. Rounds 7 to 9, any player, nobody named. ----
thr('run', 1, 'neat', [
  ["Two reflexes fired at once on the same atom.", null, {"round": [7, 9]}],
  ["The chain ran one step on after the molecule had nothing left to move.", null, {"round": [7, 9]}],
  ["A weld formed on a molecule with one ring; a weld needs two.", null, {"round": [7, 9]}],
  ["One carbon is in the tally with five bonds.", null, {"round": [7, 9]}],
  ["Yield went up between pages with nothing fired.", null, {"round": [7, 9]}],
  ["A reagent fired a fourth time this round.", null, {"round": [7, 9]}],
  ["The molecule began this page a ring larger than it ended the last.", null, {"round": [7, 9]}],
  ["Water came off a molecule with no OH on it.", null, {"round": [7, 9]}],
  ["A ring opened and closed again with nothing fired.", null, {"round": [7, 9]}],
  ["A tuck closed onto a carbon that already had four bonds.", null, {"round": [7, 9]}],
  ["Round {round}: yield {yield+1} on the page, {yield} by my sum.", null, {"round": [7, 9]}],
  ["Round {round}, page {page}: {n+1} reflexes in the tally, {n} on the molecule.", null, {"round": [7, 9]}]
]);

// ---- source (e), first rung: any round, from the first run ----
thr('career', 1, 'neat', [
  ["One ring more on the molecule than I closed."],
  ["A use is gone from a bottle that was not dealt this page."],
  ["Three marks are inked on the yield track and the yield has passed two."],
  ["One more reflex in the tally than the line can give."],
  ["The yield was entered on the page before the last reagent fired."],
  ["A fourth reagent is entered in this page's line; three were lined up."],
  ["The product weighs more than the atoms on the page allow."],
  ["Runoff in the jar that nothing on the page gave off."],
  ["A reflex fired between pages, with nothing lined up."],
  ["The slate shows a use chalked off that I did not fire."],
  ["{rings+1} rings counted on the molecule; {rings} were closed."],
  ["{atoms+1} heavy atoms counted on a molecule that should have {atoms}."],
  ["{n+1} reflexes counted from a line that gives {n}."],
  ["The slate shows {uses} uses left on {reagent}; the bottle holds {uses+1}."],
  ["The {left} jar holds {leftn+1}; {leftn} came off."],
  ["Tin holds {gold+1} gold against {gold} in the ledger."],
  ["The spec card reads {spec+3}; it read {spec} at the start of the round."],
  ["Yield for page {page} was on the page before {r3} fired."]
]);

// ---- source (b): something happened. Nobody named; any player. ----
thr('event', 1, 'neat', [
  ["The overreact mark was inked before the yield reached it.", "overreact"],
  ["It overreacted on two reagents; the third was never fired and is spent.", "overreact"],
  ["Top mark at {yield}, with {yield+1} already written beside it.", "overreact"],
  ["The chain to the top mark had {n+1} steps; {n} are possible.", "overreact"],
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
  ["Gold counted at {gold+1} on Dunmore's scale, {gold} on mine.", "shop"],
  ["The instrument bought today is already in my ledger, at the same price.", "buy"],
  ["Paid {price} for {item}; the ledger shows {price-1}.", "buy"],
  ["The finding was already entered in the back pages.", "unlock"],
  ["{finding} is entered twice, the first before today.", "unlock"],
  ["The instrument acted on a page I did not use it on.", "instrument"],
  ["{instrument} shows a reading for a fourth page.", "instrument"],
  ["The sigil was under the molecule before I drew it.", "sigil"],
  ["The sigil broke a second rule besides its own.", "sigil"],
  ["One coin more in the tin than the round paid.", "gold"],
  ["{gained+1} gold in the tin from a round that paid {gained}.", "gold"],
  ["The spec card and my copy of it differ by two.", "spec"],
  ["Spec {spec} on the card and {spec+2} in the notebook.", "spec"],
  ["The catalog entry was filled before the compound was made.", "catalog"],
  ["{compound} is in the catalog twice.", "catalog"],
  ["Page one of the round has a line entered already.", "start"],
  ["The molecule dealt for round {round} has a ring the card does not show.", "start"],
  ["The sulfur paired with a second SH that the molecule does not have.", "el:S"],
  ["A yellow solid came off a page where no sulfur was fired.", "el:S"],
  ["Sulfur count on the molecule is one over the formula.", "el:S"],
  ["The nitrogen knitted a ring before anything was fired.", "el:N"],
  ["The Cl was stripped before strip was fired.", "el:Cl"],
  ["The Br is on a different carbon than at the start of the page.", "el:Br"],
  ["{reagent} acted in {places+1} places on a molecule with {places}.", "fire"],
  ["The jar shows {left} at {leftn+1} from a page that gave {leftn}.", "left"],
  ["The {mark} mark was inked before the yield reached it.", "mark"],
  ["A ring closed across seven atoms.", "ring"],
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
  ["Slime lit with two reagents landed.", "hom:slime"],
  ["Seedling's row stands at four pages in a round of three.", "hom:seedling"],
  ["Ammonia lit with no nitrogen on the page.", "hom:ammonia"],
  ["Brimstone lit with no sulfur on the page.", "hom:brimstone"]
]);
thr('hom', 2, 'neat', [
  ["Water's tap is in the tally for page two with no tap made.", "hom:water", {"s": [0, 3]}],
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
  ["Ten runs lost, each at a yield ending in 7.", null, {"count": ["runs_lost", 10, 14]}],
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
  ["The uses for this round were chalked on the slate before page one.", null, {"till": 3}],
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
  ["He lines up {r3} first where I put {r1}."],
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
  ["His line for this molecule was {r2}, {r1}, {r3}.", null, {"s": [1, 1]}],
  ["He records {n+1} reflexes from the line that gave me {n}.", null, {"s": [1, 1]}],
  ["There is a correction under my yield for page {page}, in the earlier hand.", null, {"s": [1, 1]}],
  ["The earlier hand has changed my {yield-3} to {yield}, which the tally confirms.", null, {"s": [1, 1]}],
  ["His last full round had the same spec as my round {round}, {spec}.", null, {"s": [1, 1]}],
  ["First run on this bench, with the earlier tenant's line for round one.", "start", {"s": [1, 1]}],
  ["One stroke of the sign under the molecule at the overreact.", "overreact", {"s": [1, 1]}],
  ["The finding I entered today is also on his page 9.", "unlock", {"s": [1, 1]}],
  ["Lost at round {round}, where his first run also stopped.", "loss", {"s": [1, 1]}],
  ["Met the spec by {over}; his entry for the same round is {over+2}.", "win", {"s": [1, 1]}],
  ["The earlier hand fires the sulfur first on every page.", "el:S", {"s": [1, 1]}],
  ["Rings want five or six.", null, {"s": [1, 1], "by": "tenant0"}],
  ["{r3} should have gone before {r1}.", null, {"s": [1, 1], "by": "tenant0"}],
  ["Chain was {n}, not {n-1}.", null, {"s": [1, 1], "by": "tenant0", "c": {"n": [2, 999]}}],
  ["Yield {yield}. The sum above is out.", null, {"s": [1, 1], "by": "tenant0"}],
  ["{dud} has nothing to act on here.", "waste", {"s": [1, 1], "by": "tenant0"}]
]);
// lap 2: the third tenant. He abbreviates. Two earlier hands in the margins.
thr('sign', 4, 'neat', [
  ["Notebook: two hands before mine, 140 pp.", null, {"s": [2, 2]}],
  ["Last entries: 1st hand rd 9 p. 2, 2nd hand rd 6 p. 1.", null, {"s": [2, 2]}],
  ["Yld 2/5 over calc., method unchanged.", null, {"s": [2, 2]}],
  ["Two strokes of the sign under mol., all rd.", null, {"s": [2, 2]}],
  ["Both hands keep a 2nd ledger col., headed 'the King'.", null, {"s": [2, 2]}],
  ["This cpd: 1st hand yld {yield+6}, 2nd hand {yield+2}, mine {yield}.", null, {"s": [2, 2]}],
  ["1st hand's line here: {r2} > {r1} > {r3}.", null, {"s": [2, 2]}],
  ["2nd hand gets {n+1} refl. from my line.", null, {"s": [2, 2]}],
  ["New corr. under my yld p. {page}, 1st hand.", null, {"s": [2, 2]}],
  ["2nd hand corrected my sum to {yield}.", null, {"s": [2, 2]}],
  ["Run 1 this bench. Line for rd 1 from 2nd hand's card.", "start", {"s": [2, 2]}],
  ["Spec met w. 1st hand's line.", "win", {"s": [2, 2]}],
  ["Under spec by {short}. 2nd hand lost same rd.", "loss", {"s": [2, 2]}],
  ["Top mark; two strokes of the sign.", "overreact", {"s": [2, 2]}],
  ["1st hand: S first every pg.", "el:S", {"s": [2, 2]}],
  ["Dead pg. {dud}, nothing to act on.", "waste", {"s": [2, 2]}],
  ["{r2} first on this molecule.", null, {"s": [2, 2], "by": "tenant0"}],
  ["Yield {yield}, not {yield+1}.", null, {"s": [2, 2], "by": "tenant0"}],
  ["Page {page}: {dud} found nothing.", null, {"s": [2, 2], "by": "tenant0"}],
  ["The chain could reach {n+1}.", "chain", {"s": [2, 2], "by": "tenant0"}],
  ["The yield for page {page} should read {yield}.", null, {"s": [2, 2], "by": "tenant1"}],
  ["{r1} is better placed third on this molecule.", null, {"s": [2, 2], "by": "tenant1"}],
  ["The uses of {reagent} remaining are {uses}.", null, {"s": [2, 2], "by": "tenant1"}],
  ["The spec was met on page {page}.", "win", {"s": [2, 2], "by": "tenant1"}]
]);
// lap 3: the fourth tenant. He dates everything. Three earlier hands in the margins. The King in Yellow is written in full only here.
thr('sign', 5, 'neat', [
  ["2 March. Notebook in three hands before mine, 210 pages.", null, {"s": [3, 3]}],
  ["4 March. Last entries of the three hands: round 9, round 6, round 8.", null, {"s": [3, 3]}],
  ["6 March. Three strokes of the sign under the molecule for the whole round.", null, {"s": [3, 3]}],
  ["7 March. Yield three fifths over the method.", null, {"s": [3, 3]}],
  ["15 March. Each earlier hand keeps a second column of yields, headed 'the King'.", null, {"s": [3, 3]}],
  ["21 March. In the first hand's ledger the second column is headed The King in Yellow.", null, {"s": [3, 3]}],
  ["27 March. The sign is whole under the molecule from page one.", null, {"s": [3, 3]}],
  ["3 March. Yields for this compound: {yield+6}, {yield+2}, {yield+1}, and mine {yield}.", null, {"s": [3, 3]}],
  ["9 March. The third hand's line for this molecule: {r3}, {r1}, {r2}.", null, {"s": [3, 3]}],
  ["12 March. New entry in the first hand under my page {page}.", null, {"s": [3, 3]}],
  ["14 March. The second hand has corrected my sum to {yield}.", null, {"s": [3, 3]}],
  ["29 March. The King's column and mine agree for round {round}.", null, {"s": [3, 3]}],
  ["23 March. Round {round} begun, spec {spec}.", "start", {"s": [3, 3]}],
  ["24 March. The sign whole under the molecule.", "sigil", {"s": [3, 3]}],
  ["25 March. Spec met by {over}.", "win", {"s": [3, 3]}],
  ["26 March. Under spec by {short}.", "loss", {"s": [3, 3]}],
  ["28 March. Saw his face in the flask at the top mark.", "overreact", {"s": [3, 3], "big": true}],
  ["1 April. Chain of {n}; the face stayed for all of it.", "chain", {"s": [3, 3], "c": {"n": [2, 999]}}],
  ["Hydrate first on this one.", null, {"s": [3, 3], "by": "tenant0"}],
  ["{r3} before {r1} here.", null, {"s": [3, 3], "by": "tenant0"}],
  ["Yield {yield}.", null, {"s": [3, 3], "by": "tenant0"}],
  ["The chain can reach {n+1}.", null, {"s": [3, 3], "by": "tenant0"}],
  ["Met by {over}.", "win", {"s": [3, 3], "by": "tenant0"}],
  ["The spec for this round is {spec}.", null, {"s": [3, 3], "by": "tenant1"}],
  ["{reagent} has {uses} uses remaining.", null, {"s": [3, 3], "by": "tenant1"}],
  ["The round was lost by {short}.", "loss", {"s": [3, 3], "by": "tenant1"}],
  ["The top mark came at reflex {n}.", "overreact", {"s": [3, 3], "by": "tenant1", "c": {"n": [1, 999]}}],
  ["Yld p. {page} = {yield}.", null, {"s": [3, 3], "by": "tenant2"}],
  ["{r2} > {r1} next pg.", null, {"s": [3, 3], "by": "tenant2"}],
  ["Refl. {n}, poss. {n+1}.", null, {"s": [3, 3], "by": "tenant2"}],
  ["{dud}: nothing to act on.", "waste", {"s": [3, 3], "by": "tenant2"}],
  ["Rd {round}. Spec {spec}.", "start", {"s": [3, 3], "by": "tenant2"}]
]);

AA.NOTES = NOTES;
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
  const s = state || {}, u = clamp(s.unlocks), g = Math.max(0, Math.min(3, s.sign | 0)), ctx = s.ctx || {};
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
  const c = ctx || {}, t = typeof note === 'string' ? note : note.t;
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
