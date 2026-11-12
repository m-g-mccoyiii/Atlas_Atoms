// Overreact: the feel of the moment of play (docs/FEEL.md, docs/FEEL_BUILD.md).
// The page (scheme.js) hands the play sequence to this file through a few hooks: firing, each reagent thrown, each
// reflex step, every frame, the ink, and the end of the page. Everything that decides how the sequence moves and
// sounds lives here: the timing law, easing, springs, hit-stop, the camera, the throw, the step choreography, the
// count, the flags, the runoff, and three directions as data.
//   AA.rxFeel.set(0 | 1 | 2 | 3), or ?feel=0..3 in the address; saved. 0 is the old sequence.
//   1 Mass: the molecule is heavy and every join is a hammer blow on the page.
//   2 Runaway: faster and faster with the count racing, one held breath, then one huge landing.
//   3 Close-up: the camera directs; it dives to each join and pulls back as the count climbs, every flag its own beat.
// Bond lengths never change: groups move along their own paths, the molecule recoils and turns as one rigid piece.
(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
const KEY = 'overreact.feel';

// ---------- the three directions, as data ----------
// Sizes are shares of the molecule's drawn width W. Times are ms. H is hit-stop in frames (1/60 s).
const DIR = {
  1: { name: 'mass',
    T1: 600, r: 0.90, Tmin: 240, wind: 0.38, swing: 0.22, swingPow: 5, H: n => Math.min(3 + n, 10), Hlast: 20,
    draw: n => 0.06 + 0.004 * Math.min(n, 10), ov: 0.04, settleHz: 9, settleZ: 0.55,
    recoil: n => 0.045 + 0.04 * Math.min(1, (n - 1) / 7), yaw: 3.5, recHz: 4, recZ: 0.45,
    drop: n => 0.025 + 0.004 * Math.min(n, 7), dropMs: 200,
    shakeGain: 1.3, shakeHz: 12, shakePeak: 0.03,
    throwGap: 340, throwMs: 240, arc: 120, throwRec: [0.035, 0.05, 0.08], firstWait: 300, lastWind: 600, fullDraw: 200,
    cam: 'lock', count: 'stamp', zoomMax: 1.55, numW: n => 2 + Math.min(3, n * 0.35),
    snapW: 1.6, snapFrom: 2, bell: 0.8, droneFrom: 3, droneLow: true, echo: false,
    wordK: 1.2, hold: 700, finale: 'slam' },
  2: { name: 'runaway',
    T1: 480, r: 0.82, Tmin: 167, wind: 0.20, swing: 0.40, swingPow: 3, H: () => 1, Hlast: 16,
    draw: n => 0.035, ov: 0.06, settleHz: 6, settleZ: 0.35,
    recoil: n => 0.025 + 0.025 * Math.min(1, (n - 1) / 8), yaw: 2, recHz: 5, recZ: 0.5,
    drop: () => 0, dropMs: 0, landDrop: 0.05,
    shakeGain: 1.1, shakeHz: 18, shakePeak: 0.03,
    throwGap: 200, throwMs: 200, arc: 80, throwRec: [0.025, 0.035, 0.05], firstWait: 150, lastWind: 180, fullDraw: 0,
    cam: 'push', count: 'race', zoomMax: 1.3, numW: () => 2,
    snapW: 0.8, snapFrom: 3, bell: 1.0, droneFrom: 2, droneLow: false, echo: false, fastBell: true,
    wordK: 1.0, hold: 600, finale: 'breath' },
  3: { name: 'closeup',
    T1: 600, r: 0.86, Tmin: 200, wind: 0.30, swing: 0.25, swingPow: 3, H: n => Math.min(2 + n, 8), Hlast: 16,
    draw: n => 0.05, ov: 0.12, settleHz: 6, settleZ: 0.35,
    recoil: n => 0.03 + 0.035 * Math.min(1, (n - 1) / 7), yaw: 2.5, recHz: 4, recZ: 0.45,
    drop: () => 0, dropMs: 0,
    shakeGain: 0.5, shakeHz: 16, shakePeak: 0.02,
    throwGap: 360, throwMs: 260, arc: 90, throwRec: [0.03, 0.045, 0.07], firstWait: 250, lastWind: 500, fullDraw: 150,
    cam: 'dive', count: 'beat', zoomMax: 1.5, numW: () => 3,
    snapW: 1.0, snapFrom: 3, bell: 1.0, droneFrom: 6, droneLow: false, echo: true,
    wordK: 1.3, hold: 900, finale: 'pull' }
};
const WORDS = ['stable', 'unstable', 'volatile', 'overreact'], WSZ = [54, 64, 76, 130];

let mode = 0;
try { const q = new URLSearchParams(root.location.search).get('feel'); if (q !== null && q !== '') mode = Math.max(0, Math.min(3, +q || 0)); else { const s = root.localStorage.getItem(KEY); if (s !== null) mode = Math.max(0, Math.min(3, +s || 0)); else mode = 3; } } catch (e) { mode = 3; }

let api = null, T = null;
const F = { log: [], probeRows: [], seq: null, BOX: { x0: -11.5, x1: 25, z0: -17.2, z1: -1.4 }, BOXW: { x0: -23.5, x1: 25, z0: -17.4, z1: -4.8 } };
const D = () => DIR[mode] || DIR[1];
const on = () => !!api && mode > 0;
const now = () => performance.now();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const E = {
  inCubic: u => u * u * u, inQuad: u => u * u, outCubic: u => 1 - Math.pow(1 - u, 3), outQuart: u => 1 - Math.pow(1 - u, 4),
  outSine: u => Math.sin(u * Math.PI / 2), inOutCubic: u => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  inOutSine: u => -(Math.cos(Math.PI * u) - 1) / 2, outBack: (u, s) => { s = s || 1.70158; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); },
  pow: (u, p) => Math.pow(u, p)
};
// a damped spring that starts at 1 and rings down: hz, damping ratio z
const ring = (t, hz, z) => { const w = 2 * Math.PI * hz, wd = w * Math.sqrt(Math.max(0.01, 1 - z * z)); return Math.exp(-z * w * t) * Math.cos(wd * t); };
// a knock that starts at 0, peaks near 1 and rings down
const kick = (t, hz, z) => { const w = 2 * Math.PI * hz, wd = w * Math.sqrt(Math.max(0.01, 1 - z * z)), tp = Math.atan(wd / (z * w)) / wd, pk = Math.exp(-z * w * tp) * Math.sin(wd * tp); return t <= 0 ? 0 : Math.exp(-z * w * t) * Math.sin(wd * t) / pk; };
// smooth noise from a few sines with fixed phases
const nz = (t, s) => (Math.sin(t * 1.0 + s) * 0.5 + Math.sin(t * 2.31 + s * 1.7) * 0.3 + Math.sin(t * 4.13 + s * 2.9) * 0.2);
const snd = (name, ...a) => { try { if (AA.sfx && AA.sfx[name]) AA.sfx[name](...a); } catch (e) { /* sound never breaks play */ } };

