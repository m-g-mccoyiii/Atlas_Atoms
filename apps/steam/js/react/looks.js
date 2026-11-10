// Mock-up of one round in three looks. Nothing here is playable: it is one still scene, built three ways, to choose an
// art direction from. looks.html?look=1 night bench, ?look=2 model kit on a cutting mat, ?look=3 notebook scheme.
// The ball-and-stick molecule is drawn the way the viewer draws it: same colours, sizes and split sticks.
(function (root) {
'use strict';
const AA = root.AA, T = root.THREE, RX = AA.rx, E = AA.ELEMENTS, P = AA.rxPath;
const LOOK = Math.max(1, Math.min(3, +(new URLSearchParams(location.search).get('look')) || 1));
const FEED = 'CC(=O)CCC(O)CC=C', OFFER = ['hydrate', 'pcc', 'nabh4', 'hcl'], QUOTA = '980';
const lin = h => new T.Color(h).convertSRGBToLinear();
const rgb = c => 'rgb(' + c.join(',') + ')';
const bright = c => { const m = Math.max(c[0], c[1], c[2], 1), k = Math.max(1, 190 / m); return c.map(q => Math.min(255, Math.round(q * k + 20))); };
const hash = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619); return ((x >>> 0) % 1000) / 1000; };
const BALL = el => Math.min(0.62, 0.2 + 0.36 * E[el].cov);
const MARK = '#1d8fe0';

const S = [null,
  { bg: '#0f0e0d', hemi: [0x8a7f70, 0x14110f, 0.5], sun: [0xffd9a8, 1.5, [-7, 26, 9]], amb: 0.0, exp: 1 },
  { bg: '#cfe6da', hemi: [0xffffff, 0x9bb7a8, 0.95], sun: [0xffffff, 0.75, [10, 26, 12]], amb: 0.0, exp: 1 },
  { bg: '#e9e2d0', hemi: [0xfff6e6, 0xcabf9f, 0.8], sun: [0xfff0d6, 0.85, [-16, 18, 4]], amb: 0.0, exp: 1 }][LOOK];

