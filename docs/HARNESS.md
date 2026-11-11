# Overreact: the harness

Every design, every build and every message to the owner is checked against this page before it goes out. It was built from every message the owner typed in both sessions (8 to 11 November 2026). Where a line is in quotes it is the owner's words. When the owner makes a new ruling it is added here the same turn. Message numbers in brackets: O is the first session (8 to 10 November), N is the second (10 to 11 November). N1 is the pasted session-start brief, endorsed by the owner but not typed by them.

## The current design, settled with the owner on 11 November

This section is the frame. Everything else on this page is read through it. Where an older line disagrees, this section wins. Older ideas are used only where they fit it.

A. A chain reaction: after the three reactions fire, any parts of the molecule that can change each other do so by themselves, and what that leaves may set off more. Nobody presses anything during it.
B. "You must make all three reactions chosen at the beginning of a run to set up larger and larger chain reactions like in balatro. And, by unlocking stuff, messing with the types of reactions, gameplay, chance, and a bunch of game elements we have discussed, you're trying to make that as big as possible."
C. "The whole point is to have every run be different and then use all of the player elements to change the odds or interactions between 3 reactions."
D. Six reactions at the start. Fifteen to twenty in the end. Reactions dealt each turn are random from a pool; unlocks and the player's own choices change the pool and the deal. One run carries only a few, like Vampire Survivors. Everything after the first six is being re-evaluated from nothing.
E. Closing a ring is only ONE thing a molecule can do by itself. These self-reactions are a set, "more than" the three first shown, each a piece of the game.
F. Built like a pyramid: every element (reactions, self-reactions, what comes off, helpers, creatures, coins, unlocks) builds on the others, "like chained elements going back and forth".
G. Long chains come "by a combination of strategy and chance".
H. Reactions come in sizes unlocked by play; bridging is one; heavier compounds are an upgrade path; making real compounds such as cholesterol is an achievement.
I. Helpers are lab objects and small real molecules (methane, methanol). Each is a big physical act on the molecule that does what the real object does, at a chosen place or on the whole structure: a mirror on a bond reflects the molecule there; a burner heats the whole structure so every OH loses water and becomes a C=C. Never say "reacts" without naming the exact change.
J. Helpers are unlocked for good by special things done in play, and then are not given every time (Vampire Survivors). Coins let the player decide which helpers to buy; better ones cost more.
K. What comes off the molecule is a separate system: jars that fill across runs, one creature (homunculus) per jar, about ten, slower jars better or more complex, thematic. The ten are settled in `HOMUNCULI.md`.
L. Creatures must make a run deeper in strategy and never be "just reactions that can be pulled". They are perks: they can break chemistry and must be zany. What feeds one must be something the player's reactions make reliably. The player triggers it, it works only when it can, and it does not choose for the player. Their strengths are compared and evened by sub-agents.
M. A page is one turn, a round is one molecule with three turns, a run is the whole game. Before a round the player picks one of two molecules and can pay to redraw. "Resource management that isn't punishing."
N. Tiers: "a quick unlock tier that gradually expands in difficulty between tiers". A run is three rounds, then six, then nine.
O. Players need a lot to do between runs.
P. "New players are inexperienced that's the whole point of playing the game." No preview of what three reactions will do, no hints.
Q. When the total passes the four marks the page letters: stable, unstable, volatile, and overreact last.
R. Foundations first, then up. Later things and unlocks enhance the base. The owner will not play it until it is polished and fun.
S. Talking to the owner: plain words and none of the game's own jargon; one thing at a time and short; a schematic picture for every suggestion; do not list problems, fix them; if there is an issue, evaluate it and resolve it; no line that labels or excuses a design; do not exaggerate or dramatize; answer about the state of the game as it stands today.
T. Working: many sub-agents at once; sub-agents evaluate everything; keep building without waiting.
U. Build paths and every mechanic are evaluated by simulating from SMILES with RDKit, with reactions written exactly (`docs/tools_chem/`). The molecules themselves may be made up, and wild ones are wanted: "Made up molecules is fine wtf that's half the fucking fun of this insane shit." What is not acceptable is a crude stand-in that is not a real structure. "I told you to evaluate build paths and stuff using smiles." "You can do that with rdkit."
V. Starting molecules: the number of atoms goes up each round as the score needed goes up and more complex interactions are needed. They do not have to be wild.
W. Difficulty: "the bar should not be an average person wins the whole game, getting every single thing and unlock should be hard but not impossible but not easy." The first short runs are winnable by a new player; a full run is not something an average player wins as a matter of course; having everything unlocked is hard.
X. Learn from Balatro, Dead Cells, Vampire Survivors and others: difficulty ramps non-linearly; winning is a different thing from the score marks. But "it can't just straight copy those it needs to be our version of it fit for this game." Take the reason a thing works, then build it from this game's own pieces: molecules, reactions, what comes off, helpers, creatures.
Y. Winning a round is making something: the player is given a target for the molecule at the start and wins if the molecule has it at the end. Points are a separate thing and pay coins. The owner agreed on three conditions: "With an unlimited number of possibilities, sure but we have to keep it realistic and have to do lots of testing." So targets are generated, not a short fixed list; each must be something the dealt molecule can really become with the reactions the player holds; and every kind of target is tested on the engine over many molecules before it is used.

## The lines broken most often

