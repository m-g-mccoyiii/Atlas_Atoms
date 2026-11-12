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
// The owner's mix of 2 and 3 (11 November): 3's choreography and sound, 2's jolt of the page, a camera that never crops the molecule.
// The new pace: each thing is seen forming (wind-up, change, a settle at rest) and a breath of nothing between steps.
const NEWPACE = { T1: 800, r: 0.92, Tmin: 420, gap: 150, wind: 0.26, swing: 0.2, ov: 0.08, settleHz: 6, settleZ: 0.62, firstWait: 350, fitM: 0.78 };
const JOLT = { shakeGain: 1.1, shakeHz: 18, shakePeak: 0.03, drop: () => 0.02, dropMs: 200 };
DIR[3].fitM = 0.78; DIR[3].base = 3; DIR[3].throwZ = 1.6;
DIR[4] = Object.assign({}, DIR[3], NEWPACE, JOLT, { name: 'steady', cam: 'steady', panK: 0.06, zoomMax: 1.3, lastZ: 1.8, panLast: 0.1, throwZ: 0 });
DIR[5] = Object.assign({}, DIR[3], NEWPACE, JOLT, { name: 'half', cam: 'half', panK: 0.08, zoomMax: 1.3, zHalf: [1.4, 1.2], lastZ: 1.45, throwZ: 1.2, pullAfter: true });
DIR[6] = Object.assign({}, DIR[3], NEWPACE, JOLT, { name: 'wide-then-close', cam: 'late', panK: 0.08, zoomMax: 1.3, count: 'race', lastZ: 2.0, late: [1.7, 1.85, 2.0], droneFrom: 4, throwZ: 0 });
const WORDS = ['stable', 'unstable', 'volatile', 'overreact'], WSZ = [54, 64, 76, 130];

let mode = 0;
try { const q = new URLSearchParams(root.location.search).get('feel'); if (q !== null && q !== '') mode = Math.max(0, Math.min(6, +q || 0)); else { const s = root.localStorage.getItem(KEY); if (s !== null) mode = Math.max(0, Math.min(6, +s || 0)); else mode = 3; } } catch (e) { mode = 3; }

let api = null, T = null;
const F = { log: [], probeRows: [], seq: null, BOX: { x0: -11.5, x1: 25, z0: -17.2, z1: -1.4 }, BOXW: { x0: -23.5, x1: 25, z0: -17.4, z1: -4.8 } };
let PACE = null; try { PACE = new URLSearchParams(root.location.search).get('pace'); } catch (e) { PACE = null; }
const PACES = { 1: { T1: 1900, r: 0.93, Tmin: 650, gap: 220, lastWind: 1100, fullDraw: 450, kindBeat: 320 }, 2: { T1: 1500, r: 0.91, Tmin: 500, gap: 150, lastWind: 900, fullDraw: 350, kindBeat: 250 }, 3: { T1: 700, r: 0.9, Tmin: 360, gap: 100, lastWind: 500, fullDraw: 150, kindBeat: 150 } };
if (!PACES[PACE] && PACE !== 'new' && PACE !== '0') PACE = '2';
const D = () => { const d = DIR[mode] || DIR[1]; if (PACES[PACE]) return Object.assign({}, d, NEWPACE, PACES[PACE]); return PACE === 'new' && !d.gap ? Object.assign({}, d, NEWPACE) : d; };
const B3 = () => ((DIR[mode] || {}).base || mode) === 3, SM = () => (DIR[mode] || {}).base || mode;
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
  out.N = out.ev.reduce((m, e) => (e.k === 's' ? Math.max(m, e.n || 0) : m), 0) || out.ev.filter(e => e.k === 's').length; out.yEnd = out.ev.length ? out.ev[out.ev.length - 1].y : out.y0;
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
function inkAtScreen(sx, sy) { const v = new T.Vector3(sx / 1280 * 2 - 1, -(sy / 720 * 2 - 1), 0.5).unproject(api.cam), c = api.cam.position, dy = v.y - c.y, t = -c.y / (dy || -1e-6); return api.px({ x: c.x + (v.x - c.x) * t, z: c.z + (v.z - c.z) * t }); }
function inkPerScreen() { const a = new T.Vector3(-5, 0, 2).project(api.cam), b = new T.Vector3(5, 0, 2).project(api.cam), sw = Math.abs(b.x - a.x) / 2 * 1280; return 10 * api.U / Math.max(1, sw); }

// ---------- firing ----------
function fire(go) {
  const g = api.g(), st = api.st, d = D(), t = now();
  const plan = planPage(g);
  F.seq = { t0: t, plan, d, speed: 1, ev: 0, throwN: 0, steps: 0, lastN: plan.N, hits: [], nums: [], words: [], wordAt: {}, flagged: {}, tokens: [], shake: 0, shakeT: t, recoils: [], drops: [], settle: null, count: { shown: st.shown || plan.y0, from: st.shown || plan.y0, to: st.shown || plan.y0, t0: t, dur: 1, target: plan.y0, frozen: false }, tick: 0, zoom: 1, zoomT: 1, cam: { z: 1, tx: 0, tz: 0, fz: 1, ftx: 0, ftz: 0, mt0: 0, mdur: 1, from: null, to: null }, tally: 0, done: false, endAt: 0, fireT: t, start: null, finaleAt: 0, breath: null, lastHitT: 0, landed: false, drone: null, fk: 0, zA: 1, cxA: null };
  // the molecule as it stood, for the before and after (direction 3)
  try { const c = api.center(); F.seq.start = sketchOf(c); } catch (e) { F.seq.start = null; }
  st.sq = 0; st.pop = 0; mus('state', 'chain'); F.seq.swT = d.cam === 'half' ? 0.94 : d.cam === 'late' ? 0.88 : 1;
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
  S.tokens.push(tok); seeAim(h, c, dur, col);
  if (d.throwZ) camTo(tgt, d.throwZ, Math.max(120, dur * 0.9));
  setTimeout(() => {
    S.tokens = S.tokens.filter(q => q !== tok);
    // impact: the change starts as the token touches
    const dir = (() => { const a = inkOf(tgt); const dx = a[0] - from[0], dy = a[1] - from[1], l = Math.hypot(dx, dy) || 1; return { x: dx / l, z: dy / l }; })();
    const W = molWorldBox(c).w, rec = (d.throwRec[Math.min(2, i)] || 0.03) * W;
    S.recoils.push({ t: now(), x: dir.x * rec, z: dir.z * rec, yaw: (i % 2 ? 1 : -1) * d.yaw * 0.5 * (i + 1) / 3, hz: d.recHz, z0: d.recZ });
    addShake(0.25 + 0.12 * i);
    if (mode === 1) S.drops.push({ t: now(), a: 0.008 + 0.006 * i, ms: 180 });
    snd('strike', i, mode === 1 ? 1.25 : mode === 2 ? 0.8 : 1); F.log.push(['strike', i, Math.round(now() - S.t0)]);
    if (d.throwZ) setTimeout(() => camTo(null, 1, 300), 200 / sp);
    react();
    { const y = P_made(), ct = S.count; if (d.count === 'race') ct.target = y; else { ct.from = ct.shown; ct.to = y; ct.t0 = now() + 80; ct.dur = 260; ct.ease = 'outQuart'; ct.target = y; } S.yDrop = now() + 80; }
  }, dur);
}

