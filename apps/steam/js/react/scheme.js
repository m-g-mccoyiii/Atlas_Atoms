// One synthesis, played on pages of a lab notebook. The molecule stands in the middle of the page with an inked
// arrow to each molecule it can become. Clicking a product reacts. The product of one page is the starting molecule
// of the next. Everything scored and not yet stamped is at risk, and it rides on the chain: stamp to bank it, or
// turn the page and carry it on. Every reading is ink or pencil on the page.
// Rules come from path.js. This file draws and takes input only.
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

  // the stamp and its pad, and a pencil
  const stamp = new T.Group(); scene.add(stamp); stamp.position.set(GO.x, 0, GO.z);
  add(new T.CylinderGeometry(2.5, 2.6, 0.5, 40), std({ color: lin(0x7b1f18), roughness: 0.7 }), GO.x, 0.25, GO.z);
  add(new T.CylinderGeometry(1.6, 1.6, 0.5, 36), std({ color: lin(0x1d1b1a), roughness: 0.6 }), 0, 0.75, 0, stamp);
  add(new T.CylinderGeometry(0.6, 0.95, 2.0, 28), std({ color: lin(0xb07a44), roughness: 0.5 }), 0, 2.0, 0, stamp);
  add(new T.SphereGeometry(0.9, 28, 20), std({ color: lin(0xb07a44), roughness: 0.5 }), 0, 3.2, 0, stamp);
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
  const st = { mode: 'play', feed: 0, hover: -1, quota: 0, shown: 0, pass: false, tok: 0, shake: 0, press: 0, flashRed: 0, pageStart: 0, outs: 0, lost: null, pileBump: 0 };
  let g = null, slots = [], center = null, prods = [], rowMols = [], tweens = [], dirty = true, last = performance.now(), lastInk = 0;
  const rowAt = k => ({ x: ROW.x + k * ROW.dx, z: ROW.z });
  const tween = (m, to, sc, dur, done) => tweens.push({ m, fx: m.group.position.x, fz: m.group.position.z, fs: m.group.scale.x, to, sc, t: 0, dur, done });
  const colOf = id => bright(RX.CARDS[id].rgb);
  const canStamp = () => st.mode === 'play' && P.held(g) > 0 && !g.locked;
  const canTurn = () => st.mode === 'play' && (g.pageSteps > 0 || !slots.some(s => s && s.o));
  const loseShow = n => { if (!n) return; st.lost = { n, t: performance.now() }; st.flashRed = 1; st.shake = 1; sfx.bad(); };

  // what stands on the page: one slot for each reagent on offer, and on the last page one for the finishing reagent
  function refresh() {
    prods.forEach(freeMol); prods = []; slots = [];
    const live = st.mode === 'play' && !g.over, o = live ? P.options(g) : {};
    g.kinds.forEach((id, i) => { slots[i] = { id, o: o[id] || null, brk: !!o[id] && P.breaks(g, o[id]) }; });
    const fin = live ? P.finishOpt(g) : null; slots[FIN] = fin ? { id: fin.id, o: fin, brk: false, fin: true } : null;
    slots.forEach((s, i) => {
      if (!s || !s.o) return;
      s.o.model.settle(160);
      const rings = new Map(), c = rgb(colOf(s.id)); s.o.r.made.forEach(a => rings.set(a, c));
      const m = buildMol(s.o.model, rings); place(m, SPOT[i], 0.01); tween(m, SPOT[i], i === FIN ? SC_FIN : SC_PROD, 0.2 + i * 0.04); prods[i] = m;
    });
    st.outs = live ? P.outs(g) : 0; st.hover = -1; setHover(-1); dirty = true;
  }
  function load(i) {
    st.feed = (i + P.FEEDS.length) % P.FEEDS.length; st.tok++; st.mode = 'play'; st.shown = 0; st.pass = false; st.pageStart = 0; st.lost = null; tweens = [];
    freeMol(center); rowMols.forEach(freeMol); rowMols = [];
    g = P.synBegin(P.FEEDS[st.feed], true); st.quota = P.synQuota(P.FEEDS[st.feed], 30);
    setAlign(g.m); center = buildMol(g.m, null); place(center, C0, 0.01); tween(center, C0, SC_MAIN, 0.3);
    refresh(); sfx.feed();
  }
  function setHover(i) {
    if (center) { center.hover.forEach(t => { center.group.remove(t); t.geometry.dispose(); t.material.dispose(); }); center.hover = []; }
    st.hover = i; const s = i >= 0 ? slots[i] : null, o = s && s.o;
    if (o && center && st.mode === 'play') { const col = s.brk ? REDINK : rgb(colOf(s.id)); o.atoms.forEach(a => { const p = center.at.get(a); if (p && a.el !== 'H') center.hover.push(collar(center.group, p, BALL(a.el), col)); }); }
    dirty = true;
  }
  function endSynthesis() { st.mode = 'done'; st.pass = g.total >= st.quota; st.press = 1; if (st.pass) { sfx.fanfare(); st.shake = 1; } else { sfx.stamp(); st.shake = 0.5; } refresh(); }
  function pick(i) {
    const s = slots[i], o = s && s.o, chosen = prods[i];
    if (!o || !chosen || st.mode !== 'play') return;
    setHover(-1); st.mode = 'move';
    const prev = center, k = g.pageSteps, tok = st.tok;
    if (s.fin) P.synFinish(g, o); else loseShow(P.synTake(g, o));
    prods.forEach((m, j) => { if (m && j !== i) tween(m, { x: m.group.position.x, z: m.group.position.z }, 0.01, 0.16, () => freeMol(m)); }); prods = [];
    tween(prev, rowAt(Math.min(k, 3)), SC_ROW, 0.34); rowMols.push(prev);
    tween(chosen, C0, SC_MAIN, 0.34);
    // the rules move on by the clock, not by the drawing, so a stalled frame cannot leave the page stuck
    setTimeout(() => {
      if (tok !== st.tok) return;
      tweens = tweens.filter(tw => tw.m !== chosen && tw.m !== prev); place(chosen, C0, SC_MAIN); place(prev, rowAt(Math.min(k, 3)), SC_ROW);
      center = chosen; st.mode = 'play';
      if (g.over) return endSynthesis();
      refresh();
      // the last page ends itself when nothing is left to do on it
      if (g.page >= P.SYN.pages && !slots.some(q => q && q.o)) { P.synEnd(g); setTimeout(() => { if (tok === st.tok) endSynthesis(); }, 500); }
    }, 360);
    sfx.bond(); sfx.lock(Math.min(12, g.cur.path.length)); st.shake = Math.max(st.shake, 0.25 + 0.12 * o.r.hits); st.pileBump = 1; dirty = true;
  }
  function doStamp() {
    if (st.mode === 'done') return load(st.pass ? st.feed + 1 : st.feed);
    if (!canStamp()) { if (st.mode === 'play') sfx.bad(); return; }
    P.bank(g); st.press = 1; sfx.stamp(); st.shake = Math.max(st.shake, 0.5); refresh();
  }
  function doTurn() {
    if (!canTurn()) { if (st.mode === 'play') sfx.bad(); return; }
    if (g.page >= P.SYN.pages) { P.synEnd(g); return endSynthesis(); }
    const lost = P.turn(g); rowMols.forEach(freeMol); rowMols = []; st.pageStart = g.trail.length;
    sfx.feed(); loseShow(lost); refresh();
  }

  // ---------- ink ----------
  const px = p => [(p.x + SW / 2) * U, (p.z + SH / 2) * U];
  const hand = (x, n) => { x.font = Math.round(n) + 'px Hand, "Segoe Print", sans-serif'; };
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
  const swipe = (x, a, b, w) => { x.strokeStyle = HILITE; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); };
  function ends(i) { const p = SPOT[i], dx = p.x - C0.x, dz = p.z - C0.z, d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, far = i === FIN ? 3.4 : 4.9; return { a: { x: C0.x + ux * 6.2, z: C0.z + uz * 3.2 }, b: { x: p.x - ux * far, z: p.z - uz * (far - 0.5) } }; }
  function drawInk(now) {
    const x = ink.x, play = st.mode === 'play', pile = P.held(g); x.clearRect(0, 0, IW, IH); x.textBaseline = 'alphabetic';
    // the arrows out of the molecule, and what each one does
    if (play) slots.forEach((s, i) => {
      if (!s) return;
      const o = s.o, hov = st.hover === i, card = RX.CARDS[s.id], verb = card.verb.toLowerCase(), m = px(LAB[i]), e = ends(i);
      const col = !o ? FAINT : s.brk ? REDINK : INK;
      if (o) { if (o.cont && !s.fin) swipe(x, px(e.a), px(e.b), 26); arrow(x, e.a, e.b, hov ? 9 : 6, col, o.loop ? [14, 12] : null); }
      x.save(); x.translate(m[0], m[1]); x.rotate((hash(s.id) - 0.5) * 0.07);
      hand(x, 54); x.textAlign = 'center'; const tw = x.measureText(verb).width;
      if (o) { x.strokeStyle = rgb(colOf(s.id)); x.globalAlpha = hov ? 0.85 : 0.55; x.lineWidth = hov ? 22 : 15; x.lineCap = 'round'; x.beginPath(); x.moveTo(-26 - tw / 2, 14); x.lineTo(-26 + tw / 2, 10); x.stroke(); x.globalAlpha = 1; }
      x.fillStyle = col; x.fillText(verb, -26, 0);
      hand(x, 38); x.fillStyle = 'rgba(90,86,78,0.7)'; x.fillText(String(i + 1), -26 - tw / 2 - 24, -2);
      if (o) { hand(x, 52); x.fillStyle = col; x.fillText(String(o.r.hits), tw / 2 + 18, -2); ring(x, [tw / 2 + 19, -18], 27, 25, 4, col);
        if (s.brk) { x.strokeStyle = REDINK; x.lineWidth = 8; x.lineCap = 'round'; x.beginPath(); x.moveTo(-26 - tw / 2, 6); x.lineTo(-26 + tw / 2, -38); x.stroke(); }
        if (s.fin) { hand(x, 36); x.fillStyle = PENCIL; x.fillText('finish', -26, 46); } }
      // a pencil stroke for each bottle of it left for this page
      if (!s.fin) { x.strokeStyle = o ? PENCIL : FAINT; x.lineWidth = 4; for (let k = 0; k < (g.left[s.id] || 0); k++) { x.beginPath(); x.moveTo(-26 - tw / 2 + k * 13, 32); x.lineTo(-22 - tw / 2 + k * 13, 54); x.stroke(); } }
      x.restore();
    });
    // this page's steps, along the top, each with what it scored
    g.trail.slice(st.pageStart).forEach((t, k) => {
      const a = rowAt(k), c = RX.CARDS[t.id], A = { x: a.x + 3.3, z: a.z }, B = { x: a.x + ROW.dx - 3.5, z: a.z };
      if (t.cont) swipe(x, px(A), px(B), 24);
      arrow(x, A, B, 5, INK);
      const m = px({ x: (A.x + B.x) / 2, z: a.z }); hand(x, 48); x.textAlign = 'center'; x.fillStyle = INK; x.fillText(c.verb.toLowerCase(), m[0], m[1] - 16);
      x.strokeStyle = rgb(colOf(t.id)); x.globalAlpha = 0.6; x.lineWidth = 9; x.beginPath(); x.moveTo(m[0] - 50, m[1] - 8); x.lineTo(m[0] + 50, m[1] - 10); x.stroke(); x.globalAlpha = 1;
      t.ev.filter(e => e.kind !== 'grade' && e.kind !== 'catch').forEach((e, j) => { const big = e.kind === 'x'; hand(x, 34); x.fillStyle = big ? REDINK : e.kind === 'y' ? '#8a6a00' : PENCIL; x.fillText((big ? 'times ' : '+') + fmtB(e.val), m[0] - 95 + (j % 3) * 95, m[1] + 36 + Math.floor(j / 3) * 34); });
    });
    // the pile: what is scored and not yet stamped, and the chain it rides on
    const pp = px(PILE), len = g.cur.path.length, bump = 1 + 0.25 * st.pileBump;
    if (st.mode !== 'done') {
      hand(x, 40); x.textAlign = 'right'; x.fillStyle = PENCIL; x.fillText('at risk', pp[0] - 96, pp[1]);
      hand(x, 84 * bump); x.textAlign = 'center'; x.fillStyle = pile ? INK : FAINT; x.fillText(fmt(pile), pp[0], pp[1] + 6);
      if (len >= 2) { const cx = pp[0] + 10; pp[1] += 0; const cy = pp[1] + 62; swipe(x, [cx - 70, cy - 14], [cx + 70, cy - 18], 38); hand(x, 44); x.fillStyle = INK; x.fillText('chain ' + len, cx, cy); } if (false) { const cx = 0; swipe(x, [cx - 70, pp[1] - 14], [cx + 70, pp[1] - 18], 40); hand(x, 46); x.fillStyle = INK; x.fillText('chain ' + len, cx, pp[1]); }
      if (g.locked) { hand(x, 36); x.textAlign = 'right'; x.fillStyle = REDINK; x.fillText('carried over', pp[0] - 96, pp[1] + 40); x.textAlign = 'center'; }
    }
    if (st.lost && now - st.lost.t < 1800) { const lp = px({ x: PILE.x, z: PILE.z - 2.6 }), txt = 'lost ' + fmt(st.lost.n); hand(x, 70); x.textAlign = 'center'; x.fillStyle = REDINK; x.fillText(txt, lp[0], lp[1]); const tw = x.measureText(txt).width; x.strokeStyle = REDINK; x.lineWidth = 7; x.beginPath(); x.moveTo(lp[0] - tw / 2 - 8, lp[1] - 20); x.lineTo(lp[0] + tw / 2 + 8, lp[1] - 28); x.stroke(); }
    // turn the page, with a ring for each reagent in the rack, filled where it would continue the chain
    if (play) {
      const tp = px(TURN), ok = canTurn(), last = g.page >= P.SYN.pages, col = ok ? INK : FAINT;
      hand(x, 54); x.textAlign = 'left'; x.fillStyle = col; x.fillText(last ? 'finish' : 'next page', tp[0], tp[1]);
      arrow(x, { x: TURN.x + 6.6, z: TURN.z - 0.5 }, { x: TURN.x + 8.8, z: TURN.z - 0.5 }, 6, col);
      if (!last && pile > 0) { const n = P.synRack().length; for (let k = 0; k < n; k++) { const c = [tp[0] + 12 + k * 24, tp[1] + 40]; if (k < st.outs) { x.fillStyle = INK; x.beginPath(); x.arc(c[0], c[1], 9, 0, 7); x.fill(); } else { x.strokeStyle = PENCIL; x.lineWidth = 3; x.beginPath(); x.arc(c[0], c[1], 8, 0, 7); x.stroke(); } } }
    }
    // pages, and a circle for each step on this one
    for (let k = 1; k <= P.SYN.pages; k++) { const c = px({ x: PAGES.x + (k - 1) * 2.2, z: PAGES.z }); hand(x, 46); x.textAlign = 'center'; x.fillStyle = k === g.page ? INK : k < g.page ? PENCIL : FAINT; x.fillText(String(k), c[0], c[1] + 14); if (k === g.page) ring(x, [c[0], c[1]], 28, 26, 4, INK); }
    for (let k = 0; k < P.DIAL.steps; k++) { const c = px({ x: STEP.x + k * 2.5, z: STEP.z }); ring(x, c, 30, 27, 5, INK, 0.1 * k); if (k < g.pageSteps) { x.strokeStyle = INK; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(c[0] - 16, c[1] - 2); x.lineTo(c[0] - 4, c[1] + 14); x.lineTo(c[0] + 24, c[1] - 26); x.stroke(); } }
    // what has been stamped, and the quota
    const q = px(TOTAL); hand(x, 96); x.textAlign = 'right'; x.fillStyle = st.mode === 'done' ? (st.pass ? GREEN : REDINK) : INK; x.fillText(fmt(st.shown), q[0], q[1]);
    hand(x, 64); x.textAlign = 'left'; x.fillStyle = REDINK; x.fillText('/ ' + fmt(st.quota), q[0] + 20, q[1]);
    if (st.mode === 'done') {   // the stamp's mark
      const c = [q[0] + 330, q[1] - 40], col = st.pass ? GREEN : REDINK; x.save(); x.translate(c[0], c[1]); x.rotate(-0.2); x.globalAlpha = 0.85;
      x.strokeStyle = col; x.lineWidth = 9; x.beginPath(); x.arc(0, 0, 70, 0, 7); x.stroke(); x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 57, 0, 7); x.stroke(); x.lineWidth = 14; x.lineCap = 'round'; x.beginPath();
      if (st.pass) { x.moveTo(-30, 2); x.lineTo(-8, 26); x.lineTo(34, -28); } else { x.moveTo(-26, -26); x.lineTo(26, 26); x.moveTo(26, -26); x.lineTo(-26, 26); } x.stroke(); x.restore();
    }
    ink.t.needsUpdate = true;
  }

  // ---------- pointer and keys ----------
  const ray = new T.Raycaster(), ndc = new T.Vector2(), ground = new T.Plane(new T.Vector3(0, 1, 0), 0), hit = new T.Vector3();
  function spotAt(e) {
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    const out = { slot: -1, go: false, turn: false };
    if (!ray.ray.intersectPlane(ground, hit)) return out;
    if (Math.hypot(hit.x - GO.x, hit.z - GO.z) < 3.6) { out.go = true; return out; }
    if (hit.x > TURN.x - 0.8 && hit.x < TURN.x + 9.4 && hit.z > TURN.z - 2.4 && hit.z < TURN.z + 2.2) { out.turn = true; return out; }
    if (st.mode === 'play') slots.forEach((s, i) => { if (!s || !s.o) return; const p = SPOT[i], l = LAB[i], rw = i === FIN ? 4.4 : 5.6; if ((Math.abs(hit.x - p.x) < rw && Math.abs(hit.z - p.z) < 3.6) || (Math.abs(hit.x - l.x) < 5 && Math.abs(hit.z - (l.z - 0.6)) < 1.8)) out.slot = i; });
    return out;
  }
  cv.addEventListener('pointermove', e => { const s = spotAt(e); if (s.slot !== st.hover) setHover(s.slot); cv.style.cursor = s.slot >= 0 || (s.go && (canStamp() || st.mode === 'done')) || (s.turn && canTurn()) ? 'pointer' : ''; });
  cv.addEventListener('pointerleave', () => setHover(-1));
  cv.addEventListener('click', e => { const s = spotAt(e); if (s.go) doStamp(); else if (s.turn) doTurn(); else if (s.slot >= 0) pick(s.slot); });
  root.addEventListener('keydown', e => {
    if (e.key >= '1' && e.key <= '6') pick(+e.key - 1);
    else if (e.key === 'Enter') { e.preventDefault(); doStamp(); }
    else if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); if (st.mode === 'done') doStamp(); else doTurn(); }
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
      tw.m.group.position.set(tw.fx + (tw.to.x - tw.fx) * e, Math.sin(k * Math.PI) * 1.4 * (tw.dur > 0.3 ? 1 : 0), tw.fz + (tw.to.z - tw.fz) * e); tw.m.group.scale.setScalar(tw.fs + (tw.sc - tw.fs) * e);
      if (k >= 1) { if (tw.done) ended.push(tw.done); return false; } return true;
    });
    ended.forEach(f => f());   // a finished move may start new ones, so it runs after the list is settled
    // products rise a little under the pointer
    prods.forEach((m, i) => { if (!m || tweens.some(tw => tw.m === m)) return; const want = st.hover === i ? 0.7 : 0; m.group.position.y += (want - m.group.position.y) * Math.min(1, dt * 14); });
    if (g && st.shown !== g.total) { const d = g.total - st.shown; st.shown = Math.abs(d) < 2 ? g.total : st.shown + d * Math.min(1, dt * 9); dirty = true; }
    if (st.pileBump > 0) { st.pileBump = Math.max(0, st.pileBump - dt * 4); dirty = true; }
    if (st.lost && now - st.lost.t < 1900) dirty = true;
    st.press = Math.max(0, st.press - dt * 3); stamp.position.y = st.press > 0 ? Math.sin((1 - st.press) * Math.PI) * 2.2 : 0;
    st.shake *= Math.pow(0.002, dt); const sh = st.shake > 0.02 ? st.shake : 0;
    cam.position.set(CAM.x + (Math.random() - 0.5) * sh * 0.5, CAM.y, CAM.z + (Math.random() - 0.5) * sh * 0.5); cam.lookAt(LOOKAT);
    if (st.flashRed > 0) { st.flashRed = Math.max(0, st.flashRed - dt * 2.5); veil.style.backgroundColor = 'rgba(200,38,28,' + (st.flashRed * 0.35).toFixed(3) + ')'; } else if (veil.style.backgroundColor) veil.style.backgroundColor = '';
    if (dirty && now - lastInk > 30) { drawInk(now); dirty = false; lastInk = now; }
    ren.render(scene, cam);
  }
  root.addEventListener('resize', size);
  AA.rxScheme = { st, load, pick, stamp: doStamp, turn: doTurn, setHover,
    state: () => ({ mode: st.mode, page: g.page, steps: g.pageSteps, offer: g.kinds.slice(), usable: slots.map((s, i) => (s && s.o ? i : -1)).filter(i => i >= 0), conts: slots.map((s, i) => (s && s.o && s.o.cont ? i : -1)).filter(i => i >= 0), breaks: slots.map((s, i) => (s && s.brk ? i : -1)).filter(i => i >= 0), pile: P.held(g), chain: g.cur.path.length, locked: g.locked, outs: st.outs, total: g.total, lost: g.lost, quota: st.quota, pass: st.pass, canStamp: canStamp(), canTurn: canTurn() }) };
  size(); load(0); requestAnimationFrame(frame);
}
const el = root.document && document.getElementById('schemeapp');
if (el) { const boot = () => start(el); if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('40px Marker'), document.fonts.load('40px Hand')]).then(boot, boot); else boot(); }
})(window);