// T(n): wind-up plus swing plus hit-stop; the settle overlaps the next step. Never under ten frames.
function Tn(n) { const d = D(); return Math.max(167, d.Tmin, d.T1 * Math.pow(d.r, n - 1)); }
function phases(n, last) {
  const d = D(), sp = (F.seq && F.seq.speed) || 1;
  if (last) { const H = d.Hlast; return { wind: d.lastWind / sp, swing: (d.finale === 'breath' ? 180 : Math.max(120, Tn(n) * d.swing)) / sp, hold: H * 1000 / 60 / sp, H, T: 0 }; }
  const T = Tn(n) / sp, H = Math.max(1, Math.min(d.H(n), Math.floor(0.35 * Tn(n) / (1000 / 60)))), hold = H * 1000 / 60 / sp; let wind = T * d.wind, swing = T * d.swing;
  const room = T - hold; if (wind + swing > room) { const k = room / (wind + swing); wind *= k; swing *= k; }
  return { wind, swing: Math.max(swing, 50 / sp), hold, H, T };
}

// ---------- the plan: at fire the whole page is worked out on a saved copy and put back ----------
function planPage(g) {
  const P = api.P, s = P.snap(g), out = { ev: [], y0: P.made(g) };
  try {
    const q0 = (g.queue || []).slice();
    while (g.queue && g.queue.length && !g.over) {
      const h = P.queueHead(g); P.queueShift(g);
      if (h.kind === 'take') { P.synTake(g, h.o); out.ev.push({ k: 'R', id: h.id, y: P.made(g) }); for (let o = P.cascadeNext(g); o; o = P.cascadeNext(g)) { P.synTake(g, o, true); out.ev.push({ k: 's', id: o.id, y: P.made(g), n: g.casc }); } }
      else { if (h.kind === 'bank') P.bank(g); else P.waste(g, h.id); out.ev.push({ k: 'w', id: h.id, y: P.made(g) }); }
      if (out.ev.length > 80) break;
    }
    out.q0 = q0;
  } catch (e) { out.err = String(e && e.message); }
  P.back(g, s);
  out.N = out.ev.filter(e => e.k === 's').length; out.yEnd = out.ev.length ? out.ev[out.ev.length - 1].y : out.y0;
  return out;
}

// ---------- geometry helpers: world, screen and ink ----------
const _v = () => new T.Vector3();
function worldOf(mol, a, out) { const b = mol && mol.balls && mol.balls.get(a); if (!b) return null; return b.mesh.getWorldPosition(out || _v()); }
// where a point in the world lands on the paper along the line of sight, in the ink's pixels
function inkOf(p) { const c = api.cam.position, dx = p.x - c.x, dy = p.y - c.y, dz = p.z - c.z, t = -c.y / (dy || -1e-6); return api.px({ x: c.x + dx * t, z: c.z + dz * t }); }
function molWorldBox(mol) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; const v = _v(); mol.balls.forEach((b, a) => { if (a.el === 'H') return; b.mesh.getWorldPosition(v); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); z0 = Math.min(z0, v.z); z1 = Math.max(z1, v.z); }); return { x0, x1, z0, z1, w: Math.max(1, x1 - x0), d: Math.max(1, z1 - z0), cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 }; }
function molLocalBox(mol) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; mol.at.forEach((p, a) => { if (a.el === 'H' || !mol.balls.has(a)) return; x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }); return { x0, x1, z0, z1, w: Math.max(1, x1 - x0), d: Math.max(1, z1 - z0), cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 }; }
function inkBox(mol) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const v = _v(); mol.balls.forEach((b, a) => { if (a.el === 'H') return; b.mesh.getWorldPosition(v); const q = inkOf(v); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }); const pad = 26; return { l: x0 - pad, r: x1 + pad, t: y0 - pad, b: y1 + pad, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }; }
// ink pixels per screen pixel at the middle of the page
function inkPerScreen() { const a = new T.Vector3(-5, 0, 2).project(api.cam), b = new T.Vector3(5, 0, 2).project(api.cam), sw = Math.abs(b.x - a.x) / 2 * 1280; return 10 * api.U / Math.max(1, sw); }

// ---------- firing ----------
function fire(go) {
  const g = api.g(), st = api.st, d = D(), t = now();
  const plan = planPage(g);
  F.seq = { t0: t, plan, d, speed: 1, ev: 0, throwN: 0, steps: 0, lastN: plan.N, hits: [], nums: [], words: [], wordAt: {}, flagged: {}, tokens: [], shake: 0, shakeT: t, recoils: [], drops: [], settle: null, count: { shown: st.shown || plan.y0, from: st.shown || plan.y0, to: st.shown || plan.y0, t0: t, dur: 1, target: plan.y0, frozen: false }, tick: 0, zoom: 1, zoomT: 1, cam: { z: 1, tx: 0, tz: 0, fz: 1, ftx: 0, ftz: 0, mt0: 0, mdur: 1, from: null, to: null }, tally: 0, done: false, endAt: 0, fireT: t, start: null, finaleAt: 0, breath: null, lastHitT: 0, landed: false, drone: null, fk: 0, zA: 1, cxA: null };
  // the molecule as it stood, for the before and after (direction 3)
  try { const c = api.center(); F.seq.start = sketchOf(c); } catch (e) { F.seq.start = null; }
  st.sq = 0; st.pop = 0;
  F.seq.drops.push({ t, a: 0.012, ms: 200 });
  setTimeout(() => go(), 120);
}
// the heavy atoms and bonds of a molecule laid flat, in its own units, for a small drawing
function sketchOf(mol) { const pts = new Map(), bonds = []; mol.at.forEach((p, a) => { if (a.el !== 'H' && mol.balls.has(a)) pts.set(a, { x: p.x, z: p.z, el: a.el }); }); mol.model.bonds.forEach(b => { if (pts.has(b.a) && pts.has(b.b)) bonds.push([pts.get(b.a), pts.get(b.b), b.order || 1]); }); return { pts: Array.from(pts.values()), bonds }; }

