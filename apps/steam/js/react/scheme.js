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
const SC_MAIN = 1.3, SC_PROD = 1.0, SC_HOVER = 1.3, SC_ROW = 0.42, SC_FIN = 0.7;

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
  // lean: a product is drawn without the hydrogens on its carbons and without letters on carbon, so it reads at a
  // distance. The middle molecule is always drawn in full. Nothing is ringed in 3D: what changed is circled in ink
  // on the page under it, see marksOf.
  function buildMol(model, rings, lean) {
    const grp = new T.Group(), c = new T.Vector3(), at = new Map(), skip = new Set(); let low = 1e9, n = 0;
    if (lean) model.atoms.forEach(a => { if (a.el === 'H' && model.neighbors(a).every(q => q.atom.el === 'C')) skip.add(a); });
    model.atoms.forEach(a => { if (skip.has(a)) return; c.add(new T.Vector3(a.x, a.y, a.z)); n++; }); c.divideScalar(n || 1);
    model.atoms.forEach(a => { const p = new T.Vector3(a.x, a.y, a.z).sub(c).applyQuaternion(align); at.set(a, p); if (!skip.has(a)) low = Math.min(low, p.y - BALL(a.el)); });
    at.forEach(p => { p.y += 0.5 - low; });
    model.atoms.forEach(a => {
      if (skip.has(a)) return;
      const p = at.get(a), R = BALL(a.el);
      add(SPH, ballMat(a.el), p.x, p.y, p.z, grp).scale.setScalar(R);
      if (!lean || (a.el !== 'C' && a.el !== 'H')) { const sp = new T.Sprite(letterMat(a.el)); sp.position.copy(p).addScaledVector(camDir, -R * 1.04); sp.scale.setScalar(R * 1.25); grp.add(sp); }
    });
    model.bonds.forEach(b => {
      const A = at.get(b.a), B = at.get(b.b); if (!A || !B || skip.has(b.a) || skip.has(b.b)) return;
      const u = B.clone().sub(A), len = u.length(); if (len < 1e-4) return; u.divideScalar(len);
      const q = new T.Quaternion().setFromUnitVectors(UP, u), perp = new T.Vector3().crossVectors(u, camDir).normalize(), mid = A.clone().add(B).multiplyScalar(0.5);
      const offs = b.order === 1 ? [0] : [-0.5, 0.5], r = b.order > 1 ? 0.06 : 0.09;
      offs.forEach(f => [[A, mid, b.a], [mid, B, b.b]].forEach(h => { const m = add(CYL, stickMat(h[2].el), 0, 0, 0, grp); m.position.copy(h[0]).add(h[1]).multiplyScalar(0.5).addScaledVector(perp, f * 0.17); m.quaternion.copy(q); m.scale.set(r, h[0].distanceTo(h[1]), r); }));
    });
    scene.add(grp);
    const m = { group: grp, at, model, hover: [], marks: [] };
    if (rings) m.marks = marksOf(m, Array.from(rings.keys()));
    return m;
  }
  // Where to circle a set of atoms on the page. Each atom is carried down to the page along the line of sight, so
  // the circle sits behind it on screen. Atoms close together share one circle. Lengths are in the molecule's own units.
  function marksOf(m, atoms) {
    const pts = []; atoms.forEach(a => { const p = m.at.get(a); if (!p || a.el === 'H') return; const t = -p.y / camDir.y; pts.push({ x: p.x + camDir.x * t, z: p.z + camDir.z * t }); });
    const out = [];
    pts.forEach(p => { const o = out.find(q => q.pts.some(t => Math.hypot(t.x - p.x, t.z - p.z) < 2.3)); if (o) o.pts.push(p); else out.push({ pts: [p] }); });
    out.forEach(o => { o.x = o.pts.reduce((t, q) => t + q.x, 0) / o.pts.length; o.z = o.pts.reduce((t, q) => t + q.z, 0) / o.pts.length; o.r = Math.max(...o.pts.map(q => Math.hypot(q.x - o.x, q.z - o.z))) + 0.9; });
    return out;
  }
  function freeMol(m) { if (!m) return; scene.remove(m.group); m.group.traverse(o => { if (o.userData.own && o.geometry) { o.geometry.dispose(); o.material.dispose(); } }); }
  const place = (m, p, sc) => { m.group.position.set(p.x, 0, p.z); m.group.scale.setScalar(sc); };

  // ---------- sparks, bits and bubbles: one pool of small balls ----------
  const PN = 700, pMesh = new T.InstancedMesh(new T.SphereGeometry(1, 8, 6), new T.MeshBasicMaterial(), PN), parts = [], pM = new T.Matrix4(), pQ = new T.Quaternion(), pV = new T.Vector3(), pS = new T.Vector3(), pC = new T.Color();
  pMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); pMesh.frustumCulled = false; scene.add(pMesh);
  for (let i = 0; i < PN; i++) { parts.push({ life: 0 }); pMesh.setMatrixAt(i, pM.makeScale(0, 0, 0)); pMesh.setColorAt(i, pC.set(0xffffff)); }
  let pNext = 0;
  // g is gravity: positive falls and bounces on the page, negative rises
  function burst3(x, y, z, n, col, spd, size, grav) {
    for (let k = 0; k < n; k++) {
      const i = pNext, q = parts[i]; pNext = (pNext + 1) % PN;
      const a = Math.random() * 6.283, e = Math.random() * 1.2, v = spd * (0.35 + Math.random());
      q.x = x; q.y = y; q.z = z; q.vx = Math.cos(a) * Math.cos(e) * v; q.vy = Math.sin(e) * v + spd * 0.35; q.vz = Math.sin(a) * Math.cos(e) * v;
      q.life = q.max = 0.45 + Math.random() * 0.7; q.s = size * (0.5 + Math.random()); q.g = grav == null ? 30 : grav;
      pMesh.setColorAt(i, pC.set(col).convertSRGBToLinear());
    }
    pMesh.instanceColor.needsUpdate = true;
  }
  function stepParts(dt) {
    for (let i = 0; i < PN; i++) {
      const q = parts[i]; if (q.life <= 0) continue;
      q.life -= dt; q.vy -= q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      if (q.g > 0 && q.y < q.s) { q.y = q.s; q.vy *= -0.45; q.vx *= 0.7; q.vz *= 0.7; }
      const k = q.life <= 0 ? 0 : q.s * Math.sqrt(q.life / q.max);
      pMesh.setMatrixAt(i, pM.compose(pV.set(q.x, q.y, q.z), pQ, pS.set(k, k, k)));
    }
    pMesh.instanceMatrix.needsUpdate = true;
  }

  // ---------- state ----------
  const MADE = { x: -2.5, z: 13 }, MULT = { x: -10.5, z: 8.6 }, CALL = { x: 0, z: -2.4 }, KIT = { x: 10.8, z: 9.2, dx: 5.6 };
  const st = { mode: 'play', feed: 0, hover: -1, quota: 0, shown: 0, pass: false, tok: 0, shake: 0, flash: 0, flashC: '28,138,74', pageStart: 0, floats: [], blots: [], call: null, multBump: 0, over: 0, turned: 0, gear: [], fired: {}, want: 0, mult: 1, pop: 0, zoom: 0, zoomT: 0, madeBump: 0, bubble: 0 };
  let g = null, slots = [], center = null, prods = [], rowMols = [], tweens = [], dirty = true, last = performance.now(), lastInk = 0;
  let run = null, picks = [], pickObjs = [], best = 0; const meta = { credit: 0, tier: 0 }, shop = { earned: 0 };
  try { best = +(localStorage.getItem('aa_scheme_best') || 0) || 0; const m = JSON.parse(localStorage.getItem('aa_scheme_meta') || 'null'); if (m) { meta.credit = m.credit | 0; meta.tier = Math.max(0, Math.min(P.SUPPLY.length - 1, m.tier | 0)); } } catch (e) { /* storage unavailable */ }
  const saveMeta = () => { try { localStorage.setItem('aa_scheme_meta', JSON.stringify(meta)); } catch (e) { /* storage unavailable */ } };
  run = P.runNew(meta.tier);
  const PICKX = [-15, 0, 15];
  const rowAt = k => ({ x: ROW.x + k * ROW.dx, z: ROW.z });
  const tween = (m, to, sc, dur, done) => tweens.push({ m, fx: m.group.position.x, fz: m.group.position.z, fs: m.group.scale.x, to, sc, t: 0, dur, done });
  const colOf = id => bright(RX.CARDS[id].rgb);
  const callout = (text, sub, col) => { st.call = { text, sub: sub || '', col: col || INK, t: performance.now() }; };
  const spray = (n, col, wide) => { const now = performance.now(); for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, d = 2 + Math.random() * (wide ? 22 : 7); st.blots.push({ x: C0.x + Math.cos(a) * d * 1.3, z: C0.z + Math.sin(a) * d * 0.7, r: 4 + Math.random() * (wide ? 22 : 10), t: now, col }); } };

  // ---------- equipment: objects standing on the page, each with its name and what it does pencilled under it ----------
  let kitObjs = [];
  const GLASS = std({ color: lin(0xdfe9ee), transparent: true, opacity: 0.42, roughness: 0.08 });
  function piece(id) {
    const q = P.GEARS[id], grp = new T.Group(), hue = hash(id + 'hue'), liq = new T.Color().setHSL(hue, 0.75, 0.5), lm = std({ color: liq.clone().convertSRGBToLinear(), roughness: 0.3 });
    if (q.shape === 'box') { add(new T.BoxGeometry(2.6, 1.3, 1.9), std({ color: lin(0x3b3e42), roughness: 0.5, metalness: 0.3 }), 0, 0.65, 0, grp); add(new T.CylinderGeometry(0.42, 0.5, 0.3, 20), lm, 0.6, 1.45, 0, grp); add(new T.BoxGeometry(1.1, 0.5, 0.06), std({ color: lin(0x9be8b0), roughness: 0.4 }), -0.55, 0.8, 0.96, grp); }
    else if (q.shape === 'column') { add(new T.CylinderGeometry(0.5, 0.5, 3.4, 20), GLASS, 0, 1.7, 0, grp); add(new T.CylinderGeometry(0.32, 0.32, 2.2, 16), lm, 0, 1.2, 0, grp); add(new T.CylinderGeometry(0.9, 1, 0.25, 24), std({ color: lin(0x2a2b2e), roughness: 0.6 }), 0, 0.12, 0, grp); }
    else if (q.shape === 'flask') { add(new T.CylinderGeometry(0.35, 1.35, 2.2, 28), GLASS, 0, 1.1, 0, grp); add(new T.CylinderGeometry(0.75, 1.25, 0.9, 24), lm, 0, 0.5, 0, grp); add(new T.CylinderGeometry(0.36, 0.36, 0.7, 20), GLASS, 0, 2.5, 0, grp); }
    else if (q.shape === 'round') { add(new T.SphereGeometry(1.25, 28, 20), GLASS, 0, 1.3, 0, grp); add(new T.SphereGeometry(1.0, 24, 16, 0, 6.3, Math.PI / 2, Math.PI / 2), lm, 0, 1.3, 0, grp); add(new T.CylinderGeometry(0.36, 0.36, 1, 20), GLASS, 0, 2.8, 0, grp); }
    else { add(new T.CylinderGeometry(1.35, 0.25, 1.9, 28), GLASS, 0, 2.0, 0, grp); add(new T.CylinderGeometry(0.2, 0.2, 1.1, 14), GLASS, 0, 0.55, 0, grp); add(new T.CylinderGeometry(0.9, 0.3, 0.9, 20), lm, 0, 1.7, 0, grp); }
    grp.rotation.y = (hash(id + 'yaw') - 0.5) * 0.7; scene.add(grp);
    return { id, grp, col: '#' + liq.getHexString() };
  }
  const kitX = i => (st.gear.length > 3 ? 9.2 + i * 4.6 : KIT.x + i * KIT.dx);
  function buildKit() {
    kitObjs.forEach(k => scene.remove(k.grp)); kitObjs = [];
    st.gear.forEach((id, i) => { const k = piece(id); k.grp.position.set(kitX(i), 0, KIT.z); if (st.gear.length > 3) k.grp.scale.setScalar(0.85); kitObjs.push(k); });
  }
  const clearKit = () => { kitObjs.forEach(k => scene.remove(k.grp)); kitObjs = []; };

  // what stands on the page: one slot for each reagent on offer, and on the last page one for the finishing reagent
  function refresh() {
    prods.forEach(freeMol); prods = []; slots = [];
    const live = st.mode === 'play' && !g.over, o = live ? P.options(g) : {};
    g.kinds.forEach((id, i) => { slots[i] = { id, o: o[id] || null }; });
    const fin = live && g.pageSteps < P.stepsOf(g) ? P.finishOpt(g) : null; slots[FIN] = fin ? { id: fin.id, o: fin, fin: true } : null;
    slots.forEach((s, i) => {
      if (!s || !s.o) return;
      s.o.model.settle(160);
      const rings = new Map(), c = rgb(colOf(s.id)); s.o.r.made.forEach(a => rings.set(a, c));
      const m = buildMol(s.o.model, rings, true); m.col = c; place(m, SPOT[i], 0.01); tween(m, SPOT[i], i === FIN ? SC_FIN : SC_PROD, 0.16 + i * 0.03); prods[i] = m;
    });
    st.hover = -1; setHover(-1); dirty = true;
  }
  function clearRound() { tweens = []; prods.forEach(freeMol); prods = []; slots = []; freeMol(center); center = null; rowMols.forEach(freeMol); rowMols = []; }
  // the next round of the run: a molecule, the equipment held, and a number to beat
  function load() {
    st.feed = Math.floor(Math.random() * P.FEEDS.length); st.tok++; st.mode = 'play'; st.shown = 0; st.pass = false; st.pageStart = 0; st.floats = []; st.blots = []; st.call = null; st.over = 0;
    clearRound(); pickObjs.forEach(k => scene.remove(k.grp)); pickObjs = [];
    st.gear = run.gear.slice(); st.fired = {}; st.want = 0; st.mult = 1; buildKit();
    g = P.runBegin(run, P.FEEDS[st.feed], true); st.quota = P.runQuota(run, P.FEEDS[st.feed]);
    setAlign(g.m); center = buildMol(g.m, null); place(center, C0, 0.01); tween(center, C0, SC_MAIN, 0.3);
    refresh(); sfx.feed(); callout('round ' + run.round, fmt(st.quota) + ' to beat', INK);
  }
  // between rounds: three things on the page, take one
  function showPicks() {
    st.tok++; st.mode = 'pick'; clearRound(); clearKit(); st.call = null; st.floats = []; st.blots = [];
    pickObjs.forEach(k => scene.remove(k.grp)); pickObjs = [];
    picks = P.runPicks(run);
    picks.forEach((o, i) => { if (o.kind === 'gear' || o.kind === 'level') { const k = piece(o.id); k.grp.position.set(PICKX[i], 0, -2.2); k.grp.scale.setScalar(1.7); k.slot = i; pickObjs.push(k); } });
    sfx.feed(); dirty = true;
  }
  function takePick(i) {
    const o = picks[i]; if (st.mode !== 'pick' || !o) return;
    P.runTake(run, o); sfx.stamp(); st.shake = 0.6; load();
  }
  function newRun() { run = P.runNew(meta.tier); showPicks(); }
  // between runs: what the run paid, and the suppliers that can be opened with it
  function showSuppliers() { st.tok++; st.mode = 'shop'; shop.earned = run.beaten; meta.credit += run.beaten; saveMeta(); clearRound(); clearKit(); pickObjs.forEach(k => scene.remove(k.grp)); pickObjs = []; st.call = null; st.floats = []; st.blots = []; st.hover = -1; sfx.feed(); dirty = true; }
  function openSupplier(i) { const sp = P.SUPPLY[i]; if (st.mode !== 'shop' || i !== meta.tier + 1 || !sp || meta.credit < sp.cost) { sfx.bad(); return; } meta.credit -= sp.cost; meta.tier = i; saveMeta(); sfx.fanfare(); st.shake = 1.2; st.flash = 1; st.flashC = '255,214,0'; callout(sp.name + ' opened', '', '#8a6a00'); dirty = true; }
  function setHover(i) { st.hover = i; dirty = true; }
  function endRound() {
    st.mode = 'done'; st.pass = g.total >= st.quota;
    if (st.pass) { run.beaten++; sfx.fanfare(); st.shake = 1.2; st.flash = 1; st.flashC = '28,138,74'; }
    else { run.over = true; sfx.bad(); st.shake = 0.5; st.flash = 0.8; st.flashC = '200,38,28'; }
    if (run.beaten > best) { best = run.beaten; try { localStorage.setItem('aa_scheme_best', String(best)); } catch (e) { /* storage unavailable */ } }
    refresh();
  }
  function nextPage() {
    if (!P.turn(g)) { P.synEnd(g); return endRound(); }
    rowMols.forEach(freeMol); rowMols = []; st.pageStart = g.trail.length; st.turned = performance.now(); sfx.feed(); refresh();
  }
  // Everything the player sees and hears when a reaction lands. Each effect arrives on its own beat, in the order
  // it was scored: the reagent at each site, then the run, then each piece of equipment. Returns how long it takes.
  function land(o, before, wasOpen) {
    const tok = st.tok, t = g.trail[g.trail.length - 1], beats = t.ev.filter(e => e.kind !== 'grade' && e.kind !== 'catch'), base = g.total, n = beats.length;
    const gap = Math.max(34, Math.min(95, 620 / Math.max(1, n))), col = rgb(colOf(o.id));
    sfx.bond(); spray(8 + 5 * o.r.hits, col, false); st.shake = Math.max(st.shake, 0.3);
    beats.forEach((e, k) => setTimeout(() => {
      if (tok !== st.tok) return;
      st.want = base + Math.round(e.yield * e.batch); st.mult = e.batch; st.multBump = e.kind === 'x' ? 1 : Math.max(st.multBump, 0.4);
      const piece = P.GEARS[e.src] ? e.src : null, txt = (e.kind === 'x' ? 'times ' : '+') + fmtB(e.val);
      st.madeBump = 1;
      if (piece) { st.fired[piece] = { t: performance.now(), txt }; const ko = kitObjs.find(q => q.id === piece); if (ko) { burst3(ko.grp.position.x, 2.4, ko.grp.position.z, e.kind === 'x' ? 46 : 24, ko.col, e.kind === 'x' ? 13 : 9, 0.22); burst3(ko.grp.position.x, 2.4, ko.grp.position.z, 8, '#ffffff', 11, 0.12); } }
      else if (e.src === 'rare') { st.floats.push({ txt: (t.rare === 'double' ? 'double ' : 'strong ') + txt, t: performance.now(), size: 74, dx: 6, col: '#b0189a' }); spray(14, '#b0189a', false); }
      if (e.kind === 'x') { st.shake = Math.max(st.shake, 0.8); spray(10, REDINK, false); }
      else st.shake = Math.max(st.shake, 0.22);
      sfx.lock(Math.min(12, k + g.cur.path.length));
    }, 60 + k * gap));
    const dur = 60 + n * gap + 80;
    setTimeout(() => {
      if (tok !== st.tok) return;
      const now = performance.now(), gain = P.made(g) - before, route = t.ev.find(e => e.src === 'route'), len = g.cur.path.length, size = Math.log10(Math.max(10, gain));
      st.want = P.made(g); st.mult = g.cur.batch;
      st.floats.push({ txt: '+' + fmt(gain), t: now, size: 80 + 34 * size, dx: (Math.random() - 0.5) * 3, col: '#8a6a00' });
      st.shake = Math.max(st.shake, 0.4 + 0.35 * size);
      if (route) { callout(AA.rxRun.ROUTE[route.route].name, 'times ' + fmtB(route.val), '#8a6a00'); sfx.good(); st.shake = Math.max(st.shake, 1.6); spray(60, '#8a6a00', true); }
      else if (o.finish) { callout('finished', 'times ' + fmtB(1 + P.SYN.finishMult * o.r.hits), GREEN); sfx.good(); spray(50, GREEN, true); }
      else if (t.cont && len >= 3) { callout(len + ' in a row', 'times ' + fmtB(g.cur.batch), INK); spray(20 * len, INK, true); st.shake = Math.max(st.shake, 0.6 + 0.3 * len); }
      else if (wasOpen && !t.cont) callout('run closed', '', PENCIL);
      // passing the number to beat, and each doubling past it
      const m = P.made(g), times = Math.floor(m / st.quota);
      if (times >= 1 && st.over === 0) { st.over = 1; st.flash = 1; st.flashC = '28,138,74'; st.shake = 2; sfx.quota(); callout(fmt(st.quota) + ' beaten', '', GREEN); spray(90, GREEN, true); }
      else if (times >= 2 && times >= st.over * 2) { st.over = times; st.flash = 1; st.flashC = '255,214,0'; st.shake = 2.2; sfx.over(); callout(times + ' times over', '', '#8a6a00'); spray(120, '#e0b400', true); }
      dirty = true;
    }, dur);
    return dur;
  }
  function pick(i) {
    const s = slots[i], o = s && s.o, chosen = prods[i];
    if (!o || !chosen || st.mode !== 'play') return;
    setHover(-1); st.mode = 'move';
    const prev = center, k = g.pageSteps, tok = st.tok, before = P.made(g), wasOpen = g.cur.path.length > 0;
    if (s.fin) P.synFinish(g, o); else P.synTake(g, o);
    const dur = land(o, before, wasOpen);
    prods.forEach((m, j) => { if (m && j !== i) tween(m, { x: m.group.position.x, z: m.group.position.z }, 0.01, 0.12, () => freeMol(m)); }); prods = [];
    // the reaction: sparks and bits fly from every place it acts, and the view pushes in
    { const sc = prev.group.scale.x, col = rgb(colOf(s.id)); o.atoms.forEach(a => { const q = prev.at.get(a); if (!q || a.el === 'H') return; const wx = C0.x + q.x * sc, wy = q.y * sc, wz = C0.z + q.z * sc; burst3(wx, wy, wz, 26, col, 9, 0.2); burst3(wx, wy, wz, 10, '#ffffff', 12, 0.13); burst3(wx, wy, wz, 2, a.el === 'O' ? '#ff4d4d' : '#f1f5f9', 7, 0.5); }); }
    st.zoomT = performance.now();
    tween(prev, rowAt(Math.min(k, 3)), SC_ROW, 0.26); rowMols.push(prev); tween(chosen, C0, SC_MAIN, 0.26);
    // the rules move on by the clock, not by the drawing, so a stalled frame cannot leave the page stuck
    setTimeout(() => {
      if (tok !== st.tok) return;
      tweens = tweens.filter(tw => tw.m !== chosen && tw.m !== prev); place(prev, rowAt(Math.min(k, 3)), SC_ROW);
      freeMol(chosen); center = buildMol(g.m, null, false); place(center, C0, SC_MAIN); st.mode = 'play';
      // the new molecule lands with a bounce, and what changed throws off a second, smaller spray
      st.pop = 1; { const col = rgb(colOf(s.id)); o.r.made.forEach(a => { const q = center.at.get(a); if (q && a.el !== 'H') burst3(C0.x + q.x * SC_MAIN, q.y * SC_MAIN, C0.z + q.z * SC_MAIN, 12, col, 6, 0.16); }); }
      if (g.over) return endRound();
      refresh();
      // a page with nothing left to do turns itself
      if (!slots.some(q => q && q.o)) { st.mode = 'move'; setTimeout(() => { if (tok !== st.tok) return; st.mode = 'play'; nextPage(); }, 520); }
    }, Math.max(290, dur + 60));
    dirty = true;
  }
  const next = () => { if (st.mode === 'shop') return newRun(); if (st.mode !== 'done') return; if (st.pass) { run.round++; showPicks(); } else showSuppliers(); };

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
  const wrap = (x, text, w) => { const out = []; let line = ''; String(text).split(' ').forEach(t => { const n = line ? line + ' ' + t : t; if (line && x.measureText(n).width > w) { out.push(line); line = t; } else line = n; }); if (line) out.push(line); return out; };
  const ring = (x, c, rx, ry, lw, col, rot) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.ellipse(c[0], c[1], rx, ry, rot || 0.15, 0.3, 6.6); x.stroke(); };
  const swipe = (x, a, b, w, col) => { x.strokeStyle = col || HILITE; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); };
  function ends(i) { const p = SPOT[i], dx = p.x - C0.x, dz = p.z - C0.z, d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, far = i === FIN ? 3.4 : 4.9; return { a: { x: C0.x + ux * 7.4, z: C0.z + uz * 3.6 }, b: { x: p.x - ux * (far + 0.6), z: p.z - uz * far } }; }
  function drawInk(now) {
    const x = ink.x; x.clearRect(0, 0, IW, IH); x.textBaseline = 'alphabetic';
    if (st.mode === 'shop') {
      const h = px({ x: 0, z: -13 }); marker(x, 100); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('suppliers', h[0], h[1]);
      hand(x, 46); x.fillStyle = PENCIL; x.fillText('that run beat ' + shop.earned + ' rounds and paid ' + shop.earned + ' credit.   credit: ' + meta.credit, h[0], h[1] + 64);
      P.SUPPLY.forEach((sp, i) => {
        const c = px({ x: -22, z: -8 + i * 4.9 }), open = i <= meta.tier, nextUp = i === meta.tier + 1, can = nextUp && meta.credit >= sp.cost, hov = st.hover === i && nextUp;
        if (open) swipe(x, [c[0] - 10, c[1] - 22], [c[0] + 420, c[1] - 28], 64);
        marker(x, 62); x.textAlign = 'left'; x.fillStyle = open ? INK : nextUp ? INK : FAINT; x.fillText(sp.name, c[0], c[1]);
        hand(x, 40); x.fillStyle = open ? GREEN : can ? REDINK : PENCIL; x.fillText(open ? 'open' : nextUp ? (can ? 'click to open for ' + sp.cost + ' credit' : sp.cost + ' credit to open') : 'opens after the one above', c[0] + 560, c[1] - 6);
        hand(x, 38); x.fillStyle = open || nextUp ? PENCIL : FAINT;
        const things = sp.reagents.map(id => RX.CARDS[id].verb.toLowerCase()).concat(sp.gear.map(id => P.GEARS[id].name)).concat(sp.rare ? ['rare versions of reagents'] : []);
        hand(x, 34); wrap(x, 'stocks: ' + things.join(',  '), 1500).forEach((ln, j) => x.fillText(ln, c[0], c[1] + 44 + j * 34));
        if (hov) ring(x, [c[0] + 520, c[1] + 6], 620, 86, 5, INK, 0.01);
      });
      const n0 = px({ x: 0, z: 12.4 }); marker(x, 70); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('click here to start a run', n0[0], n0[1]);
      hand(x, 40); x.fillStyle = PENCIL; x.fillText('best: ' + best + ' rounds', n0[0], n0[1] + 50);
      if (st.call && now - st.call.t < 1400) { const c = px(CALL); marker(x, 110); x.fillStyle = st.call.col; x.lineWidth = 14; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(st.call.text, c[0], c[1] + 500); x.fillText(st.call.text, c[0], c[1] + 500); }
      ink.t.needsUpdate = true; return;
    }
    if (st.mode === 'pick') {
      const h = px({ x: 0, z: -11 }); marker(x, 120); x.textAlign = 'center'; swipe(x, [h[0] - 230, h[1] - 36], [h[0] + 230, h[1] - 46], 110); x.fillStyle = INK; x.fillText('take one', h[0], h[1]);
      hand(x, 50); x.fillStyle = PENCIL; x.fillText(run.round === 1 ? 'before round 1' : 'round ' + (run.round - 1) + ' beaten.  next: round ' + run.round, h[0], h[1] + 70);
      picks.forEach((o, i) => {
        const c = px({ x: PICKX[i], z: 3.6 }), isGear = o.kind === 'gear' || o.kind === 'level', title = isGear ? P.GEARS[o.id].name : RX.CARDS[o.id].verb.toLowerCase(), hov = st.hover === i;
        const kind = o.kind === 'reagent' ? 'new reagent' : o.kind === 'gear' ? 'equipment' : o.kind === 'level' ? 'level up' : o.kind === 'strong' ? 'stronger reagent' : 'more of a reagent';
        if (!isGear) { const t0 = px({ x: PICKX[i], z: -2 }); marker(x, 96); x.fillStyle = rgb(colOf(o.id)); x.fillText(title, t0[0], t0[1]); swipe(x, [t0[0] - 150, t0[1] + 22], [t0[0] + 150, t0[1] + 16], 20, rgb(colOf(o.id))); }
        hand(x, 40); x.fillStyle = PENCIL; x.fillText((i + 1) + '   ' + kind, c[0], c[1] - 56);
        if (isGear) { marker(x, hov ? 66 : 58); x.fillStyle = INK; x.fillText(title, c[0], c[1]); }
        hand(x, 40); x.fillStyle = INK; wrap(x, P.pickText(run, o), 430).forEach((w, j) => x.fillText(w, c[0], c[1] + 52 + j * 42));
        if (hov) ring(x, [c[0], c[1] - 10], 300, 150, 6, INK, 0.02);
      });
      { const k0 = px({ x: 0, z: 11.4 }); hand(x, 38); x.fillStyle = PENCIL; x.fillText('reagents: ' + run.rack.map(id => RX.CARDS[id].verb.toLowerCase()).join(',  '), k0[0], k0[1]); if (run.gear.length) x.fillText('equipment: ' + run.gear.map(id => P.GEARS[id].name + ((run.lv[id] || 1) > 1 ? ' level ' + run.lv[id] : '')).join(',  '), k0[0], k0[1] + 46); }
      const b0 = px({ x: -24, z: 12.6 }); hand(x, 40); x.textAlign = 'left'; x.fillStyle = PENCIL; x.fillText('best: ' + best + ' rounds', b0[0], b0[1]);
      ink.t.needsUpdate = true; return;
    }
    const play = st.mode === 'play', open = g.cur.path.length > 0;
    // ink thrown off by the last reaction
    st.blots = st.blots.filter(b => now - b.t < 700); st.blots.forEach(b => { const k = (now - b.t) / 700, c = px(b); x.globalAlpha = 0.5 * (1 - k); x.fillStyle = b.col; x.beginPath(); x.arc(c[0], c[1], b.r * (0.6 + k), 0, 7); x.fill(); }); x.globalAlpha = 1;
    // circled in ink on the page: what each product changed, and on the middle molecule where the reagent under the pointer acts
    const circle = (m, k, col, lw) => { const sc = m.group.scale.x, c = px({ x: m.group.position.x + k.x * sc, z: m.group.position.z + k.z * sc }), r = k.r * sc * U; x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.beginPath(); x.ellipse(c[0], c[1], r * 1.05, r, 0.1, 0.25, 6.7); x.stroke(); };
    if (play) prods.forEach(m => { if (m && m.group.scale.x > 0.3) m.marks.forEach(k => circle(m, k, m.col, 6)); });
    if (play && st.hover >= 0 && slots[st.hover] && slots[st.hover].o && center) marksOf(center, slots[st.hover].o.atoms).forEach(k => circle(center, k, rgb(colOf(slots[st.hover].id)), 9));
    // the arrows out of the molecule, and what each one does. Yellow marks the ones that continue the run
    if (play) slots.forEach((s, i) => {
      if (!s) return;
      const o = s.o, hov = st.hover === i, card = RX.CARDS[s.id], verb = card.verb.toLowerCase(), m = px(LAB[i]), e = ends(i), col = o ? INK : FAINT;
      if (o) { if (o.cont && open) swipe(x, px(e.a), px(e.b), 26); arrow(x, e.a, e.b, hov ? 9 : 6, col, o.loop ? [14, 12] : null); }
      x.save(); x.translate(m[0], m[1]); x.rotate((hash(s.id) - 0.5) * 0.07);
      hand(x, 54); x.textAlign = 'center'; const tw = x.measureText(verb).width;
      if (o) { x.strokeStyle = rgb(colOf(s.id)); x.globalAlpha = hov ? 0.85 : 0.55; x.lineWidth = hov ? 22 : 15; x.lineCap = 'round'; x.beginPath(); x.moveTo(-26 - tw / 2, 14); x.lineTo(-26 + tw / 2, 10); x.stroke(); x.globalAlpha = 1; }
      x.fillStyle = col; x.fillText(verb, -26, 0);
      const rare = o && !s.fin && g.rare ? g.rare[s.id] : null;
      if (rare) { x.strokeStyle = '#b0189a'; x.lineWidth = 5; x.lineCap = 'round'; for (let k = 0; k < 10; k++) { const a = k * 0.628 + 0.2, r0 = tw / 2 + 60, r1 = r0 + 16 + (k % 2) * 10; x.beginPath(); x.moveTo(-26 + Math.cos(a) * r0, -18 + Math.sin(a) * r0 * 0.42); x.lineTo(-26 + Math.cos(a) * r1, -18 + Math.sin(a) * r1 * 0.42); x.stroke(); } marker(x, 34); x.fillStyle = '#b0189a'; x.fillText(rare, -26, -48); hand(x, 54); }
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
      const mp = px(MULT), len = g.cur.path.length, b = st.mult, k = 1 + 0.35 * st.multBump, hot = len >= 2;
      if (hot) swipe(x, [mp[0] - 120, mp[1] - 22], [mp[0] + 120, mp[1] - 30], 70 * k);
      const heat = Math.min(6, Math.log2(Math.max(1, b))), jx = hot ? (Math.random() - 0.5) * heat * 2.2 : 0, jy = hot ? (Math.random() - 0.5) * heat * 2.2 : 0;
      marker(x, (hot ? 78 + 12 * heat : 54) * k); x.textAlign = 'center'; x.fillStyle = hot ? (heat > 3.5 ? REDINK : INK) : FAINT; x.fillText('times ' + fmtB(b), mp[0] + jx, mp[1] + jy);
      if (hot) { hand(x, 38); x.fillStyle = PENCIL; x.fillText(len + ' in a row', mp[0], mp[1] + 44); }
    }
    // equipment: its name, what it does, and what it just added
    kitObjs.forEach((k, i) => {
      const q = P.GEARS[k.id], c = px({ x: kitX(i), z: KIT.z + 2.9 }), f = st.fired[k.id], age = f ? (now - f.t) / 1000 : 9;
      const words = q.name.split(' '), l1 = words.length > 1 ? words.slice(0, -1).join(' ') : q.name, l2 = words.length > 1 ? words[words.length - 1] : '';
      hand(x, 32); x.textAlign = 'center'; x.fillStyle = INK; x.fillText(l1, c[0], c[1]); if (l2) x.fillText(l2, c[0], c[1] + 30);
      hand(x, 25); x.fillStyle = PENCIL; wrap(x, q.note, 150).forEach((ln, j) => x.fillText(ln, c[0], c[1] + (l2 ? 58 : 30) + j * 24));
      if ((run.lv[k.id] || 1) > 1) { hand(x, 28); x.fillStyle = REDINK; x.fillText('level ' + run.lv[k.id], c[0], c[1] - 34); }
      if (age < 0.6) { const up = px({ x: kitX(i), z: KIT.z - 3.4 - 1.5 * age }); marker(x, 62 * (age < 0.08 ? 1.5 : 1)); x.globalAlpha = 1 - age / 0.6; x.lineWidth = 10; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(f.txt, up[0], up[1]); x.fillStyle = k.col; x.fillText(f.txt, up[0], up[1]); x.globalAlpha = 1; }
    });
    // the round of the run, the pages, and a circle for each reaction on this page
    { const r0 = px({ x: PAGES.x + 2.2, z: PAGES.z - 3.4 }); marker(x, 50); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('round ' + run.round, r0[0], r0[1]); }
    for (let k = 1; k <= P.SYN.pages; k++) { const c = px({ x: PAGES.x + (k - 1) * 2.2, z: PAGES.z }); hand(x, 46); x.textAlign = 'center'; x.fillStyle = k === g.page ? INK : k < g.page ? PENCIL : FAINT; x.fillText(String(k), c[0], c[1] + 14); if (k === g.page) ring(x, [c[0], c[1]], 28, 26, 4, INK); }
    for (let k = 0; k < P.stepsOf(g); k++) { const c = px({ x: STEP.x + k * 2.5, z: STEP.z }); ring(x, c, 30, 27, 5, INK, 0.1 * k); if (k < g.pageSteps) { x.strokeStyle = INK; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(c[0] - 16, c[1] - 2); x.lineTo(c[0] - 4, c[1] + 14); x.lineTo(c[0] + 24, c[1] - 26); x.stroke(); } }
    // how much has been made, and the number to beat
    const q = px(MADE), beaten = st.shown >= st.quota, done = st.mode === 'done';
    marker(x, 110 * (1 + 0.22 * st.madeBump)); x.textAlign = 'right'; x.fillStyle = beaten ? GREEN : done ? REDINK : INK; x.fillText(fmt(st.shown), q[0], q[1]);
    hand(x, 38); x.fillStyle = PENCIL; x.fillText('made', q[0], q[1] - 96);
    hand(x, 60); x.textAlign = 'left'; x.fillStyle = REDINK; x.fillText(fmt(st.quota), q[0] + 84, q[1]); hand(x, 38); x.fillStyle = PENCIL; x.fillText('to beat', q[0] + 84, q[1] - 62);
    if (beaten) { x.strokeStyle = GREEN; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(q[0] + 22, q[1] - 30); x.lineTo(q[0] + 36, q[1] - 8); x.lineTo(q[0] + 60, q[1] - 62); x.stroke(); }
    // numbers rising off the molecule
    st.floats = st.floats.filter(f => now - f.t < 950); st.floats.forEach(f => { const k = (now - f.t) / 950, c = px({ x: C0.x + f.dx, z: C0.z - 2.5 - 5 * (1 - Math.pow(1 - k, 2)) }), pop = k < 0.12 ? 0.6 + k / 0.12 * 0.6 : 1.2 - Math.min(0.2, (k - 0.12)); x.globalAlpha = 1 - k * k; marker(x, f.size * pop); x.textAlign = 'center'; x.lineWidth = 12; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(f.txt, c[0], c[1]); x.fillStyle = f.col || '#8a6a00'; x.fillText(f.txt, c[0], c[1]); }); x.globalAlpha = 1;
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
      hand(x, 50); x.fillStyle = PENCIL; x.fillText(st.pass ? g.best + ' in a row at best.   click to go on' : 'run over.  ' + run.beaten + ' rounds beaten, best ' + best + '.   click to see the suppliers', c[0], c[1] + 80);
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
  function pickAt(e) {
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(ground, hit) || hit.z < -7 || hit.z > 9) return -1;
    let best = -1; PICKX.forEach((px0, i) => { if (picks[i] && Math.abs(hit.x - px0) < 7) best = i; }); return best;
  }
  function shopAt(e) {
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(ground, hit)) return -2;
    for (let i = 0; i < P.SUPPLY.length; i++) { const z = -8 + i * 4.9; if (hit.z > z - 2.3 && hit.z < z + 2.3 && hit.x > -24 && hit.x < 20) return i; }
    return hit.z > 9.5 ? -1 : -2;
  }
  cv.addEventListener('pointermove', e => { if (st.mode === 'shop') { const i = shopAt(e); if (i !== st.hover) { st.hover = i; dirty = true; } cv.style.cursor = i === -1 || i === meta.tier + 1 ? 'pointer' : ''; return; } if (st.mode === 'pick') { const i = pickAt(e); if (i !== st.hover) { st.hover = i; dirty = true; } cv.style.cursor = i >= 0 ? 'pointer' : ''; return; } const s = slotAt(e); if (s !== st.hover) setHover(s); cv.style.cursor = s >= 0 || st.mode === 'done' ? 'pointer' : ''; });
  cv.addEventListener('pointerleave', () => setHover(-1));
  cv.addEventListener('click', e => { if (st.mode === 'shop') { const i = shopAt(e); if (i === -1) next(); else if (i >= 0) openSupplier(i); return; } if (st.mode === 'pick') { const i = pickAt(e); if (i >= 0) takePick(i); return; } if (st.mode === 'done') return next(); const s = slotAt(e); if (s >= 0) pick(s); });
  root.addEventListener('keydown', e => {
    if (e.key >= '1' && e.key <= '6') { if (st.mode === 'pick') takePick(+e.key - 1); else pick(+e.key - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); }
    else if (e.key === 'r' || e.key === 'R') newRun();
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
    prods.forEach((m, i) => { if (!m || tweens.some(tw => tw.m === m)) return; const hov = st.hover === i, want = hov ? 0.7 : 0, sc = (i === FIN ? SC_FIN : SC_PROD) * (hov ? SC_HOVER : 1), k = Math.min(1, dt * 14); m.group.position.y += (want - m.group.position.y) * k; const s0 = m.group.scale.x; if (Math.abs(s0 - sc) > 0.002) { m.group.scale.setScalar(s0 + (sc - s0) * k); dirty = true; } });
    if (st.mode === 'pick' || st.mode === 'shop') dirty = true;
    const target = st.mode === 'done' && g ? g.total : st.want;
    if (st.shown !== target) { const d = target - st.shown; st.shown = Math.abs(d) < 2 ? target : st.shown + d * Math.min(1, dt * 16); dirty = true; }
    pickObjs.forEach(k => { k.grp.rotation.y += dt * 0.6; k.grp.position.y = st.hover === k.slot ? 0.8 : 0; });
    kitObjs.forEach(k => { const f = st.fired[k.id], age = f ? (now - f.t) / 1000 : 9; k.grp.position.y = age < 0.28 ? Math.sin(age / 0.28 * Math.PI) * 1.6 : 0; k.grp.scale.setScalar(age < 0.28 ? 1.18 : 1); if (age < 0.7) dirty = true; });
    if (st.multBump > 0) { st.multBump = Math.max(0, st.multBump - dt * 3.5); dirty = true; }
    if (st.floats.length || st.blots.length || st.call) dirty = true;
    st.shake *= Math.pow(0.002, dt); const sh = st.shake > 0.02 ? st.shake : 0;
    // the view pushes in on the molecule for a moment when it reacts
    { const age = (now - st.zoomT) / 1000, want = age < 0.12 ? age / 0.12 : age < 0.5 ? 1 : age < 0.85 ? 1 - (age - 0.5) / 0.35 : 0; st.zoom += (want * 0.42 - st.zoom) * Math.min(1, dt * 18); }
    const zk = st.zoom, hx = (Math.random() - 0.5) * sh * 0.6, hz = (Math.random() - 0.5) * sh * 0.6;
    cam.position.set(CAM.x + (C0.x - CAM.x) * zk + hx, CAM.y + (20 - CAM.y) * zk, CAM.z + (C0.z + 16 - CAM.z) * zk + hz);
    cam.lookAt(LOOKAT.x + (C0.x - LOOKAT.x) * zk, 0.8 * zk, LOOKAT.z + (C0.z - LOOKAT.z) * zk);
    // the hotter the run, the warmer the page
    const playing = g && (st.mode === 'play' || st.mode === 'move'), heat = playing ? Math.min(1, Math.log2(Math.max(1, st.mult)) / 6) : 0;
    if (st.flash > 0) { st.flash = Math.max(0, st.flash - dt * 2.2); veil.style.backgroundColor = 'rgba(' + st.flashC + ',' + (st.flash * 0.3).toFixed(3) + ')'; }
    else if (heat > 0.05) veil.style.backgroundColor = 'rgba(255,110,30,' + (heat * 0.2).toFixed(3) + ')';
    else if (veil.style.backgroundColor) veil.style.backgroundColor = '';
    // nothing on the page sits dead still: molecules rock, equipment trembles with the multiplier, a hot run throws bubbles
    const tt = now / 1000;
    if (center && !tweens.some(tw => tw.m === center)) { st.pop = Math.max(0, st.pop - dt * 3.2); const sp = 1 + 0.3 * st.pop * Math.cos(st.pop * 9); center.group.scale.setScalar(SC_MAIN * sp); center.group.position.y = 0.25 + 0.2 * Math.sin(tt * (1.6 + 2 * heat)); center.group.rotation.z = 0.035 * Math.sin(tt * 1.1) + (Math.random() - 0.5) * 0.03 * heat; }
    prods.forEach((m, i) => { if (m) m.group.rotation.z = 0.05 * Math.sin(tt * 1.3 + i * 1.7); });
    kitObjs.forEach((k, i) => { k.grp.rotation.z = (0.03 + 0.1 * heat) * Math.sin(tt * (3 + 9 * heat) + i * 2); });
    if (playing && heat > 0.15 && center) { st.bubble += dt * (4 + 46 * heat); while (st.bubble > 1) { st.bubble -= 1; burst3(C0.x + (Math.random() - 0.5) * 9, 0.4, C0.z + (Math.random() - 0.5) * 3.5, 1, heat > 0.6 ? '#ff8a3c' : '#ffd23f', 1.2, 0.2 + 0.25 * heat, -7); } }
    if (st.madeBump > 0) { st.madeBump = Math.max(0, st.madeBump - dt * 6); dirty = true; }
    if (heat > 0.2) dirty = true;
    stepParts(dt);
    if (dirty && now - lastInk > 24) { drawInk(now); dirty = false; lastInk = now; }
    ren.render(scene, cam);
  }
  root.addEventListener('resize', size);
  AA.rxScheme = { st, load, pick, next, setHover, takePick, newRun, showSuppliers, frame,
    openSupplier, meta,
    state: () => (!g || st.mode === 'pick' || st.mode === 'shop' ? { mode: st.mode, round: run.round, beaten: run.beaten, picks: picks.map(o => o.kind + ':' + o.id), gear: run.gear.slice(), rack: run.rack.slice(), credit: meta.credit, tier: meta.tier } : { mode: st.mode, round: run.round, beaten: run.beaten, page: g.page, steps: g.pageSteps, offer: g.kinds.slice(), usable: slots.map((s, i) => (s && s.o ? i : -1)).filter(i => i >= 0), conts: slots.map((s, i) => (s && s.o && s.o.cont && g.cur.path.length > 0 ? i : -1)).filter(i => i >= 0), made: P.made(g), gear: st.gear.slice(), rare: Object.assign({}, g.rare), times: g.cur.batch, row: g.cur.path.length, best: g.best, quota: st.quota, pass: st.pass, call: st.call && st.call.text }) };
  size(); newRun(); requestAnimationFrame(frame);
}
const el = root.document && document.getElementById('schemeapp');
if (el) { const boot = () => start(el); if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('40px Marker'), document.fonts.load('40px Hand')]).then(boot, boot); else boot(); }
})(window);
