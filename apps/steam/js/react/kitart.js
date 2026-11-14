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
      const ball = m => put(new T.SphereGeometry(1, 20, 14), m, 0, 0, 0), pl = o => { o.userData.plain = true; return o; }, disc = n => () => pl(cyl(1, 1, 0.03, pit, 0, 0.015, 0, null, n)), limb = hm => () => { cyl(0.1, 0.1, 1, dk, 0, -0.5, 0, null, 12); if (hm) sph(0.17, hm, 0, -1, 0); };
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
    const trip = (u, N, dir) => { const x = K.cl(u) * N, i = Math.min(N - 1, Math.floor(x)), v = x - i, C = i ? 0.26 : 0.08, hh = i === N - 1 ? 0.62 : 0.34; if (v < C) { const c = v / C; return { e: i / N, y: 0, sq: 0.3 * Math.sin(Math.PI * Math.min(1, c * 0.8 + 0.2)), lean: -dir * 0.1 * c, dx: 0, vy: 0 }; } const w = (v - C) / (1 - C), l = leap(w, dir); l.e = (i + w) / N; l.y = K.hop(w) * hh; l.sq *= 0.75; return l; };
    return {
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
            return { e2: hp && ms >= hp[0] ? 1 : 0, y: 0, sq: 0.4 * K.ring(ms, 110, 300) + (hp ? 0.36 * K.ring(ms - hp[0] - hp[1], 110, 300) : 0) + b.sq + (g > 0 ? -0.24 * Math.sin(Math.PI * K.cl(g / 190)) * (g < 190 ? 1 : 0) + 0.18 * K.ring(g - 190, 110, 270) : 0), lean: -o.sd * 0.22 * b.lunge, dx: 0, vy: 0, b }; }
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
      evo(Rg, F, P, a, o) { const d = F._, L = o.L, PRE = 420, n = (a - L) / L, END = 5.7, CR = 0.4, out = { e: 0, y: 0, big: 0, n, done: false }, FA = rigForm(Rg, o.from), FB = rigForm(Rg, o.to), fr = o.from, f = { wide: 0, brow: 0, look: [0, 0], open: null, smile: 0 };
        const S = lag => { const t = a - lag, m = (t - L) / L; if (t < 0) { const u = 1 + t / PRE; return { sq: 0.38 * K.eo(u / 0.55) - 0.6 * K.ei((u - 0.85) / 0.15), lean: 0, dx: 0, vy: 0 }; }
          if (t < L) return leap(t / L, o.dir);
          if (m < END) { let sq = 0.45 * K.ring(t - L, 130, 330); for (let b = 1; b <= 4; b++) sq += 0.1 * K.pulse(m, b - 0.22, b - 0.02, 0.1) - 0.2 * K.ring((m - b) * L, 110, 280); return { sq, lean: 0, dx: 0, vy: 0 }; }
          if (m < END + CR) { const u = (m - END) / CR; return { sq: 0.36 * K.eo(u / 0.6) - 0.55 * K.ei((u - 0.8) / 0.2), lean: 0, dx: 0, vy: 0 }; }
          if (m < END + CR + 1) return leap(m - END - CR, -o.dir);
          return { sq: 0.45 * K.ring((m - END - CR - 1) * L, 130, 330), lean: 0, dx: 0, vy: 0 }; };
        K.dress(P, d, S, HELD);
        if (a < 0) { f.wide = -0.3; f.brow = -0.4; } else if (a < L) { out.e = a / L; out.y = K.hop(out.e); out.big = K.sm(out.e); f.wide = 0.7; f.brow = 0.5; }
        else if (n < END + CR) { out.e = 1; out.big = 1; } else if (n < END + CR + 1) { const u = n - END - CR; out.e = 1 - u; out.y = K.hop(u); out.big = 1 - K.sm(u); f.smile = 1; f.brow = 1; f.wide = 0.3; } else { out.done = n > END + CR + 1.5; f.smile = 0.6; f.brow = 0.8; }
        // every part has its own beat. The rules, first that fits: [name test, beat, how, length in beats]. how: 'm' it tweens between the two forms, 'p' it grows there with a bounce,
        // 'd' it drops in from above, 'u' it comes up from below, 'a' it goes into the mouth and is gone, 'g' it shrinks away where it is
        const RULE = { 1: [[/^(foot|leg)L/, 2, 'p'], [/^(foot|leg)R/, 2.25, 'p'], [/^armL/, 3, 'p'], [/^armR/, 3.2, 'p'], [/^bolt/, 3.5, 'x'], [/^crumb/, 4.6, 'p']],
          2: [[/^bolt/, 1, 'a', 0.6], [/^crumb/, 1.3, 'g'], [/^leg/, 2, 'p'], [/^(jawL|toothL)/, 2.5, 'p', 0.4], [/^bar/, 3, 'd', 0.5], [/^drip/, 4, 'p'], [/^pit[23]/, 4.2, 'p'], [/^puff/, 4.4, 'p'], [/^sizzle/, 9, 'p']],
          3: [[/^bar/, 1, 'x'], [/^plank/, 2, 'x'], [/^(leg|foot)/, 3, 'g', 0.3], [/^pit4/, 3.2, 'p'], [/^tongue/, 4, 'p'], [/^chunk/, 4.3, 'd', 0.5], [/^puff1/, 4.6, 'p']],
          4: [[/^chunk/, 1.2, 'a', 0.5], [/^plank/, 2, 'x'], [/^(pool|pit$)/, 2, 'x'], [/^(mouth|maw|jaw|tooth|tongue)/, 3, 'm', 0.6], [/^leg5/, 4, 'u'], [/^jar5/, 4.4, 'u'], [/^chip/, 4.2, 'p'], [/^drip2/, 4.6, 'p'], [/^puff2/, 4.8, 'p']] }[fr] || [];
        Rg.order.forEach(nm => { const A = FA[nm], B = FB[nm]; if (!A && !B) return; let r = null; for (let i = 0; i < RULE.length && !r; i++) if (RULE[i][0].test(nm)) r = RULE[i]; const at = r ? r[1] : 1, how = r ? r[2] : A && B ? 'm' : B ? 'p' : 'g', len = (r && r[3]) || 0.7, u = K.cl((n - at) / len), q = K.part(P, nm), X = B || A;
          if (how === 'm') { q.k = K.sm(u); if (u > 0 && u < 1 && (nm === 'body' || nm === 'pool')) K.squash(P, nm, -0.14 * Math.sin(Math.PI * u)); }
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
        if (a >= L && n < END) { let pop = 0; for (let b = 1; b <= 4; b++) pop = Math.max(pop, Math.exp(-Math.max(0, n - b) * 3.5) * (n >= b ? 1 : 0)); const pl = K.sm((n - 4.9) / 0.4); f.wide = Math.max(f.wide, 0.75 * pop) * (1 - pl) - 0.72 * pl - 0.6 * K.pulse(a - L, -1, 110, 40); f.brow = 0.6 * pop + pl; f.smile = pl; if (f.look[0] === 0 && pop > 0.3 && n < 4.9) f.look = [Math.floor(n) % 2 ? 0.5 : -0.5, -0.7]; }
        K.face(P, d, f); K.ambient(P, Rg, F, a / 500, 1); if (a < L || n >= END) ground(P, a < L ? 1 - K.sm(a / L * 6) : K.eo((n - END - CR - 1) * L / 420)); return out; }
    }; })()
};
// rigPlay(grp, clip, time, o): one frame of a rigged creature's motion (clip 'rest' takes the time in beats, 'act' and 'evo' in ms from their start). Gives back what the clip gives.
function rigPlay(grp, clip, t, o) { const Rg = grp && grp.userData && grp.userData.rig2, C = Rg && CLIP[Rg.id]; if (!C || !C[clip]) return null; o = o || {}; const a = clip === 'evo' ? o.from : Rg.stage, b = clip === 'evo' ? o.to : Rg.stage, P = {}, out = C[clip](Rg, rigForm(Rg, clip === 'evo' ? o.to : Rg.stage), P, t, o); rigSet(grp, a, b, 0, P); return out; }
AA.rxKit = { fogDrift: (g, t) => { /* the fog hangs, sinks and rolls slowly, on a loop */ let n = 0; g.traverse(o => { const f = o.userData && o.userData.fog; if (!f) return; n++; const a = t * 0.5 + f.n * 1.7, b = t * 0.31 + f.n * 2.9; o.position.x = f.x + (f.low ? 0.22 : 0.08) * f.w * Math.sin(a); o.position.y = f.y + (f.low ? 0.01 : -0.06 * f.h * (0.5 + 0.5 * Math.sin(b))); o.scale.set(f.w * (1 + 0.1 * Math.sin(b)), f.h * (1 + 0.08 * Math.cos(a)), 1); o.material.opacity = f.o * (0.82 + 0.18 * Math.sin(a * 0.7 + 1)); o.material.rotation += 0.0006 * (f.n % 2 ? 1 : -1); }); return n; }, pushOn: true, PUSHED: ['water', 'acid', 'slime', 'salt', 'co2', 'h2', 'wood', 'seedling', 'ammonia', 'brimstone'], stageSize, STAGED: ['water', 'acid', 'slime'], shelf: (T, n) => { const g = new T.Group(); return build(n > 5 ? 'shelf10' : 'shelf5', T, g, new T.Color(0x8a5a2b)) ? g : null; }, tag: (T, n) => { const g = new T.Group(); return build(n >= 1 && n <= 5 ? 'tag_' + n : 'tag_more', T, g, new T.Color(0xf0b93a)) ? g : null; }, build, FLAT, K, mat, finish, snap, PAL, drawCoin, use, jarReport, pose, poseToward, creature, jar, HOMID, list: T => { const g = {}; return build('__list', T, { add() {}, traverse() {}, children: [] }, new T.Color(0)); } };
// (builder 21) the rig: AA.rxKit.rigOn = false gives the solid pushed forms back
Object.assign(AA.rxKit, { rigOn: true, rigSet, rigPlay, rigForm, RK, CLIP, RIGGED: ['acid'] });
})(typeof globalThis !== 'undefined' ? globalThis : window);