// ---------- a reagent thrown at the molecule ----------
function throwThen(h, react) {
  const S = F.seq; if (!S) return react();
  const g = api.g(), d = S.d, i = S.throwN++, c = api.center(), sp = S.speed;
  const from = api.px({ x: api.STEP.x + g.pageSteps * api.STEPD, z: api.STEP.z });
  // the atoms it changes, on the molecule as it stands
  let tgt = null; try { const inv = new Map(); (h.o.map || new Map()).forEach((na, oa) => inv.set(na, oa)); const made = (h.o.r && h.o.r.made) || []; const v = _v(); let n = 0, sx = 0, sy = 0, sz = 0; made.forEach(a => { const oa = inv.get(a); if (oa && c.balls.has(oa)) { worldOf(c, oa, v); sx += v.x; sy += v.y; sz += v.z; n++; } }); if (n) tgt = new T.Vector3(sx / n, sy / n, sz / n); } catch (e) { tgt = null; }
  if (!tgt) { const b = molWorldBox(c); tgt = new T.Vector3(b.cx, 0.6, b.cz); }
  const dur = d.throwMs * (i === 2 && mode === 1 ? 1.15 : 1) / sp, col = api.colOf(h.id);
  const tok = { t0: now(), dur, from, tgt, col, i, id: h.id, arc: d.arc };
  S.tokens.push(tok);
  if (mode === 3) camTo(tgt, 1.6, Math.max(120, dur * 0.9));
  setTimeout(() => {
    S.tokens = S.tokens.filter(q => q !== tok);
    // impact: the change starts as the token touches
    const dir = (() => { const a = inkOf(tgt); const dx = a[0] - from[0], dy = a[1] - from[1], l = Math.hypot(dx, dy) || 1; return { x: dx / l, z: dy / l }; })();
    const W = molWorldBox(c).w, rec = (d.throwRec[Math.min(2, i)] || 0.03) * W;
    S.recoils.push({ t: now(), x: dir.x * rec, z: dir.z * rec, yaw: (i % 2 ? 1 : -1) * d.yaw * 0.5 * (i + 1) / 3, hz: d.recHz, z0: d.recZ });
    addShake(0.25 + 0.12 * i);
    if (mode === 1) S.drops.push({ t: now(), a: 0.008 + 0.006 * i, ms: 180 });
    snd('strike', i, mode === 1 ? 1.25 : mode === 2 ? 0.8 : 1);
    if (mode === 3) setTimeout(() => camTo(null, 1, 300), 200 / sp);
    react();
    { const y = P_made(), ct = S.count; if (d.count === 'race') ct.target = y; else { ct.from = ct.shown; ct.to = y; ct.t0 = now() + 80; ct.dur = 260; ct.ease = 'outQuart'; ct.target = y; } S.yDrop = now() + 80; }
  }, dur);
}

// ---------- each change on the molecule: called right after the page has built the new drawing ----------
function onReact(o, nm, prev, L, morph) {
  const S = F.seq; if (!S || !morph) return;
  const st = api.st, g = api.g(); st.sq = 0; st.pop = 0; st.shake = 0;
  // the new drawing is turned and moved, as one piece, to lie as close as it can on the old: only what changed moves
  try { if (!morph.bend && !(nm.at && nm.at.fold) && !(prev && prev.at && prev.at.fold)) align(nm, morph.from); } catch (e) { /* drawn as laid out */ }
  // runoff leaves as the art's runoff objects, kicked out and falling
  try { st.flyers.forEach(f => { if (f.feel) return; f.feel = true; f.kick = { x: (Math.random() - 0.5) * 0.6, z: -1 }; f.dur = (mode === 2 ? 420 : mode === 1 ? 480 : 560); dressFlyer(f); }); } catch (e) { /* plain flyer */ }
  if (!o.casc) { morph.feelEase = true; return; }
  const n = g.casc || 1, last = S.plan && n >= S.plan.N && S.plan.N > 0, ph = phases(n, last), d = S.d;
  S.steps = n; S.cur = { n, last, ph, t0: now(), kind: o.id }; F.log.push(['react', n, Math.round(now() - S.t0), Math.round(ph.wind), Math.round(ph.swing), Math.round(ph.hold)]);
  // the two atoms that join, on the new drawing
  const ids = o.atoms || [], mp = o.map || new Map(), A = mp.get(ids[0]), B = mp.get(ids[3] || ids[ids.length - 1]);
  S.cur.a = A && nm.balls.has(A) ? A : null; S.cur.b = B && nm.balls.has(B) ? B : null;
  // how far each atom travels this step, in the molecule's own units
  let maxT = 0; const W = molLocalBox(nm).w; morph.from.forEach((p, a) => { const q = nm.at.get(a); if (q && a.el !== 'H') maxT = Math.max(maxT, p.distanceTo(q)); });
  const back = clamp(d.draw(n) * W / Math.max(0.2, maxT), 0.05, 0.4) * (last ? 1.5 : 1);
  S.cur.W = W; S.cur.back = back;
  const held = last ? (d.finale === 'breath' ? breathMs() : d.fullDraw || 0) : 0;
  morph.slow = true; morph.s0 = 0; morph.ms = ph.wind + held + ph.swing;
  const wf = ph.wind / morph.ms, bf = (ph.wind + held) / morph.ms, pw = d.swingPow;
  morph.fk = K => { if (K < wf) return -back * E.outSine(K / wf); if (K < bf) return -back; const u = (K - bf) / Math.max(1e-6, 1 - bf); return -back + (1 + back) * Math.pow(u, pw); };
  if (morph.bend) morph.fk0 = morph.fk;
  // the camera
  if (d.cam === 'dive') { const p = S.cur.a ? worldOf(nm, S.cur.a) : null; const N = S.plan.N || n, late = N >= 6 && n >= N - 2, z = late ? 1.7 + 0.15 * (n - N + 2) : n >= 9 ? 1.15 : clamp(2.4 - (2.4 - 1.15) * (n - 1) / 7, 1.15, 2.4); camTo(p, last ? 2.0 : z, Math.max(120, ph.wind)); if (n > 1) snd('swish', Math.max(0.12, ph.wind / 1000)); }
  if (last && d.finale === 'breath') { S.breath = { t0: now() + ph.wind, ms: breathMs() }; S.count.frozen = true; }
  // a marker of the hand-off: the molecule takes over
  if (n === 1) snd('handoff');
  if (d.count === 'race') S.count.target = P_made();
  // the drone: one held voice per step, cut before the last step lands
  if (n >= d.droneFrom && !last) { const lvl = clamp((n - d.droneFrom) / 8, 0, 1); snd('drone', lvl, Math.floor((n - d.droneFrom) / (mode === 2 ? 2 : 3)), Math.max(0.15, (ph.T || 300) / 1000 + 0.05), d.droneLow ? 1 : 0); }
  if (mode === 2 && n >= 8 && !last) snd('draw', n, ph.wind / 1000);
}
function align(nm, from) {
  let n = 0, px = 0, pz = 0, qx = 0, qz = 0; const pr = []; from.forEach((q, a) => { const p = nm.at.get(a); if (!p || a.el === 'H') return; pr.push([p, q]); px += p.x; pz += p.z; qx += q.x; qz += q.z; n++; });
  if (n < 3) return; px /= n; pz /= n; qx /= n; qz /= n; let sn = 0, cs = 0; pr.forEach(([p, q]) => { const ax = p.x - px, az = p.z - pz, bx = q.x - qx, bz = q.z - qz; sn += ax * bz - az * bx; cs += ax * bx + az * bz; });
  const th = Math.atan2(sn, cs), c = Math.cos(th), si = Math.sin(th);
  nm.at.forEach(p => { const x = p.x - px, z = p.z - pz; p.x = qx + x * c - z * si; p.z = qz + x * si + z * c; });
}
const breathMs = () => Math.min(520, 80 + 40 * ((F.seq && F.seq.plan.N) || 6));
const P_made = () => { try { return api.P.made(api.g()); } catch (e) { return 0; } };
function dressFlyer(f) {
  if (!AA.rxKit || !AA.rxKit.build || !f.grp) return; const key = f.kind === 'water' ? 'ro_water' : f.kind === 'h2' ? 'ro_h2' : f.kind === 'co2' ? 'ro_co2' : null; if (!key) return;
  const inner = new T.Group(); if (!AA.rxKit.build(key, T, inner, new T.Color(0xffffff))) return;
  const bb = new T.Box3().setFromObject(inner), sz = bb.getSize(new T.Vector3()), k = 1.5 / Math.max(sz.x, sz.y, sz.z, 0.01);
  inner.scale.setScalar(k); inner.position.set(-(bb.min.x + bb.max.x) / 2 * k, -(bb.min.y + bb.max.y) / 2 * k, -(bb.min.z + bb.max.z) / 2 * k); inner.rotation.x = -0.8;
  f.grp.children.slice().forEach(ch => { ch.visible = false; }); f.grp.add(inner); f.ro = inner;
}