1. Plain wording only. No jargon, no "Claude speak", no AI-slop or twee writing, no game words the owner has not learned. Said at least 17 times. "Okay stop talking in the jargon of the game. For the final fucking time." [O28, O37, O42, O52, O62, N87, N119, N127, N130, N136, N143, N144, N202, N206, N215, N247, N249]
2. Meta progression, unlocks and a deep tree, earned by gameplay. Said at least 16 times. [O54, N19, N20, N33, N34, N40, N120, N121, N143, N146, N197, N225, N239, N240, N242, N243]
3. Equipment objects must exist, have jobs, and look right. Said 15 times. [O52, N19, N32, N34, N43, N65, N70, N100, N103, N110, N112, N142, N162, N165, N168]
4. It must be fun and a real game, not a chemistry simulator or a spreadsheet. Said at least 14 times. [O25, O28, O29, O31, O32, O35, O36, O37, O38, N31, N72, N142, N144, N149]
5. Chain reactions that grow bigger, built by strategy plus chance. Said at least 14 times. [O55, N19, N28, N41, N43, N71, N73, N85, N86, N131, N138, N139, N140, N151]
6. The owner must be able to tell what is on screen and what the lead means. Said at least 14 times. [O40, O62, N46, N67, N68, N77, N81, N93, N98, N99, N132, N133, N195, N209]
7. Make it exciting, flashy, dopamine, streamable. Said 13 times. [O37, O38, O45, O49, O52, N31, N32, N43, N72, N89, N90, N92, N93]
8. Animation must be tuned and fun, not sloppy. Said 11 times. [O45, N55, N62, N63, N69, N71, N72, N89, N90, N91, N92]
9. The lead is the game designer and must design: loop, depth, fun, reward. Said 11 times. [O25, O28, O29, O31, O32, O35, O36, N31, N142, N144, N149]
10. Explore several options and build all of them so the owner can see them, not choose blind. Said 11 times. [O64, O67, N3, N5, N36, N51, N52, N56, N57, N68, N69]
11. The number to beat and the words shown when it is passed. Said 11 times. [O60, N48, N73, N116, N227, N228, N229, N230, N231, N233, N234]
12. Do not make it look AI-made or sloppy. Said 10 times. [O25, O52, O63, O66, N50, N51, N90, N93, N96, N103]
13. Show the example, picture, schematic or movie, do not describe in words. Said 10 times. [O30, N47, N68, N69, N80, N132, N133, N139, N203, N224]
14. Always use sub-agents to evaluate, with the context and references, and many in parallel. Said 9 times. [N97, N99, N117, N124, N125, N128, N218, N222, N241]
15. Do not wait for the owner, keep building. Said at least 8 times. [O21, O30, O33, O34, N102, N105, N109, N117, N125, N152, N223]
16. Balatro is the model. Said 8 times. [O49, O54, O56, O75, N1, N71, N85, N140]
17. Self-reacting molecules (ring formation, dehydration, polymers, resonance). Said 8 times. [N77, N86, N89, N91, N92, N94, N204, N244]
18. Depth, variety, replay, every run different. Said 8 times. [O34, O54, O58, N17, N34, N122, N145, N248]
19. Talk less at once and be concise. Said 6 times. "Stop talking so fucking much at once." [O28, O52, N136, N180, N237, N249]
20. Dopamine, streaming and virality. Said 6 times. [O54, O58, N43, N72, N122, N145]
21. Atoms and molecule stay readable ball-and-stick, no faces, no restyling. Said 6 times. [O19, O37, O41, O68, N1, N55]
22. Sigils and pets only later, earned by play. Said 6 times. [N107, N118, N120, N121, N122, N143]
23. Build from foundations up like a pyramid. Said 6 times. [N120, N121, N225, N236, N242, N243]
24. The lead forgot what the owner already said. Said 6 times. "I keep ducking saying this." [N62, N91, N141, N143, N240, N248]
25. Molecule hard to read or badly drawn. Said 7 times. [N35, N53, N55, N59, N72, N157, N187]
26. Crowding and things covering the reaction. Said 6 times. [N37, N46, N67, N77, N78, N93]
27. Equipment art crude and must be redrawn. Said 6 times. [N42, N51, N103, N104, N105, N112]
28. Fast, round-based, snappy pace. Said 4 times. [O75, N1, N31, N93]
29. Raccoin as a model. Said 4 times. [N41, N71, N85, N93]
30. Same demos and boring alkanes. Said 4 times. [N55, N82, N94, N166]
31. Self reaction must feel good and be seen. Said 4 times. [N89, N91, N92, N94]
32. The flask covers the reaction and is unexplained. Said 4 times. [N77, N78, N116, N168]
33. Always give clickable options, three options for any design choice. Said 4 times. [N1, N3, N5, N10]
34. Hide the info, show the reveal, fewer words. Said 4 times. [O52, O60, O62, N42]
35. Steam branch only, never the deployed site or main. Said 4 times. [O22, O23, O24, N1]
36. Do not tell me what you have not done, just do it. Said 3 times. [N80, N104, N105]
37. Do not implement my words literally, assess and build on them. Said 3 times. [O34, O46, N1]
38. Licensing for commercial use, checked at the source, ask before downloading. Said 3 times. [O21, O67, N1]
39. Dead Cells and Vampire Survivors as models. Dead Cells twice [O54, N1], Vampire Survivors twice [N99, N240].

## What the game is