// ---------- each change on the molecule: called right after the page has built the new drawing ----------
function onReact(o, nm, prev, L, morph) {
  const S = F.seq; if (!S || !morph) return;
  const st = api.st, g = api.g(); st.sq = 0; st.pop = 0; st.shake = 0;
  // the new drawing is turned and moved, as one piece, to lie as close as it can on the old: only what changed moves
  try { if (!nm.fl && !morph.bend && !(nm.at && nm.at.fold) && !(prev && prev.at && prev.at.fold)) align(nm, morph.from); } catch (e) { /* drawn as laid out */ }
  // runoff leaves as the art's runoff objects, kicked out and falling
  try { st.flyers.forEach(f => { if (f.feel) return; f.feel = true; f.kick = { x: (Math.random() - 0.5) * 0.6, z: -1 }; f.dur = 950; dressFlyer(f); }); } catch (e) { /* plain flyer */ }
  if (!o.casc) { morph.feelEase = true; seeStrike(o, nm, prev); return; }
  const n = g.casc || 1, last = S.plan && n >= S.plan.N && S.plan.N > 0, ph = phases(n, last), d = S.d;
  const kindNow = o.kind || o.kindName || o.id, change = !!S.prevKind && S.prevKind !== kindNow && !last; S.prevKind = kindNow;
  const fm = last ? KIND_FEEL.ring : KIND_FEEL[famOf(kindNow)]; ph.wind *= fm.w; ph.swing *= fm.s; ph.hold = Math.max(16, ph.hold * fm.h); seeFloor(ph, n, last);
  S.steps = n; S.cur = { n, last, ph, t0: now(), kind: kindNow, change, fm }; F.log.push(['react', n, Math.round(now() - S.t0), Math.round(ph.wind), Math.round(ph.swing), Math.round(ph.hold)]);
  // the two atoms that join, on the new drawing
  const ids = o.atoms || [], mp = o.map || new Map(), A = mp.get(ids[0]), B = mp.get(ids[3] || ids[ids.length - 1]);
  S.cur.a = A && nm.balls.has(A) ? A : null; S.cur.b = B && nm.balls.has(B) ? B : null;
  try { const jn = o.join; if (jn && jn.length >= 2) { const a2 = mp.get(jn[0]) || jn[0], b2 = mp.get(jn[1]) || jn[1]; if (nm.balls.has(a2) && nm.balls.has(b2)) { S.cur.ja = a2; S.cur.jb = b2; } } } catch (e) { /* the join is only drawn when the rules give it */ }
  // how far each atom travels this step, in the molecule's own units
  let maxT = 0; const W = molLocalBox(nm).w; morph.from.forEach((p, a) => { const q = nm.at.get(a); if (q && a.el !== 'H') maxT = Math.max(maxT, p.distanceTo(q)); });
  const back = clamp(d.draw(n) * W / Math.max(0.2, maxT), 0.05, 0.4) * (last ? 1.5 : 1);
  S.cur.W = W; S.cur.back = back;
  const held = last ? (d.finale === 'breath' ? breathMs() : d.fullDraw || 0) : (change ? (d.kindBeat || 150) : 0);
  morph.slow = true; morph.s0 = 0; morph.ms = ph.wind + held + ph.swing;
  const wf = ph.wind / morph.ms, bf = (ph.wind + held) / morph.ms, pw = last ? d.swingPow : (S.cur.fm ? S.cur.fm.pow : d.swingPow);
  morph.fk = K => { if (K < wf) return -back * E.inOutSine(K / wf); if (K < bf) return -back; const u = (K - bf) / Math.max(1e-6, 1 - bf); return -back + (1 + back) * Math.pow(u, pw); };
  if (morph.bend) morph.fk0 = morph.fk;
  // the three directions, without ever moving the camera: 4 holds the molecule still, 5 leans in on every step and lets go, 6 waits and leans in for the last three
  const Np = S.plan.N || n, c = S.cur; { const cap = swellCap(nm); let z = 1; if (d.cam === 'half') z = last ? 1.1 : 1.05; else if (d.cam === 'late') { const k3 = Np - n; z = k3 <= 2 && Np >= 4 ? [1.1, 1.03, 0.96][k3] : 0.88; } else z = last ? 1.05 : 1; S.swT = Math.min(cap, z); if (n > 1) snd('swish', Math.max(0.12, ph.wind / 1000)); }
  c.act = actOf(o, nm, kindNow); morph.act = c.act; morph.wf = wf; morph.bf = bf; seeStep(o, nm, prev, c.act, morph.ms);
  // what leaves is seen leaving: it lifts off as the atoms meet (the chlorine of a close goes first) and takes most of a second over it
  st.flyers.forEach(f => { if (f.timed) return; f.timed = true; f.dur = 950; f.t0 = now() + morph.ms * (c.act.fam === 'close' ? wf * 0.5 : 0.9); });
  if (last && d.finale === 'breath') { S.breath = { t0: now() + ph.wind, ms: breathMs() }; S.count.frozen = true; }
  // a marker of the hand-off: the molecule takes over
  snd('windup', n, morph.ms, last);
  if (n === 1) snd('handoff');
  if (d.count === 'race') S.count.target = P_made();
  // the drone: one held voice per step, cut before the last step lands
  if (n >= d.droneFrom && !last) { const lvl = clamp((n - d.droneFrom) / 8, 0, 1); snd('drone', lvl, Math.floor((n - d.droneFrom) / (mode === 2 ? 2 : 3)), Math.max(0.15, (ph.T || 300) / 1000 + 0.05), d.droneLow ? 1 : 0); }
  if (mode === 2 && n >= 8 && !last) snd('draw', n, ph.wind / 1000);
}
// each kind of reflex has its own motion: how long it winds up, how it swings, how long it is held at contact and how far it carries past
const famOf = k => { k = k || ''; return /lactol|aldol|ring|ether|close/.test(k) ? 'ring' : /enone|dry|open/.test(k) ? 'dry' : /weld|knit|seal/.test(k) ? 'weld' : /taut|shift/.test(k) ? 'shift' : /tuck|cap/.test(k) ? 'tuck' : /flip|fold/.test(k) ? 'flip' : /snap/.test(k) ? 'snap' : 'ring'; };
const KIND_FEEL = { ring: { w: 1, s: 1, h: 1, pow: 3, ov: 1 }, dry: { w: 0.8, s: 0.7, h: 0.8, pow: 4, ov: 0.7 }, weld: { w: 1.35, s: 1.0, h: 1.8, pow: 2.5, ov: 0.5 }, shift: { w: 0.9, s: 1.7, h: 0.2, pow: 1.5, ov: 0.2 }, tuck: { w: 1.25, s: 1.3, h: 0.8, pow: 2, ov: 1.6 }, flip: { w: 1, s: 0.8, h: 1.2, pow: 3, ov: 2.2 }, snap: { w: 0.55, s: 0.5, h: 0.4, pow: 6, ov: 0.8 } };
function align(nm, from) {
  let n = 0, px = 0, pz = 0, qx = 0, qz = 0; const pr = []; from.forEach((q, a) => { const p = nm.at.get(a); if (!p || a.el === 'H') return; pr.push([p, q]); px += p.x; pz += p.z; qx += q.x; qz += q.z; n++; });
  if (n < 3) return; px /= n; pz /= n; qx /= n; qz /= n; let sn = 0, cs = 0; pr.forEach(([p, q]) => { const ax = p.x - px, az = p.z - pz, bx = q.x - qx, bz = q.z - qz; sn += ax * bz - az * bx; cs += ax * bx + az * bz; });
  const th = Math.atan2(sn, cs), c = Math.cos(th), si = Math.sin(th);
  nm.at.forEach(p => { const x = p.x - px, z = p.z - pz; p.x = qx + x * c - z * si; p.z = qz + x * si + z * c; });
}
const breathMs = () => Math.min(520, 80 + 40 * ((F.seq && F.seq.plan.N) || 6));
const P_made = () => { try { return api.P.made(api.g()); } catch (e) { return 0; } };
function dressFlyer(f) {
  if (!AA.rxKit || !AA.rxKit.build || !f.grp) return; const key = { water: 'ro_water', h2: 'ro_h2', co2: 'ro_co2', chloride: 'ro_acid', acid: 'ro_acid', fumes: 'ro_acid', hcl: 'ro_acid', nh3: 'ro_nh3', ammonia: 'ro_nh3', tma: 'ro_nh3', trimethylamine: 'ro_nh3', amine: 'ro_nh3', sulfur: 'ro_sulfur', sulfide: 'ro_sulfur', so2: 'ro_sulfur' }[f.kind] || null; if (!key) return;
  const inner = new T.Group(); if (!AA.rxKit.build(key, T, inner, new T.Color(0xffffff))) return;
  const bb = new T.Box3().setFromObject(inner), sz = bb.getSize(new T.Vector3()), k = 1.5 / Math.max(sz.x, sz.y, sz.z, 0.01);
  inner.scale.setScalar(k); inner.position.set(-(bb.min.x + bb.max.x) / 2 * k, -(bb.min.y + bb.max.y) / 2 * k, -(bb.min.z + bb.max.z) / 2 * k); inner.rotation.x = -0.8;
  f.grp.children.slice().forEach(ch => { ch.visible = false; }); f.grp.add(inner); f.ro = inner;
}

