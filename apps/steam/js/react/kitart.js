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
  const c = new T.Color(W30.C.pen), m = new T.ShaderMaterial({ transparent: !S.jar, depthWrite: false, side: T.DoubleSide, uniforms: { col: { value: new T.Vector3(c.r, c.g, c.b) } },
    vertexShader: 'attribute vec2 ua;\nvarying vec2 vU;\nvoid main() { vU = ua; gl_Position = vec4(position, 1.0); }', fragmentShader: 'uniform vec3 col;\nvarying vec2 vU;\nvoid main() { gl_FragColor = vec4(col, clamp(vU.y + 0.5 - abs(vU.x), 0.0, 1.0));' + (S.jar ? ' if (gl_FragColor.a < 0.3) discard; gl_FragColor.a = 1.0;' : '') + ' }' });
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
  top.onBeforeRender = function (ren, scene, cam) { if (f0) f0.apply(this, arguments); if (KIT.skip33) return; for (let i = W30.figs.length - 1; i >= 0; i--) { const F = W30.figs[i]; let t2 = F.root; while (t2.parent) t2 = t2.parent; if (t2 !== scene) continue;
      if (!F.w30 || !shown30(F.root, null)) continue; try { draw30(T, F, ren, cam); } catch (e) { KIT.spiritErr = 'w30 ' + String(e && e.stack); } } }; return true; }
/* the wash: body ('b', skinned), margin ('m', the skin pushed out, drawn first), a rigid piece ('p') */
const N30 = 'float H30(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }\nfloat N30(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(H30(i), H30(i + vec3(1.0, 0.0, 0.0)), f.x), mix(H30(i + vec3(0.0, 1.0, 0.0)), H30(i + vec3(1.0, 1.0, 0.0)), f.x), f.y), mix(mix(H30(i + vec3(0.0, 0.0, 1.0)), H30(i + vec3(1.0, 0.0, 1.0)), f.x), mix(H30(i + vec3(0.0, 1.0, 1.0)), H30(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }\n';
const F30 = ['{ vec3 n9 = normalize(normal); float nv = clamp(dot(n9, normalize(vViewPosition)), 0.0, 1.0); vec3 bp = vB30;',
  'float pl = step(0.5, vW29.x) * (1.0 - step(0.5, vW29.w)), rho = vW29.y, s9 = r29.y / 720.0;',
  'float nz = N30(bp * 3.1), nz2 = N30(bp * 8.3 + 5.0), nz3 = N30(bp * 4.4 + 9.0), gr = N29(gl_FragCoord.xy / s9 * 0.9);',
  'vec3 bg = texture2D(t29, gl_FragCoord.xy / r29).rgb; float lum = dot(bg, vec3(0.3, 0.59, 0.11));',
  'vec3 base = mix(PAPER29 * (0.985 + 0.03 * gr), bg, smoothstep(0.60, 0.74, lum));',                                                                // on paper it is on the paper; off it, a cut-out
  'float l9 = dot(n9, normalize(mix(vec3(-0.6, 0.62, 0.5), normalize(l33.xyz + vViewPosition), l33.w)));',
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
  /* (builder 33) the lamp on it */ '{ float k33 = l33.w, lt = smoothstep(0.05, 0.75, l9), sd = smoothstep(0.38, -0.3, l9), we = smoothstep(0.5, 0.92, 1.0 - nv) * smoothstep(0.0, 0.55, l9); c9 *= mix(vec3(1.0), vec3(1.0, 0.972, 0.91), 0.8 * lt * k33 * (1.0 - 0.7 * pl)); c9 *= mix(vec3(1.0), vec3(0.70, 0.72, 0.82), 0.5 * sd * k33 * (1.0 - pl)); c9 = mix(c9, base * vec3(1.0, 0.95, 0.84), 0.2 * we * k33 * (1.0 - pl)); }',
  'gl_FragColor = vec4(c9, 1.0); }'].join('\n');
function mat30(T, kind, o) { o = o || {}; const U = u29(T), v3 = h => { const c = new T.Color(h); return 'vec3(' + c.r.toFixed(4) + ',' + c.g.toFixed(4) + ',' + c.b.toFixed(4) + ')'; }, skin = kind !== 'p', pl = o.pl;
  const m = new T.MeshStandardMaterial({ color: 0x000000, roughness: 1, metalness: 0 }); m.skinning = skin; m.transparent = !o.jar; m.extensions = { derivatives: true }; if (kind === 'm') { m.side = T.BackSide; m.userData.w = o.w; }
  m.onBeforeCompile = sh => { sh.uniforms.t29 = U.t29; sh.uniforms.r29 = U.r29; sh.uniforms.l33 = u33(T).l33; if (kind === 'm') sh.uniforms.w27 = m.userData.w;
    sh.vertexShader = sh.vertexShader.replace('void main() {', (skin ? 'attribute vec4 w25a;\n' : '') + (kind === 'm' ? 'uniform float w27;\n' : '') + 'varying vec4 vW29;\nvarying vec3 vB30;\nvarying vec2 vP30;\nvoid main() {\n\tvW29 = ' + (skin ? 'w25a' : 'vec4(0.0)') + '; vB30 = position * ' + (o.k || 1).toFixed(5) + ' + vec3(' + (o.off || 0).toFixed(3) + '); vP30 = ' + (pl ? 'vec2((position.x - (' + pl.x.toFixed(4) + ')) / ' + pl.rx.toFixed(4) + ', (position.z - (' + pl.z.toFixed(4) + ')) / ' + pl.rz.toFixed(4) + ')' : 'vec2(0.0)') + ';');
    if (kind === 'm') sh.vertexShader = sh.vertexShader.replace('#include <skinning_vertex>', '#include <skinning_vertex>\n#ifdef USE_SKINNING\n\tmat4 sm27 = skinWeight.x * boneMatX + skinWeight.y * boneMatY + skinWeight.z * boneMatZ + skinWeight.w * boneMatW;\n\ttransformed += normalize((bindMatrixInverse * sm27 * bindMatrix * vec4(normal, 0.0)).xyz) * w27 * 1.5;\n#endif');
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'uniform sampler2D t29;\nuniform vec2 r29;\nuniform vec4 l33;\nvarying vec4 vW29;\nvarying vec3 vB30;\nvarying vec2 vP30;\n#define PAPER29 ' + v3(W30.C.paper) + '\n#define PENCIL30 ' + v3(W30.C.pencil) + '\n#define HATCH30 ' + (o.hatch || 22).toFixed(2) + '\n' + (kind === 'm' ? '#define MARGIN30\n' : '') + N29 + N30 + 'void main() {').replace('#include <dithering_fragment>', F30 + '\n#include <dithering_fragment>'); };
  m.customProgramCacheKey = () => 's30' + kind + (o.key || ''); return m; }
function set30(T, S, on) { const lin = h => new T.Color(h).convertSRGBToLinear();
    if (!S.o29) set29(T, S, 'b');
  if (!S.m30) { const none = new T.MeshBasicMaterial({ visible: false }), flat = h => new T.MeshBasicMaterial({ color: lin(h) }), G = S.G, k = 1 / G.H, key = '_' + S.st; let pi = 0;
    S.m30 = { body: mat30(T, 'b', { k, pl: G.pl, key, jar: S.jar }), hull: S.jar ? none : mat30(T, 'm', { k, pl: G.pl, key, jar: S.jar, w: S.hull27.material.userData.w }), film: none, marks: none, ink: none, face: flat(W30.C.pen), glint: flat(W30.C.paper), lid: flat(0x9fc0dc), drop: () => mat30(T, 'p', { k: 0.3, off: 3 + 1.7 * (pi++ % 4), hatch: 7, key: 'p' + (pi % 4), jar: S.jar }), hand: () => mat30(T, 'p', { k: 0.3, off: 11 + 1.7 * (pi++ % 4), hatch: 7, key: 'h' + (pi % 4), jar: S.jar }) };
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
C26.rest = (f0 => function (S, t, o, q, lagMs) { f0(S, t, o, q, lagMs); if (KIT.wash30 !== false && S.st === 1 && q.sink > 0.1) { const ov = q.sink - 0.1; q.sink = 0.1 + 0.1 * Math.min(1, ov / 0.7) + 0.05 * (o.spent || 0); q.wide = Math.max(q.wide, 0.5); q.brow = Math.max(q.brow, 0.6); } })(C26.rest);
/* the shelf jar holds the same spirit, small (it was the old pushed form at every stage) */
KIT.spiritBuild = (f0 => function (T, grp, extra) { if (KIT.wash30 !== false && extra && extra.push && extra.jar) return f0(T, grp, { jar: true, stage: extra.stage, ink: extra.ink }); return f0(T, grp, extra); })(KIT.spiritBuild);
play26 = play30; KIT.spirit26.play = play30; KIT.spirit26.W30 = W30;
// ==== W30 END
// ==== W31 BEGIN
// (builder 31) WATER'S OWN CHANGE OF STAGE, in pen and wash (AA.rxKit.evolve31, on by default; false or ?e31=0 gives builder 30's back).
// It stays where it stands. Three beats on the music's beat (o.L), longer and bigger at each stage:
//  1. THE GATHERING: a start (eyes wide, arms and hair up), then it draws arms, hair and pool in and curls, head to middle, into a ball
//     (the same skin: the pose, then ball31 pulls every joint inside one round). Inked beads run in to it across the bench and the page.
//  2. THE WHIRLPOOL: a ball of wash grows out of the curled body and takes it in (the old stage's skin is changed for the new one inside it).
//     Its wash turns in two arms, pen strokes land, turn and lift on it, a ring of drops and spray goes round it faster and faster, it lifts
//     and grows, a round of wash spreads under it, pencil lines curve in. Then it tightens and everything holds still for an instant.
//  3. THE SPRING: the ball opens from the top like a bud (the same mesh, its upper part bent out and down), the new form shoots up out of it
//     past its height and settles, then arm, hair, arm unroll on the half beats; the shell lies down as the new pool; a ring of wash and ink
//     flecks runs out over the bench; drops fall back. Eyes open, then the proud look.
KIT.evolve31 = KIT.evolve31 == null ? !(typeof location !== 'undefined' && /[?&]e31=0/.test(String(location.search))) : KIT.evolve31;
const W31 = { err: null, BIG: 1.55 };
const on31 = S => KIT.evolve31 !== false && KIT.wash30 !== false && !KIT.style29 && S && S.x28 && S.b27 && !S.jar;
const tl31 = o => { if (o.tl31) return o.tl31; const g = Math.max(2, Math.min(5, o.to || 3)), b = 2.5 + 0.25 * (g - 2), k = Math.max(1, 2500 / (3 * b * o.L)); return (o.tl31 = { g, TG: b * k, TS: b * k, H: 2 * b * k, TA: b * k, R0: 0.4 * ((W26.geo[o.from] || { H: 3 }).H) }); };
const spin31 = (X, bb) => 6.2832 * (0.35 * bb + 0.7 * bb * bb * bb) * X.g / 3;
function evo31(S, t, o, q) { const K = RK, L = o.L, X = tl31(o), u = t / L, g = X.g, m = q.m = { body: 0, armL: 0, hair: 0, armR: 0, face: 0, pool: 0, from: o.from };
  const e = q.e31 = { curl: 0, ball: 0, R: 0, cy: 0, lift: 0, spin: 0, open: 0, flat: 0, old: true, a: 0, b: -1, v: -1, sk: 0, still: 0, tight: 0, fw: 0, hop: 0, R0: X.R0, g };
  q.e = 0; q.n = (u - X.H) * 2; q.big = 0;
  if (t < 0) { const p = K.cl(1 + t / 420); q.wide = p; q.brow = 0.8 * p; q.looky = 0.5 * p; q.sq = -0.07 * p; return; }
  const curled = () => { q.bow = 1.7; q.nod = 1.0; q.sq = -0.42; q.armR = q.armL = -1.3; q.hair = -0.8; q.sink = 0.28; q.px = q.pz = 0.4; q.blink = 1; };
  if (u < X.TG) { const a = e.a = u / X.TG, st = K.pulse(a, -0.1, 0.2, 0.07), cu = K.sm((a - 0.2) / 0.66), jolt = a > 0.02 ? K.ring((a - 0.02) * X.TG * L, 160, 150) : 0;
    q.wide = 1 - 0.5 * cu; q.brow = 0.9 * st + 0.3; q.looky = 0.6 * st - 0.8 * cu; q.blink = K.sm((a - 0.62) / 0.2); q.open = st;
    q.sq = 0.2 * st + 0.06 * jolt * st - 0.42 * cu; q.armR = 0.75 * st - 1.3 * cu; q.armL = 0.6 * st - 1.3 * cu; q.hair = 0.6 * st - 0.8 * cu; q.bow = -0.12 * st + 1.7 * cu; q.nod = 1.0 * cu; q.sink = 0.28 * cu;
    q.px = q.pz = 1 + 0.12 * st - 0.6 * K.sm((a - 0.25) / 0.55); q.lean = 0.08 * Math.sin(a * 19) * cu * (1 - cu) * 4;
    e.curl = cu; const sr = 0.62 * K.sm((a - 0.7) / 0.3); e.R = X.R0 * sr; e.cy = X.R0 * 0.62; e.spin = spin31(X, 0) - 1.2 * (1 - a); return; }
  if (u < X.H) { const b = e.b = (u - X.TG) / X.TS, bb = Math.min(b, 0.88), tight = K.sm((b - 0.78) / 0.1); curled(); e.a = 1; e.curl = 1; e.ball = K.sm(b / 0.22); e.old = b < 0.3; if (!e.old) m.body = 1;
    e.R = X.R0 * (0.62 + 0.38 * K.back(b / 0.3) + (0.3 + 0.07 * g) * K.sm((b - 0.15) / 0.6)) * (1 - 0.13 * tight); e.cy = X.R0 * 0.62 + (e.R - X.R0 * 0.62) * 0.9;
    e.lift = X.R0 * ((0.5 + 0.08 * g) * K.sm(b / 0.45) + 0.07 * Math.sin(bb * X.TS * 3.1416) * (1 - tight)); e.spin = spin31(X, bb); e.still = b > 0.88 ? 1 : 0; e.tight = tight; q.big = K.sm(b / 0.5); e.fw = K.sm(b / 0.7); return; }
  const vr = u - X.H, v = e.v = vr * 3 / X.TA, LL = L * X.TA / 3, rise = K.back(v / 0.42), up = Math.min(1, rise); e.old = false; e.a = 1; e.b = 1; e.tight = 1 - K.sm(v / 0.1); e.fw = 1;
  e.curl = 1 - K.sm(v / 0.3); e.ball = 1 - K.sm(v / 0.16); e.open = K.sm(v / 0.32); e.flat = K.sm((v - 0.3) / 0.6); e.sk = K.sm(v / 0.5);
  e.R = X.R0 * (1.3 + 0.07 * g) * 0.87 * (1 + 0.12 * K.sm(v / 0.12)); e.cy = X.R0 * 0.62 + (e.R - X.R0 * 0.62) * 0.9; e.lift = X.R0 * (0.5 + 0.08 * g) * (1 - K.sm(v / 0.45)); e.spin = spin31(X, 0.88) + 1.6 * K.eo(v / 1.2);
  m.body = 1; m.face = K.sm((v - 0.1) / 0.2); m.pool = K.back((v - 0.4) / 0.6); m.armL = K.back((v - 0.4) / 0.4); m.hair = K.sm((v - 0.8) / 0.45); m.armR = K.back((v - 1.2) / 0.4);
  const c0 = 1 - K.sm(v / 0.3); q.bow = 1.7 * c0 - 0.22 * K.pulse(v, 0.15, 0.6, 0.15); q.nod = c0 - 0.3 * K.pulse(v, 0.15, 0.7, 0.15); q.sink = 0.9 * (1 - up);
  q.sq = -0.42 * c0 + 0.5 * K.pulse(v, 0.08, 0.42, 0.12) + (v > 0.45 ? -0.16 * K.ring((v - 0.45) * LL, 240, 300) : 0);
  for (let i = 1; i <= 3; i++) { const bt = 0.4 * i; q.sq += -0.08 * K.pulse(v, bt - 0.14, bt, 0.05) + (v > bt ? 0.09 * K.ring((v - bt) * LL, 200, 260) : 0); }
  q.px = q.pz = 0.4 + 0.6 * Math.min(1.25, K.back((v - 0.4) / 0.55)) + (v > 0.95 ? 0.1 * K.ring((v - 0.95) * LL, 380, 420) : 0);
  q.armL = 1.1 * (1 - K.sm((v - 0.4) / 0.45)) * K.sm(v / 0.35) - 1.3 * c0 + (v > 0.8 ? 0.25 * K.ring((v - 0.8) * LL, 260, 300) : 0); q.armR = 1.1 * (1 - (KIT.fix34 !== false ? -0.2 : 1) * K.sm((v - 1.2) / 0.45)) * K.sm(v / 0.35) - 1.3 * c0 + (v > 1.6 ? 0.25 * K.ring((v - 1.6) * LL, 260, 300) : 0);
  q.hair = 0.9 * K.pulse(v, 0.1, 0.8, 0.2) - 0.8 * c0 + (v > 1.2 ? -0.3 * K.ring((v - 1.2) * LL, 300, 340) : 0);
  q.blink = 1 - K.sm((v - 0.28) / 0.1); q.wide = 0.9 * K.pulse(v, 0.25, 1.2, 0.2); q.brow = 0.8 * K.pulse(v, 0.25, 1.3, 0.2); q.looky = 0.7 * K.pulse(v, 0.2, 0.8, 0.2); q.open = K.pulse(v, 0.2, 0.6, 0.1);
  q.lookx = -K.pulse(v, 0.45, 0.8, 0.12) + K.pulse(v, 1.2, 1.55, 0.12); q.hturn = -0.45 * K.pulse(v, 0.45, 0.8, 0.15) + 0.45 * K.pulse(v, 1.2, 1.55, 0.15);
  { /* the proud look, held */ const w = K.pulse(v, 1.6, 2.12, 0.14); q.lidx = 0.4 * w; q.smile = 1 + 0.7 * w; q.tilt = 0.16 * w; q.brow += 0.5 * w; q.nod += -0.2 * w; q.sq += 0.06 * w; q.armR += 0.12 * w; q.armL += 0.12 * w; }
  { /* and a hop home: it crouches, goes back in one arc, lands with a slosh */ const p = K.cl((v - 2.2) / 0.45), ld = (v - 2.65) * LL; e.fw = 1 - K.sm(p); e.hop = 4 * p * (1 - p); q.big = 1 - K.sm(p);
    q.sq += -0.2 * K.pulse(v, 2.04, 2.2, 0.05) + 0.22 * K.pulse(v, 2.2, 2.55, 0.08) + (ld > 0 ? -0.2 * K.ring(ld, 220, 280) : 0); if (ld > 0) { const r = K.ring(ld, 300, 340); q.px += 0.14 * r; q.pz += 0.14 * r; q.hair += 0.3 * K.ring(ld, 360, 420); q.smile = 1.4; } q.looky += -0.4 * K.pulse(v, 2.1, 2.5, 0.1); }
  q.lean = v > 0.45 ? 0.08 * K.ring((v - 0.45) * LL, 420, 520) : 0; q.home = v >= 2.65; q.done = v >= 3; }
C26.evo = (f0 => function (S, t, o, q) { if (o && o.e31) return evo31(S, t, o, q); return f0(S, t, o, q); })(C26.evo);
/* curled into one round: every joint is pulled inside a ball about the middle; inside the whirlpool it is drawn right in */
function ball31(S, e, ks) { const k = e.curl, kb = e.ball; if (k < 0.002 && kb < 0.002) return; const B = S.bones, cx = B[0].position.x, cz = B[0].position.z, cy = e.R0 * 0.62 / ks, rho = e.R0 * 0.5 / ks * (1 - 0.7 * kb);
  for (let j = 1; j < B.length; j++) { const p = B[j].position, dx = p.x - cx, dy = p.y - cy, dz = p.z - cz, d = Math.hypot(dx, dy, dz) || 1e-6, f = d > rho ? rho / d : 1, s = 1 + (f - 1) * k; p.set(cx + dx * s, cy + dy * s, cz + dz * s); B[j].scale.multiplyScalar((1 + 0.35 * k * (1 - f)) * (1 - 0.72 * kb)); }
  B[0].scale.x *= 1 - 0.9 * kb; B[0].scale.z *= 1 - 0.9 * kb; }
/* a limb of the new stage unrolls like a fern: rolled up small at its root, it unwinds and lengthens with its own beat */
function fern31(S, m) { const cl = x => Math.max(0, Math.min(1, x)); S.G.chains.forEach(c => { if (c.kind !== 'limb') return; const k = cl(c.side > 0 ? m.armR : c.side < 0 ? m.armL : m.hair); if (k > 0.995) return; const jn = c.jn, B = S.bones, sd = c.side || 1, ln = 0.3 + 0.7 * k; let px = B[jn[0]].position.x, py = B[jn[0]].position.y, pz = B[jn[0]].position.z, ox = px, oy = py, oz = pz;
    for (let i = 1; i < jn.length; i++) { const b = B[jn[i]], p = b.position, dx = (p.x - ox) * ln, dy = (p.y - oy) * ln, dz = (p.z - oz) * ln, an = sd * (1 - k) * 0.85 * i, c0 = Math.cos(an), s0 = Math.sin(an); ox = p.x; oy = p.y; oz = p.z; px += dx * c0 - dy * s0; py += dx * s0 + dy * c0; pz += dz; p.set(px, Math.max(0.03, py), pz); b.scale.multiplyScalar(0.16 + 0.84 * k * k); } }); }
const N31 = N29 + N30;
function make31(T, S) { const U = u29(T), v3 = h => { const c = new T.Color(h); return 'vec3(' + c.r.toFixed(4) + ',' + c.g.toFixed(4) + ',' + c.b.toFixed(4) + ')'; }, X = { live: false, beads: [], v: new T.Vector3(), v2: new T.Vector3(), pts: Array.from({ length: 48 }, () => new T.Vector3()) };
  const NX = 40, NY = 26, T0 = 0.03, T1 = Math.PI - 0.05, g = new T.SphereGeometry(1, NX, NY, 0, 2 * Math.PI, T0, T1 - T0); g.setAttribute('p0', new T.BufferAttribute(new Float32Array(g.attributes.position.array), 3)); g.attributes.position.usage = T.DynamicDrawUsage;
  const m = new T.ShaderMaterial({ transparent: true, side: T.DoubleSide, uniforms: { t29: U.t29, r29: U.r29, spin: { value: 0 }, amt: { value: 1 } },
    vertexShader: 'attribute vec3 p0;\nvarying vec3 vP;\nvarying vec3 vN;\nvarying vec3 vV;\nvoid main() { vP = p0; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalMatrix * normal; vV = -mv.xyz; gl_Position = projectionMatrix * mv; }',
    fragmentShader: ['uniform sampler2D t29;\nuniform vec2 r29;\nuniform float spin;\nuniform float amt;\nvarying vec3 vP;\nvarying vec3 vN;\nvarying vec3 vV;', N31, '#define PAPER31 ' + v3(W30.C.paper),
      'void main() { vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n; float nv = clamp(dot(n, normalize(vV)), 0.0, 1.0), c = cos(spin), s = sin(spin);',
      'vec3 bp = vec3(c * vP.x - s * vP.z, vP.y, s * vP.x + c * vP.z); float lon = atan(bp.z, bp.x), s9 = r29.y / 720.0, gr = N29(gl_FragCoord.xy / s9 * 0.9);',
      'float nz = N30(bp * 2.3), nz2 = N30(bp * 6.1 + 5.0);',
      'vec3 bg = texture2D(t29, gl_FragCoord.xy / r29).rgb; float lum = dot(bg, vec3(0.3, 0.59, 0.11)); vec3 base = mix(PAPER31 * (0.985 + 0.03 * gr), bg, smoothstep(0.60, 0.74, lum));',
      'float l9 = dot(n, normalize(vec3(-0.6, 0.62, 0.5)));',
      'float sp = sin(lon * 2.0 + vP.y * 4.6 + 2.2 * (nz - 0.5)), band = smoothstep(0.1, 0.7, sp), lite = smoothstep(-0.25, -0.8, sp);',
      'float hl = smoothstep(0.80, 0.87, l9 + 0.42 * (nz - 0.5));',
      'hl = max(hl, lite * smoothstep(0.1, 0.45, l9) * smoothstep(0.50, 0.58, nz2));',
      'float ed = clamp(smoothstep(0.45, 0.95, 1.0 - nv + 0.3 * (nz - 0.5)), 0.0, 1.0), s2 = smoothstep(0.12, -0.14, l9 + 0.3 * (nz - 0.5));',
      'vec3 wash = mix(vec3(0.64, 0.80, 0.945), vec3(0.40, 0.59, 0.84), max(ed, 0.8 * band)); wash = mix(wash, vec3(0.36, 0.52, 0.78), 0.62 * s2); wash = mix(wash, vec3(1.0), 0.4 * lite);',
      'float a9 = (1.0 - hl) * (0.80 + 0.20 * nz2) * (0.93 + 0.07 * gr);',
      'if (!gl_FrontFacing) { wash = mix(wash, vec3(0.40, 0.57, 0.82), 0.45); a9 = max(a9, 0.7); }',
      'gl_FragColor = vec4(base * mix(vec3(1.0), wash, a9 * amt), 1.0); }'].join('\n') });
  const sph = X.sph = new T.Mesh(g, m); sph.renderOrder = 20; sph.frustumCulled = false; sph.visible = false; sph.userData.plain = true; sph.userData.nobox = true; sph.castShadow = false;
  X.NX = NX; X.NY = NY; X.T0 = T0; X.T1 = T1; X.tp = topo30(g); X.src = src30(X.tp, { mesh: sph, rs: 1, seed: 7700, o: { smooth: 2, min: 5, wob: 0.8 } });
  /* the wash on the bench under it: a soft round that spreads, then a ring that runs out and dries */
  const gm = new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.MultiplyBlending, uniforms: { r0: { value: 0 }, r1: { value: 0.3 }, amt: { value: 0 }, sd: { value: 1.7 } },
    vertexShader: 'varying vec2 vU;\nvoid main() { vU = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: ['uniform float r0;\nuniform float r1;\nuniform float amt;\nuniform float sd;\nvarying vec2 vU;', N29,
      'void main() { float d = length(vU), nz = N29(vU * 5.0 + sd), n2 = N29(vU * 19.0 + sd * 1.7), dd = d + 0.09 * (nz - 0.5) * (0.4 + r1) + 0.02 * (n2 - 0.5);',
      'float outer = 1.0 - smoothstep(r1 - 0.03, r1, dd), inner = smoothstep(r0 - 0.14, r0 + 0.02, dd), tide = smoothstep(r1 - 0.085, r1 - 0.03, dd) * outer;',
      'float a = clamp(amt * outer * inner * (0.4 + 0.6 * tide) * (0.75 + 0.4 * nz), 0.0, 1.0); gl_FragColor = vec4(mix(vec3(1.0), vec3(0.50, 0.68, 0.88), a), 1.0); }'].join('\n') });
  const gw = X.gw = new T.Mesh(new T.PlaneGeometry(2, 2), gm); gw.rotation.x = -Math.PI / 2; gw.renderOrder = 17; gw.visible = false; gw.userData.plain = true; gw.userData.nobox = true; gw.frustumCulled = false;
  const bm = mat30(T, 'p', { k: 0.3, off: 5.1, hatch: 7, key: 'e31' }), bg = new T.SphereGeometry(1, 12, 9);
  for (let i = 0; i < 18; i++) { const b = new T.Mesh(bg, bm); b.renderOrder = 20; b.visible = false; b.frustumCulled = false; b.castShadow = false; b.userData.plain = true; b.userData.nobox = true; X.beads.push({ m: b, src: src30(W30.sph, { mesh: b, rs: 1, seed: 8100 + i * 700, o: { smooth: 2, min: 3, wob: 0.6 } }), h: h30(i * 97 + 5), h2: h30(i * 131 + 9), h3: h30(i * 53 + 2) }); }
  /* the pencil: a second pen, lighter and thinner */ const P2 = X.pen2 = pen30(T, S), pc = new T.Color(W30.C.pencil); P2.mesh.material.uniforms.col.value.set(pc.r, pc.g, pc.b); P2.mesh.renderOrder = 18; if (P2.mesh.parent) P2.mesh.parent.remove(P2.mesh);
  return X; }
/* the ball's shape for this frame: closed, or opened from the top like a bud (every line of longitude bent out and down above its hinge) */
function shape31(X, open, flat) { const g = X.sph.geometry, pos = g.attributes.position, A = pos.array, NX = X.NX, NY = X.NY, T0 = X.T0, dT = (X.T1 - T0) / NY, TH = 0.66 * Math.PI, ih = Math.round((TH - T0) / dT);
  for (let ix = 0; ix <= NX; ix++) { const ph = ix / NX * 2 * Math.PI, k = Math.min(1.15, open * (1 + 0.13 * Math.cos(5 * ph + 1.0) + 0.06 * Math.cos(3 * ph))), cph = Math.cos(ph), sph = Math.sin(ph), th = T0 + ih * dT, b0 = Math.PI - th; let r = Math.sin(th), y = Math.cos(th);
    for (let iy = NY; iy >= 0; iy--) { const i = 3 * (iy * (NX + 1) + ix), t2 = T0 + iy * dT; if (iy >= ih || k < 0.001) { r = Math.sin(t2); y = Math.cos(t2); } else { const a = (ih - iy - 0.5) * dT, be = b0 + a * (1 - 1.9 * k) - 0.55 * k; r += Math.cos(be) * dT; y += Math.sin(be) * dT; }
      const yy = -1 + (y + 1) * (1 - 0.96 * flat), rr = r * (1 + 0.25 * flat); A[i] = -rr * cph; A[i + 1] = Math.max(-1, yy); A[i + 2] = rr * sph; } }
  pos.needsUpdate = true; g.computeVertexNormals(); const P = X.tp.P, F = X.tp.first; for (let w = 0; w < F.length; w++) { const i = 3 * F[w]; P[3 * w] = A[i]; P[3 * w + 1] = A[i + 1]; P[3 * w + 2] = A[i + 2]; } }
/* one frame of everything that is not the body: the ball, the beads and drops, the wash on the bench */
function stage31(S, X, grp, e, o, ks) { const K = RK, hold = grp.parent, T = S.T; if (!hold) return; const scene = hold.parent || hold, hs = hold.scale.x * grp.scale.x; X.live = true; X.e = e; X.o = o;
  if (X.sph.parent !== hold) hold.add(X.sph); [X.gw, X.pen2.mesh].concat(X.beads.map(b => b.m)).forEach(m => { if (m.parent !== scene) scene.add(m); });
  const R = e.R / ks, sph = X.sph, show = e.R > 0.01 && !(e.v > 1.25), cyL = grp.position.y + (e.cy / ks) * grp.scale.y; sph.visible = show;
  if (show) { const wob = e.b >= 0 && e.v < 0 ? 0.05 * Math.sin(e.spin * 2.0) * (1 - (e.tight || 0)) : 0, sink = e.v > 0.6 ? 1 - 0.6 * K.sm((e.v - 0.6) / 0.6) : 1; shape31(X, e.open, e.flat);
    sph.position.set(grp.position.x, cyL - (e.cy - e.R) / ks * grp.scale.y * e.flat, grp.position.z); sph.scale.set(R * (1 + wob) * sink * grp.scale.x, R * (1 - wob) * grp.scale.y, R * (1 + wob) * sink * grp.scale.z); sph.rotation.x = -hold.rotation.x * e.flat; sph.material.uniforms.spin.value = e.spin; sph.material.uniforms.amt.value = 1 - 0.35 * e.flat; }
  hold.updateMatrixWorld(true); const C = X.c || (X.c = new T.Vector3()), G0 = X.g0 || (X.g0 = new T.Vector3()); C.set(grp.position.x, cyL, grp.position.z).applyMatrix4(hold.matrixWorld); const Rw = X.Rw = Math.max(e.R, e.R0 * 0.62) * hs / ks, R0w = e.R0 * hs / ks, g31 = o.g31 || {};
  G0.setFromMatrixPosition(hold.matrixWorld); if (g31.y != null) G0.y = g31.y; X.gy = G0.y;
  /* the wash under it */ { const gw = X.gw, U = gw.material.uniforms, ext = R0w * 7; gw.position.set(G0.x, G0.y + 0.012, G0.z); gw.scale.set(ext, ext, 1); let r0 = 0, r1 = 0.1, amt = 0;
    if (e.v >= 0) { const w = K.eo(e.v / 1.5); r1 = 0.2 + 0.78 * w; r0 = Math.max(0, r1 - 0.2 + 0.06 * w) * K.sm(e.v / 0.3); amt = 0.9 * (1 - K.sm((e.v - 0.8) / 1.3)); } else if (e.b >= 0) { r1 = 0.1 + 0.1 * K.sm(e.b / 0.9); amt = 0.75 * K.sm(e.b / 0.3); }
    U.r0.value = r0; U.r1.value = r1; U.amt.value = amt; gw.visible = amt > 0.01; }
  /* beads: they run in across the bench; they go round the ball; they are thrown out and fall back */
  X.beads.forEach((B, i) => { const m = B.m; let vis = false, x = 0, y = 0, z = 0, r = 0.1 * R0w;
    if (e.v >= 0) { const Tf = 0.75 + 0.5 * B.h, ta = e.v / Tf, an = i / 18 * 6.2832 + 2 * B.h2, D = (1.6 + 3.2 * B.h3) * R0w * (1 + 0.12 * e.g), Hm = (1.0 + 1.6 * B.h) * R0w; if (ta < 1) { vis = true; x = C.x + Math.cos(an) * D * ta; z = C.z + Math.sin(an) * D * ta * 0.8 + 0.3 * D * ta; y = G0.y + (C.y - G0.y) * (1 - ta) + 4 * Hm * ta * (1 - ta); r = (0.07 + 0.08 * B.h2) * R0w * (1 - 0.3 * ta); } }
    else if (e.b >= 0) { const n = 5 + e.g; if (i < n) { const an = e.spin * 1.7 + i / n * 6.2832, rad = (1.5 - 0.32 * (e.tight || 0)) * Rw / hs, k = K.sm((e.b - 0.05 * i) / 0.2); if (k > 0.02) { vis = true; const yy = 0.18 * rad * Math.sin(an + 0.6) + 0.08 * rad * Math.sin(2 * an + i), zz = Math.sin(an) * rad, tq = -hold.rotation.x + 0.12, ct = Math.cos(tq), st = Math.sin(tq); X.v.set(grp.position.x + Math.cos(an) * rad, cyL + yy * ct - zz * st, grp.position.z + yy * st + zz * ct).applyMatrix4(hold.matrixWorld); x = X.v.x; y = X.v.y; z = X.v.z; r = (0.07 + 0.06 * B.h) * R0w * k; } } }
    else if (i < 12) { const p = K.cl((e.a * 1.3 - 0.08 - 0.06 * i) / 0.5); if (p > 0 && p < 1) { vis = true; const an = i / 12 * 6.2832 + 1.3 * B.h, D = (3.5 + 3.5 * B.h2) * R0w, w = 1 - p * p * p, sw = an + 0.9 * (1 - w); x = G0.x + Math.cos(sw) * D * w; z = G0.z + Math.sin(sw) * D * w * 0.8 + 0.35 * D * w; r = (0.1 + 0.1 * B.h3) * R0w * (1 - 0.4 * p); y = G0.y + r * 0.8; } }
    m.visible = vis; if (vis) { m.position.set(x, y, z); m.scale.setScalar(Math.max(1e-4, r)); } }); }
function end31(S) { const X = S.x31; if (S.e31) { if (S.e31.gg.parent) S.e31.gg.parent.remove(S.e31.gg); S.e31 = null; S.root.visible = true; } if (!X || !X.live) return; X.live = false; X.sph.visible = false; X.gw.visible = false; X.pen2.mesh.visible = false; X.beads.forEach(b => { b.m.visible = false; }); }
/* the pen's part: the ball's outline, the strokes that turn on it, the spray ring, the beads, flecks; the pencil's lines on the bench */
function ink31(T, S, X, ren, cam) { const R = S.pen30, e = X.e, K = RK, sz = ren.getDrawingBufferSize(W30.v2 || (W30.v2 = new T.Vector2())), Wd = sz.x, Ht = sz.y, sc = Ht / 720, pe = cam.projectionMatrix.elements, P10 = pe[10], P11 = pe[11];
  const lw = Math.max(R.lw || 2, 1.9 * sc), fs = lw / (W30.lw * sc), s2 = sc * Math.min(1.6, Math.max(0.5, fs)), Rw = X.Rw, d = 0.06 * Rw, pts = X.pts, cp = X.v.setFromMatrixPosition(cam.matrixWorld), C = X.c, G0 = X.g0, P2 = X.pen2;
  P2.vp = R.vp; P2.boil = R.boil; P2.nv = 0; P2.ni = 0; P2.mesh.visible = true;
  if (X.sph.visible) { X.sph.updateMatrixWorld(true); proj30(R, X.src, R.vp, Wd, Ht, P10, P11, d * 0.3); if (!(X.k32 && e.open > 0.03)) sil30(R, X.src, lw * 1.05, s2, Wd, Ht); /* (builder 32) the open bud is lined in its wash: the outline finder would join petal to petal */ const M = X.sph.matrixWorld;
    if (e.open < 0.5) { /* strokes that land on the turning water, go round with it and lift */ const n = 8 + 2 * e.g, fade = 1 - e.open * 2;
      for (let i = 0; i < n; i++) { const h = h30(i * 71 + 3), h2 = h30(i * 37 + 11), life = K.mod(e.spin * (0.22 + 0.1 * h) + h2, 1), len = (0.8 + 1.2 * h) * Math.sin(Math.PI * life) * fade, lat0 = -0.9 + 1.8 * ((i + 0.5) / n), l0 = -e.spin * (1.15 + 0.5 * h2) + i * 2.4, N = 12; if (len < 0.12) continue; let k = 0;
        for (let j = 0; j <= N; j++) { const lo = l0 - len * j / N, la = lat0 + 0.32 * (j / N - 0.5) * len, cl = Math.cos(la), p = pts[k]; p.set(Math.cos(lo) * cl * 1.012, Math.sin(la) * 1.012, Math.sin(lo) * cl * 1.012).applyMatrix4(M); const fr = (p.x - C.x) * (cp.x - p.x) + (p.y - C.y) * (cp.y - p.y) + (p.z - C.z) * (cp.z - p.z); if (fr > 0.12 * Rw * cp.distanceTo(p)) k++; else if (k) break; }
        if (k >= 3) free30(R, pts.slice(0, k), lw * (0.6 + 0.3 * h), s2, Wd, Ht, P10, P11, d * 0.5, 9700 + i * 40, { smooth: 2, wob: 0.7, min: 4 }); } }
    if (e.b >= 0 && e.v < 0) { /* the ring of spray round it: broken arcs, faster than the water */ const tq = -X.sph.parent.rotation.x + 0.12, ct = Math.cos(tq), st = Math.sin(tq), n = 3 + (e.g > 3 ? 1 : 0), u = (1.5 - 0.32 * (e.tight || 0)) * (Rw / Math.max(1e-6, e.R * X.Rw / Math.max(e.R, e.R0 * 0.62))) * 1.0, kk = K.sm(e.b / 0.25);
      for (let i = 0; i < n; i++) { const a0 = e.spin * 1.7 + i / n * 6.2832 + 0.5, len = (0.5 + 0.7 * kk) * (0.7 + 0.3 * Math.sin(i * 1.7)), N = 10; for (let j = 0; j <= N; j++) { const an = a0 + len * j / N; const yy = 0.18 * u * Math.sin(an + 0.6), zz = Math.sin(an) * u; pts[j].set(Math.cos(an) * u, yy * ct - zz * st, yy * st + zz * ct).applyMatrix4(M); } free30(R, pts.slice(0, N + 1), lw * 0.7, s2, Wd, Ht, P10, P11, d * 0.2, 9900 + i * 40, { smooth: 2, wob: 0.8, min: 4 }); } } }
  X.beads.forEach(B => { if (!B.m.visible) return; B.m.updateMatrixWorld(true); proj30(R, B.src, R.vp, Wd, Ht, P10, P11, d * 0.2); sil30(R, B.src, lw * 0.75, s2, Wd, Ht); });
  const gy = X.gy + 0.03, gp = (i, r, an) => pts[i].set(G0.x + Math.cos(an) * r, gy, G0.z + Math.sin(an) * r * 0.9);
  if (e.b >= 0 && e.v < 0) { /* pencil lines on the bench curve in toward it */ const n = 7 + 2 * e.g; for (let i = 0; i < n; i++) { const h = h30(i * 19 + 7), ph = K.mod(e.b * (2.2 + 1.5 * h) + h30(i * 7 + 1), 1), r1 = Rw * (4.6 - 3.0 * ph), a0 = i / n * 6.2832 + 1.1 * ph + 0.4 * h, len = 0.55 * Math.sin(Math.PI * ph) * K.sm(e.b / 0.2); if (len < 0.08) continue; const N = 8; for (let j = 0; j <= N; j++) gp(j, Math.max(Rw * 1.2, r1 - 0.5 * Rw * j / N), a0 + len * j / N); free30(P2, pts.slice(0, N + 1), lw * 0.6, s2, Wd, Ht, P10, P11, 0.02, 10100 + i * 40, { smooth: 2, wob: 0.9, min: 4 }); } }
  if (e.v >= 0 && e.v < 1.5) { /* the splash runs out: ink flecks and a broken ring */ const w = K.eo(e.v / 1.2), n = 12 + 3 * e.g, fade = 1 - K.sm((e.v - 0.7) / 0.7);
    for (let i = 0; i < n; i++) { const h = h30(i * 23 + 5), an = i / n * 6.2832 + 0.5 * h, r = Rw * (1.2 + (3.0 + 2.6 * h) * w), ln = Rw * (0.7 * (1 - w) + 0.12) * fade; if (ln < 0.04 * Rw) continue; gp(0, r, an); gp(1, r + ln * 0.5, an + 0.02); gp(2, r + ln, an + 0.05); free30(R, pts.slice(0, 3), lw * (0.55 + 0.5 * h), s2, Wd, Ht, P10, P11, 0.02, 10500 + i * 40, { smooth: 1, wob: 0.5, min: 2 }); }
    for (let i = 0; i < 5; i++) { const a0 = i * 1.257 + 0.3 + 0.4 * w, len = 0.75 * fade, N = 8, r = Rw * (1.0 + 4.2 * w); if (len < 0.1) continue; for (let j = 0; j <= N; j++) gp(j, r * (1 + 0.03 * Math.sin(j + i)), a0 + len * j / N); free30(P2, pts.slice(0, N + 1), lw * 0.6, s2, Wd, Ht, P10, P11, 0.02, 10900 + i * 40, { smooth: 2, wob: 0.9, min: 4 }); } }
  R.pa.needsUpdate = R.ua.needsUpdate = R.ia.needsUpdate = true; R.mesh.geometry.setDrawRange(0, R.ni); P2.pa.needsUpdate = P2.ua.needsUpdate = P2.ia.needsUpdate = true; P2.mesh.geometry.setDrawRange(0, P2.ni); }
draw30 = (f0 => function (T, S, ren, cam) { f0(T, S, ren, cam); const M = S.o31 || S, X = M.x31; if (!X || !X.live || !X.e) return; try { ink31(T, S, X, ren, cam); } catch (e) { W31.err = 'ink ' + String(e && e.stack); } })(draw30);
const play31 = (f0 => function (grp, clip, t, o) { const S = grp.userData.rig2.sp; if (!S || S.g28 === 31) return f0(grp, clip, t, o);
  if (!(clip === 'evo' && o && o.from && o.from !== S.st && on31(S))) { if (S.x31 || S.e31) end31(S); return f0(grp, clip, t, o); }
  let r; try { o.e31 = 1; const X = S.x31 || (S.x31 = make31(S.T, S)), g0 = S.g28, ks = o.ks31 || 1; S.g28 = true; try { r = f0(grp, clip, t, o); } finally { S.g28 = g0; }
    const q = S.q0 || {}, e = q.e31; if (!e) return r;
    if (e.old && grp.parent) { let E = S.e31; if (!E || E.from !== o.from) { const gg = fig26(S.T, o.from, { stage: o.from }), sp = gg.userData.rig2.sp; sp.g28 = 31; sp.o31 = S; grp.parent.add(gg); E = S.e31 = { gg, from: o.from, sp }; }
      E.gg.visible = true; E.gg.position.copy(grp.position); E.gg.quaternion.copy(grp.quaternion); E.gg.scale.copy(grp.scale); S.root.visible = false; f0(E.gg, clip, t, o); ball31(E.sp, e, ks); }
    else { if (S.e31) { if (S.e31.gg.parent) S.e31.gg.parent.remove(S.e31.gg); S.e31 = null; } S.root.visible = true; if (q.m) fern31(S, q.m); ball31(S, e, ks); }
    stage31(S, X, grp, e, o, ks); } catch (err) { W31.err = String(err && err.stack); } return r; })(play26);
play26 = play31; KIT.spirit26.play = play31; KIT.spirit26.W31 = W31;
// ==== W31 END
// ==== W32 BEGIN
// (builder 32) WATER'S CHANGE OF STAGE AT THE CENTRE OF THE SCREEN (AA.rxKit.evolve32, on by default; false or ?e32=0 gives builder 31's back).
// The same three beats, restaged by scheme.js S32 (it leaves home in one move while it curls, comes up over the book toward the eye, bursts,
// stands tall on the page, turns its back and goes home in two more beats). Here: the times (e.go out, e.home back, the walk home after the
// proud look), everything of the ball grown by o.bk32, a real curl (curl32: the spine rolls up like a fern head, the limbs carried with it),
// a ball that reads round (mat32: what is under it is seen bent through it, wash bands that wind round, a pooled rim, a shaded side with
// pencil, bare paper that rides the spin) and a bud of five pointed petals that peel open in the round (shape32).
KIT.evolve32 = KIT.evolve32 == null ? !(typeof location !== 'undefined' && /[?&]e32=0/.test(String(location.search))) : KIT.evolve32;
const W32 = { err: null, NP: 5, TH: 0.6 * Math.PI }, on32 = () => KIT.evolve32 !== false;
C26.evo = (f0 => function (S, t, o, q) { if (!(o && o.e31 && on32())) return f0(S, t, o, q);
  const K = RK, X = tl31(o), L = o.L, bt = X.TG / (2.5 + 0.25 * (X.g - 2)), uH = X.H + X.TA * 2.15 / 3, TH = 2 * bt, u = t / L;
  f0(S, Math.min(t, uH * L - 1), o, q); const e = q.e31; if (!e) return;
  e.go = t < 0 ? 0 : K.sm(K.cl(((e.b >= 0 ? 1 + e.b : e.a) - 0.14) / 1.16)); e.home = 0; e.bk = o.bk32 || 1; q.done = false; q.home = false;
  if (u > uH) { const p = K.cl((u - uH) / TH); e.home = K.sm((p - 0.14) / 0.72); e.v = 2.15 + 0.8 * p; q.turn = PI * K.sm(p / 0.16) + PI * K.sm((p - 0.86) / 0.14);
    q.sink = 0.4 * K.pulse(p, 0.16, 0.84, 0.1); q.sq += -0.18 * K.pulse(p, 0, 0.14, 0.05) + (p > 0.86 ? -0.16 * K.ring((p - 0.86) * TH * L, 220, 280) : 0); q.lidx = 0; q.tilt = 0; q.home = p >= 0.9; q.done = p >= 1; }
  e.R *= e.bk; e.cy *= e.bk; e.R0 *= e.bk; })(C26.evo);
/* the curl: the spine rolls forward and over into a ring, head tucked in, and what hangs on it is carried round with it */
function curl32(S, e, ks) { const k = e.curl, B = S.bones, J = S.G.J, ch = []; for (let j = 1; j < J.length; j++) { const r = J[j].role; if (r === 'spine' || r === 'neck' || r === 'head') ch.push(j); } const n = ch.length; if (n < 3) return;
  const T = S.T, P0 = ch.map(j => B[j].position.clone()), sl = [0]; let Ls = 0; for (let i = 1; i < n; i++) { Ls += P0[i].distanceTo(P0[i - 1]); sl.push(Ls); } if (Ls < 1e-4) return;
  const dir = P0[n - 1].z - P0[0].z < -0.02 * Ls ? -1 : 1, w = RK.sm(k * 2), kap = Math.max(1e-3, k * 1.75 * PI / Ls), r = 1 / kap, cy = e.R0 * 0.62 / ks, D = [], cen = new T.Vector3(), qx = new T.Quaternion(), ax = new T.Vector3(1, 0, 0), bow0 = 1.7 * k;
  const A = sl.map(s => new T.Vector3(P0[0].x, P0[0].y + r * Math.sin(kap * s), P0[0].z + dir * r * (1 - Math.cos(kap * s)))); A.forEach(p => cen.add(p)); cen.multiplyScalar(1 / n);
  const sh = RK.sm(k), ox = (B[0].position.x - cen.x) * sh, oy = (cy - cen.y) * sh, oz = (B[0].position.z - cen.z) * sh, own = new Map();
  ch.forEach((j, i) => { const p = A[i]; p.x += ox; p.y += oy; p.z += oz; p.lerpVectors(P0[i], p, w); D[i] = p.clone().sub(P0[i]); B[j].position.copy(p); own.set(j, i); B[j].quaternion.premultiply(qx.setFromAxisAngle(ax, dir * w * Math.max(0, kap * sl[i] - bow0 * sl[i] / Ls))); });
  for (let j = 1; j < J.length; j++) { if (own.has(j)) continue; let a = J[j].par, g = 0; while (a > 0 && !own.has(a) && g++ < 40) a = J[a].par; if (!own.has(a)) continue; const i = own.get(a); B[j].position.add(D[i]); const d = B[j].position.clone().sub(B[ch[i]].position); qx.setFromAxisAngle(ax, dir * w * Math.max(0, kap * sl[i] - bow0 * sl[i] / Ls)); d.applyQuaternion(qx); B[j].position.copy(B[ch[i]].position).add(d); B[j].quaternion.premultiply(qx); } }
ball31 = (f0 => function (S, e, ks) { if (on32() && e.curl > 0.002 && e.go != null) { try { curl32(S, e, ks); } catch (x) { W32.err = 'curl ' + String(x && x.stack); } } f0(S, e, ks); })(ball31);
/* the ball: its own mesh (five petals of nine lines, a line between them that is cut away as it opens) and its own wash */
function up32(T, X) { const U = u29(T), v3 = h => { const c = new T.Color(h); return 'vec3(' + c.r.toFixed(4) + ',' + c.g.toFixed(4) + ',' + c.b.toFixed(4) + ')'; }, NP = W32.NP, NX = NP * 9, NY = 30, T0 = X.T0, T1 = X.T1, g = new T.SphereGeometry(1, NX, NY, 0, 2 * Math.PI, T0, T1 - T0);
  g.setAttribute('p0', new T.BufferAttribute(new Float32Array(g.attributes.position.array), 3)); g.attributes.position.usage = T.DynamicDrawUsage; const pid = new Float32Array((NX + 1) * (NY + 1)); for (let iy = 0; iy <= NY; iy++) for (let ix = 0; ix <= NX; ix++) pid[iy * (NX + 1) + ix] = Math.floor(ix / 9); g.setAttribute('pid', new T.BufferAttribute(pid, 1)); const pu = new Float32Array(pid.length); for (let iy = 0; iy <= NY; iy++) for (let ix = 0; ix <= NX; ix++) pu[iy * (NX + 1) + ix] = ((ix % 9) - 4) / 4; g.setAttribute('pu', new T.BufferAttribute(pu, 1));
  const m = new T.ShaderMaterial({ transparent: true, side: T.DoubleSide, uniforms: { t29: U.t29, r29: U.r29, spin: { value: 0 }, amt: { value: 1 }, open: { value: 0 }, rpx: { value: 60 }, dim: { value: 1 }, l33: u33(T).l33, soak: { value: 0 } },
    vertexShader: 'attribute vec3 p0;\nattribute float pid;\nattribute float pu;\nvarying float vU;\nvarying vec3 vP;\nvarying vec3 vN;\nvarying vec3 vV;\nvarying float vPid;\nvoid main() { vP = p0; vPid = pid; vU = pu; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalMatrix * normal; vV = -mv.xyz; gl_Position = projectionMatrix * mv; }',
    fragmentShader: ['uniform sampler2D t29;\nuniform vec2 r29;\nuniform vec4 l33;\nuniform float soak;\nuniform float spin;\nuniform float amt;\nuniform float open;\nuniform float rpx;\nuniform float dim;\nvarying vec3 vP;\nvarying vec3 vN;\nvarying vec3 vV;\nvarying float vPid;\nvarying float vU;', N31, '#define PAPER31 ' + v3(W30.C.paper), '#define F34 ' + (KIT.fix34 !== false ? '1.0' : '0.0'), '#define F36 ' + (KIT.fix36 !== false ? '1.0' : '0.0'),
      'void main() { float fg = abs(vPid - floor(vPid + 0.5)); if (open > 0.001 && vP.y > ' + Math.cos(W32.TH).toFixed(4) + ' && fg > 0.5 * (1.0 - smoothstep(0.0, 0.25, open)) + 0.004) discard;',
      'vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n; float nv = clamp(dot(n, normalize(vV)), 0.0, 1.0), c = cos(spin), s = sin(spin);',
      'vec3 bp = vec3(c * vP.x - s * vP.z, vP.y, s * vP.x + c * vP.z); float lon = atan(bp.z, bp.x), s9 = r29.y / 720.0, gr = N29(gl_FragCoord.xy / s9 * 0.9);',
      'float nz = N30(bp * 2.3), nz2 = N30(bp * 6.1 + 5.0);',
      /* what lies under it is seen through the water: bent more toward the rim, and run a little */
      'vec2 uv = (gl_FragCoord.xy - n.xy * (1.0 - nv) * rpx * 0.6 * (1.0 - open)) / r29, px = 1.6 * s9 / r29;',
      'vec3 bg = 0.4 * texture2D(t29, uv).rgb + 0.15 * (texture2D(t29, uv + vec2(px.x, 0.0)).rgb + texture2D(t29, uv - vec2(px.x, 0.0)).rgb + texture2D(t29, uv + vec2(0.0, px.y)).rgb + texture2D(t29, uv - vec2(0.0, px.y)).rgb);',
      'float lum = dot(bg, vec3(0.3, 0.59, 0.11)); vec3 base = mix(PAPER31 * (0.985 + 0.03 * gr) * dim, bg, smoothstep(0.60 * dim, 0.74 * dim, lum));',
      'float l9 = dot(n, normalize(mix(vec3(-0.5, 0.66, 0.56), normalize(l33.xyz + vV), l33.w)));',
      /* (builder 34) an open petal is thin: the lamp comes through it, so the side turned from the lamp is lit too, and its inside is not a dark lining */ 'float op34 = F34 * smoothstep(0.02, 0.2, open); l9 = mix(l9, max(l9, 0.55 * abs(l9) + 0.12), op34);',
      'float sp = sin(lon * 3.0 + bp.y * 5.2 + 2.4 * (nz - 0.5)), band = smoothstep(0.05, 0.75, sp), lite = smoothstep(-0.3, -0.85, sp);',
      'float hl = smoothstep(0.78, 0.86, l9 + 0.36 * (nz - 0.5)); hl = max(hl, lite * smoothstep(0.0, 0.4, l9) * smoothstep(0.42, 0.52, nz2));',
      'float rim = clamp(smoothstep(0.35, 0.95, 1.0 - nv + 0.25 * (nz - 0.5)), 0.0, 1.0), core = smoothstep(0.25, -0.35, l9 + 0.3 * (nz - 0.5)) * (1.0 - 0.6 * op34) * (1.0 - 0.75 * F36 * smoothstep(0.02, 0.2, open) * step(' + Math.cos(W32.TH).toFixed(4) + ', vP.y));',
      'vec3 wash = mix(vec3(0.66, 0.81, 0.95), vec3(0.42, 0.60, 0.85), max(rim, 0.8 * band)); wash = mix(wash, vec3(0.30, 0.45, 0.72), 0.7 * core); wash = mix(wash, vec3(1.0), 0.45 * lite * (1.0 - core));',
      'float ht = smoothstep(0.5, 0.9, sin((gl_FragCoord.x + gl_FragCoord.y) / s9 * 0.85 + 3.0 * nz)) * core; wash = mix(wash, vec3(0.36, 0.38, 0.44), 0.22 * ht);',
      'float bnc = smoothstep(0.72, 1.0, 1.0 - nv) * smoothstep(-0.1, -0.7, n.y); wash = mix(wash, vec3(0.80, 0.88, 0.96), 0.45 * bnc);',
      'float a9 = (1.0 - hl) * (0.82 + 0.18 * nz2) * (0.93 + 0.07 * gr);',
      'float in36 = 1.0 - F36 * smoothstep(0.02, 0.2, open) * step(' + Math.cos(W32.TH).toFixed(4) + ', vP.y); if (!gl_FrontFacing) { wash = mix(wash, vec3(0.34, 0.51, 0.79), 0.55 * (1.0 - 0.6 * op34) * in36); a9 = max(a9, 0.78 * (1.0 - 0.3 * op34) * in36); }',
      /* an open petal: the wash pools along its two edges, and the pen goes down them */
      'float pe = smoothstep(0.02, 0.2, open) * step(' + Math.cos(W32.TH).toFixed(4) + ', vP.y), au = abs(vU); wash = mix(wash, vec3(0.30, 0.46, 0.76), 0.75 * pe * smoothstep(0.55, 0.95, au + 0.2 * (nz - 0.5))); a9 = mix(a9, 1.0, pe * smoothstep(0.6, 0.95, au)); wash = mix(wash, vec3(0.17, 0.14, 0.13), pe * smoothstep(0.90, 0.96, au + 0.05 * (nz2 - 0.5)));',
      'float cupl = smoothstep(0.03, 0.15, open) * (1.0 - step(' + Math.cos(W32.TH).toFixed(4) + ', vP.y)) * smoothstep(0.90, 0.955, 1.0 - nv + 0.04 * (nz2 - 0.5)); wash = mix(wash, vec3(0.17, 0.14, 0.13), cupl); a9 = mix(a9, 1.0, cupl);',
      /* (builder 36) every open petal, the near ones too, is a thin lit sheet of wash: pale and lit in its middle with paper through it, the colour pooled at its edges (the pen is there already), no flat dark inside; going down it thins into the page as wash */
      'float p36 = F36 * pe; if (p36 > 0.001) { float mid = 1.0 - smoothstep(0.35, 0.9, au + 0.15 * (nz - 0.5)); wash = mix(wash, mix(vec3(0.70, 0.84, 0.96), vec3(0.97, 0.98, 1.0), 0.35 * smoothstep(0.1, 0.8, l9 + 0.3) * nz2), p36 * mid * 0.8); a9 = mix(a9, a9 * (0.42 + 0.3 * nz2), p36 * mid); a9 *= 1.0 - 0.5 * soak * p36 * mid; base = mix(base, PAPER31 * (0.975 + 0.03 * gr) * mix(1.0, dim, 0.5), p36 * (0.6 + 0.3 * smoothstep(0.0, 0.3, soak))); }',
      /* (builder 33) the petals soak into the page from their points; the cup goes last */ 'if (soak > 0.001) { float tp = (vP.y - CT33) / (1.0 - CT33), th = tp > 0.0 ? 1.12 - 1.25 * soak - tp : 1.55 - 1.6 * soak; float ns = 0.5 * (nz - 0.5) + 0.2 * (nz2 - 0.5); if (th + ns < 0.0) discard; float eg = 1.0 - smoothstep(0.0, 0.14, th + ns); wash = mix(wash, vec3(0.33, 0.50, 0.78), 0.7 * eg); a9 = mix(a9, 1.0, 0.6 * eg); }',
      'vec3 c9 = base * mix(vec3(1.0), wash, a9 * amt); float pl = 0.5;', '{ float k33 = l33.w, lt = smoothstep(0.05, 0.75, l9), sd = smoothstep(0.38, -0.3, l9), we = smoothstep(0.5, 0.92, 1.0 - nv) * smoothstep(0.0, 0.55, l9); c9 *= mix(vec3(1.0), vec3(1.0, 0.972, 0.91), 0.8 * lt * k33 * (1.0 - 0.7 * pl)); c9 *= mix(vec3(1.0), vec3(0.70, 0.72, 0.82), 0.5 * sd * k33 * (1.0 - pl) * (1.0 - 0.7 * p36)); c9 = mix(c9, base * vec3(1.0, 0.95, 0.84), 0.2 * we * k33 * (1.0 - pl)); }',
      'gl_FragColor = vec4(c9, 1.0); }'].join('\n').split('CT33').join(Math.cos(W32.TH).toFixed(4)) });
  X.sph.geometry.dispose(); X.sph.geometry = g; X.sph.material = m; X.NX = NX; X.NY = NY; X.k32 = true; X.tp = topo30(g); X.src = src30(X.tp, { mesh: X.sph, rs: 1, seed: 7700, o: { smooth: 2, min: 5, wob: 0.8 } }); }
make31 = (f0 => function (T, S) { const X = f0(T, S); if (on32()) { try { up32(T, X); } catch (x) { W32.err = 'up ' + String(x && x.stack); } } return X; })(make31);
/* closed it is a ball; open, each petal leans out from its hinge, cups, and curls its point back; the petals narrow to their points */
function shape32(X, open, flat) { const g = X.sph.geometry, pos = g.attributes.position, A = pos.array, NX = X.NX, NY = X.NY, T0 = X.T0, dT = (X.T1 - T0) / NY, TH = W32.TH, ih = Math.round((TH - T0) / dT), am = ih * dT, hw = 4 / NX * 2 * Math.PI;
  for (let ix = 0; ix <= NX; ix++) { const pk = Math.floor(ix / 9), c = ix - pk * 9, u = (c - 4) / 4, phc = (pk * 9 + 4) / NX * 2 * Math.PI, kp = Math.max(0, Math.min(1.2, open * 1.3 - 0.14 * (pk % 2) + 0.05 * Math.sin(pk * 2.3))), k1 = Math.min(1, kp), th = T0 + ih * dT, b0 = Math.PI - th; let r = Math.sin(th), y = Math.cos(th);
    for (let iy = NY; iy >= 0; iy--) { const i = 3 * (iy * (NX + 1) + ix), t2 = T0 + iy * dT; let ph = ix / NX * 2 * Math.PI; if (iy >= ih || kp < 0.001) { r = Math.sin(t2); y = Math.cos(t2); } else { const a = (ih - iy - 0.5) * dT, s = a / am, bo = 0.75 + 0.75 * Math.sin(2.8 * s) - 1.0 * s * s * s - 0.9 * (kp - k1) * s, be = (b0 + a) * (1 - k1) + bo * k1; r += Math.cos(be) * dT; y += Math.sin(be) * dT; ph = phc + u * hw * (1 - k1 * (0.06 + 0.8 * Math.pow(s, 2.2))); }
      const fl = KIT.one33 !== false ? 0.5 * flat : flat, yy = -1 + (y + 1) * (1 - 0.96 * fl), rr = Math.max(0, r) * (1 + 0.25 * flat); A[i] = -rr * Math.cos(ph); A[i + 1] = Math.max(-1, yy); A[i + 2] = rr * Math.sin(ph); } }
  pos.needsUpdate = true; g.computeVertexNormals(); const P = X.tp.P, F = X.tp.first; for (let w = 0; w < F.length; w++) { const i = 3 * F[w]; P[3 * w] = A[i]; P[3 * w + 1] = A[i + 1]; P[3 * w + 2] = A[i + 2]; } }
shape31 = (f0 => function (X, open, flat) { if (X.k32) return shape32(X, open, flat); return f0(X, open, flat); })(shape31);
stage31 = (f0 => function (S, X, grp, e, o, ks) { f0(S, X, grp, e, o, ks); if (!X.k32) return; const U = X.sph.material.uniforms; U.open.value = e.open; U.rpx.value = o.rpx32 || 60; U.dim.value = o.dim32 == null ? 1 : o.dim32; U.soak.value = KIT.one33 !== false ? e.flat || 0 : 0; if (KIT.one33 !== false) { U.amt.value = 1; X.gw.visible = false; } })(stage31);
KIT.spirit26.W32 = W32;
// ==== W32 END
// ==== W33 BEGIN
// (builder 33) WATER AND THE SCENE AS ONE PICTURE during the change of stage (AA.rxKit.one33, on by default; false or ?o33=0 gives builder 32's look).
// Here only what the water's own wash needs: the lamp (l33: where it is, seen from the eye, and how much of it there is) is read by the body's
// wash (F30) and the ball's (up32): the lit side is toward the lamp and warm, the far side takes the room's shade, a warm edge where the light
// grazes. The petals soak away from their points (soak) and keep their curl as they go down (shape32). scheme.js S33 does the rest.
KIT.one33 = KIT.one33 == null ? !(typeof location !== 'undefined' && /[?&]o33=0/.test(String(location.search))) : KIT.one33;
const W33 = { U: null, err: null };
function u33(T) { if (!W33.U) W33.U = { l33: { value: new T.Vector4(0, 0, 0, 0) } }; return W33.U; }
KIT.spirit26.W33 = W33; KIT.spirit26.u33 = u33; KIT.spirit26.grab29 = grab29; KIT.spirit26.u29 = u29;
// ==== W33 END
// ==== W34 BEGIN
// (builder 34) three small faults of Water's change of stage (AA.rxKit.fix34, on by default; false or ?f34=0 gives builder 33's back):
// the standing form's arm stays raised through the proud look (evo31's q.armR), clear of the molecule; an open petal is thin and lit on both
// faces (F34 / op34 in up32's wash); scheme.js S33 has the third (wet paper with soft uneven edges, small drips on the way home).
KIT.fix34 = KIT.fix34 == null ? !(typeof location !== 'undefined' && /[?&]f34=0/.test(String(location.search))) : KIT.fix34;
// (builder 36) AA.rxKit.fix36 (on by default; false or ?f36=0 gives builder 34's): the near petals of the open bud are thin lit sheets like the
// far ones (F36 / p36 / in36 in up32's wash); scheme.js has the rest (the whole form kept in the picture, smaller uneven wet patches).
KIT.fix36 = KIT.fix36 == null ? !(typeof location !== 'undefined' && /[?&]f36=0/.test(String(location.search))) : KIT.fix36;
// ==== W34 END
// ==== W35 BEGIN
// (builder 35, redrawn by builders 37, 38 and 39) ACID AS A MOUTH: the breaker, a wave of acid whose curl is its mouth, in five stages
// (AA.rxKit.acid35 = 'a'; off by default, so the game shows the old Acid; ?a35=a on the
// page sets it). Stills only: nothing here moves, acts or changes stage.
// (builder 39) A wave of acid seen from its side: it rises out of a lobed pool, the crest curls over and the hollow under the curl is its mouth
// (a dark far wall, open to the front-right), drips off the crest caught mid-fall are its teeth (pale), liquid sags down its back, one glint
// of an eye under the roof of the curl, two runs with hands in front (one up out of the pool, one from behind the curl). Five stages, SPEC35.a(o, stage):
// 1 a lick off the pool, 2 a low swell curling, 3 the breaker, 4 reared right over with both hands out, 5 a great breaker over a cavern.
// Under it the eaten wood: bleached grain, pits, a ragged scorched edge, the pool's wet rim, sunk into the bench. Each body is ONE closed skin
// (field35, nets35), a skinned mesh on five spine bones (bound, not posed). Pen builder 30's; wash Water's kind (mat35, F35).
KIT.acid35 = KIT.acid35 == null ? ((typeof location !== 'undefined' && (/[?&]a35=([abc])/.exec(String(location.search)) || [])[1]) || null) : KIT.acid35;   /* (builder 48) off by default again: the owner rejected the wave, so the game shows the old Acid; ?a35=a turns the living breaker on */
const W35 = { figs: [], scenes: typeof WeakSet !== 'undefined' ? new WeakSet() : null, err: null, ways: { a: 'the breaker' }, lw: 0.96, rot: [0.12, 0.05, 0, -0.1, 0.1] };
/* shapes: each gives its distance, a centre and reach (to skip it when far), and how softly it joins (k) */
const P35 = {
  ball(x, y, z, r, k) { return { c: [x, y, z], R: r, k: k == null ? 0.06 : k, f: (px, py, pz) => Math.hypot(px - x, py - y, pz - z) - r }; },
  ell(x, y, z, rx, ry, rz, k) { const mn = Math.min(rx, ry, rz); return { ax: [x, y, z, rx, ry, rz], c: [x, y, z], R: Math.max(rx, ry, rz), k: k == null ? 0.06 : k, f: (px, py, pz) => { const ax = (px - x) / rx, ay = (py - y) / ry, az = (pz - z) / rz, k0 = Math.hypot(ax, ay, az), k1 = Math.hypot(ax / rx, ay / ry, az / rz); return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -mn; } }; },
  /* a limb: a smooth line through [x, y, z, radius] points */
  tube(pts, k, closed) { const n = pts.length, g = i => closed ? pts[(i % n + n) % n] : pts[Math.max(0, Math.min(n - 1, i))], spans = closed ? n : n - 1, sub = n === 2 ? 1 : 5, S = [];
    for (let i = 0; i < spans; i++) for (let s = 0; s <= (i === spans - 1 ? sub : sub - 1); s++) { const u = s / sub, a = g(i - 1), b = g(i), c = g(i + 1), d = g(i + 2), q = [0, 1, 2, 3].map(j => 0.5 * (2 * b[j] + (c[j] - a[j]) * u + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * u * u + (3 * b[j] - 3 * c[j] + d[j] - a[j]) * u * u * u)); q[3] = Math.max(0.003, q[3]); S.push(q); }
    const m = S.length - 1, A = new Float64Array(m * 8), c = [0, 0, 0]; S.forEach(q => { c[0] += q[0] / S.length; c[1] += q[1] / S.length; c[2] += q[2] / S.length; }); let R = 0; S.forEach(q => { R = Math.max(R, Math.hypot(q[0] - c[0], q[1] - c[1], q[2] - c[2]) + q[3]); });
    for (let i = 0; i < m; i++) { A.set(S[i], 8 * i); A.set(S[i + 1], 8 * i + 4); }
    return { c, R, k: k == null ? 0.05 : k, f: (px, py, pz) => { let best = 1e9; for (let i = 0; i < m; i++) { const o = 8 * i, ax = A[o], ay = A[o + 1], az = A[o + 2], ra = A[o + 3], dx = A[o + 4] - ax, dy = A[o + 5] - ay, dz = A[o + 6] - az, l2 = dx * dx + dy * dy + dz * dz || 1e-9; let u = ((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / l2; u = u < 0 ? 0 : u > 1 ? 1 : u; const dd = Math.hypot(px - ax - dx * u, py - ay - dy * u, pz - az - dz * u) - (ra + (A[o + 7] - ra) * u); if (dd < best) best = dd; } return best; } }; },
  cone(a, b, ra, rb, k) { return P35.tube([[a[0], a[1], a[2], ra], [b[0], b[1], b[2], rb]], k == null ? 0.015 : k); }
};
/* the whole body as one field: shapes joined softly in order, carved where o.cut, cut off flat at the bench */
function field35(ops) { const n = ops.length; return (x, y, z) => { let d = 1e9; for (let i = 0; i < n; i++) { const o = ops[i], c = o.c, far = Math.hypot(x - c[0], y - c[1], z - c[2]) - o.R, k = o.k; if (o.cut) { if (far > k + 0.02) continue; const v = o.f(x, y, z), h = Math.max(k - Math.abs(d + v), 0) / k; d = Math.max(d, -v) + h * h * k * 0.25; } else { if (far > d + k) continue; const v = o.f(x, y, z), h = Math.max(k - Math.abs(d - v), 0) / k; d = Math.min(d, v) - h * h * k * 0.25; } } return Math.max(d, -y); }; }
/* the skin over the field: one point in every cell the surface passes through, joined across every crossed grid edge (so it is closed and welded) */
function nets35(F, bb, h) { const nx = Math.ceil((bb[3] - bb[0]) / h) + 1, ny = Math.ceil((bb[4] - bb[1]) / h) + 1, nz = Math.ceil((bb[5] - bb[2]) / h) + 1, V = new Float32Array(nx * ny * nz);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) V[i + nx * (j + ny * k)] = F(bb[0] + i * h, bb[1] + j * h, bb[2] + k * h);
  const cx = nx - 1, cy = ny - 1, cz = nz - 1, cid = new Int32Array(cx * cy * cz).fill(-1), P = [], v = new Float32Array(8);
  for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) { let ins = 0; for (let c = 0; c < 8; c++) { v[c] = V[i + (c & 1) + nx * (j + ((c >> 1) & 1) + ny * (k + ((c >> 2) & 1)))]; if (v[c] < 0) ins++; } if (ins === 0 || ins === 8) continue;
    let sx = 0, sy = 0, sz = 0, m = 0; for (let a = 0; a < 8; a++) for (let bit = 1; bit < 8; bit <<= 1) { if (a & bit) continue; const b = a | bit; if ((v[a] < 0) === (v[b] < 0)) continue; const u = v[a] / (v[a] - v[b]); sx += (a & 1) + (bit === 1 ? u : 0); sy += ((a >> 1) & 1) + (bit === 2 ? u : 0); sz += ((a >> 2) & 1) + (bit === 4 ? u : 0); m++; }
    cid[i + cx * (j + cy * k)] = P.length / 3; P.push(bb[0] + (i + sx / m) * h, bb[1] + (j + sy / m) * h, bb[2] + (k + sz / m) * h); }
  const I = [], C = (i, j, k) => cid[i + cx * (j + cy * k)], quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) I.push(a, c, b, a, d, c); else I.push(a, b, c, a, c, d); };
  for (let k = 1; k < cz; k++) for (let j = 1; j < cy; j++) for (let i = 1; i < cx; i++) { const s0 = V[i + nx * (j + ny * k)] < 0;
    if (s0 !== (V[i + 1 + nx * (j + ny * k)] < 0)) quad(C(i, j - 1, k - 1), C(i, j, k - 1), C(i, j, k), C(i, j - 1, k), !s0);
    if (s0 !== (V[i + nx * (j + 1 + ny * k)] < 0)) quad(C(i - 1, j, k - 1), C(i - 1, j, k), C(i, j, k), C(i, j, k - 1), !s0);
    if (s0 !== (V[i + nx * (j + ny * (k + 1))] < 0)) quad(C(i - 1, j - 1, k), C(i, j - 1, k), C(i, j, k), C(i - 1, j, k), !s0); }
  return { P, I }; }
const hh35 = i => { const s = Math.sin(i * 12.9898 + 4.1) * 43758.5453; return s - Math.floor(s); };
/* THE FIVE FIGURES. Front to +z, standing on y = 0, about one unit to the top of a stage 3. */
const SPEC35 = (() => { const b = P35.ball, e = P35.ell, t = P35.tube, cone = P35.cone;
  /* the pool it rises from: a flat lobed spill, never a neat disc */
  const pool = (o, x, z, rx, rz, sd) => { o.a(e(x, 0, z, rx * 0.78, 0.06, rz * 0.78, 0.07)); for (let i = 0; i < 7; i++) { const a = i / 7 * 2 * PI + hh35(sd + i) * 0.7, d = 0.6 + 0.26 * hh35(sd + i + 20), rr = 0.26 + 0.18 * hh35(sd + i + 40); o.a(e(x + Math.cos(a) * rx * d, 0, z + Math.sin(a) * rz * d, rx * rr, 0.042 + 0.02 * hh35(sd + i + 60), rz * rr, 0.07)); } o.pr = [rx, rz]; o.pc = [x, z]; };
  /* a drip running off it (painted the sharper green toward the bead) */
  const drip = (o, x, y, z, len, r, lx, lz) => { lx = lx || 0; lz = lz || 0; (o.dps || (o.dps = [])).push([x + lx, y - len, z + lz, r * 0.66]); o.d(t([[x, y, z, r], [x + lx * 0.35, y - len * 0.42, z + lz * 0.35, r * 0.55], [x + lx * 0.78, y - len * 0.8, z + lz * 0.78, r * 0.4]], 0.025), y, y - len); o.d(b(x + lx, y - len, z + lz, r * 0.66, 0.02), y, y - len); };
  /* (builder 39) a tooth: a drip off the crest caught mid-fall, a neck pinched almost through and a bead below it; not a drip in the paint, so it
     stays pale (bare paper inside the mouth) and the pen finds its edge against the dark */
  /* (builder 42) one clean pale drip: broad at the roof, tapering smoothly to a round tip, no pinched neck (the neck drew as pen loops) */
  const tooth = (o, x, y, z, len, r, lx) => { lx = lx || 0; len *= 1.2; r *= 1.45; const q1 = o.a(t([[x, y + r, z, r * 1.25], [x + lx * 0.4, y - len * 0.45, z, r * 0.9], [x + lx * 0.85, y - len * 0.85, z, r * 0.66]], 0.05)), q2 = o.a(b(x + lx, y - len, z, r * 0.7, 0.05)); q1.th = q2.th = 1; q1.ty = q2.ty = y + r; (o.teeth || (o.teeth = [])).push([x + lx, y - len - r * 0.7, z, r * 0.62]); };   /* (builder 44) a tooth keeps its root (ty) and its tip, where drips form */
  /* an arm as a thick run of liquid; its fingers are runs off the end */
  const arm = (o, pts, fing) => { const ao = [o.a(t(pts, 0.08))]; (o.arms || (o.arms = [])).push({ pts, ops: ao }); const L = pts[pts.length - 1]; fing.forEach(v => ao.push(o.a(t([[L[0], L[1], L[2], L[3] * 0.66], [L[0] + v[0] * 0.6, L[1] + v[1] * 0.6, L[2] + v[2] * 0.6, L[3] * 0.48], [L[0] + v[0], L[1] + v[1], L[2] + v[2], L[3] * (v[3] || 0.36)]], 0.035)))); };
  /* spray off the crest: a neck flung up to a bead */
  const spike = (o, x, y, z, dx, dy, dz, r) => { dx = dx * 1.3 + 0.05; dy *= 0.6; r *= 0.85; o.d(t([[x, y, z, r], [x + dx * 0.4, y + dy * 0.5, z + dz * 0.4, r * 0.55], [x + dx * 0.85, y + dy * 0.88, z + dz * 0.85, r * 0.4]], 0.03), y, y + dy); o.d(b(x + dx, y + dy, z + dz, r * 0.7, 0.02), y, y + dy); };
  /* the wave: the same profile (base at the back, over the crest, down to the tip) laid as ribs across its breadth; the ends of the breadth
     slump lower and thinner, so the crest is not a slab and dips at its sides */
  const wave = (o, prof, zr, nr, sd, rag, z0) => { rag = rag || 0; const w2 = !!z0; z0 = z0 || 0; for (let i = 0; i < nr; i++) { const zn = nr > 1 ? -1 + 2 * i / (nr - 1) : 0, z = zn * zr, en = 1 - 0.5 * zn * zn, dx = 0.025 * zn + 0.025 * (hh35(sd + i) - 0.5), ys = 0.88 + 0.12 * en + 0.5 * rag * (hh35(sd + i * 7 + 3) - 0.5);
    o.a(t(prof.map((p, j) => { const f = j / (prof.length - 1); return [p[0] + dx * f, p[1] * (1 - f * (1 - ys)), z0 + z * (1 - 0.18 * f), p[2] * (0.8 + 0.2 * en)]; }), 0.16)).w2 = w2; } };   /* (builder 44) w2: the second wave behind */
  /* liquid sagging down its back: a run that thickens as it falls, into the pool */
  const sag = (o, x0, y0, x1, y1, z, r) => o.d(t([[x0, y0, z, r * 0.5], [(x0 + x1) / 2 - 0.04, (y0 + y1) / 2, z, r * 0.85], [x1, y1, z, r * 1.15], [x1 - 0.05, 0.04, z, r * 0.9]], 0.06), y0, 0.04);
  /* the low lip of the trough under the curl: two ribs, rising a little at the front, no jaw line */
  const lip = (o, pts, zs) => zs.forEach((z, i) => o.a(t(pts.map(p => [p[0] - 0.04 * i, p[1] * (1 - 0.15 * i), z, p[2] * (1 - 0.1 * i)]), 0.1)));
  /* (builder 40) THE MOUTH: a long slot under the curl, never a round pit. A wall of liquid fills the hollow from the back (o.a, an ellipsoid over
     the path's span, deep in z) and a channel is cut into it from the front along the path ([x, y, r] points), so the opening is long and low,
     open to the front and out past the tip; its back wall sits at z = zb. o.my keeps its height for the wash (lit at the top, dark below). */
  const mouth = (o, path, zb, fy, fz) => { fy = fy == null ? 0.16 : fy; fz = fz == null ? 0.42 : fz; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; path.forEach(p => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1] - p[2]); y1 = Math.max(y1, p[1] + p[2]); });
    const fx1 = path[path.length - 2][0]; o.a(e((x0 + fx1) / 2, (y0 + y1) / 2, zb - fz + 0.12, (fx1 - x0) / 2 + 0.08, (y1 - y0) / 2 + fy, fz, 0.1));
    [0, 0.34].forEach(dz => o.c(t(path.map(p => [p[0], p[1], zb + p[2] + dz, p[2]]), 0.03), 1)); o.my = [y0, y1]; };
  /* a strand of acid hung across the mouth, roof to floor, thin in the middle (grown back inside the cut, so pale like the teeth) */
  const strand = (o, x, y0, y1, z, r) => o.a(t([[x, y0, z, r], [x + 0.02, (y0 + y1) / 2 + 0.03, z, r * 0.5], [x - 0.01, y1, z, r * 0.9]], 0.03));
  const ST = [
    /* 1, a shy lick: a small lip of acid just lifted off its pit, peering out; the mouth a crack under the lip; no hands yet, two nubs on the wood */
    o => { pool(o, 0.04, 0.02, 0.5, 0.36, 11);
      wave(o, [[-0.52, 0.03, 0.11], [-0.3, 0.09, 0.14], [-0.08, 0.16, 0.15], [0.12, 0.25, 0.13], [0.27, 0.36, 0.1], [0.37, 0.45, 0.07], [0.42, 0.52, 0.05], [0.4, 0.57, 0.034]], 0.18, 3, 5);
      lip(o, [[-0.05, 0.05, 0.11], [0.25, 0.07, 0.09], [0.5, 0.1, 0.06]], [0.08]);
      mouth(o, [[-0.04, 0.19, 0.01], [0.1, 0.2, 0.034], [0.26, 0.215, 0.05], [0.44, 0.2, 0.046], [0.62, 0.18, 0.034]], 0.1, 0.08, 0.3);
      tooth(o, 0.3, 0.27, 0.22, 0.05, 0.016, 0.0);
      [[0.58, 0.035, 0.28, 0.052], [0.38, 0.03, 0.42, 0.046]].forEach(q => (o.arms || (o.arms = [])).push({ pts: [q], ops: [o.a(b(q[0], q[1], q[2], q[3], 0.04))], nub: 1 }));
      drip(o, 0.4, 0.57, 0.06, 0.07, 0.02, 0.02, 0);
      o.eye(0.08, 0.36, 0.014, { kind: 3, gl: -0.2 }); o.spr(0.34, 0.5, 0.04, 0.012);
      o.fume(-0.3, 0.2, -0.1, 0.18, -1); o.etch(0.02, 0.03, 1.0); },
    /* 2, a greedy swell: low and wide, leaning forward on both palms flat on the wood, the lower lip spread on the bench, the mouth a wide slot */
    o => { pool(o, 0.12, 0.02, 1.1, 0.6, 17);
      wave(o, [[-0.95, 0.03, 0.13], [-0.68, 0.15, 0.2], [-0.38, 0.32, 0.23], [-0.06, 0.47, 0.21], [0.24, 0.55, 0.17], [0.52, 0.53, 0.13], [0.74, 0.45, 0.09], [0.88, 0.34, 0.06], [0.92, 0.26, 0.04]], 0.3, 4, 9, 0.04);
      lip(o, [[-0.2, 0.05, 0.15], [0.25, 0.06, 0.12], [0.7, 0.07, 0.08], [1.08, 0.07, 0.05]], [0.1, -0.12]);
      mouth(o, [[-0.16, 0.22, 0.025], [-0.02, 0.22, 0.06], [0.18, 0.235, 0.07], [0.48, 0.23, 0.072], [0.78, 0.2, 0.062], [1.06, 0.17, 0.045]], 0.08);
      [[0.04, 0.33, 0.08, 0.026], [0.24, 0.335, 0.1, 0.03], [0.44, 0.33, 0.07, 0.026], [0.64, 0.3, 0.09, 0.026]].forEach(q => tooth(o, q[0], q[1], 0.3, q[2], q[3], 0.01));
      arm(o, [[-0.3, 0.2, 0.36, 0.1], [0.15, 0.1, 0.6, 0.085], [0.55, 0.05, 0.7, 0.075], [0.82, 0.04, 0.72, 0.065]], [[0.13, -0.02, -0.05], [0.15, -0.02, 0.04], [0.08, -0.02, 0.13, 0.42]]);
      arm(o, [[0.0, 0.24, -0.34, 0.1], [0.5, 0.14, -0.46, 0.085], [0.95, 0.06, -0.42, 0.075], [1.18, 0.04, -0.3, 0.065]], [[0.13, -0.02, -0.05], [0.15, -0.02, 0.04], [0.08, -0.02, 0.13, 0.42]]);
      sag(o, -0.3, 0.45, -0.62, 0.18, 0.22, 0.05); sag(o, -0.1, 0.5, -0.45, 0.2, -0.2, 0.045);
      o.eye(-0.04, 0.52, 0.016, { kind: 3, gl: -0.4 }); o.spr(0.62, 0.7, 0.04, 0.016); o.spr(0.34, 0.74, 0.0, 0.012);
      o.fume(-0.4, 0.4, -0.1, 0.26, -1); o.etch(0.14, 0.03, 1.5); },
    /* (builder 42) 3, the breaker (the earlier set's wave): a long slope of liquid up the back, the crest curling over, the mouth the long hollow
       under the curl (open to the front, far wall lit at the top), five pale teeth off its roof, one hand rising out of the pool in front, the
       other reaching forward from behind the curl */
    o => { pool(o, -0.06, 0.02, 0.86, 0.52, 21);
      wave(o, [[-1.1, 0.03, 0.14], [-0.86, 0.2, 0.24], [-0.62, 0.5, 0.27], [-0.4, 0.84, 0.23], [-0.12, 1.06, 0.17], [0.2, 1.12, 0.125], [0.46, 1.05, 0.09], [0.62, 0.94, 0.062], [0.66, 0.83, 0.042]], 0.26, 4, 3, 0.05);
      lip(o, [[-0.15, 0.06, 0.19], [0.22, 0.1, 0.15], [0.52, 0.14, 0.1], [0.78, 0.18, 0.06]], [0.08, -0.15]);
      mouth(o, [[-0.42, 0.5, 0.04], [-0.26, 0.52, 0.11], [0.0, 0.54, 0.14], [0.3, 0.54, 0.15], [0.58, 0.52, 0.14], [0.72, 0.5, 0.12], [1.1, 0.48, 0.1]], 0.06, 0.1);
      [[-0.1, 0.12, 0.036], [0.1, 0.17, 0.04], [0.3, 0.11, 0.034], [0.48, 0.15, 0.034]].forEach((q, i) => tooth(o, q[0], [0.645, 0.67, 0.675, 0.65][i], 0.3, q[1], q[2], 0.01));
      [[0.14, 0.42], [0.42, 0.4]].forEach(q => o.a(cone([q[0], q[1] - 0.06, 0.3], [q[0] - 0.02, q[1] + 0.06, 0.32], 0.034, 0.012)));
      spike(o, -0.02, 1.2, 0.02, 0.04, 0.14, 0.02, 0.03); spike(o, 0.3, 1.18, 0.08, 0.14, 0.1, 0.02, 0.028); spike(o, 0.5, 1.06, 0.06, 0.16, 0.06, 0.03, 0.024);
      drip(o, 0.66, 0.83, 0.12, 0.12, 0.032, 0.02, 0);
      sag(o, -0.5, 0.82, -0.86, 0.3, 0.22, 0.07); sag(o, -0.26, 1.0, -0.66, 0.5, -0.2, 0.06);
      arm(o, [[0.86, 0.03, 0.4, 0.12], [1.02, 0.18, 0.48, 0.1], [1.16, 0.34, 0.46, 0.085], [1.26, 0.48, 0.4, 0.075]], [[0.1, 0.12, -0.04], [0.15, 0.04, -0.02], [-0.02, 0.15, 0.04, 0.42]]);
      arm(o, [[-0.24, 0.66, -0.36, 0.12], [0.22, 0.86, -0.48, 0.1], [0.68, 0.94, -0.44, 0.085], [0.98, 0.98, -0.32, 0.075]], [[0.13, 0.08, 0.04], [0.15, -0.03, 0.06], [0.04, 0.14, 0.08, 0.42]]);
      o.eye(-0.22, 0.98, 0.018, { kind: 3, gl: -0.5 }); o.spr(0.74, 1.08, 0.06, 0.022); o.spr(0.5, 1.3, 0.0, 0.018); o.spr(0.2, 1.36, 0.0, 0.013);
      o.fume(-0.5, 0.75, -0.1, 0.36, -1); o.etch(0.0, 0.03, 1.75); },
    /* (builder 42) 4, the tall wave reared right over (the earlier set's), taller and leaning further forward than 3: the curl hangs out over a
       long wide hollow, five teeth, both hands thrust out in front of the opening, spray off the crest */
    o => { pool(o, -0.04, 0.02, 0.9, 0.56, 41);
      wave(o, [[-1.0, 0.04, 0.16], [-0.78, 0.36, 0.27], [-0.62, 0.8, 0.29], [-0.46, 1.2, 0.25], [-0.22, 1.52, 0.19], [0.1, 1.66, 0.14], [0.42, 1.6, 0.105], [0.68, 1.42, 0.08], [0.86, 1.22, 0.06], [0.92, 1.08, 0.044], [0.9, 0.98, 0.032]], 0.3, 4, 27, 0.08);
      lip(o, [[-0.18, 0.06, 0.21], [0.24, 0.11, 0.16], [0.58, 0.16, 0.11], [0.9, 0.2, 0.07]], [0.08, -0.17]);
      mouth(o, [[-0.46, 0.64, 0.05], [-0.28, 0.67, 0.13], [0.0, 0.7, 0.17], [0.34, 0.7, 0.18], [0.66, 0.68, 0.17], [0.86, 0.66, 0.14], [1.28, 0.62, 0.11]], 0.08, 0.12);
      [[-0.16, 0.16, 0.042], [0.1, 0.24, 0.048], [0.36, 0.14, 0.04], [0.6, 0.2, 0.04]].forEach((q, i) => tooth(o, q[0], [0.8, 0.85, 0.86, 0.83][i], 0.32, q[1], q[2], 0.01));
      [[0.06, 0.5], [0.46, 0.48]].forEach(q => o.a(cone([q[0], q[1] - 0.07, 0.32], [q[0] - 0.02, q[1] + 0.07, 0.34], 0.038, 0.012)));
      [[-0.14, 1.7, 0.0, -0.02, 0.16, 0.02, 0.032], [0.2, 1.76, 0.08, 0.1, 0.14, 0.02, 0.03], [0.5, 1.64, 0.04, 0.17, 0.1, 0.03, 0.026], [0.74, 1.4, 0.12, 0.17, 0.02, 0.03, 0.022]].forEach(q => spike(o, q[0], q[1], q[2], q[3], q[4], q[5], q[6]));
      drip(o, 0.9, 0.98, 0.14, 0.14, 0.032, 0.02, 0);
      sag(o, -0.58, 1.12, -0.9, 0.42, 0.26, 0.08); sag(o, -0.36, 1.36, -0.72, 0.7, -0.24, 0.07); sag(o, -0.7, 0.8, -0.96, 0.28, 0.0, 0.06);
      arm(o, [[1.0, 0.03, 0.46, 0.12], [1.18, 0.24, 0.56, 0.1], [1.34, 0.46, 0.52, 0.088], [1.46, 0.6, 0.44, 0.078]], [[0.14, 0.08, -0.04], [0.16, -0.02, -0.02], [0.08, 0.14, 0.06, 0.42]]);
      arm(o, [[-0.2, 0.92, -0.42, 0.13], [0.3, 1.08, -0.56, 0.11], [0.84, 1.08, -0.5, 0.09], [1.22, 0.98, -0.3, 0.08]], [[0.14, 0.08, 0.06], [0.16, -0.04, 0.08], [0.04, 0.15, 0.1, 0.42]]);
      o.eye(-0.34, 1.42, 0.02, { kind: 3, gl: -0.5 }); [[0.96, 1.5, 0.06, 0.022], [0.5, 1.94, 0.0, 0.02], [1.04, 1.24, 0.1, 0.016], [0.1, 1.98, 0.0, 0.014]].forEach(q => o.spr(q[0], q[1], q[2], q[3]));
      o.fume(-0.6, 0.95, -0.1, 0.42, -1); o.fume(0.0, 1.78, -0.2, 0.3, 1); o.etch(0.02, 0.03, 2.05); },
    /* 5, the standing sea: a great slow wave leaning back, a cavern of a mouth hung with strands, one hand resting on the lower lip, a second
       smaller wave rising behind it out of the same pool, the wood eaten wide; sated and vast */
    /* (builder 42) the game fits a stage by its width as well as its height: the pool and the second wave are drawn in closer and the crest
       raised, so the standing sea stands taller in the game than the rip curl */
    o => { pool(o, -0.5, 0.02, 1.0, 0.62, 55);
      wave(o, [[-1.6, 0.04, 0.2], [-1.42, 0.5, 0.3], [-1.24, 1.05, 0.32], [-1.04, 1.6, 0.28], [-0.8, 2.04, 0.23], [-0.47, 2.32, 0.18], [-0.08, 2.38, 0.14], [0.22, 2.24, 0.1], [0.42, 1.98, 0.075], [0.48, 1.74, 0.05], [0.42, 1.6, 0.035]], 0.4, 5, 61, 0.06);
      wave(o, [[-1.8, 0.03, 0.14], [-1.66, 0.42, 0.24], [-1.56, 0.9, 0.24], [-1.46, 1.32, 0.2], [-1.3, 1.64, 0.15], [-1.08, 1.72, 0.11], [-0.9, 1.6, 0.08], [-0.84, 1.44, 0.05]], 0.22, 3, 77, 0.04, -0.5);
      o.a(e(-0.4, 1.2, -0.12, 0.8, 0.85, 0.36, 0.14)); lip(o, [[-0.6, 0.08, 0.3], [-0.1, 0.12, 0.24], [0.35, 0.2, 0.17], [0.72, 0.3, 0.1]], [0.12, -0.2]);
      mouth(o, [[-0.86, 0.6, 0.07], [-0.5, 0.78, 0.24], [-0.08, 0.86, 0.28], [0.3, 0.8, 0.25], [0.62, 0.66, 0.19], [0.92, 0.54, 0.13]], 0.04, 0.3, 0.5);
      [[-0.52, 1.0, 0.58, 0.026], [-0.16, 1.1, 0.6, 0.024], [0.2, 1.02, 0.58, 0.022], [0.5, 0.82, 0.5, 0.02]].forEach((q, i) => strand(o, q[0], q[1], q[2], 0.36 + 0.02 * i, q[3]));
      [[-0.68, 0.1, 0.032], [-0.34, 0.14, 0.038], [0.02, 0.1, 0.032], [0.36, 0.12, 0.034]].forEach((q, i) => tooth(o, q[0], 1.08 - 0.03 * i, 0.36, q[1], q[2], 0.01));
      arm(o, [[-1.0, 0.5, 0.42, 0.12], [-0.55, 0.36, 0.6, 0.1], [-0.1, 0.3, 0.64, 0.088], [0.25, 0.3, 0.6, 0.078]], [[0.14, -0.04, -0.02], [0.15, -0.06, 0.05], [0.06, -0.06, 0.13, 0.42]]);
      sag(o, -1.0, 1.5, -1.42, 0.5, 0.36, 0.09); sag(o, -0.7, 1.75, -1.25, 0.9, -0.34, 0.08); sag(o, -1.2, 1.0, -1.5, 0.3, 0.1, 0.07); sag(o, -0.5, 1.85, -1.0, 1.2, 0.22, 0.06);
      spike(o, -0.3, 2.46, 0.0, -0.04, 0.12, 0.0, 0.03); spike(o, 0.24, 2.3, 0.08, 0.1, 0.1, 0.02, 0.026);
      drip(o, 0.42, 1.6, 0.14, 0.18, 0.032, 0.02, 0); drip(o, -0.84, 1.44, -0.5, 0.14, 0.026, 0.02, 0);
      o.eye(-0.64, 2.0, 0.022, { kind: 3, gl: -0.5 }); [[0.4, 2.16, 0.06, 0.02], [-0.6, 2.3, 0.0, 0.016], [-1.2, 1.9, -0.3, 0.014]].forEach(q => o.spr(q[0], q[1], q[2], q[3]));
      o.fume(-1.0, 1.4, -0.1, 0.46, -1); o.fume(-1.5, 1.1, -0.4, 0.3, 1); o.etch(-0.45, 0.04, 2.6); }];
  /* (builder 40) one way only, the breaker, in five stages, each its own posture */
  return { a: (o, stage) => ST[Math.max(1, Math.min(5, stage | 0)) - 1](o) }; })();
/* one figure's skin, eye pits, marks and the pen's bubbles and fume, worked out once and kept */
const G35 = {};
function geo35(T, stage, way) { const key = way + stage; if (G35[key]) return G35[key]; const ops = [], eyes = [], fumes = [], etch = [], drips = [], spr = [];
  const o = { a: p => { ops.push(p); return p; }, c: (p, m) => { if (m === 1 && p.ax) { const [cx, cy, cz, rx, ry, rz] = p.ax; ops.push(P35.ell(cx - 0.22 * rx, cy + 0.08 * ry, cz - rz, rx * 0.8, ry * 0.76, 0.15, 0.06)); } p.cut = true; p.m = m; ops.push(p); return p; },   /* (builder 39) the far wall of the mouth: the cut opens into it, so the hollow is dark, never a hole to the wood */ d: (p, y0, y1) => { p.y0 = y0; p.y1 = y1; drips.push(p); ops.push(p); return p; }, eye: (x, y, r, q) => eyes.push(Object.assign({ x, y, r }, q)), fume: (x, y, z, len, s) => fumes.push([x, y, z, len, s]), etch: (x, z, r) => etch.push([x, z, r]), spr: (x, y, z, r) => spr.push([x, y, z, r]) };
  SPEC35[way](o, stage); const pr = o.pr || [0.5, 0.4], bb = [1e9, 0, 1e9, -1e9, -1e9, -1e9]; ops.forEach(p => { if (p.cut) return; bb[0] = Math.min(bb[0], p.c[0] - p.R); bb[2] = Math.min(bb[2], p.c[2] - p.R); bb[3] = Math.max(bb[3], p.c[0] + p.R); bb[4] = Math.max(bb[4], p.c[1] + p.R); bb[5] = Math.max(bb[5], p.c[2] + p.R); });
  const h = Math.max(0.0115, Math.max(bb[3] - bb[0], bb[4], bb[5] - bb[2]) / 140), pad = 3 * h; bb[0] -= pad; bb[1] = -pad; bb[2] -= pad; bb[3] += pad; bb[4] += pad; bb[5] += pad;
  /* the eyes: where a ray from in front meets the skin; a pit is sunk there */
  let F = field35(ops); const E = []; eyes.forEach(q => { let z = bb[5]; for (let k = 0; k < 900 && F(q.x, q.y, z) > 0; k++) z -= h * 0.25; const sy = q.sy || 1; E.push({ p: [q.x, q.y, z], r: q.r, sy, rot: q.rot || 0, kind: q.kind || 0, gl: q.gl == null ? 1 : q.gl });
    if (q.kind === 2) { const pit = P35.ell(q.x, q.y, z + q.r * 0.2, q.r * 1.05, q.r * sy * 1.1, q.r * 0.7, 0.03); pit.cut = true; pit.m = 0; ops.push(pit); } });
  F = field35(ops); const N = nets35(F, bb, h), P = N.P, nv = P.length / 3, H = bb[4] - pad, nor = new Float32Array(nv * 3), aq = new Float32Array(nv), ad = new Float32Array(nv), si = new Uint16Array(nv * 4), sw = new Float32Array(nv * 4), ep = h * 0.7, cuts = ops.filter(p => p.cut && p.m), tths = ops.filter(p => p.th);
  for (let i = 0; i < nv; i++) { const x = P[3 * i], y = P[3 * i + 1], z = P[3 * i + 2]; let nx = F(x + ep, y, z) - F(x - ep, y, z), ny = F(x, y + ep, z) - F(x, y - ep, z), nz = F(x, y, z + ep) - F(x, y, z - ep); const l = Math.hypot(nx, ny, nz) || 1; nor[3 * i] = nx / l; nor[3 * i + 1] = ny / l; nor[3 * i + 2] = nz / l;
    let q = 1e9; for (let c = 0; c < cuts.length; c++) q = Math.min(q, cuts[c].f(x, y, z)); aq[i] = q < -1.3 * h ? -1 : 1 - Math.max(0, Math.min(1, (Math.abs(q) - 0.4 * h) / (1.4 * h))); if (q < 0.5 * h) for (let c = 0; c < tths.length; c++) if (tths[c].f(x, y, z) < 0.9 * h) { aq[i] = -1; break; }   /* (builder 42) a tooth is tooth to the roof, never edged as the mouth's wall */   /* 1 on the carved wall of the mouth, -1 on what was grown back inside it (the teeth) */
    let dd = 0; for (let c = 0; c < drips.length; c++) { const p = drips[c]; if (Math.hypot(x - p.c[0], y - p.c[1], z - p.c[2]) > p.R + 2 * h) continue; if (p.f(x, y, z) < 1.6 * h) dd = Math.max(dd, 0.2 + 0.8 * Math.max(0, Math.min(1, (p.y0 - y) / (p.y0 - p.y1 || 1)))); } ad[i] = dd;   /* how far down a drip this point is */
    const u = Math.max(0, Math.min(3.999, y / H * 4)), i0 = Math.floor(u), f = u - i0; si[4 * i] = i0; si[4 * i + 1] = i0 + 1; sw[4 * i] = 1 - f; sw[4 * i + 1] = f; }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('normal', new T.BufferAttribute(nor, 3)); g.setAttribute('aQ', new T.BufferAttribute(aq, 1)); g.setAttribute('aD', new T.BufferAttribute(ad, 1)); g.setAttribute('skinIndex', new T.BufferAttribute(si, 4)); g.setAttribute('skinWeight', new T.BufferAttribute(sw, 4)); g.setIndex(new T.BufferAttribute(nv > 65535 ? new Uint32Array(N.I) : new Uint16Array(N.I), 1)); g.computeBoundingBox(); g.computeBoundingSphere();
  /* the pen's marks on the eaten wood: bubbles in the scorched ring, thin fume rising off its far side */
  const bub = [], smoke = [], ex = etch[0] || [0, 0, 1]; for (let i = 0; i < 5 + stage * 2; i++) { const a = hh35(stage * 31 + i) * 2 * PI, m = 1.0 + 0.32 * hh35(stage * 17 + i * 3); bub.push([ex[0] + Math.cos(a) * pr[0] * m, ex[1] + Math.sin(a) * pr[1] * m, (0.016 + 0.022 * hh35(stage * 7 + i * 5)) * (0.7 + 0.12 * stage)]); }
  [[-0.72, 1], [0.6, -1], [-0.1, 1]].slice(0, stage > 2 ? 3 : 2).forEach((q, i) => smoke.push([ex[0] + q[0] * pr[0] * 1.12, -Math.abs(pr[1]) * 0.62 + ex[1], (0.18 + 0.05 * stage) * (1 - 0.25 * i), q[1]]));
  return (G35[key] = { geo: g, H, E: E.slice(0, 8), fumes, etch, pr, bub, smoke, spr, nv, h, my: o.my || [0, 1], ops, o, stage }); }   /* (builder 44) ops and o (arms, teeth, drips, pool centre) kept for the rig */
const N35 = 'float H35(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }\nfloat N35(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(H35(i), H35(i + vec3(1, 0, 0)), f.x), mix(H35(i + vec3(0, 1, 0)), H35(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(H35(i + vec3(0, 0, 1)), H35(i + vec3(1, 0, 1)), f.x), mix(H35(i + vec3(0, 1, 1)), H35(i + vec3(1, 1, 1)), f.x), f.y), f.z); }\n';
const F35 = ['{ vec3 n9 = normalize(normal); float nv = clamp(dot(n9, normalize(vViewPosition)), 0.0, 1.0); vec3 bp = vB35 * k35;',
  'const vec3 PAPER = vec3(0.949, 0.929, 0.878), INK = vec3(0.169, 0.141, 0.125), PENCIL = vec3(0.353, 0.337, 0.306), ACID = vec3(0.40, 0.68, 0.16);',
  'float nz = N35(bp * 3.1), nz2 = N35(bp * 8.3 + 5.0), nz3 = N35(bp * 4.4 + 9.0), gr = H35(vec3(floor(gl_FragCoord.xy * 0.5), 1.0));',
  'float l9 = dot(n9, normalize(vec3(-0.6, 0.62, 0.5)));',
  'float hl = smoothstep(0.80, 0.88, l9 + 0.45 * (nz - 0.5));',                                    // bare paper on the lit side, a broken edge
  'hl = max(hl, smoothstep(0.86, 0.9, nz2) * smoothstep(0.15, 0.45, l9));',
  'float low = smoothstep(0.30, 0.0, bp.y) * (0.55 + 0.45 * nz);',
  'float ed = clamp(smoothstep(0.42, 0.95, 1.0 - nv + 0.35 * (nz - 0.5)), 0.0, 1.0);',              // the wash pools at the outline
  'float s2 = smoothstep(0.16, -0.18, l9 + 0.35 * (nz - 0.5));',                                    // a second wash in the shade
  'float bl = N35(bp * 2.1 + 3.0), ring = smoothstep(0.640, 0.662, bl) * (1.0 - smoothstep(0.668, 0.70, bl));',   // a bloom's hard edge
  'vec3 wash = mix(vec3(0.78, 0.92, 0.70), vec3(0.38, 0.68, 0.32), ed); wash = mix(wash, vec3(0.42, 0.63, 0.42), 0.65 * s2); wash = mix(wash, vec3(0.34, 0.60, 0.28), 0.55 * low); wash = mix(wash, vec3(0.56, 0.76, 0.50), 0.55 * ring);',
  'float a9 = (1.0 - hl) * (0.76 + 0.24 * nz2) * (0.94 + 0.06 * gr);',
  'a9 *= 1.0 - smoothstep(0.62, 0.68, nz3) * smoothstep(0.5, 0.25, nv) * (1.0 - low);',               // gaps inside the line
  'vec3 c9 = PAPER * (0.985 + 0.03 * gr) * mix(vec3(1.0), wash, a9);',
  'float al = mix(0.95, 1.0, clamp(max(max(ed * 1.3, low), max(s2, hl * 0.8)) + 0.15 * nz2, 0.0, 1.0));',   // thin in the middle of a lit form: the wood shows faintly
  /* fizz: a few small rings where it is eating */
  '{ vec3 g = bp * 9.0, ci = floor(g), cf = fract(g) - 0.5, off = (vec3(H35(ci + 1.3), H35(ci + 2.7), H35(ci + 4.1)) - 0.5) * 0.4; float rr = 0.12 + 0.18 * H35(ci + 7.7), dr = length(cf - off);',
  '  float bub = step(0.90, H35(ci)) * (smoothstep(rr - 0.07, rr - 0.03, dr) - smoothstep(rr, rr + 0.04, dr)); c9 = mix(c9, PAPER * vec3(0.36, 0.62, 0.30), 0.55 * bub * (1.0 - hl)); }',
  /* pencil in the shade */
  '{ float sh = smoothstep(0.06, -0.26, l9 + 0.2 * (nz - 0.5)), hh = dot(bp, vec3(0.74, 0.62, 0.26)) * 34.0 + 0.35 * nz, hd = abs(fract(hh) - 0.5), hm = smoothstep(0.26, 0.4, N35(bp * 5.3 + 2.0)); c9 = mix(c9, PENCIL, 0.55 * (1.0 - smoothstep(0.08, 0.22, hd)) * sh * hm); }',
  /* the mouth: its rim the sharp acid green, its inside dark wash */
  'float rim = smoothstep(0.06, 0.3, vQ) * (1.0 - smoothstep(0.5, 0.7, vQ)); c9 = mix(c9, PAPER * ACID, 0.85 * rim); al = max(al, rim);',
  'float inm = smoothstep(0.5, 0.66, vQ + 0.2 * (nz2 - 0.5)), my9 = clamp((vB35.y - m35.x) / max(1e-3, m35.y - m35.x), 0.0, 1.0);',
  /* (builder 40) inside the mouth: the far wall lit at its top and dark at its bottom, the roof darkest, liquid pooled on the floor with a pale glint */
  'vec3 dp = mix(vec3(0.10, 0.20, 0.12), vec3(0.46, 0.70, 0.38), smoothstep(0.3, 0.95, my9 + 0.15 * (nz - 0.5))); dp = mix(dp, vec3(0.08, 0.15, 0.10), smoothstep(-0.25, -0.65, n9.y));',
  'float fl9 = smoothstep(0.35, 0.75, n9.y); dp = mix(dp, mix(vec3(0.30, 0.56, 0.26), vec3(0.86, 0.95, 0.72), smoothstep(0.72, 0.9, nz2)), fl9); c9 = mix(c9, PAPER * dp, inm); al = max(al, inm);',
  /* the teeth: bare paper, going green toward the bead; and every drip the sharper green, strongest at its bead */
  'float tth = smoothstep(-0.25, -0.6, vQ); c9 = mix(c9, PAPER * (0.97 + 0.03 * nz2), tth * (0.6 + 0.4 * smoothstep(-0.2, 0.3, l9))); al = max(al, tth);',
  'float dk = smoothstep(0.15, 1.0, vD); c9 = mix(c9, PAPER * mix(vec3(0.62, 0.84, 0.40), ACID, dk), dk * (tth > 0.5 ? 0.75 * dk : 0.85)); al = max(al, dk);',
  /* the eyes, painted in the body\'s own space: kind 2 is a pit sunk in the liquid, dark wash pooled in it, a pale meniscus below, a pupil */
  'for (int i = 0; i < 8; i++) { vec4 ea = e35a[i], eb = e35b[i]; if (ea.w <= 0.0) continue; vec3 q = (vB35 - ea.xyz) / ea.w; float cr = cos(eb.y), sr = sin(eb.y); q.xy = vec2(cr * q.x + sr * q.y, -sr * q.x + cr * q.y); q.y /= eb.x;',
  '  if (eb.z > 2.5) { float d3 = length(vec3(q.xy, q.z * 0.2)), in3 = 1.0 - smoothstep(0.84, 1.0, d3); vec2 p3 = 0.3 * vec2(cos(eb.w), sin(eb.w)); vec3 bead = mix(PAPER * vec3(0.90, 0.98, 0.80), INK, 1.0 - smoothstep(0.40, 0.50, length(q.xy - p3))); c9 = mix(c9, bead, in3); al = max(al, in3); }',
  '  else if (eb.z > 1.5) { float d2 = length(vec3(q.xy, q.z * 0.25)), inn = 1.0 - smoothstep(0.9, 1.06, d2); vec3 pit = PAPER * mix(vec3(0.16, 0.28, 0.18), vec3(0.34, 0.54, 0.30), smoothstep(0.5, -0.7, q.y));',
  '    float men = smoothstep(0.5, 0.74, d2) * smoothstep(-0.05, -0.55, q.y) * (1.0 - smoothstep(0.9, 1.0, d2)); pit = mix(pit, PAPER * vec3(0.92, 0.98, 0.86), 0.9 * men);',
  '    vec2 pp = 0.34 * vec2(cos(eb.w), sin(eb.w)) * vec2(1.0, 1.0 / eb.x); float pu = (eb.w < 9.0 ? 1.0 : 0.0) * (1.0 - smoothstep(0.30, 0.38, length((q.xy - pp) * vec2(1.0, eb.x)))); pit = mix(pit, INK, pu);',
  '    pit = mix(pit, PAPER, pu * (1.0 - smoothstep(0.07, 0.11, length((q.xy - pp - vec2(-0.1, 0.08)) * vec2(1.0, eb.x)))));',
  '    float lid = smoothstep(0.76, 0.9, d2) * (1.0 - smoothstep(0.98, 1.08, d2)) * smoothstep(-0.25, 0.4, q.y); pit = mix(pit, INK, 0.9 * lid); c9 = mix(c9, pit, inn); al = max(al, inn); }',
  '  else { float dq = length(q), in1 = 1.0 - smoothstep(0.88, 1.0, dq); c9 = mix(c9, INK, in1); } }',
  'gl_FragColor = vec4(c9, al); }'].join('\n');
function mat35(T, G) { const m = new T.MeshStandardMaterial({ color: 0x000000, roughness: 1, metalness: 0, transparent: true }); m.skinning = true; m.depthWrite = true; const ea = [], eb = []; for (let i = 0; i < 8; i++) { const q = G.E[i]; ea.push(q ? new T.Vector4(q.p[0], q.p[1], q.p[2], q.r) : new T.Vector4(0, 0, 0, 0)); eb.push(q ? new T.Vector4(q.sy, q.rot, q.kind, q.gl) : new T.Vector4(1, 0, 0, 0)); }
  m.onBeforeCompile = sh => { sh.uniforms.e35a = { value: ea }; sh.uniforms.e35b = { value: eb }; sh.uniforms.k35 = { value: 1 }; sh.uniforms.m35 = { value: new T.Vector2(G.my[0], G.my[1]) }; sh.vertexShader = sh.vertexShader.replace('void main() {', 'attribute float aQ;\nattribute float aD;\nvarying float vQ;\nvarying float vD;\nvarying vec3 vB35;\nvoid main() { vQ = aQ; vD = aD; vB35 = position;');
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'uniform vec4 e35a[8];\nuniform vec4 e35b[8];\nuniform float k35;\nuniform vec2 m35;\nvarying float vQ;\nvarying float vD;\nvarying vec3 vB35;\n' + N35 + 'void main() {').replace(/}\s*$/, F35 + '\n}'); };
  m.customProgramCacheKey = () => 'a40'; return m; }
/* the wood it has eaten under it, in the wood's own surface: bleached and pitted inside, a scorched broken ring, an inked edge in places, the damp
   dark line where its pool meets the wood and its shadow to the back. Drawn under the body, so the thin wash shows it faintly through. */
function etch35(T, x, z, r, pr) { const m = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { sd: { value: x * 7.3 + z * 3.1 + r }, pq: { value: new T.Vector2(pr[0] / r, pr[1] / r) } }, vertexShader: 'varying vec2 vU;\nvoid main() { vU = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float sd;\nuniform vec2 pq;\nvarying vec2 vU;\n' + N35 + [
      /* (builder 39) eaten wood, sunk into the bench: the outline of the patch wanders far one way and hardly at all another */
      'void main() { vec2 w = vU + 0.24 * (vec2(N35(vec3(vU * 2.3, sd)), N35(vec3(vU * 2.3 + 5.0, sd + 3.0))) - 0.5) + 0.07 * (vec2(N35(vec3(vU * 9.0, sd)), N35(vec3(vU * 9.0 + 5.0, sd + 3.0))) - 0.5);',
      '  float a = atan(w.y, w.x), wob = 0.46 + 0.40 * N35(vec3(cos(a) * 1.4 + 3.0, sin(a) * 1.4, sd)) + 0.10 * N35(vec3(cos(a) * 6.0, sin(a) * 6.0, sd + 4.0)), r = length(w) / wob, m = 1.0 - smoothstep(0.97, 1.0, r);',
      /* the grain of the bench, bleached: streaks along x, pale where the acid ate the soft wood, brown left in the hard lines */
      '  float gw = N35(vec3(vU.x * 1.6, vU.y * 30.0 + 2.5 * N35(vec3(vU * 2.5, sd + 1.0)), sd + 2.0)), gs = smoothstep(0.38, 0.72, gw), n1 = N35(vec3(vU * 6.0, sd + 2.0)), n2 = N35(vec3(vU * 17.0, sd + 7.0));',
      '  float deep = 1.0 - smoothstep(0.2, 0.9, r); vec3 col = mix(vec3(0.62, 0.47, 0.31), vec3(0.86, 0.80, 0.68), gs * (0.55 + 0.45 * n1)); col = mix(col, vec3(0.70, 0.74, 0.58), 0.35 * deep * n1);',
      '  float al = m * (0.42 + 0.46 * gs) * (0.75 + 0.25 * n1);',
      /* sunk: the inner wall toward the lamp (left and front) in shade, the far wall catching light */
      '  vec2 dn = w / max(length(w), 1e-4); float wall = smoothstep(0.62, 0.92, r) * m, fl = dot(dn, vec2(-0.7, -0.7)); col = mix(col, vec3(0.30, 0.19, 0.11), 0.6 * wall * smoothstep(0.0, 0.7, fl)); col = mix(col, vec3(0.93, 0.88, 0.76), 0.5 * wall * smoothstep(0.0, 0.7, -fl)); al = max(al, 0.8 * wall);',
      /* pits drawn out along the grain, dark, a pale lip below each */
      '  vec2 g = vU * vec2(9.0, 22.0), ci = floor(g), cf = fract(g) - 0.5; float h0 = H35(vec3(ci, sd)); vec2 off = (vec2(H35(vec3(ci, sd + 1.0)), H35(vec3(ci, sd + 2.0))) - 0.5) * 0.4; vec2 pv = (cf - off) * vec2(1.0, 2.2); float pd = length(pv), pz = 0.08 + 0.12 * h0, zin = step(0.72, h0) * (1.0 - smoothstep(0.7, 0.9, r));',
      '  float pit = zin * (1.0 - smoothstep(pz, pz + 0.06, pd)), prm = zin * smoothstep(pz, pz + 0.05, pd) * (1.0 - smoothstep(pz + 0.06, pz + 0.14, pd)) * step(0.0, -pv.y); col = mix(col, vec3(0.16, 0.10, 0.05), 0.9 * pit); col = mix(col, vec3(0.96, 0.92, 0.80), 0.7 * prm); al = max(al, 0.9 * pit * m);',
      /* the scorched edge: a dark ragged band, broken in places, charred brown inside it, flecks of char beyond */
      '  float rg = 0.06 * (N35(vec3(cos(a) * 9.0, sin(a) * 9.0, sd + 12.0)) - 0.5), br = smoothstep(0.30, 0.46, N35(vec3(cos(a) * 2.6, sin(a) * 2.6, sd + 11.0)));',
      '  float sc = smoothstep(0.82, 0.9, r + rg) * (1.0 - smoothstep(0.98, 1.04, r + rg)), ch = smoothstep(0.7, 0.86, r + rg) * (1.0 - smoothstep(0.9, 0.98, r + rg));',
      '  col = mix(col, vec3(0.36, 0.20, 0.09), 0.7 * ch * br); col = mix(col, vec3(0.10, 0.06, 0.035), sc * (0.4 + 0.6 * br) * (0.7 + 0.5 * n2)); al = max(al, (0.95 * sc * (0.45 + 0.55 * br) + 0.6 * ch * br) * m);',
      '  vec2 g5 = vU * 11.0, c5 = floor(g5), f5 = fract(g5) - 0.5; float h5 = H35(vec3(c5, sd + 5.0)), z5 = 0.07 + 0.1 * H35(vec3(c5, sd + 6.0)), d5 = length((f5 - (vec2(H35(vec3(c5, sd + 7.0)), H35(vec3(c5, sd + 8.0))) - 0.5) * 0.5) * vec2(1.0, 1.8)), fk = step(0.8, h5) * step(1.0, r) * step(r, 1.35) * step(length(vU), 0.95) * (1.0 - smoothstep(z5, z5 + 0.04, d5));',
      '  col = mix(col, vec3(0.13, 0.08, 0.04), fk); al = max(al, 0.75 * fk);',
      /* the pool's wet rim on the wood: the damp dark band just outside it and a thin glistening line on it; and the shadow under the body */
      '  float pc = length(vU / pq) + 0.08 * (n1 - 0.5), wet = smoothstep(0.92, 1.0, pc) * (1.0 - smoothstep(1.0, 1.22, pc)), gls = 1.0 - smoothstep(0.0, 0.025, abs(pc - 1.06));',
      '  col = mix(col, vec3(0.20, 0.17, 0.09), 0.6 * wet); al = max(al, 0.42 * wet); col = mix(col, vec3(0.90, 0.95, 0.80), 0.6 * gls * smoothstep(0.3, 0.6, n2)); al = max(al, 0.5 * gls * smoothstep(0.3, 0.6, n2));',
      '  float sh = 1.0 - smoothstep(0.5, 1.12, length((vU - vec2(0.08, 0.1)) / (pq * vec2(1.06, 1.0)))); col = mix(col, vec3(0.08, 0.05, 0.03), 0.55 * sh); al = max(al, 0.38 * sh);',
      '  gl_FragColor = vec4(col, al); }'].join('\n') });
  const g = new T.PlaneGeometry(2 * r, 2 * r); g.rotateX(-PI / 2); g.computeBoundingSphere(); g.boundingBox = new T.Box3(new T.Vector3(-0.01, 0, -0.01), new T.Vector3(0.01, 0.01, 0.01)); /* the eaten wood does not count in the creature's size */ const q = new T.Mesh(g, m); q.userData.nobox = true; q.position.set(x, 0.012, z); q.renderOrder = 3; q.userData.plain = true; q.castShadow = false; return q; }
function acid35Fig(T, stage, way) { stage = Math.max(1, Math.min(5, stage | 0)) || 3; way = SPEC35[way] ? way : 'a'; const G = geo35(T, stage, way), top = new T.Group(), grp = new T.Group(), bones = []; top.add(grp);
  for (let i = 0; i < 5; i++) { const bn = new T.Bone(); bn.position.y = i ? G.H / 4 : 0; if (i) bones[i - 1].add(bn); bones.push(bn); }
  grp.scale.setScalar([1.55, 1.12, 1, 1, 1][stage - 1]); grp.rotation.y = W35.rot[stage - 1] || 0; const body = new T.SkinnedMesh(G.geo, mat35(T, G)); body.add(bones[0]); body.bind(new T.Skeleton(bones)); body.frustumCulled = false; body.castShadow = false; body.userData.plain = true; body.renderOrder = 19; grp.add(body);
  G.etch.forEach(q => grp.add(etch35(T, q[0], q[1], q[2], G.pr)));
  const S = { T, root: grp, body, bones, inv: body.skeleton.boneInverses, G: { geo: G.geo }, H: G.H, fumes: G.fumes, bub: G.bub, smoke: G.smoke, spr: G.spr, way, stage, jar: false }; S.pen = pen30(T, S); S.pen.body.seed = 3500 + stage * 97 + way.charCodeAt(0) * 13; S.pen.mesh.visible = true;
  body.onBeforeRender = (ren, scene) => { if (scene && scene.isScene) hook35(T, scene); };
  grp.userData.a35 = top.userData.a35 = S; W35.figs.push(S); if (W35.figs.length > 24) W35.figs.splice(0, W35.figs.length - 24); return top; }
/* a thread of fume as the pen draws it: a rise that leans, a break, then a curl over at the top (not the stock wavy line) */
function fume35(f, i) { const [x, y, z, hg, s] = f, A = [], B = [], lean = 0.22 * s; for (let k = 0; k <= 7; k++) { const u = k / 7 * 0.44; A.push([x + lean * hg * Math.pow(u, 1.5) - 0.05 * hg * s * Math.sin(u * PI * 1.6), y + hg * u, z]); }
  let last; for (let k = 0; k <= 7; k++) { const u = 0.56 + k / 7 * 0.3; last = [x + lean * hg * Math.pow(u, 1.5) - 0.05 * hg * s * Math.sin(u * PI * 1.6), y + hg * u, z]; B.push(last); }
  const c = 0.1 * hg, cx = last[0] + s * c, cy = last[1]; for (let k = 1; k <= 9; k++) { const th = s > 0 ? PI - k / 9 * 1.6 * PI : k / 9 * 1.6 * PI, rr = c * (1 - 0.4 * k / 9); B.push([cx + rr * Math.cos(th), cy + rr * Math.sin(th), z]); } return [A, B]; }
/* its line for this frame: the outline of the skin, the fume off it, the bubbles and fume on the eaten wood */
function draw35(T, S, ren, cam) { const R = S.pen, sz = ren.getDrawingBufferSize(W30.v2 || (W30.v2 = new T.Vector2())), Wd = sz.x, Ht = sz.y, sc = Ht / 720, pe = cam.projectionMatrix.elements, P10 = pe[10], P11 = pe[11];
  W30.m4 = W30.m4 || new T.Matrix4(); R.vp = (R.vp || new T.Matrix4()).multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); R.nv = 0; R.ni = 0; R.boil = 0;
  const mw = S.root.matrixWorld, ws = R.v.setFromMatrixScale(mw).x || 1, Hw = S.H * ws, d = 0.03 * Hw, v = R.v.setFromMatrixPosition(mw), u = R.v2.set(0, 1, 0).transformDirection(mw), e = R.vp.elements, pj = (x, y, z) => { const w = e[3] * x + e[7] * y + e[11] * z + e[15]; return [(e[0] * x + e[4] * y + e[8] * z + e[12]) / w * Wd / 2, (e[1] * x + e[5] * y + e[9] * z + e[13]) / w * Ht / 2]; }, a = pj(v.x, v.y, v.z), b = pj(v.x + u.x * Hw, v.y + u.y * Hw, v.z + u.z * Hw);
  const hpx = Math.hypot(b[0] - a[0], b[1] - a[1]), fs = Math.max(0.42, Math.min(1.7, hpx / (105 * sc))), lw = W30.lw * sc * Math.max(0.8, fs) * W35.lw, s2 = sc * Math.min(1.6, Math.max(0.5, fs)); R.lw = lw; R.hpx = hpx;
  R.body.o = { wob: 0.45, smooth: 4, min: 9 }; /* (builder 42) one even, steady line: little wobble, smoothed, no tiny scribbled runs */ proj30(R, R.body, R.vp, Wd, Ht, P10, P11, d, S.bones, S.inv);
  /* (builder 42) the teeth get their own thin edge: the body's line is drawn with the teeth left out, then the teeth alone with a fine nib */
  const B = R.body, C = B.C, tp = B.tp; if (!B.tq) { const aq = S.body.geometry.attributes.aQ, tq = []; tp.first.forEach((i, w) => { if (aq.getX(i) < -0.5) tq.push(w); }); B.tq = Int32Array.from(tq); B.cw = new Float32Array(tp.nv); }
  const tq = B.tq, cw = B.cw; for (let w = 0; w < tp.nv; w++) cw[w] = C[4 * w + 3]; for (let k = 0; k < tq.length; k++) C[4 * tq[k] + 3] = 0; sil30(R, B, lw, s2, Wd, Ht);
  if (tq.length) { for (let w = 0; w < tp.nv; w++) C[4 * w + 3] = 0; for (let k = 0; k < tq.length; k++) C[4 * tq[k] + 3] = cw[tq[k]]; const o0 = B.o; B.o = { wob: 0.3, smooth: 4, min: 4 }; sil30(R, B, lw * 0.42, s2, Wd, Ht); B.o = o0; }
  for (let w = 0; w < tp.nv; w++) C[4 * w + 3] = cw[w];
  const W = q => new T.Vector3(q[0], q[1], q[2]).applyMatrix4(mw);
  S.fumes.forEach((f, i) => fume35(f, i).forEach((seg, j) => free30(R, seg.map(W), lw * (j ? 0.42 : 0.55), s2, Wd, Ht, P10, P11, d, 9700 + i * 40 + j * 13, { smooth: 2, wob: 0.7 })));
  S.smoke.forEach((f, i) => fume35([f[0], 0.03, f[1], f[2], f[3]], i).forEach((seg, j) => free30(R, seg.map(W), lw * (j ? 0.34 : 0.42), s2, Wd, Ht, P10, P11, d, 9900 + i * 40 + j * 13, { smooth: 2, wob: 0.7 })));
  S.bub.forEach((q, i) => { const pts = []; for (let k = 0; k <= 10; k++) { const th = k / 10 * 2 * PI + i; pts.push(W([q[0] + q[2] * Math.cos(th), 0.02 + q[2] * 0.9 * (1 + Math.sin(th)), q[1] + q[2] * 0.25 * Math.sin(th)])); } free30(R, pts, lw * 0.36, s2, Wd, Ht, P10, P11, d, 9500 + i * 17, { smooth: 2, wob: 0.5 }); });
  (S.spr || []).forEach((q, i) => { const pts = []; for (let k = 0; k <= 10; k++) { const th = k / 10 * 2 * PI + i; pts.push(W([q[0] + q[3] * Math.cos(th), q[1] + q[3] * Math.sin(th), q[2]])); } free30(R, pts, lw * 0.5, s2, Wd, Ht, P10, P11, d, 9300 + i * 19, { smooth: 2, wob: 0.4 }); });   /* spray in flight, drawn by the pen */
  if (S.draw44) S.draw44(R, lw, s2, Wd, Ht, P10, P11, d, cam);   /* (builder 44) the moving marks: drips, bubbles, fume */
  R.pa.needsUpdate = R.ua.needsUpdate = R.ia.needsUpdate = true; R.mesh.geometry.setDrawRange(0, R.ni); }
function hook35(T, scene) { if (!W35.scenes || W35.scenes.has(scene)) return; W35.scenes.add(scene); const f0 = scene.onBeforeRender;
  scene.onBeforeRender = function (ren, sc, cam) { if (f0) f0.apply(this, arguments); for (let i = W35.figs.length - 1; i >= 0; i--) { const S = W35.figs[i]; let top = S.root; while (top.parent) top = top.parent; if (top !== sc || !shown30(S.root, null)) continue; try { if (S.tick) S.tick(ren, cam); if (KIT.skip33) continue; draw35(T, S, ren, cam); } catch (e) { W35.err = String(e && e.stack); } } }; }
KIT.acid35Fig = acid35Fig; KIT.ACID35 = W35;
/* behind the switch only: the bench figure of Acid is the breaker, at its stage */
KIT.build = (f0 => function (id, T, grp, tint, extra) { if (id === 'homacid' && KIT.acid35 && SPEC35[KIT.acid35]) { try { grp.add(acid35Fig(T, (extra && extra.stage) || 3, KIT.acid35)); return true; } catch (e) { W35.err = String(e && e.stack); } } return f0.apply(this, arguments); })(KIT.build);
// ==== W35 END
// ==== W44 BEGIN
// (builder 44) ACID ALIVE AT REST. The breaker's skin (geo35) gets its own rig: a pool skirt, five spine bones set at the mouth's floor and roof,
// a bone per hand (planted hands hang from the root, raised ones from the spine), and one for the second wave of stage 5. Weights are worked out
// once a stage on a copy of the skin (rig44). Each frame (pose44, from the scene hook before the pen) the wave heaves with the crest lagging the
// base, the roof of the mouth lifts and drops with it, the hands shift their grip or flex, the pool's edge creeps; drips swell at the teeth and
// the crest, fall and leave a wet mark on the wood; bubbles swell and pop on the rim; now and then one rises, pops and lets a thread of fume go.
// The pen follows because it reads the same bones. Behind the switch AA.rxKit.acid35 (= 'a').
const rn44 = typeof performance !== 'undefined' && performance.now ? performance.now.bind(performance) : Date.now;   /* the real clock, for timing only (a recorder may stop the page's clock) */
const W44 = { err: null, rate: 1, jar: 0.6, rig: {}, sun: [-16, 18, 4], ms: 0, n: 0 };
const sm44 = x => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };
const fr44 = x => x - Math.floor(x);
/* each stage's habit at rest: T heave period (s), A lean per level (rad), lag between levels (rad), M how far the roof of the mouth lifts */
const P44 = [null,
  { T: 1.9, A: 0.045, lag: 0.5, M: 0.03, peek: 1 },          // 1 timid and quick, peeks out and ducks
  { T: 3.4, A: 0.022, lag: 0.45, M: 0.035, rock: 1 },        // 2 low, rocking on its palms
  { T: 2.7, A: 0.048, lag: 0.6, M: 0.075, fret: 1 },         // 3 restless
  { T: 3.3, A: 0.03, lag: 0.65, M: 0.07, sway: 1, eager: 1 }, // 4 leaning and swaying, eager
  { T: 6.2, A: 0.024, lag: 0.8, M: 0.085, vast: 1 }];        // 5 slow and vast, the wave behind out of step
/* the rig of one stage, on a copy of its skin: bones (rest place, parent) and four weights a point */
function rig44(T, G) { const key = 'a' + G.stage; if (W44.rig[key]) return W44.rig[key];
  const o = G.o, ops = G.ops, h = G.h, H = G.H, my = G.my, geo = G.geo.clone(), pa = geo.attributes.position, nv = pa.count, F = field35(ops);
  const m0 = Math.max(0.05, my[0]), m1 = Math.min(H * 0.92, Math.max(m0 + 0.05, my[1])), L = [0, m0 * 0.5, m0, m1, m1 + 0.5 * (H - m1)];
  /* the spine runs through the body: each level's x is the middle of the skin at that height */
  const bx = L.map(y => { let s = 0, n = 0; for (let i = 0; i < nv; i++) { const yy = pa.getY(i); if (Math.abs(yy - y) < 0.06 * H + h) { s += pa.getX(i); n++; } } return n ? s / n : 0; });
  const pc = o.pc || [0, 0], B = [{ p: [pc[0], 0, pc[1]], par: -1, k: 'skirt' }]; L.forEach((y, i) => B.push({ p: [bx[i], y, 0], par: i ? i : -1, k: 's' + i }));
  const lev = y => { let k = 0; for (let i = 0; i < 5; i++) if (L[i] <= y) k = i; return k; };
  const arms = (o.arms || []).map((a, ai) => { const pts = a.pts, E = pts[pts.length - 1], low = E[1] < Math.max(0.12, m0 * 0.7), piv = a.nub || low ? E : pts[0], par = low ? (E[1] < 0.12 ? -1 : 1 + lev(E[1])) : 1 + lev(pts[0][1]);
    let len = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]); seg.push(l); len += l; }
    const b = B.length; B.push({ p: [piv[0], piv[1], piv[2]], par, k: 'hand' + ai }); return { b, pts, seg, len: len || 1, ops: a.ops, nub: !!a.nub, low, i: ai }; });
  const w2ops = ops.filter(p => p.w2 && !p.cut), mainOps = ops.filter(p => !p.w2 && !p.cut); let w2b = -1, H2 = 1; if (w2ops.length) { H2 = Math.max(...w2ops.map(p => p.c[1] + p.R)) * 0.9; let sx = 0, sz = 0; w2ops.forEach(p => { sx += p.c[0]; sz += p.c[2]; }); w2b = B.length; B.push({ p: [sx / w2ops.length, 0, sz / w2ops.length], par: -1, k: 'w2' }); }
  const teeth = ops.filter(p => p.th), fmin = (list, x, y, z) => { let d = 1e9; for (let k = 0; k < list.length; k++) { const p = list[k], c = p.c; if (Math.hypot(x - c[0], y - c[1], z - c[2]) - p.R > d) continue; d = Math.min(d, p.f(x, y, z)); } return d; };
  const si = new Uint16Array(nv * 4), sw = new Float32Array(nv * 4), W = [];
  for (let i = 0; i < nv; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); W.length = 0; let ye = y, tooth = false;
    for (let k = 0; k < teeth.length; k++) { const p = teeth[k]; if (Math.hypot(x - p.c[0], y - p.c[1], z - p.c[2]) > p.R + 2 * h) continue; if (p.f(x, y, z) < 1.5 * h) { ye = Math.max(ye, p.ty); tooth = true; } }
    /* by height along the spine */ const ks = tooth ? 0 : 1 - sm44((y - 0.025) / 0.1); let k0 = 4, f = 0; for (let k = 0; k < 4; k++) if (ye < L[k + 1]) { k0 = k; f = (ye - L[k]) / (L[k + 1] - L[k]); break; } f = sm44(f);
    if (k0 === 4) W.push([5, 1 - ks]); else { W.push([1 + k0, (1 - f) * (1 - ks)], [2 + k0, f * (1 - ks)]); } if (ks > 0) W.push([0, ks]);
    /* the hands */ let wa = 0, ab = -1; for (const a of arms) { const fa = fmin(a.ops, x, y, z); if (fa > 4 * h) continue; const near = 1 - sm44((fa - 1.2 * h) / (2.8 * h)); let wv = near;
      if (!a.nub) { let best = 1e9, ub = 0, acc = 0; for (let s = 1; s < a.pts.length; s++) { const A = a.pts[s - 1], C = a.pts[s], dx = C[0] - A[0], dy = C[1] - A[1], dz = C[2] - A[2], l2 = dx * dx + dy * dy + dz * dz || 1e-9; let u = ((x - A[0]) * dx + (y - A[1]) * dy + (z - A[2]) * dz) / l2; u = Math.max(0, Math.min(1, u)); const dd = Math.hypot(x - A[0] - u * dx, y - A[1] - u * dy, z - A[2] - u * dz); if (dd < best) { best = dd; ub = (acc + u * a.seg[s - 1]) / a.len; } acc += a.seg[s - 1]; }
        wv *= a.low ? sm44((ub - 0.3) / 0.6) : sm44((ub - 0.05) / 0.55); }
      if (wv > wa) { wa = wv; ab = a.b; } }
    if (wa > 0) { W.forEach(q => { q[1] *= 1 - wa; }); W.push([ab, wa]); }
    /* the wave behind */ if (w2b >= 0) { const f2 = fmin(w2ops, x, y, z); if (f2 < 6 * h) { const fm = fmin(mainOps, x, y, z), w = Math.max(0, Math.min(1, 0.5 - (f2 - fm) / (5 * h))) * sm44((y - 0.12 * H2) / (0.7 * H2)); if (w > 0) { W.forEach(q => { q[1] *= 1 - w; }); W.push([w2b, w]); } } }
    W.sort((a, b) => b[1] - a[1]); let tot = 0; for (let k = 0; k < 4 && k < W.length; k++) tot += W[k][1]; tot = tot || 1; for (let k = 0; k < 4; k++) { const q = W[k]; si[4 * i + k] = q ? q[0] : 0; sw[4 * i + k] = q ? q[1] / tot : 0; } }
  geo.setAttribute('skinIndex', new T.BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new T.BufferAttribute(sw, 4));
  /* the points that ride the skin (drip tips, spray, fume roots): each takes the weights of the skin point nearest to it */
  const near = (x, y, z) => { let bi = 0, bd = 1e9; for (let i = 0; i < nv; i++) { const d = (pa.getX(i) - x) ** 2 + (pa.getY(i) - y) ** 2 + (pa.getZ(i) - z) ** 2; if (d < bd) { bd = d; bi = i; } } return { s: Array.from(si.slice(4 * bi, 4 * bi + 4)), w: Array.from(sw.slice(4 * bi, 4 * bi + 4)) }; };
  const land = (x, y, z) => { let yy = y; for (let k = 0; k < 400 && yy > 0; k++) { if (F(x, yy, z) < 0) break; yy -= h * 0.5; } return Math.max(0, yy); };
  const src = []; (o.teeth || []).forEach((q, i) => src.push(Object.assign({ p: q, r: q[3], land: land(q[0], q[1] - q[3] * 2.2, q[2]), tooth: 1, i }, near(q[0], q[1] + q[3], q[2]))));
  (o.dps || []).forEach((q, i) => src.push(Object.assign({ p: q, r: q[3] * 1.1, land: land(q[0], q[1] - q[3] * 2.2, q[2]), tooth: 0, i: i + 20 }, near(q[0], q[1], q[2]))));
  const spr = (G.spr || []).map(q => Object.assign({ p: q }, near(q[0], q[1] - 2 * q[3], q[2]))), fum = (G.fumes || []).map(q => Object.assign({ p: q }, near(q[0], q[1], q[2])));
  return (W44.rig[key] = { geo, B, L, arms, w2b, src, spr, fum, H, nv }); }
/* a soft shadow under the body that moves with it, and a wet mark where a drop lands; both lie on the wood, under the body */
function flat44(T, kind) { const m = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { a: { value: 0 }, sd: { value: Math.random() * 9 } }, vertexShader: 'varying vec2 vU;\nvoid main() { vU = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float a;\nuniform float sd;\nvarying vec2 vU;\n' + N35 + (kind === 'sh'
      ? 'void main() { float r = length(vU); gl_FragColor = vec4(0.07, 0.045, 0.025, a * 0.36 * (1.0 - smoothstep(0.15, 1.0, r))); }'
      : 'void main() { float n = N35(vec3(vU * 3.0, sd)), r = length(vU) / (0.72 + 0.28 * n), m = 1.0 - smoothstep(0.82, 1.0, r), rim = smoothstep(0.55, 0.85, r) * m;\n  vec3 c = mix(vec3(0.24, 0.17, 0.08), vec3(0.88, 0.84, 0.70), 0.55 * (1.0 - smoothstep(0.0, 0.6, r)) * smoothstep(0.35, 1.0, 1.0 - a)); c = mix(c, vec3(0.12, 0.08, 0.04), rim * 0.7);\n  gl_FragColor = vec4(c, a * m * (0.45 + 0.4 * rim)); }') });
  const g = new T.PlaneGeometry(2, 2); g.rotateX(-PI / 2); g.computeBoundingSphere(); g.boundingBox = new T.Box3(new T.Vector3(-0.01, 0, -0.01), new T.Vector3(0.01, 0.01, 0.01)); const q = new T.Mesh(g, m); q.userData.nobox = true; q.userData.plain = true; q.castShadow = false; q.renderOrder = kind === 'sh' ? 4 : 5; q.position.y = kind === 'sh' ? 0.014 : 0.016; return q; }
/* the figure: the breaker at its stage, rigged and alive */
function acid44Fig(T, stage, ex) { stage = Math.max(1, Math.min(5, stage | 0)) || 3; const jar = !!(ex && ex.jar), G = geo35(T, stage, 'a'), R = rig44(T, G), top = new T.Group(), grp = new T.Group(); top.add(grp);
  grp.scale.setScalar([1.55, 1.12, 1, 1, 1][stage - 1]); grp.rotation.y = W35.rot[stage - 1] || 0;
  const mat = mat35(T, G), U = { t44: { value: 0 }, lamp44: { value: new T.Vector3(-0.6, 0.62, 0.5) } }; mat.onBeforeCompile = (f0 => sh => { f0(sh); Object.assign(sh.uniforms, U);
    sh.fragmentShader = sh.fragmentShader.replace('uniform float k35;', 'uniform float k35;\nuniform float t44;\nuniform vec3 lamp44;')
      .replace('float l9 = dot(n9, normalize(vec3(-0.6, 0.62, 0.5)));', 'float l9 = dot(n9, normalize(mix(vec3(-0.6, 0.62, 0.5), lamp44, 0.5)));')   /* lit from the bench lamp's side */
      .replace('float bub = step(0.90, H35(ci))', 'float bub = step(0.90, H35(ci + floor(t44 * (0.5 + H35(ci + 3.3)) + 9.0 * H35(ci + 5.1))))')   /* the fizz comes and goes */
      .replace('gl_FragColor = vec4(c9, al); }', 'c9 *= mix(vec3(0.92, 0.89, 0.84), vec3(1.02, 1.0, 0.95), smoothstep(-0.35, 0.6, l9));\ngl_FragColor = vec4(c9, al); }'); })(mat.onBeforeCompile);
  mat.customProgramCacheKey = () => 'a44'; if (jar) { mat.transparent = false; }
  const bones = R.B.map(q => { const b = new T.Bone(); b.position.fromArray(q.p); return b; }); R.B.forEach((q, j) => { if (q.par >= 0) { const P = R.B[q.par].p; bones[j].position.set(q.p[0] - P[0], q.p[1] - P[1], q.p[2] - P[2]); bones[q.par].add(bones[j]); } });
  const body = new T.SkinnedMesh(R.geo, mat); R.B.forEach((q, j) => { if (q.par < 0) body.add(bones[j]); }); body.bind(new T.Skeleton(bones)); body.frustumCulled = false; body.castShadow = false; body.userData.plain = true; body.renderOrder = 19; grp.add(body);
  const etch = []; G.etch.forEach(q => { const e = etch35(T, q[0], q[1], q[2], G.pr); if (jar) e.visible = false; etch.push(e); grp.add(e); });
  const S = { T, root: grp, body, bones, inv: body.skeleton.boneInverses, G: { geo: R.geo }, H: G.H, fumes: [], bub: [], smoke: [], spr: [], way: 'a', stage, jar, R, G35: G, U, rp: bones.map(b => b.position.clone()), t0: null, beads: [], marks: [], d44: {}, M4: Array.from({ length: bones.length }, () => new T.Matrix4()), v: new T.Vector3(), bub0: G.bub, smoke0: G.smoke, a44: true };
  S.pen = pen30(T, S); S.pen.body.seed = 3500 + stage * 97 + 97 * 13; S.pen.mesh.visible = true;
  /* drops: a bead for each place a drip forms, and a wet mark for each that lands on the wood */
  const bm = new T.MeshBasicMaterial({ color: 0x9ecc6b, transparent: !jar, opacity: 0.96 }), sg = new T.SphereGeometry(1, 12, 9); sg.boundingBox = new T.Box3(new T.Vector3(-0.01, 0, -0.01), new T.Vector3(0.01, 0.01, 0.01));
  R.src.forEach(() => { const m = new T.Mesh(sg, bm); m.visible = false; m.renderOrder = 20; m.userData.plain = true; m.userData.nobox = true; grp.add(m); S.beads.push(m); const k = flat44(T, 'wet'); k.visible = false; grp.add(k); S.marks.push(k); });
  if (!jar) { S.shadow = flat44(T, 'sh'); S.shadow.scale.set(G.pr[0] * 0.95, 1, G.pr[1] * 0.9); S.shadow.position.x = (G.o.pc || [0])[0]; grp.add(S.shadow); }
  body.onBeforeRender = (ren, scene) => { if (scene && scene.isScene) hook35(T, scene); };
  S.tick = (ren, cam) => pose44(S, cam); S.draw44 = (Rp, lw, s2, Wd, Ht, P10, P11, d, cam) => draw44(S, Rp, lw, s2, Wd, Ht, P10, P11, d, cam);
  grp.userData.a35 = top.userData.a35 = S; W35.figs.push(S); if (W35.figs.length > 24) W35.figs.splice(0, W35.figs.length - 24); return top; }
/* where a point that rides the skin is now, in the figure's own frame (grp) */
function at44(S, q, x, y, z, out) { const M = S.M4; let cx = 0, cy = 0, cz = 0; for (let k = 0; k < 4; k++) { const w = q.w[k]; if (!w) continue; const e = M[q.s[k]].elements; cx += w * (e[0] * x + e[4] * y + e[8] * z + e[12]); cy += w * (e[1] * x + e[5] * y + e[9] * z + e[13]); cz += w * (e[2] * x + e[6] * y + e[10] * z + e[14]); } return out.set(cx, cy, cz); }
const pulse44 = (t, P, off, up, hold, down) => { const u = fr44(t / P + off) * P; return u < up ? sm44(u / up) : u < up + hold ? 1 : u < up + hold + down ? 1 - sm44((u - up - hold) / down) : 0; };
/* one frame of the idle: a pure function of the clock, so any number of renders a frame agree */
function pose44(S, cam) { const c0 = rn44(), t0 = performance.now(), t = t0 / 1000 * (S.jar ? W44.jar : W44.rate), st = S.stage, p = P44[st], B = S.bones, rp = S.rp, R = S.R, TAU = 2 * PI;
  for (let j = 0; j < B.length; j++) { B[j].position.copy(rp[j]); B[j].rotation.set(0, 0, 0); B[j].scale.set(1, 1, 1); }
  const ph = TAU * t / p.T + 0.5 * Math.sin(TAU * t / (p.T * 2.9) + st), hv = k => Math.sin(ph - p.lag * k) + 0.28 * Math.sin(2 * (ph - p.lag * k) + 0.9), sc = S.jar ? 0.7 : 1;
  const cw = [0.35, 0.6, 0.85, 1.0, 1.0]; for (let i = 1; i <= 4; i++) B[1 + i].rotation.z = p.A * cw[i] * hv(i) * sc;
  let open = 0.5 + 0.5 * hv(2.4), lift = 0;
  if (p.peek) { const e = pulse44(t, 4.6, 0.3, 0.32, 1.1, 0.22), du = pulse44(t, 4.6, 0.3 - 1.64 / 4.6, 0.05, 0.4, 0.3); lift = 0.05 * e; B[3].rotation.z += 0.07 * e; B[4].rotation.z += 0.16 * e; B[5].rotation.z += 0.1 * e; open = Math.max(open * (1 - e), 0.9 * e); B[4].rotation.z += 0.02 * du * Math.sin(t * 38); B[2].rotation.z -= 0.05 * du; }
  if (p.rock) { const r = Math.sin(ph); B[1].position.x += 0.045 * r * sc; B[1].rotation.z = -0.025 * Math.sin(ph - 0.5) * sc; open = 0.5 + 0.5 * Math.sin(ph + 0.6); }
  if (p.fret) { const n = 0.5 * Math.sin(1.7 * t) + 0.3 * Math.sin(2.9 * t + 1) + 0.2 * Math.sin(4.3 * t + 2); B[3].rotation.z += 0.025 * n * sc; B[4].rotation.y = 0.05 * Math.sin(1.3 * t + 0.4) * sc; }
  if (p.sway) { const s = TAU * t / 4.6; B[2].rotation.x = 0.035 * Math.sin(s) * sc; B[3].rotation.x = 0.03 * Math.sin(s - 0.7) * sc; B[4].rotation.x = 0.03 * Math.sin(s - 1.3) * sc; B[2].rotation.z -= 0.02; }
  let lunge = 0; if (p.eager) { lunge = pulse44(t, 2.5, 0.1, 0.18, 0.12, 0.6); B[3].rotation.z -= 0.06 * lunge * sc; B[4].rotation.z -= 0.05 * lunge * sc; open = Math.max(open, lunge); }
  if (p.vast && R.w2b >= 0) { const w = TAU * t / 5.1 + 2.1; B[R.w2b].rotation.z = 0.05 * (Math.sin(w) + 0.25 * Math.sin(2 * w + 1)) * sc; B[R.w2b].rotation.x = 0.02 * Math.sin(w * 0.7) * sc; }
  /* the mouth: the roof of the hollow lifts as it rears and drops as it sags */
  B[2].position.y += lift; B[4].position.y += p.M * (open - 0.35) * sc; B[5].position.y += 0.35 * p.M * (open - 0.35) * sc;
  /* the pool's edge creeps */ B[0].scale.x = 1 + (0.03 * Math.sin(TAU * t / 4.3) + 0.015 * Math.sin(TAU * t / 2.1 + 1)) * sc; B[0].scale.z = 1 + (0.025 * Math.sin(TAU * t / 5.2 + 2) + 0.012 * Math.sin(TAU * t / 1.7)) * sc; B[0].rotation.y = 0.025 * Math.sin(TAU * t / 6.1) * sc;
  /* the hands: planted ones shift their grip now and then and flex; raised ones reach and curl */
  R.arms.forEach(a => { const b = B[a.b], i = a.i, Pg = 3.6 + 1.3 * i + 0.4 * st;
    if (a.low || a.nub) { const u = t / Pg + 0.37 * i, n = Math.floor(u), e = sm44((fr44(u) - 0.55) / 0.3), sd = (n % 2 ? 1 : -1), ev = fr44(u) > 0.55 && fr44(u) < 0.85 ? Math.sin(PI * (fr44(u) - 0.55) / 0.3) : 0, k = st === 1 ? 1.4 : 1;
      b.position.y += 0.03 * k * ev * sc; b.position.x += 0.025 * k * sd * (e - 0.5) * sc; b.position.z += 0.012 * k * sd * (e - 0.5) * sc; const fl = 1 + 0.07 * Math.sin(TAU * t / (st === 1 ? 0.9 : 1.7) + i * 2) * sc; b.scale.set(fl, 1 + 0.5 * (fl - 1), fl); b.rotation.y = 0.12 * sd * (e - 0.5) * sc; }
    else { const s = TAU * t / (2.3 + 0.6 * i) + i * 1.9, g = pulse44(t, Pg, 0.2 * i, 0.25, 0.2, 0.5); b.rotation.z = (0.09 * Math.sin(s) - 0.08 * g - 0.12 * lunge) * sc; b.rotation.x = 0.07 * Math.sin(s * 0.7 + 1) * sc; b.rotation.y = 0.06 * Math.sin(s * 0.5) * sc; const fl = 1 + 0.06 * g; b.scale.set(fl, fl, fl); } });
  S.root.updateMatrixWorld(true); S.body.skeleton.update();
  /* the bone matrices in the figure's own frame, for the points that ride the skin */
  const gi = S.gi || (S.gi = new S.T.Matrix4()); gi.copy(S.root.matrixWorld).invert(); for (let j = 0; j < B.length; j++) S.M4[j].multiplyMatrices(B[j].matrixWorld, S.inv[j]).premultiply(gi);
  if (cam) { const L = S.U.lamp44.value.fromArray(W44.sun).normalize().transformDirection(cam.matrixWorldInverse); if (!isFinite(L.x)) L.set(-0.6, 0.62, 0.5); }
  S.U.t44.value = t; S.t = t;
  /* the shadow follows the body: it slides under the crest's swing and spreads with the pool */ if (S.shadow) { const q5 = S.q5 || (S.q5 = { s: [5, 0, 0, 0], w: [1, 0, 0, 0] }), r5 = R.B[5].p, dx = at44(S, q5, r5[0], r5[1], r5[2], S.v).x - r5[0]; S.shadow.material.uniforms.a.value = 1; S.shadow.position.x = (S.G35.o.pc || [0])[0] + 0.4 * dx; S.shadow.scale.x = S.G35.pr[0] * 0.95 * B[0].scale.x; S.shadow.scale.z = S.G35.pr[1] * 0.9 * B[0].scale.z; }
  /* drops: swell at the tip, let go, fall, land (a wet mark on the wood, or into its own liquid) */
  const v = S.v; R.src.forEach((q, k) => { const bead = S.beads[k], mark = S.marks[k], Pd = (q.tooth ? 3.1 : 4.3) * (st === 5 ? 1.5 : st === 1 ? 0.8 : 1) + 1.7 * hh35(q.i * 7 + st), off = hh35(q.i * 13 + st * 3), cyc = t / Pd + off, n = Math.floor(cyc), u = cyc - n, rel = 0.66;
    const g = 3.2 * Math.max(1, R.H), D = S.d44[k] || (S.d44[k] = { n: -1e9, x: 0, y: 0, z: 0 });
    if (u < rel) { const r = q.r * (0.3 + 0.7 * sm44(u / rel)); at44(S, q, q.p[0], q.p[1], q.p[2], v); bead.position.set(v.x, v.y - r * 0.55, v.z); bead.scale.set(r, r * (1 + 0.25 * sm44(u / rel)), r); bead.visible = true; D.live = 0; }
    else { if (D.n !== n) { at44(S, q, q.p[0], q.p[1], q.p[2], v); D.n = n; D.x = v.x; D.y = v.y - q.r * 0.55; D.z = v.z; } const tau = (u - rel) * Pd, y = D.y - 0.5 * g * tau * tau, ld = q.land;
      if (y > ld) { bead.position.set(D.x, y, D.z); bead.scale.set(q.r * 0.85, q.r * 1.35, q.r * 0.85); bead.visible = true; D.live = 0; } else { bead.visible = false; D.live = tau - Math.sqrt(Math.max(0, 2 * (D.y - ld) / g)); } }
    const tL = Math.sqrt(Math.max(0, 2 * (q.p[1] - q.r * 0.55 - q.land) / g)), uL = rel + tL / Pd, age = fr44(u - uL) * Pd, lc = Math.floor(cyc - uL);
    if (!S.jar && q.land < 0.035 && age < 4.5 && D.n > -1e8) { if (mark.userData.lc !== lc) { mark.userData.lc = lc; mark.position.set(D.x, 0.016, D.z); } const f = sm44(age / 0.15) * (1 - sm44((age - 1.2) / 3.3)); mark.visible = f > 0.01; mark.material.uniforms.a.value = f; const rs = q.r * (2.2 + 1.2 * sm44(age / 0.4)); mark.scale.set(rs, 1, rs * 0.85); } else mark.visible = false;
    D.u = u; });
  W44.ms += rn44() - c0; W44.n++; }
/* the pen's moving marks: beads, bubbles on the rim, one rising and popping, threads of fume lifting off */
function draw44(S, R, lw, s2, Wd, Ht, P10, P11, d, cam) { const t = S.t || 0, st = S.stage, mw = S.root.matrixWorld, G = S.G35, Rg = S.R, TAU = 2 * PI, V = S.T.Vector3;
  const ce = cam.matrixWorld.elements, cx = new V(ce[0], ce[1], ce[2]).normalize(), cy = new V(ce[4], ce[5], ce[6]).normalize(), ws = new V().setFromMatrixScale(mw).x || 1;
  const ring = (p, r, seed, w, sq) => { const pts = []; for (let k = 0; k <= 10; k++) { const th = k / 10 * TAU + seed; pts.push(p.clone().addScaledVector(cx, r * Math.cos(th)).addScaledVector(cy, r * (sq || 1) * Math.sin(th))); } free30(R, pts, w, s2, Wd, Ht, P10, P11, d, 7100 + seed * 31, { smooth: 2, wob: 0.35 }); };
  const W = (x, y, z) => new V(x, y, z).applyMatrix4(mw);
  /* the beads */ S.beads.forEach((b, k) => { if (!b.visible) return; const p = b.position.clone().applyMatrix4(mw); ring(p, b.scale.x * ws * 1.04, k + 1, lw * 0.4, b.scale.y / b.scale.x); });
  /* bubbles in the eaten ring: each swells, pops in three ticks, and comes again a little way round */
  const pc = G.o.pc || [0, 0], sk = S.bones[0].scale; (S.bub0 || []).forEach((q, i) => { const P = 1.4 + 1.6 * hh35(i * 5 + st), c = t / P + hh35(i + 9), n = Math.floor(c), u = c - n, a0 = Math.atan2(q[1] - pc[1], q[0] - pc[0]) + 0.5 * (hh35(n * 7 + i) - 0.5), rr = Math.hypot(q[0] - pc[0], q[1] - pc[1]), x = pc[0] + Math.cos(a0) * rr * sk.x, z = pc[1] + Math.sin(a0) * rr * sk.z, r = q[2];
    if (u < 0.72) { const rn = r * (0.2 + 0.8 * sm44(u / 0.72)); const pts = []; for (let k = 0; k <= 10; k++) { const th = k / 10 * TAU + i; pts.push(W(x + rn * Math.cos(th), 0.02 + rn * 0.9 * (1 + Math.sin(th)), z + rn * 0.25 * Math.sin(th))); } free30(R, pts, lw * 0.36, s2, Wd, Ht, P10, P11, d, 9500 + i * 17, { smooth: 2, wob: 0.5 }); }
    else if (u < 0.84) { const e = (u - 0.72) / 0.12; for (let k = 0; k < 3; k++) { const th = k * 2.1 + i, r0 = r * (1 + 0.8 * e), r1 = r * (1.5 + 1.2 * e); free30(R, [W(x + r0 * Math.cos(th), 0.02 + r + r0 * Math.sin(th), z), W(x + r1 * Math.cos(th), 0.02 + r + r1 * Math.sin(th), z)], lw * 0.3 * (1 - e), s2, Wd, Ht, P10, P11, d, 9600 + i * 7 + k, { smooth: 0, wob: 0.2 }); } } });
  /* threads of fume: each lifts off, leans, thins and goes, and another starts */
  const thread = (f, i, base, P, w) => { const c = t / P + 0.37 * i, u = c - Math.floor(c), e = Math.sin(PI * u), hg = f[3] * (0.55 + 0.45 * sm44(u * 1.6)); const segs = fume35([0, 0, 0, hg, f[4] * (Math.floor(c) % 2 ? 1 : -1) * (0.8 + 0.4 * Math.sin(t * 0.7 + i))], i); const up = 0.3 * f[3] * u;
    segs.forEach((seg, j) => free30(R, seg.map(p => W(base.x + p[0], base.y + p[1] + up, base.z + p[2])), lw * (j ? 0.42 : 0.55) * Math.max(0.15, e), s2, Wd, Ht, P10, P11, d, 9700 + i * 40 + j * 13 + (Math.floor(c) % 3) * 5, { smooth: 2, wob: 0.7 })); };
  Rg.fum.forEach((q, i) => thread(q.p, i, at44(S, q, q.p[0], q.p[1], q.p[2], new V()), 3.4 + 0.9 * i, 1));
  (S.smoke0 || []).forEach((f, i) => thread([0, 0, 0, f[2], f[3]], i + 5, new V(f[0], 0.03, f[1]), 4.2 + 0.7 * i, 1));
  /* spray off the crest: beads flung up a little way and taken back */
  Rg.spr.forEach((q, i) => { const P = 1.6 + 0.8 * hh35(i + st * 3), u = fr44(t / P + hh35(i * 3 + 1)), b = at44(S, q, q.p[0], q.p[1], q.p[2], new V()), hgt = 0.12 * Rg.H * 4 * u * (1 - u); if (u > 0.92) return; ring(W(b.x + 0.04 * Rg.H * u, b.y + hgt, b.z), q.p[3] * ws * (0.6 + 0.4 * Math.sin(PI * u)), i + 3, lw * 0.5); });
  /* now and then a bubble rises off the front of the pool, pops, and a thread of fume goes up from where it was */
  { const P = st === 5 ? 6.5 : 4.8, c = t / P + 0.2, n = Math.floor(c), u = c - n, a = -0.2 + 0.9 * hh35(n * 3 + st), rx = G.pr[0] * 0.8 * sk.x, rz = G.pr[1] * 0.8 * sk.z, x = pc[0] + Math.cos(a) * rx, z = pc[1] + Math.abs(Math.sin(a)) * rz + 0.05, rise = 0.22 * Rg.H + 0.05, r = 0.022 + 0.008 * st;
    if (u < 0.5) { const e = sm44(u / 0.5), y = 0.03 + rise * e; ring(W(x + 0.02 * Math.sin(u * 20), y + r, z), r * ws * (0.5 + 0.5 * e), 11, lw * 0.42); }
    else if (u < 0.58) { const e = (u - 0.5) / 0.08, y = 0.03 + rise + r; for (let k = 0; k < 4; k++) { const th = k * 1.57 + 0.4, r0 = r * (1 + e), r1 = r * (1.7 + 1.3 * e); free30(R, [W(x + r0 * Math.cos(th), y + r0 * Math.sin(th), z), W(x + r1 * Math.cos(th), y + r1 * Math.sin(th), z)], lw * 0.34 * (1 - e), s2, Wd, Ht, P10, P11, d, 8800 + k, { smooth: 0, wob: 0.2 }); } }
    else { const e = (u - 0.58) / 0.42, y = 0.03 + rise + r + 0.12 * Rg.H * e, segs = fume35([0, 0, 0, (0.25 * Rg.H + 0.06) * sm44(e * 1.8), n % 2 ? 1 : -1], 3); segs.forEach((seg, j) => free30(R, seg.map(p => W(x + p[0], y + p[1], z + p[2])), lw * (j ? 0.38 : 0.48) * Math.sin(PI * Math.min(1, e * 1.2)), s2, Wd, Ht, P10, P11, d, 8900 + j * 13 + (n % 3) * 7, { smooth: 2, wob: 0.7 })); } } }
KIT.acid44Fig = acid44Fig; KIT.ACID44 = W44;
/* behind the switch: the bench figure and the jar figure of Acid are the living breaker */
const build44 = (T, grp, extra) => { if (KIT.acid35 === 'a' && KIT.acid44 !== false && T && T.SkinnedMesh && grp && grp.add) { try { grp.add(acid44Fig(T, (extra && extra.stage) || 3, extra)); return true; } catch (e) { W44.err = String(e && e.stack); } } return false; };
KIT.build = (f0 => function (id, T, grp, tint, extra) { if (id === 'homacid' && build44(T, grp, extra)) return true; return f0.apply(this, arguments); })(KIT.build);
/* the shelf jar is made by the first half of this file, out of reach of KIT.build: once a jar of Acid is made, its grown figures (half grown,
   ready, and the form of its stage) are swapped for the living breaker, fitted to the glass as the old ones were (clear of the glass, under the lid) */
function fit44(T, f, R0, H0, lim) { const h = new T.Group(); h.add(f); h.updateMatrixWorld(true); const b = new T.Box3().setFromObject(f); h.remove(f); const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, r = Math.hypot(b.max.x - cx, (b.max.z - cz) * 0.8) || 1; return { s: Math.min(R0 / r, H0 / Math.max(0.1, b.max.y - b.min.y), lim), cx, cz, y0: b.min.y }; }
function jar44(T, g) { const U = g.userData;
  [[U.big, 1], [U.mid, 0.62]].forEach(([c, k]) => { if (!c) return; c.children.slice().forEach(o => c.remove(o)); const f = acid44Fig(T, k < 1 ? 2 : 3, { jar: true }), q = fit44(T, f, 0.86, 1.95, 1.3), s = q.s * k, cs = c.scale.x || 1, inn = new T.Group(); inn.add(f); inn.scale.setScalar(s / cs); inn.position.set((-q.cx * s - c.position.x) / cs, (0.21 - q.y0 * s - c.position.y) / cs, (-q.cz * s - c.position.z) / cs); c.add(inn); });
  U.form = sg => { if (U.sg === sg) return; U.sg = sg; const f = acid44Fig(T, sg, { jar: true, stage: sg }), q = fit44(T, f, 0.88, 1.95, 1.6), pv = new T.Group(); pv.add(f); pv.scale.setScalar(q.s); pv.position.set(-q.cx * q.s, 0.21 - q.y0 * q.s, -q.cz * q.s);
    if (U.big2) g.remove(U.big2); pv.visible = (U.big && U.big.visible) || !!(U.big2 && U.big2.visible) || U.stage === 2; if (U.big) U.big.visible = false; g.add(pv); U.big2 = pv; }; }
if (KIT.jar) KIT.jar = (f0 => function (T, key) { const j = f0.apply(this, arguments); if (j && key === 'acid' && KIT.acid35 === 'a' && KIT.acid44 !== false && T && T.SkinnedMesh) { try { jar44(T, j); } catch (e) { W44.err = String(e && e.stack); } } return j; })(KIT.jar);
// ==== W44 END
// ==== W48 BEGIN
// (builder 48, five stages by builder 50) ACID AS A SPIRIT: "the sneak", the owner's pick (AA.rxKit.acid48 = 'a', or ?a48=a on the page; off by default).
// Built and drawn the way Water is, by Water's own code: each stage is a set of numbers like a stage of S25 (pool, spine keys, limbs, face); geo26 makes
// it one closed skin on joints, fig26 gives it the face and the drops, set30 the pen and the wash. What is Acid's own: the shapes (lean, a flame of a
// head, long arms ending in three long pointed fingers; every finger is a limb that runs down the same arm and parts from it at the hand), the wash
// in green (the blues of F30 changed in the compiled shader), slanted eyes, the pen's own strokes (o.pen: teeth on the skin, fume and fizz in the air,
// each tied to a joint), licks of acid standing up from the pool's edge, and a ragged pit eaten into the wood all round the pool (etch48).
//  1 the spark: a small flame-headed drop peeking over the lip of its pit, only slanted eyes and two sets of fingertips showing
//  2 the imp: up to its waist, hunched forward, claws steepled in front of its chest, a sharp toothy grin
//  3 the sneak: lean and bent like a flame, one long arm reaching for the page with fingers spread, the other claw raised
//  4 the fiend: tall and hooked over, head hung toward the page, long arms spread wide with long dripping fingers, a tall curling flame
//  5 the devourer: tall, lean and regal, a crown of five flames, a wide thin grin with drip teeth, arms raised, sleeves of acid pouring into a wide pit
KIT.acid48 = KIT.acid48 == null ? ((typeof location !== 'undefined' && /[?&]a48=0/.test(String(location.search))) ? null : 'a') : KIT.acid48;   /* (builder 52) on by default; ?a48=0 gives the old Acid */
const W48 = { geo: {}, figs: [], err: null, ways: { a: 'the sneak' }, TARGET: [0, 5200, 6200, 7000, 7600, 8400], benchY: 0.03,
  ROLE: [null, { chest: 3, neck: 4, head: 5, hair: 9 }, { chest: 3, neck: 5, head: 6, hair: 10 }, { chest: 5, neck: 6, head: 7, hair: 10 }, { chest: 5, neck: 7, head: 8, hair: 12 }, { chest: 5, neck: 6, head: 7, hair: 11 }],
  C: { lite: [0.68, 0.90, 0.45], edge: [0.35, 0.66, 0.21], shade: [0.27, 0.53, 0.23], margin: [0.62, 0.86, 0.47], lid: 0x9fd07e } };
/* a long pointed finger leaving the hand along d: three points, thick at the root, a needle at the tip, bent at the end by b */
const fin48 = (d, L, r0, b) => { const n = Math.hypot(d[0], d[1], d[2]) || 1, u = d.map(v => v / n), bb = b || [0, 0, 0]; return [0.36, 0.7, 1].map((t, i) => [u[0] * L * t + bb[0] * t * t, u[1] * L * t + bb[1] * t * t, u[2] * L * t + bb[2] * t * t, [r0, r0 * 0.6, 0.014][i]]); };
/* an arm that ends in fingers: one limb a finger, all of them the same down to the hand */
const arm48 = (k, th, r0, path, rad, fingers, ex) => { const h = path[path.length - 1]; return fingers.map((fg, fi) => Object.assign({ k, th, r0, ey: 1.25, arm: path.length, fi, path: path.concat(fg.map(q => [h[0] + q[0], h[1] + q[1], h[2] + q[2]])), rad: rad.concat(fg.map(q => q[3])) }, ex || {})); };
/* a lick of acid standing up from the pool: it leaves the body low and runs out under the pool to its edge */
const lick48 = (th, pts, rad) => ({ k: 4.6, th, r0: 0.2, path: pts, rad, lick: 1 });
/* a ring of licks standing all round the pool's edge, so the pool is ragged and boiling, not a smooth round puddle: [angle, height] each */
const licks48 = (R, Rz, rf, sc, list) => list.map(q => { const c = Math.cos(q[0]), s = Math.sin(q[0]), h = q[1], ox = R - rf, oz = Rz - rf * 0.85, P = (t, y) => [c * ox * t, y, s * oz * t];
  return lick48(q[0], [P(0.35, -0.1), P(0.72, -0.1), P(0.84, 0.25 * h), P(0.88, 0.62 * h), P(0.85, h)], [0.15, 0.13, 0.1, 0.055, 0.018].map(r => r * sc)); });
/* a tongue of flame leaving the head: the fork that makes the head a flame and not a drop */
const tongue48 = (k, th, path, sc) => ({ k, th, r0: 0.16 * sc, ey: 1.2, tongue: 1, path, rad: [0.13, 0.09, 0.05, 0.014].map(r => r * sc) });
/* a thread of fume: it rises and curls over */
const fume48 = (x, y, z, h, sd) => Array.from({ length: 14 }, (_, i) => { const t = i / 13, a = t * 4.6; return [x + sd * h * (0.2 * Math.sin(a) * (0.4 + t) + 0.12 * t), y + h * (t * 0.9 + 0.1 * (1 - Math.cos(a)) * t), z]; });
/* fizz: a small ring of a bubble, and a little rising curl */
const ring48 = (x, y, z, r) => Array.from({ length: 11 }, (_, i) => { const a = i / 10 * 2 * PI + 0.4; return [x + r * Math.cos(a), y + r * Math.sin(a), z]; });
const curl48 = (x, y, z, r, sd) => Array.from({ length: 10 }, (_, i) => { const t = i / 9, a = t * 2 * PI * 1.1; return [x + sd * r * Math.sin(a) * (1 - 0.5 * t), y + r * (1 - Math.cos(a)) * 0.6 + r * 2.2 * t, z]; });
/* teeth along a grin (face units times k): a zigzag on the mouth's own curve */
const teeth48 = (c, d, w, y, dp, n, h, k) => ({ c, d, teeth: 1, pts: Array.from({ length: 2 * n + 1 }, (_, i) => { const s = (i - n) / n; return [s * w * k, (y - dp * (1 - s * s)) * k + (i % 2 ? h : 0)]; }), w: 0.75, o: { smooth: 0, wob: 0.3, min: 3, trim: 0 } });
const fizz48 = (R, Rz, y, list) => list.map(q => { const r = q[3] * 1.7; return { air: q[2] ? curl48(R * Math.cos(q[0]) * q[1], y, Rz * Math.sin(q[0]) * q[1], r, q[2]) : ring48(R * Math.cos(q[0]) * q[1], y + r * 1.2, Rz * Math.sin(q[0]) * q[1], r), w: q[4] || 0.8, fz: q[2] ? 2 : 1 }; });
const SPEC48 = [
  // 1 the spark: a small flame standing up out of its pit, leaning, two little claws up by its face
  () => ({ keys: pool(0, 0, 1.0, 0.8, 0.3, 0.26).concat([[0.02, 0.45, 0, 0.26, 0.23], [0.04, 0.75, 0.02, 0.3, 0.26], [0.06, 0.95, 0.04, 0.21, 0.2], [0.1, 1.22, 0.08, 0.36, 0.33], [0.14, 1.48, 0.06, 0.28, 0.26],
      [0.18, 1.7, 0.03, 0.18, 0.17], [0.24, 1.9, 0, 0.1, 0.1], [0.3, 2.08, 0, 0.05, 0.05], [0.34, 2.22, 0, 0, 0]]),
    foot: 0.3, thin: 0.14, hp: 1.1, rings: 2, frho: 0.46, wet: [0, 0, 1.0, 0.8], etch: 1,
    limbs: arm48(7, 0, 0.14, [[0.16, -0.02, 0.06], [0.34, 0.14, 0.12], [0.42, 0.36, 0.16]], [0.095, 0.09, 0.1], [fin48([0.6, 1, 0], 0.42, 0.048, [0, 0, 0.05]), fin48([0.1, 1, 0.1], 0.44, 0.048, [0, 0, 0.05]), fin48([-0.3, 0.9, 0.15], 0.38, 0.048, [0, 0, 0.05])])
      .concat(arm48(7, PI, 0.14, [[-0.16, -0.04, 0.06], [-0.34, 0.02, 0.14], [-0.46, 0.16, 0.2]], [0.095, 0.09, 0.1], [fin48([-0.8, 0.7, 0.1], 0.4, 0.048, [0, 0, 0.05]), fin48([-0.35, 1, 0.2], 0.42, 0.048, [0, 0, 0.05]), fin48([0.1, 1, 0.25], 0.36, 0.048, [0, 0, 0.05])]))
      .concat(licks48(1.0, 0.8, 0.3, 0.7, [[0.5, 0.5], [2.3, 0.42], [3.7, 0.55], [5.2, 0.45]])),
    face: { c: [0.1, 1.22, 0.08], d: [0.1, 0, 1], k: 1.0, er: 1.25, dx: 0.2, brow: { y: 0.2, len: 0.14, ang: [0.55, 0.55], arch: 0, r: 0.022 }, mouth: { w: 0.14, d: 0.05, y: -0.2, tilt: 0.1, tick: 1, r: 0.026 } }, eye: { sy: 0.55, slant: 0.5 },
    pen: [{ air: fume48(0.36, 2.3, 0, 0.75, 1), w: 0.85 }].concat(fizz48(1.0, 0.8, 0.22, [[0.2, 1.12, 0, 0.06], [1.4, 1.12, 1, 0.07], [2.9, 1.12, 0, 0.05], [4.3, 1.1, -1, 0.07]])),
    drops: [[-1.3, 0, 0.3, 0.05], [1.25, 0, -0.45, 0.04]] }),
  // 2 the imp
  () => ({ keys: pool(0, 0, 1.5, 1.12, 0.5, 0.44).concat([[0, 0.55, 0, 0.46, 0.4], [0, 0.92, 0.06, 0.46, 0.38], [0, 1.18, 0.16, 0.36, 0.32], [0, 1.32, 0.24, 0.24, 0.22], [0, 1.62, 0.32, 0.52, 0.48], [0.02, 1.92, 0.28, 0.4, 0.38],
      [0.06, 2.16, 0.22, 0.26, 0.25], [0.1, 2.36, 0.16, 0.16, 0.16], [0.14, 2.52, 0.12, 0.085, 0.085], [0.16, 2.64, 0.1, 0.045, 0.045], [0.16, 2.72, 0.1, 0, 0]]),
    foot: 0.36, thin: 0.13, hp: 1.3, rings: 2.2, frho: 0.42, wet: [0, 0, 1.5, 1.12], etch: 1,
    limbs: arm48(7.2, 0, 0.2, [[0.2, -0.14, 0.08], [0.4, -0.34, 0.3], [0.3, -0.2, 0.62], [-0.06, -0.06, 0.8]], [0.14, 0.13, 0.12, 0.15], [fin48([-0.15, 1, 0.15], 0.4, 0.065, [0, 0, 0.05]), fin48([-0.6, 1, 0.15], 0.42, 0.065, [0, 0, 0.05]), fin48([-1, 0.6, 0.15], 0.4, 0.065, [0, 0, 0.05])])
      .concat(arm48(7.2, PI, 0.2, [[-0.2, -0.14, 0.08], [-0.4, -0.34, 0.3], [-0.3, -0.2, 0.62], [0.06, -0.06, 0.8]], [0.14, 0.13, 0.12, 0.15], [fin48([0.15, 1, 0.2], 0.4, 0.065, [0, 0, 0.05]), fin48([0.6, 1, 0.2], 0.42, 0.065, [0, 0, 0.05]), fin48([1, 0.6, 0.2], 0.4, 0.065, [0, 0, 0.05])]))
      .concat([tongue48(11, PI, [[-0.14, 0.1, 0], [-0.3, 0.3, -0.02], [-0.38, 0.52, -0.04], [-0.4, 0.66, -0.04]], 0.95)])
      .concat(licks48(1.5, 1.12, 0.5, 0.9, [[0.4, 0.7], [1.5, 0.6], [2.6, 0.8], [3.9, 0.65], [5.2, 0.75]])),
    face: { c: [0, 1.64, 0.34], d: [0, 0.05, 1], k: 1.05, er: 1.3, dx: 0.22, brow: { y: 0.21, len: 0.17, ang: [0.6, 0.6], arch: 0, r: 0.026 }, mouth: { w: 0.3, d: 0.14, y: -0.2, r: 0.03 } }, eye: { sy: 0.55, slant: 0.5 },
    pen: [teeth48([0, 1.64, 0.34], [0, 0.05, 1], 0.27, -0.2, 0.13, 5, 0.075, 1.05), { air: fume48(0.18, 2.8, 0.1, 0.95, 1), w: 0.9 }, { air: fume48(-0.62, 2.62, 0.2, 0.6, -1), w: 0.7 }]
      .concat(fizz48(1.5, 1.12, 0.3, [[0.1, 1.08, 0, 0.07], [2.9, 1.1, 0, 0.06], [0.75, 1.08, 1, 0.08], [3.8, 1.08, -1, 0.08], [5.6, 1.1, 0, 0.05]])),
    drops: [[1.4, 0.3, 0.6, 0.05, 1], [1.55, 0.55, 0.5, 0.032, 1], [-1.35, 0.3, 0.45, 0.045, 1], [-1.9, 0, 0.3, 0.05], [1.95, 0, -0.2, 0.04]] }),
  // 3 the sneak (the owner's pick, A of builder 48): bigger hands, long pointed fingers, thicker arms, a bigger head
  () => ({ keys: pool(0, 0, 1.4, 1.05, 0.36, 0.31).concat([[-0.06, 0.7, 0, 0.27, 0.24], [-0.16, 1.2, 0.02, 0.22, 0.2], [-0.08, 1.68, 0.08, 0.27, 0.21], [0.1, 2.05, 0.16, 0.42, 0.26], [0.22, 2.27, 0.24, 0.16, 0.15], [0.36, 2.62, 0.32, 0.52, 0.47], [0.34, 2.97, 0.28, 0.4, 0.38],
      [0.26, 3.18, 0.2, 0.25, 0.24], [0.12, 3.36, 0.12, 0.17, 0.16], [-0.05, 3.54, 0.06, 0.11, 0.105], [-0.1, 3.74, 0.02, 0.07, 0.07], [0.02, 3.9, 0, 0, 0]]),
    foot: 0.4, thin: 0.13, hp: 1.5, rings: 2.5, frho: 0.4, wet: [0, 0, 1.4, 1.05], etch: 1,
    limbs: arm48(9, 0, 0.2, [[0.32, -0.24, 0.22], [0.66, -0.42, 0.56], [0.88, -0.5, 0.78]], [0.145, 0.13, 0.17], [fin48([0.6, 0.4, 0.45], 0.62, 0.075, [0, -0.08, 0.04]), fin48([0.8, -0.05, 0.6], 0.66, 0.075, [0, -0.08, 0.04]), fin48([0.4, -0.6, 0.6], 0.58, 0.075, [0, -0.04, 0.06])])
      .concat(arm48(9, PI, 0.2, [[-0.3, -0.3, 0.1], [-0.48, 0.02, 0.3], [-0.42, 0.38, 0.4]], [0.145, 0.13, 0.17], [fin48([0.35, 1, 0.05], 0.56, 0.075, [0, 0, 0.1]), fin48([-0.1, 1, 0.1], 0.6, 0.075, [0, 0, 0.1]), fin48([-0.6, 0.8, 0.1], 0.54, 0.075, [0, 0, 0.1])]))
      .concat([tongue48(12, 0, [[0.14, 0.12, 0], [0.3, 0.32, 0], [0.36, 0.55, 0], [0.34, 0.72, 0]], 1)])
      .concat(licks48(1.4, 1.05, 0.36, 1, [[0.9, 0.75], [2.1, 0.6], [3.2, 0.8], [4.3, 0.62], [5.6, 0.7]])),
    face: { c: [0.36, 2.66, 0.32], d: [0.22, -0.12, 1], k: 1.18, er: 1.25, dx: 0.2, brow: { y: 0.19, len: 0.19, ang: [0.6, 0.6], arch: 0, r: 0.026 }, mouth: { w: 0.25, d: 0.1, y: -0.2, tilt: 0.06, tick: 1, r: 0.03 } }, eye: { sy: 0.55, slant: 0.5 },
    pen: [{ air: fume48(0.04, 3.98, 0, 1.15, 1), w: 1.0 }, { air: fume48(-0.3, 3.8, 0, 0.75, -1), w: 0.8 }].concat(fizz48(1.4, 1.05, 0.3, [[0.2, 1.1, 0, 0.08], [1.2, 1.12, 1, 0.09], [2.7, 1.1, 0, 0.07], [3.5, 1.1, -1, 0.09], [5.5, 1.1, 0, 0.06]])),
    drops: [[1.5, 0.3, 0.3, 0.05, 1], [1.72, 0.52, 0.2, 0.032, 1], [-1.05, 0.26, 0.75, 0.045, 1], [0.5, 0.22, 1.02, 0.04, 1], [-1.9, 0, 0.3, 0.05], [1.95, 0, -0.2, 0.04]] }),
  // 4 the fiend
  () => ({ keys: pool(0, 0, 2.0, 1.5, 0.5, 0.42).concat([[-0.1, 0.9, 0, 0.4, 0.34], [-0.22, 1.6, 0, 0.34, 0.3], [-0.22, 2.3, 0.04, 0.38, 0.3], [-0.1, 2.85, 0.1, 0.5, 0.32], [0.1, 3.18, 0.14, 0.21, 0.21], [0.36, 3.4, 0.24, 0.18, 0.18], [0.68, 3.36, 0.38, 0.47, 0.44],
      [0.76, 3.72, 0.36, 0.36, 0.34], [0.76, 4.0, 0.28, 0.24, 0.23], [0.7, 4.26, 0.18, 0.16, 0.15], [0.62, 4.5, 0.12, 0.11, 0.11], [0.52, 4.72, 0.06, 0.07, 0.07], [0.4, 4.9, 0.02, 0.04, 0.04], [0.32, 5.02, 0, 0, 0]]),
    foot: 0.42, thin: 0.1, hp: 2.0, rings: 3, frho: 0.34, wet: [0, 0, 2.0, 1.5], etch: 1,
    limbs: arm48(9, 0, 0.22, [[0.42, -0.05, 0.08], [0.9, -0.3, 0.22], [1.35, -0.62, 0.36], [1.62, -1.0, 0.46]], [0.155, 0.14, 0.13, 0.18], [fin48([0.7, -0.4, 0.3], 0.8, 0.08, [0, -0.14, 0]), fin48([0.3, -1, 0.25], 0.86, 0.08, [0.06, -0.06, 0]), fin48([-0.1, -1, 0.35], 0.78, 0.08, [-0.06, -0.06, 0])])
      .concat(arm48(9, PI, 0.22, [[-0.42, 0.0, 0.05], [-0.9, -0.2, 0.15], [-1.35, -0.5, 0.26], [-1.62, -0.88, 0.36]], [0.155, 0.14, 0.13, 0.18], [fin48([-0.7, -0.4, 0.3], 0.8, 0.08, [0, -0.14, 0]), fin48([-0.3, -1, 0.25], 0.86, 0.08, [-0.06, -0.06, 0]), fin48([0.1, -1, 0.35], 0.78, 0.08, [0.06, -0.06, 0])]))
      .concat([tongue48(13, 0, [[0.18, 0.1, 0], [0.38, 0.34, 0], [0.5, 0.62, 0], [0.5, 0.82, 0]], 1.1), tongue48(13, PI, [[-0.18, 0.12, 0], [-0.36, 0.4, 0], [-0.42, 0.7, 0], [-0.38, 0.92, 0]], 1.1)])
      .concat(licks48(2.0, 1.5, 0.5, 1.2, [[0.3, 0.9], [1.3, 0.75], [2.2, 1.0], [3.1, 0.8], [4.1, 0.95], [5.2, 0.8]])),
    face: { c: [0.7, 3.36, 0.4], d: [0.35, -0.4, 1], k: 1.12, er: 1.2, dx: 0.2, brow: { y: 0.19, len: 0.19, ang: [0.65, 0.65], arch: 0, r: 0.026 }, mouth: { w: 0.25, d: 0.09, y: -0.21, tilt: 0.08, tick: 1, r: 0.03 } }, eye: { sy: 0.5, slant: 0.55 },
    pen: [teeth48([0.7, 3.36, 0.4], [0.35, -0.4, 1], 0.2, -0.21, 0.08, 3, -0.06, 1.12), { air: fume48(0.34, 5.1, 0, 1.35, -1), w: 1.0 }, { air: fume48(0.0, 4.72, 0.36, 0.9, -1), w: 0.8 }, { air: fume48(1.64, 4.62, 0.36, 0.8, 1), w: 0.8 }]
      .concat(fizz48(2.0, 1.5, 0.3, [[0.3, 1.1, 0, 0.09], [1.0, 1.1, 1, 0.1], [2.5, 1.1, 0, 0.08], [3.4, 1.1, -1, 0.1], [4.6, 1.1, 0, 0.07], [5.6, 1.1, 1, 0.09]])),
    drops: [[2.62, 1.0, 0.75, 0.06, 1], [2.62, 0.7, 0.75, 0.042, 1], [2.2, 0.82, 0.92, 0.05, 1], [-2.82, 1.1, 0.65, 0.06, 1], [-2.82, 0.8, 0.65, 0.042, 1], [-2.4, 0.92, 0.82, 0.05, 1], [-2.5, 0, 0.6, 0.06], [2.6, 0, -0.3, 0.05]] }),
  // 5 the devourer
  () => { const crown = (th, h, o) => ({ k: 12.4, th, r0: 0.2, ey: 1.2, tongue: 1, crown: 1, path: [[o * 0.16 * Math.cos(th), 0.22 * h, o * 0.16 * Math.sin(th)], [o * 0.3 * Math.cos(th), 0.52 * h, o * 0.3 * Math.sin(th)], [o * 0.3 * Math.cos(th), 0.82 * h, o * 0.3 * Math.sin(th)], [o * 0.42 * Math.cos(th), h, o * 0.42 * Math.sin(th)]], rad: [0.15, 0.12, 0.075, 0.016] });
    const sleeve = s => ({ k: 9, th: s > 0 ? 0 : PI, r0: 0.3, ey: 1.25, sleeve: 1, path: [[0.42 * s, 0.0, 0.1], [0.88 * s, 0.22, 0.2], [1.15 * s, 0.45, 0.1], [1.5 * s, -0.6, -0.15], [1.9 * s, -1.9, -0.3], [2.3 * s, -3.0, -0.3], [2.5 * s, -3.72, -0.2]], rad: [0.21, 0.19, 0.2, 0.3, 0.45, 0.6, 0.7], flat: [0, 0, 1], fk: t => 1 - 0.75 * sm((t - 0.35) * 3) });
    return { keys: pool(0, 0, 3.4, 2.3, 0.62, 0.5).concat([[0, 1.2, 0, 0.56, 0.46], [0, 2.2, 0, 0.46, 0.4], [0, 3.1, 0.04, 0.54, 0.4], [0, 3.8, 0.08, 0.8, 0.46], [0, 4.15, 0.1, 0.28, 0.28], [0, 4.66, 0.16, 0.74, 0.68], [0, 5.16, 0.12, 0.6, 0.56],
      [0, 5.38, 0.08, 0.38, 0.36], [0.02, 5.66, 0.04, 0.25, 0.24], [0.08, 5.94, 0, 0.16, 0.16], [0.16, 6.18, 0, 0.1, 0.1], [0.24, 6.38, 0, 0.055, 0.055], [0.28, 6.52, 0, 0, 0]]),
    foot: 0.6, thin: 0.12, hp: 2.6, rings: 4, frho: 0.3, wet: [0, 0, 3.4, 2.3], etch: 1,
    limbs: arm48(9, 0, 0.3, [[0.42, 0.0, 0.1], [0.88, 0.22, 0.2], [1.2, 0.58, 0.3], [1.34, 0.95, 0.36]], [0.21, 0.19, 0.17, 0.22], [fin48([0.5, 1, 0.1], 0.8, 0.095, [0.1, 0, 0.08]), fin48([0.05, 1, 0.15], 0.88, 0.095, [0, 0, 0.1]), fin48([-0.4, 1, 0.15], 0.76, 0.095, [-0.08, 0, 0.1])])
      .concat(arm48(9, PI, 0.3, [[-0.42, 0.0, 0.1], [-0.88, 0.22, 0.2], [-1.2, 0.58, 0.3], [-1.34, 0.95, 0.36]], [0.21, 0.19, 0.17, 0.22], [fin48([-0.5, 1, 0.1], 0.8, 0.095, [-0.1, 0, 0.08]), fin48([-0.05, 1, 0.15], 0.88, 0.095, [0, 0, 0.1]), fin48([0.4, 1, 0.15], 0.76, 0.095, [0.08, 0, 0.1])]))
      .concat([sleeve(1), sleeve(-1), crown(0.1, 0.95, 1.8), crown(PI - 0.1, 0.95, 1.8), crown(-PI / 2 + 0.55, 1.25, 0.9), crown(-PI / 2 - 0.55, 1.25, 0.9)])
      .concat(licks48(3.4, 2.3, 0.62, 1.5, [[0.2, 1.1], [0.95, 0.9], [1.9, 1.25], [2.3, 0.95], [3.0, 1.2], [3.8, 0.9], [4.6, 1.1], [5.5, 0.95]])),
    face: { c: [0, 4.7, 0.2], d: [0, -0.05, 1], k: 1.9, er: 1.0, dx: 0.21, lid: 0.25, brow: { y: 0.19, len: 0.2, ang: [0.55, 0.55], arch: 0, r: 0.028 }, mouth: { w: 0.34, d: 0.07, y: -0.22, r: 0.026 } }, eye: { sy: 0.5, slant: 0.5 },
    pen: [teeth48([0, 4.7, 0.2], [0, -0.05, 1], 0.3, -0.22, 0.07, 6, -0.07, 1.9),
      { c: [0, 4.7, 0.2], d: [0, -0.05, 1], pts: [[-0.32 * 1.9, -0.22 * 1.9 + 0.01], [-0.33 * 1.9, -0.3 * 1.9], [-0.32 * 1.9, -0.36 * 1.9]], w: 0.8, o: { smooth: 1, wob: 0.3, min: 3 } }, { c: [0, 4.7, 0.2], d: [0, -0.05, 1], pts: [[0.3 * 1.9, -0.23 * 1.9], [0.31 * 1.9, -0.33 * 1.9]], w: 0.8, o: { smooth: 1, wob: 0.3, min: 3 } },
      { air: fume48(0.3, 6.6, 0, 1.4, 1), w: 1.0 }, { air: fume48(-1.24, 6.2, 0.1, 1.0, -1), w: 0.9 }, { air: fume48(1.26, 6.2, 0.1, 1.0, 1), w: 0.9 }, { air: fume48(-0.5, 6.5, -0.6, 0.9, -1), w: 0.8 }, { air: fume48(0.52, 6.5, -0.6, 0.9, 1), w: 0.8 },
      { air: fume48(-1.9, 5.6, 0.4, 0.7, -1), w: 0.7 }, { air: fume48(1.92, 5.6, 0.4, 0.7, 1), w: 0.7 }]
      .concat(fizz48(3.4, 2.3, 0.35, [[0.2, 1.08, 0, 0.11], [0.8, 1.08, 1, 0.13], [1.25, 1.08, 0, 0.09], [2.0, 1.08, -1, 0.13], [2.6, 1.08, 0, 0.1], [3.4, 1.06, 1, 0.12], [4.4, 1.06, 0, 0.1], [5.4, 1.06, -1, 0.12], [-0.4, 1.06, 0, 0.08]])),
    drops: [[3.9, 0, 0.9, 0.07], [-4.0, 0, -0.4, 0.06], [2.6, 0, 2.1, 0.06], [-2.4, 0, 2.2, 0.06]] }; }
];
/* the pit the acid eats into the bench: an even ragged ring all round the pool, a dark floor, a pale bleached lip, a pen line at its edge */
function etch48(T, rx, rz, sd) { const R = 1.8 * Math.max(rx, rz), m = new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { sd: { value: sd }, pq: { value: new T.Vector2(rx / R, rz / R) } },
    vertexShader: 'varying vec2 vU;\nvoid main() { vU = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float sd;\nuniform vec2 pq;\nvarying vec2 vU;\n' + N35 + [
      'void main() { vec2 q = vU / pq; float pc = length(q), a = atan(q.y, q.x); vec3 cs = vec3(cos(a), sin(a), sd);',
      '  float e = 1.3 + 0.16 * (N35(cs * vec3(1.8, 1.8, 1.0)) - 0.5) + 0.1 * (N35(cs * vec3(6.0, 6.0, 1.0) + 3.0) - 0.5) + 0.05 * (N35(cs * vec3(17.0, 17.0, 1.0) + 5.0) - 0.5);',
      '  float lw = 0.07 + 0.06 * N35(cs * vec3(4.0, 4.0, 1.0) + 9.0), ins = 1.0 - smoothstep(e - 0.01, e + 0.004, pc), rel = pc / e;',
      '  float gw = N35(vec3(vU.x * 1.6, vU.y * 26.0 + 2.0 * N35(vec3(vU * 2.5, sd + 1.0)), sd + 2.0)), n1 = N35(vec3(vU * 7.0, sd + 2.0)), n2 = N35(vec3(vU * 18.0, sd + 7.0));',
      /* the floor: dark, eaten, the grain left in olive streaks; wet green near the pool */
      '  vec3 col = mix(vec3(0.24, 0.16, 0.08), vec3(0.40, 0.34, 0.15), smoothstep(0.4, 0.75, gw) * (0.6 + 0.4 * n1)); col = mix(col, vec3(0.50, 0.60, 0.24), 0.45 * (1.0 - smoothstep(1.0, 1.12, pc)));',
      /* the wall: in shade toward the lamp, lit away from it */
      '  vec2 dn = q / max(pc, 1e-4); float fl = dot(dn, vec2(-0.7, -0.7)), wall = smoothstep(0.84, 0.98, rel) * ins; col = mix(col, vec3(0.10, 0.06, 0.03), 0.7 * wall * smoothstep(-0.2, 0.7, fl)); col = mix(col, vec3(0.80, 0.74, 0.55), 0.55 * wall * smoothstep(0.0, 0.7, -fl));',
      /* fizz on the floor: small pale rings */
      '  vec2 g5 = vU * 26.0, c5 = floor(g5), f5 = fract(g5) - 0.5; float h5 = H35(vec3(c5, sd + 5.0)), d5 = length(f5 - (vec2(H35(vec3(c5, sd + 7.0)), H35(vec3(c5, sd + 8.0))) - 0.5) * 0.4), rb = step(0.72, h5) * ins * (1.0 - smoothstep(0.9, 1.0, rel)) * (1.0 - smoothstep(0.03, 0.06, abs(d5 - 0.2 - 0.1 * h5)));',
      '  col = mix(col, vec3(0.88, 0.95, 0.72), 0.85 * rb);',
      /* the bleached lip just outside the edge, ragged, pale */
      '  float lip = smoothstep(e - 0.004, e + 0.012, pc) * (1.0 - smoothstep(e + lw - 0.025, e + lw, pc)); col = mix(col, vec3(0.94, 0.90, 0.76) * (0.92 + 0.08 * n2), lip);',
      /* a faint scorch beyond the lip */
      '  float halo = smoothstep(e + lw - 0.03, e + lw, pc) * (1.0 - smoothstep(e + lw, e + lw + 0.16, pc)); col = mix(col, vec3(0.22, 0.13, 0.06), halo * (1.0 - lip));',
      /* the pen line on the edge, broken here and there */
      '  float ink = (1.0 - smoothstep(0.008, 0.022, abs(pc - e))) * smoothstep(0.22, 0.4, N35(cs * vec3(3.0, 3.0, 1.0) + 13.0)); col = mix(col, vec3(0.08, 0.06, 0.05), 0.9 * ink);',
      '  float al = max(max(0.93 * ins, 0.96 * lip), max(0.32 * halo * (0.6 + 0.4 * n1), 0.9 * ink)); al *= 1.0 - smoothstep(0.96, 1.0, length(vU));',
      '  gl_FragColor = vec4(col, al); }'].join('\n') });
  const g = new T.PlaneGeometry(2 * R, 2 * R); g.rotateX(-PI / 2); g.computeBoundingSphere(); g.boundingBox = new T.Box3(new T.Vector3(-0.01, 0, -0.01), new T.Vector3(0.01, 0.01, 0.01)); /* the pit does not count in the creature's size */
  const q = new T.Mesh(g, m); q.userData.nobox = true; q.userData.plain = true; q.position.set(0, 0.012, 0); q.renderOrder = 3; q.castShadow = false; return q; }
/* the wash turns green: the same shader as Water's, its blues changed */
function tint48(T, S) { if (!S.m30) return; S.t48 = true; const C = W48.C, way = S.way48, g = v => 'vec3(' + v.map(x => x.toFixed(3)).join(', ') + ')', sw = [['vec3(0.64, 0.80, 0.945)', g(C.lite)], ['vec3(0.40, 0.59, 0.84)', g(C.edge)], ['vec3(0.36, 0.52, 0.78)', g(C.shade)], ['vec3(0.60, 0.76, 0.92)', g(C.margin)]];
  const one = m => { if (!m || !m.isMeshStandardMaterial || !m.onBeforeCompile || m.userData.a48) return; m.userData.a48 = 1; const f0 = m.onBeforeCompile, k0 = m.customProgramCacheKey; m.onBeforeCompile = sh => { f0(sh); sw.forEach(q => { sh.fragmentShader = sh.fragmentShader.split(q[0]).join(q[1]); }); }; m.customProgramCacheKey = () => (k0 ? k0.call(m) : '') + 'a48' + way; m.needsUpdate = true; };
  one(S.m30.body); one(S.m30.hull); (S.o29 || []).forEach(q => one(q.m30)); if (S.m30.lid && S.m30.lid.color) S.m30.lid.color.copy(new T.Color(C.lid).convertSRGBToLinear()); }
/* one stage of the sneak: its numbers go in Water's stage-3 slot for the moment of building; the figure then carries its own stage (sizes, rest) */
function acid48Fig(T, stage, extra) { stage = Math.max(1, Math.min(5, stage | 0)) || 3; const sp = SPEC48[stage - 1], keep = [S25[2], W26.geo[3], W26.ROLE[3], W26.TARGET]; let g = null;
  S25[2] = sp; if (W48.geo[stage]) W26.geo[3] = W48.geo[stage]; else delete W26.geo[3]; W26.ROLE[3] = W48.ROLE[stage]; W26.TARGET = W48.TARGET[stage];
  try { g = fig26(T, 3, extra); W48.geo[stage] = W26.geo[3]; } finally { S25[2] = keep[0]; if (keep[1]) W26.geo[3] = keep[1]; else delete W26.geo[3]; W26.ROLE[3] = keep[2]; W26.TARGET = keep[3]; }
  const S = g.userData.rig2.sp, G = S.G, o = G.o, V3 = T.Vector3, J = G.J, jh = G.bj[G.R.head]; S.way48 = 's' + stage; S.st = stage; g.userData.rig2.stage = stage; if (g.userData.water24) g.userData.water24.stage = stage;
  /* narrow slanted eyes: the same eyes as Water's, pressed flat and tipped */ if (o.eye && S.F) S.F.eyes.forEach((e, i) => { const s = i ? 1 : -1, q = new T.Quaternion().setFromAxisAngle(new V3(0, 0, 1), s * o.eye.slant); e.g.userData.q0.multiply(q); e.g.quaternion.copy(e.g.userData.q0); e.g.children.forEach(m => { if (m !== e.gl) m.scale.y *= o.eye.sy; }); });
  /* the pen's own strokes: on the skin (rays from in front, as the face is laid) or in the air; each rides the joint it is nearest to */
  const near = p => { let bj = 0, bd = 1e9; J.forEach((q, j) => { const dd = Math.hypot(q.p[0] - p[0], q.p[1] - p[1], q.p[2] - p[2]); if (j && dd < bd) { bd = dd; bj = j; } }); return bj; };
  const strokes = (o.pen || []).map(s => { let pts, j; if (s.air) { pts = s.air; j = near(pts[0]); } else { const Dv = new V3().fromArray(s.d || [0, 0, 1]).normalize(), Rv = new V3().crossVectors(new V3(0, 1, 0), Dv).normalize(), Uv = new V3().crossVectors(Dv, Rv), Cv = new V3().fromArray(s.c); j = jh;
        pts = s.pts.map(q => { const p = Cv.clone().addScaledVector(Rv, q[0]).addScaledVector(Uv, q[1]).addScaledVector(Dv, G.H * 0.45); for (let i = 0; i < 200; i++) { const dd = G.f(p.x, p.y, p.z); if (dd < 0.003) { const gr = G.grad(p.x, p.y, p.z, G.cell * 0.3); return [p.x + gr[0] * 0.02, p.y + gr[1] * 0.02, p.z + gr[2] * 0.02]; } p.addScaledVector(Dv, -Math.max(0.004, dd * 0.4)); } return null; }).filter(Boolean); }
    return { j, w: s.w || 0.6, air: !!s.air, fz: s.fz || 0, teeth: !!s.teeth, o: s.o || { smooth: 2, wob: 0.7, min: 3 }, pts: pts.map(p => [p[0] - J[j].p[0], p[1] - J[j].p[1], p[2] - J[j].p[2]]) }; }).filter(s => s.pts.length > 1);
  S.a48 = { strokes, pts: Array.from({ length: 40 }, () => new V3()) };
  /* the wood it stands on is eaten */ if (o.etch && !(extra && extra.jar)) { try { const e = etch48(T, G.pl.rx, G.pl.rz, 3.7 + stage * 1.3); e.position.set(G.pl.x, 0.012, G.pl.z); S.root.add(e); S.etch48 = e; } catch (e) { W48.err = String(e && e.stack); } }
  tint48(T, S); W48.figs.push(S); if (W48.figs.length > 24) W48.figs.splice(0, W48.figs.length - 24); return g; }
function ink48(T, S, ren, cam) { if (!S.t48) tint48(T, S); const R = S.pen30, X = S.a48, sz = ren.getDrawingBufferSize(W30.v2 || (W30.v2 = new T.Vector2())), Wd = sz.x, Ht = sz.y, sc = Ht / 720, pe = cam.projectionMatrix.elements, P10 = pe[10], P11 = pe[11];
  const lw = R.lw || 2, fs = lw / (W30.lw * sc), s2 = sc * Math.min(1.6, Math.max(0.5, fs)), ws = (S.s27 && S.s27.setFromMatrixScale(S.root.matrixWorld).x) || 1, d = 0.03 * S.G.H * ws, pool = X.pts; if (lw < 1.2 || (S.q0 && S.q0.sink > 0.45)) return;
  X.strokes.forEach((s, si) => { if (s.off) return; const M = S.bones[s.j].matrixWorld, n = Math.min(pool.length, s.pts.length); for (let i = 0; i < n; i++) pool[i].set(s.pts[i][0], s.pts[i][1], s.pts[i][2]).applyMatrix4(M); free30(R, pool.slice(0, n), lw * s.w, s2, Wd, Ht, P10, P11, d, 9700 + si * 41, s.o); });
  R.pa.needsUpdate = R.ua.needsUpdate = R.ia.needsUpdate = true; R.mesh.geometry.setDrawRange(0, R.ni); }
/* the pit lies flat on the bench itself, not in the figure's own (tilted) floor: turned back flat in the world each frame, set at the bench's height under the pool */
function lay48(T, S) { const e = S.etch48, p = e.parent, V = W48.v || (W48.v = { q: new T.Quaternion(), a: new T.Vector3(), b: new T.Vector3() }); if (!p) return; let top = p; while (top.parent && !top.parent.isScene) top = top.parent;
  p.updateWorldMatrix(true, false); p.getWorldQuaternion(V.q); e.quaternion.copy(V.q.invert()); p.getWorldPosition(V.a); top.getWorldPosition(V.b); V.a.y = V.b.y + W48.benchY * top.scale.y; p.worldToLocal(V.a); e.position.copy(V.a);
  if (S.wet) e.scale.set(S.wet.scale.x / S.wet.userData.s[0], 1, S.wet.scale.y / S.wet.userData.s[1]); }
draw30 = (f0 => function (T, S, ren, cam) { f0(T, S, ren, cam); if (S.a48) { try { if (S.etch48) lay48(T, S); ink48(T, S, ren, cam); } catch (e) { W48.err = String(e && e.stack); } } })(draw30);
KIT.acid48Fig = acid48Fig; KIT.ACID48 = W48;
/* behind the switch: Acid's bench figure is the spirit at its stage (the jar keeps the old Acid) */
KIT.build = (f0 => function (id, T, grp, tint, extra) { if (id === 'homacid' && KIT.acid48 === 'a' && T && T.SkinnedMesh && grp && grp.add && !(extra && (extra.push || extra.jar))) { try { const g = acid48Fig(T, (extra && extra.stage) || 3, extra); grp.add(g.children[0]); grp.userData.rig2 = g.userData.rig2; grp.userData.rig2.sp.grp = grp; return true; } catch (e) { W48.err = String(e && e.stack); } } return f0.apply(this, arguments); })(KIT.build);
// ==== W48 END
// ==== W52 BEGIN
// (builder 52) THE SNEAK ALIVE AT REST: its own idle, not Water's (AA.rxKit.idle52, on with the sneak; false or ?i52=0 gives Water's rest back on it).
// Water's rest clip is not run for it: rest52 fills the clip's numbers with its own (a candle-flame sway with quick shivers, sly side glances
// toward the page, a grin that widens now and then, each stage's habit), then pose52 bends the joints after the whole play chain has run:
// the flame tip and its forks lick (lengthen, bend, snap back), the licks round the pool rise and fall out of step, the arms do the stage's
// business and every finger curls, drums and uncurls about its own hand. The skin is one skin on these joints, so nothing comes apart.
// Drops: a drip gathers on a fingertip, stretches, falls to the pool's plane and leaves a small etched mark that fades (a flat mark on the
// pool joint, so it lies on the wood with the pit); fizz rings at its landing, a bubble swells and pops in the pit; the fume threads rise,
// curl and thin; stage 5's sleeves pour (pen dashes running down them). In the shelf jar the same idle runs slower and smaller.
//  1 darting and twitchy: ducks into its pit and pops up, jerks side to side, claws wriggling by its face
//  2 rubs its claws together, hunched, bobbing; now and then peeks over a shoulder
//  3 leans toward the page with the long arm stretching, fingers flexing, then draws back; the raised claw drums
//  4 a slow swaying hook, head tilting, long arms swinging, fingers curling, drips trailing from both hands
//  5 slow and grand: arms rise and fall with the sleeves, the crown flares, the cloak of acid pours
KIT.idle52 = KIT.idle52 == null ? !(typeof location !== 'undefined' && /[?&]i52=0/.test(String(location.search))) : KIT.idle52;
const W52 = { err: null, n: 0, ms: 0, jar: 0.6 };
const PAR52 = [null,
  { ps: 1.5, sw: 0.12, sh: 0.06, br: 0.035, bw: 0, gp: 4.1, sp: 5.3, fx: 0.07, ff: 2.6, fs: 0.5, dp: 2.3, cyc: 3.3 },
  { ps: 3.0, sw: 0.06, sh: 0.035, br: 0.03, bw: 0.12, gp: 7.0, sp: 6.1, fx: 0.05, ff: 2.0, fs: 0.45, dp: 3.1, cyc: 7.0 },
  { ps: 2.8, sw: 0.08, sh: 0.035, br: 0.03, bw: 0.05, gp: 5.6, sp: 6.7, fx: 0.05, ff: 1.9, fs: 0.45, dp: 2.7, cyc: 5.2 },
  { ps: 4.6, sw: 0.11, sh: 0.02, br: 0.025, bw: 0.06, gp: 6.4, sp: 7.3, fx: 0.045, ff: 1.5, fs: 0.4, dp: 3.0, cyc: 4.6 },
  { ps: 6.5, sw: 0.045, sh: 0.012, br: 0.025, bw: 0, gp: 8.2, sp: 8.8, fx: 0.035, ff: 1.1, fs: 0.3, dp: 3.4, cyc: 6.5 }];
const on52 = S => !!(S && S.a48 && KIT.idle52 !== false);
const h52 = k => { const v = Math.sin(k * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const n52 = (x, s) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f), a = h52(i + s * 57.3) * 2 - 1, b = h52(i + 1 + s * 57.3) * 2 - 1; return a + (b - a) * u; };
const sm52 = x => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };
const pl52 = (u, a, b, e) => sm52((u - a) / e) * (1 - sm52((u - b) / e));
const fr52 = x => x - Math.floor(x);
const clk52 = S => (typeof performance !== 'undefined' ? performance.now() : 0) / 1000 * (S.jar ? W52.jar : 1) + S.st * 3.7;
/* the clip's numbers, its own (lagMs: outer joints ask a little earlier and so follow late) */
function rest52(S, t, o, q, lagMs) { const st = S.st, k = S.jar ? 0.6 : 1, P = PAR52[st] || PAR52[3], TAU = 2 * PI, tt = clk52(S) - lagMs / 1000 * (S.jar ? W52.jar : 1), sp = o.spent || 0;
  const shv = P.sh * n52(tt * 9, st) * (0.35 + 0.65 * pl52(fr52(tt / 3.1), 0.1, 0.35, 0.05));
  q.lean = k * (P.sw * (Math.sin(TAU * tt / P.ps) + 0.35 * Math.sin(TAU * tt / (P.ps * 0.43) + 1.3)) + shv); q.sq = k * P.br * Math.sin(TAU * tt / (P.ps * 2)); q.bow = P.bw; q.hair = 0;
  /* the sly glance: eyes slide toward the page and hold, the head half turns with them, the brows come down */
  const lx = o.look ? o.look[0] : 1, gs = o.act58 ? 0 : pl52(fr52(tt / P.gp), 0.25, 0.58, 0.05), gl = o.glance || 0; q.lookx = lx * (1.7 * gs + gl); q.looky = -0.55 * gs; q.hturn = lx * 0.32 * gs * k; q.brow = -0.45 * gs + 0.4 * gl;
  /* the grin widens now and then; a blink */ const sg = pl52(fr52(tt / P.sp + 0.4), 0.3, 0.52, 0.07); q.smile = 1 + 1.1 * sg; if (!lagMs) S.g52 = sg; q.blink = pl52(fr52(tt / 4.3 + 0.2), 0, 0.03, 0.02);
  if (o.act58) { /* (builder 58) its act: the stage's idle business waits */ } else if (st === 1) { const du = fr52(tt / P.cyc), dk = pl52(du, 0.52, 0.7, 0.05), pu = du - 0.75; q.sink = 0.5 * dk * k; q.sq += k * (-0.08 * dk + (pu > 0 ? 0.13 * Math.exp(-pu * 14) * Math.sin(pu * 70) : 0)); q.lean += k * 0.12 * Math.tanh(3 * Math.sin(TAU * tt / 1.9 + 0.5)); q.hturn += 0.25 * k * Math.tanh(3 * Math.sin(TAU * tt / 2.3)); q.wide = 0.5 * (pu > 0 ? Math.exp(-pu * 8) : 0); }
  else if (st === 2) { const u = fr52(tt / P.cyc), pk = pl52(u, 0.5, 0.75, 0.07), sd = Math.floor(tt / P.cyc) % 2 ? 1 : -1; q.bow += 0.05 * Math.sin(TAU * tt / 2.4) + 0.06 * pk; q.hturn += 0.9 * pk * sd * k; q.lookx = q.lookx * (1 - pk) + 1.9 * pk * sd; q.tilt = 0.18 * pk * sd * k; q.lean += -0.12 * pk * sd * k; q.sq += 0.025 * Math.sin(TAU * tt * 1.9) * (1 - pk) * k; S.p52 = pk; }
  else if (st === 3) { const u = fr52(tt / P.cyc), lp = pl52(u, 0.12, 0.55, 0.16), bk = pl52(u, 0.74, 0.88, 0.06); q.bow += k * (0.3 * lp - 0.1 * bk); q.lean += -0.05 * lp * k; q.wide = 0.3 * lp; q.lookx = q.lookx * (1 - lp) + 0.6 * lp; q.looky = q.looky * (1 - lp) - 0.6 * lp; }
  else if (st === 4) { q.bow += 0.06 * Math.sin(TAU * tt / P.ps + 0.4) * k; q.tilt = 0.2 * Math.sin(TAU * tt / P.ps - 0.9) * k; }
  else if (st === 5) { q.tilt = 0.05 * Math.sin(TAU * tt / P.ps - 0.8) * k; q.sq += 0.02 * Math.sin(TAU * tt / P.ps * 2) * k; }
  if (o.land != null) { const K = RK, ms = o.land - lagMs; if (ms > 0 && ms < 3000) { const r = K.ring(ms, 420, 520); q.sq -= 0.16 * r; q.px += 0.1 * r; q.pz += 0.1 * r; q.lean += 0.06 * K.ring(ms, 650, 900); } }
  if (sp) { q.sink = (q.sink || 0) + 0.2 * sp; q.bow += 0.2 * sp; q.nod = 0.3 * sp; q.lidx = 0.6 * sp; q.smile = 1 - 0.8 * sp; q.lean += 0.08 * sp; q.brow -= 0.3 * sp; } }
C26.rest = (f0 => function (S, t, o, q, lagMs) { if (on52(S) && S.k52) return rest52(S, t, o || {}, q, lagMs || 0); return f0(S, t, o, q, lagMs); })(C26.rest);
/* the parts it moves, found once from the tags the numbers carry (W48: arm, fi, lick, tongue, crown, sleeve) */
function init52(S) { const G = S.G, J = G.J, R = G.R, bj = G.bj, T = S.T, st = S.st, K = { top: bj.slice(R.head), tongue: [], lick: [], sleeve: [], arm: { 1: [], '-1': [] }, src: [], ev: [], marks: [], op: J.map(() => new T.Vector3()) };
  G.chains.forEach(c => { if (c.kind !== 'limb') return; const l = c.l; if (l.tongue) K.tongue.push(c); else if (l.lick) K.lick.push(c); else if (l.sleeve) K.sleeve.push(c); else if (l.arm) { (K.arm[c.side] || (K.arm[c.side] = [])).push(c);
    /* which way this finger curls in the picture plane: toward the body and down */ const h = J[c.jn[l.arm]].p, e = J[c.jn[c.jn.length - 1]].p, dx = e[0] - h[0], dy = e[1] - h[1], cx = -(c.side || 1), cy = -1; c.cs52 = dx * cy - dy * cx >= 0 ? 1 : -1; } });
  const tipOf = c => c.jn[c.jn.length - 1], pick = (list, f) => { let b = null, bv = 1e9; list.forEach(c => { const v = f(J[tipOf(c)].p); if (v < bv) { bv = v; b = c; } }); return b; }, A = s => K.arm[s] || [];
  const add = (c, j) => { if (c) K.src.push({ j: j == null ? tipOf(c) : c.jn[j], c }); };
  if (st === 1) add(pick(A(1), p => -p[0])); else if (st === 2) add(pick(A(1).concat(A(-1)), p => p[1])); else if (st === 3) add(pick(A(1), p => p[1]));
  else if (st === 4) { add(pick(A(1), p => p[1])); add(pick(A(-1), p => p[1])); } else K.sleeve.forEach(c => add(c, Math.min(c.jn.length - 1, 4)));
  if (!S.jar) { const m = new T.MeshBasicMaterial({ color: new T.Color(0x2a2412).convertSRGBToLinear(), transparent: true, opacity: 0, depthWrite: false }), g = W52.mg || (W52.mg = new T.CircleGeometry(1, 18).rotateX(-PI / 2));
    for (let i = 0; i < 3; i++) { const mk = new T.Mesh(g, m.clone()); mk.visible = false; mk.renderOrder = 4; mk.userData.plain = true; mk.userData.nobox = true; S.bones[0].add(mk); K.marks.push({ m: mk, t0: -1e9 }); } }
  S.v52 = { a: new T.Vector3(), b: new T.Vector3(), c: new T.Vector3(), q: new T.Quaternion(), q2: new T.Quaternion(), z: new T.Vector3(0, 0, 1), y: new T.Vector3(0, 1, 0) }; S.k52 = K; return K; }
/* a run of joints bends: each one from `from` on is carried out from the joint before `from` (stretch), pushed aside more toward the tip, and turned to lie along its new way */
function bend52(S, jn, from, lx, ly, lz, str) { const B = S.bones, n = jn.length, V = S.v52, O = S.k52.op; if (n <= from) return; const cnt = n - from; V.c.copy(B[jn[from - 1]].position);
  for (let k = from - 1; k < n; k++) O[jn[k]].copy(B[jn[k]].position);
  for (let k = from; k < n; k++) { const s = (k - from + 1) / cnt, e = Math.pow(s, 1.6), p = B[jn[k]].position; p.sub(V.c).multiplyScalar(1 + str * s).add(V.c); p.x += lx * e; p.y += ly * e; p.z += lz * e; }
  for (let k = from; k < n; k++) { const a = jn[k - 1], b = jn[k]; V.a.copy(O[b]).sub(O[a]); V.b.copy(B[b].position).sub(B[a].position); if (V.a.lengthSq() < 1e-10 || V.b.lengthSq() < 1e-10) continue; V.q.setFromUnitVectors(V.a.normalize(), V.b.normalize()); B[b].quaternion.premultiply(V.q); } }
/* a run of joints turns about a point (the shoulder) round an axis; w(k) lets the turn fade along it (a sleeve that stays in its pool) */
function rot52(S, jn, from, px, py, pz, ax, ang, w) { const B = S.bones, V = S.v52; for (let k = from; k < jn.length; k++) { const f = w ? w(k) : 1; if (f <= 0) continue; V.q.setFromAxisAngle(ax, ang * f); const p = B[jn[k]].position; p.x -= px; p.y -= py; p.z -= pz; p.applyQuaternion(V.q); p.x += px; p.y += py; p.z += pz; B[jn[k]].quaternion.premultiply(V.q); } }
/* the arm moves by a vector: nothing at the shoulder, all of it at the hand and the finger */
function push52(S, jn, h, dx, dy, dz) { const B = S.bones; for (let k = 1; k < jn.length; k++) { const s = k < h ? sm52(k / h) : 1, p = B[jn[k]].position; p.x += dx * s; p.y += dy * s; p.z += dz * s; } }
/* the finger after the hand curls: each of its three joints turns a third more, in the picture plane */
function curl52(S, c, ang) { const B = S.bones, V = S.v52, O = S.k52.op, jn = c.jn, h = c.l.arm; for (let k = h; k < jn.length; k++) O[jn[k]].copy(B[jn[k]].position); let acc = 0;
  for (let k = h + 1; k < jn.length; k++) { acc += ang / 3; V.q.setFromAxisAngle(V.z, acc); V.a.copy(O[jn[k]]).sub(O[jn[k - 1]]).applyQuaternion(V.q); B[jn[k]].position.copy(B[jn[k - 1]].position).add(V.a); B[jn[k]].quaternion.premultiply(V.q); } }
/* after the whole play chain: the joints, the drips, the marks */
function pose52(S, o) { const K = S.k52 || init52(S), st = S.st, G = S.G, H = G.H, k = S.jar ? 0.6 : 1, P = PAR52[st] || PAR52[3], tt = clk52(S), TAU = 2 * PI, B = S.bones, J = G.J, V = S.v52;
  const fl = (sd, f) => 0.65 * n52(tt * f, sd) + 0.35 * Math.sin(TAU * tt * f * 0.37 + sd * 1.7);
  const lk = sd => { const x = tt * 1.25 + h52(sd), u = fr52(x), a = 0.45 + 0.55 * h52(Math.floor(x) + sd * 3.1); return a * (u < 0.72 ? sm52(u / 0.72) : 1 - sm52((u - 0.72) / 0.14)); };
  const sh = (c, fn) => { const p = B[c.jn[0]].position; fn(p.x, p.y, p.z); };
  const A = s => K.arm[s] || [], cyc = fr52(tt / P.cyc);
  /* the arms: the stage's business (builder 58: not while it acts) */
  const A58 = !!o.act58;
  if (A58) { /* its act moves the arms */ } else if (st === 1) [1, -1].forEach(s => { const a = s * k * 0.22 * n52(tt * 2.6, 4 + s); A(s).forEach(c => sh(c, (x, y, z) => rot52(S, c.jn, 1, x, y, z, V.z, a))); });
  else if (st === 2) { const pk = S.p52 || 0, r = (1 - 0.75 * pk) * k; [1, -1].forEach(s => { const ph = TAU * tt * 1.9, dx = -s * r * 0.075 * H * Math.sin(ph), dy = s * r * 0.035 * H * Math.cos(ph); A(s).forEach(c => push52(S, c.jn, c.l.arm, dx, dy, 0)); }); }
  else if (st === 3) { const lp = pl52(cyc, 0.12, 0.55, 0.16), bk = pl52(cyc, 0.74, 0.88, 0.06); A(1).forEach(c => { const h = J[c.jn[c.l.arm]].p, s0 = J[c.jn[0]].p, dx = h[0] - s0[0], dy = h[1] - s0[1], dz = h[2] - s0[2], L = Math.hypot(dx, dy, dz) || 1, m = k * H * (0.2 * lp - 0.06 * bk) / L; push52(S, c.jn, c.l.arm, dx * m, dy * m + k * 0.03 * H * Math.sin(TAU * tt / 1.3), dz * m); });
    A(-1).forEach(c => sh(c, (x, y, z) => rot52(S, c.jn, 1, x, y, z, V.z, -k * (0.1 * Math.sin(TAU * tt / 2.2) + 0.12 * lp)))); }
  else if (st === 4) [1, -1].forEach(s => { const a = s * k * (0.13 * Math.sin(TAU * tt / P.ps + s * 0.7) + 0.04 * n52(tt * 1.3, s)); A(s).forEach(c => sh(c, (x, y, z) => rot52(S, c.jn, 1, x, y, z, V.z, a))); });
  else if (st === 5) [1, -1].forEach(s => { const a = s * k * (0.24 * Math.sin(TAU * tt / P.ps) + 0.03 * n52(tt * 0.9, s)); A(s).forEach(c => sh(c, (x, y, z) => rot52(S, c.jn, 1, x, y, z, V.z, a)));
    K.sleeve.filter(c => c.side === s).forEach(c => { const n = c.jn.length; sh(c, (x, y, z) => rot52(S, c.jn, 1, x, y, z, V.z, a, j => (j <= 3 ? 1 : Math.max(0, 1 - (j - 3) / Math.max(1, n - 4))))); }); });
  /* every finger: curls, drums, uncurls */
  if (!A58) [1, -1].forEach(s => A(s).forEach(c => { const fi = c.l.fi || 0, cs = c.cs52; let a;
    if (st === 1) a = 0.35 + 0.4 * n52(tt * 3.4, fi + s * 3) + 0.5 * pl52(fr52(tt / 1.1 - fi * 0.11), 0, 0.06, 0.03);
    else if (st === 2) a = 0.35 + 0.3 * Math.sin(TAU * tt * 1.9 + fi * 0.9);
    else if (st === 3) a = s > 0 ? 0.1 + 0.55 * (0.5 + 0.5 * Math.sin(TAU * tt / 1.6 + fi * 0.8)) * (1 - 0.6 * pl52(cyc, 0.12, 0.55, 0.16)) : 0.2 + 0.7 * pl52(fr52(tt / 1.5 - fi * 0.1), 0, 0.05, 0.03);
    else if (st === 4) a = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(TAU * tt / 2.3 + fi * 0.7 + s));
    else a = 0.1 + 0.3 * (0.5 + 0.5 * Math.sin(TAU * tt / 3.2 + fi * 0.9 + s));
    curl52(S, c, cs * k * a); }));
  /* the flame head licks: the tip and each fork lengthen, bend and snap back; the licks round the pool rise and fall out of step */
  const fla = st === 5 ? 0.3 * pl52(fr52(tt / P.ps + 0.15), 0.3, 0.6, 0.12) : 0;
  bend52(S, K.top, 1, k * P.fx * H * fl(1, P.ff), 0, k * 0.4 * P.fx * H * fl(5, P.ff * 0.8), k * (P.fs * lk(2) + fla));
  K.tongue.forEach((c, i) => bend52(S, c.jn, 1, k * P.fx * 1.15 * H * fl(3 + i, P.ff * 1.15), 0, 0, k * (P.fs * 1.2 * lk(7 + i) + fla)));
  K.lick.forEach((c, i) => bend52(S, c.jn, 3, k * 0.025 * H * fl(11 + i, 1.3), 0, 0, k * 0.5 * Math.sin(TAU * tt / (1.6 + 0.37 * (i % 3)) + i * 2.1)));
  /* drops riding a joint follow it where this pass moved it */ S.drops.forEach(dp => { if (!dp.air) return; const b = B[dp.j].position, p = S.P[dp.j]; dp.g.position.x += b.x - p.x; dp.g.position.y += b.y - p.y; dp.g.position.z += b.z - p.z; });
  /* the drips: gather on the tip, stretch, fall to the pool's plane; the landing leaves a mark */
  S.drips.forEach((d, i) => { if (i >= K.src.length || A58) d.g.visible = false; }); if (A58) { K.marks.forEach(mk => { mk.m.visible = false; }); return; }
  const b0 = B[0], n0 = V.b.set(0, 1, 0).applyQuaternion(b0.quaternion), r0 = 0.03 * H / (G.cell * 0.55);
  K.src.forEach((sr, i) => { const d = S.drips[i]; if (!d) return; const per = P.dp * (1 + 0.13 * i), x = tt / per + i * 0.47, u = fr52(x), id = Math.floor(x), tip = B[sr.j].position, g = d.g, g0 = 0.02 * H;
    /* it falls straight down in the world (along the pool's own up), to the wood under the hand */ const hd = Math.max(g0, n0.x * (tip.x - b0.position.x) + n0.y * (tip.y - b0.position.y) + n0.z * (tip.z - b0.position.z) - 0.02), at = s => g.position.set(tip.x - n0.x * s, tip.y - n0.y * s, tip.z - n0.z * s);
    const tf = (0.16 + 0.32 * Math.sqrt(hd / Math.max(0.5, H))) / per, f0 = 0.62, f1 = f0 + tf; g.quaternion.copy(b0.quaternion);
    if (u < f0) { const gth = sm52(u / 0.5), str = sm52((u - 0.5) / 0.12); g.visible = !S.q0 || !(S.q0.sink > 0.3); at(g0 + 0.03 * H * (0.4 * gth + 1.2 * str)); const s = r0 * (0.25 + 0.75 * gth); g.scale.set(s * (1 - 0.25 * str), s * (1.2 + 1.3 * str), s * (1 - 0.25 * str)); }
    else if (u < f1) { const v = (u - f0) / tf, a = g0 + 0.06 * H; g.visible = true; at(a + (Math.max(a, hd) - a) * v * v); g.scale.set(r0 * 0.8, r0 * (2.2 - 0.6 * v), r0 * 0.8); }
    else { g.visible = false; if (sr.id !== id) { sr.id = id; at(hd); K.ev.push({ x: g.position.x, y: g.position.y, z: g.position.z, t0: tt }); if (K.ev.length > 6) K.ev.shift();
      const mk = K.marks.length ? K.marks.reduce((a, b) => (a.t0 < b.t0 ? a : b)) : null; if (mk) { mk.t0 = tt; V.c.copy(g.position).sub(b0.position).applyQuaternion(V.q2.copy(b0.quaternion).invert()); mk.m.position.set(V.c.x / (b0.scale.x || 1), 0.035, V.c.z / (b0.scale.z || 1)); mk.r = 0.035 * H * (0.8 + 0.4 * h52(id + i)); } } } });
  K.marks.forEach(mk => { const a = tt - mk.t0, on = a >= 0 && a < 4; mk.m.visible = on; if (!on) return; const s = mk.r * (0.5 + 0.5 * sm52(a / 0.3)); mk.m.scale.set(s / (B[0].scale.x || 1), 1, s * 0.9 / (B[0].scale.z || 1)); mk.m.material.opacity = 0.6 * (1 - sm52((a - 0.4) / 3.4)); }); }
/* the pen's own strokes come alive: the fume threads rise and curl and thin, the fizz rings swell and pop, the curls rise, the teeth widen with the grin */
function pen52(S) { const X = S.a48, tt = clk52(S), TAU = 2 * PI; if (!X || !X.strokes) return;
  X.strokes.forEach((s, si) => { if (!s.p0) { s.p0 = s.pts.map(p => p.slice()); s.w0 = s.w; } const p0 = s.p0, n = p0.length;
    if (s.air && !s.fz) { const h = Math.hypot(p0[n - 1][0] - p0[0][0], p0[n - 1][1] - p0[0][1]) || 0.5, u = fr52(tt / 2.6 + si * 0.29), a = Math.floor((n - 2) * sm52((u - 0.4) / 0.6)), b = Math.min(n, 2 + Math.ceil((n - 2) * sm52(u / 0.4)));
      s.pts = p0.slice(a, b).map((p, i) => { const ti = (a + i) / (n - 1); return [p[0] + 0.22 * h * ti * Math.sin(TAU * tt * 0.55 - 4 * ti + si), p[1] + u * 0.5 * h, p[2]]; }); s.w = s.w0 * (1 - 0.65 * sm52((u - 0.35) / 0.65)); s.off = b - a < 2; }
    else if (s.fz === 1) { const u = fr52(tt / 1.9 + si * 0.37), c = p0.reduce((m, p) => [m[0] + p[0] / n, m[1] + p[1] / n, m[2] + p[2] / n], [0, 0, 0]), g = 0.3 + 0.9 * sm52(u / 0.75); s.pts = p0.map(p => [c[0] + (p[0] - c[0]) * g, c[1] + (p[1] - c[1]) * g, c[2] + (p[2] - c[2]) * g]); s.off = u > 0.82; s.w = s.w0 * (u > 0.7 ? 1.3 : 1); }
    else if (s.fz === 2) { const u = fr52(tt / 2.2 + si * 0.41), h = Math.abs(p0[n - 1][1] - p0[0][1]) || 0.1, a = Math.floor((n - 2) * sm52((u - 0.45) / 0.55)), b = Math.min(n, 2 + Math.ceil((n - 2) * sm52(u / 0.45))); s.pts = p0.slice(a, b).map(p => [p[0], p[1] + u * 1.2 * h, p[2]]); s.off = b - a < 2; s.w = s.w0 * (1 - 0.5 * u); }
    else if (s.teeth) { const g = 1 + 0.3 * (S.g52 || 0), cx = p0.reduce((m, p) => m + p[0] / n, 0); s.pts = p0.map(p => [cx + (p[0] - cx) * g, p[1], p[2]]); } }); }
/* the pen's strokes in the air that are not on the body: fizz rings where a drip landed, a bubble in the pool, the sleeves pouring */
function ink52(T, S, ren, cam) { const R = S.pen30, K = S.k52, sz = ren.getDrawingBufferSize(W30.v2 || (W30.v2 = new T.Vector2())), Wd = sz.x, Ht = sz.y, sc = Ht / 720, pe = cam.projectionMatrix.elements, P10 = pe[10], P11 = pe[11];
  const lw = R.lw || 2, fs = lw / (W30.lw * sc), s2 = sc * Math.min(1.6, Math.max(0.5, fs)), ws = (S.s27 && S.s27.setFromMatrixScale(S.root.matrixWorld).x) || 1, d = 0.03 * S.G.H * ws, pool = W52.pool || (W52.pool = Array.from({ length: 24 }, () => new T.Vector3())); const A58 = S.c52 === 'act' && S.st === 5; if (lw < 1.2 || (S.q0 && S.q0.sink > 0.45) || (S.c52 !== 'rest' && !A58)) return;
  const tt = clk52(S), H = S.G.H, B = S.bones, b0 = B[0].matrixWorld, rm = S.root.matrixWorld, TAU = 2 * PI, pl = S.G.pl; let sd = 9900;
  const ringAt = (M, cx, cy, cz, rx, ry, rz, n, w) => { for (let i = 0; i <= n; i++) { const a = i / n * TAU; pool[i].set(cx + rx * Math.cos(a), cy + ry * Math.sin(a), cz + rz * Math.sin(a)).applyMatrix4(M); } free30(R, pool.slice(0, n + 1), lw * w, s2, Wd, Ht, P10, P11, d, sd++, { smooth: 1, wob: 0.4, min: 3 }); };
  /* fizz where a drip landed (in the pool joint's own flat plane) */ const iq = S.v52.q2.copy(B[0].quaternion).invert();
  if (!A58) K.ev.forEach(e => { const a = tt - e.t0; if (a < 0 || a > 0.7) return; const v = S.v52.c.set(e.x, e.y, e.z).sub(B[0].position).applyQuaternion(iq), r = 0.035 * H * (0.4 + 1.4 * sm52(a / 0.7)); ringAt(b0, v.x, pl.h * 0.9, v.z, r, 0, r * 0.8, 12, 0.7 * (1 - a / 0.7) + 0.1); });
  /* a bubble swells in the pool and pops */ for (let b = 0; b < (A58 ? 0 : S.st >= 3 ? 2 : 1); b++) { const x = tt / 3.4 + b * 0.5, u = fr52(x), id = Math.floor(x), an = PI * (0.15 + 0.7 * h52(id * 3 + b)), rr = 0.35 + 0.4 * h52(id * 5 + b + 1), bx = pl.x - B[0].position.x + Math.cos(an) * pl.rx * rr, bz = pl.z - B[0].position.z + Math.sin(an) * pl.rz * rr, rb = 0.05 * H * (0.8 + 0.4 * h52(id + 7 * b));
    if (u < 0.8) { const r = rb * sm52(u / 0.8); if (r > 0.004) ringAt(b0, bx, pl.h * 0.8 + r * 0.9, bz, r, r * 0.9, 0, 12, 0.75); }
    else if (u < 0.9) { const v = (u - 0.8) / 0.1; for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.6, r1 = rb * (1 + 0.6 * v), r2 = rb * (1.3 + 0.9 * v); pool[0].set(bx + r1 * Math.cos(a), pl.h * 0.8 + rb * 0.9 + r1 * Math.sin(a), bz).applyMatrix4(b0); pool[1].set(bx + r2 * Math.cos(a), pl.h * 0.8 + rb * 0.9 + r2 * Math.sin(a), bz).applyMatrix4(b0); free30(R, pool.slice(0, 2), lw * 0.7 * (1 - v), s2, Wd, Ht, P10, P11, d, sd++, { smooth: 0, wob: 0.3, min: 2 }); } } }
  /* the sleeves pour: dashes run down the front of each */ if (S.st === 5) K.sleeve.forEach((c, ci) => { const jn = c.jn, n = jn.length - 1, s0 = 3; for (let q = 0; q < 3; q++) { const v = fr52(tt * 0.42 + q / 3 + ci * 0.17); let m = 0;
      for (let i = 0; i <= 6; i++) { const f = s0 + (n - s0) * Math.min(1, v + 0.16 * i / 6), j0 = Math.min(n - 1, Math.floor(f)), t = f - j0, A = B[jn[j0]].position, Bp = B[jn[j0 + 1]].position, r = (J52r(S, jn[j0]) * (1 - t) + J52r(S, jn[j0 + 1]) * t) * 0.9; pool[m++].set(A.x + (Bp.x - A.x) * t + c.side * r * 0.35 * (q - 1), A.y + (Bp.y - A.y) * t, A.z + (Bp.z - A.z) * t + r).applyMatrix4(rm); }
      free30(R, pool.slice(0, m), lw * 0.55 * Math.sin(PI * v), s2, Wd, Ht, P10, P11, d, sd++, { smooth: 1, wob: 0.4, min: 3 }); } });
  R.pa.needsUpdate = R.ua.needsUpdate = R.ia.needsUpdate = true; R.mesh.geometry.setDrawRange(0, R.ni); }
const J52r = (S, j) => S.G.J[j].r * (S.bones[j].scale.x || 1);
play26 = (f0 => function (grp, clip, t, o) { const S = grp && grp.userData.rig2 && grp.userData.rig2.sp;
    /* in the jar the margin's material (W30's 'none') carries no line width, and play27 would throw on it every frame, so nothing after it ran */ const gw = () => { if (on52(S) && S.hull27 && !S.hull27.material.userData.w) S.hull27.material.userData.w = { value: 0 }; }; gw();
    const r = f0(grp, clip, t, o); if (on52(S)) { S.c52 = clip;
    if (clip === 'rest') { const c0 = rn44(); try { if (!S.k52) { init52(S); gw(); f0(grp, clip, t, o); } pose52(S, o || {}); } catch (e) { W52.err = String(e && e.stack); } W52.ms += rn44() - c0; W52.n++; }
    else if (S.k52) S.k52.marks.forEach(mk => { mk.m.visible = false; }); } return r; })(play26);
KIT.spirit26.play = play26;
draw30 = (f0 => function (T, S, ren, cam) { const on = on52(S) && S.k52; if (on) { try { pen52(S); } catch (e) { W52.err = String(e && e.stack); } } f0(T, S, ren, cam); if (on && S.pen30) { try { ink52(T, S, ren, cam); } catch (e) { W52.err = String(e && e.stack); } } })(draw30);
/* the shelf jar: the half-grown and ready figures and the stage form are the sneak (opaque, fitted to the glass), idling slower */
function jar52(T, g) { const U = g.userData;
  [[U.big, 1], [U.mid, 0.62]].forEach(([c, k]) => { if (!c) return; c.children.slice().forEach(o => c.remove(o)); const f = acid48Fig(T, k < 1 ? 2 : 3, { jar: true }), q = fit44(T, f, 0.86, 1.95, 1.3), s = q.s * k, cs = c.scale.x || 1, inn = new T.Group(); inn.add(f); inn.scale.setScalar(s / cs); inn.position.set((-q.cx * s - c.position.x) / cs, (0.21 - q.y0 * s - c.position.y) / cs, (-q.cz * s - c.position.z) / cs); c.add(inn); });
  U.form = sg => { if (U.sg === sg) return; U.sg = sg; const f = acid48Fig(T, sg, { jar: true, stage: sg }), q = fit44(T, f, 0.88, 1.95, 1.6), pv = new T.Group(); pv.add(f); pv.scale.setScalar(q.s); pv.position.set(-q.cx * q.s, 0.21 - q.y0 * q.s, -q.cz * q.s);
    if (U.big2) g.remove(U.big2); pv.visible = (U.big && U.big.visible) || !!(U.big2 && U.big2.visible) || U.stage === 2; if (U.big) U.big.visible = false; g.add(pv); U.big2 = pv; }; }
if (KIT.jar) KIT.jar = (f0 => function (T, key) { const j = f0.apply(this, arguments); if (j && key === 'acid' && KIT.acid48 === 'a' && KIT.acid35 !== 'a' && T && T.SkinnedMesh) { try { jar52(T, j); } catch (e) { W52.err = String(e && e.stack); } } return j; })(KIT.jar);
KIT.W52 = W52;
// ==== W52 END
// ==== W55 BEGIN
// (builder 55) ACID'S OWN CHANGE OF STAGE, "eats itself, erupts" (AA.rxKit.evo55, on with the sneak; false or ?v55=0 gives the old one back).
// The page (scheme S55) brings it from home to the middle of the screen over the open book, large and beside the molecule, and home again seen
// from behind. Here: the motion and what the acid does to the page, on the music's beats (PAR55: go, sink, boil, erupt, look, home).
//  1. THE SINK: it grins, folds its claws over its head and lets itself down into its own pit: every joint is carried straight down in the
//     world through the page (the page hides what is under it), twisting and pinched at the rim like something swallowed, flame tip last.
//  2. THE BOIL: the pit, now a hole in the page (pit55: a dark floor, the far wall lit, the near rim cut), boils (bubbles swell and burst,
//     licks leap at the rim), eats outward in bites and deepens; the paper scorches brown at the rim and bleaches beyond; a column of fume
//     (puffs of wash that rise, swell and thin, pen curls on them) pours up bending toward the lamp and shades the page; drops spit out and
//     leave etched pocks that fade. The old body is changed for the new one while both are deep under the page. A held instant: only the fume moves.
//  3. THE ERUPTION: on the hit the claws shoot up out of the pit through the fume and slap down on the rim; the new form hauls itself out
//     (each step its own way: the imp pops, the sneak climbs out one arm first and peers, the fiend comes up hooked and straightens, the
//     devourer rises slowly with its arms spread), acid running off it, the fume torn aside, head thrown back; then it looks down at the page.
//  4. HOME: the pit closes to the new stage's own, the scorch fades (the page is clean after), it goes home seen from behind in a low sliding
//     lick, flame tip bobbing, and settles.
KIT.evo55 = KIT.evo55 == null ? !(typeof location !== 'undefined' && /[?&]v55=0/.test(String(location.search))) : KIT.evo55;
const W55 = { err: null, e: null, v: null };
const on55 = S => !!(S && S.a48 && !S.jar && KIT.evo55 !== false);
const cl55 = x => (x < 0 ? 0 : x > 1 ? 1 : x), sm55 = x => { x = cl55(x); return x * x * (3 - 2 * x); }, pu55 = (x, a, b, w) => sm55((x - a) / w) * (1 - sm55((x - b) / w));
/* each step: beats of go, sink, boil (the last hd of it held), erupt, look, home; the pit's widest (of the largest), the fume's height; how it comes out:
   sh/sl the claws shoot up and slap the rim (per side), hl it hauls itself out (ov: overshoot of its height), rl the claws let go of the rim, hb head thrown back */
const PAR55 = [null, null,
  { b: [2, 0.75, 2.25, 1.0, 1.0, 2.0], hd: 0.4, pit: 0.62, fume: 0.6, tw: 1.5, sides: { 1: [0, 0.1, 0.2, 0.27], '-1': [0.02, 0.12, 0.22, 0.29] }, hl: [0.28, 0.52], ov: 0.16, rl: [0.4, 0.62], hb: [0.42, 0.72], shH: 0.55, spit: 0.32 },
  { b: [2, 1.0, 3.0, 1.75, 1.0, 2.0], hd: 0.5, pit: 0.78, fume: 0.8, tw: 0.9, sides: { 1: [0, 0.08, 0.2, 0.26], '-1': [0.44, 0.5, 0.52, 0.57] }, peer: [0.27, 0.4], hl: [0.58, 0.85], ov: 0.0, rl: [0.7, 0.92], hb: [0.8, 0.98], shH: 0.5, spit: 0.26 },
  { b: [2, 1.0, 4.0, 1.5, 1.25, 2.0], hd: 0.6, pit: 0.88, fume: 0.95, tw: 0.8, sides: { 1: [0, 0.1, 0.26, 0.33], '-1': [0.02, 0.12, 0.27, 0.34] }, hook: [0.5, 0.85], hl: [0.34, 0.66], ov: 0.06, rl: [0.55, 0.8], hb: [0.66, 0.9], shH: 0.65, spit: 0.22 },
  { b: [2, 1.5, 4.5, 2.25, 1.25, 1.5], hd: 0.75, pit: 1.0, fume: 1.25, tw: 0.7, sides: { 1: [0, 0.1, 0.25, 0.32], '-1': [0, 0.1, 0.25, 0.32] }, hl: [0.32, 0.8], ov: 0.03, rl: [0.45, 0.78], hb: [0.62, 0.92], shH: 0.7, wide: 1, spit: 0.18 }];
/* where it is in the change: every number the motion, the pit, the fume and the room read */
function ph55(t, o) { const P = PAR55[Math.max(2, Math.min(5, o.to | 0))], b = P.b, L = o.L || 500, u = t / L, c = []; let s = 0; b.forEach(x => { c.push(s); s += x; });
  const at = i => cl55((u - c[i]) / b[i]), e = o.e55 || (o.e55 = {}), hf = P.hd / b[2];
  e.u = u; e.L = L; e.P = P; e.c = c; e.tot = s; e.hit = c[3]; e.to = o.to; e.from = o.from; e.pre = u < 0;
  e.go = at(0); e.sink = at(1); e.boil = at(2); e.v = at(3); e.look = at(4); e.home = at(5); e.bo = cl55(e.boil / (1 - hf)); e.hold = u >= c[2] && e.boil > 1 - hf && u < c[3] ? 1 : 0; e.done = u >= s; e.old = u < c[2];
  const r0 = o.r055 || 0.3, r1 = o.r155 || 0.35, top = P.pit;
  e.pr = u < c[2] ? r0 * (1 + 0.2 * sm55(e.sink)) : u < c[3] ? r0 * 1.2 + (top - r0 * 1.2) * cl55(sm55(e.bo) + 0.035 * Math.sin(e.bo * 29) * e.bo * (1 - e.bo) * 4) : u < c[4] ? top * (1 + 0.06 * Math.exp(-e.v * 5)) : top + (r1 - top) * sm55(e.look);
  e.ha = u < c[2] ? sm55(e.sink / 0.4) : 1 - sm55((e.home - 0.05) / 0.45);
  e.deep = u < c[2] ? 0.35 * e.sink : u < c[3] ? 0.35 + 0.65 * sm55(e.bo) : u < c[4] ? 1 : u < c[5] ? 1 - 0.7 * sm55(e.look) : 0.3 * (1 - sm55(e.home / 0.5));
  e.scorch = u < c[2] ? 0.2 * e.sink : u < c[3] ? 0.2 + 0.8 * sm55(e.bo / 0.8) : u < c[4] ? 1 : u < c[5] ? 1 - 0.45 * e.look : 0.55 * (1 - sm55(e.home / 0.6));
  e.fume = e.pre ? 0 : u < c[2] ? 0.25 * e.sink : u < c[3] ? 0.25 + 0.75 * sm55(e.bo / 0.6) : u < c[4] ? 1 - sm55(e.v / 0.4) : 0; e.reach = u < c[2] ? 0.25 * e.sink : u < c[3] ? 0.25 + 0.75 * sm55(e.bo / 0.75) : 1;
  e.tear = u >= c[3] && u < c[4] ? sm55(e.v / 0.18) : 0;
  e.dim = e.pre ? 0 : u < c[1] ? 0.75 * sm55((e.go - 0.2) / 0.8) : u < c[5] ? 0.75 + 0.25 * sm55(e.sink * 1.5) : 1 - sm55(e.home / 0.8);
  e.flash = u >= c[3] ? Math.exp(-(u - c[3]) / 0.3) : 0; return e; }
/* Water's rest clip numbers with ours laid over them (the face, the bow, the turn home) */
C26.rest = (f0 => function (S, t, o, q, lagMs) { const r = f0(S, t, o, q, lagMs), z = o && o.z55; if (z) { for (const k in z) { if (k === 'bow' || k === 'lean' || k === 'sq' || k === 'hturn' || k === 'lookx') q[k] = (q[k] || 0) + z[k]; else q[k] = z[k]; } } return r; })(C26.rest);
/* the world's down in the joints' own space, and how high the figure stands above its pool along the world's up */
function frame55(S) { const T = S.T, B = S.bones, par = B[0].parent, g = S.g55 || (S.g55 = { dn: new T.Vector3(), up: new T.Vector3(), xh: new T.Vector3(), fz: new T.Vector3(), c: new T.Vector3(), q: new T.Quaternion(), s: new T.Vector3(), a: new T.Vector3(), b: new T.Vector3(), top: 1 });
  par.updateWorldMatrix(true, false); par.getWorldQuaternion(g.q); g.dn.set(0, -1, 0).applyQuaternion(g.q.invert()).normalize(); g.up.copy(g.dn).negate(); par.getWorldScale(g.s); g.ws = g.s.y;
  g.xh.set(1, 0, 0).addScaledVector(g.up, -g.up.x).normalize(); g.fz.crossVectors(g.xh, g.up).normalize(); g.c.copy(B[0].position); return g; }
const ht55 = (g, p) => (p.x - g.c.x) * g.up.x + (p.y - g.c.y) * g.up.y + (p.z - g.c.z) * g.up.z;
function top55(S, g) { const B = S.bones, J = S.G.J; let top = 0; for (let j = 1; j < B.length; j++) { const h = ht55(g, B[j].position) + J[j].r * (B[j].scale.y || 1); if (h > top) top = h; } return top; }
/* every joint goes down in the world by D (twisting about the pool's axis and pinched where it passes the rim); the loose drops go with it */
function dive55(S, g, D, pinch, tw) { const B = S.bones, H = S.G.H, a = g.a, q = g.q; if (Math.abs(D) < 1e-5 && !tw) return;
  for (let j = 0; j < B.length; j++) { const b = B[j], p = b.position, h = ht55(g, p), h2 = h - D;
    if (tw) { const an = tw * sm55(1 - h2 / (0.7 * H)); if (Math.abs(an) > 1e-4) { q.setFromAxisAngle(g.up, an); a.copy(p).sub(g.c).applyQuaternion(q); p.copy(g.c).add(a); b.quaternion.premultiply(q); } }
    p.addScaledVector(g.dn, D); if (pinch) { const k = 1 - pinch * Math.exp(-(h2 * h2) / (0.012 * H * H)); b.scale.x *= k; b.scale.z *= k; } }
  S.drops.forEach(dp => dp.g.position.addScaledVector(g.dn, D)); S.drips.forEach(dp => dp.g.position.addScaledVector(g.dn, D)); }
/* the hand of one side carried by a vector (all its fingers the same), the shoulder staying */
function hand55(S, sd, dx, dy, dz) { const K = S.k52; (K.arm[sd] || []).forEach(c => push52(S, c.jn, c.l.arm, dx, dy, dz)); }
const hp55 = (S, sd) => { const A = S.k52.arm[sd]; return A && A.length ? S.bones[A[0].jn[A[0].l.arm]].position : null; };
/* the old form: grin, claws folded over its head, down into its own pit */
function sink55(S, e) { const H = S.G.H, g = frame55(S), K = S.k52, s = e.sink, P = e.P; if (s <= 0 && !e.pre) return;
  const w = sm55(s / 0.3), hd = S.bones[S.G.bj[S.G.R.head]].position;
  [1, -1].forEach(sd => { const hp = hp55(S, sd); if (!hp || w <= 0) return; const tx = hd.x + g.up.x * 0.1 * H + g.xh.x * sd * 0.09 * H + g.fz.x * 0.06 * H, ty = hd.y + g.up.y * 0.1 * H + g.xh.y * sd * 0.09 * H + g.fz.y * 0.06 * H, tz = hd.z + g.up.z * 0.1 * H + g.xh.z * sd * 0.09 * H + g.fz.z * 0.06 * H;
    hand55(S, sd, (tx - hp.x) * w, (ty - hp.y) * w, (tz - hp.z) * w); (K.arm[sd] || []).forEach(c => curl52(S, c, (c.cs52 || 1) * 0.7 * w)); });
  const top = top55(S, g), Dm = top * 1.1 + 0.06 * H, x = cl55((s - 0.22) / 0.78), D = s < 0.22 ? -0.05 * H * Math.sin(PI * s / 0.22) : Dm * (Math.pow(x, 1.3) + 0.05 * Math.sin(3 * PI * x) * (1 - x));
  dive55(S, g, D, 0.38 * sm55(s / 0.3), P.tw * sm55((s - 0.15) / 0.85)); e.D = D; e.Dm = Dm; }
/* the new form: under the page through the boil; then the claws, the haul, the look */
function rise55(S, e, o) { const H = S.G.H, g = frame55(S), P = e.P, v = e.u < e.hit ? 0 : e.v, K = S.k52; if (e.u >= e.c[4]) return;
  const R = (o.c55 ? o.c55.R : 3) * e.pr / Math.max(1e-4, g.ws), top = top55(S, g), Dm = top * 1.12 + 0.08 * H, hl = P.hl, h = cl55((v - hl[0]) / (hl[1] - hl[0])), hs = sm55(h);
  let D = Dm * (1 - hs) - P.ov * H * Math.sin(PI * Math.min(1, hs * 1.15)) * (h < 1 ? 1 : 0);
  if (P.peer && v >= P.peer[0] && h <= 0) { const hh = ht55(g, S.bones[S.G.bj[S.G.R.head]].position), Dp = hh - 0.06 * H; D = Dm + (Dp - Dm) * sm55((v - P.peer[0]) / (P.peer[1] - P.peer[0])); }
  if (h >= 1) D = -0.035 * H * Math.exp(-(v - hl[1]) * 9) * Math.sin((v - hl[1]) * 30);
  /* the claws: up out of the pit through the fume, down on the rim, holding while it hauls, let go */ const rl = sm55((v - P.rl[0]) / (P.rl[1] - P.rl[0]));
  [1, -1].forEach(sd => { const hp = hp55(S, sd), q = P.sides[sd]; if (!hp || !q || e.u < e.hit) return; const wu = sm55((v - q[0]) / Math.max(0.01, q[1] - q[0])), ws = sm55((v - q[2]) / Math.max(0.01, q[3] - q[2])); if (wu <= 0) return;
    const nx = hp.x + g.dn.x * D, ny = hp.y + g.dn.y * D, nz = hp.z + g.dn.z * D, c = g.c, sx = (P.wide ? 0.7 : 0.45) * R * sd, shH = P.shH * H * 1.25, rx = (P.wide ? 1.0 : 0.9) * R * sd;
    const ax = c.x + g.xh.x * sx + g.up.x * shH + g.fz.x * 0.1 * R, ay = c.y + g.xh.y * sx + g.up.y * shH + g.fz.y * 0.1 * R, az = c.z + g.xh.z * sx + g.up.z * shH + g.fz.z * 0.1 * R;
    const bx = c.x + g.xh.x * rx + g.up.x * 0.03 * H + g.fz.x * 0.2 * R, by = c.y + g.xh.y * rx + g.up.y * 0.03 * H + g.fz.y * 0.2 * R, bz = c.z + g.xh.z * rx + g.up.z * 0.03 * H + g.fz.z * 0.2 * R;
    let tx = nx + (ax - nx) * wu, ty = ny + (ay - ny) * wu, tz = nz + (az - nz) * wu; tx += (bx - tx) * ws; ty += (by - ty) * ws; tz += (bz - tz) * ws; const k = 1 - rl;
    hand55(S, sd, (tx - nx) * k, (ty - ny) * k, (tz - nz) * k); (K.arm[sd] || []).forEach(c2 => curl52(S, c2, (c2.cs52 || 1) * (-0.35 * wu * (1 - ws) + 0.75 * ws) * k)); });
  dive55(S, g, D, D > 0 ? 0.3 * cl55(D / Dm * 2) : 0, 0); e.D = D; e.Dm = Dm; }
/* the face and the bow for each beat (laid over the rest clip by the C26.rest wrapper) */
function face55(z, e, st, old) { const P = e.P, u = e.u;
  if (old) { if (e.pre) { z.sq = -0.08; z.smile = 1.5; return; } const s = e.sink; z.smile = 1.5 + 0.5 * sm55(s / 0.2); z.lean = -0.12 * Math.sin(PI * e.go) * (1 - s); z.wide = 0.6 * pu55(s, 0.02, 0.3, 0.08); z.brow = 0.5 * s; z.looky = 0.5 * (1 - s); z.blink = sm55((s - 0.55) / 0.2); z.nod = -0.25 * sm55(s / 0.4); return; }
  if (u < e.c[4]) { const v = u < e.hit ? 0 : e.v, hb = pu55(v, P.hb[0], P.hb[1], 0.08); z.smile = 1.3 + 0.6 * hb; z.nod = -0.75 * hb; z.looky = 0.9 * hb; z.wide = 0.7 * hb + 0.4 * pu55(v, 0, 0.3, 0.06); z.open = 0.8 * hb; z.brow = 0.6 * hb;
    if (P.peer) { const pk = pu55(v, P.peer[0], P.hl[0] + 0.05, 0.05); z.hturn = 0.5 * Math.sin((v - P.peer[0]) * 22) * pk; z.lookx = 1.6 * Math.sin((v - P.peer[0]) * 22) * pk; z.lidx = 0.45 * pk; }
    if (P.hook) { const k = 1 - sm55((v - P.hook[0]) / (P.hook[1] - P.hook[0])); z.bow = 1.0 * k; z.nod = (z.nod || 0) + 0.6 * k; }
    if (P.ov > 0.1) z.sq = 0.16 * pu55(v, P.hl[0], P.hl[1], 0.1); return; }
  /* it looks down at the page, its own way; then home */ const lk = pu55(u, e.c[4], e.c[5] + 0.3, 0.25), ATT = [null, null, { smile: 1.8, lidx: 0, brow: 0.3 }, { smile: 1.5, lidx: 0.45, brow: -0.3 }, { smile: 1.35, lidx: 0.2, brow: -0.6 }, { smile: 1.8, lidx: 0.3, brow: -0.2 }][st] || {};
  z.nod = 0.35 * lk; z.looky = -0.75 * lk; z.lookx = 0.8 * lk; z.smile = 1 + (ATT.smile - 1) * lk; z.lidx = ATT.lidx * lk; z.brow = ATT.brow * lk;
  if (e.home > 0) { const hm = e.home, tn = sm55(hm / 0.18) * (1 - sm55((hm - 0.86) / 0.14)); z.turn = PI * tn; z.lean = 0.14 * Math.sin(hm * PI * 6) * tn; z.sq = -0.12 * Math.abs(Math.sin(hm * PI * 3)) * tn; } }
/* the pit as a hole in the page, the scorch round it, the pocks, the fume's shade */
function pitMat55(T) { const pk = []; for (let i = 0; i < 8; i++) pk.push(new T.Vector4(0, 0, 0, 2));
  return new T.ShaderMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { cW: { value: new T.Vector2() }, R: { value: 1 }, ha: { value: 0 }, deep: { value: 0 }, sc: { value: 0 }, fu: { value: 0 }, fo: { value: new T.Vector2(0.5, 0.4) }, tm: { value: 0 }, sd: { value: 3.1 }, bo: { value: 0 }, pk: { value: pk } },
    vertexShader: 'varying vec2 vW;\nvoid main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'uniform vec2 cW;\nuniform float R;\nuniform float ha;\nuniform float deep;\nuniform float sc;\nuniform float fu;\nuniform vec2 fo;\nuniform float tm;\nuniform float sd;\nuniform float bo;\nuniform vec4 pk[8];\nvarying vec2 vW;\n' + N35 + [
      'void main() { vec2 q = (vW - cW) / R; float pc = length(q), a = atan(q.y, q.x); vec3 cs = vec3(cos(a), sin(a), sd);',
      /* the edge it eats: ragged, gnawing slowly round */
      '  float e = 1.0 + 0.11 * (N35(cs * vec3(2.2, 2.2, 1.0) + vec3(0.0, 0.0, tm * 0.12)) - 0.5) + 0.07 * (N35(cs * vec3(7.0, 7.0, 1.0) + vec3(3.0, 3.0, tm * 0.3)) - 0.5) + 0.035 * (N35(cs * vec3(19.0, 19.0, 1.0) + 5.0) - 0.5);',
      '  float ins = 1.0 - smoothstep(e - 0.015, e + 0.004, pc), n1 = N35(vec3(q * 4.0, sd + 1.0)), n2 = N35(vec3(q * 13.0, sd + 4.0));',
      /* the floor is seen nearer the eye the deeper it is; what is left between it and the far rim is the inner wall */
      '  vec2 fc = vec2(0.0, 0.34 * deep); float fr = e * (1.0 - 0.22 * deep), fd = length((q - fc) * vec2(1.0, 1.06)) / fr, fl = 1.0 - smoothstep(0.97, 1.0, fd);',
      '  vec3 liq = mix(vec3(0.10, 0.14, 0.05), vec3(0.30, 0.46, 0.10), 0.5 * smoothstep(0.3, 0.9, N35(vec3(q * 2.6, tm * 0.5 + sd))) * (1.0 - 0.5 * deep)) * (1.0 - 0.35 * deep * (1.0 - fd));',
      /* bubbles on the floor: they swell and burst */
      '  vec2 g5 = (q - fc) * 4.2, c5 = floor(g5), f5 = fract(g5) - 0.5; float h5 = H35(vec3(c5, sd + 5.0)), ph = fract(tm * (0.45 + 0.5 * h5) + h5 * 7.0), br = 0.08 + 0.34 * ph, d5 = length(f5 - (vec2(H35(vec3(c5, sd + 7.0)), H35(vec3(c5, sd + 8.0))) - 0.5) * 0.3);',
      '  float bub = step(0.35, h5) * bo * fl * (1.0 - smoothstep(0.02, 0.05, abs(d5 - br))) * (ph < 0.86 ? 1.0 : step(0.5, N35(vec3(f5 * 9.0, ph * 40.0)))) * (1.0 - smoothstep(0.9, 1.0, ph));',
      '  liq = mix(liq, vec3(0.80, 0.92, 0.50), 0.85 * bub); liq = mix(liq, vec3(0.62, 0.80, 0.30), 0.3 * bo * step(0.35, h5) * (1.0 - smoothstep(br - 0.06, br, d5)) * fl);',
      /* the far wall: lit, streaked by what it ate, darker down into the floor */
      '  float wy = clamp((fd - 1.0) / max(0.05, (e - fr) * 1.5), 0.0, 1.0); vec3 wall = mix(vec3(0.20, 0.17, 0.08), vec3(0.62, 0.55, 0.32), wy) * (0.82 + 0.3 * N35(vec3(a * 14.0, pc * 2.0, sd + 9.0))); wall = mix(wall, vec3(0.42, 0.56, 0.18), 0.35 * (1.0 - wy));',
      '  vec3 col = mix(wall, liq, fl);',
      /* the near rim: a thin lit lip, and the pen line on the edge, broken */
      '  float lip = smoothstep(e - 0.07, e - 0.02, pc) * ins * smoothstep(-0.2, 0.4, q.y / max(pc, 1e-3)); col = mix(col, vec3(0.90, 0.93, 0.70), 0.7 * lip);',
      '  float ink = (1.0 - smoothstep(0.01, 0.026, abs(pc - e))) * smoothstep(0.25, 0.42, N35(cs * vec3(3.0, 3.0, 1.0) + 13.0));',
      /* outside: charred brown at the rim, bleached and yellowed beyond */
      '  float o0 = smoothstep(e - 0.004, e + 0.01, pc), w1 = 0.2 + 0.1 * N35(cs * vec3(5.0, 5.0, 1.0) + 2.0), ch = o0 * (1.0 - smoothstep(e + w1 * 0.4, e + w1, pc)) * (0.75 + 0.35 * n1), bl = o0 * (1.0 - smoothstep(e + 0.25, e + 0.85 + 0.25 * n1, pc));',
      '  vec3 oc = mix(vec3(0.97, 0.94, 0.80), vec3(0.24, 0.14, 0.06), clamp(ch * 1.2, 0.0, 1.0)); float oa = sc * max(ch * (0.85 + 0.15 * n2), 0.5 * bl);',
      /* the fume's shade, thrown from the lamp, moving */
      '  vec2 sv = fo; float st = clamp(dot(q, sv) / max(1e-3, dot(sv, sv)), 0.0, 1.0); float sdd = length(q - sv * st) / (0.55 + 0.35 * st + 0.25 * (N35(vec3(q * 1.8 - vec2(tm * 0.3, 0.0), sd + 11.0)) - 0.5)); float shd = fu * 0.32 * (1.0 - smoothstep(0.4, 1.0, sdd)) * (1.0 - ins);',
      /* pocks where spat drops landed: an etched pit with a pale middle, fading */
      '  float pkA = 0.0; vec3 pkC = vec3(0.0); for (int i = 0; i < 8; i++) { vec4 p = pk[i]; if (p.w >= 1.0 || p.z <= 0.0) continue; float d = length(vW - cW - p.xy) / p.z + 0.25 * (N35(vec3((vW - p.xy) * 9.0, float(i))) - 0.5); float pa = (1.0 - smoothstep(0.85, 1.0, d)) * (1.0 - smoothstep(0.5, 1.0, p.w)) * smoothstep(0.0, 0.05, p.w);',
      '    vec3 pcol = mix(vec3(0.97, 0.96, 0.82), vec3(0.22, 0.15, 0.07), smoothstep(0.45, 0.8, d)); if (pa > pkA) { pkA = pa; pkC = pcol; } }',
      '  vec4 o = vec4(oc, oa * (1.0 - ins)); o = vec4(mix(o.rgb, vec3(0.0), shd / max(0.001, o.a + shd)), max(o.a, shd)); if (pkA > 0.0) { o.rgb = mix(o.rgb, pkC, pkA / max(0.001, max(o.a, pkA))); o.a = max(o.a, pkA * (1.0 - ins)); }',
      '  vec4 hole = vec4(col, ins); hole.rgb = mix(hole.rgb, vec3(0.08, 0.06, 0.05), 0.9 * ink); hole.a = max(hole.a, 0.9 * ink);',
      '  float hA = hole.a * ha; vec3 rgb = mix(o.rgb, hole.rgb, hA / max(0.001, hA + o.a * (1.0 - hA))); gl_FragColor = vec4(rgb, clamp(hA + o.a * (1.0 - hA), 0.0, 1.0)); }'].join('\n') }); }
/* a puff of the fume: wash, lit on the lamp's side, pooled at its edge */
function puffMat55(T, sd) { return new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { al: { value: 0 }, sd: { value: sd }, lt: { value: 1 } },
  vertexShader: 'varying vec2 vU;\nvoid main() { vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform float al;\nuniform float sd;\nuniform float lt;\nvarying vec2 vU;\n' + N35 + [
    'void main() { vec2 p = vU * 2.0 - 1.0; float n = N35(vec3(p * 2.2, sd)), n2 = N35(vec3(p * 5.0, sd + 3.0)), d = length(p) + 0.38 * (n - 0.5) + 0.14 * (n2 - 0.5), a = 1.0 - smoothstep(0.5, 0.92, d);',
    '  float lit = clamp(0.5 + 0.7 * dot(p / max(0.001, length(p)), vec2(-0.62, 0.78)) * smoothstep(0.1, 0.8, d), 0.0, 1.0); vec3 c = mix(vec3(0.56, 0.62, 0.52), vec3(0.94, 0.96, 0.86), lit * lt);',
    '  c = mix(c, vec3(0.48, 0.58, 0.40), 0.45 * smoothstep(0.55, 0.88, d)); gl_FragColor = vec4(c, a * al * (0.72 + 0.28 * n2)); }'].join('\n') }); }
const NP55 = 18;
function make55(T, S) { const X = { live: false, puffs: [], sp: [], pk: [], tm: 0, tf: 0, last: 0, spT: 0, v: new T.Vector3(), w: new T.Vector3(), c: new T.Vector3(), pts: Array.from({ length: 40 }, () => new T.Vector3()) };
  const pg = new T.PlaneGeometry(2, 2); pg.rotateX(-PI / 2); const pit = X.pit = new T.Mesh(pg, pitMat55(T)); pit.renderOrder = 3.5; pit.frustumCulled = false; pit.visible = false; pit.userData.plain = true; pit.userData.nobox = true; pit.castShadow = false;
  const qg = new T.PlaneGeometry(1, 1); for (let i = 0; i < NP55; i++) { const m = new T.Mesh(qg, puffMat55(T, 1.7 + i * 2.3)); m.renderOrder = 21; m.frustumCulled = false; m.visible = false; m.userData.plain = true; m.userData.nobox = true; m.castShadow = false; X.puffs.push({ m, h: h30(i * 41 + 7), h2: h30(i * 13 + 3), p: 0, r: 0, a: 0 }); }
  for (let i = 0; i < 8; i++) X.pk.push({ x: 0, z: 0, r: 0, t0: -1e9 }); return X; }
function hide55(X) { if (!X) return; X.live = false; X.pit.visible = false; X.puffs.forEach(p => { p.m.visible = false; }); X.sp.length = 0; X.pk.forEach(p => { p.t0 = -1e9; }); }
function kill55(S) { const O = S.e55; if (O) { if (O.gg.parent) O.gg.parent.remove(O.gg); S.e55 = null; } }
function end55(S) { kill55(S); hide55(S.x55); S.root.visible = true; }
/* one frame of the pit, the fume, the spat drops (world places from the figure's pool and the page's height) */
function stage55(S, X, grp, e, o) { const T = S.T, now = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000, dt = Math.min(0.1, Math.max(0, now - (X.last || now))); X.last = now; let top = grp; while (top.parent) top = top.parent;
  [X.pit].concat(X.puffs.map(p => p.m)).forEach(m => { if (m.parent !== top) top.add(m); });
  const C55 = o.c55 || { R: 3, y: 0.03, Hc: 8 }, Rm = C55.R, R = Rm * e.pr, cW = X.c; S.root.updateWorldMatrix(true, false); const pl = S.G.pl; cW.set(pl.x, 0, pl.z).applyMatrix4(S.root.matrixWorld); cW.y = C55.y; X.R = R; X.Rm = Rm;
  if (!e.hold) X.tm += dt; X.tf += dt; const P = e.P, U = X.pit.material.uniforms, ext = 3.2 * Math.max(R, 0.4 * Rm);
  X.pit.visible = e.ha > 0.002 || e.scorch > 0.002 || X.pk.some(p => now - p.t0 < 1.6); X.pit.position.set(cW.x, cW.y + 0.014, cW.z); X.pit.scale.set(ext / 2 * 2, 1, ext / 2 * 2);
  U.cW.value.set(cW.x, cW.z); U.R.value = Math.max(1e-3, R); U.ha.value = e.ha; U.deep.value = e.deep; U.sc.value = e.scorch; U.fu.value = e.fume * e.reach; U.tm.value = X.tm; U.bo.value = e.old ? 0.5 * e.sink : e.u < e.hit ? 1 : 1 - sm55(e.v / 0.3);
  /* the fume column: puffs rise from the pit, swell, lean toward the lamp, thin; the hit tears them aside */ const Hf = C55.Hc * P.fume * 0.95, Rp = Math.max(0.5 * R, 0.15 * Hf), lx = -1, UY = 0.697, UZ = -0.717; U.fo.value.set(0.48 * Hf * e.reach / Math.max(1e-3, R), 0.33 * Hf * e.reach / Math.max(1e-3, R));
  X.Hf = Hf; X.puffs.forEach((pf, i) => { const m = pf.m, p = (X.tf * (0.2 + 0.06 * pf.h) + i / NP55) % 1, y = p * Hf, yy = y / Math.max(1e-3, Hf), lean = 0.16 * Hf * Math.pow(yy, 1.5), wob = 0.07 * Hf * yy * Math.sin(X.tf * 1.1 + i * 1.7), sd = i % 2 ? 1 : -1, tr = e.tear * R * (1.2 + 2.4 * yy) * (0.6 + 0.6 * pf.h2);
    const a = e.fume * sm55(p / 0.08) * (1 - sm55((p - 0.62) / 0.38)) * (1 - sm55((yy - e.reach) / 0.12)) * (1 - 0.85 * e.tear); pf.p = p; pf.a = a; pf.r = Rp * (0.45 + 1.1 * p) * (1 + 0.4 * e.tear);
    m.visible = a > 0.01; if (!m.visible) return; m.position.set(cW.x + lx * lean + wob + sd * tr, cW.y + UY * (y + 0.6 * pf.r), cW.z + UZ * (y + 0.6 * pf.r) + 0.15 * R); m.scale.set(pf.r * 2, pf.r * 2, 1); m.material.uniforms.al.value = a; if (W55.cam) { m.quaternion.copy(W55.cam.quaternion); } m.updateMatrixWorld(); });
  /* spat drops: out of the boiling pit in arcs; each leaves a pock where it lands */ const spit = !e.old && e.u < e.hit ? (e.hold ? 0 : 1) : e.u >= e.hit && e.v < 0.6 ? 1.6 : e.sink > 0.5 ? 0.5 : 0;
  if (spit > 0) { X.spT += dt * spit; const per = P.spit; while (X.spT > per) { X.spT -= per; const n = (X.sn = (X.sn || 0) + 1), an = 6.2832 * h30(n * 7 + 1), d = R * (1.15 + 0.95 * h30(n * 11 + 3)) * (e.u >= e.hit ? 1.25 : 1); X.sp.push({ t0: now, an, d, h: R * (0.5 + 0.7 * h30(n * 5 + 2)), r: R * (0.045 + 0.04 * h30(n * 3 + 9)), x0: Math.cos(an) * R * 0.4, z0: Math.sin(an) * R * 0.4 }); if (X.sp.length > 12) X.sp.shift(); } }
  X.sp = X.sp.filter(s => { const f = (now - s.t0) / 0.5; if (f < 1) return true; const k = X.pk.reduce((a, b) => (a.t0 < b.t0 ? a : b)); k.x = Math.cos(s.an) * s.d; k.z = Math.sin(s.an) * s.d * 0.9; k.r = s.r; k.t0 = now; X.fz = X.fz || []; X.fz.push({ x: k.x, z: k.z, t0: now }); if (X.fz.length > 6) X.fz.shift(); return false; });
  X.pk.forEach((p, i) => { const age = (now - p.t0) / 1.5; U.pk.value[i].set(p.x, p.z, age < 1 ? p.r : 0, Math.max(0, Math.min(1, age))); }); X.now = now; }
/* the pen's part: curls on the fume, the column's edges, licks at the rim, big bubbles, spat drops and their fizz, acid running off the new form */
function ink55(T, S, X, ren, cam) { const R = S.pen30, e = X.e, sz = ren.getDrawingBufferSize(W30.v2 || (W30.v2 = new T.Vector2())), Wd = sz.x, Ht = sz.y, sc = Ht / 720, pe = cam.projectionMatrix.elements, P10 = pe[10], P11 = pe[11];
  const lw = Math.max(R.lw || 2, 1.6 * sc), fs = lw / (W30.lw * sc), s2 = sc * Math.min(1.6, Math.max(0.5, fs)), pts = X.pts, C = X.c, Rr = X.R, ce = cam.matrixWorld.elements, rx = ce[0], ry = ce[1], rz = ce[2], ux = ce[4], uy = ce[5], uz = ce[6], d = 0.02 * Rr; let sd = 12000;
  const st = (n, w, o) => free30(R, pts.slice(0, n), w, s2, Wd, Ht, P10, P11, d, sd++, o || { smooth: 2, wob: 0.7, min: 3 });
  /* a curl on each puff */ X.puffs.forEach((pf, i) => { if (pf.a < 0.14 || !pf.m.visible || i % 2) return; const m = pf.m.position, a0 = 1.2 + 0.5 * Math.sin(X.tf * 0.7 + i), n = 9; for (let k = 0; k < n; k++) { const t = k / (n - 1), an = a0 + 2.4 * t, r = pf.r * 0.62 * (1 - 0.3 * t); pts[k].set(m.x + (rx * Math.cos(an) + ux * Math.sin(an)) * r, m.y + (ry * Math.cos(an) + uy * Math.sin(an)) * r, m.z + (rz * Math.cos(an) + uz * Math.sin(an)) * r); } st(n, lw * (0.35 + 0.45 * pf.a)); });
  /* the column's two edges, wavering up */ if (e.fume * e.reach > 0.3 && e.tear < 0.5) { const Hf = X.Hf, Rp = Math.max(0.5 * Rr, 0.15 * Hf); [1, -1].forEach(s => { const n = 12, top = Hf * e.reach * 0.8; for (let k = 0; k < n; k++) { const y = top * k / (n - 1), yy = y / Hf, lean = 0.16 * Hf * Math.pow(yy, 1.5), w = s * Rp * (0.55 + 1.0 * yy) + 0.06 * Hf * yy * Math.sin(X.tf * 1.3 + yy * 6 + s); pts[k].set(C.x - lean + rx * w, C.y + 0.697 * y + 0.1 * Rr, C.z - 0.717 * y + rz * w + 0.15 * Rr); } st(n, lw * 0.5 * (1 - e.tear), { smooth: 2, wob: 1.0, min: 4 }); }); }
  /* licks leaping at the rim */ const bo = e.old ? sm55((e.sink - 0.4) / 0.6) : e.u < e.hit ? 1 : 1 - sm55(e.v / 0.25); if (bo > 0.02 && e.ha > 0.3) { const nL = 5 + 2 * (e.to - 2); for (let i = 0; i < nL; i++) { const h = h30(i * 29 + 4), an = (i + 0.5 * h) / nL * 6.2832, ph = X.tm * (1.4 + 1.2 * h) + h * 9, lift = Math.max(0, Math.sin(ph)) * (0.25 + 0.45 * h30(i * 7 + Math.floor(ph / 6.2832))) * Rr * bo, ex = 1 + 0.08 * Math.sin(an * 3); if (lift < 0.04 * Rr) continue;
      const bx = C.x + Math.cos(an) * Rr * ex, bz = C.z + Math.sin(an) * Rr * ex, ox = Math.cos(an), oz = Math.sin(an), n = 6; for (let k = 0; k < n; k++) { const t = k / (n - 1), out = 0.18 * Rr * Math.sin(t * 2.6) * (0.6 + h); pts[k].set(bx + ox * out - ox * 0.12 * Rr * t * t, C.y + lift * t, bz + oz * out * 0.9); } st(n, lw * 0.7); } }
  /* big bubbles: they swell over the floor and burst */ if (bo > 0.05 && e.ha > 0.5) { const nb = 2 + (e.to >= 4 ? 1 : 0); for (let b = 0; b < nb; b++) { const x = X.tm / (1.1 + 0.3 * b) + b * 0.37, u = x % 1, id = Math.floor(x), an = 6.2832 * h30(id * 13 + b), rr = 0.5 * h30(id * 17 + b + 3), rb = Rr * (0.16 + 0.1 * h30(id + 7 * b)) * bo, bx = C.x + Math.cos(an) * Rr * rr, bz = C.z + Math.sin(an) * Rr * rr * 0.8 + 0.3 * e.deep * Rr, by = C.y + 0.01;
      if (u < 0.8) { const r = rb * sm55(u / 0.8), n = 13; if (r < 0.02 * Rr) continue; for (let k = 0; k < n; k++) { const a = k / (n - 1) * 6.2832; pts[k].set(bx + rx * Math.cos(a) * r + ux * 0, by + r * 0.85 + uy * Math.sin(a) * r * 0.85, bz + rz * Math.cos(a) * r + uz * Math.sin(a) * r * 0.85); } st(n, lw * 0.7); }
      else { const v = (u - 0.8) / 0.2; for (let k = 0; k < 5; k++) { const a = k / 5 * 6.2832 + 0.4, r1 = rb * (1 + 0.6 * v), r2 = rb * (1.35 + 1.0 * v); pts[0].set(bx + rx * Math.cos(a) * r1, by + rb * 0.85 + uy * Math.sin(a) * r1, bz + rz * Math.cos(a) * r1 + uz * Math.sin(a) * r1); pts[1].set(bx + rx * Math.cos(a) * r2, by + rb * 0.85 + uy * Math.sin(a) * r2, bz + rz * Math.cos(a) * r2 + uz * Math.sin(a) * r2); st(2, lw * 0.7 * (1 - v), { smooth: 0, wob: 0.3, min: 2 }); } } } }
  /* the spat drops in flight, and a fizz where each landed */ const now = X.now || 0; X.sp.forEach(s => { const f = (now - s.t0) / 0.5; if (f < 0 || f >= 1) return; const x = C.x + s.x0 + (Math.cos(s.an) * s.d - s.x0) * f, z = C.z + s.z0 + (Math.sin(s.an) * s.d * 0.9 - s.z0) * f, y = C.y + 4 * s.h * f * (1 - f) + 0.02, r = s.r * 0.6, n = 9; for (let k = 0; k < n; k++) { const a = k / (n - 1) * 6.2832; pts[k].set(x + (rx * Math.cos(a) + ux * Math.sin(a)) * r, y + (ry * Math.cos(a) + uy * Math.sin(a)) * r, z + (rz * Math.cos(a) + uz * Math.sin(a)) * r); } st(n, lw * 0.65, { smooth: 1, wob: 0.3, min: 3 }); });
  (X.fz || []).forEach(q => { const a = now - q.t0; if (a < 0 || a > 0.6) return; const r = Rr * 0.07 * (0.5 + 1.5 * sm55(a / 0.6)), n = 12; for (let k = 0; k < n; k++) { const an = k / (n - 1) * 6.2832; pts[k].set(C.x + q.x + Math.cos(an) * r, C.y + 0.02, C.z + q.z + Math.sin(an) * r * 0.8); } st(n, lw * 0.55 * (1 - a / 0.6) + 0.1 * lw, { smooth: 1, wob: 0.4, min: 3 }); });
  /* acid running off the new form as it comes out */ if (!e.old && e.u >= e.hit && e.v > e.P.hl[0] && e.v < 1 && S === X.S) { const B = S.bones, J = S.G.J, ws = (S.g55 && S.g55.ws) || 1, H = S.G.H * ws, list = S.k52 ? [S.G.bj[S.G.R.chest], S.G.bj[Math.max(1, S.G.R.chest - 2)], S.G.bj[S.G.R.neck]].concat([1, -1].map(sd => { const A = S.k52.arm[sd]; return A && A.length ? A[0].jn[Math.max(1, A[0].l.arm - 1)] : 0; })) : [];
    const cp = X.w.setFromMatrixPosition(cam.matrixWorld), fadeR = 1 - sm55((e.v - 0.75) / 0.25); list.forEach((j, i) => { if (!j) return; for (let q = 0; q < 2; q++) { const ph = (X.tf * 1.7 + i * 0.31 + q * 0.5) % 1, p = X.v.setFromMatrixPosition(B[j].matrixWorld), r = J[j].r * ws * Math.max(0.2, B[j].scale.x); const dx = cp.x - p.x, dy = cp.y - p.y, dz = cp.z - p.z, dl = Math.hypot(dx, dy, dz) || 1, sx = (q ? 0.45 : -0.35) * r;
      const x0 = p.x + dx / dl * r * 1.05 + rx * sx, y0 = p.y + dy / dl * r * 1.05 + ry * sx - H * 0.16 * ph, z0 = p.z + dz / dl * r * 1.05 + rz * sx; if (y0 < C.y + 0.05) continue; pts[0].set(x0, y0, z0); pts[1].set(x0, y0 - H * 0.05, z0); pts[2].set(x0, y0 - H * 0.1, z0); st(3, lw * 0.55 * Math.sin(PI * ph) * fadeR, { smooth: 1, wob: 0.3, min: 2 }); } }); }
  R.pa.needsUpdate = R.ua.needsUpdate = R.ia.needsUpdate = true; R.mesh.geometry.setDrawRange(0, R.ni); }
function evo55(f0, grp, S, t, o) { const e = ph55(t, o), T = S.T, X = S.x55 || (S.x55 = make55(T, S)); X.live = true; X.e = e; X.S = S; W55.e = e;
  let O = S.e55; const ro = z => ({ look: [1, 0.5], z55: z });
  if (e.old) { if (!O || O.from !== o.from) { kill55(S); const gg = acid48Fig(T, o.from, { stage: o.from }), sp = gg.userData.rig2.sp; sp.o55 = S; grp.parent.add(gg); O = S.e55 = { gg, sp, from: o.from }; }
    O.gg.visible = true; O.gg.position.copy(grp.position); O.gg.quaternion.copy(grp.quaternion); O.gg.scale.copy(grp.scale); S.root.visible = false;
    const z = O.sp.z55 || (O.sp.z55 = {}); for (const k in z) delete z[k]; face55(z, e, o.from, true); f0(O.gg, 'rest', t / e.L, ro(z)); if (O.sp.k52) sink55(O.sp, e);
    const g = O.sp.g55; if (g) o.r055 = O.sp.G.pl.rx * 1.32 * g.ws / Math.max(1e-3, (o.c55 ? o.c55.R : 3)); }
  else { if (O) kill55(S); S.root.visible = true; const z = S.z55 || (S.z55 = {}); for (const k in z) delete z[k]; face55(z, e, S.st, false); f0(grp, 'rest', t / e.L, ro(z)); if (S.k52) rise55(S, e, o); }
  { const g = S.g55 || frame55(S); o.r155 = S.G.pl.rx * 1.32 * g.ws / Math.max(1e-3, (o.c55 ? o.c55.R : 3)); }
  stage55(S, X, grp, e, o);
  const c = e.c, P = e.P, u = e.u, sl = Math.min(P.sides[1][2], P.sides['-1'][2]) + 0.04; let n = -1; if (u >= e.hit + sl * P.b[3]) n = 0; if (u >= e.hit + P.hl[1] * P.b[3]) n = 1; if (u >= c[4]) n = 2; if (u >= c[5]) n = 3; if (u >= e.tot - 0.08) n = 4.8;
  return { e: 0, y: 0, lunge: 0, n, big: 0, done: e.done, home: e.home >= 0.96 }; }
play26 = (f0 => function (grp, clip, t, o) { const S = grp && grp.userData.rig2 && grp.userData.rig2.sp;
  if (!(clip === 'evo' && o && o.from && on55(S) && o.from !== S.st)) { if (S && S.x55 && S.x55.live && clip !== 'evo') { try { end55(S); } catch (e) { W55.err = String(e && e.stack); } } return f0(grp, clip, t, o); }
  try { return evo55(f0, grp, S, t, o); } catch (err) { W55.err = String(err && err.stack); const L = o.L || 500, tot = (PAR55[Math.max(2, Math.min(5, o.to | 0))] || PAR55[3]).b.reduce((a, b) => a + b, 0); return { e: 0, y: 0, n: t / L > tot ? 4.8 : -1, big: 0, done: t / L >= tot, home: t / L >= tot - 0.1 }; } })(play26);
KIT.spirit26.play = play26;
draw30 = (f0 => function (T, S, ren, cam) { f0(T, S, ren, cam); const M = S.o55 || S, X = M.x55; if (X && X.live) W55.cam = cam; if (!X || !X.live || !X.e || !S.pen30) return; const fr = ren.info && ren.info.render ? ren.info.render.frame : 0; if (X.df === fr) return; X.df = fr; try { ink55(T, S, X, ren, cam); } catch (e) { W55.err = 'ink ' + String(e && e.stack); } })(draw30);
KIT.W55 = W55; KIT.e55dbg = () => { const e = W55.e; return { err: W55.err, e: e ? { u: +e.u.toFixed(2), go: +e.go.toFixed(2), sink: +e.sink.toFixed(2), boil: +e.boil.toFixed(2), v: +e.v.toFixed(2), look: +e.look.toFixed(2), home: +e.home.toFixed(2), pr: +e.pr.toFixed(2), D: e.D != null ? +e.D.toFixed(2) : null, Dm: e.Dm != null ? +e.Dm.toFixed(2) : null, hit: e.hit, tot: e.tot, old: e.old } : null }; };
// ==== W55 END
// ==== W58 BEGIN
// (builder 58) ACID'S OWN ACT (AA.rxKit.act58, on with the sneak; false or ?a58=0 gives the old act, which is Water's played on it).
// The page (scheme S58) lays the times out on the music's beats and gives the atoms the rules counted as chewed (their world places);
// here the sneak plays it with its own body, joint by joint, after its own rest pass (W52 with its idle business held back):
//  1. LEAVING: a glance left and right, a rub of the claws; then it slides upright and leaning, on a narrow lick of acid (its pool drawn in
//     under it; the pit stays at home), flame tip streaming back; at the book's edge both claws go over the edge and it hauls itself up;
//     then it creeps on the page in small tiptoe surges.
//  2. AT THE MOLECULE: it rears up and looks the molecule over; for each atom: reach, pinch, pluck (the page stretches and parts the bond),
//     hold it up and admire it, a mouth far too wide, the drop, the gulp (snap shut, a fizz, a wisp of fume); quicker and greedier with each
//     one (the second hardly admired, the third and later both hands stuffing), the flame taller and the grin wider each time.
//  3. HOME: it licks its fingers, belches, turns its back and slides home seen from behind, a little fatter, flame tip bobbing, drops into
//     its pit and settles.
KIT.act58 = KIT.act58 == null ? !(typeof location !== 'undefined' && /[?&]a58=0/.test(String(location.search))) : KIT.act58;
const W58 = { err: null, e: null };
const cl58 = x => (x < 0 ? 0 : x > 1 ? 1 : x), sm58 = x => { x = cl58(x); return x * x * (3 - 2 * x); }, pu58 = (x, a, b, w) => sm58((x - a) / w) * (1 - sm58((x - b) / w));
/* the sub-beats of one atom by its kind (0 the first, 1 the second, 2 the greedy rest): reach, pinch, pull (parts at its end), lift ends, mouth opens, drop; gulp at 1 */
const AK58 = [{ re: 0.2, pi: 0.3, pu: 0.48, li: 0.8, op: 0.7, dr: 0.88 }, { re: 0.24, pi: 0.33, pu: 0.52, li: 0.7, op: 0.6, dr: 0.84 }, { re: 0.3, pi: 0.36, pu: 0.5, li: 0.62, op: 0.38, dr: 0.8 }];
/* where it is in the act at t (ms since the tap): every number the motion, the atoms and the page read. Z is the plan the page made */
function ph58(t, Z) { const e = { t, ph: 'pre', e: 0, i: -1, u: 0, sh: 1, at: [], ate: 0, pool: 1, y: 0, done: t >= Z.tEnd, home: t >= Z.tP + 200 };
  const L = Z.L, n = Z.a.length; let ate = 0;
  Z.a.forEach((a, i) => { const K = AK58[a.kind], s = { k: 0, f: 0 }, w = a.t1 - a.t0, u = (t - a.t0) / w;
    if (t >= a.t1) { const f = (t - a.t1) / (0.9 * L); s.k = f < 1 ? 4 : 5; s.f = cl58(f); ate += 1 - (1 - sm58(f * 2)) * 0.6; }
    else if (u >= K.dr) { s.k = 3; s.f = (u - K.dr) / (1 - K.dr); } else if (u >= K.pu) { s.k = 2; s.f = (u - K.pu) / (K.dr - K.pu); } else if (u >= K.pi) { s.k = 1; s.f = (u - K.pi) / (K.pu - K.pi); }
    e.at.push(s); });
  e.ate = ate;
  if (t < Z.tS) { e.ph = 'glance'; e.g = cl58(t / Z.tS); }
  else if (t < Z.tE) { e.ph = 'slide'; const u = (t - Z.tS) / (Z.tE - Z.tS); e.s = u; e.e = Z.eE * (0.55 * u + 0.45 * sm58(u)); }
  else if (t < Z.tH) { e.ph = 'haul'; const u = (t - Z.tE) / (Z.tH - Z.tE); e.hl = u; e.e = Z.eE + (Z.eH - Z.eE) * sm58((u - 0.3) / 0.6); e.y = sm58((u - 0.3) / 0.55); }
  else if (t < Z.tC) { e.ph = 'slide'; const u = (t - Z.tH) / (Z.tC - Z.tH); e.s = 0.15 + 0.85 * u; e.e = Z.eH + (Z.eC - Z.eH) * (1 - (1 - u) * (1 - u)); e.y = 1; }
  else if (t < Z.tA) { e.ph = 'creep'; const u = (t - Z.tC) / (Z.tA - Z.tC), N = Z.steps, f = u - Math.sin(2 * PI * u * N) / (2 * PI * N); e.c = u; e.cs = u * N; e.e = Z.eC + (1 - Z.eC) * f; e.y = 1; }
  else if (t < Z.tB) { e.e = 1; e.y = 1; e.ph = n && t >= Z.a[0].t0 ? 'atom' : 'rear'; e.r = cl58((t - Z.tA) / Math.max(1, (n ? Z.a[0].t0 : Z.tB) - Z.tA));
    for (let i = 0; i < n; i++) if (t >= (Z.a[i].m0 != null ? Z.a[i].m0 : Z.a[i].t0)) e.i = i; if (e.i >= 0) { const a = Z.a[e.i], w = a.t1 - a.t0; if (a.m0 != null && t < a.t0) { e.sh = sm58((t - a.m0) / (a.t0 - a.m0)); e.wk = (t - a.m0) / 300; } e.u = (t - a.t0) / w; e.ag = t - a.t1; } }
  else if (t < Z.tT) { e.ph = 'lick'; e.e = 1; e.y = 1; e.lk = (t - Z.tB) / (Z.tT - Z.tB); e.i = n - 1; e.ag = t - (n ? Z.a[n - 1].t1 : Z.tB); }
  else if (t < Z.tP) { e.ph = 'back'; const u = (t - Z.tT) / (Z.tP - Z.tT); e.b = u; const f = 0.5 * u + 0.5 * sm58(u); e.e = 1 - f; e.y = e.e > Z.eE ? 1 : 0; }
  else { e.ph = 'pit'; e.pt = cl58((t - Z.tP) / Math.max(1, Z.tEnd - Z.tP)); e.e = 0; }
  /* its pool: drawn in to a narrow lick under it while it is away (the pit stays at home) */ e.pool = 1 - 0.7 * sm58((t - Z.tS + 120) / 260) + 0.7 * sm58((t - Z.tP) / 300);
  return e; }
/* the world places the page needs back each frame: each claw's tip, the mouth, the belly */
function out58(S) { const T = S.T, B = S.bones, par = B[0].parent, K = S.k52, o = S.o58 || (S.o58 = { h: { 1: new T.Vector3(), '-1': new T.Vector3() }, m: new T.Vector3(), b: new T.Vector3(), v: new T.Vector3() });
  par.updateWorldMatrix(true, false); const M = par.matrixWorld;
  [1, -1].forEach(sd => { const A = K.arm[sd] || [], h = o.h[sd]; h.set(0, 0, 0); if (!A.length) return; A.forEach(c => { h.add(o.v.copy(B[c.jn[c.jn.length - 1]].position)); }); h.multiplyScalar(1 / A.length); const hb = B[A[0].jn[A[0].l.arm]].position; h.lerp(hb, 0.35).applyMatrix4(M); });
  const hd = B[S.G.bj[S.G.R.head]].position; if (S.F && S.F.om) { S.F.om.updateWorldMatrix(true, false); S.F.om.getWorldPosition(o.m); } else o.m.copy(hd).applyMatrix4(M);
  o.b.copy(B[S.G.bj[S.G.R.chest]].position).lerp(B[S.G.bj[Math.max(1, S.G.R.chest - 2)]].position, 0.5).applyMatrix4(M); S.h58 = o; }
/* a world point in the joints' own space */
const loc58 = (S, w) => { const v = S.o58v || (S.o58v = new S.T.Vector3()); return S.bones[0].parent.worldToLocal(v.set(w.x, w.y, w.z)).clone(); };
/* one claw goes to a point (joint space) by w; its fingers open (a < 0) or close (a > 0) */
function claw58(S, sd, x, y, z, w, a) { const hp = hp55(S, sd); if (!hp || w <= 0) { if (a) (S.k52.arm[sd] || []).forEach(c => curl52(S, c, (c.cs52 || 1) * a)); return; } hand55(S, sd, (x - hp.x) * w, (y - hp.y) * w, (z - hp.z) * w); (S.k52.arm[sd] || []).forEach(c => curl52(S, c, (c.cs52 || 1) * a)); }
/* its open mouth: the O of the face, made far too wide, with a dark green inside */
function mouth58(S, k) { const om = S.F && S.F.om; if (!om) return; let d = om.userData.d58; const T = S.T;
  if (!d) { let bb = null; om.traverse(c => { if (c.isMesh && c.geometry && !bb) { c.geometry.computeBoundingBox(); bb = c.geometry.boundingBox.clone(); } }); if (!bb) return; const c = bb.getCenter(new T.Vector3()), s = bb.getSize(new T.Vector3());
    d = new T.Mesh(new T.CircleGeometry(1, 22), new T.MeshBasicMaterial({ color: new T.Color(0x1d2a0c).convertSRGBToLinear() })); d.position.set(c.x, c.y, c.z - 0.002); d.scale.set(s.x * 0.48, s.y * 0.48, 1); d.userData.plain = true; d.userData.nobox = true; om.add(d); om.userData.d58 = d;
    const g2 = new T.Mesh(new T.CircleGeometry(1, 16), new T.MeshBasicMaterial({ color: new T.Color(0x9fc23a).convertSRGBToLinear() })); g2.position.set(0, -0.55, 0.001); g2.scale.set(0.55, 0.3, 1); d.add(g2); }
  if (k > 0.02) { om.visible = true; if (S.F.mouth) S.F.mouth.visible = false; om.scale.set(0.9 + 1.7 * k, 0.7 + 2.6 * k, 1); } }
/* the act, joint by joint, after the rest pass */
function pose58(S, e, Z, z) { const G = S.G, H = G.H, K = S.k52, B = S.bones, st = S.st, n = Z.a.length, ate = e.ate, T = S.T, nw = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000;
  const hd = B[G.bj[G.R.head]].position, ch = B[G.bj[G.R.chest]].position, P0 = B[0].position, big = st >= 5 ? 1.3 : st <= 1 ? 0.8 : 1;
  const rest = sd => { const A = K.arm[sd]; return A && A.length ? B[A[0].jn[A[0].l.arm]].position.clone() : ch.clone(); };
  let flame = 0.12 * ate * big, fx = 0, fz = 0, mo = 0;
  /* the licks round the pool come in with it */ const pk = e.pool; if (pk < 0.999) K.lick.forEach(c => c.jn.forEach((j, k) => { if (!k) return; const p = B[j].position; p.x = P0.x + (p.x - P0.x) * pk; p.z = P0.z + (p.z - P0.z) * pk; p.y *= 0.4 + 0.6 * pk; B[j].scale.multiplyScalar(0.5 + 0.5 * pk); }));
  if (e.ph === 'glance') { const g = e.g, rb = pu58(g, 0.5, 1.02, 0.1); /* rub: the claws meet before its chest and slide past each other */
    [1, -1].forEach(sd => { const ph = nw * 2 * PI * 2.6, x = ch.x + sd * 0.07 * H, y = ch.y + 0.04 * H + sd * 0.025 * H * Math.sin(ph), zz = ch.z + 0.2 * H + sd * 0.02 * H * Math.cos(ph); claw58(S, sd, x, y, zz, 0.85 * rb, 0.5 * rb); }); }
  else if (e.ph === 'slide') { const s = e.s, w = sm58(s / 0.15) * (1 - sm58((s - 0.9) / 0.1)); fz = -0.28 * H * w; fx = 0.05 * H * Math.sin(nw * 17) * w; /* claws back along its flanks */
    [1, -1].forEach(sd => { const r = rest(sd); claw58(S, sd, r.x + sd * 0.04 * H, r.y - 0.06 * H, r.z - 0.18 * H, 0.8 * w, 0.4 * w); }); }
  else if (e.ph === 'haul') { const u = e.hl, gr = sm58(u / 0.3) * (1 - sm58((u - 0.8) / 0.2)); /* both claws over the edge before it, then it pulls itself up and over */
    [1, -1].forEach(sd => { claw58(S, sd, P0.x + sd * 0.16 * H, P0.y + 0.04 * H + 0.1 * H * (1 - sm58(u / 0.3)), P0.z + 0.42 * H * (1 - 0.6 * sm58((u - 0.3) / 0.5)), gr, 0.9 * gr - 0.3 * (1 - gr)); }); fz = -0.1 * H * gr; }
  else if (e.ph === 'creep') { const ph = e.cs % 1, lift = Math.sin(PI * ph); /* tiptoe: claws held up by its chest, fingers dangling, a little rise on each surge */
    [1, -1].forEach(sd => claw58(S, sd, ch.x + sd * 0.13 * H, ch.y + 0.02 * H + 0.02 * H * lift, ch.z + 0.16 * H, 0.75 * sm58(e.c / 0.15), 0.95)); fz = -0.06 * H * lift; }
  else if (e.ph === 'rear') { const r = e.r; [1, -1].forEach(sd => claw58(S, sd, ch.x + sd * 0.14 * H, ch.y + 0.08 * H, ch.z + 0.15 * H, 0.8 * sm58(r / 0.3), 0.7 - 0.9 * sm58((r - 0.6) / 0.3))); }
  else if (e.ph === 'atom' || e.ph === 'lick') {
    const i = e.i, a = Z.a[i], Kd = a ? AK58[a.kind] : AK58[0], u = e.u, at = a && Z.at[i];
    if (e.ph === 'atom' && a && at && !a.sk) { a.sk = 1; const t0 = loc58(S, at); a.sd = a.kind === 2 && e.i > 0 ? -Z.a[e.i - 1].sd : t0.x >= ch.x ? 1 : -1; }
    if (e.ph === 'atom' && a && at) { const sd = a.sd, tg = loc58(S, at), up = hd.y + (a.kind ? 0.16 : 0.42) * H, ox = sd * (a.kind ? 0.16 : 0.34) * H, mx = S.h58 ? loc58(S, S.h58.m) : hd;
      const wR = sm58(u / Kd.re), pull = sm58((u - Kd.pi) / (Kd.pu - Kd.pi)), lift = sm58((u - Kd.pu) / (Kd.li - Kd.pu)), toM = sm58((u - (Kd.li - 0.04)) / (Kd.dr + 0.04 - Kd.li));
      /* the claw: out to the atom, pinch, pull it back toward itself, up beside its head to admire, over the mouth, let go */
      let x = tg.x, y = tg.y, zz = tg.z; const bx = (tg.x - ch.x), bz = (tg.z - ch.z), bl = Math.hypot(bx, bz) || 1; x -= bx / bl * 0.12 * H * pull; zz -= bz / bl * 0.12 * H * pull; y += 0.08 * H * pull;
      x += (hd.x + ox - x) * lift; y += (up - y) * lift; zz += (hd.z + 0.12 * H - zz) * lift; x += (mx.x - x) * toM; y += (mx.y + 0.16 * H - y) * toM; zz += (mx.z + 0.06 * H - zz) * toM;
      const back = u >= 1 ? sm58(e.ag / (0.35 * Z.L)) : 0, w = wR * (1 - back), cu = -0.6 * (1 - sm58((u - Kd.re + 0.05) / 0.08)) + 1.1 * sm58((u - Kd.re + 0.04) / 0.07) - 1.4 * pu58(u, Kd.dr + 0.02, 1.2, 0.04);
      claw58(S, sd, x, y, zz, w, cu * (1 - back));
      /* the greedy ones: the other claw shoves at the mouth too */ if (a.kind === 2) claw58(S, -sd, mx.x - sd * 0.05 * H, mx.y - 0.02 * H, mx.z + 0.1 * H, sm58((u - 0.4) / 0.3) * (1 - back), 0.9);
      else claw58(S, -sd, ch.x - sd * 0.12 * H, ch.y + 0.05 * H, ch.z + 0.14 * H, 0.6, 0.6 + 0.3 * Math.sin(nw * 9) * (1 - lift));
      mo = sm58((u - Kd.op) / (Kd.dr - Kd.op + 0.02)) * (1 - sm58((e.ag || -1e9) / 90));
      /* the gulp: a swallow down the neck, the flame jumps */ if (e.ag > 0) flame += 0.25 * Math.exp(-e.ag / 260) * big; }
    else { /* lick: a claw to the mouth, the fingers drawn through it; then the belch */ const lk = e.lk, s2 = (n ? Z.a[n - 1].sd : 1), mx = S.h58 ? loc58(S, S.h58.m) : hd, w = pu58(lk, 0.05, 0.6, 0.12);
      claw58(S, s2, mx.x + s2 * 0.04 * H * Math.sin(lk * 30), mx.y + 0.02 * H, mx.z + 0.08 * H, w, 0.8 + 0.4 * Math.sin(lk * 30)); mo = 0.25 * w * (0.5 + 0.5 * Math.sin(lk * 30)) + 0.75 * pu58(lk, 0.68, 0.86, 0.05); } }
  else if (e.ph === 'back') { const b = e.b, w = sm58(b / 0.12) * (1 - sm58((b - 0.9) / 0.1)); fz = 0.22 * H * w; fx = 0.06 * H * Math.sin(nw * 11) * w; /* the flame tip bobs as it goes */ flame += 0.08 * Math.sin(nw * 13) * w;
    [1, -1].forEach(sd => { const r = rest(sd); claw58(S, sd, r.x + sd * 0.05 * H, r.y - 0.05 * H, r.z + 0.12 * H, 0.7 * w, 0.4 * w); }); }
  if (flame || fx || fz) bend52(S, K.top, 1, fx, flame * 0.15 * H, fz, flame);
  if (S.F) { mouth58(S, mo); if (S.F.om && S.F.om.userData.d58) S.F.om.userData.d58.visible = mo > 0.02; }
  S.g52 = Math.min(1.6, 0.35 * ate); }
/* the face, the lean and the pool for the rest pass to lay over its own numbers (C26.rest's z55 overlay of W55) */
function face58(e, Z, z, st) { const n = Z.a.length, ate = e.ate, big = st >= 5 ? 1.3 : 1; z.px = z.pz = e.pool; z.smile = 1.25 + 0.3 * ate; z.swell = 0.045 * ate;
  if (e.ph === 'glance') { const g = e.g, gl = pu58(g, 0.02, 0.55, 0.08); z.hturn = 0.65 * Math.sin(g * 2 * PI * 1.1) * gl; z.lookx = 1.8 * Math.sin(g * 2 * PI * 1.1) * gl; z.brow = -0.4; z.lidx = 0.35; z.sq = -0.05 * pu58(g, 0.5, 1.02, 0.1); z.bow = 0.12 * sm58((g - 0.8) / 0.2); }
  else if (e.ph === 'slide') { const s = e.s, w = sm58(s / 0.12) * (1 - sm58((s - 0.9) / 0.1)); z.bow = 0.5 * w / big; z.lean = 0.05 * Math.sin(s * 40) * w; z.sq = 0.06 * w; z.lookx = 0; z.looky = -0.3; z.lidx = 0.3; z.brow = -0.5; }
  else if (e.ph === 'haul') { const u = e.hl; z.bow = 0.55 * sm58(u / 0.3) * (1 - sm58((u - 0.75) / 0.25)); z.sq = -0.14 * pu58(u, 0.2, 0.5, 0.1) + 0.1 * pu58(u, 0.55, 0.85, 0.1); z.looky = -0.6; z.brow = 0.3; z.wide = 0.3 * pu58(u, 0.4, 0.7, 0.1); }
  else if (e.ph === 'creep') { const lift = Math.sin(PI * (e.cs % 1)); z.bow = 0.2; z.sq = 0.05 * lift; z.lean = 0.05 * Math.sin(PI * e.cs); z.lookx = 0.8 * Math.sin(e.c * 5); z.looky = -0.6; z.lidx = 0.4; z.brow = -0.5; z.smile = 1.5; }
  else if (e.ph === 'rear') { const r = e.r, sw = Math.sin(r * 2 * PI * 1.2); z.sq = 0.16 * sm58(r / 0.3) * big; z.bow = -0.06; z.lookx = 1.6 * sw; z.hturn = 0.4 * sw; z.looky = -0.8; z.brow = -0.3; z.lidx = 0.3 - 0.3 * sm58((r - 0.7) / 0.3); z.wide = 0.4 * sm58((r - 0.7) / 0.3); z.smile = 1.6; }
  else if (e.ph === 'atom') { const a = Z.a[e.i], Kd = AK58[a.kind], u = e.u, sd = a.sd, lift = pu58(u, Kd.pu, Kd.dr, 0.05), ad = a.kind ? 0.5 : 1;
    z.sq = 0.1 * big - 0.06 * pu58(u, Kd.pi, Kd.pu, 0.04) + 0.08 * lift; z.bow = 0.15 * pu58(u, 0, Kd.pu, 0.1); z.lookx = sd * (0.6 + 1.2 * lift) * (u < 1 ? 1 : 0); z.looky = -0.6 + 1.3 * lift * ad; z.hturn = sd * 0.35 * lift * ad; z.tilt = -sd * 0.15 * lift * ad;
    z.wide = 0.5 * lift * ad + 0.4 * pu58(u, Kd.pi, Kd.pu, 0.04); z.smile = 1.4 + 0.3 * ate + 0.6 * lift * ad; z.brow = 0.4 * lift * ad - 0.3 * (1 - lift);
    const op = sm58((u - Kd.op) / (Kd.dr - Kd.op + 0.02)); if (op > 0 && u < 1) { z.open = 0.6 + 2 * op; z.nod = -0.45 * op; z.looky = 0.6; z.blink = 0; }
    if (e.sh < 1) { const w = Math.sin(PI * e.sh); z.bow = 0.3 * w; z.sq += 0.06 * Math.abs(Math.sin(PI * e.wk)) * w; z.lookx = sd * 1.2; z.looky = -0.5; z.lidx = 0.3; z.lean = 0.06 * Math.sin(PI * e.wk) * w; }
    if (e.ag > 0) { const g = e.ag / Z.L; z.open = 0; z.sq = (z.sq || 0) - 0.12 * Math.exp(-g * 6) + 0.1 * Math.exp(-g * 4) * Math.sin(g * 18); z.nod = 0.25 * Math.exp(-g * 3); z.blink = pu58(g, 0, 0.35, 0.08); z.swell = 0.045 * ate + 0.06 * Math.exp(-g * 3); } }
  else if (e.ph === 'lick') { const lk = e.lk, be = pu58(lk, 0.68, 0.86, 0.05); z.lidx = 0.5 * (1 - be); z.smile = 1.8 + 0.2 * ate; z.nod = -0.4 * be; z.sq = 0.1 * be; z.open = be > 0.1 ? 0.8 + be : 0; z.lookx = 0; z.looky = 0.2; z.turn = PI * sm58((lk - 0.86) / 0.14); }
  else if (e.ph === 'back') { const b = e.b, w = sm58(b / 0.1) * (1 - sm58((b - 0.92) / 0.08)); z.turn = PI * (1 - sm58((b - 0.9) / 0.1)); z.bow = 0.45 * w / big; z.lean = 0.06 * Math.sin(b * 34) * w; z.sq = 0.04 * w; z.swell = 0.045 * ate + 0.03; }
  else if (e.ph === 'pit') { const p = e.pt; z.sink = 0.35 * pu58(p, 0, 0.35, 0.15); z.sq = 0.12 * Math.exp(-p * 5) * Math.sin(p * 20) * (p > 0.3 ? 1 : 0); z.smile = 1.6; z.lidx = 0.5 * sm58((p - 0.5) / 0.4); z.swell = 0.045 * ate * (1 - sm58((p - 0.3) / 0.7)); } }
function act58(f0, grp, S, t, o) { const Z = o.bites.a58, e = ph58(t, Z), z = S.z58 || (S.z58 = {}); W58.e = e; Z.e = e; for (const k in z) delete z[k];
  if (!S.k52) init52(S); face58(e, Z, z, S.st); f0(grp, 'rest', t / 500, { look: [1, 0.5], z55: z, act58: true }); S.c52 = 'act'; S.act58 = Z;
  out58(S); pose58(S, e, Z, z); out58(S);
  return { e: e.e, y: 0, lunge: 0, n: -1, big: 0, done: e.done, home: e.home }; }
play26 = (f0 => function (grp, clip, t, o) { const S = grp && grp.userData.rig2 && grp.userData.rig2.sp;
  if (!(clip === 'act' && S && S.a48 && !S.jar && KIT.act58 !== false && o && o.bites && o.bites.a58)) { if (S && S.act58 && clip !== 'act') S.act58 = null; return f0(grp, clip, t, o); }
  try { return act58(f0, grp, S, t, o); } catch (err) { W58.err = String(err && err.stack); const Z = o.bites.a58; return { e: t > Z.tA && t < Z.tB ? 1 : 0, y: 0, lunge: 0, n: -1, big: 0, done: t >= Z.tEnd, home: t >= Z.tP }; } })(play26);
KIT.spirit26.play = play26; KIT.ph58 = ph58; KIT.W58 = W58;
/* the pit stays at home while it is away: laid at the place and size it had when the act began */
draw30 = (f0 => function (T, S, ren, cam) { f0(T, S, ren, cam); const E = S.etch48; if (!E || !E.parent) return; try { const Z = S.act58, p = E.parent;
    if (Z && !(Z.e && Z.e.done)) { const h = S.pit58 || (S.pit58 = { w: new T.Vector3(), s: new T.Vector3(), q: new T.Vector3(), ok: false, Z: null }); if (h.Z !== Z) { h.Z = Z; p.updateWorldMatrix(true, false); E.updateWorldMatrix(false, false); E.getWorldPosition(h.w); E.getWorldScale(h.s); h.ok = true; }
      p.updateWorldMatrix(true, false); h.q.copy(h.w); p.worldToLocal(h.q); E.position.copy(h.q); const ws = p.getWorldScale(S.o58v2 || (S.o58v2 = new T.Vector3())); E.scale.set(h.s.x / ws.x, 1, h.s.z / ws.z); E.updateMatrixWorld(); }
    else if (S.pit58) S.pit58.Z = null; } catch (e) { W58.err = 'pit ' + String(e && e.stack); } })(draw30);
// ==== W58 END
// ==== W49 BEGIN
// (builder 49, five stages by builder 53) DRY ICE AS A SPIRIT: "the shy one", the owner's pick (AA.rxKit.dry49 = 'c', or ?d49=c on the page; off by default). Stills only.
// Built and drawn the way Water is, by Water's own code: each stage is a set of numbers like a stage of S25 (pool, spine keys, limbs, face); geo26 makes
// it one closed skin on joints, fig26 gives the face, set30 the pen and the wash. What is Dry ice's own: the shapes (round, heavy, everything hangs and
// sinks), a head with a low heavy brow of fog and a soft peak that folds over and droops, fat arms like sleeves, the spill (roll49: fat low rolls of fog
// lying along the bench, so the foot is a scalloped bank, not a pool), the wash in cold white and grey-violet, the pen line that BREAKS along the low and
// outer edges of the bank (cut49) where the wash thins to dry brush and the wood shows (dry49 in the shader), the frosted block (box49: a real little
// block of ice, cold blue, drawn round by the pen; from stage 4 lodged in the chest with a cold glow), wisps that fall, rime and frost ferns on the wood.
//  1 a breath: the top of a round head and two wide eyes over one roll of fog, the block a glint under its chin
//  2 the huddle: head and shoulders up, hugging the block tight in both fat arms, looking away, three rolls round it
//  3 the shy one: as picked, holding the block out a little in both hands, deep in fat rolls, brows up
//  4 the keeper: taller and calm, heavy lids, the block in its chest glowing cold, arms held low and out, fog pouring off them like wide sleeves, a skirt of rolls
//  5 the old frost: large and still, a great hooded head bowed, long sleeves of falling fog, the block deep in its chest, a bank spilling far along the bench, frost ferns
KIT.dry49 = KIT.dry49 == null ? ((typeof location !== 'undefined' && /[?&]d49=0/.test(String(location.search))) ? null : 'c') : KIT.dry49;   /* (builder 56) on by default; ?d49=0 gives the old Dry ice */
const W49 = { geo: {}, figs: [], err: null, ways: { c: 'the shy one' }, TARGET: [0, 6000, 7000, 8000, 8800, 9400],
  ROLE: [null, { chest: 2, neck: 3, head: 4, hair: 7 }, { chest: 4, neck: 5, head: 6, hair: 9 }, { chest: 5, neck: 6, head: 7, hair: 10 }, { chest: 5, neck: 6, head: 7, hair: 10 }, { chest: 5, neck: 6, head: 7, hair: 10 }],
  C: { lite: [0.935, 0.945, 0.99], edge: [0.74, 0.735, 0.885], shade: [0.62, 0.60, 0.80], margin: [0.88, 0.89, 0.97], paper: [0.975, 0.978, 0.992], lid: 0xd6d8ea, glint: 0x9fd8ff,
    ice: [0xd8f0ff, 0xb2dcf6, 0xf2fbff, 0x7fb6de] } };
/* a roll of fog lying on the bench at (X, Z): a low pillow that lies ALONG the rim of the spill; it is joined to the foot by a thread that runs under the spill and is not seen; zc is the foot's half depth */
const roll49 = (zc, X, Z, r) => { const s = Z >= 0 ? 1 : -1, z0 = s * zc * 1.05, d = Math.hypot(X, Z) || 1, tx = -Z / d * r * 0.75, tz = X / d * r * 0.75, ax = X - tx, az = Z - tz, da = Math.hypot(ax, az) || 1, k = Math.max(0.2, 1 - 0.9 * r / da);
  return { k: 4.6, th: s * PI / 2, r0: 0.08, path: [[ax * k, -0.2, az * k - z0], [ax, r * 0.45 - 0.26, az - z0], [X + tx, r * 0.42 - 0.26, Z + tz - z0]], rad: [0.05, r, r * 0.9], flat: [0, 1, 0], fk: () => 0.55 }; };
/* the spill: n rolls set round the foot on an oval (rx, rz), each a little out of place and of its own size, close enough to run together */
const spill49 = (zc, rx, rz, n, r, sd) => Array.from({ length: n }, (_, i) => { const h = k => 0.5 + 0.5 * Math.sin(sd * 12.9898 + i * 78.233 + k * 37.719), a = (i + 0.5 * h(1)) / n * 2 * PI + 0.2, d = 0.9 + 0.22 * h(2); return roll49(zc, Math.cos(a) * rx * d, Math.sin(a) * rz * d, r * (0.78 + 0.5 * h(3))); });
/* a wisp of fog in the air: it falls, sways once and curls away at the bottom (never rises: fog sinks) */
const fall49 = (x, y, z, h, sd) => Array.from({ length: 12 }, (_, i) => { const t = i / 11, c = sm((t - 0.62) / 0.38); return [x + sd * h * (0.09 * Math.sin(t * 5) + 0.3 * c * c), y - h * (t - 0.1 * c * c), z]; });
const wisp49 = (x, y, z, h, sd, w) => ({ air: fall49(x, y, z, h, sd), w: w || 0.45, o: { smooth: 2, wob: 0.6, min: 3 }, t: 'wisp' });
/* a frost fern on the wood: a curving stem with barbs on both sides, all lying flat (j: 0 lies with the spill) */
const fern49 = (x, z, L, a, sd) => { const o = { smooth: 1, wob: 0.3, min: 2, trim: 0 }, P = t => { const b = a + sd * 0.4 * t * t; return [x + Math.cos(b) * L * t, 0.02, z + Math.sin(b) * L * t]; }, out = [{ air: Array.from({ length: 7 }, (_, i) => P(i / 6)), j: 0, w: 0.5, o }];
  [0.2, 0.38, 0.56, 0.74].forEach(t => [-1, 1].forEach(s => { const p = P(t), b = a + sd * 0.4 * t * t + s * 0.8, l = L * 0.34 * (1 - 0.55 * t); out.push({ air: [p, [p[0] + Math.cos(b) * l * 0.5, 0.02, p[2] + Math.sin(b) * l * 0.5], [p[0] + Math.cos(b - s * 0.2) * l, 0.02, p[2] + Math.sin(b - s * 0.2) * l]], j: 0, w: 0.4, o }); })); return out; };
/* a star of frost on the wood: three strokes that cross */
const star49 = (x, z, r) => [0, 1, 2].map(i => { const a = i * PI / 3 + 0.3, cx = Math.cos(a) * r, cz = Math.sin(a) * r; return { air: [[x - cx, 0.02, z - cz], [x, 0.02, z], [x + cx, 0.02, z + cz]], j: 0, w: 0.45, o: { smooth: 0, wob: 0.3, min: 2, trim: 0 } }; });
/* the frost on the wood: rime patches (x, z, r) with ferns and stars drawn over them */
/* (builder 56) each stroke is tagged with its patch (g) and how far up the fern it starts (ft), so the idle can grow and fade them */
const frost49 = (list) => list.reduce((a, q, g) => a.concat(fern49(q[0], q[1], q[2] * 1.5, q[3], q[4] || 1).map((s, k) => Object.assign(s, { t: 'fern', g, ft: k ? [0.2, 0.38, 0.56, 0.74][(k - 1) >> 1] : 0 })), star49(q[0] + Math.cos(q[3] + 2.2) * q[2] * 0.7, q[1] + Math.sin(q[3] + 2.2) * q[2] * 0.5, q[2] * 0.32).map(s => Object.assign(s, { t: 'fern', g, ft: 0.9 }))), []);
const SPEC49 = [
  // 1 a breath: only the top of the round head and two wide eyes over one roll of fog; the block a glint under its chin
  () => ({ keys: pool(0, 0, 0.9, 0.7, 0.55, 0.45).concat([[0, 0.3, -0.06, 0.6, 0.5], [0, 0.44, -0.08, 0.68, 0.56], [0, 0.64, -0.1, 0.72, 0.58], [-0.02, 0.87, -0.1, 0.74, 0.58], [-0.02, 1.07, -0.12, 0.6, 0.48],
      [0.12, 1.21, -0.1, 0.42, 0.36], [0.36, 1.31, -0.04, 0.32, 0.29], [0.6, 1.25, 0.02, 0.23, 0.22], [0.76, 1.09, 0.06, 0.15, 0.15], [0.82, 0.93, 0.06, 0.08, 0.08], [0.83, 0.87, 0.06, 0, 0]]),
    foot: 0.4, thin: 0.13, hp: 1.5, rings: 2.5, frho: 0.4, wet: [0, 0, 0.9, 0.7], bank: [0.03, 0.26],
    limbs: [Object.assign(roll49(0.45, 0.05, 0.58, 0.72), { fk: () => 0.8 }), roll49(0.45, 0.1, -0.45, 0.36)],
    face: { c: [-0.02, 0.97, -0.06], d: [0, 0.5, 1], k: 1.0, er: 1.4, dx: 0.25, brow: { y: 0.25, len: 0.13, ang: [-0.38, -0.38], lift: [0.03, 0.03], arch: 0.01, r: 0.02 } },
    box: { c: [0.2, 0.74, 0.74], s: 0.17 },
    pen: frost49([[1.1, 0.1, 0.26, 0.4], [-1.05, 0.15, 0.24, 2.6, -1]]),
    rime: [[1.1, 0.1, 0.36], [-1.05, 0.15, 0.32]],
    drops: [[0.9, 0, 0.5, 0.035], [-0.85, 0, 0.5, 0.03]] }),
  // 2 the huddle: head and shoulders up, both fat arms hugging the block tight to its chest, looking away, three rolls round it
  () => ({ keys: pool(0, 0, 1.9, 0.95, 0.75, 0.62).concat([[0, 0.5, 0, 0.78, 0.64], [0, 0.8, 0.02, 0.76, 0.62], [0, 1.05, 0.04, 0.7, 0.57], [0, 1.24, 0.06, 0.64, 0.52], [0.03, 1.52, 0.1, 0.76, 0.62],
      [0.03, 1.8, 0.08, 0.8, 0.64], [0.05, 2.0, 0.04, 0.64, 0.5], [0.22, 2.14, 0.06, 0.46, 0.4], [0.5, 2.22, 0.12, 0.36, 0.33], [0.78, 2.14, 0.18, 0.26, 0.25], [0.96, 1.94, 0.22, 0.17, 0.17], [1.02, 1.76, 0.22, 0.09, 0.09], [1.03, 1.7, 0.22, 0, 0]]),
    foot: 0.4, thin: 0.13, hp: 1.5, rings: 2.5, frho: 0.4, wet: [0, 0, 1.9, 0.95], bank: [0.04, 0.28],
    limbs: [{ k: 8, th: 0.55, r0: 0.27, ey: 1.25, path: [[0.22, -0.08, 0.16], [0.14, -0.26, 0.42], [-0.18, -0.32, 0.56], [-0.38, -0.26, 0.58]], rad: [0.28, 0.27, 0.25, 0.22] },
      { k: 8, th: PI - 0.55, r0: 0.27, ey: 1.25, path: [[-0.22, -0.08, 0.16], [-0.14, -0.26, 0.42], [0.18, -0.32, 0.56], [0.38, -0.26, 0.58]], rad: [0.28, 0.27, 0.25, 0.22] },
      roll49(0.62, 1.3, 0.38, 0.64), roll49(0.62, -1.25, 0.42, 0.62), roll49(0.62, 0.05, 0.85, 0.5), roll49(0.62, -0.4, -0.6, 0.42), roll49(0.62, 0.55, -0.6, 0.4)],
    face: { c: [0.03, 1.55, 0.12], d: [-0.45, -0.05, 1], k: 1.1, er: 1.3, dx: 0.24, lid: 0.2, brow: { y: 0.22, len: 0.13, ang: [-0.3, -0.3], lift: [0.025, 0.025], arch: 0.01, r: 0.019 }, mouth: { w: 0.04, d: -0.02, y: -0.21, r: 0.018 } },
    box: { c: [0, 1.02, 0.82], s: 0.26 },
    pen: [{ c: [0.03, 1.55, 0.12], d: [0, 0, 1], head: 1, pts: [[-0.42, 0.36], [-0.18, 0.47], [0.1, 0.49], [0.34, 0.43], [0.52, 0.3]].map(q => [q[0] * 1.0, q[1] * 1.0]), w: 0.55, o: { smooth: 2, wob: 0.5, min: 3 } }, wisp49(1.05, 0.9, 0.5, 0.5, 1), wisp49(-1.05, 0.88, 0.52, 0.45, -1)].concat(frost49([[2.35, 0.1, 0.36, 0.3], [-2.3, 0.15, 0.34, 2.8, -1]])),
    rime: [[2.35, 0.1, 0.5], [-2.3, 0.15, 0.48]],
    drops: [[1.5, 0, 0.5, 0.045], [-1.45, 0, 0.5, 0.04]] }),
  // 3 the shy one: as picked; holding the block out a little in both hands, deep in fat rolls, brows up
  () => ({ keys: pool(0, 0, 2.6, 1.2, 0.95, 0.78).concat([[0, 0.55, 0, 0.94, 0.78], [0, 0.9, 0.02, 0.9, 0.74], [0, 1.2, 0.04, 0.8, 0.64], [0, 1.45, 0.06, 0.74, 0.58], [0, 1.64, 0.08, 0.68, 0.54], [-0.04, 1.95, 0.12, 0.8, 0.66],
      [-0.05, 2.25, 0.1, 0.88, 0.7], [0, 2.48, 0.06, 0.74, 0.58], [0.16, 2.66, 0.06, 0.54, 0.46], [0.46, 2.76, 0.12, 0.42, 0.38], [0.8, 2.7, 0.2, 0.32, 0.3], [1.06, 2.48, 0.26, 0.22, 0.21], [1.16, 2.24, 0.28, 0.13, 0.13], [1.18, 2.1, 0.28, 0.06, 0.06], [1.18, 2.05, 0.28, 0, 0]]),
    foot: 0.4, thin: 0.13, hp: 1.5, rings: 2.5, frho: 0.4, wet: [0, 0, 2.6, 1.2], bank: [0.04, 0.3],
    limbs: [{ k: 9, th: 0.3, r0: 0.3, ey: 1.25, path: [[0.26, -0.14, 0.12], [0.4, -0.45, 0.3], [0.2, -0.66, 0.6], [-0.18, -0.64, 0.74]], rad: [0.31, 0.3, 0.27, 0.24] },
      { k: 9, th: PI - 0.3, r0: 0.3, ey: 1.25, path: [[-0.26, -0.14, 0.12], [-0.4, -0.45, 0.3], [-0.2, -0.66, 0.6], [0.18, -0.64, 0.74]], rad: [0.31, 0.3, 0.27, 0.24] }]
      .concat(spill49(0.78, 2.25, 0.95, 10, 0.5, 3)),
    face: { c: [-0.05, 2.0, 0.12], d: [-0.08, -0.15, 1], k: 1.35, er: 1.25, dx: 0.25, brow: { y: 0.215, len: 0.13, ang: [-0.38, -0.38], lift: [0.02, 0.02], arch: 0.01, r: 0.018 }, mouth: { w: 0.06, d: -0.025, y: -0.22, r: 0.02 } },
    box: { c: [0, 0.92, 1.0], s: 0.4 },
    pen: [{ c: [-0.05, 2.0, 0.12], d: [0, 0, 1], head: 1, pts: [[-0.42, 0.36], [-0.18, 0.47], [0.1, 0.49], [0.34, 0.43], [0.52, 0.3]].map(q => [q[0] * 1.15, q[1] * 1.15]), w: 0.55, o: { smooth: 2, wob: 0.5, min: 3 } }, wisp49(1.25, 1.05, 0.5, 0.7, 1), wisp49(-1.25, 1.0, 0.5, 0.6, -1), wisp49(1.0, 0.86, 0.8, 0.4, 1, 0.38)].concat(frost49([[3.15, 0.1, 0.42, 0.25], [-3.15, 0.15, 0.4, 2.9, -1], [2.6, -1.25, 0.3, 0.6]])),
    rime: [[3.15, 0.1, 0.6], [-3.15, 0.15, 0.58], [2.6, -1.25, 0.42]],
    drops: [[3.25, 0, 0.1, 0.055], [-3.3, 0, 0, 0.05], [2.4, 0, 0.5, 0.04], [-2.5, 0, 0.5, 0.045]] }),
  // 4 the keeper: taller, calm, heavy-lidded; the block lodged in its chest glowing cold; arms held low and out with fog pouring off them like wide sleeves; a skirt of rolls
  () => ({ keys: pool(0, 0, 3.0, 1.4, 1.0, 0.8).concat([[0, 0.6, 0, 0.98, 0.8], [0, 1.0, 0.02, 0.88, 0.7], [0, 1.45, 0.04, 0.76, 0.62], [0, 1.85, 0.06, 0.74, 0.58], [0, 2.12, 0.08, 0.62, 0.5], [0, 2.45, 0.1, 0.74, 0.62],
      [0, 2.75, 0.08, 0.82, 0.64], [0.02, 2.98, 0.04, 0.64, 0.5], [0.18, 3.16, 0.04, 0.48, 0.42], [0.48, 3.26, 0.1, 0.38, 0.34], [0.8, 3.18, 0.18, 0.28, 0.26], [1.04, 2.96, 0.24, 0.19, 0.18], [1.14, 2.72, 0.26, 0.1, 0.1], [1.15, 2.64, 0.26, 0, 0]]),
    foot: 0.4, thin: 0.13, hp: 1.5, rings: 2.5, frho: 0.4, wet: [0, 0, 3.0, 1.4], bank: [0.05, 0.32],
    limbs: arm48(9, 0.15, 0.27, [[0.25, -0.22, 0.06], [0.48, -0.56, 0.18], [0.56, -0.84, 0.52], [0.46, -0.9, 0.78]], [0.27, 0.29, 0.31, 0.3], [[[-0.04, -0.06, 0.14, 0.16], [-0.06, -0.1, 0.24, 0.06]], [[0.06, -0.26, -0.06, 0.3], [0.1, -0.52, -0.1, 0.22], [0.12, -0.72, -0.1, 0.08]]])
      .concat(arm48(9, PI - 0.15, 0.27, [[-0.25, -0.22, 0.06], [-0.48, -0.56, 0.18], [-0.56, -0.84, 0.52], [-0.46, -0.9, 0.78]], [0.27, 0.29, 0.31, 0.3], [[[0.04, -0.06, 0.14, 0.16], [0.06, -0.1, 0.24, 0.06]], [[-0.06, -0.26, -0.06, 0.3], [-0.1, -0.52, -0.1, 0.22], [-0.12, -0.72, -0.1, 0.08]]]))
      .concat(spill49(0.8, 2.75, 1.15, 12, 0.52, 4)),
    face: { c: [0, 2.5, 0.12], d: [0, -0.1, 1], k: 1.3, er: 1.05, dx: 0.24, lid: 0.6, brow: { y: 0.2, len: 0.16, ang: [0.04, 0.04], arch: 0.02, r: 0.02 }, },
    box: { c: [0, 1.62, 0.58], s: 0.4, glow: 1.5 },
    pen: [{ c: [0, 2.5, 0.12], d: [0, 0, 1], head: 1, pts: [[-0.42, 0.36], [-0.18, 0.47], [0.1, 0.49], [0.34, 0.43], [0.52, 0.3]].map(q => [q[0] * 1.15, q[1] * 1.15]), w: 0.55, o: { smooth: 2, wob: 0.5, min: 3 } }, wisp49(1.65, 1.0, 0.45, 0.8, 1), wisp49(-1.65, 1.0, 0.45, 0.75, -1), wisp49(1.45, 1.35, 0.6, 0.6, -1, 0.38), wisp49(-1.45, 1.3, 0.6, 0.55, 1, 0.38)]
      .concat(frost49([[3.65, 0.1, 0.5, 0.2], [-3.6, 0.15, 0.48, 2.95, -1], [2.8, -1.4, 0.36, 0.6], [-2.9, -1.35, 0.34, 2.5, -1]])),
    rime: [[3.65, 0.1, 0.72], [-3.6, 0.15, 0.7], [2.8, -1.4, 0.5], [-2.9, -1.35, 0.48]],
    drops: [[3.8, 0, 0.1, 0.06], [-3.8, 0, 0, 0.055], [2.9, 0, 0.5, 0.045], [-3.0, 0, 0.5, 0.045]] }),
  // 5 the old frost: large and still; a great soft hood bowed, its tip drooping; long sleeves of falling fog; the block deep in its chest; a bank spilling far along the bench; frost ferns
  () => ({ keys: pool(0, 0, 3.8, 1.6, 1.15, 0.9).concat([[0, 0.65, 0, 1.12, 0.9], [0, 1.1, 0.02, 1.02, 0.82], [0, 1.6, 0.06, 0.92, 0.74], [0, 2.02, 0.1, 0.88, 0.7], [0, 2.3, 0.18, 0.76, 0.62], [0, 2.55, 0.34, 0.84, 0.72],
      [0, 2.86, 0.3, 0.98, 0.8], [0.02, 3.12, 0.16, 0.86, 0.7], [0.14, 3.34, 0.02, 0.64, 0.56], [0.46, 3.48, -0.02, 0.5, 0.45], [0.84, 3.4, 0.04, 0.38, 0.35], [1.14, 3.14, 0.12, 0.27, 0.25], [1.3, 2.82, 0.18, 0.18, 0.17], [1.36, 2.52, 0.2, 0.1, 0.1], [1.37, 2.4, 0.2, 0, 0]]),
    foot: 0.4, thin: 0.13, hp: 1.5, rings: 2.5, frho: 0.4, wet: [0, 0, 3.8, 1.6], bank: [0.05, 0.34],
    limbs: arm48(9, 0.2, 0.3, [[0.3, -0.25, 0.15], [0.62, -0.62, 0.38], [0.66, -1.0, 0.58], [0.46, -1.24, 0.72]], [0.3, 0.32, 0.33, 0.3], [[[-0.06, -0.12, 0.1, 0.17], [-0.12, -0.2, 0.16, 0.06]], [[0.22, -0.36, -0.12, 0.36], [0.32, -0.8, -0.18, 0.32], [0.38, -1.12, -0.14, 0.2], [0.4, -1.3, -0.1, 0.06]]])
      .concat(arm48(9, PI - 0.2, 0.3, [[-0.3, -0.25, 0.15], [-0.62, -0.62, 0.38], [-0.66, -1.0, 0.58], [-0.46, -1.24, 0.72]], [0.3, 0.32, 0.33, 0.3], [[[0.06, -0.12, 0.1, 0.17], [0.12, -0.2, 0.16, 0.06]], [[-0.22, -0.36, -0.12, 0.36], [-0.32, -0.8, -0.18, 0.32], [-0.38, -1.12, -0.14, 0.2], [-0.4, -1.3, -0.1, 0.06]]]))
      .concat(spill49(0.9, 3.5, 1.35, 14, 0.56, 5), [roll49(0.9, 4.5, 0.45, 0.46), roll49(0.9, -4.45, 0.5, 0.46), roll49(0.9, 5.25, 0.25, 0.34), roll49(0.9, -5.2, 0.3, 0.34)]),
    face: { c: [0, 2.62, 0.36], d: [0, -0.4, 1], k: 1.35, er: 0.95, dx: 0.25, lid: 0.72, brow: { y: 0.19, len: 0.22, ang: [0.32, 0.32], arch: 0.03, r: 0.024 } },
    box: { c: [0, 1.72, 0.68], s: 0.42, glow: 1.9 },
    pen: [{ c: [0, 2.7, 0.36], d: [0, -0.3, 1], head: 1, pts: Array.from({ length: 17 }, (_, i) => { const a = (-35 + 250 * i / 16) * PI / 180; return [0.62 * Math.cos(a), 0.06 + 0.56 * Math.sin(a)]; }), w: 0.75, o: { smooth: 2, wob: 0.5, min: 3 } },
      wisp49(1.55, 1.0, 0.9, 0.9, 1), wisp49(-1.55, 1.0, 0.9, 0.85, -1), wisp49(1.25, 0.75, 1.2, 0.55, -1, 0.38), wisp49(-1.25, 0.72, 1.2, 0.5, 1, 0.38)]
      .concat(frost49([[4.5, 0.2, 0.6, 0.15], [-4.5, 0.25, 0.58, 3.0, -1], [3.4, -1.6, 0.46, 0.6], [-3.5, -1.55, 0.44, 2.5, -1], [5.8, -0.2, 0.4, 0.4], [-5.7, -0.15, 0.4, 2.7, -1]])),
    rime: [[4.5, 0.2, 0.85], [-4.5, 0.25, 0.82], [3.4, -1.6, 0.62], [-3.5, -1.55, 0.6], [5.8, -0.2, 0.55], [-5.7, -0.15, 0.55]],
    drops: [[4.9, 0, 0.5, 0.06], [-4.9, 0, 0.5, 0.06], [3.4, 0, 0.5, 0.05], [-3.5, 0, 0.5, 0.05], [6.0, 0, 0.2, 0.05], [-6.0, 0, 0.25, 0.05]] })
];
/* the wash turns cold: the same shader as Water's, its blues changed for white and grey-violet, the paper under it a colder white, the lamp's warmth taken out
   (so the fog never goes beige on the wood), and along the low and outer edges of the bank the wash thins out in dry brush and the wood shows through */
function tint49(T, S) { if (!S.m30) return; S.t49 = true; S.u49 = S.u49 || { value: 0 }; const C = W49.C, way = S.way49, G = S.G, b = S.bank49 || [0.14, 0.6], g = v => 'vec3(' + v.map(x => x.toFixed(3)).join(', ') + ')', f = x => (+x).toFixed(4);
  /* (builder 56) u49 is the idle's clock: the dry-brush streaks creep outward along the bench, the body's edges thin and fill again in patches that sink, faint grey streaks sink through the wash */
  const dry = '{ vec3 q9 = bp * ' + f(G.H) + '; float lo9 = 1.0 - smoothstep(' + f(b[0]) + ', ' + f(b[1]) + ', q9.y), rr9 = length(vec2(q9.x / ' + f(G.pl.rx) + ', q9.z / ' + f(G.pl.rz) + '));'
    + ' vec2 rd9 = q9.xz / max(0.08, length(q9.xz)); vec3 m9 = vec3(q9.x - rd9.x * u49 * 0.2, q9.y, q9.z - rd9.y * u49 * 0.2);'
    + ' float st9 = N30(vec3(m9.x * 2.2, m9.y * 26.0, m9.z * 2.2)), st8 = N30(vec3(m9.x * 7.0, m9.y * 60.0, m9.z * 7.0) + 4.0), sk9 = N30(vec3(q9.x * 3.0, q9.y * 3.5 + u49 * 0.45, q9.z * 3.0) + 9.0);'
    + ' float dr9 = lo9 * (0.2 + 0.55 * smoothstep(0.6, 1.1, rr9) + 0.45 * smoothstep(0.6, 0.15, nv) * step(q9.z, 0.4)) + 0.4 * smoothstep(0.03, -0.02, q9.y) + (1.0 - lo9) * K56E * smoothstep(0.38, 0.03, nv) * sk9;'
    + ' float gone9 = smoothstep(0.45, 0.68, dr9 + 0.55 * (st9 - 0.5) + 0.35 * (st8 - 0.5)); c9 = mix(c9, bg, gone9);'
    + ' c9 = mix(c9, c9 * vec3(0.88, 0.885, 0.96), (1.0 - gone9) * K56S * smoothstep(0.5, 0.78, N30(vec3(q9.x * 2.0, q9.y * 2.6 + u49 * 0.3, q9.z * 2.0) + 2.0))); }\n  gl_FragColor = vec4(c9, 1.0); }';
  const sw = [['vec3(0.64, 0.80, 0.945)', g(C.lite)], ['vec3(0.40, 0.59, 0.84)', g(C.edge)], ['vec3(0.36, 0.52, 0.78)', g(C.shade)], ['vec3(0.60, 0.76, 0.92)', g(C.margin)], ['PAPER29 * (0.985', g(C.paper) + ' * (0.985'],
    ['smoothstep(0.80, 0.87, l9', 'smoothstep(0.52, 0.64, l9'],            /* far more of the lit side is left bare: fog is mostly paper */
    ['vec3(1.0, 0.972, 0.91)', 'vec3(0.985, 0.99, 1.0)'], ['vec3(1.0, 0.95, 0.84)', 'vec3(0.93, 0.95, 1.0)'], ['vec3(0.70, 0.72, 0.82)', 'vec3(0.72, 0.71, 0.86)'],   /* the lamp: no warmth, a violet shade */
    ['gl_FragColor = vec4(c9, 1.0); }', dry]];
  const one = m => { if (!m || !m.isMeshStandardMaterial || !m.onBeforeCompile || m.userData.d49) return; m.userData.d49 = 1; const f0 = m.onBeforeCompile, k0 = m.customProgramCacheKey; m.onBeforeCompile = sh => { f0(sh); sw.forEach(q => { sh.fragmentShader = sh.fragmentShader.split(q[0]).join(q[1]); }); sh.uniforms.u49 = S.u49; sh.fragmentShader = 'uniform float u49;\n#define K56E ' + (+(KIT.edge56 == null ? 1.0 : KIT.edge56)).toFixed(3) + '\n#define K56S ' + (+(KIT.streak56 == null ? 0.5 : KIT.streak56)).toFixed(3) + '\n' + sh.fragmentShader; }; m.customProgramCacheKey = () => (k0 ? k0.call(m) : '') + 'd53' + way; m.needsUpdate = true; };
  one(S.m30.body); one(S.m30.hull); (S.o29 || []).forEach(q => one(q.m30)); if (S.m30.lid && S.m30.lid.color) S.m30.lid.color.copy(new T.Color(C.lid).convertSRGBToLinear()); if (S.m30.glint && S.m30.glint.color) S.m30.glint.color.copy(new T.Color(C.glint).convertSRGBToLinear()); }
/* a soft round texture (white on black, read as alpha): a glow, or rime with needles of frost in it */
const tex49 = (T, kind) => { const key = 't' + kind; if (W49[key]) return W49[key]; const n = 128, cv = document.createElement('canvas'); cv.width = cv.height = n; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, n, n);
  const gr = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); if (kind === 'glow') { gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, n, n); }
  else { gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.3)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, n, n); let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineCap = 'round'; for (let i = 0; i < 70; i++) { const a = r() * 2 * PI, d = Math.sqrt(r()) * n * 0.42, cx = n / 2 + Math.cos(a) * d, cy = n / 2 + Math.sin(a) * d, l = 3 + r() * 9, b = r() * PI; x.lineWidth = 0.8 + r() * 1.4; x.beginPath(); x.moveTo(cx - Math.cos(b) * l, cy - Math.sin(b) * l); x.lineTo(cx + Math.cos(b) * l, cy + Math.sin(b) * l); x.stroke(); }
    for (let i = 0; i < 160; i++) { const a = r() * 2 * PI, d = Math.sqrt(r()) * n * 0.46; x.fillStyle = 'rgba(255,255,255,' + (0.4 + 0.6 * r()).toFixed(2) + ')'; x.fillRect(n / 2 + Math.cos(a) * d, n / 2 + Math.sin(a) * d, 1.5, 1.5); } }
  return (W49[key] = new T.CanvasTexture(cv)); };
/* (Lambert with its colour in the emissive: set30 leaves these alone, it only takes Basic, Toon and Standard materials) */
const flat49 = (T, hex, o) => new T.MeshLambertMaterial(Object.assign({ color: 0x000000, emissive: new T.Color(hex) }, o || {}));
/* the block: a little block of ice, three faces showing in cold blues, drawn round by the pen; from stage 4 lodged in the chest with a cold glow over it */
function box49(T, S, bx, near, strokes) { const J = S.G.J, V3 = T.Vector3, E = new T.Euler(0.38, PI / 4 + 0.12, 0, 'XYZ'), c = bx.c, s = bx.s, j = near(c), jp = J[j].p, C = W49.C.ice;
  const m = new T.Mesh(new T.BoxGeometry(s, s, s), [C[3], C[0], C[2], C[3], C[1], C[3]].map(h => flat49(T, h))); m.rotation.copy(E); m.position.set(c[0] - jp[0], c[1] - jp[1], c[2] - jp[2]); m.renderOrder = 18; m.userData.plain = true; m.userData.box49 = 1; S.bones[j].add(m);
  const P = (x, y, z) => new V3(x, y, z).multiplyScalar(s / 2).applyEuler(E).add(new V3().fromArray(c)).toArray(), o = { smooth: 0, wob: 0.25, min: 2, trim: 0 }, w = bx.glow ? 0.6 : 0.75;
  [[P(1, 1, 1), P(-1, 1, 1), P(-1, 1, -1), P(1, 1, -1), P(1, 1, 1)], [P(-1, 1, 1), P(-1, -1, 1)], [P(1, 1, 1), P(1, -1, 1)], [P(-1, 1, -1), P(-1, -1, -1)], [P(1, -1, 1), P(-1, -1, 1), P(-1, -1, -1)]]
    .forEach(pts => strokes.push({ air: pts, j, w, o, t: 'box' }));
  strokes.push({ air: [P(-1, 0.75, 0.2), P(-1, 0.35, 0.55)], j, w: 0.4, o, t: 'box' });   /* a scratch of frost on its face */
  if (bx.glow) { const gs = s * bx.glow * 2.2, g = new T.Mesh(new T.PlaneGeometry(gs, gs), flat49(T, 0x8fcbff, { transparent: true, alphaMap: tex49(T, 'glow'), depthWrite: false })); g.position.set(c[0] - jp[0], c[1] - jp[1], c[2] - jp[2] + s * 0.75); g.renderOrder = 23; g.userData.plain = true; g.userData.box49 = 2; S.bones[j].add(g); } }
/* rime on the wood: soft white patches with needles of frost, lying flat with the spill */
function rime49(T, S, list) { const jp = S.G.J[0].p; list.forEach((q, i) => { const m = new T.Mesh(new T.PlaneGeometry(q[2] * 2, q[2] * 1.4), flat49(T, 0xf4f8ff, { transparent: true, alphaMap: tex49(T, 'rime'), depthWrite: false }));
  m.rotation.set(-PI / 2, 0, 0.3 * Math.sin(i * 2.3)); m.position.set(q[0] - jp[0], 0.015, q[1] - jp[2]); m.renderOrder = 17; m.userData.plain = true; m.userData.r56 = i; S.bones[0].add(m); }); }
/* one stage of the shy one: its numbers go in Water's stage-3 slot for the moment of building; the figure then carries its own stage (sizes, rest) */
function dry49Fig(T, stage, extra) { stage = Math.max(1, Math.min(5, stage | 0)) || 3; const sp = SPEC49[stage - 1], keep = [S25[2], W26.geo[3], W26.ROLE[3], W26.TARGET]; let g = null;
  S25[2] = sp; if (W49.geo[stage]) W26.geo[3] = W49.geo[stage]; else delete W26.geo[3]; W26.ROLE[3] = W49.ROLE[stage]; W26.TARGET = W49.TARGET[stage];
  try { g = fig26(T, 3, extra); W49.geo[stage] = W26.geo[3]; } finally { S25[2] = keep[0]; if (keep[1]) W26.geo[3] = keep[1]; else delete W26.geo[3]; W26.ROLE[3] = keep[2]; W26.TARGET = keep[3]; }
  const S = g.userData.rig2.sp, G = S.G, o = G.o, V3 = T.Vector3, J = G.J, jh = G.bj[G.R.head]; S.way49 = 's' + stage; S.st = stage; g.userData.rig2.stage = stage; if (g.userData.water24) g.userData.water24.stage = stage; S.bank49 = o.bank;
  /* the pen's own strokes: on the skin (rays from in front, as the face is laid) or in the air; each rides the joint of the spine it is nearest to (j: 0 lies with the spill) */
  const near = p => { let bj = 0, bd = 1e9; J.forEach((q, j) => { const dd = Math.hypot(q.p[0] - p[0], q.p[1] - p[1], q.p[2] - p[2]); if (j && q.role !== 'limb' && dd < bd) { bd = dd; bj = j; } }); return bj; };
  const src = (o.pen || []).slice(); if (o.box && !(extra && extra.jar)) { try { box49(T, S, o.box, near, src); } catch (e) { W49.err = String(e && e.stack); } }
  if (o.rime && !(extra && extra.jar)) { try { rime49(T, S, o.rime); } catch (e) { W49.err = String(e && e.stack); } }
  const strokes = src.map(s => { let pts; if (s.air) pts = s.air; else { const Dv = new V3().fromArray(s.d || [0, 0, 1]).normalize(), Rv = new V3().crossVectors(new V3(0, 1, 0), Dv).normalize(), Uv = new V3().crossVectors(Dv, Rv), Cv = new V3().fromArray(s.c);
        pts = s.pts.map(q => { const p = Cv.clone().addScaledVector(Rv, q[0]).addScaledVector(Uv, q[1]).addScaledVector(Dv, G.H * 0.45); for (let i = 0; i < 200; i++) { const dd = G.f(p.x, p.y, p.z); if (dd < 0.003) { const gr = G.grad(p.x, p.y, p.z, G.cell * 0.3); return [p.x + gr[0] * 0.02, p.y + gr[1] * 0.02, p.z + gr[2] * 0.02]; } p.addScaledVector(Dv, -Math.max(0.004, dd * 0.4)); } return null; }).filter(Boolean); }
    if (pts.length < 2) return null; const j = s.j != null ? s.j : s.head ? jh : near(s.c || pts[0]);
    return { j, w: s.w || 0.6, o: s.o || { smooth: 2, wob: 0.7, min: 3 }, t: s.t, g: s.g, ft: s.ft, pts: pts.map(p => [p[0] - J[j].p[0], p[1] - J[j].p[1], p[2] - J[j].p[2]]) }; }).filter(Boolean);
  /* ink48 (builder 48) writes these strokes with the figure's own pen; t48 is set so that it leaves the wash alone */ S.t48 = true; S.a48 = { strokes, pts: Array.from({ length: 40 }, () => new V3()) };
  tint49(T, S); W49.figs.push(S); if (W49.figs.length > 24) W49.figs.splice(0, W49.figs.length - 24); return g; }
/* the outline breaks along the low and outer edges of the bank: those parts of the skin are kept out of the pen's silhouette (in patches, so the line stops and starts) */
function cut49(S, s) { const P = s.tp.P, n = s.tp.nv, b = S.bank49 || [0.14, 0.6], pl = S.pl49 || S.G.pl, m = new Uint8Array(n), h = (x, z) => { const v = Math.sin(Math.floor(x / 0.28) * 127.1 + Math.floor(z / 0.28) * 311.7) * 43758.5453; return v - Math.floor(v); };
  for (let i = 0; i < n; i++) { const x = P[3 * i], y = P[3 * i + 1], z = P[3 * i + 2], rr = Math.hypot((x - pl.x) / pl.rx, (z - pl.z) / pl.rz), u = h(x, z); if (y > b[1] * 1.15) continue;
    if (y < b[0]) m[i] = 1; else if (rr > 0.82) m[i] = u < 0.72 ? 1 : 0; else if (z < 0.1) m[i] = u < 0.55 ? 1 : 0; else m[i] = y < (b[0] + b[1]) * 0.5 && u < 0.3 ? 1 : 0; }
  return m; }
sil30 = (f0 => function (R, s) { const S = W49.cur; if (S && R === S.pen30 && s === R.body && s.tp && s.C) { try { const m = S.cut49 || (S.cut49 = cut49(S, s)), C = s.C; for (let i = 0; i < m.length; i++) if (m[i]) C[4 * i + 3] = 0; } catch (e) { W49.err = String(e && e.stack); } } return f0.apply(this, arguments); })(sil30);
/* the pool's ripple strokes and the flow lines down the front are Water's: a bank of fog has none (G.pl and the chest are hidden from the pen for the moment of drawing) */
draw30 = (f0 => function (T, S, ren, cam) { if (!S.way49) return f0(T, S, ren, cam); if (!S.t49) tint49(T, S); const pl = S.G.pl, R0 = S.G.R; S.pl49 = pl; W49.cur = S; S.G.pl = null; S.G.R = Object.assign({}, R0, { chest: 0 }); try { return f0(T, S, ren, cam); } finally { S.G.pl = pl; S.G.R = R0; W49.cur = null; } })(draw30);
KIT.dry49Fig = dry49Fig; KIT.DRY49 = W49;
/* behind the switch: Dry ice's bench figure is the spirit at its stage (the jar keeps the old Dry ice) */
KIT.build = (f0 => function (id, T, grp, tint, extra) { if (id === 'homco2' && KIT.dry49 === 'c' && T && T.SkinnedMesh && grp && grp.add && !(extra && (extra.push || extra.jar))) { try { const g = dry49Fig(T, (extra && extra.stage) || 3, extra); grp.add(g.children[0]); grp.userData.rig2 = g.userData.rig2; grp.userData.rig2.sp.grp = grp; return true; } catch (e) { W49.err = String(e && e.stack); } } return f0.apply(this, arguments); })(KIT.build);
// ==== W49 END
// ==== W56 BEGIN
// (builder 56) DRY ICE THE SHY ONE ALIVE AT REST: its own idle, not Water's (AA.rxKit.idle56, on with the shy one; false or ?i56=0 gives Water's rest back on it).
// The fog is what moves. The bank of rolls is never still: each roll wells up small under the figure, swells, creeps out along the bench, flattens,
// thins and is gone at the rim while the next wells up behind it, out of step, so the bank is always pouring outward and being renewed. Soft mist
// lies on the wood round the bank and creeps outward, spreading and thinning. In the wash the dry-brush streaks creep outward with the fog, the edges
// of the body thin and fill again in patches that sink, faint grey streaks sink through it (u49 in W49's shader), and the broken pen line at the bank's
// edge shifts as the fog does (the cut moves). Wisps peel off the drooping tip, the hands, the sleeves and the block and SINK into the bank, curling
// out along it. The body breathes and its girth swells and settles out of step, so it is dense fog holding a shape. The block stays hard, with a slow
// cold glint. Frost ferns grow on the wood and fade, the rime with them. A shiver now and then sends a puff rolling off the bank.
// Its manner, shy and cold: slow blinks, glances that slide away; now and then it notices the viewer (eyes to the front, wide), ducks, then peeks.
//  1 only eyes over a roll: it ducks under the roll and peeps up somewhere else along it
//  2 rocks as it hugs the block, squeezing it closer; face turned away, turning back when it notices you, then away and down
//  3 holds the block out a little, notices you, pulls it back and ducks its chin behind it, then peeks over it
//  4 calm, slow, heavy-lidded; the sleeves pour steadily; a slow nod
//  5 almost still, asleep: a slow deep breath, the head bowing a little on each breath out; the bank spilling far, ferns growing and fading
// The one skin moves only on its own joints (the rolls are limbs joined under the bank), so nothing comes apart; wisps and puffs are pen strokes that fade.
// While it plays, S.a48 is hidden from the play chain, so builder 52's idle for Acid (which keys on S.a48) never runs on Dry ice.
KIT.idle56 = KIT.idle56 == null ? !(typeof location !== 'undefined' && /[?&]i56=0/.test(String(location.search))) : KIT.idle56;
const W56 = { err: null, n: 0, ms: 0, jar: 0.6 };
/* knobs for trying looks from the page's query (e56: how much the body's edges thin, s56: the sinking grey streaks, g56: gaps in the pen line, m56: the mist, w56: wisp weight) */
{ const qs = typeof location !== 'undefined' ? String(location.search) : '', g = k => { const m = new RegExp('[?&]' + k + '=([0-9.]+)').exec(qs); return m ? +m[1] : null; }; [['e56', 'edge56'], ['s56', 'streak56'], ['g56', 'gap56'], ['m56', 'mist56'], ['w56', 'wisp56']].forEach(([q, k]) => { const v = g(q); if (v != null && KIT[k] == null) KIT[k] = v; }); }
/* per stage: breath period and size, blink and glance periods, shiver, the manner's cycle, a roll's life and travel, mist pieces, wisp and fern periods, duck depth */
const P56 = [null,
  { br: 4.4, ba: 0.035, bk: 5.3, gp: 6.1, sv: 8.3, cyc: 7.4, rp: 7.5, rt: 0.5, mist: 5, wp: 2.4, fp: 9, dk: 0.62 },
  { br: 4.0, ba: 0.03, bk: 4.9, gp: 7.3, sv: 7.7, cyc: 6.6, rp: 8.0, rt: 0.6, mist: 6, wp: 2.2, fp: 10, dk: 0.13 },
  { br: 4.4, ba: 0.03, bk: 5.6, gp: 6.7, sv: 9.1, cyc: 8.0, rp: 8.5, rt: 0.85, mist: 8, wp: 2.2, fp: 10, dk: 0.14 },
  { br: 5.6, ba: 0.025, bk: 7.2, gp: 9.0, sv: 11.3, cyc: 10.0, rp: 9.5, rt: 0.95, mist: 9, wp: 2.0, fp: 11, dk: 0.05 },
  { br: 7.0, ba: 0.04, bk: 1e9, gp: 1e9, sv: 13.7, cyc: 1e9, rp: 11, rt: 0.8, mist: 11, wp: 2.4, fp: 12, dk: 0 }];
const on56 = S => !!(S && S.way49 && KIT.idle56 !== false);
const clk56 = S => (typeof performance !== 'undefined' ? performance.now() : 0) / 1000 * (S.jar ? W56.jar : 1) + S.st * 2.9;
const vn56 = (x, y) => { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), h = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); }, a = h(i, j), b = h(i + 1, j), c = h(i, j + 1), d = h(i + 1, j + 1); return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy; };
/* the manner at time tt: notice, duck, peek; stage 1's place along its roll; stage 3's offering */
function man56(S, tt) { const st = S.st, P = P56[st] || P56[3], u = fr52(tt / P.cyc), M = { notice: 0, duck: 0, peek: 0, dx: 0, off: 0, sd: Math.floor(tt / P.cyc) % 2 ? 1 : -1 };
  if (S.x57) return M;   /* (builder 57) while it acts, its act sets its manner */
  if (st < 5) { M.notice = pl52(u, 0.3, 0.4, 0.04); M.duck = pl52(u, 0.4, 0.66, 0.06); M.peek = pl52(u, 0.62, 0.8, 0.05); }
  if (st === 1) { const n = Math.floor(tt / P.cyc), xp = m => 0.3 * (2 * h52(m * 3.7 + 1) - 1); M.dx = xp(n - 1) + (xp(n) - xp(n - 1)) * sm52((u - 0.47) / 0.12); }
  if (st === 3) M.off = pl52(u, 0.04, 0.34, 0.1) * (1 - M.duck);
  return M; }
/* the clip's numbers, its own */
function rest56(S, t, o, q, lagMs) { const st = S.st, k = S.jar ? 0.6 : 1, tt = clk56(S) - lagMs / 1000 * (S.jar ? W56.jar : 1), P = P56[st] || P56[3], TAU = 2 * PI, M = man56(S, tt), sp = o.spent || 0, br = Math.sin(TAU * tt / P.br);
  q.sq = k * P.ba * br; q.px = q.pz = 1 + 0.025 * k * Math.sin(TAU * tt / P.br - 1.0); q.lean = k * 0.025 * Math.sin(TAU * tt / (P.br * 1.9) + 0.7); q.bow = 0; q.hair = k * 0.12 * Math.sin(TAU * tt / (P.br * 1.4) + 1.1);
  /* a slow blink: the lids come down, hold, and lift */ q.blink = pl52(fr52(tt / P.bk + 0.35), 0, 0.08, 0.035);
  /* the glance slides away to one side and holds */ const gu = fr52(tt / P.gp + 0.6), g = pl52(gu, 0.12, 0.5, 0.1) * (1 - M.notice) * (1 - M.duck), gs = Math.floor(tt / P.gp + 0.6) % 2 ? 1 : -1;
  q.lookx = gs * 1.4 * g + M.sd * 1.3 * M.peek; q.looky = -0.35 * g + 0.25 * M.notice - 0.6 * M.duck + 0.25 * M.peek; q.hturn = k * (gs * 0.22 * g + M.sd * 0.15 * M.peek); q.brow = 0.45 * M.notice + 0.3 * M.peek; q.wide = 0.5 * M.notice + 0.35 * M.peek;
  q.bow = k * M.duck * [0, 0.05, 0.2, 0.15, 0.1, 0][st]; q.nod = k * M.duck * [0, 0, 0.3, 0.25, 0.2, 0][st]; q.lidx = st < 4 ? 0.3 * M.duck : 0;
  /* a shiver */ const sv = pl52(fr52(tt / P.sv + 0.15), 0, 0.07, 0.015); q.lean += k * 0.04 * sv * Math.sin(TAU * tt * 9); q.tilt = k * 0.03 * sv * Math.sin(TAU * tt * 7 + 1);
  if (st === 2) { const aw = pl52(fr52(tt / P.gp + 0.1), 0.15, 0.6, 0.12); q.lean += k * 0.07 * Math.sin(TAU * tt / 3.4); q.tilt += k * 0.07 * Math.sin(TAU * tt / 3.4 + 0.5); q.hturn += k * (-0.35 * aw * (1 - M.notice) + 0.35 * M.notice - 0.35 * M.duck); }
  else if (st === 3) { q.bow += k * 0.06 * M.off; q.wide += 0.15 * M.off; q.looky += 0.15 * M.off; }
  else if (st === 4) { q.nod = (q.nod || 0) + k * 0.1 * (0.5 - 0.5 * br); q.tilt += k * 0.05 * Math.sin(TAU * tt / (P.br * 2)); }
  else if (st === 5) { q.nod = k * (0.06 + 0.12 * (0.5 - 0.5 * br)); q.bow = k * 0.05 * (0.5 - 0.5 * br); q.lean = k * 0.015 * Math.sin(TAU * tt / (P.br * 2.3)); q.hair *= 0.5; }
  if (o.land != null) { const ms = o.land - lagMs; if (ms > 0 && ms < 3000) { const r = RK.ring(ms, 420, 520); q.sq -= 0.16 * r; q.px += 0.1 * r; q.pz += 0.1 * r; } }
  if (sp) { q.bow += 0.2 * sp; q.nod = (q.nod || 0) + 0.3 * sp; q.lidx = Math.max(q.lidx || 0, 0.6 * sp); q.brow -= 0.3 * sp; } }
C26.rest = (f0 => function (S, t, o, q, lagMs) { if (on56(S) && S.k56) return rest56(S, t, o || {}, q, lagMs || 0); return f0(S, t, o, q, lagMs); })(C26.rest);
/* soft cloudy mist (white on black, read as alpha) */
const tex56 = T => { if (W56.tm) return W56.tm; const n = 128, cv = document.createElement('canvas'); cv.width = cv.height = n; const x = cv.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, n, n); let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 14; i++) { const a = r() * 2 * PI, d = Math.sqrt(r()) * n * 0.26, cx = n / 2 + Math.cos(a) * d, cy = n / 2 + Math.sin(a) * d * 0.7, rr = n * (0.12 + 0.14 * r()), g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(255,255,255,0.32)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, n, n); }
  return (W56.tm = new T.CanvasTexture(cv)); };
/* the parts it moves, found once */
function init56(S) { const G = S.G, J = G.J, R = G.R, bj = G.bj, T = S.T, st = S.st, V3 = T.Vector3, K = { top: bj.slice(R.head), rolls: [], arm: { 1: [], '-1': [] }, body: J.map((q, j) => (j && (q.role !== 'limb' || q.side) ? sm52((q.p[1] - 0.18 * G.H) / (0.4 * G.H)) : 0)), box: [], rime: [], mist: [], op: J.map(() => new V3()) };
  G.chains.forEach(c => { if (c.kind !== 'limb') return; if (!c.side && c.l.flat) { const n = c.jn.length, a = J[c.jn[n - 2]].p, b = J[c.jn[n - 1]].p, cx = (a[0] + b[0]) / 2 - J[0].p[0], cz = (a[2] + b[2]) / 2 - J[0].p[2], d = Math.hypot(cx, cz) || 1, r = J[c.jn[n - 2]].r;
      K.rolls.push({ c, dx: cx / d, dz: cz / d, r, ph: h52(K.rolls.length * 7.3 + st), big: st <= 2 && r > 0.55 }); }
    else if (c.side) (K.arm[c.side] || (K.arm[c.side] = [])).push(c); });
  S.bones.forEach((b, j) => b.children.forEach(m => { const u = m.userData; if (u.box49) K.box.push({ m, j, p0: m.position.clone(), em: [].concat(m.material).map(x => x.emissive && x.emissive.clone()), op: [].concat(m.material)[0].opacity }); if (u.r56 != null) K.rime.push({ m, i: u.r56, op: m.material.opacity, s: m.scale.clone() }); }));
  if (!S.jar) { const g = W56.mg || (W56.mg = new T.PlaneGeometry(1, 1).rotateX(-PI / 2)); for (let i = 0; i < (P56[st] || P56[3]).mist; i++) { const m = new T.Mesh(g, flat49(T, 0xf3f6ff, { transparent: true, alphaMap: tex56(T), depthWrite: false, depthTest: false, opacity: 0 })); m.renderOrder = 25; m.userData.plain = true; m.userData.nobox = true; m.visible = false; S.bones[0].add(m); K.mist.push({ m, i }); } }
  S.v56 = S.v52 = S.v52 || { a: new V3(), b: new V3(), c: new V3(), q: new T.Quaternion(), q2: new T.Quaternion(), z: new V3(0, 0, 1), y: new V3(0, 1, 0) }; S.k56 = K; return K; }
/* a run of joints bends (the drooping tip): each from `from` on is pushed aside more toward the tip and turned to lie along its new way */
function bend56(S, K, jn, from, lx, ly, lz) { const B = S.bones, n = jn.length, V = S.v56, O = K.op; if (n <= from) return; const cnt = n - from; for (let k = from - 1; k < n; k++) O[jn[k]].copy(B[jn[k]].position);
  for (let k = from; k < n; k++) { const e = Math.pow((k - from + 1) / cnt, 1.6), p = B[jn[k]].position; p.x += lx * e; p.y += ly * e; p.z += lz * e; }
  for (let k = from; k < n; k++) { const a = jn[k - 1], b = jn[k]; V.a.copy(O[b]).sub(O[a]); V.b.copy(B[b].position).sub(B[a].position); if (V.a.lengthSq() < 1e-10 || V.b.lengthSq() < 1e-10) continue; V.q.setFromUnitVectors(V.a.normalize(), V.b.normalize()); B[b].quaternion.premultiply(V.q); } }
/* a fern patch's life: it grows, holds, and fades */
const fern56 = (tt, g, P) => { const u = fr52(tt / P.fp + h52(g * 4.7 + 1)); return { grow: sm52(u / 0.4), fade: 1 - sm52((u - 0.72) / 0.28) }; };
/* the pen line's breaks: along the bank they creep outward with the fog; on the body a few gaps open and close as patches sink (the face is kept nearly whole) */
function cut56(S, tt) { const R = S.pen30, s = R && R.body; if (!s || !s.tp || !s.tp.P) return; const P = s.tp.P, n = s.tp.nv, b = S.bank49 || [0.14, 0.6], pl = S.pl49 || S.G.pl; if (!pl) return; let m = S.cut49; if (!m || m.length !== n) m = S.cut49 = new Uint8Array(n);
  const G = S.G, Jh = G.J[G.bj[G.R.head]], hy = Jh.p[1] - 0.6 * Jh.r, dr = 0.22 * tt, y1 = b[1] * 1.15, ga = KIT.gap56 == null ? 0.78 : KIT.gap56;
  for (let i = 0; i < n; i++) { const x = P[3 * i], y = P[3 * i + 1], z = P[3 * i + 2];
    if (y <= y1) { const ex = x - pl.x, ez = z - pl.z, L = Math.hypot(ex, ez) || 1, rr = Math.hypot(ex / pl.rx, ez / pl.rz), u = vn56((x - ex / L * dr) / 0.3, (z - ez / L * dr) / 0.3 + 5.1);
      m[i] = y < b[0] ? 1 : rr > 0.82 ? (u < 0.66 ? 1 : 0) : z < 0.1 ? (u < 0.5 ? 1 : 0) : (y < (b[0] + b[1]) * 0.5 && u < 0.35 ? 1 : 0); }
    else { const v = vn56(x * 1.7 + z * 0.8 + 11.3, (y + 0.3 * tt) * 2.2); m[i] = v > (y > hy ? 0.92 : ga) ? 1 : 0; } } }
/* after the whole play chain: the joints, the mist, the frost */
function pose56(S, o) { const K = S.k56 || init56(S), st = S.st, G = S.G, H = G.H, B = S.bones, J = G.J, V = S.v56, k = S.jar ? 0.6 : 1, P = P56[st] || P56[3], tt = clk56(S), TAU = 2 * PI, M = man56(S, tt), br = Math.sin(TAU * tt / P.br);
  if (S.u49) S.u49.value = tt; S.tt56 = tt; S.m56 = M; S.br56 = br;
  /* the body breathes, and its girth swells and settles out of step joint by joint: fog holding a shape */
  J.forEach((q, j) => { if (!j || q.role === 'limb' || K.body[j] <= 0) return; const f = 1 + k * (0.03 * br * (q.role === 'spine' ? 1 : 0.4) + 0.035 * n52(tt * 0.55, j * 1.7)); B[j].scale.x *= f; B[j].scale.z *= f; });
  /* the duck (and stage 1's change of place under its roll) */ const dy = -k * H * M.duck * P.dk, dx = k * M.dx;
  if (dy || dx) J.forEach((q, j) => { const w = K.body[j]; if (w > 0) { B[j].position.y += dy * w; B[j].position.x += dx * w; } });
  /* the arms: hug, offer */ const A = s => K.arm[s] || [], hand = c => c.l.arm || c.jn.length - 1; let bo = null;
  if (st === 2) { const hg = 0.5 + 0.5 * Math.sin(TAU * tt / 3.4), sq = k * H * (0.05 * hg + 0.04 * M.duck); [1, -1].forEach(s => A(s).forEach(c => push52(S, c.jn, hand(c), -s * sq * 0.5, 0.02 * H * M.duck * k, -sq * 0.6))); bo = [0, 0.02 * H * M.duck * k, -sq * 0.6]; }
  else if (st === 3) { const z = k * H * (0.17 * M.off - 0.03 * M.duck), y = k * H * (0.05 * M.off + 0.07 * M.duck + 0.01 * br); [1, -1].forEach(s => A(s).forEach(c => push52(S, c.jn, hand(c), 0, y, z))); bo = [0, y, z]; }
  else if (st === 4) [1, -1].forEach(s => A(s).forEach(c => { const p = B[c.jn[0]].position; rot52(S, c.jn, 1, p.x, p.y, p.z, V.z, s * k * 0.05 * Math.sin(TAU * tt / P.br + s)); }));
  /* the block keeps its place in the hands; a slow cold glint */ const gl = pl52(fr52(tt / 3.7 + 0.2), 0, 0.14, 0.05); K.gl = gl;
  K.box.forEach(e => { const b = B[e.j]; e.m.position.copy(e.p0); if (bo) { V.a.set(bo[0], bo[1], bo[2]).applyQuaternion(V.q.copy(b.quaternion).invert()).divide(b.scale); e.m.position.add(V.a); S.bo56 = [V.a.x, V.a.y, V.a.z]; } else S.bo56 = null;
    [].concat(e.m.material).forEach((x, i) => { if (e.em[i]) x.emissive.copy(e.em[i]).multiplyScalar(1 + 0.3 * gl); }); if (e.m.userData.box49 === 2) [].concat(e.m.material)[0].opacity = e.op * (0.8 + 0.2 * Math.sin(TAU * tt / 3.1)); });
  /* the drooping tip sways and droops further on each breath out */ bend56(S, K, K.top, 1, k * 0.05 * H * Math.sin(TAU * tt / (P.br * 1.3)), -k * 0.03 * H * (0.5 - 0.5 * br), 0);
  /* the rolls pour outward: each wells up small under the figure, swells, creeps out, flattens, thins and is gone; the big ones that make the shape only swell and lean out */
  K.rolls.forEach(R0 => { const jn = R0.c.jn, n = jn.length; let s, sy, out;
    if (R0.big) { const w = Math.sin(TAU * (tt / P.rp + R0.ph)); s = 1 + 0.07 * w + 0.03 * br + (st === 1 ? 0.05 * M.duck : 0); sy = 1 - 0.04 * w; out = 0.07 * R0.r * Math.sin(TAU * (tt / (P.rp * 1.3) + R0.ph)); }
    else { const u = fr52(tt / (P.rp * (0.85 + 0.3 * R0.ph)) + R0.ph), grow = sm52(u / 0.22), thin = 1 - sm52((u - 0.62) / 0.38); const s0 = [0, 0.3, 0.3, 0.3, 0.4, 0.45][st]; s = s0 + (1.22 - s0) * grow * thin + 0.03 * br; sy = 1.04 - 0.24 * sm52((u - 0.3) / 0.7); out = P.rt * R0.r * (u - 0.4); }
    const qa = J[jn[n - 2]].p, qb = J[jn[n - 1]].p, mx = (qa[0] + qb[0]) / 2, mz = (qa[2] + qb[2]) / 2, ln = Math.min(1, 0.25 + 0.75 * s);   /* a small roll is short as well as thin, never a long sausage */
    for (let i = 1; i < n; i++) { const jj = jn[i], p = J[jj].p, pil = i >= n - 2; B[jj].position.set((pil ? mx + (p[0] - mx) * ln : p[0]) + R0.dx * out, pil ? p[1] * (0.8 + 0.2 * Math.min(1, s * sy)) : p[1], (pil ? mz + (p[2] - mz) * ln : p[2]) + R0.dz * out); B[jj].quaternion.identity(); if (pil) B[jj].scale.set(s, s * sy, s); else B[jj].scale.setScalar(Math.min(1, 0.45 + 0.55 * s)); } });
  /* Water's drips are not fog */ S.drips.forEach(dp => { dp.g.visible = false; });
  /* the mist on the wood creeps outward from under the bank, spreading and thinning */ const pl = S.pl49 || G.pl, j0 = J[0].p;
  K.mist.forEach(e => { const L = 6 + 3 * h52(e.i + st * 5), x = tt / L + h52(e.i * 3.1), u = fr52(x), id = Math.floor(x), a = PI * (-0.1 + 1.2 * h52(id * 7.7 + e.i)), d = 0.5 + 0.85 * u, sz = (0.7 + 1.1 * u) * pl.rz * (0.8 + 0.4 * h52(id + e.i * 2.3)), op = (KIT.mist56 || 0.85) * Math.pow(Math.sin(PI * u), 1.2) * (1 - 0.35 * Math.max(0, -Math.sin(a)));
    e.m.position.set(pl.x + Math.cos(a) * pl.rx * d - j0[0], 0.04 + 0.12 * (1 - u), pl.z + Math.sin(a) * pl.rz * d * 0.9 - j0[2]); e.m.scale.set(sz * 1.7, sz, 1); e.m.rotation.y = 0.3 * Math.cos(a); e.m.material.opacity = op; e.m.visible = op > 0.01; });
  /* rime grows and fades with its ferns */ K.rime.forEach(r => { const f = fern56(tt, r.i, P), v = f.grow * f.fade; r.m.material.opacity = r.op * (0.3 + 0.7 * v); r.m.scale.copy(r.s).multiplyScalar(0.7 + 0.4 * v); });
  try { cut56(S, tt); } catch (e) { W56.err = String(e && e.stack); } }
/* the figure's own pen strokes move: the wisps slide down and thin; the ferns grow and fade; the block's lines go with the block */
function pen56(S) { const X = S.a48, tt = S.tt56, P = P56[S.st] || P56[3]; if (!X || !X.strokes || tt == null) return;
  X.strokes.forEach((s, si) => { if (!s.p0) { s.p0 = s.pts.map(p => p.slice()); s.w0 = s.w; } const p0 = s.p0, n = p0.length;
    if (s.t === 'wisp') { const u = fr52(tt / P.wp + si * 0.37), h = Math.abs(p0[0][1] - p0[n - 1][1]) || 0.3, a = Math.floor((n - 2) * sm52((u - 0.35) / 0.65)), b = Math.min(n, 2 + Math.ceil((n - 2) * sm52(u / 0.45)));
      s.pts = p0.slice(a, b).map(p => [p[0], p[1] - u * 0.4 * h, p[2]]); s.w = s.w0 * 1.6 * (1 - 0.6 * sm52((u - 0.4) / 0.6)); s.off = b - a < 2; }
    else if (s.t === 'fern') { const f = fern56(tt, s.g || 0, P); if (!s.ft && n > 2) s.pts = p0.slice(0, Math.max(2, Math.ceil(n * f.grow))); s.off = f.grow < (s.ft || 0) + 0.03 || f.fade < 0.04; s.w = s.w0 * (0.35 + 0.65 * f.fade); }
    else if (s.t === 'box') { const b = S.bo56; s.pts = b ? p0.map(p => [p[0] + b[0], p[1] + b[1], p[2] + b[2]]) : p0; } }); }
function hide56(S) { const K = S.k56; if (!K) return; K.mist.forEach(e => { e.m.visible = false; }); K.box.forEach(e => e.m.position.copy(e.p0)); S.bo56 = null; if (S.a48) S.a48.strokes.forEach(s => { if (s.p0) { s.pts = s.p0; s.w = s.w0; s.off = false; } }); if (S.cut49 && S.pen30) S.cut49 = null; }
/* the pen's strokes in the air: wisps sinking off the tip, hands, sleeves and block, the breath out, a puff rolling off on a shiver, the block's glint */
function ink56(T, S, ren, cam) { const R = S.pen30, K = S.k56, sz = ren.getDrawingBufferSize(W30.v2 || (W30.v2 = new T.Vector2())), Wd = sz.x, Ht = sz.y, sc = Ht / 720, pe = cam.projectionMatrix.elements, P10 = pe[10], P11 = pe[11];
  const lw = R.lw || 2, fs = lw / (W30.lw * sc), s2 = sc * Math.min(1.6, Math.max(0.5, fs)), ws = (S.s27 && S.s27.setFromMatrixScale(S.root.matrixWorld).x) || 1, d = 0.03 * S.G.H * ws, pool = W56.pool || (W56.pool = Array.from({ length: 24 }, () => new T.Vector3())); if (lw < 1.2 || S.c56 !== 'rest' || S.tt56 == null) return;
  const tt = S.tt56, st = S.st, P = P56[st] || P56[3], G = S.G, H = G.H, B = S.bones, J = G.J, rm = S.root.matrixWorld, TAU = 2 * PI, top = (S.bank49 ? S.bank49[1] : 0.3) * 0.9, pl = S.pl49 || G.pl, V = S.v56, wk = KIT.wisp56 || 1; let sd = 9300;
  const fall = (x, y, z, ox, u, len, w, ph) => { const Lf = Math.max(0.06 * H, y - top), hd = Math.min(1, 1.25 * u), tl = Math.max(0, hd - len); if (u <= 0 || u >= 1 || hd - tl < 0.03) return; const m = 8;
    for (let i = 0; i < m; i++) { const f = tl + (hd - tl) * i / (m - 1), c = sm52((f - 0.55) / 0.45); pool[i].set(x + ox * (0.1 * Lf * Math.sin(f * 4 + ph) * f + 0.6 * Lf * c * c), y - Lf * (f - 0.1 * c * c), z + 0.2 * Lf * f).applyMatrix4(rm); }
    free30(R, pool.slice(0, m), lw * w * wk * Math.sin(PI * u), s2, Wd, Ht, P10, P11, d, sd++, { smooth: 1, wob: 0.4, min: 3 }); };
  const src = (p, ox, per, nn, len, w, k0) => { for (let i = 0; i < nn; i++) fall(p.x, p.y, p.z, ox, fr52(tt / per + i / nn + h52(k0)), len, w, k0 * 1.3 + i); };
  /* the drooping tip */ { const p = B[K.top[K.top.length - 1]].position; src(p, p.x >= B[K.top[0]].position.x ? 1 : -1, P.wp * 1.3, 2, 0.45, 1.0, 1); }
  /* the hands and the sleeves */ [1, -1].forEach(s => (K.arm[s] || []).forEach((c, ci) => { const p = B[c.jn[c.jn.length - 1]].position, slv = st >= 4 && ci > 0; src(p, s, P.wp * (slv ? 0.8 : 1.15), slv ? 3 : 1, slv ? 0.5 : 0.4, slv ? 1.0 : 0.8, 3 + ci + (s > 0 ? 0 : 5)); }));
  /* the block: fog streams down off it */ K.box.forEach((e, i) => { if (e.m.userData.box49 !== 1) return; const b = B[e.j]; V.c.copy(e.m.position).multiply(b.scale).applyQuaternion(b.quaternion).add(b.position); V.c.y -= 0.15 * H * 0.15; [-1, 1].forEach(s => src({ x: V.c.x + s * 0.05 * H, y: V.c.y, z: V.c.z + 0.05 * H }, s, P.wp * 0.9, 1, 0.4, 0.8, 11 + s));
    /* its glint: a small star at its top corner */ if (K.gl > 0.04 && st < 4) { const r = 0.05 * H * K.gl; [[1, 1], [1, -1]].forEach(([a, c2], q2) => { pool[0].set(V.c.x + 0.05 * H - r * a, V.c.y + 0.1 * H - r * c2, V.c.z + 0.1 * H).applyMatrix4(rm); pool[1].set(V.c.x + 0.05 * H + r * a, V.c.y + 0.1 * H + r * c2, V.c.z + 0.1 * H).applyMatrix4(rm); free30(R, pool.slice(0, 2), lw * 0.5 * K.gl, s2, Wd, Ht, P10, P11, d, sd++, { smooth: 0, wob: 0.2, min: 2 }); }); } });
  /* the breath out falls as a wisp */ if (G.o.face && st >= 2) { const jh = G.bj[G.R.head], b = B[jh], fc = G.o.face.c; V.c.set(fc[0] - J[jh].p[0], fc[1] - J[jh].p[1] - 0.25, fc[2] - J[jh].p[2] + 0.45).multiply(b.scale).applyQuaternion(b.quaternion).add(b.position); fall(V.c.x, V.c.y, V.c.z, -1, fr52(tt / P.br + 0.3) * 1.4, 0.35, 0.8, 2); }
  /* a shiver sends a puff rolling off the bank on each side */ if (pl) { const v = fr52(tt / P.sv + 0.15) * P.sv / 1.8; if (v < 1) [-1, 1].forEach(s => { const cx = pl.x + s * (pl.rx * 0.88 + 0.4 * pl.rx * v), cy = top * 0.75 + 0.06 * H * Math.sin(PI * v), cz = pl.z + 0.45 * pl.rz, r = 0.06 * H * (0.6 + 0.9 * v), a0 = -s * v * 5; let m = 0;
    for (let i = 0; i <= 10; i++) { const a = a0 + i / 10 * 1.5 * PI; pool[m++].set(cx + r * Math.cos(a), cy + r * Math.sin(a), cz).applyMatrix4(rm); } free30(R, pool.slice(0, m), lw * 1.0 * wk * (1 - v), s2, Wd, Ht, P10, P11, d, sd++, { smooth: 1, wob: 0.4, min: 3 }); }); }
  R.pa.needsUpdate = R.ua.needsUpdate = R.ia.needsUpdate = true; R.mesh.geometry.setDrawRange(0, R.ni); }
play26 = (f0 => function (grp, clip, t, o) { const S = grp && grp.userData.rig2 && grp.userData.rig2.sp; if (!S || !S.way49) return f0(grp, clip, t, o);
    /* in the jar the margin's material carries no line width (W52 found this for Acid) */ if (S.hull27 && !S.hull27.material.userData.w) S.hull27.material.userData.w = { value: 0 };
    const a48 = S.a48, run = () => { S.a48 = null; try { return f0(grp, clip, t, o); } finally { S.a48 = a48; } }; const safe = () => { try { return run(); } catch (e) { if (S.hull27 && !S.hull27.material.userData.w) { S.hull27.material.userData.w = { value: 0 }; return run(); } throw e; } }; const r = safe(); if (!on56(S)) return r; S.c56 = clip;
    if (clip === 'rest') { const c0 = rn44(); try { if (!S.k56) { init56(S); safe(); } pose56(S, o || {}); } catch (e) { W56.err = String(e && e.stack); } W56.ms += rn44() - c0; W56.n++; }
    else if (S.k56) hide56(S); return r; })(play26);
KIT.spirit26.play = play26;
draw30 = (f0 => function (T, S, ren, cam) { const on = on56(S) && S.k56 && S.c56 === 'rest'; if (on) { try { pen56(S); } catch (e) { W56.err = String(e && e.stack); } } f0(T, S, ren, cam); if (on && S.pen30) { try { ink56(T, S, ren, cam); } catch (e) { W56.err = String(e && e.stack); } } })(draw30);
/* the shelf jar: the half-grown and ready figures and the stage form are the shy one (fitted to the glass); the stage form plays its rest as it is drawn */
function drive56(f) { const S = f.userData.rig2.sp, b = S.body, f0 = b.onBeforeRender; b.onBeforeRender = function (ren) { if (f0) f0.apply(this, arguments); const fr = ren.info.render.frame; if (S.jf56 === fr) return; S.jf56 = fr; try { play26(f, 'rest', 0, { jar: true }); } catch (e) { W56.err = String(e && e.stack); } }; }
function jar56(T, g) { const U = g.userData;
  [[U.big, 1], [U.mid, 0.62]].forEach(([c, k]) => { if (!c) return; c.children.slice().forEach(o => c.remove(o)); const f = dry49Fig(T, k < 1 ? 2 : 3, { jar: true }), q = fit44(T, f, 0.86, 1.95, 1.3), s = q.s * k, cs = c.scale.x || 1, inn = new T.Group(); inn.add(f); inn.scale.setScalar(s / cs); inn.position.set((-q.cx * s - c.position.x) / cs, (0.21 - q.y0 * s - c.position.y) / cs, (-q.cz * s - c.position.z) / cs); c.add(inn); if (k < 1) drive56(f); });
  U.form = sg => { if (U.sg === sg) return; U.sg = sg; const f = dry49Fig(T, sg, { jar: true, stage: sg }), q = fit44(T, f, sg >= 3 ? 1.12 : 0.9, 1.95, 1.6), pv = new T.Group(); pv.add(f); pv.scale.setScalar(q.s); pv.position.set(-q.cx * q.s, 0.21 + (sg >= 3 ? 0.3 : 0.08) - q.y0 * q.s, -q.cz * q.s); drive56(f);   /* lifted clear of the jar's front lip */
    if (U.big2) g.remove(U.big2); pv.visible = (U.big && U.big.visible) || !!(U.big2 && U.big2.visible) || U.stage === 2; if (U.big) U.big.visible = false; g.add(pv); U.big2 = pv; }; }
if (KIT.jar) KIT.jar = (f0 => function (T, key) { const j = f0.apply(this, arguments); if (j && key === 'co2' && KIT.dry49 === 'c' && KIT.idle56 !== false && T && T.SkinnedMesh) { try { jar56(T, j); } catch (e) { W56.err = String(e && e.stack); } } return j; })(KIT.jar);
KIT.W56 = W56;
// ==== W56 END
// ==== W57 BEGIN
// (builder 57) DRY ICE THE SHY ONE'S OWN ACT (AA.rxKit.act57, on by default; false or ?a57=0 gives the old act, Water's clip on its body). It is fog: it
// never walks, slides as a puddle or flies. Its idle (W56) keeps running under the act, so the rolls, mist, wisps and frost go on moving; the act is
// laid over it. The page (scheme S57) gives the trip, the atoms (o.bites.d57: P world centres, T the touch times in ms of the work, r an atom's radius,
// h home, p where it stands) and draws the tide, the welling bank, the frost on the atoms and on the bench.
//  gather: it pulls its block to its chest, looks the way it will go, and sinks into its bank till only its head and eyes ride above the rolls
//  pour:   the bank pours off along the bench and over the book as a low tide, its rolls running ahead and trailing, the head riding in it, peeping
//  rise:   at the molecule it comes up out of the welling bank beside the atoms, a small overshoot, then holds back, looks, looks at you, a false start
//  touch:  it holds the block out (from stage 4 its hands, cupped, the block glowing in its chest) to each atom in turn, each touch quicker than the
//          last, eyes squeezed shut at the touch; between touches the block stays half out; after the last it hugs the block back
//  home:   it ducks, turns its back, sinks till only the back of its drooping head rides in the rolls, the tide pours home, it turns and settles
KIT.act57 = KIT.act57 == null ? !(typeof location !== 'undefined' && /[?&]a57=0/.test(String(location.search))) : KIT.act57;
const W57 = { err: null, e: null };
const on57 = S => !!(S && S.way49 && !S.jar && KIT.act57 !== false && on56(S));
/* per stage: how deep it rides in its bank (sk), on the way home (skb), lean while it pours, how far the block may reach (in its heights), how long a reach takes (ms) */
const P57 = [null,
  { sk: 0.5, skb: 0.6, lean: 0.06, rch: 0.7, R: 260, hes: 0.5 },
  { sk: 0.55, skb: 0.5, lean: 0.05, rch: 0.55, R: 380, hes: 1 },
  { sk: 0.56, skb: 0.48, lean: 0.05, rch: 0.55, R: 420, hes: 1 },
  { sk: 0.58, skb: 0.48, lean: 0.04, rch: 0.5, R: 520, hes: 0.8 },
  { sk: 0.6, skb: 0.5, lean: 0.03, rch: 0.5, R: 640, hes: 0.6 }];
const cl57 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
/* the act's numbers at t ms (the whole clip: W wind-up, J the trip, D the work, B home) */
function ph57(t, o) { const W = o.W || 0, J = o.J || 1, D = o.D || 1, B = o.B || 1, d = (o.bites && o.bites.d57) || {}, st = d.st || 3, P = P57[st] || P57[3], sk = P.sk, dir = o.dir || 1, sd = o.sd || 1;
  const e = { ph: 0, e: 0, sink: 0, turn: 0, lean: 0, bow: 0, nod: 0, lookx: 0, looky: 0, wide: 0, brow: 0, blink: 0, lidx: 0, hturn: 0, sq: 0, hug: 0, reach: 0, ti: 0, tw: 1, mv: 0, lunge: 0, well: 0, home: false };
  const g1 = W + 0.26 * J;
  if (t < g1) { const u = cl57(t / g1); e.hug = sm52(u / 0.4); e.sink = sk * sm52((u - 0.3) / 0.7); e.lookx = dir * 0.9 * pl52(u, 0.1, 1.2, 0.15); e.hturn = 0.25 * dir * pl52(u, 0.1, 1.2, 0.15); e.wide = 0.4 * pl52(u, 0.05, 0.45, 0.1); e.brow = 0.4 * pl52(u, 0, 0.6, 0.1); e.sq = -0.05 * pl52(u, 0.05, 0.35, 0.1) + 0.04 * pl52(u, 0.4, 0.8, 0.1); e.bow = 0.1 * e.hug; e.blink = pl52(u, 0.3, 0.38, 0.04); return e; }
  if (t < W + J) { const u = (t - g1) / (W + J - g1); e.ph = 1; e.hug = 1; e.sink = sk; e.e = u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u); e.mv = Math.sin(PI * u); e.lean = -dir * P.lean * e.mv; e.lookx = dir * (0.9 - 0.5 * pl52(u, 0.45, 0.6, 0.05)); e.hturn = 0.2 * dir; e.looky = -0.1; e.sq = 0.03 * Math.sin(t / 150) * e.mv; e.blink = pl52(fr52(t / 1500 + 0.3), 0.5, 0.56, 0.03); e.well = 0; return e; }
  const a = t - W - J;
  if (a < D) { const p = a / D, Tt = d.T && d.T.length ? d.T : [0.75 * D], n = Tt.length, T0 = Tt[0], TL = Tt[n - 1], Hd = st === 1 ? 110 : st >= 5 ? 300 : 200; e.ph = 2; e.e = 1; e.hug = 1;
    /* the bank wells up round the atoms, then it rises out of it */ e.well = sm52(p / 0.12); const r0 = Math.max(0.1, (T0 - P.R - 420 * P.hes) / D), rs = sm52((p - 0.04) / (0.6 * r0));
    e.sink = sk * (1 - rs); e.sq = 0.06 * pl52(a, (0.04 + 0.6 * r0) * D - 60, (0.04 + 0.6 * r0) * D + 140, 80) - 0.03 * pl52(a, (0.04 + 0.6 * r0) * D + 140, (0.04 + 0.6 * r0) * D + 340, 90);
    /* it holds back and looks: at the atom, at you, at the atom; a false start */ const hz = pl52(a, (0.04 + 0.6 * r0) * D, T0 - P.R, 100); e.lean = -sd * 0.05 * hz * P.hes; e.lookx = sd * hz; e.looky = -0.35 * hz;
    const lk = pl52(a, T0 - P.R - 380 * P.hes, T0 - P.R - 170 * P.hes, 60) * (st > 1 ? 1 : 0); e.lookx *= 1 - lk; e.looky += 0.3 * lk; e.wide += 0.45 * lk; e.brow += 0.4 * lk + 0.2 * hz; e.blink = Math.max(e.blink, pl52(a, T0 - P.R - 160 * P.hes, T0 - P.R - 90 * P.hes, 30));
    const fs = st > 1 ? 0.28 * pl52(a, T0 - P.R - 820 * P.hes, T0 - P.R - 520 * P.hes, 140) : 0;
    /* the touches */ let ti = 0; for (let i = 0; i < n; i++) if (a >= Tt[i] - (i ? Math.min(P.R, 0.6 * (Tt[i] - Tt[i - 1])) : P.R)) ti = i;
    const Ti = Tt[ti], Ri = ti ? Math.min(P.R, 0.6 * (Ti - Tt[ti - 1])) : P.R, mid = 0.3, last = ti === n - 1; let r;
    if (a < Ti - Ri) r = fs; else if (a < Ti) { const u = sm52((a - (Ti - Ri)) / Ri); r = (ti ? mid : fs) + (1 - (ti ? mid : fs)) * u; e.tw = ti ? u : 1; } else if (a < Ti + Hd) r = 1; else r = last ? 1 - sm52((a - Ti - Hd) / 480) : 1 - (1 - mid) * sm52((a - Ti - Hd) / 200);
    e.reach = r; e.ti = ti; if (a < Ti - Ri) e.tw = 1; e.lunge = 0.45 * r; e.lookx = e.lookx * (1 - r) + sd * r; e.looky = e.looky * (1 - r) - 0.45 * r; e.bow += 0.12 * r; e.lean += sd * 0.05 * r;
    const at = a - Ti; if (at > -60 && at < Hd + 220) { e.lidx = Math.max(e.lidx, 0.75 * pl52(at, 0, Hd + 60, 50)); e.sq -= 0.05 * pl52(at, -40, Hd, 40); e.brow -= 0.3 * pl52(at, 0, Hd, 50); }
    if (a > TL + Hd + 200) { const u = sm52((a - TL - Hd - 200) / 380); e.lookx = sd * 0.6 * (1 - u); e.looky = -0.3 * (1 - u) + 0.15 * u; e.wide = 0.3 * pl52(a, TL + Hd + 380, D, 60); e.bow += 0.08 * u; e.blink = Math.max(e.blink, pl52(a, TL + Hd + 560, TL + Hd + 650, 30)); }
    return e; }
  const b = (a - D) / B; e.ph = 3; e.hug = 1 - sm52((b - 0.9) / 0.1);
  if (b >= 1) { e.ph = 4; e.home = true; return e; }
  /* it ducks, turns its back, sinks, and the tide pours home; it turns and settles */ const sb = P.skb;
  e.bow = 0.16 * pl52(b, 0, 0.2, 0.06); e.lookx = -dir * 0.4 * pl52(b, 0.02, 0.14, 0.04); e.blink = pl52(b, 0.03, 0.08, 0.02);
  e.turn = PI * sm52((b - 0.06) / 0.16) + PI * sm52((b - 0.82) / 0.12); e.sink = sb * sm52((b - 0.04) / 0.2) * (1 - sm52((b - 0.86) / 0.12)); e.sq = -0.05 * pl52(b, 0.93, 0.99, 0.02);
  const u = cl57((b - 0.2) / 0.62); e.e = 1 - (u < 0.5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u)); e.mv = Math.sin(PI * u) * (b > 0.2 && b < 0.82 ? 1 : 0); e.lean = dir * P.lean * e.mv; e.nod = 0.25 * e.mv; return e; }
/* the act's face and body numbers go into the rest clip's, each joint at its own lag */
C26.rest = (f0 => function (S, t, o, q, lagMs) { f0(S, t, o, q, lagMs); const X = S && S.x57; if (!X) return; const e = ph57(X.t - (lagMs || 0), X.o);
  q.sink = e.sink; q.turn = e.turn; q.lean += e.lean; q.bow += e.bow; q.nod = (q.nod || 0) + e.nod; q.lookx = e.lookx; q.looky = e.looky; q.wide += e.wide; q.brow += e.brow; q.blink = Math.max(q.blink || 0, e.blink); q.lidx = Math.max(q.lidx || 0, e.lidx); q.hturn = e.hturn; q.sq += e.sq; q.mv = 0; })(C26.rest);
/* after the play: the block and the hands (hug, reach to the atom), the rolls pouring ahead along the way, the bank welling */
function post57(S, e, o) { const K = S.k56; if (!K) return; const B = S.bones, G = S.G, H = G.H, J = G.J, d = (o.bites && o.bites.d57) || {}, st = S.st, P = P57[st] || P57[3], V = S.v56, R = S.root;
  R.updateWorldMatrix(true, false); const ws = V.c.setFromMatrixScale(R.matrixWorld).x || 1, off = [0, 0, 0];
  /* hugged in */ const hg = e.hug * (1 - e.reach); off[1] += 0.03 * H * hg; off[2] -= 0.06 * H * hg;
  /* the reach: from where the block is to the atom's near side, as far as it can */ let ctr = null; K.box.forEach(x => { if (x.m.userData.box49 !== 1 || ctr) return; const b = B[x.j]; ctr = V.b.copy(x.p0).multiply(b.scale).applyQuaternion(b.quaternion).add(b.position).clone(); });
  if (!ctr) { const ch = G.bj[G.R.chest] || 1; ctr = B[ch].position.clone(); ctr.z += 0.3 * H; }
  if (e.reach > 0.001 && d.P && d.P.length) { const P1 = d.P[Math.min(e.ti, d.P.length - 1)], P0 = d.P[Math.max(0, Math.min(e.ti - 1, d.P.length - 1))], w = e.tw;
    const tg = R.worldToLocal(V.a.set(P0[0] + (P1[0] - P0[0]) * w, P0[1] + (P1[1] - P0[1]) * w, P0[2] + (P1[2] - P0[2]) * w)), dv = tg.sub(ctr), L = dv.length() || 1, keep = (d.r || 0.5) / ws + 0.45 * ((G.o.box && G.o.box.s) || 0.2), go = Math.min(Math.max(0, L - keep), P.rch * H) * e.reach;
    off[0] += dv.x / L * go; off[1] += dv.y / L * go; off[2] += dv.z / L * go; W57.go = +go.toFixed(2); W57.L = +L.toFixed(2); }
  /* the block goes with the hands (till stage 3; from stage 4 it stays in the chest and glows at the touch) */
  if (st <= 3) { let bo = null; K.box.forEach(x => { const b = B[x.j]; V.a.set(off[0], off[1], off[2]).applyQuaternion(V.q.copy(b.quaternion).invert()).divide(b.scale); x.m.position.copy(x.p0).add(V.a); bo = [V.a.x, V.a.y, V.a.z]; }); S.bo56 = bo; }
  else K.box.forEach((x, i) => { [].concat(x.m.material).forEach((m, k) => { if (x.em[k]) m.emissive.copy(x.em[k]).multiplyScalar(1 + 0.6 * e.reach); }); });
  const hand = c => c.l.arm || c.jn.length - 1; [1, -1].forEach(s => (K.arm[s] || []).forEach((c, ci) => { if (ci > 0 && st >= 4) return; const k = st >= 4 ? 1 : 1; push52(S, c.jn, hand(c), off[0] * k + (st >= 4 ? -s * 0.06 * H * e.reach : 0), off[1] * k, off[2] * k); }));
  /* the rolls: the bank pours ahead along the way and trails behind; at the molecule it wells up round it */
  const pl = S.pl49 || G.pl; if ((e.mv > 0.001 || e.well > 0.001) && d.h && d.p) { const A = R.worldToLocal(V.a.set(d.h[0], 0, d.h[2])).clone(), Bp = R.worldToLocal(V.b.set(d.p[0], 0, d.p[2])); let dx = Bp.x - A.x, dz = Bp.z - A.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; if (e.ph === 3) { dx = -dx; dz = -dz; }
    K.rolls.forEach(R0 => { const jn = R0.c.jn, n = jn.length, dt = R0.dx * dx + R0.dz * dz, amt = pl.rx * e.mv * (0.2 + 0.5 * Math.max(0, dt) - 0.35 * Math.max(0, -dt)), sw = 1 + 0.25 * e.mv + 0.35 * e.well * (1 - e.reach * 0.5);
      for (let i = 1; i < n; i++) { const jj = jn[i]; B[jj].position.x += dx * amt * (i / (n - 1)); B[jj].position.z += dz * amt * (i / (n - 1)); if (i >= n - 2) { B[jj].scale.x *= sw; B[jj].scale.z *= sw; B[jj].scale.y *= 1 + 0.5 * (sw - 1); } } }); } }
function act57(f0, grp, S, t, o) { const e = ph57(t, o); S.x57 = { t, o }; W57.e = e;
  f0(grp, 'rest', 0, {}); post57(S, e, o); S.q57 = e; return { e: e.e, y: 0, lunge: e.lunge, n: 0, big: 0, done: e.ph >= 4, home: e.ph >= 4 }; }
play26 = (f0 => function (grp, clip, t, o) { const S = grp && grp.userData.rig2 && grp.userData.rig2.sp;
  if (clip !== 'act' || !on57(S)) { if (S && S.x57) { S.x57 = null; S.q57 = null; } return f0(grp, clip, t, o); }
  try { return act57(f0, grp, S, t, o || {}); } catch (err) { W57.err = String(err && err.stack); S.x57 = null; S.q57 = null; return f0(grp, clip, t, o); } })(play26);
KIT.spirit26.play = play26;
/* a soft cloud for the page's fog (white, its alpha in the picture) */
KIT.fog57 = function (T, kind) { const key = 'tx_' + kind; if (W57[key]) return W57[key]; const n = 128, cv = document.createElement('canvas'); cv.width = cv.height = n; const x = cv.getContext('2d'); let s = kind === 'rime' ? 29 : 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  if (kind === 'rime') { /* frost on a surface: a soft white patch and needles of frost that branch */ const g = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n * 0.48); g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(0.6, 'rgba(255,255,255,0.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, n, n);
    x.lineCap = 'round'; for (let i = 0; i < 9; i++) { const a = i / 9 * 2 * PI + r() * 0.5, L = n * (0.24 + 0.2 * r()); x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(n / 2, n / 2); x.lineTo(n / 2 + Math.cos(a) * L, n / 2 + Math.sin(a) * L); for (let k = 1; k < 5; k++) { const bx = n / 2 + Math.cos(a) * L * k / 5, by = n / 2 + Math.sin(a) * L * k / 5, bl = L * 0.3 * (1 - k / 6); [0.8, -0.8].forEach(q => { x.moveTo(bx, by); x.lineTo(bx + Math.cos(a + q) * bl, by + Math.sin(a + q) * bl); }); } x.stroke(); }
    for (let i = 0; i < 90; i++) { const a = r() * 2 * PI, d = Math.sqrt(r()) * n * 0.44; x.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * r()).toFixed(2) + ')'; x.fillRect(n / 2 + Math.cos(a) * d, n / 2 + Math.sin(a) * d, 1.6, 1.6); } }
  else for (let i = 0; i < 16; i++) { const a = r() * 2 * PI, d = Math.sqrt(r()) * n * 0.24, cx = n / 2 + Math.cos(a) * d, cy = n / 2 + Math.sin(a) * d * 0.75, rr = n * (0.13 + 0.14 * r()), g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(255,255,255,0.7)'); g.addColorStop(0.5, 'rgba(255,255,255,0.3)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, n, n); }
  return (W57[key] = new T.CanvasTexture(cv)); };
KIT.W57 = W57; KIT.d57dbg = () => ({ err: W57.err, go: W57.go, L: W57.L, e: W57.e ? { ph: W57.e.ph, e: +W57.e.e.toFixed(2), sink: +W57.e.sink.toFixed(2), reach: +W57.e.reach.toFixed(2), ti: W57.e.ti, turn: +W57.e.turn.toFixed(2) } : null });
// ==== W57 END
// ==== W61 BEGIN
// (builder 61) SLIME AS A SPIRIT, five stages, stills only (AA.rxKit.slime61 = 1, or ?s61=1 on the page; OFF by default: the game shows the old Slime).
// Built and drawn the way Water is, by Water's own code, as builders 48/50 (Acid) and 49/53 (Dry ice) did: each stage is a set of numbers like a stage
// of S25 (slick, spine keys, limbs, face) put in Water's stage-3 slot for the moment of building; geo26 makes it one closed skin on joints, fig26 gives
// the face, set30 the pen and the wash. What is Slime's own: a low wide heap with NO head (the face sits in the mass itself), slopes that sag out along
// the bench, a thick arm lifted and drooping at the hand, STRINGS (thin limbs that leave the arm and run down into the body: one skin, nothing loose),
// drips that end in a bead, a thick smooth slick with a violet rim in place of a pool (ooze61, tongues of slick, is kept but not used: they drew as
// claws), blisters of trapped air, the wash in dusky
// violet-pink with a bigger bare-paper gloss, and the pen's own strokes (bubbles, the sagging lip, a dribble at the mouth). All limb points are given
// where they are in the figure (lim61 turns them into paths from the place they leave the body).
//  1 the dollop: a small glossy blob, heavy sleepy eyes, one thread pulled up off its top with a bead on the end
//  2 the slump: a lopsided lump with a long sagging slope, puzzled at the first stub of an arm it has put up (one drip on it); one brow up, a long flat mouth
//  3 the heap (the line-up's figure): low and wide, the face in the top of the mass, one arm lifted high with strings trailing back to the body
//  4 the stretch: the whole mass pulled up tall like taffy, leaning, both arms flung out with curtains of strings, a great slow yawn
//  5 the mire: a vast mound, heavy lids, a long content smile, two raised arms with strings and one fallen forward on the bench, a wide slick, blisters
KIT.slime61 = KIT.slime61 == null ? ((typeof location !== 'undefined' && /[?&]s61=1/.test(String(location.search))) ? 1 : null) : KIT.slime61;
const W61 = { geo: {}, figs: [], err: null, TARGET: [0, 6500, 9500, 9600, 9600, 10400],
  ROLE: [null, { chest: 1, neck: 2, head: 2, hair: 5 }, { chest: 1, neck: 2, head: 2, hair: 6 }, { chest: 1, neck: 2, head: 2, hair: 6 }, { chest: 3, neck: 4, head: 6, hair: 9 }, { chest: 1, neck: 2, head: 2, hair: 6 }],   /* the 'head' joint is the low belly: there is no neck, the whole heap nods from its foot (a head joint higher up folds the skin across the face) */
  C: { lite: [0.86, 0.68, 0.89], edge: [0.62, 0.37, 0.71], shade: [0.50, 0.30, 0.63], margin: [0.82, 0.65, 0.87], lid: 0xc293d2 } };
/* where a limb leaves the body (as geo26 works it out: key k along the spine, angle th round it) */
const at61 = (K, k, th) => { const x = Math.max(0, Math.min(K.length - 5, k - 4)), i = Math.min(K.length - 6, Math.floor(x)), t = x - i, a = K[4 + i], b = K[5 + i], c = a.map((v, j) => v + (b[j] - v) * t); return [c[0] + Math.cos(th) * c[3], c[1], c[2] + Math.sin(th) * c[4]]; };
/* a limb given by where its points ARE */
const lim61 = (K, k, th, abs, rad, ex) => { const C = at61(K, k, th); return Object.assign({ k, th, r0: rad[0], ey: 1.2, path: abs.map(p => [p[0] - C[0], p[1] - C[1], p[2] - C[2]]), rad }, ex || {}); };
/* a string: from p0 (on the arm) down to p1 (in the body or the slick); thick where it leaves, a hair in the middle, a foot where it lands; it bows sideways by sag */
const hang61 = (p0, p1, sag, r1, sy) => { const T = [0.2, 0.42, 0.64, 0.84, 1], R = [0.11, 0.066, 0.06, 0.075, r1 || 0.15]; return [T.map(t => [p0[0] + (p1[0] - p0[0]) * t + (sag || 0) * Math.sin(PI * t), p0[1] + (p1[1] - p0[1]) * t - (sy || 0) * Math.sin(PI * t), p0[2] + (p1[2] - p0[2]) * t]), R]; };
/* a drip: a thread that ends in a bead before it parts */
const drip61 = (p0, L, rb) => [[[p0[0], p0[1] - L * 0.3, p0[2]], [p0[0], p0[1] - L * 0.66, p0[2]], [p0[0] + 0.01, p0[1] - L, p0[2]]], [0.085, 0.06, rb || 0.13]];
/* an arm with what hangs from it: the arm itself, and a limb for every string or drip: a hair that runs hidden inside the same arm and leaves it at point m
   (thin inside the arm, so the body is not swollen where many of them lie together) */
const arm61 = (K, k, th, abs, rad, hangs) => [lim61(K, k, th, abs, rad, { arm: 1 })].concat((hangs || []).map(h => { const hg = h.to ? hang61(abs[h.m], h.to, h.sag, h.r1, h.sy) : drip61(abs[h.m], h.L, h.rb); return lim61(K, k, th, abs.slice(0, h.m + 1).concat(hg[0]), rad.slice(0, h.m + 1).map(() => 0.07).concat(hg[1]), { str: 1 }); }));
/* a tongue of the slick creeping out along the bench: f0 to f1 are how far out (1 = the slick's own edge), bend turns its tip */
const ooze61 = (K, a, f0, f1, r, bend) => { const R = K[0][3], Rz = K[0][4], P = (f, da) => [K[0][0] + Math.cos(a + da) * R * f, 0.05, K[0][2] + Math.sin(a + da) * Rz * f]; return lim61(K, 4.4, a, [P(f0, 0), P((f0 + f1) / 2, (bend || 0) * 0.5), P(f1, bend || 0)], [r * 0.8, r, r * 0.7], { flat: [0, 1, 0], fk: () => 0.3, ooze: 1 }); };
/* a blister of trapped air standing on the skin */
const blis61 = (K, k, th, p, r) => lim61(K, k, th, [[p[0], p[1] - r * 0.5, p[2]], p], [r * 0.8, r], { blis: 1 });
/* pen: a bubble seen in the body (a ring on the skin with a glint tick), an open stroke on the skin */
const ring61 = (c, d, x, y, r, w) => [{ c, d, pts: Array.from({ length: 13 }, (_, i) => { const a = i / 12 * 2 * PI + 0.5; return [x + r * Math.cos(a), y + r * Math.sin(a)]; }), w: w || 0.6, o: { smooth: 1, wob: 0.25, min: 3, trim: 0 } },
  { c, d, pts: [[x - r * 0.5, y + r * 0.1], [x - r * 0.38, y + r * 0.42], [x - r * 0.08, y + r * 0.55]], w: (w || 0.6) * 0.8, o: { smooth: 1, wob: 0.2, min: 2, trim: 0 } }];
const line61 = (c, d, pts, w) => ({ c, d, pts, w: w || 0.6, o: { smooth: 2, wob: 0.5, min: 3 } });
const SPEC61 = [
  // 1 the dollop
  () => { const K = pool(0.08, 0.06, 1.05, 0.86, 0.5, 0.42).concat([[0.05, 0.45, 0, 0.68, 0.6], [0, 0.68, 0.02, 0.62, 0.57], [-0.03, 0.9, 0.02, 0.45, 0.42], [-0.05, 1.05, 0.02, 0.27, 0.25], [-0.05, 1.16, 0.02, 0, 0]]), fc = [0, 0.66, 0.35], fd = [0.04, 0.3, 1];
    return { keys: K, foot: 0.4, thin: 0.13, hp: 1.5, rings: 2.5, frho: 0.4, wet: [0.08, 0.06, 1.05, 0.86],
      limbs: [lim61(K, 9, 0.2, [[-0.03, 1.27, 0.02], [0.04, 1.42, 0.02], [0.18, 1.54, 0.02], [0.36, 1.56, 0.02], [0.5, 1.42, 0.02]], [0.1, 0.07, 0.062, 0.07, 0.14], { str: 1 })],
      face: { c: fc, d: fd, k: 1.12, er: 1.4, dx: 0.25, lid: 0.6, brow: { y: 0.33, len: 0.13, ang: [-0.3, -0.3], arch: 0.015, r: 0.02 }, mouth: { w: 0.09, d: 0.03, y: -0.2, tilt: 0.015, r: 0.022 } }, eyes: [1, 1.18],
      pen: ring61(fc, fd, 0.34, -0.36, 0.07),
      drops: [[-1.2, 0, 0.5, 0.05], [1.1, 0, 0.55, 0.04]] }; },
  // 2 the slump
  () => { const K = pool(0, 0.1, 1.75, 1.28, 0.85, 0.7).concat([[0.0, 0.55, 0, 0.92, 0.76], [-0.06, 0.88, 0, 0.88, 0.74], [-0.15, 1.2, 0.02, 0.78, 0.7], [-0.22, 1.48, 0.02, 0.56, 0.52], [-0.25, 1.66, 0.02, 0.32, 0.3], [-0.26, 1.76, 0.02, 0, 0]]), fc = [-0.12, 1.14, 0.5], fd = [0.14, 0.22, 1];
    const A = [[0.95, 1.12, 0.1], [1.42, 1.5, 0.15], [1.85, 1.78, 0.18], [2.2, 1.74, 0.2]], AR = [0.38, 0.31, 0.28, 0.29];
    return { keys: K, foot: 0.4, thin: 0.13, hp: 1.5, rings: 2.5, frho: 0.4, wet: [0, 0.1, 1.75, 1.28],
      limbs: [lim61(K, 5.6, PI, [[-1.05, 0.4, 0.05], [-1.6, 0.28, 0.1], [-2.1, 0.16, 0.14], [-2.5, 0.1, 0.16]], [0.55, 0.42, 0.27, 0.17], { slope: 1 }),
        lim61(K, 5.3, 0, [[0.95, 0.34, 0], [1.5, 0.22, 0.05], [1.95, 0.12, 0.08]], [0.46, 0.32, 0.2], { slope: 1 })]
        /* the first stub of an arm, held up a little way, one drip hanging from it */
        .concat(arm61(K, 6.8, 0.1, A, AR, [{ m: 3, L: 0.8, rb: 0.14 }])),
      face: { c: fc, d: fd, k: 1.4, er: 1.3, dx: 0.25, lid: 0.5, brow: { y: 0.31, len: 0.15, ang: [-0.38, 0.12], lift: [0, 0.045], arch: 0.015, r: 0.02 }, mouth: { w: 0.22, d: -0.03, y: -0.2, tilt: 0.035, r: 0.022 } }, eyes: [0.92, 1.2],
      pen: ring61(fc, fd, -0.6, -0.72, 0.09).concat(ring61(fc, fd, -0.2, -0.86, 0.055)),
      drops: [[-2.7, 0, 0.5, 0.05], [2.2, 0, 0.5, 0.045], [1.0, 0, 1.25, 0.04]] }; },
  // 3 the heap (the line-up's figure)
  () => { const K = pool(0, 0.15, 2.9, 1.75, 1.25, 1.0).concat([[-0.05, 0.7, 0, 1.3, 1.05], [-0.1, 1.25, 0.02, 1.22, 1.0], [-0.14, 1.6, 0.03, 0.98, 0.86], [-0.16, 1.9, 0.03, 0.66, 0.6], [-0.17, 2.1, 0.03, 0.38, 0.36], [-0.17, 2.2, 0.03, 0, 0]]), fc = [-0.02, 1.66, 0.7], fd = [-0.05, 0.16, 1];
    const A = [[1.12, 1.5, 0], [1.42, 2.15, 0], [1.85, 2.8, 0.02], [2.5, 3.15, 0.05], [3.2, 3.05, 0.08], [3.6, 2.62, 0.1], [3.68, 2.2, 0.1]], AR = [0.48, 0.37, 0.31, 0.3, 0.32, 0.33, 0.22];
    return { keys: K, foot: 0.4, thin: 0.13, hp: 1.5, rings: 2.5, frho: 0.4, wet: [0, 0.15, 2.9, 1.75],
      limbs: [lim61(K, 5.4, PI, [[-1.55, 0.36, 0.05], [-2.15, 0.32, 0.1], [-2.7, 0.24, 0.15], [-3.2, 0.14, 0.18], [-3.55, 0.1, 0.2]], [0.52, 0.46, 0.36, 0.22, 0.16], { slope: 1 }),
        lim61(K, 5.4, 0, [[1.4, 0.42, 0], [2.0, 0.3, 0.05], [2.7, 0.2, 0.1], [3.3, 0.13, 0.12]], [0.55, 0.42, 0.3, 0.2], { slope: 1 })]
        .concat(arm61(K, 6.4, -0.15, A, AR, [{ m: 2, to: [1.9, 0.6, 0.05], sag: -0.1 }, { m: 3, to: [2.62, 0.36, 0.1], sag: -0.14 }, { m: 4, to: [3.3, 0.16, 0.14], sag: 0.1, r1: 0.12 }, { m: 6, L: 1.0, rb: 0.15 }]))
        ,
      face: { c: fc, d: fd, k: 2.0, er: 1.2, dx: 0.25, lid: 0.62, brow: { y: 0.3, len: 0.14, ang: [-0.28, -0.28], arch: 0.018, r: 0.017 }, mouth: { w: 0.27, d: 0.06, y: -0.2, tilt: 0.03, r: 0.02 } }, eyes: [1, 1.15],
      pen: ring61(fc, fd, -0.8, -1.15, 0.14).concat(ring61(fc, fd, 0.15, -1.3, 0.08), ring61(fc, fd, 0.85, -1.05, 0.1)),
      drops: [[-3.9, 0, 0.45, 0.06], [3.5, 0, 0.6, 0.05], [1.2, 0, 1.75, 0.05]] }; },
  // 4 the stretch
  () => { const K = pool(0, 0.15, 3.0, 1.9, 1.5, 1.15).concat([[0, 0.8, 0, 1.55, 1.2], [0.02, 1.3, 0, 1.38, 1.1], [0.06, 1.8, 0.02, 1.18, 1.0], [0.12, 2.3, 0.04, 1.02, 0.9], [0.22, 2.8, 0.06, 0.96, 0.86], [0.34, 3.2, 0.06, 0.86, 0.8], [0.44, 3.55, 0.05, 0.64, 0.6], [0.5, 3.78, 0.05, 0.38, 0.36], [0.52, 3.9, 0.05, 0, 0]]), fc = [0.3, 3.02, 0.9], fd = [0.14, 0.12, 1];
    const A = [[1.2, 2.4, 0], [1.95, 2.75, 0], [2.75, 2.9, 0.02], [3.4, 2.75, 0.04], [3.75, 2.4, 0.05]], AR = [0.52, 0.38, 0.31, 0.31, 0.26];
    const B = [[-1.1, 2.5, 0], [-1.7, 3.1, 0], [-2.3, 3.6, 0.02], [-2.85, 3.82, 0.04], [-3.3, 3.62, 0.05]], BR = [0.52, 0.38, 0.31, 0.3, 0.27];
    return { keys: K, foot: 0.4, thin: 0.13, hp: 1.5, rings: 2.5, frho: 0.4, wet: [0, 0.15, 3.0, 1.9],
      limbs: [lim61(K, 5.5, 0, [[1.7, 0.5, 0], [2.4, 0.33, 0.05], [3.0, 0.2, 0.1], [3.5, 0.12, 0.12]], [0.75, 0.5, 0.31, 0.19], { slope: 1 }),
        lim61(K, 5.5, PI, [[-1.7, 0.5, 0], [-2.4, 0.33, 0.05], [-3.0, 0.2, 0.1], [-3.5, 0.12, 0.12]], [0.75, 0.5, 0.31, 0.19], { slope: 1 })]
        .concat(arm61(K, 9, 0, A, AR, [{ m: 1, to: [1.97, 0.82, 0.04], sag: -0.12 }, { m: 2, to: [2.77, 0.42, 0.08], sag: -0.14 }, { m: 3, to: [3.42, 0.2, 0.1], sag: 0.1, r1: 0.12 }, { m: 4, L: 0.9, rb: 0.14 }]))
        .concat(arm61(K, 9.1, PI, B, BR, [{ m: 1, to: [-1.75, 0.9, 0.04], sag: 0.12 }, { m: 2, to: [-2.35, 0.5, 0.08], sag: 0.16 }, { m: 3, to: [-2.9, 0.26, 0.1], sag: 0.1, r1: 0.12 }, { m: 4, L: 0.8, rb: 0.13 }])),
      face: { c: fc, d: fd, k: 2.0, er: 1.1, dx: 0.225, lid: 0.7, brow: { y: 0.3, len: 0.14, ang: [-0.3, -0.3], arch: 0.035, r: 0.016 }, mouth: { o: 0.13, y: -0.27, r: 0.018 } }, eyes: [1, 1.1],
      pen: ring61(fc, fd, -0.85, -1.75, 0.14).concat(ring61(fc, fd, -0.55, -2.15, 0.08)),
      drops: [[-4.0, 0, 0.5, 0.06], [4.0, 0, 0.5, 0.05], [0.9, 0, 2.0, 0.05]] }; },
  // 5 the mire
  () => { const K = pool(0, 0.2, 4.3, 2.4, 1.9, 1.4).concat([[0, 1.0, 0, 2.0, 1.5], [0, 1.5, 0.02, 1.9, 1.45], [0, 2.0, 0.03, 1.5, 1.25], [0, 2.45, 0.03, 1.0, 0.9], [0, 2.75, 0.03, 0.55, 0.5], [0, 2.9, 0.03, 0, 0]]), fc = [0, 1.95, 1.0], fd = [0, 0.16, 1];
    const A = [[2.0, 2.3, -0.1], [2.7, 3.1, -0.1], [3.4, 3.68, -0.05], [4.1, 3.85, 0], [4.62, 3.56, 0.05], [4.8, 3.12, 0.05]], AR = [0.6, 0.45, 0.38, 0.36, 0.36, 0.28];
    const B = [[-1.7, 2.75, -0.2], [-2.3, 3.4, -0.2], [-2.85, 3.72, -0.15], [-3.3, 3.52, -0.1]], BR = [0.46, 0.33, 0.28, 0.26];
    return { keys: K, foot: 0.4, thin: 0.13, hp: 1.5, rings: 2.5, frho: 0.4, wet: [0, 0.2, 4.3, 2.4],
      limbs: [lim61(K, 6, PI - 0.25, [[-2.0, 1.0, -0.2], [-2.9, 0.7, -0.1], [-3.7, 0.4, 0], [-4.3, 0.2, 0.1], [-4.75, 0.12, 0.15]], [1.25, 0.9, 0.55, 0.3, 0.18], { slope: 1 }),
        lim61(K, 6, 0.25, [[2.1, 0.9, -0.2], [3.0, 0.6, -0.1], [3.8, 0.36, 0], [4.4, 0.2, 0.1], [4.85, 0.12, 0.15]], [1.12, 0.8, 0.5, 0.29, 0.18], { slope: 1 }),
        /* the arm it has let fall forward on the bench */
        lim61(K, 6.8, PI - 0.7, [[-1.95, 1.5, 0.75], [-2.6, 1.1, 1.2], [-3.05, 0.55, 1.55], [-3.3, 0.16, 1.85]], [0.55, 0.45, 0.4, 0.5], { arm: 1, flat: [0, 1, 0], fk: s => 1 - 0.55 * sm((s - 0.7) * 3.4) })]
        .concat(arm61(K, 7.2, -0.2, A, AR, [{ m: 1, to: [2.72, 1.2, -0.05], sag: -0.12 }, { m: 2, to: [3.42, 0.72, 0], sag: -0.16 }, { m: 3, to: [4.1, 0.36, 0.05], sag: -0.12 }, { m: 4, to: [4.66, 0.16, 0.12], sag: 0.1, r1: 0.12 }, { m: 5, L: 1.1, rb: 0.15 }]))
        .concat(arm61(K, 8, PI + 0.3, B, BR, [{ m: 1, to: [-2.36, 1.5, -0.1], sag: 0.12 }, { m: 2, to: [-2.9, 1.02, -0.05], sag: 0.14 }, { m: 3, L: 1.0, rb: 0.14 }]))
        .concat([blis61(K, 8, 0.9, [0.95, 3.02, 0.35], 0.27), blis61(K, 8.5, 2.2, [-0.55, 3.4, 0.25], 0.19), blis61(K, 6, PI - 0.25, [-2.35, 2.2, 0.1], 0.2)])
        ,
      face: { c: fc, d: fd, k: 3.0, er: 1.0, dx: 0.245, lid: 0.6, brow: { y: 0.22, len: 0.16, ang: [-0.22, -0.22], arch: 0.02, r: 0.014 }, mouth: { w: 0.26, d: 0.06, y: -0.2, tilt: 0.012, r: 0.013 } }, eyes: [1, 1.12],
      pen: ring61(fc, fd, -1.3, -1.0, 0.2).concat(ring61(fc, fd, -0.85, -1.3, 0.11), ring61(fc, fd, 1.25, -1.05, 0.16), ring61(fc, fd, 0.3, -1.4, 0.09), ring61(fc, fd, -0.2, 1.05, 0.12),
        []),
      drops: [[-5.3, 0, 0.5, 0.07], [5.3, 0, 0.5, 0.06], [1.5, 0, 2.5, 0.06], [-1.2, 0, 2.5, 0.05]] }; }
];
/* the wash turns dusky violet-pink: the same shader as Water's, its blues changed, and more of the lit side left bare (slime is glossy) */
function tint61(T, S) { if (!S.m30) return; S.t61 = true; S.t48 = true; const C = W61.C, way = S.way61, g = v => 'vec3(' + v.map(x => x.toFixed(3)).join(', ') + ')',
    sw = [['step(l9, 0.35);', 'step(l9, 0.35); a9 = max(a9, 0.9 * (1.0 - smoothstep(0.06, 0.16, bp.y)));'], ['vec3(0.64, 0.80, 0.945)', g(C.lite)], ['vec3(0.40, 0.59, 0.84)', g(C.edge)], ['vec3(0.36, 0.52, 0.78)', g(C.shade)], ['vec3(0.60, 0.76, 0.92)', g(C.margin)], ['smoothstep(0.80, 0.87, l9', 'smoothstep(0.74, 0.80, l9'], ['hl = max(hl, pl * smoothstep(0.72, 0.78,', 'hl = max(hl, pl * smoothstep(0.86, 0.90,'], ['float low = smoothstep(0.42, 0.02, bp.y);', 'float low = smoothstep(0.42, 0.02, bp.y); hl *= smoothstep(0.08, 0.18, bp.y);'], ['smoothstep(0.42, 0.22, nv);', 'smoothstep(0.42, 0.22, nv) * smoothstep(0.10, 0.22, bp.y);']];
  const one = m => { if (!m || !m.isMeshStandardMaterial || !m.onBeforeCompile || m.userData.s61) return; m.userData.s61 = 1; const f0 = m.onBeforeCompile, k0 = m.customProgramCacheKey; m.onBeforeCompile = sh => { f0(sh); sw.forEach(q => { sh.fragmentShader = sh.fragmentShader.split(q[0]).join(q[1]); }); }; m.customProgramCacheKey = () => (k0 ? k0.call(m) : '') + 's61' + way; m.needsUpdate = true; };
  one(S.m30.body); one(S.m30.hull); (S.o29 || []).forEach(q => one(q.m30)); if (S.m30.lid && S.m30.lid.color) S.m30.lid.color.copy(new T.Color(C.lid).convertSRGBToLinear()); }
/* one stage: its numbers go in Water's stage-3 slot for the moment of building; the figure then carries its own stage (sizes, rest) */
function slime61Fig(T, stage, extra) { stage = Math.max(1, Math.min(5, stage | 0)) || 3; const sp = SPEC61[stage - 1], keep = [S25[2], W26.geo[3], W26.ROLE[3], W26.TARGET]; let g = null;
  S25[2] = sp; if (W61.geo[stage]) W26.geo[3] = W61.geo[stage]; else delete W26.geo[3]; W26.ROLE[3] = W61.ROLE[stage]; W26.TARGET = W61.TARGET[stage];
  try { g = fig26(T, 3, extra); W61.geo[stage] = W26.geo[3]; } finally { S25[2] = keep[0]; if (keep[1]) W26.geo[3] = keep[1]; else delete W26.geo[3]; W26.ROLE[3] = keep[2]; W26.TARGET = keep[3]; }
  const S = g.userData.rig2.sp, G = S.G, o = G.o, V3 = T.Vector3, J = G.J, jh = G.bj[G.R.head]; S.way61 = 's' + stage; S.st = stage; g.userData.rig2.stage = stage; if (g.userData.water24) g.userData.water24.stage = stage;
  /* lopsided eyes: one a little bigger than the other */ if (o.eyes && S.F) S.F.eyes.forEach((e, i) => { const k = o.eyes[i] || 1; e.g.children.forEach(m => { m.scale.multiplyScalar(k); m.position.multiplyScalar(k); }); e.er *= k; });
  /* the pen's own strokes, laid on the skin by rays from in front (as the face is laid); each rides the joint of the spine nearest to it */
  const near = p => { let bj = 0, bd = 1e9; J.forEach((q, j) => { const dd = Math.hypot(q.p[0] - p[0], q.p[1] - p[1], q.p[2] - p[2]); if (j && q.role !== 'limb' && dd < bd) { bd = dd; bj = j; } }); return bj; };
  const strokes = (o.pen || []).map(s => { let pts; if (s.air) pts = s.air; else { const Dv = new V3().fromArray(s.d || [0, 0, 1]).normalize(), Rv = new V3().crossVectors(new V3(0, 1, 0), Dv).normalize(), Uv = new V3().crossVectors(Dv, Rv), Cv = new V3().fromArray(s.c);
        pts = s.pts.map(q => { const p = Cv.clone().addScaledVector(Rv, q[0]).addScaledVector(Uv, q[1]).addScaledVector(Dv, G.H * 0.45); for (let i = 0; i < 200; i++) { const dd = G.f(p.x, p.y, p.z); if (dd < 0.003) { const gr = G.grad(p.x, p.y, p.z, G.cell * 0.3); return [p.x + gr[0] * 0.02, p.y + gr[1] * 0.02, p.z + gr[2] * 0.02]; } p.addScaledVector(Dv, -Math.max(0.004, dd * 0.4)); } return null; }).filter(Boolean); }
    if (pts.length < 2) return null; const j = s.j != null ? s.j : near(pts[0]);
    return { j, w: s.w || 0.6, o: s.o || { smooth: 2, wob: 0.7, min: 3 }, pts: pts.map(p => [p[0] - J[j].p[0], p[1] - J[j].p[1], p[2] - J[j].p[2]]) }; }).filter(Boolean);
  S.a61 = { strokes, pts: Array.from({ length: 40 }, () => new V3()) };
  tint61(T, S); W61.figs.push(S); if (W61.figs.length > 24) W61.figs.splice(0, W61.figs.length - 24); return g; }
/* the pool's ripple strokes and the flow lines down the front are Water's: a heap of slime has none (as Dry ice: G.pl and the chest are hidden from the pen
   for the moment of drawing). Its own strokes are then written by builder 48's ink48 with the figure's own pen; S.a48 is lent for that call only, so the
   idles and acts that key on S.a48 (Acid's) never run on Slime. */
draw30 = (f0 => function (T, S, ren, cam) { if (!S.way61) return f0(T, S, ren, cam); if (!S.t61) tint61(T, S); const pl = S.G.pl, R0 = S.G.R; S.G.pl = null; S.G.R = Object.assign({}, R0, { chest: 0 });
  try { f0(T, S, ren, cam); } finally { S.G.pl = pl; S.G.R = R0; }
  if (S.a61) { const a0 = S.a48; S.a48 = S.a61; try { ink48(T, S, ren, cam); } catch (e) { W61.err = String(e && e.stack); } finally { S.a48 = a0; } } })(draw30);
KIT.slime61Fig = slime61Fig; KIT.SLIME61 = W61;
/* behind the switch: Slime's bench figure is the spirit at its stage (the jar keeps the old Slime) */
KIT.build = (f0 => function (id, T, grp, tint, extra) { if (id === 'homslime' && KIT.slime61 && T && T.SkinnedMesh && grp && grp.add && !(extra && (extra.push || extra.jar))) { try { const g = slime61Fig(T, (extra && extra.stage) || 3, extra); grp.add(g.children[0]); grp.userData.rig2 = g.userData.rig2; grp.userData.rig2.sp.grp = grp; return true; } catch (e) { W61.err = String(e && e.stack); } } return f0.apply(this, arguments); })(KIT.build);
// ==== W61 END
// ==== W62 BEGIN
// (builder 62) SLIME ALIVE AT REST: its own idle, not Water's, Acid's or Dry ice's (AA.rxKit.idle62; false or ?i62=0 gives Water's rest back on it).
// Slime never stops and never hurries. The whole heap slowly sags, spreads and plumps back up past its height; as it settles a wobble runs through
// it and dies away, the top lagging the base like jelly (every body joint is moved by the same clock read later the higher it is). The slick creeps
// out and draws back. A lifted arm droops under its own weight and the strings go slack and belly out; it hauls the arm back up past where it was,
// the strings stretch thin, the thinnest snaps at its top and whips back down into the body, and a new one pulls up out of the body to the arm.
// A bead gathers under a hand, stretches on its thread and drops (a bead of the scene from then on) into a glossy spot on the bench that is drawn
// back into the slick. Bubbles rise inside it (pen rings riding the skin) and pop with a little dimple. Heavy lids droop, shut and jerk open
// (the jerk sends a wobble through it); a slow yawn now and then.
//  1 the dollop jiggles at every little thing (small knocks every two seconds or so) and nods off; the thread on its top swings after it
//  2 puzzled: lifts its stub of an arm, studies it (eyes on it, a turn of the hand), lets it flop with a bounce that shakes the whole lump
//  3 the slow sag-and-haul of the arched arm (strings slack, then thin, one snaps, a new one pulls out)
//  4 sways tall like pulled taffy, slowly sinks and pulls itself up again; both arms and their curtains of strings swing out of step
//  5 vast and nearly asleep: a deep slow swell, the two raised arms lazily lift and fall out of step, blisters swell, bubbles rise all over it
// Everything is the one skin on its own joints except the falling bead and the popped bubbles. Strings are rebuilt each frame between the arm
// and the place they land; a snapped one is drawn to nothing at both its free end and the joint it leaves (both hidden in arm or body), so
// no sliver of skin is left across the gap.
KIT.idle62 = KIT.idle62 == null ? !(typeof location !== 'undefined' && /[?&]i62=0/.test(String(location.search))) : KIT.idle62;
const W62 = { err: null, n: 0, ms: 0, jar: 0.55 };
/* the new Slime is ON by default from here (bench and jar both work at all five stages); ?s61=0 on the page gives the old Slime */
if (KIT.slime61 == null && !(typeof location !== 'undefined' && /[?&]s61=0/.test(String(location.search)))) KIT.slime61 = 1;
/* per stage: sag period (s) and depth, wobble period and size (share of H at the top), top lag (s), nod and yawn periods, arm cycle, bubble period, lanes [x, y0/H, y1/H, r] */
const P62 = [null,
  { sg: 5.2, sa: 0.13, pw: 0.42, wa: 0.11, lag: 0.16, nod: 9.5, yw: 17, cyc: 6.5, bp: 5.5, lanes: [[0.33, 0.16, 0.5, 0.075]] },
  { sg: 7.0, sa: 0.15, pw: 0.62, wa: 0.08, lag: 0.28, nod: 11.5, yw: 19, cyc: 8.6, bp: 5.5, lanes: [[-0.55, 0.12, 0.5, 0.1]] },
  { sg: 8.0, sa: 0.17, pw: 0.75, wa: 0.08, lag: 0.34, nod: 12.5, yw: 23, cyc: 9.4, bp: 6.0, lanes: [[-0.85, 0.1, 0.42, 0.13], [0.62, 0.1, 0.44, 0.11]] },
  { sg: 9.5, sa: 0.2, pw: 0.95, wa: 0.07, lag: 0.45, nod: 14, yw: 13, cyc: 10.5, bp: 6.5, lanes: [[-0.75, 0.08, 0.5, 0.14], [0.65, 0.08, 0.42, 0.12]] },
  { sg: 11.5, sa: 0.07, pw: 1.25, wa: 0.045, lag: 0.6, nod: 9, yw: 21, cyc: 12.5, bp: 5.0, lanes: [[-1.45, 0.07, 0.45, 0.18], [-0.6, 0.06, 0.4, 0.13], [0.45, 0.07, 0.42, 0.12], [1.35, 0.08, 0.45, 0.16], [0.05, 0.56, 0.74, 0.12]] }];
const on62 = S => !!(S && S.way61 && KIT.idle62 !== false);
const clk62 = S => (typeof performance !== 'undefined' ? performance.now() : 0) / 1000 * (S.jar ? W62.jar : 1) + S.st * 3.7;
/* time since the last of a run of events (period per, first at off), and which one it was */
const since62 = (tt, per, off) => { const x = (tt - off) / per, i = Math.floor(x); return [(x - i) * per, i]; };
/* the sag: down slowly, plump back up past its height, settle */
function sag62(P, tt) { const u = fr52(tt / P.sg); if (u < 0.6) return sm52(u / 0.6); if (u < 0.78) return 1 - 1.22 * sm52((u - 0.6) / 0.18); const d = (u - 0.78) * P.sg; return -0.22 * Math.exp(-d / (1.4 * P.pw)) * Math.cos(2 * PI * d / (1.6 * P.pw)); }
/* the knocks that send a wobble through it: settling, the jerk awake, stage 1's little things, stage 2's flop, a snap */
function ev62(S, tt) { const P = P62[S.st], E = [[since62(tt, P.sg, 0.78 * P.sg), 0.8], [since62(tt, P.nod, 0.68 * P.nod), S.st === 1 ? 1.3 : 0.7]];
  if (S.st === 1) { const a = since62(tt, 2.3, 0.4); E.push([a, 0.35 + 0.5 * h52(a[1] * 3.1)]); }
  if (S.st === 2) E.push([since62(tt, P.cyc, 0.62 * P.cyc + 0.3), 1.1]);
  if (S.st >= 3) E.push([since62(tt, P.cyc, 0.72 * P.cyc), 0.5]);
  return E; }
function wob62(S, tt) { const P = P62[S.st], ta = 1.5 * P.pw; let x = 0, y = 0; ev62(S, tt).forEach(([[d, i], a]) => { if (d > 5 * ta) return; const e = a * Math.exp(-d / ta), sg = i % 2 ? 1 : -1; x += sg * e * Math.sin(2 * PI * d / P.pw); y += 0.5 * e * Math.sin(2 * PI * d / P.pw + 1.2); }); return { x, y }; }
/* the nod: lids droop, shut, jerk open (0 to 1 of P.nod) */
const nod62 = (P, tt) => fr52(tt / P.nod);
/* the clip's numbers: the face and the slick (the body itself is moved in pose62) */
function rest62(S, t, o, q) { const st = S.st, P = P62[st], k = S.jar ? 0.6 : 1, tt = clk62(S), f = (S.F && S.F.f) || {}, lid0 = f.l62 != null ? f.l62 : f.lid || 0.5, TAU = 2 * PI;
  q.sq = 0; q.lean = 0; q.bow = 0; q.hair = 0; q.armR = q.armL = 0;
  const s = sag62(P, tt - 0.6); q.px = 1 + k * (0.07 * s + 0.035 * Math.sin(TAU * tt / 7.7)); q.pz = 1 + k * (0.05 * s + 0.03 * Math.sin(TAU * tt / 7.7 + 1));
  /* lids: droop, shut, jerk open */ const u = nod62(P, tt), dr = sm52(u / 0.55), sh = pl52(u, 0.55, 0.68, 0.02), jk = u > 0.68 ? Math.exp(-(u - 0.68) * P.nod / 0.5) : 0;
  if (f.l62 == null) f.l62 = f.lid || 0.5; S.lid62 = f.l62; f.lid = S.lid62 * (u > 0.68 ? sm52((u - 0.69) * P.nod / 1.6) : 1); q.lidx = u < 0.68 ? lid0 + (0.97 - lid0) * dr : 0; q.blink = Math.max(sh, pl52(fr52(tt / 4.3 + 0.2), 0, 0.03, 0.012) * (u > 0.75 || u < 0.3 ? 1 : 0)); q.wide = 0.7 * jk; q.brow = 0.6 * jk;
  q.nod = k * (st === 1 ? 0.16 : 0.06) * dr * (1 - sm52((u - 0.67) / 0.03)) - 0.05 * k * jk; q.tilt = k * 0.04 * Math.sin(TAU * tt / 6.1);
  /* a slow yawn */ const y = fr52(tt / P.yw + 0.45), yo = pl52(y, 0.04, 0.13, 0.025); if (yo > 0.01) { q.open = 0.5 + 0.6 * yo; q.lidx = Math.max(q.lidx, lid0 + (1 - lid0) * 0.8 * yo); q.smile = 1 + 0.5 * yo; q.tilt -= k * 0.05 * yo; q.brow -= 0.2 * yo; } S.yo62 = yo;
  q.lookx = 0.25 * Math.sin(TAU * tt / 9.3); q.looky = -0.15;
  if (st === 2) { const a = fr52(tt / P.cyc), w = pl52(a, 0.06, 0.62, 0.05); q.lookx = q.lookx * (1 - w) + 1.0 * w; q.looky = q.looky * (1 - w) + 0.55 * w; q.brow += 0.4 * w; q.tilt += 0.1 * w * k; q.lidx *= 1 - w; q.wide += 0.25 * w; }
  if (st === 3) { const a = fr52(tt / P.cyc), w = pl52(a, 0.58, 0.8, 0.04); q.lookx = q.lookx * (1 - w) + 0.9 * w; q.looky += 0.5 * w; q.brow += 0.3 * w; q.lidx *= 1 - 0.4 * w; }
  if (o.land != null) { const ms = o.land; if (ms > 0 && ms < 3000) { const r = RK.ring(ms, 420, 520); q.sq -= 0.16 * r; q.px += 0.1 * r; q.pz += 0.1 * r; } } }
C26.rest = (f0 => function (S, t, o, q, lagMs) { if (on62(S) && S.k62) return rest62(S, t, o || {}, q, lagMs || 0); return f0(S, t, o, q, lagMs); })(C26.rest);
/* the parts it moves, found once: body joints with their heights, arms and the strings and drips that hang from them, stage 1's thread, blisters, bubble lanes */
function init62(S) { const G = S.G, J = G.J, T = S.T, V3 = T.Vector3, H = G.H, st = S.st, K = { body: [], h: J.map(q => Math.max(0, Math.min(1, q.p[1] / H))), d: J.map(() => new V3()), arms: [], str: [], blis: [], thread: null, lanes: [], beads: [], spots: [] };
  J.forEach((q, j) => { if (j && q.role !== 'limb') K.body.push(j); });
  const same = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 1e-6, lims = G.chains.filter(c => c.kind === 'limb');
  lims.forEach(c => { if (c.l.arm) K.arms.push(c); else if (c.l.blis) K.blis.push(c); });
  lims.forEach(c => { if (!c.l.str) return; const a = K.arms.find(x => x.l.k === c.l.k && x.l.th === c.l.th); if (!a) { K.thread = c; return; } let m = 0; while (m < c.l.path.length && m < a.l.path.length && same(c.l.path[m], a.l.path[m])) m++;
    const jn = c.jn, top = m, n = jn.length, A0 = J[jn[top]].p, E0 = J[jn[n - 1]].p, L0 = Math.hypot(E0[0] - A0[0], E0[1] - A0[1], E0[2] - A0[2]) || 1, t = [], off = [], dir = [];
    for (let i = top; i < n; i++) { const p = J[jn[i]].p, tt = Math.max(0, Math.min(1, ((p[0] - A0[0]) * (E0[0] - A0[0]) + (p[1] - A0[1]) * (E0[1] - A0[1]) + (p[2] - A0[2]) * (E0[2] - A0[2])) / (L0 * L0))); t.push(tt); off.push([p[0] - A0[0] - (E0[0] - A0[0]) * tt, p[1] - A0[1] - (E0[1] - A0[1]) * tt, p[2] - A0[2] - (E0[2] - A0[2]) * tt]);
      const pa = J[jn[Math.max(top, i - 1)]].p, pb = J[jn[Math.min(n - 1, i + 1)]].p; dir.push(new V3(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]).normalize()); }
    K.str.push({ c, a, top, t, off, dir, L0, drip: n - top - 1 === 3, side: a.side || 1, i: K.str.length, k: 0 }); });
  K.str.filter(s => !s.drip).forEach((s, i) => { s.g = i; });
  /* bubble lanes: rest points on the front of the skin, low to high */
  const o = G.o, f = o.face || { c: [0, H * 0.5, 0], d: [0, 0, 1] }, Dv = new V3(f.d[0], 0, f.d[2]).normalize(), Rv = new V3().crossVectors(new V3(0, 1, 0), Dv).normalize();
  (P62[st].lanes || []).forEach((ln, li) => { const pts = []; for (let i = 0; i < 9; i++) { const y = H * (ln[1] + (ln[2] - ln[1]) * i / 8), p = new V3(f.c[0] + Rv.x * ln[0], y, f.c[2] + Rv.z * ln[0]).addScaledVector(Dv, H * 0.7); let hit = null;
      for (let s = 0; s < 260; s++) { const dd = G.f(p.x, p.y, p.z); if (dd < 0.003) { hit = p.clone(); break; } p.addScaledVector(Dv, -Math.max(0.004, dd * 0.4)); } if (hit) { let bj = 0, bd = 1e9; K.body.forEach(j => { const q = J[j].p, dd = Math.hypot(q[0] - hit.x, q[1] - hit.y, q[2] - hit.z); if (dd < bd) { bd = dd; bj = j; } }); pts.push({ p: hit, j: bj }); } }
    if (pts.length >= 3) K.lanes.push({ pts, r: ln[3], i: li, Dv, Rv }); });
  /* the falling beads and the glossy spots they leave (scene pieces on the figure's own floor) */
  if (!S.jar) { const lin = h => new T.Color(h).convertSRGBToLinear(), bm = new T.MeshToonMaterial({ color: lin(0xb27ccf), gradientMap: ramp24 }), im = new T.MeshBasicMaterial({ color: lin(COL.ink), side: T.BackSide }), g = new T.SphereGeometry(1, 12, 9), cg = W62.cg || (W62.cg = new T.CircleGeometry(1, 28).rotateX(-PI / 2));
    K.str.filter(s => s.drip).forEach(s => { const b = new T.Group(), a = new T.Mesh(g, bm), e = new T.Mesh(g, im); e.scale.setScalar(1 + G.ink * 0.8 / 0.14); a.userData.plain = e.userData.plain = true; b.add(a); b.add(e); b.visible = false; b.userData.nobox = true; S.root.add(b); K.beads.push(b);
      const sp = new T.Group(), d1 = new T.Mesh(cg, new T.MeshBasicMaterial({ color: lin(0x8e5aad), transparent: true, opacity: 0.85, depthWrite: false })), d2 = new T.Mesh(cg, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65, depthWrite: false })), d0 = new T.Mesh(cg, new T.MeshBasicMaterial({ color: lin(COL.ink), transparent: true, opacity: 0.55, depthWrite: false }));
      d0.scale.setScalar(1.12); d0.position.y = 0.004; d1.position.y = 0.008; d2.scale.set(0.32, 1, 0.2); d2.position.set(-0.3, 0.012, -0.25); [d0, d1, d2].forEach(m => { m.userData.plain = true; m.userData.nobox = true; m.renderOrder = 3; sp.add(m); }); sp.visible = false; sp.userData.nobox = true; S.root.add(sp); K.spots.push(sp); }); }
  S.v62 = { a: new V3(), b: new V3(), c: new V3(), d: new V3(), q: new T.Quaternion(), z: new V3(0, 0, 1), y: new V3(0, 1, 0) }; if (!S.v52) S.v52 = { a: new V3(), b: new V3(), c: new V3(), q: new T.Quaternion(), q2: new T.Quaternion(), z: new V3(0, 0, 1), y: new V3(0, 1, 0) };
  S.k62 = K; return K; }
/* the arms, per stage: an angle about the shoulder (raise > 0), a droop of the hand end, a lift; out of step for two arms */
function arm62(S, K, tt, k) { const st = S.st, P = P62[st], B = S.bones, V = S.v62, TAU = 2 * PI, out = { haul: 0 };
  K.arms.forEach((c, ai) => { const jn = c.jn, n = jn.length, sd = c.side || 1, sh = B[jn[1]].position, flat = !!c.l.flat; let ang = 0, dro = 0, lift = 0, tw = 0;
    if (flat) { ang = 0.05 * Math.sin(TAU * tt / 9.7); }
    else if (st === 2) { const u = fr52(tt / P.cyc), d = (u - 0.62) * P.cyc; if (u < 0.62) { ang = 0.6 * sm52((u - 0.04) / 0.22); tw = 0.22 * Math.sin(TAU * tt * 0.7) * pl52(u, 0.28, 0.6, 0.04); } else ang = d < 0.3 ? 0.6 - 0.9 * Math.pow(d / 0.3, 2) : -0.3 * Math.exp(-(d - 0.3) / 0.45) * Math.cos(TAU * (d - 0.3) / 0.55); }
    else if (st === 3) { const u = fr52(tt / P.cyc); if (u < 0.58) dro = sm52(u / 0.55); else if (u < 0.72) dro = 1 - 1.5 * sm52((u - 0.58) / 0.14); else dro = -0.5 * (1 - sm52((u - 0.74) / 0.24)); out.haul = Math.max(0, -dro); ang = -0.24 * dro; lift = 0.1 * Math.max(0, -dro); }
    else if (st === 4) { const ph = ai * 2.1, w = Math.sin(TAU * tt / 5.3 + ph); ang = 0.16 * w; dro = 0.35 * (0.5 - 0.5 * Math.sin(TAU * tt / 7.1 + ph)); lift = 0.04 * w; out.haul = Math.max(out.haul, 0.6 * Math.max(0, w)); }
    else if (st === 5) { const per = ai % 2 ? 10.7 : 8.3, w = 0.5 - 0.5 * Math.cos(TAU * tt / per + ai * 1.7); ang = 0.3 * w - 0.08; dro = 0.25 * (1 - w); out.haul = Math.max(out.haul, 0.7 * w); }
    ang *= k; dro *= k; lift *= k;
    if (ang) rot52(S, jn, 1, sh.x, sh.y, sh.z, V.z, sd * ang, kk => sm52(kk / 2.2));
    if (dro && n > 4) { const m0 = Math.floor(n * 0.5), pv = B[jn[m0]].position; rot52(S, jn, m0 + 1, pv.x, pv.y, pv.z, V.z, -sd * 0.55 * dro, kk => Math.min(1, (kk - m0) / 2)); }
    if (lift) push52(S, jn, 3, 0, lift * S.G.H, 0);
    if (tw) { const pv = B[jn[n - 2]].position; rot52(S, jn, n - 1, pv.x, pv.y, pv.z, V.y, tw * 2); rot52(S, jn, n - 1, pv.x, pv.y, pv.z, V.z, sd * tw); }
    /* the arm thins as it stretches on the haul */ if (out.haul) for (let i = 2; i < n; i++) { const s = 1 - 0.12 * out.haul * i / n; B[jn[i]].scale.x *= s; B[jn[i]].scale.z *= s; } });
  return out; }
/* a drip's cycle: at stages 2 and 3 it drops while the arm is held up */
const drip62 = (S, X) => { const P = P62[S.st]; if (S.st === 2 || S.st === 3) return [P.cyc, (S.st === 3 ? 0.23 : -0.27) * P.cyc]; const per = 5.2 + 1.3 * h52(X.i * 5.7 + S.st); return [per, per * h52(X.i * 2.3)]; };
/* a string (or a drip) between its arm and where it lands; snapped, regrowing; joints turned to lie along it */
function str62(S, K, X, tt, k, haul) { const B = S.bones, J = S.G.J, V = S.v62, H = S.G.H, jn = X.c.jn, n = jn.length, aj = X.a.jn, st = S.st, P = P62[st], TAU = 2 * PI;
  for (let i = 0; i <= X.top && i < aj.length; i++) { const b = B[jn[i]], a = B[aj[i]]; b.position.copy(a.position); b.quaternion.copy(a.quaternion); b.scale.copy(a.scale); }
  const A = V.a.copy(B[jn[X.top]].position), E = V.b.copy(B[jn[n - 1]].position); let top = 1, sc = 1, cap = 1, bow = 0, swing = 0, thin = 1;
  if (X.drip) { const [per, off] = drip62(S, X), [d, ci] = since62(tt, per, off), u = d / per, L = X.L0;
    let Lf, bs; if (u < 0.55) { Lf = 0.45; bs = 0.45 + 1.0 * sm52(u / 0.55); } else if (u < 0.72) { const v = sm52((u - 0.55) / 0.17); Lf = 0.45 + 0.65 * v; bs = 1.45 - 0.1 * v; } else { const v = (u - 0.72) * per; Lf = 0.3 + 0.35 * Math.exp(-v / 0.25) * Math.cos(TAU * v / 0.5) + 0.15 * sm52(v / 2); bs = S.jar ? 1.2 : 0.15 + 0.3 * sm52((v - 0.5) / 2); }
    if (S.jar) Lf = Math.min(Lf, 1.1);
    for (let i = X.top + 1; i < n; i++) { const tt2 = X.t[i - X.top], b = B[jn[i]]; b.position.set(A.x, A.y - L * Lf * tt2, A.z); b.quaternion.identity(); const s = i === n - 1 ? bs : (u > 0.55 && u < 0.72 ? 1 - 0.5 * sm52((u - 0.55) / 0.17) : 1) * (u >= 0.72 ? 0.7 : 1); b.scale.setScalar(s * (i === n - 1 ? 1 : Math.min(1.2, 1 / Math.sqrt(Math.max(0.4, Lf))))); }
    const bd = K.beads[K.str.filter(s => s.drip).indexOf(X)], sp = K.spots[K.str.filter(s => s.drip).indexOf(X)];
    if (bd && sp) { const v = (u - 0.72) * per, r0 = J[jn[n - 1]].r * 1.35, y0 = A.y - L * 1.1, g = 5 * H, tf = Math.sqrt(2 * Math.max(0.05, y0) / g); if (X.lc !== ci) { X.lc = ci; X.land = null; } if (v >= 0 && !X.land) X.land = [A.x, A.z]; bd.visible = v >= 0 && v < tf; if (bd.visible) { const y = y0 - 0.5 * g * v * v, el = 1 + Math.min(0.6, g * v * 0.08); bd.position.set(X.land[0], Math.max(0.05, y), X.land[1]); bd.scale.set(r0 / Math.sqrt(el), r0 * el, r0 / Math.sqrt(el)); }
      const w = v - tf, life = 0.24 * per; sp.visible = !!X.land && v >= tf && w < life; if (sp.visible) { const pl = S.G.pl || { x: J[0].p[0], z: J[0].p[2], rx: J[0].r, rz: J[0].r * 0.6 }, lx = X.land[0] - pl.x, lz = X.land[1] - pl.z, rr = Math.hypot(lx / pl.rx, lz / pl.rz) || 1, e = sm52(w / life), back = rr > 0.9 ? 1 - (1 - 0.9 / rr) * e : 1, s = 0.3 * (1 + 0.7 * sm52(w / 0.15)) * (1 - 0.75 * e);
        sp.position.set(pl.x + lx * back, 0, pl.z + lz * back); sp.scale.set(s, 1, s * 0.75); [].concat(sp.children).forEach((m, mi) => { m.material.opacity = [0.8, 0.85, 0.7][mi] * (1 - sm52((w - life * 0.7) / (life * 0.3))); }); } }
    return; }
  /* the strings: slack, they belly out and swing; pulled long, they thin; one snaps at the top of the haul and pulls out again */
  const L = Math.hypot(E.x - A.x, E.y - A.y, E.z - A.z) || 1e-3, L0 = X.L0; thin = L > L0 ? Math.max(0.3, Math.pow(L0 / L, 3)) * (1 - 0.25 * haul) : 1 - 0.2 * haul; bow = L < L0 ? 0.32 * Math.sqrt(Math.max(0, L0 * L0 - L * L)) : 0;
  swing = k * L0 * (st === 4 ? 0.14 : st === 5 ? 0.06 : 0.05) * Math.sin(TAU * tt / (st === 4 ? 3.1 : 4.2) + X.i * 1.3);
  const per = P.cyc, ns = K.str.filter(s => !s.drip).length, [d, ci] = since62(tt, per, 0.72 * per), mine = !S.jar && ns > 0 && ((ci % ns) + ns) % ns === X.g;
  const nxt = !S.jar && ns > 0 && (((ci + 1) % ns) + ns) % ns === X.g && d > per - 0.9; if (nxt) thin *= 1 - 0.6 * sm52((d - per + 0.9) / 0.9);
  if (mine && d < 2.6) { if (d < 0.45) { const v = d / 0.45; top = 1 - Math.pow(v, 1.3); sc = 0.8 - 0.7 * v; cap = 0; swing += X.side * 0.7 * L * Math.sin(PI * v) * (1 - 0.6 * v); } else if (d < 1.1) { top = 0; sc = 0; cap = 0; } else { const v = sm52((d - 1.1) / 1.4); top = v; sc = 0.25 + 0.75 * v; cap = v > 0.97 ? 1 : 0; thin = 0.5 + 0.5 * v; } }
  /* the top of the string: at the arm (top 1), or down at the place it lands */
  const At = V.c.copy(E).lerp(A, top), Ln = At.distanceTo(E) / L0, bx = (E.x + A.x) * 0.5 - S.bones[0].position.x;
  V.d.set(Math.sign(bx || X.side) * 1, -0.35, 0); const dx = E.x - At.x, dy = E.y - At.y, dz = E.z - At.z, dl = Math.hypot(dx, dy, dz) || 1e-3, dot = (V.d.x * dx + V.d.y * dy + V.d.z * dz) / dl; V.d.x -= dot * dx / dl; V.d.y -= dot * dy / dl; V.d.z -= dot * dz / dl; V.d.normalize();
  const pos = []; for (let i = X.top; i < n; i++) { const t = X.t[i - X.top], o = X.off[i - X.top], s = Math.sin(PI * t); pos.push([At.x + dx * t + o[0] * Ln + V.d.x * bow * s, At.y + dy * t + o[1] * Ln + V.d.y * bow * s, At.z + dz * t + o[2] * Ln + V.d.z * bow * s + swing * s]); }
  for (let i = X.top; i < n; i++) { const b = B[jn[i]], p = pos[i - X.top], ia = Math.max(0, i - X.top - 1), ib = Math.min(pos.length - 1, i - X.top + 1); b.position.set(p[0], p[1], p[2]);
    const nd = S.v62.b.set(pos[ib][0] - pos[ia][0], pos[ib][1] - pos[ia][1], pos[ib][2] - pos[ia][2]); if (nd.lengthSq() > 1e-10) { nd.normalize(); b.quaternion.setFromUnitVectors(X.dir[i - X.top], nd); }
    const wq = i === X.top ? cap : i === n - 1 ? Math.max(sc, 0.3 * sc) : sc * thin; b.scale.setScalar(Math.max(0.0001, wq)); }
  if (cap === 0) for (let i = 1; i < X.top; i++) B[jn[i]].scale.setScalar(0.0001);   /* the hair inside the arm goes with it: no skin is left across the gap */
  }
/* after the whole play chain: the body sags, spreads, plumps and wobbles (the top late); the arms, strings, drips, thread, blisters */
function pose62(S, o) { const K = S.k62 || init62(S), st = S.st, G = S.G, H = G.H, B = S.bones, J = G.J, k = S.jar ? 0.6 : 1, P = P62[st], tt = clk62(S), TAU = 2 * PI, cx = B[0].position.x, cz = B[0].position.z;
  S.tt62 = tt; const s0 = k * sag62(P, tt);
  K.body.forEach(j => { const h = K.h[j], lt = tt - P.lag * h, s = k * sag62(P, lt), w = wob62(S, lt), b = B[j], p = b.position, ox = p.x, oy = p.y, oz = p.z, a = k * P.wa * H;
    let sx = 0; if (st === 4) sx = k * 0.1 * H * Math.sin(TAU * lt / 6.3) + k * 0.04 * H * Math.sin(TAU * lt / 2.9 + 1); if (st === 5) sx = k * 0.02 * H * Math.sin(TAU * lt / 7.9);
    const sw = st === 5 ? k * 0.06 * Math.sin(TAU * lt / P.sg + 0.8) : 0, sp = 1 + 0.4 * P.sa * s + sw;
    p.y = oy * (1 - P.sa * s - 0.6 * sw) + a * w.y * h; p.x = cx + (ox - cx) * sp + (a * w.x + sx) * Math.pow(h, 1.3); p.z = cz + (oz - cz) * sp + 0.3 * a * w.x * h;
    const f = 1 + 0.65 * P.sa * s * (1 - 0.5 * h) + sw; b.scale.x *= f; b.scale.z *= f; b.scale.y *= 1 - 0.45 * P.sa * s - 0.5 * sw; K.d[j].set(p.x - ox, p.y - oy, p.z - oz); });
  /* the limbs ride the joint they grow from; what lies low on the bench stays down and spreads outward as it sags */
  G.chains.forEach(c => { if (c.kind !== 'limb') return; const par = J[c.jn[0]].par, D = K.d[par] || K.d[0], low = !!c.l.slope || !!c.l.flat;
    c.jn.forEach(jj => { const p = B[jj].position, w = low ? sm52((p.y - 0.12 * H) / (0.4 * H)) : sm52((p.y - 0.06 * H) / (0.25 * H)); p.x += D.x * w; p.y += D.y * w; p.z += D.z * w; if (low) { const e = 1 + 0.35 * P.sa * s0 * (1 - w); p.x = cx + (p.x - cx) * e; p.z = cz + (p.z - cz) * e; } }); });
  const ar = arm62(S, K, tt, k);
  K.str.forEach(X => { try { str62(S, K, X, tt, k, ar.haul); } catch (e) { W62.err = String(e && e.stack); } });
  /* stage 1's thread on its top swings after the body, and droops as it nods off */
  if (K.thread) { const jn = K.thread.jn, r = B[jn[0]].position, w = wob62(S, tt - 0.25), u = nod62(P, tt); rot52(S, jn, 1, r.x, r.y, r.z, S.v62.z, -k * (0.5 * w.x + 0.35 * sm52(u / 0.55) * (1 - sm52((u - 0.67) / 0.03)) + 0.12 * Math.sin(TAU * tt / 3.3)), kk => Math.pow(kk / (jn.length - 1), 1.2)); }
  /* blisters swell and settle out of step */ K.blis.forEach((c, i) => { const s = 1 + k * 0.22 * Math.sin(TAU * tt / (3.3 + i) + i * 2); c.jn.slice(1).forEach(jj => { B[jj].scale.multiplyScalar(s); }); });
  /* Water's drips are not slime */ S.drips.forEach(dp => { dp.g.visible = false; }); }
function hide62(S) { const K = S.k62; if (!K) return; if (S.lid62 != null && S.F && S.F.f) S.F.f.lid = S.lid62; K.beads.forEach(b => { b.visible = false; }); K.spots.forEach(b => { b.visible = false; }); }
/* the pen: bubbles rise inside the skin and pop, with a little dimple */
function ink62(T, S, ren, cam) { const R = S.pen30, K = S.k62, sz = ren.getDrawingBufferSize(W30.v2 || (W30.v2 = new T.Vector2())), Wd = sz.x, Ht = sz.y, sc = Ht / 720, pe = cam.projectionMatrix.elements, P10 = pe[10], P11 = pe[11];
  const lw = R.lw || 2, fs = lw / (W30.lw * sc), s2 = sc * Math.min(1.6, Math.max(0.5, fs)), ws = (S.s27 && S.s27.setFromMatrixScale(S.root.matrixWorld).x) || 1, d = 0.03 * S.G.H * ws, pool = W62.pool || (W62.pool = Array.from({ length: 24 }, () => new T.Vector3())); if (lw < 1.2 || S.c62 !== 'rest' || S.tt62 == null || !K.lanes.length) return;
  const tt = S.tt62, P = P62[S.st], J = S.G.J, B = S.bones, V = S.v62; let sd = 9900, any = false;
  K.lanes.forEach(L => { const per = P.bp * (0.85 + 0.3 * h52(L.i * 3.3 + S.st)), u = fr52(tt / per + h52(L.i * 7.1)), n = L.pts.length; if (u > 0.97) return;
    const rise = Math.min(1, u / 0.8), x = Math.pow(rise, 0.85) * (n - 1), i0 = Math.min(n - 2, Math.floor(x)), f = x - i0, a = L.pts[i0], b = L.pts[i0 + 1], j = f < 0.5 ? a.j : b.j, Mw = B[j].matrixWorld, Jp = J[j].p;
    V.c.copy(a.p).lerp(b.p, f); const pop = u > 0.8 ? (u - 0.8) / 0.17 : 0, r = L.r * (0.35 + 0.65 * rise) * (1 + 0.7 * pop), m = 14, seg = pop > 0 ? 4 : 1;
    for (let sgi = 0; sgi < seg; sgi++) { let c = 0; const a0 = sgi / seg * 2 * PI + 0.4, a1 = a0 + (pop > 0 ? 2 * PI / seg * (1 - 0.75 * pop) : 2 * PI); for (let q = 0; q <= m; q++) { const an = a0 + (a1 - a0) * q / m, rr = r * (1 + 0.25 * pop * (pop > 0 ? 1 : 0)); pool[c++].set(V.c.x - Jp[0] + rr * (Math.cos(an) * L.Rv.x), V.c.y - Jp[1] + rr * Math.sin(an), V.c.z - Jp[2] + rr * Math.cos(an) * L.Rv.z).applyMatrix4(Mw); }
      free30(R, pool.slice(0, c), lw * 1.05 * (1 - 0.8 * pop), s2, Wd, Ht, P10, P11, d, sd++, { smooth: 1, wob: 0.25, min: 3, trim: 0 }); }
    if (pop > 0.25) { const v = (pop - 0.25) / 0.75; let c = 0; for (let q = 0; q <= 6; q++) { const an = PI * (1.15 + 0.7 * q / 6), rr = L.r * 0.7; pool[c++].set(V.c.x - Jp[0] + rr * Math.cos(an) * L.Rv.x, V.c.y - Jp[1] + rr * 0.6 * Math.sin(an) + 0.2 * rr, V.c.z - Jp[2] + rr * Math.cos(an) * L.Rv.z).applyMatrix4(Mw); }
      free30(R, pool.slice(0, c), lw * 0.9 * (1 - v), s2, Wd, Ht, P10, P11, d, sd++, { smooth: 1, wob: 0.2, min: 2, trim: 0 }); }
    if (u < 0.8) { let c = 0; for (let q = 0; q <= 3; q++) { const an = PI * (0.62 + 0.25 * q / 3), rr = r * 0.55; pool[c++].set(V.c.x - Jp[0] + rr * Math.cos(an) * L.Rv.x, V.c.y - Jp[1] + rr * Math.sin(an), V.c.z - Jp[2] + rr * Math.cos(an) * L.Rv.z).applyMatrix4(Mw); } free30(R, pool.slice(0, c), lw * 0.7, s2, Wd, Ht, P10, P11, d, sd++, { smooth: 1, wob: 0.2, min: 2, trim: 0 }); }
    any = true; });
  if (any) { R.pa.needsUpdate = R.ua.needsUpdate = R.ia.needsUpdate = true; R.mesh.geometry.setDrawRange(0, R.ni); } }
play26 = (f0 => function (grp, clip, t, o) { const S = grp && grp.userData.rig2 && grp.userData.rig2.sp; if (!S || !S.way61) return f0(grp, clip, t, o);
  /* in the jar the margin's material carries no line width (W52 found this for Acid; W56 for Dry ice) */
  const gw = () => { if (S.hull27 && !S.hull27.material.userData.w) { S.hull27.material.userData.w = { value: 0 }; return true; } return false; }, safe = () => { gw(); try { return f0(grp, clip, t, o); } catch (e) { if (gw()) return f0(grp, clip, t, o); throw e; } };
  const r = safe(); if (!on62(S)) return r; S.c62 = clip;
  if (clip === 'rest') { const c0 = rn44(); try { if (!S.k62) { init62(S); safe(); } pose62(S, o || {}); } catch (e) { W62.err = String(e && e.stack); } W62.ms += rn44() - c0; W62.n++; }
  else hide62(S); return r; })(play26);
KIT.spirit26.play = play26;
draw30 = (f0 => function (T, S, ren, cam) { f0(T, S, ren, cam); if (on62(S) && S.k62 && S.c62 === 'rest' && S.pen30) { try { ink62(T, S, ren, cam); } catch (e) { W62.err = String(e && e.stack); } } })(draw30);
/* the shelf jar: the half-grown and ready figures and the stage form are the new Slime (fitted to the glass), each playing its rest as it is drawn */
function drive62(f) { const S = f.userData.rig2.sp, b = S.body, f0 = b.onBeforeRender; b.onBeforeRender = function (ren) { if (f0) f0.apply(this, arguments); const fr = ren.info.render.frame; if (S.jf62 === fr) return; S.jf62 = fr; try { play26(f, 'rest', 0, { jar: true }); } catch (e) { W62.err = String(e && e.stack); } }; }
function jar62(T, g) { const U = g.userData;
  [[U.big, 1], [U.mid, 0.62]].forEach(([c, k]) => { if (!c) return; const f = slime61Fig(T, k < 1 ? 2 : 3, { jar: true }); c.children.slice().forEach(o => c.remove(o)); const q = fit44(T, f, 0.95, 1.35, 1.5), s = q.s * k, cs = c.scale.x || 1, inn = new T.Group(); inn.add(f); inn.scale.setScalar(s / cs); inn.position.set((-q.cx * s - c.position.x) / cs, (0.21 + 0.3 * k - q.y0 * s - c.position.y) / cs, (-q.cz * s - c.position.z) / cs); c.add(inn); drive62(f); });
  U.form = sg => { if (U.sg === sg) return; U.sg = sg; const f = slime61Fig(T, sg, { jar: true, stage: sg }), q = fit44(T, f, 1.02, sg >= 4 ? 1.5 : 1.35, 1.8), pv = new T.Group(); pv.add(f); pv.scale.setScalar(q.s); pv.position.set(-q.cx * q.s, 0.21 + (sg >= 3 ? 0.34 : 0.24) - q.y0 * q.s, -q.cz * q.s + 0.1);   /* sat up on the jar's level, pressed toward the glass */ drive62(f);
    if (U.big2) g.remove(U.big2); pv.visible = (U.big && U.big.visible) || !!(U.big2 && U.big2.visible) || U.stage === 2; if (U.big) U.big.visible = false; g.add(pv); U.big2 = pv; }; }
if (KIT.jar) KIT.jar = (f0 => function (T, key) { const j = f0.apply(this, arguments); if (j && key === 'slime' && KIT.slime61 && KIT.idle62 !== false && T && T.SkinnedMesh) { try { jar62(T, j); } catch (e) { W62.err = String(e && e.stack); } } return j; })(KIT.jar);
/* at home on the bench the wide stages stand a little further back, so the slick keeps clear of the notebook's top edge */
KIT.build = (f0 => function (id, T, grp, tint, extra) { const r = f0.apply(this, arguments); try { const S = r && id === 'homslime' && grp && grp.userData && grp.userData.rig2 && grp.userData.rig2.sp; if (S && S.way61 && !(extra && (extra.push || extra.jar))) S.root.position.z -= [0, 0, 0.3, 0.6, 0.7, 0.9][S.st] || 0; } catch (e) { W62.err = String(e && e.stack); } return r; })(KIT.build);
KIT.W62 = W62;
/* for the recorder: seconds until the next snap / bead drop of a figure */
W62.until = (S, what) => { const K = S && S.k62, P = S && P62[S.st]; if (!K) return null; const tt = clk62(S);
  if (what === 'snap') return P.cyc - since62(tt, P.cyc, 0.72 * P.cyc)[0];
  const X = K.str.find(x => x.drip); if (!X) return null; const [per, off] = drip62(S, X), d = since62(tt, per, off)[0]; return ((0.72 * per - d) % per + per) % per; };
// ==== W62 END
})(typeof globalThis !== 'undefined' ? globalThis : window);
