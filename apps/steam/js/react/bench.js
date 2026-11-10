// The bench: reagent bottles, the product cylinder and the instruments, built in the molecule's own scene
// and lit by the same lights. It hangs off the camera, scaled by the camera distance, so it holds its place on screen.
(function (root) {
'use strict';
const AA = root.AA, T = root.THREE;
// every length is a fraction of the camera's distance to the molecule
const P = { h: 0.43, shift: 0.2, bz: 0.1, bh: 0.2, sp: 0.15, span: 0.78, dist: 4.3 };
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const lin = hx => new T.Color(hx).convertSRGBToLinear();
const rgbHex = c => (c[0] << 16) | (c[1] << 8) | c[2];
const hash = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619); return ((x >>> 0) % 1000) / 1000; };
const ease = (a, b, k) => a + (b - a) * k;

// seven-segment digits, drawn rather than set in a typeface
const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g' };
function segText(x, text, right, top, hh, on, off) {
  const w = hh * 0.52, t = hh * 0.13, gap = hh * 0.2, chars = String(text).split('');
  let wid = 0; chars.forEach(c => { wid += c === '.' || c === ',' ? t * 1.6 : w + gap; });
  let px = right - wid + gap;
  const bar = (ax, ay, bx, by, lit) => { x.strokeStyle = lit ? on : off; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke(); };
  x.lineWidth = t; x.lineCap = 'round';
  chars.forEach(c => {
    if (c === ',') { px += t * 1.6; return; }
    if (c === '.') { x.fillStyle = on; x.beginPath(); x.arc(px - gap * 0.35, top + hh, t * 0.6, 0, 7); x.fill(); px += t * 1.6; return; }
    const s = SEG[c] || '', m = top + hh / 2, r = px + w, b = top + hh, i = t * 0.75;
    bar(px + i, top, r - i, top, s.includes('a')); bar(r, top + i, r, m - i, s.includes('b')); bar(r, m + i, r, b - i, s.includes('c'));
    bar(px + i, b, r - i, b, s.includes('d')); bar(px, m + i, px, b - i, s.includes('e')); bar(px, top + i, px, m - i, s.includes('f'));
    bar(px + i, m, r - i, m, s.includes('g'));
    px += w + gap;
  });
  return right - wid;
}