// ---------- every kind of reflex acts out its own change on the atoms themselves ----------
// The rules give the two atoms that join (or the two ends of what changes) and the atoms of the place. Each kind moves them its own way
// through the wind-up and the swing; an across step leans the two groups together and grows a rung from row to row while the rows stay put.
const KBASE = { lactol: 'ring', enone: 'dry', taut: 'flip', snap6: 'snap', ether: 'close' };
const kfam = k => { k = String(k || '').replace(/_far$/, ''); k = KBASE[k] || k; return /^(ring|dry|weld|shift|tuck|flip|snap|knit|cap|close|seal|open|fold|bridge|stitch|link)$/.test(k) ? k : 'ring'; };
let _rungMat = null;
function actOf(o, nm, kind) {
  const mp = o.map || new Map(), tr = a => (mp.get(a) || a), has = a => a && nm.balls.has(a);
  const site = (o.atoms || []).map(tr).filter(has), jn = (o.join || []).map(tr).filter(has);
  const act = { fam: kfam(kind), far: o.via === 'fold', A: jn[0] || site[0] || null, B: jn[1] || site[site.length - 1] || null, site, kind };
  if (act.far) { let rs = nm.sticks.filter(s => !s.old && s.rung); if (!rs.length && act.A && act.B) rs = nm.sticks.filter(s => (s.a === act.A && s.b === act.B) || (s.a === act.B && s.b === act.A)); act.rung = rs;
    if (!_rungMat) _rungMat = new T.MeshBasicMaterial({ color: 0xd8401c }); rs.forEach(s => { s.gk = 0; s.parts.forEach(pt => { if (!pt.m0) pt.m0 = pt.mesh.material; pt.mesh.material = _rungMat; }); }); }
  return act;
}
function rungDone(act) { if (act && act.rung) act.rung.forEach(s => { s.gk = null; s.parts.forEach(pt => { if (pt.m0) { pt.mesh.material = pt.m0; pt.m0 = null; } }); }); }
function pose(morph, K) {
  const S = F.seq, act = morph.act; if (!S || !act || !act.A) return;
  const cur = morph.cur, A = cur.get(act.A), B = act.B && act.B !== act.A ? cur.get(act.B) : null; if (!A) return;
  const wf = morph.wf || 0.5, bf = morph.bf || 0.5, uw = clamp(K / Math.max(1e-6, wf), 0, 1), us = clamp((K - bf) / Math.max(1e-6, 1 - bf), 0, 1), sw = Math.sin(Math.PI * us), W = E.inOutSine(uw) * (1 - E.inQuad(us));
  let dx = 0, dz = 1; if (B) { dx = B.x - A.x; dz = B.z - A.z; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl; } const nx = -dz, nz2 = dx;
  const mv = (p, a, b, y) => { if (!p) return; p.x += dx * a + nx * b; p.z += dz * a + nz2 * b; if (y) p.y += y; };
  if (act.far) { const lean = 0.5 * W + 0.25 * sw; mv(A, lean, 0, 0.3 * sw); mv(B, -lean, 0, 0.3 * sw); if (act.rung) act.rung.forEach(s => { s.gk = E.inOutCubic(us); }); return; }
  switch (act.fam) {
    case 'ring': mv(A, -0.42 * W, 0.6 * sw); mv(B, 0.3 * W, -0.25 * sw); break;                                   // drawn apart like a bow, then round in an arc
    case 'weld': mv(A, -0.55 * W, 0, 0.8 * W); mv(B, 0.55 * W, 0, 0.8 * W); break;                                  // both lifted and drawn back, then hammered together
    case 'knit': { const wig = Math.sin(uw * 18.85) * 0.3 * uw * (1 - us) + Math.sin(us * 9.42) * 0.5 * (1 - us); mv(A, -0.2 * W, wig); break; } // the nitrogen weaves its way in
    case 'cap': mv(A, -0.15 * W, 0, 1.9 * E.outCubic(uw) * (1 - us * us)); break;                                   // the sulfur rises and comes down on top
    case 'tuck': mv(A, -0.3 * W, 1.1 * sw + 0.3 * W); break;                                                        // round the side in a hook and in underneath
    case 'seal': mv(A, -0.3 * W, 0.7 * sw); mv(B, 0.3 * W, -0.7 * sw); break;                                       // the two ends twist shut like a lid
    case 'close': { const j = Math.sin(uw * 40) * 0.14 * W; mv(A, -0.3 * W, j); mv(B, 0, -j); break; }                // a tremble while the chlorine goes, then straight into its place
    case 'open': mv(A, -0.2 * W, 0, 1.1 * sw); mv(B, 0.3 * W, 0.25 * sw); break;                                    // the small ring springs apart and the oxygen jumps in
    case 'snap': { let cx = 0, cz = 0, n = 0; act.site.forEach(a => { const p = cur.get(a); if (p) { cx += p.x; cz += p.z; n++; } }); if (n) { cx /= n; cz /= n; act.site.forEach(a => { const p = cur.get(a); if (p) { p.x += (p.x - cx) * 0.24 * W; p.z += (p.z - cz) * 0.24 * W; } }); } break; } // all six breathe out, then clap shut
    case 'dry': mv(A, -0.3 * W + 0.24 * sw, 0); mv(B, 0.3 * W - 0.24 * sw, 0); break;                               // pulled apart to let the water go, then pinched to a double bond
    case 'shift': act.site.forEach((a, i) => { const p = cur.get(a); if (p) { const ph = clamp(us * (act.site.length + 1) - i, 0, 1); p.y += 1.0 * Math.sin(Math.PI * ph); } }); break; // a wave runs along the bond's atoms
    case 'flip': mv(A, 0, 0.8 * sw, 1.4 * sw); mv(B, 0, -0.25 * sw); break;                                         // over the top
    case 'fold': mv(A, 0.2 * W, -1.0 * sw, 0.2 * sw); mv(B, 0, 0.35 * sw); break;                                   // laid down flat to one side
    default: mv(A, -0.3 * W, 0); mv(B, 0.3 * W, 0);
  }
}
// how far the molecule may swell and still stand clear of everything else on the page
function swellCap(m) { const b = m && m.box, hm = api.home(), H = api.HOME; return b && H ? Math.max(1, Math.min(1.12, H.w * 1.06 / (b.w * hm.s), H.d * 1.06 / (b.d * hm.s))) : 1.05; }
const mus = (name, ...a) => { try { if (AA.music && AA.music[name]) AA.music[name](...a); } catch (e) { /* music never breaks play */ } };
const toScreen = w => { const p = w.clone().project(api.cam), o = api.over; return [(p.x + 1) / 2 * (o ? o.cv.width : 1280), (1 - p.y) / 2 * (o ? o.cv.height : 720)]; };
// ink thrown on the paper by a hit: more, further and bigger the longer the chain has run
function splat(q, n, last) { const arr = api.st.splats || (api.st.splats = []), k = Math.round(4 + 1.6 * Math.min(12, n) + (last ? 10 : 0)), reach = (46 + 16 * Math.min(12, n)) * (last ? 1.6 : 1); for (let j = 0; j < k; j++) { const ang = Math.random() * 6.283, dd = (0.35 + 0.65 * Math.random()) * reach * 1.6; arr.push({ x: q[0] + Math.cos(ang) * dd, y: q[1] + Math.sin(ang) * dd, r: 2 + Math.random() * (4 + 0.5 * Math.min(12, n)), a: 0.4 + Math.random() * 0.35 }); } if (arr.length > 160) arr.splice(0, arr.length - 160); }
// the curve a reflex step's atoms follow from where they stood to where they go: wind-up, then a fast committed swing
function k(K, morph) { if (morph.fk) return morph.fk(K); return K; }
// a reagent's change: quick with a small overshoot
function ease(u) { return u <= 0 ? 0 : u >= 1 ? 1 : E.outBack(u, 1.4); }

