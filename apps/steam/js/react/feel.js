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
if (PACE === null) PACE = paceSaved();
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
const snd = (name, ...a) => { if (F.mute) return; try { if (AA.sfx && AA.sfx[name]) AA.sfx[name](...a); } catch (e) { /* sound never breaks play */ } };

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
  later(() => {
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
  try { snapPlan(o, nm, prev); } catch (e) { /* no snap */ }
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
  try { realTime(morph); } catch (e) { /* leaves when the page says */ }
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
  if (f.real) return;
  if (!AA.rxKit || !AA.rxKit.build || !f.grp) return; const key = { water: 'ro_water', h2: 'ro_h2', co2: 'ro_co2', chloride: 'ro_acid', acid: 'ro_acid', fumes: 'ro_acid', hcl: 'ro_acid', nh3: 'ro_nh3', ammonia: 'ro_nh3', tma: 'ro_nh3', trimethylamine: 'ro_nh3', amine: 'ro_nh3', sulfur: 'ro_sulfur', sulfide: 'ro_sulfur', so2: 'ro_sulfur' }[f.kind] || null; if (!key) return;
  const inner = new T.Group(); if (!AA.rxKit.build(key, T, inner, new T.Color(0xffffff))) return;
  const bb = new T.Box3().setFromObject(inner), sz = bb.getSize(new T.Vector3()), k = 1.5 / Math.max(sz.x, sz.y, sz.z, 0.01);
  inner.scale.setScalar(k); inner.position.set(-(bb.min.x + bb.max.x) / 2 * k, -(bb.min.y + bb.max.y) / 2 * k, -(bb.min.z + bb.max.z) / 2 * k); inner.rotation.x = -0.8;
  f.grp.children.slice().forEach(ch => { ch.visible = false; }); f.grp.add(inner); f.ro = inner;
}

// ---------- what leaves, as its own atoms; and a bond that breaks, snapped ----------
// Ruling AL3: no icon for what leaves. scheme.js (flyerReal) builds the small molecule out of the atoms the step record says left.
// Here it rides on its carbon, bond drawn, through the whole wind-up and re-lay (swinging round the carbon to stay clear of every other
// atom) while its hydrogens grow in; on the hit of the step the bond breaks and it goes up and outward to the nearest free edge of the
// play area, fading, or arcs into its jar when one is collecting that runoff. It never crosses the yield band, the reagents or the top bar.
// The snap (an idea to show, AL4, not a ruling; ?snap=0 turns it off): a bond that breaks is strained a little, never past 1.3 times
// its length, and breaks on the hit. A weak bond gives a quick dry tick and a small hop; a strong one a longer strain, a white crack,
// a hard kick of the two atoms and a little shake.
const SNAPQ = (() => { try { return new URLSearchParams(root.location.search).get('snap') !== '0'; } catch (e) { return true; } })();
const BONDE = { 'C-C': 350, 'C=C': 610, 'C-O': 360, 'C=O': 750, 'C-N': 305, 'C-S': 270, 'C-Cl': 340, 'H-O': 460, 'S-S': 250, 'C=N': 615, 'N-O': 200, 'O-O': 145, 'O-S': 265, 'N-N': 160, 'Cl-S': 255, 'C-H': 415, 'H-N': 390, 'H-S': 365 };
// the strength of what breaks: all of a bond, or the part of a double bond that is lost (the difference)
function bondE(a, b, order, lost) { const k = [a, b].sort(), one = BONDE[k.join('-')] || 330, two = BONDE[k.join('=')] || one * 1.75; if (order >= 2) return lost >= order ? two : two - one; return one; }
// 0 for the weakest bond of the table, 1 for the strongest
const snapW = e => clamp((e - 250) / 500, 0, 1);
let _snapGeo = null, _snapBall = null;
const snapGeo = () => _snapGeo || (_snapGeo = new T.CylinderGeometry(1, 1, 1, 10)), snapBall = () => _snapBall || (_snapBall = new T.SphereGeometry(1, 16, 12));
// a stick from A to B (two halves in the colours given), in the space of its parent
function snapStick(parent, mats, r) { const g = snapGeo(), parts = [0, 1].map(h => { const m = new T.Mesh(g, mats[h]); m.castShadow = true; parent.add(m); return m; }); return { parts, r, mats, set(A, B, off, rr) { const u = _v().copy(B).sub(A), len = u.length() || 1e-4, q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), u.clone().divideScalar(len)), mid = _v().copy(A).add(B).multiplyScalar(0.5); parts.forEach((m, h) => { const fr = h ? mid : A, to = h ? B : mid; m.position.copy(fr).add(to).multiplyScalar(0.5); if (off) m.position.add(off); m.quaternion.copy(q); m.scale.set(rr || r, fr.distanceTo(to), rr || r); }); }, free() { parts.forEach(m => { if (m.parent) m.parent.remove(m); }); } }; }
// the break. Weak: three short grey ticks, gone in a tenth of a second. Strong: a white flash, a jagged white crack across the bond and long splinters.
function crack(pos, e, sc, dir) {
  const S = F.seq, w = snapW(e), grp = new T.Group(), mats = []; grp.position.copy(pos); grp.position.y += 0.4; grp.scale.setScalar((sc || 1) * 1.5);
  const basic = (col) => { const m = new T.MeshBasicMaterial({ color: col, transparent: true, depthTest: false }); mats.push(m); return m; };
  const core = new T.Mesh(snapBall(), basic(0xfffbe8)); core.renderOrder = 30; core.scale.setScalar(0.0001); core.visible = w > 0.25; grp.add(core);
  const ink = basic(w < 0.3 ? 0x7c808a : 0x22252c), hot = basic(0xd2301f), white = basic(0xffffff), edge = basic(0x22252c);
  const d = dir ? Math.atan2(dir.z, dir.x) : 0, n = 3 + Math.round(8 * w), sp = [];
  for (let i = 0; i < n; i++) { const an = w < 0.3 ? d + Math.PI / 2 + (i - 1) * 0.5 + (i % 2 ? Math.PI : 0) : i / n * 6.283 + ((pos.x * 3.1 + pos.z * 1.7 + i * 0.9) % 0.7), m = new T.Mesh(snapGeo(), w > 0.5 && i % 3 === 0 ? hot : ink); m.renderOrder = 31; m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(Math.cos(an), 0, Math.sin(an))); m.scale.setScalar(0.0001); grp.add(m); sp.push({ m, an, far: 0.7 + 0.5 * ((i * 7) % 5) / 5 }); }
  // the white crack: a zigzag across the bond, inked at its edges
  const bolt = []; if (w > 0.55) { const px = -Math.sin(d), pz = Math.cos(d), L = 0.9 + 0.9 * w, pts = [-1, -0.45, 0.1, 0.5, 1].map((q, i) => new T.Vector3(px * q * L + Math.cos(d) * (i % 2 ? 0.16 : -0.16) * (i === 0 || i === 4 ? 0 : 1), 0, pz * q * L + Math.sin(d) * (i % 2 ? 0.16 : -0.16) * (i === 0 || i === 4 ? 0 : 1)));
    for (let i = 0; i < 4; i++) [[edge, 0.085, 32], [white, 0.05, 33]].forEach(q => { const m = new T.Mesh(snapGeo(), q[0]), u = pts[i + 1].clone().sub(pts[i]), len = u.length(); m.renderOrder = q[2]; m.position.copy(pts[i]).add(pts[i + 1]).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), u.divideScalar(len)); m.scale.set(0.0001, len * 1.08, 0.0001); grp.add(m); bolt.push({ m, r: q[1] }); }); }
  const c0 = api.center(); if (c0 && c0.group.parent) c0.group.parent.add(grp);
  (F.cracks || (F.cracks = [])).push({ grp, core, sp, bolt, mats, t: now(), w, ms: 110 + 330 * w });
  if (S) F.log.push(['snap', Math.round(e), Math.round(now() - S.t0)]);
  if (w < 0.3) snd('tick', 10); snd('snap', Math.max(1, Math.round(1 + 11 * w)), 0.45 + 1.6 * w); if (w > 0.55) addShake(0.1 + 0.22 * w);
}
function crackFrame(t) {
  if (!F.cracks || !F.cracks.length) return;
  F.cracks = F.cracks.filter(c => { const u = clamp((t - c.t) / c.ms, 0, 1), e = E.outCubic(u), w = c.w; c.core.scale.setScalar((0.2 + 0.8 * w) * (0.4 + 1.3 * e)); c.core.material.opacity = (1 - u) * (1 - u);
    c.sp.forEach(q => { const r0 = (0.3 + 1.7 * w * e) * q.far + (w < 0.3 ? 0.25 * e : 0), len = (0.22 + 1.0 * w) * (1 - u) * q.far, th = 0.02 + 0.022 * w; q.m.position.set(Math.cos(q.an) * (r0 + len / 2), 0, Math.sin(q.an) * (r0 + len / 2)); q.m.scale.set(th, Math.max(0.001, len), th); });
    c.bolt.forEach(q => { const k = u < 0.12 ? u / 0.12 : 1 - E.inCubic(clamp((u - 0.45) / 0.55, 0, 1)); q.m.scale.x = q.m.scale.z = Math.max(0.0001, q.r * k); });
    c.mats.forEach((m, i) => { if (i) m.opacity = i >= 3 ? 1 : 1 - u * u; });
    if (u < 1) return true; if (c.grp.parent) c.grp.parent.remove(c.grp); c.mats.forEach(m => m.dispose()); return false; });
  api.dirty();
}
// an atom knocked back by a break next to it, along the line of the broken bond, its bonds following it: a small quick hop for a weak
// bond, a hard kick that rings for a strong one. Laid over wherever the page has put the atoms this frame.
function nudge(mol, atom, dir, e) { const w = snapW(e); (F.nudges || (F.nudges = [])).push({ mol, atom, dir: dir.clone(), amp: 0.14 + 0.6 * w, ms: 170 + 430 * w, osc: 3.2 + 12 * w, damp: 1.2 + 2.2 * w, t: now() }); }
function nudgeFrame(t) {
  if (!F.nudges || !F.nudges.length) return; const c = api.center(), off = new Map();
  F.nudges = F.nudges.filter(q => { const u = (t - q.t) / q.ms; if (u >= 1 || q.mol !== c || !c.balls.has(q.atom)) return false; const a = q.amp * Math.exp(-q.damp * u) * Math.cos(u * q.osc) * (1 - u) * Math.min(1, u * 9 + 0.35), v = off.get(q.atom) || new T.Vector3(); v.addScaledVector(q.dir, a); off.set(q.atom, v); return true; });
  if (!off.size) return; const P = new Map(), K = new Map();
  c.balls.forEach((b, a) => { const p = b.mesh.position.clone(), o = off.get(a); if (o) p.add(o); P.set(a, p); K.set(a, b.mesh.scale.x / (b.R || 1)); });
  api.layout(c, a => P.get(a) || c.at.get(a), a => (K.has(a) ? K.get(a) : 1)); api.dirty();
}
// the bonds of the molecule itself that this step breaks (both atoms stay): each is drawn on through the step and snapped on its hit
function snapPlan(o, nm, prev) {
  const S = F.seq; if (!S || !SNAPQ || !o.map || !prev || !prev.model || !nm.model) return;
  const has = new Map(); nm.model.bonds.forEach(b => { [[b.a, b.b], [b.b, b.a]].forEach(q => { if (!has.has(q[0])) has.set(q[0], new Map()); has.get(q[0]).set(q[1], b.order || 1); }); });
  const list = []; prev.model.bonds.forEach(b => { const a2 = o.map.get(b.a), b2 = o.map.get(b.b); if (!a2 || !b2 || a2.el === 'H' || b2.el === 'H' || !nm.balls.has(a2) || !nm.balls.has(b2)) return; const was = b.order || 1, is = (has.get(a2) && has.get(a2).get(b2)) || 0; if (is >= was) return;
    const pa = prev.at.get(b.a), pb = prev.at.get(b.b), L0 = pa && pb ? pa.distanceTo(pb) : 1.5; list.push({ m: nm, a: a2, b: b2, e: bondE(a2.el, b2.el, was, was - is), part: is > 0, L0, t0: now(), casc: !!o.casc, stick: null }); });
  if (list.length) S.snaps = (S.snaps || []).concat(list.slice(0, 4));
}
// the hit of a reflex step is when everything of that step breaks: called at the end of onReact, when the length of the step is known
function realTime(morph) {
  const S = F.seq; if (!S || !S.cur) return; const at = now() + morph.ms;
  api.st.flyers.forEach(f => { if (f.real && !f.real.hitAt) { f.real.hitAt = at; f.real.n = S.cur.n; } });
  (S.snaps || []).forEach(q => { if (q.casc && !q.hitAt) { q.hitAt = at; q.n = S.cur.n; } });
}
const hitOf = (S, n, hitAt, t) => (S.cur && S.cur.n === n && S.cur.hitT ? S.cur.hitT : S.cur && S.cur.n > n ? t : t > hitAt + 450 ? t : 0);
function snapFrame(t) {
  crackFrame(t); nudgeFrame(t);
  const S = F.seq, c = api.center(); if (!S || !S.snaps || !S.snaps.length) return;
  S.snaps = S.snaps.filter(q => { if (q.m !== c) { if (q.stick) q.stick.free(); return false; } const A = c.balls.get(q.a), B = c.balls.get(q.b); if (!A || !B) return false;
    if (!q.hitAt) q.hitAt = q.t0 + 300; const w = snapW(q.e), STR = 90 + 380 * w, hit = q.casc ? hitOf(S, q.n, q.hitAt, t) : (t >= q.hitAt ? t : 0);
    const pa = A.mesh.position, pb = B.mesh.position, d = pa.distanceTo(pb), u = _v().copy(pb).sub(pa).normalize(), side = q.part ? new T.Vector3(-u.z, 0, u.x).multiplyScalar(0.3) : null;
    if (!q.stick) { q.mats = [A, B].map(x => new T.MeshStandardMaterial({ color: x.mesh.material.color.clone(), roughness: 0.35 })); q.cols = q.mats.map(m => m.color.clone()); q.stick = snapStick(c.group, q.mats, q.part ? 0.06 : 0.09); }
    // held on through the step; in the last moments it is strained thin and pale (longer for a stronger bond); never past 1.3 times its length
    if (!hit && d <= 1.3 * q.L0) { const sv = clamp((t - (q.hitAt - STR)) / STR, 0, 1) * (0.3 + 0.7 * w); q.stick.set(pa, pb, side, q.stick.r * (1 - 0.55 * sv)); q.mats.forEach((m, i) => m.color.copy(q.cols[i]).lerp(_white, 0.7 * sv * w)); return true; }
    q.stick.free(); q.mats.forEach(m => m.dispose()); const mid = _v().copy(pa).add(pb).multiplyScalar(0.5); c.group.localToWorld(mid); crack(mid, q.e, c.group.scale.x, u); nudge(c, q.a, u.clone().negate(), q.e); nudge(c, q.b, u, q.e); return false; });
  api.dirty();
}
let _white = null, _camD = null;
// the direction, round its carbon, in which a group that is about to leave stands clearest of every other atom (its own direction when that is clear)
function clearAngle(c, anchor, aw, a0, L, sc) {
  let best = a0, bs = -1e9; const v = _v(), pts = []; c.balls.forEach((b, a) => { if (a !== anchor) pts.push(b.mesh.getWorldPosition(new T.Vector3())); });
  for (let j = -8; j <= 8; j++) { const an = a0 + j * Math.PI / 8, x = aw.x + Math.cos(an) * L, z = aw.z + Math.sin(an) * L; let md = 9; pts.forEach(p => { md = Math.min(md, Math.hypot(p.x - x, p.z - z)); }); const sco = Math.min(md, 2.4 * sc) - 0.16 * sc * Math.abs(j); if (sco > bs) { bs = sco; best = an; } }
  return best;
}
// where a group that has broken off goes: the nearest point on the top or the sides of the play area (the higher the better) that it can reach without crossing the molecule
function freeEdge(from, dir, c, sc) {
  const H = api.HOME, x0 = H.x - H.w / 2 + 1.5, x1 = H.x + H.w / 2 - 1.5, z0 = H.z - H.d / 2 + 1.8, zm = H.z + H.d * 0.3, cands = [], pts = [];
  for (let i = 0; i <= 10; i++) cands.push([x0 + (x1 - x0) * i / 10, z0]); for (let i = 1; i <= 7; i++) { const z = z0 + (zm - z0) * i / 7; cands.push([x0, z, i * 0.5], [x1, z, i * 0.5]); }
  c.balls.forEach(b => pts.push(b.mesh.getWorldPosition(new T.Vector3())));
  let best = cands[0], bs = 1e9; cands.forEach(q => { const dx = q[0] - from.x, dz = q[1] - from.z, L = Math.hypot(dx, dz) || 1; let cost = L + (q[2] || 0) - 2.5 * (dx / L * dir.x + dz / L * dir.z);
    [0.2, 0.4, 0.6, 0.8, 1].forEach(k => { const x = from.x + dx * k, z = from.z + dz * k; if (pts.some(p => Math.hypot(p.x - x, p.z - z) < 1.5 * sc)) cost += 12; }); if (cost < bs) { bs = cost; best = q; } });
  return new T.Vector3(best[0], from.y + 1.2, best[1]);
}
// one leaving group drawn as its atoms, every frame
function flyReal(f, t, S) {
  const R = f.real, c = api.center(), sc = c ? c.group.scale.x : api.st.sc, e = bondE(R.els[0], R.els[1], R.order, R.order), w = snapW(e), snapOn = SNAPQ && !!R.anchor;
  const DUR = R.jar ? 1500 : 2100, STR = snapOn ? 90 + 380 * w : 0; f.feel = true; if (!_white) _white = new T.Color(0xffffff);
  if (!R.last) { R.last = f.from.clone(); R.sc = sc; R.a0 = Math.atan2(R.dir.z, R.dir.x); R.ang = R.a0; R.now = R.dir.clone(); }
  // when it breaks off: on the hit of its step (a reflex), or when the page says (a reagent)
  if (!R.lift) { if (R.hitAt) { const h = hitOf(S, R.n, R.hitAt, t); if (h) R.lift = h; else f.t0 = t + 600; } else if (t >= f.t0) R.lift = f.t0; if (R.lift) { f.t0 = R.lift; f.dur = DUR; } }
  const due = R.lift || R.hitAt || f.t0, age = R.lift ? t - R.lift : Math.min(-1, t - due);
  const aw = R.anchor && c && c.balls.has(R.anchor) ? worldOf(c, R.anchor, R._a || (R._a = _v())) : null, base = R._b || (R._b = _v());
  let pos = base, op = 1, s = sc;
  if (!R.lift) {
    // on the molecule: on its carbon wherever the step carries that carbon, swung round it to stand clear of every other atom, its bond drawn
    if (aw && R.off) { const L = Math.hypot(R.off.x, R.off.z) * sc, want = clearAngle(c, R.anchor, aw, R.a0, L, sc); let dA = want - R.ang; while (dA > Math.PI) dA -= 6.2832; while (dA < -Math.PI) dA += 6.2832; R.ang += dA * 0.22; R.now.set(Math.cos(R.ang), 0, Math.sin(R.ang));
      const sv = STR ? E.inOutSine(clamp((age + STR) / STR, 0, 1)) : 0, far = L * (1 + (0.05 + 0.17 * w) * sv); base.set(aw.x + R.now.x * far, aw.y + R.off.y * sc, aw.z + R.now.z * far);
      if (R.stick) { if (!R.bond) { R.bmats = [R.stick[1].clone(), R.stick[2].clone()]; R.bcols = R.bmats.map(m => m.color.clone()); R.bond = snapStick(c.group.parent, R.bmats, 0.09); } R.bond.set(aw, base, null, 0.09 * sc * (1 - 0.55 * sv * (0.3 + 0.7 * w))); R.bmats.forEach((m, i) => m.color.copy(R.bcols[i]).lerp(_white, 0.7 * sv * w)); }
    } else base.copy(f.from);
    R.last.copy(base); R.sc = sc;
  } else {
    if (!R.gone) { R.gone = true; if (R.bond) { R.bond.free(); R.bmats.forEach(m => m.dispose()); R.bond = null; } if (snapOn && aw) { crack(_v().copy(aw).add(R.last).multiplyScalar(0.5), e, sc, R.now); if (c) nudge(c, R.anchor, R.now.clone().negate(), e); } if (!R.jar && c) R.to = freeEdge(R.last, R.now, c, sc); }
    const u = clamp(age / DUR, 0, 1), from = R.last; pos = R._p || (R._p = _v());
    if (R.jar && f.to) { const m = E.inOutSine(u); pos.set(from.x + (f.to.x - from.x) * m, from.y + (f.to.y - from.y) * m + Math.sin(u * Math.PI) * 2.4, from.z + (f.to.z - from.z) * m); s = R.sc * (1 - 0.45 * E.inCubic(u)); op = 1 - clamp((u - 0.86) / 0.14, 0, 1); if (u >= 0.98 && !f.clinked) { f.clinked = true; snd('clink', (S.runoffN = (S.runoffN || 0) + 1), SM()); } }
    else { // thrown off along its bond (harder for a stronger bond), then up and outward to the free edge while it fades; kept inside the play area
      const H = api.HOME, to = R.to || from, kick = (snapOn ? 0.5 + 2.4 * w : 0.9) * R.sc, k1 = E.outCubic(Math.min(1, u / 0.22)), m = 1 - Math.pow(1 - clamp((u - 0.04) / 0.96, 0, 1), 2.2);
      pos.set(from.x + R.now.x * kick * k1 * (1 - m) + (to.x - from.x) * m, from.y + (to.y - from.y) * m, from.z + R.now.z * kick * k1 * (1 - m) + (to.z - from.z) * m);
      pos.x = clamp(pos.x, H.x - H.w / 2 + 0.8, H.x + H.w / 2 - 0.8); pos.z = clamp(pos.z, H.z - H.d / 2 + 1.2, H.z + H.d / 2 - 1.2); s = R.sc; op = 1 - E.inOutSine(clamp((u - 0.6) / 0.4, 0, 1)); }
  }
  // its hydrogens are not drawn on the molecule: they grow in, small and white, before it goes
  const hk = E.outBack(clamp((t - (due - STR - 520)) / 260, 0, 1), 1.6); R.hs.forEach(h => { h.mesh.scale.copy(h.s).multiplyScalar(Math.max(0.0001, hk)); h.mesh.position.copy(h.at).lerp(h.p, clamp(hk, 0, 1)); });
  // turned with the swing round its carbon; the letters keep facing the eye
  const phi = -(R.ang - R.a0); f.grp.position.copy(pos); f.grp.rotation.set(0, phi, 0); f.grp.scale.setScalar(s); R.mats.forEach(m => { m.opacity = op; }); f.grp.visible = op > 0.01;
  if (R.sprites && R.sprites.length) { if (!_camD) _camD = api.LOOKAT.clone().sub(api.CAM).normalize(); const cs = Math.cos(-phi), sn = Math.sin(-phi), lx = _camD.x * cs + _camD.z * sn, lz = -_camD.x * sn + _camD.z * cs; R.sprites.forEach(q => q.sp.position.set(q.c.x - lx * q.d, q.c.y - _camD.y * q.d, q.c.z - lz * q.d)); }
  api.dirty();
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
  if (num.last && overPending()) { S.ovHeld = { y: num.y }; ct.frozen = true; S.landed = t; return; }   // the last gain is kept back: the yield rockets inside OVERREACT
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
    const t = now(), busy = (!S.ovHeld && Math.round(S.count.shown) !== Math.round(fin)) || S.nums.some(q => !q.gone) || (S.landed && t < S.landed) || (S.wordBusy || 0) > t;
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
  if (k4 && !S.overDone) { S.overDone = true; const pre = 120; S.wordBusy = now() + pre + OVMS; setTimeout(() => { if (F.seq === S) { S.wordBusy = now() + OVMS; overStart(); } }, pre); return pre + 60; }
  if (S.ovHeld) overRelease();
  return 300;
}
function finish() { const st = api.st, S = F.seq; st.want = P_made(); st.shown = st.want; F.seq = null; S && (S.dead = true); }

