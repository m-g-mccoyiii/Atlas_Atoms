// The round, played on a page of a lab notebook. The molecule stands in the middle of the page and each reagent on
// offer has an inked arrow to the molecule it would make. Clicking a product reacts: the old molecule moves up to a
// row along the top, so the page fills with the scheme as the order goes on. Every reading is ink or pencil on the
// page. The score stays hidden until the stamp comes down, then each step is marked up in turn.
// Rules come from path.js. This file draws and takes input only.
(function (root) {
'use strict';
const AA = root.AA, T = root.THREE, RX = AA.rx, RUN = AA.rxRun, E = AA.ELEMENTS, P = AA.rxPath, sfx = AA.sfx;
const lin = h => new T.Color(h).convertSRGBToLinear();
const rgb = c => 'rgb(' + c.join(',') + ')';
const bright = c => { const m = Math.max(c[0], c[1], c[2], 1), k = Math.max(1, 190 / m); return c.map(q => Math.min(255, Math.round(q * k + 20))); };
const hash = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619); return ((x >>> 0) % 1000) / 1000; };
const fmt = n => Math.round(n).toLocaleString('en-US');
const fmtB = n => (n < 100 ? String(Math.round(n * 10) / 10) : fmt(n));
const BALL = el => Math.min(0.62, 0.2 + 0.36 * E[el].cov);
const MARK = '#d6249f', INK = '#1f2a55', PENCIL = '#5a564e', REDINK = '#c8261c', GREEN = '#1c8a4a';
const SW = 64, SH = 44, IW = 2048, IH = 1408, U = IW / SW;
const C0 = { x: 0, z: 4.6 }, SPOT = [{ x: -17, z: 0.4 }, { x: -6.6, z: -7.6 }, { x: 6.6, z: -7.6 }, { x: 17, z: 0.4 }];
const ROW = { x: -21.5, z: -15.4, dx: 11 }, GO = { x: 18.5, z: 10.4 }, STEP = { x: -20.5, z: 11.4 }, NOTE = { x: 1.5, z: 12.6 }, KEEPL = { x: 0, z: 8.9 }, GEARL = { x: 16.5, z: -12.4 };
const SC_MAIN = 1.1, SC_PROD = 0.9, SC_ROW = 0.46;