// ---------- the hit: called on the frame a step's atoms arrive ----------
function hit(morph, t) {
  const S = F.seq; if (!S || !S.cur) return; const c = S.cur, d = S.d, n = c.n, st = api.st, nm = morph.m;
  c.hitT = t; S.lastHitT = t; S.hitN = n; seeHit(t);
  (S.marks || (S.marks = [])).push({ t, kind: c.kind, a: c.ja || c.a, b: c.jb || c.b, n, m: nm }); F.log.push(['hit', n, Math.round(t - S.t0)]);
  // what moved, and how far: the overshoot carries on past the end along the same path and rings down
  const vecs = new Map(); morph.from.forEach((p, a) => { const q = nm.at.get(a); if (q) { const dv = q.clone().sub(p); if (dv.length() > 0.02) vecs.set(a, dv.clampLength(0, 1.2)); } });
  S.settle = { m: nm, vecs, t0: t + c.ph.hold, hold: c.ph.hold, ov: d.ov * (c.last ? 1.6 : (c.fm ? c.fm.ov : 1)), hz: d.settleHz, z: d.settleZ, a: c.a, b: c.b, ms: 700 };
  // the rest of the molecule is knocked the other way and turns, as one piece
  let dir = { x: 0, z: 1 }; if (c.b && vecs.get(c.b)) { const v = vecs.get(c.b); const l = Math.hypot(v.x, v.z) || 1; dir = { x: v.x / l, z: v.z / l }; }
  const wsc = (api.center().group.scale.x || 1), W = c.W * wsc, rec = d.recoil(n) * W * (c.last ? 2.6 : 1);
  S.recoils.push({ t: t + c.ph.hold, x: -dir.x * rec, z: -dir.z * rec, yaw: (n % 2 ? 1 : -1) * d.yaw * (0.5 + 0.5 * Math.min(1, n / 8)) * (c.last ? 2.2 : 1), hz: d.recHz, z0: d.recZ });
  // late in the run (madness) every hit shakes the page a little more and throws a few drops of ink
  { const mm = api.st.madness || 0; if (mm > 0.4) { addShake(0.3 * mm); try { const mol = api.center(), A = c.ja || c.a; if (A && mol && mol.balls.has(A)) { const q = inkOf(worldOf(mol, A)), arr = api.st.splats || (api.st.splats = []); for (let j = 0; j < Math.round(3 + mm * 6); j++) { const ang = Math.random() * 6.28, dd = (30 + Math.random() * 110) * 1.6; arr.push({ x: q[0] + Math.cos(ang) * dd, y: q[1] + Math.sin(ang) * dd, r: 2 + Math.random() * 6 * mm, a: 0.35 + Math.random() * 0.3 }); } if (arr.length > 120) arr.splice(0, arr.length - 120); } } catch (e) { /* no splatter */ } } }
  // impact: a flash and lines of force at the join, ink thrown on the paper, the molecule swells for a moment; all of it grows with the chain
  rungDone(c.act);
  try { const mol = api.center(), Aa = (c.act && c.act.A) || c.ja || c.a, Bb = (c.act && c.act.B) || Aa; if (Aa && mol.balls.has(Aa)) { const w = worldOf(mol, Aa); if (Bb && mol.balls.has(Bb)) w.add(worldOf(mol, Bb)).multiplyScalar(0.5); const sp = toScreen(w); { const pg = Math.max(0, ((api.g() && api.g().page) || 1) - 1); (S.fx || (S.fx = [])).push({ t, x: sp[0], y: sp[1], n: n + 2 * pg, last: c.last }); splat(inkOf(w), n + 3 * pg, c.last); } } } catch (e) { /* no flash */ }
  const turnK = 1 + 0.3 * Math.max(0, ((api.g() && api.g().page) || 1) - 1);
  S.swHit = { t, a: Math.min(0.09, (0.03 + 0.006 * n) * turnK) * (c.last ? 1.4 : 1) };
  mus('step', n);
  // the page
  addShake((0.34 + 0.06 * Math.min(12, n)) * turnK + (c.last ? 0.3 : 0));
  const dropA = c.last && d.landDrop ? d.landDrop : d.drop(n) * (c.last ? 2.2 : 1); if (dropA > 0) S.drops.push({ t, a: dropA, ms: d.dropMs || 260 });
  if (mode === 2) S.cam.push = Math.min(0.18, 0.015 * n);
  if (d.cam === 'half' && !c.last) setTimeout(() => { if (F.seq === S && S.cur === c) S.swT = 0.94; }, c.ph.hold + 120);
  if (c.change) { S.recoils.push({ t: t + c.ph.hold, x: 0, z: 0, yaw: (n % 2 ? -1 : 1) * 6, hz: 3, z0: 0.4 }); addShake(0.3); S.drops.push({ t, a: 0.035, ms: 240 }); }
  // sound on the frame of contact; the bell rings through the freeze
  const fast = mode === 2 && (c.ph.T || 999) < 200;
  snd('reflex', c.kind, n, { bell: d.bell * (c.last ? 1.4 : c.change ? 1.35 : 1), fast, echo: d.echo || c.change, last: c.last });
  if (n >= d.snapFrom || c.last) snd('snap', n, d.snapW * (c.last ? 1.5 : 1));
  if (c.last) snd('boom', SM());
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
  if (o.casc) { const c = S.cur; if (!c) return L.unlock; F.log.push(['unlock', c.n, Math.round(Math.max(c.ph.wind + c.ph.swing + c.ph.hold, Tn(c.n) / sp)), Math.round(L.unlock)]); if (c.last) return c.ph.wind + c.ph.swing + c.ph.hold + 600; return Math.max(c.ph.wind + c.ph.swing + c.ph.hold + 40, Tn(c.n) / sp) + (d.gap || 0) / sp + (c.change ? (d.kindBeat || 140) / sp : 0); }
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
    if (!S.restT) { S.restT = t; if (B3()) camTo(null, 1, 600); }
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
  if (k4 && !S.overDone) { S.overDone = true; const pre = 420; setTimeout(() => { if (F.seq === S) { S.wordBusy = now() + OVMS; overStart(); } }, pre); return pre + OVMS + 200; }
  return 300;
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
  setTimeout(() => { if (F.seq !== S) return; snd('flag', k + 1); S.burnT = now(); }, delay);
}

// ---------- the overlay above everything: the flash and lines of force of a hit, and OVERREACT ----------
// OVERREACT is the one word of the game. It is drawn over the whole frame, above the molecule, fitted inside the frame with a margin:
// a white flash, the word slammed down from far too big, an ink burst behind it, the page shaking, a held beat, then torn away.
const OVMS = 2300;
function overStart() { const t = now(), S = F.seq; F.ov = { t, seed: Math.random() * 100 }; if (S) F.log.push(['over', 0, Math.round(t - S.t0)]); if (S) { S.shake = 0.9; S.shakeT = t; S.drops.push({ t, a: 0.06, ms: 320 }); S.recoils.push({ t, x: 0, z: 0, yaw: 9, hz: 3, z0: 0.35 }); S.swHit = { t, a: 0.07 }; S.burnT = t; }
  try { const c = api.center(), b = molWorldBox(c); for (let j = 0; j < 4; j++) splat(inkOf(new T.Vector3(b.cx + (Math.random() - 0.5) * b.w, 0.4, b.cz + (Math.random() - 0.5) * b.d)), 12, true); } catch (e) { /* no splatter */ }
  snd('flag', 4); mus('state', 'overreact'); }
