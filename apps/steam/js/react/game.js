// The reaction game screen: a run of orders, a rack of reagent bottles, equipment, and the fume hood.
(function (root) {
'use strict';
const AA = root.AA, T = root.THREE, RX = AA.rx, RUN = AA.rxRun, S = AA.spectra, sfx = AA.sfx;
const { h, css, hex, bright, drawCardArt, ghs } = AA.rxArt;
const YELLOW = [255, 205, 0], WHITE = [255, 255, 255], GREEN = [60, 220, 120], RED = [226, 48, 40];
const fmt = n => Math.round(n).toLocaleString();
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

function start(app) {
  let run = null, cur = null, model = null, v = null;
  const st = { tok: 0, busy: false, mode: 'play', shown: 0, hover: -1, hoverAtoms: [], hoverHex: 0, flashes: [], fliers: [], party: 0, t0: 0, drawn: -1, desc: null, sig: '', seen: new Set(), best: { orders: 0, total: 0 } };
  try { const b = JSON.parse(localStorage.getItem('aa_rx_best') || 'null'); if (b) st.best = { orders: b.orders | 0, total: b.total | 0 }; } catch (e) { /* storage unavailable */ }

  // ---------- DOM ----------
  const runEl = h('span', { class: 'tbRun' }), bestEl = h('span', { class: 'tbBest' });
  const bar = document.getElementById('runinfo'); if (bar) bar.append(runEl, bestEl);
  const benchCv = h('canvas', { class: 'hoodCv' }), fxCv = h('canvas', { class: 'hoodFx' });
  const nowEl = h('div', { class: 'hoodNow' }), stepEl = h('div', { class: 'hoodStep' });
  const hood = h('div', { class: 'hood' }, benchCv, fxCv, nowEl, stepEl);
  const fx = AA.rxFx.make(fxCv, hood);
  const logEl = h('div', { class: 'log' }), gearEl = h('div', { class: 'gear' });

  const tkHead = h('div', { class: 'tkHead' }), tkFeed = h('div', { class: 'tkFeed' }), tkCond = h('div', { class: 'tkCond' });
  const scoreEl = h('div', { class: 'tkScore' }, '0'), quotaEl = h('div', { class: 'tkQuota' }), barFill = h('div', { class: 'tkFill' });
  const bonusEl = h('div', { class: 'tkBonus' });
  const ticket = h('div', { class: 'ticket' }, tkHead, tkFeed,
    h('div', { class: 'tkRow' }, scoreEl, quotaEl), h('div', { class: 'tkBar' }, barFill), bonusEl, tkCond);
  const KINDS = [['ms', 'Mass spectrum'], ['ir', 'Infrared'], ['nmr', 'Proton NMR']];
  const prints = KINDS.map(([k, label]) => { const cv = h('canvas'), pct = h('span', { class: 'prPct' }); return { k, cv, pct, el: h('div', { class: 'print' }, h('header', null, h('span', null, label), pct), cv) }; });
  const legend = h('div', { class: 'legend' });

  const cardsEl = h('div', { class: 'cards' });
  const swapBtn = h('button', { class: 'btn', onclick: () => swap() }), deliverBtn = h('button', { class: 'btn go', onclick: () => deliver() }, 'Deliver  [Enter]');
  const rackEl = h('div', { class: 'rackInfo' });
  const shelf = h('div', { class: 'shelf' }, cardsEl, h('div', { class: 'side' }, deliverBtn, swapBtn, rackEl));
  const overlay = h('div', { class: 'ov' });
  app.append(h('div', { class: 'game' },
    h('div', { class: 'main' },
      h('div', { class: 'left' }, hood, h('div', { class: 'under' }, gearEl, logEl)),
      h('div', { class: 'right' }, ticket, legend, prints.map(p => p.el))),
    shelf), overlay);

  // one reagent bottle label
  function bottle(card, key) {
    const art = h('canvas', { class: 'bArt' }), foot = h('div', { class: 'bFoot' });
    const el = h('button', { class: 'bottle', style: '--cc:' + css(card.rgb) },
      h('div', { class: 'bBand' }, key ? h('span', { class: 'bKey' }, key) : null, h('span', { class: 'bVerb' }, card.verb)),
      h('div', { class: 'bFormula' }, card.formula), h('div', { class: 'bChem' }, card.chem),
      art, h('div', { class: 'bRule' }, card.rule),
      h('div', { class: 'bBottom' }, h('div', { class: 'bGhs' }, card.ghs.map(g => ghs(g))), foot));
    return { el, art, foot };
  }

  // ---------- rendering ----------
  const sitesOf = id => (st.mode === 'play' && model ? RX.CARDS[id].find(model).length : 0);
  function renderHand() {
    let any = false;
    const els = cur.hand.map((hc, i) => {
      const card = RX.CARDS[hc.id], n = sitesOf(hc.id), b = bottle(card, String(i + 1));
      if (n) any = true;
      b.el.className = 'bottle' + (n ? '' : ' none') + (st.seen.has(hc.uid) ? '' : ' deal');
      b.el.disabled = !n || st.busy;
      b.foot.append(n ? h('span', null, h('b', null, plural(n, 'site')), '  +' + fmt(RUN.sitePoints(run, hc.id) * n)) : h('span', null, 'no site'));
      b.el.addEventListener('click', () => play(i));
      ['mouseenter', 'focus'].forEach(ev => b.el.addEventListener(ev, () => setHover(i)));
      ['mouseleave', 'blur'].forEach(ev => b.el.addEventListener(ev, () => setHover(-1)));
      b.dim = !n; b.card = card; st.seen.add(hc.uid);
      return b;
    });
    cardsEl.style.setProperty('--n', Math.max(5, cur.hand.length));
    cardsEl.replaceChildren(...els.map(b => b.el));
    els.forEach(b => drawCardArt(b.art, b.card, b.dim));
    return any;
  }
  function renderTicket() {
    const proj = RUN.projected(run, st.sig), onBonus = !!cur.bonus && st.sig === cur.bonus.sig, met = proj >= cur.quota;
    tkHead.textContent = 'Order ' + (cur.n + 1) + ' of ' + RUN.ORDERS;
    tkFeed.replaceChildren('Feedstock: ', h('b', null, cur.feedName));
    quotaEl.replaceChildren('of ', h('b', null, fmt(cur.quota)), ' needed');
    barFill.style.width = Math.min(100, proj / cur.quota * 100).toFixed(1) + '%';
    ticket.className = 'ticket' + (met ? ' met' : '');
    bonusEl.replaceChildren(...(cur.bonus
      ? [h('span', { class: 'tkTag' + (onBonus ? ' on' : '') }, '×' + cur.bonusMult), h('span', null, onBonus ? 'In the hood now: ' : 'Deliver ', h('b', null, cur.bonus.name), onBonus ? '. Deliver to multiply.' : ' to multiply the order.')]
      : [h('span', null, 'No bonus compound on this order.')]));
    tkCond.textContent = cur.cond ? 'Condition: ' + cur.cond.text + '.' : '';
    tkCond.style.display = cur.cond ? '' : 'none';
    const left = cur.stepsMax - cur.step;
    stepEl.replaceChildren(h('b', null, '×' + RUN.stepIndex(run)), ' next step  ·  ' + plural(left, 'step') + ' left');
    nowEl.textContent = RX.label(model);
    swapBtn.textContent = 'Swap hand  [S]  ·  ' + cur.redraws + ' left';
    swapBtn.disabled = st.busy || st.mode !== 'play' || cur.redraws <= 0;
    deliverBtn.disabled = st.busy || st.mode !== 'play';
    deliverBtn.className = 'btn go' + (met ? ' ready' : '');
    rackEl.textContent = plural(run.deck.length, 'bottle') + ' in the rack  ·  ' + cur.draw.length + ' not yet drawn';
    runEl.textContent = 'Run total ' + fmt(run.total + (cur.done ? 0 : proj));
    bestEl.textContent = st.best.total ? 'Best run: ' + plural(st.best.orders, 'order') + ', ' + fmt(st.best.total) : '';
    legend.replaceChildren(h('span', { class: 'ink' }), 'in the hood', ...(cur.bonus ? [h('span', { class: 'dash' }), 'bonus compound'] : []));
    if (cur.bonus) { const cmp = S.compare(cur.bonus.desc, st.desc); prints.forEach(p => { const n = Math.round(cmp[p.k] * 100); p.pct.textContent = n + '% match'; p.pct.className = 'prPct' + (n >= 99 ? ' full' : ''); }); }
    else prints.forEach(p => { p.pct.textContent = ''; });
    logEl.replaceChildren(...cur.log.map((l, i) => { const c = RX.CARDS[l.id]; return h('span', { class: 'step', style: '--cc:' + css(c.rgb) }, h('b', null, (i + 1) + '. ' + c.verb), '  ' + plural(l.hits, 'site') + '  +' + fmt(l.pts)); }));
  }
  function renderGear() {
    const tags = run.gear.map(id => { const g = RUN.GEARS[id]; return h('div', { class: 'tag' }, h('b', null, g.name), h('span', null, g.text)); });
    for (let i = run.gear.length; i < RUN.GEAR_SLOTS; i++) tags.push(h('div', { class: 'tag empty' }, 'Empty bench space'));
    gearEl.replaceChildren(...tags);
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
  function loadOrder() {
    cur = run.cur; st.tok++; st.busy = false; st.mode = 'play'; st.pend = 0; st.shown = 0; st.opts = null;
    st.flashes = []; st.fliers = []; st.party = 0; st.hover = -1; st.hoverAtoms = [];
    fx.clear();
    model = AA.Model.fromSmilesRelaxed(cur.feed, 6);
    if (v) { v.model = model; v.glow.clear(); }
    st.desc = RX.describe(model); st.sig = RX.sigOf(model); st.t0 = performance.now();
    overlay.className = 'ov'; overlay.replaceChildren();
    scoreEl.textContent = '0';
    renderAll();
    fx.banner('ORDER ' + (cur.n + 1) + ' OF ' + RUN.ORDERS, cur.feedName + '  ·  ' + fmt(cur.quota) + ' needed', YELLOW, 1.9);
  }
  function newRun(seed) { run = RUN.newRun(seed); st.seen.clear(); RUN.beginOrder(run); loadOrder(); }

  const scr = atoms => { let x = 0, y = 0; atoms.forEach(a => { const p = v._screen(a); x += p.x; y += p.y; }); return { x: x / atoms.length, y: y / atoms.length }; };
  function centroid() { let x = 0, y = 0, z = 0, n = 0; model.atoms.forEach(a => { if (a.fly) return; x += a.x; y += a.y; z += a.z; n++; }); return n ? [x / n, y / n, z / n] : [0, 0, 0]; }

  function play(i) {
    const hc = cur && cur.hand[i];
    if (!hc || st.busy || st.mode !== 'play' || !v) return;
    const card = RX.CARDS[hc.id], sites = card.find(model);
    if (!sites.length) { sfx.bad(); return; }
    st.busy = true; st.hover = -1; st.hoverAtoms = [];
    const tok = st.tok, step = RUN.stepIndex(run), per = RUN.sitePoints(run, hc.id), col = bright(card.rgb), t = performance.now();
    let hits = 0;
    sfx.click();
    sites.forEach(s => s.atoms.forEach(a => st.flashes.push({ atom: a, hex: hex(col), until: t + 380 + sites.length * 260 })));
    fx.banner(card.verb.toUpperCase(), card.formula + '  ·  ' + card.chem, col, 1.25);
    renderHand(); renderTicket();
    if (cardsEl.children[i]) cardsEl.children[i].classList.add('played');
    sites.forEach((site, k) => setTimeout(() => {
      if (tok !== st.tok || !card.ok(model, site)) return;
      const c0 = centroid(), r = card.apply(model, site);
      hits++; st.pend += per;
      const p = scr(r.focus), now = performance.now();
      fx.ring(p.x, p.y, col, 90 + 24 * hits + 12 * step, 0.55); fx.ring(p.x, p.y, WHITE, 50, 0.3);
      fx.burst(p.x, p.y, col, 26 + 9 * step, 240 + 45 * step); fx.burst(p.x, p.y, YELLOW, 10 + 3 * step, 160);
      fx.floatText(p.x, p.y - 28, '+' + fmt(per), YELLOW, 28 + 4 * Math.min(step, 6));
      fx.floatText(p.x + 4, p.y + 34, r.tag, col, 18);
      fx.shake(3 + 1.6 * step + 1.5 * hits); fx.flash(0.1 + 0.04 * step, col);
      v.burst({ x: r.focus[0].x, y: r.focus[0].y, z: r.focus[0].z }, 26 + 6 * step, [css(col), '#ffcd00', '#ffffff']);
      v.yawVel += 0.35;
      r.focus.concat(r.incoming).forEach(a => { v.pop(a); st.flashes.push({ atom: a, hex: hex(col), until: now + 520 }); });
      r.leaving.forEach(group => {
        const g = group[0], d = [g.x - c0[0], g.y - c0[1] + 0.8, g.z - c0[2]], L = Math.hypot(d[0], d[1], d[2]) || 1;
        group.forEach(a => { a.fly = true; a.pinned = true; });
        st.fliers.push({ atoms: group, v: [d[0] / L * 5.5, d[1] / L * 5.5, d[2] / L * 5.5], t: 0, life: 0.85, rgb: col });
      });
      sfx.lock(step * 2 + hits - 2); sfx.bond();
    }, 380 + k * 260));
    setTimeout(() => {
      if (tok !== st.tok) return;
      const res = RUN.commit(run, i, hits); st.pend = 0;
      st.desc = RX.describe(model); st.sig = RX.sigOf(model); st.t0 = performance.now(); sfx.pen(500);
      if (hits >= 2) { fx.banner(hits + ' SITES  ×  STEP ' + step, '+' + fmt(res.gained), col, 1.6); if (hits >= 3) { fx.flash(0.45, WHITE); fx.shake(12 + 2 * step); sfx.good(); } }
      st.busy = false;
      const any = renderAll(), onBonus = cur.bonus && st.sig === cur.bonus.sig;
      if (onBonus) { model.atoms.forEach(a => { if (!a.fly) st.flashes.push({ atom: a, hex: hex(YELLOW), until: performance.now() + 900 }); }); sfx.good(); }
      if (cur.step >= cur.stepsMax) setTimeout(() => { if (tok === st.tok && st.mode === 'play') finishOrder(); }, hits >= 2 ? 1000 : 600);
      else if (!any) setTimeout(() => { if (tok === st.tok && st.mode === 'play' && !st.busy) fx.banner('NO SITE IN THIS HAND', cur.redraws > 0 ? 'Swap the hand or deliver' : 'Deliver the order', WHITE, 2.4); }, hits >= 2 ? 1500 : 300);
    }, 380 + sites.length * 260 + 420);
  }
  function swap() {
    if (st.busy || st.mode !== 'play' || !RUN.redraw(run)) return;
    sfx.feed(); renderAll();
  }
  function deliver() { if (!st.busy && st.mode === 'play') finishOrder(); }

  function finishOrder() {
    st.mode = 'result';
    const tok = st.tok, res = RUN.endOrder(run, st.sig), w = benchCv.clientWidth, hh = benchCv.clientHeight, cx = w / 2, cy = hh / 2;
    const filled = run.history.filter(q => q.pass).length;
    if (filled > st.best.orders || (filled === st.best.orders && run.total > st.best.total)) { st.best = { orders: filled, total: run.total }; res.best = true; try { localStorage.setItem('aa_rx_best', JSON.stringify(st.best)); } catch (e) { /* storage unavailable */ } }
    renderAll();
    if (res.pass) {
      st.party = performance.now() + (res.hit ? 2600 : 1400);
      fx.flash(res.hit ? 0.8 : 0.4, WHITE); sfx.fanfare(); v.yawVel = res.hit ? 2.6 : 1.4; fx.shake(res.hit ? 18 : 9);
      fx.ring(cx, cy, YELLOW, 260, 0.9); fx.ring(cx, cy, GREEN, 170, 0.7); fx.burst(cx, cy, YELLOW, 110, 520); fx.burst(cx, cy, WHITE, 50, 300);
      if (res.hit) [250, 520, 800].forEach((ms, k) => setTimeout(() => { if (tok !== st.tok) return; fx.ring(cx, cy, [YELLOW, GREEN, WHITE][k], 300 + 40 * k, 0.8); fx.burst(cx + (k - 1) * 170, cy - 40, [GREEN, YELLOW, WHITE][k], 60, 420); fx.shake(8); sfx.lock(6 + k * 2); }, ms));
      model.atoms.forEach(a => { if (!a.fly) v.pop(a); });
      fx.banner(res.hit ? 'BONUS COMPOUND  ×' + res.mult : 'ORDER FILLED', res.hit ? fmt(res.base) + ' × ' + res.mult + ' = ' + fmt(res.total) : fmt(res.total) + ' of ' + fmt(cur.quota) + ' needed', YELLOW, 2.3);
    } else {
      sfx.stamp(); fx.shake(6);
      fx.banner('QUOTA MISSED', fmt(res.total) + ' of ' + fmt(cur.quota) + ' needed', RED, 2.3);
    }
    setTimeout(() => { if (tok === st.tok) showPanel(res, filled); }, res.pass ? (res.hit ? 2000 : 1500) : 1200);
  }

  function showPanel(res, filled) {
    const kids = [], product = RX.label(model), n = cur.n + 1;
    const again = h('button', { class: 'btn go', onclick: () => newRun() }, 'New run  [Enter]');
    if (run.won) {
      kids.push(h('h2', null, 'Run complete'), h('div', { class: 'pBig' }, fmt(run.total)),
        h('p', null, 'All ' + RUN.ORDERS + ' orders filled. ' + (res.best ? 'This is the best run on this machine.' : 'Best run: ' + fmt(st.best.total) + '.')), again);
      st.opts = null; st.end = true;
    } else if (!res.pass) {
      kids.push(h('h2', null, 'Run over at order ' + n), h('div', { class: 'pBig' }, fmt(res.total) + ' / ' + fmt(cur.quota)),
        h('p', null, 'Delivered ' + product + '. The order needed ' + fmt(cur.quota) + '.' + (cur.bonus && !res.hit ? ' Delivering ' + cur.bonus.name + ' would have multiplied the score by ' + cur.bonusMult + '.' : '')),
        h('p', null, plural(filled, 'order') + ' filled, run total ' + fmt(run.total) + '.' + (res.best ? ' This is the best run on this machine.' : '')), again);
      st.opts = null; st.end = true;
    } else {
      st.opts = RUN.rewards(run); st.end = false;
      const opts = st.opts.map((o, i) => {
        if (o.kind === 'gear') { const g = RUN.GEARS[o.id]; return h('button', { class: 'pick gearPick', onclick: () => choose(i) }, h('span', { class: 'bKey' }, String(i + 1)), h('div', { class: 'gpKind' }, 'Equipment'), h('div', { class: 'gpName' }, g.name), h('div', { class: 'gpText' }, g.text), h('div', { class: 'gpSlot' }, 'Bench space ' + (run.gear.length + 1) + ' of ' + RUN.GEAR_SLOTS)); }
        const b = bottle(RX.CARDS[o.id], String(i + 1)), have = run.deck.filter(id => id === o.id).length;
        b.el.className = 'bottle pick'; b.el.addEventListener('click', () => choose(i));
        b.foot.append(h('span', null, have ? 'You have ' + have : 'New to the rack'));
        b.card = RX.CARDS[o.id];
        return b;
      });
      kids.push(h('h2', null, 'Order ' + n + ' filled'),
        h('p', null, fmt(res.total) + ' against ' + fmt(cur.quota) + ' needed.' + (res.hit ? ' Bonus compound delivered, score multiplied by ' + res.mult + '.' : '') + ' Next order needs ' + fmt(RUN.QUOTA[cur.n + 1]) + '.'),
        h('h3', null, 'Take one for the rest of the run'),
        h('div', { class: 'picks' }, opts.map(o => o.el || o)),
        h('button', { class: 'btn', onclick: () => choose(-1) }, 'Take nothing  [0]'));
      overlay.replaceChildren(h('div', { class: 'panel' }, kids)); overlay.className = 'ov on';
      opts.forEach(o => { if (o.art) drawCardArt(o.art, o.card, false); });
      return;
    }
    overlay.replaceChildren(h('div', { class: 'panel' }, kids)); overlay.className = 'ov on';
  }
  function choose(i) {
    if (st.mode !== 'result' || !st.opts || run.over) return;
    if (i >= 0) { if (!st.opts[i]) return; RUN.take(run, st.opts[i]); sfx.stamp(); } else sfx.click();
    st.opts = null; RUN.nextOrder(run); loadOrder();
  }

  // ---------- frame loop ----------
  let last = performance.now(), tick = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; tick++;
    if (!v || !model) return;
    for (let i = 0; i < 4; i++) model.step(0.012);
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
    v.pan.x += (c[0] - v.pan.x) * 0.06; v.pan.y += (c[1] - v.pan.y) * 0.06; v.pan.z += (c[2] - v.pan.z) * 0.06;
    if (!v.rot) { v.zoom += (Math.max(26, Math.min(70, 640 / (rad * 2.35))) - v.zoom) * 0.05; v.yaw += dt * 0.16; }
    // glows: the hovered bottle's sites, reacting atoms, and a filled order
    v.glow.clear();
    st.hoverAtoms.forEach(a => v.glow.set(a, st.hoverHex));
    st.flashes = st.flashes.filter(f => f.until > now); st.flashes.forEach(f => v.glow.set(f.atom, f.hex));
    if (st.party > now) model.atoms.forEach((a, i) => v.glow.set(a, new T.Color().setHSL((now / 900 + i * 0.07) % 1, 1, 0.45).getHex()));
    v.render(dt); fx.draw(dt);
    // score counts up
    const target = cur.done ? cur.final : cur.score + st.pend;
    if (st.shown !== target) { const d = target - st.shown; st.shown = Math.abs(d) < 3 ? target : st.shown + d * Math.min(1, dt * 8); scoreEl.textContent = fmt(st.shown); }
    // printouts: redraw while the pen is moving, then now and again
    const prog = Math.min(1, (now - st.t0) / 900);
    if (prog < 1 || tick % 20 === 0 || st.t0 !== st.drawn) {
      const o = { quality: 'hires', progress: prog, seed: 7, t: now };
      if (cur.bonus) { o.overlay = cur.bonus.desc; o.overlayColor = '#c8261c'; }
      prints.forEach(p => AA.paper.draw(p.cv, p.k, st.desc, o));
      if (prog >= 1) st.drawn = st.t0;
    }
  }

  // ---------- start ----------
  newRun();
  requestAnimationFrame(() => {
    v = new AA.Viewer(benchCv, model, { interactive: false, zoom: 40, pitch: 0.32, yaw: 0.5, faces: false });
    const grid = new T.GridHelper(44, 22, 0x9a9a9a, 0x9a9a9a); grid.position.y = -5.4; grid.material.transparent = true; grid.material.opacity = 0.16; v.scene.add(grid);
    renderHand();
    requestAnimationFrame(frame);
  });
  root.addEventListener('resize', () => { if (cur && st.mode === 'play') renderHand(); });
  root.addEventListener('keydown', e => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (st.mode === 'result') {
      if (st.opts) { if (k >= '1' && k <= '3') { choose(+k - 1); e.preventDefault(); } else if (k === '0') { choose(-1); e.preventDefault(); } }
      else if (st.end && k === 'Enter' && overlay.className === 'ov on') { newRun(); e.preventDefault(); }
      return;
    }
    if (k >= '1' && k <= '9') { play(+k - 1); e.preventDefault(); }
    else if (k === 's' || k === 'S') swap();
    else if (k === 'Enter') { deliver(); e.preventDefault(); }
  });
  const mute = document.getElementById('mute');
  if (mute) mute.addEventListener('click', () => { sfx.setMuted(!sfx.isMuted()); mute.textContent = sfx.isMuted() ? 'Sound off' : 'Sound on'; });
  const fresh = document.getElementById('newrun');
  if (fresh) fresh.addEventListener('click', () => newRun());

  AA.rxGame = { state: st, run: () => run, model: () => model, play, swap, deliver, choose, newRun };
}

document.addEventListener('DOMContentLoaded', () => start(document.getElementById('app')));
})(typeof globalThis !== 'undefined' ? globalThis : window);
