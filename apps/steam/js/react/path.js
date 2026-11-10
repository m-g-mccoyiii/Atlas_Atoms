// One-screen test of a round played by clicking the product. The molecule stands in the middle. Each reagent on
// offer has a fixed place around it and shows the molecule it would make. Clicking a product reacts, and each bottle
// in the rack is one use. One group on the molecule is marked: a reagent reacts at every matching site, and a
// batch delivered with the marked group intact is multiplied. The score is not shown until Deliver, when every
// step replays and scores in turn.
(function (root) {
'use strict';
const AA = root.AA, RX = AA.rx, RUN = AA.rxRun, sfx = AA.sfx;
const FEEDS = ['C=CCC(O)CC=C', 'CC(O)CCC=C', 'CC(=O)CCC(O)CC=C', 'C=CCC(O)CC(O)CC=C', 'C=CCC(=O)CCC(=O)CC=C', 'CC(O)CC(=O)CCC(Cl)CCC=C'];
// measured setting for this test. The main game does not load this file, so its numbers stay as they are.
const GEAR = ['balance', 'stirrer'];
// keep: batch multiplier at delivery when the marked group is intact. steps: reactions allowed in one order.
const DIAL = { keep: 3, steps: 3 };
AA.rxPathGear = GEAR; RUN.TUNE.chain = 0.1; RUN.TUNE.route = 0.25; RUN.TUNE.siteBatch = 0;
const PAPER = '#efeadb', YELLOW = [255, 205, 0], RED = [226, 48, 40], GREEN = [60, 220, 120], WHITE = [255, 255, 255], KEEP = 0x19c3ff;
const css = c => 'rgb(' + c.join(',') + ')', hex = c => (c[0] << 16) | (c[1] << 8) | c[2];
const bright = c => { const m = Math.max(c[0], c[1], c[2], 1), k = Math.max(1, 200 / m); return c.map(q => Math.min(255, Math.round(q * k + 30))); };
const fmt = n => Math.round(n).toLocaleString('en-US');
const fmtB = n => (n < 100 ? String(Math.round(n * 10) / 10) : fmt(n));

// ---------- rules, with nothing drawn ----------
// offer: the reagents on the ring for this order; the rest of the rack sits the order out
// keep: index of the oxygen that must survive, or null
function begin(feed, relaxed, offer, keep) {
  const run = RUN.newRun(7, {}); run.gear = GEAR.slice();
  RUN.beginOrder(run); RUN.chooseFeed(run, 0);
  const cur = run.cur, m = relaxed ? AA.Model.fromSmilesRelaxed(feed, 4) : RX.fromSmiles(feed), left = {};
  m.center();
  if (keep != null && m.atoms[keep] && m.atoms[keep].el === 'O') m.atoms[keep].keep = true;
  cur.feed = feed; cur.feedSig = RX.sigOf(m); cur.seen = new Set([cur.feedSig]); cur.spec = null; cur.keep = null; cur.cond = null; cur.stepsMax = 99;
  cur.yield = 0; cur.batch = 1; cur.path = []; cur.fresh = new Set();
  run.deck.forEach(id => { left[id] = (left[id] || 0) + 1; });
  return { run, cur, m, left, all: Object.keys(left), kinds: offer || Object.keys(left), keep: keep == null ? null : keep, spoiled: false, trail: [], dead: false };
}
// runs one reagent on a copy of the molecule
function tryOne(g, m, id) {
  const cur = g.cur, cm = RX.cloneMap(m), keep = cur.fresh, fresh = new Set();
  keep.forEach(a => { const c = cm.map.get(a); if (c) fresh.add(c); });
  cur.fresh = fresh;
  const r = RUN.react(g.run, cm.model, id);
  cur.fresh = keep;
  return { model: cm.model, r };
}
function options(g) {
  const cur = g.cur, out = {};
  if (g.trail.length >= DIAL.steps) return out;
  g.kinds.forEach(id => {
    if (!g.left[id]) return;
    const sites = RX.CARDS[id].find(g.m); if (!sites.length) return;
    const t = tryOne(g, g.m, id), r = t.r; if (!r.hits && !r.spoiled) return;
    const loop = cur.seen.has(r.sig), spoil = r.spoiled > 0;
    out[id] = { id, model: t.model, r, loop, spoil, cont: r.hits > 0 && r.hot && cur.path.length > 0 && !loop, atoms: sites.reduce((a, s) => a.concat(s.atoms), []) };
  });
  return out;
}
function take(g, o) {
  const cur = g.cur, ev = [];
  g.left[o.id]--; g.m = o.model;
  if (o.spoil) g.spoiled = true;
  for (let i = 0; i < o.r.hits; i++) RUN.scoreSite(g.run, o.id, false).forEach(e => ev.push(e));
  RUN.playEnd(g.run, o.id, o.r.hits, false, o.r).forEach(e => ev.push(e));
  cur.fresh = new Set(o.r.made); cur.seen.add(o.r.sig); cur.step++; cur.used.push(o.id);
  g.trail.push({ id: o.id, hits: o.r.hits, cont: o.cont, ev, spoil: o.spoil });
}
const keepMult = g => (g.keep != null && !g.spoiled ? DIAL.keep : 1);
// every path, scored with the multiplier for an intact marked group
function survey(feed, depth, offer, keep) {
  const g = begin(feed, false, offer, keep), cur = g.cur, res = []; let nodes = 0;
  (function dfs(m, path, spoiled) {
    res.push({ path: path.join(' '), spoiled, score: Math.round(RUN.scoreOf(cur) * (g.keep != null && !spoiled ? DIAL.keep : 1)) });
    if (path.length >= (depth || DIAL.steps) || nodes > 30000) return;
    g.kinds.forEach(id => {
      if (!g.left[id] || !RX.CARDS[id].find(m).length) return;
      const s = { y: cur.yield, b: cur.batch, path: cur.path, fresh: cur.fresh, seen: cur.seen, step: cur.step, used: cur.used.length };
      const t = tryOne(g, m, id), r = t.r;
      if (r.hits || r.spoiled) {
        nodes++;
        for (let i = 0; i < r.hits; i++) RUN.scoreSite(g.run, id, true);
        RUN.playEnd(g.run, id, r.hits, true, r);
        cur.fresh = new Set(r.made); cur.seen = new Set(s.seen).add(r.sig); cur.step++; cur.used.push(id); g.left[id]--; path.push(id);
        dfs(t.model, path, spoiled || r.spoiled > 0);
        path.pop(); g.left[id]++;
      }
      cur.yield = s.y; cur.batch = s.b; cur.path = s.path; cur.fresh = s.fresh; cur.seen = s.seen; cur.step = s.step; cur.used.length = s.used;
    });
  })(g.m, [], false);
  res.sort((a, b) => b.score - a.score);
  const best = res[0].score, near = res.filter(r => r.score >= best * 0.9), firsts = {};
  res.forEach(r => { const f = r.path.split(' ')[0]; if (f && !(firsts[f] >= r.score)) firsts[f] = r.score; });
  const alt = res.find(r => r.spoiled !== res[0].spoiled);
  return { feed, paths: res.length, best, bestPath: res[0].path, bestSpoils: res[0].spoiled, otherPct: alt ? Math.round(100 * alt.score / best) : 0, near: near.length, nearFirsts: Array.from(new Set(near.map(r => r.path.split(' ')[0]))),
    firsts: Object.keys(firsts).map(f => ({ id: f, pct: Math.round(100 * firsts[f] / best) })).sort((a, b) => b.pct - a.pct) };
}
// the oxygens of a feedstock that an order can mark
const keeps = feed => RX.keepable(RX.fromSmiles(feed)).map(k => k.i);
// the reagents that can open on this feedstock without losing the marked group
function safe(feed, keep) { const g = begin(feed, false, null, keep); return g.all.filter(id => { if (!RX.CARDS[id].find(g.m).length) return false; const r = tryOne(g, g.m, id).r; return r.hits && !r.spoiled; }); }
// a random order: a marked group and n reagents, at least two of which can open safely
function deal(feed, n, rnd) {
  const R = rnd || Math.random, ks = keeps(feed), g = begin(feed, false);
  for (let t = 0; t < 60; t++) {
    const keep = ks.length ? ks[Math.floor(R() * ks.length)] : null, ok = safe(feed, keep), pool = g.all.slice(), out = [];
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(R() * pool.length), 1)[0]);
    if (out.filter(id => ok.includes(id)).length >= 2) return { offer: g.all.filter(id => out.includes(id)), keep };
  }
  return { offer: g.all, keep: null };
}
AA.rxPath = { DIAL, FEEDS, OFFER: 4, begin, options, take, survey, deal, keeps, safe };