// ---------- flags and words ----------
function flagVals() { const st = api.st; if (!st.quota) return []; return [st.quota].concat(api.P.runMarks(st.quota)); }
function writeWord(k) { const S = F.seq; if (!S || S.words.some(w => w.k === k)) return; S.words.push({ k, t: now() }); S.wordBusy = now() + 260; }
function passFlag(k, final) {
  const S = F.seq; if (S.flagged[k]) return; S.flagged[k] = now(); api.st.passT[k] = now();
  const fl = api.st.flags3 && api.st.flags3[k]; if (fl) S.poles = (S.poles || []).concat([{ k, t: now() }]);
  if (F.ov) return; // inside OVERREACT the marks fill without their own sounds
  if (k === 3 && !final) { snd('flagSoft', 4); return; }
  if (k === 3) return; // written in finalWords
  // two flags passed together fire in order
  const last = Object.values(S.flagged).filter(v => v && now() - v < 300).length - 1, delay = Math.max(0, last) * (mode === 2 ? 180 : 280);
  setTimeout(() => { if (F.seq !== S) return; snd('flag', k + 1); S.burnT = now(); }, delay);
}

// ---------- the overlay above everything: the flash and lines of force of a hit, and OVERREACT ----------
// OVERREACT is the one word of the game. It is drawn over the whole frame, above the molecule, fitted inside the frame with a margin:
// a white flash, the word slammed down from far too big, an ink burst behind it, the page shaking, a held beat, then torn away.
const OVMS = 3000;
function drawOver(t) {
  F.ovN = (F.ovN || 0) + 1; F.ovT = t; if (F.ov || F.ovDirty) (F.ovL || (F.ovL = [])).push([Math.round(t), F.ov ? Math.round(t - F.ov.t) : -1, F.ovDirty ? 1 : 0, api.over.cv.width]);
  const o = api.over; if (!o) return; const x = o.x, W = o.cv.width, H = o.cv.height, S = F.seq, k = W / 1280;
  const fx = S && S.fx ? (S.fx = S.fx.filter(q => t - q.t < 360)) : [];
  const wipe = () => { o.cv.width = W; x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; };
  const heat = heatLevel(t);
  if (!F.ov && !fx.length && heat < 0.01) { if (F.ovDirty) { wipe(); F.ovDirty = false; } return; }
  wipe(); F.ovDirty = true;
  if (heat >= 0.01) heatDraw(x, t, k, heat);
  fx.forEach(q => { const u = clamp((t - q.t) / 360, 0, 1), m = Math.min(12, q.n), R = (95 + 26 * m) * k * (q.last ? 1.6 : 1) * (0.45 + 0.9 * E.outCubic(u)), a = (1 - u) * Math.min(1, 0.8 + 0.03 * m);
    const g = x.createRadialGradient(q.x, q.y, 0, q.x, q.y, R); g.addColorStop(0, 'rgba(255,255,255,' + a.toFixed(3) + ')'); g.addColorStop(0.45, 'rgba(255,244,214,' + (a * 0.6).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,240,200,0)'); x.fillStyle = g; x.beginPath(); x.arc(q.x, q.y, R, 0, 6.3); x.fill();
    const nl = 10 + m, r1 = (40 + 12 * m) * k * (0.6 + 1.6 * E.outCubic(u)), len = (34 + 9 * m) * k * (1 - u); x.save(); x.strokeStyle = 'rgba(34,37,44,' + (0.85 * (1 - u)).toFixed(3) + ')'; x.lineWidth = (3.4 + 0.3 * m) * k; x.lineCap = 'round';
    for (let i = 0; i < nl; i++) { const an = i / nl * 6.283 + q.t * 0.01, c = Math.cos(an), s = Math.sin(an), jj = 1 + 0.25 * Math.sin(i * 7.3 + q.t); x.beginPath(); x.moveTo(q.x + c * r1 * jj, q.y + s * r1 * jj); x.lineTo(q.x + c * (r1 * jj + len), q.y + s * (r1 * jj + len)); x.stroke(); } x.restore(); });
  if (F.ov) overDraw(x, t, W, H, k, wipe);
}