40. The first idea was a chemistry game for a kid, with molecular views and combining. "completely chemistry based, molecular representations (stick and ball, orbitals, etc)" [O1]
41. The learning site was to get quizzes from the lesson questions, a molecules module, molecular orbitals, and double and triple bonds. [O6, O7, O12]
42. Compounds the player makes should link to real data. "linked to some internal data that shows it's a real compound? (Maybe a Wikipedia link?)" [O14]
43. The learning content was to reach 100 lessons with progress and badges. "Let's get up to 100" [O16, O17, O18]
44. The learning models must not jitter or float, no heat stuff, no flopping lone pairs, no ugly space-filling models. [O19]
45. The Steam fork: "what if I'm considering expanding this into a video game on steam... I would love to make it as deeply complex as possible then." [O20, O21]
46. Never touch the deployed site; the game lives on the game branch. "i told you not to touch the fucking deployed website!" [O22, O23, O24]
47. Draw molecules ball-and-stick only for now; orbitals and more intense animations come later with weird chemistries. [O41]
48. Atoms are not cartoons and have no faces. "Why did you change all the atoms to cartoons?" "not just smiling stick balls god damn." [O37, O68, O69, N1]
49. The 2D design must combine with 3D structures. "Some of this might need 3D structures right? So how do combine it" [O70, O71, O72]
50. Atoms added to the undersides of molecules must be visible in 3D. [N101]
51. Nothing may hide the reaction, and nothing on screen may be unidentifiable. [N77, N78, N81]
52. The game needs a gameplay loop and puzzles; the owner could not see the fun. [O25, O26, O28, O29, O30, O31]
53. It must be fun and also reward real scientists. "i want this to be fun but tickle those that are actually scientists" [O26]
54. It shows chemical complexity and depth, with flow charts and a proof of concept. [O30]
55. It is not just a chemistry simulator. [O32, N31]
56. The core is a puzzle that gets more complicated as the player progresses, with exciting things on screen. [O37, O38]
57. The owner needs to know the whole loop and the meta loop that keeps people playing. [N19, N30, N127]
58. The game needs snappy, snazzy feel, not only chemistry. [N31]
59. The owner will not play it until it is polished and fun. [N238]
60. The owner wants a functional, fun prototype to iterate on, and to know how close it is. [N153, N159]
61. Show every element of gameplay that makes it fun, complex and viral. [N145]
62. Build the game as a pyramid from the base up; every unlock and later layer builds on and enhances the foundation, chained back and forth. [N225, N242, N243]
63. New players are inexperienced, and that is the whole point of playing. [N246]
64. Whole arc planned like a roguelike and Balatro. "I need to understand the entire gameplay arc." [N121]
65. More stages are needed. [N122]
66. Name: "lets call it overreact". [O47, O49]
67. The game does not use login streaks, timers or paid currency. [N1]
68. A cash economy must not make it feel like a mobile game. "has to be done right." [O56]

## The turn and what the molecule does by itself

69. The round must be fast and round-based with a clear commit moment and a payoff. [O75, N1]
70. Remove drag, keep click and keys. [N2]
71. The bottle round was rejected: too much to read per bottle, not simple and roguelike. [N2, N3]
72. Three reactions are chosen at the start of a run and set up larger and larger chain reactions like Balatro. "I don't know how that wasn't clear." [N140]
73. The owner asked how many reactions are allowed and how a chain works in play. [N141, N151]
74. Each page offers five of the reagents held, drawn at random. [N59, N60]
75. The player chooses where a reaction lands, and the risk is not seeing the next page's draw. [N181, N216]
76. The owner asked how a bond is chosen and when a reaction triggers. [N157, N210, N213]
77. The commit is a chain that is the player's shot, with the equipment taking the stage. [N43, N73]
78. The owner asked why the game presses buttons and said anything automatic must be explained. [N135]
79. The molecule must react with itself, such as ring formation and dehydration. [N77]
80. Runaway reactions and self-limiting ones, with a catalyst. [N86]
81. Resonance gets a special multiplier, and the player may spin the bonds to make self reactions happen. [N89]
82. Self reaction like polymerization must be understandable. [N89]
83. Every self reaction must blitz and feel exciting. "When the self reaction occurs, it needs to feel better dude." [N91, N92]
84. The compound must keep growing, not react the same parts. [N94]
85. Deeper play lets the player build complex molecules themselves instead of buying them as starting materials. [N85]
86. Long chains come from strategy and chance together. [N132]
87. Zany long plays: "how do we overreact how do we chain react". [N131]
88. Rings closing is only one self reaction, not a step in every game. [N244]
89. The owner questioned why molecules react with themselves and how pairs keep going. [N132, N133, N204]
90. Reactions must transition smoothly and be seen clearly. [N88, N89]
91. The turn must be understandable on screen. "I'm not seeing what happens on screen." [N77, N81]

## Reactions

92. Reactions must be varied and surprising, with weird chemistries such as box structures and peptides, not alkanes. [N82, N166]
93. Four molecules are not enough, and the list needs a gameplay reason. Picked: families with a trait. [N83, N84]
94. New reaction kinds unlock, with scaling rarity and score tuning; radicals unlock polymers for a big boost. [N59, N60]
95. Rare versions of reagents exist. [N32]
96. The draw is random from a pool, shaped by unlocks and profile, and the monkey's paw can swap one out. [N141]
97. Small reactions early, bigger pop-offs unlocked by play, such as a phenol followed by a carbon double bond replaced. [N146]
98. Bridging is a reaction type. [N147]
99. The pool starts at six and grows to 15 or 20, so every run differs and player elements change the odds across the three reactions. [N248]
100. The owner asked which reaction types exist beyond the first six. [N247]
101. Name reactions exactly; the word "react" is ambiguous. [N164, N209]
102. A reliable CO2 source is needed for a mechanic to work; the amount of hydrogen can be adjusted later. [N207, N208]
103. Simulate mathematically from SMILES to iterate faster. [N155, N159, N160]
104. Show varied demos, never the same reactions again. [N55, N82]