// the curve a reflex step's atoms follow from where they stood to where they go: wind-up, then a fast committed swing
function k(K, morph) { if (morph.fk) return morph.fk(K); return K; }
// a reagent's change: quick with a small overshoot
function ease(u) { return u <= 0 ? 0 : u >= 1 ? 1 : E.outBack(u, 1.4); }

// ---------- the hit: called on the frame a step's atoms arrive ----------
function hit(morph, t) {
  const S = F.seq; if (!S || !S.cur) return; const c = S.cur, d = S.d, n = c.n, st = api.st, nm = morph.m;
  c.hitT = t; S.lastHitT = t; S.hitN = n; F.log.push(['hit', n, Math.round(t - S.t0)]);
  // what moved, and how far: the overshoot carries on past the end along the same path and rings down
  const vecs = new Map(); morph.from.forEach((p, a) => { const q = nm.at.get(a); if (q) { const dv = q.clone().sub(p); if (dv.length() > 0.02) vecs.set(a, dv); } });
  S.settle = { m: nm, vecs, t0: t + c.ph.hold, hold: c.ph.hold, ov: d.ov * (c.last ? 1.6 : 1), hz: d.settleHz, z: d.settleZ, a: c.a, b: c.b, ms: 700 };
  // the rest of the molecule is knocked the other way and turns, as one piece
  let dir = { x: 0, z: 1 }; if (c.b && vecs.get(c.b)) { const v = vecs.get(c.b); const l = Math.hypot(v.x, v.z) || 1; dir = { x: v.x / l, z: v.z / l }; }
  const wsc = (api.center().group.scale.x || 1), W = c.W * wsc, rec = d.recoil(n) * W * (c.last ? 2.6 : 1);
  S.recoils.push({ t: t + c.ph.hold, x: -dir.x * rec, z: -dir.z * rec, yaw: (n % 2 ? 1 : -1) * d.yaw * (0.5 + 0.5 * Math.min(1, n / 8)) * (c.last ? 2.2 : 1), hz: d.recHz, z0: d.recZ });
  // the page
  if (n > 2 || c.last) addShake(0.25 + 0.03 * n + (c.last ? 0.4 : 0));
  const dropA = c.last && d.landDrop ? d.landDrop : d.drop(n) * (c.last ? 2.2 : 1); if (dropA > 0) S.drops.push({ t, a: dropA, ms: d.dropMs || 260 });
  if (mode === 2) S.cam.push = Math.min(0.18, 0.015 * n);
  // sound on the frame of contact; the bell rings through the freeze
  const fast = mode === 2 && (c.ph.T || 999) < 200;
  snd('reflex', c.kind, n, { bell: d.bell * (c.last ? 1.4 : 1), fast, echo: d.echo, last: c.last });
  if (n >= d.snapFrom || c.last) snd('snap', n, d.snapW * (c.last ? 1.5 : 1));
  if (c.last) snd('boom', mode);
  // the numeral and the gain are born at the join after the freeze
  const gain = P_made() - (S.count.target || 0), y = P_made();
  setTimeout(() => { spawnNumeral(n, gain, y, c); }, c.ph.hold);
  if (mode === 2) S.tally = n;
  st.shake = 0; st.sq = 0; st.pop = 0; st.hold = 0;
  if (c.last) { S.finaleAt = t; }
}
function spawnNumeral(n, gain, y, c) {
  const S = F.seq; if (!S) return; const t = now(), d = S.d;
  const T0 = (c.ph.T || 600); const holdMs = c.last ? 150 : T0 < 400 / S.speed ? 0 : 250;
  const num = { n, gain, y, t, hold: holdMs, fly: 160, join: c.a || c.b, last: c.last, w: d.numW(n), arrived: false };
  S.nums.push(num);
  if (d.count === 'race') { S.count.target = y; if (c.last) { setTimeout(() => land(y), 0); } }
  else setTimeout(() => arrive(num), holdMs + num.fly);
}
// the gain arrives at the yield: the count takes it
function arrive(num) {
  const S = F.seq; if (!S) return; num.arrived = true; const ct = S.count, t = now();
  ct.from = ct.shown; ct.to = num.y; ct.t0 = t; ct.dur = Math.min(400, 0.8 * Math.max(200, num.last ? 500 : Tn(num.n))) / S.speed; ct.ease = 'outQuart'; ct.target = num.y;
  S.yDrop = t;
  if (num.last) S.landed = t + ct.dur;
}
// direction 2: after the held breath the yield jumps the rest of the way at once
function land(y) { const S = F.seq; if (!S) return; const ct = S.count, t = now(); ct.frozen = false; ct.from = ct.shown; ct.to = y; ct.t0 = t; ct.dur = 250; ct.ease = 'back'; ct.target = y; S.landed = t + 250; S.yDrop = t; }

