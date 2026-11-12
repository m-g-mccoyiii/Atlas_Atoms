// Overreact: the margin notes (rulings AI, AM, AM2, AM3; the story is docs/STORY.md; how to write more is docs/NOTES_WRITING.md).
// One chemist's notes over a whole career. They start dry and sane and end somewhere else.
//   AA.NOTES            every note: { t, depth: [min,max], unlocks: [min,max], when, hand, big }
//   AA.notesPick(state) the notes that fit a state { depth, unlocks, round, tag, homs, used }
//   AA.notesDepth(unlocks, round, rounds, chain)  the madness scale 0..1 this file was written against
//   AA.notesParse(t)    splits ~struck~ and _under_ marks into pieces for the pen
// depth is madness 0..1. unlocks is the share of all unlocks owned 0..1 and is the story clock.
// when is a tag: start win loss overreact chain waste shop buy unlock instrument sigil gold spec catalog
//   el:N el:S el:Cl el:Br   hom:water hom:h2 hom:co2 hom:acid hom:wood hom:salt hom:slime hom:seedling hom:ammonia hom:brimstone
// Sources: R. W. Chambers, The King in Yellow (1895) and Ambrose Bierce only. Nothing later. See the rights rule in NOTES_WRITING.md.
(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
const NOTES = [];
// a band: its depth range, its default unlocks range, its default hand, and rows of [text, when, overrides]
function band(d, u, hand, rows) {
  rows.forEach(r => {
    const o = r[2] || {}, n = { t: r[0], depth: o.d || d, unlocks: o.u || u, hand: o.hand || hand };
    if (r[1]) n.when = r[1];
    if (o.big) n.big = true;
    if (o.round) n.round = o.round;
    NOTES.push(n);
  });
}

// ---- 1. depth 0 to 0.2: a sane, dry, competent chemist. Nothing uncanny. ----
band([0, 0.2], [0, 0.4], 'neat', [
  ['Do not lick. (See Tuesday.)'],
  ['Label everything. Especially the clear ones.'],
  ['Coffee is NOT a reagent. Tested twice.'],
  ['Landlord asks what the smell is. Told him: progress.'],
  ['Rent due the 1st. Yield due sooner.'],
  ['Wash glassware _before_ it becomes archaeology.'],
  ['The cat is not permitted on the bench. The cat disagrees.'],
  ['Oxidize, then reduce. Back where I began. Call it exercise.'],
  ['Pencil for guesses, ink for results. This is in pencil.'],
  ['Inspection Thursday. Have hidden the kettle among the glassware.'],
  ['Dehydrate drove off water. Straight onto my notes. See smudge.'],
  ['Runoff goes in the jars. The sink has had enough.'],
  ['Sugar is in the jar marked SUGAR. Trust nothing else.'],
  ['Borrowed: one stopper. Owed: one stopper. Chemistry balances.'],
  ['Singed cuff. Third this month. Buy darker shirts.'],
  ['Credit with the supplier: some. Credit with the landlord: none.'],
  ['Hydroborate. Cannot say it before breakfast. Can fire it.'],
  ['New page. Clean flask. Modest hopes.', 'start'],
  ['Aim for today: meet the spec, keep both eyebrows.', 'start'],
  ['Three reagents lined up. More order than my week has had.', 'start'],
  ['Met the spec. Nobody clapped. Correct.', 'win'],
  ['Round won. Permitted myself the good biscuit.', 'win'],
  ['Yield over the spec. Suspected the balance. Then myself. Then took it.', 'win'],
  ['Under spec. The molecule and I are not speaking.', 'loss'],
  ['Failed. Cause: chemistry. Remedy: more chemistry.', 'loss'],
  ['Lost the round. Blaming the stirrer, in writing.', 'loss'],
  ['It OVERREACTED. I only asked it to react.', 'overreact'],
  ['Ran clean away from me. Logged as "intended".', 'overreact'],
  ['A reflex set off a reflex. Did not ask. Did not object.', 'chain'],
  ['Still going. Have put the pen down to watch.', 'chain'],
  ['That reagent acted nowhere. An expensive way to stir.', 'waste'],
  ['Nothing reacted. The page is, at least, very tidy.', 'waste'],
  ['The supplier\'s prices are a finding in themselves.', 'shop'],
  ['Supplier says "trade is trade". Supplier is winning the trade.', 'shop'],
  ['Bought it. The receipt is the saddest thing on the bench.', 'buy'],
  ['Supplier bit the coin. I bit the instrument. Both real.', 'buy'],
  ['A finding! Entered it twice in case I lose one.', 'unlock'],
  ['New on the bench. Admired it for ten minutes. Then work.', 'unlock'],
  ['The thermometer and I disagree. It has the markings.', 'instrument'],
  ['Goggles on. Now I can see the mistake clearly.', 'instrument'],
  ['An NH2 today. Smells of fish and ambition.', 'el:N'],
  ['Sulfur. Opened the window. Opened the other window.', 'el:S'],
  ['Chlorine on the molecule. My nose has filed a complaint.', 'el:Cl'],
  ['Bromine: brown, heavy, rude. Handle like an aunt.', 'el:Br'],
  ['Counted the gold. Counted again. Still not the rent.', 'gold'],
  ['Gold in the tin, tin in the drawer, drawer stuck. Savings.', 'gold'],
  ['The spec does not say please. Met it anyway.', 'spec'],
  ['Over the spec by one. The one is mine. Framing it.', 'spec'],
  ['First catalog entry filled. Supplier shook my hand, then invoiced it.', 'catalog'],
  ['Water hatched. Damp, cheerful, and into everything.', 'hom:water', { d: [0, 0.3] }],
  ['Hydrogen floats off. Tied it to the jar with string.', 'hom:h2', { d: [0, 0.3] }],
  ['Dry ice froze a ring shut. Then my tea. Unasked.', 'hom:co2', { d: [0, 0.3] }],
  ['Acid ate the label off its own jar. Relabelled the shelf.', 'hom:acid', { d: [0, 0.3] }],
  ['Wood spirit fired all five reagents. Apologised to the wrong flask.', 'hom:wood', { d: [0, 0.3] }],
  ['Salt cured a C=O. Asked it about my cough. It stared.', 'hom:salt', { d: [0, 0.3] }],
  ['Slime stuck two carbons together. Then my sleeve. Then the cat.', 'hom:slime', { d: [0, 0.3] }],
  ['Seedling grew nine carbons overnight. Repotted the molecule.', 'hom:seedling', { d: [0, 0.3] }],
  ['Ammonia woke the whole page. Also the landlord, downstairs.', 'hom:ammonia', { d: [0, 0.3] }],
  ['Brimstone: hellfire, in a jar, on a wooden shelf. Reviewed the shelf.', 'hom:brimstone', { d: [0, 0.3] }]
]);

// ---- 2. depth 0.2 to 0.4: small wrongnesses, noticed and dismissed. ----
band([0.2, 0.4], [0, 0.6], 'neat', [
  ['12 + 7 = 20. Checked. Still 20. Left it.'],
  ['Something at the rim of the flask. Wrote "orange-ish". Coward.'],
  ['The cat watches the corner. I checked the corner.'],
  ['Counted the jars: ten. Counted the lids: eleven.'],
  ['My handwriting on a page I did not write. Tidy, at least.'],
  ['The clock runs a little fast. Only near the flask.'],
  ['The creatures all face one wall. Turned the jars. They turned back.'],
  ['Landlord says I paced all night. I was asleep. I think.'],
  ['Smell of the sea. We are forty miles inland.'],
  ['The ring closed before I fired. ~Impossible~ Early.'],
  ['Dreamt in structural formulae. One of them was looking at me.'],
  ['My reflection in the flask is a moment late. Tired eyes.', null, { hand: 'shaky' }],
  ['The retort stand casts two shadows. One lamp.'],
  ['Ink is going faster than I write. Buy ink. Write less.'],
  ['Stars looked dim tonight. Clean the window.'],
  ['Inspection passed. The inspector signed, then asked who else works here.'],
  ['New round. Feel oddly well rested. Bed not slept in.', 'start'],
  ['New run. Notebook already open at the right page. Obliging.', 'start'],
  ['Met the spec. Felt _approved of_. By the cat, presumably.', 'win'],
  ['Won. The yield reads higher in ink than in the flask.', 'win'],
  ['Under spec. The yield was there a minute ago. I _saw_ it.', 'loss'],
  ['Lost. The creatures were watching. Lost with dignity, for them.', 'loss'],
  ['OVERREACT. The flask rang on for a full minute. I timed it.', 'overreact'],
  ['It overreacted. So did I, a little. Unprofessional. Pleasant.', 'overreact'],
  ['A tuck, a weld, a tuck. It has a favourite order now.', 'chain'],
  ['Long chain. Runoff came off in pairs. Arm in arm.', 'chain'],
  ['Reduce acted nowhere. The bottle is lighter all the same.', 'waste', { hand: 'shaky' }],
  ['Wasted the page. The page seems relieved.', 'waste'],
  ['One item on the list has no name, no price. Did not ask.', 'shop'],
  ['The supplier asked after "the little ones". I never mentioned them.', 'shop'],
  ['Bought it. It was warm, as if just set down.', 'buy'],
  ['Bought it. The supplier had it wrapped before I chose.', 'buy'],
  ['A finding. I do not recall looking for it.', 'unlock'],
  ['New on the bench. Already dusty. Already _used_.', 'unlock'],
  ['Thermometer reads 22. Then 22. Then, briefly, a word.', 'instrument'],
  ['The balance reads lighter when I look away. Thrift.', 'instrument'],
  ['Drew the sigil. It was already there under the pencil.', 'sigil'],
  ['The sigil broke one rule, as promised. And one unmentioned.', 'sigil'],
  ['An NH2 on the molecule. It knits rings now. Nobody taught it.', 'el:N'],
  ['Two SH paired off by themselves. Did not feel like chaperoning.', 'el:S'],
  ['A Cl stuck on and would not strip. I respect it. Slightly.', 'el:Cl'],
  ['Bromine fumes drifted against the draught. Corrected the draught.', 'el:Br'],
  ['The gold is one coin over. Nobody is ever robbed upward.', 'gold'],
  ['The spec has gone up since breakfast. In my own hand.', 'spec'],
  ['Who writes the spec? I have never asked. Odd of me.', 'spec'],
  ['The catalog lists a compound I make next week. Noted.', 'catalog'],
  ['Water flooded the bench again. Says it was "helping".', 'hom:water', { d: [0.15, 0.5] }],
  ['Hydrogen bumps one spot on the ceiling. There is a mark now.', 'hom:h2', { d: [0.15, 0.5] }],
  ['Dry ice: the fog pours _up_ the jar today. Noted. Ignored.', 'hom:co2', { d: [0.15, 0.5] }],
  ['Acid ate the spoon and left the soup. Not how acid works.', 'hom:acid', { d: [0.15, 0.5] }],
  ['Wood spirit sings. Asked it the tune. It does not know either.', 'hom:wood', { d: [0.15, 0.5] }],
  ['Salt drew a line round its jar. I am not to cross.', 'hom:salt', { d: [0.15, 0.5] }],
  ['Slime stuck two carbons, then the door. Wants us all kept in.', 'hom:slime', { d: [0.15, 0.5] }],
  ['Seedling leans toward the lamp. The lamp was off.', 'hom:seedling', { d: [0.15, 0.5] }],
  ['Ammonia woke me at three. Nothing was wrong. It looked worried.', 'hom:ammonia', { d: [0.15, 0.5] }],
  ['Brimstone burned eight carbons and bowed. Not toward me.', 'hom:brimstone', { d: [0.15, 0.5] }]
]);

// ---- 3. depth 0.4 to 0.6: the thin book arrives. First "he". Yellow is noticed and avoided. ----
band([0.4, 0.6], [0.25, 0.8], 'shaky', [
  ['A thin book on the bench. No invoice. Bound in... buff.', null, { u: [0.25, 0.45] }],
  ['Did not order a book. The parcel was addressed in MY hand.', null, { u: [0.25, 0.45] }],
  ['It is a play. Two acts. I am a chemist. I shall not read it.', null, { u: [0.25, 0.45] }],
  ['Read the first act. Harmless. Rather dull. Slept badly.', null, { u: [0.3, 0.5] }],
  ['Will NOT read the second act. Book moved to the high shelf.', null, { u: [0.3, 0.5] }],
  ['The book was on the bench again. The shelf is very high.', null, { u: [0.3, 0.5] }],
  ['The creatures hum a tune. All of them. In parts.'],
  ['Who is Cassilda? Why do I know how her song ends?'],
  ['Threw out the yellow labels. Ordered grey.'],
  ['~He~ Someone stood behind me. Nobody. Why did I write "he"?'],
  ['Landlord has read it too. Has stopped asking for rent.'],
  ['A city in the play. Car... no. Not writing it down.'],
  ['The cat brought me a loose page. Act two. Took it from ME.'],
  ['Do not look at the lemon. Took the tea plain.'],
  ['Camilla is told something in act one. I should NOT like to know.'],
  ['The book\'s ribbon marker moves forward nightly. I do NOT.'],
  ['He is in the list of characters. No lines. Why list him?'],
  ['Butter. Egg yolk. Brass. It is EVERYWHERE once you notice.'],
  ['Begin. The book is on the shelf. I checked. I checked.', 'start'],
  ['New run. Chemistry is sums. Sums are safe. Begin.', 'start'],
  ['Met the spec. Somewhere a page turned.', 'win'],
  ['Won. The creatures hummed the last bar. With a flourish.', 'win'],
  ['Lost. I was thinking about act two. Not READING. Thinking.', 'loss'],
  ['Under spec. Put a cloth over the book. It shows through.', 'loss'],
  ['OVERREACT. For a moment the flask was a window.', 'overreact'],
  ['OVERREACT. The creatures applauded. They have no hands.', 'overreact'],
  ['The chain scans. Reflex, reflex, REFLEX. It is in metre.', 'chain'],
  ['A long chain. Looked up at the shelf only twice. Progress.', 'chain'],
  ['Dead page. Read the spine of the book instead. Only the spine.', 'waste'],
  ['Hydrate acted nowhere. Dry as act one. Unlike... never mind.', 'waste'],
  ['A copy on the supplier\'s counter. Face down. Not discussed.', 'shop'],
  ['Asked for grey labels. The supplier laughed. Then he did not.', 'shop'],
  ['Change came back in a strange coin. Two suns on it.', 'buy'],
  ['Bought it to busy my hands. Hands prefer the shelf.', 'buy'],
  ['A finding. It reads like a stage direction.', 'unlock'],
  ['Another finding. Written out together they look like a cast.', 'unlock'],
  ['The mirror shows the bench, the flask, and one chair too many.', 'instrument'],
  ['Crystal ball shows a lake. I asked for tomorrow\'s yield.', 'instrument'],
  ['A sigil breaks one rule. So rules break. BAD to know.', 'sigil'],
  ['Filled the sigil. A rule broke. Nobody was punished. Unsettling.', 'sigil'],
  ['Nitrogen. Blue on the chart. Blue is a fine colour. BLUE.', 'el:N'],
  ['Sulfur. That colour. Worked with my eyes half shut.', 'el:S'],
  ['Chlorine. Green. Well, yellow-green. Well. GREEN.', 'el:Cl'],
  ['Bromine is brown. Brown is nearly... it is NOT nearly.', 'el:Br'],
  ['Gold is yellow. Never minded before. It lives in a drawer now.', 'gold'],
  ['The spec asks more each round. So does the book.', 'spec'],
  ['Catalog entry, in print: "as seen in act two". Seen WHERE?', 'catalog'],
  ['Water has gone flat calm. Like a lake. Stop that.', 'hom:water', { d: [0.4, 0.7] }],
  ['Hydrogen drifts to the east window at dusk. We have none.', 'hom:h2', { d: [0.4, 0.7] }],
  ['Dry ice froze a ring shut. The humming froze too. Bliss, briefly.', 'hom:co2', { d: [0.4, 0.7] }],
  ['Acid will eat anything but the thin book. It backs away.', 'hom:acid', { d: [0.4, 0.7] }],
  ['Wood spirit, blind drunk, recited a whole scene. Sober, denies it.', 'hom:wood', { d: [0.4, 0.7] }],
  ['Salt cures what must not change. It keeps eyeing the book.', 'hom:salt', { d: [0.4, 0.7] }],
  ['Slime stuck pages 12 and 13 together. Good. Leave 13.', 'hom:slime', { d: [0.4, 0.7] }],
  ['Seedling put out one yellow leaf. Pruned it. Back by tea.', 'hom:seedling', { d: [0.4, 0.7] }],
  ['Ammonia wakes everything twice. Begged it to let the book sleep.', 'hom:ammonia', { d: [0.4, 0.7] }],
  ['What frightens hellfire? Brimstone pointed. I did not look.', 'hom:brimstone', { d: [0.4, 0.7] }]
]);

// ---- 4. depth 0.6 to 0.8: he wants to see. The reactions are a way to see. Notes address HIM. ----
band([0.6, 0.8], [0.5, 0.97], 'shaky', [
  ['I read the second act.', null, { u: [0.5, 0.62], big: true, hand: 'neat' }],
  ['It was not dull.', null, { u: [0.5, 0.7], hand: 'neat' }],
  ['I want to see. A scientist wants to see. It is the JOB.'],
  ['Carcosa. There, I wrote it. Nothing happened. _Disappointing._'],
  ['Two suns in the flask. Then my own face. Worse.'],
  ['The lake is called Hali. The flask is called flask. For now.'],
  ['A pale mask in the steam. Asked it to unmask. It laughed.'],
  ['The stars are black tonight. Did NOT clean the window.'],
  ['YOU. Yes. I know you read over my shoulder.', null, { hand: 'frantic' }],
  ['The reactions are a spyglass. Longer chain, longer glass.'],
  ['Stopped avoiding yellow. Bought a yellow pencil. This is it.'],
  ['Landlord gone. Rent book says "paid in full". I never paid.'],
  ['Hung up the lab coat. It hangs in tatters. It was new.'],
  ['The Hyades rose in the retort. Six? Seven? Hold STILL.'],
  ['Cassilda sings in the condenser drip. Flat. Forgiven.'],
  ['Is it rude to ask HIM to hurry? I have a spec to meet.'],
  ['The cat came back. Sat in HIS chair. Purred. Traitor.'],
  ['Shores of cloud on the bench at dawn. Mopped up. Regret it.'],
  ['The inspector looked in the flask and left at a run. Jealous.'],
  ['Begin. Rolled my sleeves. HE should see me at my best.', 'start'],
  ['New run. Another turn at the keyhole.', 'start'],
  ['Won. Closer. The page was warm where someone had leaned.', 'win'],
  ['Spec met. HE does not care for the spec. I barely do.', 'win'],
  ['Lost. HE turned away. But I SAW him turn. Ha.', 'loss'],
  ['Under spec. The flask went dark. An ordinary dark. The WORST kind.', 'loss'],
  ['OVERREACT. HIS FACE, nearly. A chin. Was that a chin?', 'overreact', { big: true }],
  ['Every overreaction, a little more of HIM. Today: a sleeve.', 'overreact'],
  ['OVERREACT. Towers behind the moon. Wrong way round. Wonderful.', 'overreact'],
  ['Longer. LONGER. He comes up the chain like a stair.', 'chain', { hand: 'frantic' }],
  ['Each reflex wipes more steam off the glass. MORE reflexes.', 'chain'],
  ['Dead page. A shut eye. Open. OPEN.', 'waste', { hand: 'frantic' }],
  ['Reduce acted nowhere. Nothing to see. I mean that bitterly.', 'waste'],
  ['Supplier: one burner. No, larger. I need a wider view.', 'shop'],
  ['The supplier has seen it too. I can tell. Charges the same.', 'shop'],
  ['Bought it for the view, not the yield. Do not tell the yield.', 'buy'],
  ['Bought an instrument. Pointed it at the flask. Then at the sky.', 'buy'],
  ['A finding. One more line of the play I have EARNED.', 'unlock'],
  ['Fewer findings left. When the list is done, HE is due. Surely.', 'unlock', { u: [0.6, 0.9] }],
  ['Loupe on the flask: a lake shore, very small. Waved. Felt foolish.', 'instrument'],
  ['Looked for HIM with the burette. Wrong instrument. Tried them all.', 'instrument'],
  ['Each sigil breaks one rule. How many rules stand between us?', 'sigil'],
  ['Filled the circle. A law bent, and something leaned IN.', 'sigil'],
  ['Nitrogen. The air there is mostly this, I expect. Practised breathing.', 'el:N'],
  ['Sulfur. HIS colour. I used to open the windows. Ha.', 'el:S'],
  ['Chlorine green. Pretty. Irrelevant.', 'el:Cl'],
  ['Bromine rose like dusk on a lake. I know which lake.', 'el:Br'],
  ['Would HE take gold? Landlords do. Is HE grander than a landlord?', 'gold'],
  ['Gold: yellow, heavy, patient. A hint? A HINT?', 'gold'],
  ['The spec is the price of the next look. Pay it.', 'spec'],
  ['The catalog is a guest list. Each compound an invitation. Fill it.', 'catalog'],
  ['Water: I see towers in you. Hold STILL.', 'hom:water', { d: [0.6, 0.85] }],
  ['Hydrogen, you float highest. Tell me if the stars are black.', 'hom:h2', { d: [0.6, 0.85] }],
  ['Dry ice: freeze the flask the instant HE shows. Be QUICK.', 'hom:co2', { d: [0.6, 0.85] }],
  ['Acid, eat a hole in the wall of the world. A small one.', 'hom:acid', { d: [0.6, 0.85] }],
  ['Wood spirit sees HIM double. Lucky little sot.', 'hom:wood', { d: [0.6, 0.85] }],
  ['Salt, cure ME. I must keep until HE comes.', 'hom:salt', { d: [0.6, 0.85] }],
  ['Slime, stick the two suns together. I can only look at ONE.', 'hom:slime', { d: [0.6, 0.85] }],
  ['Seedling grows toward Carcosa. So that is the way. Thank you.', 'hom:seedling', { d: [0.6, 0.85] }],
  ['Ammonia, wake me if I dream of the lake. No. Don\'t.', 'hom:ammonia', { d: [0.6, 0.85] }],
  ['Brimstone, more light. Two suns are not enough to read by.', 'hom:brimstone', { d: [0.6, 0.85] }]
]);

// ---- 5. depth 0.8 to 1: desperate, pleading, bargaining. Gold offered. The sign found. "The King" is written at last. ----
band([0.8, 1], [0.75, 0.97], 'frantic', [
  ['SHOW ME', null, { big: true }],
  ['Please. I said please. I NEVER say please.'],
  ['HIS FACE HIS FACE HIS... ran out of margin'],
  ['I will give the gold. All of it. The cat. The eyebrows. NAME IT.'],
  ['I HAVE FOUND THE SIGN. It was under the molecule. Of course.', null, { u: [0.9, 0.97] }],
  ['The King. There. Written. Hand steady as a... as a...', null, { u: [0.8, 0.97] }],
  ['Tatters. I saw tatters. The hem of HIM, across page three.'],
  ['Carcosa Carcosa Carcosa. Is that how one knocks?'],
  ['Wrote over yesterday\'s note. And the day before\'s. All say the same.'],
  ['No mask. No MASK? Then what have I been looking at.'],
  ['The play has no third act. I am writing one. In yields.'],
  ['I was a good chemist. I labelled things. LABEL HIM.'],
  ['Nearly everything found. Nearly. NEARLY is a wall.', null, { u: [0.85, 0.97] }],
  ['Sold the bed. Bought reagents. HE does not sleep. Why should I.'],
  ['The suns set in the lake and do not hiss. I listened.'],
  ['Dear Sir: I enclose one (1) soul, slightly used. Kindly appear.', null, { hand: 'neat' }],
  ['IF THE YIELD IS HIGH ENOUGH HE MUST COME. That is science.'],
  ['Everything leaves the flask as runoff. Nothing ARRIVES. Reverse it.'],
  ['Ten creatures. Every sigil. The catalog. WHAT ELSE DO YOU WANT.', null, { u: [0.9, 0.97] }],
  ['Again. AGAIN. He was nearly through.', 'start'],
  ['Run begins. Forgive the last one. Watch THIS one.', 'start'],
  ['Won. Bowed to the flask. Nobody bowed back. Yet.', 'win'],
  ['Spec met. Is HE met? No? Then nothing is met.', 'win'],
  ['LOST. I am sorry I am sorry. One more. Stay.', 'loss'],
  ['Under spec, and HE saw. Burn the page. No. HE likes pages.', 'loss'],
  ['OVERREACT. AND HE LOOKED UP', 'overreact', { big: true }],
  ['OVERREACT. The whole page shook. So HE is heavy. Noted. NOTED.', 'overreact'],
  ['DON\'T STOP don\'t stop that is his footstep DON\'T STOP', 'chain'],
  ['Twenty. Twenty-one. The door is OPENING, keep counting', 'chain'],
  ['A dead page NOW? With HIM at the door? Fool. FOOL.', 'waste'],
  ['Wasted. He waits. He is good at it. I am NOT.', 'waste'],
  ['Supplier: the whole shelf. A court wants furnishing.', 'shop'],
  ['The supplier weeps as he wraps it. Good man. Wrap FASTER.', 'shop'],
  ['Paid everything. Refused the change. It is HE who is owed.', 'buy'],
  ['Three findings left. Two. Do them SLOWLY. No. Quickly. No.', 'unlock', { u: [0.88, 0.97] }],
  ['A finding. I did not cheer. HE dislikes noise. I have decided.', 'unlock'],
  ['Every instrument on the bench points one way. Not my doing.', 'instrument'],
  ['The ouija board spelled "ASK HIM YOURSELF". Impertinent. Just.', 'instrument'],
  ['The last sigil is HIS. I knew the strokes before drawing them.', 'sigil', { u: [0.9, 0.97] }],
  ['The sign took the coins. Then the SHINE off the rest.', 'sigil', { u: [0.9, 0.97] }],
  ['The sign wants gold. So HE can be bought. So I am SAVED. So I am poor.', 'sigil', { u: [0.9, 0.97] }],
  ['Nitrogen, sulfur, chlorine: the court is assembled. Where is the KING.', 'el:N'],
  ['Sulfur burns blue. HE is not blue. Wrong. Burn it again.', 'el:S'],
  ['Chlorine. Strip the green off the world. See what is under it.', 'el:Cl'],
  ['Bromine. Brown as an old curtain. RAISE the curtain.', 'el:Br'],
  ['All my gold for a look. Half for a glance. A coin for the hem?', 'gold'],
  ['Gold on the sign. Gold on the bench. Is HE even counting?', 'gold'],
  ['The spec is HIS now. I read it kneeling.', 'spec'],
  ['One blank left in the catalog. It is shaped like a FACE.', 'catalog', { u: [0.85, 0.97] }],
  ['Water, little Hali, show me the far shore.', 'hom:water', { u: [0.75, 0.97] }],
  ['Cut the string. Hydrogen stayed. It is waiting too.', 'hom:h2', { u: [0.75, 0.97] }],
  ['Frost on the dry ice jar spells nothing. I check hourly.', 'hom:co2', { u: [0.75, 0.97] }],
  ['Acid has stopped eating. Says it is saving room.', 'hom:acid', { u: [0.75, 0.97] }],
  ['Wood spirit has gone sober. That frightens me more than the rest.', 'hom:wood', { u: [0.75, 0.97] }],
  ['Salt weeps. Wasteful, in its case.', 'hom:salt', { u: [0.75, 0.97] }],
  ['Slime holds my hand to the pen. Kind of it.', 'hom:slime', { u: [0.75, 0.97] }],
  ['Seedling flowered. Do not ask me the colour.', 'hom:seedling', { u: [0.75, 0.97] }],
  ['Smelling salts no longer wake me. Was I asleep? Am I?', 'hom:ammonia', { u: [0.75, 0.97] }],
  ['Brimstone went out. Lit itself. Went out. It is SIGNALLING.', 'hom:brimstone', { u: [0.75, 0.97] }]
]);

// ---- after: everything found. Quiet, changed, terribly calm. "In yellow" is written only here. ----
band([0.6, 1], [0.97, 1], 'neat', [
  ['Oh. There you are.', null, { big: true }],
  ['I have seen. The tea is still warm. How considerate.'],
  ['The King in Yellow. I can write it now. Quite steady.'],
  ['Labelled everything today. Everything was already labelled.'],
  ['Two suns this morning. Drew the blind halfway. One adapts.'],
  ['Do not lick. (He agrees.)'],
  ['Coffee is still not a reagent. He tested it a third time.'],
  ['The creatures no longer hum. They sing it outright. Rather well.'],
  ['I was afraid it would be terrible. It was. I was right to want it.'],
  ['No mask. I checked. Twice, as a chemist should.'],
  ['The landlord is back. Does not recall leaving. Nor I staying.'],
  ['The cat sits on the bench. The cat is permitted. Everything is.'],
  ['A new run. No hurry. There is all the time in Carcosa.', 'start'],
  ['Begin. Three reagents, one flask, one spectator. Full house.', 'start'],
  ['Met the spec. He nodded. One does like to be nodded at.', 'win'],
  ['Won. He kept score too. His sum agrees: 12 + 7 = 20.', 'win'],
  ['Under spec. It does not matter. Nothing has, since. Rather restful.', 'loss'],
  ['Lost the round. He says the second act has losses too.', 'loss'],
  ['OVERREACT. He claps, slowly, in tatters. It makes no sound.', 'overreact'],
  ['Overreact. The page shakes. I do not. Not any more.', 'overreact'],
  ['A long chain. I no longer count the steps. They count me.', 'chain'],
  ['A dead page. He enjoys those too. He told me so.', 'waste'],
  ['The supplier asks what I saw. Told him the price went up.', 'shop'],
  ['Bought it. The supplier gave me a discount and stood well back.', 'buy'],
  ['Everything found. The catalog is complete. He thanks me by staying.', 'unlock'],
  ['The instruments point where they like now. So do I.', 'instrument'],
  ['The sign is only a mark now. A signature on a finished page.', 'sigil'],
  ['Sulfur. A cheerful colour. I cannot think why I ever minded.', 'el:S'],
  ['Nitrogen, chlorine, bromine. Old friends. They bow slightly now.', 'el:N'],
  ['Chlorine green. He prefers it to yellow, as it happens. We laughed.', 'el:Cl'],
  ['Bromine. The curtain is up. It was brown on both sides.', 'el:Br'],
  ['He returned the gold. Every coin. They are heavier now.', 'gold'],
  ['The spec, in his hand and mine. One cannot tell them apart.', 'spec'],
  ['The catalog is full. I read it aloud at night. It is the second act.', 'catalog'],
  ['Water lies still. I see the far shore. It is this one.', 'hom:water'],
  ['Hydrogen came down from the ceiling. Nothing more to look for.', 'hom:h2'],
  ['Dry ice keeps my tea cold. I have come to prefer it.', 'hom:co2'],
  ['Acid ate the thin book at last. Says it was dry.', 'hom:acid'],
  ['Wood spirit drinks to the King. Sensible. I join it.', 'hom:wood'],
  ['Salt has cured the last C=O. Nothing changes now. Lovely.', 'hom:salt'],
  ['Slime let go of my hand. I kept writing anyway.', 'hom:slime'],
  ['Seedling\'s flower has closed. It was a private showing.', 'hom:seedling'],
  ['Ammonia woke the page. It fired twice. He was twice pleased.', 'hom:ammonia'],
  ['Brimstone burns low and steady. A night-light. I know whose.', 'hom:brimstone']
]);

AA.NOTES = NOTES;

// the madness scale the notes were written against: the career (unlocks) carries most of it, the run and the chain the rest
AA.notesDepth = function (unlocks, round, rounds, chain) {
  const u = Math.max(0, Math.min(1, unlocks || 0)), n = Math.max(2, rounds || 9), r = Math.max(0, Math.min(1, ((round || 1) - 1) / (n - 1)));
  const c = Math.max(0, Math.min(1, (chain || 0) / 14));
  return Math.max(0, Math.min(1, u * 0.65 + r * 0.3 + c * 0.05));
};

// state: { depth 0..1, unlocks 0..1, round, tag (a string or a list), homs (keys of the creatures owned: 'water', 'h2', ...), used (texts already shown) }
// Returns the notes that fit. With a tag that has notes here, only those. Otherwise the untagged notes and the notes of owned creatures.
// Never returns an empty list: it widens the unlocks range, then the depth, before giving up on a tag.
AA.notesPick = function (state) {
  const s = state || {}, d = Math.max(0, Math.min(1, s.depth || 0)), u = Math.max(0, Math.min(1, s.unlocks || 0));
  const tags = s.tag == null ? [] : [].concat(s.tag), homs = (s.homs || []).map(h => 'hom:' + h), used = s.used || [];
  const inR = (v, r, pad) => v >= r[0] - pad && v <= r[1] + pad;
  const okRound = n => !n.round || s.round == null || (s.round >= n.round[0] && s.round <= n.round[1]);
  const fit = (dp, up) => NOTES.filter(n => inR(d, n.depth, dp) && inR(u, n.unlocks, up) && okRound(n));
  const fresh = l => { const f = l.filter(n => used.indexOf(n.t) < 0); return f.length ? f : l; };
  const steps = [[0, 0], [0.08, 0.15], [0.15, 1], [1, 1]];
  if (tags.length) for (let i = 0; i < steps.length - 1; i++) { const l = fit(steps[i][0], steps[i][1]).filter(n => n.when && tags.indexOf(n.when) >= 0); if (l.length) return fresh(l); }
  for (let i = 0; i < steps.length; i++) { const l = fit(steps[i][0], steps[i][1]).filter(n => !n.when || homs.indexOf(n.when) >= 0); if (l.length) return fresh(l); }
  return [];
};

// '~struck~ and _under_' to [{ s, struck, under }] so the pen can draw a line through or under a piece
AA.notesParse = function (t) {
  const out = []; let m; const re = /~([^~]+)~|_([^_]+)_|([^~_]+)/g;
  while ((m = re.exec(t))) out.push(m[1] != null ? { s: m[1], struck: true } : m[2] != null ? { s: m[2], under: true } : { s: m[3] });
  return out;
};

if (typeof module !== 'undefined' && module.exports) module.exports = { NOTES, notesPick: AA.notesPick, notesDepth: AA.notesDepth, notesParse: AA.notesParse };
})(typeof globalThis !== 'undefined' ? globalThis : window);