// ---------- the molecule trembles when the round is being won (?vibe=0|1, on unless 0) ----------
// Once the yield has passed the round's target the atoms themselves tremble about their places, finely and fast: more with each mark
// passed and with each step of the chain. From the second mark on the bonds glow with heat. It is dead still in the held breath
// before the last hit. The most an atom moves is 0.26 of its own radius, so atoms never touch and bonds are not stretched.
let VIBE = 1; try { if (new URLSearchParams(root.location.search).get('vibe') === '0') VIBE = 0; } catch (e) { VIBE = 1; }
const roundNow = () => { try { const r = AA.rxScheme && AA.rxScheme.debugRun && AA.rxScheme.debugRun(); return clamp((r && r.round) || 1, 1, 9); } catch (e) { return 1; } };
const bell = (v, mid, half) => { const u = (v - mid) / half; return Math.abs(u) >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * u); };
function overPending() { const S = F.seq; if (!S || S.overDone) return false; const vals = flagVals(); return vals.length >= 4 && Math.max(P_made(), (S.plan && S.plan.yEnd) || 0) >= vals[3]; }
function vibeLevel(t) {
  if (!VIBE) return 0; const S = F.seq, ov = F.ov;
  if (ov) { const a0 = t - ov.t - OV.pre; return a0 < 0 ? 0 : clamp(1 - (a0 - 1700) / 1000, 0, 1); }   // bursting, then it settles with the afterglow
  if (!S) return 0; const nf = Object.keys(S.flagged).length; if (!nf) return 0;
  const c = S.cur; if (c && c.last && !c.hitT) return 0;                                                 // the held breath before the last hit
  if (!S.vibeT0) S.vibeT0 = t;
  let lv = clamp(0.14 + 0.2 * (nf - 1) + 0.3 * Math.min(1, (S.steps || 0) / 10), 0, 1) * clamp((t - S.vibeT0) / 350, 0, 1);
  if (S.done && S.restT && !S.ovHeld && !overPending()) lv *= clamp(1 - (t - S.restT) / 500, 0, 1);
  return lv;
}
const _same = (a, b) => a.x === b.x && a.y === b.y && a.z === b.z;
function vibeApply(t, c) {
  // the level is eased toward its target (in over about a third of a second, out in a tenth) so the shiver never starts or stops with a jerk
  const want = vibeLevel(t), was = F.vibeE || 0, dtv = clamp((t - (F.vibeT || t)) / 1000, 0, 0.1); F.vibeT = t; const lv = F.vibeE = want > was ? Math.min(want, was + dtv * 2.5) : Math.max(want, was - dtv * 9); F.vibeLv = lv;
  if (lv > 0.03 && (!F.vibeS || t - F.vibeS > 220)) { F.vibeS = t; snd('tremble', lv); }
  if (lv <= 0.002 && !F.vibeOn) return; F.vibeOn = lv > 0.002;
  const tt = t / 1000 * 6.283; let i = 0;
  // each ball is moved from where the page last laid it; if nobody has laid it out since the last frame, the last offset is taken off first
  c.balls.forEach(b => { const m = b.mesh.position; if (!b.vo) { b.vo = new T.Vector3(); b.vp = new T.Vector3(1e9, 0, 0); }
    if (_same(m, b.vp)) { m.sub(b.vo); if (b.sprite) b.sprite.position.sub(b.vo); if (b.collar) b.collar.position.sub(b.vo); }
    // a blend of three sines per atom on the play clock, each atom with its own phase: an even shiver, never a jump; at most 0.26 of the atom's radius
    const A = lv * 0.26 * (b.R || 0.4), s = (i++) * 2.399;
    b.vo.set(A * (0.6 * Math.sin(tt * 11 + s) + 0.4 * Math.sin(tt * 13.7 + s * 1.9)), A * 0.25 * Math.sin(tt * 9.3 + s * 1.3), A * (0.6 * Math.cos(tt * 12.1 + s * 0.7) + 0.4 * Math.sin(tt * 14.3 + s * 2.3)));
    m.add(b.vo); if (b.sprite) b.sprite.position.add(b.vo); if (b.collar) b.collar.position.add(b.vo); b.vp.copy(m); });
  c.sticks.forEach(s => { const ba = c.balls.get(s.a), bb = c.balls.get(s.b); if (!ba || !bb || !ba.vo || !bb.vo) return;
    s.parts.forEach(pt => { const m = pt.mesh.position; if (!pt.vo) { pt.vo = new T.Vector3(); pt.vp = new T.Vector3(1e9, 0, 0); } if (_same(m, pt.vp)) m.sub(pt.vo); pt.vo.copy(ba.vo).add(bb.vo).multiplyScalar(0.5); m.add(pt.vo); pt.vp.copy(m); }); });
}
// the heat in the bonds: nothing at the first mark, then a soft warm lightening that grows with each mark
function heatLevel(t) {
  if (!VIBE || !api) return 0; const S = F.seq, ov = F.ov;
  if (ov) { const a0 = t - ov.t - OV.pre; return F.heatNow = (a0 < 0 ? (ov.heat0 || 0) : clamp(1 - (a0 - 1500) / 1100, 0, 1)); }
  if (!S) return F.heatNow = 0; const nf = Object.keys(S.flagged).length; if (nf < 2) return F.heatNow = 0;
  const since = Object.values(S.flagged).sort((a, b) => a - b)[1]; let h = clamp(0.2 + 0.27 * (nf - 1), 0, 1) * clamp((t - since) / 500, 0, 1);
  if (S.done && S.restT && !S.ovHeld && !overPending()) h *= clamp(1 - (t - S.restT) / 600, 0, 1);
  return F.heatNow = h;
}
const _ha = { v: null, w: null };
// where each bond lies on the screen, taken at the end of a frame when the molecule and the camera have been set for it
function heatCache(c) {
  if (!VIBE || !c || !c.sticks || !(F.heatNow > 0.01 || F.ov)) { F.heatSeg = null; return; } if (!_ha.v) { _ha.v = _v(); _ha.w = _v(); }
  const seg = []; let i = 0; c.group.updateMatrixWorld(true);
  c.sticks.forEach(s => { i++; if (s.a.el === 'H' || s.b.el === 'H') return; const ba = c.balls.get(s.a), bb = c.balls.get(s.b); if (!ba || !bb || !s.parts[0] || !s.parts[0].mesh.visible) return;
    const A = toScreen(ba.mesh.getWorldPosition(_ha.v)), B = toScreen(bb.mesh.getWorldPosition(_ha.w)); seg.push([A[0], A[1], B[0], B[1], i]); });
  F.heatSeg = seg;
}
function heatDraw(x, t, k, h) {
  const seg = F.heatSeg, S = F.seq; if (!seg || !S) return; const still = S.cur && S.cur.last && !S.cur.hitT;
  x.save(); x.lineCap = 'round';
  seg.forEach(q => { const dx = q[2] - q[0], dy = q[3] - q[1], len = Math.hypot(dx, dy), i = q[4]; if (len < 4 || len > 240 * k) return;
    const fl = 1, a = h, x0 = q[0] + dx * 0.2, y0 = q[1] + dy * 0.2, x1 = q[0] + dx * 0.8, y1 = q[1] + dy * 0.8, w = Math.min(len, 46 * k);
    const ln = (lw, col) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); };
    // a soft warm lightening along the middle of the bond, narrower than the bond itself: no outline, no flicker
    ln(w * 0.2, 'rgba(255,196,120,' + (0.22 * a).toFixed(3) + ')'); ln(w * 0.09, 'rgba(255,226,170,' + (0.6 * a).toFixed(3) + ')'); });
  x.restore();
}

