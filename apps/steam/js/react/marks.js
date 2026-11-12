// Overreact: the marks of the spec. Each is a small hand-drawn icon in the pen's ink on a 100 by 100 box, readable at 28 px.
//   AA.rxMarks.draw(ctx, name, cx, cy, size, o)    o: { ink, faint, red, blue, gold, lw, frac, met }
//     frac (0..1) draws the mark faint and fills it from the bottom up to that share in ink; met draws it whole, in o.green.
//   AA.rxMarks.resolve(spec)  the mark name to draw for a spec { name, mark, kind }
//   AA.rxMarks.names          every drawn mark;  AA.rxMarks.plain[name]  the plain condition, N for the number
// The set is one hand: round caps, a stroke of 7 units, a little wobble that is the same on every frame, ink first, red for oxygen,
// blue for nitrogen and water, gold for sulfur and flame, a faint wash for what is meant but not counted.
(function (root) {
const AA = root.AA = root.AA || {};
let c = null, K = null, jseed = 1;
const rnd = () => { jseed = (jseed * 16807) % 2147483647; return jseed / 2147483647 - 0.5; };
const J = 1.1;
const jp = (x, y) => [x + rnd() * 2 * J, y + rnd() * 2 * J];
// ---- helpers, all in the 100 box ----
function begin(col, w) { c.beginPath(); c.strokeStyle = col || K.ink; c.lineWidth = w || K.lw; }
function seg(x0, y0, x1, y1) { const a = jp(x0, y0), b = jp(x1, y1), m = jp((x0 + x1) / 2, (y0 + y1) / 2); c.moveTo(a[0], a[1]); c.quadraticCurveTo(m[0], m[1], b[0], b[1]); }
function line(x0, y0, x1, y1, col, w) { begin(col, w); seg(x0, y0, x1, y1); c.stroke(); }
function path(pts, col, w, close) { begin(col, w); pts.forEach((p, i) => { if (i) seg(pts[i - 1][0], pts[i - 1][1], p[0], p[1]); }); if (close) seg(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1]); c.stroke(); }
function vtx(cx, cy, r, n, rot) { const o = []; for (let k = 0; k < n; k++) { const a = (rot == null ? -Math.PI / 2 : rot) + k * 2 * Math.PI / n; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; }
function poly(cx, cy, r, n, col, w, rot, fill) { const v = vtx(cx, cy, r, n, rot); if (fill) { c.beginPath(); v.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fillStyle = fill; c.fill(); } path(v, col, w, true); return v; }
function circ(cx, cy, r, col, w, fill) { c.beginPath(); c.ellipse(cx + rnd() * J, cy + rnd() * J, r * (1 + rnd() * 0.06), r * (1 + rnd() * 0.06), rnd(), 0, 6.3); if (fill) { c.fillStyle = fill; c.fill(); } if (col !== null) { c.strokeStyle = col || K.ink; c.lineWidth = w || K.lw; c.stroke(); } }
function dot(x, y, r, col) { c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fillStyle = col || K.ink; c.fill(); }
// an atom: a disk of its color with a ring of ink, the way the molecule draws them
function atom(x, y, r, col) { circ(x, y, r, K.ink, K.lw * 0.6, col || K.slate); }
function dash(x0, y0, x1, y1, col, w) { begin(col, w); c.setLineDash([6, 7]); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.setLineDash([]); }
function head(x, y, a, s, col, w) { begin(col, w); c.moveTo(x + s * Math.cos(a + 2.5), y + s * Math.sin(a + 2.5)); c.lineTo(x, y); c.lineTo(x + s * Math.cos(a - 2.5), y + s * Math.sin(a - 2.5)); c.stroke(); }
function arrow(x0, y0, x1, y1, col, w, both) { line(x0, y0, x1, y1, col, w); const a = Math.atan2(y1 - y0, x1 - x0); head(x1, y1, a + Math.PI, 11, col, w); if (both) head(x0, y0, a, 11, col, w); }
function dbl(x0, y0, x1, y1, col, w) { const d = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / d * 4.5, ny = (x1 - x0) / d * 4.5; line(x0 + nx, y0 + ny, x1 + nx, y1 + ny, col, w); line(x0 - nx, y0 - ny, x1 - nx, y1 - ny, col, w); }
function bolt(x, y, s, col) { c.beginPath(); c.moveTo(x + 5 * s, y - 14 * s); c.lineTo(x - 7 * s, y + 3 * s); c.lineTo(x, y + 3 * s); c.lineTo(x - 5 * s, y + 16 * s); c.lineTo(x + 8 * s, y - 3 * s); c.lineTo(x + 1 * s, y - 3 * s); c.closePath(); c.fillStyle = col || K.gold; c.fill(); c.strokeStyle = K.ink; c.lineWidth = K.lw * 0.6; c.lineJoin = 'round'; c.stroke(); }
function jar(cx, cy, w, h, fill, level) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, r = Math.min(10, w / 3);
  if (fill) { c.beginPath(); const top = y1 - (y1 - y0 - 6) * (level == null ? 1 : level); c.moveTo(x0 + 1, top); c.lineTo(x1 - 1, top); c.lineTo(x1 - 1, y1 - r); c.quadraticCurveTo(x1 - 1, y1 - 1, x1 - r, y1 - 1); c.lineTo(x0 + r, y1 - 1); c.quadraticCurveTo(x0 + 1, y1 - 1, x0 + 1, y1 - r); c.closePath(); c.fillStyle = fill; c.fill(); }
  begin(K.ink, K.lw); c.moveTo(x0 + 4, y0 - 6); c.lineTo(x1 - 4, y0 - 6); c.moveTo(x0 + 2, y0); c.lineTo(x1 - 2, y0); c.moveTo(x0, y0 + 6); c.lineTo(x0, y1 - r); c.quadraticCurveTo(x0, y1, x0 + r, y1); c.lineTo(x1 - r, y1); c.quadraticCurveTo(x1, y1, x1, y1 - r); c.lineTo(x1, y0 + 6); c.stroke();
}
function clock(x, y, r) { circ(x, y, r, K.ink, K.lw * 0.8, K.paper); line(x, y, x, y - r * 0.6, K.ink, K.lw * 0.7); line(x, y, x + r * 0.5, y + r * 0.2, K.ink, K.lw * 0.7); }
function tick(x0, y0, x1, y1) { line(x0, y0, x1, y1, K.ink, K.lw * 0.9); }
const SQ = (x, y, s, col, w, fill) => { if (fill) { c.fillStyle = fill; c.fillRect(x - s / 2, y - s / 2, s, s); } path([[x - s / 2, y - s / 2], [x + s / 2, y - s / 2], [x + s / 2, y + s / 2], [x - s / 2, y + s / 2]], col, w, true); };
const TRI = (x, y, s, col, w, fill) => poly(x, y + s * 0.1, s * 0.62, 3, col, w, undefined, fill);
// ---- the marks ----
const M = {};
M.ring = () => { poly(0, 0, 36, 6); };
M.ring5 = () => { const v = poly(0, 2, 36, 5); v.forEach(p => dot(p[0], p[1], 6.5)); };
M.ring6 = () => { const v = poly(0, 0, 36, 6); v.forEach(p => dot(p[0], p[1], 6.5)); };
M.joined = () => { poly(-21, 0, 25, 6, K.ink, K.lw, undefined); poly(21, 0, 25, 6); const x = 21 - 25 * 0.866; line(x, -12.5, x, 12.5, K.ink, K.lw * 1.5); };
M.islands = () => { poly(-22, -20, 15, 6); poly(-4, -20, 15, 6); poly(24, 24, 17, 6); dash(-40, 8, 40, 8, K.faint, 4); };
M.spiro = () => { poly(0, 19, 25, 6, K.ink, K.lw, undefined); poly(0, -26, 22, 5, K.ink, K.lw, Math.PI / 2); dot(0, -4, 8, K.red); };
M.cage = () => { const a = 38, x = -30, y = -2, o = 17; path([[x, y], [x + a, y], [x + a, y + a], [x, y + a]], K.ink, K.lw, true); line(x, y, x + o, y - o); line(x + a, y, x + a + o, y - o); line(x + a, y + a, x + a + o, y + a - o); line(x + o, y - o, x + a + o, y - o); line(x + a + o, y - o, x + a + o, y + a - o); dash(x + o, y - o, x + o, y + a - o, K.faint, 4); dash(x + o, y + a - o, x + a + o, y + a - o, K.faint, 4); dash(x + o, y + a - o, x, y + a, K.faint, 4); };
M.ring_o = () => { const v = poly(0, 0, 36, 6); atom(v[0][0], v[0][1], 11, K.red); };
M.ring_fill = () => { const v = poly(0, 0, 36, 6, K.ink, K.lw, undefined, K.wash); for (let k = -3; k <= 3; k++) { c.save(); c.beginPath(); v.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.clip(); line(-40, k * 12 + 20, 40, k * 12 - 20, K.ink, 3); c.restore(); } v.forEach(p => dot(p[0], p[1], 5.5)); };
M.ring_sizes = () => { circ(-32, 21, 9); circ(-8, 15, 15); circ(24, 9, 21); line(-44, 34, 46, 34, K.faint, 4); };
M.bigring = () => { poly(0, 0, 42, 12); poly(0, 0, 14, 6, K.faint, 5); };
M.chain = () => { const p = [[-40, 6], [-20, -12], [0, 6], [20, -12], [40, 6]]; path(p, K.ink, K.lw); p.forEach(q => dot(q[0], q[1], 6)); line(-40, 34, 40, 34, K.ink, 5); [-40, -20, 0, 20, 40].forEach(x => line(x, 28, x, 40, K.ink, 4)); };
M.span = () => { const p = [[-36, 6], [-18, -10], [0, 4], [18, -14], [36, -2]]; path(p, K.ink, K.lw); p.forEach(q => dot(q[0], q[1], 5.5)); arrow(-38, 32, 38, 32, K.ink, 5, true); line(-36, 14, -36, 40, K.faint, 3); line(36, 6, 36, 40, K.faint, 3); };
M.fork = () => { line(0, 40, 0, 6); line(0, 6, -26, -22); line(0, 6, 26, -22); line(-13, -8, -42, -8); dot(-26, -22, 6); dot(26, -22, 6); dot(-42, -8, 6); dot(0, 40, 6); dot(0, 6, 9, K.red); dot(-13, -8, 7, K.red); };
M.big = () => { circ(-30, 30, 10, K.faint, 5); arrow(-18, 16, -6, 4, K.ink, 6); poly(18, -16, 27, 6); };
M.cut = () => { poly(-18, -18, 27, 6, K.faint, 5); arrow(8, 8, 18, 18, K.ink, 6); poly(32, 32, 12, 6); };
M.cut_end = () => { M.cut(); line(46, 10, 46, 46, K.ink, 5); };
M.size = () => { circ(-28, -8, 10); circ(22, -8, 24); arrow(-40, 34, 42, 34, K.ink, 5, true); };
M.kinds = () => { SQ(-30, 0, 24, K.ink, K.lw, K.blue2); TRI(0, 0, 28, K.ink, K.lw, K.gold2); circ(30, 0, 13, K.ink, K.lw, K.red2); };
M.kinds_less = () => { M.kinds(); arrow(0, 20, 0, 44, K.ink, 5); };
M.co = () => { dbl(-18, 0, 18, 0, K.ink, K.lw * 0.8); atom(-24, 0, 13, K.slate); atom(24, 0, 13, K.red); };
M.cc = () => { dbl(-18, 0, 18, 0, K.ink, K.lw * 0.8); atom(-24, 0, 13, K.slate); atom(24, 0, 13, K.slate); };
M.oh = () => { line(-30, 6, 0, 6, K.ink, K.lw * 0.8); line(0, 6, 24, -14, K.ink, K.lw * 0.8); atom(-30, 6, 12, K.slate); atom(0, 6, 12, K.red); atom(26, -16, 9, K.paper); };
const keep = fn => () => { c.save(); c.scale(0.8, 0.8); fn(); c.restore(); path([[-46, -34], [46, -34], [46, 34], [-46, 34]], K.ink, 4, true); };
M['keep_C=O'] = keep(M.co); M.keep_CO = M['keep_C=O']; M.keep_CC = keep(M.cc); M.keep_OH = keep(M.oh);
M.conjugated = () => { const p = [[-40, 12], [-20, -12], [0, 12], [20, -12], [40, 12]]; path(p, K.wash2, 14); path(p, K.ink, K.lw * 0.9); dbl(-40, 12, -20, -12, K.ink, K.lw * 0.7); dbl(0, 12, 20, -12, K.ink, K.lw * 0.7); p.forEach(q => dot(q[0], q[1], 5.5)); };
M.double = () => { dbl(-18, -20, 18, -20, K.ink, K.lw * 0.8); atom(-24, -20, 11, K.slate); atom(24, -20, 11, K.slate); dbl(-18, 24, 18, 24, K.ink, K.lw * 0.8); atom(-24, 24, 11, K.slate); atom(24, 24, 11, K.red); };
M.unsat = () => { poly(-20, 0, 25, 6); dbl(16, 0, 38, 0, K.ink, K.lw * 0.8); atom(14, 0, 7, K.slate); atom(40, 0, 7, K.slate); };
M.hetero = () => { line(-26, 14, 0, -14); line(0, -14, 26, 14); atom(-26, 14, 11, K.slate); atom(0, -14, 11, K.red); atom(26, 14, 11, K.blue); circ(0, -14, 19, K.ink, 4); circ(26, 14, 19, K.ink, 4); };
M.elements = () => { atom(-18, -18, 15, K.slate); atom(20, -16, 12, K.red); atom(-16, 22, 11, K.blue); atom(22, 22, 14, K.gold); };
M.first = () => { circ(-30, -10, 13, K.ink, K.lw, K.ink); circ(0, -10, 13); circ(30, -10, 13); bolt(-30, 28, 1.1); };
M.third = () => { circ(-30, -10, 13); circ(0, -10, 13); circ(30, -10, 13, K.ink, K.lw, K.ink); bolt(30, 28, 1.1); };
M.kinds_turn = () => { SQ(-28, -18, 20, K.ink, K.lw * 0.9); TRI(0, -18, 22, K.ink, K.lw * 0.9); circ(28, -18, 11, K.ink, K.lw * 0.9); begin(K.ink, K.lw); c.arc(0, 14, 22, 0.2, 2 * Math.PI - 1.4); c.stroke(); head(-11.6, 34.4 + 0, 2.6, 11, K.ink, K.lw); };
M.three_feed = () => { [-30, 0, 30].forEach(x => { circ(x, -28, 10); arrow(x, -14, x, 12, K.ink, 5); dot(x, 30, 8); }); };
M.trigger = () => { circ(0, 24, 14); [[-30, -20], [0, -32], [30, -20]].forEach((p, i) => { line(i === 1 ? 0 : i === 0 ? -9 : 9, 12, p[0], p[1] + 8, K.ink, 5); if (i === 0) SQ(p[0], p[1], 14, K.ink, 5, K.blue2); else if (i === 1) TRI(p[0], p[1], 15, K.ink, 5, K.gold2); else circ(p[0], p[1], 8, K.ink, 5, K.red2); }); };
M.no_dead = () => { [-30, 0, 30].forEach(x => circ(x, 6, 13, K.ink, K.lw, K.ink)); path([[-44, -22], [-44, -32], [44, -32], [44, -22]], K.ink, 4); };
M.acted = () => { circ(-30, 0, 13, K.ink, K.lw, K.ink); circ(0, 0, 13, K.ink, K.lw, K.ink); circ(30, 0, 13, K.faint, K.lw); [-30, 0].forEach(x => line(x, -22, x, -34, K.ink, 5)); };
M.acted_kinds = () => { SQ(-30, 0, 22, K.ink, K.lw, K.ink); poly(0, 2, 15, 3, K.ink, K.lw, undefined, K.ink); circ(30, 0, 12, K.ink, K.lw, K.ink); };
M.held = () => { circ(-30, 0, 13, K.ink, K.lw, K.ink); circ(0, 0, 13, K.faint, K.lw); circ(30, 0, 13, K.faint, K.lw); arrow(0, -24, 0, -40, K.ink, 5); };
M.self_ring = () => { const v = vtx(0, 0, 34, 6); path(v.slice(0, 6), K.ink, K.lw); dash(v[5][0], v[5][1], v[0][0], v[0][1], K.red, K.lw); v.forEach(p => dot(p[0], p[1], 6)); begin(K.red, 5); c.arc(0, 0, 14, -2.2, 0.6); c.stroke(); head(12.4, 7.9, 1.9, 10, K.red, 5); };
M.self_snap = () => { line(-44, 0, -12, 0); line(12, 0, 44, 0); dot(-44, 0, 6); dot(44, 0, 6); path([[-6, -22], [5, -8], [-5, 6], [6, 22]], K.red, 6); line(-24, -20, -16, -12, K.ink, 4); line(24, -20, 16, -12, K.ink, 4); line(-24, 20, -16, 12, K.ink, 4); line(24, 20, 16, 12, K.ink, 4); };
M.off_all = () => { jar(0, 6, 56, 70, K.wash, 0.8); circ(-10, 26, 7, K.ink, 5, K.paper); circ(10, 14, 6, K.ink, 5, K.paper); circ(-3, -2, 5, K.ink, 5, K.paper); };
M.water = () => { c.beginPath(); c.moveTo(0, -42); c.bezierCurveTo(8, -24, 28, -8, 28, 12); c.arc(0, 12, 28, 0, Math.PI); c.bezierCurveTo(-28, -8, -8, -24, 0, -42); c.fillStyle = K.blue2; c.fill(); c.strokeStyle = K.ink; c.lineWidth = K.lw; c.stroke(); line(-14, 10, -14, 20, K.ink, 5); };
M.water_only = () => { jar(-22, 8, 26, 50); jar(18, 2, 44, 62, K.blue2, 0.85); };
M.gas_only = () => { jar(0, 12, 56, 58); circ(-10, 30, 7, K.ink, 5); circ(10, 18, 6, K.ink, 5); circ(-2, 4, 5, K.ink, 5); [[-10, -26], [6, -36]].forEach(p => circ(p[0], p[1], 5, K.ink, 4)); };
M.jar_hydrogen = () => { jar(0, 6, 60, 74); line(-12, 16, 12, 16, K.ink, 5); circ(-14, 16, 11, K.ink, 5, K.paper); circ(14, 16, 11, K.ink, 5, K.paper); };
M.jar_carbon_dioxide = () => { jar(0, 6, 72, 74); line(-22, 16, 22, 16, K.ink, 5); circ(-24, 16, 9, K.ink, 5, K.red); circ(0, 16, 9, K.ink, 5, K.slate); circ(24, 16, 9, K.ink, 5, K.red); };
M.jars = () => { jar(-32, 12, 22, 48, K.blue2, 0.8); jar(0, 4, 24, 64, K.slate2, 0.5); jar(32, 14, 22, 44, K.gold2, 0.9); };
M.puff = () => { c.beginPath(); c.moveTo(-34, 22); c.bezierCurveTo(-52, 22, -52, -4, -32, -4); c.bezierCurveTo(-34, -30, 4, -36, 8, -16); c.bezierCurveTo(26, -28, 44, -6, 34, 6); c.bezierCurveTo(50, 8, 46, 22, 32, 22); c.closePath(); c.fillStyle = K.wash; c.fill(); c.strokeStyle = K.ink; c.lineWidth = K.lw; c.stroke(); circ(-12, 8, 5, K.ink, 4); circ(8, 6, 5, K.ink, 4); circ(22, 12, 4, K.ink, 4); arrow(0, 32, 0, 46, K.ink, 4); };
M.wisp = () => { begin(K.ink, K.lw); c.moveTo(0, 42); c.bezierCurveTo(-26, 26, 22, 12, 0, -4); c.bezierCurveTo(-22, -20, 10, -28, 8, -44); c.stroke(); begin(K.ink, 5); c.moveTo(-16, 44); c.lineTo(16, 44); c.stroke(); };
M.flame = () => { c.beginPath(); c.moveTo(2, -44); c.bezierCurveTo(10, -22, 32, -10, 28, 16); c.bezierCurveTo(26, 40, -26, 40, -28, 14); c.bezierCurveTo(-30, -2, -14, -8, -12, -26); c.bezierCurveTo(-4, -20, 0, -32, 2, -44); c.fillStyle = K.gold2; c.fill(); c.strokeStyle = K.ink; c.lineWidth = K.lw; c.stroke(); begin(K.ink, 5); c.moveTo(0, 32); c.bezierCurveTo(-12, 28, -10, 14, 0, 6); c.bezierCurveTo(10, 16, 12, 28, 0, 32); c.stroke(); };
M.deadline_off_all = () => { c.save(); c.translate(-8, 8); c.scale(0.78, 0.78); M.off_all(); c.restore(); clock(30, -28, 15); };
M.ring_by2 = () => { c.save(); c.translate(-8, 8); c.scale(0.78, 0.78); M.ring(); c.restore(); clock(30, -28, 15); };
M.lean = () => { [-30, 0, 30].forEach(x => { SQ(x, 0, 24, K.ink, 5); arrow(x, -6, x, 8, K.ink, 5); }); };
M.few = () => { circ(-14, 0, 17); circ(22, 0, 17); };
// ---- names ----
const ALIAS = { 'keep_C=O': 'keep_C=O', jar_acid: 'wisp', jar_acid_fumes: 'wisp', off_acid: 'wisp', acid: 'wisp', jar_nh3: 'wisp', jar_ammonia: 'wisp', off_other: 'flame', jar_sulfur: 'flame', jar_other: 'flame', sulfur: 'flame', ring_pair: 'joined', grow: 'big', ladder_chain: 'chain', groups: 'kinds', gas: 'gas_only', end_CO: 'keep_C=O', end_CC: 'keep_CC', end_OH: 'keep_OH', finish_smaller: 'cut_end', lean_turns: 'lean', pure_water: 'water_only', pure_gas: 'gas_only', fewer_groups: 'kinds_less', through_ring: 'self_ring', through_dry: 'self_snap', ring_oxygen: 'ring_o', opening_burst: 'first', quiet_then_loud: 'third', unused_reagents: 'held', held_back: 'held', clean_turns: 'no_dead', kinds_gain: 'kinds', 'keep_C=C': 'keep_CC', by_two_rings: 'ring_by2' };
const PLAIN = {
  ring: 'at least N more rings', ring5: 'at least N more rings of five atoms', ring6: 'at least N more rings of six atoms', joined: 'at least N more pairs of rings that share a side', islands: 'at least N more separate groups of rings', spiro: 'at least N more atoms where two rings meet at a point', cage: 'at least N more bridgehead atoms (a cage)', ring_o: 'at least N more rings with an oxygen, nitrogen or sulfur', ring_fill: 'at least N more atoms inside rings', ring_sizes: 'at least N more different ring sizes', bigring: 'a ring of N atoms or more',
  chain: 'a carbon chain N longer than at the start', span: 'N bonds longer end to end', fork: 'at least N more branch points', big: 'at least N atoms bigger than the start', cut: 'at least N atoms smaller than the start', cut_end: 'at least N atoms smaller at the finish', size: 'swing the size by at least N atoms',
  kinds: 'at least N kinds of group on the molecule at once', kinds_less: 'at least N fewer kinds of group', co: 'C=O group', cc: 'C=C group', oh: 'OH group', 'keep_C=O': 'at least N C=O groups still standing at the end', keep_CC: 'at least N more C=C at the finish', keep_OH: 'at least N more OH at the finish',
  conjugated: 'a run of alternating bonds N atoms longer', double: 'at least N more double bonds', unsat: 'at least N more rings and double bonds together', hetero: 'at least N more atoms that are not carbon', elements: 'at least N more different elements besides carbon',
  first: 'the first reagent of a turn sets off at least N steps', third: 'the third reagent of a turn sets off at least N steps', kinds_turn: 'at least N different reflexes in one turn', three_feed: 'at least N turns where each of the three reagents sets something off', trigger: 'at least N different reagents that set something off', no_dead: 'at least N turns where all three reagents found something to act on', acted: 'at least N reagents fired found something to act on', acted_kinds: 'at least N different reagents that found something to act on', held: 'at least N turns firing fewer than three',
  self_ring: 'at least N steps of ring closing', self_snap: 'at least N steps of snap', off_all: 'at least N things driven off over the round', water: 'at least N water driven off', water_only: 'at least N more water than other runoff', gas_only: 'at least N more gas than water', jar_hydrogen: 'at least N hydrogen driven off', jar_carbon_dioxide: 'at least N carbon dioxide driven off', jars: 'at least N different things driven off', puff: 'at least N things driven off in one turn', wisp: 'at least N other runoff (fumes) driven off', flame: 'at least N other runoff (sulfur, heat) driven off', deadline_off_all: 'at least N driven off, by the end of turn two', ring_by2: 'at least N more rings, by the end of turn two', lean: 'at least N turns ending smaller', few: 'at most N reagents'
};
const PAL = { slate: '#5b667d', paper: '#fbf6e6' };
function kit(o, tone) {
  o = o || {};
  const ink = tone || o.ink || '#2a2118';
  return { ink, faint: o.faint || 'rgba(60,45,30,0.32)', red: o.red || '#d6372c', blue: o.blue || '#3f6fb5', gold: o.gold || '#d9a82a', slate: PAL.slate, paper: PAL.paper, lw: o.lw || 7,
    wash: 'rgba(120,90,50,0.16)', wash2: 'rgba(217,168,42,0.45)', blue2: 'rgba(63,111,181,0.42)', gold2: 'rgba(217,168,42,0.55)', red2: 'rgba(214,55,44,0.45)', slate2: 'rgba(91,102,125,0.45)' };
}
const resolve = h => { if (!h) return null; const k = [h.name && ({ by_two_rings: 'ring_by2' })[h.name] || h.mark, h.kind, h.name]; for (const x of k) { if (!x) continue; const y = ALIAS[x] || x; if (M[y]) return y; } return null; };
function hash(s) { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 2147483647; return h || 1; }
function one(ctx, name, size, tone, o) { c = ctx; K = kit(o, tone); jseed = hash(name); c.lineCap = 'round'; c.lineJoin = 'round'; M[name](); }
function draw(ctx, name, cx, cy, size, o) {
  const key = ALIAS[name] || name; if (!M[key]) return false; o = o || {};
  ctx.save(); ctx.translate(cx, cy); ctx.scale(size / 100, size / 100); ctx.setLineDash([]);
  if (o.frac != null && !o.met) {
    one(ctx, key, size, 'rgba(70,52,34,0.45)', Object.assign({}, o, { red: 'rgba(214,55,44,0.42)', blue: 'rgba(63,111,181,0.42)', gold: 'rgba(217,168,42,0.45)' }));
    if (o.frac > 0) { ctx.save(); ctx.beginPath(); const f = Math.max(0.06, Math.min(1, o.frac)); ctx.rect(-60, 50 - 100 * f, 120, 100 * f + 10); ctx.clip(); one(ctx, key, size, null, o); ctx.restore(); }
  } else one(ctx, key, size, o.met ? (o.green || '#1c8a4a') : null, Object.assign({}, o, o.met ? { lw: (o.lw || 7) * 1.18 } : {}));
  ctx.restore(); return true;
}
AA.rxMarks = { draw, resolve, names: Object.keys(M), alias: ALIAS, plain: PLAIN, plainOf: (name, n) => { const k = ALIAS[name] || name; return (PLAIN[k] || PLAIN[name] || '').replace(/\bN\b/g, n == null ? 'N' : n); } };

// ---- the motifs (docs/tools_chem/TRAITS.md "For the page"): the picture is the count, one piece a level, up to six ----
// AA.rxMarks.motif(ctx, id, cx, cy, level, size, o)   o: { pop: { k, s }, drop: { k, f }, outline }   pop scales piece k in (s 0..1.25); drop lets piece k fall away (f 0..1)
const MOT = {
  sugar: { col: '#c0489a', rate: 0.07 }, resonance: { col: '#b0189a', rate: 0.08 }, ring: { col: '#2f8f6a', rate: 0.05 }, benzene: { col: '#a8791a', rate: 0.30 },
  shared: { col: '#1f8a8a', rate: 0.15 }, cage: { col: '#c8261c', rate: 0.03 }, spiro: { col: '#3466b8', rate: 0.10 }, acid: { col: '#d9731a', rate: 0.25 },
  amine: { col: '#6a4fc2', rate: 0.20 }, sulfur: { col: '#d6b21a', rate: 0.35 }, branch: { col: '#7a5a3a', rate: 0.04 }, chain: { col: '#5a6475', rate: 0.12 }
};
const MALIAS = { benzene_ring: 'benzene', shared_side: 'shared', spiro_centre: 'spiro', sulfur_bridge: 'sulfur', branch_point: 'branch', long_chain: 'chain', fused: 'shared' };
const MOTDRAW = {
  sugar: (n, pc, col) => { for (let i = 0; i < n; i++) pc(i, 0, 40 - 15 * i - 7, () => { c.fillStyle = col; c.fillRect(-26, -7, 52, 14); c.strokeStyle = K.ink; c.lineWidth = 5; c.strokeRect(-26, -7, 52, 14); }); },
  resonance: (n, pc, col) => { begin(col, 8); const W = 88, h = W / n; c.moveTo(-44, 14); for (let i = 0; i < n; i++) { const x0 = -44 + i * h; pc(i, 0, 0, () => {}); c.bezierCurveTo(x0 + h * 0.2, -34, x0 + h * 0.8, -34, x0 + h, 14); } c.stroke(); },
  ring: (n, pc, col) => { const r = Math.min(24, 44 / n), step = Math.min(2 * r * 0.95, 88 / n); for (let i = 0; i < n; i++) pc(i, -44 + r + i * step, 0, () => poly(0, 0, r, 6, col, 7)); },
  benzene: (n, pc, col) => { const r = Math.min(24, 44 / n), step = Math.min(2 * r * 0.95, 88 / n); for (let i = 0; i < n; i++) pc(i, -44 + r + i * step, 0, () => { poly(0, 0, r, 6, col, 7); circ(0, 0, r * 0.5, col, 4.5); }); },
  shared: (n, pc, col) => { const r = Math.min(20, 44 / (n + 1)), step = r * 1.74; for (let i = 0; i < n + 1; i++) pc(i, -44 + r + i * step, 0, () => poly(0, 0, r, 6, col, 7)); },
  cage: (n, pc, col) => { const E = [[[-20, 4], [20, 4]], [[20, 4], [20, 44]], [[20, 44], [-20, 44]], [[-20, 44], [-20, 4]], [[-20, 4], [-4, -12]], [[20, 4], [36, -12]], [[20, 44], [36, 28]], [[-4, -12], [36, -12]], [[36, -12], [36, 28]], [[-20, 44], [-4, 28]], [[-4, 28], [36, 28]], [[-4, -12], [-4, 28]]]; for (let i = 0; i < Math.min(12, n + 2); i++) pc(i, 0, 0, () => line(E[i][0][0], E[i][0][1] - 14, E[i][1][0], E[i][1][1] - 14, col, 8)); },
  spiro: (n, pc, col) => { const r = Math.min(18, 80 / (n * 2)), step = r * 1.5; for (let i = 0; i < n + 1; i++) pc(i, -40 + r + i * step * 1.2, 0, () => poly(0, 0, r, 5, col, 7)); },
  acid: (n, pc, col) => { const r = Math.min(20, 44 / n), step = Math.min(2 * r * 1.15, 88 / n); for (let i = 0; i < n; i++) pc(i, -44 + r + i * step, 4, () => { c.beginPath(); c.moveTo(0, -r * 1.7); c.bezierCurveTo(r * 0.3, -r, r, -r * 0.2, r, r * 0.5); c.arc(0, r * 0.5, r, 0, Math.PI); c.bezierCurveTo(-r, -r * 0.2, -r * 0.3, -r, 0, -r * 1.7); c.fillStyle = col; c.fill(); c.strokeStyle = K.ink; c.lineWidth = 4; c.stroke(); }); },
  amine: (n, pc, col) => { const step = Math.min(34, 88 / n); for (let i = 0; i < n; i++) pc(i, -44 + 17 + i * step, 8, () => { [-9, 0, 9].forEach(dx => line(dx * 0.6, 20, dx, -14, col, 6)); line(-12, 20, 12, 20, col, 6); }); },
  sulfur: (n, pc, col) => { const w = Math.min(34, 88 / n), step = Math.min(w + 6, 88 / n); for (let i = 0; i < n; i++) pc(i, -44 + w / 2 + i * step, 12, () => { begin(col, 9); c.arc(0, 8, w / 2, Math.PI, 0); c.stroke(); dot(-w / 2, 8, 4.5, col); dot(w / 2, 8, 4.5, col); }); },
  branch: (n, pc, col) => { for (let i = 0; i < n; i++) pc(i, 0, 0, () => { const y = 36 - 22 * i, w = 16 + 8 * i; line(0, y + 12, 0, y, col, 7); line(0, y, -w, y - 20, col, 7); line(0, y, w, y - 20, col, 7); }); },
  chain: (n, pc, col) => { const pts = [[-44, 30]]; for (let i = 0; i < n * 2 + 1; i++) pts.push([-44 + (i + 1) * Math.min(14, 88 / (n * 2 + 1)), i % 2 ? 30 : 6]); begin(col, 7); pts.forEach((p, i) => { if (i) seg(pts[i - 1][0], pts[i - 1][1], p[0], p[1]); }); c.stroke(); for (let i = 0; i < n; i++) pc(i, pts[2 * i + 1][0], pts[2 * i + 1][1], () => dot(0, 0, 5, col)); }
};
function motif(ctx, id, cx, cy, level, size, o) {
  const key = MALIAS[id] || id, D = MOTDRAW[key]; if (!D) return false; o = o || {}; const n = Math.max(0, Math.min(6, Math.floor(level)));
  ctx.save(); ctx.translate(cx, cy); ctx.scale(size / 100, size / 100); ctx.setLineDash([]);
  c = ctx; K = kit(o); jseed = hash(key); c.lineCap = 'round'; c.lineJoin = 'round';
  const col = MOT[key].col;
  const pc = (i, px0, py0, fn) => { c.save(); c.translate(px0, py0); if (o.pop && o.pop.k === i) c.scale(o.pop.s, o.pop.s); fn(); c.restore(); };
  D(n, (i, px0, py0, fn) => { if (!o.outline) pc(i, px0, py0, fn); else { c.save(); c.translate(px0, py0); c.globalAlpha = 0.4; fn(); c.restore(); } }, o.outline ? 'rgba(70,52,34,0.5)' : col);
  if (o.drop && o.drop.f < 1) { c.save(); c.globalAlpha = 1 - o.drop.f; c.translate(0, o.drop.f * 40); const f0 = o.drop.f; D(n + 1, (i, px0, py0, fn) => { if (i === n) { c.save(); c.translate(px0, py0); fn(); c.restore(); } }, col); c.restore(); }
  ctx.restore(); return true;
}
AA.rxMarks.motif = motif; AA.rxMarks.MOTIFS = MOT; AA.rxMarks.motifIds = Object.keys(MOT);
})(window);