function addShake(a) { const S = F.seq; if (!S) return; decayShake(); S.shake = Math.min(0.9, S.shake + a); }
function decayShake() { const S = F.seq, t = now(); S.shake = Math.max(0, S.shake - (t - S.shakeT) / 1000 * 1.0); S.shakeT = t; }

// ---------- the camera ----------
// target: a world point to look at (null: the molecule), z: how close (1 is the rest framing), ms: how long the move takes
function camTo(target, z, ms) { const S = F.seq; if (!S) return; const c = S.cam; c.from = { z: c.z, tx: c.tx, tz: c.tz }; c.to = { z, p: target ? target.clone() : null }; c.mt0 = now(); c.mdur = Math.max(120, ms || 300); }

// ---------- what the page asks between things ----------
// how long until the next thing starts, after a change has begun
function unlock(o, L) {
  const S = F.seq; if (!S) return L.unlock; const d = S.d, sp = S.speed, plan = S.plan; S.ev++;
  const next = plan.ev[S.ev];
  if (o.casc) { const c = S.cur; if (!c) return L.unlock; F.log.push(['unlock', c.n, Math.round(Math.max(c.ph.wind + c.ph.swing + c.ph.hold, Tn(c.n) / sp)), Math.round(L.unlock)]); if (c.last) return c.ph.wind + c.ph.swing + c.ph.hold + 600; return Math.max(c.ph.wind + c.ph.swing + c.ph.hold + 40, Tn(c.n) / sp); }
  // after a reagent: the next throw, or the first reflex after a breath
  if (next && next.k === 's') return Math.max(L.unlock, d.firstWait / sp);
  return Math.max(120, (d.throwGap - d.throwMs) / sp + 60);
}
// the page has nothing left to do: hold until everything has landed and been written, then turn
function pageEnd(next) {
  const S = F.seq; if (!S) return next(); S.done = true; S.endAt = now(); const d = S.d, tok = api.st.tok, fin = P_made();
  if (!S.steps) { const ct = S.count; ct.target = fin; ct.frozen = false; ct.from = ct.shown; ct.to = fin; ct.t0 = now(); ct.dur = 350; ct.ease = 'outQuart'; S.landed = now() + 350; }
  const wait = () => {
    if (!F.seq || api.st.tok !== tok) return;
    const t = now(), busy = Math.round(S.count.shown) !== Math.round(fin) || S.nums.some(q => !q.gone) || (S.landed && t < S.landed) || (S.wordBusy || 0) > t;
    if (busy && t - S.endAt < 9000) return setTimeout(wait, 40);
    if (!S.restT) { S.restT = t; if (mode === 3) camTo(null, 1, 600); }
    if (!S.finalWords) { S.finalWords = true; const hold = finalWords(); if (hold) return setTimeout(wait, hold); }
    if (!S.lastT) S.lastT = t;
    const left = (S.skip ? 120 : d.hold / S.speed) - (t - S.lastT); if (left > 0) return setTimeout(wait, Math.min(left, 50));
    finish(); next();
  };
  setTimeout(wait, 40);
}
// the overreact word always lands last: after the final hit has landed, a moment of silence, then it is written
// (direction 3: the camera pulls back to the whole page first and holds a second in silence)
function finalWords() {
  const S = F.seq, vals = flagVals(); if (!vals.length) return 0; const fin = P_made(), k4 = vals.length >= 4 && fin >= vals[3];
  if (mode === 3 && S.start) S.sketchT = now() + 300;
  if (k4 && !S.words.some(w => w.k === 3)) { const pre = mode === 3 ? 900 : 250; setTimeout(() => { if (F.seq === S) { writeWord(3); S.wordBusy = now() + 340; snd('flag', 4); } }, pre); return pre + 340; }
  return mode === 3 ? 700 : 0;
}
function finish() { const st = api.st, S = F.seq; st.want = P_made(); st.shown = st.want; F.seq = null; S && (S.dead = true); }

// ---------- flags and words ----------
function flagVals() { const st = api.st; if (!st.quota) return []; return [st.quota].concat(api.P.runMarks(st.quota)); }
function writeWord(k) { const S = F.seq; if (!S || S.words.some(w => w.k === k)) return; S.words.push({ k, t: now() }); S.wordBusy = now() + 260; }
function passFlag(k, final) {
  const S = F.seq; if (S.flagged[k]) return; S.flagged[k] = now(); api.st.passT[k] = now();
  const fl = api.st.flags3 && api.st.flags3[k]; if (fl) S.poles = (S.poles || []).concat([{ k, t: now() }]);
  if (k === 3 && !final) { snd('flagSoft', 4); return; }
  if (k === 3) return; // written in finalWords
  // two flags passed together fire in order
  const last = Object.values(S.flagged).filter(v => v && now() - v < 300).length - 1, delay = Math.max(0, last) * (mode === 2 ? 180 : 280);
  setTimeout(() => { if (F.seq !== S) return; snd('flag', k + 1); writeWord(k); }, delay + (mode === 3 ? 150 : 0));
  if (mode === 3) { S.count.holdTill = now() + 260; }
}