// ---------- OVERREACT: the reward of the whole game ----------
// Times are from the call, in ms. 0 to OV.pre: the held breath (everything still, the colour drained, a ring drawing in on the molecule).
// At OV.pre the sound's first blow: white flash, the word slammed in with squash and stretch, the molecule bursting with light, ink and
// sparks thrown across the whole frame. 110 ms later, on the second blow, a shockwave ring leaves the molecule and crosses the page,
// kicking the paper and the margin notes as it passes. Through the sound's fall (to about 1.5 s) the yield rockets up to the page's
// total with its flames growing, and the gold earned flies to the purse. At the swell (about 1.75 s) the light blooms once more; then
// the word is let go and a warm glow settles over another second. Everything is larger each round (pw), largest in round 9.
const OV = { pre: 240, ms: OVMS, after: 1300 };
function overStart() { const t = now(), S = F.seq, r = roundNow(), rk = (r - 1) / 8;
  const ov = F.ov = { t, seed: Math.random() * 100, r, rk, pw: 0.7 + 0.5 * rk, beat: {}, coins: [], heat0: F.heatNow || 0, mc: null, mr: 120 };
  try { const c = api.center(), b = molWorldBox(c), p = toScreen(new T.Vector3(b.cx, 0.6, b.cz)), q = toScreen(new T.Vector3(b.x1, 0.6, b.cz)); ov.mc = p; ov.mr = Math.max(60, Math.abs(q[0] - p[0])); ov.wc = new T.Vector3(b.cx, 0.6, b.cz); ov.wb = b; } catch (e) { ov.mc = null; }
  if (S) { F.log.push(['over', 0, Math.round(t - S.t0)]); S.shake = 0; S.shakeT = t; } }
// the beats, each fired once on the frame its time has come
function overBeats(t) { const ov = F.ov, S = F.seq, a0 = t - ov.t - OV.pre, pw = ov.pw, once = (name, at) => { if (a0 >= at && !ov.beat[name]) { ov.beat[name] = t; return true; } return false; };
  if (once('hit', 0)) { F.log.push(['overhit', 0, S ? Math.round(t - S.t0) : 0]); snd('flag', 4); mus('state', 'overreact');
    if (S) { S.shake = Math.min(0.9, 0.55 + 0.4 * ov.rk); S.shakeT = t; S.drops.push({ t, a: 0.045 + 0.03 * ov.rk, ms: 320 }); S.recoils.push({ t, x: 0, z: 0, yaw: 7 + 5 * ov.rk, hz: 3, z0: 0.35 }); S.swHit = { t, a: 0.06 + 0.03 * ov.rk }; S.burnT = t; S.punchT = t; S.punchA = 0.02 + 0.03 * ov.rk; }
    try { const b = ov.wb; for (let j = 0; j < 3 + Math.round(5 * ov.rk); j++) splat(inkOf(new T.Vector3(b.cx + (Math.random() - 0.5) * b.w * 1.6, 0.4, b.cz + (Math.random() - 0.5) * b.d * 1.6)), 12, true); } catch (e) { /* no splatter */ } }
  if (once('ring', 110) && S) { S.drops.push({ t, a: 0.03 + 0.03 * ov.rk, ms: 260 }); addShake(0.25); }
  if (once('count', 150) && S) { const ct = S.count, fin = P_made(); ct.frozen = false; ct.from = ct.shown; ct.to = fin; ct.t0 = t; ct.dur = 1250; ct.ease = 'outQuart'; ct.target = fin; S.yDrop = t; ov.gold = overGold(fin); }
  if (ov.rk > 0.3 && once('third', 470) && S) { addShake(0.3 * pw); S.drops.push({ t, a: 0.03, ms: 220 }); S.swHit = { t, a: 0.04 }; }
  if (ov.rk > 0.6 && once('fourth', 1030) && S) { addShake(0.3 * pw); S.drops.push({ t, a: 0.03, ms: 220 }); S.swHit = { t, a: 0.04 }; }
  if (once('swell', 1500) && S) { S.swHit = { t: t + 200, a: 0.03 + 0.03 * ov.rk }; S.burnT = t; }
  // the gold earned by the marks passed: one coin for each, thrown from the word to the purse
  if (ov.gold && ov.beat.count) { const n = ov.gold; while (ov.coins.length < n && a0 >= 520 + ov.coins.length * Math.min(130, 700 / n)) ov.coins.push({ t, i: ov.coins.length, sd: Math.random() }); }
}
function overGold(fin) { try { if (!api.P.RULE.coins) return 0; return flagVals().filter(v => fin >= v).length; } catch (e) { return 0; } }
function overRelease() { const S = F.seq; if (!S || !S.ovHeld) return; const ct = S.count, t = now(), fin = P_made(); S.ovHeld = null; ct.frozen = false; ct.from = ct.shown; ct.to = fin; ct.t0 = t; ct.dur = 300; ct.ease = 'outQuart'; ct.target = fin; S.landed = t + 300; }
// a click during OVERREACT lets the word go at once
function overSkip() { const ov = F.ov, S = F.seq, t = now(); if (!ov || ov.skipped || t - ov.t > OV.ms - 320) return; ov.skipped = true;
  if (!ov.beat.hit) { snd('flag', 4); mus('state', 'overreact'); } ['hit', 'ring', 'count', 'third', 'fourth', 'swell'].forEach(n => { ov.beat[n] = ov.beat[n] || t; });
  ov.t = t - (OV.ms - 320); if (S) { const ct = S.count, fin = P_made(); ct.frozen = false; ct.from = ct.shown; ct.to = fin; ct.t0 = t; ct.dur = 200; ct.ease = 'outQuart'; ct.target = fin; S.wordBusy = t + 320; } }
// how far the shockwave has travelled (screen pixels of a 1280 frame) and how strong it still is
function ringAt(t, j) { const ov = F.ov; if (!ov) return null; const a = t - ov.t - OV.pre - 110 - 150 * (j || 0); if (a < 0 || a > 900) return null; const u = a / 900; return { r: 60 + 1500 * (1 - (1 - u) * (1 - u)), u }; }
// the yield during OVERREACT: it swells while it counts and its flames stand higher
function ovYield(t) { const ov = F.ov; if (!ov) return { k: 1, b: 0 }; const a0 = t - ov.t - OV.pre; if (a0 < 150) return { k: 1, b: 0 };
  const env = a0 < 1500 ? E.outBack(clamp((a0 - 150) / 260, 0, 1), 2.2) * (1 + 0.05 * Math.sin(a0 / 50)) : clamp(1 - (a0 - 1500) / 800, 0, 1); return { k: 1 + (0.4 + 0.3 * ov.rk) * env, b: (0.9 + 0.6 * ov.rk) * env }; }
// the margin notes are kicked outward as the shockwave passes under them: asked for by the page for a place in the ink (ink pixels)
function noteKick(t, ix, iy) { const ov = F.ov; if (!ov || !ov.mc || !api) return null; const rg = ringAt(t, 0); if (!rg) return null; if (ix == null) return true;
  const o = api.px({ x: 0, z: 0 }), p = toScreen(new T.Vector3((ix - o[0]) / api.U, 0, (iy - o[1]) / api.U)), W = api.over ? api.over.cv.width : 1280, kk = 1280 / W, dx = (p[0] - ov.mc[0]) * kk, dy = (p[1] - ov.mc[1]) * kk, d = Math.hypot(dx, dy) || 1;
  const near = bell(d, rg.r - 40, 170) * (1 - rg.u * 0.6) * (22 + 26 * ov.rk); return [dx / d * near, dy / d * near - near * 0.5]; }
