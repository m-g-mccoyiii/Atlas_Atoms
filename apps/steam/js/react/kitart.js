// Equipment as objects. Every piece is built from plain shapes so that it reads as the thing it is when seen from
// above and in front. Nothing here knows the rules: build(id, THREE, group, color) fills the group and returns true,
// or returns false when there is no object for that id. Sizes are loose, the caller fits the group to its slot.
(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
// Three looks being tried side by side, chosen with ?look= on the page. 'now' is the look before any of them.
//   toy: flat color in a few steps of shade, colors from one small set, a dark ink line round every part
//   desk: glass that refracts, metal that reflects the room, as if on a real table
//   clay: everything matte and a little uneven, no glass, colors from the same small set
const K = { look: 'now' };
const PAL = [0x2b2622, 0xf4efe0, 0xd6453a, 0xf0b93a, 0x3a6fd0, 0x3c9a5f, 0x8a5a2b, 0x8d949c, 0xb0189a, 0x2c2f34];
let ramp = null;
function snap(T, hex) { const c = new T.Color(hex); let best = PAL[0], bd = 9; PAL.forEach(p => { const q = new T.Color(p), d = (q.r - c.r) * (q.r - c.r) + (q.g - c.g) * (q.g - c.g) + (q.b - c.b) * (q.b - c.b); if (d < bd) { bd = d; best = p; } }); return best; }
function mat(T, color, rough, metal, more) {
  const lin = h => new T.Color(h).convertSRGBToLinear(), m = more || {}, glassy = m.transparent && (m.opacity || 1) < 0.6;
  if (K.look === 'toy') {
    if (!ramp) { ramp = new T.DataTexture(new Uint8Array([120, 200, 255]), 3, 1, T.LuminanceFormat); ramp.minFilter = ramp.magFilter = T.NearestFilter; ramp.needsUpdate = true; }
    const o = { color: lin(glassy ? (m.glass || 0xcfe3ee) : snap(T, color)), gradientMap: ramp }; if (m.exact) o.color = lin(color); if (glassy) { o.transparent = true; o.opacity = m.op || 0.5; } if (m.emissive) { o.emissive = m.emissive; o.emissiveIntensity = 0.6; }
    return new T.MeshToonMaterial(o);
  }
  if (K.look === 'clay') return new T.MeshStandardMaterial({ color: lin(glassy ? 0xbfd6e2 : snap(T, color)), roughness: 1, metalness: 0, emissive: m.emissive || new T.Color(0), emissiveIntensity: m.emissive ? 0.5 : 0 });
  if (K.look === 'desk' && glassy) return new T.MeshPhysicalMaterial({ color: lin(0xffffff), roughness: 0.04, metalness: 0, transmission: 0.92, transparent: true, opacity: 1, envMapIntensity: 1.4, clearcoat: 1 });
  return new T.MeshStandardMaterial(Object.assign({ color: lin(color), roughness: rough == null ? 0.6 : rough, metalness: metal || 0 }, m));
}
// what a look does to a finished object: an ink line round each part, or the unevenness of clay
function finish(T, grp, tk) {
  if (K.look !== 'toy' && K.look !== 'clay') return;
  const parts = []; grp.traverse(o => { if (o.isMesh && !o.userData.plain && !o.userData.inked) parts.push(o); });
  parts.forEach(m => {
    if (K.look === 'clay') { const p = m.geometry.attributes.position, a = 0.035; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setXYZ(i, x + a * Math.sin(y * 6.1 + z * 4.3 + 1), y + a * Math.sin(z * 5.7 + x * 4.9 + 2), z + a * Math.sin(x * 6.7 + y * 5.3 + 3)); } p.needsUpdate = true; m.geometry.computeVertexNormals(); return; }
    m.geometry.computeBoundingBox(); const sz = m.geometry.boundingBox.getSize(new T.Vector3()), t = tk || 0.05, o = new T.Mesh(m.geometry, new T.MeshBasicMaterial({ color: new T.Color(0x2b2622).convertSRGBToLinear(), side: T.BackSide }));
    o.position.copy(m.position); o.quaternion.copy(m.quaternion); o.scale.set(m.scale.x * (1 + 2 * t / Math.max(0.05, sz.x * m.scale.x)), m.scale.y * (1 + 2 * t / Math.max(0.05, sz.y * m.scale.y)), m.scale.z * (1 + 2 * t / Math.max(0.05, sz.z * m.scale.z))); o.userData.plain = true; m.userData.inked = true; m.parent.add(o);
  });
}
const HOMID = { water: 'homwater', h2: 'homh2', co2: 'homco2', acid: 'homacid', wood: 'homwood', salt: 'homsalt', slime: 'homslime', ammonia: 'homammonia', seedling: 'homseed', brimstone: 'hombrimstone' };
// how each creature stands when tucked in its jar: its own character (pose with tuck: true; t makes the balloon bob)
const CHAR = {
  homwood: R => { R.body.rotation.z = 0.42; R.body.rotation.x = 0.05; },
  homh2: (R, o) => { R.body.position.y = 0.45 + 0.06 * Math.sin((o.t || 0) * 2.2); R.body.rotation.z = 0.08; },
  homsalt: R => { R.body.scale.y *= 0.82; R.body.scale.x *= 1.04; R.body.rotation.x = 0.12; },
  homslime: R => { R.body.scale.y *= 0.85; R.body.rotation.z = -0.2; },
  homammonia: R => { R.body.rotation.z = -0.38; },
  homacid: R => { R.body.scale.y *= 0.92; R.body.rotation.x = 0.18; },
  homco2: R => { R.body.rotation.y = 0.5; },
  homwater: R => { R.body.rotation.z = 0.12; },
  homseed: R => { R.body.rotation.z = -0.08; }
};
function build(id, T, grp, tint, extra) {
  const lin = h => new T.Color(h).convertSRGBToLinear();
  let cur = null;
  const M = (color, rough, metal, more) => mat(T, color, rough, metal, more);
  const steel = M(0x9aa3ad, 0.3, 0.8), dark = M(0x2c2f34, 0.55, 0.3), brass = M(0xc9a23a, 0.35, 0.8), wood = M(0x8a5a2b, 0.7), paper = M(0xf4efe0, 0.9), white = M(0xf2f2ee, 0.4);
  const red = M(0xc8261c, 0.5), black = M(0x16161a, 0.6), rubber = M(0x7a3b2e, 0.8), gold = M(0xe2b23a, 0.25, 0.9), lead = M(0x6b7078, 0.5, 0.6);
  const glass = M(0xdfe9ee, 0.08, 0, { transparent: true, opacity: 0.42 });
  const liq = mat(T, tint.getHex(), 0.3);
  const glow = c => mat(T, c, 0.4, 0, { emissive: lin(c), emissiveIntensity: 0.8 });
  const put = (geo, mat, x, y, z, rot, scl) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); if (rot) m.rotation.set(rot[0], rot[1], rot[2]); if (scl) m.scale.set(scl[0], scl[1], scl[2]); m.castShadow = true; m.receiveShadow = true; (cur || grp).add(m); return m; };
  const box = (w, h, d, mat, x, y, z, rot) => put(new T.BoxGeometry(w, h, d), mat, x, y, z, rot);
  const cyl = (rt, rb, h, mat, x, y, z, rot, seg) => put(new T.CylinderGeometry(rt, rb, h, seg || 20), mat, x, y, z, rot);
  const sph = (r, mat, x, y, z, scl) => put(new T.SphereGeometry(r, 20, 14), mat, x, y, z, null, scl);
  const tor = (R, r, mat, x, y, z, rot, arc) => put(new T.TorusGeometry(R, r, 8, 28, arc || Math.PI * 2), mat, x, y, z, rot);
  const rod = (a, b, r, mat) => { const A = new T.Vector3(a[0], a[1], a[2]), d = new T.Vector3(b[0], b[1], b[2]).sub(A), len = d.length(); const m = put(new T.CylinderGeometry(r, r, len, 12), mat, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m; };
  const bone = M(0xe9e4d2, 0.6);
  // a hand of bones lying on the page, fingers away from the viewer
  const bones = (x, y, z) => { sph(0.2, bone, x, y, z, [1, 0.35, 1.1]); [-1.5, -0.5, 0.5, 1.5].forEach(k => { rod([x + k * 0.1, y, z - 0.15], [x + k * 0.17, y + 0.02, z - 0.62], 0.04, bone); sph(0.05, bone, x + k * 0.17, y + 0.02, z - 0.62); }); rod([x + 0.2, y, z], [x + 0.44, y, z - 0.25], 0.04, bone); rod([x, y, z + 0.15], [x - 0.1, y, z + 0.8], 0.07, bone); };
  const H = Math.PI / 2, PI = Math.PI, side = [-1, 1];
  // creatures: body() starts the part that squashes and leans from the feet, arm() hangs an arm on a pivot, into() puts parts inside a pivot, floor() keeps what lies on the page out of a jar
  const R = { T, body: null, arms: [], extra: [], lean0: [0, 0] }, jarMode = !!(extra && extra.jar);
  const body = () => { R.body = new T.Group(); grp.add(R.body); cur = R.body; return R.body; };
  const into = (g, f) => { const p = cur; cur = g; f(); cur = p; };
  const U = [], act = f => U.push(f), pivot = (x, y, z) => { const g = new T.Group(); g.position.set(x, y, z); (cur || grp).add(g); return g; }, cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const arrow = (ax, ay, bx, by, z, m, w) => { const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy), a = Math.atan2(dy, dx), hl = w * 1.8, g = pivot(ax, ay, z); g.rotation.z = a; into(g, () => { box(L - hl, w, w * 0.8, m, (L - hl) / 2, 0, 0); put(new T.ConeGeometry(w * 1.05, hl, 4), m, L - hl / 2, 0, 0, [0, 0, -H], [1, 1, 0.5]); }); return g; };
  const drop = (x, y, z, r, m) => { const g = pivot(x, y, z); into(g, () => { sph(r, m, 0, 0, 0); put(new T.ConeGeometry(r * 0.82, r * 1.5, 10), m, 0, r * 1.1, 0); }); return g; };
  const floor = f => { if (!jarMode) { const p = cur; cur = null; f(); cur = p; } };
  const arm = (sx, sy, sz, len, r, m, hm, hr, ang, stretch) => { const pv = new T.Group(); pv.position.set(sx, sy, sz); (cur || grp).add(pv); into(pv, () => { rod([0, 0, 0], [0, -len, 0], r, m); if (hm) sph(hr, hm, 0, -len, 0); }); const q = new T.Quaternion().setFromEuler(new T.Euler(0, 0, (sx < 0 ? -1 : 1) * ang)); pv.quaternion.copy(q); R.arms.push({ g: pv, rest: q, stretch: stretch || 0, home: pv.position.clone() }); return pv; };
  const eyes = (y, z, gap, r, dy) => side.forEach(q => { sph(r || 0.055, black, q * gap, y + (q > 0 ? (dy || 0) : 0), z).userData.plain = true; });
  const shine = (x, y, z, w, h, rz) => box(w, h, 0.02, M(0xffffff, 0.2), x, y, z, [0, 0, rz || 0.3]).userData.plain = true;
  const legs = (y, gap, m, spread) => side.forEach(q => { rod([q * gap, y, 0], [q * (gap + (spread || 0.06)), 0.07, 0.04], 0.05, m); sph(0.1, m, q * (gap + (spread || 0.06)), 0.06, 0.1, [1, 0.55, 1.5]); });
  // a jar for one creature: glass on a wooden foot, a dark lid, the substance as a level, the creature growing in it
  // (stage 0 a speck, 1 half grown, 2 ready). The returned group has userData.set(fill 0..1, stage) and userData.fill, userData.stage
  const JC = { homunculus: [0x3a6fd0, 0.9], water: [0x3a6fd0, 0.9], h2: [0xe58a7c, 0.8], co2: [0xbcd8e6, 0.9], acid: [0x3c9a5f, 0.9], wood: [0x8a5a2b, 0.9], salt: [0xd9d3bf, 1], slime: [0x7fd14a, 0.9], ammonia: [0xdfe0b0, 0.9], seedling: [0x3a2a1e, 1], brimstone: [0xf0b93a, 1] };
  const HOMID2 = Object.assign({ homunculus: 'homclay' }, HOMID);
  const JW = { homunculus: 1, salt: 0.72, brimstone: 0.85, slime: 0.9, h2: 0.9 };
  const mkJar = (k, fill, stage, at) => {
    const g = new T.Group(), jc = JC[k] || [0x3a6fd0, 0.9], ink = new T.MeshBasicMaterial({ color: lin(0x2b2622) }), pl = (m, c) => { m.userData.plain = true; if (c) m.castShadow = false; return m; };

    const n0 = grp.children.length;
    cyl(1.0, 1.05, 0.14, wood, 0, 0.07, 0, null, 28);
    pl(put(new T.CylinderGeometry(0.94, 0.94, 2.15, 28, 1, true), M(0xdfe9ee, 0.08, 0, { transparent: true, opacity: 0.1, op: 0.12 }), 0, 1.22, 0), 1).renderOrder = 3;
    pl(tor(0.94, 0.035, ink, 0, 0.17, 0, [H, 0, 0]), 1); pl(tor(0.94, 0.035, ink, 0, 2.3, 0, [H, 0, 0]), 1);
    if (!K.nolid) cyl(0.99, 0.99, 0.2, dark, 0, 2.4, 0, null, 28); shine(-0.6, 1.3, 0.72, 0.06, 0.9, 0.0);
    const parts = grp.children.splice(n0); parts.forEach(p => g.add(p));
    const col = new T.Color(jc[0]).convertSRGBToLinear(), cfl = mat(T, jc[0]).color.clone();
    const lq = pl(new T.Mesh(new T.CylinderGeometry(0.88, 0.88, 1, 28, 1, true), new T.MeshBasicMaterial({ color: cfl, side: T.BackSide }))); g.add(lq);
    const sf = pl(new T.Mesh(new T.CircleGeometry(0.88, 28).rotateX(-H), new T.MeshBasicMaterial({ color: cfl.clone().lerp(new T.Color(0xffffff), 0.25), transparent: true, opacity: 0.35, depthWrite: false }))); g.add(sf);
    const lv = pl(new T.Mesh(new T.TorusGeometry(0.89, 0.03, 6, 28).rotateX(H), ink)); g.add(lv);
    const sp = new T.Group(); g.add(sp); const dot = new T.Mesh(new T.SphereGeometry(0.16, 12, 10), mat(T, k === 'water' ? 0x3a6fd0 : jc[0], 0.4)); dot.position.set(0.12, 0.4, 0.2); dot.castShadow = true; sp.add(dot);
    // every vertex of what is in obj, in the frame of root: how far from the axis, and how low and high
    const meas = (obj, root, cx, cz) => { obj.updateMatrixWorld(true); root.updateMatrixWorld(true); const inv = new T.Matrix4().copy(root.matrixWorld).invert(), v = new T.Vector3(), b = { x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9, y0: 1e9, y1: -1e9, r: 0 };
      obj.traverse(m => { if (!m.isMesh || !m.visible) return; const pa = m.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(m.matrixWorld).applyMatrix4(inv); b.x0 = Math.min(b.x0, v.x); b.x1 = Math.max(b.x1, v.x); b.z0 = Math.min(b.z0, v.z); b.z1 = Math.max(b.z1, v.z); b.y0 = Math.min(b.y0, v.y); b.y1 = Math.max(b.y1, v.y); b.r = Math.max(b.r, Math.hypot(v.x - (cx || 0), v.z - (cz || 0))); } }); return b; };
    // the creature with its arms tucked in, measured once: the biggest it can be and still clear the glass all round and the lid
    const JPRESS = { wood: [-1, 0], slime: [1, 0], ammonia: [1, 0], salt: [0, 1] };
    const probe = new T.Group(); build(HOMID2[k], T, probe, tint, { jar: true, ink: 0.05 }); pose(probe, { tuck: 1 }); const hold = new T.Group(); hold.add(probe);
    let mb = meas(probe, hold); const ccx = (mb.x0 + mb.x1) / 2, ccz = (mb.z0 + mb.z1) / 2; mb = meas(probe, hold, ccx, ccz);
    const S2 = Math.min(0.78 / mb.r, 1.95 / (mb.y1 - mb.y0), 1.2);
    const cs = sc => { const c = new T.Group(); build(HOMID2[k], T, c, tint, { jar: true, ink: 0.04 / sc }); pose(c, { tuck: 1 }); c.scale.setScalar(sc); c.position.set(-ccx * sc, 0.21 - mb.y0 * sc, -ccz * sc); g.add(c);
      const pr = JPRESS[k]; if (pr) { const r0 = meas(c, g).r, sl = Math.max(0, 0.8 - r0); c.position.x += pr[0] * sl; c.position.z += pr[1] * sl; } return c; };
    const mid = cs(S2 * 0.62), big = cs(S2);
    g.userData.report = () => { const o = {}; [['speck', sp], ['half', mid], ['ready', big]].forEach(q => { const b = meas(q[1], g); o[q[0]] = { r: +b.r.toFixed(2), y0: +b.y0.toFixed(2), y1: +b.y1.toFixed(2), ok: b.r <= 0.84 && b.y0 >= 0.14 && b.y1 <= 2.2 }; }); return o; };
    g.userData.set = (f, st) => { f = Math.max(0, Math.min(1, f)); st = st == null ? (f < 0.34 ? 0 : f < 1 ? 1 : 2) : st; const h = 0.05 + f * 1.8; lq.scale.y = h; lq.position.y = 0.17 + h / 2; sf.position.y = lv.position.y = 0.17 + h; lq.visible = sf.visible = lv.visible = f > 0.001; sp.visible = st === 0; mid.visible = st === 1; big.visible = st === 2; g.userData.fill = f; g.userData.stage = st; };
    g.userData.set(fill, stage); if (at) g.position.set(at, 0, 0); grp.add(g); return g;
  };
  const B = {
    balance() { box(2.6, 0.3, 1.2, wood, 0, 0.15, 0); cyl(0.13, 0.19, 1.8, brass, 0, 1.2, 0); sph(0.21, brass, 0, 2.16, 0); rod([-1.3, 1.84, 0], [1.3, 2.14, 0], 0.075, brass); [[-1.3, 1.84, 0.92], [1.3, 2.14, 1.22]].forEach(q => { [-0.46, 0.46].forEach(dx => rod([q[0], q[1], 0], [q[0] + dx, q[2] + 0.08, 0], 0.035, brass)); cyl(0.66, 0.42, 0.18, brass, q[0], q[2], 0); }); box(0.42, 0.36, 0.42, wood, -1.3, 1.18, 0); },
    spatula() { const pw = M(0xf4efe0, 0.9); cyl(0.15, 0.15, 2.0, steel, 0.2, 0.16, 0, [0, 0, H]); cyl(0.22, 0.22, 0.9, wood, 1.0, 0.16, 0, [0, 0, H]); sph(0.58, steel, -1.1, 0.16, 0, [1.4, 0.3, 1.1]); sph(0.42, pw, -1.1, 0.36, 0, [1.2, 0.8, 1]); },
    // schlenk line: one glass pipe on two posts with three taps and three flasks hanging from it, so a thing happens in several places at once
    schlenk() { const pipe = M(0xdfe9ee, 0.1, 0, { transparent: true, opacity: 0.45, op: 0.45 }), fc = [M(0xf0b93a, 0.3), M(0x3a6fd0, 0.3), M(0xd6453a, 0.3)];
      box(3.9, 0.16, 1.0, dark, 0, 0.08, 0); side.forEach(q => cyl(0.1, 0.1, 2.5, steel, q * 1.75, 1.3, 0));
      cyl(0.26, 0.26, 3.9, pipe, 0, 2.6, 0, [0, 0, H], 16);
      [-1.2, 0, 1.2].forEach((x, i) => { cyl(0.12, 0.12, 0.7, pipe, x, 2.1, 0); cyl(0.2, 0.2, 0.3, red, x, 2.3, 0, [H, 0, 0]); box(0.5, 0.12, 0.14, red, x, 2.3, 0.28); sph(0.52, fc[i], x, 1.1, 0); cyl(0.2, 0.26, 0.3, fc[i], x, 1.65, 0); });
      shine(-1.7, 2.8, 0.3, 0.7, 0.07, 0.0); },
    // stopper: a conical flask of yellow with a big cork pressed into its neck and an arrow pointing at the cork
    stopper() { const gl = M(0xdfe9ee, 0.1, 0, { transparent: true, opacity: 0.4, op: 0.4 }), yl = M(0xf0b93a, 0.3), ck = M(0xc9a36a, 0.8, 0, { exact: 1 });
      cyl(0.5, 1.15, 1.5, gl, 0, 0.75, 0, null, 24); cyl(0.7, 1.1, 0.7, yl, 0, 0.4, 0, null, 24); cyl(0.5, 0.5, 0.5, gl, 0, 1.75, 0);
      cyl(0.62, 0.45, 0.8, ck, 0, 2.2, 0, null, 20); [0, 1].forEach(k => box(0.5, 0.05, 0.05, black, 0, 2.05 + k * 0.3, 0.55).userData.plain = true); arrow(0, 3.9, 0, 2.85, 0, M(0xd6453a, 0.5), 0.3); },
    // mirror: a hand mirror hung in a stand; in use (1) it tilts back to face the work
    mirror() { const gl = M(0x8d949c, 0.4), fr = M(0xf0b93a, 0.35, 0.8);
      cyl(0.8, 0.95, 0.16, fr, 0, 0.08, 0, null, 24); side.forEach(q => rod([q * 0.98, 0.1, 0], [q * 0.98, 1.9, 0], 0.09, fr));
      const mp = pivot(0, 1.9, 0); into(mp, () => { tor(0.82, 0.13, fr, 0, 0, 0); cyl(0.8, 0.8, 0.08, gl, 0, 0, 0, [H, 0, 0], 28); rod([0, -0.9, 0], [0, -1.55, 0], 0.11, fr); shine(-0.3, 0.3, 0.1, 0.12, 0.6, 0.6); });
      act(v => { mp.rotation.x = -v * 0.65; }); },
    mortar() { const white = M(0x8d98a6, 0.5); cyl(1.0, 0.6, 0.9, white, 0, 0.45, 0); cyl(0.7, 0.7, 0.03, liq, 0, 0.88, 0); rod([0.1, 0.8, 0], [1.0, 2.0, 0.2], 0.14, white); sph(0.2, white, 1.0, 2.0, 0.2); },
    cannula() { const tube = M(0xbfe3f2, 0.12, 0, { transparent: true, opacity: 0.8 }), bright = M(0xd8dee6, 0.2, 0.9), cork = M(0xb98a4e, 0.9); box(1.2, 0.1, 0.95, steel, -1.1, 0.05, 0); box(1.2, 0.1, 0.95, steel, -1.1, 0.5, 0); rod([-1.6, 0.1, 0.4], [-0.6, 0.45, 0.4], 0.04, steel); rod([-0.6, 0.1, 0.4], [-1.6, 0.45, 0.4], 0.04, steel); tor(0.34, 0.1, cork, -1.1, 0.62, 0, [H, 0, 0]); sph(0.52, liq, -1.1, 1.14, 0); cyl(0.17, 0.17, 0.5, tube, -1.1, 1.84, 0); cyl(0.21, 0.21, 0.15, red, -1.1, 2.12, 0); tor(0.34, 0.1, cork, 1.1, 0.1, 0, [H, 0, 0]); sph(0.52, tube, 1.1, 0.62, 0); sph(0.5, liq, 1.1, 0.44, 0, [1.05, 0.6, 1.05]); cyl(0.17, 0.17, 0.5, tube, 1.1, 1.32, 0); cyl(0.21, 0.21, 0.15, red, 1.1, 1.6, 0); tor(1.1, 0.06, bright, 0, 2.15, 0, null, PI); rod([-1.1, 2.15, 0], [-1.1, 1.9, 0], 0.06, bright); rod([1.1, 2.15, 0], [1.1, 0.45, 0], 0.06, bright); rod([1.25, 1.65, 0], [1.5, 2.0, 0], 0.03, bright); sph(0.24, red, 1.62, 2.22, 0, [1, 1.2, 1]); },
    // reflux: a flask over a flame, a tall blue water jacket on it, a red arrow up (vapor) and a blue arrow down (drops), so the same stuff goes round and round
    reflux() { const mg = M(0xb0189a, 0.3), jk = M(0x3a6fd0, 0.3), wh = M(0xf4efe0, 0.4), fl = M(0xf0b93a, 0.4, 0, { emissive: new T.Color(0x6a4a10) });
      cyl(1.0, 1.1, 0.16, dark, 0, 0.08, 0); put(new T.ConeGeometry(0.3, 0.6, 10), fl, 0, 0.5, 0); sph(0.85, mg, 0, 1.6, 0); cyl(0.3, 0.38, 0.7, wh, 0, 2.5, 0);
      cyl(0.5, 0.5, 1.8, jk, 0, 3.6, 0); cyl(0.55, 0.55, 0.14, wh, 0, 2.75, 0); cyl(0.55, 0.55, 0.14, wh, 0, 4.5, 0); cyl(0.3, 0.3, 0.3, wh, 0, 4.75, 0);
      arrow(-1.25, 2.4, -1.25, 4.2, 0, red, 0.32); arrow(1.25, 4.2, 1.25, 2.4, 0, jk, 0.32); shine(-0.2, 3.7, 0.5, 0.1, 1.0, 0.0); },
    // burette: a tall tube of green on a stand with a red tap; a drop forms (0 to 0.5) and falls (0.5 to 1) into the flask below
    burette() { const gr = M(0x3c9a5f, 0.3), tube = M(0xdfe9ee, 0.1, 0, { transparent: true, opacity: 0.4, op: 0.4 }), fl2 = M(0xdfe9ee, 0.1, 0, { transparent: true, opacity: 0.4, op: 0.4 });
      box(1.9, 0.16, 1.1, dark, 0, 0.08, 0); cyl(0.07, 0.07, 3.9, steel, -0.75, 2.0, 0); box(0.95, 0.12, 0.2, steel, -0.35, 3.0, 0);
      cyl(0.32, 0.32, 2.4, tube, 0.1, 2.5, 0); cyl(0.24, 0.24, 1.6, gr, 0.1, 2.2, 0); box(0.5, 0.16, 0.16, red, 0.1, 1.2, 0); put(new T.ConeGeometry(0.1, 0.3, 8), steel, 0.1, 1.0, 0, [PI, 0, 0]);
      cyl(0.5, 0.5, 0.45, fl2, 0.1, 0.4, 0); cyl(0.16, 0.5, 0.35, fl2, 0.1, 0.75, 0); cyl(0.46, 0.46, 0.1, gr, 0.1, 0.28, 0).userData.plain = true;
      const dp = drop(0.1, 0.88, 0, 0.2, gr); act(v => { if (v < 0.5) { const k = v * 2; dp.scale.setScalar(0.1 + 0.9 * k); dp.position.y = 0.88 - 0.05 * k; dp.visible = true; } else { const f = (v - 0.5) * 2; dp.scale.set(1, 1 + 0.6 * f, 1); dp.position.y = 0.83 - f * 0.4; dp.visible = f < 0.95; } }); },
    clamp() { box(1.5, 0.12, 1.0, dark, -0.3, 0.06, 0); cyl(0.07, 0.07, 3.0, steel, -0.6, 1.5, 0); box(0.3, 0.3, 0.3, dark, -0.6, 2.2, 0); rod([-0.6, 2.2, 0], [0.5, 2.2, 0], 0.05, steel); tor(0.35, 0.07, steel, 0.85, 2.2, 0, [H, 0, 0], PI * 1.5); cyl(0.1, 0.1, 0.3, brass, -0.6, 2.2, 0.3, [H, 0, 0]); },
    // magnet: a red horseshoe with silver tips, standing; in use (1) it leans in toward the work
    magnet() { const mg = pivot(0, 0, 0); into(mg, () => { tor(0.75, 0.26, red, 0, 1.4, 0, null, PI); side.forEach(q => { cyl(0.26, 0.26, 0.9, red, q * 0.75, 0.95, 0); cyl(0.27, 0.27, 0.5, steel, q * 0.75, 0.3, 0); }); shine(-0.55, 1.9, 0.27, 0.1, 0.35, 0.8); });
      act(v => { mg.rotation.x = -v * 0.6; mg.position.z = -v * 0.25; }); },
    recycler() { const pipe = M(0x8f9aa6, 0.35, 0.7); cyl(0.3, 1.0, 1.5, glass, 0, 0.75, 0); cyl(0.7, 0.96, 0.6, liq, 0, 0.32, 0); cyl(0.3, 0.3, 0.45, glass, 0, 1.72, 0); cyl(0.16, 0.16, 0.22, brass, 0.92, 0.35, 0, [0, 0, H]); cyl(0.34, 0.34, 0.14, brass, 0, 1.98, 0); [[[1.0, 0.35, 0], [1.6, 0.35, 0]], [[1.6, 0.35, 0], [1.6, 2.6, 0]], [[1.6, 2.6, 0], [0, 2.6, 0]], [[0, 2.6, 0], [0, 2.0, 0]]].forEach(q => { rod(q[0], q[1], 0.1, pipe); sph(0.1, pipe, q[1][0], q[1][1], 0); }); box(0.5, 0.5, 0.45, dark, 1.6, 0.75, 0); cyl(0.1, 0.1, 0.08, red, 1.6, 0.75, 0.26, [H, 0, 0]); put(new T.CylinderGeometry(0, 0.24, 0.36, 12), red, 1.6, 1.75, 0); put(new T.CylinderGeometry(0, 0.24, 0.36, 12), red, 0.75, 2.6, 0, [0, 0, H]); },
    stirrer() { const shell = M(0xe6f1f8, 0.2), body = M(0x6f7f95, 0.5); box(2.3, 0.5, 1.9, body, 0, 0.25, 0); cyl(0.9, 0.9, 0.08, white, 0, 0.54, -0.1); cyl(0.26, 0.26, 0.16, dark, -0.5, 0.26, 0.98, [H, 0, 0]); box(0.05, 0.2, 0.04, white, -0.5, 0.33, 1.07); cyl(0.09, 0.09, 0.06, red, 0.55, 0.26, 0.97, [H, 0, 0]); cyl(0.55, 0.5, 0.95, shell, 0, 1.06, -0.1); cyl(0.56, 0.51, 0.55, liq, 0, 0.87, -0.1); tor(0.3, 0.045, white, 0, 1.16, -0.1, [H, 0, 0], PI * 1.5); cyl(0.07, 0.07, 0.5, white, 0, 0.66, 0.42, [0, 0, H]); },
    cards() { const tin = M(0x2f8a6a, 0.6), tabs = [red, M(0xf2c41a, 0.6), M(0x2f6fd0, 0.6)]; box(1.9, 0.9, 1.1, tin, 0, 0.45, 0); box(1.7, 0.1, 0.9, dark, 0, 0.9, 0).userData.plain = true; [-0.32, -0.1, 0.12, 0.34].forEach((z, k) => { box(1.6, 1.0, 0.05, paper, 0, 1.15 + (k % 2) * 0.05, z, [0.12, 0, 0]); if (k < 3) box(0.4, 0.22, 0.06, tabs[k], -0.5 + k * 0.5, 1.75 + (k % 2) * 0.05, z + 0.08, [0.12, 0, 0]); }); [0.2, 0.0].forEach(q => box(1.2, 0.03, 0.02, dark, 0, 1.3 + q, 0.4, [0.12, 0, 0]).userData.plain = true); box(0.5, 0.2, 0.04, paper, 0, 0.45, 0.57); },
    logbook() { const cov = M(0x1d1c1c, 0.7), pencil = M(0xf2c41a, 0.5); box(1.7, 2.2, 0.36, cov, 0, 1.2, 0); box(1.62, 2.1, 0.3, paper, 0.08, 1.2, 0); box(1.7, 2.2, 0.05, cov, 0, 1.2, 0.19); box(0.26, 2.22, 0.42, red, -0.74, 1.2, 0); [[-0.3, 2.0], [0.4, 1.9], [0.55, 1.1], [-0.2, 0.5], [0.35, 0.4], [-0.45, 1.0], [0.1, 0.75], [0.6, 0.6], [0.2, 2.1], [-0.4, 0.25]].forEach(q => sph(0.05, white, q[0], q[1], 0.22, [1.4, 1, 0.3]).userData.plain = true); box(1.0, 0.6, 0.03, white, 0.1, 1.5, 0.22).userData.plain = true; [1.62, 1.44].forEach(y => box(0.8, 0.04, 0.02, dark, 0.1, y, 0.24).userData.plain = true); rod([0.95, 0.12, 0.5], [-0.6, 0.12, 0.75], 0.07, pencil); put(new T.CylinderGeometry(0, 0.07, 0.2, 8), wood, -0.7, 0.12, 0.77, [0, 0, H], null); },
    // seed crystal: a cluster of blue crystals in a dish; in use (1) it has grown
    crystal() { const c = M(0x3a6fd0, 0.2), dish = M(0x8d949c, 0.5);
      cyl(0.9, 0.7, 0.2, dish, 0, 0.1, 0, null, 24); const cg = pivot(0, 0.2, 0);
      [[0, 0, 1.0, 0], [-0.6, 0.2, 0.65, 0.35], [0.6, -0.1, 0.6, -0.4], [0.2, 0.55, 0.42, 0.15]].forEach(q => { const g2 = new T.Group(); g2.position.set(q[0], 0, q[1]); g2.rotation.z = q[3]; cg.add(g2); const h = q[2] * 1.5, r = 0.3 * q[2] + 0.1; into(g2, () => { cyl(r, r, h, c, 0, h / 2, 0, null, 6); put(new T.ConeGeometry(r, r * 1.2, 6), c, 0, h + r * 0.6, 0); }); });
      into(cg, () => shine(-0.14, 1.0, 0.3, 0.07, 0.6, 0.0)); act(v => cg.scale.setScalar(0.6 + 0.5 * v)); },
    scalepan() { const br = M(0xf0b93a, 0.35, 0.8); box(2.7, 0.16, 1.0, wood, 0, 0.08, 0); [[-0.85, 0.75, 0.42], [0.1, 0.55, 0.33], [0.9, 0.38, 0.25]].forEach(q => { cyl(q[2], q[2], q[1], br, q[0], 0.16 + q[1] / 2, 0, null, 24); cyl(q[2] * 0.3, q[2] * 0.3, 0.14, br, q[0], 0.16 + q[1] + 0.07, 0); sph(q[2] * 0.42, br, q[0], 0.16 + q[1] + 0.22, 0, [1, 0.6, 1]); tor(q[2] + 0.01, 0.02, dark, q[0], 0.16 + q[1] * 0.7, 0, [H, 0, 0]); }); },
    // cold trap: a steel flask packed with ice and frost; a blue drop falls into it
    coldtrap() { const ice = M(0xbfe6fa, 0.3, 0, { exact: 1 }), bl = M(0x3a6fd0, 0.3), fr = M(0xf4efe0, 0.5);
      cyl(0.95, 0.75, 1.6, steel, 0, 0.8, 0, null, 24); cyl(1.0, 1.0, 0.18, fr, 0, 1.65, 0, null, 24); cyl(0.4, 0.4, 0.5, dark, 1.1, 0.5, 0.4, [0, 0, H]);
      [[-0.55, 0.3], [0.1, -0.35], [0.6, 0.25], [-0.1, 0.4]].forEach((q, k) => box(0.5, 0.5, 0.5, ice, q[0], 2.0 + (k % 2) * 0.1, q[1], [0.3 * k, 0.6 + k, 0.2]));
      drop(0, 3.4, 0, 0.22, bl); arrow(0, 4.3, 0, 3.7, 0, bl, 0.2); },
    // burner: a bunsen burner; the flame is low (0) or high (1)
    bunsen() { const hose = M(0xd6453a, 0.7), fo = M(0xf0b93a, 0.4, 0, { emissive: new T.Color(0x6a4a10) }), fi = M(0x3a6fd0, 0.4, 0, { emissive: new T.Color(0x102a6a) });
      cyl(0.85, 1.0, 0.22, dark, 0, 0.11, 0); cyl(0.26, 0.3, 1.3, steel, 0, 0.85, 0); cyl(0.36, 0.36, 0.3, brass, 0, 0.55, 0); cyl(0.3, 0.3, 0.1, brass, 0, 1.55, 0); sph(0.1, black, 0, 0.55, 0.34, [1, 1.2, 0.4]).userData.plain = true;
      rod([0.6, 0.3, 0], [1.3, 0.2, 0.3], 0.1, hose); rod([1.3, 0.2, 0.3], [1.35, 0.15, 0.9], 0.1, hose);
      const fl = pivot(0, 1.6, 0); into(fl, () => { sph(0.34, fo, 0, 0.3, 0, [1, 1.3, 1]); put(new T.ConeGeometry(0.34, 1.1, 12), fo, 0, 0.8, 0); put(new T.ConeGeometry(0.16, 0.6, 10), fi, 0, 0.45, 0.0).userData.plain = true; });
      act(v => { fl.scale.set(0.8 + 0.25 * v, 0.4 + 1.2 * v, 0.8 + 0.25 * v); }); },
    litmus() { const pink = M(0xe0304a, 0.8), blue = M(0x2f5fd0, 0.8), shell = M(0xe6f1f8, 0.2); box(1.3, 0.3, 0.6, wood, 0.6, 0.15, 0); [-0.7, -0.35, 0, 0.35, 0.7].forEach((a, k) => { const c = Math.cos(a), sn = Math.sin(a), top = k % 2 ? pink : blue; box(0.22, 0.9, 0.04, paper, 0.6 + sn * 0.6, 0.3 + c * 0.6, 0.02 * k, [0, 0, -a]); box(0.22, 0.75, 0.05, top, 0.6 + sn * 1.38, 0.3 + c * 1.38, 0.02 * k, [0, 0, -a]); }); cyl(0.5, 0.42, 0.7, shell, -0.95, 0.35, 0); cyl(0.51, 0.44, 0.34, liq, -0.95, 0.19, 0).userData.plain = true; box(0.2, 1.3, 0.04, paper, -0.85, 1.0, 0, [0, 0, -0.2]); box(0.2, 0.5, 0.05, pink, -0.98, 0.42, 0.02, [0, 0, -0.2]); },
    stopwatch() { cyl(0.95, 0.95, 0.28, steel, 0, 0.14, 0); cyl(0.8, 0.8, 0.02, white, 0, 0.29, 0); box(0.06, 0.03, 0.6, red, 0, 0.31, -0.28); box(0.35, 0.03, 0.05, black, 0.16, 0.31, 0); cyl(0.06, 0.06, 0.04, black, 0, 0.32, 0); cyl(0.16, 0.16, 0.35, steel, 0, 0.14, -1.1, [H, 0, 0]); tor(0.22, 0.05, steel, 0, 0.14, -1.45, [H, 0, 0]); },
    thermometer() { box(1.2, 0.18, 0.75, wood, 0, 0.09, 0); box(0.66, 2.9, 0.1, paper, 0, 1.62, -0.1); cyl(0.1, 0.1, 2.4, glass, 0, 1.78, 0.04); cyl(0.065, 0.065, 1.25, red, 0, 1.2, 0.04); sph(0.21, red, 0, 0.5, 0.04); for (let k = 0; k < 6; k++) box(k % 2 ? 0.13 : 0.22, 0.035, 0.03, dark, 0.2, 0.95 + k * 0.32, -0.03); },
    carousel() { const shell = M(0xe6f1f8, 0.2), cork = M(0xb98a4e, 0.9); cyl(0.3, 0.55, 0.4, dark, 0, 0.2, 0); cyl(1.45, 1.45, 0.14, steel, 0, 0.47, 0); cyl(0.1, 0.1, 1.5, steel, 0, 1.2, 0); sph(0.22, brass, 0, 2.0, 0); for (let k = 0; k < 5; k++) { const an = k * PI * 0.4 + 0.5, x = Math.cos(an) * 1.05, z = Math.sin(an) * 1.05, col = new T.MeshStandardMaterial({ color: new T.Color().setHSL(k / 5, 0.75, 0.5).convertSRGBToLinear(), roughness: 0.3 }); rod([0, 0.56, 0], [x * 1.3, 0.56, z * 1.3], 0.03, dark); cyl(0.2, 0.2, 1.1, shell, x, 1.09, z); cyl(0.215, 0.215, 0.6, col, x, 0.86, z); sph(0.215, col, x, 0.56, z); cyl(0.17, 0.17, 0.14, cork, x, 1.7, z); } tor(1.75, 0.05, red, 0, 0.5, 0, [H, 0, 0], 1.3); put(new T.CylinderGeometry(0, 0.16, 0.3, 10), red, 1.75, 0.5, 0.0, [-H, 0, 0]); },
    dropper() { const amber = M(0x7a4a1e, 0.2, 0, { transparent: true, opacity: 0.82 }); cyl(0.56, 0.56, 1.0, amber, 0, 0.5, 0); cyl(0.27, 0.56, 0.32, amber, 0, 1.16, 0); cyl(0.31, 0.31, 0.24, black, 0, 1.44, 0); sph(0.28, red, 0, 1.9, 0, [1, 1.7, 1]); cyl(0.05, 0.05, 1.1, glass, 0, 0.75, 0); box(0.66, 0.44, 0.03, paper, 0, 0.5, 0.56); },
    loupe() { tor(0.75, 0.1, brass, -0.3, 0.2, 0, [H, 0, 0]); cyl(0.72, 0.72, 0.06, glass, -0.3, 0.2, 0); rod([0.35, 0.2, 0.3], [1.5, 0.2, 0.95], 0.13, wood); },
    timer() { cyl(0.75, 0.75, 0.12, wood, 0, 0.06, 0); cyl(0.75, 0.75, 0.12, wood, 0, 2.3, 0); cyl(0.08, 0.6, 1.0, glass, 0, 0.65, 0); cyl(0.6, 0.08, 1.0, glass, 0, 1.7, 0); cyl(0.02, 0.45, 0.5, liq, 0, 0.4, 0); cyl(0.4, 0.06, 0.5, liq, 0, 1.55, 0); for (let k = 0; k < 3; k++) { const a = k * 2.094; cyl(0.05, 0.05, 2.2, wood, Math.cos(a) * 0.65, 1.18, Math.sin(a) * 0.65); } },
    // philosopher's stone: a big red gem held in a gold cup by four prongs
    stone() { const gem = M(0xd6453a, 0.25), cup = M(0xf0b93a, 0.35, 0.8);
      cyl(0.5, 0.8, 0.22, cup, 0, 0.11, 0, null, 12); cyl(0.22, 0.5, 0.4, cup, 0, 0.42, 0, null, 12);
      put(new T.CylinderGeometry(0.0, 0.62, 0.9, 8), gem, 0, 1.1, 0, [PI, 0, 0]); put(new T.CylinderGeometry(0.62, 0.62, 0.16, 8), gem, 0, 1.63, 0); put(new T.CylinderGeometry(0.34, 0.62, 0.22, 8), gem, 0, 1.82, 0);
      [0, 1, 2, 3].forEach(k => { const a = k * H + 0.8; rod([Math.cos(a) * 0.55, 0.62, Math.sin(a) * 0.55], [Math.cos(a) * 0.7, 1.4, Math.sin(a) * 0.7], 0.04, cup); });
      box(0.07, 0.4, 0.03, white, -0.28, 1.65, 0.55, [0, 0, 0.5]).userData.plain = true; },
    // transmutation: a grey lead bar, a red arrow, a stack of gold bars
    // transmutation: a grey lead bar, a red arrow, a stack of five gold bars
    transmute() { const lead2 = M(0x8d949c, 0.5), gold2 = M(0xf0b93a, 0.3, 0.6), redm = M(0xd6453a, 0.5);
      const ing = (x, y, z, m) => put(new T.CylinderGeometry(0.4, 0.62, 0.55, 4).rotateY(PI / 4), m, x, y, z, [0, H, 0], [1.5, 1.8, 0.8]);
      ing(-1.8, 0.5, 0, lead2); arrow(-1.0, 0.5, 0.0, 0.5, 0.9, redm, 0.4);
      ing(0.9, 0.5, 0.0, gold2); ing(2.1, 0.5, 0.0, gold2); ing(1.5, 1.55, 0.0, gold2); shine(1.2, 1.9, 0.9, 0.3, 0.07, 0.2); },
    regia() { const fume = M(0xe8a23a, 0.9, 0, { transparent: true, opacity: 0.5 }); box(1.3, 1.7, 1.3, glass, 0, 0.85, 0); box(1.15, 1.1, 1.15, M(0xe0661a, 0.3), 0, 0.6, 0); cyl(0.25, 0.25, 0.4, glass, 0, 1.9, 0); sph(0.3, glass, 0, 2.25, 0); sph(0.16, fume, 0.25, 2.7, 0); box(0.9, 0.9, 0.02, white, 0, 0.8, 0.67); rod([-0.3, 0.5, 0.69], [0.3, 1.0, 0.69], 0.05, black); rod([0.3, 0.5, 0.69], [-0.3, 1.0, 0.69], 0.05, black); sph(0.2, black, 0, 0.92, 0.69, [1, 0.9, 0.3]); side.forEach(s => sph(0.05, white, s * 0.08, 0.95, 0.76)); },
    // ouroboros: a green snake eating its tail, standing as a medal on a plate
    ouroboros() { const gr = M(0x3c9a5f, 0.45), yl = M(0xf0b93a, 0.5), redm = M(0xd6453a, 0.6);
      box(1.7, 0.18, 0.9, dark, 0, 0.09, 0); cyl(0.12, 0.12, 0.55, dark, 0, 0.4, 0); cyl(1.45, 1.45, 0.18, dark, 0, 1.95, 0, [H, 0, 0], 36);
      const N = 26, cx = 0, cy = 1.95, Rr = 1.0; for (let i = 0; i < N; i++) { const f = i / (N - 1), a = 0.55 + f * (PI * 2 - 1.0), r = 0.29 - 0.2 * f * f, x = cx + Math.cos(a) * Rr, y = cy + Math.sin(a) * Rr;
        sph(r, gr, x, y, 0.2 + r * 0.4, [1, 1, 1]); if (i % 3 === 1) sph(r * 0.45, yl, x * 1.0, y * 1.0 - (y - cy) * 0.0, 0.2 + r * 1.2).userData.plain = true; }
      const ha = 0.55, hx = Math.cos(ha) * Rr, hy = cy + Math.sin(ha) * Rr; sph(0.38, gr, hx - 0.05, hy + 0.05, 0.35, [1.3, 1.0, 0.9]); sph(0.06, black, hx + 0.05, hy + 0.28, 0.7).userData.plain = true;
      rod([hx + 0.3, hy - 0.05, 0.6], [hx + 0.62, hy - 0.12, 0.62], 0.03, redm); shine(-0.5, 2.9, 0.4, 0.25, 0.07, 0.6); },
    // a faceless little man of red clay, used in the homunculus jar
    homclay() { const clay = M(0xd6453a, 0.7); body(); legs(0.55, 0.2, clay, 0.12); sph(0.48, clay, 0, 1.0, 0, [1, 1.2, 0.8]); sph(0.36, clay, 0, 1.85, 0); side.forEach(q => arm(q * 0.5, 1.3, 0, 0.8, 0.09, clay, clay, 0.12, 2.0)); shine(-0.2, 1.15, 0.42, 0.1, 0.4); },
    // the coin: one gold coin lying face up on the page, with a ring and a diamond engraved in it. Used for every coin
    coin() { const gd = M(0xf0b93a, 0.3, 0.6), ink = new T.MeshBasicMaterial({ color: lin(0x2b2622) });
      cyl(1.0, 1.0, 0.16, gd, 0, 0.08, 0, null, 40); tor(0.66, 0.03, ink, 0, 0.165, 0, [H, 0, 0]).userData.plain = true; box(0.3, 0.02, 0.3, ink, 0, 0.17, 0, [0, PI / 4, 0]).userData.plain = true;
      box(0.5, 0.02, 0.08, M(0xffffff, 0.2), -0.45, 0.17, -0.5, [0, -0.7, 0]).userData.plain = true; },
    // methanol, CH3OH, standing on its three hydrogens
    methanol() { const C = M(0x5b667d, 0.5, 0, { exact: 1 }), O = M(0xff4d4d, 0.5, 0, { exact: 1 }), Hh = M(0xf1f5f9, 0.5, 0, { exact: 1 }), st = M(0xdad4c0, 0.6, 0, { exact: 1 });
      cyl(1.2, 1.3, 0.1, wood, 0, 0.05, 0, null, 28); const c = [0, 1.25, 0];
      [0, 1, 2].forEach(k => { const a = k * 2.094 + 0.3, h = [Math.cos(a) * 0.85, 0.4, Math.sin(a) * 0.85]; rod(c, h, 0.07, st); sph(0.26, Hh, h[0], h[1], h[2]); });
      const o = [0, 2.3, 0.1]; rod(c, o, 0.07, st); sph(0.42, C, c[0], c[1], c[2]); sph(0.4, O, o[0], o[1], o[2]); rod(o, [0.55, 2.6, 0.2], 0.07, st); sph(0.25, Hh, 0.55, 2.6, 0.2); shine(-0.15, 1.45, 0.38, 0.08, 0.3, 0.4); },
    // ethylene, C2H4: a flat molecule standing up with the double bond across it
    ethylene() { const C = M(0x5b667d, 0.5, 0, { exact: 1 }), Hh = M(0xf1f5f9, 0.5, 0, { exact: 1 }), st = M(0xdad4c0, 0.6, 0, { exact: 1 });
      cyl(1.2, 1.3, 0.1, wood, 0, 0.05, 0, null, 28); const a = [-0.72, 1.2, 0], b = [0.72, 1.2, 0];
      [-0.07, 0.07].forEach(d => rod([a[0], a[1] + d, 0], [b[0], b[1] + d, 0], 0.05, st));
      [[-1.3, 0.45], [-1.3, 1.95], [1.3, 0.45], [1.3, 1.95]].forEach(q => { rod(q[0] < 0 ? a : b, [q[0], q[1], 0], 0.07, st); sph(0.26, Hh, q[0], q[1], 0); });
      sph(0.42, C, a[0], a[1], 0); sph(0.42, C, b[0], b[1], 0); shine(-0.8, 1.4, 0.38, 0.08, 0.3, 0.4); },
    // recycler: three arrows chasing each other round a triangle on a stand; in use (1) it has turned a third of the way round
    recycler() { const gr = M(0x3c9a5f, 0.4); cyl(0.7, 0.8, 0.16, dark, 0, 0.08, 0); cyl(0.12, 0.12, 0.9, dark, 0, 0.6, 0);
      const rg = pivot(0, 1.95, 0); into(rg, () => { for (let k = 0; k < 3; k++) { const a = H + k * 2.0944, b = H + (k + 1) * 2.0944, ax = Math.cos(a) * 1.2, ay = Math.sin(a) * 1.2, bx = Math.cos(b) * 1.2, by = Math.sin(b) * 1.2, dx = bx - ax, dy = by - ay; arrow(ax + dx * 0.12, ay + dy * 0.12, bx - dx * 0.04, by - dy * 0.04, 0, gr, 0.36); } shine(-0.5, 0.95, 0.25, 0.08, 0.4, 0.5); });
      act(v => { rg.rotation.z = -v * 2.0944; }); },
    // cannula: two round flasks bridged by a long steel needle in an arch; in use (0 to 1) a drop runs along it from the left flask to the right
    cannula() { const bl = M(0x3a6fd0, 0.3), wh = M(0xd6d2c4, 0.4, 0, { exact: 1 }), stp = M(0xd6453a, 0.7), ndl = M(0xd8dee6, 0.2, 0.9);
      [[-1.4, bl], [1.4, wh]].forEach(q => { sph(0.82, q[1], q[0], 0.85, 0); cyl(0.26, 0.3, 0.7, q[1], q[0], 1.7, 0); cyl(0.32, 0.26, 0.3, stp, q[0], 2.15, 0); put(new T.ConeGeometry(0.12, 0.7, 8), ndl, q[0], 2.1, 0, [PI, 0, 0]); });
      tor(1.4, 0.12, ndl, 0, 2.3, 0, null, PI); shine(-1.5, 0.95, 0.7, 0.1, 0.5, 0.4);
      const dp = drop(0, 3.7, 0, 0.2, bl); act(v => { const a = PI * (1 - v); dp.position.set(Math.cos(a) * 1.4, 2.3 + Math.sin(a) * 1.4 + 0.2, 0.05); dp.visible = true; dp.scale.setScalar(1); }); },
    // runoff: what comes off the molecule, one bold shape each
    ro_water() { const bl = M(0x3a6fd0, 0.3); sph(0.7, bl, 0, 0.7, 0); put(new T.ConeGeometry(0.58, 1.3, 14), bl, 0, 1.75, 0); box(0.14, 0.5, 0.02, M(0xffffff, 0.2), -0.28, 0.85, 0.66, [0, 0, 0.3]).userData.plain = true; },
    ro_h2() { const w = M(0xf4efe0, 0.4), st = M(0x2b2622, 0.5); rod([-0.55, 0.9, 0], [0.55, 0.6, 0], 0.16, st); sph(0.52, w, -0.6, 0.92, 0); sph(0.52, w, 0.6, 0.58, 0); },
    ro_co2() { const o = M(0xd6453a, 0.4), c = M(0x5b667d, 0.5, 0, { exact: 1 }), st = M(0x2b2622, 0.5); rod([-1.3, 0.5, 0], [1.3, 0.5, 0], 0.14, st); sph(0.48, o, -1.3, 0.5, 0); sph(0.48, o, 1.3, 0.5, 0); sph(0.56, c, 0, 0.5, 0); },
    ro_acid() { const g = M(0x3c9a5f, 0.3); [[-0.5, 0.45, 0.45], [0.2, 0.75, 0.5], [-0.3, 1.2, 0.42], [0.35, 1.6, 0.32], [-0.1, 2.0, 0.24]].forEach(q => sph(q[2], g, q[0], q[1], 0)); box(0.12, 0.4, 0.02, M(0xffffff, 0.2), -0.7, 0.55, 0.42, [0, 0, 0.4]).userData.plain = true; },
    ro_nh3() { const p = M(0xdfe0b0, 0.5, 0, { exact: 1 }); [[-0.55, 0.5, 0.5], [0.45, 0.55, 0.55], [-0.05, 1.05, 0.55], [0.7, 1.15, 0.35]].forEach(q => sph(q[2], p, q[0], q[1], 0)); [-0.4, 0.2].forEach(x => rod([x, 1.9, 0], [x + 0.25, 2.4, 0], 0.07, M(0x2b2622, 0.5))); },
    ro_sulfur() { const y = M(0xf0b93a, 0.5); put(new T.DodecahedronGeometry(0.8, 0), y, 0, 0.8, 0, [0.3, 0.4, 0.1]); put(new T.DodecahedronGeometry(0.34, 0), y, 0.95, 0.3, 0.3, [0.5, 0.2, 0.3]); },
    // the four marks of the yield track, each a flag on a pole: stable (blue, plain), unstable (yellow, saw edge), volatile (red, a flame), overreact (black, a hot center, a second flag)
    mark_stable() { const f = M(0x3a6fd0, 0.5); cyl(0.5, 0.6, 0.14, dark, 0, 0.07, 0); rod([0, 0.1, 0], [0, 2.6, 0], 0.07, steel); box(1.5, 0.95, 0.07, f, 0.8, 2.1, 0); cyl(0.26, 0.26, 0.05, M(0xf4efe0, 0.5), 0.65, 2.1, 0.05, [H, 0, 0]).userData.plain = true; },
    mark_unstable() { const f = M(0xf0b93a, 0.5); cyl(0.5, 0.6, 0.14, dark, 0, 0.07, 0); rod([0, 0.1, 0], [0, 2.8, 0], 0.07, steel); box(1.5, 1.0, 0.07, f, 0.8, 2.25, 0); [0, 1, 2].forEach(k => put(new T.ConeGeometry(0.17, 0.4, 3), f, 1.65, 2.55 - k * 0.33, 0, [0, 0, -H], [1, 1, 0.3])); box(0.6, 0.1, 0.02, black, 0.7, 2.25, 0.05, [0, 0, 0.5]).userData.plain = true; },
    mark_volatile() { const f = M(0xd6453a, 0.5), y = M(0xf0b93a, 0.4); cyl(0.5, 0.6, 0.14, dark, 0, 0.07, 0); rod([0, 0.1, 0], [0, 3.0, 0], 0.08, steel); box(1.7, 1.15, 0.07, f, 0.9, 2.35, 0); sph(0.22, y, 0.8, 2.2, 0.06, [1, 1.2, 0.3]).userData.plain = true; put(new T.ConeGeometry(0.2, 0.55, 8), y, 0.8, 2.65, 0.06, null, [1, 1, 0.3]).userData.plain = true; },
    mark_overreact() { const f = M(0x2c2f34, 0.5), r = M(0xd6453a, 0.4), y = M(0xf0b93a, 0.4); cyl(0.6, 0.7, 0.14, dark, 0, 0.07, 0); rod([0, 0.1, 0], [0, 3.4, 0], 0.09, steel); box(1.9, 1.3, 0.08, f, 1.0, 2.7, 0); sph(0.4, r, 0.9, 2.65, 0.08, [1, 1, 0.3]).userData.plain = true; sph(0.2, y, 0.9, 2.65, 0.12, [1, 1, 0.3]).userData.plain = true; box(0.9, 0.55, 0.06, r, 0.55, 1.65, 0).userData.plain = false; },
    // ---- the ten creatures (docs/ART_NOTES.md). Each stands on its own feet, feet at y = 0, about 2.4 tall. Rest pose is what build() leaves.
    // body() starts the part that squashes and leans from the feet; arm() makes an arm on a pivot; AA.rxKit.pose(group, {lean, reach, squash, t}) moves them
    // water: a soaking wet little figure with a drop for a head, standing in its own puddle
    homwater() { const sk = M(0x3a6fd0, 0.3), wet = M(0xcfe3ee, 0.1, 0, { transparent: true, opacity: 0.5 }), drop = M(0xcfe3ee, 0.1, 0, { transparent: true, opacity: 0.55 });
      floor(() => { cyl(1.2, 1.25, 0.03, wet, 0.05, 0.015, 0.1, null, 32).userData.plain = true; cyl(0.5, 0.55, 0.03, wet, 1.05, 0.015, 0.55, null, 24).userData.plain = true; cyl(0.3, 0.33, 0.03, wet, -1.0, 0.015, 0.6, null, 20).userData.plain = true; });
      body(); legs(0.5, 0.22, sk, 0.04);
      sph(0.55, sk, 0, 1.0, 0, [1, 1.15, 0.9]); sph(0.44, sk, 0, 1.85, 0, [1, 0.95, 0.92]); put(new T.ConeGeometry(0.2, 0.55, 14), sk, 0, 2.42, 0);
      eyes(1.88, 0.38, 0.16, 0.055, 0); shine(-0.24, 1.1, 0.48, 0.1, 0.42);
      side.forEach(q => { const pv = arm(q * 0.58, 1.3, 0, 0.8, 0.09, sk, sk, 0.12, 0.5); into(pv, () => sph(0.07, drop, 0, -1.02, 0, [1, 1.6, 1])); });
      sph(0.08, drop, 0.46, 1.55, 0.2, [1, 1.6, 1]); sph(0.06, drop, -0.42, 1.42, 0.3, [1, 1.6, 1]); sph(0.07, drop, 0.05, 0.62, 0.5, [1, 1.6, 1]); },
    // hydrogen: a light balloon of a figure on tiptoe, held down by a string to a small brass weight
    homh2() { const sk = M(0xd6453a, 0.4), cord = M(0x2c2f34, 0.7);
      floor(() => { cyl(0.2, 0.25, 0.16, brass, 0.55, 0.08, 0.45); tor(0.08, 0.025, brass, 0.55, 0.2, 0.45); });
      body(); const zig = [[0.0, 1.12], [0.18, 0.85], [-0.02, 0.6], [0.3, 0.38], [0.55, 0.22]];
      if (jarMode) { tor(0.16, 0.04, cord, 0, 1.0, 0, [H, 0, 0]); tor(0.16, 0.04, cord, 0, 0.88, 0, [H, 0, 0]); tor(0.16, 0.04, cord, 0, 0.76, 0, [H, 0, 0]); } else for (let k = 0; k < 4; k++) rod([zig[k][0], zig[k][1], 0.1 + k * 0.1], [zig[k + 1][0], zig[k + 1][1], 0.2 + k * 0.1], 0.022, cord);
      put(new T.ConeGeometry(0.1, 0.2, 10), sk, 0, 1.22, 0, [PI, 0, 0]);
      sph(0.66, sk, 0, 1.85, 0, [1, 1.2, 0.95]); shine(-0.28, 2.15, 0.56, 0.12, 0.5, 0.35);
      side.forEach(q => { rod([q * 0.2, 1.3, 0], [q * 0.3, 0.08, 0.05], 0.05, black); sph(0.1, black, q * 0.3, 0.05, 0.12, [1, 0.55, 1.5]); });
      side.forEach(q => arm(q * 0.62, 1.8, 0, 0.7, 0.05, black, sk, 0.09, 2.3)); },
    // carbon dioxide: a block of dry ice on two thin legs, standing in a cloud of its own mist
    homco2() { const ice = M(0xf4efe0, 0.3), fleck = M(0x3a6fd0, 0.3), leg = black, mist = M(0xdcecf4, 0.9, 0, { transparent: true, opacity: 0.55 });
      floor(() => { [[-0.8, 0.25, 0.5], [-0.3, 0.55, 0.42], [0.35, 0.5, 0.5], [0.85, 0.2, 0.42], [0.1, -0.2, 0.55]].forEach(q => sph(q[2], mist, q[0], 0.14, q[1], [1.3, 0.35, 1]).userData.plain = true); });
      body(); legs(0.8, 0.28, leg, 0.05);
      box(1.2, 1.1, 1.0, ice, 0, 1.45, 0, [0, 0.12, 0]); box(0.34, 0.2, 0.34, ice, 0.52, 2.08, 0.1, [0.3, 0.5, 0.2]);
      [[0.3, 1.2, 0.52, 0.2], [-0.35, 1.75, 0.52, 0.16], [0.4, 1.8, 0.52, 0.12]].forEach(q => box(q[3], q[3] * 0.5, 0.03, fleck, q[0], q[1], q[2], [0, 0.12, 0.5]).userData.plain = true);
      shine(-0.42, 1.65, 0.53, 0.1, 0.5, 0.1);
      side.forEach(q => arm(q * 0.64, 1.8, 0, 0.7, 0.045, leg, null, 0, 0.6));
      sph(0.2, mist, 0.2, 2.35, 0, [1.3, 0.7, 1]).userData.plain = true; sph(0.14, mist, 0.35, 2.65, 0.05, [1.2, 0.7, 1]).userData.plain = true; },
    // acid: half melted, green, the legs gone into its own pool, drips hanging from every edge
    homacid() { const sk = M(0x3c9a5f, 0.3), goo = M(0xbfe8c8, 0.1, 0, { transparent: true, opacity: 0.55 });
      floor(() => { cyl(1.0, 1.05, 0.03, goo, 0, 0.015, 0.1, null, 32).userData.plain = true; [[0.7, 0.5, 0.12], [-0.6, 0.55, 0.09], [0.2, 0.85, 0.07]].forEach(q => sph(q[2], goo, q[0], 0.07, q[1], [1, 0.8, 1]).userData.plain = true); });
      body(); side.forEach(q => { sph(0.14, sk, q * 0.3, 0.1, 0.35, [1, 0.55, 1.4]); });
      cyl(0.42, 0.82, 0.85, sk, 0, 0.5, 0, null, 24); sph(0.55, sk, 0, 1.3, 0, [1, 1.1, 0.9]); sph(0.4, sk, 0.08, 2.05, 0, [1, 0.9, 0.9]);
      eyes(2.08, 0.34, 0.16, 0.055, -0.12); shine(-0.26, 1.5, 0.46, 0.1, 0.4);
      [[-0.4, 0.78, 0.45, 0.4], [0.15, 0.7, 0.55, 0.62], [0.55, 0.5, 0.35, 0.3], [-0.1, 1.78, 0.3, 0.32]].forEach(q => { rod([q[0], q[1] + 0.3, q[2]], [q[0], q[1] - q[3] + 0.3, q[2]], 0.045, sk); sph(0.1, sk, q[0], q[1] - q[3] + 0.2, q[2], [1, 1.5, 1]); });
      arm(0.62, 1.5, 0, 0.7, 0.1, sk, sk, 0.13, 0.4); const l = arm(-0.62, 1.5, 0, 0.45, 0.1, sk, null, 0, 0.3); into(l, () => { rod([0, -0.45, 0], [0, -0.95, 0], 0.07, sk); sph(0.1, sk, 0, -1.0, 0, [1, 1.6, 1]); }); },
    // wood spirit: a tipsy little bottle on crossed legs, leaning, a cork in its neck, a spill beside it
    homwood() { const br = M(0x8a5a2b, 0.5), cork = M(0xf4efe0, 0.8), lab = M(0xf4efe0, 0.8), wet = M(0xe6d3a8, 0.2, 0, { transparent: true, opacity: 0.5 });
      floor(() => { cyl(0.55, 0.6, 0.03, wet, 0.7, 0.015, 0.4, null, 24).userData.plain = true; sph(0.1, wet, 1.1, 0.06, 0.8, [1, 0.5, 1]).userData.plain = true; });
      body(); R.lean0 = [0.06, 0.24];
      rod([-0.18, 0.55, 0], [0.22, 0.07, 0.05], 0.06, black); rod([0.18, 0.55, 0], [-0.24, 0.07, 0.1], 0.06, black); sph(0.11, black, 0.24, 0.05, 0.12, [1, 0.55, 1.5]); sph(0.11, black, -0.26, 0.05, 0.18, [1, 0.55, 1.5]);
      cyl(0.52, 0.56, 1.15, br, 0, 1.1, 0, null, 24); cyl(0.2, 0.52, 0.42, br, 0, 1.88, 0, null, 24); cyl(0.2, 0.2, 0.34, br, 0, 2.25, 0, null, 18); cyl(0.26, 0.26, 0.1, br, 0, 2.45, 0, null, 18);
      cyl(0.17, 0.2, 0.32, cork, 0.04, 2.62, 0, [0, 0, -0.35]);
      box(0.78, 0.5, 0.06, lab, 0, 0.95, 0.55, [0, 0, 0.04]); [0.82, 0.95, 1.08].forEach((y, i) => box(0.46 - i * 0.08, 0.04, 0.02, black, 0, y, 0.59, [0, 0, 0.04]).userData.plain = true);
      eyes(1.62, 0.44, 0.17, 0.055, 0.1); shine(-0.34, 1.35, 0.5, 0.08, 0.5, 0);
      arm(0.56, 1.45, 0, 0.75, 0.06, black, null, 0, 2.4); arm(-0.56, 1.45, 0, 0.7, 0.06, black, null, 0, 0.9); },
    // salt: a crusted white crab, sideways on four legs, claws up, eyes on short stalks
    homsalt() { const sa = M(0xd6d2c4, 0.85, 0, { exact: 1 }), cream = M(0xf4efe0, 0.85), grit = M(0x8d949c, 0.8), pile = M(0xd6d2c4, 0.9, 0, { exact: 1 });
      floor(() => { cyl(1.15, 1.2, 0.03, pile, 0, 0.015, 0.1, null, 24).userData.plain = true; [[0.9, 0.5], [-0.8, 0.6], [0.5, 0.9], [-0.4, 0.95]].forEach(q => box(0.12, 0.12, 0.12, pile, q[0], 0.06, q[1], [0.4, 0.6, 0.2]).userData.plain = true); });
      body(); side.forEach(q => [0, 1, 2].forEach(k => { const z = -0.3 + k * 0.32; rod([q * 0.7, 0.75, z], [q * (1.2 + k * 0.05), 0.08, z + 0.05], 0.065, black); sph(0.08, black, q * (1.2 + k * 0.05), 0.05, z + 0.08, [1, 0.5, 1.4]); }));
      sph(1.0, sa, 0, 0.95, 0, [1.25, 0.8, 1.0]);
      [[-0.55, 1.5, 0.1, 0.3], [0.45, 1.52, -0.05, 0.34], [0.0, 1.6, -0.3, 0.26], [-0.2, 1.5, 0.5, 0.22], [0.85, 1.12, 0.45, 0.28], [-1.0, 1.1, 0.2, 0.28], [0.15, 1.45, 0.3, 0.2], [-0.8, 1.35, -0.2, 0.2], [0.7, 1.4, -0.45, 0.22]].forEach((q, i) => box(q[3], q[3], q[3], i % 3 ? cream : grit, q[0], q[1], q[2], [0.5, 0.6 + i, 0.3]));
      side.forEach(q => { rod([q * 0.28, 1.5, 0.45], [q * 0.33, 1.85, 0.5], 0.05, sa); sph(0.08, black, q * 0.33, 1.88, 0.52).userData.plain = true; });
      side.forEach(q => { const pv = arm(q * 1.1, 1.05, 0.35, 0.6, 0.12, sa, sa, 0.27, 1.9); into(pv, () => { [-1, 1].forEach(p => put(new T.ConeGeometry(0.1, 0.42, 8), sa, p * 0.12, -0.8, 0, [0, 0, p * 0.15])); }); }); },
    // slime: a green blob with two round dots for eyes, two stretchy arms and sticky little feet
    homslime() { const gr = M(0x7fd14a, 0.2), gd = M(0x3c9a5f, 0.3), goo = M(0x7fd14a, 0.1, 0, { transparent: true, opacity: 0.5 });
      floor(() => { cyl(1.0, 1.1, 0.03, goo, 0, 0.015, 0.1, null, 28).userData.plain = true; });
      body(); side.forEach(q => sph(0.2, gr, q * 0.4, 0.1, 0.6, [1.1, 0.5, 1.3]));
      sph(0.85, gr, 0, 0.68, 0, [1.15, 0.85, 1]); sph(0.5, gr, 0.1, 1.45, 0, [1, 0.9, 0.95]); sph(0.2, gr, -0.55, 1.15, 0.2);
      eyes(1.5, 0.45, 0.2, 0.06, 0); shine(-0.28, 1.65, 0.4, 0.12, 0.3, 0.5);
      side.forEach(q => arm(q * 0.85, 0.95, 0.1, 0.7, 0.1, gr, gr, 0.2, 0.9, 1.4));
      sph(0.1, gr, 0.65, 0.3, 0.6, [1, 1.6, 1]); },
    // ammonia: a stoppered bottle of smelling salts on two legs, white crystals rattling inside, fumes coming off the neck
    homammonia() { const gl = M(0xcfe3ee, 0.1, 0, { transparent: true, opacity: 0.4, glass: 0xbfe6fa, op: 0.55, emissive: new T.Color(0x5a8ca0) }), cr = M(0xf4efe0, 0.5), cork = M(0xd6453a, 0.7), lab = M(0x3a6fd0, 0.5), fume = M(0xf0e9a8, 0.9, 0, { transparent: true, opacity: 0.5 });
      body(); legs(0.6, 0.26, black, 0.05);
      cyl(0.62, 0.72, 0.95, gl, 0, 1.05, 0, null, 24); cyl(0.26, 0.62, 0.38, gl, 0, 1.7, 0, null, 24); cyl(0.24, 0.24, 0.3, gl, 0, 2.0, 0, null, 18); cyl(0.3, 0.3, 0.08, gl, 0, 2.2, 0, null, 18);
      [[-0.25, 0.75, 0.1, 0.3], [0.25, 0.7, -0.05, 0.26], [0.0, 0.88, 0.3, 0.22], [-0.2, 1.1, -0.1, 0.2], [0.28, 1.05, 0.2, 0.17]].forEach((q, i) => box(q[3], q[3], q[3], cr, q[0], q[1], q[2], [0.5 + i, 0.6, 0.3]));
      cyl(0.2, 0.24, 0.3, cork, 0, 2.38, 0, null, 14); box(0.8, 0.3, 0.05, lab, 0, 1.1, 0.7, [0, 0, 0]).userData.plain = true; shine(-0.5, 1.2, 0.66, 0.07, 0.5, 0);
      [[0.15, 2.8, 0.55], [-0.25, 3.15, 0.45], [0.2, 3.5, 0.4]].forEach((q, i) => sph(q[2] * 0.45, fume, q[0], q[1], 0.05, [1.3, 0.9, 1]).userData.plain = true);
      side.forEach(q => arm(q * 0.78, 1.2, 0, 0.6, 0.045, black, null, 0, 0.5)); },
    // seedling: a shoot in a clay pot, two leaves, two dots for eyes on the pot, little legs under it
    homseed() { const clay = M(0xc26a3a, 0.7), soil = M(0x3a2a1e, 0.9), lf = M(0x3c9a5f, 0.4), lf2 = M(0x7fd14a, 0.4);
      body(); legs(0.45, 0.28, black, 0.05);
      cyl(0.85, 0.6, 0.85, clay, 0, 0.88, 0, null, 24); cyl(0.95, 0.95, 0.24, clay, 0, 1.42, 0, null, 24); cyl(0.78, 0.78, 0.04, soil, 0, 1.52, 0, null, 24).userData.plain = true;
      eyes(0.95, 0.66, 0.2, 0.055, 0); shine(-0.55, 1.0, 0.62, 0.08, 0.4, -0.1);
      side.forEach(q => arm(q * 0.82, 0.95, 0, 0.55, 0.045, black, null, 0, 0.6));
      const sh = new T.Group(); sh.position.set(0, 1.54, 0); R.body.add(sh); const pc = cur; cur = sh;
      rod([0, 0, 0], [0.03, 0.55, 0], 0.06, lf); sph(0.38, lf2, -0.36, 0.78, 0, [1.25, 0.3, 0.8]).rotation.z = 0.45; sph(0.42, lf, 0.4, 0.7, 0, [1.25, 0.3, 0.8]).rotation.z = -0.45; sph(0.13, lf2, 0.03, 0.72, 0, [0.8, 1.3, 0.8]);
      cur = pc; R.shoot = sh; R.extra.push(o => { const m = Math.hypot(o.lean ? o.lean[0] : 0, o.lean ? o.lean[1] : 0) || 0; sh.rotation.set(o.lean ? o.lean[1] * 0.6 * (o.reach || 0) : 0, 0, o.lean ? -o.lean[0] * 0.6 * (o.reach || 0) : 0); }); },
    // brimstone: a steaming lump of sulfur on a smouldering stone, glowing cracks, little legs under the stone
    hombrimstone() { const sul = M(0xf0b93a, 0.6), stn = M(0x2c2f34, 0.7), ember = glow(0xd6453a), steam = M(0xdcecf4, 0.9, 0, { transparent: true, opacity: 0.5 });
      body(); legs(0.5, 0.36, black, 0.05);
      cyl(1.05, 1.15, 0.55, stn, 0, 0.75, 0, null, 7);
      [[-0.55, 1.03, 0.15, 0.32, 0.08], [0.2, 1.03, 0.5, 0.45, 0.07], [0.6, 1.03, -0.1, 0.3, 0.06]].forEach(q => box(q[3], 0.04, q[4], ember, q[0], q[1], q[2], [0, 0.5, 0]).userData.plain = true);
      put(new T.DodecahedronGeometry(0.7, 0), sul, 0, 1.6, 0, [0.3, 0.4, 0.1], [1, 0.95, 1]); put(new T.DodecahedronGeometry(0.42, 0), sul, -0.6, 1.3, 0.2, [0.5, 0.2, 0.3]); put(new T.DodecahedronGeometry(0.46, 0), sul, 0.62, 1.34, -0.05, [0.2, 0.9, 0.2]);
      [[-0.5, 0.72, 0.98], [0.1, 0.8, 1.02], [0.6, 0.7, 0.9]].forEach(q => sph(0.1, ember, q[0], q[1], q[2], [1.2, 0.8, 0.5]).userData.plain = true);
      eyes(1.62, 0.6, 0.2, 0.055, 0); shine(-0.3, 1.9, 0.5, 0.1, 0.3, 0.4);
      [[0.1, 2.5, 0.28], [-0.3, 2.9, 0.22], [0.2, 3.3, 0.18]].forEach(q => sph(q[2], steam, q[0], q[1], 0.05, [1.3, 0.8, 1]).userData.plain = true);
      side.forEach(q => arm(q * 1.0, 0.85, 0, 0.5, 0.07, stn, null, 0, 0.7)); },
    // the homunculus in its jar: a faceless little man of red clay floating in blue liquid
    homunculus() { mkJar('homunculus', 0.92, 2); },
    elixir() { const shell = M(0xe6f1f8, 0.2), gl = glow(0xf2c020); tor(0.5, 0.09, brass, 0, 0.09, 0, [H, 0, 0]); sph(0.75, gl, 0, 0.85, 0); cyl(0.17, 0.17, 0.9, shell, 0, 1.9, 0); cyl(0.175, 0.175, 0.3, gl, 0, 1.6, 0); cyl(0.22, 0.19, 0.28, wood, 0, 2.45, 0); [[0.2, 1.0, 0.7], [-0.25, 0.75, 0.68], [0.05, 0.5, 0.72], [-0.1, 1.2, 0.6]].forEach(q => sph(0.08, white, q[0], q[1], q[2])); rod([0.17, 2.0, 0.05], [0.7, 1.55, 0.3], 0.015, black); box(0.38, 0.24, 0.02, paper, 0.8, 1.42, 0.32, [0, 0, 0.35]); },
    tower() { const sky = M(0x3b2a5c, 0.85), stone = M(0xb9b4a8, 0.9), bolt = glow(0xf6d020), fire = glow(0xf27a1a); box(1.3, 0.22, 0.6, wood, 0, 0.11, 0); box(1.8, 2.8, 0.08, paper, 0, 1.6, 0); box(1.5, 2.5, 0.02, sky, 0, 1.6, 0.05).userData.plain = true; box(1.5, 0.28, 0.03, black, 0, 0.5, 0.06).userData.plain = true; box(0.52, 1.25, 0.06, stone, -0.1, 1.2, 0.09); box(0.66, 0.16, 0.07, stone, -0.1, 1.86, 0.09); [-0.32, -0.1, 0.12].forEach(q => box(0.13, 0.13, 0.07, stone, q, 2.0, 0.09).userData.plain = true); [[-0.1, 1.55], [-0.1, 1.15], [-0.1, 0.78]].forEach(q => box(0.14, 0.2, 0.03, fire, q[0], q[1], 0.13).userData.plain = true); box(1.8, 2.8, 0.22, M(0xcdb98a, 0.8), 0, 1.6, -0.14); [[0.68, 2.8, 0.34, 2.45], [0.34, 2.45, 0.6, 2.38], [0.6, 2.38, 0.16, 2.0]].forEach(q => rod([q[0], q[1], 0.12], [q[2], q[3], 0.12], 0.03, bolt).userData.plain = true); put(new T.CylinderGeometry(0, 0.13, 0.36, 8), fire, -0.22, 2.2, 0.12).userData.plain = true; sph(0.11, white, 0.42, 1.62, 0.1).userData.plain = true; rod([0.42, 1.52, 0.1], [0.52, 1.14, 0.1], 0.05, white).userData.plain = true; rod([0.28, 1.3, 0.1], [0.62, 1.46, 0.1], 0.04, white).userData.plain = true; rod([0.52, 1.14, 0.1], [0.4, 0.92, 0.1], 0.04, white).userData.plain = true; rod([0.52, 1.14, 0.1], [0.66, 0.96, 0.1], 0.04, white).userData.plain = true; },
    duck() { const yel = M(0xf2c41a, 0.35), deep = M(0xe0a80e, 0.4), bill = M(0xf07a12, 0.4); sph(0.8, yel, -0.05, 0.62, 0, [1.2, 0.78, 1]); sph(0.32, yel, -0.95, 0.95, 0, [1, 0.7, 0.8]); sph(0.4, deep, -0.15, 0.72, 0.62, [1.25, 0.6, 0.4]); sph(0.5, yel, 0.5, 1.45, 0); sph(0.22, bill, 1.02, 1.36, 0, [1.3, 0.42, 1.1]); sph(0.075, black, 0.72, 1.62, 0.4).userData.plain = true; sph(0.03, white, 0.74, 1.65, 0.46).userData.plain = true; },
    cat() { const fur = M(0x1d1c1c, 0.6), eye = glow(0xd6e21c), pink = M(0xe8829a, 0.5); sph(0.62, fur, 0, 0.75, 0, [0.9, 1.2, 0.8]); sph(0.46, fur, 0, 1.75, 0.08, [1.05, 0.92, 0.9]); side.forEach(q => { put(new T.CylinderGeometry(0, 0.2, 0.42, 4), fur, q * 0.28, 2.24, 0.08, [0, PI / 4, q * -0.2]); sph(0.17, fur, q * 0.22, 0.14, 0.42, [1, 0.7, 1.2]); sph(0.1, eye, q * 0.18, 1.8, 0.44, [1, 1, 0.4]).userData.plain = true; box(0.03, 0.16, 0.02, black, q * 0.18, 1.8, 0.5).userData.plain = true; [0.08, -0.06].forEach(w => rod([q * 0.1, 1.62, 0.48], [q * 0.62, 1.62 + w, 0.4], 0.012, white).userData.plain = true); }); sph(0.045, pink, 0, 1.66, 0.5).userData.plain = true; { const tp = k => [0.4 + 0.75 * Math.sin(k / 7 * 2.5), 0.2 + 1.35 * Math.pow(k / 7, 1.3), 0]; for (let k = 0; k < 7; k++) { rod(tp(k), tp(k + 1), 0.1 - k * 0.004, fur); sph(0.1 - k * 0.004, fur, tp(k + 1)[0], tp(k + 1)[1], 0); } } },
    // monkey's paw: a withered brown hand on a wooden foot; in use the fingers curl one at a time, thumb first (s 0.2 per finger)
    paw() { const fur = M(0x8a5a2b, 0.95), claw = M(0x2c2f34, 0.4), bone = M(0xf4efe0, 0.6);
      box(1.5, 0.2, 1.0, wood, 0, 0.1, 0); cyl(0.25, 0.3, 0.8, fur, 0, 0.6, 0); sph(0.62, fur, 0, 1.3, 0, [1.15, 0.9, 0.6]);
      const fing = []; [[-0.78, 1.25, 1.1, 1.3, 0.5], [-0.4, 1.7, 1.5, 0.95, 0.12], [-0.05, 1.85, 1.75, 1.0, 0], [0.3, 1.75, 1.6, 0.9, -0.12], [0.6, 1.6, 1.3, 0.6, -0.3]].forEach((q, i) => {
        const g = pivot(q[0], q[1] - (i ? 0.1 : 0.25), 0); g.rotation.z = (i ? 1 : 1) * q[4] * (i === 0 ? -1 : 1) * 1.0; const g2 = new T.Group(); into(g, () => { const l = q[2] * 0.55; rod([0, 0, 0], [0, l, 0], 0.14 - i * 0.005, fur); sph(0.14, fur, 0, l, 0); g2.position.set(0, l, 0); g.add(g2); });
        into(g2, () => { const l = q[2] * 0.5; rod([0, 0, 0], [0, l, 0], 0.12, fur); put(new T.ConeGeometry(0.11, 0.3, 6), claw, 0, l + 0.12, 0); }); fing.push({ g, g2, z: g.rotation.z }); });
      act(v => fing.forEach((f, i) => { const t = cl(v * 5 - i, 0, 1); f.g.rotation.x = t * 1.5; f.g2.rotation.x = t * 1.7; f.g.rotation.z = f.z * (1 - t * 0.6); })); },
    idol() { const eye = glow(0xe0261c); cyl(0.85, 0.95, 0.35, lead, 0, 0.18, 0, null, 6); cyl(0.5, 0.62, 0.8, gold, 0, 0.75, 0); side.forEach(q => { rod([q * 0.5, 1.0, 0.1], [q * 0.1, 0.7, 0.55], 0.12, gold); sph(0.1, eye, q * 0.24, 1.72, 0.5, [1, 1, 0.5]).userData.plain = true; box(0.3, 0.06, 0.04, black, q * 0.24, 1.9, 0.5, [0, 0, q * -0.35]).userData.plain = true; sph(0.16, gold, q * 0.68, 1.6, 0, [0.5, 1.4, 1]); }); sph(0.62, gold, 0, 1.65, 0, [1, 1.05, 0.9]); box(0.5, 0.2, 0.05, black, 0, 1.32, 0.5).userData.plain = true; [-0.15, 0, 0.15].forEach(q => box(0.07, 0.1, 0.02, gold, q, 1.37, 0.54).userData.plain = true); box(1.1, 0.22, 0.6, gold, 0, 2.32, 0); box(0.7, 0.2, 0.5, gold, 0, 2.52, 0); },
    grimoire() { const cover = M(0x8a1626, 0.7), eye = glow(0xd6e21c); box(1.7, 2.3, 0.5, cover, 0, 1.25, 0); box(1.62, 2.2, 0.42, paper, 0.08, 1.25, 0); box(1.7, 2.3, 0.07, cover, 0, 1.25, 0.26); box(0.16, 2.32, 0.56, M(0x5c0e18, 0.7), -0.8, 1.25, 0); tor(0.5, 0.05, gold, 0, 1.4, 0.31); sph(0.2, eye, 0, 1.4, 0.3, [1.5, 0.8, 0.4]).userData.plain = true; box(0.06, 0.24, 0.02, black, 0, 1.4, 0.39).userData.plain = true; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(q => box(0.3, 0.3, 0.09, gold, q[0] * 0.71, 1.25 + q[1] * 1.01, 0.27)); box(0.34, 0.22, 0.1, brass, 0.86, 1.25, 0.24); box(0.12, 0.5, 0.03, red, 0.3, 0.02, 0.1); },
    hourglass() { const shell = M(0xbfe3f2, 0.12, 0, { transparent: true, opacity: 0.75 }), sand = M(0x8f8a80, 0.95), dk = M(0x3a2a1e, 0.7); cyl(0.68, 0.68, 0.16, dk, 0, 0.08, 0); cyl(0.68, 0.68, 0.16, dk, 0, 2.4, 0); [0.5, 2.6, 4.7].forEach(an => cyl(0.05, 0.05, 2.3, dk, Math.cos(an) * 0.58, 1.24, Math.sin(an) * 0.58)); cyl(0.5, 0.06, 1.0, shell, 0, 1.8, 0); cyl(0.06, 0.5, 1.0, shell, 0, 0.7, 0); cyl(0.3, 0.51, 0.42, sand, 0, 0.4, 0).userData.plain = true; cyl(0.3, 0.13, 0.36, sand, 0, 1.6, 0).userData.plain = true; cyl(0.025, 0.025, 0.7, sand, 0, 1.0, 0).userData.plain = true; box(0.34, 0.07, 0.07, white, 0, 2.6, 0); box(0.07, 0.5, 0.07, white, 0, 2.72, 0); },
    poster() { const sky = M(0x9fd0f0, 0.8), fur = M(0xf08a1c, 0.8), pin = M(0xd8202c, 0.4); box(2.0, 2.6, 0.04, white, 0, 1.4, 0); box(1.7, 1.75, 0.02, sky, 0, 1.7, 0.03).userData.plain = true; rod([-0.85, 2.3, 0.06], [0.85, 2.2, 0.06], 0.07, wood); sph(0.3, fur, 0, 1.45, 0.07, [0.85, 1.5, 0.3]); sph(0.27, fur, 0, 1.98, 0.09, [1.1, 0.95, 0.4]); side.forEach(q => { rod([q * 0.2, 1.75, 0.08], [q * 0.26, 2.26, 0.08], 0.06, fur); put(new T.CylinderGeometry(0, 0.1, 0.2, 4), fur, q * 0.2, 2.22, 0.14, [0, PI / 4, 0]).userData.plain = true; sph(0.035, black, q * 0.1, 2.0, 0.2).userData.plain = true; rod([q * 0.12, 1.1, 0.08], [q * 0.16, 0.92, 0.08], 0.05, fur); sph(0.08, pin, q * 0.85, 2.58, 0.08); }); rod([0.2, 1.15, 0.08], [0.45, 1.3, 0.08], 0.04, fur); box(1.3, 0.16, 0.02, black, 0, 0.6, 0.03).userData.plain = true; box(0.8, 0.07, 0.02, black, 0, 0.36, 0.03).userData.plain = true; },
    coffee() { const brew = M(0x3a2110, 0.4); cyl(0.85, 0.85, 0.06, wood, 0, 0.03, 0); cyl(0.62, 0.52, 1.1, white, 0, 0.62, 0); cyl(0.55, 0.55, 0.04, brew, 0, 1.17, 0).userData.plain = true; tor(0.32, 0.09, white, 0.66, 0.62, 0); tor(0.585, 0.045, red, 0, 0.8, 0, [H, 0, 0]); sph(0.09, brew, -0.3, 0.9, 0.5, [1, 2.2, 0.4]).userData.plain = true; [-0.25, 0.05, 0.3].forEach((q, k) => { rod([q, 1.4, 0], [q + 0.12, 1.7, 0], 0.03, white); rod([q + 0.12, 1.7, 0], [q - 0.04, 2.0 + k * 0.1, 0], 0.03, white); }); },
    coat() { const tag = M(0x2f6fd0, 0.6); rod([-0.75, 2.3, 0], [0, 2.62, 0], 0.045, wood); rod([0.75, 2.3, 0], [0, 2.62, 0], 0.045, wood); tor(0.15, 0.03, steel, 0, 2.86, 0, null, PI * 1.5); box(1.5, 2.0, 0.42, white, 0, 1.25, 0); side.forEach(q => { rod([q * 0.72, 2.12, 0], [q * 1.12, 0.95, 0], 0.2, white); box(0.06, 0.85, 0.02, dark, q * 0.2, 1.85, 0.22, [0, 0, q * 0.42]).userData.plain = true; }); box(0.03, 1.2, 0.02, dark, 0, 0.9, 0.22).userData.plain = true; [1.3, 0.95, 0.6].forEach(y => sph(0.05, dark, 0.09, y, 0.22).userData.plain = true); box(0.46, 0.24, 0.03, tag, 0.42, 1.6, 0.22).userData.plain = true; box(0.3, 0.04, 0.02, white, 0.42, 1.6, 0.24).userData.plain = true; box(0.42, 0.36, 0.03, M(0xd9dde2, 0.8), -0.42, 0.75, 0.22); [-0.52, -0.4].forEach((x, k) => cyl(0.03, 0.03, 0.3, k ? red : tag, x, 1.0, 0.24)); },
    milk() { const band = M(0x2f6fd0, 0.6), rot = glow(0x7fc41c); box(0.95, 1.5, 0.95, white, 0, 0.75, 0); box(0.97, 0.45, 0.97, band, 0, 0.62, 0); box(0.95, 0.62, 0.06, white, 0, 1.72, 0.2, [-0.62, 0, 0]); box(0.95, 0.62, 0.06, white, 0, 1.72, -0.2, [0.62, 0, 0]); box(0.95, 0.2, 0.07, white, 0, 2.05, 0); sph(0.24, rot, 0.25, 2.12, 0.05, [1.3, 0.7, 1]); sph(0.13, rot, 0.3, 1.75, 0.42, [1, 2.2, 0.5]).userData.plain = true; sph(0.1, rot, 0.34, 1.3, 0.5, [1, 2.4, 0.5]).userData.plain = true; sph(0.09, rot, 0.05, 1.6, 0.44, [1, 1.6, 0.5]).userData.plain = true; sph(0.5, rot, 0.55, 0.03, 0.45, [1.2, 0.08, 0.8]); sph(0.28, rot, -0.2, 0.03, 0.7, [1.2, 0.1, 0.8]); },
    mystery() { const amber = M(0x9a4f10, 0.25), cap = M(0x1d1c1c, 0.5); cyl(0.6, 0.6, 1.3, amber, 0, 0.65, 0); cyl(0.26, 0.6, 0.4, amber, 0, 1.5, 0); cyl(0.26, 0.26, 0.3, amber, 0, 1.82, 0); cyl(0.31, 0.31, 0.26, cap, 0, 2.08, 0); cyl(0.615, 0.615, 0.8, paper, 0, 0.66, 0, null, 24); tor(0.15, 0.04, black, 0, 0.84, 0.62, [0, 0, -0.9], PI * 1.35).userData.plain = true; box(0.07, 0.2, 0.03, black, 0.02, 0.6, 0.62).userData.plain = true; sph(0.05, black, 0.02, 0.4, 0.62).userData.plain = true; },
    raven() { const fea = M(0x1d1c1c, 0.5), bk = M(0x55514a, 0.4), pill = M(0x2f6fd0, 0.4); cyl(0.6, 0.7, 0.14, wood, 0, 0.07, 0); cyl(0.06, 0.06, 1.0, wood, 0, 0.6, 0); rod([-0.7, 1.1, 0], [0.7, 1.1, 0], 0.07, wood); sph(0.5, fea, -0.05, 1.75, 0, [1.25, 0.85, 0.8]).rotation.z = 0.5; sph(0.34, fea, 0.42, 2.25, 0); put(new T.CylinderGeometry(0, 0.16, 0.6, 6), bk, 0.9, 2.2, 0, [0, 0, -H - 0.15]); box(0.9, 0.12, 0.4, fea, -0.75, 1.42, 0, [0, 0, 0.5]); sph(0.06, white, 0.52, 2.34, 0.28).userData.plain = true; sph(0.03, black, 0.54, 2.34, 0.33).userData.plain = true; side.forEach(q => rod([q * 0.15, 1.45, 0.1], [q * 0.15, 1.16, 0.1], 0.035, bk)); sph(0.11, pill, 1.18, 2.12, 0, [1.4, 0.8, 0.8]); },
    glory() { const wax = M(0x9aa878, 0.8), fl = glow(0xf6a01c); cyl(0.75, 0.55, 0.14, brass, 0, 0.07, 0); cyl(0.14, 0.2, 0.3, brass, 0, 0.28, 0); cyl(0.26, 0.3, 0.7, wax, 0, 0.75, 0); sph(0.44, wax, 0, 1.4, 0, [1, 1.05, 0.55]); [[-0.36, 0.55, -0.3], [-0.13, 0.78, -0.08], [0.1, 0.82, 0.06], [0.32, 0.66, 0.22]].forEach(q => { const tx = q[0] + q[2] * 0.5, ty = 1.7 + q[1]; rod([q[0], 1.7, 0], [tx, ty, 0], 0.085, wax); put(new T.CylinderGeometry(0, 0.09, 0.3, 8), fl, tx, ty + 0.2, 0).userData.plain = true; }); rod([0.36, 1.3, 0], [0.82, 1.62, 0], 0.085, wax); put(new T.CylinderGeometry(0, 0.09, 0.3, 8), fl, 0.86, 1.86, 0).userData.plain = true; sph(0.06, wax, -0.2, 0.9, 0.3, [1, 2, 0.6]); },
    goggles() { const skin = M(0xe2b48c, 0.8), lens = M(0x8fd0f0, 0.15), strap = M(0x1d1c1c, 0.6); cyl(0.55, 0.65, 0.14, wood, 0, 0.07, 0); cyl(0.2, 0.24, 0.5, skin, 0, 0.38, 0); sph(0.72, skin, 0, 1.3, 0, [0.92, 1.1, 0.95]); side.forEach(q => { sph(0.06, black, q * 0.25, 1.22, 0.64).userData.plain = true; cyl(0.25, 0.25, 0.16, strap, q * 0.27, 1.82, 0.5, [H - 0.45, 0, 0], 20); cyl(0.19, 0.19, 0.18, lens, q * 0.27, 1.83, 0.52, [H - 0.45, 0, 0], 20).userData.plain = true; }); tor(0.66, 0.06, strap, 0, 1.75, 0, [H + 0.25, 0, 0]); box(0.14, 0.1, 0.1, strap, 0, 1.84, 0.56); },
    grant() { const stamp = M(0xd8202c, 0.6); box(1.3, 0.2, 0.6, wood, 0, 0.1, 0); box(1.7, 2.3, 0.05, paper, 0.1, 1.4, -0.08, [0, 0, -0.06]); box(1.7, 2.3, 0.06, white, 0, 1.4, 0); box(1.0, 0.12, 0.02, black, -0.25, 2.25, 0.04).userData.plain = true; [1.95, 1.75, 1.55, 1.35].forEach((y, k) => box(k === 3 ? 0.9 : 1.4, 0.04, 0.02, dark, k === 3 ? -0.25 : 0, y, 0.04).userData.plain = true); box(1.1, 0.5, 0.02, stamp, 0.15, 0.78, 0.05, [0, 0, 0.3]).userData.plain = true; box(0.94, 0.34, 0.02, white, 0.15, 0.78, 0.06, [0, 0, 0.3]).userData.plain = true; box(0.7, 0.1, 0.02, stamp, 0.15, 0.78, 0.07, [0, 0, 0.3]).userData.plain = true; box(0.7, 0.3, 0.14, black, 0, 2.55, 0); tor(0.16, 0.03, steel, 0, 2.78, 0, null, PI); },
    extinguisher() { const hose = M(0x1d1c1c, 0.6); cyl(0.5, 0.5, 1.7, red, 0, 0.9, 0); sph(0.5, red, 0, 1.75, 0, [1, 0.6, 1]); cyl(0.52, 0.52, 0.12, hose, 0, 0.06, 0); cyl(0.14, 0.14, 0.3, steel, 0, 2.15, 0); box(0.9, 0.1, 0.16, hose, 0.2, 2.42, 0, [0, 0, 0.15]); box(0.7, 0.08, 0.14, hose, 0.15, 2.22, 0); cyl(0.13, 0.13, 0.06, white, 0.1, 2.1, 0.16, [H, 0, 0]); rod([-0.1, 2.2, 0], [-0.75, 1.9, 0.1], 0.06, hose); rod([-0.75, 1.9, 0.1], [-0.72, 0.9, 0.15], 0.06, hose); put(new T.CylinderGeometry(0.06, 0.14, 0.4, 10), hose, -0.72, 0.7, 0.15); cyl(0.51, 0.51, 0.55, white, 0, 1.0, 0, null, 24); box(0.4, 0.07, 0.03, red, 0, 1.1, 0.51).userData.plain = true; box(0.26, 0.07, 0.03, red, 0, 0.92, 0.51).userData.plain = true; },
    intern() { const skin = M(0xe2b48c, 0.8), hair = M(0x6b3a16, 0.8), badge = M(0x2f6fd0, 0.6), shell = M(0xe6f1f8, 0.2); cyl(0.42, 0.58, 1.3, white, 0, 0.65, 0); sph(0.4, skin, 0, 1.7, 0); sph(0.42, hair, 0, 1.8, -0.06, [1, 0.8, 1]); side.forEach(q => { sph(0.045, black, q * 0.15, 1.68, 0.37).userData.plain = true; rod([q * 0.03, 1.3, 0.3], [q * 0.2, 1.3, 0.3], 0.012, red).userData.plain = true; }); rod([-0.14, 1.32, 0.3], [0, 0.95, 0.42], 0.015, red).userData.plain = true; rod([0.14, 1.32, 0.3], [0, 0.95, 0.42], 0.015, red).userData.plain = true; box(0.24, 0.3, 0.03, badge, 0, 0.82, 0.46); rod([-0.4, 1.15, 0], [-0.75, 0.75, 0.2], 0.1, white); rod([0.4, 1.15, 0], [0.85, 1.35, 0.2], 0.1, white); put(new T.CylinderGeometry(0.08, 0.28, 0.5, 12), shell, 1.0, 1.55, 0.2, [0, 0, -1.9]); sph(0.09, liq, 1.3, 1.25, 0.2, [1, 1.6, 1]).userData.plain = true; sph(0.07, liq, 1.36, 0.95, 0.2, [1, 1.6, 1]).userData.plain = true; sph(0.3, liq, 1.35, 0.03, 0.2, [1.2, 0.1, 0.9]); },
    orb() { const ball = glow(0x8f5cf0), mist = M(0xf2ecff, 0.4); cyl(0.7, 0.8, 0.16, brass, 0, 0.08, 0); cyl(0.3, 0.5, 0.3, brass, 0, 0.3, 0); [0.4, 2.5, 4.6].forEach(an => rod([Math.cos(an) * 0.3, 0.4, Math.sin(an) * 0.3], [Math.cos(an) * 0.55, 0.9, Math.sin(an) * 0.55], 0.06, brass)); sph(0.8, ball, 0, 1.45, 0); tor(0.32, 0.07, mist, -0.05, 1.45, 0.62, [0, 0, 0.6], PI * 1.4).userData.plain = true; sph(0.1, mist, 0.2, 1.3, 0.72, [1.5, 0.8, 0.4]).userData.plain = true; sph(0.13, white, -0.36, 1.86, 0.55, [1, 1.5, 0.4]).userData.plain = true; },
    // voodoo doll: a sack doll with a heart patch and two pins; the first goes in over 0 to 0.5, the second over 0.5 to 1
    voodoo() { const sack = M(0xb8894a, 0.95), pinm = M(0xd8dee6, 0.2, 0.9), pinh = M(0xd6453a, 0.4), patch = M(0xd6453a, 0.6);
      sph(0.55, sack, 0, 1.0, 0, [1, 1.25, 0.7]); sph(0.42, sack, 0, 1.95, 0, [1, 1, 0.75]); side.forEach(q => { rod([q * 0.4, 1.3, 0], [q * 1.0, 1.55, 0], 0.17, sack); rod([q * 0.25, 0.5, 0], [q * 0.35, -0.0, 0.05], 0.18, sack); sph(0.07, black, q * 0.16, 2.0, 0.3).userData.plain = true; });
      cyl(0.17, 0.17, 0.05, patch, -0.12, 1.1, 0.4, [H, 0, 0]).userData.plain = true; for (let k = -1; k <= 1; k++) box(0.04, 0.2, 0.02, black, k * 0.1, 1.55, 0.0, [0, 0, 0]).userData.plain = k === 9;
      const pins = [[[0.22, 1.35, 0.4], [0.75, 0.55, 0.3]], [[-0.3, 0.6, 0.2], [-0.8, 0.6, 0.45]]].map(q => { const g = pivot(q[0][0], q[0][1], q[0][2]); into(g, () => { rod([0, 0, 0], q[1], 0.05, pinm); sph(0.13, pinh, q[1][0], q[1][1], q[1][2]); }); return { g, p: q[0] }; });
      act(v => pins.forEach((q, i) => { const t = cl(v * 2 - i, 0, 1), o = 1 - t; q.g.position.set(q.p[0] + o * (i ? -0.6 : 0.7), q.p[1] + o * 0.9, q.p[2] + o * 0.6); })); },
    // ouija board: a wooden board with a sun, a moon, two arcs of marks and a planchette with a round window
    ouija() { const bd = M(0x8a5a2b, 0.7), face = M(0xf4efe0, 0.8), sun = M(0xf0b93a, 0.5), plan = M(0x8a5a2b, 0.7);
      box(3.0, 0.14, 2.1, bd, 0, 0.07, 0); box(2.75, 0.05, 1.85, face, 0, 0.16, 0).userData.plain = true;
      cyl(0.27, 0.27, 0.05, sun, -1.0, 0.2, -0.6).userData.plain = true; for (let k = 0; k < 8; k++) { const a = k * 0.785; box(0.05, 0.03, 0.2, sun, -1.0 + Math.cos(a) * 0.42, 0.2, -0.6 + Math.sin(a) * 0.42, [0, -a, 0]).userData.plain = true; }
      cyl(0.27, 0.27, 0.05, black, 1.0, 0.2, -0.6).userData.plain = true; cyl(0.23, 0.23, 0.06, face, 1.1, 0.205, -0.6).userData.plain = true;
      for (let k = 0; k < 11; k++) { const u = (k - 5) / 5; box(0.1, 0.03, 0.16, black, u * 1.1, 0.2, -0.1 + u * u * 0.3).userData.plain = true; box(0.1, 0.03, 0.16, black, u * 1.1, 0.2, 0.3 + u * u * 0.3).userData.plain = true; }
      put(new T.CylinderGeometry(0.5, 0.5, 0.1, 3, 1).rotateY(PI), plan, 0.1, 0.25, 0.7, [0, 0.15, 0], [1.3, 1, 1.5]); tor(0.17, 0.04, brass, 0.1, 0.32, 0.72, [H, 0, 0]); cyl(0.15, 0.15, 0.05, face, 0.1, 0.31, 0.72).userData.plain = true; },
    // skull candle: a skull with a red candle burning on its head, wax running down its face
    candle() { const wax = M(0xd6453a, 0.7), flame = glow(0xf0b93a);
      sph(0.72, bone, 0, 1.0, 0, [1, 0.95, 1.05]); box(0.66, 0.36, 0.55, bone, 0, 0.42, 0.14);
      side.forEach(q => sph(0.2, black, q * 0.27, 1.05, 0.58, [1, 1.1, 0.5]).userData.plain = true); put(new T.ConeGeometry(0.09, 0.2, 3), black, 0, 0.8, 0.7, [PI, 0, 0]).userData.plain = true;
      for (let k = 0; k < 5; k++) box(0.04, 0.2, 0.02, black, (k - 2) * 0.12, 0.4, 0.43).userData.plain = true;
      cyl(0.24, 0.26, 0.85, wax, 0, 1.95, 0, null, 18); [[0.3, 0.35], [-0.18, 0.5], [0.08, 0.6]].forEach(q => { rod([q[0], 1.6, q[1]], [q[0], 1.15 - q[1] * 0.3, q[1] + 0.05], 0.07, wax); sph(0.09, wax, q[0], 1.1 - q[1] * 0.3, q[1] + 0.05, [1, 1.4, 1]); });
      rod([0, 2.35, 0], [0, 2.5, 0], 0.02, black); sph(0.17, flame, 0, 2.7, 0, [0.85, 1.5, 0.85]).userData.plain = true; put(new T.ConeGeometry(0.12, 0.3, 8), flame, 0, 3.0, 0).userData.plain = true; shine(-0.3, 1.3, 0.62, 0.1, 0.35, 0.5); },
    // goat: a white goat in profile on a round slab with a red star and two candles
    goat() { const wh = M(0xf4efe0, 0.85), horn = M(0x8a5a2b, 0.6), hoof = black, redm = M(0xd6453a, 0.6), wax = M(0xd6453a, 0.7), flame = glow(0xf0b93a);
      cyl(1.55, 1.65, 0.14, dark, 0, 0.07, 0, null, 36); tor(1.3, 0.035, redm, 0, 0.16, 0, [H, 0, 0]);
      for (let k = 0; k < 5; k++) { const a = H + k * 1.2566, b = H + ((k + 2) % 5) * 1.2566; rod([Math.cos(a) * 1.3, 0.17, -Math.sin(a) * 1.3], [Math.cos(b) * 1.3, 0.17, -Math.sin(b) * 1.3], 0.035, redm); }
      [[-1.25, 0.9], [1.3, 0.8]].forEach(q => { cyl(0.11, 0.11, 0.45, wax, q[0], 0.37, q[1]); sph(0.09, flame, q[0], 0.72, q[1], [0.8, 1.5, 0.8]).userData.plain = true; });
      sph(0.62, wh, -0.1, 1.2, 0, [1.4, 0.78, 0.72]); rod([0.55, 1.3, 0], [0.95, 1.85, 0], 0.2, wh); sph(0.3, wh, 1.05, 1.95, 0, [1.35, 1.0, 0.9]); sph(0.12, wh, 1.45, 1.85, 0, [1, 0.8, 0.9]);
      side.forEach(q => { rod([0.95, 2.1, q * 0.14], [0.45, 2.45, q * 0.22], 0.075, horn); put(new T.ConeGeometry(0.075, 0.3, 6), horn, 0.3, 2.52, q * 0.24, [0, 0, 1.2]); });
      put(new T.ConeGeometry(0.1, 0.35, 8), wh, 1.1, 1.5, 0, [PI, 0, 0]);
      [[-0.6, 0.3], [-0.6, -0.3], [0.3, 0.3], [0.3, -0.3]].forEach(q => { rod([q[0], 1.0, q[1]], [q[0], 0.2, q[1]], 0.075, wh); cyl(0.09, 0.1, 0.1, hoof, q[0], 0.2, q[1]); });
      put(new T.ConeGeometry(0.12, 0.35, 6), wh, -0.85, 1.55, 0, [0, 0, 0.9]); sph(0.05, black, 1.28, 2.0, 0.26).userData.plain = true; shine(-0.4, 1.45, 0.45, 0.35, 0.07, 0.1); },
    dryer() { const shell = M(0xe6f1f8, 0.2), cot = M(0xc9b081, 0.95), gran = M(0x6fa3e8, 0.7); box(1.9, 0.12, 0.95, dark, 0, 0.06, 0); cyl(0.06, 0.06, 2.6, steel, 0, 1.3, -0.3); box(0.9, 0.1, 0.14, steel, 0, 1.6, -0.2); tor(0.6, 0.2, shell, 0, 1.0, 0, [0, 0, PI], PI); side.forEach(q => { cyl(0.2, 0.2, 1.3, shell, q * 0.6, 1.65, 0); cyl(0.215, 0.215, 0.8, gran, q * 0.6, 1.45, 0); sph(0.24, cot, q * 0.6, 2.32, 0, [1, 0.8, 1]); }); tor(0.6, 0.215, gran, 0, 1.0, 0, [0, 0, PI + 0.5], PI - 1.0); },
    // sieves: a round wire sieve on a stand with a drop of water stuck in the mesh
    sieves() { const wire = M(0xf0b93a, 0.35, 0.8), bl = M(0x3a6fd0, 0.3);
      cyl(0.8, 0.95, 0.16, dark, 0, 0.08, 0); side.forEach(q => rod([q * 0.3, 0.1, 0], [q * 0.85, 1.2, 0], 0.1, steel)); tor(1.05, 0.14, wire, 0, 2.1, 0);
      for (let k = -3; k <= 3; k++) { const x = k * 0.3, h = Math.sqrt(Math.max(0, 1.05 * 1.05 - x * x)); rod([x, 2.1 - h, 0], [x, 2.1 + h, 0], 0.045, steel); rod([-h, 2.1 + x, 0], [h, 2.1 + x, 0], 0.045, steel); }
      drop(-0.3, 2.45, 0.1, 0.22, bl); drop(0.35, 1.8, 0.1, 0.16, bl); drop(0.0, 3.55, 0, 0.18, bl); },
    // fume hood: a blue cabinet with a glass sash, a yellow flask under it and a fat arrow carrying the fumes up the duct
    hood() { const cab = M(0x3a6fd0, 0.6), sash = M(0xdfe9ee, 0.1, 0, { transparent: true, opacity: 0.4, op: 0.4 }), yl = M(0xf0b93a, 0.3), wh = M(0xf4efe0, 0.5);
      box(2.6, 0.9, 1.5, cab, 0, 0.45, 0); box(2.6, 1.7, 0.2, cab, 0, 1.75, -0.65); side.forEach(q => box(0.2, 1.7, 1.5, cab, q * 1.2, 1.75, 0)); box(2.6, 0.2, 1.5, cab, 0, 2.7, 0);
      sph(0.42, yl, 0, 1.45, 0); cyl(0.14, 0.18, 0.4, yl, 0, 1.9, 0); box(2.1, 1.3, 0.06, sash, 0, 1.75, 0.72); cyl(0.55, 0.55, 0.9, steel, 0, 3.2, -0.4, null, 18);
      arrow(0, 1.2, 0, 3.9, 0.9, wh, 0.42); },
    // scrubber: a wash bottle, a pipe taking gas down into blue liquid and fat bubbles rising out of it
    scrubber() { const shell = M(0xdfe9ee, 0.1, 0, { transparent: true, opacity: 0.4, op: 0.4 }), bl = M(0x3a6fd0, 0.3), cr = M(0xf4efe0, 0.4), cap = M(0x2c2f34, 0.5);
      cyl(0.95, 0.95, 2.2, shell, 0, 1.2, 0, null, 24); cyl(0.9, 0.9, 1.3, bl, 0, 0.8, 0, null, 24).userData.plain = false; cyl(0.97, 0.97, 0.22, cap, 0, 2.4, 0, null, 24);
      rod([-0.35, 2.9, 0], [-0.35, 0.5, 0], 0.11, steel); rod([-0.35, 2.9, 0], [-1.3, 2.9, 0], 0.11, steel); rod([0.5, 2.4, 0], [0.5, 3.0, 0], 0.11, steel); rod([0.5, 3.0, 0], [1.4, 3.0, 0], 0.11, steel);
      [[-0.2, 0.9, 0.25], [0.3, 1.3, 0.2], [-0.4, 1.6, 0.17], [0.2, 1.9, 0.15]].forEach(q => sph(q[2], cr, q[0], q[1], 0.15)); arrow(-1.9, 2.9, -1.3, 2.9, 0, cr, 0.18); },
    pact() { const paper = M(0xe0c88c, 0.9); box(1.6, 0.03, 2.0, paper, 0, 0.1, 0, [0, 0.12, 0]); [-1.05, 1.05].forEach(z => cyl(0.16, 0.16, 1.75, paper, z * 0.12, 0.16, z, [0, 0.12, H])); cyl(0.26, 0.26, 0.08, red, 0.45, 0.15, 0.5); for (let k = 0; k < 3; k++) box(1.0, 0.012, 0.05, black, -0.1, 0.125, -0.6 + k * 0.28, [0, 0.12, 0]); box(0.7, 0.012, 0.04, black, -0.3, 0.125, 0.45, [0, 0.12, 0]); bones(-0.75, 0.3, 0.75); rod([-0.6, 0.25, 0.5], [-0.25, 1.5, -0.2], 0.03, black); box(0.3, 0.8, 0.02, white, -0.33, 1.25, -0.06, [0.5, 0, -0.27]); },
  };
  Object.keys(HOMID).forEach(k => { B['jar_' + k] = () => { mkJar(k, 0.6, 1); }; B['jarr_' + k] = () => { mkJar(k, 1, 2); }; B['jarh_' + k] = () => { mkJar(k, 0.5, 1); }; B['jars_' + k] = () => { [[0.08, 0], [0.5, 1], [1, 2]].forEach((q, i) => mkJar(k, q[0], q[1], (i - 1) * 2.4)); }; });
  if (id === '__list') return Object.keys(B);
  if (!B[id]) return false;
  B[id]();
  let inkK = 1;
  if (U.length) { grp.userData.use = v => U.forEach(f => f(v)); grp.userData.use(0); }
  if (R.body && CHAR[id]) R.extra.push(o => { if (o.tuck) CHAR[id](R, o); });
  if (R.body) { grp.userData.rig = R; pose(grp, {}); }
  else if (!/^(jar|hom)/.test(id) && id !== 'coin' && !(extra && extra.raw)) { // every piece fits the same box: 2.5 wide and 3.1 tall, flat ones 2.9 wide
    const w = new T.Group(); grp.children.slice().forEach(c => w.add(c)); const bb = new T.Box3().setFromObject(w), sz = bb.getSize(new T.Vector3());
    let k = FLAT[id] ? 2.9 / Math.max(sz.x, sz.z, 0.1) : Math.min(2.5 / Math.max(sz.x, sz.z, 0.1), 3.1 / Math.max(sz.y, 0.1)); k = Math.max(0.25, Math.min(2.4, k)); inkK = k;
    w.scale.setScalar(k); w.position.set(-(bb.min.x + bb.max.x) / 2 * k, -bb.min.y * k, -(bb.min.z + bb.max.z) / 2 * k); grp.add(w); }
  // every piece stands centered on its own place, so the words under it sit under its middle
  { const bb = new T.Box3().setFromObject(grp), cx = (bb.min.x + bb.max.x) / 2; if (isFinite(cx) && !R.body && inkK === 1) grp.children.forEach(c => { c.position.x -= cx; }); }
  finish(T, grp, (extra && extra.ink) || 0.05 / inkK); return true;
}
// Posing a creature without knowing its parts. o = { lean: [dx, dz], reach: 0..1, squash: -1..1, t: seconds }.
// lean is a direction on the page in the creature's own frame (x to the right, z toward the viewer); the body tips that way from its feet
// and the arms swing toward it as far as reach says. tuck: true folds the arms in against the body (what the jars use). squash 1 is flat and wide (a step), -1 tall and thin (a stretch). t adds a slow breath.
function pose(grp, o) {
  const R = grp && grp.userData && grp.userData.rig; if (!R) return false; o = o || {};
  const lx = o.lean ? o.lean[0] : 0, lz = o.lean ? o.lean[1] : 0, m = Math.hypot(lx, lz), k = Math.min(1, m), rc = Math.max(0, Math.min(1, o.reach || 0)), sq = Math.max(-1, Math.min(1, o.squash || 0)), t = o.t || 0, T = R.T;
  const br = 1 + 0.015 * Math.sin(t * 2.4);
  R.body.position.y = 0;
  R.body.scale.set(1 + 0.16 * sq, (1 - 0.3 * sq) * br, 1 + 0.16 * sq);
  const tk = o.tuck ? 1 : 0;
  R.body.rotation.set(R.lean0[0] * (1 - 0.7 * tk) + (m ? lz / m * k * 0.42 : 0), 0, R.lean0[1] * (1 - 0.7 * tk) - (m ? lx / m * k * 0.42 : 0));
  const dx = m ? lx / m : 0, dz = m ? lz / m : -1;
  R.arms.forEach(a => { const q = new T.Quaternion().setFromAxisAngle(new T.Vector3(-dz, 0, dx), 0.6 + rc * 1.7); a.g.quaternion.copy(a.rest); if (rc > 0) a.g.quaternion.slerp(q, rc); a.g.scale.y = 1 + a.stretch * rc; if (tk) { a.g.quaternion.set(0, 0, 0, 1); a.g.scale.y = 1; a.g.position.set(a.home.x * 0.35, a.home.y, a.home.z * 0.5); } else a.g.position.copy(a.home); });
  R.extra.forEach(f => f(o)); return true;
}
// the same toward a point in world space: the page says where the thing to reach for is
function poseToward(grp, T, world, reach, squash, t) {
  const p = grp.worldToLocal(world.clone()), m = Math.hypot(p.x, p.z) || 1, d = Math.min(1, m / 6);
  return pose(grp, { lean: [p.x / m * d, p.z / m * d], reach, squash, t });
}
// a creature, or the jar of one. key: water, h2, co2, acid, wood, salt, slime, ammonia, seedling, brimstone
function creature(T, key, tint) { const g = new T.Group(); return build(HOMID[key], T, g, tint || new T.Color(0x3a6fd0)) ? g : null; }
// the check: for every creature at every stage, how far from the jar's axis and how low and high it reaches, against the inner glass (0.9, kept to 0.84) and the lid (2.3, kept to 2.2)
function jarReport(T) { return Object.keys(HOMID).map(k => { const j = jar(T, k, 1, 2); return { key: k, stages: j.userData.report() }; }); }
function jar(T, key, fill, stage) { const g = new T.Group(); if (!build('jar_' + key, T, g, new T.Color(0x3a6fd0))) return null; const j = g.children[0]; j.userData.set(fill == null ? 0.6 : fill, stage); return j; }
// The coin on the ink canvas, the same coin as the 3D one: gold disc, thick ink edge, an engraved ring and diamond, one highlight.
// drawCoin(ctx, x, y, r, { turn: 0..1 spins it about its height, alpha })
function drawCoin(c, x, y, r, o) {
  o = o || {}; const sx = o.turn == null ? 1 : Math.max(0.12, Math.abs(Math.cos(o.turn * Math.PI))), ink = '#2b2622';
  c.save(); c.translate(x, y); c.scale(sx, 1); if (o.alpha != null) c.globalAlpha = o.alpha;
  c.beginPath(); c.arc(0, 0, r, 0, 6.2832); c.fillStyle = '#f0b93a'; c.fill(); c.lineWidth = Math.max(2, r * 0.16); c.strokeStyle = ink; c.stroke();
  c.beginPath(); c.arc(0, 0, r * 0.64, 0, 6.2832); c.lineWidth = Math.max(1.2, r * 0.07); c.stroke();
  const d = r * 0.17; c.beginPath(); c.moveTo(0, -d); c.lineTo(d, 0); c.lineTo(0, d); c.lineTo(-d, 0); c.closePath(); c.fillStyle = ink; c.fill();
  c.beginPath(); c.moveTo(-r * 0.62, -r * 0.42); c.lineTo(-r * 0.34, -r * 0.66); c.lineWidth = Math.max(1.5, r * 0.1); c.lineCap = 'round'; c.strokeStyle = '#fffaf0'; c.stroke();
  c.restore();
}
// The in-use pose of an instrument: use(group, s) with s from 0 (at rest) to 1 (in use), any value between. The page does not need the parts.
//   mirror 1 tilts back to face the work; crystal 1 is grown; magnet 1 leans in; bunsen 0 flame low, 1 flame high; burette 0 to 0.5 a drop forms,
//   0.5 to 1 it falls; voodoo 0 to 0.5 the first pin goes in, 0.5 to 1 the second; paw the fingers curl one by one (s 0.2 is one finger);
//   recycler 1 is a third of a turn (turn it again for a loop); cannula 0 to 1 a drop runs from the left flask to the right.
function use(grp, s) { const f = grp && grp.userData && grp.userData.use; if (!f) return false; f(Math.max(0, Math.min(1, s || 0))); return true; }
// pieces that lie flat on the page and are seen from on top
const FLAT = { coin: 1, spatula: 1, loupe: 1, ouija: 1, pact: 1, stopwatch: 1, magnet: 1 };
AA.rxKit = { build, FLAT, K, mat, finish, snap, PAL, drawCoin, use, jarReport, pose, poseToward, creature, jar, HOMID, list: T => { const g = {}; return build('__list', T, { add() {}, traverse() {}, children: [] }, new T.Color(0)); } };
})(typeof globalThis !== 'undefined' ? globalThis : window);
