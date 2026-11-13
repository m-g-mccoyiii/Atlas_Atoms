// Overreact: the margin notes (rulings AI, AM, AM2, AM3, AM4; the story is docs/STORY.md; how to write more is docs/NOTES_WRITING.md).
// One working chemist's notes to himself. Plain, specific, unperformed. Most are about the work.
// A thread runs through them (the thin book, someone in the room, the King in Yellow). It is peppered in from the first runs,
// lightly, from six sources, and it is written as plainly as the rest: a wrong thing recorded like a boiling point.
//   AA.NOTES             every note: { t, band, src, depth, unlocks, hand, when, thread, rung, till, sign, round, count, by, big }
//   AA.notesPick(state)  the notes that fit a state { depth, unlocks, round, tag, homs, used, sign, counts, since, seen, seed }
//   AA.notesDepth(unlocks, round, rounds, chain)  the scale 0..1 the plain notes are ranged on (career 0.65, run 0.30, chain 0.05)
//   AA.notesReach(state) how far up the reveal ladder this player may read, 1..5
//   AA.notesRate(state)  the thread budget: { rate, gap, p, c } (share of notes that are thread lines; plain notes kept between two)
//   AA.notesParse(t)     splits ~struck~ and _under_ marks into pieces for the pen
// What makes a note eligible is in its own data:
//   src     'lab' (plain) or, for a thread line, where it comes from: 'run' (late rounds of any run), 'event' (something happened: its tag),
//           'hom' (a creature owned), 'count' (a lifetime count), 'career' (share of unlocks, by the ladder), 'sign' (laps of the sign)
//   rung    the ladder: 1 an oddity, nobody named; 2 someone, and the thin book; 3 he and his face; 4 the King; 5 the King in Yellow
//   till    the last rung at which the line is still shown (a story beat that has passed is dropped)
//   sign    [min, max] laps of the sign taken (meta.sign, 0 to 3)       unlocks, depth, round  [min, max]
//   count   [key, from, to] a lifetime count (meta.counters added to meta.countersAll) inside that window
//   when    a tag: start win loss overreact chain waste shop buy unlock instrument sigil gold spec catalog
//           el:N el:S el:Cl el:Br   hom:water hom:h2 hom:co2 hom:acid hom:wood hom:salt hom:slime hom:seedling hom:ammonia hom:brimstone
//   by      'other': written by the second hand (lap 3). The page should draw it in another hand.
// Sources: R. W. Chambers, The King in Yellow (1895) and Ambrose Bierce only. Nothing later. See the rights rule in NOTES_WRITING.md.
// Every row below is one line and is valid JSON, so the check script can read it without running the file.
(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
const NOTES = [];
function push(r, base) {
  const o = r[2] || {}, n = Object.assign({ t: r[0] }, base);
  if (o.d) n.depth = o.d; if (o.u) n.unlocks = o.u; if (o.hand) n.hand = o.hand; if (o.s) n.sign = o.s;
  if (r[1]) n.when = r[1];
  if (o.big) n.big = true; if (o.round) n.round = o.round; if (o.till) n.till = o.till; if (o.count) n.count = o.count; if (o.by) n.by = o.by;
  NOTES.push(n);
}
// plain notes: a depth range, a hand, rows of [text, when, overrides]
function lab(d, hand, rows) { rows.forEach(r => push(r, { band: 1, src: 'lab', depth: d, unlocks: [0, 1], hand })); }
// thread lines: a source, a rung of the ladder, a hand, rows of [text, when, overrides]. Rungs 2 to 4 belong to the first time through
// (sign 0) unless a row says otherwise; rungs 1 and 5 are read on every lap.
function thr(src, rung, hand, rows) {
  rows.forEach(r => push(r, { band: rung + 1, src, thread: true, rung, till: 5, depth: [0, 1], unlocks: [0, 1], sign: rung === 1 || rung === 5 ? [0, 3] : [0, 0], hand }));
}

// ================= PLAIN NOTES (band 1). No thread. =================

// ---- early in a run, or early in a career: the room, the rent, the routine ----
lab([0, 0.7], 'neat', [
  ["Rent is due on the 1st. Dunmore's bill on the 3rd."],
  ["Label the clear ones first."],
  ["Do not taste anything on the bench."],
  ["Mr Pike came up about the smell. Opened the window."],
  ["Wash the glassware tonight, not tomorrow."],
  ["Cat was on the bench again. Hair in the 250 ml flask."],
  ["Oxidize then reduce brings it back to where it started, with losses."],
  ["Pencil for guesses, ink for results."],
  ["Inspection is Thursday. Clear the kettle off the bench before then."],
  ["Dehydrate drove water off onto the page. The smudge at left is that."],
  ["Runoff goes in the jars, not down the sink. Pike's pipes are lead."],
  ["Sugar is in the tin with the red lid."],
  ["Owe the man next door one stopper, size 19."],
  ["Burned the right cuff on the burner."],
  ["Dunmore will give credit to the end of the month and not after."],
  ["Hydroborate needs the dry flask. The one on the rack is not dry."],
  ["Coffee cold again by ten."],
  ["Balance reads 0.02 heavy. Subtract it until it is fixed."],
  ["New stirrer bar is too long for the small flask."],
  ["Fumes from the hydrate step sting. Keep the sash low."],
  ["Ran out of clean droppers by noon."],
  ["The lamp dips when Pike runs his gas ring downstairs."],
  ["Ice from the fishmonger, twopence."],
  ["Weighed the product twice. 1.84 g both times."],
  ["Left the gas on low over lunch."],
  ["Crystals came out long and white, like the picture in the textbook."],
  ["The stopper is stuck in the reduce bottle. Warm it, do not force it."],
  ["Rain got in at the sash. Moved the notebook to the dry end."],
  ["Third reagent is nearly out. Order before Friday."],
  ["Bench is level now. Folded card under the left leg."],
  ["Product smells of pears."],
  ["Slept six hours. First time this week."],
  ["Thermometer in the bath reads 2 low against the good one."],
  ["Bread and cheese at the bench; keep it off the page."],
  ["Rings close better when the bath is warm. Keep it near 40."],
  ["Chalked the three uses of each reagent on the slate."],
  ["Room is cold until the burner has been on an hour."],
  ["Wrote the boiling points inside the cover so I stop looking them up."],
  ["Mother's letter came. Answer it Sunday."],
  ["Swept under the bench. Found the missing size 14 stopper."],
  ["Dunmore's boy brought the wrong grade of oxidize. Sent it back with him."],
  ["Paid Pike the rent in full."]
]);

// ---- any time: how the chemistry goes, written down so it is not forgotten ----
lab([0, 1], 'neat', [
  ["A weld needs two rings side by side. I keep forgetting that."],
  ["Tuck then weld gave more than weld then tuck. Try again to be sure."],
  ["Reduce only acts on C=O. Check there is one before lining it up."],
  ["Third use of a reagent is the last. Count before lining up."],
  ["Stable by page one, unstable by page two. Volatile takes all three pages."],
  ["Dry first, hydrate after. The other order undoes itself."],
  ["The long chain will not close. Rings want five or six."],
  ["Grow adds three carbons each time. Counted them."],
  ["Emptied the runoff jars. The water jar fills fastest."],
  ["Burner tube is cracking near the tap. Replace it."],
  ["Ink bottle is a third full."],
  ["Six reagents on the shelf, five dealt each page. Rarely the same five."],
  ["Two OH close together gave a ring without my doing anything."],
  ["Oxidize last is too late for that page's rings."],
  ["Filter paper: four sheets left."],
  ["Strip took the Cl off cleanly at the second try."],
  ["The pair reflex needs two SH. One alone does nothing."],
  ["A knit wants the nitrogen near a C=O. Three carbons apart worked."],
  ["Draught from the door moves the flame. Rolled a towel along the bottom."],
  ["An OH four carbons from a C=O tucks. Five apart did not."],
  ["Hydrate put the OH on the inner carbon. Hydroborate puts it on the end one."],
  ["The same line gave less the second time. Fewer places left to act."],
  ["Wrote today's best line on a card and pinned it over the bench."],
  ["Yield is counted at the end of the page, not when the flask stops moving."],
  ["Dehydrate leaves a C=C where the OH was. Useful for the next page."]
]);

// ---- late in a run: tired, and the numbers are large ----
lab([0.35, 1], 'shaky', [
  ["Eleven hours at the bench. Hands smell of the dehydrate."],
  ["Tea made at four is still on the sill."],
  ["Spilled reduce on the left page. It dried white."],
  ["Cannot read my own 7s from this morning. They could be 1s."],
  ["Have not eaten since the bread."],
  ["Lamp oil is low. One more round on what is left."],
  ["Wrote the bath temperature twice on this page."],
  ["Eyes sting from the fumes."],
  ["Missed the post again."],
  ["Pike knocked on his ceiling with the broom at midnight."],
  ["Dropped the small flask. Swept it up. Four left."],
  ["The spec for this round is more than the last two together."],
  ["Stood up too fast. Sat down again for a minute."],
  ["I have not been this far on this notebook before."],
  ["Glassware is all in use. Rinsing between pages now."],
  ["Counted the uses wrong. Hydrate is spent."],
  ["Window is light again. I did not see it get dark."],
  ["Hands shaking a little after the fourth coffee."],
  ["Weighing by lamplight. Check these figures in the morning."],
  ["Scorched the notebook cover on the burner."],
  ["Cat asleep on my coat."],
  ["Forgot to write down page two. Worked it out again from the runoff."],
  ["Back aches from the stool. Ask Pike about a chair."],
  ["Every reagent has one use left."],
  ["The numbers on this page are larger than any I have written before."],
  ["Fire is out in the grate."],
  ["Wrote the yield in the wrong column. Corrected in ink."]
]);

// ---- things that happen ----
lab([0, 1], 'neat', [
  ["New page. Flask is clean and dry.", "start"],
  ["Start of run. Six bottles checked, all above half.", "start"],
  ["Lined up three and read them back before firing.", "start"],
  ["Bench cleared. Date at the top of the page.", "start"],
  ["New notebook from Dunmore. The paper is thinner than the last.", "start"],
  ["Begin again. Yesterday's run stopped at round two.", "start"],
  ["Same starting compound as Monday. Different line this time.", "start"],
  ["Lit the burner at nine.", "start"],
  ["Met the spec with a little over.", "win"],
  ["Round done. Product bottled and labelled before anything else.", "win"],
  ["Over the spec by a third. Wrote the line down so I can do it again.", "win"],
  ["Spec met on the last page. It was close.", "win"],
  ["Passed. Supper at eleven.", "win"],
  ["Yield higher than I expected; balance checked.", "win"],
  ["Round won. The next spec is on the card already.", "win"],
  ["Good round. The second page did most of it.", "win"],
  ["Under the spec. The yield would not come up.", "loss"],
  ["Lost the round on page three. Nothing left to fire.", "loss"],
  ["Failed. The second reagent was the mistake.", "loss"],
  ["Short of the spec by a little.", "loss"],
  ["Run over. Washed up and went to bed.", "loss"],
  ["Under spec. I lined them up in the wrong order.", "loss"],
  ["Lost it. Wrote down where, for next time.", "loss"],
  ["Did not meet it.", "loss"],
  ["It overreacted. Went on by itself long after the third reagent.", "overreact"],
  ["Top mark. The flask was too hot to hold for ten minutes.", "overreact"],
  ["Overreact. I have the line written down exactly.", "overreact"],
  ["Past volatile and still going. Stood back from the bench.", "overreact"],
  ["Overreacted. Runoff filled two jars.", "overreact"],
  ["That is the most yield I have had from one page.", "overreact"],
  ["One reflex set off the next. Six before it stopped.", "chain"],
  ["Still going. Put the pen down to watch.", "chain"],
  ["Tuck, weld, tuck. Same order as last time.", "chain"],
  ["Long chain. Runoff came off faster than I could change jars.", "chain"],
  ["Each ring that closed made room for another.", "chain"],
  ["Counted nine reflexes. May have missed one.", "chain"],
  ["That reagent acted nowhere. A use gone for nothing.", "waste"],
  ["Nothing reacted on that page.", "waste"],
  ["Reduce found no C=O. I should have looked.", "waste"],
  ["Dead page. One use each off three bottles.", "waste"],
  ["Lined up hydrate on a molecule with nothing to hydrate.", "waste"],
  ["Wasted the second page. One left to make the spec.", "waste"],
  ["Dunmore's prices are up again since last month.", "shop"],
  ["Dunmore's list has two instruments under 30 gold.", "shop"],
  ["At the supplier. He keeps the good glass behind the counter.", "shop"],
  ["Dunmore has a better burner in his window, 60 gold.", "shop"],
  ["Dunmore will not split a case of reagent.", "shop"],
  ["Dunmore's shop is colder than the street.", "shop"],
  ["Bought it. Receipt is in the back of the notebook.", "buy"],
  ["Paid Dunmore in gold.", "buy"],
  ["New instrument on the bench. Read the leaflet first.", "buy"],
  ["Bought it out of the rent money.", "buy"],
  ["Carried it home under my coat because of the rain.", "buy"],
  ["Bought the cheaper one.", "buy"],
  ["A finding. Entered it in ink with the date.", "unlock"],
  ["New finding. Copied it into the back pages as well.", "unlock"],
  ["That one took forty tries. Written up now.", "unlock"],
  ["Something new on the shelf as of today.", "unlock"],
  ["Finding recorded. Dunmore says it opens the next shelf.", "unlock"],
  ["Closing two rings on one page counts as a finding.", "unlock"],
  ["Thermometer reads two degrees over my guess; go by the thermometer.", "instrument"],
  ["Goggles on for the hydrate step.", "instrument"],
  ["The clamp holds if the screw is turned past where it feels tight.", "instrument"],
  ["Used the instrument on page two. Page one would have been better.", "instrument"],
  ["The dropper delivers a little more than it says.", "instrument"],
  ["Cleaned the instrument and put it back in its case.", "instrument"],
  ["Drew the sigil under the molecule in thick pencil.", "sigil"],
  ["The sigil breaks one rule for the round. Read which one twice.", "sigil"],
  ["The sigil takes ten minutes to draw properly.", "sigil"],
  ["With the sigil on, the old line does not work. New line needed.", "sigil"],
  ["Counted the gold: 41.", "gold"],
  ["Gold from this round goes in the tin in the drawer.", "gold"],
  ["The drawer sticks. Lift and pull.", "gold"],
  ["More gold than last round.", "gold"],
  ["Paid out more than came in this week.", "gold"],
  ["Spec is on the card. Higher than last round.", "spec"],
  ["The spec asks for a ring this time, not only yield.", "spec"],
  ["Read the spec again. I had it wrong by one group.", "spec"],
  ["Met it by one.", "spec"],
  ["The spec doubled between round four and round five.", "spec"],
  ["First catalog entry filled. A real compound; Dunmore lists it.", "catalog"],
  ["Another for the catalog. Looked it up: it is used in perfume.", "catalog"],
  ["Catalog entry filled today; structure drawn in ink.", "catalog"],
  ["Made something that is in the catalog without meaning to.", "catalog"],
  ["NH2 on today's molecule. Smells of fish.", "el:N"],
  ["Nitrogen on this one. It knits rings if a C=O is near.", "el:N"],
  ["The amine stains the fingers brown by evening.", "el:N"],
  ["Sulfur on this one. Both windows open.", "el:S"],
  ["SH group. The smell is in my coat now.", "el:S"],
  ["Two SH on the molecule. They will pair if left close.", "el:S"],
  ["Chlorine on the molecule. Nose runs.", "el:Cl"],
  ["A Cl today. Strip takes it off; nothing else here does.", "el:Cl"],
  ["Chlorine compound. Keep it off the brass.", "el:Cl"],
  ["Bromine. Brown and heavy; it sinks in the flask.", "el:Br"],
  ["Br on the molecule. It stained the cork.", "el:Br"],
  ["Bromine fumes. Sash down to two inches.", "el:Br"]
]);

// ---- the creatures, as kept: what each did and what it needs ----
lab([0, 1], 'neat', [
  ["Water hatched from the full jar.", "hom:water"],
  ["Water flooded the bench after the wet page. Every C=C went to OH.", "hom:water"],
  ["Mopped up after Water.", "hom:water"],
  ["Hydrogen floats to the ceiling if let out. Tied a string to the jar.", "hom:h2"],
  ["Hydrogen carried the chain over the page turn. Oxidize has to go last.", "hom:h2"],
  ["Hydrogen was on the ceiling again. Pulled it down by the string.", "hom:h2"],
  ["Dry ice froze the tea solid in the cup.", "hom:co2"],
  ["Left two bottles shut all round and Dry ice paid for it.", "hom:co2"],
  ["Frost on the bench round the Dry ice jar. Wiped it before weighing.", "hom:co2"],
  ["Acid ate the label off its own jar; relabelled.", "hom:acid"],
  ["The molecule ended the page smaller and Acid lit up.", "hom:acid"],
  ["Use the glass rod near Acid, not a spoon.", "hom:acid"],
  ["Wood spirit drank the reagent that found nothing and poured the rest.", "hom:wood"],
  ["Wood spirit poured them in the order they were dealt, not mine.", "hom:wood"],
  ["Wood spirit is slow before noon.", "hom:wood"],
  ["Played the same line twice and Salt lit. The uses came back.", "hom:salt"],
  ["Salt has left a white crust on the shelf under its jar.", "hom:salt"],
  ["Salt keeps to the middle of its jar.", "hom:salt"],
  ["Slime lit when all three reagents landed and each set something off.", "hom:slime"],
  ["Slime got on my sleeve. It does not wash out cold.", "hom:slime"],
  ["Slime moved from one side of its jar to the other in an hour.", "hom:slime"],
  ["Seedling wants the molecule bigger every page. Five atoms at least.", "hom:seedling"],
  ["Ended a page smaller and Seedling wilted. The row starts again.", "hom:seedling"],
  ["Turned Seedling's jar to the window.", "hom:seedling"],
  ["Ammonia fired the whole page again. Same three, same order.", "hom:ammonia"],
  ["Ammonia's jar wakes Pike downstairs if opened after ten.", "hom:ammonia"],
  ["Ammonia only lights when nitrogen goes on. Plan the line for it.", "hom:ammonia"],
  ["Brimstone ended the round at page one. Three times the yield.", "hom:brimstone"],
  ["Brimstone's jar is warm to the hand. Moved it off the wooden shelf.", "hom:brimstone"],
  ["Sulfur went on and Brimstone lit. Did not tap it; I wanted the pages.", "hom:brimstone"]
]);

// ================= THE THREAD =================
// Written as flatly as the rest: one wrong thing, with a number, a direction or a material in it, and no second sentence that reacts to it.

// ---- source (a): late in any run. Rounds 7 to 9, any player, nobody named. ----
thr('run', 1, 'neat', [
  ["The shadow of the retort stand falls toward the lamp.", null, {"round": [7, 9]}],
  ["The room has smelled of the sea since page two.", null, {"round": [7, 9]}],
  ["The clock on the shelf has read ten past three for two pages.", null, {"round": [7, 9]}],
  ["Ten jars on the shelf and eleven lids.", null, {"round": [7, 9]}],
  ["The stars over the roof opposite are darker than the sky.", null, {"round": [7, 9]}],
  ["12 + 7 comes to 20 each time I add it on this page.", null, {"round": [7, 9]}],
  ["The distillate ran uphill in the condenser for about a minute.", null, {"round": [7, 9]}],
  ["The flame leans toward the flask with the window shut.", null, {"round": [7, 9]}],
  ["The runoff jar was fuller after I emptied it.", null, {"round": [7, 9]}],
  ["The flask rang for a minute after I set it down.", null, {"round": [7, 9]}],
  ["It is light outside on the west side at 2 in the morning.", null, {"round": [7, 9]}],
  ["The room is warmer at the door end than at the burner.", null, {"round": [7, 9]}],
  ["Product is pale yellow after two recrystallisations.", null, {"round": [7, 9]}],
  ["The bath has held 40 for an hour with the burner off.", null, {"round": [7, 9]}],
  ["Ink from this pen dries yellow at the edges tonight.", null, {"round": [7, 9]}],
  ["A marble set on the bench rolls east.", null, {"round": [7, 9]}],
  ["The water in the cooling trough rises and falls about an inch.", null, {"round": [7, 9]}],
  ["The lamp flame stands straight in the draught from the door.", null, {"round": [7, 9]}],
  ["Condenser water came out warmer than the vapour going in.", null, {"round": [7, 9]}],
  ["The burner flame has a second, paler flame inside it.", null, {"round": [7, 9]}]
]);

// ---- source (b): something happened. Nobody named; any player. ----
thr('event', 1, 'neat', [
  ["At the top mark the flask rang a low note for most of a minute.", "overreact"],
  ["At the top mark the liquid showed a pale sky for a second or two.", "overreact"],
  ["The flame went pale and stood still when it overreacted.", "overreact"],
  ["After the overreact the runoff in all three jars was level to a hair.", "overreact"],
  ["The reflexes came in threes and twos, in the same order each time.", "chain"],
  ["The lamp did not flicker once during the chain.", "chain"],
  ["The flask kept time during the chain, a beat every two seconds.", "chain"],
  ["The room smelled of lake water after the round was lost.", "loss"],
  ["The page for the lost round is warm along one edge.", "loss"],
  ["The failed product is the same pale yellow as the last three.", "loss"],
  ["The product is faintly yellow and the melting point is right.", "win"],
  ["The yield for this round was in the book before I weighed it.", "win"],
  ["The clock lost four minutes during the dead page.", "waste"],
  ["The reduce bottle is down by two uses after one firing.", "waste"],
  ["One line on Dunmore's list has no name and no price.", "shop"],
  ["Dunmore's scale read my gold a coin heavy.", "shop"],
  ["Change from Dunmore included a coin with two suns on one face.", "buy"],
  ["The new instrument was dusty inside its sealed box.", "buy"],
  ["The finding is entered twice in the back pages.", "unlock"],
  ["The shelf had a clean ring in the dust where the new bottle went.", "unlock"],
  ["The thermometer showed a mark above the top of its scale for a second.", "instrument"],
  ["The balance reads 0.3 lighter with the lamp behind it.", "instrument"],
  ["The sigil's lines were faintly on the page before the pencil reached them.", "sigil"],
  ["With the sigil drawn, the bench shadow fell the other way for the round.", "sigil"],
  ["One coin more in the tin than I put in.", "gold"],
  ["The spec card reads higher than it did at breakfast.", "spec"],
  ["The catalog has an entry dated next week.", "catalog"],
  ["The notebook was open at today's page when I came in.", "start"],
  ["The match burned with a yellow flame the length of my hand.", "start"],
  ["The yellow of the sulfur stays in the eye for a minute after.", "el:S"],
  ["Sulfur weighed 2.1 g on the paper and 2.1 g with the paper taken off.", "el:S"],
  ["A yellow crust has grown on the SH stopper since yesterday.", "el:S"],
  ["Sulfur fumes settled on the bench in a ring about a foot across.", "el:S"],
  ["The nitrogen knitted a ring before anything was fired.", "el:N"],
  ["Chlorine fumes went along the floor and under the door, against the draught.", "el:Cl"],
  ["Bromine vapour stood in the flask in a level line, like water.", "el:Br"]
]);

// ---- source (b), further up the ladder ----
thr('event', 2, 'neat', [
  ["At the top mark the ringing was the first bar of the song in act one.", "overreact", {"s": [0, 3]}],
  ["The chain ran in the metre of Cassilda's song, start to stop.", "chain", {"s": [0, 3]}],
  ["Lined up the wrong three with the book open beside the bath.", "loss", {"till": 2}],
  ["The ribbon in the book moved on four pages during the round.", "win", {"till": 2}],
  ["Read the cast list again while the dead page cooled.", "waste", {"till": 2}],
  ["Dunmore keeps a copy of the play on the shelf with his ledgers.", "shop"],
  ["Dunmore wrapped the instrument in a printed sheet from act one.", "buy", {"till": 3}],
  ["The finding is worded like the stage directions in the play.", "unlock", {"s": [0, 3]}],
  ["In the mirror the stool by the door has a yellow coat over it.", "instrument", {"till": 3}],
  ["The sigil is printed small at the foot of the play's title page.", "sigil"],
  ["The gold and the book's cover are the same yellow under the lamp.", "gold", {"till": 3}],
  ["The spec card was between pages 12 and 13 of the book this morning.", "spec", {"till": 3}],
  ["The catalog entry gives act two as its reference.", "catalog", {"till": 3}],
  ["Checked the book was on the top shelf before lighting the burner.", "start", {"till": 2}],
  ["The sulfur is the yellow of the book's cover, to the shade.", "el:S", {"till": 3}],
  ["Wrote the chlorine down as green; it has yellow in it.", "el:Cl", {"till": 2}]
]);
thr('event', 3, 'neat', [
  ["The overreact showed a chin and the edge of a collar in the flask.", "overreact"],
  ["Today's overreact showed a sleeve, to the elbow.", "overreact"],
  ["Towers across the lake at the overreact, lit from two sides.", "overreact", {"s": [0, 3]}],
  ["At the eighth reflex there was a shoulder in the flask.", "chain"],
  ["Each reflex cleared a little more of the mist from the glass.", "chain", {"s": [0, 3]}],
  ["He had turned to the window before the last page was fired.", "loss"],
  ["The flask was dark at the end of the round and showed nothing.", "loss"],
  ["He stayed until the product was bottled.", "win"],
  ["Nothing showed in the flask on the dead page.", "waste"],
  ["Ordered the two-litre flask from Dunmore, to see more in it.", "shop"],
  ["Bought the instrument to look into the flask with.", "buy"],
  ["Left the list of findings open on the bench for him overnight.", "unlock"],
  ["Under the loupe the flask holds a lake shore, with a figure walking on it.", "instrument", {"s": [0, 3]}],
  ["He came to the bench while I filled the circle and stayed until it was done.", "sigil"],
  ["Left three coins on the sill overnight; three there in the morning.", "gold"],
  ["Met the spec; the flask showed the lake for the rest of the page.", "spec", {"s": [0, 3]}],
  ["Read the new catalog entry aloud to the room.", "catalog"],
  ["Rolled my sleeves down and did up the cuffs before starting.", "start"],
  ["Sulfur and his coat are the same yellow.", "el:S"],
  ["The bromine stood in the flask in two layers, brown over yellow.", "el:Br", {"s": [0, 3]}]
]);
thr('event', 4, 'shaky', [
  ["At the top mark the King looked up from the book and I missed his face.", "overreact"],
  ["The mark under the molecule gained a stroke at the top mark.", "overreact"],
  ["Twenty reflexes, and the King stood at the bench for the last four.", "chain"],
  ["Said sorry aloud when the round was lost.", "loss"],
  ["Asked for one more run after this one was lost.", "loss"],
  ["Met the spec with the King in the room.", "win"],
  ["Wasted page two; the King stayed for page three.", "waste"],
  ["Dunmore served me from the back of the shop today.", "shop"],
  ["Dunmore gave change for the coin with two suns.", "buy"],
  ["Entered the finding without saying it aloud.", "unlock"],
  ["The instruments on the bench all lie pointing east this morning.", "instrument"],
  ["The mark under the molecule has five strokes and I have drawn four sigils.", "sigil"],
  ["Wrote out the offer of all gold in hand and left it with the tin.", "gold"],
  ["The spec card has a second figure under mine in rounder writing.", "spec"],
  ["One blank left in the catalog; I have not been dealt the compound in a month.", "catalog"],
  ["Began the run at nine with the King at the window.", "start"],
  ["Burned a little sulfur on the sill at nine.", "el:S"],
  ["The chlorine took the green off the brass and left it yellow.", "el:Cl"]
]);
thr('event', 5, 'neat', [
  ["The King nodded when it overreacted.", "overreact"],
  ["Stopped counting the reflexes at thirty.", "chain"],
  ["Under spec by 40, with two suns in the flask.", "loss"],
  ["Met the spec; his figure and mine agree at 20 for 12 + 7.", "win"],
  ["Dead page, and the flask stayed clear.", "waste"],
  ["Dunmore asked what I had seen.", "shop"],
  ["Dunmore took a fifth off the price without being asked.", "buy"],
  ["The instruments lie where I leave them again.", "instrument"],
  ["All 212 gold was back in the tin this morning.", "gold"],
  ["Sulfur on the bench all day with the windows shut.", "el:S"]
]);

// ---- source (c): what is owned. The creatures notice before he does. ----
thr('hom', 1, 'neat', [
  ["Water has lain flat calm in its jar since Tuesday.", "hom:water"],
  ["Hydrogen has worn a mark on the ceiling over the bench.", "hom:h2"],
  ["The fog from the Dry ice jar goes up the glass, not down.", "hom:co2"],
  ["Acid has not eaten since Monday.", "hom:acid"],
  ["Wood spirit hums the same four bars each evening.", "hom:wood"],
  ["Salt has drawn a white line round its jar on the shelf.", "hom:salt"],
  ["Slime has kept to the east side of its jar for three days.", "hom:slime"],
  ["Seedling leans away from the window.", "hom:seedling"],
  ["Ammonia woke me at three and I found nothing wrong.", "hom:ammonia"],
  ["Brimstone burns low from nine to ten each evening.", "hom:brimstone"]
]);
thr('hom', 2, 'neat', [
  ["The surface of Water's jar shows a shore in the mornings.", "hom:water", {"till": 3}],
  ["Hydrogen drifts to the east wall at dusk.", "hom:h2", {"till": 3}],
  ["Dry ice froze the thin book to the bench.", "hom:co2", {"till": 3}],
  ["Acid will not eat the thin book.", "hom:acid", {"till": 3}],
  ["Wood spirit said a line from act one this evening.", "hom:wood", {"till": 3}],
  ["Salt has moved its line out to take in the book.", "hom:salt", {"till": 3}],
  ["Slime has stuck pages 12 and 13 of the book together.", "hom:slime", {"till": 3}],
  ["Seedling has put out a yellow leaf each day since the book came.", "hom:seedling", {"till": 3}],
  ["Ammonia does not light with the book on the bench.", "hom:ammonia", {"till": 3}],
  ["Brimstone's flame dips at the end of each round.", "hom:brimstone", {"till": 3}]
]);
thr('hom', 3, 'neat', [
  ["Water held still long enough today to show the far shore.", "hom:water"],
  ["Cut Hydrogen's string and it stayed at the east wall.", "hom:h2"],
  ["The frost on the Dry ice jar had towers in it this morning; copied on page 40.", "hom:co2"],
  ["Acid left the spoon I put in for it.", "hom:acid"],
  ["Wood spirit has left its reduce untouched for a week.", "hom:wood"],
  ["Salt was wet through this morning.", "hom:salt"],
  ["Slime steadies the pen when my hand shakes.", "hom:slime"],
  ["Seedling flowered yellow overnight.", "hom:seedling"],
  ["Ammonia has stopped waking me at three.", "hom:ammonia"],
  ["Brimstone went out and relit three times at even intervals.", "hom:brimstone"]
]);
// the creatures after the sign: hatched again
thr('hom', 1, 'neat', [
  ["The new Water went still within the hour.", "hom:water", {"s": [1, 3]}],
  ["Hydrogen hatched and went to the old mark on the ceiling.", "hom:h2", {"s": [1, 3]}],
  ["The new Dry ice sends its fog up the glass from the first day.", "hom:co2", {"s": [1, 3]}],
  ["Acid hatched on Monday and has not touched the book.", "hom:acid", {"s": [1, 3]}],
  ["The new Wood spirit hums the same four bars.", "hom:wood", {"s": [1, 3]}],
  ["Salt drew its line the first night, in the old place.", "hom:salt", {"s": [1, 3]}],
  ["Slime took hold of the pen on its first morning.", "hom:slime", {"s": [1, 3]}],
  ["Seedling came up leaning away from the window.", "hom:seedling", {"s": [1, 3]}],
  ["The new Ammonia is quieter than the last.", "hom:ammonia", {"s": [1, 3]}],
  ["Brimstone burns low from nine to ten, as the last one did.", "hom:brimstone", {"s": [1, 3]}]
]);

// ---- source (d): lifetime counts. Each is shown once, inside its window (the page passes `seen`). ----
thr('count', 1, 'neat', [
  ["Page one has a ring from a cup larger than mine.", null, {"count": ["runs", 2, 5]}],
  ["The rug no longer reaches the far wall by a foot.", null, {"count": ["runs", 10, 14]}],
  ["Lamp oil is down a pint over the two days I was at Mother's.", null, {"count": ["runs", 25, 30]}],
  ["The stool has worn two hollows in the floor, a pace apart.", null, {"count": ["runs", 50, 56]}],
  ["A hundred runs, and the ink in the first notebook has gone yellow.", null, {"count": ["runs", 100, 108]}],
  ["All six caps were loose this morning.", null, {"count": ["reagents_fired", 100, 140]}],
  ["Five hundred reagents fired. The tally inside the back cover says 512.", null, {"count": ["reagents_fired", 500, 560]}],
  ["The bottles weigh more than they did when new.", null, {"count": ["reagents_fired", 1000, 1080]}],
  ["The glassware from the lost run was clean on the rack this morning.", null, {"count": ["runs_lost", 5, 8]}],
  ["The vials from the ten lost runs are all pale yellow.", null, {"count": ["runs_lost", 10, 14]}],
  ["The winning yield is already on a back page in pencil.", null, {"count": ["runs_won", 1, 3]}],
  ["Ten winning yields are listed inside the back cover, in order.", null, {"count": ["runs_won", 10, 13]}],
  ["Some rings close before the reagent reaches them now.", null, {"count": ["ring_steps", 1000, 1100]}],
  ["The flask rings near A at every overreact.", null, {"count": ["overreacts", 10, 14]}]
]);
thr('count', 2, 'neat', [
  ["The ringing after an overreact runs to two bars now.", null, {"count": ["overreacts", 50, 58], "s": [0, 3]}],
  ["Three reagents were lined up on the bench when I came in.", null, {"count": ["reagents_fired", 2500, 2650], "s": [0, 3]}]
]);
thr('count', 3, 'neat', [
  ["He stayed through the lost run the same as through the good ones.", null, {"count": ["runs_lost", 30, 36], "s": [0, 3]}]
]);

// ---- source (e), first rung: faint oddities at any time, from the first run. Nobody named. ----
thr('career', 1, 'neat', [
  ["The lamp throws my shadow a little to the left of where I stand."],
  ["Yesterday's coffee ring on the bench has moved an inch toward the wall."],
  ["The tap ran warm for a minute on the cold side."],
  ["The bath thermometer read 40 before the burner was lit."],
  ["The cork from the oxidize bottle floats lower than the others."],
  ["Filter paper from the new packet has a faint yellow edge."],
  ["The stirrer bar turns slowly to the left with the motor off."],
  ["The window glass is cold on the inside and warm on the outside."],
  ["The flask hums on the bench at about the pitch of the gas."],
  ["A drop from the burette fell slowly enough to watch."],
  ["The crystals grew in the dish in a ring, none in the middle."],
  ["Steam from the kettle went sideways toward the shelf."],
  ["The bench shadow at noon was as long as at four."],
  ["The same seven notes come up through the floor each evening."],
  ["The ruled line on this page is not straight against the rule."],
  ["Salt on the bench has drawn itself into a line toward the window."]
]);

// ---- source (e): the career. Rung 2: the thin book, and someone. Reached at about an eighth of everything, or eight runs. ----
thr('career', 2, 'neat', [
  ["A thin book came in Dunmore's parcel with the glassware, not on the invoice.", null, {"till": 2}],
  ["The parcel was posted from this street.", null, {"till": 2}],
  ["The book is a play in two acts with no author on the title page.", null, {"till": 2}],
  ["Bound in a buff yellow cloth. The dye comes off on the fingers.", null, {"till": 3}],
  ["Read the first act over supper.", null, {"till": 2}],
  ["Up at four after reading the first act.", null, {"till": 2}],
  ["Put the book on the top shelf behind the acid bottles.", null, {"till": 2}],
  ["The book was on the bench again this morning.", null, {"till": 3}],
  ["Do not read the second act until the week's work is done.", null, {"till": 2}],
  ["The ribbon in the book is four pages on from where I stopped.", null, {"till": 2}],
  ["Dunmore says he packed glassware only.", null, {"till": 2}],
  ["Pike has a copy of the play on his hall table.", null, {"till": 3}],
  ["One name in the cast list has no lines in act one.", null, {"till": 2}],
  ["Cassilda's song in act one goes to a tune I already knew.", null, {"till": 3}],
  ["Ordered grey labels in place of the yellow ones.", null, {"till": 2}],
  ["Moved the sulfur bottle to the back of the shelf.", null, {"till": 2}],
  ["Moved the stool to the wall side of the bench.", null, {"till": 2}],
  ["The jars hum in the evening, in more than one part.", null, {"s": [0, 3]}],
  ["Found a loose printed page from act two under the door and burned it unread.", null, {"till": 2}],
  ["Act one ends with Camilla being told something offstage.", null, {"till": 2}],
  ["Someone was in the room from eleven until the titration was done.", null, {"till": 2}],
  ["Whoever comes in the evenings stays at the far end of the room.", null, {"till": 2}],
  ["The city in the play is on a lake, under two suns.", null, {"till": 2}],
  ["Copied the cast list into the back pages.", null, {"till": 2}],
  ["Pike has stopped asking for the rent.", null, {"till": 3}]
]);

// ---- rung 3: he, and his face. Reached at about a third of everything, or twenty-five runs. ----
thr('career', 3, 'neat', [
  ["Read the second act last night, between ten and four.", null, {"till": 3}],
  ["Bench work from seven as usual, no sleep.", null, {"till": 3}],
  ["He is in the room most evenings from about nine."],
  ["He stood at the window from nine until the bath was cold."],
  ["He was turned to the window and I did not see his face."],
  ["The city in the play is Carcosa."],
  ["Two suns in the flask at the top mark, setting one after the other.", null, {"s": [0, 3]}],
  ["The lake in the play is Hali."],
  ["Back to the yellow labels."],
  ["A pale mask in the steam over the bath for as long as it took to read 41."],
  ["The stars were black on a pale sky at three.", null, {"s": [0, 3]}],
  ["At nine reflexes there was a sleeve; at six there is nothing."],
  ["The lab coat bought in March is frayed to tatters at the hem."],
  ["Window open from nine."],
  ["The Hyades were over the roof opposite, six and then seven.", null, {"s": [0, 3]}],
  ["The condenser drips in the time of Cassilda's song.", null, {"s": [0, 3]}],
  ["Sat up until four in the chair facing the window."],
  ["Pike's rooms are empty and the rent book is marked paid to December."],
  ["Mist lay on the bench at dawn, an inch deep and level as water.", null, {"s": [0, 3]}],
  ["The inspector looked into the flask for some minutes and left without signing."],
  ["He stands a pace nearer than in March; I chalked the floor."],
  ["Told him the yield when the round was done."]
]);

// ---- rung 4: the King. The bargain, kept as a record of what was left out and what was found. Four fifths of everything. ----
thr('career', 4, 'shaky', [
  ["The cast list calls him the King.", null, {"hand": "neat"}],
  ["Left the tin of gold on the sill overnight, 212; 212 in the morning."],
  ["Wrote on a card what I want, one look at his face, and left it with the tin.", null, {"hand": "neat"}],
  ["Rewrote the card to ask for less."],
  ["Asked aloud at the end of the round."],
  ["Sold the bed to Dunmore for reagents."],
  ["The two suns set into the lake without steam."],
  ["Half the bottles on the shelf have no labels. Labelled six tonight."],
  ["Four spaces left on the shelf."],
  ["The hem of a torn cloth lay across page three for a minute."],
  ["Read the catalog aloud tonight as far as it goes."],
  ["Higher yields bring the King nearer; moved the chalk mark again."],
  ["Yesterday's note and today's are the same words."],
  ["Watched the steam for an hour and there was no mask."],
  ["The mark under the molecule lacks one stroke."],
  ["Ten jars and six sigils on the shelf, and the card still on the sill."],
  ["Bowed to the flask after the round."],
  ["Three findings left; did none of them today."],
  ["The sign can be taken now. Dunmore says everything on the shelf goes back.", null, {"u": [0.9, 1], "hand": "neat"}],
  ["Changed the card to ask only for the hem."],
  ["The card on the sill has not been moved."]
]);

// ---- rung 5: the King in Yellow, written in full. Everything found, or the third lap. ----
thr('career', 5, 'neat', [
  ["Wrote out The King in Yellow in full on the title line."],
  ["Saw his face at the top mark tonight.", null, {"big": true}],
  ["Two suns this morning, the second at 7.15."],
  ["Went to label the bottles and they were labelled."],
  ["The cat sleeps on the bench now."],
  ["Read the catalog aloud from start to end and he stayed for all of it."],
  ["The rug reaches the wall again."],
  ["The jars sing the tune through in the evenings."],
  ["Took the card off the sill."],
  ["Tea made at four, still warm at six."]
]);

// ---- source (f): the sign. Lap 1: he knows. The shelf is bare and the voice is not. ----
thr('sign', 4, 'neat', [
  ["Took the sign. Dunmore collected everything on Tuesday.", null, {"s": [1, 1]}],
  ["Shelf is bare; I have chalked where each thing goes.", null, {"s": [1, 1]}],
  ["Yield is a fifth higher on every page with the method unchanged.", null, {"s": [1, 1]}],
  ["One pale yellow stroke shows under the molecule at the top mark.", null, {"s": [1, 1]}],
  ["Two shadows from the stand again, as in the first notebook.", null, {"s": [1, 1]}],
  ["The thin book stayed on the bench when the shelf was cleared.", null, {"s": [1, 2]}],
  ["The King was at the window when Dunmore's boy carried the boxes out.", null, {"s": [1, 1]}],
  ["The book stays on the bench.", null, {"s": [1, 1]}],
  ["Pike is back downstairs and asking for the rent.", null, {"s": [1, 1]}],
  ["The humming is Cassilda's song; noted on the first evening.", null, {"s": [1, 1]}],
  ["The dust on the shelf keeps the rings of the bottles.", null, {"s": [1, 1]}],
  ["The second cup ring is on page one of the new notebook.", null, {"s": [1, 1]}],
  ["Started again with six bottles and the tin empty.", "start", {"s": [1, 1]}],
  ["One stroke under the molecule at the top mark, gone at the page turn.", "overreact", {"s": [1, 1]}],
  ["Entered the finding a second time; the first entry is in the old notebook.", "unlock", {"s": [1, 3]}],
  ["Lost at round two, where the first notebook also stopped.", "loss", {"s": [1, 1]}],
  ["Bought back my own burner from Dunmore; the scorch on the base is mine.", "buy", {"s": [1, 3]}],
  ["Opened one window for the sulfur.", "el:S", {"s": [1, 1]}]
]);
// ---- lap 2: he is polite about it. Shown as what he does for the other, recorded as routine. ----
thr('sign', 4, 'neat', [
  ["Set the second stool at the bench end before lighting the burner.", null, {"s": [2, 2]}],
  ["Lamp down to half at nine.", null, {"s": [2, 2]}],
  ["Two strokes under the molecule now.", null, {"s": [2, 2]}],
  ["The coffee ring on page one has dried in the shape of the two strokes.", null, {"s": [2, 2]}],
  ["Yield is two fifths up on the first notebook's figures.", null, {"s": [2, 2]}],
  ["Packed the shelf for Dunmore myself this time, in order.", null, {"s": [2, 2]}],
  ["Read the spec aloud before the first page.", null, {"s": [2, 2]}],
  ["Worked the round without speaking.", null, {"s": [2, 2]}],
  ["Poured a second cup at four and emptied it cold at six.", null, {"s": [2, 2]}],
  ["Wrote today's page out fair and left the notebook open on the bench.", null, {"s": [2, 2]}],
  ["Closed the window after the King had gone.", null, {"s": [2, 2]}],
  ["Stains on the page dry in the shape of the mark.", null, {"s": [2, 2]}],
  ["Wiped down the second stool.", null, {"s": [2, 2]}],
  ["Said good evening and lined up the first three.", "start", {"s": [2, 2]}],
  ["Read the yield aloud when the spec was met.", "win", {"s": [2, 2]}],
  ["Said sorry for page two when the round was lost.", "loss", {"s": [2, 2]}],
  ["Two strokes at the top mark; I stood up for it.", "overreact", {"s": [2, 2]}],
  ["Said beforehand that the sulfur would smell.", "el:S", {"s": [2, 2]}],
  ["Dead page; said so aloud and lined up again.", "waste", {"s": [2, 2]}]
]);
// ---- lap 3: the notes are partly in another hand. The other hand writes as a second chemist would: corrections, with figures. ----
thr('sign', 5, 'neat', [
  ["Bath was 42, not 40.", null, {"s": [3, 3], "by": "other"}],
  ["Page two: the reduce found no C=O.", null, {"s": [3, 3], "by": "other"}],
  ["1.84 g. The sum above is out by 0.2.", null, {"s": [3, 3], "by": "other"}],
  ["Oxidize should go last on page one.", null, {"s": [3, 3], "by": "other"}],
  ["The third flask on the sill has no label.", null, {"s": [3, 3], "by": "other"}],
  ["The figures after midnight are poor.", null, {"s": [3, 3], "by": "other"}],
  ["The window was shut at nine.", null, {"s": [3, 3], "by": "other"}],
  ["Page three, the weld: right place.", null, {"s": [3, 3], "by": "other"}],
  ["Hydrate first here; he has it the other way.", null, {"s": [3, 3], "by": "other"}],
  ["Cat hair in the 250 ml flask.", null, {"s": [3, 3], "by": "other"}],
  ["Lamp oil is low.", null, {"s": [3, 3], "by": "other"}],
  ["Met with 12 over; page two did it.", "win", {"s": [3, 3], "by": "other"}],
  ["Lost on the order of page two.", "loss", {"s": [3, 3], "by": "other"}],
  ["Top mark at the fourteenth reflex.", "overreact", {"s": [3, 3], "by": "other"}],
  ["Nine reflexes; a tenth was there to be had.", "chain", {"s": [3, 3], "by": "other"}],
  ["Hydrate had nothing to act on.", "waste", {"s": [3, 3], "by": "other"}],
  ["Start with the grow; the chain is short.", "start", {"s": [3, 3], "by": "other"}],
  ["There is writing under mine this morning, rounder and neater.", null, {"s": [3, 3]}],
  ["Three strokes under the molecule, and they stay for the whole round.", null, {"s": [3, 3]}],
  ["The other hand was right about page two.", null, {"s": [3, 3]}],
  ["I leave the lower half of the margin clear.", null, {"s": [3, 3]}],
  ["The sum on page four is corrected in the other hand to 1.84.", null, {"s": [3, 3]}],
  ["Third time the shelf is bare.", null, {"s": [3, 3]}],
  ["Tried dehydrate first against the note; the note was right.", null, {"s": [3, 3]}],
  ["Have not sat up past midnight this week.", null, {"s": [3, 3]}],
  ["Yield is three fifths up on the first notebook.", null, {"s": [3, 3]}],
  ["The jars face the mark during a long chain.", null, {"s": [3, 3]}],
  ["The sign is whole under the molecule from the first page.", "sigil", {"s": [3, 3]}]
]);

AA.NOTES = NOTES;
const THREAD_T = {}; NOTES.forEach(n => { if (n.thread) THREAD_T[n.t] = n; });
const clamp = v => Math.max(0, Math.min(1, v || 0));

// the scale the plain notes are ranged on: the career (unlocks) carries most of it, the run and the chain the rest
AA.notesDepth = function (unlocks, round, rounds, chain) {
  const u = clamp(unlocks), n = Math.max(2, rounds || 9), r = clamp(((round || 1) - 1) / (n - 1));
  const c = clamp((chain || 0) / 14);
  return clamp(u * 0.65 + r * 0.3 + c * 0.05);
};

// The reveal ladder. 1: oddities, from the first run. 2: someone, and the thin book (an eighth of everything, or eight runs).
// 3: he and his face (a third of everything, or twenty-five runs). 4: the King (four fifths, or any lap of the sign).
// 5: the King in Yellow (everything, or the third lap, or the second lap with four fifths again).
AA.notesReach = function (state) {
  const s = state || {}, u = clamp(s.unlocks), g = Math.max(0, Math.min(3, s.sign | 0)), runs = (s.counts && s.counts.runs) || 0;
  if (u >= 0.97 || g >= 3 || (g === 2 && u >= 0.8)) return 5;
  if (u >= 0.8 || g >= 1) return 4;
  if (u >= 0.35 || runs >= 25) return 3;
  if (u >= 0.12 || runs >= 8) return 2;
  return 1;
};

// The thread budget. rate is the share of notes that may be thread lines: about 1 in 10 for a new player, 1 in 5 by mid-career,
// 1 in 3 late. c is how far along the player is, taken from the share of unlocks, the runs played and the laps of the sign
// (a lap does not put the voice back). Rounds 7 to 9 of a run add a little. gap is the fewest plain notes between two thread lines
// (3 early, then 2, then 1: never back to back). p is the chance at each note once the gap has passed.
AA.notesRate = function (state) {
  const s = state || {}, u = clamp(s.unlocks), g = Math.max(0, Math.min(3, s.sign | 0)), runs = (s.counts && s.counts.runs) || 0;
  const c = Math.max(u, 0.6 * Math.min(1, runs / 60), g ? 0.5 + 0.15 * g : 0);
  const rate = Math.min(0.36, 0.10 + 0.22 * c + ((s.round || 0) >= 7 ? 0.05 : 0));
  const gap = rate < 0.15 ? 3 : rate < 0.28 ? 2 : 1;
  return { rate, gap, p: Math.min(1, 1 / (1 / rate - gap)), c };
};

function hash01(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; return ((h >>> 0) % 100000) / 100000; }

// is a thread line due at this note? `used` is this run's notes in the order shown; the plain notes since the last thread line are counted
// from it. A new run starts as if three plain notes had passed (or state.since, if the page carries the count across runs).
function threadDue(s, used) {
  let last = -1; for (let i = used.length - 1; i >= 0; i--) if (THREAD_T[used[i]]) { last = i; break; }
  const since = last >= 0 ? used.length - 1 - last : used.length + (s.since == null ? 3 : s.since), b = AA.notesRate(s);
  if (!used.length || since < b.gap) return false;                       // never the first note of a run, never inside the gap
  if (last < 0 && used.length >= 5) return true;                         // a run of five notes with none yet: one is owed
  const seen = s.seen, runs = (s.counts && s.counts.runs) || 0;
  if (seen && runs >= 1 && !Object.keys(THREAD_T).some(t => (Array.isArray(seen) ? seen.indexOf(t) >= 0 : seen[t]))) return true;  // none ever, by the second run
  return hash01((s.seed || 0) + '|' + used.length + '|' + (used[used.length - 1] || '') + '|' + (s.round || 0)) < b.p;
}

// state: { depth 0..1, unlocks 0..1, round, tag (a string or a list), homs (keys of the creatures owned), used (texts shown this run, in order),
//          sign (laps taken, 0..3), counts (lifetime counts), since (plain notes since the last thread line, across runs), seen (thread texts
//          ever shown: a list or a map), seed }
// Only depth, unlocks, tag, homs and used are needed; the rest make the thread better paced and are safe to leave out.
// Returns the notes that fit, and decides by the budget whether this note is a thread line or a plain one: the list is all one or the other.
// With a tag that has notes here, only those. Otherwise the untagged notes and the notes of owned creatures. Never returns an empty list.
AA.notesPick = function (state) {
  const s = state || {}, d = clamp(s.depth), u = clamp(s.unlocks), g = Math.max(0, Math.min(3, s.sign | 0));
  const tags = s.tag == null ? [] : [].concat(s.tag), homs = (s.homs || []).map(h => 'hom:' + h), used = s.used || [], counts = s.counts || {};
  const seen = s.seen, wasSeen = t => !!seen && (Array.isArray(seen) ? seen.indexOf(t) >= 0 : !!seen[t]);
  const inR = (v, r, pad) => v >= r[0] - pad && v <= r[1] + pad;
  const okRound = n => !n.round || (s.round != null && s.round >= n.round[0] && s.round <= n.round[1]);
  const okWhen = n => tags.length ? (n.when && tags.indexOf(n.when) >= 0) : (!n.when || homs.indexOf(n.when) >= 0);
  const unused = n => used.indexOf(n.t) < 0;
  if (threadDue(s, used)) {
    const reach = AA.notesReach(s);
    const ok = n => n.thread && n.rung <= reach && reach <= n.till && inR(g, n.sign, 0) && inR(u, n.unlocks, 0) && inR(d, n.depth, 0) && okRound(n) && unused(n);
    const due = NOTES.filter(n => ok(n) && n.count && (counts[n.count[0]] || 0) >= n.count[1] && (counts[n.count[0]] || 0) <= n.count[2] && !wasSeen(n.t));
    if (due.length && !tags.length) return due;                          // a lifetime count comes first, once
    const l = NOTES.filter(n => ok(n) && !n.count && okWhen(n));
    if (l.length) {                                                      // seven times in ten the newest rungs, the late-run lines and the lap's own lines; else anything that fits
      const top = l.filter(n => n.rung >= reach - 1 || n.src === 'sign' || n.src === 'run'), near = top.length >= 4 && hash01('t|' + (s.seed || 0) + '|' + used.length + '|' + (used[used.length - 1] || '')) < 0.7;
      const f = near ? top : l, nw = f.filter(n => !wasSeen(n.t)); return nw.length ? nw : f; }
  }
  const plain = (dp, up) => NOTES.filter(n => !n.thread && inR(d, n.depth, dp) && inR(u, n.unlocks, up));
  const fresh = l => { const f = l.filter(unused); return f.length ? f : l; };
  const steps = [[0, 0], [0.15, 1], [1, 1]];
  if (tags.length) for (let i = 0; i < steps.length; i++) { const l = plain(steps[i][0], steps[i][1]).filter(n => n.when && tags.indexOf(n.when) >= 0); if (l.length) return fresh(l); }
  for (let i = 0; i < steps.length; i++) { const l = plain(steps[i][0], steps[i][1]).filter(n => !n.when || homs.indexOf(n.when) >= 0); if (l.length) return fresh(l); }
  return fresh(NOTES.filter(n => !n.thread));
};

// '~struck~ and _under_' to [{ s, struck, under }] so the pen can draw a line through or under a piece
AA.notesParse = function (t) {
  const out = []; let m; const re = /~([^~]+)~|_([^_]+)_|([^~_]+)/g;
  while ((m = re.exec(t))) out.push(m[1] != null ? { s: m[1], struck: true } : m[2] != null ? { s: m[2], under: true } : { s: m[3] });
  return out;
};

if (typeof module !== 'undefined' && module.exports) module.exports = { NOTES, notesPick: AA.notesPick, notesDepth: AA.notesDepth, notesReach: AA.notesReach, notesRate: AA.notesRate, notesParse: AA.notesParse };
})(typeof globalThis !== 'undefined' ? globalThis : window);