function make(v, hood, hooks) {
  const cam = v.camera, picks = [], bottles = new Map();
  let s = 640 / v.zoom, state = { proj: 0, quota: 1, left: 0, max: 0, redraws: 0, met: false }, hover = null, level = 0, press = { deliver: 0, swap: 0 }, tick = 0, fontsOk = false, drag = null, busy = false, skipClick = false;
  const order = [];   // shelf order, left to right, set by hand
  cam.setViewOffset(1, 1, 0, P.shift, 1, 1);
  const rig = new T.Group(), bench = new T.Group(); cam.add(rig); rig.add(bench);
  const maxAniso = v.renderer.capabilities.getMaxAnisotropy();
  const canvasTex = (w, hh) => { const c = document.createElement('canvas'); c.width = w; c.height = hh; const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = maxAniso; return { c, x: c.getContext('2d'), t }; };

  // the room the glass reflects: two strip lights, a window and a dim floor
  const env = (() => {
    const e = canvasTex(512, 256), x = e.x, g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#1c1d20'); g.addColorStop(0.5, '#0a0a0b'); g.addColorStop(1, '#050505'); x.fillStyle = g; x.fillRect(0, 0, 512, 256);
    x.fillStyle = '#ffffff'; x.fillRect(40, 26, 130, 20); x.fillRect(290, 18, 170, 24);
    x.fillStyle = '#9db4c8'; x.fillRect(200, 84, 36, 70); x.fillStyle = '#5b6b78'; x.fillRect(420, 96, 60, 40);
    e.t.mapping = T.EquirectangularReflectionMapping;
    const pm = new T.PMREMGenerator(v.renderer), rt = pm.fromEquirectangular(e.t); pm.dispose(); e.t.dispose();
    return rt.texture;
  })();
  const std = o => new T.MeshStandardMaterial(Object.assign({ envMap: env, envMapIntensity: 0.7 }, o));
  const MAT = {
    glass: new T.MeshPhysicalMaterial({ color: lin(0xdfe9ee), transparent: true, transmission: 0.8, roughness: 0.04, metalness: 0, envMap: env, envMapIntensity: 2.2, depthWrite: false }),
    caps: [0x141414, 0x8a4f22, 0xb9bcc0, 0xd9a520].map((c, i) => std({ color: lin(c), roughness: i ? 0.3 : 0.5, metalness: i ? 0.85 : 0, envMapIntensity: i ? 1.4 : 0.7 })),
    top: std({ color: lin(0x17181a), roughness: 0.5, envMapIntensity: 0.35 }),
    metal: std({ color: lin(0x3b3e42), roughness: 0.55, metalness: 0.4 }),
    dark: std({ color: lin(0x0e0e0f), roughness: 0.6 }),
    yellow: std({ color: lin(0xe8b400), roughness: 0.5 }),
    red: std({ color: lin(0xc81e14), roughness: 0.35, emissive: new T.Color(0xff2a1a), emissiveIntensity: 0 }),
    grey: std({ color: lin(0x8d9196), roughness: 0.4, metalness: 0.6 }),
    paper: std({ color: lin(0xf3efe4), roughness: 0.9, envMapIntensity: 0.1 }),
    pick: new T.MeshBasicMaterial({ visible: false })
  };
  const lathe = pts => new T.LatheGeometry(pts.map(p => new T.Vector2(p[0], p[1])), 40);
  const GEO = {
    glass: lathe([[0, 0], [0.25, 0], [0.27, 0.02], [0.27, 0.6], [0.255, 0.66], [0.19, 0.73], [0.12, 0.77], [0.105, 0.8], [0.105, 0.88], [0.128, 0.885], [0.128, 0.91], [0.098, 0.91]]),
    liq: new T.CylinderGeometry(0.245, 0.245, 1, 32).translate(0, 0.5, 0),
    cap: new T.CylinderGeometry(0.14, 0.14, 0.12, 28),
    label: new T.CylinderGeometry(0.276, 0.276, 0.36, 40, 1, true, -1.25, 2.5),
    ring: new T.RingGeometry(0.31, 0.37, 48).rotateX(-Math.PI / 2),
    pick: new T.CylinderGeometry(0.3, 0.3, 1, 10).translate(0, 0.5, 0)
  };
  const add = (parent, geo, mat, x, y, z, shadow) => { const m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); if (shadow !== false) m.castShadow = true; parent.add(m); return m; };

  // bench top
  const top = add(bench, new T.PlaneGeometry(9, 7).rotateX(-Math.PI / 2), MAT.top, 0, 0, -3.05, false); top.receiveShadow = true;
  v.scene.fog = new T.Fog(lin(0x131312), 10, 20);

  // ---------- bottles ----------
  function drawFormula(x, text, cx, y, px) {
    const parts = text.split('').map(c => { const i = SUB.indexOf(c); return i < 0 ? { c, sub: false } : { c: String(i), sub: true }; });
    const fnt = b => (x.font = (b ? Math.round(px * 0.68) : px) + 'px Hand, "Segoe Print", sans-serif');
    let w = 0; parts.forEach(p => { fnt(p.sub); p.w = x.measureText(p.c).width; w += p.w; });
    let at = cx - w / 2; x.textAlign = 'left';
    parts.forEach(p => { fnt(p.sub); x.fillText(p.c, at, y + (p.sub ? px * 0.2 : 0)); at += p.w; });
  }
  function drawLabel(b) {
    const x = b.lab.x, it = b.it, card = it.card, col = 'rgb(' + card.rgb.join(',') + ')', tilt = (hash(card.id + 'tilt') - 0.5) * 0.09;
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.fillStyle = '#efeadb'; x.fillRect(0, 0, 512, 256);
    x.fillStyle = col; x.fillRect(0, 0, 512, 34); x.fillRect(0, 244, 512, 12);
    x.translate(256, 140); x.rotate(tilt);
    x.fillStyle = '#16161a'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    let px = 66; do { x.font = px + 'px Marker, "Segoe Print", sans-serif'; px -= 3; } while (x.measureText(card.verb).width > 300 && px > 24);
    x.fillText(card.verb, 0, 8);
    x.fillStyle = '#2b2f55'; drawFormula(x, card.formula, 0, 62, 40);
    x.setTransform(1, 0, 0, 1, 0, 0);
    if (it.n) {   // the number of sites, on a round sticker
      x.fillStyle = it.spoils ? '#c8261c' : '#16161a'; x.beginPath(); x.arc(392, 66, 30, 0, 7); x.fill();
      x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = '44px Marker, "Segoe Print", sans-serif'; x.fillText(String(it.n), 392, 82);
    }
    b.lab.t.needsUpdate = true;
  }
  function mkBottle(it) {
    const g = new T.Group(), card = it.card, lab = canvasTex(512, 256);
    const liq = add(g, GEO.liq, std({ color: lin(rgbHex(card.rgb)), roughness: 0.25, envMapIntensity: 0.5 }), 0, 0.025, 0); liq.scale.y = 0.3 + 0.24 * hash(card.id);
    const label = add(g, GEO.label, new T.MeshStandardMaterial({ map: lab.t, roughness: 0.85 }), 0, 0.33, 0);
    add(g, GEO.cap, MAT.caps[Math.min(3, it.grade | 0)], 0, 0.925, 0);
    const glass = add(g, GEO.glass, MAT.glass, 0, 0, 0, false); glass.renderOrder = 2;
    const ring = add(bench, GEO.ring, new T.MeshBasicMaterial({ color: 0xffcd00, transparent: true, opacity: 0, depthWrite: false }), 0, 0.003, 0, false);
    const pick = add(g, GEO.pick, MAT.pick, 0, 0, 0, false);
    const b = { g, it, lab, liq, label, ring, pick, sig: '', gone: 0, pour: 0, yaw: (hash(card.id + 'yaw') - 0.5) * 0.5, base: lin(rgbHex(card.rgb)) };
    pick.userData = { kind: 'bottle', b }; picks.push(pick);
    g.rotation.y = b.yaw; bench.add(g);
    return b;
  }
  function setHand(items) {
    const seen = new Set(), n = items.length, sp = Math.min(P.sp, P.span / Math.max(1, n - 1)), k = sp / P.sp;
    const ids = items.map(it => it.uid);
    for (let j = order.length - 1; j >= 0; j--) if (!ids.includes(order[j])) order.splice(j, 1);
    ids.forEach(u => { if (!order.includes(u)) order.push(u); });
    items.forEach((it, i) => {
      let b = bottles.get(it.uid);
      const tx = (order.indexOf(it.uid) - (n - 1) / 2) * sp;
      if (!b) { b = mkBottle(it); bottles.set(it.uid, b); b.g.position.set(tx, 0.42, P.bz); b.g.scale.setScalar(P.bh * k); }
      b.it = it; b.i = i; b.tx = tx; b.k = k; b.sp = sp; b.n = n; seen.add(it.uid);
      const sig = [it.n, it.live, it.spoils, fontsOk].join();
      if (b.sig !== sig) { b.sig = sig; drawLabel(b); }
      const d = it.live ? 1 : 0.34;
      b.label.material.color.setScalar(d); b.liq.material.color.copy(b.base).multiplyScalar(d);
    });
    bottles.forEach((b, uid) => { if (!seen.has(uid) && !b.gone) b.gone = 0.0001; });
  }
  function pour(uid) { const b = bottles.get(uid); if (b) b.pour = 1.3; }
  function dropBottle(uid, b) {
    bench.remove(b.g, b.ring); b.lab.t.dispose(); b.liq.material.dispose(); b.label.material.dispose(); b.ring.material.dispose();
    const i = picks.indexOf(b.pick); if (i >= 0) picks.splice(i, 1);
    bottles.delete(uid); if (hover && hover.b === b) hover = null;
  }

  // ---------- product cylinder ----------
  const cyl = new T.Group(); bench.add(cyl); cyl.position.set(0.4, 0, -0.16); cyl.scale.setScalar(0.36);
  add(cyl, new T.CylinderGeometry(0.2, 0.22, 0.04, 6), MAT.glass, 0, 0.02, 0, false).renderOrder = 2;
  const liquid = add(cyl, new T.CylinderGeometry(0.094, 0.094, 1, 28).translate(0, 0.5, 0), std({ color: lin(0xffcd00), roughness: 0.2, emissive: new T.Color(0xffcd00), emissiveIntensity: 0.25 }), 0, 0.05, 0);
  add(cyl, lathe([[0.108, 0.04], [0.108, 0.97], [0.125, 1], [0.118, 1], [0.1, 0.97]]), MAT.glass, 0, 0, 0, false).renderOrder = 2;
  const marks = canvasTex(256, 512);
  (() => { const x = marks.x; x.clearRect(0, 0, 256, 512); x.strokeStyle = '#ffffff'; x.lineWidth = 3; for (let i = 0; i <= 20; i++) { const y = 500 - i * 24.4, long = i % 5 === 0; x.beginPath(); x.moveTo(128 - (long ? 60 : 30), y); x.lineTo(128 + (long ? 60 : 30), y); x.stroke(); } })();
  add(cyl, new T.CylinderGeometry(0.11, 0.11, 0.92, 28, 1, true, -0.9, 1.8), new T.MeshBasicMaterial({ map: marks.t, transparent: true, opacity: 0.75, depthWrite: false }), 0, 0.51, 0, false).renderOrder = 3;
  // the quota is the red collar halfway up; the glass holds twice the quota
  add(cyl, new T.TorusGeometry(0.118, 0.016, 10, 36).rotateX(Math.PI / 2), std({ color: lin(0xd0261c), roughness: 0.5 }), 0, 0.05 + 0.46, 0);

  // ---------- meter: product so far, the quota, yield and batch, and a lamp for each step left ----------
  const meter = new T.Group(); bench.add(meter); meter.position.set(-0.56, 0, -0.42); meter.rotation.y = 0.3;
  add(meter, new T.BoxGeometry(0.4, 0.19, 0.16), MAT.metal, 0, 0.105, 0);
  add(meter, new T.BoxGeometry(0.36, 0.01, 0.14), MAT.dark, 0, 0.005, 0);
  const disp = canvasTex(640, 256);
  add(meter, new T.PlaneGeometry(0.35, 0.14), new T.MeshBasicMaterial({ map: disp.t }), 0, 0.115, 0.0815, false);
  const lamps = [];
  for (let i = 0; i < 10; i++) lamps.push(add(meter, new T.SphereGeometry(0.008, 12, 8), new T.MeshBasicMaterial({ color: 0x222222 }), -0.17 + i * 0.027, 0.207, 0.06, false));
  function drawMeter(shown, y, bt) {
    const x = disp.x, on = state.met ? '#52f08c' : '#ffb21a', off = 'rgba(255,255,255,0.045)';
    x.fillStyle = '#060807'; x.fillRect(0, 0, 640, 256);
    if (state.alt) {   // between orders the meter reads one number
      segText(x, Math.round(state.alt.big).toLocaleString('en-US'), 600, 40, 120, '#52f08c', off);
      x.fillStyle = '#7c867c'; x.textAlign = 'left'; x.font = '500 26px PlexMono, Consolas, monospace'; x.fillText(state.alt.label, 30, 226);
      if (state.alt.right) { x.textAlign = 'right'; x.fillText(state.alt.right, 610, 226); }
      disp.t.needsUpdate = true; return;
    }
    segText(x, Math.round(shown).toLocaleString('en-US'), 420, 26, 104, on, off);
    segText(x, Math.round(state.quota).toLocaleString('en-US'), 616, 72, 54, '#c8261c', off);
    segText(x, String(Math.round(y)), 250, 182, 46, '#d8dcd6', off);
    segText(x, String(bt < 100 ? Math.round(bt * 10) / 10 : Math.round(bt)), 560, 182, 46, '#d8dcd6', off);
    x.fillStyle = '#7c867c'; x.textAlign = 'left'; x.font = '500 22px PlexMono, Consolas, monospace';
    x.fillText('needed', 500, 54); x.fillText('yield', 30, 222); x.fillText('batch', 330, 222);
    disp.t.needsUpdate = true;
  }

  // ---------- printouts: the three traces on one sheet, on a stand ----------
  const stand = new T.Group(); bench.add(stand); stand.position.set(0.74, 0, -0.5); stand.rotation.y = -0.4;
  const sheet = canvasTex(512, 660);
  const board = new T.Group(); stand.add(board); board.position.y = 0.02; board.rotation.x = -0.24;
  add(board, new T.BoxGeometry(0.36, 0.47, 0.012), MAT.dark, 0, 0.235, -0.008);
  add(board, new T.PlaneGeometry(0.33, 0.425), new T.MeshStandardMaterial({ map: sheet.t, roughness: 0.9, color: new T.Color(0.62, 0.62, 0.62) }), 0, 0.225, 0, false);
  add(board, new T.BoxGeometry(0.1, 0.03, 0.02), MAT.grey, 0, 0.452, 0.004);
  add(stand, new T.BoxGeometry(0.3, 0.02, 0.16), MAT.dark, 0, 0.01, -0.07);
  function drawSheet() {
    const x = sheet.x, pr = hooks.prints || [];
    x.fillStyle = '#f3efe4'; x.fillRect(0, 0, 512, 660);
    pr.forEach((p, i) => {
      const top = 8 + i * 218;
      if (p.cv.width > 1 && p.cv.height > 1) { try { x.drawImage(p.cv, 10, top + 30, 492, 180); } catch (e) { /* not drawn yet */ } }
      x.fillStyle = '#16161a'; x.textAlign = 'left'; x.font = '30px Hand, "Segoe Print", sans-serif'; x.fillText(p.name, 16, top + 24);
      if (p.ok !== null) { x.fillStyle = p.ok ? '#18a455' : '#c8261c'; x.beginPath(); x.arc(484, top + 14, 11, 0, 7); x.fill(); }
    });
    sheet.t.needsUpdate = true;
  }

  // ---------- controls ----------
  function button(x, z, kind, capMat, r) {
    const g = new T.Group(); bench.add(g); g.position.set(x, 0, z);
    add(g, new T.BoxGeometry(0.105, 0.04, 0.105), kind === 'right' ? MAT.yellow : MAT.metal, 0, 0.02, 0);
    add(g, new T.CylinderGeometry(r * 1.25, r * 1.25, 0.008, 28), MAT.dark, 0, 0.044, 0);
    const cap = add(g, new T.CylinderGeometry(r, r * 1.05, 0.022, 28), capMat, 0, 0.058, 0);
    const pick = add(g, new T.BoxGeometry(0.12, 0.09, 0.12), MAT.pick, 0, 0.045, 0, false); pick.userData = { kind }; picks.push(pick);
    return { g, cap, pick };
  }
  const BTN = { right: button(0.5, 0.12, 'right', MAT.red, 0.034), left: button(-0.5, 0.12, 'left', MAT.grey, 0.028), mid: button(-0.5, -0.03, 'mid', MAT.grey, 0.024) };
  const pips = [];
  for (let i = 0; i < 4; i++) pips.push(add(BTN.left.g, new T.SphereGeometry(0.006, 10, 8), new T.MeshBasicMaterial({ color: 0x222222 }), -0.03 + i * 0.02, 0.043, 0.042, false));
  // engraved plates, relabelled as the bench changes job
  Object.keys(BTN).forEach(n => {
    const b = BTN[n], p = canvasTex(256, 64); b.label = ''; b.cfg = null;
    add(b.g, new T.PlaneGeometry(0.09, 0.0225), new T.MeshStandardMaterial({ map: p.t, roughness: 0.6 }), 0, 0.02, 0.0532, false);
    b.draw = () => { const x = p.x; x.fillStyle = '#101011'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#e9e6dc'; x.textAlign = 'center'; let px = 34; do { x.font = '500 ' + px + 'px PlexMono, Consolas, monospace'; px -= 2; } while (x.measureText(b.label).width > 236 && px > 16); x.fillText(b.label, 128, 43); p.t.needsUpdate = true; };
    b.g.visible = false; b.pick.userData.off = true;
  });
  function setButtons(o) {
    Object.keys(BTN).forEach(n => {
      const b = BTN[n], c = o[n] || null; b.cfg = c; b.g.visible = !!c; b.pick.userData.off = !c;
      if (c && c.label !== b.label) { b.label = c.label; b.draw(); }
    });
  }

  // ---------- props: flasks, equipment, kits, slips, tokens and shop bottles ----------
  const KCOL = { y: 0xffb21a, b: 0x3aa0ff, x: 0xff4d3a, grow: 0x52f08c, tool: 0x9aa0a6 };
  const SH = {
    flask: lathe([[0, 0], [0.3, 0], [0.32, 0.03], [0.1, 0.62], [0.1, 0.82], [0.125, 0.84], [0.1, 0.86]]),
    y: lathe([[0, 0.02], [0.16, 0.05], [0.27, 0.16], [0.3, 0.3], [0.27, 0.44], [0.16, 0.55], [0.09, 0.6], [0.09, 0.85], [0.11, 0.87]]),
    b: lathe([[0, 0], [0.26, 0], [0.27, 0.02], [0.27, 0.6], [0.29, 0.63]]),
    x: lathe([[0, 0], [0.03, 0], [0.03, 0.14], [0.24, 0.5], [0.26, 0.62], [0.2, 0.76], [0.08, 0.82], [0.08, 0.9], [0.1, 0.91]]),
    grow: lathe([[0, 0], [0.09, 0.03], [0.11, 0.1], [0.11, 0.9], [0.13, 0.92]])
  };
  const LQ = {
    flask: [new T.CylinderGeometry(0.2, 0.29, 0.24, 28), 0.15], y: [new T.SphereGeometry(0.27, 28, 12, 0, 6.3, Math.PI / 2, Math.PI / 2), 0.3],
    b: [new T.CylinderGeometry(0.25, 0.25, 0.3, 28), 0.17], x: [new T.CylinderGeometry(0.2, 0.05, 0.3, 24), 0.34], grow: [new T.CylinderGeometry(0.095, 0.095, 0.5, 20), 0.32]
  };
  const PG = { paper: new T.PlaneGeometry(0.72, 0.45), big: new T.PlaneGeometry(1.5, 1), pick: new T.BoxGeometry(0.7, 0.95, 0.7).translate(0, 0.47, 0.1), mini: new T.CylinderGeometry(0.055, 0.055, 0.24, 14), tray: new T.BoxGeometry(0.78, 0.07, 0.32), coin: new T.CylinderGeometry(0.2, 0.2, 0.05, 28), knob: new T.CylinderGeometry(0.2, 0.25, 0.14, 28), box: new T.BoxGeometry(0.42, 0.3, 0.3) };
  const props = new Map();
  function fit(x, text, face, px, maxW, min) { do { x.font = px + 'px ' + face; px -= 2; } while (x.measureText(text).width > maxW && px > (min || 14)); }
  function wrap(x, text, maxW) { const out = []; let line = ''; String(text).split(' ').forEach(w => { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }); if (line) out.push(line); return out; }
  function drawPaper(pr) {
    const d = pr.d, x = pr.paper.x, W = 384, H = 240, lines = d.lines || [];
    x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = d.note ? '#f0d858' : '#efeadb'; x.fillRect(0, 0, W, H);
    if (d.col) { x.fillStyle = 'rgb(' + d.col.join(',') + ')'; x.fillRect(0, 0, W, 16); }
    x.fillStyle = '#16161a'; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    if (d.title) { fit(x, d.title, 'Marker, "Segoe Print", sans-serif', 60, 350, 22); x.fillText(d.title, W / 2, lines.length ? 76 : 140); }
    x.fillStyle = '#2b2f55';
    lines.slice(0, 3).forEach((l, i) => { fit(x, l, 'Hand, "Segoe Print", sans-serif', 44, 350, 20); x.fillText(l, W / 2, 124 + i * 44); });
    if (d.tag) {
      x.font = '40px Marker, "Segoe Print", sans-serif'; const tw = Math.max(70, x.measureText(d.tag).width + 30);
      x.fillStyle = d.dim ? '#77736a' : '#16161a'; x.beginPath(); x.ellipse(W - tw / 2 - 8, H - 34, tw / 2, 28, -0.06, 0, 7); x.fill();
      x.fillStyle = '#fff'; x.fillText(d.tag, W - tw / 2 - 8, H - 20);
    }
    pr.paper.t.needsUpdate = true;
  }
  function mkProp(d) {
    const g = new T.Group(), pr = { uid: d.uid, d, g, sig: '', hop: 0, gone: 0, mats: [], paper: null, yaw: (hash(d.uid + 'yaw') - 0.5) * 0.4 };
    const own = m => { pr.mats.push(m); return m; };
    const body = new T.Group(); g.add(body); pr.body = body; body.rotation.y = pr.yaw;
    const liqC = d.rgb ? rgbHex(d.rgb) : KCOL[d.shape] || 0xffcd00;
    if (d.kind === 'bottle') {
      const lab = canvasTex(512, 256); pr.lab = lab; pr.it = { card: d.card, n: 0 };
      add(body, GEO.liq, own(std({ color: lin(rgbHex(d.card.rgb)), roughness: 0.25, envMapIntensity: 0.5 })), 0, 0.025, 0).scale.y = 0.3 + 0.24 * hash(d.card.id);
      add(body, GEO.label, own(new T.MeshStandardMaterial({ map: lab.t, roughness: 0.85 })), 0, 0.33, 0);
      add(body, GEO.cap, MAT.caps[Math.min(3, d.grade | 0)], 0, 0.925, 0);
      add(body, GEO.glass, MAT.glass, 0, 0, 0, false).renderOrder = 2;
    } else if (d.kind === 'flask' || (d.kind === 'gear' && SH[d.shape])) {
      const k = d.kind === 'flask' ? 'flask' : d.shape;
      add(body, LQ[k][0], own(std({ color: lin(liqC), roughness: 0.25, envMapIntensity: 0.5, emissive: new T.Color(liqC), emissiveIntensity: 0.12 })), 0, LQ[k][1], 0);
      add(body, SH[k], MAT.glass, 0, 0, 0, false).renderOrder = 2;
    } else if (d.kind === 'gear') {
      add(body, PG.box, MAT.metal, 0, 0.15, 0); add(body, PG.knob, MAT.dark, 0, 0.37, 0).scale.setScalar(0.55);
      add(body, new T.SphereGeometry(0.035, 12, 8), own(new T.MeshBasicMaterial({ color: liqC })), 0.13, 0.2, 0.152, false);
    } else if (d.kind === 'kit') {
      add(body, PG.tray, MAT.metal, 0, 0.035, 0);
      (d.cols || []).slice(0, 6).forEach((c, i) => add(body, PG.mini, own(std({ color: lin(rgbHex(c)), roughness: 0.3 })), -0.3 + i * 0.12, 0.19, 0));
    } else if (d.kind === 'token') {
      add(body, PG.coin, d.on ? MAT.caps[3] : MAT.metal, 0, 0.025, 0);
    } else if (d.kind === 'knob') {
      add(body, PG.knob, MAT.dark, 0, 0.07, 0); pr.ptr = add(body, new T.BoxGeometry(0.03, 0.02, 0.2), MAT.yellow, 0, 0.15, 0.08);
    } else if (d.kind === 'book') {
      add(body, new T.BoxGeometry(0.56, 0.07, 0.76), MAT.paper, 0.01, 0.045, 0); add(body, new T.BoxGeometry(0.6, 0.012, 0.8), MAT.red, 0, 0.006, 0); add(body, new T.BoxGeometry(0.6, 0.012, 0.8), MAT.red, 0, 0.086, 0); add(body, new T.BoxGeometry(0.012, 0.09, 0.8), MAT.red, -0.3, 0.046, 0);
    }
    if (d.title || d.lines || d.tag) {
      const p = canvasTex(384, 240), flat = d.kind === 'slip';
      p.mesh = add(g, PG.paper, own(new T.MeshStandardMaterial({ map: p.t, roughness: 0.9 })), 0, flat ? 0.3 : 0.2, flat ? 0 : 0.44, false);
      p.mesh.rotation.set(flat ? -0.3 : -0.62, 0, (hash(d.uid + 'tilt') - 0.5) * 0.1); if (flat) p.mesh.scale.setScalar(1.25);
      if (!flat) { p.mesh.scale.setScalar(d.kind === 'kit' ? 0.78 : 0.62); p.mesh.position.set(0, 0.09, d.kind === 'kit' ? 0.34 : 0.46); p.mesh.rotation.x = -1.05; }
      pr.paper = p;
    }
    pr.pick = add(g, PG.pick, MAT.pick, 0, 0, 0, false); pr.pick.userData = { kind: 'prop', pr }; picks.push(pr.pick);
    g.position.set(d.x, 0.4, d.z); g.scale.setScalar(0.0001); bench.add(g);
    return pr;
  }
  function setProps(list) {
    const seen = new Set();
    list.forEach(d => {
      let pr = props.get(d.uid);
      if (pr && pr.gone) { dropProp(pr); pr = null; }
      if (!pr) { pr = mkProp(d); props.set(d.uid, pr); }
      pr.d = d; seen.add(d.uid); pr.pick.userData.off = !!d.inert;
      const sig = [d.title, (d.lines || []).join('|'), d.tag, d.dim, d.note, fontsOk].join('~');
      if (pr.sig !== sig) {
        pr.sig = sig; if (pr.paper) drawPaper(pr); if (pr.lab) drawLabel(pr);
        const k = d.dim ? 0.35 : 1; pr.mats.forEach(m => { if (m.map) m.color.setScalar(k); });
      }
    });
    props.forEach(pr => { if (!seen.has(pr.uid) && !pr.gone) { pr.gone = 0.0001; pr.pick.userData.off = true; } });
  }
  function dropProp(pr) {
    bench.remove(pr.g); pr.mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
    const i = picks.indexOf(pr.pick); if (i >= 0) picks.splice(i, 1);
    if (props.get(pr.uid) === pr) props.delete(pr.uid); if (hover && hover.pr === pr) hover = null;
  }
  function fire(uid) { const pr = props.get(uid); if (pr) pr.hop = 0.45; }

  // ---------- the tip: one paper tag that stands over whatever the pointer is on ----------
  const tip = canvasTex(512, 512), tipMesh = add(bench, new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: tip.t, transparent: true, depthTest: false, depthWrite: false }), 0, 0, 0, false);
  tipMesh.renderOrder = 20; tipMesh.visible = false; let tipH = 0;
  function setTip(u) {
    const o = u && hooks.tip ? hooks.tip(u) : null;
    if (!o || (!o.title && !(o.lines || []).length)) { tipMesh.visible = false; return; }
    const x = tip.x, rows = [];
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, 512, 512);
    x.font = '30px Hand, "Segoe Print", sans-serif';
    (o.lines || []).forEach(l => wrap(x, l, 460).forEach(r => rows.push(r)));
    const hh = Math.min(512, (o.title ? 64 : 18) + rows.length * 36 + 18);
    x.fillStyle = '#efeadb'; x.fillRect(0, 0, 512, hh); x.fillStyle = '#16161a'; x.fillRect(0, 0, 512, 5);
    x.textAlign = 'left'; x.textBaseline = 'alphabetic';
    if (o.title) { fit(x, o.title, 'Marker, "Segoe Print", sans-serif', 40, 470, 20); x.fillText(o.title, 22, 50); }
    x.fillStyle = '#2b2f55'; x.font = '30px Hand, "Segoe Print", sans-serif';
    rows.forEach((r, i) => x.fillText(r, 22, (o.title ? 92 : 44) + i * 36));
    tip.t.needsUpdate = true; tipH = hh / 512;
    const src = u.kind === 'bottle' ? u.b.g : u.kind === 'prop' ? u.pr.g : BTN[u.kind].g, top = u.kind === 'bottle' || u.kind === 'prop' ? src.scale.x * 1.0 : 0.09;
    const w = 0.34, h2 = w * tipH;
    tipMesh.geometry.dispose(); tipMesh.geometry = new T.PlaneGeometry(w, h2);
    const uv = tipMesh.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - (1 - uv.getY(i)) * tipH);
    tipMesh.position.set(Math.max(-0.36, Math.min(0.4, src.position.x)), top + h2 / 2 + 0.03, src.position.z);
    tipMesh.visible = true;
  }

  // ---------- pointer ----------
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  function pickAt(e) {
    const r = hood.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    const hit = ray.intersectObjects(picks.filter(p => !p.userData.off), false)[0];
    return hit ? hit.object.userData : null;
  }
  // where the pointer meets a level plane just above the bench top, in the bench's own space
  const inv = new T.Matrix4(), ro = new T.Vector3(), rd = new T.Vector3();
  function benchPoint(e) {
    const r = hood.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, cam); bench.updateMatrixWorld(); inv.copy(bench.matrixWorld).invert();
    ro.copy(ray.ray.origin).applyMatrix4(inv); rd.copy(ray.ray.direction).transformDirection(inv);
    if (rd.y > -0.03) return { x: ro.x + rd.x * 1.2, z: -1 };
    const t = (0.05 - ro.y) / rd.y; return { x: ro.x + rd.x * t, z: ro.z + rd.z * t };
  }
  // a bottle is picked up, carried, slid along the shelf to reorder, or held over the molecule and let go to pour
  hood.addEventListener('pointerdown', e => {
    skipClick = false;
    if (e.button !== 0 || busy || drag) return;
    const u = pickAt(e); if (!u || u.kind !== 'bottle' || u.b.gone) return;
    e.stopPropagation(); skipClick = true;
    const p = benchPoint(e), g = u.b.g;
    drag = { b: u.b, id: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false, armed: false, x: g.position.x, z: P.bz, ox: g.position.x - p.x, oz: P.bz - p.z };
    try { hood.setPointerCapture(e.pointerId); } catch (err) { /* no capture */ }
  }, true);
  function drop(cancel) {
    if (!drag) return; const d = drag; drag = null; hood.style.cursor = '';
    try { hood.releasePointerCapture(d.id); } catch (err) { /* not held */ }
    if (cancel || d.b.gone) return;
    d.b.px = d.moved && d.armed ? d.x : null; if (d.moved && !d.armed) { d.b.land = 0.22; if (hooks.lift) hooks.lift(); }
    if (!d.moved || d.armed) hooks.play(d.b.i);
  }
  hood.addEventListener('pointerup', () => drop(false));
  hood.addEventListener('pointercancel', () => drop(true));
  const same = (a, b) => (a && a.kind) === (b && b.kind) && (a && (a.b || a.pr)) === (b && (b.b || b.pr));
  hood.addEventListener('pointermove', e => {
    if (drag) {
      const b = drag.b;
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 7) { drag.moved = true; setTip(null); hood.style.cursor = 'grabbing'; if (hooks.lift) hooks.lift(); }
      if (!drag.moved) return;
      const p = benchPoint(e);
      drag.x = Math.max(-0.62, Math.min(0.62, p.x + drag.ox)); drag.z = Math.max(b.it.live ? -0.06 : P.bz - 0.09, Math.min(P.bz + 0.04, p.z + drag.oz));
      const armed = b.it.live && drag.z < P.bz - 0.11; if (armed !== drag.armed) { drag.armed = armed; if (hooks.lift) hooks.lift(); }
      if (!armed) {
        const uid = b.it.uid, at = order.indexOf(uid), to = Math.max(0, Math.min(b.n - 1, Math.round(drag.x / b.sp + (b.n - 1) / 2)));
        if (at >= 0 && to !== at) { order.splice(at, 1); order.splice(to, 0, uid); bottles.forEach(q => { const nx = (order.indexOf(q.it.uid) - (q.n - 1) / 2) * q.sp; if (q !== b && Math.abs(nx - q.tx) > 1e-4) q.land = 0.14; q.tx = nx; }); if (hooks.lift) hooks.lift(); }
      }
      return;
    }
    const u = pickAt(e), was = hover; hover = u;
    hood.style.cursor = u ? 'pointer' : '';
    const wi = was && was.kind === 'bottle' ? was.b.i : -1, ni = u && u.kind === 'bottle' && !u.b.gone ? u.b.i : -1;
    if (wi !== ni) hooks.hover(ni);
    if (!same(was, u)) { if (u && u.kind === 'prop' && hooks.propHover) hooks.propHover(u.pr.uid); setTip(u); }
  });
  hood.addEventListener('pointerleave', () => { if (hover && hover.kind === 'bottle') hooks.hover(-1); hover = null; setTip(null); });
  hood.addEventListener('click', e => {
    if (skipClick) { skipClick = false; return; }
    const u = pickAt(e); if (!u) return;
    if (u.kind === 'bottle') { if (!u.b.gone) hooks.play(u.b.i); }
    else if (u.kind === 'prop') { u.pr.hop = 0.25; hooks.prop(u.pr.uid); setTip(null); }
    else { press[u.kind] = 0.16; hooks[u.kind](); }
  });

  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('40px Marker'), document.fonts.load('40px Hand'), document.fonts.load('500 22px PlexMono')]).then(() => { fontsOk = true; bottles.forEach(b => { b.sig = ''; }); if (hooks.redraw) hooks.redraw(); Object.keys(BTN).forEach(n => BTN[n].draw()); }, () => {});

  function setState(o) { state = o; cyl.visible = o.cyl !== false; stand.visible = o.stand !== false; meter.visible = o.meter !== false; }

  function update(dt, o) {
    tick++; busy = !!o.busy; if (busy && drag) drop(true);
    // hold the bench at the molecule's distance, without following the short push in after a hit
    s = ease(s, Math.max(640 / 70, Math.min(640 / 14, o.rad * P.dist)), 0.05);
    const p = v.pitch, c = Math.cos(p), sn = Math.sin(p);
    rig.scale.setScalar(s); bench.rotation.x = p; bench.position.set(0, -P.h * c, -1 - P.h * sn);
    v.scene.fog.near = s * 1.7; v.scene.fog.far = s * 3.6;
    // the key light throws the molecule's shadow, and the bench's own, onto the bench top
    const sh = v.key.shadow, sc = sh.camera; v.key.castShadow = true; sh.bias = -0.0004;
    sc.left = sc.bottom = -1.15 * s; sc.right = sc.top = 1.15 * s; sc.near = 0.5; sc.far = s * 5 + 30; sc.updateProjectionMatrix();
    if (tick % 15 === 1) v.root.traverse(m => { if (m.isMesh) m.castShadow = true; });

    const k = 1 - Math.exp(-dt * 11);
    bottles.forEach((b, uid) => {
      const g = b.g, it = b.it, hov = hover && hover.b === b && it.live && !o.busy;
      let tx = b.tx, ty = hov ? 0.018 : 0, tz = P.bz - (it.live ? 0 : 0.085), rz = 0, sc2 = P.bh * b.k * (it.live ? 1 : 0.9);
      if (b.pour > 0) { b.pour -= dt; tx = b.px != null ? b.px : b.tx * 0.55; ty = 0.3; tz = -0.02; rz = (b.tx >= 0 ? 1 : -1) * 1.9; }
      if (drag && drag.b === b && drag.moved && !b.gone && b.pour <= 0) {   // in the hand: it trails the pointer and swings with the lag
        const kd = 1 - Math.exp(-dt * 26), lag = drag.x - g.position.x, lean = drag.armed ? (drag.x >= 0 ? 0.55 : -0.55) : 0;
        g.position.x = ease(g.position.x, drag.x, kd); g.position.z = ease(g.position.z, drag.z, kd);
        g.position.y = ease(g.position.y, 0.05 + Math.max(0, Math.min(0.3, (P.bz - drag.z) * 1.3)), kd);
        g.rotation.z = ease(g.rotation.z, Math.max(-0.6, Math.min(0.6, lag * 14)) + lean, k);
        g.scale.setScalar(ease(g.scale.x, P.bh * b.k * 1.12, k));
        b.ring.position.set(b.tx, 0.003, P.bz); b.ring.scale.setScalar(P.bh * b.k); b.ring.material.color.setHex(0xffffff); b.ring.material.opacity = ease(b.ring.material.opacity, drag.armed ? 0 : 0.5, k);
        return;
      }
      if (b.land > 0) { b.land -= dt; const q = b.land / 0.22; ty += Math.abs(Math.sin(q * Math.PI * 2)) * 0.03 * q; rz += Math.sin(q * Math.PI * 3) * 0.12 * q; }
      if (b.gone) { b.gone += dt; ty = Math.max(ty, 0.36); sc2 = 0.0001; if (b.gone > 0.5) { dropBottle(uid, b); return; } }
      g.position.x = ease(g.position.x, tx, k); g.position.y = ease(g.position.y, ty, k * 1.2); g.position.z = ease(g.position.z, tz, k);
      g.rotation.z = ease(g.rotation.z, rz, k * 0.8); g.scale.setScalar(ease(g.scale.x, sc2, b.gone ? k * 0.6 : k));
      b.ring.position.set(b.tx, 0.003, tz); b.ring.scale.setScalar(P.bh * b.k);
      const rc = it.spoils ? 0xff3324 : it.cont ? 0xffcd00 : 0xffffff, ro = b.gone || b.pour > 0 ? 0 : it.spoils || it.cont ? 0.95 : hov ? 0.6 : 0;
      b.ring.material.color.setHex(rc); b.ring.material.opacity = ease(b.ring.material.opacity, ro, k);
    });

    // cylinder level: full at twice the quota
    level = ease(level, Math.max(0.004, Math.min(1, state.proj / (state.quota * 2))), 1 - Math.exp(-dt * 5));
    liquid.scale.y = level * 0.92;
    const lc = state.met ? 0x3cdc78 : 0xffcd00; liquid.material.color.copy(lin(lc)); liquid.material.emissive.setHex(lc);
    // lamps and pips
    lamps.forEach((l, i) => { l.visible = i < state.max; l.material.color.setHex(i < state.left ? 0xffcd00 : 0x262626); });
    const lc2 = BTN.left.cfg, np = lc2 && lc2.pips != null ? lc2.pips : -1;
    pips.forEach((q, i) => { q.visible = np >= 0; q.material.color.setHex(i < np ? 0xffffff : 0x262626); });
    // the right button lights when it is the thing to press
    const rc2 = BTN.right.cfg;
    MAT.red.emissiveIntensity = rc2 && rc2.lit ? 0.55 + 0.35 * Math.sin(performance.now() / 180) : 0;
    Object.keys(BTN).forEach(n => { press[n] = Math.max(0, (press[n] || 0) - dt); BTN[n].cap.position.y = press[n] > 0 ? 0.05 : 0.058; });
    // props settle into place, hop when they fire, shrink away when removed
    props.forEach(pr => {
      const d = pr.d, g = pr.g, hov = hover && hover.pr === pr && !d.inert;
      if (pr.gone) { pr.gone += dt; g.scale.setScalar(ease(g.scale.x, 0.0001, k * 0.7)); g.position.y = ease(g.position.y, 0.3, k * 0.5); if (pr.gone > 0.45) dropProp(pr); return; }
      pr.hop = Math.max(0, pr.hop - dt);
      const up = (hov ? 0.014 : 0) + (pr.hop > 0 ? Math.sin(Math.min(1, pr.hop / 0.45) * Math.PI) * 0.07 : 0);
      g.position.x = ease(g.position.x, d.x, k); g.position.z = ease(g.position.z, d.z, k); g.position.y = ease(g.position.y, up, k * 1.3);
      g.scale.setScalar(ease(g.scale.x, (d.s || P.bh) * (pr.hop > 0 ? 1.18 : 1), k));
      if (pr.ptr) pr.body.rotation.y = ease(pr.body.rotation.y, 1.2 - (d.value || 0) * 0.48, k);
      if (d.spin) pr.body.rotation.y += dt * 0.5;
    });
    if (tipMesh.visible) tipMesh.rotation.x = -p;
    if (tick % 3 === 0) drawMeter(o.shown, o.y || 0, o.b || 1);
    if (tick % 12 === 0) drawSheet();
  }

  return { setHand, setProps, setButtons, setState, fire, pour, update, P, parts: { bench, rig, cyl, meter, stand, BTN, MAT, props } };
}

AA.rxBench = { make, P };
})(window);