## Runs, rounds, scoring and the number to beat

105. A run, a round and a page must be named clearly and kept apart; rounds chain together. [N195, N196]
106. Page pressure: the molecule carries from page to page, and a run of linked reactions multiplies the score. [N28]
107. Hydrogenate is a finishing move. [N23]
108. Long synthesis structure was surveyed and moved on. [N22]
109. Score fixes: flatten the multipliers, then tune and report. [N11, N13]
110. Selectivity is the risk. [N14]
111. The flat 2D test screen is rebuilt in 3D after the rules are balanced. [N14]
112. Hide each bottle's score so the count-up is a reveal. [O60]
113. Feedback built first: quota crossing and final hit. [O60]
114. Kits, grades and feats. [O61]
115. Split the score, then add briefs. [N40]
116. Make the number to beat close. [N73]
117. No more checkmarks. "more checkmarks is not something I like on first sight". [N47]
118. The flags sit at 1, 2, 4 and 8 times the number. [N228]
119. Flag words are stable, unstable and volatile for flags 1, 2, 3, and Overreact at flag 4. "I think the final one should be overreact." [N233, N234]
120. Replace the word "beaten". The game's own name must appear. [N227, N229, N230, N231]
121. Plain words only: no "at risk", no "stamp". [N25, N26]
122. Credit survives a failed run: every stamped page counts. [N20]

## Coins and buying

123. The economy is surplus product. [O57]
124. The owner asked about coins and a bank. [N129]
125. Resource management must not be punishing. [N200]
126. Starting molecules: how they are chosen and whether to offer a re-roll. [N199]
127. Selling and swapping. [N34]

## Helpers and equipment

128. Equipment fires in turn. [N32]
129. Equipment changes the rules. [N34]
130. Equipment takes the stage on the page. [N43]
131. Equipment stands on a shelf along the back. [N70]
132. Equipment has real silhouettes built in code, and all 40 were to be redrawn. [N42, N103]
133. A goat and a knife are two separate objects. [N100]
134. Draw one at a time and just do it. [N104]
135. Accept the art and continue. "Why are you waiting?" [N105]
136. Keep object counts straight: 20 versus 60 objects, and the art for the 20. [N110, N112, N142]
137. The drawings are kept and unlocked over time through gameplay. [N143]
138. Objects should include simple chemistry pieces such as methane or methanol. [N168]
139. Perks can break chemistry. [N212]
140. Mirror in the middle of a bond reflects the molecule backwards. "You should be more creative about this stuff" [N162]
141. A burner acts on the whole structure, not a single spot. [N163, N165]
142. Reagent meters such as litmus paper must look good. [N96]
143. Mass spec, infrared and proton NMR need a clear purpose. [O52]
144. Helpers: special things permanently unlocked but not given every time, like Vampire Survivors. [N240]
145. The monkey's paw swaps a drawn reaction. [N141]

## What comes off, jars and creatures

146. Escaping hydrogen and water must do something. Picked: fly into equipment that catches them, collect to spend, a gauge. "Yeah do everything" [N64, N65, N66]
147. The flask, beaker and balloon must be explained; the flask is cut and prizes pop up. [N116, N168]
148. Common elements collected give a payoff separate from helpers. [N169, N170]
149. Fill-up items work one for one, and slower-filling ones give a more complex element. [N171, N172, N173]
150. Homunculi unlock through the collection. [N174, N175]
151. They must be thematic. [N172, N176]
152. List them one by one for feedback. [N177]
153. They squish when they move. [N178]
154. Their rules must be exact and concise. [N180, N185, N188, N189, N190, N191]
155. They deepen strategy, not just pull reactions. [N193]
156. The water creature hydrates everything, not one bond type. [N194]
157. Do not park them; work them out. [N192]
158. The ammonia creature is smelling salts; the sprout goes where the player taps. [N216, N217]
159. Check balance of all creatures with parallel sub-agents. [N218, N220]

## Sigils and the occult

160. Alchemy unlocks between runs. [N33]
161. An occult angle after a certain tier, with the funny tiers. [N34, N38, N39]
162. Sigils are a run element on the ground. [N107]
163. Sigils sit under the molecule like a transmutation circle. [N118]
164. Sigils need less wordiness and more occult theme. [N119, N121]
165. Sigils fill as the compounds react and then do impossible things. [N122]
166. Sigils and pets appear only later, once the basics are covered. [N120, N121]

## Unlocks and progression

167. Order of layers: equipment, run, then tree. [N20]
168. Progression follows split and variety, chained together. [N17]
169. Between-run content: supplier tiers ending in the alchemist, starting kits, harder contracts, the collection. [N34]
170. Meta loops that matter: starting notebooks, habits before a run, contracts, record book and collection, maybe different workers. [N40]
171. Page events and things to collect. [N32]
172. Players need lots to do between runs. [N197]
173. A quick unlock tier softens the difficulty spike. [N239]
174. Unlocks change the pool dealing. [N142]
175. Progression by play; never every layer on the first run. [N120, N121]
176. The unlock tree is deep and balanced with returns on purchases. [O54]
177. Balatro-style purchases carry onto later runs. [O49]
178. Have sub-agents evaluate every aspect and the interaction matrix, and balance everything. [N124, N125]

