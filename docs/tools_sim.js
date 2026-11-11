// Overreact: the measuring rig. A whole run played with no page, by one of four simulated players, from a seed.
// Loaded only by .claude/rec.html. The copy in docs/tools_sim.js is the one under version control: keep them the same.
// docs/RIG.md says how to run it.
(function () {
  'use strict';
  const P = AA.rxPath;
  // What a piece is worth inside a build (MATRIX.md, In a build), and the pairs that are not plain: a pair's worth
  // over the product of its parts, kept where it is at least 1.15 or at most 0.87. Made from the matrix data.
  const WORTH = {"candle":3.5,"recycler":1.9,"pact":2.22,"voodoo":2.18,"cards":1.89,"transmute":1.82,"schlenk":1.76,"goat":1.69,"mortar":1.6,"stone":1.44,"cannula":1.41,"idol":1.39,"reflux":1.34,"hood":1.33,"stirrer":1.22,"balance":1.19,"scrubber":1.15,"dropper":1.14,"logbook":1.14,"tower":1.13,"scalepan":1.09,"regia":1.09,"poster":1.08,"thermometer":1.02,"coldtrap":1.02,"bunsen":1.9,"ouroboros":1.0,"stopwatch":1.0,"hourglass":0.97,"stopper":0.96,"litmus":0.96,"homunculus":0.9,"raven":0.9,"crystal":2.0,"sieves":0.88,"duck":0.84,"intern":0.81,"milk":0.81,"grimoire":0.8,"coat":0.8,"mirror":1.7,"magnet":1.8,"coffee":0.79,"spatula":0.78,"clamp":1.4,"ouija":0.74,"burette":1.9,"glory":0.7,"paw":0.7,"elixir":0.69,"dryer":0.68,"goggles":0.67,"extinguisher":0.66,"cat":0.66,"orb":0.65,"grant":0.65,"loupe":0.62,"timer":1.5,"mystery":0.59,"carousel":1.2};
  const PAIRS = {"balance+spatula":0.86,"balance+coat":1.31,"balance+mystery":1.18,"balance+recycler":1.21,"balance+carousel":1.16,"balance+transmute":0.86,"spatula+schlenk":0.84,"spatula+coat":1.16,"spatula+mystery":0.72,"spatula+mortar":0.79,"spatula+recycler":0.82,"spatula+crystal":0.82,"spatula+coldtrap":0.75,"spatula+scrubber":0.85,"spatula+carousel":1.21,"spatula+transmute":0.87,"spatula+voodoo":0.74,"spatula+tower":0.8,"spatula+candle":0.82,"schlenk+coat":1.94,"schlenk+mystery":1.16,"schlenk+carousel":1.23,"duck+coat":1.39,"duck+recycler":1.16,"duck+stirrer":0.76,"duck+cards":0.75,"duck+logbook":0.79,"duck+scalepan":0.79,"duck+coldtrap":0.8,"duck+hood":0.8,"candle+goat":0.61,"ouija+goat":1.46,"ouija+candle":0.82,"orb+candle":0.79,"hourglass+goat":1.21,"hourglass+candle":1.4,"idol+goat":2.46,"idol+candle":1.53,"idol+grimoire":1.29,"cat+candle":0.67,"cat+idol":1.39,"tower+candle":0.54,"duck+litmus":0.84,"duck+stopwatch":0.82,"duck+thermometer":0.84,"duck+stone":0.85,"duck+cat":0.75,"duck+candle":0.66,"duck+goat":0.78,"poster+regia":1.21,"tower+ouija":0.86,"tower+idol":1.42,"voodoo+goat":1.29,"voodoo+candle":0.72,"voodoo+ouija":1.35,"voodoo+idol":4.55,"elixir+goat":1.21,"elixir+candle":1.4,"elixir+hourglass":0.85,"ouroboros+ouija":1.16,"ouroboros+tower":0.52,"transmute+voodoo":1.24,"coffee+mystery":1.27,"stone+candle":0.82,"stone+cat":0.84,"timer+goat":1.39,"timer+ouija":1.43,"timer+cat":1.4,"timer+voodoo":1.32,"timer+ouroboros":1.18,"coffee+recycler":1.16,"dropper+goat":1.21,"dropper+candle":1.23,"dropper+ouija":0.84,"dropper+cat":1.23,"dropper+timer":0.82,"carousel+goat":1.42,"carousel+candle":1.68,"carousel+hourglass":0.79,"carousel+cat":1.72,"coffee+crystal":1.21,"coffee+scrubber":0.81,"carousel+tower":1.39,"carousel+voodoo":1.7,"carousel+elixir":0.79,"carousel+regia":0.78,"carousel+dropper":0.79,"thermometer+goat":0.86,"thermometer+candle":0.76,"thermometer+hourglass":1.2,"thermometer+cat":0.85,"thermometer+elixir":1.2,"thermometer+stone":0.85,"thermometer+carousel":0.86,"stopwatch+candle":0.71,"stopwatch+cat":0.82,"coffee+carousel":1.21,"coffee+dropper":0.82,"coffee+timer":1.6,"coffee+ouroboros":1.21,"stopwatch+thermometer":0.86,"litmus+goat":0.83,"litmus+ouija":0.83,"bunsen+candle":0.81,"bunsen+tower":0.59,"coffee+voodoo":1.34,"coffee+cat":1.28,"bunsen+carousel":1.76,"scrubber+goat":0.86,"scrubber+candle":0.7,"scrubber+tower":0.61,"scrubber+voodoo":0.68,"scrubber+transmute":0.85,"scrubber+timer":0.86,"scrubber+carousel":1.43,"scrubber+bunsen":0.8,"hood+goat":0.8,"hood+candle":0.51,"coffee+ouija":1.39,"coffee+candle":0.79,"coffee+goat":1.32,"hood+cat":0.83,"hood+tower":0.85,"hood+thermometer":0.86,"hood+stopwatch":0.83,"hood+litmus":0.71,"hood+bunsen":0.83,"hood+scrubber":0.78,"sieves+ouija":0.72,"sieves+cat":1.19,"sieves+ouroboros":1.19,"sieves+dropper":0.85,"sieves+thermometer":1.2,"sieves+hood":0.82,"dryer+candle":1.39,"dryer+ouija":0.85,"dryer+homunculus":1.15,"dryer+regia":0.87,"dryer+hood":0.87,"coldtrap+goat":0.67,"coldtrap+candle":0.65,"coldtrap+ouija":0.73,"coldtrap+cat":0.8,"coldtrap+tower":0.76,"coldtrap+voodoo":0.77,"coldtrap+regia":0.83,"coldtrap+carousel":0.75,"coldtrap+stopwatch":0.83,"coldtrap+hood":0.57,"scalepan+goat":1.16,"scalepan+cat":1.34,"scalepan+tower":1.27,"scalepan+voodoo":1.15,"scalepan+ouroboros":1.46,"scalepan+timer":1.28,"scalepan+carousel":1.71,"scalepan+thermometer":0.84,"scalepan+hood":0.82,"scalepan+sieves":1.17,"scalepan+coldtrap":0.78,"crystal+hourglass":1.3,"crystal+cat":1.61,"crystal+tower":1.2,"crystal+elixir":1.3,"crystal+ouroboros":1.52,"crystal+transmute":1.17,"crystal+timer":1.45,"crystal+dropper":1.29,"crystal+carousel":1.87,"crystal+bunsen":1.19,"crystal+scalepan":1.28,"logbook+goat":0.82,"logbook+candle":0.68,"logbook+cat":0.82,"logbook+transmute":1.15,"logbook+stone":0.87,"logbook+thermometer":0.84,"logbook+stopwatch":0.82,"logbook+litmus":0.83,"logbook+hood":0.8,"logbook+coldtrap":0.79,"logbook+scalepan":0.82,"cards+transmute":1.16,"cards+carousel":1.73,"cards+thermometer":0.84,"cards+stopwatch":0.74,"cards+litmus":0.78,"cards+bunsen":1.3,"cards+scrubber":1.33,"cards+hood":0.65,"cards+coldtrap":0.78,"cards+logbook":0.73,"stirrer+goat":0.83,"stirrer+candle":0.63,"stirrer+cat":0.81,"stirrer+thermometer":0.82,"stirrer+stopwatch":0.8,"stirrer+litmus":0.83,"stirrer+hood":0.68,"stirrer+coldtrap":0.76,"stirrer+logbook":0.76,"stirrer+cards":0.69,"recycler+goat":1.15,"recycler+ouija":1.23,"recycler+orb":0.78,"recycler+hourglass":1.58,"recycler+tower":0.53,"recycler+elixir":1.58,"recycler+transmute":1.31,"recycler+stone":1.18,"recycler+dropper":2.33,"recycler+carousel":2.08,"recycler+thermometer":1.23,"recycler+bunsen":0.74,"recycler+hood":0.83,"recycler+dryer":1.2,"recycler+crystal":10.09,"recycler+cards":0.74,"magnet+cat":1.16,"magnet+carousel":1.15,"magnet+litmus":1.16,"magnet+coldtrap":0.85,"clamp+cat":1.19,"burette+dryer":0.86,"burette+magnet":0.86,"cannula+dryer":1.19,"mirror+candle":0.59,"mystery+burette":0.82,"mystery+recycler":0.61,"mirror+tower":1.17,"mirror+ouroboros":1.84,"mirror+carousel":1.29,"mirror+scalepan":0.78,"mirror+crystal":0.86,"mirror+recycler":2.84,"mirror+magnet":0.76,"mirror+clamp":0.8,"mirror+burette":0.87,"stopper+cat":0.85,"stopper+ouroboros":1.65,"mystery+crystal":1.16,"mystery+coldtrap":0.75,"mystery+sieves":0.84,"stopper+dryer":1.22,"stopper+scalepan":0.75,"stopper+crystal":0.78,"stopper+recycler":1.17,"stopper+magnet":0.74,"stopper+clamp":0.78,"mystery+bunsen":1.19,"mystery+litmus":0.85,"mystery+carousel":1.34,"mystery+timer":1.23,"mystery+voodoo":1.24,"mystery+raven":0.85};
  // What a reagent added to the starting four is worth (MATRIX.md, Reagents). One not listed counts as 1.
  const REAGENT = { hcl: 1.02, cyclize: 0.86, aromatize: 0.66, socl2: 0.37, wittig: 0.21, memgbr: 0.15,
    // the reagents of the cascade game, in the order of what the screen (path.js screenRound) says each adds to the
    // steps of a page when held: chain on 1.0, add phenol 0.8, extend 0.6, bridge 0.3. The figures themselves are guesses.
    extend: 1.8, dione: 2.2, phenol: 1.9, couple: 1.5 };
  // Guesses, not measured: a stronger reagent, one more use, and a level as a share of the piece's worth above 1.
  const OTHER = { strong: 1.3, bottle: 1.1, level: 0.5, self: 1.6 };
  // How much a kind of round makes against a plain one, for choosing a round. Rounded from what the median player
  // made by kind in 150 runs under the rules of 2026-11-10 (budget of uses, hand, bank): the kinds are now within four
  // times of each other, where they were within ten.
  const EASE = { plain: 1, carry: 0.45, broad: 1.2, loose: 1.6, each: 1.6, back: 1.3, scarce: 0.55, short: 0.85 };
  // Round one medians by molecule with no equipment (MATRIX.md, Numbers to beat), used until path.js carries MOLF.
  const MM = {"OCC12C3C4C1C5C2C3C45CO":16159,"C=CCC(=O)CCC(=O)CC=C":9578,"OCC(O)CO":25303,"CC(=O)CCC(O)C1=CC=CC=C1":26283,"C=CCC(O)CC(O)CC=C":20614,"CC(=O)CCC(O)CC=C":15678,"OCC(O)C(O)C(O)C(O)C=O":292593,"CC(O)CC(=O)CCC(Cl)CCC=C":7968,"OCC1OC(O)C(O)C(O)C1O":78343,"C=CCC(O)CC=C":10361,"CC(O)CCC=C":3360,"OC(C=C)C1=CC=CC=C1":90263,"OCC1OC(O)CC1O":10304,"CC(O)CC(=O)C1=CC=CC=C1":17910,"O=C1CCC(CC=C)CC1":4910,"C=CCC(O)C1=CC=CC=C1":120118,"C=CC1CCC(O)CC1":4466,"OC1CCC(O)CC1":28160,"OC1CC2CC1C=C2":3819,"C=CC12C3C4C1C5C2C3C45CO":81079,"OC1CC2CCC1C=C2":3579,"O=C1CCC(O)CC1C=C":31093,"OC1C2CC3CC(C2)CC1C3":4543};
  const molF = (() => { let t = 0, n = 0; Object.keys(MM).forEach(k => { t += Math.log(MM[k]); n++; }); const gm = Math.exp(t / n); return smi => (P.MOLF && P.MOLF[smi]) || (MM[smi] ? MM[smi] / gm : 1); })();
  const syn = (a, b) => (P.RULE.five ? 1 : PAIRS[a + '+' + b] || PAIRS[b + '+' + a] || 1);

  // ---------- looking ahead: the state of a round is saved, a reaction is taken, and the state is put back ----------
  const snap = P.snap, back = P.back;
  const gainOf = (g, o) => P.peek(g, o).gain;
  const BANK = '#bank';
  // what a move adds at once: a reaction, or the bank
  const gainId = (g, o, id) => (id === BANK ? P.bankGain(g) : gainOf(g, o[id]));
  const doMove = (g, o, id) => { if (id === BANK) P.bank(g); else { P.synTake(g, o[id]); if (P.RULE.cascade === 'each') P.cascade(g); } };
  // a chain that is running is played to its end, the biggest gain at every fork. Returns how many links it ran
  function runChain(g, fork, rnd, each) {
    let n = 0;
    for (let a = P.chainOpts(g); a.length; a = P.chainOpts(g)) {
      let c = a[0];
      if (a.length > 1) { c = fork ? fork(g, a, rnd) : null; if (!c) { let top = -Infinity; a.forEach(q => { const v = gainOf(g, q); if (v > top) { top = v; c = q; } }); } }
      if (c === BANK) { P.bank(g); break; }
      P.synTake(g, c, true); n++; if (g.over || (each && each())) break;
    }
    return n;
  }
  // What the page is worth where it stands. A planner also counts what the open row will multiply on later pages,
  // and what a charged page would add when it goes off.
  // What the chain left standing is worth on the pages still to come: the zip rings open again when a page turns, so
  // the molecule as it would then stand is set off and its steps counted. A player that reads the page does not
  // wreck a chain that will go off again. Each step n is worth n places of the cascade, times the row it builds.
  function standing(g) {
    const left = P.pagesOf(g) - g.page; if (left <= 0 || !P.RULE.reopen || !P.RULE.cascade || g.over) return 0;
    const s = snap(g), q = g.queue; g.queue = []; P.reopenAll(g); g.casc = 0; const n = P.cascade(g); back(g, s); g.queue = q;
    // the places of the steps, and what the extra they add does to everything the round has made so far
    // steps up to the longest cascade of the round so far pay CASC.old of that (RULE.fresh)
    let tri = 0; { const b = P.RULE.fresh ? Math.max(g.cascBest || 0, g.casc || 0) : 0; for (let k = 1; k <= n; k++) tri += k * (k > b ? 1 : P.CASC.old); }
    return left * 0.7 * (P.CASC.place * tri * (1 + P.CASC.row * n) * g.E + (P.CASC.mul ? 0 : P.CASC.step * tri * (g.bank + g.P * g.R)));
  }
  function leaf(g, cfg) {
    let v = P.made(g);
    if (P.RULE.cascade === 'end' && !g.over && P.cascadeNext(g)) { const s = snap(g); P.cascade(g); v = P.made(g); back(g, s); }
    if (cfg.chain && !g.over && g.cur.path.length >= P.SYN.streak) { const s = snap(g); if (P.fire(g)) runChain(g, null, null); v = P.made(g); back(g, s); }
    if (cfg.stand && g.m.atoms.length <= BIG.far) v += standing(g);
    if (!cfg.deep) return v;
    const pagesLeft = P.pagesOf(g) - g.page;
    if (pagesLeft > 0) v = (g.bank + (g.P + 40 * 3 * pagesLeft) * g.R) * g.E;
    if (g.cur.path.length >= P.SYN.streak && !g.fired) { const o = P.options(g, true); Object.keys(o).forEach(id => { if (o[id].cont) v += Math.max(0, gainOf(g, o[id])) * Math.min(2, g.left[id] || 1); }); }
    return v;
  }
  // the best line of play from here to the end of the page or to depth reactions, whichever is nearer
  function search(g, depth, cfg) {
    const o = depth > 0 ? P.options(g) : {}, ids = Object.keys(o);
    let top = { val: -1, seq: [] };
    // the finishing reagent ends the round, so it is weighed only as the last reaction of the last page
    const fin = cfg.finish && g.page >= P.pagesOf(g) && g.pageSteps === P.stepsOf(g) - 1 ? P.finishOpt(g) : null;
    if (fin) top = { val: P.made(g) + gainOf(g, fin), seq: ['#finish'] };
    let cand = ids, kept = false;
    if (cfg.keep) { const c = ids.filter(id => !P.breaks(g, o[id])); if (c.length) { cand = c; kept = g.cur.path.length > 0; } }
    // a player that keeps the row banks only when nothing in the hand keeps it; one that may break weighs the bank always
    const canB = cfg.bank && depth > 0 && P.canBank(g) && !kept;
    if (!cand.length && !canB) { const v = leaf(g, cfg); return v > top.val ? { val: v, seq: [] } : top; }
    if (cfg.beam && cand.length > cfg.beam) {
      const gs = {}; cand.forEach(id => { gs[id] = gainOf(g, o[id]); }); const by = cand.slice().sort((a, b) => gs[b] - gs[a]), keepIds = by.slice(0, cfg.beam);
      const c1 = by.find(id => o[id].cont), c0 = by.find(id => !o[id].cont); [c1, c0].forEach(id => { if (id && !keepIds.includes(id)) keepIds.push(id); }); cand = keepIds;
    }
    if (canB) cand = cand.concat(BANK);
    cand.forEach(id => { const s = snap(g); doMove(g, o, id); const r = search(g, depth - 1, cfg); back(g, s); if (r.val > top.val) top = { val: r.val, seq: [id].concat(r.seq) }; });
    return top;
  }

  // ---------- the four players ----------
  // move(g, o, fin, ctx, rnd): the reagent to take from the options o, '#finish', or null to end the page
  // pick(run, picks, rnd): which of the three to take.  round(run, briefs, rnd): which round to play.
  const anyOf = (a, rnd) => a[Math.floor(rnd() * a.length)];
  const topGain = (g, o, ids) => { let best = ids[0], top = -Infinity; ids.forEach(id => { const v = gainId(g, o, id); if (v > top) { top = v; best = id; } }); return best; };
  const worthOf = (run, o, pairs) => {
    if (o.kind === 'gear') { let w = WORTH[o.id] || 1; if (pairs) { run.gear.forEach(h => { w *= syn(o.id, h); }); w /= o.id === 'pact' ? 2 : o.id === 'idol' ? 1.5 : o.id === 'hourglass' ? 1.25 : 1; } return w; }
    if (o.kind === 'level') return 1 + ((WORTH[o.id] || 1) - 1) * OTHER.level;
    if (o.kind === 'reagent') return REAGENT[o.id] == null ? 1 : REAGENT[o.id];
    return OTHER[o.kind] || 1;
  };
  const bestPick = pairs => (run, picks) => { let bi = 0, top = -1; picks.forEach((o, i) => { const w = worthOf(run, o, pairs); if (w > top) { top = w; bi = i; } }); return bi; };
  // the round that is easiest for what it pays: what the kind and the molecule make (the factors in the number), over the number
  const easiest = (run, briefs) => { let bi = 0, top = -1; briefs.forEach((b, i) => { const e = P.quotaParts(run, b.src, b.brief).mult / Math.max(1, b.quota) * (1 + 0.03 * (b.pays || 0)); if (e > top) { top = e; bi = i; } }); return bi; };
  // atoms in the molecule past which the look-ahead is cut to two reactions, and to one
  // cut: a round is stopped once the molecule has more atoms than this, or three times what it started with if that
  // is more. The rules let a molecule grow without limit and every reaction on a molecule of a thousand atoms takes
  // seconds, so without the cut one run in ten takes minutes. What the round had made by then is its total, so a cut
  // round reads low. The log marks it.  carry: a molecule left larger than this is not carried into the next round.
  const BIG = { near: 100, far: 250, twist: 150, cut: 600, carry: 300 };
  function planned(cfg) {
    return (g, o, fin, ctx) => {
      const ids = Object.keys(o);
      if (!ctx.plan || !ctx.plan.length || (ctx.plan[0] === BANK ? !P.canBank(g) : ctx.plan[0] === '#finish' ? !fin : !o[ctx.plan[0]])) {
        // a molecule that has grown very large is slow to react, so the look-ahead is shortened on it
        const left = P.stepsOf(g) - g.pageSteps, size = g.m.atoms.length, deep = size > BIG.far ? 1 : size > BIG.near ? 2 : cfg.depth;
        if (size > BIG.far && !cfg.keep) { ctx.plan = []; return ids.length ? topGain(g, o, ids) : null; }
        ctx.plan = search(g, Math.min(deep, Math.max(1, left)), size > BIG.near ? Object.assign({}, cfg, { deep: false }) : cfg).seq.slice();
      }
      const id = ctx.plan.shift();
      return id || (ids.length ? topGain(g, o, ids) : null);
    };
  }
  // line(g, fin, rnd): what a player places in the circles of a page, in order, before it is fired
  // the novice: reagents that act on the molecule as it stands, at random, with no thought for their order
  function lineNovice(g, fin, rnd) {
    const ids = Object.keys(P.options(g)), n = P.stepsOf(g) - g.pageSteps, out = [], used = {};
    for (let k = 0; k < n; k++) { const c = ids.filter(id => P.usesLeft(g, id) - (used[id] || 0) > 0); if (!c.length) break; const id = anyOf(c, rnd); used[id] = (used[id] || 0) + 1; out.push(id); }
    if (out.length >= 2 && g.cur.path.length + out.length > 2 && rnd() < 0.15) out[out.length - 1] = BANK;
    if (fin && out.length && rnd() < 0.3) out[out.length - 1] = '#finish';
    return out;
  }
  // the greedy player: the biggest gain now, then the biggest given what that made, and so on. The bank is one more number
  function lineGreedy(g) { const s = snap(g), out = []; for (let k = P.stepsOf(g) - g.pageSteps; k > 0 && !g.over; k--) { const o = P.options(g), ids = movesOf(g, o); if (!ids.length) break; const id = topGain(g, o, ids); out.push(id); doMove(g, o, id); } back(g, s); return out; }
  // a player with a plan searches the ordered plays of the page with its own look-ahead
  const lineSearch = cfg => g => { const left = P.stepsOf(g) - g.pageSteps, size = g.m.atoms.length; if (left <= 0) return []; if (size > BIG.far && !cfg.keep) return lineGreedy(g); return search(g, size > BIG.far ? 1 : size > BIG.near ? 2 : left, size > BIG.near ? Object.assign({}, cfg, { deep: false }) : cfg).seq.slice(); };
  const lineQ = base => base;
  // The pieces used on the molecule (docs/PIECES.md), each once a round. How a player uses them:
  //   read (median player): at the start of a page it works out, from the structure alone, the steps of the best
  //     line of the hand as the molecule stands, and the same after each unused piece at each of its places, and
  //     after each ordered pair of unused pieces (burner then burette, seed crystal then mirror). It uses a piece
  //     now only where that is worth at least one new step more than not using it, and otherwise holds it for a
  //     later page. On the last page it uses a piece that adds anything.
  //   plan (planner): the same, and it also counts what the molecule left by the best line would zip by itself on
  //     the pages still to come, a quarter each (a step that repeats pays a quarter).
  //   best (greedy): a piece is used where the bare structure reads better than leaving it, and only then.
  //   random (novice): each piece on a page taken at random, at a place taken at random, with no reading.
  const TOOLORDER = ['magnet', 'bunsen', 'balance', 'burette', 'mortar', 'crystal', 'mirror'];
  // what a molecule is worth to a player who reads only its shape: twice the steps it would zip as it stands, plus
  // one for every part a reagent could still work on (each oxygen, each C=C).
  const partsOf = m => { let n = 0; m.atoms.forEach(a => { if (a.el === 'O') n++; }); m.bonds.forEach(k => { if (k.order === 2 && k.a.el === 'C' && k.b.el === 'C') n += 0.5; }); return n; };
  const readOf = (m, self) => 2 * P.selfRun(AA.rx.cloneModel(m), self || P.SELF0) + partsOf(m);
  // a piece used at a place on a copy of a molecule, rings left as they are (as on the page), or nothing
  const toolAt = (m, id, spot) => { const RX = AA.rx, cm = RX.cloneMap(m), mp = v => (Array.isArray(v) ? v.map(mp) : cm.map.get(v)), sp = {}; Object.keys(spot).forEach(k => { sp[k] = spot[k] && typeof spot[k] === 'object' ? mp(spot[k]) : spot[k]; }); if (!RX.tools.apply(cm.model, id, sp)) return null; if (P.RULE.atoms && P.heavy(cm.model) > P.RULE.atoms && P.heavy(cm.model) > P.heavy(m)) return null; return cm.model; };
  const TOOLCAP = 4, PAIRCAP = [1, 3], FULL = 1, MID = 3, toolStat = { n: 0, ms: 0, used: {}, held: {} };
  // the steps of the best line of `depth` reagents of the hand on molecule m, each reagent no more often than it has
  // uses, and (far) what the molecule that line leaves would zip by itself on a later page
  function lineRead(g, m, hand, depth, far) {
    if (!hand.length || depth < 1) return { n: 0, stand: far ? P.selfRun(AA.rx.cloneModel(m), g.self) : 0 };
    let top = -1; const tops = [];
    P.screenLines(m, hand, g.self, depth).forEach((v, key) => { if (v.n < top) return; const cnt = {}; if (key.split(' ').some(id => (cnt[id] = (cnt[id] || 0) + 1) > P.usesLeft(g, id))) return; if (v.n > top) { top = v.n; tops.length = 0; } if (tops.length < 3) tops.push(v.m); });
    if (top < 0) return { n: 0, stand: 0 };
    let stand = 0; if (far) tops.forEach(t => { const c = AA.rx.cloneModel(t); AA.rx.reopen(c); stand = Math.max(stand, P.selfRun(c, g.self)); });
    return { n: top, stand };
  }
  // what a page of V steps pays, in new steps: a step past the longest cascade of the round counts one, a repeat a quarter
  const paysOf = (g, V) => { const b = P.RULE.fresh ? g.cascBest || 0 : 0, old = P.RULE.fresh ? P.CASC.old : 1; return V <= b ? old * V : V - b + old * b; };
  function readTools(g, mode, only, force) {
    const ids = TOOLORDER.filter(id => (!only || only.includes(id)) && P.canTool(g, id)); if (!ids.length) return null;
    const hand = g.kinds.filter(id => P.usesLeft(g, id) > 0), depth = Math.min(g.m.atoms.length > BIG.near ? 2 : 3, P.stepsOf(g) - g.pageSteps), left = P.pagesOf(g) - g.page, far = mode === 'plan' && left > 0, c0 = g.casc || 0, self = g.self;
    const val = (z, m, d) => { const r = lineRead(g, m, hand, d, far && d === depth); return { V: c0 + z + r.n, v: paysOf(g, c0 + z + r.n) + (far ? 0.25 * left * r.stand : 0), stand: r.stand }; };
    // every way of using one piece, or two in order: the molecule after, and the steps the pieces set off at once
    const cands = [], firsts = {};
    ids.forEach(id => { if (force && force !== id) return; let spots = P.toolSpots(g, id).map(sp => { const t = toolAt(g.m, id, sp); if (!t) return null; const z = P.selfRun(t, self); return { id, sp, m: t, z }; }).filter(Boolean);
      if (spots.length > TOOLCAP) { spots.forEach(q => { q.q = q.z * 2 + partsOf(q.m); }); spots.sort((x, y) => y.q - x.q); spots = spots.slice(0, TOOLCAP); }
      firsts[id] = spots; spots.forEach(q => cands.push({ ids: [id], first: q, m: q.m, z: q.z })); });
    if (!force) ids.forEach(a => { const fa = (firsts[a] || []).slice(0, PAIRCAP[0]); ids.forEach(b => { if (b === a) return; fa.forEach(q => { let sp2 = AA.rx.tools.spots(q.m, b, P.RULE.atoms).map(sp => { const t = toolAt(q.m, b, sp); if (!t) return null; const z = P.selfRun(t, self); return { m: t, z }; }).filter(Boolean);
      if (sp2.length > PAIRCAP[1]) { sp2.forEach(k => { k.q = k.z * 2 + partsOf(k.m); }); sp2.sort((x, y) => y.q - x.q); sp2 = sp2.slice(0, PAIRCAP[1]); }
      sp2.forEach(k => cands.push({ ids: [a, b], first: q, m: k.m, z: q.z + k.z })); }); }); });
    if (!cands.length) return null;
    // a quick reading (one reagent fewer) sorts them and drops those that do not beat leaving the pieces alone; the
    // full reading is taken of the best few
    let cs = cands; if (depth > 2 && cs.length > MID) { cs.forEach(c => { c.q1 = val(c.z, c.m, depth - 2).v; }); cs.sort((x, y) => y.q1 - x.q1 || x.ids.length - y.ids.length); cs = cs.slice(0, MID); }
    if (depth > 1) { const q0 = val(0, g.m, depth - 1).v; cs.forEach(c => { c.q = val(c.z, c.m, depth - 1).v; }); cs = cs.filter(c => c.q > q0 + 1e-9 || (force && c.q >= q0 - 1e-9)); if (!cs.length) return null; cs.sort((x, y) => y.q - x.q || x.ids.length - y.ids.length); cs = cs.slice(0, FULL); }
    const base = val(0, g.m, depth);
    let best = null; cs.forEach(c => { const r = val(c.z, c.m, depth); c.v = r.v; c.V = r.V; c.stand = r.stand; if (!best || c.v > best.v + 1e-9 || (Math.abs(c.v - best.v) < 1e-9 && (c.ids.length < best.ids.length || (c.ids.length === best.ids.length && c.stand > best.stand)))) best = c; });
    const last = left <= 0, ok = force ? best.v >= base.v - 1e-9 : last ? best.v > base.v + 1e-9 : best.v >= base.v + 1 - 1e-9;
    return ok ? best : null;
  }
  // pageOf(g): plays the page as the player would (mutating g). With it, a use the structure proposes is tried on
  // the page itself first and dropped if the page would then make less than without it: the structure reads the
  // steps of the cascade, not the row a reagent may break.
  function useTools(g, rnd, mode, only, pageOf) {
    const t0 = performance.now(); toolStat.n++;
    const held = TOOLORDER.filter(id => (!only || only.includes(id)) && P.canTool(g, id)); if (g.page === 1) held.forEach(id => { toolStat.held[id] = (toolStat.held[id] || 0) + 1; });
    let count = true; const go = (id, sp) => { if (P.toolGo(g, id, sp) && count) toolStat.used[id] = (toolStat.used[id] || 0) + 1; };
    if (mode === 'read' || mode === 'plan') {
      // what this page and the next make, played on a copy of the round: the next page is dealt from a source of
      // chance of its own, the same with and without the piece, so the run's own draws are not touched
      const madeOf = far2 => { const keep = { page: g.page, back: g.back, fore: g.fore, mirrored: g.mirrored, reopened: g.reopened }, s = snap(g); pageOf(g); if (far2 && !g.over && g.page < P.pagesOf(g)) { let sd = 4099 + 31 * g.page; const R = () => (sd = (sd * 16807) % 2147483647) / 2147483647; if (P.turn(g, R)) pageOf(g); } const v = g.over ? g.total : P.made(g); back(g, s); Object.assign(g, keep); return v; };
      for (let k = 0; k < 4 && !g.over; k++) { const c = readTools(g, mode, only, null); if (!c) break;
        const apply = () => { go(c.first.id, c.first.sp); if (c.ids.length > 1) { const c2 = readTools(g, mode, only, c.ids[1]); if (c2) go(c2.first.id, c2.first.sp); } };
        if (pageOf) { toolStat.asked = (toolStat.asked || 0) + 1; const tl = performance.now(), far2 = c.ids.includes('mirror'), v0 = madeOf(far2), s = snap(g); count = false; apply(); count = true; const v1 = madeOf(far2); back(g, s); toolStat.look = (toolStat.look || 0) + performance.now() - tl; if (far2) toolStat.look2 = (toolStat.look2 || 0) + performance.now() - tl; if (v1 < v0) { toolStat.veto = (toolStat.veto || 0) + 1; break; } }
        apply(); }
    }
    else held.forEach(id => { if (!P.canTool(g, id)) return; const spots = P.toolSpots(g, id); if (!spots.length) return;
      if (mode === 'random') { if (rnd() < 1 / Math.max(1, P.pagesOf(g) - g.page + 1)) go(id, spots[Math.floor(rnd() * spots.length)]); return; }
      const c0 = AA.rx.cloneModel(g.m); AA.rx.reopen(c0); let best = null, top = readOf(c0, g.self);
      spots.forEach(sp => { const t = P.toolTry(g.m, id, sp); if (!t) return; const v = readOf(t, g.self); if (v > top) { top = v; best = sp; } }); if (best) go(id, best); });
    toolStat.ms += performance.now() - t0;
  }
  const ORDER = ['gear', 'reagent', 'level', 'strong', 'bottle'];
  // Coins on the take-one page. coin(run, picks, rnd) answers 'reroll', 'skip', 'bin:<piece>' or nothing, and is asked
  // again after each. A player with a plan removes a piece that drags the build down, deals the three again when
  // none of them is worth much, and leaves all three for a coin when even then none is. lo: the worth under which
  // the offer is dealt again. deep: it also will not spend a coin that is earning interest unless the offer is worthless.
  const heldWorth = (run, id, pairs) => { let w = WORTH[id] || 1; if (pairs) { run.gear.forEach(h => { if (h !== id) w *= syn(id, h); }); w /= id === 'pact' ? 2 : id === 'idol' ? 1.5 : id === 'hourglass' ? 1.25 : 1; } return w; };
  const coinPlan = (pairs, lo, deep) => (run, picks) => {
    const c = run.coins || 0, w = picks.reduce((t, o) => Math.max(t, worthOf(run, o, pairs)), 0), cost = P.rerollCost(run);
    if (c >= P.COIN.bin && run.gear.length) { let worst = run.gear[0]; run.gear.forEach(id => { if (heldWorth(run, id, pairs) < heldWorth(run, worst, pairs)) worst = id; }); const ww = heldWorth(run, worst, pairs); if (ww < 0.7 || (ww < 0.85 && run.gear.length >= P.RUNG.slots)) return 'bin:' + worst; }
    const keeps = Math.floor((c - cost) / P.COIN.per) >= Math.min(P.COIN.cap, Math.floor(c / P.COIN.per));
    if (w < lo && cost <= c && (deep ? keeps || w < 1.05 : cost <= 2)) return 'reroll';
    if (w < lo + 0.3 && cost <= c - P.COIN.per * P.COIN.cap) return 'reroll';
    return w <= 1.1 ? 'skip' : null;
  };
  // the moves on a page: every reaction on offer and, when it is allowed, the bank
  const movesOf = (g, o) => { const ids = Object.keys(o); if (P.canBank(g)) ids.push(BANK); return ids; };
  const conts = (g, o) => Object.keys(o).filter(id => o[id].cont && g.cur.path.length > 0).length;
  // At a fork of a chain: each way on is played out to the end of the chain, and so is stopping here with the bank.
  function forkPlan(g, a, noBank) {
    let best = null, top = -Infinity;
    a.forEach(q => { const s = snap(g); P.synTake(g, q, true); runChain(g, null, null); const v = P.made(g); back(g, s); if (v > top) { top = v; best = q; } });
    if (!noBank && P.canBank(g) && P.made(g) + P.bankGain(g) > top) return BANK;
    return best;
  }
  // PLAYERS[x].move(g, o, fin, ctx, rnd): a reagent, '#bank', '#finish', or null to end the page
  //   .redraw(g, o, rnd): whether to deal the hand again now.   .fork(g, a, rnd): which way a chain goes on, or '#bank'
  const PLAYERS = {
    // takes the biggest number six times in ten and anything otherwise; picks and rounds at random. It banks and
    // redraws without a reason.
    novice: { tools: 'random', line: lineNovice, move: (g, o, fin, ctx, rnd) => { const ids = movesOf(g, o); if (fin) { o = Object.assign({ '#finish': fin }, o); ids.push('#finish'); } if (!ids.length) return null; return rnd() < 0.6 ? topGain(g, o, ids) : anyOf(ids, rnd); },
      redraw: (g, o, rnd) => rnd() < 0.12, fork: (g, a, rnd) => (rnd() < 0.6 ? null : P.canBank(g) && rnd() < 0.34 ? BANK : anyOf(a, rnd)),
      coin: (run, picks, rnd) => { const x = rnd(); return x < 0.15 && (run.coins || 0) >= P.rerollCost(run) ? 'reroll' : x < 0.23 ? 'skip' : x < 0.26 && run.gear.length && (run.coins || 0) >= P.COIN.bin ? 'bin:' + anyOf(run.gear, rnd) : null; },
      pick: (run, picks, rnd) => Math.floor(rnd() * picks.length), round: (run, briefs, rnd) => Math.floor(rnd() * briefs.length) },
    // the player the matrix was measured with: the biggest number now, equipment first, the plain round. The bank is
    // one more number to it, so it banks whenever that is the biggest.
    greedy: { pair: 'ease', tools: 'best', line: lineGreedy, move: (g, o) => { const ids = movesOf(g, o); return ids.length ? topGain(g, o, ids) : null; },
      fork: (g, a) => { let c = BANK, top = P.canBank(g) ? P.bankGain(g) : -Infinity; a.forEach(q => { const v = gainOf(g, q); if (v > top) { top = v; c = q; } }); return c; },
      coin: (run, picks) => (!picks.some(o => o.kind === 'gear' || o.kind === 'reagent') && P.rerollCost(run) === 1 && (run.coins || 0) >= 1 ? 'reroll' : null),
      pick: (run, picks) => { let bi = 0; picks.forEach((o, i) => { if (ORDER.indexOf(o.kind) < ORDER.indexOf(picks[bi].kind)) bi = i; }); return bi; }, round: () => 0 },
    // Since the cascade (2026-11-11): tries every ordered line of three from the hand, cascades included, and lines up
    // the one that makes most on this page; a row may be broken for it. Deals the hand again when its best line sets
    // off no cascade. It counts what the chain it leaves standing will do on the pages still to come, so it does not
    // wreck its own chain for a few places now. Takes the pick worth most in a build, spends water. (Before the cascade it kept the row whenever
    // it could; that player could not line up a cascade, because the reagents that set one up seldom follow on.)
    median: { pair: 'net', tools: 'read', line: lineQ(lineSearch({ depth: 3, finish: true, bank: true, stand: true })), move: planned({ depth: 3, keep: true, finish: true, bank: true }), dry: true, coin: coinPlan(false, 1.2, false), pick: bestPick(false), round: easiest, water: true, twist: true, lastOnly: true },
    // searches the page, may break the row, counts the chain, takes picks that pair, wishes, uses the extinguisher.
    // Weighs the bank against every reaction, plays each way out at a fork, redraws a hand with fewer than two live reagents.
    planner: { pair: 'net', tools: 'plan', line: lineQ(lineSearch({ depth: 3, deep: true, finish: true, bank: true, stand: true })), move: planned({ depth: 3, beam: 2, deep: true, finish: true, bank: true }), redraw: (g, o) => Object.keys(o).length < 2, dry: true, fork: forkPlan, coin: coinPlan(true, 1.3, true), pick: bestPick(true), round: easiest, water: true, h2: true, twist: true, wish: true, douse: true, lastOnly: true },
    // the planner without the bank and otherwise identical: it may still break a row by taking a reaction that does
    // not follow on. Used for the paired test of the bank
    nobank: { line: lineSearch({ depth: 3, beam: 2, deep: true, finish: true }), move: planned({ depth: 3, beam: 2, deep: true, finish: true }), redraw: (g, o) => (g.cur.path.length >= 2 && !conts(g, o)) || Object.keys(o).length < 2, fork: (g, a) => { const c = forkPlan(g, a, true); return c === BANK ? null : c; }, coin: coinPlan(true, 1.3, true), pick: bestPick(true), round: easiest, water: true, h2: true, twist: true, wish: true, douse: true, lastOnly: true },
    // the planner with no way to end a row on purpose: it keeps the row whenever it can and never banks
    keeper: { line: lineSearch({ depth: 3, beam: 2, deep: true, finish: true, keep: true }), move: planned({ depth: 3, beam: 2, deep: true, finish: true, keep: true }), redraw: (g, o) => (g.cur.path.length >= 2 && !conts(g, o)) || Object.keys(o).length < 2, fork: (g, a) => { const c = forkPlan(g, a); return c === BANK ? null : c; }, coin: coinPlan(true, 1.3, true), pick: bestPick(true), round: easiest, water: true, h2: true, twist: true, wish: true, douse: true, lastOnly: true }
  };

  // ---------- how much of a choice a turn is ----------
  // A turn is one reaction of a page. Its options are the reactions on offer and the bank. near: the second biggest
  // gain is within 30% of the biggest. later: it is not, but the second option followed by the biggest gain for two
  // more turns (and the chain, if the page ends charged) makes more than the first option followed the same way.
  // one: a row is open and at most one reaction keeps it.
  function after(g, o, id) {
    const s = snap(g); doMove(g, o, id);
    for (let k = 0; k < 2 && !g.over; k++) { const o2 = P.options(g), ids = movesOf(g, o2); if (!ids.length) break; doMove(g, o2, topGain(g, o2, ids)); }
    if (!g.over && P.fire(g)) runChain(g, null, null);
    const v = P.made(g); back(g, s); return v;
  }
  // Whether the bank is the right move where it is offered, by the planner's reckoning: the page is searched three
  // reactions deep (what the open row will multiply later and what a charged page will add are counted) once with
  // the bank as the first move and once with each reaction as the first move.
  const EVAL = { depth: 3, beam: 2, deep: true, finish: true, bank: true };
  function bankRight(g, o) {
    const d = Math.min(3, Math.max(1, P.stepsOf(g) - g.pageSteps)), ids = Object.keys(o); let vb, vn = -1;
    { const s = snap(g); P.bank(g); vb = search(g, d - 1, EVAL).val; back(g, s); }
    ids.forEach(id => { const s = snap(g); doMove(g, o, id); const v = search(g, d - 1, EVAL).val; back(g, s); if (v > vn) vn = v; });
    if (!ids.length) vn = leaf(g, EVAL);
    return vb > vn;
  }
  function weigh(g, o, d) {
    if (P.canBank(g) && g.m.atoms.length <= BIG.near) { d.bkOff++; if (bankRight(g, o)) d.bkRight++; if (!Object.keys(o).length) d.bkOnly++; }
    const ids = movesOf(g, o); d.n++; d.opts += ids.length; if (g.cur.path.length > 0) { d.open++; if (conts(g, o) <= 1) d.one++; }
    if (ids.length < 2) { d.forced++; return; }
    const gs = ids.map(id => ({ id, v: gainId(g, o, id) })).sort((a, b) => b.v - a.v);
    if (gs[1].v >= 0.7 * gs[0].v) { d.near++; return; }
    if (after(g, o, gs[1].id) > after(g, o, gs[0].id)) d.later++;
  }

  // How deep a page is: what the best ordered play of the page adds (every order of the hand and every place for the
  // bank, the chain run at the end) against what the greedy one-at-a-time play adds. deep: the best adds over 20% more.
  function depthOf(g, d) {
    const left = P.stepsOf(g) - g.pageSteps; if (left <= 0 || g.m.atoms.length > BIG.near) return;
    const v0 = P.made(g), best = search(g, left, { bank: true, chain: true }).val - v0;
    const s = snap(g); lineGreedy(g).forEach(id => { const o = P.options(g); if (id === BANK ? P.canBank(g) : o[id]) doMove(g, o, id); }); const gr = leaf(g, { chain: true }) - v0; back(g, s);
    if (best <= 0) return; d.pg++; if (best > 1.2 * gr) d.pgDeep++; if (best > 1.05 * gr) d.pgSome++;
  }
  // how many steps of cascade a line would set off if the page were fired with it now
  function cascOf(g, line) { const s = snap(g); g.queue = []; line.forEach(id => P.queueAdd(g, id === '#finish' ? P.SYN.finish : id)); while (g.queue.length && !g.over) P.queueStep(g); const c = g.casc || 0; back(g, s); return c; }
  // ---------- one round, played as the page plays it ----------
  // The homunculus of the run (docs/JARS.md), once it has been fed and the page has fired. mode 'random': the novice
  // sets it off half the times it is ready, at a place taken at random. 'best': the greedy player, where the bare
  // structure reads most steps. 'read', 'plan': it is set off on a copy at every place and done where that adds most,
  // if it adds a step or more. Returns the steps it added, or -1 when it was not set off.
  const homStat = { ready: 0, used: 0, steps: 0 };
  function useHom(g, rnd, mode) {
    if (!g.hom || g.over || !P.homReady(g)) return -1; const spots = P.homSpots(g); if (!spots.length) return -1; homStat.ready++;
    if (mode === 'random') { if (rnd() < 0.5) return -1; const n = P.homGo(g, spots[Math.floor(rnd() * spots.length)]); homStat.used++; homStat.steps += Math.max(0, n); return n; }
    if (mode === 'randomSpot' || mode === 'always') { const n = P.homGo(g, mode === 'always' ? spots[0] : spots[Math.floor(rnd() * spots.length)]); homStat.used++; homStat.steps += Math.max(0, n); return n; }
    let best = null, top = 0, topMade = 0; const id = g.hom.id;
    spots.forEach(sp => { let v, md = 0; if (mode === 'best') { const t = P.homTry(g.m, id, sp); v = t ? P.selfRun(t, g.self) : 0; } else { const s = snap(g), m0 = P.made(g); v = P.homGo(g, sp); md = P.made(g) - m0; back(g, s); } if (v > top || (v === top && md > topMade)) { top = v; topMade = md; best = sp; } });
    if (!best || top < 1) return -1;
    const n = P.homGo(g, best); homStat.used++; homStat.steps += Math.max(0, n); return n;
  }
  function playRound(g, run, pol, rnd, log) {
    const homAt = [];
    const ctx = {}, pages = [], cap = Math.max(BIG.cut, 3 * g.m.atoms.length), dec = log && log.dec ? { n: 0, opts: 0, open: 0, one: 0, forced: 0, near: 0, later: 0, bkOff: 0, bkRight: 0, bkOnly: 0, fkOff: 0, fkRight: 0, pg: 0, pgDeep: 0, pgSome: 0 } : null; const cascs = []; let chainMax = 0, steps = 0, cut = 0, atoms = g.m.atoms.length, forks = 0, idle = 0;
    const big = () => { atoms = Math.max(atoms, g.m.atoms.length); if (g.m.atoms.length > cap) cut = 1; return cut; };
    // a player that tries a piece on the page before using it plays the same page more than once: its line for a
    // page as it stands is worked out once and kept
    const memo = pol.tools === 'read' || pol.tools === 'plan' ? new Map() : null, lineOf = (g2, fin) => { if (!memo) return pol.line(g2, fin, rnd); const key = g2.page + '|' + JSON.stringify(g2.tools || {}) + '|' + g2.kinds.join(',') + '|' + JSON.stringify(g2.left) + '|' + g2.pageSteps + '|' + (g2.casc || 0) + '|' + g2.m.atoms.length; if (!memo.has(key)) memo.set(key, pol.line(g2, fin, rnd)); return memo.get(key).slice(); };
    for (;;) {
      ctx.plan = null;
      if (pol.tools && P.RULE.five && !g.over) useTools(g, rnd, pol.tools, null, P.RULE.queue && pol.line && memo ? g2 => { const fin = g2.page >= P.pagesOf(g2) ? P.finishOpt(g2) : null; lineOf(g2, fin).forEach(id => P.queueAdd(g2, id === '#finish' ? P.SYN.finish : id)); while (g2.queue.length && !g2.over) P.queueStep(g2); g2.queue = []; } : null);
      // the intern does one reaction of its own on every page after the first
      if (g.page > 1 && g.gear.includes('intern')) { const o = P.options(g, true), ids = Object.keys(o).filter(id => o[id].r.hits > 0); if (ids.length) { P.synTake(g, o[anyOf(ids, rnd)], true); steps++; } }
      let twisted = false;
      // the page is lined up and then fired: twist and redraw come first, then the whole line is placed, then it runs
      if (P.RULE.queue && pol.line) {
        if (pol.twist && !P.RULE.cascade && g.self.length && g.cur.path.length > 0 && g.m.atoms.length <= BIG.twist) { const t = P.selfOptions(g)[0]; if (t && gainOf(g, t) > 0) { P.synTake(g, t, true); steps++; } }
        const last = g.page >= P.pagesOf(g); let fin = null;
        for (let k = 0; k < 3 && !g.over; k++) { const o = P.options(g); fin = last ? P.finishOpt(g) : null; if (P.canRedraw(g) && ((!Object.keys(o).length && !fin && !P.canBank(g)) || (pol.redraw && pol.redraw(g, o, rnd)))) P.redraw(g, rnd); else break; }
        if (dec && log.deep && !g.over) depthOf(g, dec);
        let line = g.over ? [] : lineOf(g, fin);
        // a player that reads the page deals the hand again when the best it found sets off no cascade at all
        if (pol.dry && P.RULE.cascade && !g.over && P.canRedraw(g) && !cascOf(g, line)) { P.redraw(g, rnd); fin = last ? P.finishOpt(g) : null; line = pol.line(g, fin, rnd); }
        line.forEach(id => P.queueAdd(g, id === '#finish' ? P.SYN.finish : id));
        idle += Math.max(0, P.stepsOf(g) - g.pageSteps - g.queue.length);
        while (g.queue.length && !g.over) { if (dec) { const o = P.options(g); if (Object.keys(o).length || P.canBank(g)) weigh(g, o, dec); } if (g.queue[0] === P.SYN.finish && pol.wish && run.assayNow) P.wish(g, run); P.queueStep(g); steps++; if (big()) break; }
        g.queue = []; g.shot = true; cascs.push(g.casc || 0);
        if (g.hom && !g.over) { const hn = useHom(g, rnd, pol.tools === 'plan' ? 'read' : pol.tools || 'random'); if (hn >= 0) { cascs[cascs.length - 1] = g.casc || 0; homAt.push(g.page); } }
      }
      else for (;;) {
        if (g.over) break;
        // the twist is looked for once a page, as soon as a row is open, and not at all on a very large molecule, where
        // finding it takes seconds
        if (pol.twist && !twisted && g.self.length && g.cur.path.length > 0 && g.m.atoms.length <= BIG.twist) { twisted = true; const t = P.selfOptions(g)[0]; if (t && gainOf(g, t) > 0) { P.synTake(g, t, true); steps++; ctx.plan = null; continue; } }
        const o = P.options(g), fin = g.page >= P.pagesOf(g) && g.pageSteps < P.stepsOf(g) && (!pol.lastOnly || g.pageSteps === P.stepsOf(g) - 1) ? P.finishOpt(g) : null;
        // the hand is dealt again when the player wants it, and always when nothing in it acts: on the page that is
        // then the only thing left to click
        if (P.canRedraw(g) && g.pageSteps < P.stepsOf(g) && ((!Object.keys(o).length && !fin && !P.canBank(g)) || (pol.redraw && pol.redraw(g, o, rnd)))) { P.redraw(g, rnd); ctx.plan = null; continue; }
        if (dec && g.pageSteps < P.stepsOf(g) && (Object.keys(o).length || P.canBank(g))) weigh(g, o, dec);
        const id = pol.move(g, o, fin, ctx, rnd);
        if (!id) { idle += Math.max(0, P.stepsOf(g) - g.pageSteps); break; }
        if (id === '#finish') { if (pol.wish && run.assayNow) P.wish(g, run); P.synFinish(g, fin); steps++; break; }
        if (id === BANK) { P.bank(g); ctx.plan = ctx.plan && ctx.plan.length ? ctx.plan : null; continue; }
        P.synTake(g, o[id]); steps++; if (big()) break;
      }
      if (cut && !g.over) { P.synEnd(g); pages.push(g.total); break; }
      if (g.over) { pages.push(g.total); break; }
      if (P.fire(g)) { const n = runChain(g, (g2, a, r2) => { forks++; if (dec && P.canBank(g2)) { dec.fkOff++; if (forkPlan(g2, a) === BANK) dec.fkRight++; } return pol.fork ? pol.fork(g2, a, r2) : null; }, rnd, () => { steps++; if (big()) return true; if (pol.douse && g.gear.includes('extinguisher') && !g.doused && g.chain) { const o2 = P.options(g, true); if (!Object.keys(o2).some(k => o2[k].cont)) P.douse(g); } return false; }); chainMax = Math.max(chainMax, n); }
      if (cut && !g.over) P.synEnd(g);
      if (g.over) { pages.push(g.total); break; }
      if (g.page >= P.pagesOf(g)) { if (pol.wish && run.assayNow) P.wish(g, run); P.synEnd(g); pages.push(g.total); break; }
      pages.push(P.made(g));
      P.turn(g, rnd);
    }
    if (log) { log.pages = pages; log.chain = chainMax; log.row = g.best; log.steps = steps; log.atoms = atoms; log.cut = cut; log.heavy = P.heavy(g.m); log.banks = g.tally.banks || 0; log.bankAt = g.trail.filter(t => t.bank).map(t => (t.fork ? 'fork' : t.last ? (t.page >= P.pagesOf(g) ? 'end' : 'last') : 'mid') + ':' + t.len).join(' '); log.redraws = g.tally.redraws || 0; log.forks = forks; log.idle = idle; log.wasted = g.tally.wasted || 0; log.casc = cascs.join(' '); log.tools = Object.keys(g.tools || {}).filter(k => g.tools[k]).join(' '); log.water = g.by.water || 0; log.h2 = g.by.h2 || 0; log.co2 = g.by.co2 || 0; log.hom = homAt.join(' '); log.left = Object.keys(g.left).reduce((t, k) => t + (g.left[k] > 0 && g.left[k] < 9 ? g.left[k] : 0), 0); if (dec) log.dec = dec; }
    return g.total;
  }

  // ---------- a whole run ----------
  // opts: tier (suppliers opened, default all six), all (go on after a miss), rounds (default 9), noGear, term, rack0, self0, rule
  // noCarry: the round that carries the last molecule on is not offered.  relaxed: settle molecules as the page does
  function runSim(player, seed, opts) {
    opts = opts || {}; const pol = PLAYERS[player]; if (!pol) throw new Error('no player ' + player);
    const rule0 = Object.assign({}, P.RULE); if (opts.rule) Object.assign(P.RULE, opts.rule);
    P.seed(seed); P.MODEL.relaxed = !!opts.relaxed; const rnd = P.rand, out = { seed, player, rounds: [], beaten: 0, won: false };
    const run = P.runNew(opts.tier == null ? P.SUPPLY.length - 1 : opts.tier, opts.extra || []);
    if (opts.noGear) run.noGear = true;
    if (opts.hom) run.hom = opts.hom;
    // rack0, self0: reagents and kinds of cascade held from the first round, for measuring what one of them adds
    (opts.rack0 || []).forEach(id => { if (!run.rack.includes(id)) run.rack.push(id); }); (opts.self0 || []).forEach(id => { if (!run.self.includes(id)) run.self.push(id); });
    P.runTerm(run, opts.term || 'plain');
    if (!run.assay) P.runAssays(run, rnd);
    let alive = true;
    for (let r = 1; r <= (opts.rounds || 9); r++) {
      run.round = r;
      let picks = P.runPicks(run, rnd), skipped = false; const acts = [];
      if (P.RULE.coins && pol.coin && !opts.noCoin) for (let k = 0; k < 8; k++) { const a = pol.coin(run, picks, rnd); if (!a) break; if (a === 'reroll') { const n = P.runReroll(run, rnd); if (!n) break; picks = n; acts.push('reroll'); } else if (a === 'skip') { P.runSkip(run); skipped = true; acts.push('skip'); break; } else { if (!P.runBin(run, a.slice(4))) break; acts.push(a); } }
      const pi = !skipped && picks.length ? pol.pick(run, picks, rnd) : -1; if (pi >= 0) P.runTake(run, picks[pi]);
      const kept = run.last; if (opts.noCarry) run.last = null;
      let briefs = P.runBriefs(run, rnd); run.last = kept; const coins0 = run.coins || 0; let redrew = 0;
      // choosing the molecule (docs/LOOP.md): the median player and the planner take the one that reads better on the
      // screen once a coin is counted as CHOOSE.coin of a step, and draw the pair again when both read badly and a
      // coin would still be left; the greedy player takes the one that reads better; the novice takes either
      const pair = P.RULE.choose && briefs.length === 2 && briefs[0].ease != null, how = pol.pair || 'random', net = q => q.ease + (how === 'net' ? P.CHOOSE.coin * (q.coins || 0) : 0);
      if (pair && how === 'net' && opts.pickRound !== 'random') while (Math.max(briefs[0].ease, briefs[1].ease) < P.CHOOSE.bad && P.pairCost(run) != null && (run.coins || 0) > P.pairCost(run)) { const n = P.runRedraw(run, rnd); if (!n) break; briefs = n; redrew++; }
      const can = briefs.filter(q => !(q.brief === 'carry' && run.last && run.last.atoms.length > BIG.carry)), b = can.length > 1 ? can[opts.pickRound === 'random' || (pair && how === 'random') ? Math.floor(rnd() * can.length) : pair ? (net(can[1]) > net(can[0]) ? 1 : 0) : pol.round(run, can, rnd)] : can[0];
      P.runChoose(run, b); run.assayNow = !!P.assayOf(run);
      const g = P.synBegin(run.feed, false, rnd, run.gear, run);
      const row = { seed, player, round: r, mol: b.src || '', carry: b.brief === 'carry' ? 1 : 0, family: run.kin, kind: b.brief, assay: run.assayNow ? 1 : 0, gear: run.gear.map(id => id + ((run.lv[id] || 1) > 1 ? ':' + run.lv[id] : '')).join(' '), rack: run.rack.map(id => id + ((run.grade[id] || 1) > 1 ? '^' + run.grade[id] : '') + (run.uses[id] ? '+' + run.uses[id] : '')).join(' '), offered: picks.map(o => o.kind + ':' + o.id).join(' '), took: pi >= 0 ? picks[pi].kind + ':' + picks[pi].id : '', number: run.quota, coins0, pairCoins: pair ? b.coins || 0 : -1, pairGap: pair ? +Math.abs(briefs[0].ease - briefs[1].ease).toFixed(2) : -1, redrew, heavy0: P.heavy(g.m), self: (run.self || []).join(' ') };
      if (opts.dec) row.dec = true; if (opts.deep) row.deep = true;
      if (P.quotaParts) { const k = P.quotaParts(run, run.src, run.brief); row.par = k.par; row.mult = k.mult; row.stake = k.stake; }
      const total = playRound(g, run, pol, rnd, row);
      row.total = total; row.pass = total >= run.quota ? 1 : 0; row.tier = P.marksHit(total, run.quota); row.acts = acts.join(' '); if (row.pass) { const e = P.runEarn(run, total, run.quota); row.earn = e.marks; row.interest = e.interest; } row.coins = run.coins || 0; row.live = alive ? 1 : 0;
      out.rounds.push(row);
      if (row.pass && alive) { out.beaten++; run.beaten++; }
      if (!row.pass) { alive = false; if (!opts.all) break; }
      P.runKeep(run, g); P.runPay(run);
    }
    out.won = out.beaten >= 9; P.seed(); P.MODEL.relaxed = true; Object.assign(P.RULE, rule0);
    return out;
  }
  // one round on one molecule with a given rack and equipment, for measuring a molecule by itself
  function roundSim(player, smi, seed, over) {
    P.seed(seed); P.MODEL.relaxed = false; const rnd = P.rand, run = Object.assign(P.runNew(0, []), over || {});
    run.feed = P.salt(P.modelOf(smi), rnd); run.kin = P.kinOf(smi); run.src = smi; run.brief = (over && over.brief) || 'plain';
    const g = P.synBegin(run.feed, false, rnd, run.gear, run), t = playRound(g, run, PLAYERS[player], rnd, null); P.seed(); P.MODEL.relaxed = true; return t;
  }

  // ---------- measuring in pieces a browser call can finish ----------
  const send = (n, obj) => fetch('http://127.0.0.1:8767/?i=' + n, { method: 'POST', body: new Blob([JSON.stringify(obj)], { type: 'application/json' }) }).then(r => r.ok);
  // Plays seeds from..to for each player, about ms at a call, and posts each call's rounds to the frame server as
  // file number base, base + 1 and so on. Call it again with the same arguments until it answers 'done'.
  let job = null;
  async function simChunk(tag, players, from, to, base, opts, ms) {
    const key = [tag, players.join(','), from, to, base].join('|');
    if (!job || job.key !== key) job = { key, seed: from, p: 0, file: base, n: 0, t: 0 };
    if (job.seed > to) return 'done ' + key + ' runs ' + job.n + ' files ' + (job.file - base);
    const t0 = performance.now(), rows = [];
    while (job.seed <= to && performance.now() - t0 < (ms || 22000)) {
      const rule0 = Object.assign({}, P.RULE);
      try { const r = runSim(players[job.p], job.seed, opts); r.rounds.forEach(q => rows.push(q)); } catch (e) { rows.push({ seed: job.seed, player: players[job.p], error: e.message }); P.seed(); P.MODEL.relaxed = true; Object.assign(P.RULE, rule0); }
      job.n++;
      if (++job.p >= players.length) { job.p = 0; job.seed++; }
    }
    job.t += performance.now() - t0;
    const ok = await send(job.file++, { tag, opts: opts || {}, rows });
    return (job.seed > to ? 'done ' : 'at ' + job.seed + ' ') + key + ' runs ' + job.n + ' sec/run ' + (job.t / 1000 / job.n).toFixed(3) + ' posted ' + ok;
  }
  // Every molecule by itself: n plain rounds each with the starting four and no equipment. Molecules from..to of
  // FEEDS at a call (six take about twenty seconds), posted as file number file + from.
  async function simMols(tag, player, n, file, from, to, over) {
    const out = {}; P.FEEDS.slice(from, to).forEach((f, k) => { out[f] = []; for (let i = 0; i < n; i++) out[f].push(roundSim(player, f, 1000 * (from + k + 1) + i, over)); });
    const ok = await send(file + from, { tag, player, n, mols: out }); return 'mols ' + from + '..' + to + ' posted ' + ok;
  }
  // The same work driven from inside the page, so that several tabs can measure at once: it starts, answers at once,
  // and goes on in pieces of five seconds, each ended by its post. simStat() says how far it has got.
  let stat = 'idle';
  function simGo(tag, players, from, to, base, opts) { stat = 'started'; (async () => { for (;;) { stat = await simChunk(tag, players, from, to, base, opts, 5000); if (stat.indexOf('done') === 0) break; } })().catch(e => { stat = 'error ' + e.message; }); return stat; }
  // The standard measure, 500 seeds for each player, cut into eight parts of about equal work so that eight tabs can
  // share it. Part k posts to files base + 1000 k onward.
  const PARTS = [[['novice', 'greedy'], 1, 500], [['median'], 1, 250], [['median'], 251, 500], [['planner'], 1, 100], [['planner'], 101, 200], [['planner'], 201, 300], [['planner'], 301, 400], [['planner'], 401, 500]];
  // Does ending a row on purpose ever pay? Builds are taken from the planner's own runs on seeds from..to: each round
  // of each run gives a molecule, a kind of round, a rack and equipment. Every build is then played n times by player
  // a and n times by player b on the same seeds, and their medians are posted. The planner may break a row and bank;
  // the keeper is the same player with neither.
  const parseBuild = q => { const o = { gear: [], lv: {}, rack: [], grade: {}, uses: {}, brief: q.kind, tier: q.tier == null ? P.SUPPLY.length - 1 : q.tier, rare: q.tier == null || q.tier >= 2 };
    q.gear.split(' ').filter(Boolean).forEach(t => { const m = t.split(':'); o.gear.push(m[0]); if (m[1]) o.lv[m[0]] = +m[1]; });
    q.rack.split(' ').filter(Boolean).forEach(t => { const m = /^([a-z0-9]+)(?:\^(\d+))?(?:\+(\d+))?$/.exec(t); if (!m) return; o.rack.push(m[1]); if (m[2]) o.grade[m[1]] = +m[2]; if (m[3]) o.uses[m[1]] = +m[3]; }); return o; };
  function simBreak(tag, file, from, to, n, a, b, wide) {
    a = a || 'planner'; b = b || 'keeper'; stat = 'builds';
    (async () => {
      // wide: builds come from the runs of all four players, and from first runs (one supplier, no equipment)
      const builds = [], src = wide ? [['novice', {}], ['greedy', {}], ['median', {}], ['planner', {}], ['median', { tier: 0, noGear: true }]] : [[a, {}]];
      for (let sd = from; sd <= to; sd++) src.forEach(w => runSim(w[0], sd, Object.assign({ all: true }, w[1])).rounds.forEach(q => { if (q.kind !== 'carry' && q.mol) { q.from = w[0] + (w[1].noGear ? ' first run' : ''); q.tier = w[1].tier; builds.push(q); } }));
      const out = [], medOf = v => v.slice().sort((x, y) => x - y)[Math.floor(v.length / 2)]; let t0 = performance.now();
      for (let i = 0; i < builds.length; i++) {
        const q = builds[i], A = [], B = [];
        for (let k = 0; k < n; k++) { const sd = 50000 + i * 31 + k; A.push(roundSim(a, q.mol, sd, parseBuild(q))); B.push(roundSim(b, q.mol, sd, parseBuild(q))); }
        out.push({ round: q.round, from: q.from || a, mol: q.mol, kind: q.kind, gear: q.gear, rack: q.rack, a: medOf(A), b: medOf(B), wins: A.filter((v, k) => v > B[k]).length, ties: A.filter((v, k) => v === B[k]).length });
        if (performance.now() - t0 > 4000) { stat = 'at ' + i + ' of ' + builds.length; await new Promise(r => fetch('http://127.0.0.1:8767/?i=' + (file + 1), { method: 'POST', body: 'x' }).then(r, r)); t0 = performance.now(); }
      }
      const ok = await send(file, { tag, a, b, n, builds: out }); stat = 'done break ' + out.length + ' posted ' + ok;
    })().catch(e => { stat = 'error ' + e.message; });
    return stat;
  }
  window.simBreak = simBreak;
  const simPart = (tag, k, base, opts) => simGo(tag, PARTS[k][0], PARTS[k][1], PARTS[k][2], base + 1000 * k, opts);
  window.simPart = simPart;
  window.runSim = runSim; window.roundSim = roundSim; window.simChunk = simChunk; window.simMols = simMols; window.simGo = simGo; window.simStat = () => stat;
  window.SIM = { useHom, homStat, useTools, toolStat, readTools, lineRead, PLAYERS, WORTH, PAIRS, REAGENT, EASE, search, snap, back, playRound, weigh, after, runChain };
})();
