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
  // a flag on a pole for each yield mark, climbing in drama: 0 stable (hangs calm), 1 unstable (flutters), 2 volatile (flames), 3 overreact (snapped pole, torn cloth flying off).
  // on = false draws it as ink outline only (not yet passed); on = true filled (passed)
  const markFlag = (lv, on) => {
    const col = [0x3a6fd0, 0xf0b93a, 0xd6453a, 0x2c2f34][lv], fm = on ? M(col, 0.5) : M(0xe9e2d0, 0.9, 0, { exact: 1 }), hot = on ? M(lv === 3 ? 0xd6453a : 0xf0b93a, 0.4) : fm;
    const top = [2.6, 2.9, 3.1, 3.4][lv];
    cyl(0.55 + lv * 0.05, 0.65 + lv * 0.05, 0.14, dark, 0, 0.07, 0, null, 14);
    if (lv < 3) rod([0, 0.1, 0], [0, top, 0], 0.07, steel); else { rod([0, 0.1, 0], [0.05, 1.5, 0], 0.08, steel); rod([0.35, 1.8, 0], [0.7, 3.4, 0], 0.08, steel); [[0.12, 1.65, 0.0], [0.28, 1.6, 0.05], [0.2, 1.9, -0.05]].forEach(q => put(new T.ConeGeometry(0.08, 0.35, 4), steel, q[0], q[1], q[2], [0, 0, q[0] * 6])); }
    if (lv === 0) box(1.4, 1.0, 0.07, fm, 0.75, top - 0.6, 0);
    else if (lv === 1) { [0, 1, 2, 3].forEach(k => box(0.5, 0.9 - k * 0.08, 0.07, fm, 0.3 + k * 0.45, top - 0.5 + (k % 2 ? 0.12 : -0.1), 0, [0, 0, k % 2 ? 0.28 : -0.28])); put(new T.ConeGeometry(0.2, 0.45, 3), fm, 2.1, top - 0.45, 0, [0, 0, -H], [1, 1, 0.3]); }
    else if (lv === 2) { [0, 1, 2].forEach(k => put(new T.ConeGeometry(0.34, 1.5 - k * 0.2, 8), fm, 0.95 + k * 0.1, top - 0.35 - k * 0.45, 0, [0, 0, -H + 0.25 - k * 0.2], [1, 1, 0.3])); put(new T.ConeGeometry(0.3, 0.9, 8), hot, 0.1, top + 0.4, 0, null, [1, 1, 0.4]); [0, 1].forEach(k => put(new T.ConeGeometry(0.17, 0.8 - k * 0.2, 8), hot, 0.9 + k * 0.1, top - 0.35 - k * 0.45, 0.05, [0, 0, -H + 0.25 - k * 0.2], [1, 1, 0.3])); }
    else { box(1.0, 0.8, 0.07, fm, 0.9, 2.95, 0, [0, 0, 0.1]); [[1.7, 3.3, 0.8], [2.2, 2.6, -1.0], [1.6, 3.9, 0.5], [2.4, 3.5, 1.4]].forEach((q, i) => put(new T.ConeGeometry(0.28, 0.6, 3), fm, q[0], q[1], 0, [0, 0, q[2]], [1, 1, 0.25])); [0, 1, 2, 3, 4].forEach(k => put(new T.ConeGeometry(0.1, 0.55, 5), hot, 0.45 + Math.cos(k * 1.3 + 0.3) * 0.5, 1.7 + Math.sin(k * 1.3 + 0.3) * 0.5, 0, [0, 0, k * 1.3 - H])); }
  };
  // a plain wooden shelf for n instruments (3 across each); the tops of the instruments stand on y = 0
  const shelf = n => { const L = n * 3 + 0.6; box(L, 0.3, 2.2, wood, 0, -0.15, 0); box(L, 0.8, 0.16, M(0x6b4420, 0.7, 0, { exact: 1 }), 0, -0.55, 1.0); box(L, 0.2, 0.2, wood, 0, -0.5, -0.9); const nl = n > 6 ? 3 : 2; for (let k = 0; k < nl; k++) { const x = -L / 2 + 0.5 + k * (L - 1) / (nl - 1); box(0.3, 1.3, 0.3, wood, x, -0.95, -0.6); box(0.7, 0.14, 0.7, wood, x, -1.6, -0.6); } };
  // a price tag that hangs from an instrument: n gold coins drawn on a card (1 to 5), or one coin and a blank for the page to letter a number (0)
  const tag = n => { const hg = pivot(0, 0, 0); const cm = M(0xf0b93a, 0.3, 0.6), card = M(0xf4efe0, 0.8);
    into(hg, () => { tor(0.16, 0.035, steel, 0, 0.1, 0.0); box(1.8, 1.2, 0.08, card, 0, -0.55, 0); cyl(0.07, 0.07, 0.1, dark, 0, -0.1, 0, [H, 0, 0]);
      const pts = n === 0 ? [[-0.4, -0.65]] : [[], [[0, -0.65]], [[-0.4, -0.65], [0.4, -0.65]], [[-0.5, -0.45], [0.5, -0.45], [0, -0.85]], [[-0.45, -0.45], [0.45, -0.45], [-0.45, -0.85], [0.45, -0.85]], [[-0.6, -0.4], [0.6, -0.4], [0, -0.62], [-0.6, -0.85], [0.6, -0.85]]][n];
      pts.forEach(q => { cyl(0.19, 0.19, 0.07, cm, q[0], q[1], 0.07, [H, 0, 0], 20); box(0.07, 0.1, 0.02, black, q[0], q[1], 0.12).userData.plain = true; }); if (n === 0) box(0.5, 0.6, 0.02, M(0xd6d2c4, 0.8, 0, { exact: 1 }), 0.5, -0.65, 0.05).userData.plain = true; }); };
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
  JC.acid = [0xd4e21a, 0.9]; JC.slime = [0x8a5ad0, 0.9];   // (builder 14) acid is yellow-green, slime is violet
  const HOMID2 = Object.assign({ homunculus: 'homclay' }, HOMID);
  const JW = { homunculus: 1, salt: 0.72, brimstone: 0.85, slime: 0.9, h2: 0.9 };
  const mkJar = (k, fill, stage, at) => {
    const g = new T.Group(), jc = JC[k] || [0x3a6fd0, 0.9], ink = new T.MeshBasicMaterial({ color: lin(0x2b2622) }), pl = (m, c) => { m.userData.plain = true; if (c) m.castShadow = false; return m; };

    const n0 = grp.children.length;
    cyl(1.0, 1.05, 0.14, wood, 0, 0.07, 0, null, 28);
    pl(put(new T.CylinderGeometry(0.94, 0.94, 2.15, 28, 1, true), M(0xdfe9ee, 0.08, 0, { transparent: true, opacity: 0.1, op: 0.12 }), 0, 1.22, 0), 1).renderOrder = 3;
    pl(tor(0.94, 0.035, ink, 0, 0.17, 0, [H, 0, 0]), 1); pl(tor(0.94, 0.035, ink, 0, 2.3, 0, [H, 0, 0]), 1);
    if (!K.nolid) cyl(0.99, 0.99, 0.2, dark, 0, 2.4, 0, null, 28); pl(put(new T.CylinderGeometry(0.95, 0.95, 1.5, 6, 1, true, -1.42, 0.2), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false, side: T.DoubleSide }), 0, 1.35, 0), 1).renderOrder = 4; pl(put(new T.CylinderGeometry(0.95, 0.95, 0.35, 4, 1, true, -1.42, 0.12), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false, side: T.DoubleSide }), 0, 0.42, 0), 1).renderOrder = 4;
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
    g.userData.set = (f, st) => { f = Math.max(0, Math.min(1, f)); st = st == null ? (f < 0.34 ? 0 : f < 1 ? 1 : 2) : st; const h = 0.05 + f * 1.8; lq.scale.y = h; lq.position.y = 0.17 + h / 2; sf.position.y = lv.position.y = 0.17 + h; lq.visible = sf.visible = lv.visible = f > 0.001; sp.visible = st === 0; mid.visible = st === 1; big.visible = st === 2 && !g.userData.big2; if (g.userData.big2) g.userData.big2.visible = st === 2; g.userData.fill = f; g.userData.stage = st; };
    // (builder 20) the creature in its jar in the form of its stage (the pushed forms), fitted to the glass as the old one was
    g.userData.form = sg => { if (g.userData.sg === sg) return; g.userData.sg = sg; const pv = new T.Group(); if (!build(HOMID2[k], T, pv, tint, { jar: true, ink: 0.05, stage: sg, push: true })) return; const h2 = new T.Group(); h2.add(pv); let b = meas(pv, h2); const cx2 = (b.x0 + b.x1) / 2, cz2 = (b.z0 + b.z1) / 2; b = meas(pv, h2, cx2, cz2); const s3 = Math.min(0.8 / b.r, 1.95 / (b.y1 - b.y0), 1.6); h2.remove(pv); pv.scale.setScalar(s3); pv.position.set(-cx2 * s3, 0.21 - b.y0 * s3, -cz2 * s3); if (g.userData.big2) g.remove(g.userData.big2); pv.visible = big.visible || !!(g.userData.big2 && g.userData.big2.visible) || g.userData.stage === 2; big.visible = false; g.add(pv); g.userData.big2 = pv; };
    g.userData.big = big; g.userData.mid = mid;   // (builder 14) the page moves the creature inside its jar
    g.userData.set(fill, stage); if (at) g.position.set(at, 0, 0); grp.add(g); return g;
  };
  const B = {
    // balance: a beam scale with a red and a blue weight; in use (0 to 1) the two weights trade pans while the beam rocks
    balance() { const rd = M(0xd6453a, 0.5), bl = M(0x3a6fd0, 0.5);
      box(2.8, 0.3, 1.2, wood, 0, 0.15, 0); cyl(0.14, 0.2, 1.9, brass, 0, 1.2, 0); sph(0.24, brass, 0, 2.2, 0);
      const bm = pivot(0, 2.2, 0); into(bm, () => rod([-1.35, 0, 0], [1.35, 0, 0], 0.09, brass));
      const pan = q => { const g = pivot(0, 0, 0); into(g, () => { cyl(0.6, 0.45, 0.12, brass, 0, 0, 0); rod([-0.45, 0.08, 0], [0, 1.0, 0], 0.03, brass); rod([0.45, 0.08, 0], [0, 1.0, 0], 0.03, brass); }); return g; };
      const pl = pan(-1), pr = pan(1), wl = pivot(0, 0, 0), wr = pivot(0, 0, 0); into(wl, () => box(0.55, 0.55, 0.55, rd, 0, 0.28, 0)); into(wr, () => box(0.55, 0.55, 0.55, bl, 0, 0.28, 0));
      act(v => { const th = 0.2 * Math.sin(v * PI), c = Math.cos(th), sn = Math.sin(th), Lx = -1.35 * c, Ly = 2.2 - 1.35 * sn - 1.1, Rx = 1.35 * c, Ry = 2.2 + 1.35 * sn - 1.1; bm.rotation.z = th; pl.position.set(Lx, Ly, 0); pr.position.set(Rx, Ry, 0);
        const e = v * v * (3 - 2 * v), h = 1.0 * Math.sin(v * PI); wl.position.set(Lx + (Rx - Lx) * e, Ly + (Ry - Ly) * e + 0.07 + h, 0.3 * Math.sin(v * PI)); wr.position.set(Rx + (Lx - Rx) * e, Ry + (Ly - Ry) * e + 0.07 + h, -0.3 * Math.sin(v * PI)); }); },
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
    // mirror: a hand mirror hung in a stand; in use (0 to 1) it tilts well back to face the work and a bright reflection flares on the glass
    mirror() { const gl = M(0x8d949c, 0.4), fr = M(0xf0b93a, 0.35, 0.8), br = M(0xfffaf0, 0.2, 0, { emissive: new T.Color(0x909080) });
      cyl(0.8, 0.95, 0.16, fr, 0, 0.08, 0, null, 24); side.forEach(q => rod([q * 0.98, 0.1, 0], [q * 0.98, 1.9, 0], 0.09, fr));
      const mp = pivot(0, 1.9, 0), gz = new T.Group(); into(mp, () => { tor(0.82, 0.13, fr, 0, 0, 0); cyl(0.8, 0.8, 0.08, gl, 0, 0, 0, [H, 0, 0], 28); rod([0, -0.9, 0], [0, -1.55, 0], 0.11, fr); shine(-0.3, 0.3, 0.1, 0.12, 0.6, 0.6);
        gz.position.set(0.1, 0.1, 0.12); mp.add(gz); into(gz, () => { sph(0.4, br, 0, 0, 0, [1, 1, 0.1]).userData.plain = true; box(1.5, 0.1, 0.03, br, 0, 0, 0.02).userData.plain = true; box(0.1, 1.5, 0.03, br, 0, 0, 0.02).userData.plain = true; }); });
      act(v => { mp.rotation.x = -1.0 * v; gz.visible = v > 0.35; gz.scale.setScalar(0.3 + 0.9 * v); }); },
    // mortar: a stone bowl with a pestle and some powder; in use (0 to 1) the pestle grinds round the bowl
    mortar() { const wh = M(0x8d98a6, 0.5), pw = M(0xf4efe0, 0.9);
      cyl(1.05, 0.6, 0.95, wh, 0, 0.48, 0, null, 28); cyl(0.78, 0.78, 0.04, pw, 0, 0.93, 0, null, 24).userData.plain = true; tor(1.0, 0.07, wh, 0, 0.95, 0, [H, 0, 0]);
      const pg = pivot(0, 0.9, 0); into(pg, () => { rod([0, 0, 0], [0.7, 1.5, 0], 0.17, wh); sph(0.26, wh, 0.7, 1.5, 0); sph(0.22, wh, 0, 0, 0); });
      act(v => { pg.rotation.y = v * 6.2832 * 1.5; pg.position.y = 0.9 + 0.06 * Math.sin(v * 25); }); },
    // cannula: two glass flasks bridged by a long needle; in use (0 to 1) the liquid runs along it, left flask drains, right fills
    cannula() { const gl = M(0xdfe9ee, 0.1, 0, { transparent: true, opacity: 0.4, op: 0.4 }), bl = M(0x3a6fd0, 0.3), stp = M(0xd6453a, 0.7), ndl = M(0xd8dee6, 0.2, 0.9);
      const lq = [-1.4, 1.4].map(x => { sph(0.85, gl, x, 0.85, 0); cyl(0.26, 0.3, 0.7, gl, x, 1.7, 0); cyl(0.32, 0.26, 0.3, stp, x, 2.15, 0); put(new T.ConeGeometry(0.12, 0.7, 8), ndl, x, 2.1, 0, [PI, 0, 0]); const g = pivot(x, 0.15, 0); into(g, () => sph(0.74, bl, 0, 0.74, 0)); return g; });
      tor(1.4, 0.13, ndl, 0, 2.3, 0, null, PI); shine(-1.5, 0.95, 0.8, 0.1, 0.5, 0.4);
      const dp = drop(0, 3.7, 0, 0.3, bl); act(v => { const a = PI * (1 - v); dp.position.set(Math.cos(a) * 1.4, 2.3 + Math.sin(a) * 1.4 + 0.2, 0.05); dp.scale.setScalar(0.6 + 0.6 * Math.sin(v * PI)); lq[0].scale.set(1, 1 - 0.8 * v, 1); lq[1].scale.set(1, 0.2 + 0.8 * v, 1); }); },
    // reflux: a flask over a flame, a tall blue water jacket on it, a red arrow up (vapor) and a blue arrow down (drops), so the same stuff goes round and round
    reflux() { const mg = M(0xb0189a, 0.3), jk = M(0x3a6fd0, 0.3), wh = M(0xf4efe0, 0.4), fl = M(0xf0b93a, 0.4, 0, { emissive: new T.Color(0x6a4a10) });
      cyl(1.0, 1.1, 0.16, dark, 0, 0.08, 0); put(new T.ConeGeometry(0.3, 0.6, 10), fl, 0, 0.5, 0); sph(0.85, mg, 0, 1.6, 0); cyl(0.3, 0.38, 0.7, wh, 0, 2.5, 0);
      cyl(0.5, 0.5, 1.8, jk, 0, 3.6, 0); cyl(0.55, 0.55, 0.14, wh, 0, 2.75, 0); cyl(0.55, 0.55, 0.14, wh, 0, 4.5, 0); cyl(0.3, 0.3, 0.3, wh, 0, 4.75, 0);
      arrow(-1.25, 2.4, -1.25, 4.2, 0, red, 0.32); arrow(1.25, 4.2, 1.25, 2.4, 0, jk, 0.32); shine(-0.2, 3.7, 0.5, 0.1, 1.0, 0.0); },
    // burette: a tall tube of green on a stand with a red tap; a drop forms (0 to 0.5) and falls (0.5 to 1) into the flask below
    // burette: a tall tube of green on a stand with a red tap; in use (0 to 0.5) a large drop swells at the tip, (0.5 to 1) it stretches and falls into the flask
    burette() { const gr = M(0x3c9a5f, 0.3), tube = M(0xdfe9ee, 0.1, 0, { transparent: true, opacity: 0.4, op: 0.4 }), fl2 = M(0xdfe9ee, 0.1, 0, { transparent: true, opacity: 0.4, op: 0.4 }), dg = M(0x7fd14a, 0.2);
      box(2.0, 0.16, 1.1, dark, 0, 0.08, 0); cyl(0.07, 0.07, 3.9, steel, -0.75, 2.0, 0); box(0.95, 0.12, 0.2, steel, -0.35, 3.0, 0);
      cyl(0.4, 0.4, 1.8, tube, 0.1, 2.5, 0); cyl(0.3, 0.3, 1.4, gr, 0.1, 2.3, 0); box(0.6, 0.18, 0.18, red, 0.1, 1.55, 0); put(new T.ConeGeometry(0.12, 0.4, 8), steel, 0.1, 1.3, 0, [PI, 0, 0]);
      cyl(0.6, 0.6, 0.3, fl2, 0.1, 0.25, 0); cyl(0.2, 0.6, 0.25, fl2, 0.1, 0.52, 0); cyl(0.56, 0.56, 0.12, gr, 0.1, 0.24, 0).userData.plain = true;
      const dp = drop(0.1, 1.0, 0, 0.45, dg); into(dp, () => shine(-0.1, 0.0, 0.3, 0.08, 0.22, 0.3));
      act(v => { if (v < 0.5) { const k = v * 2; dp.scale.setScalar(0.05 + 0.95 * k); dp.position.y = 1.07 - 0.45 * (0.05 + 0.95 * k); dp.visible = v > 0.01; } else { const f = (v - 0.5) * 2; dp.scale.set(1 - 0.2 * f, 1 + 0.7 * f, 1 - 0.2 * f); dp.position.y = 0.66 - f * 0.4; dp.visible = f < 0.97; } }); },
    clamp() { box(1.5, 0.12, 1.0, dark, -0.3, 0.06, 0); cyl(0.07, 0.07, 3.0, steel, -0.6, 1.5, 0); box(0.3, 0.3, 0.3, dark, -0.6, 2.2, 0); rod([-0.6, 2.2, 0], [0.5, 2.2, 0], 0.05, steel); tor(0.35, 0.07, steel, 0.85, 2.2, 0, [H, 0, 0], PI * 1.5); cyl(0.1, 0.1, 0.3, brass, -0.6, 2.2, 0.3, [H, 0, 0]); },
    // magnet: a red horseshoe with silver tips, standing; in use (1) it leans in toward the work
    magnet() { const mg = pivot(0, 0, 0); into(mg, () => { tor(0.75, 0.26, red, 0, 1.4, 0, null, PI); side.forEach(q => { cyl(0.26, 0.26, 0.9, red, q * 0.75, 0.95, 0); cyl(0.27, 0.27, 0.5, steel, q * 0.75, 0.3, 0); }); shine(-0.55, 1.9, 0.27, 0.1, 0.35, 0.8); });
      act(v => { mg.rotation.x = -v * 0.6; mg.position.z = -v * 0.25; }); },
    // recycler: three arrows chasing round a triangle; in use (0 to 1) it spins a full turn and swells
    recycler() { const gr = M(0x3c9a5f, 0.4); cyl(0.7, 0.8, 0.16, dark, 0, 0.08, 0); cyl(0.12, 0.12, 0.9, dark, 0, 0.6, 0);
      const rg = pivot(0, 1.95, 0); into(rg, () => { for (let k = 0; k < 3; k++) { const a = H + k * 2.0944, b = H + (k + 1) * 2.0944, ax = Math.cos(a) * 1.2, ay = Math.sin(a) * 1.2, bx = Math.cos(b) * 1.2, by = Math.sin(b) * 1.2, dx = bx - ax, dy = by - ay; arrow(ax + dx * 0.12, ay + dy * 0.12, bx - dx * 0.04, by - dy * 0.04, 0, gr, 0.36); } shine(-0.5, 0.95, 0.25, 0.08, 0.4, 0.5); });
      act(v => { rg.rotation.z = -v * 6.2832; rg.scale.setScalar(1 + 0.3 * Math.sin(v * PI)); }); },
    stirrer() { const shell = M(0xe6f1f8, 0.2), body = M(0x6f7f95, 0.5); box(2.3, 0.5, 1.9, body, 0, 0.25, 0); cyl(0.9, 0.9, 0.08, white, 0, 0.54, -0.1); cyl(0.26, 0.26, 0.16, dark, -0.5, 0.26, 0.98, [H, 0, 0]); box(0.05, 0.2, 0.04, white, -0.5, 0.33, 1.07); cyl(0.09, 0.09, 0.06, red, 0.55, 0.26, 0.97, [H, 0, 0]); cyl(0.55, 0.5, 0.95, shell, 0, 1.06, -0.1); cyl(0.56, 0.51, 0.55, liq, 0, 0.87, -0.1); tor(0.3, 0.045, white, 0, 1.16, -0.1, [H, 0, 0], PI * 1.5); cyl(0.07, 0.07, 0.5, white, 0, 0.66, 0.42, [0, 0, H]); },
    cards() { const tin = M(0x2f8a6a, 0.6), tabs = [red, M(0xf2c41a, 0.6), M(0x2f6fd0, 0.6)]; box(1.9, 0.9, 1.1, tin, 0, 0.45, 0); box(1.7, 0.1, 0.9, dark, 0, 0.9, 0).userData.plain = true; [-0.32, -0.1, 0.12, 0.34].forEach((z, k) => { box(1.6, 1.0, 0.05, paper, 0, 1.15 + (k % 2) * 0.05, z, [0.12, 0, 0]); if (k < 3) box(0.4, 0.22, 0.06, tabs[k], -0.5 + k * 0.5, 1.75 + (k % 2) * 0.05, z + 0.08, [0.12, 0, 0]); }); [0.2, 0.0].forEach(q => box(1.2, 0.03, 0.02, dark, 0, 1.3 + q, 0.4, [0.12, 0, 0]).userData.plain = true); box(0.5, 0.2, 0.04, paper, 0, 0.45, 0.57); },
    logbook() { const cov = M(0x1d1c1c, 0.7), pencil = M(0xf2c41a, 0.5); box(1.7, 2.2, 0.36, cov, 0, 1.2, 0); box(1.62, 2.1, 0.3, paper, 0.08, 1.2, 0); box(1.7, 2.2, 0.05, cov, 0, 1.2, 0.19); box(0.26, 2.22, 0.42, red, -0.74, 1.2, 0); [[-0.3, 2.0], [0.4, 1.9], [0.55, 1.1], [-0.2, 0.5], [0.35, 0.4], [-0.45, 1.0], [0.1, 0.75], [0.6, 0.6], [0.2, 2.1], [-0.4, 0.25]].forEach(q => sph(0.05, white, q[0], q[1], 0.22, [1.4, 1, 0.3]).userData.plain = true); box(1.0, 0.6, 0.03, white, 0.1, 1.5, 0.22).userData.plain = true; [1.62, 1.44].forEach(y => box(0.8, 0.04, 0.02, dark, 0.1, y, 0.24).userData.plain = true); rod([0.95, 0.12, 0.5], [-0.6, 0.12, 0.75], 0.07, pencil); put(new T.CylinderGeometry(0, 0.07, 0.2, 8), wood, -0.7, 0.12, 0.77, [0, 0, H], null); },
    // seed crystal: a cluster of blue crystals in a dish; in use (1) it has grown
    // seed crystal: a seed in a dish; in use (0 to 1) it grows into a big cluster that overflows the dish
    crystal() { const c = M(0x3a6fd0, 0.2), dish = M(0x8d949c, 0.5);
      cyl(0.9, 0.7, 0.2, dish, 0, 0.1, 0, null, 24); const cg = pivot(0, 0.2, 0);
      [[0, 0, 1.0, 0], [-0.6, 0.2, 0.65, 0.35], [0.6, -0.1, 0.6, -0.4], [0.2, 0.55, 0.42, 0.15], [-0.3, -0.5, 0.5, -0.2]].forEach(q => { const g2 = new T.Group(); g2.position.set(q[0], 0, q[1]); g2.rotation.z = q[3]; cg.add(g2); const h = q[2] * 1.5, r = 0.3 * q[2] + 0.1; into(g2, () => { cyl(r, r, h, c, 0, h / 2, 0, null, 6); put(new T.ConeGeometry(r, r * 1.2, 6), c, 0, h + r * 0.6, 0); }); });
      into(cg, () => shine(-0.14, 1.0, 0.3, 0.07, 0.6, 0.0)); act(v => cg.scale.set(0.35 + 1.0 * v, 0.35 + 1.5 * v, 0.35 + 1.0 * v)); },
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
    // litmus paper: one long paper strip dipped in a beaker, blue where it is wet and red above it
    litmus() { const gl = M(0xdfe9ee, 0.1, 0, { transparent: true, opacity: 0.4, op: 0.4 }), bl = M(0x3a6fd0, 0.3), rd = M(0xd6453a, 0.5);
      cyl(0.9, 0.9, 1.7, gl, 0, 0.85, 0, null, 24); cyl(0.84, 0.84, 1.0, bl, 0, 0.55, 0, null, 24);
      const st = pivot(0.25, 0.1, 0); st.rotation.z = -0.2; into(st, () => { box(0.6, 1.5, 0.1, bl, 0, 0.75, 0); box(0.6, 1.7, 0.1, rd, 0, 2.35, 0); box(0.04, 0.25, 0.02, M(0xffffff, 0.2), -0.18, 2.9, 0.06).userData.plain = true; });
      drop(-1.35, 1.2, 0, 0.18, bl); },
    stopwatch() { cyl(0.95, 0.95, 0.28, steel, 0, 0.14, 0); cyl(0.8, 0.8, 0.02, white, 0, 0.29, 0); box(0.06, 0.03, 0.6, red, 0, 0.31, -0.28); box(0.35, 0.03, 0.05, black, 0.16, 0.31, 0); cyl(0.06, 0.06, 0.04, black, 0, 0.32, 0); cyl(0.16, 0.16, 0.35, steel, 0, 0.14, -1.1, [H, 0, 0]); tor(0.22, 0.05, steel, 0, 0.14, -1.45, [H, 0, 0]); },
    thermometer() { box(1.2, 0.18, 0.75, wood, 0, 0.09, 0); box(0.66, 2.9, 0.1, paper, 0, 1.62, -0.1); cyl(0.1, 0.1, 2.4, glass, 0, 1.78, 0.04); cyl(0.065, 0.065, 1.25, red, 0, 1.2, 0.04); sph(0.21, red, 0, 0.5, 0.04); for (let k = 0; k < 6; k++) box(k % 2 ? 0.13 : 0.22, 0.035, 0.03, dark, 0.2, 0.95 + k * 0.32, -0.03); },
    // carousel: five fat tubes of colored liquid on a turntable, a round arrow over them
    carousel() { const gl = M(0xdfe9ee, 0.1, 0, { transparent: true, opacity: 0.4, op: 0.4 }), cs = [M(0xd6453a, 0.3), M(0x3a6fd0, 0.3), M(0x3c9a5f, 0.3), M(0xf0b93a, 0.3), M(0xb0189a, 0.3)];
      cyl(0.4, 0.8, 0.4, dark, 0, 0.2, 0); cyl(1.6, 1.6, 0.16, steel, 0, 0.5, 0, null, 28); cyl(0.14, 0.14, 2.4, steel, 0, 1.7, 0);
      cs.forEach((m, k) => { const a = k * 1.2566, x = Math.cos(a) * 1.05, z = Math.sin(a) * 1.05; cyl(0.32, 0.32, 1.7, gl, x, 1.45, z); cyl(0.26, 0.26, 1.1, m, x, 1.1, z); cyl(0.36, 0.36, 0.2, m, x, 2.35, z); });
      tor(1.1, 0.09, M(0xf4efe0, 0.5), 0, 3.0, 0, [H, 0, 0], PI * 1.5); put(new T.ConeGeometry(0.25, 0.5, 8), M(0xf4efe0, 0.5), 0, 3.0, -1.1, [0, 0, -H]); },
    dropper() { const amber = M(0x7a4a1e, 0.2, 0, { transparent: true, opacity: 0.82 }); cyl(0.56, 0.56, 1.0, amber, 0, 0.5, 0); cyl(0.27, 0.56, 0.32, amber, 0, 1.16, 0); cyl(0.31, 0.31, 0.24, black, 0, 1.44, 0); sph(0.28, red, 0, 1.9, 0, [1, 1.7, 1]); cyl(0.05, 0.05, 1.1, glass, 0, 0.75, 0); box(0.66, 0.44, 0.03, paper, 0, 0.5, 0.56); },
    loupe() { tor(0.75, 0.1, brass, -0.3, 0.2, 0, [H, 0, 0]); cyl(0.72, 0.72, 0.06, glass, -0.3, 0.2, 0); rod([0.35, 0.2, 0.3], [1.5, 0.2, 0.95], 0.13, wood); },
    // timer: a wind-up alarm clock, red, with two bells on top and a hammer between them
    timer() { const bd = M(0xd6453a, 0.4), fc = M(0xf4efe0, 0.5), bs = M(0xf0b93a, 0.3, 0.8);
      side.forEach(q => { rod([q * 0.65, 0.55, 0], [q * 0.85, 0.06, 0], 0.1, black); sph(0.12, black, q * 0.85, 0.05, 0, [1, 0.5, 1]); });
      cyl(1.05, 1.05, 0.55, bd, 0, 1.65, 0, [H, 0, 0], 28); cyl(0.84, 0.84, 0.05, fc, 0, 1.65, 0.3, [H, 0, 0], 28).userData.plain = true;
      [[0, 2.35], [0, 0.95], [0.7, 1.65], [-0.7, 1.65]].forEach(q => box(0.07, 0.2, 0.03, black, q[0], q[1], 0.35, [0, 0, q[1] === 1.65 ? H : 0]).userData.plain = true);
      box(0.08, 0.6, 0.04, black, 0, 1.95, 0.36).userData.plain = true; box(0.4, 0.08, 0.04, black, 0.18, 1.65, 0.36, [0, 0, 0.4]).userData.plain = true; sph(0.08, black, 0, 1.65, 0.38).userData.plain = true;
      side.forEach(q => { sph(0.42, bs, q * 0.65, 2.65, 0, [1, 0.75, 1]); rod([q * 0.65, 2.4, 0], [q * 0.5, 2.15, 0], 0.07, black); }); rod([0, 2.85, 0], [0, 3.1, 0], 0.07, black); sph(0.12, black, 0, 3.15, 0); },
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
    // aqua regia: an orange bottle that tips and drips on a gold bar and eats it from one end; in use (0 to 1) it pours and the bar shrinks
    regia() { const gl = M(0xdfe9ee, 0.1, 0, { transparent: true, opacity: 0.4, op: 0.4 }), or = M(0xe0801a, 0.3, 0, { exact: 1 }), gd = M(0xf0b93a, 0.3, 0.6), cr = M(0xf4efe0, 0.5), ck = M(0xc9a36a, 0.8, 0, { exact: 1 });
      const bt = pivot(-1.0, 0.1, 0); into(bt, () => { cyl(0.72, 0.72, 1.5, gl, 0, 0.75, 0); cyl(0.66, 0.66, 1.0, or, 0, 0.55, 0); cyl(0.26, 0.7, 0.4, gl, 0, 1.7, 0); cyl(0.24, 0.24, 0.4, gl, 0, 2.1, 0); cyl(0.3, 0.26, 0.3, ck, 0, 2.4, 0);
        box(0.7, 0.55, 0.05, cr, 0, 0.8, 0.74).userData.plain = true; sph(0.15, black, 0, 0.9, 0.78).userData.plain = true; [0.6, -0.6].forEach(r => box(0.5, 0.05, 0.02, black, 0, 0.6, 0.78, [0, 0, r]).userData.plain = true); });
      const gb = pivot(0.4, 0, 0.3); into(gb, () => put(new T.CylinderGeometry(0.4, 0.62, 0.55, 4).rotateY(PI / 4), gd, 0.95, 0.35, 0, [0, 0, 0], [2.0, 1.3, 1.2]));
      const bub = [pivot(0, 0, 0)]; into(bub[0], () => [0, 1, 2].forEach(k => sph(0.2 + k * 0.04, cr, 1.9 + k * 0.1, 0.7 + k * 0.45, 0.3))); const dp = drop(-0.2, 3.0, 0.3, 0.22, or);
      act(v => { bt.rotation.z = -0.8 * v; gb.scale.x = 1 - 0.5 * v; dp.visible = v > 0.12 && v < 0.95; dp.position.set(-0.4 + 2.3 * v, 2.6 - 2.2 * v * v, 0.3); bub.forEach(b => { b.visible = v > 0.35; }); }); },
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
    // methanol, CH3OH, standing on its three hydrogens; in use (0 to 1) the OH leaves the carbon and goes off to put itself on the molecule
    methanol() { const C = M(0x5b667d, 0.5, 0, { exact: 1 }), O = M(0xff4d4d, 0.5, 0, { exact: 1 }), Hh = M(0xf1f5f9, 0.5, 0, { exact: 1 }), st = M(0xdad4c0, 0.6, 0, { exact: 1 });
      cyl(1.2, 1.3, 0.1, wood, 0, 0.05, 0, null, 28); const c = [0, 1.25, 0];
      [0, 1, 2].forEach(k => { const a = k * 2.094 + 0.3, h = [Math.cos(a) * 0.85, 0.4, Math.sin(a) * 0.85]; rod(c, h, 0.07, st); sph(0.26, Hh, h[0], h[1], h[2]); });
      sph(0.42, C, c[0], c[1], c[2]); const oh = pivot(0, 0, 0); const o = [0, 2.3, 0.1]; into(oh, () => { rod(c, o, 0.07, st); sph(0.4, O, o[0], o[1], o[2]); rod(o, [0.55, 2.6, 0.2], 0.07, st); sph(0.25, Hh, 0.55, 2.6, 0.2); });
      shine(-0.15, 1.45, 0.38, 0.08, 0.3, 0.4); act(v => oh.position.set(v * 1.6, v * 0.7, v * 0.5)); },
    // ethylene, C2H4: a flat molecule standing up with the double bond across it
    // ethylene, C2H4: a flat molecule standing up with the double bond across it; in use (0 to 1) the double bond opens, one bond lifting off the other
    ethylene() { const C = M(0x5b667d, 0.5, 0, { exact: 1 }), Hh = M(0xf1f5f9, 0.5, 0, { exact: 1 }), st = M(0xdad4c0, 0.6, 0, { exact: 1 });
      cyl(1.2, 1.3, 0.1, wood, 0, 0.05, 0, null, 28); const a = [-0.72, 1.2, 0], b = [0.72, 1.2, 0];
      const tp = pivot(0, 0, 0), bt = pivot(0, 0, 0); into(tp, () => rod([a[0], a[1] + 0.07, 0], [b[0], b[1] + 0.07, 0], 0.05, st)); into(bt, () => rod([a[0], a[1] - 0.07, 0], [b[0], b[1] - 0.07, 0], 0.05, st));
      [[-1.3, 0.45], [-1.3, 1.95], [1.3, 0.45], [1.3, 1.95]].forEach(q => { rod(q[0] < 0 ? a : b, [q[0], q[1], 0], 0.07, st); sph(0.26, Hh, q[0], q[1], 0); });
      sph(0.42, C, a[0], a[1], 0); sph(0.42, C, b[0], b[1], 0); shine(-0.8, 1.4, 0.38, 0.08, 0.3, 0.4); act(v => { tp.position.set(0, 0.7 * v, 0.1 * v); tp.rotation.z = 0.0; bt.position.y = -0.1 * v; }); },
    // recycler: three arrows chasing each other round a triangle on a stand; in use (1) it has turned a third of the way round
    // cannula: two round flasks bridged by a long steel needle in an arch; in use (0 to 1) a drop runs along it from the left flask to the right
    // runoff: what comes off the molecule, one bold shape each
    ro_water() { const bl = M(0x3a6fd0, 0.3); sph(0.7, bl, 0, 0.7, 0); put(new T.ConeGeometry(0.58, 1.3, 14), bl, 0, 1.75, 0); box(0.14, 0.5, 0.02, M(0xffffff, 0.2), -0.28, 0.85, 0.66, [0, 0, 0.3]).userData.plain = true; },
    ro_h2() { const w = M(0xf4efe0, 0.4), st = M(0x2b2622, 0.5); rod([-0.55, 0.9, 0], [0.55, 0.6, 0], 0.16, st); sph(0.52, w, -0.6, 0.92, 0); sph(0.52, w, 0.6, 0.58, 0); },
    ro_co2() { const o = M(0xd6453a, 0.4), c = M(0x5b667d, 0.5, 0, { exact: 1 }), st = M(0x2b2622, 0.5); rod([-1.3, 0.5, 0], [1.3, 0.5, 0], 0.14, st); sph(0.48, o, -1.3, 0.5, 0); sph(0.48, o, 1.3, 0.5, 0); sph(0.56, c, 0, 0.5, 0); },
    ro_acid() { const g = M(0x3c9a5f, 0.3); [[-0.5, 0.45, 0.45], [0.2, 0.75, 0.5], [-0.3, 1.2, 0.42], [0.35, 1.6, 0.32], [-0.1, 2.0, 0.24]].forEach(q => sph(q[2], g, q[0], q[1], 0)); box(0.12, 0.4, 0.02, M(0xffffff, 0.2), -0.7, 0.55, 0.42, [0, 0, 0.4]).userData.plain = true; },
    ro_nh3() { const p = M(0xdfe0b0, 0.5, 0, { exact: 1 }); [[-0.55, 0.5, 0.5], [0.45, 0.55, 0.55], [-0.05, 1.05, 0.55], [0.7, 1.15, 0.35]].forEach(q => sph(q[2], p, q[0], q[1], 0)); [-0.4, 0.2].forEach(x => rod([x, 1.9, 0], [x + 0.25, 2.4, 0], 0.07, M(0x2b2622, 0.5))); },
    ro_sulfur() { const y = M(0xf0b93a, 0.5); put(new T.DodecahedronGeometry(0.8, 0), y, 0, 0.8, 0, [0.3, 0.4, 0.1]); put(new T.DodecahedronGeometry(0.34, 0), y, 0.95, 0.3, 0.3, [0.5, 0.2, 0.3]); },
    // the four marks of the yield track, each a flag on a pole: stable (blue, plain), unstable (yellow, saw edge), volatile (red, a flame), overreact (black, a hot center, a second flag)
    mark_stable() { markFlag(0, true); },
    mark_unstable() { markFlag(1, true); },
    mark_volatile() { markFlag(2, true); },
    mark_overreact() { markFlag(3, true); },
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
    // elixir: a round flask of glowing yellow with a cork and sparkles
    elixir() { const gl = M(0xdfe9ee, 0.1, 0, { transparent: true, opacity: 0.4, op: 0.4 }), yl = M(0xf0b93a, 0.3, 0, { emissive: new T.Color(0x6a4a10) }), ck = M(0xc9a36a, 0.8, 0, { exact: 1 }), sp = M(0xf4efe0, 0.4);
      sph(1.05, gl, 0, 1.05, 0); sph(0.95, yl, 0, 0.95, 0, [1, 0.85, 1]); cyl(0.3, 0.38, 0.8, gl, 0, 2.3, 0); cyl(0.34, 0.28, 0.4, ck, 0, 2.9, 0); tor(0.7, 0.09, brass, 0, 0.12, 0, [H, 0, 0]);
      [[-1.2, 2.6], [1.25, 2.0], [0.9, 3.1]].forEach(q => { box(0.5, 0.1, 0.05, sp, q[0], q[1], 0.2).userData.plain = true; box(0.1, 0.5, 0.05, sp, q[0], q[1], 0.2).userData.plain = true; }); shine(-0.5, 1.3, 1.0, 0.1, 0.5, 0.4); },
    // tower: a stone tower with a crown of battlements and a bolt of lightning; in use (0 to 1) the bolt strikes, a crack opens and the top slides off
    tower() { const st = M(0x8d949c, 0.8), cr = M(0xd6453a, 0.5), bolt = M(0xf0b93a, 0.4, 0, { emissive: new T.Color(0x806010) });
      cyl(1.3, 1.4, 0.2, dark, 0, 0.1, 0, null, 20); cyl(0.85, 1.0, 2.0, st, 0, 1.2, 0, null, 14); box(0.3, 0.5, 0.05, black, 0.0, 1.0, 0.95).userData.plain = true;
      const tp = pivot(0, 2.2, 0); into(tp, () => { cyl(1.0, 0.85, 0.5, st, 0, 0.25, 0, null, 14); for (let k = 0; k < 6; k++) { const a = k * 1.047; box(0.3, 0.35, 0.3, st, Math.cos(a) * 0.85, 0.65, Math.sin(a) * 0.85); } cyl(0.06, 0.06, 0.9, black, 0, 1.0, 0); box(0.5, 0.3, 0.04, cr, 0.25, 1.3, 0); });
      const cr2 = pivot(0, 0, 0); into(cr2, () => { [[-0.1, 1.9], [0.15, 1.6], [-0.1, 1.3]].forEach((q, i) => box(0.1, 0.4, 0.06, black, q[0], q[1], 0.98, [0, 0, i % 2 ? 0.5 : -0.5]).userData.plain = true); });
      const bg = pivot(0, 0, 0); into(bg, () => { [[1.8, 3.9], [1.2, 3.3], [1.5, 3.0], [0.8, 2.3]].forEach((q, i, A) => { if (i < 3) rod([q[0], q[1], 0.9], [A[i + 1][0], A[i + 1][1], 0.9], 0.12, bolt); }); });
      act(v => { tp.position.x = 0.7 * v; tp.position.y = 2.2 + 0.15 * v; tp.rotation.z = -0.45 * v; bg.visible = v > 0.05 && v < 0.75; cr2.visible = v > 0.3; }); },
    duck() { const yel = M(0xf2c41a, 0.35), deep = M(0xe0a80e, 0.4), bill = M(0xf07a12, 0.4); sph(0.8, yel, -0.05, 0.62, 0, [1.2, 0.78, 1]); sph(0.32, yel, -0.95, 0.95, 0, [1, 0.7, 0.8]); sph(0.4, deep, -0.15, 0.72, 0.62, [1.25, 0.6, 0.4]); sph(0.5, yel, 0.5, 1.45, 0); sph(0.22, bill, 1.02, 1.36, 0, [1.3, 0.42, 1.1]); sph(0.075, black, 0.72, 1.62, 0.4).userData.plain = true; sph(0.03, white, 0.74, 1.65, 0.46).userData.plain = true; },
    cat() { const fur = M(0x1d1c1c, 0.6), eye = glow(0xd6e21c), pink = M(0xe8829a, 0.5); sph(0.62, fur, 0, 0.75, 0, [0.9, 1.2, 0.8]); sph(0.46, fur, 0, 1.75, 0.08, [1.05, 0.92, 0.9]); side.forEach(q => { put(new T.CylinderGeometry(0, 0.2, 0.42, 4), fur, q * 0.28, 2.24, 0.08, [0, PI / 4, q * -0.2]); sph(0.17, fur, q * 0.22, 0.14, 0.42, [1, 0.7, 1.2]); sph(0.1, eye, q * 0.18, 1.8, 0.44, [1, 1, 0.4]).userData.plain = true; box(0.03, 0.16, 0.02, black, q * 0.18, 1.8, 0.5).userData.plain = true; [0.08, -0.06].forEach(w => rod([q * 0.1, 1.62, 0.48], [q * 0.62, 1.62 + w, 0.4], 0.012, white).userData.plain = true); }); sph(0.045, pink, 0, 1.66, 0.5).userData.plain = true; { const tp = k => [0.4 + 0.75 * Math.sin(k / 7 * 2.5), 0.2 + 1.35 * Math.pow(k / 7, 1.3), 0]; for (let k = 0; k < 7; k++) { rod(tp(k), tp(k + 1), 0.1 - k * 0.004, fur); sph(0.1 - k * 0.004, fur, tp(k + 1)[0], tp(k + 1)[1], 0); } } },
    // monkey's paw: a withered brown hand on a wooden foot; in use the fingers curl one at a time, thumb first (s 0.2 per finger)
    // monkey's paw: a thin dried paw curled on a little stand; in use (0 to 1) the fingers close one at a time, thumb first (0.2 each)
    paw() { const fur = M(0x8a5a2b, 0.95), claw = M(0x2c2f34, 0.4), cord = M(0xf4efe0, 0.6);
      cyl(0.7, 0.8, 0.14, wood, 0, 0.07, 0, null, 20); cyl(0.12, 0.12, 0.9, wood, 0, 0.55, 0); cyl(0.2, 0.15, 0.7, fur, 0, 1.2, 0); sph(0.45, fur, 0, 1.65, 0, [1, 0.85, 0.6]); rod([0.1, 1.3, 0.2], [0.1, 0.8, 0.2], 0.03, cord);
      const fing = [[-0.45, 1.6, 1.0, 0.45, 0.65], [-0.2, 1.9, 1.3, 0.1, 0.8], [0.03, 1.95, 1.45, 0, 0.9], [0.25, 1.9, 1.3, -0.1, 0.8], [0.42, 1.75, 0.9, -0.3, 0.6]].map((q, i) => {
        const g = pivot(q[0], q[1], 0); g.rotation.z = i === 0 ? 0.9 : q[3]; const g2 = new T.Group();
        into(g, () => { const l = q[2] * 0.5; rod([0, 0, 0], [0, l, 0], 0.075, fur); sph(0.085, fur, 0, l, 0); g2.position.set(0, l, 0); g.add(g2); });
        into(g2, () => { const l = q[2] * 0.45; rod([0, 0, 0], [0, l, 0], 0.065, fur); put(new T.ConeGeometry(0.07, 0.25, 6), claw, 0, l + 0.1, 0); }); return { g, g2, z: g.rotation.z, b: q[4] }; });
      act(v => fing.forEach((f, i) => { const t = cl(v * 5 - i, 0, 1), c = f.b + (1 - f.b) * t; f.g.rotation.x = c * 1.5; f.g2.rotation.x = c * 1.8; f.g.rotation.z = f.z * (1 - c * 0.6); })); },
    // idol: a golden seated idol with a crown and two red gem eyes on a stone block
    idol() { const gd = M(0xf0b93a, 0.3, 0.7), rd = M(0xd6453a, 0.3, 0, { emissive: new T.Color(0x7a1a10) }), st = M(0x8d949c, 0.8), dk = M(0x6b4a10, 0.5, 0, { exact: 1 });
      box(2.0, 0.5, 1.6, st, 0, 0.25, 0); box(1.4, 0.7, 1.0, gd, 0, 0.85, 0); box(1.2, 1.1, 0.8, gd, 0, 1.75, 0); box(0.95, 0.9, 0.8, gd, 0, 2.7, 0); box(1.15, 0.2, 0.9, dk, 0, 3.25, 0);
      [-0.35, 0, 0.35].forEach((x, i) => put(new T.ConeGeometry(0.16, 0.55 + (i === 1 ? 0.3 : 0), 4), gd, x, 3.55 + (i === 1 ? 0.12 : 0), 0));
      side.forEach(q => { box(0.35, 1.0, 0.4, gd, q * 0.85, 1.55, 0.1); box(0.4, 0.3, 0.5, gd, q * 0.85, 0.95, 0.35); sph(0.12, rd, q * 0.25, 2.8, 0.42).userData.plain = true; });
      box(0.3, 0.12, 0.05, dk, 0, 2.35, 0.42).userData.plain = true; box(0.2, 0.35, 0.1, gd, 0, 2.6, 0.45); shine(-0.5, 2.0, 0.42, 0.1, 0.5, 0.0); },
    grimoire() { const cover = M(0x8a1626, 0.7), eye = glow(0xd6e21c); box(1.7, 2.3, 0.5, cover, 0, 1.25, 0); box(1.62, 2.2, 0.42, paper, 0.08, 1.25, 0); box(1.7, 2.3, 0.07, cover, 0, 1.25, 0.26); box(0.16, 2.32, 0.56, M(0x5c0e18, 0.7), -0.8, 1.25, 0); tor(0.5, 0.05, gold, 0, 1.4, 0.31); sph(0.2, eye, 0, 1.4, 0.3, [1.5, 0.8, 0.4]).userData.plain = true; box(0.06, 0.24, 0.02, black, 0, 1.4, 0.39).userData.plain = true; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(q => box(0.3, 0.3, 0.09, gold, q[0] * 0.71, 1.25 + q[1] * 1.01, 0.27)); box(0.34, 0.22, 0.1, brass, 0.86, 1.25, 0.24); box(0.12, 0.5, 0.03, red, 0.3, 0.02, 0.1); },
    hourglass() { const shell = M(0xbfe3f2, 0.12, 0, { transparent: true, opacity: 0.75 }), sand = M(0x8f8a80, 0.95), dk = M(0x3a2a1e, 0.7); cyl(0.68, 0.68, 0.16, dk, 0, 0.08, 0); cyl(0.68, 0.68, 0.16, dk, 0, 2.4, 0); [0.5, 2.6, 4.7].forEach(an => cyl(0.05, 0.05, 2.3, dk, Math.cos(an) * 0.58, 1.24, Math.sin(an) * 0.58)); cyl(0.5, 0.06, 1.0, shell, 0, 1.8, 0); cyl(0.06, 0.5, 1.0, shell, 0, 0.7, 0); cyl(0.3, 0.51, 0.42, sand, 0, 0.4, 0).userData.plain = true; cyl(0.3, 0.13, 0.36, sand, 0, 1.6, 0).userData.plain = true; cyl(0.025, 0.025, 0.7, sand, 0, 1.0, 0).userData.plain = true; box(0.34, 0.07, 0.07, white, 0, 2.6, 0); box(0.07, 0.5, 0.07, white, 0, 2.72, 0); },
    poster() { const sky = M(0x9fd0f0, 0.8), fur = M(0xf08a1c, 0.8), pin = M(0xd8202c, 0.4); box(2.0, 2.6, 0.04, white, 0, 1.4, 0); box(1.7, 1.75, 0.02, sky, 0, 1.7, 0.03).userData.plain = true; rod([-0.85, 2.3, 0.06], [0.85, 2.2, 0.06], 0.07, wood); sph(0.3, fur, 0, 1.45, 0.07, [0.85, 1.5, 0.3]); sph(0.27, fur, 0, 1.98, 0.09, [1.1, 0.95, 0.4]); side.forEach(q => { rod([q * 0.2, 1.75, 0.08], [q * 0.26, 2.26, 0.08], 0.06, fur); put(new T.CylinderGeometry(0, 0.1, 0.2, 4), fur, q * 0.2, 2.22, 0.14, [0, PI / 4, 0]).userData.plain = true; sph(0.035, black, q * 0.1, 2.0, 0.2).userData.plain = true; rod([q * 0.12, 1.1, 0.08], [q * 0.16, 0.92, 0.08], 0.05, fur); sph(0.08, pin, q * 0.85, 2.58, 0.08); }); rod([0.2, 1.15, 0.08], [0.45, 1.3, 0.08], 0.04, fur); box(1.3, 0.16, 0.02, black, 0, 0.6, 0.03).userData.plain = true; box(0.8, 0.07, 0.02, black, 0, 0.36, 0.03).userData.plain = true; },
    coffee() { const brew = M(0x3a2110, 0.4); cyl(0.85, 0.85, 0.06, wood, 0, 0.03, 0); cyl(0.62, 0.52, 1.1, white, 0, 0.62, 0); cyl(0.55, 0.55, 0.04, brew, 0, 1.17, 0).userData.plain = true; tor(0.32, 0.09, white, 0.66, 0.62, 0); tor(0.585, 0.045, red, 0, 0.8, 0, [H, 0, 0]); sph(0.09, brew, -0.3, 0.9, 0.5, [1, 2.2, 0.4]).userData.plain = true; [-0.25, 0.05, 0.3].forEach((q, k) => { rod([q, 1.4, 0], [q + 0.12, 1.7, 0], 0.03, white); rod([q + 0.12, 1.7, 0], [q - 0.04, 2.0 + k * 0.1, 0], 0.03, white); }); },
    coat() { const tag = M(0x2f6fd0, 0.6); rod([-0.75, 2.3, 0], [0, 2.62, 0], 0.045, wood); rod([0.75, 2.3, 0], [0, 2.62, 0], 0.045, wood); tor(0.15, 0.03, steel, 0, 2.86, 0, null, PI * 1.5); box(1.5, 2.0, 0.42, white, 0, 1.25, 0); side.forEach(q => { rod([q * 0.72, 2.12, 0], [q * 1.12, 0.95, 0], 0.2, white); box(0.06, 0.85, 0.02, dark, q * 0.2, 1.85, 0.22, [0, 0, q * 0.42]).userData.plain = true; }); box(0.03, 1.2, 0.02, dark, 0, 0.9, 0.22).userData.plain = true; [1.3, 0.95, 0.6].forEach(y => sph(0.05, dark, 0.09, y, 0.22).userData.plain = true); box(0.46, 0.24, 0.03, tag, 0.42, 1.6, 0.22).userData.plain = true; box(0.3, 0.04, 0.02, white, 0.42, 1.6, 0.24).userData.plain = true; box(0.42, 0.36, 0.03, M(0xd9dde2, 0.8), -0.42, 0.75, 0.22); [-0.52, -0.4].forEach((x, k) => cyl(0.03, 0.03, 0.3, k ? red : tag, x, 1.0, 0.24)); },
    milk() { const band = M(0x2f6fd0, 0.6), rot = glow(0x7fc41c); box(0.95, 1.5, 0.95, white, 0, 0.75, 0); box(0.97, 0.45, 0.97, band, 0, 0.62, 0); box(0.95, 0.62, 0.06, white, 0, 1.72, 0.2, [-0.62, 0, 0]); box(0.95, 0.62, 0.06, white, 0, 1.72, -0.2, [0.62, 0, 0]); box(0.95, 0.2, 0.07, white, 0, 2.05, 0); sph(0.24, rot, 0.25, 2.12, 0.05, [1.3, 0.7, 1]); sph(0.13, rot, 0.3, 1.75, 0.42, [1, 2.2, 0.5]).userData.plain = true; sph(0.1, rot, 0.34, 1.3, 0.5, [1, 2.4, 0.5]).userData.plain = true; sph(0.09, rot, 0.05, 1.6, 0.44, [1, 1.6, 0.5]).userData.plain = true; sph(0.5, rot, 0.55, 0.03, 0.45, [1.2, 0.08, 0.8]); sph(0.28, rot, -0.2, 0.03, 0.7, [1.2, 0.1, 0.8]); },
    // mystery bottle: a plain brown bottle under a glowing question mark
    mystery() { const br = M(0x8a5a2b, 0.3), qm = M(0xb0189a, 0.4, 0, { emissive: new T.Color(0x601055) }), cap = M(0x2c2f34, 0.5);
      cyl(0.65, 0.65, 1.3, br, 0, 0.65, 0); cyl(0.28, 0.65, 0.45, br, 0, 1.5, 0); cyl(0.28, 0.28, 0.35, br, 0, 1.9, 0); cyl(0.34, 0.34, 0.28, cap, 0, 2.2, 0); shine(-0.4, 0.9, 0.62, 0.08, 0.6, 0);
      put(new T.TorusGeometry(0.42, 0.11, 8, 24, PI * 1.4), qm, 0, 3.5, 0, [0, PI, -0.17]); rod([0.2, 3.1, 0], [0, 2.85, 0], 0.11, qm); sph(0.12, qm, 0, 2.6, 0); },
    raven() { const fea = M(0x1d1c1c, 0.5), bk = M(0x55514a, 0.4), pill = M(0x2f6fd0, 0.4); cyl(0.6, 0.7, 0.14, wood, 0, 0.07, 0); cyl(0.06, 0.06, 1.0, wood, 0, 0.6, 0); rod([-0.7, 1.1, 0], [0.7, 1.1, 0], 0.07, wood); sph(0.5, fea, -0.05, 1.75, 0, [1.25, 0.85, 0.8]).rotation.z = 0.5; sph(0.34, fea, 0.42, 2.25, 0); put(new T.CylinderGeometry(0, 0.16, 0.6, 6), bk, 0.9, 2.2, 0, [0, 0, -H - 0.15]); box(0.9, 0.12, 0.4, fea, -0.75, 1.42, 0, [0, 0, 0.5]); sph(0.06, white, 0.52, 2.34, 0.28).userData.plain = true; sph(0.03, black, 0.54, 2.34, 0.33).userData.plain = true; side.forEach(q => rod([q * 0.15, 1.45, 0.1], [q * 0.15, 1.16, 0.1], 0.035, bk)); sph(0.11, pill, 1.18, 2.12, 0, [1.4, 0.8, 0.8]); },
    // hand of glory: a grey severed hand on a plate, a lit candle on every finger
    glory() { const hd = M(0xbdb59d, 0.8, 0, { exact: 1 }), wax = M(0xf4efe0, 0.8), fl = M(0xf0b93a, 0.4, 0, { emissive: new T.Color(0x806010) });
      cyl(0.95, 1.05, 0.14, dark, 0, 0.07, 0, null, 24); cyl(0.32, 0.4, 0.7, hd, 0, 0.5, 0); sph(0.72, hd, 0, 1.2, 0, [1, 0.85, 0.55]);
      [[-0.55, 1.45, -0.7, 2.2], [-0.27, 1.6, -0.32, 2.5], [0, 1.65, 0, 2.6], [0.27, 1.6, 0.35, 2.45], [0.6, 1.4, 1.0, 1.9]].forEach(q => { rod([q[0], q[1], 0], [q[2], q[3], 0], 0.13, hd); sph(0.13, hd, q[2], q[3], 0); cyl(0.1, 0.1, 0.45, wax, q[2], q[3] + 0.3, 0); sph(0.1, fl, q[2], q[3] + 0.68, 0, [0.8, 1.5, 0.8]).userData.plain = true; });
      shine(-0.3, 1.3, 0.38, 0.1, 0.4, 0.2); },
    goggles() { const skin = M(0xe2b48c, 0.8), lens = M(0x8fd0f0, 0.15), strap = M(0x1d1c1c, 0.6); cyl(0.55, 0.65, 0.14, wood, 0, 0.07, 0); cyl(0.2, 0.24, 0.5, skin, 0, 0.38, 0); sph(0.72, skin, 0, 1.3, 0, [0.92, 1.1, 0.95]); side.forEach(q => { sph(0.06, black, q * 0.25, 1.22, 0.64).userData.plain = true; cyl(0.25, 0.25, 0.16, strap, q * 0.27, 1.82, 0.5, [H - 0.45, 0, 0], 20); cyl(0.19, 0.19, 0.18, lens, q * 0.27, 1.83, 0.52, [H - 0.45, 0, 0], 20).userData.plain = true; }); tor(0.66, 0.06, strap, 0, 1.75, 0, [H + 0.25, 0, 0]); box(0.14, 0.1, 0.1, strap, 0, 1.84, 0.56); },
    grant() { const stamp = M(0xd8202c, 0.6); box(1.3, 0.2, 0.6, wood, 0, 0.1, 0); box(1.7, 2.3, 0.05, paper, 0.1, 1.4, -0.08, [0, 0, -0.06]); box(1.7, 2.3, 0.06, white, 0, 1.4, 0); box(1.0, 0.12, 0.02, black, -0.25, 2.25, 0.04).userData.plain = true; [1.95, 1.75, 1.55, 1.35].forEach((y, k) => box(k === 3 ? 0.9 : 1.4, 0.04, 0.02, dark, k === 3 ? -0.25 : 0, y, 0.04).userData.plain = true); box(1.1, 0.5, 0.02, stamp, 0.15, 0.78, 0.05, [0, 0, 0.3]).userData.plain = true; box(0.94, 0.34, 0.02, white, 0.15, 0.78, 0.06, [0, 0, 0.3]).userData.plain = true; box(0.7, 0.1, 0.02, stamp, 0.15, 0.78, 0.07, [0, 0, 0.3]).userData.plain = true; box(0.7, 0.3, 0.14, black, 0, 2.55, 0); tor(0.16, 0.03, steel, 0, 2.78, 0, null, PI); },
    extinguisher() { const hose = M(0x1d1c1c, 0.6); cyl(0.5, 0.5, 1.7, red, 0, 0.9, 0); sph(0.5, red, 0, 1.75, 0, [1, 0.6, 1]); cyl(0.52, 0.52, 0.12, hose, 0, 0.06, 0); cyl(0.14, 0.14, 0.3, steel, 0, 2.15, 0); box(0.9, 0.1, 0.16, hose, 0.2, 2.42, 0, [0, 0, 0.15]); box(0.7, 0.08, 0.14, hose, 0.15, 2.22, 0); cyl(0.13, 0.13, 0.06, white, 0.1, 2.1, 0.16, [H, 0, 0]); rod([-0.1, 2.2, 0], [-0.75, 1.9, 0.1], 0.06, hose); rod([-0.75, 1.9, 0.1], [-0.72, 0.9, 0.15], 0.06, hose); put(new T.CylinderGeometry(0.06, 0.14, 0.4, 10), hose, -0.72, 0.7, 0.15); cyl(0.51, 0.51, 0.55, white, 0, 1.0, 0, null, 24); box(0.4, 0.07, 0.03, red, 0, 1.1, 0.51).userData.plain = true; box(0.26, 0.07, 0.03, red, 0, 0.92, 0.51).userData.plain = true; },
    // intern: a small person in a white coat holding a bubbling flask, a puddle at the feet
    intern() { const sk = M(0xe0b088, 0.8, 0, { exact: 1 }), hr = M(0x6b3a16, 0.8), coat = M(0xd6d2c4, 0.8, 0, { exact: 1 }), mg = M(0xb0189a, 0.3), bdg = M(0x3a6fd0, 0.5);
      cyl(0.9, 0.9, 0.03, mg, 0.9, 0.015, 0.7, null, 20).userData.plain = true; side.forEach(q => { rod([q * 0.25, 0.5, 0], [q * 0.3, 0.05, 0.05], 0.09, black); sph(0.12, black, q * 0.3, 0.05, 0.12, [1, 0.5, 1.4]); });
      cyl(0.5, 0.85, 1.5, coat, 0, 1.2, 0, null, 20); sph(0.52, sk, 0, 2.3, 0); sph(0.55, hr, 0, 2.45, -0.07, [1, 0.7, 1]); side.forEach(q => sph(0.06, black, q * 0.18, 2.3, 0.47).userData.plain = true);
      box(0.3, 0.3, 0.04, bdg, -0.3, 1.5, 0.62, [0, 0, 0.1]); rod([-0.5, 1.8, 0.1], [-0.8, 1.1, 0.2], 0.12, coat); rod([0.45, 1.8, 0.1], [0.75, 1.7, 0.8], 0.12, coat); sph(0.12, sk, 0.78, 1.72, 0.85);
      sph(0.38, mg, 0.85, 2.05, 0.9); cyl(0.14, 0.2, 0.3, mg, 0.85, 2.4, 0.9); [[0.7, 2.7], [1.0, 2.9]].forEach(q => sph(0.1, M(0xf4efe0, 0.5), q[0], q[1], 0.9).userData.plain = true); },
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
  B.shelf5 = () => shelf(5); B.shelf10 = () => shelf(10); [0, 1, 2, 3, 4, 5].forEach(n => { B[n ? 'tag_' + n : 'tag_more'] = () => tag(n); }); ['stable', 'unstable', 'volatile', 'overreact'].forEach((nm, i) => { B['mark_' + nm + '_off'] = () => markFlag(i, false); });
  Object.keys(HOMID).forEach(k => { B['jar_' + k] = () => { mkJar(k, 0.6, 1); }; B['jarr_' + k] = () => { mkJar(k, 1, 2); }; B['jarh_' + k] = () => { mkJar(k, 0.5, 1); }; B['jars_' + k] = () => { [[0.08, 0], [0.5, 1], [1, 2]].forEach((q, i) => mkJar(k, q[0], q[1], (i - 1) * 2.4)); }; });
  // (builder 14, the owner: acid and slime were both green blobs) the two are made again so that no two of the ten share an outline or a colour:
  // acid is a sharp yellow-green shard that smokes and has eaten a pit into what it stands on; slime is a soft violet ooze, see-through, sagging to one side, teal specks inside it
  B.homacid = () => { const sk = M(0xd4e21a, 0.25, 0, { exact: 1 }), dk = M(0x7a8a10, 0.4, 0, { exact: 1 }), pit = M(0x2c2f34, 0.9), fume = M(0xe8f0a0, 0.9, 0, { transparent: true, opacity: 0.5, exact: 1 }), wh = M(0xffffff, 0.4);
    floor(() => { cyl(1.0, 1.08, 0.03, pit, 0, 0.015, 0.1, null, 7).userData.plain = true; [[0.9, 0.6, 0.14], [-0.8, 0.5, 0.1]].forEach(q => cyl(q[2], q[2], 0.03, pit, q[0], 0.015, q[1], null, 6).userData.plain = true); });
    body(); cyl(0.78, 0.9, 0.24, dk, 0, 0.14, 0, null, 6);
    put(new T.ConeGeometry(0.78, 2.15, 5), sk, 0, 1.3, 0, [0, 0.3, 0]); put(new T.ConeGeometry(0.3, 0.95, 4), sk, -0.52, 1.05, 0, [0, 0, 0.75]); put(new T.ConeGeometry(0.27, 0.85, 4), sk, 0.55, 1.3, 0, [0, 0, -0.85]); put(new T.ConeGeometry(0.2, 0.6, 4), sk, 0.22, 2.1, -0.1, [0, 0, -0.5]);
    eyes(1.22, 0.42, 0.17, 0.06, 0); side.forEach(q => { box(0.24, 0.06, 0.03, black, q * 0.18, 1.38, 0.43, [0, 0, q * 0.55]).userData.plain = true; });
    box(0.36, 0.13, 0.03, black, 0, 0.9, 0.56).userData.plain = true; [-1, 0, 1].forEach(k => put(new T.ConeGeometry(0.05, 0.11, 4), wh, k * 0.1, 0.93, 0.58, [PI, 0, 0]).userData.plain = true);
    sph(0.2, fume, 0.12, 2.75, 0, [1.3, 0.8, 1]).userData.plain = true; sph(0.14, fume, -0.2, 3.05, 0.05, [1.3, 0.8, 1]).userData.plain = true;
    side.forEach(q => arm(q * 0.52, 1.2, 0.1, 0.6, 0.07, dk, sk, 0.1, 0.7)); sph(0.08, sk, 0.5, 0.42, 0.5, [1, 1.6, 1]); };
  B.homslime = () => { const gr = M(0x8a5ad0, 0.15, 0, { transparent: true, opacity: 0.8, exact: 1 }), in2 = M(0x2fd0c4, 0.3, 0, { exact: 1 }), goo = M(0x8a5ad0, 0.1, 0, { transparent: true, opacity: 0.45, exact: 1 });
    floor(() => { cyl(1.15, 1.25, 0.03, goo, 0, 0.015, 0.1, null, 28).userData.plain = true; });
    body(); sph(0.95, gr, 0, 0.56, 0, [1.25, 0.62, 1.05]); sph(0.5, gr, 0.48, 1.02, 0, [1, 0.8, 0.9]); sph(0.3, gr, -0.72, 0.72, 0.1, [1, 0.7, 1]);
    [[-0.25, 0.55, 0.3, 0.16], [0.3, 0.45, 0.5, 0.1], [0.55, 1.05, 0.2, 0.09], [-0.6, 0.6, 0.35, 0.07]].forEach(q => { sph(q[3], in2, q[0], q[1], q[2]).userData.plain = true; });
    eyes(0.8, 0.86, 0.42, 0.075, -0.07); side.forEach(q => { box(0.22, 0.055, 0.03, black, q * 0.42, 0.91 - (q > 0 ? 0.07 : 0), 0.9, [0, 0, -q * 0.3]).userData.plain = true; });
    tor(0.1, 0.03, black, 0, 0.62, 1.0, [0, 0, PI], PI).userData.plain = true;
    side.forEach(q => arm(q * 1.02, 0.7, 0.1, 0.6, 0.12, gr, gr, 0.22, 0.9, 1.6)); rod([0.8, 1.0, 0.3], [0.95, 0.4, 0.5], 0.045, gr); sph(0.1, gr, 0.95, 0.36, 0.5, [1, 1.5, 1]); };
  // (builder 17, ruling AZ: "the sprite should physically change too through 4-5 stages") FIVE FORMS of a creature, the same creature growing.
  // extra.stage 1..5 (none: the creature as it was, which is stage 3). 1 a small plain hatchling of the substance; 2 a youngster with its first
  // limbs; 3 as it was; 4 and 5 add more of the substance's own character on top of 3. Every form has a face and a backside. Three are drawn so
  // far for the owner to rule on (water, acid, slime); the other seven are stage 3 at every stage until then. Sizes: AA.rxKit.stageSize(stage).
  const sg = extra && extra.stage ? Math.max(1, Math.min(5, extra.stage | 0)) : 0; let young = false;
  const smile = (x, y, z, w) => { tor(w, 0.03, black, x, y, z, [0, 0, PI], PI).userData.plain = true; }, bum = (m, y, z, r, dx) => { side.forEach(q => sph(r, m, q * dx, y, -z, [1, 1.05, 0.8])); box(0.035, r * 1.5, 0.05, black, 0, y - r * 0.05, -z - r * 0.55).userData.plain = true; };
  const cone = (r, h, n, m, x, y, z, rot) => put(new T.ConeGeometry(r, h, n), m, x, y, z, rot), brow = (y, z, gap, w, tilt) => side.forEach(q => { box(w, 0.055, 0.03, black, q * gap, y, z, [0, 0, q * tilt]).userData.plain = true; }), feet = (m, gap) => side.forEach(q => sph(0.1, m, q * gap, 0.07, 0.1, [1, 0.6, 1.5]));
  const YOUNG = {
    homwater: s => { const sk = M(0x3a6fd0, 0.3), wet = M(0xcfe3ee, 0.1, 0, { transparent: true, opacity: 0.5 });
      if (s === 1) { floor(() => { cyl(0.6, 0.64, 0.03, wet, 0, 0.015, 0.1, null, 24).userData.plain = true; }); body(); feet(sk, 0.2); sph(0.5, sk, 0, 0.6, 0, [1, 1.05, 0.95]); cone(0.25, 0.55, 14, sk, 0, 1.22, 0); eyes(0.7, 0.44, 0.15, 0.06, 0); smile(0, 0.52, 0.47, 0.07); shine(-0.2, 0.68, 0.46, 0.08, 0.26); bum(sk, 0.4, 0.36, 0.2, 0.14); }
      else { /* a puddle that has stood up on two legs */ floor(() => { cyl(1.0, 1.05, 0.03, wet, 0.05, 0.015, 0.1, null, 28).userData.plain = true; }); body(); legs(0.5, 0.34, sk, 0.05); sph(0.8, sk, 0, 0.74, 0, [1.3, 0.42, 1.05]); sph(0.3, sk, 0.5, 0.98, 0, [1, 0.6, 1]); eyes(0.84, 0.72, 0.26, 0.06, 0); smile(0, 0.66, 0.82, 0.09); shine(-0.5, 0.86, 0.6, 0.22, 0.07, 0.1); side.forEach(q => arm(q * 1.0, 0.72, 0, 0.3, 0.08, sk, sk, 0.11, 0.9)); bum(sk, 0.66, 0.66, 0.26, 0.2); } },
    homacid: s => { const sk = M(0xd4e21a, 0.25, 0, { exact: 1 }), dk = M(0x7a8a10, 0.4, 0, { exact: 1 }), pit = M(0x2c2f34, 0.9), fume = M(0xe8f0a0, 0.9, 0, { transparent: true, opacity: 0.5, exact: 1 });
      if (s === 1) { body(); cyl(0.42, 0.5, 0.14, dk, 0, 0.08, 0, null, 6); cone(0.42, 1.05, 5, sk, 0, 0.66, 0, [0, 0.3, 0]); eyes(0.52, 0.25, 0.11, 0.05, 0); brow(0.63, 0.25, 0.12, 0.15, 0.5); bum(sk, 0.32, 0.24, 0.16, 0.12); }
      else { floor(() => { cyl(0.75, 0.8, 0.03, pit, 0, 0.015, 0.1, null, 7).userData.plain = true; }); body(); cyl(0.6, 0.7, 0.2, dk, 0, 0.11, 0, null, 6); cone(0.6, 1.65, 5, sk, 0, 1.0, 0, [0, 0.3, 0]); cone(0.22, 0.65, 4, sk, -0.42, 0.85, 0, [0, 0, 0.75]); eyes(0.92, 0.33, 0.14, 0.055, 0); brow(1.05, 0.33, 0.15, 0.2, 0.55); box(0.24, 0.09, 0.03, black, 0, 0.68, 0.44).userData.plain = true; sph(0.15, fume, 0.1, 2.1, 0, [1.3, 0.8, 1]).userData.plain = true; side.forEach(q => arm(q * 0.42, 0.9, 0.1, 0.36, 0.06, dk, sk, 0.09, 0.7)); bum(sk, 0.46, 0.34, 0.22, 0.16); } },
    homslime: s => { const gr = M(0x8a5ad0, 0.15, 0, { transparent: true, opacity: 0.8, exact: 1 }), in2 = M(0x2fd0c4, 0.3, 0, { exact: 1 }), goo = M(0x8a5ad0, 0.1, 0, { transparent: true, opacity: 0.45, exact: 1 });
      if (s === 1) { floor(() => { cyl(0.6, 0.66, 0.03, goo, 0, 0.015, 0.1, null, 24).userData.plain = true; }); body(); sph(0.5, gr, 0, 0.3, 0, [1.1, 0.64, 1]); sph(0.08, in2, 0.18, 0.3, 0.2).userData.plain = true; eyes(0.42, 0.42, 0.2, 0.06, -0.03); smile(0, 0.27, 0.5, 0.07); bum(gr, 0.26, 0.36, 0.2, 0.15); }
      else { floor(() => { cyl(0.9, 0.98, 0.03, goo, 0, 0.015, 0.1, null, 26).userData.plain = true; }); body(); sph(0.72, gr, 0, 0.43, 0, [1.2, 0.62, 1.05]); sph(0.34, gr, 0.36, 0.8, 0, [1, 0.8, 0.9]); [[-0.2, 0.42, 0.3, 0.12], [0.3, 0.36, 0.4, 0.08]].forEach(q => { sph(q[3], in2, q[0], q[1], q[2]).userData.plain = true; }); eyes(0.62, 0.64, 0.3, 0.065, -0.05); smile(0, 0.46, 0.74, 0.08); side.forEach(q => arm(q * 0.8, 0.5, 0.1, 0.36, 0.1, gr, gr, 0.17, 0.9, 1.4)); bum(gr, 0.38, 0.56, 0.3, 0.22); } }
  };
  const GROWN = {
    // water grows as water does: 4 a waterspout (a funnel turning above its head, rings of water round it), 5 a tide (a wide skirt of swell, a crest curling over it with foam). Round shapes only.
    homwater: s => { const sk = M(0x3a6fd0, 0.3), lite = M(0x7fb0ea, 0.25, 0, { exact: 1 }), foam = M(0xf2f6f8, 0.5, 0, { exact: 1 }), wet = M(0xcfe3ee, 0.1, 0, { transparent: true, opacity: 0.5 });
      floor(() => { cyl(1.7, 1.76, 0.03, wet, 0, 0.012, 0.1, null, 32).userData.plain = true; });
      sph(0.36, sk, 0, 2.62, 0, [1, 0.7, 1]); sph(0.52, sk, 0, 2.98, 0, [1.1, 0.55, 1.1]); sph(0.72, sk, 0, 3.36, 0, [1.15, 0.45, 1.15]); tor(0.62, 0.07, lite, 0, 3.4, 0, [H, 0, 0]); tor(0.42, 0.06, lite, 0, 3.0, 0, [H, 0, 0]);
      tor(0.78, 0.07, lite, 0, 1.25, 0, [H + 0.25, 0, 0]); tor(0.66, 0.06, lite, 0, 0.8, 0, [H - 0.2, 0, 0]);
      if (s >= 5) { floor(() => { cyl(0.6, 0.64, 0.03, wet, -1.9, 0.012, 0.9, null, 22).userData.plain = true; cyl(0.45, 0.5, 0.03, wet, 2.0, 0.012, 0.8, null, 20).userData.plain = true; });
        sph(1.0, sk, 0, 0.5, -0.1, [1.7, 0.55, 1.2]); side.forEach(q => { sph(0.5, sk, q * 1.25, 0.75, 0.1, [1, 0.8, 1]); sph(0.36, sk, q * 0.72, 1.55, 0); });
        tor(1.0, 0.34, sk, 0, 2.6, -0.5, [0, -H, 0], PI * 1.15); [[0, 3.55, 0.35], [-0.32, 3.42, 0.5], [0.34, 3.4, 0.52], [0, 3.1, 0.72], [-0.3, 2.95, 0.78], [0.28, 2.9, 0.8]].forEach(q => sph(0.17, foam, q[0], q[1], q[2]).userData.plain = true);
        brow(2.02, 0.37, 0.16, 0.2, 0.45); } },
    // acid keeps its few points and grows by eating: 4 a wide toothed mouth, a pitted dripping body, a gnawed bolt in its hand, holes eaten round it; 5 a fat belly that is mostly maw, standing in the crater it has eaten, crumbs of the bench about it.
    homacid: s => { const sk = M(0xd4e21a, 0.25, 0, { exact: 1 }), dk = M(0x7a8a10, 0.4, 0, { exact: 1 }), pit = M(0x2c2f34, 0.9), fume = M(0xe8f0a0, 0.9, 0, { transparent: true, opacity: 0.5, exact: 1 }), wh = M(0xffffff, 0.4), crumb = M(0x8a5a2b, 0.7);
      floor(() => { [[1.3, 0.2, 0.3], [-1.3, 0.0, 0.26], [0.4, 1.0, 0.2], [-0.7, 0.95, 0.16]].forEach(q => cyl(q[2], q[2], 0.03, pit, q[0], 0.015, q[1], null, 6).userData.plain = true); });
      [[-0.3, 1.62, 0.3, 0.09], [0.3, 1.7, 0.26, 0.07], [0.42, 0.62, 0.52, 0.1], [-0.45, 0.55, 0.5, 0.08]].forEach(q => { sph(q[3], dk, q[0], q[1], q[2], [1, 1, 0.4]).userData.plain = true; });
      [[-0.6, 0.5, 0.4], [0.62, 0.7, 0.3], [0.1, 0.45, 0.62]].forEach(q => sph(0.08, sk, q[0], q[1], q[2], [1, 1.7, 1]));
      if (s === 4) { box(0.62, 0.3, 0.03, black, 0, 0.88, 0.585).userData.plain = true; [-2, -1, 0, 1, 2].forEach(k => { put(new T.ConeGeometry(0.055, 0.13, 4), wh, k * 0.12, 0.98, 0.6, [PI, 0, 0]).userData.plain = true; put(new T.ConeGeometry(0.055, 0.13, 4), wh, k * 0.12 + 0.06, 0.78, 0.6).userData.plain = true; }); rod([0.75, 0.7, 0.3], [1.05, 1.15, 0.3], 0.07, steel); sph(0.11, steel, 1.07, 1.2, 0.3, [1.3, 0.6, 1.3]); sph(0.07, pit, 0.92, 0.95, 0.36).userData.plain = true; }
      if (s >= 5) { floor(() => { cyl(1.75, 1.85, 0.03, pit, 0, 0.012, 0.1, null, 9).userData.plain = true; [[2.0, 0.9, 0.2], [-2.05, 0.7, 0.24], [1.5, -0.6, 0.16]].forEach(q => cyl(q[2], q[2], 0.03, pit, q[0], 0.015, q[1], null, 6).userData.plain = true); [[1.7, 0.4], [-1.6, 0.9], [-1.9, 0.1], [1.2, 1.2]].forEach((q, i) => box(0.2, 0.14, 0.16, crumb, q[0], 0.07, q[1], [0, i, 0.2])); });
        sph(0.95, sk, 0, 0.72, 0.1, [1.3, 0.78, 1.0]); sph(0.62, black, 0, 0.72, 0.72, [1.25, 0.72, 0.4]).userData.plain = true; sph(0.3, M(0xd6453a, 0.6), 0, 0.5, 0.86, [1.2, 0.5, 0.4]).userData.plain = true;
        [-3, -2, -1, 0, 1, 2, 3].forEach(k => { put(new T.ConeGeometry(0.075, 0.2, 4), wh, k * 0.2, 1.06 - Math.abs(k) * 0.04, 0.93, [PI, 0, 0]).userData.plain = true; if (Math.abs(k) < 3) put(new T.ConeGeometry(0.075, 0.2, 4), wh, k * 0.2 + 0.1, 0.36 + Math.abs(k) * 0.03, 0.9).userData.plain = true; });
        side.forEach(q => { sph(0.09, sk, q * 0.5, 0.2, 0.9, [1, 2.2, 1]); }); sph(0.22, fume, -0.45, 3.2, 0.05, [1.3, 0.8, 1]).userData.plain = true; sph(0.14, fume, 0.5, 3.75, 0, [1.3, 0.8, 1]).userData.plain = true; } },
    homslime: s => { const gr = M(0x8a5ad0, 0.15, 0, { transparent: true, opacity: 0.8, exact: 1 }), in2 = M(0x2fd0c4, 0.3, 0, { exact: 1 }), goo = M(0x8a5ad0, 0.1, 0, { transparent: true, opacity: 0.45, exact: 1 });
      floor(() => { cyl(1.55, 1.65, 0.03, goo, 0, 0.012, 0.1, null, 28).userData.plain = true; });
      sph(0.38, gr, -0.3, 1.18, -0.1, [1, 0.85, 0.9]); sph(0.3, gr, 0.9, 1.4, 0, [1, 0.85, 0.9]); [[0.5, 1.3, 0.3, 0.09], [-0.3, 1.2, 0.25, 0.08], [0.85, 0.5, 0.45, 0.07], [0.1, 0.4, 0.75, 0.06]].forEach(q => { sph(q[3], in2, q[0], q[1], q[2]).userData.plain = true; }); rod([-0.95, 0.9, 0.2], [-1.1, 0.3, 0.4], 0.045, gr); sph(0.1, gr, -1.1, 0.26, 0.4, [1, 1.5, 1]);
      if (s >= 5) { floor(() => { cyl(0.5, 0.56, 0.03, goo, 1.9, 0.012, 0.8, null, 20).userData.plain = true; cyl(0.4, 0.45, 0.03, goo, -1.8, 0.012, 0.9, null, 20).userData.plain = true; });
        sph(0.44, gr, 0.3, 1.8, -0.05, [1, 0.85, 0.9]); sph(0.3, gr, 0.16, 2.3, 0, [1, 0.85, 0.9]); sph(0.19, gr, 0.26, 2.66, 0, [1, 0.9, 0.9]); [[0.3, 1.85, 0.3, 0.09], [0.16, 2.32, 0.22, 0.06]].forEach(q => { sph(q[3], in2, q[0], q[1], q[2]).userData.plain = true; });
        side.forEach(q => { rod([q * 1.15, 0.7, -0.1], [q * 1.55, 1.5, -0.1], 0.07, gr); rod([q * 1.55, 1.5, -0.1], [q * 1.35, 2.0, -0.1], 0.06, gr); sph(0.16, gr, q * 1.35, 2.05, -0.1); }); } }
  };
  // (builder 18, the owner on the five forms: "let me see you push them more as examples") THE PUSHED FORMS: every stage a different posture, body
  // plan and prop, the creature doing its job harder each time: hatchling, child, worker, master of its job, a small god of its substance. The
  // substance and the face stay (water: two eyes, a smile, a glint; acid: scowl and teeth; slime: lopsided eyes; salt: eyes on stalks, heavy brows,
  // a frown; dry ice: eyes and chattering teeth). Round shapes, few points; each form has its backside. Only with extra.push (or AA.rxKit.pushOn):
  // the forms above stay as they are until the owner picks. Drawn: water, acid, slime, salt, dry ice.
  const PUSH = {
    homwater: s => { const sk = M(0x3a6fd0, 0.3), lite = M(0x7fb0ea, 0.25, 0, { exact: 1 }), foam = M(0xf2f6f8, 0.5, 0, { exact: 1 }), wet = M(0xcfe3ee, 0.1, 0, { transparent: true, opacity: 0.5 }), rag = M(0xf4efe0, 0.9), tin = M(0x9aa3ad, 0.35, 0.7), stone = M(0xb9b4a6, 0.8);
      const pud = (r, x) => floor(() => { cyl(r, r * 1.04, 0.03, wet, x || 0, 0.015, 0.1, null, 28).userData.plain = true; });
      if (s === 1) { /* a drop that has only just stood up */ pud(0.55); body(); sph(0.5, sk, 0, 0.5, 0, [1, 0.95, 0.95]); cone(0.27, 0.6, 14, sk, 0, 1.12, 0); eyes(0.58, 0.44, 0.15, 0.06, 0); smile(0, 0.4, 0.47, 0.07); shine(-0.22, 0.6, 0.45, 0.08, 0.24); bum(sk, 0.3, 0.36, 0.2, 0.14); }
      else if (s === 2) { /* a child wringing a rag: both hands on it, drips under */ pud(0.8); body(); legs(0.45, 0.2, sk, 0.05); sph(0.6, sk, 0, 0.98, 0, [1, 1.05, 0.95]); cone(0.3, 0.65, 14, sk, 0.05, 1.75, 0, [0, 0, -0.15]); eyes(1.1, 0.53, 0.17, 0.06, 0); smile(0, 0.9, 0.58, 0.08); shine(-0.28, 1.15, 0.52, 0.09, 0.3);
        side.forEach(q => rod([q * 0.55, 0.95, 0.15], [q * 0.3, 0.72, 0.8], 0.07, sk)); cyl(0.09, 0.09, 0.8, rag, 0, 0.72, 0.82, [0, 0, H]); [-0.2, 0, 0.2].forEach(k => tor(0.095, 0.03, rag, k, 0.72, 0.82, [0, H, 0])); side.forEach(q => sph(0.12, sk, q * 0.3, 0.72, 0.82));
        [0.42, 0.2].forEach((y, i) => { sph(0.06 - i * 0.015, wet, 0.02, y, 0.82, [1, 1.5, 1]).userData.plain = true; }); bum(sk, 0.75, 0.45, 0.24, 0.17); }
      else if (s === 3) { /* a worker pouring: a pail held high and tipped, the stream falling into its own pool */ pud(1.25, 0.4); body(); legs(0.5, 0.24, sk, 0.05); sph(0.58, sk, 0, 1.0, 0, [1, 1.15, 0.9]); sph(0.46, sk, 0, 1.85, 0, [1, 0.95, 0.92]); cone(0.2, 0.55, 14, sk, 0, 2.42, 0); eyes(1.9, 0.4, 0.16, 0.055, 0); smile(0, 1.74, 0.42, 0.09); shine(-0.24, 1.1, 0.5, 0.1, 0.4);
        rod([0.5, 1.3, 0.1], [1.0, 2.25, 0.3], 0.07, sk); rod([-0.5, 1.3, 0.1], [0.65, 2.4, 0.45], 0.07, sk); cyl(0.36, 0.28, 0.6, tin, 1.0, 2.6, 0.35, [0, 0, -1.9], 18); rod([1.3, 2.5, 0.35], [1.75, 1.7, 0.35], 0.1, lite); rod([1.75, 1.7, 0.35], [1.85, 0.1, 0.35], 0.12, lite); sph(0.12, lite, 1.75, 1.7, 0.35);
        tor(0.3, 0.04, lite, 1.85, 0.05, 0.35, [H, 0, 0]); tor(0.5, 0.03, lite, 1.85, 0.04, 0.35, [H, 0, 0]); bum(sk, 0.8, 0.4, 0.28, 0.19); }
      else if (s === 4) { /* a master: it sits on top of its own fountain, water falling from each hand into the basin */ floor(() => { cyl(1.7, 1.76, 0.03, wet, 0, 0.012, 0.1, null, 32).userData.plain = true; }); body();
        tor(1.25, 0.16, stone, 0, 0.16, 0, [H, 0, 0]); cyl(1.2, 1.2, 0.12, lite, 0, 0.12, 0, null, 28); cyl(0.32, 0.5, 1.9, lite, 0, 1.0, 0, null, 16); tor(0.42, 0.07, foam, 0, 1.95, 0, [H, 0, 0]);
        sph(0.62, sk, 0, 2.5, 0, [1.05, 1, 0.95]); cone(0.26, 0.6, 14, sk, 0, 3.3, 0); eyes(2.62, 0.55, 0.18, 0.062, 0); smile(0, 2.42, 0.6, 0.1); shine(-0.3, 2.7, 0.52, 0.1, 0.34); brow(2.8, 0.56, 0.18, 0.16, -0.25);
        side.forEach(q => { rod([q * 0.55, 2.55, 0], [q * 1.0, 2.95, 0.1], 0.08, sk); sph(0.13, sk, q * 1.0, 2.95, 0.1); rod([q * 1.0, 2.95, 0.1], [q * 1.3, 2.6, 0.1], 0.06, lite); rod([q * 1.3, 2.6, 0.1], [q * 1.3, 1.4, 0.1], 0.06, lite); rod([q * 1.3, 1.4, 0.1], [q * 1.0, 0.25, 0.1], 0.07, lite); sph(0.07, lite, q * 1.3, 2.6, 0.1); sph(0.07, lite, q * 1.3, 1.4, 0.1); sph(0.14, foam, q * 1.0, 0.24, 0.1).userData.plain = true; });
        bum(sk, 2.3, 0.5, 0.26, 0.18); }
      else { /* a small god of water: the flood itself, a wave curling over, arms of water, a stool afloat on it */ floor(() => { cyl(2.0, 2.06, 0.03, wet, 0, 0.012, 0.2, null, 36).userData.plain = true; }); body();
        sph(1.5, sk, 0, 0.7, -0.1, [1.3, 0.6, 1.0]); sph(1.05, sk, 0, 1.9, -0.2, [1.25, 1.2, 0.9]); tor(0.95, 0.42, sk, 0, 2.75, 0.05, [0, -H, 0], PI * 1.1);
        [-0.9, -0.45, 0, 0.45, 0.9].forEach((k, i) => { sph(0.2, foam, k, 3.6 - Math.abs(k) * 0.25, 0.6 + (i % 2) * 0.1).userData.plain = true; }); cone(0.26, 0.6, 14, sk, 0, 3.95, -0.2);
        eyes(2.15, 0.78, 0.3, 0.1, 0); smile(0, 1.75, 0.84, 0.2); brow(2.42, 0.78, 0.3, 0.3, -0.3); shine(-0.7, 2.0, 0.68, 0.14, 0.5);
        side.forEach(q => { rod([q * 1.1, 1.7, 0], [q * 1.75, 1.2, 0.7], 0.2, sk); sph(0.3, sk, q * 1.75, 1.15, 0.75, [1, 0.8, 1]); tor(0.3, 0.05, foam, q * 1.75, 0.95, 0.75, [H, 0, 0]); });
        box(0.5, 0.08, 0.5, wood, 1.1, 0.72, 1.15, [0.2, 0.4, -0.15]); [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(p => rod([1.1 + p[0] * 0.18, 0.7, 1.15 + p[1] * 0.18], [1.1 + p[0] * 0.2, 0.4, 1.15 + p[1] * 0.2], 0.03, wood));
        bum(sk, 1.1, 1.0, 0.5, 0.36); } },
    homacid: s => { const sk = M(0xd4e21a, 0.25, 0, { exact: 1 }), dk = M(0x7a8a10, 0.4, 0, { exact: 1 }), pit = M(0x2c2f34, 0.9), fume = M(0xe8f0a0, 0.9, 0, { transparent: true, opacity: 0.5, exact: 1 }), wh = M(0xffffff, 0.4), tongue = M(0xd6453a, 0.6), glass = M(0xcfe3ee, 0.1, 0, { transparent: true, opacity: 0.45 });
      const teeth = (y, z, w, n, up) => { for (let i = 0; i < n; i++) put(new T.ConeGeometry(w / n * 0.5, w / n * 1.1, 4), wh, -w / 2 + (i + 0.5) * w / n, y, z, up ? null : [PI, 0, 0]).userData.plain = true; };
      const hole = (r, x, z) => floor(() => { cyl(r, r, 0.03, pit, x, 0.015, z, null, 7).userData.plain = true; }), puff = (r, x, y) => { sph(r, fume, x, y, 0, [1.3, 0.8, 1]).userData.plain = true; };
      if (s === 1) { /* a bead of acid in the first pit it has made */ hole(0.5, 0, 0.1); body(); sph(0.42, sk, 0, 0.4, 0, [1, 0.9, 1]); cone(0.2, 0.4, 10, sk, 0, 0.9, 0); eyes(0.5, 0.36, 0.13, 0.05, 0); brow(0.62, 0.36, 0.14, 0.14, 0.5); box(0.16, 0.06, 0.03, black, 0, 0.3, 0.4).userData.plain = true; teeth(0.31, 0.42, 0.1, 1); bum(sk, 0.26, 0.3, 0.17, 0.12); }
      else if (s === 2) { /* a child nibbling a bolt held in both hands, crumbs of it about */ hole(0.7, 0, 0.1); body(); feet(dk, 0.22); sph(0.6, sk, 0, 0.68, 0, [1, 0.95, 0.95]); cone(0.26, 0.5, 10, sk, 0, 1.38, 0);
        eyes(0.88, 0.5, 0.17, 0.055, 0); brow(1.02, 0.5, 0.18, 0.18, 0.5); box(0.3, 0.14, 0.03, black, 0, 0.56, 0.58).userData.plain = true; teeth(0.6, 0.6, 0.26, 3);
        cyl(0.07, 0.07, 0.55, steel, 0.05, 0.5, 0.75, [0, 0, H]); cyl(0.13, 0.13, 0.1, steel, 0.36, 0.5, 0.75, [0, 0, H], 6); sph(0.09, pit, -0.2, 0.52, 0.78).userData.plain = true;
        side.forEach(q => rod([q * 0.5, 0.6, 0.2], [q * 0.3, 0.5, 0.72], 0.06, dk)); floor(() => { [[0.5, 0.9], [-0.4, 1.0], [0.1, 1.15]].forEach(p => box(0.06, 0.05, 0.06, steel, p[0], 0.03, p[1], [0, p[0] * 3, 0])); }); bum(sk, 0.45, 0.44, 0.22, 0.16); }
      else if (s === 3) { /* a worker gnawing: jaws wide round a steel bar, bites out of it, a drip off each end */ hole(1.0, 0, 0.1); hole(0.16, 1.2, 0.5); hole(0.12, -1.15, 0.6); body(); legs(0.4, 0.3, dk, 0.06); sph(0.85, sk, 0, 1.05, 0, [1, 1.05, 0.9]); cone(0.3, 0.6, 10, sk, 0, 2.05, 0);
        eyes(1.55, 0.6, 0.2, 0.06, 0); brow(1.72, 0.6, 0.21, 0.24, 0.55); sph(0.42, black, 0, 0.95, 0.62, [1.15, 0.8, 0.4]).userData.plain = true; teeth(1.2, 0.8, 0.7, 5); teeth(0.72, 0.78, 0.6, 4, true);
        cyl(0.1, 0.1, 2.3, steel, 0, 0.96, 0.88, [0, 0, H]); [-0.62, 0.62].forEach(k => { sph(0.13, pit, k, 1.02, 0.9).userData.plain = true; }); side.forEach(q => { rod([q * 0.8, 1.1, 0.2], [q * 0.95, 0.98, 0.85], 0.07, dk); sph(0.12, sk, q * 0.95, 0.98, 0.88); sph(0.07, sk, q * 1.15, 0.7, 0.88, [1, 1.7, 1]); });
        puff(0.18, 0.15, 2.7); bum(sk, 0.7, 0.62, 0.3, 0.22); }
      else if (s === 4) { /* a master: it has eaten down through the bench plank and sits in the hole, the plank's two ends tipping in */ floor(() => { [[1.7, 0.5, 0.2], [-1.75, 0.3, 0.24], [0.6, 1.5, 0.16]].forEach(q => cyl(q[2], q[2], 0.03, pit, q[0], 0.015, q[1], null, 6).userData.plain = true); }); body();
        side.forEach(q => box(1.1, 0.16, 1.5, wood, q * 1.45, 0.5, 0, [0, 0, q * -0.22])); cyl(1.0, 1.0, 0.06, pit, 0, 0.06, 0, null, 9);
        sph(1.0, sk, 0, 1.0, 0, [1.15, 0.95, 0.95]); cone(0.3, 0.55, 10, sk, 0, 2.1, 0); eyes(1.6, 0.7, 0.24, 0.07, 0); brow(1.8, 0.7, 0.25, 0.28, 0.55);
        sph(0.6, black, 0, 0.95, 0.66, [1.2, 0.75, 0.4]).userData.plain = true; sph(0.28, tongue, 0, 0.78, 0.8, [1.2, 0.5, 0.4]).userData.plain = true; teeth(1.28, 0.88, 1.0, 7); teeth(0.6, 0.84, 0.8, 5, true);
        side.forEach(q => { rod([q * 1.0, 1.2, 0.1], [q * 1.5, 0.78, 0.5], 0.09, dk); sph(0.15, sk, q * 1.5, 0.75, 0.5); }); box(0.3, 0.2, 0.22, wood, 1.5, 0.95, 0.55, [0.3, 0.5, 0.2]);
        [[0.7, 0.4, 0.75], [-0.75, 0.5, 0.7]].forEach(q => sph(0.08, sk, q[0], q[1], q[2], [1, 1.9, 1])); puff(0.22, -0.3, 2.9); puff(0.15, 0.4, 3.4); bum(sk, 0.75, 0.75, 0.36, 0.26); }
      else { /* a small god of acid: the bench is gone; a pool with a head risen out of it, a great ring of teeth, a table leg and a jar going under */ floor(() => { cyl(2.0, 2.1, 0.03, pit, 0, 0.012, 0.1, null, 11).userData.plain = true; [[1.6, 1.5, 0.2], [-1.7, 1.4, 0.16]].forEach(q => box(q[2], 0.12, q[2], wood, q[0], 0.06, q[1], [0, q[0], 0.2])); }); body();
        sph(1.75, sk, 0, 0.25, 0, [1.05, 0.45, 1.0]); sph(1.15, sk, 0, 1.5, -0.35, [1.1, 1.1, 0.9]); cone(0.34, 0.65, 10, sk, 0, 2.95, -0.35);
        eyes(2.05, 0.6, 0.32, 0.1, 0); brow(2.35, 0.6, 0.33, 0.4, 0.55); sph(0.85, black, 0, 1.2, 0.42, [1.2, 0.8, 0.5]).userData.plain = true; sph(0.4, tongue, 0, 0.95, 0.66, [1.3, 0.5, 0.4]).userData.plain = true; teeth(1.68, 0.78, 1.5, 8); teeth(0.72, 0.8, 1.3, 7, true);
        rod([1.2, 0.3, 0.9], [1.75, 1.5, 1.2], 0.13, wood); cyl(0.3, 0.3, 0.6, glass, -1.3, 0.55, 0.9, [0.5, 0, 0.5], 14); cyl(0.32, 0.32, 0.08, steel, -1.52, 0.78, 1.05, [0.5, 0, 0.5], 14);
        side.forEach(q => { rod([q * 1.1, 1.3, 0], [q * 1.7, 0.9, 0.7], 0.14, dk); sph(0.2, sk, q * 1.7, 0.86, 0.72); }); [[0.9, 2.0, 0.3], [-1.0, 1.7, 0.4], [0.3, 0.75, 1.25]].forEach(q => sph(0.1, sk, q[0], q[1], q[2], [1, 1.9, 1]));
        puff(0.3, -0.5, 3.6); puff(0.2, 0.5, 4.1); puff(0.26, 0.1, 3.2); bum(sk, 1.3, 1.25, 0.5, 0.36);
        /* its back: pitted, dripping, the bench's last plank stuck in it and half gone */ [[-0.6, 2.2, -1.2, 0.16], [0.55, 2.35, -1.15, 0.12], [0.75, 1.75, -1.3, 0.14], [-0.85, 1.6, -1.25, 0.1], [0.1, 2.6, -0.95, 0.1]].forEach(q => { sph(q[3], dk, q[0], q[1], q[2], [1, 1, 0.4]).userData.plain = true; }); [[-0.9, 1.0, -1.25], [0.95, 1.1, -1.2], [0.3, 0.75, -1.5]].forEach(q => sph(0.1, sk, q[0], q[1], q[2], [1, 2.0, 1])); box(1.5, 0.14, 0.5, wood, 0.9, 0.75, -1.45, [0.5, 0.5, 0.35]); sph(0.2, pit, 0.45, 0.62, -1.55).userData.plain = true; } },
    homslime: s => { const gr = M(0x8a5ad0, 0.15, 0, { transparent: true, opacity: 0.8, exact: 1 }), in2 = M(0x2fd0c4, 0.3, 0, { exact: 1 }), goo = M(0x8a5ad0, 0.1, 0, { transparent: true, opacity: 0.45, exact: 1 }), glass = M(0xf2f6f8, 0.15, 0, { exact: 1 }), yel = M(0xe0b63a, 0.6);
      const pud = r => floor(() => { cyl(r, r * 1.06, 0.03, goo, 0, 0.015, 0.1, null, 26).userData.plain = true; }), bub = L => L.forEach(q => { sph(q[3], in2, q[0], q[1], q[2]).userData.plain = true; });
      const face = (y, z, gap, r, w) => { const k = r / 0.075; eyes(y, z, gap, r, -0.07 * k); side.forEach(q => { box(0.22 * k, 0.055, 0.03, black, q * gap, y + 0.11 * k - (q > 0 ? 0.07 * k : 0), z + 0.04, [0, 0, -q * 0.3]).userData.plain = true; }); smile(0, y - 0.18 * k, z + 0.1, w); };
      if (s === 1) { /* a dab stuck to the bench */ pud(0.6); body(); sph(0.5, gr, 0, 0.3, 0, [1.1, 0.62, 1]); bub([[0.18, 0.3, 0.2, 0.08]]); face(0.4, 0.42, 0.2, 0.055, 0.07); bum(gr, 0.26, 0.36, 0.2, 0.15); }
      else if (s === 2) { /* a child that has stuck to a pencil and carries it about */ pud(0.9); body(); sph(0.7, gr, 0, 0.5, 0, [1.15, 0.72, 1.0]); bub([[-0.2, 0.42, 0.3, 0.1], [0.3, 0.36, 0.35, 0.07]]); face(0.66, 0.6, 0.26, 0.062, 0.08);
        rod([-0.9, 0.3, -0.2], [0.75, 1.5, -0.1], 0.07, yel); cone(0.07, 0.2, 8, wood, 0.83, 1.56, -0.095, [0, 0, -0.94]); side.forEach(q => arm(q * 0.8, 0.55, 0.1, 0.35, 0.1, gr, gr, 0.16, 0.9, 1.4)); rod([0.3, 0.9, 0], [0.4, 1.2, -0.08], 0.05, gr); bum(gr, 0.42, 0.56, 0.3, 0.22); }
      else if (s === 3) { /* a worker engulfing: a whole flask half sunk into its belly */ pud(1.25); body(); sph(1.05, gr, 0, 0.85, 0, [1.15, 0.85, 1.0]); sph(0.4, gr, 0.75, 1.5, 0, [1, 0.85, 0.9]);
        put(new T.ConeGeometry(0.42, 0.6, 16), glass, -0.2, 0.62, 0.78, [0.5, 0, 0.3]).userData.plain = true; cyl(0.1, 0.1, 0.4, glass, -0.33, 1.02, 1.02, [0.5, 0, 0.3]).userData.plain = true; tor(0.11, 0.025, glass, -0.39, 1.2, 1.12, [H + 0.5, 0, 0.3]).userData.plain = true;
        bub([[0.5, 0.6, 0.6, 0.1], [0.75, 1.5, 0.25, 0.08], [0.2, 0.4, 0.9, 0.07]]); face(1.2, 0.86, 0.36, 0.075, 0.1); side.forEach(q => arm(q * 1.15, 0.9, 0.1, 0.6, 0.12, gr, gr, 0.22, 1.1, 1.6)); bum(gr, 0.7, 0.85, 0.42, 0.3); }
      else if (s === 4) { /* a master wearing what it has caught: a funnel for a hat, a clamp ring for a belt, a spoon held up in a long arm */ pud(1.5); body(); sph(1.05, gr, 0, 0.8, 0, [1.2, 0.8, 1.05]); sph(0.75, gr, 0, 1.85, 0, [1.05, 0.95, 0.95]);
        put(new T.ConeGeometry(0.55, 0.6, 18), steel, 0, 2.75, 0).userData.plain = true; cyl(0.07, 0.07, 0.5, steel, 0, 3.25, 0); tor(1.12, 0.06, steel, 0, 1.2, 0, [H, 0, 0]); box(0.22, 0.16, 0.12, steel, 0, 1.2, 1.12);
        bub([[0.5, 0.7, 0.75, 0.12], [-0.55, 0.6, 0.7, 0.09], [0.3, 1.9, 0.6, 0.08], [-0.2, 0.4, 0.95, 0.07]]); face(2.0, 0.68, 0.3, 0.075, 0.11);
        rod([1.1, 1.0, 0.1], [1.75, 1.9, 0.3], 0.1, gr); sph(0.18, gr, 1.75, 1.95, 0.3); rod([1.75, 1.9, 0.3], [1.9, 2.9, 0.3], 0.035, steel); sph(0.14, steel, 1.92, 3.0, 0.3, [1, 1.3, 0.5]);
        rod([-1.1, 1.0, 0.1], [-1.6, 0.4, 0.5], 0.1, gr); sph(0.18, gr, -1.6, 0.36, 0.5); rod([0.9, 0.5, -0.9], [1.1, 0.04, -1.1], 0.035, gr); bum(gr, 0.62, 0.9, 0.46, 0.34); }
      else { /* a small god of slime: a mound of three, a crown of test tubes, four arms, what it has caught hung in it, two small ones at its foot */ floor(() => { cyl(1.95, 2.05, 0.03, goo, 0, 0.012, 0.1, null, 30).userData.plain = true; }); body();
        sph(1.5, gr, 0, 0.85, 0, [1.2, 0.72, 1.05]); sph(1.1, gr, 0, 2.0, 0, [1.1, 0.8, 1.0]); sph(0.75, gr, 0, 3.0, 0, [1.05, 0.9, 0.95]);
        for (let i = 0; i < 7; i++) { const a = i / 7 * 2 * PI; cyl(0.07, 0.07, 0.5, glass, Math.cos(a) * 0.55, 3.8, Math.sin(a) * 0.5, [Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3], 10); sph(0.07, in2, Math.cos(a) * 0.62, 4.05, Math.sin(a) * 0.57).userData.plain = true; } tor(0.56, 0.05, brass, 0, 3.58, 0, [H, 0, 0]);
        bub([[0.6, 0.8, 1.2, 0.14], [-0.7, 0.6, 1.1, 0.1], [0.4, 2.0, 0.9, 0.1], [-0.3, 2.3, 0.85, 0.08]]); box(0.22, 0.22, 0.22, steel, 0.75, 1.3, 1.2, [0.4, 0.5, 0.2]).userData.plain = true; tor(0.16, 0.04, brass, -0.55, 1.75, 1.0).userData.plain = true; rod([-1.0, 0.5, 1.2], [-0.3, 1.15, 1.4], 0.05, yel);
        face(3.1, 0.68, 0.3, 0.09, 0.14);
        side.forEach(q => { rod([q * 1.1, 2.2, 0], [q * 1.75, 3.0, 0.2], 0.11, gr); sph(0.2, gr, q * 1.75, 3.05, 0.2); rod([q * 1.5, 1.0, 0.2], [q * 1.95, 0.5, 0.7], 0.12, gr); sph(0.22, gr, q * 1.95, 0.45, 0.72); });
        [[-1.35, 1.6], [1.2, 1.75]].forEach(p => { sph(0.3, gr, p[0], 0.2, p[1], [1.1, 0.65, 1]); side.forEach(q => { sph(0.04, black, p[0] + q * 0.1, 0.27, p[1] + 0.27).userData.plain = true; }); });
        bum(gr, 0.75, 1.3, 0.6, 0.44); } },
    // salt grows as a crystal grows: one grain, then grains on a crab, a sack of it, a single great clear crystal it lives in, and at last a pillar. What it keeps, it keeps whole inside the crystal.
    homsalt: s => { const sa = M(0xc2bca6, 0.85, 0, { exact: 1 }), cream = M(0xe2dcc6, 0.85, 0, { exact: 1 }), grit = M(0x8d949c, 0.8), pile = M(0xd6d2c4, 0.9, 0, { exact: 1 }), clear = M(0xcfe6f2, 0.1, 0, { transparent: true, opacity: 0.2, exact: 1 }), fish = M(0x7f8a94, 0.5), blue = M(0x3a6fd0, 0.3), sack = M(0xb99a6a, 0.9), glass = M(0xcfe3ee, 0.1, 0, { transparent: true, opacity: 0.45 });
      const drift = r => floor(() => { cyl(r, r * 1.05, 0.03, pile, 0, 0.015, 0.1, null, 24).userData.plain = true; });
      const stalks = (y, z, gap, h, k) => side.forEach(q => { rod([q * gap, y, z], [q * gap * 1.15, y + h, z + 0.05], 0.05 * k, sa); sph(0.08 * k, black, q * gap * 1.15, y + h + 0.03, z + 0.07).userData.plain = true; box(0.28 * k, 0.08 * k, 0.06, black, q * gap * 1.15, y + h + 0.16 * k, z + 0.1, [0, 0, q * 0.5]).userData.plain = true; });
      const frown = (y, z, w) => { tor(w, 0.03, black, 0, y, z, null, PI).userData.plain = true; };
      const crab = (n, x, y, out) => side.forEach(q => { for (let k = 0; k < n; k++) { const z = -0.3 + k * 0.32; rod([q * x, y, z], [q * (x + out + k * 0.05), 0.08, z + 0.05], 0.065, black); sph(0.08, black, q * (x + out + k * 0.05), 0.05, z + 0.08, [1, 0.5, 1.4]); } });
      const claw = (x, y, z, len, r, ang) => side.forEach(q => { const pv = arm(q * x, y, z, len, r * 0.45, sa, sa, r, ang); into(pv, () => { [-1, 1].forEach(p => put(new T.ConeGeometry(r * 0.38, r * 1.55, 8), sa, p * r * 0.45, -len - r * 0.9, 0, [0, 0, p * 0.15 + PI])); }); });
      if (s === 1) { /* one grain: a single cube on two legs */ drift(0.5); body(); crab(1, 0.2, 0.3, 0.2); box(0.6, 0.6, 0.6, cream, 0, 0.55, 0); stalks(0.8, 0.15, 0.15, 0.22, 0.75); frown(0.42, 0.31, 0.1); bum(cream, 0.4, 0.3, 0.16, 0.12); }
      else if (s === 2) { /* a child: a small crab lump with its first three crystals, one claw pinching a grain */ drift(0.8); body(); crab(2, 0.45, 0.5, 0.35); sph(0.65, sa, 0, 0.65, 0, [1.2, 0.8, 1]); [[-0.3, 1.1, 0, 0.3], [0.25, 1.15, -0.1, 0.26], [0, 1.05, 0.3, 0.2]].forEach((q, i) => box(q[3], q[3], q[3], i ? cream : grit, q[0], q[1], q[2], [0.5, 0.6 + i, 0.3]));
        stalks(0.95, 0.35, 0.2, 0.3, 0.85); frown(0.55, 0.66, 0.14); claw(0.7, 0.7, 0.3, 0.4, 0.2, 1.9); box(0.16, 0.16, 0.16, cream, 1.38, 0.86, 0.3, [0.3, 0.4, 0.2]); bum(sa, 0.5, 0.5, 0.24, 0.2); }
      else if (s === 3) { /* a worker: a sack of salt on its back, split and spilling */ drift(1.2); floor(() => [[1.0, -0.6], [1.2, -0.3], [0.8, -0.9], [1.3, -0.8]].forEach(q => { box(0.1, 0.1, 0.1, cream, q[0], 0.05, q[1], [0.4, q[0], 0.2]).userData.plain = true; })); body(); crab(3, 0.7, 0.75, 0.5);
        sph(1.0, sa, 0, 0.95, 0, [1.25, 0.8, 1.0]); sph(0.75, sack, 0.1, 1.85, -0.35, [1.15, 0.8, 0.9]); tor(0.2, 0.05, M(0x8a6a3a, 0.9), 0.1, 2.45, -0.35, [H, 0, 0]); box(0.3, 0.26, 0.26, cream, 0.85, 1.75, -0.5, [0.4, 0.5, 0.3]);
        [[-0.75, 1.45, 0.3, 0.26], [0.7, 1.4, 0.4, 0.22], [-0.2, 1.5, 0.55, 0.2]].forEach((q, i) => box(q[3], q[3], q[3], i % 2 ? cream : grit, q[0], q[1], q[2], [0.5, 0.6 + i, 0.3]));
        stalks(1.45, 0.5, 0.28, 0.38, 1); frown(0.82, 1.0, 0.2); claw(1.1, 1.05, 0.35, 0.6, 0.27, 1.9); bum(sa, 0.82, 0.74, 0.36, 0.3); }
      else if (s === 4) { /* a master: it lives inside one great clear crystal, a fish kept whole in the crystal over its head */ drift(1.6); body(); crab(3, 0.95, 0.6, 0.55); box(2.0, 2.0, 1.7, clear, 0, 1.5, -0.1, [0, 0.08, 0]);
        sph(0.8, sa, 0, 1.2, 0.35, [1.1, 0.85, 0.9]); sph(0.34, fish, 0.5, 2.15, 0.3, [1.6, 0.6, 0.5]).userData.plain = true; put(new T.ConeGeometry(0.2, 0.3, 4), fish, 1.1, 2.15, 0.3, [0, 0, H]).userData.plain = true; sph(0.04, black, 0.15, 2.2, 0.46).userData.plain = true;
        [[-0.5, 2.75, 0, 0.5], [0.3, 2.75, -0.2, 0.4], [0.75, 2.65, 0.3, 0.3], [-0.1, 3.15, -0.1, 0.3]].forEach((q, i) => box(q[3], q[3], q[3], i % 2 ? grit : cream, q[0], q[1], q[2], [0, 0.3 * i, 0]));
        stalks(1.55, 0.95, 0.3, 0.4, 1.1); frown(1.1, 1.08, 0.22); claw(1.15, 1.1, 0.7, 0.55, 0.3, 1.7); bum(cream, 0.9, 0.95, 0.4, 0.3); }
      else { /* a small god of salt: a pillar of crystal with the face high on it, six legs, in each claw something kept for ever (a drop of water in a clear cube; a jar) */ drift(2.0); body(); crab(3, 1.0, 0.7, 0.75);
        box(2.2, 1.3, 1.8, sa, 0, 0.95, 0, [0, 0.1, 0]); box(1.8, 1.2, 1.5, cream, 0.05, 2.1, -0.05, [0, -0.15, 0]); box(1.4, 1.1, 1.2, sa, -0.05, 3.15, 0, [0, 0.2, 0]);
        [[-0.9, 1.75, 0.6, 0.4], [0.95, 1.7, 0.5, 0.34], [0.75, 2.85, 0.4, 0.3], [-0.7, 2.8, 0.45, 0.26], [0.2, 3.85, 0, 0.36], [-0.3, 3.8, -0.2, 0.26]].forEach((q, i) => box(q[3], q[3], q[3], i % 2 ? grit : cream, q[0], q[1], q[2], [0.5, 0.6 + i, 0.3]));
        stalks(3.3, 0.66, 0.3, 0.5, 1.3); frown(2.95, 0.7, 0.3); claw(1.2, 2.2, 0.5, 0.75, 0.36, 1.75);
        box(0.55, 0.55, 0.55, clear, -1.95, 3.0, 0.5, [0, 0.3, 0]); sph(0.17, blue, -1.95, 2.95, 0.5).userData.plain = true; cone(0.09, 0.2, 10, blue, -1.95, 3.17, 0.5).userData.plain = true; cyl(0.24, 0.24, 0.5, glass, 1.95, 3.0, 0.5, null, 14); cyl(0.26, 0.26, 0.07, steel, 1.95, 3.28, 0.5, null, 14);
        bum(sa, 0.9, 0.95, 0.5, 0.36); } },
    // dry ice grows by what its cold reaches: a chip, a shivering block in a scarf, a breath that freezes a flask, a slab frozen out of the bench that it rides, and at last a glacier with the bench's things caught in its foot.
    homco2: s => { const ice = M(0xc0d9e8, 0.3, 0, { exact: 1 }), fleck = M(0x3a6fd0, 0.3), mist = M(0xdcecf4, 0.9, 0, { transparent: true, opacity: 0.55 }), wh = M(0xffffff, 0.4), wool = M(0xd6453a, 0.7), frost = M(0x9fc6e6, 0.25, 0, { exact: 1 }), glass = M(0xcfe3ee, 0.1, 0, { transparent: true, opacity: 0.5 });
      const fog = L => floor(() => L.forEach(q => { sph(q[2], mist, q[0], 0.14, q[1], [1.3, 0.35, 1]).userData.plain = true; }));
      const face = (y, z, k) => { eyes(y, z, 0.22 * k, 0.06 * k, 0); box(0.42 * k, 0.17 * k, 0.02, black, 0, y - 0.37 * k, z + 0.005).userData.plain = true; box(0.36 * k, 0.11 * k, 0.02, wh, 0, y - 0.37 * k, z + 0.02).userData.plain = true; [-1, 0, 1].forEach(j => { box(0.02 * k, 0.11 * k, 0.02, black, j * 0.09 * k, y - 0.37 * k, z + 0.035).userData.plain = true; }); };
      const flecks = L => L.forEach(q => { box(q[3], q[3] * 0.5, 0.03, fleck, q[0], q[1], q[2], [0, 0, 0.5]).userData.plain = true; });
      const scarf = (y, r) => { tor(r, 0.09, wool, 0, y, 0, [H, 0, 0]); box(0.16, 0.5, 0.06, wool, r * 0.7, y - 0.25, r * 0.75, [0, 0, 0.2]); };
      if (s === 1) { /* a chip of ice, a wisp of cold off it */ fog([[0.3, 0.3, 0.3]]); body(); legs(0.3, 0.14, black, 0.04); box(0.6, 0.55, 0.5, ice, 0, 0.55, 0); face(0.66, 0.26, 0.75); flecks([[0.18, 0.4, 0.26, 0.1]]); bum(ice, 0.42, 0.25, 0.15, 0.12); }
      else if (s === 2) { /* a child hugging itself in a scarf */ fog([[-0.5, 0.3, 0.35], [0.45, 0.35, 0.3]]); body(); legs(0.5, 0.2, black, 0.05); box(0.9, 0.85, 0.75, ice, 0, 1.0, 0); scarf(0.62, 0.62);
        face(1.2, 0.385, 0.9); flecks([[0.25, 0.8, 0.39, 0.14], [-0.3, 1.3, 0.39, 0.1]]); side.forEach(q => rod([q * 0.45, 0.95, 0.2], [-q * 0.2, 0.8, 0.5], 0.05, black)); bum(ice, 0.85, 0.38, 0.2, 0.15); }
      else if (s === 3) { /* a worker: it breathes out and a flask in front of it stands frozen in a shell of ice */ fog([[-0.8, 0.25, 0.5], [0.35, 0.5, 0.5], [1.2, 0.6, 0.45]]); body(); legs(0.8, 0.28, black, 0.05); box(1.2, 1.1, 1.0, ice, 0, 1.45, 0, [0, 0.12, 0]); box(0.34, 0.2, 0.34, ice, 0.52, 2.08, 0.1, [0.3, 0.5, 0.2]); scarf(0.95, 0.84);
        face(1.62, 0.53, 1); flecks([[0.3, 1.2, 0.53, 0.2], [-0.35, 1.8, 0.53, 0.16]]); shine(-0.42, 1.65, 0.54, 0.1, 0.5, 0.1);
        [[0.5, 1.25, 0.8, 0.16], [0.85, 1.15, 1.0, 0.22], [1.2, 1.0, 1.2, 0.26]].forEach(q => { sph(q[3], mist, q[0], q[1], q[2], [1.2, 0.8, 1]).userData.plain = true; });
        put(new T.ConeGeometry(0.4, 0.6, 14), glass, 1.55, 0.3, 1.2).userData.plain = true; cyl(0.1, 0.1, 0.35, glass, 1.55, 0.75, 1.2).userData.plain = true; box(0.75, 1.1, 0.75, frost, 1.55, 0.55, 1.2, [0, 0.4, 0]);
        side.forEach(q => arm(q * 0.68, 1.5, 0.1, 0.55, 0.05, black, black, 0.09, q > 0 ? 1.3 : 0.5)); bum(ice, 1.2, 0.54, 0.26, 0.2); }
      else if (s === 4) { /* a master: it rides a slab it has frozen out of the bench, a jar and a board caught in the slab; shoulders of ice and a short crown */ fog([[-1.5, 0.4, 0.5], [1.5, 0.3, 0.5], [0, 1.2, 0.55]]); body(); box(3.0, 0.5, 1.9, frost, 0, 0.3, 0, [0, 0.1, 0.06]); cyl(0.22, 0.22, 0.4, glass, -0.95, 0.3, 0.55, null, 12).userData.plain = true; box(0.5, 0.06, 0.3, wood, 0.9, 0.3, 0.6, [0, 0.4, 0]).userData.plain = true;
        side.forEach(q => rod([q * 0.3, 1.35, 0], [q * 0.36, 0.6, 0.04], 0.05, black)); box(1.3, 1.2, 1.05, ice, 0, 1.9, 0, [0, 0.12, 0]); side.forEach(q => box(0.6, 0.45, 0.7, ice, q * 0.95, 2.45, 0, [0, 0, q * -0.3])); [-0.35, 0, 0.35].forEach((k, i) => cone(0.14, i === 1 ? 0.6 : 0.42, 6, ice, k, 2.75 + (i === 1 ? 0.05 : 0), 0)); scarf(1.4, 0.9);
        face(2.1, 0.555, 1.1); flecks([[0.35, 1.6, 0.56, 0.2], [-0.4, 2.3, 0.56, 0.16]]); side.forEach(q => arm(q * 1.15, 2.35, 0.1, 0.7, 0.06, black, ice, 0.14, 0.6)); bum(ice, 1.65, 0.56, 0.28, 0.21); }
      else { /* a small god of cold: a glacier, three shelves of ice with the face on the top one, a sea of mist, a jar and a drop of water frozen in its foot, a ring of cold light over it */ fog([[-1.9, 0.5, 0.6], [1.9, 0.4, 0.6], [-0.9, 1.5, 0.6], [0.9, 1.5, 0.55], [0, 1.9, 0.5]]); body();
        box(3.6, 1.3, 2.2, frost, 0, 0.65, 0, [0, 0.08, 0]); box(2.6, 1.2, 1.8, ice, 0.1, 1.85, -0.1, [0, -0.1, 0]); box(1.7, 1.3, 1.3, ice, -0.05, 3.05, -0.1, [0, 0.12, 0]); sph(0.9, wh, -0.05, 3.7, -0.1, [1, 0.3, 0.8]);
        cyl(0.26, 0.26, 0.5, glass, -1.1, 0.6, 0.9, null, 12).userData.plain = true; sph(0.26, fleck, 1.0, 0.6, 0.95, [1, 1.1, 1]).userData.plain = true; side.forEach(q => { sph(0.035, black, 1.0 + q * 0.08, 0.66, 1.2).userData.plain = true; });
        face(3.25, 0.57, 1.5); flecks([[0.7, 1.7, 0.82, 0.3], [-0.8, 2.1, 0.82, 0.24], [0.45, 2.75, 0.57, 0.2]]);
        side.forEach(q => { [0, 1, 2].forEach(k => box(0.55 - k * 0.08, 0.5 - k * 0.06, 0.5, ice, q * (1.55 + k * 0.28), 2.3 - k * 0.5, 0.5 + k * 0.15, [0.2 * k, 0, q * 0.3 * k])); });
        tor(0.8, 0.04, M(0x7fb0ea, 0.2, 0, { exact: 1 }), -0.05, 4.2, -0.1, [H + 0.15, 0, 0]); bum(ice, 1.7, 0.85, 0.42, 0.3); } }
  };
  // (builder 19, the owner: "Yes, pushed for all ten") THE OTHER FIVE, drawn the same way, and the fixes to the first five. Each grows in its own
  // way out of its substance and its job. Hydrogen, the lightest thing there is: a bubble on a thread, a balloon holding its own string, a carrier
  // of the hydrogens it drove off, an airship, a small sun. Wood spirit, the drunk: a tipped vial, a child sat down hard, a bottle with a mug, a
  // rider on a cask, a copper still in a wreath. The Seedling: a seed, a thumb pot, a gardener, a bush, a tree out of its broken pot. Ammonia, who
  // sends the reagents round again and cannot bear its own smell: an ampoule, a flask holding its nose, a flask at a crank wheel, a retort whose
  // tube runs round into itself, a cloud with three bottles circling it. Brimstone, who burns the round short: a pebble, a child with a match,
  // a brazier, a furnace stack, a volcano. Faces as they were (hydrogen: white-lit eyes and an o; wood spirit: one eye shut, one brow, red cheeks,
  // an o; seedling: lit eyes and a smile; ammonia: scowl, red nose in a peg, flat mouth; brimstone: a grin with two teeth).
  const wh19 = M(0xffffff, 0.4, 0, { exact: 1 }), omouth = (x, y, z, r) => { sph(r, black, x, y, z, [1, 1.25, 0.35]).userData.plain = true; };
  const eyesW = (y, z, gap, r) => { eyes(y, z, gap, r, 0); side.forEach(q => { sph(r * 0.38, wh19, q * gap + r * 0.3, y + r * 0.3, z + r * 0.75).userData.plain = true; }); };
  const grin19 = (x, y, z, w) => { sph(w, black, x, y, z, [1, 0.5, 0.18]).userData.plain = true; side.forEach(q => { put(new T.ConeGeometry(w * 0.2, w * 0.45, 4), wh19, x + q * w * 0.45, y + w * 0.12, z + w * 0.17, [PI, 0, 0]).userData.plain = true; }); };
  const blush = (y, z, gap, r) => side.forEach(q => { sph(r, M(0xe58a7c, 0.6, 0, { exact: 1 }), q * gap, y, z, [1, 0.7, 0.35]).userData.plain = true; });
  const at19 = (x, y, z, rz, f) => { const g = pivot(x, y, z); g.rotation.z = rz || 0; into(g, f); return g; };
  PUSH.homh2 = s => { const sk = M(0xd6453a, 0.4), cord = M(0x2c2f34, 0.7), hy = M(0xf4f1ea, 0.35, 0, { exact: 1 }), sun = M(0xf0a43a, 0.5, 0, { exact: 1, emissive: lin(0xd6701a), emissiveIntensity: 0.55 }), hot = M(0xf6d25a, 0.5, 0, { exact: 1, emissive: lin(0xf0b93a), emissiveIntensity: 0.6 }), card = M(0xf4efe0, 0.8), sack = M(0xb99a6a, 0.9);
    const face = (y, z, k) => { eyesW(y, z, 0.2 * k, 0.065 * k); omouth(0, y - 0.28 * k, z + 0.03 * k, 0.06 * k); };
    if (s === 1) { /* a bubble on a thread, tied to a weight so it stays */ floor(() => { cyl(0.12, 0.15, 0.1, brass, 0.3, 0.05, 0.25); }); body(); rod([0.3, 0.1, 0.25], [0.02, 0.42, 0.02], 0.015, cord); sph(0.42, sk, 0, 0.84, 0, [1, 1.08, 1]); sph(0.06, sk, 0, 0.4, 0); face(0.9, 0.37, 0.8); shine(-0.18, 1.02, 0.36, 0.06, 0.18); bum(sk, 0.68, 0.3, 0.15, 0.11); }
    else if (s === 2) { /* a child: a balloon with legs, holding its own string, a tag on the end */ body(); sph(0.62, sk, 0, 1.25, 0, [1, 1.12, 1]); cone(0.1, 0.14, 10, sk, 0, 0.52, 0, [PI, 0, 0]); side.forEach(q => { rod([q * 0.2, 0.72, 0], [q * 0.24, 0.3, 0.05], 0.045, sk); sph(0.08, sk, q * 0.24, 0.27, 0.09, [1, 0.6, 1.4]); });
      rod([0.58, 1.2, 0.1], [0.85, 0.85, 0.3], 0.05, sk); sph(0.09, sk, 0.85, 0.85, 0.3); rod([0, 0.5, 0], [0.85, 0.85, 0.3], 0.015, cord); rod([0.85, 0.85, 0.3], [0.95, 0.3, 0.35], 0.015, cord); box(0.22, 0.16, 0.02, card, 0.95, 0.24, 0.35, [0, 0, 0.2]); rod([-0.58, 1.2, 0.1], [-0.9, 1.45, 0.2], 0.05, sk); sph(0.09, sk, -0.9, 1.45, 0.2);
      face(1.35, 0.56, 1); shine(-0.28, 1.55, 0.5, 0.08, 0.26); bum(sk, 0.95, 0.42, 0.2, 0.15); }
    else if (s === 3) { /* a worker: it carries off the hydrogens, one held up in tongs, one in the other hand; a weight keeps it down */ floor(() => { cyl(0.2, 0.25, 0.16, brass, 0.75, 0.08, 0.4); tor(0.08, 0.025, brass, 0.75, 0.2, 0.4); }); body(); rod([0.75, 0.22, 0.4], [0.1, 0.75, 0], 0.018, cord);
      sph(0.7, sk, 0, 1.9, 0, [1, 1.2, 0.95]); sph(0.42, sk, 0, 1.05, 0, [1, 1, 0.95]); side.forEach(q => { rod([q * 0.2, 0.75, 0], [q * 0.26, 0.3, 0.05], 0.05, sk); sph(0.09, sk, q * 0.26, 0.27, 0.1, [1, 0.6, 1.4]); });
      rod([-0.6, 1.7, 0.1], [-1.15, 2.3, 0.3], 0.06, sk); sph(0.1, sk, -1.15, 2.3, 0.3); rod([-1.15, 2.3, 0.3], [-1.3, 2.75, 0.3], 0.025, steel); rod([-1.15, 2.3, 0.3], [-1.0, 2.75, 0.3], 0.025, steel); sph(0.17, hy, -1.15, 2.9, 0.3);
      rod([0.6, 1.7, 0.1], [1.1, 1.5, 0.4], 0.06, sk); sph(0.1, sk, 1.1, 1.5, 0.4); sph(0.17, hy, 1.2, 1.7, 0.45); face(2.05, 0.62, 1.1); shine(-0.32, 2.3, 0.55, 0.09, 0.3); bum(sk, 0.95, 0.36, 0.2, 0.14); }
    else if (s === 4) { /* a master: an airship, moored; fins, a car slung under with three hydrogens aboard, sandbags */ floor(() => { cyl(0.2, 0.25, 0.16, brass, 1.45, 0.08, 0.4); }); body(); rod([1.45, 0.2, 0.4], [0.75, 1.25, 0.1], 0.018, cord);
      sph(1, sk, 0, 2.5, 0, [1.75, 0.8, 0.8]); box(0.6, 0.7, 0.06, sk, -1.65, 2.9, 0, [0, 0, 0.5]); box(0.6, 0.7, 0.06, sk, -1.65, 2.1, 0, [0, 0, -0.5]); box(0.6, 0.06, 0.9, sk, -1.6, 2.5, 0);
      box(1.1, 0.4, 0.55, wood, 0.15, 1.2, 0); [[-0.35, 0.25], [0.65, 0.25], [-0.35, -0.25], [0.65, -0.25]].forEach(p => rod([p[0], 1.4, p[1]], [p[0] * 0.9, 1.85, p[1] * 0.8], 0.018, cord)); [-0.15, 0.15, 0.45].forEach(x => sph(0.15, hy, x, 1.5, 0));
      [-0.42, 0.72].forEach(x => { rod([x, 1.1, 0.3], [x, 0.85, 0.32], 0.012, cord); sph(0.12, sack, x, 0.74, 0.32, [1, 1.2, 1]); }); side.forEach(q => { rod([0.15 + q * 0.2, 1.0, 0], [0.15 + q * 0.24, 0.6, 0.05], 0.045, sk); sph(0.08, sk, 0.15 + q * 0.24, 0.57, 0.1, [1, 0.6, 1.4]); });
      tor(0.2, 0.03, steel, -0.5, 1.2, 0, [0, H, 0]); face(2.6, 0.77, 1.3); shine(-0.8, 2.85, 0.6, 0.1, 0.34); bum(sk, 2.35, 0.62, 0.26, 0.19); }
    else { /* a small god of hydrogen: a little sun, its flares round it, three hydrogens going round it on a ring */ floor(() => { tor(1.15, 0.05, M(0x2c2f34, 0.8), 0, 0.03, 0, [H, 0, 0]).userData.plain = true; }); body();
      sph(1.3, sun, 0, 2.15, 0); for (let i = 0; i < 8; i++) { const a = i * PI / 4 + 0.2; sph(0.34, hot, Math.cos(a) * 1.4, 2.15 + Math.sin(a) * 1.4, -0.2, [1, 1, 0.7]); }
      tor(1.9, 0.035, hot, 0, 2.15, 0, [1.25, 0, 0]).userData.plain = true; [0.5, 2.6, 4.5].forEach(a => sph(0.18, hy, 1.9 * Math.cos(a), 2.15 + 1.9 * Math.sin(a) * 0.315, 1.9 * Math.sin(a) * 0.949));
      side.forEach(q => { rod([q * 0.3, 0.95, 0], [q * 0.34, 0.5, 0.05], 0.05, sun); sph(0.09, sun, q * 0.34, 0.47, 0.1, [1, 0.6, 1.4]); }); face(2.3, 1.24, 2.1); bum(sun, 1.55, 1.05, 0.42, 0.31); } };
  PUSH.homwood = s => { const br = M(0x8a5a2b, 0.5), dk = M(0x5e3c1c, 0.6, 0, { exact: 1 }), cork = M(0xd9b98a, 0.8, 0, { exact: 1 }), lab = M(0xf4efe0, 0.8), wet = M(0xe6d3a8, 0.2, 0, { transparent: true, opacity: 0.5 }), cop = M(0xc87a3c, 0.3, 0.5, { exact: 1 }), lf = M(0x3c9a5f, 0.4), tin = M(0x9aa3ad, 0.35, 0.7);
    const face = (x, y, z, k, rz) => at19(x, y, z, rz, () => { sph(0.085 * k, black, -0.17 * k, 0, 0.02).userData.plain = true; box(0.15 * k, 0.04 * k, 0.03, black, 0.17 * k, 0, 0).userData.plain = true; box(0.18 * k, 0.055 * k, 0.03, black, 0.17 * k, 0.14 * k, 0, [0, 0, -0.3]).userData.plain = true; blush(-0.14 * k, -0.02, 0.33 * k, 0.1 * k); omouth(0.03 * k, -0.32 * k, 0.03, 0.075 * k); });
    const mug = (x, y, z, k) => { cyl(0.2 * k, 0.18 * k, 0.32 * k, tin, x, y, z); tor(0.11 * k, 0.03 * k, tin, x + 0.24 * k, y, z); sph(0.19 * k, wh19, x, y + 0.17 * k, z, [1, 0.45, 1]).userData.plain = true; };
    const hic = L => L.forEach(q => { sph(q[3], wet, q[0], q[1], q[2]).userData.plain = true; });
    if (s === 1) { /* a vial tipped over on its side, its cork rolled away */ floor(() => { cyl(0.1, 0.12, 0.14, cork, 0.85, 0.11, 0.35, [H, 0, 0.4]); cyl(0.4, 0.42, 0.02, wet, 0.6, 0.012, 0.1, null, 20).userData.plain = true; }); body(); cyl(0.27, 0.27, 0.7, br, -0.1, 0.3, 0, [0, 0, H]); sph(0.27, br, -0.45, 0.3, 0, [0.5, 1, 1]); cyl(0.12, 0.12, 0.22, br, 0.36, 0.3, 0, [0, 0, H]); tor(0.12, 0.03, br, 0.47, 0.3, 0, [0, H, 0]);
      face(-0.1, 0.36, 0.27, 0.7, 0.25); bum(br, 0.28, 0.2, 0.12, 0.09); }
    else if (s === 2) { /* a child sat down hard, legs out in front, hiccups going up */ body(); cyl(0.42, 0.46, 0.8, br, 0, 0.45, 0); sph(0.42, br, 0, 0.85, 0, [1, 0.6, 1]); cyl(0.15, 0.17, 0.3, br, 0, 1.18, 0); cyl(0.13, 0.15, 0.16, cork, 0.04, 1.4, 0, [0, 0, -0.3]);
      side.forEach(q => { rod([q * 0.22, 0.14, 0.38], [q * 0.5, 0.08, 0.9], 0.06, dk); sph(0.1, dk, q * 0.5, 0.1, 0.95, [1, 1.3, 0.7]); rod([q * 0.42, 0.6, 0.1], [q * 0.62, 0.2, 0.3], 0.05, dk); sph(0.08, dk, q * 0.62, 0.18, 0.3); });
      hic([[0.55, 1.5, 0.2, 0.09], [0.75, 1.85, 0.2, 0.12], [0.6, 2.2, 0.2, 0.07]]); face(0, 0.72, 0.45, 0.9, -0.1); bum(br, 0.22, 0.4, 0.2, 0.15); }
    else if (s === 3) { /* a worker: a labelled bottle on crossed legs, a mug held high, the other arm out for balance */ floor(() => { cyl(0.5, 0.52, 0.02, wet, 0.9, 0.012, 0.5, null, 20).userData.plain = true; }); body(); rod([-0.22, 0.5, 0], [0.18, 0.07, 0.1], 0.06, dk); rod([0.22, 0.5, 0], [-0.3, 0.07, 0.18], 0.06, dk); sph(0.11, dk, 0.2, 0.07, 0.16, [1, 0.6, 1.5]); sph(0.11, dk, -0.32, 0.07, 0.24, [1, 0.6, 1.5]);
      at19(0, 0.45, 0, -0.16, () => { cyl(0.5, 0.55, 1.3, br, 0, 0.7, 0); sph(0.5, br, 0, 1.35, 0, [1, 0.7, 1]); cyl(0.17, 0.2, 0.5, br, 0, 1.8, 0); tor(0.18, 0.04, br, 0, 2.05, 0, [H, 0, 0]); cyl(0.14, 0.17, 0.2, cork, 0.03, 2.17, 0, [0, 0, -0.25]); box(0.62, 0.36, 0.03, lab, 0, 0.42, 0.54); box(0.4, 0.04, 0.02, black, 0, 0.46, 0.56).userData.plain = true; box(0.26, 0.04, 0.02, black, -0.07, 0.36, 0.56).userData.plain = true;
        rod([0.5, 0.95, 0.1], [1.0, 1.5, 0.3], 0.06, dk); sph(0.1, dk, 1.0, 1.5, 0.3); mug(1.05, 1.72, 0.3, 1); rod([-0.5, 0.95, 0.1], [-1.05, 0.75, 0.3], 0.06, dk); sph(0.1, dk, -1.05, 0.75, 0.3); face(0, 1.05, 0.52, 1, 0.1); bum(br, 0.3, 0.5, 0.24, 0.18); });
      hic([[-0.5, 2.9, 0.1, 0.1], [-0.75, 3.2, 0.1, 0.07]]); }
    else if (s === 4) { /* a master: astride a cask on its stand, the tap running, a tankard up */ floor(() => { cyl(0.55, 0.58, 0.02, wet, 1.35, 0.012, 0.3, null, 20).userData.plain = true; }); body(); side.forEach(q => { box(0.16, 0.5, 1.3, dk, q * 0.6, 0.25, 0); });
      cyl(0.72, 0.72, 1.8, br, 0, 1.05, 0, [0, 0, H]); sph(0.82, br, 0, 1.05, 0, [0.85, 1, 1]); [-0.6, 0.6].forEach(x => tor(0.75, 0.05, tin, x, 1.05, 0, [0, H, 0])); cyl(0.66, 0.66, 0.04, dk, 0.91, 1.05, 0, [0, 0, H]); cyl(0.07, 0.07, 0.3, brass, 1.05, 0.75, 0, [0, 0, H]); box(0.06, 0.2, 0.06, brass, 1.12, 0.87, 0); sph(0.05, wet, 1.2, 0.5, 0, [1, 1.6, 1]).userData.plain = true;
      cyl(0.4, 0.44, 0.85, br, 0, 2.25, 0); sph(0.4, br, 0, 2.68, 0, [1, 0.6, 1]); cyl(0.14, 0.16, 0.34, br, 0, 3.0, 0); cyl(0.12, 0.14, 0.16, cork, 0.04, 3.22, 0, [0, 0, -0.3]); rod([0.15, 1.9, 0.3], [0.2, 1.25, 0.86], 0.06, dk); sph(0.1, dk, 0.2, 1.2, 0.9, [1, 1.3, 0.7]); rod([-0.15, 1.9, -0.3], [-0.2, 1.25, -0.86], 0.06, dk);
      rod([0.4, 2.4, 0.1], [0.95, 3.0, 0.2], 0.055, dk); sph(0.09, dk, 0.95, 3.0, 0.2); mug(1.0, 3.22, 0.2, 1.1); rod([-0.4, 2.4, 0.1], [-0.95, 2.1, 0.3], 0.055, dk); sph(0.09, dk, -0.95, 2.1, 0.3); face(0, 2.5, 0.43, 0.9, -0.12); bum(br, 2.0, 0.4, 0.19, 0.14); }
    else { /* a small god of the spirit: a copper still with a face, its swan neck running down a coil into a bottle; a wreath on its head, a cup raised */ floor(() => { cyl(0.6, 0.63, 0.02, wet, -1.5, 0.012, 0.9, null, 20).userData.plain = true; }); body(); [0.5, 2.6, 4.7].forEach(a => rod([Math.cos(a) * 0.8, 0.5, Math.sin(a) * 0.8], [Math.cos(a) * 1.0, 0.03, Math.sin(a) * 1.0], 0.09, dk));
      sph(1.25, cop, 0, 1.4, 0, [1, 0.92, 1]); tor(1.25, 0.05, dk, 0, 1.4, 0, [H, 0, 0]); sph(0.62, cop, 0, 2.6, 0, [1, 0.9, 1]); tor(0.6, 0.09, lf, 0, 2.72, 0, [H, 0, 0]); for (let i = 0; i < 7; i++) { const a = i * 0.9; sph(0.14, lf, Math.cos(a) * 0.66, 2.8, Math.sin(a) * 0.66, [1.3, 0.5, 0.8]); }
      rod([0, 3.05, 0], [0.35, 3.5, 0], 0.11, cop); rod([0.35, 3.5, 0], [1.45, 3.3, 0], 0.09, cop); rod([1.45, 3.3, 0], [1.75, 2.45, 0], 0.07, cop); sph(0.11, cop, 0.35, 3.5, 0); sph(0.09, cop, 1.45, 3.3, 0); [0, 1, 2, 3].forEach(i => tor(0.26, 0.05, cop, 1.75, 2.3 - i * 0.3, 0, [H, 0, 0])); rod([1.75, 1.3, 0], [1.75, 0.95, 0], 0.05, cop);
      cyl(0.26, 0.29, 0.5, br, 1.75, 0.27, 0); cyl(0.1, 0.12, 0.3, br, 1.75, 0.67, 0); rod([-1.15, 1.5, 0.3], [-1.75, 2.15, 0.6], 0.12, cop); sph(0.17, cop, -1.75, 2.15, 0.6); cone(0.24, 0.34, 14, gold, -1.78, 2.55, 0.6, [PI, 0, 0]); cyl(0.03, 0.03, 0.2, gold, -1.78, 2.32, 0.6);
      rod([1.15, 1.3, 0.3], [1.5, 0.9, 0.75], 0.12, cop); sph(0.17, cop, 1.5, 0.9, 0.75); face(0, 1.62, 1.27, 1.8, 0.08); hic([[-0.9, 3.3, 0.2, 0.13], [-1.2, 3.65, 0.2, 0.09]]); bum(cop, 0.95, 0.95, 0.45, 0.33); } };
  PUSH.homseed = s => { const clay = M(0xc26a3a, 0.7, 0, { exact: 1 }), soil = M(0x3a2a1e, 0.9, 0, { exact: 1 }), lf = M(0x3c9a5f, 0.4), lf2 = M(0x7fd14a, 0.4, 0, { exact: 1 }), seed = M(0xb08a5a, 0.6, 0, { exact: 1 }), bark = M(0x7a5230, 0.8, 0, { exact: 1 }), rootm = M(0xe9e4d2, 0.6, 0, { exact: 1 }), fr = M(0xd6453a, 0.4), tin = M(0x9aa3ad, 0.35, 0.7);
    const face = (y, z, k) => { eyesW(y, z, 0.2 * k, 0.06 * k); smile(0, y - 0.2 * k, z + 0.04, 0.13 * k); };
    const leaf = (x, y, z, r, rz, m) => { sph(r, m || lf, x, y, z, [1.6, 0.3, 0.85]).rotation.z = rz; };
    const pot = (r, h, y) => { cyl(r, r * 0.7, h, clay, 0, y + h / 2, 0); tor(r, r * 0.11, clay, 0, y + h, 0, [H, 0, 0]); cyl(r * 0.9, r * 0.9, 0.04, soil, 0, y + h + 0.01, 0).userData.plain = true; };
    if (s === 1) { /* a seed in a pinch of soil, its first shoot up */ body(); sph(0.5, soil, 0, 0.06, 0, [1.2, 0.4, 1]); sph(0.36, seed, 0, 0.46, 0, [0.85, 1.1, 0.8]); rod([0, 0.8, 0], [0.05, 1.05, 0], 0.03, lf2); leaf(0.17, 1.07, 0, 0.12, 0.4, lf2); face(0.52, 0.28, 0.7); bum(seed, 0.34, 0.2, 0.12, 0.09); }
    else if (s === 2) { /* a child in a thumb pot on root legs, two leaves held up like arms */ body(); legs(0.24, 0.16, rootm, 0.05); pot(0.44, 0.5, 0.2); rod([0, 0.7, 0], [0, 1.25, 0], 0.045, lf2); leaf(0.26, 1.33, 0, 0.2, 0.55, lf2); leaf(-0.26, 1.33, 0, 0.2, -0.55, lf2); face(0.52, 0.38, 0.8); bum(clay, 0.4, 0.3, 0.15, 0.11); }
    else if (s === 3) { /* a worker: a gardener watering its own soil, four leaves and a bud */ body(); legs(0.3, 0.2, rootm, 0.06); pot(0.62, 0.75, 0.25); rod([0, 1.0, 0], [0.06, 2.15, 0], 0.055, lf); [[0.3, 1.4, 0.5, lf], [-0.3, 1.65, -0.5, lf2], [0.34, 1.95, 0.45, lf2], [-0.26, 2.15, -0.6, lf]].forEach(q => leaf(q[0], q[1], 0, 0.24, q[2], q[3])); sph(0.15, fr, 0.08, 2.3, 0);
      rod([0.55, 0.75, 0.1], [1.1, 1.3, 0.3], 0.05, lf); cyl(0.26, 0.26, 0.4, tin, 1.3, 1.5, 0.3); rod([1.1, 1.45, 0.3], [0.55, 1.75, 0.3], 0.045, tin); sph(0.09, tin, 0.52, 1.77, 0.3, [0.6, 1, 1]); tor(0.17, 0.03, tin, 1.58, 1.52, 0.3); [0.2, 0.0].forEach((d, i) => { sph(0.04, M(0x7fb0ea, 0.2, 0, { exact: 1 }), 0.45 - i * 0.05, 1.55 - d * 1.2, 0.3, [1, 1.6, 1]).userData.plain = true; });
      rod([-0.55, 0.75, 0.1], [-0.95, 0.5, 0.3], 0.05, lf); face(0.7, 0.55, 1.0); bum(clay, 0.55, 0.42, 0.2, 0.15); }
    else if (s === 4) { /* a master: a bush in flower too big for its pot, roots out of the cracks for feet, a trowel in a vine */ body(); side.forEach(q => { rod([q * 0.55, 0.45, 0.3], [q * 1.05, 0.06, 0.55], 0.07, rootm); rod([q * 0.5, 0.4, -0.3], [q * 0.95, 0.06, -0.5], 0.06, rootm); }); pot(0.88, 0.95, 0.12); box(0.03, 0.5, 0.02, black, 0.5, 0.75, 0.62, [0, 0.6, 0.3]).userData.plain = true;
      rod([0, 1.05, 0], [0, 1.95, 0], 0.15, bark); sph(0.85, lf, 0, 2.6, 0); sph(0.6, lf2, -0.7, 2.3, 0.2); sph(0.6, lf, 0.75, 2.35, 0.1); sph(0.5, lf2, 0.2, 3.15, 0.1); [[-0.75, 2.5, 0.72], [0.1, 2.9, 0.78], [0.8, 2.55, 0.62], [-0.2, 2.2, 0.8], [0.35, 3.35, 0.5]].forEach(q => { sph(0.12, fr, q[0], q[1], q[2]); sph(0.05, gold, q[0], q[1], q[2] + 0.1).userData.plain = true; });
      rod([0.8, 0.8, 0.1], [1.5, 1.45, 0.3], 0.05, lf); rod([1.5, 1.45, 0.3], [1.5, 1.8, 0.3], 0.05, wood); box(0.26, 0.4, 0.04, steel, 1.5, 2.1, 0.3); rod([-0.8, 0.8, 0.1], [-1.35, 0.6, 0.3], 0.05, lf); leaf(-1.5, 0.6, 0.3, 0.16, 0.2, lf2); face(0.66, 0.76, 1.2); bum(clay, 0.5, 0.6, 0.26, 0.2); }
    else { /* a small god of growing things: a tree, its pot in shards at its foot, six atoms hanging in it like fruit */ floor(() => { [[-1.5, 0.5, 0.5], [1.45, 0.7, -0.4], [0.9, 1.1, 0.9]].forEach(q => box(0.5, 0.36, 0.08, clay, q[0], 0.16, q[1], [0.9, q[2], 0.2])); }); body();
      [0.3, 1.5, 2.8, 3.9, 5.2].forEach(a => { rod([Math.cos(a) * 0.4, 0.5, Math.sin(a) * 0.4], [Math.cos(a) * 1.5, 0.07, Math.sin(a) * 1.3], 0.13, bark); sph(0.13, bark, Math.cos(a) * 1.5, 0.07, Math.sin(a) * 1.3); });
      cyl(0.5, 0.78, 1.8, bark, 0, 1.1, 0, null, 12); rod([0.4, 1.7, 0], [1.4, 2.3, 0.2], 0.14, bark); rod([-0.4, 1.7, 0], [-1.35, 2.25, 0.2], 0.14, bark); sph(1.1, lf, 0, 2.85, 0, [1.2, 0.85, 1]); sph(0.78, lf2, -1.25, 2.65, 0.1); sph(0.78, lf, 1.3, 2.7, 0.1); sph(0.6, lf2, 0.3, 3.5, 0);
      [[-1.3, 2.3, 0.75, 0xd6453a], [-0.55, 2.6, 0.95, 0x2c2f34], [0.2, 2.35, 1.0, 0xf4f1ea], [0.9, 2.6, 0.85, 0x3a6fd0], [1.5, 2.35, 0.7, 0x2c2f34], [0.3, 3.3, 0.6, 0xd6453a]].forEach(q => { rod([q[0], q[1] + 0.35, q[2] - 0.1], [q[0], q[1] + 0.1, q[2]], 0.015, bark); sph(0.16, M(q[3], 0.35, 0, { exact: 1 }), q[0], q[1], q[2]); });
      face(1.25, 0.6, 1.6); bum(bark, 0.75, 0.6, 0.3, 0.22); } };
  PUSH.homammonia = s => { const gl = M(0xdfeacc, 0.1, 0, { transparent: true, opacity: 0.4, glass: 0xdcecc8, op: 0.72 }), cr = M(0xf4efe0, 0.5), cork = M(0xd6453a, 0.7), lab = M(0x3a6fd0, 0.5), fume = M(0xf0e9a8, 0.9, 0, { transparent: true, opacity: 0.5 }), cloud = M(0xe4dc98, 0.9, 0, { exact: 1 }), cloud2 = M(0xf1ecc0, 0.9, 0, { exact: 1 }), nose = M(0xd6453a, 0.6), peg = M(0xb99a6a, 0.8, 0, { exact: 1 });
    const face = (y, z, k) => { eyes(y, z, 0.15 * k, 0.055 * k, 0); side.forEach(q => { box(0.16 * k, 0.045 * k, 0.03, black, q * 0.15 * k, y + 0.1 * k, z - 0.02, [0, 0, q * 0.45]).userData.plain = true; box(0.05 * k, 0.3 * k, 0.06 * k, peg, q * 0.06 * k, y - 0.1 * k, z + 0.24 * k, [0.5, 0, q * 0.12]); }); sph(0.1 * k, nose, 0, y - 0.18 * k, z + 0.12 * k); box(0.2 * k, 0.04 * k, 0.03, black, 0, y - 0.38 * k, z + 0.05 * k).userData.plain = true; };
    const puff = L => L.forEach(q => { sph(q[3], fume, q[0], q[1], q[2]).userData.plain = true; }), bottle = (x, y, z, c) => { cyl(0.13, 0.14, 0.26, M(c, 0.4, 0, { exact: 1 }), x, y, z); cyl(0.05, 0.06, 0.12, M(c, 0.4, 0, { exact: 1 }), x, y + 0.19, z); };
    if (s === 1) { /* an ampoule with a red stopper, one puff getting out */ body(); sph(0.4, gl, 0, 0.45, 0); cyl(0.1, 0.14, 0.3, gl, 0, 0.95, 0); sph(0.11, cork, 0, 1.15, 0); box(0.14, 0.14, 0.14, cr, -0.1, 0.2, 0, [0.4, 0.5, 0.2]).userData.plain = true; face(0.56, 0.36, 0.75); puff([[0.35, 1.3, 0, 0.1]]); bum(gl, 0.3, 0.3, 0.14, 0.1); }
    else if (s === 2) { /* a child: a round flask on legs, one hand over its nose, the other waving the smell off */ body(); legs(0.42, 0.2, black, 0.05); sph(0.6, gl, 0, 0.95, 0); cyl(0.16, 0.2, 0.5, gl, 0, 1.7, 0); cyl(0.14, 0.17, 0.16, cork, 0, 2.0, 0); [[-0.2, 0.5, 0.1], [0.15, 0.48, -0.1]].forEach(q => { box(0.18, 0.18, 0.18, cr, q[0], q[1], q[2], [0.5, 0.6, 0.3]).userData.plain = true; });
      face(1.1, 0.55, 1); rod([0.56, 0.95, 0.2], [0.14, 0.94, 0.78], 0.045, black); sph(0.085, black, 0.1, 0.94, 0.8); rod([-0.56, 0.95, 0.2], [-1.0, 1.4, 0.3], 0.045, black); sph(0.085, black, -1.0, 1.4, 0.3); puff([[-0.75, 1.9, 0.1, 0.13], [-0.45, 2.3, 0.1, 0.1]]); bum(gl, 0.7, 0.45, 0.2, 0.15); }
    else if (s === 3) { /* a worker at a crank wheel: one turn sends the reagents round again; a paper fan in the other hand */ floor(() => { rod([1.35, 0.03, 0.2], [1.35, 1.25, 0.2], 0.05, dark); cyl(0.3, 0.34, 0.08, dark, 1.35, 0.04, 0.2); }); body(); legs(0.5, 0.26, black, 0.06);
      cyl(0.28, 0.78, 1.25, gl, 0, 1.1, 0); cyl(0.2, 0.24, 0.45, gl, 0, 1.95, 0); cyl(0.17, 0.2, 0.18, cork, 0, 2.25, 0); box(0.5, 0.26, 0.03, lab, 0, 0.75, 0.66, [-0.38, 0, 0]); [[-0.3, 0.6, 0.1], [0.2, 0.6, -0.1], [0, 0.62, 0.25]].forEach(q => { box(0.2, 0.2, 0.2, cr, q[0], q[1], q[2], [0.5, 0.6, 0.3]).userData.plain = true; });
      tor(0.55, 0.055, steel, 1.35, 1.25, 0.3); rod([0.8, 1.25, 0.3], [1.9, 1.25, 0.3], 0.03, steel); rod([1.35, 0.7, 0.3], [1.35, 1.8, 0.3], 0.03, steel); cyl(0.05, 0.05, 0.28, red, 1.0, 1.6, 0.45, [H, 0, 0]); rod([0.42, 1.25, 0.2], [0.98, 1.6, 0.5], 0.05, black); sph(0.09, black, 1.0, 1.6, 0.55);
      rod([-0.42, 1.25, 0.2], [-0.95, 1.7, 0.3], 0.05, black); rod([-0.95, 1.7, 0.3], [-1.05, 2.1, 0.3], 0.025, wood); cyl(0.36, 0.36, 0.03, paper, -1.1, 2.42, 0.3, [H, 0, 0.2], 18); face(1.42, 0.5, 1); puff([[-0.45, 2.75, 0.1, 0.14], [-0.15, 3.1, 0.1, 0.1], [0.3, 2.7, 0, 0.09]]); bum(gl, 0.72, 0.62, 0.24, 0.18); }
    else if (s === 4) { /* a master: a retort whose own tube runs out of its neck and round into its belly again; bellows in its hands */ body(); legs(0.5, 0.3, black, 0.07); sph(0.88, gl, 0, 1.3, 0, [1, 1.08, 1]); cyl(0.24, 0.3, 0.9, gl, 0, 2.5, 0); tor(0.26, 0.05, gl, 0, 2.95, 0, [H, 0, 0]);
      tor(0.85, 0.08, cloud, 0.6, 2.2, 0, [0, 0, -H], PI * 1.28); sph(0.14, cloud, 0.6, 1.35, 0.0); [[-0.3, 0.75, 0.1], [0.25, 0.72, -0.1], [0, 0.78, 0.3], [0.05, 0.98, 0.05]].forEach(q => { box(0.24, 0.24, 0.24, cr, q[0], q[1], q[2], [0.5, 0.6, 0.3]).userData.plain = true; }); box(0.5, 0.26, 0.03, lab, 0, 0.7, 0.72, [0.5, 0, 0]);
      rod([-0.8, 1.4, 0.2], [-1.3, 1.2, 0.6], 0.055, black); rod([-0.6, 1.0, 0.5], [-1.2, 0.95, 0.75], 0.055, black); box(0.6, 0.12, 0.45, wood, -1.5, 1.25, 0.7, [0, 0, 0.25]); box(0.6, 0.12, 0.45, wood, -1.5, 0.95, 0.7, [0, 0, -0.25]); cone(0.08, 0.4, 10, steel, -1.95, 1.1, 0.7, [0, 0, H]);
      face(1.5, 0.83, 1.3); puff([[-2.3, 1.15, 0.7, 0.13], [-2.6, 1.3, 0.7, 0.09], [1.3, 3.2, 0, 0.13], [1.6, 3.5, 0, 0.09]]); bum(gl, 0.9, 0.7, 0.28, 0.2); }
    else { /* a small god of the stink: a cloud standing on its own whirl, three reagent bottles going round and round it */ floor(() => { cyl(0.9, 0.95, 0.02, fume, 0, 0.012, 0, null, 22).userData.plain = true; }); body(); put(new T.ConeGeometry(0.95, 1.7, 18), cloud, 0, 0.9, 0, [PI, 0, 0]); [0, 1, 2, 3].forEach(i => { tor(0.28 + i * 0.2, 0.05, cloud2, 0, 0.35 + i * 0.4, 0, [H + 0.12, 0, 0.1]).userData.plain = true; });
      sph(1.15, cloud, 0, 2.5, 0, [1.2, 0.9, 1]); sph(0.75, cloud2, -1.2, 2.4, 0.1); sph(0.75, cloud2, 1.2, 2.45, 0.1); sph(0.7, cloud, -0.5, 3.2, 0); sph(0.75, cloud2, 0.55, 3.25, -0.05);
      tor(2.0, 0.03, cr, 0, 1.3, 0, [H, 0, 0]).userData.plain = true; [[0.9, 0x3a6fd0], [2.3, 0xd6453a], [4.6, 0x3c9a5f]].forEach(q => bottle(2.0 * Math.cos(q[0]), 1.3, 2.0 * Math.sin(q[0]), q[1])); face(2.6, 1.05, 1.4); bum(cloud, 2.05, 0.9, 0.42, 0.3); } };
  PUSH.hombrimstone = s => { const sul = M(0xf0b93a, 0.6), sul2 = M(0xd99a1e, 0.7, 0, { exact: 1 }), stn = M(0x2c2f34, 0.7), stn2 = M(0x55555c, 0.8, 0, { exact: 1 }), ember = glow(0xd6453a), fire = M(0xf08a2a, 0.4, 0, { exact: 1, emissive: lin(0xf08a2a), emissiveIntensity: 0.8 }), smoke = M(0x6f6a66, 0.9, 0, { transparent: true, opacity: 0.55 });
    const face = (y, z, k) => { eyes(y, z, 0.22 * k, 0.07 * k, 0); brow(y + 0.15 * k, z + 0.02, 0.22 * k, 0.2 * k, 0.35); grin19(0, y - 0.3 * k, z + 0.03 * k, 0.2 * k); };
    const flame = (x, y, z, k) => { sph(0.1 * k, ember, x, y, z).userData.plain = true; cone(0.09 * k, 0.26 * k, 8, fire, x, y + 0.2 * k, z).userData.plain = true; }, puffs = L => L.forEach(q => { sph(q[3], smoke, q[0], q[1], q[2]).userData.plain = true; });
    if (s === 1) { /* a yellow pebble with a grin, a wisp coming off it */ body(); sph(0.42, sul, 0, 0.38, 0, [1.1, 0.85, 1]); face(0.5, 0.37, 0.8); puffs([[0.2, 0.9, 0, 0.08], [0.32, 1.1, 0, 0.05]]); bum(sul, 0.26, 0.3, 0.14, 0.1); }
    else if (s === 2) { /* a child with its first match, lit */ body(); legs(0.45, 0.22, stn, 0.05); sph(0.6, sul, 0, 0.95, 0, [1, 1.05, 0.95]); [[-0.35, 1.35, 0.2], [0.3, 0.6, 0.35], [-0.4, 0.7, 0.2]].forEach(q => { sph(0.12, sul2, q[0], q[1], q[2], [1, 0.6, 1]).userData.plain = true; });
      rod([0.55, 0.95, 0.15], [0.95, 1.25, 0.35], 0.05, stn); sph(0.09, stn, 0.95, 1.25, 0.35); rod([0.95, 1.1, 0.35], [0.95, 1.85, 0.35], 0.03, wood); flame(0.95, 1.92, 0.35, 1); rod([-0.55, 0.95, 0.15], [-0.9, 0.7, 0.3], 0.05, stn); sph(0.09, stn, -0.9, 0.7, 0.3); face(1.08, 0.55, 1); bum(sul, 0.72, 0.45, 0.2, 0.15); }
    else if (s === 3) { /* a worker: it sits in a stone brazier of its own coals and carries a torch */ body(); legs(0.5, 0.32, black, 0.06); cyl(0.9, 0.55, 0.7, stn, 0, 0.85, 0, null, 8); tor(0.86, 0.07, stn2, 0, 1.2, 0, [H, 0, 0]); [[-0.55, 0.3], [0.5, 0.35], [0, 0.6], [0.6, -0.2]].forEach(q => { sph(0.16, ember, q[0], 1.27, q[1]).userData.plain = true; });
      sph(0.62, sul, 0, 1.7, 0); face(1.78, 0.57, 1.05); rod([0.75, 1.0, 0.2], [1.3, 1.5, 0.4], 0.07, stn); sph(0.11, stn, 1.3, 1.5, 0.4); rod([1.3, 1.3, 0.4], [1.3, 2.3, 0.4], 0.05, wood); cyl(0.12, 0.08, 0.2, stn2, 1.3, 2.35, 0.4); flame(1.3, 2.5, 0.4, 1.6);
      rod([-0.75, 1.0, 0.2], [-1.25, 1.2, 0.4], 0.07, stn); rod([-1.25, 1.2, 0.4], [-1.6, 1.55, 0.4], 0.02, steel); rod([-1.25, 1.2, 0.4], [-1.65, 1.4, 0.4], 0.02, steel); sph(0.1, ember, -1.68, 1.52, 0.4).userData.plain = true; bum(stn, 0.75, 0.62, 0.26, 0.2); }
    else if (s === 4) { /* a master: it has built itself a furnace stack and stokes it, its head out of the top in the smoke */ body(); cyl(0.6, 0.98, 2.2, stn, 0, 1.15, 0, null, 8); tor(0.6, 0.09, stn2, 0, 2.25, 0, [H, 0, 0]); box(0.55, 0.45, 0.06, fire, 0, 0.45, 0.9, [-0.17, 0, 0]).userData.plain = true; box(0.7, 0.6, 0.05, stn2, 0, 0.45, 0.88, [-0.17, 0, 0]);
      [[-0.6, 1.4, 0.5], [0.55, 1.0, 0.6], [0.3, 1.8, 0.55], [-0.45, 0.8, 0.7]].forEach(q => { sph(0.17, sul2, q[0], q[1], q[2], [1, 0.7, 0.6]).userData.plain = true; }); sph(0.58, sul, 0, 2.62, 0); face(2.7, 0.54, 1);
      rod([0.75, 1.5, 0.2], [1.35, 1.2, 0.5], 0.08, stn); sph(0.12, stn, 1.35, 1.2, 0.5); rod([1.6, 1.75, 0.5], [0.7, 0.4, 0.9], 0.03, steel); sph(0.07, ember, 0.68, 0.38, 0.92).userData.plain = true; rod([-0.75, 1.5, 0.2], [-1.3, 1.25, 0.5], 0.08, stn); sph(0.12, stn, -1.3, 1.25, 0.5); rod([-1.3, 1.9, 0.5], [-1.3, 0.5, 0.5], 0.035, wood); box(0.36, 0.36, 0.05, steel, -1.3, 0.35, 0.5);
      puffs([[0.5, 3.3, -0.2, 0.2], [0.85, 3.65, -0.2, 0.16], [0.2, 3.7, -0.3, 0.12]]); bum(stn, 0.6, 0.86, 0.3, 0.22); }
    else { /* a small god of brimstone: a volcano, lava down its sides, its head in the crater, two stone fists */ floor(() => { [[-1.9, 1.0], [1.7, 1.2], [0.4, 1.9]].forEach(q => { sph(0.22, sul, q[0], 0.08, q[1], [1.3, 0.4, 1]); }); }); body(); cyl(0.78, 2.0, 2.3, stn, 0, 1.15, 0, null, 9); tor(0.78, 0.1, stn2, 0, 2.3, 0, [H, 0, 0]); cyl(0.7, 0.7, 0.06, fire, 0, 2.33, 0).userData.plain = true;
      [0.5, 1.45, 2.5].forEach((a, i) => { const c = Math.cos(a), z = Math.sin(a), b = 0.55 + i * 0.12; rod([c * 0.8, 2.28, z * 0.8], [c * (0.8 + 1.22 * b), 2.28 - 2.3 * b, z * (0.8 + 1.22 * b)], 0.075, fire).userData.plain = true; sph(0.11, ember, c * (0.8 + 1.22 * b), 2.28 - 2.3 * b, z * (0.8 + 1.22 * b)).userData.plain = true; });
      sph(0.8, sul, 0, 2.9, 0, [1, 0.95, 0.95]); [[-0.35, 3.6, 0], [0.3, 3.65, 0.1], [0, 3.7, -0.2]].forEach(q => sph(0.2, sul2, q[0], q[1], q[2], [1, 0.7, 1])); face(3.0, 0.74, 1.4);
      side.forEach(q => { rod([q * 1.3, 1.2, 0.5], [q * 1.95, 0.85, 0.9], 0.14, stn); sph(0.36, stn2, q * 1.95, 0.75, 0.95, [1, 0.9, 1]); }); puffs([[0.9, 3.75, -0.3, 0.2], [1.3, 4.0, -0.3, 0.14]]); bum(stn, 0.7, 1.62, 0.5, 0.36); } };
  // the fixes to the first five. Water 5: a great wave, a wall of water curling over with foam at its lip, not a tall blob.
  { const w0 = PUSH.homwater, c0 = PUSH.homco2, a0 = PUSH.homsalt, l0 = PUSH.homslime;
    PUSH.homwater = s => { if (s !== 5) return w0(s); const sk = M(0x3a6fd0, 0.3), dp = M(0x2a55ad, 0.35, 0, { exact: 1 }), lite = M(0x7fb0ea, 0.25, 0, { exact: 1 }), foam = M(0xf2f6f8, 0.5, 0, { exact: 1 }), wet = M(0xcfe3ee, 0.1, 0, { transparent: true, opacity: 0.5 });
      floor(() => { cyl(2.1, 2.16, 0.03, wet, 0, 0.012, 0.2, null, 36).userData.plain = true; }); body(); sph(1.5, dp, 0.1, 0.35, 0, [1.4, 0.45, 0.85]); sph(1.15, sk, -0.6, 0.95, -0.05, [1.15, 0.95, 0.75]);
      const cx = 0.3, cy = 1.95, Rr = 1.3; for (let i = 0; i < 11; i++) { const a = -0.45 + i * 0.355, x = cx - Rr * Math.cos(a), y = cy + Rr * Math.sin(a), r = 0.92 - i * 0.058; sph(r, i > 7 ? lite : sk, x, y, -0.1, [1, 1, 0.72]); if (i >= 4) sph(0.16 + (i % 2) * 0.05, foam, x - Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, 0.25).userData.plain = true; }
      [[1.75, 1.75], [1.45, 1.6], [1.95, 2.0], [1.6, 1.9]].forEach((q, i) => { sph(0.2 - i * 0.02, foam, q[0], q[1], 0.2 + i * 0.08).userData.plain = true; }); [0.5, 0.9, 1.3].forEach(k => { tor(Rr - 0.5, 0.035, lite, cx, cy, 0.45, [0, 0, 0.5 + k * 0.4], 0.5).userData.plain = true; });
      at19(-0.6, 0, 0, 0, () => { eyes(1.3, 0.8, 0.26, 0.09, 0); smile(0, 0.98, 0.84, 0.17); brow(1.53, 0.8, 0.26, 0.26, -0.3); shine(-0.6, 1.2, 0.7, 0.12, 0.42); bum(sk, 0.8, 0.72, 0.42, 0.3); });
      rod([-1.3, 0.9, 0.3], [-1.9, 1.5, 0.7], 0.18, sk); sph(0.28, sk, -1.9, 1.55, 0.7); tor(0.26, 0.05, foam, -1.8, 1.38, 0.7, [H, 0.5, 0]); rod([0.3, 0.6, 0.6], [1.0, 0.45, 1.0], 0.18, sk); sph(0.26, sk, 1.05, 0.45, 1.05);
      box(0.5, 0.08, 0.5, wood, 1.3, 0.62, 0.55, [0.2, 0.4, -0.15]); [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(p => rod([1.3 + p[0] * 0.18, 0.6, 0.55 + p[1] * 0.18], [1.3 + p[0] * 0.2, 0.32, 0.55 + p[1] * 0.2], 0.03, wood)); };
    // Dry ice 5: a glacier: a wide tongue of ice coming down between two snowed hills, crevasses in its front, its face in the ice wall
    PUSH.homco2 = s => { if (s !== 5) return c0(s); const ice = M(0xb4d2e4, 0.3, 0, { exact: 1 }), snow = M(0xe9f0f3, 0.6, 0, { exact: 1 }), deep = M(0x4f8cc4, 0.25, 0, { exact: 1 }), mist = M(0xdcecf4, 0.9, 0, { transparent: true, opacity: 0.55 }), wool = M(0xd6453a, 0.7), rock = M(0x55555c, 0.8, 0, { exact: 1 });
      floor(() => { [[-1.9, 1.3, 0.5], [1.8, 1.4, 0.5], [0, 1.9, 0.6]].forEach(q => { sph(q[2], mist, q[0], 0.14, q[1], [1.3, 0.35, 1]).userData.plain = true; }); cyl(0.9, 0.95, 0.03, deep, 0.3, 0.012, 1.7, null, 22).userData.plain = true; }); body();
      sph(1.0, rock, -1.25, 1.9, -0.9, [1, 1.35, 0.8]); sph(0.7, snow, -1.25, 2.8, -0.9, [1.05, 0.75, 0.85]); sph(0.85, rock, 1.2, 1.7, -0.9, [1.1, 1.3, 0.8]); sph(0.6, snow, 1.2, 2.45, -0.9, [1.1, 0.7, 0.85]);
      box(3.5, 1.1, 1.5, ice, 0, 1.25, -0.35, [0, 0.04, 0.03]); box(3.4, 0.16, 1.45, snow, 0, 1.86, -0.35, [0, 0.04, 0.03]); box(3.9, 1.0, 1.2, ice, 0, 0.5, 0.5, [0, -0.03, 0]); box(3.8, 0.14, 1.15, snow, 0, 1.05, 0.48, [0, -0.03, 0]); sph(1.0, ice, 0, 0.25, 1.1, [1.9, 0.4, 0.7]);
      [[-1.5, 0.5, 0.75, 0.1], [-0.95, 0.42, 0.6, -0.12], [1.0, 0.5, 0.7, 0.08], [1.55, 0.42, 0.55, -0.1]].forEach(q => { box(0.07, q[2], 0.04, deep, q[0], q[1], 1.12, [0, 0, q[3]]).userData.plain = true; }); [[-1.2, 1.3, 0.5, 0.15], [1.25, 1.35, 0.45, -0.1]].forEach(q => { box(0.07, q[2], 0.04, deep, q[0], q[1], 0.42, [0, 0, q[3]]).userData.plain = true; });
      [[-0.9, 2.15, -0.2, 0.5, 0.3], [-0.2, 2.25, -0.5, 0.65, -0.2], [0.6, 2.12, -0.2, 0.45, 0.25]].forEach(q => { box(q[3], q[3] * 1.1, q[3], ice, q[0], q[1], q[2], [0.1, 0.4, q[4]]); box(q[3] * 0.9, 0.1, q[3] * 0.9, snow, q[0] - q[4] * q[3] * 0.5, q[1] + q[3] * 0.58, q[2], [0.1, 0.4, q[4]]).userData.plain = true; });
      eyes(0.78, 1.12, 0.3, 0.09, 0); box(0.6, 0.24, 0.02, black, 0, 0.36, 1.115).userData.plain = true; box(0.52, 0.16, 0.02, wh19, 0, 0.36, 1.13).userData.plain = true; [-1, 0, 1].forEach(j => { box(0.025, 0.16, 0.02, black, j * 0.13, 0.36, 1.145).userData.plain = true; });
      box(3.95, 0.2, 0.08, wool, 0, 1.0, 1.13, [0, -0.03, 0]); box(0.22, 0.6, 0.08, wool, 1.4, 0.68, 1.16, [0, 0, 0.12]); side.forEach(q => { box(0.6, 0.5, 0.6, ice, q * 2.2, 0.3, 1.0, [0, q * 0.3, 0]); });
      tor(0.5, 0.04, deep, -1.25, 3.6, -0.9, [H, 0, 0]).userData.plain = true; at19(0, 0, -0.6, 0, () => bum(ice, 1.0, 0.6, 0.5, 0.36)); };
    // Salt 4: the great crystal clear, its edges bright, so what is inside can be seen
    PUSH.homsalt = s => { a0(s); if (s === 4 && R.body) into(R.body, () => { const ed = M(0xffffff, 0.3, 0, { exact: 1 }), g = pivot(0, 1.5, -0.1); g.rotation.y = 0.08; into(g, () => { [-1, 1].forEach(a => [-1, 1].forEach(b => { rod([a * 1.0, -1.0, b * 0.85], [a * 1.0, 1.0, b * 0.85], 0.03, ed).userData.plain = true; rod([-1.0, a * 1.0, b * 0.85], [1.0, a * 1.0, b * 0.85], 0.03, ed).userData.plain = true; rod([a * 1.0, b * 1.0, -0.85], [a * 1.0, b * 1.0, 0.85], 0.03, ed).userData.plain = true; })); box(0.5, 0.06, 0.02, ed, -0.55, 0.6, 0.86, [0, 0, 0.7]).userData.plain = true; box(0.25, 0.05, 0.02, ed, -0.3, 0.72, 0.86, [0, 0, 0.7]).userData.plain = true; }); }); };
    // Slime 3: the flask it has caught is a real flask, glass with a rim and something in it, stuck to its head on strings of itself
    PUSH.homslime = s => { l0(s); if (s === 3 && R.body) into(R.body, () => { const gl2 = M(0xdfeef4, 0.15, 0, { exact: 1 }), in3 = M(0x2fd0c4, 0.3, 0, { exact: 1 }), goo2 = M(0x8a5ad0, 0.2, 0, { exact: 1 }), g = pivot(0.55, 1.75, 0.1); g.rotation.z = -0.5; into(g, () => { cyl(0.13, 0.55, 0.8, gl2, 0, 0.4, 0, null, 18); cyl(0.13, 0.13, 0.32, gl2, 0, 0.95, 0, null, 14); tor(0.14, 0.04, gl2, 0, 1.12, 0, [H, 0, 0]); cyl(0.3, 0.5, 0.3, in3, 0, 0.17, 0.06, null, 18).userData.plain = true; [0.45, 0.6, 0.75].forEach(y => { box(0.12, 0.025, 0.02, black, 0.12, y, 0.36 - (y - 0.4) * 0.5).userData.plain = true; }); }); rod([0.3, 1.55, 0.2], [0.15, 1.2, 0.3], 0.05, goo2); rod([0.85, 1.6, 0.2], [0.9, 1.15, 0.3], 0.05, goo2); }); };
  }
  // (builder 20, the owner: "The dry ice and ice seem the same from a sprite perspective") DRY ICE, TWO OTHER DIRECTIONS, behind a switch and not in
  // the game yet: AA.rxKit.dryIce = 'fog' (made of fog: a chalk-white opaque core, the same face, and a body of heavy fog that pours DOWN off it and
  // pools) or 'cooler' (it lives in a white foam cooler and is handled with tongs and a thick glove). Unset: the dry ice of builders 18 and 19.
  { const c1 = PUSH.homco2, chalk = () => M(0xefece4, 0.95, 0, { exact: 1 }), chalk2 = () => M(0xd9d5ca, 0.95, 0, { exact: 1 }), fogM = o => M(0xaab3bb, 1, 0, { transparent: true, opacity: (o || 0.78) * 0.92, exact: 1 }), wh = () => M(0xffffff, 0.4);
    const face = (y, z, k) => { eyes(y, z, 0.2 * k, 0.06 * k, 0); box(0.4 * k, 0.16 * k, 0.02, black, 0, y - 0.34 * k, z + 0.005).userData.plain = true; box(0.34 * k, 0.1 * k, 0.02, wh(), 0, y - 0.34 * k, z + 0.02).userData.plain = true; [-1, 0, 1].forEach(j => { box(0.02 * k, 0.1 * k, 0.02, black, j * 0.085 * k, y - 0.34 * k, z + 0.035).userData.plain = true; }); };
    /* (the owner: "make it foggier - looks like balls and the michelin man") the fog is soft sheets and curls: ragged sprites that fade out at their edges, no outline, thin at the rim and denser where they lie over one another; each remembers where it hangs so AA.rxKit.fogDrift can roll it slowly */
    const fogTex = k => { const key = '__fog2' + k; if (root[key]) return root[key]; const c = root.document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); let sd = 7 + k * 13; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
      for (let i = 0; i < 26; i++) { const a = rnd() * 6.283, d = rnd() * (k ? 20 : 30), cx = 64 + Math.cos(a) * d * (k ? 0.5 : 1.3), cy = 64 + Math.sin(a) * d * (k ? 1.8 : 0.55), r = 12 + rnd() * (k ? 16 : 24), g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(255,255,255,' + (0.2 + 0.2 * rnd()).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }
      x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 9; i++) { const y = rnd() * 128, g = x.createLinearGradient(0, y - 5, 0, y + 5); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,' + (0.04 + 0.07 * rnd()).toFixed(3) + ')'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; if (k) { x.save(); x.translate(64, 64); x.rotate(1.5708); x.translate(-64, -64); x.fillRect(0, y - 5, 128, 10); x.restore(); } else x.fillRect(0, y - 5, 128, 10); }
      const t = new T.CanvasTexture(c); root[key] = t; return t; };
    let fogN = 0; const wisp = (w, h, x, y, z, o, k) => { const sp = new T.Sprite(new T.SpriteMaterial({ map: fogTex(k ? 1 : 0), color: 0xf3f6f8, transparent: true, opacity: o, depthWrite: false })); sp.scale.set(w, h, 1); sp.position.set(x, y, z); sp.material.rotation = k ? 0 : (fogN % 2 ? 0.12 : -0.1); sp.userData.plain = true; sp.userData.fog = { x, y, w, h, o, n: fogN++, low: y < 0.3 }; sp.renderOrder = 6; (cur || grp).add(sp); return sp; };
    const puff = (r, x, y, z, sx, sy, sz, o) => { const tall = (sy || 1) > 1.6 * (sx || 1), low = y < 0.3; wisp(r * (low ? 5.2 : tall ? 2.6 : 4.6) * (sx || 1), low ? r * 1.15 : r * (tall ? 3.0 : 3.3) * (sy || 1), x, y + (low ? 0.05 : 0), z, Math.min(1, (o || 0.78) * (low ? 1.0 : 1.2)), tall ? 1 : 0); if (!low && !tall) { wisp(r * 2.4 * (sx || 1), r * 3.6 * (sy || 1), x + r * 0.2, y - r * 0.9 * (sy || 1), z + 0.05, (o || 0.78) * 0.8, 1); wisp(r * 3.0 * (sx || 1), r * 1.6 * (sy || 1), x - r * 0.5, y + r * 0.3, z - 0.05, (o || 0.78) * 0.7, 0); } };
    // fog that falls: a streak down from (x, y, z) to the floor and a flat pool where it lands
    const fall = (x, y, z, r, o) => { puff(r, x, y * 0.5, z, 0.7, y / (2 * r), 0.7, o || 0.7); puff(r * 1.5, x, 0.1, z + 0.1, 1.3, 0.22, 1.1, o || 0.7); };
    const pool = L => floor(() => L.forEach(q => puff(q[2], q[0], 0.12, q[1], 1.4, 0.3, 1.05, 0.7)));
    const core = (w, h, d, x, y, z, k, rot) => { const g = pivot(x, y, z); if (rot) g.rotation.set(rot[0], rot[1], rot[2]); into(g, () => { box(w, h, d, chalk(), 0, 0, 0); box(w * 0.5, h * 0.18, d * 0.5, chalk2(), w * 0.2, h * 0.5, -d * 0.1, [0, 0.4, 0]); box(w * 0.3, h * 0.3, 0.03, chalk2(), -w * 0.2, 0, -d / 2 - 0.01).userData.plain = true; face(h * 0.12, d / 2 + 0.01, k); }); return g; };
    const DRY = {
      fog: s => {
        if (s === 1) { /* a pellet with a wisp falling off it */ pool([[0.35, 0.25, 0.3]]); body(); const g = pivot(0, 0.3, 0); into(g, () => { cyl(0.27, 0.27, 0.62, chalk(), 0, 0, 0, [0, 0, H], 18); face(0.05, 0.27, 0.62); box(0.2, 0.2, 0.03, chalk2(), 0, 0, -0.27).userData.plain = true; }); puff(0.14, 0.38, 0.42, 0.05, 1, 1, 1, 0.75); puff(0.18, 0.5, 0.25, 0.12, 1, 0.8, 1, 0.75); puff(0.2, 0.55, 0.1, 0.22, 1.3, 0.4, 1, 0.75); }
        else if (s === 2) { /* a block trailing a skirt of fog */ pool([[-0.7, 0.2, 0.4], [0.7, 0.25, 0.4], [0, 0.7, 0.45], [0.2, -0.9, 0.5], [-0.3, -1.5, 0.4]]); body(); core(0.85, 0.8, 0.7, 0, 0.85, 0, 0.9, [0, 0, 0.06]);
          for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; puff(0.3, Math.cos(a) * 0.5, 0.3, Math.sin(a) * 0.45, 1, 1.1, 1, 0.8); } side.forEach(q => fall(q * 0.5, 0.8, 0.1, 0.16)); }
        else if (s === 3) { /* a figure: the core is head and chest, its arms and legs are fog that keeps falling */ pool([[-0.9, 0.3, 0.5], [0.9, 0.3, 0.5], [0, 0.8, 0.5], [0, -0.7, 0.55]]); body(); core(1.0, 0.95, 0.8, 0, 1.95, 0, 1, [0, 0.1, 0]);
          side.forEach(q => { [[0.62, 1.95, 0.24], [0.86, 1.6, 0.21], [1.0, 1.2, 0.18], [1.05, 0.85, 0.2]].forEach(a => puff(a[2], q * a[0], a[1], 0.15, 1, 1.25, 1, 0.82)); [[0.3, 1.3, 0.3], [0.33, 0.85, 0.33], [0.36, 0.42, 0.38]].forEach(a => puff(a[2], q * a[0], a[1], 0, 1, 1.3, 1, 0.82)); fall(q * 1.05, 0.8, 0.2, 0.12); }); puff(0.42, 0, 1.3, 0, 1.2, 0.8, 0.9, 0.85); }
        else if (s === 4) { /* tall, robed in fog to the floor, sleeves hanging */ pool([[-1.2, 0.4, 0.6], [1.2, 0.4, 0.6], [0, 1.1, 0.6], [0.4, -1.0, 0.7], [-0.5, -1.2, 0.6]]); body(); core(0.95, 0.9, 0.78, 0, 3.0, 0, 1, [0.08, 0, 0]);
          [[2.45, 0.5], [1.95, 0.62], [1.45, 0.76], [0.95, 0.9], [0.45, 1.05]].forEach((a, i) => puff(a[1], 0, a[0], -0.05 * i, 1, 0.62, 0.85, 0.86)); side.forEach(q => { [[0.6, 2.6, 0.24], [0.85, 2.2, 0.26], [1.0, 1.75, 0.3], [1.05, 1.3, 0.34]].forEach(a => puff(a[2], q * a[0], a[1], 0.2, 1, 1.3, 1, 0.84)); fall(q * 1.05, 1.2, 0.3, 0.16); }); puff(0.5, 0, 3.0, -0.35, 1.15, 1.1, 0.7, 0.8); }
        else { /* a rolling bank that spills over the bench edge, the white core riding it */ pool([[-2.2, 0.6, 0.7], [2.2, 0.5, 0.7], [-1.0, 1.5, 0.7], [1.2, 1.6, 0.7]]); body();
          [[-1.5, 0.9, -0.3, 1.0], [-0.4, 1.15, -0.4, 1.15], [0.8, 1.0, -0.3, 1.05], [1.8, 0.75, -0.1, 0.85], [-2.0, 0.6, 0.3, 0.7], [-0.9, 0.7, 0.5, 0.8], [0.3, 0.75, 0.6, 0.85], [1.4, 0.6, 0.6, 0.7]].forEach(a => puff(a[3], a[0], a[1], a[2], 1.1, 0.85, 0.9, 0.86));
          /* the roll at its head, curling over */ puff(0.6, -2.3, 1.5, -0.2, 1, 1, 0.9, 0.85); puff(0.42, -2.75, 1.25, -0.1, 1, 1, 0.9, 0.85); puff(0.28, -2.75, 0.85, 0, 1, 1, 0.9, 0.85);
          /* over the edge */ [[-0.8, 0.1, 1.25, 0.5], [0.4, 0.0, 1.3, 0.55], [1.4, 0.05, 1.2, 0.45], [-0.2, -0.45, 1.5, 0.45], [0.9, -0.55, 1.5, 0.4], [0.3, -1.0, 1.6, 0.34]].forEach(a => puff(a[3], a[0], a[1], a[2], 1, 1.2, 0.8, 0.82));
          core(1.05, 0.95, 0.85, 0.2, 2.3, -0.2, 1.05, [0, 0.1, -0.1]); side.forEach(q => fall(0.2 + q * 0.62, 1.9, 0.0, 0.14, 0.75)); R.body.scale.setScalar(0.8); }
      },
      cooler: s => { const foam = M(0xf6f5ef, 0.9, 0, { exact: 1 }), foam2 = M(0xdcdad0, 0.9, 0, { exact: 1 }), lidc = M(0x2f7fb6, 0.6, 0, { exact: 1 }), steel = M(0x8d939c, 0.3, 0.7), hide = M(0xc98a3a, 0.85, 0, { exact: 1 }), hide2 = M(0x8f5a22, 0.85, 0, { exact: 1 }), rope = M(0x3a2a1e, 0.8);
        // the cooler: thick white foam walls, a blue band, a lid; open: the lid stands behind it
        const cool = (w, h, d, x, z, open, tilt) => { box(w, h, d, foam, x, h / 2, z); box(w + 0.02, h * 0.16, d + 0.02, lidc, x, h * 0.62, z); box(w * 0.5, h * 0.3, 0.03, foam2, x, h * 0.4, z - d / 2 - 0.01).userData.plain = true; side.forEach(q => tor(h * 0.16, 0.03, rope, x + q * (w / 2 + 0.02), h * 0.72, z, [0, H, 0], Math.PI));
          if (open) { box(w * 0.82, 0.05, d * 0.82, black, x, h + 0.01, z).userData.plain = true; box(w + 0.1, h * 0.2, d + 0.1, foam, x, h * 0.6, z - d * 0.62, [-1.25, 0, 0]); } else { const g = pivot(x, h, z - d / 2); g.rotation.x = -(tilt || 0); into(g, () => { box(w + 0.1, h * 0.22, d + 0.1, foam, 0, h * 0.11, d / 2); box(w * 0.4, 0.05, 0.1, foam2, 0, h * 0.16, d + 0.06); }); } };
        const tongs = (x, y, z, L, rz) => { const g = pivot(x, y, z); g.rotation.z = rz || 0; into(g, () => { rod([0, 0, 0], [-0.13, L, 0], 0.035, steel); rod([0, 0, 0], [0.13, L, 0], 0.035, steel); sph(0.07, steel, 0, 0, 0); side.forEach(q => box(0.1, 0.06, 0.06, steel, q * 0.1, L, 0)); }); return g; };
        const glove = (x, y, z, k, rz) => { const g = pivot(x, y, z); g.rotation.z = rz || 0; into(g, () => { sph(0.3 * k, hide, 0, 0.3 * k, 0, [1, 1.25, 0.7]); sph(0.13 * k, hide, 0.3 * k, 0.2 * k, 0.03, [1, 1.5, 0.8]); cyl(0.26 * k, 0.3 * k, 0.26 * k, hide2, 0, -0.1 * k, 0, null, 14); }); return g; };
        if (s === 1) { /* a pellet peeking from under the lid */ floor(() => puff(0.3, 0.6, 0.12, 0.6, 1.4, 0.3, 1, 0.7)); body(); cool(1.0, 0.6, 0.75, 0, 0, false, 0.42); const g = pivot(0, 0.63, 0.3); into(g, () => { cyl(0.16, 0.16, 0.5, chalk(), 0, 0, 0, [0, 0, H], 16); eyes(0.03, 0.16, 0.13, 0.045, 0); }); puff(0.13, 0.5, 0.55, 0.42, 1, 1, 1, 0.7); puff(0.16, 0.6, 0.3, 0.5, 1, 1, 1, 0.7); }
        else if (s === 2) { /* out of the box, carrying its tongs */ floor(() => puff(0.35, -0.6, 0.12, 0.4, 1.4, 0.3, 1, 0.7)); body(); cool(0.85, 0.5, 0.6, 0.75, -0.55, false, 0.15); legs(0.45, 0.2, black, 0.05); core(0.8, 0.75, 0.65, -0.25, 0.85, 0.1, 0.85, [0, 0, -0.05]); side.forEach(q => rod([-0.25 + q * 0.42, 0.85, 0.2], [-0.25 + q * 0.3, 0.62, 0.48], 0.05, black)); tongs(-0.7, 0.55, 0.5, 1.0, -1.25); }
        else if (s === 3) { /* a worker in the thick glove, hauling a block with the tongs */ floor(() => { puff(0.4, 1.3, 0.12, 0.5, 1.4, 0.3, 1, 0.7); puff(0.3, -0.9, 0.12, 0.3, 1.4, 0.3, 1, 0.7); }); body(); legs(0.75, 0.28, black, 0.06); core(1.1, 1.0, 0.9, -0.2, 1.3, 0, 1, [0, 0.1, 0.05]);
          rod([0.38, 1.4, 0.3], [1.0, 1.15, 0.5], 0.06, black); tongs(1.0, 1.15, 0.5, 0.75, -2.5); box(0.6, 0.5, 0.5, chalk(), 1.45, 0.3, 0.55, [0, 0.3, 0]); box(0.3, 0.1, 0.25, chalk2(), 1.5, 0.56, 0.5, [0, 0.3, 0]); rod([-0.78, 1.4, 0.2], [-1.1, 1.7, 0.3], 0.06, black); glove(-1.12, 1.7, 0.3, 1.0, 0.35); box(0.7, 0.14, 0.05, hide2, -0.2, 0.92, 0.46).userData.plain = true; }
        else if (s === 4) { /* sat in the open cooler, arms over the rim, fog lapping out */ floor(() => { puff(0.45, -1.3, 0.12, 0.5, 1.4, 0.3, 1, 0.7); puff(0.45, 1.3, 0.12, 0.4, 1.4, 0.3, 1, 0.7); }); body(); cool(2.0, 1.15, 1.4, 0, 0, true); core(1.15, 1.1, 0.9, 0, 1.6, 0.05, 1.05, [0.05, 0, 0]);
          side.forEach(q => { rod([q * 0.6, 1.55, 0.25], [q * 1.05, 1.22, 0.55], 0.06, black); puff(0.26, q * 0.85, 1.18, 0.55, 1.2, 0.7, 1, 0.8); fall(q * 1.08, 1.1, 0.5, 0.14, 0.72); }); glove(1.08, 1.2, 0.6, 0.8, -0.4); tongs(-1.2, 0.05, 0.85, 1.5, 0.12); puff(0.3, 0, 1.2, 0.72, 2, 0.6, 0.6, 0.8); }
        else { /* the cooler is its throne: the lid stands for a back, tongs for a sceptre, fog boils out over the sides */ floor(() => { [[-2.0, 0.5, 0.6], [2.0, 0.5, 0.6], [-0.8, 1.4, 0.6], [1.0, 1.5, 0.6]].forEach(q => puff(q[2], q[0], 0.12, q[1], 1.4, 0.3, 1, 0.72)); }); body();
          cool(2.7, 1.5, 1.7, 0, -0.1, false, 0); box(2.6, 2.1, 0.32, foam, 0, 2.6, -0.85, [-0.08, 0, 0]); box(2.62, 0.3, 0.34, lidc, 0, 3.3, -0.9, [-0.08, 0, 0]); box(1.4, 0.9, 0.03, foam2, 0, 2.6, -1.03, [-0.08, 0, 0]).userData.plain = true;
          core(1.25, 1.15, 1.0, 0, 2.3, 0.1, 1.1, [0, 0, 0]); legs(1.75, 0.3, black, 0.05); side.forEach(q => { [[1.45, 1.35, 0.5, 0.36], [1.6, 0.9, 0.6, 0.4], [1.7, 0.45, 0.7, 0.44]].forEach(a => puff(a[3], q * a[0], a[1], a[2], 1, 1.2, 0.9, 0.82)); [[0.7, 1.55, 0.9, 0.3], [0.5, 1.1, 1.05, 0.34], [0.8, 0.6, 1.15, 0.38]].forEach(a => puff(a[3], q * a[0], a[1], a[2], 1.1, 1.1, 0.8, 0.8)); });
          rod([0.66, 2.35, 0.3], [1.15, 2.1, 0.5], 0.06, black); tongs(1.15, 1.3, 0.55, 2.2, 0); rod([-0.66, 2.35, 0.3], [-1.2, 2.2, 0.45], 0.06, black); glove(-1.2, 2.15, 0.5, 1.1, 0.5); R.body.scale.setScalar(0.85); }
      } };
    PUSH.homco2 = s => { const w = (extra && extra.dry) || (root.AA && root.AA.rxKit && root.AA.rxKit.dryIce) || 'fog'; /* (builder 20, the owner's pick) the game's Dry ice is the fog; 'old' gives builder 19's back */ if (DRY[w]) return DRY[w](s); return c1(s); }; }
  const pushOn = !!((extra && extra.push) || (root.AA && root.AA.rxKit && root.AA.rxKit.pushOn));
  B.__stage = () => { if (sg && pushOn && PUSH[id]) { PUSH[id](sg); young = true; } else if (sg && sg <= 2 && YOUNG[id]) { YOUNG[id](sg); young = true; } else { B[id](); if (sg >= 4 && GROWN[id] && R.body) into(R.body, () => GROWN[id](sg)); } };
  // (builder 21, the owner: "The animations still seem stiff?") THE RIG. A creature that has an entry here is not one solid figure: it is built from NAMED PARTS,
  // each a pivot of its own, so a part can move by itself. RIG[id]() gives { parts, form }:
  //   parts: [name, parent, maker]. parent '' hangs the part on the figure, '~' lays it on the page (left out in a jar), any other name hangs it on that part.
  //          The maker draws the part about its own pivot at unit size (a ball of radius 1, a limb one long hanging down from its joint).
  //   form(stage): where each part is at rest at that stage, in the figure's own space: { p: [x, y, z], s: size or [sx, sy, sz], r: [rx, ry, rz] } or, for a
  //          limb, { p: joint, to: hand }. A part that a stage does not name is not there at that stage. The same name at two stages is the same part: it tweens.
  // rigSet (below build) puts the parts in place for a stage, or between two stages, with a pose on top; CLIP[id] (below build) is the creature's motion.
  const RIG = {
    homacid: () => { const sk = M(0xd4e21a, 0.25, 0, { exact: 1 }), dk = M(0x7a8a10, 0.4, 0, { exact: 1 }), pit = M(0x2c2f34, 0.9), fume = M(0xe8f0a0, 0.9, 0, { transparent: true, opacity: 0.5, exact: 1 }), wh = M(0xffffff, 0.4), tng = M(0xd6453a, 0.6), gls = M(0xcfe3ee, 0.1, 0, { transparent: true, opacity: 0.45 });
      const ball = m => put(new T.SphereGeometry(1, 20, 14), m, 0, 0, 0), pl = o => { o.userData.plain = true; return o; }, disc = n => () => pl(cyl(1, 1, 0.03, pit, 0, 0.015, 0, null, n)), limb = hm => () => { /* (builder 22) a limb has a joint half way: the lower half hangs on its own pivot (userData.elbow), bent by the pose's b */ const pg = cur, el = new T.Group(); cyl(0.1, 0.1, 0.5, dk, 0, -0.25, 0, null, 12); sph(0.1, dk, 0, -0.5, 0); el.position.set(0, -0.5, 0); pg.add(el); pg.userData.elbow = el; into(el, () => { cyl(0.1, 0.1, 0.5, dk, 0, -0.25, 0, null, 12); if (hm) sph(0.17, hm, 0, -0.5, 0); }); };
      const parts = [['pit', '~', disc(9)], ['pit2', '~', disc(7)], ['pit3', '~', disc(7)], ['pit4', '~', disc(6)], ['sizzle', '~', disc(7)],
        ['crumb0', '~', () => box(1, 0.8, 1, steel, 0, 0.4, 0)], ['crumb1', '~', () => box(1, 0.8, 1, steel, 0, 0.4, 0)], ['crumb2', '~', () => box(1, 0.8, 1, steel, 0, 0.4, 0)], ['chip0', '~', () => box(1, 0.6, 1, wood, 0, 0.3, 0)], ['chip1', '~', () => box(1, 0.6, 1, wood, 0, 0.3, 0)],
        ['plankL', '', () => box(1.1, 0.16, 1.5, wood, 0, 0, 0)], ['plankR', '', () => box(1.1, 0.16, 1.5, wood, 0, 0, 0)],
        ['hips', '', null], ['pool', 'hips', () => ball(sk)], ['legL', 'hips', limb()], ['legR', 'hips', limb()], ['footL', 'hips', () => ball(dk)], ['footR', 'hips', () => ball(dk)],
        ['body', 'hips', () => { ball(sk); side.forEach(q => sph(0.34, sk, q * 0.25, -0.4, -0.78, [1, 1.05, 0.8])); }], ['point', 'body', () => put(new T.ConeGeometry(0.5, 1, 10), sk, 0, 0.5, 0)],
        ['eyeL', 'body', () => pl(ball(black))], ['eyeR', 'body', () => pl(ball(black))], ['browL', 'body', () => pl(box(1, 1, 1, black, 0, 0, 0))], ['browR', 'body', () => pl(box(1, 1, 1, black, 0, 0, 0))],
        ['mouth', 'body', null], ['maw', 'mouth', () => pl(ball(black))], ['tongue', 'mouth', () => pl(ball(tng))], ['jawU', 'mouth', null], ['jawL', 'mouth', null]];
      for (let i = 0; i < 8; i++) parts.push(['toothU' + i, 'jawU', () => pl(put(new T.ConeGeometry(0.5, 1.1, 4), wh, 0, 0, 0, [PI, 0, 0]))]);
      for (let i = 0; i < 7; i++) parts.push(['toothL' + i, 'jawL', () => pl(put(new T.ConeGeometry(0.5, 1.1, 4), wh, 0, 0, 0))]);
      parts.push(['armL', 'hips', limb(sk)], ['armR', 'hips', limb(sk)],
        ['bolt', 'hips', () => { cyl(0.07, 0.07, 0.55, steel, 0, 0, 0, [0, 0, H]); cyl(0.13, 0.13, 0.1, steel, 0.31, 0, 0, [0, 0, H], 6); pl(sph(0.09, pit, -0.25, 0.02, 0.03)); }],
        ['bar', 'hips', () => { cyl(0.1, 0.1, 2.3, steel, 0, 0, 0, [0, 0, H]); [-0.62, 0.62].forEach(k => pl(sph(0.13, pit, k, 0.06, 0.02))); }],
        ['chunk', 'hips', () => box(0.3, 0.2, 0.22, wood, 0, 0, 0)], ['leg5', 'hips', () => rod([0, -0.65, 0], [0, 0.65, 0], 0.13, wood)], ['jar5', 'hips', () => { cyl(0.3, 0.3, 0.6, gls, 0, 0, 0, null, 14); cyl(0.32, 0.32, 0.08, steel, 0, 0.34, 0, null, 14); }],
        ['drip0', 'hips', () => put(new T.SphereGeometry(1, 12, 10), sk, 0, 0, 0, null, [1, 1.8, 1])], ['drip1', 'hips', () => put(new T.SphereGeometry(1, 12, 10), sk, 0, 0, 0, null, [1, 1.8, 1])], ['drip2', 'hips', () => put(new T.SphereGeometry(1, 12, 10), sk, 0, 0, 0, null, [1, 1.8, 1])],
        ['puff0', '', () => pl(put(new T.SphereGeometry(1, 14, 10), fume, 0, 0, 0, null, [1.3, 0.8, 1]))], ['puff1', '', () => pl(put(new T.SphereGeometry(1, 14, 10), fume, 0, 0, 0, null, [1.3, 0.8, 1]))], ['puff2', '', () => pl(put(new T.SphereGeometry(1, 14, 10), fume, 0, 0, 0, null, [1.3, 0.8, 1]))],
        ['bub0', '', () => pl(put(new T.SphereGeometry(1, 12, 10), fume, 0, 0, 0))], ['bub1', '', () => pl(put(new T.SphereGeometry(1, 12, 10), fume, 0, 0, 0))]);
      // the five forms, from the pushed drawings: R the body's radius, by its height, bs its squash, pt the point (radius, height, middle), ey the eyes (y, z, gap, r), br the brows (y, z, gap, w, tilt), mw the mouth (y, z, half width, half height, half depth), tu and tl the tooth rows (y, z, width, count)
      const D = [null,
        { R: 0.42, by: 0.4, bs: [1, 0.9, 1], pt: [0.2, 0.4, 0.9], ey: [0.5, 0.36, 0.13, 0.05], br: [0.62, 0.36, 0.14, 0.14, 0.5], mw: [0.3, 0.4, 0.09, 0.035, 0.02], tu: [0.31, 0.42, 0.1, 1], pit: 0.5 },
        { R: 0.6, by: 0.68, bs: [1, 0.95, 0.95], pt: [0.26, 0.5, 1.38], ey: [0.88, 0.5, 0.17, 0.055], br: [1.02, 0.5, 0.18, 0.18, 0.5], mw: [0.56, 0.58, 0.16, 0.075, 0.02], tu: [0.6, 0.6, 0.26, 3], pit: 0.7 },
        { R: 0.85, by: 1.05, bs: [1, 1.05, 0.9], pt: [0.3, 0.6, 2.05], ey: [1.55, 0.6, 0.2, 0.06], br: [1.72, 0.6, 0.21, 0.24, 0.55], mw: [0.95, 0.62, 0.48, 0.34, 0.17], tu: [1.2, 0.8, 0.7, 5], tl: [0.72, 0.78, 0.6, 4], pit: 1.0 },
        { R: 1.0, by: 1.0, bs: [1.15, 0.95, 0.95], pt: [0.3, 0.55, 2.1], ey: [1.6, 0.7, 0.24, 0.07], br: [1.8, 0.7, 0.25, 0.28, 0.55], mw: [0.95, 0.78, 0.72, 0.45, 0.24], tu: [1.28, 0.88, 1.0, 7], tl: [0.6, 0.84, 0.8, 5], pit: 1.0 },
        { R: 1.15, by: 1.5, bz: -0.35, bs: [1.1, 1.1, 0.9], pt: [0.34, 0.65, 2.95], ey: [2.05, 0.6, 0.32, 0.1], br: [2.35, 0.6, 0.33, 0.4, 0.55], mw: [1.2, 0.42, 1.02, 0.68, 0.42], tu: [1.68, 0.78, 1.5, 8], tl: [0.72, 0.8, 1.3, 7], pit: 2.0 }];
      const form = s => { const d = D[s], F = { _: d }, bz = d.bz || 0, P = (n, p, sc, r) => { F[n] = { p, s: typeof sc === 'number' ? [sc, sc, sc] : sc, r }; }, L = (n, a, b) => { F[n] = { p: a, to: b }; }, fl = (n, x, z, r) => P(n, [x, 0, z], [r, 1, r]);
        P('hips', [0, 0, 0], 1); P('body', [0, d.by, bz], [d.R * d.bs[0], d.R * d.bs[1], d.R * d.bs[2]]); P('point', [0, d.pt[2] - d.pt[1] / 2, bz], [d.pt[0] * 2, d.pt[1], d.pt[0] * 2]); fl('pit', 0, 0.1, d.pit);
        side.forEach(q => { const n = q < 0 ? 'L' : 'R'; P('eye' + n, [q * d.ey[2], d.ey[0], d.ey[1]], d.ey[3]); P('brow' + n, [q * d.br[2], d.br[0], d.br[1]], [d.br[3], 0.055, 0.03], [0, 0, q * d.br[4]]); });
        P('mouth', [0, d.mw[0], d.mw[1]], 1); P('maw', [0, d.mw[0], d.mw[1]], [d.mw[2], d.mw[3], d.mw[4]]); P('jawU', [0, d.tu[0], d.tu[1]], 1); for (let i = 0; i < d.tu[3]; i++) P('toothU' + i, [-d.tu[2] / 2 + (i + 0.5) * d.tu[2] / d.tu[3], d.tu[0], d.tu[1]], d.tu[2] / d.tu[3]);
        if (d.tl) { P('jawL', [0, d.tl[0], d.tl[1]], 1); for (let i = 0; i < d.tl[3]; i++) P('toothL' + i, [-d.tl[2] / 2 + (i + 0.5) * d.tl[2] / d.tl[3], d.tl[0], d.tl[1]], d.tl[2] / d.tl[3]); }
        P('bub0', [d.R * 0.55, d.by + d.R * 0.8, bz], d.R * 0.11); P('bub1', [-d.R * 0.4, d.by + d.R * 0.9, bz], d.R * 0.08);
        if (s === 2) { side.forEach(q => { const n = q < 0 ? 'L' : 'R'; P('foot' + n, [q * 0.22, 0.07, 0.1], [0.1, 0.06, 0.15]); L('arm' + n, [q * 0.5, 0.6, 0.2], [q * 0.3, 0.5, 0.72]); }); P('bolt', [0.05, 0.5, 0.75], 1); [[0.5, 0.9], [-0.4, 1.0], [0.1, 1.15]].forEach((c, i) => P('crumb' + i, [c[0], 0, c[1]], 0.06, [0, c[0] * 3, 0])); }
        else if (s === 3) { side.forEach(q => { const n = q < 0 ? 'L' : 'R'; P('foot' + n, [q * 0.36, 0.06, 0.1], [0.1, 0.055, 0.15]); L('leg' + n, [q * 0.3, 0.4, 0], [q * 0.36, 0.07, 0.04]); L('arm' + n, [q * 0.8, 1.1, 0.2], [q * 0.95, 0.98, 0.85]); }); P('bar', [0, 0.96, 0.88], 1); P('drip0', [-1.15, 0.7, 0.88], 0.07); P('drip1', [1.15, 0.7, 0.88], 0.07); P('puff0', [0.15, 2.7, 0], 0.18); fl('pit2', 1.2, 0.5, 0.16); fl('pit3', -1.15, 0.6, 0.12); }
        else if (s === 4) { P('plankL', [-1.45, 0.5, 0], 1, [0, 0, 0.22]); P('plankR', [1.45, 0.5, 0], 1, [0, 0, -0.22]); fl('pit2', 1.7, 0.5, 0.2); fl('pit3', -1.75, 0.3, 0.24); fl('pit4', 0.6, 1.5, 0.16); side.forEach(q => L('arm' + (q < 0 ? 'L' : 'R'), [q * 1.0, 1.2, 0.1], [q * 1.5, 0.78, 0.5])); P('chunk', [1.5, 0.95, 0.55], 1, [0.3, 0.5, 0.2]); P('tongue', [0, 0.78, 0.8], [0.34, 0.14, 0.11]); P('drip0', [-0.75, 0.5, 0.7], 0.08); P('drip1', [0.7, 0.4, 0.75], 0.08); P('puff0', [-0.3, 2.9, 0], 0.22); P('puff1', [0.4, 3.4, 0], 0.15); }
        else if (s === 5) { P('pool', [0, 0.25, 0], [1.84, 0.79, 1.75]); P('chip0', [1.6, 0, 1.5], [0.2, 0.2, 0.2], [0, 1.6, 0.2]); P('chip1', [-1.7, 0, 1.4], [0.16, 0.2, 0.16], [0, -1.7, 0.2]); P('leg5', [1.475, 0.9, 1.05], 1, [0.24, 0, -0.43]); P('jar5', [-1.3, 0.55, 0.9], 1, [0.5, 0, 0.5]); side.forEach(q => L('arm' + (q < 0 ? 'L' : 'R'), [q * 1.1, 1.3, 0], [q * 1.7, 0.9, 0.7])); P('tongue', [0, 0.95, 0.66], [0.52, 0.2, 0.16]); P('drip0', [-1.0, 1.7, 0.4], 0.1); P('drip1', [0.9, 2.0, 0.3], 0.1); P('drip2', [0.3, 0.75, 1.25], 0.1); P('puff0', [-0.5, 3.6, 0], 0.3); P('puff1', [0.5, 4.1, 0], 0.2); P('puff2', [0.1, 3.2, 0], 0.26); }
        return F; };
      return { parts, form }; }
  };
  if (sg && RIG[id] && (extra && extra.rig != null ? extra.rig : !(root.AA && root.AA.rxKit && root.AA.rxKit.rigOn === false))) B.__stage = () => { young = true; const sp = RIG[id](), all = body(), Rg = { T, id, stage: sg, parts: {}, par: {}, order: [], form: sp.form, fc: {}, all, inkT: (extra && extra.ink) || 0.05, jar: jarMode };
    sp.parts.forEach(q => { if (q[1] === '~' && jarMode) return; const pg = new T.Group(); (q[1] === '~' ? grp : q[1] ? Rg.parts[q[1]] : all).add(pg); Rg.parts[q[0]] = pg; Rg.par[q[0]] = q[1] && q[1] !== '~' ? q[1] : null; Rg.order.push(q[0]); if (q[2]) into(pg, q[2]); });
    grp.userData.rig2 = Rg; rigSet(grp, sg, sg, 0); };
  // (builder 22, the owner: "Yes, do the other nine") THE AUTO RIG. A creature listed here is rigged from its own pushed drawings, with no second set of numbers to keep:
  // each of its five PUSH forms is drawn once, and every piece of a form is given to a named part by where it sits about the ball that carries the eyes:
  //   ground (on the page), base (the big things under it), legL/R, body (the ball, its face, its back), point (what is on top), eyeL/R, armL/R (what is at its sides or
  //   held out in front), fog (sprites). Each part is a pivot; under it hang five small groups, one per stage, and only the stage shown is seen. So one name is one part
  //   at every stage (the kit's dress, the clips and rigSet work as for a hand-made rig), and the evolve swaps a part's stage group at the middle of its own beat.
  const AUTO = { homwater: 1, homco2: 1, homsalt: 1 };
  if (sg && AUTO[id] && PUSH[id] && pushOn && (extra && extra.rig != null ? extra.rig : !(root.AA && root.AA.rxKit && root.AA.rxKit.rigOn === false))) B.__stage = () => { young = true;
    const all = new T.Group(), NM = [['ground', '~'], ['hips', ''], ['base', 'hips'], ['legL', 'hips'], ['legR', 'hips'], ['body', 'hips'], ['point', 'body'], ['eyeL', 'body'], ['eyeR', 'body'], ['armL', 'body'], ['armR', 'body'], ['fog', '']], FORMS = {};
    const Rg = { T, id, stage: sg, parts: {}, par: {}, order: [], fc: {}, all, inkT: (extra && extra.ink) || 0.05, jar: jarMode, fogs: {}, form: s => FORMS[s] }; grp.add(all);
    NM.forEach(q => { if (q[1] === '~' && jarMode) return; const pg = new T.Group(); (q[1] === '~' ? grp : q[1] ? Rg.parts[q[1]] : all).add(pg); Rg.parts[q[0]] = pg; Rg.par[q[0]] = q[1] && q[1] !== '~' ? q[1] : null; Rg.order.push(q[0]); pg.userData.sub = []; for (let s = 1; s <= 5; s++) { const sb = new T.Group(); pg.add(sb); pg.userData.sub[s] = sb; } });
    const rad = o => { if (!o.isMesh) return 0.3; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); return o.geometry.boundingSphere.radius * Math.max(o.scale.x, o.scale.y, o.scale.z); }, half = o => { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const z = o.geometry.boundingBox.getSize(new T.Vector3()); return [z.x * o.scale.x / 2, z.y * o.scale.y / 2, z.z * o.scale.z / 2]; };
    for (let s = 1; s <= 5; s++) { const n0 = grp.children.length; R.body = null; PUSH[id](s); const fresh = grp.children.slice(n0); fresh.forEach(o => grp.remove(o)); const bg = R.body, us = bg ? bg.children.slice() : [], fl = fresh.filter(o => o !== bg);
      const ey = us.filter(o => o.isMesh && o.geometry.type === 'SphereGeometry' && o.userData.plain && rad(o) < 0.16 && o.position.z > 0.15 && Math.abs(o.position.x) > 0.04 && o.material.color.r + o.material.color.g + o.material.color.b < 0.15), eL = ey.find(o => o.position.x < 0), eR = ey.find(o => o.position.x > 0), E = eL && eR ? [(eL.position.x + eR.position.x) / 2, (eL.position.y + eR.position.y) / 2] : [0, 1];
      let ball = null, bd = 1e9, hb = [0.5, 0.5, 0.5]; us.forEach(o => { if (o.isSprite || o.userData.plain || o === eL || o === eR || (o.isMesh && o.material.transparent && o.material.opacity < 0.6)) return; let h; if (o.isMesh) h = half(o); else { /* a piece that is a group of its own (a block with its face on it) */ o.updateMatrixWorld(true); const z = new T.Box3().setFromObject(o).getSize(new T.Vector3()); h = [z.x / 2, z.y / 2, z.z / 2]; } if (h[1] < 0.26 || h[0] < 0.26) return;
        const dd = eL && eR ? Math.hypot((o.position.x - E[0]) / h[0], (o.position.y - E[1]) / h[1]) + (!o.isMesh || o.geometry.type === 'SphereGeometry' || o.geometry.type === 'BoxGeometry' ? 0 : 0.5) : -h[0] * h[1] * h[2] * (o.isMesh ? 1 : 3) /* no eyes of their own on the figure: the biggest solid piece is the body */; if (dd < bd) { bd = dd; ball = o; hb = h; } });
      const C = ball ? ball.position.clone() : new T.Vector3(0, 1, 0), Wb = hb[0], Hb = hb[1], Db = hb[2], lr = (n, dx) => n + (dx < 0 ? 'L' : 'R');
      const which = o => { if (o.isSprite) return 'fog'; if (o === eL) return 'eyeL'; if (o === eR) return 'eyeR'; if (o === ball) return 'body'; const p = o.position, dx = p.x - C.x, dy = p.y - C.y, dz = p.z - C.z, r = rad(o);
        if (Math.abs(dx) < Wb * 0.82 && Math.abs(dy) < Hb * 0.85) return !o.userData.plain && dz > Db * 0.62 ? lr('arm', dx || 1) : 'body';   // on the ball: its face and its back; a thing held out in front is in its hands
        if (dy <= -Hb * 0.85) return r < Math.max(0.34, Wb * 0.6) && Math.abs(dx) > 0.05 && Math.abs(dx) < Wb * 1.25 && Math.abs(dz) < Db ? lr('leg', dx) : Math.abs(dx) > Wb * 1.25 && r < Wb * 1.2 && p.y > 0.3 ? lr('arm', dx) : 'base';
        if (Math.abs(dx) >= Wb * 0.82) return lr('arm', dx); return 'point'; };
      const PV = { ground: [0, 0, 0], hips: [0, 0, 0], base: [0, 0, 0], fog: [0, 0, 0], body: [C.x, C.y - Hb * 0.9, C.z], point: [C.x, C.y + Hb * 0.85, C.z], armL: [C.x - Wb * 0.75, C.y + Hb * 0.15, C.z], armR: [C.x + Wb * 0.75, C.y + Hb * 0.15, C.z], legL: [C.x - Wb * 0.4, C.y - Hb * 0.8, C.z], legR: [C.x + Wb * 0.4, C.y - Hb * 0.8, C.z], eyeL: eL ? eL.position.toArray() : [0, 0, 0], eyeR: eR ? eR.position.toArray() : [0, 0, 0] };
      const F = FORMS[s] = { _: { R: Wb, Hb, Db, by: C.y, C: C.toArray() }, hips: { p: [0, 0, 0], s: [1, 1, 1] }, body: { p: PV.body, s: [1, 1, 1] } }, give = (o, n) => { const pg = Rg.parts[n]; if (!pg) return; const pv = PV[n]; o.position.x -= pv[0]; o.position.y -= pv[1]; o.position.z -= pv[2]; if (o.userData.fog) { o.userData.fog.x -= pv[0]; o.userData.fog.y -= pv[1]; (Rg.fogs[s] || (Rg.fogs[s] = [])).push(o); } pg.userData.sub[s].add(o); if (!F[n]) F[n] = { p: pv, s: [1, 1, 1] }; };
      us.forEach(o => give(o, which(o))); fl.forEach(o => give(o, o.isSprite ? 'fog' : 'ground')); }
    R.body = all; cur = all; Rg.post = (P, a, b) => { /* of each part's five stage groups only one is seen: the old one up to the middle of the part's own way from a to b, then the new one */ Rg.order.forEach(n => { const sb = Rg.parts[n].userData.sub, A = FORMS[a][n], Bf = FORMS[b][n], kk = Math.max(0, Math.min(1, P && P[n] && P[n].k != null ? P[n].k : Rg.k || 0)), sh = A && Bf ? (kk < 0.5 ? a : b) : A ? a : b; for (let s = 1; s <= 5; s++) { const on = s === sh; sb[s].visible = on; sb[s].scale.setScalar(on ? 1 : 1e-4); } }); };
    grp.userData.rig2 = Rg; rigSet(grp, sg, sg, 0); };
  if (id === '__list') return Object.keys(B).filter(k => k !== '__stage');
  if (!B[id] || id === '__stage') return false;
  B.__stage();
  // (builder 14, the owner: "give all the homunculi butts") every creature is modelled all the way round: each has a backside of its own, seen when it is turned or turns its back in its jar.
  // cheeks(material, height, how far back, size, half gap, squash) puts two cheeks and the crease between them on the body
  if (R.body && !young && /^hom/.test(id) && id !== 'homunculus') { const pc = cur; cur = R.body;
    const cheeks = (m, y, z, r, dx, scl, geo) => { side.forEach(q => { if (geo) put(geo(r), m, q * dx, y, -z, [0.3, q * 0.5, 0.2], scl); else sph(r, m, q * dx, y, -z, scl || [1, 1.05, 0.8]); }); box(0.035, r * 1.5, 0.05, black, 0, y - r * 0.05, -z - r * 0.62 * ((scl && scl[2]) || 0.8)).userData.plain = true; };
    const BUTT = {
      homwater: () => { const sk = M(0x3a6fd0, 0.3); cheeks(sk, 0.72, 0.36, 0.3, 0.2); const d = M(0xcfe3ee, 0.1, 0, { transparent: true, opacity: 0.55 }); sph(0.07, d, 0, 0.36, -0.5, [1, 1.7, 1]); },
      // the balloon: two round bulges low at the back, and a square patch stuck over an old puncture
      homh2: () => { const sk = M(0xd6453a, 0.4); cheeks(sk, 1.5, 0.42, 0.33, 0.22, [1, 1, 0.85]); box(0.26, 0.26, 0.03, M(0xf4efe0, 0.8), 0.3, 2.2, -0.6, [0.25, 0.3, 0.2]); [-1, 1].forEach(k => box(0.2, 0.03, 0.02, black, 0.3, 2.2, -0.62, [0.25, 0.3, 0.2 + k * 0.78]).userData.plain = true); },
      // dry ice: two square slabs, frosted, with a fleck each
      homco2: () => { const ice = M(0xf4efe0, 0.3); side.forEach(q => { box(0.46, 0.46, 0.16, ice, q * 0.27 - 0.06, 1.2, -0.54, [0, 0.12, q * 0.06]); box(0.14, 0.07, 0.03, M(0x3a6fd0, 0.3), q * 0.27 - 0.06, 1.3, -0.64, [0, 0.12, 0.5]).userData.plain = true; }); },
      // acid: sagging, half melted, a drip hanging from each cheek
      homacid: () => { const sk = M(0xd4e21a, 0.25, 0, { exact: 1 }); cheeks(sk, 0.62, 0.42, 0.3, 0.22, [1, 0.9, 0.8], r => new T.OctahedronGeometry(r * 1.15, 0)); },
      // wood spirit: two bumps moulded in the glass and a torn back label
      homwood: () => { const br = M(0x8a5a2b, 0.5); cheeks(br, 0.86, 0.42, 0.27, 0.19, [1, 1, 0.75]); box(0.5, 0.3, 0.05, M(0xf4efe0, 0.8), 0.04, 1.45, -0.53, [0, 0, -0.12]); box(0.3, 0.035, 0.02, black, 0.04, 1.45, -0.565, [0, 0, -0.12]).userData.plain = true; },
      // salt: the crab's folded tail flap between two crusted lumps
      homsalt: () => { const sa = M(0xd6d2c4, 0.85, 0, { exact: 1 }), cream = M(0xf4efe0, 0.85); cheeks(sa, 0.82, 0.74, 0.36, 0.3, [1.1, 0.85, 0.7]); put(new T.ConeGeometry(0.2, 0.42, 3), cream, 0, 0.56, -0.98, [PI, 0, 0], [1.2, 1, 0.35]); [[-0.42, 1.05], [0.38, 1.1], [0.5, 0.7]].forEach((q, i) => box(0.15, 0.15, 0.15, cream, q[0], q[1], -0.92, [0.4, 0.6 + i, 0.3])); },
      // slime: the biggest of the ten, glossy, and a sticky thread from it to the ground
      homslime: () => { const gr = M(0x8a5ad0, 0.15, 0, { transparent: true, opacity: 0.85, exact: 1 }); cheeks(gr, 0.5, 0.72, 0.46, 0.34, [1, 0.85, 0.8]); rod([0.5, 0.3, -0.95], [0.62, 0.04, -1.1], 0.035, gr); },
      // ammonia: two bumps in the glass with crystals packed into them
      homammonia: () => { const gl = M(0xcfe3ee, 0.1, 0, { transparent: true, opacity: 0.4, glass: 0xbfe6fa, op: 0.55, emissive: new T.Color(0x5a8ca0) }), cr = M(0xf4efe0, 0.5); cheeks(gl, 0.86, 0.52, 0.3, 0.22, [1, 1, 0.75]); side.forEach(q => box(0.2, 0.2, 0.2, cr, q * 0.22, 0.86, -0.5, [0.5, 0.6 * q, 0.3])); },
      // seedling: the pot's rounded back, with a root that has found its way out between
      homseed: () => { const clay = M(0xc26a3a, 0.7), root = M(0xe9e4d2, 0.6); cheeks(clay, 0.78, 0.5, 0.3, 0.21, [1, 1, 0.8]); rod([0, 0.5, -0.68], [0.1, 0.3, -0.86], 0.035, root); rod([0.1, 0.3, -0.86], [-0.04, 0.14, -0.94], 0.028, root); },
      // brimstone: two lumps of the stone and an ember glowing in the crack between them
      hombrimstone: () => { const stn = M(0x2c2f34, 0.7); cheeks(stn, 0.74, 0.86, 0.38, 0.3, [1, 0.85, 0.8], r => new T.DodecahedronGeometry(r, 0)); box(0.07, 0.42, 0.06, glow(0xd6453a), 0, 0.72, -1.08).userData.plain = true; sph(0.14, M(0xdcecf4, 0.9, 0, { transparent: true, opacity: 0.5 }), 0, 1.15, -1.2, [1.3, 0.8, 1]).userData.plain = true; }
    };
    const mouth = (x, y, z, w, kind) => { const m = kind === 'o' ? sph(w, black, x, y, z, [1, 1.25, 0.4]) : kind === 'flat' ? box(w * 2, 0.045, 0.03, black, x, y, z) : tor(w, 0.03, black, x, y, z, [0, 0, kind === 'frown' ? 0 : PI], PI); m.userData.plain = true; return m; }, wh2 = M(0xffffff, 0.4), dot = (x, y, z, r, m) => { sph(r, m, x, y, z).userData.plain = true; };
    const FACE = {
      homwater: () => { mouth(0, 1.74, 0.4, 0.09); },
      // the balloon is nervous: wide eyes and a small round mouth
      homh2: () => { eyes(2.0, 0.6, 0.2, 0.065, 0); side.forEach(q => dot(q * 0.2 + 0.02, 2.02, 0.66, 0.022, wh2)); mouth(0, 1.72, 0.63, 0.06, 'o'); },
      // dry ice shivers: eyes and chattering teeth
      homco2: () => { eyes(1.62, 0.53, 0.22, 0.06, 0); box(0.42, 0.17, 0.02, black, 0, 1.25, 0.535, [0, 0.12, 0]).userData.plain = true; box(0.36, 0.11, 0.02, wh2, 0, 1.25, 0.55, [0, 0.12, 0]).userData.plain = true; [-1, 0, 1].forEach(k => box(0.02, 0.11, 0.02, black, k * 0.09, 1.25, 0.565, [0, 0.12, 0]).userData.plain = true); },
      // the wood spirit is drunk: one lid down, red cheeks, a hiccup of a mouth
      homwood: () => { mouth(0.05, 1.36, 0.56, 0.075, 'o'); side.forEach(q => { sph(0.1, M(0xe58a7c, 0.6), q * 0.33, 1.5, 0.47, [1, 0.7, 0.4]).userData.plain = true; }); box(0.17, 0.06, 0.03, black, 0.17, 1.76, 0.47, [0, 0, -0.3]).userData.plain = true; },
      // salt is a grumpy crusted lump: heavy brows over the stalks and a frown
      homsalt: () => { side.forEach(q => { box(0.28, 0.08, 0.06, black, q * 0.33, 2.0, 0.56, [0, 0, q * 0.5]).userData.plain = true; }); mouth(0, 0.82, 1.0, 0.2, 'frown'); },
      // ammonia holds its own nose: eyes screwed up on the shoulder of the bottle, a red nose, one hand on it
      homammonia: () => { eyes(1.74, 0.46, 0.15, 0.055, 0); side.forEach(q => { box(0.16, 0.045, 0.03, black, q * 0.15, 1.84, 0.44, [0, 0, q * 0.45]).userData.plain = true; }); sph(0.1, M(0xd6453a, 0.6), 0, 1.56, 0.6); rod([0.62, 1.25, 0.25], [0.12, 1.56, 0.68], 0.045, black); sph(0.085, black, 0.1, 1.56, 0.72); mouth(0, 1.36, 0.69, 0.1, 'flat'); },
      // the seedling is eager: a wide smile on the pot, bright eyes, and it leans toward the lamp
      homseed: () => { mouth(0, 0.8, 0.72, 0.15); side.forEach(q => dot(q * 0.2 + 0.02, 0.975, 0.705, 0.022, wh2)); R.lean0 = [0.08, -0.14]; },
      // brimstone grins, two small fangs
      hombrimstone: () => { mouth(0, 1.4, 0.68, 0.17); side.forEach(q => { put(new T.ConeGeometry(0.04, 0.1, 4), wh2, q * 0.09, 1.3, 0.7, [PI, 0, 0]).userData.plain = true; }); }
    };
    if (FACE[id]) FACE[id]();
    if (BUTT[id]) BUTT[id](); cur = pc; }
  let inkK = 1;
  if (U.length) { grp.userData.use = v => U.forEach(f => f(v)); grp.userData.use(0); }
  if (R.body && CHAR[id]) R.extra.push(o => { if (o.tuck) CHAR[id](R, o); });
  if (R.body) { grp.userData.rig = R; pose(grp, {}); }
  else if (!/^(jar|hom|shelf|tag)/.test(id) && id !== 'coin' && !(extra && extra.raw)) { // every piece fits the same box: 2.5 wide and 3.1 tall, flat ones 2.9 wide
    const w = new T.Group(); grp.children.slice().forEach(c => w.add(c)); const bb = new T.Box3().setFromObject(w), sz = bb.getSize(new T.Vector3());
    let k = FLAT[id] ? 2.9 / Math.max(sz.x, sz.z, 0.1) : Math.min(2.5 / Math.max(sz.x, sz.z, 0.1), 3.1 / Math.max(sz.y, 0.1)); k = Math.max(0.25, Math.min(2.4, k)); inkK = k;
    w.scale.setScalar(k); w.position.set(-(bb.min.x + bb.max.x) / 2 * k, -bb.min.y * k, -(bb.min.z + bb.max.z) / 2 * k); grp.add(w); }
  // every piece stands centered on its own place, so the words under it sit under its middle
  { const bb = new T.Box3().setFromObject(grp), cx = (bb.min.x + bb.max.x) / 2; if (isFinite(cx) && !R.body && inkK === 1) grp.children.forEach(c => { c.position.x -= cx; }); }
  finish(T, grp, (extra && extra.ink) || 0.05 / inkK); if (grp.userData.rig2) rigInk(grp); return true;
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
function creature(T, key, tint, stage, push) { const g = new T.Group(); return build(HOMID[key], T, g, tint || new T.Color(0x3a6fd0), stage ? { stage, push: !!push } : undefined) ? g : null; }
// (builder 17) how big each of the five forms stands, as a share of the full-grown one
const STAGE_SIZE = [0.5, 0.66, 0.8, 0.9, 1];
const stageSize = s => STAGE_SIZE[Math.max(1, Math.min(5, s | 0)) - 1];
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
// ---------- (builder 21) THE RIG: placing the parts, and the motion ----------
// rigSet(grp, a, b, k, pose): every part of a rigged creature (grp.userData.rig2, made in build by RIG[id]) is put where form(a) says, or k of the way to form(b).
// pose is { part: { p: [dx, dy, dz] added (the figure's units), s: [x, y, z] multiplied, r: [x, y, z] turned about the part's own pivot, k: this part's own way from a to b } }.
// A child rides on its parent's pose; the ink line of each part is kept the same thickness whatever its size.
const RIG_ID = { p: [0, 0, 0], s: [1, 1, 1] };
function rigForm(Rg, s) { let F = Rg.fc[s]; if (!F) { F = Rg.fc[s] = Rg.form(s); const T = Rg.T; Object.keys(F).forEach(n => { const X = F[n]; if (n === '_') return; X.q = new T.Quaternion(); if (X.to) { const d = new T.Vector3(X.to[0] - X.p[0], X.to[1] - X.p[1], X.to[2] - X.p[2]), l = d.length(); X.s = [l, l, l]; X.q.setFromUnitVectors(new T.Vector3(0, -1, 0), d.normalize()); } else if (X.r) X.q.setFromEuler(new T.Euler(X.r[0], X.r[1], X.r[2])); }); } return F; }
function rigSet(grp, a, b, k, pose) {
  const Rg = grp && grp.userData && grp.userData.rig2; if (!Rg) return false; const T = Rg.T, FA = rigForm(Rg, a), FB = rigForm(Rg, b), M = Rg.m || (Rg.m = {}), MM = Rg.mm || (Rg.mm = {}), W = Rg.w || (Rg.w = {}), E = Rg.e || (Rg.e = new T.Euler()), Q = Rg.q || (Rg.q = new T.Quaternion());
  Rg.a = a; Rg.b = b; Rg.k = k || 0; Rg.pose = pose; pose = pose || {}; Rg.all.position.set(0, 0, 0); Rg.all.scale.set(1, 1, 1); Rg.all.rotation.set(0, 0, 0);
  Rg.order.forEach(n => { const g = Rg.parts[n], A = FA[n], B = FB[n], X = A || B, po = pose[n], par = Rg.par[n], Pm = par ? M[par] : RIG_ID, Pw = par ? W[par] : RIG_ID.s;
    if (!X || !Pm) { g.visible = false; M[n] = null; return; }
    const Y = B || A, kk = Math.max(0, Math.min(1, po && po.k != null ? po.k : Rg.k)), m = MM[n] || (MM[n] = { p: [0, 0, 0], s: [0, 0, 0] }), w = W[n] || (W[n] = [1, 1, 1]), l = [0, 0, 0], c = [0, 0, 0]; M[n] = m;
    for (let i = 0; i < 3; i++) { m.p[i] = X.p[i] + (Y.p[i] - X.p[i]) * kk; m.s[i] = (A ? A.s[i] : 0) * (1 - kk) + (B ? B.s[i] : 0) * kk; const d = Math.max(1e-4, Pm.s[i]); l[i] = (m.p[i] + (po && po.p ? po.p[i] : 0) - Pm.p[i]) / d; c[i] = m.s[i] * (po && po.s ? po.s[i] : 1) / d; w[i] = c[i] * Pw[i]; }
    g.position.set(l[0], l[1], l[2]); g.scale.set(c[0], c[1], c[2]); g.quaternion.copy(X.q); if (X !== Y) g.quaternion.slerp(Y.q, kk); if (po && po.r) { E.set(po.r[0], po.r[1], po.r[2]); Q.setFromEuler(E); g.quaternion.premultiply(Q); }
    g.visible = Math.max(Math.abs(c[0]), Math.abs(c[1]), Math.abs(c[2])) > 1e-4;
    const L = Rg.ink && Rg.ink[n]; if (L) for (let i = 0; i < L.length; i++) { const q = L[i], t = 2 * Rg.inkT, ms = q.m.scale; q.o.scale.set(ms.x * (1 + t / Math.max(0.05, q.sz.x * ms.x * Math.abs(w[0]))), ms.y * (1 + t / Math.max(0.05, q.sz.y * ms.y * Math.abs(w[1]))), ms.z * (1 + t / Math.max(0.05, q.sz.z * ms.z * Math.abs(w[2])))); } });
  if (Rg.post) Rg.post(pose, a, b);
  return true;
}
// after build has drawn the ink lines: each part learns its own, so that rigSet can keep them even
function rigInk(grp) { const Rg = grp.userData.rig2; if (!Rg) return; const T = Rg.T; Rg.ink = {};
  Rg.order.forEach(n => { const g = Rg.parts[n], L = []; g.children.forEach(o => { if (!o.isMesh || !o.material || o.material.side !== T.BackSide) return; const m = g.children.find(q => q.isMesh && q !== o && q.geometry === o.geometry); if (!m) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); L.push({ o, m, sz: m.geometry.boundingBox.getSize(new T.Vector3()) }); }); if (L.length) Rg.ink[n] = L; });
  rigSet(grp, Rg.a, Rg.b, Rg.k, Rg.pose); }
// THE MOTION KIT, the same for every rigged creature. Nothing here keeps a state: every value is worked out from the time, so nothing can jitter; a part that
// lags reads the body's state of a moment ago.
const RK = (() => {
  const cl = (v, a, b) => Math.max(a == null ? 0 : a, Math.min(b == null ? 1 : b, v)), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, eo = u => 1 - Math.pow(1 - cl(u), 3), ei = u => { u = cl(u); return u * u * u; };
  const back = u => { u = cl(u); return 1 + 3.2 * Math.pow(u - 1, 3) + 2.2 * Math.pow(u - 1, 2); };                       // past its place by a seventh, then back
  const ring = (ms, tau, per) => (ms < 0 ? 0 : Math.exp(-ms / tau) * Math.cos(ms / per * 6.2832));                             // a landing: full, through nothing, over the other way, settling
  const hop = u => { u = cl(u); return u < 0.45 ? 1 - Math.pow(1 - u / 0.45, 2.2) : u < 0.6 ? 1 : 1 - Math.pow((u - 0.6) / 0.4, 2.4); };   // up easing out, a hang at the top, a fast fall
  const pulse = (x, a, b, e) => sm((x - a) / e) * (1 - sm((x - b) / e));                                                         // 1 between a and b, eased in and out over e
  const mod = (x, p) => ((x % p) + p) % p;
  const part = (P, n) => P[n] || (P[n] = { p: [0, 0, 0], s: [1, 1, 1], r: [0, 0, 0] });
  const mv = (P, n, x, y, z) => { const q = part(P, n); q.p[0] += x; q.p[1] += y; q.p[2] += z; }, sc = (P, n, x, y, z) => { const q = part(P, n); q.s[0] *= x; q.s[1] *= y == null ? x : y; q.s[2] *= z == null ? x : z; }, rt = (P, n, x, y, z) => { const q = part(P, n); q.r[0] += x; q.r[1] += y; q.r[2] += z; };
  const squash = (P, n, k) => { const sy = Math.max(0.3, 1 - k), sx = 1 / Math.sqrt(sy); sc(P, n, sx, sy, sx); };               // flat and wide, or tall and thin: the volume is kept
  // the body acts and the rest follows late: S(lag in ms) gives { sq, lean, dx, vy } of that moment. hips squash from the feet; the body, the point, the arms and whatever is held come after
  const dress = (P, d, S, held) => { const a = S(0), b = S(70), c = S(150), e = S(230), R = d.R;
    squash(P, 'hips', a.sq); rt(P, 'hips', 0, 0, a.lean); mv(P, 'hips', a.dx, 0, 0); squash(P, 'body', (b.sq - a.sq) * 0.5); rt(P, 'body', 0, 0, (b.lean - a.lean) * 0.7);
    rt(P, 'point', 0.5 * (c.vy || 0), 0, (c.lean - a.lean) * 2.4 - (c.dx - a.dx) / R * 1.2); sc(P, 'point', 1 + c.sq * 0.5, 1 - c.sq * 1.5, 1 + c.sq * 0.5);
    ['L', 'R'].forEach((s, i) => { const q = i ? 1 : -1; rt(P, 'arm' + s, 0.55 * (b.vy || 0) - 0.5 * b.sq, 0, q * (0.9 * Math.max(0, b.sq) + 0.25 * Math.abs(b.vy || 0)) + (b.lean - a.lean) * 1.5); mv(P, 'arm' + s, 0, -R * 0.25 * (b.sq - a.sq), 0); });
    /* (builder 22) knees fold as it squashes and as it pushes off; elbows fold on the way up and open on the way down */ ['L', 'R'].forEach((s, i) => { part(P, 'leg' + s).b = (part(P, 'leg' + s).b || 0) + 1.5 * Math.max(0, a.sq) + 0.5 * Math.max(0, a.vy || 0) * (i ? 1 : 0.6); part(P, 'arm' + s).b = (part(P, 'arm' + s).b || 0) - 0.5 - 0.7 * Math.max(0, b.sq) - 0.5 * (b.vy || 0) * (i ? 1 : 0.7); });
    (held || []).forEach(n => { mv(P, n, -(e.dx - a.dx) * 0.8, -R * 0.5 * (e.sq - a.sq), 0); rt(P, n, 0, 0, (e.lean - a.lean) * 2); }); return a; };
  // the face: wide -1 (shut) .. 0 .. 1 (wide), brow -1 (angry) .. 1 (raised), look [x, y], open 0 (shut) .. 1 (as wide as it goes) or null (as drawn), smile 0..1
  const face = (P, d, f) => { const R = d.R, w = f.wide || 0, lx = (f.look ? f.look[0] : 0) * d.ey[3] * 0.9, ly = (f.look ? f.look[1] : 0) * d.ey[3] * 0.9, bw = f.brow || 0;
    ['L', 'R'].forEach((s, i) => { const q = i ? 1 : -1; sc(P, 'eye' + s, 1 + 0.2 * Math.abs(w), Math.max(0.1, w < 0 ? 1 + 0.9 * w : 1 + 0.5 * w), 1); mv(P, 'eye' + s, lx, ly, 0); mv(P, 'brow' + s, lx * 0.4, bw * R * 0.09 + Math.max(0, w) * R * 0.06 + ly * 0.4, 0); rt(P, 'brow' + s, 0, 0, -q * bw * 0.45); });
    const r0 = d.mw[3], shut = r0 * (d.tl ? 0.22 : 0.6), wide = Math.max(r0 * 1.45, R * 0.42), o0 = (r0 - shut) / (wide - shut), op = f.open == null ? o0 : f.open, y = shut + (wide - shut) * op, dy = y - r0;
    sc(P, 'maw', 1 + 0.1 * (op - o0) + 0.1 * (f.smile || 0), y / r0, 1); mv(P, 'jawU', 0, dy * 0.8, 0); mv(P, 'jawL', 0, -dy * 0.8, 0); mv(P, 'tongue', 0, -dy * 0.5, 0); if (f.smile) mv(P, 'mouth', 0, -R * 0.03 * f.smile, 0); return o0; };
  // what goes on by itself all the time: bubbles rise from the body and pop, fumes drift up, drips swell, fall and eat a pit (t in beats)
  const ambient = (P, Rg, F, t, amp) => { const d = F._, R = d.R;
    [5, 7].forEach((per, i) => { const u = mod(t + i * 2.3, per) / per, k = u > 0.96 ? 0 : sm(u * 5) * (0.7 + 0.6 * u) * (u > 0.9 ? 1 + 5 * (u - 0.9) : 1); mv(P, 'bub' + i, 0.1 * R * Math.sin(u * 9 + i), Math.pow(u, 0.8) * R * 1.3, 0); sc(P, 'bub' + i, k * amp); });
    [9, 11, 13].forEach((per, i) => { if (!F['puff' + i]) return; const u = mod(t + i * 3.7, per) / per; mv(P, 'puff' + i, 0.18 * R * Math.sin(u * 6.2832 + i), (u - 0.4) * R * 0.9, 0); sc(P, 'puff' + i, Math.sqrt(Math.sin(Math.PI * u)) * (0.75 + 0.6 * u)); });
    let land = -1; [8, 10, 12].forEach((per, i) => { const X = F['drip' + i]; if (!X) return; const x = mod(t + i * 3.1, per), g = per - 1.7; if (x < g) { const k = sm(x / g); sc(P, 'drip' + i, k, k * (0.7 + 0.5 * k), k); } else if (x < g + 0.7) { const u = (x - g) / 0.7; mv(P, 'drip' + i, 0, -u * u * (X.p[1] - 0.06), 0); sc(P, 'drip' + i, 0.8, 1.35, 0.8); } else { sc(P, 'drip' + i, 0); if (!i) land = x - g - 0.7; } if (!i && x < 4) land = x + 1; });
    sc(P, 'sizzle', land < 0 ? 0 : eo(land / 0.4) * (1 - sm((land - 0.6) / 4))); };
  return { cl, sm, eo, ei, back, ring, hop, pulse, mod, part, mv, sc, rt, squash, dress, face, ambient };
})();
// CLIP[id]: the creature's own motion, from the kit. Each clip fills a pose from the time and gives back what the page needs to move the whole figure:
//   rest(Rg, F, P, beats, o)  o: { glance 0..1, look [x, y], spent 0..1, land (ms since it landed), jar }
//   act(Rg, F, P, ms, o)      o: { W, J, D, B (the plan's lengths: wind-up, the way there, the work, the way home), N (hops each way), bites [parts of D], hop [ms into the work, length, way] (a hop to a second place; out.e2 is how far along it), dir (the way it goes, -1 or 1), sd (the side its food is on) } -> { e 0 home .. 1 at the molecule, y 0..1 of a hop's height, lunge 0..1, reach 0..1 }
//   evo(Rg, F, P, ms, o)      o: { L (a beat), from, to } -> { e, y, big 0..1, n (beats since it landed), done }
const CLIP = {
  homacid: (() => { const K = RK, HELD = ['bolt', 'bar', 'chunk'], GROUND = ['pit', 'pit2', 'pit3', 'pit4', 'crumb0', 'crumb1', 'crumb2', 'chip0', 'chip1', 'plankL', 'plankR'];
    const prop = (P, F, k) => { if (k >= 1) return; const d = F._; HELD.forEach(n => { const X = F[n]; if (!X) return; K.sc(P, n, k); K.mv(P, n, (0 - X.p[0]) * (1 - k), (d.mw[0] - X.p[1]) * (1 - k), (d.mw[1] - X.p[2]) * (1 - k)); }); }, ground = (P, k) => { if (k < 1) GROUND.forEach(n => K.sc(P, n, k)); };
    const leap = (u, dir) => { const v = (K.hop(u + 0.03) - K.hop(u - 0.03)) / 0.06; return { sq: -Math.min(0.34, Math.abs(v) * 0.12) + 0.07 * K.pulse(u, 0.42, 0.62, 0.08), lean: -dir * K.cl(v * 0.07, -0.2, 0.26), dx: 0, vy: K.cl(v / 2.6, -1, 1) }; };
    // (builder 22, the owner: "still seem stiff") no two hops alike. HV: each hop's length, its height, and 1 for a stumble (it comes down short, tips forward and catches itself before the next)
    const HV = [[1, 0.34, 0], [0.72, 0.2, 0], [1.3, 0.52, 0], [0.6, 0.15, 1], [1.15, 0.4, 0]], lands = N => { let t = 0; const L = []; for (let k = 0; k < N; k++) { t += HV[k % 5][0]; L.push(t); } return L.map(v => v / t); };
    const trip = (u, N, dir) => { let tot = 0; for (let k = 0; k < N; k++) tot += HV[k % 5][0]; let x = K.cl(u) * tot, i = 0, e0 = 0; while (i < N - 1 && x > HV[i % 5][0]) { x -= HV[i % 5][0]; e0 += HV[i % 5][0]; i++; }
      const h = HV[i % 5], v = x / h[0], stm = i > 0 && HV[(i - 1) % 5][2], C = i ? (stm ? 0.42 : 0.26) : 0.08, hh = i === N - 1 ? 0.62 : h[1];
      if (v < C) { const c = v / C; return { e: e0 / tot, y: 0, sq: (stm ? 0.44 : 0.3) * Math.sin(Math.PI * Math.min(1, c * 0.8 + 0.2)), lean: -dir * (stm ? 0.34 * (1 - c) * Math.cos(c * 7) : 0.1 * c), dx: stm ? dir * 0.3 * (1 - c) : 0, vy: 0 }; }
      const w = (v - C) / (1 - C), l = leap(w, dir); l.e = (e0 + w * h[0]) / tot; l.y = K.hop(w) * hh; l.sq *= 0.75; return l; };
    return { lands,
      rest(Rg, F, P, tb, o) { const s = Rg.stage, d = F._, R = d.R, amp = o.jar ? 0.6 : 1, sp = o.spent || 0, t = tb * (o.jar ? 0.55 : 1), gl = o.glance || 0, lk = o.look || [1, 0.3], land = o.land == null ? 1e9 : o.land;
        const S = lag => { const q = t - lag / 500, ph = K.mod(q, 13), w = ph < 6.5 ? K.sm(ph) * 2 - 1 + 0.2 * K.ring((ph - 1) * 500, 170, 430) : 1 - 2 * K.sm(ph - 6.5) - 0.2 * K.ring((ph - 7.5) * 500, 170, 430);
          return { sq: amp * (0.03 * (1 - sp) * Math.sin(q * 1.5708) + 0.045 * sp * Math.sin(q * 0.7854)) + 0.2 * sp + 0.45 * K.ring(land - lag, 130, 330), lean: 0.05 * w * amp * (1 - sp) + 0.13 * sp - 0.06 * gl * lk[0], dx: 0.07 * R * w * amp * (1 - sp), vy: 0 }; };
        K.dress(P, d, S, HELD); K.rt(P, 'hips', 0, 0.3 * gl * lk[0], 0);
        const bx = Math.min(K.mod(t, 7), K.mod(t, 11) + 4 > 7.36 ? 9 : Math.abs(K.mod(t, 11) - 3) < 0.4 ? K.mod(t, 11) - 3 : 9), blink = bx >= 0 && bx < 0.36 ? 1 - Math.abs(bx / 0.18 - 1) : 0, dart = K.pulse(K.mod(t, 9), 4, 5.6, 0.15) * (Math.floor(t / 9) % 2 ? -0.8 : 0.8) * (1 - gl) * (1 - sp);
        const f = { wide: Math.min(0.6 * gl - blink * (1 + 0.6 * gl), 0.6 * gl - 0.6 * sp - blink * 0.4) - 0.5 * K.pulse(land, -1, 110, 40), brow: 0.7 * gl + 0.9 * sp, look: [lk[0] * gl + dart, lk[1] * gl - 0.5 * sp], open: null, smile: 0 };
        if (s === 2) { const ph = K.mod(t, 5), n = ph < 1.2 ? Math.sin(ph / 1.2 * 12.566) : 0, b = Math.max(0, n) * (1 - sp); f.open = 0.12 + 0.5 * b; K.mv(P, 'bolt', 0, 0.05 * R * b, 0); K.rt(P, 'bolt', 0, 0, 0.14 * n * (1 - sp)); ['armL', 'armR'].forEach(n2 => K.rt(P, n2, -0.12 * b, 0, 0)); }
        else if (s === 3) { const ph = K.mod(t, 3), c = (ph < 0.5 ? Math.sin(Math.PI * ph / 0.5) : 0) * (1 - sp), sw = 0.13 * Math.sin(t * 1.0472) * (1 - sp); f.open = K.face({}, d, {}) * (1 - 0.8 * c); ['bar', 'armL', 'armR'].forEach(n => K.mv(P, n, sw, 0, 0)); K.squash(P, 'body', 0.04 * c); }
        else if (s === 4) { const lick = K.pulse(K.mod(t, 9), 5, 6.4, 0.3); K.mv(P, 'tongue', 0.12 * Math.sin(t * 5) * lick, -0.08 * lick, 0.12 * lick); K.sc(P, 'tongue', 1 + 0.25 * lick); K.rt(P, 'plankL', 0, 0, 0.03 * Math.sin(t * 1.5708)); K.rt(P, 'plankR', 0, 0, -0.03 * Math.sin(t * 1.5708)); }
        else if (s === 5) { const b = Math.sin(t * 1.5708 + 1), yw = K.pulse(K.mod(t, 17), 12, 14, 0.7) * (1 - sp); K.sc(P, 'pool', 1 + 0.025 * b, 1 - 0.04 * b, 1 + 0.025 * b); ['leg5', 'jar5'].forEach((n, i) => { K.mv(P, n, 0, 0.09 * Math.sin(t * 1.2566 + i * 2), 0); K.rt(P, n, 0, 0, 0.07 * Math.sin(t * 0.8976 + i)); }); if (yw > 0) { f.open = K.face({}, d, {}) + (1 - K.face({}, d, {})) * yw; f.wide = Math.min(f.wide, -0.8 * yw); K.squash(P, 'body', -0.07 * yw); } }
        K.face(P, d, f); K.ambient(P, Rg, F, t, amp); prop(P, F, K.sm((land - 350) / 450)); ground(P, K.eo(land / 420)); return { e: 0, y: 0 }; },
      // (the owner: "I would prefer if the sprites walked to the molecule and interacted with it") THE ACT IS A TRIP: it goes to the molecule on its own feet in N short hops
      // (trip: a push off the ground, a low arc, a landing that is the next push), handles the piece there, and comes home the same way. o.N hops each way.
      act(Rg, F, P, a, o) { const d = F._, T1 = o.W, T2 = T1 + o.J, T3 = T2 + o.D, T4 = T3 + o.B, CR = 0.12, N = o.N || 3, last = o.bites[o.bites.length - 1] * o.D, G0 = last + 190, f = { wide: 0, brow: 0, look: [0, 0], open: null, smile: 0 }, o0 = K.face({}, d, {});
        // a bite, x ms from its snap (the snap is at 60): the hands go out to the piece and bring it to the mouth, the body goes with them; the jaws shut on it; it chews
        const bite = ms => { let reach = 0, lunge = 0, sq = 0, open = null, shut = 0; o.bites.forEach(b => { const x = ms - b * o.D; if (x < -190 || x > 330) return; reach = Math.max(reach, K.sm((x + 190) / 110) * (1 - K.sm((x - 15) / 50))); lunge += K.sm((x + 190) / 120) * (1 - K.sm((x - 140) / 130)); sq += 0.24 * K.ring(x - 60, 90, 230) - 0.1 * K.pulse(x, -150, 30, 40); if (x < 60) open = Math.max(open || 0, K.sm((x + 130) / 100)); else { open = 0.3 * Math.abs(Math.sin((x - 60) / 58)) * K.sm((x - 100) / 40); shut = Math.max(shut, 1 - K.sm((x - 60) / 130)); } }); return { reach, lunge, sq, open, shut }; };
        const S = lag => { const t = a - lag; if (t < T1) { const u = t / T1; return { sq: 0.4 * K.eo(u / 0.5) - 0.6 * K.ei((u - 0.84) / 0.16), lean: o.dir * 0.1 * K.eo(u / 0.5), dx: 0, vy: 0 }; }
          if (t < T2) return trip((t - T1) / o.J, N, o.dir);
          if (t < T3) { const ms = t - T2, b = bite(ms), g = ms - G0, hp = o.hop; if (hp && ms >= hp[0] && ms < hp[0] + hp[1]) { const u = (ms - hp[0]) / hp[1], l = u < 0.2 ? { sq: 0.3 * Math.sin(Math.PI * u / 0.2 * 0.8), lean: 0, dx: 0, vy: 0, y: 0, e2: 0 } : leap((u - 0.2) / 0.8, hp[2]); if (u >= 0.2) { l.e2 = (u - 0.2) / 0.8; l.y = K.hop(l.e2) * 0.5; } l.b = b; return l; }
            return { e2: hp && ms >= hp[0] ? 1 : 0, y: 0, dx: o.dir * 0.34 * d.R * Math.exp(-ms / 150) /* it skids in */, sq: 0.4 * K.ring(ms, 110, 300) + (hp ? 0.36 * K.ring(ms - hp[0] - hp[1], 110, 300) : 0) + b.sq + (g > 0 ? -0.24 * Math.sin(Math.PI * K.cl(g / 190)) * (g < 190 ? 1 : 0) + 0.18 * K.ring(g - 190, 110, 270) : 0), lean: -o.sd * 0.22 * b.lunge - o.dir * 0.2 * Math.exp(-ms / 150), vy: 0, b }; }
          if (t < T4) { const u = (t - T3) / o.B; if (u < CR) return { sq: 0.3 * Math.sin(Math.PI * u / CR * 0.8), lean: -o.dir * 0.08, dx: 0, vy: 0, e: 0, y: 0 }; return trip((u - CR) / (1 - CR), N, -o.dir); }
          return { sq: 0.45 * K.ring(t - T4, 130, 330), lean: 0, dx: 0, vy: 0 }; };
        const st = K.dress(P, d, S, HELD), out = { e: 0, y: 0, lunge: 0, reach: 0 }; let pk = 0, gk = 0;
        if (a < T1) { const u = a / T1; f.wide = -0.4 * K.sm(u * 3); f.brow = -0.7 * K.sm(u * 3); f.look = [o.dir, 0.4]; pk = 1 - K.sm((u - 0.15) / 0.45); gk = 1; if (pk < 1 && pk > 0) f.open = o0 + (1 - o0) * Math.sin(Math.PI * pk); }
        else if (a < T2) { const u = (a - T1) / o.J; out.e = st.e; out.y = st.y; f.wide = 0.5; f.brow = -0.2; f.look = [o.dir, 0.2]; f.open = o0 + (0.8 - o0) * K.sm((u - 0.7) / 0.3); gk = 1 - K.sm(u * 8); }
        else if (a < T3) { const ms = a - T2, b = st.b, g = ms - G0; out.e = 1; out.e2 = st.e2 || 0; out.y = st.y || 0; out.lunge = b.lunge; out.reach = b.reach; gk = K.eo(ms / 350) * 0.6; f.look = [o.sd, 0.1]; f.brow = -0.5; f.open = b.open == null ? 0.3 : b.open; f.wide = b.reach > 0.05 ? 0.9 * b.reach : -0.9 * b.shut; if (ms < 90) f.wide = -0.5;
          ['L', 'R'].forEach((s, i) => { K.rt(P, 'arm' + s, -1.0 * b.reach, 0, (i ? -1 : 1) * 0.3 * b.reach - o.sd * 0.5 * b.reach); K.sc(P, 'arm' + s, 1 + 0.5 * b.reach); });
          if (g > 0) { /* the swallow (the neck goes up, the lump goes down), then the pleased look */ const gu = K.pulse(g, 0, 190, 40), pl = K.sm((g - 190) / 120); f.open = 0.08; f.wide = -0.9 * gu - 0.72 * pl; f.brow = 0.8 * gu + pl; f.smile = pl; f.look = [0, 0.3 * gu]; K.sc(P, 'body', 1 - 0.1 * gu + 0.12 * K.pulse(g, 150, 330, 60), 1, 1); } }
        else if (a < T4) { const u = (a - T3) / o.B; f.smile = 1; f.brow = 1; f.open = 0.1; f.wide = -0.6 + 0.9 * K.sm(u * 4); f.look = [-o.dir, 0.2]; out.e = u < CR ? 1 : 1 - st.e; out.y = u < CR ? 0 : st.y; gk = 0.6 * (1 - K.sm(u / CR)); K.rt(P, 'point', 0, 0, 0.25 * Math.sin(a / 60)); }
        else { const ms = a - T4; f.wide = -0.6 * K.pulse(ms, -1, 110, 40) - 0.3; f.brow = 0.8; f.smile = 0.6; f.open = 0.1; gk = K.eo(ms / 420); pk = K.sm((ms - 350) / 450); }
        K.face(P, d, f); K.ambient(P, Rg, F, a / 500, 1); prop(P, F, pk); ground(P, gk); return out; },
      evo(Rg, F, P, a, o) { const d = F._, L = o.L, PRE = 420, OUT = 2.2 /* (builder 22) it goes out and comes back on foot, in beats */, n = a / L - OUT, END = 5.7, CR = 0.4, out = { e: 0, y: 0, big: 0, n, done: false }, FA = rigForm(Rg, o.from), FB = rigForm(Rg, o.to), fr = o.from, f = { wide: 0, brow: 0, look: [0, 0], open: null, smile: 0 };
        const S = lag => { const t = a - lag, m = t / L - OUT; if (t < 0) { const u = 1 + t / PRE; return { sq: 0.38 * K.eo(u / 0.55) - 0.6 * K.ei((u - 0.85) / 0.15), lean: 0, dx: 0, vy: 0 }; }
          if (m < 0) return trip(t / (OUT * L), 4, o.dir);
          if (m < END) { let sq = 0.45 * K.ring(m * L, 130, 330); for (let b = 1; b <= 4; b++) sq += 0.1 * K.pulse(m, b - 0.22, b - 0.02, 0.1) - 0.2 * K.ring((m - b) * L, 110, 280); return { sq, lean: 0, dx: 0, vy: 0 }; }
          if (m < END + CR) { const u = (m - END) / CR; return { sq: 0.36 * K.eo(u / 0.6) - 0.55 * K.ei((u - 0.8) / 0.2), lean: 0, dx: 0, vy: 0 }; }
          if (m < END + CR + OUT) return trip((m - END - CR) / OUT, 4, -o.dir);
          return { sq: 0.45 * K.ring((m - END - CR - OUT) * L, 130, 330), lean: 0, dx: 0, vy: 0 }; };
        const st = K.dress(P, d, S, HELD); out.home = n >= END + CR + OUT;
        if (a < 0) { f.wide = -0.3; f.brow = -0.4; } else if (n < 0) { out.e = st.e; out.y = st.y; out.big = K.sm(a / (OUT * L)); f.wide = 0.7; f.brow = 0.5; }
        else if (n < END + CR) { out.e = 1; out.big = 1; } else if (n < END + CR + OUT) { const u = (n - END - CR) / OUT; out.e = 1 - st.e; out.y = st.y; out.big = 1 - K.sm(u); f.smile = 1; f.brow = 1; f.wide = 0.3; } else { out.done = n > END + CR + OUT + 0.5; f.smile = 0.6; f.brow = 0.8; }
        // every part has its own beat. The rules, first that fits: [name test, beat, how, length in beats]. how: 'm' it tweens between the two forms, 'p' it grows there with a bounce,
        // 'd' it drops in from above, 'u' it comes up from below, 'a' it goes into the mouth and is gone, 'g' it shrinks away where it is
        const RULE = { 1: [[/^(foot|leg)L/, 2, 'p'], [/^(foot|leg)R/, 2.25, 'p'], [/^armL/, 3, 'p'], [/^armR/, 3.2, 'p'], [/^bolt/, 3.5, 'x'], [/^crumb/, 4.6, 'p']],
          2: [[/^bolt/, 1, 'a', 0.6], [/^crumb/, 1.3, 'g'], [/^leg/, 2, 'p'], [/^(jawL|toothL)/, 2.5, 'p', 0.4], [/^bar/, 3, 'd', 0.5], [/^drip/, 4, 'p'], [/^pit[23]/, 4.2, 'p'], [/^puff/, 4.4, 'p'], [/^sizzle/, 9, 'p']],
          3: [[/^bar/, 1, 'x'], [/^plank/, 2, 'x'], [/^(leg|foot)/, 3, 'g', 0.3], [/^pit4/, 3.2, 'p'], [/^tongue/, 4, 'p'], [/^chunk/, 4.3, 'd', 0.5], [/^puff1/, 4.6, 'p']],
          4: [[/^chunk/, 1.2, 'a', 0.5], [/^plank/, 2, 'x'], [/^(pool|pit$)/, 2, 'x'], [/^(mouth|maw|jaw|tooth|tongue)/, 3, 'm', 0.6], [/^leg5/, 4, 'u'], [/^jar5/, 4.4, 'u'], [/^chip/, 4.2, 'p'], [/^drip2/, 4.6, 'p'], [/^puff2/, 4.8, 'p']] }[fr] || [];
        Rg.order.forEach(nm => { const A = FA[nm], B = FB[nm]; if (!A && !B) return; let r = null; for (let i = 0; i < RULE.length && !r; i++) if (RULE[i][0].test(nm)) r = RULE[i]; const at = (r ? r[1] : 1) + (!A && /^tooth[UL]\d/.test(nm) ? 0.25 + 0.13 * +nm.slice(6) : 0) /* (builder 22) new teeth come in one after another */, how = r ? r[2] : A && B ? 'm' : B ? 'p' : 'g', len = (r && r[3]) || 0.7, u = K.cl((n - at) / len), q = K.part(P, nm), X = B || A;
          if (how === 'm') { q.k = K.sm(u); if (u > 0 && (nm === 'body' || nm === 'pool')) { /* (builder 22) the body does not just swell: it is pulled up tall and thin, drops past its new shape, and settles */ const ms = (n - at - len) * L; K.squash(P, nm, u < 1 ? -0.36 * Math.sin(Math.PI * u) * (0.4 + 0.6 * u) : 0.26 * Math.exp(-ms / 170) * Math.sin(ms / 300 * 6.2832)); } }
          else if (how === 'p') { q.k = K.sm(u * 2); if (u > 0 && u < 1) K.sc(P, nm, K.back(u) / Math.max(0.02, q.k)); }
          else if (how === 'd') { q.k = n >= at ? 1 : 0; const fall = u < 0.6 ? 1 - K.ei(u / 0.6) * 1 : 0, bn = u >= 0.6 ? 0.12 * Math.abs(Math.sin((u - 0.6) / 0.4 * 6.2832)) * (1 - u) : 0; K.mv(P, nm, 0, 5 * fall * (1 - K.cl(u / 0.6) * K.cl(u / 0.6)) + bn, 0); K.rt(P, nm, 0, 0, 1.2 * fall); }
          else if (how === 'u') { q.k = K.sm(u * 2.5); K.mv(P, nm, 0, -1.3 * (1 - K.back(u)), 0); K.rt(P, nm, 0, 0, 0.5 * (1 - K.back(u))); }
          else if (how === 'a') { q.k = K.sm((u - 0.45) / 0.55); const g = K.sm(u / 0.6), y0 = X.p[1]; K.mv(P, nm, (0 - X.p[0]) * g, (d.mw[0] - y0) * g + 0.5 * Math.sin(Math.PI * K.cl(u / 0.6)), (d.mw[1] - X.p[2]) * g * 0.8); K.rt(P, nm, 0, 0, 3 * g); if (u > 0 && u < 1) { f.open = 0.95 * K.pulse(u, 0.05, 0.6, 0.12); f.wide = 0.6; } }
          else if (how === 'g') q.k = K.sm(u);
          else if (nm === 'bolt') { /* it drops on the page in front, is looked at, and picked up on the next beat */ q.k = n >= at ? 1 : 0; const fall = K.cl((n - at) / 0.3), up = K.sm((n - 4.05) / 0.5), fx = 0.75, fy = 0.09 - X.p[1], fz = 0.55; K.mv(P, nm, fx * (1 - up), fy * (1 - up) + 4 * (1 - fall * fall) + 0.25 * Math.sin(Math.PI * up), fz * (1 - up)); K.rt(P, nm, 0, 0.6 * (1 - up), 0); const rch = K.pulse(n, 3.95, 4.3, 0.12); ['armL', 'armR'].forEach(s2 => K.rt(P, s2, -0.7 * rch, 0, -0.3 * rch)); K.squash(P, 'hips', 0.16 * rch); if (n > 3.5 && n < 4.3) f.look = [0.8, -0.8]; }
          else if (nm === 'bar') { /* it is eaten from both ends in three bites */ const b = Math.min(3, Math.floor(K.cl((n - 1) / 0.9) * 3 + 1e-6)), w = [1, 0.62, 0.3, 0][b]; q.k = b >= 3 ? 1 : 0; K.sc(P, nm, w, 1, 1); if (n > 0.8 && n < 2) f.open = 0.9 * Math.abs(Math.cos((n - 1) / 0.9 * 3 * Math.PI)); }
          else if (/^plank/.test(nm)) { const sd = nm === 'plankL' ? -1 : 1; if (fr === 3) { /* the plank is slid in under it; on the next beat it is bitten through and tips into the hole */ q.k = n >= 2 ? 1 : 0; const sl = 1 - K.eo((n - 2) / 0.5), cr = n < 3 ? 0 : 1 - K.ring((n - 3) * L, 120, 300); K.mv(P, nm, sd * (3.2 * sl - 0.34 * (1 - cr)), -0.22 * (1 - cr), 0); K.rt(P, nm, 0, 0, sd * 0.22 * (1 - cr)); } else { /* it goes under as the pool spreads */ const g = K.sm((n - 2) / 0.9); q.k = K.sm((n - 2.5) / 0.5); K.mv(P, nm, 0, -0.55 * g, 0); K.rt(P, nm, 0, 0, -sd * 0.5 * g); } }
          else { /* the pool spreads, with a wobble */ q.k = K.sm((n - 2) / 0.6); const wb = 0.22 * K.ring((n - 2.5) * L, 200, 330) * (n > 2.5 ? 1 : 0); K.sc(P, nm, 1 + wb, nm === 'pool' ? 1 - wb : 1, 1 + wb); } });
        if (fr === 3 && n > 1.6 && n < 3.4) { /* it hops to let the plank under, lands, and bites down through it */ const h = Math.sin(Math.PI * K.cl((n - 1.75) / 0.6)); K.mv(P, 'hips', 0, 0.9 * h, 0); if (n > 2.75) f.open = 0.9 * K.pulse(n, 2.8, 2.98, 0.06); }
        if (fr === 2 && n > 2.5 && n < 3.6) f.open = n < 3.32 ? 0.95 * K.sm((n - 2.5) / 0.3) : 0.02;
        if (fr === 4 && n > 3 && n < 4) f.open = K.face({}, d, {}) + (1 - K.face({}, d, {})) * Math.sin(Math.PI * K.cl((n - 3) / 0.9));
        if (n >= 0 && n < END) { let pop = 0; for (let b = 1; b <= 4; b++) pop = Math.max(pop, Math.exp(-Math.max(0, n - b) * 3.5) * (n >= b ? 1 : 0)); const pl = K.sm((n - 4.9) / 0.4); f.wide = Math.max(f.wide, 0.75 * pop) * (1 - pl) - 0.72 * pl - 0.6 * K.pulse(n * L, -1, 110, 40); f.brow = 0.6 * pop + pl; f.smile = pl; if (f.look[0] === 0 && pop > 0.3 && n < 4.9) f.look = [Math.floor(n) % 2 ? 0.5 : -0.5, -0.7]; }
        K.face(P, d, f); K.ambient(P, Rg, F, a / 500, 1); if (n < 0 || n >= END) ground(P, n < 0 ? 1 - K.sm(a / L * 6) : K.eo((n - END - CR - OUT) * L / 420)); return out; }
    }; })()
};
// rigPlay(grp, clip, time, o): one frame of a rigged creature's motion (clip 'rest' takes the time in beats, 'act' and 'evo' in ms from their start). Gives back what the clip gives.
function rigPlay(grp, clip, t, o) { const Rg = grp && grp.userData && grp.userData.rig2, C = Rg && CLIP[Rg.id]; if (!C || !C[clip]) return null; o = o || {}; const a = clip === 'evo' ? o.from : Rg.stage, b = clip === 'evo' ? o.to : Rg.stage, P = {}, out = C[clip](Rg, rigForm(Rg, clip === 'evo' ? o.to : Rg.stage), P, t, o); rigSet(grp, a, b, 0, P);
  /* (builder 22) the joints: a limb bends at its elbow or knee by the pose's b (radians); the upper half turns back by half of it so the hand stays about where it was */ Rg.order.forEach(n => { const el = Rg.parts[n].userData.elbow; if (!el) return; const bd = (P[n] && P[n].b) || 0; el.rotation.x = bd; if (bd) Rg.parts[n].rotateX(-bd / 2); });
  return out; }
AA.rxKit = { fogDrift: (g, t) => { /* the fog hangs, sinks and rolls slowly, on a loop */ let n = 0; g.traverse(o => { const f = o.userData && o.userData.fog; if (!f) return; n++; const a = t * 0.5 + f.n * 1.7, b = t * 0.31 + f.n * 2.9; o.position.x = f.x + (f.low ? 0.22 : 0.08) * f.w * Math.sin(a); o.position.y = f.y + (f.low ? 0.01 : -0.06 * f.h * (0.5 + 0.5 * Math.sin(b))); o.scale.set(f.w * (1 + 0.1 * Math.sin(b)), f.h * (1 + 0.08 * Math.cos(a)), 1); o.material.opacity = f.o * (0.82 + 0.18 * Math.sin(a * 0.7 + 1)); o.material.rotation += 0.0006 * (f.n % 2 ? 1 : -1); }); return n; }, pushOn: true, PUSHED: ['water', 'acid', 'slime', 'salt', 'co2', 'h2', 'wood', 'seedling', 'ammonia', 'brimstone'], stageSize, STAGED: ['water', 'acid', 'slime'], shelf: (T, n) => { const g = new T.Group(); return build(n > 5 ? 'shelf10' : 'shelf5', T, g, new T.Color(0x8a5a2b)) ? g : null; }, tag: (T, n) => { const g = new T.Group(); return build(n >= 1 && n <= 5 ? 'tag_' + n : 'tag_more', T, g, new T.Color(0xf0b93a)) ? g : null; }, build, FLAT, K, mat, finish, snap, PAL, drawCoin, use, jarReport, pose, poseToward, creature, jar, HOMID, list: T => { const g = {}; return build('__list', T, { add() {}, traverse() {}, children: [] }, new T.Color(0)); } };
// (builder 21) the rig: AA.rxKit.rigOn = false gives the solid pushed forms back
// ---------- (builder 22) THE AUTO RIG'S MOTION ----------
// autoClip(G): rest, act and evo for a creature rigged from its pushed drawings (AUTO in build). G is what is the creature's own:
//   gait(u, dir, ms, d) -> { e, y, sq, lean, dx, vy }: how it travels (u 0..1 of the way);   wind(u, dir): how it gathers itself before it goes;
//   work(ms, o, d) -> { sq, lean, dx, vy, lunge, reach }: its body while it works;   pose(Rg, F, P, a, o, q): its limbs (q.ph 0 wind, 1 going, 2 working, 3 coming home, 4 home);
//   life(Rg, F, P, beats, q): what its substance does all the time (q.drift: the way it is travelling, or 0);   out: beats it takes to walk to the evolve place.
const autoClip = G => { const K = RK, PARTS = ['base', 'legL', 'legR', 'body', 'point', 'eyeL', 'eyeR', 'armL', 'armR', 'fog', 'ground'], BEAT = { body: 1, fog: 1.2, base: 1.5, point: 2, armL: 2.5, armR: 2.8, legL: 3.2, legR: 3.4, eyeL: 3.9, eyeR: 3.9, ground: 4.3 };
  const eyes = (P, d, blink, lx, ly, wide) => ['L', 'R'].forEach(s => { K.sc(P, 'eye' + s, 1 + 0.25 * (wide || 0), Math.max(0.12, 1 + 0.4 * (wide || 0) - blink), 1); K.mv(P, 'eye' + s, lx * 0.07 * d.R, ly * 0.07 * d.R, 0); });
  const blinkAt = t => { const bx = Math.min(K.mod(t, 7), K.mod(t + 2.6, 11)); return bx < 0.36 ? 1 - Math.abs(bx / 0.18 - 1) : 0; }, ground = (P, k) => { if (k < 1) K.sc(P, 'ground', Math.max(0.001, k)); }, Z = () => ({ e: 0, y: 0, sq: 0, lean: 0, dx: 0, vy: 0 });
  return { G,
    rest(Rg, F, P, tb, o) { const d = F._, amp = o.jar ? 0.6 : 1, sp = o.spent || 0, t = tb * (o.jar ? 0.55 : 1), gl = o.glance || 0, lk = o.look || [1, 0.3], land = o.land == null ? 1e9 : o.land, sw = G.sway == null ? 1 : G.sway;
      const S = lag => { const q = t - lag / 500, ph = K.mod(q, 13), w = ph < 6.5 ? K.sm(ph) * 2 - 1 : 1 - 2 * K.sm(ph - 6.5); return { sq: amp * 0.03 * Math.sin(q * 1.5708) * (1 - sp) + 0.22 * sp + 0.045 * sp * Math.sin(q * 0.7854) + 0.4 * K.ring(land - lag, 130, 330), lean: 0.05 * w * amp * (1 - sp) * sw + 0.13 * sp - 0.06 * gl * lk[0], dx: 0.07 * d.R * w * amp * (1 - sp) * sw, vy: 0 }; };
      K.dress(P, d, S, []); K.rt(P, 'hips', 0, 0.3 * gl * lk[0], 0); const dart = K.pulse(K.mod(t, 9), 4, 5.6, 0.15) * (Math.floor(t / 9) % 2 ? -0.8 : 0.8) * (1 - gl) * (1 - sp);
      eyes(P, d, Math.max(blinkAt(t), 0.5 * sp), lk[0] * gl + dart, lk[1] * gl - 0.5 * sp, 0.5 * gl); if (G.life) G.life(Rg, F, P, t, { amp, sp, s: Rg.stage, drift: 0, rest: 1, ms: -1 }); ground(P, K.eo(land / 420)); return { e: 0, y: 0 }; },
    act(Rg, F, P, a, o) { const d = F._, T1 = o.W, T2 = T1 + o.J, T3 = T2 + o.D, T4 = T3 + o.B, hp = o.hop, out = { e: 0, y: 0, lunge: 0, reach: 0, e2: 0 }, inHop = ms => hp && ms >= hp[0] && ms < hp[0] + hp[1];
      const S = lag => { const t = a - lag; if (t < T1) return Object.assign(Z(), G.wind ? G.wind(K.cl(t / T1), o.dir) : { sq: 0.3 * K.eo(t / T1 / 0.5), lean: o.dir * 0.1 * K.eo(t / T1 / 0.5) });
        if (t < T2) return G.gait((t - T1) / o.J, o.dir, t, d);
        if (t < T3) { const ms = t - T2; if (inHop(ms)) { const g2 = G.gait((ms - hp[0]) / hp[1], hp[2], t, d); g2.e2 = g2.e; g2.e = 1; return g2; } const w = Object.assign(Z(), G.work(ms, o, d)); w.e = 1; w.e2 = hp && ms >= hp[0] ? 1 : 0; return w; }
        if (t < T4) { const g2 = G.gait((t - T3) / o.B, -o.dir, t, d); g2.e = 1 - g2.e; g2.e2 = hp ? 1 : 0; return g2; }
        return Object.assign(Z(), { sq: 0.4 * K.ring(t - T4, 130, 330) }); };
      const st = K.dress(P, d, S, []); out.e = st.e || 0; out.y = st.y || 0; out.e2 = st.e2 || 0; out.lunge = st.lunge || 0; out.reach = st.reach || 0;
      const ph = a < T1 ? 0 : a < T2 ? 1 : a < T3 ? 2 : a < T4 ? 3 : 4, ms = a - T2, hop = ph === 2 && inHop(ms), mv = ph === 1 || ph === 3 || hop;
      eyes(P, d, ph === 2 ? 0 : blinkAt(a / 500), ph === 3 ? -o.dir : ph === 2 ? o.sd : o.dir, 0.2, ph === 1 ? 0.4 : 0);
      if (G.pose) G.pose(Rg, F, P, a, o, { ph, ms, hop, u: ph === 1 ? (a - T1) / o.J : ph === 3 ? (a - T3) / o.B : hop ? (ms - hp[0]) / hp[1] : 0, st, d });
      if (G.life) G.life(Rg, F, P, a / 500, { amp: 1, sp: 0, s: Rg.stage, drift: ph === 1 ? o.dir : ph === 3 ? -o.dir : hop ? hp[2] : 0, ms: ph === 2 ? ms : -1, D: o.D });
      ground(P, ph === 0 ? 1 - K.sm(a / T1 * 3) : ph === 4 ? K.eo((a - T4) / 420) : 0); return out; },
    // the evolve: it goes to the open page by its own gait; there each part changes on its own beat (it draws in, the new stage's part springs out past its size and settles);
    // the body is pressed flat, comes up tall and thin past its new shape, and settles; then it goes home the way it came
    evo(Rg, F, P, a, o) { const d = F._, L = o.L, PRE = 420, OUT = G.out || 3, n = a / L - OUT, END = 5.2, FA = rigForm(Rg, o.from), FB = rigForm(Rg, o.to), out = { e: 0, y: 0, big: 0, n, done: n > END + OUT + 0.5, home: n >= END + OUT };
      const S = lag => { const t = a - lag, m = t / L - OUT; if (t < 0) return Object.assign(Z(), { sq: 0.3 * K.eo(1 + t / PRE) }); if (m < 0) return G.gait(t / (OUT * L), o.dir, t, d);
        if (m < END) { let sq = 0.35 * K.ring(m * L, 130, 330); for (let b = 1; b <= 4; b++) sq += 0.08 * K.pulse(m, b - 0.22, b - 0.02, 0.1) - 0.16 * K.ring((m - b) * L, 110, 280); return Object.assign(Z(), { e: 1, sq }); }
        if (m < END + OUT) { const g2 = G.gait((m - END) / OUT, -o.dir, t, d); g2.e = 1 - g2.e; return g2; } return Object.assign(Z(), { sq: 0.4 * K.ring((m - END - OUT) * L, 130, 330) }); };
      const st = K.dress(P, d, S, []), mv = n < 0 ? o.dir : n >= END && n < END + OUT ? -o.dir : 0; out.e = st.e || 0; out.y = st.y || 0; out.big = n < 0 ? K.sm(a / (OUT * L)) : n < END ? 1 : 1 - K.sm((n - END) / OUT);
      PARTS.forEach(nm => { const A = FA[nm], B = FB[nm]; if (!A && !B) return; const len = nm === 'body' ? 0.9 : 0.6, u = K.cl((n - BEAT[nm]) / len), q = K.part(P, nm), w = (u - 0.5) / 0.5; q.k = A && B ? K.sm(u) : !A ? K.sm(u * 2) : K.sm(u);
        if (u <= 0 || !B) return; if (u >= 1) { if (nm === 'body') { const ms = (n - BEAT[nm] - len) * L; K.squash(P, nm, 0.2 * Math.exp(-ms / 170) * Math.sin(ms / 300 * 6.2832)); } return; }
        if (!A) { K.sc(P, nm, K.back(u) / Math.max(0.02, q.k)); return; }
        if (nm === 'body') K.squash(P, nm, u < 0.5 ? 0.6 * K.sm(u / 0.5) : 0.6 * (1 - K.back(w)) - 0.4 * Math.sin(Math.PI * w) * (1 - 0.5 * w));
        else { K.sc(P, nm, u < 0.5 ? 1 - 0.85 * K.sm(u / 0.5) : 0.15 + 0.85 * K.back(w)); K.rt(P, nm, 0, 0, (nm.slice(-1) === 'L' ? 1 : -1) * 0.7 * Math.sin(Math.PI * u)); } });
      const pop = n > 0 && n < 4.6 ? Math.exp(-K.mod(n, 1) * 3) : 0; eyes(P, d, n > 4.6 && n < END ? 0.75 : mv ? blinkAt(a / 500) : 0, mv, n > 0 && n < 4.6 ? -0.6 : 0.2, 0.8 * pop);
      if (G.pose && mv) G.pose(Rg, F, P, a, o, { ph: mv === o.dir ? 1 : 3, ms: 0, hop: false, u: n < 0 ? a / (OUT * L) : (n - END) / OUT, st, d });
      if (G.life) G.life(Rg, F, P, a / 500, { amp: 1, sp: 0, s: n < BEAT.fog + 0.3 ? o.from : o.to, drift: mv, ms: -1 });
      ground(P, a < 0 ? 1 : n < 0 ? 1 - K.sm(a / L * 3) : n < END ? K.eo(n * 2) : n < END + OUT ? 1 - K.sm((n - END) * 4) : K.eo((n - END - OUT) * L / 420)); return out; } }; };
// WATER flows: it sinks into a puddle, runs along the page sloshing, and rears up where it stops. At the molecule it reaches out, wrings what it took into itself, then goes flat and washes over.
CLIP.homwater = autoClip({ out: 2.6, sway: 1.3,
  wind: (u, dir) => ({ sq: 0.5 * RK.sm(u), lean: dir * 0.06 * u }),
  gait(u, dir, ms, d) { const K = RK, fl = K.pulse(u, 0.02, 0.86, 0.1), up = K.pulse(u, 0.9, 1.3, 0.07); return { e: 0.45 * u + 0.55 * K.sm(u) + 0.03 * Math.sin(u * 12.566) * fl, y: 0, sq: 0.5 * (1 - up) + 0.12 * fl + 0.07 * Math.sin(ms / 85) * fl - 0.35 * up, lean: -dir * (0.1 + 0.1 * Math.sin(ms / 130)) * fl, dx: dir * 0.3 * d.R * Math.sin(ms / 130 + 1) * fl, vy: -0.5 * fl + up }; },
  work(ms, o, d) { const K = RK, p = ms / o.D, wr = K.pulse(p, 0.2, 0.48, 0.04), fl = K.pulse(p, 0.55, 0.9, 0.06); return { sq: -0.3 * K.ring(ms, 150, 380) + 0.14 * Math.sin(ms / 62) * wr + 0.58 * fl - 0.3 * K.pulse(p, 0.95, 1.2, 0.03), lean: -o.sd * (0.24 * K.pulse(p, 0.02, 0.2, 0.05) + 0.1 * wr), dx: 0.1 * d.R * Math.sin(ms / 62) * wr, lunge: 0.9 * fl, reach: K.pulse(p, 0.02, 0.2, 0.05) }; },
  pose(Rg, F, P, a, o, q) { const K = RK; if (q.ph === 2) { const p = q.ms / o.D, rc = K.pulse(p, 0.02, 0.22, 0.05), wr = K.pulse(p, 0.2, 0.48, 0.04), tw = Math.sin(q.ms / 62); ['L', 'R'].forEach((s, i) => { K.rt(P, 'arm' + s, -1.0 * rc + (i ? 0.8 : -0.8) * tw * wr, 0, -o.sd * 0.5 * rc); K.sc(P, 'arm' + s, 1 + 0.4 * rc); }); K.rt(P, 'hips', 0, 0.45 * tw * wr, 0); K.rt(P, 'point', 0, 0, 0.5 * tw * wr); }
    else if (q.ph === 1 || q.ph === 3) { /* arms and tip trail back in the flow */ const fl = K.pulse(q.u, 0.02, 0.86, 0.1), dr = q.ph === 1 ? o.dir : -o.dir; ['L', 'R'].forEach(s => K.rt(P, 'arm' + s, 0, 0, dr * 0.5 * fl)); K.rt(P, 'point', 0, 0, dr * 0.6 * fl); } },
  life(Rg, F, P, t, q) { const K = RK, b = Math.sin(t * 3.1), s = q.s; K.sc(P, 'body', 1 + 0.035 * b, 1 - 0.035 * b, 1 + 0.035 * b); K.rt(P, 'point', 0, 0, 0.16 * Math.sin(t * 2.2 + 1)); K.sc(P, 'point', 1, 1 + 0.08 * Math.sin(t * 4.4), 1); K.sc(P, 'base', 1 + 0.02 * Math.sin(t * 1.9), 1 - 0.03 * Math.sin(t * 1.9), 1); if (q.rest) { K.sc(P, 'ground', 1 + 0.05 * Math.sin(t * 1.3)); const w = (1 - q.sp) * q.amp;
      if (s === 2) ['L', 'R'].forEach((n, i) => K.rt(P, 'arm' + n, (i ? 1 : -1) * 0.22 * Math.sin(t * 3.1416) * w, 0, 0)); else if (s === 3) { K.rt(P, 'armR', 0, 0, 0.09 * Math.sin(t * 1.5708) * w); K.rt(P, 'armL', 0, 0, 0.05 * Math.sin(t * 1.5708 + 1) * w); } else if (s >= 4) ['L', 'R'].forEach((n, i) => { K.rt(P, 'arm' + n, 0, 0, (i ? -1 : 1) * 0.07 * Math.sin(t * 1.5708 + i) * w); K.sc(P, 'arm' + n, 1, 1 + 0.04 * Math.sin(t * 6.2 + i), 1); }); } } });
// DRY ICE glides: no step, a hand above the page on its own fog, leaning into the way it goes; the fog pours off the core all the time, spreads on the page and trails behind it.
CLIP.homco2 = autoClip({ out: 3.4, sway: 0.5,
  wind: (u, dir) => ({ sq: -0.12 * RK.sm(u), lean: dir * 0.12 * RK.sm(u) }),
  gait(u, dir, ms, d) { const K = RK, g = K.pulse(u, 0.03, 0.93, 0.12); return { e: K.sm(u), y: 0.05 * g + 0.02 * Math.sin(ms / 260) * g, sq: -0.06 * g + 0.02 * Math.sin(ms / 260), lean: dir * 0.2 * Math.sin(Math.PI * K.cl(u)) * (u < 0.5 ? 1 : 0.6) - dir * 0.14 * K.pulse(u, 0.82, 1.1, 0.08), dx: 0, vy: 0 }; },
  work(ms, o, d) { const K = RK, p = ms / o.D, h0 = o.hop ? o.hop[0] / o.D : 0.5, h1 = o.hop ? (o.hop[0] + o.hop[1]) / o.D : 0.7, set = K.pulse(p, 0.03, h0 - 0.03, 0.06), inh = K.pulse(p, h1 + 0.02, h1 + 0.1, 0.03), exh = K.pulse(p, h1 + 0.12, 0.99, 0.04); return { sq: 0.26 * set + 0.02 * Math.sin(ms / 240) - 0.2 * inh + 0.16 * exh, lean: -o.sd * (0.1 * exh - 0.08 * inh), lunge: 0.5 * exh, reach: exh }; },
  life(Rg, F, P, t, q) { const K = RK, fs = Rg.fogs && Rg.fogs[q.s], R = F._.R; let sp = 0; if (q.ms >= 0 && q.D) sp = K.pulse(q.ms / q.D, 0.03, 0.42, 0.06); K.mv(P, 'body', 0, 0.04 * R * Math.sin(t * 1.3), 0); K.rt(P, 'point', 0, 0, 0.05 * Math.sin(t * 1.7)); if (!fs) return;
    fs.forEach(o => { const f = o.userData.fog, per = f.low ? 4.5 : 6.5, u = K.mod(t / per + f.n * 0.381, 1), env = Math.pow(Math.sin(Math.PI * u), 0.6), dx = f.x >= 0 ? 1 : -1;
      if (f.low) { o.position.x = f.x * (0.4 + 1.0 * u) * (1 + 0.7 * sp) - q.drift * R * (0.5 + 2.2 * u); o.position.y = f.y + 0.04 * f.h * Math.sin(u * 6.2832 + f.n); o.scale.set(f.w * (0.55 + 0.8 * u) * (1 + 0.5 * sp), f.h * (0.8 + 0.35 * u), 1); }
      else { o.position.x = f.x + 0.3 * f.w * (u - 0.4) * dx - q.drift * R * 1.2 * u; o.position.y = f.y + f.h * (0.3 - 0.75 * u); o.scale.set(f.w * (0.75 + 0.45 * u), f.h * (0.75 + 0.45 * u), 1); }
      o.material.opacity = f.o * (0.2 + 0.8 * env); if (!f.low) o.material.rotation = (f.n % 2 ? 1 : -1) * (0.06 + 0.1 * Math.sin(u * 6.2832)); }); } });
// SALT walks stiff-legged: one leg, a stop, the other leg, a stop; it rocks from side to side like a thing that cannot bend. It packs with its hands, one pat a facet.
CLIP.homsalt = autoClip({ out: 3.6, sway: 0.35,
  wind: (u, dir) => ({ sq: -0.08 * RK.sm(u), lean: 0 }),
  gait(u, dir, ms, d) { const K = RK, N = 8, x = K.cl(u) * N, i = Math.min(N - 1, Math.floor(x)), v = x - i, m = K.cl(v / 0.6), sd = i % 2 ? 1 : -1, hit = v > 0.6 ? (v - 0.6) : 9; return { e: (i + K.sm(m)) / N, y: 0.07 * Math.sin(Math.PI * m), sq: -0.05 + 0.13 * Math.exp(-hit * 14) * Math.cos(hit * 40), lean: sd * 0.2 * Math.sin(Math.PI * m) + sd * 0.05 * Math.exp(-hit * 10) * Math.cos(hit * 46), dx: 0, vy: 0, step: i, m }; },
  work(ms, o, d) { const K = RK; let pat = 0, sq = 0; (o.bites || []).forEach(b => { const x = ms - b * o.D; if (x < -140 || x > 260) return; pat = Math.max(pat, K.pulse(x, -110, 30, 35)); sq += 0.16 * K.ring(x, 70, 150) * (x >= 0 ? 1 : 0); }); return { sq: sq - 0.05 * pat, lean: -o.sd * 0.2 * pat, lunge: 0.5 * pat, reach: pat }; },
  pose(Rg, F, P, a, o, q) { const K = RK; if (q.ph === 2 && !q.hop) { (o.bites || []).forEach((b, i) => { const x = q.ms - b * o.D; if (x < -140 || x > 200) return; const up = K.pulse(x, -130, -40, 30), dn = K.sm((x + 40) / 50) * (1 - K.sm((x - 60) / 120)); K.rt(P, 'arm' + (i % 2 ? 'L' : 'R'), 1.3 * up - 1.5 * dn, 0, -o.sd * 0.4 * dn); }); }
    else if (q.ph === 1 || q.ph === 3 || q.hop) { const s = q.st.step || 0, m = q.st.m || 0, sw = Math.sin(Math.PI * m) * 0.55; K.rt(P, 'leg' + (s % 2 ? 'R' : 'L'), -sw, 0, 0); K.rt(P, 'leg' + (s % 2 ? 'L' : 'R'), sw * 0.5, 0, 0); K.rt(P, 'arm' + (s % 2 ? 'L' : 'R'), -sw * 0.5, 0, 0); } },
  life(Rg, F, P, t, q) { const K = RK, tk = Math.floor(t / 2), u = K.mod(t, 2), snap = K.eo(u / 0.12), an = [0, 0.14, 0, -0.14][tk % 4], a0 = [0, 0.14, 0, -0.14][(tk + 3) % 4]; if (q.rest) { /* it turns its head in clicks, never smoothly */ K.rt(P, 'point', 0, 0, (a0 + (an - a0) * snap) * (1 - q.sp)); K.rt(P, 'body', 0, (a0 + (an - a0) * snap) * 1.2 * (1 - q.sp), 0); ['L', 'R'].forEach((n, i) => K.rt(P, 'arm' + n, 0, 0, (i ? -1 : 1) * 0.1 * (tk % 2 === i ? snap : 1 - snap))); }
    K.sc(P, 'point', 1 + 0.03 * K.ring(u * 500, 90, 110)); } });
Object.assign(AA.rxKit, { rigOn: true, rigSet, rigPlay, rigForm, RK, CLIP, autoClip, RIGGED: ['acid', 'water', 'co2', 'salt'] });
// (builder 26) the water spirit is built by the block at the end of this file (AA.rxKit.spiritBuild); AA.rxKit.spiritOn = false gives the old Water back
build = (f0 => function (id, T, grp, tint, extra) { const h = AA.rxKit.spiritBuild; if (id === 'homwater' && h && h(T, grp, extra)) return true; return f0(id, T, grp, tint, extra); })(build); AA.rxKit.build = build;
})(typeof globalThis !== 'undefined' ? globalThis : window);
// ---- Builder 24: WATER AS AN ELEMENTAL, three ways, five stages each. Options only: the game's Water is not touched.
// AA.rxKit.water24 = 'a' pure water | 'b' water spirit | 'c' water beast; AA.rxKit.water24Fig(THREE, stage, way) gives a figure standing at y = 0, its front to +z.
// Every figure's body is ONE closed mesh: rings swept along a spine (keys [x, y, z, a, b]: a point of the spine, the half width along the side and along the depth),
// arms, ears, legs and manes are swellings of that same surface (bumps), the pool it stands in is the first rings of the same surface. Depth, foam and the
// highlight are vertex colours of that one mesh. Only the eyes, the mouth, the thin sheen on the bench and a few loose drops are pieces of their own.
(function (root) {
'use strict';
const AA = root.AA = root.AA || {}, KIT = AA.rxKit = AA.rxKit || {}, PI = Math.PI;
let ramp24 = null;
const COL = { deep: 0x234a9c, mid: 0x3a6fd0, lite: 0x79aeee, wet: 0x6fa6ea, foam: 0xf2f6f8, hi: 0xeaf4fb, ink: 0x2b2622 };
const cr = (p0, p1, p2, p3, t) => 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
// the pool a figure rises from: a thin flat ring of water that fillets up into the foot
const pool = (x, z, R, Rb, rf, rfb) => [[x, 0, z, R, Rb], [x, 0.04, z, R * 0.985, Rb * 0.985], [x, 0.06, z, R * 0.9, Rb * 0.9], [x, 0.075, z, rf * 1.4, rfb * 1.4], [x, 0.17, z, rf * 1.1, rfb * 1.1], [x, 0.32, z, rf, rfb]];
function sweep(T, o) {
  const K = o.keys, nk = K.length, per = o.per || 10, NS = o.ns || 44, rows = [], kps = [], V3 = T.Vector3;
  for (let i = 0; i < nk - 1; i++) for (let j = 0; j < per; j++) { const t = j / per, g = c => cr(K[Math.max(0, i - 1)][c], K[i][c], K[i + 1][c], K[Math.min(nk - 1, i + 2)][c], t), cl = c => Math.max(Math.min(K[i][c], K[i + 1][c]), Math.min(Math.max(K[i][c], K[i + 1][c]), g(c))); rows.push([g(0), g(1), g(2), cl(3), cl(4)]); kps.push(i + t); }
  rows.push(K[nk - 1].slice()); kps.push(nk - 1);
  if (rows[0][3] > 0) { const f = rows[0].slice(); f[3] = f[4] = 0; rows.unshift(f); kps.unshift(0); }
  if (rows[rows.length - 1][3] > 0) { const f = rows[rows.length - 1].slice(); f[3] = f[4] = 0; rows.push(f); kps.push(nk - 1); }
  const n = rows.length, pos = new Float32Array(n * NS * 3), meta = []; let N = new V3().fromArray(o.ref || [1, 0, 0]), Tp = null;
  for (let i = 0; i < n; i++) { const a = rows[Math.max(0, i - 1)], b = rows[Math.min(n - 1, i + 1)], r = rows[i], kp = kps[i]; let t = new V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (t.length() < 1e-5 || (Tp && t.clone().normalize().dot(Tp) < 0.15)) t = Tp ? Tp.clone() : new V3(0, 1, 0); t.normalize(); N = N.clone().sub(t.clone().multiplyScalar(N.dot(t))).normalize(); const B = new V3().crossVectors(N, t); Tp = t;
    for (let j = 0; j < NS; j++) { const th = j / NS * 2 * PI; let m = o.mod ? o.mod(kp, th) : 1, ox = 0, oy = 0, oz = 0;
      (o.bumps || []).forEach(q => { const d = Math.atan2(Math.sin(th - q.th), Math.cos(th - q.th)), w = Math.tanh(2.6 * Math.exp(-Math.pow((kp - q.k) / (q.sk || 0.5), 2) - Math.pow(d / (q.sth || 0.4), 2))); m += q.amp * w; if (q.off) { ox += q.off[0] * w; oy += q.off[1] * w; oz += q.off[2] * w; } });
      const ca = Math.cos(th) * r[3] * m, sb = Math.sin(th) * r[4] * m, k = (i * NS + j) * 3, live = r[3] > 0 ? 1 : 0;
      pos[k] = r[0] + N.x * ca + B.x * sb + ox * live; pos[k + 1] = Math.max(0, r[1] + N.y * ca + B.y * sb + oy * live); pos[k + 2] = r[2] + N.z * ca + B.z * sb + oz * live; meta.push([kp, th, Math.min(r[3], r[4])]); } }
  const idx = []; for (let i = 0; i < n - 1; i++) for (let j = 0; j < NS; j++) { const a = i * NS + j, b = (i + 1) * NS + j, c = (i + 1) * NS + (j + 1) % NS, d = i * NS + (j + 1) % NS; idx.push(a, b, d, b, c, d); }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  // colour: the depth of the water, the foam, the highlight. The lamp side is taken in the figure's own space (yaw turned in).
  const nor = geo.attributes.normal, col = new Float32Array(n * NS * 3), C = {}; Object.keys(COL).forEach(k => { C[k] = new T.Color(COL[k]).convertSRGBToLinear(); });
  const yaw = o.yaw || 0, cy = Math.cos(yaw), sy = Math.sin(yaw), h1 = new V3(-0.5, 0.62, 0.6).normalize(), h2 = new V3(0.5, 0.62, -0.6).normalize(), foot = o.foot || 0.3, thin = o.thin || 0.25, sk = o.sk == null ? 5 : o.sk;
  for (let v = 0; v < n * NS; v++) { const kp = meta[v][0], th = meta[v][1], rr = meta[v][2], y = pos[v * 3 + 1], nx = nor.getX(v), ny = nor.getY(v), nz = nor.getZ(v), wx = nx * cy + nz * sy, wz = -nx * sy + nz * cy, wob = 0.05 * Math.sin(th * 3 + 1) + 0.03 * Math.sin(th * 7);
    let c = C.mid; const skirt = kp < sk - 1.6 || (kp < sk && y < 0.1);
    if (skirt) c = C.wet; else if (y < foot * (1 + wob * 4)) c = C.deep; else if (rr < thin || (o.lite && o.lite(kp, th, y))) c = C.lite;
    if (!skirt && y > foot && (wx * h1.x + ny * h1.y + wz * h1.z > 0.93 || wx * h2.x + ny * h2.y + wz * h2.z > 0.95)) c = C.hi;
    if (o.foam && o.foam(kp, th, y)) c = C.foam;
    col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b; }
  geo.setAttribute('color', new T.BufferAttribute(col, 3)); return geo;
}
function inkHull(T, geo, t) { const g = geo.clone(), p = g.attributes.position, nn = g.attributes.normal; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + nn.getX(i) * t, Math.max(0, p.getY(i) + nn.getY(i) * t), p.getZ(i) + nn.getZ(i) * t); const m = new T.Mesh(g, new T.MeshBasicMaterial({ color: new T.Color(COL.ink).convertSRGBToLinear(), side: T.BackSide })); m.userData.plain = true; return m; }
// the face: two eyes and a smile, laid on the body where rays from in front meet it. The same face at every stage.
function face24(T, grp, body, f) { const V3 = T.Vector3, D = new V3().fromArray(f.d || [0, 0, 1]).normalize(), R = new V3().crossVectors(new V3(0, 1, 0), D).normalize(), U = new V3().crossVectors(D, R), c = new V3().fromArray(f.c), k = f.k || 1, rc = new T.Raycaster(), black = new T.MeshBasicMaterial({ color: new T.Color(0x1d1a18).convertSRGBToLinear() }), white = new T.MeshBasicMaterial({ color: 0xffffff });
  const hit = (px, py) => { const o = c.clone().addScaledVector(R, px).addScaledVector(U, py).addScaledVector(D, 6); rc.set(o, D.clone().negate()); const h = rc.intersectObject(body)[0]; return h ? { p: h.point, n: h.face.normal.clone() } : null; };
  [-1, 1].forEach(s => { const h = hit(s * 0.2 * k, 0); if (!h) return; const e = new T.Mesh(new T.SphereGeometry(0.085 * k, 14, 10), black); e.scale.set(1, 1.25, 0.35); e.position.copy(h.p).addScaledVector(h.n, 0.01); e.lookAt(h.p.clone().add(h.n)); grp.add(e); const gl = new T.Mesh(new T.SphereGeometry(0.03 * k, 8, 6), white); gl.position.copy(h.p).addScaledVector(h.n, 0.035 * k).addScaledVector(U, 0.04 * k).addScaledVector(R, -0.025 * k); grp.add(gl); });
  const pts = [], my = f.my == null ? 1 : f.my; for (let i = -3; i <= 3; i++) { const s = i / 3, h = hit(s * 0.15 * k, (-0.2 * my - 0.075 * (1 - s * s)) * k); if (h) pts.push(h.p.clone().addScaledVector(h.n, 0.012)); }
  if (pts.length > 2) grp.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 14, 0.024 * k, 5), black)); }
const near = (th, a, w) => { const d = Math.atan2(Math.sin(th - a), Math.cos(th - a)); return Math.exp(-(d / w) * (d / w)); };
// drips down a back: pale runs on the far side of an upright body
const drips = (k0, k1, back) => (kp, th) => kp > k0 && kp < k1 && [-0.55, 0.05, 0.6].some((a, i) => near(th, (back == null ? -PI / 2 : back) + a, 0.07) > 0.5 && kp > k0 + i * 0.5 && kp < k1 - (2 - i) * 0.4);
const scal = (k0, f, g) => (kp, th) => kp > k0 ? 1 + 0.2 * Math.sin(f * th) * Math.sin((kp - k0) * g) : 1;
const W24 = {
  a: [
    () => ({ keys: pool(0, 0, 0.56, 0.46, 0.36, 0.34).concat([[0, 0.44, 0, 0.43, 0.41], [0, 0.72, 0, 0.3, 0.29], [0, 0.96, 0, 0.13, 0.13], [0, 1.13, 0, 0.04, 0.04], [0, 1.2, 0, 0, 0]]), thin: 0.2, foot: 0.2, face: { c: [0, 0.46, 0], k: 0.72 }, sheen: [0, 0, 0.75], drops: [[0.62, 0.18, 0.05]] }),
    () => ({ keys: [[0, 0, 0, 1.3, 1.02], [0, 0.04, 0, 1.28, 1.0], [0, 0.2, 0, 1.14, 0.89], [0, 0.03, 0, 0.99, 0.78], [0, 0.04, 0, 0.93, 0.74], [0, 0.17, 0, 0.84, 0.72], [0, 0.52, 0, 0.9, 0.8], [0, 0.92, 0, 0.76, 0.7], [0, 1.17, 0, 0.46, 0.43], [0, 1.29, 0, 0.16, 0.16], [0, 1.32, 0, 0, 0]], sk: 5, thin: 0.3, foot: 0.3, lite: (kp, th, y) => y > 1.05 || (kp > 1.4 && kp < 2.5 && y > 0.1), face: { c: [0, 0.66, 0], k: 1.05 }, sheen: [0, 0, 1.6], drops: [[-1.45, 0.3, 0.07], [1.3, -0.55, 0.05]] }),
    () => ({ keys: pool(-0.1, 0, 1.6, 1.08, 1.05, 0.8).concat([[-0.1, 0.65, 0, 1.0, 0.78], [0, 1.3, 0, 0.82, 0.7], [0.2, 1.95, 0, 0.6, 0.62], [0.55, 2.45, 0, 0.42, 0.56], [1.0, 2.64, 0, 0.27, 0.47], [1.34, 2.44, 0, 0.14, 0.3], [1.44, 2.2, 0, 0, 0]]), thin: 0.3, foot: 0.4, mod: scal(10.4, 5, 5), foam: kp => kp > 10.5, lite: (kp, th, y) => (kp > 8.2 && near(th, 0, 0.9) > 0.5) || drips(6.5, 10)(kp, th), face: { c: [-0.05, 1.08, 0], k: 1.15 }, sheen: [-0.1, 0, 1.9], drops: [[1.5, 0.5, 0.07], [1.75, 0.1, 0.05], [-1.7, -0.5, 0.06]] }),
    () => ({ keys: pool(0, 0, 1.8, 1.32, 0.75, 0.7).concat([[0, 0.55, 0, 0.6, 0.58], [0.18, 1.2, 0.1, 0.44, 0.44], [-0.16, 2.0, -0.1, 0.48, 0.48], [0.16, 2.8, 0.1, 0.56, 0.56], [-0.12, 3.6, -0.08, 0.72, 0.72], [0.05, 4.3, 0, 1.0, 1.0], [0, 4.75, 0, 0.92, 0.92], [0, 5.05, 0, 0.55, 0.55], [0, 5.15, 0, 0, 0]]), thin: 0.2, foot: 0.4, mod: (kp, th) => kp > 5 ? 1 + 0.13 * Math.min(1, (kp - 5) / 1.5) * Math.sin(2 * th - kp * 1.7) + (kp > 11.3 ? 0.05 * Math.sin(6 * th) * Math.min(1, kp - 11.3) : 0) : 1, lite: (kp, th) => kp > 5.5 && Math.sin(2 * th - kp * 1.7 + 0.9) > 0.55, foam: (kp, th) => kp > 11.9 + 0.5 * Math.sin(6 * th), face: { c: [0, 2.3, 0], k: 1.0 }, sheen: [0, 0, 2.1], drops: [[1.2, 3.9, 0.08, 1], [-1.3, 3.3, 0.06, 1], [1.5, 2.8, 0.05, 1], [-2.0, 0.4, 0.07]] }),
    () => ({ keys: pool(-0.75, 0, 2.7, 1.75, 1.95, 1.35).concat([[-0.8, 0.9, 0, 1.75, 1.3], [-0.95, 2.0, 0, 1.45, 1.25], [-0.85, 3.4, 0, 1.15, 1.2], [-0.3, 4.7, 0, 0.88, 1.12], [0.7, 5.65, 0, 0.62, 1.02], [1.8, 5.85, 0, 0.46, 0.9], [2.6, 5.3, 0, 0.33, 0.75], [2.85, 4.5, 0, 0.2, 0.55], [2.7, 3.95, 0, 0, 0]]), thin: 0.3, foot: 0.7, mod: scal(11.3, 5, 6), foam: kp => kp > 11.6, lite: (kp, th, y) => (kp > 8 && near(th, 0, 1.0) > 0.45) || drips(6.5, 10.5)(kp, th), face: { c: [-0.85, 2.4, 0], k: 1.55 }, sheen: [-0.75, 0, 3.05], drops: [[2.9, 3.4, 0.09, 1], [2.5, 2.9, 0.06, 1], [3.1, 2.5, 0.05, 1], [3.0, 0.5, 0.08]] })
  ],
  b: [
    () => ({ keys: pool(0, 0, 0.56, 0.46, 0.36, 0.34).concat([[0, 0.44, 0, 0.44, 0.41], [0, 0.74, 0, 0.34, 0.33], [0.02, 0.97, 0, 0.2, 0.2], [0.1, 1.14, 0, 0.1, 0.1], [0.24, 1.19, 0, 0.045, 0.045], [0.31, 1.13, 0, 0, 0]]), thin: 0.22, foot: 0.2, face: { c: [0, 0.48, 0], k: 0.74 }, sheen: [0, 0, 0.75], drops: [[-0.6, 0.2, 0.05]] }),
    () => ({ keys: pool(0, 0, 1.28, 0.98, 0.85, 0.5).concat([[0, 0.52, 0, 0.82, 0.48], [0, 0.82, 0, 0.6, 0.42], [0, 1.02, 0, 0.34, 0.3], [0, 1.38, 0, 0.52, 0.48], [0, 1.72, 0, 0.42, 0.4], [0.03, 1.97, 0, 0.2, 0.2], [0.14, 2.12, 0, 0.08, 0.08], [0.27, 2.08, 0, 0, 0]]), thin: 0.25, foot: 0.3, lite: drips(6, 8), face: { c: [0, 1.4, 0], k: 0.95 }, sheen: [0, 0, 1.55], drops: [[1.4, 0.4, 0.06], [-1.35, -0.4, 0.05]] }),
    () => ({ keys: pool(0, 0, 1.6, 1.12, 0.62, 0.48).concat([[0, 0.62, 0, 0.55, 0.42], [0, 1.3, 0, 0.7, 0.48], [0, 1.82, 0, 0.8, 0.5], [0, 2.12, 0, 0.34, 0.3], [0, 2.56, 0, 0.56, 0.52], [0, 2.96, 0, 0.44, 0.42], [0.04, 3.2, 0, 0.2, 0.2], [0.18, 3.36, 0, 0.08, 0.08], [0.32, 3.31, 0, 0, 0]]), thin: 0.25, foot: 0.4, bumps: [{ k: 8, th: 0, amp: 0.35, sk: 0.5, sth: 0.55, off: [0.5, 0.4, 0.15] }, { k: 8, th: PI, amp: 0.35, sk: 0.5, sth: 0.55, off: [-0.45, -0.45, 0.15] }], lite: drips(6, 8.5), face: { c: [0, 2.6, 0], k: 1.05 }, sheen: [0, 0, 1.9], drops: [[1.75, 0.3, 0.07], [-1.3, 0.9, 0.05, 1]] }),
    () => ({ keys: pool(0, 0, 1.85, 1.32, 0.62, 0.5).concat([[0, 0.72, 0, 0.5, 0.42], [0.05, 1.5, 0, 0.5, 0.42], [0, 2.3, 0, 0.62, 0.46], [-0.05, 2.9, 0, 0.72, 0.5], [0, 3.25, 0, 0.34, 0.3], [0, 3.75, 0, 0.58, 0.54], [-0.02, 4.25, -0.1, 0.5, 0.48], [0.2, 4.72, -0.5, 0.4, 0.36], [0.75, 4.55, -0.9, 0.34, 0.28], [1.15, 3.8, -1.0, 0.28, 0.22], [1.2, 3.0, -0.92, 0.2, 0.15], [1.45, 2.45, -0.8, 0.1, 0.08], [1.6, 2.2, -0.75, 0, 0]]), thin: 0.21, foot: 0.4, bumps: [{ k: 9, th: 0, amp: 0.3, sk: 0.5, sth: 0.55, off: [0.4, -0.6, 0.12] }, { k: 9, th: PI, amp: 0.3, sk: 0.5, sth: 0.55, off: [-0.4, -0.6, 0.12] }], mod: (kp, th) => kp > 12.5 ? 1 + 0.16 * Math.sin(kp * 5) * Math.sin(3 * th) : 1, lite: (kp, th) => kp > 12.3 || drips(6, 9)(kp, th), foam: kp => kp > 17.2, face: { c: [0, 3.8, 0], k: 1.1 }, sheen: [0, 0, 2.15], drops: [[1.7, 1.9, 0.06, 1], [1.5, 1.5, 0.05, 1], [-2.0, 0.3, 0.07]] }),
    () => ({ keys: pool(0, 0, 2.95, 1.95, 1.1, 0.8).concat([[0, 0.95, 0, 0.85, 0.65], [0, 2.0, 0, 0.9, 0.68], [0, 3.1, 0, 1.15, 0.75], [0, 3.8, 0, 1.3, 0.78], [0, 4.2, 0, 0.5, 0.44], [-0.05, 4.8, 0, 0.78, 0.72], [-0.25, 5.45, 0, 0.66, 0.66], [0.2, 6.0, 0, 0.5, 0.62], [1.0, 6.15, 0, 0.36, 0.55], [1.55, 5.75, 0, 0.24, 0.42], [1.7, 5.25, 0, 0.1, 0.2], [1.62, 5.0, 0, 0, 0]]), thin: 0.3, foot: 0.7, bumps: [{ k: 9, th: 0, amp: 0.3, sk: 0.55, sth: 0.55, off: [0.75, -0.85, 0.25] }, { k: 9, th: PI, amp: 0.3, sk: 0.55, sth: 0.55, off: [-0.75, -0.85, 0.25] }], mod: scal(13.6, 5, 5), foam: kp => kp > 13.9, lite: (kp, th) => (kp > 12.4 && near(th, 0, 0.9) > 0.5) || drips(6, 9)(kp, th), face: { c: [-0.05, 4.82, 0], k: 1.4 }, sheen: [0, 0, 3.3], drops: [[1.9, 4.5, 0.08, 1], [2.1, 4.0, 0.06, 1], [3.0, 0.6, 0.08], [-3.05, -0.3, 0.06]] })
  ],
  c: [
    () => ({ keys: [[-1.25, 0.1, 0.22, 0, 0], [-1.0, 0.13, 0.05, 0.11, 0.04], [-0.65, 0.17, -0.13, 0.18, 0.07], [-0.3, 0.25, 0.06, 0.25, 0.17], [0, 0.37, 0, 0.39, 0.37], [0.3, 0.42, 0, 0.44, 0.44], [0.58, 0.42, 0, 0.34, 0.34], [0.71, 0.42, 0, 0.15, 0.15], [0.74, 0.42, 0, 0, 0]], ref: [0, 1, 0], sk: 0, yaw: -1.0, thin: 0.12, foot: 0.1, face: { c: [0.5, 0.45, 0], d: [1, 0.15, 0], k: 0.74 }, sheen: [-0.1, 0, 0.95], drops: [[-1.0, 0.5, 0.05]] }),
    () => ({ keys: [[-1.95, 0.08, 0.32, 0, 0], [-1.55, 0.13, 0.05, 0.13, 0.04], [-1.1, 0.19, -0.2, 0.21, 0.08], [-0.6, 0.25, 0.05, 0.27, 0.2], [-0.1, 0.31, 0.15, 0.33, 0.35], [0.4, 0.35, -0.05, 0.31, 0.33], [0.85, 0.52, -0.1, 0.25, 0.25], [1.15, 0.7, 0, 0.31, 0.33], [1.4, 0.72, 0, 0.25, 0.27], [1.56, 0.7, 0, 0.1, 0.12], [1.6, 0.69, 0, 0, 0]], ref: [0, 1, 0], sk: 0, yaw: -1.0, thin: 0.15, foot: 0.12, bumps: [{ k: 5.1, th: 2.1, amp: 0.8, sk: 0.3, sth: 0.3, off: [0.15, -0.12, -0.3] }, { k: 5.1, th: -2.1, amp: 0.8, sk: 0.3, sth: 0.3, off: [0.15, -0.12, 0.3] }, { k: 3.6, th: 2.1, amp: 0.8, sk: 0.3, sth: 0.3, off: [-0.12, -0.1, -0.28] }, { k: 3.6, th: -2.1, amp: 0.8, sk: 0.3, sth: 0.3, off: [-0.12, -0.1, 0.28] }], lite: (kp, th) => kp < 6 && near(th, 0, 0.3) > 0.5, face: { c: [1.42, 0.75, 0], d: [1, 0.3, 0], k: 0.66 }, sheen: [-0.1, 0, 1.6], drops: [[-1.7, 0.7, 0.05], [0.4, 1.2, 0.05]] }),
    () => ({ keys: pool(0, 0, 1.65, 1.18, 0.8, 0.7).concat([[0, 0.62, 0, 0.74, 0.66], [0, 1.3, 0.1, 0.66, 0.6], [0, 1.9, 0.22, 0.5, 0.46], [0, 2.36, 0.32, 0.57, 0.53], [0, 2.7, 0.34, 0.44, 0.42], [0, 2.9, 0.34, 0.2, 0.2], [0, 2.95, 0.34, 0, 0]]), thin: 0.21, foot: 0.4, bumps: [{ k: 10.25, th: 0.35, amp: 0.3, sk: 0.2, sth: 0.22, off: [0.1, 0.16, 0] }, { k: 10.25, th: PI - 0.35, amp: 0.3, sk: 0.2, sth: 0.22, off: [-0.1, 0.16, 0] }, { k: 7.3, th: PI / 2 - 0.75, amp: 0.5, sk: 0.4, sth: 0.3, off: [0, -0.1, 0.3] }, { k: 7.3, th: PI / 2 + 0.75, amp: 0.5, sk: 0.4, sth: 0.3, off: [0, -0.1, 0.3] }, { k: 8.75, th: PI / 2, amp: 0.3, sk: 0.3, sth: 0.55, off: [0, 0, 0.1] }], lite: (kp, th) => (kp > 6 && kp < 8.3 && near(th, PI / 2, 0.5) > 0.5) || drips(6.5, 9)(kp, th), face: { c: [0, 2.46, 0.3], k: 1.0 }, sheen: [0, 0, 1.95], drops: [[1.8, 0.3, 0.07], [-1.75, -0.5, 0.05]] }),
    () => ({ keys: pool(-0.4, 0, 1.8, 1.28, 1.0, 0.75).concat([[-0.4, 0.72, 0, 0.95, 0.72], [-0.5, 1.6, 0, 0.72, 0.58], [-0.4, 2.5, 0, 0.44, 0.38], [-0.1, 3.35, 0, 0.36, 0.33], [0.4, 3.95, 0, 0.4, 0.36], [0.95, 3.95, 0, 0.36, 0.34], [1.4, 3.6, 0, 0.28, 0.28], [1.62, 3.3, 0, 0.22, 0.24], [1.72, 3.12, 0, 0, 0]]), ref: [-1, 0, 0], yaw: -0.95, thin: 0.3, foot: 0.45, bumps: [{ k: 10.15, th: 0.6, amp: 0.4, sk: 0.13, sth: 0.2, off: [-0.05, 0.22, -0.1] }, { k: 10.15, th: -0.6, amp: 0.4, sk: 0.13, sth: 0.2, off: [-0.05, 0.22, 0.1] }, { k: 6.6, th: PI, amp: 0.25, sk: 0.6, sth: 0.7 }], mod: (kp, th) => kp > 7.2 && kp < 9.9 ? 1 + 1.0 * near(th, 0, 0.3) * (0.65 + 0.35 * Math.sin(kp * 8)) * Math.min(1, (kp - 7.2) * 2, (9.9 - kp) * 3) : 1, foam: (kp, th) => kp > 7.4 && kp < 9.8 && near(th, 0, 0.3) > 0.45, lite: (kp, th) => kp > 11.6 || (kp > 6 && kp < 9 && near(th, PI, 0.5) > 0.5), face: { c: [1.0, 3.95, 0], d: [0.8, 0.5, 0], k: 0.85, my: 2.3 }, sheen: [-0.4, 0, 2.1], drops: [[1.2, 2.6, 0.06, 1], [1.3, 2.1, 0.05, 1], [-2.1, 0.5, 0.07]] }),
    () => { const keys = []; for (let i = 0; i <= 12; i++) { const f = i / 12, ph = -2 * PI + f * 3 * PI, rho = 2.3 - f * 1.0, r = Math.min(0.56, i * 0.16); keys.push([rho * Math.cos(ph), 0.5 + f * 1.55, rho * Math.sin(ph), r, r]); }
      keys.push([-1.0, 2.75, -0.75, 0.55, 0.55], [-0.3, 3.6, -0.85, 0.5, 0.5], [0, 4.6, -0.45, 0.46, 0.46], [0, 5.3, 0.15, 0.52, 0.52], [0, 5.42, 0.72, 0.42, 0.44], [0, 5.28, 1.1, 0.2, 0.24], [0, 5.22, 1.2, 0, 0]);
      return { keys, ref: [0, 1, 0], sk: 0, ns: 36, per: 8, thin: 0.3, foot: 0.3, mod: (kp, th) => kp > 12.6 && kp < 16.6 ? 1 + (1.0 + 0.5 * Math.max(0, kp - 14.5)) * near(th, PI, 0.36) * (0.6 + 0.4 * Math.sin(kp * 7)) * Math.min(1, (kp - 12.6) * 2, (16.6 - kp) * 2.5) : 1, foam: (kp, th) => kp > 12.9 && kp < 16.4 && near(th, PI, 0.36) > 0.45, lite: (kp, th) => (near(th, kp > 12 ? 0 : PI, 0.6) > 0.5 && kp < 16) || kp < 2.5, face: { c: [0, 5.38, 0.3], d: [0, 0.2, 1], k: 1.1 }, sheen: [0, 0, 3.3], drops: [[0.9, 4.3, 0.07, 1], [1.2, 3.8, 0.05, 1], [3.1, 0.9, 0.07]] }; }
  ]
};
function water24Fig(T, stage, way) {
  if ((way || KIT.water24) === 'spirit') return water25Fig(T, stage);
  const w = W24[way || KIT.water24 || 'a'] || W24.a, o = w[Math.max(1, Math.min(5, stage | 0)) - 1](), g = new T.Group(), inner = new T.Group(); inner.rotation.y = o.yaw || 0; g.add(inner);
  if (!ramp24) { ramp24 = new T.DataTexture(new Uint8Array([150, 215, 255]), 3, 1, T.LuminanceFormat); ramp24.minFilter = ramp24.magFilter = T.NearestFilter; ramp24.needsUpdate = true; }
  const geo = sweep(T, o), body = new T.Mesh(geo, new T.MeshToonMaterial({ vertexColors: true, gradientMap: ramp24 })); body.userData.water24 = 'body'; inner.add(body); inner.add(inkHull(T, geo, 0.045));
  if (o.face) face24(T, inner, body, o.face);
  const lin = h => new T.Color(h).convertSRGBToLinear();
  if (o.sheen) { const s = o.sheen, cg = new T.CircleGeometry(s[2], 48), p = cg.attributes.position; for (let i = 1; i < p.count; i++) { const a = Math.atan2(p.getY(i), p.getX(i)), k = 1 + 0.07 * Math.sin(3 * a + 1) + 0.05 * Math.sin(5 * a + 2); p.setXY(i, p.getX(i) * k, p.getY(i) * k * 0.82); } const m = new T.Mesh(cg, new T.MeshBasicMaterial({ color: lin(0x5d3a1c), transparent: true, opacity: 0.55 })); m.rotation.x = -PI / 2; m.position.set(s[0], 0.006, s[1]); m.userData.plain = true; inner.add(m); }
  (o.drops || []).forEach(d => { const air = d[3], dg = new T.SphereGeometry(d[2], 12, 10), dm = new T.Mesh(dg, new T.MeshToonMaterial({ color: lin(COL.lite), gradientMap: ramp24 })); dm.scale.set(1, air ? 1.35 : 0.55, 1); if (air) dm.position.set(d[0], d[1], 0.1); else dm.position.set(d[0], d[2] * 0.3, d[1]); g.add(dm); const ik = new T.Mesh(dg, new T.MeshBasicMaterial({ color: lin(COL.ink), side: T.BackSide })); ik.position.copy(dm.position); ik.scale.copy(dm.scale).multiplyScalar(1 + 0.035 / d[2]); ik.userData.plain = true; g.add(ik); });
  g.userData.water24 = { way: way || KIT.water24 || 'a', stage };
  return g;
}
// ---- Builder 25: the WATER SPIRIT (the owner's pick, band b), redrawn so each of the five stages is its own character. AA.rxKit.water24 = 'spirit'.
// Still ONE closed mesh per body (sweep25: the same rings along a spine as sweep). New here:
//  LIMBS: a limb is a round patch of the body's own skin drawn out along a path (the rim of the patch stays where it is, its centre becomes the tip),
//   so an arm, a ribbon, a pouring stream is the same surface and can never come off. { k, th: where on the body, r0: patch radius, path: points from the
//   root, rad: radius at each point, w: how many rings each stretch gets, flat + fk: squash along an axis, foam(s), ey: patch taller than wide }.
//  COLOUR is not baked per vertex any more: the mesh carries smooth numbers (pool, ring of the pool, depth, foam, thin) and the toon material cuts them
//   per pixel; the gloss bands come from the normal. So no patch has a stepped edge. Lamp side as in sweep: front-left, and back-right for the back.
//  twist(kp) turns the rings about the spine; lift(kp, th) raises a ring in points; pk is the key where the pool ends. Marks (eyes, lids, brows, mouth, bubbles, the swirl) are laid on by rays.
const C25 = { deep: 0x1d3f8e, mdeep: 0x2c5cbc, mid: 0x3a6fd0, lite: 0x8dbdf4, pool: 0x5b93e0, hi: 0xf2f9fd, foam: 0xf3f6f7 };
const sm = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const adiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
function sweep25(T, o) {
  const K = o.keys, nk = K.length, per = o.per || 14, NS = o.ns || 128, V3 = T.Vector3, rows = [], kps = [], wc = o.warp == null ? 0.5 : o.warp, LB = o.limbs || [], pk = o.pk || 3.2;
  for (let i = 0; i < nk - 1; i++) { const pp = LB.some(l => Math.abs(l.k - i - 0.5) < 1.6) ? per * 3 : per; for (let j = 0; j < pp; j++) { const t = j / pp, g = c => cr(K[Math.max(0, i - 1)][c], K[i][c], K[i + 1][c], K[Math.min(nk - 1, i + 2)][c], t), cl = c => Math.max(Math.min(K[i][c], K[i + 1][c]), Math.min(Math.max(K[i][c], K[i + 1][c]), g(c))); rows.push([g(0), g(1), g(2), cl(3), cl(4)]); kps.push(i + t); } }
  rows.push(K[nk - 1].slice()); kps.push(nk - 1);
  if (rows[0][3] > 0) { const f = rows[0].slice(); f[3] = f[4] = 0; rows.unshift(f); kps.unshift(0); }
  if (rows[rows.length - 1][3] > 0) { const f = rows[rows.length - 1].slice(); f[3] = f[4] = 0; rows.push(f); kps.push(nk - 1); }
  const n = rows.length, NV = n * NS, pos = new Float32Array(NV * 3), ths = [], tans = [], lim = new Array(NV);
  for (let j = 0; j < NS; j++) { const u = j / NS; ths.push(2 * PI * u - wc / 2 * Math.sin(4 * PI * u)); }   // more columns at the two sides, where the arms are drawn out
  let N = new V3().fromArray(o.ref || [1, 0, 0]), Tp = null;
  for (let i = 0; i < n; i++) { const a = rows[Math.max(0, i - 1)], b = rows[Math.min(n - 1, i + 1)], r = rows[i], kp = kps[i]; let t = new V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (kp < pk + 1.2) t.set(0, 1, 0); else if (t.length() < 1e-5 || (Tp && t.clone().normalize().dot(Tp) < 0.15)) t = Tp ? Tp.clone() : new V3(0, 1, 0);
    t.normalize(); N = N.clone().sub(t.clone().multiplyScalar(N.dot(t))).normalize(); const B = new V3().crossVectors(N, t); Tp = t; tans.push(t);
    const tw = o.twist ? o.twist(kp) : 0, ct = Math.cos(tw), st = Math.sin(tw);
    for (let j = 0; j < NS; j++) { const th = ths[j]; let m = o.mod ? o.mod(kp, th) : 1, ox = 0, oy = 0, oz = 0;
      (o.bumps || []).forEach(q => { const d = adiff(th, q.th), w = Math.tanh(2.6 * Math.exp(-Math.pow((kp - q.k) / (q.sk || 0.5), 2) - Math.pow(d / (q.sth || 0.4), 2))); m += q.amp * w; if (q.off) { ox += q.off[0] * w; oy += q.off[1] * w; oz += q.off[2] * w; } });
      const c0 = Math.cos(th) * r[3] * m, s0 = Math.sin(th) * r[4] * m, ca = c0 * ct - s0 * st, sb = c0 * st + s0 * ct, k = (i * NS + j) * 3, live = r[3] > 0 ? 1 : 0;
      pos[k] = r[0] + N.x * ca + B.x * sb + ox * live; pos[k + 1] = Math.max(0, r[1] + N.y * ca + B.y * sb + (oy + (o.lift ? o.lift(kp, th) : 0)) * live); pos[k + 2] = r[2] + N.z * ca + B.z * sb + oz * live; } }
  // limbs: the patch round (k, th), radius r0, is drawn out along the path. f = 0 on the rim of the patch, 1 at its centre, which becomes the tip.
  // The patch is measured ON the skin (a along the ring, b along the spine, from the grid itself), so the map from patch to limb can not fold or shear.
  const Q = new T.Quaternion();
  LB.forEach(l => { let bi = 0, bj = 0, bd = 1e9; for (let i = 0; i < n; i++) { const d = Math.abs(kps[i] - l.k); if (d < bd) { bd = d; bi = i; } } bd = 1e9; for (let j = 0; j < NS; j++) { const d = Math.abs(adiff(ths[j], l.th)); if (d < bd) { bd = d; bj = j; } }
    const p0 = pos.slice(), P = v => new V3(p0[v * 3], p0[v * 3 + 1], p0[v * 3 + 2]), C = P(bi * NS + bj), S = new V3(rows[bi][0], rows[bi][1], rows[bi][2]), n0 = C.clone().sub(S).normalize();
    const e1 = P(bi * NS + (bj + 1) % NS).sub(P(bi * NS + (bj + NS - 1) % NS)); e1.addScaledVector(n0, -e1.dot(n0)).normalize(); const e2 = new V3().crossVectors(n0, e1); if (e2.dot(tans[bi]) < 0) e2.negate();
    const pts = [new V3()].concat(l.path.map(p => new V3(p[0], p[1], p[2]))), ns = pts.length - 1, cv = new T.CatmullRomCurve3(pts, false, 'centripetal'), rad = [l.r0].concat(l.rad), w = l.w || l.path.map(() => 1), wt = w.reduce((a, b) => a + b, 0), ey = l.ey || 1, cap = 0.86, fa = l.flat ? new V3().fromArray(l.flat) : null;
    const rAt = s => { const x = s * ns, i = Math.min(ns - 1, Math.floor(x)); return Math.max(0.005, cr(rad[Math.max(0, i - 1)], rad[i], rad[i + 1], rad[Math.min(ns, i + 2)], x - i)); };
    const sAt = u => { let acc = 0; for (let i = 0; i < ns; i++) { const d = w[i] / wt; if (u <= acc + d || i === ns - 1) return (i + Math.min(1, (u - acc) / d)) / ns; acc += d; } return 1; };
    const put = (v, a, b) => { const r = Math.hypot(a, b / ey); if (r >= l.r0) return; const p = P(v), f = 1 - r / l.r0, g = f > cap ? (f - cap) / (1 - cap) : 0, s = sAt(Math.min(1, f / cap)), A = cv.getPoint(s), tn = cv.getTangent(s).normalize(), R = rAt(s) * Math.sqrt(Math.max(0, 1 - g * g));
      const d = e1.clone().multiplyScalar(a).addScaledVector(e2, b / ey); if (r > 1e-6) d.multiplyScalar(1 / r); Q.setFromUnitVectors(n0, tn); const off = d.applyQuaternion(Q).multiplyScalar(R); if (fa) off.addScaledVector(fa, off.dot(fa) * ((l.fk ? l.fk(s) : 0.5) - 1));
      const arm = C.clone().add(A).add(off).addScaledVector(tn, rad[ns] * g * 0.9); p.lerp(arm, sm(f / 0.12)); pos[v * 3] = p.x; pos[v * 3 + 1] = Math.max(0.012, p.y); pos[v * 3 + 2] = p.z; lim[v] = [l, s, R, f]; };
    for (let dir = -1; dir <= 1; dir += 2) { let b = 0; for (let i = dir > 0 ? bi : bi - 1; i >= 0 && i < n; i += dir) { if (i !== bi) b += dir * P(i * NS + bj).distanceTo(P((i - dir) * NS + bj)); if (Math.abs(b) > l.r0 * ey) break; if (rows[i][3] <= 0) continue;
      put(i * NS + bj, 0, b); for (let sd = -1; sd <= 1; sd += 2) { let a = 0; for (let q = 1; q < NS / 2; q++) { const j = (bj + sd * q + NS * 2) % NS, jp = (bj + sd * (q - 1) + NS * 2) % NS; a += P(i * NS + j).distanceTo(P(i * NS + jp)); if (a > l.r0) break; put(i * NS + j, sd * a, b); } } } } });
  const idx = []; for (let i = 0; i < n - 1; i++) for (let j = 0; j < NS; j++) { const a = i * NS + j, b = (i + 1) * NS + j, c = (i + 1) * NS + (j + 1) % NS, d = i * NS + (j + 1) % NS; idx.push(a, b, d, b, c, d); }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  // the smooth numbers the material cuts: a = [pool, ring of the pool, depth, foam], b = [thin, no spine line]
  const A4 = new Float32Array(NV * 4), B2 = new Float32Array(NV * 2), foot = o.foot || 0.3, thin = o.thin || 0.2, R0 = K[0][3];
  for (let v = 0; v < NV; v++) { const i = (v / NS) | 0, kp = kps[i], th = ths[v % NS], y = pos[v * 3 + 1], q = lim[v], r = rows[i], wob = 0.05 * Math.sin(th * 3 + 1) + 0.03 * Math.sin(th * 7), rr = q ? q[2] : Math.min(r[3], r[4]);
    A4[v * 4] = !q && kp < pk ? 1 : 0; A4[v * 4 + 1] = r[3] / R0; A4[v * 4 + 2] = y / (foot * (1 + wob * 4));
    A4[v * 4 + 3] = q && q[3] > 0.1 ? (q[0].foam ? q[0].foam(q[1]) : 0) : (o.foam ? o.foam(kp, th, y) : 0);
    B2[v * 2] = Math.max(kp < pk ? 0 : 0.5 + (thin - rr) * 6, q ? (q[0].lite ? q[0].lite(q[1]) : 0) : (o.lite ? o.lite(kp, th, y) : 0)); B2[v * 2 + 1] = o.nosp && o.nosp(kp) ? 1 : 0; }
  geo.setAttribute('w25a', new T.BufferAttribute(A4, 4)); geo.setAttribute('w25b', new T.BufferAttribute(B2, 2)); geo.userData.grid = [n, NS]; return geo;
}
function inkHull25(T, geo, t) { const g = geo.clone(), p = g.attributes.position, n = geo.userData.grid[0], NS = geo.userData.grid[1]; let a = Float32Array.from(g.attributes.normal.array), b = new Float32Array(a.length);
  for (let pass = 0; pass < 6; pass++) { for (let i = 0; i < n; i++) for (let j = 0; j < NS; j++) { const v = (i * NS + j) * 3, nb = [(i * NS + (j + 1) % NS) * 3, (i * NS + (j + NS - 1) % NS) * 3, (Math.min(n - 1, i + 1) * NS + j) * 3, (Math.max(0, i - 1) * NS + j) * 3]; for (let c = 0; c < 3; c++) b[v + c] = a[v + c] * 2 + a[nb[0] + c] + a[nb[1] + c] + a[nb[2] + c] + a[nb[3] + c]; const l = Math.hypot(b[v], b[v + 1], b[v + 2]) || 1; b[v] /= l; b[v + 1] /= l; b[v + 2] /= l; } const sw = a; a = b; b = sw; }
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) + a[i * 3] * t, Math.max(0, p.getY(i) + a[i * 3 + 1] * t), p.getZ(i) + a[i * 3 + 2] * t);
  // the hull is also set back a little in depth, so that where a limb's fine mesh ripples the ink does not scratch through the skin
  const m = new T.Mesh(g, new T.MeshBasicMaterial({ color: new T.Color(COL.ink).convertSRGBToLinear(), side: T.BackSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: KIT.water25Back == null ? 6000 : KIT.water25Back })); m.userData.plain = true; return m; }
function mat25(T, o) {
  const v3 = h => { const c = new T.Color(h).convertSRGBToLinear(); return 'vec3(' + c.r.toFixed(4) + ',' + c.g.toFixed(4) + ',' + c.b.toFixed(4) + ')'; };
  const m = new T.MeshToonMaterial({ color: 0xffffff, gradientMap: ramp24 }), u = new T.Vector4(o.hp || 1.5, o.rings || 2, o.frho || 0.3, 0); m.extensions = { derivatives: true };
  const frag = ['{', 'vec3 n5 = normalize(vN25); float hl = length(n5.xz); vec2 hd = n5.xz / max(hl, 1e-4); float sd = A25(hl, 0.5);',
    'float ph = dot(vP25, vec3(0.5, 2.0, 0.3)) * 3.14159 / w25u.x; float m5 = sin(ph + 0.6) + 0.62, wf = clamp(m5 * 2.5, 0.0, 1.0) * A25(m5, 0.0), m6 = sin(ph * 1.7 + 2.0) + 0.1, wg = clamp(m6 * 2.5, 0.0, 1.0) * A25(m6, 0.0);',
    'vec3 c5 = ' + v3(C25.mid) + ';',
    'c5 = mix(c5, ' + v3(C25.mdeep) + ', 1.0 - A25(vWa.z, 2.2)); c5 = mix(c5, ' + v3(C25.deep) + ', 1.0 - A25(vWa.z, 1.0));',                     // darker where deep: the foot
    'c5 = mix(c5, ' + v3(C25.lite) + ', A25(vWb.x, 0.5));',                                                                                       // paler where thin
    'c5 = mix(c5, ' + v3(C25.lite) + ', 0.7 * A25(dot(hd, vec2(0.966, 0.259)), 0.93) * sd);',                                                     // the pale edge away from the lamp
    'c5 = mix(c5, ' + v3(C25.lite) + ', A25(dot(hd, vec2(0.0, -1.0)), 1.0 - 0.004 * wg) * sd * (1.0 - vWb.y));',                                       // the spine of highlights down a back
    'vec3 p5 = ' + v3(C25.pool) + '; float rho = vWa.y;',
    'p5 = mix(p5, ' + v3(C25.mid) + ', 1.0 - A25(rho, w25u.z * 1.3));',                                                                           // the pool is deeper round the foot
    'p5 = mix(p5, ' + v3(C25.lite) + ', A25(sin(rho * 6.2832 * w25u.y + 1.0), 0.9) * A25(sin(vP25.x * 4.1 + vP25.z * 2.3), -0.55));',             // ripple rings, broken
    'p5 = mix(p5, ' + v3(C25.hi) + ', A25(rho, 0.86) * (1.0 - A25(rho, 0.93)));',                                                                 // the rim highlight
    'c5 = mix(c5, p5, A25(vWa.x, 0.5));',
    'float g5 = max(A25(dot(hd, vec2(-0.64, 0.768)), 1.0 - 0.014 * wf), A25(dot(hd, vec2(-0.309, 0.951)), 1.0 - 0.002 * wf));',                                    // the gloss band and its thin partner, lamp side
    'g5 = max(g5, A25(dot(hd, vec2(0.64, -0.768)), 1.0 - 0.01 * wg)) * sd;',                                                                          // and on the back
    'g5 = max(g5, max(A25(dot(n5, vec3(-0.502, 0.622, 0.602)), 0.968), A25(dot(n5, vec3(0.502, 0.622, -0.602)), 0.98)));',                         // the shine on a shoulder or a crown
    'c5 = mix(c5, ' + v3(C25.hi) + ', g5); c5 = mix(c5, ' + v3(C25.foam) + ', A25(vWa.w, 0.5)); diffuseColor.rgb *= c5;', '}'].join('\n');
  m.onBeforeCompile = sh => { sh.uniforms.w25u = { value: u };
    sh.vertexShader = sh.vertexShader.replace('void main() {', 'attribute vec4 w25a;\nattribute vec2 w25b;\nvarying vec4 vWa;\nvarying vec2 vWb;\nvarying vec3 vN25;\nvarying vec3 vP25;\nvoid main() {\n\tvWa = w25a; vWb = w25b; vN25 = normal; vP25 = position;');
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'uniform vec4 w25u;\nvarying vec4 vWa;\nvarying vec2 vWb;\nvarying vec3 vN25;\nvarying vec3 vP25;\nfloat A25(float v, float t) { float w = max(fwidth(v), 1e-5) * 0.75; return smoothstep(t - w, t + w, v); }\nvoid main() {').replace('#include <color_fragment>', frag); };
  return m;
}
// marks laid on the body where rays from in front meet it: c a point, d the way the face looks; hit(px, py) in the plane across d
function lay25(T, body, c, d) { const V3 = T.Vector3, D = new V3().fromArray(d || [0, 0, 1]).normalize(), R = new V3().crossVectors(new V3(0, 1, 0), D).normalize(), U = new V3().crossVectors(D, R), C = new V3().fromArray(c), rc = new T.Raycaster();
  const hit = (px, py, lift) => { const o = C.clone().addScaledVector(R, px).addScaledVector(U, py).addScaledVector(D, 9); rc.set(o, D.clone().negate()); const h = rc.intersectObject(body)[0]; return h ? { p: h.point.clone().addScaledVector(h.face.normal, lift || 0), n: h.face.normal.clone() } : null; };
  const line = (pts, r, mat, closed) => { const q = pts.map(p => hit(p[0], p[1], r * 0.6)).filter(Boolean).map(h => h.p); return q.length > 2 ? new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(q, !!closed), q.length * 5, r, 6, !!closed), mat) : null; };
  return { hit, line, R, U }; }
// the face: the SAME eyes at every stage (a dark oval, one glint); what changes with age and temper is their size, the lids, the brows and the mouth
function face25(T, grp, body, f, lidMat) { if (!f) return; const L = lay25(T, body, f.c, f.d), k = f.k || 1, lin = h => new T.Color(h).convertSRGBToLinear(), black = new T.MeshBasicMaterial({ color: lin(0x1d1a18) }), white = new T.MeshBasicMaterial({ color: 0xffffff }), er = 0.085 * k * (f.er || 1), dx = (f.dx || 0.2) * k, br = f.brow, mo = f.mouth, add = m => { if (m) grp.add(m); };
  [-1, 1].forEach((s, si) => { const h = L.hit(s * dx, 0); if (!h) return; const put = (m, sc, lift, uo) => { m.scale.set(sc[0], sc[1], sc[2]); m.position.copy(h.p).addScaledVector(h.n, lift).addScaledVector(L.U, uo || 0); m.lookAt(m.position.clone().add(h.n)); grp.add(m); };
    put(new T.Mesh(new T.SphereGeometry(er, 18, 12), black), [1, 1.25, 0.35], 0.01);
    if (f.lid) put(new T.Mesh(new T.SphereGeometry(er * 1.14, 18, 12), lidMat), [1, 1.25, 0.42], 0.016, 2.5 * er * (1 - f.lid));
    const gl = new T.Mesh(new T.SphereGeometry(er * 0.34, 8, 6), white); gl.position.copy(h.p).addScaledVector(h.n, er * 0.42).addScaledVector(L.U, er * (f.lid ? -0.5 : 0.45)).addScaledVector(L.R, -er * 0.3); grp.add(gl);
    if (br) { const a = br.ang[si], cy = (br.y + (br.lift ? br.lift[si] : 0)) * k, hl = br.len * k / 2; add(L.line([-1, 0, 1].map(e => [s * dx + s * e * hl * Math.cos(a), cy + e * hl * Math.sin(a) + (e ? 0 : (br.arch == null ? 0.02 : br.arch) * k)]), (br.r || 0.02) * k, br.foam ? white : black)); } });
  if (mo) { const pts = [], mx = mo.x || 0; if (mo.o) for (let i = 0; i < 10; i++) pts.push([(mx + Math.cos(i / 10 * 2 * PI) * mo.o) * k, (mo.y + Math.sin(i / 10 * 2 * PI) * mo.o * 1.15) * k]); else for (let i = -4; i <= 4; i++) { const s = i / 4; pts.push([(mx + s * mo.w) * k, (mo.y - mo.d * (1 - s * s) + (mo.tilt || 0) * s) * k]); }
    add(L.line(pts, (mo.r || 0.024) * k, black, !!mo.o));
    if (mo.tick) { const s = mo.tick, x = mx + s * mo.w, y = mo.y + (mo.tilt || 0) * s; add(L.line([[(x - 0.02 * s) * k, (y - 0.04) * k], [(x + 0.012 * s) * k, y * k], [(x + 0.03 * s) * k, (y + 0.045) * k]], (mo.r || 0.024) * k * 0.9, black)); } } }
const circ = (x, y, r, n) => { const p = []; for (let i = 0; i < (n || 10); i++) p.push([x + Math.cos(i / (n || 10) * 2 * PI) * r, y + Math.sin(i / (n || 10) * 2 * PI) * r]); return p; };
const bub = (x, y, r) => ({ c: [0, 0, 0], pts: circ(x, y, r), r: 0.014, closed: true, col: 'lite', dot: [x - r * 0.35, y + r * 0.35, r * 0.28] });
// The five stages. x is to the figure's left (the right of the picture from in front), z to the front. Each is one spine: pool, body, neck, head, and the hair or crest as the end of it.
const S25 = [
  // 1 the newborn: only its crown is out of its own small puddle, eyes at the water line, its mouth still under; a single curl on top; it leans, shy
  () => ({ keys: [[0, 0, 0, 1.0, 0.8], [0, 0.05, 0, 0.99, 0.79], [0, 0.16, 0, 0.9, 0.72], [0, 0.07, 0, 0.79, 0.63], [0, 0.06, 0.02, 0.62, 0.52], [0, 0.1, 0.03, 0.52, 0.47],
      [0.02, 0.3, 0.03, 0.47, 0.45], [0.06, 0.56, 0.03, 0.46, 0.45], [0.1, 0.78, 0.02, 0.36, 0.36], [0.14, 0.92, 0, 0.2, 0.2], [0.2, 1.02, 0, 0.09, 0.09],
      [0.26, 1.16, 0, 0.055, 0.055], [0.18, 1.38, 0, 0.055, 0.055], [-0.02, 1.42, 0, 0.05, 0.05], [-0.12, 1.28, 0, 0.048, 0.048], [-0.03, 1.16, 0, 0.045, 0.045], [0.07, 1.22, 0, 0.04, 0.04], [0.06, 1.29, 0, 0, 0]].map(k => k.map(v => v * 1.1)),
    pk: 4.6, foot: 0.2, thin: 0.16, hp: 0.9, rings: 1.5, frho: 0.52, ns: 96, warp: 0, wet: [0, 0, 1.1, 0.88],
    face: { c: [0.055, 0.44, 0], k: 1.1, er: 1.3, dx: 0.21, brow: { y: 0.24, len: 0.11, ang: [-0.5, -0.5], r: 0.016 } },
    drops: [[-1.4, 0, 0.3, 0.05], [1.3, 0, -0.45, 0.04]] }),
  // 2 the child: head and shoulders out, propped on two stubby hands at the edge of its puddle, leaning out to look; cheeks puffed, a cowlick with a drip
  () => ({ keys: [[0, 0, 0.15, 1.45, 1.1], [0, 0.05, 0.15, 1.44, 1.09], [0, 0.13, 0.15, 1.33, 1.0], [0, 0.07, 0.12, 1.2, 0.9], [0, 0.06, -0.05, 0.8, 0.62], [0, 0.1, -0.15, 0.6, 0.5],
      [0, 0.32, -0.2, 0.5, 0.44], [-0.06, 0.7, -0.1, 0.46, 0.4], [-0.14, 1.02, 0.02, 0.5, 0.4], [-0.16, 1.24, 0.1, 0.3, 0.28], [-0.08, 1.6, 0.2, 0.6, 0.56], [0.02, 1.94, 0.2, 0.46, 0.45], [0.06, 2.1, 0.17, 0.2, 0.2],
      [0.12, 2.22, 0.17, 0.09, 0.09], [0.28, 2.32, 0.2, 0.06, 0.06], [0.44, 2.24, 0.24, 0.055, 0.055], [0.49, 2.09, 0.26, 0.085, 0.085], [0.49, 2.0, 0.26, 0, 0]],
    pk: 4.6, foot: 0.3, thin: 0.12, hp: 1.1, rings: 2, frho: 0.44, wet: [0, 0.15, 1.45, 1.1],
    bumps: [{ k: 9.8, th: PI / 2 - 0.85, amp: 0.13, sk: 0.35, sth: 0.32 }, { k: 9.8, th: PI / 2 + 0.85, amp: 0.13, sk: 0.35, sth: 0.32 }],
    limbs: [{ k: 8, th: 0.55, r0: 0.2, ey: 1.2, path: [[0.3, -0.2, 0.18], [0.62, -0.55, 0.38], [0.81, -0.9, 0.52]], rad: [0.15, 0.13, 0.2], flat: [0, 1, 0], fk: s => 1 - 0.45 * sm((s - 0.75) * 4) },
      { k: 8, th: PI - 0.55, r0: 0.2, ey: 1.2, path: [[-0.25, -0.22, 0.16], [-0.52, -0.58, 0.34], [-0.68, -0.9, 0.47]], rad: [0.15, 0.13, 0.2], flat: [0, 1, 0], fk: s => 1 - 0.45 * sm((s - 0.75) * 4) }],
    face: { c: [-0.08, 1.64, 0.2], d: [0.12, 0, 1], k: 1.0, er: 1.15, brow: { y: 0.23, len: 0.13, ang: [0.05, 0.3], lift: [0, 0.06], r: 0.018 }, mouth: { o: 0.045, y: -0.25, r: 0.02 } },
    marks: [{ c: [-0.08, 1.64, 0.2], d: [0.12, 0, 1], pts: [[-0.38, -0.2], [-0.32, -0.25], [-0.25, -0.24]], r: 0.014, col: 'hi' }, { c: [-0.08, 1.64, 0.2], d: [0.12, 0, 1], pts: [[0.25, -0.24], [0.32, -0.25], [0.38, -0.2]], r: 0.014, col: 'hi' }],
    drops: [[0.49, 1.78, 0.26, 0.05, 1], [0.49, 1.52, 0.26, 0.032, 1], [-1.75, 0, 0.5, 0.05]] }),
  // 3 the youth: a slim body twisting, one arm flung up mid-splash, the other trailing a ribbon of water; a wave-lick of hair; bubbles rising in it; a cheeky grin
  () => ({ keys: pool(0, 0, 1.55, 1.15, 0.44, 0.38).concat([[0.05, 0.7, 0, 0.36, 0.32], [0.16, 1.2, 0, 0.33, 0.29], [0.02, 1.7, 0.04, 0.4, 0.31], [-0.14, 2.1, 0.06, 0.5, 0.33], [-0.1, 2.36, 0.06, 0.2, 0.2], [0, 2.7, 0.08, 0.43, 0.41], [0.06, 3.0, 0.06, 0.33, 0.33],
      [0.04, 3.2, 0.02, 0.2, 0.19], [-0.12, 3.4, 0, 0.15, 0.14], [-0.38, 3.46, 0.05, 0.1, 0.1], [-0.56, 3.32, 0.1, 0.06, 0.06], [-0.6, 3.18, 0.12, 0, 0]]),
    foot: 0.4, thin: 0.13, hp: 1.5, rings: 2.5, frho: 0.4, wet: [0, 0, 1.55, 1.15], twist: kp => 0.5 * sm((kp - 6) / 3) - 0.35 * sm((kp - 9.5) / 1.5),
    limbs: [{ k: 9, th: 0, r0: 0.22, ey: 1.25, path: [[0.28, 0.2, 0], [0.5, 0.62, 0.02], [0.48, 1.08, 0.08], [0.5, 1.3, 0.1]], rad: [0.15, 0.12, 0.11, 0.16] },
      { k: 9, th: PI, r0: 0.22, ey: 1.25, path: [[-0.26, -0.12, 0], [-0.55, -0.5, -0.04], [-0.92, -0.62, -0.1], [-1.22, -0.42, -0.18], [-1.5, -0.62, -0.24], [-1.62, -1.05, -0.26], [-1.45, -1.4, -0.24]], rad: [0.14, 0.12, 0.11, 0.11, 0.09, 0.065, 0.03], flat: [0, 0, 1], fk: s => 1 - 0.35 * sm((s - 0.2) * 4), lite: s => s > 0.3 ? 1 : 0 }],
    face: { c: [0, 2.72, 0.08], d: [0.2, 0, 1], k: 0.9, brow: { y: 0.22, len: 0.14, ang: [0.05, 0.35], lift: [-0.03, 0.07], r: 0.02 }, mouth: { w: 0.22, d: 0.13, y: -0.21, tilt: 0.05, tick: 1, r: 0.032 } },
    marks: [bub(0.1, 0.85, 0.075), bub(0.0, 1.22, 0.05), bub(0.2, 1.42, 0.06), bub(0.0, 1.78, 0.04), bub(-0.18, 1.98, 0.03)],
    drops: [[0.98, 3.74, 0.3, 0.06, 1], [1.22, 3.5, 0.3, 0.045, 1], [0.64, 3.84, 0.3, 0.04, 1], [1.32, 3.18, 0.3, 0.035, 1], [-2.0, 0.45, -0.3, 0.04, 1], [1.8, 0, 0.5, 0.05]] }),
  // 4 the adult: tall, poised, shoulders back; long hair pouring down its back as a running fall into the pool; one hand out palm up, water spilling from it; a current turning in its chest
  () => ({ keys: pool(0, 0, 2.1, 1.6, 0.5, 0.42).concat([[0.12, 1.0, 0, 0.4, 0.34], [0.17, 1.7, 0.02, 0.33, 0.3], [0.04, 2.4, 0.08, 0.44, 0.34], [-0.08, 2.95, 0.14, 0.58, 0.36], [-0.07, 3.3, 0.07, 0.2, 0.2], [-0.03, 3.72, 0.04, 0.43, 0.42], [0, 4.1, -0.06, 0.33, 0.34],
      [0, 4.3, -0.32, 0.3, 0.22], [0, 4.16, -0.62, 0.3, 0.18], [-0.02, 3.6, -0.78, 0.28, 0.16], [0.04, 2.6, -0.84, 0.4, 0.12], [0, 1.5, -0.88, 0.56, 0.12], [0, 0.6, -0.96, 0.62, 0.14], [0, 0.14, -1.05, 0.74, 0.3], [0, 0.03, -1.05, 0, 0]]),
    foot: 0.42, thin: 0.1, hp: 2.0, rings: 3, frho: 0.34, ns: 128, warp: 0.3, per: 16, wet: [0, 0, 2.1, 1.6], nosp: kp => kp > 12.4,
    mod: (kp, th) => kp > 18.4 ? 1 + 0.12 * Math.sin(5 * th) * Math.min(1, (kp - 18.4) * 2) : 1,
    lite: (kp, th) => kp > 12.9 ? Math.min(0.5 + (Math.sin(th * 11 + 1.2 * Math.sin(kp * 0.9)) - 0.62) * 4, 0.5 + (Math.sin(kp * 1.9 + th * 4) + 0.35) * 2, kp - 12.9) : 0, foam: kp => 0.5 + (kp - 18.55) * 3,
    limbs: [{ k: 9, th: 0.2, r0: 0.23, ey: 1.4, path: [[0.2, -0.3, 0.05], [0.38, -0.7, 0.2], [0.72, -0.6, 0.42], [1.0, -0.42, 0.55], [1.15, -0.5, 0.58], [1.18, -0.95, 0.58], [1.18, -1.5, 0.58]], rad: [0.15, 0.13, 0.115, 0.2, 0.07, 0.045, 0.02], w: [2, 2, 2, 2, 1.2, 0.8, 0.8], flat: [0, 1, 0], fk: s => 1 - 0.55 * Math.exp(-Math.pow((s - 4 / 7) / 0.07, 2)) },
      { k: 9, th: PI, r0: 0.23, ey: 1.4, path: [[-0.2, -0.38, 0], [-0.3, -0.95, 0.02], [-0.24, -1.5, 0.14], [-0.26, -1.78, 0.2]], rad: [0.15, 0.13, 0.11, 0.14] }],
    face: { c: [-0.02, 3.76, 0.04], k: 1, er: 0.95, lid: 0.45, brow: { y: 0.21, len: 0.15, ang: [0.06, 0.06], arch: 0.03, r: 0.018 }, mouth: { w: 0.11, d: 0.04, y: -0.23 } },
    marks: [{ c: [0, 2.72, 0], pts: Array.from({ length: 26 }, (_, i) => { const a = i / 25 * 3.4 * PI, r = 0.03 + 0.2 * i / 25; return [Math.cos(a) * r, Math.sin(a) * r * 0.9]; }), r: 0.016, col: 'lite' }],
    drops: [[1.63, 1.12, 0.79, 0.05, 1], [1.63, 0.78, 0.79, 0.04, 1], [1.63, 0.46, 0.79, 0.03, 1], [-0.98, 1.72, 0.16, 0.045, 1], [-0.98, 1.42, 0.16, 0.03, 1], [1.95, 0, 1.2, 0.05], [-2.3, 0, 0.6, 0.05]] }),
  // 5 the elder, a small god of water: towering and broad; crowned by breaking water (the coronet a splash throws up, foam on its points), a beard of foam drawn from its chin and a mantle of foam
  //   on its back; both arms low and wide like tides drawing in, breaking into foam where they meet the pool; drops going round it
  () => { const pr = th => 0.5 + 0.5 * Math.cos(7 * th), rim = kp => Math.exp(-Math.pow((kp - 15.5) / 0.75, 2));
    return { keys: pool(0, 0, 3.9, 2.5, 1.15, 0.9).concat([[0, 1.2, 0, 1.0, 0.8], [0.05, 2.2, 0, 1.05, 0.8], [0, 3.2, 0.05, 1.3, 0.85], [0, 3.95, 0.08, 1.5, 0.85], [0, 4.25, 0.06, 0.95, 0.7], [0, 4.42, 0.05, 0.6, 0.55], [-0.05, 4.98, 0.05, 0.9, 0.85],
      [-0.05, 5.5, 0, 0.74, 0.7], [-0.05, 5.72, 0, 0.7, 0.66], [-0.05, 5.95, 0, 0.95, 0.9], [-0.05, 6.0, 0, 0.84, 0.8], [-0.05, 5.78, 0, 0.6, 0.56], [-0.05, 5.74, 0, 0, 0]]),
    foot: 0.7, thin: 0.12, hp: 2.7, rings: 4.5, frho: 0.3, wet: [0, 0, 3.9, 2.5],
    lift: (kp, th) => rim(kp) * (0.42 * pr(th) * pr(th) + 0.1 * (1 - Math.sin(th))), mod: (kp, th) => 1 + 0.14 * rim(kp) * pr(th),
    foam: (kp, th, y) => { if (kp > 14.4) return 0.5 + (kp - 14.95 + 0.3 * pr(th)) * 3; if (kp < 8 || kp > 13) return 0; const d = Math.abs(adiff(th, PI / 2)); return d < 1.3 ? 0.5 + 4 * Math.min(y - (4.12 + 0.6 * d * d + 0.05 * Math.sin(11 * th)), 4.5 + 0.4 * sm(d / 0.8) - y) : 0.5 + 4 * Math.min(y - 4.0 - 0.07 * Math.sin(9 * th), 4.5 - y, (d - 1.75) * 0.6); },
    limbs: [{ k: 9, th: 0.1, r0: 0.62, ey: 1.3, path: [[0.45, -0.45, 0.05], [0.95, -1.3, 0.15], [1.4, -2.3, 0.35], [1.8, -3.2, 0.7], [1.7, -3.6, 1.2], [1.3, -3.6, 1.6], [0.95, -3.45, 1.75]], rad: [0.44, 0.36, 0.34, 0.42, 0.4, 0.26, 0.1], foam: s => 0.5 + (s - 0.74) * 12 },
      { k: 9, th: PI - 0.1, r0: 0.62, ey: 1.3, path: [[-0.5, -0.4, 0.05], [-1.05, -1.2, 0.15], [-1.55, -2.2, 0.35], [-1.95, -3.15, 0.65], [-1.9, -3.6, 1.15], [-1.5, -3.6, 1.55], [-1.15, -3.45, 1.7]], rad: [0.44, 0.36, 0.34, 0.42, 0.4, 0.26, 0.1], foam: s => 0.5 + (s - 0.74) * 12 },
      { k: 11.05, th: PI / 2, r0: 0.4, path: [[0, -0.25, 0.3], [0.06, -0.75, 0.42], [-0.04, -1.25, 0.36], [0.05, -1.65, 0.3]], rad: [0.44, 0.4, 0.28, 0.1], flat: [0, 0, 1], fk: s => 0.6, foam: s => 1 }],
    face: { c: [-0.05, 5.12, 0.05], k: 1.7, er: 0.85, lid: 0.22, brow: { y: 0.2, len: 0.2, ang: [-0.2, -0.2], arch: 0.025, r: 0.035, foam: true }, mouth: { w: 0.12, d: 0.02, y: -0.235 } },
    drops: Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 2 * PI + 0.3; return [2.35 * Math.cos(a), 4.35 + 0.45 * Math.cos(a + 0.7), 1.5 * Math.sin(a), 0.075, 1]; }).concat([[4.0, 0, 1.0, 0.07], [-4.1, 0, -0.4, 0.06]]) }; }
];
function water25Fig(T, stage) {
  const o = S25[Math.max(1, Math.min(5, stage | 0)) - 1](), g = new T.Group(), lin = h => new T.Color(h).convertSRGBToLinear(), ink = KIT.water25Ink || 0.045;
  if (!ramp24) { ramp24 = new T.DataTexture(new Uint8Array([150, 215, 255]), 3, 1, T.LuminanceFormat); ramp24.minFilter = ramp24.magFilter = T.NearestFilter; ramp24.needsUpdate = true; }
  const geo = sweep25(T, o), body = new T.Mesh(geo, mat25(T, o)); body.userData.water24 = 'body'; g.add(body); g.add(inkHull25(T, geo, ink));
  face25(T, g, body, o.face, new T.MeshToonMaterial({ color: lin(C25.mid), gradientMap: ramp24 }));
  (o.marks || []).forEach(mk => { const L = lay25(T, body, mk.c, mk.d), m = L.line(mk.pts, mk.r, new T.MeshBasicMaterial({ color: lin(C25[mk.col || 'lite']) }), mk.closed); if (m) g.add(m); if (mk.dot) { const h = L.hit(mk.dot[0], mk.dot[1], 0.01); if (h) { const d = new T.Mesh(new T.SphereGeometry(mk.dot[2], 8, 6), new T.MeshBasicMaterial({ color: 0xffffff })); d.position.copy(h.p); g.add(d); } } });
  // the wood is only a little darker in a thin margin round the pool: wet, not a shadow
  if (o.wet) { const s = o.wet, cg = new T.CircleGeometry(1, 64), m = new T.Mesh(cg, new T.MeshBasicMaterial({ color: lin(0x5d3a1c), transparent: true, opacity: 0.4 })); m.rotation.x = -PI / 2; m.scale.set(s[2] * 1.035 + 0.05, s[3] * 1.035 + 0.05, 1); m.position.set(s[0], 0.006, s[1]); m.userData.plain = true; g.add(m); }
  (o.drops || []).forEach(d => { const air = d[4], dg = new T.SphereGeometry(d[3], 12, 10), dm = new T.Mesh(dg, new T.MeshToonMaterial({ color: lin(C25.lite), gradientMap: ramp24 })); dm.scale.set(1, air ? 1.35 : 0.55, 1); dm.position.set(d[0], air ? d[1] : d[3] * 0.3, d[2]); g.add(dm); const ik = new T.Mesh(dg, new T.MeshBasicMaterial({ color: lin(COL.ink), side: T.BackSide })); ik.position.copy(dm.position); ik.scale.copy(dm.scale).multiplyScalar(1 + ink * 0.8 / d[3]); ik.userData.plain = true; g.add(ik); });
  g.userData.water24 = { way: 'spirit', stage };
  return g;
}
KIT.water24 = KIT.water24 || 'a'; KIT.water24Fig = water24Fig; KIT.WATER24 = { ways: { a: 'pure water', b: 'water spirit', c: 'water beast', spirit: 'the water spirit, each stage its own character (builder 25)' } };
// ==== W26 BEGIN
// ---- Builder 26: THE WATER SPIRIT, ALIVE. AA.rxKit.spiritOn (default on): the game's Water is the spirit of builder 25, rebuilt so it can move.
// ONE SKIN PER STAGE (geo26): the stage's own numbers (S25: pool, spine keys, limbs) are read as one implicit body (a flat pool, a chain of round
//  sections along the spine, a chain along each arm / ribbon / beard, smooth-joined), and its surface is meshed once with even quads (surface nets,
//  4 to 6 thousand vertices). It is a single closed surface: there is no part to come off. A SKELETON of plain joints (pool, one per spine key, head,
//  hair, one per limb point) carries it; every vertex is weighted to the joints of the chain it came from, blended across the joins.
// The pose is worked out here (pose26: every joint from its parent, stretch and fatness of its own, a lag of its own so outer parts follow late),
//  so the body can stretch, sink into its pool, reach an arm out long and keep a hand or its hair landed in the pool (pins).
// Face parts ride the head joint; bubbles and the chest spiral are a second skin on the same skeleton; gloss and depth are cut by the material in
//  the body's rest coordinates, so they ride the skin. C26 holds the clips (rest, act, evo); play26 plays one frame. Nothing keeps a state.
const RK = KIT.RK, W26 = { geo: {}, ROLE: [null, { chest: 0, neck: 0, head: 1, hair: 5 }, { chest: 3, neck: 4, head: 5, hair: 8 }, { chest: 5, neck: 6, head: 7, hair: 10 }, { chest: 5, neck: 6, head: 7, hair: 9 }, { chest: 5, neck: 7, head: 8, hair: 11 }], TARGET: 4700 };
function geo26(T, stage) {
  if (W26.geo[stage]) return W26.geo[stage];
  const o = S25[stage - 1](), K = o.keys, ip = Math.floor(o.pk || 3.2) + 1, twf = o.twist || (() => 0), R = W26.ROLE[stage], bk = stage === 5 ? K.slice(ip, 15).concat([[-0.05, 6.02, 0, 0.3, 0.3]]) : K.slice(ip), nb = bk.length, bj = [], chains = [];
  const J = [{ p: [K[0][0], 0, K[0][2]], par: -1, role: 'pool', r: K[0][3], lag: 0, i: 0 }];
  const bpts = [{ p: [bk[0][0], -0.03, bk[0][2]], r: bk[0][3] * 1.2, sz: bk[0][4] / bk[0][3], sy: 1, tw: 0, kp: ip - 0.5 }];
  bk.forEach((k, i) => { const a = Math.max(k[3], 1e-3), role = i <= R.chest ? 'spine' : i < R.head ? 'neck' : i === R.head ? 'head' : i < R.hair ? 'top' : 'hair';
    bpts.push({ p: [k[0], k[1], k[2]], r: k[3], sz: Math.max(0.2, Math.min(1.6, k[4] / a)), sy: 1, tw: twf(ip + i), kp: ip + i });
    J.push({ p: [k[0], k[1], k[2]], par: i ? bj[i - 1] : 0, role, r: Math.max(k[3], 0.04), i, lag: role === 'spine' ? 2 * i / Math.max(1, R.chest) : role === 'neck' ? 2.4 : role === 'hair' ? 3.6 + 1.1 * (i - R.hair) : 3 }); bj.push(J.length - 1); });
  chains.push({ kind: 'body', pts: bpts, jn: [bj[0]].concat(bj), pin: stage === 4 });
  const bodyAt = kf => { const x = Math.max(0, Math.min(nb - 1, kf - ip)), i = Math.min(nb - 2, Math.floor(x)), t = x - i; return bk[i].map((v, c) => v + (bk[i + 1][c] - v) * t); };
  (o.limbs || []).forEach((l, li) => { const c = bodyAt(l.k), tw = twf(l.k), c0 = Math.cos(l.th) * c[3], s0 = Math.sin(l.th) * c[4], C = [c[0] + c0 * Math.cos(tw) - s0 * Math.sin(tw), c[1], c[2] + c0 * Math.sin(tw) + s0 * Math.cos(tw)];
    const side = Math.abs(Math.cos(l.th)) < 0.3 ? 0 : Math.cos(l.th) > 0 ? 1 : -1, par = bj[Math.max(0, Math.min(nb - 1, Math.round(l.k - ip)))], ns = l.path.length, jl = [], pts = [];
    const add = (p, r, s) => { const f = l.fk ? l.fk(s) : 0.5, fl = l.flat; pts.push({ p, r, sz: fl && fl[2] ? f : 1, sy: fl && fl[1] ? f : 1, tw: 0, kp: s }); J.push({ p, par: jl.length ? jl[jl.length - 1] : par, role: 'limb', li, side, r, i: jl.length, lag: 2.6 + 0.9 * jl.length }); jl.push(J.length - 1); };
    add([c[0] + (C[0] - c[0]) * 0.5, c[1], c[2] + (C[2] - c[2]) * 0.5], l.r0 * 0.9, 0); l.path.forEach((q, i) => add([C[0] + q[0], Math.max(0.03, C[1] + q[1]), C[2] + q[2]], l.rad[i], (i + 1) / ns));
    chains.push({ kind: 'limb', l, li, side, pts, jn: jl, pin: pts[ns].p[1] < 0.55 }); });
  if (K[2][1] > 0.1) { const pts = [], rr = K[2][1] * 0.5; for (let i = 0; i <= 18; i++) { const a = i / 18 * 2 * PI; pts.push({ p: [K[0][0] + Math.cos(a) * K[2][3] * 0.97, rr * 0.9, K[0][2] + Math.sin(a) * K[2][4] * 0.97], r: rr, sz: 1, sy: 1, tw: 0, kp: 0 }); } chains.push({ kind: 'rim', pts, bind: 0 }); }   // the lip of a small puddle
  if (stage === 5) for (let i = 0; i < 7; i++) { const a = i / 7 * 2 * PI + 0.22, c = Math.cos(a), s = Math.sin(a); chains.push({ kind: 'spike', bind: bj[11], pts: [{ p: [-0.05 + 0.6 * c, 5.7, 0.56 * s], r: 0.24, sz: 1, sy: 1, tw: 0, kp: 0 }, { p: [-0.05 + 0.8 * c, 6.15, 0.74 * s], r: 0.16, sz: 1, sy: 1, tw: 0, kp: 0.5 }, { p: [-0.05 + 0.92 * c, 6.58, 0.86 * s], r: 0.05, sz: 1, sy: 1, tw: 0, kp: 1 }] }); }   // the coronet: seven points of breaking water
  if (stage === 5) { const pts = []; for (let i = 0; i <= 14; i++) { const a = i / 14 * 2 * PI; pts.push({ p: [-0.05 + Math.cos(a) * 0.66, 5.84, Math.sin(a) * 0.62], r: 0.2, sz: 1, sy: 1, tw: 0, kp: 1 }); } chains.push({ kind: 'spike', pts, bind: bj[11] }); }
  const SUB = 4; let area = 2 * PI * K[0][3] * K[0][4];
  chains.forEach(ch => { const P = ch.pts, n = P.length, N = []; for (let i = 0; i < n - 1; i++) for (let s = 0; s < SUB; s++) { const t = s / SUB, a = P[Math.max(0, i - 1)], b = P[i], c = P[i + 1], d = P[Math.min(n - 1, i + 2)], g = k => cr(a.p[k], b.p[k], c.p[k], d.p[k], t), lp = k => b[k] + (c[k] - b[k]) * t;
      N.push({ x: g(0), y: g(1), z: g(2), r: Math.max(Math.min(b.r, c.r), Math.min(Math.max(b.r, c.r), cr(a.r, b.r, c.r, d.r, t))), sy: lp('sy'), sz: lp('sz'), tw: lp('tw'), kp: lp('kp'), u: i + t }); }
    const e = P[n - 1]; N.push({ x: e.p[0], y: e.p[1], z: e.p[2], r: e.r, sy: e.sy, sz: e.sz, tw: e.tw, kp: e.kp, u: n - 1 }); ch.N = N;
    for (let i = 0; i < N.length - 1; i++) area += 2 * PI * (N[i].r + N[i + 1].r) / 2 * (0.5 + 0.5 * N[i].sz) * Math.hypot(N[i + 1].x - N[i].x, N[i + 1].y - N[i].y, N[i + 1].z - N[i].z); });
  const cell = Math.sqrt(area / W26.TARGET), rmin = 0.72 * cell, kS = 0.5 * cell, pl = { x: K[0][0], z: K[0][2], rx: K[0][3], rz: K[0][4], h: Math.max(0.07, 0.85 * cell) }, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  chains.forEach(ch => { const b = ch.b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; ch.N.forEach(q => { q.r = Math.max(q.r, rmin); q.sz = Math.max(q.sz, rmin / q.r); q.sy = Math.max(q.sy, rmin / q.r); [q.x, q.y, q.z].forEach((v, c) => { b[c] = Math.min(b[c], v - q.r - 3 * cell); b[c + 3] = Math.max(b[c + 3], v + q.r + 3 * cell); }); }); for (let c = 0; c < 3; c++) { lo[c] = Math.min(lo[c], b[c]); hi[c] = Math.max(hi[c], b[c + 3]); } });
  lo[0] = Math.min(lo[0], pl.x - pl.rx - 3 * cell); hi[0] = Math.max(hi[0], pl.x + pl.rx + 3 * cell); lo[2] = Math.min(lo[2], pl.z - pl.rz - 3 * cell); hi[2] = Math.max(hi[2], pl.z + pl.rz + 3 * cell); lo[1] = -pl.h - 2.5 * cell;
  // distance to one chain: the nearest section (inf gets where on the chain, and the offset from its axis)
  const cd = (ch, x, y, z, inf) => { const b = ch.b; if (x < b[0] || x > b[3] || y < b[1] || y > b[4] || z < b[2] || z > b[5]) return (inf ? (inf.out = 1) : 0) * 0 + 2 * cell + Math.hypot(Math.max(b[0] - x, 0, x - b[3]), Math.max(b[1] - y, 0, y - b[4]), Math.max(b[2] - z, 0, z - b[5])); const N = ch.N; let best = 1e9; if (inf) inf.out = 0;
    for (let i = 0, n = N.length - 1; i < n; i++) { const A = N[i], B = N[i + 1], ax = B.x - A.x, ay = B.y - A.y, az = B.z - A.z; let t = ((x - A.x) * ax + (y - A.y) * ay + (z - A.z) * az) / (ax * ax + ay * ay + az * az + 1e-12); t = t < 0 ? 0 : t > 1 ? 1 : t;
      let qx = x - A.x - ax * t, qy = y - A.y - ay * t, qz = z - A.z - az * t; const tw = A.tw + (B.tw - A.tw) * t; if (tw) { const c = Math.cos(tw), s = Math.sin(tw), u = qx * c + qz * s; qz = -qx * s + qz * c; qx = u; }
      const sy = A.sy + (B.sy - A.sy) * t, sz = A.sz + (B.sz - A.sz) * t, r = A.r + (B.r - A.r) * t, d = Math.sqrt(qx * qx + qy * qy / (sy * sy) + qz * qz / (sz * sz)) - r;
      if (d < best) { best = d; if (inf) { inf.u = A.u + (B.u - A.u) * t; inf.kp = A.kp + (B.kp - A.kp) * t; inf.qx = qx; inf.qz = qz / sz; inf.r = r * Math.min(1, sz, sy); } } }
    return best; };
  const pd = (x, y, z) => { const px = (x - pl.x) / pl.rx, py = y / pl.h, pz = (z - pl.z) / pl.rz, k0 = Math.hypot(px, py, pz), k1 = Math.hypot(px / pl.rx, py / pl.h, pz / pl.rz); return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -pl.h; };
  const nP = chains.length + 1, ds = new Float64Array(nP), infs = chains.map(() => ({}));
  const f = (x, y, z, full) => { let dm = ds[0] = pd(x, y, z); for (let i = 1; i < nP; i++) { const d = ds[i] = cd(chains[i - 1], x, y, z, full ? infs[i - 1] : null); if (d < dm) dm = d; } let s = 0; for (let i = 0; i < nP; i++) s += Math.exp(-(ds[i] - dm) / kS); return dm - kS * Math.log(s); };
  const grad = (x, y, z, e) => { const gx = f(x + e, y, z) - f(x - e, y, z), gy = f(x, y + e, z) - f(x, y - e, z), gz = f(x, y, z + e) - f(x, y, z - e), l = Math.hypot(gx, gy, gz) || 1; return [gx / l, gy / l, gz / l, l / (2 * e)]; };
  // surface nets
  const n = [0, 1, 2].map(c => Math.ceil((hi[c] - lo[c]) / cell)), sx = n[0] + 1, sy = n[1] + 1, sz = n[2] + 1, D = new Float32Array(sx * sy * sz), si = (i, j, k) => i + sx * (j + sy * k);
  for (let k = 0; k < sz; k++) for (let j = 0; j < sy; j++) for (let i = 0; i < sx; i++) D[si(i, j, k)] = f(lo[0] + i * cell, lo[1] + j * cell, lo[2] + k * cell);
  const vid = new Int32Array(n[0] * n[1] * n[2]).fill(-1), ci = (i, j, k) => i + n[0] * (j + n[1] * k), pos = [], idx = [], EG = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  for (let k = 0; k < n[2]; k++) for (let j = 0; j < n[1]; j++) for (let i = 0; i < n[0]; i++) { const c = []; let m = 0; for (let q = 0; q < 8; q++) { const d = D[si(i + (q & 1), j + ((q >> 1) & 1), k + ((q >> 2) & 1))]; c.push(d); if (d < 0) m |= 1 << q; } if (m === 0 || m === 255) continue;
    let px = 0, py = 0, pz = 0, cnt = 0; EG.forEach(e => { const a = c[e[0]], b = c[e[1]]; if ((a < 0) === (b < 0)) return; const t = a / (a - b), A = e[0], B = e[1]; px += (A & 1) + ((B & 1) - (A & 1)) * t; py += ((A >> 1) & 1) + (((B >> 1) & 1) - ((A >> 1) & 1)) * t; pz += ((A >> 2) & 1) + (((B >> 2) & 1) - ((A >> 2) & 1)) * t; cnt++; });
    vid[ci(i, j, k)] = pos.length / 3; pos.push(lo[0] + (i + px / cnt) * cell, lo[1] + (j + py / cnt) * cell, lo[2] + (k + pz / cnt) * cell); }
  const quad = (a, b, c, d, ax, inside) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; const ux = pos[b * 3] - pos[a * 3], uy = pos[b * 3 + 1] - pos[a * 3 + 1], uz = pos[b * 3 + 2] - pos[a * 3 + 2], vx = pos[d * 3] - pos[a * 3], vy = pos[d * 3 + 1] - pos[a * 3 + 1], vz = pos[d * 3 + 2] - pos[a * 3 + 2], nn = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx][ax];
    if ((nn > 0) === inside) idx.push(a, b, d, b, c, d); else idx.push(a, d, b, b, d, c); };
  for (let k = 0; k < n[2]; k++) for (let j = 0; j < n[1]; j++) for (let i = 0; i < n[0]; i++) { const d0 = D[si(i, j, k)] < 0;
    if (j > 0 && k > 0 && d0 !== (D[si(i + 1, j, k)] < 0)) quad(vid[ci(i, j - 1, k - 1)], vid[ci(i, j, k - 1)], vid[ci(i, j, k)], vid[ci(i, j - 1, k)], 0, d0);
    if (i > 0 && k > 0 && d0 !== (D[si(i, j + 1, k)] < 0)) quad(vid[ci(i - 1, j, k - 1)], vid[ci(i, j, k - 1)], vid[ci(i, j, k)], vid[ci(i - 1, j, k)], 1, d0);
    if (i > 0 && j > 0 && d0 !== (D[si(i, j, k + 1)] < 0)) quad(vid[ci(i - 1, j - 1, k)], vid[ci(i, j - 1, k)], vid[ci(i, j, k)], vid[ci(i - 1, j, k)], 2, d0); }
  // each vertex: onto the true surface, its normal, the joints that carry it, and the smooth numbers the material cuts (pool, ring, depth, foam | thin, no spine line)
  const NV = pos.length / 3, P = new Float32Array(NV * 3), Nn = new Float32Array(NV * 3), A4 = new Float32Array(NV * 4), B2 = new Float32Array(NV * 2), SI = new Uint16Array(NV * 4), SW = new Float32Array(NV * 4), foot = o.foot || 0.3, thin = o.thin || 0.2, kW = 2.4 * kS, pk = o.pk || 3.2;
  const skin = (x, y, z) => { f(x, y, z, true); let dm = 1e9, bi = 0; for (let i = 0; i < nP; i++) if (ds[i] < dm) { dm = ds[i]; bi = i; } const w = {};
    for (let i = 0; i < nP; i++) { const e = Math.exp(-(ds[i] - dm) / kW); if (e < 0.004) continue; if (!i) { w[0] = (w[0] || 0) + e; continue; } const ch = chains[i - 1]; if (infs[i - 1].out) continue; if (ch.bind != null) { w[ch.bind] = (w[ch.bind] || 0) + e; continue; } const u = Math.max(0, Math.min(ch.jn.length - 1, infs[i - 1].u)), a = Math.min(ch.jn.length - 2, Math.floor(u)), t = u - a; w[ch.jn[a]] = (w[ch.jn[a]] || 0) + e * (1 - t); w[ch.jn[a + 1]] = (w[ch.jn[a + 1]] || 0) + e * t; }
    const top = Object.keys(w).map(k => [+k, w[k]]).sort((a, b) => b[1] - a[1]).slice(0, 4), s = top.reduce((a, b) => a + b[1], 0); return { top, s, bi, poolW: Math.exp(-(ds[0] - dm) / (kS * 0.7)) }; };
  for (let v = 0; v < NV; v++) { let x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2]; for (let it = 0; it < 2; it++) { const g = grad(x, y, z, cell * 0.25), d = f(x, y, z), st = Math.max(-cell, Math.min(cell, d / Math.max(0.5, g[3]))); x -= g[0] * st; y -= g[1] * st; z -= g[2] * st; }
    const g = grad(x, y, z, cell * 0.3), sk = skin(x, y, z), inf = sk.bi ? infs[sk.bi - 1] : null, ch = sk.bi ? chains[sk.bi - 1] : null, yy = Math.max(0.004, y); P[v * 3] = x; P[v * 3 + 1] = yy; P[v * 3 + 2] = z; Nn[v * 3] = g[0]; Nn[v * 3 + 1] = g[1]; Nn[v * 3 + 2] = g[2];
    sk.top.forEach((q, i) => { SI[v * 4 + i] = q[0]; SW[v * 4 + i] = q[1] / sk.s; });
    const th = inf ? Math.atan2(inf.qz, inf.qx) : 0, kp = inf ? inf.kp : 0, wob = 0.05 * Math.sin(th * 3 + 1) + 0.03 * Math.sin(th * 7), isPool = !ch || ch.kind === 'rim', pw = isPool ? 1 : Math.max(0, Math.min(1, (sk.poolW - 0.35) * 3)), limb = ch && ch.kind === 'limb' ? ch.l : null;
    A4[v * 4] = pw; A4[v * 4 + 1] = Math.hypot((x - pl.x) / pl.rx, (z - pl.z) / pl.rz); A4[v * 4 + 2] = yy / (foot * (1 + wob * 4));
    A4[v * 4 + 3] = isPool ? 0 : ch.kind === 'spike' ? 1 : limb ? (limb.foam ? limb.foam(kp) : 0) : (o.foam ? o.foam(kp, th, yy) : 0);
    B2[v * 2] = isPool ? 0 : Math.max(0.5 + (thin - inf.r) * 6, limb ? (limb.lite ? limb.lite(kp) : 0) : ch.kind === 'body' && o.lite ? o.lite(kp, th, yy) : 0); B2[v * 2 + 1] = ch && ch.kind === 'body' && o.nosp && o.nosp(kp) ? 1 : 0; }
  const mk = (ps) => { const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(ps, 3)); g.setAttribute('normal', new T.BufferAttribute(Nn, 3)); g.setIndex(idx); g.setAttribute('skinIndex', new T.BufferAttribute(SI, 4)); g.setAttribute('skinWeight', new T.BufferAttribute(SW, 4)); return g; };
  const geo = mk(P); geo.setAttribute('w25a', new T.BufferAttribute(A4, 4)); geo.setAttribute('w25b', new T.BufferAttribute(B2, 2));
  const ink = 0.02 + 0.011 * Math.max.apply(null, bk.map(k => k[1])), HP = new Float32Array(NV * 3); for (let v = 0; v < NV; v++) { HP[v * 3] = P[v * 3] + Nn[v * 3] * ink; HP[v * 3 + 1] = Math.max(0, P[v * 3 + 1] + Nn[v * 3 + 1] * ink); HP[v * 3 + 2] = P[v * 3 + 2] + Nn[v * 3 + 2] * ink; }
  // lengths and lists the pose needs
  const H = Math.max.apply(null, J.map(q => q.p[1])), reach = chains.filter(c => c.kind === 'limb' && c.side).map(c => ({ jn: c.jn, side: c.side, len: c.jn.slice(1).reduce((a, j, i) => a + Math.hypot(J[j].p[0] - J[c.jn[i]].p[0], J[j].p[1] - J[c.jn[i]].p[1], J[j].p[2] - J[c.jn[i]].p[2]), 0) }));
  const hairJ = bj.slice(R.hair); if (!reach.length) reach.push({ jn: [bj[Math.max(0, R.hair - 1)]].concat(hairJ), side: 0, len: 0.6 * H });
  const pins = chains.filter(c => c.pin).map(c => (c.kind === 'body' ? { jn: [bj[R.hair - 1]].concat(hairJ), body: 1 } : { jn: c.jn, side: c.side }));
  J.forEach(q => { q.hw = 0.5; }); const G = { stage, o, J, chains, geo, hull: mk(HP), f, grad, skin, H, cell, bj, R, pl, reach, pins, hairJ, nSp: R.chest + 1, nNk: Math.max(1, R.head - R.chest), ink, NV, ip };
  return (W26.geo[stage] = G);
}
// the same skin for the marks: tubes laid on the surface, carried by the same joints
function marks26(T, G, hit) { const pos = [], col = [], idx = [], si = [], sw = [], lin = h => new T.Color(h).convertSRGBToLinear();
  const put = (g, c) => { const p = g.attributes.position, b = pos.length / 3, ix = g.index.array; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), sk = G.skin(x, y, z); pos.push(x, y, z); col.push(c.r, c.g, c.b); for (let k = 0; k < 4; k++) { const q = sk.top[k]; si.push(q ? q[0] : 0); sw.push(q ? q[1] / sk.s : 0); } } for (let i = 0; i < ix.length; i++) idx.push(ix[i] + b); };
  (G.o.marks || []).forEach(mk => { const h = hit(mk.c, mk.d), q = mk.pts.map(p => h(p[0], p[1], mk.r * 0.7)).filter(Boolean).map(e => e.p); if (q.length > 2) put(new T.TubeGeometry(new T.CatmullRomCurve3(q, !!mk.closed), q.length * 4, mk.r, 5, !!mk.closed), lin(C25[mk.col || 'lite']));
    if (mk.dot) { const e = h(mk.dot[0], mk.dot[1], 0.012); if (e) { const s = new T.SphereGeometry(mk.dot[2], 6, 5); s.translate(e.p.x, e.p.y, e.p.z); put(s, new T.Color(1, 1, 1)); } } });
  if (!pos.length) return null; const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4)); g.setIndex(idx); return g; }
function fig26(T, stage, ex) {
  const G = geo26(T, stage), o = G.o, V3 = T.Vector3, grp = new T.Group(), root = new T.Group(), lin = h => new T.Color(h).convertSRGBToLinear(), J = G.J; grp.add(root);
  if (!ramp24) { ramp24 = new T.DataTexture(new Uint8Array([150, 215, 255]), 3, 1, T.LuminanceFormat); ramp24.minFilter = ramp24.magFilter = T.NearestFilter; ramp24.needsUpdate = true; }
  const bones = J.map(q => { const b = new T.Bone(); b.position.fromArray(q.p); root.add(b); return b; }); root.updateMatrixWorld(true); const skel = new T.Skeleton(bones);
  const mat = mat25(T, o); mat.skinning = true; mat.onBeforeCompile = (f0 => sh => { f0(sh); mat.userData.u = sh.uniforms.w25u.value; sh.fragmentShader = sh.fragmentShader.replace('sin(rho * 6.2832 * w25u.y + 1.0)', 'sin(rho * 6.2832 * w25u.y + 1.0 - w25u.w)'); })(mat.onBeforeCompile); mat.customProgramCacheKey = () => 'w26';
  const skinned = (g, m) => { const s = new T.SkinnedMesh(g, m); s.bind(skel, new T.Matrix4()); s.frustumCulled = false; s.userData.plain = true; root.add(s); return s; };
  const body = skinned(G.geo, mat); body.userData.water24 = 'body'; const hull = skinned(G.hull, new T.MeshBasicMaterial({ color: lin(COL.ink), side: T.BackSide, skinning: true, polygonOffset: true, polygonOffsetFactor: 1.5, polygonOffsetUnits: KIT.water26Back == null ? 300 : KIT.water26Back }));
  // rays from in front on to the skin (marched through the body's own distance), for the face and the marks
  const hitter = (c, d) => { const Dv = new V3().fromArray(d || [0, 0, 1]).normalize(), Rv = new V3().crossVectors(new V3(0, 1, 0), Dv).normalize(), Uv = new V3().crossVectors(Dv, Rv), Cv = new V3().fromArray(c);
    const h = (px, py, lift) => { const p = Cv.clone().addScaledVector(Rv, px).addScaledVector(Uv, py).addScaledVector(Dv, G.H * 0.45); for (let i = 0; i < 160; i++) { const dd = G.f(p.x, p.y, p.z); if (dd < 0.003) { const g = G.grad(p.x, p.y, p.z, G.cell * 0.3), nn = new V3(g[0], g[1], g[2]); return { p: p.addScaledVector(nn, lift || 0), n: nn }; } p.addScaledVector(Dv, -Math.max(0.004, dd * 0.4)); } return null; }; h.R = Rv; h.U = Uv; return h; };
  const mm = marks26(T, G, hitter); let marks = null; if (mm) { marks = skinned(mm, new T.MeshBasicMaterial({ vertexColors: true, skinning: true, transparent: true })); }
  // the face rides the head joint
  const f = o.face, jh = G.bj[G.R.head], hb = bones[jh], hp = new V3().fromArray(J[jh].p), F = { eyes: [], brows: [], mouth: null, om: null, f };
  if (f) { const L = hitter(f.c, f.d), k = f.k || 1, black = new T.MeshBasicMaterial({ color: lin(0x1d1a18) }), white = new T.MeshBasicMaterial({ color: 0xffffff }), lidM = new T.MeshToonMaterial({ color: lin(C25.mid), gradientMap: ramp24 }), er = 0.085 * k * (f.er || 1), dx = (f.dx || 0.2) * k, br = f.brow, mo = f.mouth;
    const basis = n => { const x = new V3().crossVectors(L.U, n).normalize(), y = new V3().crossVectors(n, x); return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, n)); };
    const pivot = e => { const g = new T.Group(); g.position.copy(e.p).sub(hp); g.quaternion.copy(basis(e.n)); g.userData.p0 = g.position.clone(); g.userData.q0 = g.quaternion.clone(); hb.add(g); return g; };
    const tube = (g, e, pts, r, m, closed) => { const iq = g.userData.q0.clone().invert(), q = pts.map(p => L(p[0], p[1], r * 0.6)).filter(Boolean).map(h => h.p.sub(e.p).applyQuaternion(iq)); if (q.length > 2) { const t = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(q, !!closed), q.length * 5, r, 6, !!closed), m); t.userData.plain = true; g.add(t); return t; } return null; };
    [-1, 1].forEach((s, si) => { const e = L(s * dx, 0, 0.012); if (!e) return; const g = pivot(e), ball = new T.Mesh(new T.SphereGeometry(er, 16, 10), black); ball.scale.set(1, 1.25, 0.35); g.add(ball);
      const lid = new T.Mesh(new T.SphereGeometry(er * 1.14, 16, 10), lidM); lid.scale.set(1, 1.25, 0.42); lid.position.z = 0.006; g.add(lid); const gl = new T.Mesh(new T.SphereGeometry(er * 0.34, 8, 6), white); gl.position.set(-er * 0.3, er * 0.45, er * 0.42); g.add(gl);
      [ball, lid, gl].forEach(m => { m.userData.plain = true; }); F.eyes.push({ g, lid, gl, er });
      if (br) { const a = br.ang[si], cy = (br.y + (br.lift ? br.lift[si] : 0)) * k, hl = br.len * k / 2, eb = L(s * dx, cy, 0.01); if (eb) { const bg = pivot(eb); tube(bg, eb, [-1, 0, 1].map(q => [s * dx + s * q * hl * Math.cos(a), cy + q * hl * Math.sin(a) + (q ? 0 : (br.arch == null ? 0.02 : br.arch) * k)]), (br.r || 0.02) * k, br.foam ? white : black); F.brows.push({ g: bg, s }); } } });
    if (mo) { const mx = (mo.x || 0) * k, e = L(mx, mo.y * k, 0.01); if (e) { const g = pivot(e), pts = []; if (mo.o) for (let i = 0; i < 10; i++) pts.push([mx + Math.cos(i / 10 * 2 * PI) * mo.o * k, (mo.y + Math.sin(i / 10 * 2 * PI) * mo.o * 1.15) * k]); else for (let i = -4; i <= 4; i++) { const s = i / 4; pts.push([mx + s * mo.w * k, (mo.y - mo.d * (1 - s * s) + (mo.tilt || 0) * s) * k]); }
        tube(g, e, pts, (mo.r || 0.024) * k, black, !!mo.o); F.mouth = g; F.mo = mo;
        if (!mo.o) { const og = pivot(e); tube(og, e, Array.from({ length: 10 }, (_, i) => [mx + Math.cos(i / 10 * 2 * PI) * 0.05 * k, (mo.y - (mo.d || 0) * 0.5) * k + Math.sin(i / 10 * 2 * PI) * 0.06 * k]), (mo.r || 0.024) * k * 0.85, black, true); og.visible = false; F.om = og; } } } }
  // the wet margin on the wood, and the loose drops: each rides the joint it is nearest to
  let wet = null; if (o.wet) { const s = o.wet; wet = new T.Mesh(new T.CircleGeometry(1, 48), new T.MeshBasicMaterial({ color: lin(0x3a3f4a), transparent: true, opacity: 0.22 })); wet.rotation.x = -PI / 2; wet.userData.s = [s[2] * 1.035 + 0.05, s[3] * 1.035 + 0.05]; wet.scale.set(wet.userData.s[0], wet.userData.s[1], 1); wet.position.set(s[0], 0.006, s[1]); wet.userData.plain = true; wet.userData.nobox = true; root.add(wet); }
  const dropM = new T.MeshToonMaterial({ color: lin(C25.lite), gradientMap: ramp24 }), inkM = new T.MeshBasicMaterial({ color: lin(COL.ink), side: T.BackSide }), drops = [];
  const drop = (r, air) => { const g = new T.Group(), dg = new T.SphereGeometry(r, 10, 8), a = new T.Mesh(dg, dropM), b = new T.Mesh(dg, inkM); b.scale.setScalar(1 + G.ink * 0.8 / r); a.userData.plain = b.userData.plain = true; g.add(a); g.add(b); g.scale.set(1, air ? 1.35 : 0.55, 1); root.add(g); return g; };
  (o.drops || []).forEach((d, i) => { const g = drop(d[3], d[4]); let bj = 0, bd = 1e9; J.forEach((q, j) => { const dd = Math.hypot(q.p[0] - d[0], q.p[1] - d[1], q.p[2] - d[2]); if (j && dd < bd) { bd = dd; bj = j; } }); drops.push({ g, d, air: !!d[4], j: bj, off: [d[0] - J[bj].p[0], d[1] - J[bj].p[1], d[2] - J[bj].p[2]], n: i }); });
  const tipR = G.cell * 0.55, drips = [G.hairJ[G.hairJ.length - 1], G.reach[0].jn[G.reach[0].jn.length >> 1], G.reach[G.reach.length - 1].jn[G.reach[G.reach.length - 1].jn.length - 1]].map((j, i) => ({ g: drop(tipR, 1), j, n: i }));
  const S = { G, st: stage, grp, root, bones, body, hull, marks, mat, F, wet, drops, drips, P: J.map(() => new V3()), Q: J.map(() => new T.Quaternion()), Fs: J.map(() => new V3(1, 1, 1)), QS: Array.from({ length: 10 }, () => ({})), RP: J.map(q => q.p), RF: J.map(() => 1), MF: {}, ph: 0, jar: !!(ex && ex.jar),
    e: new T.Euler(), q: new T.Quaternion(), v: new V3(), v2: new V3(), handW: new V3(), headW: new V3(), bodyW: new V3(), T };
  grp.userData.rig2 = { id: 'spirit26', spirit: true, stage, parts: { body: bones[jh] }, order: [], sp: S }; grp.userData.water24 = { way: 'spirit26', stage };
  try { play26(grp, 'rest', 0, { jar: S.jar }); } catch (e) { KIT.spiritErr = String(e && e.stack); }
  return grp;
}
// one stage posed as another (for the change of stage): where each joint of `to` sits on the body of `from`, and how fat
let T26 = null;
function morph26(Gt, Gf) { const p = [], fat = [], at = (list, x, G) => { const n = list.length - 1, a = Math.max(0, Math.min(n - 1e-6, x)), i = Math.floor(a), t = a - i, A = G.J[list[i]], B = G.J[list[Math.min(n, i + 1)]]; return { p: [0, 1, 2].map(c => A.p[c] + (B.p[c] - A.p[c]) * t), r: A.r + (B.r - A.r) * t }; };
  const seg = (i, a0, a1, b0, b1) => b0 + (a1 > a0 ? (i - a0) / (a1 - a0) : 0) * (b1 - b0), Rt = Gt.R, Rf = Gf.R, nt = Gt.bj.length - 1, nf = Gf.bj.length - 1;
  const bmap = i => (i <= Rt.chest ? seg(i, 0, Rt.chest, 0, Rf.chest) : i <= Rt.neck ? seg(i, Rt.chest, Rt.neck, Rf.chest, Rf.neck) : i <= Rt.head ? seg(i, Rt.neck, Rt.head, Rf.neck, Rf.head) : i < Rt.hair ? seg(i, Rt.head, Rt.hair, Rf.head, Rf.hair) : seg(i, Rt.hair, nt, Rf.hair, nf));
  Gt.J.forEach((q, j) => { let e = null; if (j === 0) e = { p: Gf.J[0].p, r: Gf.J[0].r }; else if (q.role !== 'limb') e = at(Gf.bj, bmap(q.i), Gf); else { const ct = Gt.chains.find(c => c.kind === 'limb' && c.li === q.li), cf = q.side ? Gf.chains.find(c => c.kind === 'limb' && c.side === q.side) : null;
      if (cf) e = at(cf.jn, q.i / (ct.jn.length - 1) * (cf.jn.length - 1), Gf); else { e = at(Gf.bj, bmap(Gt.J[ct.jn[0]].par ? Gt.J[Gt.J[ct.jn[0]].par].i : 0), Gf); e = { p: [e.p[0] + q.side * e.r * 0.5, e.p[1] - 0.02 * q.i, e.p[2]], r: q.r * 0.3 }; } }
    p.push(e.p); fat.push(Math.max(0.3, Math.min(3, e.r / q.r))); });
  /* each outer joint also turns from the way its piece runs on `to` to the way it runs on `from`, so a flat fall of hair is not left edge-on */ const al = Gt.J.map((q, j) => { if (!j || (q.role !== 'hair' && q.role !== 'limb')) return null; const a = Gt.J[q.par].p, u = new T26.Vector3(q.p[0] - a[0], q.p[1] - a[1], q.p[2] - a[2]), v = new T26.Vector3(p[j][0] - p[q.par][0], p[j][1] - p[q.par][1], p[j][2] - p[q.par][2]); return u.length() < 1e-4 || v.length() < 1e-4 ? null : new T26.Quaternion().setFromUnitVectors(u.normalize(), v.normalize()); });
  return { p, fat, al, pool: [Gf.pl.rx / Gt.pl.rx, Gf.pl.rz / Gt.pl.rz], face: Gf.o.face }; }
// THE CLIPS. Each fills q for one moment (it is asked again for moments a little earlier: outer joints read those, so they follow late).
// q: sink (0 out, 1 all in the pool), flat (the pool lies on the page), turn, lean, bow, sq (stretch +, squash -, volume kept), swell, px pz (pool), nod tilt hturn (head), hair, armR armL (raise), rw rT rs (an arm reaches to a point), the face, e (how far along its trip)
const C26 = {
  rest(S, t, o, q, lagMs) { const K = RK, st = S.st, jar = o.jar ? 1 : 0, k = jar ? 0.6 : 1, tt = t * (jar ? 0.55 : 1) + S.ph, sp = o.spent || 0, br = Math.sin(tt * PI / 2);
    q.sq = 0.035 * br * k * (1 + 0.6 * sp); q.px = q.pz = 1 - 0.02 * br; q.lean = k * (0.07 * Math.sin(tt * PI / 4) + 0.03 * Math.sin(tt * 1.19 + 1)); q.bow = 0.03 * Math.sin(tt * 0.61 + 2); q.hair = 0.05 * Math.sin(tt * PI / 2 - 1.2);
    if (o.land != null) { const ms = o.land - lagMs; if (ms > 0 && ms < 3000) { const r = K.ring(ms, 420, 520); q.sq -= 0.2 * r; q.px += 0.13 * r; q.pz += 0.13 * r; q.lean += 0.07 * K.ring(ms, 650, 900); q.hair += 0.3 * K.ring(ms, 500, 700); } }
    const bu = K.mod(tt + 2.3, 7.3); q.blink = Math.max(K.pulse(bu, 0, 0.2, 0.09), Math.floor(tt / 7.3) % 3 === 0 ? K.pulse(bu, 0.55, 0.72, 0.09) : 0);
    const gl = o.glance || 0, lx = o.look ? o.look[0] : -1; q.hturn = lx * 0.5 * gl; q.lookx = lx * gl; q.wide = 0.3 * gl; q.brow = 0.6 * gl; q.sq += 0.04 * gl;
    if (st === 1) { const u = K.mod(tt, 14), dk = K.pulse(u, 8, 10.6, 0.25), pk = K.pulse(u, 9.3, 10.6, 0.5); q.sq += 0.12 * K.pulse(u, 7.5, 7.95, 0.2) + 0.14 * K.ring((u - 10.85) * 500, 380, 420) * (u > 10.85 ? 1 : 0); q.sink = 0.8 * dk - 0.38 * pk; q.lookx += Math.sin((u - 9.3) * 4.4) * pk; q.wide += 0.3 * pk; q.px += 0.1 * K.ring((u - 8.1) * 500, 500, 500) * (u > 8.1 ? 1 : 0); q.pz = q.px; q.hair += 0.25 * Math.sin(tt * PI / 2) * (1 - dk); }
    else if (st === 2) { const u = K.mod(tt, 16), L = 0.24 * K.pulse(u, 9.4, 13.2, 0.9) - 0.22 * K.pulse(u, 2.4, 6.2, 0.9), E = K.pulse(u, 8.8, 12.6, 0.4) - K.pulse(u, 1.8, 5.6, 0.4); q.lean += L * k; q.hturn += -1.6 * L; q.lookx += -E; q.tilt = 0.5 * L; q.bow += 0.12 * Math.abs(L) / 0.24; q.brow += 0.5 * Math.abs(E); q.hair += 0.2 * Math.sin(tt * 1.9); }
    else if (st === 3) { const u = K.mod(tt, 12), wd = K.pulse(u, 5.0, 5.75, 0.3), fl = u > 5.8 ? K.ring((u - 5.8) * 500, 520, 560) : 0; q.armL = -0.3 * wd + 0.85 * fl * k; q.lean += 0.05 * wd - 0.07 * fl; q.armR = 0.1 * Math.sin(tt * PI / 2 + 1) + 0.12 * fl; q.hturn += -0.35 * K.pulse(u, 4.8, 7.4, 0.5); q.lookx += -K.pulse(u, 4.6, 7.2, 0.4); q.smile = 1 + 0.4 * K.pulse(u, 5.8, 8, 0.5); q.hair += 0.18 * Math.sin(tt * PI / 2 + 0.6) - 0.25 * fl; }
    else if (st === 4) { const u = K.mod(tt, 16), lk = K.pulse(u, 6, 10, 0.8); q.armR = 0.07 * Math.sin(tt * PI / 4) + 0.1 * lk; q.armL = 0.04 * Math.sin(tt * PI / 4 + 2); q.hturn += 0.4 * lk; q.lookx += lk; q.looky = -0.6 * lk; q.tilt = 0.06 * Math.sin(tt * PI / 8) + 0.1 * lk; q.lean *= 0.7; }
    else if (st === 5) { const a = Math.sin(tt * PI / 6); q.armR = 0.09 * a; q.armL = -0.09 * a; q.px += 0.04 * a; q.pz -= 0.03 * a; q.lean = 0.035 * a; q.tilt = 0.04 * Math.sin(tt * PI / 6 - 0.8); q.hair = 0.04 * Math.sin(tt * PI / 3); }
    if (sp) { q.sink += (st === 1 ? 0.15 : 0.26) * sp; q.bow += 0.2 * sp; q.nod = 0.35 * sp; q.lidx = 0.6 * sp; q.smile = 1 - 1.3 * sp; q.armR -= 0.9 * sp; q.armL -= 0.3 * sp; q.lean += 0.1 * sp; q.brow -= 0.4 * sp; q.hair -= 0.3 * sp; } },
  act(S, t, o, q) { const K = RK, W = o.W, Jn = o.J, D = o.D, B = o.B, w = (o.bites && o.bites.w26) || {}, a = t - W - Jn, TG = w.T || [], n = TG.length, dir = o.dir || 1, hit = w.hitU || 0.7;
    if (t < W) { const u = K.cl(t / W); q.sq = 0.1 * K.pulse(u, 0.04, 0.3, 0.12); q.sink = 0.95 * K.ei((u - 0.28) / 0.72); q.flat = K.sm((u - 0.5) / 0.45); q.lookx = dir; q.hturn = 0.45 * dir * K.pulse(u, 0, 0.45, 0.15); q.wide = 0.3 * K.pulse(u, 0, 0.4, 0.1); q.e = 0; return; }
    if (a < 0) { const u = (t - W) / Jn, v = Math.sin(PI * u); q.sink = 0.95; q.flat = 1; q.e = u * u * (3 - 2 * u); q.pz = 1 + 0.32 * v; q.px = 1 - 0.1 * v; q.lean = -dir * 0.5 * v; q.hair = -0.5 * v; q.mv = v; return; }
    if (a < D) { const p = a / D, rs = K.back(p / 0.13); q.e = 1; q.sink = 0.95 * (1 - Math.min(1, rs)); q.sq = 0.5 * Math.max(0, rs - 1) + 0.12 * (a > 0.13 * D ? K.ring(a - 0.13 * D, 320, 400) : 0); q.flat = 1 - K.sm(p / 0.06); q.px = q.pz = 1 + 0.1 * (a > 0.1 * D ? K.ring(a - 0.1 * D, 400, 450) : 0);
      const g0 = 0.17, gw = (hit - 0.08 - g0) / Math.max(1, n); let sw = 0;
      for (let i = 0; i < n; i++) { const u = (p - g0 - i * gw) / gw; if (u > 0 && u < 1) { q.rw = u < 0.42 ? K.back(u / 0.42) : u < 0.52 ? 1 : 1 - K.sm((u - 0.52) / 0.4); q.rT = TG[i]; q.open = K.pulse(u, 0.1, 0.5, 0.1); q.lookx = (TG[i].sx || 0); q.looky = -0.4; q.sq -= 0.07 * K.pulse(u, -0.05, 0.12, 0.08); q.bow += 0.12 * K.pulse(u, 0.2, 0.6, 0.15); }
        const dn = (p - g0 - (i + 0.9) * gw) * D; if (dn > 0) { sw += 0.065 * K.sm(dn / 160) + 0.08 * K.ring(dn, 260, 300); q.blink = Math.max(q.blink, K.pulse(dn, 0, 260, 90)); } }
      q.swell = sw; if (w.gulp) w.gulp.p = p;
      const hh = w.hand || hit, h0 = hh - 0.075, hu = (p - h0) / 0.075; if (p > h0 && p < 0.93) { q.rT = w.H; q.rw = hu < 1 ? K.ei(hu) : 1 - K.sm((p - 0.87) / 0.06); q.sq += 0.08 * K.pulse(hu, -0.2, 0.55, 0.3) - 0.1 * (p > hh ? K.ring((p - hh) * D, 200, 260) : 0); q.bow += 0.2 * K.sm(hu) * (1 - K.sm((p - 0.87) / 0.06)); q.lookx = w.H ? (w.H.sx || 0) : 0; q.looky = -0.5; q.brow = -0.3 * K.pulse(hu, 0, 1.2, 0.3); q.lunge = 0.5 * K.sm(hu) * (1 - K.sm((p - 0.87) / 0.06)); }
      if (p > 0.9) { const u = (p - 0.9) / 0.1; q.blink = Math.max(q.blink, 0.85 * K.pulse(u, 0.1, 1.2, 0.2)); q.smile = 1 + 0.9 * K.sm(u * 3); q.sq += 0.09 * Math.sin(u * PI * 2) * (1 - 0.4 * u); q.tilt = 0.18 * Math.sin(u * PI * 2); q.brow = 0.5; }
      return; }
    const b = K.cl((a - D) / B); q.swell = 0.065 * n * (1 - K.sm(b / 0.3)); q.turn = PI * K.sm(b / 0.2) + PI * K.sm((b - 0.8) / 0.2); q.sq = -0.1 * K.pulse(b, -0.05, 0.06, 0.05); q.sink = 0.46 * K.sm(b / 0.16) * (1 - K.back((b - 0.84) / 0.16)); q.e = 1 - K.sm((b - 0.1) / 0.76); const v = K.pulse(b, 0.12, 0.84, 0.2); q.bow = 0.16 * v; q.hair = 0.35 * v; q.pz = 1 + 0.2 * v; q.px = 1 - 0.07 * v; q.smile = 1.5; q.mv = v; q.armR = -1.1 * K.pulse(b, 0.04, 0.9, 0.12); q.armL = -0.5 * K.pulse(b, 0.04, 0.9, 0.12); },
  evo(S, t, o, q) { const K = RK, L = o.L, OUT = 2, n = t / L - OUT, END = 6.2, m = q.m = { body: 0, armL: 0, hair: 0, armR: 0, face: 0, pool: 0, from: o.from }; q.n = n; q.e = 0;
    if (t < 0) { const u = K.cl(1 + t / 420); q.sq = 0.1 * K.pulse(u, 0.0, 0.3, 0.12); q.sink = 0.95 * K.ei((u - 0.25) / 0.75); q.flat = K.sm((u - 0.5) / 0.45); return; }
    if (n < -0.55) { const u = t / ((OUT - 0.55) * L), v = Math.sin(PI * u); q.e = u * u * (3 - 2 * u); q.sink = 0.95; q.flat = 1; q.px = 1 + 0.3 * v; q.pz = 1 - 0.1 * v; q.hair = 0.5 * v; q.lean = 0.5 * v; q.mv = v; return; }
    if (n < END) { q.e = 1; const rs = K.back((n + 0.55) / 0.85); q.sink = 0.95 * (1 - Math.min(1, rs)); q.sq = 0.5 * Math.max(0, rs - 1); q.flat = 1 - K.sm((n + 0.55) / 0.3); q.big = K.sm((n + 0.4) / 0.8) * (1 - K.sm((n - END + 0.7) / 0.6));
      m.body = K.back((n - 1) / 0.8); m.armL = K.back((n - 2) / 0.85); m.hair = K.cl((n - 3) / 0.9); m.hair = m.hair * m.hair * (3 - 2 * m.hair) + 0.12 * (n > 3.9 ? K.ring((n - 3.9) * L, 300, 340) : 0); m.armR = K.back((n - 4) / 0.7); m.face = K.sm((n - 4.3) / 0.35); m.pool = K.back((n - 4.5) / 0.6);
      for (let b = 1; b <= 4; b++) { q.sq -= 0.09 * K.pulse(n, b - 0.32, b - 0.02, 0.1); if (n > b + 0.75) q.sq += 0.08 * K.ring((n - b - 0.75) * L, 280, 330); }
      q.sq += 0.16 * K.pulse(n, 1.05, 1.6, 0.2); q.lookx = -K.pulse(n, 1.8, 2.9, 0.2) + K.pulse(n, 3.9, 4.5, 0.15); q.hturn = -0.5 * K.pulse(n, 1.9, 2.9, 0.25) + 0.45 * K.pulse(n, 3.9, 4.5, 0.2) ; q.looky = -0.5 * K.pulse(n, 1.8, 4.5, 0.2) + 0.9 * K.pulse(n, 0.9, 1.6, 0.2); q.turn = -0.9 * K.pulse(n, 2.85, 3.95, 0.3); q.wide = 0.35 * (K.pulse(n, 0.9, 1.5, 0.15) + K.pulse(n, 2.9, 3.4, 0.15)); q.brow = 0.6 * K.pulse(n, 0.9, 4.2, 0.2);
      q.px = q.pz = 1 + 0.1 * (n > 3.85 ? K.ring((n - 3.85) * L, 380, 420) : 0); if (n > 4.7) { const u = n - 4.7; q.smile = 1 + 0.5 * K.sm(u * 2); q.blink = 0.8 * K.pulse(u, 0.3, 0.9, 0.2); } return; }
    const c = (n - END) / OUT; m.body = m.armL = m.hair = m.armR = m.face = m.pool = 1; q.sink = 0.95 * K.sm(c / 0.14) * (1 - Math.min(1, K.back((c - 0.84) / 0.16))); q.sq = 0.5 * Math.max(0, K.back((c - 0.84) / 0.16) - 1); q.flat = K.sm((c - 0.06) / 0.08) * (1 - K.sm((c - 0.82) / 0.06)); q.e = 1 - K.sm((c - 0.1) / 0.74); const v = K.pulse(c, 0.12, 0.84, 0.2); q.px = 1 + 0.3 * v; q.pz = 1 - 0.1 * v; q.hair = -0.5 * v; q.mv = v; q.home = c >= 1; q.done = c >= 1.12; }
};
const Q26 = { sink: 0, flat: 0, turn: 0, lean: 0, bow: 0, sq: 0, swell: 0, px: 1, pz: 1, nod: 0, tilt: 0, hturn: 0, hair: 0, armR: 0, armL: 0, rw: 0, rT: null, blink: 0, lookx: 0, looky: 0, wide: 0, smile: 1, open: 0, brow: 0, lidx: 0, e: 0, big: 0, n: 0, m: null, mv: 0, lunge: 0, home: false, done: false };
function play26(grp, clip, t, o) { const S = grp.userData.rig2.sp, G = S.G, J = G.J, nJ = J.length, C = C26[clip], K = RK, T = S.T; if (!C) return null; o = o || {};
  const dl = clip === 'rest' ? 0.14 : 70, QS = S.QS; for (let m = 0; m < 10; m++) { Object.assign(QS[m], Q26); C(S, t - m * dl, o, QS[m], clip === 'rest' ? m * 70 : 0); }
  const q = QS[0], L = (lg, k) => { const a = Math.min(8.999, lg), i = a | 0, f = a - i; return QS[i][k] + (QS[i + 1][k] - QS[i][k]) * f; }, P = S.P, Q = S.Q, F = S.Fs, m = q.m;
  let RP = S.RP, pm = [1, 1], MF = null; const mOf = Jj => (!m ? 1 : Jj.role === 'limb' ? (Jj.side > 0 ? m.armR : Jj.side < 0 ? m.armL : m.hair) : Jj.role === 'hair' ? m.hair : m.body);
  T26 = T; if (m && m.from && m.from !== S.st) { MF = S.MF[m.from] || (S.MF[m.from] = morph26(G, geo26(T, m.from))); RP = S.mp || (S.mp = J.map(() => [0, 0, 0])); J.forEach((Jj, j) => { const k = j ? mOf(Jj) : m.pool, a = MF.p[j], b = Jj.p; RP[j][0] = a[0] + (b[0] - a[0]) * k; RP[j][1] = a[1] + (b[1] - a[1]) * k; RP[j][2] = a[2] + (b[2] - a[2]) * k; S.RF[j] = MF.fat[j] + (1 - MF.fat[j]) * k; }); pm = [MF.pool[0] + (1 - MF.pool[0]) * m.pool, MF.pool[1] + (1 - MF.pool[1]) * m.pool]; } else if (S.mp) { for (let j = 0; j < nJ; j++) S.RF[j] = 1; }
  const s0 = Math.max(0, q.sink), px = q.px * pm[0] * (1 + 0.16 * s0), pz = q.pz * pm[1] * (1 + 0.16 * s0);
  for (let j = 0; j < nJ; j++) { const Jj = J[j], rf = S.RF[j]; if (!j) { P[0].set(RP[0][0], 0, RP[0][2]); Q[0].identity(); F[0].set(px, 1 + 1.5 * s0, pz); continue; }
    const lg = Jj.lag, pr = Jj.par, role = Jj.role; let rx = 0, ry = L(lg, 'turn') - L(J[pr].lag, 'turn'), rz = 0, len = 1, f = 1, fy = 1;
    if (role === 'spine') { const s = L(lg, 'sq'); rz = L(lg, 'lean') / G.nSp; rx = L(lg, 'bow') / G.nSp; len = 1 + s; fy = len; f = (1 + L(lg, 'swell')) / Math.sqrt(Math.max(0.3, len)); }
    else if (role === 'neck' || role === 'head') { const s = L(lg, 'sq'); rz = (q.tilt + 0.5 * L(lg, 'lean')) / G.nNk; rx = q.nod / G.nNk; ry += q.hturn / G.nNk; len = 1 + 0.5 * s; f = 1 + 0.3 * L(lg, 'swell') - 0.2 * s; fy = 1 + 0.3 * s; }
    else if (role === 'hair') { rz = (L(lg, 'hair') + 0.5 * L(lg, 'lean')) * 0.5; rx = 0.2 * L(lg, 'bow'); }
    else if (role === 'limb') { const a = Jj.side > 0 ? L(lg, 'armR') : Jj.side < 0 ? L(lg, 'armL') : 0.6 * L(lg, 'hair'); rz = (Jj.side || 1) * a * (Jj.i === 0 ? 1 : 0.3) + (Jj.i ? 0.3 * L(lg, 'lean') : 0); f = Jj.i ? 1 : 1 + L(lg, 'swell'); }
    Q[j].copy(Q[pr]); if (rx || ry || rz) Q[j].multiply(S.q.setFromEuler(S.e.set(rx, ry, rz)));
    S.v.set((RP[j][0] - RP[pr][0]) * len, (RP[j][1] - RP[pr][1]) * len, (RP[j][2] - RP[pr][2]) * len).applyQuaternion(Q[pr]); P[j].copy(P[pr]).add(S.v); F[j].set(f * rf, fy * rf, f * rf); }
  // an arm of water reaches for a point: its joints leave their places for an arc from the shoulder to the point; it thins as it lengthens
  S.rc = null; if (q.rw > 0 && q.rT) { S.root.updateWorldMatrix(true, false); const tg = S.root.worldToLocal(S.v2.set(q.rT.x, q.rT.y, q.rT.z)); let rc = G.reach[0]; G.reach.forEach(r => { if (r.side && r.side * tg.x > 0) rc = r; }); if (q.rs != null) rc = G.reach[q.rs] || rc;
    const jn = rc.jn, nn = jn.length - 1, A = P[jn[0]], d = S.v.copy(tg).sub(A), dist = d.length(), mx = rc.len * 2.1; if (dist > mx) { d.multiplyScalar(mx / dist); } const Ld = Math.min(dist, mx), w = q.rw;
    for (let k = 1; k <= nn; k++) { const s = k / nn, up = 0.22 * Ld * 4 * s * (1 - s), bx = A.x + d.x * s, by = A.y + d.y * s + up, bz = A.z + d.z * s; P[jn[k]].x += (bx - P[jn[k]].x) * w; P[jn[k]].y += (by - P[jn[k]].y) * w; P[jn[k]].z += (bz - P[jn[k]].z) * w; const th = Math.max(0.72, Math.min(1.15, Math.sqrt(rc.len / Math.max(0.01, Ld * 1.1)))), ff = 1 + (th - 1) * Math.min(1, w) + (k === nn ? 0.45 * Math.min(1, w) : 0); F[jn[k]].multiplyScalar(ff); }
    /* each joint turns to lie along the arm's new way, so the arm stays round */ for (let k = 1; k <= nn; k++) { const a = jn[k - 1], b = jn[k]; S.v.set(RP[b][0] - RP[a][0], RP[b][1] - RP[a][1], RP[b][2] - RP[a][2]).normalize(); S.v2.copy(P[b]).sub(P[a]).normalize(); Q[b].slerp(S.q.setFromUnitVectors(S.v, S.v2), Math.min(1, w)); } S.rc = rc; }
  // what is landed in the pool stays landed: a pinned tip keeps its place in the pool and the joints before it give
  G.pins.forEach(pn => { const jn = pn.jn, nn = jn.length - 1, tip = jn[nn], Jt = J[tip]; let w = m && !S.g28 ? (pn.body ? m.hair : pn.side > 0 ? m.armR : m.armL) : 1; if (S.rc && S.rc.jn === jn) w *= 1 - Math.min(1, q.rw); if (w <= 0) return; const dx = P[0].x + (Jt.p[0] - J[0].p[0]) * px - P[tip].x, dy = Jt.p[1] - P[tip].y, dz = P[0].z + (Jt.p[2] - J[0].p[2]) * pz - P[tip].z; for (let k = 1; k <= nn; k++) { const s = Math.pow(k / nn, 1.6) * Math.min(1, w); P[jn[k]].x += dx * s; P[jn[k]].y += dy * s; P[jn[k]].z += dz * s; } });
  // sinking: the body goes down through its own surface; what is under is spread flat inside the pool
  let under = 0; for (let j = 1; j < nJ; j++) { const rl = J[j].role, lb = rl === 'limb', s = L(J[j].lag * 0.3, 'sink') * (rl === 'hair' || rl === 'top' ? 0.93 : 1); if (s <= 0.001) continue; const ny = P[j].y - s * G.H * 1.04, u = K.sm(1 - ny / (0.1 * G.H)), u2 = u * u, w = lb ? 1 - 0.85 * u2 : (1 + 0.35 * u) * (1 - 0.6 * u2); P[j].y = Math.max(0.012, ny); F[j].x *= w; F[j].z *= w; F[j].y *= lb ? w : 1 - 0.94 * u2; P[j].x += (P[0].x - P[j].x) * 0.55 * u2; P[j].z += (P[0].z + 0.45 * G.pl.rz * q.mv - P[j].z) * 0.55 * u2; if (J[j].role === 'head') under = u; }
  for (let j = 0; j < nJ; j++) { const b = S.bones[j]; b.position.copy(P[j]); b.quaternion.copy(Q[j]); if (MF && MF.al[j]) { const k = 1 - Math.max(0, Math.min(1, mOf(J[j]))); if (k > 0.001) b.quaternion.multiply(S.q.identity().slerp(MF.al[j], k)); } b.scale.copy(F[j]); }
  S.tilt = grp.parent ? -grp.parent.rotation.x : 0; S.root.rotation.set(q.flat * S.tilt, q.turn, 0); S.root.updateWorldMatrix(true, false);
  const rc = S.rc || G.reach[0], tipJ = rc.jn[rc.jn.length - 1]; S.handW.copy(P[tipJ]).applyMatrix4(S.root.matrixWorld); S.headW.copy(P[G.bj[G.R.head]]).applyMatrix4(S.root.matrixWorld); S.bodyW.copy(P[G.bj[G.R.chest]]).applyMatrix4(S.root.matrixWorld); S.under = under; S.q0 = q;
  // the face
  const Fc = S.F, f = Fc.f, show = 1 - K.sm((under - 0.35) / 0.4), mf = m ? m.face : 1, ff = MF && MF.face, lp = (a, b) => a + (b - a) * mf;
  if (f) { const lid0 = ff ? lp(ff.lid || 0, f.lid || 0) : f.lid || 0, esc = ff ? lp((ff.k || 1) * (ff.er || 1) / ((f.k || 1) * (f.er || 1)), 1) : 1, lid = Math.max(lid0, q.lidx);
    Fc.eyes.forEach((e, i) => { const g = e.g, bl = Math.min(1, q.blink), er = e.er; g.visible = show > 0.02; g.position.copy(g.userData.p0); g.position.x += 0.35 * er * q.lookx; g.position.y += 0.3 * er * q.looky; const sc = esc * show * (1 + 0.22 * q.wide); g.scale.set(sc, sc * (1 - 0.88 * bl), sc); e.lid.visible = lid > 0.02; e.lid.position.y = 2.5 * er * (1 - lid); e.gl.position.set(er * (-0.3 + 0.25 * q.lookx), er * (lid > 0.2 ? -0.35 : 0.45) + 0.2 * er * q.looky, er * 0.42); e.gl.visible = bl < 0.6; });
    Fc.brows.forEach(b => { const g = b.g; g.visible = show > 0.5; g.position.copy(g.userData.p0); g.position.y += 0.06 * (f.k || 1) * q.brow; g.quaternion.copy(g.userData.q0).multiply(S.q.setFromEuler(S.e.set(0, 0, -b.s * 0.25 * q.brow))); });
    if (Fc.mouth) { const g = Fc.mouth, op = q.open > 0.5 && Fc.om, mo = Fc.mo, fm = ff && ff.mouth, wx = fm && !fm.o && !mo.o ? lp(fm.w * (ff.k || 1) / (mo.w * (f.k || 1)), 1) : 1, wy = fm && !fm.o && !mo.o ? lp(fm.d * (ff.k || 1) / (mo.d * (f.k || 1)), 1) : 1; g.visible = show > 0.5 && !op; g.scale.set(wx * (1 + 0.15 * (q.smile - 1)), wy * q.smile, 1); if (Fc.om) { Fc.om.visible = show > 0.5 && !!op; const s = 0.6 + 0.6 * q.open; Fc.om.scale.set(s, s, 1); } } }
  if (S.marks) { S.marks.material.opacity = mf * show; S.marks.visible = mf * show > 0.03; }
  // the wet margin, loose drops, drips: on a slow clock of their own
  const amb = (typeof performance !== 'undefined' ? performance.now() : 0) / 500 * (S.jar ? 0.6 : 1), out = 1 - K.sm(s0 / 0.3);
  if (S.wet) { S.wet.scale.set(S.wet.userData.s[0] * px, S.wet.userData.s[1] * pz, 1); }
  S.drops.forEach(dp => { const g = dp.g, d = dp.d, r = d[3]; if (!dp.air) { g.visible = out > 0.05 && !q.flat && !q.turn; g.position.set(d[0], r * 0.3, d[2]); return; } const pj = P[dp.j], u = K.mod(amb / (5 + dp.n % 3) + dp.n * 0.37, 1); g.visible = out > 0.05;
    if (S.st === 5) { const a = amb * 0.12 + dp.n / 10 * 2 * PI; g.position.set(P[G.bj[G.R.chest]].x + 2.35 * Math.cos(a), pj.y + dp.off[1] + 0.3 * Math.cos(a * 2 + dp.n), 1.5 * Math.sin(a)); g.scale.set(out, 1.35 * out, out); }
    else if (dp.off[1] >= 0) { const k = 1 + 0.5 * Math.sin(amb * 0.8 + dp.n * 2); g.position.set(pj.x + dp.off[0] * k, pj.y + dp.off[1] * k, pj.z + dp.off[2]); const s = out * (0.7 + 0.3 * Math.sin(amb * 0.8 + dp.n * 2)); g.scale.set(s, 1.35 * s, s); }
    else { const s = out * (u < 0.15 ? u / 0.15 : u > 0.9 ? (1 - u) / 0.1 : 1); g.position.set(pj.x + dp.off[0], Math.max(0.03, pj.y + dp.off[1] * (0.3 + 2.2 * u * u)), pj.z + dp.off[2]); g.scale.set(s, 1.5 * s, s); } });
  S.drips.forEach(dp => { const pj = P[dp.j], per = 6.5 + 2.3 * dp.n, u = K.mod(amb / per + dp.n * 0.41, 1), g = dp.g, hang = K.sm(u / 0.35), fall = K.cl((u - 0.4) / 0.25), y = pj.y - G.cell * (0.6 + 0.6 * hang) - fall * fall * pj.y; g.visible = out > 0.5 && u < 0.66 && y > 0.02 && under < 0.3; g.position.set(pj.x, y, pj.z); const s = 0.4 + 0.6 * hang; g.scale.set(s, s * (1.2 + 0.8 * fall), s); });
  if (S.mat.userData.u) S.mat.userData.u.w = amb * 1.3;
  return { e: q.e, y: 0, lunge: q.lunge, n: q.n, big: q.big, done: q.done, home: q.home }; }
// wired in as the game's Water: build('homwater') gives the spirit at its stage; rigPlay plays it
KIT.spiritOn = KIT.spiritOn == null ? true : KIT.spiritOn;
KIT.spiritBuild = function (T, grp, extra) { if (KIT.spiritOn !== false && T && T.SkinnedMesh && grp && grp.add && !(extra && extra.push)) { try { const st = Math.max(1, Math.min(5, (extra && extra.stage) | 0 || (extra && extra.jar ? 2 : 3))), g = fig26(T, st, extra); grp.add(g.children[0]); grp.userData.rig2 = g.userData.rig2; grp.userData.rig2.sp.grp = grp; grp.userData.water24 = g.userData.water24; return true; } catch (e) { KIT.spiritErr = String(e && e.stack); } } return false; };
KIT.rigPlay = (f0 => function (grp, clip, t, o) { const Rg = grp && grp.userData && grp.userData.rig2; return Rg && Rg.spirit ? play26(grp, clip, t, o) : f0(grp, clip, t, o); })(KIT.rigPlay);
KIT.spirit26 = { fig: fig26, geo: geo26, play: play26, C: C26, W: W26 };
// ==== W26 END
// ==== W27 BEGIN
// (builder 27) THE WATER SPIRIT BELONGS TO THE SCENE (AA.rxKit.belong27, on by default; false gives builder 26's look back).
// Drawn like the atoms: a lit MeshStandardMaterial with the atoms' roughness and metalness, so the page's own lamp shades it and puts one
// soft highlight on it (the cut gloss bands are gone); the blues are toned toward the page; the depth colours are soft, not stepped; the
// ink line is the skin itself pushed out along its skinned normal by a width given in WORLD units (thin and even at any size; the atoms'
// outline colour). Standing in the scene: the pool joint is turned back so the pool lies flat on its surface while the figure stands at
// the tilt every standing thing on the bench has. The turn that shows its back is slower and made fully risen.
KIT.belong27 = KIT.belong27 == null ? !(typeof location !== 'undefined' && /[?&]b27=0/.test(String(location.search))) : KIT.belong27;
const C27 = { mid: 0x4f83bd, deep: 0x2e5a96, lite: 0x9dc2df, pool: 0x6291c3, hi: 0xeef4f2, foam: 0xf3f1e6, ink: 0x22252c };
function mat27(T, o) {
  const v3 = h => { const c = new T.Color(h).convertSRGBToLinear(); return 'vec3(' + c.r.toFixed(4) + ',' + c.g.toFixed(4) + ',' + c.b.toFixed(4) + ')'; };
  const m = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.08 }), u = new T.Vector4(o.hp || 1.5, o.rings || 2, o.frho || 0.3, 0); m.extensions = { derivatives: true }; m.skinning = true; m.userData.u = u;
  const frag = ['{', 'vec3 c5 = mix(' + v3(C27.deep) + ', ' + v3(C27.mid) + ', smoothstep(0.4, 2.6, vWa.z));',                                   // darker where deep: the foot, soft
    'c5 = mix(c5, ' + v3(C27.lite) + ', 0.7 * smoothstep(0.25, 0.75, vWb.x));',                                                                  // paler where thin
    'vec3 p5 = ' + v3(C27.pool) + '; float rho = vWa.y; p5 = mix(' + v3(C27.mid) + ', p5, smoothstep(w25u.z * 0.9, w25u.z * 1.7, rho));',          // the pool is deeper round the foot
    'p5 = mix(p5, ' + v3(C27.lite) + ', 0.45 * A25(sin(rho * 6.2832 * w25u.y + 1.0 - w25u.w), 0.93));',                                          // one faint ripple ring, moving
    'p5 = mix(p5, ' + v3(C27.hi) + ', 0.12 * A25(rho, 0.86) * (1.0 - A25(rho, 0.93)));',                                                         // the rim's thin light
    'c5 = mix(c5, p5, A25(vWa.x, 0.5)); c5 = mix(c5, ' + v3(C27.foam) + ', A25(vWa.w, 0.5)); diffuseColor.rgb *= c5;', '}'].join('\n');
  m.onBeforeCompile = sh => { sh.uniforms.w25u = { value: u };
    sh.vertexShader = sh.vertexShader.replace('void main() {', 'attribute vec4 w25a;\nattribute vec2 w25b;\nvarying vec4 vWa;\nvarying vec2 vWb;\nvoid main() {\n\tvWa = w25a; vWb = w25b;');
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'uniform vec4 w25u;\nvarying vec4 vWa;\nvarying vec2 vWb;\nfloat A25(float v, float t) { float w = max(fwidth(v), 1e-5) * 0.75; return smoothstep(t - w, t + w, v); }\nvoid main() {').replace('#include <color_fragment>', frag); };
  m.customProgramCacheKey = () => 'w27'; return m; }
function hull27(T) { const u = { value: 0.03 }, m = new T.MeshBasicMaterial({ color: new T.Color(C27.ink).convertSRGBToLinear(), side: T.BackSide, skinning: true }); m.userData.w = u;
  m.onBeforeCompile = sh => { sh.uniforms.w27 = u; sh.vertexShader = sh.vertexShader.replace('void main() {', 'uniform float w27;\nvoid main() {').replace('#include <skinning_vertex>', '#include <skinning_vertex>\n#ifdef USE_SKINNING\n\tmat4 sm27 = skinWeight.x * boneMatX + skinWeight.y * boneMatY + skinWeight.z * boneMatZ + skinWeight.w * boneMatW;\n\ttransformed += normalize((bindMatrixInverse * sm27 * bindMatrix * vec4(normal, 0.0)).xyz) * w27;\n#endif'); };
  m.customProgramCacheKey = () => 'h27'; return m; }
fig26 = (f0 => function (T, stage, ex) { const grp = f0(T, stage, ex); if (KIT.belong27 === false) return grp; try { const S = grp.userData.rig2.sp, m = mat27(T, S.G.o);
    S.body.material = m; S.mat = m; S.hull.visible = false; const h = new T.SkinnedMesh(S.G.geo, hull27(T)); h.bind(S.body.skeleton, new T.Matrix4()); h.frustumCulled = false; h.userData.plain = true; S.root.add(h); S.hull27 = h; if (S.wet) S.wet.visible = false;
    S.b27 = true; S.x27 = new T.Vector3(1, 0, 0); S.y27 = new T.Vector3(0, 1, 0); S.q2 = new T.Quaternion(); S.s27 = new T.Vector3(); play27(grp, 'rest', 0, { jar: S.jar }); } catch (e) { KIT.spiritErr = String(e && e.stack); } return grp; })(fig26);
const play27 = (f0 => function (grp, clip, t, o) { const r = f0(grp, clip, t, o), S = grp.userData.rig2.sp; if (!S.b27) return r;
    /* the pool lies flat on what it is on, whatever the figure's tilt */ { const q0 = S.q0 || {}, b0 = S.bones[0].quaternion, tn = q0.turn || 0; S.q.setFromAxisAngle(S.y27, tn); b0.copy(S.q).conjugate(); b0.multiply(S.q2.setFromAxisAngle(S.x27, (1 - (q0.flat || 0)) * (S.tilt || 0))).multiply(S.q); }
    /* the ink line keeps its width in the world, not the figure's */ const sc = S.s27.setFromMatrixScale(S.root.matrixWorld).x || 1; S.hull27.material.userData.w.value = (KIT.ink27 == null ? 0.05 : KIT.ink27) / sc; return r; })(play26);
play26 = play27; KIT.spirit26.play = play27; KIT.spirit26.fig = fig26;
C26.act = (f0 => function (S, t, o, q) { f0(S, t, o, q); if (KIT.belong27 === false) return; const a = t - o.W - o.J - o.D; if (!(a > 0)) return; const K = RK, b = K.cl(a / o.B);
  /* it turns its back standing tall, then goes down and home; turns again at home */ q.turn = PI * K.sm(b / 0.3) + PI * K.sm((b - 0.82) / 0.18); q.sink = 0.46 * K.sm((b - 0.3) / 0.14) * (1 - K.back((b - 0.84) / 0.16)); q.e = 1 - K.sm((b - 0.3) / 0.56); const v = K.pulse(b, 0.32, 0.84, 0.16); q.bow = 0.16 * v; q.hair = 0.35 * v; q.pz = 1 + 0.2 * v; q.px = 1 - 0.07 * v; q.mv = v; })(C26.act);
// ==== W27 END
// ==== W28 BEGIN
// (builder 28) THE WATER SPIRIT'S HAND, ITS POOL AS A FILM, ITS CHANGE OF STAGE (AA.rxKit.react28, on by default; ?r28=0 gives builder 27 back).
// The pool is a thin film: the body's own material no longer draws the pool; a second skinned draw of the same skin on the same joints draws only
// the pool, transparent (deeper round the foot, a bright rim, one soft glint), and the ink hull is cut away under it, so wood grain, ruled lines,
// its shadow and the wet marks show through. A reaching arm ends in a HAND (palm, thumb, three fingers; lit like the body, the same ink line) that
// closes round a water and lies flat on the molecule; the water it holds is a lit drop that goes into the palm, a bulge runs down the arm and the
// body swells. The torso turns so the reaching arm is on the side of what it reaches for (the arm does not cross the body). The change of stage
// starts on the TRUE skin of the old stage (it sinks as itself); the new skin takes over while both are a flat puddle on the move; face and pool
// have beats of their own.
KIT.react28 = KIT.react28 == null ? !(typeof location !== 'undefined' && /[?&]r28=0/.test(String(location.search))) : KIT.react28;
Q26.w28 = null; Q26.grip = 0; Q26.hf = 0;
const H28 = { geo: null };
function hand28(T, S) { const lin = h => new T.Color(h).convertSRGBToLinear(), geo = H28.geo || (H28.geo = new T.SphereGeometry(1, 14, 10)), mat = new T.MeshStandardMaterial({ color: lin(0x7fabd3), roughness: 0.3, metalness: 0.08 }), ink = new T.MeshBasicMaterial({ color: lin(C27.ink), side: T.BackSide }), grp = new T.Group(), parts = [];
  const part = (par, sx, sy, sz, x, y, z, mt) => { const m = new T.Mesh(geo, mt || mat), h = new T.Mesh(geo, ink); m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.add(h); m.frustumCulled = h.frustumCulled = false; m.castShadow = h.castShadow = false; h.userData.plain = true; par.add(m); const p = { m, h, s: [sx, sy, sz] }; parts.push(p); return p; };
  part(grp, 1.1, 0.5, 1.15, 0, 0, 0.75);
  const fingers = [-0.72, 0, 0.72].map(x => { const pv = new T.Group(); pv.position.set(x, 0, 1.6 - 0.2 * Math.abs(x)); part(pv, 0.34, 0.34, 0.74, 0, 0, 0.5); grp.add(pv); return pv; });
  const thumb = new T.Group(); part(thumb, 0.37, 0.37, 0.68, 0, 0, 0.45); grp.add(thumb);
  /* the water in its hand: a lit drop */ const dg = new T.Group(), dp = part(dg, 1, 1, 1, 0, 0, 0, new T.MeshStandardMaterial({ color: lin(0x6c9dd0), roughness: 0.1, metalness: 0.08 }));
  grp.visible = dg.visible = false; S.root.add(grp); S.root.add(dg);
  return { grp, fingers, thumb, parts, dg, dp, x: new T.Vector3(), y: new T.Vector3(), z: new T.Vector3(), m: new T.Matrix4(), v: new T.Vector3(), v2: new T.Vector3() }; }
fig26 = (f0 => function (T, stage, ex) { const grp = f0(T, stage, ex); if (KIT.react28 === false) return grp; try { const S = grp.userData.rig2.sp; if (!S.b27) return grp;
    /* the body no longer draws its pool; the ink hull is cut away under the pool */ const m = S.mat, ob = m.onBeforeCompile; m.onBeforeCompile = sh => { ob(sh); sh.fragmentShader = sh.fragmentShader.replace('diffuseColor.rgb *= c5;', 'diffuseColor.rgb *= c5; if (A25(vWa.x, 0.5) * (1.0 - A25(vWa.w, 0.5)) > 0.5) discard;'); }; m.customProgramCacheKey = () => 'w28';
    const hm = S.hull27.material, oh = hm.onBeforeCompile; hm.onBeforeCompile = sh => { oh(sh); sh.vertexShader = sh.vertexShader.replace('void main() {', 'attribute vec4 w25a;\nvarying vec2 vH28;\nvoid main() {\n\tvH28 = w25a.xy;'); sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'varying vec2 vH28;\nvoid main() {\n\tif (vH28.x > 0.5 && vH28.y < 0.93) discard;'); }; hm.customProgramCacheKey = () => 'h28';
    /* the pool: the same skin drawn once more, only the pool, as a film */ const pl = S.G.pl, fm = mat27(T, S.G.o), of = fm.onBeforeCompile; fm.transparent = true; fm.depthWrite = false; fm.roughness = 0.12;
    fm.onBeforeCompile = sh => { of(sh); sh.uniforms.w25u = { value: S.mat.userData.u }; sh.vertexShader = sh.vertexShader.replace('void main() {', 'varying vec2 vP28;\nvoid main() {\n\tvP28 = vec2((position.x - (' + pl.x.toFixed(4) + ')) / ' + pl.rx.toFixed(4) + ', (position.z - (' + pl.z.toFixed(4) + ')) / ' + pl.rz.toFixed(4) + ');');
      sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'varying vec2 vP28;\nvoid main() {').replace('diffuseColor.rgb *= c5;', 'if (A25(vWa.x, 0.5) * (1.0 - A25(vWa.w, 0.5)) <= 0.5) discard; float gl28 = exp(-dot(vP28 - vec2(-0.42, -0.4), vP28 - vec2(-0.42, -0.4)) / 0.035); c5 = mix(c5, vec3(0.93, 0.95, 0.93), 0.75 * gl28 + 0.55 * smoothstep(0.86, 0.97, vWa.y)); diffuseColor.rgb *= c5; diffuseColor.a *= clamp(mix(mix(0.92, 0.3, smoothstep(w25u.z * 0.9, w25u.z * 2.6, vWa.y)), 0.82, smoothstep(0.86, 0.97, vWa.y)) + 0.6 * gl28, 0.0, 1.0);'); }; fm.customProgramCacheKey = () => 'f28_' + stage;
    const film = new T.SkinnedMesh(S.G.geo, fm); film.bind(S.body.skeleton, new T.Matrix4()); film.frustumCulled = false; film.castShadow = false; film.renderOrder = 4; film.userData.plain = true; S.root.add(film); S.film28 = film;
    S.x28 = hand28(T, S); } catch (e) { KIT.spiritErr = String(e && e.stack); } return grp; })(fig26);
/* which way the torso turns so that the arm on the side of the thing reaches for it */
function turn28(S, tg) { const par = S.root.parent; if (!par) return 0; par.updateWorldMatrix(true, false); const v = par.worldToLocal(S.v2.set(tg.x, tg.y, tg.z)), ph = Math.atan2(v.x - S.root.position.x, v.z - S.root.position.z), s = ph >= -0.15 ? 1 : -1; return Math.max(-1.25, Math.min(1.25, ph - s * 1.05)); }
C26.act = (f0 => function (S, t, o, q) { f0(S, t, o, q); if (KIT.react28 === false || !S.x28) return; const K = RK, w = (o.bites && o.bites.w26) || {}, a = t - o.W - o.J, D = o.D; if (!(a > 0 && a < D)) return;
  const p = a / D, TG = w.T || [], n = TG.length, hit = w.hitU || 0.7, g0 = 0.17, gw = (hit - 0.08 - g0) / Math.max(1, n);
  for (let i = 0; i < n; i++) { const u = (p - g0 - i * gw) / gw; if (u > 0 && u < 1) { q.w28 = { T: TG[i], u }; q.grip = K.sm((u - 0.38) / 0.12) * (1 - K.sm((u - 0.6) / 0.14)); } const dn = (p - g0 - (i + 0.9) * gw) * D; if (dn > 0) q.swell += 0.12 * K.ring(dn, 300, 360); }
  if (w.H && q.rT === w.H && q.rw > 0) q.hf = 1;
  if (q.rw > 0 && q.rT) q.turn = turn28(S, q.rT) * K.sm(q.rw * 1.4); })(C26.act);
C26.evo = (f0 => function (S, t, o, q) { f0(S, t, o, q); if (KIT.react28 === false || !q.m) return; const K = RK, n = q.n, m = q.m; if (n >= -0.55 && n < 6.2) { /* the face and the pool each have a beat of their own */ m.face = K.sm((n - 4.9) / 0.45); m.pool = K.back((n - 5.5) / 0.6); } })(C26.evo);
const play28 = (f0 => function (grp, clip, t, o) { const S = grp.userData.rig2.sp, X = S.x28, K = RK; let r;
  if (X && clip === 'evo' && o && o.from && o.from !== S.st && !S.g28) { /* the old stage's own skin sinks; the new one takes over as a flat puddle on the move */ const tS = 0.55 * o.L; let E = S.e28;
    if (t < tS && grp.parent) { if (!E || E.from !== o.from) { const gg = fig26(S.T, o.from, { stage: o.from }); gg.userData.rig2.sp.g28 = true; grp.parent.add(gg); E = S.e28 = { gg, from: o.from }; } E.gg.visible = true; E.gg.position.copy(grp.position); E.gg.quaternion.copy(grp.quaternion); E.gg.scale.copy(grp.scale); S.root.visible = false; r = f0(grp, clip, t, o); play26(E.gg, clip, t, o); return r; }
    if (E) { if (E.gg.parent) E.gg.parent.remove(E.gg); S.e28 = null; } S.root.visible = true;
    /* a piece the old stage does not have (the pour from its hand, a ribbon) stays a thread until its own beat */ r = f0(grp, clip, t, o); const m = (S.q0 || {}).m; if (m) { const N = S.nc28 || (S.nc28 = {}), Gf = geo26(S.T, o.from), L = N[o.from] || (N[o.from] = S.G.J.map((q, j) => (j && q.role === 'limb' && (!q.side || !Gf.chains.some(c => c.kind === 'limb' && c.side === q.side)) ? q.side || 0 : null))); L.forEach((sd, j) => { if (sd == null) return; const k = Math.max(0, Math.min(1, sd > 0 ? m.armR : sd < 0 ? m.armL : m.hair)), f = 0.03 + 0.97 * k * k; S.bones[j].scale.multiplyScalar(f); }); } }
  else r = f0(grp, clip, t, o);
  if (!X) return r; const q = S.q0 || {}, rc = S.rc, w = rc && q.rw > 0 ? Math.min(1, q.rw * 1.6) : 0, sc = (S.s27 && S.s27.x) || 1, ink = (KIT.ink27 == null ? 0.05 : KIT.ink27) / sc; X.grp.visible = w > 0.03; X.dg.visible = false; if (!(w > 0.03)) return r;
  const jn = rc.jn, nn = jn.length - 1, P = S.P, tip = P[jn[nn]]; /* the arm swings out round its own side, not across the body */ { const A = P[jn[0]], dx = tip.x - A.x, dz = tip.z - A.z, dl = Math.hypot(dx, dz) || 1, sg = (dz / dl) * (rc.side || 1) >= 0 ? 1 : -1, nx = sg * dz / dl, nz = -sg * dx / dl, am = 0.3 * dl * Math.min(1, q.rw); for (let k = 1; k < nn; k++) { const s = k / nn, f = am * 4 * s * (1 - s); P[jn[k]].x += nx * f; P[jn[k]].z += nz * f; S.bones[jn[k]].position.copy(P[jn[k]]); } }
  const hr = Math.max(2.2 * S.G.J[jn[nn]].r, 0.06 * S.G.H) * w, sd = rc.side || 1, hf = q.hf || 0, gr = q.grip || 0;
  /* the hand lies along the end of the arm, palm down; flat on the molecule it lies level */ X.z.copy(tip).sub(P[jn[nn - 1]]); X.z.y *= 1 - 0.9 * hf; if (X.z.lengthSq() < 1e-8) X.z.set(0, 0, 1); X.z.normalize(); X.x.set(0, 1, 0).cross(X.z); if (X.x.lengthSq() < 1e-6) X.x.set(1, 0, 0); X.x.normalize(); X.y.copy(X.z).cross(X.x); X.m.makeBasis(X.x, X.y, X.z); X.grp.quaternion.setFromRotationMatrix(X.m);
  X.grp.position.copy(tip).addScaledVector(X.z, -0.5 * hr); X.grp.scale.setScalar(hr); X.fingers.forEach((f, i) => { f.rotation.x = 0.12 + 1.45 * gr - 0.1 * hf + 0.06 * Math.sin(t / 130 + i * 2) * (1 - gr); }); X.thumb.position.set(sd * 0.95, 0, 0.55); X.thumb.rotation.set(0.9 * gr, sd * (1.0 - 0.75 * gr), 0);
  const dl = ink * w * w / Math.max(1e-4, hr); X.parts.forEach(pt => { if (pt !== X.dp) pt.h.scale.set(1 + dl / pt.s[0], 1 + dl / pt.s[1], 1 + dl / pt.s[2]); });
  const W = q.w28; if (W) { const u = W.u, g = K.sm((u - 0.26) / 0.14) * (1 - K.sm((u - 0.56) / 0.13)); if (g > 0.02) { S.root.updateWorldMatrix(true, false); const lt = S.root.worldToLocal(X.v.set(W.T.x, W.T.y, W.T.z)), palm = X.v2.copy(X.grp.position).addScaledVector(X.z, 0.8 * hr).addScaledVector(X.y, -0.35 * hr), k = K.sm((u - 0.4) / 0.1), dr = (0.6 / sc) * g, wob = 0.07 * Math.sin(t / 90);
      X.dg.visible = true; X.dg.position.copy(lt).lerp(palm, k); X.dg.scale.set(dr * (1 + wob), dr * (1 - wob), dr * (1 + wob)); const d2 = ink * g * g / Math.max(1e-4, dr); X.dp.h.scale.setScalar(1 + d2); }
    /* the water goes down the arm as a bulge */ const ub = (u - 0.58) / 0.34; if (ub > 0 && ub < 1) { const sb = 1 - ub, en = Math.sin(PI * Math.min(1, ub * 1.15)); for (let k = 1; k <= nn; k++) { const d = (k / nn - sb) / 0.2, f = 1 + 0.85 * en * Math.exp(-d * d), b = S.bones[jn[k]]; b.scale.x *= f; b.scale.z *= f; } } }
  return r; })(play26);
play26 = play28; KIT.spirit26.play = play28; KIT.spirit26.fig = fig26;
// ==== W28 END
// ==== W29 BEGIN
// (builder 29) THREE LOOKS FOR THE WATER SPIRIT, AS STILLS (AA.rxKit.style29 = 'a' | 'b' | 'c'; unset = the game's own look, which is not changed).
//  a: like the bench things. Clear water: what is behind it is read back from the frame (one copy of the picture so far, taken as the body
//     is about to be drawn) and bent by the surface's turn; a faint blue-green that deepens at the rim; the lamp's own highlight and the
//     room's reflection added; a light meniscus round the pool; no ink line; the face is darker water seen through the surface.
//  b: like the page. A pen line of the page's ink (uneven in width), a flat blue wash that pools at the edges and leaves the paper bare in
//     the lights, pencil hatching in the shade, no lamp shading at all. Off the paper it has the paper's colour behind it, as a cut-out.
//  c: like the atoms. The atoms' own material (roughness 0.3, metalness 0.08) in one muted blue, opaque, the hydrogens' outline, plain dark face marks.
// The switch is read every time the figure is played, so it can be thrown while the game runs. Only materials and draw order are changed.
KIT.style29 = KIT.style29 == null ? ((typeof location !== 'undefined' && (/[?&]s29=([abc])/.exec(String(location.search)) || [])[1]) || null) : KIT.style29;
const W29 = { U: null, tex: typeof WeakMap !== 'undefined' ? new WeakMap() : null, C: { c: 0x4f6d9b, pen: 0x2b2420, paper: 0xf2ede0 } };
const N29 = 'float H29(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\nfloat N29(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(H29(i), H29(i + vec2(1.0, 0.0)), f.x), mix(H29(i + vec2(0.0, 1.0)), H29(i + vec2(1.0, 1.0)), f.x), f.y); }\n';
const F29 = { a: ['{ vec3 n9 = normalize(normal); float f9 = 1.0 - clamp(dot(n9, normalize(vViewPosition)), 0.0, 1.0);',
    'float pl = step(0.5, vW29.x) * (1.0 - step(0.5, vW29.w)), rho = vW29.y;',
    'vec2 o9 = -n9.xy * vec2(r29.y / r29.x, 1.0) * (0.012 + 0.075 * f9 * f9) * (1.0 - 0.8 * pl);',                                 // the bend: more toward the rim, as a lens
    'vec3 bg = texture2D(t29, gl_FragCoord.xy / r29 + o9).rgb;',
    'vec3 tint = mix(vec3(0.90, 0.965, 0.95), vec3(0.50, 0.69, 0.70), smoothstep(0.25, 1.0, f9)); tint = mix(tint, vec3(0.87, 0.94, 0.93), pl);',
    'vec3 c9 = bg * tint; c9 = mix(c9, vec3(0.66, 0.84, 0.86), (0.16 + 0.22 * f9 * f9) * (1.0 - 0.5 * pl));',                        // a little of its own colour, so it is water and not glass
    'c9 += vec3(0.30, 0.33, 0.32) * smoothstep(0.2, 0.8, dot(n9.xy, vec2(0.62, -0.62))) * smoothstep(0.3, 0.75, f9) * (1.0 - smoothstep(0.86, 1.0, f9)) * (1.0 - pl);', // the lamp gathered on the far side
    'c9 *= 1.0 - 0.38 * smoothstep(0.80, 1.0, f9) * (1.0 - pl);',                                              // the dark rim of clear water
    'c9 += gl_FragColor.rgb * mix(1.3, 0.6, pl) + vec3(0.40, 0.39, 0.36) * pow(max(dot(n9, normalize(vec3(-0.5, 0.62, 0.6))), 0.0), 9.0) * (1.0 - pl);',                                                                                  // the lamp and the room on its surface
    'c9 = mix(c9, vec3(0.97, 0.98, 0.95), 0.5 * pl * smoothstep(0.85, 0.92, rho) * (1.0 - smoothstep(0.94, 0.985, rho)));',         // the meniscus
    'c9 *= 1.0 - 0.3 * pl * smoothstep(0.95, 0.995, rho);', 'gl_FragColor = vec4(c9, 1.0); }'].join('\n'),
  b: ['{ vec3 n9 = normalize(normal); float nv = clamp(dot(n9, normalize(vViewPosition)), 0.0, 1.0);',
    'float pl = step(0.5, vW29.x) * (1.0 - step(0.5, vW29.w)), rho = vW29.y, s9 = r29.y / 800.0; vec2 p9 = gl_FragCoord.xy / s9;',
    'float nz = N29(p9 * 0.035), nz2 = N29(p9 * 0.11 + 7.0), gr = N29(p9 * 0.9);',
    'vec3 bg = texture2D(t29, gl_FragCoord.xy / r29).rgb; float lum = dot(bg, vec3(0.3, 0.59, 0.11));',
    'vec3 base = mix(PAPER29, bg, smoothstep(0.60, 0.74, lum));',                                                                   // on paper it is on the paper; off it, a cut-out
    'float l9 = dot(n9, normalize(vec3(-0.6, 0.62, 0.5)));',
    'float hl = smoothstep(0.86, 0.90, l9 + 0.12 * (nz - 0.5)) * (1.0 - pl);',                                                      // paper left bare in the lights
    'float ed = mix(smoothstep(0.45, 0.95, 1.0 - nv + 0.3 * (nz - 0.5)), smoothstep(0.55, 0.95, rho + 0.2 * (nz - 0.5)), pl);',     // the wash pools at the edges
    'vec3 wash = mix(vec3(0.63, 0.79, 0.93), vec3(0.31, 0.50, 0.76), ed);',
    'float a9 = (1.0 - hl) * (0.78 + 0.22 * nz2) * (0.93 + 0.07 * gr) * mix(1.0, 0.75, pl);',
    'vec3 c9 = base * mix(vec3(1.0), wash, a9);',
    'float sh = smoothstep(0.38, 0.02, l9) * (1.0 - pl), hx = abs(fract((p9.x + p9.y) / 5.5 + 0.4 * nz2) - 0.5);',                 // pencil hatching in the shade
    'c9 = mix(c9, vec3(0.35, 0.335, 0.305), 0.72 * (1.0 - smoothstep(0.09, 0.2, hx)) * sh * (0.4 + 0.6 * gr));',
    'float e9 = nv / max(fwidth(nv), 1e-4) / s9, w9 = 1.5 * (0.5 + 1.0 * nz2);',                                                    // the pen line where the surface turns away
    'c9 = mix(c9, PEN29, 0.92 * (1.0 - smoothstep(w9 - 0.6, w9 + 0.6, e9)) * (1.0 - pl));', 'gl_FragColor = vec4(c9, 1.0); }'].join('\n') };
function u29(T) { if (!W29.U) { const t = new T.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1, T.RGBAFormat); W29.U = { t29: { value: t }, r29: { value: new T.Vector2(1, 1) } }; W29.v2 = new T.Vector2(); } return W29.U; }
/* the picture so far, read back for the body to bend (a) or to lie on (b) */
function grab29(T, ren) { const U = u29(T); if (!ren || !ren.copyFramebufferToTexture || !W29.tex || ren.getRenderTarget()) return; const sz = ren.getDrawingBufferSize(W29.v2); let t = W29.tex.get(ren);
  if (!t || t.image.width !== sz.x || t.image.height !== sz.y) { if (t) t.dispose(); t = new T.DataTexture(new Uint8Array(sz.x * sz.y * 3), sz.x, sz.y, T.RGBFormat) /* the canvas has no alpha: the copy must be RGB */; t.minFilter = t.magFilter = T.LinearFilter; t.generateMipmaps = false; W29.tex.set(ren, t); }
  U.t29.value = t; U.r29.value.set(sz.x, sz.y); ren.copyFramebufferToTexture(W29.v2.set(0, 0), t); }
function mat29(T, st, skin) { const U = u29(T), v3 = h => { const c = new T.Color(h); return 'vec3(' + c.r.toFixed(4) + ',' + c.g.toFixed(4) + ',' + c.b.toFixed(4) + ')'; };
  const m = new T.MeshStandardMaterial(st === 'a' ? { color: 0x000000, roughness: 0.24, metalness: 0 } : { color: 0x000000, roughness: 1, metalness: 0 }); m.skinning = !!skin; m.transparent = true; m.extensions = { derivatives: true };
  m.onBeforeCompile = sh => { sh.uniforms.t29 = U.t29; sh.uniforms.r29 = U.r29;
    sh.vertexShader = sh.vertexShader.replace('void main() {', (skin ? 'attribute vec4 w25a;\n' : '') + 'varying vec4 vW29;\nvoid main() {\n\tvW29 = ' + (skin ? 'w25a' : 'vec4(0.0)') + ';');
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'uniform sampler2D t29;\nuniform vec2 r29;\nvarying vec4 vW29;\n#define PAPER29 ' + v3(W29.C.paper) + '\n#define PEN29 ' + v3(W29.C.pen) + '\n' + N29 + 'void main() {').replace('#include <dithering_fragment>', F29[st] + '\n#include <dithering_fragment>'); };
  m.customProgramCacheKey = () => 's29' + st + (skin ? 's' : 'n'); return m; }
/* the pen's outer line for b: the skin pushed out, by a width that wanders as a hand's does */
function hull29(T, S) { const u = S.hull27.material.userData.w, m = new T.MeshBasicMaterial({ color: new T.Color(W29.C.pen).convertSRGBToLinear(), side: T.BackSide, skinning: true });
  m.onBeforeCompile = sh => { sh.uniforms.w27 = u; sh.vertexShader = sh.vertexShader.replace('void main() {', 'uniform float w27;\nattribute vec4 w25a;\nvarying vec2 vH28;\nvoid main() {\n\tvH28 = w25a.xy;').replace('#include <skinning_vertex>', '#include <skinning_vertex>\n#ifdef USE_SKINNING\n\tmat4 sm27 = skinWeight.x * boneMatX + skinWeight.y * boneMatY + skinWeight.z * boneMatZ + skinWeight.w * boneMatW;\n\ttransformed += normalize((bindMatrixInverse * sm27 * bindMatrix * vec4(normal, 0.0)).xyz) * w27 * (0.62 + 0.5 * sin(position.x * 9.0 + 2.0 * sin(position.y * 6.3)) * sin(position.y * 10.0 + position.z * 5.0));\n#endif');
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'varying vec2 vH28;\nvoid main() {\n\tif (vH28.x > 0.5 && vH28.y < 0.93) discard;'); }; m.customProgramCacheKey = () => 'h29'; return m; }
function set29(T, S, st) { const lin = h => new T.Color(h).convertSRGBToLinear(), C = W29.C;
  if (!S.o29) { const lids = new Set(((S.F && S.F.eyes) || []).map(e => e.lid)), L = []; S.root.traverse(m => { if (!m.isMesh || m === S.hull || m === S.wet) return; const mt = m.material; let k = null;
      if (m === S.body) k = 'body'; else if (m === S.hull27) k = 'hull'; else if (m === S.film28) k = 'film'; else if (m === S.marks) k = 'marks'; else if (!mt) k = null;
      else if (mt.isMeshBasicMaterial && mt.side === T.BackSide) k = 'ink'; else if (mt.isMeshBasicMaterial && mt.color.r + mt.color.g + mt.color.b < 0.2) k = 'face'; else if (mt.isMeshBasicMaterial) k = 'glint';
      else if (mt.isMeshToonMaterial) k = lids.has(m) ? 'lid' : 'drop'; else if (mt.isMeshStandardMaterial) k = 'hand'; if (k) L.push({ m, k, mt, ro: m.renderOrder }); }); S.o29 = L; S.m29 = {};
    S.body.onBeforeRender = function (ren) { if (S.st29 === 'a' || S.st29 === 'b') grab29(T, ren); }; }
  let M = st ? S.m29[st] : null; if (st && !M) { const none = new T.MeshBasicMaterial({ visible: false }), flat = h => new T.MeshBasicMaterial({ color: lin(h) }), std = (h, sk) => { const m = new T.MeshStandardMaterial({ color: lin(h), roughness: 0.3, metalness: 0.08 }); m.skinning = !!sk; return m; };
    if (st === 'a') { const eye = new T.MeshBasicMaterial({ color: lin(0x1f3f44), transparent: true, opacity: 0.6, depthWrite: false }), dr = new T.MeshStandardMaterial({ color: lin(0xd5e6e2), roughness: 0.12, metalness: 0, transparent: true, opacity: 0.5, depthWrite: false });
      M = { body: mat29(T, 'a', true), hull: none, film: none, marks: none, ink: none, face: eye, glint: none, lid: none, drop: dr, hand: mat29(T, 'a', false) }; }
    else if (st === 'b') M = { body: mat29(T, 'b', true), hull: hull29(T, S), film: none, marks: null, ink: new T.MeshBasicMaterial({ color: lin(C.pen), side: T.BackSide }), face: flat(C.pen), glint: flat(C.paper), lid: flat(0x9fc0dc), drop: mat29(T, 'b', false), hand: mat29(T, 'b', false) };
    else M = { body: std(C.c, true), hull: null, film: none, marks: none, ink: null, face: flat(0x22252c), glint: none, lid: std(C.c), drop: std(C.c), hand: std(C.c) };
    S.m29[st] = M; }
  S.o29.forEach(q => { const r = M && M[q.k]; if (r && q.k === 'hull') r.userData.w = q.mt.userData.w; /* play27 sets the line's width on whatever the hull wears */ q.m.material = r || q.mt; q.m.renderOrder = M && (st === 'a' || st === 'b') && (q.k === 'body' || q.k === 'hand' || q.k === 'drop') ? (q.k === 'body' ? 19 : 20) : st === 'a' && q.k === 'face' ? 21 : q.ro; });
  S.st29 = st || null; }
const play29 = (f0 => function (grp, clip, t, o) { const r = f0(grp, clip, t, o); try { const S = grp.userData.rig2.sp, st = KIT.style29 === 'a' || KIT.style29 === 'b' || KIT.style29 === 'c' ? KIT.style29 : null; if (S && S.b27 && S.x28 && (S.st29 || null) !== st) set29(S.T, S, st); } catch (e) { KIT.spiritErr = String(e && e.stack); } return r; })(play26);
play26 = play29; KIT.spirit26.play = play29; KIT.spirit26.set29 = set29;
// ==== W29 END
// ==== W30 BEGIN
// (builder 30) THE WATER SPIRIT IN PEN AND WASH (AA.rxKit.wash30, on by default; false or ?w30=0 gives builder 28's look back; style29 still wins when set).
// A RECIPE that any skinned creature can wear, in three parts:
//  1. THE PEN (pen30). Each frame the skin is worked out here as the graphics card works it out, its outline is found (the edges where the surface
//     turns away from the eye), the edges are joined into runs, and each run is written as ONE STROKE the way pen.js writes a stroke: a filled
//     ribbon whose width lands, holds and lifts (pen.js's own `press` for the thin weight, the same down-stroke swell, the same ink). The pen lifts
//     at places fixed on the body; the wobble is seeded by the body's own points, so it stays on the body, and is thrown again 7 times a second.
//     Rigid pieces (hand, drops) are outlined the same way. A few strokes are added by hand: flow lines, the spine and hair seen from behind, ripples.
//  2. THE WASH (mat30). No lamp. Blue wash multiplied on what is behind (the page with its ruled lines; off the page, paper colour: a cut-out),
//     uneven in the BODY'S OWN space: bare paper on the lit side with a broken edge, a second darker wash on the shadow side, darker where it pools
//     at the outline and low down, a bloom here and there, gaps inside the line; pencil hatching in the shade, also in the body's own space.
//  3. THE MARGIN: the skin pushed out a little, drawn first: the wash running over the line in places, and off the page the cut-out's paper edge.
KIT.wash30 = KIT.wash30 == null ? !(typeof location !== 'undefined' && /[?&]w30=0/.test(String(location.search))) : KIT.wash30;
const W30 = { figs: [], scenes: typeof WeakSet !== 'undefined' ? new WeakSet() : null, sph: null, hz: 7, lw: 2.5, wob: 0.75, lift: 0.016, C: { pen: 0x2b2420, paper: 0xf2ede0, pencil: 0x5a564e }, m4: null, cost: 0 };
const h30 = n => { n = (n ^ 61) ^ (n >>> 16); n = Math.imul(n + (n << 3), 0x27d4eb2d); n ^= n >>> 15; n = Math.imul(n, 0x85ebca6b); n ^= n >>> 13; return (n >>> 0) / 4294967296; };
/* a mesh as the pen needs it: welded points, triangles, edges with the two faces they join */
function topo30(g) { const p = g.attributes.position, n = p.count, ix = g.index ? g.index.array : null, nt0 = (ix ? ix.length : n) / 3, map = new Map(), wid = new Int32Array(n), first = [];
  for (let i = 0; i < n; i++) { const k = Math.round(p.getX(i) * 2e4) + '_' + Math.round(p.getY(i) * 2e4) + '_' + Math.round(p.getZ(i) * 2e4); let w = map.get(k); if (w === undefined) { w = first.length; map.set(k, w); first.push(i); } wid[i] = w; }
  const nv = first.length, P = new Float32Array(nv * 3); first.forEach((i, w) => { P[3 * w] = p.getX(i); P[3 * w + 1] = p.getY(i); P[3 * w + 2] = p.getZ(i); });
  const tris = [], em = new Map(), E = [];
  for (let t = 0; t < nt0; t++) { const a = wid[ix ? ix[3 * t] : 3 * t], b = wid[ix ? ix[3 * t + 1] : 3 * t + 1], c = wid[ix ? ix[3 * t + 2] : 3 * t + 2]; if (a === b || b === c || a === c) continue; const ti = tris.length / 3; tris.push(a, b, c);
    [[a, b], [b, c], [c, a]].forEach(e => { const lo = Math.min(e[0], e[1]), hi = Math.max(e[0], e[1]), k = lo * nv + hi; let q = em.get(k); if (q === undefined) { em.set(k, E.length / 4); E.push(lo, hi, ti, -1); } else if (E[4 * q + 3] < 0) E[4 * q + 3] = ti; }); }
  const tp = { nv, P, first, tris: new Int32Array(tris), E: new Int32Array(E), ne: E.length / 4, nt: tris.length / 3 };
  if (g.attributes.skinIndex) { const si = g.attributes.skinIndex, sw = g.attributes.skinWeight; tp.SI = new Uint16Array(nv * 4); tp.SW = new Float32Array(nv * 4); first.forEach((i, w) => { tp.SI[4 * w] = si.getX(i); tp.SI[4 * w + 1] = si.getY(i); tp.SI[4 * w + 2] = si.getZ(i); tp.SI[4 * w + 3] = si.getW(i); tp.SW[4 * w] = sw.getX(i); tp.SW[4 * w + 1] = sw.getY(i); tp.SW[4 * w + 2] = sw.getZ(i); tp.SW[4 * w + 3] = sw.getW(i); }); }
  return tp; }
const src30 = (tp, o) => Object.assign({ tp, C: new Float32Array(tp.nv * 4), F: new Uint8Array(tp.nt), adj: new Int32Array(tp.nv * 4), deg: new Uint8Array(tp.nv), used: new Uint8Array(tp.ne), sil: new Int32Array(tp.ne), seed: 0 }, o);
const shown30 = (o, top) => { for (; o && o !== top; o = o.parent) if (!o.visible) return false; return true; };
/* the pen's line as one mesh: ribbons written straight in the picture's own frame */
function pen30(T, S) { const MAXV = 24000, g = new T.BufferGeometry(), pa = new T.BufferAttribute(new Float32Array(MAXV * 3), 3), ua = new T.BufferAttribute(new Float32Array(MAXV * 2), 2), ia = new T.BufferAttribute(new Uint16Array(MAXV * 3), 1);
  pa.usage = ua.usage = ia.usage = T.DynamicDrawUsage; g.setAttribute('position', pa); g.setAttribute('ua', ua); g.setIndex(ia); g.setDrawRange(0, 0);
  const c = new T.Color(W30.C.pen), m = new T.ShaderMaterial({ transparent: true, depthWrite: false, side: T.DoubleSide, uniforms: { col: { value: new T.Vector3(c.r, c.g, c.b) } },
    vertexShader: 'attribute vec2 ua;\nvarying vec2 vU;\nvoid main() { vU = ua; gl_Position = vec4(position, 1.0); }', fragmentShader: 'uniform vec3 col;\nvarying vec2 vU;\nvoid main() { gl_FragColor = vec4(col, clamp(vU.y + 0.5 - abs(vU.x), 0.0, 1.0)); }' });
  const mesh = new T.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 23; mesh.castShadow = false; mesh.userData.plain = true; mesh.userData.nobox = true; mesh.visible = false;
  if (!W30.sph) W30.sph = topo30(new T.SphereGeometry(1, 14, 10));
  const R = { mesh, pa, ua, ia, nv: 0, ni: 0, MAXV, body: src30(topo30(S.G.geo), { skin: true }), parts: new Map(), bm: null, X: [], Y: [], Z: [], Sd: [], tx: [], ty: [], tz: [], v: new T.Vector3(), v2: new T.Vector3(), v3: new T.Vector3(), boil: 0 };
  S.root.add(mesh); return R; }
/* where every point of a source is in the picture: x, y in pixels (y up), depth pulled a little toward the eye, w */
function proj30(R, s, VP, Wd, Ht, P10, P11, d, bones, inv) { const tp = s.tp, n = tp.nv, C = s.C, P = tp.P, e = VP;
  if (s.skin) { const nb = bones.length; let bm = R.bm; if (!bm || bm.length !== nb * 16) bm = R.bm = new Float32Array(nb * 16); const M = W30.m4;
    for (let j = 0; j < nb; j++) { M.multiplyMatrices(bones[j].matrixWorld, inv[j]).premultiply(R.vp); bm.set(M.elements, j * 16); }
    const SI = tp.SI, SW = tp.SW; for (let i = 0; i < n; i++) { const x = P[3 * i], y = P[3 * i + 1], z = P[3 * i + 2]; let cx = 0, cy = 0, cz = 0, cw = 0;
      for (let k = 0; k < 4; k++) { const w = SW[4 * i + k]; if (!w) continue; const o = SI[4 * i + k] * 16; cx += w * (bm[o] * x + bm[o + 4] * y + bm[o + 8] * z + bm[o + 12]); cy += w * (bm[o + 1] * x + bm[o + 5] * y + bm[o + 9] * z + bm[o + 13]); cz += w * (bm[o + 2] * x + bm[o + 6] * y + bm[o + 10] * z + bm[o + 14]); cw += w * (bm[o + 3] * x + bm[o + 7] * y + bm[o + 11] * z + bm[o + 15]); }
      const iw = cw > 1e-5 ? 1 / cw : 0, w2 = cw + P11 * d; C[4 * i] = (cx * iw * 0.5 + 0.5) * Wd; C[4 * i + 1] = (cy * iw * 0.5 + 0.5) * Ht; C[4 * i + 2] = w2 > 1e-5 ? (cz + P10 * d) / w2 : 2; C[4 * i + 3] = cw; } }
  else { const M = W30.m4.multiplyMatrices(R.vp, s.mesh.matrixWorld), b = M.elements; const rs = s.rs || 1; for (let i = 0; i < n; i++) { const x = P[3 * i] * rs, y = P[3 * i + 1] * rs, z = P[3 * i + 2] * rs, cx = b[0] * x + b[4] * y + b[8] * z + b[12], cy = b[1] * x + b[5] * y + b[9] * z + b[13], cz = b[2] * x + b[6] * y + b[10] * z + b[14], cw = b[3] * x + b[7] * y + b[11] * z + b[15];
      const iw = cw > 1e-5 ? 1 / cw : 0, w2 = cw + P11 * d; C[4 * i] = (cx * iw * 0.5 + 0.5) * Wd; C[4 * i + 1] = (cy * iw * 0.5 + 0.5) * Ht; C[4 * i + 2] = w2 > 1e-5 ? (cz + P10 * d) / w2 : 2; C[4 * i + 3] = cw; } } }
/* one stroke, as pen.js writes one: a run of points made a little unsteady, smoothed, and filled as an outline that lands, holds and lifts */
function stroke30(R, n, lw, sc, Wd, Ht, o) { const X = R.X, Y = R.Y, Z = R.Z, Sd = R.Sd, tx = R.tx, ty = R.ty, tz = R.tz, boil = R.boil, wb = W30.wob * sc * (o.wob == null ? 1 : o.wob), trim = (o.trim == null ? 0.5 : o.trim) * sc; if (n < 2) return;
  for (let i = 0; i < n; i++) { const s = Sd[i]; X[i] += ((h30(s * 31 + 7) - 0.5) * 1.3 + (h30(s * 131 + boil * 977 + 3) - 0.5) * 1.6) * wb; Y[i] += ((h30(s * 57 + 11) - 0.5) * 1.3 + (h30(s * 171 + boil * 1013 + 5) - 0.5) * 1.6) * wb; }
  for (let ps = 0; ps < (o.smooth == null ? 3 : o.smooth); ps++) { for (let i = 1; i < n - 1; i++) { tx[i] = (X[i - 1] + 2 * X[i] + X[i + 1]) / 4; ty[i] = (Y[i - 1] + 2 * Y[i] + Y[i + 1]) / 4; tz[i] = (Z[i - 1] + 2 * Z[i] + Z[i + 1]) / 4; } for (let i = 1; i < n - 1; i++) { X[i] = tx[i]; Y[i] = ty[i]; Z[i] = tz[i]; } }
  let L = 0; tx[0] = 0; for (let i = 1; i < n; i++) { L += Math.hypot(X[i] - X[i - 1], Y[i] - Y[i - 1]); tx[i] = L; } const Lu = L - 2 * trim; if (Lu < (o.min == null ? 6 : o.min) * sc) return;
  const step = Math.max(1.6, lw * 0.8), m = Math.max(2, Math.ceil(Lu / step) + 1), pa = R.pa.array, ua = R.ua.array, ia = R.ia.array, sm = x => x * x * (3 - 2 * x), s0 = Sd[0], ph = h30(s0 * 13 + 1) * 6.28, pad = 0.75; if (R.nv + 2 * m + 4 > R.MAXV) return;
  let j = 1, v0 = R.nv; const put = (px, py, pz, nx, ny, hw) => { const k = R.nv; pa[3 * k] = (px + nx * (hw + pad)) / Wd * 2 - 1; pa[3 * k + 1] = (py + ny * (hw + pad)) / Ht * 2 - 1; pa[3 * k + 2] = pz; ua[2 * k] = hw + pad; ua[2 * k + 1] = hw; pa[3 * k + 3] = (px - nx * (hw + pad)) / Wd * 2 - 1; pa[3 * k + 4] = (py - ny * (hw + pad)) / Ht * 2 - 1; pa[3 * k + 5] = pz; ua[2 * k + 2] = -(hw + pad); ua[2 * k + 3] = hw; R.nv += 2; };
  let lx = 0, ly = 0, lz = 0, ldx = 0, ldy = 0, lhw = 0;
  for (let q = 0; q < m; q++) { const s = trim + Lu * q / (m - 1); while (j < n - 1 && tx[j] < s) j++; const a = j - 1, f0 = (s - tx[a]) / Math.max(1e-6, tx[j] - tx[a]), px = X[a] + (X[j] - X[a]) * f0, py = Y[a] + (Y[j] - Y[a]) * f0, pz = Z[a] + (Z[j] - Z[a]) * f0;
    const a2 = Math.max(0, a - 1), b2 = Math.min(n - 1, j + 1); let dx = X[b2] - X[a2], dy = Y[b2] - Y[a2]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
    const f = q / (m - 1), r = Math.min(1, f / 0.22), e = Math.min(1, (1 - f) / 0.3), pr = (0.8 + 0.2 * sm(r)) * (0.55 + 0.45 * sm(e)), hw = Math.max(0.35, lw * 0.5 * pr * (1 - 0.1 * dy) * (0.9 + 0.16 * Math.sin(s / (9 * sc) + ph) + 0.08 * Math.sin(s / (3.1 * sc) + 2 * ph)));
    if (q === 0) put(px - dx * hw * 0.9, py - dy * hw * 0.9, pz, -dy, dx, hw * 0.3); put(px, py, pz, -dy, dx, hw); lx = px; ly = py; lz = pz; ldx = dx; ldy = dy; lhw = hw; }
  put(lx + ldx * lhw * 0.9, ly + ldy * lhw * 0.9, lz, -ldy, ldx, lhw * 0.3);
  for (let k = v0; k + 3 < R.nv; k += 2) { const i = R.ni; ia[i] = k; ia[i + 1] = k + 1; ia[i + 2] = k + 2; ia[i + 3] = k + 1; ia[i + 4] = k + 3; ia[i + 5] = k + 2; R.ni += 6; } }
/* the outline of one source: its edges where the surface turns from the eye, joined into runs, each run a stroke (the pen lifts at fixed places) */
function sil30(R, s, lw, sc, Wd, Ht) { const tp = s.tp, C = s.C, F = s.F, tr = tp.tris, E = tp.E, nt = tp.nt, ne = tp.ne, adj = s.adj, deg = s.deg, used = s.used, sil = s.sil, X = R.X, Y = R.Y, Z = R.Z, Sd = R.Sd; let ns = 0;
  for (let t = 0; t < nt; t++) { const a = tr[3 * t] * 4, b = tr[3 * t + 1] * 4, c = tr[3 * t + 2] * 4; F[t] = C[a + 3] > 1e-5 && C[b + 3] > 1e-5 && C[c + 3] > 1e-5 ? ((C[b] - C[a]) * (C[c + 1] - C[a + 1]) - (C[b + 1] - C[a + 1]) * (C[c] - C[a]) > 0 ? 1 : 0) : 2; }
  deg.fill(0); for (let e = 0; e < ne; e++) { const t0 = E[4 * e + 2], t1 = E[4 * e + 3], f0 = F[t0], f1 = t1 < 0 ? 0 : F[t1]; used[e] = 1; if (f0 === 2 || f1 === 2) continue; if (t1 < 0 ? f0 !== 1 : f0 === f1) continue; const a = E[4 * e], b = E[4 * e + 1]; if (deg[a] > 3 || deg[b] > 3) continue; adj[4 * a + deg[a]++] = e; adj[4 * b + deg[b]++] = e; used[e] = 0; sil[ns++] = e; }
  const seed = s.seed, lift = W30.lift, run = (v0, e0) => { let n = 0, v = v0, e = e0, px = 0, py = 0; X[0] = C[4 * v]; Y[0] = C[4 * v + 1]; Z[0] = C[4 * v + 2]; Sd[0] = seed + v; n = 1;
    for (;;) { used[e] = 1; const nx = E[4 * e] === v ? E[4 * e + 1] : E[4 * e]; px = C[4 * nx] - C[4 * v]; py = C[4 * nx + 1] - C[4 * v + 1]; v = nx; X[n] = C[4 * v]; Y[n] = C[4 * v + 1]; Z[n] = C[4 * v + 2]; Sd[n] = seed + v; n++;
      /* the pen lifts here */ if (n > 7 && h30((seed + v) * 7 + 3) < lift) { n--; break; } let best = -1, bd = -0.3; const pl = Math.hypot(px, py) || 1; for (let k = 0; k < deg[v]; k++) { const e2 = adj[4 * v + k]; if (used[e2]) continue; const o = E[4 * e2] === v ? E[4 * e2 + 1] : E[4 * e2], qx = C[4 * o] - C[4 * v], qy = C[4 * o + 1] - C[4 * v + 1], dd = (px * qx + py * qy) / (pl * (Math.hypot(qx, qy) || 1)); if (dd > bd) { bd = dd; best = e2; } } if (best < 0 || n > 1500) break; e = best; }
    stroke30(R, n, lw, sc, Wd, Ht, s.o || {}); };
  /* runs begin where a line ends or lifts, then whatever is left (closed rings begin at their own fixed place) */
  for (let ps = 0; ps < 3; ps++) for (let i = 0; i < ns; i++) { const e = sil[i]; if (used[e]) continue; const a = E[4 * e], b = E[4 * e + 1];
    if (ps === 0) { if (deg[a] === 1) run(a, e); else if (deg[b] === 1) run(b, e); } else if (ps === 1) { if (h30((seed + a) * 7 + 3) < lift) run(a, e); else if (h30((seed + b) * 7 + 3) < lift) run(b, e); } else run(a, e); } }
/* a stroke given as points in the world (flow lines, the spine, ripples) */
function free30(R, pts, lw, sc, Wd, Ht, P10, P11, d, seed, o) { const e = R.vp.elements; let n = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], cx = e[0] * p.x + e[4] * p.y + e[8] * p.z + e[12], cy = e[1] * p.x + e[5] * p.y + e[9] * p.z + e[13], cz = e[2] * p.x + e[6] * p.y + e[10] * p.z + e[14], cw = e[3] * p.x + e[7] * p.y + e[11] * p.z + e[15]; if (cw < 1e-5) return; R.X[n] = (cx / cw * 0.5 + 0.5) * Wd; R.Y[n] = (cy / cw * 0.5 + 0.5) * Ht; R.Z[n] = (cz + P10 * d) / (cw + P11 * d); R.Sd[n] = seed + i * 3; n++; } stroke30(R, n, lw, sc, Wd, Ht, o || {}); }
/* all of one figure's line for this frame */
function draw30(T, S, ren, cam) { const R = S.pen30, sz = ren.getDrawingBufferSize(W30.v2 || (W30.v2 = new T.Vector2())), Wd = sz.x, Ht = sz.y, sc = Ht / 720, pe = cam.projectionMatrix.elements, P10 = pe[10], P11 = pe[11];
  W30.m4 = W30.m4 || new T.Matrix4(); R.vp = (R.vp || new T.Matrix4()).multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); R.nv = 0; R.ni = 0; R.boil = Math.floor((typeof performance !== 'undefined' ? performance.now() : 0) * W30.hz / 1000);
  const G = S.G, ws = (S.s27 && S.s27.setFromMatrixScale(S.root.matrixWorld).x) || 1, Hw = G.H * ws, bones = S.bones, inv = S.body.skeleton.boneInverses, d = 0.03 * Hw;
  /* how tall it stands in the picture sets the pen's weight: the page's pen at its full size, a finer nib when it is small in its jar */ const v = R.v.setFromMatrixPosition(S.root.matrixWorld), u = R.v2.set(0, 1, 0).transformDirection(S.root.matrixWorld), e = R.vp.elements, pj = (x, y, z) => { const w = e[3] * x + e[7] * y + e[11] * z + e[15]; return [(e[0] * x + e[4] * y + e[8] * z + e[12]) / w * Wd / 2, (e[1] * x + e[5] * y + e[9] * z + e[13]) / w * Ht / 2]; }, a = pj(v.x, v.y, v.z), b = pj(v.x + u.x * Hw, v.y + u.y * Hw, v.z + u.z * Hw), rt = pj(v.x + cam.matrixWorld.elements[0] * Hw, v.y + cam.matrixWorld.elements[1] * Hw, v.z + cam.matrixWorld.elements[2] * Hw);
  const hpx = Math.max(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.6 * Math.hypot(rt[0] - a[0], rt[1] - a[1])), fs = Math.max(0.42, Math.min(1.7, hpx / (105 * sc))), lw = W30.lw * sc * fs, s2 = sc * Math.min(1.6, Math.max(0.5, fs)); R.lw = lw; R.hpx = hpx;
  R.body.o = { wob: Math.min(1.4, Math.max(0.5, fs)) }; proj30(R, R.body, R.vp, Wd, Ht, P10, P11, d, bones, inv); sil30(R, R.body, lw, s2, Wd, Ht);
  /* the hand and the drops: beads outlined by the same pen */ const part = (m, k, lk) => { if (!m || !shown30(m, S.root.parent)) return; let s = R.parts.get(m); if (!s) { s = src30(W30.sph, { mesh: m, rs: (m.geometry.parameters && m.geometry.parameters.radius) || 1, seed: 5000 + R.parts.size * 700, o: { smooth: 2, min: 3, wob: 0.6 } }); R.parts.set(m, s); } proj30(R, s, R.vp, Wd, Ht, P10, P11, d * (k || 0.4)); sil30(R, s, lw * (lk || 0.85), s2, Wd, Ht); };
  if (S.x28) { const X = S.x28; if (X.grp.visible) X.parts.forEach(p => { if (p !== X.dp) part(p.m, 0.5, 0.9); }); if (X.dg.visible) part(X.dp.m, 0.5, 0.8); }
  S.drops.forEach(dp => part(dp.g.children[0], 0.3, 0.7)); S.drips.forEach(dp => part(dp.g.children[0], 0.3, 0.6));
  /* strokes put in by hand, each tied to the joints */ const q0 = S.q0 || {}, J = G.J, bj = G.bj, Rr = G.R, cp = R.v3.setFromMatrixPosition(cam.matrixWorld), fw = R.v2.set(0, 0, 1).transformDirection(S.root.matrixWorld), jw = (j, out, side, tmp) => { const p = tmp.setFromMatrixPosition(bones[j].matrixWorld), tc = R.v.copy(cp).sub(p).normalize(), r = J[j].r * ws * Math.max(bones[j].scale.x, 0.2); p.addScaledVector(tc, r * out); if (side) { const sx = R.v.set(cam.matrixWorld.elements[0], cam.matrixWorld.elements[1], cam.matrixWorld.elements[2]); p.addScaledVector(sx, r * side); } return p; };
  const head = bones[bj[Rr.head]], hp = R.v.setFromMatrixPosition(head.matrixWorld), back = fw.dot(cp.clone().sub(hp).normalize()) < -0.25, up = (q0.sink || 0) < 0.45 && !(S.under > 0.3), pool = S.pts30 || (S.pts30 = Array.from({ length: 40 }, () => new T.Vector3()));
  if (up && lw > 1.2) { const line = (j0, j1, out, side, seed, o) => { let n = 0; for (let k = j0; k <= j1; k++) jw(bj[k], out, typeof side === 'function' ? side((k - j0) / Math.max(1, j1 - j0)) : side, pool[n++]); if (n >= 2) free30(R, pool.slice(0, n), lw * 0.8, s2, Wd, Ht, P10, P11, d, seed, o); }, ch = Rr.chest;
    if (back) { /* its back: a spine stroke, and the fall of the hair */ line(1, Math.max(2, Rr.neck), 1.0, t => 0.12 * Math.sin(t * 3.1), 9100, { smooth: 2, wob: 1.2 }); const hj = G.hairJ || []; if (hj.length > 2) { let n = 0; hj.forEach((j, i) => { if (i) jw(j, 1.0, -0.2, pool[n++]); }); free30(R, pool.slice(0, n), lw * 0.75, s2, Wd, Ht, P10, P11, d, 9200, { smooth: 2 }); }
      [[-0.55, 9250], [0.5, 9270]].forEach(q => { let n = 0; for (let k = Rr.neck; k <= Rr.head; k++) jw(bj[k], 1.0, q[0], pool[n++]); if (n >= 2) free30(R, pool.slice(0, n), lw * 0.65, s2, Wd, Ht, P10, P11, d, q[1], { smooth: 1, min: 3 }); }); }
    else { /* flow lines down its front */ if (ch >= 3) { line(1, Math.max(2, ch - 1), 1.0, t => 0.5 - 0.25 * t, 9300, { smooth: 2, wob: 1.2 }); line(Math.max(1, ch - 2), ch, 1.0, t => -0.55 + 0.2 * t, 9400, { smooth: 2, wob: 1.2, min: 4 }); } } }
  /* its pool: one or two ripple strokes that drift */ if (lw > 1.2 && G.pl) { const pl = G.pl, M0 = W30.m4.multiplyMatrices(bones[0].matrixWorld, inv[0]), tq = R.boil / W30.hz, arc = (rho, a0, len, seed) => { const n = 9; for (let i = 0; i < n; i++) { const th = a0 + len * i / (n - 1); pool[i].set(pl.x + pl.rx * rho * Math.cos(th), pl.h * 1.02, pl.z + pl.rz * rho * Math.sin(th)).applyMatrix4(M0); } free30(R, pool.slice(0, n), lw * 0.7, s2, Wd, Ht, P10, P11, d * 0.5, seed, { smooth: 1, wob: 0.6, min: 4 }); };
    arc(0.72, 0.5 + 0.12 * tq, 1.0, 9500); arc(0.55, 3.3 - 0.09 * tq, 0.8, 9600); }
  R.pa.needsUpdate = R.ua.needsUpdate = R.ia.needsUpdate = true; R.mesh.geometry.setDrawRange(0, R.ni); }
/* every figure in pen and wash has its line written before its scene is drawn */
function hook30(T, S) { let top = S.root; while (top.parent) top = top.parent; if (!top.isScene || !W30.scenes || W30.scenes.has(top)) return !!top.isScene; W30.scenes.add(top); const f0 = top.onBeforeRender;
  top.onBeforeRender = function (ren, scene, cam) { if (f0) f0.apply(this, arguments); for (let i = W30.figs.length - 1; i >= 0; i--) { const F = W30.figs[i]; let t2 = F.root; while (t2.parent) t2 = t2.parent; if (t2 !== scene) continue;
      if (!F.w30 || !shown30(F.root, null)) continue; try { draw30(T, F, ren, cam); } catch (e) { KIT.spiritErr = 'w30 ' + String(e && e.stack); } } }; return true; }
/* the wash: body ('b', skinned), margin ('m', the skin pushed out, drawn first), a rigid piece ('p') */
const N30 = 'float H30(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }\nfloat N30(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(H30(i), H30(i + vec3(1.0, 0.0, 0.0)), f.x), mix(H30(i + vec3(0.0, 1.0, 0.0)), H30(i + vec3(1.0, 1.0, 0.0)), f.x), f.y), mix(mix(H30(i + vec3(0.0, 0.0, 1.0)), H30(i + vec3(1.0, 0.0, 1.0)), f.x), mix(H30(i + vec3(0.0, 1.0, 1.0)), H30(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }\n';
const F30 = ['{ vec3 n9 = normalize(normal); float nv = clamp(dot(n9, normalize(vViewPosition)), 0.0, 1.0); vec3 bp = vB30;',
  'float pl = step(0.5, vW29.x) * (1.0 - step(0.5, vW29.w)), rho = vW29.y, s9 = r29.y / 720.0;',
  'float nz = N30(bp * 3.1), nz2 = N30(bp * 8.3 + 5.0), nz3 = N30(bp * 4.4 + 9.0), gr = N29(gl_FragCoord.xy / s9 * 0.9);',
  'vec3 bg = texture2D(t29, gl_FragCoord.xy / r29).rgb; float lum = dot(bg, vec3(0.3, 0.59, 0.11));',
  'vec3 base = mix(PAPER29 * (0.985 + 0.03 * gr), bg, smoothstep(0.60, 0.74, lum));',                                                                // on paper it is on the paper; off it, a cut-out
  'float l9 = dot(n9, normalize(vec3(-0.6, 0.62, 0.5)));',
  '#ifdef MARGIN30', 'float a9 = (1.0 - smoothstep(0.30, 0.36, nz3)) * (0.75 + 0.25 * nz2) * step(l9, 0.35); vec3 wash = vec3(0.60, 0.76, 0.92);', '#else',
  'float hl = smoothstep(0.80, 0.87, l9 + 0.42 * (nz - 0.5)) * (1.0 - pl);',                                                                         // the paper left bare on the lit side, with a broken edge
  'hl = max(hl, smoothstep(0.84, 0.88, nz2) * smoothstep(0.1, 0.4, l9) * (1.0 - pl));',                                                              // and a few bare specks
  'hl = max(hl, pl * smoothstep(0.72, 0.78, N30(vec3(vP30 * 2.3, 1.0))) * (1.0 - smoothstep(0.8, 0.9, rho)));',                                      // the pool keeps a glint of paper
  'float low = smoothstep(0.42, 0.02, bp.y);',
  'float ed = mix(clamp(smoothstep(0.45, 0.95, 1.0 - nv + 0.3 * (nz - 0.5)) + 0.45 * low, 0.0, 1.0), smoothstep(0.50, 0.97, rho + 0.25 * (nz - 0.5)), pl);', // it pools at the outline and low down
  'float s2 = smoothstep(0.12, -0.14, l9 + 0.3 * (nz - 0.5)) * (1.0 - pl);',                                                                          // the second wash, on the shadow side
  'float bl = N30(bp * 2.1 + 3.0), ring = smoothstep(0.640, 0.662, bl) * (1.0 - smoothstep(0.668, 0.70, bl)), inb = smoothstep(0.66, 0.70, bl);',  // a bloom: paler inside, a dark crinkled edge
  'vec3 wash = mix(vec3(0.64, 0.80, 0.945), vec3(0.40, 0.59, 0.84), ed); wash = mix(wash, vec3(0.36, 0.52, 0.78), 0.62 * s2); wash = mix(wash, vec3(1.0), 0.3 * inb); wash *= 1.0 - 0.16 * ring;',
  'float a9 = (1.0 - hl) * (0.80 + 0.20 * nz2) * (0.93 + 0.07 * gr) * mix(1.0, 0.86, pl);',
  'a9 *= 1.0 - (1.0 - pl) * smoothstep(0.64, 0.70, nz3) * smoothstep(0.42, 0.22, nv);', '#endif',                                                    // here the wash stops short of the line
  'vec3 c9 = base * mix(vec3(1.0), wash, a9);',
  '#ifndef MARGIN30', '{ float sh = smoothstep(0.02, -0.26, l9 + 0.2 * (nz - 0.5)) * (1.0 - pl), hh = dot(bp, vec3(0.74, 0.62, 0.26)) * HATCH30 + 0.35 * nz, hd = abs(fract(hh) - 0.5) / max(fwidth(hh), 1e-4);', // pencil hatching in the shade, in the body's own space
  'float hm = smoothstep(0.30, 0.42, N30(bp * 5.3 + 2.0)); c9 = mix(c9, PENCIL30, 0.5 * (1.0 - smoothstep(0.35, 1.05 * s9, hd)) * sh * hm * (0.45 + 0.55 * gr)); }', '#endif',
  'gl_FragColor = vec4(c9, 1.0); }'].join('\n');
function mat30(T, kind, o) { o = o || {}; const U = u29(T), v3 = h => { const c = new T.Color(h); return 'vec3(' + c.r.toFixed(4) + ',' + c.g.toFixed(4) + ',' + c.b.toFixed(4) + ')'; }, skin = kind !== 'p', pl = o.pl;
  const m = new T.MeshStandardMaterial({ color: 0x000000, roughness: 1, metalness: 0 }); m.skinning = skin; m.transparent = true; m.extensions = { derivatives: true }; if (kind === 'm') { m.side = T.BackSide; m.userData.w = o.w; }
  m.onBeforeCompile = sh => { sh.uniforms.t29 = U.t29; sh.uniforms.r29 = U.r29; if (kind === 'm') sh.uniforms.w27 = m.userData.w;
    sh.vertexShader = sh.vertexShader.replace('void main() {', (skin ? 'attribute vec4 w25a;\n' : '') + (kind === 'm' ? 'uniform float w27;\n' : '') + 'varying vec4 vW29;\nvarying vec3 vB30;\nvarying vec2 vP30;\nvoid main() {\n\tvW29 = ' + (skin ? 'w25a' : 'vec4(0.0)') + '; vB30 = position * ' + (o.k || 1).toFixed(5) + ' + vec3(' + (o.off || 0).toFixed(3) + '); vP30 = ' + (pl ? 'vec2((position.x - (' + pl.x.toFixed(4) + ')) / ' + pl.rx.toFixed(4) + ', (position.z - (' + pl.z.toFixed(4) + ')) / ' + pl.rz.toFixed(4) + ')' : 'vec2(0.0)') + ';');
    if (kind === 'm') sh.vertexShader = sh.vertexShader.replace('#include <skinning_vertex>', '#include <skinning_vertex>\n#ifdef USE_SKINNING\n\tmat4 sm27 = skinWeight.x * boneMatX + skinWeight.y * boneMatY + skinWeight.z * boneMatZ + skinWeight.w * boneMatW;\n\ttransformed += normalize((bindMatrixInverse * sm27 * bindMatrix * vec4(normal, 0.0)).xyz) * w27 * 1.5;\n#endif');
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'uniform sampler2D t29;\nuniform vec2 r29;\nvarying vec4 vW29;\nvarying vec3 vB30;\nvarying vec2 vP30;\n#define PAPER29 ' + v3(W30.C.paper) + '\n#define PENCIL30 ' + v3(W30.C.pencil) + '\n#define HATCH30 ' + (o.hatch || 22).toFixed(2) + '\n' + (kind === 'm' ? '#define MARGIN30\n' : '') + N29 + N30 + 'void main() {').replace('#include <dithering_fragment>', F30 + '\n#include <dithering_fragment>'); };
  m.customProgramCacheKey = () => 's30' + kind + (o.key || ''); return m; }
function set30(T, S, on) { const lin = h => new T.Color(h).convertSRGBToLinear();
    if (!S.o29) set29(T, S, 'b');
  if (!S.m30) { const none = new T.MeshBasicMaterial({ visible: false }), flat = h => new T.MeshBasicMaterial({ color: lin(h) }), G = S.G, k = 1 / G.H, key = '_' + S.st; let pi = 0;
    S.m30 = { body: mat30(T, 'b', { k, pl: G.pl, key }), hull: mat30(T, 'm', { k, pl: G.pl, key, w: S.hull27.material.userData.w }), film: none, marks: none, ink: none, face: flat(W30.C.pen), glint: flat(W30.C.paper), lid: flat(0x9fc0dc), drop: () => mat30(T, 'p', { k: 0.3, off: 3 + 1.7 * (pi++ % 4), hatch: 7, key: 'p' + (pi % 4) }), hand: () => mat30(T, 'p', { k: 0.3, off: 11 + 1.7 * (pi++ % 4), hatch: 7, key: 'h' + (pi % 4) }) };
    S.pen30 = pen30(T, S); }
  const M = S.m30; S.o29.forEach(q => { let r = M[q.k]; if (typeof r === 'function') r = q.m30 || (q.m30 = r()); q.m.material = r || q.mt; q.m.renderOrder = q.k === 'hull' ? 20 : q.k === 'body' ? 19 : q.k === 'hand' || q.k === 'drop' ? 20 : q.k === 'face' || q.k === 'lid' ? 21 : q.k === 'glint' ? 22 : q.ro; });
  S.w30 = true; S.pen30.mesh.visible = true; if (W30.figs.indexOf(S) < 0) W30.figs.push(S); }
/* BOLDER ACTING, as a drawn thing can act: each water is an anticipation (it pulls back, squashes, eyes wide), a snap out past the mark, a HELD pose
   while the hand closes (eyes squeezed, brows down), a snap home with the water going down the arm, and a pleased curl. The torso turns first. */
C26.act = (f0 => function (S, t, o, q) { f0(S, t, o, q); if (KIT.wash30 === false || !S.x28) return; const K = RK, w = (o.bites && o.bites.w26) || {}, a = t - o.W - o.J, D = o.D, B = o.B;
  if (a > 0 && a < D) { const p = a / D, W = q.w28, hit = w.hitU || 0.7, n = (w.T || []).length, gw = (hit - 0.08 - 0.17) / Math.max(1, n);
    if (W) { const u = W.u, sd = (W.T.sx || 0) >= 0 ? 1 : -1, ant = K.pulse(u, -0.02, 0.13, 0.05), out = K.pulse(u, 0.14, 0.6, 0.05), sq = K.pulse(u, 0.36, 0.58, 0.05), ms = (u - 0.62) * gw * D;
      q.rw = u < 0.12 ? 0 : u < 0.26 ? K.back((u - 0.12) / 0.14) : u < 0.6 ? 1 : 1 - K.sm((u - 0.6) / 0.2); q.grip = K.sm((u - 0.34) / 0.08) * (1 - K.sm((u - 0.64) / 0.1));
      q.turn = turn28(S, W.T) * K.sm(u / 0.13) * (1 - K.sm((u - 0.74) / 0.22));
      q.sq += -0.2 * ant + 0.16 * K.pulse(u, 0.13, 0.3, 0.05) - 0.07 * sq + (ms > 0 ? 0.16 * K.ring(ms, 200, 240) : 0); q.lean += sd * (-0.22 * ant + 0.2 * out); q.bow += 0.2 * out - 0.1 * ant; q.hair += 0.5 * ant - 0.4 * K.pulse(u, 0.14, 0.34, 0.06) + (ms > 0 ? 0.45 * K.ring(ms, 260, 300) : 0);
      q.wide = Math.max(q.wide, 0.95 * K.pulse(u, -0.05, 0.3, 0.06)); q.brow = 0.9 * K.pulse(u, -0.05, 0.3, 0.06) - 1.1 * sq + 0.6 * K.pulse(u, 0.68, 1.05, 0.08); q.blink = Math.max(q.blink * (1 - ant), 0.9 * sq); q.open = K.pulse(u, 0.0, 0.33, 0.05); q.smile = 1 - 0.75 * sq + 0.9 * K.pulse(u, 0.66, 1.05, 0.07); q.tilt += sd * 0.2 * K.pulse(u, 0.68, 1.0, 0.08); q.armL += 0.5 * ant * (sd > 0 ? 1 : 0); q.armR += 0.5 * ant * (sd > 0 ? 0 : 1); }
    /* its hand on the molecule: a wind-up, then the pose held */ const hh = w.hand || hit, h0 = hh - 0.075, hu = (p - h0) / 0.075; if (p > h0 - 0.03 && p < 0.93) { const pre = K.pulse(hu, -0.45, 0.05, 0.12), hold = K.sm(hu / 0.8) * (1 - K.sm((p - 0.87) / 0.06)); q.sq += -0.16 * pre + 0.12 * hold; q.brow = Math.min(q.brow, -0.9 * hold + 0.5 * pre); q.wide = Math.max(q.wide, 0.6 * pre); q.hair += 0.4 * pre - 0.35 * hold; q.smile = 1 - 0.5 * hold; if (w.H && q.rT === w.H) q.turn = turn28(S, w.H) * K.sm(q.rw * 1.6); }
    return; }
  if (a >= D) { const b = K.cl((a - D) / B), hop = K.pulse(b, 0.0, 0.1, 0.04); /* a pleased hop before it turns; the hair swings round late */ q.sq += 0.18 * hop - 0.1 * K.pulse(b, 0.1, 0.18, 0.03); q.hair += 0.5 * K.pulse(b, 0.05, 0.3, 0.1) - 0.4 * K.pulse(b, 0.82, 1.0, 0.06); q.lean += 0.18 * K.pulse(b, 0.1, 0.3, 0.08); q.tilt = 0.2 * hop; q.wide = 0.4 * hop; } })(C26.act);
const play30 = (f0 => function (grp, clip, t, o) { const S = grp.userData.rig2.sp, was = S && S.w30; if (was) S.st29 = null; const r = f0(grp, clip, t, o); try { /* the reaching arm swings wide of its own body */ const q = S.q0 || {}, rc = S.rc; if (KIT.wash30 !== false && S.x28 && rc && q.rw > 0.03) { const jn = rc.jn, nn = jn.length - 1, P = S.P, A = P[jn[0]], tip = P[jn[nn]], dx = tip.x - A.x, dz = tip.z - A.z, dl = Math.hypot(dx, dz) || 1, sg = (dz / dl) * (rc.side || 1) >= 0 ? 1 : -1, am = 0.34 * dl * Math.min(1, q.rw); for (let k = 1; k < nn; k++) { const u = k / nn, f = am * 4 * u * (1 - u) * (1 - 0.5 * u); P[jn[k]].x += sg * dz / dl * f; P[jn[k]].z += -sg * dx / dl * f; S.bones[jn[k]].position.copy(P[jn[k]]); } }
    /* at a change of stage the new stage's own pieces (a cupped hand, a long fall of hair) stay small until their beat */ const m = q.m; if (KIT.wash30 !== false && clip === 'evo' && m && m.from && m.from !== S.st && S.root.visible) { const cl = x => Math.max(0, Math.min(1, x)); S.G.chains.forEach(c => { if (c.kind !== 'limb') return; const k = cl(c.side > 0 ? m.armR : c.side < 0 ? m.armL : m.hair); if (k > 0.995) return; const nn = c.jn.length; for (let i = Math.max(1, nn - 3); i < nn; i++) S.bones[c.jn[i]].scale.multiplyScalar(0.1 + 0.9 * k * k); }); const hj = S.G.hairJ || [], kh = cl(m.hair); if (kh < 0.995) for (let i = hj.length >> 1; i < hj.length; i++) S.bones[hj[i]].scale.multiplyScalar(0.25 + 0.75 * kh * kh); }
    const want = KIT.wash30 !== false && !KIT.style29 && S && S.b27 && S.x28; if (want) { if (!S.w30) set30(S.T, S, true); S.st29 = 'b'; if (!S.hk30) S.hk30 = hook30(S.T, S); }
    else if (was) { S.w30 = false; S.pen30.mesh.visible = false; if (!KIT.style29) set29(S.T, S, null); } } catch (e) { KIT.spiritErr = 'w30 ' + String(e && e.stack); } return r; })(play26);
/* stage 1 is the shy droplet: when it ducks it still peeks over its puddle (it used to go right under, leaving a pool and a wisp) */
C26.rest = (f0 => function (S, t, o, q, lagMs) { f0(S, t, o, q, lagMs); if (KIT.wash30 !== false && S.st === 1 && q.sink > 0.36) { const ov = q.sink - 0.36; q.sink = 0.36 + 0.12 * Math.min(1, ov / 0.44) + 0.15 * (o.spent || 0); q.wide = Math.max(q.wide, 0.5); q.brow = Math.max(q.brow, 0.6); } })(C26.rest);
/* the shelf jar holds the same spirit, small (it was the old pushed form at every stage) */
KIT.spiritBuild = (f0 => function (T, grp, extra) { if (KIT.wash30 !== false && extra && extra.push && extra.jar) return f0(T, grp, { jar: true, stage: extra.stage, ink: extra.ink }); return f0(T, grp, extra); })(KIT.spiritBuild);
play26 = play30; KIT.spirit26.play = play30; KIT.spirit26.W30 = W30;
// ==== W30 END
})(typeof globalThis !== 'undefined' ? globalThis : window);