## Real compounds and achievements

179. Links to real compounds, and real-life connections. [O1, O14]
180. Achievements for making real compounds such as cholesterol. [N148]
181. The collection or record book. [N34, N40]
182. Progress and badges on the learning site. [O18]

## Replay, streamers and virality

183. The game is viral and cerebral. [O54, O58]
184. It must stream well and be entertaining to watch. [N43, N72]
185. Replay value, high score, earning mode, and what gets streamers to play. [N122]
186. Marketing is whatever can be done. [N123]
187. Every run is different. [N17, N34, N248]
188. Complexity may escalate like Raccoin and Balatro. [N85]
189. It must have fast pace. [N93]

## The page and words on screen

190. Show, do not tell: objects, icons and short tokens, almost no sentences. [N1, O62]
191. Symbols with words on hover. [N42]
192. Names under the pointer and a first round that points. [N68, N70]
193. Meaning of colours and symbols must be intuitive. [N98, N99]
194. Text is centered under the objects. [N113]
195. Own lettering drawn in code. [N114, N115]
196. Fonts must be licensed for commercial use; ask before downloading. [N1, O67]
197. Menus are full game screens, never centred dialogs with titled option boxes. [N1]
198. No crowding, no collisions, no empty page. [N37, N46, N67, N93]
199. Too much info at once is hard to digest. [O52]
200. Plain flat sentences in chat and in game, no quips, no ominous hinting, no second-person labels such as "your rack". [N1]
201. No em dashes, multiplication signs or middle dots. [O52, N1]
202. "Snow shut by itself" was called overly wordy AI. [N87]
203. "This breaks chemistry it is a perk" is the slop the owner has told the lead not to write. [N215]

## Art and the molecule

204. Reads as AI-made: the cards looked like Claude PowerPoint output. [O63, O66]
205. Cards are lab objects first; "A Bottles" was picked, then dropped. [O64, O65]
206. Mock all three looks with real typefaces. [O67]
207. Object style: inked toy set. [N52]
208. Notebook scheme for the round. [N18, N19]
209. Reactions on the page are drawn ink only. [N39]
210. Objects are 3D, readings are 2D drawn on them, and the 2D never gets its own background; tilted objects get their own yaw. [N1]
211. Art still sloppy: equipment, lettering and marks, colour, page and layout. [N50, N51]
212. Balloon and scale look bad. [N93]
213. Molecules unreadable as they grow; group them. Picked: beads. [N55, N58]
214. Drawing chosen: lean and flat; all four cuts. [N60, N61]
215. The compound is still hard to read. [N59]
216. Circles and kinking in the compound look bad. [N72]
217. Draw the molecule properly. [N73]
218. No long awkward bonds. [N157, N187]
219. Compounds must visibly change, staged up close. [N53, N54]
220. The change happens on the molecule. [N52]
221. Animations get a full tune: weight and snap, each piece fires its own way, idle life. [N55, N57]
222. The shooting line cylinders look ugly; stick glitches fixed. [N62, N63, N64]
223. Visual ideas: bits flying off, the close-up, equipment going off, the page heating up. [N37]
224. Do not hyper focus; build several ideas. [N36]
225. Power-fantasy blow-ups. "Build cycles and animations have to look fucking awesome though." [O45]

## Sound

226. Much louder when something big happens. [N32]
227. Sound is one of the listed fixes. [N73]
228. Study sound, feedback and onboarding. [N16]
229. Squish sound for creatures. [N178]

## Rejected looks and ideas

230. Dark navy.
231. Uppercase letter-spaced mono labels.
232. Serif headings.
233. Glow accents.
234. Flat lab signage.
235. Cards that resemble Balatro's.
236. Hard rectangles.
237. Bahnschrift.
238. Condensed font and flat boxes. [O67]
239. Playing-card shapes for the hand. [O65]
240. Bottles as the round. [N2]
241. Drag controls. [O75, N2]
242. The fuse and the whole button idea. [N75, N76, N90]
243. The flask, the beaker and the balloon. [N116, N93]
244. Checkmarks. [N47]
245. Space-filling models, jittering atoms, flopping lone pairs. [O19]
246. Cartoon atoms and faces. [O68]
247. A target molecule beyond the tutorial. [N30]
248. Lock-in or push-on and bank-or-carry rules. [N27]
249. Atoms and instruments with no purpose. [O52]
250. Instagram game ad look. [N90]
251. Twee, spooky redditor writing. [O37, O42]
252. The "noir" direction. [O42 to O49]
253. Same reactions in every demo. [N55]
254. Long awkward bonds and circles and kinking. [N157, N72, N187]

(Items 230 to 237 come from the pasted brief, N1.)

## How to talk to the owner

