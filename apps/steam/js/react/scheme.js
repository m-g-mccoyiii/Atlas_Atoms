// One round, played on pages of a lab notebook. The molecule stands in the middle of the page with an inked arrow
// to each molecule it can become. Clicking a product reacts. After three reactions the page turns and the same
// molecule carries on. Reactions that build on one another multiply what is made. Every reading is ink or pencil
// on the page. Rules come from path.js. This file draws and takes input only.
(function (root) {
'use strict';
const AA = root.AA, T = root.THREE, RX = AA.rx, E = AA.ELEMENTS, P = AA.rxPath, sfx = AA.sfx;
const lin = h => new T.Color(h).convertSRGBToLinear();
const rgb = c => 'rgb(' + c.join(',') + ')';
const bright = c => { const m = Math.max(c[0], c[1], c[2], 1), k = Math.max(1, 190 / m); return c.map(q => Math.min(255, Math.round(q * k + 20))); };
const hash = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619); return ((x >>> 0) % 1000) / 1000; };
const fmt = n => Math.round(n).toLocaleString('en-US');
const fmtB = n => (n < 100 ? String(Math.round(n * 10) / 10) : fmt(n));
const BALL = el => Math.min(0.62, 0.2 + 0.36 * E[el].cov);
const INK = '#1f2a55', PENCIL = '#5a564e', FAINT = 'rgba(90,86,78,0.35)', REDINK = '#c8261c', GREEN = '#1c8a4a', HILITE = 'rgba(255,214,0,0.6)';
const SW = 64, SH = 44, IW = 2048, IH = 1408, U = IW / SW;
const C0 = { x: 0, z: 4.4 }, SPOT = [{ x: -19, z: 0.6 }, { x: -10.5, z: -5.8 }, { x: 0, z: -8.4 }, { x: 10.5, z: -5.8 }, { x: 19, z: 0.6 }, { x: -12.5, z: 11.2 }];
const LAB = [{ x: -20, z: -5.6 }, { x: -12, z: -11.8 }, { x: 0, z: -14.2 }, { x: 12, z: -11.8 }, { x: 20, z: -5.6 }, { x: -13, z: 7.4 }], FIN = 5;
const ROW = { x: -21.5, z: -18, dx: 11 }, GO = { x: 19, z: 11 }, STEP = { x: -24.5, z: 12.4 }, PAGES = { x: -24.5, z: 8.8 }, TOTAL = { x: 6.5, z: 13.4 }, PILE = { x: -1.5, z: 10 }, TURN = { x: 7.4, z: 7.6 };
const SC_MAIN = 1.1, SC_PROD = 0.86, SC_ROW = 0.42, SC_FIN = 0.6;