// ---------- every frame ----------
function frame(t, dt) {
  const S = F.seq; if (!S || !api) return; const st = api.st, c = api.center(), d = S.d; if (!c) return; api.dirty();
  st.sq = 0; st.pop = 0; st.shake = 0; st.flash = 0;
  // the count
  const ct = S.count; let shown = ct.shown;
  if (d.count === 'race' && !ct.frozen && ct.ease !== 'back') {
    const n = Math.max(1, S.steps || 1), rate = 3 * Math.pow(2, (n - 1) / 3), dv = ct.target - shown; if (Math.abs(dv) < 1) shown = ct.target; else shown += dv * Math.min(1, dt * rate);
  } else if (ct.holdTill && t < ct.holdTill) { ct.t0 += dt * 1000; } else if (!ct.frozen) {
    const u = clamp((t - ct.t0) / Math.max(1, ct.dur), 0, 1), e = ct.ease === 'back' ? E.outBack(u, 2.0) : E.outQuart(u); shown = ct.from + (ct.to - ct.from) * e; if (u >= 1) shown = ct.to;
  }
  if (Math.round(shown) !== Math.round(ct.shown) && t - S.tick > 45 / S.speed) { S.tick = t; snd('tick', S.steps || 0); }
  ct.shown = shown; st.shown = Math.round(shown); st.want = Math.max(st.want || 0, Math.round(shown));
  // flags passed by the count
  const vals = flagVals(); vals.forEach((v, k) => { if (!S.flagged[k] && st.shown >= v) passFlag(k, S.done || (S.cur && S.cur.last && S.finaleAt)); });
  // the molecule: framed large in the free part of the page for the action, knocked and turned as one piece
  // two free boxes: the whole width above the left column, or the part right of it reaching lower; the one that frames it larger
  const sc0 = c.group.scale.x, gp = c.group.position.clone(), wb = molWorldBox(c), lw = wb.w + 2.4, ld = wb.d + 2.4, zmax = d.zoomMax * (mode === 2 ? 1 + Math.min(0.25, 0.022 * (S.steps || 0)) : 1);
  const fitIn = B => Math.min((B.x1 - B.x0) / lw, (B.z1 - B.z0) / ld, zmax), zW = fitIn(F.BOXW), zR = fitIn(F.BOX), BOX = zW > zR ? F.BOXW : F.BOX;
  const zA = clamp(Math.max(zW, zR), 0.7, 2.4);
  S.zA += (zA - S.zA) * Math.min(1, dt / 0.18); if (S.zA > zA) S.zA = zA;
  const kIn = E.inOutCubic(clamp((t - S.t0) / 450, 0, 1)), kOut = S.restT ? E.inOutSine(clamp((t - S.restT) / 600, 0, 1)) : 0, fk = kIn * (1 - kOut); S.fk = fk;
  const Z = 1 + (S.zA - 1) * fk, s1 = sc0 * Z, tcx = wb.cx + ((BOX.x0 + BOX.x1) / 2 - wb.cx) * fk, tcz = wb.cz + ((BOX.z0 + BOX.z1) / 2 - wb.cz) * fk;
  const px0 = tcx - Z * (wb.cx - gp.x), pz0 = tcz - Z * (wb.cz - gp.z); S.zoom = Z;
  c.group.scale.setScalar(s1);
  // recoil
  let rx = 0, rz = 0, ry = 0; S.recoils = S.recoils.filter(r => { const s = (t - r.t) / 1000; if (s > 2.5) return false; if (s < 0) return true; const kk = kick(s, r.hz, r.z0); rx += r.x * kk; rz += r.z * kk; ry += r.yaw * Math.PI / 180 * kk; return true; });
  let sy = 0; if (mode === 1 && S.lastHitT) { const s = (t - S.lastHitT) / 1000; sy = -0.9 * Math.min(1, 0.3 + 0.07 * (S.hitN || 1)) * (s < 0.05 ? s / 0.05 : Math.max(0, ring(s - 0.05, 3.5, 0.5))); }
  c.group.position.set(px0 + rx, 0.25 + sy, pz0 + rz); c.group.rotation.set(0, ry, 0);
  // the joined group: a tremor through the freeze, then the overshoot rings down
  const se = S.settle; if (se && se.m === c) {
    const s = (t - se.t0) / 1000, W = S.cur ? S.cur.W : 10;
    if (t < se.t0 || s < se.ms / 1000) {
      const trem = t < se.t0 ? 0.008 * W * Math.sin((t - (se.t0 - se.hold)) / 1000 * 2 * Math.PI * 30) : 0, ab = se.a && se.b ? c.at.get(se.b).clone().sub(c.at.get(se.a)).normalize() : null;
      const r = t < se.t0 ? 0 : ring(s, se.hz, se.z) - 0, amt = t < se.t0 ? 0 : se.ov * r;
      api.layout(c, a => { const p = c.at.get(a), v = se.vecs.get(a), out = (F._p || (F._p = new T.Vector3())).copy(p); if (v && amt) out.addScaledVector(v, amt); if (trem && ab && (a === se.a || a === se.b)) out.addScaledVector(ab, a === se.a ? trem : -trem); return out; }, null);
    } else { api.layout(c, a => c.at.get(a), null); S.settle = null; }
  }
  // the camera: rest, the page dip and drop, the push or the dive, and the shake
  const cam = api.cam, CAM = api.CAM, LOOK = api.LOOKAT; let ox = 0, oz = 0;
  S.drops = S.drops.filter(q => { const s = t - q.t; if (s > q.ms * 2.4) return false; if (s < 0) return true; const W = molWorldBox(c).w; const u = s < 60 ? E.outCubic(s / 60) : Math.max(0, 1 - E.outBack(clamp((s - 60) / q.ms, 0, 1), 1.2)); oz -= q.a * W * u; return true; });
  decayShake(); const sh = S.shake * S.shake * d.shakeGain, Wd = molWorldBox(c).w * d.shakePeak; ox += sh * Wd * nz(t / 1000 * d.shakeHz * 6.283 / 4, 1.3); oz += sh * Wd * nz(t / 1000 * d.shakeHz * 6.283 / 4, 4.1);
  // the page never moves so far that its edge shows
  ox = clamp(ox, -2.2, 2.2); oz = clamp(oz, -3.2, 2.4);
  let look = LOOK.clone(), dist = 1;
  if (false && d.cam === 'push') { const pk = S.done && S.restT ? 0 : Math.min(0.18, 0.015 * (S.steps || 0)), want = S.breath && t > S.breath.t0 ? pk : pk; S.cam.pz = (S.cam.pz || 0) + (want - (S.cam.pz || 0)) * Math.min(1, dt * (S.landed ? 4 : 6)); dist = 1 - S.cam.pz; const b = molWorldBox(c); look.x += (b.cx - look.x) * S.cam.pz * 2; look.z += (b.cz - look.z) * S.cam.pz * 2; }
  if (d.cam === 'dive' || mode === 3) { const cm = S.cam; if (cm.to) { const u = E.inOutCubic(clamp((t - cm.mt0) / cm.mdur, 0, 1)), b = molWorldBox(c), tp = cm.to.p ? cm.to.p.clone().add(new T.Vector3(0, 0, 3.2 / Math.max(1, cm.to.z))) : new T.Vector3(b.cx, 0, b.cz), mid = { x: b.cx + (tp.x - b.cx) * 0.75, z: b.cz + (tp.z - b.cz) * 0.75 }; cm.z = cm.from.z + (cm.to.z - cm.from.z) * u; const fx = cm.from.tx, fz = cm.from.tz; cm.tx = fx + (mid.x - LOOK.x - fx) * u; cm.tz = fz + (mid.z - LOOK.z - fz) * u; if (cm.to.z === 1 && !cm.to.p) { cm.tx = fx * (1 - u); cm.tz = fz * (1 - u); } } dist = 1 / Math.max(1, cm.z); const Zc = Math.max(1, cm.z); look.x = clamp(look.x + cm.tx, -26 + 26 / Zc, 26 - 26 / Zc); look.z = clamp(look.z + cm.tz, -18 + 18.6 / Zc, 15 - 14.4 / Zc); }
  const off = CAM.clone().sub(LOOK).multiplyScalar(dist);
  cam.position.set(look.x + off.x + ox, look.y + off.y, look.z + off.z + oz); cam.lookAt(look.x + ox, look.y, look.z + oz);
  // the yield flags on the track: the pole jolts back and rings when its flag fills
  (S.poles || []).forEach(p => { const fl = st.flags3 && st.flags3[p.k]; if (!fl || !fl.on) return; const s = (t - p.t) / 1000, lean = (mode === 1 ? 0.105 : 0.06) * ring(s, mode === 1 ? 2.5 : 3.3, 0.25) * (s < 1.5 ? 1 : 0); fl.on.rotation.z = lean; });
  if (AA.rxFeel.probe) { const pj = v => { const p = v.clone().project(cam); return [Math.round((p.x + 1) * 640), Math.round((1 - p.y) * 360)]; }, cu = S.cur, wbx = molWorldBox(c), mc = new T.Vector3(wbx.cx, 0.6, wbx.cz);
    const row = { t: Math.round(t - S.t0), n: cu ? cu.n : 0, Z: +S.zoom.toFixed(3), c: pj(mc), rec: pj(mc.clone().sub(new T.Vector3(rx, 0, rz))), cam: [Math.round(ox * 24.4), Math.round(oz * 24.4)], shown: Math.round(S.count.shown) };
    if (cu && cu.a && c.balls.has(cu.a)) row.a = pj(worldOf(c, cu.a)); if (cu && cu.b && c.balls.has(cu.b)) row.b = pj(worldOf(c, cu.b)); row.w = (() => { let x0 = 1e9, x1 = -1e9; c.balls.forEach((bb, a) => { if (a.el === 'H') return; const q = pj(bb.mesh.getWorldPosition(new T.Vector3())); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); }); return x1 - x0; })(); F.probeRows.push(row); }
  // runoff: kicked out from where it left, falling under gravity to where it is kept, and landing
  st.flyers.forEach(f => { if (!f.feel || !f.t0 || !f.to) return; const age = t - f.t0; if (age < 0) return; const u = clamp(age / f.dur, 0, 1), g0 = mode === 1 ? 1.4 : mode === 2 ? 0.7 : 1.0, from = f.from, to = f.to; const x = from.x + (to.x - from.x) * u, z = from.z + (to.z - from.z) * u - Math.sin(u * Math.PI) * (2.2 + 2 * g0) * (1 - u * 0.3), y = from.y + (to.y - from.y) * u + Math.sin(u * Math.PI) * 2.0; f.grp.position.set(x, y, z); f.grp.rotation.set(0, 0, 0); f.grp.scale.setScalar(Math.max(0.6, api.st.sc) * 2.0 / Math.max(1, (S.cam && S.cam.z) || 1)); if (u >= 1 && !f.clinked) { f.clinked = true; snd('clink', (S.runoffN = (S.runoffN || 0) + 1), mode); } });
}