function overDraw(x, t, W, H, k, wipe) {
  const ov = F.ov, age = t - ov.t, a0 = age - OV.pre, S = F.seq, pw = ov.pw, rk = ov.rk, sd = ov.seed, R = i => { const v = Math.sin(i * 127.1 + sd) * 43758.5453; return v - Math.floor(v); };
  if (age > OV.ms + OV.after) { F.ov = null; wipe(); F.ovDirty = false; return; }
  if (S && S.skip && !ov.skipped) overSkip();
  const mc = ov.mc ? [ov.mc[0], ov.mc[1]] : [W / 2, H / 2], diag = Math.hypot(W, H);
  // the held breath: the colour is drained, the edges darken, a thin ring draws in on the molecule
  if (a0 < 0) { const u = E.outCubic(clamp(age / OV.pre, 0, 1)); if (S) { S.shake = 0; S.shakeT = t; }
    x.fillStyle = 'rgba(132,136,146,' + (0.42 * u).toFixed(3) + ')'; x.fillRect(0, 0, W, H);
    const g = x.createRadialGradient(mc[0], mc[1], ov.mr * k * 0.6, mc[0], mc[1], diag * 0.62); g.addColorStop(0, 'rgba(20,22,30,0)'); g.addColorStop(1, 'rgba(20,22,30,' + (0.55 * u).toFixed(3) + ')'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const rr = ov.mr * 1.15 + (1 - u) * 0.5 * W; x.strokeStyle = 'rgba(34,37,44,' + (0.7 * u).toFixed(3) + ')'; x.lineWidth = (2 + 5 * u) * k; x.beginPath(); x.arc(mc[0], mc[1], rr, 0, 6.3); x.stroke();
    return; }
  overBeats(t);
  const wordOut = clamp((OV.ms - age) / 300, 0, 1), fade = age < OV.ms - 300 ? 1 : clamp(1 - (age - (OV.ms - 300)) / (OV.after + 300), 0, 1), swell = bell(a0, 1750, 480);
  // colour pushed warm: a wash over the whole page and a hot edge
  { const wa = (0.07 + 0.15 * Math.exp(-a0 / 500) + 0.12 * swell) * fade * (0.8 + 0.3 * rk); x.fillStyle = 'rgba(255,168,60,' + wa.toFixed(3) + ')'; x.fillRect(0, 0, W, H);
    const g = x.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, diag * 0.6), ea = (0.34 + 0.4 * Math.exp(-a0 / 600) + 0.25 * swell) * fade * (0.6 + 0.6 * rk); g.addColorStop(0, 'rgba(240,90,20,0)'); g.addColorStop(1, 'rgba(196,48,10,' + ea.toFixed(3) + ')'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  // the molecule bursting with light: a core, and rays turning slowly
  { const la = clamp(0.95 * Math.exp(-a0 / 420) + 0.5 * swell + 0.2, 0, 1) * fade, Rb = (ov.mr * 1.3 + (0.2 + 0.3 * pw) * W * E.outCubic(clamp(a0 / 320, 0, 1))) * (1 + 0.12 * swell);
    const g = x.createRadialGradient(mc[0], mc[1], 0, mc[0], mc[1], Rb); g.addColorStop(0, 'rgba(255,255,255,' + la.toFixed(3) + ')'); g.addColorStop(0.3, 'rgba(255,240,170,' + (la * 0.75).toFixed(3) + ')'); g.addColorStop(0.65, 'rgba(255,170,50,' + (la * 0.32).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,140,30,0)'); x.fillStyle = g; x.beginPath(); x.arc(mc[0], mc[1], Rb, 0, 6.3); x.fill();
    const nr = Math.round(12 + 12 * rk), ra = clamp((0.75 + 0.35 * rk) * Math.exp(-a0 / 1200) + 0.5 * swell, 0, 1) * fade, len = diag * (0.35 + 0.5 * E.outCubic(clamp(a0 / 260, 0, 1))) * (0.7 + 0.3 * pw), rot = a0 / 1000 * 0.35 + sd;
    if (ra > 0.01) { x.save(); x.translate(mc[0], mc[1]); for (let i = 0; i < nr; i++) { const an = rot + i / nr * 6.283 + (R(i + 300) - 0.5) * 0.3, wd = 0.035 + 0.06 * R(i + 320), L = len * (0.55 + 0.45 * R(i + 340)), gr = x.createLinearGradient(0, 0, Math.cos(an) * L, Math.sin(an) * L); gr.addColorStop(0, 'rgba(255,250,215,' + (ra * 0.85).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,200,90,0)'); x.fillStyle = gr; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(an - wd) * L, Math.sin(an - wd) * L); x.lineTo(Math.cos(an + wd) * L, Math.sin(an + wd) * L); x.closePath(); x.fill(); } x.restore(); } }
  // the shockwave: a ring of ink with a white lip crossing the whole page (a second and a third in the deeper rounds)
  for (let j = 0; j < (rk > 0.75 ? 3 : rk > 0.35 ? 2 : 1); j++) { const rg = ringAt(t, j); if (!rg) continue; const r = rg.r * k, al = (1 - rg.u) * (j ? 0.6 : 1), lw = (26 - 14 * rg.u) * k * (0.8 + 0.4 * pw);
    x.lineWidth = lw * 2.2; x.strokeStyle = 'rgba(255,255,255,' + (0.5 * al).toFixed(3) + ')'; x.beginPath(); x.arc(mc[0], mc[1], Math.max(1, r - lw), 0, 6.3); x.stroke();
    x.lineWidth = lw; x.strokeStyle = 'rgba(255,196,80,' + (0.75 * al).toFixed(3) + ')'; x.beginPath(); x.arc(mc[0], mc[1], r, 0, 6.3); x.stroke();
    x.lineWidth = lw * 0.32; x.strokeStyle = 'rgba(34,37,44,' + (0.85 * al).toFixed(3) + ')'; x.beginPath(); x.arc(mc[0], mc[1], r + lw * 0.6, 0, 6.3); x.stroke(); }
  // ink and sparks thrown across the whole frame: each flies out, slows, and falls
  { const N = Math.round(90 + 260 * rk), tau = a0 / 1000, at = (i, tq) => { const an = R(i) * 6.283, v = (420 + 1500 * R(i + 60) * (0.75 + 0.25 * pw)) * k, dr = 2.0 + 1.2 * R(i + 90), ds = (1 - Math.exp(-dr * tq)) / dr; return [mc[0] + Math.cos(an) * v * ds * 1.25, mc[1] + Math.sin(an) * v * ds * 0.8 + 0.5 * (520 + 500 * R(i + 30)) * k * tq * tq]; };
    x.save(); x.lineCap = 'round';
    for (let i = 0; i < N; i++) { const life = 0.9 + 1.5 * R(i + 120), u = tau / life; if (u >= 1) continue; const p = at(i, tau), kind = i % 3, al = (u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3) * wordOut;
      if (kind === 0) { const r = (4 + 20 * R(i + 150) * R(i + 180)) * k * (0.8 + 0.3 * pw); x.globalAlpha = 0.9 * al; x.fillStyle = i % 2 ? '#b83a2c' : '#22252c'; const q = at(i, Math.max(0, tau - 0.05)); x.beginPath(); x.ellipse(p[0], p[1], r, r * 0.7, Math.atan2(p[1] - q[1], p[0] - q[0]), 0, 6.3); x.fill(); if (tau < 0.5) { x.strokeStyle = x.fillStyle; x.lineWidth = Math.max(1.5, r * 0.4); x.beginPath(); x.moveTo(q[0], q[1]); x.lineTo(p[0], p[1]); x.stroke(); } }
      else { const q = at(i, Math.max(0, tau - 0.07)), tw = 0.6 + 0.4 * Math.sin(a0 / 28 + i * 2.1); x.globalAlpha = al * tw; x.strokeStyle = kind === 1 ? '#ff7a10' : '#ffc21a'; x.lineWidth = (3.2 + 5 * R(i + 210)) * k * (0.8 + 0.4 * pw); x.beginPath(); x.moveTo(q[0], q[1]); x.lineTo(p[0], p[1]); x.stroke(); x.fillStyle = '#fffbe6'; x.beginPath(); x.arc(p[0], p[1], x.lineWidth * 0.75, 0, 6.3); x.fill(); } }
    x.restore(); x.globalAlpha = 1; }
  // white flash on the first blow, a smaller one on the second
  if (a0 < 190) { x.fillStyle = 'rgba(255,255,255,' + (1 - a0 / 190).toFixed(3) + ')'; x.fillRect(0, 0, W, H); }
  else if (a0 >= 110 + 80 && a0 < 300) { x.fillStyle = 'rgba(255,250,235,' + (0.3 * (1 - (a0 - 190) / 110)).toFixed(3) + ')'; x.fillRect(0, 0, W, H); }
  // the gold: each coin leaves the word, arcs high, and lands in the purse with a clink
  if (ov.coins.length) { let to = [W - 60 * k, H - 60 * k]; try { to = toScreen(new T.Vector3(14.5 + 86 / api.U, 0.1, 12.2)); } catch (e) { /* bottom right */ }
    ov.coins.forEach(c => { const u = (t - c.t) / 620; if (u >= 1) { if (!c.done) { c.done = true; c.t1 = t; snd('gold', c.i + 1); } const v = (t - c.t1) / 260; if (v < 1) { x.fillStyle = 'rgba(255,220,110,' + (0.8 * (1 - v)).toFixed(3) + ')'; x.beginPath(); x.arc(to[0], to[1], (14 + 34 * v) * k, 0, 6.3); x.fill(); } return; }
      const e = E.inOutSine(clamp(u, 0, 1)), fx0 = W / 2 + (c.sd - 0.5) * 0.4 * W, fy0 = H / 2, cx = fx0 + (to[0] - fx0) * e, cy = fy0 + (to[1] - fy0) * e - Math.sin(Math.PI * u) * (0.22 + 0.16 * c.sd) * H, r = (26 - 10 * u) * k;
      x.fillStyle = 'rgba(255,214,90,0.35)'; x.beginPath(); x.arc(cx, cy, r * 1.7, 0, 6.3); x.fill();
      if (AA.rxKit && AA.rxKit.drawCoin) AA.rxKit.drawCoin(x, cx, cy, r, {}); else { x.fillStyle = '#e8b53a'; x.beginPath(); x.arc(cx, cy, r, 0, 6.3); x.fill(); x.strokeStyle = '#7a4318'; x.lineWidth = 3 * k; x.stroke(); } }); }
  // the word: slammed in from far too big, squashed flat by the blow, springing back; white-hot, cooling to red; knocked again on each later blow
  if (wordOut > 0) { let sz = 100 * k; const w0 = AA.rxPen.measure('OVERREACT', sz, 'heavy').width; sz *= Math.min(0.64 * W / Math.max(1, w0), 0.4 * H / (100 * k));
    const IN = 110; let sx, sy;
    if (a0 < IN) { const e = E.inCubic(a0 / IN); sx = 1.15 - 0.15 * e; sy = 2.5 - 1.5 * e; }   // it comes in stretched tall, never wider than the frame
    else { const q = (a0 - IN) / 1000, rg = ring(q, 4.2, 0.3) * (q < 1.2 ? 1 : 0); sx = 1 + 0.2 * rg; sy = 1 - 0.3 * rg; }
    const knock = name => { const b = ov.beat[name]; if (!b) return 0; const q = (t - b) / 1000; return q < 0.6 ? kick(q, 5, 0.4) : 0; }, kn = 0.05 * knock('ring') + 0.07 * knock('third') + 0.07 * knock('fourth') + 0.05 * swell;
    const breathe = 1 + 0.035 * clamp(a0 / 2400, 0, 1), exit = 1 + 0.3 * E.inCubic(1 - wordOut); sx *= (1 + kn) * breathe * exit; sy *= (1 + kn) * breathe * exit;
    const jam = a0 < 750 ? (1 - a0 / 750) : 0, jx = 14 * k * pw * jam * nz(t / 1000 * 60, 1.1), jy = 10 * k * pw * jam * nz(t / 1000 * 60, 3.7), hot = Math.exp(-Math.max(0, a0 - IN) / 260), al = Math.min(1, a0 / 45) * wordOut;
    x.save(); x.translate(W / 2 + jx, H / 2 + jy); x.rotate(-0.035 + 0.02 * jam * nz(t / 1000 * 40, 7)); x.scale(sx, sy); x.globalAlpha = al;
    x.shadowColor = 'rgba(255,150,30,0.95)'; x.shadowBlur = (26 + 30 * hot + 20 * swell) * k;
    AA.rxPen.write(x, 'OVERREACT', 7 * k, sz * 0.36 + 8 * k, sz, { weight: 'heavy', color: '#22252c', align: 'center', extra: 5 * k });
    x.shadowBlur = 0; x.shadowColor = 'transparent';
    AA.rxPen.write(x, 'OVERREACT', 0, sz * 0.36, sz, { weight: 'heavy', color: '#d2301f', align: 'center', extra: 5 * k });
    const glow = Math.max(hot, 0.45 * swell); if (glow > 0.03) { x.globalAlpha = al * glow; AA.rxPen.write(x, 'OVERREACT', 0, sz * 0.36, sz, { weight: 'heavy', color: '#fff0a0', align: 'center', extra: 5 * k }); }
    x.restore(); x.globalAlpha = 1; }
}
// ---------- every frame ----------
function frame(t, dt) {
  if (api) drawOver(t);
  if (!F.seq) seeFrame(t);
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
  vibeApply(t, c);
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
  snapFrame(t);
  st.flyers.forEach(f => { if (f.real) return flyReal(f, t, S); if (!f.feel || !f.t0 || !f.to) return; const age = t - f.t0; if (age < 0) return; const u = clamp(age / f.dur, 0, 1), g0 = mode === 1 ? 1.4 : mode === 2 ? 0.7 : 1.0, from = f.from, to = f.to; const x = from.x + (to.x - from.x) * u, z = from.z + (to.z - from.z) * u - Math.sin(u * Math.PI) * (2.2 + 2 * g0) * (1 - u * 0.3), y = from.y + (to.y - from.y) * u + Math.sin(u * Math.PI) * 2.0; f.grp.position.set(x, y, z); f.grp.rotation.set(0, 0, 0); f.grp.scale.setScalar(Math.max(0.6, api.st.sc) * 2.0 / Math.max(1, (S.cam && S.cam.z) || 1)); if (u >= 1 && !f.clinked) { f.clinked = true; snd('clink', (S.runoffN = (S.runoffN || 0) + 1), SM()); } });
  seeFrame(t);
  heatCache(c);
}

// ---------- the ink: the count, the step numerals, the gains, the words, the throw, the tally ----------
function ink(x, t) {
  const S = F.seq; if (!S || !api) return; const st = api.st, c = api.center(), d = S.d, ips = inkPerScreen();
  // while the camera is pushed in the yield would leave the shot: it keeps its place on the screen (bottom left) and its size on the screen
  const Y0 = api.px(api.MADE), wz = clamp((1.3 - ips) / 0.2, 0, 1), YA = wz > 0 ? inkAtScreen(60, 690) : Y0, Y = [Y0[0] + (YA[0] - Y0[0]) * wz, Y0[1] + (YA[1] - Y0[1]) * wz], yf = 1 + (Math.min(1, ips / 1.6) - 1) * wz;
  // the yield: it jumps with every gain, shakes harder the longer the chain, and burns as the marks are passed
  { const dropT = S.yDrop ? (t - S.yDrop) / 1000 : 9, nf = Object.keys(S.flagged).length, heat = Math.min(1, nf / 4), txt = api.fmt(st.shown), ns = Math.min(10, S.steps || 0);
    const pop = dropT < 0.5 ? 1 + (0.08 + 0.02 * ns) * Math.max(0, ring(dropT, 5, 0.42)) : 1, jit = (ns > 1 && dropT < 0.45 ? (1 - dropT / 0.45) * ns * 1.3 : 0) + heat * 1.6, jx = jit * nz(t / 1000 * 75, 2.2), jy = jit * nz(t / 1000 * 75, 5.1);
    const oy = ovYield(t); let sz = (100 + 9 * nf) * pop * yf * oy.k; api.marker(x, sz); let w = x.measureText(txt).width; const maxW = 400 * yf * oy.k; if (w > maxW) { sz *= maxW / w; api.marker(x, sz); w = x.measureText(txt).width; }
    const bt = S.burnT ? (t - S.burnT) / 1000 : 9, burn = nf ? Math.max(0.22 + 0.2 * heat, bt < 1.1 ? 1 - bt / 1.1 : 0) * (0.5 + 0.5 * heat + (bt < 1.1 ? 0.3 : 0)) + oy.b : oy.b, bx0 = Y[0] + jx, by0 = Y[1] + jy;
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
let SEE_OFF = false; try { SEE_OFF = new URLSearchParams(root.location.search).get('see') === '0'; } catch (e) { SEE_OFF = false; }   // ?see=0: no outlines, glow or names on the reacting atoms
function seeFrame(t) {
  if (SEE_OFF) SEE.list.length = 0;
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
    if (x1 > x0) { const pad = 14 * k; x.save(); x.shadowColor = 'rgba(' + SEE.paper + ',1)'; x.shadowBlur = 44 * k; x.shadowOffsetX = 3 * W; x.shadowColor = 'rgba(' + SEE.paper + ',' + (0.6 * dim).toFixed(3) + ')'; x.fillStyle = '#000'; x.fillRect(x0 - pad - 3 * W, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad); x.restore();
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
    if (age < 420) { const u = age / 420, R = (26 + 120 * E.outCubic(u)) * k; x.strokeStyle = seeRgba(col, 0.9 * (1 - u)); x.lineWidth = (10 * (1 - u) + 1.5) * k; x.beginPath(); x.arc(jx, jy, R, 0, 6.3); x.stroke(); x.fillStyle = seeRgba(col, 0.12 * (1 - u)); x.beginPath(); x.arc(jx, jy, R, 0, 6.3); x.fill(); }
    // its name, lettered beside the join where the molecule leaves the most room
    if (e.name && AA.rxPen) { const size = 64 * k, tw = AA.rxPen.measure(e.name, size, 'heavy').width;
      if (!e.spot) { let best = null; for (let i = 0; i < 12; i++) { const an = -Math.PI / 2 + i * Math.PI / 6, dd = (64 + 0.5 * Math.abs(Math.cos(an)) * tw / k) * k + Math.max(A.r, B.r), cx = clamp(jx + Math.cos(an) * dd, tw / 2 + 24 * k, W - tw / 2 - 24 * k), cy = clamp(jy + Math.sin(an) * dd * 0.8, 96 * k, H - 190 * k); let free = 1e9; mol.balls.forEach((b, a) => { if (a.el === 'H') return; const q = at(a); if (!q) return; const ex = Math.max(0, Math.abs(q.x - cx) - tw / 2), ey = Math.max(0, Math.abs(q.y - cy) - size * 0.4); free = Math.min(free, Math.hypot(ex, ey) - q.r); }); const sc2 = Math.min(free, 60 * k) - 0.05 * Math.hypot(cx - jx, cy - jy) - (Math.sin(an) > 0.3 ? 4 * k : 0); if (!best || sc2 > best.s) best = { s: sc2, dx: cx - jx, dy: cy - jy }; } e.spot = best; }
      const na = (age < 1050 ? 1 : 1 - clamp((age - 1050) / 350, 0, 1)) * fadeCut, wt = clamp((age - 90) / 260, 0, 1), px2 = jx + e.spot.dx, py2 = jy + e.spot.dy + size * 0.3, pop = 1 + 0.25 * Math.max(0, ring(age / 1000, 5, 0.45)) * (age < 500 ? 1 : 0);
      if (na > 0.01) { x.save(); x.globalAlpha = na; AA.rxPen.write(x, e.name, px2, py2, size * pop, { weight: 'heavy', color: 'rgb(' + SEE.paper + ')', align: 'center', t: wt, extra: 9 * k }); AA.rxPen.write(x, e.name, px2, py2, size * pop, { weight: 'heavy', color: seeRgba(col, 1), align: 'center', t: wt }); x.restore(); } } });
}

// ---------- a click while it plays: twice as fast ----------
function onClick() { const S = F.seq; if (!S) return; if (S.done) { S.skip = true; try { if (typeof overSkip === 'function') overSkip(); } catch (e) { /* no overlay */ } return; } }
try { root.addEventListener('pointerdown', onClick, true); } catch (e) { /* no window */ }
// ================= the player's speed control, skip, and turning the molecule in 3D =================
// ---------- speed: slow, normal, fast are the three paces, remembered between sessions; skip jumps a chain to its result ----------
const PKEY = 'overreact.pace';
function paceSaved() { try { const s = root.localStorage.getItem('overreact.pace'); return s === '1' || s === '2' || s === '3' ? s : null; } catch (e) { return null; } }
const SPK = { 1: 1, 2: 1, 3: 1.45 }, MUSI = { 1: 0.4, 2: 0.55, 3: 0.85 }, MUST = { 1: 0.85, 2: 1, 3: 1.25 };
const stepT = (d, n) => Math.max(167, d.Tmin || 0, d.T1 * Math.pow(d.r, Math.max(0, n - 1)));
// the music is told the speed (only the hooks it has are called)
function paceMusic() { const p = PACES[PACE] ? PACE : '2'; mus('pace', +p); mus('tempo', MUST[p]); if (F.seq) mus('intensity', MUSI[p]); }
// a change of speed in the middle of a step: the step under way and the wait after it are stretched or squeezed where they stand
function paceRetime(S, d0, sp0) {
  const n = Math.max(1, S.steps || 1), r = clamp((stepT(S.d, n) / S.speed) / (stepT(d0, n) / sp0), 0.15, 6), t = now(), m = S.morph; if (Math.abs(r - 1) < 0.01) return;
  if (m && m.ms > 1) { const s0 = m.s0 || 0, K = (t - m.t0 - s0) / m.ms; if (K >= 0 && K < 1) { m.ms *= r; m.t0 = t - s0 - K * m.ms; } }
  if (S.cur && S.cur.ph) { const ph = S.cur.ph; ph.wind *= r; ph.swing *= r; ph.hold *= r; }
  LATER.forEach(o => { const rem = o.at - t; if (rem > 0) { clearTimeout(o.id); o.at = t + rem * r; o.id = setTimeout(o.run, rem * r); } });
  S.tokens.forEach(k => { const u = clamp((t - k.t0) / k.dur, 0, 1); k.dur *= r; k.t0 = t - u * k.dur; });
}
function setPace(p, quiet) { p = String(p); if (!PACES[p]) return PACE; PACE = p; try { root.localStorage.setItem(PKEY, p); } catch (e) { /* storage blocked */ } const S = F.seq; if (S && !S.skipAll) { const d0 = S.d, sp0 = S.speed; S.d = D(); S.speed = SPK[p] || 1; paceRetime(S, d0, sp0); } paceMusic(); UI.dirty = true; UI.pulse = now(); if (!quiet) snd('click'); if (api) api.dirty(); return PACE; }
// a wait of the play sequence that a skip may cut short
const LATER = new Set();
function later(fn, ms) { const S = F.seq, o = { fn, id: 0, at: 0, run: null }; ms = S && S.skipAll ? 0 : ms; o.run = () => { LATER.delete(o); fn(); }; o.at = now() + ms; o.id = setTimeout(o.run, ms); LATER.add(o); return o.id; }
function flushLater() { const all = Array.from(LATER); LATER.clear(); all.forEach(o => clearTimeout(o.id)); all.forEach(o => setTimeout(o.fn, 0)); }
// skip: every step still to come is taken at once and in silence; the page then lands on the result with one hit (pageEndC)
function skipNow() {
  const S = F.seq; if (!S) return false; if (S.done) { S.skip = true; return true; } if (S.skipAll) return true;
  snd('swish', 0.3); S.skipAll = true; S.skipT = now(); S.speed = 1000; S.ySkip = S.count.shown; F.mute = true; S.cur = null; S.breath = null; S.count.frozen = false;
  if (S.morph) { S.morph.ms = 1; S.morph.end = 0; }
  flushLater(); UI.dirty = true; return true;
}
function armSkip(v) { UI.arm = v === undefined ? !UI.arm : !!v; UI.dirty = true; return UI.arm; }
function fireC(go) { fire(go); if (!(TW.drag && TW.drag.moved)) twistHome(true); if (F.seq) { F.seq.speed = SPK[PACE] || 1; TW.hitSeen = 0; paceMusic(); } if (F.seq && UI.arm) { UI.arm = false; skipNow(); } UI.dirty = true; }
function onReactC(o, nm, prev, L, morph) { onReact(o, nm, prev, L, morph); const S = F.seq; if (!S || !morph) return; S.morph = morph; if (S.skipAll) { morph.ms = 1; morph.end = 0; S.cur = null; } }
function pageEndC(next) { const S = F.seq; if (S && S.skipAll && !S.skipHit) { S.skipHit = true; S.cur = null; F.mute = false; S.speed = 1; try { comboHit(S); } catch (e) { /* the page still turns */ } } return pageEnd(next); }
// the one hit of a skipped chain: everything the steps would have thrown, at once, in the middle of the molecule
function comboHit(S) {
  const t = now(), d = S.d, c = api.center(), N = S.plan.N || 0, fin = P_made(), gain = fin - (S.ySkip || 0), ct = S.count;
  let kind = 'ring'; S.plan.ev.forEach(e => { if (e.k === 's') kind = e.id; });
  S.steps = N; S.hitN = N; S.lastHitT = t; S.finaleAt = t; S.nums = []; S.tokens = [];
  if (c) { const b = molWorldBox(c), w = new T.Vector3(b.cx, 0.6, b.cz), sp = toScreen(w); (S.fx || (S.fx = [])).push({ t, x: sp[0], y: sp[1], n: Math.min(12, N + 3), last: true }); splat(inkOf(w), N + 3, true); }
  addShake(N ? 0.75 : 0.3); S.drops.push({ t, a: N ? 0.045 : 0.02, ms: 260 }); S.swHit = { t, a: N ? 0.09 : 0.04 }; S.recoils.push({ t, x: 0, z: 0, yaw: N ? 7 : 3, hz: 3, z0: 0.4 });
  if (N) { snd('reflex', kind, N, { bell: d.bell * 1.4, fast: false, echo: true, last: true }); snd('snap', N, d.snapW * 1.5); snd('boom', SM()); mus('step', N); } else snd('strike', 2, 1);
  if (N) S.nums.push({ n: N, gain, y: fin, t, hold: 420, fly: 160, join: null, last: true, w: d.numW(N), arrived: true, combo: true });
  S.finY = fin; ct.frozen = false; ct.holdTill = 0; ct.from = ct.shown; ct.to = fin; ct.t0 = t + 120; ct.dur = 320; ct.ease = 'outQuart'; ct.target = fin; S.yDrop = t + 120; S.landed = t + 460;
  F.log.push(['skip', N, Math.round(t - S.t0)]);
}

// ---------- twist: the player drags on the molecule and it turns in 3D; it coasts, and goes home by itself ----------
// The home pose is not touched: the turn is laid over whatever the page and the play sequence set this frame, about the middle of the
// molecule, lifted clear of the paper along the line of sight and shrunk until it stands inside its own part of the page.
const TW = { q: null, w: null, drag: null, homing: false, f: 1, amt: 0, was: false, eat: false, idle: 0, grp: null };
const TWR = { l: 345, r: 1045, t: 112, b: 578 };
function twInit() { if (TW.q || !T) return; TW.q = new T.Quaternion(); TW.I = new T.Quaternion(); TW.w = new T.Vector3(); TW.q2 = new T.Quaternion(); TW.q3 = new T.Quaternion(); TW.q4 = new T.Quaternion(); TW.v = [_v(), _v(), _v(), _v(), _v(), _v(), _v(), _v()]; TW.s = _v(); TW.Z = new T.Vector3(0, 0, 1); TW.mi = new T.Matrix4(); TW.nrm = _v(); }
const twAngle = () => (TW.q ? 2 * Math.acos(Math.min(1, Math.abs(TW.q.w))) : 0);
function twCan() { if (!api) return false; const st = api.st, c = api.center(); return !!c && !!c.balls && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse'); }
// dx, dy: how far the pointer moved, in the frame's pixels (1280 wide); ms: over how long (for the coasting)
function twistBy(dx, dy, ms) {
  twInit(); if (!TW.q) return; const len = Math.hypot(dx, dy); if (len < 1e-6) return; const cam = api.cam, up = TW.v[0].set(0, 1, 0).applyQuaternion(cam.quaternion), right = TW.v[1].set(1, 0, 0).applyQuaternion(cam.quaternion);
  const ax = TW.v[2].copy(up).multiplyScalar(dx).addScaledVector(right, dy).normalize(), ang = len * 0.0085;
  TW.q.premultiply(TW.q2.setFromAxisAngle(ax, ang)).normalize(); TW.homing = false; TW.idle = now();
  if (ms > 0) TW.w.multiplyScalar(0.5).addScaledVector(ax, 0.5 * ang / (ms / 1000)); api.dirty();
}
function twistHome(quiet) { twInit(); if (!TW.q) return; if (twAngle() > 0.01 && !TW.homing && !quiet) snd('swish', 0.2); TW.homing = true; TW.w.set(0, 0, 0); }
const twistState = () => ({ ang: +twAngle().toFixed(3), f: +TW.f.toFixed(3), amt: TW.amt, homing: TW.homing, held: !!(TW.drag && TW.drag.moved), w: TW.w ? +TW.w.length().toFixed(2) : 0, box: molScreenBox(), err: F.cErr || null });
const hostCv = () => root.document.querySelector('#schemeapp canvas');
function refXY(e) { const r = hostCv().getBoundingClientRect(); return [(e.clientX - r.left) / Math.max(1, r.width) * 1280, (e.clientY - r.top) / Math.max(1, r.height) * 720]; }
// the box of the molecule as it is seen, in the frame's pixels (1280 by 720), with the atoms' radii
function molScreenBox() {
  const c = api && api.center(); if (!c || !c.balls || !TW.q) return null; const cam = api.cam, right = TW.v[5].set(1, 0, 0).applyQuaternion(cam.quaternion), p = TW.v[6], q = TW.v[7]; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  c.balls.forEach(b => { b.mesh.getWorldPosition(p); const rw = b.mesh.scale.x * (TW.sNow && TW.was ? TW.sNow : c.group.scale.x); q.copy(p).addScaledVector(right, rw).project(cam); p.project(cam); const sx = (p.x + 1) * 640, sy = (1 - p.y) * 360, r = Math.abs((q.x + 1) * 640 - sx); x0 = Math.min(x0, sx - r); x1 = Math.max(x1, sx + r); y0 = Math.min(y0, sy - r); y1 = Math.max(y1, sy + r); });
  return x0 > 1e8 ? null : { x0: Math.round(x0), x1: Math.round(x1), y0: Math.round(y0), y1: Math.round(y1) };
}
// letters and collars are set to face the eye in the molecule's own frame; turned, they are set again against the turn
function twSprites(c, R) {
  const dir = TW.v[3].copy(api.CAM).sub(api.LOOKAT).normalize(); if (R) { TW.q4.copy(R); if (TW.q4.invert) TW.q4.invert(); else TW.q4.inverse(); dir.applyQuaternion(TW.q4); }
  c.balls.forEach(b => { if (b.sprite) b.sprite.position.copy(b.mesh.position).addScaledVector(dir, b.mesh.scale.x * 1.04); if (b.collar) b.collar.quaternion.setFromUnitVectors(TW.Z, dir); });
}
function twistFrame(t, dt) {
  if (!api) return; twInit(); const c = api.center(), st = api.st;
  if (TW.grp && (!c || TW.grp !== c.group)) { TW.grp.matrixAutoUpdate = true; TW.grp = null; }
  if (!c || !c.balls || !c.group) return; const g = c.group, held = !!(TW.drag && TW.drag.moved);
  if (!held) { const sp = TW.w.length(); if (sp > 0.03 && !TW.homing) { TW.q.premultiply(TW.q2.setFromAxisAngle(TW.v[0].copy(TW.w).normalize(), sp * dt)).normalize(); TW.w.multiplyScalar(Math.exp(-dt * 2.4)); TW.idle = t; } else TW.w.set(0, 0, 0); }
  let ang = twAngle();
  // in a chain a turn is kept until the next hit lands; then the molecule lies flat again unless it is still held
  { const S = F.seq, ht = S ? (S.lastHitT || 0) : 0; if (ht !== (TW.hitSeen || 0)) { TW.hitSeen = ht; if (ht && ang > 0.002 && !held) TW.homing = true; } }
  if (ang > 0.002 && !held && !twCan()) TW.homing = true;
  if (TW.homing) { TW.q.slerp(TW.I, 1 - Math.exp(-dt * 7)); ang = twAngle(); if (ang < 0.006) { TW.q.copy(TW.I); TW.homing = false; ang = 0; } api.dirty(); }
  if (ang <= 0.002) { if (TW.was) { TW.was = false; g.matrixAutoUpdate = true; TW.grp = null; TW.f = 1; twSprites(c, null); UI.dirty = true; api.dirty(); } TW.amt = 0; return; }
  if (!TW.was) { UI.dirty = true; const hb = molScreenBox(); TW.btn = hb ? [clamp(hb.x1 + 34, 420, 1034), clamp(hb.y0 + 6, 132, 520)] : [1004, 138]; } TW.was = true; TW.grp = g; TW.amt = clamp(ang / 0.3, 0, 1);
  const cam = api.cam, R = TW.q3.copy(TW.q).multiply(g.quaternion), s0 = g.scale, v = TW.v;
  // the middle of the heavy atoms, in the molecule's own units, and where it stands at home
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9; c.balls.forEach((b, a) => { if (a.el === 'H') return; const p = b.mesh.position; x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); });
  if (x0 > 1e8) return; const pc = v[1].set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), W = v[2].copy(pc).multiply(s0).applyQuaternion(g.quaternion).add(g.position);
  // lifted along the line of sight until its lowest atom is no lower than at home
  let lowH = 1e9, low = 1e9; const f = TW.f, p = v[3];
  c.balls.forEach(b => { const r = b.mesh.scale.x * s0.x; p.copy(b.mesh.position).sub(pc).multiply(s0); const yh = v[4].copy(p).applyQuaternion(g.quaternion).y - r, yt = p.multiplyScalar(f).applyQuaternion(R).y - r * f; lowH = Math.min(lowH, yh); low = Math.min(low, yt); });
  const dir = v[4].copy(cam.position).sub(W).normalize(), lift = Math.max(0, lowH - low); W.addScaledVector(dir, lift / Math.max(0.2, dir.y));
  // shrunk until nothing of it stands outside its part of the page
  const right = v[5].set(1, 0, 0).applyQuaternion(cam.quaternion), q = v[6]; let l = 1e9, r2 = -1e9, tp = 1e9, bt = -1e9;
  c.balls.forEach(b => { const rw = b.mesh.scale.x * s0.x * f; p.copy(b.mesh.position).sub(pc).multiply(s0).multiplyScalar(f).applyQuaternion(R).add(W); q.copy(p).addScaledVector(right, rw).project(cam); p.project(cam); const sx = (p.x + 1) * 640, sy = (1 - p.y) * 360, rr = Math.abs((q.x + 1) * 640 - sx) + 3; l = Math.min(l, sx - rr); r2 = Math.max(r2, sx + rr); tp = Math.min(tp, sy - rr); bt = Math.max(bt, sy + rr); });
  p.copy(W).project(cam); const cx = (p.x + 1) * 640, cy = (1 - p.y) * 360, sd = (room, ext) => (ext > 1 ? Math.max(0.05, room) / ext : 9);
  const kf = Math.min(sd(cx - TWR.l, cx - l), sd(TWR.r - cx, r2 - cx), sd(cy - TWR.t, cy - tp), sd(TWR.b - cy, bt - cy));
  if (kf < 1) TW.f = Math.max(0.25, f * kf); else { const want = Math.min(1, f * kf * 0.985); if (want > f) TW.f = f + (want - f) * Math.min(1, dt * 6); }
  const fe = 1 + (TW.f - 1) * TW.amt; TW.sNow = s0.x * fe; TW.s.copy(s0).multiplyScalar(fe);
  p.copy(pc).multiply(TW.s).applyQuaternion(R); q.copy(W).sub(p);
  g.matrixAutoUpdate = false; g.matrix.compose(q, R, TW.s); g.matrixWorldNeedsUpdate = true; twSprites(c, R); api.dirty();
  TW.mi.copy(g.matrix); if (TW.mi.invert) TW.mi.invert(); else TW.mi.getInverse(g.matrix); TW.nrm.set(0, 1, 0).applyQuaternion(R); TW.lb = [x0, x1, z0, z1];
}
// a point of the page that belongs to the molecule as it lies at home (an ink mark on an atom): where it is seen now that the molecule is turned
function twistPt(pt) {
  if (!TW.was || !TW.grp || !api) return pt; const c = api.center(); if (!c || c.group !== TW.grp) return pt; const C0 = api.C0, sc = c.group.scale.x || 1, w = TW.v[7].set((pt.x - C0.x) / sc, 0, (pt.z - C0.z) / sc).applyMatrix4(TW.grp.matrix), cp = api.cam.position, k = -cp.y / ((w.y - cp.y) || -1e-6);
  return { x: cp.x + (w.x - cp.x) * k, z: cp.z + (w.z - cp.z) * k };
}
// the pointer over the turned molecule: the page is given the place it would have pointed at on the molecule lying at home, so every pick the page knows still works
function twistHit(hit, ray) {
  if (!TW.was || !TW.grp || !api || !TW.lb) return false; const c = api.center(); if (!c || c.group !== TW.grp) return false; const C0 = api.C0, sc = c.group.scale.x || 1, o = ray.origin, dr = ray.direction, v = TW.v; let L = null;
  const face = TW.nrm.dot(dr);
  if (Math.abs(face) > 0.3) { const p0 = v[5].set(0, 0, 0).applyMatrix4(TW.grp.matrix), k = v[6].copy(p0).sub(o).dot(TW.nrm) / face; if (k > 0) { L = v[7].copy(o).addScaledVector(dr, k).applyMatrix4(TW.mi); const b = TW.lb, m = 1.6; if (L.x < b[0] - m || L.x > b[1] + m || L.z < b[2] - m || L.z > b[3] + m) L = null; } }
  else { let best = 1e9; c.balls.forEach(b => { const w = b.mesh.getWorldPosition(v[5]), along = v[6].copy(w).sub(o).dot(dr), off = v[6].copy(o).addScaledVector(dr, along).distanceTo(w); if (off < b.mesh.scale.x * (TW.sNow || sc) * 1.5 && along < best) { best = along; L = v[7].copy(b.mesh.position); } }); }
  if (!L) return false; hit.x = C0.x + L.x * sc; hit.z = C0.z + L.z * sc; return true;
}
// where a place of the molecule (given as it lies at home on the page) is seen in the frame, 1280 by 720
function seenAt(pt) { const q = twistPt(pt), v = new T.Vector3(q.x, 0, q.z).project(api.cam); return [(v.x + 1) * 640, (1 - v.y) * 360]; }
// an open hand over the molecule when nothing else on the page wants the pointer
function twCursor(e) { if (!api || TW.drag || !e.target || !e.target.closest || !e.target.closest('#schemeapp')) return; const cv = hostCv(); if (!cv || (cv.style.cursor && cv.style.cursor !== 'grab')) return; let on = false; if (twCan()) { const xy = refXY(e), b = molScreenBox(); on = !!b && xy[0] > b.x0 - 8 && xy[0] < b.x1 + 8 && xy[1] > b.y0 - 8 && xy[1] < b.y1 + 8; } cv.style.cursor = on ? 'grab' : ''; }
function twDown(e) {
  if (!api || e.button > 0 || !e.target || !e.target.closest || !e.target.closest('#schemeapp')) return; TW.eat = false; twInit(); const xy = refXY(e), h = uiHit(xy[0], xy[1]);
  if (h) { TW.eat = true; e.stopImmediatePropagation(); e.preventDefault(); uiAct(h); return; }
  if (!twCan()) return; const b = molScreenBox(); if (!b || xy[0] < b.x0 - 14 || xy[0] > b.x1 + 14 || xy[1] < b.y0 - 14 || xy[1] > b.y1 + 14) return;
  TW.drag = { x: xy[0], y: xy[1], x0: xy[0], y0: xy[1], t: now(), moved: false, id: e.pointerId };
}
function twMove(e) {
  const dg = TW.drag; if (!dg) { if (api && e.target && e.target.closest && e.target.closest('#schemeapp')) { const xy = refXY(e), h = uiHit(xy[0], xy[1]), hv = h ? h.act : ''; if (hv !== UI.hov) { UI.hov = hv; UI.dirty = true; api.dirty(); } if (h) { hostCv().style.cursor = 'pointer'; e.stopImmediatePropagation(); } } return; }
  if (dg.id != null && e.pointerId != null && e.pointerId !== dg.id) return; const xy = refXY(e), t = now();
  if (!dg.moved) { if (Math.hypot(xy[0] - dg.x0, xy[1] - dg.y0) < 6) return; dg.moved = true; TW.w.set(0, 0, 0); dg.t = t - 16; try { hostCv().setPointerCapture(e.pointerId); } catch (er) { /* no capture */ } hostCv().style.cursor = 'grabbing'; }
  twistBy(xy[0] - dg.x, xy[1] - dg.y, Math.max(8, t - dg.t)); dg.x = xy[0]; dg.y = xy[1]; dg.t = t; e.stopImmediatePropagation(); e.preventDefault();
}
function twUp(e) {
  const dg = TW.drag; if (!dg) return; TW.drag = null; if (!dg.moved) return; TW.eat = true; if (e.type === 'pointercancel' || now() - dg.t > 90) TW.w.set(0, 0, 0); const sp = TW.w.length(); if (sp > 8) TW.w.multiplyScalar(8 / sp);
  TW.idle = now(); try { hostCv().style.cursor = ''; } catch (er) { /* no canvas */ } e.stopImmediatePropagation();
}
function twClick(e) { if (TW.eat) { TW.eat = false; e.stopImmediatePropagation(); e.preventDefault(); } }
function twDbl(e) { if (twAngle() > 0.01 && e.target && e.target.closest && e.target.closest('#schemeapp')) { twistHome(); e.stopImmediatePropagation(); e.preventDefault(); } }
function keyC(e) {
  if (!api || e.ctrlKey || e.metaKey || e.altKey) return; const S = F.seq, k = e.key, stop = () => { e.stopImmediatePropagation(); e.preventDefault(); }, cur = PACES[PACE] ? +PACE : 2;
  if (S && !S.done && (k === '1' || k === '2' || k === '3')) { setPace(k); return stop(); }
  if (S && (k === ' ' || k === 'Enter')) { const done = S.done; skipNow(); if (!done) stop(); return; }
  if (k === '[' || k === '-') { setPace(Math.max(1, cur - 1)); return stop(); }
  if (k === ']' || k === '=' || k === '+') { setPace(Math.min(3, cur + 1)); return stop(); }
  if ((k === 'h' || k === 'H' || k === 'Home') && twAngle() > 0.01) { twistHome(); return stop(); }
}
try { root.addEventListener('pointerdown', twDown, true); root.addEventListener('pointermove', twMove, true); root.addEventListener('pointerup', twUp, true); root.addEventListener('pointercancel', twUp, true); root.addEventListener('click', twClick, true); root.addEventListener('dblclick', twDbl, true); root.addEventListener('keydown', keyC, true); root.addEventListener('pointermove', twCursor, false); } catch (e) { /* no window */ }

// ---------- the two small controls, drawn by hand above the page: the speed row and the way home ----------
const UI = { cv: null, x: null, hit: [], dirty: true, arm: false, pulse: 0, key: '', hov: '' };
function uiInit() { if (UI.cv || !root.document) return; const app = root.document.getElementById('schemeapp'); if (!app || !hostCv()) return; const cv = root.document.createElement('canvas'); cv.className = 'veil'; if (api && api.over && api.over.cv && api.over.cv.parentNode === app) app.insertBefore(cv, api.over.cv); else app.append(cv); UI.cv = cv; UI.x = cv.getContext('2d'); try { hostCv().style.touchAction = 'none'; } catch (e) { /* no style */ } }
const uiHit = (x, y) => UI.hit.find(h => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) || null;
function uiAct(h) { if (h.act === 'home') return twistHome(); if (h.act === 'skip') { if (F.seq && !F.seq.done) skipNow(); else if (!F.seq) { armSkip(); snd('click'); } UI.pulse = now(); return; } setPace(h.act); }
// a loop of ink drawn twice, a little off itself, the way a pen goes round a word
function uiLoop(x, cx, cy, rx, ry, col, lw) { x.save(); x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.beginPath(); x.ellipse(cx, cy, rx, ry, -0.05, 0.5, 6.6); x.stroke(); x.globalAlpha = 0.6; x.beginPath(); x.ellipse(cx + 1.5, cy - 1, rx * 1.03, ry * 0.94, 0.04, 2.6, 7.4); x.stroke(); x.restore(); }
// builder E: with the page drawn back the red margin line stands further in, and the speed row starts to the right of it
function pageX0E() { const p = AA.rxScheme && AA.rxScheme.pageE; return p && p.on ? p.speedX : 66; }
function uiFrame(t) {
  uiInit(); if (!UI.cv || !api) return; const host = hostCv(), dpr = Math.min(2, root.devicePixelRatio || 1), W = Math.round((host.clientWidth || 1280) * dpr), H = Math.round((host.clientHeight || 720) * dpr), st = api.st, S = F.seq;
  const show = !!api.center() && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse'), pulsing = t - UI.pulse < 420, skipping = !!(S && S.skipAll) || UI.arm;
  const key = [W, H, show, PACE, skipping, TW.was, UI.hov, !!S, TW.btn ? TW.btn.join(',') : ''].join('|'); if (key === UI.key && !pulsing && !UI.dirty) return; UI.key = key; UI.dirty = false;
  if (UI.cv.width !== W || UI.cv.height !== H) { UI.cv.width = W; UI.cv.height = H; } const x = UI.x; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); UI.hit = []; if (!show || !AA.rxPen) return;
  x.setTransform(W / 1280, 0, 0, H / 720, 0, 0); const pen = AA.rxPen, INK = api.INK, PEN = api.PENCIL, RED = api.REDINK;
  // the speed row, in the left margin under the queue
  { const X0 = pageX0E(), Y = 329, sz = 22, gap = 19; let wx = X0;
    [['slow', '1'], ['normal', '2'], ['fast', '3'], ['skip', 'skip']].forEach(w => { const on = w[1] === 'skip' ? skipping : (PACE === w[1] && !(S && S.skipAll)), ww = pen.width(w[0], sz, on ? 'heavy' : 'thin'), hov = UI.hov === w[1], pop = on && pulsing ? 1 + 0.16 * Math.max(0, ring((t - UI.pulse) / 1000, 6, 0.45)) : 1;
      x.save(); x.translate(wx + ww / 2, Y - 7); x.scale(pop, pop); pen.write(x, w[0], -ww / 2, 7, sz, { weight: on ? 'heavy' : 'thin', color: on ? (w[1] === 'skip' ? RED : INK) : hov ? INK : PEN }); x.restore();
      if (on) uiLoop(x, wx + ww / 2, Y - 8, (ww / 2 + 9) * pop, 13 * pop, w[1] === 'skip' ? RED : INK, 2.4);
      UI.hit.push({ x: wx - gap / 2, y: Y - 26, w: ww + gap, h: 36, act: w[1] }); wx += ww + gap; }); }
  // the way home: an arrow going round, shown while the molecule is turned
  if (TW.was) { const cx = (TW.btn || [1004, 138])[0], cy = (TW.btn || [1004, 138])[1], r = 17, hov = UI.hov === 'home', col = hov ? RED : INK; x.save(); x.fillStyle = 'rgba(244,243,238,0.88)'; x.beginPath(); x.ellipse(cx, cy, 26, 24, 0, 0, 6.3); x.fill(); x.restore(); uiLoop(x, cx, cy, 26, 24, col, 2.6);
    x.save(); x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath(); x.arc(cx, cy, r - 3, -0.4, 4.3); x.stroke(); const ax = cx + (r - 3) * Math.cos(-0.4), ay = cy + (r - 3) * Math.sin(-0.4); x.beginPath(); x.moveTo(ax + 6, ay - 6); x.lineTo(ax - 5, ay - 3); x.lineTo(ax + 3, ay + 6); x.closePath(); x.fill(); x.restore();
    pen.write(x, 'lay flat', cx, cy + 45, 17, { color: INK, align: 'center' }); UI.hit.push({ x: cx - 34, y: cy - 30, w: 68, h: 84, act: 'home' }); }
}
// after a skip nothing left over from the step that was under way may pull the count or the numeral back
function skipGuard(S) { const ct = S.count, t = now(); if (S.nums.some(q => !q.combo)) S.nums = S.nums.filter(q => q.combo); if (ct.to !== S.finY || ct.target !== S.finY) { ct.frozen = false; ct.from = ct.shown; ct.to = S.finY; ct.t0 = t; ct.dur = 200; ct.ease = 'outQuart'; ct.target = S.finY; S.landed = Math.max(S.landed || 0, t + 220); } }
function frameC(t, dt) { if (F.seq && F.seq.skipHit && F.seq.finY != null) skipGuard(F.seq); frame(t, dt); if (F.mute && !F.seq) F.mute = false; try { twistFrame(t, dt); uiFrame(t); } catch (e) { if (!F.cErr) { F.cErr = String((e && e.stack) || e); try { console.error(e); } catch (e2) { /* no console */ } } } }

AA.rxFeel = {
  DIR, WORDS,
  attach(a) { api = a; T = a.T; return AA.rxFeel; },
  on, owns: () => on() && !!F.seq,
  get mode() { return mode; },
  set(n) { mode = Math.max(0, Math.min(6, n | 0)); try { root.localStorage.setItem(KEY, String(mode)); } catch (e) { /* storage blocked */ } return mode; },
  reset() { if (F.seq) { F.seq.dead = true; F.seq = null; } },
  fire: fireC, throwThen, onReact: onReactC, hit, k, ease, pose, unlock, pageEnd: pageEndC, frame: frameC, ink, Tn, phases, noteKick, vibeLevel,
  later, twistPt, twistHit, seenAt, pace: () => PACE, setPace, skip: skipNow, armSkip, twistBy, twistHome, twistState, uiSpots: () => UI.hit.map(h => Object.assign({}, h)),
  dbg: () => [F.ovN, F.ovT, F.ov && F.ov.t, now(), !!F.seq, F.ovL],
  stepMs: n => Tn(n), log: F.log, probeRows: F.probeRows, probe: false,
  state: () => F.seq && { steps: F.seq.steps, N: F.seq.plan.N, shown: F.seq.count.shown, zoom: F.seq.zoom, shake: F.seq.shake, words: F.seq.words.map(w => w.k), speed: F.seq.speed, done: F.seq.done, plan: F.seq.plan.ev.map(e => e.k + (e.n || '')).join('') }
};
})(typeof globalThis !== 'undefined' ? globalThis : window);
