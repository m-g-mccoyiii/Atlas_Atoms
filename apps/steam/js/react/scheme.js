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
// The page, near to far: a band along the bottom for the count, the molecule in the middle, and the molecules it
// can become in one row along the top. The round and its pages run down the left edge, equipment down the right.
const C0 = { x: -1.4, z: 3 }, SPOT = [], LAB = [], SCS = [], FIN = 7;
const STEP = { x: -21.6, z: 5.2 }, PAGES = { x: -21.6, z: 1.6 }, HIST = { x: 6, z: 6.6 };
let SC_MAIN = 1.5; const SC_HOVER = 1.3;

function start(app) {
  const cv = document.createElement('canvas'); app.append(cv);
  const ren = new T.WebGLRenderer({ canvas: cv, antialias: true });
  ren.setPixelRatio(Math.min(2, root.devicePixelRatio || 1)); ren.outputEncoding = T.sRGBEncoding;
  ren.shadowMap.enabled = true; ren.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene(); scene.background = lin('#e9e2d0');
  const cam = new T.PerspectiveCamera(34, 1, 0.5, 200), CAM = new T.Vector3(0, 43, 22.6), LOOKAT = new T.Vector3(0, 0, 0.6);
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
  // a heavy atom wears a collar in the color of the number it adds to
  const ISOC = { c13: 0x1f5fbf, o18: 0xd9a400, c14: 0xb0189a };
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
      if (a.iso) collar(grp, p, R, ISOC[a.iso]);
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
    out.forEach(o => { o.x = o.pts.reduce((t, q) => t + q.x, 0) / o.pts.length; o.z = o.pts.reduce((t, q) => t + q.z, 0) / o.pts.length; o.r = Math.max(...o.pts.map(q => Math.hypot(q.x - o.x, q.z - o.z))) + 0.7; });
    return out;
  }
  // how wide a molecule is, left to right, counting what is drawn
  const spanOf = m => { let lo = 1e9, hi = -1e9; m.at.forEach((q, a) => { if (a.el === 'H') return; lo = Math.min(lo, q.x); hi = Math.max(hi, q.x); }); return Math.max(3, hi - lo + 1.2); };
  const fitMain = m => Math.max(1.1, Math.min(1.75, 10.5 / spanOf(m)));
  function freeMol(m) { if (!m) return; scene.remove(m.group); m.group.traverse(o => { if (o.userData.own && o.geometry) { o.geometry.dispose(); o.material.dispose(); } }); }
  const place = (m, p, sc) => { m.group.position.set(p.x, 0, p.z); m.group.scale.setScalar(sc); };

  // ---------- sparks, bits and bubbles: one pool of small balls ----------
  const PN = 700, pMesh = new T.InstancedMesh(new T.SphereGeometry(1, 8, 6), new T.MeshBasicMaterial(), PN), parts = [], pM = new T.Matrix4(), pQ = new T.Quaternion(), pV = new T.Vector3(), pS = new T.Vector3(), pC = new T.Color();
  pMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); pMesh.frustumCulled = false; scene.add(pMesh);
  for (let i = 0; i < PN; i++) { parts.push({ life: 0 }); pMesh.setMatrixAt(i, pM.makeScale(0, 0, 0)); pMesh.setColorAt(i, pC.set(0xffffff)); }
  let pNext = 0;
  // g is gravity: positive falls and bounces on the page, negative rises
  // A hit throws ink onto the paper under it: blots, and streaks running out from the spot. Nothing flies through the air.
  function burst3(x, y, z, n, col) {
    const t = -y / camDir.y, gx = x + camDir.x * t, gz = z + camDir.z * t, now = performance.now();
    for (let k = 0; k < n; k++) { const a = Math.random() * 6.283, d = 0.6 + Math.random() * 3.2; st.blots.push({ x: gx + Math.cos(a) * d * 1.2, z: gz + Math.sin(a) * d * 0.75, r: 3 + Math.random() * 9, t: now, col }); }
    for (let k = 0; k < Math.ceil(n / 2); k++) { const a = Math.random() * 6.283, d0 = 0.8 + Math.random(), d1 = d0 + 1 + Math.random() * 2.6; st.blots.push({ line: true, x: gx + Math.cos(a) * d0 * 1.2, z: gz + Math.sin(a) * d0 * 0.75, x2: gx + Math.cos(a) * d1 * 1.2, z2: gz + Math.sin(a) * d1 * 0.75, r: 3 + Math.random() * 5, t: now, col }); }
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
  // the band along the bottom, left to right: the multiplier, what has been made, the number to beat, the last gain
  const BAND = 12.9, MULT = { x: -22.6, z: BAND }, MADE = { x: -11.6, z: 9.6 }, BEAT = { x: -4.8, z: 14.4 }, GAIN = { x: 14, z: 3.2 }, CALL = { x: 0, z: -3.7 }, KITP = i => ({ x: 0.2 + i * 4.75, z: 11.0 });
  let SLOTW = 10, LABF = 50;
  const st = { mode: 'play', feed: 0, hover: -1, quota: 0, shown: 0, pass: false, tok: 0, shake: 0, flash: 0, flashC: '28,138,74', pageStart: 0, floats: [], blots: [], pings: [], slashes: [], fury: 0, call: null, multBump: 0, over: 0, turned: 0, gear: [], fired: {}, want: 0, mult: 1, P: 0, R: 1, E: 1, bump: { p: 0, r: 0, e: 0 }, stains: [], pop: 0, zoom: 0, zoomT: 0, madeBump: 0, bubble: 0 };
  let g = null, slots = [], center = null, prods = [], rowMols = [], tweens = [], dirty = true, last = performance.now(), lastInk = 0;
  let run = null, picks = [], pickObjs = [], briefs = [], briefMols = [], best = 0; const meta = { credit: 0, tier: 0 }, shop = { earned: 0 };
  try { best = +(localStorage.getItem('aa_scheme_best') || 0) || 0; const m = JSON.parse(localStorage.getItem('aa_scheme_meta') || 'null'); if (m) { meta.credit = m.credit | 0; meta.tier = Math.max(0, Math.min(P.SUPPLY.length - 1, m.tier | 0)); } } catch (e) { /* storage unavailable */ }
  const saveMeta = () => { try { localStorage.setItem('aa_scheme_meta', JSON.stringify(meta)); } catch (e) { /* storage unavailable */ } };
  run = P.runNew(meta.tier);
  const PICKX = [-15, 0, 15];
  const tween = (m, to, sc, dur, done) => tweens.push({ m, fx: m.group.position.x, fz: m.group.position.z, fs: m.group.scale.x, to, sc, t: 0, dur, done });
  const colOf = id => bright(RX.CARDS[id].rgb);
  const callout = (text, sub, col, ticks) => { st.call = { text, sub: sub || '', col: col || INK, ticks: ticks || 0, t: performance.now() }; };
  const spray = (n, col, wide) => { const now = performance.now(); for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, d = 2 + Math.random() * (wide ? 22 : 7); st.blots.push({ x: C0.x + Math.cos(a) * d * 1.3, z: C0.z + Math.sin(a) * d * 0.7, r: 4 + Math.random() * (wide ? 22 : 10), t: now, col }); } };

  // ---------- equipment: objects standing on the page, each with its name and what it does pencilled under it ----------
  let kitObjs = [];
  const GLASS = std({ color: lin(0xdfe9ee), transparent: true, opacity: 0.42, roughness: 0.08 });
  function piece(id) {
    const grp = new T.Group(), inner = new T.Group(), liq = new T.Color().setHSL(hash(id + 'hue'), 0.75, 0.5), yaw = (hash(id + 'yaw') - 0.5) * 0.7;
    if (!AA.rxKit.build(id, T, inner, liq)) add(new T.BoxGeometry(2, 1.2, 2), std({ color: lin(0x3b3e42), roughness: 0.5 }), 0, 0.6, 0, inner);
    const bb = new T.Box3().setFromObject(inner), sz = bb.getSize(new T.Vector3()), k = Math.min(1.7, 3.0 / Math.max(sz.x, sz.z), 3.3 / sz.y);
    inner.scale.setScalar(k); inner.position.set(-(bb.min.x + bb.max.x) / 2 * k, -bb.min.y * k, -(bb.min.z + bb.max.z) / 2 * k);
    // each piece leans back on the page so that it is seen from the front and not from on top
    grp.add(inner); grp.rotation.x = AA.rxKit.FLAT[id] ? 0 : -0.8; grp.rotation.y = yaw; scene.add(grp);
    return { id, grp, yaw, col: '#' + liq.getHexString() };
  }
  function buildKit() {
    kitObjs.forEach(k => scene.remove(k.grp)); kitObjs = [];
    st.gear.forEach((id, i) => { const k = piece(id), q = KITP(i); k.grp.position.set(q.x, 0, q.z); k.base = 1.4; k.grp.scale.setScalar(1.4); kitObjs.push(k); });
  }
  // The flask stands by the count. Its red line is the number to beat. Past the line it boils over, harder with
  // every doubling, and what spills stains the page under it.
  const FLASK = { x: -4.8, z: 10.4 }, FB = { h: 2.3, r0: 1.3, r1: 0.36, line: 0.7 };
  const flask = (() => {
    const grp = new T.Group(), rAt = y => FB.r0 - (FB.r0 - FB.r1) * (y / FB.h), liqM = std({ color: lin(0x3aa6c8), roughness: 0.3 });
    add(new T.CylinderGeometry(FB.r1, FB.r0, FB.h, 28), GLASS, 0, FB.h / 2, 0, grp); add(new T.CylinderGeometry(FB.r1, FB.r1, 0.8, 20), GLASS, 0, FB.h + 0.4, 0, grp);
    add(new T.TorusGeometry(FB.r1 + 0.04, 0.06, 8, 24), GLASS, 0, FB.h + 0.8, 0, grp).rotation.x = Math.PI / 2;
    add(new T.TorusGeometry(rAt(FB.h * FB.line) + 0.02, 0.05, 8, 28), std({ color: lin(0xc8261c), roughness: 0.5 }), 0, FB.h * FB.line, 0, grp).rotation.x = Math.PI / 2;
    const liq = add(new T.CylinderGeometry(1, 1, 1, 24), liqM, 0, 0, 0, grp), neck = add(new T.CylinderGeometry(FB.r1 * 0.85, FB.r1 * 0.85, 0.8, 16), liqM, 0, FB.h + 0.4, 0, grp), dome = add(new T.SphereGeometry(0.5, 20, 14), liqM, 0, FB.h + 0.85, 0, grp);
    const runs = [0, 1, 2, 3].map(k => { const a = k * 1.571 + 0.5, m = add(new T.CylinderGeometry(0.09, 0.12, 1, 8), liqM, Math.cos(a) * 0.55, FB.h, Math.sin(a) * 0.55, grp); m.rotation.set(Math.sin(a) * 0.42, 0, -Math.cos(a) * 0.42); return m; });
    grp.rotation.x = -0.8; grp.scale.setScalar(1.45); grp.position.set(FLASK.x, 0, FLASK.z); grp.visible = false; scene.add(grp);
    let last = -1;
    // level 0 to 1 is empty to the red line; over is how many doublings past it
    return { grp, liqM, set(level, over) {
      const L = Math.max(0.02, Math.min(1, over > 0 ? FB.line + (1 - FB.line) * Math.min(1, over / 1.5) : FB.line * level)), y = FB.h * L;
      if (Math.abs(L - last) > 0.004) { last = L; liq.geometry.dispose(); liq.geometry = new T.CylinderGeometry(rAt(y) * 0.93, FB.r0 * 0.93, y, 24); liq.position.y = y / 2; }
      const full = over > 1.4; neck.visible = full; dome.visible = full; const d = full ? Math.min(1.8, 0.5 + 0.28 * over) : 0; dome.scale.set(d, d * 0.7, d);
      runs.forEach((m, k) => { const len = full ? Math.min(FB.h * 0.95, Math.max(0, over - 1.4 - k * 0.6) * 0.8) : 0; m.visible = len > 0.05; m.scale.y = Math.max(0.05, len); const a = k * 1.571 + 0.5, rr = rAt(FB.h - len / 2) + 0.06; m.position.set(Math.cos(a) * rr, FB.h - len / 2, Math.sin(a) * rr); });
      const hot = Math.min(1, over / 6), c = over > 0 ? new T.Color().setHSL(0.36 - 0.5 * hot + (hot > 0.72 ? 1 : 0), 0.85, 0.48) : new T.Color(0x3aa6c8); liqM.color.copy(c.convertSRGBToLinear()); this.hex = '#' + c.convertLinearToSRGB().getHexString();
    }, hex: '#3aa6c8' };
  })();
  const clearKit = () => { kitObjs.forEach(k => scene.remove(k.grp)); kitObjs = []; };

  // what stands on the page: one slot for each reagent on offer, and on the last page one for the finishing reagent
  function refresh() {
    prods.forEach(freeMol); prods = []; slots = [];
    const live = st.mode === 'play' && !g.over, o = live ? P.options(g) : {};
    g.kinds.forEach((id, i) => { slots[i] = { id, o: o[id] || null }; });
    const fin = live && g.pageSteps < P.stepsOf(g) ? P.finishOpt(g) : null; slots[FIN] = fin ? { id: fin.id, o: fin, fin: true } : null;
    { const ids = []; slots.forEach((q, i) => { if (q) ids.push(i); }); const n = ids.length, step = Math.min(10, 44 / Math.max(1, n)); SLOTW = step; LABF = Math.min(50, step * 5.4);
      ids.forEach((i, k) => { const x = (k - (n - 1) / 2) * step; SPOT[i] = { x, z: -7.4 }; LAB[i] = { x, z: -12.9 }; SCS[i] = Math.min(0.88, 0.09 * step); }); }
    slots.forEach((s, i) => {
      if (!s || !s.o) return;
      s.o.model.settle(160);
      const rings = new Map(), c = rgb(colOf(s.id)); s.o.r.made.forEach(a => rings.set(a, c));
      const m = buildMol(s.o.model, rings, true); m.col = c; SCS[i] = Math.max(0.55, Math.min(1.05, (SLOTW - 1.6) / spanOf(m))); place(m, SPOT[i], 0.01); tween(m, SPOT[i], SCS[i], 0.16 + (i % 7) * 0.03); prods[i] = m;
    });
    st.hover = -1; setHover(-1); dirty = true;
  }
  function clearRound() { tweens = []; prods.forEach(freeMol); prods = []; slots = []; freeMol(center); center = null; rowMols.forEach(freeMol); rowMols = []; }
  // the next round of the run: a molecule, the equipment held, and a number to beat
  function load() {
    st.tok++; st.mode = 'play'; st.paid = ''; st.shown = 0; st.pass = false; st.pageStart = 0; st.floats = []; st.blots = []; st.pings = []; st.slashes = []; st.fury = 0; st.call = null; st.over = 0;
    clearRound(); clearBriefs(); pickObjs.forEach(k => scene.remove(k.grp)); pickObjs = [];
    st.stains = []; st.gear = run.gear.slice(); st.fired = {}; st.want = 0; st.mult = 1; st.P = 0; st.R = 1; st.E = 1; buildKit();
    g = P.runBegin(run, run.feed, true); st.quota = run.quota; st.E = g.E; st.R = g.R;
    setAlign(g.m); center = buildMol(g.m, null); SC_MAIN = fitMain(center); place(center, C0, 0.01); tween(center, C0, SC_MAIN, 0.3);
    refresh(); sfx.feed(); callout('round ' + run.round, fmt(st.quota) + ' to beat', INK);
  }
  // between rounds: three things on the page, take one
  function showPicks() {
    st.tok++; st.mode = 'pick'; clearRound(); clearBriefs(); clearKit(); st.call = null; st.floats = []; st.blots = []; st.pings = [];
    pickObjs.forEach(k => scene.remove(k.grp)); pickObjs = [];
    picks = P.runPicks(run);
    picks.forEach((o, i) => { if (o.kind === 'gear' || o.kind === 'level') { const k = piece(o.id); k.grp.position.set(PICKX[i], 0, -2.2); k.grp.scale.setScalar(1.7); k.slot = i; pickObjs.push(k); } });
    sfx.feed(); dirty = true;
  }
  function takePick(i) {
    const o = picks[i]; if (st.mode !== 'pick' || !o) return;
    P.runTake(run, o); sfx.stamp(); st.shake = 0.6; showBriefs();
  }
  // before each round: three rounds stand on the page, each a molecule with what the round asks and what it pays
  function clearBriefs() { briefMols.forEach(freeMol); briefMols = []; }
  function showBriefs() {
    st.tok++; st.mode = 'brief'; clearRound(); clearKit(); clearBriefs(); st.call = null; st.floats = []; st.blots = []; st.pings = []; st.hover = -1;
    pickObjs.forEach(k => scene.remove(k.grp)); pickObjs = [];
    briefs = P.runBriefs(run);
    briefs.forEach((b, i) => { const mdl = P.modelOf(b.model); setAlign(mdl); const m = buildMol(mdl, null, true), sc = Math.min(1.1, 11.5 / spanOf(m)); m.sc = sc; place(m, { x: PICKX[i], z: -2.2 }, 0.01); tween(m, { x: PICKX[i], z: -2.2 }, sc, 0.2 + i * 0.05); briefMols.push(m); });
    sfx.feed(); dirty = true;
  }
  function chooseBrief(i) {
    const b = briefs[i]; if (st.mode !== 'brief' || !b) return;
    P.runChoose(run, b); sfx.stamp(); st.shake = 0.6; load();
  }
  function newRun() { run = P.runNew(meta.tier); showPicks(); }
  // between runs: what the run paid, and the suppliers that can be opened with it
  function showSuppliers() { st.tok++; st.mode = 'shop'; shop.earned = run.beaten + (run.bonus || 0); meta.credit += shop.earned; saveMeta(); clearRound(); clearBriefs(); clearKit(); pickObjs.forEach(k => scene.remove(k.grp)); pickObjs = []; st.call = null; st.floats = []; st.blots = []; st.pings = []; st.hover = -1; sfx.feed(); dirty = true; }
  function openSupplier(i) { const sp = P.SUPPLY[i]; if (st.mode !== 'shop' || i !== meta.tier + 1 || !sp || meta.credit < sp.cost) { sfx.bad(); return; } meta.credit -= sp.cost; meta.tier = i; saveMeta(); sfx.fanfare(); st.shake = 1.2; st.flash = 1; st.flashC = '255,214,0'; callout(sp.name + ' opened', '', '#8a6a00'); dirty = true; }
  function setHover(i) { st.hover = i; dirty = true; }
  function endRound() {
    st.mode = 'done'; st.call = null; st.pass = g.total >= st.quota;
    if (st.pass) { run.beaten++; P.runKeep(run, g); st.paid = P.runPay(run); sfx.fanfare(); st.shake = 1.2; st.flash = 1; st.flashC = '28,138,74'; }
    else { run.over = true; sfx.bad(); st.shake = 0.5; st.flash = 0.8; st.flashC = '200,38,28'; }
    if (run.beaten > best) { best = run.beaten; try { localStorage.setItem('aa_scheme_best', String(best)); } catch (e) { /* storage unavailable */ } }
    refresh();
  }
  function nextPage() {
    if (!P.turn(g)) { P.synEnd(g); return endRound(); }
    rowMols.forEach(freeMol); rowMols = []; st.pageStart = g.trail.length; st.turned = performance.now(); sfx.feed(); refresh();
    // a page on which no reagent acts turns itself
    if (!slots.some(q => q && q.o)) { const tok = st.tok; st.mode = 'move'; setTimeout(() => { if (tok !== st.tok) return; st.mode = 'play'; nextPage(); }, 700); }
  }
  // Everything the player sees and hears when a reaction lands. Each change arrives on its own beat, in the order it
  // was scored: the reagent at each place, then the row, then each piece of equipment. Returns how long it takes.
  const PART = { p: '#1f5fbf', h: '#1f5fbf', r: '#a87a00', e: '#b0189a' };
  function land(o, before, wasOpen, mol, reagent) {
    const tok = st.tok, t = g.trail[g.trail.length - 1], beats = t.ev, n = beats.length, rcol = rgb(colOf(reagent));
    // where on the page each place of the new molecule will be once it has landed in the middle
    const sc = SC_MAIN, marks = (mol && mol.marks) || [], spot = k => { const m = marks.length ? marks[k % marks.length] : { x: 0, z: 0 }; return { x: C0.x + m.x * sc, z: C0.z + m.z * sc }; };
    const heavy = id => { let best = null, bd = 1e9; if (mol) mol.model.atoms.forEach(a => { if (a.iso !== id) return; const q = mol.at.get(a); if (!q) return; const tt = -q.y / camDir.y, gx = q.x + camDir.x * tt, gz = q.z + camDir.z * tt; let d = 1e9; marks.forEach(m => { d = Math.min(d, Math.hypot(m.x - gx, m.z - gz)); }); if (d < bd) { bd = d; best = { x: C0.x + gx * sc, z: C0.z + gz * sc }; } }); return best; };
    // the longer the row, the harder everything on the page hits: bigger lettering, more ink, slashes across the page
    const f = Math.min(1, Math.max(0, (g.cur.path.length - 1) / 5)), FL = { p: '31,95,191', h: '31,95,191', r: '255,176,0', e: '200,24,160' }; st.fury = f;
    const ping = (at, txt, col, size, ring) => st.pings.push({ x: at.x, z: at.z, txt, col, size: size * (1 + 0.7 * f), ring, f, t: performance.now() });
    const slash = col => { for (let q = 0; q < Math.floor(f * 3.4); q++) { const a = (Math.random() - 0.5) * 1.1 + (Math.random() < 0.5 ? 0 : Math.PI), len = 8 + Math.random() * 18 * f; st.slashes.push({ x: C0.x + (Math.random() - 0.5) * 16, z: C0.z + (Math.random() - 0.5) * 7, dx: Math.cos(a) * len, dz: Math.sin(a) * len * 0.5, w: 14 + 40 * f * Math.random(), col, t: performance.now() }); } };
    sfx.bond(); st.shake = Math.max(st.shake, 0.3);
    // the reaction is played out one beat at a time, quicker as it goes: each place, each heavy atom, the row, then
    // each piece of equipment in the order it stands
    let at = 300, gap = 210, place = -1, last = { x: C0.x, z: C0.z };
    beats.forEach((e, k) => {
      const when = at; at += gap; gap = Math.max(70, gap * 0.88);
      if (e.src === 'bottle') place++;
      const pl = place;
      setTimeout(() => {
        if (tok !== st.tok) return;
        const key = e.part === 'h' ? 'p' : e.part, big = e.op === 'mul';
        st.want = e.made; st.P = e.P; st.R = e.R; st.E = e.E; st.mult = e.R * e.E; st.bump[key] = 1; st.madeBump = 1;
        const piece = P.GEARS[e.src] ? e.src : null, txt = (big ? 'times ' : '+') + fmtB(e.val);
        if (e.src === 'bottle') { last = spot(pl); ping({ x: last.x, z: last.z - (pl % 2) * 1.3 }, txt, PART.p, 50, rcol); burst3(last.x, 0, last.z, Math.round(8 + 30 * f), rcol); }
        else if (e.src === 'iso') { const h = heavy(e.iso) || last; ping({ x: h.x, z: h.z - 2.8 }, txt, PART[e.part], 62, PART[e.part]); burst3(h.x, 0, h.z, 14, PART[e.part]); }
        else if (piece) { st.fired[piece] = { t: performance.now(), txt, col: PART[e.part] }; const ko = kitObjs.find(q => q.id === piece); if (ko) burst3(ko.grp.position.x, 0.2, ko.grp.position.z, big ? 12 : 7, PART[e.part]); }
        else if (e.src === 'brief') st.floats.push({ txt, t: performance.now(), size: 66, dx: -6, col: PART[e.part] });
        else if (e.src === 'rare') st.floats.push({ txt: t.rare + ' ' + txt, t: performance.now(), size: 74, dx: 6, col: '#b0189a' });
        else if (e.src === 'homunculus') ping({ x: last.x, z: last.z - 1.6 }, 'again', PART.p, 56, PART.p);
        st.shake = Math.max(st.shake, (big ? 0.8 : e.src === 'iso' ? 0.6 : 0.25) * (1 + 2.2 * f));
        if (f >= 0.3) { slash(PART[e.part]); st.flash = Math.max(st.flash, 0.2 + 0.6 * f); st.flashC = FL[e.part] || FL.p; }
        sfx.lock(Math.min(12, k + g.cur.path.length));
      }, when);
    });
    const dur = at + 60;
    setTimeout(() => {
      if (tok !== st.tok) return;
      const now = performance.now(), gain = P.made(g) - before, route = t.ev.find(e => e.src === 'route'), len = g.cur.path.length, size = Math.log10(Math.max(10, gain));
      st.want = P.made(g); st.P = g.P; st.R = g.R; st.E = g.E; st.mult = P.mult(g);
      st.floats.push({ txt: '+' + fmt(gain), t: now, size: 80 + 34 * size, dx: (Math.random() - 0.5) * 3, col: '#8a6a00' });
      st.shake = Math.max(st.shake, 0.4 + 0.35 * size);
      // a hot reaction leaves its mark on the paper for the rest of the round
      if (st.mult >= 3) if (st.stains.length < 7) st.stains.push({ x: C0.x + (Math.random() - 0.5) * 30, z: C0.z + (Math.random() - 0.5) * 10, r: 30 + Math.random() * 70, a: 0.03 + Math.random() * 0.04, ring: Math.random() < 0.6 });
      if (route) { callout(AA.rxRun.ROUTE[route.route].name, 'row +' + fmtB(route.val), PART.r); sfx.good(); st.shake = Math.max(st.shake, 1.6); spray(60, PART.r, true); }
      else if (o.finish) { callout('finished', 'extra +' + fmtB(P.SYN.finishExtra * o.r.hits), GREEN); sfx.good(); spray(50, GREEN, true); }
      if (t.more) sfx.good();
      if (route || o.finish) { /* named above */ } else if (t.cont && len >= 3) { callout(len + ' in a row', 'row ' + fmtB(g.R), INK); spray(20 * len, INK, true); st.shake = Math.max(st.shake, 0.6 + 0.3 * len); }
      else if (wasOpen && !t.cont && !st.gear.includes('ouroboros')) callout('row broken', '', PENCIL);
      // passing the number to beat, and each doubling past it
      const m = P.made(g), times = Math.floor(m / st.quota);
      if (times >= 1 && st.over === 0) { st.over = 1; st.flash = 1; st.flashC = '28,138,74'; st.shake = 2; sfx.quota(); spray(90, GREEN, true); burst3(FLASK.x, 0.2, FLASK.z, 30, flask.hex); }
      else if (times >= 2 && times >= st.over * 2) { st.over = times; st.flash = 1; st.flashC = '255,214,0'; st.shake = 2.2; sfx.over(); spray(120, flask.hex, true); burst3(FLASK.x, 0.2, FLASK.z, 50, flask.hex); }
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
    const dur = land(o, before, wasOpen, chosen, s.id);
    prods.forEach((m, j) => { if (m && j !== i) tween(m, { x: m.group.position.x, z: m.group.position.z }, 0.01, 0.12, () => freeMol(m)); }); prods = [];
    // the reaction: sparks and bits fly from every place it acts, and the view pushes in
    { const sc = prev.group.scale.x, col = rgb(colOf(s.id)); o.atoms.forEach(a => { const q = prev.at.get(a); if (!q || a.el === 'H') return; const wx = C0.x + q.x * sc, wy = q.y * sc, wz = C0.z + q.z * sc; burst3(wx, wy, wz, 12, col); }); }
    st.zoomT = performance.now();
    tween(prev, HIST, 0.02, 0.24, () => freeMol(prev)); tween(chosen, C0, SC_MAIN, 0.26);
    // the rules move on by the clock, not by the drawing, so a stalled frame cannot leave the page stuck
    setTimeout(() => {
      if (tok !== st.tok) return;
      tweens = tweens.filter(tw => tw.m !== chosen && tw.m !== prev); freeMol(prev);
      freeMol(chosen); setAlign(g.m); center = buildMol(g.m, null, false); SC_MAIN = fitMain(center); place(center, C0, SC_MAIN); st.mode = 'play';
      // the new molecule lands with a bounce, and what changed throws off a second, smaller spray
      st.pop = 1; { const col = rgb(colOf(s.id)); o.r.made.forEach(a => { const q = center.at.get(a); if (q && a.el !== 'H') burst3(C0.x + q.x * SC_MAIN, q.y * SC_MAIN, C0.z + q.z * SC_MAIN, 5, col); }); }
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
  // letters text no wider than w, shrinking it if it has to. Returns the size used
  const fit = (x, text, size, w, font) => { let n = size; font(x, n); while (n > 14 && x.measureText(text).width > w) { n -= 4; font(x, n); } return n; };
  // one tick for each time the number to beat has been reached. Past ten, the count and a single tick
  function tickRow(x, cx, cy, n, size, col) {
    const one = (px0, py0) => { x.beginPath(); x.moveTo(px0 - size * 0.42, py0 - size * 0.05); x.lineTo(px0 - size * 0.12, py0 + size * 0.32); x.lineTo(px0 + size * 0.48, py0 - size * 0.5); x.stroke(); };
    x.strokeStyle = col; x.lineWidth = size * 0.2; x.lineCap = 'round'; x.lineJoin = 'round';
    if (n > 10) { marker(x, size * 1.5); x.textAlign = 'right'; x.fillStyle = col; x.fillText(String(n), cx - size * 0.2, cy + size * 0.4); one(cx + size * 0.7, cy); return; }
    for (let k = 0; k < n; k++) one(cx + (k - (n - 1) / 2) * size * 1.15, cy);
  }
  const wrap = (x, text, w) => { const out = []; let line = ''; String(text).split(' ').forEach(t => { const n = line ? line + ' ' + t : t; if (line && x.measureText(n).width > w) { out.push(line); line = t; } else line = n; }); if (line) out.push(line); return out; };
  const ring = (x, c, rx, ry, lw, col, rot) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.ellipse(c[0], c[1], rx, ry, rot || 0.15, 0.3, 6.6); x.stroke(); };
  // a coin of credit, drawn in ink
  function coin(x, cx, cy, r) { x.fillStyle = '#e9b93a'; x.beginPath(); x.arc(cx, cy, r, 0, 6.3); x.fill(); x.strokeStyle = '#8a6a00'; x.lineWidth = 4; x.beginPath(); x.arc(cx, cy, r, 0, 6.3); x.stroke(); x.beginPath(); x.arc(cx, cy, r * 0.55, 0.4, 5.2); x.stroke(); }
  // the marks of the three numbers: a ring for places, chevrons for the row, a star for extra
  function glyph(x, k, cx, cy, s, col) {
    x.strokeStyle = col || PART[k]; x.lineWidth = Math.max(3, s * 0.15); x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath();
    if (k === 'p') x.arc(cx, cy, s * 0.34, 0, 6.3);
    else if (k === 'r') [-0.2, 0.18].forEach(d => { x.moveTo(cx + (d - 0.15) * s, cy - 0.3 * s); x.lineTo(cx + (d + 0.15) * s, cy); x.lineTo(cx + (d - 0.15) * s, cy + 0.3 * s); });
    else for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3 + 0.26; x.moveTo(cx - Math.cos(a) * s * 0.38, cy - Math.sin(a) * s * 0.38); x.lineTo(cx + Math.cos(a) * s * 0.38, cy + Math.sin(a) * s * 0.38); }
    x.stroke();
  }
  // lettering in which {p}, {r} and {e} are drawn as the marks. Words take the color of the mark before them
  function inkLine(x, str, cx, y, size, col, align) {
    const bits = String(str).split(/(\{[pre]\})/).filter(Boolean); hand(x, size);
    const ws = bits.map(b => (b[0] === '{' ? size * 0.95 : x.measureText(b).width)), tot = ws.reduce((a, b) => a + b, 0);
    let px0 = align === 'right' ? cx - tot : align === 'left' ? cx : cx - tot / 2, cur = col; x.textAlign = 'left';
    bits.forEach((b, i) => { if (b[0] === '{') { glyph(x, b[1], px0 + ws[i] / 2, y - size * 0.3, size * 0.85); cur = PART[b[1]]; } else { x.fillStyle = cur || col; x.fillText(b, px0, y); } px0 += ws[i]; });
    return tot;
  }
  const swipe = (x, a, b, w, col) => { x.strokeStyle = col || HILITE; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); };
  function ends(i) { const p = SPOT[i], dx = p.x - C0.x, dz = p.z + 3 - C0.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d; return { a: { x: C0.x + ux * 8.6, z: C0.z + uz * 3.6 }, b: { x: p.x - ux * 0.6, z: p.z + 2.9 } }; }
  function drawInk(now) {
    const x = ink.x; x.clearRect(0, 0, IW, IH); x.textBaseline = 'alphabetic';
    if (st.mode === 'shop') {
      const h = px({ x: 0, z: -13 }); marker(x, 100); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('suppliers', h[0], h[1]);
      hand(x, 46); x.fillStyle = PENCIL; x.fillText('that run beat ' + shop.earned + ' rounds and paid ' + shop.earned + ' credit.   credit: ' + meta.credit, h[0], h[1] + 64);
      P.SUPPLY.forEach((sp, i) => {
        const c = px({ x: -20, z: -9.2 + i * 3.6 }), open = i <= meta.tier, nextUp = i === meta.tier + 1, can = nextUp && meta.credit >= sp.cost, hov = st.hover === i && nextUp;
        if (open) swipe(x, [c[0] - 10, c[1] - 18], [c[0] + x.measureText(sp.name).width * 1.5 + 60, c[1] - 22], 50);
        marker(x, 50); x.textAlign = 'left'; x.fillStyle = open ? INK : nextUp ? INK : FAINT; x.fillText(sp.name, c[0], c[1]);
        hand(x, 40); x.fillStyle = open ? GREEN : can ? REDINK : PENCIL; x.fillText(open ? 'open' : nextUp ? (can ? 'click to open for ' + sp.cost + ' credit' : sp.cost + ' credit to open') : 'opens after the one above', c[0] + 760, c[1] - 6);
        hand(x, 38); x.fillStyle = open || nextUp ? PENCIL : FAINT;
        const things = sp.reagents.map(id => RX.CARDS[id].verb.toLowerCase()).concat(sp.gear.map(id => P.GEARS[id].name)).concat(sp.rare ? ['rare versions of reagents'] : []);
        hand(x, 30); wrap(x, (things.length ? 'stocks: ' + things.join(',  ') : ''), 1400).slice(0, 1).forEach((ln, j) => x.fillText(ln, c[0], c[1] + 40 + j * 30));
        if (hov) ring(x, [c[0] + 520, c[1] + 6], 620, 86, 5, INK, 0.01);
      });
      const n0 = px({ x: 0, z: 12.4 }); marker(x, 70); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('click here to start a run', n0[0], n0[1]);
      hand(x, 40); x.fillStyle = PENCIL; x.fillText('best: ' + best + ' rounds', n0[0], n0[1] + 50);
      if (st.call && now - st.call.t < 1400) { const c = px(CALL); marker(x, 110); x.fillStyle = st.call.col; x.lineWidth = 14; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(st.call.text, c[0], c[1] + 500); x.fillText(st.call.text, c[0], c[1] + 500); }
      ink.t.needsUpdate = true; return;
    }
    if (st.mode === 'brief') {
      const h = px({ x: 0, z: -11 }); marker(x, 120); x.textAlign = 'center'; swipe(x, [h[0] - 300, h[1] - 36], [h[0] + 300, h[1] - 46], 110); x.fillStyle = INK; x.fillText('round ' + run.round, h[0], h[1]);
      briefs.forEach((b, i) => {
        const c = px({ x: PICKX[i], z: 3.2 }), B = P.BRIEF[b.brief], hov = st.hover === i;
        hand(x, 40); x.textAlign = 'center'; x.fillStyle = PENCIL; x.fillText(String(i + 1), c[0] - 205, c[1] - 6);
        fit(x, B.name, hov ? 76 : 68, 350, marker); x.textAlign = 'center'; x.fillStyle = INK; x.fillText(B.name, c[0], c[1]);
        if (B.note) inkLine(x, B.note, c[0], c[1] + 62, 40, INK);
        const y = c[1] + 150; marker(x, 62); x.textAlign = 'center'; x.fillStyle = REDINK; x.fillText(fmt(b.quota), c[0], y);
        for (let n = 0; n < (b.pays || 0); n++) coin(x, c[0] - ((b.pays - 1) * 26) + n * 52, y + 52, 20);
        if (hov) swipe(x, [c[0] - 150, c[1] + 16], [c[0] + 150, c[1] + 10], 16);
      });
      { const k0 = px({ x: 0, z: 12.1 }); hand(x, 38); x.textAlign = 'center'; x.fillStyle = PENCIL; x.fillText('reagents: ' + run.rack.map(id => RX.CARDS[id].verb.toLowerCase()).join(',  '), k0[0], k0[1]); if (run.gear.length) x.fillText('equipment: ' + run.gear.map(id => P.GEARS[id].name + ((run.lv[id] || 1) > 1 ? ' level ' + run.lv[id] : '')).join(',  '), k0[0], k0[1] + 46); }
      ink.t.needsUpdate = true; return;
    }
    if (st.mode === 'pick') {
      const h = px({ x: 0, z: -11 }); marker(x, 120); x.textAlign = 'center'; swipe(x, [h[0] - 230, h[1] - 36], [h[0] + 230, h[1] - 46], 110); x.fillStyle = INK; x.fillText('take one', h[0], h[1]);
      hand(x, 50); x.fillStyle = PENCIL; x.fillText(run.round === 1 ? 'before round 1' : 'round ' + (run.round - 1) + ' beaten.  next: round ' + run.round, h[0], h[1] + 70);
      picks.forEach((o, i) => {
        const c = px({ x: PICKX[i], z: 3.6 }), isGear = o.kind === 'gear' || o.kind === 'level', title = isGear ? P.GEARS[o.id].name : RX.CARDS[o.id].verb.toLowerCase() + (o.kind === 'reagent' && P.PAIR[o.id] ? ' + ' + RX.CARDS[P.PAIR[o.id]].verb.toLowerCase() : ''), hov = st.hover === i;
        const kind = o.kind === 'reagent' ? 'new reagent' : o.kind === 'gear' ? 'equipment' : o.kind === 'level' ? 'level up' : o.kind === 'strong' ? 'stronger reagent' : 'more of a reagent';
        if (!isGear) { const t0 = px({ x: PICKX[i], z: -2 }); fit(x, title, 96, 440, marker); x.textAlign = 'center'; x.fillStyle = rgb(colOf(o.id)); x.fillText(title, t0[0], t0[1]); swipe(x, [t0[0] - 150, t0[1] + 22], [t0[0] + 150, t0[1] + 16], 20, rgb(colOf(o.id))); }
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
    { const occ = st.gear.filter(id => P.GEARS[id].kin === 'occult').length; x.strokeStyle = 'rgba(70,30,90,0.42)'; x.lineWidth = 3; x.lineCap = 'round';
      for (let k = 0; k < occ * 5; k++) { const dp = px({ x: -26 + 3.4 * hash('dx' + k), z: -12.5 + 6 * hash('dy' + k) }), cx = dp[0], cy = dp[1], r = 13 + 12 * hash('dr' + k), kind = k % 3;
        x.beginPath();
        if (kind === 0) { for (let q = 0; q <= 5; q++) { const a = -1.571 + q * 2.513; if (q) x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); else x.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } }
        else if (kind === 1) { x.ellipse(cx, cy, r, r * 0.5, 0, 0, 7); x.moveTo(cx + r * 0.25, cy); x.arc(cx, cy, r * 0.25, 0, 7); }
        else { for (let q = 0; q < 4; q++) { x.moveTo(cx - r + q * r * 0.5, cy - r * 0.6); x.lineTo(cx - r + q * r * 0.5, cy + r * 0.6); } x.moveTo(cx - r * 1.2, cy + r * 0.5); x.lineTo(cx + r * 0.9, cy - r * 0.5); }
        x.stroke(); } }
    st.stains.forEach(k => { const c = px(k); if (k.ring) { x.strokeStyle = 'rgba(120,70,20,' + (k.a * 1.6) + ')'; x.lineWidth = k.r * 0.16; x.beginPath(); x.ellipse(c[0], c[1], k.r, k.r * 0.9, 0.3, 0, 7); x.stroke(); } else { x.fillStyle = 'rgba(150,80,20,' + k.a + ')'; x.beginPath(); x.ellipse(c[0], c[1], k.r, k.r * 0.8, 0.5, 0, 7); x.fill(); } });
    // ink thrown off by the last reaction
    if (g && st.shown >= st.quota && st.quota > 0) { const ov = Math.log2(Math.max(1, st.shown / st.quota)), c = px({ x: FLASK.x, z: FLASK.z + 0.9 }), r = Math.min(140, 46 + 20 * ov); x.globalAlpha = 0.3; x.fillStyle = flask.hex; x.beginPath(); x.ellipse(c[0], c[1], r * 1.25, r * 0.6, 0.05, 0, 6.3); x.fill(); x.beginPath(); x.ellipse(c[0] + r * 0.9, c[1] + r * 0.2, r * 0.45, r * 0.25, 0.4, 0, 6.3); x.fill(); x.beginPath(); x.ellipse(c[0] - r, c[1] - r * 0.1, r * 0.35, r * 0.2, -0.3, 0, 6.3); x.fill(); x.globalAlpha = 1; }
    st.slashes = st.slashes.filter(q => now - q.t < 520); st.slashes.forEach(q => { const k = (now - q.t) / 520, g0 = Math.min(1, k * 5), a = px({ x: q.x - q.dx / 2, z: q.z - q.dz / 2 }), b = px({ x: q.x - q.dx / 2 + q.dx * g0, z: q.z - q.dz / 2 + q.dz * g0 }); x.globalAlpha = 0.5 * (1 - k); swipe(x, a, b, q.w, q.col); x.globalAlpha = 1; });
    st.blots = st.blots.filter(b => now - b.t < 700); st.blots.forEach(b => { const k = (now - b.t) / 700, c = px(b); x.globalAlpha = (0.55 + 0.4 * st.fury) * (1 - k); if (b.line) { const c2 = px({ x: b.x + (b.x2 - b.x) * Math.min(1, k * 4), z: b.z + (b.z2 - b.z) * Math.min(1, k * 4) }); x.strokeStyle = b.col; x.lineWidth = b.r; x.lineCap = 'round'; x.beginPath(); x.moveTo(c[0], c[1]); x.lineTo(c2[0], c2[1]); x.stroke(); } else { x.fillStyle = b.col; x.beginPath(); x.arc(c[0], c[1], b.r * (0.6 + k), 0, 7); x.fill(); } }); x.globalAlpha = 1;
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
      hand(x, LABF); x.textAlign = 'center'; const tw = x.measureText(verb).width;
      if (o) { x.strokeStyle = rgb(colOf(s.id)); x.globalAlpha = hov ? 0.85 : 0.55; x.lineWidth = hov ? 22 : 15; x.lineCap = 'round'; x.beginPath(); x.moveTo(-26 - tw / 2, 14); x.lineTo(-26 + tw / 2, 10); x.stroke(); x.globalAlpha = 1; }
      x.fillStyle = col; x.fillText(verb, -26, 0);
      const rare = o && !s.fin && g.rare ? g.rare[s.id] : null;
      if (rare) { x.strokeStyle = '#b0189a'; x.lineWidth = 5; x.lineCap = 'round'; for (let k = 0; k < 10; k++) { const a = k * 0.628 + 0.2, r0 = tw / 2 + 60, r1 = r0 + 16 + (k % 2) * 10; x.beginPath(); x.moveTo(-26 + Math.cos(a) * r0, -18 + Math.sin(a) * r0 * 0.42); x.lineTo(-26 + Math.cos(a) * r1, -18 + Math.sin(a) * r1 * 0.42); x.stroke(); } marker(x, 34); x.fillStyle = '#b0189a'; x.fillText(rare, -26, -46); hand(x, LABF); }
      hand(x, 34); x.fillStyle = 'rgba(90,86,78,0.7)'; x.fillText(s.fin ? 'F' : String(i + 1), -26 - tw / 2 - 22, -2);
      if (o) { hand(x, 52); x.fillStyle = col; x.fillText(String(o.r.hits), tw / 2 + 18, -2); ring(x, [tw / 2 + 19, -18], 27, 25, 4, col); if (s.fin) { hand(x, 34); x.fillStyle = PENCIL; x.fillText('last step', -26, 44); } }
      if (!s.fin) { x.strokeStyle = o ? PENCIL : FAINT; x.lineWidth = 4; for (let k = 0; k < (g.left[s.id] || 0); k++) { x.beginPath(); x.moveTo(-26 - tw / 2 + k * 13, 32); x.lineTo(-22 - tw / 2 + k * 13, 54); x.stroke(); } }
      x.restore();
    });
    // the three numbers that multiply into what is made: places, row and extra. Each jumps when it changes
    if (st.mode !== 'done') {
      const mp = px(MULT), len = g.cur.path.length;
      [['p', fmt(st.P)], ['r', fmtB(st.R)], ['e', fmtB(st.E)]].forEach((q, i) => {
        const cx = mp[0] + 70 + i * 150, live = q[0] === 'p' ? st.P > 0 : q[0] === 'r' ? st.R > 1 : st.E > 1, k = 1 + 0.4 * st.bump[q[0]];
        if (live && q[0] === 'r' && len >= 2) swipe(x, [cx - 52, mp[1] - 24], [cx + 52, mp[1] - 30], 62);
        fit(x, q[1], 64 * k, 136, marker); x.textAlign = 'center'; x.fillStyle = live ? PART[q[0]] : FAINT; x.fillText(q[1], cx, mp[1]);
        glyph(x, q[0], cx, mp[1] - 84, 40, live ? PART[q[0]] : FAINT);
      });
      // one small chevron for each reaction in the row that is open
      for (let k = 0; k < Math.min(9, len); k++) glyph(x, 'r', mp[0] + 220 - (Math.min(9, len) - 1) * 9 + k * 18, mp[1] + 34, 16, PART.r);
    }
    // equipment: a short token beside it. Its name and what it does are written out only under the pointer
    kitObjs.forEach((k, i) => {
      const q = P.GEARS[k.id], kp = KITP(i), c = px({ x: kp.x, z: kp.z + 3.6 }), f = st.fired[k.id], age = f ? (now - f.t) / 1000 : 9, lv = run.lv[k.id] || 1;
      const tw = inkLine(x, q.tok || '', c[0], c[1], 32, INK); fit(x, q.name, 26, 145, hand); x.textAlign = 'center'; x.fillStyle = PENCIL; x.fillText(q.name, c[0], c[1] - 40);
      for (let n = 1; n < lv; n++) { x.fillStyle = INK; x.beginPath(); x.arc(c[0] + tw / 2 + 18 + (n - 1) * 20, c[1] - 12, 6, 0, 6.3); x.fill(); }
      if (st.kitHover === i) { const h0 = px({ x: kp.x, z: kp.z - 6.4 }); x.lineJoin = 'round'; x.textAlign = 'center'; x.strokeStyle = '#f3eddc';
        hand(x, 40); x.lineWidth = 14; x.strokeText(q.name, h0[0], h0[1]); x.fillStyle = INK; x.fillText(q.name, h0[0], h0[1]);
        hand(x, 28); wrap(x, q.note, 380).forEach((ln, j) => { x.lineWidth = 12; x.strokeText(ln, h0[0], h0[1] + 34 + j * 30); x.fillStyle = PENCIL; x.fillText(ln, h0[0], h0[1] + 34 + j * 30); }); }
      if (age < 0.7) { const up = px({ x: kp.x, z: kp.z - 4.2 - (i % 2) * 1.5 - 1.2 * age }); fit(x, f.txt, 58 * (age < 0.08 ? 1.3 : 1), 160, marker); x.textAlign = 'center'; x.globalAlpha = 1 - age / 0.7; x.lineWidth = 12; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(f.txt, up[0], up[1]); x.fillStyle = f.col || k.col; x.fillText(f.txt, up[0], up[1]); x.globalAlpha = 1; }
    });
    // the round of the run, the pages, and a circle for each reaction on this page
    { const r0 = px({ x: PAGES.x + 2.2, z: PAGES.z - 3.2 }); marker(x, 50); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('round ' + run.round, r0[0], r0[1]); }
    if (g.brief !== 'plain') { const B = P.BRIEF[g.brief], b0 = px({ x: PAGES.x + 2.2, z: -5.4 }); hand(x, 36); x.textAlign = 'center'; x.fillStyle = INK; x.fillText(B.name, b0[0], b0[1]); inkLine(x, B.note, b0[0], b0[1] + 36, 28, PENCIL); }
    for (let k = 1; k <= P.pagesOf(g); k++) { const c = px({ x: PAGES.x + (k - 1) * 2.2, z: PAGES.z }); hand(x, 46); x.textAlign = 'center'; x.fillStyle = k === g.page ? INK : k < g.page ? PENCIL : FAINT; x.fillText(String(k), c[0], c[1] + 14); if (k === g.page) ring(x, [c[0], c[1]], 28, 26, 4, INK); }
    // one circle for each reaction on this page. A done one is filled with the color of its reagent, and yellow joins those in a row
    const tr = g.trail.slice(st.pageStart);
    for (let k = 1; k < tr.length; k++) if (tr[k].cont) { const a0 = px({ x: STEP.x + (k - 1) * 2.5, z: STEP.z }), b0 = px({ x: STEP.x + k * 2.5, z: STEP.z }); swipe(x, a0, b0, 34); }
    for (let k = 0; k < P.stepsOf(g); k++) { const c = px({ x: STEP.x + k * 2.5, z: STEP.z }); ring(x, c, 30, 27, 5, INK, 0.1 * k); if (k < g.pageSteps) { x.strokeStyle = tr[k] ? rgb(colOf(tr[k].id)) : INK; x.fillStyle = x.strokeStyle; x.beginPath(); x.ellipse(c[0] + 1, c[1], 19, 17, 0.2, 0, 6.3); x.fill(); } }
    // how much has been made, and the number to beat
    const q = px(MADE), bq = px(BEAT), beaten = st.shown >= st.quota, done = st.mode === 'done';
    { const txt = fmt(st.shown), size = fit(x, txt, 92 * (1 + 0.12 * st.madeBump), 270, marker), mw = x.measureText(txt).width; x.textAlign = 'right'; x.fillStyle = beaten ? GREEN : done ? REDINK : INK; x.fillText(txt, q[0], q[1]);
    }
    marker(x, 46); x.textAlign = 'center'; x.fillStyle = REDINK; x.fillText(fmt(st.quota), bq[0], bq[1]); x.strokeStyle = REDINK; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(bq[0] - 60, bq[1] - 46); x.lineTo(bq[0] + 60, bq[1] - 49); x.stroke();
    // what the last reaction made, at the right end of the band, with anything a rare reagent added above it
    st.pings = st.pings.filter(q => now - q.t < 800); st.pings.forEach(q => {
      const k = (now - q.t) / 800, c = px(q), up = c[1] - 30 - 46 * (1 - Math.pow(1 - k, 2));
      if (k < 0.6) { x.globalAlpha = 1 - k / 0.6; x.strokeStyle = q.ring; x.lineWidth = 7 * (1 - k / 0.6) + 2; x.beginPath(); x.ellipse(c[0], c[1], 14 + (90 + 140 * q.f) * k, 11 + (70 + 110 * q.f) * k, 0.1, 0, 6.3); x.stroke(); if (q.f > 0.4) { x.beginPath(); x.ellipse(c[0], c[1], 8 + (50 + 80 * q.f) * k, 6 + (40 + 60 * q.f) * k, 0.1, 0, 6.3); x.stroke(); } }
      x.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1; marker(x, q.size * (k < 0.1 ? 1.5 - 5 * k : 1)); x.textAlign = 'center'; x.lineJoin = 'round'; x.lineWidth = 10; x.strokeStyle = '#f3eddc'; x.strokeText(q.txt, c[0], up); x.fillStyle = q.col; x.fillText(q.txt, c[0], up); x.globalAlpha = 1; });
    st.floats = st.floats.filter(f => now - f.t < 1100); { let lane = 0; st.floats.forEach(f => { f.lane = f.col === '#8a6a00' ? 0 : ++lane; }); }
    st.floats.forEach(f => { const k = (now - f.t) / 1100, rare = f.lane > 0, c = px({ x: GAIN.x, z: GAIN.z - f.lane * 2.6 - 0.5 * k }), pop = k < 0.1 ? 1.4 - 4 * k : 1; x.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1; fit(x, f.txt, Math.min(rare ? 54 : 96, f.size) * pop, 250, marker); x.textAlign = 'left'; x.lineWidth = 10; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(f.txt, c[0], c[1]); x.fillStyle = f.col || '#8a6a00'; x.fillText(f.txt, c[0], c[1]); }); x.globalAlpha = 1;
    // a line lettered across the page when something worth naming happens, or a row of ticks when the number is beaten again
    if (st.call && now - st.call.t < 1400) {
      const k = (now - st.call.t) / 1400, c = px(CALL), pop = k < 0.1 ? 1.5 - 5 * k : 1, al = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
      x.save(); x.translate(c[0], c[1]); x.rotate(-0.03); x.scale(pop, pop); x.globalAlpha = al;
      if (st.call.ticks) { const n = st.call.ticks, w = (n > 10 ? 3 : n) * 110; swipe(x, [-w / 2 - 40, -20], [w / 2 + 40, -28], 120); tickRow(x, 0, -24, n, 92, st.call.col); }
      else {
        fit(x, st.call.text, 104, 900, marker); x.textAlign = 'center'; const tw = x.measureText(st.call.text).width;
        swipe(x, [-tw / 2 - 20, -30], [tw / 2 + 20, -38], 96);
        x.lineWidth = 14; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(st.call.text, 0, 0); x.fillStyle = st.call.col; x.fillText(st.call.text, 0, 0);
        if (st.call.sub) { marker(x, 50); x.fillStyle = REDINK; x.strokeText(st.call.sub, tw / 2 + 150, -8); x.fillText(st.call.sub, tw / 2 + 150, -8); }
      }
      x.restore(); x.globalAlpha = 1;
    } else if (st.call) st.call = null;
    // the round is over: how it went, and where to click
    if (done) {
      const c = px({ x: 0, z: -9 }), ratio = g.total / st.quota;
      marker(x, 130); x.textAlign = 'center'; x.lineWidth = 16; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.fillStyle = st.pass ? GREEN : REDINK;
      const txt = st.pass ? 'beaten' : fmt(st.quota - g.total) + ' short', tw = x.measureText(txt).width, n = Math.floor(ratio);
      x.strokeText(txt, c[0], c[1]); x.fillText(txt, c[0], c[1]);
      hand(x, 50); x.fillStyle = PENCIL; for (let n = 0; n < (st.pass ? st.paid || 0 : 0); n++) coin(x, c[0] + tw / 2 + 60 + n * 56, c[1] - 36, 22);
      x.fillText(st.pass ? '' : 'run over.  ' + run.beaten + ' rounds beaten, best ' + best + '.   click to see the suppliers', c[0], c[1] + 80);
    }
    ink.t.needsUpdate = true;
  }

  // ---------- pointer and keys ----------
  const ray = new T.Raycaster(), ndc = new T.Vector2(), ground = new T.Plane(new T.Vector3(0, 1, 0), 0), hit = new T.Vector3();
  function slotAt(e) {
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(ground, hit) || st.mode !== 'play') return -1;
    let slot = -1; slots.forEach((s, i) => { if (!s || !s.o) return; const p = SPOT[i]; if (p && Math.abs(hit.x - p.x) < SLOTW / 2 && hit.z > -14.5 && hit.z < p.z + 3) slot = i; });
    return slot;
  }
  function pickAt(e, arr) {
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(ground, hit) || hit.z < -7 || hit.z > 9) return -1;
    let best = -1; PICKX.forEach((px0, i) => { if ((arr || picks)[i] && Math.abs(hit.x - px0) < 7) best = i; }); return best;
  }
  function shopAt(e) {
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(ground, hit)) return -2;
    for (let i = 0; i < P.SUPPLY.length; i++) { const z = -9.2 + i * 3.6; if (hit.z > z - 1.7 && hit.z < z + 1.9 && hit.x > -24 && hit.x < 20) return i; }
    return hit.z > 9.5 ? -1 : -2;
  }
  cv.addEventListener('pointermove', e => { if (st.mode === 'brief') { const i = pickAt(e, briefs); if (i !== st.hover) { st.hover = i; dirty = true; } cv.style.cursor = i >= 0 ? 'pointer' : ''; return; } if (st.mode === 'shop') { const i = shopAt(e); if (i !== st.hover) { st.hover = i; dirty = true; } cv.style.cursor = i === -1 || i === meta.tier + 1 ? 'pointer' : ''; return; } if (st.mode === 'pick') { const i = pickAt(e); if (i !== st.hover) { st.hover = i; dirty = true; } cv.style.cursor = i >= 0 ? 'pointer' : ''; return; } const s = slotAt(e); if (s !== st.hover) setHover(s); { let kh = -1; kitObjs.forEach((k, i) => { const kp = KITP(i); if (Math.abs(hit.x - kp.x) < 2.4 && hit.z > kp.z - 4.5 && hit.z < kp.z + 3.8) kh = i; }); if (kh !== st.kitHover) { st.kitHover = kh; dirty = true; } } cv.style.cursor = s >= 0 || st.mode === 'done' ? 'pointer' : ''; });
  cv.addEventListener('pointerleave', () => setHover(-1));
  cv.addEventListener('click', e => { if (st.mode === 'brief') { const i = pickAt(e, briefs); if (i >= 0) chooseBrief(i); return; } if (st.mode === 'shop') { const i = shopAt(e); if (i === -1) next(); else if (i >= 0) openSupplier(i); return; } if (st.mode === 'pick') { const i = pickAt(e); if (i >= 0) takePick(i); return; } if (st.mode === 'done') return next(); const s = slotAt(e); if (s >= 0) pick(s); });
  root.addEventListener('keydown', e => {
    if (e.key >= '1' && e.key <= '6') { if (st.mode === 'pick') takePick(+e.key - 1); else if (st.mode === 'brief') chooseBrief(+e.key - 1); else pick(+e.key - 1); }
    else if (e.key === 'f' || e.key === 'F') pick(FIN);
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
    prods.forEach((m, i) => { if (!m || tweens.some(tw => tw.m === m)) return; const hov = st.hover === i, want = hov ? 0.7 : 0, sc = (SCS[i] || 0.8) * (hov ? SC_HOVER : 1), k = Math.min(1, dt * 14); m.group.position.y += (want - m.group.position.y) * k; const s0 = m.group.scale.x; if (Math.abs(s0 - sc) > 0.002) { m.group.scale.setScalar(s0 + (sc - s0) * k); dirty = true; } });
    if (st.mode === 'pick' || st.mode === 'shop' || st.mode === 'brief') dirty = true;
    if (st.mode === 'brief') briefMols.forEach((m, i) => { if (!tweens.some(tw => tw.m === m)) { m.group.scale.setScalar(m.sc * (st.hover === i ? 1.15 : 1)); m.group.rotation.z = 0.05 * Math.sin(now / 1000 * 1.3 + i * 1.7); } });
    const target = st.mode === 'done' && g ? g.total : st.want;
    if (st.shown !== target) { const d = target - st.shown; st.shown = Math.abs(d) < 2 ? target : st.shown + d * Math.min(1, dt * 16); dirty = true; }
    pickObjs.forEach(k => { k.grp.rotation.y += dt * 0.6; k.grp.position.y = st.hover === k.slot ? 0.8 : 0; });
    kitObjs.forEach(k => { const f = st.fired[k.id], age = f ? (now - f.t) / 1000 : 9; k.grp.position.y = age < 0.28 ? Math.sin(age / 0.28 * Math.PI) * 2.4 : 0; k.grp.rotation.y = k.yaw + (age < 0.6 ? (1 - Math.pow(1 - age / 0.6, 3)) * 6.283 : 0); k.grp.scale.setScalar((k.base || 1) * (age < 0.28 ? 1.3 : 1)); if (age < 0.7) dirty = true; });
    if (st.multBump > 0) { st.multBump = Math.max(0, st.multBump - dt * 3.5); dirty = true; }
    if (st.floats.length || st.blots.length || st.pings.length || st.slashes.length || st.call) dirty = true;
    st.shake *= Math.pow(0.002, dt); const sh = st.shake > 0.02 ? st.shake : 0;
    // the view pushes in on the molecule for a moment when it reacts
    { const age = (now - st.zoomT) / 1000, want = age < 0.12 ? age / 0.12 : age < 0.5 ? 1 : age < 0.85 ? 1 - (age - 0.5) / 0.35 : 0; st.zoom += (want * (0.1 + 0.08 * st.fury) - st.zoom) * Math.min(1, dt * 18); }
    const zk = st.zoom, hx = (Math.random() - 0.5) * sh * 0.6, hz = (Math.random() - 0.5) * sh * 0.6;
    cam.position.set(CAM.x + (C0.x - CAM.x) * zk + hx, CAM.y + (20 - CAM.y) * zk, CAM.z + (C0.z + 16 - CAM.z) * zk + hz);
    cam.lookAt(LOOKAT.x + (C0.x - LOOKAT.x) * zk, 0.8 * zk, LOOKAT.z + (C0.z - LOOKAT.z) * zk);
    // the hotter the run, the warmer the page
    const playing = g && (st.mode === 'play' || st.mode === 'move'), heat = playing ? Math.min(1, Math.log2(Math.max(1, st.mult)) / 6) : 0;
    if (st.flash > 0) { st.flash = Math.max(0, st.flash - dt * 2.2); veil.style.backgroundColor = 'rgba(' + st.flashC + ',' + (st.flash * 0.3).toFixed(3) + ')'; }
    else if (heat > 0.05) veil.style.backgroundColor = 'rgba(255,110,30,' + (heat * 0.3).toFixed(3) + ')';
    else if (veil.style.backgroundColor) veil.style.backgroundColor = '';
    // nothing on the page sits dead still: molecules rock, equipment trembles with the multiplier, a hot run throws bubbles
    const tt = now / 1000;
    if (center && !tweens.some(tw => tw.m === center)) { st.pop = Math.max(0, st.pop - dt * 3.2); const sp = 1 + 0.28 * st.pop * Math.cos(st.pop * 9); center.group.scale.setScalar(SC_MAIN * sp); center.group.position.y = 0.25 + 0.2 * Math.sin(tt * (1.6 + 2 * heat)); center.group.rotation.z = 0.035 * Math.sin(tt * 1.1) + (Math.random() - 0.5) * (0.03 * heat + 0.07 * st.fury); }
    prods.forEach((m, i) => { if (m) m.group.rotation.z = 0.05 * Math.sin(tt * 1.3 + i * 1.7); });
    { const on = !!g && (st.mode === 'play' || st.mode === 'move' || st.mode === 'done'); flask.grp.visible = on; if (on) { const ratio = st.quota ? st.shown / st.quota : 0, ov = ratio >= 1 ? Math.log2(ratio) + 0.001 : 0; flask.set(Math.min(1, ratio), ov); const boil = Math.min(1, ov / 5); flask.grp.rotation.z = boil ? (Math.random() - 0.5) * 0.09 * boil : 0; flask.grp.position.y = boil ? Math.random() * 0.25 * boil : 0; if (boil) dirty = true; } }
    kitObjs.forEach((k, i) => { k.grp.rotation.z = (0.03 + 0.1 * heat) * Math.sin(tt * (3 + 9 * heat) + i * 2); });
    if (st.madeBump > 0) { st.madeBump = Math.max(0, st.madeBump - dt * 6); dirty = true; }
    ['p', 'r', 'e'].forEach(q => { if (st.bump[q] > 0) { st.bump[q] = Math.max(0, st.bump[q] - dt * 4); dirty = true; } });
    if (heat > 0.2) dirty = true;
    stepParts(dt);
    if (dirty && now - lastInk > 24) { drawInk(now); dirty = false; lastInk = now; }
    ren.render(scene, cam);
  }
  root.addEventListener('resize', size);
  AA.rxScheme = { st, load, pick, next, setHover, takePick, newRun, showSuppliers, frame, debugKit: ids => { run.gear = ids.slice(); load(); },
    openSupplier, meta,
    chooseBrief,
    state: () => (!g || st.mode === 'pick' || st.mode === 'shop' || st.mode === 'brief' ? { mode: st.mode, briefs: briefs.map(b => b.brief + ':' + b.quota + ':' + (b.pays || '')), round: run.round, beaten: run.beaten, picks: picks.map(o => o.kind + ':' + o.id), gear: run.gear.slice(), rack: run.rack.slice(), credit: meta.credit, tier: meta.tier } : { mode: st.mode, brief: g.brief, round: run.round, beaten: run.beaten, page: g.page, steps: g.pageSteps, offer: g.kinds.slice(), usable: slots.map((s, i) => (s && s.o ? i : -1)).filter(i => i >= 0), conts: slots.map((s, i) => (s && s.o && s.o.cont && g.cur.path.length > 0 ? i : -1)).filter(i => i >= 0), made: P.made(g), gear: st.gear.slice(), rare: Object.assign({}, g.rare), places: g.P, rowNum: g.R, extra: g.E, times: P.mult(g), row: g.cur.path.length, best: g.best, quota: st.quota, pass: st.pass, call: st.call && st.call.text }) };
  size(); newRun(); requestAnimationFrame(frame);
}
const el = root.document && document.getElementById('schemeapp');
if (el) { const boot = () => start(el); if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('40px Marker'), document.fonts.load('40px Hand')]).then(boot, boot); else boot(); }
})(window);