function start(app) {
  const cv = document.createElement('canvas'); app.append(cv);
  const ren = new T.WebGLRenderer({ canvas: cv, antialias: true });
  ren.setPixelRatio(Math.min(2, root.devicePixelRatio || 1)); ren.outputEncoding = T.sRGBEncoding;
  ren.shadowMap.enabled = true; ren.shadowMap.type = T.PCFSoftShadowMap;
  const scene = new T.Scene(); scene.background = lin(S.bg);
  const cam = new T.PerspectiveCamera(34, 1, 0.5, 200); cam.position.set(0, 33, 24); cam.lookAt(0, 0, 0.6);
  scene.add(new T.HemisphereLight(S.hemi[0], S.hemi[1], S.hemi[2]));
  const sun = LOOK === 1 ? new T.SpotLight(S.sun[0], S.sun[1], 90, 0.8, 0.8, 0.9) : new T.DirectionalLight(S.sun[0], S.sun[1]);
  sun.position.set(...S.sun[2]); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.radius = LOOK === 1 ? 5 : 7;
  if (LOOK !== 1) Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 18, bottom: -18, near: 1, far: 80 });
  scene.add(sun); scene.add(sun.target); sun.target.position.set(0, 0, -1);
  const maxAn = ren.capabilities.getMaxAnisotropy();
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = maxAn; return t; };
  // the room the glass and metal reflect
  const env = (() => {
    const t = tex(512, 256, (x) => { const g = x.createLinearGradient(0, 0, 0, 256); const hi = LOOK === 1 ? ['#2a2622', '#0a0908'] : ['#ffffff', '#b9c4bd']; g.addColorStop(0, hi[0]); g.addColorStop(1, hi[1]); x.fillStyle = g; x.fillRect(0, 0, 512, 256); x.fillStyle = LOOK === 1 ? '#ffd9a8' : '#ffffff'; x.fillRect(60, 20, 150, 26); x.fillRect(320, 30, 120, 60); });
    t.mapping = T.EquirectangularReflectionMapping; const pm = new T.PMREMGenerator(ren), r = pm.fromEquirectangular(t).texture; pm.dispose(); return r;
  })();
  const std = o => new T.MeshStandardMaterial(Object.assign({ envMap: env, envMapIntensity: LOOK === 1 ? 0.9 : 0.5 }, o));
  const add = (geo, mat, x, y, z, cast) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast !== false; m.receiveShadow = true; scene.add(m); return m; };
  const marker = (x, px) => { x.font = px + 'px Marker, "Segoe Print", sans-serif'; };
  const hand = (x, px) => { x.font = px + 'px Hand, "Segoe Print", sans-serif'; };

  // ---------- molecules ----------
  const g = P.begin(FEED, true, OFFER, RX.keepable(RX.fromSmiles(FEED)).find(k => k.kind === 'OH').i), opts = P.options(g);
  const SPH = new T.SphereGeometry(1, 40, 28), CYL = new T.CylinderGeometry(1, 1, 1, 14), UP = new T.Vector3(0, 1, 0), camDir = new T.Vector3(0, -33, -23.4).normalize();
  // every molecule is turned the same way: its long axis lies left to right
  const align = (() => {
    let best = 0, v = new T.Vector3(1, 0, 0);
    g.m.atoms.forEach(a => g.m.atoms.forEach(b => { const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); if (d > best) { best = d; v.set(b.x - a.x, b.y - a.y, b.z - a.z); } }));
    if (v.x < 0) v.negate();
    const q = new T.Quaternion().setFromUnitVectors(v.normalize(), new T.Vector3(1, 0, 0));
    // then rolled about that axis until it lies as flat as it can
    let roll = 0, least = 1e9;
    for (let k = 0; k < 36; k++) {
      const r = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), k * Math.PI / 36).multiply(q); let lo = 1e9, hi = -1e9;
      g.m.atoms.forEach(a => { if (a.el === 'H') return; const y = new T.Vector3(a.x, a.y, a.z).applyQuaternion(r).y; lo = Math.min(lo, y); hi = Math.max(hi, y); });
      if (hi - lo < least) { least = hi - lo; roll = k; }
    }
    return new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), roll * Math.PI / 36).multiply(q);
  })();
  const letter = {};
  function letterMat(el) {
    if (letter[el]) return letter[el];
    const hx = E[el].color, n = parseInt(hx.slice(1), 16), dark = ((n >> 16 & 255) * 0.299 + (n >> 8 & 255) * 0.587 + (n & 255) * 0.114) > 150;
    return (letter[el] = new T.SpriteMaterial({ map: tex(128, 128, x => { x.font = 'bold 84px "Trebuchet MS", system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = dark ? '#14202e' : '#ffffff'; x.fillText(el, 64, 68); }), depthWrite: false }));
  }
  function mol(model, px, pz, sc, rings) {
    const c = new T.Vector3(); model.atoms.forEach(a => c.add(new T.Vector3(a.x, a.y, a.z))); c.divideScalar(model.atoms.length || 1);
    const at = new Map(); let low = 1e9;
    model.atoms.forEach(a => { const p = new T.Vector3(a.x, a.y, a.z).sub(c).applyQuaternion(align).multiplyScalar(sc); at.set(a, p); low = Math.min(low, p.y - BALL(a.el) * sc); });
    const lift = 0.45 - low;
    at.forEach(p => { p.x += px; p.y += lift; p.z += pz; });
    model.atoms.forEach(a => {
      const p = at.get(a), R = BALL(a.el) * sc;
      add(SPH, new T.MeshStandardMaterial({ color: lin(E[a.el].color), roughness: 0.3, metalness: 0.08 }), p.x, p.y, p.z).scale.setScalar(R);
      const sp = new T.Sprite(letterMat(a.el)); sp.position.copy(p).addScaledVector(camDir, -R * 1.04); sp.scale.setScalar(R * 1.25); scene.add(sp);
      const ring = a.keep ? MARK : rings && rings.has(a) && a.el !== 'H' ? rings.get(a) : null;
      if (ring) { const t = add(new T.TorusGeometry(R * 1.32, R * 0.14, 10, 40), std({ color: lin(ring), roughness: 0.45 }), p.x, p.y, p.z); t.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), camDir.clone().negate()); }
    });
    model.bonds.forEach(b => {
      const A = at.get(b.a), B = at.get(b.b); if (!A || !B) return;
      const u = B.clone().sub(A), len = u.length(); u.divideScalar(len);
      const q = new T.Quaternion().setFromUnitVectors(UP, u), perp = new T.Vector3().crossVectors(u, camDir).normalize(), mid = A.clone().add(B).multiplyScalar(0.5);
      const offs = b.order === 1 ? [0] : [-0.5, 0.5], r = (b.order > 1 ? 0.06 : 0.09) * sc;
      offs.forEach(f => [[A, mid, b.a], [mid, B, b.b]].forEach(h => {
        const m = add(CYL, new T.MeshStandardMaterial({ color: lin(E[h[2].el].color), roughness: 0.35 }), 0, 0, 0);
        m.position.copy(h[0]).add(h[1]).multiplyScalar(0.5).addScaledVector(perp, f * 0.17 * sc); m.quaternion.copy(q); m.scale.set(r, h[0].distanceTo(h[1]), r);
      }));
    });
  }

  // ---------- layout shared by the three looks ----------
  const C0 = { x: 0, z: 3.4 }, SPOT = [{ x: -15, z: -1.4 }, { x: -5.6, z: -8.4 }, { x: 5.6, z: -8.4 }, { x: 15, z: -1.4 }], GO = { x: 15.5, z: 8.4 }, STEP = { x: -17, z: 9 }, NOTE = { x: 9.4, z: 9.6 };
  const items = OFFER.map((id, i) => {
    const o = opts[id], card = RX.CARDS[id], p = SPOT[i], dx = p.x - C0.x, dz = p.z - C0.z, d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, col = bright(card.rgb);
    return { id, o, card, p, ux, uz, col, a: { x: C0.x + ux * 5.8, z: C0.z + uz * 3.0 }, b: { x: p.x - ux * 4.3, z: p.z - uz * 4.3 }, lab: { x: p.x + (i < 2 ? -1.3 : 1.3), z: p.z + 5.1 } };
  });
  mol(g.m, C0.x, C0.z, 0.95, null);
  items.forEach(it => { if (!it.o) return; it.o.model.settle(160); const rings = new Map(); it.o.r.made.forEach(a => rings.set(a, rgb(it.col))); mol(it.o.model, it.p.x, it.p.z, 0.72, rings); });
  const flat = (w, h, t, x, z, yaw, y) => { const m = add(new T.PlaneGeometry(w, h).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.9, alphaTest: 0.02 }), x, y || 0.03, z, false); m.rotation.y = yaw || 0; return m; };
  const noise = (x, w, h, n, a, c) => { for (let i = 0; i < n; i++) { x.fillStyle = 'rgba(' + c + ',' + (Math.random() * a).toFixed(3) + ')'; x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } };
  const SW = 64, SH = 44, toPx = (W, H) => p => [(p.x + SW / 2) / SW * W, (p.z + SH / 2) / SH * H];

  // ---------- look 1: a bench at night. House rule: every reading is handwriting on a paper tag tied on with thread ----------
  if (LOOK === 1) {
    add(new T.PlaneGeometry(SW, SH).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ map: tex(1024, 704, (x, w, h) => { x.fillStyle = '#211e1b'; x.fillRect(0, 0, w, h); noise(x, w, h, 26000, 0.07, '255,240,220'); noise(x, w, h, 16000, 0.2, '0,0,0'); }), roughness: 0.82 }), 0, 0, 0, false);
    const tag = (lines, col, cross) => tex(512, 220, (x) => {
      x.fillStyle = '#e7dcc0'; x.beginPath(); x.moveTo(70, 14); x.lineTo(486, 20); x.quadraticCurveTo(502, 22, 500, 40); x.lineTo(494, 186); x.quadraticCurveTo(492, 204, 474, 204); x.lineTo(74, 208); x.lineTo(14, 112); x.closePath(); x.fill();
      noise(x, 512, 220, 1800, 0.08, '90,70,40');
      x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(62, 112, 13, 0, 7); x.fill(); x.globalCompositeOperation = 'source-over';
      x.fillStyle = '#1b1a1f'; x.textAlign = 'left'; marker(x, 74); x.fillText(lines[0], 96, 106);
      if (lines[1]) { for (let k = 0; k < lines[1]; k++) { x.fillStyle = col; x.beginPath(); x.arc(116 + k * 46, 160, 15, 0, 7); x.fill(); } }
      if (lines[2]) { x.fillStyle = '#c8261c'; hand(x, 86); x.textAlign = 'right'; x.fillText(lines[2], 474, 150); }
      if (cross) { x.strokeStyle = '#c8261c'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(90, 180); x.lineTo(470, 44); x.stroke(); }
    });
    const thread = (a, b, col) => { const pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push(new T.Vector3(a.x + (b.x - a.x) * t + Math.sin(t * 9 + a.x) * 0.16, 0.07, a.z + (b.z - a.z) * t + Math.cos(t * 7 + a.z) * 0.16)); } add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.07, 6), new T.MeshStandardMaterial({ color: lin(col), roughness: 0.8 }), 0, 0, 0); };
    items.forEach((it, i) => {
      add(new T.CylinderGeometry(4.0, 4.1, 0.3, 56), std({ color: lin(0x5a3d25), roughness: 0.7 }), it.p.x, 0.15, it.p.z);
      thread(it.a, it.b, it.o && it.o.spoil ? '#c8261c' : rgb(it.col));
      flat(6.6, 2.85, tag([it.card.verb, it.o ? it.o.r.hits : 0], rgb(it.col), it.o && it.o.spoil), it.lab.x, it.lab.z, (hash(it.id) - 0.5) * 0.3);
    });
    // a desk bell to deliver, brass weights for the steps left
    add(new T.CylinderGeometry(1.9, 2, 0.3, 40), std({ color: lin(0x2a2420), roughness: 0.5 }), GO.x, 0.15, GO.z);
    add(new T.SphereGeometry(1.7, 40, 20, 0, 6.3, 0, Math.PI / 2), std({ color: lin(0xc79a3a), roughness: 0.28, metalness: 0.9, envMapIntensity: 1.6 }), GO.x, 0.3, GO.z);
    add(new T.CylinderGeometry(0.22, 0.22, 0.5, 16), std({ color: lin(0xd9b45a), roughness: 0.3, metalness: 0.9, envMapIntensity: 1.6 }), GO.x, 2.15, GO.z);
    flat(7.4, 3.2, tag(['?', 0, '/ ' + QUOTA], '#000', false), NOTE.x, NOTE.z, -0.12);
    for (let k = 0; k < 3; k++) add(new T.CylinderGeometry(0.75, 0.85, 0.55 + k * 0.25, 28), std({ color: lin(0xb88a34), roughness: 0.35, metalness: 0.85, envMapIntensity: 1.5 }), STEP.x + k * 2.1, 0.3 + k * 0.12, STEP.z);
  }

  // ---------- look 2: a model kit on a cutting mat. House rule: every reading is marker on masking tape or a round sticker ----------
  if (LOOK === 2) {
    add(new T.PlaneGeometry(SW, SH).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ map: tex(2048, 1408, (x, w, h) => {
      x.fillStyle = '#2f8466'; x.fillRect(0, 0, w, h); noise(x, w, h, 30000, 0.05, '255,255,255'); noise(x, w, h, 20000, 0.06, '0,0,0');
      const u = w / SW; x.strokeStyle = 'rgba(214,240,226,0.34)';
      for (let i = 0; i <= SW; i++) { x.lineWidth = i % 5 ? 1 : 2.6; x.beginPath(); x.moveTo(i * u, 0); x.lineTo(i * u, h); x.stroke(); }
      for (let j = 0; j <= SH; j++) { x.lineWidth = j % 5 ? 1 : 2.6; x.beginPath(); x.moveTo(0, j * u); x.lineTo(w, j * u); x.stroke(); }
      x.strokeStyle = 'rgba(214,240,226,0.3)'; x.lineWidth = 2; [[w * 0.5, h * 0.52, 300], [w * 0.5, h * 0.52, 520]].forEach(c => { x.beginPath(); x.arc(c[0], c[1], c[2], 0, 7); x.stroke(); });
    }), roughness: 0.7 }), 0, 0, 0, false);
    const tape = (text, col, n, cross) => tex(1024, 150, (x) => {
      x.fillStyle = col; x.beginPath(); x.moveTo(10, 12); for (let k = 0; k <= 10; k++) x.lineTo(1014 - (k % 2) * 9, 12 + k * 12.6); for (let k = 10; k >= 0; k--) x.lineTo(10 + (k % 2) * 9, 12 + k * 12.6); x.closePath(); x.fill();
      noise(x, 1024, 150, 2500, 0.12, '255,255,255');
      x.fillStyle = '#17171b'; marker(x, 78); x.textAlign = 'left'; x.fillText(text, 250, 104);
      if (n != null) { x.fillStyle = '#ffffff'; x.beginPath(); x.arc(150, 76, 54, 0, 7); x.fill(); x.fillStyle = '#17171b'; marker(x, 76); x.textAlign = 'center'; x.fillText(String(n), 150, 104); }
      if (cross) { x.strokeStyle = '#17171b'; x.lineWidth = 14; x.lineCap = 'round'; x.beginPath(); x.moveTo(700, 30); x.lineTo(800, 122); x.moveTo(800, 30); x.lineTo(700, 122); x.stroke(); }
    });
    const pastel = c => rgb(c.map(q => Math.round(q * 0.55 + 255 * 0.45)));
    items.forEach((it) => {
      add(new T.CylinderGeometry(4.0, 4.0, 0.14, 64), std({ color: lin(0xf7f9f8), roughness: 0.25, transparent: true, opacity: 0.92 }), it.p.x, 0.07, it.p.z);
      add(new T.TorusGeometry(4.0, 0.11, 10, 64).rotateX(Math.PI / 2), std({ color: lin(0xffffff), roughness: 0.2 }), it.p.x, 0.2, it.p.z);
      const len = Math.hypot(it.b.x - it.a.x, it.b.z - it.a.z), flip = it.ux < 0, yaw = Math.atan2(-(it.b.z - it.a.z), it.b.x - it.a.x) + (flip ? Math.PI : 0);
      const tc = it.o && it.o.spoil ? '#e2574c' : pastel(it.col);
      flat(len + 1.2, 0.6, tape('', tc, null, false), (it.a.x + it.b.x) / 2, (it.a.z + it.b.z) / 2, yaw);
      flat(10, 1.47, tape(it.card.verb, tc, it.o ? it.o.r.hits : 0, it.o && it.o.spoil), it.lab.x, it.lab.z, (hash(it.id) - 0.5) * 0.22, 0.05);
    });
    // a red push button to deliver, stickers for the steps left
    add(new T.CylinderGeometry(2.1, 2.2, 0.7, 40), std({ color: lin(0xf2c200), roughness: 0.45 }), GO.x, 0.35, GO.z);
    add(new T.CylinderGeometry(1.45, 1.55, 0.7, 40), std({ color: lin(0xd92a1c), roughness: 0.25 }), GO.x, 1.0, GO.z);
    flat(10, 1.47, tape('? / ' + QUOTA, '#efe6c9', null, false), NOTE.x - 1.4, NOTE.z, 0.07);
    for (let k = 0; k < 3; k++) add(new T.CylinderGeometry(0.85, 0.85, 0.05, 32), std({ color: lin([0xffd23f, 0xff8fa3, 0x7fd3ff][k]), roughness: 0.4 }), STEP.x + k * 2.2, 0.03, STEP.z + (k % 2) * 0.25);
  }

  // ---------- look 3: a reaction scheme in a lab notebook. House rule: every reading is ink on the page, written on an arrow ----------
  if (LOOK === 3) {
    const W = 3072, H = 2112, px = toPx(W, H), u = W / SW;
    const wob = (x, a, b, lw, col) => { const A = px(a), B = px(b), n = 14; x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); for (let k = 0; k <= n; k++) { const t = k / n, j = Math.sin(t * 11 + A[0] * 0.01) * 3.2; const X = A[0] + (B[0] - A[0]) * t + j, Y = A[1] + (B[1] - A[1]) * t + j * 0.6; k ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke(); };
    add(new T.PlaneGeometry(SW, SH).rotateX(-Math.PI / 2), new T.MeshStandardMaterial({ map: tex(W, H, (x) => {
      x.fillStyle = '#f3eddc'; x.fillRect(0, 0, W, H); noise(x, W, H, 60000, 0.05, '120,100,60');
      x.strokeStyle = 'rgba(70,120,170,0.2)'; x.lineWidth = 2; for (let i = 0; i <= SW; i++) { x.beginPath(); x.moveTo(i * u, 0); x.lineTo(i * u, H); x.stroke(); } for (let j = 0; j <= SH; j++) { x.beginPath(); x.moveTo(0, j * u); x.lineTo(W, j * u); x.stroke(); }
      x.strokeStyle = 'rgba(200,60,50,0.45)'; x.lineWidth = 4; x.beginPath(); x.moveTo(13.5 * u, 0); x.lineTo(13.5 * u, H); x.stroke();
      const INK = '#1f2a55';
      items.forEach(it => {
        const spoil = it.o && it.o.spoil, col = spoil ? '#c8261c' : INK;
        wob(x, it.a, it.b, 9, col);
        const hd = 1.0, ax = { x: it.b.x - it.ux * hd - it.uz * 0.55, z: it.b.z - it.uz * hd + it.ux * 0.55 }, bx = { x: it.b.x - it.ux * hd + it.uz * 0.55, z: it.b.z - it.uz * hd - it.ux * 0.55 };
        wob(x, ax, it.b, 9, col); wob(x, bx, it.b, 9, col);
        const m = px({ x: it.p.x * 0.86, z: it.lab.z });
        x.save(); x.translate(m[0], m[1]); x.rotate((hash(it.id) - 0.5) * 0.08);
        x.fillStyle = col; x.textAlign = 'center'; hand(x, 96); x.fillText(it.card.verb.toLowerCase(), -40, 30);
        const tw = x.measureText(it.card.verb.toLowerCase()).width;
        x.strokeStyle = rgb(it.col); x.globalAlpha = 0.6; x.lineWidth = 24; x.lineCap = 'round'; x.beginPath(); x.moveTo(-40 - tw / 2, 52); x.lineTo(-40 + tw / 2, 46); x.stroke(); x.globalAlpha = 1;
        hand(x, 80); x.fillStyle = col; x.fillText(String(it.o ? it.o.r.hits : 0), tw / 2 + 40, 26); x.strokeStyle = col; x.lineWidth = 6; x.beginPath(); x.ellipse(tw / 2 + 42, 0, 42, 38, 0.2, 0.3, 6.6); x.stroke();
        if (spoil) { x.strokeStyle = '#c8261c'; x.lineWidth = 12; x.beginPath(); x.moveTo(-40 - tw / 2, 40); x.lineTo(-40 + tw / 2, -50); x.stroke(); }
        x.restore();
      });
      // the quota in pencil, and a box to tick for each step
      const q = px(NOTE); x.fillStyle = '#4a4a4a'; x.textAlign = 'left'; hand(x, 150); x.fillText('?', q[0] - 190, q[1] + 40); x.fillStyle = '#c8261c'; hand(x, 110); x.fillText('/ ' + QUOTA, q[0] - 100, q[1] + 40);
      for (let k = 0; k < 3; k++) { const c = px({ x: STEP.x + k * 2.3, z: STEP.z }); x.strokeStyle = INK; x.lineWidth = 7; x.beginPath(); x.ellipse(c[0], c[1], 44, 40, 0.1 * k, 0.2, 6.5); x.stroke(); }
      const k0 = px({ x: C0.x - 1.2, z: C0.z + 3.6 }); x.strokeStyle = MARK; x.lineWidth = 9; x.beginPath(); x.moveTo(k0[0] - 120, k0[1]); x.lineTo(k0[0] + 150, k0[1] - 8); x.stroke(); x.fillStyle = MARK; hand(x, 84); x.textAlign = 'center'; x.fillText('keep', k0[0] + 10, k0[1] + 84);
    }), roughness: 0.95 }), 0, 0, 0, false);
    // a rubber stamp on its pad to deliver
    add(new T.CylinderGeometry(2.3, 2.4, 0.5, 40), std({ color: lin(0x7b1f18), roughness: 0.7 }), GO.x, 0.25, GO.z);
    add(new T.CylinderGeometry(1.5, 1.5, 0.5, 36), std({ color: lin(0x1d1b1a), roughness: 0.6 }), GO.x, 0.75, GO.z);
    add(new T.CylinderGeometry(0.55, 0.9, 1.9, 28), std({ color: lin(0xb07a44), roughness: 0.5 }), GO.x, 1.95, GO.z);
    add(new T.SphereGeometry(0.85, 28, 20), std({ color: lin(0xb07a44), roughness: 0.5 }), GO.x, 3.1, GO.z);
    // a pencil across the margin
    const pen = add(new T.CylinderGeometry(0.2, 0.2, 9, 6), std({ color: lin(0xf0b21c), roughness: 0.5 }), -19, 0.2, -11.5); pen.rotation.set(Math.PI / 2, 0, 1.1);
  }

  // ---------- the one layer laid over the whole picture ----------
  const veil = document.createElement('canvas'); veil.className = 'veil'; app.append(veil);
  function size() {
    const w = app.clientWidth, h = app.clientHeight; ren.setSize(w, h, false); cam.aspect = w / h;
    cam.fov = w / h > 1.6 ? 34 : 34 * 1.6 / (w / h) * 0.86; cam.updateProjectionMatrix();
    veil.width = w; veil.height = h; const x = veil.getContext('2d');
    if (LOOK === 1) { const gr = x.createRadialGradient(w * 0.46, h * 0.46, h * 0.25, w * 0.5, h * 0.5, h * 0.95); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.6)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); for (let i = 0; i < w * h / 9; i++) { x.fillStyle = 'rgba(255,235,210,' + (Math.random() * 0.07).toFixed(3) + ')'; x.fillRect(Math.random() * w, Math.random() * h, 1, 1); } }
    if (LOOK === 3) { const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,236,190,0.16)'); gr.addColorStop(1, 'rgba(60,50,90,0.14)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); noise(x, w, h, w * h / 30, 0.05, '80,60,30'); }
    ren.render(scene, cam);
  }
  document.body.classList.add('look' + LOOK);
  root.addEventListener('resize', size);
  size(); setTimeout(size, 300);
}
// the lettering is drawn into textures once, so the fonts have to be in before anything is built
const el = root.document && document.getElementById('looksapp');
if (el) { const boot = () => start(el); if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('40px Marker'), document.fonts.load('40px Hand')]).then(boot, boot); else boot(); }
})(window);