// ---------- the ink: the count, the step numerals, the gains, the words, the throw, the tally ----------
function ink(x, t) {
  const S = F.seq; if (!S || !api) return; const st = api.st, c = api.center(), d = S.d, ips = inkPerScreen();
  const Y = api.px(api.MADE);
  // the yield: set down on each hit (never scaled), green once the spec is met
  { const dropT = S.yDrop ? (t - S.yDrop) / 1000 : 9, dy = dropT < 0.5 ? (mode === 1 ? 10 : 6) * ips * kick(dropT, 5, 0.45) : 0, txt = api.fmt(st.shown), beaten = st.quota && st.shown >= st.quota;
    const big = 112 + Math.min(28, 7 * Object.keys(S.flagged).length); api.marker(x, big); let sz = big; const w = x.measureText(txt).width; if (w > 420) sz = big * 420 / w; api.marker(x, sz);
    x.textAlign = 'left'; x.fillStyle = beaten ? api.GREEN : api.INK; x.fillText(txt, Y[0], Y[1] + dy); st.madeW = x.measureText(txt).width; }
  // tokens in flight
  S.tokens.forEach(tk => { const u = clamp((t - tk.t0) / tk.dur, 0, 1), e = E.inQuad(u), B = inkOf(tk.tgt), A = tk.from, lift = tk.arc * ips * 4 * u * (1 - u), cx = A[0] + (B[0] - A[0]) * e, cy = A[1] + (B[1] - A[1]) * e - lift, r = 26 * ips * (1 - 0.25 * u);
    x.save(); x.fillStyle = 'rgb(' + tk.col.join(',') + ')'; x.strokeStyle = api.INK; x.lineWidth = 5; x.beginPath(); x.ellipse(cx, cy, r, r * 0.86, 0, 0, 6.3); x.fill(); x.stroke(); x.restore(); });
  // numerals and gains: written outside the molecule's outline on the line from its middle through the join
  const bx = c ? inkBox(c) : null, lim = [api.px({ x: -6, z: 0 })[0], api.px({ x: 23.5, z: 0 })[0]], latest = S.nums[S.nums.length - 1];
  S.nums.forEach((q, qi) => {
    const age = t - q.t; if (age < 0 || !bx) return; const nx = S.nums[qi + 1], fade = nx ? (t >= nx.t ? 1 : 0) : S.done && S.restT ? clamp((t - S.restT) / 300, 0, 1) : 0;
    const room = (Y[1] - 100 * ips) - (bx.b + 14 * ips), sz = Math.max(40 * ips, Math.min(Math.min(190, 42 + 11 * q.n) * ips * (mode === 3 ? 1.3 : 1) * (q.last ? 1.3 : 1), room / 0.74)), wr = clamp(age / 70, 0, 1);
    { if (q.jx == null) { let jx = bx.cx; if (q.join && c.balls.has(q.join)) jx = inkOf(worldOf(c, q.join))[0]; q.jx = clamp(jx, lim[0] + sz * 0.6, lim[1] - sz * 0.6); } q.at = [q.jx, Math.max(q.at ? q.at[1] : 0, bx.b + 14 * ips + sz * 0.74)]; q.nw = AA.rxPen.measure(String(q.n), sz, 'heavy').width; }
    if (fade < 1) { x.save(); x.globalAlpha = 1 - fade; AA.rxPen.write(x, String(q.n), q.at[0], q.at[1], sz, { weight: 'heavy', color: api.INK, align: 'center', t: wr, extra: q.w > 2 ? (q.w - 2) * 1.8 : 0 }); x.restore(); }
    if (q.gain > 0 && d.count !== 'race') { const gsz = Math.max(40 * ips, Math.min(sz * 0.62, 90 * ips)), ft = age - q.hold, u = clamp(ft / q.fly, 0, 1); if (u >= 1 && mode !== 3) { q.gone = true; return; } if (mode === 3) { const u3 = clamp(ft / 420, 0, 1); if (u3 >= 1) { q.gone = true; return; } x.save(); x.globalAlpha = 1 - E.inCubic(Math.max(0, u3)); AA.rxPen.write(x, '+' + api.fmt(q.gain), q.at[0] + q.nw / 2 + 24 * ips, q.at[1], gsz, { weight: 'heavy', color: api.INK, align: 'left', t: clamp(age / 80, 0, 1) }); x.restore(); return; }
      const e = E.inCubic(Math.max(0, u)), A = [q.at[0] + q.nw / 2 + 24 * ips + AA.rxPen.measure('+' + api.fmt(q.gain), gsz, 'heavy').width / 2, q.at[1]], B = [Y[0] + (st.madeW || 200) * 0.5, Y[1] - 70 * ips], cx = A[0] + (B[0] - A[0]) * e, cy = A[1] + (B[1] - A[1]) * e - 50 * ips * Math.sin(Math.PI * Math.max(0, u));
      x.save(); AA.rxPen.write(x, '+' + api.fmt(q.gain), cx, cy, gsz * (1 - 0.25 * e), { weight: 'heavy', color: api.INK, align: 'center', t: clamp(age / 80, 0, 1) }); x.restore(); } else q.gone = true; });
  // direction 2: a tally in the margin, one stroke per step, bundled in fives
  if (mode === 2 && S.tally) { const o = api.px({ x: 9.5, z: 9.6 }), h = 64 * ips, gap = 16 * ips; x.save(); x.strokeStyle = api.INK; x.lineCap = 'round'; x.lineWidth = 6; for (let i = 0; i < S.tally; i++) { const b = Math.floor(i / 5), j = i % 5, x0 = o[0] + b * (5 * gap + 34 * ips) + j * gap; x.beginPath(); if (j < 4) { x.moveTo(x0, o[1]); x.lineTo(x0 + 3, o[1] - h); } else { const xb = o[0] + b * (5 * gap + 34 * ips); x.moveTo(xb - 10, o[1] - h * 0.2); x.lineTo(xb + 4 * gap + 10, o[1] - h * 0.8); } x.stroke(); } x.restore(); }
  // the words, each written once and kept: one line with the yield, the newest the largest
  if (S.words.length) { let xx = Y[0] + (st.madeW || 300) + 46 * ips; const ws = S.words.slice().sort((a, b) => a.k - b.k), top = ws[ws.length - 1];
    const top3 = ws.filter(w => w.k < 3), tk = top3[top3.length - 1];
    ws.forEach(w => { const u = clamp((t - w.t) / (w.k === 3 ? 140 : 150), 0, 1);
      if (w.k === 3) { const o = api.px({ x: mode === 3 ? 2 : 6, z: 3.6 }); AA.rxPen.write(x, WORDS[3], o[0], o[1], WSZ[3] * ips, { weight: 'heavy', color: api.INK, align: 'center', t: u }); return; }
      const base = WSZ[w.k] * d.wordK * ips * (w === tk ? 1 : 0.6); AA.rxPen.write(x, WORDS[w.k], xx, Y[1], base, { weight: 'heavy', color: api.GREEN, align: 'left', t: u }); xx += AA.rxPen.measure(WORDS[w.k], base, 'heavy').width + 24 * ips; }); }
  // direction 3: the molecule as it stood, drawn small beside the finished one
  if (mode === 3 && S.sketchT && S.start) { const u = clamp((t - S.sketchT) / 600, 0, 1), sk = S.start, o = api.px({ x: 21, z: 2.4 }); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; sk.pts.forEach(p => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }); const s = Math.min(340 / Math.max(1, x1 - x0), 150 / Math.max(1, z1 - z0)), m = p => [o[0] + (p.x - (x0 + x1) / 2) * s, o[1] + (p.z - (z0 + z1) / 2) * s];
    x.save(); x.strokeStyle = api.PENCIL; x.lineWidth = 4; x.lineCap = 'round'; const nb = Math.floor(sk.bonds.length * u); sk.bonds.slice(0, nb).forEach(b => { const A = m(b[0]), B = m(b[1]); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); }); x.fillStyle = api.REDINK; sk.pts.forEach((p, i) => { if (p.el === 'O' && i / sk.pts.length <= u) { const q = m(p); x.beginPath(); x.arc(q[0], q[1], 6, 0, 6.3); x.fill(); } }); x.restore(); }
}