255. Every question comes as clickable options with the recommended one first. "Always provide options" [N1, N10]
256. For any design choice explore three options using the roguelike research. [N3, N5]
257. Build and show all options; do not make the owner pick blind. "Let's see lots of options." [O64, O67, N51, N52, N56, N57, N60, N66, N68, N69]
258. Do not make the owner commit to one when they want several. "Why do we have to commit to one?" [N41, N36, N69]
259. Do not ask questions the owner already answered. [N141, N143]
260. Do not quiz the owner on jargon; use plain words in questions. [N25, N26, N31, N164, N195]
261. Show the example, do not describe it. [N132, N133]
262. Give a schematic for what is suggested and for status: done, set, finished, left. [N203, N224]
263. Sketch things out. "Sketch that out" [N139]
264. The owner may be on mobile and not see pictures; send images in a form that arrives. [N134]
265. Send screenshots of anything visual; report plainly what was tested and what was not. [N1]
266. A movie or GIF of one round, recorded in Chrome. [N35, N47]
267. Give a plain status of the game. "What is the status of the game. You're talking in circles" [N226, N235, N236, N237]
268. Do not respond with bullet points of the whole conversation. [N249]
269. Do not talk about judges' picks; evaluate and fix. [N206]
270. Be concise and exact in rules. [N180]
271. Say what an idea does before building: how would it work, how does it trigger. [N171, N210, N213]
272. Short owner answers like "1", "Okay", "Sure", "Yeah", "Yes" are approvals; proceed. [N44, N45, N74, N126, N156]
273. Read free-text answers carefully; some contradict the question. [N27, N30, N12]
274. Answer questions that are curiosity, not commands. [N204]
275. When the owner is unsure, design it. When they state an idea, build on it. [N149, N170, N122]
276. Keep counts consistent. [N110, N112, N175]
277. Do not invent things the owner did not say. "I don't remember saying foaming" [N36]
278. Do not take a literal reading of an owner idea. [O34, O46, N1]
279. Keep outputs short and in pieces after an output limit. [O2, O48, O53, O73]

## How to work

280. Do not wait for the owner; keep building. [O21, O30, O33, O34, N105, N109, N117, N152, N223, N225]
281. Always run a fresh sub-agent to judge approach and result. [N97]
282. Sub-agents must know the context and the references (Balatro, Raccoin, Vampire Survivors). [N99]
283. Use sub-agents instead of waiting for feedback. [N117]
284. Keep going until the sub-agents pass every section. [N125]
285. If judges repeat feedback, assess it. [N128]
286. Run many sub-agents in parallel. [N218, N222, N241]
287. Play through the rounds yourself and evaluate. [N95]
288. Fix whatever is found. [N102, N243]
289. Do the work, do not say what you have not done. [N80, N104]
290. Go one at a time when told. [N104]
291. Do not park things. [N192, N193]
292. Study widely, not a few games. [O42, O43, O44, N15]
293. Study the roguelikes with sourced research on art style, meta progression, run structure, sound and onboarding. [N16, N3]
294. Use the learnings of all major roguelikes. [N3]
295. Foundations first. [N225, N242, N243]
296. Analyse the owner's idea and build on it, do not do it literally. [O34, O46, N1]
297. Be creative and not limiting. [N162, N165, N166, N172, N189]
298. Stop all work when told. [O77]
299. A proper prompt for a new session. [O80]
300. Keep the status visible: what is built and what is being built. [N108, N161, N160]
301. Ask before spending tokens on agents, at most 2 agents. [N1]
302. Time estimates must be real and iterations quick. [N154, N155, N159]
303. Deployment is not wanted early. [O3, O4]

## Repository, licensing and cost

304. Steam branch only; never commit to main or change the deployed site. [O22, O23, O24, N1]
305. Commit as m-g-mccoyiii with the owner's email, do not change git config, commit and push often. [N1]
306. Working copy is C:\Work\atlas-atoms; ignore stale copies, not OneDrive. [N1, O74, O77, O78, O79]
307. The game page is apps/steam/react.html, no node, no build step, CSP forbids inline scripts, bump ?v=N on edited scripts and CSS, serve with python -m http.server 8766. [N1]
308. Everything shipped must be licensed for commercial use, checked at the source. [O21, N1]
309. Ask before downloading any file; fonts permitted under about 300 KB each after the license check. [O67, N1]
310. The learning site's GitHub Pages was set by the owner; the kid site stays as it was. [O6, O9, O20]
311. Model switched by the owner. [N8]

## Superseded

312. earlier: audience is a very advanced 7 year old [O5]; now: a Steam game for everyone, as deeply complex as possible [O20]
313. earlier: quizzes, 100 lessons and badges as the main goal [O6, O16, O18]; now: the Steam game [O20]
314. earlier: the noir story direction [O33, O34]; now: restarted from successful games and named Overreact [O42 to O49]
315. earlier: heat with a hard limit [N7]; now: selectivity is the risk [N14]
316. earlier: bank-or-carry, all is lost with odds shown [N23, N24]; now: no lock-in or carry-or-push rule [N27]
317. earlier: make the pictured molecule as the goal [N29]; now: no target beyond the tutorial [N30]
318. earlier: a flask that boils over [N48]; now: cut the flask, pop-up prizes [N116]
319. earlier: click the product as input [N7]; now: reopened [N76, N135]
320. earlier: bottle round with queue and preview [N1, O55]; now: bottles rejected [N2, N3]
321. earlier: flat lab signage and GHS style [O65]; now: rejected as AI-driven [N1]
322. earlier: flag words proposed before stable, unstable, volatile [N227 to N231]; now: stable, unstable, volatile, Overreact [N234]
323. earlier: ask before spending tokens, at most 2 agents [N1]; now: always sub-agents, many in parallel [N97, N117, N218, N241]
324. earlier: flat typographic look [O26]; now: inked toy set with notebook scheme and own lettering [N52, N18, N115]
325. earlier: choose one option only [N41]; now: build and show all options [N51, N52, N56, N57, N69]
326. earlier: give options each time [N5]; now: stop giving options when they can all be evaluated [N68]
327. earlier: six reactions as the pool [N141]; now: six at first, grown to 15 or 20 [N248]