// ---------- the screen ----------
function start(app) {
  const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; };
  const stage = h('div', 'stage'), mainCv = h('canvas', 'mainCv'), ov = h('canvas', 'ov'), fxCv = h('canvas', 'fx');
  const go = h('button', 'go', 'Deliver'), again = h('button', 'tok', 'Again'), next = h('button', 'tok', 'Next');
  const toks = h('div', 'toks'); toks.append(again, next);
  stage.append(mainCv); app.append(stage);
  const fx = AA.rxFx.make(fxCv, stage), x = ov.getContext('2d');
  const st = { mode: 'play', feed: 0, hover: null, shown: 0, y: 0, b: 1, quota: 0, beat: -1, fired: {}, tok: 0, flash: [] };
  let g = null, v = null, opts = {}, L = null, last = performance.now();
  const slots = [];

  function layout() {
    const W = stage.clientWidth, H = stage.clientHeight, n = Math.max(1, slots.length);
    L = { W, H, cx: W * 0.46, cy: H * 0.52, main: Math.min(W * 0.3, H * 0.46), d: Math.min(W * 0.16, H * 0.25), rx: W * 0.31, ry: H * 0.33 };
    Object.assign(mainCv.style, { left: (L.cx - L.main / 2) + 'px', top: (L.cy - L.main / 2) + 'px', width: L.main + 'px', height: L.main + 'px' });
    slots.forEach((s, i) => {
      const a = (-90 + (i + 0.5) * 360 / n) * Math.PI / 180;
      s.pos = { x: L.cx + Math.cos(a) * L.rx, y: L.cy + Math.sin(a) * L.ry };
      Object.assign(s.el.style, { left: (s.pos.x - L.d / 2) + 'px', top: (s.pos.y - L.d / 2) + 'px', width: L.d + 'px', height: L.d + 'px' });
    });
    const dpr = Math.min(root.devicePixelRatio || 1, 2); ov.width = Math.round(W * dpr); ov.height = Math.round(H * dpr); L.dpr = dpr;
  }
  function refresh() {
    opts = g.dead || st.mode !== 'play' ? {} : options(g);
    slots.forEach(s => {
      const o = opts[s.id] || null; s.opt = o;
      s.el.style.opacity = o ? 1 : 0; s.el.style.pointerEvents = o ? 'auto' : 'none';
      if (o) { o.model.settle(140); o.model.center(); s.v.model = o.model; s.v.glow.clear(); }
    });
    go.disabled = st.mode !== 'play' || !g.trail.length;
  }
  function load(i, keep) {
    st.feed = (i + FEEDS.length) % FEEDS.length; if (!keep || !st.deal) st.deal = deal(FEEDS[st.feed], AA.rxPath.OFFER); st.tok++; st.mode = 'play'; st.shown = 0; st.y = 0; st.b = 1; st.beat = -1; st.hover = null; st.fired = {}; st.kept = false; st.target = 0; st.pass = false;
    fx.clear();
    g = begin(FEEDS[st.feed], true, st.deal.offer, st.deal.keep);
    const sv = survey(FEEDS[st.feed], 0, st.deal.offer, st.deal.keep), q = sv.best * 0.45, mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(10, q))) - 1));
    st.quota = Math.max(50, Math.round(q / mag) * mag);
    if (!slots.length) g.all.forEach((id, k) => {
      const el = h('div', 'prod'), cv = h('canvas'); el.append(cv); stage.append(el);
      const s = { id, card: RX.CARDS[id], el, cv, v: null, opt: null, pos: { x: 0, y: 0 } };
      el.addEventListener('click', () => pickSlot(k));
      el.addEventListener('pointerenter', () => { st.hover = s; });
      el.addEventListener('pointerleave', () => { if (st.hover === s) st.hover = null; });
      slots.push(s);
    });
    if (!ov.parentNode) stage.append(ov, fxCv, go, toks);
    layout();
    slots.forEach(s => { if (!s.v) { s.v = new AA.Viewer(s.cv, new AA.Model(), { interactive: false, zoom: 40, pitch: 0.3, yaw: 0.5, faces: false, autoFit: true }); s.v.renderer.shadowMap.enabled = false; } });
    if (!v) v = new AA.Viewer(mainCv, g.m, { interactive: false, zoom: 40, pitch: 0.3, yaw: 0.5, faces: false, autoFit: true });
    v.model = g.m; v.glow.clear();
    refresh();
  }
  function pickSlot(k) {
    const s = slots[k], o = s && s.opt;
    if (!o || st.mode !== 'play' || g.dead) return;
    const col = bright(s.card.rgb), now = performance.now(); take(g, o);
    v.model = g.m; v.glow.clear(); st.hover = null;
    o.r.made.forEach(a => { v.pop(a); st.flash.push({ a, hex: hex(col), until: now + 700 }); });
    const a0 = o.r.made[0]; if (a0) v.burst({ x: a0.x, y: a0.y, z: a0.z }, 30 + 10 * o.r.hits, [css(col), '#ffffff']);
    fx.ring(L.cx, L.cy, col, L.main * 0.55, 0.45); fx.shake(3 + 2 * o.r.hits); sfx.bond(); sfx.lock(g.trail.length);
    if (o.spoil) { fx.flash(0.5, RED); fx.shake(14); fx.ring(L.cx, L.cy, RED, L.main * 0.7, 0.6); sfx.bad(); }
    refresh();
  }
  function blow() {
    st.mode = 'lost'; refresh();
    const c = [0, 0, 0]; g.m.atoms.forEach(a => { c[0] += a.x; c[1] += a.y; c[2] += a.z; });
    const n = g.m.atoms.length || 1;
    g.m.atoms.forEach(a => { const d = [a.x - c[0] / n, a.y - c[1] / n, a.z - c[2] / n], l = Math.hypot(d[0], d[1], d[2]) || 1, sp = 6 + Math.random() * 8; a.bv = [d[0] / l * sp, d[1] / l * sp + 2, d[2] / l * sp]; });
    g.m.bonds = [];
    fx.flash(0.9, RED); fx.shake(26); fx.punch(0.12); fx.burst(L.cx, L.cy, RED, 140, 620); fx.burst(L.cx, L.cy, WHITE, 60, 380); fx.ring(L.cx, L.cy, RED, L.main, 0.8);
    sfx.stamp(); sfx.bad();
  }
  function deliver() {
    if (st.mode !== 'play' || !g.trail.length) return;
    st.mode = 'score'; refresh();
    const tok = st.tok, beats = [];
    g.trail.forEach((t, k) => t.ev.forEach(e => { if (e.kind !== 'grade' && e.kind !== 'catch') beats.push({ k, e }); }));
    let i = 0, met = false;
    const step = () => {
      if (tok !== st.tok) return;
      if (i >= beats.length) {
        if (keepMult(g) > 1 && !st.kept) {   // the marked group is intact: the last multiplier
          st.kept = true; st.b *= keepMult(g); st.target = Math.round(st.y * st.b);
          fx.floatText(L.cx, L.cy - L.main * 0.2, 'times ' + keepMult(g), [25, 195, 255], 48); fx.flash(0.5, [25, 195, 255]); fx.shake(14); fx.punch(0.08); fx.ring(L.cx, L.cy, [25, 195, 255], L.main * 0.9, 0.7); sfx.good();
          if (!met && st.target >= st.quota) { met = true; fx.burst(L.cx, L.cy, GREEN, 80, 460); sfx.quota(); }
          return setTimeout(step, 700);
        }
        return finish();
      }
      const b = beats[i], e = b.e, big = e.kind === 'x';
      st.beat = b.k; st.y = e.yield; st.b = e.batch; st.target = Math.round(e.yield * e.batch);
      const src = RUN.GEARS[e.src] ? e.src : e.gear;
      if (src) st.fired[src] = { t: performance.now(), txt: (big ? 'times ' : '+') + fmtB(e.val) };
      const c = big ? RED : e.kind === 'y' ? YELLOW : WHITE, heat = Math.max(0, Math.log10(Math.max(10, st.target)) - 1);
      if (!src) fx.floatText(L.cx + (Math.random() - 0.5) * L.main * 0.5, L.cy - L.main * 0.2, (big ? (e.src === 'chain' ? 'chain times ' : 'times ') : '+') + fmtB(e.val), c, big ? 34 + 4 * heat : 24);
      if (big) { fx.flash(0.18 + 0.04 * heat, RED); fx.shake(6 + 3 * heat); fx.punch(0.03 + 0.01 * heat); fx.ring(L.cx, L.cy, RED, L.main * 0.5, 0.4); }
      else fx.shake(1.5 + heat);
      sfx.lock(i);
      if (!met && st.target >= st.quota) { met = true; fx.flash(0.6, GREEN); fx.ring(L.cx, L.cy, GREEN, L.main * 0.8, 0.8); fx.burst(L.cx, L.cy, GREEN, 80, 460); sfx.quota(); }
      i++;
      setTimeout(step, Math.max(45, (big ? 260 : 150) - 7 * i));
    };
    const finish = () => {
      st.beat = -1; st.mode = 'done';
      const pass = st.target >= st.quota, ratio = st.target / st.quota;
      if (pass) {
        const big = Math.max(0, Math.min(5, Math.floor(Math.log2(Math.max(1, ratio)))));
        sfx.fanfare(); fx.flash(0.5 + 0.08 * big, WHITE); fx.shake(10 + 3 * big); fx.punch(0.1); v.yawVel = 1.4 + 0.4 * big;
        fx.ring(L.cx, L.cy, YELLOW, L.main, 0.9); fx.burst(L.cx, L.cy, YELLOW, 110 + 30 * big, 520); fx.burst(L.cx, L.cy, WHITE, 50, 300);
        g.m.atoms.forEach(a => v.pop(a));
      } else { sfx.bad(); fx.shake(8); fx.flash(0.4, RED); }
      st.pass = pass;
    };
    st.target = 0; sfx.click(); setTimeout(step, 350);
  }

  // ---------- 2D readings, drawn straight onto the screen ----------
  function diamond(px, py, r, fill, col) { x.beginPath(); x.moveTo(px, py - r); x.lineTo(px + r, py); x.lineTo(px, py + r); x.lineTo(px - r, py); x.closePath(); if (fill) { x.fillStyle = col; x.fill(); } else { x.strokeStyle = col; x.lineWidth = 2; x.stroke(); } }
  function draw(now) {
    const W = L.W, H = L.H, play = st.mode === 'play';
    x.setTransform(L.dpr, 0, 0, L.dpr, 0, 0); x.clearRect(0, 0, W, H); x.lineCap = 'round'; x.textBaseline = 'alphabetic';
    const hv = play && st.hover && st.hover.opt ? st.hover : null;
    slots.forEach((s, i) => {
      if (!g.kinds.includes(s.id)) return;
      const p = s.pos, o = play ? s.opt : null, col = css(bright(s.card.rgb)), dx = p.x - L.cx, dy = p.y - L.cy, d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
      const a = L.main * 0.4, b = d - L.d / 2 - 4, r = L.d / 2;
      x.strokeStyle = o ? col : 'rgba(239,234,219,0.08)'; x.lineWidth = o ? (hv === s ? 8 : 4) : 2; x.setLineDash([]);
      x.beginPath(); x.moveTo(L.cx + ux * a, L.cy + uy * a); x.lineTo(L.cx + ux * b, L.cy + uy * b); x.stroke();
      if (o) {
        const over = o.spoil;
        x.strokeStyle = over ? css(RED) : o.cont ? css(YELLOW) : o.loop ? 'rgba(239,234,219,0.45)' : 'rgba(239,234,219,0.2)';
        x.lineWidth = o.cont || over ? 5 : 2; x.setLineDash(o.loop ? [7, 9] : []);
        x.beginPath(); x.arc(p.x, p.y, r + 2 + (hv === s ? 4 : 0), 0, 6.3); x.stroke(); x.setLineDash([]);
        // the number of sites, on a round sticker where the line meets the product
        const sx = L.cx + ux * (b - 20), sy = L.cy + uy * (b - 20);
        x.fillStyle = over ? css(RED) : col; x.beginPath(); x.arc(sx, sy, 15, 0, 6.3); x.fill();
        x.fillStyle = '#16161a'; x.textAlign = 'center'; x.font = '22px Marker, "Segoe Print", sans-serif'; x.fillText(String(o.r.hits), sx, sy + 8);
      }
      x.textAlign = 'center'; x.fillStyle = o ? PAPER : 'rgba(239,234,219,0.22)'; x.font = '23px Marker, "Segoe Print", sans-serif';
      x.fillText(s.card.verb, p.x, p.y + r + 30);
      const tw = x.measureText(s.card.verb).width;
      for (let k = 0; k < g.left[s.id]; k++) { x.fillStyle = o ? col : 'rgba(239,234,219,0.2)'; x.beginPath(); x.arc(p.x + tw / 2 + 12 + k * 11, p.y + r + 23, 3.5, 0, 6.3); x.fill(); }
      x.fillStyle = 'rgba(239,234,219,' + (o ? 0.55 : 0.18) + ')'; x.font = '20px Hand, "Segoe Print", sans-serif'; x.fillText(String(i + 1), p.x - tw / 2 - 14, p.y + r + 30);
    });

    // the steps taken so far, joined in yellow where the chain held, and a ring for each step still to take
    for (let k = g.trail.length; k < DIAL.steps; k++) { x.strokeStyle = 'rgba(239,234,219,0.3)'; x.lineWidth = 2; x.beginPath(); x.arc(44 + k * 44, 46, 13, 0, 6.3); x.stroke(); }
    g.trail.forEach((t, k) => {
      const px = 44 + k * 44, py = 46, c = bright(RX.CARDS[t.id].rgb);
      if (k) { x.strokeStyle = t.cont ? css(YELLOW) : 'rgba(239,234,219,0.25)'; x.lineWidth = t.cont ? 5 : 2; x.beginPath(); x.moveTo(px - 28, py); x.lineTo(px - 16, py); x.stroke(); }
      x.fillStyle = css(c); x.beginPath(); x.arc(px, py, st.beat === k ? 19 : 15, 0, 6.3); x.fill();
      x.fillStyle = '#16161a'; x.textAlign = 'center'; x.font = '21px Marker, "Segoe Print", sans-serif'; x.fillText(String(t.hits), px, py + 7);
    });

    // the marked group: its multiplier while it stands, struck through once it is gone
    if (g.keep != null) {
      const ky = 44 + GEAR.length * 30 + 8, txt = 'kept  times ' + DIAL.keep;
      x.textAlign = 'right'; x.font = '24px Hand, "Segoe Print", sans-serif'; x.fillStyle = g.spoiled ? 'rgba(239,234,219,0.3)' : '#19c3ff'; x.fillText(txt, W - 120, ky);
      if (g.spoiled) { const tw = x.measureText(txt).width; x.strokeStyle = css(RED); x.lineWidth = 3; x.beginPath(); x.moveTo(W - 124 - tw, ky - 8); x.lineTo(W - 116, ky - 8); x.stroke(); }
    }
    // equipment: each name lights when it fires
    GEAR.forEach((id, k) => {
      const f = st.fired[id], age = f ? (now - f.t) / 1000 : 9, lit = Math.max(0, 1 - age * 2.5);
      x.textAlign = 'right'; x.font = Math.round(22 + 8 * lit) + 'px Hand, "Segoe Print", sans-serif';
      x.fillStyle = lit > 0 ? css(YELLOW) : 'rgba(239,234,219,0.5)'; x.fillText(RUN.GEARS[id].name, W - 120, 44 + k * 30);
      if (f && age < 1.2) { x.textAlign = 'left'; x.fillStyle = css(YELLOW); x.font = '22px Marker, "Segoe Print", sans-serif'; x.fillText(f.txt, W - 110, 44 + k * 30); }
    });

    // the score is hidden until delivery
    const cy = H - 44, scoring = st.mode === 'score' || st.mode === 'done';
    x.textAlign = 'right'; x.font = (scoring ? 64 : 54) + 'px Marker, "Segoe Print", sans-serif';
    x.fillStyle = st.mode === 'lost' ? css(RED) : st.mode === 'done' ? css(st.pass ? GREEN : RED) : scoring ? css(YELLOW) : 'rgba(239,234,219,0.6)';
    const big = st.mode === 'lost' ? '0' : scoring ? fmt(st.shown) : '?', bw = x.measureText(big).width;
    x.textAlign = 'left'; x.fillText(big, 30, cy - 30);
    x.font = '30px Hand, "Segoe Print", sans-serif'; x.fillStyle = css(RED); x.fillText('/ ' + fmt(st.quota), 42 + bw, cy - 30);
    if (scoring) {
      x.font = '24px Hand, "Segoe Print", sans-serif'; x.textAlign = 'left';
      x.fillStyle = css(YELLOW); x.fillText(fmt(st.y) + ' yield', 30, cy - 96);
      x.fillStyle = css(RED); x.fillText('batch ' + fmtB(st.b), 150, cy - 96);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!g || !v) return;
    if (st.mode === 'lost') g.m.atoms.forEach(a => { if (a.bv) { a.x += a.bv[0] * dt; a.y += a.bv[1] * dt; a.z += a.bv[2] * dt; a.bv[1] -= 6 * dt; } });
    else for (let i = 0; i < 3; i++) g.m.step(0.012);
    if (st.mode === 'lost') v.autoFit = false; else v.autoFit = true;
    v.yaw += dt * 0.16; v.glow.clear();
    g.m.atoms.forEach(a => { if (a.keep) v.glow.set(a, KEEP); });
    const hv = st.mode === 'play' && st.hover && st.hover.opt ? st.hover : null;
    if (hv) hv.opt.atoms.forEach(a => v.glow.set(a, hex(bright(hv.card.rgb))));
    else if (st.mode === 'play' && g.cur.path.length) g.cur.fresh.forEach(a => { if (a.el !== 'H') v.glow.set(a, 0x8a6f00); });
    st.flash = st.flash.filter(f => f.until > now); st.flash.forEach(f => v.glow.set(f.a, f.hex));
    v.render(dt);
    slots.forEach(s => {
      if (!s.opt || !s.v) return;
      s.v.yaw = v.yaw; s.v.pitch = v.pitch; s.v.glow.clear();
      s.opt.model.atoms.forEach(a => { if (a.keep) s.v.glow.set(a, KEEP); });
      const c = hex(bright(s.card.rgb)); s.opt.r.made.forEach(a => { if (a.el !== 'H') s.v.glow.set(a, c); });
      s.v.render(dt);
    });
    if (st.mode === 'score' || st.mode === 'done') { const d = (st.target || 0) - st.shown; st.shown = Math.abs(d) < 2 ? (st.target || 0) : st.shown + d * Math.min(1, dt * 14); }
    draw(now); fx.draw(dt);
  }

  go.addEventListener('click', deliver);
  again.addEventListener('click', () => load(st.feed, true));
  next.addEventListener('click', () => load(st.feed + 1));
  root.addEventListener('resize', () => { if (L) layout(); });
  root.addEventListener('keydown', e => {
    if (e.key >= '1' && e.key <= '9') pickSlot(+e.key - 1);
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (st.mode === 'play') deliver(); else load(st.mode === 'done' && st.pass ? st.feed + 1 : st.feed, !(st.mode === 'done' && st.pass)); }
    else if (e.key === 'r' || e.key === 'R') load(st.feed, true);
    else if (e.key === 'n' || e.key === 'N') load(st.feed + 1);
  });
  AA.rxPath.ui = { st, load, pickSlot, deliver, state: () => ({ mode: st.mode, keep: g.keep, spoiled: g.spoiled, spoils: Object.keys(opts).filter(k => opts[k].spoil), trail: g.trail.map(t => t.id), opts: Object.keys(opts), offer: st.deal.offer, quota: st.quota, total: st.target, pass: st.pass }) };
  const boot = () => { load(0); requestAnimationFrame(frame); };
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('30px Marker'), document.fonts.load('30px Hand')]).then(boot, boot); else boot();
}
if (root.document && document.getElementById('pathapp')) start(document.getElementById('pathapp'));
})(typeof globalThis !== 'undefined' ? globalThis : window);