function start(app) {
  const cv = document.createElement('canvas'); app.append(cv);
  const ren = new T.WebGLRenderer({ canvas: cv, antialias: true });
  ren.setPixelRatio(Math.min(2, root.devicePixelRatio || 1)); ren.outputEncoding = T.sRGBEncoding;
  ren.shadowMap.enabled = true; ren.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene(); scene.background = lin('#e9e2d0');
  const cam = new T.PerspectiveCamera(34, 1, 0.5, 200), CAM = new T.Vector3(0, 45, 29), LOOKAT = new T.Vector3(0, 0, 1.3);
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
  const pageMesh = add(new T.PlaneGeometry(SW, SH).rotateX(-Math.PI / 2), std({ map: paper.t, roughness: 0.95 }), 0, 0, 0); pageMesh.castShadow = false;
  const ink = canvasTex(IW, IH);
  const inkMesh = add(new T.PlaneGeometry(SW, SH).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: ink.t, transparent: true, depthWrite: false }), 0, 0.02, 0); inkMesh.castShadow = false; inkMesh.receiveShadow = false;
  const veil = document.createElement('canvas'); veil.className = 'veil'; app.append(veil);

  // the stamp and its pad, and a pencil
  const stamp = new T.Group(); scene.add(stamp); stamp.position.set(GO.x, 0, GO.z);
  add(new T.CylinderGeometry(2.5, 2.6, 0.5, 40), std({ color: lin(0x7b1f18), roughness: 0.7 }), GO.x, 0.25, GO.z);
  add(new T.CylinderGeometry(1.6, 1.6, 0.5, 36), std({ color: lin(0x1d1b1a), roughness: 0.6 }), 0, 0.75, 0, stamp);
  add(new T.CylinderGeometry(0.6, 0.95, 2.0, 28), std({ color: lin(0xb07a44), roughness: 0.5 }), 0, 2.0, 0, stamp);
  add(new T.SphereGeometry(0.9, 28, 20), std({ color: lin(0xb07a44), roughness: 0.5 }), 0, 3.2, 0, stamp);
  const pen = add(new T.CylinderGeometry(0.2, 0.2, 9, 6), std({ color: lin(0xf0b21c), roughness: 0.5 }), -27.5, 0.2, 4); pen.rotation.set(Math.PI / 2, 0, 0.12);

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
      const ring = a.keep ? MARK : rings && rings.has(a) && a.el !== 'H' ? rings.get(a) : null;
      if (ring) collar(grp, p, R, ring);
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
  const st = { mode: 'play', feed: 0, deal: null, hover: -1, quota: 0, shown: 0, target: 0, y: 0, b: 1, beat: -1, tokens: [], kept: false, keptShown: false, pass: false, fired: {}, tok: 0, shake: 0, press: 0, flashRed: 0 };
  let g = null, opts = {}, center = null, prods = {}, rowMols = [], tweens = [], dirty = true, last = performance.now(), lastInk = 0;
  const rowAt = k => ({ x: ROW.x + k * ROW.dx, z: ROW.z });
  const tween = (m, to, sc, dur, done) => tweens.push({ m, fx: m.group.position.x, fz: m.group.position.z, fs: m.group.scale.x, to, sc, t: 0, dur, done });
  const slotOf = id => st.deal.offer.indexOf(id);
  const itemOf = i => { const id = st.deal.offer[i], p = SPOT[i], dx = p.x - C0.x, dz = p.z - C0.z, d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d; return { id, card: RX.CARDS[id], col: bright(RX.CARDS[id].rgb), p, ux, uz, a: { x: C0.x + ux * 6.2, z: C0.z + uz * 3.2 }, b: { x: p.x - ux * 4.9, z: p.z - uz * 4.4 }, lab: i === 1 || i === 2 ? { x: p.x + (i === 1 ? -10.6 : 10.6), z: p.z - 0.4 } : { x: p.x * 0.92, z: p.z + 6 }, o: opts[id] || null }; };

  function refresh() {
    Object.keys(prods).forEach(id => freeMol(prods[id])); prods = {};
    opts = st.mode === 'play' ? P.options(g) : {};
    st.deal.offer.forEach((id, i) => {
      const o = opts[id]; if (!o) return;
      o.model.settle(160);
      const rings = new Map(); o.r.made.forEach(a => rings.set(a, rgb(bright(RX.CARDS[id].rgb))));
      const m = buildMol(o.model, rings); place(m, SPOT[i], 0.01); tween(m, SPOT[i], SC_PROD, 0.22 + i * 0.05); prods[id] = m;
    });
    st.hover = -1; setHover(-1); dirty = true;
  }
  function load(i, keep) {
    st.feed = (i + P.FEEDS.length) % P.FEEDS.length; if (!keep || !st.deal) st.deal = P.deal(P.FEEDS[st.feed], Math.min(4, P.OFFER));
    st.tok++; st.mode = 'play'; st.shown = 0; st.target = 0; st.y = 0; st.b = 1; st.beat = -1; st.tokens = []; st.kept = st.keptShown = false; st.pass = false; st.fired = {}; tweens = [];
    freeMol(center); rowMols.forEach(freeMol); rowMols = [];
    g = P.begin(P.FEEDS[st.feed], true, st.deal.offer, st.deal.keep);
    const sv = P.survey(P.FEEDS[st.feed], 0, st.deal.offer, st.deal.keep), q = sv.best * 0.45, mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(10, q))) - 1));
    st.quota = Math.max(50, Math.round(q / mag) * mag);
    setAlign(g.m); center = buildMol(g.m, null); place(center, C0, 0.01); tween(center, C0, SC_MAIN, 0.3);
    refresh(); sfx.feed();
  }
  function setHover(i) {
    if (center) { center.hover.forEach(t => { center.group.remove(t); t.geometry.dispose(); t.material.dispose(); }); center.hover = []; }
    st.hover = i; const id = i >= 0 ? st.deal.offer[i] : null, o = id ? opts[id] : null;
    if (o && center && st.mode === 'play') { const col = o.spoil ? REDINK : rgb(bright(RX.CARDS[id].rgb)); o.atoms.forEach(a => { const p = center.at.get(a); if (p && a.el !== 'H' && !a.keep) center.hover.push(collar(center.group, p, BALL(a.el), col)); }); }
    cv.style.cursor = o ? 'pointer' : ''; dirty = true;
  }
  function pick(i) {
    const id = st.deal.offer[i], o = id && opts[id], chosen = id && prods[id];
    if (!o || !chosen || st.mode !== 'play') return;
    setHover(-1); st.mode = 'move';
    const prev = center, k = g.trail.length, tok = st.tok;
    P.take(g, o); delete prods[id];
    Object.keys(prods).forEach(q => { const m = prods[q]; tween(m, { x: m.group.position.x, z: m.group.position.z }, 0.01, 0.16, () => freeMol(m)); }); prods = {};
    tween(prev, rowAt(k), SC_ROW, 0.36); rowMols.push(prev);
    tween(chosen, C0, SC_MAIN, 0.36, () => { if (tok !== st.tok) return; center = chosen; st.mode = 'play'; refresh(); });
    sfx.bond(); sfx.lock(k); st.shake = 0.25 + 0.12 * o.r.hits;
    if (o.spoil) { st.flashRed = 1; st.shake = 0.9; sfx.bad(); }
    dirty = true;
  }
  function deliver() {
    if (st.mode !== 'play' || !g.trail.length) return;
    setHover(-1); st.mode = 'score'; refresh(); st.press = 1; sfx.stamp();
    const tok = st.tok, beats = []; st.tokens = g.trail.map(() => []);
    g.trail.forEach((t, k) => t.ev.forEach(e => { if (e.kind !== 'grade' && e.kind !== 'catch') beats.push({ k, e }); }));
    let i = 0, met = false;
    const cross = () => { if (!met && st.target >= st.quota) { met = true; sfx.quota(); st.shake = Math.max(st.shake, 0.7); } };
    const finish = () => { st.beat = -1; st.mode = 'done'; st.pass = st.target >= st.quota; st.press = 1; if (st.pass) { sfx.fanfare(); st.shake = 1; } else { sfx.bad(); st.shake = 0.6; } dirty = true; };
    const step = () => {
      if (tok !== st.tok) return;
      if (i >= beats.length) {
        const km = g.keep != null && !g.spoiled ? P.DIAL.keep : 1;
        if (km > 1 && !st.kept) { st.kept = st.keptShown = true; st.b *= km; st.target = Math.round(st.y * st.b); st.shake = 0.8; sfx.good(); cross(); dirty = true; return setTimeout(step, 750); }
        return setTimeout(finish, 350);
      }
      const b = beats[i], e = b.e, big = e.kind === 'x', src = RUN.GEARS[e.src] ? e.src : e.gear;
      st.beat = b.k; st.y = e.yield; st.b = e.batch; st.target = Math.round(e.yield * e.batch);
      st.tokens[b.k].push({ txt: (big ? 'times ' : '+') + fmtB(e.val), kind: e.kind, src: src || e.src });
      if (src) st.fired[src] = performance.now();
      st.shake = Math.max(st.shake, big ? 0.6 : 0.18); sfx.lock(i); cross(); i++; dirty = true;
      setTimeout(step, Math.max(60, (big ? 300 : 170) - 8 * i));
    };
    setTimeout(step, 450);
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
  function drawInk(now) {
    const x = ink.x, play = st.mode === 'play'; x.clearRect(0, 0, IW, IH); x.textBaseline = 'alphabetic';
    // the arrows out of the molecule, and what each one does
    if (play) st.deal.offer.forEach((id, i) => {
      const it = itemOf(i), o = it.o, hov = st.hover === i, m = px(it.lab), verb = it.card.verb.toLowerCase();
      const col = !o ? 'rgba(90,86,78,0.35)' : o.spoil ? REDINK : INK;
      if (o) { if (o.cont) { const A = px(it.a), B = px(it.b); x.strokeStyle = 'rgba(255,214,0,0.6)'; x.lineWidth = 26; x.lineCap = 'round'; x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); } arrow(x, it.a, it.b, hov ? 9 : 6, col, o.loop ? [14, 12] : null); }
      x.save(); x.translate(m[0], m[1]); x.rotate((hash(id) - 0.5) * 0.07);
      hand(x, 66); x.textAlign = 'center'; const tw = x.measureText(verb).width;
      if (o) { x.strokeStyle = rgb(it.col); x.globalAlpha = hov ? 0.85 : 0.55; x.lineWidth = hov ? 22 : 15; x.lineCap = 'round'; x.beginPath(); x.moveTo(-28 - tw / 2, 14); x.lineTo(-28 + tw / 2, 10); x.stroke(); x.globalAlpha = 1; }
      x.fillStyle = col; x.fillText(verb, -28, 0);
      hand(x, 40); x.fillStyle = 'rgba(90,86,78,0.7)'; x.fillText(String(i + 1), -28 - tw / 2 - 26, -2);
      if (o) { hand(x, 54); x.fillStyle = col; x.fillText(String(o.r.hits), tw / 2 + 18, -2); ring(x, [tw / 2 + 19, -19], 28, 26, 4, col);
        if (o.spoil) { x.strokeStyle = REDINK; x.lineWidth = 8; x.lineCap = 'round'; x.beginPath(); x.moveTo(-28 - tw / 2, 6); x.lineTo(-28 + tw / 2, -40); x.stroke(); } }
      // a pencil stroke for each bottle of it left in the rack
      x.strokeStyle = o ? PENCIL : 'rgba(90,86,78,0.35)'; x.lineWidth = 4; for (let k = 0; k < g.left[id]; k++) { x.beginPath(); x.moveTo(-28 - tw / 2 + k * 13, 34); x.lineTo(-24 - tw / 2 + k * 13, 56); x.stroke(); }
      x.restore();
    });
    // the scheme so far, along the top
    g.trail.forEach((t, k) => {
      const a = rowAt(k), c = RX.CARDS[t.id], A = { x: a.x + 3.3, z: a.z }, B = { x: a.x + ROW.dx - 3.5, z: a.z }, lit = st.beat === k, col = t.spoil ? REDINK : INK;
      if (t.cont) { const pa = px(A), pb = px(B); x.strokeStyle = 'rgba(255,214,0,0.6)'; x.lineWidth = 24; x.lineCap = 'round'; x.beginPath(); x.moveTo(pa[0], pa[1]); x.lineTo(pb[0], pb[1]); x.stroke(); }
      arrow(x, A, B, lit ? 8 : 5, col);
      const m = px({ x: (A.x + B.x) / 2, z: a.z }); hand(x, 50); x.textAlign = 'center'; x.fillStyle = col; x.fillText(c.verb.toLowerCase(), m[0], m[1] - 16);
      x.strokeStyle = rgb(bright(c.rgb)); x.globalAlpha = 0.6; x.lineWidth = 9; x.beginPath(); x.moveTo(m[0] - 50, m[1] - 8); x.lineTo(m[0] + 50, m[1] - 10); x.stroke(); x.globalAlpha = 1;
      (st.tokens[k] || []).forEach((tk, j) => { hand(x, tk.kind === 'x' ? 44 : 38); x.fillStyle = tk.kind === 'x' ? REDINK : tk.kind === 'y' ? '#8a6a00' : PENCIL; x.fillText(tk.txt, m[0] - 70 + (j % 2) * 140, m[1] + 40 + Math.floor(j / 2) * 40); });
    });
    // equipment, in the corner
    (AA.rxPathGear || []).forEach((id, k) => { const p = px({ x: GEARL.x, z: GEARL.z + k * 1.7 }), age = st.fired[id] ? (now - st.fired[id]) / 1000 : 9; hand(x, 40); x.textAlign = 'left'; x.fillStyle = PENCIL; x.fillText(RUN.GEARS[id].name.toLowerCase(), p[0], p[1]); if (age < 0.5) { const tw = x.measureText(RUN.GEARS[id].name.toLowerCase()).width; x.strokeStyle = 'rgba(255,214,0,0.7)'; x.lineWidth = 18; x.lineCap = 'round'; x.beginPath(); x.moveTo(p[0], p[1] - 12); x.lineTo(p[0] + tw, p[1] - 14); x.stroke(); x.fillStyle = INK; x.fillText(RUN.GEARS[id].name.toLowerCase(), p[0], p[1]); } });
    // the marked group
    if (g.keep != null) {
      const k0 = px(KEEPL), txt = 'keep', gone = g.spoiled; hand(x, 54); x.textAlign = 'center'; x.fillStyle = gone ? 'rgba(90,86,78,0.5)' : MARK; x.fillText(txt, k0[0] - 120, k0[1]);
      hand(x, st.keptShown ? 70 : 46); x.fillText('times ' + P.DIAL.keep, k0[0] + 80, k0[1]);
      if (st.keptShown) ring(x, [k0[0] + 80, k0[1] - 22], 118, 46, 6, MARK, 0.05);
      if (gone) { x.strokeStyle = REDINK; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(k0[0] - 190, k0[1] - 10); x.lineTo(k0[0] + 180, k0[1] - 26); x.stroke(); }
    }
    // a circle for each step, ticked as it is used
    for (let k = 0; k < P.DIAL.steps; k++) { const c = px({ x: STEP.x + k * 2.5, z: STEP.z }); ring(x, c, 30, 27, 5, INK, 0.1 * k); if (k < g.trail.length) { x.strokeStyle = INK; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(c[0] - 16, c[1] - 2); x.lineTo(c[0] - 4, c[1] + 14); x.lineTo(c[0] + 24, c[1] - 26); x.stroke(); } }
    // the total, hidden until the stamp comes down, and the quota
    const q = px(NOTE), scoring = st.mode === 'score' || st.mode === 'done', big = scoring ? fmt(st.shown) : '?';
    hand(x, scoring ? 110 : 96); x.textAlign = 'right'; x.fillStyle = st.mode === 'done' ? (st.pass ? GREEN : REDINK) : scoring ? INK : PENCIL; x.fillText(big, q[0], q[1]);
    hand(x, 70); x.textAlign = 'left'; x.fillStyle = REDINK; x.fillText('/ ' + fmt(st.quota), q[0] + 22, q[1]);
    if (scoring) { hand(x, 40); x.textAlign = 'right'; x.fillStyle = '#8a6a00'; x.fillText(fmt(st.y) + ' yield', q[0] - 130, q[1] + 46); x.fillStyle = REDINK; x.textAlign = 'left'; x.fillText('batch ' + fmtB(st.b), q[0] - 110, q[1] + 46); }
    if (st.mode === 'done') {   // the stamp's mark
      const c = [q[0] + 345, q[1] - 34], col = st.pass ? GREEN : REDINK; x.save(); x.translate(c[0], c[1]); x.rotate(-0.2); x.globalAlpha = 0.85;
      x.strokeStyle = col; x.lineWidth = 9; x.beginPath(); x.arc(0, 0, 74, 0, 7); x.stroke(); x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 60, 0, 7); x.stroke(); x.lineWidth = 14; x.lineCap = 'round'; x.beginPath();
      if (st.pass) { x.moveTo(-32, 2); x.lineTo(-8, 28); x.lineTo(36, -30); } else { x.moveTo(-28, -28); x.lineTo(28, 28); x.moveTo(28, -28); x.lineTo(-28, 28); } x.stroke(); x.restore();
    }
    ink.t.needsUpdate = true;
  }

  // ---------- pointer and keys ----------
  const ray = new T.Raycaster(), ndc = new T.Vector2(), ground = new T.Plane(new T.Vector3(0, 1, 0), 0), hit = new T.Vector3();
  function spotAt(e) {
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(ground, hit)) return { slot: -1, go: false };
    if (Math.hypot(hit.x - GO.x, hit.z - GO.z) < 3.4) return { slot: -1, go: true };
    let slot = -1; if (st.mode === 'play') st.deal.offer.forEach((id, i) => { if (!opts[id]) return; const p = SPOT[i]; const out = i === 1 || i === 2; if (out ? (hit.z > p.z - 4.5 && hit.z < p.z + 4 && (i === 1 ? hit.x < p.x + 5.5 && hit.x > p.x - 15.5 : hit.x > p.x - 5.5 && hit.x < p.x + 15.5)) : (Math.abs(hit.x - p.x) < 6.6 && hit.z > p.z - 4.5 && hit.z < p.z + 7.6)) slot = i; });
    return { slot, go: false };
  }
  cv.addEventListener('pointermove', e => { const s = spotAt(e); if (s.slot !== st.hover) setHover(s.slot); if (s.go && st.mode === 'play' && g.trail.length) cv.style.cursor = 'pointer'; });
  cv.addEventListener('pointerleave', () => setHover(-1));
  cv.addEventListener('click', e => { const s = spotAt(e); if (s.go) { if (st.mode === 'play') deliver(); else if (st.mode === 'done') load(st.pass ? st.feed + 1 : st.feed, !st.pass); } else if (s.slot >= 0) pick(s.slot); });
  root.addEventListener('keydown', e => {
    if (e.key >= '1' && e.key <= '9') pick(+e.key - 1);
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (st.mode === 'play') deliver(); else if (st.mode === 'done') load(st.pass ? st.feed + 1 : st.feed, !st.pass); }
    else if (e.key === 'r' || e.key === 'R') load(st.feed, true);
    else if (e.key === 'n' || e.key === 'N') load(st.feed + 1);
  });

  function size() {
    const w = app.clientWidth, h = app.clientHeight; if (!w || !h) return; ren.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h > 1.6 ? 34 : 34 * 1.6 / (w / h) * 0.86; cam.updateProjectionMatrix();
    veil.width = w; veil.height = h; const x = veil.getContext('2d'), gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,236,190,0.16)'); gr.addColorStop(1, 'rgba(60,50,90,0.14)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); noise(x, w, h, w * h / 30, 0.05, '80,60,30');
  }
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const ended = [];
    tweens = tweens.filter(tw => {
      tw.t += dt; const k = Math.min(1, tw.t / tw.dur), e = 1 - Math.pow(1 - k, 3);
      tw.m.group.position.set(tw.fx + (tw.to.x - tw.fx) * e, Math.sin(k * Math.PI) * 1.4 * (tw.dur > 0.3 ? 1 : 0), tw.fz + (tw.to.z - tw.fz) * e); tw.m.group.scale.setScalar(tw.fs + (tw.sc - tw.fs) * e);
      if (k >= 1) { if (tw.done) ended.push(tw.done); return false; } return true;
    });
    ended.forEach(f => f());   // a finished move may start new ones, so it runs after the list is settled
    // products rise a little under the pointer
    st.deal.offer.forEach((id, i) => { const m = prods[id]; if (!m || tweens.some(tw => tw.m === m)) return; const want = st.hover === i ? 0.7 : 0; m.group.position.y += (want - m.group.position.y) * Math.min(1, dt * 14); });
    if (st.mode === 'score' || st.mode === 'done') { const d = st.target - st.shown; if (d) { st.shown = Math.abs(d) < 2 ? st.target : st.shown + d * Math.min(1, dt * 14); dirty = true; } }
    st.press = Math.max(0, st.press - dt * 3); stamp.position.y = st.press > 0 ? Math.sin((1 - st.press) * Math.PI) * 2.2 : 0;
    st.shake *= Math.pow(0.002, dt); const sh = st.shake > 0.02 ? st.shake : 0;
    cam.position.set(CAM.x + (Math.random() - 0.5) * sh * 0.5, CAM.y, CAM.z + (Math.random() - 0.5) * sh * 0.5); cam.lookAt(LOOKAT);
    if (st.flashRed > 0) { st.flashRed = Math.max(0, st.flashRed - dt * 2.5); veil.style.backgroundColor = 'rgba(200,38,28,' + (st.flashRed * 0.35).toFixed(3) + ')'; } else if (veil.style.backgroundColor) veil.style.backgroundColor = '';
    if (Object.keys(st.fired).some(id => now - st.fired[id] < 600)) dirty = true;
    if (dirty && now - lastInk > 30) { drawInk(now); dirty = false; lastInk = now; }
    ren.render(scene, cam);
  }
  root.addEventListener('resize', size);
  AA.rxScheme = { st, load, pick, deliver, setHover, state: () => ({ mode: st.mode, offer: st.deal.offer, opts: Object.keys(opts), spoils: Object.keys(opts).filter(k => opts[k].spoil), conts: Object.keys(opts).filter(k => opts[k].cont), trail: g.trail.map(t => t.id), quota: st.quota, total: st.target, pass: st.pass, keep: g.keep, spoiled: g.spoiled }) };
  size(); load(0); requestAnimationFrame(frame);
}
const el = root.document && document.getElementById('schemeapp');
if (el) { const boot = () => start(el); if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('40px Marker'), document.fonts.load('40px Hand')]).then(boot, boot); else boot(); }
})(window);