function drawOver(t) {
  F.ovN = (F.ovN || 0) + 1; F.ovT = t; if (F.ov || F.ovDirty) (F.ovL || (F.ovL = [])).push([Math.round(t), F.ov ? Math.round(t - F.ov.t) : -1, F.ovDirty ? 1 : 0, api.over.cv.width]);
  const o = api.over; if (!o) return; const x = o.x, W = o.cv.width, H = o.cv.height, S = F.seq, k = W / 1280;
  const fx = S && S.fx ? (S.fx = S.fx.filter(q => t - q.t < 360)) : [];
  const wipe = () => { o.cv.width = W; x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; };
  if (!F.ov && !fx.length) { if (F.ovDirty) { wipe(); F.ovDirty = false; } return; }
  wipe(); F.ovDirty = true;
  fx.forEach(q => { const u = clamp((t - q.t) / 360, 0, 1), m = Math.min(12, q.n), R = (95 + 26 * m) * k * (q.last ? 1.6 : 1) * (0.45 + 0.9 * E.outCubic(u)), a = (1 - u) * Math.min(1, 0.8 + 0.03 * m);
    const g = x.createRadialGradient(q.x, q.y, 0, q.x, q.y, R); g.addColorStop(0, 'rgba(255,255,255,' + a.toFixed(3) + ')'); g.addColorStop(0.45, 'rgba(255,244,214,' + (a * 0.6).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = g; x.beginPath(); x.arc(q.x, q.y, R, 0, 6.3); x.fill();
    const nl = 10 + m, r1 = (40 + 12 * m) * k * (0.6 + 1.6 * E.outCubic(u)), len = (34 + 9 * m) * k * (1 - u); x.save(); x.strokeStyle = 'rgba(34,37,44,' + (0.85 * (1 - u)).toFixed(3) + ')'; x.lineWidth = (3.4 + 0.3 * m) * k; x.lineCap = 'round';
    for (let i = 0; i < nl; i++) { const an = i / nl * 6.283 + q.t * 0.01, c = Math.cos(an), s = Math.sin(an), jj = 1 + 0.25 * Math.sin(i * 7.3 + q.t); x.beginPath(); x.moveTo(q.x + c * r1 * jj, q.y + s * r1 * jj); x.lineTo(q.x + c * (r1 * jj + len), q.y + s * (r1 * jj + len)); x.stroke(); } x.restore(); });
  if (F.ov) { const age = t - F.ov.t; if (age > OVMS) { F.ov = null; wipe(); F.ovDirty = false; return; }
    const out = clamp((OVMS - age) / 320, 0, 1), inn = clamp(age / 90, 0, 1), sd = F.ov.seed, R = i => { const v = Math.sin(i * 127.1 + sd) * 43758.5453; return v - Math.floor(v); };
    // the page blanched under it
    x.fillStyle = 'rgba(246,244,238,' + (0.62 * inn * out).toFixed(3) + ')'; x.fillRect(0, 0, W, H);
    if (age < 110) { x.fillStyle = 'rgba(255,255,255,' + (0.9 * (1 - age / 110)).toFixed(3) + ')'; x.fillRect(0, 0, W, H); }
    const jam = age < 800 ? (1 - age / 800) : 0, jx = 16 * k * jam * nz(t / 1000 * 60, 1.1), jy = 12 * k * jam * nz(t / 1000 * 60, 3.7), cx = W / 2 + jx, cy = H / 2 + jy;
    // the ink burst behind the word
    { const u = E.outCubic(clamp(age / 300, 0, 1)); x.save(); x.globalAlpha = 0.9 * out;
      for (let i = 0; i < 54; i++) { const an = R(i) * 6.283, far = (0.16 + 0.4 * R(i + 60)) * W * u, bx = cx + Math.cos(an) * far * 1.25, by = cy + Math.sin(an) * far * 0.62, r = (4 + 22 * R(i + 120) * R(i + 180)) * k; x.fillStyle = i % 5 ? '#b83a2c' : '#22252c'; x.beginPath(); x.ellipse(bx, by, r, r * (0.6 + 0.4 * R(i + 240)), an, 0, 6.3); x.fill();
        if (i % 3 === 0) { x.strokeStyle = x.fillStyle; x.lineWidth = Math.max(1.5, r * 0.35); x.lineCap = 'round'; x.beginPath(); x.moveTo(cx + Math.cos(an) * far * 0.8, cy + Math.sin(an) * far * 0.4); x.lineTo(bx, by); x.stroke(); } }
      x.restore(); }
    // the word: slammed down from far too big, a beat held, then torn off
    let sz = 100 * k; const w0 = AA.rxPen.measure('OVERREACT', sz, 'heavy').width; sz *= Math.min(0.86 * W / Math.max(1, w0), 0.46 * H / (100 * k));
    const slam = age < 140 ? 2.4 - 1.46 * E.inCubic(age / 140) : age < 240 ? 0.94 + 0.06 * (age - 140) / 100 : 1, exit = age > OVMS - 320 ? 1 + 0.18 * E.inCubic(1 - out) : 1, sc = slam * exit;
    x.save(); x.translate(cx, cy); x.rotate(-0.035 + 0.02 * jam * nz(t / 1000 * 40, 7)); x.scale(sc, sc); x.globalAlpha = Math.min(1, inn * 1.4) * out;
    AA.rxPen.write(x, 'OVERREACT', 7 * k, sz * 0.36 + 8 * k, sz, { weight: 'heavy', color: '#22252c', align: 'center', extra: 5 * k });
    AA.rxPen.write(x, 'OVERREACT', 0, sz * 0.36, sz, { weight: 'heavy', color: '#d2301f', align: 'center', extra: 5 * k });
    x.restore(); }
}
// ---------- every frame ----------
function frame(t, dt) {
  if (api) drawOver(t);
  seeFrame(t);
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
  const hm = api.home(), bx = c.box || molLocalBox(c); { const hs = S.swHit ? (t - S.swHit.t) / 1000 : 9, bump = hs < 0.7 ? S.swHit.a * ring(hs, 5.5, 0.4) : 0, want = (S.done ? 1 : (S.swT || 1)); S.swE = (S.swE || 1) + (want - (S.swE || 1)) * Math.min(1, dt * 7); S.sw = Math.min(S.swE + bump, Math.max(S.swE, swellCap(c))); }
  const s1 = hm.s * S.sw, px0 = hm.x - (S.sw - 1) * hm.s * bx.cx, pz0 = hm.z - (S.sw - 1) * hm.s * bx.cz; S.zoom = S.sw; S.fk = 1;
  c.group.scale.setScalar(s1);
  // recoil
  let rx = 0, rz = 0, ry = 0; S.recoils = S.recoils.filter(r => { const s = (t - r.t) / 1000; if (s > 2.5) return false; if (s < 0) return true; const kk = kick(s, r.hz, r.z0); rx += r.x * kk; rz += r.z * kk; ry += r.yaw * Math.PI / 180 * kk; return true; });
  let sy = 0; if (mode === 1 && S.lastHitT) { const s = (t - S.lastHitT) / 1000; sy = -0.9 * Math.min(1, 0.3 + 0.07 * (S.hitN || 1)) * (s < 0.05 ? s / 0.05 : Math.max(0, ring(s - 0.05, 3.5, 0.5))); }
  rx = clamp(rx, -1.2, 1.2); rz = clamp(rz, -0.7, 0.7); { const a = t / 1000 * 2 * Math.PI * 0.5; rx += 0.15 * Math.sin(a); rz += 0.15 * Math.cos(a); }
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
  ox = clamp(ox, -1.6, 1.6); oz = clamp(oz, -0.45, 0.6);
  // the camera never travels: the page is seen whole, and only jolts (the shake and the drop above) and a short punch on a hit
  let look = LOOK.clone(), dist = 1; if (S.punchT) { const s = (t - S.punchT) / 1000; dist = 1 - (S.punchA || 0.02) * Math.max(0, ring(s, 5, 0.5)) * (s < 0.8 ? 1 : 0); }
  const setCam = () => { const off = CAM.clone().sub(LOOK).multiplyScalar(dist); cam.position.set(look.x + off.x + ox, look.y + off.y, look.z + off.z + oz); cam.lookAt(look.x + ox, look.y, look.z + oz); cam.updateMatrixWorld(true); };
  setCam();
  // the yield flags on the track: the pole jolts back and rings when its flag fills
  (S.poles || []).forEach(p => { const fl = st.flags3 && st.flags3[p.k]; if (!fl || !fl.on) return; const s = (t - p.t) / 1000, lean = (mode === 1 ? 0.105 : 0.06) * ring(s, mode === 1 ? 2.5 : 3.3, 0.25) * (s < 1.5 ? 1 : 0); fl.on.rotation.z = lean; });
  if (AA.rxFeel.probe) { const pj = v => { const p = v.clone().project(cam); return [Math.round((p.x + 1) * 64000) / 100, Math.round((1 - p.y) * 36000) / 100]; }, cu = S.cur, wbx = molWorldBox(c), mc = new T.Vector3(wbx.cx, 0.6, wbx.cz);
    const row = { t: Math.round(t - S.t0), n: cu ? cu.n : 0, Z: +S.zoom.toFixed(3), c: pj(mc), rec: pj(mc.clone().sub(new T.Vector3(rx, 0, rz))), cam: [Math.round(ox * 24.4), Math.round(oz * 24.4)], shown: Math.round(S.count.shown) };
    if (cu && cu.a && c.balls.has(cu.a)) row.a = pj(worldOf(c, cu.a)); if (cu && cu.b && c.balls.has(cu.b)) row.b = pj(worldOf(c, cu.b)); row.w = (() => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; c.balls.forEach((bb, a) => { if (a.el === 'H') return; const q = pj(bb.mesh.getWorldPosition(new T.Vector3())); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }); row.bb = [x0, x1, y0, y1]; return x1 - x0; })(); { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const sc = c.group.scale.x, v2 = new T.Vector3(); c.balls.forEach((bb, a) => { bb.mesh.getWorldPosition(v2); const q = pj(v2), r = Math.abs(pj(v2.clone().add(new T.Vector3((bb.R || 0.4) * sc, 0, 0)))[0] - q[0]) + 1; x0 = Math.min(x0, q[0] - r); x1 = Math.max(x1, q[0] + r); y0 = Math.min(y0, q[1] - r); y1 = Math.max(y1, q[1] + r); }); row.bbr = [x0, x1, y0, y1]; } F.probeRows.push(row); }
  // runoff: kicked out from where it left, falling under gravity to where it is kept, and landing
  st.flyers.forEach(f => { if (!f.feel || !f.t0 || !f.to) return; const age = t - f.t0; if (age < 0) return; const u = clamp(age / f.dur, 0, 1), g0 = mode === 1 ? 1.4 : mode === 2 ? 0.7 : 1.0, from = f.from, to = f.to; const x = from.x + (to.x - from.x) * u, z = from.z + (to.z - from.z) * u - Math.sin(u * Math.PI) * (2.2 + 2 * g0) * (1 - u * 0.3), y = from.y + (to.y - from.y) * u + Math.sin(u * Math.PI) * 2.0; f.grp.position.set(x, y, z); f.grp.rotation.set(0, 0, 0); f.grp.scale.setScalar(Math.max(0.6, api.st.sc) * 2.0 / Math.max(1, (S.cam && S.cam.z) || 1)); if (u >= 1 && !f.clinked) { f.clinked = true; snd('clink', (S.runoffN = (S.runoffN || 0) + 1), SM()); } });
}