function start(app) {
  const cv = document.createElement('canvas'); app.append(cv);
  const ren = new T.WebGLRenderer({ canvas: cv, antialias: true });
  ren.setPixelRatio(Math.min(2, root.devicePixelRatio || 1)); ren.outputEncoding = T.sRGBEncoding;
  ren.shadowMap.enabled = true; ren.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene(); scene.background = lin('#e9e2d0');
  const cam = new T.PerspectiveCamera(34, 1, 0.5, 200), CAM = new T.Vector3(0, 46, 29.5), LOOKAT = new T.Vector3(0, 0, 0.6);
  const camDir = LOOKAT.clone().sub(CAM).normalize();
  scene.add(new T.HemisphereLight(0xfff6e6, 0xcabf9f, 0.8));
  const sun = new T.DirectionalLight(0xfff0d6, 0.85); sun.position.set(-16, 18, 4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.radius = 7;
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 22, bottom: -22, near: 1, far: 90 }); scene.add(sun); scene.add(sun.target);
  const maxAn = ren.capabilities.getMaxAnisotropy();
  const canvasTex = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = maxAn; return { c, x: c.getContext('2d'), t }; };
  const noise = (x, w, h, n, a, c) => { for (let i = 0; i < n; i++) { x.fillStyle = 'rgba(' + c + ',' + (Math.random() * a).toFixed(3) + ')'; x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } };
  const std = o => new T.MeshStandardMaterial(o);
  const add = (geo, mat, x, y, z, parent) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (parent || scene).add(m); return m; };

  // ---------- the page, and the layer of ink over it ----------
  const paper = canvasTex(2048, 1408);
  (() => { const x = paper.x, w = 2048, h = 1408, u = w / SW; x.fillStyle = '#f3eddc'; x.fillRect(0, 0, w, h); noise(x, w, h, 50000, 0.05, '120,100,60');
    x.strokeStyle = 'rgba(70,120,170,0.2)'; x.lineWidth = 1.4; for (let i = 0; i <= SW; i++) { x.beginPath(); x.moveTo(i * u, 0); x.lineTo(i * u, h); x.stroke(); } for (let j = 0; j <= SH; j++) { x.beginPath(); x.moveTo(0, j * u); x.lineTo(w, j * u); x.stroke(); }
    x.strokeStyle = 'rgba(200,60,50,0.45)'; x.lineWidth = 3; x.beginPath(); x.moveTo(5.5 * u, 0); x.lineTo(5.5 * u, h); x.stroke(); paper.t.needsUpdate = true; })();
  add(new T.PlaneGeometry(SW, SH).rotateX(-Math.PI / 2), std({ map: paper.t, roughness: 0.95 }), 0, 0, 0).castShadow = false;
  const ink = canvasTex(IW, IH);
  const inkMesh = add(new T.PlaneGeometry(SW, SH).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: ink.t, transparent: true, depthWrite: false }), 0, 0.02, 0); inkMesh.castShadow = false; inkMesh.receiveShadow = false;
  const veil = document.createElement('canvas'); veil.className = 'veil'; app.append(veil);

  // a pencil lying across the margin
  add(new T.CylinderGeometry(0.2, 0.2, 9, 6), std({ color: lin(0xf0b21c), roughness: 0.5 }), -28, 0.2, 2).rotation.set(Math.PI / 2, 0, 0.12);

  // ---------- ball and stick, drawn as the viewer draws it ----------
  const SPH = new T.SphereGeometry(1, 36, 24), CYL = new T.CylinderGeometry(1, 1, 1, 12), UP = new T.Vector3(0, 1, 0), mBall = {}, mStick = {}, mLetter = {};
  const ballMat = el => mBall[el] || (mBall[el] = std({ color: lin(E[el].color), roughness: 0.3, metalness: 0.08 }));
  const stickMat = el => mStick[el] || (mStick[el] = std({ color: lin(E[el].color), roughness: 0.35 }));
  function letterMat(el) {
    if (mLetter[el]) return mLetter[el];
    const hx = E[el].color, n = parseInt(hx.slice(1), 16), dark = ((n >> 16 & 255) * 0.299 + (n >> 8 & 255) * 0.587 + (n & 255) * 0.114) > 150, c = canvasTex(128, 128);
    c.x.font = 'bold 84px "Trebuchet MS", system-ui, sans-serif'; c.x.textAlign = 'center'; c.x.textBaseline = 'middle'; c.x.fillStyle = dark ? '#14202e' : '#ffffff'; c.x.fillText(el, 64, 68); c.t.needsUpdate = true;
    return (mLetter[el] = new T.SpriteMaterial({ map: c.t, depthWrite: false }));
  }
  let align = new T.Quaternion();
  // the long axis lies left to right, then the molecule is rolled until it lies as flat as it can
  function setAlign(model) {
    let best = 0; const v = new T.Vector3(1, 0, 0);
    model.atoms.forEach(a => model.atoms.forEach(b => { const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); if (d > best) { best = d; v.set(b.x - a.x, b.y - a.y, b.z - a.z); } }));
    if (v.x < 0) v.negate();
    const q = new T.Quaternion().setFromUnitVectors(v.normalize(), new T.Vector3(1, 0, 0)); let roll = 0, least = 1e9;
    for (let k = 0; k < 36; k++) {
      const r = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), k * Math.PI / 36).multiply(q); let lo = 1e9, hi = -1e9;
      model.atoms.forEach(a => { if (a.el === 'H') return; const y = new T.Vector3(a.x, a.y, a.z).applyQuaternion(r).y; lo = Math.min(lo, y); hi = Math.max(hi, y); });
      if (hi - lo < least) { least = hi - lo; roll = k; }
    }
    align = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), roll * Math.PI / 36).multiply(q);
  }
  function collar(grp, p, R, col) { const t = add(new T.TorusGeometry(R * 1.34, R * 0.15, 8, 32), std({ color: lin(col), roughness: 0.45 }), p.x, p.y, p.z, grp); t.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), camDir.clone().negate()); t.userData.own = true; return t; }
  function buildMol(model, rings) {
    const grp = new T.Group(), c = new T.Vector3(), at = new Map(); let low = 1e9;
    model.atoms.forEach(a => c.add(new T.Vector3(a.x, a.y, a.z))); c.divideScalar(model.atoms.length || 1);
    model.atoms.forEach(a => { const p = new T.Vector3(a.x, a.y, a.z).sub(c).applyQuaternion(align); at.set(a, p); low = Math.min(low, p.y - BALL(a.el)); });
    at.forEach(p => { p.y += 0.5 - low; });
    model.atoms.forEach(a => {
      const p = at.get(a), R = BALL(a.el);
      add(SPH, ballMat(a.el), p.x, p.y, p.z, grp).scale.setScalar(R);
      const sp = new T.Sprite(letterMat(a.el)); sp.position.copy(p).addScaledVector(camDir, -R * 1.04); sp.scale.setScalar(R * 1.25); grp.add(sp);
      if (rings && rings.has(a) && a.el !== 'H') collar(grp, p, R, rings.get(a));
    });
    model.bonds.forEach(b => {
      const A = at.get(b.a), B = at.get(b.b); if (!A || !B) return;
      const u = B.clone().sub(A), len = u.length(); if (len < 1e-4) return; u.divideScalar(len);
      const q = new T.Quaternion().setFromUnitVectors(UP, u), perp = new T.Vector3().crossVectors(u, camDir).normalize(), mid = A.clone().add(B).multiplyScalar(0.5);
      const offs = b.order === 1 ? [0] : [-0.5, 0.5], r = b.order > 1 ? 0.06 : 0.09;
      offs.forEach(f => [[A, mid, b.a], [mid, B, b.b]].forEach(h => { const m = add(CYL, stickMat(h[2].el), 0, 0, 0, grp); m.position.copy(h[0]).add(h[1]).multiplyScalar(0.5).addScaledVector(perp, f * 0.17); m.quaternion.copy(q); m.scale.set(r, h[0].distanceTo(h[1]), r); }));
    });
    scene.add(grp);
    return { group: grp, at, model, hover: [] };
  }
  function freeMol(m) { if (!m) return; scene.remove(m.group); m.group.traverse(o => { if (o.userData.own && o.geometry) { o.geometry.dispose(); o.material.dispose(); } }); }
  const place = (m, p, sc) => { m.group.position.set(p.x, 0, p.z); m.group.scale.setScalar(sc); };

  // ---------- state ----------
  const MADE = { x: 0.5, z: 13 }, MULT = { x: -9.5, z: 8.6 }, CALL = { x: 0, z: -2.4 };
  const st = { mode: 'play', feed: 0, hover: -1, quota: 0, shown: 0, pass: false, tok: 0, shake: 0, flash: 0, flashC: '28,138,74', pageStart: 0, floats: [], blots: [], call: null, multBump: 0, over: 0, turned: 0 };
  let g = null, slots = [], center = null, prods = [], rowMols = [], tweens = [], dirty = true, last = performance.now(), lastInk = 0;
  const rowAt = k => ({ x: ROW.x + k * ROW.dx, z: ROW.z });
  const tween = (m, to, sc, dur, done) => tweens.push({ m, fx: m.group.position.x, fz: m.group.position.z, fs: m.group.scale.x, to, sc, t: 0, dur, done });
  const colOf = id => bright(RX.CARDS[id].rgb);
  const callout = (text, sub, col) => { st.call = { text, sub: sub || '', col: col || INK, t: performance.now() }; };

  // what stands on the page: one slot for each reagent on offer, and on the last page one for the finishing reagent
  function refresh() {
    prods.forEach(freeMol); prods = []; slots = [];
    const live = st.mode === 'play' && !g.over, o = live ? P.options(g) : {};
    g.kinds.forEach((id, i) => { slots[i] = { id, o: o[id] || null }; });
    const fin = live && g.pageSteps < P.DIAL.steps ? P.finishOpt(g) : null; slots[FIN] = fin ? { id: fin.id, o: fin, fin: true } : null;
    slots.forEach((s, i) => {
      if (!s || !s.o) return;
      s.o.model.settle(160);
      const rings = new Map(), c = rgb(colOf(s.id)); s.o.r.made.forEach(a => rings.set(a, c));
      const m = buildMol(s.o.model, rings); place(m, SPOT[i], 0.01); tween(m, SPOT[i], i === FIN ? SC_FIN : SC_PROD, 0.16 + i * 0.03); prods[i] = m;
    });
    st.hover = -1; setHover(-1); dirty = true;
  }
  function load(i) {
    st.feed = (i + P.FEEDS.length) % P.FEEDS.length; st.tok++; st.mode = 'play'; st.shown = 0; st.pass = false; st.pageStart = 0; st.floats = []; st.blots = []; st.call = null; st.over = 0; tweens = [];
    freeMol(center); rowMols.forEach(freeMol); rowMols = [];
    g = P.synBegin(P.FEEDS[st.feed], true); st.quota = P.synQuota(P.FEEDS[st.feed], 30);
    setAlign(g.m); center = buildMol(g.m, null); place(center, C0, 0.01); tween(center, C0, SC_MAIN, 0.3);
    refresh(); sfx.feed();
  }
  function setHover(i) {
    if (center) { center.hover.forEach(t => { center.group.remove(t); t.geometry.dispose(); t.material.dispose(); }); center.hover = []; }
    st.hover = i; const s = i >= 0 ? slots[i] : null, o = s && s.o;
    if (o && center && st.mode === 'play') { const col = rgb(colOf(s.id)); o.atoms.forEach(a => { const p = center.at.get(a); if (p && a.el !== 'H') center.hover.push(collar(center.group, p, BALL(a.el), col)); }); }
    dirty = true;
  }
  function endRound() {
    st.mode = 'done'; st.pass = g.total >= st.quota;
    if (st.pass) { sfx.fanfare(); st.shake = 1.2; st.flash = 1; st.flashC = '28,138,74'; } else { sfx.bad(); st.shake = 0.5; st.flash = 0.8; st.flashC = '200,38,28'; }
    refresh();
  }
  function nextPage() {
    if (!P.turn(g)) { P.synEnd(g); return endRound(); }
    rowMols.forEach(freeMol); rowMols = []; st.pageStart = g.trail.length; st.turned = performance.now(); sfx.feed(); refresh();
  }
  // everything the player sees and hears when a reaction lands
  function land(o, before, wasOpen) {
    const now = performance.now(), gain = P.made(g) - before, t = g.trail[g.trail.length - 1], route = t.ev.find(e => e.src === 'route'), len = g.cur.path.length, size = Math.log10(Math.max(10, gain));
    st.floats.push({ txt: '+' + fmt(gain), t: now, size: 70 + 26 * size, dx: (Math.random() - 0.5) * 3 });
    for (let k = 0; k < 8 + 5 * o.r.hits; k++) { const a = Math.random() * 6.28, d = 2 + Math.random() * (4 + size); st.blots.push({ x: C0.x + Math.cos(a) * d * 1.5, z: C0.z + Math.sin(a) * d * 0.8, r: 4 + Math.random() * (6 + 3 * size), t: now, col: rgb(colOf(o.id)) }); }
    st.shake = Math.max(st.shake, 0.25 + 0.22 * size); st.multBump = 1;
    sfx.bond(); sfx.lock(Math.min(12, len + g.trail.length));
    if (route) { callout(AA.rxRun.ROUTE[route.route].name, 'times ' + fmtB(route.val), '#8a6a00'); sfx.good(); st.shake = Math.max(st.shake, 1); }
    else if (o.finish) { callout('finished', 'times ' + fmtB(1 + P.SYN.finishMult * o.r.hits), GREEN); sfx.good(); }
    else if (t.cont && len >= 3) callout('run of ' + len, '', INK);
    else if (wasOpen && !t.cont) callout('run closed', '', PENCIL);
    // passing the number to beat, and each doubling past it
    const m = P.made(g), times = Math.floor(m / st.quota);
    if (times >= 1 && st.over === 0) { st.over = 1; st.flash = 1; st.flashC = '28,138,74'; st.shake = 1.4; sfx.quota(); callout(fmt(st.quota) + ' beaten', '', GREEN); }
    else if (times >= 2 && times >= st.over * 2) { st.over = times; st.flash = 0.8; st.flashC = '255,214,0'; st.shake = 1.4; sfx.over(); callout(times + ' times over', '', '#8a6a00'); }
  }
  function pick(i) {
    const s = slots[i], o = s && s.o, chosen = prods[i];
    if (!o || !chosen || st.mode !== 'play') return;
    setHover(-1); st.mode = 'move';
    const prev = center, k = g.pageSteps, tok = st.tok, before = P.made(g), wasOpen = g.cur.path.length > 0;
    if (s.fin) P.synFinish(g, o); else P.synTake(g, o);
    land(o, before, wasOpen);
    prods.forEach((m, j) => { if (m && j !== i) tween(m, { x: m.group.position.x, z: m.group.position.z }, 0.01, 0.12, () => freeMol(m)); }); prods = [];
    tween(prev, rowAt(Math.min(k, 3)), SC_ROW, 0.26); rowMols.push(prev); tween(chosen, C0, SC_MAIN, 0.26);
    // the rules move on by the clock, not by the drawing, so a stalled frame cannot leave the page stuck
    setTimeout(() => {
      if (tok !== st.tok) return;
      tweens = tweens.filter(tw => tw.m !== chosen && tw.m !== prev); place(chosen, C0, SC_MAIN); place(prev, rowAt(Math.min(k, 3)), SC_ROW);
      center = chosen; st.mode = 'play';
      if (g.over) return endRound();
      refresh();
      // a page with nothing left to do turns itself
      if (!slots.some(q => q && q.o)) { st.mode = 'move'; setTimeout(() => { if (tok !== st.tok) return; st.mode = 'play'; nextPage(); }, 520); }
    }, 290);
    dirty = true;
  }
  const next = () => { if (st.mode === 'done') load(st.pass ? st.feed + 1 : st.feed); };

  // ---------- ink ----------
  const px = p => [(p.x + SW / 2) * U, (p.z + SH / 2) * U];
  const hand = (x, n) => { x.font = Math.round(n) + 'px Hand, "Segoe Print", sans-serif'; };
  const marker = (x, n) => { x.font = Math.round(n) + 'px Marker, "Segoe Print", sans-serif'; };
  function wob(x, a, b, lw, col, dash) {
    const A = px(a), B = px(b), n = 14; x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.setLineDash(dash || []); x.beginPath();
    for (let k = 0; k <= n; k++) { const t = k / n, j = Math.sin(t * 11 + A[0] * 0.013) * 2.2; const X = A[0] + (B[0] - A[0]) * t + j, Y = A[1] + (B[1] - A[1]) * t + j * 0.6; if (k) x.lineTo(X, Y); else x.moveTo(X, Y); }
    x.stroke(); x.setLineDash([]);
  }
  function arrow(x, a, b, lw, col, dash) {
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, hd = Math.min(1.0, d * 0.3);
    wob(x, a, b, lw, col, dash);
    wob(x, { x: b.x - ux * hd - uz * hd * 0.55, z: b.z - uz * hd + ux * hd * 0.55 }, b, lw, col); wob(x, { x: b.x - ux * hd + uz * hd * 0.55, z: b.z - uz * hd - ux * hd * 0.55 }, b, lw, col);
  }
  const ring = (x, c, rx, ry, lw, col, rot) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.ellipse(c[0], c[1], rx, ry, rot || 0.15, 0.3, 6.6); x.stroke(); };
  const swipe = (x, a, b, w, col) => { x.strokeStyle = col || HILITE; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); };
  function ends(i) { const p = SPOT[i], dx = p.x - C0.x, dz = p.z - C0.z, d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, far = i === FIN ? 3.4 : 4.9; return { a: { x: C0.x + ux * 6.2, z: C0.z + uz * 3.2 }, b: { x: p.x - ux * far, z: p.z - uz * (far - 0.5) } }; }
  function drawInk(now) {
    const x = ink.x, play = st.mode === 'play', open = g.cur.path.length > 0; x.clearRect(0, 0, IW, IH); x.textBaseline = 'alphabetic';
    // ink thrown off by the last reaction
    st.blots = st.blots.filter(b => now - b.t < 700); st.blots.forEach(b => { const k = (now - b.t) / 700, c = px(b); x.globalAlpha = 0.5 * (1 - k); x.fillStyle = b.col; x.beginPath(); x.arc(c[0], c[1], b.r * (0.6 + k), 0, 7); x.fill(); }); x.globalAlpha = 1;
    // the arrows out of the molecule, and what each one does. Yellow marks the ones that continue the run
    if (play) slots.forEach((s, i) => {
      if (!s) return;
      const o = s.o, hov = st.hover === i, card = RX.CARDS[s.id], verb = card.verb.toLowerCase(), m = px(LAB[i]), e = ends(i), col = o ? INK : FAINT;
      if (o) { if (o.cont && open) swipe(x, px(e.a), px(e.b), 26); arrow(x, e.a, e.b, hov ? 9 : 6, col, o.loop ? [14, 12] : null); }
      x.save(); x.translate(m[0], m[1]); x.rotate((hash(s.id) - 0.5) * 0.07);
      hand(x, 54); x.textAlign = 'center'; const tw = x.measureText(verb).width;
      if (o) { x.strokeStyle = rgb(colOf(s.id)); x.globalAlpha = hov ? 0.85 : 0.55; x.lineWidth = hov ? 22 : 15; x.lineCap = 'round'; x.beginPath(); x.moveTo(-26 - tw / 2, 14); x.lineTo(-26 + tw / 2, 10); x.stroke(); x.globalAlpha = 1; }
      x.fillStyle = col; x.fillText(verb, -26, 0);
      hand(x, 38); x.fillStyle = 'rgba(90,86,78,0.7)'; x.fillText(String(i + 1), -26 - tw / 2 - 24, -2);
      if (o) { hand(x, 52); x.fillStyle = col; x.fillText(String(o.r.hits), tw / 2 + 18, -2); ring(x, [tw / 2 + 19, -18], 27, 25, 4, col); if (s.fin) { hand(x, 34); x.fillStyle = PENCIL; x.fillText('last step', -26, 44); } }
      if (!s.fin) { x.strokeStyle = o ? PENCIL : FAINT; x.lineWidth = 4; for (let k = 0; k < (g.left[s.id] || 0); k++) { x.beginPath(); x.moveTo(-26 - tw / 2 + k * 13, 32); x.lineTo(-22 - tw / 2 + k * 13, 54); x.stroke(); } }
      x.restore();
    });
    // this page's reactions, along the top
    g.trail.slice(st.pageStart).forEach((t, k) => {
      const a = rowAt(k), c = RX.CARDS[t.id], A = { x: a.x + 3.3, z: a.z }, B = { x: a.x + ROW.dx - 3.5, z: a.z };
      if (t.cont) swipe(x, px(A), px(B), 24);
      arrow(x, A, B, 5, INK);
      const m = px({ x: (A.x + B.x) / 2, z: a.z }); hand(x, 48); x.textAlign = 'center'; x.fillStyle = INK; x.fillText(c.verb.toLowerCase(), m[0], m[1] - 16);
      swipe(x, [m[0] - 50, m[1] - 8], [m[0] + 50, m[1] - 10], 9, rgb(colOf(t.id)));
    });
    // the multiplier of the run that is open
    if (st.mode !== 'done') {
      const mp = px(MULT), len = g.cur.path.length, b = g.cur.batch, k = 1 + 0.35 * st.multBump, hot = len >= 2;
      if (hot) swipe(x, [mp[0] - 120, mp[1] - 22], [mp[0] + 120, mp[1] - 30], 70 * k);
      marker(x, (hot ? 78 : 54) * k); x.textAlign = 'center'; x.fillStyle = hot ? INK : FAINT; x.fillText('times ' + fmtB(b), mp[0], mp[1]);
      if (hot) { hand(x, 38); x.fillStyle = PENCIL; x.fillText(len + ' in a row', mp[0], mp[1] + 44); }
    }
    // pages, and a circle for each reaction on this one
    for (let k = 1; k <= P.SYN.pages; k++) { const c = px({ x: PAGES.x + (k - 1) * 2.2, z: PAGES.z }); hand(x, 46); x.textAlign = 'center'; x.fillStyle = k === g.page ? INK : k < g.page ? PENCIL : FAINT; x.fillText(String(k), c[0], c[1] + 14); if (k === g.page) ring(x, [c[0], c[1]], 28, 26, 4, INK); }
    for (let k = 0; k < P.DIAL.steps; k++) { const c = px({ x: STEP.x + k * 2.5, z: STEP.z }); ring(x, c, 30, 27, 5, INK, 0.1 * k); if (k < g.pageSteps) { x.strokeStyle = INK; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(c[0] - 16, c[1] - 2); x.lineTo(c[0] - 4, c[1] + 14); x.lineTo(c[0] + 24, c[1] - 26); x.stroke(); } }
    // how much has been made, and the number to beat
    const q = px(MADE), beaten = st.shown >= st.quota, done = st.mode === 'done';
    marker(x, 110); x.textAlign = 'right'; x.fillStyle = beaten ? GREEN : done ? REDINK : INK; x.fillText(fmt(st.shown), q[0], q[1]);
    hand(x, 38); x.fillStyle = PENCIL; x.fillText('made', q[0], q[1] - 96);
    hand(x, 60); x.textAlign = 'left'; x.fillStyle = REDINK; x.fillText(fmt(st.quota), q[0] + 60, q[1]); hand(x, 38); x.fillStyle = PENCIL; x.fillText('to beat', q[0] + 60, q[1] - 62);
    if (beaten) { x.strokeStyle = GREEN; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(q[0] + 16, q[1] - 30); x.lineTo(q[0] + 30, q[1] - 8); x.lineTo(q[0] + 52, q[1] - 62); x.stroke(); }
    // numbers rising off the molecule
    st.floats = st.floats.filter(f => now - f.t < 950); st.floats.forEach(f => { const k = (now - f.t) / 950, c = px({ x: C0.x + f.dx, z: C0.z - 2.5 - 5 * (1 - Math.pow(1 - k, 2)) }), pop = k < 0.12 ? 0.6 + k / 0.12 * 0.6 : 1.2 - Math.min(0.2, (k - 0.12)); x.globalAlpha = 1 - k * k; marker(x, f.size * pop); x.textAlign = 'center'; x.lineWidth = 12; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(f.txt, c[0], c[1]); x.fillStyle = '#8a6a00'; x.fillText(f.txt, c[0], c[1]); }); x.globalAlpha = 1;
    // a line lettered across the page when something worth naming happens
    if (st.call && now - st.call.t < 1400) {
      const k = (now - st.call.t) / 1400, c = px(CALL), pop = k < 0.1 ? 1.5 - 5 * k : 1, al = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
      x.save(); x.translate(c[0], c[1]); x.rotate(-0.05); x.scale(pop, pop); x.globalAlpha = al; marker(x, 120); x.textAlign = 'center'; const tw = x.measureText(st.call.text).width;
      swipe(x, [-tw / 2 - 20, -34], [tw / 2 + 20, -44], 110);
      x.lineWidth = 14; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(st.call.text, 0, 0); x.fillStyle = st.call.col; x.fillText(st.call.text, 0, 0);
      if (st.call.sub) { marker(x, 64); x.fillStyle = REDINK; x.strokeText(st.call.sub, 0, 80); x.fillText(st.call.sub, 0, 80); }
      x.restore(); x.globalAlpha = 1;
    } else if (st.call) st.call = null;
    // the round is over: how it went, and where to click
    if (done) {
      const c = px({ x: 0, z: -3 }), ratio = g.total / st.quota;
      marker(x, 130); x.textAlign = 'center'; x.lineWidth = 16; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.fillStyle = st.pass ? GREEN : REDINK;
      const txt = st.pass ? (ratio >= 2 ? fmtB(Math.floor(ratio * 10) / 10) + ' times over' : 'beaten') : fmt(st.quota - g.total) + ' short';
      x.strokeText(txt, c[0], c[1]); x.fillText(txt, c[0], c[1]);
      hand(x, 50); x.fillStyle = PENCIL; x.fillText('longest run ' + g.best + '      click for the next round', c[0], c[1] + 80);
    }
    ink.t.needsUpdate = true;
  }

  // ---------- pointer and keys ----------
  const ray = new T.Raycaster(), ndc = new T.Vector2(), ground = new T.Plane(new T.Vector3(0, 1, 0), 0), hit = new T.Vector3();
  function slotAt(e) {
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(ground, hit) || st.mode !== 'play') return -1;
    let slot = -1; slots.forEach((s, i) => { if (!s || !s.o) return; const p = SPOT[i], l = LAB[i], rw = i === FIN ? 4.4 : 5.6; if ((Math.abs(hit.x - p.x) < rw && Math.abs(hit.z - p.z) < 3.6) || (Math.abs(hit.x - l.x) < 5 && Math.abs(hit.z - (l.z - 0.6)) < 1.8)) slot = i; });
    return slot;
  }
  cv.addEventListener('pointermove', e => { const s = slotAt(e); if (s !== st.hover) setHover(s); cv.style.cursor = s >= 0 || st.mode === 'done' ? 'pointer' : ''; });
  cv.addEventListener('pointerleave', () => setHover(-1));
  cv.addEventListener('click', e => { if (st.mode === 'done') return next(); const s = slotAt(e); if (s >= 0) pick(s); });
  root.addEventListener('keydown', e => {
    if (e.key >= '1' && e.key <= '6') pick(+e.key - 1);
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); }
    else if (e.key === 'r' || e.key === 'R') load(st.feed);
    else if (e.key === 'n' || e.key === 'N') load(st.feed + 1);
  });

  function size() {
    const w = app.clientWidth, h = app.clientHeight; if (!w || !h) return; ren.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h > 1.6 ? 34 : 34 * 1.6 / (w / h) * 0.86; cam.updateProjectionMatrix();
    veil.width = w; veil.height = h; const x = veil.getContext('2d'), gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,236,190,0.16)'); gr.addColorStop(1, 'rgba(60,50,90,0.14)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); noise(x, w, h, w * h / 30, 0.05, '80,60,30');
  }
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000), ended = []; last = now;
    tweens = tweens.filter(tw => {
      tw.t += dt; const k = Math.min(1, tw.t / tw.dur), e = 1 - Math.pow(1 - k, 3);
      tw.m.group.position.set(tw.fx + (tw.to.x - tw.fx) * e, Math.sin(k * Math.PI) * 1.4 * (tw.dur > 0.2 ? 1 : 0), tw.fz + (tw.to.z - tw.fz) * e); tw.m.group.scale.setScalar(tw.fs + (tw.sc - tw.fs) * e);
      if (k >= 1) { if (tw.done) ended.push(tw.done); return false; } return true;
    });
    ended.forEach(f => f());
    prods.forEach((m, i) => { if (!m || tweens.some(tw => tw.m === m)) return; const want = st.hover === i ? 0.7 : 0; m.group.position.y += (want - m.group.position.y) * Math.min(1, dt * 14); });
    const target = g ? P.made(g) : 0;
    if (st.shown !== target) { const d = target - st.shown; st.shown = Math.abs(d) < 2 ? target : st.shown + d * Math.min(1, dt * 10); dirty = true; }
    if (st.multBump > 0) { st.multBump = Math.max(0, st.multBump - dt * 3.5); dirty = true; }
    if (st.floats.length || st.blots.length || st.call) dirty = true;
    st.shake *= Math.pow(0.002, dt); const sh = st.shake > 0.02 ? st.shake : 0;
    cam.position.set(CAM.x + (Math.random() - 0.5) * sh * 0.6, CAM.y, CAM.z + (Math.random() - 0.5) * sh * 0.6); cam.lookAt(LOOKAT);
    if (st.flash > 0) { st.flash = Math.max(0, st.flash - dt * 2.2); veil.style.backgroundColor = 'rgba(' + st.flashC + ',' + (st.flash * 0.3).toFixed(3) + ')'; } else if (veil.style.backgroundColor) veil.style.backgroundColor = '';
    if (dirty && now - lastInk > 24) { drawInk(now); dirty = false; lastInk = now; }
    ren.render(scene, cam);
  }
  root.addEventListener('resize', size);
  AA.rxScheme = { st, load, pick, next, setHover,
    state: () => ({ mode: st.mode, page: g.page, steps: g.pageSteps, offer: g.kinds.slice(), usable: slots.map((s, i) => (s && s.o ? i : -1)).filter(i => i >= 0), conts: slots.map((s, i) => (s && s.o && s.o.cont && g.cur.path.length > 0 ? i : -1)).filter(i => i >= 0), made: P.made(g), times: g.cur.batch, row: g.cur.path.length, best: g.best, quota: st.quota, pass: st.pass, call: st.call && st.call.text }) };
  size(); load(0); requestAnimationFrame(frame);
}
const el = root.document && document.getElementById('schemeapp');
if (el) { const boot = () => start(el); if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('40px Marker'), document.fonts.load('40px Hand')]).then(boot, boot); else boot(); }
})(window);