// ---------- a click while it plays: twice as fast ----------
function onClick() { const S = F.seq; if (!S) return; if (S.done) { S.skip = true; return; } S.speed = 2; }
try { root.addEventListener('pointerdown', onClick, true); root.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') onClick(); }, true); } catch (e) { /* no window */ }

AA.rxFeel = {
  DIR, WORDS,
  attach(a) { api = a; T = a.T; return AA.rxFeel; },
  on, owns: () => on() && !!F.seq,
  get mode() { return mode; },
  set(n) { mode = Math.max(0, Math.min(3, n | 0)); try { root.localStorage.setItem(KEY, String(mode)); } catch (e) { /* storage blocked */ } return mode; },
  fire, throwThen, onReact, hit, k, ease, unlock, pageEnd, frame, ink, Tn, phases,
  stepMs: n => Tn(n), log: F.log, probeRows: F.probeRows, probe: false,
  state: () => F.seq && { steps: F.seq.steps, N: F.seq.plan.N, shown: F.seq.count.shown, zoom: F.seq.zoom, shake: F.seq.shake, words: F.seq.words.map(w => w.k), speed: F.seq.speed, done: F.seq.done, plan: F.seq.plan.ev.map(e => e.k + (e.n || '')).join('') }
};
})(typeof globalThis !== 'undefined' ? globalThis : window);