// ---------- the ink: the count, the step numerals, the gains, the words, the throw, the tally ----------
function ink(x, t) {
  const S = F.seq; if (!S || !api) return; const st = api.st, c = api.center(), d = S.d, ips = inkPerScreen();
  // while the camera is pushed in the yield would leave the shot: it keeps its place on the screen (bottom left) and its size on the screen
  const Y0 = api.px(api.MADE), wz = clamp((1.3 - ips) / 0.2, 0, 1), YA = wz > 0 ? inkAtScreen(60, 690) : Y0, Y = [Y0[0] + (YA[0] - Y0[0]) * wz, Y0[1] + (YA[1] - Y0[1]) * wz], yf = 1 + (Math.min(1, ips / 1.6) - 1) * wz;
  // the yield: it jumps with every gain, shakes harder the longer the chain, and burns as the marks are passed
  { const dropT = S.yDrop ? (t - S.yDrop) / 1000 : 9, nf = Object.keys(S.flagged).length, heat = Math.min(1, nf / 4), txt = api.fmt(st.shown), ns = Math.min(10, S.steps || 0);
    const pop = dropT < 0.5 ? 1 + (0.08 + 0.02 * ns) * Math.max(0, ring(dropT, 5, 0.42)) : 1, jit = (ns > 1 && dropT < 0.45 ? (1 - dropT / 0.45) * ns * 1.3 : 0) + heat * 1.6, jx = jit * nz(t / 1000 * 75, 2.2), jy = jit * nz(t / 1000 * 75, 5.1);
    let sz = (100 + 9 * nf) * pop * yf; api.marker(x, sz); let w = x.measureText(txt).width; const maxW = 400 * yf; if (w > maxW) { sz *= maxW / w; api.marker(x, sz); w = x.measureText(txt).width; }
    const bt = S.burnT ? (t - S.burnT) / 1000 : 9, burn = nf ? Math.max(0.22 + 0.2 * heat, bt < 1.1 ? 1 - bt / 1.1 : 0) * (0.5 + 0.5 * heat + (bt < 1.1 ? 0.3 : 0)) : 0, bx0 = Y[0] + jx, by0 = Y[1] + jy;
    if (burn > 0.02) { x.save(); const nt = Math.max(5, Math.round(w / 34)); for (let pass = 0; pass < 2; pass++) { x.fillStyle = pass ? 'rgba(255,190,40,0.85)' : 'rgba(226,74,22,0.8)'; for (let i = 0; i < nt; i++) { const fxp = bx0 + (i + 0.5) / nt * w, hgt = sz * (0.42 + 0.5 * burn) * (0.6 + 0.4 * nz(t / 1000 * 9 + i * 1.9, i * 2.3 + pass)) * (pass ? 0.55 : 1), wd = w / nt * (pass ? 0.55 : 0.95), top = by0 - sz * 0.62 - hgt, sway = wd * 0.5 * nz(t / 1000 * 6 + i, i * 1.3);
          x.beginPath(); x.moveTo(fxp - wd, by0 - sz * 0.3); x.quadraticCurveTo(fxp - wd * 0.9, by0 - sz * 0.6 - hgt * 0.4, fxp + sway, top); x.quadraticCurveTo(fxp + wd * 0.9, by0 - sz * 0.6 - hgt * 0.4, fxp + wd, by0 - sz * 0.3); x.closePath(); x.fill(); } } x.restore(); }
    const mixc = (a, b, k2) => 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * k2)).join(',') + ')';
    api.marker(x, sz); x.textAlign = 'left'; x.fillStyle = nf ? mixc([34, 37, 44], [150, 22, 10], Math.min(1, 0.45 + 0.55 * heat)) : api.INK; x.fillText(txt, bx0, by0); st.madeW = w; }
  // tokens in flight
  S.tokens.forEach(tk => { const u = clamp((t - tk.t0) / tk.dur, 0, 1), e = E.inQuad(u), B = inkOf(tk.tgt), A = tk.from, lift = tk.arc * ips * 4 * u * (1 - u), cx = A[0] + (B[0] - A[0]) * e, cy = A[1] + (B[1] - A[1]) * e - lift, r = 26 * ips * (1 - 0.25 * u);
    x.save(); x.fillStyle = 'rgb(' + tk.col.join(',') + ')'; x.strokeStyle = api.INK; x.lineWidth = 5; x.beginPath(); x.ellipse(cx, cy, r, r * 0.86, 0, 0, 6.3); x.fill(); x.stroke(); x.restore(); });
  // the step numeral has its own place in the left margin, clear of the molecule and of the yield; it grows with the chain, and each gain drops from it into the yield
  { const NP = api.px({ x: -20.3, z: 9.5 }), GP = api.px({ x: -14.7, z: 8.3 });
    S.nums.forEach((q, qi) => { const age = t - q.t; if (age < 0) return; const nxq = S.nums[qi + 1], fade = nxq ? clamp((t - nxq.t) / 70, 0, 1) : S.done && S.restT ? clamp((t - S.restT) / 300, 0, 1) : 0;
      const sz = Math.min(150, 78 + 10 * q.n) * (q.last ? 1.1 : 1), pop = 1 + 0.3 * Math.max(0, ring(age / 1000, 6, 0.4)) * (age < 500 ? 1 : 0);
      if (fade < 1) { x.save(); x.globalAlpha = 1 - fade; AA.rxPen.write(x, String(q.n), NP[0], NP[1], sz * pop, { weight: 'heavy', color: api.INK, align: 'center', t: clamp(age / 60, 0, 1), extra: q.w > 2 ? (q.w - 2) * 1.8 : 0 }); x.restore(); }
      if (q.gain > 0 && d.count !== 'race') { const ft = age - q.hold, u = clamp(ft / q.fly, 0, 1); if (u >= 1) { q.gone = true; return; } const e = E.inCubic(Math.max(0, u)), A = GP, B = [Y[0] + (st.madeW || 200) * 0.5, Y[1] - 70], cx = A[0] + (B[0] - A[0]) * e, cy = A[1] + (B[1] - A[1]) * e;
        AA.rxPen.write(x, '+' + api.fmt(q.gain), cx, cy, 46 * (1 - 0.2 * e), { weight: 'heavy', color: api.INK, align: 'center', t: clamp(age / 80, 0, 1) }); } else q.gone = true; }); }
  // direction 2: a tally in the margin, one stroke per step, bundled in fives
  if (mode === 2 && S.tally) { const o = api.px({ x: 9.5, z: 9.6 }), h = 64 * ips, gap = 16 * ips; x.save(); x.strokeStyle = api.INK; x.lineCap = 'round'; x.lineWidth = 6; for (let i = 0; i < S.tally; i++) { const b = Math.floor(i / 5), j = i % 5, x0 = o[0] + b * (5 * gap + 34 * ips) + j * gap; x.beginPath(); if (j < 4) { x.moveTo(x0, o[1]); x.lineTo(x0 + 3, o[1] - h); } else { const xb = o[0] + b * (5 * gap + 34 * ips); x.moveTo(xb - 10, o[1] - h * 0.2); x.lineTo(xb + 4 * gap + 10, o[1] - h * 0.8); } x.stroke(); } x.restore(); }
  // direction 3: the molecule as it stood, drawn small beside the finished one
  if (B3() && S.sketchT && S.start) { const u = clamp((t - S.sketchT) / 600, 0, 1), sk = S.start, o = api.px({ x: 21, z: 2.4 }); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; sk.pts.forEach(p => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }); const s = Math.min(340 / Math.max(1, x1 - x0), 150 / Math.max(1, z1 - z0)), m = p => [o[0] + (p.x - (x0 + x1) / 2) * s, o[1] + (p.z - (z0 + z1) / 2) * s];
    x.save(); x.strokeStyle = api.PENCIL; x.lineWidth = 4; x.lineCap = 'round'; const nb = Math.floor(sk.bonds.length * u); sk.bonds.slice(0, nb).forEach(b => { const A = m(b[0]), B = m(b[1]); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(B[0], B[1]); x.stroke(); }); x.fillStyle = api.REDINK; sk.pts.forEach((p, i) => { if (p.el === 'O' && i / sk.pts.length <= u) { const q = m(p); x.beginPath(); x.arc(q[0], q[1], 6, 0, 6.3); x.fill(); } }); x.restore(); }
}