## Audit: what a second reader found missing or wrong

A fourth reader went back through every message against the list above. Its findings stand beside the list until they are folded in.

**(1) Messages missing from the checklist, with the line to add**

Old session (O)
- O10: Ruling (learning site, historic): add an iPad and iPhone toggle. "Can you add a toggle for iPad and iPhone?" [O10]
- O11: Ruling: a build that "Looks broken to me, can't do anything" is a failure the owner reports. Test that the thing works before showing it. [O11]
- O39: Ruling: do not hand over a file the owner cannot open, and do not default to HTML. "i can't seem to open that and why are you doing html?" [O39]. Item 264 covers only mobile images.
- O40: Ruling: every label or number on screen must be explained. "1 clue point here what the fuck is this shit?" [O40]. It is cited in the header but has no line.
- O42: Ruling: look at the most recent and current successful games and improve on their design "while also keeping the heart of ours intact". [O42]
- O44: Ruling: survey the popular successful games, not a few. "Things that have simple build cycles but are wildly popular." [O44]
- O47: Ruling (historic): "If we have a good idea, let's run with it. Let me see it." Names should be like "Chemogen but … more fun". [O47]. Item 66 cites O47 for the name Overreact, but that message does not say it. "lets call it overreact" is O49.
- O49: Ruling: build the two-feedstock choice and retune. Ask whether the game "has all the flashy stuff that i wanted". [O49]
- O55: Ruling (historic): routes and chains were picked as the first piece to build. [O55]
- O59: Ruling: selectivity was picked as the next piece (cite O59 on item 110). [O59]
- O69: Ruling: the 2D UI style must not clash with the 3D molecule. "These look very weird contrasted with the model." [O69]
- O71 and O72: Ruling: build the 3D bench mockup ("Yes, build the mockup"), then "Convert the rest". [O71, O72]
- O74: Ruling: the first gap to work on after recovery was "Hands-on play". The owner's standing complaint is that it lacks Balatro's feel and interactivity. [O74, N1]
- O21: Ruling: "Set up the shared core and fork structure; make the entire game based on all of these considerations, gaps, and learning." The checklist has only the licensing and don't-wait parts. [O21]
- O27: One-off task, no ruling: "fix the distractors and playtest files 3 to 12". [O27]

New session (N)
- N6: Ruling: the owner expects the earlier standard of ideas. "these suggestions really fucking suck, waht? did you lobotomize yourself? what happened to our good streak of ideas?" The mock-up picks were frame 1 "Molecule is the board", frame 2 "Push-your-luck flask" and frame 5 "Reaction map". [N6]. This message is missing entirely.
- N9: Ruling: "Offer part of rack". Only part of the held reagents is offered, which fits item 74. [N9]
- N17: Ruling: three art directions were to be drawn first. [N17] (historic)
- N19: Ruling: build "Equipment that rewards chains" next. [N19]
- N28: Ruling: page pressure comes from "1 and 2 together". Cite this on item 106, which keeps only the second half. [N28]
- N29 and N30: Ruling: the game must fit "the open ended nature of the games we've used to build from". This is the reason a target beyond the tutorial was rejected. Add the open-ended principle to item 56 or 247. [N29, N30]
- N31: Ruling: do not say "orders". "You keep saying orders?" The owner wants "snappy and snazzy stuff". Add "orders" to the banned jargon. [N31]
- N34: Ruling: the run ideas picked were "Choose the next molecule" and "Inspections". Only selling and swapping and equipment that changes the rules are in the checklist. [N34]
- N34: Ruling: the owner asked for "high high depth and gameplay repeatability. Lots of gameplay style and variety." This is partly covered by item 18 but is not attributed to N34 there. [N34]
- N35: Ruling: the order is "Fix the molecules, then the feel". [N35]
- N41: Ruling: Raccoin's three in-run items were all picked: "Molecule carries over, Row fires an event, Used-once items and page fixtures". Only the first is in the checklist. [N41]
- N43: Ruling: "The deal is a pull" and "One click sets off a chain" were picked together with "Equipment takes the stage". "We want the dopamine rush so we gotta explore lots of options." [N43]. The click-sets-off-a-chain part was later cut by N76.
- N49: Unresolved short instruction, "Turn the numbers". Record it so it is not lost. [N49]
- N52: Ruling: all four play fixes were picked: the change happens on the molecule, "Show the result before the click", "Make the row visible on the molecule", and "Loosen the timing". Only the first is in the checklist. [N52]
  - This conflicts with the commit note "no preview of what a line will do" and with O60 hide-the-number. Mark it for review.
