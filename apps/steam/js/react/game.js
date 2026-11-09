// The reaction game screen: a run of orders, a rack of reagent bottles, equipment, and the fume hood.
(function (root) {
'use strict';
const AA = root.AA, T = root.THREE, RX = AA.rx, RUN = AA.rxRun, S = AA.spectra, sfx = AA.sfx;
const { h, css, hex, bright, drawCardArt, ghs } = AA.rxArt;
const YELLOW = [255, 205, 0], WHITE = [255, 255, 255], GREEN = [60, 220, 120], RED = [226, 48, 40], HOT = [255, 112, 92];
const fmt = n => Math.round(n).toLocaleString();
const fmtB = n => (n < 100 ? String(Math.round(n * 10) / 10) : fmt(n));
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const KIND = { y: 'Adds yield', b: 'Adds batch', x: 'Multiplies batch', grow: 'Grows during the run', tool: 'Changes a rule' };
const kindOf = g => (g.id === 'syringe' ? 'Repeats a site' : KIND[g.kind]);
const bump = el => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };

function start(app) {
  let run = null, cur = null, model = null, v = null;
  const st = { tok: 0, busy: false, mode: 'start', shown: 0, target: 0, tags: {}, picksLeft: 0, hover: -1, hoverAtoms: [], hoverHex: 0, flashes: [], fliers: [], party: 0, t0: 0, drawn: -1, desc: null, sig: '', probe: null, slowUntil: 0, slowBy: 1, seen: new Set(), best: { orders: 0, total: 0 },
    meta: { got: [], rack: 'standard', level: 0 }, fresh: [] };
  try { const b = JSON.parse(localStorage.getItem('aa_rx_best') || 'null'); if (b) st.best = { orders: b.orders | 0, total: b.total | 0 }; } catch (e) { /* storage unavailable */ }
  try { const m = JSON.parse(localStorage.getItem('aa_rx_meta') || 'null'); if (m && Array.isArray(m.got)) st.meta = { got: m.got.filter(x => typeof x === 'string'), rack: String(m.rack || 'standard'), level: m.level | 0 }; } catch (e) { /* storage unavailable */ }
  const saveMeta = () => { try { localStorage.setItem('aa_rx_meta', JSON.stringify(st.meta)); } catch (e) { /* storage unavailable */ } };
  const got = id => st.meta.got.includes(id);
  // time runs slowly for a moment after a big hit
  const slow = (by, ms) => { const u = performance.now() + ms; if (u >= st.slowUntil) { st.slowBy = by; st.slowUntil = u; } };
  // the camera closes in on the atom that last reacted, or on the whole molecule
  const zoomTo = ms => { st.zoomUntil = performance.now() + ms; };
  const setProbe = () => { st.desc = RX.describe(model); st.probe = RX.probe(model); st.sig = st.probe.sig; st.t0 = performance.now(); };

  // ---------- DOM ----------
  const runEl = h('span', { class: 'tbRun' }), cashEl = h('span', { class: 'tbCash' }), bestEl = h('span', { class: 'tbBest' });
  const bar = document.getElementById('runinfo'); if (bar) bar.append(cashEl, runEl, bestEl);
  const benchCv = h('canvas', { class: 'hoodCv' }), bloomCv = h('canvas', { class: 'hoodBloom' }), fxCv = h('canvas', { class: 'hoodFx' });
  const nowEl = h('div', { class: 'hoodNow' }), stepEl = h('div', { class: 'hoodStep' }), chainEl = h('div', { class: 'hoodChain' });
  const hood = h('div', { class: 'hood' }, benchCv, bloomCv, fxCv, nowEl, stepEl, chainEl);
  const fx = AA.rxFx.make(fxCv, hood);
  const gearEl = h('div', { class: 'gear' });
  const bloomCx = bloomCv.getContext('2d');

  const tkHead = h('div', { class: 'tkHead' }), tkCond = h('div', { class: 'tkCond' });
  const scoreEl = h('div', { class: 'tkScore' }, '0'), quotaEl = h('div', { class: 'tkQuota' }), barFill = h('div', { class: 'tkFill' });
  const specEl = h('div', { class: 'tkSpec' }), keepEl = h('div', { class: 'tkKeep' });
  const yEl = h('b', null, '0'), bEl = h('b', null, '1');
  const yBox = h('div', { class: 'tkY' }, h('span', null, 'Yield'), yEl), bBox = h('div', { class: 'tkB' }, h('span', null, 'Batch'), bEl);
  const ticket = h('div', { class: 'ticket' }, tkHead,
    h('div', { class: 'tkRow' }, scoreEl, quotaEl), h('div', { class: 'tkBar' }, barFill),
    h('div', { class: 'tkCalc' }, yBox, h('i', null, 'times'), bBox), specEl, keepEl, tkCond);
  const CHK = [['ms', 'Mass'], ['ir', 'Infrared'], ['nmr', 'NMR']];
  const checksFor = spec => { const p = st.probe, ms = !!spec && !!p && p.mass === spec.mass, ir = !!spec && !!p && p.grp === spec.grp, nmr = !!spec && !!p && p.sig === spec.sig; return { ms, ir, nmr, n: (ms ? 1 : 0) + (ir ? 1 : 0) + (nmr ? 1 : 0) }; };
  // the spec compound and its three checks, on the ticket and on the printout headers
  function renderSpec(spec, mult) {
    const c = checksFor(spec);
    specEl.replaceChildren(...(spec ? [h('div', { class: 'tkSpecName' }, 'Spec: ', h('b', null, spec.name)),
      h('div', { class: 'tkLamps' }, CHK.map(([k, l]) => h('span', { class: 'lamp' + (c[k] ? ' on' : '') }, l)), h('span', { class: 'tkMult' + (c.n ? ' on' : '') }, 'batch times ' + mult(c.n)))] : []));
    prints.forEach(p => { p.pct.textContent = spec ? (c[p.k] ? 'matches spec' : 'off spec') : ''; p.pct.className = 'prPct' + (c[p.k] ? ' full' : ''); });
    return c;
  }
  // the two numbers the score is made of; a box jumps when its number changes
  function setCalc(y, b) {
    const ys = fmt(y), bs = fmtB(b);
    if (yEl.textContent !== ys) { yEl.textContent = ys; bump(yBox); }
    if (bEl.textContent !== bs) { bEl.textContent = bs; bump(bBox); }
    st.target = Math.round(y * b);
  }
  // the line on the ticket about the group that must be kept
  function setKeep(keep, lost, capped) {
    keepEl.style.display = keep ? '' : 'none'; keepEl.className = 'tkKeep' + (lost ? ' lost' : '');
    keepEl.replaceChildren(...(!keep ? [] : lost ? ['Kept group lost. Batch is halved at delivery.'] : capped ? [h('i', { class: 'cap' }), 'Marked ' + keep.kind + ' is capped. No bottle reacts there.'] : [h('i'), 'Keep the marked ' + keep.kind + '. Reacting it halves the batch.']));
  }
  const KINDS = [['ms', 'Mass spectrum'], ['ir', 'Infrared'], ['nmr', 'Proton NMR']];
  const prints = KINDS.map(([k, label]) => { const cv = h('canvas'), pct = h('span', { class: 'prPct' }); return { k, cv, pct, el: h('div', { class: 'print' }, h('header', null, h('span', null, label), pct), cv) }; });

  const cardsEl = h('div', { class: 'cards' });
  const swapBtn = h('button', { class: 'btn', onclick: () => swap() }), deliverBtn = h('button', { class: 'btn go', onclick: () => deliver() }, 'Deliver  [Enter]'), capBtn = h('button', { class: 'btn', onclick: () => capKeep() });
  const rackEl = h('div', { class: 'rackInfo' }), routesBtn = h('button', { class: 'btn', onclick: () => showRoutes() }, 'Routes  [R]');
  const shelf = h('div', { class: 'shelf' }, cardsEl, h('div', { class: 'side' }, deliverBtn, capBtn, swapBtn, routesBtn, rackEl));
  const overlay = h('div', { class: 'ov' });
  app.append(h('div', { class: 'game' },
    h('div', { class: 'main' },
      h('div', { class: 'left' }, hood, h('div', { class: 'under' }, gearEl)),
      h('div', { class: 'right' }, ticket, prints.map(p => p.el))),
    shelf), overlay);

  // one reagent bottle label
  function bottle(card, key) {
    const art = h('canvas', { class: 'bArt' }), foot = h('div', { class: 'bFoot' }), grade = RUN.gradeOf(run, card.id);
    const pips = []; for (let k = 0; k < Math.min(5, grade); k++) pips.push(h('i'));
    const el = h('button', { class: 'bottle g' + Math.min(3, grade), style: '--cc:' + css(card.rgb) },
      h('div', { class: 'bBand' }, key ? h('span', { class: 'bKey' }, key) : null, h('span', { class: 'bVerb' }, card.verb), h('span', { class: 'bPips', title: 'Grade ' + grade + ': ' + RUN.YIELD * grade + ' yield for each site' }, pips)),
      h('div', { class: 'bFormula' }, card.formula),
      art, h('div', { class: 'bRule' }, card.rule),
      h('div', { class: 'bBottom' }, h('div', { class: 'bGhs' }, card.ghs.map(g => ghs(g))), foot));
    return { el, art, foot };
  }

  // ---------- rendering ----------
  const sitesOf = id => (st.mode === 'play' && model ? RX.CARDS[id].find(model).length : 0);
  function renderHand() {
    let any = false;
    const els = cur.hand.map((hc, i) => {
      const card = RX.CARDS[hc.id], lk = st.mode === 'play' && model ? RUN.look(run, model, hc.id) : { n: 0 }, n = lk.n, b = bottle(card, String(i + 1));
      const live = n || lk.spoils;
      if (live) any = true;
      b.el.className += (live ? '' : ' none') + (lk.cont ? ' link' : '') + (st.seen.has(hc.uid) ? '' : ' deal');
      b.el.disabled = !live || st.busy;
      if (lk.cont) b.foot.append(h('span', { class: 'bLink' }, lk.route ? lk.route.name : 'Chain of ' + lk.len));
      if (lk.spoils) b.foot.append(h('span', { class: 'bWarn' }, 'Reacts at the kept group'));
      b.foot.append(h('span', null, n ? h('b', null, plural(n, 'site')) : lk.spoils ? '' : 'no site'));
      b.el.addEventListener('click', () => play(i));
      ['mouseenter', 'focus'].forEach(ev => b.el.addEventListener(ev, () => setHover(i)));
      ['mouseleave', 'blur'].forEach(ev => b.el.addEventListener(ev, () => setHover(-1)));
      b.dim = !live; b.card = card; st.seen.add(hc.uid);
      return b;
    });
    cardsEl.style.setProperty('--n', Math.max(5, cur.hand.length));
    cardsEl.replaceChildren(...els.map(b => b.el));
    els.forEach(b => drawCardArt(b.art, b.card, b.dim));
    return any;
  }
  function renderTicket() {
    const proj = cur.done ? cur.final : RUN.projected(run, st.probe), met = proj >= cur.quota, dbl = proj >= cur.quota * 2;
    tkHead.textContent = 'Order ' + (cur.n + 1) + ' of ' + RUN.ORDERS + (cur.large ? ', large' : '');
    quotaEl.replaceChildren('of ', h('b', null, fmt(cur.quota)), ' needed');
    // the bar runs to twice the quota; the mark in the middle is the quota itself
    barFill.style.width = Math.min(100, proj / (cur.quota * 2) * 100).toFixed(1) + '%';
    ticket.className = 'ticket' + (met ? ' met' : '') + (dbl ? ' dbl' : '');
    renderSpec(cur.spec, k => fmtB(RUN.checkMult(run, k)));
    tkCond.textContent = cur.cond ? 'Condition: ' + cur.cond.text + '.' : '';
    tkCond.style.display = cur.cond ? '' : 'none';
    setKeep(cur.keep, cur.spoiled, model.atoms.some(a => a.prot));
    capBtn.style.display = cur.keep ? '' : 'none';
    capBtn.textContent = cur.keep ? 'Cap the marked ' + cur.keep.kind + '  [C]  (1 step)' : '';
    capBtn.disabled = st.busy || st.mode !== 'play' || !RUN.canCap(run, model);
    const left = cur.stepsMax - cur.step;
    stepEl.replaceChildren(h('b', null, String(left)), (left === 1 ? 'step' : 'steps') + ' left');
    nowEl.textContent = RX.label(model);
    chainEl.textContent = cur.path.length >= 2 ? 'Chain of ' + cur.path.length : '';
    chainEl.style.display = cur.path.length >= 2 ? '' : 'none';
    routesBtn.disabled = st.mode !== 'play';
    swapBtn.textContent = 'Swap hand  [S]  (' + cur.redraws + ' left)';
    swapBtn.disabled = st.busy || st.mode !== 'play' || cur.redraws <= 0;
    deliverBtn.disabled = st.busy || st.mode !== 'play';
    deliverBtn.className = 'btn go' + (met ? ' ready' : '');
    rackEl.textContent = cur.draw.length + ' of ' + plural(run.deck.length, 'bottle') + ' left to draw';
    renderTop(cur.done ? 0 : proj);
  }
  function renderTop(extra) {
    if (!run) { cashEl.textContent = runEl.textContent = ''; return; }
    cashEl.textContent = 'Surplus ' + run.money + ' kg';
    runEl.textContent = 'Run total ' + fmt(run.total + (extra || 0));
    bestEl.textContent = st.best.total ? 'Best ' + fmt(st.best.total) : '';
  }
  function refreshGear() { for (const id in st.tags) { const lv = RUN.live(run, id), t = st.tags[id]; if (t.live && t.live.textContent !== lv) { t.live.textContent = lv; bump(t.live); } } }
  function renderGear() {
    st.tags = {};
    const tags = run.gear.map((id, i) => {
      const g = RUN.GEARS[id], hit = h('em', { class: 'tagHit' });
      const lv = RUN.live(run, id), live = lv ? h('strong', { class: 'tagLive' }, lv) : null;
      const el = h('button', { class: 'tag k-' + g.kind, title: kindOf(g) + '. ' + (i ? 'Click to move it one place left. Equipment works from left to right.' : 'First on the bench. Equipment works from left to right.'), onclick: () => moveTag(i) },
        h('b', null, g.name), h('span', null, g.text), live, hit);
      st.tags[id] = { el, hit, live, i };
      return el;
    });
    for (let i = run.gear.length; i < RUN.GEAR_SLOTS; i++) tags.push(h('div', { class: 'tag empty' }));
    gearEl.replaceChildren(...tags);
  }
  // a piece of equipment has just worked: it jumps and shows what it added
  function fireTag(id, text) {
    const t = st.tags[id]; if (!t) return;
    t.hit.textContent = text; t.el.classList.remove('fire'); void t.el.offsetWidth; t.el.classList.add('fire');
  }
  function moveTag(i) {
    if (st.busy || st.mode !== 'play' || i < 1) return;
    RUN.moveGear(run, i); sfx.click(); renderGear(); renderHand();
  }
  function renderAll() { const any = renderHand(); renderTicket(); renderGear(); return any; }
  function setHover(i) {
    st.hover = i; st.hoverAtoms = [];
    if (i < 0 || st.busy || st.mode !== 'play' || !model || !cur.hand[i]) return;
    const card = RX.CARDS[cur.hand[i].id];
    st.hoverHex = hex(bright(card.rgb));
    card.find(model).forEach(s => s.atoms.forEach(a => st.hoverAtoms.push(a)));
  }

  // ---------- run flow ----------
  function loadOrder(m) {
    cur = run.cur; st.tok++; st.busy = false; st.mode = 'play'; st.shown = 0; st.opts = null; st.end = false;
    yEl.textContent = ''; bEl.textContent = ''; setCalc(cur.yield, cur.batch);
    st.flashes = []; st.fliers = []; st.party = 0; st.hover = -1; st.hoverAtoms = [];
    st.met = st.dbl = false; st.zoomUntil = 0; st.zoomAtom = null; st.crossT = 0;
    fx.clear();
    model = m || RUN.mark(AA.Model.fromSmilesRelaxed(cur.feed, 6), cur.keep);
    if (v) { v.model = model; v.glow.clear(); }
    setProbe();
    overlay.className = 'ov'; overlay.replaceChildren();
    scoreEl.textContent = '0';
    renderAll();
    fx.banner((cur.large ? 'LARGE ORDER ' : 'ORDER ') + (cur.n + 1), fmt(cur.quota) + ' needed', YELLOW, 1.6);
  }

  // ---------- the two feedstocks on offer ----------
  // looking at an offer puts its molecule in the hood and its spectra, with its bonus compound, on the printouts
  function lookAt(i) {
    const o = run.offers[i];
    st.pv = i; model = st.offerModels[i];
    if (v) { v.model = model; v.glow.clear(); }
    setProbe();
    st.offerEls.forEach((el, k) => el.classList.toggle('look', k === i));
    tkHead.textContent = 'Order ' + (run.n + 1) + ' of ' + RUN.ORDERS + ', choose a feedstock';
    quotaEl.replaceChildren('of ', h('b', null, fmt(o.quota)), ' needed');
    renderSpec(o.spec, k => fmtB(RUN.checkMult(run, k)));
    tkCond.textContent = run.cond ? 'Condition: ' + run.cond.text + '.' : ''; tkCond.style.display = run.cond ? '' : 'none';
    setKeep(o.keep, false);
    nowEl.textContent = RX.label(model);
  }
  function showOffers() {
    st.tok++; st.busy = false; st.mode = 'offer'; st.opts = null; st.end = false; st.shown = 0;
    st.flashes = []; st.fliers = []; st.party = 0; st.hover = -1; st.hoverAtoms = [];
    fx.clear(); overlay.className = 'ov'; overlay.replaceChildren();
    yEl.textContent = ''; bEl.textContent = ''; setCalc(0, 1); scoreEl.textContent = '0'; barFill.style.width = '0%'; ticket.className = 'ticket';
    st.offerModels = run.offers.map(o => RUN.mark(AA.Model.fromSmilesRelaxed(o.feed, 6), o.keep));
    st.offerEls = run.offers.map((o, i) => {
      const cov = RUN.coverage(run, o.feed);
      const el = h('button', { class: 'offer' + (o.large ? ' large' : ''), onclick: () => pickFeed(i) },
        h('div', { class: 'ofBand' }, h('span', { class: 'bKey' }, String(i + 1)), h('span', null, o.large ? 'Large order' : 'Standard order'), h('span', { class: 'ofPay' }, o.pay + ' kg surplus' + (o.large ? ' and 2 picks' : ' and 1 pick'))),
        h('div', { class: 'ofBody' },
          h('div', { class: 'ofName' }, o.feedName),
          h('div', { class: 'ofNums' }, h('div', null, h('b', null, fmt(o.quota)), h('span', null, 'needed')), h('div', null, h('b', null, String(o.groups)), h('span', null, 'reactive groups'))),
          o.keep ? h('div', { class: 'ofKeep' }, h('i'), 'Keep the marked ' + o.keep.kind) : null,
          h('div', { class: 'ofCov' }, cov.length ? cov.map(c => { const card = RX.CARDS[c.id]; return h('span', { style: '--cc:' + css(card.rgb) }, card.verb + ' ' + c.n); }) : 'No bottle in the rack reacts with it as it stands')));
      ['mouseenter', 'focus'].forEach(ev => el.addEventListener(ev, () => { if (st.mode === 'offer' && st.pv !== i) lookAt(i); }));
      return el;
    });
    cardsEl.style.setProperty('--n', 2);
    cardsEl.replaceChildren(...st.offerEls);
    renderGear();
    stepEl.replaceChildren();
    capBtn.style.display = 'none';
    swapBtn.textContent = 'Swap hand  [S]'; swapBtn.disabled = deliverBtn.disabled = true; deliverBtn.className = 'btn go';
    rackEl.textContent = plural(run.deck.length, 'bottle') + ' in the rack';
    renderTop(0);
    lookAt(0);
    fx.banner('ORDER ' + (run.n + 1) + ' OF ' + RUN.ORDERS, 'Choose a feedstock', YELLOW, 1.6);
  }
  function pickFeed(i) {
    if (st.mode !== 'offer' || !run.offers || !run.offers[i]) return;
    const m = st.offerModels[i];
    sfx.stamp(); RUN.chooseFeed(run, i); st.offerModels = null; loadOrder(m);
  }
  function newRun(seed) {
    const m = st.meta, rack = m.rack !== 'standard' && !got(m.rack) ? 'standard' : m.rack, level = Math.min(m.level, got('level3') ? 2 : got('level2') ? 1 : 0);
    const locked = RUN.UNLOCKS.filter(u => u.kind === 'gear' && !got(u.id)).map(u => u.id);
    run = RUN.newRun(seed, { rack, level, locked }); st.seen.clear(); st.fresh = []; RUN.beginOrder(run); showOffers();
  }
  // records anything this run has just earned for later runs
  function checkUnlocks() {
    const ids = RUN.achieved(run).filter(id => !got(id));
    if (!ids.length) return;
    ids.forEach(id => { st.meta.got.push(id); st.fresh.push(id); });
    saveMeta();
  }
  // the panel before a run: which rack, which level, and what is still locked
  function showStart() {
    st.tok++; st.mode = 'start'; st.busy = false; st.opts = null; st.end = false;
    const m = st.meta, maxLv = got('level3') ? 2 : got('level2') ? 1 : 0;
    if (m.rack !== 'standard' && !got(m.rack)) m.rack = 'standard';
    m.level = Math.max(0, Math.min(maxLv, m.level));
    const racks = Object.keys(RUN.RACKS).map(id => { const open = id === 'standard' || got(id); return h('button', { class: 'opt' + (m.rack === id ? ' on' : ''), disabled: open ? null : '', onclick: () => { m.rack = id; saveMeta(); sfx.click(); showStart(); } }, h('b', null, RUN.RACKS[id].name), h('span', null, open ? plural(RUN.RACKS[id].deck.length, 'bottle') : 'Locked')); });
    const levels = RUN.LEVELS.map((x, i) => h('button', { class: 'opt' + (m.level === i ? ' on' : ''), disabled: i <= maxLv ? null : '', onclick: () => { m.level = i; saveMeta(); sfx.click(); showStart(); } }, h('b', null, 'Level ' + (i + 1)), h('span', null, i > maxLv ? 'Locked' : i ? 'Quotas times ' + x : 'Standard quotas')));
    const list = RUN.UNLOCKS.map(u => h('li', { class: got(u.id) ? 'got' : '' }, h('b', null, u.name), h('span', null, got(u.id) ? 'Unlocked' : u.how)));
    overlay.replaceChildren(h('div', { class: 'panel start' }, h('h2', null, 'New run'),
      h('p', null, 'React at the atoms the last bottle changed to build a chain. Each link multiplies batch, and a chain that follows a named route multiplies it again.'),
      h('p', null, 'From order ' + (RUN.KEEP_FROM + 1) + ', each feedstock has one marked group to keep. A bottle reacts at every site it matches, and reacting at the marked group halves the batch. Capping the marked group costs one step and stops every bottle reacting there.'),
      h('h3', null, 'Rack'), h('div', { class: 'opts' }, racks), h('h3', null, 'Level'), h('div', { class: 'opts' }, levels),
      h('h3', null, 'Unlocks, ' + st.meta.got.length + ' of ' + RUN.UNLOCKS.length), h('ul', { class: 'unl' }, list),
      h('button', { class: 'btn go', onclick: () => newRun() }, 'Start  [Enter]')));
    overlay.className = 'ov on';
  }

  const scr = atoms => { let x = 0, y = 0; atoms.forEach(a => { const p = v._screen(a); x += p.x; y += p.y; }); return { x: x / atoms.length, y: y / atoms.length }; };
  function centroid() { let x = 0, y = 0, z = 0, n = 0; model.atoms.forEach(a => { if (a.fly) return; x += a.x; y += a.y; z += a.z; n++; }); return n ? [x / n, y / n, z / n] : [0, 0, 0]; }

  // how hard the screen reacts grows with the size of the score: 1 at a hundred, 5 at a million
  const heat = () => Math.max(0, Math.min(7, Math.log10(Math.max(10, st.target)) - 1));
  // runs a list of { wait, fn } one after another; a step may return more steps to run straight after it
  function seq(steps, tok) {
    const next = () => {
      if (tok !== st.tok || !steps.length) return;
      const s = steps.shift();
      setTimeout(() => { if (tok !== st.tok) return; const more = s.fn(); if (more && more.length) steps.unshift(...more); next(); }, s.wait);
    };
    next();
  }
  // the score has just changed: passing the quota, and passing twice the quota, are each an event of their own
  function crossed(at) {
    if (!cur || (st.mode !== 'play' && st.mode !== 'result')) return false;
    const q = cur.quota, s = st.target, x = at ? at.x : benchCv.clientWidth / 2, y = at ? at.y : benchCv.clientHeight / 2;
    if (s < q) { st.met = st.dbl = false; return false; }
    if (st.met && (st.dbl || s < q * 2)) return false;
    const twice = st.met, c = twice ? RED : GREEN;
    if (twice) st.dbl = true; else st.met = true;
    st.crossT = performance.now(); ticket.classList.add(twice ? 'dbl' : 'met'); bump(scoreEl);
    fx.banner(twice ? 'TWICE THE QUOTA' : 'QUOTA MET', fmt(q * (twice ? 2 : 1)) + ' passed', c, 1.8);
    if (twice) sfx.over(); else sfx.quota();
    fx.flash(0.7, c); fx.shake(14); fx.punch(0.12);
    fx.ring(x, y, c, 320, 0.9); fx.ring(x, y, WHITE, 200, 0.6); fx.burst(x, y, c, 90, 480); fx.burst(x, y, WHITE, 40, 300);
    slow(0.08, 750); zoomTo(1000);
    return true;
  }
  // shows one change to yield or batch; `at` is the place in the hood the number rises from
  function showEv(e, at, pitch) {
    if (e.kind === 'catch') { fireTag('coldtrap', e.val + ' caught'); return; }
    if (e.kind === 'grade') return;
    setCalc(e.yield, e.batch);
    const cr = crossed(at);
    if (e.src === 'bottle' && e.kind === 'b') return;
    const txt = (e.kind === 'x' ? 'times ' : '+') + fmtB(e.val), hot = heat();
    if (RUN.GEARS[e.src]) fireTag(e.src, txt);
    if (e.gear) fireTag(e.gear, txt);
    if (e.src === 'route') { if (!cr) fx.banner(RUN.ROUTE[e.route].name.toUpperCase(), 'Route complete, batch ' + txt, YELLOW, 1.9); sfx.good(); fx.flash(0.4, WHITE); slow(0.15, 320); }
    if (e.kind === 'x') {
      bump(scoreEl);
      // the route banner already states its multiplier, so a second floating number would only cover the chain one
      if (e.src !== 'route') fx.floatText(at.x, at.y - 30, (e.src === 'chain' ? 'chain of ' + e.len + ', batch ' : 'batch ') + txt, HOT, 30 + 3 * hot);
      fx.flash(0.16 + 0.03 * hot, RED); fx.shake(5 + 2 * hot); fx.ring(at.x, at.y, RED, 120 + 20 * hot, 0.45);
      slow(0.2, 160 + 20 * hot); fx.punch(0.03 + 0.008 * hot);
    } else if (e.src === 'bottle') fx.floatText(at.x, at.y - 28, (e.again ? 'again ' : '') + txt, YELLOW, 26 + 3 * hot);
    sfx.lock(pitch);
  }

  function play(i) {
    const hc = cur && cur.hand[i];
    if (!hc || st.busy || st.mode !== 'play' || !v) return;
    const card = RX.CARDS[hc.id], sites = card.find(model), made = [];
    if (!sites.length) { sfx.bad(); return; }
    // the play is hot when it reacts at an atom the last play made or changed, which is what continues a chain
    const wasHot = cur.path.length > 0 && sites.some(s => s.atoms.some(a => cur.fresh.has(a)));
    st.busy = true; st.hover = -1; st.hoverAtoms = [];
    const tok = st.tok, col = bright(card.rgb), t = performance.now();
    const mid = () => ({ x: benchCv.clientWidth / 2, y: benchCv.clientHeight * 0.45 });
    let hits = 0, spoiled = 0, pitch = cur.step, nEv = 0;
    const beat = (e, at) => ({ wait: Math.max(55, 120 - 6 * nEv), fn: () => { nEv++; showEv(e, at, pitch++); } });
    sfx.click();
    sites.forEach(s => s.atoms.forEach(a => st.flashes.push({ atom: a, hex: hex(col), until: t + 600 + sites.length * 420 })));
    fx.banner(card.verb.toUpperCase(), card.formula, col, 1.25);
    renderHand(); renderTicket();
    if (cardsEl.children[i]) cardsEl.children[i].classList.add('played');

    const wrapUp = res => {
      const before = checksFor(cur.spec).n;
      setProbe(); sfx.pen(500);
      const up = res.ev.find(e => e.kind === 'grade'), hot = heat();
      if (up) { fx.banner(card.verb.toUpperCase() + ' GRADE ' + up.val, RUN.YIELD * up.val + ' yield for each site', col, 2.0); sfx.good(); fx.flash(0.4, WHITE); slow(0.15, 320); fx.punch(0.08); }
      else if (hits >= 2 && !res.ev.some(e => e.src === 'route') && performance.now() - st.crossT > 1600) fx.banner(hits + ' SITES', fmt(res.score), col, 1.5);
      if (spoiled) fx.banner('KEPT GROUP LOST', 'Batch is halved at delivery', RED, 2.0);
      if (hits >= 3) { fx.flash(0.45, WHITE); fx.shake(10 + 2 * hot); slow(0.2, 260); fx.punch(0.06); if (!up) sfx.good(); }
      st.busy = false;
      const any = renderHand(), now = checksFor(cur.spec).n, long = up || hits >= 2;
      renderTicket(); refreshGear();
      if (now > before) { bump(specEl); sfx.lock(8 + 2 * now); }
      if (now === 3 && before < 3) { model.atoms.forEach(a => { if (!a.fly) st.flashes.push({ atom: a, hex: hex(YELLOW), until: performance.now() + 900 }); }); sfx.good(); fx.banner('ON SPEC', 'All three checks pass', YELLOW, 1.4); }
      if (cur.step >= cur.stepsMax) setTimeout(() => { if (tok === st.tok && st.mode === 'play') finishOrder(); }, long ? 1100 : 600);
      else if (!any) setTimeout(() => { if (tok === st.tok && st.mode === 'play' && !st.busy) fx.banner('NO SITE IN THIS HAND', cur.redraws > 0 ? 'Swap the hand or deliver' : 'Deliver the order', WHITE, 2.4); }, long ? 1600 : 300);
    };

    const steps = sites.map((site, k) => ({ wait: k ? 230 : 380, fn: () => {
      if (!card.ok(model, site)) return null;
      const c0 = centroid(), spoil = site.atoms.some(a => a.keep), r = card.apply(model, site), hot = heat();
      const p = scr(r.focus), now = performance.now();
      st.zoomAtom = r.focus[0];
      if (spoil) { site.atoms.forEach(a => { a.keep = false; }); spoiled++; } else hits++;
      const ev = spoil ? [] : RUN.scoreSite(run, hc.id, false);
      r.focus.concat(r.incoming).forEach(a => made.push(a));
      if (spoil) { fx.floatText(p.x, p.y - 30, 'kept group lost', RED, 30); fx.ring(p.x, p.y, RED, 160, 0.6); fx.flash(0.3, RED); fx.shake(10); sfx.bad(); }
      fx.ring(p.x, p.y, col, 90 + 24 * hits + 14 * hot, 0.55); fx.ring(p.x, p.y, WHITE, 50, 0.3);
      fx.burst(p.x, p.y, col, 26 + 10 * hot, 240 + 50 * hot); fx.burst(p.x, p.y, YELLOW, 10 + 4 * hot, 160);
      fx.floatText(p.x + 4, p.y + 34, r.tag, col, 18);
      fx.shake(3 + 1.6 * hot + 1.5 * hits); fx.flash(0.1 + 0.04 * hot, col);
      v.burst({ x: r.focus[0].x, y: r.focus[0].y, z: r.focus[0].z }, 26 + 7 * hot, [css(col), '#ffcd00', '#ffffff']);
      v.yawVel += 0.35;
      r.focus.concat(r.incoming).forEach(a => { v.pop(a); st.flashes.push({ atom: a, hex: hex(col), until: now + 520 }); });
      r.leaving.forEach(group => {
        const g = group[0], d = [g.x - c0[0], g.y - c0[1] + 0.8, g.z - c0[2]], L = Math.hypot(d[0], d[1], d[2]) || 1;
        group.forEach(a => { a.fly = true; a.pinned = true; });
        st.fliers.push({ atoms: group, v: [d[0] / L * 5.5, d[1] / L * 5.5, d[2] / L * 5.5], t: 0, life: 0.85, rgb: col });
      });
      sfx.bond();
      // the bottle's own yield and batch land with the reaction; each piece of equipment follows on its own beat
      ev.filter(e => e.src === 'bottle').forEach(e => showEv(e, p, pitch));
      pitch++; nEv++;
      return ev.filter(e => e.src !== 'bottle').map(e => beat(e, p));
    } }));
    steps.push({ wait: 320, fn: () => {
      const res = RUN.commit(run, i, hits, { hot: wasHot, made, sig: RX.sigOf(model), spoiled });
      return res.ev.map(e => beat(e, mid())).concat([{ wait: 340, fn: () => wrapUp(res) }]);
    } });
    seq(steps, tok);
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  // the list of named routes, with the ones this rack cannot perform dimmed
  function showRoutes() {
    if (st.mode !== 'play' || st.routesOpen) return;
    st.routesOpen = true; sfx.click();
    const rows = RUN.ROUTES.map(rt => h('li', { class: RUN.routeFits(run, rt) ? '' : 'off' }, h('b', null, rt.name), h('span', null, cap(RUN.routeSteps(rt))), h('i', null, 'times ' + RUN.routeMult(run, rt.id)), h('em', null, 'Level ' + RUN.routeLevel(run, rt.id))));
    overlay.replaceChildren(h('div', { class: 'panel routes' }, h('h2', null, 'Routes'),
      h('p', null, 'Play the steps in order, each one at the atoms the step before it changed. Greyed routes need a bottle this rack does not hold.'),
      h('ul', { class: 'rts' }, rows), h('button', { class: 'btn go', onclick: () => hideRoutes() }, 'Back  [R]')));
    overlay.className = 'ov on';
  }
  function hideRoutes() { if (!st.routesOpen) return; st.routesOpen = false; overlay.className = 'ov'; }
  function swap() {
    if (st.busy || st.mode !== 'play' || !RUN.redraw(run)) return;
    sfx.feed(); renderAll();
  }
  // caps the marked group: a silyl ether on an OH, an acetal on a C=O
  function capKeep() {
    if (st.busy || st.mode !== 'play' || !v) return;
    const a = RUN.cap(run, model);
    if (!a) { sfx.bad(); return; }
    const p = scr([a]), oh = cur.keep.kind === 'OH', tok = st.tok;
    fx.banner(oh ? 'SILYLATE' : 'ACETALISE', oh ? 'TBSCl with imidazole' : 'Ethylene glycol with TsOH', WHITE, 1.3);
    fx.ring(p.x, p.y, WHITE, 120, 0.5); fx.floatText(p.x + 4, p.y + 36, cur.keep.kind + ' capped', WHITE, 22);
    v.pop(a); st.flashes.push({ atom: a, hex: 0xffffff, until: performance.now() + 520 }); sfx.bond();
    st.zoomAtom = a; zoomTo(600);
    renderAll();
    if (cur.step >= cur.stepsMax) setTimeout(() => { if (tok === st.tok && st.mode === 'play') finishOrder(); }, 900);
  }
  function deliver() { if (!st.busy && st.mode === 'play') finishOrder(); }

  function finishOrder() {
    st.mode = 'result';
    const tok = st.tok, res = RUN.endOrder(run, st.probe), w = benchCv.clientWidth, hh = benchCv.clientHeight, cx = w / 2, cy = hh / 2;
    const filled = run.history.filter(q => q.pass).length;
    checkUnlocks();
    if (filled > st.best.orders || (filled === st.best.orders && run.total > st.best.total)) { st.best = { orders: filled, total: run.total }; res.best = true; try { localStorage.setItem('aa_rx_best', JSON.stringify(st.best)); } catch (e) { /* storage unavailable */ } }
    swapBtn.disabled = deliverBtn.disabled = capBtn.disabled = true; deliverBtn.classList.remove('ready');
    st.zoomAtom = null;
    const EVN = { checks: plural(res.checks.n, 'CHECK') + ' PASSED', seed: 'SEED CRYSTAL', glovebox: 'GLOVE BOX', kept: 'KEPT GROUP LOST' };
    renderHand(); setCalc(res.yield, res.batch);
    // the multipliers that only apply on delivery land one at a time before the result is called
    res.ev.forEach((e, k) => setTimeout(() => {
      if (tok !== st.tok) return;
      fx.banner(EVN[e.src], 'batch times ' + fmtB(e.val), e.src === 'kept' ? RED : YELLOW, 0.6);
      showEv(e, { x: cx, y: cy - 40 }, 8 + 2 * k);
      model.atoms.forEach(a => { if (!a.fly) v.pop(a); });
    }, 150 + k * 650));
    setTimeout(() => {
      if (tok !== st.tok) return;
      renderTicket(); refreshGear();
      const ratio = res.total / cur.quota, big = Math.max(0, Math.min(6, Math.floor(Math.log2(Math.max(1, ratio)))));
      if (res.pass) {
        st.party = performance.now() + 1400 + 400 * big;
        fx.flash(Math.min(0.9, 0.4 + 0.1 * big), WHITE); sfx.fanfare(); v.yawVel = 1.4 + 0.45 * big; fx.shake(9 + 3 * big);
        slow(0.15, 350); fx.punch(0.1 + 0.02 * big);
        fx.ring(cx, cy, YELLOW, 260, 0.9); fx.ring(cx, cy, GREEN, 170, 0.7); fx.burst(cx, cy, YELLOW, 110, 520); fx.burst(cx, cy, WHITE, 50, 300);
        for (let k = 0; k < big; k++) setTimeout(() => {
          if (tok !== st.tok) return;
          const x = cx + ((k % 3) - 1) * w * 0.24, y = cy - 40 + (k % 2) * 70, c = [YELLOW, GREEN, WHITE, HOT][k % 4];
          fx.ring(x, y, c, 240 + 40 * k, 0.8); fx.burst(x, y, c, 70 + 12 * k, 440 + 40 * k); fx.shake(7 + k); sfx.lock(6 + k * 2);
        }, 240 * (k + 1));
        model.atoms.forEach(a => { if (!a.fly) v.pop(a); });
        fx.banner(ratio >= 2 ? fmtB(ratio) + ' TIMES THE QUOTA' : 'ORDER FILLED', fmt(res.total) + ' of ' + fmt(cur.quota) + ' needed, ' + res.pay + ' kg of surplus kept', YELLOW, 2.3);
      } else {
        // a miss by less than a quarter of the quota is held on screen longer, close in
        const near = ratio >= 0.75;
        sfx.stamp(); fx.shake(near ? 12 : 6);
        if (near) { zoomTo(1600); slow(0.1, 1000); fx.flash(0.5, RED); sfx.bad(); }
        fx.banner('QUOTA MISSED', near ? fmt(cur.quota - res.total) + ' short of ' + fmt(cur.quota) : fmt(res.total) + ' of ' + fmt(cur.quota) + ' needed', RED, near ? 2.9 : 2.3);
      }
      setTimeout(() => { if (tok === st.tok) showPanel(res, filled); }, res.pass ? 1500 + 240 * big : ratio >= 0.75 ? 2100 : 1200);
    }, res.ev.length ? 250 + res.ev.length * 650 : 0);
  }

  function showPanel(res, filled) {
    const kids = [], product = RX.label(model), n = cur.n + 1;
    const again = h('button', { class: 'btn go', onclick: () => showStart() }, 'New run  [Enter]');
    const fresh = st.fresh.length ? h('div', { class: 'newUnl' }, h('b', null, 'Unlocked for later runs'), st.fresh.map(id => h('span', null, RUN.UNLOCKS.find(u => u.id === id).name))) : null;
    if (run.won) {
      kids.push(h('h2', null, 'Run complete'), h('div', { class: 'pBig' }, fmt(run.total)),
        h('p', null, 'All ' + RUN.ORDERS + ' orders filled.' + (res.best ? ' This is the best run on this machine.' : '')), fresh, again);
      st.opts = null; st.end = true;
    } else if (!res.pass) {
      kids.push(h('h2', null, 'Run over at order ' + n), h('div', { class: 'pBig' }, fmt(res.total) + ' of ' + fmt(cur.quota)),
        h('p', null, 'Delivered ' + product + '. ' + plural(filled, 'order') + ' filled, run total ' + fmt(run.total) + '.' + (res.best ? ' This is the best run on this machine.' : '')), fresh, again);
      st.opts = null; st.end = true;
    } else {
      st.opts = RUN.rewards(run); st.end = false; st.picksLeft = res.picks;
      const opts = st.opts.map((o, i) => {
        if (o.kind === 'gear') { const g = RUN.GEARS[o.id]; return h('button', { class: 'pick gearPick k-' + g.kind, onclick: () => choose(i) }, h('span', { class: 'bKey' }, String(i + 1)), h('div', { class: 'gpKind' }, kindOf(g)), h('div', { class: 'gpName' }, g.name), h('div', { class: 'gpText' }, g.text)); }
        const b = bottle(RX.CARDS[o.id], String(i + 1)), have = run.deck.filter(id => id === o.id).length;
        b.el.className += ' pick'; b.el.addEventListener('click', () => choose(i));
        b.foot.append(h('span', null, have ? have + ' in the rack' : 'New to the rack'));
        b.card = RX.CARDS[o.id];
        return b;
      });
      st.pickEls = opts.map(o => o.el || o);
      st.pickHead = h('h3', null, res.picks > 1 ? 'Take ' + res.picks : 'Take one');
      const pd = res.paid, why = [pd.order + ' for the order', pd.steps ? pd.steps + ' for ' + plural(pd.stepsLeft, 'unused step') : '', pd.doubles ? pd.doubles + ' for doubling the quota ' + (pd.doubled > 1 ? pd.doubled + ' times' : 'once') : '', pd.held ? pd.held + ' earned on surplus held' : ''].filter(Boolean);
      kids.push(h('h2', null, 'Order ' + n + ' filled'),
        h('p', null, fmt(res.total) + ' against ' + fmt(cur.quota) + ' needed. ' + plural(res.checks.n, 'check') + ' passed.'),
        h('p', { class: 'surplus' }, h('b', null, res.pay + ' kg of surplus kept: '), why.join(', ') + '.'), fresh,
        st.pickHead, h('div', { class: 'picks' }, st.pickEls),
        h('button', { class: 'btn', onclick: () => choose(-1) }, 'Take nothing  [0]'));
      overlay.replaceChildren(h('div', { class: 'panel' }, kids)); overlay.className = 'ov on';
      opts.forEach(o => { if (o.art) drawCardArt(o.art, o.card, false); });
      return;
    }
    overlay.replaceChildren(h('div', { class: 'panel' }, kids)); overlay.className = 'ov on';
  }
  function choose(i) {
    if (st.mode !== 'result' || !st.opts || run.over) return;
    if (i >= 0) {
      if (!st.opts[i]) return;
      RUN.take(run, st.opts[i]); sfx.stamp(); st.opts[i] = null; st.picksLeft--;
      if (st.pickEls && st.pickEls[i]) st.pickEls[i].classList.add('taken');
      if (st.picksLeft > 0 && st.opts.some(o => o)) { st.pickHead.textContent = st.picksLeft > 1 ? 'Take ' + st.picksLeft + ' more' : 'Take one more'; return; }
    } else sfx.click();
    st.opts = null; st.fresh = []; RUN.stock(run); showShop();
  }

  // ---------- the supply room between orders ----------
  function showShop() {
    st.mode = 'shop';
    const sh = run.shop, arts = [];
    const items = sh.items.map((it, i) => {
      const ok = RUN.canBuy(run, it), price = h('div', { class: 'price' }, it.sold ? 'Sold' : it.cost + ' kg');
      let body;
      if (it.kind === 'gear') { const g = RUN.GEARS[it.id]; body = h('div', { class: 'gearPick k-' + g.kind }, h('div', { class: 'gpKind' }, kindOf(g)), h('div', { class: 'gpName' }, g.name), h('div', { class: 'gpText' }, g.text)); }
      else if (it.kind === 'route') {
        const rt = RUN.ROUTE[it.id], lv = RUN.routeLevel(run, it.id) - (it.sold ? 1 : 0), m = rt.x + rt.up * (lv - 1);
        body = h('div', { class: 'gearPick k-x' }, h('div', { class: 'gpKind' }, 'Route, level ' + lv + ' to ' + (lv + 1)), h('div', { class: 'gpName' }, rt.name), h('div', { class: 'gpText' }, cap(RUN.routeSteps(rt)) + '. Batch times ' + m + ' becomes times ' + (m + rt.up) + '.'));
      } else {
        const card = RX.CARDS[it.id], b = bottle(card, null), have = run.deck.filter(id => id === it.id).length;
        b.foot.append(h('span', null, it.kind === 'grade' ? 'Purify to grade ' + (RUN.gradeOf(run, it.id) + (it.sold ? 0 : 1)) : have ? have + ' in the rack' : 'New to the rack'));
        arts.push([b.art, card]); body = b.el; body.tabIndex = -1;
      }
      return h('div', { class: 'shopItem' + (it.sold ? ' sold' : ok ? '' : ' cant'), onclick: () => shopBuy(i) }, h('span', { class: 'bKey' }, String(i + 1)), body, price);
    });
    const counts = {}; run.deck.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    const canCut = run.money >= RUN.REMOVE && run.deck.length > RUN.MIN_RACK;
    const rack = Object.keys(counts).map(id => { const c = RX.CARDS[id]; return h('button', { class: 'chip', style: '--cc:' + css(c.rgb), disabled: !canCut, title: 'Remove one for ' + RUN.REMOVE + ' kg', onclick: () => { if (RUN.removeBottle(run, id)) { sfx.stamp(); showShop(); } } }, c.verb + (counts[id] > 1 ? ' ' + counts[id] : '')); });
    const bench = run.gear.map(id => h('button', { class: 'chip', onclick: () => { if (RUN.sellGear(run, id)) { sfx.stamp(); renderGear(); showShop(); } } }, RUN.GEARS[id].name + '  ' + RUN.sellValue(run, id) + ' kg'));
    overlay.replaceChildren(h('div', { class: 'panel shop' },
      h('div', { class: 'shopHead' }, h('h2', null, 'Supply room'), h('div', { class: 'cash' }, run.money + ' kg')),
      h('p', { class: 'surplus' }, 'Surplus still held when the next order is filled earns 1 kg for every ' + RUN.HOLD_PER + ' kg. At ' + run.money + ' kg that is ' + RUN.holdPay(run) + ' kg.'),
      h('div', { class: 'shopRow' }, items),
      h('h3', null, 'Rack, ' + plural(run.deck.length, 'bottle') + '. Click one to remove it for ' + RUN.REMOVE + ' kg.'), h('div', { class: 'chips' }, rack),
      bench.length ? h('h3', null, 'Bench. Click a piece to sell it. Each is worth 1 kg more for every order it has been on the bench.') : null, bench.length ? h('div', { class: 'chips' }, bench) : null,
      h('div', { class: 'shopFoot' }, h('button', { class: 'btn', disabled: run.money < sh.reroll, onclick: () => shopReroll() }, 'New stock  [R]  ' + sh.reroll + ' kg'), h('button', { class: 'btn go', onclick: () => leaveShop() }, 'Next order  [Enter]'))));
    overlay.className = 'ov on';
    arts.forEach(a => drawCardArt(a[0], a[1], false));
    renderTop(0);
  }
  function shopBuy(i) {
    if (st.mode !== 'shop') return;
    const it = run.shop.items[i];
    if (!RUN.buy(run, i)) { sfx.bad(); return; }
    if (it.kind === 'grade' || it.kind === 'route') sfx.good(); else sfx.stamp();
    checkUnlocks(); renderGear(); showShop();
  }
  function shopReroll() { if (st.mode === 'shop' && RUN.reroll(run)) { sfx.feed(); showShop(); } else sfx.bad(); }
  function leaveShop() {
    if (st.mode !== 'shop') return;
    RUN.closeShop(run); RUN.nextOrder(run); showOffers();
  }

  // ---------- frame loop ----------
  let last = performance.now(), tick = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const real = Math.min(0.05, (now - last) / 1000), dt = real * (now < st.slowUntil ? st.slowBy : 1); last = now; tick++;
    if (!v || !model) return;
    for (let i = 0; i < (now < st.slowUntil ? 1 : 4); i++) model.step(0.012);
    // leaving groups drift out and pop
    st.fliers = st.fliers.filter(f => {
      f.t += dt;
      f.atoms.forEach(a => { a.x += f.v[0] * dt; a.y += f.v[1] * dt; a.z += f.v[2] * dt; });
      if (f.t < f.life) return true;
      const a0 = f.atoms[0];
      if (model.atoms.includes(a0)) { v.burst({ x: a0.x, y: a0.y, z: a0.z }, 22, ['#ffffff', css(f.rgb)]); const p = v._screen(a0); fx.ring(p.x, p.y, WHITE, 26, 0.3); f.atoms.forEach(a => model.removeAtom(a)); }
      return false;
    });
    // keep the molecule framed
    const c = centroid(); let rad = 2;
    model.atoms.forEach(a => { if (!a.fly) rad = Math.max(rad, Math.hypot(a.x - c[0], a.y - c[1], a.z - c[2]) + 1); });
    const zin = now < st.zoomUntil, za = zin && st.zoomAtom && !st.zoomAtom.fly && model.atoms.includes(st.zoomAtom) ? st.zoomAtom : null;
    const tx = za ? [za.x, za.y, za.z] : c, kp = zin ? 0.2 : 0.06;
    v.pan.x += (tx[0] - v.pan.x) * kp; v.pan.y += (tx[1] - v.pan.y) * kp; v.pan.z += (tx[2] - v.pan.z) * kp;
    if (!v.rot) { v.zoom += (Math.max(26, Math.min(70, 640 / (rad * 2.35))) * (zin ? 1.7 : 1) - v.zoom) * (zin ? 0.2 : 0.05); v.yaw += dt * 0.16; }
    // glows: the hovered bottle's sites, reacting atoms, and a filled order
    v.glow.clear();
    // the atoms the last play made or changed stay lit: reacting there continues the chain
    if (st.mode === 'play' && !st.busy && cur && cur.path.length) cur.fresh.forEach(a => { if (a.el !== 'H' && !a.fly) v.glow.set(a, 0x8a6f00); });
    // the group to keep is lit blue for the whole order; capped groups are lit grey
    model.atoms.forEach(a => { if (a.prot) v.glow.set(a, 0x9aa3ad); else if (a.keep) v.glow.set(a, 0x19c3ff); });
    st.hoverAtoms.forEach(a => v.glow.set(a, st.hoverHex));
    st.flashes = st.flashes.filter(f => f.until > now); st.flashes.forEach(f => v.glow.set(f.atom, f.hex));
    if (st.party > now) model.atoms.forEach((a, i) => v.glow.set(a, new T.Color().setHSL((now / 900 + i * 0.07) % 1, 1, 0.45).getHex()));
    v.render(dt);
    // bloom: the frame just drawn, copied small and laid back over itself blurred; stronger as the score grows
    const bw = Math.max(2, benchCv.clientWidth >> 2), bh = Math.max(2, benchCv.clientHeight >> 2);
    if (bloomCv.width !== bw || bloomCv.height !== bh) { bloomCv.width = bw; bloomCv.height = bh; }
    bloomCx.clearRect(0, 0, bw, bh);
    try { bloomCx.drawImage(benchCv, 0, 0, bw, bh); bloomCx.drawImage(fxCv, 0, 0, bw, bh); } catch (e) { /* canvas not ready */ }
    bloomCv.style.opacity = Math.min(0.95, 0.4 + 0.08 * heat() + (now < st.slowUntil ? 0.25 : 0) + (st.party > now ? 0.2 : 0)).toFixed(2);
    fx.draw(real);
    sfx.setIntensity(st.mode === 'play' || st.mode === 'result' ? Math.min(1, 0.25 + heat() / 5) : 0.15);
    // score counts up
    const target = st.target;
    if (st.shown !== target) { const d = target - st.shown; st.shown = Math.abs(d) < 3 ? target : st.shown + d * Math.min(1, real * 8); scoreEl.textContent = fmt(st.shown); }
    // printouts: redraw while the pen is moving, then now and again
    const prog = Math.min(1, (now - st.t0) / 900);
    if (prog < 1 || tick % 20 === 0 || st.t0 !== st.drawn) {
      const o = { quality: 'hires', progress: prog, seed: 7, t: now };
      const spec = st.mode === 'offer' ? run.offers[st.pv].spec : cur && cur.spec;
      if (spec) { o.overlay = spec.desc; o.overlayColor = '#c8261c'; }
      prints.forEach(p => AA.paper.draw(p.cv, p.k, st.desc, o));
      if (prog >= 1) st.drawn = st.t0;
    }
  }

  // ---------- start ----------
  newRun(); showStart();
  requestAnimationFrame(() => {
    v = new AA.Viewer(benchCv, model, { interactive: false, zoom: 40, pitch: 0.32, yaw: 0.5, faces: false });
    const grid = new T.GridHelper(44, 22, 0x9a9a9a, 0x9a9a9a); grid.position.y = -5.4; grid.material.transparent = true; grid.material.opacity = 0.16; v.scene.add(grid);
    if (st.mode === 'play') renderHand();
    requestAnimationFrame(frame);
  });
  root.addEventListener('resize', () => { if (cur && st.mode === 'play') renderHand(); });
  root.addEventListener('keydown', e => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (st.mode === 'start') { if (k === 'Enter') { newRun(); e.preventDefault(); } return; }
    if (st.mode === 'shop') {
      if (k >= '1' && k <= '6') { shopBuy(+k - 1); e.preventDefault(); } else if (k === 'r' || k === 'R') shopReroll(); else if (k === 'Enter') { leaveShop(); e.preventDefault(); }
      return;
    }
    if (st.mode === 'offer') { if (k === '1' || k === '2') { pickFeed(+k - 1); e.preventDefault(); } return; }
    if (st.mode === 'result') {
      if (st.opts) { if (k >= '1' && k <= '3') { choose(+k - 1); e.preventDefault(); } else if (k === '0') { choose(-1); e.preventDefault(); } }
      else if (st.end && k === 'Enter' && overlay.className === 'ov on') { showStart(); e.preventDefault(); }
      return;
    }
    if (st.routesOpen) { if (k === 'r' || k === 'R' || k === 'Escape' || k === 'Enter') { hideRoutes(); e.preventDefault(); } return; }
    if (k >= '1' && k <= '9') { play(+k - 1); e.preventDefault(); }
    else if (k === 'r' || k === 'R') showRoutes();
    else if (k === 's' || k === 'S') swap();
    else if (k === 'c' || k === 'C') capKeep();
    else if (k === 'Enter') { deliver(); e.preventDefault(); }
  });
  const mute = document.getElementById('mute');
  if (mute) mute.addEventListener('click', () => { sfx.setMuted(!sfx.isMuted()); mute.textContent = sfx.isMuted() ? 'Sound off' : 'Sound on'; });
  const fresh = document.getElementById('newrun');
  if (fresh) fresh.addEventListener('click', () => showStart());
  const music = document.getElementById('music');
  if (music) music.addEventListener('click', () => { sfx.setMusic(!sfx.musicOn()); music.textContent = sfx.musicOn() ? 'Music on' : 'Music off'; });
  // audio may only start after a key or a click
  ['pointerdown', 'keydown'].forEach(ev => root.addEventListener(ev, () => sfx.startMusic(), { once: true }));

  AA.rxGame = { state: st, run: () => run, model: () => model, play, swap, deliver, choose, pickFeed, newRun, showStart, shopBuy, shopReroll, leaveShop };
}

document.addEventListener('DOMContentLoaded', () => start(document.getElementById('app')));
})(typeof globalThis !== 'undefined' ? globalThis : window);