// ---------- seeing it: what is about to change glows and pulses while the rest dims, what changed stays marked for a beat, ----------
// ---------- and the reflex's own name is lettered beside the join in its own ink. Drawn on its own canvas in the frame's pixels, ----------
// ---------- above the molecule and under the OVERREACT overlay. ----------
const SEE_COL = { ring: [200, 32, 46], dry: [28, 128, 206], weld: [226, 120, 12], shift: [124, 62, 200], tuck: [10, 150, 136], flip: [212, 40, 138], snap: [86, 150, 14], knit: [48, 84, 214], cap: [176, 134, 0], close: [22, 150, 84], seal: [140, 76, 28], open: [0, 160, 196], fold: [150, 80, 170], bridge: [216, 64, 28], stitch: [216, 64, 28], link: [216, 64, 28] };
const SEE = { list: [], cv: null, x: null, dirty: false, paper: '246,244,238' };
const seeRgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
function seeCanvas() { if (SEE.cv || !api || !api.over) return SEE.cv; const o = api.over.cv, c = root.document.createElement('canvas'); c.className = 'veil'; o.parentNode.insertBefore(c, o); SEE.cv = c; SEE.x = c.getContext('2d'); return c; }
// the name the game gives a reflex kind; the across-the-fold form says so
function seeName(kind, far) { const raw = String(kind || ''), base = kfam(raw); return /_far$/.test(raw) || (far && !/^(bridge|stitch|link)$/.test(base)) ? base + ' across' : base; }
const seeHeavy = (m, a) => a && a.el !== 'H' && m.balls.has(a);
// the bonds of the new drawing that were not there before, or were of another order
function seeBonds(o, nm, prev) {
  const out = []; try { const mp = o.map, tr = a => (mp ? mp.get(a) : a), was = new Map();
    prev.model.bonds.forEach(b => { const a2 = tr(b.a), b2 = tr(b.b); if (!a2 || !b2) return; if (!was.has(a2)) was.set(a2, new Map()); if (!was.has(b2)) was.set(b2, new Map()); was.get(a2).set(b2, b.order || 1); was.get(b2).set(a2, b.order || 1); });
    nm.model.bonds.forEach(b => { if (!seeHeavy(nm, b.a) || !seeHeavy(nm, b.b)) return; const w = was.get(b.a), ord = w ? w.get(b.b) : undefined; if (ord !== (b.order || 1)) out.push([b.a, b.b, ord === undefined ? 'new' : (b.order || 1) > ord ? 'up' : 'down']); }); } catch (e) { /* nothing marked */ }
  return out;
}
// everything still on show follows its atoms onto the new drawing
function seeCarry(o, nm, prev) { const mp = o.map, tr = a => (mp ? mp.get(a) : a) || null; SEE.list.forEach(e => { if (e.m !== prev) return; e.m = nm; e.atoms = e.atoms.map(tr).filter(a => seeHeavy(nm, a)); e.bonds = e.bonds.map(b => [tr(b[0]), tr(b[1]), b[2]]).filter(b => seeHeavy(nm, b[0]) && seeHeavy(nm, b[1])); e.A = tr(e.A); e.B = tr(e.B); }); }
// a reagent on its way: the atoms it is about to change light up on the molecule as it stands
function seeAim(h, c, dur, col) { try { const inv = new Map(); (h.o.map || new Map()).forEach((na, oa) => inv.set(na, oa)); const atoms = []; ((h.o.r && h.o.r.made) || []).forEach(a => { const oa = h.o.map ? inv.get(a) : a; if (seeHeavy(c, oa) && atoms.indexOf(oa) < 0) atoms.push(oa); }); if (!atoms.length) return; SEE.list.push({ strike: true, t0: now(), tHit: null, m: c, atoms, bonds: [], col: col || [34, 37, 44], name: null, A: atoms[0], B: atoms[atoms.length - 1] }); } catch (e) { /* no glow */ } }
// the reagent has landed: what it made is marked on the new drawing
function seeStrike(o, nm, prev) { try { seeCarry(o, nm, prev); let e = null; SEE.list.forEach(q => { if (q.strike && !q.tHit) e = q; }); if (!e) { e = { strike: true, t0: now(), col: [34, 37, 44], name: null }; SEE.list.push(e); }
    const atoms = []; ((o.r && o.r.made) || []).forEach(a => { if (seeHeavy(nm, a) && atoms.indexOf(a) < 0) atoms.push(a); }); e.m = nm; e.bonds = seeBonds(o, nm, prev); e.bonds.forEach(b => { [b[0], b[1]].forEach(a => { if (atoms.indexOf(a) < 0) atoms.push(a); }); }); e.atoms = atoms; e.A = atoms[0] || null; e.B = atoms[atoms.length - 1] || null; e.tHit = now() + 260; } catch (er) { /* no mark */ } }
// a reflex step begins: its atoms, its ink and its name
function seeStep(o, nm, prev, act, ms) { try { seeCarry(o, nm, prev); const atoms = []; (act.site || []).concat([act.A, act.B]).forEach(a => { if (seeHeavy(nm, a) && atoms.indexOf(a) < 0) atoms.push(a); }); const bonds = seeBonds(o, nm, prev); bonds.forEach(b => { [b[0], b[1]].forEach(a => { if (atoms.indexOf(a) < 0) atoms.push(a); }); });
    const base = kfam(act.kind); SEE.list.push({ strike: false, t0: now(), tHit: null, eta: now() + ms, m: nm, atoms, bonds, col: SEE_COL[base] || SEE_COL.ring, name: seeName(act.kind, act.far), far: act.far, A: act.A, B: act.B || act.A, fam: base }); } catch (e) { /* no glow */ } }