- N54: Ruling: all three were picked: "Stage the change up close, Reactions that build the molecule, Mark each group on the page". Only the first is in item 219. [N54]
- N60: Ruling: all four ways of finding new reaction kinds were picked: "Rarity tiers on reagents, Families opened between runs, Polymers as a growing bead, Found by doing". Item 94 does not list them. [N60]
- N67: Ruling: the lead must actually look at the screen. "Can you see it?" [N67]
- N68: Ruling: "Stop giving options when we can just evaluate them all." Items 33 and 255 should carry this qualifier. [N68]
- N89: Ruling: ring formation should not just occur on its own. "I don't just like the ring formation occurring solo". The owner wants to explore other triggers. [N89]
- N93: Ruling: critically assess and improve your own work before showing it. "Why haven't you been critically assessing this stuff and improving it". [N93]
- N129: Open question: "what about coins and a bank??" Item 124 records the question but not that it is unresolved against item 123 (surplus product). [N129]
- N132: Ruling: molecular weight can be an upgrade path. "increasing molecular weight is something that we can have as an upgrade path … types of atoms or bonds available." [N132]
- N133: Ruling: "I also said heavier compounds not just atoms." [N133]
- N144: Ruling: do not slap rules onto everything without deep thought. "you seem to have slapped rules and stuff onto everything without deep thought?" [N144]. Only the wording half is in item 1.
- N166: Ruling: every piece should be as inventive as the mirror. "you need everything to be doing stuff like this. Half the examples you gave me sucked". [N166]
- N199 and N200: Ruling: "Should do both." Starting molecules are chosen and a re-roll is offered. "Resource management that isn't punishing." Item 126 holds only the question. [N199, N200]
- N212: Ruling: named items must do what the real thing does. "That's not what an acid does and also isn't really that zany." [N212]. Item 139 keeps only the "perks can break chemistry" half.
- N230: Ruling: "I just don't feel like react works" as the flag word. [N230]. Item 120 omits this.
- N232: Ruling: say what a word on screen responds to. "Wait what are the words in response to?" [N232]
- N245: Short ruling "More than that but sure". It is the answer to a count the lead proposed and is not recorded. [N245]
- N243: Ruling: do not state problems without fixing them. The message is cut off: "You keep stating there are issues without fucki…". Item 288 cites it but gives no line. [N243]

**(2) Checklist lines that misstate the owner**

- Item 83: the owner said "like the rest of the game. Every reaction Dude", so it should read "Every reaction must blitz", not only every self reaction. [N92]
- Item 169: it says supplier tiers end "in the alchemist". The owner said "Alchemist shouldn't be the end". [N34]
- Item 243: it lists the beaker and balloon as rejected, but N116 cuts only the flask with pop-up prizes. The beaker and balloon were not rejected. N93 says only that the balloon and scale "look like shit", which is an art complaint.
- Item 75: this is about homunculus (creature) placement, not reaction placement. N181 and N216 say "the player decides where" for the creatures. Fix the wording.
- Item 66: the message cited (O47) is name brainstorming, and "lets call it overreact" is in O49.
- Item 108: "surveyed and moved on" is wrong. The owner said yes to the long-synthesis structure with changes. "Yes, but test the bank-or-carry rule first" [N23]. That structure's lock-in rules were then rejected in N27.
- Item 122 (credit survives a failed run via "every stamped page" [N20]): stamping depends on the lock-in rule the owner rejected [N27]. The owner also did not understand "stamp" [N26]. Mark this as possibly stale.
- Item 312: "a Steam game for everyone" is not what the owner said. O20 says only "as deeply complex as possible".
- Item 313: "as the main goal" is the lead's framing. O6, O16 and O18 are plain requests.
- Item 303: it says "Deployment is not wanted early [O3, O4]", but O6 and O9 ask to get the repo and .io up and switch Pages. It should read "build first, deployment later, learning site deployed in O6 and O9".
- Item 327: N141 is a question from the owner about how many reactions are allowed. The owner did not say six there. Cite N248 only.
- Item 16: O75 does not mention Balatro, so remove it from the Balatro count.
- Item 103: N160 is not about SMILES simulation. Only N155 and N159 are.
- Item 29: N41 is the lead's option text, not the owner's. Raccoin is the owner's own word only in N71, N85 and N93.
- Items 33 and 255: the "always give three options" rule must carry the N68 limit, "Stop giving options when we can just evaluate them all".
- Item 317 and the Superseded list: N29 says "Yes but it needs more", not a flat yes. The owner then rejected it in N30.

**(3) Lines that are not something the owner said**

- Item 118: the flags at 1, 2, 4 and 8 times the number come from the lead's question [N228]. The owner did not say them.
- Item 74: "five" reagents per page is the lead's number. The owner only said "some random reactions" [N59].
- Item 78: the second half, "anything automatic must be explained", is an inference. The owner said only "why is the game pressing buttons??"
- Item 158: "the sprout goes where the player taps" is the lead's text. The owner said only that they should choose where.
- Item 205: "Cards are lab objects first" was the lead's proposal. The owner picked "A Bottles" and then rejected the bottle round.
- Items 273, 275 and 276 (read free-text carefully; when unsure, design it; keep counts consistent) are the lead's own practices, not owner rulings. Cite the actual owner messages (N149, N170, N122, N110) or remove them.
- Item 279: O2, O48, O53 and O73 are automatic "cut off / token limit" system messages, not the owner. Delete it.
- Item 298 (O77, stop all work) and item 299 (O80, a prompt for a new session) are one-off commands, not standing rulings.
- Item 311 (model switched, N8) is a command, not a ruling.
- Items 307 and 305 (repo and run details) and 301 are from the pasted brief N1, which the owner endorsed but did not type. Items 325 to 327 and 301 also mix in lead-made options.
- Item 145 duplicates item 96 (monkey's paw), and item 304 duplicates item 35.