// the atoms have arrived: the mark and the name start now, and an older name makes way
function seeHit(t) { let e = null; SEE.list.forEach(q => { if (!q.strike && !q.tHit) e = q; }); if (!e) return; SEE.list.forEach(q => { if (q !== e && q.tHit && !q.cut) q.cut = t; }); e.tHit = t; e.spot = null; }
// a reflex step is never quicker than the eye: the wind-up and the swing have a floor
function seeFloor(ph, n, last) { if (last) return ph; const sp = (F.seq && F.seq.speed) || 1, f = (PACE === '3' ? 0.7 : 1) * (n > 8 ? 0.8 : 1) / sp; ph.wind = Math.max(ph.wind, 420 * f); ph.swing = Math.max(ph.swing, 280 * f); return ph; }
function seeFrame(t) {
  if (!api || !api.over || (!SEE.list.length && !SEE.dirty)) return; const cv = seeCanvas(); if (!cv) return; const oc = api.over.cv; if (cv.width !== oc.width || cv.height !== oc.height) { cv.width = oc.width; cv.height = oc.height; }
  const x = SEE.x, W = cv.width, H = cv.height, k = W / 1280; x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H); SEE.dirty = false;
  const mol = api.center(); if (!mol) { SEE.list.length = 0; return; }
  SEE.list = SEE.list.filter(e => e.m === mol && t - e.t0 < 9000 && (!e.tHit || t - e.tHit < 1500) && (!e.cut || t - e.cut < 220)); if (!SEE.list.length) return; SEE.dirty = true; api.dirty();
  const sc = mol.group.scale.x || 1, v = _v(), v2 = _v(), cache = new Map();
  const at = a => { let q = cache.get(a); if (q) return q; const b = mol.balls.get(a); if (!b) return null; b.mesh.getWorldPosition(v); const p = v.clone().project(api.cam); v2.copy(v); v2.x += (b.R || 0.4) * sc; const p2 = v2.project(api.cam); q = { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * H, r: Math.max(6 * k, Math.abs(p2.x - p.x) / 2 * W) }; cache.set(a, q); return q; };
  // how strongly each thing glows: it comes up as the step begins and lets go after the atoms arrive
  let dim = 0; SEE.list.forEach(e => { e.g = e.tHit && t >= e.tHit ? 1 - clamp((t - e.tHit) / 320, 0, 1) : clamp((t - e.t0) / 160, 0, 1); if (e.cut) e.g = 0; dim = Math.max(dim, e.g); });
  // the rest of the molecule dims: a wash of paper over the whole molecule, cut away round the atoms of the step
  if (dim > 0.01) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; mol.balls.forEach((b, a) => { if (a.el === 'H') return; const q = at(a); if (!q) return; x0 = Math.min(x0, q.x - q.r); x1 = Math.max(x1, q.x + q.r); y0 = Math.min(y0, q.y - q.r); y1 = Math.max(y1, q.y + q.r); });
    if (x1 > x0) { const pad = 14 * k; x.save(); x.shadowColor = 'rgba(' + SEE.paper + ',1)'; x.shadowBlur = 34 * k; x.fillStyle = 'rgba(' + SEE.paper + ',' + (0.56 * dim).toFixed(3) + ')'; x.fillRect(x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad); x.restore();
      x.save(); x.globalCompositeOperation = 'destination-out'; SEE.list.forEach(e => { if (e.g <= 0.01) return; const set = new Set(e.atoms);
        mol.sticks.forEach(s => { if (!set.has(s.a) || !set.has(s.b)) return; const A = at(s.a), B = at(s.b); if (!A || !B) return; x.strokeStyle = 'rgba(0,0,0,' + e.g.toFixed(3) + ')'; x.lineCap = 'round'; x.lineWidth = Math.min(A.r, B.r) * 1.5; x.beginPath(); x.moveTo(A.x, A.y); x.lineTo(B.x, B.y); x.stroke(); });
        e.atoms.forEach(a => { const q = at(a); if (!q) return; const R = q.r * 2.1, gr = x.createRadialGradient(q.x, q.y, 0, q.x, q.y, R); gr.addColorStop(0, 'rgba(0,0,0,' + e.g.toFixed(3) + ')'); gr.addColorStop(0.62, 'rgba(0,0,0,' + e.g.toFixed(3) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.beginPath(); x.arc(q.x, q.y, R, 0, 6.3); x.fill(); }); }); x.restore(); } }
  SEE.list.forEach(e => { const col = e.col, age = e.tHit ? t - e.tHit : -1, fadeCut = e.cut ? 1 - clamp((t - e.cut) / 220, 0, 1) : 1;
    // the atoms of the step: a halo and a ring in the kind's ink, beating
    if (e.g > 0.01) { const pu = 0.5 + 0.5 * Math.sin((t - e.t0) / 1000 * 6.283 * 3.2); e.atoms.forEach(a => { const q = at(a); if (!q) return; const r1 = q.r * (1.22 + 0.16 * pu), R = q.r * 2.3, gr = x.createRadialGradient(q.x, q.y, q.r * 0.9, q.x, q.y, R); gr.addColorStop(0, seeRgba(col, 0)); gr.addColorStop(0.22, seeRgba(col, 0.55 * e.g)); gr.addColorStop(1, seeRgba(col, 0)); x.fillStyle = gr; x.beginPath(); x.arc(q.x, q.y, R, 0, 6.3); x.fill();
        x.strokeStyle = seeRgba(col, e.g * (0.7 + 0.3 * pu)); x.lineWidth = (3.5 + 2.5 * pu) * k; x.beginPath(); x.arc(q.x, q.y, r1, 0, 6.3); x.stroke(); }); }
    if (age < 0) return;
    // what changed: the new and changed bonds stay marked in the kind's ink, held and then faded
    const bk = (age < 800 ? 1 : 1 - clamp((age - 800) / 600, 0, 1)) * fadeCut;
    if (bk > 0.01) { x.save(); x.lineCap = 'round'; e.bonds.forEach(b => { const A = at(b[0]), B = at(b[1]); if (!A || !B) return; const dx = B.x - A.x, dy = B.y - A.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l, a0 = Math.min(A.r * 0.8, l * 0.3), b0 = Math.min(B.r * 0.8, l * 0.3), w = Math.min(A.r, B.r) * (1.25 + 0.5 * Math.max(0, 1 - age / 260));
        x.strokeStyle = seeRgba(col, 0.62 * bk); x.lineWidth = w; x.beginPath(); x.moveTo(A.x + ux * a0, A.y + uy * a0); x.lineTo(B.x - ux * b0, B.y - uy * b0); x.stroke(); [A, B].forEach(q => { x.strokeStyle = seeRgba(col, 0.8 * bk); x.lineWidth = 3 * k; x.beginPath(); x.arc(q.x, q.y, q.r * 1.18, 0, 6.3); x.stroke(); }); }); x.restore(); }
    const A = at(e.A), B = at(e.B) || A; if (!A) return; const jx = (A.x + B.x) / 2, jy = (A.y + B.y) / 2;
    // the kind's own flash: a ring of its ink thrown out from the join
    if (age < 420) { const u = age / 420, R = (26 + 120 * E.outCubic(u)) * k; x.strokeStyle = seeRgba(col, 0.9 * (1 - u)); x.lineWidth = (10 * (1 - u) + 1.5) * k; x.beginPath(); x.arc(jx, jy, R, 0, 6.3); x.stroke(); x.fillStyle = seeRgba(col, 0.28 * (1 - u)); x.beginPath(); x.arc(jx, jy, R, 0, 6.3); x.fill(); }
    // its name, lettered beside the join where the molecule leaves the most room
    if (e.name && AA.rxPen) { const size = 50 * k, tw = AA.rxPen.measure(e.name, size, 'heavy').width;
      if (!e.spot) { let best = null; for (let i = 0; i < 12; i++) { const an = -Math.PI / 2 + i * Math.PI / 6, dd = (64 + 0.5 * Math.abs(Math.cos(an)) * tw / k) * k + Math.max(A.r, B.r), cx = clamp(jx + Math.cos(an) * dd, tw / 2 + 24 * k, W - tw / 2 - 24 * k), cy = clamp(jy + Math.sin(an) * dd * 0.8, 96 * k, H - 190 * k); let free = 1e9; mol.balls.forEach((b, a) => { if (a.el === 'H') return; const q = at(a); if (!q) return; const ex = Math.max(0, Math.abs(q.x - cx) - tw / 2), ey = Math.max(0, Math.abs(q.y - cy) - size * 0.4); free = Math.min(free, Math.hypot(ex, ey) - q.r); }); const sc2 = Math.min(free, 60 * k) - 0.05 * Math.hypot(cx - jx, cy - jy) - (Math.sin(an) > 0.3 ? 4 * k : 0); if (!best || sc2 > best.s) best = { s: sc2, dx: cx - jx, dy: cy - jy }; } e.spot = best; }
      const na = (age < 1050 ? 1 : 1 - clamp((age - 1050) / 350, 0, 1)) * fadeCut, wt = clamp(age / 240, 0, 1), px2 = jx + e.spot.dx, py2 = jy + e.spot.dy + size * 0.3, pop = 1 + 0.25 * Math.max(0, ring(age / 1000, 5, 0.45)) * (age < 500 ? 1 : 0);
      if (na > 0.01) { x.save(); x.globalAlpha = na; AA.rxPen.write(x, e.name, px2, py2, size * pop, { weight: 'heavy', color: 'rgb(' + SEE.paper + ')', align: 'center', t: wt, extra: 9 * k }); AA.rxPen.write(x, e.name, px2, py2, size * pop, { weight: 'heavy', color: seeRgba(col, 1), align: 'center', t: wt }); x.restore(); } } });
}

// ---------- a click while it plays: twice as fast ----------
function onClick() { const S = F.seq; if (!S) return; if (S.done) { S.skip = true; return; } S.speed = 2; }
try { root.addEventListener('pointerdown', onClick, true); root.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') onClick(); }, true); } catch (e) { /* no window */ }

AA.rxFeel = {
  DIR, WORDS,
  attach(a) { api = a; T = a.T; return AA.rxFeel; },
  on, owns: () => on() && !!F.seq,
  get mode() { return mode; },
  set(n) { mode = Math.max(0, Math.min(6, n | 0)); try { root.localStorage.setItem(KEY, String(mode)); } catch (e) { /* storage blocked */ } return mode; },
  reset() { if (F.seq) { F.seq.dead = true; F.seq = null; } },
  fire, throwThen, onReact, hit, k, ease, pose, unlock, pageEnd, frame, ink, Tn, phases,
  dbg: () => [F.ovN, F.ovT, F.ov && F.ov.t, now(), !!F.seq, F.ovL],
  stepMs: n => Tn(n), log: F.log, probeRows: F.probeRows, probe: false,
  state: () => F.seq && { steps: F.seq.steps, N: F.seq.plan.N, shown: F.seq.count.shown, zoom: F.seq.zoom, shake: F.seq.shake, words: F.seq.words.map(w => w.k), speed: F.seq.speed, done: F.seq.done, plan: F.seq.plan.ev.map(e => e.k + (e.n || '')).join('') }
};
})(typeof globalThis !== 'undefined' ? globalThis : window);
