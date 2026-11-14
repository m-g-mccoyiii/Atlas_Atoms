// One round, played on pages of a lab notebook. The molecule stands in the middle of the page with an inked arrow
// to each molecule it can become. Clicking a product reacts. After three reactions the page turns and the same
// molecule carries on. Reactions that build on one another multiply what is made. Every reading is ink or pencil
// on the page. Rules come from path.js. This file draws and takes input only.
(function (root) {
'use strict';
const AA = root.AA, T = root.THREE, RX = AA.rx, E = AA.ELEMENTS, P = AA.rxPath, sfx = AA.sfx;
const lin = h => new T.Color(h).convertSRGBToLinear();
const rgb = c => 'rgb(' + c.join(',') + ')';
const bright = c => { const m = Math.max(c[0], c[1], c[2], 1), k = Math.max(1, 190 / m); return c.map(q => Math.min(255, Math.round(q * k + 20))); };
const sfxN = (n, ...a) => { try { if (AA.sfx && AA.sfx[n]) AA.sfx[n](...a); } catch (e) { /* sound never breaks play */ } };
const musN = (n, ...a) => { try { if (AA.music && AA.music[n]) AA.music[n](...a); } catch (e) { /* music never breaks play */ } };
const hash = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619); return ((x >>> 0) % 1000) / 1000; };
const fmt = n => Math.round(n).toLocaleString('en-US');
  const fmtK = n => { const t = v => String(Math.round(v * 10) / 10).replace(/\.0$/, ''); return n >= 1e9 ? t(n / 1e9) + 'B' : n >= 1e6 ? t(n / 1e6) + 'M' : n >= 1e5 ? t(n / 1e3) + 'K' : fmt(n); };
const fmtB = n => (n < 100 ? String(Math.round(n * 10) / 10) : fmt(n));
// ?hyd=a|b|c: how a shown hydrogen stands by its atom. a: smaller (0.6 of the radius), the bond as long as before; b: full size, further out;
// c: smaller and further out. The owner picked b (12 November): it is the default. 0 is the old way (for a before picture).
const HYD = (() => { try { const v = new URLSearchParams(root.location.search).get('hyd'); return v === 'a' || v === 'b' || v === 'c' || v === '0' ? v : 'b'; } catch (e) { return 'b'; } })();
const HYDR = HYD === 'a' || HYD === 'c' ? 0.6 : 1, hydGap = Rp => (HYD === 'a' ? 0.32 : Math.max(0.5, Rp));
const BALL = el => Math.min(0.62, 0.2 + 0.36 * E[el].cov) * (el === 'H' ? HYDR : 1);
let INK = '#2b2622', PENCIL = '#5a564e', FAINT = 'rgba(90,86,78,0.35)', REDINK = '#c8261c', GREEN = '#1c8a4a'; const HILITE = 'rgba(255,214,0,0.6)';
// Five sheets for the page to sit on (?paper=1..5, remembered). Each has its own ink colors, the color of the soft shadow under
// the molecule, the table beyond the sheet and the wash laid over the whole view. The sheet itself is drawn in paperDraw.
const PAPERS = {
  1: { name: 'notebook', ink: '#2b2622', pencil: '#5a564e', faint: 'rgba(90,86,78,0.35)', red: '#c8261c', green: '#1c8a4a', sh: '90,70,40', sha: 0.2, bg: '#e9e2d0', veil: ['rgba(255,236,190,0.14)', 'rgba(110,80,40,0.10)'] },
  2: { name: 'parchment', ink: '#2a1f14', pencil: '#5b4a35', faint: 'rgba(80,60,40,0.35)', red: '#9c2a1c', green: '#2f6b3a', sh: '70,45,15', sha: 0.26, bg: '#c9b385', veil: ['rgba(255,230,170,0.12)', 'rgba(90,55,20,0.14)'] },
  3: { name: 'blotter', ink: '#23302a', pencil: '#4f5f55', faint: 'rgba(60,80,70,0.35)', red: '#c0301f', green: '#1c7d46', sh: '40,70,50', sha: 0.18, bg: '#c5d3bb', veil: ['rgba(240,255,225,0.12)', 'rgba(40,80,50,0.08)'] },
  4: { name: 'slate', ink: '#f3eee2', pencil: '#cfc8b8', faint: 'rgba(235,228,212,0.35)', red: '#f08c78', green: '#8fd6a0', sh: '0,0,0', sha: 0.5, bg: '#26211d', veil: ['rgba(255,225,180,0.05)', 'rgba(0,0,0,0.18)'] },
  6: { name: 'lab ruled', ink: '#22252c', pencil: '#4b5160', faint: 'rgba(70,80,100,0.34)', red: '#c0392b', green: '#1f7a4c', sh: '55,60,75', sha: 0.2, bg: '#d8d6cf', veil: ['rgba(255,255,255,0.05)', 'rgba(40,45,70,0.06)'], base: '#f4f3ee' },
  7: { name: 'lab graph', ink: '#22252c', pencil: '#4b5160', faint: 'rgba(70,80,100,0.34)', red: '#c0392b', green: '#1f7a4c', sh: '55,60,75', sha: 0.2, bg: '#d8d6cf', veil: ['rgba(255,255,255,0.05)', 'rgba(40,45,70,0.06)'], base: '#f3f4f1' },
  8: { name: 'lab aged', ink: '#22252c', pencil: '#4b5160', faint: 'rgba(70,80,100,0.34)', red: '#b83a2c', green: '#1f7a4c', sh: '60,58,64', sha: 0.22, bg: '#cfccc4', veil: ['rgba(255,255,255,0.04)', 'rgba(50,45,50,0.08)'], base: '#e5e5e2' },
  5: { name: 'kraft', ink: '#2a1e12', pencil: '#4a3a28', faint: 'rgba(60,40,20,0.35)', red: '#a8231a', green: '#1d6b3a', sh: '60,35,10', sha: 0.28, bg: '#a98657', veil: ['rgba(255,225,170,0.10)', 'rgba(70,40,10,0.14)'] } };
let PAPERN = 8; try { const qp = new URLSearchParams(window.location.search).get('paper'); if (qp && PAPERS[+qp]) { PAPERN = +qp; window.localStorage.setItem('aa_paper3', qp); } else { const sv = +window.localStorage.getItem('aa_paper3'); if (PAPERS[sv]) PAPERN = sv; } } catch (e) { /* no storage */ }
{ const P0 = PAPERS[PAPERN]; INK = P0.ink; PENCIL = P0.pencil; FAINT = P0.faint; REDINK = P0.red; GREEN = P0.green; }
const SHADE = PAPERS[PAPERN].sh, SHADA = PAPERS[PAPERN].sha;
function paperDraw(x, w, h, n, SW0) {
  let sd = n * 7919 + 13; const R = () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296, u = w / SW0, P0 = PAPERS[n];
  x.fillStyle = P0.base; x.fillRect(0, 0, w, h);
  const blotch = (cnt, rad, col, a) => { for (let i = 0; i < cnt; i++) { const cx = R() * w, cy = R() * h, r = rad * (0.4 + R()), g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(' + col + ',' + (a * (0.4 + R() * 0.6)).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); } };
  const fibers = (cnt, len, col, a, lw, ang0, spread) => { x.lineWidth = lw; x.lineCap = 'round'; for (let i = 0; i < cnt; i++) { const cx = R() * w, cy = R() * h, a0 = ang0 + (R() - 0.5) * spread, l = len * (0.4 + R()), bx = (R() - 0.5) * l * 0.4, by = (R() - 0.5) * l * 0.4; x.strokeStyle = 'rgba(' + col + ',' + (a * (0.3 + R() * 0.7)).toFixed(3) + ')'; x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(cx + Math.cos(a0) * l * 0.5 + bx, cy + Math.sin(a0) * l * 0.5 + by, cx + Math.cos(a0) * l, cy + Math.sin(a0) * l); x.stroke(); } };
  const specks = (cnt, col, a) => { for (let i = 0; i < cnt; i++) { x.fillStyle = 'rgba(' + col + ',' + (R() * a).toFixed(3) + ')'; x.fillRect(R() * w, R() * h, 1 + R() * 2, 1 + R() * 2); } };
  const edges = (col, a, depth) => { [[0, 0, 0, depth, 1], [0, h, 0, h - depth, 1], [0, 0, depth, 0, 0], [w, 0, w - depth, 0, 0]].forEach(q => { const g = x.createLinearGradient(q[0], q[1], q[2], q[3]); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); x.fillStyle = g; if (q[4]) x.fillRect(0, Math.min(q[1], q[3]), w, depth); else x.fillRect(Math.min(q[0], q[2]), 0, depth, h); }); };
  const lines = (step, col, lw, vert, horz) => { x.strokeStyle = col; x.lineWidth = lw; if (vert) for (let i = 0; i * step <= w; i++) { x.beginPath(); x.moveTo(i * step, 0); x.lineTo(i * step, h); x.stroke(); } if (horz) for (let j = 0; j * step <= h; j++) { x.beginPath(); x.moveTo(0, j * step); x.lineTo(w, j * step); x.stroke(); } };
  if (n >= 6) { // a lab notebook page, three ways: 6 ruled with punched holes and a coffee ring; 7 graph paper in a spiral binding with a chemical splash; 8 aged, taped, scorched
    specks(24000, '90,95,110', 0.04); blotch(26, 300, '120,120,130', 0.03); blotch(20, 240, '255,255,255', 0.1); fibers(3000, 18, '255,255,255', 0.12, 1, 0, 6.3); fibers(1800, 30, '110,110,125', 0.05, 1, 0, 6.3);
    const pen = (t, px0, py0, sz, col) => { try { AA.rxPen.write(x, t, px0, py0, sz, { weight: 'thin', color: col || 'rgba(70,80,105,0.6)', align: 'left' }); } catch (e) { /* no pen yet */ } };
    if (n === 7) { lines(22, 'rgba(100,140,200,0.3)', 1, true, true); lines(110, 'rgba(95,135,200,0.55)', 1.7, true, true); }
    else { const st = n === 8 ? 40 : 44; x.strokeStyle = n === 8 ? 'rgba(115,145,190,0.5)' : 'rgba(105,145,205,0.58)'; x.lineWidth = 1.8; for (let yy = 196; yy < h; yy += st) { x.beginPath(); x.moveTo(0, yy); x.lineTo(w, yy); x.stroke(); } }
    // the red margin line down one side
    x.strokeStyle = 'rgba(205,60,52,0.72)'; x.lineWidth = 2.6; x.beginPath(); x.moveTo(n === 7 ? 340 : n === 8 && PGE.on ? PGE.linePx : 360, 0); x.lineTo(n === 7 ? 340 : n === 8 && PGE.on ? PGE.linePx : 360, h); x.stroke(); if (n === 6) { x.beginPath(); x.moveTo(372, 0); x.lineTo(372, h); x.stroke(); }
    // the printed header strip along the top: experiment, date, page
    x.strokeStyle = 'rgba(70,80,105,0.5)'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(0, 176); x.lineTo(w, 176); x.stroke();
    if (n === 7) { [[480, 760, 'Expt.'], [800, 1160, 'Date'], [1200, 1520, 'Page 47']].forEach(q => { x.strokeStyle = 'rgba(70,80,105,0.5)'; x.lineWidth = 1.8; x.strokeRect(q[0], 112, q[1] - q[0], 56); pen(q[2], q[0] + 12, 154, 30); }); }
    else if (SHAPE === 'a') { pen('Date', 520, 158, 32); x.strokeStyle = 'rgba(70,80,105,0.4)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(600, 160); x.lineTo(820, 160); x.stroke(); pen('Expt. no.', 1100, 158, 32); x.beginPath(); x.moveTo(1270, 160); x.lineTo(1440, 160); x.stroke(); pen('Page 47', 1700, 158, 32); }
    else { pen('Expt. no.', 520, 158, 32); x.strokeStyle = 'rgba(70,80,105,0.4)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(690, 160); x.lineTo(860, 160); x.stroke(); pen('Date', 930, 158, 32); x.beginPath(); x.moveTo(1010, 160); x.lineTo(1210, 160); x.stroke(); pen('Page 47', n === 8 ? 1450 : 1330, 158, 32); }
    // the binding: punched holes, or a spiral
    if (n === 7) { for (let yy = 200; yy < h * 0.78; yy += 54) { x.fillStyle = 'rgba(60,62,72,0.55)'; x.beginPath(); x.arc(272, yy, 11, 0, 6.3); x.fill(); x.strokeStyle = 'rgba(95,100,115,0.85)'; x.lineWidth = 6; x.beginPath(); x.ellipse(250, yy - 4, 38, 11, -0.15, 0, 6.3); x.stroke(); } }
    else { [0.22, 0.42, 0.62].forEach(f => { const cx = n === 8 && PGE.on ? -999 : 262, cy = h * f; x.fillStyle = 'rgba(0,0,0,0.14)'; x.beginPath(); x.arc(cx + 2, cy + 3, 32, 0, 6.3); x.fill(); x.fillStyle = P0.bg; x.beginPath(); x.arc(cx, cy, 29, 0, 6.3); x.fill(); x.strokeStyle = 'rgba(0,0,0,0.22)'; x.lineWidth = 3.5; x.beginPath(); x.arc(cx, cy, 29, 0.6, 3.6); x.stroke(); }); }
    // stains, whole and inside the page, under the ink
    const ring = (cx, cy, r, a1) => { x.fillStyle = 'rgba(150,105,60,' + (a1 * 0.3).toFixed(3) + ')'; x.beginPath(); x.arc(cx, cy, r, 0, 6.3); x.fill(); for (let k = 0; k < 3; k++) { x.strokeStyle = 'rgba(125,85,45,' + (a1 * (1 - k * 0.28)).toFixed(3) + ')'; x.lineWidth = 11 - k * 3; x.beginPath(); x.arc(cx + R() * 5, cy + R() * 5, r * (1 + k * 0.012), 0.1 + k * 0.5, 5.9 + k * 0.2); x.stroke(); } x.strokeStyle = 'rgba(95,65,35,' + (a1 * 0.9).toFixed(3) + ')'; x.lineWidth = 13; x.beginPath(); x.arc(cx, cy, r * 1.01, 2.4, 3.7); x.stroke(); };
    if (n === 6) { ring(1560, 1030, 90, 0.34); ring(1660, 1075, 64, 0.22); }
    else if (n === 7) { const cx = 1480, cy = 340; x.fillStyle = 'rgba(60,140,160,0.2)'; x.beginPath(); x.ellipse(cx, cy, 46, 38, 0.4, 0, 6.3); x.fill(); for (let k = 0; k < 16; k++) { const a = k * 0.39 + R() * 0.3, d = 62 + R() * 70, rr = 3 + R() * 9; x.fillStyle = 'rgba(60,140,160,' + (0.14 + R() * 0.12).toFixed(2) + ')'; x.beginPath(); x.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rr, 0, 6.3); x.fill(); x.beginPath(); x.moveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40); x.lineTo(cx + Math.cos(a) * (d - rr), cy + Math.sin(a) * (d - rr)); x.strokeStyle = 'rgba(60,140,160,0.12)'; x.lineWidth = 2.5; x.stroke(); } ring(380, 1110, 56, 0.28); }
    else if (true) { edges('120,110,100', 0.18, 140); } else { const cx = 1770, cy = 455, g = x.createRadialGradient(cx, cy, 10, cx, cy, 120); g.addColorStop(0, 'rgba(70,40,15,0.42)'); g.addColorStop(0.45, 'rgba(140,90,40,0.26)'); g.addColorStop(1, 'rgba(160,110,60,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, 130, 100, 0.3, 0, 6.3); x.fill(); x.strokeStyle = 'rgba(60,35,15,0.35)'; x.lineWidth = 6; x.beginPath(); x.ellipse(cx, cy, 70, 52, 0.3, 0.4, 5.6); x.stroke(); ring(205, 770, 74, 0.3);
      x.save(); x.translate(1880, 230); x.rotate(0.62); x.fillStyle = 'rgba(0,0,0,0.1)'; x.fillRect(-150, -26, 320, 70); x.fillStyle = 'rgba(226,225,214,0.82)'; x.fillRect(-150, -34, 320, 68); x.strokeStyle = 'rgba(140,138,125,0.45)'; x.lineWidth = 2; x.strokeRect(-150, -34, 320, 68); x.restore(); edges('120,110,100', 0.18, 140); }
  } else
  if (n === 1) { // aged notebook paper: ruled lines, a faint margin, soft staining at the edges
    specks(40000, '120,100,60', 0.05); blotch(26, 260, '170,125,60', 0.045); lines(u * 1.5, 'rgba(70,120,170,0.2)', 1.4, false, true);
    x.strokeStyle = 'rgba(200,80,80,0.26)'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(u * 4.2, 0); x.lineTo(u * 4.2, h); x.stroke(); x.beginPath(); x.moveTo(u * 4.5, 0); x.lineTo(u * 4.5, h); x.stroke();
    edges('150,105,55', 0.2, 150); blotch(7, 190, '150,100,40', 0.07);
  } else if (n === 2) { // parchment: uneven, fibrous, darker where it has been handled
    blotch(46, 360, '150,105,40', 0.07); blotch(36, 220, '255,245,210', 0.09); specks(30000, '90,60,30', 0.08); fibers(9000, 46, '110,80,40', 0.12, 1.1, 0, 6.3); fibers(2500, 80, '255,245,220', 0.1, 1, 0.6, 3); edges('110,70,25', 0.36, 220); blotch(10, 160, '100,60,20', 0.1);
  } else if (n === 3) { // pale green blotter with a fine graph grid
    specks(40000, '60,100,70', 0.05); fibers(4500, 14, '255,255,255', 0.14, 1, 0, 6.3); blotch(14, 320, '100,150,110', 0.05);
    lines(u * 0.5, 'rgba(50,110,80,0.2)', 1, true, true); lines(u * 2.5, 'rgba(40,100,70,0.4)', 1.8, true, true); edges('70,110,80', 0.14, 120);
  } else if (n === 4) { // a dark bench top in warm grey-brown, with dust and scratches
    blotch(54, 300, '20,14,10', 0.2); blotch(30, 260, '130,112,92', 0.05); specks(50000, '230,220,200', 0.07); fibers(420, 280, '215,205,185', 0.07, 1.2, 0.3, 3.2); blotch(7, 420, '235,230,215', 0.035); edges('0,0,0', 0.4, 220);
  } else { // kraft paper, a mid tan, fibers, soft creases, chalk lines
    blotch(40, 320, '120,80,40', 0.07); specks(40000, '70,45,20', 0.08); fibers(14000, 60, '90,60,30', 0.12, 1, 0.1, 1.2); fibers(5000, 50, '245,225,185', 0.1, 1, 0.1, 1.4);
    x.strokeStyle = 'rgba(80,50,20,0.12)'; x.lineWidth = 3; for (let k = 0; k < 5; k++) { const y0 = R() * h; x.beginPath(); x.moveTo(0, y0); x.quadraticCurveTo(w / 2, y0 + (R() - 0.5) * 160, w, y0 + (R() - 0.5) * 80); x.stroke(); }
    x.strokeStyle = 'rgba(255,250,235,0.17)'; x.lineWidth = 2.4; x.lineCap = 'round'; for (let i = 1; i * u * 4 < w; i++) for (let j = 0; j * 90 < h; j++) if (R() > 0.12) { x.beginPath(); x.moveTo(i * u * 4 + (R() - 0.5) * 2, j * 90 + 4); x.lineTo(i * u * 4 + (R() - 0.5) * 2, j * 90 + 78); x.stroke(); }
    edges('90,55,20', 0.28, 200);
  }
}
Object.assign(PAPERS[1], { base: '#f3eddc' }); Object.assign(PAPERS[2], { base: '#e6d5aa' }); Object.assign(PAPERS[3], { base: '#dfe9d3' }); Object.assign(PAPERS[4], { base: '#3a342f' }); Object.assign(PAPERS[5], { base: '#c9a273' });
const SW = 64, SH = 44, IW = 2048, IH = 1408, U = IW / SW;
// The page, near to far: a band along the bottom for the count, the molecule in the middle, and the molecules it
// can become in one row along the top. The round and its pages run down the left edge, equipment down the right.
const C0 = { x: 3.5, z: 2.6 }, SPOT = [], LAB = [], SCS = [], FIN = 7;
// the left column reads down one edge: what is kept, the round and its pages, this page's reactions, the count, the three numbers
const KITV = (() => { try { return new URLSearchParams(root.location.search).get('kit') || 'back'; } catch (e) { return 'back'; } })(), SX = KITV === 'side' ? 5 : 0;
// How big each piece really is, as its longest side in centimetres. Pieces are drawn in proportion, but gently: a
// goat is not fifteen times a stopwatch on the page, or the stopwatch could not be seen.
const CM = { balance: 35, spatula: 30, schlenk: 60, stopper: 20, mirror: 30, mortar: 12, cannula: 25, reflux: 45, burette: 70, clamp: 60, magnet: 5, recycler: 30, stirrer: 16, cards: 26, logbook: 30, crystal: 7, scalepan: 35, coldtrap: 30, bunsen: 30, litmus: 26, stopwatch: 7, thermometer: 30, carousel: 25, dropper: 12, loupe: 12, timer: 15,
  stone: 22, transmute: 30, regia: 18, ouroboros: 25, homunculus: 25, elixir: 14, ouija: 38, voodoo: 26, tower: 30, duck: 22, cat: 26, paw: 28, idol: 28, grimoire: 30, hourglass: 30, poster: 30, coffee: 22, coat: 32, milk: 26, mystery: 24, raven: 30, glory: 30, goggles: 28, grant: 30, extinguisher: 30, intern: 30, orb: 26, candle: 38, goat: 80, pact: 30, dryer: 30, sieves: 14, hood: 55, scrubber: 35 };
const sizeOf = id => Math.max(0.86, Math.min(1.55, Math.pow((CM[id] || 25) / 28, 0.42)));
const EDGE = -22.6 + SX, STEP = { x: -21.5 + SX, z: 2.3 }, STEPD = 3.75, PAGES = { x: -17.3 + SX, z: -2.9 }, HIST = { x: 6, z: 6.6 };
// ---- builder E: the page drawn back, a true margin column, and the play area as one rectangle (?air=0 puts the old framing back) ----
// All in page units. The sheet runs on ext units further to the left than before; line is the red margin line; the margin column is everything
// to the left of it. play is the one rectangle nothing is ever written in; top, left, home, reag and band are the things inside it.
// The molecule's home is centred in the play rectangle, not in the frame.
// the bench view is on unless ?bench=0
const BENCH0 = (() => { try { return new URLSearchParams(root.location.search).get('bench') !== '0'; } catch (e) { return true; } })();
const PGE = pageE(); if (PGE.on) STEP.x += PGE.sx;
// (builder 12) THE SHAPE OF THE NOTEBOOK, to choose from: ?shape=a an open spread of two upright pages with the binding between (the molecule and its track on the
// right page; the goal, the round, the three places, notes and pinned records on the left); ?shape=b one upright page, centred (the places and the goal above the
// molecule, the track at its foot). Without it: the wide sheet. Everything the page draws is placed from SHP when it is set.
const SHAPE = (() => { try { const v = new URLSearchParams(root.location.search).get('shape'); return !BENCH0 || v === '0' ? '' : v === 'b' ? 'b' : 'a'; } catch (e) { return 'a'; } })();
const CAMQ = (() => { try { const v = new URLSearchParams(root.location.search).get('cam'); return v ? v.split(',').map(Number) : null; } catch (e) { return null; } })();
// (builder 18) the motif marks stand in a strip of their own along the foot of the right page (KSTRIP, world z): the molecule's home ends above it
// and the yield track lies below it. No strip with ?kin=0 or ?kin=a (no marks on the page).
const KSTRIP = (() => { let v = 'c'; try { v = new URLSearchParams(root.location.search).get('kin') || 'c'; } catch (e) { /* no window */ } return v === '0' || v === 'a' ? null : { z0: 5.5, z1: 10.3, x0: 1.2, x1: 29.8 }; })();
const SHP = SHAPE === 'a' ? { gut: -2, x0: -36, x1: 32, z1: 18.9, home: { x0: 0.4, x1: 30.5, z0: (() => { try { return new URLSearchParams(root.location.search).get('pad') === '0' ? -20.3 : -17.2; } catch (e) { return -17.2; } })(), z1: KSTRIP ? KSTRIP.z0 - 0.3 : 9.9 }, trk: { x0: 9.6, x1: 26.4, z: 12.7 }, made: { x: 0.9, z: 14.3 }, speed: { x: 19.9, z: 18.4, gap: 8 }, pin: { x: -8.0, z: 13.8, w: 8, d: 5, smax: 1.0 }, draw: { x: 29.4, z: -20.2 }, bt: 40.5, cam: CAMQ || [5.2, -5.3, 87, 20], cup: { x: 46.0, z: -27.6 }, gp: { x: 31.6, z: -29.0 }, top: [-33, 19.5], step: { x: -22.2, z: -1.6 }, round: { x: -23.5, z: -9.6 } }
  : SHAPE === 'b' ? { x0: -17, x1: 17, z1: 20.4, home: { x0: -16.2, x1: 16.2, z0: -9.4, z1: 11.6 }, trk: { x0: -4.2, x1: 15.4, z: 14.9 }, made: { x: -15.8, z: 16.4 }, speed: { x: -16.6, z: 18.7 }, pin: { x: 11.6, z: -13.2, w: 8.6, d: 5.6, smax: 1.0 }, draw: { x: 14.6, z: -8.2 }, bt: 26.4, cam: [-3.4, -5.9, 96.5, 20], cup: { x: -31, z: 3 }, gp: { x: -27.5, z: 15.5 }, top: [-45, 30],
    step: { x: -13.2, z: -12.2 }, round: { x: -15.6, z: -17.6 }, goal: { x: -7.4, z: -19.9, room: 14.2 }, need: { x: 8.2, z: -18.4 } } : null;
const SAFE = SHAPE === 'a' ? { L: { x0: -34.9, x1: -3.7, z0: -21.0, z1: 18.0 }, R: { x0: -0.3, x1: 31.0, z0: -21.0, z1: 18.0 }, gut: { x0: -3.7, x1: -0.3 } } : null;
if (SHP) { PGE.home = SHP.home; if (SHP.step) { STEP.x = SHP.step.x; STEP.z = SHP.step.z; } }
function pageE() {
  let on = true; try { on = new URLSearchParams(root.location.search).get('air') !== '0'; } catch (e) { /* no window */ }
  const line = -24.4, play = { x0: line, x1: 29.6, z0: -22, z1: 22 }, cx = (play.x0 + play.x1) / 2 - 2.6, hw = 11.9, bz = 11.5;
  return { on, k: 1.15, cx: -3.2, cz: 0.3, ext: 4, inkW: 16, line, linePx: (line + SW / 2) * U, holeX: -34.5, play, sx: -0.7, rx: 0, dz: 2.2, speedX: 174,
    top: { x0: -28.6, x1: play.x1, z0: play.z0, z1: -13.5 }, left: { x0: line + 0.2, x1: -13.0, z0: -4.6, z1: bz }, reag: { x0: 19.8, x1: 32, z0: -5.2, z1: bz }, band: { x0: line, x1: play.x1, z0: bz, z1: play.z1 },
    home: BENCH0 ? { x0: -12.0, x1: 26.4, z0: -13.3, z1: 10.2 } : { x0: cx - hw, x1: cx + hw, z0: -12.6, z1: 9.3 } };
}
// the camera drawn back along its own line of sight and set to the left, so the page's bound edge and its margin are in the frame
function camE(CAM, LOOKAT) { if (!PGE.on) return; CAM.sub(LOOKAT).multiplyScalar(PGE.k).add(LOOKAT); CAM.x += PGE.cx; LOOKAT.x += PGE.cx; CAM.z += PGE.cz; LOOKAT.z += PGE.cz; }
// the molecule's home is the middle of the play rectangle; it may be drawn as large on the screen as before the camera drew back
function homeE(HOME) { if (!PGE.on) return; const h = PGE.home; HOME.x = (h.x0 + h.x1) / 2; HOME.z = (h.z0 + h.z1) / 2; HOME.w = h.x1 - h.x0; HOME.d = h.z1 - h.z0; HOME.smax *= PGE.k * (BENCH0 ? 2.0 : 1); }
// the reagents stand a little further right, to give the molecule's home the room the wider view asks for
function reagE(ids) { if (!PGE.on) return; ids.forEach(i => { SPOT[i].x += PGE.rx; LAB[i].x += PGE.rx; }); }
// the pencil no longer lies across the margin, where the notes are written
function pencilE(scene) { if (!PGE.on) return; scene.children[scene.children.length - 1].visible = false; }
let SC_MAIN = 1.5; const SC_HOVER = 1.3;
// the bench view's camera: what it looks at on the bench (x, z), how far it stands back, its lean from straight down in degrees, its field of view
const BCAM = SHP ? SHP.cam : [13.4, -8.6, 94, 20];
// (builder 11) one scale for the things on the bench: bench units to a centimetre. The page would be 64 cm at this scale: a true 21 cm page (3 units a cm) would need a mug 26 units across and a balance as wide as the page, which the screen cannot hold.
const UCM = 1.0, REALCM = { balance: [20, 12], scalepan: [18, 12], duck: [8, 8], stopwatch: [6, 7], timer: [7, 9], candle: [5, 12], bunsen: [8, 13], mortar: [11, 8], loupe: [9, 4], thermometer: [4, 13], burette: [6, 13], dropper: [4, 11], crystal: [6, 8], magnet: [8, 8], logbook: [12, 9], cards: [9, 6], extinguisher: [9, 13] };
// the strip of bench above the page where the jars, the instruments and the homunculus stand: the left end, the line they stand on, the step from jar to jar and from instrument to instrument
const BNZ = { jar: { x0: -35.0, dx: 3.72, z: -30.5, y: 0.45, s: 1.62, n: 10 } /* (builder 20, the owner: "Yes, but bigger") was x0 -34, dx 2.95, z -31.6, s 1.05 */, kit: { x0: -33.2, x1: -2.6, z: -24.9, gap: 1.1, k: 0.42, h: 5.3, min: 4.2 }, hom: { x: 5.6, z: -25.6, s: 4.2, h: 9.0, w: 10.0 }, homjar: { x: 16.6, z: -25.6, s: 3.0 }, fresh: { x: 22.2, z: -25.2 } };   // (builder 14, the owner's pick) the run's creature stands large by the notebook with its jar beside it; the rest of the collection is small on the back shelf
const TOPB = { x0: SHP ? SHP.top[0] : -32, z: SHAPE === 'a' ? -24.5 : -27.0, jar: 8.9, kit: 8.2, x1: SHP ? SHP.top[1] : 47, k: 1 };

function start(app) {
  const cv = document.createElement('canvas'); app.append(cv);
  const ren = new T.WebGLRenderer({ canvas: cv, antialias: true });
  ren.setPixelRatio(Math.min(2, root.devicePixelRatio || 1)); ren.outputEncoding = T.sRGBEncoding;
  ren.shadowMap.enabled = true; ren.shadowMap.type = T.PCFSoftShadowMap;
  // a look being tried, see kitart.js
  const LOOK = (() => { try { return new URLSearchParams(root.location.search).get('look') || 'toy'; } catch (e) { return 'toy'; } })(); AA.rxKit.K.look = LOOK;
  const scene = new T.Scene(); scene.background = lin(PAPERS[PAPERN].bg);
  const cam = new T.PerspectiveCamera(34, 1, 0.5, 200), CAM = new T.Vector3(0, 43, 22.6), LOOKAT = new T.Vector3(0, 0, 0.6);
  camE(CAM, LOOKAT);
  const camDir = LOOKAT.clone().sub(CAM).normalize();
  scene.add(new T.HemisphereLight(0xfff6e6, 0xcabf9f, LOOK === 'clay' ? 1.0 : LOOK === 'desk' ? 0.55 : 0.8));
  const sun = new T.DirectionalLight(0xfff0d6, LOOK === 'clay' ? 0.6 : LOOK === 'desk' ? 1.1 : 0.85); sun.position.set(-16, 18, 4); sun.castShadow = false; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.radius = LOOK === 'toy' ? 1.5 : LOOK === 'now' ? 7 : 11;
  if (LOOK === 'desk') { // a room for glass and metal to reflect: a warm ceiling, a bright window, a dark floor
    const room = new T.Scene(), bm = c => new T.MeshBasicMaterial({ color: c, side: T.BackSide }); room.add(new T.Mesh(new T.SphereGeometry(50, 24, 16), bm(0x8a7f70)));
    const pane = (w, h, x, y, z, c) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); room.add(m); }; pane(30, 22, -30, 26, 6, 0xffffff); pane(40, 14, 14, 34, -18, 0xfff0d0); pane(60, 60, 0, -30, 0, 0x2a2420);
    const pm = new T.PMREMGenerator(ren); scene.environment = pm.fromScene(room, 0.03).texture; ren.toneMapping = T.ACESFilmicToneMapping; ren.toneMappingExposure = 1.15; }
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 22, bottom: -22, near: 1, far: 90 }); scene.add(sun); scene.add(sun.target);
  const maxAn = ren.capabilities.getMaxAnisotropy();
  const canvasTex = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = maxAn; return { c, x: c.getContext('2d'), t }; };
  const noise = (x, w, h, n, a, c) => { for (let i = 0; i < n; i++) { x.fillStyle = 'rgba(' + c + ',' + (Math.random() * a).toFixed(3) + ')'; x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } };
  const std = o => new T.MeshStandardMaterial(o);
  const add = (geo, mat, x, y, z, parent) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (parent || scene).add(m); return m; };

  // ---------- the page, and the layer of ink over it ----------
  const paper = canvasTex(2048, 1408);
  paperDraw(paper.x, 2048, 1408, PAPERN, SW); paper.t.needsUpdate = true;
  const CLIP = new T.Plane(new T.Vector3(1, 0, 0), 1e4), clipL = m => { if (SHAPE === 'a') { (Array.isArray(m.material) ? m.material : [m.material]).forEach(q => { q.clippingPlanes = [CLIP]; }); } return m; }; if (SHAPE === 'a') ren.localClippingEnabled = true;
  const paperMesh = add(new T.PlaneGeometry(SW, SH).rotateX(-Math.PI / 2), std({ map: paper.t, roughness: 0.95 }), 0, 0, 0); paperMesh.castShadow = false;
  if (SHP) shapeDress(); clipL(paperMesh);
  // (builder 12) the notebook as an object: the boards of its cover under the pages, the edges of the block of pages, and for the spread the gutter with its shadow and stitches
  function shapeDress() { const x0 = SHP.x0, x1 = SHP.x1, W = x1 - x0, cx = (x0 + x1) / 2, SH = SHP.z1 + 22, cz = (SHP.z1 - 22) / 2, flat = (w, d, mat, x, y, z) => { const m = add(new T.PlaneGeometry(w, d).rotateX(-Math.PI / 2), mat, x, y, z); m.castShadow = false; return m; };
    if (SHAPE === 'b') { paperMesh.scale.x = W / SW; paperMesh.position.x = cx; } paperMesh.scale.z = SH / 44; paperMesh.position.z = cz;
    const cloth = canvasTex(256, 256); cloth.x.fillStyle = '#2b3a34'; cloth.x.fillRect(0, 0, 256, 256); noise(cloth.x, 256, 256, 5000, 0.16, '0,0,0'); noise(cloth.x, 256, 256, 3000, 0.1, '190,200,180'); cloth.t.needsUpdate = true;
    const board = add(new T.BoxGeometry(W + 2.2, 0.5, SH + 2.0), std({ map: cloth.t, roughness: 0.9 }), cx, -0.27, cz); board.castShadow = false; clipL(board);
    // the block of pages: a few sheets showing past the top sheet at the outer edges and the foot
    const ec = canvasTex(64, 512); ec.x.fillStyle = '#e4dcc6'; ec.x.fillRect(0, 0, 64, 512); for (let i = 0; i < 9; i++) { ec.x.fillStyle = 'rgba(90,80,60,' + (0.16 + 0.05 * (i % 3)) + ')'; ec.x.fillRect(i * 7 + 3, 0, 1.6, 512); } ec.t.needsUpdate = true;
    const em = std({ map: ec.t, roughness: 0.95 }); flat(0.7, SH + 0.5, em, x1 + 0.3, -0.03, cz + 0.2); if (SHAPE === 'a') clipL(flat(0.7, SH + 0.5, em, x0 - 0.3, -0.03, cz + 0.2)); const ec2 = canvasTex(512, 64); ec2.x.fillStyle = '#e4dcc6'; ec2.x.fillRect(0, 0, 512, 64); for (let i = 0; i < 8; i++) { ec2.x.fillStyle = 'rgba(90,80,60,0.2)'; ec2.x.fillRect(0, i * 8 + 3, 512, 1.6); } ec2.t.needsUpdate = true; clipL(flat(W + 1.2, 0.6, std({ map: ec2.t, roughness: 0.95 }), cx, -0.03, SHP.z1 + 0.3));
    if (SHAPE === 'a') { const gc = canvasTex(256, 64), gx = gc.x, gr = gx.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, 'rgba(60,48,30,0)'); gr.addColorStop(0.36, 'rgba(60,48,30,0.14)'); gr.addColorStop(0.47, 'rgba(40,30,18,0.5)'); gr.addColorStop(0.5, 'rgba(24,16,8,0.9)'); gr.addColorStop(0.53, 'rgba(40,30,18,0.42)'); gr.addColorStop(0.62, 'rgba(255,250,236,0.25)'); gr.addColorStop(0.75, 'rgba(60,48,30,0.05)'); gr.addColorStop(1, 'rgba(60,48,30,0)'); gx.fillStyle = gr; gx.fillRect(0, 0, 256, 64); gc.t.needsUpdate = true;
      const gm = flat(7, SH, new T.MeshBasicMaterial({ map: gc.t, transparent: true, depthWrite: false }), SHP.gut, 0.012, cz); gm.receiveShadow = false; clipL(gm);
      for (let i = 0; i < 4; i++) { const th = add(new T.CylinderGeometry(0.07, 0.07, 2.6, 6).rotateX(Math.PI / 2), std({ color: lin(0xd9d2bd), roughness: 0.8 }), SHP.gut, 0.03, -16 + i * 10); th.castShadow = false; } }
    else { const lc = canvasTex(64, 64), lg = lc.x.createLinearGradient(0, 0, 64, 0); lg.addColorStop(0, 'rgba(40,30,18,0.42)'); lg.addColorStop(0.5, 'rgba(60,48,30,0.1)'); lg.addColorStop(1, 'rgba(60,48,30,0)'); lc.x.fillStyle = lg; lc.x.fillRect(0, 0, 64, 64); lc.t.needsUpdate = true; flat(3, SH, new T.MeshBasicMaterial({ map: lc.t, transparent: true, depthWrite: false }), x0 + 1.5, 0.012, cz).receiveShadow = false;
      const sp = add(new T.BoxGeometry(1.6, 0.62, SH + 2.0), std({ color: lin(0x1c1612), roughness: 0.7 }), x0 - 0.5, -0.2, cz); sp.castShadow = false; } }
  const ink = canvasTex(IW, IH);
  { const st0 = ink.x.strokeText.bind(ink.x); ink.x.strokeText = function (t, a, b) { const c = ink.x.strokeStyle; if (c === '#f3eddc' || c === '#fbf8ee') return; st0(t, a, b); }; } // no paper-colored cut-out behind lettering: it leaves a pale fringe on the grain
  const inkMesh = add(new T.PlaneGeometry(SW, SH).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: ink.t, transparent: true, depthWrite: false }), 0, 0.02, 0); inkMesh.castShadow = false; inkMesh.receiveShadow = false; clipL(inkMesh);
  const veil = document.createElement('canvas'); veil.className = 'veil'; app.append(veil);
  // above everything, in the frame's own pixels: the flash of a hit and OVERREACT (feel.js draws on it)
  const overC = document.createElement('canvas'); overC.className = 'veil'; app.append(overC); const overX = overC.getContext('2d');
  // The bench: the page lies on a wooden bench top under a lamp and the objects stand on the wood around it. This is the game's view
  // (?bench=0 puts the flat page back; b and c are the two other mock views).
  const BENCHV = (() => { try { const v = new URLSearchParams(root.location.search).get('bench'); return v === '0' ? '' : (v || 'a'); } catch (e) { return 'a'; } })();
  let benchTop = null;
  if (BENCHV) {
    const wc = canvasTex(2048, 1536), wx = wc.x, WR = (() => { let sd = 77; return () => (sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296; })();
    wx.fillStyle = '#583519'; wx.fillRect(0, 0, 2048, 1536);
    for (let b = 0; b < 7; b++) { const y0 = b * 220 + (b % 2 ? 6 : 0); wx.fillStyle = 'rgba(' + (b % 2 ? '70,44,22' : '150,108,66') + ',' + (0.10 + WR() * 0.10).toFixed(3) + ')'; wx.fillRect(0, y0, 2048, 220); wx.fillStyle = 'rgba(40,24,12,0.5)'; wx.fillRect(0, y0, 2048, 2.5); }
    for (let i = 0; i < 900; i++) { wx.strokeStyle = 'rgba(' + (i % 3 ? '58,34,16' : '196,150,100') + ',' + (0.04 + WR() * 0.09).toFixed(3) + ')'; wx.lineWidth = 0.8 + WR() * 3.2; const y0 = WR() * 1536, x0 = WR() * 2048 - 300, len = 300 + WR() * 1500; wx.beginPath(); wx.moveTo(x0, y0); wx.bezierCurveTo(x0 + len / 3, y0 + WR() * 14 - 7, x0 + 2 * len / 3, y0 + WR() * 14 - 7, x0 + len, y0 + WR() * 10 - 5); wx.stroke(); }
    for (let i = 0; i < 9; i++) { const kx = WR() * 2048, ky = WR() * 1536, r = 10 + WR() * 16; for (let q = 0; q < 6; q++) { wx.strokeStyle = 'rgba(48,28,14,' + (0.22 - q * 0.03).toFixed(2) + ')'; wx.lineWidth = 1.6; wx.beginPath(); wx.ellipse(kx, ky, r * (1 + q * 0.55) * 1.9, r * (1 + q * 0.5) * 0.55, 0, 0, 6.3); wx.stroke(); } }
    for (let i = 0; i < 2600; i++) { wx.fillStyle = 'rgba(' + (i % 2 ? '40,22,10' : '210,160,104') + ',' + (0.03 + WR() * 0.06).toFixed(3) + ')'; wx.fillRect(WR() * 2048, WR() * 1536, 6 + WR() * 60, 1 + WR() * 1.6); }
    for (let i = 0; i < 34; i++) { const x0 = WR() * 2048, y0 = WR() * 1536, an = WR() * 6.283, len = 30 + WR() * 190; wx.strokeStyle = 'rgba(232,200,150,' + (0.10 + WR() * 0.16).toFixed(3) + ')'; wx.lineWidth = 0.8 + WR() * 1.2; wx.beginPath(); wx.moveTo(x0, y0); wx.quadraticCurveTo(x0 + Math.cos(an) * len * 0.5 + WR() * 12, y0 + Math.sin(an) * len * 0.5 + WR() * 12, x0 + Math.cos(an) * len, y0 + Math.sin(an) * len); wx.stroke(); }
    [[1650, 170, 46], [1790, 330, 40], [240, 1280, 52], [1720, 1210, 44], [140, 260, 38]].forEach(q => { for (let k = 0; k < 2; k++) { wx.strokeStyle = 'rgba(38,20,8,' + (0.16 + WR() * 0.1).toFixed(3) + ')'; wx.lineWidth = 3 + WR() * 4; wx.beginPath(); wx.arc(q[0] + WR() * 5, q[1] + WR() * 5, q[2], WR() * 6.3, WR() * 6.3 + 4.6); wx.stroke(); } });
    // the lamp: a warm pool over the page, the far corners of the bench in shade
    { const gr = wx.createRadialGradient(900, 700, 150, 980, 760, 1250); gr.addColorStop(0, 'rgba(255,214,150,0.30)'); gr.addColorStop(0.4, 'rgba(255,214,150,0.06)'); gr.addColorStop(0.62, 'rgba(18,8,2,0.34)'); gr.addColorStop(1, 'rgba(12,5,1,0.86)'); wx.fillStyle = gr; wx.fillRect(0, 0, 2048, 1536); }
    wc.t.needsUpdate = true;
    benchTop = add(new T.PlaneGeometry(250, 150).rotateX(-Math.PI / 2), std({ map: wc.t, roughness: 0.78, color: lin(0xa89c92) }), 4, -0.25, -4); benchTop.castShadow = false;
    // the page's own small shadow, soft at the edge
    const sc = canvasTex(512, 384); sc.x.shadowColor = 'rgba(0,0,0,0.55)'; sc.x.shadowBlur = 26; sc.x.fillStyle = 'rgba(0,0,0,0.5)'; sc.x.fillRect(40, 40, 432, 304); sc.t.needsUpdate = true;
    const PWs = SW + (PGE.on ? PGE.ext : 0); const sh = add(new T.PlaneGeometry((PWs + 2) * 512 / 432, (SH + 2) * 384 / 304).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: sc.t, transparent: true, depthWrite: false }), (PGE.on ? -PGE.ext / 2 : 0) + 0.8, -0.2, 0.9); sh.castShadow = false; sh.receiveShadow = false; clipL(sh); if (SHP) { sh.scale.x = (SHP.x1 - SHP.x0 + 4) / (PWs + 2); sh.position.x = (SHP.x0 + SHP.x1) / 2 + 0.8; }
    // the same pool laid lightly over the page and everything flat, so the paper is brightest under the lamp and its far corners fall off a little (the middle stays clear and neutral)
    { const lc = canvasTex(512, 512), lg = lc.x.createRadialGradient(250, 250, 0, 256, 256, 256); lg.addColorStop(0, 'rgba(30,14,4,0)'); lg.addColorStop(0.37, 'rgba(30,14,4,0)'); lg.addColorStop(0.5, 'rgba(28,13,4,0.2)'); lg.addColorStop(0.62, 'rgba(24,11,3,0.5)'); lg.addColorStop(1, 'rgba(14,6,1,0.82)'); lc.x.fillStyle = lg; lc.x.fillRect(0, 0, 512, 512); lc.t.needsUpdate = true;
      const lm = add(new T.PlaneGeometry(190, 150).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: lc.t, transparent: true, depthWrite: false }), 4, 0.045, -4); lm.castShadow = false; lm.receiveShadow = false; lm.renderOrder = 1;
      const wc2 = canvasTex(256, 256), wg = wc2.x.createRadialGradient(128, 128, 10, 128, 128, 128); wg.addColorStop(0, 'rgba(255,206,130,0.05)'); wg.addColorStop(1, 'rgba(255,206,130,0)'); wc2.x.fillStyle = wg; wc2.x.fillRect(0, 0, 256, 256); wc2.t.needsUpdate = true;
      const wm = add(new T.PlaneGeometry(120, 96).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: wc2.t, transparent: true, depthWrite: false, blending: T.AdditiveBlending }), -2, -0.22, -8); wm.castShadow = false; wm.receiveShadow = false; }
    scene.background = lin(0x120d09);
    if (BENCHV === 'a') { const cq = (() => { try { return (new URLSearchParams(root.location.search).get('cam') || '').split(',').map(Number); } catch (e) { return []; } })(), c = cq.length >= 4 ? cq : BCAM; LOOKAT.set(c[0], 0, c[1]); CAM.set(c[0], c[2] * Math.cos(c[3] * Math.PI / 180), c[1] + c[2] * Math.sin(c[3] * Math.PI / 180)); }
    else if (BENCHV === 'b') { CAM.set(CAM.x + 34, CAM.y * 1.12, CAM.z * 1.75); LOOKAT.x += 5; LOOKAT.z -= 1; }
    else { CAM.set(CAM.x, CAM.y * 0.62, CAM.z * 2.7); LOOKAT.z -= 3; }
    camDir.copy(LOOKAT).sub(CAM).normalize(); }
  // the title: the cover of the notebook, over everything until the first click or key (?title=0 leaves it out)
  const titleC = document.createElement('canvas'); titleC.className = 'veil'; app.append(titleC);
  const title = { on: (() => { try { return new URLSearchParams(root.location.search).get('title') !== '0'; } catch (e) { return true; } })(), out: 0, t0: 0, page: null, drawn: false };
  const titleGo = () => { if (!title.on || title.out) return false; title.out = performance.now(); sfxN('click'); sfxN('pageTurn'); return true; };
  try { root.addEventListener('pointerdown', e => { let mh = false; try { mh = MAN.on || manHit(manPx(e)); } catch (q) { mh = false; } if (mh) return; if (titleGo()) { e.stopPropagation(); e.preventDefault(); title.eat = performance.now(); } }, true); root.addEventListener('click', e => { if (title.eat && performance.now() - title.eat < 600) { e.stopPropagation(); e.preventDefault(); } }, true); root.addEventListener('keydown', e => { if (titleGo()) e.stopPropagation(); }, true); } catch (e) { /* no window */ }
  // THE TITLE ON THE BENCH: the notebook lies closed on the bench, the lamp comes on, the name is lettered on the cover's label, and a hand-drawn arrow
  // asks for the cover to be opened. Opening the cover is the start of the run: the first page is under it. Nothing is cut to.
  let cover = null;
  function coverDraw(k) {
    const x = cover.tx.x, W = 1536, H = SHAPE === 'a' ? 1836 : 1000; x.setTransform(1, 0, 0, 1000 / H, 0, 0); let sd = 4242; const Rr = () => (sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296;
    x.fillStyle = '#4f1d1b'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 5200; i++) { x.fillStyle = 'rgba(' + (i % 2 ? '20,6,6' : '150,78,70') + ',' + (0.03 + Rr() * 0.07).toFixed(3) + ')'; x.fillRect(Rr() * W, Rr() * H, 2 + Rr() * 9, 1 + Rr() * 2); }
    { const gr = x.createRadialGradient(W * 0.52, H * 0.5, 180, W * 0.52, H * 0.5, 980); gr.addColorStop(0, 'rgba(255,190,150,0.10)'); gr.addColorStop(1, 'rgba(10,2,2,0.5)'); x.fillStyle = gr; x.fillRect(0, 0, W, H); }
    // the cloth tape of the spine, and worn corners
    x.fillStyle = '#17110e'; x.fillRect(0, 0, 150, H); x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(146, 0, 3, H);
    [[W, 0], [W, H]].forEach(q => { const gr = x.createRadialGradient(q[0], q[1], 0, q[0], q[1], 120); gr.addColorStop(0, 'rgba(214,180,150,0.55)'); gr.addColorStop(1, 'rgba(214,180,150,0)'); x.fillStyle = gr; x.fillRect(q[0] - 120, q[1] - 120, 240, 240); });
    // a cup was stood on it once
    // the label, and the name lettered on it by the game's own pen
    x.save(); x.translate(820, SHAPE === 'a' ? 640 : 400); x.rotate(-0.012); x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(-452, -162, 916, 340); x.fillStyle = '#efe7d2'; x.fillRect(-460, -170, 920, 340); x.strokeStyle = '#3b3f4a'; x.lineWidth = 5; x.strokeRect(-438, -148, 876, 296); x.lineWidth = 2; x.strokeRect(-426, -136, 852, 272);
    try { let sz = 100; const w0 = AA.rxPen.measure('OVERREACT', sz, 'heavy').width; sz *= 760 / Math.max(1, w0); if (k > 0) { AA.rxPen.write(x, 'OVERREACT', 5, sz * 0.36 + 6, sz, { weight: 'heavy', color: 'rgba(34,37,44,0.9)', align: 'center', t: k }); AA.rxPen.write(x, 'OVERREACT', 0, sz * 0.36, sz, { weight: 'heavy', color: '#c8261c', align: 'center', t: k }); } } catch (e) { /* no pen */ }
    x.restore();
    // (builder 11) the sign shows itself more each time it has been taken: our own mark (the four yield marks as one), in yellow. 1: scratched small in a corner. 2: larger, and a second one. 3: across the whole cover.
    { const n = signN(); if (n >= 1) { try { x.save(); x.translate(1392, 232); x.rotate(0.12); AA.rxMarks.yieldMark(x, 3, 1.5, 1.5, 24, { pencil: 'rgba(196,150,140,0.16)', plw: 2, ink: 'rgba(196,150,140,0.16)', lw: 2, t: 1 }); AA.rxMarks.yieldMark(x, 3, 0, 0, 24, { pencil: 'rgba(24,8,8,0.42)', plw: 2.4, ink: 'rgba(24,8,8,0.42)', lw: 2.4, t: 1 }); x.restore(); } catch (e) { /* no marks */ } } }
    x.setTransform(1, 0, 0, 1, 0, 0); cover.tx.t.needsUpdate = true; cover.named = k;
  }
  const signN = () => { try { const v = new URLSearchParams(root.location.search).get('sign'); if (v != null) return Math.max(0, Math.min(3, +v || 0)); } catch (e) { /* no window */ } return Math.max(0, Math.min(3, (meta && meta.sign) | 0)); };
  // the sign scratched into the bench round the notebook (from the second time on), seen only while the notebook is closed
  function signBench() { if (cover.signs) return; cover.signs = []; const n = signN(); if (n < 2) return; const c = canvasTex(256, 256); try { AA.rxMarks.yieldMark(c.x, 3, 130, 178, 44, { pencil: 'rgba(214,170,120,0.2)', plw: 3, ink: 'rgba(214,170,120,0.2)', lw: 3, t: 1 }); AA.rxMarks.yieldMark(c.x, 3, 128, 176, 44, { pencil: 'rgba(22,12,5,0.5)', plw: 3.5, ink: 'rgba(22,12,5,0.5)', lw: 3.5, t: 1 }); } catch (e) { /* no marks */ } c.t.needsUpdate = true; (n >= 3 ? [[42, 27, 6.5, -0.3], [CUP.x - 9.5, CUP.z + 6.5, 4.6, 0.5]] : [[42, 27, 6.5, -0.3]]).forEach(q => { const m = new T.Mesh(new T.PlaneGeometry(q[2], q[2]).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: c.t, transparent: true, depthWrite: false, opacity: 0.85 })); m.position.set(q[0], -0.1, q[1]); m.rotation.y = q[3]; m.renderOrder = 2; scene.add(m); cover.signs.push(m); }); }
  function coverMake() {
    const ext = PGE.on ? PGE.ext : 0, W = SHAPE === 'a' ? SHP.x1 - SHP.gut + 1.2 : SW + ext + 1.4, D = SHAPE === 'a' ? SHP.z1 + 22 + 1.6 : SH + 1.4, tx = canvasTex(1536, 1000); cover = { tx, W, D, grp: new T.Group(), named: -1, lamp: -1 };
    const side = std({ color: lin(0x1c1410), roughness: 0.9 }), box = new T.Mesh(new T.BoxGeometry(W, 0.55, D), [side, side, std({ map: tx.t, roughness: 0.85 }), std({ color: lin(0xd9cfb8), roughness: 0.95 }), side, side]); box.position.set(W / 2, 0.3, 0); cover.grp.add(box);
    cover.grp.position.set(-SW / 2 - ext - 0.7, 0.04, 0); if (SHAPE === 'a') cover.grp.position.set(SHP.gut - 0.5, 0.04, (SHP.z1 - 22) / 2); scene.add(cover.grp); coverDraw(0);
    { const ac = canvasTex(256, 128), x = ac.x; x.strokeStyle = '#efe7d2'; x.lineWidth = 13; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(236, 96); x.quadraticCurveTo(150, 4, 26, 62); x.moveTo(84, 22); x.lineTo(26, 62); x.lineTo(90, 100); x.stroke(); ac.t.needsUpdate = true; cover.arrow = flatMesh(15, 7.5, ac.t, 0.75); cover.arrow.position.set(19, 0.75, 14.5); cover.arrow.renderOrder = 30; cover.arrow.visible = false; scene.add(cover.arrow); }
  }
  function titleBench(now) {
    const W = titleC.width, H = titleC.height, x = titleC.getContext('2d'), k = W / 1280;
    if (!title.on) { if (title.drawn) { x.clearRect(0, 0, W, H); title.drawn = false; } return; }
    if (!cover) coverMake(); if (SHAPE === 'a' && !title.out) CLIP.constant = -SHP.gut + 0.7; signBench(); if (cover.signN !== signN()) { cover.signN = signN(); cover.named = -1; } if (!title.t0) title.t0 = now; const age = now - title.t0, sm = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
    // the lamp comes on: dark, a flicker, then the warm pool
    const lamp = title.out ? 1 : age < 600 ? 0 : age < 700 ? 0.5 : age < 860 ? 0.12 : age < 980 ? 0.62 : 0.62 + 0.38 * sm((age - 980) / 1900), st0 = age < 600 ? 0 : age < 860 ? 1 : 2;
    if (st0 !== cover.lamp) { cover.lamp = st0; if (st0 === 1) sfxN('click'); }
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.clearRect(0, 0, W, H); title.drawn = true; if (lamp < 1) { x.fillStyle = 'rgba(6,3,1,' + (0.93 * (1 - lamp)).toFixed(3) + ')'; x.fillRect(0, 0, W, H); } if (cover.signs) cover.signs.forEach(m => { m.material.opacity = title.out ? Math.max(0, 0.85 - (now - title.out) / 900) : 0.85; });
    { const kn = title.out ? 1 : Math.round(sm((age - 1500) / 1500) * 40) / 40; if (kn !== cover.named) coverDraw(kn); }
    // one hand-drawn arrow at the cover's free edge: open it
    if (cover.arrow) { cover.arrow.visible = age > 3300 && !title.out; cover.arrow.position.x = 19 - 0.6 * Math.sin(now / 280); }
    if (title.out) { const o = (now - title.out) / 1250, e = o < 0.5 ? 4 * o * o * o : 1 - Math.pow(-2 * Math.min(1, o) + 2, 3) / 2; cover.grp.rotation.z = Math.min(1, e) * Math.PI * 0.992; if (!title.shown && now - title.out > 480) { title.shown = true; briefMols.forEach((m, i) => { if (SHAPE === 'a' && i === 0 && briefMols.length > 1) return; m.group.visible = true; tweens = tweens.filter(tw => tw.m !== m); m.group.scale.setScalar(0.01); tween(m, { x: m.group.position.x, z: m.group.position.z }, m.sc, 0.5 + i * 0.22); }); } if (SHAPE === 'a') CLIP.constant = o >= 0.9 ? 1e4 : -SHP.gut + 0.7; if (o >= 1) { title.on = false; if (SHP) cover.grp.visible = false; if (SHAPE === 'a' && briefMols.length > 1) { const m = briefMols[0]; m.group.visible = true; tweens = tweens.filter(tw => tw.m !== m); m.group.scale.setScalar(0.01); tween(m, { x: m.group.position.x, z: m.group.position.z }, m.sc, 0.5); } x.clearRect(0, 0, W, H); title.drawn = false; if (cover.signs) { cover.signs.forEach(m => scene.remove(m)); cover.signs = []; } } }
    else briefMols.forEach(m => { m.group.visible = false; });
  }
  function drawTitle(now) {
    if (BENCHV) return titleBench(now);
    const W = titleC.width, H = titleC.height; if (!W || !H) return; const x = titleC.getContext('2d');
    if (!title.on) { if (title.drawn) { titleC.width = W; title.drawn = false; } return; }
    if (!title.t0) title.t0 = now; const age = now - title.t0, out = title.out ? Math.min(1, (now - title.out) / 520) : 0, k = W / 1280;
    if (out >= 1) { title.on = false; titleC.width = W; title.drawn = false; return; }
    if (!title.page) { const c = document.createElement('canvas'); c.width = 1536; c.height = 864; const cx2 = c.getContext('2d'); cx2.fillStyle = PAPERS[PAPERN].base || '#efece4'; cx2.fillRect(0, 0, 1536, 864); try { paperDraw(cx2, 1536, 1056, PAPERN, SW); } catch (e) { /* plain sheet */ } title.page = c; }
    titleC.width = W; title.drawn = true; x.save(); if (out) { x.globalAlpha = 1 - out * out; x.translate(-W * 0.5 * out * out, 0); x.rotate(-0.08 * out); }
    x.drawImage(title.page, 0, 0, W, H);
    // a drawn molecule under the name: a snake of balls and sticks in pencil and red ink
    { const pts = []; for (let i = 0; i < 16; i++) { const r = i < 8 ? 0 : 1, c = i < 8 ? i : 15 - i; pts.push([W * 0.5 + (c - 3.5) * 62 * k, H * 0.69 + r * 92 * k + ((c + r) % 2 ? -1 : 1) * 15 * k + (i === 7 ? 26 * k : i === 8 ? -26 * k : 0)]); }
      const grow = Math.min(1, age / 1400); x.strokeStyle = '#3b4252'; x.lineWidth = 7 * k; x.lineCap = 'round'; x.beginPath(); pts.forEach((p, i) => { if (i / 16 > grow) return; if (i) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); }); x.stroke();
      pts.forEach((p, i) => { if (i / 16 > grow) return; const el = i === 3 ? '#d2301f' : i === 9 ? '#3a6fd0' : i === 12 ? '#e0b422' : i === 15 ? '#3c9a5f' : '#5a6272', r = (i === 12 || i === 15 ? 19 : 15) * k * (1 + 0.06 * Math.sin(now / 300 + i)); x.fillStyle = el; x.beginPath(); x.arc(p[0], p[1], r, 0, 6.3); x.fill(); x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.arc(p[0] - r * 0.3, p[1] - r * 0.35, r * 0.35, 0, 6.3); x.fill(); }); }
    // the name, slammed on like the word in the game
    { let sz = 100 * k; const w0 = AA.rxPen.measure('OVERREACT', sz, 'heavy').width; sz *= 0.78 * W / Math.max(1, w0); const slam = age < 160 ? 2.2 - 1.26 * Math.pow(age / 160, 3) : age < 280 ? 0.94 + 0.06 * (age - 160) / 120 : 1;
      x.save(); x.translate(W / 2, H * 0.36); x.rotate(-0.04); x.scale(slam, slam); x.globalAlpha *= Math.min(1, age / 80);
      AA.rxPen.write(x, 'OVERREACT', 7 * k, sz * 0.36 + 8 * k, sz, { weight: 'heavy', color: '#22252c', align: 'center', extra: 5 * k });
      AA.rxPen.write(x, 'OVERREACT', 0, sz * 0.36, sz, { weight: 'heavy', color: '#d2301f', align: 'center', extra: 5 * k }); x.restore(); }
    // no words but the name: a small hand-drawn arrow at the page corner asks for the page to be turned
    if (age > 900 && !title.out) { const bob = 6 * k * Math.sin(now / 300), ax = W * 0.9 + bob, ay = H * 0.9; x.globalAlpha = 0.75; x.strokeStyle = '#3b4252'; x.lineWidth = 6 * k; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(ax - 70 * k, ay); x.lineTo(ax, ay); x.moveTo(ax - 22 * k, ay - 18 * k); x.lineTo(ax, ay); x.lineTo(ax - 22 * k, ay + 18 * k); x.stroke(); }
    x.restore();
  }

  // a pencil lying across the margin
  add(new T.CylinderGeometry(0.2, 0.2, 9, 6), std({ color: lin(0xf0b21c), roughness: 0.5 }), -28, 0.2, 2).rotation.set(Math.PI / 2, 0, 0.12);
  pencilE(scene);

  // Three ways of keeping a large molecule readable, being tried side by side with ?fold= on the page.
  //   bead: an arm or ring that nothing can act on folds into one lettered bead (Me, Et, Ph)
  //   flat: the molecule is laid out flat on the page with no overlaps, over an inked skeleton
  //   focus: what is far from anything that can react is drawn small and pale
  const NOFOLD = (() => { try { return new URLSearchParams(root.location.search).get('lay') === 'old'; } catch (e) { return false; } })();
  const FOLD = (() => { try { return new URLSearchParams(root.location.search).get('fold') || 'none'; } catch (e) { return 'bead'; } })(), BIG = 11;
  // Ways of drawing every molecule, being tried side by side with ?mol= on the page.
  //   full: every atom, standing as it settles.  lean: no H on carbon, no letter on carbon.
  //   flatlean: lean, and laid flat over an inked skeleton.  pads: flatlean, with a colored pad under each group.
  const MOLV = (() => { try { return new URLSearchParams(root.location.search).get('mol') || 'flatlean'; } catch (e) { return 'flatlean'; } })(), PADC = { 'C=C': '58,111,208', 'C=O': '240,132,0', OH: '214,69,58', Cl: '60,154,95' };
  // Cuts to what is drawn on top of the molecule, tried with ?cut= and any of the letters:
  //   a: one kind of mark at a time.  b: no group letters.  c: heavy atoms are tinted, no collar.  d: choices in a column at the side.
  const CUT = (() => { try { const v = new URLSearchParams(root.location.search).get('cut'); return v == null ? 'abcd' : v; } catch (e) { return 'abcd'; } })(), SIDE = CUT.includes('d'), mIso = {};
  if (SIDE) { C0.x = -0.6; C0.z = 0.2; }
  const isoMat = a => { const k = a.el + a.iso; return mIso[k] || (mIso[k] = std({ color: new T.Color(E[a.el].color).lerp(new T.Color(ISOC[a.iso]), 0.55).convertSRGBToLinear(), emissive: lin(ISOC[a.iso]), emissiveIntensity: 0.45, roughness: 0.3 })); };
  const slimeMat = std({ color: lin(0x7fd14a), roughness: 0.15 }), cureMat = std({ color: lin(0xf4f1e8), roughness: 0.95 });
  const beadMat = std({ color: lin(0xf0d9a0), roughness: 0.7 }), polyMat = std({ color: lin(0xf08aa8), roughness: 0.6 }), beadEdge = new T.MeshBasicMaterial({ color: lin(0x2b2622), side: T.BackSide }), hEdge = new T.MeshBasicMaterial({ color: lin(0x22252c), side: T.BackSide }), paleMat = std({ color: lin(0xd9d6cc), roughness: 0.8 }), mWord = {};
  function wordMat(txt) { if (mWord[txt]) return mWord[txt]; const c = canvasTex(128, 128); AA.rxPen.write(c.x, txt, 64, 64, txt.length > 2 ? 50 : 66, { weight: 'heavy', color: '#2b2420', align: 'center', base: 'middle' }); c.t.needsUpdate = true; return (mWord[txt] = new T.SpriteMaterial({ map: c.t, depthWrite: false })); }
  // the atoms a reagent could act on, or that carry something: the ends of C=C and C=O, O and Cl with their carbon, heavy atoms
  function liveAtoms(md, ar) {
    const live = new Set();
    md.bonds.forEach(b => { if (b.order === 2 && !(ar.has(b.a) && ar.has(b.b))) { live.add(b.a); live.add(b.b); } });
    md.atoms.forEach(a => { if (a.poly) live.add(a); if (a.el === 'O' || a.el === 'Cl') { live.add(a); md.neighbors(a).forEach(q => { if (q.atom.el === 'C') live.add(q.atom); }); } if (a.iso) live.add(a); });
    return live;
  }
  // arms and rings that hold nothing live, each to be drawn as one bead on the atom it hangs from
  function foldsOf(md) {
    const ar = RX.aromaticAtoms(md), live = liveAtoms(md, ar), heavy = md.atoms.filter(a => a.el !== 'H' && !a.tail), gone = new Set(), hn = a => md.neighbors(a).filter(q => q.atom.el !== 'H' && !q.atom.tail && !gone.has(q.atom)).map(q => q.atom);
    for (let again = true; again;) {
      again = false;
      heavy.forEach(a => { if (gone.has(a) || live.has(a) || ar.has(a)) return; if (hn(a).length <= 1) { gone.add(a); again = true; } });
      const seen = new Set(); heavy.forEach(a => { if (!ar.has(a) || gone.has(a) || seen.has(a)) return; const ring = [], st0 = [a]; while (st0.length) { const q = st0.pop(); if (seen.has(q)) continue; seen.add(q); ring.push(q); md.neighbors(q).forEach(n => { if (ar.has(n.atom) && !gone.has(n.atom)) st0.push(n.atom); }); }
        let out = 0; ring.forEach(q => hn(q).forEach(n => { if (!ar.has(n)) out++; })); if (out <= 1 && !ring.some(q => live.has(q))) { ring.forEach(q => gone.add(q)); again = true; } });
    }
    if (gone.size >= heavy.length) return [];
    const beads = [], done = new Set();
    gone.forEach(a => { if (done.has(a)) return; const comp = [], st0 = [a]; let anchor = null, rootA = null; while (st0.length) { const q = st0.pop(); if (done.has(q)) continue; done.add(q); comp.push(q); md.neighbors(q).forEach(n => { if (n.atom.el === 'H') return; if (gone.has(n.atom)) st0.push(n.atom); else { anchor = n.atom; rootA = q; } }); }
      if (!anchor || comp.length < 2) return; const nC = comp.filter(q => q.el === 'C').length, ring = comp.some(q => ar.has(q)); beads.push({ atoms: comp, anchor, root: rootA, txt: ring ? (nC === 6 ? 'Ph' : 'Ar') : ({ 1: 'Me', 2: 'Et', 3: 'Pr', 4: 'Bu' })[nC] || 'C' + nC }); });
    return beads;
  }
  // lays the atoms out flat with nothing on top of anything else: bonds keep their length, everything else is pushed apart
  function flatten(md, at, skip, beads, iters) {
    const pts = md.atoms.filter(a => !skip.has(a)).concat(beads.map(b => b.pa)), bonds = md.bonds.filter(b => !skip.has(b.a) && !skip.has(b.b)).map(b => ({ a: at.get(b.a), b: at.get(b.b), len: Math.hypot(b.a.x - b.b.x, b.a.y - b.b.y, b.a.z - b.b.z) })).concat(beads.map(b => ({ a: at.get(b.anchor), b: at.get(b.pa), len: Math.hypot(b.anchor.x - b.root.x, b.anchor.y - b.root.y, b.anchor.z - b.root.z) * 1.15 }))), P2 = pts.map(a => ({ p: at.get(a), h: a.el === 'H' }));
    const typ = bonds.filter(b => b.len > 0).map(b => b.len).sort((x, y) => x - y)[Math.floor(bonds.length * 0.7)] || 1.5;
    P2.forEach(q => { q.p.y = 0; });
    for (let it = 0; it < (iters || 120); it++) {
      for (let i = 0; i < P2.length; i++) for (let j = i + 1; j < P2.length; j++) { const A = P2[i], B = P2[j], min = typ * (A.h || B.h ? (A.h && B.h ? 0.75 : 0.9) : 1.25); let dx = B.p.x - A.p.x, dz = B.p.z - A.p.z, d = Math.hypot(dx, dz); if (d >= min) continue; if (d < 1e-3) { dx = Math.cos(i * 1.7 + j); dz = Math.sin(i * 1.7 + j); d = 1; } const k = (min - d) / d * 0.5; A.p.x -= dx * k; A.p.z -= dz * k; B.p.x += dx * k; B.p.z += dz * k; }
      bonds.forEach(b => { const dx = b.b.x - b.a.x, dz = b.b.z - b.a.z, d = Math.hypot(dx, dz) || 1, k = (d - b.len) / d * 0.5; b.a.x += dx * k; b.a.z += dz * k; b.b.x -= dx * k; b.b.z -= dz * k; });
    }
    let cx = 0, cz = 0; P2.forEach(q => { cx += q.p.x; cz += q.p.z; }); cx /= P2.length || 1; cz /= P2.length || 1; P2.forEach(q => { q.p.x -= cx; q.p.z -= cz; });
  }

  // A molecule laid out as it would be drawn by hand: a chain is an even zigzag, every ring is a regular polygon, and
  // what hangs off them leaves at even angles. Any number of separate rings are laid out, each where the chain
  // reaches it. A molecule whose two halves are the same (a mirrored one) is laid out as one half and its
  // reflection. Hydrogens that are drawn sit a short way out from their atom. Every bond ends at its own length.
  const fnv = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619); return (x >>> 0).toString(36); };
  // where a point of the flat drawing goes when the drawing is bent round by the share f of a half turn (f 1: a full U)
  function bendXf(x, z, F, f) {
    const sx = x - F.x1, d = z - F.z0; if (f < 1e-3 || sx <= 0) return { x, z, th: 0 };
    const R = F.r / f, arc = Math.PI * F.r;
    if (sx <= arc) { const th = sx / R; return { x: F.x1 + (R - d) * Math.sin(th), z: F.z0 + R - (R - d) * Math.cos(th), th }; }
    const the = arc / R, t = sx - arc; return { x: F.x1 + R * Math.sin(the) + t * Math.cos(the) - d * Math.sin(the), z: F.z0 + R - R * Math.cos(the) + t * Math.sin(the) + d * Math.cos(the), th: the };
  }
  // Bends a flat drawing: each body (a ring, or a chain atom with what hangs from it) is carried whole to where its
  // place on the chain goes, so nothing in it is stretched. U(a) is where atom a stands flat; put(a, x, z) takes the result
  function bendAll(F, bodies, U, f, put) {
    bodies.forEach(o => { const ref = o.bbs.length ? o.bbs : o.atoms; let rx = 0, rz = 0, n = 0; ref.forEach(a => { const u = U(a); if (u) { rx += u.x; rz += u.z * F.dir; n++; } }); if (!n) return; rx /= n; rz /= n;
      const T0 = bendXf(rx, rz, F, f), c = Math.cos(T0.th), s = Math.sin(T0.th); o.atoms.forEach(a => { const u = U(a); if (!u) return; const ox = u.x - rx, oz = u.z * F.dir - rz; put(a, T0.x + ox * c - oz * s - F.cx * f, F.dir * (T0.z + ox * s + oz * c) - F.cz * f); }); });
  }
  function tidy(md, at, skip, beads, seed, arch) {
    const L = 1.55, TAU = 2 * Math.PI, nodes = md.atoms.filter(a => !skip.has(a) && a.el !== 'H'), adj = new Map(), pos = new Map(); nodes.forEach(a => adj.set(a, []));
    md.bonds.forEach(b => { if ((arch || []).some(q => (q.o === b.a && q.c === b.b) || (q.o === b.b && q.c === b.a))) return; if (adj.has(b.a) && adj.has(b.b) && !adj.get(b.a).includes(b.b)) { adj.get(b.a).push(b.b); adj.get(b.b).push(b.a); } });
    beads.forEach(b => { if (!adj.has(b.anchor)) return; adj.set(b.pa, [b.anchor]); adj.get(b.anchor).push(b.pa); nodes.push(b.pa); });
    at.unf = null; at.fold = null;
    if (!nodes.length) return;
    // ring atoms are what is left when ends are stripped away again and again; each ring is the shortest way round through one of its bonds
    const deg = new Map(), core = new Set(nodes); nodes.forEach(a => deg.set(a, adj.get(a).length));
    for (let again = true; again;) { again = false; Array.from(core).forEach(a => { if (deg.get(a) <= 1) { core.delete(a); adj.get(a).forEach(n => deg.set(n, deg.get(n) - 1)); again = true; } }); }
    const rings = [], ringOf = new Map();
    core.forEach(u => { if (ringOf.has(u)) return; for (const v of adj.get(u)) { if (!core.has(v) || ringOf.has(v)) continue; const par = new Map([[u, null]]), qu = [u]; let found = false; while (qu.length && !found) { const a = qu.shift(); for (const n of adj.get(a)) { if (!core.has(n) || par.has(n) || (a === u && n === v)) continue; par.set(n, a); if (n === v) { found = true; break; } qu.push(n); } } if (!found) continue; const cyc = []; for (let a = v; a; a = par.get(a)) cyc.push(a); if (cyc.some(a => ringOf.has(a))) continue; cyc.forEach(a => ringOf.set(a, cyc)); rings.push(cyc); break; } });
    const far = (a, from, seen) => { let best = 0; adj.get(a).forEach(n => { if (n === from || seen.has(n) || pos.has(n)) return; seen.add(n); best = Math.max(best, 1 + far(n, a, seen)); }); return best; };
    const kidsOf = a => adj.get(a).filter(n => !pos.has(n)).sort((p, q) => far(q, a, new Set([a, q])) - far(p, a, new Set([a, p])));
    const step = (a, n, t) => { const p = pos.get(a); pos.set(n, { x: p.x + Math.cos(t) * L, y: p.y + Math.sin(t) * L }); };
    // A ring is set down whole. The atom it is reached at stays, and the ring is turned about it so that the corner the
    // chain leaves by (the one whose arm reaches furthest) points the way the chain was heading; that arm leans a
    // little further toward the heading. What hangs from the other corners points away from the middle of the ring
    const norm = t => Math.atan2(Math.sin(t), Math.cos(t));
    const setRing = (cyc, a, ang, turn) => { const n = cyc.length, R = L / (2 * Math.sin(Math.PI / n)), p = pos.get(a), i0 = cyc.indexOf(a), H = ang + turn * Math.PI / 6, todo = [];
      const came = new Map(); cyc.forEach(b => came.set(b, adj.get(b).some(q => pos.has(q) && ringOf.get(q) !== cyc)));
      let ex = -1, top = 0; cyc.forEach((b, k) => { if (b === a) return; adj.get(b).forEach(q => { if (pos.has(q) || ringOf.get(q) === cyc) return; const f = 1 + far(q, b, new Set([b, q])); if (f > top) { top = f; ex = k; } }); });
      let dl = 0, sg = 1; if (ex >= 0) { let bestE = 9; [1, -1].forEach(s2 => { const phi = s2 * (ex - i0) * TAU / n, d0 = Math.max(-1.05, Math.min(1.05, norm(H - ang - Math.PI - phi))), err = Math.abs(norm(ang + d0 + Math.PI + phi - H)); if (err < bestE - 1e-6) { bestE = err; dl = d0; sg = s2; } }); }
      const ca = ang + dl, cx = p.x + Math.cos(ca) * R, cy = p.y + Math.sin(ca) * R;
      cyc.forEach((b, k) => { if (b !== a) { const t = ca + Math.PI + sg * (k - i0) * TAU / n; pos.set(b, { x: cx + Math.cos(t) * R, y: cy + Math.sin(t) * R }); } });
      cyc.forEach((b, bi) => { const q = pos.get(b), out = Math.atan2(q.y - cy, q.x - cx), kids = kidsOf(b), angs = came.get(b) ? [out + 1.05, out - 1.05, out + 2.1] : kids.length === 1 ? [out] : [out + 0.55, out - 0.55, out];
        kids.forEach((n2, k) => { let t = angs[Math.min(k, 2)], tn = k % 2 ? 1 : -1; if (bi === ex && k === 0 && kids.length === 1) { t = out + Math.max(-0.5, Math.min(0.5, norm(H - out))); tn = norm(H - t) >= 0 ? 1 : -1; } step(b, n2, t); todo.push([n2, t, tn]); }); });
      todo.forEach(q => grow(q[0], q[1], q[2])); };
    const grow = (a, ang, turn) => {
      const cyc = ringOf.get(a); if (cyc && !cyc.done) { cyc.done = true; return setRing(cyc, a, ang, turn); }
      const kids = kidsOf(a), angs = [ang + turn * Math.PI / 3, ang - turn * Math.PI / 3, ang], todo = [];
      kids.forEach((n, k) => { if (pos.has(n)) return; const t = angs[Math.min(k, 2)] + (k > 2 ? k : 0); step(a, n, t); todo.push([n, t, k === 0 ? -turn : turn]); });
      todo.forEach(q => grow(q[0], q[1], q[2]));
    };
    // two halves that are the same, joined by one bond: found by giving every atom a mark made from its neighbors' marks, over and over, and pairing the atoms off outward from the bond
    const sym = (() => { const n = nodes.length; if (n < 6 || n % 2) return null; let pair = null;
      for (const u of nodes) { if (pair) break; for (const v of adj.get(u)) { if (ringOf.has(u) && ringOf.get(u) === ringOf.get(v)) continue; const S = new Set([u]), st0 = [u]; while (st0.length) { const x = st0.pop(); for (const y of adj.get(x)) { if (S.has(y) || (x === u && y === v)) continue; S.add(y); st0.push(y); } } if (S.size * 2 === n && !S.has(v)) { pair = [u, v, S]; break; } } }
      if (!pair) return null; const a = pair[0], b = pair[1], S = pair[2]; let inv = new Map(); nodes.forEach(q => inv.set(q, (q.bead || q.el) + adj.get(q).length));
      for (let it = 0; it < Math.min(30, n / 2 + 1); it++) { const nx = new Map(); nodes.forEach(q => nx.set(q, fnv(inv.get(q) + '|' + adj.get(q).map(t => inv.get(t)).sort().join(',')))); inv = nx; }
      if (inv.get(a) !== inv.get(b)) return null;
      const map = new Map([[a, b]]), used = new Set([b]), qu = [a]; while (qu.length) { const u = qu.shift(), u2 = map.get(u); for (const v of adj.get(u)) { if ((u === a && v === b) || map.has(v)) continue; if (!S.has(v)) return null; const v2 = adj.get(u2).find(q => !used.has(q) && !S.has(q) && inv.get(q) === inv.get(v)); if (!v2) return null; map.set(v, v2); used.add(v2); qu.push(v); } }
      if (map.size * 2 !== n) return null; for (const e of map) for (const v of adj.get(e[0])) { if (e[0] === a && v === b) continue; if (!adj.get(e[1]).includes(map.get(v))) return null; }
      return { a, b, map }; })();
    if (sym) { const a = sym.a; sym.map.forEach(v2 => pos.set(v2, { x: 0, y: 0 })); pos.set(a, { x: -L / 2, y: 0 });
      if (ringOf.has(a)) grow(a, Math.PI, 1); else { const todo = []; kidsOf(a).forEach((n, k) => { const t = [3.665, 2.094, 4.712][Math.min(k, 2)]; step(a, n, t); todo.push([n, t, k === 0 ? -1 : 1]); }); todo.forEach(q => grow(q[0], q[1], q[2])); }
      let clash = false; { const hs = Array.from(sym.map.keys()); for (let i = 0; i < hs.length && !clash; i++) for (let j = i; j < hs.length; j++) { const p = pos.get(hs[i]), q = pos.get(hs[j]); if (Math.hypot(p.x + q.x, p.y - q.y) < 0.9 * L) { clash = true; break; } } }
      sym.map.forEach((v2, v) => { const p = pos.get(v); pos.set(v2, { x: -p.x, y: clash ? -p.y : p.y }); }); }
    else { const bfs = s => { const d = new Map([[s, 0]]), q = [s]; let last = s; while (q.length) { const a = q.shift(); last = a; adj.get(a).forEach(n => { if (!d.has(n)) { d.set(n, d.get(a) + 1); q.push(n); } }); } return last; };
      const start = bfs(bfs(nodes[0])); pos.set(start, { x: 0, y: 0 }); grow(start, ringOf.has(start) ? 0 : -Math.PI / 6, 1); }
    nodes.forEach(a => { if (!pos.has(a)) { let hx = 0; pos.forEach(p => { hx = Math.max(hx, p.x); }); pos.set(a, { x: hx + 2 * L, y: 0 }); grow(a, 0, 1); } });
    // Atoms that landed on top of each other are pushed apart, and then every bond is put back to its length: the bonds win
    const settle = (N, get, bonds, rounds) => { const P0 = N.map(get), id = new Map(N.map((a, i) => [a, i])), nb = N.map(() => new Set()), B = []; bonds.forEach(q => { const i = id.get(q[0]), j = id.get(q[1]); if (i == null || j == null) return; nb[i].add(j); nb[j].add(i); B.push([P0[i], P0[j]]); });
      const pull = k => { let worst = 0; B.forEach(q => { const p = q[0], t = q[1], dx = t.x - p.x, dy = t.z - p.z, d = Math.hypot(dx, dy) || 1e-3, df = (d - L) / d * k; worst = Math.max(worst, Math.abs(d - L)); p.x += dx * df; p.z += dy * df; t.x -= dx * df; t.z -= dy * df; }); return worst; };
      for (let it = 0; it < rounds; it++) { let moved = false;
        for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) { if (nb[i].has(j)) continue; const p = P0[i], q = P0[j]; let dx = q.x - p.x, dy = q.z - p.z, d = Math.hypot(dx, dy); const min = N[i].bead || N[j].bead ? L * 1.5 : L * 0.98; if (d >= min) continue; if (d < 1e-3) { dx = Math.cos(i * 2.4 + j); dy = Math.sin(i * 2.4 + j); d = 1; } const push = (min - d) / 2 + 0.02; p.x -= dx / d * push; p.z -= dy / d * push; q.x += dx / d * push; q.z += dy / d * push; moved = true; }
        if (!moved) break; for (let k = 0; k < 3; k++) pull(0.5); }
      for (let k = 0; k < 60 && pull(0.5) > 0.004; k++) { /* until every bond is its length */ } };
    const bondsOf = M => { const out = []; M.forEach((v, a) => v.forEach(n => { out.push([a, n]); })); return out; };
    { const P1 = new Map(); nodes.forEach(a => { const p = pos.get(a); P1.set(a, { x: p.x, z: p.y }); }); settle(nodes, a => P1.get(a), bondsOf(adj), 80); nodes.forEach(a => { const p = pos.get(a), q = P1.get(a); p.x = q.x; p.y = q.z; }); }
    // long way lies left to right; then whichever mirror image is nearest to how it stood before
    let cx = 0, cy = 0, n = 0; pos.forEach(p => { cx += p.x; cy += p.y; n++; }); cx /= n; cy /= n; pos.forEach(p => { p.x -= cx; p.y -= cy; });
    { let sxx = 0, syy = 0, sxy = 0; pos.forEach(p => { sxx += p.x * p.x; syy += p.y * p.y; sxy += p.x * p.y; }); const th = 0.5 * Math.atan2(2 * sxy, sxx - syy), c = Math.cos(-th), s = Math.sin(-th); if (sxx + syy > 0) pos.forEach(p => { const x = p.x * c - p.y * s, y = p.x * s + p.y * c; p.x = x; p.y = y; }); }
    let fx = 1, fy = 1;
    if (seed && seed.flip) { fx = seed.flip[0]; fy = seed.flip[1]; }
    else if (seed && seed.size) { let best = 1e18; [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(m => { let e = 0; seed.forEach((q, a) => { const p = pos.get(a); if (p) e += (p.x * m[0] - q.x) * (p.x * m[0] - q.x) + (-p.y * m[1] - q.z) * (-p.y * m[1] - q.z); }); if (e < best) { best = e; fx = m[0]; fy = m[1]; } }); }
    const lift = new Map(); nodes.forEach((c, ci) => { const nb = adj.get(c); if (nb.length < 3) return; let sgn = ci % 2 ? 1 : -1; nb.filter(t => adj.get(t).length === 1).forEach(t => { lift.set(t, 0.26 * sgn); sgn = -sgn; }); });
    at.flip = [fx, fy];
    pos.forEach((p, a) => { const v = at.get(a); if (v) v.set(p.x * fx, lift.get(a) || 0, -p.y * fy); });
    // each oxygen a zip has closed stands over the chain, half way between the two carbons it joins, on the upper side of the page
    const ringed = closeRings(md, at, adj, arch || []);
    (arch || []).forEach(q => { if (ringed.has(q)) return; const sc = (adj.get(q.o) || [])[0], P1 = sc && at.get(sc), P2 = at.get(q.c), O = at.get(q.o); if (!P1 || !P2 || !O) return; let ux = -(P2.z - P1.z), uz = P2.x - P1.x; const d = Math.hypot(ux, uz) || 1; ux /= d; uz /= d; if (uz > 0) { ux = -ux; uz = -uz; } O.set((P1.x + P2.x) / 2 + ux * 1.5, 0.3, (P1.z + P2.z) / 2 + uz * 1.5); });
    // every bond, the ones a zip closed as well
    const adjF = new Map(); nodes.forEach(a => adjF.set(a, adj.get(a).slice())); (arch || []).forEach(q => { if (ringed.has(q) && adjF.has(q.o) && adjF.has(q.c)) { adjF.get(q.o).push(q.c); adjF.get(q.c).push(q.o); } });
    const allRings = rings.concat(ringed.rings || []);
    if (ringed.size) settle(nodes, a => at.get(a), bondsOf(adjF), 60);
    at.unf = new Map(); nodes.forEach(a => { const v = at.get(a); at.unf.set(a, { x: v.x, z: v.z }); });
    // A drawing too wide for the page turns back under itself in a U. Nothing is cut and nothing is stretched: each
    // ring, and each atom of the chain with all that hangs from it, is carried whole round a half circle. The U is
    // taken when it lets the molecule be drawn larger, toward whichever side leaves the two rows closer, and once a
    // molecule has turned back it stays so until the page turns (seed.fold), so that a cascade does not flip it open.
    { const box = get => { let lo = 1e9, hi = -1e9, zl = 1e9, zh = -1e9; nodes.forEach(a => { const v = get(a); lo = Math.min(lo, v.x); hi = Math.max(hi, v.x); zl = Math.min(zl, v.z); zh = Math.max(zh, v.z); }); return { lo, hi, zl, zh, fit: Math.min(16 / (hi - lo + 1.2), 10 / (zh - zl + 1.6)) }; };
      const b0 = box(a => at.get(a)), keep = seed && seed.fold;
      const tryFold = (dir, shift) => {
        const V = new Map(); nodes.forEach(a => { const v = at.get(a); V.set(a, { x: v.x, z: v.z * dir }); });
        let A = nodes[0], B = nodes[0]; nodes.forEach(a => { if (V.get(a).x < V.get(A).x) A = a; if (V.get(a).x > V.get(B).x) B = a; });
        const par = new Map([[A, null]]), qu = [A]; while (qu.length) { const a = qu.shift(); adjF.get(a).forEach(q => { if (!par.has(q)) { par.set(q, a); qu.push(q); } }); }
        if (!par.has(B)) return null; const bb = new Set(); for (let a = B; a; a = par.get(a)) bb.add(a);
        const uf = new Map(); nodes.forEach(a => uf.set(a, a)); const find = a => { while (uf.get(a) !== a) { uf.set(a, uf.get(uf.get(a))); a = uf.get(a); } return a; }, join = (a, b) => { uf.set(find(a), find(b)); };
        allRings.forEach(c => c.forEach(a => { if (uf.has(a) && uf.has(c[0])) join(a, c[0]); }));
        { const seen = new Set(bb), q2 = Array.from(bb); while (q2.length) { const a = q2.shift(); adjF.get(a).forEach(q => { if (!seen.has(q)) { seen.add(q); join(q, a); q2.push(q); } }); } }
        const bm = new Map(); nodes.forEach(a => { const r0 = find(a); if (!bm.has(r0)) bm.set(r0, { atoms: [], bbs: [], ring: false }); const o = bm.get(r0); o.atoms.push(a); if (bb.has(a)) o.bbs.push(a); }); allRings.forEach(c => { const o = bm.get(find(c[0])); if (o) o.ring = true; });
        const bodies = Array.from(bm.values()); let z0 = 0; bb.forEach(a => { z0 += V.get(a).z; }); z0 /= bb.size;
        let r = 2.5, x1 = 0, arc = 0; for (let pass = 0; pass < 3; pass++) { arc = Math.PI * r; x1 = (b0.lo + b0.hi - arc) / 2; const xm = x1 + arc / 2; let dN = 0, dF = 0; nodes.forEach(a => { const v = V.get(a), d = v.z - z0; if (v.x < xm) dN = Math.max(dN, d); else dF = Math.max(dF, d); }); r = Math.max(2.4, (dN + dF) / 2 + 0.95); }
        arc = Math.PI * r; x1 = (b0.lo + b0.hi - arc) / 2; if (b0.hi - b0.lo < arc + (keep ? 4.5 : 11)) return null;
        // a ring is not bent, and the turn is moved along the chain to a stretch that holds none, if there is one near
        { const refX = o => { let x = 0; (o.bbs.length ? o.bbs : o.atoms).forEach(a => { x += V.get(a).x; }); return x / (o.bbs.length || o.atoms.length); }, rb = bodies.filter(o => o.ring).map(refX), hit = x => rb.some(q => q > x - 0.6 && q < x + arc + 0.6);
          if (hit(x1)) { let got = false; for (let k = 1; k <= 6 && !got; k++) for (const sg of [-1, 1]) { const t = x1 + sg * k * 0.7; if (!hit(t)) { x1 = t; got = true; break; } } } }
        x1 += shift || 0; if (x1 - b0.lo < 2 || b0.hi - x1 - arc < 2) return null;
        const F = { x1, z0, r, dir, cx: 0, cz: 0, bodies }, out = new Map(); bendAll(F, bodies, a => at.unf.get(a), 1, (a, x, z) => out.set(a, { x, z }));
        let sx = 0, sz = 0; out.forEach(p => { sx += p.x; sz += p.z; }); F.cx = sx / out.size; F.cz = sz / out.size; out.forEach(p => { p.x -= F.cx; p.z -= F.cz; });
        const b1 = box(a => out.get(a)); return { F, out, fit: b1.fit };
      };
      if (b0.hi - b0.lo > 11 && (keep || b0.hi - b0.lo + 1.2 > 18.5)) { const want = keep && keep.dir ? [keep.dir] : [1, -1]; const pick = sh => want.map(d => tryFold(d, sh)).filter(t => t && (keep || t.fit > b0.fit * 1.12)).sort((p, q) => q.fit - p.fit), bF = bondsOf(adjF), nbF = (a, b) => adjF.get(a).includes(b);
        // a U in which two atoms still stand on each other after everything has been pushed apart is not taken
        const nearest = () => { let m = 9; for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const p = at.get(nodes[i]), q = at.get(nodes[j]), d = Math.hypot(p.x - q.x, p.z - q.z); if (d < m && !nbF(nodes[i], nodes[j])) m = d; } return m; }, floor = Math.min(0.72 * L, nearest() - 0.03), clear = () => nearest() >= floor;
        // if the turn cannot be made clean where it falls, it is tried a little way along the chain on either side
        let done = false; for (const sh of [0, 1.6, -1.6, 3.2, -3.2, 4.8, -4.8]) { if (done) break; for (const t of pick(sh)) { t.out.forEach((p, a) => { const v = at.get(a); v.x = p.x; v.z = p.z; }); at.fold = t.F; settle(nodes, a => at.get(a), bF, 60); if (clear()) { done = true; break; } at.fold = null; at.unf.forEach((p, a) => { const v = at.get(a); v.x = p.x; v.z = p.z; }); } } } }
    // hydrogens that are drawn: out from their atom, away from its neighbors
    md.atoms.forEach(a => { if (skip.has(a) || a.el !== 'H') return; const v = at.get(a), par = md.neighbors(a).map(q => q.atom).find(q => adjF.has(q)); if (!v) return; if (!par) { v.set(0, 0, 0); return; } const p = at.get(par); let ax = 0, az = 0; adjF.get(par).forEach(q => { const t = at.get(q); ax += t.x - p.x; az += t.z - p.z; }); const d = Math.hypot(ax, az), ux = d > 0.01 ? -ax / d : 0.87, uz = d > 0.01 ? -az / d : -0.5; v.set(p.x + ux * L * 0.62, lift.has(par) ? lift.get(par) * 1.25 : p.y, p.z + uz * L * 0.62); });
  }
  // A ring closed by a zip is drawn as a ring. The chain is laid out open, as it was before the zip, and then each
  // ring in turn is pulled shut into a regular polygon: the carbon that carries the oxygen stays where it is, the
  // ring's atoms take their corners, and everything beyond the ring is carried along with the corner it hangs from.
  // So each step of a cascade moves the page by one ring and reels the rest of the chain in. Rings that share a
  // corner (each zip starts from the carbon the last one closed on) lie on alternate sides of one straight line.
  // A ring that shares a bond with a ring already there is built on that bond. Returns the arches it has drawn.
  function closeRings(md, at, adj, arch) {
    const done = new Set(); done.atoms = new Set(); if (!arch.length) return done;
    const info = arch.map(q => ({ q, O: q.o, p0: (adj.get(q.o) || [])[0], pk: q.c })).filter(r => r.p0 && at.get(r.p0) && at.get(r.pk) && at.get(r.O));
    const order = []; info.filter(r => !info.some(t => t.pk === r.p0)).forEach(r0 => { let r = r0, prev = null; while (r && !order.includes(r)) { r.prev = prev; order.push(r); prev = r; r = info.find(t => t.p0 === prev.pk && !order.includes(t)); } });
    info.forEach(r => { if (!order.includes(r)) { r.prev = null; order.push(r); } });
    const withH = S => { const out = new Set(S); S.forEach(a => { if (a.bead || !md.atoms.includes(a)) return; md.neighbors(a).forEach(n => { if (n.atom.el === 'H' && at.has(n.atom)) out.add(n.atom); }); }); return out; };
    order.forEach(r => {
      const O = r.O, par = new Map([[r.p0, null]]), qu = [r.p0]; while (qu.length) { const a = qu.shift(); if (a === r.pk) break; (adj.get(a) || []).forEach(n => { if (!par.has(n) && n !== O) { par.set(n, a); qu.push(n); } }); }
      if (!par.has(r.pk)) return; const path = []; for (let a = r.pk; a; a = par.get(a)) path.unshift(a);
      const n = path.length + 1, k = path.length - 1; if (n < 4 || n > 11) return;
      // what hangs from each corner once the ring's own bonds are left out
      const idx = new Map(path.map((a, i) => [a, i])), comps = [], owner = new Map(); let bad = false;
      path.forEach((p, i) => { if (owner.has(p)) return; const S = new Set([p]), st0 = [p], ringAtoms = [i]; while (st0.length) { const a = st0.pop(); (adj.get(a) || []).forEach(nb => { if (nb === O || S.has(nb)) return; if (idx.has(a) && idx.has(nb) && Math.abs(idx.get(a) - idx.get(nb)) === 1) return; S.add(nb); st0.push(nb); if (idx.has(nb)) ringAtoms.push(idx.get(nb)); }); }
        ringAtoms.sort((x, y) => x - y); if (ringAtoms.length > 2 || (ringAtoms.length === 2 && ringAtoms[1] - ringAtoms[0] !== 1)) bad = true; const c = { S, ring: ringAtoms }; comps.push(c); ringAtoms.forEach(j => owner.set(path[j], c)); });
      if (bad) return;
      const W = a => at.get(a), c0 = owner.get(r.p0), fused0 = c0.ring.length === 2;
      const s0 = Math.hypot(W(path[1]).x - W(path[0]).x, W(path[1]).z - W(path[0]).z) || 1.55, side = fused0 ? s0 : 1.55, R = side / (2 * Math.sin(Math.PI / n));
      // corners in order round the ring: the oxygen, then the carbons from the one that carries it
      const canon = sg => { const out = []; for (let m = 0; m < n; m++) out.push({ x: R * Math.cos(2 * Math.PI * m / n), z: sg * R * Math.sin(2 * Math.PI * m / n) }); return out; };
      const fitTo = (sg, i1, W1, i2, W2) => { const C = canon(sg), zx = C[i2].x - C[i1].x, zz = C[i2].z - C[i1].z, wx = W2.x - W1.x, wz = W2.z - W1.z, d = zx * zx + zz * zz, ax = (wx * zx + wz * zz) / d, az = (wz * zx - wx * zz) / d, l = Math.hypot(ax, az) || 1, ux = ax / l, uz = az / l; return C.map(c => ({ x: W1.x + (c.x - C[i1].x) * ux - (c.z - C[i1].z) * uz, z: W1.z + (c.x - C[i1].x) * uz + (c.z - C[i1].z) * ux })); };
      const cen = V => { let x = 0, z = 0; V.forEach(v => { x += v.x; z += v.z; }); return { x: x / V.length, z: z / V.length }; };
      let V, u, sd;
      if (fused0) {
        let cx = 0, cz = 0, cn = 0; c0.S.forEach(a => { if (a === path[0] || a === path[1]) return; const w = W(a); cx += w.x; cz += w.z; cn++; }); const mid = { x: (W(path[0]).x + W(path[1]).x) / 2, z: (W(path[0]).z + W(path[1]).z) / 2 };
        V = fitTo(1, 1, W(path[0]), 2, W(path[1])); if (cn) { const c = cen(V); if ((c.x - mid.x) * (cx / cn - mid.x) + (c.z - mid.z) * (cz / cn - mid.z) > 0) V = fitTo(-1, 1, W(path[0]), 2, W(path[1])); }
      } else {
        const A = W(r.p0), B = W(r.pk), ow = W(O); let want;
        // rings that share a corner run on in one straight line, on alternate sides of it
        if (r.prev && r.prev.u && Math.abs(r.prev.u.z) < 0.3) { u = r.prev.u; want = -r.prev.sd; } else { const d = Math.hypot(B.x - A.x, B.z - A.z) || 1; u = Math.abs(B.x - A.x) >= Math.abs(B.z - A.z) ? { x: B.x >= A.x ? 1 : -1, z: 0 } : { x: (B.x - A.x) / d, z: (B.z - A.z) / d }; const tw = r.prev && r.prev.cen ? r.prev.cen : ow; want = (u.x * (tw.z - A.z) - u.z * (tw.x - A.x)) >= 0 ? 1 : -1; }
        const tgt = { x: A.x + u.x, z: A.z + u.z }; V = fitTo(1, 1, A, n - 1, tgt); { const cr = u.x * (V[0].z - A.z) - u.z * (V[0].x - A.x); if ((cr >= 0 ? 1 : -1) !== want) V = fitTo(-1, 1, A, n - 1, tgt); }
        // fitTo keeps the bond length only when the two anchors are a chord apart: scale the ring back to its size about the first carbon
        { const ch = Math.hypot(V[n - 1].x - V[1].x, V[n - 1].z - V[1].z), full = 2 * R * Math.sin(Math.PI * (n - 2) / n), f = full / (ch || 1); V = V.map(v => ({ x: A.x + (v.x - A.x) * f, z: A.z + (v.z - A.z) * f })); }
      }
      { const A = V[1], B = V[n - 1], d = Math.hypot(B.x - A.x, B.z - A.z) || 1; u = { x: (B.x - A.x) / d, z: (B.z - A.z) / d }; sd = (u.x * (V[0].z - A.z) - u.z * (V[0].x - A.x)) >= 0 ? 1 : -1; }
      // carry what hangs from each corner
      comps.forEach(c => { if (c === c0) return; const all = withH(c.S), i = c.ring[0], oa = W(path[i]), na = V[i + 1], ox = oa.x, oz = oa.z;
        if (c.ring.length === 1) all.forEach(a => { const w = W(a); if (w) { w.x += na.x - ox; w.z += na.z - oz; } });
        else { const ob = W(path[i + 1]), nb = V[i + 2], th = Math.atan2(nb.z - na.z, nb.x - na.x) - Math.atan2(ob.z - oz, ob.x - ox), cs = Math.cos(th), sn = Math.sin(th); all.forEach(a => { const w = W(a); if (!w) return; const dx = w.x - ox, dz = w.z - oz; w.x = na.x + dx * cs - dz * sn; w.z = na.z + dx * sn + dz * cs; }); } });
      W(O).x = V[0].x; W(O).z = V[0].z; W(O).y = W(r.p0).y;
      // the small things on the carbon the ring closed on (its new OH, a methyl) stand clear of the ring and of the chain
      { const pk = r.pk, ck = owner.get(pk); if (ck.ring.length === 1) { const c = cen(V), w = W(pk), b = Math.atan2(w.z - c.z, w.x - c.x), outs = (adj.get(pk) || []).filter(nb => nb !== O && !idx.has(nb)), sub = nb => { const S = new Set([nb]), st0 = [nb]; while (st0.length) { const a = st0.pop(); (adj.get(a) || []).forEach(q => { if (q !== pk && !S.has(q)) { S.add(q); st0.push(q); } }); } return S; };
        const subs = outs.map(nb => ({ nb, S: sub(nb) })); subs.forEach(q => { if (q.S.size <= 1) return; const v = W(q.nb), dx = v.x - w.x, dz = v.z - w.z, d = Math.hypot(dx, dz) || 1; if ((dx * u.x + dz * u.z) / d > -0.2) return; withH(q.S).forEach(a => { const t = W(a); if (!t) return; const dt = (t.x - w.x) * u.x + (t.z - w.z) * u.z; t.x -= 2 * dt * u.x; t.z -= 2 * dt * u.z; }); });
        const small = subs.filter(q => q.S.size <= 1), taken = subs.filter(q => q.S.size > 1).map(q => Math.atan2(W(q.nb).z - w.z, W(q.nb).x - w.x)), dist = (a, b2) => Math.abs(Math.atan2(Math.sin(a - b2), Math.cos(a - b2)));
        small.forEach(q => { let best = b, top = -1; [b + 0.9, b - 0.9, b].forEach(a => { const v = taken.length ? Math.min.apply(null, taken.map(t => dist(a, t))) : 1; if (v > top + 0.05) { top = v; best = a; } }); taken.push(best); const nx = w.x + Math.cos(best) * 1.55, nz = w.z + Math.sin(best) * 1.55, ow = W(q.nb), dx = nx - ow.x, dz = nz - ow.z; withH(q.S).forEach(a => { const v = W(a); if (v) { v.x += dx; v.z += dz; } }); }); } }
      r.u = u; r.sd = sd; r.cen = cen(V); done.add(r.q); (done.rings = done.rings || []).push(path.concat([O])); path.forEach(a => done.atoms.add(a)); done.atoms.add(O);
    });
    if (done.size) { let sx = 0, sz = 0, n2 = 0; at.forEach((v, a) => { if (a.el === 'H' || !adj.has(a)) return; sx += v.x; sz += v.z; n2++; }); if (n2) at.forEach((v, a) => { if (adj.has(a) || a.el === 'H') { v.x -= sx / n2; v.z -= sz / n2; } }); }
    return done;
  }
  // the atoms of each ring that holds one of the given oxygens (the shortest way round from one of its carbons to the other)
  function frostOf(md, oxy) { const out = []; (oxy || md.atoms.filter(a => a.frz)).forEach(o => { const nb = md.neighbors(o).map(q => q.atom).filter(a => a.el !== 'H'); if (nb.length !== 2) return; const par = new Map([[nb[0], null]]), qu = [nb[0]]; while (qu.length) { const a = qu.shift(); if (a === nb[1]) break; md.neighbors(a).forEach(q => { const b = q.atom; if (b === o || b.el === 'H' || par.has(b)) return; par.set(b, a); qu.push(b); }); } if (!par.has(nb[1])) return; const ring = [o]; for (let a = nb[1]; a; a = par.get(a)) ring.push(a); if (ring.length <= 9) out.push(ring); }); return out; }
  // the bonds a zip has closed, as pairs of the oxygen and the carbon it closed onto: found by opening a copy of the molecule
  function archesOf(model) { try { const cm = RX.cloneMap(model), cuts = []; RX.reopen(cm.model, cuts); const rev = new Map(); cm.map.forEach((c, a) => rev.set(c, a)); const out = cuts.map(q => ({ c: rev.get(q.c), o: rev.get(q.o) })).filter(q => q.c && q.o);
    // a frozen ring is laid out as the zip ring it was: its oxygen, and the carbon it closed onto (the one that carries a second oxygen)
    model.atoms.forEach(o => { if (!o.frz) return; const cs = model.neighbors(o).map(q => q.atom).filter(c => c.el === 'C'), c = cs.find(k => model.neighbors(k).some(q => q.atom !== o && q.atom.el === 'O')); if (c) out.unshift({ c, o }); }); return out; } catch (e) { return []; } }

  // ---------- ball and stick, drawn as the viewer draws it ----------
  const SPH = new T.SphereGeometry(1, 36, 24), CYL = new T.CylinderGeometry(1, 1, 1, 12), UP = new T.Vector3(0, 1, 0), mBall = {}, mStick = {}, mLetter = {};
  const ballMat = el => mBall[el] || (mBall[el] = std({ color: lin(E[el].color), roughness: 0.3, metalness: 0.08 }));
  const backMat = std({ color: lin(0x9aa2b4), roughness: 0.7 });
  const stickMat = el => mStick[el] || (mStick[el] = std({ color: lin(E[el].color), roughness: 0.35 }));
  function letterMat(el) {
    if (mLetter[el]) return mLetter[el];
    const hx = E[el].color, n = parseInt(hx.slice(1), 16), dark = ((n >> 16 & 255) * 0.299 + (n >> 8 & 255) * 0.587 + (n & 255) * 0.114) > 150, c = canvasTex(128, 128);
    AA.rxPen.write(c.x, el, 64, 64, el.length > 1 ? 74 : 92, { weight: 'heavy', color: dark ? '#2b2420' : '#ffffff', align: 'center', base: 'middle' }); c.t.needsUpdate = true;
    return (mLetter[el] = new T.SpriteMaterial({ map: c.t, depthWrite: false }));
  }
  // a heavy atom wears a collar in the color of the number it adds to
  const ISOC = { c13: 0x1f5fbf, o18: 0xd9a400, c14: 0xb0189a };
  let align = new T.Quaternion();
  // the long axis lies left to right, then the molecule is rolled until it lies as flat as it can
  function setAlign(model) {
    let best = 0; const v = new T.Vector3(1, 0, 0);
    model.atoms.forEach(a => model.atoms.forEach(b => { const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); if (d > best) { best = d; v.set(b.x - a.x, b.y - a.y, b.z - a.z); } }));
    if (v.x < 0) v.negate();
    const q = new T.Quaternion().setFromUnitVectors(v.normalize(), new T.Vector3(1, 0, 0)); let roll = 0, least = 1e9;
    for (let k = 0; k < 36; k++) {
      const r = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), k * Math.PI / 36).multiply(q); let lo = 1e9, hi = -1e9;
      model.atoms.forEach(a => { if (a.el === 'H') return; const y = new T.Vector3(a.x, a.y, a.z).applyQuaternion(r).y; lo = Math.min(lo, y); hi = Math.max(hi, y); });
      if (hi - lo < least) { least = hi - lo; roll = k; }
    }
    align = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), roll * Math.PI / 36).multiply(q);
  }
  function collar(grp, p, R, col) { const t = add(new T.TorusGeometry(R * 1.34, R * 0.15, 8, 32), std({ color: lin(col), roughness: 0.45 }), p.x, p.y, p.z, grp); t.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), camDir.clone().negate()); t.userData.own = true; return t; }
  // lean: a product is drawn without the hydrogens on its carbons and without letters on carbon, so it reads at a
  // distance. The middle molecule is always drawn in full. Nothing is ringed in 3D: what changed is circled in ink
  // on the page under it, see marksOf.
  // seed: where atoms stood before a reaction, so that a flat layout carries on from the last one and does not start afresh
  // A cage or fused rings: some atom has three or more bonds that are each part of a ring. These cannot be laid flat
  // without bonds crossing, so they keep their shape in space.
  // ---------- the fold (docs/tools_chem/FOLD.md): the page draws the molecule exactly as the rules fold it ----------
  // The longest line of atoms from the start end, in rows of eight, left to right then right to left. A ring of eight atoms or fewer is drawn
  // whole where the line passes through it; short arms are groups that stand off their atom; long arms and side rings hang outside. Positions
  // are kept in the frame of the start end, so nothing that has not changed moves when the far end grows or shrinks. A bond made across the
  // fold (a rung) is left out of the layout and drawn as a long bond from row to row.
  const CAGE3D = (() => { try { return new URLSearchParams(root.location.search).get('cage') === '1'; } catch (e) { return false; } })();   // ?cage=1: cages drawn from their shape in space with depth cues (a trial; not good enough yet, so off)
  const HOUT = 0.17;   // the dark outline round a shown hydrogen and its stick, as a share of the hydrogen's radius
  const FL = { L: 1.55, DX: 1.36, ZA: 0.4, RG: 5.0, LEAN: -0.3 };
  const ACROSS = (() => { try { return new URLSearchParams(root.location.search).get('across') === 'rung' ? 'rung' : 'ring'; } catch (e) { return 'ring'; } })();   // ?across=rung: the old long bond from row to row
  // how far apart two atoms that are not bonded must stand, in the molecule's own units, so that their balls never touch on screen
  const radOf = a => BALL(a.el) * (a.el === 'N' || a.el === 'S' || a.el === 'Cl' ? 1.3 : 1), apartOf = (a, b) => Math.max(1.2, 1.12 * (radOf(a) + radOf(b)) + 0.12);
  // the end of a row droops into the gap and the start of the next rises to meet it, so the bond across the turn is as long as any other
  const turnZ = j => (j === 0 ? FL.RG / 2 - FL.L / 2 : 1.08);
  // THE SHAPE DOES NOT LEAP (the owner, 13 November). Once a join across the fold has made the drawing a ring, the new drawing is not laid out afresh:
  // every atom starts where it stood in the last drawing and is moved only as far as the chemistry asks. Bonds are brought to their length, atoms that
  // are not bonded are kept apart, angles are kept open, and every atom is held lightly to where it was; so the ring that a join closes is an uneven loop
  // that lies where the chain already ran, and nothing is turned, flipped or re-ordered. If the result has a bond off its length, two atoms on each other
  // or a bond across a bond, the fresh layout is kept instead (?ease=0 always keeps it).
  const EASE = (() => { try { return new URLSearchParams(root.location.search).get('ease') !== '0'; } catch (e) { return true; } })();
  let EASEWHY = '';
  function easeLay(md, at, skip, seed) { EASEWHY = 'ok';
    const L = FL.L, hv = md.atoms.filter(a => a.el !== 'H' && !skip.has(a) && at.has(a)), n = hv.length, idx = new Map(); hv.forEach((a, i) => idx.set(a, i)); if (n < 4) return false;
    const bonds = [], eq = new Map(), nbr = hv.map(() => []), key = (i, j) => (i < j ? i * 4096 + j : j * 4096 + i); md.bonds.forEach(b => { const i = idx.get(b.a), j = idx.get(b.b); if (i == null || j == null || i === j) return; const k = key(i, j); if (eq.has(k)) return; eq.set(k, L); bonds.push([i, j]); nbr[i].push(j); nbr[j].push(i); });
    const Pp = new Array(n), S = new Array(n), cnt = {}; let seeded = 0; hv.forEach((a, i) => { const s = seed.get(a); if (s && isFinite(s.x) && isFinite(s.z)) { Pp[i] = { x: s.x, z: s.z }; S[i] = { x: s.x, z: s.z }; seeded++; } }); if (seeded < Math.max(3, n * 0.4)) { EASEWHY = 'seed'; return false; }
    // does the fresh drawing leap? what is left of each atom's move when the slide of the whole is taken out; a fresh drawing that stays put is kept as it is
    { let ax = 0, az = 0, bx = 0, bz = 0, m = 0; hv.forEach((a, i) => { if (!S[i]) return; const p = at.get(a); ax += S[i].x; az += S[i].z; bx += p.x; bz += p.z; m++; }); ax /= m; az /= m; bx /= m; bz /= m; let sum = 0, mx = 0; hv.forEach((a, i) => { if (!S[i]) return; const p = at.get(a), d = Math.hypot(p.x - bx - (S[i].x - ax), p.z - bz - (S[i].z - az)); sum += d; if (d > mx) mx = d; }); if (sum / m < 0.3 * L && mx < 1.6 * L) { EASEWHY = 'still'; return false; } }
    // an atom that is new is set a bond out from the atom it hangs on, on the side away from that atom's other bonds
    for (let pass = 0; pass < n; pass++) { let left = false; for (let i = 0; i < n; i++) { if (Pp[i]) continue; const kn = nbr[i].filter(j => Pp[j]); if (!kn.length) { left = true; continue; } const j = kn[0]; let dx = 0, dz = 0; nbr[j].forEach(k => { if (Pp[k]) { dx += Pp[j].x - Pp[k].x; dz += Pp[j].z - Pp[k].z; } }); if (Math.hypot(dx, dz) < 1e-3) { dx = Math.cos(i * 2.4); dz = Math.sin(i * 2.4); } const c = (cnt[j] = (cnt[j] || 0) + 1), rot = c === 1 ? 0 : (c % 2 ? 1 : -1) * 1.05 * Math.ceil((c - 1) / 2), l = Math.hypot(dx, dz), ux = dx / l, uz = dz / l; Pp[i] = { x: Pp[j].x + (ux * Math.cos(rot) - uz * Math.sin(rot)) * L, z: Pp[j].z + (ux * Math.sin(rot) + uz * Math.cos(rot)) * L }; } if (!left) break; }
    if (Pp.some(p => !p)) return false;
    // a small ring is drawn as the regular ring a chemist draws: every pair of its atoms is held at the chord of that polygon
    { const seen = new Set(); bonds.forEach(w => { const par = new Map([[w[0], -1]]), q = [w[0]]; let ok = false; while (q.length && !ok) { const u = q.shift(); for (const v of nbr[u]) { if (u === w[0] && v === w[1]) continue; if (par.has(v)) continue; par.set(v, u); if (v === w[1]) { ok = true; break; } q.push(v); } } if (!ok) return; const ring = []; for (let u = w[1]; u !== -1; u = par.get(u)) ring.push(u); const m = ring.length; if (m > 8) return; const k0 = ring.slice().sort((x, y) => x - y).join(','); if (seen.has(k0)) return; seen.add(k0);
        for (let x = 0; x < m; x++) for (let y = x + 1; y < m; y++) { const k = Math.min(y - x, m - (y - x)); if (k > 1) eq.set(key(ring[x], ring[y]), L * Math.sin(Math.PI * k / m) / Math.sin(Math.PI / m)); } }); }
    const P0 = Pp.map(p => ({ x: p.x, z: p.z })), bondK = new Set(bonds.map(w => key(w[0], w[1])));
    // tried twice: with the small rings held regular, and, if that cannot be drawn cleanly from here, with only the bonds held
    const attempt = useR => { Pp.forEach((p, i) => { p.x = P0[i].x; p.z = P0[i].z; });
    const eqs = []; eq.forEach((d, k) => { if (useR || bondK.has(k)) eqs.push([Math.floor(k / 4096), k % 4096, d]); });
    const pairs = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { if (eq.has(key(i, j)) && (useR || bondK.has(key(i, j)))) continue; const third = nbr[i].some(k => nbr[j].includes(k)); pairs.push([i, j, third ? 1.5 * L : Math.max(apartOf(hv[i], hv[j]) + 0.2, 1.05 * L)]); }
    for (let it = 0; it < (useR ? 420 : 700); it++) { const soft = it < (useR ? 340 : 560) ? 0.01 : 0, ramp = Math.min(1, 0.2 + it / 80);
      eqs.forEach(w => { const A = Pp[w[0]], B = Pp[w[1]]; let dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz); if (d < 1e-3) { dx = Math.cos(w[0] * 1.3 + w[1]); dz = Math.sin(w[0] * 1.3 + w[1]); d = 1; } const k = (d - w[2]) / d * 0.5 * ramp; A.x += dx * k; A.z += dz * k; B.x -= dx * k; B.z -= dz * k; });
      pairs.forEach(w => { const A = Pp[w[0]], B = Pp[w[1]]; let dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz); if (d >= w[2]) return; if (d < 1e-3) { dx = Math.cos(w[0] * 1.3 + w[1]); dz = Math.sin(w[0] * 1.3 + w[1]); d = 1; } const k = (d - w[2]) / d * 0.35; A.x += dx * k; A.z += dz * k; B.x -= dx * k; B.z -= dz * k; });
      if (soft) for (let i = 0; i < n; i++) if (S[i]) { Pp[i].x += (S[i].x - Pp[i].x) * soft; Pp[i].z += (S[i].z - Pp[i].z) * soft; } }
    // is it a clean drawing
    for (const w of eqs) { const d = Math.hypot(Pp[w[0]].x - Pp[w[1]].x, Pp[w[0]].z - Pp[w[1]].z); if (d < 0.85 * w[2] || d > 1.18 * w[2]) { EASEWHY = 'bond'; return false; } }
    if (!useR) { let bad = false; eq.forEach((d0, k) => { const i = Math.floor(k / 4096), j = k % 4096, d = Math.hypot(Pp[i].x - Pp[j].x, Pp[i].z - Pp[j].z); if (d < 0.8 * d0 || d > 1.25 * d0) bad = true; }); if (bad) { EASEWHY = 'ringshape'; return false; } }
    for (const w of pairs) { const d = Math.hypot(Pp[w[0]].x - Pp[w[1]].x, Pp[w[0]].z - Pp[w[1]].z); if (d < 0.9 * w[2]) { EASEWHY = 'near'; return false; } }
    const cross = (a, b, c, d) => { const o = (p, q, r) => (q.x - p.x) * (r.z - p.z) - (q.z - p.z) * (r.x - p.x); return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0; };
    for (let i = 0; i < bonds.length; i++) for (let j = i + 1; j < bonds.length; j++) { const u = bonds[i], v = bonds[j]; if (u[0] === v[0] || u[0] === v[1] || u[1] === v[0] || u[1] === v[1]) continue; if (cross(Pp[u[0]], Pp[u[1]], Pp[v[0]], Pp[v[1]])) { EASEWHY = 'cross'; return false; } }
    return true; };
    if (!attempt(true) && !attempt(false)) return false; EASEWHY = 'ok';
    // set down: the heavy atoms, and what hangs on them is carried along
    const dl = new Map(); hv.forEach((a, i) => { const p = at.get(a); dl.set(a, { x: Pp[i].x - p.x, z: Pp[i].z - p.z }); });
    md.atoms.forEach(a => { if (idx.has(a) || !at.has(a)) return; const par = md.neighbors(a).map(q => q.atom).find(q => dl.has(q)); if (par) { const p = at.get(a), d = dl.get(par); p.x += d.x; p.z += d.z; } });
    hv.forEach((a, i) => { const p = at.get(a); p.x = Pp[i].x; p.z = Pp[i].z; });
    at.fold = null; at.flip = null; at.unf = null;
    return true;
  }
  function foldLay(md, at, skip) {
    let f = null; try { f = P.foldOf(md); } catch (e) { return null; }
    if (!f || !f.path || f.path.length < 2 || f.path.some(a => !at.has(a) || skip.has(a))) return null;
    const heavy = md.atoms.filter(a => a.el !== 'H' && !skip.has(a) && at.has(a)), hs = new Set(heavy), y0 = at.get(f.path[0]).y;
    const uid = new Map(); md.atoms.forEach((a, i) => uid.set(a, i));
    const rk = (a, b) => (uid.get(a) < uid.get(b) ? uid.get(a) + '_' + uid.get(b) : uid.get(b) + '_' + uid.get(a)), rungs = new Set(); f.rungs.forEach(r => rungs.add(rk(r[0], r[1]))); md.bonds.forEach(b => { if (b.rung) rungs.add(rk(b.a, b.b)); });
    // ACROSS 'ring' (the owner's pick): a join across the fold is drawn as a real ring. The loop it closes is one ring body like any other: a clean
    // regular or oval polygon with ordinary bond lengths, set down where the loop lay in the fold; what hangs off it points out, and the two ends of
    // the line that run on from it are swung clear of it. No bond is ever drawn from row to row.
    const ringMode = ACROSS === 'ring' && md.bonds.some(b => hs.has(b.a) && hs.has(b.b) && rungs.has(rk(b.a, b.b)));
    const nb = new Map(); heavy.forEach(a => nb.set(a, [])); md.bonds.forEach(b => { if (hs.has(b.a) && hs.has(b.b) && (ringMode || !rungs.has(rk(b.a, b.b))) && !nb.get(b.a).includes(b.b)) { nb.get(b.a).push(b.b); nb.get(b.b).push(b.a); } });
    // ring atoms: the two ends of any bond that lies on a cycle of the layout graph; rings that share an atom are one body
    const inCyc = (a, b) => { const seen = new Set([a]), q = [a]; while (q.length) { const u = q.pop(); for (const v of nb.get(u)) { if (u === a && v === b) continue; if (v === b) return true; if (!seen.has(v)) { seen.add(v); q.push(v); } } } return false; };
    const cadj = new Map(); heavy.forEach(a => nb.get(a).forEach(b => { if (uid.get(a) < uid.get(b) && inCyc(a, b)) { if (!cadj.has(a)) cadj.set(a, []); if (!cadj.has(b)) cadj.set(b, []); cadj.get(a).push(b); cadj.get(b).push(a); } }));
    const bodyOf = new Map(), bodies = []; cadj.forEach((_, a) => { if (bodyOf.has(a)) return; const bd = { atoms: [] }, q = [a]; bodyOf.set(a, bd); while (q.length) { const u = q.pop(); bd.atoms.push(u); cadj.get(u).forEach(v => { if (!bodyOf.has(v)) { bodyOf.set(v, bd); q.push(v); } }); } bodies.push(bd); });
    const src = new Map(); heavy.forEach(a => { const p = at.get(a); src.set(a, { x: p.x, z: p.z }); });
    if (ringMode) md.bonds.forEach(b => { if (rungs.has(rk(b.a, b.b)) && bodyOf.get(b.a) && bodyOf.get(b.a) === bodyOf.get(b.b)) bodyOf.get(b.a).macro = true; });
    // an oval of n places, a bond apart along its rim: a big ring is drawn wider than tall, as the page is
    const oval = n => { const asp = 1 + 0.45 * Math.max(0, Math.min(1, (n - 8) / 5)), N = 720, cum = [0]; let px = asp, pz = 0; for (let i = 1; i <= N; i++) { const t = 2 * Math.PI * i / N, x = asp * Math.cos(t), z = Math.sin(t); cum.push(cum[i - 1] + Math.hypot(x - px, z - pz)); px = x; pz = z; }
      const sc = n * FL.L * 1.02 / cum[N], out = []; let j = 0; for (let i = 0; i < n; i++) { const want = cum[N] * i / n; while (j < N && cum[j + 1] < want) j++; const fr = (want - cum[j]) / Math.max(1e-9, cum[j + 1] - cum[j]), t = 2 * Math.PI * (j + fr) / N; out.push({ x: sc * asp * Math.cos(t), z: sc * Math.sin(t) }); } return out; };
    // every ring body gets its own clean flat shape, drawn the way a chemist draws it: the first ring a regular polygon, each next ring set on the edge
    // (fused) or the atom (spiro) it shares, on the free side; a bridge is strung between its two ends; then bonds are evened and anything too near is pushed off
    bodies.forEach(bd => { const S0 = new Set(bd.atoms), adj = a => cadj.get(a).filter(b => S0.has(b)), rings = [], seenR = new Set();
      bd.atoms.forEach(a => adj(a).forEach(b => { if (uid.get(a) > uid.get(b)) return; const par = new Map([[a, null]]), q = [a]; let found = false; while (q.length && !found) { const u = q.shift(); for (const v of adj(u)) { if (u === a && v === b) continue; if (par.has(v)) continue; par.set(v, u); if (v === b) { found = true; break; } q.push(v); } } if (!found) return; const ring = []; for (let u = b; u; u = par.get(u)) ring.push(u); const key = ring.map(x => uid.get(x)).sort((x, y) => x - y).join('_'); if (!seenR.has(key)) { seenR.add(key); ring.key = key; rings.push(ring); } }));
      rings.sort((x, y) => (bd.macro ? y.length - x.length : x.length - y.length) || (x.key < y.key ? -1 : 1)); const P2 = new Map(), done = new Set(), poly = n => FL.L / (2 * Math.sin(Math.PI / n));
      const cenP = () => { let x = 0, z = 0, n = 0; P2.forEach(p => { x += p.x; z += p.z; n++; }); return { x: x / (n || 1), z: z / (n || 1) }; };
      if (rings.length) { const r0 = rings[0], n = r0.length, R = poly(n), ov = bd.macro && n >= 9 ? oval(n) : null; r0.forEach((a, i) => P2.set(a, ov ? ov[i] : { x: R * Math.cos(2 * Math.PI * i / n), z: R * Math.sin(2 * Math.PI * i / n) })); done.add(r0); bd.r0 = r0; }
      for (let guard = 0; guard < rings.length * 2 && done.size < rings.length; guard++) { let best = null, bs = -1; rings.forEach(r => { if (done.has(r)) return; const sh = r.filter(a => P2.has(a)).length; if (sh > 0 && sh < r.length && (best == null || sh < bs)) { best = r; bs = sh; } if (sh === r.length) done.add(r); }); if (!best) break; const r = best, n = r.length, R = poly(n), k0 = r.findIndex((a, i) => P2.has(a) && !P2.has(r[(i + 1) % n])), ord = []; for (let i = 0; i < n; i++) ord.push(r[(k0 + 1 + i) % n]); const fresh = ord.filter(a => !P2.has(a)), A = P2.get(r[k0]), nxt = ord[fresh.length], B = P2.get(nxt), cc = cenP();
        if (bs === 1) { let dx = A.x - cc.x, dz = A.z - cc.z; const nbp = adj(r[k0]).filter(a => P2.has(a)); if (nbp.length) { dx = 0; dz = 0; nbp.forEach(a => { dx += A.x - P2.get(a).x; dz += A.z - P2.get(a).z; }); } const l = Math.hypot(dx, dz) || 1, cx = A.x + dx / l * R, cz = A.z + dz / l * R, a0 = Math.atan2(A.z - cz, A.x - cx); fresh.forEach((a, i) => P2.set(a, { x: cx + R * Math.cos(a0 + 2 * Math.PI * (i + 1) / n), z: cz + R * Math.sin(a0 + 2 * Math.PI * (i + 1) / n) })); }
        else { const mx = (A.x + B.x) / 2, mz = (A.z + B.z) / 2, ex = B.x - A.x, ez = B.z - A.z, el = Math.hypot(ex, ez) || 1; let px2 = -ez / el, pz2 = ex / el; if ((mx + px2 - cc.x) * (mx + px2 - cc.x) + (mz + pz2 - cc.z) * (mz + pz2 - cc.z) < (mx - px2 - cc.x) * (mx - px2 - cc.x) + (mz - pz2 - cc.z) * (mz - pz2 - cc.z)) { px2 = -px2; pz2 = -pz2; }
          if (bs === 2 && el < FL.L * 1.2) { const ap = R * Math.cos(Math.PI / n), cx = mx + px2 * ap, cz = mz + pz2 * ap, a0 = Math.atan2(A.z - cz, A.x - cx), a1 = Math.atan2(B.z - cz, B.x - cx); let dir = 1; { let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; dir = d > 0 ? -1 : 1; } fresh.forEach((a, i) => P2.set(a, { x: cx + R * Math.cos(a0 + dir * 2 * Math.PI * (i + 1) / n), z: cz + R * Math.sin(a0 + dir * 2 * Math.PI * (i + 1) / n) })); }
          else { const m = fresh.length; let h = Math.max(0.9, 0.55 * FL.L * Math.sqrt(m));
            // a bridge goes round the outside of what is already drawn between its two ends, on the side where less is in the way
            { let hp = 0, hn = 0; P2.forEach(p => { const rx = p.x - A.x, rz = p.z - A.z, al = (rx * ex + rz * ez) / (el * el), pe = rx * px2 + rz * pz2; if (al < -0.15 || al > 1.15) return; if (pe > 0.05) hp = Math.max(hp, pe); else if (pe < -0.05) hn = Math.max(hn, -pe); }); if (hn + 0.3 < hp) { px2 = -px2; pz2 = -pz2; hp = hn; } if (hp > 0.05) h = Math.max(h, hp + 1.3); }
            fresh.forEach((a, i) => { const u = (i + 1) / (m + 1); P2.set(a, { x: A.x + ex * u + px2 * h * Math.sin(Math.PI * u), z: A.z + ez * u + pz2 * h * Math.sin(Math.PI * u) }); }); } }
        done.add(r); }
      bd.atoms.forEach(a => { if (!P2.has(a)) { const s0 = src.get(a); P2.set(a, { x: s0.x, z: s0.z }); } });
      const pts = bd.atoms.map(a => P2.get(a)), n = pts.length, cs = [], rp = []; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const a = bd.atoms[i], b = bd.atoms[j]; if (cadj.get(a).includes(b)) cs.push([i, j]); else rp.push([i, j, apartOf(a, b) + 0.1]); }
      for (let it = 0; it < 120; it++) { cs.forEach(w => { const A = pts[w[0]], B = pts[w[1]]; let dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz); if (d < 1e-3) { dx = Math.cos(w[0] * 1.3 + w[1]); dz = Math.sin(w[0] * 1.3 + w[1]); d = 1; } const k = (d - FL.L) / d * 0.5; A.x += dx * k; A.z += dz * k; B.x -= dx * k; B.z -= dz * k; });
        rp.forEach(w => { const A = pts[w[0]], B = pts[w[1]]; let dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz); if (d >= w[2]) return; if (d < 1e-3) { dx = Math.cos(w[0] * 1.3 + w[1]); dz = Math.sin(w[0] * 1.3 + w[1]); d = 1; } const k = (d - w[2]) / d * 0.5; A.x += dx * k; A.z += dz * k; B.x -= dx * k; B.z -= dz * k; }); }
      // a cage or a crowded ring system cannot be drawn ring by ring: when the result still has atoms on each other or bonds off their length, the body is
      // spread out instead, every pair of atoms drawn toward a distance that grows with how many bonds lie between them (a flat net, bonds may cross, balls never touch)
      { const bad = () => { for (const w of cs) { const d = Math.hypot(pts[w[0]].x - pts[w[1]].x, pts[w[0]].z - pts[w[1]].z); if (d > FL.L * 1.14 || d < FL.L * 0.8) return true; } for (const w of rp) { if (Math.hypot(pts[w[0]].x - pts[w[1]].x, pts[w[0]].z - pts[w[1]].z) < w[2] - 0.12) return true; } return false; };
        let done3 = false;
        if (CAGE3D && n >= 5 && bad()) { const P3 = bd.atoms.map(a => at.get(a)); let mx = 0, my = 0, mz = 0; P3.forEach(q => { mx += q.x; my += q.y; mz += q.z; }); mx /= n; my /= n; mz /= n; const Q = P3.map(q => [q.x - mx, q.y - my, q.z - mz]);
          const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; Q.forEach(q => { for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i][j] += q[i] * q[j]; });
          const mul = v => [C[0][0] * v[0] + C[0][1] * v[1] + C[0][2] * v[2], C[1][0] * v[0] + C[1][1] * v[1] + C[1][2] * v[2], C[2][0] * v[0] + C[2][1] * v[1] + C[2][2] * v[2]], nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }, dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
          let e1 = nrm([1, 0.3, 0.2]); for (let it = 0; it < 40; it++) e1 = nrm(mul(e1)); let e2 = nrm([0.2, 0.4, 1]); for (let it = 0; it < 40; it++) { let v = mul(e2); const d1 = dot(v, e1); v = [v[0] - d1 * e1[0], v[1] - d1 * e1[1], v[2] - d1 * e1[2]]; e2 = nrm(v); }
          const e3 = nrm([e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]), dep = Q.map(q => dot(q, e3)), dlo = Math.min.apply(null, dep), dhi = Math.max.apply(null, dep);
          if (dhi - dlo > 0.8) { const raw = Q.map((q, i) => ({ x: dot(q, e1) + 0.42 * dep[i], z: dot(q, e2) + 0.3 * dep[i] })); let bl = 0; cs.forEach(w => { bl += Math.hypot(raw[w[0]].x - raw[w[1]].x, raw[w[0]].z - raw[w[1]].z); }); const k3 = FL.L / Math.max(0.3, bl / Math.max(1, cs.length)) * 1.08; raw.forEach((q, i) => { pts[i].x = q.x * k3; pts[i].z = q.z * k3; });
            const home = pts.map(q => ({ x: q.x, z: q.z }));
            for (let it = 0; it < 220; it++) { cs.forEach(w => { const A = pts[w[0]], B = pts[w[1]]; let dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz); if (d < 1e-3) { dx = Math.cos(w[0] * 1.3 + w[1]); dz = Math.sin(w[0] * 1.3 + w[1]); d = 1; } const t = d > FL.L * 1.16 ? FL.L * 1.16 : d < FL.L * 0.82 ? FL.L * 0.82 : d; if (t === d) return; const f = (d - t) / d * 0.5; A.x += dx * f; A.z += dz * f; B.x -= dx * f; B.z -= dz * f; });
              rp.forEach(w => { const A = pts[w[0]], B = pts[w[1]]; let dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz); const t = w[2] - 0.06; if (d >= t) return; if (d < 1e-3) { dx = Math.cos(w[0] * 1.3 + w[1]); dz = Math.sin(w[0] * 1.3 + w[1]); d = 1; } const f = (d - t) / d * 0.5; A.x += dx * f; A.z += dz * f; B.x -= dx * f; B.z -= dz * f; });
              if (it < 180) pts.forEach((q, i) => { q.x += (home[i].x - q.x) * 0.04; q.z += (home[i].z - q.z) * 0.04; }); }
            bd.depth = new Map(); bd.atoms.forEach((a, i) => bd.depth.set(a, (dep[i] - dlo) / (dhi - dlo))); done3 = true; } }
        if (!done3 && n >= 5 && bad()) { const gd = bd.atoms.map(() => new Array(n).fill(99)), ixb = new Map(); bd.atoms.forEach((a, i) => ixb.set(a, i)); for (let i = 0; i < n; i++) { gd[i][i] = 0; const q = [i]; for (let qi = 0; qi < q.length; qi++) { const u = q[qi]; cadj.get(bd.atoms[u]).forEach(b => { const v = ixb.get(b); if (v != null && gd[i][v] > gd[i][u] + 1) { gd[i][v] = gd[i][u] + 1; q.push(v); } }); } }
          const tg = g => (g <= 1 ? FL.L : g === 2 ? FL.L * 1.72 : FL.L * (1.72 + 0.8 * (g - 2)));
          for (let it = 0; it < 400; it++) { const soft = it < 320; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const g = gd[i][j], A = pts[i], B = pts[j]; let dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz); if (d < 1e-3) { dx = Math.cos(i * 1.3 + j); dz = Math.sin(i * 1.3 + j); d = 1; } let t, k; if (g <= 1) { t = FL.L; k = 0.5; } else if (soft) { t = tg(g); k = 0.5 / (g * g); } else { t = Math.max(apartOf(bd.atoms[i], bd.atoms[j]) + 0.15, 1.45); if (d >= t) continue; k = 0.5; } const f = (d - t) / d * k; A.x += dx * f; A.z += dz * f; B.x -= dx * f; B.z -= dz * f; } } } }
      // the new shape keeps the handedness the ring had on the page before (it is never flipped over between two drawings): compare the turn of its first ring
      if (rings.length) { const r0 = rings[0], area = get => { let A2 = 0; r0.forEach((a, i) => { const p = get(a), q = get(r0[(i + 1) % r0.length]); A2 += p.x * q.z - q.x * p.z; }); return A2; }, was = area(a => src.get(a)), is = area(a => P2.get(a)); if (Math.abs(was) > 0.5 && was * is < 0) { pts.forEach(p => { p.z = -p.z; }); bd.flipped = true; } }
      bd.atoms.forEach((a, i) => src.set(a, { x: pts[i].x, z: pts[i].z })); });
    const rows = f.rows || 1, pos = new Map(), grid = new Map(), onPath = new Set(f.path);
    const rowAt = i => { const a = f.path[i]; return a ? f.pos.get(a)[0] : null; }, loose = new Set();
    f.path.forEach((a, i) => { const rc = f.pos.get(a), dn = !!f.down.get(a), r = rc[0]; let z = r * FL.RG + (dn ? FL.ZA : -FL.ZA), x = rc[1] * FL.DX;
      for (let j = 0; j < 2; j++) { if (rowAt(i + j) === r && rowAt(i + j + 1) != null && rowAt(i + j + 1) > r) { z = r * FL.RG + turnZ(j); loose.add(a); } if (rowAt(i - j) === r && rowAt(i - j - 1) != null && rowAt(i - j - 1) < r) { z = r * FL.RG - turnZ(j); loose.add(a); } }
      grid.set(a, { x, z, r, dn }); });
    const cen = list => { let x = 0, z = 0; list.forEach(p => { x += p.x; z += p.z; }); return { x: x / list.length, z: z / list.length }; };
    const rigid = (bd, ang, cs, cg, mir) => bd.atoms.forEach(a => { const s = src.get(a), sx = s.x - cs.x, sz = (mir ? -1 : 1) * (s.z - cs.z); pos.set(a, { x: cg.x + sx * Math.cos(ang) - sz * Math.sin(ang), z: cg.z + sx * Math.sin(ang) + sz * Math.cos(ang) }); });
    // a body in the line: its own regular shape, turned and set down on the places its line atoms take; what is off the line bulges to the outside
    bodies.forEach(bd => { bd.W = f.path.filter(a => bodyOf.get(a) === bd); bd.i0 = bd.W.length ? f.path.indexOf(bd.W[0]) : 1e9; });
    bodies.slice().sort((a, b) => a.i0 - b.i0).forEach(bd => { const W = bd.W; if (!W.length) return; let r0 = grid.get(W[0]).r, side = r0 === 0 && rows > 1 ? -1 : r0 === rows - 1 && rows > 1 ? 1 : (r0 % 2 ? 1 : -1), off = bd.atoms.filter(a => !onPath.has(a)), W0 = W.filter(a => grid.get(a).r === r0);
      // a ring the line only passes along one edge of (two neighbours in the same row): both stand on the same side of the row, the ring on that side, and the line
      // runs on from the far side, so the chain is never drawn through its own ring
      if (W.length === 2 && grid.get(W[1]).r === r0 && f.path.indexOf(W[1]) === f.path.indexOf(W[0]) + 1 && !loose.has(W[0]) && !loose.has(W[1])) { side = grid.get(W[0]).dn ? 1 : -1; if (grid.get(W[1]).dn !== grid.get(W[0]).dn) for (let i = f.path.indexOf(W[1]); i < f.path.length && grid.get(f.path[i]).r === r0; i++) { const a = f.path[i], gq = grid.get(a); if (loose.has(a)) continue; gq.dn = !gq.dn; gq.z = 2 * gq.r * FL.RG - gq.z; } }
      const tryFit = (mir, Wl, Gq) => { const S = Wl.map(a => { const s = src.get(a); return { x: s.x, z: mir ? -s.z : s.z }; }), Gp = Gq || Wl.map(a => grid.get(a)), cs = cen(S), cg = cen(Gp); let ang; if (Wl.length >= 2) { let sn = 0, co = 0; S.forEach((s, i) => { const ax = s.x - cs.x, az = s.z - cs.z, bx = Gp[i].x - cg.x, bz = Gp[i].z - cg.z; sn += ax * bz - az * bx; co += ax * bx + az * bz; }); ang = Math.atan2(sn, co); } else { const all = cen(bd.atoms.map(a => { const s = src.get(a); return { x: s.x, z: mir ? -s.z : s.z }; })); ang = Math.atan2(side, 0) - Math.atan2(all.z - cs.z, all.x - cs.x); }
        return { ang, cs: { x: cs.x, z: mir ? -cs.z : cs.z }, cg, mir }; };
      if (bd.macro) { let bestM = null; [false, true].forEach(mir => { const t = tryFit(mir, W, null); rigid(bd, t.ang, t.cs, t.cg, mir); let err = 0; W.forEach(a => { const p = pos.get(a), q = grid.get(a); err += (p.x - q.x) * (p.x - q.x) + (p.z - q.z) * (p.z - q.z); }); if (!bestM || err < bestM.err - 1e-6) bestM = { t, err }; });
        rigid(bd, bestM.t.ang, bestM.t.cs, bestM.t.cg, bestM.t.mir); bd.c = cen(bd.atoms.map(a => pos.get(a)));
        const iA = f.path.indexOf(W[0]), iB = f.path.indexOf(W[W.length - 1]), hIx = [], aIx = []; for (let i = iA - 1; i >= 0; i--) hIx.push(i); for (let i = iB + 1; i < f.path.length; i++) aIx.push(i);
        const RP = bd.atoms.map(a => pos.get(a)), ptAt = i => { const a = f.path[i]; return pos.get(a) || grid.get(a); };
        const tp = (ix, piv, ph) => { const G0 = grid.get(piv), P1 = pos.get(piv), c = Math.cos(ph), s = Math.sin(ph); return ix.slice(0, 12).map(i => { const g = ptAt(i), dx = g.x - G0.x, dz = g.z - G0.z; return { x: P1.x + dx * c - dz * s, z: P1.z + dx * s + dz * c }; }); };
        const cnt = (Aq, Bq, thr, skipA) => { let n = 0; Aq.forEach((p, i) => { if (i < skipA) return; Bq.forEach(q => { if (Math.hypot(p.x - q.x, p.z - q.z) < thr) n++; }); }); return n; }, cOf = L => (L.length ? cen(L) : null);
        const sgn = (ix, piv, other) => { if (!ix.length) return 1; const o = other || bd.c, d = ph => { const c = cen(tp(ix, piv, ph)); return Math.hypot(c.x - o.x, c.z - o.z); }; return d(0.4) >= d(-0.4) ? 1 : -1; };
        const sH = sgn(hIx, W[0], cOf(tp(aIx, W[W.length - 1], 0))), sA = sgn(aIx, W[W.length - 1], cOf(tp(hIx, W[0], 0)));
        // each end is turned about its place on the ring: of the turns that leave nothing on anything else, the pair that lets the whole drawing be drawn largest in its area
        const HM = HOME, fitOf = L => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; L.forEach(q => q.forEach(p => { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); })); return Math.min(HM.w / (x1 - x0 + 3.2), HM.d / (z1 - z0 + 3.6)); };
        let bt = null; const TH = [0]; for (let q9 = 1; q9 <= 14; q9++) TH.push(q9 * 0.2, -q9 * 0.2);
        // an end of the line is never drawn through the ring: its bonds may not cross a bond of the ring (or of the other end)
        const RB = []; bd.atoms.forEach(a => nb.get(a).forEach(b => { if (uid.get(a) < uid.get(b) && bodyOf.get(b) === bd) RB.push([pos.get(a), pos.get(b)]); }));
        const X9 = (p, q, r, t) => { const d = (q.x - p.x) * (t.z - r.z) - (q.z - p.z) * (t.x - r.x); if (Math.abs(d) < 1e-9) return false; const u = ((r.x - p.x) * (t.z - r.z) - (r.z - p.z) * (t.x - r.x)) / d, v = ((r.x - p.x) * (q.z - p.z) - (r.z - p.z) * (q.x - p.x)) / d; return u > 0.03 && u < 0.97 && v > 0.03 && v < 0.97; };
        const segs = (Tq, piv) => Tq.map((p, i) => [i ? Tq[i - 1] : pos.get(piv), p]), xs = (A2, B2) => { let n = 0; A2.forEach(sa => B2.forEach(sb => { if (X9(sa[0], sa[1], sb[0], sb[1])) n++; })); return n; };
        (hIx.length ? TH : [0]).forEach(t1 => (aIx.length ? TH : [0]).forEach(t2 => { const Hq = tp(hIx, W[0], sH * t1), Aq = tp(aIx, W[W.length - 1], sA * t2), sH2 = segs(Hq, W[0]), sA2 = segs(Aq, W[W.length - 1]), n = cnt(Hq, RP, 2.2, 1) + cnt(Aq, RP, 2.2, 1) + cnt(Hq, Aq, 2.5, 0) + 3 * (xs(sH2, RB) + xs(sA2, RB) + xs(sH2, sA2)), sc = n * 100 - 10 * Math.min(HM.smax, fitOf([RP, Hq, Aq])) + 0.25 * (Math.abs(t1) + Math.abs(t2)); if (!bt || sc < bt.sc - 1e-9) bt = { sc, t1, t2 }; }));
        const carry = (ix, piv, ph) => { if (!ix.length) return; const G0 = { x: grid.get(piv).x, z: grid.get(piv).z }, P1 = pos.get(piv), c = Math.cos(ph), s = Math.sin(ph), mv = p => { const dx = p.x - G0.x, dz = p.z - G0.z; p.x = P1.x + dx * c - dz * s; p.z = P1.z + dx * s + dz * c; }, seenB = new Set();
          ix.forEach(i => { const a = f.path[i], gq = grid.get(a); mv(gq); gq.rot = (gq.rot || 0) + ph; const b2 = bodyOf.get(a); if (b2 && b2 !== bd && b2.c && !seenB.has(b2)) { seenB.add(b2); b2.atoms.forEach(x => mv(pos.get(x))); mv(b2.c); } }); };
        carry(hIx, W[0], sH * bt.t1); carry(aIx, W[W.length - 1], sA * bt.t2); W.forEach(a => { const gq = grid.get(a), p = pos.get(a); gq.x = p.x; gq.z = p.z; }); bd.rows = [Math.min.apply(null, W.map(a => grid.get(a).r)), Math.max.apply(null, W.map(a => grid.get(a).r))]; return; }
      // of the ways to set it down (on all its places in the line, or only on those of its first row; either face up), the one that lands on nothing else
      const others = []; f.path.forEach(a => { if (bodyOf.get(a) !== bd) others.push(pos.get(a) || grid.get(a)); }); pos.forEach((p, a) => { if (!onPath.has(a) && bodyOf.get(a) !== bd) others.push(p); });
      // a ring that had to start a new row (the rule never splits a ring across a turn) leaves places empty behind it. It is drawn where it would stand if the
      // row simply ran on (so the bond into it is a normal bond and it does not jump when the rule moves it); the rest of the line turns under it.
      const pvA = f.path[bd.i0 - 1], gpv = pvA && !bodyOf.get(pvA) ? grid.get(pvA) : null, sgP = gpv ? (gpv.r % 2 === 0 ? 1 : -1) : 1, turnIn = gpv && gpv.r < r0 && W.length >= 2 ? W.map((a, k2) => ({ x: gpv.x + sgP * (k2 + 1) * FL.DX, z: gpv.r * FL.RG + ((k2 % 2 === 0) === gpv.dn ? -FL.ZA : FL.ZA) })) : null;
      // the line that runs on from the ring (and the line that ran into it) must not be drawn through the ring: a chain across its own ring reads as a bridge that is not there
      const crossN = () => { const iA = f.path.indexOf(W[0]), iB = f.path.indexOf(W[W.length - 1]), P2 = a => (bodyOf.get(a) === bd ? pos.get(a) : pos.get(a) || grid.get(a)), segs = []; for (let i = iB; i < Math.min(f.path.length - 1, iB + 3); i++) segs.push([P2(f.path[i]), P2(f.path[i + 1])]); for (let i = iA; i > Math.max(0, iA - 3); i--) segs.push([P2(f.path[i]), P2(f.path[i - 1])]);
        const X = (p, q, r, t) => { const d = (q.x - p.x) * (t.z - r.z) - (q.z - p.z) * (t.x - r.x); if (Math.abs(d) < 1e-9) return false; const u = ((r.x - p.x) * (t.z - r.z) - (r.z - p.z) * (t.x - r.x)) / d, v = ((r.x - p.x) * (q.z - p.z) - (r.z - p.z) * (q.x - p.x)) / d; return u > 0.02 && u < 0.98 && v > 0.02 && v < 0.98; };
        let n = 0; const B = bd.atoms; for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) { if (!nb.get(B[i]).includes(B[j])) continue; const p = pos.get(B[i]), q = pos.get(B[j]); segs.forEach(sg => { if (sg[0] && sg[1] && X(p, q, sg[0], sg[1])) n++; }); } return n; };
      let best = null; (turnIn ? [W] : W0.length < W.length ? [W, W0] : [W]).forEach((Wl, wi) => [false, true].forEach(mir => { const t = tryFit(mir, Wl, turnIn); rigid(bd, t.ang, t.cs, t.cg, mir); let sc = 0, clash = 0; off.forEach(a => { sc += (pos.get(a).z - t.cg.z) * side; }); W.forEach((a, k2) => { const p = pos.get(a), q = turnIn ? turnIn[k2] : grid.get(a); sc -= 0.5 * Math.hypot(p.x - q.x, p.z - q.z); }); bd.atoms.forEach(a => { const p = pos.get(a); others.forEach(o => { if (!turnIn && Math.hypot(o.x - p.x, o.z - p.z) < 1.2) clash++; }); }); clash += 3 * crossN(); if (mir) sc -= 4; if (!best || clash < best.clash || (clash === best.clash && sc > best.sc)) best = { t, sc, clash, wi: turnIn ? 2 : wi }; }));
      rigid(bd, best.t.ang, best.t.cs, best.t.cg, best.t.mir); bd.c = cen(bd.atoms.map(a => pos.get(a)));
      // set down on its first row only: the rest of the line carries on from where the body lets it out
      if (best.wi === 1) { const lastW = W[W.length - 1], pl = pos.get(lastW), gl = grid.get(lastW), dx = pl.x - gl.x, dz = pl.z - gl.z, i1 = f.path.indexOf(lastW); f.path.forEach((a, i) => { if (i >= i1 || bodyOf.get(a) === bd) { const gq = grid.get(a); gq.x += dx; gq.z += dz; } }); }
      // drawn on in its old row: what follows keeps its own row but is moved along so that it starts under the place the ring lets it out
      if (best.wi === 2) { const lastW = W[W.length - 1], pl = pos.get(lastW), gl = grid.get(lastW), dx = pl.x - gl.x, i1 = f.path.indexOf(lastW); f.path.forEach((a, i) => { if (i > i1) { grid.get(a).x += dx; if (i <= i1 + 2) loose.add(a); } }); bd.atoms.forEach(a => { const gq = grid.get(a); if (gq) { gq.r = gpv.r; } }); } });
    f.path.forEach(a => { if (!pos.has(a)) pos.set(a, { x: grid.get(a).x, z: grid.get(a).z }); });
    // everything off the line: groups stand off their atom (leaning aside inside a gap, so two that face do not touch), longer arms zigzag on, side rings keep their shape
    const rowOf = new Map(); f.path.forEach(a => rowOf.set(a, grid.get(a).r)); bodies.forEach(bd => { if (bd.W && bd.W.length) bd.atoms.forEach(a => rowOf.set(a, grid.get(bd.W[0]).r)); });
    const queue = heavy.filter(a => pos.has(a)), par = new Map(), rot = (d, a) => ({ x: d.x * Math.cos(a) - d.z * Math.sin(a), z: d.x * Math.sin(a) + d.z * Math.cos(a) }), far = p => { let m = 1e9; pos.forEach(q => { m = Math.min(m, Math.hypot(q.x - p.x, q.z - p.z)); }); return m; };
    for (let qi = 0; qi < queue.length; qi++) { const p = queue[qi], P0 = pos.get(p), kids = nb.get(p).filter(q => !pos.has(q)); if (!kids.length) continue; let base, lean = 0; const gr = grid.get(p), bd = bodyOf.get(p);
      if (bd && bd.c) { let dx = P0.x - bd.c.x, dz = P0.z - bd.c.z; if (bd.macro) { let sx = 0, sz = 0; nb.get(p).forEach(q => { if (bodyOf.get(q) !== bd || !pos.has(q)) return; const Q2 = pos.get(q), l2 = Math.hypot(Q2.x - P0.x, Q2.z - P0.z) || 1; sx -= (Q2.x - P0.x) / l2; sz -= (Q2.z - P0.z) / l2; }); if (Math.hypot(sx, sz) > 0.25) { dx = sx; dz = sz; } } const l = Math.hypot(dx, dz) || 1; base = { x: dx / l, z: dz / l }; }
      else if (gr && onPath.has(p)) { base = { x: 0, z: gr.dn ? 1 : -1 }; if (gr.rot) base = rot(base, gr.rot); const gap = gr.dn ? gr.r < rows - 1 : gr.r > 0; if (gap) lean = FL.LEAN; const i = f.path.indexOf(p), nxp = f.path[i + 1], pvp = f.path[i - 1], turn = (nxp && f.pos.get(nxp)[0] !== gr.r) || (pvp && f.pos.get(pvp)[0] !== gr.r); if (turn) { const o2 = pos.get(nxp && f.pos.get(nxp)[0] === gr.r ? nxp : pvp && f.pos.get(pvp)[0] === gr.r ? pvp : p), sg = P0.x >= o2.x ? 1 : -1; base = { x: sg * 0.94, z: (gr.dn ? -1 : 1) * 0.34 }; lean = 0; } else if (i === 0 || i === f.path.length - 1) { const o = f.path[i === 0 ? 1 : i - 1], po = pos.get(o), dx = P0.x - po.x, l = Math.abs(dx) || 1; base = { x: 0.62 * dx / l, z: (gr.dn ? 1 : -1) * 0.78 }; lean = 0; } }
      else { const pp = par.get(p), Pp = pp ? pos.get(pp) : { x: P0.x, z: P0.z - 1 }, dx = P0.x - Pp.x, dz = P0.z - Pp.z, l = Math.hypot(dx, dz) || 1, d0 = { x: dx / l, z: dz / l }, c1 = rot(d0, 1.05), c2 = rot(d0, -1.05); base = far({ x: P0.x + c1.x * FL.L, z: P0.z + c1.z * FL.L }) >= far({ x: P0.x + c2.x * FL.L, z: P0.z + c2.z * FL.L }) ? c1 : c2; }
      const fan = kids.length === 1 ? [lean] : kids.length === 2 ? [-0.62, 0.62] : [-0.9, 0, 0.9, 1.8];
      kids.forEach((q, k) => { if (pos.has(q)) return; rowOf.set(q, rowOf.get(p)); const qb0 = bodyOf.get(q); if (qb0 && !qb0.c) qb0.atoms.forEach(a => rowOf.set(a, rowOf.get(p))); const d = rot(base, fan[k % fan.length]), Q = { x: P0.x + d.x * FL.L, z: P0.z + d.z * FL.L }, qb = bodyOf.get(q); par.set(q, p);
        if (qb && !qb.c) { const cs0 = cen(qb.atoms.map(a => src.get(a))), sq = src.get(q), rad = Math.hypot(sq.x - cs0.x, sq.z - cs0.z), ang = Math.atan2(d.z, d.x) - Math.atan2(cs0.z - sq.z, cs0.x - sq.x), cg = { x: Q.x + d.x * rad, z: Q.z + d.z * rad }; rigid(qb, ang, cs0, cg, false); qb.c = cg; qb.atoms.forEach(a => queue.push(a)); }
        else { pos.set(q, Q); queue.push(q); } }); }
    // room: where something in one row would touch something in the next, every row from there on is moved down
    { const placed = heavy.filter(a => pos.has(a)), bonded = (a, b) => nb.get(a).includes(b);
      for (let r = 1; r < rows + 1; r++) { if (ringMode && bodies.some(bd => bd.macro && bd.rows && bd.rows[0] < r && bd.rows[1] >= r)) continue; let need = 0; const up = placed.filter(a => (rowOf.get(a) || 0) < r), lo = placed.filter(a => (rowOf.get(a) || 0) >= r); if (!lo.length) break;
        up.forEach(a => { const A = pos.get(a); lo.forEach(b => { if (bonded(a, b)) return; const B = pos.get(b), dm = apartOf(a, b) + 0.2, dx = Math.abs(A.x - B.x); if (dx >= dm) return; need = Math.max(need, Math.sqrt(dm * dm - dx * dx) - (B.z - A.z)); }); });
        need = Math.min(7, need); if (need > 0.01) lo.forEach(b => { pos.get(b).z += need; }); } }
    // every bond its own length and nothing touching: bonds pull, atoms that are too near push, and each atom is drawn back to its place (the ends of a row only lightly)
    { const A = heavy.filter(a => pos.has(a)), ix = new Map(); A.forEach((a, i) => ix.set(a, i)); const Pp = A.map(a => pos.get(a)), Tg = Pp.map(p => ({ x: p.x, z: p.z })), wt = A.map(a => (loose.has(a) ? 0.02 : onPath.has(a) || bodyOf.get(a) ? 0.4 : 0.06));
      const cons = [], rep2 = [];
      for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) { const a = A[i], b = A[j], ba = bodyOf.get(a), same = ba && ba === bodyOf.get(b), bd = nb.get(a).includes(b);
        if (same) { const sa = src.get(a), sb = src.get(b); cons.push([i, j, Math.hypot(sa.x - sb.x, sa.z - sb.z)]); } else if (bd) cons.push([i, j, FL.L]); else { const mid = nb.get(a).some(c => nb.get(b).includes(c)); rep2.push([i, j, mid ? Math.min(1.75, apartOf(a, b)) : apartOf(a, b) + 0.06]); } }
      const pass = pin => { cons.forEach(c => { const p = Pp[c[0]], q = Pp[c[1]]; let dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz); if (d < 1e-4) { dx = 1; dz = 0; d = 1; } const k = (d - c[2]) / d * 0.5; p.x += dx * k; p.z += dz * k; q.x -= dx * k; q.z -= dz * k; });
        rep2.forEach(c => { const p = Pp[c[0]], q = Pp[c[1]]; let dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz); if (d >= c[2]) return; if (d < 1e-4) { dx = Math.cos(c[0] * 1.3 + c[1]); dz = Math.sin(c[0] * 1.3 + c[1]); d = 1; } const k = (d - c[2]) / d * 0.5; p.x += dx * k; p.z += dz * k; q.x -= dx * k; q.z -= dz * k; });
        if (pin) Pp.forEach((p, i) => { p.x += (Tg[i].x - p.x) * wt[i]; p.z += (Tg[i].z - p.z) * wt[i]; }); };
      for (let it = 0; it < 90; it++) pass(true); for (let it = 0; it < 30; it++) pass(false); }
    // write back: heavy atoms, then the hydrogens that are drawn, each a short way out from its atom
    const hd = new Map(), hlen = new Map(); md.atoms.forEach(a => { if (a.el !== 'H' || skip.has(a) || !at.has(a)) return; const pa = md.neighbors(a).map(q => q.atom).find(q => hs.has(q)); if (pa) { if (!hd.has(pa)) hd.set(pa, []); hd.get(pa).push(a); } });
    hd.forEach((list, pa) => { const p0 = at.get(pa); list.forEach(h => { hlen.set(h, Math.max(0.96, Math.min(1.2, Math.hypot(at.get(h).x - p0.x, at.get(h).z - p0.z) || 0.95))); }); });
    heavy.forEach(a => { const p = pos.get(a); if (p) at.get(a).set(p.x, y0, p.z); });
    hd.forEach((list, pa) => { const P0 = pos.get(pa); if (!P0) return; let mx = 0, mz = 0, n = 0; nb.get(pa).forEach(q => { const p = pos.get(q); if (p) { mx += p.x; mz += p.z; n++; } }); const dx = n ? P0.x - mx / n : 0, dz = n ? P0.z - mz / n : -1, l = Math.hypot(dx, dz) || 1, d = { x: dx / l, z: dz / l };
      list.forEach((h, k) => { const dd = rot(d, list.length === 1 ? 0 : (k - (list.length - 1) / 2) * 1.1); at.get(h).set(P0.x + dd.x * hlen.get(h), y0, P0.z + dd.z * hlen.get(h)); }); });
    at.fold = null; at.flip = null; at.unf = null;
    const depth = new Map(); bodies.forEach(bd => { if (bd.depth) bd.depth.forEach((d, a) => depth.set(a, d)); }); return { f, rows, rk, rungSet: ringMode ? new Set() : rungs, bodyOf, depth, ring: ringMode };
  }
  // the box of what is drawn, with the atoms' own radii, in the molecule's units
  function drawnBox(m) { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; m.balls.forEach((b, a) => { const p = m.at.get(a); if (!p) return; const r = (b.R || 0.4) + 0.1; x0 = Math.min(x0, p.x - r); x1 = Math.max(x1, p.x + r); z0 = Math.min(z0, p.z - r - 0.3); z1 = Math.max(z1, p.z + r); }); return { x0, x1, z0, z1, w: x1 - x0, d: z1 - z0, cx: (x0 + x1) / 2, cz: (z0 + z1) / 2 }; }
  function caged(model, arch) {
    // a ring that closes across the slime's bridge is tied to the big ring the bridge made: it cannot lie flat either
    if ((arch || []).length && model.atoms.some(a => a.slime)) return true;
    const cutB = (a, b) => (arch || []).some(q => (q.o === a && q.c === b) || (q.o === b && q.c === a));
    const hv = model.atoms.filter(a => a.el !== 'H'), nb = a => model.neighbors(a).map(q => q.atom).filter(b => b.el !== 'H' && !cutB(a, b));
    const inRing = (a, b) => { const seen = new Set([a]), st = [a]; while (st.length) { const u = st.pop(); for (const v of nb(u)) { if (u === a && v === b) continue; if (v === b) return true; if (!seen.has(v)) { seen.add(v); st.push(v); } } } return false; };
    return hv.some(a => nb(a).filter(b => inRing(a, b)).length >= 3);
  }
  // (builder 16) KNOTTY RING SYSTEMS: four ways to draw a cage or a many-ring skeleton, for the owner to pick from (?knot=a|b|c|d, or knotSet()).
  // a: as now (the declashed layout). b: TEXTBOOK: a ring system that matches a stored cage drawing (by its ring-bond graph, so substituted and
  // hetero ones match too) is set down as that drawing, back bonds thinner and paler; fused and spiro systems are regular polygons sharing edges
  // or a corner; every substituent points out into the widest free angle. c: FLAT: the same but strictly flat (a cage as its flat projection, no
  // depth) with smaller balls on the ring system. d: OPENED OUT: as now, the ring system spread about its middle while nothing is playing, its
  // bonds drawn as thin lines, back to normal the moment a step plays. knotLay() moves the targets in `at` before anything is built from them.
  const KNOT = { mode: (() => { try { const v = new URLSearchParams(root.location.search).get('knot'); return v === 'a' || v === 'c' || v === 'd' ? v : 'b'; } catch (e) { return 'b'; } })(), open: 1.55, small: 0.72,
    T: {"adamantane":{"n":10,"b":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[7,9],[5,0],[8,1],[9,3]],"p":[[0.21,-0.35,1.0],[0.38,0.78,0.85],[1.23,0.72,0.57],[0.86,-0.06,0.3],[0.69,-1.18,0.45],[-0.17,-1.13,0.73],[-1.23,-0.72,0.58],[-1.07,0.41,0.43],[-0.69,1.18,0.7],[-0.21,0.35,0.15]],"x":1,"f":[[-0.82,-0.47],[0,0],[0.0,0.95],[0.0,1.9],[-1.08,0.63],[-1.65,-0.95],[-0.0,-1.25],[1.65,-0.95],[0.82,-0.48],[1.08,0.62]]},"cubane":{"n":8,"b":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[3,0],[5,0],[6,1],[7,2],[7,4]],"p":[[-0.875,-0.915,1.0],[0.275,-0.915,1.0],[0.275,0.235,1.0],[-0.875,0.235,1.0],[-0.275,0.915,0.15],[-0.275,-0.235,0.15],[0.875,-0.235,0.15],[0.875,0.915,0.15]],"x":2,"f":[[1.03,1.03],[-1.03,1.03],[-1.03,-1.03],[1.03,-1.03],[0.44,-0.44],[0.44,0.44],[-0.44,0.44],[-0.44,-0.44]]},"norbornane":{"n":7,"b":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[5,0],[6,2]],"p":[[-0.11,-1.16,0.3],[-1.06,-0.47,0.3],[-0.67,0.53,0.57],[0.04,1.07,0.15],[1.0,0.38,0.15],[0.71,-0.47,0.57],[0.09,0.12,1.0]],"x":0,"f":[[-0.5,0.87],[0.5,0.87],[1.0,0.0],[0.5,-0.87],[-0.5,-0.87],[-1.0,0.0],[0,0]]},"bicyclo222":{"n":8,"b":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[5,0],[7,2]],"p":[[0.6,0.78,0.6],[-0.6,0.78,0.6],[-1.25,0,0.6],[-0.6,-0.78,1],[0.6,-0.78,1],[1.25,0,0.6],[0.42,0.05,0.15],[-0.42,0.05,0.15]],"x":0},"bicyclo321":{"n":8,"b":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[5,7],[6,0],[7,2]],"p":[[-0.54,-1.21,1.0],[0.59,-1.04,0.94],[0.88,-0.18,0.55],[0.99,0.81,0.87],[-0.05,1.27,0.88],[-0.72,0.54,0.56],[-1.17,-0.25,0.95],[0.02,0.06,0.15]],"x":0},"bicyclo331":{"n":9,"b":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[6,8],[7,0],[8,2]],"p":[[1.49,-0.51,0.43],[0.66,-1.24,0.54],[-0.2,-0.63,0.54],[-1.23,-0.68,0.44],[-1.5,0.37,0.27],[-0.63,1.07,0.15],[0.26,0.92,0.57],[1.18,0.53,0.25],[-0.02,0.16,1.0]],"x":0},"bicyclo311":{"n":7,"b":[[0,1],[1,2],[2,3],[3,4],[4,5],[4,6],[5,0],[6,2]],"p":[[-1.02,0.39,0.15],[-0.08,1.08,0.22],[0.63,0.62,0.6],[1.1,-0.42,0.43],[0.06,-0.88,0.6],[-0.78,-0.75,0.22],[0.09,-0.04,1.0]],"x":0},"bicyclo211":{"n":6,"b":[[0,1],[1,2],[2,3],[3,4],[4,5],[4,0],[5,2]],"p":[[-0.89,-0.12,0.15],[-0.22,0.88,0.15],[0.59,0.56,0.56],[-0.06,0.04,1.0],[-0.3,-0.76,0.56],[0.88,-0.6,0.42]],"x":0},"bicyclo322":{"n":9,"b":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[5,7],[7,8],[6,0],[8,2]],"p":[[1.11,0.14,0.28],[1.34,-0.57,0.61],[0.58,-0.39,0.94],[-0.45,-1.09,0.91],[-1.29,-0.67,0.64],[-0.93,0.38,0.44],[-0.07,0.15,0.15],[-0.57,1.24,0.72],[0.27,0.81,1.0]],"x":1},"twistane":{"n":11,"b":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[8,10],[6,0],[10,2],[9,4]],"p":[[-0.97,1.08,0.31],[-1.6,0.46,0.57],[-1.02,-0.37,0.78],[-0.15,0.13,1.0],[0.94,0.28,0.83],[0.9,1.15,0.57],[0.23,0.84,0.27],[0.45,-0.31,0.15],[0.5,-1.14,0.42],[1.31,-0.79,0.68],[-0.6,-1.33,0.58]],"x":1},"noradamantane":{"n":9,"b":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[5,0],[8,1],[7,3]],"p":[[0.11,0.34,1.0],[0.52,1.02,0.62],[1.26,0.35,0.33],[0.48,-0.51,0.17],[0.35,-1.31,0.55],[-0.42,-0.71,0.84],[-1.29,-0.45,0.51],[-0.62,0.07,0.15],[-0.38,1.21,0.29]],"x":1},"bicyclo111":{"n":5,"b":[[0,1],[1,2],[2,3],[3,4],[3,0],[4,1]],"p":[[-0.81,0.02,0.15],[-0.02,-0.76,0.44],[0.84,-0.02,0.17],[0.02,0.76,0.44],[-0.02,-0.0,1.0]],"x":0},"bicyclo220":{"n":6,"b":[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[5,2]],"p":[[0.07,-1.11,0.29],[-0.91,-0.6,0.51],[-0.32,0.12,1.0],[-0.14,1.14,0.65],[0.67,0.69,0.15],[0.64,-0.25,0.64]],"x":0},"prismane":{"n":6,"b":[[0,1],[1,2],[2,3],[3,4],[4,5],[2,0],[4,0],[5,1],[5,3]],"p":[[-0.1,-0.15,1.0],[-0.93,-0.17,0.5],[0.04,-0.95,0.48],[0.7,-0.1,0.15],[0.56,0.7,0.67],[-0.27,0.68,0.16]],"x":1}} };
  function knotGraph(model, skip) {
    const A = model.atoms.filter(a => !skip.has(a) && a.el !== 'H' && !a.bead && !a.poly), ix = new Map(); A.forEach((a, i) => ix.set(a, i));
    const N = A.map(a => Array.from(new Set(model.neighbors(a).map(q => ix.get(q.atom)).filter(j => j != null))));
    const conn = (s, t) => { const seen = new Set([s]), q = [s]; while (q.length) { const u = q.pop(); for (const v of N[u]) { if (u === s && v === t) continue; if (v === t) return true; if (!seen.has(v)) { seen.add(v); q.push(v); } } } return false; };
    const RB = N.map((l, i) => l.filter(j => conn(i, j))), sys = [], seen = new Set();
    for (let i = 0; i < A.length; i++) { if (!RB[i].length || seen.has(i)) continue; const l = [], q = [i]; seen.add(i); while (q.length) { const u = q.pop(); l.push(u); RB[u].forEach(v => { if (!seen.has(v)) { seen.add(v); q.push(v); } }); } let e = 0; l.forEach(u => { e += RB[u].length; }); if (e / 2 - l.length + 1 >= 2) sys.push(l); }
    return { A, ix, N, RB, sys };
  }
  // every way a stored drawing fits a ring system (same graph): each is a list, by the system's own order, of [u, v, depth]
  function knotMatch(G, sl, flat) {
    const n = sl.length, loc = new Map(); sl.forEach((g, i) => loc.set(g, i)); const adj = sl.map(g => G.RB[g].map(h => loc.get(h))), ne = adj.reduce((s, l) => s + l.length, 0) / 2, dg = adj.map(l => l.length).sort().join('');
    for (const name of Object.keys(KNOT.T)) { const t = KNOT.T[name]; if (t.n !== n || t.b.length !== ne) continue; if (!t.adj) { t.adj = []; for (let i = 0; i < n; i++) t.adj.push([]); t.b.forEach(e => { t.adj[e[0]].push(e[1]); t.adj[e[1]].push(e[0]); }); t.dg = t.adj.map(l => l.length).sort().join(''); const od = [0], sn = new Set([0]); for (let k = 0; k < od.length; k++) t.adj[od[k]].forEach(v => { if (!sn.has(v)) { sn.add(v); od.push(v); } }); t.od = od; }
      if (t.dg !== dg) continue; const maps = [], mp = new Array(n).fill(-1), used = new Array(n).fill(false);
      const go = k => { if (maps.length >= 96) return; if (k === n) { maps.push(mp.slice()); return; } const tv = t.od[k]; for (let c = 0; c < n; c++) { if (used[c] || adj[c].length !== t.adj[tv].length) continue; let ok = true; for (const tw of t.adj[tv]) { if (mp[tw] >= 0 && adj[c].indexOf(mp[tw]) < 0) { ok = false; break; } } if (!ok) continue; mp[tv] = c; used[c] = true; go(k + 1); mp[tv] = -1; used[c] = false; } };
      go(0); if (!maps.length) continue; const src = flat && t.f ? t.f : t.p, dep = !(flat);
      const hull = src.map((p, i) => { for (let k = 0; k < 24; k++) { const cx = Math.cos(k * Math.PI / 12), cz = Math.sin(k * Math.PI / 12), v = p[0] * cx + p[1] * cz; if (src.every((q, j) => j === i || q[0] * cx + q[1] * cz < v - 0.02)) return 1; } return 0; });
      return { name, cross: flat && t.f ? 0 : t.x, hull: maps.map(m => { const o = new Array(n); for (let tv = 0; tv < n; tv++) o[m[tv]] = hull[tv]; return o; }), cands: maps.map(m => { const o = new Array(n); for (let tv = 0; tv < n; tv++) o[m[tv]] = [src[tv][0], src[tv][1], dep ? src[tv][2] : null]; return o; }) }; }
    return null;
  }
  // rings that share an edge or a corner, as regular polygons (decalin, the steroid core, a spiro pair and the like); null when a ring bridges
  function knotPoly(G, sl) {
    const n = sl.length, loc = new Map(); sl.forEach((g, i) => loc.set(g, i)); const adj = sl.map(g => G.RB[g].map(h => loc.get(h))), rings = [], keys = new Set();
    for (let i = 0; i < n; i++) for (const j of adj[i]) { if (j < i) continue; const prev = new Map([[i, -1]]), q = [i]; let found = false; for (let h = 0; h < q.length && !found; h++) { const u = q[h]; for (const v of adj[u]) { if (u === i && v === j) continue; if (prev.has(v)) continue; prev.set(v, u); if (v === j) { found = true; break; } q.push(v); } } if (!found) continue; const r = []; for (let v = j; v !== -1; v = prev.get(v)) r.push(v); const k = r.slice().sort((a, b) => a - b).join(','); if (!keys.has(k)) { keys.add(k); rings.push(r); } }
    rings.sort((a, b) => a.length - b.length); const cov = new Set(), sel = [], ek = (a, b) => (a < b ? a * 100 + b : b * 100 + a);
    rings.forEach(r => { let nw = false; r.forEach((a, k) => { const e = ek(a, r[(k + 1) % r.length]); if (!cov.has(e)) nw = true; }); if (nw) { sel.push(r); r.forEach((a, k) => cov.add(ek(a, r[(k + 1) % r.length]))); } });
    const pos = new Array(n).fill(null), put = new Array(sel.length).fill(false); if (!sel.length) return null;
    { const mid = sel.map((r, i) => [sel.filter(q => q !== r && q.some(a => r.indexOf(a) >= 0)).length, i]).sort((a, b) => b[0] - a[0])[0][1], r = sel[mid], k = r.length, rad = 1 / (2 * Math.sin(Math.PI / k)); r.forEach((a, i) => { pos[a] = [rad * Math.cos(2 * Math.PI * i / k), rad * Math.sin(2 * Math.PI * i / k)]; }); put[mid] = true; }
    for (let guard = 0; guard < sel.length + 2; guard++) { let any = false;
      for (let ri = 0; ri < sel.length; ri++) { if (put[ri]) continue; const r = sel[ri], k = r.length, pl = r.map(a => !!pos[a]), np = pl.filter(Boolean).length; if (!np) continue; if (np === k) { put[ri] = true; continue; }
        // the placed atoms must be one run in the ring's own order
        let st0 = -1; for (let i = 0; i < k; i++) if (pl[i] && !pl[(i + k - 1) % k]) { if (st0 >= 0) return null; st0 = i; } if (st0 < 0 || np > 2) return null;
        const rad = 1 / (2 * Math.sin(Math.PI / k)), a = r[st0], b = r[(st0 + np - 1) % k], A0 = pos[a], B0 = pos[b]; let cx, cz;
        const side = [0, 0]; let sc = 0; [a, b].forEach(u => adj[u].forEach(v => { if (pos[v] && v !== a && v !== b) { side[0] += pos[v][0]; side[1] += pos[v][1]; sc++; } })); if (sc) { side[0] /= sc; side[1] /= sc; }
        if (np === 1) { let dx = A0[0] - side[0], dz = A0[1] - side[1]; const l = Math.hypot(dx, dz) || 1; cx = A0[0] + dx / l * rad; cz = A0[1] + dz / l * rad; }
        else { const mx = (A0[0] + B0[0]) / 2, mz = (A0[1] + B0[1]) / 2; let nx = -(B0[1] - A0[1]), nz = B0[0] - A0[0]; const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l; const sg = (side[0] - mx) * nx + (side[1] - mz) * nz > 0 ? -1 : 1, h = rad * Math.cos(Math.PI / k); cx = mx + nx * h * sg; cz = mz + nz * h * sg; }
        const ta = Math.atan2(A0[1] - cz, A0[0] - cx); let stp = 2 * Math.PI / k; if (np === 2) { let d = Math.atan2(B0[1] - cz, B0[0] - cx) - ta; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; stp = d > 0 ? stp : -stp; }
        for (let i = np; i < k; i++) { const an = ta + stp * i; pos[r[(st0 + i) % k]] = [cx + rad * Math.cos(an), cz + rad * Math.sin(an)]; } put[ri] = true; any = true; }
      if (!any) break; }
    if (pos.some(p => !p)) return null;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (adj[i].indexOf(j) < 0 && Math.hypot(pos[i][0] - pos[j][0], pos[i][1] - pos[j][1]) < 0.7) return null;
    return { name: 'polygons', cross: 0, cands: [pos.map(p => [p[0], p[1], null])] };
  }
  function knotLay(model, at, skip, mode, fresh, seedO) {
    const G = knotGraph(model, skip); if (!G.sys.length) return null; const L = FL.L, n = G.A.length, sysOf = new Array(n).fill(-1); G.sys.forEach((s, k) => s.forEach(i => { sysOf[i] = k; }));
    const KN = { mode, set: new Set(), depth: new Map(), names: [], sys: G.sys.map(s => s.map(i => G.A[i])), own: new Map() }; G.sys.forEach(s => s.forEach(i => KN.set.add(G.A[i])));
    if (mode === 'd') { // each atom outside rides with the ring atom it hangs from
      const q = []; G.sys.forEach(s => s.forEach(i => { KN.own.set(G.A[i], G.A[i]); q.push(G.A[i]); })); for (let h = 0; h < q.length; h++) model.neighbors(q[h]).forEach(e => { if (!KN.own.has(e.atom)) { KN.own.set(e.atom, KN.own.get(q[h])); q.push(e.atom); } }); KN.sysOf = new Map(); KN.sys.forEach((s, k) => s.forEach(a => KN.sysOf.set(a, k))); return KN; }
    const draw = G.sys.map(s => knotMatch(G, s, mode === 'c') || knotPoly(G, s)), done = G.sys.map(() => false), P = i => at.get(G.A[i]);
    const gapAt = (dirs, k, probe) => { // k directions into the widest free angle between the bonds already drawn at an atom
      if (!dirs.length) return Array.from({ length: k }, (q, i) => i * 2 * Math.PI / k); const s = dirs.slice().sort((a, b) => a - b); let bi = 0, bg = -1, bg2 = 0; for (let i = 0; i < s.length; i++) { const g = (i + 1 < s.length ? s[i + 1] : s[0] + 2 * Math.PI) - s[i]; if (g > bg) { bg = g; bi = i; } } if (probe && k === 1) { let bsc = -1; for (let i = 0; i < s.length; i++) { const g = (i + 1 < s.length ? s[i + 1] : s[0] + 2 * Math.PI) - s[i]; if (g < bg - 0.2) continue; const sc = probe(s[i] + g / 2); if (sc > bsc) { bsc = sc; bi = i; bg2 = g; } } bg = bg2; } return Array.from({ length: k }, (q, i) => s[bi] + bg * (i + 1) / (k + 1)); };
    const place = (k, e, from) => {
      const sl = G.sys[k], D = draw[k]; done[k] = true; if (!D) return; const m = sl.length, old = sl.map(i => P(i).clone()), li = sl.indexOf(e); let best = null;
      const nsub = sl.map(r => G.N[r].filter(h => sysOf[h] !== k).length);
      D.cands.forEach((c, ci) => [1, -1].forEach(mir => { const t = c.map(p => [p[0] * mir * L, -p[1] * L]); let ang, tx, tz, ox, oz;
        if (e == null) { let cx = 0, cz = 0, ux = 0, uz = 0; t.forEach((p, i) => { ux += p[0] / m; uz += p[1] / m; cx += old[i].x / m; cz += old[i].z / m; }); let a = 0, b = 0; t.forEach((p, i) => { const px = p[0] - ux, pz = p[1] - uz, qx = old[i].x - cx, qz = old[i].z - cz; a += px * qx + pz * qz; b += px * qz - pz * qx; }); ang = Math.atan2(b, a); ox = ux; oz = uz; tx = cx; tz = cz; }
        else { const dirs = G.RB[e].filter(h => sysOf[h] === k).map(h => { const q = t[sl.indexOf(h)]; return Math.atan2(q[1] - t[li][1], q[0] - t[li][0]); }), out = gapAt(dirs, 1)[0], want = Math.atan2(P(from).z - old[li].z, P(from).x - old[li].x); ang = want - out; ox = t[li][0]; oz = t[li][1]; tx = old[li].x; tz = old[li].z; }
        const co = Math.cos(ang), si = Math.sin(ang), pts = t.map(p => [tx + (p[0] - ox) * co - (p[1] - oz) * si, tz + (p[0] - ox) * si + (p[1] - oz) * co]); let err = 0; if (D.hull) nsub.forEach((q, i) => { if (q && !D.hull[ci][i]) err += 1e4 * q; }); pts.forEach((p, i) => { err += (p[0] - old[i].x) * (p[0] - old[i].x) + (p[1] - old[i].z) * (p[1] - old[i].z); }); if (!best || err < best.err) best = { err, pts, c, ang }; }));
      let yb = 0; old.forEach(p => { yb += p.y / m; }); KN.names.push(D.name); KN.cross = (KN.cross || 0) + D.cross; if (e == null && KN.rootAng == null) KN.rootAng = D.name === 'polygons' ? null : best.ang;
      sl.forEach((i, j) => { const a = G.A[i], p = P(i), dx = best.pts[j][0] - old[j].x, dz = best.pts[j][1] - old[j].z, d = best.c[j][2]; p.x = best.pts[j][0]; p.z = best.pts[j][1]; p.y = yb; if (d != null) KN.depth.set(a, d); KN.placed = true;
        model.neighbors(a).forEach(q => { if (!G.ix.has(q.atom)) { const h = at.get(q.atom); if (h) { h.x += dx; h.z += dz; } } }); });
      // what hangs off the ring system: each piece is turned about its ring atom to point out, and carried with it
      sl.forEach((r, j) => { const subs = G.N[r].filter(s => sysOf[s] !== k && s !== from); if (!subs.length) return; const pr = P(r), dirs = G.N[r].filter(h => subs.indexOf(h) < 0).map(h => Math.atan2(P(h).z - pr.z, P(h).x - pr.x)), outs = gapAt(dirs, subs.length, an => { const px = pr.x + Math.cos(an) * L, pz = pr.z + Math.sin(an) * L; let md = 0; sl.forEach(h => { if (h === r) return; const q = P(h); md += Math.hypot(q.x - px, q.z - pz); }); return md; });
        // keep the pieces in the order they already stand in, so nothing swaps sides
        const cur = subs.map(s => Math.atan2(P(s).z - old[j].z, P(s).x - old[j].x)), base = outs[0], nrm = a => { let d = a - base; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }, ord = subs.map((s, i) => i).sort((x, y) => nrm(cur[x]) - nrm(cur[y]));
        ord.forEach((si, oi) => { const s = subs[si], ra = G.A[r], sa = G.A[s], seen = new Set([ra, sa]), q = [sa], entry = []; for (let h = 0; h < q.length; h++) model.neighbors(q[h]).forEach(e2 => { const b = e2.atom; if (seen.has(b)) return; seen.add(b); q.push(b); const bi = G.ix.get(b), pi = G.ix.get(q[h]); if (bi != null && sysOf[bi] >= 0 && !done[sysOf[bi]] && (pi == null || sysOf[pi] !== sysOf[bi]) && !entry.some(x => x[0] === sysOf[bi])) entry.push([sysOf[bi], bi, pi]); });
          const rot = outs[oi] - cur[si], co = Math.cos(rot), sn = Math.sin(rot), ox = old[j].x, oz = old[j].z; q.forEach(b => { const p = at.get(b); if (!p) return; const x = p.x - ox, z = p.z - oz; p.x = pr.x + x * co - z * sn; p.z = pr.z + x * sn + z * co; });
          entry.forEach(x => { if (!done[x[0]] && x[2] != null) place(x[0], x[1], x[2]); }); }); });
    };
    const order = G.sys.map((s, k) => k).filter(k => draw[k]).sort((a, b) => G.sys[b].length - G.sys[a].length); if (!order.length) return null;
    order.forEach(k => { if (!done[k]) place(k, null, null); });
    // a fresh picture is turned so its long way lies along the page's long way (an eased one keeps the way it already lay)
    const keep = seedO && seedO.size ? seedO : null; if (keep && KN.placed) { let n2 = 0, ax = 0, az = 0, bx = 0, bz = 0; G.A.forEach(a => { const q = keep.get(a); if (!q) return; const p = at.get(a); ax += p.x; az += p.z; bx += q.x; bz += q.z; n2++; }); if (n2 >= 3) { ax /= n2; az /= n2; bx /= n2; bz /= n2; let sa = 0, sb = 0; G.A.forEach(a => { const q = keep.get(a); if (!q) return; const p = at.get(a), px = p.x - ax, pz = p.z - az, qx = q.x - bx, qz = q.z - bz; sa += px * qx + pz * qz; sb += px * qz - pz * qx; }); const th = Math.atan2(sb, sa), co = Math.cos(th), sn = Math.sin(th); if (Math.abs(th) > 0.03) at.forEach(p => { const x = p.x - ax, z = p.z - az; p.x = ax + x * co - z * sn; p.z = az + x * sn + z * co; }); KN.turned = +th.toFixed(2); } }
    if (fresh && !keep && KN.placed) { let cx = 0, cz = 0, sxx = 0, szz = 0, sxz = 0; G.A.forEach(a => { const p = at.get(a); cx += p.x / n; cz += p.z / n; }); G.A.forEach(a => { const p = at.get(a), x = p.x - cx, z = p.z - cz; sxx += x * x; szz += z * z; sxz += x * z; }); let th = 0.5 * Math.atan2(2 * sxz, sxx - szz); if (KN.rootAng != null) th = KN.rootAng - Math.round((KN.rootAng - th) / (Math.PI / 2)) * (Math.PI / 2); const co = Math.cos(-th), sn = Math.sin(-th); if (Math.abs(th) > 0.05) at.forEach(p => { const x = p.x - cx, z = p.z - cz; p.x = cx + x * co - z * sn; p.z = cz + x * sn + z * co; }); }
    return KN;
  }
  // the screen box (1280 by 720, y down) of every shown ball of a molecule, its radius included
  function molScr(m) {
    if (!m) return null; m.group.updateMatrixWorld(); cam.updateMatrixWorld(); const sc = m.group.scale.x, rt = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), w = new T.Vector3(), e = new T.Vector3(); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, n = 0;
    m.balls.forEach(b => { if (!b.mesh.visible || b.mesh.scale.x < 0.01) return; b.mesh.getWorldPosition(w); e.copy(w).addScaledVector(rt, b.mesh.scale.x * sc); w.project(cam); e.project(cam); const x = (w.x + 1) * 640, y = (1 - w.y) * 360, r = Math.hypot((e.x - w.x) * 640, (e.y - w.y) * 360); x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, y - r); y1 = Math.max(y1, y + r); n++; });
    return n ? [Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1)] : null;
  }
  // how many pairs of drawn bonds cross on the screen (bonds that share an atom do not count)
  function crossOf(m) {
    m.group.updateMatrixWorld(); cam.updateMatrixWorld(); const S = [], v = new T.Vector3();
    m.sticks.forEach(q => { if (q.vis === false || q.rung || q.a.el === 'H' || q.b.el === 'H') return; const ba = m.balls.get(q.a), bb = m.balls.get(q.b); if (!ba || !bb) return; const p = ba.mesh.getWorldPosition(v).project(cam), ax = p.x * 640, ay = p.y * 360; const r = bb.mesh.getWorldPosition(v).project(cam); S.push([q.a, q.b, ax, ay, r.x * 640, r.y * 360]); });
    const d = (ax, ay, bx, by, px, py) => (bx - ax) * (py - ay) - (by - ay) * (px - ax); let n = 0;
    for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) { const a = S[i], b = S[j]; if (a[0] === b[0] || a[0] === b[1] || a[1] === b[0] || a[1] === b[1]) continue; if (d(a[2], a[3], a[4], a[5], b[2], b[3]) * d(a[2], a[3], a[4], a[5], b[4], b[5]) < 0 && d(b[2], b[3], b[4], b[5], a[2], a[3]) * d(b[2], b[3], b[4], b[5], a[4], a[5]) < 0) n++; }
    return { cross: n, bonds: S.length, knot: m.kn ? m.kn.names : null };
  }
  function buildMol(model, rings, lean0, seed, seedBead) {
    const lean = lean0 || MOLV !== 'full', grp = new T.Group(), c = new T.Vector3(), at = new Map(), skip = new Set(), balls = new Map(), sticks = [], pale = new Set(); let low = 1e9, n = 0;
    const big = model.atoms.filter(a => a.el !== 'H' && !a.tail).length >= BIG, beads = (FOLD === 'bead' || FOLD === 'both') && big ? foldsOf(model) : [], flat = ((FOLD === 'flat' || FOLD === 'both') && big) || MOLV === 'flatlean' || MOLV === 'pads';
    if (lean || flat) model.atoms.forEach(a => { if (a.el === 'H' && model.neighbors(a).every(q => q.atom.el === 'C')) skip.add(a); });
    model.atoms.forEach(a => { if (a.tail) skip.add(a); });
    beads.forEach(b => b.atoms.forEach(a => { skip.add(a); model.neighbors(a).forEach(q => { if (q.atom.el === 'H') skip.add(q.atom); }); }));
    model.atoms.forEach(a => { if (skip.has(a)) return; c.add(new T.Vector3(a.x, a.y, a.z)); n++; }); c.divideScalar(n || 1);
    model.atoms.forEach(a => { at.set(a, new T.Vector3(a.x, a.y, a.z).sub(c).applyQuaternion(align)); });
    // a bead stands where the first atom of its arm stood
    beads.forEach(b => { b.pa = { el: 'R', bead: b.txt, root: b.root }; at.set(b.pa, ((seedBead && seedBead.get(b.root)) || at.get(b.root)).clone()); });
    { const arch = flat ? archesOf(model) : []; if (flat && !caged(model, arch)) tidy(model, at, skip, beads, seed, arch); }
    let fl = null; if (flat && !beads.length && !NOFOLD) { try { fl = foldLay(model, at, skip); } catch (e) { fl = null; } }
    if (fl && EASE && seed && seed.size) { try { fl.eased = easeLay(model, at, skip, seed); } catch (e) { fl.eased = false; EASEWHY = 'err ' + e.message; } fl.why = EASEWHY; if (fl.eased) { fl.ring = true; fl.rungSet = new Set(); } }
    let KN = null; if (KNOT.mode !== 'a' && !beads.length && !buildMol.noKnot) { try { KN = knotLay(model, at, skip, KNOT.mode, !(seed && seed.size), seed && seed.size ? seed : buildMol.orient); } catch (e) { KN = null; KNOT.err = String(e && e.stack); } if (KN && KN.placed && fl && fl.depth) KN.set.forEach(q => fl.depth.delete(q)); }
    if (FOLD === 'focus' && big) { const ar = RX.aromaticAtoms(model), dist = new Map(), q0 = []; liveAtoms(model, ar).forEach(a => { dist.set(a, 0); q0.push(a); }); while (q0.length) { const a = q0.shift(); model.neighbors(a).forEach(nb => { if (!dist.has(nb.atom)) { dist.set(nb.atom, dist.get(a) + 1); q0.push(nb.atom); } }); } model.atoms.forEach(a => { if ((dist.has(a) ? dist.get(a) : 9) > 2) pale.add(a); }); }
    const dOf = a => (KN && KN.depth.has(a) ? KN.depth.get(a) : fl && fl.depth && fl.depth.has(a) ? fl.depth.get(a) : null), radius = a => (a.bead ? 0.82 : a.poly ? 0.7 + 0.12 * Math.min(6, Math.log2(a.poly)) : (KN && KN.mode === 'c' && KN.placed && KN.set.has(a) ? KNOT.small : 1) * BALL(a.el) * (pale.has(a) ? 0.5 : 1) * (a.el === 'N' || a.el === 'S' || a.el === 'Cl' ? 1.3 : 1) * (dOf(a) == null ? 1 : 0.78 + 0.3 * dOf(a)));
    if (fl && fl.depth && fl.depth.size) fl.depth.forEach((d, a) => { const q = at.get(a); if (q) q.y += 1.1 * d; });
    if (KN) KN.depth.forEach((d, a) => { const q = at.get(a); if (q) q.y += 0.2 * d; });
    at.forEach((p, a) => { if (!skip.has(a)) low = Math.min(low, p.y - radius(a)); });
    at.forEach(p => { p.y += 0.5 - low; });
    model.atoms.forEach(a => {
      if (skip.has(a)) return;
      if (a.poly) { const e = { R: radius(a), sk: 1.6, mesh: add(SPH, polyMat, 0, 0, 0, grp), sprite: new T.Sprite(wordMat('n' + a.poly)), collar: null }; e.mesh.add(new T.Mesh(SPH, beadEdge)).scale.setScalar(1.09); grp.add(e.sprite); balls.set(a, e); return; }
      const R = radius(a), b = { R, mesh: add(SPH, pale.has(a) ? paleMat : a.slime ? slimeMat : a.cure && a.el === 'O' ? cureMat : ballMat(a.el), 0, 0, 0, grp), sprite: null, collar: null };
      if (a.el === 'H' && !pale.has(a)) { const ed = new T.Mesh(SPH, hEdge); ed.scale.setScalar(1 + HOUT); ed.castShadow = false; b.mesh.add(ed); } // a shown hydrogen has a thin dark outline, so the white ball reads on the pale paper
      if (a.clamp) b.collar = collar(grp, new T.Vector3(), R, 0x39435c);
      if (!pale.has(a) && (!(lean || flat) || (a.el !== 'C' && a.el !== 'H'))) { b.sprite = new T.Sprite(letterMat(a.el)); grp.add(b.sprite); b.sk = a.el === 'N' || a.el === 'S' || a.el === 'Cl' ? 2.0 : 1.6; }
      balls.set(a, b);
    });
    beads.forEach(b => { const e = { R: 0.82, sk: 1.75, mesh: add(SPH, beadMat, 0, 0, 0, grp), sprite: new T.Sprite(wordMat(b.txt)), collar: null }; e.mesh.add(new T.Mesh(SPH, beadEdge)).scale.setScalar(1.09); grp.add(e.sprite); balls.set(b.pa, e); sticks.push({ a: b.anchor, b: b.pa, r: 0.09, parts: [0, 1].map(h => ({ f: 0, h, mesh: add(CYL, h ? beadMat : stickMat(b.anchor.el), 0, 0, 0, grp) })) }); });
    model.bonds.forEach(bd => {
      if (!balls.has(bd.a) || !balls.has(bd.b)) return;
      const far = pale.has(bd.a) && pale.has(bd.b), isH = bd.a.el === 'H' || bd.b.el === 'H', parts = []; (bd.order === 1 ? [0] : bd.order >= 3 ? [-1, 0, 1] : [-0.5, 0.5]).forEach(f => [0, 1].forEach(h => parts.push({ f, h, mesh: add(CYL, far ? paleMat : isH ? ballMat('H') : stickMat((h ? bd.b : bd.a).el), 0, 0, 0, grp) })));
      // a hydrogen and its stick are one shape: the stick is white like the ball and wears the same dark outline, the same weight all round
      if (isH && !far) parts.forEach(pt => { const ed = new T.Mesh(CYL, hEdge), fq = 1 + HOUT * BALL('H') / 0.125; ed.scale.set(fq, 1, fq); ed.castShadow = false; pt.mesh.add(ed); });
      { const da = dOf(bd.a), db = dOf(bd.b), dm = da == null || db == null ? null : (da + db) / 2; if (dm != null && dm < 0.34) parts.forEach(pt => { pt.mesh.material = KN && KN.depth.has(bd.a) ? backMat : paleMat; }); sticks.push({ a: bd.a, b: bd.b, r: (isH ? 0.125 : bd.order > 1 ? 0.06 : 0.09) * (far ? 0.6 : 1) * (dm == null ? 1 : 0.62 + 0.55 * dm), parts }); }
    });
    scene.add(grp);
    const m = { group: grp, at, model, balls, sticks, beads, flat, hover: [], marks: [], hot: [], kn: KN };
    if (KN) sticks.forEach(q => { if (KN.set.has(q.a) && KN.set.has(q.b)) q.kfree = true; });
    if (fl) { m.fl = fl; sticks.forEach(q => { if (fl.rungSet.has(fl.rk(q.a, q.b))) q.rung = true; }); m.box = drawnBox(m); }
    try { m.fitNote = fitAt(m); } catch (e) { m.fitNote = 'err ' + e.message; } if (m.fitNote && fl) m.box = drawnBox(m);
    // (builder 16) a set-down drawing that leaves two balls overlapping or a bond out of its limits is given up: that molecule is drawn the old way
    // (builder 17) and so is one that still shows two balls nearer than touching once it is drawn (hydrogens and the drawing's own atoms included)
    if (KN && KN.placed && m.fitNote !== 'fail' && !buildMol.noKnot) { try { layout(m, a => at.get(a), null); if (placedOv(m) < 1.03) m.fitNote = 'fail'; } catch (e) {} }
    if (KN && KN.placed && m.fitNote === 'fail' && !buildMol.noKnot) { freeMol(m); buildMol.noKnot = true; try { const m3 = buildMol(model, rings, lean0, seed, seedBead); m3.knotOff = true; return m3; } finally { buildMol.noKnot = false; } }
    // a layout eased from the one before that could not be put right is given up for a fresh one
    if (m.fitNote === 'fail' && seed && seed.size && !buildMol.again) { freeMol(m); buildMol.again = true; buildMol.orient = seed; try { const m2 = buildMol(model, rings, lean0, null, seedBead); m2.fitNote = 'fresh:' + m2.fitNote; return m2; } finally { buildMol.again = false; buildMol.orient = null; } }
    layout(m, a => at.get(a), null);
    // (builder 18) the last word: a picture that still shows two balls nearer than touching as it will stand on the page is built once more, fresh,
    // the old way (no stored drawing, no lie of the one before), which the whole-game job finds clean every time
    if (DCL.on && !buildMol.last && !beads.length) { let ov = 9; try { ov = placedOv(m); } catch (e) { /* keep */ } if (ov < 1) { buildMol.last = true; const nk = buildMol.noKnot, ag = buildMol.again, or = buildMol.orient; buildMol.noKnot = true; buildMol.again = true; buildMol.orient = null; let m4 = null; try { m4 = buildMol(model, rings, lean0, null, seedBead); if (placedOv(m4) > ov) { freeMol(m); m4.knotOff = true; m4.fitNote = 'last:' + (m4.fitNote || ''); return m4; } freeMol(m4); } catch (e) { /* keep m */ } finally { buildMol.last = false; buildMol.noKnot = nk; buildMol.again = ag; buildMol.orient = or; } } }
    if (rings) m.marks = marksOf(m, Array.from(rings.keys()));
    return m;
  }
  // the closest pair of balls of a built molecule, measured as it will stand in the molecule's home on the page (the measure clashOf, placed)
  function placedOv(m) { const H = HOME, bx = m.box || drawnBox(m), gp = m.group, px = gp.position.x, pz = gp.position.z, s0 = gp.scale.x, sc = Math.min(H.smax, (H.w - 2) / bx.w, (H.d - 2) / bx.d); gp.scale.setScalar(sc); gp.position.x = H.x - bx.cx * sc; gp.position.z = H.z - bx.cz * sc; try { return clashOf(m).ov; } finally { gp.scale.setScalar(s0); gp.position.x = px; gp.position.z = pz; } }
  // Puts every ball and stick of a molecule where pos says its atoms are. grow(atom) runs 0 to 1 for an atom that is
  // appearing, and a stick appears with the later of its two ends.
  const _ride = new T.Vector3(), _u = new T.Vector3(), _q = new T.Quaternion(), _perp = new T.Vector3(), _mid = new T.Vector3(), _gb = new T.Vector3();
  // Shown hydrogens are set here, on every frame, whatever moved the atoms: each stands on a circle round its own atom (its ball clear of that
  // atom's ball by the gap, measured as the camera sees it), in the direction it was given unless something is in the way; then it is turned
  // round its atom, by the least turn, to a direction where it touches nothing. The turn is remembered so it does not flick back and forth.
  const _hc = new T.Vector3();
  function hydFix(m, pos) {
    let L = m._hl; if (!L) { L = m._hl = []; m.balls.forEach((b, a) => { if (a.el !== 'H') return; const pa = m.model.neighbors(a).map(q => q.atom).find(q => q.el !== 'H' && m.balls.has(q)); if (pa) L.push({ h: a, pa, b, pb: m.balls.get(pa), off: 0, v: new T.Vector3() }); }); m._hm = new Map(); L.forEach(e => m._hm.set(e.h, e.v)); m._hv = []; m.balls.forEach((b, a) => { if (a.el !== 'H') m._hv.push([a, b]); }); }
    if (!L.length) return null;
    const cx = camDir.x, cy = camDir.y, cz = camDir.z, hv = m._hv, HP = hv.map(e => pos(e[0]));
    const pd = (dx, dy, dz) => { const t = dx * cx + dy * cy + dz * cz; return Math.sqrt(Math.max(0, dx * dx + dy * dy + dz * dz - t * t)); };
    const done = [];
    L.forEach(e => { const P = pos(e.pa), H0 = pos(e.h), Rp = e.pb.R, Rh = e.b.R; if (!P || !H0) return; let dx = H0.x - P.x, dz = H0.z - P.z, d = Math.hypot(dx, dz); if (d < 1e-4) { dx = 0; dz = -1; d = 1; } const a0 = Math.atan2(dz, dx), need0 = Rp + Rh, gap0 = hydGap(Rp), GK = [1, 0.62, 1.5]; let need = need0 + gap0 * GK[e.gi || 0];
      const at = an => { const ux = Math.cos(an), uz = Math.sin(an), pf = Math.sqrt(Math.max(0.3, 1 - (ux * cx + uz * cz) * (ux * cx + uz * cz))), l = need / pf; return _hc.set(P.x + ux * l, P.y, P.z + uz * l); };
      const clear = an => { const c = at(an); let w = 9; for (let j = 0; j < hv.length; j++) { if (hv[j][0] === e.pa) continue; const q = HP[j]; if (!q) continue; const r = pd(c.x - q.x, c.y - q.y, c.z - q.z) / (hv[j][1].R + Rh); if (r < w) w = r; } for (let j = 0; j < done.length; j++) { const q = done[j].v, r = pd(c.x - q.x, c.y - q.y, c.z - q.z) / (done[j].b.R + Rh); if (r < w) w = r; } return w; };
      // (where no side is free at the full distance, it is tried nearer in and then further out before the least bad place is taken)
      let best = e.off, bw = clear(a0 + e.off);
      if (bw < 1.22 || ((e.off || e.gi) && (need = need0 + gap0, clear(a0) >= 1.3))) { best = null; let fb = 0, fg = 0, fw = -1; for (let gi = 0; gi < 3 && best == null; gi++) { need = need0 + gap0 * GK[gi]; for (let k = 0; k <= 12 && best == null; k++) for (const sg of (k ? [1, -1] : [1])) { const o = sg * k * 0.2618, w = clear(a0 + o); if (w >= 1.3) { best = o; e.gi = gi; break; } if (w > fw) { fw = w; fb = o; fg = gi; } } } if (best == null) { best = fb; e.gi = fg; } need = need0 + gap0 * GK[e.gi]; }
      e.off = best; e.v.copy(at(a0 + best)); done.push(e); });
    return m._hm;
  }
  // (builder 15) NO TWO SHOWN ATOMS OVERLAP: the rule is kept here, in the one place every layout passes through, not checked on a take.
  // declash() works on the picture as the camera sees it: each pair of shown balls (hydrogens too) is looked at along the camera's own ray to
  // that pair; any two whose centres are nearer than DCL.k times the sum of their radii are moved apart on the page. The light thing moves first
  // (a hydrogen swings round its atom, then an end atom, then a chain atom, last a ring atom), and no drawn bond is left shorter than DCL.lo
  // or longer than DCL.hi of its normal length. fitAt() runs the same pass, longer and with more room, on the targets of a fresh layout;
  // where it cannot be reached the layout is opened out (roomier) and tried again. clashOf() is the measure, from the balls as drawn.
  const DCL = { on: (() => { try { return new URLSearchParams(root.location.search).get('declash') !== '0'; } catch (e) { return true; } })(), k: 1.05, kfit: 1.12, lo: 0.85, hi: 1.3, rlo: 0.9, rhi: 1.15, stat: { calls: 0, fixed: 0, left: 0, fit: 0, roomy: 0, fail: 0 } };
  const _dcc = new T.Vector3();
  function dcOf(m) {
    let D = m._dc; if (D) return D;
    const A = [], R = [], ix = new Map(); m.balls.forEach((b, a) => { ix.set(a, A.length); A.push(a); R.push(b.R); });
    const hd = A.map(() => 0); m.sticks.forEach(q => { const i = ix.get(q.a), j = ix.get(q.b); if (i == null || j == null || q.rung) return; if (A[i].el !== 'H' && A[j].el !== 'H') { hd[i]++; hd[j]++; } });
    const W = A.map((a, i) => (a.el === 'H' ? 4 : m.kn && m.kn.placed && m.kn.set.has(a) ? 0.05 : hd[i] <= 1 ? 0.6 : hd[i] === 2 ? 0.3 : 0.15));
    const B = []; m.sticks.forEach(q => { const i = ix.get(q.a), j = ix.get(q.b); if (i == null || j == null || q.rung) return; const h = A[i].el === 'H' || A[j].el === 'H'; let rest = FL.L; if (h) rest = R[i] + R[j] + hydGap(A[i].el === 'H' ? R[j] : R[i]); else if (!m.fl) { const p = m.at.get(A[i]), r = m.at.get(A[j]); if (p && r) rest = Math.max(1.0, Math.min(FL.L, p.distanceTo(r))); } B.push({ i, j, q, rest, h }); });
    D = m._dc = { A, R, W, B, ix, kn: (() => { const so = new Map(); if (m.kn && m.kn.placed) m.kn.sys.forEach((l, k) => l.forEach(q => so.set(q, k + 1))); return A.map(a => so.get(a) || 0); })(), P: A.map(() => new T.Vector3()), on: A.map(() => false), r: A.map(() => 0), map: new Map() };
    return D;
  }
  // one pass over positions D.P (local to the molecule's group). k: the margin. iters: how long to try. Returns the worst pair left, as a share of touching.
  function dcRun(m, D, k, iters, mid, strict) {
    const n = D.A.length, P = D.P, r = D.r, on = D.on, W = D.W; m.group.updateMatrixWorld(); _dcc.copy(cam.position); m.group.worldToLocal(_dcc);
    const cx = _dcc.x, cy = _dcc.y, cz = _dcc.z; let worst = 9, any = false;
    for (let it = 0; it < iters; it++) { let moved = false; worst = 9;
      for (let i = 0; i < n; i++) { if (!on[i]) continue; const p = P[i];
        for (let j = i + 1; j < n; j++) { if (!on[j] || (D.kn[i] && D.kn[i] === D.kn[j])) continue; const q = P[j], need = k * (r[i] + r[j]); let dx = q.x - p.x, dy = q.y - p.y, dz = q.z - p.z; if (dx > need * 1.6 || dx < -need * 1.6 || dz > need * 2.4 + 2 || dz < -need * 2.4 - 2) continue;
          // the ray from the camera to the middle of the pair; what is left of the pair's separation across that ray is what is seen
          let vx = (p.x + q.x) / 2 - cx, vy = (p.y + q.y) / 2 - cy, vz = (p.z + q.z) / 2 - cz; const vl = Math.hypot(vx, vy, vz) || 1; vx /= vl; vy /= vl; vz /= vl;
          const t = dx * vx + dy * vy + dz * vz; let sx = dx - t * vx, sy = dy - t * vy, sz = dz - t * vz, d = Math.hypot(sx, sy, sz);
          const rt = d / (r[i] + r[j]); if (rt < worst) worst = rt; if (d >= need) continue;
          if (d < 1e-3) { const an = (i * 2.399 + j * 0.7); sx = Math.cos(an); sz = Math.sin(an); sy = 0; const t2 = sx * vx + sz * vz; sx -= t2 * vx; sy -= t2 * vy; sz -= t2 * vz; d = Math.hypot(sx, sy, sz) || 1; sx /= d; sy /= d; sz /= d; d = 0; } else { sx /= d; sy /= d; sz /= d; }
          // moved on the page (x and z), by as much as shows as the wanted move on the screen
          const hx = sx, hz = sz, t3 = hx * vx + hz * vz, g = (hx - t3 * vx) * sx + (0 - t3 * vy) * sy + (hz - t3 * vz) * sz; if (g < 0.3) continue; const amt = (need - d) * 1.02 / g;
          let wi = W[i], wj = W[j]; const hi = D.A[i].el === 'H', hj = D.A[j].el === 'H'; if (hi && !hj) { wi = 1; wj = it > iters * 0.35 ? 0.3 : 0; } else if (hj && !hi) { wj = 1; wi = it > iters * 0.35 ? 0.3 : 0; }
          const ws = wi + wj || 1; p.x -= hx * amt * wi / ws; p.z -= hz * amt * wi / ws; q.x += hx * amt * wj / ws; q.z += hz * amt * wj / ws; moved = true; any = true; } }
      // the drawn bonds: none shorter than lo, none longer than hi of its normal length (a hydrogen keeps its own distance from its atom)
      for (let b = 0; b < D.B.length; b++) { const e = D.B[b], q = e.q; if (!on[e.i] || !on[e.j]) continue; if (!strict && (q.vis === false || (q.gk != null && q.gk < 1) || (mid && q.old === false))) continue; if (q.kfree && m.kn.placed) continue;
        const p = P[e.i], s = P[e.j], dx = s.x - p.x, dy = s.y - p.y, dz = s.z - p.z, d = Math.hypot(dx, dy, dz); if (d < 1e-4) continue; const lo = e.rest * (e.h ? 0.92 : m.fl ? (strict ? DCL.rlo + 0.015 : DCL.lo + 0.02) : 0.5), hi = e.rest * (e.h ? 1.25 : strict ? DCL.rhi - 0.02 : DCL.hi - 0.03); let f = 0; if (d > hi) f = (d - hi) / d; else if (d < lo) f = (d - lo) / d; else continue;
        let wi = W[e.i], wj = W[e.j]; if (e.h) { if (D.A[e.i].el === 'H') { wi = 1; wj = 0; } else { wi = 0; wj = 1; } } const ws = wi + wj || 1;
        p.x += dx * f * wi / ws; p.z += dz * f * wi / ws; s.x -= dx * f * wj / ws; s.z -= dz * f * wj / ws; if (d > hi) { p.y += dy * f * wi / ws; s.y -= dy * f * wj / ws; } moved = true; any = true; }
      // (targets only) no atom is left lying on a bond that is not its own: it is moved off sideways, the bond the other way
      if (strict && it < iters * 0.6) for (let i = 0; i < n; i++) { if (!on[i]) continue; const p = P[i], need = r[i] + 0.2; for (let b = 0; b < D.B.length; b++) { const e = D.B[b]; if (e.h || e.i === i || e.j === i || !on[e.i] || !on[e.j] || (D.kn[i] && e.q.kfree)) continue; const a = P[e.i], c = P[e.j], ex = c.x - a.x, ez = (c.z - a.z), l2 = ex * ex + ez * ez; if (l2 < 1e-6) continue; const t = ((p.x - a.x) * ex + (p.z - a.z) * ez) / l2; if (t < 0.12 || t > 0.88) continue; let qx = p.x - (a.x + ex * t), qz = p.z - (a.z + ez * t), d = Math.hypot(qx, qz * 0.87); if (d >= need) continue; if (d < 1e-3) { const l = Math.sqrt(l2); qx = -ez / l; qz = ex / l; d = 0; } else { const l = Math.hypot(qx, qz); qx /= l; qz /= l; }
          const amt = (need - d) * 0.5, wi = W[i], wb = (W[e.i] + W[e.j]) / 2, ws = wi + wb; p.x += qx * amt * wi / ws; p.z += qz * amt * wi / ws; a.x -= qx * amt * wb / ws; a.z -= qz * amt * wb / ws; c.x -= qx * amt * wb / ws; c.z -= qz * amt * wb / ws; D.seg = (D.seg || 0) + 1; moved = true; any = true; } }
      if (!moved) break; }
    D.any = any; return worst;
  }
  // a fresh layout's targets are put right before anything is drawn from them: the heavy atoms only (shown hydrogens are placed every frame).
  // Returns '' when nothing was wrong, 'fit' when the clean-up reached it, 'roomy' when the layout had to be opened out first, 'fail' when not reached.
  function fitAt(m) {
    if (!DCL.on) return ''; const D = dcOf(m), n = D.A.length; if (n < 2) return '';
    const load = () => { for (let i = 0; i < n; i++) { const a = D.A[i], p = m.at.get(a); D.on[i] = !!p && a.el !== 'H'; if (p) D.P[i].copy(p); D.r[i] = D.R[i]; } }, save = () => { for (let i = 0; i < n; i++) if (D.on[i]) m.at.get(D.A[i]).copy(D.P[i]); };
    const bondsOk = () => D.B.every(e => { if (e.h || !D.on[e.i] || !D.on[e.j]) return true; const d = D.P[e.i].distanceTo(D.P[e.j]) / e.rest; return d <= DCL.rhi + 0.004 && (!m.fl || d >= DCL.rlo - 0.004); });
    load(); let w = dcRun(m, D, DCL.kfit, 80, false, true); if (!D.any) return ''; if (w >= 1.04 && bondsOk()) { save(); DCL.stat.fit++; return 'fit'; }
    for (let k = 0; k < 5; k++) { load(); let cx = 0, cz = 0, c = 0; for (let i = 0; i < n; i++) if (D.on[i]) { cx += D.P[i].x; cz += D.P[i].z; c++; } cx /= c || 1; cz /= c || 1; const s = 1.1 + 0.06 * k; let y0 = 0; for (let i = 0; i < n; i++) if (D.on[i]) y0 += D.P[i].y / c; for (let i = 0; i < n; i++) if (D.on[i]) { D.P[i].x = cx + (D.P[i].x - cx) * s + (k >= 3 ? 0.35 * Math.sin(i * 12.9898 + k) : 0); D.P[i].z = cz + (D.P[i].z - cz) * s + (k >= 3 ? 0.35 * Math.cos(i * 78.233 + k) : 0); if (k >= 2) D.P[i].y = y0; }
      w = dcRun(m, D, DCL.kfit, k >= 3 ? 500 : 160, false, true); if (w >= 1.04 && bondsOk()) { save(); DCL.stat.roomy++; return 'roomy'; } }
    save(); DCL.stat.fail++; return 'fail';
  }
  // every frame: the positions about to be drawn, put right. Returns null when nothing had to move.
  function declash(m, pos, grow) {
    if (!DCL.on || m.noClash) return null; const D = dcOf(m), n = D.A.length; if (n < 2) return null;
    for (let i = 0; i < n; i++) { const a = D.A[i], p = pos(a); if (!p) { D.on[i] = false; continue; } D.P[i].copy(p); const g = grow ? grow(a) : 1; D.r[i] = D.R[i] * Math.max(0, Math.min(1, g)); D.on[i] = g > 0.05; }
    const mid = !!morph && morph.m === m; DCL.stat.calls++;
    let w = dcRun(m, D, DCL.k, 18, mid, false); if (!D.any) return null; DCL.stat.fixed++; if (w < 1.02) { w = dcRun(m, D, DCL.k + 0.03, 120, mid, false); D.any = true; } if (w < 1 && !mid) w = dcRun(m, D, DCL.k + 0.07, 400, mid, false); /* (builder 17) a picture at rest still under touching is nudged harder */ if (w < 1 && !mid) w = dcRun(m, D, DCL.k + 0.16, 1500, mid, false); /* (builder 18) and once more, harder still */ if (w < 1) DCL.stat.left++;
    D.map.clear(); for (let i = 0; i < n; i++) if (D.on[i]) D.map.set(D.A[i], D.P[i]); return D.map;
  }
  // the measure, from the balls as they are drawn: the closest pair as a share of touching (1 = just touching), and the longest and shortest drawn heavy bond as a share of normal
  function clashOf(m, list) {
    m.group.updateMatrixWorld(); cam.updateMatrixWorld(); const A = [], S = []; const sc = m.group.scale.x, _r = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    m.balls.forEach((b, a) => { if (!b.mesh.visible || b.mesh.scale.x < 0.01) return; const w = b.mesh.getWorldPosition(new T.Vector3()), e = w.clone().addScaledVector(_r, b.mesh.scale.x * sc); const p = w.clone().project(cam), q = e.project(cam); A.push(a); S.push({ x: p.x * 640, y: p.y * 360, r: Math.hypot((q.x - p.x) * 640, (q.y - p.y) * 360) }); });
    let ov = 9, op = null, under = 0; const bad = [];
    for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) { const d = Math.hypot(S[i].x - S[j].x, S[i].y - S[j].y) / (S[i].r + S[j].r); if (d < 1) { under++; if (list) bad.push([A[i].el, A[j].el, +d.toFixed(2)]); } if (d < ov) { ov = d; op = [A[i].el, A[j].el]; } }
    let bl = 0, bs = 9; m.sticks.forEach(q => { if (q.rung || q.vis === false || q.a.el === 'H' || q.b.el === 'H' || q.a.bead || q.b.bead) return; const ba = m.balls.get(q.a), bb = m.balls.get(q.b); if (!ba || !bb) return; const d = ba.mesh.position.distanceTo(bb.mesh.position) / FL.L; if (d > bl) bl = d; if (d < bs) bs = d; });
    const out = { ov: +ov.toFixed(3), op, under, bl: +bl.toFixed(3), bs: +bs.toFixed(3), n: A.length }; if (list) out.bad = bad; return out;
  }
  // the whole-game job's hooks: lay a molecule out as the game does (fresh, or eased from the one before through a step's atom map) and measure it
  const LAYJ = { prev: null };
  function layJob(model, o, fresh) {
    const prev = LAYJ.prev; let seed = null, seedBead = null;
    if (prev && !fresh) { seed = new Map(); seedBead = new Map(); if (o && o.map) { o.map.forEach((na, oa) => { const p = prev.at.get(oa); if (p && prev.balls.has(oa)) seed.set(na, p); }); prev.beads.forEach(q => { const nr = o.map.get(q.root); if (nr) seedBead.set(nr, prev.at.get(q.pa)); }); } else { const live = new Set(model.atoms); prev.balls.forEach((b, a) => { if (live.has(a)) seed.set(a, prev.at.get(a)); }); } if (prev.at.fold) seed.fold = { dir: prev.at.fold.dir }; }
    if (fresh || !prev) setAlign(model);
    const m = buildMol(model, null, false, seed && seed.size ? seed : null, seedBead); const H = HOME; { const bx = m.box || drawnBox(m); place(m, { x: H.x - bx.cx * 0, z: H.z }, Math.min(H.smax, (H.w - 2) / bx.w, (H.d - 2) / bx.d)); const sc = m.group.scale.x; m.group.position.x = H.x - bx.cx * sc; m.group.position.z = H.z - bx.cz * sc; } layout(m, a => m.at.get(a), null);
    const out = clashOf(m); out.fl = !!m.fl; out.eased = !!(m.fl && m.fl.eased); out.fit = m.fitNote || ''; if (prev) freeMol(prev); LAYJ.prev = m; m.group.visible = false; return out;
  }
  // (knot option d) the ring system spread about its own middle while nothing plays; what hangs off it rides with its ring atom
  const _ko = new T.Vector3();
  function knotOpen(m, pos) {
    const K = m.kn; if ((morph && morph.m === m) || (st && st.firing)) { K.on = false; return pos; }
    if (!K.tmp) { K.tmp = new Map(); m.balls.forEach((b, a) => K.tmp.set(a, new T.Vector3())); K.c = K.sys.map(() => new T.Vector3()); }
    K.sys.forEach((s, k) => { const c = K.c[k].set(0, 0, 0); let n = 0; s.forEach(a => { const p = pos(a); if (p) { c.add(p); n++; } }); c.divideScalar(n || 1); });
    K.on = true; return a => { const p = pos(a), o = K.own.get(a), v = K.tmp.get(a); if (!p || !o || !v) return p; const q = pos(o); if (!q) return p; _ko.copy(q).sub(K.c[K.sysOf.get(o)]); _ko.y = 0; return v.copy(p).addScaledVector(_ko, KNOT.open - 1); };
  }
  function layout(m, pos0, grow) {
    const hf = HYD !== '0' ? hydFix(m, pos0) : null, pos1 = hf ? (a => hf.get(a) || pos0(a)) : pos0, dc = declash(m, pos1, grow), posD = dc ? (a => dc.get(a) || pos1(a)) : pos1, pos = m.kn && m.kn.mode === 'd' ? knotOpen(m, posD) : posD;
    m.balls.forEach((b, a) => { const p = pos(a), k = grow ? grow(a) : 1; b.mesh.position.copy(p); b.mesh.scale.setScalar(Math.max(0.0001, b.R * k)); if (b.sprite) { b.sprite.position.copy(p).addScaledVector(camDir, -b.R * 1.04); b.sprite.scale.setScalar(Math.max(0.0001, b.R * (b.sk || 1.25) * k)); } if (b.collar) { b.collar.position.copy(p); b.collar.scale.setScalar(Math.max(0.0001, k)); } });
    m.sticks.forEach(s => {
      const A = pos(s.a), B0 = pos(s.b), k0 = grow ? Math.min(grow(s.a), grow(s.b)) : 1, B = s.gk != null && s.gk < 1 ? _gb.copy(A).lerp(B0, Math.max(0.02, s.gk)) : B0; _u.copy(B).sub(A); const len = _u.length(); if (len < 1e-4) return; _u.divideScalar(len);
      // a bond between atoms that are still far apart is not drawn until they have come near: it grows in as a fold closes
      if (!s.rest) { const fa = m.at.get(s.a), fb = m.at.get(s.b); s.rest = fa && fb ? Math.max(0.3, fa.distanceTo(fb)) : len; }
      const k = s.rung || s.gk != null || s.old || s.a.el === 'H' || s.b.el === 'H' || (m.kn && m.kn.on) ? k0 : k0 * Math.max(0, Math.min(1, 1 - (len / s.rest - 1.05) / 0.1));
      _q.setFromUnitVectors(UP, _u); _perp.crossVectors(_u, camDir).normalize(); _mid.copy(A).add(B).multiplyScalar(0.5);
      s.parts.forEach(pt => { const fr = pt.h ? _mid : A, to = pt.h ? B : _mid; const many = s.parts.length > 2, rr = s.r * k * (many ? 0.7 : 1) * (s.kfree && m.kn.on ? 0.42 : 1); pt.mesh.position.copy(fr).add(to).multiplyScalar(0.5).addScaledVector(_perp, pt.f * (s.parts.length > 4 ? 0.34 : 0.36)); pt.mesh.quaternion.copy(_q); pt.mesh.scale.set(Math.max(0.0001, rr), fr.distanceTo(to), Math.max(0.0001, rr)); pt.mesh.visible = k > 0.01; }); s.len = len; s.vis = k > 0.01;
    });
  }
  // The last guard before anything is drawn: whatever moved the atoms (a settle, a tremble, a snap, a pose), no bond that is drawn is left
  // longer than 1.22 of its own length and no two atoms are left nearer than their balls allow; the two atoms are moved together or apart.
  function layoutSafe(m, pos, grow) {
    if (!m.fl) return layout(m, pos, grow);
    let G = m._sg; if (!G) { const A = []; m.balls.forEach((b, a) => { if (a.el !== 'H' && m.at.get(a)) A.push(a); }); const ix = new Map(); A.forEach((a, i) => ix.set(a, i)); const bs = [], bset = new Set(); m.sticks.forEach(q => { const i = ix.get(q.a), j = ix.get(q.b); if (i == null || j == null) return; bset.add(i * 1000 + j); bset.add(j * 1000 + i); if (!q.rung) bs.push([i, j, m.at.get(q.a).distanceTo(m.at.get(q.b)), q]); });
      const rp = []; for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) { if (bset.has(i * 1000 + j)) continue; const ta = m.at.get(A[i]), tb = m.at.get(A[j]); rp.push([i, j, 1.06 * (radOf(A[i]) + radOf(A[j])) + 0.03]); }
      const hs = []; m.balls.forEach((b, a) => { if (a.el !== 'H') return; const pa = m.model.neighbors(a).map(q => q.atom).find(q => ix.has(q)); hs.push([a, pa ? ix.get(pa) : -1]); });
      G = m._sg = { A, bs, rp, hs, P: A.map(() => new T.Vector3()), P0: A.map(() => new T.Vector3()), H: hs.map(() => new T.Vector3()), map: new Map() }; A.forEach((a, i) => G.map.set(a, G.P[i])); hs.forEach((h, i) => G.map.set(h[0], G.H[i])); }
    G.A.forEach((a, i) => { G.P[i].copy(pos(a)); G.P0[i].copy(G.P[i]); }); G.hs.forEach((h, i) => G.H[i].copy(pos(h[0])));
    for (let it = 0; it < 5; it++) { let moved = false;
      const mid = !!morph && morph.m === m; G.bs.forEach(b => { const q = b[3]; if (q.vis === false || (q.gk != null && q.gk < 1) || (mid && q.old === false)) return; const p = G.P[b[0]], r = G.P[b[1]], dx = r.x - p.x, dy = r.y - p.y, dz = r.z - p.z, d = Math.hypot(dx, dy, dz), max = b[2] * 1.22, min = 1.03 * (radOf(G.A[b[0]]) + radOf(G.A[b[1]])); if (d < min && d > 1e-4) { const f0 = (d - min) / d * 0.5; p.x += dx * f0; p.z += dz * f0; r.x -= dx * f0; r.z -= dz * f0; moved = true; return; } if (d <= max) return; const f = (d - max) / d * 0.5; p.x += dx * f; p.y += dy * f; p.z += dz * f; r.x -= dx * f; r.y -= dy * f; r.z -= dz * f; moved = true; });
      G.rp.forEach(b => { const p = G.P[b[0]], r = G.P[b[1]]; let dx = r.x - p.x, dz = r.z - p.z; const d = Math.hypot(dx, dz); if (d >= b[2]) return; if (d < 1e-4) { dx = 1; dz = 0; } const f = (d - b[2]) / Math.max(d, 1e-4) * 0.5; p.x += dx * f; p.z += dz * f; r.x -= dx * f; r.z -= dz * f; moved = true; });
      if (!moved) break; }
    G.hs.forEach((h, i) => { if (h[1] >= 0) { G.H[i].x += G.P[h[1]].x - G.P0[h[1]].x; G.H[i].y += G.P[h[1]].y - G.P0[h[1]].y; G.H[i].z += G.P[h[1]].z - G.P0[h[1]].z; } });
    G.hs.forEach((h, i) => { const H = G.H[i], rh = radOf(h[0]); if (h[1] >= 0) { const p = G.P[h[1]], need = radOf(G.A[h[1]]) + rh + 0.1; let dx = H.x - p.x, dz = H.z - p.z, d = Math.hypot(dx, dz); if (d < 1e-4) { dx = 0; dz = -1; d = 1; } if (d < need) { H.x = p.x + dx / d * need; H.z = p.z + dz / d * need; } }
      G.P.forEach((p, j) => { if (j === h[1]) return; const need = radOf(G.A[j]) + rh + 0.04, dx = H.x - p.x, dz = H.z - p.z, d = Math.hypot(dx, dz); if (d < need && d > 1e-4) { H.x = p.x + dx / d * need; H.z = p.z + dz / d * need; } }); });
    for (let i = 0; i < G.H.length; i++) for (let j = i + 1; j < G.H.length; j++) { const A = G.H[i], B = G.H[j], need = 2 * radOf(G.hs[i][0]) + 0.05, dx = B.x - A.x, dz = B.z - A.z, d = Math.hypot(dx, dz); if (d < need && d > 1e-4) { const f = (need - d) / d * 0.5; A.x -= dx * f; A.z -= dz * f; B.x += dx * f; B.z += dz * f; } }
    return layout(m, a => G.map.get(a) || pos(a), grow);
  }
  // Where to circle a set of atoms on the page. Each atom is carried down to the page along the line of sight, so
  // the circle sits behind it on screen. Atoms close together share one circle. Lengths are in the molecule's own units.
  function marksOf(m, atoms, join, pad) {
    const pts = []; atoms.forEach(a => { const p = m.at.get(a); if (!p || a.el === 'H') return; const t = -p.y / camDir.y; pts.push({ x: p.x + camDir.x * t, z: p.z + camDir.z * t }); });
    const out = [];
    pts.forEach(p => { const o = out.find(q => q.pts.some(t => Math.hypot(t.x - p.x, t.z - p.z) < (join || 2.3))); if (o) o.pts.push(p); else out.push({ pts: [p] }); });
    out.forEach(o => { o.x = o.pts.reduce((t, q) => t + q.x, 0) / o.pts.length; o.z = o.pts.reduce((t, q) => t + q.z, 0) / o.pts.length; o.r = Math.max(...o.pts.map(q => Math.hypot(q.x - o.x, q.z - o.z))) + (pad || 0.7); });
    return out;
  }
  // The groups a reagent can act on, each with where it sits on the page under the molecule: C=C, C=O, OH and Cl.
  function groupsOf(m) {
    const out = [], md = m.model, ar = RX.aromaticAtoms(md), down = (a, b) => { const p = m.at.get(a), q = b ? m.at.get(b) : p; if (!p || !q) return null; const x = (p.x + q.x) / 2, y = (p.y + q.y) / 2, z = (p.z + q.z) / 2, t = -y / camDir.y; return { x: x + camDir.x * t, z: z + camDir.z * t }; };
    md.bonds.forEach(b => { if (b.order !== 2 || (ar.has(b.a) && ar.has(b.b))) return; const cc = b.a.el === 'C' && b.b.el === 'C', co = (b.a.el === 'C' && b.b.el === 'O') || (b.a.el === 'O' && b.b.el === 'C'); if (!cc && !co) return; const p = down(b.a, b.b); if (p) out.push({ txt: cc ? 'C=C' : 'C=O', x: p.x, z: p.z }); });
    md.atoms.forEach(a => { if (a.el === 'Cl') { const p = down(a); if (p) out.push({ txt: 'Cl', x: p.x, z: p.z }); } else if (a.el === 'O') { const nb = md.neighbors(a); if (nb.length === 2 && nb.every(q => q.bond.order === 1) && nb.some(q => q.atom.el === 'H') && nb.some(q => q.atom.el === 'C')) { const p = down(a); if (p) out.push({ txt: 'OH', x: p.x, z: p.z }); } } });
    return out;
  }
  // how wide a molecule is, left to right, counting what is drawn
  const spanOf = m => { let lo = 1e9, hi = -1e9; m.at.forEach((q, a) => { if (a.el === 'H') return; lo = Math.min(lo, q.x); hi = Math.max(hi, q.x); }); return Math.max(3, hi - lo + 1.2); };
  // the molecule in the middle is the largest thing on the page: as big as the room between the choices and the equipment allows
  const deepOf = m => { let lo = 1e9, hi = -1e9; m.balls.forEach((b, a) => { if (a.el === 'H') return; const q = m.at.get(a); lo = Math.min(lo, q.z - q.y * 0.5); hi = Math.max(hi, q.z); }); return Math.max(2, hi - lo + 1.2); };
  // the room the molecule has: with no piece standing on the page and no creature beside it, it takes the whole middle
  const LANE = { w: KITV === 'side' ? 17 : 16, d: KITV === 'bottom' ? 10.5 : 10 }, C0B = {};
  const PIN_MS = 1300, RES_MS = 3000; const laneSet = () => { if (C0B.x == null) { C0B.x = C0.x; C0B.z = C0.z; } const wide = SIDE && KITV === 'back' && !st.gear.length && !(run && run.hom) && (P.RULE.bare || !JARK.some(jarSeen)); C0.x = wide ? 0 : C0B.x; C0.z = wide ? -5.6 : C0B.z; LANE.w = wide ? 41 : KITV === 'side' ? 17 : 16; LANE.d = wide ? 11 : KITV === 'bottom' ? 10.5 : 10; if (BENCHV) { C0.x = HOME.x; C0.z = HOME.z; LANE.w = HOME.w - 1; LANE.d = HOME.d - 1; } st.lx = C0.x; };
  const HOME = { x: 0.6, z: -1.7, w: 25.5, d: 19.4, smax: 2.0 }, HOMED = { x: 0, z: 0.4, w: 36, d: 11.5, smax: 1.5 }, benchOn = () => !BENCHV && !!run && !P.RULE.bare && P.stageOf(meta) >= 2 && (st.gear.length > 0 || JARK.some(jarSeen)), PINH = { x: 21.4, z: -15.2, w: 14, d: 8.6, smax: 1.4 }, homeNow = () => (st.mode === 'done' ? (BENCHV ? (st.pinned ? PINH : HOME) : HOMED) : benchOn() ? { x: HOME.x, z: HOME.z + 2.7, w: HOME.w, d: HOME.d - 5.4, smax: HOME.smax } : HOME);
  homeE(HOME);
  const PADM = (() => { try { return new URLSearchParams(root.location.search).get('pad') === '0' ? 0 : 1.3; } catch (e) { return 1.3; } })();
  const flScale = m => { const H = homeNow(), b = m.box; return Math.min(H.smax, H.w / (b.w + 2 * PADM), H.d / (b.d + 2 * PADM)); };
  // the folded molecule keeps its start end where it is; the whole is slid, never jumped, so that its box stays in the middle of its home
  // the box that is centred is the box of what is drawn at this moment (not of where the atoms are going), and the scale does not grow while a line is playing
  const liveBox = m => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; m.balls.forEach(b => { const p = b.mesh.position, r = (b.R || 0.4) + 0.1; x0 = Math.min(x0, p.x - r); x1 = Math.max(x1, p.x + r); z0 = Math.min(z0, p.z - r - 0.3); z1 = Math.max(z1, p.z + r); }); return x0 > 1e8 ? m.box : { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 }; };
  // where on the page the middle of a box of depth d must lie for the box to sit centred at the share yc of the frame's height (the page is seen at a slant)
  const camRest = (() => { const c = new T.PerspectiveCamera(34, 16 / 9, 0.5, 200); c.position.copy(CAM); c.lookAt(LOOKAT); c.updateMatrixWorld(true); c.updateProjectionMatrix(); return c; })(), _sv = new T.Vector3();
  const scrY = z => { _sv.set(0, 0.45, z).project(camRest); return (1 - _sv.y) / 2; };
  const zFor = (d, yc) => { let lo = -12, hi = 10; for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (scrY(mid - d / 2) + scrY(mid + d / 2) < 2 * yc) lo = mid; else hi = mid; } return (lo + hi) / 2; };
  if (PGE.on) HOME.yc = (scrY(PGE.home.z0) + scrY(PGE.home.z1)) / 2 + 0.011;
  function flHome(m, snap, dt, now) { if (BENCHV && st.mode === 'done' && !snap && st.bcx != null) { if (st.pinned) { const b = m.box, fit = Math.min(PINH.smax, PINH.w / b.w, PINH.d / b.d); if (!st.pin0) st.pin0 = { hx: st.hx, hz: st.hz, sc: st.sc }; const u = Math.max(0, Math.min(1, ((now || performance.now()) - st.pinT) / PIN_MS)), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; st.hx = st.pin0.hx + (PINH.x - st.pin0.hx) * e; st.hz = st.pin0.hz + (PINH.z - st.pin0.hz) * e; st.sc = st.pin0.sc * Math.pow(fit / st.pin0.sc, e); st.pinK = e; } SC_MAIN = st.sc; C0.x = st.hx - st.bcx * st.sc; C0.z = st.hz - st.bcz * st.sc; st.cx = C0.x; st.cz = C0.z; return; } const H0 = homeNow(), H = H0 === HOME ? { x: H0.x, z: zFor(Math.max(1, (m.box ? m.box.d : 8) * (st.sc || 1)), (HOME.yc || 0.534) - 0.022 * Math.min(1, (m.box ? m.box.d : 8) * (st.sc || 1) / H0.d)), w: H0.w, d: H0.d, smax: H0.smax } : H0, moving = !snap && !!morph && morph.m === m, b = m.box, fit = Math.min(H.smax, H.w / (m.box.w + 2 * PADM), H.d / (m.box.d + 2 * PADM)), s = fit; /* the molecule slides and scales to its home only while a step is moving it, toward where the step will leave it; between steps it stands exactly still */ if (snap || st.bcx == null || !moving) { st.bcx = b.cx; st.bcz = b.cz; st.hx = H.x; st.hz = H.z; st.sc = s; } else { /* it arrives on the step's last frame, so nothing is left to snap on the frame after */ const el = now == null ? 0 : now - morph.t0, left = now == null ? 1e9 : morph.slow && morph.s0 != null ? morph.s0 + (morph.ms || 330) - el : morph.end != null ? morph.end - el : 1e9, k = Math.min(1, Math.max(dt * 9, dt * 1000 / Math.max(dt * 1000, left - dt * 1000))); st.bcx += (b.cx - st.bcx) * k; st.bcz += (b.cz - st.bcz) * k; st.hx += (H.x - st.hx) * k; st.hz += (H.z - st.hz) * k; st.sc += (s - st.sc) * k; } SC_MAIN = s; C0.x = st.hx - st.bcx * st.sc; C0.z = st.hz - st.bcz * st.sc; keepIn(m, H0); }
  // what is drawn at this moment lies inside the play rectangle on every frame, also while it changes: the scale gives way as far as the widest
  // in-between shape needs (and comes back with the step, never in a jump), and the whole is shifted by what still reaches over
  function keepIn(m, H0) { const L = stayBox(m); L.w += 2 * PADM; L.d += 2 * PADM; const R0 = playRect(H0), hk = BENCHV ? st.sc : 0, R = [R0[0] + 0.32 * hk, R0[1] + 0.6 * hk, R0[2] - 0.32 * hk, R0[3]], fw = (R[2] - R[0]) / Math.max(0.5, L.w), fd = (R[3] - R[1]) / Math.max(0.5, L.d); if (st.sc > fw) st.sc = fw; if (st.sc > fd) st.sc = fd;
    if (m.fl) { C0.x = st.hx - st.bcx * st.sc; C0.z = st.hz - st.bcz * st.sc; } else if (BENCHV) { C0.x = (R[0] + R[2]) / 2 - L.cx * st.sc; C0.z = (R[1] + R[3]) / 2 - L.cz * st.sc; }
    const x0 = C0.x + (L.cx - L.w / 2) * st.sc, x1 = C0.x + (L.cx + L.w / 2) * st.sc, z0 = C0.z + (L.cz - L.d / 2) * st.sc, z1 = C0.z + (L.cz + L.d / 2) * st.sc; if (x0 < R[0]) C0.x += R[0] - x0; else if (x1 > R[2]) C0.x -= x1 - R[2]; if (z0 < R[1]) C0.z += R[1] - z0; else if (z1 > R[3]) C0.z -= z1 - R[3]; }
  // the box of what belongs to the molecule as drawn now (atoms on their way out of it are not counted: they are meant to leave)
  const stayBox = m => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; m.balls.forEach((b, a) => { if (!m.at || !m.at.get(a)) return; const p = b.mesh.position, r = (b.R || 0.4) + 0.1; x0 = Math.min(x0, p.x - r); x1 = Math.max(x1, p.x + r); z0 = Math.min(z0, p.z - r); z1 = Math.max(z1, p.z + r); }); return x0 > 1e8 ? Object.assign({}, liveBox(m)) : { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 }; };
  // the one rectangle of the page the molecule lives in (page units): x0, z0, x1, z1
  const playRect = H => { H = H || homeNow(); return [H.x - H.w / 2, H.z - H.d / 2, H.x + H.w / 2, H.z + H.d / 2]; };
  const fitMain = m => m.fl ? flScale(m) : Math.max(0.5, (SIDE ? Math.min(BENCHV ? HOME.smax : 4.4, LANE.w / spanOf(m), LANE.d / deepOf(m)) : Math.min(2.9, 24 / spanOf(m), 10 / deepOf(m))));
  function freeMol(m) { if (!m) return; scene.remove(m.group); m.group.traverse(o => { if (o.userData.own && o.geometry) { o.geometry.dispose(); o.material.dispose(); } }); }
  const place = (m, p, sc) => { m.group.position.set(p.x, 0, p.z); m.group.scale.setScalar(sc); };

  // ---------- sparks, bits and bubbles: one pool of small balls ----------
  const PN = 700, pMesh = new T.InstancedMesh(new T.SphereGeometry(1, 8, 6), new T.MeshBasicMaterial(), PN), parts = [], pM = new T.Matrix4(), pQ = new T.Quaternion(), pV = new T.Vector3(), pS = new T.Vector3(), pC = new T.Color();
  pMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); pMesh.frustumCulled = false; scene.add(pMesh);
  for (let i = 0; i < PN; i++) { parts.push({ life: 0 }); pMesh.setMatrixAt(i, pM.makeScale(0, 0, 0)); pMesh.setColorAt(i, pC.set(0xffffff)); }
  let pNext = 0;
  // g is gravity: positive falls and bounces on the page, negative rises
  // A hit throws ink onto the paper under it: blots, and streaks running out from the spot. Nothing flies through the air.
  // ?show=plain plays a reaction with one thing to look at: no spray, slashes or bursts, little shake, a slower chain,
  // and no banner for every step of a chain. In both, each step of a chain shows the reagent that is acting.
  const PLAIN = (() => { try { return new URLSearchParams(root.location.search).get('show') !== 'full'; } catch (e) { return true; } })();
  function burst3(x, y, z, n, col) { if (PLAIN) return;
    const t = -y / camDir.y, gx = x + camDir.x * t, gz = z + camDir.z * t, now = performance.now();
    for (let k = 0; k < n; k++) { const a = Math.random() * 6.283, d = 0.6 + Math.random() * 3.2; st.blots.push({ x: gx + Math.cos(a) * d * 1.2, z: gz + Math.sin(a) * d * 0.75, r: 3 + Math.random() * 9, t: now, col }); }
    for (let k = 0; k < Math.ceil(n / 2); k++) { const a = Math.random() * 6.283, d0 = 0.8 + Math.random(), d1 = d0 + 1 + Math.random() * 2.6; st.blots.push({ line: true, x: gx + Math.cos(a) * d0 * 1.2, z: gz + Math.sin(a) * d0 * 0.75, x2: gx + Math.cos(a) * d1 * 1.2, z2: gz + Math.sin(a) * d1 * 0.75, r: 3 + Math.random() * 5, t: now, col }); }
  }
  function stepParts(dt) {
    for (let i = 0; i < PN; i++) {
      const q = parts[i]; if (q.life <= 0) continue;
      q.life -= dt; q.vy -= q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      if (q.g > 0 && q.y < q.s) { q.y = q.s; q.vy *= -0.45; q.vx *= 0.7; q.vz *= 0.7; }
      const k = q.life <= 0 ? 0 : q.s * Math.sqrt(q.life / q.max);
      pMesh.setMatrixAt(i, pM.compose(pV.set(q.x, q.y, q.z), pQ, pS.set(k, k, k)));
    }
    pMesh.instanceMatrix.needsUpdate = true;
  }

  // ---------- state ----------
  // the band along the bottom, left to right: the multiplier, what has been made, the number to beat, the last gain
  const BAND = 11.2, MULT = { x: EDGE + 0.9 + (KITV === 'side' ? 0.6 : 0), z: BAND }, MADE = { x: -22.6, z: 13.3 }, BEAT = KITV === 'back' ? { x: -1.2, z: 12.3 } : { x: -4.8 + SX, z: 14.4 }, GAIN = { x: 22, z: -1.5 }, CALL = { x: 3.5, z: -4.3 }, KITP = i => (KITV === 'side' ? { x: -23.4 + i * 0.42, z: -8.8 + i * 4.2 } : KITV === 'back' ? (BENCHV ? (BENCHV === 'a' ? topRow().kit[i] || { x: 40, z: TOPB.z } : { x: 37.5, z: -20 + i * 7.5 }) : { x: -8.6 + i * 5.3, z: -10.9 }) : { x: 0.2 + i * 4.75, z: 11.0 });
  if (PGE.on) MADE.z += PGE.dz;
  if (SHP) { MADE.x = SHP.made.x; MADE.z = SHP.made.z; Object.assign(PINH, SHP.pin); }
  if (SHAPE === 'a') GAIN.z -= 3.9;
  if (SIDE) { GAIN.x = -12.6 + SX; GAIN.z = 7.4; CALL.x = -1; CALL.z = -12.3; }
  if (KITV === 'back') { GAIN.x = -17.5; GAIN.z = 3.6; CALL.x = 10; CALL.z = 13.1; }
  if (KITV !== 'bottom') { C0.x += SX * 0.55; C0.z += 1.3; }
  if (KITV === 'back') { C0.x += 0.3; C0.z += 0.3; }
  let SLOTW = 10, LABF = 50;
  const st = { mode: 'play', feed: 0, hover: -1, quota: 0, shown: 0, pass: false, tok: 0, shake: 0, flash: 0, flashC: '28,138,74', pageStart: 0, floats: [], blots: [], pings: [], slashes: [], strokes: [], flyers: [], motes: [], gains: [], passT: [], chainN: 0, tip: null, teach: { i: 0, t: 0 }, by: { water: 0, h2: 0, gauge: 0 }, byBump: { water: 0, h2: 0, gauge: 0 }, struck: 0, hold: 0, kx: 0, kz: 0, kvx: 0, kvz: 0, sq: 0, zoomUntil: 0, fx: 3.5, fz: 2.6, focus: { x: 3.5, z: 2.6 }, peek: null, willFire: null, pending: null, sc: 1, fury: 0, call: null, multBump: 0, over: 0, turned: 0, gear: [], fired: {}, want: 0, mult: 1, P: 0, R: 1, E: 1, bump: { p: 0, r: 0, e: 0 }, stains: [], pop: 0, zoom: 0, zoomT: 0, madeBump: 0, bubble: 0 };
  let g = null, slots = [], center = null, prods = [], rowMols = [], tweens = [], dirty = true, last = performance.now(), lastInk = 0;
  let run = null, picks = [], pickObjs = [], briefs = [], briefMols = [], best = 0; const meta = { credit: 0, tier: 0, fam: {}, found: {}, sig: {}, stage: 1, six: 0, taught: false, jar: { water: 0, h2: 0 }, hatched: {} }, shop = { earned: 0 };
  try { best = +(localStorage.getItem('aa_scheme_best') || 0) || 0; const m = JSON.parse(localStorage.getItem('aa_scheme_meta') || 'null'); if (m) { meta.credit = m.credit | 0; meta.tier = Math.max(0, Math.min(P.SUPPLY.length - 1, m.tier | 0)); meta.fam = m.fam || {}; meta.found = m.found || {}; meta.sig = m.sig || {}; meta.six = m.six | 0; meta.stage = m.stage | 0 || (meta.tier >= 4 ? 3 : meta.tier >= 1 ? 2 : 1); meta.taught = !!m.taught; meta.coined = !!m.coined; meta.jar = { water: 0, h2: 0 }; Object.keys(m.jar || {}).forEach(k => { meta.jar[k] = m.jar[k] | 0; }); meta.hatched = Object.assign({}, m.hatched || {}); } } catch (e) { /* storage unavailable */ }
  // (builder 20) THE GAME REMEMBERS YOU. The profile (meta: what is owned, the ladder and its counts, the jars, credit) is kept under ONE key,
  // with a version and the ladder it was saved under; a profile from an older ladder keeps its counts and loses only rungs that no longer exist.
  // ?fresh=1 starts clean (and forgets what was saved); ?profile=<json or base64 json> loads that one for a test and saves nothing.
  const PROF = { key: 'overreact_profile', v: 1, from: 'new', noSave: false, older: false, sig: () => { try { return (P.LADDER || []).map(r => r.id).join(','); } catch (e) { return ''; } } };
  const saveMeta = () => { if (PROF.noSave) return; try { localStorage.setItem(PROF.key, JSON.stringify({ v: PROF.v, ladder: PROF.sig(), best, meta })); } catch (e) { /* storage unavailable */ } };
  (() => { let q = null; try { q = new URLSearchParams(root.location.search); } catch (e) { /* no window */ }
    const clean = () => { Object.keys(meta).forEach(k => { delete meta[k]; }); Object.assign(meta, { credit: 0, tier: 0, fam: {}, found: {}, sig: {}, stage: 1, six: 0, taught: false, jar: { water: 0, h2: 0 }, hatched: {} }); };
    const take = src => { const m = src && (src.meta || src); if (!m || typeof m !== 'object') return false; if (m.ladder && src.ladder !== PROF.sig()) { const ids = {}; (P.LADDER || []).forEach(r => { ids[r.id] = 1; }); Object.keys(m.ladder).forEach(k => { if (!ids[k]) delete m.ladder[k]; }); PROF.older = true; }
      clean(); Object.assign(meta, m); meta.jar = Object.assign({ water: 0, h2: 0 }, m.jar || {}); meta.hatched = Object.assign({}, m.hatched || {}); meta.sig = meta.sig || {}; meta.fam = meta.fam || {}; meta.found = meta.found || {}; meta.stage = meta.stage | 0 || 1; if (src.best) best = Math.max(best, +src.best || 0); return true; };
    if (q && q.get('fresh') === '1') { clean(); best = 0; PROF.from = 'fresh'; try { localStorage.removeItem(PROF.key); localStorage.removeItem('aa_scheme_meta'); localStorage.removeItem('aa_scheme_best'); } catch (e) { /* storage unavailable */ } return; }
    const qp = q && q.get('profile'); if (qp) { let src = null; try { src = JSON.parse(qp); } catch (e) { try { src = JSON.parse(atob(qp)); } catch (e2) { src = null; } } if (take(src)) { PROF.from = 'query'; PROF.noSave = true; } return; }
    try { const src = JSON.parse(localStorage.getItem(PROF.key) || 'null'); if (src && take(src)) PROF.from = 'saved'; else if (localStorage.getItem('aa_scheme_meta')) PROF.from = 'old'; } catch (e) { /* storage unavailable */ } })();
  try { P.RULE.termsGate = false; } catch (e) { /* older rules */ }
  const profOpts = o => { try { return Object.assign(o || {}, P.profileOpts(meta)); } catch (e) { return o; } };
  run = P.runNew(meta.tier, undefined, profOpts({ meta })); run.manual = true; run.meta = meta;
  const PICKX = [-15, 0, 15];
  // the molecule in the middle while it is changing from what it was to what it is
  const LEGEND = (() => { try { return new URLSearchParams(root.location.search).get('legend') === '1'; } catch (e) { return false; } })();   // ?legend=1: the small list of kinds along the top and the column of multipliers
  let morph = null; const STAGED = (() => { try { return new URLSearchParams(root.location.search).get('staged') !== '0'; } catch (e) { return true; } })();
  const tween = (m, to, sc, dur, done) => tweens.push({ m, fx: m.group.position.x, fz: m.group.position.z, fs: m.group.scale.x, to, sc, t: 0, dur, done });
  const colOf = id => bright(RX.CARDS[id].rgb);
  // how near the page is to going off by itself: grows with the row and with the page's reactions used
  const chargeOf = () => (!g || g.fired || g.chain || st.mode === 'done' || st.mode === 'pick' || st.mode === 'brief' || st.mode === 'shop' || st.mode === 'terms' || st.mode === 'hom') ? 0 : st.mode === 'fuse' ? 1 : Math.min(0.94, Math.min(g.cur.path.length, 3) / 6 + Math.min(1, g.pageSteps / P.stepsOf(g)) / 2);
  const WORDS = (() => { try { return new URLSearchParams(root.location.search).get('words') === '1'; } catch (e) { return false; } })(); // no words in the game: the written call beside the molecule is off (?words=1)
  const callout = (text, sub, col, ticks) => { if (!WORDS) return; if (PLAIN && (st.chainN || 0) > 0 && / in a row$/.test(text)) return; if (st.firing && P.RULE.cascade) return; st.call = { text, sub: sub || '', col: col || INK, ticks: ticks || 0, t: performance.now() }; };
  const spray = (n, col, wide) => { if (PLAIN) return; const now = performance.now(); for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, d = 2 + Math.random() * (wide ? 12 : 6); if (k % 3) continue; st.blots.push({ x: C0.x + Math.cos(a) * d * 1.3, z: C0.z + Math.sin(a) * d * 0.7, r: 4 + Math.random() * (wide ? 12 : 8), t: now, col }); } };

  // ---------- equipment: objects standing on the page, each with its name and what it does pencilled under it ----------
  let kitObjs = [], heldObjs = [];
  let heldShelf = null, offerShelves = [];
  const clearPicks = () => { clearHoms(); pickObjs.forEach(k => scene.remove(k.grp)); pickObjs = []; heldObjs.forEach(k => scene.remove(k.grp)); heldObjs = []; if (heldShelf) { scene.remove(heldShelf); heldShelf = null; } offerShelves.forEach(q => scene.remove(q)); offerShelves = []; };
  const GLASS = AA.rxKit.mat(T, 0xdfe9ee, 0.08, 0, { transparent: true, opacity: 0.42 });
  // the four yield flags on the track are the kit's: drawn as outline until the total passes them, then filled
  function buildFlags() { const out = []; ['stable', 'unstable', 'volatile', 'overreact'].forEach(nm => { const mk = suf => { const grp = new T.Group(), inner = new T.Group(); if (!AA.rxKit.build('mark_' + nm + suf, T, inner, new T.Color(0xffffff))) return null; const bb = new T.Box3().setFromObject(inner), sz = bb.getSize(new T.Vector3()), k = Math.min(1.1, 1.9 / Math.max(sz.x, sz.z), 2.4 / sz.y); inner.scale.setScalar(k); inner.position.set(-(bb.min.x + bb.max.x) / 2 * k, -bb.min.y * k, -(bb.min.z + bb.max.z) / 2 * k); grp.add(inner); grp.rotation.x = -0.8; grp.visible = false; scene.add(grp); return grp; }; out.push({ on: mk(''), off: mk('_off') }); }); return out.every(o => o.on && o.off) ? out : null; }
  const YMARKS = !!(AA.rxMarks && AA.rxMarks.yieldMark);   // the yield marks are our alchemy marks drawn on the page (no flags, poles, post or coin pictures)
  function updateFlags() {
    const show = g && st.quota > 0 && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse' || st.mode === 'done');
    if (!YMARKS && !st.flags3 && show && !st.flags3Tried) { st.flags3Tried = true; try { st.flags3 = buildFlags(); } catch (e) { st.flags3 = null; } }
    if (!st.flags3) return;
    const marks = show ? P.runMarks(st.quota) : [], vals = [st.quota].concat(marks), n = marks.length, fr = k => (k === 0 ? 0.5 : 0.5 + 0.5 * k / Math.max(1, n));
    st.flags3.forEach((o, k) => { const ok = show && k < vals.length, passed = ok && (st.mode === 'done' ? g.total >= vals[k] : !!st.passT[k]); [o.on, o.off].forEach(q => { q.visible = false; }); if (!ok || k === 0) return; const q = passed ? o.on : o.off; q.visible = true; q.position.set(TRK.x0 + (TRK.x1 - TRK.x0) * fr(k) + 0.2, 0, TRK.z - 0.4); dirty = true; });
  }
  // (builder 11) the row along the top of the bench: jars, then the instruments each at its own width, then the homunculus; all shrink together if the row is too long for the bench
  const kitCm = id => REALCM[id] || [9, 11];
  // (builder 14) the bench has zones, and nothing in one zone reaches into another: the creatures' jars on a low shelf at the back left (BNZ.jar: ten places, one size at any count);
  // the instruments in the front row before the notebook's top edge (BNZ.kit: each at its real width with a gap, all five shrunk together only if they would pass the zone);
  // the creature of the run right of them (BNZ.hom); a clear place for a thing arriving from the catalog (BZ.new); the cash tin and the cup at the top right; the cards down the right
  function topRow() { const gear = (st && st.gear) || [], key = gear.join(',') + '|' + ((run && run.hom) || ''); if (topRow.key === key) return topRow.v; const A = SHAPE === 'a', Z = BNZ.kit, cm = gear.map(kitCm);
    // each instrument at its real size times one k; a small one (a stopwatch, a candle) is never drawn under Z.min across, and none is taller than the row; if the row is then too long, all shrink together
    let ks = cm.map(c => (A ? Math.min(Z.h / c[1], Math.max(Z.k, Z.min / Math.max(c[0], c[1]))) : 1)); const wide = () => cm.reduce((a, c, i) => a + c[0] * UCM * ks[i], 0), room = A ? Z.x1 - Z.x0 - Z.gap * Math.max(0, cm.length - 1) : TOPB.x1 - TOPB.x0 - 1.6 * cm.length; if (wide() > room) { const f = room / wide(); ks = ks.map(q => q * f); }
    let x = A ? Z.x0 : TOPB.x0; const gap = A ? Z.gap : 1.6, kit = cm.map((c, i) => { const w = c[0] * UCM * ks[i], o = { x: x + w / 2, z: A ? Z.z - (AA.rxKit.FLAT[gear[i]] ? 1.0 : 0) : TOPB.z }; x += w + gap; return o; }), k = ks.length ? Math.min.apply(null, ks) : (A ? Z.k : 1);
    topRow.key = key; topRow.v = { k, ks, kit, hom: A ? { x: BNZ.hom.x, z: BNZ.hom.z } : { x: x + 4.2 * k, z: TOPB.z + 0.4 } }; HOMP.x = topRow.v.hom.x; HOMP.z = topRow.v.hom.z; return topRow.v; }
  function piece(id) {
    const grp = new T.Group(), inner = new T.Group(), liq = new T.Color().setHSL(hash(id + 'hue'), 0.75, 0.5), yaw = (hash(id + 'yaw') - 0.5) * 0.7;
    if (!AA.rxKit.build(id, T, inner, liq)) add(new T.BoxGeometry(2, 1.2, 2), std({ color: lin(0x3b3e42), roughness: 0.5 }), 0, 0.6, 0, inner);
    const bb = new T.Box3().setFromObject(inner), sz = bb.getSize(new T.Vector3()), k = Math.min(1.7, 3.0 / Math.max(sz.x, sz.z), 3.3 / sz.y), pw = Math.max(sz.x, sz.z) * k, ph = sz.y * k;
    inner.scale.setScalar(k); inner.position.set(-(bb.min.x + bb.max.x) / 2 * k, -bb.min.y * k, -(bb.min.z + bb.max.z) / 2 * k);
    // each piece leans back on the page so that it is seen from the front and not from on top
    grp.add(inner); grp.rotation.x = AA.rxKit.FLAT[id] ? 0 : -0.8; grp.rotation.y = yaw; scene.add(grp); if (BENCHV && !AA.rxKit.FLAT[id]) { const sh = flatMesh(4.4, 1.9, softShadow(), 0); sh.rotation.x = 0.8; sh.position.set(0.3, 0.02, 0.25); sh.renderOrder = 2; grp.add(sh); }
    return { id, grp, yaw, pw, ph, col: '#' + liq.getHexString() };
  }
  // How each piece moves when it fires. Anything not named hops.
  //   tip: rocks from side to side.  spin: turns once.  butt: lunges at the molecule.  flare: swells and settles.
  //   drip: squashes, then stretches.  slam: lifts and comes down flat.  shake: rattles.
  const FIRE = { balance: 'tip', scalepan: 'tip', carousel: 'spin', magnet: 'spin', stopwatch: 'spin', ouroboros: 'spin', goat: 'butt', candle: 'flare', bunsen: 'flare', stone: 'flare', elixir: 'flare', crystal: 'flare',
    dryer: 'drip', scrubber: 'drip', sieves: 'shake', hood: 'flare', burette: 'drip', dropper: 'drip', cannula: 'drip', reflux: 'drip', coldtrap: 'drip', schlenk: 'drip', logbook: 'slam', cards: 'slam', pact: 'slam', ouija: 'slam', mirror: 'slam', transmute: 'slam',
    mortar: 'shake', stopper: 'shake', regia: 'shake', homunculus: 'shake', recycler: 'shake', timer: 'shake', loupe: 'shake', litmus: 'shake', thermometer: 'shake', clamp: 'shake', stirrer: 'shake' };
  function animKit(k, i, now, heat) {
    const f = st.fired[k.id], age = f ? (now - f.t) / 1000 : 9, t = now / 1000, G = k.grp, B = k.base || 1, style = FIRE[k.id] || 'hop', ready = st.willFire && st.willFire.has(k.id);
    // idle: a slow breath, a sway, a small hop now and then, each out of step with its neighbours
    const beat = (t + i * 1.9 + hash(k.id) * 5) % 7, hop = beat < 0.34 ? Math.sin(beat / 0.34 * Math.PI) * (BENCHV ? 0.15 : 0.35) : 0, look = (k.id === 'goat' || k.id === 'homunculus' ? 0.4 : 0.1) * Math.sin(t * 0.55 + i * 3);
    let y = hop + (ready ? (BENCHV ? 0.15 + 0.1 * Math.sin(now / 90) : 0.35 + 0.25 * Math.sin(now / 90)) : 0), x = 0, z = 0, yaw = k.yaw + look, rz = (0.025 + 0.1 * heat) * Math.sin(t * (1.3 + 9 * heat) + i * 2), sx = 1, sy = 1 + 0.02 * Math.sin(t * 1.7 + i);
    if (age < 0.7) {
      const u = age / 0.7, out = 1 - u, snap = age < 0.07 ? age / 0.07 : 1;
      if (style === 'tip') rz += 0.5 * Math.sin(age * 26) * out * out;
      else if (style === 'spin') { yaw += (1 - Math.pow(out, 3)) * 6.283; y += Math.sin(Math.min(1, u * 2) * Math.PI) * (BENCHV ? 0.3 : 0.8); }
      else if (style === 'butt') { const g2 = age < 0.12 ? -age / 0.12 * 0.5 : age < 0.26 ? -0.5 + (age - 0.12) / 0.14 * 2.9 : 2.4 * Math.pow(1 - (age - 0.26) / 0.44, 2); z -= g2 * 1.1; x -= g2 * 0.5; sx = 1 + 0.12 * Math.max(0, g2 / 2.4); sy *= 1 - 0.1 * Math.max(0, g2 / 2.4); }
      else if (style === 'flare') { const w = Math.sin(Math.min(1, u * 1.6) * Math.PI); sx = 1 + (BENCHV ? 0.1 : 0.3) * w; sy *= 1 + (BENCHV ? 0.14 : 0.42) * w; y += (BENCHV ? 0.1 : 0.3) * w; }
      else if (style === 'drip') { const w = age < 0.12 ? -(age / 0.12) * 0.25 : 0.3 * Math.cos((age - 0.12) * 24) * out * out; sy *= 1 + w; sx = 1 - w * 0.5; }
      else if (style === 'slam') { const UPK = BENCHV ? 0.5 : 1.7, up = age < 0.2 ? Math.sin(age / 0.2 * Math.PI / 2) * UPK : age < 0.3 ? UPK * (1 - (age - 0.2) / 0.1) : 0; y += up; if (age >= 0.3) { const w = Math.pow(1 - (age - 0.3) / 0.4, 2); sy *= 1 - 0.25 * w * Math.cos((age - 0.3) * 30); sx = 1 + 0.14 * w; } rz += age < 0.3 ? 0.15 * Math.sin(age * 20) : 0; }
      else if (style === 'shake') { x += Math.sin(age * 70) * 0.28 * out * out; rz += Math.sin(age * 55) * 0.2 * out * out; y += 0.25 * out * snap; }
      else { const w = Math.sin(Math.min(1, u * 1.5) * Math.PI); y += (BENCHV ? 0.5 : 1.8) * w; sy *= 1 + (BENCHV ? 0.08 : 0.18) * w - (u > 0.66 ? 0.2 * Math.sin((u - 0.66) / 0.34 * Math.PI) : 0); sx = 1 - 0.08 * w + (u > 0.66 ? 0.12 * Math.sin((u - 0.66) / 0.34 * Math.PI) : 0); }
    }
    // arriving: a drop from above, a squash on landing
    { const a0 = (now - (k.born || 0)) / 1000; G.visible = a0 >= 0; if (a0 >= 0 && a0 < 0.8) { const u = Math.min(1, a0 / 0.38); y += (1 - u) * (1 - u) * 11; if (a0 >= 0.38) { const w = Math.sin((a0 - 0.38) / 0.42 * Math.PI) * (1 - (a0 - 0.38) / 0.42); sy *= 1 - 0.3 * w; sx *= 1 + 0.18 * w; } } }
    { const inner = G.children[0]; if (inner && AA.rxKit.use) AA.rxKit.use(inner, age < 0.7 ? Math.sin(Math.min(1, age / 0.7) * Math.PI) : 0); }
    G.position.set(k.hx + x, y, k.hz + z); G.rotation.y = yaw; G.rotation.z = rz; G.scale.set(B * sx, B * sy, B * sx);
  }
  // the instruments of the run stand on the kit's wooden shelf, five places, at one scale
  let kitShelf = null; const shelfAt = (n, x, z, K) => { const grp = new T.Group(), sh = AA.rxKit.shelf(T, n); if (!sh) return null; grp.add(sh); grp.rotation.x = -0.8; grp.scale.setScalar(K); grp.position.set(x, 0, z); scene.add(grp); return grp; };
  function buildKit() {
    if (kitShelf) { scene.remove(kitShelf); kitShelf = null; }
    kitObjs.forEach(k => scene.remove(k.grp)); kitObjs = []; AA.rxKit.wishes = run.wishes || 0;
    st.gear.forEach((id, i) => { const k = piece(id), q = KITP(i); k.grp.position.set(q.x, 0, q.z); k.hx = q.x; k.hz = q.z; k.born = performance.now() + 250 + i * 110; k.base = BENCHV ? kitCm(id).map((c, j) => c * UCM / (j ? k.ph : k.pw)).reduce((a, b) => Math.min(a, b)) * (topRow().ks[i] || topRow().k) : (KITV === 'bottom' ? 1.3 : KITV === 'side' ? 0.85 : 1.55) * sizeOf(id); k.grp.scale.setScalar(k.base); kitObjs.push(k); });
    if (KITV === 'back' && P.stageOf(meta) >= 2 && !P.RULE.bare && (st.gear.length || JARK.some(jarSeen))) { if (!BENCHV) kitShelf = shelfAt(10, -3.0, -10.5, 1.42); }
  }
  // The flask stands by the count. Its red line is the number to beat. Past the line it boils over, harder with
  // every doubling, and what spills stains the page under it.
  const FLASK = KITV === 'back' ? { x: -4.0, z: 11.5 } : { x: -4.8 + SX, z: 10.4 }, FB = { h: 2.3, r0: 1.3, r1: 0.36, line: 0.7 };
  const flask = (() => {
    const grp = new T.Group(), rAt = y => FB.r0 - (FB.r0 - FB.r1) * (y / FB.h), liqM = std({ color: lin(0x3aa6c8), roughness: 0.3 });
    add(new T.CylinderGeometry(FB.r1, FB.r0, FB.h, 28), GLASS, 0, FB.h / 2, 0, grp); add(new T.CylinderGeometry(FB.r1, FB.r1, 0.8, 20), GLASS, 0, FB.h + 0.4, 0, grp);
    add(new T.TorusGeometry(FB.r1 + 0.04, 0.06, 8, 24), GLASS, 0, FB.h + 0.8, 0, grp).rotation.x = Math.PI / 2;
    add(new T.TorusGeometry(rAt(FB.h * FB.line) + 0.02, 0.05, 8, 28), std({ color: lin(0xc8261c), roughness: 0.5 }), 0, FB.h * FB.line, 0, grp).rotation.x = Math.PI / 2;
    const liq = add(new T.CylinderGeometry(1, 1, 1, 24), liqM, 0, 0, 0, grp), neck = add(new T.CylinderGeometry(FB.r1 * 0.85, FB.r1 * 0.85, 0.8, 16), liqM, 0, FB.h + 0.4, 0, grp), dome = add(new T.SphereGeometry(0.5, 20, 14), liqM, 0, FB.h + 0.85, 0, grp);
    const runs = [0, 1, 2, 3].map(k => { const a = k * 1.571 + 0.5, m = add(new T.CylinderGeometry(0.09, 0.12, 1, 8), liqM, Math.cos(a) * 0.55, FB.h, Math.sin(a) * 0.55, grp); m.rotation.set(Math.sin(a) * 0.42, 0, -Math.cos(a) * 0.42); return m; });
    [liq, neck, dome].concat(runs).forEach(m => { m.userData.plain = true; }); AA.rxKit.finish(T, grp);
    grp.rotation.x = -0.8; grp.scale.setScalar(1.25); grp.position.set(FLASK.x, 0, FLASK.z); grp.visible = false; scene.add(grp);
    let last = -1;
    // level 0 to 1 is empty to the red line; over is how many doublings past it
    return { grp, liqM, set(level, over) {
      const L = Math.max(0.02, Math.min(1, over > 0 ? FB.line + (1 - FB.line) * Math.min(1, over / 1.5) : FB.line * level)), y = FB.h * L;
      if (Math.abs(L - last) > 0.004) { last = L; liq.geometry.dispose(); liq.geometry = new T.CylinderGeometry(rAt(y) * 0.93, FB.r0 * 0.93, y, 24); liq.position.y = y / 2; }
      const full = over > 1.4; neck.visible = full; dome.visible = full; const d = full ? Math.min(1.8, 0.5 + 0.28 * over) : 0; dome.scale.set(d, d * 0.7, d);
      runs.forEach((m, k) => { const len = full ? Math.min(FB.h * 0.95, Math.max(0, over - 1.4 - k * 0.6) * 0.8) : 0; m.visible = len > 0.05; m.scale.y = Math.max(0.05, len); const a = k * 1.571 + 0.5, rr = rAt(FB.h - len / 2) + 0.06; m.position.set(Math.cos(a) * rr, FB.h - len / 2, Math.sin(a) * rr); });
      const hot = Math.min(1, over / 6), c = over > 0 ? new T.Color().setHSL(0.36 - 0.5 * hot + (hot > 0.72 ? 1 : 0), 0.85, 0.48) : new T.Color(0x3aa6c8); liqM.color.copy(c.convertSRGBToLinear()); this.hex = '#' + c.convertLinearToSRGB().getHexString();
    }, hex: '#3aa6c8' };
  })();
  // What leaves a molecule is kept in two jars at the top left: water in one, hydrogen in the other. They fill across
  // runs, are saved with the player's progress (meta.jar) and are never emptied. A homunculus grows in each: a
  // speck, a small figure, full size; it hatches when the jar is full (docs/JARS.md).
  const BEAK = { x: -21.6 + SX, z: KITV === 'back' ? -9.6 : -7.6 }, BALN = { x: -17.4 + SX, z: KITV === 'back' ? -9.6 : -7.6 }, TALLY = { x: -13.4 + SX, z: KITV === 'back' ? -8.6 : -6.4 };
  // one jar for each creature that is built (P.HOMS). A jar stands on the page once its substance has first come off;
  // water and hydrogen stand from the start. Up to two stand full size; more share the same corner in rows of up to five
  const JARK = Object.keys(P.HOMS).filter(P.homOn), JARC = { water: 0x3a6fd0, h2: 0xe58a7c, co2: 0xa9d8ee, acid: 0xd4e21a, wood: 0x9a6b3a, salt: 0xe9e4d6, slime: 0x8a5ad0, seedling: 0x3f9a4f, ammonia: 0xbcd6dc, brimstone: 0xc9a227 }, JARINK = { water: '#3a6fd0', h2: '#c8604e', co2: '#4f9fc4', acid: '#98a80e', wood: '#8a5a2b', salt: '#8d8872', slime: '#7044c0', seedling: '#2f7d3f', ammonia: '#6f9aa4', brimstone: '#9c7f12' }, HOMID = { water: 'homwater', h2: 'homh2', co2: 'homco2', acid: 'homacid', wood: 'homwood', salt: 'homsalt', slime: 'homslime', seedling: 'homseed', ammonia: 'homammonia', brimstone: 'hombrimstone' };
  const JFULL = k => P.JAR.full[k] || 100;   // (builder 14) the rules' table has no count for ammonia and brimstone yet
  const jarSeen = k => !P.RULE.bare && (k === 'water' || k === 'h2' || !!meta.hatched[k] || (meta.jar[k] || 0) > 0 || (st.by[k] || 0) > 0);
  const jarPos = k => { /* (builder 20, the owner: "all of the jars there, and some should be empty. The bench growing doesn't make sense") on the bench every creature's jar has its own fixed place, seen or not */ const L = BENCHV === 'a' ? JARK : JARK.filter(q => jarSeen(q) && !(BENCHV === 'a' && run && run.hom === q && q !== k)), i = L.indexOf(k), n = L.length; if (i < 0) return null; if (KITV === 'back' && BENCHV) return BENCHV === 'a' ? { x: BNZ.jar.x0 + i * BNZ.jar.dx, z: BNZ.jar.z, y: BNZ.jar.y, s: BNZ.jar.s } : { x: -39, z: -16 + i * 7, s: 2.2 }; if (KITV === 'back') { const sp = Math.min(4.4, 11 / Math.max(1, n)); return { x: -22.9 + sp * (i + 0.5), z: -10.9, s: Math.min(2.0, sp / 2.2) }; } if (n <= 2) return { x: i ? BALN.x : BEAK.x, z: BEAK.z, s: 1.2 }; const cols = n <= 5 ? n : Math.ceil(n / 2), rows = n <= 5 ? 1 : 2, sp = 8.6 / cols, row = Math.floor(i / cols); return { x: BEAK.x - 2.2 + sp * (i % cols + 0.5), z: BEAK.z + (rows > 1 ? -2.5 + row * 3.9 : 0), s: Math.min(1.0, sp / 2.75) }; };
  const homFig = (kind, stage) => { const grp = new T.Group(); const sg = stage || homStageNow(kind); AA.rxKit.build(HOMID[kind], T, grp, new T.Color(JARC[kind]), sg ? { stage: sg } : undefined); return grp; };
  const jarOf = k => Math.min(JFULL(k), ((meta.jar && meta.jar[k]) || 0) + (st.by[k] || 0));

  const jars = (() => { const out = {};
    JARK.forEach(k => { const grp = new T.Group(), j = AA.rxKit.jar(T, k); grp.add(j); grp.rotation.x = -0.8; grp.position.set(BEAK.x, 0, BEAK.z); grp.scale.setScalar(1.2); grp.visible = false; scene.add(grp); out[k] = { grp, j, set: j.userData.set, last: '' }; });
    return out; })();
  // (builder 14) the shelf the jars stand on: a low plank at the back left of the bench, ten places long
  let jarShelfB = null, jarShelfN = 0; const jarShelfMake = n => { if (BENCHV !== 'a') return null; const J = BNZ.jar, x0 = J.x0 - 1.7, x1 = J.x0 + (Math.max(1, n) - 1) * J.dx + 1.7, D = 3.0 * J.s / 1.05, c = canvasTex(512, 64), x = c.x; x.fillStyle = '#8a6238'; x.fillRect(0, 0, 512, 64); for (let i = 0; i < 26; i++) { x.strokeStyle = 'rgba(' + (i % 2 ? '50,30,12' : '200,160,110') + ',' + (0.1 + 0.12 * hash('sh' + i)) + ')'; x.lineWidth = 1 + 2 * hash('sw' + i); const y = 64 * hash('sy' + i); x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(170, y + 6 * (hash('sa' + i) - 0.5), 340, y + 6 * (hash('sb' + i) - 0.5), 512, y + 3 * (hash('sc' + i) - 0.5)); x.stroke(); } c.t.needsUpdate = true;
    const G = new T.Group(), top = add(new T.BoxGeometry(x1 - x0, J.y, D), [std({ color: lin(0x5a3c20), roughness: 0.8 }), std({ color: lin(0x5a3c20), roughness: 0.8 }), std({ map: c.t, roughness: 0.75 }), std({ color: lin(0x3a2616) }), std({ color: lin(0x4a3019), roughness: 0.85 }), std({ color: lin(0x4a3019) })], (x0 + x1) / 2, J.y / 2, J.z - 0.2, G); top.castShadow = false;
    const ink = add(new T.BoxGeometry(x1 - x0 + 0.16, 0.09, 0.09), new T.MeshBasicMaterial({ color: lin(0x241608) }), (x0 + x1) / 2, J.y, J.z - 0.2 + D / 2, G); ink.castShadow = false;
    const sh = flatMesh(x1 - x0 + 3, 3.2, softShadow(), 0.03); sh.position.set((x0 + x1) / 2 + 0.4, 0.03, J.z - 0.2 + D / 2 + 0.7); sh.renderOrder = 1; G.add(sh); G.visible = false; scene.add(G); return G; };
  // each creature lives in its jar in its own way. Only the creature is moved, about its own foot, and it is drawn a little smaller while it moves so that it never reaches the glass
  const JLIFE = {
    water: (c, t) => { c.rotation.y = 0.55 * Math.sin(t * 0.7); c.scale.y *= 1 + 0.03 * Math.sin(t * 2.1); c.rotation.z = 0.04 * Math.sin(t * 1.4); },
    h2: (c, t) => { c.rotation.y = 0.35 * Math.sin(t * 0.5); c.rotation.z = 0.05 * Math.sin(t * 1.3); },
    co2: (c, t) => { const u = (t % 4.2) / 0.7; c.rotation.y = u < 1 ? 0.09 * Math.sin(t * 58) * (1 - u) : 0.1 * Math.sin(t * 0.4); },
    acid: (c, t) => { const b = Math.abs(Math.sin(t * 2.6)); c.scale.y *= 1 - 0.07 * b; c.rotation.y = 0.2 * Math.sin(t * 0.6); },
    wood: (c, t) => { c.rotation.z = 0.06 * Math.sin(t * 0.9) + 0.02 * Math.sin(t * 2.3); const u = (t % 3.3) / 0.25; if (u < 1) c.position.y += 0.07 * Math.sin(u * Math.PI); },
    salt: (c, t) => { const u = ((t + 1.7) % 5.1) / 0.5; if (u < 1) c.scale.y *= 1 - 0.08 * Math.sin(u * Math.PI); },
    slime: (c, t) => { const b = 0.5 + 0.5 * Math.sin(t * 1.3); c.scale.y *= 0.9 + 0.1 * b; c.scale.x *= 1 - 0.05 * b; c.scale.z *= 1 - 0.05 * b; },
    ammonia: (c, t) => { const n = Math.floor(t / 2.2), u = Math.min(1, (t / 2.2 - n) / 0.08), a = (hash('am' + n) - 0.5) * 1.1, b = (hash('am' + (n - 1)) - 0.5) * 1.1; c.rotation.y = b + (a - b) * u; if (u < 1) c.position.y += 0.05 * Math.sin(u * Math.PI); },
    seedling: (c, t) => { c.rotation.z = 0.055 * Math.sin(t * 1.1); c.rotation.y = 0.25 * Math.sin(t * 0.4); },
    brimstone: (c, t) => { c.scale.y *= 0.95 + 0.05 * Math.sin(t * 9) * Math.sin(t * 2.3); c.rotation.y = 0.15 * Math.sin(t * 0.8); }
  };
  function jarLife(k, J, t, quick) { const c = J.j && J.j.userData.big; if (!c || !c.visible) return; if (!c.userData.home) c.userData.home = { s: c.scale.x, p: c.position.clone() }; const h = c.userData.home, s = h.s * 0.93; if (AA.rxKit.pose) AA.rxKit.pose(c, { tuck: 1, t }); c.scale.setScalar(s); c.position.copy(h.p); c.rotation.set(0, 0, 0); (JLIFE[k] || JLIFE.salt)(c, t * (quick ? 1.8 : 1) + hash(k) * 7); { const P0 = 11 + 5 * hash(k + 'tp'), u = ((t + 20 * hash(k + 'tq')) % P0) / 2.6, sm = q => { q = Math.max(0, Math.min(1, q)); return q * q * (3 - 2 * q); }; if (J.front) c.rotation.set(0, 0, 0); else if (u < 1 || J.back) c.rotation.y += Math.PI * (J.back ? 1 : sm(u / 0.22) * (1 - sm((u - 0.78) / 0.22))); } dirty = true; }   // now and then each turns its back to the glass
  // (builder 14) the measure of the bench: the box on the screen (a 1280 by 720 frame) of every object standing on it, and of the notebook; shadows are not counted
  function benchBoxes() { const out = [], W = 1280, H = 720, v = new T.Vector3(), shT = softShadow(), seen = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
    const boxOf = (id, root, zone) => { if (!root || !seen(root)) return; root.updateMatrixWorld(true); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; root.traverse(m => { if (!m.isMesh || !seen(m) || (m.material && m.material.map === shT) || m.userData.nobox) return; const pa = m.geometry.attributes.position, stp = Math.max(1, Math.floor(pa.count / 400)); for (let i = 0; i < pa.count; i += stp) { v.fromBufferAttribute(pa, i).applyMatrix4(m.matrixWorld).project(cam); const X = (v.x + 1) * W / 2, Y = (1 - v.y) * H / 2; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); } }); if (x1 > x0) out.push({ id, zone, b: [x0, y0, x1, y1].map(q => Math.round(q * 10) / 10) }); };
    JARK.forEach(k => boxOf('jar ' + k, jars[k].grp, 'jars')); kitObjs.forEach(k => boxOf('kit ' + k.id, k.grp, 'instruments')); if (homObj) boxOf('creature ' + homObj.id, homObj.grp, 'creature'); if (GP.tin) boxOf('tin', GP.tin.G, 'tin'); if (CUP.grp) boxOf('cup', CUP.grp, 'cup'); BT.map.forEach((b, id) => boxOf('card ' + id, b.grp, 'cards')); if (REFB && REFB.grp) boxOf('ledger', REFB.grp, 'ledger'); if (shopB) shopB.objs.forEach((o, i) => { if (o.grp) boxOf('shop ' + o.kind + i, o.grp, 'catalog'); });
    const pr = (x, z) => { v.set(x, 0.25, z).project(cam); return [(v.x + 1) * W / 2, (1 - v.y) * H / 2]; }, bk = [pr(SHP.x0 - 1.1, -23), pr(SHP.x1 + 1.1, -23), pr(SHP.x1 + 1.1, SHP.z1 + 1), pr(SHP.x0 - 1.1, SHP.z1 + 1)];
    // area of a box inside a convex outline (the notebook): the outline is cut by the box's four sides
    const clip = (poly, b) => { const cut = (P0, f) => { const R = []; for (let i = 0; i < P0.length; i++) { const A = P0[i], B = P0[(i + 1) % P0.length], a = f(A), c = f(B); if (a >= 0) R.push(A); if ((a >= 0) !== (c >= 0)) { const u = a / (a - c); R.push([A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u]); } } return R; }; let P1 = poly; P1 = cut(P1, q => q[0] - b[0]); P1 = cut(P1, q => b[2] - q[0]); P1 = cut(P1, q => q[1] - b[1]); P1 = cut(P1, q => b[3] - q[1]); let ar = 0; for (let i = 0; i < P1.length; i++) { const A = P1[i], B = P1[(i + 1) % P1.length]; ar += A[0] * B[1] - B[0] * A[1]; } return Math.abs(ar) / 2; };
    const pairs = []; let worst = 0; for (let i = 0; i < out.length; i++) { const A = out[i].b; const nb = clip(bk, A); if (nb > 0.5 && out[i].zone !== 'catalog') { pairs.push([out[i].id, 'notebook', Math.round(nb)]); worst = Math.max(worst, nb); } if (A[0] < 0 || A[1] < 0 || A[2] > W || A[3] > H) pairs.push([out[i].id, 'frame edge', Math.round(Math.max(-A[0], -A[1], A[2] - W, A[3] - H))]);
      for (let j = i + 1; j < out.length; j++) { const B = out[j].b, w = Math.min(A[2], B[2]) - Math.max(A[0], B[0]), h = Math.min(A[3], B[3]) - Math.max(A[1], B[1]); if (w > 0 && h > 0) { pairs.push([out[i].id, out[j].id, Math.round(w * h)]); worst = Math.max(worst, w * h); } } }
    return { n: out.length, worst: Math.round(worst), pairs, boxes: out, book: bk.map(q => q.map(Math.round)), mode: st.mode }; }
  // (builder 14) what a creature's tap looks like: a big physical thing on the molecule and the bench, one for each of the ten, made of drawn pieces (ink outline, flat colour)
  // that fly, fall, grow or burn for a second or two. No symbol and no word. actStart(id) is called by the tap; actFrame moves the pieces and takes them away.
  const ACT = { list: [], tex: {}, H: { water: 1000, h2: 1400, co2: 900, acid: 1200, wood: 1500, salt: 1000, slime: 800, ammonia: 900, seedling: 600, brimstone: 900 } };
  function actTex(kind) { if (ACT.tex[kind]) return ACT.tex[kind]; const c = canvasTex(96, 96), x = c.x, INKC = '#2b2622'; x.lineWidth = 5; x.lineJoin = 'round'; x.lineCap = 'round'; x.strokeStyle = INKC;
    const blob = (col, pts) => { x.fillStyle = col; x.beginPath(); pts.forEach((q, i) => { const a = i / pts.length * 6.283, r = 34 * q; if (!i) x.moveTo(48 + r * Math.cos(a), 48 + r * Math.sin(a)); else { const a0 = (i - 0.5) / pts.length * 6.283, r0 = 34 * (q + pts[i - 1]) / 2 * 1.12; x.quadraticCurveTo(48 + r0 * Math.cos(a0), 48 + r0 * Math.sin(a0), 48 + r * Math.cos(a), 48 + r * Math.sin(a)); } }); x.closePath(); x.fill(); x.stroke(); };
    if (kind === 'drop' || kind === 'gdrop' || kind === 'bdrop') { x.fillStyle = kind === 'drop' ? '#3a6fd0' : kind === 'gdrop' ? '#d4e21a' : '#9a6b3a'; x.beginPath(); x.moveTo(48, 10); x.bezierCurveTo(60, 34, 78, 48, 78, 62); x.arc(48, 62, 30, 0, Math.PI); x.bezierCurveTo(18, 48, 36, 34, 48, 10); x.fill(); x.stroke(); x.strokeStyle = 'rgba(255,255,255,0.8)'; x.beginPath(); x.arc(42, 62, 14, 2.2, 3.4); x.stroke(); }
    else if (kind === 'puff' || kind === 'smoke' || kind === 'ypuff') blob(kind === 'puff' ? '#f4f6f8' : kind === 'smoke' ? '#8f8f93' : '#f2e9a6', [1, 0.8, 1.05, 0.85, 1, 0.78, 1.02, 0.86]);
    else if (kind === 'goo') blob('#8a5ad0', [1, 0.7, 0.95, 0.6, 1.05, 0.75, 0.9, 0.65, 1]);
    else if (kind === 'grain') { x.fillStyle = '#fbf9f0'; x.beginPath(); x.moveTo(48, 14); x.lineTo(80, 32); x.lineTo(80, 66); x.lineTo(48, 84); x.lineTo(16, 66); x.lineTo(16, 32); x.closePath(); x.fill(); x.stroke(); x.lineWidth = 3; x.beginPath(); x.moveTo(16, 32); x.lineTo(48, 50); x.lineTo(80, 32); x.moveTo(48, 50); x.lineTo(48, 84); x.stroke(); }
    else if (kind === 'frost') { x.strokeStyle = '#eaf6ff'; x.lineWidth = 9; for (let i = 0; i < 3; i++) { const a = i * 1.047; x.beginPath(); x.moveTo(48 - 38 * Math.cos(a), 48 - 38 * Math.sin(a)); x.lineTo(48 + 38 * Math.cos(a), 48 + 38 * Math.sin(a)); x.stroke(); } x.strokeStyle = '#5f9fc8'; x.lineWidth = 3; for (let i = 0; i < 6; i++) { const a = i * 1.047; x.beginPath(); x.moveTo(48, 48); x.lineTo(48 + 38 * Math.cos(a), 48 + 38 * Math.sin(a)); x.moveTo(48 + 24 * Math.cos(a), 48 + 24 * Math.sin(a)); x.lineTo(48 + 34 * Math.cos(a + 0.35), 48 + 34 * Math.sin(a + 0.35)); x.moveTo(48 + 24 * Math.cos(a), 48 + 24 * Math.sin(a)); x.lineTo(48 + 34 * Math.cos(a - 0.35), 48 + 34 * Math.sin(a - 0.35)); x.stroke(); } }
    else if (kind === 'leaf') { x.fillStyle = '#3f9a4f'; x.beginPath(); x.moveTo(10, 84); x.bezierCurveTo(10, 30, 50, 8, 88, 10); x.bezierCurveTo(88, 52, 62, 86, 10, 84); x.fill(); x.stroke(); x.lineWidth = 3; x.beginPath(); x.moveTo(10, 84); x.lineTo(70, 26); x.stroke(); }
    else if (kind === 'flame') { x.fillStyle = '#e8641c'; x.beginPath(); x.moveTo(48, 6); x.bezierCurveTo(60, 30, 84, 44, 78, 68); x.bezierCurveTo(74, 90, 22, 90, 18, 68); x.bezierCurveTo(14, 50, 30, 46, 32, 30); x.bezierCurveTo(40, 36, 44, 22, 48, 6); x.fill(); x.stroke(); x.fillStyle = '#f7d23a'; x.beginPath(); x.moveTo(48, 40); x.bezierCurveTo(56, 54, 66, 60, 62, 72); x.bezierCurveTo(58, 84, 38, 84, 34, 72); x.bezierCurveTo(32, 62, 44, 56, 48, 40); x.fill(); }
    else if (kind === 'bubble') { x.strokeStyle = '#7a8a10'; x.fillStyle = 'rgba(222,236,90,0.55)'; x.beginPath(); x.arc(48, 48, 30, 0, 6.3); x.fill(); x.stroke(); x.strokeStyle = 'rgba(255,255,255,0.9)'; x.beginPath(); x.arc(48, 48, 20, 3.6, 4.6); x.stroke(); }
    else if (kind === 'ash') { x.fillStyle = 'rgba(30,22,16,0.85)'; x.beginPath(); for (let i = 0; i <= 14; i++) { const a = i / 14 * 6.283, r = 30 + 12 * hash('ash' + i); if (!i) x.moveTo(48 + r * Math.cos(a), 48 + r * Math.sin(a)); else x.lineTo(48 + r * Math.cos(a), 48 + r * Math.sin(a)); } x.fill(); }
    else { x.fillStyle = kind === 'sheet' ? '#3a6fd0' : kind === 'ice' ? '#dff1fb' : '#d4e21a'; x.fillRect(0, 0, 96, 96); }
    c.t.needsUpdate = true; ACT.tex[kind] = c.t; return c.t; }
  // one piece: a sprite that always faces the camera (or a flat sheet on the page), alive from t0 for dur ms; at(u, s) places it
  function actPiece(kind, delay, dur, at, flat) { const now = performance.now(); let s; if (flat) { s = flatMesh(flat[0], flat[1], actTex(kind), 0.3); s.material.opacity = 0; s.renderOrder = 4; } else { s = new T.Sprite(new T.SpriteMaterial({ map: actTex(kind), transparent: true, depthTest: false, depthWrite: false })); s.renderOrder = 30; } s.visible = false; scene.add(s); ACT.list.push({ s, t0: now + delay, dur, at }); return s; }
  function actClear() { ACT.list.forEach(q => scene.remove(q.s)); ACT.list = []; }
  function actFrame(now) { if (!ACT.list.length) return; ACT.list = ACT.list.filter(q => { const u = (now - q.t0) / q.dur; if (u < 0) return true; if (u >= 1) { scene.remove(q.s); return false; } q.s.visible = true; q.at(u, q.s); return true; }); dirty = true; }
  function actStart(id) { if (!BENCHV || !center) return; const R0 = Math.random, M = { x: C0.x, z: C0.z }, HP = { x: HOMP.x, z: HOMP.z }, RP = SAFE ? SAFE.R : { x0: 0, x1: 30, z0: -20, z1: 18 }, fade = u => (u < 0.15 ? u / 0.15 : u > 0.7 ? (1 - u) / 0.3 : 1), cards = []; BT.map.forEach((b, cid) => cards.push({ id: cid, x: b.x, z: b.z }));
    const fly = (kind, n, from, to, o) => { for (let i = 0; i < n; i++) { const a = typeof from === 'function' ? from(i) : from, b = typeof to === 'function' ? to(i) : to, sz = (o.size || 1.6) * (0.7 + 0.6 * R0()), up = (o.up == null ? 6 : o.up) * (0.6 + 0.8 * R0()), sp = o.spread || 0, bx = b.x + (R0() - 0.5) * sp, bz = b.z + (R0() - 0.5) * sp, rot = (R0() - 0.5) * (o.rot || 0); actPiece(kind, (o.delay || 0) + i * (o.gap || 20) + R0() * (o.jit || 0), o.dur || 800, (u, s) => { const e = o.ease ? u * u : u, h = o.stay ? Math.min(1, u / (1 - o.stay)) : e; s.position.set(a.x + (bx - a.x) * h, (o.y0 || 2.5) + up * Math.sin(Math.PI * Math.min(1, h)) + (o.rise || 0) * u, a.z + (bz - a.z) * h); const g2 = o.grow ? 1 + o.grow * u : 1; s.scale.set(sz * g2, sz * g2, 1); s.material.opacity = o.keep ? Math.min(1, (1 - u) * 6) : fade(u); s.material.rotation = rot * (1 + u); }); } };
    if (id === 'water') { actPiece('sheet', 0, 2300, (u, s) => { s.position.set((RP.x0 + RP.x1) / 2, 0.3, (RP.z0 + RP.z1) / 2 - 20 * (1 - Math.min(1, u * 3)) * 0); s.scale.z = Math.min(1, u * 3.2); s.position.z = RP.z1 - (RP.z1 - RP.z0) * s.scale.z / 2; s.material.opacity = 0.42 * (u > 0.75 ? (1 - u) / 0.25 : 1); }, [RP.x1 - RP.x0, RP.z1 - RP.z0]);
      fly('drop', 46, i => ({ x: M.x + (R0() - 0.5) * 12, z: M.z + (R0() - 0.5) * 8 }), i => ({ x: M.x + (R0() - 0.5) * 30, z: M.z + (R0() - 0.5) * 22 }), { size: 1.9, up: 9, dur: 900, delay: 180, gap: 14, rot: 2 }); fly('puff', 10, i => ({ x: RP.x0 + 3 + i * 2.8, z: RP.z1 - 2 }), i => ({ x: RP.x0 + 3 + i * 2.8, z: RP.z0 + 4 }), { size: 4.2, up: 1, dur: 800, gap: 30, y0: 1 }); }
    else if (id === 'h2') { fly('ypuff', 14, HP, i => ({ x: HP.x + (R0() - 0.5) * 9, z: HP.z + (R0() - 0.5) * 5 }), { size: 1.6, up: 3, dur: 700, grow: 0.8 }); fly('ypuff', 12, M, i => ({ x: RP.x1 - 4 + (R0() - 0.5) * 4, z: RP.z0 + 5 }), { size: 1.2, up: 8, dur: 1300, delay: 300, gap: 70 }); }
    else if (id === 'co2') { fly('puff', 34, HP, i => ({ x: RP.x0 + R0() * (RP.x1 - RP.x0 + 14), z: RP.z0 + R0() * 26 }), { size: 5, up: 1.2, dur: 2200, gap: 26, grow: 0.9, y0: 1.2 }); actPiece('ice', 300, 2600, (u, s) => { s.position.set((RP.x0 + RP.x1) / 2, 0.3, (RP.z0 + RP.z1) / 2); s.material.opacity = 0.5 * fade(u); }, [RP.x1 - RP.x0, RP.z1 - RP.z0]);
      const shut = cards.filter(c => !g.trail.some(t => !t.free && !t.wasted && !t.bank && t.id === c.id && t.hits > 0)); (shut.length ? shut : cards).forEach((c, k) => fly('frost', 5, i => ({ x: c.x - 4 + i * 2, z: c.z - 6 }), i => ({ x: c.x - 4.4 + i * 2.2, z: c.z + (i % 2 ? 0.8 : -0.8) }), { size: 3.0, up: 0.5, dur: 3000, delay: 500 + k * 160, gap: 60, stay: 0.85, y0: 1.5 })); fly('frost', 16, i => ({ x: M.x + (R0() - 0.5) * 16, z: M.z - 10 }), i => ({ x: M.x + (R0() - 0.5) * 18, z: M.z + (R0() - 0.5) * 12 }), { size: 2.4, up: 0.5, dur: 2600, delay: 400, gap: 40, stay: 0.8, y0: 4 }); }
    else if (id === 'acid') { actPiece('acid', 150, 2200, (u, s) => { s.position.set(M.x, 0.3, M.z + 1); const k = Math.sin(Math.PI * Math.min(1, u * 1.15)); s.scale.set(k, 1, k); s.material.opacity = 0.5 * fade(u); }, [17, 11]); fly('gdrop', 36, M, i => ({ x: M.x + (R0() - 0.5) * 26, z: M.z + (R0() - 0.5) * 18 }), { size: 1.7, up: 7, dur: 800, delay: 200, gap: 22, rot: 3 }); fly('bubble', 22, i => ({ x: M.x + (R0() - 0.5) * 13, z: M.z + (R0() - 0.5) * 8 }), i => ({ x: M.x + (R0() - 0.5) * 13, z: M.z - 4 + (R0() - 0.5) * 8 }), { size: 1.5, up: 2, dur: 900, delay: 300, gap: 55, grow: 0.8, y0: 3 }); fly('smoke', 12, M, i => ({ x: M.x + (R0() - 0.5) * 12, z: M.z - 12 }), { size: 3, up: 1, dur: 1500, delay: 700, gap: 70, grow: 1, y0: 5 }); }
    else if (id === 'wood') { fly('bdrop', 26, HP, i => { const c = cards[i % Math.max(1, cards.length)] || M; return { x: c.x - 3, z: c.z }; }, { size: 1.5, up: 8, dur: 900, delay: 100, gap: 50, spread: 5, rot: 3 }); fly('bubble', 12, HP, i => ({ x: HP.x + (R0() - 0.5) * 8, z: HP.z - 5 }), { size: 1.2, up: 2, dur: 1000, gap: 110, grow: 0.6 }); }
    else if (id === 'salt') { fly('grain', 70, i => ({ x: M.x + (R0() - 0.5) * 22, z: M.z - 16 + (R0() - 0.5) * 6 }), i => ({ x: M.x + (R0() - 0.5) * 22, z: M.z + (R0() - 0.5) * 14 }), { size: 1.3, up: 0, y0: 2, dur: 2200, delay: 150, gap: 16, stay: 0.72, rot: 1.5 }); cards.forEach((c, k) => { if ((g.queue || []).length || true) fly('grain', 5, i => ({ x: c.x - 4 + i * 2, z: c.z - 12 }), i => ({ x: c.x - 4 + i * 2, z: c.z }), { size: 1.2, up: 0, dur: 2000, delay: 400 + k * 90, gap: 40, stay: 0.7, y0: 2 }); }); }
    else if (id === 'slime') { const stuck = (g.hom && g.hom.stuck) || [], tg = cards.filter(c => stuck.includes(c.id)); (tg.length ? tg : cards.slice(0, 2)).forEach((c, k) => { fly('goo', 9, HP, i => ({ x: c.x + 3.2, z: c.z - 0.6 }), { size: 1.6, up: 9, dur: 600, delay: k * 220, gap: 34, spread: 1 }); fly('goo', 4, i => ({ x: c.x + 3.2, z: c.z - 0.8 }), i => ({ x: c.x + 3.2 + (i - 1.5) * 1.3, z: c.z - 0.2 + (i % 2) * 0.9 }), { size: 3.4, up: 0.2, dur: 3600, delay: 600 + k * 220, gap: 10, stay: 0.9, y0: 2.2 }); }); fly('goo', 16, HP, i => ({ x: M.x + (R0() - 0.5) * 14, z: M.z + (R0() - 0.5) * 9 }), { size: 1.8, up: 8, dur: 800, delay: 100, gap: 40 }); }
    else if (id === 'ammonia') { for (let i = 0; i < 26; i++) { const a = i / 26 * 6.283; fly('puff', 1, { x: M.x, z: M.z + 3 }, { x: M.x + 17 * Math.cos(a), z: M.z + 3 + 11 * Math.sin(a) }, { size: 3.4, up: 2, dur: 1200, delay: 250 + (i % 3) * 120, grow: 1.2, y0: 3 }); } fly('puff', 10, HP, { x: M.x, z: M.z + 5 }, { size: 2, up: 5, dur: 500, gap: 26 }); }
    else if (id === 'seedling') { for (let v = 0; v < 6; v++) { const a0 = { x: HP.x, z: HP.z + 1 }, mid = { x: (HP.x + M.x) / 2 + (v - 2.5) * 5, z: (HP.z + M.z) / 2 - 2 + (v % 2) * 5 }, a1 = { x: M.x + 13 * Math.cos(v * 1.05 + 0.4), z: M.z + 8 * Math.sin(v * 1.05 + 0.4) }; for (let i = 0; i < 12; i++) { const t = (i + 1) / 12, px0 = (1 - t) * (1 - t) * a0.x + 2 * t * (1 - t) * mid.x + t * t * a1.x, pz0 = (1 - t) * (1 - t) * a0.z + 2 * t * (1 - t) * mid.z + t * t * a1.z, rot = (i % 2 ? 1 : -1) * 0.9 + v; actPiece('leaf', 80 + v * 60 + i * 55, 3000 - i * 55, (u, s) => { const k = Math.min(1, u * 9), b = 1 + 0.25 * Math.sin(Math.PI * Math.min(1, u * 9)); s.position.set(px0, 2.6, pz0); s.scale.set(2.3 * k * b, 2.3 * k * b, 1); s.material.opacity = u > 0.85 ? (1 - u) / 0.15 : 1; s.material.rotation = rot + 0.15 * Math.sin(u * 30 + i); }); } } }
    else if (id === 'brimstone') { const SP = SHP ? { x: SHP.round.x + 3, z: SHP.round.z - 5 } : M, LP = SAFE ? SAFE.L : RP; actPiece('ash', 500, 6000, (u, s) => { s.position.set(SP.x, 0.3, SP.z); const k = Math.min(1, u * 8); s.scale.set(k, 1, k); s.material.opacity = 0.75 * (u > 0.9 ? (1 - u) / 0.1 : 1); }, [12, 9]);
      for (let i = 0; i < 44; i++) { const t = i / 44, fx = HP.x + (SP.x - HP.x) * t + (R0() - 0.5) * 5, fz = HP.z + 3 + (SP.z - HP.z - 3) * t + (R0() - 0.5) * 4, sz = 3 + 3.5 * R0(); actPiece('flame', t * 600 + R0() * 80, 1500 + 600 * t, (u, s) => { s.position.set(fx + 0.3 * Math.sin(u * 40 + i), 2.4 + 2.5 * u, fz - 1.5 * u); const fl = 1 + 0.25 * Math.sin(u * 50 + i * 2); s.scale.set(sz * fade(u) * (0.8 + 0.2 * fl), sz * fade(u) * fl, 1); s.material.opacity = Math.min(1, (1 - u) * 3); }); }
      fly('flame', 26, SP, i => ({ x: SP.x + (R0() - 0.5) * 16, z: SP.z + (R0() - 0.5) * 11 }), { size: 4.5, up: 2, dur: 1700, delay: 600, gap: 34, y0: 2.5 }); fly('smoke', 14, SP, i => ({ x: SP.x + (R0() - 0.5) * 10, z: SP.z - 12 }), { size: 3.4, up: 1, dur: 1800, delay: 1100, gap: 80, grow: 1, y0: 5 }); }
  }
  let REFB = null;
  // the homunculus taken into the run stands beside the molecule
  const HOMP = BENCHV ? (BENCHV === 'a' ? { x: BNZ.hom.x, z: BNZ.hom.z } : { x: -39, z: 6 }) : { x: 14.6, z: -10.6 }; let homObj = null, homObjs = [], homOpts = [];
  function homStand() { if (homObj) { scene.remove(homObj.grp); homObj = null; } if (!run || !run.hom) return; const hst = homStageNow(run.hom), grp = homFig(run.hom, hst), hold = new T.Group(); hold.add(grp); hold.rotation.x = -0.8; hold.scale.setScalar(BENCHV ? 2.2 : 1.9); if (BENCHV) { const sh = flatMesh(1.9, 0.8, softShadow(), 0); sh.rotation.x = 0.8; sh.position.set(0.1, 0.02, 0.1); sh.renderOrder = 2; hold.add(sh); } hold.position.set(HOMP.x, 0, HOMP.z); hold.visible = false; scene.add(hold); homObj = { id: run.hom, grp: hold }; if (BENCHV === 'a') { const bb = new T.Box3().setFromObject(grp); homObj.h0 = bb.max.y; homObj.s = Math.min(BNZ.hom.s * 1.15, BNZ.hom.h / Math.max(0.5, bb.max.y), BNZ.hom.w / Math.max(0.5, bb.max.x - bb.min.x)); if (hst) homObj.s *= AA.rxKit.stageSize(hst) * (hst < 3 ? 1.15 : hst >= 5 ? 0.92 : 1); } homObj.stage = hst; }   /* (builder 14) every creature stands about as tall as the row allows: 9 units high, never wider than 10 */
  // where a thing that has left the molecule is collected, by its kind. Everything that flies off goes here
  function byTarget(kind, from) { if (P.RULE.bare) return new T.Vector3(from && isFinite(from.x) && center ? C0.x + from.x * center.group.scale.x : C0.x, 3, -24); const j = JARK.includes(kind) ? jarPos(kind) : null; return j ? new T.Vector3(j.x, 2.0 * j.s / 1.2, j.z - 2.3 * j.s / 1.2) : new T.Vector3(TALLY.x, 1.2, TALLY.z - 0.6); }
  // Ways of saying what the things on the page are, tried with ?name= on the page:
  //   point: in a first round, an inked arrow and a few words point at one thing at a time as it first matters
  //   words: one or two pencil words by each thing, always.  hover: its name and a line under the pointer.
  //   fewer: no names, fewer things: no tally, no page numbers, beaker and balloon only once they hold something,
  //          and the three numbers small on one line under the count
  const NAMEV = (() => { try { return new URLSearchParams(root.location.search).get('name') || 'both'; } catch (e) { return 'both'; } })(), FEWER = NAMEV === 'fewer';
  // each thing: where it is, how near the pointer must be, its name, one line, and where a word for it is written
  const zones = () => [
    { id: 'water', x: BEAK.x, z: BEAK.z - 0.8, r: 2.2, name: 'water', line: '', lx: BEAK.x, lz: BEAK.z + 2.7 },
    { id: 'h2', x: BALN.x, z: BALN.z - 1.2, r: 2.2, name: 'hydrogen', line: '', lx: BALN.x, lz: BALN.z + 2.7 },
    { id: 'tally', x: TALLY.x + 1, z: TALLY.z - 0.9, r: 1.8, name: 'left', line: '', lx: TALLY.x + 1, lz: TALLY.z + 1.1 },
    { id: 'pages', x: PAGES.x + 1.8, z: PAGES.z, r: 2.4, name: 'page', line: '', lx: PAGES.x + 1.8, lz: PAGES.z - 1.5 },
    { id: 'steps', x: STEP.x + 2.5, z: STEP.z, r: 3, name: 'reactions', line: '', lx: STEP.x + 9.4, lz: STEP.z + 0.4 },
    { id: 'made', x: EDGE + 3.4, z: MADE.z - 1.4, r: 3.4, name: 'made', line: '', lx: EDGE + 12, lz: MADE.z - 0.4 },
    { id: 'p', x: MULT.x + 2.2, z: BAND - 1, r: 2.1, name: 'places', line: '', lx: MULT.x + 2.2, lz: BAND + 1.5 },
    { id: 'r', x: MULT.x + 6.9, z: BAND - 1, r: 2.1, name: 'row', line: '', lx: MULT.x + 6.9, lz: BAND + 1.5 },
    { id: 'e', x: MULT.x + 11.6, z: BAND - 1, r: 2.1, name: 'extra', line: '', lx: MULT.x + 11.6, lz: BAND + 1.5 },
    { id: 'beat', x: -8.8, z: 10.6, r: 2.2, name: 'to beat', line: '', lx: FLASK.x - 3.6, lz: BEAT.z },
    { id: 'bank', x: BANK.x, z: BANK.z, r: 2.3, name: 'bank', line: '', lx: BANK.x, lz: BANK.z + 2 },
    { id: 'draw', x: DRAW.x + 1.6, z: DRAW.z, r: 2.6, name: 'redraw', line: '', lx: DRAW.x, lz: DRAW.z + 2 },
    { id: 'choices', x: 16.8, z: -9.6, r: 0, name: 'reactions', line: '', lx: 16.8, lz: -12.3 }
  ];
  // the first round: what is pointed at, in order, each once the page has reached it
  const TEACH = [];
  const TEACH_OLD = [
    { z: 'choices', say: 'pick three', when: () => true },
    { z: 'made', say: 'made', when: () => g.trail.length >= 1 },
    { z: 'beat', say: 'beat this', when: () => g.trail.length >= 1 && st.shown < st.quota },
    { z: 'r', say: 'row', when: () => g.cur.path.length >= 2 },
    { z: 'pages', say: 'three pages', when: () => g.page >= 2 }
  ];
  const clearKit = () => { if (BENCHV && st.mode !== 'shop' && st.mode !== 'hom') return; kitObjs.forEach(k => scene.remove(k.grp)); kitObjs = []; if (kitShelf) { scene.remove(kitShelf); kitShelf = null; } };

  // what stands on the page: one slot for each reagent on offer, and on the last page one for the finishing reagent
  function refresh() {
    prods.forEach(freeMol); prods = []; slots = [];
    const live = st.mode === 'play' && !g.over, fork = live && g.chain, lining = live && !fork && P.RULE.queue && !g.shot, view = lining ? P.queueView(g) : null, o = view ? view.o : live ? P.options(g, fork) : {};
    st.view = view;
    if (fork) Object.keys(o).forEach(id => { if (!o[id].cont) delete o[id]; });
    g.kinds.forEach((id, i) => { slots[i] = { id, o: o[id] || null }; });
    const fin = view ? (view.fin && !g.queue.includes(P.SYN.finish) ? view.fin : null) : live && !fork && g.pageSteps < P.stepsOf(g) ? P.finishOpt(g) : null; slots[FIN] = fin ? { id: fin.id, o: fin, fin: true } : null;
    { const ids = []; slots.forEach((q, i) => { if (q) ids.push(i); }); const n = ids.length, step = Math.min(10, 44 / Math.max(1, n)); SLOTW = step; LABF = Math.min(50, step * 5.4);
      ids.forEach((i, k) => { const x = (k - (n - 1) / 2) * step; SPOT[i] = { x, z: -7.4 }; LAB[i] = { x, z: -12.9 }; SCS[i] = Math.min(0.88, 0.09 * step); });
      if (SIDE) { const gap = Math.min(3.9, 18.6 / Math.max(1, n)); SLOTW = gap; LABF = 40; ids.forEach((i, k) => { const z = -7.4 + k * gap + gap / 2; SPOT[i] = { x: 22.6, z }; LAB[i] = { x: 20.0, z }; SCS[i] = 0.4; }); reagE(ids); } }
    slots.forEach((s, i) => {
      if (!s || !s.o) return;
      s.o.model.settle(FOLDS[s.id] ? 2200 : 160);
      const rings = new Map(), c = rgb(colOf(s.id)); s.o.r.made.forEach(a => rings.set(a, c));
      const m = buildMol(s.o.model, rings, true); m.col = c; SCS[i] = SIDE ? Math.max(0.14, Math.min(0.3, 3.4 / spanOf(m))) : Math.max(0.3, Math.min(1.05, (SLOTW - 1.6) / spanOf(m))); if (P.RULE.queue && SIDE) m.group.visible = false; place(m, SPOT[i], 0.01); tween(m, SPOT[i], SCS[i], 0.16 + (i % 7) * 0.03); prods[i] = m;
    });
    bottleSync();
    st.hover = -1; setHover(-1); dirty = true;
  }
  function clearRound() { actClear(); bottlesClear(); clearBench(); st.flyers.forEach(f => scene.remove(f.grp)); st.flyers = []; morph = null; st.pending = null; st.strokes = []; st.peek = null; st.willFire = null; tweens = []; prods.forEach(freeMol); prods = []; slots = []; freeMol(center); center = null; rowMols.forEach(freeMol); rowMols = []; }
  // the next round of the run: a molecule, the equipment held, and a number to beat
  function load() {
    st.tok++; st.pinned = false; st.pin0 = null; st.pinK = 0; st.splats = []; st.specMetT = []; st.specWas = []; st.ypass = false; st.mode = 'play'; st.firing = false; st.starting = false; st.rezip = false; st.tool = null; st.toolList = null; st.toolSpot = null; st.view = null; st.paid = ''; st.shown = 0; st.gains = []; st.passT = []; st.needT = 0; st.pass = false; st.won = false; st.pageStart = 0; st.floats = []; st.blots = []; st.pings = []; st.slashes = []; st.fury = 0; st.call = null; st.over = 0;
    clearRound(); clearBriefs(); clearPicks();
    st.stains = []; st.homPre = false; st.homWait = false; st.homList = null; st.homSpot = null; st.homHover = false; st.homAct = null; st.homNone = false; st.puddles = []; if ((homObj ? homObj.id : null) !== (run.hom || null)) homStand(); st.gear = run.gear.slice(); st.fired = {}; st.want = 0; st.mult = 1; st.P = 0; st.R = 1; st.E = 1; buildKit();
    g = P.runBegin(run, run.feed, true); st.quota = run.quota; st.E = g.E; st.R = g.R;
    musN('round', (run && run.round) || 1); musN('state', 'plan'); if (AA.rxFeel && AA.rxFeel.reset) AA.rxFeel.reset();
    laneSet(); setAlign(g.m); center = buildMol(g.m, null); if (center.fl) flHome(center, true); SC_MAIN = fitMain(center); place(center, C0, 0.01); tween(center, C0, SC_MAIN, 0.3); st.sc = SC_MAIN; center.groups = groupsOf(center); center.ghosts = []; st.by = Object.assign({}, g.by);
    refresh(); sfx.feed();
    startPage();
  }
  // between rounds: three things on the page, take one
  // coins on the take-one page: the three dealt again, all three left for a coin, a held piece removed
  const REROLL = { x: -3.4, z: 11.6 }, SKIP = { x: 9, z: 11.6 }, PURSE = { x: -17, z: 12 }, HELD = i => ({ x: 10 + i * 3.3, z: -10.2 });
  function pickMark() { if (BENCHV && st.mode === 'pick') return (shopB && shopB.last && shopB.last.mark) || ''; if (!P.RULE.coins || st.mode !== 'pick') return ''; if (hit.x > REROLL.x - 1.6 && hit.x < REROLL.x + 5.4 && Math.abs(hit.z - REROLL.z) < 1.8) return 'reroll'; if (hit.x > SKIP.x - 2.2 && hit.x < SKIP.x + 4.6 && Math.abs(hit.z - SKIP.z) < 1.8) return 'skip'; for (let i = 0; i < run.gear.length; i++) { const q = HELD(i); if (Math.abs(hit.x - q.x) < 1.6 && hit.z > q.z - 3.2 && hit.z < q.z + 1.6) return 'bin' + i; } return ''; }
  function doReroll() { if (st.mode !== 'pick') return; if (BENCHV && shopB) { const o = shopObj('bell'); if (!o || shopB.take || shopB.pend) return; if ((run.coins || 0) < P.rerollCost(run)) return shopBad(o); shopFly({ x: GP.x, z: GP.z }, { x: o.x - 3.4, z: o.z + 1.6 }, P.rerollCost(run)); o.ringT = performance.now() + 420; sfxN('redraw'); shopB.pend = { t: performance.now() + 1150, f: () => { const n = P.runReroll(run); if (n) { st.drawT = performance.now(); showPicks(n); } } }; return; } const n = P.runReroll(run); if (!n) { sfx.bad(); return; } st.drawT = performance.now(); st.coinT = performance.now(); sfxN('gold'); showPicks(n); }
  function doSkip() { if (st.mode !== 'pick' || !P.RULE.coins) return; if (BENCHV && shopB) { const o = shopObj('door'); if (!o || shopB.take || shopB.pend) return; o.openT = performance.now(); sfxN('click'); GP.src = { x: o.x, y: 1.4, z: o.z - 1.1 }; shopB.pend = { t: performance.now() + 900, f: () => { P.runSkip(run); sfxN('gold'); showBriefs(); } }; return; } P.runSkip(run); st.coinT = performance.now(); sfx.stamp(); showBriefs(); }
  function doBin(i) { const id = run.gear[i]; if (st.mode !== 'pick' || !id) return; if (!P.runBin(run, id)) { sfx.bad(); return; } st.coinT = performance.now(); sfx.stamp(); st.shake = 0.5; showPicks(picks); }
  // THE SHOP ON THE BENCH (between rounds). What is offered stands on the bench beside the page: a reagent as its note card with its bottle, an
  // instrument as itself. Taking one of the three costs nothing, so nothing stands by them; what does cost (the bell that deals three more, the extra
  // bottle on the far bench) has its price beside it as a small stack of gold; the door (leave them all) has the coin it pays standing in it.
  // The page keeps to what a chemist draws: for the thing under the pointer, what it does, acted in a loop.
  let shopB = null; const SHOPX = 40.3; const SHOPV = (() => { try { const v = new URLSearchParams(root.location.search).get('shopv'); return v === 'a' || v === 'b' || v === 'c' ? v : v === null && SHAPE === 'a' ? 'b' : ''; } catch (e) { return ''; } })(), SHOPSEL = (() => { try { const v = new URLSearchParams(root.location.search).get('shopsel'); return v === null ? -1 : +v; } catch (e) { return -1; } })();
  function shopClear() { if (!shopB) return; if (shopB.dress) scene.remove(shopB.dress); shopB.objs.forEach(o => { scene.remove(o.grp); o.coins.forEach(c => scene.remove(c)); }); shopB.fly.forEach(c => scene.remove(c.m)); shopB = null; }
  const stdm = (c, r, m) => new T.MeshStandardMaterial({ color: lin(c), roughness: r, metalness: m || 0 });
  function bellMesh() { const g0 = new T.Group(), h = new T.Group(); const base = new T.Mesh(new T.CylinderGeometry(1.75, 1.9, 0.35, 24), stdm(0x2a211c, 0.7)); base.position.y = 0.18; h.add(base); const dome = new T.Mesh(new T.SphereGeometry(1.5, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), stdm(0xe0ae3c, 0.28, 0.75)); dome.position.y = 0.35; h.add(dome); const edge = new T.Mesh(new T.SphereGeometry(1.5, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshBasicMaterial({ color: lin(0x4a3208), side: T.BackSide })); edge.scale.setScalar(1.06); edge.position.y = 0.33; h.add(edge); const btn = new T.Mesh(new T.CylinderGeometry(0.26, 0.26, 0.6, 12), stdm(0x2a211c, 0.5)); btn.position.y = 2.05; h.add(btn); h.rotation.x = -0.7; h.scale.setScalar(1.7); g0.add(h); const sh = flatMesh(6, 4.4, softShadow(), 0.02); sh.position.set(0.5, 0.02, 0.5); g0.add(sh); g0.userData.body = h; return g0; }
  function doorMesh() { const g0 = new T.Group(), h = new T.Group(), wood = stdm(0x6b4526, 0.75), dark = stdm(0x2c1b0f, 0.8); [[-1.75, 2.6, 0.5, 5.2], [1.75, 2.6, 0.5, 5.2]].forEach(q => { const m = new T.Mesh(new T.BoxGeometry(q[2], q[3], 0.6), dark); m.position.set(q[0], q[1], 0); h.add(m); }); const top = new T.Mesh(new T.BoxGeometry(4, 0.5, 0.6), dark); top.position.set(0, 5.3, 0); h.add(top); const back = new T.Mesh(new T.BoxGeometry(3, 5, 0.1), new T.MeshBasicMaterial({ color: lin(0x0c0806) })); back.position.set(0, 2.55, -0.2); h.add(back);
    const hinge = new T.Group(); hinge.position.set(-1.5, 0, 0.15); const panel = new T.Mesh(new T.BoxGeometry(3, 5, 0.25), wood); panel.position.set(1.5, 2.55, 0); hinge.add(panel); [[1.5, 3.7], [1.5, 1.4]].forEach(q => { const p = new T.Mesh(new T.BoxGeometry(2.1, 1.6, 0.08), stdm(0x7d5530, 0.7)); p.position.set(q[0], q[1], 0.16); hinge.add(p); }); const knob = new T.Mesh(new T.SphereGeometry(0.24, 10, 8), stdm(0xe0ae3c, 0.3, 0.7)); knob.position.set(2.6, 2.5, 0.3); hinge.add(knob); h.add(hinge); h.rotation.x = -0.8; h.scale.setScalar(1.6); g0.add(h); const sh = flatMesh(6.5, 5, softShadow(), 0.02); sh.position.set(0.5, 0.02, -1.6); g0.add(sh); g0.userData.body = h; g0.userData.hinge = hinge; return g0; }
  function shopBuild() {
    shopClear(); const now = performance.now(); shopB = { objs: [], fly: [], t0: now, take: null, bad: null, pend: null, hov: '' };
    const mk = (kind, x, z, grp, base, extra) => { const o = Object.assign({ kind, x, z, grp, base, born: now + 260 + shopB.objs.length * 190, coins: [], price: 0 }, extra || {}); grp.position.set(x, 0, z); grp.visible = false; scene.add(grp); shopB.objs.push(o); return o; };
    const card = id => { const b = bottleMake(id); b.draw(b.tx.x, id, true, b.W, b.H, -1); b.tx.t.needsUpdate = true; if (b.btx) { bottleDraw(b.btx.x, id, true, 240, 388, true); b.btx.t.needsUpdate = true; } card.last = b; return b.grp; };
    picks.forEach((p, i) => { let grp = null, base = 1.3, gear = p.kind === 'gear' || p.kind === 'level'; try { if (gear) { const k = piece(p.id); grp = k.grp; base = kitCm(p.id).map((c, j) => c * UCM / (j ? k.ph : k.pw)).reduce((a, b) => Math.min(a, b)) * 1.9; base = Math.min(base, 14.5 / k.pw, 15 / k.ph); } else grp = card(p.id); } catch (e) { grp = new T.Group(); } const o = mk('offer', 46 + i * 17, gear ? 1.5 : -1, grp, base, { i, p, gear }); });
    if (P.RULE.coins) {
      if (run.shelf && P.offerBuy && TILE[run.shelf.id]) { try { mk('shelf', 78, -22, card(run.shelf.id), 1.05, { price: run.shelf.price, id: run.shelf.id }); } catch (e) { /* no card */ } }
      mk('bell', 54, 15.5, bellMesh(), 1.5, { price: P.rerollCost(run) }); mk('door', 73, 17, doorMesh(), 1.5, { pays: P.COIN.skip });
    }
    shopB.objs.forEach(o => { const n = Math.min(9, o.price || 0), sx = o.kind === 'shelf' ? -10.5 : -6.4, sz = o.kind === 'shelf' ? 1.2 : 1.6; for (let k = 0; k < n; k++) { const c = coinMesh(); c.scale.setScalar(1); c.position.set(o.x + sx + (k % 2 ? 0.16 : 0), 0.15 + k * 0.31, o.z + sz); c.visible = false; scene.add(c); o.coins.push(c); }
      if (o.pays) { const c = coinMesh(); c.scale.setScalar(0.9); c.position.set(o.x + 0.3, 3.2, o.z - 3.4); c.rotation.x = Math.PI / 2 - 0.5; c.visible = false; scene.add(c); o.coins.push(c); o.payCoin = c; } });
    if (SHOPV) shopDress();
    sfxN('shopOpen');
  }
  const shopObj = kind => shopB && shopB.objs.find(o => o.kind === kind);
  const shopFly = (from, to, n, gap) => { const now = performance.now(); for (let k = 0; k < n; k++) { const m = coinMesh(); m.scale.setScalar(0.8); m.visible = false; scene.add(m); shopB.fly.push({ m, t0: now + k * (gap || 110), dur: 520, from, to }); } };
  function shopBad(o) { shopB.bad = { o, t: performance.now() }; sfxN('cantBuy'); sfx.bad(); }
  function shopShelf() { const o = shopObj('shelf'); if (!o || shopB.take || o.sold) return; if ((run.coins || 0) < o.price) return shopBad(o); shopFly({ x: GP.x, z: GP.z }, { x: o.x - 10.5, z: o.z + 1.2 }, o.price); if (!P.offerBuy(run, o.id)) return; sfxN('buy'); sfxN('gold'); o.sold = performance.now(); o.to = { x: SHOPX, z: 20 }; }
  function shopFrame(now) {
    if (!shopB) return; const tk = shopB.take, sm = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
    const hk = st.hover >= 0 ? 'o' + st.hover : (st.mark || ''); if (hk !== shopB.hov) { shopB.hov = hk; if (hk) sfxN('hover'); }
    shopB.objs.forEach(o => { const age = now - o.born, u = Math.max(0, Math.min(1, age / 450)), hov = (o.kind === 'offer' && st.hover === o.i) || (o.kind === 'bell' && st.mark === 'reroll') || (o.kind === 'door' && st.mark === 'skip') || (o.kind === 'shelf' && st.mark === 'shelf'); o.grp.visible = age >= 0 && !o.hide;
      o.hk = (o.hk || 0) + ((hov && !tk ? 1 : 0) - (o.hk || 0)) * 0.2; let y = u < 1 ? (1 - u) * (1 - u) * 9 : 0, s = o.base * (1 + (o.kind === 'offer' ? 0.14 : 0.12) * o.hk), x0 = o.x, z0 = o.z; o.grp.renderOrder = hov ? 20 : 0; if (o.hk > 0.02) y += 1.2 * o.hk; if (hov && !tk) y += 0.35 + 0.2 * Math.sin(now / 170); if (o.gear && hov) o.grp.rotation.y = 0.5 * Math.sin(now / 420); else if (o.gear) o.grp.rotation.y *= 0.9;
      if (SHOPV === 'b' && o.kind === 'offer') { const mine = tk && o === tk.o && now - tk.t0 > 520; o.hide = !mine; o.grp.visible = !!mine; if (mine) { const u = Math.max(0, Math.min(1, (now - tk.t0 - 520) / 800)), e = 1 - Math.pow(1 - u, 3); x0 = tk.to.x + 30 * (1 - e); z0 = tk.to.z; y = u < 0.72 ? 5.5 * (1 - (u / 0.72) * (u / 0.72)) : 0.55 * Math.sin((u - 0.72) / 0.28 * Math.PI) * (1 - (u - 0.72) / 0.28); s = o.base * tk.sc; if (u >= 0.72 && !tk.thud) { tk.thud = true; sfxN('click'); sfxN('buy'); st.shake = 0.35; } } }
      else if (tk && o.kind === 'offer') { const el = now - tk.t0; if (o === tk.o) { const e = sm(el / 850); x0 = o.x + (tk.to.x - o.x) * e; z0 = o.z + (tk.to.z - o.z) * e; y = 6 * Math.sin(Math.PI * e); s = o.base * (1 + (tk.sc - 1) * e); } else s = o.base * Math.max(0.001, 1 - sm((el - 120) / 380)); }
      if (o.sold) { const e = sm((now - o.sold - 350) / 800); x0 = o.x + (o.to.x - o.x) * e; z0 = o.z + (o.to.z - o.z) * e; y = 7 * Math.sin(Math.PI * e); if (e >= 1) o.grp.visible = false; }
      o.grp.position.set(x0, y + (o.y0 || 0), z0); o.grp.scale.setScalar(s);
      if (o.kind === 'bell') { const t = o.ringT ? (now - o.ringT) / 1000 : 9; o.grp.userData.body.rotation.z = t < 1.2 ? 0.3 * Math.sin(t * 46) * Math.exp(-t * 4.5) : 0; }
      if (o.kind === 'door') { const t = o.openT ? sm((now - o.openT) / 520) : hov ? 0.12 : 0; o.grp.userData.hinge.rotation.y = -1.75 * t; }
      const bad = shopB.bad && shopB.bad.o === o && now - shopB.bad.t < 520 ? Math.sin((now - shopB.bad.t) / 26) * 0.45 * (1 - (now - shopB.bad.t) / 520) : 0;
      o.coins.forEach((c, k) => { c.visible = SHOPV !== 'b' && age >= 250 + k * 70 && !o.sold && !(o.payCoin === c && o.openT && now - o.openT > 300); if (c !== o.payCoin) c.position.x = o.x + (o.kind === 'shelf' ? -10.5 : -6.4) + (k % 2 ? 0.16 : 0) + bad * 2; else c.rotation.z = now / 500; }); });
    shopB.fly = shopB.fly.filter(q => { const u = (now - q.t0) / q.dur; if (u < 0) return true; if (u >= 1) { scene.remove(q.m); sfxN('coin'); return false; } const e = u * u * (3 - 2 * u); q.m.visible = true; q.m.position.set(q.from.x + (q.to.x - q.from.x) * e, 0.3 + 6 * Math.sin(Math.PI * u), q.from.z + (q.to.z - q.from.z) * e); q.m.rotation.x = u * 8; return true; });
    if (shopB.pend && now >= shopB.pend.t) { const p = shopB.pend; shopB.pend = null; p.f(); }
    else if (tk && now - tk.t0 > (SHOPV === 'b' ? 1900 : 1000)) { shopB.take = null; tk.then(); }
  }
  function shopHit(e) { const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); const out = { i: -1, mark: '' }; if (!shopB || !ray.ray.intersectPlane(ground, hit)) return (shopB ? (shopB.last = out) : out); for (const o of shopB.objs) { const card = o.kind === 'offer' || o.kind === 'shelf', hw = card ? 7 * o.base : o.kind === 'offer' ? 7 : 5.4, z0 = card ? o.z - 5.2 * o.base : o.z - 10, z1 = card ? o.z + 4.4 * o.base : o.z + 4; if (Math.abs(hit.x - o.x) < hw && hit.z > z0 && hit.z < z1) { if (o.kind === 'offer') out.i = o.i; else out.mark = o.kind === 'bell' ? 'reroll' : o.kind === 'door' ? 'skip' : 'shelf'; break; } } shopB.last = out; return out; }
  // on the page: what the thing under the pointer does, drawn large and acted over and over
  // (builder 12) THE SHOP, three pictures to choose from (?shopv=a|b|c; the rules of the shop are untouched, only what stands there):
  // a  a delivery crate set down on the bench, lid off, the offers lifted out of its straw; the lid is how it is refused
  // b  the notebook turned to a printed supplier's catalog page, the offers engraved on it, the pick circled in pen; turning the corner refuses
  // c  a pedlar's sample case opened on the bench, lined in velvet, the offers in its places; shutting the lid refuses
  function engrave(src, w, h, lineOnly) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(src, 0, 0, w, h); const d = x.getImageData(0, 0, w, h), a = d.data;
    for (let i = 0; i < w * h; i++) { const X = i % w, Y = (i / w) | 0, r = a[i * 4], g2 = a[i * 4 + 1], b = a[i * 4 + 2], al = a[i * 4 + 3] / 255, l = (0.3 * r + 0.59 * g2 + 0.11 * b) / 255, sat = (Math.max(r, g2, b) - Math.min(r, g2, b)) / 255, dark = (1 - l) + sat * 0.55;
      const k = dark > 0.66 ? 1 : dark > 0.4 ? ((X + Y) % 5 < 2 ? 0.95 : 0.1) : dark > (lineOnly ? 0.1 : 0.2) ? ((X + Y) % 8 < 2 ? 0.85 : 0) : 0; a[i * 4] = 58; a[i * 4 + 1] = 42; a[i * 4 + 2] = 28; a[i * 4 + 3] = 255 * k * al; }
    x.putImageData(d, 0, 0); return c; }
  function snapPiece(grp) { const S = 300, rt = new T.WebGLRenderTarget(S, S), sc2 = new T.Scene(), par = grp.parent, p0 = grp.position.clone(), v0 = grp.visible; sc2.add(new T.HemisphereLight(0xffffff, 0x777777, 1.25)); sc2.add(grp); grp.position.set(0, 0, 0); grp.visible = true; grp.updateMatrixWorld(true);
    const bb = new T.Box3().setFromObject(grp), c = bb.getCenter(new T.Vector3()), sz = bb.getSize(new T.Vector3()), r = Math.max(sz.x, sz.y) * 0.52 + 0.1, oc = new T.OrthographicCamera(-r, r, r, -r, 0.1, 200); oc.position.set(c.x + 6, c.y + 8, c.z + 40); oc.lookAt(c);
    const bg = ren.getClearColor(new T.Color()).clone(); ren.setRenderTarget(rt); ren.setClearColor(0xffffff, 1); ren.clear(); ren.render(sc2, oc); const buf = new Uint8Array(S * S * 4); ren.readRenderTargetPixels(rt, 0, 0, S, S, buf); ren.setRenderTarget(null); ren.setClearColor(bg, 1);
    sc2.remove(grp); grp.position.copy(p0); grp.visible = v0; if (par) par.add(grp); rt.dispose(); const cv2 = document.createElement('canvas'); cv2.width = S; cv2.height = S; const x = cv2.getContext('2d'), im = x.createImageData(S, S); for (let y = 0; y < S; y++) for (let q = 0; q < S * 4; q++) { const v = buf[(S - 1 - y) * S * 4 + q]; im.data[y * S * 4 + q] = (q & 3) === 3 ? 255 : Math.min(255, Math.pow(v / 255, 1 / 2.2) * 255); } x.putImageData(im, 0, 0); return cv2; }
  function shopDress() { const D = new T.Group(); shopB.dress = D; scene.add(D); const door = shopObj('door'), bell = shopObj('bell'), offers = shopB.objs.filter(o => o.kind === 'offer');
    let sd = 4177; const R = () => (sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296, box = (w, h, d, mat, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; D.add(m); return m; };
    const moveCoins = o => o.coins.forEach((c, k) => { if (c === o.payCoin) c.position.set(o.x + 0.3, 3.2 + (o.cy || 0), o.z - 3.4); else c.position.set(o.x - 6.4 + (k % 2 ? 0.16 : 0), 0.15 + k * 0.31, o.z + 1.6); });
    if (SHOPV === 'a') { // the crate, its lid, straw
      const pc = canvasTex(512, 256), px2 = pc.x; px2.fillStyle = '#c59c62'; px2.fillRect(0, 0, 512, 256); for (let i = 0; i < 3; i++) { px2.fillStyle = 'rgba(70,44,18,0.75)'; px2.fillRect(0, i * 85 + 80, 512, 6); px2.fillStyle = 'rgba(255,236,190,0.12)'; px2.fillRect(0, i * 85, 512, 5); } for (let i = 0; i < 260; i++) { px2.strokeStyle = 'rgba(' + (i % 2 ? '94,62,28' : '226,190,132') + ',' + (0.1 + R() * 0.16).toFixed(2) + ')'; px2.lineWidth = 1 + R() * 2; const y0 = R() * 256, x0 = R() * 512; px2.beginPath(); px2.moveTo(x0, y0); px2.lineTo(x0 + 40 + R() * 160, y0 + R() * 4 - 2); px2.stroke(); }
      [[14, 40], [14, 125], [14, 210], [498, 40], [498, 125], [498, 210]].forEach(q => { px2.fillStyle = 'rgba(40,30,22,0.8)'; px2.beginPath(); px2.arc(q[0], q[1], 4, 0, 6.3); px2.fill(); });
      try { px2.globalAlpha = 0.62; AA.rxMarks.yieldMark(px2, 2, 256, 128, 52, { pencil: 'rgba(0,0,0,0)', plw: 0.1, ink: '#2a1c10', lw: 9, t: 1 }); px2.globalAlpha = 1; } catch (e) { /* no marks */ } pc.t.needsUpdate = true;
      const wood = std({ map: pc.t, roughness: 0.85 }), plain = std({ color: lin(0xb48a54), roughness: 0.9 }), CX = 63, CZ = -17.5, W = 34, H = 8.5, Dp = 13;
      box(W, H, 0.7, wood, CX, H / 2, CZ + Dp / 2); box(W, H, 0.7, wood, CX, H / 2, CZ - Dp / 2); box(0.7, H, Dp, wood, CX - W / 2, H / 2, CZ); box(0.7, H, Dp, wood, CX + W / 2, H / 2, CZ); box(W, 0.5, Dp, plain, CX, 0.25, CZ);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(q => box(1.3, H + 0.3, 1.3, plain, CX + q[0] * (W / 2 - 0.3), H / 2, CZ + q[1] * (Dp / 2 - 0.3)));
      const lid = new T.Group(); D.add(lid); const lm = new T.Mesh(new T.BoxGeometry(W + 1, 0.6, Dp + 1), wood); lm.castShadow = true; lm.receiveShadow = true; lid.add(lm); [-10, 10].forEach(q => { const bt = new T.Mesh(new T.BoxGeometry(2.2, 0.5, Dp + 1), plain); bt.position.set(q, 0.5, 0); bt.castShadow = true; lid.add(bt); }); lid.position.set(72.5, 1.5, 16.6); lid.rotation.set(0, 0.1, 0.085); lid.scale.setScalar(0.74);
      const sg = new T.BoxGeometry(0.16, 0.12, 1), sm2 = new T.MeshStandardMaterial({ roughness: 0.9 }), N = 900, im = new T.InstancedMesh(sg, sm2, N), dm = new T.Object3D(), col = new T.Color(); let n = 0;
      const straw = (x, y, z, len, flat) => { if (n >= N) return; dm.position.set(x, y, z); dm.rotation.set((R() - 0.5) * (flat ? 0.25 : 1.1), R() * 6.283, 0); dm.scale.set(1 + R() * 0.8, 1, len); dm.updateMatrix(); im.setMatrixAt(n, dm.matrix); col.setHex([0xe3c66a, 0xd2b055, 0xefd98a, 0xc49d44][(R() * 4) | 0]).convertSRGBToLinear(); im.setColorAt(n, col); n++; };
      for (let i = 0; i < 420; i++) straw(CX + (R() - 0.5) * (W - 2), H - 1.6 + R() * 2.4, CZ + (R() - 0.5) * (Dp - 1.5), 3 + R() * 5);
      for (let i = 0; i < 70; i++) straw(CX + (R() - 0.5) * W, H * (0.4 + R() * 0.6), CZ + Dp / 2 + 0.4 + R() * 0.8, 3 + R() * 4);
      offers.forEach(o => { for (let i = 0; i < 95; i++) { const a = R() * 6.283, r = Math.sqrt(R()); straw(o.x + Math.cos(a) * r * 8.2, 0.1 + R() * 0.7 * (1 - r), o.z + 0.5 + Math.sin(a) * r * 5.6, 2.5 + R() * 4, true); } o.y0 = 0.7; });
      for (let i = 0; i < 110 && n < N; i++) straw(CX + (R() - 0.5) * 44, 0.1, CZ + Dp / 2 + 1 + R() * 9, 2 + R() * 4, true);
      im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.castShadow = true; D.add(im);
      if (door) { door.hide = true; door.x = 73; door.z = 17.6; door.cy = -1.2; moveCoins(door); } }
    else if (SHOPV === 'c') { // the sample case
      const vc = canvasTex(1024, 320), vx = vc.x; vx.fillStyle = '#5a1420'; vx.fillRect(0, 0, 1024, 320); noise(vx, 1024, 320, 16000, 0.16, '20,0,6'); noise(vx, 1024, 320, 9000, 0.1, '230,120,140');
      [0, 1, 2].forEach(i => { const cx = 512 + (i - 1) * 335, g0 = vx.createLinearGradient(0, 40, 0, 290); g0.addColorStop(0, 'rgba(14,0,4,0.62)'); g0.addColorStop(0.2, 'rgba(24,2,8,0.34)'); g0.addColorStop(1, 'rgba(60,8,18,0.22)'); vx.fillStyle = g0; vx.fillRect(cx - 138, 40, 276, 250); vx.strokeStyle = 'rgba(200,110,126,0.5)'; vx.lineWidth = 3; vx.beginPath(); vx.moveTo(cx - 138, 290); vx.lineTo(cx + 138, 290); vx.lineTo(cx + 138, 40); vx.stroke(); vx.strokeStyle = 'rgba(10,0,2,0.6)'; vx.beginPath(); vx.moveTo(cx - 138, 290); vx.lineTo(cx - 138, 40); vx.lineTo(cx + 138, 40); vx.stroke(); });
      vx.strokeStyle = 'rgba(214,170,90,0.75)'; vx.lineWidth = 4; vx.strokeRect(12, 12, 1000, 296); vc.t.needsUpdate = true;
      const lc = canvasTex(1024, 320), lx = lc.x; lx.fillStyle = '#56121e'; lx.fillRect(0, 0, 1024, 320); noise(lx, 1024, 320, 16000, 0.16, '20,0,6'); noise(lx, 1024, 320, 9000, 0.1, '230,120,140'); lx.strokeStyle = 'rgba(214,170,90,0.75)'; lx.lineWidth = 4; lx.strokeRect(12, 12, 1000, 296);
      lx.strokeStyle = 'rgba(28,14,10,0.85)'; lx.lineWidth = 16; [[60, 60, 430, 262], [430, 60, 60, 262], [594, 60, 964, 262], [964, 60, 594, 262]].forEach(q => { lx.beginPath(); lx.moveTo(q[0], q[1]); lx.lineTo(q[2], q[3]); lx.stroke(); });
      lx.fillStyle = '#c9a24e'; lx.fillRect(462, 126, 100, 64); lx.fillStyle = '#5a1420'; try { AA.rxMarks.yieldMark(lx, 3, 512, 160, 20, { pencil: 'rgba(0,0,0,0)', plw: 0.1, ink: '#3a2408', lw: 4, t: 1 }); } catch (e) { /* no marks */ } lc.t.needsUpdate = true;
      const hide = std({ color: lin(0x3b2416), roughness: 0.6 }), brass = std({ color: lin(0xc9a24e), roughness: 0.35, metalness: 0.7 }), velvet = std({ map: vc.t, roughness: 1 }), velvet2 = std({ map: lc.t, roughness: 1 }), CX = 62.6, CZ = 0.2, W = 52, Dp = 17.5, H = 2.2;
      const tray = box(W, H, Dp, [hide, hide, velvet, hide, hide, hide], CX, H / 2, CZ);
      const lid = new T.Group(); D.add(lid); lid.position.set(CX, H, CZ - Dp / 2); lid.rotation.x = 0.42; const lm = new T.Mesh(new T.BoxGeometry(W, 1.7, Dp), [hide, hide, velvet2, hide, hide, hide]); lm.position.set(0, 0.85, -Dp / 2); lm.castShadow = true; lm.receiveShadow = true; lid.add(lm);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(q => { box(2.4, H + 0.2, 2.4, brass, CX + q[0] * (W / 2 - 1.0), H / 2, CZ + q[1] * (Dp / 2 - 1.0)); const cb = new T.Mesh(new T.BoxGeometry(2.4, 1.9, 2.4), brass); cb.position.set(q[0] * (W / 2 - 1.0), 0.85, -Dp / 2 + q[1] * (Dp / 2 - 1.0)); lid.add(cb); });
      [-14, 14].forEach(q => { box(3, 1.5, 0.7, brass, CX + q, H * 0.6, CZ + Dp / 2 + 0.3); const hk = new T.Mesh(new T.BoxGeometry(3, 0.5, 1.6), brass); hk.position.set(q, 1.9, -Dp + 0.2); lid.add(hk); });
      const hd = new T.Mesh(new T.TorusGeometry(3.2, 0.5, 8, 20, Math.PI), hide); hd.rotation.x = Math.PI / 2 - 0.2; hd.position.set(CX, 0.6, CZ + Dp / 2 + 0.6); hd.castShadow = true; D.add(hd);
      offers.forEach(o => { o.y0 = H + 0.05; o.z = o.gear ? 2.6 : 0.4; o.base *= o.gear ? 0.8 : 0.93; });
      if (door) { door.hide = true; door.x = CX + 20; door.z = CZ - Dp / 2 - 6.5; door.cy = 4.6; moveCoins(door); }
      if (bell) { bell.z = 17.5; moveCoins(bell); } }
    else { // the catalog: the offers are plates on the left page; the bell (deal three others) and the corner (leave) are printed on the right page; the things themselves stay out of sight until one is picked
      offers.forEach(o => { o.hide = true; o.x = -16.2; o.z = -11.0 + o.i * 10.4; });
      if (bell) { bell.hide = true; bell.x = 6.5; bell.z = 14.6; moveCoins(bell); bell.coins.forEach(c => { c.visible = false; }); } if (door) { door.hide = true; door.x = 27.5; door.z = 16.5; door.coins.forEach(c => { c.visible = false; }); }
      const sh = shopObj('shelf'); if (sh) { sh.hide = true; sh.x = 19; sh.z = 13.6; sh.coins.forEach(c => { c.visible = false; }); } } }
  // ---- the catalog's plates: line engraving drawn here, in sepia: outlines, hatching by element, a lit side left clear ----
  const SEP = '#3a2a1c'; let ENGR = 0;
  function eball(c, cx, cy, el) { const r = FBALL[el][1], col = ENGR === 2 ? 'rgba(70,72,84,0.95)' : SEP, pap = ENGR === 2 ? '#f6f1e3' : '#ece2c8'; c.save(); c.fillStyle = pap; c.strokeStyle = col; c.lineWidth = 1.7; c.beginPath(); c.arc(cx, cy, r, 0, 6.3); c.fill(); c.stroke(); c.beginPath(); c.arc(cx, cy, r - 0.5, 0, 6.3); c.clip(); c.lineWidth = 0.8;
    const H = (ang, step) => { c.save(); c.translate(cx, cy); c.rotate(ang); for (let t = -r; t <= r; t += step) { c.beginPath(); c.moveTo(-r, t); c.lineTo(r, t); c.stroke(); } c.restore(); };
    if (el === 'C') { H(0.75, 2.2); H(-0.75, 2.2); } else if (el === 'O') H(0, 2.1); else if (el === 'N') H(1.571, 2.1); else if (el === 'Cl') H(0.75, 3.2); else if (el === 'S') { for (let a = -r; a < r; a += 3) for (let b = -r; b < r; b += 3) { c.fillStyle = col; c.fillRect(cx + a + ((b / 3) % 2 ? 1.5 : 0), cy + b, 1.1, 1.1); } }
    c.fillStyle = pap; c.beginPath(); c.arc(cx - r * 0.36, cy - r * 0.4, r * (el === 'H' ? 0.9 : 0.4), 0, 6.3); c.fill(); c.restore(); }
  function ebond(c, ax, ay, bx, by, n) { c.save(); c.strokeStyle = ENGR === 2 ? 'rgba(70,72,84,0.95)' : SEP; c.lineWidth = 2; c.lineCap = 'round'; const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1, nx = -dy / d * 3.4, ny = dx / d * 3.4; c.beginPath(); [n === 2 ? [1.6, -1.6] : n === 3 ? [2.2, 0, -2.2] : [0.9, -0.9]][0].forEach(k => { c.moveTo(ax + nx * k, ay + ny * k); c.lineTo(bx + nx * k, by + ny * k); }); c.stroke(); c.restore(); }
  // an instrument's plate: the piece seen from the front, turned into line work (outline where the picture changes, hatching where it is dark)
  function engrave2(src, S) { const c = document.createElement('canvas'); c.width = S; c.height = S; const x = c.getContext('2d'); x.drawImage(src, 0, 0, S, S); const d = x.getImageData(0, 0, S, S), a = d.data, L = new Float32Array(S * S), bg = new Uint8Array(S * S); for (let i = 0; i < S * S; i++) { L[i] = (0.3 * a[i * 4] + 0.59 * a[i * 4 + 1] + 0.11 * a[i * 4 + 2]) / 255; bg[i] = a[i * 4] > 246 && a[i * 4 + 1] > 246 && a[i * 4 + 2] > 246 ? 1 : 0; }
    for (let Y = 0; Y < S; Y++) for (let X = 0; X < S; X++) { const i = Y * S + X; let k = 0; if (X > 0 && Y > 0 && X < S - 1 && Y < S - 1) { const gx = L[i + 1] - L[i - 1], gy = L[i + S] - L[i - S], e = Math.hypot(gx, gy), ed = bg[i + 1] + bg[i - 1] + bg[i + S] + bg[i - S]; if (e > 0.16 || (!bg[i] && ed > 0)) k = 1; }
      if (!k && !bg[i]) { const l = L[i]; if (l < 0.62 && (X + Y) % 6 < 1.5) k = 0.9; if (l < 0.36 && (X - Y + 4096) % 6 < 1.5) k = 0.9; if (l < 0.16) k = 1; }
      a[i * 4] = 58; a[i * 4 + 1] = 42; a[i * 4 + 2] = 28; a[i * 4 + 3] = 255 * k; }
    x.putImageData(d, 0, 0); return c; }
  function cutWhite(cv) { const x = cv.getContext('2d'), d = x.getImageData(0, 0, cv.width, cv.height), a = d.data; for (let i = 0; i < a.length; i += 4) { const m = Math.min(a[i], a[i + 1], a[i + 2]); if (m > 244) a[i + 3] = 0; else if (m > 228) a[i + 3] = Math.round(255 * (244 - m) / 16); } x.putImageData(d, 0, 0); return cv; }
  function ecoin(x, cx, cy, r) { x.save(); x.strokeStyle = '#6b4a12'; x.fillStyle = '#e8b53a'; x.lineWidth = 2.4; x.beginPath(); x.ellipse(cx, cy + r * 0.22, r, r * 0.86, 0, 0, 6.3); x.fill(); x.stroke(); x.beginPath(); x.ellipse(cx, cy, r, r * 0.86, 0, 0, 6.3); x.fill(); x.stroke(); x.lineWidth = 1.2; x.beginPath(); x.ellipse(cx, cy, r * 0.72, r * 0.6, 0, 0, 6.3); x.stroke(); for (let k = 0; k < 7; k++) { x.beginPath(); x.moveTo(cx - r * 0.5 + k * r * 0.17, cy + r * 0.3); x.lineTo(cx - r * 0.2 + k * r * 0.17, cy - r * 0.34); x.stroke(); } x.restore(); }
  function ebottle(x, cx, cy, h) { const w = h * 0.5; x.save(); x.strokeStyle = SEP; x.lineWidth = 3; x.lineJoin = 'round'; x.fillStyle = '#ece2c8'; x.beginPath(); x.moveTo(cx - w * 0.2, cy - h / 2); x.lineTo(cx + w * 0.2, cy - h / 2); x.lineTo(cx + w * 0.2, cy - h * 0.26); x.quadraticCurveTo(cx + w / 2, cy - h * 0.2, cx + w / 2, cy - h * 0.04); x.lineTo(cx + w / 2, cy + h / 2); x.lineTo(cx - w / 2, cy + h / 2); x.lineTo(cx - w / 2, cy - h * 0.04); x.quadraticCurveTo(cx - w / 2, cy - h * 0.2, cx - w * 0.2, cy - h * 0.26); x.closePath(); x.fill(); x.stroke(); x.fillStyle = SEP; x.fillRect(cx - w * 0.26, cy - h / 2 - 9, w * 0.52, 10);
    x.save(); x.beginPath(); x.rect(cx - w / 2 + 3, cy + h * 0.02, w - 6, h * 0.46); x.clip(); x.lineWidth = 1.3; for (let k = 0; k < 16; k++) { x.beginPath(); x.moveTo(cx - w / 2, cy + h * 0.04 + k * 5); x.lineTo(cx + w / 2, cy + h * 0.04 + k * 5); x.stroke(); } for (let k = -6; k < 14; k++) { x.beginPath(); x.moveTo(cx + w * 0.1 + k * 6, cy); x.lineTo(cx + w * 0.1 + k * 6 - 30, cy + h / 2); x.stroke(); } x.restore(); x.restore(); }
  function eplate(x, o, c, w, h) { x.strokeStyle = SEP; x.lineWidth = 4; x.strokeRect(c[0] - w, c[1] - h, 2 * w, 2 * h); x.lineWidth = 1.4; x.strokeRect(c[0] - w + 9, c[1] - h + 9, 2 * w - 18, 2 * h - 18); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(q => { x.save(); x.translate(c[0] + q[0] * (w - 24), c[1] + q[1] * (h - 24)); x.strokeStyle = SEP; x.lineWidth = 1.6; x.beginPath(); x.arc(0, 0, 7, 0, 6.3); x.moveTo(-11, 0); x.lineTo(11, 0); x.moveTo(0, -11); x.lineTo(0, 11); x.stroke(); x.restore(); });
    const id = o.kind === 'shelf' ? o.id : o.p && o.p.id, tl = !o.gear && id && TILE[id];
    if (tl) { x.save(); x.translate(c[0] - w * 0.2, c[1] - h * 0.12); const k = Math.min(3.1, h / 52); x.scale(k, k); ENGR = 0; fragOrChip(x, tl[0], -58, 0, true); fragOrChip(x, tl[1], 50, 0, true); x.strokeStyle = SEP; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath(); [-3, 3].forEach(q => { x.moveTo(-24, q); x.lineTo(-4, q); }); x.moveTo(-10, -10); x.lineTo(2, 0); x.lineTo(-10, 10); x.stroke(); x.restore(); { const bh = h * 1.3, bc = eplate.bc || (eplate.bc = {}); let cv = bc[id]; if (!cv) { cv = document.createElement('canvas'); cv.width = 240; cv.height = 388; try { bottleDraw(cv.getContext('2d'), id, true, 240, 388, true); } catch (e) { cv = null; } bc[id] = cv; } if (cv) x.drawImage(cv, c[0] + w * 0.74 - bh * 0.31, c[1] - h * 0.1 - bh / 2, bh * 0.62, bh); else ebottle(x, c[0] + w * 0.74, c[1] - h * 0.1, h * 1.25); } }
    else if (o.art) { const a = h * 2.5; x.save(); x.beginPath(); x.rect(c[0] - w + 12, c[1] - h + 12, 2 * w - 24, 2 * h - 24); x.clip(); x.drawImage(o.art, c[0] - a / 2, c[1] - h * 0.02 - a / 2, a, a); x.restore(); }
    [0.5, 0.36].forEach((f, k) => { x.fillStyle = 'rgba(58,42,28,0.5)'; x.fillRect(c[0] - w * 0.56, c[1] + h - 44 + k * 15, w * 1.5 * f, 4); }); }
  function catInk(x, now) { if (!shopB) return; const tk = shopB.take, offers = shopB.objs.filter(o => o.kind === 'offer'), bell = shopObj('bell'), door = shopObj('door'), shelf = shopObj('shelf');
    x.save(); [[-31.6, SAFE ? SAFE.gut.x0 - 0.2 : -2.9], [SAFE ? SAFE.gut.x1 + 0.2 : -1.1, SAFE ? SAFE.R.x1 - 0.1 : 31.7]].forEach((pg, n) => { const A = px({ x: pg[0], z: -20.9 }), B = px({ x: pg[1], z: 17.9 }), mid = (A[0] + B[0]) / 2; x.fillStyle = 'rgba(234,224,198,0.95)'; x.fillRect(A[0], A[1], B[0] - A[0], B[1] - A[1]); x.strokeStyle = SEP; x.lineWidth = 6; x.strokeRect(A[0] + 22, A[1] + 22, B[0] - A[0] - 44, B[1] - A[1] - 44); x.lineWidth = 1.8; x.strokeRect(A[0] + 35, A[1] + 35, B[0] - A[0] - 70, B[1] - A[1] - 70);
      const hy = A[1] + 126; x.lineWidth = 2.6; [[A[0] + 80, mid - 90], [mid + 90, B[0] - 80]].forEach(q => { x.beginPath(); x.moveTo(q[0], hy - 5); x.lineTo(q[1], hy - 5); x.moveTo(q[0], hy + 5); x.lineTo(q[1], hy + 5); x.stroke(); });
      if (n === 0) { try { AA.rxMarks.yieldMark(x, 3, mid, hy, 34, { pencil: 'rgba(0,0,0,0)', plw: 0.1, ink: SEP, lw: 5, t: 1 }); } catch (e) { /* no marks */ } } else { x.font = 'italic 64px Georgia, "Times New Roman", serif'; x.textAlign = 'center'; x.fillStyle = SEP; x.fillText(String(run.round), mid, hy + 22); } });
    offers.forEach(o => { const c = px({ x: o.x - 0.2, z: o.z + 1.0 }), w = 345, h = 146; if (o.gear && !o.art) { try { o.art = cutWhite(snapPiece(o.grp)); } catch (e) { o.art = null; } } eplate(x, o, c, w, h);
      x.font = 'italic 84px Georgia, "Times New Roman", serif'; x.textAlign = 'center'; x.fillStyle = SEP; x.fillText(String(o.i + 1), c[0] - w - 52, c[1] + 26);
      const sel = tk ? (tk.o === o ? Math.min(1, (now - tk.t0) / 420) : 0) : 0; if (sel > 0) { inkLoop(x, c[0], c[1], w + 46, h + 40, sel, 10, '#1c2f74'); if (sel < 1) dirty = true; } else if (!tk && st.hover === o.i) { x.strokeStyle = 'rgba(70,72,84,0.7)'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(c[0] - w + 30, c[1] + h + 22); x.quadraticCurveTo(c[0], c[1] + h + 34, c[0] + w - 30, c[1] + h + 20); x.stroke(); } });
    // on the right page, at the foot: the bell that deals three others (its price in engraved coins), a priced extra bottle if the supplier has one, and the corner that leaves
    if (bell) { const c = px({ x: bell.x, z: bell.z }), hov = st.mark === 'reroll', n = Math.min(9, bell.price || 0); x.strokeStyle = SEP; x.fillStyle = '#ece2c8'; x.lineWidth = hov ? 5 : 3.4; x.lineJoin = 'round'; x.beginPath(); x.moveTo(c[0] - 62, c[1] + 26); x.quadraticCurveTo(c[0] - 60, c[1] - 58, c[0], c[1] - 60); x.quadraticCurveTo(c[0] + 60, c[1] - 58, c[0] + 62, c[1] + 26); x.closePath(); x.fill(); x.stroke(); x.fillStyle = SEP; x.fillRect(c[0] - 78, c[1] + 26, 156, 12); x.beginPath(); x.arc(c[0], c[1] - 68, 9, 0, 6.3); x.fill();
      x.save(); x.beginPath(); x.moveTo(c[0] - 60, c[1] + 24); x.quadraticCurveTo(c[0] - 58, c[1] - 56, c[0], c[1] - 58); x.quadraticCurveTo(c[0] + 58, c[1] - 56, c[0] + 60, c[1] + 24); x.closePath(); x.clip(); x.lineWidth = 1.3; for (let k = 0; k < 14; k++) { x.beginPath(); x.moveTo(c[0] + 4 + k * 6, c[1] - 62); x.quadraticCurveTo(c[0] + 26 + k * 6, c[1] - 20, c[0] + 22 + k * 6, c[1] + 28); x.stroke(); } x.restore();
      for (let k = 0; k < n; k++) ecoin(x, c[0] + 118 + (k % 3) * 44, c[1] + 6 - Math.floor(k / 3) * 30, 19); }
    if (shelf && !shelf.sold) { const c = px({ x: shelf.x, z: shelf.z }); eplate(x, shelf, c, 190, 78); for (let k = 0; k < Math.min(9, shelf.price || 0); k++) ecoin(x, c[0] - 150 + k * 40, c[1] + 106, 17); }
    { const c = px({ x: SAFE ? SAFE.R.x1 - 0.1 : 31.7, z: 17.9 }), L = 210, hov = st.mark === 'skip' ? 1.12 : 1, Lh = L * hov; x.fillStyle = 'rgba(40,28,14,0.22)'; x.beginPath(); x.moveTo(c[0] - Lh - 18, c[1]); x.lineTo(c[0], c[1] - Lh - 18); x.lineTo(c[0] - Lh * 0.5, c[1] - Lh * 0.5 - 26); x.closePath(); x.fill(); x.fillStyle = '#f1ebd9'; x.strokeStyle = 'rgba(70,56,36,0.75)'; x.lineWidth = 3; x.beginPath(); x.moveTo(c[0] - Lh, c[1]); x.lineTo(c[0], c[1] - Lh); x.lineTo(c[0] - Lh * 0.84, c[1] - Lh * 0.84); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#f4efe2'; x.beginPath(); x.moveTo(c[0] - Lh, c[1]); x.lineTo(c[0], c[1] - Lh); x.lineTo(c[0] + 4, c[1] + 4); x.closePath(); x.fill();
      if (door && door.pays) ecoin(x, c[0] - L * 0.62, c[1] - L * 0.62, 19); }
    x.restore(); }
  function shopInk(x, now) { const CATB = SHOPV === 'b'; if (CATB) { catInk(x, now); ENGR = 0; } try { shopInk0(x, now, CATB); } finally { ENGR = 0; } }
  function shopInk0(x, now, CATB) {
    const o = shopB && (shopB.take ? shopB.take.o : st.hover >= 0 ? shopB.objs.find(q => q.kind === 'offer' && q.i === st.hover) : st.mark === 'shelf' ? shopObj('shelf') : null), c = px(CATB ? { x: 15.4, z: -6.5 } : { x: 3, z: -1.5 });
    if (!CATB) { const h = px(SHAPE === 'a' ? { x: -30.4, z: -15.2 } : { x: -21.2, z: -12.2 }); marker(x, 104); x.textAlign = 'center'; x.fillStyle = INK; x.fillText(String(run.round), h[0], h[1]); inkLoop(x, h[0], h[1] - 34, 70, 62, 1, 5, PENCIL); }
    const id = o && (o.kind === 'shelf' ? o.id : o.p && !o.gear ? o.p.id : null), tl = id && TILE[id];
    if (tl) { const t = ((now - (shopB.hovT || now)) % 2600) / 2600, sm = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }, kA = sm((t - 0.22) / 0.18), kB = sm((t - 0.4) / 0.12), pop = t > 0.4 && t < 0.56 ? 1 + 0.25 * Math.sin((t - 0.4) / 0.16 * Math.PI) : 1, out = t > 0.92 ? 1 - (t - 0.92) / 0.08 : 1;
      x.save(); x.translate(c[0], c[1]); x.scale(CATB ? 3.0 : 4.6, CATB ? 3.0 : 4.6); x.globalAlpha = out; fragOrChip(x, tl[0], -66, 0, true); x.strokeStyle = INK; x.lineWidth = 6; x.lineCap = 'round'; x.lineJoin = 'round'; if (kA > 0) { x.beginPath(); x.moveTo(-26, 0); x.lineTo(-26 + 26 * kA, 0); if (kA >= 1) { x.moveTo(-12, -11); x.lineTo(0, 0); x.lineTo(-12, 11); } x.stroke(); } if (kB > 0) { x.globalAlpha = out * kB; x.translate(50, 0); x.scale(pop, pop); fragOrChip(x, tl[1], 0, 0, true); } x.restore(); }
    else if (o && o.gear && o.p) { const G0 = P.GEARS && P.GEARS[o.p.id], tok = String((G0 && G0.tok) || ''), kind = (tok.match(/\{([a-z])\}/) || [])[1] || '', num = tok.replace(/\{[a-z]\}/g, '').replace(/double/g, '\u00d72').replace(/triple/g, '\u00d73').replace(/[A-Za-z]+/g, '').replace(/\s+/g, ' ').trim(), t = ((now - (shopB.hovT || now)) % 3000) / 3000, sm = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }, kA = sm((t - 0.15) / 0.16), kB = sm((t - 0.33) / 0.1), kC = sm((t - 0.5) / 0.14), out = t > 0.93 ? 1 - (t - 0.93) / 0.07 : 1, pop = t > 0.5 && t < 0.7 ? 1 + 0.3 * Math.sin((t - 0.5) / 0.2 * Math.PI) : 1;
      x.save(); x.translate(c[0], c[1] + 60); x.scale(CATB ? 2.9 : 4.2, CATB ? 2.9 : 4.2); x.globalAlpha = out; fragOrChip(x, 'C=C', -66, 0, true); x.strokeStyle = INK; x.lineWidth = 6; x.lineCap = 'round'; x.lineJoin = 'round'; if (kA > 0) { x.beginPath(); x.moveTo(-26, 0); x.lineTo(-26 + 26 * kA, 0); if (kA >= 1) { x.moveTo(-12, -11); x.lineTo(0, 0); x.lineTo(-12, 11); } x.stroke(); } if (kB > 0) { x.save(); x.globalAlpha = out * kB; x.translate(50, 0); fragOrChip(x, 'OH', 0, 0, true); x.restore(); }
      if (kC > 0) { /* the instrument's numeral drops onto the step from where the instrument stands (the right) */ const fx0 = 70 - 70 * kC, fy0 = -40 * (1 - kC) - 44; x.globalAlpha = out * Math.min(1, kC * 2); x.translate(fx0 - 8, fy0); x.scale(pop, pop); if (kind) { try { glyph(x, kind, -34, -8, 15, GREEN); } catch (e) { /* no glyph */ } } marker(x, 44); x.textAlign = 'left'; x.fillStyle = GREEN; x.fillText(num, kind ? -12 : -30, 6); } x.restore(); dirty = true; }
    else if (!o && !CATB) { const k = 1 + 0.06 * Math.sin(now / 300), a = px({ x: 14, z: 2 }); x.strokeStyle = FAINT; x.lineWidth = 9; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(a[0] - 260, a[1] + 40); x.quadraticCurveTo(a[0] - 60, a[1] - 70 * k, a[0] + 150 * k, a[1]); x.moveTo(a[0] + 150 * k - 50, a[1] - 44); x.lineTo(a[0] + 150 * k, a[1]); x.lineTo(a[0] + 150 * k - 62, a[1] + 30); x.stroke(); }
  }
  function showPicks(list) {
    if (!list && run && run.round === 1 && !run.picked1) { run.picked1 = true; return showBriefs(); }   // the first choice of a run is only the molecule: nothing to take, nothing to pay
    st.noteTick = (st.noteTick | 0) + 1;
    st.tok++; st.mode = 'pick'; clearRound(); clearBriefs(); clearKit(); st.call = null; st.floats = []; st.blots = []; st.pings = [];
    clearPicks(); st.mark = ''; st.hover = -1;
    picks = list || P.runPicks(run);
    if (BENCHV) { shopBuild(); sfx.feed(); dirty = true; return; }
    if (P.RULE.coins) run.gear.forEach((id, i) => { const k = piece(id), q = HELD(i); k.grp.position.set(q.x, 0, q.z); k.grp.scale.setScalar(0.62 * sizeOf(id)); heldObjs.push(k); }); if (run.gear.length) heldShelf = shelfAt(5, HELD(2).x, HELD(0).z + 0.2, 1.1);
    picks.forEach((o, i) => { if (o.kind === 'gear' || o.kind === 'level') { const k = piece(o.id); k.grp.position.set(PICKX[i], 0, -2.2); k.grp.scale.setScalar(1.7); k.slot = i; k.born = performance.now() + 120 + i * 130; k.grp.visible = false; pickObjs.push(k); } });
    offerShelves = []; picks.forEach((o, i) => { if (o.kind === 'gear' || o.kind === 'level') offerShelves.push(shelfAt(5, PICKX[i], -2.2, 0.85)); });
    sfx.feed(); dirty = true;
  }
  function takePick(i) {
    const o = picks[i]; if (st.mode !== 'pick' || !o) return;
    if (BENCHV && shopB) { const ob = shopB.objs.find(q => q.kind === 'offer' && q.i === i); if (shopB.take || shopB.pend || !ob) return; st.hover = i; sfxN('pick'); sfx.stamp(); shopB.take = { o: ob, t0: performance.now(), to: ob.gear ? (SHAPE === 'a' ? { x: BNZ.fresh.x, z: BNZ.fresh.z } : { x: Math.min(TOPB.x1 - 4, topRow().hom.x - 2), z: TOPB.z }) : { x: SHP ? SHP.bt : SHOPX, z: 2 }, sc: ob.gear ? 0.67 : 0.72, then: () => { P.runTake(run, o); if (ob.gear) { st.gear = run.gear.slice(); buildKit(); kitObjs.forEach(k => { k.born = 0; }); } showBriefs(); } }; return; }
    sfxN('pick'); P.runTake(run, o); sfx.stamp(); st.shake = 0.6; showBriefs();
  }
  // before each round: three rounds stand on the page, each a molecule with what the round asks and what it pays
  let briefCoins = [];
  function clearBriefs() { briefMols.forEach(freeMol); briefMols = []; briefCoins.forEach(c => scene.remove(c.m)); briefCoins = []; st.choose = null; }
  // an assay is one round and stands alone in the middle of the page
  const BXC = PGE.on ? (BENCHV ? 1.0 : 1.2) : 0, BX = i => (briefs.length === 1 ? BXC : briefs.length === 2 ? (SHAPE === 'a' ? (i ? 15.2 : -18.6) : BENCHV ? (i ? 19.25 : -5.75) : (i ? 1 : -1) * 10.5 + BXC) : PICKX[i]), BZ = BENCHV ? -4.0 : -3.6, BX2 = 6.75;
  // the pair drawn again: a turning arrow under the two molecules, and the coins it costs
  const PAIR = BENCH0 ? { x: 4.6, z: 19.6 } : { x: -1.6, z: 11.6 };
  const pairOn = () => P.RULE.choose && P.RULE.coins && st.mode === 'brief' && briefs.length === 2 && !!meta.coined;
  const pairAt = () => !BENCHV && pairOn() && hit.x > PAIR.x - 1.8 && hit.x < PAIR.x + 6.2 && Math.abs(hit.z - PAIR.z) < 1.8;
  function doPair() { if (!pairOn()) return; const n = P.runRedraw(run); if (!n) { sfxN('cantBuy'); sfx.bad(); return; } sfxN('redraw'); st.drawT = performance.now(); st.coinT = performance.now(); showBriefs(n); }
  function showBriefs(list) {
    musN('state', 'pick');
    st.noteTick = (st.noteTick | 0) + 1;
    st.tok++; st.mode = 'brief'; clearRound(); clearKit(); clearBriefs(); st.call = null; st.floats = []; st.blots = []; st.pings = []; st.hover = -1; st.mark = '';
    clearPicks();
    if ((run.coins || 0) > 0 && !meta.coined) { meta.coined = true; saveMeta(); }
    briefs = list || P.runBriefs(run);
    st.choose = null; briefCoins.forEach(c => scene.remove(c.m)); briefCoins = [];
    // (builder 11) each sketch is fitted by the box of what is drawn (atoms with their radii) into its own half with air round it, and centred there by that box; both at one scale unless that would leave the larger one unreadable or the smaller one tiny
    const pre = briefs.map(b => { const mdl = P.modelOf(b.model); setAlign(mdl); const m = buildMol(mdl, null, true), lb = liveBox(m), two = briefs.length === 2; m.lb = lb; m.fitSc = BENCHV ? Math.min(two ? 4.2 : 4.6, (two ? 21 : 40) / lb.w, (two ? 19.6 : 20) / lb.d) : two ? Math.min(2.8, 17.5 / spanOf(m), 12 / deepOf(m)) : Math.min(3.2, 44 / spanOf(m), 11 / deepOf(m)); return m; }), lo = Math.min.apply(null, pre.map(m => m.fitSc)), hi = Math.max.apply(null, pre.map(m => m.fitSc)), same = BENCHV && lo >= 1.15 && lo >= 0.55 * hi;
    briefs.forEach((b, i) => { const m = pre[i], sc = same ? lo : BENCHV ? Math.min(m.fitSc, lo * 1.8) : m.fitSc, to = BENCHV ? { x: BX(i) - m.lb.cx * sc, z: BZ - m.lb.cz * sc } : { x: BX(i), z: BZ }; m.sc = sc; place(m, to, 0.01); tween(m, to, sc, 0.45 + i * 0.22); briefMols.push(m);
      // what the harder one pays on top stands as gold on the bench above its sketch (never on the first pick of a run: nothing there is a price or a prize)
      if (BENCHV && b.coins && run.round > 1) for (let n = 0; n < b.coins; n++) { const c = coinMesh(); c.position.set(BX(i) - (b.coins - 1) * 1.15 + n * 2.3, 0.12, -24.2); c.visible = false; scene.add(c); briefCoins.push({ m: c, i, n, t0: performance.now() + 700 + i * 220 + n * 160 }); } });
    sfx.feed(); dirty = true;
  }
  function chooseBrief(i) {
    const b = briefs[i]; if (st.mode !== 'brief' || !b) return;
    if (BENCHV) { if (st.choose) return; st.choose = { i, t0: performance.now(), n: 0 }; st.hover = i; sfxN('pick'); dirty = true; return; }
    if ((run.round || 1) === 1) sfxN('runStart'); sfxN('ambience', 'round'); P.runChoose(run, b); sfx.stamp(); st.shake = 0.6; load();
  }
  const CHOOSE_MS = 1500;
  function briefDone() {
    const i = st.choose.i, b = briefs[i], bm = briefMols[i], from = bm ? { x: bm.group.position.x, z: bm.group.position.z, s: bm.group.scale.x } : null; st.choose = null;
    if ((run.round || 1) === 1) sfxN('runStart'); sfxN('ambience', 'round'); P.runChoose(run, b); load();
    if (from && center) { tweens = tweens.filter(tw => tw.m !== center); const bx = center.box || { cx: 0, cz: 0 }; place(center, { x: from.x - (center.fl ? bx.cx * from.s : 0), z: from.z - (center.fl ? bx.cz * from.s : 0) }, from.s); tween(center, C0, SC_MAIN, 0.8); }
  }
  // the page of two sketches, in ink (the bench view): the round's numeral, under each sketch its target mark with the number and the goal picture
  function inkLoop(x, cx, cy, rx, ry, k, lw, col) { if (k <= 0) return; x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); const n = 44, a0 = -2.5; for (let j = 0; j <= n * Math.min(1, k); j++) { const a = a0 + j / n * 6.75, w = 1 + 0.035 * Math.sin(j * 0.9) + 0.03 * j / n; const X = cx + Math.cos(a) * rx * w, Y = cy + Math.sin(a) * ry * w; if (j) x.lineTo(X, Y); else x.moveTo(X, Y); } x.stroke(); }
  function briefInk(x, now) {
    const ch = st.choose, el = ch ? now - ch.t0 : 0, sm = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
    { const h = px(SHAPE === 'a' ? { x: -30.4, z: -15.2 } : { x: -21.2, z: -12.2 }); marker(x, 104); x.textAlign = 'center'; x.fillStyle = INK; x.fillText(String(run.round), h[0], h[1]); inkLoop(x, h[0], h[1] - 34, 70, 62, 1, 5, PENCIL); }
    if (briefs.length === 2 && SHAPE !== 'a') { const a = px({ x: BX2, z: -15 }), b = px({ x: BX2 + 0.3, z: 17.5 }); x.strokeStyle = FAINT; x.lineWidth = 4; x.lineCap = 'round'; x.setLineDash([18, 16]); x.beginPath(); x.moveTo(a[0], a[1]); x.quadraticCurveTo(a[0] - 14, (a[1] + b[1]) / 2, b[0], b[1]); x.stroke(); x.setLineDash([]); }
    briefs.forEach((b, i) => {
      const c = px({ x: BX(i), z: 11.5 }), hov = st.hover === i && !ch, lost = ch && ch.i !== i, fadeK = lost ? 1 - sm((el - 650) / 450) : 1, mc = px({ x: BX(i), z: BZ }), half = briefs.length === 2 ? 12.2 * U : 20 * U;
      x.save(); x.globalAlpha = Math.max(0.0, fadeK * (lost ? 0.9 : 1));
      // the target: our first yield mark in red with the number to reach, then the goal picture
      // one line: the yield to reach (in a long run the line the round needs; else the number to beat) with our first mark; under it, on its own line, the goal picture or pictures
      { const share = b.spec && P.needShare ? P.needShare(run) : 0, txt = fmt(share ? Math.round(share * b.quota) : b.quota); marker(x, 96); const tw = x.measureText(txt).width, sp = b.spec || b.hurdle, np = sp ? (sp.parts && sp.parts.length > 1 ? sp.parts.length : 1) : 0, one = np === 1 && tw + 400 < 22 * U, tot = 100 + tw + (one ? 300 : 0), x0 = c[0] - tot / 2; try { AA.rxMarks.yieldMark(x, 0, x0 + 36, c[1] - 30, 36, { pencil: REDINK, ink: REDINK, t: 1, lw: 9 }); } catch (e) { /* no marks */ } marker(x, 96); x.textAlign = 'left'; x.fillStyle = REDINK; x.fillText(txt, x0 + 92, c[1]);
        if (sp && one) drawSpec(g, x0 + 100 + tw + 110, c[1] - 32, sp, { bare: true, size: 120 }); else if (sp) { const sz = Math.min(120, 21 * U / (2.35 * np)), c2 = px({ x: BX(i), z: 15.6 }); drawSpec(g, c2[0] - (np - 1) * sz * 2.35 / 2 - sz * 0.35, c2[1] - 32, sp, { bare: true, size: sz }); } }
      if (b.motifs) { const mp = px({ x: BX(i), z: 19.2 }); drawMotifRow(b.motifs, mp[0], mp[1]); }
      if (hov) inkLoop(x, mc[0], mc[1], half * 0.96, 11.0 * U, 1, 4, FAINT);
      x.restore();
      if (ch && ch.i === i) inkLoop(x, mc[0], mc[1], half * 0.97, 11.2 * U, sm(el / 520), 11, INK);
      if (lost) { x.globalAlpha = 0.85 * (1 - sm((el - 900) / 400)); const k1 = sm((el - 300) / 260), k2 = sm((el - 520) / 260); strike(x, mc[0] - half * 0.7, mc[1] - 6 * U, mc[0] + half * 0.7, mc[1] + 6 * U, k1, 12, PENCIL); strike(x, mc[0] + half * 0.7, mc[1] - 6 * U, mc[0] - half * 0.7, mc[1] + 6 * U, k2, 12, PENCIL); x.globalAlpha = 1; }
    });
    if (ch) { const nn = (el > 0) + (el > 300) + (el > 520); if (nn !== ch.n) { ch.n = nn; if (nn > 1) sfxN('click'); } }
    if (!BENCHV && P.RULE.coins && pairOn() && run.round > 1 && !ch) { const c = px({ x: BENCHV ? BX2 : BXC, z: BENCHV ? 19.6 : 13.2 }), cost = P.pairCost(run), can = cost != null && (run.coins || 0) >= cost, hov = st.mark === 'pair', age = st.drawT ? (now - st.drawT) / 350 : 9; x.save(); x.translate(c[0] - 40, c[1]); if (age < 1) x.rotate(age * 6.283); turnMark(x, 0, 0, 30, can ? INK : FAINT, hov && can ? 11 : 7); x.restore(); for (let k = 0; k < (cost == null ? 0 : cost); k++) rcoin(x, c[0] + 26 + k * 38, c[1] + 2, 15, can ? 1 : 0.35); }
  }
  // what a run can turn up beyond the suppliers: families that have been opened and reactions that have been found
  const extraR = () => P.FAMILIES.filter(f => meta.fam[f.id]).reduce((a, f) => a.concat(f.reagents), []).concat(Object.keys(meta.found).filter(k => meta.found[k]));
  // Sigils belong to the occult part of the game. Nothing of them shows until the alchemist has been opened; after
  // that they are earned by deeds in play, and the page of sigils appears once one is earned
  // The game opens in stages (docs/ARC.md). 1: the bare game. 2: equipment, suppliers, families. 3: the occult.
  // Nothing of a later stage is shown before it is reached.
  const occultOpen = () => P.stageOf(meta) >= 3;
  const shopMax = () => (P.stageOf(meta) >= 3 ? P.SUPPLY.length - 1 : 3);
  const sigOpen = t => t.id === 'plain' || (occultOpen() && !!(meta.sig && meta.sig[t.id]));
  // ?seed=N plays the run whose draws all come from N. Without it the draws are the system's, as before.
  function newRun() { musN('seed', (Math.random() * 1e9) | 0); musN('state', 'title'); sfxN('title'); sfxN('ambience', 'title'); st.noteRun = null; try { const sd = new URLSearchParams(root.location.search).get('seed'); if (sd != null && sd !== '' && isFinite(+sd)) P.seed(+sd); } catch (e) { /* unseeded */ } run = P.runNew(meta.tier, extraR(), profOpts({ tierNo: Math.max(1, Math.min(3, meta.reach || 1)), meta })); run.manual = true; run.meta = meta; run.single = !meta.taught; if (!meta.sig) meta.sig = {}; if (P.stageOf(meta) < 2) run.noGear = true; if (P.RULE.bare) { run.noGear = true; run.hom = null; } homStand(); if (!P.RULE.bare && P.stageOf(meta) >= 2 && JARK.some(jarSeen) && !run.noHom && !P.bareRun(run)) showHoms(); else runOpen(); }
  function runOpen() { if (P.TERMS.filter(sigOpen).length < 2) { P.runTerm(run, 'plain'); showPicks(); } else showTerms(); }
  // Before a run, once a homunculus has hatched: those that have stand on the page with an empty jar, and one is
  // taken into the run, or none
  // Before a run the jars stand in a row on the kit's shelf, each at its saved fill and growth. A jar not yet seen is absent; one
  // outline stands for the next to earn, with its count. Picking up a ready jar lets its homunculus step out and stand by the page.
  let homShelf = null, homWalk = null; const HNOTE = { x: 20, z: 13.2 }, HSHELF = { z: 3.5 };
  const clearHoms = () => { if (homShelf) { scene.remove(homShelf.grp); if (homShelf.note) scene.remove(homShelf.note); } homShelf = null; if (homWalk) scene.remove(homWalk.grp); homWalk = null; st.homPick = null; homOpts = []; homObjs = []; };
  function jarShelf(cx, cz, wMax, kMax) {
    const seen = BENCHV === 'a' ? JARK.slice() : JARK.filter(jarSeen), nxt = BENCHV === 'a' ? null : JARK.find(k => !jarSeen(k)), n = seen.length + (nxt ? 1 : 0), per = n > 5 ? 10 : 5, W = per * 3 + 0.6, K = Math.min(kMax, wMax / W), grp = new T.Group(), shelf = AA.rxKit.shelf(T, n); grp.add(shelf);
    const slots = seen.map((k, i) => { const j = AA.rxKit.jar(T, k), lx = (i - (n - 1) / 2) * 3, ready = !!meta.hatched[k], fl = ready ? 1 : Math.min(1, (meta.jar[k] || 0) / JFULL(k)); if (ready && j.userData.form) { try { j.userData.form(homStageNow(k) || 1); } catch (e) { /* the jar's own form stays */ } } j.userData.set(fl, ready ? 2 : BENCHV === 'a' ? 3 : undefined); j.position.set(lx, 0, 0); grp.add(j); return { k, g: j, lx, ready, i }; });
    let ghost = null; if (nxt) { const lx = (seen.length - (n - 1) / 2) * 3, gg = new T.Group(), im = new T.MeshBasicMaterial({ color: lin(0x8f897b) }), ring = y => { const r = new T.Mesh(new T.TorusGeometry(0.94, 0.045, 6, 28), im); r.rotation.x = Math.PI / 2; r.position.y = y; gg.add(r); }; ring(0.17); ring(2.3); ring(2.5); [-1, 1].forEach(q => { const r = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 2.3, 6), im); r.position.set(q * 0.94, 1.33, 0); gg.add(r); }); gg.position.set(lx, 0, 0); grp.add(gg); ghost = { k: nxt, lx }; }
    grp.rotation.x = -0.8; grp.scale.setScalar(K); grp.position.set(cx, 0, cz); scene.add(grp); return { grp, slots, ghost, K, n, cx, cz };
  }
  function showHoms() { st.tok++; st.mode = 'hom'; clearRound(); clearBriefs(); clearKit(); clearPicks(); clearHoms(); st.call = null; st.floats = []; st.blots = []; st.pings = []; st.hover = -1;
    homShelf = jarShelf(0, HSHELF.z, 54, 3.3);
    homOpts = slots.map(q => (q.ready ? q.k : -1)); { const nb = new T.Group(), inner = new T.Group(); AA.rxKit.build('logbook', T, inner, new T.Color(0x1d1c1c)); nb.add(inner); nb.rotation.x = -0.8; nb.scale.setScalar(1.5); nb.position.set(HNOTE.x, 0, HNOTE.z); scene.add(nb); homShelf.note = nb; }
    sfx.feed(); dirty = true; }
  // where each stands on the page before a run: up to three as on the take-one page, up to six in one row, more in two rows
  // where a slot of the shelf stands in world space, and what a pointer over the page is touching: a jar (its slot) or the notebook (99)
  const jarSlotAt = q => ({ x: homShelf.cx + homShelf.K * q.lx, z: homShelf.cz });
  function chooseHom(i) { if (st.mode !== 'hom' || !homShelf || st.homPick) return; if (i === 99) { run.hom = null; clearHoms(); homStand(); sfx.stamp(); st.shake = 0.4; runOpen(); return; } const q = homShelf.slots[i]; if (!q) return; if (!q.ready) { sfx.bad(); st.homBad = { i, t: performance.now() }; return; } st.homPick = { i, k: q.k, t0: performance.now() }; sfx.stamp(); }
  function homFinish() { const k = st.homPick.k; st.hover = -1; run.hom = k; clearHoms(); homStand(); if (k === 'water') sfx.squish(); else sfx.drift(); st.shake = 0.5; runOpen(); }
  function homPageAt(e) { if (!homShelf) return -1; const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); if (!ray.ray.intersectPlane(ground, hit)) return -1; if (Math.abs(hit.x - HNOTE.x) < 3.2 && hit.z > HNOTE.z - 6 && hit.z < HNOTE.z + 3) return 99; const K = homShelf.K; let best = -1, bd = 1e9; homShelf.slots.forEach((q, i) => { const c = jarSlotAt(q), dx = Math.abs(hit.x - c.x); if (dx < 1.3 * K && hit.z > c.z - 5.8 * K && hit.z < c.z + 1.2 * K && dx < bd) { bd = dx; best = i; } }); return best; }
  // before a run: six sigils on the page, one is taken as the terms of the run
  const TERMP = i => ({ x: PICKX[i % 3], z: i < 3 ? -3.2 : 6.2 });
  function showTerms() { st.tok++; st.mode = 'terms'; clearRound(); clearBriefs(); clearKit(); clearPicks(); st.call = null; st.floats = []; st.blots = []; st.pings = []; st.hover = -1; sfx.feed(); dirty = true; }
  function chooseTerm(i) { const t = P.TERMS[i]; if (st.mode !== 'terms' || !t) return; if (!sigOpen(t)) { sfx.bad(); return; } P.runTerm(run, t.id); sfx.stamp(); st.shake = 0.6; showPicks(); }
  function termAt(e) { const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); if (!ray.ray.intersectPlane(ground, hit)) return -1; for (let i = 0; i < P.TERMS.length; i++) { const q = TERMP(i); if (Math.abs(hit.x - q.x) < 6.5 && Math.abs(hit.z - q.z) < 4.4) return i; } return -1; }
  // a sigil: two rings and a figure inside that belongs to its terms
  function sigil(x, c, r, id, col, lw, sq) {
    // drawn by hand: every line wanders a little and the rings are gone over twice
    const wob = (k, n) => 1 + 0.035 * Math.sin(k * 2.7 + n * 1.9 + r * 0.01);
    const pt = (a, rr, n) => [c[0] + Math.cos(a) * rr * wob(a * 3, n), c[1] + Math.sin(a) * rr * (sq == null ? 0.62 : sq) * wob(a * 5, n + 2)];
    const ring = (rr, n) => { x.beginPath(); for (let k = 0; k <= 40; k++) { const q = pt(k / 40 * 6.4 + n, rr, n); if (k) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); } x.stroke(); };
    const star = (m, skip, rot, rr, n) => { x.beginPath(); for (let k = 0; k <= m; k++) { const q = pt(rot + k * skip * 2 * Math.PI / m, rr, n + k); if (k) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); } x.stroke(); };
    x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = lw; ring(r, 0); x.lineWidth = lw * 0.5; ring(r * 0.97, 3); x.lineWidth = lw * 0.6; ring(r * 0.86, 5);
    x.lineWidth = lw * 0.8; const up = -Math.PI / 2;
    if (id === 'glass') { star(4, 1, up, r * 0.84, 1); x.beginPath(); const a = pt(up, r * 0.84, 1), b = pt(up + 2.2, r * 0.5, 2), d = pt(up + 3.6, r * 0.84, 3); x.moveTo(a[0], a[1]); x.lineTo(c[0], c[1]); x.lineTo(b[0], b[1]); x.moveTo(c[0], c[1]); x.lineTo(d[0], d[1]); x.stroke(); }
    else if (id === 'occult') star(5, 2, up, r * 0.84, 1);
    else if (id === 'lean') { star(3, 1, up, r * 0.5, 1); [0, 1, 2].forEach(k => { const q = pt(up + k * 2.094, r * 0.66, 9); x.beginPath(); x.ellipse(q[0], q[1], r * 0.12, r * 0.08, 0, 0, 6.3); x.stroke(); }); }
    else if (id === 'long') { star(4, 1, up + Math.PI / 4, r * 0.84, 1); star(4, 1, up, r * 0.58, 4); }
    else if (id === 'hoard') { star(3, 1, up, r * 0.84, 1); star(3, 1, -up, r * 0.84, 6); }
    else { const q = pt(0, 0, 0); x.beginPath(); x.ellipse(c[0], c[1], r * 0.08, r * 0.05, 0, 0, 6.3); x.stroke(); }
  }

  function openFamily(i) { const f = P.FAMILIES[i]; if (st.mode !== 'shop' || !f || meta.tier < 1 || meta.fam[f.id] || meta.credit < f.cost) { sfx.bad(); return; } meta.credit -= f.cost; meta.fam[f.id] = true; saveMeta(); sfx.fanfare(); st.shake = 1.2; st.flash = 1; st.flashC = '255,214,0'; callout(f.name, '', '#8a6a00'); benchBuild(); dirty = true; }
  // between runs: what the run paid, and the suppliers that can be opened with it
  // The bench between runs: one place. The jars on their shelf, the instruments kept on theirs, the reagents known as before and
  // after pictures, the coins. For each kind exactly one outline stands for the next thing to earn, with its count.
  let bench = null;
  function clearBench() { if (!bench) return; bench.objs.forEach(o => scene.remove(o)); bench = null; }
  const fade = o => { o.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.transparent = true; m.material.opacity = 0.3; m.material.depthWrite = false; } }); return o; };
  const supplyNext = () => (meta.tier + 1 <= shopMax() ? P.SUPPLY[meta.tier + 1] : null);
  const famNext = () => (meta.tier >= 1 ? P.FAMILIES.findIndex(f => !meta.fam[f.id]) : -1);
  const knownR = () => { const o = []; P.SUPPLY.forEach((sp, i) => { if (i <= meta.tier) sp.reagents.forEach(id => { if (!o.includes(id)) o.push(id); }); }); extraR().forEach(id => { if (!o.includes(id)) o.push(id); }); return o.filter(id => TILE[id]); };
  const BENCH = { jar: { x: -15.2, z: -2.8 }, gear: { x: 15.2, z: -2.8 }, rx: { z0: 6.2, dz: 3.4, dx: 10.4 } };
  function benchBuild() {
    clearBench(); const objs = []; bench = { objs, hover: null };
    const J = jarShelf(BENCH.jar.x, BENCH.jar.z, 25.5, 1.9); bench.jars = J; objs.push(J.grp);
    const nx = supplyNext(), owned = []; P.SUPPLY.forEach((sp, i) => { if (i <= meta.tier) sp.gear.forEach(id => { if (!owned.includes(id)) owned.push(id); }); });
    const items = owned.slice(0, nx ? 9 : 10), n = items.length + (nx ? 1 : 0), W = n * 3 + 0.6, K = Math.min(1.9, 25.5 / W), grp = new T.Group(), shelf = AA.rxKit.shelf(T, Math.max(1, n)); grp.add(shelf);
    const mk = id => { const inner = new T.Group(); AA.rxKit.build(id, T, inner, new T.Color().setHSL(hash(id + 'hue'), 0.75, 0.5)); return inner; };
    items.forEach((id, i) => { const m = mk(id); m.position.x = (i - (n - 1) / 2) * 3; grp.add(m); });
    let ghost = null; if (nx) { const lx = (items.length - (n - 1) / 2) * 3, gm = fade(mk(nx.gear[0])); gm.position.x = lx; grp.add(gm); const tg = AA.rxKit.tag(T, nx.cost <= 5 ? nx.cost : 0); if (tg) { tg.position.set(lx, 3.4, 0.9); grp.add(tg); } ghost = { lx, obj: gm, cost: nx.cost }; }
    grp.rotation.x = -0.8; grp.scale.setScalar(K); grp.position.set(BENCH.gear.x, 0, BENCH.gear.z); scene.add(grp); objs.push(grp); bench.gear = { grp, K, n, ghost };
    const nb = new T.Group(), inner = new T.Group(); AA.rxKit.build('logbook', T, inner, new T.Color(0x1d1c1c)); nb.add(inner); nb.rotation.x = -0.8; nb.scale.setScalar(1.4); nb.position.set(HNOTE.x, 0, HNOTE.z); scene.add(nb); objs.push(nb); bench.note = nb;
    bench.rx = knownR().slice(0, nx || famNext() >= 0 ? 9 : 10);
  }
  const benchGhostAt = () => { const G = bench && bench.gear; return G && G.ghost ? { x: BENCH.gear.x + G.K * G.ghost.lx, z: BENCH.gear.z, K: G.K } : null; };
  function showSuppliers() { musN('state', 'bench'); sfxN('shopOpen'); sfxN('ambience', 'bench'); st.tok++; st.mode = 'shop'; shop.earned = (run.beaten + (run.bonus || 0)) * (run.payMul || 1); meta.credit += shop.earned; saveMeta(); clearRound(); clearBriefs(); clearKit(); clearPicks(); st.call = null; st.floats = []; st.blots = []; st.pings = []; st.hover = -2; benchBuild(); sfx.feed(); dirty = true; }
  function openSupplier(i) { const sp = P.SUPPLY[i]; if (st.mode !== 'shop' || i !== meta.tier + 1 || i > shopMax() || !sp || meta.credit < sp.cost) { sfxN('cantBuy'); sfx.bad(); return; } meta.credit -= sp.cost; meta.tier = i; saveMeta(); sfxN('buy'); sfx.fanfare(); st.shake = 1.2; st.flash = 1; st.flashC = '255,214,0'; callout(sp.name, '', '#8a6a00'); benchBuild(); dirty = true; }
  // Pointing at a reaction works out what it would do, so the page can show it before the click
  function setHover(i) {
    if (i >= 0 && i !== st.hover && st.mode === 'play') sfxN('hover');
    st.hover = i; st.peek = null; st.willFire = null;
    const s = st.mode === 'play' && g && slots[i], o = s && s.o;
    // nothing here shows what a reagent will do (no preview): the pointer only lifts the reagent
    dirty = true;
  }
  // sets off the chain that the row has charged. From here the molecule reacts by itself until nothing carries it on
  function setOff() {
    if (st.mode !== 'fuse' || !P.fire(g)) return;
    sfx.fuse(); st.shake = 2.4; st.flash = 1; st.flashC = '214,69,58'; st.hold = performance.now() + 220; spray(60, REDINK, true);
    const c = P.chainNext(g); if (!c && g.chain) { st.chainN = 0; st.mode = 'play'; return refresh(); } if (!c) { st.mode = 'play'; return nextPage(); }
    st.chainN = 1; const k = g.kinds.indexOf(c.id); st.mode = 'play'; react(c, c.id, false, LAB[k] ? { x: LAB[k].x - 0.8, z: LAB[k].z + 0.5 } : { x: 17, z: -6 }, true);
  }
  // A molecule that turns back in a U, or straightens out of one, between two drawings: the move is the bend itself
  // opening or closing, each body carried whole, and not every atom going straight to its new place through the others
  function bendOf(prev, nm, fwd, from) {
    const pf = prev && prev.at.fold, nf = nm.at.fold; if (!prev || !fwd || !!pf === !!nf || !prev.at.unf || !nm.at.unf) return null;
    const U0 = new Map(); fwd.forEach((na, oa) => { const u = prev.at.unf.get(oa); if (u && nm.at.unf.has(na) && from.has(na)) U0.set(na, u); });
    const F = pf || nf, tr = pf ? (a => fwd.get(a)) : (a => a), ok = a => a && U0.has(a);
    const bodies = F.bodies.map(o => ({ atoms: o.atoms.map(tr).filter(ok), bbs: o.bbs.map(tr).filter(ok) })).filter(o => o.atoms.length);
    const B = { F, bodies, U0, U1: nm.at.unf, f0: pf ? 1 : 0, f1: nf ? 1 : 0, e0: new Map(), e1: new Map(), tmp: new Map() };
    bendAll(F, bodies, a => U0.get(a), B.f0, (a, x, z) => { const fr = from.get(a); B.e0.set(a, { x: fr.x - x, z: fr.z - z }); });
    bendAll(F, bodies, a => B.U1.get(a), B.f1, (a, x, z) => { const to = nm.at.get(a); B.e1.set(a, { x: to.x - x, z: to.z - z }); });
    return B;
  }
  function bendEval(B, k, mo) {
    const f = B.f0 + (B.f1 - B.f0) * k, U = a => { const u0 = B.U0.get(a), u1 = B.U1.get(a); let t = B.tmp.get(a); if (!t) { t = { x: 0, z: 0 }; B.tmp.set(a, t); } t.x = u0.x + (u1.x - u0.x) * k; t.z = u0.z + (u1.z - u0.z) * k; return t; };
    bendAll(B.F, B.bodies, U, f, (a, x, z) => { const c = mo.cur.get(a), fr = mo.from.get(a), to = mo.m.at.get(a), e0 = B.e0.get(a), e1 = B.e1.get(a); if (!c || !fr || !e0 || !e1) return; c.set(x + e0.x * (1 - k) + e1.x * k, fr.y + (to.y - fr.y) * k, z + e0.z * (1 - k) + e1.z * k); });
    mo.m.balls.forEach((b, a) => { if (a.el !== 'H') return; const fr = mo.from.get(a); if (!fr) return; const par = mo.m.model.neighbors(a).map(q => q.atom).find(q => B.e0.has(q)); if (!par) return; const pf = mo.from.get(par), pt = mo.m.at.get(par), to = mo.m.at.get(a), pc = mo.cur.get(par); mo.cur.get(a).set(pc.x + (fr.x - pf.x) * (1 - k) + (to.x - pt.x) * k, fr.y + (to.y - fr.y) * k, pc.z + (fr.z - pf.z) * (1 - k) + (to.z - pt.z) * k); });
  }
  // ---------- a change of layout slides along the snake (FOLD.md: layout changes slide, never jump) ----------
  // Where the line itself got longer or shorter, every atom after the change has a new place along the line. It travels there along the
  // line, round the turns, carrying its groups and rings with it, so the drawing never leaves its own footprint on the way.
  const snakeAt = p => { const K = 8, p0 = Math.floor(p), fr = p - p0, at1 = q => { const r = Math.floor(q / K), j = ((q % K) + K) % K, col = r % 2 === 0 ? j : K - 1 - j, dn = (col + r + K - 1) % 2 === 0; let z = r * FL.RG + (dn ? FL.ZA : -FL.ZA); if (j >= K - 2) z = r * FL.RG + turnZ(K - 1 - j); if (j <= 1 && r > 0) z = r * FL.RG - turnZ(j); return { x: col * FL.DX, z }; }, a = at1(p0), b = at1(p0 + 1); return { x: a.x + (b.x - a.x) * fr, z: a.z + (b.z - a.z) * fr }; };
  function slideSet(prev, nm, fwd, from) {
    if (!prev || !prev.fl || !nm.fl || !fwd) return null; const K = 8, f0 = prev.fl.f, f1 = nm.fl.f, idx = (f, a) => { const rc = f.pos.get(a); if (!rc) return null; const r = rc[0], col = rc[1]; return r * K + (r % 2 === 0 ? col : K - 1 - col); };
    const rev = new Map(); fwd.forEach((na, oa) => rev.set(na, oa));
    const line = new Map(); let moved = 0; f1.path.forEach(a => { const oa = rev.get(a), p1 = idx(f1, a), p0 = oa ? idx(f0, oa) : null, fr = from.get(a), to = nm.at.get(a); if (p0 == null || p1 == null || !fr || !to) return; const c0 = snakeAt(p0), c1 = snakeAt(p1); line.set(a, { p0, p1, e0x: fr.x - c0.x, e0z: fr.z - c0.z, e1x: to.x - c1.x, e1z: to.z - c1.z }); if (p0 !== p1) moved++; });
    if (!moved) return null;
    // everything else rides on the nearest atom of the line it hangs from
    const md = nm.model, host = new Map(), q = []; line.forEach((_, a) => { host.set(a, a); q.push(a); });
    for (let i = 0; i < q.length; i++) { const u = q[i]; md.neighbors(u).forEach(n => { const v = n.atom; if (host.has(v) || !nm.at.has(v) || n.bond.rung) return; host.set(v, host.get(u)); q.push(v); }); }
    const ride = new Map(); host.forEach((h, a) => { if (h === a || !from.has(a)) return; const fa = from.get(a), fh = from.get(h), ta = nm.at.get(a), th = nm.at.get(h); ride.set(a, { h, ax: fa.x - fh.x, az: fa.z - fh.z, bx: ta.x - th.x, bz: ta.z - th.z }); });
    return { line, ride };
  }
  function slideEval(mo, k) {
    const S = mo.slide, kk = Math.max(-0.15, Math.min(1.1, k));
    S.line.forEach((s, a) => { const c = mo.cur.get(a); if (!c) return; const p = snakeAt(s.p0 + (s.p1 - s.p0) * kk), fr = mo.from.get(a), to = mo.m.at.get(a); c.set(p.x + s.e0x * (1 - k) + s.e1x * k, fr.y + (to.y - fr.y) * k, p.z + s.e0z * (1 - k) + s.e1z * k); });
    S.ride.forEach((s, a) => { const c = mo.cur.get(a), h = mo.cur.get(s.h); if (!c || !h) return; const fr = mo.from.get(a), to = mo.m.at.get(a); c.set(h.x + s.ax * (1 - k) + s.bx * k, fr.y + (to.y - fr.y) * k, h.z + s.az * (1 - k) + s.bz * k); });
  }
  // While the drawing changes, nothing is stretched and nothing passes through anything: every bond that was there before keeps its length
  // (its two atoms are moved together), and atoms that come too near each other are pushed apart, on every frame of the move.
  function untangle(mo, k) {
    const m = mo.m; let U = mo.un;
    if (!U) { const A = []; m.balls.forEach((b, a) => { if (a.el !== 'H' && mo.cur.get(a)) A.push(a); }); const ix = new Map(); A.forEach((a, i) => ix.set(a, i)); const bonds = [], bset = new Set();
      m.sticks.forEach(q => { const i = ix.get(q.a), j = ix.get(q.b); if (i == null || j == null) return; bset.add(i * 1000 + j); bset.add(j * 1000 + i); if (q.rung) return; const fa = mo.from.get(q.a), fb = mo.from.get(q.b), ta = m.at.get(q.a), tb = m.at.get(q.b); if (!fa || !fb) { const d = ta.distanceTo(tb); bonds.push([i, j, d, d]); return; } if (q.old === false) return; bonds.push([i, j, Math.min(fa.distanceTo(fb), FL.L * 1.12), ta.distanceTo(tb)]); });
      // an atom that is new rides with the atom it is bonded to
      const news = [], hostOf = new Map(); { const qu = A.filter(a => mo.from.has(a)); qu.forEach(a => hostOf.set(a, a)); for (let qi = 0; qi < qu.length; qi++) { const u = qu[qi]; m.model.neighbors(u).forEach(nq => { const v = nq.atom; if (!ix.has(v) || hostOf.has(v) || nq.bond.rung) return; hostOf.set(v, hostOf.get(u)); qu.push(v); news.push([ix.get(v), ix.get(hostOf.get(u))]); }); } }
      const rep = []; for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) { if (bset.has(i * 1000 + j)) continue; const fa = mo.from.get(A[i]), fb = mo.from.get(A[j]), ta = m.at.get(A[i]), tb = m.at.get(A[j]), ap = apartOf(A[i], A[j]); rep.push([i, j, Math.min(ap, fa && fb ? Math.hypot(fa.x - fb.x, fa.z - fb.z) : ap), Math.min(ap, Math.hypot(ta.x - tb.x, ta.z - tb.z))]); }
      const hs = []; m.balls.forEach((b, a) => { if (a.el !== 'H') return; const pa = m.model.neighbors(a).map(q => q.atom).find(q => ix.has(q)); if (pa && mo.cur.get(a)) hs.push([a, pa]); });
      U = mo.un = { A, bonds, rep, hs, news, to: A.map(a => m.at.get(a)), pre: A.map(() => new T.Vector3()) }; }
    const C = U.A.map(a => mo.cur.get(a)), kk = Math.max(0, Math.min(1, k)); U.news.forEach(n => { const c = C[n[0]], h = C[n[1]], t = U.to[n[0]], th = U.to[n[1]]; c.x = t.x + h.x - th.x; c.z = t.z + h.z - th.z; }); C.forEach((c, i) => U.pre[i].copy(c));
    for (let it = 0; it < 14; it++) {
      U.bonds.forEach(b => { const p = C[b[0]], q = C[b[1]], rest = b[2] + (b[3] - b[2]) * kk; let dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz); if (d < 1e-4) { dx = 1; dz = 0; d = 1; } const f = (d - rest) / d * 0.5; p.x += dx * f; p.z += dz * f; q.x -= dx * f; q.z -= dz * f; });
      U.rep.forEach(b => { const p = C[b[0]], q = C[b[1]], min = b[2] + (b[3] - b[2]) * kk; let dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz); if (d >= min) return; if (d < 1e-4) { dx = Math.cos(b[0] * 1.3 + b[1]); dz = Math.sin(b[0] * 1.3 + b[1]); d = 1; } const f = (d - min) / d * 0.5; p.x += dx * f; p.z += dz * f; q.x -= dx * f; q.z -= dz * f; }); }
    // hydrogens that are drawn ride with their atom
    U.hs.forEach(h => { const c = mo.cur.get(h[0]), i = U.A.indexOf(h[1]); if (c && i >= 0) { c.x += C[i].x - U.pre[i].x; c.z += C[i].z - U.pre[i].z; } });
  }
  // A change is played in two parts so that it is seen where it happens. First the atoms that change (and the ring they are in) take their new
  // shape in place, while everything before them stands still and everything after them is carried along as it was. Only when that is done does
  // the rest of the drawing re-flow along the snake to its new places. stageMid gives where every atom stands between the two parts.
  function stageMid(nm, o, from) {
    if (!nm.fl || !nm.fl.bodyOf) return null; const at = nm.at, hv = []; nm.balls.forEach((b, a) => { if (a.el !== 'H') hv.push(a); });
    const M = new Set(), tr = a => (o.map && o.map.get(a)) || a, addM = a => { if (a && a.el !== 'H' && nm.balls.has(a)) M.add(a); };
    (o.atoms || []).concat(o.join || []).forEach(a => addM(tr(a))); ((o.r && o.r.made) || []).forEach(addM); hv.forEach(a => { if (!from.has(a)) M.add(a); });
    nm.sticks.forEach(q => { if (q.old === false && !q.rung) { addM(q.a); addM(q.b); } });
    if (!M.size) return null; Array.from(M).forEach(a => { const bd = nm.fl.bodyOf.get(a); if (bd) bd.atoms.forEach(x => M.add(x)); });
    const dist = a => { const f = from.get(a), t = at.get(a); return f ? Math.hypot(f.x - t.x, f.z - t.z) : 0; }; if (!hv.some(a => !M.has(a) && dist(a) > 0.08)) return null;
    const nbr = a => nm.model.neighbors(a).filter(n => n.atom.el !== 'H' && nm.balls.has(n.atom) && !n.bond.rung).map(n => n.atom), mid = new Map(), seen = new Set();
    M.forEach(a => mid.set(a, at.get(a).clone()));
    hv.forEach(a0 => { if (M.has(a0) || seen.has(a0)) return; const comp = [], q = [a0]; seen.add(a0); let att = null; while (q.length) { const u = q.pop(); comp.push(u); nbr(u).forEach(v => { if (M.has(v)) { if (!att) att = [u, v]; return; } if (!seen.has(v)) { seen.add(v); q.push(v); } }); }
      const moved = Math.max.apply(null, comp.map(dist)); if (moved < 0.08 || !att || comp.length <= 3 || !from.get(att[0])) { comp.forEach(c => mid.set(c, at.get(c).clone())); return; }
      const a = att[0], y = att[1], fa = from.get(a), fy = from.get(y), my = mid.get(y), sx = (fy ? my.x + fa.x - fy.x : my.x + at.get(a).x - at.get(y).x) - fa.x, sz = (fy ? my.z + fa.z - fy.z : my.z + at.get(a).z - at.get(y).z) - fa.z;
      comp.forEach(c => { const f = from.get(c); mid.set(c, new T.Vector3(f.x + sx, at.get(c).y, f.z + sz)); }); });
    nm.balls.forEach((b, h) => { if (h.el !== 'H') return; const pa = nm.model.neighbors(h).map(n => n.atom).find(x => mid.has(x)); const t = at.get(h); mid.set(h, pa ? new T.Vector3(mid.get(pa).x + t.x - at.get(pa).x, t.y, mid.get(pa).z + t.z - at.get(pa).z) : t.clone()); });
    let need = 0; mid.forEach((p, a) => { const t = at.get(a); need = Math.max(need, Math.hypot(p.x - t.x, p.z - t.z)); }); return need > 0.08 ? mid : null;
  }
  // the second part: from where the first part left every atom, along the snake to where it belongs
  function stageTwo(mo, wait) {
    const m = mo.m, from = new Map(), start = new Map(), cur = new Map(); m.balls.forEach((b, a) => { const p = mo.mid.get(a) || m.at.get(a); from.set(a, p.clone()); start.set(a, wait); cur.set(a, p.clone()); });
    const two = { s0: wait, ms: 0, slow: false, m, from, start, cur, t0: performance.now(), end: wait + 400, made: new Set(), stage2: true };
    try { if (mo.prev2 && mo.fwd2) two.slide = slideSet(mo.prev2, m, mo.fwd2, from); } catch (e) { two.slide = null; }
    m.sticks.forEach(q => { q.old = true; }); two.cont = true; return two;
  }
  // finishes at once whatever the last reaction was still playing, so that the next one can start
  function flush() {
    if (morph) { layout(morph.m, a => morph.m.at.get(a), null); morph = null; }
    if (st.pending) { const pd = st.pending; st.pending = null; pd.ids.forEach(clearTimeout); pd.final(); }
  }
  function endRound() {
    // what the round gave off goes into the jars for good, win or lose; a jar that is now full hatches
    { const b = P.runBank(run, g); st.hatched = null; JARK.forEach(k => { /* (builder 19) a hatched creature's jar goes on counting past full: its stage is read from it */ meta.jar[k] = meta.hatched[k] ? (meta.jar[k] || 0) + (b[k] || 0) : Math.min(JFULL(k), (meta.jar[k] || 0) + (b[k] || 0)); if (!meta.hatched[k] && meta.jar[k] >= JFULL(k)) { meta.hatched[k] = true; sfxN('creature'); st.hatched = k; st.hatchT = performance.now(); } }); st.by = { water: 0, h2: 0, gauge: 0 }; JARK.forEach(k => { g.by[k] = 0; }); st.flyers.forEach(f => { f.keep = null; }); saveMeta(); }
    st.homWait = false; st.homList = null;
    st.mode = 'done'; st.overClean = false; st.pinned = false; st.pin0 = null; st.pinK = 0; st.call = null; if (!BENCHV && (P.RULE.bare || !st.gear.length)) { st.lx = 0; C0.x = 0; C0.z = 1.2; LANE.w = 41; LANE.d = 10; if (center) SC_MAIN = fitMain(center); } if (!BENCHV) clearKit(); { const re = P.roundEnd(g, run); st.res = re; st.pass = !!re.won; st.ypass = !!re.ypass; } st.doneT = performance.now(); if (AA.rxFeel && AA.rxFeel.reset) AA.rxFeel.reset(); try { overX.clearRect(0, 0, overC.width, overC.height); } catch (e) { /* no overlay */ } setTimeout(() => musN('state', st.won ? 'runwon' : st.pass ? 'won' : (run && run.over) ? 'runlost' : 'lost'), 0); st.won = st.pass && run.round >= (P.runLast ? P.runLast(run) : 9); if (st.won) { run.won = true; if ((meta.reach || 1) <= (run.tierNo || 1) && (run.tierNo || 1) < 3) { meta.reach = (run.tierNo || 1) + 1; saveMeta(); } } if (!meta.taught) { meta.taught = true; saveMeta(); }
    if (false && meta.stage < 2 && run.beaten >= 3) { /* (builder 20) the gate is P.stageOf(meta) now, from the book */ meta.stage = 2; if (run.term !== 'hoard') run.noGear = false; saveMeta(); }
    else if (false && meta.stage === 2 && st.pass && run.beaten === 6) { meta.six = (meta.six || 0) + 1; if (meta.six >= 2) meta.stage = 3; saveMeta(); }
    { if (!meta.sig) meta.sig = {}; const got = occultOpen() ? P.deeds(g, run, st.pass).filter(id => !meta.sig[id]) : []; if (got.length) { sfxN('finding'); sfxN('unlock'); got.forEach(id => { meta.sig[id] = true; }); saveMeta(); st.newSig = got[0]; st.newSigT = performance.now(); } else st.newSig = null; }
    st.earn = st.res && st.res.earn && (st.res.earn.marks + st.res.earn.interest + (st.res.earn.extra || 0)) ? st.res.earn : null; if (st.earn && st.earn.marks + st.earn.interest + (st.earn.extra || 0)) st.coinT = performance.now();
    if (st.pass) { P.runKeep(run, g); st.paid = P.runPay(run); { const extra = (run.gear.includes('goggles') ? 1 : 0) + (run.gear.includes('grant') && g.total >= st.quota * 10 ? 5 : 0); if (extra) { run.bonus = (run.bonus || 0) + extra; st.paid = (st.paid || 0) + extra; } } sfxN(st.won ? 'runWon' : 'roundWon'); sfx.fanfare(); st.shake = 1.2; st.flash = 1; st.flashC = '28,138,74'; }
    else { sfxN('runLost'); if (AA.sfx.lost) AA.sfx.lost(); else sfx.bad(); st.shake = 0.5; st.flash = 0.8; st.flashC = '200,38,28'; }
    if (run.beaten > best) { best = run.beaten; }
    if (st.won || !st.pass) { /* (builder 20) the run is over: the rules count it and say what was earned; it is kept at once and shown thing by thing */ try { const rr = P.runResult(run); A20.earn = { list: (rr.earned || []).slice(), t0: kinNext(performance.now() + 900), L: Math.max(420, Math.min(700, kinLen(performance.now()))) }; } catch (e) { A20.earn = null; } } saveMeta();
    refresh();
  }
  // the step log: one record per step of a line, and one per page turn
  const SL = { mo: null, open: null, idle: 0, log: [], turnB: null };
  const snapW = m => { const o = new Map(), g0 = m.group, s = g0.scale.x; m.balls.forEach((b, a) => { if (a.el !== 'H') o.set(a, { x: g0.position.x + b.mesh.position.x * s, z: g0.position.z + b.mesh.position.z * s }); }); o.sc = s; return o; };
  function slClose(after, now) { const o = SL.open; SL.open = null; let n = 0, sum = 0, mx = 0, big = 0; const prs = []; after.forEach((q, a) => { const p = o.before.get(a); if (!p || o.made.has(a)) return; const d = Math.hypot(q.x - p.x, q.z - p.z) / HOME.w; n++; sum += d; if (d > mx) mx = d; if (d > 0.1) big++; prs.push([p, q]); }); let shape = 0, shapeMax = 0; if (n) { let ax = 0, az = 0, bx = 0, bz = 0; prs.forEach(w => { ax += w[0].x; az += w[0].z; bx += w[1].x; bz += w[1].z; }); ax /= n; az /= n; bx /= n; bz /= n; const k = after.sc / (o.before.sc || after.sc); prs.forEach(w => { const d = Math.hypot(w[1].x - bx - (w[0].x - ax) * k, w[1].z - bz - (w[0].z - az) * k) / HOME.w; shape += d; if (d > shapeMax) shapeMax = d; }); shape /= n; } if (n) SL.log.push({ shape: +shape.toFixed(3), shapeMax: +shapeMax.toFixed(3), eased: !!(center && center.fl && center.fl.eased), why: center && center.fl ? center.fl.why : 'nofl', ring: !!(center && center.fl && center.fl.ring), rd: run ? run.round : 0, pg: g ? g.page : 0, turn: !!o.turn, n, made: o.made.size, mean: +(sum / n).toFixed(3), max: +mx.toFixed(3), big, ms: Math.round(now - o.t), sc: +(after.sc / (o.before.sc || after.sc)).toFixed(2) }); }
  function nextPage() {
    musN('state', 'plan');
    st.noteTick = (st.noteTick | 0) + 1;
    st.homWait = false; st.homList = null; st.homSpot = null; st.homHover = false; st.homNone = false;
    if (!P.turn(g)) { P.synEnd(g); return endRound(); }
    st.cstep = null;
    if (g.hom && g.hom.frozen) { st.want = P.made(g); st.P = g.P; st.R = g.R; st.mult = P.mult(g); st.madeBump = 1; }
    st.E = g.E; if (st.gear.includes('intern')) { const tk = st.tok; setTimeout(() => { if (tk === st.tok) internGo(); }, 700); }
    flush(); if (g.reopened && g.m.settle && caged(g.m, archesOf(g.m))) g.m.settle(500); setAlign(g.m); tweens = tweens.filter(tw => tw.m !== center);
    // the new page's drawing carries on from the last: the same way up, and turned back to the same side if it turns back
    const sd = new Map(); if (center) { const mp = g.reopened && g.reopened.map, live = new Set(g.m.atoms); if (mp) mp.forEach((na, oa) => { const q = center.at.get(oa); if (q && center.balls.has(oa) && live.has(na)) sd.set(na, q); }); if (!sd.size) center.balls.forEach((b, a) => { if (live.has(a)) sd.set(a, center.at.get(a)); }); if (center.at.fold) sd.fold = { dir: center.at.fold.dir }; }
    if (center && sd.size) { const tb = new Map(), g0 = center.group, s0 = g0.scale.x; sd.forEach((q, na) => { if (na && na.el !== 'H' && q && q.x != null) tb.set(na, { x: g0.position.x + q.x * s0, z: g0.position.z + q.z * s0 }); }); tb.sc = s0; SL.turnB = tb; SL.idle = 0; }
    freeMol(center); center = buildMol(g.m, null, false, sd.size ? sd : null); SC_MAIN = fitMain(center); place(center, C0, st.sc); center.hot = g.cur.path.length ? marksOf(center, Array.from(g.cur.fresh), 0.01, 0.2) : []; center.groups = groupsOf(center); center.ghosts = []; st.pop = 1;
    rowMols.forEach(freeMol); rowMols = []; st.pageStart = g.trail.length; st.turned = performance.now(); if (AA.sfx.pageTurn) AA.sfx.pageTurn(); else sfx.feed(); refresh(); st.sq = 0.8; st.kvz += 10;
    if (startPage()) return;
    // a page on which no reagent acts turns itself
    if (!slots.some(q => q && q.o) && !P.canRedraw(g) && !P.canBank(g) && !kitObjs.some(k => P.canTool(g, k.id))) { const tok = st.tok; st.mode = 'move'; setTimeout(() => { if (tok !== st.tok) return; st.mode = 'play'; nextPage(); }, 350); }
  }
  // Everything the player sees and hears when a reaction lands. Each change arrives on its own beat, in the order it
  // was scored: the reagent at each place, then the row, then each piece of equipment. Returns how long it takes.
  const PART = { p: '#1f5fbf', h: '#1f5fbf', r: '#a87a00', e: '#a87a00' };
  function land(o, before, wasOpen, mol, reagent, lab, from) {
    const ids = [], later = (fn, ms) => ids.push(setTimeout(fn, ms)), placeAt = [];
    const tok = st.tok, t = g.trail[g.trail.length - 1], beats = t.ev, n = beats.length, rcol = rgb(colOf(reagent));
    // where on the page each place of the new molecule will be once it has landed in the middle
    const sc = SC_MAIN, marks = (mol && mol.marks) || [], spot = k => { const m = marks.length ? marks[k % marks.length] : { x: 0, z: 0 }; return { x: C0.x + m.x * sc, z: C0.z + m.z * sc }; };
    const heavy = id => { let best = null, bd = 1e9; if (mol) mol.model.atoms.forEach(a => { if (a.iso !== id) return; const q = mol.at.get(a); if (!q) return; const tt = -q.y / camDir.y, gx = q.x + camDir.x * tt, gz = q.z + camDir.z * tt; let d = 1e9; marks.forEach(m => { d = Math.min(d, Math.hypot(m.x - gx, m.z - gz)); }); if (d < bd) { bd = d; best = { x: C0.x + gx * sc, z: C0.z + gz * sc }; } }); return best; };
    // the longer the row, the harder everything on the page hits: bigger lettering, more ink, slashes across the page
    const f = Math.min(1, Math.max(0, (g.cur.path.length - 1) / 5) + 0.12 * (st.chainN || 0)), FL = { p: '31,95,191', h: '31,95,191', r: '255,176,0', e: '200,24,160' }; st.fury = f;
    const ping = (at, txt, col, size, ring) => st.pings.push({ x: at.x, z: at.z, txt, col, size: size * (PLAIN ? 0.62 : 1 + 0.3 * f), ring, f, t: performance.now() });
    const slash = col => { if (PLAIN) return; for (let q = 0; q < Math.min(2, Math.floor(f * 2.4)); q++) { const a = (Math.random() - 0.5) * 1.1 + (Math.random() < 0.5 ? 0 : Math.PI), len = 6 + Math.random() * 9 * f; st.slashes.push({ x: C0.x + (Math.random() - 0.5) * 16, z: C0.z + (Math.random() - 0.5) * 7, dx: Math.cos(a) * len, dz: Math.sin(a) * len * 0.5, w: 10 + 14 * f * Math.random(), col, t: performance.now() }); } };
    if (!fe()) { sfx.bond(); st.shake = Math.max(st.shake, 0.3); }
    // the reaction is played out one beat at a time, quicker as it goes: each place, each heavy atom, the row, then
    // each piece of equipment in the order it stands
    const quick = st.firing ? 0.4 : PLAIN ? Math.max(0.42, Math.pow(0.87, st.chainN || 0)) : Math.pow(0.8, st.chainN || 0); let at = (PLAIN ? 120 : 300) * Math.max(0.35, quick), gap = Math.max(50, (PLAIN ? 110 : 210) * quick), place = -1, last = { x: C0.x, z: C0.z };
    if (PLAIN && TILE[reagent] && lab && !o.self && !fe()) { const trav = 210 * Math.max(0.55, quick); st.fly = { a: lab, b: spot(0), tl: TILE[reagent], t: performance.now(), trav: at + trav - 120, hold: 620 * Math.max(0.6, quick) }; at += trav; }
    const whenOf = new Map();
    beats.forEach((e, k) => {
      const when = at; whenOf.set(e, when); at += e.src === 'bottle' ? Math.max(gap, 300 * Math.max(0.35, quick)) : gap; gap = Math.max(70, gap * 0.88);
      if (e.src === 'bottle') { place++; placeAt.push(when); const kk = place; later(() => { if (tok === st.tok && !PLAIN) st.strokes.push({ a: lab, b: spot(kk), col: rcol, t: performance.now(), dur: 150 }); }, Math.max(0, when - 150)); }
      const pl = place;
      later(() => {
        if (tok !== st.tok) return;
        const key = e.part === 'h' ? 'p' : e.part, big = e.op === 'mul';
        if (!o.casc) { st.want = Math.max(st.want, e.made); st.madeBump = 1; } st.P = e.P; st.R = e.R; st.E = e.E; st.mult = e.R * e.E; st.bump[key] = 1;
        const piece = P.GEARS[e.src] ? e.src : null, txt = e.act ? '' : (big ? 'times ' : '+') + fmtB(e.val);
        if (e.src === 'bottle') { last = spot(pl); st.focus = { x: last.x, z: last.z }; { const dx = last.x - lab.x, dz = last.z - lab.z, d = Math.hypot(dx, dz) || 1, imp = 7 + 9 * f; st.kvx += dx / d * imp; st.kvz += dz / d * imp; st.sq = Math.min(1, 0.55 + 0.4 * f); if (!fe()) st.hold = performance.now() + 55 + 50 * f; } if (!PLAIN) ping({ x: last.x, z: last.z - 1.7 - (pl % 2) * 1.1 }, txt, PART.p, 50, rcol); burst3(last.x, 0, last.z, Math.round(8 + 10 * f), rcol); }
        else if (e.src === 'iso') { const h = heavy(e.iso) || last; if (!PLAIN) ping({ x: h.x, z: h.z - 2.8 }, txt, PART[e.part], 62, PART[e.part]); burst3(h.x, 0, h.z, 14, PART[e.part]); }
        else if (piece) { st.fired[piece] = { t: performance.now(), txt, col: PART[e.part] }; const ko = kitObjs.find(q => q.id === piece); if (ko) { burst3(ko.grp.position.x, 0.2, ko.grp.position.z, big ? 12 : 7, PART[e.part]); if (!PLAIN) st.strokes.push({ a: last, b: { x: ko.grp.position.x, z: ko.grp.position.z - 2.4 }, col: PART[e.part], t: performance.now(), dur: 130 }); } }
        else if (e.src === 'brief') st.floats.push({ txt, t: performance.now(), size: 66, dx: -6, col: PART[e.part] });
        else if (e.src === 'rare') st.floats.push({ txt: t.rare + ' ' + txt, t: performance.now(), size: 74, dx: 6, col: '#b0189a' });
        else if (e.src === 'collect') { st.bump.p = 0; }
        else if (e.src === 'short' && big) ping({ x: last.x, z: last.z - 2.2 }, txt, PART.p, 64, PART.p);
        else if (e.src === 'family' && e.kin === 'resonance') { /* shown by the extra number and the label */ }
        else if (e.src === 'family' && !PLAIN) { const K = P.KIN[e.kin]; ping({ x: last.x + 3.4, z: last.z - 5.2 }, txt, K ? K.col : PART[e.part], 60, K ? K.col : PART[e.part]); }
        else if (e.src === 'tally') { ping({ x: TALLY.x + 1, z: TALLY.z - 1.5 }, txt, PART.p, 60, PART.p); st.struck = performance.now(); }
        else if (e.src === 'homunculus') ping({ x: last.x, z: last.z - 1.6 }, 'again', PART.p, 56, PART.p);
        if (e.src === 'circle') { st.ringT = performance.now(); callout('transmute', '', '#8a6a00'); }
        if (false && PLAIN && !o.casc && e.val && (e.src === 'bottle' || piece || e.src === 'circle' || e.src === 'family' || e.src === 'iso' || e.src === 'row' || e.src === 'route' || e.src === 'short' || e.src === 'brief')) { const ko2 = piece ? kitObjs.find(q => q.id === piece) : null, src = ko2 ? { x: ko2.grp.position.x, z: ko2.grp.position.z + 2.6 } : { x: last.x, z: under() + 0.6 }; st.motes.push({ txt, part: key === 'p' ? 'p' : 'm', col: e.src === 'family' && P.KIN[e.kin] ? P.KIN[e.kin].col : PART[e.part], a: src, t: performance.now() + 120, dur: 380 }); }
        st.shake = Math.max(st.shake, (big ? 0.7 : e.src === 'iso' ? 0.5 : 0.2) * (1 + 1.0 * f));
        if (f >= 0.5 && k % 2 === 0) slash(PART[e.part]);
        if (!o.casc && !fe()) sfx.lock(Math.min(12, k + g.cur.path.length));
      }, when);
    });
    const stepT = o.casc ? stepMs(g.casc || 1) : 0, dur = Math.max(at + 60 + (FOLDS[reagent] && !stepT ? 380 : 0), stepT), lastPlace = placeAt.length ? placeAt[placeAt.length - 1] : 300;
    // every atom sets off for its new position when the reagent reaches the place nearest to it
    { const start = new Map(), cur = new Map(); let end = 0;
      mol.balls.forEach((b, a) => { const q = mol.at.get(a), tt = -q.y / camDir.y, gx = q.x + camDir.x * tt, gz = q.z + camDir.z * tt; let bi = 0, bd = 1e9; marks.forEach((m, k) => { const d = Math.hypot(m.x - gx, m.z - gz); if (d < bd) { bd = d; bi = k; } }); const s0 = placeAt.length ? placeAt[Math.min(bi, placeAt.length - 1)] : 300; start.set(a, s0); cur.set(a, new T.Vector3()); end = Math.max(end, s0 + (FOLDS[reagent] ? 1100 : 480)); });
      morph = { s0: stepT ? stepT * 0.28 : o.self ? 0 : Math.min.apply(null, Array.from(start.values()).concat(1e9)), ms: stepT ? stepT * 0.6 : 0, slow: !!FOLDS[reagent], m: mol, from: from || new Map(), start, cur, t0: performance.now(), end, made: new Set(o.r.made || []) }; }
    st.zoomUntil = performance.now() + lastPlace + 330; st.focus = spot(0);
    // what leaves sets off when the reagent reaches the place nearest to it, and letters change at the same moment
    { const near = p => { let bi = 0, bd = 1e9; marks.forEach((m, k) => { const d = Math.hypot(m.x - p.x, m.z - p.z); if (d < bd) { bd = d; bi = k; } }); return performance.now() + (placeAt.length ? placeAt[Math.min(bi, placeAt.length - 1)] : 300); };
      const t00 = performance.now();
      st.flyers.forEach(f => { if (f.set) return; f.set = true; f.t0 = Math.min(near(f.at), t00 + 260);
        const ev = beats.find(e => e.gone === f.gi && (P.GEARS[e.src] || e.src === 'collect')), ko = ev && P.GEARS[ev.src] ? kitObjs.find(q => q.id === ev.src) : null;
        if (ko) { f.to = new T.Vector3(ko.grp.position.x, 1.6, ko.grp.position.z - 0.6); }
        else { f.to = byTarget(f.kind, f.at); f.keep = ev ? f.kind : null; } }); (mol.groups || []).forEach(q => { if (q.born) q.t = near(q); }); (mol.ghosts || []).forEach(q => { q.t = near(q); }); }
    if (o.casc) { const gn = P.made(g) - before, src = spot(0), t0 = performance.now(); laneGain({ ring: true, sp: spotOf(st.pair), txt: '+' + fmt(gn), a: { x: src.x, z: src.z }, t0: t0 + stepT * 0.03, t: t0 + stepT * 0.14, dur: Math.max(110, stepT * 0.42), to: P.made(g), fresh: !st.cstep || st.cstep.fresh }); }
    const final = () => {
      if (tok !== st.tok) return;
      const now = performance.now(), gain = P.made(g) - before, route = t.ev.find(e => e.src === 'route'), len = g.cur.path.length, size = Math.log10(Math.max(10, gain));
      if (!o.casc && gain > 0 && PLAIN) { const t1 = performance.now(); laneGain({ txt: '+' + fmt(gain), t0: t1, t: t1 + 60, dur: 520, to: P.made(g), fresh: true, gx: spot(0) }); }
      if (!st.gains.length) st.want = P.made(g); st.P = g.P; st.R = g.R; st.E = g.E; st.mult = P.mult(g);
      if (!PLAIN) st.floats.push({ txt: '+' + fmt(gain), t: now, size: 80 + 34 * size, dx: (Math.random() - 0.5) * 3, col: '#8a6a00' });
      st.shake = Math.max(st.shake, 0.4 + 0.35 * size);
      // a hot reaction leaves its mark on the paper for the rest of the round
      if (false) st.stains.push({ x: C0.x + (Math.random() - 0.5) * 30, z: C0.z + (Math.random() - 0.5) * 10, r: 30 + Math.random() * 70, a: 0.03 + Math.random() * 0.04, ring: Math.random() < 0.6 });
      if (route && P.FOUND[route.route] && !meta.found[P.FOUND[route.route]]) { const nid = P.FOUND[route.route]; meta.found[nid] = true; saveMeta(); if (run.extra && !run.extra.includes(nid)) run.extra.push(nid); if (!fe()) { st.floats.push({ txt: 'found ' + RX.CARDS[nid].verb.toLowerCase(), t: now, size: 70, dx: 0, col: P.RARITY.rare.col }); sfx.fanfare(); } }
      if (route && fe()) { /* feel.js */ } else if (route) { callout(AA.rxRun.ROUTE[route.route].tag || AA.rxRun.ROUTE[route.route].name, 'row +' + fmtB(route.val), PART.r); sfx.good(); st.shake = Math.max(st.shake, 1.6); spray(60, PART.r, true); }
      else if (o.finish) { callout('finished', 'extra +' + fmtB(P.SYN.finishExtra * o.r.hits), GREEN); sfx.good(); spray(50, GREEN, true); }

      if (route || o.finish || t.set) { /* named above */ } else if (t.cont && len >= 3) { callout(len + ' in a row', 'row ' + fmtB(g.R), INK); spray(20 * len, INK, true); st.shake = Math.max(st.shake, 0.6 + 0.3 * len); }
      else if (wasOpen && !t.cont && t.held) callout('held', '', PENCIL); else if (wasOpen && !t.cont && !st.gear.includes('ouroboros') && !P.RULE.cascade) callout('row broken', '', PENCIL);
      // passing the number to beat, and each doubling past it
      const m = P.made(g), times = Math.floor(m / st.quota);
      // (the page marks the number being passed at the frame the total crosses it: see frame and passT)
      if (times >= 1 && st.over < times) st.over = times;
      dirty = true;
    };
    ids.push(setTimeout(() => { st.pending = null; final(); }, dur)); st.pending = { ids, final };
    if (stepT) return { dur, unlock: stepT };
    return { dur, unlock: Math.min(dur, st.firing && !FOLDS[reagent] ? (placeAt.length ? placeAt[0] : 160) + 70 : lastPlace + (FOLDS[reagent] ? (st.firing ? Math.max(120, 300 * quick) : 520) : 210)) };
  }
  const molBox = () => { if (!center || !center.balls || !(center.balls.size || center.balls.length)) return null; const sc = center.group.scale.x; let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; center.balls.forEach(b => { const p = b.mesh.position; if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.z < z0) z0 = p.z; if (p.z > z1) z1 = p.z; }); const r = 1.0 * sc, a = px({ x: C0.x + x0 * sc - r, z: C0.z + z0 * sc - r }), b2 = px({ x: C0.x + x1 * sc + r, z: C0.z + z1 * sc + r }); return { l: a[0], t: a[1], r: b2[0], b: b2[1] }; };
  // where a ring's number is written: under the molecule, at the ring, clear of the atoms
  // in the first short runs the uses of a reaction never run out: the rules say so with one of these switches and the drops are not drawn
  const usesHidden = () => !!(P.usesFreeOn && run && P.usesFreeOn(run)) || !!(P.RULE && (P.RULE.infiniteUses || P.RULE.unlimitedUses));
  // The spec: a small hand-drawn mark (marks.js), the number, and how far along as a drawn fill of the mark itself, with a row of pips under it.
  // h is { kind or mark, n, value, met }; o.bare leaves the fill and the pips off (the pair page); o.metT is when it was met (the settle).
  function drawHurdle(g0, cx, cy, h, o) {
    o = o || {}; const M = AA.rxMarks; const key = M && h && M.resolve(h); if (!key) return;
    const c = ink.x, now0 = performance.now(), S = o.size || 104, n = Math.max(0, h.n | 0), val = Math.max(0, +h.value || 0), met = !!h.met, frac = n ? Math.min(1, val / n) : 0, atMost = !!h.max || key === 'few';
    let sc = 1, dy = 0; if (met && o.metT) { const a = (now0 - o.metT) / 560; if (a < 1) { sc = 1 + 0.2 * Math.exp(-5 * a) * Math.cos(a * 12); dy = 12 * Math.exp(-7 * a); dirty = true; } }
    c.save(); c.translate(cx, cy + dy); c.scale(sc, sc); c.translate(-cx, -(cy + dy));
    const col = met ? GREEN : o.lost ? REDINK : INK; if (!(o.goal && !atMost && n >= 1 && n <= 6)) M.draw(c, key, cx, cy + dy, S, { ink: col, faint: FAINT, green: GREEN, red: REDINK, frac: o.bare ? null : frac, met });
    if (o.goal && !atMost && n >= 1 && n <= 6) { const sz = o.gsz || (n <= 3 ? S : S * 0.74), gap2 = sz * (o.gsz ? 1.34 : 1.12); st.goalT = st.goalT || {}; for (let k = 0; k < n; k++) { const have = k < val || met, gx = cx + k * gap2, key2 = key + k; if (have && !st.goalT[key2]) st.goalT[key2] = now0; if (!have) delete st.goalT[key2]; const a2 = have ? (now0 - st.goalT[key2]) / 420 : 9, pp = a2 < 1 ? 1 + 0.3 * Math.exp(-4 * a2) * Math.cos(a2 * 10) : 1; if (a2 < 1) dirty = true;
        c.save(); c.translate(gx, cy + dy); c.scale(pp, pp); c.globalAlpha = have ? 1 : 0.8; M.draw(c, key, 0, 0, sz, { ink: have ? (met ? GREEN : INK) : PENCIL, faint: FAINT, green: GREEN, red: REDINK, frac: have ? 1 : 0, met: have && met }); c.restore();
        if (!have) { c.strokeStyle = PENCIL; c.lineWidth = 3; c.setLineDash([9, 9]); c.beginPath(); c.ellipse(gx, cy + dy, sz * 0.56, sz * 0.5, 0, 0, 6.3); c.stroke(); c.setLineDash([]); } else { c.strokeStyle = met ? GREEN : INK; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(gx + sz * 0.2, cy + dy + sz * 0.3); c.lineTo(gx + sz * 0.34, cy + dy + sz * 0.46); c.lineTo(gx + sz * 0.6, cy + dy + sz * 0.12); c.stroke(); } }
      c.restore(); return; }
     marker(c, S * 0.62); c.textAlign = 'left'; c.fillStyle = col; c.fillText(String(n), cx + S * 0.62, cy + S * 0.22); const w = c.measureText(String(n)).width;
    c.strokeStyle = col; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); const ax = cx + S * 0.62 + w + 16, ay = cy - S * 0.02, cs = S * 0.1; c.lineWidth = 6; if (atMost) { c.moveTo(ax - cs, ay - cs * 0.7); c.lineTo(ax, ay + cs * 0.7); c.lineTo(ax + cs, ay - cs * 0.7); } else { c.moveTo(ax - cs, ay + cs * 0.7); c.lineTo(ax, ay - cs * 0.7); c.lineTo(ax + cs, ay + cs * 0.7); } c.stroke();
    if (!o.bare) { const y = cy + S * 0.66, x0 = cx - S * 0.5, x1 = cx + S * 0.62 + w + 34;
      if (n > 1 && n <= 10) { const gap = Math.min(30, (x1 - x0) / n); for (let k = 0; k < n; k++) { const px0 = x0 + 12 + k * gap; c.beginPath(); c.arc(px0, y, 8, 0, 6.3); if (k < val || met) { c.fillStyle = col; c.fill(); } else { c.lineWidth = 3.5; c.strokeStyle = FAINT; c.stroke(); } } }
      else if (n > 1) { c.lineWidth = 4; c.strokeStyle = FAINT; c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); if (frac > 0 || met) { c.lineWidth = met ? 9 : 7; c.strokeStyle = col; c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + (x1 - x0) * (met ? 1 : frac), y); c.stroke(); } } }
    c.restore();
  }
  // a spec of one part or two (from round 6): each part is drawn as one, side by side
  function drawSpec(g0, cx, cy, sp, o) { if (!sp) return; const ps = sp.parts && sp.parts.length > 1 ? sp.parts : [sp], sz = (o && o.size) || 104, gap = sz * 2.35;
    if (o && o.goal && BENCHV) { /* one row with air between the pictures; they shrink together when there are many, and never reach the printed header */ const row = h => !(h.max) && (h.n | 0) >= 1 && (h.n | 0) <= 6, units = ps.reduce((t, h) => t + (row(h) ? (h.n | 0) * 1.34 : 2.9), 0) + (ps.length - 1) * 0.5, gsz = Math.min(150, (o.room || 500) / units); let x0 = cx;
      ps.forEach(h => { const w = (row(h) ? (h.n | 0) * 1.34 : 2.9) * gsz; drawHurdle(g0, x0 + gsz * 0.67, cy, Object.assign({ kind: h.mark || h.kind }, h), Object.assign({}, o, { gsz, size: gsz * 1.05 })); x0 += w + gsz * 0.5; }); return; } ps.forEach((p, i) => drawHurdle(g0, cx + i * gap, cy, Object.assign({ kind: p.mark || p.kind, name: p.name || (i ? '' : sp.name) }, p), Object.assign({}, o, { metT: o && o.metT && o.metT[i] }))); }
  // The motifs the molecule holds (docs/tools_chem/TRAITS.md "For the page"): g.motifs = { id: level } or { id: { level, pct } }, g.motifMult the product.
  // A column of marks stands at the far side of the stage, never on the molecule: the picture is the count, the level in numerals, the percent under it,
  // and at the head the product as one figure. A level that rises puts a piece on the picture and the numeral bumps; one that falls lets a piece drop away.
  const motLv = v => (v && typeof v === 'object' ? v.level : v) | 0;
  function motifRows(g0, now0, keepGone) {
    const src = (g0 && g0.motifs) || {}, M = AA.rxMarks, mo = st.mo || (st.mo = {}), rows = [], ids = M && M.motifIds || [];
    ids.concat(Object.keys(src).filter(k => ids.indexOf(k) < 0)).forEach(id => {
      const lv = motLv(src[id]), r = mo[id] || (mo[id] = { lv: 0, t: 0, up: null, down: null });
      if (lv > r.lv) { r.up = { k: r.lv, t: now0 }; r.down = null; r.bump = now0; } else if (lv < r.lv) { r.down = { k: lv, t: now0 }; r.up = null; r.bump = now0; }
      r.lv = lv; const anim = (r.up && now0 - r.up.t < 420) || (r.down && now0 - r.down.t < 460); if (lv > 0 || anim) rows.push({ id, lv, r, pct: src[id] && src[id].pct != null ? src[id].pct : Math.round(((M.MOTIFS[id] || { rate: 0 }).rate) * lv * 100) });
    });
    return rows;
  }
  function motifAnim(r, now0) {
    const o = {}; if (r.up && now0 - r.up.t < 420) { const a = (now0 - r.up.t) / 420; o.pop = { k: r.up.k, s: a < 0.6 ? a / 0.6 * 1.25 : 1.25 - 0.25 * (a - 0.6) / 0.4 }; dirty = true; }
    if (r.down && now0 - r.down.t < 460) { o.drop = { k: r.down.k, f: (now0 - r.down.t) / 460 }; dirty = true; } return o;
  }
  function drawMotifs(g0) {
    if (!g0 || !g0.motifs || !AA.rxMarks || !AA.rxMarks.motif) return; const c = ink.x, now0 = performance.now(), rows = motifRows(g0, now0); if (!rows.length) return;
    const cx = [1790, 120], step = 66; rows.length = Math.min(rows.length, 6); const _u = 0, y0 = cx[1] + 66; let mult = g0.motifMult; if (mult == null) mult = rows.reduce((m, q) => m * (1 + q.pct / 100), 1);
    marker(c, 46); c.textAlign = 'center'; c.fillStyle = INK; c.fillText('x' + mult.toFixed(2), cx[0] + 52, cx[1] + 10);
    rows.forEach((q, i) => {
      const y = y0 + i * step, bump = q.r.bump && now0 - q.r.bump < 300 ? 1 + 0.25 * Math.sin((now0 - q.r.bump) / 300 * Math.PI) : 1;
      AA.rxMarks.motif(c, q.id, cx[0], y, q.lv, 64, motifAnim(q.r, now0));
      marker(c, 40 * bump); c.textAlign = 'left'; c.fillStyle = INK; c.fillText(String(q.lv), cx[0] + 44, y + 10); hand(c, 22); c.fillStyle = PENCIL; c.fillText('+' + q.pct + '%', cx[0] + 70, y + 8);
    });
  }
  // the same marks in a row under a molecule on the pair page (b.motifs)
  function drawMotifRow(src, cx0, cy0) {
    if (!src || !AA.rxMarks || !AA.rxMarks.motif) return; const c = ink.x, ids = (AA.rxMarks.motifIds || []).filter(id => motLv(src[id]) > 0); if (!ids.length) return;
    const W = 120, x0 = cx0 - (ids.length - 1) * W / 2; let mult = 1; ids.forEach((id, i) => { const lv = motLv(src[id]), pc = src[id] && src[id].pct != null ? src[id].pct : Math.round(AA.rxMarks.MOTIFS[id].rate * lv * 100); mult *= 1 + pc / 100; AA.rxMarks.motif(c, id, x0 + i * W - 16, cy0, lv, 80, {}); marker(c, 44); c.textAlign = 'left'; c.fillStyle = INK; c.fillText(String(lv), x0 + i * W + 24, cy0 + 12); });
  }
  // gains go through one lane, one at a time: each is shown for a short while, the next waits its turn
  const laneGain = q => { if (fe()) return; const start = Math.max(q.t, st.laneFree || 0), dur = Math.max(260, Math.min(420, q.dur)); q.t0 = start; q.t = start; q.dur = dur; st.laneFree = start + dur + 40; st.gains.push(q); };
  // A reaction is drawn as what it changes: a small ball-and-stick fragment before, an arrow, and the fragment after
  const FBALL = { C: ['#5b667d', 12], O: ['#ff4d4d', 12], Cl: ['#37d67a', 13], H: ['#f4f1e8', 8], N: ['#3f6fe0', 13], S: ['#e8c21e', 14] };
  function fball(c, cx, cy, el, on) { if (ENGR) return eball(c, cx, cy, el); const b = FBALL[el], r = b[1]; c.save(); c.globalAlpha = on ? 1 : 0.38; const gr = c.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.12, cx, cy, r); gr.addColorStop(0, '#ffffffaa'); gr.addColorStop(0.35, b[0]); gr.addColorStop(1, b[0]); c.fillStyle = b[0]; c.beginPath(); c.arc(cx, cy, r, 0, 6.3); c.fill(); if (el === 'H') { c.strokeStyle = '#a9a394'; c.lineWidth = 2.5; c.stroke(); } c.fillStyle = 'rgba(255,255,255,0.38)'; c.beginPath(); c.ellipse(cx - r * 0.32, cy - r * 0.38, r * 0.34, r * 0.22, -0.5, 0, 6.3); c.fill(); c.restore(); }
  function fbond(c, ax, ay, bx, by, n, on) { if (ENGR) return ebond(c, ax, ay, bx, by, n); c.save(); c.globalAlpha = on ? 1 : 0.38; c.strokeStyle = '#7a8296'; c.lineWidth = 5; c.lineCap = 'round'; const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 1, nx = -dy / d * 4, ny = dx / d * 4; c.beginPath(); if (n === 2) { c.moveTo(ax + nx, ay + ny); c.lineTo(bx + nx, by + ny); c.moveTo(ax - nx, ay - ny); c.lineTo(bx - nx, by - ny); } else { c.moveTo(ax, ay); c.lineTo(bx, by); } c.stroke(); c.restore(); }
  const FRAG = {
    'C=C': (c, cx, cy, on) => { fbond(c, cx - 18, cy, cx + 18, cy, 2, on); fball(c, cx - 18, cy, 'C', on); fball(c, cx + 18, cy, 'C', on); },
    'C=O': (c, cx, cy, on) => { fbond(c, cx - 18, cy, cx + 18, cy, 2, on); fball(c, cx - 18, cy, 'C', on); fball(c, cx + 18, cy, 'O', on); },
    'OH': (c, cx, cy, on) => { fbond(c, cx - 26, cy, cx + 4, cy, 1, on); fbond(c, cx + 4, cy, cx + 24, cy - 12, 1, on); fball(c, cx - 26, cy, 'C', on); fball(c, cx + 4, cy, 'O', on); fball(c, cx + 24, cy - 12, 'H', on); },
    'Cl': (c, cx, cy, on) => { fbond(c, cx - 18, cy, cx + 18, cy, 1, on); fball(c, cx - 18, cy, 'C', on); fball(c, cx + 18, cy, 'Cl', on); },
    'CH': (c, cx, cy, on) => { fbond(c, cx - 14, cy, cx + 18, cy, 1, on); fball(c, cx - 14, cy, 'C', on); fball(c, cx + 18, cy, 'H', on); },
    ring: (c, cx, cy, on) => { const p = []; for (let k = 0; k < 5; k++) { const a = -1.5708 + k * 1.2566; p.push([cx + 24 * Math.cos(a), cy + 24 * Math.sin(a)]); } p.forEach((q, k) => fbond(c, q[0], q[1], p[(k + 1) % 5][0], p[(k + 1) % 5][1], 1, on)); p.forEach(q => fball(c, q[0], q[1], 'C', on)); },
    arene: (c, cx, cy, on) => { const p = []; for (let k = 0; k < 6; k++) { const a = -1.5708 + k * 1.0472; p.push([cx + 26 * Math.cos(a), cy + 26 * Math.sin(a)]); } p.forEach((q, k) => fbond(c, q[0], q[1], p[(k + 1) % 6][0], p[(k + 1) % 6][1], k % 2 ? 1 : 2, on)); p.forEach(q => fball(c, q[0], q[1], 'C', on)); },
    // the newer reagents: what each leaves on the molecule, drawn the same way
    NH2: (c, cx, cy, on) => { fbond(c, cx - 22, cy, cx + 8, cy, 1, on); fbond(c, cx + 8, cy, cx + 26, cy - 13, 1, on); fbond(c, cx + 8, cy, cx + 26, cy + 13, 1, on); fball(c, cx - 22, cy, 'C', on); fball(c, cx + 26, cy - 13, 'H', on); fball(c, cx + 26, cy + 13, 'H', on); fball(c, cx + 8, cy, 'N', on); },
    SH: (c, cx, cy, on) => { fbond(c, cx - 24, cy, cx + 6, cy, 1, on); fbond(c, cx + 6, cy, cx + 27, cy - 12, 1, on); fball(c, cx - 24, cy, 'C', on); fball(c, cx + 27, cy - 12, 'H', on); fball(c, cx + 6, cy, 'S', on); },
    diol: (c, cx, cy, on) => { fbond(c, cx - 14, cy + 8, cx + 14, cy + 8, 1, on); fbond(c, cx - 14, cy + 8, cx - 26, cy - 14, 1, on); fbond(c, cx + 14, cy + 8, cx + 26, cy - 14, 1, on); fball(c, cx - 14, cy + 8, 'C', on); fball(c, cx + 14, cy + 8, 'C', on); fball(c, cx - 26, cy - 14, 'O', on); fball(c, cx + 26, cy - 14, 'O', on); },
    '2C=O': (c, cx, cy, on) => { fbond(c, cx - 30, cy + 6, cx - 12, cy - 12, 2, on); fbond(c, cx + 30, cy + 6, cx + 12, cy - 12, 2, on); fball(c, cx - 30, cy + 6, 'C', on); fball(c, cx - 12, cy - 12, 'O', on); fball(c, cx + 30, cy + 6, 'C', on); fball(c, cx + 12, cy - 12, 'O', on); },
    COOH: (c, cx, cy, on) => { fbond(c, cx - 26, cy, cx, cy, 1, on); fbond(c, cx, cy, cx + 16, cy - 18, 2, on); fbond(c, cx, cy, cx + 22, cy + 12, 1, on); fball(c, cx - 26, cy, 'C', on); fball(c, cx, cy, 'C', on); fball(c, cx + 16, cy - 18, 'O', on); fball(c, cx + 22, cy + 12, 'O', on); },
    enone: (c, cx, cy, on) => { fbond(c, cx - 30, cy + 6, cx - 8, cy - 6, 2, on); fbond(c, cx - 8, cy - 6, cx + 12, cy + 6, 1, on); fbond(c, cx + 12, cy + 6, cx + 30, cy - 10, 2, on); fball(c, cx - 30, cy + 6, 'C', on); fball(c, cx - 8, cy - 6, 'C', on); fball(c, cx + 12, cy + 6, 'C', on); fball(c, cx + 30, cy - 10, 'O', on); },
    CHO: (c, cx, cy, on) => { fbond(c, cx - 26, cy + 4, cx - 2, cy + 4, 1, on); fbond(c, cx - 2, cy + 4, cx + 20, cy - 12, 2, on); fbond(c, cx - 2, cy + 4, cx + 16, cy + 20, 1, on); fball(c, cx - 26, cy + 4, 'C', on); fball(c, cx + 16, cy + 20, 'H', on); fball(c, cx - 2, cy + 4, 'C', on); fball(c, cx + 20, cy - 12, 'O', on); },
    epox: (c, cx, cy, on) => { fbond(c, cx - 18, cy + 10, cx + 18, cy + 10, 1, on); fbond(c, cx - 18, cy + 10, cx, cy - 16, 1, on); fbond(c, cx + 18, cy + 10, cx, cy - 16, 1, on); fball(c, cx - 18, cy + 10, 'C', on); fball(c, cx + 18, cy + 10, 'C', on); fball(c, cx, cy - 16, 'O', on); },
    chain: (c, cx, cy, on) => { const p = [[-30, 8], [-10, -8], [10, 8], [30, -8]]; p.forEach((q, k) => { if (k) fbond(c, cx + p[k - 1][0], cy + p[k - 1][1], cx + q[0], cy + q[1], 1, on); }); p.forEach(q => fball(c, cx + q[0], cy + q[1], 'C', on)); },
    cage: (c, cx, cy, on) => { const p = [[-18, -18], [18, -18], [18, 18], [-18, 18]]; p.forEach((q, k) => fbond(c, cx + q[0], cy + q[1], cx + p[(k + 1) % 4][0], cy + p[(k + 1) % 4][1], 1, on)); fbond(c, cx - 18, cy - 18, cx + 18, cy + 18, 1, on); fbond(c, cx + 18, cy - 18, cx - 18, cy + 18, 1, on); p.forEach(q => fball(c, cx + q[0], cy + q[1], 'C', on)); }
  };
  function fragOrChip(c, tok, cx, cy, on) { if (FRAG[tok]) { c.save(); c.translate(cx, cy); c.scale(1.45, 1.45); FRAG[tok](c, 0, 0, on); c.restore(); return; } chip(c, tok, cx, cy, on); }
  const spotOf = pr => (pr && pr.a && pr.b && center ? { x: C0.x + (pr.a.x + pr.b.x) / 2 * center.group.scale.x, z: C0.z + (pr.a.z + pr.b.z) / 2 * center.group.scale.x } : null);
  const ringAt = () => { const bx = molBox(), T0 = px(MADE); if (!bx) return null; return [(bx.l + bx.r) / 2, bx.b + 70, T0, bx]; };
  function pick(i) { sfxN('click');
    const s = slots[i], o = s && s.o;
    if (P.RULE.queue && g && !g.chain) { if (!s || st.mode !== 'play' || g.shot) return; if (!P.queueAdd(g, s.id)) { sfx.bad(); return; } (AA.sfx.queue ? AA.sfx.queue(g.queue.length - 1) : sfx.lock(g.queue.length)); st.qT = performance.now(); refresh(); bottlePick(s.id, g.pageSteps + g.queue.length - 1); return; }
    if (!o || !prods[i] || st.mode !== 'play') return;
    const link = !!g.chain; st.chainN = link ? (st.chainN || 0) + 1 : 0; react(o, s.id, s.fin, LAB[i] ? { x: LAB[i].x - 0.8, z: LAB[i].z + 0.5 } : { x: C0.x, z: -9 }, link);
  }
  // The bank, the redraw and the turn of a page on which nothing acts. Each is one click on a mark on the page.
  const BANK = { x: STEP.x + 0.2, z: STEP.z + 2.45 }, DRAW = SHP ? SHP.draw : { x: 16.6 + (PGE.on ? PGE.rx : 0), z: -9.0 };
  const lining = () => P.RULE.queue && st.mode === 'play' && !!g && !g.over && !g.chain && !g.shot;
  const bankAt = () => st.mode === 'play' && g && (lining() || P.canBank(g)) && hit.x > BANK.x - 1.4 && hit.x < BANK.x + 5 && Math.abs(hit.z - BANK.z) < 1.2;
  // the reaction arrow after the circles fires the page; a click on a filled circle takes its reagent back
  const FIREP = () => (SHAPE === 'b' ? { x: STEP.x + 3 * STEPD + 2.4, z: STEP.z + 0.2 } : { x: STEP.x + STEPD + 0.2, z: STEP.z + 3.9 });
  const fireAt = () => lining() && Math.abs(hit.x - FIREP().x) < 3.4 && Math.abs(hit.z - FIREP().z) < 1.4;
  const circleAt = () => { if (!lining()) return -1; for (let k = 0; k < g.queue.length; k++) if (Math.abs(hit.x - (STEP.x + (g.pageSteps + k) * STEPD)) < 1.5 && Math.abs(hit.z - STEP.z) < 1.5) return k; return -1; };
  function doUnqueue(k) { if (!lining() || !P.queueDrop(g, k < 0 ? g.queue.length - 1 : k)) return; sfx.feed(); refresh(); }
  function bankNow() { const gain = P.bankGain(g); P.bank(g); st.want = P.made(g); st.P = g.P; st.R = g.R; st.E = g.E; st.mult = P.mult(g); st.bump.p = 1; st.madeBump = 1; st.chainN = 0; if (center) center.hot = []; st.motes.push({ txt: '+' + fmt(gain), part: 'p', col: '#8a6a00', a: { x: STEP.x + (g.pageSteps - 1) * STEPD, z: STEP.z - 1 }, t: performance.now(), dur: 420 }); sfx.good(); st.shake = Math.max(st.shake, 0.5); }
  function doFire() { if (!lining()) return; if (AA.sfx.fire) AA.sfx.fire(); toolOff(); flush(); setHover(-1); st.firing = true; st.fireN = 0; st.acted = false; st.rezip = false; st.seeded = false; st.chainN = 0; g.shot = true; slots = []; prods.forEach(m => { if (m) freeMol(m); }); prods = []; if (FEEL && FEEL.on()) FEEL.fire(fireNext); else fireNext(); }
  // A piece that acts on the molecule or the page is shown acting: it hops, as a piece does when it fires
  const pieceActs = id => { st.fired[id] = { t: performance.now(), txt: '', col: INK }; const k = kitObjs.find(q => q.id === id); if (k) st.strokes.push({ a: { x: k.hx, z: k.hz + 4.3 }, b: { x: C0.x + (k.hx - C0.x) * 0.25, z: C0.z - 3.2 }, col: '#2f78a0', t: performance.now(), dur: 300 }); sfx.lock(6); dirty = true; };
  // ---------- a piece used on the molecule ----------
  // A click on a piece that can still be used this round picks it up. The places it can go are then dotted on the
  // page under the molecule, the one under the pointer shows what would happen there, and a click does it. A piece
  // that acts on the whole molecule shows everything it would change, and a click anywhere on the molecule does it.
  const toolAt = () => { if (!lining() || !g) return null; for (const k of kitObjs) if (P.canTool(g, k.id) && Math.abs(hit.x - k.hx) < 1.9 && hit.z > k.hz - 3.8 && hit.z < k.hz + 3.4) return k.id; return null; };
  const toolPt = a => { const mk = a && a.el !== 'H' ? marksOf(center, [a], 0.01, 0.2)[0] : null; return mk ? { x: mk.x, z: mk.z } : null; };
  const toolOff = () => { if (st.tool) dirty = true; st.tool = null; st.toolList = null; st.toolSpot = null; };
  function toolArm(id) {
    if (st.tool === id) return toolOff();
    const G = P.GEARS[id], md = center.model, side = (a, b) => { const S = new Set([a]), q = [a]; while (q.length) { const u = q.pop(); md.neighbors(u).forEach(n => { const v = n.atom; if (v.el === 'H' || S.has(v) || (u === a && v === b)) return; S.add(v); q.push(v); }); } return Array.from(S); };
    st.tool = id; st.toolSpot = null;
    st.toolList = P.toolSpots(g, id).map(sp => { const at = RX.tools.at(sp).map(toolPt).filter(Boolean); if (!at.length) return null; let x = 0, z = 0; if (sp.b && at.length === 2) { x = at[0].x * 0.72 + at[1].x * 0.28; z = at[0].z * 0.72 + at[1].z * 0.28; } else at.forEach(q => { x += q.x / at.length; z += q.z / at.length; });
      const it = { sp, x, z, at, whole: !!G.whole };
      if (sp.runs) it.gone = [].concat.apply([], sp.runs.map(r => r.slice(1, -1))).map(toolPt).filter(Boolean);
      if (sp.pairs) it.at = sp.pairs.map(q => toolPt(q[0])).filter(Boolean);
      if (sp.ols) it.words = sp.ols.map(() => 'C=O').concat(sp.ones.map(() => 'OH'));
      { const ga = sp.runs ? [].concat.apply([], sp.runs.map(r => r.slice(1, -1))) : sp.b ? side(sp.b, sp.a) : null; if (ga) { const gs = new Set(ga); it.goneB = md.bonds.filter(k => k.a.el !== 'H' && k.b.el !== 'H' && (gs.has(k.a) || gs.has(k.b))).map(k => [toolPt(k.a), toolPt(k.b)]).filter(q => q[0] && q[1]); } }
      return it; }).filter(Boolean);
    // what each place is worth is worked out once, when the piece is picked up: the steps the molecule would zip with the piece used there
    if (id === 'crystal' || id === 'mirror') st.toolList.forEach(it => { try { it.worth = Math.max(0, P.toolWorth(g.m, id, it.sp, g.self)); } catch (e) { it.worth = null; } });
    if (!st.toolList.length) { toolOff(); sfx.bad(); } else sfx.click(); dirty = true;
  }
  // the mirror's ghost: the molecule as it would be, laid out as it will be, to be drawn in faint ink where it will stand
  function ghostOf(it) {
    try { const cm = RX.cloneMap(g.m), sp = { a: cm.map.get(it.sp.a), b: cm.map.get(it.sp.b), n: it.sp.n }, res = RX.tools.apply(cm.model, 'mirror', sp); if (!res) return null; RX.reopen(cm.model);
      const seed = new Map(), live = new Set(cm.model.atoms); cm.map.forEach((na, oa) => { const q = center.at.get(oa); if (q && center.balls.has(oa) && live.has(na)) seed.set(na, q); }); if (center.at.fold) seed.fold = { dir: center.at.fold.dir };
      const gm = buildMol(cm.model, null, false, seed.size ? seed : null, new Map()), down = a => { const p = gm.at.get(a), t = -p.y / camDir.y; return { x: p.x + camDir.x * t, z: p.z + camDir.z * t }; }, made = new Set(res.made || []), out = { sc: fitMain(gm), bonds: [], os: [], join: null };
      gm.sticks.forEach(q => { if (q.a.el === 'H' || q.b.el === 'H') return; const e = [down(q.a), down(q.b)]; if ((q.a === sp.a && made.has(q.b)) || (q.b === sp.a && made.has(q.a))) out.join = e; else out.bonds.push(e); });
      gm.balls.forEach((b, a) => { if (a.el === 'O') out.os.push(down(a)); }); freeMol(gm); return out; } catch (e) { return null; }
  }
  function toolHover() { if (!st.tool || !st.toolList || !center) return; const sc = center.group.scale.x; let best = null, bd = 1.6; st.toolList.forEach(q => { const d = q.whole ? (Math.abs(hit.x - C0.x) < 11 && Math.abs(hit.z - C0.z) < 5.5 ? 0 : 9) : Math.hypot(hit.x - (C0.x + q.x * sc), hit.z - (C0.z + q.z * sc)); if (d < bd) { bd = d; best = q; } }); if (best !== st.toolSpot) { st.toolSpot = best; if (best && best.sp.b && best.ghost === undefined) best.ghost = null; dirty = true; } }
  function doTool() {
    sfxN('instrument'); const id = st.tool, it = st.toolSpot; toolOff(); if (!it || !P.toolUse(g, id, it.sp)) { sfx.bad(); return; }
    setHover(-1); pieceActs(id); reopenShow(); sfx.good(); st.shake = Math.max(st.shake, 0.5); const tok = st.tok; st.mode = 'move';
    if (g.toolRun) { g.toolRun = false; st.starting = true; st.firing = true; st.rezip = true; st.acted = false; st.chainN = 0; setTimeout(() => { if (tok === st.tok) fireNext(); }, 420); }
    else setTimeout(() => { if (tok !== st.tok) return; st.mode = 'play'; refresh(); }, 360);
  }
  // What a page does by itself before any reagent (the burette adds a link, the seed crystal starts the zip) is played
  // one step at a time, like a cascade, before the page can be lined up
  function startPage() { if (!g || g.over || !g.startTodo || !g.startTodo.length) return false; const tok = st.tok; st.mode = 'move'; st.starting = true; setTimeout(() => { if (tok !== st.tok) return; st.firing = true; st.acted = false; st.chainN = 0; fireNext(); }, 420); return true; }
  // the recycler has opened the rings: the molecule on the page springs open from where its atoms stood
  function reopenShow() {
    flush(); const prev = center, mp = g.reopened && g.reopened.map, seed = new Map(); if (mp) mp.forEach((na, oa) => { const q = prev.at.get(oa); if (q && prev.balls.has(oa)) seed.set(na, q); }); if (prev.at.fold) seed.fold = { dir: prev.at.fold.dir };
    if (g.m.settle && g.m.atoms.some(a => a.slime) && caged(g.m, archesOf(g.m))) g.m.settle(500);
    const nm = buildMol(g.m, null, false, seed.size ? seed : null, new Map()); place(nm, C0, st.sc); const from = new Map(), start = new Map(), cur = new Map(); seed.forEach((q, na) => { if (nm.balls.has(na)) from.set(na, q.clone()); }); nm.balls.forEach((b, a) => { start.set(a, 0); cur.set(a, new T.Vector3()); });
    nm.sticks.forEach(q => { const fa = from.get(q.a), fb = from.get(q.b), ta = nm.at.get(q.a), tb = nm.at.get(q.b); q.old = !!(fa && fb && ta && tb && fa.distanceTo(fb) < 1.4 * ta.distanceTo(tb)); }); tweens = tweens.filter(tw => tw.m !== prev); freeMol(prev); center = nm; SC_MAIN = fitMain(nm); nm.hot = []; nm.groups = groupsOf(nm); nm.ghosts = []; nm.marks = [];
    morph = { s0: 0, ms: 0, slow: false, m: nm, from, start, cur, t0: performance.now(), end: 260, made: new Set() }; dirty = true;
    if (mp) { morph.bend = bendOf(prev, nm, mp, from); if (morph.bend) morph.end = 440; }
    // what the piece drove off: each a small molecule of its own, set where it left from, on its way to where it is kept
    if (mp && g.reopened.gone && g.reopened.gone.length) { const rev = new Map(); mp.forEach((na, oa) => rev.set(na, oa)); const t00 = performance.now(); g.reopened.gone.forEach((grp0, gi) => { const kind = P.byKind(grp0); const p = flyer(grp0, gi, kind, a => rev.get(a), prev, null); const f = st.flyers[st.flyers.length - 1]; f.set = true; f.t0 = t00 + 60 + gi * 40; f.to = byTarget(kind); f.keep = kind === 'water' || kind === 'h2' ? kind : null; }); g.reopened.gone = []; }
  }
  // one thing that has left the molecule, as a small molecule of its own standing where it left from
  function flyer(grp0, gi, kind, back, prev, nm) {
    if (REALOFF) { try { const p0 = flyerReal(grp0, gi, kind, back, prev, nm); if (p0) return p0; } catch (e) { /* drawn the old way */ } }
    const grp = new T.Group(), els = kind === 'water' ? ['O', 'H', 'H'] : kind === 'h2' ? ['H', 'H'] : grp0.map(a => a.el).sort((a, b) => (a === 'H') - (b === 'H')).slice(0, 3), hub = els[0] !== 'H';
    const RO = { water: 'ro_water', h2: 'ro_h2', co2: 'ro_co2', chloride: 'ro_acid', acid: 'ro_acid', nh3: 'ro_nh3', ammonia: 'ro_nh3', tma: 'ro_nh3', trimethylamine: 'ro_nh3', amine: 'ro_nh3', sulfur: 'ro_sulfur', sulfide: 'ro_sulfur', so2: 'ro_sulfur', fumes: 'ro_acid', hcl: 'ro_acid', 'acid fumes': 'ro_acid' }[kind], roIn = RO ? new T.Group() : null; if (roIn && AA.rxKit.build(RO, T, roIn, new T.Color(0xffffff))) { roIn.scale.setScalar(0.5); roIn.position.y = 0.6; grp.add(roIn); } else els.forEach((el, k) => { const side = k % 2 ? -1 : 1, px0 = hub ? (k ? side * 0.78 : 0) : side * 0.36, py = hub && k ? 0.5 : 0; add(SPH, ballMat(el), px0, py, 0, grp).scale.setScalar(BALL(el)); });
    const srcA = grp0.map(back).find(a => a && prev.balls.has(a)), p = srcA ? prev.at.get(srcA) : nm && nm.marks[0] ? { x: nm.marks[0].x, y: 0.6, z: nm.marks[0].z } : { x: 0, y: 0.6, z: 0 };
    grp.position.set(C0.x + p.x * st.sc, p.y * st.sc, C0.z + p.z * st.sc); grp.scale.setScalar(st.sc); scene.add(grp);
    st.flyers.push({ grp, gi, kind, at: { x: p.x, z: p.z }, from: grp.position.clone(), to: byTarget(kind), t0: performance.now() + 200, dur: 400, spin: gi % 2 ? 1.2 : -1.2 });
    return p;
  }
  // What leaves is drawn as what it is (ruling AL3): the atoms the step record says left, in the molecule's own balls and sticks,
  // with their hydrogens as small white atoms, standing where they stood on the molecule. No icon and no coloured puff.
  // feel.js (flyReal) lifts it off, lets it drift and fades it, or drops it in its jar when one is collecting that runoff. ?real=0 brings the icons back.
  const REALOFF = (() => { try { return new URLSearchParams(root.location.search).get('real') !== '0'; } catch (e) { return true; } })();
  // each small molecule flat on the page, its main atom at the middle and its hydrogens pointing up the page (turned to point away from the molecule)
  const REALT = {
    water: { a: [['O', 0, 0], ['H', -0.8, -0.62], ['H', 0.8, -0.62]], b: [[0, 1, 1], [0, 2, 1]] },
    hydrogen: { a: [['H', -0.4, 0], ['H', 0.4, 0]], b: [[0, 1, 1]] },
    carbon_dioxide: { a: [['C', 0, 0], ['O', -1.25, 0], ['O', 1.25, 0]], b: [[0, 1, 2], [0, 2, 2]] },
    acid_fumes: { a: [['Cl', 0, 0], ['H', 0, -1.2]], b: [[0, 1, 1]] },
    ammonia: { a: [['N', 0, 0], ['H', 0, -1.05], ['H', 0.91, 0.52], ['H', -0.91, 0.52]], b: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
    sulfur: { a: [['S', 0, 0], ['H', -0.95, -0.85], ['H', 0.95, -0.85]], b: [[0, 1, 1], [0, 2, 1]] },
    so2: { a: [['S', 0, 0], ['O', -1.2, -0.75], ['O', 1.2, -0.75]], b: [[0, 1, 2], [0, 2, 2]] },
    o2: { a: [['O', -0.62, 0], ['O', 0.62, 0]], b: [[0, 1, 2]] }
  };
  ['h2:hydrogen', 'co2:carbon_dioxide', 'chloride:acid_fumes', 'hcl:acid_fumes', 'acid:acid_fumes', 'fumes:acid_fumes', 'nh3:ammonia', 'sulfide:sulfur', 'h2s:sulfur', 'oxygen:o2'].forEach(q => { const k = q.split(':'); REALT[k[0]] = REALT[k[1]]; });
  const realRad = el => BALL(el) * (el === 'N' || el === 'S' || el === 'Cl' ? 1.3 : 1) * (el === 'H' ? 0.92 : 1);
  // the small molecule a leaving group is: by what the step says went off (grp.off), else by its atoms, else the atoms themselves in a row
  function realShape(grp0, kind) {
    const key = grp0 && grp0.off ? Object.keys(grp0.off)[0] : null, els = grp0.map(a => a.el), hv = els.filter(e => e !== 'H').sort().join('');
    if (key && REALT[key]) return REALT[key]; if (REALT[kind]) return REALT[kind];
    const by = { O: 'water', N: 'ammonia', S: 'sulfur', Cl: 'acid_fumes', '': 'hydrogen', COO: 'carbon_dioxide', OO: 'o2', OOS: 'so2' }[hv]; if (by) return REALT[by];
    const heavy = els.filter(e => e !== 'H'), a = heavy.map((e, i) => [e, (i - (heavy.length - 1) / 2) * 1.3, 0]), b = []; for (let i = 1; i < heavy.length; i++) b.push([i - 1, i, 1]); return { a, b };
  }
  function flyerReal(grp0, gi, kind, back, prev, nm) {
    const shape = realShape(grp0, kind), olds = grp0.map(back).filter(Boolean), gone = new Set(olds), main = shape.a[0][0];
    // the atom of the group that was drawn on the molecule, and the atom it was bonded to that stays
    const srcA = olds.find(a => prev.balls.has(a) && a.el === main) || olds.find(a => prev.balls.has(a)); let ancOld = null, order = 1;
    if (srcA) prev.model.bonds.forEach(bd => { const o2 = bd.a === srcA ? bd.b : bd.b === srcA ? bd.a : null; if (o2 && !gone.has(o2) && o2.el !== 'H' && prev.balls.has(o2) && !ancOld) { ancOld = o2; order = bd.order || 1; } });
    let anc = null; if (ancOld && nm) nm.balls.forEach((b, a) => { if (!anc && back(a) === ancOld) anc = a; });
    const p = srcA ? prev.at.get(srcA) : nm && nm.marks[0] ? { x: nm.marks[0].x, y: 0.6, z: nm.marks[0].z } : { x: 0, y: 0.6, z: 0 }, pa = ancOld ? prev.at.get(ancOld) : null;
    // turned so that its hydrogens point away from the atom it leaves
    let dx = 0, dz = -1; if (pa) { const L = Math.hypot(p.x - pa.x, p.z - pa.z); if (L > 0.05) { dx = (p.x - pa.x) / L; dz = (p.z - pa.z) / L; } }
    const grp = new T.Group(), mats = [], mk = {}, mat = (f, el) => { const k = (f === ballMat ? 'b' : 's') + el; if (!mk[k]) { mk[k] = f(el).clone(); mk[k].transparent = true; mats.push(mk[k]); } return mk[k]; }, edgeM = () => { if (!mk.edge) { mk.edge = hEdge.clone(); mk.edge.transparent = true; mats.push(mk.edge); } return mk.edge; };
    const pts = shape.a.map(q => new T.Vector3(-q[1] * dz - q[2] * dx, 0, q[1] * dx - q[2] * dz)), hs = [], sprites = [], cd = camDir.clone();
    shape.b.forEach(q => { const A = pts[q[0]], B = pts[q[1]], u = B.clone().sub(A), len = u.length(), mid = A.clone().add(B).multiplyScalar(0.5), perp = new T.Vector3().crossVectors(u.clone().normalize(), cd).normalize(), qt = new T.Quaternion().setFromUnitVectors(UP, u.clone().normalize());
      (q[2] > 1 ? [-0.5, 0.5] : [0]).forEach(f => [0, 1].forEach(h => { const fr = h ? mid : A, to = h ? B : mid, hq = shape.a[q[0]][0] === 'H' || shape.a[q[1]][0] === 'H', m = add(CYL, hq ? mat(ballMat, 'H') : mat(stickMat, shape.a[q[h]][0]), 0, 0, 0, grp), rr = q[2] > 1 ? 0.06 : 0.09; if (hq) { const ed = new T.Mesh(CYL, edgeM()), fq = 1 + HOUT * realRad('H') / rr; ed.scale.set(fq, 1, fq); ed.castShadow = false; m.add(ed); } m.position.copy(fr).add(to).multiplyScalar(0.5).addScaledVector(perp, f * 0.36); m.quaternion.copy(qt); m.scale.set(rr, fr.distanceTo(to), rr); if (shape.a[q[0]][0] === 'H' || shape.a[q[1]][0] === 'H') hs.push({ mesh: m, s: m.scale.clone(), at: pts[shape.a[q[0]][0] === 'H' ? q[1] : q[0]].clone(), p: m.position.clone() }); })); });
    shape.a.forEach((q, i) => { const R = realRad(q[0]), m = add(SPH, mat(ballMat, q[0]), pts[i].x, 0, pts[i].z, grp); m.scale.setScalar(R); if (q[0] === 'H') { const ed = new T.Mesh(SPH, edgeM()); ed.scale.setScalar(1 + HOUT); ed.castShadow = false; m.add(ed); } if (q[0] === 'H') hs.push({ mesh: m, s: m.scale.clone(), at: pts[shape.b.length ? (shape.b.find(k => k[1] === i) || [0])[0] : 0].clone(), p: m.position.clone() });
      else if (q[0] !== 'C') { const sm = letterMat(q[0]).clone(); sm.transparent = true; mats.push(sm); const sp = new T.Sprite(sm); sp.position.copy(pts[i]).addScaledVector(cd, -R * 1.04); sp.scale.setScalar(R * (q[0] === 'N' || q[0] === 'S' || q[0] === 'Cl' ? 2.0 : 1.6)); grp.add(sp); sprites.push({ sp, c: pts[i].clone(), d: R * 1.04 }); } });
    const wp = srcA && prev.balls.has(srcA) ? prev.balls.get(srcA).mesh.getWorldPosition(new T.Vector3()) : new T.Vector3(C0.x + p.x * st.sc, p.y * st.sc, C0.z + p.z * st.sc), ws = prev.group ? prev.group.scale.x : st.sc;
    grp.position.copy(wp); grp.scale.setScalar(ws); scene.add(grp);
    // what it is counted as (the step says, as path.js counts it), and whether a jar on the page is collecting that
    const kind2 = grp0.off ? ({ water: 'water', hydrogen: 'h2', carbon_dioxide: 'co2', acid_fumes: 'chloride' })[Object.keys(grp0.off)[0]] || kind : kind, kOn = !P.RULE.bare && P.stageOf(meta) >= 2 && JARK.includes(kind2) && !!jarPos(kind2);
    st.flyers.push({ grp, gi, kind: kind2, at: { x: p.x, z: p.z }, from: grp.position.clone(), to: byTarget(kind2), t0: performance.now() + 200, dur: 400, spin: 0,
      real: { mats, hs, sprites, anchor: anc, off: pa ? new T.Vector3(p.x - pa.x, p.y - pa.y, p.z - pa.z) : null, dir: new T.Vector3(dx, 0, dz), els: [ancOld ? ancOld.el : 'C', main], order, jar: kOn, shape, stick: anc ? [CYL, stickMat(ancOld.el), stickMat(main)] : null } });
    return p;
  }
  // the next thing in the queue has its turn. When the queue is empty the page overreacts if its row held, or turns
  function fireNext() {
    { const s0 = st.starting && !g.over ? P.startDue(g) : null; if (s0) { const k = kitObjs.find(q => q.id === s0.by); if (s0.by) pieceActs(s0.by); if (s0.casc) { st.chainN = (st.chainN || 0) + 1; if (s0.model.settle && caged(s0.model, archesOf(s0.model))) s0.model.settle(500); } return react(s0, s0.id, false, k ? { x: k.hx, z: k.hz + 2.6 } : { x: C0.x, z: C0.z - 2 }, true); } }
    // the cascade: whatever the molecule can do to itself happens first, one step at a time, each quicker than the last.
    // The seed crystal holds it until the line is empty and then starts it whatever the reagents did
    { const end = P.cascMode(g) === 'end', c = g.over ? null : st.rezip ? P.cascadeNext(g) : st.starting ? null : st.acted || end ? P.cascadeDue(g) : null;
      if (c) { if (end && !st.rezip && !st.seeded) { st.seeded = true; pieceActs('crystal'); } if (c.by) pieceActs(c.by); st.chainN = (st.chainN || 0) + 1; const n = (g.casc || 0) + 1; st.cstep = { n, name: KINDNAME[c.id] || c.id, t: performance.now(), fresh: !P.RULE.fresh || n > (g.cascBest || 0) }; st.fly = null; if (c.model.settle && caged(c.model, archesOf(c.model))) c.model.settle(500); return react(c, c.id, false, { x: C0.x, z: C0.z - 2 }, true); }
      st.rezip = false;
      // the mirror, the recycler: the rings spring open and the chain zips again
      if (!g.over && !st.starting) { const by = P.again(g); if (by) { const tk = st.tok; pieceActs(by); reopenShow(); st.rezip = true; st.mode = 'move'; setTimeout(() => { if (tk === st.tok) fireNext(); }, 430); return; } } }
    let h = P.queueHead(g); const tok = st.tok;
    if (st.starting) { st.firing = false; st.starting = false; if (g.over) return; st.mode = 'play'; refresh(); if (!slots.some(q => q && q.o) && !P.canRedraw(g) && !P.canBank(g) && !g.queue.length && !kitObjs.some(k => P.canTool(g, k.id))) { st.mode = 'move'; setTimeout(() => { if (tok !== st.tok) return; st.mode = 'play'; nextPage(); }, 350); } return; }
    if (!h) { st.firing = false; if (g.over) return; if (P.charged(g)) { st.mode = 'fuse'; st.fuseT = performance.now(); dirty = true; setTimeout(() => { if (st.tok === tok && st.mode === 'fuse') setOff(); }, 280); return; } st.mode = 'play'; if (homOffer()) return; return fe() ? FEEL.pageEnd(nextPage) : nextPage(); }
    P.queueShift(g); st.fireN = (st.fireN || 0) + 1; st.acted = h.kind === 'take';
    if (h.kind === 'take' || h.kind === 'finish') { const go = () => react(h.o, h.id, h.kind === 'finish', { x: STEP.x + g.pageSteps * STEPD, z: STEP.z }, false); return fe() ? FEEL.throwThen(h, go) : go(); }
    const wait = 160; if (h.kind === 'bank') bankNow(); else { P.waste(g, h.id); if (AA.sfx.wasted) AA.sfx.wasted(); else sfx.bad(); st.shake = Math.max(st.shake, 0.3); }
    st.mode = 'move'; dirty = true; setTimeout(() => { if (tok === st.tok) fireNext(); }, wait);
  }

  // The homunculus (docs/JARS.md). When it has been fed and the page has fired, the page waits: a click on the figure
  // sets it off (hydrogen with more than one place: a click on the place), the turn arrow leaves it. The next deal
  // is not on the page yet. homOffer says whether the page is waiting.
  function homListOf() {
    const id = g.hom.id, H = P.HOMS[id], pre = !!H.before, base0 = pre ? (() => { try { return P.selfRun(RX.cloneModel(g.m), g.self); } catch (e) { return 0; } })() : 0;
    return P.homSpots(g).map(sp => { const it = { sp, whole: !!H.whole, x: 0, z: 0, at: [], bonds: [] };
      if (sp.pairs) sp.pairs.forEach(q => { const A = toolPt(q[0]), B = toolPt(q[1]); if (A && B) { it.bonds.push([A, B]); it.at.push({ x: (A.x + B.x) / 2, z: (A.z + B.z) / 2 }); } });
      if (sp.runs) sp.runs.forEach(run => { for (let k = 1; k + 2 < run.length; k++) { const A = toolPt(run[k]), B = toolPt(run[k + 1]); if (A && B) it.bonds.push([A, B]); } });
      if (sp.c && sp.o) { const A = toolPt(sp.c), B = toolPt(sp.o); if (A && B) { it.bonds.push([A, B]); it.at.push(B); it.x = B.x; it.z = B.z; } }
      else if (sp.c) { const A = toolPt(sp.c); if (A) { it.at.push(A); it.x = A.x; it.z = A.z; } }
      if (sp.rings) frostOf(center.model, sp.rings.map(q => q[0])).forEach(ring => ring.forEach((a, k) => { const A = toolPt(a), B = toolPt(ring[(k + 1) % ring.length]); if (A && B) it.bonds.push([A, B]); }));
      if (sp.rings || sp.all) it.worth = null; else try { const t = P.homTry(g.m, id, sp); it.worth = t ? Math.max(0, P.selfRun(t, g.self) - base0) : 0; } catch (e) { it.worth = null; } return it; });
  }
  function homOffer() {
    if (!g || g.over || !g.hom || P.HOMS[g.hom.id].before || !P.homReady(g) || !center || center.model !== g.m) return false;
    const base = g.casc || 0, list = homListOf();
    if (!list.length) { st.homNone = true; dirty = true; return false; }
    st.homWait = true; st.homPre = false; st.homList = list; st.homSpot = null; st.homHover = false; st.homBase = base; st.firing = false; dirty = true; return true;
  }
  // A creature tapped before the page is lined up (salt, wood spirit): a click on the figure while it is lit. The
  // wood spirit acts at once and the page fires; the salt shows its places and waits for one, and the go arrow leaves it
  const homPreAt = () => lining() && !!g.hom && !!P.HOMS[g.hom.id].before && !st.homWait && homAt() && !!center && center.model === g.m && P.homLit(g);
  function homPre() {
    const id = g.hom.id, H = P.HOMS[id]; toolOff(); setHover(-1);
    if (!H.whole) { const list = homListOf(); if (!list.length) { sfx.bad(); return; } st.homWait = true; st.homPre = true; st.homList = list; st.homSpot = null; st.homHover = false; sfx.click(); dirty = true; return; }
    if (!P.homUse(g, P.homSpots(g)[0])) { sfx.bad(); return; }
    st.homAct = { t: performance.now(), to: { x: C0.x - 5.5, z: C0.z + 1.6 }, id }; sfx.drift(); reopenShow(); refresh(); const tok = st.tok; st.mode = 'move';
    setTimeout(() => { if (tok !== st.tok) return; st.mode = 'play'; refresh(); doFire(); }, 430);
  }
  const homAt = () => !!homObj && Math.abs(hit.x - HOMP.x) < (BENCHV === 'a' ? 4.4 : 2.2) && hit.z > HOMP.z - (BENCHV === 'a' ? 9 : 4.2) && hit.z < HOMP.z + 2.6;
  const homTurnAt = () => !!st.homWait && Math.abs(hit.x - FIREP().x) < 2.2 && Math.abs(hit.z - STEP.z) < 1.4;
  function homPoint() { if (!st.homWait || !st.homList) return; const sc = center.group.scale.x, on = homAt(); let best = null, bd = 1.7; if (st.homList.length > 1) st.homList.forEach(q => { const d = Math.hypot(hit.x - (C0.x + q.x * sc), hit.z - (C0.z + q.z * sc)); if (d < bd) { bd = d; best = q; } }); if (on !== st.homHover || best !== st.homSpot) { st.homHover = on; st.homSpot = best; dirty = true; } }
  function homSkip() { if (!st.homWait) return; if (st.homPre) { st.homWait = false; st.homPre = false; st.homList = null; st.homSpot = null; sfx.feed(); dirty = true; return; } st.homWait = false; st.homList = null; sfx.feed(); st.mode = 'play'; nextPage(); }
  const actTo = (id, to) => (id === 'seedling' || id === 'co2' || id === 'slime' ? { x: HOMP.x, z: HOMP.z + 0.6 } : id === 'wood' ? { x: (SHP ? SHP.bt : 40) - 8.5, z: -8 } : id === 'brimstone' ? { x: SHP ? SHP.round.x + 8 : to.x, z: SHP ? SHP.round.z - 9 : to.z } : id === 'h2' ? { x: C0.x + 9, z: C0.z - 9 } : id === 'ammonia' ? { x: C0.x, z: C0.z + 7 } : id === 'salt' ? { x: C0.x, z: C0.z - 9 } : { x: C0.x, z: C0.z + 2 });
  function doHom(it) {
    if (!st.homWait || !it) return; const id = g.hom.id, sc = center.group.scale.x, to = it.whole ? { x: C0.x - 5.5, z: C0.z + 1.6 } : { x: C0.x + it.x * sc - 0.9, z: C0.z + it.z * sc + 1.9 };
    if (!P.homUse(g, it.sp)) { sfx.bad(); return; }
    const pre = !!st.homPre; st.homPre = false; st.homWait = false; st.homList = null; st.homSpot = null; st.homHover = false; st.mode = 'move'; st.homAct = { t: performance.now(), to: BENCHV ? actTo(id, to) : to, id }; let jj = null; try { jj = BENCHV === 'a' && homObj && !pre ? jumpPlan(id, to) : null; } catch (e) { jj = null; } if (jj) st.homAct.j = jj; else { actStart(id); if (id === 'water') sfx.squish(); else sfx.drift(); }
    const tok = st.tok; setTimeout(() => { if (tok !== st.tok) return; reopenShow(); sfx.good(); if (pre) { setTimeout(() => { if (tok === st.tok) { st.mode = 'play'; refresh(); } }, 300); return; } st.firing = true; st.rezip = true; st.acted = false; setTimeout(() => { if (tok === st.tok) fireNext(); }, (P.HOMS[id].now ? 380 : 200) + (jj ? jj.rest : 0)); }, jj ? jj.hit : 210);
  }
  const drawAt = () => !BENCHV && st.mode === 'play' && g && P.canRedraw(g) && Math.abs(hit.x - DRAW.x) < 1.7 && Math.abs(hit.z - DRAW.z) < 1.5;
  const stuck = () => st.mode === 'play' && !!g && !g.over && !g.chain && !slots.some(q => q && q.o);
  const pagesAt = () => stuck() && hit.x > PAGES.x - 1.2 && hit.x < PAGES.x + 1.8 * P.pagesOf(g) + 1.6 && Math.abs(hit.z - PAGES.z) < 1.4;
  function doBank() {
    if (lining()) { if (!P.queueAdd(g, P.BANKID)) { sfx.bad(); return; } (AA.sfx.queue ? AA.sfx.queue(g.queue.length - 1) : sfx.lock(g.queue.length)); refresh(); return; }
    if (st.mode !== 'play' || !g || !P.canBank(g)) return;
    flush(); setHover(-1); const wasChain = g.chain, gain = P.bankGain(g); P.bank(g);
    st.want = P.made(g); st.P = g.P; st.R = g.R; st.E = g.E; st.mult = P.mult(g); st.bump.p = 1; st.madeBump = 1; st.chainN = 0; if (center) center.hot = [];
    st.motes.push({ txt: '+' + fmt(gain), part: 'p', col: '#8a6a00', a: { x: BANK.x, z: BANK.z - 1 }, t: performance.now(), dur: 420 }); sfx.good(); st.shake = Math.max(st.shake, 0.5);
    if (wasChain || g.pageSteps >= P.stepsOf(g)) { const tok = st.tok; st.mode = 'move'; slots = []; prods.forEach(freeMol); prods = []; setTimeout(() => { if (tok !== st.tok) return; st.mode = 'play'; nextPage(); }, 260); }
    else refresh();
    dirty = true;
  }
  function doRedraw() {
    if (st.mode !== 'play' || !g || !P.canRedraw(g)) return;
    flush(); P.redraw(g); st.drawT = performance.now(); sfx.feed(); refresh(); dirty = true;
  }
  function doTurn() { if (stuck()) nextPage(); }
  // reactions that fold the molecule into a new shape: the model is settled fully first, and the move is slow enough to follow
  const FOLDS = { cyclize: 1, snap: 1, aromatize: 1, lactol: 1, ether: 1, aldol: 1 };
  // the clear lane just below the molecule as it stands
  // how long step n of a cascade takes on the page: the first is slow enough to follow, each one after is quicker.
  // Six steps take 1.54 seconds and twelve 2.3
  const stepMs = n => (fe() ? FEEL.stepMs(n) : Math.max(130, 380 * Math.pow(0.84, Math.max(0, n - 1))));
  const KINDNAME = { lactol: 'zip', snap6: 'snap', weld: 'weld' };
  // the clear lane just above the molecule as it stands
  const over = () => { let d = 6; try { if (center) d = deepOf(center) * center.group.scale.x; } catch (e) { d = 6; } return Math.max(-9.4, C0.z - d / 2 - 3.0); };
  const under = () => { let d = 6; try { if (center) d = deepOf(center) * center.group.scale.x; } catch (e) { d = 6; } return Math.min(7.4, C0.z + d / 2 + 0.9); };
  // ?self=auto: a molecule that has been set off also reacts with itself. Otherwise the player does it: when the
  // molecule could react with itself, a twist stands under it, once a page. It uses none of the page's reactions.
  try { P.SELFMODE.auto = new URLSearchParams(root.location.search).get('self') === 'auto'; } catch (e) { /* default */ }
  const TWIST = { x: 0.6, z: 8.5 };
  const twistOpt = () => { if (!g || st.mode !== 'play' || P.RULE.cascade || P.SELFMODE.auto || g.twisted === g.page) return null; const key = g.page + ':' + g.trail.length; if (!st.twC || st.twC.key !== key) st.twC = { key, o: P.selfOptions(g)[0] || null }; return st.twC.o; };
  const twistAt = () => twistOpt() && Math.abs(hit.x - C0.x) < 8.5 && Math.abs(hit.z - C0.z) < 3.8;
  // the monkey's paw is its own control: a click on it makes a wish
  const kitAt = id => kitObjs.find(k => k.id === id && Math.abs(hit.x - k.hx) < 1.8 && hit.z > k.hz - 3.6 && hit.z < k.hz + 1.4);
  const pawAt = () => kitAt('paw');
  function doDouse() { const k = kitObjs.find(q => q.id === 'extinguisher'); if (!k || !P.douse(g)) return; st.motes.push({ txt: 'times 1.5', part: 'm', col: PART.e, a: { x: k.hx, z: k.hz + 2.6 }, t: performance.now() + 80, dur: 420 }); callout('doused', '', PENCIL); dirty = true; }
  function internGo() { if (st.mode !== 'play' || g.over || g.chain) return; const o = P.options(g, true), ids = Object.keys(o).filter(id => o[id].r && o[id].r.hits > 0); if (!ids.length) return; const id = ids[Math.floor(P.rand() * ids.length)], k = kitObjs.find(q => q.id === 'intern'); callout('intern', RX.CARDS[id].verb.toLowerCase(), PENCIL); react(o[id], id, false, k ? { x: k.hx, z: k.hz + 2.6 } : { x: 17, z: -6 }, true); }
  function doWish() { if (st.mode !== 'play') return; const k = kitObjs.find(q => q.id === 'paw'), id = P.wish(g, run); if (id === null || !k) return; st.E = g.E; st.want = (g.bank + g.P * g.R) * g.E; st.motes.push({ txt: 'times 2', part: 'm', col: PART.e, a: { x: k.hx, z: k.hz + 2.6 }, t: performance.now() + 80, dur: 420 }); callout('wish', id ? 'no more ' + RX.CARDS[id].verb.toLowerCase() : '', PENCIL); buildKit(); kitObjs.forEach(q => { q.born = 0; }); dirty = true; }
  function doTwist() { const o = twistOpt(); if (!o) return; g.twisted = g.page; st.twC = null; st.chainN = 0; react(o, o.id, false, { x: C0.x, z: C0.z }, true); }
  // One reaction on the page, whether it was clicked or is a step of a chain that is running by itself
  function react(o, rid, fin, lab, free) {
    const s = { id: rid, fin };
    if (free && o.model.settle && !o.casc) o.model.settle(FOLDS[rid] ? 2200 : 160);
    if (o.casc && center && o.atoms && o.atoms.length >= 4) { const mk = a => marksOf(center, [a], 0.01, 0.2)[0]; st.pair = { a: mk(o.atoms[0]), b: mk(o.atoms[3]), t: performance.now(), ms: stepMs((g.casc || 0) + 1) }; }
    if (o.casc) st.cstep = { n: (g.casc || 0) + 1, name: KINDNAME[rid] || rid, t: performance.now(), fresh: !P.RULE.fresh || (g.casc || 0) + 1 > (g.cascBest || 0) };
    if (fe()) { /* feel.js sounds the hit */ } else if (o.casc && AA.sfx.ring) AA.sfx.ring((g.casc || 0) + 1); else if (free && (!o.self || o.casc)) sfx.chain(st.chainN || 0);
    flush(); setHover(-1); st.mode = 'move';
    const prev = center, tok = st.tok, before = P.made(g), wasOpen = g.cur.path.length > 0, from = new Map();
    if (s.fin) P.synFinish(g, o); else P.synTake(g, o, free);
    // The molecule changes where it stands. Every atom that is still there moves from where it was to where it now
    // belongs, and atoms that are new grow in at the place the reagent reaches.
    const seed = new Map(), seedBead = new Map(); if (o.map) { o.map.forEach((na, oa) => { const p = prev.at.get(oa); if (p && prev.balls.has(oa)) seed.set(na, p); }); prev.beads.forEach(q => { const nr = o.map.get(q.root); if (nr) seedBead.set(nr, prev.at.get(q.pa)); }); }
    if (o.casc && prev.at.flip) seed.flip = prev.at.flip;
    if (prev.at.fold) seed.fold = { dir: prev.at.fold.dir };
    const nm = buildMol(g.m, null, false, seed.size ? seed : null, seedBead); place(nm, C0, st.sc);
    if (o.map) o.map.forEach((na, oa) => { const p = prev.at.get(oa); if (p && prev.balls.has(oa) && nm.balls.has(na)) from.set(na, p.clone()); });
    nm.beads.forEach(b => { const ob = prev.beads.find(q => o.map && o.map.get(q.root) === b.root); if (ob) from.set(b.pa, prev.at.get(ob.pa).clone()); });
    nm.marks = marksOf(nm, o.r.made || []);
    if (o.map) { const was = new Map(); prev.model.bonds.forEach(b => { const a2 = o.map.get(b.a), b2 = o.map.get(b.b); if (a2 && b2) { if (!was.has(a2)) was.set(a2, new Set()); was.get(a2).add(b2); } }); nm.sticks.forEach(q => { q.old = (was.has(q.a) && was.get(q.a).has(q.b)) || (was.has(q.b) && was.get(q.b).has(q.a)); }); nm.sticks.forEach(q => { if (!q.old) [q.a, q.b].forEach(a => { if (a.el === 'H') from.delete(a); }); }); }
    // group letters: one that is no longer there is struck through, one that is new is written when the reagent arrives
    { const old = prev.groups || [], now2 = groupsOf(nm), used = new Set(); now2.forEach(q => { let bi = -1, bd = 2.2; old.forEach((p, k) => { if (used.has(k) || p.txt !== q.txt) return; const d = Math.hypot(p.x - q.x, p.z - q.z); if (d < bd) { bd = d; bi = k; } }); if (bi >= 0) used.add(bi); else q.born = true; }); nm.groups = now2; nm.ghosts = old.filter((p, k) => !used.has(k)); }
    // What leaves the molecule: a small molecule of its own, set where it left from. It will fly to whatever
    // catches it, or to the beaker, the balloon or the tally.
    { const rev = new Map(); if (o.map) o.map.forEach((na, oa) => rev.set(na, oa));
      (o.r.gone || []).forEach((grp0, gi) => {
        flyer(grp0, gi, P.byKind(grp0), a => rev.get(a), prev, nm);
      }); }
    prods.forEach(m => { if (m) tween(m, { x: m.group.position.x, z: m.group.position.z }, 0.01, 0.14, () => freeMol(m)); }); prods = [];
    tweens = tweens.filter(tw => tw.m !== prev); freeMol(prev); center = nm; SC_MAIN = fitMain(nm);
    const L = land(o, before, wasOpen, nm, s.id, lab, from);
    if (morph && morph.m === nm && o.map && ((nm.fl && nm.fl.ring) || (prev.fl && prev.fl.ring))) { morph.ringy = true; /* into, out of or within a drawing with a ring across: one move, every atom straight to its place, bonds kept whole on the way */ }
    else if (morph && morph.m === nm && o.map) { let mid = null; try { mid = STAGED ? stageMid(nm, o, from) : null; } catch (e) { mid = null; } if (mid) { morph.mid = mid; morph.prev2 = { fl: prev.fl }; morph.fwd2 = o.map; morph.fromHit = new Map(); from.forEach((p, a) => { const md = mid.get(a), t = nm.at.get(a); morph.fromHit.set(a, md && t ? new T.Vector3(p.x + t.x - md.x, p.y, p.z + t.z - md.z) : p); }); } else { morph.bend = bendOf(prev, nm, o.map, from); if (!morph.bend) morph.slide = slideSet(prev, nm, o.map, from); } }
    if (fe() && morph && morph.m === nm) FEEL.onReact(o, nm, prev, L, morph);
    st.zoomT = performance.now();
    // the next choice opens as soon as the places have changed. Equipment goes on firing while the player looks
    (fe() && FEEL.later ? FEEL.later : setTimeout)(() => {
      if (tok !== st.tok || center !== nm) return;
      nm.hot = g.cur.path.length ? marksOf(nm, Array.from(g.cur.fresh), 0.01, 0.2) : [];
      if (g.over) { st.firing = false; return; }
      if (st.firing) return fireNext();
      // a page that is used up with a row of three or more on it waits for the player to set it off
      if (!g.chain && g.pageSteps >= P.stepsOf(g) && P.charged(g)) { st.mode = 'fuse'; st.fuseT = performance.now(); slots = []; prods.forEach(freeMol); prods = []; dirty = true; const tk = st.tok; setTimeout(() => { if (st.tok === tk && st.mode === 'fuse') setOff(); }, 280); return; }
      // a chain that has been set off takes the next reaction by itself
      { const wasChain = g.chain, c = P.chainNext(g); if (!c && wasChain && g.chain) { st.mode = 'play'; return refresh(); } if (!c && wasChain) { st.chainN = 0; st.mode = 'play'; return nextPage(); } if (c) { st.chainN = (st.chainN || 0) + 1; const k = g.kinds.indexOf(c.id); return react(c, c.id, false, LAB[k] ? { x: LAB[k].x - 0.8, z: LAB[k].z + 0.5 } : { x: 17, z: -6 }, true); } st.chainN = 0; }
      st.mode = 'play'; refresh();
      // a page with nothing left to do turns itself
      if (!slots.some(q => q && q.o) && !P.canRedraw(g) && !P.canBank(g)) { st.mode = 'move'; setTimeout(() => { if (tok !== st.tok) return; st.mode = 'play'; nextPage(); }, Math.max(300, L.dur - L.unlock + 120)); }
    }, (fe() ? FEEL.unlock(o, L) : L.unlock) + (morph && morph.m === nm && morph.mid ? 330 : 0));
    // the round ends only when the play sequence has landed its count and its word (the end screen used to cut the finish short)
    if (g.over) setTimeout(() => { if (tok !== st.tok) return; if (fe() && FEEL.owns && FEEL.owns()) FEEL.pageEnd(() => { if (tok === st.tok) endRound(); }); else endRound(); }, L.dur + 120);
    dirty = true;
  }
  // the leaf: what was on the page (paper and ink) is lifted as one sheet, hinged at the bound edge, and turned over to the left; the next page is already under it
  let leaf = null;
  function leafStart() { if (!BENCHV) return; if (!leaf) { const c = canvasTex(1024, 704), grp = new T.Group(), m = new T.Mesh(new T.PlaneGeometry(SW, SH).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: c.t, side: T.DoubleSide })); m.position.set(SW / 2, 0, 0); grp.add(m); const sh = flatMesh(SW * 1.06, SH * 1.08, softShadow(), 0); sh.position.set(SW / 2 + 0.8, -0.03, 0.8); grp.add(sh); grp.position.set(-SW / 2, 0.09, 0); leaf = { c, grp, t0: 0 }; }
    try { leaf.c.x.drawImage(paper.c, 0, 0, 1024, 704); leaf.c.x.drawImage(ink.c, 0, 0, 1024, 704); } catch (e) { /* plain leaf */ } leaf.c.t.needsUpdate = true; leaf.t0 = performance.now(); leaf.grp.rotation.z = 0; scene.add(leaf.grp); sfxN('pageTurn'); }
  function leafFrame(now) { if (!leaf || !leaf.t0) return; const u = (now - leaf.t0) / 1000, e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * Math.min(1, u) + 2, 3) / 2; leaf.grp.rotation.z = Math.min(1, e) * Math.PI * 0.995; if (u >= 1) { scene.remove(leaf.grp); leaf.t0 = 0; } }
  const next = () => { if (st.mode === 'shop') return newRun(); if (st.mode !== 'done') return; if (BENCHV && !st.pinned && st.pass && performance.now() - (st.doneT || 0) < RES_MS) { st.doneT = performance.now() - RES_MS; return; } if (BENCHV && st.pinned && (st.pinK || 0) < 1) return; leafStart(); if (st.won) { meta.credit += run.beaten + (run.bonus || 0); saveMeta(); return newRun(); } if (st.pass) { run.round++; showPicks(); } else if (P.stageOf(meta) < 2) { meta.credit += run.beaten + (run.bonus || 0); saveMeta(); newRun(); } else showSuppliers(); };


  // (builder 11) THE LOST ROUND: after the unmet target has been shown, the chemist's pen strikes the page through OVER the molecule (two strokes that stand above the drawing),
  // the page crumples into a ball and is swept off the notebook to roll on the bench, and the gold of the run leaves the pile. A clean page lies under it.
  const LOSS = { t0: 900, s1: 1000, s2: 1480, sdur: 330, cr: 2350, crdur: 950, roll: 3300, rolldur: 1500, end: 5000, strokes: [], sheet: null, base: null, on: false, stage: 0, rest: { x: 47.5, z: 11 }, R: 4.6 };
  const lossHash = (i, k) => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s); };
  function lossStrokeTex() { const c = canvasTex(512, 64), x = c.x; x.lineCap = 'round'; for (let p = 0; p < 3; p++) { x.strokeStyle = 'rgba(' + (p ? '190,30,22' : '205,40,30') + ',' + (p ? 0.55 : 0.95) + ')'; x.lineWidth = p ? 9 : 22; x.beginPath(); x.moveTo(14, 32 + (p - 1) * 9); for (let i = 1; i <= 16; i++) x.lineTo(14 + i * 30.2, 32 + (p - 1) * 9 + 5 * Math.sin(i * 1.7 + p * 2)); x.stroke(); } c.t.needsUpdate = true; return c.t; }
  function lossClear() { LOSS.strokes.forEach(s => scene.remove(s.m)); LOSS.strokes = []; if (LOSS.sheet) { scene.remove(LOSS.sheet); LOSS.sheet.geometry.dispose(); LOSS.sheet = null; } LOSS.on = false; LOSS.stage = 0; LOSS.blank = false; LOSS.swept = false; GP.sweep = 0; }
  function lossSnap() { const c = LOSS.c || (LOSS.c = canvasTex(1024, 704)), x = c.x; try { x.drawImage(paper.c, 0, 0, 1024, 704); x.drawImage(ink.c, 0, 0, 1024, 704); } catch (e) { x.fillStyle = '#f4efe2'; x.fillRect(0, 0, 1024, 704); }
    // the drawing goes with its page: the molecule as it stood, flat, and the two strokes over it
    if (center) { const k = 1024 / IW, w = new T.Vector3(), w2 = new T.Vector3(), P2 = v => { const q = px({ x: v.x, z: v.z }); return [q[0] * k, q[1] * k]; }; x.lineCap = 'round'; center.group.updateMatrixWorld(true);
      (center.sticks || []).forEach(s => { const A = center.balls.get(s.a), B = center.balls.get(s.b); if (!A || !B || !A.mesh.visible || !B.mesh.visible) return; A.mesh.getWorldPosition(w); B.mesh.getWorldPosition(w2); const a = P2(w), b = P2(w2); x.strokeStyle = '#5a6072'; x.lineWidth = 5; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); });
      center.balls.forEach((b, a) => { if (!b.mesh.visible) return; b.mesh.getWorldPosition(w); const q = P2(w), r = Math.max(4, (b.R || 0.4) * center.group.scale.x * U * k * 0.95); x.fillStyle = a.el === 'O' ? '#e04038' : a.el === 'N' ? '#3d6fe0' : a.el === 'S' ? '#f0c820' : a.el === 'Cl' ? '#30c060' : a.el === 'H' ? '#f4f4f4' : '#5a6072'; x.strokeStyle = '#22252c'; x.lineWidth = 2; x.beginPath(); x.arc(q[0], q[1], r, 0, 6.3); x.fill(); x.stroke(); }); }
    LOSS.pts.forEach(q => { const a = px({ x: q[0], z: q[1] }), b = px({ x: q[2], z: q[3] }), k = 1024 / IW; x.strokeStyle = 'rgba(200,38,28,0.95)'; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath(); x.moveTo(a[0] * k, a[1] * k); x.lineTo(b[0] * k, b[1] * k); x.stroke(); }); c.t.needsUpdate = true; return c.t; }
  function lossFrame(now) { if (!BENCHV) return; const lost = st.mode === 'done' && !st.pass && !!st.doneT; if (!lost) { if (LOSS.on || LOSS.sheet) lossClear(); return; } const el = now - st.doneT, sm = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }; dirty = true;
    if (!LOSS.on) { lossClear(); LOSS.on = true; const hb = center ? liveBox(center) : null, cx = center && hb ? center.group.position.x + hb.cx * center.group.scale.x : C0.x, cz = center && hb ? center.group.position.z + hb.cz * center.group.scale.x : C0.z, hw = Math.max(9, hb ? hb.w * center.group.scale.x * 0.62 : 12), hd = Math.max(6, hb ? hb.d * center.group.scale.x * 0.62 : 8); LOSS.pts = [[cx - hw, cz - hd, cx + hw, cz + hd], [cx + hw, cz - hd * 1.05, cx - hw * 0.96, cz + hd * 0.95]]; LOSS.mid = { x: cx, z: cz };
      LOSS.pts.forEach((q, i) => { const m = new T.Mesh(new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: LOSS.tex || (LOSS.tex = lossStrokeTex()), transparent: true, depthTest: false, depthWrite: false })); m.renderOrder = 30; m.visible = false; scene.add(m); LOSS.strokes.push({ m, q, t: i ? LOSS.s2 : LOSS.s1 }); }); }
    // the strokes: drawn fast and hard, above the molecule
    LOSS.strokes.forEach((s, i) => { const k = sm((el - s.t) / LOSS.sdur), q = s.q, dx = q[2] - q[0], dz = q[3] - q[1], L = Math.hypot(dx, dz); s.m.visible = k > 0 && el < LOSS.cr; if (k > 0 && !s.snd) { s.snd = true; sfxN('click'); try { sfx.bad(); } catch (e) { /* no sound */ } st.shake = Math.max(st.shake, 0.7); } s.m.scale.set(Math.max(0.01, L * k), 1, 3.4); s.m.position.set(q[0] + dx * k / 2, 7.5, q[1] + dz * k / 2); s.m.rotation.y = -Math.atan2(dz, dx); });
    // the page crumples: the sheet with everything on it is pulled into a ball
    if (el >= LOSS.cr && !LOSS.sheet) { const geo = new T.PlaneGeometry(SW, SH, 26, 18).rotateX(-Math.PI / 2), m = new T.Mesh(geo, new T.MeshStandardMaterial({ map: lossSnap(), side: T.DoubleSide, flatShading: true, roughness: 0.9 })); m.castShadow = false; LOSS.base = Float32Array.from(geo.attributes.position.array); m.position.set(0, 0.12, 0); scene.add(m); LOSS.sheet = m; LOSS.blank = true; if (center) center.group.visible = false; sfxN('pageTurn'); st.shake = Math.max(st.shake, 0.4); }
    if (LOSS.sheet) { const e = sm((el - LOSS.cr) / LOSS.crdur), P0 = LOSS.sheet.geometry.attributes.position, B = LOSS.base, R = LOSS.R, n = P0.count, mx = LOSS.mid.x * 0.5, mz = LOSS.mid.z * 0.5;
      if (LOSS.stage < 2) { for (let i = 0; i < n; i++) { const bx = B[i * 3], bz = B[i * 3 + 2], u = bx / SW + 0.5, v = bz / SH + 0.5, th = u * 6.283 * 1.5 + lossHash(i, 1) * 1.2, ph = 0.25 + v * 2.6 + lossHash(i, 2) * 0.5, rr = R * (0.55 + 0.5 * lossHash(i, 3)), tx = mx + rr * Math.sin(ph) * Math.cos(th), ty = R + rr * Math.cos(ph), tz = mz + rr * Math.sin(ph) * Math.sin(th), wr = (lossHash(i, 4) - 0.3) * 5 * Math.sin(Math.PI * Math.min(1, e * 1.4)) * (1 - e), e2 = Math.pow(e, 0.8 + 0.6 * lossHash(i, 5)); P0.setXYZ(i, bx + (tx - bx) * e2, Math.max(0, ty * e2 + wr), bz + (tz - bz) * e2); } P0.needsUpdate = true; if (e >= 1) { LOSS.stage = 2; /* re-centre the ball on its own middle so it can roll */ for (let i = 0; i < n; i++) P0.setXYZ(i, P0.getX(i) - mx, P0.getY(i) - R, P0.getZ(i) - mz); P0.needsUpdate = true; LOSS.sheet.position.set(mx, R + 0.1, mz); LOSS.from = { x: mx, z: mz }; } }
      if (LOSS.stage === 2) { const u = Math.max(0, Math.min(1, (el - LOSS.roll) / LOSS.rolldur)), e3 = 1 - Math.pow(1 - u, 2.4), f = LOSS.from, to = LOSS.rest, hopY = u < 0.42 ? 0 : Math.abs(Math.sin((u - 0.42) * 16)) * 1.6 * (1 - u), dist = Math.hypot(to.x - f.x, to.z - f.z); LOSS.sheet.position.set(f.x + (to.x - f.x) * e3, R * 0.92 + 0.1 + hopY - (u > 0.4 ? 0.3 : 0), f.z + (to.z - f.z) * e3 + 3 * Math.sin(Math.PI * e3)); LOSS.sheet.rotation.z = -e3 * dist / R; LOSS.sheet.rotation.x = e3 * 0.9; if (u > 0 && !LOSS.swept) { LOSS.swept = true; try { if (AA.sfx.lost) AA.sfx.lost(); } catch (e9) { /* no sound */ } GP.sweep = now; } } } }

  // ---------- ink ----------
  const px = p => [(p.x + SW / 2) * U, (p.z + SH / 2) * U];
  // (builder 11) MOCKS for the owner to choose from (ruling AM4): something coming through the page, quiet and physical. ?bleed=a|b|c with ?bleedd=0..3 (early, middle, late, after a sign lap).
  // Drawn under all ink. Not wired to the run yet: the depth is given by hand.
  const BLEED = (() => { try { const q = new URLSearchParams(root.location.search); return { k: q.get('bleed') || '', d: Math.max(0, Math.min(3, +(q.get('bleedd') || 0))) }; } catch (e) { return { k: '', d: 0 }; } })();
  function bleedMock(x) { if (!BLEED.k || st.mode === 'shop') return; const d = BLEED.d; let sd = 991; const R = () => (sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296; x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
    const hand2 = (x0, y0, w, h) => { x.beginPath(); let p = x0; x.moveTo(x0, y0); while (p < x0 + w) { const ww = 16 + R() * 26, up = R() < 0.3 ? -h * (0.9 + R()) : R() < 0.15 ? h * 0.9 : -h * 0.4 * R(); x.bezierCurveTo(p + ww * 0.3, y0 + up, p + ww * 0.6, y0 + up * 0.8 + 4 * R(), p + ww, y0 + 3 * R() - 1.5); p += ww; if (R() < 0.16) { p += 24 + R() * 22; x.moveTo(p, y0); } } x.stroke(); };
    const atoms = () => { const o = []; if (center && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse')) { const w = new T.Vector3(); center.group.updateMatrixWorld(true); center.balls.forEach((b, a) => { if (!b.mesh.visible || a.el === 'H') return; b.mesh.getWorldPosition(w); const q = px({ x: w.x, z: w.z }); o.push([q[0], q[1], (b.R || 0.4) * center.group.scale.x * U]); }); } return o; };
    if (BLEED.k === 'a') { // ink from the other side: a slanted, looped hand, mirrored, cool grey-blue, on this page's own ruled lines
      const n = [2, 6, 13, 21][d], al = [0.085, 0.11, 0.135, 0.16][d]; x.save(); x.translate(IW, 0); x.scale(-1, 1); x.transform(1, 0, 0.22, 1, 0, 0); x.strokeStyle = 'rgba(54,72,112,' + al + ')'; x.lineWidth = 5.5;
      for (let i = 0; i < n; i++) { const row = d === 0 ? 3 + i : Math.floor(R() * 24) + 3, y = 150 + row * 46.5, far = d < 2 ? 0.26 : d < 3 ? 0.62 : 0.9, x0 = 70 + R() * 80 - y * 0.22, w = (260 + R() * 420) * (d === 0 ? 0.7 : 1) + (d >= 2 ? R() * IW * (far - 0.3) : 0); hand2(x0, y, Math.min(w, IW * far), 26); } x.restore();
      if (d >= 1) { x.strokeStyle = 'rgba(54,72,112,' + (al * 0.9) + ')'; x.lineWidth = 4; for (let k = 0; k < 3; k++) { const q = px({ x: STEP.x + k * STEPD + 0.25, z: STEP.z + 0.2 }); x.beginPath(); x.ellipse(q[0], q[1], 58, 52, 0.2, 0.4, 5.9); x.stroke(); } }
      if (d >= 2) { x.strokeStyle = 'rgba(54,72,112,' + (al * 0.8) + ')'; x.lineWidth = 3.5; atoms().forEach(q => { x.beginPath(); x.ellipse(q[0] + 5, q[1] + 4, q[2] * 0.9, q[2] * 0.84, 0, 0.3, 6.1); x.stroke(); }); }
      if (d >= 3) { x.save(); x.translate(IW, 0); x.scale(-1, 1); x.strokeStyle = 'rgba(176,140,30,0.2)'; x.lineWidth = 7; for (let i = 0; i < 4; i++) hand2(200 + R() * 900, 300 + Math.floor(R() * 18) * 46.5, 200 + R() * 260, 30); x.restore(); } }
    if (BLEED.k === 'b') { // a stain from beneath: a pale yellow tide mark come up through the pages below from the gutter corner; its edge has dried darker
      const rr = [250, 470, 720, 900][d], cx = 40, cy = IH - 60, blob = (r, seed, fill, edge, lw) => { let s2 = seed; const Q = () => (s2 = (Math.imul(s2, 1664525) + 1013904223) >>> 0) / 4294967296, pts = []; for (let i = 0; i <= 40; i++) { const a = -Math.PI / 2 - 0.25 + i / 40 * (Math.PI / 2 + 0.5); pts.push([cx + Math.cos(a) * r * (1.25 + 0.16 * Q()) * 1.15, cy + Math.sin(a) * r * (0.82 + 0.14 * Q())]); } x.beginPath(); x.moveTo(cx - 200, cy + 200); pts.forEach(p => x.lineTo(p[0], p[1])); x.lineTo(cx + r * 2, cy + 200); x.closePath(); if (fill) { x.fillStyle = fill; x.fill(); } x.strokeStyle = edge; x.lineWidth = lw; x.stroke(); };
      blob(rr, 77, 'rgba(232,206,104,' + [0.10, 0.12, 0.13, 0.14][d] + ')', 'rgba(168,128,38,' + [0.22, 0.26, 0.3, 0.32][d] + ')', 5); if (d >= 1) blob(rr * 0.68, 78, 'rgba(232,206,104,0.05)', 'rgba(168,128,38,0.16)', 4); if (d >= 2) blob(rr * 0.42, 79, 'rgba(232,206,104,0.05)', 'rgba(168,128,38,0.14)', 3);
      if (d >= 3) { const c = px({ x: 7, z: 2 }), r = 250, S3 = () => { x.beginPath(); x.ellipse(c[0], c[1], r, r * 0.96, 0, 0.1, 6.36); x.moveTo(c[0] - r * 1.4, c[1] + 6); x.lineTo(c[0] + r * 1.4, c[1] - 10); x.moveTo(c[0] + 4, c[1] - r); x.lineTo(c[0] + 16, c[1] - r * 2.0); x.stroke(); }; x.strokeStyle = 'rgba(168,128,38,0.2)'; x.lineWidth = 64; S3(); x.globalCompositeOperation = 'destination-out'; x.strokeStyle = 'rgba(0,0,0,0.72)'; x.lineWidth = 52; S3(); x.globalCompositeOperation = 'source-over'; x.strokeStyle = 'rgba(232,206,104,0.13)'; x.lineWidth = 56; S3(); } }
    if (BLEED.k === 'c') { // the page remembers: dents of what was written hard on the page above; no ink, only the lamp's raking light (a lit edge and a shadow edge)
      const dent = f => { x.save(); x.translate(2.2, 2.4); x.strokeStyle = x.fillStyle = 'rgba(255,255,255,0.75)'; f(); x.translate(-4.2, -4.6); x.strokeStyle = x.fillStyle = 'rgba(70,58,44,' + [0.2, 0.22, 0.24, 0.27][d] + ')'; f(); x.restore(); }, strokes3 = (cx, cy, r) => { x.lineWidth = 6; x.beginPath(); x.ellipse(cx, cy, r, r * 0.95, 0, 0.2, 6.4); x.moveTo(cx - r * 1.4, cy + 3); x.lineTo(cx + r * 1.4, cy - 5); x.moveTo(cx + 2, cy - r); x.lineTo(cx + 9, cy - r * 2); x.stroke(); };
      const sums = ['12 + 7 = 19', '4,800 / 3', '19 x 2 = 38', '0.74', '3,552', '38 - 12 = 26', '6 x 6', '1,600'], nS = [2, 5, 5, 1][d], nM = [0, 0, 7, 26][d];
      for (let i = 0; i < nS; i++) { const xx = d === 0 ? IW - 520 + i * 60 : 420 + R() * (IW - 900), yy = d === 0 ? 250 + i * 93 : 240 + Math.floor(R() * 22) * 46.5, t = sums[i % sums.length]; dent(() => { marker(x, 58); x.textAlign = 'left'; x.save(); x.translate(xx, yy); x.rotate(-0.05); x.fillText(t, 0, 0); x.lineWidth = 5; x.beginPath(); x.moveTo(0, 12); x.lineTo(x.measureText(t).width, 8); x.stroke(); x.restore(); }); }
      for (let i = 0; i < nM; i++) { const col = i % 7, row = Math.floor(i / 7), xx = d === 3 ? 330 + col * 250 + (row % 2) * 60 : 500 + R() * (IW - 800), yy = d === 3 ? 330 + row * 290 : 300 + R() * (IH - 600); dent(() => strokes3(xx, yy, d === 3 ? 44 : 34)); } }
    x.restore(); }

  // a mark that belongs to an atom is drawn where the atom is seen, also when the player has turned the molecule (feel.js)
  const mpx = p => px(FEEL && FEEL.twistPt ? FEEL.twistPt(p) : p);
  // The page is written in the game's own pen lettering (pen.js). ?font=classic brings back the two font files.
const FONT = new URLSearchParams(location.search).get('font') === 'classic' ? 'classic' : 'own', FAM = '';
const hand = (x, n) => { x.font = Math.round(n) + 'px ' + (FAM || 'Hand') + ', "Segoe Print", sans-serif'; if (FONT === 'own') AA.rxPen.set(x, n, false); };
  const marker = (x, n) => { x.font = (FAM ? 'bold ' : '') + Math.round(n) + 'px ' + (FAM || 'Marker') + ', "Segoe Print", sans-serif'; if (FONT === 'own') AA.rxPen.set(x, n, true); };
  // (builder 12, a picture to choose from) the records of the rounds before this one, pinned on the left page of the spread: a slip, a strip of tape, the round's
  // numeral, a small pencil drawing and the mark it reached. The drawings here are stand-ins: the real ones would be the molecules as they were left.
  const RECS = {}, recSlot = r => ({ x: -21.4 + ((r - 1) % 4) * 5.5, z: 10.4 + Math.floor((r - 1) / 4) * 4.5 });
  // the molecule as it was left at the end of a round that was passed, drawn small and flat for its slip (kept for the run)
  function recSnap() { const m = center; if (!m || !run) return; const c = document.createElement('canvas'); c.width = 300; c.height = 210; const x = c.getContext('2d'), w = new T.Vector3(), w2 = new T.Vector3(); m.group.updateMatrixWorld(true); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    m.balls.forEach(b => { if (!b.mesh.visible) return; b.mesh.getWorldPosition(w); x0 = Math.min(x0, w.x); x1 = Math.max(x1, w.x); z0 = Math.min(z0, w.z); z1 = Math.max(z1, w.z); }); if (x0 > 1e8) return;
    const k = Math.min(250 / (x1 - x0 + 1.5), 150 / (z1 - z0 + 1.5)), P2 = v => [150 + (v.x - (x0 + x1) / 2) * k, 112 + (v.z - (z0 + z1) / 2) * k]; x.lineCap = 'round';
    (m.sticks || []).forEach(q => { const A = m.balls.get(q.a), B = m.balls.get(q.b); if (!A || !B || !A.mesh.visible || !B.mesh.visible) return; A.mesh.getWorldPosition(w); B.mesh.getWorldPosition(w2); const a = P2(w), b = P2(w2); x.strokeStyle = '#4a4f5c'; x.lineWidth = Math.max(2, k * 0.2); x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); });
    m.balls.forEach((b, a) => { if (!b.mesh.visible || a.el === 'H') return; b.mesh.getWorldPosition(w); const q = P2(w), r = Math.max(3, (b.R || 0.4) * m.group.scale.x * k * 0.8); x.fillStyle = a.el === 'O' ? '#e04038' : a.el === 'N' ? '#3d6fe0' : a.el === 'S' ? '#f0c820' : a.el === 'Cl' ? '#30c060' : '#5a6072'; x.strokeStyle = '#22252c'; x.lineWidth = 1.5; x.beginPath(); x.arc(q[0], q[1], r, 0, 6.3); x.fill(); x.stroke(); });
    const marks = P.runMarks(st.quota); let nm = 0; marks.forEach(v => { if (g.total >= v) nm++; }); RECS[run.round] = { c, nm, run: st.noteRun }; }
  // the records of the rounds before this one, pinned on the lower left page: a slip with a strip of tape, the round's numeral, the drawing, the mark it reached
  function recMock(x) { const upto = st.mode === 'done' && st.pinned && st.pinK > 0.98 ? run.round : run.round - 1; for (let r = 1; r <= Math.min(8, upto); r++) { const rec = RECS[r]; if (!rec || rec.run !== st.noteRun) continue; const q = recSlot(r), c = px(q), w = 160, h = 128, R = k => Math.sin((r + 1) * 12.9898 * k) * 0.5 + 0.5; x.save(); x.translate(c[0], c[1]); x.rotate((R(1) - 0.5) * 0.08);
      x.fillStyle = 'rgba(40,30,18,0.16)'; x.fillRect(-w / 2 + 4, -h / 2 + 6, w, h); x.fillStyle = '#f7f2e2'; x.fillRect(-w / 2, -h / 2, w, h); x.strokeStyle = 'rgba(90,80,60,0.3)'; x.lineWidth = 2; x.strokeRect(-w / 2, -h / 2, w, h);
      x.save(); x.translate(0, -h / 2 + 1); x.rotate((R(2) - 0.5) * 0.2); x.fillStyle = 'rgba(222,206,150,0.78)'; x.fillRect(-34, -12, 68, 24); x.restore();
      if (!(r === run.round && st.mode === 'done')) x.drawImage(rec.c, -w / 2 + 8, -h / 2 + 14, 144, 101);
      marker(x, 30); x.textAlign = 'left'; x.fillStyle = PENCIL; x.fillText(String(r), -w / 2 + 8, -h / 2 + 34);
      if (rec.nm > 0) { try { AA.rxMarks.yieldMark(x, Math.min(3, rec.nm - 1), w / 2 - 22, h / 2 - 22, 13, { pencil: 'rgba(90,86,78,0.4)', plw: 1.5, ink: GREEN, lw: 4, t: 1 }); } catch (e) { /* no marks */ } }
      x.restore(); } }
  function wob(x, a, b, lw, col, dash) {
    const A = px(a), B = px(b), n = 14; x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.setLineDash(dash || []); x.beginPath();
    for (let k = 0; k <= n; k++) { const t = k / n, j = Math.sin(t * 11 + A[0] * 0.013) * 2.2; const X = A[0] + (B[0] - A[0]) * t + j, Y = A[1] + (B[1] - A[1]) * t + j * 0.6; if (k) x.lineTo(X, Y); else x.moveTo(X, Y); }
    x.stroke(); x.setLineDash([]);
  }
  function arrow(x, a, b, lw, col, dash) {
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, hd = Math.min(1.0, d * 0.3);
    wob(x, a, b, lw, col, dash);
    wob(x, { x: b.x - ux * hd - uz * hd * 0.55, z: b.z - uz * hd + ux * hd * 0.55 }, b, lw, col); wob(x, { x: b.x - ux * hd + uz * hd * 0.55, z: b.z - uz * hd - ux * hd * 0.55 }, b, lw, col);
  }
  // letters text no wider than w, shrinking it if it has to. Returns the size used
  const fit = (x, text, size, w, font) => { let n = size; font(x, n); while (n > 14 && x.measureText(text).width > w) { n -= 4; font(x, n); } return n; };
  // one tick for each time the number to beat has been reached. Past ten, the count and a single tick
  function tickRow(x, cx, cy, n, size, col) {
    const one = (px0, py0) => { x.beginPath(); x.moveTo(px0 - size * 0.42, py0 - size * 0.05); x.lineTo(px0 - size * 0.12, py0 + size * 0.32); x.lineTo(px0 + size * 0.48, py0 - size * 0.5); x.stroke(); };
    x.strokeStyle = col; x.lineWidth = size * 0.2; x.lineCap = 'round'; x.lineJoin = 'round';
    if (n > 10) { marker(x, size * 1.5); x.textAlign = 'right'; x.fillStyle = col; x.fillText(String(n), cx - size * 0.2, cy + size * 0.4); one(cx + size * 0.7, cy); return; }
    for (let k = 0; k < n; k++) one(cx + (k - (n - 1) / 2) * size * 1.15, cy);
  }
  const wrap = (x, text, w) => { const out = []; let line = ''; String(text).split(' ').forEach(t => { const n = line ? line + ' ' + t : t; if (line && x.measureText(n).width > w) { out.push(line); line = t; } else line = n; }); if (line) out.push(line); return out; };
  const ring = (x, c, rx, ry, lw, col, rot) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.ellipse(c[0], c[1], rx, ry, rot || 0.15, 0.3, 6.6); x.stroke(); };
  // how rare a reagent is: one to four dots in the color of its rarity
  function dots(x, id, cx, cy, r) { const q = P.rarityOf(id); x.fillStyle = q.col; for (let k = 0; k < q.dots; k++) { x.beginPath(); x.arc(cx + (k - (q.dots - 1) / 2) * r * 2.8, cy, r, 0, 6.3); x.fill(); } }
  // A flick of ink from a to b, in ink pixels: a curve that bows to one side, thin at its tail and full at its head.
  // Only the part between t0 and t1 of the way is drawn, so a flick can travel and its tail can catch up.
  function flick(x, a, b, t0, t1, w, col, bow) {
    if (t1 - t0 < 0.01) return;
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, cx = (a[0] + b[0]) / 2 + nx * len * bow, cy = (a[1] + b[1]) / 2 + ny * len * bow, N = 16, L = [], R = [];
    for (let i = 0; i <= N; i++) { const u = i / N, t = t0 + (t1 - t0) * u, q = 1 - t, X = q * q * a[0] + 2 * q * t * cx + t * t * b[0], Y = q * q * a[1] + 2 * q * t * cy + t * t * b[1], tx = 2 * q * (cx - a[0]) + 2 * t * (b[0] - cx), ty = 2 * q * (cy - a[1]) + 2 * t * (b[1] - cy), tl = Math.hypot(tx, ty) || 1, h = w * 0.5 * Math.pow(u, 0.7) * (u > 0.93 ? (1 - u) / 0.07 * 0.5 + 0.5 : 1); L.push([X - ty / tl * h, Y + tx / tl * h]); R.push([X + ty / tl * h, Y - tx / tl * h]); }
    x.fillStyle = col; x.beginPath(); x.moveTo(L[0][0], L[0][1]); for (let i = 1; i <= N; i++) x.lineTo(L[i][0], L[i][1]); for (let i = N; i >= 0; i--) x.lineTo(R[i][0], R[i][1]); x.closePath(); x.fill();
  }
  // a splat where a flick lands: a blot with a few short spokes
  function splat(x, c, r, col, seed) { x.fillStyle = col; x.beginPath(); for (let i = 0; i <= 20; i++) { const a = i / 20 * 6.283, rr = r * (0.75 + 0.5 * hash(seed + 's' + (i % 20))); if (i) x.lineTo(c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr * 0.8); else x.moveTo(c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr * 0.8); } x.fill(); }
  // What each reagent takes and what it leaves, by group. A row carries on when the next tile takes what the last one left.
  const TILE = { snap: ['C=C', 'cage'], aromatize: ['ring', 'arene'], cyclize: ['OH', 'ring'], hydrate: ['C=C', 'OH'], pcc: ['OH', 'C=O'], nabh4: ['C=O', 'OH'], dehydrate: ['OH', 'C=C'], h2: ['C=C', 'CH'], hcl: ['C=C', 'Cl'], bh3: ['C=C', 'OH'], socl2: ['OH', 'Cl'], koh: ['Cl', 'C=C'], naoh: ['Cl', 'OH'],
    memgbr: ['C=O', 'OH', '+C'], wittig: ['C=O', 'C=C', '+C'], allyl: ['C=O', 'OH', '+3C'], aibn: ['C=C', 'chain'], wacker: ['C=C', 'C=O'], wolff: ['C=O', 'CH'],
    extend: ['C=O', 'C=O', '+C=O'], dione: ['C=O', 'C=O', '+2 C=O'], phenol: ['C=O', 'OH', '+ring'], couple: ['C=O', 'ring'], rcm: ['C=C', 'ring'],
    hwe: ['C=O', 'enone'], dihydroxylation: ['C=C', 'diol'], ozonolysis: ['C=C', '2C=O'], permanganate: ['C=C', 'COOH'], ritter: ['C=C', 'NH2'], thiolene: ['C=C', 'SH'], chlorination: ['OH', 'Cl'], cyanohydrin: ['C=O', 'COOH'], hofmann: ['NH2', 'C=C'], chugaev: ['OH', 'C=C'], hydroformylation: ['C=C', 'CHO'], epoxidation: ['C=C', 'epox'] };
  const GCOL = { 'C=C': '#3a6fd0', OH: '#d6453a', 'C=O': '#e07a00', Cl: '#3c9a5f', CH: '#8d949c', chain: '#e23c6e' };
  function chip(x, txt, cx, cy, on) { hand(x, 30); const w = Math.max(64, x.measureText(txt || '').width + 26); x.save(); x.globalAlpha = on ? 1 : 0.4; x.strokeStyle = PENCIL; x.lineWidth = 4; x.beginPath(); x.ellipse(cx, cy - 10, w / 2, 24, 0, 0, 6.3); x.stroke(); x.fillStyle = INK; x.textAlign = 'center'; x.fillText(txt || '', cx, cy); x.restore(); return w; }
  // a coin of credit, drawn in ink
  function coin(x, cx, cy, r) { if (AA.rxKit && AA.rxKit.drawCoin) AA.rxKit.drawCoin(x, cx, cy, r, {}); }
  // A coin of the run, seen from the side so that coins stack, in copper: the credit kept between runs is the gold one.
  function rcoin(x, cx, cy, r, a) { if (AA.rxKit && AA.rxKit.drawCoin) AA.rxKit.drawCoin(x, cx, cy, r * 0.8, { alpha: a == null ? 1 : a }); }
  // the coins held: a stack, at most ten high, and how many
  function purse(x, cx, cy, n, r, plus) { if (n <= 0) { x.strokeStyle = FAINT; x.lineWidth = 3; x.beginPath(); x.ellipse(cx, cy, r, r * 0.5, 0, 0, 6.3); x.stroke(); } for (let k = 0; k < Math.min(10, n); k++) rcoin(x, cx + ((k * 7) % 3 - 1) * 1.5, cy - k * r * 0.46, r);
    marker(x, r * 2); x.textAlign = 'left'; x.fillStyle = '#7a4318'; x.fillText(String(n), cx + r + 14, cy + r * 0.6); if (plus) { const w = x.measureText(String(n)).width; marker(x, r * 1.5); x.fillStyle = GREEN; x.fillText('+' + plus, cx + r + 30 + w, cy + r * 0.6); } }
  // a drop: one use of a reagent
  function drop(x, cx, cy, r, col, full) { x.beginPath(); x.moveTo(cx, cy - r * 1.5); x.bezierCurveTo(cx + r * 0.3, cy - r * 0.7, cx + r, cy - r * 0.1, cx + r, cy + r * 0.35); x.arc(cx, cy + r * 0.35, r, 0, Math.PI); x.bezierCurveTo(cx - r, cy - r * 0.1, cx - r * 0.3, cy - r * 0.7, cx, cy - r * 1.5); x.closePath(); if (full) { x.fillStyle = col; x.fill(); } else { x.strokeStyle = col; x.lineWidth = 2.5; x.stroke(); } }
  // the bank: a tray with an arrow into it
  function tray(x, cx, cy, s, col, lw) { x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(cx - 34 * s, cy + 2 * s); x.lineTo(cx - 34 * s, cy + 24 * s); x.lineTo(cx + 34 * s, cy + 24 * s); x.lineTo(cx + 34 * s, cy + 2 * s); x.moveTo(cx, cy - 36 * s); x.lineTo(cx, cy + 6 * s); x.moveTo(cx - 13 * s, cy - 8 * s); x.lineTo(cx, cy + 6 * s); x.lineTo(cx + 13 * s, cy - 8 * s); x.stroke(); }
  function turnMark(x, cx, cy, r, col, lw) { x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.arc(cx, cy, r, 0.9, 5.6); x.stroke(); const a = 5.6, hx = cx + Math.cos(a) * r, hy = cy + Math.sin(a) * r; x.beginPath(); x.moveTo(hx - r * 0.6, hy - r * 0.2); x.lineTo(hx, hy); x.lineTo(hx - r * 0.12, hy + r * 0.64); x.stroke(); }
  // the marks of the three numbers: a ring for places, chevrons for the row, a star for extra
  function glyph(x, k, cx, cy, s, col) {
    x.strokeStyle = col || PART[k]; x.lineWidth = Math.max(3, s * 0.15); x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath();
    if (k === 'p') x.arc(cx, cy, s * 0.34, 0, 6.3);
    else if (k === 'r') [-0.2, 0.18].forEach(d => { x.moveTo(cx + (d - 0.15) * s, cy - 0.3 * s); x.lineTo(cx + (d + 0.15) * s, cy); x.lineTo(cx + (d - 0.15) * s, cy + 0.3 * s); });
    else for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3 + 0.26; x.moveTo(cx - Math.cos(a) * s * 0.38, cy - Math.sin(a) * s * 0.38); x.lineTo(cx + Math.cos(a) * s * 0.38, cy + Math.sin(a) * s * 0.38); }
    x.stroke();
  }
  // lettering in which {p}, {r} and {e} are drawn as the marks. Words take the color of the mark before them
  function inkLine(x, str, cx, y, size, col, align) {
    const bits = String(str).trim().split(/(\{[pre]\})/).filter(Boolean); hand(x, size); if (bits.length > 1 && bits[0] === '{p}') bits[1] = bits[1].replace(/^\s+/, '');
    const word = (b, i) => (b[1] === 'p' || /^\s*times/.test(bits[i + 1] || '') ? '' : /^\s*[+-]/.test(bits[i + 1] || '') ? 'mult' : 'times'), ws = bits.map((b, i) => (b[0] === '{' ? x.measureText(word(b, i)).width : x.measureText(b).width)), tot = ws.reduce((a, b) => a + b, 0);
    let px0 = align === 'right' ? cx - tot : align === 'left' ? cx : cx - tot / 2, cur = col; x.textAlign = 'left';
    bits.forEach((b, i) => { if (b[0] === '{') { cur = PART[b[1]]; const w = word(b, i); if (w) { x.fillStyle = cur; x.fillText(w, px0, y); } } else { x.fillStyle = cur || col; x.fillText(b, px0, y); } px0 += ws[i]; });
    return tot;
  }
  // a line struck through by hand: it wanders a little, and only the first k of its length is drawn while it is being struck
  // a flag on a pole, drawn by hand: the number to beat, and each mark past it
  function flag(x, cx, by, h, col, full) { x.strokeStyle = col; x.lineWidth = Math.max(4, h * 0.075); x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(cx + 1, by); x.lineTo(cx - 2, by - h); x.stroke(); x.beginPath(); x.moveTo(cx - 2, by - h); x.lineTo(cx + h * 0.56, by - h * 0.76); x.lineTo(cx - 1, by - h * 0.5); x.closePath(); x.fillStyle = full ? col : '#fbf8ee'; x.fill(); x.stroke(); }
  const TRK = SHP ? SHP.trk : { x0: -10.4, x1: 14.0, z: 12.0 }, FORM = { x: EDGE + 0.3, z: 9.45 };
  if (PGE.on) TRK.z += PGE.dz;
  function strike(x, x0, y0, x1, y1, k, lw, col) { k = Math.max(0, Math.min(1, k)); if (k <= 0) return; if (k < 1) dirty = true; x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); const n = 10; for (let i = 0; i <= n; i++) { const t = k * i / n, j = Math.sin(t * 7 + x0 * 0.03) * lw * 0.35; if (i) x.lineTo(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + j); else x.moveTo(x0, y0 + j); } x.stroke(); }
  const swipe = (x, a, b, w, col) => { x.strokeStyle = col || HILITE; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); };
  function ends(i) { const p = SPOT[i], dx = p.x - C0.x, dz = p.z + 3 - C0.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d; return { a: { x: p.x - ux * 3.2, z: p.z + 2.9 - uz * 2.6 }, b: { x: p.x - ux * 0.6, z: p.z + 2.9 } }; }
  // ---- marginalia (?notes=0|1|2, remembered): things written and drawn at the edges of the page in the game's pen, faint and small ----
  // 0 none; 1 sketches only (a flask, an arrow, a crossed-out sum, a ring scribbled over, tally marks); 2 the same and a few short notes.
  // Different on every screen, seeded, none repeated within a run. Only the page's edges: the strip along the top, the bottom right corner, the margin on the left.
  let NOTES = 1; try { const q = new URLSearchParams(root.location.search).get('notes'); if (q !== null && q !== '') { NOTES = Math.max(0, Math.min(2, +q || 0)); root.localStorage.setItem('aa_notes', String(NOTES)); } else { const v = root.localStorage.getItem('aa_notes'); if (v !== null) NOTES = Math.max(0, Math.min(2, +v || 0)); } } catch (e) { /* no storage */ }
  const NC = 'rgba(38,48,80,0.78)';
  // doodles, drawn in the page's pen colour, dark enough to read; s is their size in ink pixels
  const MS = {
    flask: (c, s) => { c.beginPath(); c.moveTo(-0.14 * s, -0.5 * s); c.lineTo(-0.14 * s, -0.15 * s); c.lineTo(-0.45 * s, 0.4 * s); c.lineTo(0.45 * s, 0.4 * s); c.lineTo(0.14 * s, -0.15 * s); c.lineTo(0.14 * s, -0.5 * s); c.moveTo(-0.2 * s, -0.5 * s); c.lineTo(0.2 * s, -0.5 * s); c.moveTo(-0.3 * s, 0.14 * s); c.quadraticCurveTo(0, 0.24 * s, 0.3 * s, 0.14 * s); c.stroke(); c.beginPath(); c.arc(0.05 * s, -0.7 * s, 0.06 * s, 0, 6.3); c.arc(-0.1 * s, -0.9 * s, 0.04 * s, 0, 6.3); c.stroke(); },
    homunculus: (c, s) => { c.beginPath(); c.arc(0, -0.3 * s, 0.22 * s, 0, 6.3); c.moveTo(-0.08 * s, -0.34 * s); c.lineTo(-0.08 * s, -0.3 * s); c.moveTo(0.08 * s, -0.34 * s); c.lineTo(0.08 * s, -0.3 * s); c.moveTo(-0.08 * s, -0.2 * s); c.quadraticCurveTo(0, -0.14 * s, 0.08 * s, -0.2 * s); c.moveTo(0, -0.08 * s); c.lineTo(0, 0.3 * s); c.moveTo(-0.28 * s, 0.05 * s); c.lineTo(0, 0.0); c.lineTo(0.28 * s, -0.1 * s); c.moveTo(0, 0.3 * s); c.lineTo(-0.16 * s, 0.55 * s); c.moveTo(0, 0.3 * s); c.lineTo(0.16 * s, 0.55 * s); c.moveTo(-0.2 * s, -0.5 * s); c.lineTo(-0.1 * s, -0.62 * s); c.lineTo(0, -0.5 * s); c.lineTo(0.1 * s, -0.62 * s); c.lineTo(0.2 * s, -0.5 * s); c.stroke(); },
    eye: (c, s) => { c.beginPath(); c.moveTo(-0.5 * s, 0); c.quadraticCurveTo(0, -0.5 * s, 0.5 * s, 0); c.quadraticCurveTo(0, 0.5 * s, -0.5 * s, 0); c.moveTo(0.14 * s, 0); c.arc(0, 0, 0.14 * s, 0, 6.3); c.moveTo(-0.4 * s, -0.22 * s); c.lineTo(-0.5 * s, -0.36 * s); c.moveTo(0, -0.34 * s); c.lineTo(0, -0.5 * s); c.moveTo(0.4 * s, -0.22 * s); c.lineTo(0.5 * s, -0.36 * s); c.stroke(); },
    moon: (c, s) => { c.beginPath(); c.arc(0, 0, 0.4 * s, 0.9, 5.4); c.quadraticCurveTo(0.12 * s, 0, 0.25 * s, 0.31 * s); c.stroke(); },
    ring: (c, s) => { c.beginPath(); for (let k = 0; k <= 6; k++) { const a = -1.5708 + k * 1.0472; k ? c.lineTo(0.4 * s * Math.cos(a), 0.4 * s * Math.sin(a)) : c.moveTo(0.4 * s * Math.cos(a), 0.4 * s * Math.sin(a)); } c.moveTo(-0.5 * s, -0.1 * s); for (let k = 0; k < 9; k++) c.lineTo((-0.5 + k * 0.125) * s, (k % 2 ? 0.34 : -0.34) * s); c.stroke(); },
    tally: (c, s) => { c.beginPath(); for (let k = 0; k < 4; k++) { c.moveTo((-0.3 + k * 0.2) * s, -0.35 * s); c.lineTo((-0.29 + k * 0.2) * s, 0.35 * s); } c.moveTo(-0.45 * s, 0.2 * s); c.lineTo(0.45 * s, -0.2 * s); c.stroke(); },
    skull: (c, s) => { c.beginPath(); c.arc(0, -0.1 * s, 0.34 * s, 3.4, 6.0); c.lineTo(0.2 * s, 0.35 * s); c.lineTo(-0.2 * s, 0.35 * s); c.lineTo(-0.34 * s, -0.02 * s); c.moveTo(-0.07 * s, -0.08 * s); c.arc(-0.14 * s, -0.08 * s, 0.07 * s, 0, 6.3); c.moveTo(0.21 * s, -0.08 * s); c.arc(0.14 * s, -0.08 * s, 0.07 * s, 0, 6.3); c.stroke(); },
    sum: (c, s, sz) => { AA.rxPen.write(c, '12 + 7 = 20', -0.55 * s, 0.1 * s, sz, { weight: 'thin', color: NC }); c.beginPath(); c.moveTo(-0.6 * s, 0.14 * s); c.lineTo(0.7 * s, -0.16 * s); c.stroke(); AA.rxPen.write(c, '= 19?', 0.1 * s, 0.5 * s, sz, { weight: 'thin', color: NC }); },
    sum2: (c, s, sz) => { AA.rxPen.write(c, '3 x 7 = 22', -0.55 * s, 0.1 * s, sz, { weight: 'thin', color: NC }); c.beginPath(); c.moveTo(-0.55 * s, 0.2 * s); c.lineTo(0.5 * s, 0.2 * s); c.moveTo(-0.55 * s, 0.3 * s); c.lineTo(0.5 * s, 0.3 * s); c.moveTo(-0.55 * s, 0.4 * s); c.lineTo(0.5 * s, 0.4 * s); c.stroke(); }
  };
  const SKETCH = ['flask', 'homunculus', 'eye', 'moon', 'ring', 'tally', 'skull', 'sum', 'sum2'];
  // THE MADNESS (ruling AM): the page starts as a tidy lab notebook and loses its mind as the run goes deeper (round 1 to 9) and as a chain runs long.
  // madLevel() is 0..1 from the round and the length of the chain. It drives the margin notes (three tiers), the handwriting (neat, shaky, frantic),
  // the paper (stains, scorch, blots, a torn corner, tape, ruled lines that wobble), and a little more shake and ink splatter on late hits.
  // ?notes=0 is off; 1 (and 2) is this progression.
  const madLevel = () => { const r = Math.max(1, Math.min(9, (run && run.round) || 1)); return Math.max(0, Math.min(1, (r - 1) / 8 * 0.8 + Math.min(1, ((g && g.casc) || 0) / 14) * 0.2)); };
  const TIER0 = ['Run 3. 40 mg in 5 ml.', 'Temp 22 C.', 'Stirred 10 min.', 'Check the stirrer.', 'Clear solution.', 'Added slowly.', 'Yield noted.', 'Repeat on Monday.', 'Cooled to 5 C.', 'Filtered, washed.', 'Flask 2 of 3.', 'Sample labelled.', 'pH 7.', 'Dried overnight.', 'Colour: pale.', 'Balance zeroed.', 'Reagent from shelf B.', 'See previous page.', 'Glassware clean.', 'Ratio 1 : 2.', 'No change at 5 min.', 'Notebook initialled.'];
  const TIER1 = ['should be 12?', 'why 12', 'recheck the sum~', 'it was clear before', 'who moved the flask', 'smell is odd', 'three times now', 'is this the right shelf', 'the colour changed. did I?', 'ask Gerald', 'not what I wrote last week', 'yield too high. suspicious.', 'again', 'measure it twice', 'the label has changed', 'it is warm. I did not heat it', 'the page is thinner', 'check the balance (again)', 'I am sure it was 40', 'ring closed? already?', 'I wrote 7. it says 9.', 'stir the other way'];
  const TIER2 = ['do NOT feed after midnight', 'it winked at me', 'Doug is hungry', 'the homunculus is humming', 'THE RING CLOSED BY ITSELF', 'it knows my name', 'tell the little ones to stop counting', 'I did not order this', 'it said thank you', 'who is counting', 'there are more atoms now', 'the cat has left the lab', 'not water. NOT water.', 'little one, put it back', 'it grew. it GREW.', 'the lid is breathing', 'smell: purple', 'I am fine I am fine I am fine', 'do not look at it directly', 'the fume hood is on fire (small)', 'its name is Doug. Doug is the flask.', 'it is watching the other flask', 'who taught it to nod', 'GOLD-ISH IS NOT GOLD', 'the page turned itself', 'the lead is the cat'];
  const SKETCH_EARLY = ['flask', 'tally', 'sum'], SKETCH_MID = ['flask', 'tally', 'sum', 'sum2', 'ring'], SKETCH_LATE = ['flask', 'tally', 'ring', 'sum2', 'sum']; /* (builder 12) no eyes, skulls, moons or figures in the margin: the owner's tone rule */
  // handwriting by madness: neat, then shaky, then frantic (each letter off its line and askew)
  function scrawl(c, t, x0, y0, sz, m, rnd, col) {
    if (m < 0.3) { AA.rxPen.write(c, t, x0, y0, sz, { weight: 'thin', color: col, align: 'left' }); return AA.rxPen.measure(t, sz, 'thin').width; }
    let w = 0; for (let i = 0; i < t.length; i++) { const ch = t[i], pre = AA.rxPen.measure(t.slice(0, i), sz, 'thin').width, jx = (rnd() - 0.5) * m * 3, jy = (rnd() - 0.5) * m * 9, rot = (rnd() - 0.5) * m * 0.4 + m * 0.08; c.save(); c.translate(x0 + pre + jx, y0 + jy); c.rotate(rot); AA.rxPen.write(c, ch, 0, 0, sz * (0.92 + rnd() * 0.2 + m * 0.1), { weight: m > 0.6 ? 'heavy' : 'thin', color: col, align: 'left' }); c.restore(); w = pre; }
    return w + sz * 0.4;
  }
  function buildMargin(m, tick) {
    let sd = (st.noteRun * 2654435761 + tick * 40503 + 17) >>> 0; const R = () => (sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296;
    const cv = document.createElement('canvas'); cv.width = IW; cv.height = IH; const c = cv.getContext('2d');
    // the paper going wrong: stains, scorch, blots, a torn corner, tape, ruled lines that wobble (only at the edges and under everything else)
    const stains = 0;   // the page's stains are drawn by pageStains, on free paper only
    const spots = [[1860, 1000], [250, 330], [1560, 250], [1890, 640], [150, 600], [140, 440], [1700, 300], [430, 290]];
    for (let k = 0; k < stains && k < spots.length; k++) { const q = spots[k], kind = k % 3; if (kind === 0) { c.strokeStyle = 'rgba(120,82,42,0.3)'; c.lineWidth = 9; c.beginPath(); c.arc(q[0], q[1], 60 + R() * 30, 0.2, 5.8); c.stroke(); } else if (kind === 1) { const g2 = c.createRadialGradient(q[0], q[1], 6, q[0], q[1], 90); g2.addColorStop(0, 'rgba(60,35,15,0.4)'); g2.addColorStop(1, 'rgba(150,100,50,0)'); c.fillStyle = g2; c.beginPath(); c.ellipse(q[0], q[1], 100, 70, R(), 0, 6.3); c.fill(); } else { c.fillStyle = 'rgba(25,30,60,0.55)'; c.beginPath(); c.ellipse(q[0], q[1], 14 + R() * 16, 10 + R() * 12, R() * 3, 0, 6.3); c.fill(); for (let j = 0; j < 7; j++) { c.beginPath(); c.arc(q[0] + (R() - 0.5) * 120, q[1] + (R() - 0.5) * 80, 2 + R() * 5, 0, 6.3); c.fill(); } } }
    if (m > 0.55) { c.fillStyle = 'rgba(40,40,44,0.85)'; c.beginPath(); c.moveTo(1640, 1230); c.lineTo(1760, 1130); c.lineTo(1760, 1230); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 5; c.beginPath(); c.moveTo(1640, 1230); c.lineTo(1672, 1196); c.lineTo(1712, 1204); c.lineTo(1760, 1130); c.stroke(); }
    if (m > 0.4) { c.save(); c.translate(1760, 250); c.rotate(0.6); c.fillStyle = 'rgba(226,225,214,0.78)'; c.fillRect(-100, -22, 210, 46); c.strokeStyle = 'rgba(140,138,125,0.45)'; c.strokeRect(-100, -22, 210, 46); c.restore(); }
    if (m > 0.62) { c.strokeStyle = 'rgba(105,145,205,0.3)'; c.lineWidth = 1.8; for (let yy = 220; yy < IH; yy += 44) { c.beginPath(); for (let xx = 0; xx <= IW; xx += 16) { const yv = yy + Math.sin(xx * 0.018 + yy) * (m - 0.55) * 22; xx ? c.lineTo(xx, yv) : c.moveTo(xx, yv); } c.stroke(); } }
    // the notes: more, larger and wilder with madness; never over the molecule, the yield or the reagents
    const pool = m < 0.34 ? TIER0 : m < 0.67 ? TIER1 : TIER2, used = st.noteUsed, take = pl => { let f = pl.filter(k => used.indexOf(k) < 0); if (!f.length) { st.noteUsed = used.filter(k => pl.indexOf(k) < 0); f = pl.slice(); } const k = f[Math.floor(R() * f.length)]; st.noteUsed.push(k); return k; };
    const n = m < 0.2 ? 1 : m < 0.45 ? 2 : m < 0.7 ? 3 : 4, sz = 38 + m * 8, col = 'rgba(38,48,80,' + (0.7 + m * 0.2).toFixed(2) + ')', slots = [{ x: 296, y: 318, w: 330, n: 2 }, { x: 1600, y: 500, w: 290, n: 2 }, { x: 296, y: 452, w: 330, n: 2 }, { x: 760, y: 242, w: 560, n: 1 }];
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 3.6 + m * 2; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 0; i < n; i++) { const sl = slots[i]; let t = take(pool); const strike = t.endsWith('~'); t = t.replace('~', ''); let z = Math.min(sz, 36);
      const wrap = zz => { const words = t.split(' '), lines = ['']; words.forEach(wd => { const cur = lines[lines.length - 1], tr = cur ? cur + ' ' + wd : wd; if (cur && AA.rxPen.measure(tr, zz, 'thin').width * (1 + m * 0.1) > sl.w) lines.push(wd); else lines[lines.length - 1] = tr; }); return lines; };
      let lines = wrap(z); for (let guard = 0; guard < 8 && (lines.length > sl.n || lines.some(l => AA.rxPen.measure(l, z, 'thin').width * (1 + m * 0.1) > sl.w)); guard++) { z *= 0.92; lines = wrap(z); }
      lines.slice(0, sl.n).forEach((ln, li) => { const tw = AA.rxPen.measure(ln, z, 'thin').width; c.save(); c.translate(sl.x, sl.y + li * z * 1.05); c.rotate((R() - 0.5) * m * 0.06); scrawl(c, ln, 0, 0, z, m, R, col); if (strike || (m > 0.34 && R() < 0.3)) { c.beginPath(); c.moveTo(-4, -z * 0.3); c.lineTo(tw + 4, -z * 0.42); c.stroke(); } if (m > 0.5 && R() < 0.3) { c.beginPath(); c.moveTo(0, z * 0.22); c.lineTo(tw, z * 0.22 + (R() - 0.5) * 5); c.stroke(); } c.restore(); }); }
    const sk = m < 0.34 ? SKETCH_EARLY : m < 0.67 ? SKETCH_MID : SKETCH_LATE, ns = m < 0.1 ? 0 : m < 0.5 ? 1 : m < 0.8 ? 2 : 3, sp = [[1500, 250, 34], [660, 320, 34], [1830, 640, 36]];
    for (let i = 0; i < ns; i++) { const k = take(sk), q = sp[i]; c.save(); c.translate(q[0], q[1]); c.rotate((R() - 0.5) * m * 0.5); MS[k](c, q[2] * (1 + m * 0.3), 30); c.restore(); }
    return cv;
  }
  function marginalia(c, now0) {
    if (PGE.on) return;
    if (!NOTES || !AA.rxPen) return;
    if (st.noteRun == null) { st.noteRun = (Math.random() * 1e6) | 0; st.noteUsed = []; st.noteTick = 0; }
    const m = madLevel(); st.madness = m; const key = (st.noteTick | 0) + ':' + Math.floor(m * 6);
    if (!st.noteSet || st.noteSet.key !== key) st.noteSet = { key, cv: buildMargin(m, st.noteTick | 0) };
    if (AA.rxFeel && AA.rxFeel.noteKick && AA.rxFeel.noteKick(now0)) return noteStrips(c, now0);
    c.drawImage(st.noteSet.cv, 0, 0);
  }
  // while the OVERREACT shockwave crosses the page the margin is drawn in pieces, each kicked outward as the ring passes under it
  function noteStrips(c, now0) { const cv = st.noteSet.cv, nx = 16, ny = 8, w = IW / nx, h = IH / ny; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const q = AA.rxFeel.noteKick(now0, (i + 0.5) * w, (j + 0.5) * h) || [0, 0]; c.drawImage(cv, i * w, j * h, w, h, i * w + q[0], j * h + q[1], w, h); } }
  // ---- builder E: the margin (rulings AI, AM, AM3) ----
  // The sheet runs on to the left of the old one (marginMeshE): a wide margin column on the left of the red line, with its own layer of ink.
  // Notes, doodles and their crossings-out are written only there, outside the play rectangle (PGE.play); late in a run they grow, crowd the
  // column and creep a little over the red line where nothing stands. Every note has a box measured
  // from its own ink; a note is only set down where its box is in the frame, clear of the other notes and clear of the top bar, the molecule's home, the
  // reagents, the left column and the yield band. One note is written in, stroke by stroke, at the start of each page; none while a chain runs, when
  // the whole margin dims to a quarter. Round 1 has one neat note; the deeper the round, the more there are, the larger and the wilder.
  // Lines come from AA.notesPick (notes_data.js) when it is loaded, else from the three lists above. ?unlocks=0..1 overrides the share of unlocks owned.
  const mE = { list: [], used: {}, dim: 1, sv: null, svKey: '', key: '', tick: -1, tags: [], lastT: 0, w: {}, tmp: null, mesh: null, sig: '', dbg: { room: 0, lines: 0, fit: 0, fit2: 0, none: 0 } };
  const inkR = r => { const a = px({ x: r.x0, z: r.z0 }), b = px({ x: r.x1, z: r.z1 }); return [a[0], a[1], b[0], b[1]]; };
  const keepE = () => ({ top: inkR(PGE.top), home: inkR(PGE.home), band: inkR(PGE.band), reagents: inkR(PGE.reag), left: inkR(PGE.left) });
  const seenE = (ix, iy) => { _sv.set(ix / U - SW / 2, 0.02, iy / U - SH / 2).project(camRest); return Math.abs(_sv.x) < 0.972 && Math.abs(_sv.y) < 0.95; };
  const hitE = (a, b, pad) => a[0] < b[2] + pad && a[2] > b[0] - pad && a[1] < b[3] + pad && a[3] > b[1] - pad;
  const holeXE = () => (PGE.holeX + SW / 2) * U, holesE = () => [0.22, 0.42, 0.62].map(f => [holeXE() - 32, IH * f - 32, holeXE() + 34, IH * f + 36]);
  const rndE = s => { let sd = s >>> 0; return () => (sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0) / 4294967296; };
  const capE = r => [1, 2, 3, 4, 5, 6, 8, 9, 11][Math.max(1, Math.min(9, r)) - 1];
  const penW = (s, sz) => { const q = AA.rxPen.measure(s, sz, 'thin'); return q.advance || q.width || 0; };
  // the share of everything that can be unlocked that this player owns, 0..1
  function unlocksE() {
    try { const q = new URLSearchParams(root.location.search).get('unlocks'); if (q != null && q !== '' && isFinite(+q)) return Math.max(0, Math.min(1, +q)); } catch (e) { /* no window */ }
    let have = 0, all = 0; try { all += P.SUPPLY.length - 1; have += meta.tier | 0; all += P.FAMILIES.length; have += P.FAMILIES.filter(f => meta.fam[f.id]).length; all += 10; have += Math.min(10, Object.keys(meta.hatched || {}).filter(k => meta.hatched[k]).length); } catch (e) { /* rules not there */ }
    return all ? Math.max(0, Math.min(1, have / all)) : 0;
  }
  // a line of text into letters: ~struck~ is crossed out, _under_ is underlined, a lone ~ at the end crosses the whole line out
  function parseE(t) { t = String(t); let s = false, u = false; if (/^[^~]*~$/.test(t)) { s = true; t = t.slice(0, -1); } const out = []; for (const ch of t) { if (ch === '~') { s = !s; continue; } if (ch === '_') { u = !u; continue; } out.push({ ch, s, u }); } return out; }
  function wrapE(chars, sz, maxW) { const words = [[]]; chars.forEach(q => { if (q.ch === ' ') words.push([]); else words[words.length - 1].push(q); }); const lines = [[]], wd = a => penW(a.map(q => q.ch).join(''), sz) * 1.06;
    words.filter(w => w.length).forEach(w => { const cur = lines[lines.length - 1], tr = cur.length ? cur.concat([{ ch: ' ', s: cur[cur.length - 1].s && w[0].s, u: cur[cur.length - 1].u && w[0].u }], w) : w.slice(); if (cur.length && wd(tr) > maxW) lines.push(w.slice()); else lines[lines.length - 1] = tr; }); return lines; }
  // one note in ink: its lines in one of three hands (mh: neat under 0.3, shaky, frantic), then its crossings-out and underlinings; k is how much of it is written (0..1)
  function inkNoteE(c, n, k) {
    const col = n.col, sz = n.sz, mh = n.mh; c.save(); c.translate(n.ax, n.ay); c.rotate(n.rot); c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
    if (n.doodle) { c.lineWidth = 3.2 + mh * 2; if (k < 1) { c.beginPath(); c.rect(-n.s * 1.2, -n.s * 1.3, n.s * 2.6 * k, n.s * 2.6); c.clip(); } MS[n.doodle](c, n.s, Math.max(22, n.s * 0.42)); c.restore(); return; }
    const tot = n.lines.reduce((a, l) => a + l.length + 3, 0); let done = 0;
    n.lines.forEach((ln, li) => { const R = rndE(n.seed + li * 977 + 5), y = li * sz * n.lh, txt = ln.map(q => q.ch).join(''), lk = Math.max(0, Math.min(1, (k * tot - done) / ln.length)); done += ln.length;
      if (lk > 0) { if (mh < 0.3) AA.rxPen.write(c, txt, 0, y, sz, { weight: 'thin', color: col, align: 'left', t: lk });
        else for (let i = 0; i < ln.length; i++) { const pre = penW(txt.slice(0, i), sz), jx = (R() - 0.5) * mh * 3, jy = (R() - 0.5) * mh * 9, rot = (R() - 0.5) * mh * 0.4 + mh * 0.06, zz = sz * (0.92 + R() * 0.2 + mh * 0.1), ck = Math.max(0, Math.min(1, lk * ln.length - i)); if (ck <= 0 || ln[i].ch === ' ') continue; c.save(); c.translate(pre + jx, y + jy); c.rotate(rot); AA.rxPen.write(c, ln[i].ch, 0, 0, zz, { weight: mh > 0.75 ? 'heavy' : 'thin', color: col, align: 'left', t: ck }); c.restore(); } }
      const sk = Math.max(0, Math.min(1, (k * tot - done) / 3)); done += 3; if (sk <= 0) return;
      c.lineWidth = Math.max(2.6, sz * 0.085) * (1 + mh * 0.5); let i = 0;
      while (i < ln.length) { const f = ln[i].s ? 's' : ln[i].u ? 'u' : ''; if (!f) { i++; continue; } let j = i; while (j < ln.length && (f === 's' ? ln[j].s : ln[j].u && !ln[j].s)) j++;
        const x0 = penW(txt.slice(0, i), sz) - 4, x1 = penW(txt.slice(0, j), sz) + 4, yy = f === 's' ? y - sz * 0.3 : y + sz * 0.2, tilt = f === 's' ? -sz * 0.1 : 0; c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 + (x1 - x0) * sk, yy + tilt * sk); c.stroke();
        if (mh > 0.6) { c.beginPath(); c.moveTo(x0, yy + sz * 0.13); c.lineTo(x0 + (x1 - x0) * sk, yy + sz * 0.13 + tilt * 0.3 * sk); c.stroke(); } i = j; } });
    c.restore();
  }
  // the note drawn once by itself, to find the box of its ink (relative to where its first letter starts) and to keep its picture
  function boundsE(n) { const W = 760, H = 560, OX = 150, OY = 150, cv = mE.tmp || (mE.tmp = document.createElement('canvas')); cv.width = W; cv.height = H; const c = cv.getContext('2d'), ax = n.ax, ay = n.ay; n.ax = OX; n.ay = OY; inkNoteE(c, n, 1); n.ax = ax; n.ay = ay;
    const d = c.getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = -1, y1 = -1; for (let y = 0; y < H; y++) { const row = y * W * 4 + 3; for (let x = 0; x < W; x++) if (d[row + x * 4] > 4) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    if (x1 < 0 || x0 <= 1 || y0 <= 1 || x1 >= W - 2 || y1 >= H - 2) return null;
    x0 -= 3; y0 -= 3; x1 += 4; y1 += 4; const img = document.createElement('canvas'); img.width = x1 - x0; img.height = y1 - y0; img.getContext('2d').drawImage(cv, x0, y0, x1 - x0, y1 - y0, 0, 0, x1 - x0, y1 - y0); n.img = img; return [x0 - OX, y0 - OY, x1 - OX, y1 - OY]; }
  // where a note's box may lie: wholly in the frame, on the paper, clear of everything kept and of the other notes, and outside the play rectangle
  // (late in a run it may reach a little over the red line, from the margin side, beside the molecule's home and above the left column)
  function fitsE(n, ax, ay, r, edges) { const b = n.b, q = [ax + b[0], ay + b[1], ax + b[2], ay + b[3]], K = keepE(), P0 = inkR(PGE.play), creep = r >= 6 ? 22 + (r - 5) * 11 : 0;
    if (q[0] < 8 - PGE.ext * U || q[1] < 8 || q[2] > (PGE.inkW - PGE.ext) * U - 8 || q[3] > IH - 8) return null;
    if (!seenE(q[0], q[1]) || !seenE(q[2], q[1]) || !seenE(q[0], q[3]) || !seenE(q[2], q[3])) return null;
    if (Object.keys(K).some(k => hitE(q, K[k], 12)) || holesE().some(h => hitE(q, h, 2)) || mE.list.some(o => hitE(q, o.box, r >= 7 ? 4 : 9))) return null;
    if (hitE(q, P0, 0)) { if (!(creep && q[0] < P0[0] - 40 && q[2] <= P0[0] + creep && q[1] > K.top[3] + 12 && q[3] < K.left[1] - 12)) return null; }
    else if (q[2] > P0[0] && !edges) return null;
    return q; }
  // the words of the next note: from notes_data.js by depth, unlocks and what has just happened; else from the three lists by depth. None is used twice in a run.
  function pickE(m, r, R, short) { const hand0 = m < 0.34 ? 'neat' : m < 0.67 ? 'shaky' : 'frantic';
    if (AA.notesPick) { try { const hs = run && run.hom ? [String(run.hom)] : []; for (let k = 0; k < 3; k++) { const tag = k === 0 && mE.tags.length ? mE.tags.pop() : undefined, l = AA.notesPick({ depth: m, unlocks: unlocksE(), round: r, tag, homs: hs, used: Object.keys(mE.used) }).filter(o => o && o.t && !mE.used[o.t]); if (l.length) { if (short) { l.sort((p, q) => p.t.length - q.t.length); l.length = Math.max(1, Math.ceil(l.length * 0.3)); } const o = l[Math.floor(R() * l.length)]; mE.used[o.t] = 1; return { t: o.t, hand: o.hand || hand0, big: !!o.big, when: o.when }; } } } catch (e) { /* fall back to the lists */ } }
    const pool = m < 0.34 ? TIER0 : m < 0.67 ? TIER1 : TIER2; let f = pool.filter(t => !mE.used[t]); if (!f.length) { pool.forEach(t => { delete mE.used[t]; }); f = pool; } const t = f[Math.floor(R() * f.length)]; mE.used[t] = 1; return { t, hand: hand0, big: /[A-Z]{3}/.test(t) }; }
  // the left end of what the frame shows of the page at ink height iy
  function leftE(iy) { const L = -PGE.ext * U; if (seenE(L + 4, iy)) return L + 12; let lo = L, hi = PGE.linePx; for (let i = 0; i < 12; i++) { const mid = (lo + hi) / 2; if (seenE(mid, iy)) hi = mid; else lo = mid; } return hi; }
  // the room in the margin for something whose ink runs from y0 to y1: from the frame's edge (or a punched hole) to the red line, and late in a run a little over the line where nothing stands
  function roomE(y0, y1, r) { const K = keepE(), P0 = inkR(PGE.play); let xl = Math.max(leftE(y0), leftE(y1)) + 6; holesE().forEach(h => { if (y0 < h[3] + 4 && y1 > h[1] - 4) xl = Math.max(xl, h[2] + 6); });
    const creep = r >= 6 && y0 > K.top[3] + 16 && y1 < K.left[1] - 16 ? 22 + (r - 5) * 11 : 0; let xr = P0[0] - 18 + creep; if (y0 < K.top[3] + 14) xr = Math.min(xr, K.top[0] - 14); return [xl, xr]; }
  // make one more note or doodle and set it down; when it is not instant it is written in over about a second.
  // Places are tried row by row down the margin and from the frame's edge toward the red line; the first where the measured ink fits is taken.
  function makeE(r, R, instant, now0) { const m = (r - 1) / 8, i = mE.list.length, HV = { neat: 0.1, shaky: 0.5, frantic: 0.95 };
    const doodle = r >= 3 && (r >= 7 ? i % 2 === 1 : i % 3 === 2), red = m > 0.6 && R() < 0.16, col = red ? 'rgba(168,38,34,0.86)' : 'rgba(38,48,80,' + (0.76 + m * 0.14).toFixed(2) + ')', seed = (R() * 1e9) | 0, k0 = Math.floor(R() * 1000), span = IH - 250;
    const setDown = (q, ax, ay) => { if (!fitsE(q, ax, ay, r, false)) { mE.dbg.fit++; return false; } const est = q.b; q.b = boundsE(q); const box = q.b && fitsE(q, ax, ay, r, false); if (!box) { q.b = est; mE.dbg.fit2++; return false; } q.ax = ax; q.ay = ay; q.box = box; return true; };
    let n = null;
    if (doodle) { const sk = m < 0.3 ? SKETCH_EARLY : m < 0.62 ? SKETCH_MID : SKETCH_LATE, name = sk[Math.floor(R() * sk.length)], s0 = 50 + m * 30 + R() * 16, rot = (R() - 0.5) * m * 0.6;
      for (let a = 0; a < 4 && !n; a++) { const s = s0 * (1 - a * 0.14);
        for (let kk = 0; kk < 26 && !n; kk++) { const ay = 120 + ((k0 * 47 + kk * 43) % span), rm = roomE(ay - s * 1.1, ay + s * 0.8, r), q = { doodle: name, s, mh: 0.2 + m * 0.7, rot, col, seed, ax: 0, ay: 0, sz: 30 }; if (rm[1] - rm[0] < s * 1.7) { mE.dbg.room++; continue; }
          q.b = [-s * 0.85, -s * 1.1, s * 0.85, s * 0.8]; for (let ax = rm[0] + s * 0.85 + (k0 % 3) * 9; ax + s * 0.85 <= rm[1] && !n; ax += 18) if (setDown(q, ax, ay)) n = q; } } }
    else for (let p = 0; p < 4 && !n; p++) { const pk = pickE(m, r, R, p > 0 || i >= (r >= 6 ? 1 : 4)), chars = parseE(pk.t), neat = pk.hand === 'neat', mh = (HV[pk.hand] || 0.1) * (neat ? 1 : 0.7 + 0.3 * m), strikeAll = m > 0.2 && !neat && chars.length < 26 && !chars.some(q => q.s) && R() < 0.2; if (strikeAll) chars.forEach(q => { q.s = true; });
      const sz0 = Math.min(chars.length > 28 ? 40 : 60, 35 + m * 9 + R() * m * 8 + (pk.big && r >= 6 ? 6 + R() * 8 : 0)), lh = 1.12 + mh * 0.12, rot = neat ? 0 : (R() - 0.5) * (0.04 + m * 0.16), plain = chars.map(q => q.ch).join('');
      for (let a = 0; a < 5 && !n; a++) { const sz = Math.max(30, sz0 * (1 - a * 0.09));
        for (let kk = 0; kk < 30 && !n; kk++) { const ay = neat ? 196 + 40 * (3 + ((k0 + kk * 4) % 25)) - 5 : 110 + ((k0 * 53 + kk * 41) % span), r0 = roomE(ay - sz, ay + sz, r), est = Math.max(1, Math.ceil(penW(plain, sz) * 1.1 / Math.max(110, r0[1] - r0[0] - 30))), rm = roomE(ay - sz, ay + (est + 0.6) * sz * lh, r), maxW = rm[1] - rm[0]; if (maxW < 110) { mE.dbg.room++; continue; }
          const lines = wrapE(chars, sz, maxW - 12 - mh * 14); if (lines.length > 8 || lines.length > est + 2) { mE.dbg.lines++; continue; } const lw = Math.max.apply(null, lines.map(l => penW(l.map(c => c.ch).join(''), sz))), q = { lines, sz, lh, mh, rot, col, seed, ax: 0, ay: 0, t: pk.t };
          q.b = [-8, -sz * 1.05, lw + 10 + mh * 14, (lines.length - 1) * sz * lh + sz * 0.45]; for (let ax = rm[0] + 4 + (neat ? 0 : (k0 % 4) * 5); ax + q.b[2] <= rm[1] + 2 && !n; ax += neat ? 1e6 : 16) if (setDown(q, ax, ay)) n = q; } }
      if (!n) delete mE.used[pk.t]; }
    if (!n) { mE.dbg.none++; return null; } const len = n.doodle ? 14 : n.lines.reduce((s, l) => s + l.length, 0); n.t0 = instant ? -1e12 : now0 + 500; n.dur = Math.max(900, Math.min(1900, 520 + 48 * len)); n.done = !!instant; mE.list.push(n); return n; }
  // what has just happened, for the next note's words
  function tagsE() { const w = mE.w, tag = t => { if (mE.tags[mE.tags.length - 1] !== t) mE.tags.push(t); if (mE.tags.length > 6) mE.tags.shift(); };
    try { const cr = meta.credit | 0, un = (meta.tier | 0) + Object.keys(meta.fam || {}).length + Object.keys(meta.found || {}).length + Object.keys(meta.hatched || {}).length, co = (run && run.coins) || 0;
      if (st.mode === 'shop' && w.mode !== 'shop') tag('shop'); if (w.cr != null && cr < w.cr) tag('buy'); if (w.un != null && un > w.un) tag('unlock'); if (w.co != null && co > w.co) tag('gold');
      if (st.mode === 'done' && w.mode !== 'done') tag(st.pass ? 'win' : 'loss');
      const ov = AA.rxFeel && AA.rxFeel.dbg && AA.rxFeel.dbg()[2]; if (ov && !w.ov) tag('overreact'); w.ov = !!ov;
      const busy = !!st.firing; if (w.busy && !busy && g) { if ((g.casc || 0) >= 6) tag('chain'); else if (w.made != null && P.made(g) <= w.made) tag('waste'); } if (busy && !w.busy && g) w.made = P.made(g); w.busy = busy;
      w.cr = cr; w.un = un; w.co = co; w.mode = st.mode; } catch (e) { /* nothing to tell */ } }
  const busyE = () => !!(st.firing || st.starting || (AA.rxFeel && AA.rxFeel.owns && AA.rxFeel.owns()));
  // the notes kept in step with the game: a new page of the notebook each round, one note more at the start of each page, none while a chain runs
  function syncE(now0) { const r = Math.max(1, Math.min(9, (run && run.round) || 1)), playing = !!g && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse'), busy = busyE(), key = st.noteRun + ':' + r;
    if (mE.runKey !== st.noteRun) { mE.runKey = st.noteRun; mE.used = {}; mE.tags.push('start'); }
    if (!playing) return;
    if (mE.key !== key) { mE.key = key; mE.list = []; mE.R = rndE((st.noteRun | 0) * 2654435761 + r * 40503 + 17); const base = Math.max(0, capE(r) - 3); for (let k = 0; k < base; k++) makeE(r, mE.R, true, now0); mE.tick = -1;
      try { if (run.hom && mE.R() < 0.5) mE.tags.push('hom:' + run.hom); const rare = g.m && g.m.atoms && g.m.atoms.find(a => !/^(C|H|O)$/.test(a.el)); if (rare) mE.tags.push('el:' + rare.el); } catch (e) { /* no molecule yet */ } }
    if (mE.tick !== (st.noteTick | 0) && !busy && !mE.list.some(n => !n.done)) { mE.tick = st.noteTick | 0; if (mE.list.length < capE(r)) makeE(r, mE.R, false, now0); } }
  // the sheet runs on to the left: a strip of the same paper with the punched holes in it, and over the whole margin column a layer of ink of its own
  function marginMeshE() { const EW = PGE.ext * U, ex = canvasTex(EW, IH), c = ex.x, MW = PGE.inkW * U, mk = canvasTex(MW, IH);
    paper.x.drawImage(paper.c, 290, 0, 120, IH, 0, 0, 120, IH); paper.t.needsUpdate = true; c.drawImage(paper.c, 290, 0, EW, IH, 0, 0, EW, IH);
    const g0 = c.createLinearGradient(0, 0, 90, 0); g0.addColorStop(0, 'rgba(120,110,100,0.2)'); g0.addColorStop(1, 'rgba(120,110,100,0)'); c.fillStyle = g0; c.fillRect(0, 0, 90, IH);
    if (!SHP) [0.22, 0.42, 0.62].forEach(f => { const hx = holeXE() + EW, hy = IH * f; c.fillStyle = 'rgba(0,0,0,0.14)'; c.beginPath(); c.arc(hx + 2, hy + 3, 31, 0, 6.3); c.fill(); c.fillStyle = PAPERS[PAPERN].bg; c.beginPath(); c.arc(hx, hy, 28, 0, 6.3); c.fill(); c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = 3.5; c.beginPath(); c.arc(hx, hy, 28, 0.6, 3.6); c.stroke(); });
    ex.t.needsUpdate = true; const exm = add(new T.PlaneGeometry(PGE.ext, SH).rotateX(-Math.PI / 2), std({ map: ex.t, roughness: 0.95 }), -SW / 2 - PGE.ext / 2, 0, 0); exm.castShadow = false; exm.visible = SHAPE !== 'b'; clipL(exm); if (SHP) { exm.scale.z = (SHP.z1 + 22) / SH; exm.position.z = (SHP.z1 - 22) / 2; }
    const m = add(new T.PlaneGeometry(PGE.inkW, SH).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: mk.t, transparent: true, depthWrite: false }), -SW / 2 - PGE.ext + PGE.inkW / 2, 0.024, 0); m.castShadow = false; m.receiveShadow = false; m.visible = SHAPE !== 'b'; clipL(m);
    return { cv: mk.c, x: mk.x, t: mk.t, ox: EW, w: MW }; }
  // called every frame: follows what happens, keeps the notes in step, dims the margin while a chain runs, and redraws the margin's ink only when it has changed
  function marginBusyE(now0) { if (!PGE.on) return false; if (!mE.mesh) mE.mesh = marginMeshE(); tagsE();
    const show = !!NOTES && !!AA.rxPen && st.mode !== 'shop' && !(st.mode === 'pick' && SHOPV === 'b'), dt = Math.min(0.1, Math.max(0, (now0 - (mE.lastT || now0)) / 1000)), tg = busyE() ? 0.25 : 1; mE.lastT = now0;
    mE.dim += (tg - mE.dim) * Math.min(1, dt * (tg < mE.dim ? 9 : 4)); if (Math.abs(tg - mE.dim) < 0.01) mE.dim = tg;
    if (show) { if (st.noteRun == null) { st.noteRun = (Math.random() * 1e6) | 0; st.noteUsed = []; st.noteTick = 0; } st.madness = madLevel(); syncE(now0); }
    const playing = !!g && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse'), sig = [show, playing, mE.key, mE.list.length, Math.round(mE.dim * 200)].join('|');
    if (sig !== mE.sig || mE.list.some(n => !n.done)) { mE.sig = sig; paintE(now0, show, playing); }
    return false; }
  // the paper going wrong with depth, under the ink and only in the margin: rings, scorches and blots, and ruled lines that wobble
  function stainsE(r) { const m = (r - 1) / 8, key = st.noteRun + ':' + r, M = mE.mesh; if (mE.sv && mE.svKey === key) return mE.sv; const cv = mE.sv || (mE.sv = document.createElement('canvas')); cv.width = M.w; cv.height = IH; mE.svKey = key; const c = cv.getContext('2d'), R = rndE((st.noteRun | 0) * 31 + r * 7 + 3), lx = PGE.linePx;
    const spots = [[30, 1040], [-40, 420], [120, 660], [-70, 1240], [90, 300], [-20, 820]], cnt = Math.min(spots.length, Math.floor(m * 5.5));
    c.save(); c.translate(M.ox, 0); c.beginPath(); c.rect(-M.ox, 0, M.ox + lx - 6, IH); c.clip();
    for (let k = 0; k < cnt; k++) { const q = spots[k], kind = k % 3; if (kind === 0) { c.strokeStyle = 'rgba(120,82,42,0.22)'; c.lineWidth = 8; c.beginPath(); c.arc(q[0], q[1], 46 + R() * 24, 0.2, 5.8); c.stroke(); } else if (kind === 1) { const g2 = c.createRadialGradient(q[0], q[1], 6, q[0], q[1], 80); g2.addColorStop(0, 'rgba(60,35,15,0.3)'); g2.addColorStop(1, 'rgba(150,100,50,0)'); c.fillStyle = g2; c.beginPath(); c.ellipse(q[0], q[1], 86, 60, R(), 0, 6.3); c.fill(); } else { c.fillStyle = 'rgba(25,30,60,0.45)'; c.beginPath(); c.ellipse(q[0], q[1], 12 + R() * 12, 9 + R() * 9, R() * 3, 0, 6.3); c.fill(); for (let j = 0; j < 6; j++) { c.beginPath(); c.arc(q[0] + (R() - 0.5) * 90, q[1] + (R() - 0.5) * 70, 2 + R() * 4, 0, 6.3); c.fill(); } } }
    if (m > 0.6) { c.strokeStyle = 'rgba(105,145,205,0.3)'; c.lineWidth = 1.8; for (let yy = 196; yy < IH; yy += 40) { c.beginPath(); for (let xx = -M.ox; xx <= lx; xx += 12) { const yv = yy + Math.sin(xx * 0.03 + yy) * (m - 0.55) * 16 * (1 - (xx + M.ox) / (lx + M.ox)); xx > -M.ox ? c.lineTo(xx, yv) : c.moveTo(xx, yv); } c.stroke(); } }
    c.restore(); return cv; }
  // the margin's ink: the stains, then every note (dimmed while a chain runs; the one being written drawn as far as the pen has got)
  function paintE(now0, show, playing) { const M = mE.mesh, c = M.x; c.clearRect(0, 0, M.w, IH); M.t.needsUpdate = true; if (!show) return;
    const r = Math.max(1, Math.min(9, (run && run.round) || 1)); c.drawImage(stainsE(r), 0, 0); c.save(); c.translate(M.ox, 0); c.globalAlpha = mE.dim;
    mE.list.forEach(n => { if (!playing && n.box[2] > PGE.linePx - 6) return; if (!n.done) { const k = (now0 - n.t0) / n.dur; if (k >= 1) n.done = true; else { if (k > 0) inkNoteE(c, n, k); return; } } c.drawImage(n.img, n.ax + n.b[0], n.ay + n.b[1]); });
    c.restore(); }
  // for the record: every note's box, the kept rectangles, and how many inked pixels of the notes fall inside each (it must be none)
  function measureE() { const ox = PGE.ext * U, cv = document.createElement('canvas'); cv.width = IW + ox; cv.height = IH; const c = cv.getContext('2d'); c.translate(ox, 0); mE.list.forEach(n => inkNoteE(c, n, 1)); const K = keepE(), P0 = inkR(PGE.play), out = { round: run && run.round, notes: mE.list.filter(n => !n.doodle).length, doodles: mE.list.filter(n => n.doodle).length, texts: mE.list.map(n => n.doodle || n.t), sizes: mE.list.map(n => Math.round(n.doodle ? n.s : n.sz)), boxes: mE.list.map(n => n.box.map(Math.round)), keep: K, play: P0, inkPx: {}, boxPx: {}, dim: mE.dim, unlocks: unlocksE(), tags: mE.tags.slice(), data: !!AA.notesPick, dbg: mE.dbg };
    const count = q => { const x0 = Math.max(0, Math.round(q[0] + ox)), y0 = Math.max(0, Math.round(q[1])), x1 = Math.min(IW + ox, Math.round(q[2] + ox)), y1 = Math.min(IH, Math.round(q[3])); if (x1 <= x0 || y1 <= y0) return 0; const d = c.getImageData(x0, y0, x1 - x0, y1 - y0).data; let k = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) k++; return k; };
    Object.keys(K).forEach(k => { out.inkPx[k] = count(K[k]); out.boxPx[k] = mE.list.reduce((s, n) => s + Math.max(0, Math.min(n.box[2], K[k][2]) - Math.max(n.box[0], K[k][0])) * Math.max(0, Math.min(n.box[3], K[k][3]) - Math.max(n.box[1], K[k][1])), 0); });
    out.inkPx.play = count(P0); out.inkAll = count([-ox, 0, IW, IH]); return out; }
  // Stains: a different set on every page (seeded by the run, the round and the page, so a recording repeats), more and messier as the run goes on.
  // They lie under all ink, pale, and only on free paper: never inside a keep-clear rectangle (page units), give or take a hair at its edge.
  const keepClear = () => { const H = homeNow(), out = [[H.x - H.w / 2 - 1.2, H.z - H.d / 2 - 1.6, H.x + H.w / 2 + 1.2, H.z + H.d / 2 + 1.6], BENCHV ? [14.6, 15.4, 32, 19.5] : [14.4, -10.4, 30, 12.2], BENCHV ? [-24.3, -11.4, -11.6, 8.2] : [-24.3, -8.4, -11.6, 8.2], BENCHV ? [-31, -20.8, -10.5, -13.9] : [-29.5, -20.5, -12.5, -12.6], BENCHV ? [-24.3, 10.4, 30, 18] : [-24.3, 9.2, 22, 18]]; if (benchOn()) out.push([-24.4, -15.2, 18.6, -8.0]); if (SAFE) out.push([SAFE.gut.x0 - 0.3, -23, SAFE.gut.x1 + 0.3, 23], [SAFE.R.x1, -23, 40, 23], [-40, SAFE.R.z1, 40, 23], [-40, -23, 40, SAFE.R.z0]); return out; };
  const stainRand = seed => { let sd = seed >>> 0; return () => (sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296; };
  function stainSet(seed, mad) { const R = stainRand(seed), rects = keepClear(), out = [], want = 2 + Math.round(mad * 4) + (R() < 0.5 ? 1 : 0), kinds = ['ring', 'ring', 'splash', 'scorch', 'thumb', 'tape'];
    for (let tries = 0; tries < 400 && out.length < want; tries++) { const kind = kinds[Math.floor(R() * kinds.length)], r = kind === 'tape' ? 1.9 : kind === 'thumb' ? 1.0 : 1.1 + R() * (1.2 + mad), x0 = -33 + R() * 61, z0 = -20.5 + R() * 36; if (x0 + r > 28.5 || x0 - r < -35.5 || z0 - r < -21.5 || z0 + r > 15.8) continue;
      let pen = 0; rects.forEach(q => { const dx = Math.max(q[0] - x0, 0, x0 - q[2]), dz = Math.max(q[1] - z0, 0, z0 - q[3]), d = Math.hypot(dx, dz); pen = Math.max(pen, r - d); }); if (pen > 0.1) continue; if (out.some(o => Math.hypot(o.x - x0, o.z - z0) < o.r + r + 0.3)) continue; out.push({ kind, x: x0, z: z0, r, rot: R() * 6.283, a: 0.5 + R() * 0.5, sd: Math.floor(R() * 1e9), pen }); }
    return out; }
  function pageStains(x) { if (!run || st.mode === 'shop') return; const key = (st.noteRun || 1) + ':' + run.round + ':' + (g && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse' || st.mode === 'done') ? g.page : 0) + ':' + st.mode.charAt(0) + (benchOn() ? 'b' : ''); if (st.stainKey !== key) { st.stainKey = key; let hsh = 2166136261; for (let i = 0; i < key.length; i++) hsh = Math.imul(hsh ^ key.charCodeAt(i), 16777619); st.stainList = st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse' || st.mode === 'done' ? stainSet(hsh, madLevel()) : []; if (st.mode === 'play') cupVisit(st.stainList); }
    (st.stainList || []).forEach(q => { if (q.born && performance.now() < q.born) { dirty = true; return; } const c = px(q), r = q.r * U, R = stainRand(q.sd); x.save(); x.translate(c[0], c[1]); x.rotate(q.rot);
      if (q.kind === 'ring') { x.fillStyle = 'rgba(150,105,60,' + (0.05 * q.a).toFixed(3) + ')'; x.beginPath(); x.arc(0, 0, r, 0, 6.3); x.fill(); for (let k = 0; k < 3; k++) { x.strokeStyle = 'rgba(125,85,45,' + (0.2 * q.a * (1 - k * 0.28)).toFixed(3) + ')'; x.lineWidth = (0.13 - k * 0.035) * r; x.beginPath(); x.arc(R() * 4, R() * 4, r * (0.93 + k * 0.012), 0.1 + k * 0.5, 5.6 + k * 0.2); x.stroke(); } }
      else if (q.kind === 'splash') { x.fillStyle = 'rgba(120,90,55,' + (0.14 * q.a).toFixed(3) + ')'; x.beginPath(); x.ellipse(0, 0, r * 0.45, r * 0.36, 0, 0, 6.3); x.fill(); for (let k = 0; k < 9; k++) { const an = R() * 6.283, d = r * (0.5 + R() * 0.5), rr = r * (0.04 + R() * 0.09); x.beginPath(); x.arc(Math.cos(an) * d, Math.sin(an) * d, rr, 0, 6.3); x.fill(); } }
      else if (q.kind === 'scorch') { const gr = x.createRadialGradient(0, 0, r * 0.1, 0, 0, r); gr.addColorStop(0, 'rgba(70,40,15,' + (0.3 * q.a).toFixed(3) + ')'); gr.addColorStop(0.5, 'rgba(140,90,40,' + (0.16 * q.a).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(160,110,60,0)'); x.fillStyle = gr; x.beginPath(); x.ellipse(0, 0, r, r * 0.8, 0, 0, 6.3); x.fill(); }
      else if (q.kind === 'thumb') { x.strokeStyle = 'rgba(70,75,95,' + (0.16 * q.a).toFixed(3) + ')'; x.lineWidth = 2.5; for (let k = 1; k <= 6; k++) { x.beginPath(); x.ellipse(0, k * 1.5, r * k / 6 * 0.72, r * k / 6, 0, 3.4 + R() * 0.3, 6.0 + R() * 0.3); x.stroke(); } }
      else { x.fillStyle = 'rgba(226,225,214,0.75)'; x.fillRect(-r, -r * 0.24, r * 2, r * 0.48); x.strokeStyle = 'rgba(140,138,125,0.4)'; x.lineWidth = 2; x.strokeRect(-r, -r * 0.24, r * 2, r * 0.48); }
      x.restore(); }); }
  // (builder 15) THE NINE SIGILS ON THE PAGE. Each has a mark of our own (sigGlyph), drawn quietly in pencil on the left page while it is held,
  // and inked beside the molecule, with a pen ring round the atoms, at every step whose rule it bent (the step record's `sig`).
  const SIGC = { hits: [], n: 0, g: null, at: { x: -7.2, z: -15.4, dx: -3.3, r: 1.05 } };
  function sigGlyph(x, id, cx, cy, r, col, lw) {
    x.save(); x.translate(cx, cy); x.strokeStyle = col; x.fillStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round';
    const L = function () { x.beginPath(); for (let i = 0; i < arguments.length; i += 2) { if (i) x.lineTo(arguments[i] * r, arguments[i + 1] * r); else x.moveTo(arguments[i] * r, arguments[i + 1] * r); } x.stroke(); };
    const C = (a, b, rr, a0, a1) => { x.beginPath(); x.arc(a * r, b * r, rr * r, a0 == null ? 0 : a0, a1 == null ? 6.2832 : a1); x.stroke(); }, D = (a, b, rr) => { x.beginPath(); x.arc(a * r, b * r, rr * r, 0, 6.2832); x.fill(); };
    const Q = (a, b, c, d, e, f) => { x.beginPath(); x.moveTo(a * r, b * r); x.quadraticCurveTo(c * r, d * r, e * r, f * r); x.stroke(); };
    if (id === 'phlogiston') { L(-0.82, 0.7, 0, -0.85, 0.82, 0.7, -0.82, 0.7); Q(0, 0.45, -0.42, 0.05, 0.02, -0.3); Q(0.02, -0.3, 0.36, 0.1, 0, 0.45); }
    else if (id === 'clepsydra') { L(-0.6, -0.8, 0.6, -0.8, -0.6, 0.8, 0.6, 0.8, -0.6, -0.8); L(-0.85, -0.8, 0.85, -0.8); L(-0.85, 0.8, 0.85, 0.8); D(0, 0.5, 0.1); }
    else if (id === 'via_humida') { C(0, -0.38, 0.44); [0.42, 0.8].forEach(y => { x.beginPath(); for (let i = 0; i <= 16; i++) { const u = -0.85 + 1.7 * i / 16, v = y + 0.11 * Math.sin(i * 1.18); if (i) x.lineTo(u * r, v * r); else x.moveTo(u * r, v * r); } x.stroke(); }); }
    else if (id === 'solve') { C(0, 0, 0.72, 0.5, 5.78); L(0.38, 0, 1.0, 0); D(0, 0, 0.1); }
    else if (id === 'aqua_permanens') { L(-0.82, -0.7, 0.82, -0.7, 0, 0.85, -0.82, -0.7); L(-0.5, -0.02, 0.5, -0.02); C(0, -0.36, 0.14); }
    else if (id === 'tetractys') { for (let k = 0; k < 4; k++) for (let j = 0; j <= k; j++) D((j - k / 2) * 0.5, -0.75 + k * 0.5, 0.105); }
    else if (id === 'respiratio') { C(0, 0, 0.82, 2.2, 4.08); C(0, 0, 0.82, -0.94, 0.94); C(0, 0, 0.24); L(-0.24, 0, -0.56, 0); L(0.24, 0, 0.56, 0); }
    else if (id === 'gemini') { L(-0.38, -0.66, -0.38, 0.66); L(0.38, -0.66, 0.38, 0.66); Q(-0.85, -0.9, 0, -0.5, 0.85, -0.9); Q(-0.85, 0.9, 0, 0.5, 0.85, 0.9); }
    else if (id === 'sulphurs_mask') { L(-0.62, 0.08, 0, -0.88, 0.62, 0.08, -0.62, 0.08); L(0, 0.08, 0, 0.92); L(-0.34, 0.52, 0.34, 0.52); D(-0.19, -0.18, 0.075); D(0.19, -0.18, 0.075); }
    else { C(0, 0, 0.7); }
    x.restore();
  }
  // every frame: a new step record that a sigil changed starts a mark on the molecule
  function sigWatch(now) {
    if (!g || !g.trail || !(st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse' || st.mode === 'done')) { SIGC.g = null; SIGC.hits.length = 0; return; }
    if (SIGC.g !== g || SIGC.n > g.trail.length) { SIGC.g = g; SIGC.n = 0; SIGC.hits = []; }
    while (SIGC.n < g.trail.length) { const r = g.trail[SIGC.n++], ids = r && r.sig ? [].concat.apply([], [].concat(r.sig)).filter(i => typeof i === 'string' && P.SIGILS[i]) : []; if (ids.length) { const fr = g.cur && g.cur.fresh ? Array.from(g.cur.fresh) : []; SIGC.hits.push({ ids, t: now + 260, atoms: r.wasted ? [] : fr, wasted: !!r.wasted }); dirty = true; } }
    if (SIGC.hits.length) { SIGC.hits = SIGC.hits.filter(h => now - h.t < 2500); dirty = true; }
  }
  function sigDraw(x, now) {
    const held = run ? P.sigilsOf(run) : [], U1 = U;
    // held: quiet pencil marks in a row at the foot of the left page, each in a thin ring
    if (held.length && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse' || st.mode === 'done')) { held.slice(0, 3).forEach((id, i) => { const c = px({ x: SIGC.at.x + i * SIGC.at.dx, z: SIGC.at.z }), r = SIGC.at.r * U1, hot = SIGC.hits.some(h => h.ids.includes(id) && now >= h.t), a = hot ? 0.95 : 0.5; x.save(); x.globalAlpha = a; x.strokeStyle = PENCIL; x.lineWidth = Math.max(2, U1 * 0.06); x.beginPath(); x.arc(c[0], c[1], r * 1.32, 0.2 + i, 6.2 + i); x.stroke(); sigGlyph(x, id, c[0], c[1], r * 0.78, hot ? INK : PENCIL, Math.max(2.5, U1 * (hot ? 0.11 : 0.085))); x.restore(); }); }
    // bent: a pen ring round the atoms the step made, the sigil's mark inked beside it
    if (!center) return;
    SIGC.hits.forEach(h => { const age = now - h.t; if (age < 0) return; const a = Math.min(1, age / 140) * (age > 1900 ? Math.max(0, 1 - (age - 1900) / 600) : 1), pts = []; if (a <= 0.01) return;
      h.atoms.forEach(q => { const b = center.balls.get(q); if (!b || q.el === 'H') return; const w = b.mesh.getWorldPosition(new T.Vector3()), t = -w.y / camDir.y; pts.push(px({ x: w.x + camDir.x * t, z: w.z + camDir.z * t })); });
      if (!pts.length) { let x0 = 1e9, x1 = -1e9, z0 = 1e9; center.balls.forEach(b => { const w = b.mesh.getWorldPosition(new T.Vector3()), t = -w.y / camDir.y; x0 = Math.min(x0, w.x + camDir.x * t); x1 = Math.max(x1, w.x + camDir.x * t); z0 = Math.min(z0, w.z + camDir.z * t); }); if (x0 > 1e8) return; pts.push(px({ x: (x0 + x1) / 2, z: z0 - 1.6 })); h.loose = true; }
      let cx = 0, cy = 0; pts.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= pts.length; cy /= pts.length; const rr = h.loose ? 0 : Math.max.apply(null, pts.map(p => Math.hypot(p[0] - cx, p[1] - cy))) + 1.15 * U1, f = Math.min(1, age / 320);
      x.save(); x.globalAlpha = a; x.strokeStyle = INK; x.lineCap = 'round'; x.lineWidth = Math.max(3, U1 * 0.1);
      if (rr) { x.beginPath(); for (let i = 0; i <= 40 * f; i++) { const an = -2.2 + i / 40 * 6.5, wob = 1 + 0.035 * Math.sin(i * 0.9); const qx = cx + Math.cos(an) * rr * wob, qy = cy + Math.sin(an) * rr * 0.92 * wob; if (i) x.lineTo(qx, qy); else x.moveTo(qx, qy); } x.stroke(); }
      const gr = 0.8 * U1, gx = cx + (rr ? rr * 0.78 + gr * 1.1 : 0), gy = cy - (rr ? rr * 0.72 + gr * 0.6 : 0); if (f > 0.5) h.ids.forEach((id, i) => sigGlyph(x, id, gx + i * gr * 2.3, gy, gr, INK, Math.max(3, U1 * 0.1)));
      x.restore(); });
  }
  // (builder 15) a numbered card laid over the picture for a moment: for clips that show the same thing twice (no words: a numeral, and a sigil's mark when one is named)
  const CARDV = { cv: null, n: 0, sig: null, t0: 0, ms: 0 };
  function cardShow(n, sig, ms) { if (!CARDV.cv) { const c = document.createElement('canvas'); c.className = 'veil'; app.append(c); CARDV.cv = c; } CARDV.n = n; CARDV.sig = sig || null; CARDV.t0 = null; CARDV.ms = ms || 1400; }
  function cardFrame(now) { const c = CARDV.cv; if (!c) return; if (!CARDV.ms) { if (c.width) c.width = 0; return; } if (CARDV.t0 == null) CARDV.t0 = now; const W = veil.width || 1280, H = veil.height || 720; if (c.width !== W || c.height !== H) { c.width = W; c.height = H; } const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H); const age = now - CARDV.t0; if (age > CARDV.ms) { CARDV.ms = 0; c.width = 0; return; }
    const k = W / 1280, a = Math.min(1, age / 160) * Math.min(1, (CARDV.ms - age) / 220), drop = (1 - Math.min(1, age / 200)) * 40 * k; x.save(); x.globalAlpha = Math.max(0, a); x.fillStyle = 'rgba(30,24,16,0.28)'; x.fillRect(0, 0, W, H); x.translate(W / 2, H / 2 - drop); x.rotate(-0.035);
    const cw = (CARDV.sig ? 430 : 260) * k, ch = 330 * k; x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(-cw / 2 + 9 * k, -ch / 2 + 12 * k, cw, ch); x.fillStyle = '#f4efdf'; x.fillRect(-cw / 2, -ch / 2, cw, ch); x.strokeStyle = INK; x.lineWidth = 5 * k; x.strokeRect(-cw / 2 + 12 * k, -ch / 2 + 12 * k, cw - 24 * k, ch - 24 * k);
    try { AA.rxPen.write(x, String(CARDV.n), CARDV.sig ? -cw / 4 + 10 * k : 0, 78 * k, 250 * k, { weight: 'heavy', color: INK, align: 'center' }); } catch (e) { x.fillStyle = INK; x.font = (200 * k) + 'px sans-serif'; x.textAlign = 'center'; x.fillText(String(CARDV.n), 0, 70 * k); }
    if (CARDV.sig) sigGlyph(x, CARDV.sig, cw / 4 - 6 * k, 0, 86 * k, INK, 9 * k); x.restore(); }
  // (builder 17) THE MOLECULE'S PROPERTIES (ruling AZ): the six the rules read (P.kinsOf: cage, ring, arene, sugar, chain, resonance), shown three
  // ways behind ?kin=a|b|c (nothing is picked; without it nothing is drawn). a: on the molecule, where the property lives, on the music's clock:
  // a sheen runs back and forth along the alternating bonds (faster with more links), a benzene ring's inner circle turns, a pencil dash goes once
  // round a ring every bar, the O-H hydrogens catch a glint in turn, a cage's back bonds breathe paler; a chain has nothing. b: a row of our own
  // inked marks under the molecule (AA.rxMarks.kin), dots for the level; a mark inks itself in when gained, is struck out when lost, stamps on the
  // beat when it pays. c: the marks in quiet pencil, and the on-molecule animation only for a moment when a property is gained or pays.
  // No words, no colour, no atom is moved. Drawn on a canvas of its own over the picture (a .veil, width 0 when off); the sheen and the cage's
  // paling are cut away over the atoms, so no ball is covered. A property PAYS when a step's record carries it (ev src 'motif' or 'family').
  const KINV = { mode: (() => { try { const v = new URLSearchParams(root.location.search).get('kin'); return v === 'a' || v === 'b' || v === 'c' ? v : v === '0' ? null : 'c'; } catch (e) { return 'c'; } })(), cv: null, c: null, g: null, n: 0, F: null, S: {}, W: 1280, H: 720, clk: { beat: null, b0: null, off: null, len: 0.5, live: -1e9 }, v: new T.Vector3(), at: { x: null, z: null }, err: null };
  // (builder 18) what is shown is the TWELVE MOTIFS the rules pay by: the levels are P.motifsOf(model), which are open this run P.motifOpen(g), what a
  // step paid is its record's ev of src 'motif' (motifs: [{ id, level, rate }]: 1 + rate x level each). Nothing of the rules is worked out here; the
  // page only finds WHERE a motif sits on the drawing (kinFeat's `where`), to point at it. A motif held but not open is a faint dashed outline.
  const MIDS = ['sugar', 'resonance', 'arene', 'ring', 'fusion', 'cage', 'spiro', 'acid', 'amine', 'sulfur', 'branch', 'chain'];
  // beats on the music's clock (a steady half second when no music with a beat plays, as in a recording, whose sound is rendered afterwards)
  function kinBeat(now) {
    const K = KINV.clk; try { const c = AA.music && AA.music.clock && AA.music.clock(); if (c && c.beat > 0 && c.spu > 0) { const len = c.spu * (c.upb === 12 ? 6 : 4); if (K.beat != null && c.beat > K.beat + c.spu) K.off = now / 1000 - K.beat; if (K.b0 == null || Math.abs(len - K.len) > 1e-4) K.b0 = c.beat; K.beat = c.beat; K.len = len; K.live = now; } } catch (e) { /* no clock */ }
    if (K.off != null && now - K.live < 600) return (now / 1000 - K.off - K.b0) / K.len; return now / 1000 / 0.5;
  }
  const kinLen = now => (KINV.clk.off != null && now - KINV.clk.live < 600 ? KINV.clk.len : 0.5) * 1000;
  const kinNext = t => { const b = kinBeat(t); return t + (Math.ceil(b - 1e-6) - b) * kinLen(t); };
  // where each property lives on the drawn molecule m
  function kinFeat(m) {
    const mod = m.model, hv = mod.atoms.filter(a => a.el !== 'H' && !a.fly && m.balls.has(a)), set = new Set(hv), nb = new Map(), ix = new Map(); hv.forEach((a, i) => { nb.set(a, []); ix.set(a, i); });
    mod.bonds.forEach(b => { if (set.has(b.a) && set.has(b.b)) { nb.get(b.a).push({ o: b.b, b }); nb.get(b.b).push({ o: b.a, b }); } });
    const rings = [], seen = new Set();
    mod.bonds.forEach(b => { if (!set.has(b.a) || !set.has(b.b)) return; const prev = new Map([[b.a, null]]), qu = [b.a]; let found = false; while (qu.length && !found) { const u = qu.shift(); for (const e of nb.get(u)) { if (e.b === b || prev.has(e.o)) continue; prev.set(e.o, u); if (e.o === b.b) { found = true; break; } qu.push(e.o); } } if (!found) return; const cyc = []; for (let u = b.b; u; u = prev.get(u)) cyc.push(u); if (cyc.length > 12) return; const k = cyc.map(a => ix.get(a)).sort((p, q) => p - q).join(','); if (!seen.has(k)) { seen.add(k); rings.push(cyc); } });
    let ar = new Set(); try { ar = RX.aromaticAtoms(mod); } catch (e) { /* none */ }
    const arene = rings.filter(r => r.length === 6 && r.every(a => ar.has(a))), loops = rings.filter(r => arene.indexOf(r) < 0);
    // the alternating bonds outside benzene rings: the single bonds with a double on each side, and those doubles; the longest way along them
    const dbl = a => mod.neighbors(a).some(n => n.bond.order === 2), inAr = b => ar.has(b.a) && ar.has(b.b), E = new Map(), addE = b => { [[b.a, b.b], [b.b, b.a]].forEach(p => { if (!E.has(p[0])) E.set(p[0], []); if (E.get(p[0]).indexOf(p[1]) < 0) E.get(p[0]).push(p[1]); }); };
    mod.bonds.forEach(b => { if (b.order !== 1 || !set.has(b.a) || !set.has(b.b) || inAr(b) || !dbl(b.a) || !dbl(b.b)) return; addE(b); [b.a, b.b].forEach(a => nb.get(a).forEach(e => { if (e.b.order === 2 && !inAr(e.b)) addE(e.b); })); });
    let conj = []; const walk = (a, path, on) => { if (path.length > conj.length) conj = path.slice(); (E.get(a) || []).forEach(o => { if (on.has(o)) return; on.add(o); path.push(o); walk(o, path, on); path.pop(); on.delete(o); }); };
    Array.from(E.keys()).filter(a => E.get(a).length === 1).concat(Array.from(E.keys()).slice(0, 1)).slice(0, 8).forEach(a => walk(a, [a], new Set([a])));
    const oh = []; mod.atoms.forEach(o => { if (o.el !== 'O' || o.fly || !set.has(o)) return; const n = mod.neighbors(o); if (n.length !== 2 || !n.every(q => q.bond.order === 1)) return; const h = n.find(q => q.atom.el === 'H'); if (h) oh.push({ o, h: h.atom }); });
    let back = m.sticks.filter(q => q.parts && q.parts.some(pt => pt.mesh && pt.mesh.material === backMat));
    if (!back.length && rings.length >= 2) { const inR = new Set(); rings.forEach(r => r.forEach(a => inR.add(a))); const rb = m.sticks.filter(q => inR.has(q.a) && inR.has(q.b) && !q.rung), d = q => { const A = m.balls.get(q.a), B = m.balls.get(q.b); return A && B ? A.mesh.getWorldPosition(KINV.v).distanceTo(cam.position) + B.mesh.getWorldPosition(KINV.v).distanceTo(cam.position) : 0; }; const ds = rb.map(d), md = ds.slice().sort((p, q) => p - q)[Math.floor(ds.length * 0.6)] || 0; back = rb.filter((q, i) => ds[i] > md); }
    // where each of the twelve sits (groups of atoms), for pointing only
    const where = {}, hn = a => (nb.get(a) || []), cgs = new Set(), rs = rings.map(r => new Set(r)); where.fusion = []; where.spiro = [];
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) { const sh = rings[i].filter(a => rs[j].has(a)); if (sh.length >= 3) { rings[i].forEach(a => cgs.add(a)); rings[j].forEach(a => cgs.add(a)); } else if (sh.length === 2) where.fusion.push(sh); else if (sh.length === 1) where.spiro.push(sh); }
    if (!cgs.size) back.forEach(q => { cgs.add(q.a); cgs.add(q.b); });
    where.cage = cgs.size ? [Array.from(cgs).filter(a => set.has(a))] : []; where.arene = arene.slice(); where.ring = loops.filter(r => !r.every(a => cgs.has(a))); if (!where.ring.length) where.ring = loops.slice();
    where.sugar = []; where.acid = []; oh.forEach(q => { const cn = hn(q.o).map(e => e.o).find(a => a.el === 'C'); if (!cn) return; const dO = hn(cn).find(e => e.b.order === 2 && e.o.el === 'O'); if (dO) where.acid.push([cn, q.o, dO.o]); else if (hn(cn).every(e => e.b.order === 1)) where.sugar.push([cn, q.o]); });
    where.amine = hv.filter(a => a.el === 'N' && hn(a).every(e => e.b.order === 1 && ['N', 'O', 'S'].indexOf(e.o.el) < 0) && hn(a).some(e => e.o.el === 'C') && !hn(a).some(e => hn(e.o).some(f => f.b.order === 2 && f.o.el !== 'C'))).map(a => [a]);
    where.sulfur = hv.filter(a => a.el === 'S' && hn(a).every(e => e.b.order === 1) && hn(a).length === 2).map(a => [a]);
    where.branch = hv.filter(a => a.el === 'C' && hn(a).every(e => e.b.order === 1) && hn(a).filter(e => e.o.el === 'C').length >= 3).map(a => [a]);
    { const inR = new Set(); rings.forEach(r => r.forEach(a => inR.add(a))); const ok = new Set(hv.filter(a => a.el === 'C' && !inR.has(a) && hn(a).every(e => e.b.order === 1) && hn(a).filter(e => e.o.el !== 'H').length <= 2)); let best = []; const wk = (a, path, on) => { if (path.length > best.length) best = path.slice(); hn(a).forEach(e => { if (!ok.has(e.o) || on.has(e.o)) return; on.add(e.o); path.push(e.o); wk(e.o, path, on); path.pop(); on.delete(e.o); }); }; Array.from(ok).slice(0, 40).forEach(a => wk(a, [a], new Set([a]))); where.chain = best.length ? [best] : []; }
    { const ra = new Set(hv.filter(a => hn(a).some(e => e.b.order === 2) && hn(a).some(e => e.b.order === 1 && hn(e.o).some(f => f.b.order === 2)))), seenR = new Set(); where.resonance = []; ra.forEach(a => { if (seenR.has(a)) return; const comp = [], qu = [a]; seenR.add(a); while (qu.length) { const u = qu.pop(); comp.push(u); hn(u).forEach(e => { if (ra.has(e.o) && !seenR.has(e.o)) { seenR.add(e.o); qu.push(e.o); } }); } where.resonance.push(comp); }); where.resonance.sort((p, q) => q.length - p.length); }
    return { arene, loops, conj, oh, back, where };
  }
  function kinSync(now) {
    if (!(KINV.mode && g && center && center.model && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse'))) { KINV.g = null; KINV.c = null; return false; }
    if (KINV.g !== g) { KINV.g = g; KINV.S = {}; KINV.n = g.trail ? g.trail.length : 0; KINV.c = null; KINV.first = true; }
    if (KINV.c !== center) { KINV.c = center; let lv = {}, op = MIDS; try { lv = P.motifsOf(center.model); op = P.motifOpen(g); } catch (e) { KINV.err = String(e); } try { KINV.F = kinFeat(center); } catch (e) { KINV.F = null; KINV.err = String(e && e.stack); }
      const t0 = kinNext(now + (morph && morph.m === center ? 520 : 150));
      MIDS.forEach(id => { const s = KINV.S[id] || (KINV.S[id] = { lv: 0, open: true, gain: -1e9, lose: -1e9, pay: -1e9, payAt: 0, was: 0, amt: 0 }), l = lv[id] || 0; s.open = op.indexOf(id) >= 0; if (l > s.lv) { if (!s.lv) { s.gain = KINV.first ? now - 1e7 : t0; s.lose = -1e9; } else s.up = t0; } else if (l < s.lv && !l) { s.lose = t0; s.was = s.lv; s.lostAt = s.at ? s.at.slice() : null; } s.lv = l; }); KINV.first = false; }
    while (g.trail && KINV.n < g.trail.length) { const r = g.trail[KINV.n++], paid = []; ((r && r.ev) || []).forEach(e => { if (e.src === 'motif' && e.motifs) e.motifs.forEach(q => { if (MIDS.indexOf(q.id) >= 0) paid.push(q); }); });
      if (paid.length) { paid.sort((p, q) => MIDS.indexOf(p.id) - MIDS.indexOf(q.id)); const tb = kinNext(now + 240), q4 = kinLen(now) / 4; paid.forEach((q, i) => { const s = KINV.S[q.id]; if (s && (s.lv > 0 || now - s.lose < 900)) { s.payAt = tb + i * q4; s.amtNext = 1 + q.rate * q.level; } }); } }
    Object.keys(KINV.S).forEach(id => { const s = KINV.S[id]; if (s.payAt && now >= s.payAt) { s.pay = s.payAt; s.payAt = 0; s.amt = s.amtNext || s.amt; } });
    return true;
  }
  const kinAct = (s, now) => { if (!s || !(s.lv > 0) || !s.open || KINV.mode === 'b') return 0; if (KINV.mode === 'a') return Math.max(0, Math.min(1, (now - s.gain) / 320)); const env = (t0, d) => { const a = now - t0; return a < 0 || a > d ? 0 : Math.min(1, a / 220) * Math.min(1, (d - a) / 600); }; return Math.max(env(s.gain, 3400), env(s.up || -1e9, 2400), env(s.pay, 1900)); };
  const kinFlare = (s, now) => { if (!s || !s.open || KINV.mode === 'b') return 0; const a = now - s.pay; return a >= 0 && a < 560 ? 1 - a / 560 : 0; };
  // a stretch of a line of points, from arc length s0 to s1 (closed: it runs on round)
  function kinSeg(x, pts, s0, s1, closed) {
    const n = pts.length, L = [], m = closed ? n : n - 1; let tot = 0; for (let i = 0; i < m; i++) { const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]); L.push(d); tot += d; } if (tot < 1) return 0;
    if (closed) { s0 = ((s0 % tot) + tot) % tot; s1 = s0 + Math.min(tot, s1 - s0); } else { s0 = Math.max(0, s0); s1 = Math.min(tot, s1); if (s1 <= s0) return tot; }
    const at = s => { s = closed ? ((s % tot) + tot) % tot : s; let i = 0; while (i < m - 1 && s > L[i]) { s -= L[i]; i++; } const a = pts[i], b = pts[(i + 1) % n], f = L[i] ? Math.min(1, s / L[i]) : 0; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; };
    x.beginPath(); const st0 = Math.max(2, (s1 - s0) / 14); for (let s = s0, k = 0; ; s = Math.min(s1, s + st0), k++) { const p = at(s); if (k) x.lineTo(p[0], p[1]); else x.moveTo(p[0], p[1]); if (s >= s1) break; } x.stroke(); return tot;
  }
  function kinFrame(now) {
    const on = kinSync(now); let c = KINV.cv; if (!on) { if (c && c.width) c.width = 0; return; } const hevN = HEVO.num && now - HEVO.numT < (HEVO.numFor || 2400) ? now - HEVO.numT : -1;
    if (!c) { c = KINV.cv = document.createElement('canvas'); c.className = 'veil'; app.append(c); }
    const W = KINV.W = veil.width || 1280, H = KINV.H = veil.height || 720; if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H); x.lineCap = 'round'; x.lineJoin = 'round'; x.setLineDash([]);
    const m = center, F = KINV.F, S = KINV.S, B = kinBeat(now), v = KINV.v; m.group.updateMatrixWorld(); cam.updateMatrixWorld();
    const scr = (wx, wy, wz) => { v.set(wx, wy, wz).project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; };
    m.group.getWorldPosition(v); const g0 = v.clone(), p0 = scr(g0.x, g0.y, g0.z), rt = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), p1 = scr(g0.x + rt.x, g0.y + rt.y, g0.z + rt.z), uPx = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * m.group.scale.x, lwS = Math.max(3, 0.2 * uPx);
    const P2 = a => { const b = m.balls.get(a); if (!b || !b.mesh.visible || b.mesh.scale.x < 0.02) return null; b.mesh.getWorldPosition(v); const p = scr(v.x, v.y, v.z); p.push(b.mesh.scale.x * uPx); return p; };
    const cut = pts => { x.save(); x.globalCompositeOperation = 'destination-out'; x.globalAlpha = 1; x.fillStyle = '#000'; pts.forEach(p => { if (!p) return; x.beginPath(); x.arc(p[0], p[1], p[2] * 1.04, 0, 6.2832); x.fill(); }); x.restore(); };
    // (builder 18) the row of marks in its strip, and each mark tied to where its motif sits: when a motif is gained, grows or pays, the mark's ink
    // line runs up to the place and goes once round it (a ring drawn by hand, as a chemist rings a group in his notes); when it is lost a red line
    // runs to where it sat and strikes it out. Ink only, behind the atoms (cut away over every ball); the red strike alone lies over them.
    const clamp = q => Math.max(0, Math.min(1, q)), kk = W / 1280, ROW = [], marksOn = KINV.mode !== 'a' && AA.rxMarks && AA.rxMarks.motifMark;
    if (marksOn) { const Z = KSTRIP || { z0: 5.5, z1: 10.3, x0: 1.2, x1: 29.8 }, zm = (Z.z0 + Z.z1) / 2, a0 = scr(Z.x0, 0.05, zm), a1 = scr(Z.x1, 0.05, zm), top = scr((Z.x0 + Z.x1) / 2, 0.05, Z.z0), bot = scr((Z.x0 + Z.x1) / 2, 0.05, Z.z1), hS = bot[1] - top[1], wS = a1[0] - a0[0];
      const ids = MIDS.filter(id => S[id] && ((S[id].lv > 0 && now >= S[id].gain) || (S[id].lose > -1e8 && now - S[id].lose < 1700))), gap = Math.min(88 * kk, wS / Math.max(1, ids.length)), sz = Math.min(hS * 0.7, gap * 0.84), cy = top[1] + hS * 0.4, cx0 = KINV.at.x == null ? (a0[0] + a1[0]) / 2 : scr(KINV.at.x, 0.05, zm)[0];
      ids.forEach((id, i) => { const s2 = S[id], tx = cx0 + (i - (ids.length - 1) / 2) * gap; s2.px = s2.px == null || now - (s2.pxT || 0) > 400 ? tx : s2.px + (tx - s2.px) * 0.22; s2.pxT = now; ROW.push({ id, s: s2, x: s2.px, y: cy, sz, gap }); }); KINV.strip = [a0[0], top[1], a1[0], bot[1]]; KINV.row = ROW.map(r => [r.id, Math.round(r.x), Math.round(r.y), Math.round(r.sz)]); }
    const ellOf = (grp, mx, my) => { const pts = grp.map(P2).filter(q => q); if (!pts.length) return null; let cx = 0, cy = 0, br = 0; pts.forEach(q => { cx += q[0] / pts.length; cy += q[1] / pts.length; br = Math.max(br, q[2]); }); let xx = 0, yy = 0, xy = 0; pts.forEach(q => { xx += (q[0] - cx) * (q[0] - cx); yy += (q[1] - cy) * (q[1] - cy); xy += (q[0] - cx) * (q[1] - cy); });
      const an = pts.length > 1 ? 0.5 * Math.atan2(2 * xy, xx - yy) : 0, ca = Math.cos(an), sa = Math.sin(an); let rx = 0, ry = 0; pts.forEach(q => { rx = Math.max(rx, Math.abs((q[0] - cx) * ca + (q[1] - cy) * sa)); ry = Math.max(ry, Math.abs(-(q[0] - cx) * sa + (q[1] - cy) * ca)); }); const pad = br * 1.5 + 4 * kk; rx = rx * 1.12 + pad; ry = ry * 1.12 + pad;
      return { cx, cy, rx, ry, an, ph: Math.atan2(my - cy, mx - cx) - an, br }; };
    const ellPt = (e, a) => { const px = Math.cos(a) * e.rx, py = Math.sin(a) * e.ry; return [e.cx + px * Math.cos(e.an) - py * Math.sin(e.an), e.cy + px * Math.sin(e.an) + py * Math.cos(e.an)]; };
    const lasso = (e, t, col, lw, al) => { if (t <= 0 || al <= 0) return; x.save(); x.translate(e.cx, e.cy); x.rotate(e.an); x.strokeStyle = col; x.lineWidth = lw; x.globalAlpha = al; x.beginPath(); const n = 44, tot = (6.2832 + 0.55) * Math.min(1, t); for (let i = 0; i <= n; i++) { const a = e.ph + tot * i / n, wob = 1 + 0.03 * Math.sin(a * 3 + e.cx * 0.05) + 0.045 * (tot * i / n) / 6.83; const px = Math.cos(a) * e.rx * wob, py = Math.sin(a) * e.ry * wob; if (i) x.lineTo(px, py); else x.moveTo(px, py); } x.stroke(); x.restore(); };
    const reach = (x0, y0, x1, y1, t, col, lw, al) => { if (t <= 0 || al <= 0) return; const dx = x1 - x0, dy = y1 - y0, qx = (x0 + x1) / 2 - dy * 0.07, qy = (y0 + y1) / 2 + dx * 0.07; x.save(); x.strokeStyle = col; x.lineWidth = lw; x.globalAlpha = al; x.beginPath(); x.moveTo(x0, y0); const n = 18, tt = Math.min(1, t); for (let i = 1; i <= n; i++) { const u = tt * i / n, w = 1 - u; x.lineTo(w * w * x0 + 2 * w * u * qx + u * u * x1, w * w * y0 + 2 * w * u * qy + u * u * y1); } x.stroke(); x.restore(); };
    const LOST = [];
    if (KINV.mode === 'c' && F && F.where) { const lwL = Math.max(3.2 * kk, 0.17 * uPx);
      ROW.forEach(r => { const s = r.s, mx = r.x, my = r.y - r.sz * 0.5; if (!(s.lv > 0)) { if (s.lostAt) LOST.push(r); return; }
        const grp = (F.where[r.id] || []).slice(0, 4); let els = grp.map(q => ellOf(q, mx, my)).filter(q => q); if (!els.length) els = [{ cx: p0[0], cy: p0[1], rx: uPx * 1.6, ry: uPx * 1.6, an: 0, ph: Math.atan2(my - p0[1], mx - p0[0]), br: uPx * 0.4 }];
        els.sort((p, q) => Math.hypot(p.cx - mx, p.cy - my) - Math.hypot(q.cx - mx, q.cy - my)); const e0 = els[0]; s.at = [(e0.cx - p0[0]) / uPx, (e0.cy - p0[1]) / uPx, e0.rx / uPx, e0.ry / uPx, e0.an]; if (!s.open) return;
        const tg = now - Math.max(s.gain, s.up || -1e9), tp = now - s.pay; let lt = 0, rt2 = 0, al = 0, hv = 1;
        if (tp >= 0 && tp < 620) { lt = clamp(tp / 110); rt2 = clamp((tp - 60) / 170); al = tp < 380 ? 1 : clamp(1 - (tp - 380) / 240); hv = 1 + 0.6 * clamp(1 - tp / 300); }
        else if (tg >= 0 && tg < 3300) { lt = clamp((tg - 200) / 380); rt2 = clamp((tg - 560) / 560); al = tg < 2700 ? 1 : clamp(1 - (tg - 2700) / 600); }
        if (al <= 0) return; const st0 = ellPt(e0, e0.ph); reach(mx, my, st0[0], st0[1], lt, INK, lwL * 0.8 * hv, al * 0.9); els.forEach(e => lasso(e, rt2, INK, lwL * hv, al)); });
      const all = []; m.balls.forEach((b, a) => { const q = P2(a); if (q) all.push(q); }); cut(all); x.globalAlpha = 1; }
    if (F && KINV.mode !== 'b') {
      // cage: the back bonds breathe paler (two bars a breath); when it pays they darken once
      { const s = S.cage, a = kinAct(s, now), fl = kinFlare(s, now); if ((a > 0.01 || fl > 0) && F.back.length) { const br = 0.5 - 0.5 * Math.cos(B / 8 * 6.2832), ends = []; F.back.forEach(q => { const A = P2(q.a), Bq = P2(q.b); if (!A || !Bq) return; ends.push(A, Bq); x.strokeStyle = fl > 0 ? INK : '#f6f1e2'; x.globalAlpha = fl > 0 ? 0.75 * fl : a * (0.08 + 0.62 * br); x.lineWidth = lwS * (fl > 0 ? 1.5 : 1.35); x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(Bq[0], Bq[1]); x.stroke(); }); cut(ends); } }
      // resonance: a sheen runs back and forth along the alternating bonds, faster with more links
      { const s = S.resonance, a = kinAct(s, now), fl = kinFlare(s, now); if ((a > 0.01 || fl > 0) && F.conj.length >= 2) { const pts = F.conj.map(P2); if (pts.every(p => p)) { let tot = 0; for (let i = 1; i < pts.length; i++) tot += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); const bond = tot / (pts.length - 1), u = B * (0.75 + 0.25 * s.lv) * bond, ph = u % (2 * tot), pos = ph < tot ? ph : 2 * tot - ph, half = bond * 0.5;
          if (fl > 0) { x.strokeStyle = INK; x.globalAlpha = 0.8 * fl; x.lineWidth = lwS * 2.3; kinSeg(x, pts, 0, tot, false); x.strokeStyle = '#fffdf0'; x.globalAlpha = fl; x.lineWidth = lwS * 0.8; kinSeg(x, pts, 0, tot, false); }
          if (a > 0.01) { x.strokeStyle = INK; x.globalAlpha = 0.85 * a; x.lineWidth = lwS * 2.1; kinSeg(x, pts, pos - half * 1.0, pos + half * 1.0, false); x.strokeStyle = '#fffdf0'; x.globalAlpha = a; x.lineWidth = lwS * 1.25; kinSeg(x, pts, pos - half * 0.95, pos + half * 0.95, false); }
          cut(pts); } } }
      x.globalAlpha = 1;
      // arene: the ring's inner circle, turning slowly
      { const s = S.arene, a = kinAct(s, now), fl = kinFlare(s, now); if (a > 0.01 || fl > 0) F.arene.forEach(r => { const pts = r.map(P2); if (!pts.every(p => p)) return; let cx = 0, cy = 0; pts.forEach(p => { cx += p[0] / pts.length; cy += p[1] / pts.length; }); const k = 0.6, ct = pts.map(p => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]), n = ct.length, mid = i => [(ct[i][0] + ct[(i + 1) % n][0]) / 2, (ct[i][1] + ct[(i + 1) % n][1]) / 2], rr = Math.hypot(pts[0][0] - cx, pts[0][1] - cy) * k, per = 6.2832 * rr * 0.9 / 6;
          x.strokeStyle = INK; x.globalAlpha = Math.max(0.85 * a, fl); x.lineWidth = lwS * (0.55 + 0.6 * fl); x.setLineDash(fl > 0.5 ? [] : [per * 0.62, per * 0.38]); x.lineDashOffset = -B * per * 0.25; x.beginPath(); const m0 = mid(n - 1); x.moveTo(m0[0], m0[1]); for (let i = 0; i < n; i++) { const q = mid(i); x.quadraticCurveTo(ct[i][0], ct[i][1], q[0], q[1]); } x.stroke(); x.setLineDash([]); }); }
      // ring: a faint pencil dash goes once round the loop every bar
      { const s = S.ring, a = kinAct(s, now), fl = kinFlare(s, now); if (a > 0.01 || fl > 0) F.loops.forEach((r, ri) => { const pts = r.map(P2); if (!pts.every(p => p)) return; let cx = 0, cy = 0; pts.forEach(p => { cx += p[0] / pts.length; cy += p[1] / pts.length; }); const ins = pts.map(p => [cx + (p[0] - cx) * 0.6, cy + (p[1] - cy) * 0.6]); let tot = 0; ins.forEach((p, i) => { const q = ins[(i + 1) % ins.length]; tot += Math.hypot(q[0] - p[0], q[1] - p[1]); });
          x.strokeStyle = PENCIL; x.lineWidth = lwS * 0.62; if (fl > 0) { x.globalAlpha = fl; x.strokeStyle = INK; kinSeg(x, ins, 0, tot, true); } if (a > 0.01) { x.strokeStyle = PENCIL; x.globalAlpha = 0.95 * a; const s0 = ((B / 4 + ri * 0.37) % 1) * tot; kinSeg(x, ins, s0, s0 + tot * 0.3, true); } }); }
      // sugar: the O-H hydrogens catch a small glint in turn (all at once when it pays)
      { const s = S.sugar, a = kinAct(s, now), fl = kinFlare(s, now); if ((a > 0.01 || fl > 0) && F.oh.length) { const n = F.oh.length, bi = ((Math.floor(B) % n) + n) % n, f = B - Math.floor(B); F.oh.forEach((q, i) => { let k = i === bi ? Math.sin(Math.PI * Math.min(1, f * 1.25)) * a : 0; k = Math.max(k, fl); if (k < 0.03) return; const p = P2(q.h) || P2(q.o); if (!p) return; const R = Math.max(6, p[2]), gx = p[0] + R * 0.45, gy = p[1] - R * 0.45, L = R * (1.1 + 1.0 * k);
          x.globalAlpha = Math.min(1, k * 1.3); x.fillStyle = '#ffffff'; x.strokeStyle = INK; x.lineWidth = Math.max(1.2, lwS * 0.14); x.beginPath(); for (let j = 0; j < 8; j++) { const an = j * Math.PI / 4, rr = j % 2 ? L * 0.26 : L; x.lineTo(gx + Math.cos(an) * rr, gy + Math.sin(an) * rr); } x.closePath(); x.fill(); x.stroke(); }); } }
      x.globalAlpha = 1;
    }
    try { a20Ink(x, now, scr, W, H, () => { const ps = []; m.balls.forEach((b, a) => ps.push(P2(a))); cut(ps); }, uPx); } catch (e) { A20.err = String(e && e.stack); }
    if (hevN >= 0) { /* the creature's new number, in the pen's hand, beside it while it stands large */ const EP = HEVO.pos, hp = EP ? scr(EP.x, 0.3, EP.z + 6.4) : scr(HOMP.x + 4.6, 2.2, HOMP.z), kq = (W / 1280) * (EP ? 1.5 : 1), pop = Math.min(1, hevN / 160), al = Math.min(1, ((HEVO.numFor || 2400) - hevN) / 400); x.save(); x.globalAlpha = Math.max(0, al); try { AA.rxPen.write(x, 'x' + (+HEVO.num).toFixed(2), hp[0], hp[1], 58 * kq * (0.6 + 0.4 * pop), { weight: 'heavy', color: EP ? INK : '#fbf6e6', align: EP ? 'center' : 'left' }); } catch (e) { x.fillStyle = '#fbf6e6'; x.font = 'bold ' + (46 * kq) + 'px sans-serif'; x.fillText('x' + (+HEVO.num).toFixed(2), hp[0], hp[1]); } x.restore(); }
    // a motif lost: a red line from its mark to where it sat, and the place struck out (over the atoms, for a moment)
    LOST.forEach(r => { const s = r.s, tl = now - (A20.until && s.lose < A20.until && s.lose > A20.until - 7000 ? A20.until : s.lose); /* (builder 20) a strike that falls on a creature's act waits until the act is over */ if (tl < 0 || tl > 1700) return; const L = s.lostAt, e = { cx: p0[0] + L[0] * uPx, cy: p0[1] + L[1] * uPx, rx: L[2] * uPx, ry: L[3] * uPx, an: L[4] }, mx = r.x, my = r.y - r.sz * 0.5, al = clamp((1700 - tl) / 450), lw = Math.max(3.4 * kk, 0.18 * uPx); e.ph = Math.atan2(my - e.cy, mx - e.cx) - e.an;
      const st0 = ellPt(e, e.ph); reach(mx, my, st0[0], st0[1], clamp(tl / 240), REDINK, lw * 0.8, al * 0.9); lasso(e, clamp((tl - 160) / 300), REDINK, lw * 0.8, al * 0.85);
      const k1 = clamp((tl - 380) / 200), k2 = clamp((tl - 560) / 200), A = ellPt(e, Math.PI * 1.25), B2 = ellPt(e, Math.PI * 0.25), C = ellPt(e, Math.PI * 1.75), D = ellPt(e, Math.PI * 0.75); reach(A[0], A[1], B2[0], B2[1], k1, REDINK, lw * 1.5, al); reach(C[0], C[1], D[0], D[1], k2, REDINK, lw * 1.5, al); });
    x.globalAlpha = 1;
    // the marks on the page, in their strip (b: ink; c: quiet pencil, inked for a moment when one is gained or pays); not open: a faint dashed outline.
    // What a mark paid is written over its stamp in the pen's hand (x1.16).
    if (marksOn) ROW.forEach(r => { const s = r.s, lost = !(s.lv > 0), ag = now - s.gain, ap = now - s.pay, al = now - s.lose, st2 = s.open && ap >= 0 && ap < 380 ? 1 - ap / 380 : 0, hot = lost || (s.open && ((ap >= 0 && ap < 1000) || (ag >= 0 && ag < 1300) || (s.up && now - s.up >= 0 && now - s.up < 1300)));
      x.save(); x.globalAlpha = lost ? clamp((1700 - al) / 400) : 1; x.translate(r.x, r.y); const sc2 = 1 + 0.42 * st2 * st2; x.scale(sc2, sc2); x.rotate(-0.05 * st2);
      AA.rxMarks.motifMark(x, r.id, 0, 0, r.sz, { t: lost ? 1 : clamp(ag / 480), pencil: KINV.mode === 'c' && !hot, shut: !s.open && !lost, pips: lost ? s.was : s.lv, lw: 7 + 3.5 * st2, strike: lost ? Math.max(0, al / 280) : 0, turn: KINV.mode === 'b' ? B * 0.2 : 0, ink: INK, red: REDINK }); x.restore();
      if (s.open && !lost && s.amt > 1 && ap >= 0 && ap < 1800) { const pop = clamp(ap / 150), fa = clamp((1800 - ap) / 380), tx = 'x' + s.amt.toFixed(2), fs = Math.min(21 * kk, r.gap * 0.34) * (0.72 + 0.28 * pop); x.save(); x.globalAlpha = fa; try { AA.rxPen.write(x, tx, r.x, KINV.strip[3] + 8 * kk, fs, { weight: 'heavy', color: INK, align: 'center' }); } catch (e) { x.fillStyle = INK; x.font = 'bold ' + fs + 'px sans-serif'; x.textAlign = 'center'; x.fillText(tx, r.x, r.y - r.sz * 0.52); } x.restore(); } });
  }
  // (builder 17, ruling AZ) THE CREATURE GROWS: with P.RULE.homGrow set the creature on the bench stands in the form of its stage (P.homStage; five
  // forms in kitart.js, sizes AA.rxKit.stageSize). When a tap lifts its stage (g.homEvolved) it changes on the music's next beat after its job:
  // it swells for a moment, a puff of its substance, and the next form lands turning once round (so its back is seen) and settles.
  const HEVO = { seen: null, at: 0, s0: 0, s1: 0, done: true, swap: false };
  function homStageNow(id) { try { return P.RULE.homGrow ? P.homStage(run && run.meta ? run : { meta, homJobs: run && run.homJobs }, id).stage : 0; } catch (e) { return 0; } }
  function homEvoFrame(now) {
    if (!homObj || !g) return; const ev = g.homEvolved;
    if (ev && ev !== HEVO.seen && ev.id === homObj.id && HEVO.done && !HEVO.pend) { HEVO.seen = ev; HEVO.pend = true; }
    /* it changes at home, once it is back from its job */ if (HEVO.pend && !st.homAct) { HEVO.pend = false; HEVO.at = kinNext(now + 520); HEVO.done = false; HEVO.swap = false; HEVO.s0 = homObj.s; }
    if (HEVO.done) return; const a = now - HEVO.at; dirty = true;
    if (a < 0) { const u = Math.max(0, 1 + a / 420); homObj.s = HEVO.s0 * (1 + 0.2 * u * u); return; }
    if (!HEVO.swap) { HEVO.swap = true; const id = homObj.id; HEVO.num = HEVO.seen && HEVO.seen.mult; HEVO.numT = now; homStand(); HEVO.s1 = homObj.s; try { burst3(HOMP.x, 1.4, HOMP.z, 18, '#fbf6e6'); burst3(HOMP.x, 0.9, HOMP.z, 14, '#' + new T.Color(JARC[id]).getHexString()); } catch (e) { /* no puff */ } try { sfx.stamp(); sfx.good(); } catch (e) { /* no sound */ } st.shake = Math.max(st.shake, 0.3); }
    const u = Math.min(1, a / 620), e = 1 - Math.pow(1 - u, 3); const big = a < 1500 ? 1 : Math.max(0, 1 - (a - 1500) / 500); homObj.s = HEVO.s1 * (0.55 + 0.45 * e + 0.32 * Math.sin(Math.PI * u) * (1 - u)) * (1 + 0.9 * big * e); const fg = homObj.grp.children[0]; if (fg) fg.rotation.y = (1 - e) * 6.2832;
    if (a >= 2000) { HEVO.done = true; homObj.s = HEVO.s1; if (fg) fg.rotation.y = 0; }
  }
  // (builder 19, the owner: "The animations for the homunculus needs to be more thorough, they need to jump up and do the thing") THE CREATURE'S
  // ACT. When its job is done it gathers itself at home, JUMPS from the bench onto the page, does its own act there with its whole body, and jumps
  // home to land. jumpPlan lays the times out (wind-up W, jump J, act D of 0.6 to 1.0 s at pace 2 and shorter at pace 3, back B, landing L), puts the
  // moment the act lands on the music's beat (the wind-up waits for it) and is told to doHom, which shows the yield then and lets the page go on
  // when the act is over. homJump gives the figure's place, height, squash and turn for a time; JACT[id] is each creature's own act. Higher stages
  // jump higher, turn in the air, bite or pour more and throw more pieces. No atom is moved. Drawn so far: acid, water, slime.
  const JUMPS = { acid: 1, water: 1, slime: 1 }, JK = [1, 1, 0.92, 0.8, 0.7];
  const paceK = () => { try { return String(AA.rxFeel && AA.rxFeel.pace ? AA.rxFeel.pace() : '2') === '3' ? 0.7 : 1; } catch (e) { return 1; } };
  function jumpPlan(id, to) {
    if (!JUMPS[id] || !center || !SAFE) return null; const now = performance.now(), pf = paceK(), RP = SAFE.R, M = { x: C0.x, z: C0.z }, stg = Math.max(1, Math.min(5, homObj.stage || 3)), cl = (v, a, b) => Math.max(a, Math.min(b, v));
    let W = 260 * pf; const J = 360 * pf, D = (640 + 70 * stg) * pf, B = 380 * pf, L = 260, spot = { x: to.x + 0.9, z: to.z - 1.9 }; let perch, tgt = spot, hitU = 0.3, card = null;
    if (id === 'acid') perch = { x: cl(spot.x - 3.6, RP.x0 + 3, RP.x1 - 3), z: cl(spot.z + 2.8, RP.z0 + 7, 4.8) };
    else if (id === 'water') { perch = { x: cl(M.x - 8, RP.x0 + 3.5, RP.x1 - 4), z: cl(M.z - 4.5, RP.z0 + 8, 3) }; tgt = M; hitU = 0.35; }
    else { const stuck = (g.hom && g.hom.stuck) || []; BT.map.forEach((b, cid) => { if (!card && stuck.includes(cid)) card = b; }); if (!card) BT.map.forEach(b => { if (!card) card = b; }); if (!card) return null; perch = { x: card.x + 3.6, z: card.z + 1.4 }; tgt = M; hitU = 0.18; }
    const pre = W + J + hitU * D; W += Math.min(700, Math.max(0, kinNext(now + pre) - (now + pre)));
    const j = { W, J, D, B, L, perch, tgt, spot, card, stg, k: JK[stg - 1], hit: W + J + hitU * D, rest: (1 - hitU) * D + B * 0.6, f: {} };
    if (id === 'acid') { const nb = stg <= 2 ? 2 : stg <= 4 ? 3 : 4; j.bites = []; for (let i = 0; i < nb; i++) j.bites.push(0.3 + i * 0.58 / nb); }
    jumpPieces(id, j); return j;
  }
  function jumpPieces(id, j) {
    const R0 = Math.random, t0 = j.W + j.J, n = k => Math.max(1, Math.round(k * (0.6 + 0.2 * j.stg))), P0 = j.perch, S = j.tgt, RP = SAFE.R, fade = u => (u < 0.15 ? u / 0.15 : u > 0.7 ? (1 - u) / 0.3 : 1);
    const fly = (kind, cnt, a, b, o) => { for (let i = 0; i < cnt; i++) { const A = typeof a === 'function' ? a(i) : a, Bq = typeof b === 'function' ? b(i) : b, sz = (o.size || 1.5) * (0.75 + 0.5 * R0()), up = (o.up == null ? 4 : o.up) * (0.6 + 0.8 * R0()), rot = (R0() - 0.5) * (o.rot || 0); actPiece(kind, (o.delay || 0) + i * (o.gap || 0), o.dur || 600, (u, s) => { const h = o.stay ? Math.min(1, u / (1 - o.stay)) : u; s.position.set(A.x + (Bq.x - A.x) * h, (o.y0 || 2.5) + up * Math.sin(Math.PI * h), A.z + (Bq.z - A.z) * h); s.scale.set(sz, sz, 1); s.material.opacity = fade(u); s.material.rotation = rot * (1 + u); }); } };
    fly('puff', 5, P0, i => ({ x: P0.x + (i - 2) * 1.7, z: P0.z + 1.2 }), { size: 2.2, up: 0.5, dur: 420, delay: t0, y0: 1 });      // the dust where it lands on the page
    fly('puff', 4, HOMP, i => ({ x: HOMP.x + (i - 1.5) * 1.7, z: HOMP.z + 1.2 }), { size: 2, up: 0.5, dur: 380, delay: t0 + j.D + j.B, y0: 1 });      // and at home
    if (id === 'acid') { /* it bites what came off: at each bite green crumbs fly from the place and bubbles rise */
      j.bites.forEach(bu => { const dl = t0 + bu * j.D; fly('gdrop', n(5), S, i => ({ x: S.x + (R0() - 0.5) * 9, z: S.z + (R0() - 0.5) * 6 }), { size: 1.4, up: 4, dur: 460, delay: dl, rot: 3 }); fly('bubble', n(2), i => ({ x: S.x + (R0() - 0.5) * 3, z: S.z + (R0() - 0.5) * 2 }), i => ({ x: S.x + (R0() - 0.5) * 4, z: S.z - 3 }), { size: 1.2, up: 1.5, dur: 700, delay: dl + 40, y0: 3 }); });
      fly('smoke', n(2), S, i => ({ x: S.x + (R0() - 0.5) * 5, z: S.z - 6 }), { size: 2.4, up: 1, dur: 1100, delay: t0 + 0.85 * j.D, gap: 70, y0: 4 }); }
    else if (id === 'water') { /* it wrings itself out over the molecule: a stream of drops, the page under the molecule floods, and the waters that left run back to it */
      const N = n(20); fly('drop', N, i => ({ x: P0.x + 1.6, z: P0.z - 2.4 }), i => ({ x: S.x + (R0() - 0.5) * 12, z: S.z + (R0() - 0.5) * 7 }), { size: 1.7, up: 5, dur: 440, delay: t0 + 0.08 * j.D, gap: 0.6 * j.D / N, rot: 2, y0: 4 });
      const z1 = Math.min(RP.z1, 5.2), hw = RP.x1 - RP.x0, hh = z1 - RP.z0; actPiece('sheet', t0 + 0.35 * j.D, 1500, (u, s) => { const k = Math.min(1, u * 3.2); s.scale.z = k; s.position.set((RP.x0 + RP.x1) / 2, 0.3, z1 - hh * k / 2); s.material.opacity = 0.4 * (u > 0.7 ? (1 - u) / 0.3 : 1); }, [hw, hh]);
      fly('drop', n(7), i => ({ x: S.x + (R0() - 0.5) * 8, z: S.z + (R0() - 0.5) * 5 }), P0, { size: 1.5, up: 3, dur: 420, delay: t0 + 0.72 * j.D, gap: 30, y0: 2.5 }); }
    else { /* it lands on the twice-used bottle and sticks it shut, then strings itself across to the molecule */
      const c = j.card; fly('goo', 4, i => ({ x: c.x + 3.2, z: c.z - 0.8 }), i => ({ x: c.x + 3.2 + (i - 1.5) * 1.3, z: c.z - 0.2 + (i % 2) * 0.9 }), { size: 3.2, up: 0.2, dur: 3200, delay: t0 + 0.15 * j.D, stay: 0.9, y0: 2.2 });
      const N = n(12); for (let i = 0; i < N; i++) { const t = (i + 1) / (N + 1), sx = P0.x + (S.x - P0.x) * t, sz = P0.z + (S.z - P0.z) * t - 2.2 * Math.sin(Math.PI * t), d0 = t0 + 0.3 * j.D + i * (0.45 * j.D / N); actPiece('goo', d0, 1900 - i * 30, (u, s) => { const k = Math.min(1, u * 10), sag = 1 + 0.2 * Math.sin(u * 14 + i); s.position.set(sx, 2.4, sz + 0.5 * u * Math.sin(Math.PI * t)); s.scale.set(1.25 * k, 1.25 * k * sag, 1); s.material.opacity = u > 0.75 ? (1 - u) / 0.25 : 1; }); }
      fly('goo', n(4), S, i => ({ x: S.x + (R0() - 0.5) * 7, z: S.z + (R0() - 0.5) * 5 }), { size: 1.5, up: 3, dur: 500, delay: t0 + 0.78 * j.D, y0: 3 }); }
  }
  const JACT = {
    acid: (u, o, j, once) => { let Pm = 0, dm = 0; j.bites.forEach((b, i) => { const d = (u - b) / 0.1; if (d > -1 && d < 1) { const p = Math.cos(d * Math.PI / 2); if (p > Pm) { Pm = p * p; dm = d; } if (d >= 0) once('b' + i, () => sfx.stamp()); } });
      o.hx += (j.spot.x - j.perch.x) * 0.72 * Pm; o.hz += (j.spot.z - j.perch.z) * 0.72 * Pm; o.y += 1.4 * Pm; o.sy *= 1 - 0.3 * Pm * (dm >= 0 ? 1 : -0.8); o.sx *= 1 + 0.16 * Pm * (dm >= 0 ? 1 : -0.5); o.rz = -0.32 * Pm; },
    water: (u, o, j, once) => { once('sq', () => sfx.squish()); const w = Math.sin(Math.PI * Math.min(1, u * 1.5)), tw = Math.sin(u * Math.PI * 5); o.rz = -0.5 * w; o.sx *= 1 - 0.3 * Math.abs(tw) * w; o.sy *= 1 + 0.16 * Math.abs(tw) * w; o.ry = 0.8 * tw * w; o.y += 0.7 * Math.abs(Math.sin(u * Math.PI * 2.5)); },
    slime: (u, o, j, once) => { once('sq', () => sfx.squish()); if (u < 0.2) { const c = Math.sin(Math.PI * Math.min(1, u / 0.12) / 2); o.sy = 1 - 0.58 * c; o.sx = 1 + 0.6 * c; } else if (u < 0.86) { const s = Math.sin(Math.PI * (u - 0.2) / 0.66); o.sy = 0.42 + 1.05 * s; o.sx = 1.6 - 0.85 * s; o.rz = -0.6 * s; } else { const w = (u - 0.86) / 0.14, q = Math.exp(-w * 3) * Math.cos(w * 12); o.sy = 1 - 0.4 * q; o.sx = 1 + 0.3 * q; } }
  };
  function homJump(A, now) {
    const j = A.j, a = now - A.t, H0 = HOMP, P0 = j.perch, ez = u => u * u * (3 - 2 * u), o = { hx: H0.x, hz: H0.z, y: 0, sy: 1, sx: 1, rz: 0, ry: 0, k: 1, tx: j.tgt.x, tz: j.tgt.z, reach: 0 }, fg = homObj.grp.children[0];
    const T1 = j.W, T2 = T1 + j.J, T3 = T2 + j.D, T4 = T3 + j.B, T5 = T4 + j.L, hop = (u, h) => { o.y = Math.sin(Math.PI * u) * h; o.sy = 1 + 0.28 * Math.sin(Math.PI * u); o.sx = 1 - 0.12 * Math.sin(Math.PI * u); };
    const once = (key, f) => { if (!j.f[key]) { j.f[key] = 1; try { f(); } catch (e) { /* no sound */ } } };
    if (a < T1) { /* it gathers itself: down and wide, a shiver */ const u = a / T1, c = Math.sin(Math.min(1, u * 1.15) * Math.PI / 2); o.sy = 1 - 0.34 * c; o.sx = 1 + 0.2 * c; o.rz = 0.05 * Math.sin(a / 30) * c; o.reach = c; }
    else if (a < T2) { once('up', () => sfx.drift()); const u = (a - T1) / j.J, e = ez(u); o.hx = H0.x + (P0.x - H0.x) * e; o.hz = H0.z + (P0.z - H0.z) * e; hop(u, 9 + j.stg); o.k = 1 + (j.k - 1) * e; if (j.stg >= 3) o.ry = 6.2832 * e; o.reach = 1; }
    else if (a < T3) { const u = (a - T2) / j.D, ld = Math.exp(-u * 9) * Math.cos(u * 30); o.hx = P0.x; o.hz = P0.z; o.k = j.k; o.reach = 1; o.sy = 1 - 0.3 * ld; o.sx = 1 + 0.18 * ld; JACT[A.id](u, o, j, once); }
    else if (a < T4) { const u = (a - T3) / j.B, e = ez(u); o.hx = P0.x + (H0.x - P0.x) * e; o.hz = P0.z + (H0.z - P0.z) * e; hop(u, 8 + j.stg); o.k = j.k + (1 - j.k) * e; if (j.stg >= 4) o.ry = -6.2832 * e; }
    else if (a < T5) { once('land', () => sfx.stamp()); const u = (a - T4) / j.L, w = Math.exp(-u * 4) * Math.cos(u * 14); o.sy = 1 - 0.3 * w; o.sx = 1 + 0.2 * w; }
    else { st.homAct = null; if (fg) fg.rotation.y = 0; return null; }
    return o;
  }
  // (builder 20, the owner: "they need to jump up and do the thing") THE TEN ACTS, LARGE AND INKED. Every creature jumps (JUMPS has all ten), stands
  // about a quarter of the page high while it acts (a20Fig measures the figure on the screen; a20Place finds a place BESIDE the molecule: never over
  // it, the marks strip or the yield track), and what it does is drawn by hand in the page's ink layer (a20Ink, called by kinFrame; behind the atoms),
  // from the REAL job: the pieces that left (A20.gone, written down as each leaves), the line the page fired (P.hom2Rec), the cards on the bench.
  // The yield is let through as the act lands (the tick in homJump). Nothing of the rules is worked out here and no atom is moved.
  const A20 = { gone: [], inks: [], cw: null, hold: null };
  flyer = (f0 => function (grp0, gi, kind, back, prev, nm) { const p = f0(grp0, gi, kind, back, prev, nm); try { const sc = prev && prev.group ? prev.group.scale.x : st.sc; if (p && g) A20.gone.push({ g, page: g.page, x: C0.x + p.x * sc, z: C0.z + p.z * sc, els: grp0.map(a => a.el), kind }); if (A20.gone.length > 80) A20.gone.splice(0, 30); } catch (e) { /* not written down */ } return p; })(flyer);
  const A20C = { C: '#5b5f6a', O: '#d8382c', H: '#f6f5ef', N: '#3a62c8', S: '#d9b520', Cl: '#3aa04a' };
  function a20Fig() {
    const G = homObj.grp, s = G.scale.clone(), p = G.position.clone(), r = G.rotation.z, HS = homObj.s || BNZ.hom.s, v = new T.Vector3(); G.position.set(HOMP.x, 0, HOMP.z); G.scale.setScalar(HS); G.rotation.z = 0; G.updateMatrixWorld(true); cam.updateMatrixWorld();
    const b = new T.Box3(), bb = new T.Box3(); G.traverse(o => { if (!o.isMesh || !o.geometry || (o.material && o.material.transparent && o.material.opacity < 0.9)) return; let vis = true; for (let q = o; q && q !== G.parent; q = q.parent) if (!q.visible) vis = false; if (!vis) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); if (bb.max.y - bb.min.y < 0.02 * HS) return; /* flat things on the floor are not its body */ b.union(bb); }); if (b.isEmpty()) b.setFromObject(G); const pr = (X, Y, Z) => { v.set(X, Y, Z).project(cam); return [(v.x + 1) / 2, (1 - v.y) / 2]; }; let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
    for (let i = 0; i < 8; i++) { const q = pr(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z); x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
    const f = pr(HOMP.x, 0, HOMP.z), RP = SAFE.R, xm = (RP.x0 + RP.x1) / 2, a = pr(xm, 0, RP.z0), c = pr(xm, 0, RP.z1), l = pr(RP.x0, 0, 0), r2 = pr(RP.x1, 0, 0); G.position.copy(p); G.scale.copy(s); G.rotation.z = r; G.updateMatrixWorld(true);
    const wz = (RP.z1 - RP.z0) / (c[1] - a[1]), wx = (RP.x1 - RP.x0) / (r2[0] - l[0]);
    return { k: Math.max(1.3, Math.min(6.5, 0.25 * (c[1] - a[1]) / Math.max(0.01, y1 - y0))), fx0: (x0 - f[0]) * wx, fx1: (x1 - f[0]) * wx, fz0: (y0 - f[1]) * wz, fz1: (y1 - f[1]) * wz, hN: y1 - y0 };
  }
  function a20MolBox() { if (!center || !center.balls) return null; const v = new T.Vector3(); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, n = 0; center.balls.forEach(b => { b.mesh.getWorldPosition(v); n++; x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); z0 = Math.min(z0, v.z - 0.35 * v.y); z1 = Math.max(z1, v.z); }); const r = 1.5 * center.group.scale.x; return n ? { x0: x0 - r, x1: x1 + r, z0: z0 - r, z1: z1 + r } : null; }
  // a place for the figure's feet near `want`, at scale k (smaller only if nothing else is free): its whole body clear of the molecule, above the marks strip
  function a20Place(F, k, want, xmax, pad) {
    const RP = SAFE.R, mb = a20MolBox(), ok = (px, pz, kk) => { const x0 = px + F.fx0 * kk, x1 = px + F.fx1 * kk, z0 = pz + F.fz0 * kk, z1 = pz + F.fz1 * kk; if (z1 > 5.0 || z0 < RP.z0 - 1.5 || x0 < SAFE.L.x0 + 1 || x1 > (xmax || RP.x1 + 0.3)) return false; if (x0 < SAFE.gut.x1 + 0.4 && x1 > SAFE.gut.x0 - 0.4) return false; /* never on the crease between the pages */ return !(mb && x0 - (pad || 0) < mb.x1 && x1 + (pad || 0) > mb.x0 && z0 < mb.z1 && z1 > mb.z0); };
    for (let kk = k, n = 0; n < 6; n++, kk *= 0.86) { let best = null, bd = 1e9; for (let px = SAFE.L.x0 + 2; px <= RP.x1 + 8; px += 0.5) for (let pz = RP.z0; pz <= 5; pz += 0.5) { if (!ok(px, pz, kk)) continue; const dd = Math.hypot(px - want.x, pz - want.z) + (px < SAFE.gut.x1 + 2 ? (xmax ? 30 : 7) : 0); if (dd < bd) { bd = dd; best = { x: px, z: pz, k: kk }; } } if (best) return best; }
    return { x: Math.max(RP.x0 + 3, Math.min(RP.x1 - 3, want.x)), z: Math.min(4.5, want.z), k: 1.2 };
  }
  const a20Line = () => { try { return P.hom2Rec(g).circ.filter(c => c.id && c.id[0] !== '#'); } catch (e) { return []; } };
  const a20Card = id => { const b = BT.map.get(id); return b ? { id, x: b.x != null ? b.x : b.grp.position.x, z: b.z != null ? b.z : b.grp.position.z } : null; };
  const a20E = u => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u)), a20C = (v, a, b) => Math.max(a, Math.min(b, v));
  // drawing by hand: a wobbling closed shape, a ball of the molecule's kind, a drop, a flame, a leaf, a little cube of salt, a four-point glint
  function a20Blob(x, cx, cy, rx, ry, seed, ph, n) { n = n || 30; x.beginPath(); for (let i = 0; i <= n; i++) { const a = i / n * 6.2832, r = 1 + 0.13 * Math.sin(a * 3 + seed * 9 + ph) + 0.07 * Math.sin(a * 5 - ph * 1.7 + seed * 4) + 0.04 * Math.sin(a * 9 + ph * 2.3); const X = cx + Math.cos(a) * rx * r, Y = cy + Math.sin(a) * ry * r; if (i) x.lineTo(X, Y); else x.moveTo(X, Y); } x.closePath(); }
  function a20Ball(x, px, py, r, el, lw) { x.fillStyle = A20C[el] || A20C.C; x.strokeStyle = INK; x.lineWidth = lw; x.beginPath(); x.arc(px, py, r, 0, 6.2832); x.fill(); x.stroke(); x.strokeStyle = 'rgba(255,255,255,0.75)'; x.lineWidth = lw * 0.8; x.beginPath(); x.arc(px, py, r * 0.62, 3.5, 4.5); x.stroke(); }
  function a20Piece(x, px, py, r, els, lw, rot) { const hv = els.filter(e => e !== 'H'), hs = els.length - hv.length, list = hv.length ? hv.slice(0, 3) : ['H', 'H'].slice(0, Math.max(1, Math.min(2, hs))); x.save(); x.translate(px, py); x.rotate(rot || 0); const n = list.length, sp = r * 1.5; if (n > 1) { x.strokeStyle = INK; x.lineWidth = lw * 1.6; x.beginPath(); x.moveTo(-(n - 1) * sp / 2, 0); x.lineTo((n - 1) * sp / 2, 0); x.stroke(); } if (hv.length) for (let i = 0; i < Math.min(2, hs); i++) a20Ball(x, (i ? 1 : -1) * ((n - 1) * sp / 2 + r * 0.9), -r * 0.95, r * 0.5, 'H', lw * 0.8); list.forEach((el, i) => a20Ball(x, (i - (n - 1) / 2) * sp, 0, el === 'H' ? r * 0.62 : r, el, lw)); x.restore(); }
  function a20Drop(x, px, py, r, col, lw, an) { x.save(); x.translate(px, py); x.rotate(an || 0); x.fillStyle = col; x.strokeStyle = INK; x.lineWidth = lw; x.beginPath(); x.moveTo(0, -r * 1.7); x.bezierCurveTo(r * 0.5, -r * 0.6, r, -r * 0.1, r, r * 0.35); x.arc(0, r * 0.35, r, 0, Math.PI); x.bezierCurveTo(-r, -r * 0.1, -r * 0.5, -r * 0.6, 0, -r * 1.7); x.fill(); x.stroke(); x.restore(); }
  function a20Flame(x, px, py, h, ph, lw) { const w = h * 0.42, s = Math.sin(ph) * 0.22, s2 = Math.sin(ph * 1.7 + 1) * 0.15; const body = (k, col, line) => { x.beginPath(); x.moveTo(px - w * k, py); x.bezierCurveTo(px - w * 1.3 * k, py - h * 0.45 * k, px - w * 0.2 * k + s2 * w, py - h * 0.6 * k, px + s * w * 2, py - h * k); x.bezierCurveTo(px + w * 0.5 * k + s2 * w, py - h * 0.62 * k, px + w * 1.35 * k, py - h * 0.4 * k, px + w * k, py); x.closePath(); x.fillStyle = col; x.fill(); if (line) { x.strokeStyle = INK; x.lineWidth = lw; x.stroke(); } }; body(1, '#e8641c', true); body(0.58, '#f7d23a', false); }
  function a20Leaf(x, px, py, r, an, lw) { x.save(); x.translate(px, py); x.rotate(an); x.fillStyle = '#4fae5a'; x.strokeStyle = INK; x.lineWidth = lw; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(r * 0.55, -r * 0.6, r * 1.3, 0); x.quadraticCurveTo(r * 0.55, r * 0.6, 0, 0); x.fill(); x.stroke(); x.beginPath(); x.moveTo(0, 0); x.lineTo(r * 1.0, 0); x.lineWidth = lw * 0.6; x.stroke(); x.restore(); }
  function a20Cube(x, px, py, r, an, lw) { x.save(); x.translate(px, py); x.rotate(an); const hx = r * 0.87, hy = r * 0.5; x.strokeStyle = INK; x.lineWidth = lw; x.lineJoin = 'round'; x.fillStyle = '#fdfcf6'; x.beginPath(); x.moveTo(0, -r); x.lineTo(hx, -hy); x.lineTo(hx, hy); x.lineTo(0, r); x.lineTo(-hx, hy); x.lineTo(-hx, -hy); x.closePath(); x.fill(); x.fillStyle = '#cfe0ee'; x.beginPath(); x.moveTo(0, 0); x.lineTo(hx, -hy); x.lineTo(hx, hy); x.lineTo(0, r); x.closePath(); x.fill(); x.fillStyle = '#e6eef5'; x.beginPath(); x.moveTo(0, 0); x.lineTo(-hx, -hy); x.lineTo(-hx, hy); x.lineTo(0, r); x.closePath(); x.fill(); x.beginPath(); x.moveTo(0, -r); x.lineTo(hx, -hy); x.lineTo(hx, hy); x.lineTo(0, r); x.lineTo(-hx, hy); x.lineTo(-hx, -hy); x.closePath(); x.moveTo(-hx, -hy); x.lineTo(0, 0); x.lineTo(hx, -hy); x.moveTo(0, 0); x.lineTo(0, r); x.stroke(); x.restore(); }
  function a20Glint(x, px, py, r, lw) { x.fillStyle = '#ffffff'; x.strokeStyle = INK; x.lineWidth = lw; x.beginPath(); for (let j = 0; j < 8; j++) { const an = j * Math.PI / 4, rr = j % 2 ? r * 0.28 : r; x.lineTo(px + Math.cos(an) * rr, py + Math.sin(an) * rr); } x.closePath(); x.fill(); x.stroke(); }
  // a ribbon of liquid from A to B, sagging or arching by `bow`, drawn up to `k` of its length (ink edge, flat colour)
  function a20Stream(x, A, B, bow, k0, k1, wd, col, lw, ph) { const pt = t => { const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2 + bow, w = Math.sin(t * 9 + ph) * wd * 0.25; return [(1 - t) * (1 - t) * A[0] + 2 * t * (1 - t) * mx + t * t * B[0] + w, (1 - t) * (1 - t) * A[1] + 2 * t * (1 - t) * my + t * t * B[1]]; }; if (k1 <= k0) return; const go = () => { x.beginPath(); for (let i = 0; i <= 18; i++) { const q = pt(k0 + (k1 - k0) * i / 18); if (i) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); } x.stroke(); }; x.lineCap = 'round'; x.strokeStyle = INK; x.lineWidth = wd + lw * 2; go(); x.strokeStyle = col; x.lineWidth = wd; go(); x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = wd * 0.22; x.setLineDash([wd * 1.2, wd * 1.6]); x.lineDashOffset = -ph * wd; go(); x.setLineDash([]); return pt; }
  function a20Puff(x, px, py, r, seed, ph, col, edge, lw, al) { x.globalAlpha = al; a20Blob(x, px, py, r, r * 0.8, seed, ph, 18); x.fillStyle = col; x.fill(); x.strokeStyle = edge; x.lineWidth = lw; x.stroke(); x.globalAlpha = 1; }
  // THE ACTS. Each gives { want (where to stand), xmax, tgt (what it faces), hitU (when it lands, of the act), dur (how long its ink stays, ms), draw(x, a, E) }:
  // a is ms since the act began (below 0 in the wind-up and jump), E = { S(wx, wz) -> px, kk, D, cp (the figure's feet on the screen), ch (its height in px), mouth, cut() }.
  const A20ACT = {
    acid(j, c) { /* the very pieces that left drop out of the molecule to its feet, and it eats each one */
      const gs = A20.gone.filter(q => q.g === g && q.els.some(e => e !== 'H')); let it = gs.filter(q => q.page === g.page); if (!it.length) it = gs; if (!it.length) it = A20.gone.slice(-2); it = it.slice(-4); if (!it.length) it = [{ x: c.mc.x, z: c.mc.z, els: ['C'] }];
      const nb = Math.max(it.length, j.stg <= 2 ? 2 : j.stg <= 4 ? 3 : 4); j.bites = []; for (let i = 0; i < nb; i++) j.bites.push(0.14 + i * 0.7 / nb);
      return { want: { x: c.mb.x0 - 6, z: c.mc.z + 4 }, hitU: j.bites[nb - 1] + 0.04, dur: 2600, pad: 4.5, after(pl) { const sd = pl.x < c.mc.x ? 1 : -1, edge = (sd > 0 ? c.F.fx1 : -c.F.fx0) * pl.k; this.pile = it.map((q, i) => ({ x: pl.x + sd * (edge + 1.0 + Math.floor(i / 2) * 2.3), z: pl.z - 0.5 - (i % 2) * 2.0 })); j.spot = { x: this.pile[0].x, z: this.pile[0].z }; this.tgt = j.spot; },
        draw(x, a, E) { const pre = j.W + j.J, lw = 2.4 * E.kk, R = 11 * E.kk, self = this;
          it.forEach((q, i) => { const A = E.S(q.x, q.z), B = E.S(self.pile[i].x, self.pile[i].z), t0 = -pre + 60 + i * 70, f = a20E((a - t0) / (pre * 0.7)); if (a < t0) return; let last = -1, first = -1; j.bites.forEach((b, k) => { if (k % it.length === i) { last = b; if (first < 0) first = b; } }); const u = a / E.D, dead = u >= last + 0.03;
            /* where it came off: a hand-drawn dotted trace and a small ring */ const fa = a20C(1 - (a - last * E.D) / 700, 0, 1); x.globalAlpha = 0.75 * (dead ? fa : 1); x.strokeStyle = INK; x.lineWidth = lw; x.setLineDash([2 * E.kk, 7 * E.kk]); x.beginPath(); x.moveTo(A[0], A[1]); x.quadraticCurveTo((A[0] + B[0]) / 2, Math.min(A[1], B[1]) - 46 * E.kk, A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f - 46 * E.kk * Math.sin(Math.PI * f) * 0.5); x.stroke(); x.setLineDash([]); x.globalAlpha = 1;
            if (!dead) { const px = A[0] + (B[0] - A[0]) * f, py = A[1] + (B[1] - A[1]) * f - 46 * E.kk * Math.sin(Math.PI * f) + (f >= 1 ? -5 * E.kk * Math.abs(Math.sin(a / 90 + i)) * Math.exp(-(a - t0 - pre * 0.7) / 300) : 0), bit = u >= first && first !== last; a20Piece(x, px, py, R * (bit ? 0.72 : 1), q.els, lw, 0.5 * Math.sin(i * 2.1) + (1 - f) * 3); }
            else { const d = a - last * E.D; /* eaten: green spit, bubbles, an etched ring */ for (let k = 0; k < 7 + j.stg; k++) { const an = k * 0.9 + i, t = d / 520; if (t < 1) a20Drop(x, B[0] + Math.cos(an) * 70 * E.kk * t, B[1] + Math.sin(an) * 36 * E.kk * t - 60 * E.kk * Math.sin(Math.PI * t) * (0.5 + hash('ad' + k)), 5.5 * E.kk * (1 - t * 0.5), '#d4e21a', lw * 0.8, an); } for (let k = 0; k < 4; k++) { const t = (d - k * 110) / 800; if (t > 0 && t < 1) { x.globalAlpha = 1 - t; x.strokeStyle = '#7a8a10'; x.fillStyle = 'rgba(222,236,90,0.5)'; x.lineWidth = lw * 0.8; x.beginPath(); x.arc(B[0] + (k - 1.5) * 9 * E.kk + 4 * E.kk * Math.sin(t * 9 + k), B[1] - 50 * E.kk * t, (4 + 2 * k) * E.kk * (0.6 + t), 0, 6.2832); x.fill(); x.stroke(); x.globalAlpha = 1; } }
              x.globalAlpha = 0.8 * a20C(1 - d / 1500, 0, 1); a20Blob(x, B[0], B[1] + 3 * E.kk, R * 1.5, R * 0.7, i + 0.3, 0, 18); x.strokeStyle = '#7a8a10'; x.lineWidth = lw; x.stroke(); x.globalAlpha = 1; } }); } }; },
    water(j, c) { /* it wrings itself out: a poured, running sheet with an edge and ripples that spreads under the molecule and drains off the page */
      return { want: { x: c.mb.x0 - 5, z: c.mb.z0 + 3 }, hitU: 0.42, dur: 3600, tgt: c.mc, after(pl) { const sd = pl.x < c.mc.x ? 1 : -1; this.pour = { x: pl.x + sd * 4.2 * pl.k / 2.4, z: Math.min(4.2, pl.z + 0.6) }; this.sd = sd; },
        draw(x, a, E) { if (a < 0) return; const RP = SAFE.R, u = a / E.D, lw = 2.6 * E.kk, ph = a / 260, P0 = this.pour, Pp = E.S(P0.x, P0.z), z1 = 5.1, q0 = E.S(RP.x0 + 0.4, RP.z0 + 0.4), q1 = E.S(RP.x1 - 0.2, RP.z0 + 0.4), q2 = E.S(RP.x1 - 0.2, z1), q3 = E.S(RP.x0 + 0.4, z1);
          const sp = a20E(a20C((u - 0.18) / 0.9, 0, 1)), dr = a20E(a20C((a - E.D * 1.5 - 500) / 1300, 0, 1)), DRN = { x: RP.x1 - 0.5, z: 4.6 }, cx = P0.x + (c.mc.x - P0.x) * sp, cz = P0.z + (c.mc.z + 0.6 - P0.z) * sp, ex = cx + (DRN.x - cx) * dr, ez = cz + (DRN.z - cz) * dr, rx = (1.5 + 14.5 * sp) * (1 - dr), rz = (1 + 8 * sp) * (1 - 0.85 * dr), C = E.S(ex, ez), Rx = Math.abs(E.S(ex + rx, ez)[0] - C[0]), Rz = Math.abs(E.S(ex, ez + rz)[1] - C[1]);
          x.save(); x.beginPath(); x.moveTo(q0[0], q0[1]); x.lineTo(q1[0], q1[1]); x.lineTo(q2[0], q2[1]); x.lineTo(q3[0], q3[1]); x.closePath(); x.clip();
          if (u > 0.16 && dr < 1) { /* the sheet: flat pale water, a darker running edge, a light line inside it, ripples going out from where it falls */
            a20Blob(x, C[0], C[1], Rx, Rz, 0.3, ph, 44); x.fillStyle = 'rgba(64,124,214,0.26)'; x.fill(); x.strokeStyle = 'rgba(40,84,170,0.9)'; x.lineWidth = lw * 1.25; x.stroke(); a20Blob(x, C[0] + 3 * E.kk, C[1] + 3 * E.kk, Rx * 0.93, Rz * 0.9, 0.3, ph - 0.5, 44); x.strokeStyle = 'rgba(255,255,255,0.65)'; x.lineWidth = lw * 0.8; x.setLineDash([26 * E.kk, 34 * E.kk]); x.lineDashOffset = -a / 14; x.stroke(); x.setLineDash([]);
            x.save(); a20Blob(x, C[0], C[1], Rx, Rz, 0.3, ph, 44); x.clip(); for (let i = 0; i < 4 + j.stg; i++) { const t = ((a - 0.16 * E.D - i * 230) / 1100); if (t > 0 && t < 1 && u < 1.9) { x.globalAlpha = (1 - t) * 0.8; a20Blob(x, Pp[0], Pp[1], (20 + 250 * t) * E.kk, (11 + 130 * t) * E.kk, i, ph * 0.3, 26); x.strokeStyle = 'rgba(40,84,170,0.85)'; x.lineWidth = lw * 0.8; x.stroke(); } }
            /* little running lines on the water, going the way it drains */ for (let i = 0; i < 9; i++) { const hx = hash('wl' + i), hz = hash('wz' + i), fx = ex + (hx - 0.5) * rx * 1.5 + ((a / 900 + i * 0.37) % 1) * 3 * this.sd, fz = ez + (hz - 0.5) * rz * 1.4, s0 = E.S(fx, fz), s1 = E.S(fx + 1.6, fz + 0.15 * Math.sin(ph + i)); x.globalAlpha = 0.5 * Math.sin(Math.PI * ((a / 900 + i * 0.37) % 1)); x.strokeStyle = 'rgba(40,84,170,0.9)'; x.lineWidth = lw * 0.7; x.beginPath(); x.moveTo(s0[0], s0[1]); x.quadraticCurveTo((s0[0] + s1[0]) / 2, s0[1] - 4 * E.kk, s1[0], s1[1]); x.stroke(); } x.globalAlpha = 1; x.restore(); }
          if (dr > 0.25) { /* what is left behind dries up in a few small pools */ for (let i = 0; i < 5; i++) { const t = a20C((a - E.D * 1.5 - 900 - i * 120) / 1500, 0, 1); if (t <= 0 || t >= 1) continue; const s = E.S(c.mc.x + (hash('pl' + i) - 0.5) * 18, c.mc.z + (hash('pz' + i) - 0.3) * 6), r = (16 + 12 * hash('pr' + i)) * E.kk * (1 - t); x.globalAlpha = 1 - t * 0.5; a20Blob(x, s[0], s[1], r * 1.6, r * 0.8, i, 0, 16); x.fillStyle = 'rgba(64,124,214,0.24)'; x.fill(); x.strokeStyle = 'rgba(40,84,170,0.85)'; x.lineWidth = lw * 0.8; x.stroke(); x.globalAlpha = 1; } }
          x.restore(); E.cut();
          if (u > 0.04 && u < 0.95) { const k1 = a20C((u - 0.04) / 0.14, 0, 1), k0 = a20C((u - 0.72) / 0.2, 0, 1); a20Stream(x, [E.mouth[0] + this.sd * E.ch * 0.25, E.mouth[1] + E.ch * 0.2], Pp, -36 * E.kk, k0, k1, (9 + 2 * j.stg) * E.kk, '#5b92e0', lw * 0.7, a / 60); for (let i = 0; i < 6; i++) { const t = ((a + i * 90) % 380) / 380; if (k1 >= 1 && k0 <= 0) a20Drop(x, Pp[0] + Math.cos(i * 1.1) * 44 * E.kk * t, Pp[1] - 40 * E.kk * Math.sin(Math.PI * t) + 6 * E.kk, 5 * E.kk * (1 - t * 0.6), '#5b92e0', lw * 0.7, 0); } } } }; },
    slime(j, c) { /* it lands by the bottle used twice and gums it shut: a glossy splat over the card, drips running down, two strands back to its hand */
      let id = null; Object.keys(c.cnt).forEach(k => { if (c.cnt[k] >= 2) id = k; }); const cd = (id && a20Card(id)) || c.cards[0]; if (!cd) return null;
      return { want: { x: SAFE.R.x1 - 3, z: cd.z + 5 }, xmax: SAFE.R.x1 + 3.5, hitU: 0.3, dur: 3000, tgt: cd, big: 1.5,
        draw(x, a, E) { if (a < 0.12 * E.D) return; if (!E.cp) E.cp = [E.mouth[0], E.mouth[1]]; const lw = 2.6 * E.kk, B = E.S(cd.x - 0.4, cd.z), w = Math.abs(E.S(cd.x + BT.cw / 2, cd.z)[0] - E.S(cd.x - BT.cw / 2, cd.z)[0]), h = Math.abs(E.S(cd.x, cd.z + BT.ch / 2)[1] - E.S(cd.x, cd.z - BT.ch / 2)[1]), t = a - 0.12 * E.D, k = a20E(t / 260) * (1 + 0.12 * Math.exp(-t / 160) * Math.cos(t / 40)), fo = a20C((3000 - a) / 450, 0, 1); x.globalAlpha = fo;
          if (t < 900) { const st0 = a20C(t / 200, 0, 1); [-0.3, 0.3].forEach((o, i) => a20Stream(x, [E.cp[0] + E.ch * 0.2, E.cp[1] - E.ch * 0.25 + o * 30 * E.kk], [B[0] - w * 0.2, B[1] + o * h * 0.5], (30 + 20 * i) * E.kk * (1 + t / 500), 0, st0 * a20C((900 - t) / 250, 0, 1), 7 * E.kk * (1 - t / 1400), '#8a5ad0', lw * 0.6, i * 3)); }
          for (let i = 0; i < 5 + j.stg; i++) { const dx = (hash('sd' + i) - 0.5) * w * 0.8, L = a20C((t - 200 - i * 60) / 1300, 0, 1) * h * (0.35 + 0.5 * hash('sl' + i)), y0 = B[1] + h * 0.18; if (L <= 0) continue; x.strokeStyle = INK; x.lineCap = 'round'; x.lineWidth = (9 + 5 * hash('sw' + i)) * E.kk + lw * 2; x.beginPath(); x.moveTo(B[0] + dx, y0); x.lineTo(B[0] + dx, y0 + L); x.stroke(); x.strokeStyle = '#8a5ad0'; x.lineWidth -= lw * 2; x.stroke(); }
          a20Blob(x, B[0], B[1], w * 0.5 * k, h * 0.5 * k, 0.7, t / 500, 30); x.fillStyle = '#8a5ad0'; x.fill(); x.strokeStyle = INK; x.lineWidth = lw; x.stroke(); a20Blob(x, B[0] - w * 0.1, B[1] - h * 0.1, w * 0.3 * k, h * 0.26 * k, 1.9, t / 400, 20); x.fillStyle = '#a57ce6'; x.fill();
          x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = lw * 1.2; x.beginPath(); x.ellipse(B[0] - w * 0.14 * k, B[1] - h * 0.14 * k, w * 0.2 * k, h * 0.16 * k, 0, 3.4, 4.5); x.stroke(); if (t < 500) for (let i = 0; i < 9; i++) { const an = i * 0.7, tt = t / 500; a20Puff(x, B[0] + Math.cos(an) * w * (0.4 + 0.5 * tt), B[1] + Math.sin(an) * h * (0.4 + 0.5 * tt) - 30 * E.kk * Math.sin(Math.PI * tt), 7 * E.kk * (1 - tt * 0.5), i, 0, '#8a5ad0', INK, lw * 0.7, fo); } x.globalAlpha = 1; } }; },
    salt(j, c) { /* it shakes itself over the reagent played again and packs its card in crystal, cube by cube */
      const cd = (c.line[0] && a20Card(c.line[0].id)) || c.cards[0]; if (!cd) return null; const N = 9 + 3 * j.stg;
      return { want: { x: SAFE.R.x1 - 3, z: cd.z + 5 }, xmax: SAFE.R.x1 + 3.5, hitU: 0.6, dur: 3200, tgt: cd,
        draw(x, a, E) { if (a < 0) return; const lw = 2.3 * E.kk, B = E.S(cd.x, cd.z), w = Math.abs(E.S(cd.x + BT.cw / 2, cd.z)[0] - E.S(cd.x - BT.cw / 2, cd.z)[0]), h = Math.abs(E.S(cd.x, cd.z + BT.ch / 2)[1] - E.S(cd.x, cd.z - BT.ch / 2)[1]), fo = a20C((3200 - a) / 500, 0, 1), u = a / E.D; x.globalAlpha = fo;
          if (u < 0.9) for (let i = 0; i < 16; i++) { const t = ((a + i * 53) % 420) / 420, A = E.mouth, tx = B[0] + (hash('sg' + i) - 0.5) * w * 0.8, ty = B[1] + (hash('sh' + i) - 0.5) * h * 0.7; a20Cube(x, A[0] + (tx - A[0]) * t, A[1] + (ty - A[1]) * t - 70 * E.kk * Math.sin(Math.PI * t), 4.5 * E.kk, i + t * 4, lw * 0.6); }
          const ord = []; for (let i = 0; i < N; i++) ord.push(i); ord.sort((p, q) => hash('sy' + p) - hash('sy' + q)); ord.forEach(i => { const t0 = (0.12 + 0.75 * i / N) * E.D, t = a - t0; if (t < 0) return; const pop = a20E(t / 130) * (1 + 0.25 * Math.exp(-t / 110) * Math.cos(t / 30)), r = (0.13 + 0.1 * hash('sr' + i)) * h * (1 + 0.1 * j.stg); a20Cube(x, B[0] + (hash('sx' + i) - 0.5) * w * 0.86, B[1] + (hash('sy' + i) - 0.5) * h * 0.9, r * pop, (hash('sa' + i) - 0.5) * 0.7, lw); });
          for (let i = 0; i < 4; i++) { const t = ((a - 0.5 * E.D - i * 260) % 900) / 900; if (a > 0.5 * E.D + i * 260 && t < 0.5) a20Glint(x, B[0] + (hash('gx' + i + Math.floor(a / 900)) - 0.5) * w * 0.8, B[1] + (hash('gy' + i + Math.floor(a / 900)) - 0.5) * h * 0.8, 13 * E.kk * Math.sin(Math.PI * t * 2), lw * 0.6); } x.globalAlpha = 1; } }; },
    co2(j, c) { /* it breathes out: a cold breath rolls over each card that was never touched and frost ferns grow across it */
      let cs = c.cards.filter(q => !g.trail.some(t => !t.free && !t.wasted && !t.bank && t.id === q.id && t.hits > 0)); if (!cs.length) cs = c.cards; cs = cs.slice(0, 3); if (!cs.length) return null; const mz = cs.reduce((s, q) => s + q.z, 0) / cs.length;
      return { want: { x: SAFE.R.x1 - 3, z: mz + 5 }, xmax: SAFE.R.x1 + 3.5, hitU: 0.75, dur: 3400, tgt: cs[Math.floor(cs.length / 2)],
        draw(x, a, E) { if (a < 0) return; const lw = 2.2 * E.kk, fo = a20C((3400 - a) / 500, 0, 1);
          cs.forEach((cd, ci) => { const t0 = (0.05 + 0.25 * ci) * E.D, t = a - t0; if (t < 0) return; const B = E.S(cd.x, cd.z), w = Math.abs(E.S(cd.x + BT.cw / 2, cd.z)[0] - E.S(cd.x - BT.cw / 2, cd.z)[0]), h = Math.abs(E.S(cd.x, cd.z + BT.ch / 2)[1] - E.S(cd.x, cd.z - BT.ch / 2)[1]), gk = a20E(t / 900);
            x.globalAlpha = 0.5 * fo * gk; a20Blob(x, B[0], B[1], w * 0.52, h * 0.52, ci + 0.5, 0, 26); x.fillStyle = '#eaf6ff'; x.fill(); x.globalAlpha = fo;
            /* ferns of frost from the card's near edge */ for (let f = 0; f < 4 + (j.stg > 3 ? 1 : 0); f++) { const y = B[1] + (f - 1.75) * h * 0.24, L = w * (0.55 + 0.4 * hash('fl' + f + ci)) * gk, x0 = B[0] - w * 0.5; [['#ffffff', lw * 2.6], ['#5f9fc8', lw]].forEach(sty => { x.strokeStyle = sty[0]; x.lineWidth = sty[1]; x.beginPath(); x.moveTo(x0, y); x.lineTo(x0 + L, y + 6 * E.kk * Math.sin(f)); for (let b = 1; b < 7; b++) { const bx = x0 + L * b / 7; if (bx > x0 + L) break; const by = y + 6 * E.kk * Math.sin(f) * b / 7, bl = h * 0.11 * (1 - b / 9) * gk; x.moveTo(bx, by); x.lineTo(bx + bl * 0.6, by - bl); x.moveTo(bx, by); x.lineTo(bx + bl * 0.6, by + bl); } x.stroke(); }); }
            for (let i = 0; i < 3; i++) { const tt = ((a + i * 300 + ci * 130) % 1000) / 1000; if (gk > 0.6 && tt < 0.4) a20Glint(x, B[0] + (hash('cx' + i + ci) - 0.5) * w * 0.8, B[1] + (hash('cy' + i + ci) - 0.5) * h * 0.7, 10 * E.kk * Math.sin(Math.PI * tt / 0.4), lw * 0.6); }
            /* the breath itself */ if (t < 700) for (let i = 0; i < 7; i++) { const tt = a20C((t - i * 45) / 420, 0, 1); if (tt <= 0 || tt >= 1) continue; a20Puff(x, E.mouth[0] + (B[0] - E.mouth[0]) * tt, E.mouth[1] + (B[1] - E.mouth[1]) * tt + (i % 2 ? 9 : -9) * E.kk, (9 + 26 * tt) * E.kk, i + ci, a / 200, '#f4f9fc', '#5f9fc8', lw * 0.8, 0.85 * (1 - tt * 0.6)); } }); x.globalAlpha = 1; } }; },
    h2(j, c) { /* it ties a thread to each hydrogen that came off and floats up off the page with them */
      let it = A20.gone.filter(q => q.g === g && q.page === g.page && (q.kind === 'h2' || q.els.every(e => e === 'H'))); if (!it.length) it = A20.gone.filter(q => q.g === g).slice(-2); it = it.slice(-(2 + j.stg)); if (!it.length) it = [{ x: c.mc.x - 2, z: c.mc.z, els: ['H', 'H'] }, { x: c.mc.x + 2, z: c.mc.z, els: ['H', 'H'] }];
      return { want: { x: c.mb.x1 + 5, z: c.mc.z + 4 }, hitU: 0.5, dur: 2600, tgt: c.mc, rise: 1,
        draw(x, a, E) { const pre = j.J * 0.5, lw = 2.2 * E.kk, R = 8 * E.kk, fo = a20C((2500 - a) / 400, 0, 1); if (a < -pre || !E.cp) return; x.globalAlpha = fo;
          it.forEach((q, i) => { const A = E.S(q.x, q.z), th = a20E((a + pre) / (pre + 0.25 * E.D)), lift = a20E((a - 0.2 * E.D - i * 40) / (0.5 * E.D)), hx = E.mouth[0] + (i - (it.length - 1) / 2) * 30 * E.kk, hy = E.mouth[1] + E.ch * 0.75 + 16 * E.kk * (i % 2), px = A[0] + (hx - A[0]) * lift + 5 * E.kk * Math.sin(a / 170 + i), py = A[1] + (hy - A[1]) * lift;
            x.strokeStyle = INK; x.lineWidth = lw * 0.7; x.beginPath(); x.moveTo(E.mouth[0], E.mouth[1] + E.ch * 0.3); const ex = E.mouth[0] + (px - E.mouth[0]) * th, ey = E.mouth[1] + E.ch * 0.3 + (py - E.mouth[1] - E.ch * 0.3) * th; x.quadraticCurveTo((E.mouth[0] + ex) / 2 + 14 * E.kk * Math.sin(a / 200 + i), (E.mouth[1] + ey) / 2 + 20 * E.kk, ex, ey); x.stroke(); a20Piece(x, px, py, R, ['H', 'H'], lw, 0.4 * Math.sin(a / 230 + i * 2));
            if (lift > 0 && lift < 1) { x.globalAlpha = 0.7 * (1 - lift) * fo; x.strokeStyle = INK; x.lineWidth = lw * 0.8; for (let k = -1; k <= 1; k++) { x.beginPath(); x.moveTo(A[0] + k * 9 * E.kk, A[1] + 10 * E.kk); x.lineTo(A[0] + k * 12 * E.kk, A[1] + 22 * E.kk); x.stroke(); } x.globalAlpha = fo; } }); x.globalAlpha = 1; } }; },
    wood(j, c) { /* it tips the bottle that found nothing and drinks it dry: a brown stream to its mouth, bubbles going up the bottle, then the hiccups */
      const dud = c.line.slice(0, 3).find(q => q.places === 0) || c.line[0], cd = (dud && a20Card(dud.id)) || c.cards[0]; if (!cd) return null;
      return { want: { x: SAFE.R.x1 - 3, z: cd.z + 5 }, xmax: SAFE.R.x1 + 3.5, hitU: 0.8, dur: 2600, tgt: cd,
        draw(x, a, E) { if (a < 0) return; const u = a / E.D, lw = 2.4 * E.kk, B = E.S(cd.x + BT.cw * 0.22, cd.z - BT.ch * 0.3), h = Math.abs(E.S(cd.x, cd.z + BT.ch / 2)[1] - E.S(cd.x, cd.z - BT.ch / 2)[1]);
          if (u < 0.92) { const k1 = a20C(u / 0.14, 0, 1), k0 = a20C((u - 0.74) / 0.18, 0, 1); a20Stream(x, B, E.mouth, -(80 + 14 * j.stg) * E.kk, k0, k1, (8 + 1.5 * j.stg) * E.kk, '#9a6b3a', lw * 0.7, -a / 55); for (let i = 0; i < 5; i++) { const t = ((a + i * 150) % 600) / 600; x.globalAlpha = 1 - t; x.strokeStyle = INK; x.fillStyle = 'rgba(214,170,110,0.7)'; x.lineWidth = lw * 0.7; x.beginPath(); x.arc(B[0] + (i - 2) * 7 * E.kk, B[1] + h * 0.5 * (1 - t), (3 + i) * E.kk, 0, 6.2832); x.fill(); x.stroke(); x.globalAlpha = 1; } }
          /* the level in the bottle, drawn beside it, going down */ { const gx = B[0] - 26 * E.kk, lv = 1 - a20C(u / 0.8, 0, 1), fo = a20C((2600 - a) / 400, 0, 1); x.globalAlpha = fo; x.strokeStyle = INK; x.lineWidth = lw; x.fillStyle = '#fbf8ee'; x.beginPath(); x.rect(gx - 7 * E.kk, B[1], 14 * E.kk, h * 0.6); x.fill(); x.fillStyle = '#9a6b3a'; x.fillRect(gx - 7 * E.kk, B[1] + h * 0.6 * (1 - lv), 14 * E.kk, h * 0.6 * lv); x.beginPath(); x.rect(gx - 7 * E.kk, B[1], 14 * E.kk, h * 0.6); x.stroke(); x.globalAlpha = 1; }
          if (u > 0.85) for (let i = 0; i < 3 + j.stg; i++) { const t = (a - 0.85 * E.D - i * 190) / 700; if (t <= 0 || t >= 1) continue; x.globalAlpha = 1 - t * t; x.strokeStyle = INK; x.fillStyle = 'rgba(214,170,110,0.55)'; x.lineWidth = lw * 0.8; x.beginPath(); x.arc(E.mouth[0] + (i % 2 ? 1 : -1) * (12 + 20 * t) * E.kk, E.mouth[1] - (30 + 90 * t) * E.kk, (6 + 3 * (i % 3)) * E.kk * (0.5 + t), 0, 6.2832); x.fill(); x.stroke(); x.globalAlpha = 1; } } }; },
    ammonia(j, c) { /* a sharp whiff at each of the three reagents: each starts awake, and one arrow drawn by hand takes all three round again */
      const ids = []; c.line.slice(0, 3).forEach(q => { if (!ids.includes(q.id)) ids.push(q.id); }); let cs = ids.map(a20Card).filter(Boolean); if (!cs.length) cs = c.cards.slice(0, 3); if (!cs.length) return null; const mz = cs.reduce((s, q) => s + q.z, 0) / cs.length;
      return { want: { x: SAFE.R.x1 - 3, z: mz + 5 }, xmax: SAFE.R.x1 + 3.5, hitU: 0.72, dur: 2800, tgt: cs[0],
        draw(x, a, E) { if (a < 0) return; const lw = 2.4 * E.kk, fo = a20C((2800 - a) / 450, 0, 1), bx = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 }; x.globalAlpha = fo;
          cs.forEach((cd, ci) => { const B = E.S(cd.x, cd.z), w = Math.abs(E.S(cd.x + BT.cw / 2, cd.z)[0] - E.S(cd.x - BT.cw / 2, cd.z)[0]), h = Math.abs(E.S(cd.x, cd.z + BT.ch / 2)[1] - E.S(cd.x, cd.z - BT.ch / 2)[1]); bx.x0 = Math.min(bx.x0, B[0] - w / 2); bx.x1 = Math.max(bx.x1, B[0] + w / 2); bx.y0 = Math.min(bx.y0, B[1] - h / 2); bx.y1 = Math.max(bx.y1, B[1] + h / 2); const t = a - (0.06 + 0.2 * ci) * E.D; if (t < 0) return;
            if (t < 520) for (let i = 0; i < 5; i++) { const tt = a20C((t - i * 40) / 340, 0, 1); if (tt > 0 && tt < 1) a20Puff(x, E.mouth[0] + (B[0] - E.mouth[0]) * tt, E.mouth[1] + (B[1] - E.mouth[1]) * tt + 12 * E.kk * Math.sin(tt * 12 + i), (8 + 14 * tt) * E.kk, i + ci, a / 150, '#f2efb0', INK, lw * 0.7, 0.9 * fo * (1 - tt * 0.5)); }
            const s = t - 340; if (s > 0 && s < 900) { const p = a20E(s / 140), al = a20C((900 - s) / 300, 0, 1); x.globalAlpha = al * fo; x.strokeStyle = INK; x.lineWidth = lw * 1.3; x.lineCap = 'round'; for (let k = 0; k < 10; k++) { const an = k / 10 * 6.2832 + ci, r0 = 0.62, r1 = 0.62 + 0.2 * p; x.beginPath(); x.moveTo(B[0] + Math.cos(an) * w * r0, B[1] + Math.sin(an) * h * r0 * 1.1); x.lineTo(B[0] + Math.cos(an) * w * r1, B[1] + Math.sin(an) * h * r1 * 1.1); x.stroke(); } x.globalAlpha = fo; } });
          const s = a - 0.62 * E.D; if (s > 0) { /* round again */ const k = a20E(s / 620), cx = (bx.x0 + bx.x1) / 2, cy = (bx.y0 + bx.y1) / 2, rx = (bx.x1 - bx.x0) / 2 + 16 * E.kk, ry = (bx.y1 - bx.y0) / 2 + 14 * E.kk, a0 = -2.2, a1 = a0 + 5.6 * k; x.strokeStyle = INK; x.lineWidth = lw * 2.1; x.lineCap = 'round'; x.beginPath(); for (let i = 0; i <= 40; i++) { const an = a0 + (a1 - a0) * i / 40, wb = 1 + 0.03 * Math.sin(an * 5); const X = cx + Math.cos(an) * rx * wb, Y = cy + Math.sin(an) * ry * wb; if (i) x.lineTo(X, Y); else x.moveTo(X, Y); } x.stroke(); const hx = cx + Math.cos(a1) * rx, hy = cy + Math.sin(a1) * ry, ta = Math.atan2(Math.cos(a1) * ry, -Math.sin(a1) * rx); x.beginPath(); x.moveTo(hx - 22 * E.kk * Math.cos(ta - 0.5), hy - 22 * E.kk * Math.sin(ta - 0.5)); x.lineTo(hx, hy); x.lineTo(hx - 22 * E.kk * Math.cos(ta + 0.5), hy - 22 * E.kk * Math.sin(ta + 0.5)); x.stroke(); } x.globalAlpha = 1; } }; },
    seedling(j, c) { /* it plants itself in the page: a mound of earth, and a shoot runs to every new atom, leafing as it goes */
      const hv = (g.m.atoms || []).filter(a => a.el !== 'H' && !a.fly && center.balls.has(a)), fresh = hv.slice(-Math.max(3, Math.min(8, (P.HOMS2K && P.HOMS2K.seedling && P.HOMS2K.seedling.gain) || 6)));
      return { want: { x: c.mb.x0 - 5, z: Math.min(4.5, c.mb.z1 + 1) }, hitU: 0.55, dur: 3000, tgt: c.mc, plant: 1,
        draw(x, a, E) { if (a < 0 || !E.cp) return; const lw = 2.4 * E.kk, u = a / E.D, fo = a20C((3000 - a) / 450, 0, 1), F0 = this.foot ? E.S(this.foot.x, this.foot.z) : E.cp, v = new T.Vector3(); x.globalAlpha = fo;
          (this.fr = (this.fr && this.fr.length && this.fr.every(q => center.balls.has(q)) ? this.fr : Array.from(center.balls.keys()).filter(q => q.el !== 'H' && !q.fly).slice(-Math.max(3, fresh.length || 6)))).forEach((at, i) => { const b = center.balls.get(at); if (!b) return; b.mesh.getWorldPosition(v); const B = E.S(v.x, v.z - 0.35 * v.y), k = a20E((a - (0.1 + 0.07 * i) * E.D) / (0.6 * E.D)); if (k <= 0) return; const mx = (F0[0] + B[0]) / 2 + (i % 2 ? 1 : -1) * 30 * E.kk, my = Math.min(F0[1], B[1]) - (40 + 14 * i) * E.kk + (F0[1] - Math.min(F0[1], B[1])) * 0.3, pt = t => [(1 - t) * (1 - t) * F0[0] + 2 * t * (1 - t) * mx + t * t * B[0], (1 - t) * (1 - t) * F0[1] + 2 * t * (1 - t) * my + t * t * B[1]];
            [[INK, lw * 2.4], ['#3f9a4f', lw * 1.2]].forEach(sty => { x.strokeStyle = sty[0]; x.lineWidth = sty[1]; x.lineCap = 'round'; x.beginPath(); for (let s = 0; s <= 20; s++) { const q = pt(k * s / 20); if (s) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); } x.stroke(); });
            for (let s = 1; s <= 5; s++) { const t = s / 6; if (t > k) break; const q = pt(t), q2 = pt(t + 0.02), an = Math.atan2(q2[1] - q[1], q2[0] - q[0]) + (s % 2 ? 1 : -1) * 0.9, gr = a20E((k - t) * 6); a20Leaf(x, q[0], q[1], 12 * E.kk * gr * (1 + 0.08 * j.stg), an + 0.1 * Math.sin(a / 200 + s), lw * 0.8); }
            if (k >= 1) { const t = a20E((a - (0.7 + 0.07 * i) * E.D) / 260), r = b.mesh.scale.x * E.uPx * 1.35; x.strokeStyle = '#3f9a4f'; x.lineWidth = lw * 1.3; x.beginPath(); x.arc(B[0], B[1], r, 1.2, 1.2 + 5.4 * t); x.stroke(); if (t >= 1) a20Leaf(x, B[0] + r * Math.cos(0.3), B[1] + r * Math.sin(0.3), 10 * E.kk, -0.8, lw * 0.8); } });
          E.cut(); /* the earth at its feet */ const mk = a20E(u / 0.18); a20Blob(x, F0[0], F0[1] + 4 * E.kk, 58 * E.kk * mk, 15 * E.kk * mk, 0.4, 0, 20); x.fillStyle = '#8a6238'; x.fill(); x.strokeStyle = INK; x.lineWidth = lw; x.stroke(); if (a < 500) for (let i = 0; i < 8; i++) { const t = a / 500, an = 3.4 + i * 0.36; x.fillStyle = '#8a6238'; x.strokeStyle = INK; x.lineWidth = lw * 0.6; x.beginPath(); x.arc(F0[0] + Math.cos(an) * 80 * E.kk * t, F0[1] + Math.sin(an) * 70 * E.kk * t + 60 * E.kk * t * t, 4.5 * E.kk, 0, 6.2832); x.fill(); x.stroke(); } x.globalAlpha = 1; } }; },
    brimstone(j, c) { /* it stamps and the rest of the round goes up: fire runs from its feet along the book to the round's pages and burns there */
      const RD = SHP && SHP.round ? { x: SHP.round.x + 4.5, z: SHP.round.z + 0.6 } : { x: -19, z: -9 };
      return { want: { x: c.mb.x0 - 6, z: c.mc.z + 4 }, hitU: 0.4, dur: 3600, tgt: RD,
        draw(x, a, E) { if (a < 0.3 * E.D || !this.foot) return; const t = a - 0.3 * E.D, lw = 2.3 * E.kk, F0 = this.foot, N = 8 + j.stg, die = a20C((3300 - t) / 600, 0, 1), top = SAFE.R.z0 + 1.2;
          const path = k => { /* down from its feet to the foot of the page? no: up to the head of the page, along it, to the round's pages */ const L1 = Math.abs(F0.z - top), L2 = Math.abs(F0.x - RD.x), L3 = Math.abs(RD.z - top), L = L1 + L2 + L3, d = k * L; if (d < L1) return { x: F0.x, z: F0.z - d }; if (d < L1 + L2) return { x: F0.x + (RD.x - F0.x) * (d - L1) / L2, z: top }; return { x: RD.x, z: top + (RD.z - top) * (d - L1 - L2) / Math.max(0.01, L3) }; };
          /* the scorch under the round's pages */ { const s = E.S(RD.x, RD.z), k = a20E((t - 600) / 500); if (k > 0) { x.globalAlpha = 0.5 * k * die; a20Blob(x, s[0], s[1], 120 * E.kk * k, 44 * E.kk * k, 0.8, 0, 26); x.fillStyle = '#2a1c14'; x.fill(); x.globalAlpha = 1; } }
          for (let i = 0; i < N; i++) { const k = i / (N - 1), t0 = k * 600, tt = t - t0; if (tt < 0) continue; const w = path(k), s = E.S(w.x, w.z), gk = a20E(tt / 160) * (i >= N - 3 ? die : a20C((1500 - tt) / 500, 0, 1)); if (gk <= 0.02) continue; a20Flame(x, s[0], s[1], (36 + 26 * hash('bf' + i)) * E.kk * gk * (1 + 0.07 * j.stg) * (i >= N - 3 ? 1.7 : 1), a / 70 + i * 1.7, lw); }
          for (let i = 0; i < 7; i++) { const k = a20E((t - 600) / 300) * die; if (k <= 0.02) continue; const s = E.S(RD.x + (i - 3) * 2.3, RD.z + (i % 2) * 1.0); a20Flame(x, s[0], s[1], (58 + 30 * hash('bg' + i)) * E.kk * k * (1 + 0.08 * j.stg), a / 60 + i * 2.3, lw); }
          for (let i = 0; i < 10; i++) { const tt = ((t + i * 170) % 1100) / 1100; if (t < 600 || die <= 0) continue; const s = E.S(RD.x + (hash('be' + i) - 0.5) * 16, RD.z); x.globalAlpha = (1 - tt) * die; x.fillStyle = '#f7a23a'; x.strokeStyle = INK; x.lineWidth = lw * 0.5; x.beginPath(); x.arc(s[0] + 10 * E.kk * Math.sin(tt * 8 + i), s[1] - 150 * E.kk * tt, 3.5 * E.kk, 0, 6.2832); x.fill(); x.stroke(); x.globalAlpha = 1; } } }; }
  };
  // how each one moves its body while it acts (acid, water and slime are builder 19's)
  Object.assign(JACT, {
    salt: (u, o, j, once) => { once('sq', () => sfx.drift()); const w = Math.sin(Math.PI * Math.min(1, u * 1.3)); o.rz = -0.55 * w; o.y += 1.6 * w + 0.5 * Math.abs(Math.sin(u * Math.PI * 9)) * w; o.hx += 0.5 * Math.sin(u * 70) * w; o.sy *= 1 + 0.12 * Math.sin(u * 56) * w; },
    co2: (u, o, j, once) => { const n = 3, p = (u * n) % 1, blow = p > 0.45; if (blow) once('b' + Math.floor(u * n), () => sfx.drift()); o.sy *= blow ? 1 - 0.22 * Math.sin(Math.PI * (p - 0.45) / 0.55) : 1 + 0.3 * Math.sin(Math.PI * p / 0.45 / 2); o.sx *= blow ? 1 + 0.14 * Math.sin(Math.PI * (p - 0.45) / 0.55) : 1 - 0.1 * Math.sin(Math.PI * p / 0.9); o.rz = blow ? -0.3 * Math.sin(Math.PI * (p - 0.45) / 0.55) : 0.2 * (p / 0.45); },
    h2: (u, o, j, once) => { once('up', () => sfx.drift()); const r = u < 0.2 ? 0 : (u - 0.2) / 0.8, e = r * r * (3 - 2 * r); o.y += 2 + (11 + 2 * j.stg) * e; o.rz = 0.16 * Math.sin(u * 11); o.sy *= 1 + 0.2 * e; o.sx *= 1 - 0.08 * e; },
    wood: (u, o, j, once) => { once('sq', () => sfx.squish()); const dr = Math.min(1, u / 0.15) * (u > 0.8 ? Math.max(0, 1 - (u - 0.8) / 0.1) : 1); o.rz = 0.5 * dr + (u > 0.82 ? 0.35 * Math.sin((u - 0.82) * 40) : 0); o.sy *= 1 + 0.1 * Math.abs(Math.sin(u * Math.PI * 7)) * dr; o.sx *= 1 + 0.16 * (u > 0.2 ? Math.min(1, (u - 0.2) / 0.6) : 0); if (u > 0.84) { once('hic', () => sfx.stamp()); o.y += 1.4 * Math.abs(Math.sin((u - 0.84) * 30)); } },
    ammonia: (u, o, j, once) => { const n = 3, p = (u * n * 1.25) % 1, on = u < 0.8; if (on) once('p' + Math.floor(u * n * 1.25), () => sfx.stamp()); const k = on ? Math.exp(-p * 5) : 0; o.sx *= 1 + 0.35 * k; o.sy *= 1 - 0.22 * k; o.y += 1.6 * k; o.rz = -0.25 * k; if (!on) o.ry = 6.2832 * (u - 0.8) / 0.2; },
    seedling: (u, o, j, once) => { once('sq', () => sfx.squish()); if (u < 0.2) { const c = Math.sin(Math.PI * (u / 0.2) / 2); o.sy *= 1 - 0.45 * c; o.sx *= 1 + 0.3 * c; o.y -= 0.6 * c; } else { const s = Math.min(1, (u - 0.2) / 0.5), e = s * s * (3 - 2 * s); o.sy *= 0.55 + 0.9 * e + 0.06 * Math.sin(u * 40) * e; o.sx *= 1.3 - 0.4 * e; o.y -= 0.6 * (1 - e); o.rz = 0.1 * Math.sin(u * 14) * e; } },
    brimstone: (u, o, j, once) => { if (u < 0.3) { const c = u / 0.3; o.sy *= 1 + 0.4 * c; o.sx *= 1 - 0.12 * c; o.y += 3.5 * Math.sin(Math.PI * c); o.hx += 0.4 * Math.sin(u * 160) * c; } else { once('st', () => sfx.stamp()); const w = (u - 0.3) / 0.7, q = Math.exp(-w * 5) * Math.cos(w * 18); o.sy *= 1 - 0.4 * q; o.sx *= 1 + 0.3 * q; o.rz = 0.1 * Math.sin(u * 50) * (1 - w); } }
  });
  Object.assign(JUMPS, { salt: 1, co2: 1, h2: 1, wood: 1, ammonia: 1, seedling: 1, brimstone: 1 });
  function jumpPlan20(id, to) {
    if (!JUMPS[id] || !center || !SAFE || !homObj || !A20ACT[id]) return null; const now = performance.now(), pf = paceK(), stg = Math.max(1, Math.min(5, homObj.stage || 3)), F = a20Fig(), mb = a20MolBox() || { x0: C0.x - 5, x1: C0.x + 5, z0: C0.z - 4, z1: C0.z + 4 }, mc = { x: (mb.x0 + mb.x1) / 2, z: (mb.z0 + mb.z1) / 2 };
    const line = a20Line(), cards = [], cnt = {}; BT.map.forEach((b, cid) => { const q = a20Card(cid); if (q && !b.gone) cards.push(q); }); cards.sort((p, q) => p.z - q.z); line.slice(0, 3).forEach(c => { cnt[c.id] = (cnt[c.id] || 0) + 1; });
    let W = 260 * pf; const RT = (r21Fig() && R21T[id]) || [380, 640 + 70 * stg, 400] /* (builder 21) a rigged creature's trip has its own lengths */, J = RT[0] * pf, D = RT[1] * pf, B = RT[2] * pf, L = 260, j = { W, J, D, B, L, stg, f: {}, spot: mc, a20: true };
    const act = A20ACT[id](j, { mb, mc, line, cards, cnt, F }); if (!act) return null; let pl = null; if (act.xmax && cards.length) { /* a creature that works on the cards stands on the bench under them, by the book's edge: never across the molecule */ const zc = cards[cards.length - 1].z + BT.ch / 2 + 0.6; for (let kk = F.k * (act.big || 1), n = 0; n < 5 && !pl; n++, kk *= 0.88) { const pz = zc - F.fz0 * kk; if (pz <= 25.5) pl = { x: SAFE.R.x1 + 7.5, z: pz, k: kk }; } } if (!pl) pl = a20Place(F, F.k * (1 + 0.04 * (stg - 3)) * (act.big || 1), act.want, act.xmax, act.pad); j.perch = { x: pl.x, z: pl.z }; j.k = pl.k; if (act.after) act.after(pl); act.foot = j.perch; j.tgt = act.tgt || mc; j.act = act;
    const pre = W + J + act.hitU * D; W += Math.min(700, Math.max(0, kinNext(now + pre) - (now + pre))); j.W = W; j.hit = W + J + act.hitU * D; j.rest = (1 - act.hitU) * D + B * 0.6; j.want0 = st.want; j.fig = F;
    A20.inks.push({ t0: now + W + J, end: now + W + J + act.dur, D, act, j }); A20.until = now + W + J + D + B * 0.5; A20.hold = { until: now + j.hit, want: st.shown };
    const R0 = Math.random, puff = (at, dl) => { for (let i = 0; i < 6; i++) { const sz = 2.4 * (0.75 + 0.5 * R0()) * pl.k / 2; actPiece('puff', dl, 420, (u, s) => { s.position.set(at.x + (i - 2.5) * 1.5 * u * pl.k / 2, 1 + 0.5 * Math.sin(Math.PI * u), at.z + 1.0); s.scale.set(sz, sz, 1); s.material.opacity = u < 0.15 ? u / 0.15 : 1 - u; }); } }; puff(j.perch, W + J); puff(HOMP, W + J + j.D + B) /* (builder 22) j.D: an act may have lengthened its work */;
    return j;
  }
  jumpPlan = jumpPlan20;
  homJump = (f0 => function (A, now) { const j = A.j, o = f0(A, now); if (!o) { A20.cw = null; return o; }
    if (j && j.a20) { const a = now - A.t; if (j.act.rise && a > j.W + j.J + j.D) { /* it comes down from where it floated */ const u = Math.min(1, (a - j.W - j.J - j.D) / j.B); o.y += (13 + 2 * j.stg) * (1 - u) * (1 - u); }
      if (a >= j.hit && !j.f.tick) { j.f.tick = 1; A20.hold = null; try { st.want = Math.max(st.want, P.made(Object.assign({}, g, { frozenAt: null }))); st.madeBump = 1; st.tickT = now; A20.roll = AA.rxFeel && AA.rxFeel.homLand && AA.rxFeel.homLand(st.want) ? 0 : now; sfx.good(); } catch (e) { /* no yield */ } } }
    A20.cw = { x: o.hx, y: o.y, z: o.hz, k: o.k, sy: o.sy }; return o; })(homJump);
  // the ink of the acts, drawn by kinFrame into the page's ink layer
  function a20Ink(x, now, scr, W, H, cutAll, uPx) {
    if (A20.hold && now < A20.hold.until && st.homAct) { /* the yield waits for the act to land */ if (st.want > A20.hold.want) { A20.hold.to = st.want; st.want = A20.hold.want; } } else if (A20.hold) { if (A20.hold.to) st.want = Math.max(st.want, A20.hold.to); A20.hold = null; }
    if (A20.roll) { /* the number rolls up as the act lands (the page's own roll waits for the page to go on) */ const d = st.want - st.shown; if (now - A20.roll > 900 || Math.abs(d) < 2) A20.roll = 0; else { st.shown += d * 0.14; st.madeBump = Math.max(st.madeBump || 0, 0.6); dirty = true; } }
    if (!A20.inks.length) return; A20.inks = A20.inks.filter(q => now < q.end); const kk = W / 1280;
    A20.inks.forEach(q => { const a = now - q.t0, cw = A20.cw && st.homAct && st.homAct.j === q.j ? A20.cw : null, cp = cw ? scr(cw.x, cw.y, cw.z) : null, ch = q.j.fig.hN * H * (cw ? cw.k * (cw.sy || 1) : 1), E = { S: (wx, wz) => scr(wx, 0.05, wz), kk, D: q.D, cp, ch, uPx, mouth: cp ? [cp[0], cp[1] - ch * 0.55] : q.lastM || scr(HOMP.x, 3, HOMP.z), cut: cutAll }; if (cp) q.lastM = E.mouth;
      x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; try { q.act.draw(x, a, E); } catch (e) { A20.err = String(e && e.stack); } x.restore(); x.globalAlpha = 1; x.setLineDash([]); x.globalCompositeOperation = 'source-over'; }); dirty = true;
  }
  // (builder 20, ruling BB) SPENT FOR THE ROUND: once its tap is used it sits down, tired: low, wide, leaning, breathing slowly; it stands up again with the next round
  function a20Spent(now) { if (homObj && homObj.id === 'co2' && homObj.grp.visible && AA.rxKit.fogDrift) { try { if (AA.rxKit.fogDrift(homObj.grp, now / 1000)) dirty = true; } catch (e) { /* still fog */ } }
    if (!homObj || !g || !g.hom || st.homAct || HEVO.pos || !homObj.grp.visible) { A20.sit = 0; return; } let sp = null; try { sp = P.homSpent ? P.homSpent(g) : null; } catch (e) { sp = null; }
    A20.sit = (A20.sit || 0) + ((sp ? 1 : 0) - (A20.sit || 0)) * 0.12; const k = A20.sit; if (k < 0.01) return; if (Math.abs(k - (sp ? 1 : 0)) > 0.01) dirty = true;
    const G = homObj.grp, br = 0.03 * Math.sin(now / 900); G.scale.y *= 1 - (0.3 - br) * k; G.scale.x *= 1 + 0.14 * k; G.rotation.z += 0.2 * k; G.position.y -= 0.15 * k; const fg = G.children[0]; if (fg && AA.rxKit.pose) { try { AA.rxKit.pose(fg, { lean: [0.25 * k, 0.5 * k], reach: 0, squash: 0.6 * k, t: now / 2600 }); } catch (e) { /* no pose */ } }
  }
  // (builder 20) WHAT THE RUN EARNED, shown with no word: each thing lands large in the middle of the left page on the beat, is seen, and goes to
  // where it now lives (a creature to the shelf, an instrument to the kit row, credit to the tin, everything of the book into the manual), one
  // after another; a small copy stays there until all have arrived. Pictures and numbers only. A20.earn = { list, t0, L } is set at the run's end.
  function a20Glyph(x, it, r, lw) {
    const gv = it.gives, ink = INK; x.lineWidth = lw; x.strokeStyle = ink; x.lineJoin = 'round'; x.lineCap = 'round';
    if (gv === 'credit') { x.fillStyle = '#e9b93a'; x.beginPath(); x.arc(0, 0, r * 0.8, 0, 6.2832); x.fill(); x.stroke(); x.beginPath(); x.arc(0, 0, r * 0.56, 0, 6.2832); x.lineWidth = lw * 0.6; x.stroke(); try { AA.rxPen.write(x, '+' + (it.credit || 1), r * 1.0, r * 0.3, r * 0.9, { weight: 'heavy', color: ink, align: 'left' }); } catch (e) { /* no pen */ } return; }
    if (gv === 'motif' && AA.rxMarks && AA.rxMarks.motifMark && it.thing) { try { AA.rxMarks.motifMark(x, it.thing, 0, 0, r * 1.7, { t: 1, pips: 1, lw: 7, ink, red: REDINK }); return; } catch (e) { /* the plain mark below */ } }
    if (gv === 'homunculus') { /* a jar with a face in it */ x.fillStyle = 'rgba(223,233,238,0.7)'; x.beginPath(); x.rect(-r * 0.6, -r * 0.7, r * 1.2, r * 1.5); x.fill(); x.stroke(); x.fillStyle = '#3a3632'; x.fillRect(-r * 0.68, -r * 0.95, r * 1.36, r * 0.26); const hc = { water: '#3a6fd0', h2: '#e58a7c', co2: '#e9eef2', acid: '#d4e21a', wood: '#9a6b3a', salt: '#e9e4d6', slime: '#8a5ad0', seedling: '#3f9a4f', ammonia: '#bcd6dc', brimstone: '#f0b93a' }[it.thing] || '#8a5ad0'; x.fillStyle = hc; x.beginPath(); x.arc(0, r * 0.3, r * 0.42, 0, 6.2832); x.fill(); x.stroke(); x.fillStyle = ink; [-1, 1].forEach(q => { x.beginPath(); x.arc(q * r * 0.15, r * 0.24, r * 0.05, 0, 6.2832); x.fill(); }); return; }
    if (gv === 'instrument') { /* a stand and a flask */ x.beginPath(); x.moveTo(-r * 0.7, r * 0.8); x.lineTo(r * 0.7, r * 0.8); x.moveTo(-r * 0.45, r * 0.8); x.lineTo(-r * 0.45, -r * 0.9); x.moveTo(-r * 0.45, -r * 0.4); x.lineTo(r * 0.2, -r * 0.4); x.stroke(); x.fillStyle = '#7fc4d6'; x.beginPath(); x.moveTo(r * 0.08, -r * 0.5); x.lineTo(r * 0.08, -r * 0.1); x.lineTo(-r * 0.3, r * 0.6); x.lineTo(r * 0.7, r * 0.6); x.lineTo(r * 0.32, -r * 0.1); x.lineTo(r * 0.32, -r * 0.5); x.closePath(); x.fill(); x.stroke(); return; }
    if (gv === 'sigil') { x.fillStyle = '#f3e7c2'; x.beginPath(); x.arc(0, 0, r * 0.85, 0, 6.2832); x.fill(); x.stroke(); x.strokeStyle = '#b8892a'; x.beginPath(); for (let i = 0; i < 3; i++) { const a = -1.5708 + i * 2.0944; x.lineTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62); } x.closePath(); x.stroke(); x.beginPath(); x.arc(0, 0, r * 0.3, 0, 6.2832); x.stroke(); return; }
    if (gv === 'reagent') { /* a stoppered bottle */ x.fillStyle = '#fbf8ee'; x.beginPath(); x.moveTo(-r * 0.2, -r * 0.9); x.lineTo(r * 0.2, -r * 0.9); x.lineTo(r * 0.2, -r * 0.4); x.lineTo(r * 0.55, -r * 0.1); x.lineTo(r * 0.55, r * 0.85); x.lineTo(-r * 0.55, r * 0.85); x.lineTo(-r * 0.55, -r * 0.1); x.lineTo(-r * 0.2, -r * 0.4); x.closePath(); x.fill(); x.stroke(); x.fillStyle = '#3a6fd0'; x.fillRect(-r * 0.5, r * 0.15, r * 1.0, r * 0.65); x.strokeRect(-r * 0.5, r * 0.15, r * 1.0, r * 0.65); return; }
    if (gv === 'reflex') { /* it goes round by itself */ x.beginPath(); x.arc(0, 0, r * 0.65, 0.5, 5.4); x.stroke(); const a = 5.4, hx = Math.cos(a) * r * 0.65, hy = Math.sin(a) * r * 0.65; x.beginPath(); x.moveTo(hx - r * 0.34, hy - r * 0.05); x.lineTo(hx, hy); x.lineTo(hx - r * 0.02, hy + r * 0.36); x.stroke(); a20Ball(x, 0, 0, r * 0.2, 'C', lw * 0.7); return; }
    if (gv === 'length') { /* a thicker notebook: one pip for each three rounds */ x.fillStyle = '#fbf8ee'; x.beginPath(); x.rect(-r * 0.85, -r * 0.6, r * 1.7, r * 1.2); x.fill(); x.stroke(); x.beginPath(); x.moveTo(0, -r * 0.6); x.lineTo(0, r * 0.6); x.stroke(); const n = it.thing === 'doctorate' ? 3 : it.thing === 'master' ? 2 : 1; x.fillStyle = ink; for (let i = 0; i < n; i++) { x.beginPath(); x.arc(r * 0.42, -r * 0.3 + i * r * 0.3, r * 0.09, 0, 6.2832); x.fill(); } return; }
    if (gv === 'soundtrack') { x.fillStyle = ink; x.beginPath(); x.ellipse(-r * 0.3, r * 0.5, r * 0.28, r * 0.2, -0.3, 0, 6.2832); x.fill(); x.beginPath(); x.ellipse(r * 0.45, r * 0.3, r * 0.28, r * 0.2, -0.3, 0, 6.2832); x.fill(); x.beginPath(); x.moveTo(-r * 0.05, r * 0.45); x.lineTo(-r * 0.05, -r * 0.7); x.lineTo(r * 0.7, -r * 0.9); x.lineTo(r * 0.7, r * 0.25); x.stroke(); return; }
    /* anything else: a page of the book with a star */ x.fillStyle = '#fbf8ee'; x.beginPath(); x.rect(-r * 0.6, -r * 0.8, r * 1.2, r * 1.6); x.fill(); x.stroke(); a20Glint(x, 0, 0, r * 0.45, lw * 0.7);
  }
  function a20Earned(now) {
    const Eo = A20.earn; let c = A20.ecv; if (!Eo || !Eo.list.length) { if (c && c.width) c.width = 0; return; }
    const L = Eo.L, N = Eo.list.length, per = L * 3, end = Eo.t0 + N * per + 1600; if (now > end + 400 || (st.mode !== 'done' && st.mode !== 'shop' && now > Eo.t0 + 400)) { if (st.mode !== 'done' && st.mode !== 'shop') A20.earn = null; if (c && c.width) c.width = 0; if (now > end + 400) Eo.shown = true; return; }
    if (!c) { c = A20.ecv = document.createElement('canvas'); c.className = 'veil'; app.append(c); } const W = veil.width || 1280, H = veil.height || 720; if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const x = c.getContext('2d'), kk = W / 1280, v = new T.Vector3(), scr = (wx, wy, wz) => { v.set(wx, wy, wz).project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H]; }; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); dirty = true;
    const mid = scr((SAFE.L.x0 + SAFE.L.x1) / 2, 0.1, 0), book = [0.03 * W, 0.165 * H], home = it => { if (it.gives === 'homunculus') { const j = jarPos(it.thing); if (j) return scr(j.x, 2, j.z); } if (it.gives === 'instrument') return scr((BNZ.kit.x0 + BNZ.kit.x1) / 2, 1, BNZ.kit.z); if (it.gives === 'credit') return scr(BNZ.fresh.x + 6, 1, BNZ.fresh.z - 4); return book; };
    const slot = {}; Eo.list.forEach((it, i) => { const a = now - (Eo.t0 + i * per); if (a < 0) return; const hm = home(it), key = Math.round(hm[0]) + ':' + Math.round(hm[1]), n = slot[key] = (slot[key] || 0) + 1, hx = hm[0] + (n - 1) * 30 * kk, hy = hm[1] + (hm === book ? (n - 1) * 0 : 0), fo = a20C((end - now) / 400, 0, 1);
      if (!it.snd) { it.snd = 1; try { sfxN('unlock'); sfx.stamp(); } catch (e) { /* no sound */ } }
      const hold = L * 1.9, fly = a20E((a - hold) / (L * 0.9)), pop = a20E(a / 150) * (1 + 0.3 * Math.exp(-a / 110) * Math.cos(a / 32)), px = mid[0] + (hx - mid[0]) * fly, py = mid[1] + (hy - mid[1]) * fly - 80 * kk * Math.sin(Math.PI * fly), r = (84 * (1 - fly) + 17 * fly) * kk * (fly > 0 ? 1 : pop), bump = fly >= 1 ? 1 + 0.5 * Math.exp(-(a - hold - L * 0.9) / 120) : 1;
      x.save(); x.globalAlpha = fo; if (fly <= 0) { /* a ring of ink round it as it lands */ const k = a20E(a / 260); x.strokeStyle = INK; x.lineWidth = 3 * kk; x.globalAlpha = fo * (1 - k) * 0.9; x.beginPath(); x.arc(px, py, r * (1 + 1.2 * k), 0, 6.2832); x.stroke(); x.globalAlpha = fo; for (let s = 0; s < 8; s++) { const an = s * 0.785 + 0.3, r0 = r * 1.25, r1 = r * (1.25 + 0.3 * a20E(a / 200)); x.globalAlpha = fo * a20C(1 - a / 700, 0, 1); x.beginPath(); x.moveTo(px + Math.cos(an) * r0, py + Math.sin(an) * r0); x.lineTo(px + Math.cos(an) * r1, py + Math.sin(an) * r1); x.stroke(); } x.globalAlpha = fo; }
      x.translate(px, py); x.scale(bump, bump); x.rotate(fly > 0 && fly < 1 ? (1 - fly) * 0.5 * Math.sin(fly * 9) : 0); a20Glyph(x, it, r, Math.max(1.6, r * 0.07)); x.restore(); });
  }
  // (builder 19) THE EVOLVE MOMENT, kept wholly on the screen: the creature gathers itself at home, leaps on the beat to the middle of the open book,
  // and on the next beat is its new form, landing large and turning once round (so its back is seen), its new number written under it in ink; it
  // stands there five beats, bouncing on each, and leaps home. Under 'keep' (the owner's pick) a stage comes from the jar, which the page fills at
  // a round's end, so the page itself sees that the creature standing on the bench is behind its stage and starts the moment.
  function homEvo19(now) {
    if (!homObj || !g) return; const ev = g.homEvolved;
    if (ev && ev !== HEVO.seen && ev.id === homObj.id && HEVO.done && !HEVO.pend) { HEVO.seen = ev; HEVO.pend = true; }
    if (HEVO.done && !HEVO.pend && homObj.stage && st.mode === 'play' && !st.homAct && !st.firing && homObj.grp.visible) { let hs = null; try { hs = P.homStage(run && run.meta ? run : { meta }, homObj.id); } catch (e) { hs = null; } if (hs && hs.stage > homObj.stage) { HEVO.seen = { id: homObj.id, stage: hs.stage, from: homObj.stage, mult: hs.mult }; HEVO.pend = true; } }
    if (HEVO.pend && !st.homAct) { HEVO.pend = false; HEVO.L = Math.max(380, Math.min(700, kinLen(now))); HEVO.at = kinNext(now + 420); HEVO.done = false; HEVO.swap = false; HEVO.j1 = 0; HEVO.s0 = homObj.s; }
    if (HEVO.done) return; const a = now - HEVO.at, L = HEVO.L, EV = { x: -19.5, z: 4 } /* (builder 20) on the left page: it never stands over the molecule */, ez = u => u * u * (3 - 2 * u); dirty = true;
    const Q = HEVO.pos = HEVO.pos || { x: HOMP.x, z: HOMP.z, y: 0, sx: 1, sy: 1 }; Q.sx = 1; Q.sy = 1; Q.y = 0;
    const leap = (c, A, B) => { const u = Math.min(1, c / (L * 0.8)), e = ez(u); Q.x = A.x + (B.x - A.x) * e; Q.z = A.z + (B.z - A.z) * e; Q.y = Math.sin(Math.PI * u) * 10; Q.sy = 1 + 0.25 * Math.sin(Math.PI * u); if (u >= 1) { const w = (c - L * 0.8) / (L * 0.2); Q.sy = 1 - 0.25 * Math.sin(Math.PI * w); Q.sx = 1 + 0.15 * Math.sin(Math.PI * w); } return e; };
    if (a < 0) { const u = Math.max(0, 1 + a / 420), c = Math.sin(u * Math.PI / 2); Q.x = HOMP.x; Q.z = HOMP.z; Q.sy = 1 - 0.3 * c; Q.sx = 1 + 0.18 * c; return; }
    if (a < L) { leap(a, HOMP, EV); if (!HEVO.j1) { HEVO.j1 = 1; try { sfx.drift(); } catch (e) { /* no sound */ } } return; }
    if (!HEVO.swap) { HEVO.swap = true; const id = homObj.id; HEVO.num = HEVO.seen && HEVO.seen.mult; HEVO.numT = now; HEVO.numFor = L * 5 + 150; homStand(); homObj.grp.visible = true; HEVO.s1 = homObj.s; HEVO.big = Math.max(1.15, Math.min(2.9, 17 / Math.max(1, HEVO.s1 * (homObj.h0 || 3)))); try { burst3(EV.x, 3, EV.z, 26, '#fbf6e6'); burst3(EV.x, 2, EV.z, 22, '#' + new T.Color(JARC[id]).getHexString()); } catch (e) { /* no puff */ } try { sfx.stamp(); sfx.good(); } catch (e) { /* no sound */ } }
    const b = a - L, fg = homObj.grp.children[0];
    if (b < L * 5) { Q.x = EV.x; Q.z = EV.z; const u = Math.min(1, b / (L * 0.9)), e = 1 - Math.pow(1 - u, 3), bt = (b / L) % 1, on = b > L ? 1 : 0; homObj.s = HEVO.s1 * HEVO.big * (0.35 + 0.65 * e + 0.25 * Math.sin(Math.PI * u) * (1 - u)); const bn = on * Math.exp(-bt * 5) * Math.sin(bt * 16); Q.sy = 1 + 0.12 * bn; Q.sx = 1 - 0.08 * bn; Q.y = on * 1.4 * Math.sin(Math.min(1, bt * 2.2) * Math.PI); if (fg) fg.rotation.y = (1 - e) * 6.2832; return; }
    const c = b - L * 5; if (c < L) { const e = leap(c, EV, HOMP); homObj.s = HEVO.s1 * (HEVO.big + (1 - HEVO.big) * e); if (fg) fg.rotation.y = 0; return; }
    HEVO.done = true; HEVO.pos = null; homObj.s = HEVO.s1; if (fg) fg.rotation.y = 0;
  }
  // (builder 21, the owner: "The animations still seem stiff?"; and on the acts: "I would prefer if the sprites walked to the molecule and interacted with it")
  // THE RIGGED CREATURE. A creature that kitart.js has rigged (AA.rxKit.RIGGED; its figure carries userData.rig2) is moved part by part by AA.rxKit.rigPlay, not
  // slid and scaled whole. The page only says WHEN and WHERE: r21Frame plays 'rest' on a clock of beats, the wrapper round homJump plays 'act' and takes the
  // figure's place from it (a trip on its own feet to the molecule and home), the wrapper round homEvo19 plays 'evo' (the old form tweens into the new one, part by part).
  // R21T: the lengths of a rigged creature's act at pace 2 in ms (the way there, the work, the way home), read by jumpPlan20.
  const R21 = { tb: 0, last: 0, landT: -1e9, glT: -1e9, sig: '', sit: 0, v: new T.Vector3(), mouth: null, act: null, evo: null, err: null }, R21T = { acid: [620, 900, 560], water: [1000, 2100, 900], co2: [1300, 3000, 1300], salt: [1500, 3200, 1400] };
  const r21Fig = () => { const fg = homObj && homObj.grp.children[0]; return fg && fg.userData && fg.userData.rig2 ? fg : null; };
  const r21N = (wx, wy, wz) => { R21.v.set(wx, wy, wz).project(cam); return [(R21.v.x + 1) / 2, (1 - R21.v.y) / 2]; };
  function r21Frame(fg, now) { if (AA.rxScheme && !AA.rxScheme.r21) AA.rxScheme.r21 = R21.report; const K = AA.rxKit, dt = Math.max(0, Math.min(100, now - (R21.last || now))); R21.last = now; R21.tb += dt / kinLen(now); { const d = kinBeat(now) - R21.tb; R21.tb += (d - Math.round(d)) * 0.04; }
    if (!homObj.grp.visible) return; dirty = true; const A = st.homAct, sig = (st.firing ? 'f' : '-') + ((st.queue || []).length);
    if (sig !== R21.sig) { R21.sig = sig; R21.glT = now; } const ga = now - R21.glT, gl = ga < 1600 ? K.RK.pulse(ga, 60, 1150, 220) : 0;
    let sp = null; try { sp = g && g.hom && P.homSpent ? P.homSpent(g) : null; } catch (e) { sp = null; } R21.sit += ((sp ? 1 : 0) - R21.sit) * Math.min(1, dt / 240);
    if (A && A.j && A.j.a20 && R21.act) K.rigPlay(fg, 'act', now - A.t, R21.act);
    else if (R21.evo && !HEVO.done) K.rigPlay(fg, 'evo', now - HEVO.at, R21.evo);
    else K.rigPlay(fg, 'rest', R21.tb, { glance: gl, look: [C0 && C0.x < HOMP.x ? -1 : 1, 0.5], spent: R21.sit, land: now - R21.landT });
    const mp = fg.userData.rig2.parts.mouth || fg.userData.rig2.parts.body; if (mp) { homObj.grp.updateMatrixWorld(true); const w = mp.getWorldPosition(new T.Vector3()); R21.mouth = r21N(w.x, w.y, w.z); } }
  a20Spent = (f0 => function (now) { const fg = r21Fig(); if (!fg) return f0(now); try { r21Frame(fg, now); } catch (e) { R21.err = String(e && e.stack); } })(a20Spent);
  JLIFE.acid = (f0 => function (c, t) { let rg = null; c.traverse(o => { if (!rg && o.userData && o.userData.rig2) rg = o; }); if (!rg) return f0(c, t); AA.rxKit.rigPlay(rg, 'rest', R21.tb + 3.3, { jar: true }); c.rotation.y = 0.15 * Math.sin(t * 0.6); })(JLIFE.acid);
  // the act's place: the trip gives how far along (e), how high (y) and how far it leans in to its food (lunge)
  homJump = (f0 => function (A, now) { const o = f0(A, now), fg = r21Fig(), j = A.j; if (!fg || !j || !j.a20 || !j.r21) return o; R21.landT = A.t + j.W + j.J + j.D + j.B; if (!o) return o;
    const dir = j.perch.x >= HOMP.x ? 1 : -1, c = AA.rxKit.rigPlay(fg, 'act', now - A.t, R21.act = { W: j.W, J: j.J, D: j.D, B: j.B, N: j.N || 3, bites: j.bites, dir, sd: j.sd || 1, hop: j.hop || null, k: j.k }); if (!c) return o;
    const e2 = c.e2 || 0, p2 = j.perch2 || j.perch, sp = e2 >= 1 && j.spot2 ? j.spot2 : j.spot, st0 = c.e >= 1 || now - A.t > j.W + j.J ? { x: j.perch.x + (p2.x - j.perch.x) * e2, z: j.perch.z + (p2.z - j.perch.z) * e2 } : j.perch; if (e2 > 0 && j.sd2) R21.act.sd = e2 >= 0.5 ? j.sd2 : j.sd;
    const lx = sp.x - st0.x, lz = sp.z - st0.z, ll = Math.hypot(lx, lz) || 1, lr = Math.min(1.4, ll * 0.3) * c.lunge;
    o.k = 1 + (j.k - 1) * c.e; o.hx = HOMP.x + (st0.x - HOMP.x) * c.e + lx / ll * lr; o.hz = HOMP.z + (st0.z - HOMP.z) * c.e + lz / ll * lr; o.y = c.y * 0.9 * (homObj.s || 1) * (homObj.h0 || 3) * o.k; o.sx = 1; o.sy = 1; o.rz = 0; o.ry = 0; o.reach = 0;
    A20.cw = { x: o.hx, y: o.y, z: o.hz, k: o.k, sy: 1 }; return o; })(homJump);
  // the molecule is handled: the atom the piece hangs on is tugged toward the mouth and springs back; no other atom moves
  const r21Tug = (q, amt, sx, sy) => { try { if (!center || !center.balls) return; if (!q.r21b) { let best = null, bd = 1e9; const v = new T.Vector3(); center.balls.forEach(b => { b.mesh.getWorldPosition(v); const dd = Math.hypot(v.x - q.x, v.z - 0.35 * v.y - q.z); if (dd < bd) { bd = dd; best = b; } }); if (!best) return; q.r21b = { b: best, p0: best.mesh.position.clone() }; }
    const B = q.r21b, l = Math.hypot(sx, sy) || 1; B.b.mesh.position.set(B.p0.x + sx / l * amt * 0.55, B.p0.y, B.p0.z + sy / l * amt * 0.55);
    /* (builder 22, "the tug of the bitten place visible") the whole molecule is dragged a little toward the mouth with it, and swings back when the piece lets go */ const G = center.group; if (G) { if (!q.r21g) q.r21g = G.position.clone(); G.position.set(q.r21g.x + sx / l * amt * 1.1, q.r21g.y, q.r21g.z + sy / l * amt * 1.1); } dirty = true; } catch (e) { /* the molecule stays */ } };
  // where it stands to handle a piece at A: beside it on the side sd (1: the piece is to its right), its mouth at the piece's height, on a page, off the crease, above the marks strip. It may stand before the molecule's edge, never on the piece
  const r21Stand = (F, k, A, sd, mb) => { const RP = SAFE.R, zm = 5.0 - F.fz1 * k, at = s => ({ x: A.x - s * ((s > 0 ? F.fx1 : -F.fx0) * k + 0.5), z: Math.min(zm, A.z - 0.38 * F.fz0 * k), k, sd: s }), under = { x: A.x - sd * 1.2, z: Math.min(zm, A.z - F.fz0 * k * 0.8 + 0.2), k, sd }, bad = q => q.x + F.fx0 * k < SAFE.L.x0 + 1 || q.x + F.fx1 * k > RP.x1 + 0.3 || (q.x + F.fx0 * k < SAFE.gut.x1 + 0.4 && q.x + F.fx1 * k > SAFE.gut.x0 - 0.4);
    /* of beside it on either side and just below it, the place that covers least of the molecule */ const ov = q => (bad(q) ? 1e6 : 0) + (mb ? Math.max(0, Math.min(q.x + F.fx1 * k, mb.x1) - Math.max(q.x + F.fx0 * k, mb.x0)) * Math.max(0, Math.min(q.z + F.fz1 * k, mb.z1) - Math.max(q.z + F.fz0 * k, mb.z0)) : 0); /* (builder 22, "never standing over the molecule") it may also stand clear of the whole molecule: left of it, right of it, or under it; the place that covers least wins, then the nearest */ const zs = Math.min(zm, A.z - 0.38 * F.fz0 * k), cands = [at(sd), at(-sd), under].concat(mb ? [{ x: mb.x0 - F.fx1 * k - 0.3, z: zs, k, sd: 1 }, { x: mb.x1 - F.fx0 * k + 0.3, z: zs, k, sd: -1 }, { x: A.x - sd * 1.2, z: Math.min(zm, mb.z1 - F.fz0 * k + 0.2), k, sd }, /* behind it: its feet above the molecule's top edge, reaching down */ { x: A.x - sd * 1.4, z: mb.z0 - F.fz1 * k - 0.3, k, sd }, { x: A.x + sd * 1.4, z: mb.z0 - F.fz1 * k - 0.3, k, sd: -sd }] : []); let best = cands[0], bo = 1e9; cands.forEach((q, i) => { const v = ov(q) * 3 + 0.5 * Math.hypot(q.x - A.x, q.z - A.z) + (i ? 0.6 : 0); if (v < bo) { best = q; bo = v; } }); return best; };
  A20ACT.acid = (f0 => function (j, c) { if (!r21Fig()) return f0(j, c);
    /* the pieces that left are still on the molecule's edge when it comes: it takes each in its hands, bites it off and swallows it */
    const gs = A20.gone.filter(q => q.g === g && q.els.some(e => e !== 'H')); let it = gs.filter(q => q.page === g.page); if (!it.length) it = gs; if (!it.length) it = A20.gone.slice(-2); it = it.slice(-2).map(q => Object.assign({}, q)); if (!it.length) it = [{ x: c.mc.x, z: c.mc.z, els: ['C'] }];
    it.sort((p, q) => Math.hypot(p.x - HOMP.x, p.z - HOMP.z) - Math.hypot(q.x - HOMP.x, q.z - HOMP.z)); const A0 = it[0], A1 = it[1], F = c.F, kS = Math.max(1.6, F.k * 0.62), far = A1 && Math.hypot(A1.x - A0.x, A1.z - A0.z) > 3.5; j.r21 = true; if (far) j.D += 400 * paceK(); const D = j.D;
    /* two pieces that lie apart: it hops from the one to the other between the bites */ j.bites = A1 ? (far ? [230 / D, (D - 330) / D] : [0.24, 0.6]) : [0.42]; if (far) j.hop = [360, D - 330 - 200 - 360, 1];
    return { want: { x: A0.x, z: A0.z + 3 }, hitU: (j.bites[A1 ? 1 : 0] * D + 60) / (D - (far ? 400 * paceK() : 0)), dur: 4000, pad: 0.2,
      after(pl) { const s1 = r21Stand(F, kS, A0, A0.x >= c.mc.x ? -1 : 1, c.mb); pl.x = j.perch.x = s1.x; pl.z = j.perch.z = s1.z; pl.k = j.k = kS; j.sd = s1.sd; j.spot = { x: A0.x, z: A0.z }; this.tgt = j.spot; if (far) { const s2 = r21Stand(F, kS, A1, A1.x >= c.mc.x ? -1 : 1, c.mb); j.perch2 = { x: s2.x, z: s2.z }; j.sd2 = s2.sd; j.spot2 = { x: A1.x, z: A1.z }; j.hop[2] = s2.x >= s1.x ? 1 : -1; } j.N = Math.max(3, Math.min(5, Math.round(Math.hypot(pl.x - HOMP.x, pl.z - HOMP.z) / 9))); this.dur = j.D + j.B + 1200; },
      draw(x, a, E) { const lw = 2.4 * E.kk, R = 11 * E.kk, D = j.D, pre = j.W + j.J, p0 = E.S(0, 0), p1 = E.S(10, 6), n0 = r21N(0, 0.05, 0), n1 = r21N(10, 0.05, 6), Wp = (p1[0] - p0[0]) / (n1[0] - n0[0]), Hp = (p1[1] - p0[1]) / (n1[1] - n0[1]);
        const M = R21.mouth && st.homAct && st.homAct.j === j ? (this.lastM = [p0[0] + (R21.mouth[0] - n0[0]) * Wp, p0[1] + (R21.mouth[1] - n0[1]) * Hp]) : this.lastM || E.mouth, N = j.N || 3;
        /* its footprints: two small etched pits where each hop came down, fading */ const LD = AA.rxKit.CLIP.homacid.lands(N); for (let leg = 0; leg < 2; leg++) for (let i = 1; i <= N; i++) { const P1 = leg && j.perch2 ? j.perch2 : j.perch, fr = LD[i - 1], t = leg ? D + j.B * (0.12 + 0.88 * fr) : -j.J * (1 - fr), age = a - t; if (age < 0 || age > 1100 || (!leg && i === N && a < D)) continue; const e = leg ? 1 - fr : fr, q = E.S(HOMP.x + (P1.x - HOMP.x) * e, HOMP.z + (P1.z - HOMP.z) * e), kq = (1 + (j.k - 1) * e) * 4.2 * E.kk; x.globalAlpha = 0.55 * (1 - age / 1100); x.fillStyle = '#2c2f34'; [-1, 1].forEach(s => { x.beginPath(); x.ellipse(q[0] + s * kq, q[1], kq * 0.6, kq * 0.3, 0, 0, 6.2832); x.fill(); }); x.strokeStyle = '#98a80e'; x.lineWidth = lw * 0.6; x.beginPath(); x.ellipse(q[0], q[1], kq * 2.1, kq * 0.75, 0, 0, 6.2832); x.stroke(); x.globalAlpha = 1; }
        it.forEach((q, i) => { const A = E.S(q.x, q.z), xb = a - j.bites[i] * D, tug = a20E((xb + 190) / 110), pu = a20C(xb / 60, 0, 1), e3 = pu * pu * pu, kx = 0.16 * tug * (1 - e3) + e3, px = A[0] + (M[0] - A[0]) * kx, py = A[1] + (M[1] - A[1]) * kx, sc = xb < 60 ? 1 : Math.max(0, 1 - (xb - 60) / 80);
          if (xb < 60) r21Tug(q, tug * (1 - e3), M[0] - A[0], M[1] - A[1]); else if (xb < 520) r21Tug(q, -0.45 * Math.exp(-(xb - 60) / 90) * Math.cos((xb - 60) / 38), M[0] - A[0], M[1] - A[1]); else if (q.r21b && !q.r21d) { q.r21d = 1; r21Tug(q, 0, 1, 0); }
          x.globalAlpha = a20C((a + pre) / 220, 0, 1);
          if (xb > -190 && xb < 60) { /* the bond it is torn from stretches and snaps */ x.strokeStyle = INK; x.lineWidth = lw; x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(px, py); x.stroke(); }
          if (sc > 0) a20Piece(x, px, py, R * sc, q.els, lw, 0.5 * Math.sin(i * 2.1) + 0.5 * tug);
          else if (xb < 480) { /* a few crumbs fall from its mouth as it chews */ const t = (xb - 140) / 340; for (let k = 0; k < 3; k++) if (t > 0) a20Drop(x, M[0] + (k - 1) * 9 * E.kk * (1 + t), M[1] + (14 + 46 * t * t + 6 * k) * E.kk, 3.6 * E.kk * (1 - t), '#d4e21a', lw * 0.7, k); }
          x.globalAlpha = 1; }); } }; })(A20ACT.acid);
  // the evolve: the same figure all the way. It is stood at its new stage at once (the rig holds every stage's parts), shown in its old form, and the clip tweens it over on the beats
  homEvo19 = (f0 => function (now) { if (!r21Fig() || !g) return f0(now); const ev = g.homEvolved, RKK = AA.rxKit.RK;
    if (ev && ev !== HEVO.seen && ev.id === homObj.id && HEVO.done && !HEVO.pend) { HEVO.seen = ev; HEVO.pend = true; }
    if (HEVO.done && !HEVO.pend && homObj.stage && st.mode === 'play' && !st.homAct && !st.firing && homObj.grp.visible) { let hs = null; try { hs = P.homStage(run && run.meta ? run : { meta }, homObj.id); } catch (e) { hs = null; } if (hs && hs.stage > homObj.stage) { HEVO.seen = { id: homObj.id, stage: hs.stage, from: homObj.stage, mult: hs.mult }; HEVO.pend = true; } }
    if (HEVO.pend && !st.homAct) { HEVO.pend = false; const L = Math.max(380, Math.min(700, kinLen(now))), s0 = homObj.s, from = homObj.stage, vis = homObj.grp.visible; homStand(); homObj.grp.visible = vis; if (!r21Fig() || !(homObj.stage > from)) { R21.evo = null; return; }
      HEVO.L = L; HEVO.at = kinNext(now + 420); HEVO.done = false; HEVO.swap = true; R21.evo = { L, from, to: homObj.stage, dir: -1, s0, s1: homObj.s, big: Math.max(1.15, Math.min(2.9, 17 / Math.max(1, homObj.s * (homObj.h0 || 3)))), f: {} }; homObj.s = s0; AA.rxKit.rigPlay(r21Fig(), 'evo', now - HEVO.at, R21.evo); }
    if (HEVO.done) return; const E = R21.evo, fg = r21Fig(); if (!E || !fg) { HEVO.done = true; HEVO.pos = null; return; } dirty = true;
    const a = now - HEVO.at, L = E.L, EV = { x: -19.5, z: 4 }, c = AA.rxKit.rigPlay(fg, 'evo', a, E), Q = HEVO.pos = HEVO.pos || {}, once = (k, f) => { if (!E.f[k]) { E.f[k] = 1; try { f(); } catch (e) { /* no sound */ } } };
    Q.sx = 1; Q.sy = 1; Q.x = HOMP.x + (EV.x - HOMP.x) * c.e; Q.z = HOMP.z + (EV.z - HOMP.z) * c.e; const sz = (E.s0 + (E.s1 - E.s0) * RKK.sm((c.n - 1) / 3.5)) * (1 + (E.big - 1) * c.big); homObj.s = sz; Q.y = c.y * 0.8 * sz * (homObj.h0 || 3);
    if (a >= 0) once('up', () => sfx.drift()); if (c.n >= 0) once('dn', () => sfx.stamp()); for (let b = 1; b <= 4; b++) if (c.n >= b) once('b' + b, () => (b === 4 ? sfx.good() : sfx.feed()));
    if (c.n >= 4.7) once('num', () => { HEVO.num = HEVO.seen && HEVO.seen.mult; HEVO.numT = now; HEVO.numFor = L * 1.7; }); if (c.home != null ? c.home : c.n >= 7.1) once('home', () => { R21.landT = now; sfx.stamp(); });
    if (c.done) { HEVO.done = true; HEVO.pos = null; homObj.s = E.s1; R21.evo = null; } })(homEvo19);
  // (builder 22) THE NEXT THREE, rigged from their pushed drawings (kitart AUTO, autoClip). Each goes to where its work is by its own gait and does it there with its body:
  // nothing is thrown or sprayed from the bench. A job about the reagents is done at the cards, and then it goes on to the molecule so the yield lands there (j.hop, perch2).
  ['water', 'co2', 'salt'].forEach(k => { JLIFE[k] = (f0 => function (c, t) { let rg = null; c.traverse(o => { if (!rg && o.userData && o.userData.rig2) rg = o; }); if (!rg) return f0 && f0(c, t); AA.rxKit.rigPlay(rg, 'rest', R21.tb + 3.3, { jar: true }); c.rotation.y = 0.15 * Math.sin(t * 0.6); })(JLIFE[k]); });
  const r22Card = (E, cd) => { const B = E.S(cd.x, cd.z); return { B, w: Math.abs(E.S(cd.x + BT.cw / 2, cd.z)[0] - E.S(cd.x - BT.cw / 2, cd.z)[0]), h: Math.abs(E.S(cd.x, cd.z + BT.ch / 2)[1] - E.S(cd.x, cd.z - BT.ch / 2)[1]) }; };
  // from the cards on to the molecule: it stands at the molecule's right end, facing it
  const r22Mol = (j, c, F, k, at, len) => { const A = { x: c.mb.x1, z: c.mc.z }, s2 = r21Stand(F, k, A, -1, c.mb); j.perch2 = { x: s2.x, z: s2.z }; j.sd2 = s2.sd; j.spot2 = A; j.hop = [at, len, s2.x >= j.perch.x ? 1 : -1]; };
  A20ACT.water = (f0 => function (j, c) { if (!r21Fig()) return f0(j, c);
    /* WATER: it flows to the molecule, puts an arm of itself round each water that left and draws it in, wrings, then goes flat and washes over the molecule and draws back into itself */
    let it = A20.gone.filter(q => q.g === g && q.els.indexOf('O') >= 0); if (!it.length) it = A20.gone.slice(-2); it = it.slice(-3).map(q => Object.assign({}, q)); if (!it.length) it = [{ x: c.mc.x, z: c.mc.z - 2.5, els: ['O', 'H', 'H'] }];
    const F = c.F, kS = Math.max(1.2, F.k * 0.6), A0 = it[0]; j.r21 = true; j.bites = [0.3];
    return { want: { x: A0.x, z: A0.z + 3 }, hitU: 0.8, dur: j.D + 1500, pad: 0.2,
      after(pl) { const s1 = r21Stand(F, kS, A0, A0.x >= c.mc.x ? -1 : 1, c.mb); pl.x = j.perch.x = s1.x; pl.z = j.perch.z = s1.z; pl.k = j.k = kS; j.sd = s1.sd; j.spot = { x: c.mc.x, z: c.mc.z }; this.tgt = j.spot; },
      draw(x, a, E) { const D = j.D, lw = 2.4 * E.kk, p = a / D, live = st.homAct && st.homAct.j === j, cp = (live && E.cp) || this.lastC || E.S(j.perch.x, j.perch.z), hand = [cp[0] + j.sd * E.ch * 0.3, cp[1] - E.ch * 0.45], BL = '#5b92e0', ED = 'rgba(40,84,170,0.9)'; if (live && E.cp) this.lastC = cp;
        /* the wet it leaves where it flowed */ for (let i = 0; i <= 12; i++) { const fr = i / 12, age = a + j.J * (1 - fr); if (age < 0 || age > 1700) continue; const s = E.S(HOMP.x + (j.perch.x - HOMP.x) * fr, HOMP.z + (j.perch.z - HOMP.z) * fr), r = (15 + 9 * hash('wt' + i)) * E.kk; x.globalAlpha = 0.34 * (1 - age / 1700); a20Blob(x, s[0], s[1], r * 1.8, r * 0.7, i, 0, 14); x.fillStyle = 'rgba(64,124,214,0.55)'; x.fill(); x.globalAlpha = 1; }
        if (a < 0) return;
        /* the flood: from its feet out over the molecule, and back into it */ const fu = a20E((p - 0.52) / 0.3), fd = a20E((a - D) / 800); if (fu > 0 && fd < 1) { const RP = SAFE.R, q0 = E.S(RP.x0 + 0.4, RP.z0 + 0.4), q1 = E.S(RP.x1 - 0.2, RP.z0 + 0.4), q2 = E.S(RP.x1 - 0.2, 5.1), q3 = E.S(RP.x0 + 0.4, 5.1), k = fu * (1 - fd), cx = j.perch.x + (c.mc.x - j.perch.x) * k, cz = j.perch.z + (c.mc.z - j.perch.z) * k, rx = 1 + ((c.mb.x1 - c.mb.x0) / 2 + 1.6) * k, rz = 0.7 + ((c.mb.z1 - c.mb.z0) / 2 + 1.3) * k, C = E.S(cx, cz), Rx = Math.abs(E.S(cx + rx, cz)[0] - C[0]), Rz = Math.abs(E.S(cx, cz + rz)[1] - C[1]), ph = a / 240;
          x.save(); x.beginPath(); x.moveTo(q0[0], q0[1]); x.lineTo(q1[0], q1[1]); x.lineTo(q2[0], q2[1]); x.lineTo(q3[0], q3[1]); x.closePath(); x.clip(); a20Blob(x, C[0], C[1], Rx, Rz, 0.3, ph, 44); x.fillStyle = 'rgba(64,124,214,0.3)'; x.fill(); x.strokeStyle = ED; x.lineWidth = lw * 1.25; x.stroke(); a20Blob(x, C[0] + 3 * E.kk, C[1] + 3 * E.kk, Rx * 0.9, Rz * 0.86, 0.3, ph - 0.5, 44); x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = lw * 0.8; x.setLineDash([26 * E.kk, 34 * E.kk]); x.lineDashOffset = -a / 12; x.stroke(); x.setLineDash([]); x.restore(); E.cut(); }
        it.forEach((q, i) => { const A = E.S(q.x, q.z), t0 = (0.02 + 0.05 * i) * D, u1 = a20E((a - t0) / (0.13 * D)), u2 = a20E((a - t0 - 0.2 * D) / (0.2 * D)); if (u1 <= 0 || u2 >= 1) { if (u1 <= 0) a20Piece(x, A[0], A[1], 10 * E.kk, q.els, lw, 0.4 * i); return; } const px = A[0] + (hand[0] - A[0]) * u2, py = A[1] + (hand[1] - A[1]) * u2;
          a20Stream(x, hand, [px, py], -30 * E.kk * (1 - u2), 0, u1, 9 * E.kk, BL, lw * 0.7, a / 60); a20Piece(x, px, py, 10 * E.kk * (1 - 0.5 * u2), q.els, lw, 0.4 * i + (u2 > 0 ? a / 110 : 0));
          if (u1 >= 0.95) { x.globalAlpha = 0.6; a20Blob(x, px, py, 21 * E.kk * (1 - 0.5 * u2), 17 * E.kk * (1 - 0.5 * u2), i, a / 120, 16); x.fillStyle = 'rgba(91,146,224,0.6)'; x.fill(); x.globalAlpha = 1; x.strokeStyle = ED; x.lineWidth = lw; x.stroke(); } });
        /* wrung: drops squeezed out under its hands */ if (p > 0.24 && p < 0.52) for (let k = 0; k < 5; k++) { const t = ((a + k * 70) % 330) / 330; a20Drop(x, hand[0] + (k - 2) * 8 * E.kk, hand[1] + E.ch * 0.4 * t * t, 4.5 * E.kk * (1 - 0.5 * t), BL, lw * 0.7, 0); } } }; })(A20ACT.water);
  A20ACT.co2 = (f0 => function (j, c) { if (!r21Fig()) return f0(j, c);
    /* DRY ICE: it glides to the cards that were never touched and settles on them; frost creeps over each from where its body lies; then it drifts to the molecule and breathes on it from a hand away */
    let cs = c.cards.filter(q => !g.trail.some(t => !t.free && !t.wasted && !t.bank && t.id === q.id && t.hits > 0)); if (!cs.length) cs = c.cards; cs = cs.slice(0, 3); if (!cs.length) return null;
    const F = c.F, kS = Math.max(1.5, Math.min(2.2, F.k * 0.5)), mid = cs[Math.floor(cs.length / 2)], D = j.D; j.r21 = true; j.bites = [0.9];
    return { want: { x: mid.x, z: mid.z }, hitU: 0.88, dur: D + 2600, tgt: mid,
      after(pl) { /* it lies against the cards' near edge (a card is drawn over whatever stands on it) */ pl.x = j.perch.x = mid.x - BT.cw / 2 - F.fx1 * kS * 0.75 - 0.5; pl.z = j.perch.z = mid.z - 0.3 * F.fz0 * kS; pl.k = j.k = kS; j.sd = 1; j.spot = { x: mid.x, z: mid.z }; r22Mol(j, c, F, kS, 0.44 * D, 0.26 * D); },
      draw(x, a, E) { const lw = 2.2 * E.kk, fo = a20C((D + 2600 - a) / 600, 0, 1), live = st.homAct && st.homAct.j === j, P0 = E.S(j.perch.x, j.perch.z - 1.2), p = a / D;
        /* white fog on a white page: the cold it lies in is washed in under it, so it can be seen */ if (live && E.cp) { x.globalAlpha = 0.5; a20Blob(x, E.cp[0], E.cp[1] - E.ch * 0.12, E.ch * 0.95, E.ch * 0.34, 1.7, a / 500, 30); x.fillStyle = '#b9cbd8'; x.fill(); x.globalAlpha = 0.8; x.strokeStyle = '#5f9fc8'; x.lineWidth = lw * 0.7; x.setLineDash([14 * E.kk, 12 * E.kk]); x.lineDashOffset = a / 40; x.stroke(); x.setLineDash([]); x.globalAlpha = 1; } if (a < 0) return;
        cs.forEach((cd, ci) => { const K = r22Card(E, cd), B = K.B, w = K.w, h = K.h, gk = a20E((a - (0.05 + 0.07 * ci) * D) / (0.32 * D)); if (gk <= 0) return; const O = [a20C(P0[0], B[0] - w / 2, B[0] + w / 2), a20C(P0[1], B[1] - h / 2, B[1] + h / 2)], an0 = Math.hypot(B[0] - O[0], B[1] - O[1]) < 4 ? -1.5708 : Math.atan2(B[1] - O[1], B[0] - O[0]);
          x.save(); x.beginPath(); x.rect(B[0] - w / 2, B[1] - h / 2, w, h); x.clip(); x.globalAlpha = 0.6 * fo * gk; a20Blob(x, O[0], O[1], w * 1.1 * gk, h * 1.1 * gk, ci + 0.5, 0, 26); x.fillStyle = '#eaf6ff'; x.fill(); x.globalAlpha = fo;
          for (let f = 0; f < 7; f++) { const an = an0 + (f - 3) * 0.42, L = w * (0.7 + 0.5 * hash('fl' + f + ci)) * gk; [['#ffffff', lw * 2.6], ['#5f9fc8', lw]].forEach(sty => { x.strokeStyle = sty[0]; x.lineWidth = sty[1]; x.beginPath(); x.moveTo(O[0], O[1]); x.lineTo(O[0] + Math.cos(an) * L, O[1] + Math.sin(an) * L); for (let b = 1; b < 7; b++) { const bx = O[0] + Math.cos(an) * L * b / 7, by = O[1] + Math.sin(an) * L * b / 7, bl = h * 0.12 * (1 - b / 9) * gk; x.moveTo(bx, by); x.lineTo(bx + Math.cos(an + 0.9) * bl, by + Math.sin(an + 0.9) * bl); x.moveTo(bx, by); x.lineTo(bx + Math.cos(an - 0.9) * bl, by + Math.sin(an - 0.9) * bl); } x.stroke(); }); } x.restore();
          for (let i = 0; i < 3; i++) { const tt = ((a + i * 300 + ci * 130) % 1000) / 1000; if (gk > 0.6 && tt < 0.4) { x.globalAlpha = fo; a20Glint(x, B[0] + (hash('cx' + i + ci) - 0.5) * w * 0.8, B[1] + (hash('cy' + i + ci) - 0.5) * h * 0.7, 10 * E.kk * Math.sin(Math.PI * tt / 0.4), lw * 0.6); } } });
        /* at the molecule: the breath leaves its mouth and lies on the molecule's near end as frost */ const bk = a20E((p - 0.84) / 0.14); if (bk > 0 && j.spot2) { const Tg = E.S(j.spot2.x - 1.2, j.spot2.z), M = live && E.cp ? [E.cp[0] - E.ch * 0.2, E.cp[1] - E.ch * 0.5] : this.lastM2 || Tg; if (live) this.lastM2 = M; x.globalAlpha = 0.6 * fo * bk; a20Blob(x, Tg[0], Tg[1], 70 * E.kk * bk, 44 * E.kk * bk, 3.3, a / 400, 26); x.fillStyle = '#eaf6ff'; x.fill(); x.strokeStyle = '#5f9fc8'; x.lineWidth = lw * 0.8; x.stroke(); x.globalAlpha = 1;
          if (p < 1.05) for (let i = 0; i < 6; i++) { const tt = ((a + i * 80) % 480) / 480; a20Puff(x, M[0] + (Tg[0] - M[0]) * tt, M[1] + (Tg[1] - M[1]) * tt + (i % 2 ? 7 : -7) * E.kk, (8 + 20 * tt) * E.kk, i, a / 200, '#f4f9fc', '#5f9fc8', lw * 0.8, 0.85 * (1 - tt * 0.6) * fo); }
          for (let i = 0; i < 3; i++) { const tt = ((a + i * 310) % 900) / 900; if (bk > 0.7 && tt < 0.4) a20Glint(x, Tg[0] + (hash('mx' + i) - 0.5) * 110 * E.kk, Tg[1] + (hash('my' + i) - 0.5) * 60 * E.kk, 11 * E.kk * Math.sin(Math.PI * tt / 0.4), lw * 0.6); } } x.globalAlpha = 1; } }; })(A20ACT.co2);
  A20ACT.salt = (f0 => function (j, c) { if (!r21Fig()) return f0(j, c);
    /* SALT: it walks stiff-legged to the card of the reagent played again and packs it in crystal with its hands, one pat a facet; then it walks on to the molecule and sets one crystal down by it */
    const rep = c.line.find(q => c.cnt[q.id] > 1) || c.line[0], cd = (rep && a20Card(rep.id)) || c.cards[0]; if (!cd) return null; const F = c.F, kS = Math.max(1.45, Math.min(2.2, F.k * 0.5)), D = j.D, N = 8; j.r21 = true; j.bites = []; for (let i = 0; i < N; i++) j.bites.push(0.05 + 0.5 * i / (N - 1)); j.bites.push(0.92);
    return { want: { x: cd.x, z: cd.z }, hitU: 0.92, dur: D + 2400, tgt: cd,
      after(pl) { pl.x = j.perch.x = cd.x - BT.cw / 2 - F.fx1 * kS * 0.55; pl.z = j.perch.z = cd.z - 0.42 * F.fz0 * kS; pl.k = j.k = kS; j.sd = 1; j.spot = { x: cd.x, z: cd.z }; r22Mol(j, c, F, kS, 0.6 * D, 0.26 * D); },
      draw(x, a, E) { const lw = 2.3 * E.kk, fo = a20C((D + 2400 - a) / 500, 0, 1), K = r22Card(E, cd), B = K.B, w = K.w, h = K.h; x.globalAlpha = fo;
        /* where each stiff step came down: two short strokes and a grain */ for (let leg = 0; leg < 3; leg++) for (let i = 1; i <= 8; i++) { const fr = i / 8, t = leg === 0 ? -j.J * (1 - fr) - 0.4 * j.J / 8 : leg === 1 ? j.hop[0] + j.hop[1] * (fr - 0.4 / 8) : D + j.B * (fr - 0.4 / 8), age = a - t; if (age < 0 || age > 900 || !j.perch2) continue; const P0 = leg === 0 ? HOMP : leg === 1 ? j.perch : j.perch2, P1 = leg === 0 ? j.perch : leg === 1 ? j.perch2 : HOMP, s = E.S(P0.x + (P1.x - P0.x) * fr, P0.z + (P1.z - P0.z) * fr), sd = i % 2 ? 1 : -1, r = 9 * E.kk; x.globalAlpha = fo * (1 - age / 900); x.strokeStyle = INK; x.lineWidth = lw * 0.7; x.beginPath(); x.moveTo(s[0] + sd * r, s[1] - r * 0.5); x.lineTo(s[0] + sd * r * 1.8, s[1] - r); x.moveTo(s[0] + sd * r, s[1] + r * 0.2); x.lineTo(s[0] + sd * r * 1.9, s[1] + r * 0.3); x.stroke(); a20Cube(x, s[0] + sd * r * 0.3, s[1] + r * 0.4, 3.2 * E.kk, i, lw * 0.5); } x.globalAlpha = fo;
        if (a < 0) return; for (let i = 0; i < N; i++) { const t = a - j.bites[i] * D; if (t < 0) continue; const col = i % 4, row = Math.floor(i / 4), pop = a20E(t / 110) * (1 + 0.3 * Math.exp(-t / 100) * Math.cos(t / 28)), r = h * 0.27; a20Cube(x, B[0] - w * 0.38 + col * w * 0.25 + (row ? w * 0.04 : 0), B[1] + (row ? 0.2 : -0.2) * h + (hash('sy' + i) - 0.5) * h * 0.08, r * pop, (hash('sa' + i) - 0.5) * 0.5, lw); if (t < 240) a20Glint(x, B[0] - w * 0.38 + col * w * 0.25, B[1] + (row ? 0.2 : -0.2) * h - r, 12 * E.kk * Math.sin(Math.PI * t / 240), lw * 0.6); }
        /* the crystal it sets down by the molecule */ const td = a - j.bites[N] * D; if (td > 0 && j.spot2) { const s = E.S(j.spot2.x + 0.9, j.spot2.z + 0.2), pop = a20E(td / 120) * (1 + 0.35 * Math.exp(-td / 110) * Math.cos(td / 30)); a20Cube(x, s[0], s[1], 17 * E.kk * pop, 0.2, lw); for (let i = 0; i < 3; i++) { const tt = ((td + i * 240) % 800) / 800; if (tt < 0.45) a20Glint(x, s[0] + (i - 1) * 16 * E.kk, s[1] - 18 * E.kk - 6 * i * E.kk, 11 * E.kk * Math.sin(Math.PI * tt / 0.45), lw * 0.6); } } x.globalAlpha = 1; } }; })(A20ACT.salt);
  // (builder 22, "bigger on the bench so the face reads") a rigged creature stands half as large again on the bench, up to what its place allows
  homStand = (f0 => function () { f0(); if (r21Fig() && homObj && homObj.s) homObj.s = Math.min(homObj.s * 1.5, BNZ.hom.s * 1.45); })(homStand);
  R21.report = () => ({ err: R21.err, tb: +R21.tb.toFixed(2), rig: !!r21Fig(), evo: R21.evo ? { from: R21.evo.from, to: R21.evo.to } : null, act: R21.act, a20: A20.err || null, hevo: HEVO.err || null });
            // ==== S26 BEGIN
  // (builder 26) THE WATER SPIRIT ON THE PAGE. kitart's spirit (AA.rxKit.spiritOn; a figure whose rig2.spirit is set) is played by the same three wrappers as
  // every rig (r21Frame, homJump, homEvo19): the page says when and where. Its act is its own: it sinks into its pool and flows to the molecule as a puddle
  // (the wet it leaves dries), rises, reaches an arm of water to each water that left and draws it into its body, lays its hand on the molecule and a thin
  // film runs ONLY along the double bonds that change (the pairs of the spot the rules gave doHom; the molecule changes as the film has run), then it turns
  // its back and flows home. Lengths at pace 2 in S26.T.
  const S26 = { sp: null, spT: 0, old: R21T.water, T: [1300, 5400, 2100] };
  const s26Fig = () => { const fg = r21Fig(); return fg && fg.userData.rig2.spirit ? fg.userData.rig2.sp : null; };
  doHom = (f0 => function (it) { S26.sp = it && it.sp ? it.sp : null; S26.spT = performance.now(); return f0(it); })(doHom);
  jumpPlan = (f0 => function (id, to) { if (id === 'water') R21T.water = s26Fig() ? S26.T : S26.old; return f0(id, to); })(jumpPlan);
  A20ACT.water = (f0 => function (j, c) { const SP = s26Fig(); if (!SP) return f0(j, c);
    const v = new T.Vector3(), mb = c.mb, mc = c.mc, F = c.F, kS = Math.max(1.55, F.k * 0.8), HIT = 0.7, HAND = 0.655;
    let it = A20.gone.filter(q => q.g === g && (q.kind === 'water' || (q.els.indexOf('O') >= 0 && q.els.length <= 3 && q.els.filter(e => e !== 'H').length === 1))); it = it.slice(-3).map(q => Object.assign({}, q));
    let pairs = S26.sp && performance.now() - S26.spT < 800 && S26.sp.pairs ? S26.sp.pairs : null; if (!pairs) { try { const s = P.HOMS.water.spots(g.m)[0]; pairs = s ? s.pairs : []; } catch (e) { pairs = []; } }
    const ballAt = a => { const b = center && center.balls && center.balls.get(a); if (!b) return null; b.mesh.getWorldPosition(v); return { x: v.x, y: v.y, z: v.z }; }, bonds = pairs.map(p => [ballAt(p[0]), ballAt(p[1])]).filter(p => p[0] && p[1]);
    const w26 = { T: [], H: null, hitU: HIT, hand: HAND, bonds, n: it.length }; j.r21 = true; j.bites = Object.assign([0.3], { w26 });
    try { Object.defineProperty(j, 'rest', { get: () => 0.15 * j.D, set() {}, configurable: true }); } catch (e) { /* the page's own wait */ }
    return { want: { x: mc.x, z: mc.z + 3 }, hitU: HIT, dur: j.D + j.B + 2600, pad: 0.2,
      after(pl) { let A0 = { x: mc.x, z: mc.z }; if (bonds.length) { let bd = 1e9; bonds.forEach(b => b.forEach(q => { const d = Math.hypot(q.x - HOMP.x, q.z - HOMP.z) + 2 * Math.min(q.x - mb.x0, mb.x1 - q.x); if (d < bd) { bd = d; A0 = { x: q.x, z: q.z - 0.35 * q.y }; } })); }
        const s1 = r21Stand(F, kS, A0, A0.x >= mc.x ? -1 : 1, mb); pl.x = j.perch.x = s1.x; pl.z = j.perch.z = s1.z; pl.k = j.k = kS; j.sd = s1.sd; j.spot = { x: A0.x, z: A0.z }; this.tgt = j.spot;
        let H = null, hd = 1e9; bonds.forEach((b, bi) => b.forEach((q, e) => { const d = Math.hypot(q.x - s1.x, q.z - s1.z); if (d < hd) { hd = d; H = { x: q.x, y: q.y, z: q.z, sx: q.x >= s1.x ? 1 : -1, bi, e }; } })); if (!H) H = { x: A0.x, y: 0.5, z: A0.z, sx: A0.x >= s1.x ? 1 : -1 }; w26.H = H;
        it.sort((p, q) => Math.hypot(p.x - s1.x, p.z - s1.z) - Math.hypot(q.x - s1.x, q.z - s1.z)); w26.T = it.map(q => ({ x: q.x, y: 0.5, z: q.z, sx: q.x >= s1.x ? 1 : -1 })); },
      draw(x, a, E) { const D = j.D, B = j.B, lw = 2.4 * E.kk, p = a / D, live = st.homAct && st.homAct.j === j, SQ = s26Fig() || SP, p0 = E.S(0, 0), p1 = E.S(10, 6), n0 = r21N(0, 0.05, 0), n1 = r21N(10, 0.05, 6), Wp = (p1[0] - p0[0]) / (n1[0] - n0[0]), Hp = (p1[1] - p0[1]) / (n1[1] - n0[1]);
        const W3 = q => { const n = r21N(q.x, q.y, q.z); return [p0[0] + (n[0] - n0[0]) * Wp, p0[1] + (n[1] - n0[1]) * Hp]; }, hand = live ? (this.lh = W3(SQ.handW)) : this.lh || E.S(j.perch.x, j.perch.z), body = live ? (this.lb = W3(SQ.bodyW)) : this.lb || hand, BL = 'rgba(70,130,220,0.6)';
        /* the wet it leaves where it flowed, drying: on the way out and on the way home (builder 27: the scene's own wet marks instead) */ for (let leg = S26.b27 ? 2 : 0; leg < 2; leg++) for (let i = 1; i <= 9; i++) { const fr = i / 10, age = leg ? a - D - B * (0.14 + 0.72 * (1 - fr)) - 520 : a + j.J * (1 - fr) - 420; if (age < 0 || age > 2600) continue; const s = E.S(HOMP.x + (j.perch.x - HOMP.x) * fr, HOMP.z + (j.perch.z - HOMP.z) * fr), dry = age / 2600, r = (13 + 7 * hash('wt' + i)) * E.kk * (1 + (j.k - 1) * fr) * (1 - 0.5 * dry); x.globalAlpha = 0.2 * (1 - dry) * (1 - dry); a20Blob(x, s[0] + (hash('wx' + i) - 0.5) * r, s[1], r * 1.5, r * 0.55, i + leg * 20, 0, 14); x.fillStyle = 'rgba(64,118,200,0.7)'; x.fill(); x.globalAlpha = 0.5 * (1 - dry); x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = lw * 0.5; x.beginPath(); x.ellipse(s[0] - r * 0.3, s[1] - r * 0.1, r * 0.5, r * 0.14, 0, 3.4, 5.6); x.stroke(); x.globalAlpha = 1; }
        if (a < -250) return; const n = w26.T.length, g0 = 0.17, gw = (HIT - 0.08 - g0) / Math.max(1, n);
        /* each water that left: where it left until the arm comes, then in the hand, then into the body */ it.forEach((q, i) => { const A = E.S(q.x, q.z), u = (p - g0 - i * gw) / gw, bob = 2.5 * E.kk * Math.sin(a / 260 + i * 2); x.globalAlpha = a20C((a + 250) / 250, 0, 1);
          if (S26.b28) { if (u < 0.47) { x.globalAlpha *= 1 - a20C((u - 0.36) / 0.1, 0, 1); a20Piece(x, A[0], A[1] + bob, 10 * E.kk, q.els, lw, 0.4 * i); } x.globalAlpha = 1; return; } if (u < 0.3) { a20Piece(x, A[0], A[1] + bob, 10 * E.kk, q.els, lw, 0.4 * i); x.globalAlpha = 1; return; } if (u >= 0.97) { x.globalAlpha = 1; return; }
          const k1 = a20E((u - 0.3) / 0.14), k2 = a20E((u - 0.78) / 0.17), hx = A[0] + (hand[0] - A[0]) * k1, hy = A[1] + (hand[1] - A[1]) * k1, px = hx + (body[0] - hx) * k2, py = hy + (body[1] - hy) * k2, sc = 1 - 0.75 * k2;
          x.globalAlpha = 0.65 * (1 - k2); a20Blob(x, px, py, 19 * E.kk * sc, 16 * E.kk * sc, i, a / 130, 16); x.fillStyle = 'rgba(120,170,235,0.75)'; x.fill(); x.strokeStyle = 'rgba(40,84,170,0.9)'; x.lineWidth = lw * 0.8; x.stroke(); x.globalAlpha = 1 - k2 * k2; a20Piece(x, px, py, 10 * E.kk * sc, q.els, lw, 0.4 * i + a / 160 * k1); x.globalAlpha = 1; });
        /* its hand on the molecule: a ring where it lands, and the film that runs along the double bonds that change, and nowhere else */ const th = HAND * D, hb = a - th; if (hb < 0) return; const H = w26.H, HP = H ? W3(H) : hand;
        if (hb < 620 && !S26.b28) { const k = hb / 620; x.globalAlpha = 0.8 * (1 - k); x.strokeStyle = BL; x.lineWidth = lw * 1.4 * (1 - k) + 1; x.beginPath(); x.ellipse(HP[0], HP[1], (8 + 34 * a20E(k)) * E.kk, (5 + 20 * a20E(k)) * E.kk, 0, 0, 6.2832); x.stroke(); x.globalAlpha = 1; }
        const fd = a20E((hb - 0.1 * D - 300) / 520); if (fd >= 1) return;
        if (!S26.b27) bonds.forEach((b, bi) => { let A = W3(b[0]), Bq = W3(b[1]); if (Math.hypot(Bq[0] - HP[0], Bq[1] - HP[1]) < Math.hypot(A[0] - HP[0], A[1] - HP[1])) { const t = A; A = Bq; Bq = t; } const fu = a20E((hb - 60 * bi) / (0.055 * D)); if (fu <= 0) return; const ex = A[0] + (Bq[0] - A[0]) * fu, ey = A[1] + (Bq[1] - A[1]) * fu, wv = 1 + 0.15 * Math.sin(a / 70 + bi);
          x.globalAlpha = (1 - fd) * 0.8; x.strokeStyle = 'rgba(64,124,214,0.75)'; x.lineWidth = lw * 4.6 * wv; x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(ex, ey); x.stroke(); x.strokeStyle = 'rgba(150,196,246,0.9)'; x.lineWidth = lw * 2.4; x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(ex, ey); x.stroke();
          x.strokeStyle = 'rgba(255,255,255,0.95)'; x.lineWidth = lw * 0.9; x.setLineDash([9 * E.kk, 11 * E.kk]); x.lineDashOffset = -a / 16; x.beginPath(); x.moveTo(A[0], A[1]); x.lineTo(ex, ey); x.stroke(); x.setLineDash([]);
          if (fu < 1) { x.globalAlpha = 1 - fd; a20Drop(x, ex, ey, 5.5 * E.kk, '#8fbdf4', lw * 0.7, Math.atan2(Bq[1] - A[1], Bq[0] - A[0]) + 1.57); } x.globalAlpha = 1; }); } }; })(A20ACT.water);
  /* on the bench it keeps its own proportions from stage to stage (a newborn is small, the elder fills the row) and its raised arm stays on the screen */
  homStand = (f0 => function () { f0(); const SP = s26Fig(); if (SP && homObj) homObj.s = [3.3, 4.5, 6.4, 7.0, 6.9][SP.st - 1] / SP.G.H; })(homStand);
  if (AA.rxScheme) AA.rxScheme.s26 = () => ({ fig: !!s26Fig(), err: (AA.rxKit && AA.rxKit.spiritErr) || null, r21: R21.err, a20: A20.err || null, stage: homObj && homObj.stage, s: homObj && homObj.s });
  // ==== S26 END
          // ==== S27 BEGIN
  // (builder 27) WATER BELONGS TO THE SCENE. The spirit is a body in the page's own space, so this block gives it what every bench thing has and
  // lets the scene answer it: it stands ON its surface (the bench is 0.25 under the page; it rides up as it crosses the book's edge, and the edge
  // hides the part of its pool still below), a soft contact shadow and a short lamp shadow made as the cup's are (softShadow, down and right),
  // the surface it flowed over is WET (flat marks in the scene under the lamp: wood darkens with a sheen, paper darkens with a tide line; they
  // dry from the edges in) with beads it shed, a damp ring at home, the lamp's light through it as a small caustic, and the atoms its hand of
  // water lands on dip and spring back with a wet film on them and on their bonds. No dust at either end. S27.on = false gives builder 26 back.
  const S27 = { on: !!BENCHV && !!SHP && !(AA.rxKit && AA.rxKit.belong27 === false) && !/[?&]b27=0/.test(String(root.location && root.location.search)), wet: [], wi: 0, last: null, job: null, np: false, v: new T.Vector3(), err: null };
  S26.b27 = S27.on; if (S27.on) S26.T = [1300, 5400, 2700];
  const s27K = (x, z, r) => { const d = Math.min(x - (SHP.x0 - 1.1), SHP.x1 + 1.1 - x, z + 23, SHP.z1 + 1 - z), u = Math.max(0, Math.min(1, (d + 0.35 * r) / (0.9 * r + 0.01))); return u * u * (3 - 2 * u); };
  const s27Tex = kind => { const c = canvasTex(256, 256), x = c.x, blob = (R, sd) => { x.beginPath(); for (let i = 0; i <= 48; i++) { const a = i / 48 * 6.2832, r = R * (1 + 0.07 * Math.sin(3 * a + sd) + 0.045 * Math.sin(7 * a + 2 * sd)); x[i ? 'lineTo' : 'moveTo'](128 + r * Math.cos(a), 128 + r * Math.sin(a)); } x.closePath(); };
    if (kind === 'paper') { x.shadowColor = 'rgba(70,58,40,0.5)'; x.shadowBlur = 5; x.fillStyle = 'rgba(86,74,54,0.2)'; blob(104, 1); x.fill(); x.shadowBlur = 0; x.strokeStyle = 'rgba(74,60,42,0.42)'; x.lineWidth = 2.6; blob(104, 1); x.stroke(); x.strokeStyle = 'rgba(255,252,240,0.4)'; x.lineWidth = 3; blob(97, 1); x.stroke(); /* the paper cockles: two soft ridges */ x.strokeStyle = 'rgba(60,50,36,0.1)'; x.lineWidth = 9; x.beginPath(); x.arc(110, 150, 60, 3.6, 5.4); x.stroke(); x.beginPath(); x.arc(150, 96, 52, 0.5, 2.2); x.stroke(); }
    else if (kind === 'wood') { x.shadowColor = 'rgba(20,10,4,0.6)'; x.shadowBlur = 10; x.fillStyle = 'rgba(24,13,5,0.36)'; blob(100, 2.2); x.fill(); x.shadowBlur = 6; x.shadowColor = 'rgba(255,236,200,0.8)'; x.strokeStyle = 'rgba(255,238,206,0.3)'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.ellipse(118, 112, 62, 44, -0.3, 3.5, 4.9); x.stroke(); x.lineWidth = 3; x.beginPath(); x.ellipse(140, 150, 50, 30, -0.3, 0.3, 1.0); x.stroke(); }
    else if (kind === 'bead') { [[80, 90, 30], [170, 120, 22], [120, 180, 16]].forEach(q => { x.shadowColor = 'rgba(0,0,0,0.5)'; x.shadowBlur = 8; x.shadowOffsetX = 4; x.shadowOffsetY = 4; x.fillStyle = 'rgba(96,140,186,0.62)'; x.beginPath(); x.arc(q[0], q[1], q[2], 0, 6.2832); x.fill(); x.shadowColor = 'transparent'; x.strokeStyle = 'rgba(34,37,44,0.75)'; x.lineWidth = 2.5; x.stroke(); x.fillStyle = 'rgba(255,255,255,0.9)'; x.beginPath(); x.ellipse(q[0] - q[2] * 0.35, q[1] - q[2] * 0.38, q[2] * 0.26, q[2] * 0.17, -0.6, 0, 6.2832); x.fill(); }); }
    else if (kind === 'sh') { const g2 = x.createRadialGradient(128, 128, 6, 128, 128, 124); g2.addColorStop(0, 'rgba(0,0,0,0.5)'); g2.addColorStop(0.55, 'rgba(0,0,0,0.2)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g2; x.fillRect(0, 0, 256, 256); }
    else if (kind === 'ring') { x.shadowColor = 'rgba(20,10,4,0.5)'; x.shadowBlur = 8; x.strokeStyle = 'rgba(24,13,5,0.3)'; x.lineWidth = 16; blob(98, 0.6); x.stroke(); }
    else { /* the lamp's light through the water */ x.lineCap = 'round'; x.shadowColor = 'rgba(255,244,214,1)'; x.shadowBlur = 12; x.strokeStyle = 'rgba(255,246,222,0.85)'; [[100, 120, 58, 0.4, 2.2, 5], [150, 140, 46, 2.6, 4.6, 4], [128, 108, 34, 4.2, 6.4, 3.5], [132, 150, 70, 5.2, 6.6, 3]].forEach(q => { x.lineWidth = q[5]; x.beginPath(); x.arc(q[0], q[1], q[2], q[3], q[4]); x.stroke(); }); }
    c.t.needsUpdate = true; return c.t; };
  const s27Init = () => { const fm = (tex, ro, add) => { const m = flatMesh(1, 1, tex, 0); m.renderOrder = ro; m.visible = false; m.castShadow = false; m.receiveShadow = false; if (add) m.material.blending = T.AdditiveBlending; scene.add(m); return m; };
    S27.tx = { paper: s27Tex('paper'), wood: s27Tex('wood'), bead: s27Tex('bead') }; for (let i = 0; i < 30; i++) S27.wet.push({ m: fm(S27.tx.paper, 1, false), t0: -1e9 });
    S27.ring = fm(s27Tex('ring'), 1, false); { const sh = s27Tex('sh'); S27.s1 = fm(sh, 2, false); S27.s2 = fm(sh, 2, false); } S27.ca = fm(s27Tex('ca'), 3, true);
    S27.filmB = new T.MeshStandardMaterial({ color: lin(0xcfe6f6), transparent: true, opacity: 0, roughness: 0.04, metalness: 0, depthWrite: false }); S27.filmS = new T.MeshStandardMaterial({ color: lin(0x263648), transparent: true, opacity: 0, roughness: 0.08, metalness: 0, depthWrite: false }); };
  const s27Stamp = (x, z, r, k, now, bead) => { const w = S27.wet[S27.wi++ % S27.wet.length], on = k > 0.5, m = w.m; m.material.map = bead ? S27.tx.bead : on ? S27.tx.paper : S27.tx.wood; m.position.set(x, (on ? 0.026 : -0.238) + 0.0004 * (S27.wi % 30), z); m.rotation.y = 6.28 * hash('w27' + S27.wi); w.r = r; w.t0 = now; w.life = bead ? 3000 : on ? 4400 : 5200; w.a = bead ? 1 : on ? 0.72 : 0.9; w.bead = bead; m.visible = true; };
  const s27Frame = now => { const SP = s26Fig(), G = homObj && homObj.grp; if (!S27.tx) s27Init();
    S27.wet.forEach(w => { if (!w.m.visible) return; const u = (now - w.t0) / w.life; if (u >= 1) { w.m.visible = false; return; } const dry = u * u, s = w.r * 2 * (w.bead ? 1 - 0.5 * dry : 1 - 0.42 * dry); w.m.scale.set(s * 1.25, 1, s); w.m.material.opacity = w.a * (1 - dry) * Math.min(1, u * 14 + 0.3); dirty = true; });
    if (!SP || !SP.b27 || !G || !G.visible) { [S27.ring, S27.s1, S27.s2, S27.ca].forEach(m => { m.visible = false; }); S27.last = null; return; }
    const q0 = SP.q0 || {}, kx = G.scale.x, R = SP.G.pl.rx * kx * (q0.px || 1), x = G.position.x, z = G.position.z, k = s27K(x, z, R), sy = -0.25 * (1 - k), up = 1 - Math.min(1, Math.max(0, q0.sink || 0) / 0.9), hgt = SP.G.H * kx * up, A = st.homAct;
    /* it stands on its surface: on the wood, up over the book's edge, on the paper */ G.position.y = sy;
    S27.ring.visible = true; { const r0 = SP.G.pl.rx * (homObj.s || 1); S27.ring.position.set(HOMP.x, -0.243, HOMP.z); S27.ring.scale.set(r0 * 3.1, 1, r0 * 2.6); S27.ring.material.opacity = 0.55; }
    /* its shadows, as the cup's: a close dark one under the foot, a wider soft one thrown down and right by the lamp */ S27.s2.visible = S27.s1.visible = true; S27.s2.position.set(x + 0.12 * R, sy + 0.034, z + 0.16 * R); S27.s2.scale.set(R * 3.0, 1, R * 2.5); S27.s2.material.opacity = 0.8;
    S27.s1.position.set(x + 0.35 * R + 0.07 * hgt, sy + 0.032, z + 0.28 * R + 0.05 * hgt); S27.s1.scale.set(R * 3.0 + 0.24 * hgt, 1, R * 2.4 + 0.14 * hgt); S27.s1.material.opacity = 0.25 + 0.4 * up;
    /* the lamp through the water: a small light that moves on the page beside it */ { const c = S27.ca, tq = now / 1000, wob = Math.sin(tq * 2.3) + 0.6 * Math.sin(tq * 3.7); c.visible = up > 0.05; c.position.set(x + 1.05 * R + 0.06 * R * wob, sy + 0.04, z + 0.72 * R + 0.05 * R * Math.cos(tq * 1.9)); c.rotation.y = 0.5 * Math.sin(tq * 0.9); const s = R * (0.85 + 0.07 * wob); c.scale.set(s * 1.3, 1, s); c.material.opacity = (0.26 + 0.07 * wob) * up; }
    /* where it has been is wet */ { const L = S27.last, mv = L ? Math.hypot(x - L.x, z - L.z) : 0; if (!L) S27.last = { x, z, n: 0 }; else if (mv > 0.62 * R) { const n = ++L.n; s27Stamp(L.x + (hash('wj' + n) - 0.5) * 0.3 * R, L.z + (hash('wk' + n) - 0.5) * 0.2 * R, R * (0.74 + 0.24 * hash('wr' + n)), s27K(L.x, L.z, 0.01), now, false); if (n % 3 === 1) { const sd = n % 2 ? 1 : -1, bx = L.x + sd * R * (1.25 + 0.5 * hash('wb' + n)), bz = L.z + (hash('wc' + n) - 0.5) * R; s27Stamp(bx, bz, R * 0.34, s27K(bx, bz, 0.01), now, true); } L.x = x; L.z = z; } }
    /* the molecule under its hand */ const J = S27.job; if (J && A && A.j === J.j && center && center.balls) { const hb = now - A.t - J.j.W - J.j.J - 0.655 * J.j.D; if (hb > 0 && !J.done) { if (!J.set) { J.set = []; J.pairs.forEach((p, bi) => { [0, 1].forEach(e => { if (!J.set.some(q => q.at === p[e])) J.set.push({ at: p[e], dl: 70 * bi + 60 * e }); }); J.set.push({ pr: p, dl: 70 * bi + 30, fs: [] }); }); }
        let live = false; J.set.forEach(q => { const t = hb - q.dl; if (t < 0) { live = true; return; } const fade = t < 2600 ? Math.min(1, t / 160) * (1 - Math.pow(t / 2600, 2)) : 0; if (fade > 0) live = true;
          if (q.at) { const b = center.balls.get(q.at); if (!b) return; /* the molecule may be built anew under the hand: the wet goes on to the new ball */ if (q.host !== b.mesh) { q.host = b.mesh; q.y0 = b.mesh.position.y; q.s0 = b.mesh.scale.x; q.f = new T.Mesh(SPH, S27.filmB.clone()); q.f.scale.setScalar(1.06); q.f.castShadow = false; q.f.renderOrder = 6; b.mesh.add(q.f); }
            q.f.material.opacity = 0.55 * fade; q.f.visible = fade > 0; const d = t < 1100 ? -Math.exp(-t / 230) * Math.sin(t / 80) : 0; b.mesh.position.y = q.y0 + 0.8 * d; b.mesh.scale.setScalar(q.s0 * (1 + 0.2 * d)); }
          else { const sk = (center.sticks || []).filter(k => (k.a === q.pr[0] && k.b === q.pr[1]) || (k.a === q.pr[1] && k.b === q.pr[0])), ms = []; sk.forEach(k => (k.parts || []).forEach(pt => ms.push(pt.mesh))); if (q.fs.length !== ms.length || q.fs.some((f, i) => f.parent !== ms[i])) { q.fs = ms.map(m => { const f = new T.Mesh(CYL, S27.filmS.clone()); f.scale.set(1.35, 1, 1.35); f.castShadow = false; f.renderOrder = 6; m.add(f); return f; }); } q.fs.forEach(f => { f.material.opacity = 0.62 * fade; f.visible = fade > 0; }); } }); dirty = true;
        if (!live) { J.set.forEach(q => { (q.fs || [q.f]).forEach(f => { if (f && f.parent) f.parent.remove(f); }); }); J.done = true; } } } };
  A20ACT.water = (f0 => function (j, c) { const act = f0(j, c); try { if (S27.on && act && s26Fig()) { let pairs = S26.sp && performance.now() - S26.spT < 800 && S26.sp.pairs ? S26.sp.pairs : null; if (!pairs) { const s = P.HOMS.water.spots(g.m)[0]; pairs = s ? s.pairs : []; } S27.job = { j, pairs }; } } catch (e) { S27.err = String(e && e.stack); } return act; })(A20ACT.water);
  actPiece = (f0 => function (kind) { if (S27.np && kind === 'puff') return null; return f0.apply(this, arguments); })(actPiece);
  jumpPlan = (f0 => function (id, to) { S27.np = S27.on && id === 'water' && !!s26Fig(); try { return f0(id, to); } finally { S27.np = false; } })(jumpPlan);
  a20Spent = (f0 => function (now) { if (S27.on) { try { s27Frame(now); } catch (e) { S27.err = String(e && e.stack); } } return f0(now); })(a20Spent);
  if (AA.rxScheme) AA.rxScheme.s27 = () => ({ on: S27.on, err: S27.err, wet: S27.wet.filter(w => w.m.visible).length, job: S27.job ? { n: S27.job.pairs.length, set: S27.job.set ? S27.job.set.length : 0, done: !!S27.job.done } : null, y: homObj ? homObj.grp.position.y : null });
  // ==== S27 END
              // ==== S28 BEGIN
  // (builder 28) THE WORLD REACTS TO WATER (S28.on; ?r28=0 or AA.rxKit.react28 = false gives builder 27 back).
  // Its way out is no longer a straight line: home, along the bench, by the cup, under the near corner of the top reagent card, then onto the page
  // (s28Path, a smooth line through those places walked at the clip's own pace; home again is straight). As it passes: the jar it leaves rocks once,
  // the coffee sloshes (the cup's own slosh) and its steam bends away, a card's near corner lifts and settles and its bottle rocks. On the molecule:
  // the atoms under its hand dip and keep a wet sheen, their bonds stay wet-dark, for about 2.5 s, carried across the rebuild as OH by the atoms'
  // order in the molecule; the new O and H come up wet. The ring where the hand lands is a lit ring in the scene. Wet marks no longer paint grey:
  // they MULTIPLY what is under them (paper goes darker and warmer, ruled lines and grain darker still), with soft cockle ridges, a thin tide line,
  // and dry from the edges in. The light through it is one soft patch.
  const S28 = { on: S27.on && !(AA.rxKit && AA.rxKit.react28 === false) && !/[?&]r28=0/.test(String(root.location && root.location.search)), A: null, mol: null, bendT: -1e9, jarT: -1e9, jar: null, jarS: 0, cupDone: false, tx: false, err: null };
  S26.b28 = S28.on; if (S28.on) S26.T = [3400, 6400, 2700];
  const s28Sm = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
  const s28Path = j => { if (j.p28) return j.p28; const H = HOMP, Q = j.perch, pts = [[H.x, H.z], [H.x + 0.45 * (CUP.x - 6.4 - H.x), -24.2], [CUP.x - 6.4, CUP.z + 3.0]]; let top = null; BT.map.forEach(b => { if (!b.gone && (!top || b.z < top.z)) top = b; });
    if (top) { const cx = top.x - BT.cw * top.sc / 2, cz = top.z - BT.ch * top.sc / 2; pts.push([cx + 1.9, cz - 1.7]); if (Q.z > cz + 2) pts.push([cx - 0.9, Math.min(Q.z, top.z + BT.ch * top.sc / 2)]); } else pts.push([SHP.x1 + 2, (CUP.z + Q.z) / 2]);
    pts.push([Q.x, Q.z]); const xs = [], zs = [], ls = [0], n = pts.length, at = i => pts[Math.max(0, Math.min(n - 1, i))];
    for (let i = 0; i < n - 1; i++) { const a = at(i - 1), b = at(i), c = at(i + 1), d = at(i + 2); for (let k = 0; k < 16; k++) { const t = k / 16, t2 = t * t, t3 = t2 * t, f = (p0, p1, p2, p3) => 0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (3 * p1 - p0 - 3 * p2 + p3) * t3); xs.push(f(a[0], b[0], c[0], d[0])); zs.push(f(a[1], b[1], c[1], d[1])); } } xs.push(Q.x); zs.push(Q.z);
    for (let i = 1; i < xs.length; i++) ls.push(ls[i - 1] + Math.hypot(xs[i] - xs[i - 1], zs[i] - zs[i - 1])); return (j.p28 = { xs, zs, ls }); };
  const s28At = (p, e) => { const L = p.ls[p.ls.length - 1] * e; let i = 1; while (i < p.ls.length - 1 && p.ls[i] < L) i++; const f = (L - p.ls[i - 1]) / Math.max(1e-6, p.ls[i] - p.ls[i - 1]); return [p.xs[i - 1] + (p.xs[i] - p.xs[i - 1]) * f, p.zs[i - 1] + (p.zs[i] - p.zs[i - 1]) * f]; };
  homJump = (f0 => function (A, now) { const o = f0(A, now), j = A && A.j; if (!o || !S28.on || !j || A.id !== 'water' || !j.r21 || !j.perch || !s26Fig()) return o;
    try { if (now - A.t < j.W + j.J + 60 && j.k !== 1) { const e = Math.max(0, Math.min(1, (o.k - 1) / (j.k - 1))), p = s28At(s28Path(j), e); o.hx = p[0]; o.hz = p[1]; if (A20.cw) { A20.cw.x = o.hx; A20.cw.z = o.hz; } } } catch (e) { S28.err = String(e && e.stack); } return o; })(homJump);
  /* a wet mark's field: red is how deep in from the edge (it dries from the edge in), green the paper's cockle (light on one side of a soft ridge, dark on the other) */
  const s28Field = sd => { const c = canvasTex(128, 128), im = c.x.createImageData(128, 128), d = im.data, rg = [0, 1, 2].map(i => ({ a: 6.28 * hash('ra' + sd + i), o: (hash('ro' + sd + i) - 0.5) * 0.8, w: 0.24 + 0.1 * hash('rw' + sd + i), c: 3 * hash('rc' + sd + i) }));
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const u = (x - 63.5) / 64, v = (y - 63.5) / 64, r = Math.hypot(u, v), th = Math.atan2(v, u), R = 0.9 * (1 + 0.075 * Math.sin(3 * th + sd) + 0.05 * Math.sin(7 * th + 2 * sd)), f = Math.max(0, 1 - r / R); let g = 0;
      rg.forEach(q => { const dd = (u * Math.cos(q.a) + v * Math.sin(q.a) - q.o + 0.12 * Math.sin((v * Math.cos(q.a) - u * Math.sin(q.a)) * 3 + q.c)) / q.w; g += -dd * Math.exp(-dd * dd); });
      const i = (y * 128 + x) * 4; d[i] = Math.round(255 * Math.pow(f, 0.8)); d[i + 1] = Math.max(0, Math.min(255, Math.round(128 + 120 * g))); d[i + 2] = 0; d[i + 3] = 255; } c.x.putImageData(im, 0, 0); c.t.needsUpdate = true; return c.t; };
  const s28WetMat = k => new T.ShaderMaterial({ uniforms: { map: { value: S28.fld[k % 2] }, dry: { value: 0 }, amt: { value: 1 }, gl: { value: 0.4 }, tint: { value: new T.Vector3(0.9, 0.85, 0.75) } }, transparent: true, depthWrite: false, blending: T.CustomBlending, blendEquation: T.AddEquation, blendSrc: T.DstColorFactor, blendDst: T.SrcAlphaFactor,
    vertexShader: 'varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D map; uniform float dry; uniform float amt; uniform float gl; uniform vec3 tint; varying vec2 vUv;\nvoid main() { vec4 t = texture2D(map, vUv); float e = dry * 0.92; float m = smoothstep(e, e + 0.3, t.r) * amt; float tide = smoothstep(e, e + 0.03, t.r) * (1.0 - smoothstep(e + 0.03, e + 0.1, t.r)) * amt; vec3 M = mix(vec3(1.0), tint, m); M *= 1.0 - 0.022 * tide; M *= 1.0 + gl * (t.g - 0.5) * m; gl_FragColor = vec4(clamp(M - 0.5, 0.0, 1.0), 0.5); }' });
  const s28Glint = () => { const c = canvasTex(128, 128), x = c.x; [[60, 64, 58, 0.5], [84, 56, 34, 0.35], [50, 82, 26, 0.3]].forEach(q => { const g2 = x.createRadialGradient(q[0], q[1], 1, q[0], q[1], q[2]); g2.addColorStop(0, 'rgba(255,244,214,' + q[3] + ')'); g2.addColorStop(0.5, 'rgba(255,244,214,' + (q[3] * 0.35) + ')'); g2.addColorStop(1, 'rgba(255,244,214,0)'); x.fillStyle = g2; x.fillRect(0, 0, 128, 128); }); c.t.needsUpdate = true; return c.t; };
  const s28Init = () => { S28.tx = true; S28.fld = [s28Field(1.3), s28Field(4.1)]; for (let i = 0; i < 26; i++) { const m = flatMesh(1, 1, S27.tx.paper, 0); m.renderOrder = 1; m.visible = false; m.castShadow = false; m.receiveShadow = false; scene.add(m); S27.wet.push({ m, t0: -1e9 }); }
    S27.ca.material.map = s28Glint(); S27.ca.material.needsUpdate = true;
    S28.ring = new T.Mesh(new T.TorusGeometry(1, 0.075, 8, 44).rotateX(Math.PI / 2), new T.MeshStandardMaterial({ color: lin(0x8db6da), roughness: 0.12, metalness: 0.08, transparent: true, opacity: 0, depthWrite: false })); S28.ring.visible = false; S28.ring.castShadow = false; S28.ring.renderOrder = 6; scene.add(S28.ring); };
  const s28MolEnd = M => { if (M && M.films) M.films.forEach(f => { if (f.parent) f.parent.remove(f); }); if (S28.ring) S28.ring.visible = false; };
  const s28Frame = now => { if (!S27.tx) return; if (!S28.tx) s28Init();
    /* the wet marks: what is under them goes darker and warmer; they dry from the edges in */ S27.wet.forEach((w, wi) => { const m = w.m; if (!w.ms) { w.mb = m.material; w.ms = s28WetMat(wi); } if (!m.visible) return; if (w.bead) { if (m.material !== w.mb) m.material = w.mb; w.mb.map = S27.tx.bead; return; } if (m.material !== w.ms) m.material = w.ms;
      const on = m.position.y > -0.1, u = Math.max(0, (now - w.t0) / (w.life || 5000)), U = w.ms.uniforms; U.dry.value = Math.pow(u, 1.25); U.amt.value = Math.min(1, u * 12 + 0.25) * (1 - s28Sm((u - 0.86) / 0.14)); U.gl.value = on ? 0.2 : 0.3; if (on) U.tint.value.set(0.925, 0.89, 0.82); else U.tint.value.set(0.87, 0.84, 0.81); m.scale.set(w.r * 3.3, 1, w.r * 2.7); });
    if (S27.s2.visible) S27.s2.material.opacity = 0.5;
    const A = st.homAct, SP = s26Fig(), G = homObj && homObj.grp, live = !!(A && A.id === 'water' && A.j && A.j.r21 && SP && G);
    if (live) { if (S28.A !== A) { S28.A = A; S28.cupDone = false; S28.jarT = now + 0.5 * A.j.W; S28.jar = null; S28.jarS = 0; let bd = 1e9; JARK.forEach(k => { const J = jars[k]; if (!J || !J.grp || !J.grp.visible) return; const d = Math.hypot(J.grp.position.x - HOMP.x, J.grp.position.z - HOMP.z); if (d < bd) { bd = d; S28.jar = J; } }); BT.map.forEach(b => { b.s28A = null; }); }
      const x = G.position.x, z = G.position.z, R = SP.G.pl.rx * G.scale.x, out = now - A.t < A.j.W + A.j.J;
      if (out && !S28.cupDone && Math.hypot(x - CUP.x, z - CUP.z) < 7.8) { S28.cupDone = true; S28.bendT = now; CUP.vx += 0.9; CUP.vz -= 0.4; }
      if (out) BT.map.forEach(b => { if (b.gone || b.s28A === A) return; const cx = b.x - BT.cw * b.sc / 2, cz = b.z - BT.ch * b.sc / 2; if (Math.hypot(x - cx, z - cz) < R + 1.7) { b.s28A = A; b.s28T = b.s28T0 = now; } }); }
    /* the jar it leaves rocks once */ if (S28.jar) { const t = now - S28.jarT; if (t > 0 && t < 1300) { S28.jar.grp.rotation.z += 0.12 * Math.exp(-t / 300) * Math.sin(t / 42); if (!S28.jarS) { S28.jarS = 1; try { sfxN('click'); } catch (e) { /* no sound */ } } dirty = true; } else if (t >= 1300) S28.jar = null; }
    /* the molecule under its hand stays wet */ const M = S28.mol; if (M && center && center.balls) {
      if (M.t0 == null) { if (live && A.j === M.j) { const hb = now - A.t - A.j.W - A.j.J - 0.655 * A.j.D; if (hb > 0) { const keys = Array.from(center.balls.keys()); M.t0 = now - hb; M.c0 = center; M.idx = []; M.pairs.forEach(p => p.forEach(a => { const i = keys.indexOf(a); if (i >= 0 && M.idx.indexOf(i) < 0) M.idx.push(i); })); M.seen = new Map(); M.films = []; const H = A.j.bites && A.j.bites.w26 && A.j.bites.w26.H; M.H = H ? { x: H.x, y: H.y, z: H.z } : null; } } else if (!live) S28.mol = null; }
      if (M.t0 != null) { const t = now - M.t0; if (t > 2500) { s28MolEnd(M); S28.mol = null; }
        else { const keys = Array.from(center.balls.keys()), wet = new Set(), fresh = center !== M.c0, env = Math.min(1, t / 160) * (1 - s28Sm((t - 1500) / 1000)); M.idx.forEach(i => { if (keys[i]) wet.add(keys[i]); });
          if (fresh) { const sk = center.sticks || [], nb = (a, el) => sk.forEach(k => { const o = k.a === a ? k.b : k.b === a ? k.a : null; if (o && o.el === el) wet.add(o); }); Array.from(wet).forEach(a => nb(a, 'O')); Array.from(wet).forEach(a => { if (a.el === 'O') nb(a, 'H'); }); }
          wet.forEach(a => { const b = center.balls.get(a); if (!b || !b.mesh) return; let s = M.seen.get(b.mesh); if (!s) { s = { y0: b.mesh.position.y, s0: b.mesh.scale.x, old: !fresh, f: new T.Mesh(SPH, S27.filmB.clone()) }; s.f.material.color.copy(lin(0x2a3d55)); s.f.scale.setScalar(1.07); s.f.castShadow = false; s.f.renderOrder = 6; b.mesh.add(s.f); M.films.push(s.f); M.seen.set(b.mesh, s); }
            s.f.material.opacity = 0.4 * env; s.f.visible = env > 0.01; if (s.old && !s.set) { const d = t < 1100 ? -Math.exp(-t / 230) * Math.sin(t / 80) : 0; b.mesh.position.y = s.y0 + 0.8 * d; b.mesh.scale.setScalar(s.s0 * (1 + 0.2 * d)); if (t >= 1100) s.set = true; } });
          (center.sticks || []).forEach(k => { if (!wet.has(k.a) || !wet.has(k.b)) return; (k.parts || []).forEach(pt => { const ms = pt.mesh; if (!ms) return; let f = M.seen.get(ms); if (!f) { f = new T.Mesh(CYL, S27.filmS.clone()); f.scale.set(1.35, 1, 1.35); f.castShadow = false; f.renderOrder = 6; ms.add(f); M.films.push(f); M.seen.set(ms, f); } f.material.opacity = 0.68 * env; f.visible = env > 0.01; }); });
          /* where its hand lands: a lit ring of water that spreads and thins */ const R3 = S28.ring; if (M.H && t < 700) { const k = t / 700, r = 0.5 + 2.3 * s28Sm(k); R3.visible = true; R3.position.set(M.H.x, M.H.y, M.H.z); R3.scale.set(r, 1 + 0.6 * (1 - k), r); R3.material.opacity = 0.85 * (1 - k) * (1 - k); } else R3.visible = false; dirty = true; } } } };
  A20ACT.water = (f0 => function (j, c) { const act = f0(j, c); try { if (S28.on && act && S27.job && S27.job.j === j) { s28MolEnd(S28.mol); S28.mol = { j, pairs: S27.job.pairs, t0: null }; S27.job = null; } } catch (e) { S28.err = String(e && e.stack); } return act; })(A20ACT.water);
  a20Spent = (f0 => function (now) { const r = f0(now); if (S28.on) { try { s28Frame(now); } catch (e) { S28.err = String(e && e.stack); } } return r; })(a20Spent);
  cupFrame = (f0 => function (now) { f0(now); if (!S28.on || !CUP.grp) return; try { const tb = now - S28.bendT; if (tb >= 0 && tb < 2600) { /* the steam bends away from it */ const k = Math.min(1, tb / 220) * Math.exp(-Math.max(0, tb - 220) / 700); CUP.steam.forEach(m => { m.position.x += 1.5 * k * Math.max(0, m.position.y - 3.0) / 2.5; }); }
      BT.map.forEach(b => { if (!b.s28T) return; const t = now - b.s28T, card = b.mesh0 || (REAG === 'cards' ? b.mesh : null); if (t > 1500) { b.s28T = 0; if (card) { card.rotation.x = 0; card.rotation.z = 0; card.position.y = 0.05; } return; }
        /* the near corner lifts and settles; the bottle rocks once */ const up = Math.sin(Math.PI * Math.min(1, t / 520)), set = t > 520 ? -0.12 * Math.exp(-(t - 520) / 130) * Math.sin((t - 520) / 38) : 0, e = Math.max(0, up + set); if (card) { card.rotation.z = -0.15 * e; card.rotation.x = 0.1 * e; card.position.y = 0.05 + 1.0 * e; }
        if (b.lean && b.mesh) { const sl = Math.exp(-t / 380) * Math.sin(t / 62); b.mesh.rotation.z += 0.13 * sl; b.mesh.position.x += -0.08 * sl; } dirty = true; }); } catch (e) { S28.err = String(e && e.stack); } })(cupFrame);
  if (AA.rxKit) AA.rxKit.s28dbg = () => ({ on: S28.on, err: S28.err, s27: S27.err, kit: AA.rxKit.spiritErr || null, a20: A20.err || null, r21: R21.err || null, mol: S28.mol ? { t0: S28.mol.t0, idx: S28.mol.idx, films: S28.mol.films ? S28.mol.films.length : 0 } : null, wet: S27.wet.filter(w => w.m.visible).length, pos: homObj ? [+homObj.grp.position.x.toFixed(1), +homObj.grp.position.z.toFixed(1)] : null, cup: S28.cupDone, cardT: S28.A ? Array.from(BT.map.values()).map(b => b.s28T0 ? Math.round(b.s28T0 - S28.A.t) : 0) : null, bendT: S28.A ? Math.round(S28.bendT - S28.A.t) : null, cards: Array.from(BT.map.values()).filter(b => b.s28A).length });
  // ==== S28 END
  // ==== S29 BEGIN
  // (builder 29) the three looks of AA.rxKit.style29 are shown without the wet trail and the damp ring; clear water (a) throws a lighter shadow
  a20Spent = (f0 => function (now) { const r = f0(now); try { const st = AA.rxKit && AA.rxKit.style29; if (st && S27.tx) { S27.wet.forEach(w => { w.m.visible = false; }); S27.ring.visible = false; if (st === 'a') { S27.s1.material.opacity *= 0.6; S27.s2.material.opacity *= 0.6; } } } catch (e) { } return r; })(a20Spent);
  // ==== S29 END
  // ==== S30 BEGIN
  // (builder 30) WATER IN PEN AND WASH, in the scene (AA.rxKit.wash30, on by default). What it leaves is watercolour, never brown: on paper a pale
  // grey-blue damp mark with a soft dark edge that dries in about 4 s; on wood a slightly darker damp patch. It throws no lamp shadow and no light:
  // on the page a soft pencil smudge lies under it, on the bench a small contact shadow. The atoms under its hand take a ring of blue wash that
  // spreads along their bonds and dries (the films of S28, drawn flat and from behind so they read as wash round the atom, not as a wet sheen).
  const S30 = { err: null, ma: null, mb: null };
  const s30Frame = now => { const SP = s26Fig(), on = !!(AA.rxKit && AA.rxKit.wash30 !== false && !AA.rxKit.style29 && S27.tx && S28.on); if (!on) return;
    S27.wet.forEach(w => { if (!w.ms || !w.m.visible || w.bead) return; if (!w.s30) { w.s30 = true; w.ms.fragmentShader = w.ms.fragmentShader.replace('0.022 * tide', '0.05 * tide'); w.ms.needsUpdate = true; } const U = w.ms.uniforms, onP = w.m.position.y > -0.1, u = Math.max(0, (now - w.t0) / (w.life || 5000)); if (onP) U.tint.value.set(0.885, 0.915, 0.955); else U.tint.value.set(0.80, 0.80, 0.83); U.gl.value = onP ? 0.07 : 0.16; U.amt.value = Math.min(1, u * 12 + 0.25) * (1 - s28Sm((u - 0.6) / 0.4)) * (onP ? 0.55 : 0.9); });
    if (SP && SP.w30 && homObj && homObj.grp.visible) { const G = homObj.grp, R = SP.G.pl.rx * G.scale.x * ((SP.q0 || {}).px || 1), k = s27K(G.position.x, G.position.z, R); S27.s1.visible = false; S27.ca.visible = false; S27.s2.material.opacity = k > 0.5 ? 0.2 : 0.42; S27.s2.scale.set(R * (k > 0.5 ? 3.3 : 2.6), 1, R * (k > 0.5 ? 2.5 : 2.1)); S27.s2.position.x = G.position.x + 0.1 * R; S27.s2.position.z = G.position.z + 0.14 * R; }
    if (S28.ring) S28.ring.visible = false;
    { /* when the job names no atoms, the atom under its hand and the bonds from it take the wash */ const M0 = S28.mol; if (M0 && M0.t0 != null && M0.idx && !M0.idx.length && M0.H && !M0.s30 && center && center.balls) { M0.s30 = true; const keys = Array.from(center.balls.keys()), v = new T.Vector3(); let bi = -1, bd = 1e9; keys.forEach((a, i) => { const b = center.balls.get(a); if (!b || !b.mesh) return; b.mesh.getWorldPosition(v); const d = Math.hypot(v.x - M0.H.x, v.z - M0.H.z); if (d < bd) { bd = d; bi = i; } }); if (bi >= 0) { M0.idx.push(bi); (center.sticks || []).forEach(k => { const o = k.a === keys[bi] ? k.b : k.b === keys[bi] ? k.a : null, oi = o ? keys.indexOf(o) : -1; if (oi >= 0 && M0.idx.indexOf(oi) < 0) M0.idx.push(oi); }); M0.near = bi; } } }
    const M = S28.mol; if (M) S30.dbg = { t0: M.t0, idx: M.idx, films: M.films && M.films.length, pairs: M.pairs && M.pairs.length }; if (M && M.t0 != null && M.films) { const t = now - M.t0, env = Math.min(1, t / 140) * (1 - s28Sm((t - 700) / 1700)); if (!S30.ma) { S30.ma = new T.MeshBasicMaterial({ color: lin(0x86b3e3), transparent: true, opacity: 0, side: T.BackSide, depthWrite: false }); S30.mb = S30.ma.clone(); S30.mb.color.copy(lin(0x9cc2ea)); }
      M.films.forEach((f, i) => { if (!f.userData.s30) { f.userData.s30 = f.geometry === SPH ? 1 : 2; f.material = (f.userData.s30 === 1 ? S30.ma : S30.mb).clone(); f.renderOrder = 5; } const m = f.material, ph = 0.06 * Math.sin(i * 2.4);
        if (f.userData.s30 === 1) { const s = 1.14 + 0.3 * s28Sm(t / 520) + ph; f.scale.setScalar(s); m.opacity = 0.9 * env; } else { const g = s28Sm((t - 120) / 600), s = 1.2 + 1.5 * g; f.scale.set(s, 1, s); m.opacity = 0.75 * env * Math.min(1, g * 3); } f.visible = m.opacity > 0.01; }); } };
  a20Spent = (f0 => function (now) { const r = f0(now); try { s30Frame(now); } catch (e) { S30.err = String(e && e.stack); } return r; })(a20Spent);
  jarLife = (f0 => function (k, J, t, quick) { f0(k, J, t, quick); try { const c = k === 'water' && J.j && J.j.userData.big2; if (c && c.visible && c.userData.rig2 && c.userData.rig2.spirit) AA.rxKit.rigPlay(c, 'rest', t * 0.9 + 3.3, { jar: true }); } catch (e) { S30.err = String(e && e.stack); } })(jarLife);
  if (AA.rxKit) AA.rxKit.s30dbg = () => ({ err: S30.err, mol: S30.dbg, kit: AA.rxKit.spiritErr || null, cost: AA.rxKit.spirit26.W30 && AA.rxKit.spirit26.W30.cost });
  // ==== S30 END
  function drawInk(now) {
    const x = ink.x; x.clearRect(0, 0, IW, IH); x.textBaseline = 'alphabetic'; try { bleedMock(x); } catch (e) { /* a mock never breaks the page */ } if (BENCHV && LOSS.blank && st.mode === 'done' && !st.pass) { if (now - (st.doneT || now) > LOSS.end) { const nb = 9 * Math.sin(now / 260), n0 = px({ x: 4, z: 2 }), nx = [n0[0] + nb, n0[1]]; x.save(); x.translate(nx[0], nx[1]); x.scale(2.2, 2.2); x.strokeStyle = INK; x.lineWidth = 7; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.arc(-78, 0, 24, 0.9, 6.0); x.stroke(); const ex = -78 + 24 * Math.cos(6.0), ey = 24 * Math.sin(6.0); x.beginPath(); x.moveTo(ex - 16, ey - 6); x.lineTo(ex, ey); x.lineTo(ex + 6, ey - 17); x.stroke(); x.beginPath(); x.moveTo(-30, 0); x.lineTo(30, 0); x.lineTo(8, -20); x.moveTo(30, 0); x.lineTo(8, 20); x.stroke(); x.restore(); } ink.t.needsUpdate = true; return; } pageStains(x);
    if (st.mode !== 'shop') marginalia(x, now);
    if (st.splats && st.splats.length && (BENCHV ? (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse' || st.mode === 'done') : st.mode !== 'shop')) { const SK = BENCHV && st.mode === 'done' ? Math.max(0, 1 - (now - (st.doneT || now) - 900) / 1700) : 1; x.save(); st.splats.forEach(d => { x.fillStyle = 'rgba(28,34,66,' + (d.a * SK).toFixed(2) + ')'; x.beginPath(); x.arc(d.x, d.y, d.r, 0, 6.3); x.fill(); }); x.restore(); }
    if (st.mode === 'shop') {
      if (bench) { const B = bench, nx = supplyNext(), fi = famNext(), can = nx && meta.credit >= nx.cost, hovG = st.hover === meta.tier + 1, held = Math.max(0, meta.credit - shop.earned);
        // the coins: what the run just paid, apart from what was held
        { const c0 = px({ x: -3, z: -14.4 }), n1 = Math.min(18, shop.earned); marker(x, 44); x.fillStyle = GREEN; x.textAlign = 'right'; if (shop.earned) x.fillText('+', c0[0] - 22, c0[1] + 14); for (let k = 0; k < n1; k++) AA.rxKit.drawCoin(x, c0[0] + k * 40, c0[1], 17, {}); if (shop.earned > 18) { x.fillStyle = INK; x.textAlign = 'left'; x.fillText(String(shop.earned), c0[0] + 18 * 40, c0[1] + 14); }
          const c1 = px({ x: -3, z: -12.6 }), n2 = Math.min(24, held); for (let k = 0; k < n2; k++) AA.rxKit.drawCoin(x, c1[0] + k * 30, c1[1], 13, { alpha: 0.9 }); if (held > 24) { marker(x, 40); x.fillStyle = INK; x.textAlign = 'left'; x.fillText(String(held), c1[0] + 24 * 30, c1[1] + 12); } }
        // the jars: the next one to earn, with its count
        if (B.jars.ghost) { const hs = B.jars, gk = hs.ghost.k, c = px({ x: hs.cx + hs.K * hs.ghost.lx, z: hs.cz + 2.8 * hs.K }); drop(x, c[0] - 30, c[1] - 6, 14, JARINK[gk], false); marker(x, 46); x.textAlign = 'left'; x.fillStyle = PENCIL; x.fillText(String(P.JAR.full[gk]), c[0] - 6, c[1] + 10); }
        // the instruments: the next one on offer, its price in coins
        { const G = benchGhostAt(); if (G) { const c = px({ x: G.x, z: G.z + 2.8 * G.K }), k = Math.min(5, nx.cost); for (let q = 0; q < k; q++) AA.rxKit.drawCoin(x, c[0] - (k - 1) * 14 + q * 28, c[1], 12, { alpha: can ? 1 : 0.45 }); marker(x, 44); x.textAlign = 'center'; x.fillStyle = can ? GREEN : PENCIL; x.fillText(String(nx.cost), c[0], c[1] + 52); if (hovG) ring(x, [c[0], c[1] - 80], 90, 130, 5, INK, 0.01); } }
        // the reagents known, each as what it changes before and after; one outline for the next
        { const per = 5, cell = k => px({ x: -20.8 + (k % per) * BENCH.rx.dx, z: BENCH.rx.z0 + Math.floor(k / per) * BENCH.rx.dz }), pair = (id, k, on) => { const c = cell(k), tl = TILE[id]; if (!tl) return; x.save(); x.translate(c[0], c[1]); x.scale(0.8, 0.8); fragOrChip(x, tl[0], -62, 0, on); x.strokeStyle = on ? INK : FAINT; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(-26, 0); x.lineTo(0, 0); x.moveTo(-12, -11); x.lineTo(0, 0); x.lineTo(-12, 11); x.stroke(); fragOrChip(x, tl[1], 46, 0, on); x.restore(); };
          B.rx.forEach((id, k) => pair(id, k, true));
          const gid = fi >= 0 ? P.FAMILIES[fi].reagents.find(id => TILE[id]) : nx ? nx.reagents.find(id => TILE[id]) : null, cost = fi >= 0 ? P.FAMILIES[fi].cost : nx ? nx.cost : 0;
          if (gid) { pair(gid, B.rx.length, false); const c = cell(B.rx.length), ok = meta.credit >= cost, hv = st.hover === 100 + Math.max(0, fi); AA.rxKit.drawCoin(x, c[0] - 20, c[1] + 62, 12, { alpha: ok ? 1 : 0.45 }); marker(x, 40); x.textAlign = 'left'; x.fillStyle = ok ? GREEN : PENCIL; x.fillText(String(cost), c[0] - 2, c[1] + 74); if (hv) ring(x, [c[0], c[1]], 190, 70, 5, INK, 0.01); } }
      }
      if (st.call && now - st.call.t < 1400) { const c = px(CALL); marker(x, 90); x.fillStyle = st.call.col; x.textAlign = 'center'; x.fillText(st.call.text, c[0], c[1] + 500); }
      ink.t.needsUpdate = true; return;
    }
    if (st.mode === 'hom') {
      if (homShelf) { const hs = homShelf, K = hs.K;
        hs.slots.forEach((q, i) => { if (st.hover !== i || st.homPick) return; const c = px({ x: hs.cx + K * q.lx, z: hs.cz + 2.6 * K }); marker(x, 56); x.textAlign = 'center'; x.fillStyle = JARINK[q.k]; x.fillText(P.HOMS[q.k].name, c[0], c[1]); });
        if (hs.ghost) { const c = px({ x: hs.cx + K * hs.ghost.lx, z: hs.cz + 2.8 * K }), gk = hs.ghost.k; drop(x, c[0] - 34, c[1] - 8, 17, JARINK[gk], false); marker(x, 58); x.textAlign = 'left'; x.fillStyle = PENCIL; x.fillText(String(P.JAR.full[gk]), c[0] - 4, c[1] + 12); }
      }
      ink.t.needsUpdate = true; return;
    }
    if (st.mode === 'terms') {
      const h = px({ x: 0, z: -11 }); marker(x, 110); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('terms', h[0], h[1]);
      P.TERMS.forEach((t, i) => { const q = TERMP(i), c = px(q), open = sigOpen(t), hov = st.hover === i && open, r = hov ? 132 : 116;
        if (!open) { x.globalAlpha = 0.3; sigil(x, c, r, 'plain', PENCIL, 6); x.globalAlpha = 1; hand(x, 30); x.textAlign = 'center'; x.fillStyle = PENCIL; x.fillText(t.deed, c[0], c[1] + 132); return; }
        sigil(x, c, r, t.id, hov ? REDINK : INK, hov ? 12 : 9); marker(x, 52); x.textAlign = 'center'; x.fillStyle = hov ? REDINK : INK; x.fillText(t.name, c[0], c[1] + 132);
        hand(x, 27); x.fillStyle = PENCIL; wrap(x, t.note, 520).forEach((ln, j) => x.fillText(ln, c[0], c[1] + 166 + j * 30)); });
      ink.t.needsUpdate = true; return;
    }
    if (st.mode === 'brief' && BENCHV) { briefInk(x, now); ink.t.needsUpdate = true; return; }
    if (st.mode === 'brief') {
      const h = px({ x: PGE.on ? 1.2 : 0, z: -11 }); marker(x, 120); x.textAlign = 'center'; x.fillStyle = INK; x.fillText(String(run.round), h[0], h[1]);
      briefs.forEach((b, i) => {
        const c = px({ x: BX(i), z: 3.2 }), B = P.BRIEF[b.brief], hov = st.hover === i;
        if (b.ease != null) {
          // one of two molecules: its family, the number to beat, and the coins the harder one pays on top
          { const K = P.KIN[b.kin], k1 = px({ x: BX(i), z: -8.6 }); if (false && K && P.stageOf(meta) >= 2 && !b.assay) { marker(x, 58); x.textAlign = 'center'; x.fillStyle = K.col; x.fillText(K.name, k1[0], k1[1]); } }
                    const y = c[1] + 80; marker(x, hov ? 84 : 74); x.textAlign = 'center'; x.fillStyle = REDINK; x.fillText(fmt(b.quota), c[0] + 30, y); flag(x, c[0] + 30 - x.measureText(fmt(b.quota)).width / 2 - 62, y + 2, 92, REDINK, true);
          if (b.spec || b.hurdle) { const hp = px({ x: BX(i) + 7.5, z: 5.5 }); drawSpec(g, hp[0], hp[1], b.spec || b.hurdle, { bare: true, size: 90 }); }
          if (b.motifs) { const mp = px({ x: BX(i), z: 8.6 }); drawMotifRow(b.motifs, mp[0], mp[1]); }
          if (b.coins && run.round > 1) { const w = (b.coins - 1) * 58; marker(x, 58); x.textAlign = 'right'; x.fillStyle = GREEN; x.fillText('+', c[0] - w / 2 - 36, y + 86); for (let n = 0; n < b.coins; n++) rcoin(x, c[0] - w / 2 + n * 58, y + 68, 25); }
          if (hov) swipe(x, [c[0] - 150, y + 24], [c[0] + 150, y + 19], 6, INK);
          return;
        }
                { const K = P.KIN[b.kin], k1 = px({ x: BX(i), z: -8.3 }); if (false && K) { marker(x, 66); x.textAlign = 'center'; x.fillStyle = K.col; x.fillText(K.name, k1[0], k1[1]); inkLine(x, K.tok, k1[0], k1[1] + 44, 34, INK); } }
        fit(x, B.name, hov ? 76 : 68, 350, marker); x.textAlign = 'center'; x.fillStyle = INK; x.fillText(B.name, c[0], c[1]);
        if (B.note) inkLine(x, B.note, c[0], c[1] + 62, 40, INK);
        const y = c[1] + 150; marker(x, 62); x.textAlign = 'center'; x.fillStyle = REDINK; x.fillText(fmt(b.quota), c[0], y);
        for (let n = 0; n < (b.pays || 0); n++) coin(x, c[0] - ((b.pays - 1) * 26) + n * 52, y + 52, 20);
        if (hov) swipe(x, [c[0] - 150, c[1] + 16], [c[0] + 150, c[1] + 10], 6, INK);
      });
      if (P.RULE.choose && briefs.length && briefs[0].ease != null) {
        // an assay changes one rule for both: its name and rule stand once, between the two
        if (false && briefs[0].assay) { const B = P.BRIEF[briefs[0].brief], a0 = px({ x: 0, z: -8.9 }); marker(x, 56); x.textAlign = 'center'; x.fillStyle = INK; x.fillText(B.name, a0[0], a0[1]); if (B.note) inkLine(x, B.note, a0[0], a0[1] + 44, 32, INK); }
        if (P.RULE.coins && run.round > 1 && (meta.coined || (run.coins || 0) > 0)) { const c = px(PURSE); purse(x, c[0], c[1], run.coins || 0, 24); }
        if (!BENCHV && pairOn() && run.round > 1) { const c = px(PAIR), cost = P.pairCost(run), can = cost != null && (run.coins || 0) >= cost, hov = st.mark === 'pair', age = st.drawT ? (now - st.drawT) / 350 : 9; x.save(); x.translate(c[0], c[1]); if (age < 1) x.rotate(age * 6.283); turnMark(x, 0, 0, 30, can ? INK : FAINT, hov && can ? 11 : 7); x.restore(); for (let k = 0; k < (cost == null ? 3 : cost); k++) rcoin(x, c[0] + 66 + k * 38, c[1] + 2, 15, can ? 1 : 0.35); if (cost == null) { x.strokeStyle = PENCIL; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(c[0] - 40, c[1] + 26); x.lineTo(c[0] + 160, c[1] - 22); x.stroke(); } }
      }
      ink.t.needsUpdate = true; return;
    }
    if (st.mode === 'pick' && BENCHV) { if (shopB && shopB.inkK !== (st.hover >= 0 ? 'o' + st.hover : st.mark)) { shopB.inkK = st.hover >= 0 ? 'o' + st.hover : st.mark; shopB.hovT = now; } shopInk(x, now); ink.t.needsUpdate = true; return; }
    if (st.mode === 'pick') {
      
      picks.forEach((o, i) => {
        const c = px({ x: PICKX[i], z: 3.6 }), isGear = o.kind === 'gear' || o.kind === 'level', title = isGear ? P.GEARS[o.id].name : RX.CARDS[o.id].verb.toLowerCase() + (o.kind === 'reagent' && P.PAIR[o.id] ? ' + ' + RX.CARDS[P.PAIR[o.id]].verb.toLowerCase() : ''), hov = st.hover === i;
        const kind = o.kind === 'reagent' ? 'new' : o.kind === 'gear' ? 'equipment' : o.kind === 'level' ? 'level up' : o.kind === 'strong' ? 'stronger' : 'more';
        if (!isGear) { const t0 = px({ x: PICKX[i], z: -1.2 }), tl = TILE[o.id], z0 = hov ? 2.0 : 1.8; if (tl) { x.save(); x.translate(t0[0], t0[1]); x.scale(z0, z0); fragOrChip(x, tl[0], -62, 0, true); x.strokeStyle = INK; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(-26, 0); x.lineTo(0, 0); x.moveTo(-12, -11); x.lineTo(0, 0); x.lineTo(-12, 11); x.stroke(); fragOrChip(x, tl[1], 46, 0, true); x.restore(); } }

        if (isGear || true) { /* the picture is the description: nothing is written or counted under a choice */ } else if (o.kind === 'bottle') { for (let d = 0; d < 3; d++) drop(x, c[0] - 70 + d * 70, c[1] + 36, 18, INK, true); marker(x, 56); x.textAlign = 'right'; x.fillStyle = GREEN; x.fillText('+', c[0] - 100, c[1] + 54); } else if (o.kind === 'strong') { marker(x, 84); x.textAlign = 'center'; x.fillStyle = INK; x.fillText(String(P.pickText(run, o)).split(' ')[0], c[0], c[1] + 66); }
        if (hov) ring(x, [c[0], c[1] - 10], 300, 150, 6, INK, 0.02);
      });
      if (P.RULE.coins) {
        { const c = px(PURSE); purse(x, c[0], c[1], run.coins || 0, 24); }
        // the three dealt again: a turning arrow, and beside it the coins it costs
        { const c = px(REROLL), cost = P.rerollCost(run), can = (run.coins || 0) >= cost, hov = st.mark === 'reroll', age = st.drawT ? (now - st.drawT) / 350 : 9; x.save(); x.translate(c[0], c[1]); if (age < 1) x.rotate(age * 6.283); turnMark(x, 0, 0, 30, can ? INK : FAINT, hov && can ? 11 : 7); x.restore(); for (let k = 0; k < cost; k++) rcoin(x, c[0] + 66 + k * 38, c[1] + 2, 15, can ? 1 : 0.4); }
        // all three left: an arrow past three dots, and the coin it pays
        { const c = px(SKIP), hov = st.mark === 'skip'; x.fillStyle = PENCIL; for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(c[0] - 34 + k * 26, c[1] + 12, 5, 0, 6.3); x.fill(); } x.strokeStyle = INK; x.lineWidth = hov ? 10 : 7; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(c[0] - 46, c[1] - 6); x.quadraticCurveTo(c[0] - 8, c[1] - 40, c[0] + 34, c[1] - 6); x.moveTo(c[0] + 14, c[1] - 22); x.lineTo(c[0] + 36, c[1] - 4); x.lineTo(c[0] + 38, c[1] - 30); x.stroke();
          marker(x, 34); x.textAlign = 'left'; x.fillStyle = GREEN; x.fillText('+', c[0] + 58, c[1] + 10); rcoin(x, c[0] + 100, c[1] + 2, 15); }
        // what is held stands at the top. One of them can go in the bin for two coins
        if (run.gear.length) { const n = run.gear.length, b = px({ x: HELD(n).x - 0.4, z: HELD(0).z + 0.2 }), can = (run.coins || 0) >= P.COIN.bin, col = can ? INK : FAINT, hi = /^bin/.test(st.mark || '') ? +st.mark.slice(3) : -1;
          x.strokeStyle = col; x.lineWidth = 5; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(b[0] - 24, b[1] - 40); x.lineTo(b[0] - 17, b[1] + 6); x.lineTo(b[0] + 17, b[1] + 6); x.lineTo(b[0] + 24, b[1] - 40); x.moveTo(b[0] - 30, b[1] - 40); x.lineTo(b[0] + 30, b[1] - 41); x.moveTo(b[0] - 8, b[1] - 30); x.lineTo(b[0] - 6, b[1] - 4); x.moveTo(b[0] + 8, b[1] - 30); x.lineTo(b[0] + 6, b[1] - 4); x.stroke();
          for (let k = 0; k < P.COIN.bin; k++) rcoin(x, b[0] - 15 + k * 30, b[1] + 30, 12, can ? 1 : 0.4);
          if (hi >= 0 && run.gear[hi]) { const q = px({ x: HELD(hi).x, z: HELD(hi).z - 0.7 }); x.strokeStyle = can ? REDINK : FAINT; x.lineWidth = 8; x.beginPath(); x.moveTo(q[0] - 34, q[1] - 34); x.lineTo(q[0] + 34, q[1] + 30); x.moveTo(q[0] + 34, q[1] - 34); x.lineTo(q[0] - 34, q[1] + 30); x.stroke(); hand(x, 28); x.textAlign = 'center'; x.fillStyle = PENCIL; const q2 = px({ x: HELD(hi).x, z: HELD(hi).z + 2.2 }); x.fillText(P.GEARS[run.gear[hi]].name, q2[0], q2[1]); } }
      }
      ink.t.needsUpdate = true; return;
    }
    const play = st.mode === 'play', lineUp = lining(), open = (lineUp && st.view ? st.view.row : g.cur.path.length) > 0;
    { const occ = st.gear.filter(id => P.GEARS[id].kin === 'occult').length; x.strokeStyle = 'rgba(70,30,90,0.42)'; x.lineWidth = 3; x.lineCap = 'round';
      for (let k = 0; k < occ * 5; k++) { const dp = px({ x: -26 + 3.4 * hash('dx' + k), z: -12.5 + 6 * hash('dy' + k) }), cx = dp[0], cy = dp[1], r = 13 + 12 * hash('dr' + k), kind = k % 3;
        x.beginPath();
        if (kind === 0) { for (let q = 0; q <= 5; q++) { const a = -1.571 + q * 2.513; if (q) x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); else x.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } }
        else if (kind === 1) { x.ellipse(cx, cy, r, r * 0.5, 0, 0, 7); x.moveTo(cx + r * 0.25, cy); x.arc(cx, cy, r * 0.25, 0, 7); }
        else { for (let q = 0; q < 4; q++) { x.moveTo(cx - r + q * r * 0.5, cy - r * 0.6); x.lineTo(cx - r + q * r * 0.5, cy + r * 0.6); } x.moveTo(cx - r * 1.2, cy + r * 0.5); x.lineTo(cx + r * 0.9, cy - r * 0.5); }
        x.stroke(); } }
    // the transmutation circle lies on the page under the molecule: the run's sigil, and a rune for every reaction in the row
    if (g && g.ring && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse')) { const c = px(C0), R0 = 196, fl = st.ringT ? Math.max(0, 1 - (now - st.ringT) / 800) : 0, GOLD = '#b88a00', n = g.ring, lit = fl > 0 ? n : (g.lit || 0), up = -Math.PI / 2;
      x.globalAlpha = 0.62 + 0.38 * fl; sigil(x, c, R0, run.term || 'plain', fl ? GOLD : PENCIL, 7 + 6 * fl, 1); x.globalAlpha = 1;
      // the lit part of the circle is one gold arc from the top, so how far it has come is read at a glance
      if (lit > 0) { x.strokeStyle = GOLD; x.lineWidth = 13; x.lineCap = 'round'; x.beginPath(); x.arc(c[0], c[1], R0 * 1.17, up, up + (lit - 0.5) / n * 2 * Math.PI + (lit >= n ? Math.PI / n : 0)); x.stroke(); }
      for (let k = 0; k < n; k++) { const a = up + k * 2 * Math.PI / n, q0 = c[0] + Math.cos(a) * R0 * 1.17, q1 = c[1] + Math.sin(a) * R0 * 1.17, on = k < lit, sz = on ? 20 : 15;
        x.fillStyle = '#fbf8ee'; x.strokeStyle = on ? GOLD : PENCIL; x.lineWidth = on ? 8 : 5.5; x.lineCap = 'round'; x.lineJoin = 'round'; x.globalAlpha = on ? 1 : 0.85; x.beginPath();
        if (k % 4 === 0) { x.moveTo(q0, q1 - sz); x.lineTo(q0 + sz, q1 + sz * 0.8); x.lineTo(q0 - sz, q1 + sz * 0.8); x.closePath(); }
        else if (k % 4 === 1) x.arc(q0, q1, sz * 0.85, 0, 6.3);
        else if (k % 4 === 2) { x.moveTo(q0, q1 - sz); x.lineTo(q0 + sz, q1); x.lineTo(q0, q1 + sz); x.lineTo(q0 - sz, q1); x.closePath(); }
        else { x.rect(q0 - sz * 0.8, q1 - sz * 0.8, sz * 1.6, sz * 1.6); }
        x.fill(); if (on) { x.fillStyle = GOLD; x.fill(); } x.stroke(); x.globalAlpha = 1; }
      // what a full circle gives, written at its foot
      hand(x, 30); x.textAlign = 'right'; x.fillStyle = lit >= n - 1 ? GOLD : PENCIL; x.fillText('times ' + g.ringMul, c[0] - R0 * 1.17 - 34, c[1] + 10);
      if (fl > 0) dirty = true; }
    st.stains.forEach(k => { const c = px(k); if (k.ring) { x.strokeStyle = 'rgba(120,70,20,' + (k.a * 1.6) + ')'; x.lineWidth = k.r * 0.16; x.beginPath(); x.ellipse(c[0], c[1], k.r, k.r * 0.9, 0.3, 0, 7); x.stroke(); } else { x.fillStyle = 'rgba(150,80,20,' + k.a + ')'; x.beginPath(); x.ellipse(c[0], c[1], k.r, k.r * 0.8, 0.5, 0, 7); x.fill(); } });
    // ink thrown off by the last reaction
    if (false && g && st.shown >= st.quota && st.quota > 0) { const ov = Math.log2(Math.max(1, st.shown / st.quota)), c = px({ x: FLASK.x, z: FLASK.z + 0.9 }), r = Math.min(140, 46 + 20 * ov); x.globalAlpha = 0.3; x.fillStyle = flask.hex; x.beginPath(); x.ellipse(c[0], c[1], r * 1.25, r * 0.6, 0.05, 0, 6.3); x.fill(); x.beginPath(); x.ellipse(c[0] + r * 0.9, c[1] + r * 0.2, r * 0.45, r * 0.25, 0.4, 0, 6.3); x.fill(); x.beginPath(); x.ellipse(c[0] - r, c[1] - r * 0.1, r * 0.35, r * 0.2, -0.3, 0, 6.3); x.fill(); x.globalAlpha = 1; }
    st.slashes = st.slashes.filter(q => now - q.t < 520); st.slashes.forEach(q => { const k = (now - q.t) / 520, head = Math.min(1, k * 4), tail = Math.max(0, k * 2.2 - 1), a = px({ x: q.x - q.dx / 2, z: q.z - q.dz / 2 }), b = px({ x: q.x + q.dx / 2, z: q.z + q.dz / 2 }); x.globalAlpha = 0.45 * (1 - k * k); flick(x, a, b, tail, head, q.w * 1.3, q.col, (hash(String(Math.round(q.t + q.x * 97))) - 0.5) * 0.35); x.globalAlpha = 1; });
    st.blots = st.blots.filter(b => now - b.t < 700); st.blots.forEach(b => { const k = (now - b.t) / 700, c = px(b); x.globalAlpha = (0.55 + 0.4 * st.fury) * (1 - k); if (b.line) { const c2 = px({ x: b.x + (b.x2 - b.x) * 0.55, z: b.z + (b.z2 - b.z) * 0.55 }), head = Math.min(1, k * 5), tail = Math.max(0, k * 2.4 - 0.6); flick(x, c, c2, Math.min(tail, head), head, b.r * 1.8, b.col, 0); } else { x.fillStyle = b.col; x.beginPath(); x.arc(c[0], c[1], b.r * (0.6 + k), 0, 7); x.fill(); } }); x.globalAlpha = 1;
    // circled in ink on the page: what each product changed, and on the middle molecule where the reagent under the pointer acts
    const circle = (m, k, col, lw) => { const sc = m.group.scale.x, c = px({ x: m.group.position.x + k.x * sc, z: m.group.position.z + k.z * sc }), r = k.r * sc * U; x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.beginPath(); x.ellipse(c[0], c[1], r * 1.05, r, 0.1, 0.25, 6.7); x.stroke(); };
    // the atoms the last reaction changed stay marked in yellow while the row is open: react there and the row goes on
    if (false && center && center.hot.length && g.cur.path.length && st.mode !== 'done' && !(CUT.includes('a') && st.peek)) { const pk = st.peek, sc = center.group.scale.x;
      center.hot.forEach(k => { const c = mpx({ x: C0.x + k.x * sc, z: C0.z + k.z * sc + 1.25 }); swipe(x, [c[0] - 30, c[1] + 12], [c[0] + 30, c[1] + 8], 12, pk && pk.breaks ? 'rgba(160,160,160,0.4)' : HILITE); }); }
    if (center && st.mode !== 'done') { if (!center.frost) center.frost = frostOf(center.model); if (center.frost.length) { const sc = center.group.scale.x, gp = a => { const p = center.at.get(a), t = -p.y / camDir.y; return mpx({ x: C0.x + (p.x + camDir.x * t) * sc, z: C0.z + (p.z + camDir.z * t) * sc }); };
      center.frost.forEach(ring => { if (ring.some(a => !center.at.get(a))) return; const pts = ring.map(gp); let cx = 0, cy = 0; pts.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= pts.length; cy /= pts.length; x.fillStyle = 'rgba(126,190,226,0.42)'; x.strokeStyle = 'rgba(79,159,196,0.8)'; x.lineWidth = 4; x.lineJoin = 'round'; x.beginPath(); pts.forEach((p, k) => { const X = cx + (p[0] - cx) * 1.22, Y = cy + (p[1] - cy) * 1.22; if (k) x.lineTo(X, Y); else x.moveTo(X, Y); }); x.closePath(); x.fill(); x.stroke(); }); } }
    if (false && center && center.flat && !(morph && morph.m === center)) { const sc = center.group.scale.x, gp = a => { const p = center.at.get(a), t = -p.y / camDir.y; return mpx({ x: C0.x + (p.x + camDir.x * t) * sc, z: C0.z + (p.z + camDir.z * t) * sc }); }; x.strokeStyle = 'rgba(43,38,34,0.55)'; x.lineCap = 'round'; center.sticks.forEach(s => { if (s.a.el === 'H' || s.b.el === 'H') return; const a = gp(s.a), b = gp(s.b); x.lineWidth = s.parts.length > 2 ? 11 : 6; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); }); }
    // a page turning: a leaf of paper sweeps across from the right, its edge shaded
    if (st.turned && now - st.turned < 420) { const k = (now - st.turned) / 420, e = 1 - Math.pow(1 - k, 3), xe = IW * (1 - e), w = IW * 0.22 * Math.sin(k * Math.PI); x.fillStyle = 'rgba(243,237,220,' + (0.9 * (1 - k)).toFixed(3) + ')'; x.fillRect(xe, 0, IW - xe, IH); const gr = x.createLinearGradient(xe - w, 0, xe, 0); gr.addColorStop(0, 'rgba(60,50,30,0)'); gr.addColorStop(1, 'rgba(60,50,30,' + (0.28 * (1 - k)).toFixed(3) + ')'); x.fillStyle = gr; x.fillRect(xe - w, 0, w, IH); dirty = true; }
    // each group is lettered on the page under it. One that has gone is struck through, one that is new is written in
    if (center && center.groups && st.mode !== 'done' && !CUT.includes('b')) { const sc = center.group.scale.x, at2 = q => mpx({ x: C0.x + q.x * sc, z: C0.z + q.z * sc + 1.25 });
      center.groups.forEach(q => { const age = q.born ? (now - q.t) / 1000 : 9; if (q.born && !(age >= 0)) return; const c = at2(q); if (MOLV === 'pads') { const c0 = mpx({ x: C0.x + q.x * sc, z: C0.z + q.z * sc }); x.fillStyle = 'rgba(' + PADC[q.txt] + ',0.3)'; x.beginPath(); x.ellipse(c0[0], c0[1], 30 * sc, 22 * sc, 0.1, 0, 6.3); x.fill(); } const pop = age < 0.25 ? 1.7 - 2.8 * age : 1; hand(x, 40 * pop); x.textAlign = 'center'; x.lineJoin = 'round'; x.lineWidth = 8; x.strokeStyle = '#fbf8ee'; x.strokeText(q.txt, c[0], c[1]); x.fillStyle = age < 1.2 ? REDINK : INK; x.fillText(q.txt, c[0], c[1]); if (age < 1.2) dirty = true; });
      (center.ghosts || []).forEach(q => { const age = (now - q.t) / 1000, c = at2(q); if (age > 1.3) return; hand(x, 40); x.textAlign = 'center'; x.globalAlpha = age < 0 ? 1 : Math.max(0, 1 - age / 1.3); x.fillStyle = age < 0 ? INK : PENCIL; x.fillText(q.txt, c[0], c[1]); if (age >= 0) { const w = x.measureText(q.txt).width / 2 + 8, k = Math.min(1, age / 0.12); x.strokeStyle = REDINK; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(c[0] - w, c[1] - 6); x.lineTo(c[0] - w + 2 * w * k, c[1] - 14); x.stroke(); } x.globalAlpha = 1; dirty = true; }); }
    if (st.mode !== 'done') {
      const t0 = px(TALLY), n = 0, sa = 9; x.strokeStyle = INK; x.lineCap = 'round';
      const full = sa < 0.9, shown = full ? 4 : n; for (let k = 0; k < Math.min(4, shown); k++) { x.lineWidth = 6; x.beginPath(); x.moveTo(t0[0] + k * 20 + 3 * hash('ta' + k), t0[1]); x.lineTo(t0[0] + k * 20 - 4, t0[1] - 58 * (k === shown - 1 && !full ? 1 - 0.5 * st.byBump.gauge * 0 : 1)); x.stroke(); }
      if (full) { const k2 = Math.min(1, sa / 0.14); x.globalAlpha = sa > 0.6 ? 1 - (sa - 0.6) / 0.3 : 1; x.strokeStyle = REDINK; x.lineWidth = 8; x.beginPath(); x.moveTo(t0[0] - 16, t0[1] - 8); x.lineTo(t0[0] - 16 + 100 * k2, t0[1] - 8 - 42 * k2); x.stroke(); x.globalAlpha = 1; dirty = true; } }
    // pointing at a reaction rings the places it will change, in its color
    // pointing at a reaction underlines the groups it will change, in its color (no discs: circles on the molecule are a rejected look)
    // a step of a cascade: for the instant before two parts join, a thin dashed pencil arc bows out from the OH to the C=O
    // with a small arrowhead. It is gone before the ring starts to close, and it is not drawn like a bond
    if (st.pair && st.pair.a && st.pair.b && center && st.mode !== 'done' && !fe() && now - st.pair.t < Math.max(800, st.pair.ms * 0.9)) { const sc = center.group.scale.x, el = now - st.pair.t, A = mpx({ x: C0.x + st.pair.a.x * sc, z: C0.z + st.pair.a.z * sc }), B = mpx({ x: C0.x + st.pair.b.x * sc, z: C0.z + st.pair.b.z * sc }), fade = el > Math.max(600, st.pair.ms * 0.7) ? 0.5 : 1;
      x.save(); x.globalAlpha = fade; x.fillStyle = INK; x.lineJoin = 'round';
      
      { const bx2 = molBox(); if (bx2 && el > 80) { const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, lx = Math.max(bx2.l + 30, Math.min(bx2.r - 30, mx)); x.lineWidth = 4; x.lineCap = 'round'; x.strokeStyle = PENCIL; x.globalAlpha = fade * 0.8; x.beginPath(); x.moveTo(mx, my + 74); x.lineTo(lx, bx2.b + 16); x.stroke(); } }
      x.restore(); dirty = true; }
    if (g && center && (st.mode === 'play' || st.mode === 'move' || st.mode === 'done')) { const bx = molBox(); if (bx) { const rx = (bx.r - bx.l) / 2 + 36, gr = x.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, 'rgba(' + SHADE + ',' + SHADA + ')'); gr.addColorStop(1, 'rgba(' + SHADE + ',0)'); x.save(); x.translate((bx.l + bx.r) / 2, bx.b - 14); x.scale(1, 0.13); x.fillStyle = gr; x.beginPath(); x.arc(0, 0, rx, 0, 6.3); x.fill(); x.restore(); } }
    // a piece picked up: a short ink tick under each place it can go. The place under the pointer shows what would happen in
    // lines and letters only: what goes is drawn over heavy in red, what comes is a ghost of bonds, a new group is its word
    if (st.tool && st.toolList && center && lining()) { const sc = center.group.scale.x, P2 = q => mpx({ x: C0.x + q.x * sc, z: C0.z + q.z * sc }), r = 1.0 * sc * U, seg = (a, b) => { x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); };
      x.strokeStyle = INK; x.lineCap = 'round'; x.lineWidth = 6; x.globalAlpha = 0.85; st.toolList.forEach(q => { if (q.whole || q === st.toolSpot) return; const c = P2(q), dead = q.worth === 0; x.strokeStyle = dead ? PENCIL : INK; x.globalAlpha = dead ? 0.45 : 0.85; seg([c[0] - 1, c[1] + r * 0.8], [c[0] + 2, c[1] + r * 0.8 + 22]); if (q.worth != null) { hand(x, 24); x.textAlign = 'center'; x.fillStyle = dead ? PENCIL : INK; x.fillText(String(q.worth), c[0] + 1, c[1] + r * 0.8 + 46); } }); x.strokeStyle = INK; x.globalAlpha = 0.85;
      const h = st.toolList.length === 1 && st.toolList[0].whole ? st.toolList[0] : st.toolSpot;
      if (h) { if (h.goneB) { x.globalAlpha = 0.6; x.strokeStyle = REDINK; x.lineWidth = Math.max(10, 0.3 * sc * U); h.goneB.forEach(b => seg(P2(b[0]), P2(b[1]))); }
        if (h.ghost) { x.globalAlpha = 0.45; x.strokeStyle = INK; x.lineWidth = Math.max(4, 0.16 * sc * U); x.setLineDash([10, 9]); const gs = h.ghost.sc, G2 = q => mpx({ x: C0.x + q.x * gs, z: C0.z + q.z * gs }); x.lineWidth = Math.max(4, 0.16 * gs * U); if (h.ghost.join) seg(G2(h.ghost.join[0]), G2(h.ghost.join[1])); x.setLineDash([]); h.ghost.bonds.forEach(b => seg(G2(b[0]), G2(b[1]))); hand(x, Math.max(22, 0.55 * gs * U)); x.textAlign = 'center'; x.fillStyle = REDINK; x.globalAlpha = 0.6; h.ghost.os.forEach(q => { const c = G2(q); x.fillText('O', c[0], c[1] + 9); }); }
        else if (h.words || st.tool === 'burette') { /* the word of what each part becomes is written over it, below */ }
        else if (st.tool === 'mortar') { x.globalAlpha = 0.85; x.strokeStyle = REDINK; x.lineWidth = Math.max(9, 0.3 * sc * U); seg(P2(h.at[0]), P2(h.at[1] || h.at[0])); }
        else if (st.tool === 'bunsen') { x.globalAlpha = 0.9; x.strokeStyle = REDINK; x.lineWidth = 6; h.at.forEach(q => { const c = P2(q); seg([c[0] - r * 0.7, c[1] + r * 0.45], [c[0] + r * 0.7, c[1] - r * 0.45]); }); }
        else if (st.tool === 'crystal') { x.globalAlpha = 0.9; x.strokeStyle = h.worth === 0 ? PENCIL : '#2f78a0'; x.lineWidth = 7; h.at.forEach(q => { const c = P2(q); seg([c[0], c[1] - r * 0.25], [c[0] + 2, c[1] - r * 0.95]); }); }
        else if (!h.goneB) { x.globalAlpha = 0.9; x.strokeStyle = '#2f78a0'; x.lineWidth = 7; h.at.forEach(q => { const c = P2(q); seg([c[0] - r * 0.6, c[1] + r * 0.7], [c[0] + r * 0.6, c[1] + r * 0.66]); }); }
        const word = st.tool === 'crystal' ? 'OH' : st.tool === 'bunsen' ? 'C=C' : st.tool === 'burette' ? 'C=O' : ''; if (word || h.words) { hand(x, 30); x.textAlign = 'center'; x.globalAlpha = 0.9; x.fillStyle = h.worth === 0 ? PENCIL : '#2f78a0'; h.at.forEach((q, i) => { const c = P2(q); x.fillText(h.words ? h.words[i] || '' : word, c[0], c[1] - r - 8); }); }
        // what the place under the pointer is worth, before the click: the steps it would zip. A place that starts nothing says 0 and is struck through in pencil
        if (h.worth != null && !h.whole) { const c = P2(h), y = c[1] + r * 0.8 + 62; marker(x, 44); x.textAlign = 'center'; x.globalAlpha = 1; x.lineJoin = 'round'; x.lineWidth = 9; x.strokeStyle = '#fbf8ee'; x.strokeText(String(h.worth), c[0], y); x.fillStyle = h.worth === 0 ? PENCIL : INK; x.fillText(String(h.worth), c[0], y); if (h.worth === 0 && st.tool === 'crystal') { x.strokeStyle = PENCIL; x.lineWidth = 5; h.at.forEach(q => { const c2 = P2(q); seg([c2[0] - 26, c2[1] - r - 12], [c2[0] + 26, c2[1] - r - 24]); }); } } }
      x.globalAlpha = 1; }
    // ink that runs from a reagent to a place, and from a place to the equipment it sets off
    st.strokes = st.strokes.filter(q => now - q.t < q.dur + 260); st.strokes.forEach(q => {
      const age = now - q.t, k0 = Math.min(1, age / q.dur), head = k0 * k0, tail = age < q.dur ? Math.max(0, head - 0.55) : Math.min(1, 0.45 + (age - q.dur) / 130 * 0.55), a = px(q.a), b = px(q.b), bow = (hash(String(Math.round(q.t))) - 0.5) * 0.5;
      x.globalAlpha = 0.92; flick(x, a, b, tail, head, 22, q.col, bow);
      if (age >= q.dur) { const k = (age - q.dur) / 260; x.globalAlpha = 0.85 * (1 - k); splat(x, b, 16 + 26 * Math.sqrt(k), q.col, String(Math.round(q.t))); }
      x.globalAlpha = 1; });
    if (false && play && g && g.nextHand && g.nextHand.length) { const n0 = px({ x: 20.6, z: 12.4 }), nn = Math.min(5, g.nextHand.length), cw = 62; for (let j = 0; j < nn; j++) { const tl = TILE[g.nextHand[j]]; if (!tl) continue; x.save(); x.translate(n0[0] - (nn - 1) * cw / 2 + j * cw + 0, n0[1]); x.scale(0.36, 0.36); fragOrChip(x, tl[0], -50, 0, false); x.strokeStyle = FAINT; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(-8, 0); x.lineTo(14, 0); x.stroke(); fragOrChip(x, tl[1], 78, 0, false); x.restore(); }
      const cx0 = px({ x: 25.5, z: 12.6 }); x.fillStyle = 'rgba(120,100,70,0.22)'; x.beginPath(); x.moveTo(cx0[0] + 30, cx0[1] - 70); x.lineTo(cx0[0] + 30, cx0[1] + 30); x.lineTo(cx0[0] - 70, cx0[1] + 30); x.closePath(); x.fill(); x.strokeStyle = PENCIL; x.lineWidth = 3; x.stroke(); }
    // the arrows out of the molecule, and what each one does. Yellow marks the ones that continue the run
    if (play && !BENCHV) slots.forEach((s, i) => {
      if (!s) return;
      const o = s.o, hov = st.hover === i, card = RX.CARDS[s.id], verb = card.verb.toLowerCase(), m = px(LAB[i]), e = ends(i), col = o ? INK : FAINT;
      if (o && !SIDE) { arrow(x, e.a, e.b, hov ? 9 : 6, col, o.loop ? [14, 12] : null); }
      
      x.save(); x.translate(m[0], m[1]); { const rs = Math.min(1.62, SLOTW / 2.35) * (hov && o ? 1.08 : 1); x.scale(rs, rs); } x.translate(16, 8);
      { const tl = TILE[s.id] || ['', ''], on = !!o;
        
        if (on) fragOrChip(x, tl[0], -78, -8, true); else { fragOrChip(x, tl[0], -78, -8, false); x.strokeStyle = PENCIL; x.lineWidth = 3; x.setLineDash([8, 8]); x.beginPath(); x.ellipse(-78, -8, 52, 34, 0, 0, 6.3); x.stroke(); x.setLineDash([]); } x.strokeStyle = on ? INK : FAINT; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(-26, -8); x.lineTo(-2, -8); x.moveTo(-14, -18); x.lineTo(-2, -8); x.lineTo(-14, 2); x.stroke(); fragOrChip(x, tl[1], 46, -8, on);

        
        // uses left: one drop each, on the reagent's own chip. One placed in a circle is an empty drop
        if (!s.fin && !usesHidden()) { const qd = P.queued(g, s.id), nL = Math.min(6, Math.max(0, (g.left[s.id] || 0) - qd)); x.globalAlpha = on ? 1 : 0.5;
          if (g.free && g.free[s.id]) { x.strokeStyle = INK; x.lineWidth = 4; x.beginPath(); x.ellipse(-120, 26, 9, 6.5, 0, 0, 6.3); x.moveTo(-93, 26); x.ellipse(-102, 26, 9, 6.5, 0, 0, 6.3); x.stroke(); }
          else { /* uses left are not drawn as drops any more */ }
          x.globalAlpha = 1; }
        if (hov && o) { x.strokeStyle = INK; x.lineWidth = 5; x.beginPath(); x.moveTo(-110, 36); x.lineTo(80, 34); x.stroke(); } }
      x.restore();
    });
    // the three numbers that multiply into what is made: places, row and extra. Each jumps when it changes
    if (false) {
      const mp = px(FEWER ? { x: MULT.x + 0.6, z: MADE.z + 2.9 } : FORM), len = g.cur.path.length; x.save(); if (FEWER) { x.translate(mp[0], mp[1]); x.scale(0.6, 0.6); x.translate(-mp[0], -mp[1]); }
      { const mult = st.R * st.E, liveP = st.P > 0, liveM = mult > 1.0001, kp = 1 + 0.25 * st.bump.p, km = 1 + 0.25 * Math.max(st.bump.r, st.bump.e), tP = fmt(st.P), tM = fmtB(mult); x.textAlign = 'left';
        // the two numbers that multiply into the total, written small under it in the page's hand
        hand(x, 46); const wP = x.measureText(tP).width; hand(x, 32); const wT = x.measureText('times').width; hand(x, 46); const wM = x.measureText(tM).width, x2 = mp[0] + wP + 22, x3 = x2 + wT + 22, c1 = mp[0] + wP / 2, c3 = x3 + wM / 2; st.fW = x3 + wM - mp[0];
        hand(x, 46 * kp); x.fillStyle = liveP ? PART.p : FAINT; x.fillText(tP, mp[0], mp[1]); hand(x, 32); x.fillStyle = liveP ? PENCIL : FAINT; x.fillText('times', x2, mp[1] - 3); hand(x, 46 * km); x.fillStyle = liveM ? PART.r : FAINT; x.fillText(tM, x3, mp[1]);
        // what the reaction under the pointer would add to each, and what it would make
        if (st.peek && !st.peek.quiet) { const pk = st.peek, dM = (st.R + pk.dR) * (st.E + pk.dE) - mult; marker(x, 34); x.textAlign = 'center';
          if (Math.abs(pk.dP) >= 0.5) { x.fillStyle = PART.p; x.fillText((pk.dP > 0 ? '+' : '') + fmt(pk.dP), c1, mp[1] - 70); }
          if (Math.abs(dM) >= 0.005) { x.fillStyle = dM < 0 ? PENCIL : PART.r; x.fillText((dM > 0 ? '+' : '') + fmtB(dM), c3, mp[1] - 70); }
          const gq = px(MADE); marker(x, 46); x.textAlign = 'left'; x.fillStyle = '#8a6a00'; x.fillText('+' + fmt(pk.gain), gq[0] + 6, gq[1] - 104); } }
      // one small chevron for each reaction in the row that is open
      x.restore();
    }
    // equipment: a short token beside it. Its name and what it does are written out only under the pointer
    kitObjs.forEach((k, i) => {
      if (now - (k.born || 0) < 380) { dirty = true; return; }
      const q = P.GEARS[k.id], kp = KITP(i), sideK = KITV === 'side', c = px(sideK ? { x: kp.x + 2.3, z: kp.z + 0.9 } : { x: kp.x, z: kp.z + (KITV === 'back' ? 2.9 : 3.6) }), f = st.fired[k.id], age = f ? (now - f.t) / 1000 : 9, lv = run.lv[k.id] || 1;
      const tokNow = k.id === 'paw' ? (3 - (run.wishes || 0)) + ' wishes' : k.id === 'orb' && g && g.fore ? (g.fore.filter(id => !g.kinds.includes(id)).map(id => '+' + RX.CARDS[id].verb.toLowerCase()).concat(g.kinds.filter(id => !g.fore.includes(id)).map(id => '-' + RX.CARDS[id].verb.toLowerCase())).slice(0, 3).join(' ') || 'same') : q.tok || '';
      const spent = q.tool && g && ((g.tools || {})[k.id] || 0) >= P.TOOLUSES, tl2 = String(tokNow).split('|'); let tw = 0; [].forEach((ln, li) => { tw = Math.max(tw, inkLine(x, ln, c[0], c[1] + li * 27, sideK ? 28 : 26, spent ? FAINT : INK, sideK ? 'left' : undefined)); }); if (st.tool === k.id) { x.strokeStyle = INK; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(c[0] - 62, c[1] + 36); x.lineTo(c[0] + 62, c[1] + 33); x.stroke(); }
      for (let n = 1; n < lv; n++) { x.fillStyle = INK; x.beginPath(); x.arc(c[0] + tw / 2 + 18 + (n - 1) * 20, c[1] - 12, 6, 0, 6.3); x.fill(); }
      if (st.kitHover === i) { const h0 = px(sideK ? { x: kp.x + 9, z: kp.z - 1.2 } : KITV === 'back' ? { x: kp.x, z: kp.z + 5 } : { x: kp.x, z: kp.z - 6.4 }); x.lineJoin = 'round'; x.textAlign = 'center'; x.strokeStyle = '#f3eddc';
        hand(x, 40); x.lineWidth = 14; x.strokeText(q.name, h0[0], h0[1]); x.fillStyle = INK; x.fillText(q.name, h0[0], h0[1]);
        hand(x, 28); wrap(x, q.note, 380).forEach((ln, j) => { x.lineWidth = 12; x.strokeText(ln, h0[0], h0[1] + 34 + j * 30); x.fillStyle = PENCIL; x.fillText(ln, h0[0], h0[1] + 34 + j * 30); }); }
      if (age < 0.7 && !PLAIN) { const up = px(sideK ? { x: kp.x + 7.5 + 1.2 * age, z: kp.z - 0.6 } : KITV === 'back' ? { x: kp.x, z: kp.z + 4.6 + (i % 2) * 1.2 + 1.2 * age } : { x: kp.x, z: kp.z - 4.2 - (i % 2) * 1.5 - 1.2 * age }); fit(x, f.txt, 58 * (age < 0.08 ? 1.3 : 1), 160, marker); x.textAlign = 'center'; x.globalAlpha = 1 - age / 0.7; x.lineWidth = 12; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(f.txt, up[0], up[1]); x.fillStyle = f.col || k.col; x.fillText(f.txt, up[0], up[1]); x.globalAlpha = 1; }
    });
    // the round of the run, the pages, and a circle for each reaction on this page
    // the round, and a box for each turn of it: ticked as the turn is used, like a checklist in a notebook
    if (st.mode !== 'done') { const r0 = px(SHP && SHP.round ? SHP.round : { x: STEP.x - 1.3, z: -6.0 }); marker(x, 78); x.textAlign = 'left'; x.fillStyle = INK; const rt = String(run.round); x.fillText(rt, r0[0], r0[1] + 6); const bx0 = r0[0] + x.measureText(rt).width + 34, np = P.pagesOf(g), used = g.page - 1 + (st.firing || g.pageSteps > 0 ? 1 : 0); if (st.tickN !== used) { st.tickN = used; st.tickT = now; }
      const jit = (q, a) => Math.sin(q * 12.9898 + 1.3) * a;
      for (let k = 0; k < np; k++) { const bx = bx0 + k * 62, by = r0[1] - 38, on = k < used, cur = k === g.page - 1; x.strokeStyle = on || cur ? INK : PENCIL; x.lineWidth = cur ? 5 : 3.5; x.lineJoin = 'round'; x.lineCap = 'round'; x.beginPath(); x.moveTo(bx + jit(k * 3.1, 2), by + jit(k * 1.7, 2)); x.lineTo(bx + 38, by + 2 + jit(k * 2.3, 2)); x.lineTo(bx + 36 + jit(k * 4.1, 2), by + 38); x.lineTo(bx + 1, by + 36 + jit(k * 5.3, 2)); x.closePath(); x.stroke();
        if (on) { const tk = k === used - 1 ? Math.max(0, Math.min(1, (now - (st.tickT || 0)) / 260)) : 1, e1 = Math.min(1, tk / 0.4), e2 = Math.max(0, (tk - 0.4) / 0.6); if (tk < 1) dirty = true; x.strokeStyle = GREEN; x.lineWidth = 7; x.beginPath(); x.moveTo(bx + 6, by + 18); x.lineTo(bx + 6 + 10 * e1, by + 18 + 13 * e1); if (e2 > 0) x.lineTo(bx + 16 + 30 * e2, by + 31 - 44 * e2); x.stroke(); } }
    }
    { const hh = g.spec || g.hurdle || st.hurdle; if (hh && st.mode !== 'done') { const hp = px(SHP && SHP.goal ? SHP.goal : BENCHV ? { x: -29.6, z: -17.3 } : { x: -26.0, z: -16.6 }); drawSpec(g, hp[0], hp[1], hh, { metT: st.specMetT, size: 170, goal: true, room: (SHP && SHP.goal ? SHP.goal.room : 17.2) * U }); const nd = needNow(); if (nd) { const np = px(SHP && SHP.need ? SHP.need : { x: -9.6, z: -15.7 }), on = !!st.needT, age = on ? now - st.needT : 0; try { AA.rxMarks.yieldMark(x, 0, np[0], np[1], 34, { pencil: 'rgba(200,38,28,0.7)', plw: 3, ink: on ? GREEN : REDINK, lw: 8, t: 1 }); } catch (e) { /* no marks */ } marker(x, 60); x.textAlign = 'left'; x.fillStyle = on ? GREEN : REDINK; x.fillText(fmtK(nd), np[0] + 52, np[1] + 22); if (on) { const u = Math.min(1, age / 260), tx0 = np[0] + 66 + x.measureText(fmtK(nd)).width; x.strokeStyle = GREEN; x.lineWidth = 10; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(tx0, np[1] - 2); x.lineTo(tx0 + 16 * Math.min(1, u * 2), np[1] - 2 + 16 * Math.min(1, u * 2)); if (u > 0.5) x.lineTo(tx0 + 16 + 30 * (u - 0.5) * 2, np[1] + 14 - 50 * (u - 0.5) * 2); x.stroke(); if (u < 1) dirty = true; } } } }
    if (st.mode !== 'done' && LEGEND) drawMotifs(g);
    if (false && g.brief !== 'plain') { const B = P.BRIEF[g.brief], b0 = px({ x: EDGE, z: PAGES.z - 2.0 }); hand(x, 36); x.textAlign = 'left'; x.fillStyle = INK; x.fillText(B.name, b0[0], b0[1]); inkLine(x, B.note, b0[0] + x.measureText(B.name).width + 22, b0[1], 30, PENCIL, 'left'); }
    if (false && !FEWER && st.mode !== 'done') for (let k = 1; k <= P.pagesOf(g); k++) { const c = px({ x: PAGES.x + (k - 1) * 1.8, z: PAGES.z }); hand(x, 46); x.textAlign = 'center'; x.fillStyle = k === g.page ? INK : k < g.page ? PENCIL : FAINT; x.fillText(String(k), c[0], c[1] + 14); if (k === g.page) ring(x, [c[0], c[1]], 28, 26, 4, INK); }
    // one circle for each reaction on this page. A done one is filled with the color of its reagent, and yellow joins those in a row
    const tr = g.trail.slice(st.pageStart).filter(t => !t.free);
    for (let k = 1; k < (st.mode === 'done' ? 1 : tr.length); k++) if (tr[k].cont) { const a0 = px({ x: STEP.x + (k - 1) * STEPD, z: STEP.z }), b0 = px({ x: STEP.x + k * STEPD, z: STEP.z }); x.strokeStyle = PART.r; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(a0[0] + 34, a0[1] + 40); x.lineTo(b0[0] - 34, b0[1] + 40); x.stroke(); }
    const cross = (c, col) => { x.strokeStyle = col; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(c[0] - 15, c[1] - 13); x.lineTo(c[0] + 15, c[1] + 13); x.moveTo(c[0] + 15, c[1] - 13); x.lineTo(c[0] - 15, c[1] + 13); x.stroke(); };
    // the three places of this turn: large, numbered, and filled with the reagent's own picture and name as it is chosen
    for (let k = 0; k < (st.mode === 'done' ? 0 : P.stepsOf(g)); k++) { const c = px({ x: STEP.x + k * STEPD, z: STEP.z }), qi = k - g.pageSteps, qid = st.mode !== 'done' && qi >= 0 && g.queue ? g.queue[qi] : null, tdone = k < g.pageSteps ? tr[k] : null, id = qid || (tdone && !tdone.wasted && !tdone.bank ? tdone.id : null);
      // a reagent that has just been chosen drops into its place
      const key = 'q' + k + ':' + (qid || ''); st.slotT = st.slotT || {}; if (qid && st.slotT.key !== undefined && !st.slotT[key]) st.slotT[key] = now; if (!qid) Object.keys(st.slotT).forEach(q => { if (q.indexOf('q' + k + ':') === 0) delete st.slotT[q]; }); st.slotT.key = 1;
      const age = qid && st.slotT[key] ? (now - st.slotT[key]) / 260 : 9, pop = age < 1 ? 1 + 0.35 * (1 - age) * Math.cos(age * 7) : 1; if (age < 1) dirty = true;
      ring(x, c, 54, 50, id ? 6 : 5, id || qi === (g.queue ? g.queue.length : 0) ? INK : PENCIL, 0.1 * k);
      { hand(x, 40); x.textAlign = 'center'; x.fillStyle = PENCIL; x.fillText(String(k + 1), c[0] - 46, c[1] - 48); }
      // a reagent that had nothing to act on when its turn came is not crossed out (a cross read as "wrong"): its picture fades out of its circle and the circle is left empty
      if (tdone && tdone.wasted) { st.wasteT = st.wasteT || {}; const wk = (g.page || 0) + ':' + k + ':' + tdone.id; if (!st.wasteT[wk]) st.wasteT[wk] = now; const wu = Math.min(1, (now - st.wasteT[wk]) / 900), tl = TILE[tdone.id]; if (wu < 1 && tl) { x.save(); x.translate(c[0], c[1] + 10 * wu); x.globalAlpha = 0.8 * (1 - wu) * (1 - wu); x.scale(0.82 - 0.12 * wu, 0.82 - 0.12 * wu); fragOrChip(x, tl[1], 0, 6, true); x.restore(); dirty = true; } } else if ((tdone && tdone.bank) || qid === P.BANKID) tray(x, c[0], c[1] - 2, 0.7, INK, 5);
      else if (BENCHV && id && qid && st.bfly && now < st.bfly && qi === g.queue.length - 1) { st.slotT[key] = now; dirty = true; }
      else if (!BENCHV && id && qid && age < 0.85 && TILE[id] && slots.findIndex(q => q && q.id === id) >= 0) { // the picture flies from the shelf to its place: 220 ms, eased, landing with a small pop
        const li = slots.findIndex(q => q && q.id === id), fr = px(LAB[li]), u = Math.min(1, age / 0.85), e = 1 - Math.pow(1 - u, 3), fxp = fr[0] + (c[0] - fr[0]) * e, fyp = fr[1] + (c[1] - fr[1]) * e - 60 * Math.sin(Math.PI * u), sc2 = 1.5 + (0.82 - 1.5) * e; x.save(); x.translate(fxp, fyp); x.scale(sc2, sc2); fragOrChip(x, TILE[id][1], 0, 6, true); x.restore(); dirty = true; }
      else if (id) { const fits = !qid || !P.queueFits || P.queueFits(g)[qi] !== false, cc = rgb(colOf(id)), tl = TILE[id]; x.save(); x.translate(c[0], c[1]); x.scale(pop, pop); x.globalAlpha = (fits ? 0.28 : 0.12) * (tdone ? 0.6 : 1); x.fillStyle = cc; x.beginPath(); x.ellipse(1, 0, 46, 42, 0.2, 0, 6.3); x.fill(); x.globalAlpha = fits ? (tdone ? 0.55 : 1) : 0.35;
        if (id === P.SYN.finish) { marker(x, 40); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('F', 1, 14); } else if (tl) { x.save(); x.scale(0.82, 0.82); fragOrChip(x, tl[1], 0, 6, true); x.restore(); }
        x.restore();
        if (tdone) { x.strokeStyle = GREEN; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(c[0] + 14, c[1] + 16); x.lineTo(c[0] + 24, c[1] + 30); x.lineTo(c[0] + 46, c[1] - 6); x.stroke(); } }
    }
    // the reaction arrow after the circles fires the page
    if (P.RULE.queue && g && !g.over && (play || st.firing) && !g.chain) { const f = FIREP(), on = lineUp || !!st.homWait, hov = st.mark === 'fire' && on; arrow(x, { x: f.x - 3.6, z: f.z }, { x: f.x + 3.2, z: f.z }, hov ? 19 : 15, on ? INK : FAINT); /* no word under the arrow: the page is wordless */ }
    if (SHAPE === 'a' && run) recMock(x);
    // how much has been made, and the number to beat
    const q = px(MADE), bq = px(BEAT), beaten = st.shown >= st.quota, done = st.mode === 'done';
    if (!fe()) { const txt = fmt(st.shown), size = fit(x, txt, 112 * (1 + 0.3 * st.madeBump * Math.cos((1 - st.madeBump) * 5)), madeMax(), marker), mw = x.measureText(txt).width; st.madeW = mw; x.textAlign = 'left'; x.fillStyle = beaten || (done && st.pass) ? GREEN : done ? REDINK : INK; x.fillText(txt, q[0], q[1]);
    }
    { const marks = P.runMarks(st.quota), top = done ? g.total : st.shown, T0 = px({ x: TRK.x0, z: TRK.z }), T1 = px({ x: TRK.x1, z: TRK.z }), W = T1[0] - T0[0], y = T0[1], n = marks.length, fr = k => (k === 0 ? 0.5 : 0.5 + 0.5 * k / n), vals = [st.quota].concat(marks);
      const need = needNow(), FR = k => trackPos(k === 0 ? (need || st.quota) : marks[k - 1], need, st.quota, marks), needOn = need > 0 && (done ? top >= need : !!st.needT); let f = trackPos(top, need, st.quota, marks);
      // the track: the round's total runs along it as a line of ink toward the red flag, which is the number to beat; the flags past it are the marks, each with the coin it pays
      x.lineCap = 'round'; x.strokeStyle = FAINT; x.lineWidth = 5; x.beginPath(); x.moveTo(T0[0], y); x.lineTo(T0[0] + W * (n ? 1 : 0.5), y - 3); x.stroke();
      x.strokeStyle = FAINT; x.lineWidth = 22; x.beginPath(); x.moveTo(T0[0], y); x.lineTo(T0[0] + W * FR(0), y - 1.5); x.stroke();
      if (f > 0.002) { x.strokeStyle = (need ? needOn : beaten) ? GREEN : INK; x.lineWidth = 18; x.beginPath(); x.moveTo(T0[0], y); x.lineTo(T0[0] + W * f, y - 3 * f); x.stroke(); }
      if (!YMARKS) {
      // the finish post: a bold red bar across the track with a chequered head; it turns green and rings out once when the yield crosses it
      { const fx = T0[0] + W * 0.5, on0 = done ? top >= st.quota : !!st.passT[0], col = on0 ? GREEN : REDINK, age0 = st.passT[0] ? (now - st.passT[0]) / 700 : 9; x.strokeStyle = col; x.lineWidth = 12; x.lineCap = 'butt'; x.beginPath(); x.moveTo(fx, y - 74); x.lineTo(fx, y + 26); x.stroke(); x.lineCap = 'round';
        for (let r = 0; r < 2; r++) for (let q2 = 0; q2 < 3; q2++) { x.fillStyle = (r + q2) % 2 ? col : 'rgba(255,255,255,0.9)'; x.fillRect(fx + 6 + q2 * 16, y - 74 + r * 16, 16, 16); } x.strokeStyle = col; x.lineWidth = 3; x.strokeRect(fx + 6, y - 74, 48, 32);
        if (age0 < 1) { x.globalAlpha = 1 - age0; x.strokeStyle = GREEN; x.lineWidth = 10 * (1 - age0) + 2; x.beginPath(); x.ellipse(fx, y - 20, 60 + 260 * age0, 44 + 150 * age0, 0, 0, 6.3); x.stroke(); x.globalAlpha = 1; dirty = true; } }
      }
      if (done && !st.pass && (need ? top < need : !st.ypass)) { const gx0 = T0[0] + W * f + 8, gx1 = T0[0] + W * FR(0) - 16, kk = Math.max(0, Math.min(1, (now - (st.doneT || now) - 300) / 500)); if (gx1 > gx0 && kk > 0) { const ge = gx0 + (gx1 - gx0) * kk; x.strokeStyle = REDINK; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath(); x.moveTo(gx0, y - 4); x.lineTo(ge, y - 4); x.moveTo(gx0, y - 22); x.lineTo(gx0, y + 14); x.moveTo(ge, y - 22); x.lineTo(ge, y + 14); x.stroke(); if (kk < 1) dirty = true; } }
      if (YMARKS) vals.forEach((v0, k) => { if (need && k > 0 && Math.abs(v0 - need) <= 0.02 * need) return; const isNeed = !!need && k === 0, v = isNeed ? need : v0, pT = isNeed ? st.needT : st.passT[k], fx = T0[0] + W * FR(k), yk = y - 3 * FR(k), on = done ? top >= v : !!pT, tx = fmtK(v), age = on ? (pT ? (now - pT) : 1e6) : -1, r = k === 0 ? 40 : 27, cy = yk - r - (k === 0 ? 18 : 15), tIn = on ? Math.min(1, age / (k === 3 ? 520 : 340)) : 0;
        if (age >= 0 && age < 900) dirty = true;
        // a tick where the mark stands on the track
        x.strokeStyle = k === 0 ? REDINK : PENCIL; x.lineWidth = k === 0 ? 5 : 3; x.lineCap = 'round'; x.beginPath(); x.moveTo(fx, yk - 9); x.lineTo(fx, yk + 9); x.stroke();
        if (k > 0) { // the ring of gold wash round a bonus mark: a pale ring until passed, then it fills from the centre
          const R = r * 1.62, fill = on ? 1 - Math.pow(1 - Math.min(1, age / 420), 3) : 0; x.strokeStyle = 'rgba(217,168,42,0.5)'; x.lineWidth = 2.5; x.beginPath(); x.ellipse(fx, cy - (k > 1 ? 4 : 2), R, R * 0.97, 0, 0, 6.3); x.stroke();
          if (fill > 0) { x.fillStyle = 'rgba(226,176,52,' + (0.62 * Math.min(1, age / 160)).toFixed(3) + ')'; x.beginPath(); x.ellipse(fx, cy - (k > 1 ? 4 : 2), R * fill, R * 0.97 * fill, 0, 0, 6.3); x.fill(); }
          if (age >= 0 && age < 600) { const u = age / 600; x.globalAlpha = (1 - u) * 0.8; x.strokeStyle = 'rgba(217,168,42,1)'; x.lineWidth = 5 * (1 - u) + 1; x.beginPath(); x.ellipse(fx, cy, R * (1 + 1.4 * u), R * (1 + 1.4 * u), 0, 0, 6.3); x.stroke(); x.globalAlpha = 1; } }
        else if (age >= 0 && age < 700) { const u = age / 700; x.globalAlpha = 1 - u; x.strokeStyle = REDINK; x.lineWidth = 9 * (1 - u) + 2; x.beginPath(); x.ellipse(fx, cy, r + 8 + 230 * u, r + 8 + 140 * u, 0, 0, 6.3); x.stroke(); x.globalAlpha = 1; }
        AA.rxMarks.yieldMark(x, k, fx, cy, r, { pencil: k === 0 ? 'rgba(200,38,28,0.7)' : 'rgba(70,66,60,0.75)', plw: k === 0 ? 3.5 : 2.6, ink: k === 0 ? REDINK : INK, lw: k === 0 ? 10 : 6.5, t: tIn });
        if (isNeed) { /* the line the yield must cross: a bold bar across the track; it turns green with a tick when crossed, and is ringed in red when the round ends short of it */ const col = on ? GREEN : REDINK; x.strokeStyle = col; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath(); x.moveTo(fx, yk - 20); x.lineTo(fx + 1, yk + 22); x.stroke(); if (on) { const u = Math.min(1, age / 260); x.strokeStyle = GREEN; x.lineWidth = 11; x.lineJoin = 'round'; x.beginPath(); x.moveTo(fx + 30, cy - 4); x.lineTo(fx + 30 + 16 * Math.min(1, u * 2), cy + 14 * Math.min(1, u * 2)); if (u > 0.5) x.lineTo(fx + 46 + 34 * (u - 0.5) * 2, cy + 14 - 52 * (u - 0.5) * 2); x.stroke(); } if (done && !on) { const u = Math.max(0, Math.min(1, (now - (st.doneT || now) - 500) / 450)); inkLoop(x, fx, cy + 30, 96, 104, u, 8, REDINK); if (u < 1) dirty = true; } }
        if (k === 0) { marker(x, 56); const sp = SHP && SHP.speed ? px({ x: SHP.speed.x - 0.7, z: 0 })[0] : 1e9, hw = x.measureText(tx).width / 2, cxn = Math.min(fx + 4, sp - hw); x.textAlign = 'center'; x.fillStyle = isNeed && on ? GREEN : REDINK; x.fillText(tx, cxn, yk + 70); } else { hand(x, 26); x.textAlign = 'center'; x.fillStyle = on ? INK : PENCIL; x.fillText(tx, fx + 4, yk + 40); } });
      else {
      vals.forEach((v, k) => { const fx = T0[0] + W * fr(k), on = done ? top >= v : !!st.passT[k], tx = fmtK(v);
        if (k === 0) { marker(x, 64); x.textAlign = 'center'; x.fillStyle = on ? GREEN : REDINK; x.fillText(tx, fx + 4, y + 72); if (false && st.passT[0]) { const qw = x.measureText(tx).width / 2 + 14; strike(x, fx + 10 - qw, y + 46, fx + 10 + qw, y + 34, (now - st.passT[0]) / 120, 7, GREEN); } }
        else { if (!st.flags3) flag(x, fx, y, 40, on ? GREEN : PENCIL, on); hand(x, 26); x.textAlign = 'center'; x.fillStyle = on ? GREEN : PENCIL; x.fillText(tx, fx + 6, y + 40); if (false && on && st.passT[k]) { const mw = x.measureText(tx).width / 2 + 8; strike(x, fx + 6 - mw, y + 35, fx + 6 + mw, y + 28, (now - st.passT[k]) / 120, 5, GREEN); } if (P.RULE.coins) rcoin(x, fx + 50, y - 26, 15, on ? 1 : 0.6); } });
      }
      if (P.RULE.coins && !(YMARKS && BENCHV)) { const e = done && st.earn ? st.earn.marks + st.earn.interest + (st.earn.extra || 0) : 0; purse(x, T1[0] + 86, y - 4, run.coins || 0, 17, e); } }
    // The rest of the rack and the redraw: top right, above the hand. Each reagent that is not in the hand is a group
    // of its use dots. The redraw is a turning arrow, and beside it the one dot it costs, struck through.
    if (g && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse') && P.RULE.hand && !st.firing) {
      const rack = (g.rackIds || []).filter(id => !g.kinds.includes(id)), c = px(DRAW), can = play && P.canRedraw(g), hov = st.mark === 'draw', pay = can ? P.redrawCost(g) : null, age = st.drawT ? (now - st.drawT) / 350 : 9;
      if (!BENCHV && ((g.rackIds || []).length > g.kinds.filter(id => (g.rackIds || []).includes(id)).length || rack.length)) {
        x.save(); x.translate(c[0], c[1]); if (age < 1) { x.rotate(age * 6.283); dirty = true; }
        x.strokeStyle = can ? INK : FAINT; x.lineWidth = hov ? 10 : 7; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.arc(0, 0, 25, 0.9, 5.6); x.stroke();
        { const a = 5.6, hx = Math.cos(a) * 25, hy = Math.sin(a) * 25; x.beginPath(); x.moveTo(hx - 15, hy - 5); x.lineTo(hx, hy); x.lineTo(hx - 3, hy + 16); x.stroke(); }
        x.restore();
        if (pay && !usesHidden()) { x.strokeStyle = INK; x.lineWidth = 5; x.beginPath(); x.moveTo(c[0] + 40, c[1] + 2); x.lineTo(c[0] + 54, c[1] + 2); x.stroke(); drop(x, c[0] + 70, c[1], 9, INK, true); }
        let dx = 118; if (false) rack.forEach(id => { const nL = Math.min(8, g.left[id] || 0); x.globalAlpha = 0.6; if (!nL) { drop(x, c[0] + dx, c[1], 6, PENCIL, false); dx += 15; } for (let k = 0; k < nL; k++) { drop(x, c[0] + dx, c[1], 6, PENCIL, true); dx += 14; } x.globalAlpha = 1; dx += 13; });
      }
    }
    // The bank: a tray with an arrow into it, and what banking the open row would add now.
    if (g && play && P.RULE.bank && P.RULE.queue) { const c = px(BANK), placed = lineUp && g.queue.includes(P.BANKID), can = lineUp ? !placed && P.queueRoom(g) && !!st.view && st.view.bank : P.canBank(g), hov = st.mark === 'bank' && can;
      if (can) { if (AA.rxKit && AA.rxKit.drawCoin) AA.rxKit.drawCoin(x, c[0], c[1] - 46, 17, {}); tray(x, c[0], c[1], 0.72, INK, hov ? 8 : 6); } }
    if (g && play && P.RULE.bank && !P.RULE.queue) {
      const c = px(BANK), can = P.canBank(g), hov = st.mark === 'bank', col = can ? INK : FAINT;
      if (can || g.cur.path.length > 0) {
        x.strokeStyle = col; x.lineWidth = hov ? 9 : 6; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath();
        x.moveTo(c[0] - 34, c[1] - 14); x.lineTo(c[0] - 34, c[1] + 8); x.lineTo(c[0] + 34, c[1] + 8); x.lineTo(c[0] + 34, c[1] - 14);
        x.moveTo(c[0], c[1] - 52); x.lineTo(c[0], c[1] - 10); x.moveTo(c[0] - 13, c[1] - 24); x.lineTo(c[0], c[1] - 10); x.lineTo(c[0] + 13, c[1] - 24); x.stroke();
        hand(x, 28); x.textAlign = 'center'; x.fillStyle = can ? PENCIL : FAINT; x.fillText('bank', c[0], c[1] + 40);
        if (can) { marker(x, hov ? 44 : 38); x.textAlign = 'left'; x.fillStyle = '#8a6a00'; x.fillText('+' + fmt(P.bankGain(g)), c[0] + 50, c[1] + 4); }
      }
    }
    // a page on which nothing acts: an arrow after the page numbers turns it
    if (g && stuck() && !P.RULE.queue) { const c = px({ x: PAGES.x + 1.8 * P.pagesOf(g) - 0.3, z: PAGES.z }), hov = st.mark === 'pages'; x.strokeStyle = INK; x.lineWidth = hov ? 9 : 6; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(c[0], c[1]); x.lineTo(c[0] + 44, c[1]); x.moveTo(c[0] + 28, c[1] - 14); x.lineTo(c[0] + 44, c[1]); x.lineTo(c[0] + 28, c[1] + 14); x.stroke(); }
    // what the last reaction made, at the right end of the band, with anything a rare reagent added above it
    st.pings = st.pings.filter(q => now - q.t < 800); st.pings.forEach(q => {
      const k = (now - q.t) / 800, c = px(q), up = c[1] - 30 - 46 * (1 - Math.pow(1 - k, 2));
      if (false) { x.globalAlpha = 1 - k / 0.6; x.strokeStyle = q.ring; x.lineWidth = 7 * (1 - k / 0.6) + 2; x.beginPath(); x.ellipse(c[0], c[1], 14 + (90 + 140 * q.f) * k, 11 + (70 + 110 * q.f) * k, 0.1, 0, 6.3); x.stroke(); if (q.f > 0.4) { x.beginPath(); x.ellipse(c[0], c[1], 8 + (50 + 80 * q.f) * k, 6 + (40 + 60 * q.f) * k, 0.1, 0, 6.3); x.stroke(); } }
      x.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1; { const slam = k < 0.08 ? 2.3 - 17 * k : k < 0.16 ? 0.94 + 0.75 * (k - 0.08) : 1; marker(x, q.size * slam); x.textAlign = 'center'; x.lineJoin = 'round'; x.lineWidth = 10; x.strokeStyle = '#f3eddc'; x.save(); x.translate(c[0], up); x.rotate((hash(q.txt + Math.round(q.t)) - 0.5) * 0.16); x.strokeText(q.txt, 0, 0); x.fillStyle = q.col; x.fillText(q.txt, 0, 0); x.restore(); } x.globalAlpha = 1; });
    st.floats = st.floats.filter(f => now - f.t < 1100); { let lane = 0; st.floats.forEach(f => { f.lane = f.col === '#8a6a00' ? 0 : ++lane; }); }
    st.floats.forEach(f => { const k = (now - f.t) / 1100, rare = f.lane > 0, c = px({ x: GAIN.x, z: GAIN.z - f.lane * 2.6 - 0.5 * k }), pop = k < 0.1 ? 1.4 - 4 * k : 1; x.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1; fit(x, f.txt, Math.min(rare ? 54 : 96, f.size) * pop, 250, marker); x.textAlign = 'left'; x.lineWidth = 10; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(f.txt, c[0], c[1]); x.fillStyle = f.col || '#8a6a00'; x.fillText(f.txt, c[0], c[1]); }); x.globalAlpha = 1;
    // a line lettered across the page when something worth naming happens, or a row of ticks when the number is beaten again
    // the steps of a cascade, counted over the molecule in the page's own ink: a number and the name of the kind
    if (st.cstep && now - st.cstep.t < 1500 && (st.mode === 'play' || st.mode === 'move') && !lining() && !fe()) {
      const k = (now - st.cstep.t) / 1500, ra = ringAt(), sp = st.cstep.sp || (st.cstep.sp = spotOf(st.pair)), sq = sp ? px(sp) : null, c = sq && ra ? [Math.max(ra[3].l + 30, Math.min(ra[3].r - 30, sq[0])), ra[3].b + 44] : ra ? [ra[0], ra[1]] : px({ x: 19.4, z: -6.2 }), pop = k < 0.04 ? 1 + 6 * k : k < 0.1 ? 1.24 - 4 * (k - 0.04) : 1;
      x.save(); x.translate(c[0], c[1]); x.scale(pop, pop); x.globalAlpha = k > 0.72 ? 1 - (k - 0.72) / 0.28 : 1; marker(x, st.cstep.fresh ? Math.min(74, 52 + 4 * st.cstep.n) : 46); x.textAlign = 'center'; x.fillStyle = st.cstep.fresh ? INK : PENCIL; x.lineJoin = 'round'; x.lineWidth = 12; x.strokeStyle = '#f3eddc'; x.strokeText(String(st.cstep.n), 0, 0); x.fillText(String(st.cstep.n), 0, 0);
      if (g && g.self && g.self.length > 1) { hand(x, 36); x.fillStyle = PENCIL; x.fillText(st.cstep.name, 0, 46); } x.restore(); x.globalAlpha = 1;
    } else if (st.cstep) st.cstep = null;
    if (st.call && now - st.call.t < 1400 && st.mode !== 'fuse') {
      const k = (now - st.call.t) / 1400, c = px(LANE.w > 20 ? { x: C0.x, z: -11.2 } : { x: CALL.x + 4.6, z: CALL.z - 0.4 }), pop = (k < 0.07 ? 0.3 + 14 * k : k < 0.14 ? 1.28 - 4 * (k - 0.07) : 1) * Math.min(1.5, 1 + 0.07 * (st.chainN || 0)), al = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
      x.save(); x.translate(c[0], c[1]); x.rotate(-0.03); x.scale(pop, pop); x.globalAlpha = al;
      if (st.call.ticks) { const n = st.call.ticks, w = (n > 10 ? 3 : n) * 110; tickRow(x, 0, -24, n, 92, st.call.col); }
      else {
        fit(x, st.call.text, 50, 280, marker); x.textAlign = 'center'; const tw = x.measureText(st.call.text).width;
        x.lineWidth = 14; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(st.call.text, 0, 0); x.fillStyle = st.call.col; x.fillText(st.call.text, 0, 0);
        if (st.call.sub) { marker(x, 30); x.fillStyle = REDINK; x.textAlign = 'center'; x.strokeText(st.call.sub, 0, 40); x.fillText(st.call.sub, 0, 40); }
      }
      x.restore(); x.globalAlpha = 1;
    } else if (st.call) st.call = null;
    if (false && st.mode !== 'done' && NAMEV !== 'none' && !FEWER) {
      const zs = zones(), halo = (txt, cx, cy, size, col, font) => { (font || hand)(x, size); x.textAlign = 'center'; x.lineJoin = 'round'; x.lineWidth = 10; x.strokeStyle = '#fbf8ee'; x.strokeText(txt, cx, cy); x.fillStyle = col; x.fillText(txt, cx, cy); };
      if (NAMEV === 'words') zs.forEach(q => { const c = px({ x: q.lx, z: q.lz }); halo(q.name, c[0], c[1], 28, PENCIL); });
      if ((NAMEV === 'hover' || NAMEV === 'both') && st.tip) { const q = zs.find(k => k.id === st.tip); if (q) { const c = px({ x: q.x, z: q.z - q.r - 0.8 }); halo(q.name, c[0], c[1] - 30, 40, INK); halo(q.line, c[0], c[1] + 4, 28, PENCIL); } }
      if (NAMEV === 'point' || (NAMEV === 'both' && !meta.taught)) { const T0 = st.teach; if (!T0.t) T0.t = now + 1700;
        const nx = TEACH[T0.i + 1]; if (nx && now - T0.t > 2600 && nx.when()) { T0.i++; T0.t = now; }
        const cur = TEACH[T0.i], q = cur && zs.find(k => k.id === cur.z), age = (now - T0.t) / 1000;
        if (q && age >= 0 && age < 7) { const tgt = px({ x: q.x, z: q.z }), right = q.x > 8, from = px({ x: q.x + (right ? -7.5 : 6.5), z: q.z - 3.2 }), k = Math.min(1, age / 0.3);
          x.globalAlpha = age > 6 ? 7 - age : 1; flick(x, from, [from[0] + (tgt[0] - from[0]) * 0.86, from[1] + (tgt[1] - from[1]) * 0.86], 0, k, 20, REDINK, right ? -0.18 : 0.18);
          if (k >= 1) { const hx = from[0] + (tgt[0] - from[0]) * 0.86, hy = from[1] + (tgt[1] - from[1]) * 0.86, a = Math.atan2(tgt[1] - from[1], tgt[0] - from[0]); x.strokeStyle = REDINK; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath(); x.moveTo(hx - Math.cos(a - 0.5) * 34, hy - Math.sin(a - 0.5) * 34); x.lineTo(hx, hy); x.lineTo(hx - Math.cos(a + 0.5) * 34, hy - Math.sin(a + 0.5) * 34); x.stroke(); }
          halo(cur.say, from[0] + (right ? -40 : 40), from[1] - 26, 46, REDINK, marker); x.globalAlpha = 1; dirty = true; } }
    }
    if (LEGEND && g && P.RULE.cascade && g.self && g.self.length > 1 && (st.mode === 'play' || st.mode === 'move')) { const TOK = { aldol: 'C=O+C=O', taut: 'C=C+OH', cyclize: 'OH+OH', lactol: 'zip', enone: 'C=O+OH', ether: 'Cl+OH', aromatize: 'ring', snap: 'snap', snap6: 'snap', weld: 'weld' }, c = px({ x: -9.6, z: -17.95 }); let dx = 0; hand(x, 22); x.textAlign = 'left'; const key = g.trail.length + ':' + g.page; if (!st.selfK || st.selfK.key !== key) st.selfK = { key, on: g.self.filter(id => RX.CARDS[id].find(g.m).length) };
      g.self.forEach(id => { if (dx > 640) return; const t = TOK[id] || id, on = st.selfK.on.includes(id); x.fillStyle = on ? rgb(colOf(id)) : FAINT; x.fillText(t, c[0] + dx, c[1]); dx += x.measureText(t).width + 26; }); }
    // the family of the round's molecule and its rule, above the round
    if (g && g.m && P.stageOf(meta) >= 2 && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse')) { const c = px({ x: EDGE + 0.2, z: PAGES.z - 2.5 }); let dx = 0; [].forEach(q => { const K = P.KIN[q.id], nm = K.name + (q.lv > 1 ? ' ' + q.lv : ''); marker(x, 44); x.textAlign = 'left'; x.fillStyle = K.col; x.fillText(nm, c[0] + dx, c[1]); const w1 = x.measureText(nm).width, w2 = 0; dx += Math.max(w1, w2) + 34; }); }
    // a molecule that could react with itself: the atoms that would meet are lit, and a click on the molecule folds it
    { const o = twistOpt(); if (o && center && center.model === g.m) { const key = st.twC.key; if (!st.twM || st.twM.key !== key) st.twM = { key, marks: marksOf(center, o.atoms || [], 0.01, 0.2) };
        const sc = center.group.scale.x, hov = twistAt(); x.fillStyle = '#2f8f6a'; x.globalAlpha = (hov ? 0.62 : 0.32) + 0.08 * Math.sin(now / 320);
        st.twM.marks.forEach(k => { const c = mpx({ x: C0.x + k.x * sc, z: C0.z + k.z * sc }), r = 0.95 * sc * U; x.beginPath(); x.ellipse(c[0], c[1], r, r * 0.86, 0, 0, 6.3); x.fill(); }); x.globalAlpha = 1; dirty = true; } }
    // the gain of each step of a cascade: written at the new ring, then it travels to the total and the total takes it
    if (st.gains.length && st.mode !== 'done') { const ra = ringAt(), T0 = px(MADE); if (ra) { x.save(); x.setLineDash([3, 11]); x.strokeStyle = FAINT; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath(); x.moveTo(T0[0] + (st.madeW || 200) + 80, T0[1] - 12); x.lineTo(ra[3].r, T0[1] - 12); x.stroke(); x.restore(); }
      st.gains.forEach((q, qi) => { if (now < q.t0 || !ra) return; const spx = q.sp ? px(q.sp) : null, gy = T0[1] - 24, S0 = [Math.max(ra[3].l + 30, Math.min(ra[3].r - 30, spx ? spx[0] : px(q.gx || { x: C0.x, z: C0.z })[0])), gy], Bf = [T0[0] + (st.madeW || 200) + 80, gy], k = Math.max(0, Math.min(1, (now - q.t) / q.dur)), e = k * k, pop = now - q.t0 < 70 ? 1.25 : 1, cx = S0[0] + (Bf[0] - S0[0]) * e, cy = gy;
        x.globalAlpha = k > 0.78 ? Math.max(0, 1 - (k - 0.78) / 0.24) : 1; marker(x, (q.fresh ? 46 : 36) * pop * (1 - 0.3 * e)); x.textAlign = 'center'; x.lineJoin = 'round'; x.lineWidth = 12; x.strokeStyle = '#f3eddc'; x.strokeText(q.txt, cx, cy); x.fillStyle = q.fresh ? INK : PENCIL; x.fillText(q.txt, cx, cy); x.globalAlpha = 1; }); dirty = true; }
    // bonuses in flight: from where they were earned to the points or to the multiplier
    if (st.motes.length) { const mp2 = px(FORM), tx0 = mp2[0] + Math.max(st.fW || 260, (st.madeW || 0) + 10) + 64, tgt = { p: [tx0, mp2[1] - 24], m: [tx0, mp2[1] - 24] }; st.motes = st.motes.filter(m => now - m.t < m.dur);
      const lanes = { p: 0, m: 0 }; st.motes.forEach(m => { const k = (now - m.t) / m.dur; if (k < 0) return; const lane = lanes[m.part]++ % 3; const e = k * k * (3 - 2 * k), A = px(m.a), B = [tgt[m.part][0] + lane * 70, tgt[m.part][1]], cx = A[0] + (B[0] - A[0]) * e, cy = A[1] + (B[1] - A[1]) * e * e * e;
        marker(x, 42 - 12 * e); x.globalAlpha = Math.max(0, Math.min(1, (k - 0.2) / 0.15, (0.8 - k) / 0.2)); x.textAlign = 'center'; x.lineJoin = 'round'; x.lineWidth = 8; x.strokeStyle = '#fbf8ee'; x.strokeText(m.txt, cx, cy); x.fillStyle = m.col; x.fillText(m.txt, cx, cy); x.globalAlpha = 1; }); dirty = true; }
    // the reagent of a reaction travels from where it is listed to the place it changes, as the group it looks for,
    // and on landing shows that group and what it has become
    if (st.fly && st.mode !== 'done') { const F = st.fly, age = now - F.t; if (age > F.trav + F.hold) st.fly = null; else {
      const u = Math.min(1, age / F.trav), e = u * u * (3 - 2 * u), A = px(F.a), ci = Math.max(0, Math.min(P.stepsOf(g) - 1, (g.pageSteps || 1) - 1)), B = px({ x: STEP.x + ci * STEPD + 2.2, z: STEP.z - 1.5 }), cx = A[0] + (B[0] - A[0]) * e, cy = A[1] + (B[1] - A[1]) * e - 90 * Math.sin(Math.PI * e);
      const landed = u >= 1, k2 = landed ? (age - F.trav) / F.hold : 0, sc = 0.55 + (landed ? 0.15 * Math.max(0, 1 - k2 * 6) : 0);
      x.save(); x.translate(cx, cy); x.scale(sc, sc); x.globalAlpha = k2 > 0.75 ? 1 - (k2 - 0.75) / 0.25 : 1;
      if (!landed) fragOrChip(x, F.tl[0], 0, 0, true);
      else { fragOrChip(x, F.tl[0], -92, -8, false); x.strokeStyle = INK; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(-26, -8); x.lineTo(2, -8); x.moveTo(-10, -20); x.lineTo(2, -8); x.lineTo(-10, 4); x.stroke(); fragOrChip(x, F.tl[1], 56, -8, true); }
      x.restore(); x.globalAlpha = 1; dirty = true; } }
    // the jars: how much each holds of what fills it. A full one carries the name of what hatched
    if (!BENCHV && P.stageOf(meta) >= 2 && g && st.mode !== 'pick' && st.mode !== 'brief' && st.mode !== 'shop') JARK.forEach(k => { const j = jarPos(k); if (!j || !meta.hatched[k] || (run && run.hom === k)) return; const c = px({ x: j.x, z: j.z + 1.75 * j.s / 1.2 }), n = jarOf(k), full = JFULL(k), few = j.s >= 1.2; fit(x, meta.hatched[k] ? P.HOMS[k].name : few ? n + '/' + full : String(n), (few ? 26 : 22) * (1 + 0.25 * (st.byBump[k] || 0)), few ? 200 : 84, hand); x.textAlign = 'center'; x.fillStyle = meta.hatched[k] ? JARINK[k] : PENCIL; x.fillText(meta.hatched[k] ? P.HOMS[k].name : few ? n + '/' + full : String(n), c[0], c[1]); });
    // the homunculus of the run: its name, a drop for each time it has been fed, and when the page waits on it what it would do
    if (false && g && g.hom && homObj && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse')) { const H = P.HOMS[g.hom.id], c = px({ x: HOMP.x - 3.3, z: HOMP.z - 1.7 }), col = JARINK[g.hom.id], fed = Math.min(H.need, g.hom.fed), ready = fed >= H.need;
      { const key = g.trail.length + ':' + g.hom.fed + ':' + g.hom.used + ':' + g.page; if (st.litK !== key) { st.litK = key; try { st.lit = P.homLit(g); } catch (e) { st.lit = false; } } }
      hand(x, st.lit ? 30 : 26); x.textAlign = 'center'; x.fillStyle = st.lit ? col : PENCIL; x.fillText(H.name, c[0], c[1]); for (let k = 0; k < H.need; k++) drop(x, c[0] + (k - (H.need - 1) / 2) * 24, c[1] + 34, 8, col, k < fed);
      if (st.homNone && ready) strike(x, c[0] - 44, c[1] + 40, c[0] + 44, c[1] + 28, 1, 5, PENCIL);
      if (st.homWait && st.homList && center) { const sc = center.group.scale.x, P2 = q => mpx({ x: C0.x + q.x * sc, z: C0.z + q.z * sc }), r = 1.0 * sc * U, seg = (a, b) => { x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); }, one = st.homList.length === 1 ? st.homList[0] : null, h = st.homSpot || (st.homHover ? one : null);
        x.strokeStyle = INK; x.lineWidth = st.homHover ? 7 : 5; x.lineCap = 'round'; seg([c[0] - 50, c[1] + 58], [c[0] + 50, c[1] + 55]);
        if (one && one.worth != null) { marker(x, 44); x.textAlign = 'right'; x.fillStyle = one.worth ? INK : PENCIL; x.fillText('+' + one.worth, c[0] - 62, c[1] + 46); }
        if (!one) st.homList.forEach(q => { if (q === h) return; const p = P2(q), dead = q.worth === 0; x.strokeStyle = dead ? PENCIL : INK; x.globalAlpha = dead ? 0.45 : 0.85; x.lineWidth = 6; seg([p[0] - 1, p[1] + r * 0.8], [p[0] + 2, p[1] + r * 0.8 + 22]); if (q.worth != null) { hand(x, 24); x.textAlign = 'center'; x.fillStyle = dead ? PENCIL : INK; x.fillText('+' + q.worth, p[0] + 1, p[1] + r * 0.8 + 46); } });
        x.globalAlpha = 1;
        if (h) { x.globalAlpha = 0.6; x.strokeStyle = col; x.lineWidth = Math.max(10, 0.3 * sc * U); h.bonds.forEach(b => seg(P2(b[0]), P2(b[1]))); x.globalAlpha = 0.95; hand(x, 30); x.textAlign = 'center'; x.fillStyle = col; if (H.word) h.at.forEach(q => { const p = P2(q); x.fillText(H.word, p[0], p[1] - r - 8); });
          if (!one && h.worth != null) { const p = P2(h), y = p[1] + r * 0.8 + 62; marker(x, 44); x.lineJoin = 'round'; x.lineWidth = 9; x.strokeStyle = '#fbf8ee'; x.strokeText('+' + h.worth, p[0], y); x.fillStyle = h.worth ? INK : PENCIL; x.fillText('+' + h.worth, p[0], y); } }
        x.globalAlpha = 1; } }
    // where the wet one has run: small puddles on the paper that dry
    if (st.puddles && st.puddles.length) { st.puddles = st.puddles.filter(q => now - q.t < 2600); st.puddles.forEach((q, i) => { const k = (now - q.t) / 2600; const c = px(q), w = hash('pd' + Math.round(q.t)); x.globalAlpha = 0.3 * (1 - k); x.fillStyle = '#3a6fd0'; x.beginPath(); x.ellipse(c[0], c[1], q.r * 1.5, q.r * 0.62, w - 0.5, 0, 6.3); x.fill(); x.beginPath(); x.ellipse(c[0] + q.r * (0.9 + w), c[1] + q.r * 0.35, q.r * 0.55, q.r * 0.26, 0.2, 0, 6.3); x.fill(); }); x.globalAlpha = 1; dirty = true; }
    // the word at the flag: as the total passes each of the four flags one word is lettered, bigger each time; the biggest reached stays
    st.wordK = -1;
    if (g && st.quota > 0 && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse' || done)) {
      const wv = [st.quota].concat(P.runMarks(st.quota)), WS = ['stable', 'unstable', 'volatile', 'overreact'], WSZ = [64, 92, 128, 172];
      let wk = -1; for (let k = 0; k < 4 && k < wv.length; k++) if (done ? g.total >= wv[k] : !!st.passT[k]) wk = k;
      if (false) {
        st.wordK = wk; const c = px({ x: 0, z: -11.4 }), t0 = st.passT[wk] || 0, pr = t0 && now - t0 < 420 ? (now - t0) / 420 : 1;
        let sz = WSZ[wk], tw = AA.rxPen.measure(WS[wk], sz, 'heavy').width; if (tw > 1500) { sz *= 1500 / tw; tw = 1500; }
        st.wordW = tw; if (pr < 1) dirty = true; AA.rxPen.write(x, WS[wk], c[0], c[1], sz, { weight: 'heavy', color: GREEN, align: 'center', t: pr });
      }
    }
    // the round is over: how it went, and where to click
    if (done) {
      { const hh = g.spec || g.hurdle || st.hurdle; if (hh) { const hp = px({ x: -22, z: -3 }); drawSpec(g, hp[0], hp[1], hh, { metT: st.specMetT, size: 210, lost: !st.pass }); const nd = needNow(); if (nd) { /* the other thing the round needed: its yield line, ticked or ringed */ const np = px({ x: -24.2, z: 4.2 }), ok = g.total >= nd; try { AA.rxMarks.yieldMark(x, 0, np[0], np[1], 44, { pencil: 'rgba(200,38,28,0.7)', plw: 3, ink: ok ? GREEN : REDINK, lw: 10, t: 1 }); } catch (e) { /* no marks */ } marker(x, 76); x.textAlign = 'left'; x.fillStyle = ok ? GREEN : REDINK; x.fillText(fmtK(nd), np[0] + 66, np[1] + 28); if (!ok) inkLoop(x, np[0] + 120, np[1] + 4, 210, 86, Math.max(0, Math.min(1, (now - (st.doneT || now) - 350) / 450)), 8, REDINK); } } }
      const c = px({ x: 0, z: -11.4 }), ratio = g.total / st.quota;
      marker(x, 130); x.textAlign = 'center'; x.lineWidth = 16; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.fillStyle = st.pass ? GREEN : REDINK;
      const txt = '', tw = st.pass ? (st.wordW || 0) : x.measureText(txt).width, n = Math.floor(ratio);
      if (txt) { x.fillText(txt, c[0], c[1]); }
      { const t0 = st.doneT || now, nC = st.pass ? Math.min(12, st.paid || 0) : Math.min(12, run.beaten + (run.bonus || 0)), baseX = st.pass ? c[0] + tw / 2 + 80 : c[0] - tw / 2 - 90; for (let n = 0; n < (BENCHV ? 0 : nC); n++) { const kk = Math.max(0, Math.min(1, (now - t0 - 450 - n * 190) / 300)); if (kk <= 0) { dirty = true; continue; } const dy = (1 - kk) * (1 - kk) * 260, bx2 = st.pass ? baseX + n * 54 : baseX, by2 = st.pass ? c[1] - 36 : c[1] - 8 - n * 12; if (AA.rxKit && AA.rxKit.drawCoin) AA.rxKit.drawCoin(x, bx2, by2 - dy, 24, { turn: kk < 1 ? kk : 0 }); if (kk < 1) dirty = true; } }
      if (BENCHV && (st.won || !st.pass)) { const nF = P.runLast ? P.runLast(run) : 9, c9 = px({ x: 0, z: -11.2 }), wF = 96, x0F = c9[0] - (nF - 1) * wF / 2, el = now - (st.doneT || now); for (let n = 0; n < nF; n++) { const kk = Math.max(0, Math.min(1, (el - 500 - n * 260) / 420)); try { AA.rxMarks.yieldMark(x, Math.min(3, n < run.beaten ? 1 + Math.floor(3 * n / Math.max(1, nF - 1)) : 0), x0F + n * wF, c9[1], 26, { ink: GREEN, t: n < run.beaten ? kk : 0, lw: 7 }); } catch (e) { /* no marks */ } }
        if (st.won) { const k = Math.max(0, Math.min(1, (el - RES_MS - PIN_MS - 150) / 1500)), c8 = px({ x: 4, z: 3.4 }); if (k > 0) { try { AA.rxMarks.yieldMark(x, 3, c8[0], c8[1], 150, { pencil: 'rgba(43,38,34,0.2)', ink: INK, t: k, lw: 26, plw: 5 }) /* (builder 22, ruling BD) the won run's mark is in the page's dark ink; it was gold (#b88a00): yellow is kept for the sign */; } catch (e) { /* no marks */ } if (st.signK !== (k >= 1)) { st.signK = k >= 1; if (k >= 1) { sfxN('unlock'); st.shake = Math.max(st.shake, 0.9); } } } } }
      if (!BENCHV && (st.won || !st.pass)) { const nF = P.runLast ? P.runLast(run) : 9, wF = 70, x0F = c[0] - (nF - 1) * wF / 2, yF = c[1] + 96; for (let n = 0; n < nF; n++) { const kk = Math.max(0, Math.min(1, (now - (st.doneT || now) - 200 - n * 120) / 260)); if (kk < 1) dirty = true; flag(x, x0F + n * wF, yF - (1 - kk) * 30, 44, n < run.beaten ? GREEN : FAINT, n < run.beaten); } }
      
      if (st.newSig) { const sc = px({ x: -12, z: 3.5 }), T0 = P.TERMS.find(q => q.id === st.newSig); sigil(x, sc, 120, st.newSig, '#b88a00', 10); }
      // a lost round: the page is struck through in red, two strokes of the pen, one after the other
      if (false && BENCHV && !st.pass) { const el = now - (st.doneT || now), a = px({ x: -19, z: -11 }), b = px({ x: 27, z: 8.5 }), c2 = px({ x: 27, z: -11.5 }), d = px({ x: -19, z: 8 }), k1 = Math.max(0, Math.min(1, (el - 700) / 380)), k2 = Math.max(0, Math.min(1, (el - 1250) / 380)); if (k1 > 0) strike(x, a[0], a[1], b[0], b[1], k1 * k1 * (3 - 2 * k1), 20, REDINK); if (k2 > 0) strike(x, c2[0], c2[1], d[0], d[1], k2 * k2 * (3 - 2 * k2), 20, REDINK); if (st.strikeN !== (k1 > 0) + (k2 > 0)) { st.strikeN = (k1 > 0) + (k2 > 0); if (st.strikeN) { sfxN('click'); st.shake = Math.max(st.shake, 0.5); } } }
      // a made molecule is kept: a strip of tape and pencil corners where the small sketch is pinned at the corner of the page
      if (BENCHV && st.pinned && st.pinK > 0.02) { const k = st.pinK, a = px({ x: PINH.x - PINH.w / 2 - 0.5, z: PINH.z - PINH.d / 2 - 0.4 }), b = px({ x: PINH.x + PINH.w / 2 + 0.5, z: PINH.z + PINH.d / 2 + 0.5 }), L = 46; x.globalAlpha = k; x.strokeStyle = PENCIL; x.lineWidth = 4; x.lineCap = 'round'; x.lineJoin = 'round'; [[a[0], a[1], 1, 1], [b[0], a[1], -1, 1], [a[0], b[1], 1, -1], [b[0], b[1], -1, -1]].forEach(q => { x.beginPath(); x.moveTo(q[0] + q[2] * L, q[1] + q[3] * 2); x.lineTo(q[0], q[1]); x.lineTo(q[0] + q[2] * 3, q[1] + q[3] * L); x.stroke(); }); x.save(); x.translate((a[0] + b[0]) / 2, a[1] - 4); x.rotate(-0.07); x.fillStyle = 'rgba(232,214,150,0.72)'; x.fillRect(-70, -19, 140, 38); x.strokeStyle = 'rgba(150,130,70,0.5)'; x.lineWidth = 2; x.strokeRect(-70, -19, 140, 38); x.restore(); x.globalAlpha = 1; }
      if (!BENCHV || (st.won ? now - (st.doneT || now) > RES_MS + PIN_MS + 1700 : st.pass ? st.pinK >= 1 : now - (st.doneT || now) > LOSS.end)) { const nb = BENCHV ? 9 * Math.sin(now / 260) : 0, nx0 = px(BENCHV ? { x: 22.5, z: 8.2 } : { x: 17.5, z: 8.6 }), nx = [nx0[0] + nb, nx0[1]], again = !(st.pass && !st.won), w2 = -30; if (BENCHV) { x.save(); x.translate(nx[0], nx[1] - 18); x.scale(1.9, 1.9); x.translate(-nx[0], -(nx[1] - 18)); } /* no words: an arrow goes on; a round arrow before it starts again */ if (again) { const cx9 = nx[0] - 78, cy9 = nx[1] - 18; x.strokeStyle = INK; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.arc(cx9, cy9, 24, 0.9, 6.0); x.stroke(); const ex = cx9 + 24 * Math.cos(6.0), ey = cy9 + 24 * Math.sin(6.0); x.beginPath(); x.moveTo(ex - 16, ey - 6); x.lineTo(ex, ey); x.lineTo(ex + 6, ey - 17); x.stroke(); } x.strokeStyle = INK; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(nx[0] + w2, nx[1] - 18); x.lineTo(nx[0] + w2 + 60, nx[1] - 18); x.lineTo(nx[0] + w2 + 38, nx[1] - 38); x.moveTo(nx[0] + w2 + 60, nx[1] - 18); x.lineTo(nx[0] + w2 + 38, nx[1] + 2); x.stroke(); if (BENCHV) x.restore(); }
    }
    if (fe()) FEEL.ink(x, now);
    try { sigDraw(x, now); } catch (e) { /* a mark never breaks the page */ }
    ink.t.needsUpdate = true;
  }

  // ---------- pointer and keys ----------
  const ray = new T.Raycaster(), ndc = new T.Vector2(), ground = new T.Plane(new T.Vector3(0, 1, 0), 0), hit = new T.Vector3();
  function slotAt(e) {
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(ground, hit) || st.mode !== 'play') return -1;
    const any = lining(); let slot = -1; slots.forEach((s, i) => { if (!s || (!s.o && !any)) return; const p = SPOT[i]; if (p && (SIDE ? hit.x > (BENCHV ? 33 : 12) && Math.abs(hit.z - p.z) < SLOTW / 2 : Math.abs(hit.x - p.x) < SLOTW / 2 && hit.z > -14.5 && hit.z < p.z + 3)) slot = i; });
    if (FEEL && FEEL.twistHit) FEEL.twistHit(hit, ray.ray);
    return slot;
  }
  function pickAt(e, arr) {
    if (BENCHV && st.mode === 'pick' && arr !== briefs) return shopHit(e).i;
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(ground, hit) || hit.z < (BENCHV ? -14 : -7) || hit.z > (BENCHV ? 12 : 9)) return -1;
    if (arr === briefs && briefs.length === 1) return Math.abs(hit.x) < 7 ? 0 : -1;
    if (arr === briefs && briefs.length === 2) return Math.abs(hit.x - BX(0)) < (BENCHV ? 13 : 10) ? 0 : Math.abs(hit.x - BX(1)) < (BENCHV ? 13 : 10) ? 1 : -1;
    let best = -1; PICKX.forEach((px0, i) => { if ((arr || picks)[i] && Math.abs(hit.x - px0) < 7) best = i; }); return best;
  }
  function shopAt(e) {
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(ground, hit)) return -2;
    if (!bench) return -2;
    if (Math.abs(hit.x - HNOTE.x) < 3 && hit.z > HNOTE.z - 6.5 && hit.z < HNOTE.z + 3) return -1;
    const G = benchGhostAt(); if (G && Math.abs(hit.x - G.x) < 1.5 * G.K + 0.6 && hit.z > G.z - 5.5 * G.K && hit.z < G.z + 2.4 * G.K) return meta.tier + 1;
    const fi = famNext(), nx = supplyNext(), n = bench.rx.length; if (fi >= 0 || nx) { const k = n, per = 5, gx = -20.8 + (k % per) * BENCH.rx.dx, gz = BENCH.rx.z0 + Math.floor(k / per) * BENCH.rx.dz; if (Math.abs(hit.x - gx) < 5 && Math.abs(hit.z - gz) < 1.8) return fi >= 0 ? 100 + fi : meta.tier + 1; }
    return -2;
  }
  cv.addEventListener('pointermove', e => { if (st.mode === 'hom') { const i = homPageAt(e); if (i !== st.hover) { st.hover = i; dirty = true; } cv.style.cursor = i >= 0 ? 'pointer' : ''; return; } if (st.mode === 'terms') { const i = termAt(e); if (i !== st.hover) { st.hover = i; dirty = true; } cv.style.cursor = i >= 0 ? 'pointer' : ''; return; } if (st.mode === 'brief') { const i = pickAt(e, briefs), mk = i < 0 && pairAt() ? 'pair' : ''; if (i !== st.hover || mk !== st.mark) { st.hover = i; st.mark = mk; dirty = true; } cv.style.cursor = i >= 0 || mk ? 'pointer' : ''; return; } if (st.mode === 'shop') { const i = shopAt(e); if (i !== st.hover) { st.hover = i; dirty = true; } cv.style.cursor = i === -1 || i === meta.tier + 1 ? 'pointer' : ''; return; } if (st.mode === 'pick') { const i = pickAt(e), mk = i < 0 ? pickMark() : ''; if (i !== st.hover || mk !== st.mark) { st.hover = i; st.mark = mk; dirty = true; } cv.style.cursor = i >= 0 || mk ? 'pointer' : ''; return; } const s = slotAt(e); if (s !== st.hover) setHover(s); toolHover(); homPoint(); { const mk = bankAt() ? 'bank' : drawAt() ? 'draw' : fireAt() || homTurnAt() ? 'fire' : circleAt() >= 0 ? 'circle' : pagesAt() ? 'pages' : ''; if (mk !== st.mark) { st.mark = mk; dirty = true; } } { let kh = -1; kitObjs.forEach((k, i) => { const kp = KITP(i); if (Math.abs(hit.x - kp.x) < 2.4 && hit.z > kp.z - 4.5 && hit.z < kp.z + 3.8) kh = i; }); if (kh !== st.kitHover) { st.kitHover = kh; dirty = true; } if (NAMEV === 'hover' || NAMEV === 'both') { let tip = null; zones().forEach(q => { if (q.r && Math.hypot(hit.x - q.x, hit.z - q.z) < q.r) tip = q.id; }); if (tip !== st.tip) { st.tip = tip; dirty = true; } } } cv.style.cursor = s >= 0 || st.mark || st.mode === 'done' || st.toolSpot || toolAt() || (st.homWait && (st.homSpot || homAt())) ? 'pointer' : ''; });
  cv.addEventListener('pointerleave', () => setHover(-1));
  cv.addEventListener('pointerdown', () => { if (!twistAt()) return; st.drag = { x: hit.x, z: hit.z }; doTwist(); if (morph && morph.slow) { morph.scrub = true; morph.kDrag = 0; morph.kHeld = 0; } });
  cv.addEventListener('pointermove', () => { if (st.drag && morph && morph.scrub) morph.kDrag = Math.min(1, Math.hypot(hit.x - st.drag.x, hit.z - st.drag.z) / 5); });
  root.addEventListener('pointerup', () => { if (!st.drag) return; st.drag = null; if (morph && morph.scrub) { morph.scrub = false; morph.t0 = performance.now() - morph.s0 - (morph.K || 0) * 460; } });
  cv.addEventListener('pointerdown', () => { st.cdown = st.mode === 'play' && g && lining() ? circleAt() : -1; });
  cv.addEventListener('pointerup', () => { const i = st.cdown; st.cdown = -1; if (i == null || i < 0 || !g || !g.queue) return; const j = circleAt(); if (j < 0 || j === i || !g.queue[i] || !g.queue[j] || !P.swapQueue) return; if (P.swapQueue.length >= 3) P.swapQueue(g, i, j); else P.swapQueue(i, j); st.cswap = true; sfx.feed(); refresh(); });
  cv.addEventListener('click', e => { if (st.cswap) { st.cswap = false; return; } if (st.mode === 'hom') { const i = homPageAt(e); if (i >= 0) chooseHom(i); return; } if (st.mode === 'terms') { const i = termAt(e); if (i >= 0) chooseTerm(i); return; } if (st.mode === 'brief') { const i = pickAt(e, briefs); if (i >= 0) chooseBrief(i); else if (pairAt()) doPair(); return; } if (st.mode === 'shop') { const i = shopAt(e); if (i === -1) next(); else if (i >= 100) openFamily(i - 100); else if (i >= 0) openSupplier(i); return; } if (st.mode === 'pick') { const i = pickAt(e), mk = i < 0 ? pickMark() : ''; if (i >= 0) takePick(i); else if (mk === 'reroll') doReroll(); else if (mk === 'skip') doSkip(); else if (mk === 'shelf') shopShelf(); else if (mk) doBin(+mk.slice(3)); return; } if (st.mode === 'fuse') return; if (st.mode === 'done') return next(); const s = slotAt(e); if (homPreAt()) return homPre(); if (st.homWait) { homPoint(); if (homTurnAt()) return homSkip(); const it = st.homSpot || (homAt() && st.homList && st.homList.length === 1 ? st.homList[0] : null); if (it) doHom(it); return; } { const tk = toolAt(); if (tk) return toolArm(tk); if (st.tool) { toolHover(); if (st.toolSpot) return doTool(); toolOff(); } } if (s >= 0) pick(s); else if (circleAt() >= 0) doUnqueue(circleAt()); else if (fireAt()) doFire(); else if (bankAt()) doBank(); else if (drawAt()) doRedraw(); else if (pagesAt()) doTurn(); else if (twistAt()) doTwist(); else if (pawAt()) doWish(); else if (kitAt('extinguisher')) doDouse(); });
  root.addEventListener('keydown', e => {
    if (e.key >= '1' && e.key <= '6') { if (st.mode === 'hom') chooseHom(+e.key - 1); else if (st.mode === 'terms') chooseTerm(+e.key - 1); else if (st.mode === 'pick') takePick(+e.key - 1); else if (st.mode === 'brief') chooseBrief(+e.key - 1); else pick(+e.key - 1); }
    else if (e.key === 'f' || e.key === 'F') pick(FIN);
    else if (e.key === 't' || e.key === 'T') doTwist();
    else if (e.key === 'b' || e.key === 'B') doBank();
    else if (e.key === 'd' || e.key === 'D') { if (st.mode === 'pick') doReroll(); else if (st.mode === 'brief') doPair(); else doRedraw(); }
    else if ((e.key === 's' || e.key === 'S') && st.mode === 'pick') doSkip();
    else if (e.key === 'n' || e.key === 'N') doTurn();
    else if (e.key === 'Backspace') { e.preventDefault(); doUnqueue(-1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (st.homWait) homSkip(); else if (lining()) doFire(); else next(); }
    else if (e.key === 'r' || e.key === 'R') newRun();
  });

  // the moment of play is played by feel.js (AA.rxFeel); with feel 0 or no feel.js the page plays it as before
  // The molecule as it is seen in the frame (1280 by 720, with the atoms' radii; atoms on their way out are not counted) against the play rectangle as it is seen.
  const _iv = new T.Vector3(), _iw = new T.Vector3(), _ir = new T.Vector3();
  function seenIn(m) { if (!m || !m.balls) return null; m.group.updateMatrixWorld(true); const R = playRect(), M = 0.9, v = _iv, w = _iw, right = _ir.setFromMatrixColumn(cam.matrixWorld, 0), pj = (x, z) => { v.set(x, 0, z).project(cam); return [(v.x + 1) * 640, (1 - v.y) * 360]; };
    const c = [pj(R[0] - M, R[1] - M), pj(R[2] + M, R[1] - M), pj(R[0] - M, R[3] + M), pj(R[2] + M, R[3] + M)], pr = [Math.max(c[0][0], c[2][0]), Math.max(c[0][1], c[1][1]), Math.min(c[1][0], c[3][0]), Math.min(c[2][1], c[3][1])]; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    m.balls.forEach((b, a) => { if (!b.mesh.visible || !m.at || !m.at.get(a)) return; b.mesh.getWorldPosition(v); const rw = b.mesh.scale.x * m.group.scale.x; w.copy(v).addScaledVector(right, rw).project(cam); v.project(cam); const sx = (v.x + 1) * 640, sy = (1 - v.y) * 360, r = Math.abs(w.x - v.x) * 640; x0 = Math.min(x0, sx - r); x1 = Math.max(x1, sx + r); y0 = Math.min(y0, sy - r); y1 = Math.max(y1, sy + r); });
    if (x0 > 1e8) return null; return { out: Math.max(0, pr[0] - x0, x1 - pr[2], pr[1] - y0, y1 - pr[3]), box: [x0, y0, x1, y1], play: pr, ppu: (c[1][0] - c[0][0] + c[3][0] - c[2][0]) / 2 / (R[2] - R[0] + 2 * M) }; }
  // the last word before the frame is drawn: whatever moved the atoms, the molecule as seen is inside the play rectangle as seen
  // (builder 12) the watch on the right page: on every frame of play, how far any drawn atom of the molecule reaches past the gutter, the page's edges or the track (in screen pixels)
  // (builder 13) the ink against the safe areas: after every drawing of the page's ink, the pixels of ink standing in the crease's keep-out or past a page's
  // margins are found; `worst` is how deep the deepest stands inside the forbidden strip, in pixels of a 1280 frame. On when ?watch=1 or inkLog() was asked once.
  const INKW = { on: (() => { try { return new URLSearchParams(root.location.search).get('watch') === '1'; } catch (e) { return false; } })(), frames: 0, bad: 0, worst: 0, at: null, by: {} };
  function inkWatch() { if (!SAFE) return; const K = 0.49, X = v => Math.round((v + SW / 2) * U), Z = v => Math.round((v + SH / 2) * U), gx0 = X(SAFE.gut.x0), gx1 = X(SAFE.gut.x1), rx = X(SAFE.R.x1), ty = Z(SAFE.R.z0), by = Z(SAFE.R.z1), pb = Z(SHP.z1); let worst = 0, wx = 0, wy = 0, why = '';
    const scan = (x0, y0, w, h, depth, name) => { if (w <= 0 || h <= 0) return; const d = ink.x.getImageData(x0, y0, w, h).data; for (let j = 0; j < h; j += 2) for (let i = 0; i < w; i += 2) { const o4 = (j * w + i) * 4, r = d[o4], gg = d[o4 + 1], b = d[o4 + 2]; if (d[o4 + 3] <= 60 || (Math.min(r, gg, b) > 185 && Math.max(r, gg, b) - Math.min(r, gg, b) < 45)) continue; /* paper laid over a page is not ink */ const dp = depth(i, j); if (dp > worst) { worst = dp; wx = x0 + i; wy = y0 + j; why = name; } } };
    scan(gx0, ty, gx1 - gx0, by - ty, (i, j) => Math.min(i + 1, gx1 - gx0 - i), 'crease'); scan(rx, ty, IW - rx, by - ty, (i, j) => i + 1, 'right edge'); scan(0, 0, IW, ty, (i, j) => ty - j, 'top edge'); scan(0, by, IW, pb - by, (i, j) => j + 1, 'foot');
    INKW.frames++; const w = +(worst * K).toFixed(1); if (w > 0.9) { INKW.bad++; { const key = st.mode + ':' + why, o = INKW.by[key]; if (!o || w > o[0]) INKW.by[key] = [w, +(wx / U - SW / 2).toFixed(1), +(wy / U - SH / 2).toFixed(1)]; } if (w > INKW.worst) { INKW.worst = w; try { const cc = document.createElement('canvas'); cc.width = 400; cc.height = 400; const c2 = cc.getContext('2d'); c2.fillStyle = '#fff'; c2.fillRect(0, 0, 400, 400); c2.drawImage(ink.cv || ink.x.canvas, wx - 400, wy - 400, 800, 800, 0, 0, 400, 400); INKW.img = cc.toDataURL('image/jpeg', 0.6); } catch (e) { INKW.img = String(e); } INKW.at = { mode: st.mode, why, x: +(wx / U - SW / 2).toFixed(1), z: +(wy / U - SH / 2).toFixed(1), round: run && run.round }; } } }
  // (builder 13) LIFE ON THE BENCH that is not the molecule: everything along the top turns a little toward the molecule while a line runs (a spring, so it
  // overshoots and settles), is jogged by every hit, and shifts slowly while nothing happens; the lamp's light breathes. The molecule is never touched here.
  const LIFE = { yaw: 0, v: 0, casc: 0, sun0: null, hemi: null, hemi0: 0 };
  function lifeFrame(now, dt) { if (!BENCHV) return; dt = Math.min(0.05, dt || 0.016); const busy = !!st.firing && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse'), tg = busy ? 1 : 0, cn = (g && g.casc) || 0;
    if (cn !== LIFE.casc) { if (cn > LIFE.casc) LIFE.v += 2.6 * (cn % 2 ? 1 : -1); LIFE.casc = cn; }
    LIFE.v += (38 * (tg - LIFE.yaw) - 5.2 * LIFE.v) * dt; LIFE.yaw += LIFE.v * dt; const moving = Math.abs(LIFE.v) > 0.004 || Math.abs(tg - LIFE.yaw) > 0.002;
    const turn = (grp, x, ph, amt) => { if (!grp) return; grp.rotation.y = Math.atan2(15 - x, 22) * 0.55 * LIFE.yaw * amt + 0.035 * Math.sin(now / (2300 + 370 * ph) + ph * 1.7) + 0.02 * Math.sin(now / (5100 + 200 * ph) + ph); };
    kitObjs.forEach((k, i) => turn(k.grp, k.hx || 0, i + 1, k.id === 'duck' ? 1.3 : 0.6)); JARK.forEach((k, i) => { if (jars[k] && jars[k].grp) turn(jars[k].grp, jars[k].grp.position.x, i + 5, 1); }); if (homObj && homObj.grp) turn(homObj.grp, homObj.grp.position.x, 9, 1.2);
    if (!title.on) { if (LIFE.sun0 == null) { LIFE.sun0 = sun.intensity; scene.children.forEach(c => { if (c.isHemisphereLight && !LIFE.hemi) { LIFE.hemi = c; LIFE.hemi0 = c.intensity; } }); } const br = 0.028 * Math.sin(now / 1900) + 0.012 * Math.sin(now / 430 + 1.3) + 0.05 * Math.max(0, LIFE.yaw); sun.intensity = LIFE.sun0 * (1 + br); if (LIFE.hemi) LIFE.hemi.intensity = LIFE.hemi0 * (1 + 0.5 * br); }
    if (moving || st.mode === 'play' || st.mode === 'brief' || st.mode === 'pick' || st.mode === 'done') LIFE.wake = true; }
  const FITW = { frames: 0, bad: 0, worst: 0, at: null };
  function fitWatch() { const m = center; if (SHAPE !== 'a' || !m || !(st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse') || title.on || (FEEL && FEEL.twistState && FEEL.twistState().ang > 0.01)) return; m.group.updateMatrixWorld(true); const v = _iv, w = _iw, right = _ir.setFromMatrixColumn(cam.matrixWorld, 0), sxOf = (x, z) => { w.set(x, 0, z).project(cam); return (w.x + 1) * 640; }, syOf = z => { w.set(15, 0, z).project(cam); return (1 - w.y) * 360; }; let over = 0;
    const yT = syOf(SAFE.R.z0), yB = syOf(TRK.z - 1.9); m.balls.forEach(b => { if (!b.mesh.visible) return; b.mesh.getWorldPosition(v); const wz = v.z, rw = b.mesh.scale.x * m.group.scale.x; w.copy(v).addScaledVector(right, rw).project(cam); const ex = (w.x + 1) * 640; v.project(cam); const sx = (v.x + 1) * 640, sy = (1 - v.y) * 360, rr = Math.abs(ex - sx); over = Math.max(over, sxOf(SAFE.R.x0, wz) - (sx - rr), (sx + rr) - sxOf(SAFE.R.x1, wz), yT - (sy - rr), (sy + rr) - yB); });
    FITW.frames++; if (over > 0.5) { FITW.bad++; if (over > FITW.worst) { FITW.worst = +over.toFixed(1); FITW.at = { round: run && run.round, page: g && g.page, firing: !!st.firing, sc: +st.sc.toFixed(2) }; } } }
  function keepSeen() { const m = center; if (!m || !BENCHV || !(st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse') || (FEEL && FEEL.twistState && FEEL.twistState().ang > 0.01)) return; let q = seenIn(m); if (!q || q.out <= 0) return; const G = m.group, P1 = q.play, pw = P1[2] - P1[0] - 2, ph = P1[3] - P1[1] - 2, bw = q.box[2] - q.box[0], bh = q.box[3] - q.box[1], f = Math.min(1, pw / bw, ph / bh);
    if (f < 1) { G.scale.multiplyScalar(f); st.sc *= f; q = seenIn(m); if (!q) return; }
    const dx = q.box[0] < P1[0] + 1 ? P1[0] + 1 - q.box[0] : q.box[2] > P1[2] - 1 ? P1[2] - 1 - q.box[2] : 0, dy = q.box[1] < P1[1] + 1 ? P1[1] + 1 - q.box[1] : q.box[3] > P1[3] - 1 ? P1[3] - 1 - q.box[3] : 0; G.position.x += dx / q.ppu; G.position.z += dy / (q.ppu * 0.94); }
  const flashM = BENCHV ? add(new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }), 0, 0.03, 0) : null; if (flashM) { flashM.castShadow = false; flashM.receiveShadow = false; flashM.visible = false; }
  // ---------- the bench's own objects: the reagents, as bottles or as note cards (?reag=bottles|cards) ----------
  // Bottles: each reagent is a glass bottle or flask standing on the wood to the right of the page, with its before -> after picture on a paper tag tied to
  // its neck; the shape of the glass says which kind of reagent it is and the liquid has the reagent's colour.
  // Cards: each reagent is an index card lying on the wood, its picture drawn across it in the notebook's ink, held by a paper clip.
  // Either way one with nothing to act on is dim, and one used up is gone.
  const REAG = (() => { try { const v = new URLSearchParams(root.location.search).get('reag'); return v === 'cards' || v === 'bottles' ? v : 'both'; } catch (e) { return 'both'; } })();   // both (the owner's pick): an index card with the picture, its bottle standing on the card's right end
  const BT = { map: new Map(), drops: [], flyers: [], lights: [], x: 40.3, cw: 11.8, ch: 7.0, bw: 5.0, bh: 8.1, tw: 8.7, th: 4.3, dropGeo: null };
  if (REAG === 'both') { BT.x = SHP ? SHP.bt : 40.5; BT.cw = 13.0; BT.ch = 6.3; BT.bw = 3.9; BT.bh = 6.3; }
  const BSHAPE = { acid: 'square', base: 'jar', oxidant: 'cone', hydride: 'tin', metal: 'tin', grignard: 'round', radical: 'round', ylide: 'round', chloride: 'amber', light: 'cone', self: 'jar' };
  const INKC = '#22252c';
  const picDraw = (c, id, on, cx, cy, k) => { const tl = TILE[id]; if (!tl) return; c.save(); c.translate(cx + 16 * k, cy + 8 * k); c.scale(k, k); fragOrChip(c, tl[0], -78, -8, on); c.strokeStyle = on ? INK : FAINT; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(-26, -8); c.lineTo(-2, -8); c.moveTo(-14, -18); c.lineTo(-2, -8); c.lineTo(-14, 2); c.stroke(); fragOrChip(c, tl[1], 46, -8, on); c.restore(); };
  // an index card: ruled, a paper clip at its top edge, one corner lifting
  function cardDraw(c, id, on, W, H) {
    c.clearRect(0, 0, W, H); c.save(); const m = 8;
    c.beginPath(); c.moveTo(m, m); c.lineTo(W - m, m); c.lineTo(W - m, H - m - 34); c.lineTo(W - m - 40, H - m); c.lineTo(m, H - m); c.closePath(); c.fillStyle = on ? '#f8f5ec' : '#d9d5ca'; c.fill(); c.save(); c.clip();
    c.strokeStyle = 'rgba(214,69,58,' + (on ? 0.55 : 0.25) + ')'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, 58); c.lineTo(W, 58); c.stroke();
    c.strokeStyle = 'rgba(70,110,190,' + (on ? 0.28 : 0.14) + ')'; c.lineWidth = 2; for (let y = 100; y < H; y += 42) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.restore(); c.strokeStyle = 'rgba(34,37,44,0.55)'; c.lineWidth = 2.5; c.stroke();
    // the lifted corner: its underside, and the fold
    c.beginPath(); c.moveTo(W - m, H - m - 34); c.lineTo(W - m - 40, H - m); c.lineTo(W - m - 34, H - m - 30); c.closePath(); c.fillStyle = '#e4dfd0'; c.fill(); c.strokeStyle = 'rgba(34,37,44,0.5)'; c.lineWidth = 2; c.stroke();
    c.globalAlpha = on ? 1 : 0.55; picDraw(c, id, on, W / 2, H / 2 + 22, Math.min((W - 60) / 262, (H - 96) / 92));
    // the paper clip
    c.globalAlpha = 1; c.strokeStyle = '#8a9099'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(74, 62); c.lineTo(74, 14); c.quadraticCurveTo(74, 2, 62, 2); c.quadraticCurveTo(50, 2, 50, 14); c.lineTo(50, 80); c.quadraticCurveTo(50, 90, 59, 90); c.quadraticCurveTo(66, 90, 66, 80); c.lineTo(66, 24); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(73, 60); c.lineTo(73, 16); c.stroke();
    c.restore();
  }
  // the card of a card-with-its-bottle: a plain ruled index card, the picture on its left two thirds, the right end left free for the bottle
  // to stand on; when it is in the line it carries the numeral of its place in a pencil ring and a warmer paper
  function bothDraw(c, id, on, W, H, qi) {
    c.clearRect(0, 0, W, H); c.save(); const m = 8, qd = qi != null && qi >= 0;
    c.beginPath(); c.moveTo(m + 6, m); c.lineTo(W - m - 6, m + 2); c.lineTo(W - m, H - m - 4); c.lineTo(m, H - m); c.closePath(); c.fillStyle = on ? (qd ? '#f6ecc9' : '#f8f5ec') : '#cdc9bd'; c.fill(); c.save(); c.clip();
    c.strokeStyle = 'rgba(214,69,58,' + (on ? 0.5 : 0.2) + ')'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, 52); c.lineTo(W, 52); c.stroke();
    c.strokeStyle = 'rgba(70,110,190,' + (on ? 0.24 : 0.12) + ')'; c.lineWidth = 2; for (let y = 96; y < H; y += 44) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.restore(); c.strokeStyle = 'rgba(34,37,44,' + (qd ? 0.85 : 0.5) + ')'; c.lineWidth = qd ? 4 : 2.5; c.stroke();
    c.globalAlpha = on ? 1 : 0.42; picDraw(c, id, on, W * 0.37, H / 2 + 14, Math.min((W * 0.76 - 6) / 262, (H - 60) / 92));
    if (qd) { c.globalAlpha = 1; c.strokeStyle = INKC; c.lineWidth = 4; c.beginPath(); c.ellipse(50, 46, 34, 31, -0.2, 0.3, 6.5); c.stroke(); try { AA.rxPen.write(c, String(qi + 1), 50, 64, 56, { weight: 'heavy', color: INKC, align: 'center' }); } catch (e) { /* no pen */ } }
    c.restore();
  }
  // a tag of brown paper with a ringed hole at its right end, tied to the bottle
  function tagDraw(c, id, on, W, H) {
    c.clearRect(0, 0, W, H); c.save(); const m = 6;
    c.beginPath(); c.moveTo(m, m); c.lineTo(W - 46, m); c.lineTo(W - m, H * 0.3); c.lineTo(W - m, H * 0.7); c.lineTo(W - 46, H - m); c.lineTo(m, H - m); c.closePath(); c.fillStyle = on ? '#f6f1e2' : '#d6d1c4'; c.fill(); c.strokeStyle = INKC; c.lineWidth = 3.5; c.lineJoin = 'round'; c.stroke();
    c.fillStyle = '#c9a36a'; c.beginPath(); c.arc(W - 30, H / 2, 13, 0, 6.3); c.fill(); c.strokeStyle = INKC; c.lineWidth = 2.5; c.stroke(); c.fillStyle = '#4a3220'; c.beginPath(); c.arc(W - 30, H / 2, 5, 0, 6.3); c.fill();
    c.globalAlpha = on ? 1 : 0.55; picDraw(c, id, on, (W - 46) / 2 + 4, H / 2, Math.min((W - 76) / 262, (H - 30) / 92)); c.restore();
  }
  // a glass vessel: glass with thickness, shine and a stopper, the liquid inside with its meniscus
  function bottleDraw(c, id, on, W, H, open) {
    const card = RX.CARDS[id] || {}, shape = BSHAPE[card.cls] || 'square', col = card.rgb ? bright(card.rgb) : [150, 150, 150], rgbS = (q, a) => 'rgba(' + q.map(v => Math.round(v)).join(',') + ',' + a + ')', dark = col.map(v => v * 0.62), lite = col.map(v => Math.min(255, v * 1.15 + 30));
    c.clearRect(0, 0, W, H); c.save(); c.globalAlpha = on ? 1 : 0.5; c.lineJoin = 'round'; c.lineCap = 'round'; const cx = W / 2, by = H - 12;
    const body = ins => { const i = ins || 0; c.beginPath();
      if (shape === 'square' || shape === 'amber') { const x0 = 30 + i, x1 = W - 30 - i, sh = shape === 'amber' ? 70 : 40, y0 = 132 + i; c.moveTo(cx - 27 + i, 62); c.lineTo(cx - 27 + i, y0 - sh * 0.55); c.quadraticCurveTo(cx - 27 + i, y0, x0 + sh * 0.5, y0 + (shape === 'amber' ? 8 : 0)); c.quadraticCurveTo(x0, y0 + 6, x0, y0 + sh * 0.6); c.lineTo(x0, by - 16 - i); c.quadraticCurveTo(x0, by - i, x0 + 16, by - i); c.lineTo(x1 - 16, by - i); c.quadraticCurveTo(x1, by - i, x1, by - 16 - i); c.lineTo(x1, y0 + sh * 0.6); c.quadraticCurveTo(x1, y0 + 6, x1 - sh * 0.5, y0 + (shape === 'amber' ? 8 : 0)); c.quadraticCurveTo(cx + 27 - i, y0, cx + 27 - i, y0 - sh * 0.55); c.lineTo(cx + 27 - i, 62); }
      else if (shape === 'cone') { c.moveTo(cx - 25 + i, 62); c.lineTo(cx - 25 + i, 150); c.lineTo(20 + i * 1.6, by - 30 - i); c.quadraticCurveTo(12 + i, by - i, 44, by - i); c.lineTo(W - 44, by - i); c.quadraticCurveTo(W - 12 - i, by - i, W - 20 - i * 1.6, by - 30 - i); c.lineTo(cx + 25 - i, 150); c.lineTo(cx + 25 - i, 62); }
      else if (shape === 'round') { const r = 100 - i, cy = by - 104; c.moveTo(cx - 23 + i, 62); c.lineTo(cx - 23 + i, cy - r * 0.94); c.arc(cx, cy, r, -Math.PI / 2 - 0.24, -Math.PI / 2 + 0.24, true); c.lineTo(cx + 23 - i, 62); }
      else if (shape === 'tin') { c.moveTo(34 + i, 104 + i); c.lineTo(34 + i, by - 10 - i); c.quadraticCurveTo(34 + i, by - i, 46, by - i); c.lineTo(W - 46, by - i); c.quadraticCurveTo(W - 34 - i, by - i, W - 34 - i, by - 10 - i); c.lineTo(W - 34 - i, 104 + i); }
      else { const x0 = 26 + i, x1 = W - 26 - i; c.moveTo(x0 + 16, 112 + i); c.quadraticCurveTo(x0, 116 + i, x0, 140); c.lineTo(x0, by - 20 - i); c.quadraticCurveTo(x0, by - i, x0 + 20, by - i); c.lineTo(x1 - 20, by - i); c.quadraticCurveTo(x1, by - i, x1, by - 20 - i); c.lineTo(x1, 140); c.quadraticCurveTo(x1, 116 + i, x1 - 16, 112 + i); }
      c.closePath(); };
    if (shape === 'round') { c.fillStyle = '#b08954'; c.strokeStyle = INKC; c.lineWidth = 4; c.beginPath(); c.ellipse(cx, by - 4, 70, 12, 0, 0, 6.3); c.fill(); c.stroke(); }
    if (shape === 'tin') { const g0 = c.createLinearGradient(30, 0, W - 30, 0); g0.addColorStop(0, '#8f969e'); g0.addColorStop(0.25, '#e6eaee'); g0.addColorStop(0.55, '#aab0b8'); g0.addColorStop(1, '#6f767e'); body(); c.fillStyle = g0; c.fill(); c.strokeStyle = 'rgba(40,44,52,0.4)'; c.lineWidth = 3; [150, 200, by - 40].forEach(y => { c.beginPath(); c.moveTo(36, y); c.lineTo(W - 36, y); c.stroke(); }); c.fillStyle = rgbS(col, 1); c.fillRect(36, 228, W - 72, 60); body(); c.strokeStyle = INKC; c.lineWidth = 5; c.stroke();
      c.fillStyle = '#c9ced4'; c.beginPath(); c.rect(28, 86, W - 56, 22); c.fill(); c.stroke(); c.fillStyle = '#9aa1a9'; c.beginPath(); c.rect(cx - 30, 66, 60, 22); c.fill(); c.stroke(); }
    else {
      // the glass itself
      const amber = shape === 'amber', gg = c.createLinearGradient(20, 0, W - 20, 0); gg.addColorStop(0, amber ? 'rgba(120,70,24,0.92)' : 'rgba(214,232,238,0.72)'); gg.addColorStop(0.5, amber ? 'rgba(176,108,44,0.86)' : 'rgba(240,248,250,0.5)'); gg.addColorStop(1, amber ? 'rgba(96,54,18,0.94)' : 'rgba(188,212,222,0.78)'); body(); c.fillStyle = gg; c.fill();
      // the liquid, inside the thickness of the glass
      c.save(); body(7); c.clip(); const lv = shape === 'round' ? by - 150 : shape === 'cone' ? by - 120 : 190, lg = c.createLinearGradient(20, 0, W - 20, 0); lg.addColorStop(0, rgbS(lite, amber ? 0.5 : 0.95)); lg.addColorStop(0.6, rgbS(col, amber ? 0.5 : 0.95)); lg.addColorStop(1, rgbS(dark, amber ? 0.55 : 0.97)); c.fillStyle = lg; c.fillRect(0, lv, W, H);
      c.fillStyle = rgbS(dark, 0.55); c.beginPath(); c.ellipse(cx, lv, W, 9, 0, 0, 6.3); c.fill(); c.fillStyle = rgbS(lite, 0.9); c.beginPath(); c.ellipse(cx, lv + 3, W, 6, 0, 0, 6.3); c.fill(); c.restore();
      body(); c.strokeStyle = INKC; c.lineWidth = 5; c.stroke(); body(7); c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 2.5; c.stroke();
      // shine: a long streak down the left, a short one on the right shoulder
      c.strokeStyle = 'rgba(255,255,255,0.78)'; c.lineWidth = 9; c.beginPath(); if (shape === 'round') c.arc(cx, by - 104, 78, Math.PI * 0.82, Math.PI * 1.22); else if (shape === 'cone') { c.moveTo(cx - 34, 190); c.lineTo(52, by - 60); } else { c.moveTo(48, 176); c.lineTo(48, by - 50); } c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 5; c.beginPath(); if (shape === 'round') c.arc(cx, by - 104, 80, -0.5, -0.2); else if (shape === 'cone') { c.moveTo(cx + 40, 214); c.lineTo(cx + 52, 246); } else { c.moveTo(W - 46, 180); c.lineTo(W - 46, 222); } c.stroke();
      // the mouth: a lip, and its stopper
      if (open) { c.fillStyle = shape === 'amber' ? 'rgba(120,70,24,0.95)' : 'rgba(226,240,244,0.9)'; c.strokeStyle = INKC; c.lineWidth = 4.5; c.beginPath(); if (shape === 'jar') c.rect(22, 100, W - 44, 14); else c.rect(cx - 36, 52, 72, 14); c.fill(); c.stroke(); }
      else if (shape === 'jar') { c.fillStyle = '#343a42'; c.strokeStyle = INKC; c.lineWidth = 5; c.beginPath(); c.rect(18, 76, W - 36, 40); c.fill(); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 3; for (let x = 34; x < W - 24; x += 18) { c.beginPath(); c.moveTo(x, 82); c.lineTo(x, 110); c.stroke(); } }
      else { c.fillStyle = amber ? 'rgba(120,70,24,0.95)' : 'rgba(226,240,244,0.9)'; c.strokeStyle = INKC; c.lineWidth = 4.5; c.beginPath(); c.rect(cx - 36, 52, 72, 14); c.fill(); c.stroke();
        if (amber) { c.fillStyle = '#23262c'; c.beginPath(); c.rect(cx - 30, 14, 60, 40); c.fill(); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - 18, 20); c.lineTo(cx - 18, 48); c.stroke(); }
        else if (shape === 'square') { c.fillStyle = 'rgba(214,232,238,0.95)'; c.beginPath(); c.moveTo(cx - 20, 52); c.lineTo(cx - 16, 34); c.lineTo(cx - 34, 30); c.quadraticCurveTo(cx - 40, 10, cx, 8); c.quadraticCurveTo(cx + 40, 10, cx + 34, 30); c.lineTo(cx + 16, 34); c.lineTo(cx + 20, 52); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 4; c.beginPath(); c.moveTo(cx - 20, 20); c.lineTo(cx - 6, 14); c.stroke(); }
        else { const g1 = c.createLinearGradient(cx - 28, 0, cx + 28, 0); g1.addColorStop(0, '#c9a36a'); g1.addColorStop(1, '#8a6436'); c.fillStyle = g1; c.beginPath(); c.moveTo(cx - 30, 12); c.lineTo(cx + 30, 12); c.lineTo(cx + 22, 54); c.lineTo(cx - 22, 54); c.closePath(); c.fill(); c.stroke(); } } }
    c.restore();
  }
  const softShadow = (() => { let t = null; return () => { if (t) return t; const s = canvasTex(128, 64), g2 = s.x.createRadialGradient(64, 32, 4, 64, 32, 60); g2.addColorStop(0, 'rgba(0,0,0,0.5)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); s.x.fillStyle = g2; s.x.fillRect(0, 0, 128, 64); s.t.needsUpdate = true; t = s.t; return t; }; })();
  const flatMesh = (w, h, tex, y) => { const m = new T.Mesh(new T.PlaneGeometry(w, h).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })); m.position.y = y; return m; };
  function bottleMake(id) {
    const grp = new T.Group(), b = { id, grp, on: null, x: BT.x, z: 0, sc: 1, born: performance.now(), act: null, gone: 0, yaw: (hash(id + 'yaw') - 0.5) * 0.16 };
    if (REAG === 'cards') { const W = 560, H = 334; b.tx = canvasTex(W, H); b.W = W; b.H = H; b.draw = cardDraw; grp.add(Object.assign(flatMesh(BT.cw * 1.12, BT.ch * 1.2, softShadow(), -0.16), { renderOrder: 3 })); grp.children[0].position.set(0.5, -0.16, 0.5); b.mesh = flatMesh(BT.cw, BT.ch, b.tx.t, 0.05); b.mesh.renderOrder = 5; grp.add(b.mesh); grp.rotation.y = b.yaw; }
    else if (REAG === 'both') { const W = 620, H = 300; b.tx = canvasTex(W, H); b.W = W; b.H = H; b.draw = bothDraw; b.yaw = (hash(id + 'yaw') - 0.5) * 0.07;
      const csh = flatMesh(BT.cw * 1.1, BT.ch * 1.22, softShadow(), -0.16); csh.position.set(0.45, -0.16, 0.5); csh.renderOrder = 3; grp.add(csh);
      b.mesh0 = flatMesh(BT.cw, BT.ch, b.tx.t, 0.05); b.mesh0.renderOrder = 5; b.mesh0.rotation.y = b.yaw; grp.add(b.mesh0);
      b.btx = canvasTex(240, 388); b.bx = BT.cw / 2 - BT.bw / 2 - 0.2; b.bz = BT.ch / 2 - 0.45; const lean = new T.Group();
      b.bsh = flatMesh(BT.bw * 1.5, 2.3, softShadow(), 0.07); b.bsh.position.set(b.bx + 0.45, 0.07, b.bz + 0.1); b.bsh.renderOrder = 5; grp.add(b.bsh);
      b.mesh = new T.Mesh(new T.PlaneGeometry(BT.bw, BT.bh), new T.MeshBasicMaterial({ map: b.btx.t, transparent: true, depthWrite: false, depthTest: false })); b.mesh.position.set(0, BT.bh / 2, 0); b.mesh.renderOrder = 8; lean.add(b.mesh); lean.rotation.x = -0.8; lean.position.set(b.bx, 0, b.bz); b.lean = lean; grp.add(lean); }
    else { const W = 240, H = 388; b.tx = canvasTex(W, H); b.W = W; b.H = H; b.draw = bottleDraw; const bx = BT.tw / 2 + 0.2, lean = new T.Group(); b.mesh = new T.Mesh(new T.PlaneGeometry(BT.bw, BT.bh), new T.MeshBasicMaterial({ map: b.tx.t, transparent: true, depthWrite: false })); b.mesh.position.set(0, BT.bh / 2, 0); b.mesh.renderOrder = 6; lean.add(b.mesh); lean.rotation.x = -0.8; lean.position.set(bx, 0, 0); b.lean = lean; b.bx = bx;
      const sh = flatMesh(BT.bw * 1.5, 3.2, softShadow(), -0.16); sh.position.set(bx + 0.5, -0.16, 0.4); sh.renderOrder = 3; grp.add(sh);
      b.tag = canvasTex(440, 200); b.tagM = flatMesh(BT.tw, BT.th, b.tag.t, 0.04); b.tagM.position.set(-BT.bw / 2 - 0.1, 0.04, 0.6); b.tagM.rotation.y = b.yaw; b.tagM.renderOrder = 5; const tsh = flatMesh(BT.tw * 1.08, BT.th * 1.2, softShadow(), -0.16); tsh.position.set(-BT.bw / 2 + 0.3, -0.16, 0.95); tsh.renderOrder = 3; grp.add(tsh); grp.add(b.tagM);
      // the string from the tag's hole up to the neck
      const p0 = new T.Vector3(-BT.bw / 2 - 0.1 + BT.tw / 2 - 0.65, 0.1, 0.6), p1 = new T.Vector3(bx, BT.bh * 0.8 * Math.cos(0.8), -BT.bh * 0.8 * Math.sin(0.8)), mid = p0.clone().lerp(p1, 0.5); mid.y -= 0.9; const curve = new T.QuadraticBezierCurve3(p0, mid, p1); b.string = new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(12)), new T.LineBasicMaterial({ color: 0x6b5a44 })); b.string.renderOrder = 7; grp.add(b.string); grp.add(lean); }
    scene.add(grp); return b;
  }
  function bottleSync() {
    if (!BENCHV) return; const seen = new Set(), ids = []; slots.forEach((q, i) => { if (q && !(q.fin && !TILE[q.id])) ids.push(i); });
    const both = REAG === 'both', n = ids.length, gap = both ? Math.min(7.0, 36.5 / Math.max(1, n)) : Math.min(6.2, 30 / Math.max(1, n)), z0 = (both ? -3.4 : -1.4) - (n - 1) / 2 * gap, sc = Math.min(1, gap / (both ? 7.0 : REAG === 'cards' ? 6.0 : 5.0)) * (both ? 0.96 : 1), now = performance.now(), qu = (g && g.queue) || [];
    ids.forEach((i, k) => { const q = slots[i], left = g && g.left && !q.fin && !usesHidden() ? (g.left[q.id] || 0) : 1; let b = BT.map.get(q.id);
      const z = z0 + k * gap + 2.2; SPOT[i] = { x: BT.x, z: z - (both ? 0 : 1.2) }; LAB[i] = { x: BT.x, z: z - (both ? 0 : 1.2) }; SLOTW = gap;
      if (left <= 0 && !(g.queue || []).includes(q.id) && !st.firing) { if (b && !b.gone) b.gone = now; if (b) seen.add(q.id); return; }
      if (!b) { b = bottleMake(q.id); BT.map.set(q.id, b); b.grp.position.set(BT.x, 0, z); } seen.add(q.id); b.gone = 0; b.slot = i;
      b.x = BT.x + (both ? Math.max(0, 0.2 * (k - (n - 1) / 2) * gap / 7) : REAG === 'cards' ? (k % 2 ? 0.35 : -0.35) - 0.4 : -0.9 - 0.16 * k); b.z = z; b.sc = sc; const qi = both && !st.firing ? qu.indexOf(q.id) : -1, on = !!q.o || qi >= 0, key = on + ':' + qi; b.isOn = on; if (b.on !== key) { b.on = key; b.draw(b.tx.x, q.id, on, b.W, b.H, qi); b.tx.t.needsUpdate = true; if (b.btx) { bottleDraw(b.btx.x, q.id, on, 240, 388, on); b.btx.t.needsUpdate = true; } if (b.tag) { tagDraw(b.tag.x, q.id, on, 440, 200); b.tag.t.needsUpdate = true; } } });
    BT.map.forEach((b, id) => { if (!seen.has(id)) { scene.remove(b.grp); BT.map.delete(id); } });
  }
  function bottlesClear() { BT.map.forEach(b => scene.remove(b.grp)); BT.map.clear(); BT.drops.forEach(d => scene.remove(d.m)); BT.drops = []; BT.flyers.forEach(f => scene.remove(f.m)); BT.flyers = []; BT.lights.forEach(f => scene.remove(f.m)); BT.lights = []; }
  // picking. Bottles: the bottle lifts and tips toward the page and its after-picture flies to the numbered place. Cards: the card itself slides onto the page into the place.
  function bottlePick(id, k) { const b = BT.map.get(id); if (!b) return; const now = performance.now(), to = { x: STEP.x + k * STEPD, z: STEP.z }; b.act = { kind: 'pick', t0: now, dur: 420 };
    if (REAG === 'cards') { const tx = canvasTex(b.W, b.H); cardDraw(tx.x, id, true, b.W, b.H); tx.t.needsUpdate = true; const m = flatMesh(BT.cw, BT.ch, tx.t, 0.12); m.material.depthTest = false; m.renderOrder = 9; m.visible = false; m.rotation.y = b.yaw; scene.add(m);
      BT.flyers.push({ m, card: true, t0: now + 40, dur: 380, from: { x: b.x, z: b.z }, to, s0: b.sc, s1: 0.34 }); st.bfly = now + 420; return; }
    const tl = TILE[id]; if (!tl) return; const tx = canvasTex(192, 144); tx.x.translate(96, 66); tx.x.scale(1.25, 1.25); fragOrChip(tx.x, tl[1], 0, 6, true); tx.t.needsUpdate = true;
    const m = flatMesh(6.4, 4.8, tx.t, 0.3); m.material.depthTest = false; m.renderOrder = 9; m.visible = false; scene.add(m);
    BT.flyers.push({ m, t0: now + 90, dur: 300, from: { x: b.x - (REAG === 'both' ? 0.6 * b.sc : 2), z: b.z }, to, s0: 1.25, s1: 0.8 }); st.bfly = now + 390; }
  // firing with bottles: the bottle is lifted, tipped over the page and its liquid goes onto the atoms it acts on. (With cards the pen stroke is drawn by feel.js.)
  function bottlePour(id, tgt, dur) { const b = BT.map.get(id); if (!b || !BENCHV || REAG === 'cards') return false; const now = performance.now(), col = new T.Color('rgb(' + colOf(id).join(',') + ')'); if (REAG === 'both') {
      // the bottle is carried from its card to just beside the atoms, tipped there, and one thin stream falls from its mouth onto them; then it goes back
      // (a reagent that acts in two or three places is poured on each in turn, the nearest to its card first, the stream never breaking)
      const k = b.sc, tipM = 1.75, hh = BT.bh / 2, yl = hh * (1 + Math.cos(tipM)), G = b.grp.position, sites = (tgt.sites && tgt.sites.length ? tgt.sites.slice(0, 3) : [tgt]).slice().sort((p, q) => q.x - p.x), ns = sites.length;
      const mouth = q => ({ x: q.x + 1.3, z: q.z - 2.7 }), L = sites.map(q => { const m = mouth(q); return { x: (m.x - G.x) / k + tipM * 0.6 + Math.sin(tipM) * hh, z: (m.z - G.z) / k + Math.sin(0.8) * yl }; });
      b.act = { kind: 'pour', t0: now, dur: dur + 400, hit: dur, L };
      if (!BT.dropGeo) BT.dropGeo = new T.SphereGeometry(1, 10, 8); const mat = new T.MeshBasicMaterial({ color: col, depthTest: false }), my = k * (3.4 + Math.cos(0.8) * yl), n = 30, t1 = now + dur * 0.46, fall = Math.min(170, dur * 0.24), span = now + dur - fall - t1;
      for (let i = 0; i < n; i++) { const m = new T.Mesh(BT.dropGeo, mat); m.visible = false; m.renderOrder = 9; scene.add(m); const j = i / (n - 1), si = Math.min(ns - 1, Math.floor(j * ns)), q = sites[si], mo = mouth(q);
        BT.drops.push({ m, t0: t1 + j * span, dur: fall, fx: mo.x, fy: my, fz: mo.z, tx: q.x + (hash(id + i) - 0.5) * 0.22, ty: q.y || 0.6, tz: q.z + (hash(id + 'z' + i) - 0.5) * 0.22, r: 0.34 + 0.1 * hash('r' + i + id), arc: 0.25 }); }
      return true; }
    b.act = { kind: 'pour', t0: now, dur: Math.max(560, dur + 340) };
    if (!BT.dropGeo) BT.dropGeo = new T.SphereGeometry(1, 10, 8); const mat = new T.MeshBasicMaterial({ color: col });
    const fx = b.x + b.bx - 5.6, fz = b.z - 4.2, n = 30; for (let i = 0; i < n; i++) { const m = new T.Mesh(BT.dropGeo, mat); m.visible = false; m.renderOrder = 8; scene.add(m); const j = i / (n - 1);
      BT.drops.push({ m, t0: now + 110 + j * dur * 0.55, dur: dur * 0.6, fx, fy: 5.2, fz, tx: tgt.x + (hash(id + i) - 0.5) * 0.8, ty: tgt.y || 0.6, tz: tgt.z + (hash(id + 'z' + i) - 0.5) * 0.8, r: 0.5 + 0.4 * hash('r' + i + id), arc: 4.6 + 1.0 * hash('a' + i) }); }
    return true; }
  // the place a reagent lands lights up: a soft ring of its colour on the paper under the atoms
  const lightTex = (() => { let t = null; return () => { if (t) return t; const s = canvasTex(128, 128), g2 = s.x.createRadialGradient(64, 64, 6, 64, 64, 62); g2.addColorStop(0, 'rgba(255,255,255,0.95)'); g2.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); s.x.fillStyle = g2; s.x.fillRect(0, 0, 128, 128); s.t.needsUpdate = true; t = s.t; return t; }; })();
  function siteLight(tgt, col) { if (!BENCHV || !tgt) return; const m = new T.Mesh(new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: lightTex(), transparent: true, depthWrite: false, color: new T.Color('rgb(' + (col || [255, 240, 200]).map(v => Math.round(Math.min(255, v * 0.6 + 102))).join(',') + ')'), blending: T.NormalBlending })); m.position.set(tgt.x, 0.04, tgt.z); m.renderOrder = 2; scene.add(m); BT.lights.push({ m, t0: performance.now(), dur: 620 }); }
  // Gold is a pile of coins on the bench, top right: it grows a coin at a time as coins fly to it from the yield marks, and shrinks when gold is spent.
  const GP = { x: SHP ? SHP.gp.x : 54.6, z: SHP ? SHP.gp.z : -13.5, coins: [], shown: 0, fly: [], geo: null, mat: null, edge: null };
  function coinMesh() { if (!GP.geo) { GP.geo = new T.CylinderGeometry(1.38, 1.38, 0.3, 22); GP.mat = std({ color: lin(0xe8b93c), roughness: 0.35, metalness: 0.55, emissive: lin(0x5a3c08) }); GP.edge = new T.MeshBasicMaterial({ color: lin(0x6b4a12), side: T.BackSide }); } const m = new T.Mesh(GP.geo, GP.mat); m.castShadow = false; const e = new T.Mesh(GP.geo, GP.edge); e.scale.set(1.07, 1.25, 1.07); m.add(e); return m; }
  const TIN = SHAPE === 'a';   // (builder 13, the owner's pick) the gold is kept in a dented cash tin, lid off, by the notebook
  const coinSpot = i => { if (!TIN) { const col = i % 4, lvl = Math.floor(i / 4); return { x: GP.x + (col - 1.5) * 3.0 + (lvl % 2 ? 0.35 : 0), y: 0.15 + lvl * 0.32, z: GP.z + (col % 2 ? 1.1 : 0) + 0.16 * lvl }; }
    const col = i % 3, row = Math.floor(i / 3) % 2, lvl = Math.floor(i / 6), j = k => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return (v - Math.floor(v)) - 0.5; }, heap = Math.max(0, lvl - 5);
    return { x: GP.x + (col - 1) * 2.2 * (1 - 0.12 * heap) + 0.5 * j(1), y: 0.32 + lvl * 0.27, z: GP.z + (row - 0.5) * 2.2 * (1 - 0.15 * heap) + 0.5 * j(2) }; };
  function tinMake() { const G = new T.Group(), W = 7.6, D = 5.4, H = 2.0, th = 0.16, enamel = std({ color: lin(0x3d5a4a), roughness: 0.45, metalness: 0.35 }), inner = std({ color: lin(0x8f9a94), roughness: 0.5, metalness: 0.5 }), dark = new T.MeshBasicMaterial({ color: lin(0x1d2622), side: T.BackSide });
    const wall = (w, d, x, z, ry, lean) => { const m = add(new T.BoxGeometry(w, H, d), [enamel, enamel, inner, enamel, enamel, enamel], x, H / 2 + 0.05, z, G); m.rotation.y = ry || 0; m.rotation.z = lean || 0; const e = new T.Mesh(m.geometry, dark); e.scale.set(1.03, 1.05, 1 + 0.14 / Math.max(0.2, d)); m.add(e); return m; };
    add(new T.BoxGeometry(W, 0.12, D), inner, 0, 0.08, 0, G); wall(W + th, th, 0, -D / 2, 0, 0); wall(W + th, th, 0.05, D / 2, 0.015, 0); wall(th, D, -W / 2, 0, 0, 0.05); wall(th, D, W / 2, 0.1, -0.04, -0.03);
    // a dent in the front wall: a short darker crease; rust at one corner
    add(new T.BoxGeometry(1.5, 0.9, 0.06), std({ color: lin(0x2c4336), roughness: 0.7 }), 1.9, 1.0, D / 2 + 0.1, G).rotation.z = 0.5; add(new T.BoxGeometry(0.7, 0.5, 0.06), std({ color: lin(0x7a4a22), roughness: 0.9 }), -W / 2 + 0.5, 0.4, D / 2 + 0.1, G);
    // the lid, off, leaning on the tin's left side
    const lid = new T.Group(), LW = W + 0.5, LD = D + 0.5, rim = (w, d, x, z) => { const m = add(new T.BoxGeometry(w, 0.55, d), [enamel, enamel, enamel, enamel, enamel, enamel], x, 0.3, z, lid); const e = new T.Mesh(m.geometry, dark); e.scale.set(1 + 0.12 / Math.max(0.2, w), 1.12, 1 + 0.12 / Math.max(0.2, d)); m.add(e); };
    add(new T.BoxGeometry(LW, 0.1, LD), inner, 0, 0.07, 0, lid).add(new T.Mesh(new T.BoxGeometry(LW, 0.1, LD), dark)).scale.set(1.02, 1.6, 1.03); rim(LW, 0.16, 0, -LD / 2); rim(LW, 0.16, 0, LD / 2); rim(0.16, LD, -LW / 2, 0); rim(0.16, LD, LW / 2, 0);
    add(new T.BoxGeometry(LW - 1.2, 0.03, 0.12), std({ color: lin(0xc9d2cc), roughness: 0.3, metalness: 0.6 }), 0.2, 0.14, -LD / 2 + 0.7, lid); add(new T.BoxGeometry(0.9, 0.03, 0.5), std({ color: lin(0x7a4a22), roughness: 0.9 }), -LW / 2 + 1.0, 0.14, LD / 2 - 0.7, lid);
    { const ls = flatMesh(LW + 2.4, LD + 2.2, softShadow(), 0.02); ls.position.set(0.4, 0.02, 0.4); lid.add(ls); } lid.position.set(0.35, 0, 0.25); lid.rotation.y = 0.09; lid.scale.set(1.08, 1, 1.12); G.add(lid);   /* the tin stands in its own upturned lid */
    // the paper label, stuck to the front and lying out on the bench, with the count
    const lb = canvasTex(256, 160), lm = flatMesh(4.3, 2.7, lb.t, 0.06); lm.material.transparent = true; lm.position.set(-0.6, 0.06, D / 2 + 1.35); lm.rotation.y = 0.06; G.add(lm);
    const sh = flatMesh(W + 5, D + 4.4, softShadow(), 0.02); sh.position.set(0.5, 0.02, 0.6); G.add(sh);
    G.position.set(GP.x, 0, GP.z); G.rotation.y = -0.05; scene.add(G); GP.tin = { G, lb, n: -1 }; }
  function tinLabel(n) { const t = GP.tin; if (!t || t.n === n) return; t.n = n; const c = t.lb.x; c.clearRect(0, 0, 256, 160); c.save(); c.translate(128, 80); c.rotate(-0.03); c.fillStyle = '#f3ecd6'; c.strokeStyle = 'rgba(60,50,36,0.7)'; c.lineWidth = 3; c.beginPath(); c.rect(-118, -70, 236, 140); c.fill(); c.stroke(); c.strokeStyle = 'rgba(190,60,50,0.55)'; c.lineWidth = 2; c.strokeRect(-106, -58, 212, 116); c.fillStyle = 'rgba(214,196,150,0.75)'; c.fillRect(-40, -78, 80, 20);
    c.fillStyle = '#22252c'; c.textAlign = 'center'; c.textBaseline = 'middle'; marker(c, 96); c.fillText(String(n), 0, 6); c.restore(); t.lb.t.needsUpdate = true; }
  function goldFrame(now, dt) { if (!BENCHV) return; if (TIN) { if (!GP.tin) tinMake(); const on = !!run && st.mode !== 'shop' && !title.on; GP.tin.G.visible = on; if (on) { tinLabel(run.coins | 0); const jb = GP.bump ? Math.max(0, 1 - (now - GP.bump) / 320) : 0; GP.tin.G.scale.set(1 + 0.03 * jb, 1 - 0.07 * jb, 1 + 0.03 * jb); GP.tin.G.rotation.z = 0.02 * jb * Math.sin(now / 28); if (jb > 0) dirty = true; } } const want = run && st.mode !== 'shop' ? (GP.sweep ? 0 : Math.max(0, Math.min(44, run.coins | 0))) : 0, flying = GP.fly.length;
    if (GP.shown + flying < want && (!GP.lastSpawn || now - GP.lastSpawn > 90)) { GP.lastSpawn = now; const m = coinMesh(), nP = st.passT ? Object.keys(st.passT).length : 0, from = st.mode === 'play' || st.mode === 'move' || st.mode === 'done' ? (() => { const nm = Math.max(1, P.runMarks(st.quota || 1).length), kk = Math.max(1, Math.min(nm, nP - 1)); return { x: TRK.x0 + (TRK.x1 - TRK.x0) * (0.5 + 0.5 * kk / nm), y: 0.4, z: TRK.z - 2.2 }; })() : GP.src || { x: GP.x - 6, y: 0.4, z: GP.z + 6 }; GP.src = null; if (TIN) m.scale.setScalar(0.78); scene.add(m); GP.fly.push({ m, t0: now, dur: 620, from, to: coinSpot(GP.shown + flying) }); }
    GP.fly = GP.fly.filter(f => { const u = (now - f.t0) / f.dur; if (u >= 1) { f.m.position.set(f.to.x, f.to.y, f.to.z); f.m.rotation.set(0, 0, 0); GP.coins.push(f.m); GP.shown++; GP.bump = now; try { if (AA.sfx.coin) AA.sfx.coin(); } catch (e) { /* no sound */ } return false; } const e = TIN ? 1 - Math.pow(1 - u, 2.2) : u * u * (3 - 2 * u), hy = TIN ? 11 * Math.sin(Math.PI * Math.pow(u, 0.6)) * (1 - u * u * u) : 9 * Math.sin(Math.PI * u); f.m.position.set(f.from.x + (f.to.x - f.from.x) * e, f.from.y + (f.to.y - f.from.y) * e + hy, f.from.z + (f.to.z - f.from.z) * e); f.m.rotation.x = u * 9; f.m.rotation.z = u * 5; return true; });
    if (GP.sweep && GP.coins.length && st.mode === 'done' && !st.pass) { /* a lost run: its gold is swept off the bench, coin by coin */ const k = Math.floor((now - GP.sweep) / 70); while (GP.coins.length && (GP.outN || 0) < k) { const m = GP.coins.pop(); GP.shown--; GP.outN = (GP.outN || 0) + 1; (GP.outs = GP.outs || []).push({ m, t0: now, fx: m.position.x, fz: m.position.z, fy: m.position.y }); if (GP.outN % 3 === 1) sfxN('coin'); } } else if (!GP.sweep) GP.outN = 0;
    if (GP.outs && GP.outs.length) { dirty = true; GP.outs = GP.outs.filter(o => { const u = (now - o.t0) / 700; if (u >= 1) { scene.remove(o.m); return false; } o.m.position.set(o.fx + 26 * u * u + 3 * u, o.fy + 2.5 * Math.sin(Math.PI * Math.min(1, u * 1.3)), o.fz - 4 * u); o.m.rotation.z = -u * 7; return true; }); }
    while (!GP.sweep && GP.shown > want && GP.coins.length) { scene.remove(GP.coins.pop()); GP.shown--; GP.bump = now; }
    const b = GP.bump ? Math.max(0, 1 - (now - GP.bump) / 260) : 0; GP.coins.forEach((m, i) => { const q = coinSpot(i); m.position.y = q.y + (i === GP.coins.length - 1 ? 0.5 * b : 0); m.visible = st.mode !== 'shop'; }); }
  // The coffee cup stands on the bench; a ring stain on a new page is where the cup was set down: it is carried over, put down on free paper, and taken back.
  const CUP = { x: SHP ? SHP.cup.x : 53.4, z: SHP ? SHP.cup.z : -28.2, grp: null, visit: null, B: 4.7 * 2 * UCM / 2 / 2.1 * 0.91 * (SHP ? 0.8 : 1), steam: [] };
  // (builder 12, the owner's pick) THE CUP IS THE RE-DEAL. On a page of play, clicking the cup deals a fresh hand (the rules' P.redraw: once a page, paid with one use of
  // the fullest bottle, no gold); on the pick page it deals another pair (P.runRedraw: gold, 1 then 2 then 3, three times a round). The cup tips as if sipped, the
  // coffee drops to what is left and leaves a tide line, the cards are swept off and a fresh hand lands. An empty cup shows the ring at its bottom and only rattles.
  // It is full again, with fuller steam, when the rules give the re-deal back (a new page in play; a new round on the pick page). It never leaves its saucer.
  const cupPlayOn = () => st.mode === 'play' && !!g && !g.over && (P.redrawInfo ? P.redrawInfo(g).why !== 'off' : !!P.RULE.redraw && !!P.RULE.hand && (g.rackIds || []).length > (g.kinds || []).length);
  function cupLeft() { if (st.mode === 'play' && g && !g.over) { const ri = P.redrawInfo ? P.redrawInfo(g) : null; if (ri) return ri.why === 'off' ? null : (ri.of ? ri.left / ri.of : 0); return cupPlayOn() ? (P.canRedraw(g) || CUP.sip || CUP.sweep ? 1 : 0) : null; } if (st.mode === 'brief' && run) { const most = (P.CHOOSE && P.CHOOSE.most) || 3; return pairOn() && run.round > 1 ? Math.max(0, most - (run.redraws || 0)) / most : (title.on ? 1 : 0); } return null; }
  function cupRattle() { CUP.rattle = performance.now(); CUP.vx += 0.5; sfxN('cantBuy'); }
  function cupAct() { const now = performance.now(); if (CUP.sip || CUP.sweep || title.on) return;
    if (st.mode === 'play' && g && (P.redrawInfo ? P.redrawInfo(g).can : P.canRedraw(g)) && !st.firing) { CUP.sip = { t0: now }; CUP.sweep = { t0: now + 420, f: () => doRedraw() }; sfxN('redraw'); }
    else if (st.mode === 'brief' && pairOn() && run.round > 1 && !st.choose) { const c = P.pairCost(run); if (c == null || (run.coins || 0) < c) return cupRattle(); CUP.sip = { t0: now + c * 130 + 300 }; CUP.sweep = { t0: now + c * 130 + 720, f: () => doPair() };
      for (let k = 0; k < c; k++) { const m = coinMesh(); m.scale.setScalar(0.85); m.visible = false; scene.add(m); CUP.fly.push({ m, t0: now + k * 130, dur: 520, from: { x: GP.x, z: GP.z }, to: { x: CUP.x - 2.75 * CUP.B * Math.cos(0.5 + k * 0.5), z: CUP.z + 2.75 * CUP.B * Math.sin(0.5 + k * 0.5) } }); } }
    else if (cupPlayOn() || st.mode === 'brief') cupRattle(); }
  function cupHit(e) { if (!CUP.grp || !CUP.grp.visible) return false; const r = cv.getBoundingClientRect(), v = new T.Vector3(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); if (!ray.ray.intersectPlane(ground, v)) return false; return Math.hypot(v.x - CUP.x, v.z - CUP.z + 1.2) < 3.5 * CUP.B; }
  function cupMake() { const G = new T.Group(), B = new T.Group(), white = std({ color: lin(0xf2efe6), roughness: 0.35, side: T.DoubleSide });
    add(new T.CylinderGeometry(3.25, 2.5, 0.28, 32), std({ color: lin(0xf2efe6), roughness: 0.35 }), 0, 0.1, 0, G); add(new T.TorusGeometry(3.2, 0.09, 8, 36).rotateX(Math.PI / 2), std({ color: lin(0xcfcabb), roughness: 0.4 }), 0, 0.25, 0, G);
    const sh = flatMesh(8.4, 7.4, softShadow(), -0.18); sh.position.set(0.5, -0.18, 0.5); G.add(sh);
    add(new T.CylinderGeometry(2.1, 1.75, 3.2, 28, 1, true), white, 0, 1.6, 0, B); add(new T.CircleGeometry(1.75, 24).rotateX(-Math.PI / 2), std({ color: lin(0xe9e4d6), roughness: 0.5 }), 0, 0.06, 0, B); add(new T.CircleGeometry(1.75, 24).rotateX(Math.PI / 2), std({ color: lin(0xd8d4c8), roughness: 0.5 }), 0, 0.02, 0, B);
    const hd = add(new T.TorusGeometry(1.15, 0.28, 10, 20, Math.PI), white, 2.05, 1.7, 0, B); hd.rotation.z = -Math.PI / 2;
    add(new T.RingGeometry(0.85, 1.55, 28).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: lin(0x6b4120), transparent: true, opacity: 0.6 }), 0, 0.08, 0, B); add(new T.CircleGeometry(0.5, 16).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: lin(0x4a2a10), transparent: true, opacity: 0.5 }), 0.3, 0.085, 0.4, B);
    CUP.ct = canvasTex(128, 128); CUP.surf = add(new T.CircleGeometry(1, 32).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: CUP.ct.t }), 0, 2.7, 0, B); CUP.tides = []; CUP.tideMat = new T.MeshBasicMaterial({ color: lin(0x8a5a2e), transparent: true, opacity: 0.75 });
    B.position.y = 0.26; G.add(B); CUP.body = B; CUP.steam = [];
    { const c = canvasTex(64, 128), gr = c.x.createRadialGradient(32, 64, 2, 32, 64, 60); gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.x.fillStyle = gr; c.x.save(); c.x.translate(32, 64); c.x.scale(0.45, 1); c.x.translate(-32, -64); c.x.fillRect(-60, 0, 190, 128); c.x.restore(); c.t.needsUpdate = true;
      for (let i = 0; i < 7; i++) { const m = new T.Mesh(new T.PlaneGeometry(1.5, 3.4), new T.MeshBasicMaterial({ map: c.t, transparent: true, depthWrite: false, opacity: 0 })); m.rotation.x = -0.9; m.renderOrder = 6; G.add(m); CUP.steam.push(m); } }
    G.traverse(o => { o.castShadow = false; }); G.position.set(CUP.x, -0.2, CUP.z); G.scale.setScalar(CUP.B); scene.add(G); CUP.grp = G;
    Object.assign(CUP, { lvl: 1, shown: 1, sx: 0, sz: 0, vx: 0, vz: 0, hov: false, hk: 0, sip: null, rattle: 0, gust: 0, boost: 0, steamK: 1, fly: [], sweep: null, last: performance.now() });
    cv.addEventListener('pointermove', e => { const h = cupHit(e) && !title.on && (cupPlayOn() || (st.mode === 'brief' && pairOn() && run.round > 1)); if (h !== CUP.hov) { CUP.hov = h; if (h) { sfxN('hover'); CUP.vx += 0.12; } } if (h) cv.style.cursor = 'pointer'; });
    cv.addEventListener('click', e => { if (cupHit(e)) cupAct(); }); }
  // (builder 14) the cup, made as the balance and the jars are made: turned from one thick-walled profile (foot, wall, rounded rim, inner wall), a handle of one bent tube seen from the bench's angle,
  // an ink outline, two blue lines under the rim, a chip in the rim, an old drip down the outside, the lamp's highlight on the glaze, a meniscus where the coffee meets the wall,
  // steam as soft wisps, a dried ring on the bench where it stood before, and a close dark shadow under the foot
  function cupMake2() { const G = new T.Group(), B = new T.Group(), glaze = std({ color: lin(0xf3eee1), roughness: 0.22, side: T.DoubleSide }), plain = m => { m.userData.plain = true; m.castShadow = false; return m; }, nobox = m => { m.userData.nobox = true; return m; };
    CUP.yOf = lv => 0.62 + 2.3 * lv; CUP.rIn = y => 1.56 + 0.13 * (y - 0.6) / 2.4;
    { const c = canvasTex(256, 256), x = c.x, ring = (cx, cy, r, a, lw) => { for (let k = 0; k < 40; k++) { const a0 = k / 40 * 6.283, a1 = a0 + 0.17, al = a * (0.45 + 0.55 * hash('rg' + k + r)); if (hash('gap' + k + r) < 0.12) continue; x.strokeStyle = 'rgba(60,32,10,' + al.toFixed(3) + ')'; x.lineWidth = lw * (0.6 + 0.8 * hash('lw' + k + r)); x.beginPath(); x.arc(cx, cy, r + 1.5 * (hash('rr' + k) - 0.5), a0, a1); x.stroke(); } }; ring(112, 140, 62, 0.5, 5); ring(150, 112, 62, 0.2, 4); x.fillStyle = 'rgba(60,32,10,0.25)'; x.beginPath(); x.ellipse(52, 196, 7, 5, 0.4, 0, 6.3); x.fill(); c.t.needsUpdate = true; const st0 = flatMesh(7.2, 7.2, c.t, 0.23); st0.position.set(-1.6, 0.23, 1.1); st0.renderOrder = 1; nobox(st0); G.add(st0); }
    { const sh = flatMesh(7.6, 5.4, softShadow(), 0.22); sh.position.set(0.9, 0.22, 0.7); sh.renderOrder = 2; G.add(sh); const s2 = flatMesh(4.6, 3.6, softShadow(), 0.24); s2.position.set(0.25, 0.24, 0.3); s2.renderOrder = 2; G.add(s2); }
    const prof = [[0, 0.0], [1.5, 0.0], [1.72, 0.1], [1.86, 0.5], [2.02, 2.9], [2.08, 3.12], [2.02, 3.26], [1.88, 3.3], [1.75, 3.22], [1.7, 3.0], [1.57, 0.62], [1.4, 0.46], [0, 0.46]].map(q => new T.Vector2(q[0], q[1]));
    add(new T.LatheGeometry(prof, 44), glaze, 0, 0, 0, B);
    const hc = new T.CatmullRomCurve3([[1.9, 2.62, 0], [2.75, 2.72, 0], [3.3, 2.2, 0], [3.25, 1.45, 0], [2.7, 0.95, 0], [1.86, 0.86, 0]].map(q => new T.Vector3(q[0], q[1], q[2]))); add(new T.TubeGeometry(hc, 28, 0.25, 10, false), glaze, 0, 0, 0, B);
    if (AA.rxKit.finish) AA.rxKit.finish(T, B, 0.055);
    const navy = new T.MeshBasicMaterial({ color: lin(0x2f4a78) }); [2.62, 2.78].forEach((y, i) => plain(add(new T.TorusGeometry(1.86 + 0.16 * (y - 0.5) / 2.4 + 0.012, i ? 0.028 : 0.05, 6, 44).rotateX(Math.PI / 2), navy, 0, y, 0, B)));
    // the lamp on the glaze (left and front), a second small glint, and one on the handle
    const hi = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: T.DoubleSide, depthWrite: false }); plain(add(new T.CylinderGeometry(2.045, 1.93, 1.7, 6, 1, true, -1.0, 0.2), hi, 0, 1.6, 0, B)); plain(add(new T.CylinderGeometry(2.03, 1.99, 0.5, 4, 1, true, -0.68, 0.09), hi, 0, 2.1, 0, B)); plain(add(new T.SphereGeometry(0.1, 8, 6), hi, 3.05, 2.5, 0.2, B)).scale.set(1.8, 0.8, 1);
    // the chip in the rim (bare clay) and the old drip below it
    plain(add(new T.SphereGeometry(0.2, 10, 8), new T.MeshBasicMaterial({ color: lin(0x9c8466) }), 2.04 * Math.sin(0.55), 3.22, 2.04 * Math.cos(0.55), B)).scale.set(1.1, 0.55, 0.5); plain(add(new T.SphereGeometry(0.11, 8, 6), new T.MeshBasicMaterial({ color: lin(0x3a2c20) }), 2.06 * Math.sin(0.55), 3.2, 2.06 * Math.cos(0.55), B)).scale.set(1.2, 0.5, 0.5);
    plain(add(new T.CylinderGeometry(2.085, 2.0, 1.25, 3, 1, true, 0.18, 0.06), new T.MeshBasicMaterial({ color: lin(0x5a3414), transparent: true, opacity: 0.6, side: T.DoubleSide }), 0, 2.55, 0, B)); plain(add(new T.SphereGeometry(0.09, 8, 6), new T.MeshBasicMaterial({ color: lin(0x5a3414), transparent: true, opacity: 0.7 }), 2.0 * Math.sin(0.21), 1.9, 2.0 * Math.cos(0.21), B)).scale.set(1, 1.5, 0.5);
    // the bottom of an empty cup: the old stain; the coffee, its meniscus
    plain(add(new T.RingGeometry(0.75, 1.36, 28).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: lin(0x6b4120), transparent: true, opacity: 0.6 }), 0, 0.48, 0, B)); plain(add(new T.CircleGeometry(0.45, 16).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: lin(0x4a2a10), transparent: true, opacity: 0.5 }), 0.3, 0.485, 0.35, B));
    CUP.ct = canvasTex(128, 128); CUP.surf = plain(add(new T.CircleGeometry(1, 36).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: CUP.ct.t }), 0, 2.7, 0, B)); CUP.men = plain(new T.Mesh(new T.TorusGeometry(0.985, 0.035, 6, 44).rotateX(Math.PI / 2), new T.MeshBasicMaterial({ color: lin(0x8a5a30) }))); CUP.surf.add(CUP.men); CUP.men.position.y = 0.01;
    CUP.tides = []; CUP.tideMat = new T.MeshBasicMaterial({ color: lin(0x7a4c24), transparent: true, opacity: 0.8 });
    B.position.y = 0.26; B.rotation.y = -0.5; const BH = new T.Group(); BH.add(B); G.add(BH); CUP.body = BH; CUP.inner = B; CUP.steam = [];
    // steam: soft wisps, each a few faint curling strokes
    { const c = canvasTex(64, 128), x = c.x; x.lineCap = 'round'; x.shadowColor = 'rgba(255,255,255,0.9)'; x.shadowBlur = 9; for (let k = 0; k < 3; k++) { x.strokeStyle = 'rgba(255,255,255,' + (0.1 + 0.07 * k) + ')'; x.lineWidth = 7 - 2 * k; x.beginPath(); x.moveTo(32 + (k - 1) * 5, 120); x.bezierCurveTo(8 + k * 8, 92, 54 - k * 6, 64, 30 + (k - 1) * 6, 38); x.bezierCurveTo(20, 24, 40, 16, 34, 6); x.stroke(); } c.t.needsUpdate = true;
      for (let i = 0; i < 9; i++) { const m = new T.Mesh(new T.PlaneGeometry(1.9, 3.8), new T.MeshBasicMaterial({ map: c.t, transparent: true, depthWrite: false, opacity: 0 })); m.rotation.x = -0.9; m.renderOrder = 6; nobox(m); G.add(m); CUP.steam.push(m); } }
    G.traverse(o => { o.castShadow = false; }); G.position.set(CUP.x, -0.2, CUP.z); G.scale.setScalar(CUP.B); scene.add(G); CUP.grp = G;
    Object.assign(CUP, { lvl: 1, shown: 1, sx: 0, sz: 0, vx: 0, vz: 0, hov: false, hk: 0, sip: null, rattle: 0, gust: 0, boost: 0, steamK: 1, fly: [], sweep: null, last: performance.now() });
    cv.addEventListener('pointermove', e => { const h = cupHit(e) && !title.on && (cupPlayOn() || (st.mode === 'brief' && pairOn() && run.round > 1)); if (h !== CUP.hov) { CUP.hov = h; if (h) { sfxN('hover'); CUP.vx += 0.12; } } if (h) cv.style.cursor = 'pointer'; });
    cv.addEventListener('click', e => { if (cupHit(e)) cupAct(); }); }
  function cupFrame(now) { if (!BENCHV) return; if (!CUP.grp) cupMake2(); const G = CUP.grp, B = CUP.body, dt = Math.min(0.05, (now - CUP.last) / 1000); CUP.last = now; G.visible = st.mode !== 'shop'; dirty = true;
    // what is left, read from the rules; a drop leaves a tide line, a rise is a refill
    const L0 = cupLeft(), sipping = CUP.sip && now - CUP.sip.t0 < 470; if (L0 != null && !sipping && !CUP.sweep) { if (L0 < CUP.lvl - 0.01) { const y = CUP.yOf(CUP.shown), t = new T.Mesh(new T.TorusGeometry(CUP.rIn(y) + 0.01, 0.035, 6, 40).rotateX(Math.PI / 2), CUP.tideMat); t.position.y = y; t.userData.plain = true; CUP.inner.add(t); CUP.tides.push(t); } if (L0 > CUP.lvl + 0.01) { CUP.tides.forEach(t => CUP.inner.remove(t)); CUP.tides = []; CUP.boost = 1; CUP.vz += 0.5; if (!title.on && now - (CUP.born || (CUP.born = now)) > 1500) sfxN('pour'); } CUP.lvl = L0; }
    CUP.shown += (CUP.lvl - CUP.shown) * Math.min(1, dt * 3.5); CUP.boost *= Math.exp(-dt / 2.4); CUP.gust *= Math.exp(-dt / 0.9);
    // the cup: lifts a little under the pointer; tips when sipped and is set down with a small bounce; rattles when empty
    CUP.hk += ((CUP.hov ? 1 : 0) - CUP.hk) * Math.min(1, dt * 14); let y = 0.26 + 0.5 * CUP.hk, tip = 0, rz = 0;
    if (CUP.sip) { const u = (now - CUP.sip.t0) / 950; if (u >= 1) { CUP.sip = null; } else if (u >= 0) { const sm = q => { q = Math.max(0, Math.min(1, q)); return q * q * (3 - 2 * q); }, up = sm(u / 0.3) * (1 - sm((u - 0.52) / 0.3)); y += 2.4 * up; tip = 0.85 * up; if (u > 0.82) { const q = (u - 0.82) / 0.18; y -= 0.22 * Math.sin(q * Math.PI * 2) * (1 - q); if (!CUP.sip.thud) { CUP.sip.thud = true; sfxN('click'); CUP.vx += 0.9; CUP.vz -= 0.6; CUP.gust = 1; } } if (u > 0.2 && !CUP.sip.g) { CUP.sip.g = true; CUP.gust = 1; CUP.vz += 1.4; } } }
    if (CUP.rattle) { const q = (now - CUP.rattle) / 1000; if (q > 0.6) CUP.rattle = 0; else rz = 0.11 * Math.sin(q * 70) * Math.exp(-q * 7); }
    B.position.y = y; B.rotation.x = tip; B.rotation.z = rz;
    // the coffee: a live surface. Its level follows what is left; it sloshes on a spring when the cup is nudged, tipped or set down; the lamp's highlight rides the slosh
    CUP.vx += (-38 * CUP.sx - 3.2 * CUP.vx) * dt; CUP.vz += (-38 * CUP.sz - 3.2 * CUP.vz) * dt; CUP.sx += CUP.vx * dt; CUP.sz += CUP.vz * dt; const en = Math.min(1, Math.hypot(CUP.sx, CUP.sz) * 3 + Math.hypot(CUP.vx, CUP.vz) * 0.4);
    { const S = CUP.surf, yl = CUP.yOf(CUP.shown), r = CUP.rIn(yl) + 0.02; S.visible = CUP.shown > 0.03; S.position.y = yl; S.scale.set(r, 1, r); S.rotation.x = -tip * 0.86 + CUP.sz * 0.16; S.rotation.z = -CUP.sx * 0.16;
      const x = CUP.ct.x, gr = x.createRadialGradient(64, 64, 6, 64, 64, 66); gr.addColorStop(0, '#4b2a12'); gr.addColorStop(0.75, '#341c0b'); gr.addColorStop(1, '#211006'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
      for (let k = 0; k < 3; k++) { const u = ((now / 1900) + k / 3) % 1; x.strokeStyle = 'rgba(206,150,96,' + ((0.07 + 0.3 * en) * (1 - u)).toFixed(3) + ')'; x.lineWidth = 2 + 3 * en; x.beginPath(); x.ellipse(64 + CUP.sx * 34, 64 + CUP.sz * 34, 6 + u * 58, (6 + u * 58) * (0.9 + 0.1 * Math.sin(now / 700 + k)), 0, 0, 6.3); x.stroke(); }
      x.fillStyle = 'rgba(255,232,190,0.62)'; x.beginPath(); x.ellipse(42 + CUP.sx * 70 + 2 * Math.sin(now / 830), 38 + CUP.sz * 70 + 1.5 * Math.sin(now / 1130), 15 + 5 * en, 8 + 2 * Math.sin(now / 600), -0.5 + CUP.sx, 0, 6.3); x.fill(); x.fillStyle = 'rgba(255,240,214,0.35)'; x.beginPath(); x.ellipse(58 + CUP.sx * 60, 52 + CUP.sz * 60, 5, 3, -0.5, 0, 6.3); x.fill(); CUP.ct.t.needsUpdate = true; }
    // the steam: seven wisps that curl, drift and thin as they rise; torn sideways when the cup is tipped or set down; none over an empty cup; fuller just after a refill
    { const want = CUP.shown > 0.05 ? 0.5 + 0.5 * CUP.shown + 0.9 * CUP.boost : 0; CUP.steamK += (want - CUP.steamK) * Math.min(1, dt * 2); const N = CUP.steam.length;
      CUP.steam.forEach((m, i) => { const u = ((now / (3000 + 260 * (i % 3))) + i / N) % 1, curl = Math.sin(u * 5.2 + i * 1.7 + now / 1900); m.position.set(0.85 * curl * (0.25 + u) + CUP.gust * (2.6 * u + 0.6) * (i % 2 ? 1 : -0.6), 3.3 + u * (4.6 + 1.6 * CUP.boost), -u * 2.4 + 0.4 * Math.cos(u * 4 + i)); m.rotation.z = 0.55 * curl * u + CUP.gust * (i % 2 ? 0.6 : -0.6); m.scale.set(0.6 + u * 1.25 + 0.5 * CUP.gust, 0.75 + u * 0.8, 1); m.material.opacity = Math.max(0, Math.min(1, CUP.steamK * 0.95 * Math.sin(Math.PI * u) * (1 - 0.55 * u) * (0.65 + 0.35 * Math.sin(now / 430 + i * 2)) * (1 - 0.6 * CUP.gust))); }); }
    // what the re-deal would replace answers the pointer; the sweep and the fresh hand
    const sw = CUP.sweep, e = sw ? Math.max(0, Math.min(1, (now - (sw.t0 - 400)) / 400)) : 0; let k = 0;
    BT.map.forEach(b => { if (b.gone) return; const G2 = b.grp; if (b.born == null) b.born = (CUP.dealT || 0) + k * 85; const a = (now - b.born) / 480; G2.rotation.z = CUP.hk > 0.02 && st.mode === 'play' && !st.firing ? 0.03 * CUP.hk * Math.sin(now / 80 + k * 1.9) : 0;
      let py = 0; if (a < 0) G2.visible = false; else if (a < 1) { G2.visible = true; const f = a / 0.55, yy = a < 0.55 ? 8 * (1 - f * f) : 0.7 * Math.sin(Math.PI * (a - 0.55) / 0.45) * (1 - (a - 0.55) / 0.45); py = yy; G2.rotation.y = (1 - a) * 0.22 * (k % 2 ? 1 : -1); if (a >= 0.55 && !b.thud) { b.thud = true; sfxN('click'); CUP.vz += 0.25; } } else if (b.thud !== 2) { b.thud = 2; G2.rotation.y = 0; }
      if (sw) { G2.position.x = b.x + e * e * 30; py += 1.5 * Math.sin(Math.PI * e); G2.rotation.y = e * 0.5 * (k % 2 ? 1 : -1); } G2.position.y = py; k++; });
    if (CUP.hk > 0.02 && st.mode === 'brief') briefMols.forEach((m, i) => { m.group.rotation.y = 0.05 * CUP.hk * Math.sin(now / 110 + i * 2); });
    if (sw && now >= sw.t0) { CUP.sweep = null; CUP.dealT = now + 60; try { sw.f(); } catch (err) { /* the rules said no */ } BT.map.forEach(b => { b.born = null; b.thud = 0; }); }
    CUP.fly = CUP.fly.filter(q => { const u = (now - q.t0) / q.dur; if (u < 0) return true; if (u >= 1.9) { scene.remove(q.m); return false; } const c = Math.min(1, u), s2 = c * c * (3 - 2 * c); q.m.visible = true; q.m.position.set(q.from.x + (q.to.x - q.from.x) * s2, 0.35 + 0.5 * Math.sin(Math.PI * c), q.from.z + (q.to.z - q.from.z) * s2); if (u >= 1 && !q.done) { q.done = true; sfxN('coin'); CUP.vx += 0.3; CUP.gust = Math.max(CUP.gust, 0.4); } return true; }); }
  function cupMakeOld() { const cup = new T.Group(); add(new T.CylinderGeometry(2.1, 1.75, 3.2, 28, 1, true), std({ color: lin(0xf2efe6), roughness: 0.35, side: T.DoubleSide }), 0, 1.6, 0, cup); add(new T.CircleGeometry(1.92, 28).rotateX(-Math.PI / 2), std({ color: lin(0x3a2212), roughness: 0.2 }), 0, 2.7, 0, cup); add(new T.CircleGeometry(1.75, 24).rotateX(Math.PI / 2), std({ color: lin(0xd8d4c8), roughness: 0.5 }), 0, 0.02, 0, cup); const hd = add(new T.TorusGeometry(1.15, 0.28, 10, 20, Math.PI), std({ color: lin(0xf2efe6), roughness: 0.35 }), 2.05, 1.7, 0, cup); hd.rotation.z = -Math.PI / 2; const sh = flatMesh(6.4, 5.2, softShadow(), -0.18); sh.position.set(0.5, -0.18, 0.5); cup.add(sh); { const sa = add(new T.CylinderGeometry(3.25, 2.5, 0.28, 32), std({ color: lin(0xf2efe6), roughness: 0.35 }), 0, 0.1, 0, cup); const rim = add(new T.TorusGeometry(3.2, 0.09, 8, 36).rotateX(Math.PI / 2), std({ color: lin(0xcfcabb), roughness: 0.4 }), 0, 0.25, 0, cup); const rg = add(new T.RingGeometry(1.95, 2.2, 32).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: lin(0xb9b3a2), transparent: true, opacity: 0.55 }), 0, 0.26, 0, cup); [sa, rim, rg].forEach(o => { o.userData.saucer = true; }); }
    { const c = canvasTex(64, 128), g = c.x.createRadialGradient(32, 64, 2, 32, 64, 60); g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(0.5, 'rgba(255,255,255,0.16)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.x.fillStyle = g; c.x.save(); c.x.translate(32, 64); c.x.scale(0.45, 1); c.x.translate(-32, -64); c.x.fillRect(-60, 0, 190, 128); c.x.restore(); c.t.needsUpdate = true; for (let i = 0; i < 4; i++) { const m = new T.Mesh(new T.PlaneGeometry(1.5, 3.4), new T.MeshBasicMaterial({ map: c.t, transparent: true, depthWrite: false, opacity: 0 })); m.rotation.x = -0.9; m.renderOrder = 6; m.castShadow = false; cup.add(m); CUP.steam.push(m); } }
    cup.traverse(o => { o.castShadow = false; }); cup.position.set(CUP.x, -0.2, CUP.z); cup.scale.setScalar(CUP.B); scene.add(cup); CUP.grp = cup; }
  function cupVisit(list) { return; /* (builder 11, owner's note) the cup is not carried: ring stains are simply there when a page is first seen */ if (!BENCHV || !list) return; const near = (p, o) => (!p || Math.hypot(o.x - CUP.x, o.z - CUP.z) < Math.hypot(p.x - CUP.x, p.z - CUP.z) ? o : p), q = list.filter(o => o.kind === 'ring' && o.r >= 1.5 && o.r <= 2.4).reduce(near, null) || list.filter(o => o.kind === 'ring').reduce(near, null); if (!q) return;   /* the ring nearest the cup's own place, so the cup is not carried across the molecule */ const now = performance.now(); q.born = now + 950; CUP.visit = { t0: now, to: { x: q.x, z: q.z }, k: q.r / 1.85 }; }
  function cupFrameOld(now) { if (!BENCHV) return; if (!CUP.grp) cupMakeOld(); const G = CUP.grp, v = CUP.visit; G.visible = st.mode !== 'shop'; CUP.steam.forEach((m, i) => { const u = ((now / 2600) + i / CUP.steam.length) % 1; m.position.set(0.5 * Math.sin(now / 900 + i * 2.1) * (0.3 + u), 3.2 + u * 3.4, -u * 2.2); m.scale.set(0.7 + u * 0.9, 0.7 + u * 0.7, 1); m.material.opacity = (v ? 0 : 0.8) * Math.sin(Math.PI * u) * (0.6 + 0.4 * Math.sin(now / 500 + i)); }); dirty = true; G.children.forEach(o => { if (o.userData.saucer) o.visible = !v; }); if (!v) { G.position.set(CUP.x, -0.2, CUP.z); G.scale.setScalar(CUP.B); return; } const a = now - v.t0, sm = u => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }; dirty = true;
    const go = a < 1250 ? sm(a / 800) : 1 - sm((a - 1250) / 800), down = a < 1250 ? sm((a - 800) / 150) : 1 - sm((a - 1250) / 150), hop = Math.sin(Math.PI * Math.min(1, go)) ; G.position.set(CUP.x + (v.to.x - CUP.x) * go, -0.2 + 7 * hop * (1 - down) + (go >= 1 ? 0.2 * (1 - down) : 0), CUP.z + (v.to.z - CUP.z) * go); G.scale.setScalar(CUP.B * (1 + (Math.max(0.5, v.k / CUP.B) - 1) * go)); if (a > 2050) CUP.visit = null; }
  function bottleFrame(now, dt) {
    if (!BENCHV) return; const playing = st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse';
    BT.map.forEach((b, id) => { const G = b.grp; G.visible = playing; if (!playing) return; const age = (now - b.born) / 260, grow = Math.max(0, Math.min(1, age)), hov = st.hover === b.slot && b.isOn; let lift = 0, tip = 0, k = b.sc * (hov ? 1.07 : 1) * (1 - Math.pow(1 - grow, 3)), carry = 0, go = 0;
      if (b.gone) { const u = Math.min(1, (now - b.gone) / 320); k *= 1 - u * u; if (u >= 1) { G.visible = false; } }
      if (b.act) { const u = (now - b.act.t0) / b.act.dur; if (u >= 1) b.act = null; else { const e = Math.sin(Math.PI * Math.min(1, u)); if (b.act.kind === 'pick') { lift = 1.5 * e; tip = 0.3 * e; } else if (b.act.hit) { const a = now - b.act.t0, H = b.act.hit, sm = v => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); }, back = sm((a - H - 60) / 340); go = sm(a / (H * 0.42)) * (1 - back); { const L = b.act.L, f = Math.max(0, Math.min(0.999, (a - H * 0.46) / (H * 0.54 - 170))) * L.length, i0 = Math.floor(f), i1 = Math.min(L.length - 1, i0 + 1), w = sm((f - i0 - 0.72) / 0.28); b.act.lx = L[i0].x + (L[i1].x - L[i0].x) * w; b.act.lz = L[i0].z + (L[i1].z - L[i0].z) * w; } lift = 3.4 * Math.min(1, sm(a / (H * 0.25))) * (1 - back * back); tip = 1.75 * sm((a - H * 0.26) / (H * 0.2)) * (1 - sm((a - H - 20) / 160)); dirty = true; }
          else { const up = Math.min(1, u / 0.22), dn = Math.max(0, (u - 0.78) / 0.22), h = up * (1 - dn), hs = h * h * (3 - 2 * h); lift = 3.4 * hs; tip = 1.75 * hs; carry = 4.6 * hs; } } }
      G.position.x += (b.x - G.position.x) * Math.min(1, dt * 12); G.position.z += (b.z - G.position.z) * Math.min(1, dt * 12); G.scale.setScalar(Math.max(0.001, k));
      if (REAG === 'cards') { b.mesh.position.y = 0.05 + (hov ? 0.5 : 0) + lift * 0.4; }
      else if (REAG === 'both') { const A = b.act && b.act.hit ? b.act : null; b.lean.position.set(b.bx + (A ? (A.lx - b.bx) * go : 0), lift, b.bz + (A ? (A.lz - b.bz) * go : 0)); b.mesh.rotation.z = tip; b.mesh.position.x = -tip * 0.6; b.bsh.material.opacity = 1 - Math.min(1, lift / 1.5); }
      else { b.lean.position.set(b.bx - carry, lift, 0); b.mesh.rotation.z = tip; b.mesh.position.x = -tip * 1.0; b.string.visible = !b.act; } });
    if (BT.drops.length) { BT.drops = BT.drops.filter(d => { const u = (now - d.t0) / d.dur; if (u < 0) return true; if (u >= 1) { scene.remove(d.m); return false; } const e = u * u * (3 - 2 * u); d.m.visible = true; d.m.position.set(d.fx + (d.tx - d.fx) * e, d.fy + (d.ty - d.fy) * e + d.arc * 4 * u * (1 - u), d.fz + (d.tz - d.fz) * e); const r = d.r * (1 - 0.35 * u); d.m.scale.set(r, r * 1.25, r); return true; }); }
    if (BT.flyers.length) { BT.flyers = BT.flyers.filter(f => { const u = (now - f.t0) / f.dur; if (u < 0) { f.m.visible = false; return true; } if (u >= 1) { scene.remove(f.m); dirty = true; return false; } const e = f.card ? u * u * (3 - 2 * u) : 1 - Math.pow(1 - u, 3); f.m.visible = true; f.m.position.set(f.from.x + (f.to.x - f.from.x) * e, f.card ? 0.14 + 0.5 * Math.sin(Math.PI * u) : 0.3 + 5 * Math.sin(Math.PI * u), f.from.z + (f.to.z - f.from.z) * e); f.m.scale.setScalar(f.s0 + (f.s1 - f.s0) * e); if (f.card) f.m.material.opacity = u > 0.8 ? 1 - (u - 0.8) / 0.2 * 0.6 : 1; return true; }); }
    if (BT.lights.length) { BT.lights = BT.lights.filter(f => { const u = (now - f.t0) / f.dur; if (u >= 1) { scene.remove(f.m); return false; } const e = 1 - Math.pow(1 - u, 3), s = (3 + 6.5 * e) * (center ? Math.max(1, center.group.scale.x / 2.4) : 1); f.m.scale.set(s, 1, s); f.m.material.opacity = 0.85 * (1 - u) * (1 - u); return true; }); }
  }
  // (builder 11) the running yield has its own place left of the track: this is the widest it may be drawn (ink pixels), so it never reaches the track
  const madeMax = () => px({ x: TRK.x0 - 1.3, z: TRK.z })[0] - px(MADE)[0];
  // the yield a round must reach as well as its task (the long runs): 0 when the round has no such line
  const needNow = () => { try { return run && g && g.specDef && P.needYield ? Math.round(P.needYield(run)) || 0 : 0; } catch (e) { return 0; } };
  // where a yield stands on the track (0..1): with a needed line, the line and the three gold marks stand in order of their numbers, evenly spaced from 0.4
  const trackPos = (v, need, quota, marks) => { if (!(need > 0)) { const n = marks.length, fr = k => (k === 0 ? 0.5 : 0.5 + 0.5 * k / n), vals = [quota].concat(marks); if (v < quota) return 0.5 * v / Math.max(1, quota); for (let k = 0; k + 1 < vals.length; k++) if (v < vals[k + 1]) return fr(k) + (fr(k + 1) - fr(k)) * (v - vals[k]) / (vals[k + 1] - vals[k]); return fr(vals.length - 1); } const A = [need].concat(marks.filter(m => Math.abs(m - need) > 0.02 * need)).sort((a, b) => a - b), p = j => 0.4 + 0.6 * j / Math.max(1, A.length - 1); if (v <= A[0]) return 0.4 * Math.max(0, v) / A[0]; for (let j = 0; j + 1 < A.length; j++) if (v < A[j + 1]) return p(j) + (p(j + 1) - p(j)) * (v - A[j]) / (A[j + 1] - A[j]); return 1; };
  const FEEL = AA.rxFeel ? AA.rxFeel.attach({ madeMax, pourMs: REAG === 'both' && BENCHV ? 720 : 0, pour: bottlePour, lit: siteLight, reag: REAG, T, P, st, g: () => g, center: () => center, cam, CAM, LOOKAT, px, U, layout: (m, f, s) => (morph && morph.m === m && morph.stage2 ? layoutSafe(m, a => { const c = morph.cur.get(a), t = m.at.get(a), p = f(a); return c && t ? _ride.copy(p).sub(t).add(c) : p; }, s) : layoutSafe(m, f, s)), STEP, STEPD, MADE, colOf, fmt, C0, home: () => ({ x: C0.x, z: C0.z, s: st.sc }), HOME, over: { cv: overC, x: overX }, marker: (x, n) => marker(x, n), INK, GREEN, REDINK, PENCIL, dirty: () => { dirty = true; } }) : null, fe = () => !!FEEL && FEEL.owns();
  function size() {
    const w = app.clientWidth, h = app.clientHeight; if (!w || !h) return; ren.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h > 1.6 ? 34 : 34 * 1.6 / (w / h) * 0.86; cam.updateProjectionMatrix();
    overC.width = w; overC.height = h; titleC.width = w; titleC.height = h;
    veil.width = w; veil.height = h; const x = veil.getContext('2d'), gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, PAPERS[PAPERN].veil[0]); gr.addColorStop(1, PAPERS[PAPERN].veil[1]); x.fillStyle = gr; x.fillRect(0, 0, w, h); noise(x, w, h, w * h / 30, 0.05, '80,60,30');
  }
  function frame(now) {
    requestAnimationFrame(frame);
    try { manFrame(now); } catch (e) { /* the manual is not ready on the first frames */ }
    const raw = now - last, dt = Math.min(0.05, raw / 1000), ended = []; last = now;
    if (PLAIN) { st.shake = Math.min(st.shake, 0.55); st.flash = 0; }
    // a held moment: while it lasts, the molecule and anything flying off it stand still
    if (now < st.hold) { if (morph) morph.t0 += raw; st.flyers.forEach(f => { if (f.t0) f.t0 += raw; }); }
    // the recoil of the molecule from a strike: a spring that pulls it back to where it stands
    { const k = 220, c = 14; st.kvx += (-k * st.kx - c * st.kvx) * dt; st.kvz += (-k * st.kz - c * st.kvz) * dt; st.kx += st.kvx * dt; st.kz += st.kvz * dt; st.sq = Math.max(0, st.sq - dt * 4.5); }
    tweens = tweens.filter(tw => {
      tw.t += dt; const k = Math.min(1, tw.t / tw.dur), e = 1 - Math.pow(1 - k, 3), grow = tw.sc > tw.fs * 1.5, es = grow ? 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2) : e;
      tw.m.group.position.set(tw.fx + (tw.to.x - tw.fx) * e, Math.sin(k * Math.PI) * 1.4 * (tw.dur > 0.2 ? 1 : 0), tw.fz + (tw.to.z - tw.fz) * e); tw.m.group.scale.setScalar(Math.max(0.001, tw.fs + (tw.sc - tw.fs) * es));
      if (k >= 1) { if (tw.done) ended.push(tw.done); return false; } return true;
    });
    ended.forEach(f => f());
    if (morph) { const el = now - morph.t0, ease = k => 1 - Math.pow(1 - k, 3), back = k => 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2), kOf = (a, d) => Math.max(0, Math.min(1, (el - morph.start.get(a)) / d));
      const FOLD_MS = morph.ms || (st.firing ? Math.max(150, 330 * Math.pow(0.86, st.chainN || 0)) : 460), slowDone = morph.slow && !morph.scrub && el - morph.s0 >= FOLD_MS;
      if (morph.slow ? slowDone : el > morph.end) { const mo1 = morph; if (morph.slow && morph.fk && fe()) FEEL.hit(morph.mid ? Object.assign({}, morph, { from: morph.fromHit || morph.from }) : morph, now); else if (morph.slow) { st.pop = 1; st.sq = 1; st.hold = now + 90; st.shake = Math.max(st.shake, 0.55); sfx.bond(); sfx.good(); } else { st.pop = Math.max(st.pop, 0.4); st.sq = Math.max(st.sq, 0.35); } if (mo1.mid) { layoutSafe(mo1.m, a => mo1.mid.get(a) || mo1.m.at.get(a), null); morph = stageTwo(mo1, mo1.slow ? 110 : 40); } else { layout(morph.m, a => morph.m.at.get(a), null); morph = null; } }
      else if (morph.slow) {
        let K = Math.max(0, Math.min(1, (el - morph.s0) / FOLD_MS)); if (morph.scrub) { K = Math.max(morph.kHeld || 0, Math.min(0.9, morph.kDrag || 0)); morph.kHeld = K; } morph.K = K;
        // slow to start, then quick: the two ends are drawn together as if they pulled on each other
        const k = morph.fk && fe() ? FEEL.k(K, morph) : K < 0.3 ? 0.12 * Math.pow(K / 0.3, 2) : 0.12 + 0.88 * (1 - Math.pow(1 - (K - 0.3) / 0.7, 3));
        morph.m.balls.forEach((b, a) => { const fr = morph.from.get(a), to = (morph.mid && morph.mid.get(a)) || morph.m.at.get(a), c = morph.cur.get(a); if (fr) c.copy(fr).lerp(to, k); else c.copy(to); });
        if (morph.slide) slideEval(morph, k);
        if (morph.bend) bendEval(morph.bend, Math.max(0, k), morph);
        for (let it = 0; it < 10; it++) morph.m.sticks.forEach(q => { const fa = morph.from.get(q.a), fb = morph.from.get(q.b); if (!fa || !fb) return; const ca = morph.cur.get(q.a), cb = morph.cur.get(q.b), rest = fa.distanceTo(fb) * (1 - k) + morph.m.at.get(q.a).distanceTo(morph.m.at.get(q.b)) * k; _u.copy(cb).sub(ca); const len = _u.length() || 1e-4, df = (len - rest) / len * 0.5; ca.addScaledVector(_u, df); cb.addScaledVector(_u, -df); });
        if (morph.act && fe() && FEEL.pose) FEEL.pose(morph, K);
        if (morph.m.fl) untangle(morph, k);
        layoutSafe(morph.m, a => morph.cur.get(a), a => (morph.from.has(a) ? 1 : Math.max(0, k)));
      }
      else if (morph.bend) { const s0 = morph.s0 < 1e8 ? morph.s0 : 0, kb = ease(Math.max(0, Math.min(1, (el - s0) / Math.max(200, morph.end - s0 - 60)))); morph.m.balls.forEach((b, a) => { const fr = morph.from.get(a); if (fr) morph.cur.get(a).copy(fr).lerp(morph.m.at.get(a), kb); }); bendEval(morph.bend, kb, morph); if (morph.m.fl) untangle(morph, kb);
        layout(morph.m, a => (morph.from.has(a) ? morph.cur.get(a) : morph.m.at.get(a)), a => (morph.from.has(a) ? 1 : kb)); }
      else if (morph.slide) { const s0 = morph.s0 < 1e8 ? morph.s0 : 0, ks = ease(Math.max(0, Math.min(1, (el - s0) / Math.max(260, morph.end - s0 - 60)))); morph.m.balls.forEach((b, a) => { const fr = morph.from.get(a); if (fr) morph.cur.get(a).copy(fr).lerp(morph.m.at.get(a), ks); }); slideEval(morph, ks); if (morph.m.fl) untangle(morph, ks);
        layout(morph.m, a => (morph.from.has(a) ? morph.cur.get(a) : morph.m.at.get(a)), a => (morph.from.has(a) ? 1 : ks)); }
      else { let ksum = 0, kn = 0; morph.m.balls.forEach((b, a) => { const fr = morph.from.get(a), to = (morph.mid && morph.mid.get(a)) || morph.m.at.get(a), c = morph.cur.get(a); if (!c) return; if (fr) { const kq = Math.max(0, Math.min(1.12, morph.feelEase && fe() ? FEEL.ease(kOf(a, 240)) : ease(kOf(a, 240)))); c.copy(fr).lerp(to, kq); ksum += kq; kn++; } else c.copy(to); }); if (morph.m.fl) untangle(morph, kn ? ksum / kn : 1);
        layoutSafe(morph.m, a => morph.cur.get(a) || morph.m.at.get(a), a => { const d = el - morph.start.get(a), bump = morph.made.has(a) && d >= 0 ? 0.08 * Math.max(0, 1 - d / 420) : 0; return morph.from.has(a) ? 1 + bump : kOf(a, 300) <= 0 ? 0 : back(kOf(a, 300)) + bump; }); }
      dirty = true; }
    if (st.flyers.length) { st.flyers = st.flyers.filter(f => {
      if (!f.to) f.to = byTarget(f.kind, f.at); if (!f.t0) f.t0 = now; const age = now - f.t0; if (age < 0) return true;
      const k = Math.min(1, age / f.dur), e = k * k * (3 - 2 * k), d = f.from.distanceTo(f.to);
      f.grp.position.set(f.from.x + (f.to.x - f.from.x) * e, f.from.y + (f.to.y - f.from.y) * e + Math.sin(k * Math.PI) * (0.9 + 0.04 * d), f.from.z + (f.to.z - f.from.z) * e);
      if (SHAPE === 'a' && f.to.z < -22) { /* (builder 12) what leaves goes up and out over the top edge of the right page, then along the bench to its jar: never across the left page */ const a = 1 - e, cx1 = Math.max(1.5, Math.min(30.5, f.from.x)), cx2 = Math.max(f.to.x, Math.min(cx1, f.to.x + 0.6 * (cx1 - f.to.x))); f.grp.position.x = a * a * a * f.from.x + 3 * a * a * e * cx1 + 3 * a * e * e * cx2 + e * e * e * f.to.x; f.grp.position.z = a * a * a * f.from.z + 3 * a * a * e * -25 + 3 * a * e * e * -27 + e * e * e * f.to.z; }
      f.grp.rotation.set(0, f.spin * k, 0); f.grp.scale.setScalar(st.sc * (k > 0.6 ? 1 - (k - 0.6) / 0.4 * 0.7 : 1));
      if (k < 1) return true;
      scene.remove(f.grp); if (!f.real) burst3(f.to.x, 0.2, f.to.z + 0.6, 8, f.kind === 'water' ? '#3a6fd0' : f.kind === 'h2' ? '#d6453a' : '#5a564e');
      if (f.keep) { st.by[f.keep] = Math.min(g ? g.by[f.keep] || 0 : 9, (st.by[f.keep] || 0) + 1); st.byBump[f.keep] = 1; }
      st.by.gauge = (st.by.gauge + 1) % P.BY.tally; st.byBump.gauge = 1; dirty = true; return false; }); dirty = true; }
    JARK.concat(['gauge']).forEach(q => { if (st.byBump[q] > 0) { st.byBump[q] = Math.max(0, st.byBump[q] - dt * 3.5); dirty = true; } });
    { const on = P.stageOf(meta) >= 2 && (BENCHV ? !!run && st.mode !== 'shop' && st.mode !== 'hom' : !!g && (st.mode === 'play' || st.mode === 'move' || st.mode === 'done' || st.mode === 'fuse')), tq = now / 1000;
      { const nS = BENCHV === 'a' ? JARK.length : JARK.filter(q => jarSeen(q) && !(run && run.hom === q)).length; if (BENCHV === 'a' && nS !== jarShelfN) { if (jarShelfB) scene.remove(jarShelfB); jarShelfB = nS ? jarShelfMake(nS) : null; jarShelfN = nS; } if (jarShelfB) jarShelfB.visible = on; }
      JARK.forEach((k, ji) => { const J = jars[k], out = !!(run && run.hom === k), jp = on ? (out ? (BENCHV === 'a' && g && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse' || st.mode === 'done') ? Object.assign({ held: 1 }, jarPos(k)) /* (builder 20) its own jar stays in its place on the shelf, empty, while it is out */ : null) : jarPos(k)) : null; if (jp && meta.hatched[k] && !out && J.j.userData.form) { const sg = homStageNow(k); if (sg && J.sg !== sg) { J.sg = sg; try { J.j.userData.form(sg); } catch (e) { /* the jar's own form stays */ } } } J.grp.visible = !!jp; if (!jp) return; if (meta.hatched[k]) jarLife(k, J, tq, !!st.firing); J.grp.position.set(jp.x, jp.y || 0, jp.z); const f = Math.min(1, jarOf(k) / JFULL(k)), tg = jp.held ? 'h' + Math.min(1, 0.1 + (st.by[k] || 0) / 12).toFixed(2) : meta.hatched[k] ? 'r' : f.toFixed(3); if (J.last !== tg) { J.last = tg; if (jp.held) J.set(+tg.slice(1), 3); else J.set(meta.hatched[k] ? (BENCHV ? 0.3 : 1) : f, meta.hatched[k] ? 2 : BENCHV === 'a' ? 3 : undefined); /* (builder 14) a hatched jar keeps a third of its substance, so the creature is seen through clear glass */ }
        const bump = st.byBump[k] || 0, hb = st.hatched === k && st.hatchT ? Math.max(0, 1 - (now - st.hatchT) / 600) : 0, s0 = jp.s * (1 + 0.1 * bump * Math.cos(bump * 9)); { if (J.born == null) J.born = now + ji * 90; const a0 = (now - J.born) / 1000; let dy = 0, qy = 1, qx = 1; if (a0 < 0) J.grp.visible = false; else if (a0 < 0.9) { const u = Math.min(1, a0 / 0.3); dy = (1 - u * u) * 9; if (a0 >= 0.3) { const w = Math.exp(-(a0 - 0.3) * 7) * Math.cos((a0 - 0.3) * 26); qy = 1 - 0.22 * w; qx = 1 + 0.12 * w; } dirty = true; } J.grp.position.y = (jp.y || 0) + dy; J.grp.scale.set(s0 * qx, s0 * qy * (1 + 0.16 * hb * Math.cos(hb * 10)), s0 * qx); } J.grp.rotation.z = 0.02 * Math.sin(tq * 1.2 + ji * 2); if (hb) dirty = true; }); }


    actFrame(now);
    if (homObj) { const on = !!g && !!g.hom && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse' || (BENCHV && st.mode === 'done' && !!st.homAct)), G = homObj.grp; G.visible = on;
      if (on) { const tq = now / 1000, A = st.homAct, age = A ? now - A.t : 1e9, floaty = homObj.id === 'h2', ease = u => u * u * (3 - 2 * u); let hx = HOMP.x, hz = HOMP.z, y = floaty ? 0.3 + 0.22 * Math.sin(tq * 1.7) : 0, sy = floaty ? 1 : 1 + 0.03 * Math.sin(tq * 2.3), rz = floaty ? 0.09 * Math.sin(tq * 1.1) : 0.02 * Math.sin(tq * 1.5);
        const JJ = A && A.j ? homJump(A, now) : null; if (JJ) { hx = JJ.hx; hz = JJ.hz; y = JJ.y; sy = JJ.sy; rz = JJ.rz; dirty = true; } const AH = A ? (BENCHV ? ACT.H[A.id] || 270 : 270) : 0; if (JJ || (A && A.j)) { /* (builder 19) the jump has the figure */ } else if (A && age < AH + 200) { const k = ease(Math.min(1, age / 190)) * (1 - ease(Math.max(0, Math.min(1, (age - AH) / 200)))); if (BENCHV && age > 190 && age < AH) { const w = (age - 190) / 1000; if (A.id === 'h2') { y += 5 * Math.min(1, w * 1.4); sy *= 1 + 0.5 * Math.min(1, w * 2); } else if (A.id === 'wood') rz += 0.5 * Math.sin(w * 9); else if (A.id === 'salt' || A.id === 'ammonia') { hx += 0.5 * Math.sin(w * 45); y += 1.2; } else if (A.id === 'acid' || A.id === 'water') sy *= 1 - 0.3 * Math.abs(Math.sin(w * 11)); else if (A.id === 'brimstone') sy *= 1 + 0.35 * Math.abs(Math.sin(w * 16)); else if (A.id === 'seedling') sy *= 1 + 0.45 * Math.sin(Math.PI * Math.min(1, w * 2.5)); else if (A.id === 'slime') { sy *= 1 - 0.3 * Math.sin(Math.PI * Math.min(1, w * 2)); } else if (A.id === 'co2') rz += 0.12 * Math.sin(w * 70); } hx += (A.to.x - HOMP.x) * k; hz += (A.to.z - HOMP.z) * k; y += Math.sin(k * Math.PI) * (floaty ? 1.2 : 0.5); if (homObj.id === 'water') { sy *= 1 - 0.18 * Math.abs(Math.sin(age / 38)); if (!A.pd || now - A.pd > 36) { A.pd = now; st.puddles.push({ x: hx + 0.5 * Math.sin(age / 20), z: hz + 1.1, r: 13 + 9 * Math.abs(Math.sin(age / 31)), t: now }); } } else if (floaty) rz += 0.25 * Math.sin(age / 60); else rz += 0.12 * Math.sin(age / 45); dirty = true; } else if (A) st.homAct = null;
        if (st.lit) y += 0.1 + 0.05 * Math.sin(tq * 3); if (st.homWait) y += 0.12 + (st.homHover ? 0.3 : 0);
        { const HS = BENCHV === 'a' ? homObj.s || BNZ.hom.s : 1.9; if (HEVO.pos) { hx = HEVO.pos.x; hz = HEVO.pos.z; y += HEVO.pos.y; sy *= HEVO.pos.sy || 1; } const kk = JJ ? JJ.k : 1, kx = JJ ? JJ.sx : HEVO.pos ? HEVO.pos.sx || 1 : 1; G.position.set(hx, y, hz); G.rotation.z = rz; G.scale.set(HS * kk * kx, HS * sy * kk, HS * kk); if (JJ && G.children[0]) G.children[0].rotation.y = JJ.ry; }
        { const fg = G.children[0], Hh = P.HOMS[homObj.id], fedF = g && g.hom ? Math.min(1, g.hom.fed / Math.max(1, Hh.need)) : 0, rdy = !!st.lit || !!st.homWait; if (fg && AA.rxKit.pose) { if (JJ) AA.rxKit.poseToward(fg, T, new T.Vector3(JJ.tx, 0, JJ.tz), JJ.reach, 0.3 * Math.sin(age / 90), tq); else if (A && age < AH + 200) AA.rxKit.poseToward(fg, T, new T.Vector3(A.to.x, 0, A.to.z), Math.min(1, age / 190), 0.3 * Math.sin(age / 90), tq); else AA.rxKit.pose(fg, { lean: [0, -0.35 * fedF * (rdy ? 0.4 : 1)], reach: rdy ? 0.45 + 0.1 * Math.sin(tq * 2.2) : 0, squash: rdy ? -0.35 : 0.25 * fedF, t: tq }); } } } }
    a20Spent(now); try { a20Earned(now); } catch (e) { A20.err = String(e && e.stack); }
    if (st.mode === 'hom' && homShelf) { const hs = homShelf, K = hs.K, pk = st.homPick, bad = st.homBad && now - st.homBad.t < 450 ? st.homBad : null;
      hs.slots.forEach((q, i) => { const hov = st.hover === i && !pk; let y = hov && q.ready ? 0.45 : 0, rz = q.ready ? 0.025 * Math.sin(now / 900 + i) : 0, vis = true;
        if (bad && bad.i === i) { rz += 0.06 * Math.sin((now - bad.t) / 28) * (1 - (now - bad.t) / 450); dirty = true; }
        if (pk && pk.i === i) { const a = (now - pk.t0) / 1000; y = Math.min(a * 5, 1) * 2.2 + 0.2; rz = -0.3 * Math.min(1, a * 3); vis = a < 0.55; if (!homWalk) { const hold = new T.Group(); hold.add(homFig(q.k)); hold.rotation.x = -0.8; const c0 = jarSlotAt(q); hold.position.set(c0.x, 0, c0.z); hold.scale.setScalar(K * 0.6); scene.add(hold); homWalk = { grp: hold, from: c0, k: q.k }; } }
        q.g.visible = vis; q.g.position.y = y; q.g.rotation.z = rz; });
      if (hs.note) hs.note.scale.setScalar(st.hover === 99 ? 1.7 : 1.5);
      if (pk && homWalk) { const a = (now - pk.t0) / 1000, u = Math.max(0, Math.min(1, (a - 0.3) / 0.8)), e = u * u * (3 - 2 * u), f = homWalk.from, G = homWalk.grp; G.visible = a > 0.3; G.position.set(f.x + (HOMP.x - f.x) * e, Math.sin(u * Math.PI) * 1.6, f.z + (HOMP.z - f.z) * e); G.scale.setScalar(K * 0.6 + (1.45 - K * 0.6) * e); const fg = G.children[0]; if (AA.rxKit.pose) AA.rxKit.pose(fg, { squash: Math.sin(a * 14) * 0.25 * (1 - u), lean: [(HOMP.x - f.x) > 0 ? 0.3 : -0.3, 0], reach: 0, t: a }); dirty = true; if (a > 1.3) homFinish(); }
      dirty = true; }
    homObjs.forEach(k => { const age = (now - k.born) / 1000, u = Math.max(0, Math.min(1, age / 0.45)), dropY = u < 1 ? (1 - u) * (1 - u) * 9 : 0, hov = st.hover === k.slot; k.grp.visible = age >= 0; k.grp.position.y = dropY + (k.id === 'h2' ? 0.3 + 0.2 * Math.sin(now / 600) : 0) + (hov ? 0.6 : 0); k.grp.rotation.z = k.id === 'h2' ? 0.08 * Math.sin(now / 900) : 0.02 * Math.sin(now / 700 + k.slot); });
    prods.forEach((m, i) => { if (!m || tweens.some(tw => tw.m === m)) return; const hov = st.hover === i, want = hov ? 0.7 : 0, sc = (SCS[i] || 0.8) * (hov ? SC_HOVER : 1), k = Math.min(1, dt * 14); m.group.position.y += (want - m.group.position.y) * k; const s0 = m.group.scale.x; if (Math.abs(s0 - sc) > 0.002) { m.group.scale.setScalar(s0 + (sc - s0) * k); dirty = true; } });
    if (st.mode === 'pick' || st.mode === 'shop' || st.mode === 'brief' || st.mode === 'terms' || st.mode === 'hom') dirty = true;
    if (st.mode === 'brief') { const ch = st.choose, el = ch ? now - ch.t0 : 0; briefMols.forEach((m, i) => { if (!tweens.some(tw => tw.m === m)) { const u = Math.max(0, Math.min(1, (el - 750) / 420)), k = BENCHV ? (ch ? (ch.i === i ? 1.05 : Math.max(0.001, 1 - u * u * (3 - 2 * u))) : st.hover === i ? 1.05 : 1) : st.hover === i ? 1.15 : 1; m.group.scale.setScalar(m.sc * k); m.group.rotation.z = 0; } });
      briefCoins.forEach(c => { const a = (now - c.t0) / 420; c.m.visible = a > 0 && !(ch && ch.i !== c.i && el > 750); if (a > 0 && a < 1) c.m.position.y = 0.12 + 5 * (1 - a) * (1 - a); else c.m.position.y = 0.12 + (st.hover === c.i ? 0.25 + 0.2 * Math.sin(now / 160 + c.n) : 0); });
      if (ch && el >= CHOOSE_MS) briefDone(); }
    if (st.gains.length) { st.gains = st.gains.filter(q => { if (now < q.t + q.dur) return true; st.want = Math.max(st.want, q.to); st.madeBump = 1; st.tickT = now; return false; }); if (!st.gains.length && g && st.mode !== 'done' && !st.pending) st.want = P.made(g); dirty = true; }
    const target = st.mode === 'done' && g ? g.total : st.want;
    if (st.shown !== target) { const d = target - st.shown; st.shown = Math.abs(d) < 2 ? target : st.shown + d * Math.min(1, dt * (now - (st.tickT || 0) < 260 ? 50 : 16)); dirty = true; }
    // the number to beat, and each mark above it, is passed at the frame the total shown crosses it
    if (g && st.mode !== 'pick' && st.mode !== 'brief' && st.mode !== 'shop' && st.mode !== 'terms') { const nd = needNow(); if (nd && !st.needT && st.shown >= nd) { st.needT = now; try { sfx.stamp(); } catch (e) { /* no sound */ } dirty = true; } }
    if (g && st.quota > 0 && st.mode !== 'pick' && st.mode !== 'brief' && st.mode !== 'shop' && st.mode !== 'terms') [st.quota].concat(P.runMarks(st.quota)).forEach((m, k) => { if (!st.passT[k] && st.shown >= m && !fe()) { st.passT[k] = now; if (fe()) { /* feel.js */ } else if (k < 4 && AA.sfx && AA.sfx.flag) AA.sfx.flag(k + 1); else if (k === 0) sfx.quota(); else sfx.lock(8 + k); dirty = true; } });
    // the spec is met: the mark fills and settles (drawHurdle reads specMetT), with a soft bell and a strike
    if (g && g.spec && st.mode !== 'pick' && st.mode !== 'brief' && st.mode !== 'shop') { const ps = g.spec.parts && g.spec.parts.length ? g.spec.parts : [g.spec]; ps.forEach((p, i) => { if (p.met && !st.specWas[i]) { st.specMetT[i] = now; if (AA.sfx) { if (AA.sfx.flagSoft) AA.sfx.flagSoft(0); if (AA.sfx.strike) AA.sfx.strike(1); } dirty = true; } st.specWas[i] = !!p.met; }); }
    updateFlags();
    pickObjs.forEach(k => { const age = (now - (k.born || 0)) / 1000, u = Math.max(0, Math.min(1, age / 0.45)), drop = u < 1 ? (1 - u) * (1 - u) * 9 : 0, sq = u >= 1 && age < 0.75 ? Math.sin((age - 0.45) / 0.3 * Math.PI) * 0.18 : 0; k.grp.visible = age >= 0; k.grp.rotation.y += dt * 0.6; k.grp.position.y = drop + (st.hover === k.slot ? 0.8 + 0.15 * Math.sin(now / 140) : 0); k.grp.scale.set(1.7 * (1 + sq * 0.6), 1.7 * (1 - sq), 1.7 * (1 + sq * 0.6)); });
    // equipment is moved further down, once the heat of the round is known
    if (st.multBump > 0) { st.multBump = Math.max(0, st.multBump - dt * 3.5); dirty = true; }
    if (st.floats.length || st.blots.length || st.pings.length || st.slashes.length || st.strokes.length || st.call || st.cstep) dirty = true;
    st.shake *= Math.pow(0.002, dt); const sh = st.shake > 0.02 ? st.shake : 0;
    // the view pushes in on the molecule for a moment when it reacts
    { const want = 0; st.zoom += (want * 0.012 - st.zoom) * Math.min(1, dt * (want ? 9 : 5)); const fk = Math.min(1, dt * 8); st.fx += (st.focus.x - st.fx) * fk; st.fz += (st.focus.z - st.fz) * fk; }
    const zk = st.zoom, hx = Math.max(-0.22, Math.min(0.22, (Math.random() - 0.5) * sh * 0.6)), hz = Math.max(-0.3, Math.min(0.3, (Math.random() - 0.5) * sh * 0.6));
    cam.position.set(CAM.x + (st.fx - CAM.x) * zk + hx, CAM.y + (16 - CAM.y) * zk, CAM.z + (st.fz + 12 - CAM.z) * zk + hz);
    { const want = BENCHV && st.mode === 'pick' && shopB && SHOPV !== 'b' ? 1 : 0; st.shopK = (st.shopK || 0) + (want - (st.shopK || 0)) * Math.min(1, dt * 3.2); if (Math.abs(want - st.shopK) < 0.002) st.shopK = want; else dirty = true; }
    { const want = BENCHV && title.on && (!title.out || now - title.out < 900) ? 1 : 0; st.titleK = st.titleK == null ? want : st.titleK + (want - st.titleK) * Math.min(1, dt * 2.6); if (Math.abs(want - st.titleK) < 0.002) st.titleK = want; else dirty = true; }
    const tk9 = st.titleK * st.titleK * (3 - 2 * st.titleK), sk = st.shopK * st.shopK * (3 - 2 * st.shopK), SHX = 26 * sk - (SHAPE === 'a' ? -9 : 30) * tk9, SHB = 0.1 * sk + 0.5 * tk9; cam.position.x += SHX + (CAM.x - LOOKAT.x) * SHB; cam.position.y += (CAM.y - LOOKAT.y) * SHB; cam.position.z += (CAM.z - LOOKAT.z) * SHB;
    cam.lookAt(LOOKAT.x + (st.fx - LOOKAT.x) * zk + SHX, 0.8 * zk, LOOKAT.z + (st.fz - LOOKAT.z) * zk);
    // the hotter the run, the warmer the page
    const playing = g && (st.mode === 'play' || st.mode === 'move'), heat = playing ? Math.min(1, Math.log2(Math.max(1, st.mult)) / 6) : 0;
    if (flashM) { const on = st.flash > 0 && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse'); if (st.flash > 0) st.flash = Math.max(0, st.flash - dt * 2.2); flashM.visible = on && st.flash > 0.01; if (flashM.visible) { const R = playRect(), c = st.flashC.split(',').map(Number); flashM.position.set((R[0] + R[2]) / 2, 0.03, (R[1] + R[3]) / 2); flashM.scale.set(R[2] - R[0] + 1.6, 1, R[3] - R[1] + 1.6); flashM.material.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255); flashM.material.opacity = st.flash * 0.22; } if (veil.style.backgroundColor) veil.style.backgroundColor = ''; }
    else if (st.flash > 0) { st.flash = Math.max(0, st.flash - dt * 2.2); veil.style.backgroundColor = 'rgba(' + st.flashC + ',' + (st.flash * 0.3).toFixed(3) + ')'; }
    else if (heat > 0.05 && LOOK === 'now') veil.style.backgroundColor = 'rgba(255,110,30,' + (heat * 0.3).toFixed(3) + ')';
    else if (veil.style.backgroundColor) veil.style.backgroundColor = '';
    // nothing on the page sits dead still: molecules rock, equipment trembles with the multiplier, a hot run throws bubbles
    const tt = now / 1000;
    if (BENCHV && st.mode === 'done') dirty = true;
    if (shopB) { if (st.mode === 'pick') shopFrame(now); else shopClear(); }
    leafFrame(now); lossFrame(now);
    if (BENCHV) { try { const glass = () => Array.from(app.querySelectorAll('canvas.veil')).filter(c => c !== veil && c !== titleC && c.width), wipe = () => glass().forEach(c => { const x = c.getContext('2d'); x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); x.restore(); }); if (st.mode === 'pick' || st.mode === 'brief' || st.mode === 'shop' || st.mode === 'terms' || st.mode === 'hom') { if (!st.overClean) { wipe(); st.overClean = true; } } else if (st.mode === 'done') { const el = now - (st.doneT || now); if (el > 900 && el < 2600) glass().forEach(c => { const x = c.getContext('2d'); x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'destination-out'; x.fillStyle = 'rgba(0,0,0,0.09)'; x.fillRect(0, 0, c.width, c.height); x.restore(); }); else if (el >= 2600 && !st.overClean) { wipe(); st.overClean = true; } } else st.overClean = false; } catch (e) { /* no overlay */ } }
    // the measure of a step (the owner: the molecule's shape must not leap): how far each atom that did not react is carried, as a share of the play area's width
    { const mo = morph && morph.m === center ? morph : null;
      if (mo !== SL.mo && !(mo && mo.cont)) { const snap = center ? snapW(center) : null; if (SL.open && snap) slClose(snap, now); if (mo && snap) SL.open = { before: snap, made: mo.made || new Set(), t: now, slow: !!mo.slow }; SL.idle = 0; }
      SL.mo = mo; if (!mo && center && (SL.open || SL.turnB) && ++SL.idle >= 2) { const snap = snapW(center); if (SL.open) slClose(snap, now); else { SL.open = { before: SL.turnB, made: new Set(), t: now, turn: true }; slClose(snap, now); } SL.turnB = null; } }
    if (BENCHV && st.mode === 'done' && st.pass && !st.pinned && now - (st.doneT || now) > RES_MS) { if (SHAPE === 'a') { recSnap(); const q = recSlot(run.round); PINH.x = q.x; PINH.z = q.z + 0.2; PINH.w = 4.3; PINH.d = 2.9; PINH.smax = 0.6; } st.pinned = true; st.pinT = now; st.pin0 = null; sfxN('pageTurn'); }
    if (center && !tweens.some(tw => tw.m === center)) { if (center.fl) flHome(center, false, dt, now); else { let lo = 1e9, hi = -1e9; center.balls.forEach(b => { const q = b.mesh.position.x; if (q < lo) lo = q; if (q > hi) hi = q; }); const w = hi - lo + 1.4; if (w * SC_MAIN > LANE.w * 1.02) SC_MAIN = Math.max(0.5, LANE.w / w); if (st.lx != null && lo < 1e8) C0.x = st.lx - (lo + hi) / 2 * center.group.scale.x; } st.pop = Math.max(0, st.pop - dt * 3.2); const sp = 1 + 0.28 * st.pop * Math.cos(st.pop * 9); if (!center.fl) { st.sc += (SC_MAIN - st.sc) * Math.min(1, dt * 13); keepIn(center, homeNow()); } { center.group.scale.setScalar(st.sc); } st.cx = st.cx == null || st.mode !== 'done' ? C0.x : st.cx + (C0.x - st.cx) * Math.min(1, dt * 7), st.cz = st.cz == null || st.mode !== 'done' ? C0.z : st.cz + (C0.z - st.cz) * Math.min(1, dt * 7), center.group.position.set(st.cx, 0.25, st.cz); center.group.rotation.z = 0;  }
    
    { const tc = chargeOf(); st.ch = (st.ch || 0) + (tc - (st.ch || 0)) * Math.min(1, dt * (tc < (st.ch || 0) ? 8 : 2.2)); if (Math.abs(tc - st.ch) > 0.003) dirty = true; }
    { const on = !!g && (st.mode === 'play' || st.mode === 'move' || st.mode === 'done' || st.mode === 'fuse'); flask.grp.visible = false; if (on) { const ratio = st.quota ? st.shown / st.quota : 0, ov = ratio >= 1 ? Math.log2(ratio) + 0.001 : 0; flask.set(Math.min(1, ratio), ov); const boil = Math.min(1, ov / 5), near = Math.max(0, Math.min(1, (ratio - 0.6) / 0.4)), tq = now / 1000; flask.grp.rotation.z = 0.03 * Math.sin(tq * 1.4) + (boil ? (Math.random() - 0.5) * 0.09 * boil : near * 0.03 * Math.sin(tq * 17)); flask.grp.position.y = boil ? Math.random() * 0.25 * boil : near * 0.06 * Math.abs(Math.sin(tq * 9)); flask.grp.scale.set(1.25 * (1 + 0.012 * Math.sin(tq * 2.1)), 1.25 * (1 - 0.012 * Math.sin(tq * 2.1)), 1.25); if (boil) dirty = true; } }
    kitObjs.forEach((k, i) => animKit(k, i, now, heat));
    if (st.madeBump > 0) { st.madeBump = Math.max(0, st.madeBump - dt * 6); dirty = true; }
    ['p', 'r', 'e'].forEach(q => { if (st.bump[q] > 0) { st.bump[q] = Math.max(0, st.bump[q] - dt * 4); dirty = true; } });
    if (heat > 0.2) dirty = true;
    if (FEEL) FEEL.frame(now, dt);
    drawTitle(now); if (BENCHV && (title.out || !title.on)) { const tx = titleC.getContext('2d'); tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalAlpha = 1; tx.clearRect(0, 0, titleC.width, titleC.height); }
    stepParts(dt);
    try { sigWatch(now); } catch (e) { /* none */ }
    cardFrame(now);
    try { kinFrame(now); } catch (e) { KINV.err = String(e && e.stack); }
    try { homEvo19(now); } catch (e) { HEVO.err = String(e && e.stack); }
    marginBusyE(now);
    if (dirty && now - lastInk > 24) { drawInk(now); dirty = false; lastInk = now; if (INKW.on) inkWatch(); }
    keepSeen(); fitWatch(); bottleFrame(now, dt); goldFrame(now, dt); cupFrame(now); try { lifeFrame(now, dt); } catch (e) { /* idle life never breaks a frame */ }
    ren.render(scene, cam);
  }
  root.addEventListener('resize', size);
  // (builder 16) THE MANUAL (ruling AX): a second book on the bench, a worn ledger, openable at any time (the title too). One category to a
  // spread, a drawn tab for each (order from P.REFERENCE_CATS, rows from P.reference(meta)). An entry is the OBJECT and beside it a PICTURE of
  // what it does; no words on a spread. A thing not owned is its pencil outline with the second picture left blank. A click on an entry shows
  // the object alone, large, a real 3D thing turned by dragging (it coasts, then comes home), with the full description in words beside it:
  // name, what it does, how it is got with the count; for a thing not owned only the name and how to get it. Drawn on its own canvas (a .veil,
  // width 0 when shut); its 3D things are drawn by a small renderer of its own, so nothing here touches the page's scene but the ledger itself.
  const MAN = { on: false, cat: 0, pick: null, rows: null, th: {}, cells: [], tabs: [], yaw: 0, pit: 0, vy: 0, vp: 0, drag: null, idle: 0, cv: null, x: null, r3: null, dirty: true, pos: { x: -41.6, z: -23.0 }, open: 0, objs: {} };
  const manPx = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * 1280 / r.width, y: (e.clientY - r.top) * 720 / r.height }; };
  function manBook() {
    if (REFB) return; const g = new T.Group(), tx = canvasTex(256, 320), x = tx.x; x.fillStyle = '#5a3a26'; x.fillRect(0, 0, 256, 320); for (let i = 0; i < 900; i++) { x.fillStyle = 'rgba(' + (hash('lg' + i) > 0.5 ? '255,220,170' : '20,10,0') + ',' + (0.03 + 0.05 * hash('la' + i)) + ')'; x.fillRect(hash('lx' + i) * 256, hash('ly' + i) * 320, 2 + 9 * hash('lw' + i), 1 + 3 * hash('lh' + i)); }
    x.strokeStyle = '#c9a25a'; x.lineWidth = 5; x.strokeRect(18, 18, 220, 284); x.lineWidth = 2; x.strokeRect(28, 28, 200, 264); x.fillStyle = '#3a2416'; x.fillRect(0, 0, 30, 320); x.fillStyle = '#c9a25a'; [60, 160, 260].forEach(y => x.fillRect(4, y, 22, 4));
    // the cover's emblem: a flask and an open eye over it, in worn gold
    x.strokeStyle = '#d8b46a'; x.lineWidth = 6; x.lineJoin = 'round'; x.beginPath(); x.moveTo(112, 96); x.lineTo(112, 140); x.lineTo(74, 214); x.quadraticCurveTo(70, 232, 90, 232); x.lineTo(176, 232); x.quadraticCurveTo(196, 232, 192, 214); x.lineTo(154, 140); x.lineTo(154, 96); x.moveTo(102, 96); x.lineTo(164, 96); x.stroke(); x.beginPath(); x.arc(133, 196, 9, 0, 6.3); x.stroke(); tx.t.needsUpdate = true;
    const cover = std({ map: tx.t, roughness: 0.85 }), side = std({ color: lin(0xe6dcc0), roughness: 0.9 }), dark = std({ color: lin(0x4a2e1e), roughness: 0.85 }), b = new T.Mesh(new T.BoxGeometry(7.6, 1.1, 9.6), [side, dark, cover, dark, side, side]); b.position.y = 0.6; b.castShadow = true; b.receiveShadow = true; g.add(b);
    const rb = new T.Mesh(new T.BoxGeometry(0.5, 0.05, 3.2), std({ color: lin(0xa3261c), roughness: 0.7 })); rb.position.set(1.6, 0.04, 5.6); g.add(rb);
    g.position.set(MAN.pos.x, 0, MAN.pos.z); g.rotation.y = 0.16; g.scale.setScalar(0.8); scene.add(g); REFB = { grp: g }; dirty = true;
  }
  function manHit(p) { if (!REFB) return false; const v = new T.Vector3(MAN.pos.x, 1.2, MAN.pos.z).project(cam), x = (v.x + 1) * 640, y = (1 - v.y) * 360; return Math.abs(p.x - x) < 52 && Math.abs(p.y - y) < 58; }
  function manCanvas() {
    if (MAN.cv) return; const c = document.createElement('canvas'); c.className = 'veil'; c.width = 0; c.height = 0; c.style.pointerEvents = 'none'; app.append(c); MAN.cv = c; MAN.x = c.getContext('2d');
    c.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); manDown(manPx(e)); }); c.addEventListener('pointermove', e => { manMove(manPx(e)); }); root.addEventListener('pointerup', () => { if (MAN.drag) { MAN.drag = null; MAN.idle = performance.now(); } });
    root.addEventListener('keydown', e => { if (MAN.on && e.key === 'Escape') { e.stopPropagation(); if (MAN.pick) { MAN.pick = null; MAN.dirty = true; } else manShut(); } }, true);
  }
  function manOpen() { manCanvas(); if (MAN.on) return; MAN.on = true; MAN.rows = P.reference(meta); MAN.th = {}; MAN.pick = null; MAN.dirty = true; MAN.open = performance.now(); MAN.cv.width = 1280; MAN.cv.height = 720; MAN.cv.style.pointerEvents = 'auto'; sfxN('pageTurn'); }
  function manShut() { if (!MAN.on) return; MAN.on = false; MAN.pick = null; MAN.cv.width = 0; MAN.cv.height = 0; MAN.cv.style.pointerEvents = 'none'; sfxN('pageTurn'); dirty = true; }
  function manDown(p) {
    if (MAN.pick) { if (Math.hypot(p.x - 330, p.y - 370) < 230) { MAN.drag = { x: p.x, y: p.y }; MAN.vy = 0; MAN.vp = 0; return; } MAN.pick = null; MAN.dirty = true; sfxN('click'); return; }
    for (const t of MAN.tabs) if (p.x >= t.x && p.x <= t.x + t.w && p.y >= t.y && p.y <= t.y + t.h) { if (MAN.cat !== t.i) { MAN.cat = t.i; MAN.dirty = true; sfxN('pageTurn'); } return; }
    for (const q of MAN.cells) if (p.x >= q.x && p.x <= q.x + q.w && p.y >= q.y && p.y <= q.y + q.h) { manPick(q.row.id, q.row.category); return; }
    if (p.x < 50 || p.x > 1230 || p.y < 30 || p.y > 700) manShut();
  }
  function manMove(p) { if (!MAN.drag) return; const dx = (p.x - MAN.drag.x) * 0.012, dy = (p.y - MAN.drag.y) * 0.009; MAN.yaw += dx; MAN.pit = Math.max(-1.1, Math.min(1.1, MAN.pit + dy)); MAN.vy = dx; MAN.vp = dy; MAN.drag = { x: p.x, y: p.y }; MAN.idle = performance.now(); }
  function manPick(id, cat) { const row = (MAN.rows || []).find(r => r.id === id && (!cat || r.category === cat)); if (!row) return false; MAN.pick = row; MAN.yaw = -0.5; MAN.pit = 0.12; MAN.vy = 0; MAN.vp = 0; MAN.idle = performance.now(); MAN.dirty = true; sfxN('click'); return true; }
  // ---- the 3D things ----
  function man3() { if (MAN.r3) return MAN.r3; const r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(400, 400, false); r.setClearColor(0x000000, 0); r.outputEncoding = ren.outputEncoding; const sc = new T.Scene(), cm = new T.PerspectiveCamera(28, 1, 0.1, 100); cm.position.set(0, 1.1, 10.5); cm.lookAt(0, 0, 0); sc.add(new T.HemisphereLight(0xffffff, 0x9a8a76, 1.0)); const d = new T.DirectionalLight(0xffffff, 0.85); d.position.set(3, 6, 6); sc.add(d); const hold = new T.Group(); sc.add(hold); return (MAN.r3 = { r, sc, cm, hold, id: null }); }
  function manEmblemTex(row) { const tx = canvasTex(256, 256), x = tx.x; x.fillStyle = '#efe6cf'; x.fillRect(0, 0, 256, 256); manEmblem(x, row, 128, 128, 92); tx.t.needsUpdate = true; return tx.t; }
  function manObj(row) {
    const key = row.category + ':' + row.id; if (MAN.objs[key]) return MAN.objs[key]; const g = new T.Group(), c = row.category; let ok = false;
    try { if (c === 'instrument') ok = !!AA.rxKit.build(row.id, T, g, new T.Color().setHSL(hash(row.id + 'hue'), 0.75, 0.5)); else if (c === 'homunculus') { g.add(homFig(row.id, row.stage || 0)); ok = true; } } catch (e) { ok = false; }
    if (!ok && c === 'reagent') { // its bottle: glass, the reagent's own colour inside, a cork
      const card = RX.CARDS[row.id] || {}, col = card.rgb ? bright(card.rgb) : [150, 150, 150], pts = [[0, 0], [1.0, 0], [1.08, 0.12], [1.08, 1.7], [0.95, 2.05], [0.42, 2.45], [0.4, 3.0], [0.5, 3.05], [0.5, 3.2], [0, 3.2]].map(q => new T.Vector2(q[0], q[1]));
      g.add(new T.Mesh(new T.LatheGeometry(pts, 28), new T.MeshStandardMaterial({ color: lin(0xdfeee8), roughness: 0.15, transparent: true, opacity: 0.42 }))); const lq = new T.Mesh(new T.CylinderGeometry(0.98, 0.98, 1.35, 28), std({ color: new T.Color(col[0] / 255, col[1] / 255, col[2] / 255).convertSRGBToLinear(), roughness: 0.3 })); lq.position.y = 0.75; g.add(lq); const ck = new T.Mesh(new T.CylinderGeometry(0.4, 0.34, 0.5, 16), std({ color: lin(0xb98a55), roughness: 0.9 })); ck.position.y = 3.3; g.add(ck);
      const lb = new T.Mesh(new T.CylinderGeometry(1.1, 1.1, 0.8, 28, 1, true, -0.9, 1.8), new T.MeshStandardMaterial({ map: manEmblemTex(row), roughness: 0.8 })); lb.position.y = 0.95; g.add(lb); ok = true; }
    if (!ok) { // a thing that is a rule or a mark: a thick token, its emblem on the face and a plain back
      const rim = std({ color: lin(c === 'sigil' ? 0x7a1d16 : c === 'sign' ? 0xd9b520 : 0x7b6a4d), roughness: 0.6 }), face = new T.MeshStandardMaterial({ map: manEmblemTex(row), roughness: 0.8 }), back = std({ color: lin(0xd8cdb0), roughness: 0.85 }), m = new T.Mesh(new T.CylinderGeometry(1.6, 1.6, 0.34, 40), [rim, face, back]); m.rotation.x = Math.PI / 2; m.rotation.y = Math.PI / 2; const h = new T.Group(); h.add(m); g.add(h); }
    const bx = new T.Box3().setFromObject(g), sz = bx.getSize(new T.Vector3()), ctr = bx.getCenter(new T.Vector3()), k = 3.5 / Math.max(sz.x, sz.y, sz.z, 0.01), hold = new T.Group(); g.position.copy(ctr).multiplyScalar(-k); g.scale.setScalar(k); hold.add(g); return (MAN.objs[key] = hold);
  }
  function manShot(row, yaw, pit) { const R = man3(); while (R.hold.children.length) R.hold.remove(R.hold.children[0]); const o = manObj(row); R.hold.add(o); R.hold.rotation.set(pit, yaw, 0); R.r.render(R.sc, R.cm); return R.r.domElement; }
  // a thing not owned: only its outline, in pencil
  function manPencil(src, S) { const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), o = Math.max(1.5, S / 110); [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, o], [-o, o], [o, -o]].forEach(q => x.drawImage(src, q[0], q[1], S, S)); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#77726a'; x.fillRect(0, 0, S, S); x.globalCompositeOperation = 'destination-out'; x.drawImage(src, 0, 0, S, S); x.globalCompositeOperation = 'source-over'; return c; }
  function manThumb(row) { const key = row.category + ':' + row.id; if (MAN.th[key]) return MAN.th[key]; const S = 150, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d'), c3 = row.category === 'instrument' || row.category === 'homunculus' || row.category === 'reagent';
    if (c3) x.drawImage(manShot(row, -0.45, 0.1), 0, 0, S, S); else manEmblem(x, row, S / 2, S / 2, S * 0.4);
    return (MAN.th[key] = row.owned ? c : manPencil(c, S)); }
  // ---- drawn emblems (flat things) and the small pictures of what a thing does ----
  const manInk = (x, col, lw) => { x.strokeStyle = col || INK; x.fillStyle = col || INK; x.lineWidth = lw || 3; x.lineCap = 'round'; x.lineJoin = 'round'; };
  // a small molecule from a row of atoms: 'C-C=C-O'; drawn as a zigzag, centred on (cx, cy); el in lower case is drawn faint
  function manMol(x, s, cx, cy, k) { const at = [], re = /([A-Za-z]+)([-=]?)/g; let m; while ((m = re.exec(s))) at.push([m[1], m[2]]); const st = 24 * (k || 1), n = at.length, x0 = cx - (n - 1) * st / 2; x.save(); if (k && k !== 1) { x.translate(cx, cy); x.scale(k, k); x.translate(-cx, -cy); } const X = i => cx - (n - 1) * 12 + i * 24, Y = i => cy + (i % 2 ? -7 : 7);
    at.forEach((a, i) => { if (i < n - 1) fbond(x, X(i), Y(i), X(i + 1), Y(i + 1), a[1] === '=' ? 2 : 1, a[0] === a[0].toUpperCase() && at[i + 1][0] === at[i + 1][0].toUpperCase()); }); at.forEach((a, i) => { const el = a[0].charAt(0).toUpperCase() + a[0].slice(1), on = a[0] === a[0].toUpperCase() || a[0] === 'Cl'; fball(x, X(i), Y(i), FBALL[el] ? el : 'C', on || a[0] === 'Cl'); }); x.restore(); return n * st; }
  function manRing(x, cx, cy, r, n, het) { const P2 = []; for (let i = 0; i < n; i++) P2.push([cx + r * Math.cos(-Math.PI / 2 + i * 2 * Math.PI / n), cy + r * Math.sin(-Math.PI / 2 + i * 2 * Math.PI / n)]); P2.forEach((p, i) => fbond(x, p[0], p[1], P2[(i + 1) % n][0], P2[(i + 1) % n][1], 1, true)); P2.forEach((p, i) => fball(x, p[0], p[1], i === 0 && het ? het : 'C', true)); }
  const manArrow = (x, x0, y, x1, col) => { manInk(x, col || INK, 3); x.beginPath(); x.moveTo(x0, y); x.lineTo(x1, y); x.moveTo(x1 - 8, y - 6); x.lineTo(x1, y); x.lineTo(x1 - 8, y + 6); x.stroke(); };
  const manWater = (x, cx, cy) => { fbond(x, cx - 11, cy + 7, cx, cy, 1, true); fbond(x, cx + 11, cy + 7, cx, cy, 1, true); x.save(); x.translate(cx, cy); x.scale(0.8, 0.8); fball(x, -14, 9, 'H', true); fball(x, 14, 9, 'H', true); fball(x, 0, 0, 'O', true); x.restore(); };
  const manCirc = (x, cx, cy, n, extra, col) => { for (let i = 0; i < n; i++) { manInk(x, i >= n - (extra || 0) ? REDINK : col || INK, 3); x.beginPath(); x.arc(cx - (n - 1) * 13 + i * 26, cy, 10, 0, 6.3); x.stroke(); } };
  const manPages = (x, cx, cy, n, extra) => { for (let i = 0; i < n; i++) { const px = cx - (n - 1) * 11 + i * 22; manInk(x, i >= n - (extra || 0) ? REDINK : INK, 2.5); x.fillStyle = '#fbf8ee'; x.beginPath(); x.rect(px - 8, cy - 12, 16, 24); x.fill(); x.stroke(); x.beginPath(); x.moveTo(px - 4, cy - 5); x.lineTo(px + 4, cy - 5); x.moveTo(px - 4, cy + 1); x.lineTo(px + 4, cy + 1); x.stroke(); } };
  const manYield = (x, cx, cy, up) => { manInk(x, INK, 3); x.beginPath(); x.moveTo(cx - 26, cy + 14); x.lineTo(cx + 26, cy + 14); x.stroke(); const col = up ? GREEN : REDINK, h = [10, 16, up ? 28 : 6]; h.forEach((q, i) => { x.fillStyle = i === 2 ? col : PENCIL; x.fillRect(cx - 22 + i * 16, cy + 12 - q, 11, q); }); manInk(x, col, 3); x.beginPath(); if (up) { x.moveTo(cx + 16, cy - 20); x.lineTo(cx + 16, cy - 34); x.moveTo(cx + 10, cy - 28); x.lineTo(cx + 16, cy - 34); x.lineTo(cx + 22, cy - 28); } else { x.moveTo(cx + 16, cy - 16); x.lineTo(cx + 16, cy - 2); x.moveTo(cx + 10, cy - 8); x.lineTo(cx + 16, cy - 2); x.lineTo(cx + 22, cy - 8); } x.stroke(); };
  const manNum = (x, cx, cy, str, good) => { AA.rxPen.write(x, str, cx, cy + 11, 34, { weight: 'heavy', color: good ? GREEN : REDINK, align: 'center' }); };
  const manLoop = (x, cx, cy, r, col) => { manInk(x, col || REDINK, 3); x.beginPath(); x.arc(cx, cy, r, 0.6, 5.6); x.stroke(); const ax = cx + r * Math.cos(5.6), ay = cy + r * Math.sin(5.6); x.beginPath(); x.moveTo(ax - 9, ay - 1); x.lineTo(ax, ay); x.lineTo(ax - 2, ay - 10); x.stroke(); };
  const manBottle = (x, cx, cy, col) => { manInk(x, INK, 2.5); x.fillStyle = col || '#9fc4d8'; x.beginPath(); x.moveTo(cx - 5, cy - 16); x.lineTo(cx - 5, cy - 8); x.lineTo(cx - 12, cy + 2); x.lineTo(cx - 12, cy + 16); x.lineTo(cx + 12, cy + 16); x.lineTo(cx + 12, cy + 2); x.lineTo(cx + 5, cy - 8); x.lineTo(cx + 5, cy - 16); x.closePath(); x.fill(); x.stroke(); };
  const manPlus = (x, cx, cy, col) => { manInk(x, col || REDINK, 3.5); x.beginPath(); x.moveTo(cx - 7, cy); x.lineTo(cx + 7, cy); x.moveTo(cx, cy - 7); x.lineTo(cx, cy + 7); x.stroke(); };
  const manCross = (x, cx, cy, r) => { manInk(x, REDINK, 3.5); x.beginPath(); x.moveTo(cx - r, cy - r); x.lineTo(cx + r, cy + r); x.moveTo(cx + r, cy - r); x.lineTo(cx - r, cy + r); x.stroke(); };
  // what a rule-thing does, as up to three small pictures read left to right: when ... then ...; picked from the words of the rules' own table
  const MANP = [
    [/drives off 4 waters/, (x, cx, cy) => { manWater(x, cx - 18, cy - 12); manWater(x, cx + 18, cy - 12); manWater(x, cx - 18, cy + 14); manWater(x, cx + 18, cy + 14); }],
    [/Water never leaves/, (x, cx, cy) => { manWater(x, cx, cy - 4); manCross(x, cx, cy, 20); }],
    [/atoms smaller/, (x, cx, cy) => { manMol(x, 'C-C-C-c-c', cx, cy); }], [/atoms bigger/, (x, cx, cy) => { manMol(x, 'c-c-C-C-C', cx, cy - 12); manMol(x, 'C-C-C-C-C', cx, cy + 14); }],
    [/nitrogen goes on/, (x, cx, cy) => { manMol(x, 'C-C-N', cx, cy); manPlus(x, cx + 38, cy - 18); }], [/sulfur goes on/, (x, cx, cy) => { manMol(x, 'C-C-S', cx, cy); manPlus(x, cx + 38, cy - 18); }],
    [/carbon dioxide came off/, (x, cx, cy) => { manMol(x, 'O=C=O', cx, cy); manArrow(x, cx - 10, cy - 26, cx + 14, PENCIL); }],
    [/finds nothing to act on/, (x, cx, cy) => { manBottle(x, cx - 14, cy); manCross(x, cx + 16, cy, 9); }],
    [/line of the page before again/, (x, cx, cy) => { manCirc(x, cx, cy - 13, 3, 0, PENCIL); manCirc(x, cx, cy + 13, 3); }],
    [/each set off a reflex/, (x, cx, cy) => { manRing(x, cx - 20, cy, 13, 5); manRing(x, cx + 20, cy, 13, 5); }],
    [/oxidize is fired last/, (x, cx, cy) => { manCirc(x, cx, cy, 3, 1); }],
    [/four or more plain CH2/, (x, cx, cy) => { manMol(x, 'C-C-C-C-C-C', cx, cy - 13, 0.7); manMol(x, 'C-C', cx, cy + 15); }],
    [/Every OH that can lose water/, (x, cx, cy) => { manMol(x, 'C-C-O-H', cx, cy - 15, 0.8); manMol(x, 'C=C', cx - 16, cy + 16, 0.8); x.save(); x.translate(cx + 26, cy + 16); x.scale(0.7, 0.7); manWater(x, 0, 0); x.restore(); }],
    [/Every C=C outside a benzene ring becomes a C=O/, (x, cx, cy) => { manMol(x, 'C-C=C', cx, cy - 15, 0.85); manMol(x, 'C-C=O', cx, cy + 16, 0.85); }],
    [/the other is copied across it/, (x, cx, cy) => { manMol(x, 'O-C-c-c', cx, cy - 15, 0.8); manMol(x, 'O-C-C-O', cx, cy + 16, 0.8); manInk(x, REDINK, 2); x.setLineDash([4, 4]); x.beginPath(); x.moveTo(cx, cy - 32); x.lineTo(cx, cy + 34); x.stroke(); x.setLineDash([]); }],
    [/one hydrogen there becomes an OH/, (x, cx, cy) => { manMol(x, 'C-C-H', cx, cy - 15, 0.85); manMol(x, 'C-C-O-H', cx, cy + 16, 0.85); }],
    [/Oxygen behaves as sulfur/, (x, cx, cy) => { fball(x, cx - 24, cy, 'O', true); manArrow(x, cx - 8, cy, cx + 8); fball(x, cx + 26, cy, 'S', true); }],
    [/Every double bond counts twice/, (x, cx, cy) => { manMol(x, 'C=C', cx, cy - 13); manMol(x, 'C=C', cx, cy + 15); }],
    [/past an O, N or S/, (x, cx, cy) => { manRing(x, cx, cy, 20, 5, 'O'); manLoop(x, cx, cy, 8); }],
    [/takes two hydrogens/, (x, cx, cy) => { manMol(x, 'C=C-C=O', cx, cy + 8, 0.8); manMol(x, 'H-H', cx, cy - 24, 0.7); }],
    [/No reflex along the chain has a limit/, (x, cx, cy) => { manRing(x, cx, cy, 13, 5); manLoop(x, cx, cy, 24); }], [/start again after every reagent/, (x, cx, cy) => { manBottle(x, cx - 20, cy); manRing(x, cx + 18, cy, 11, 5); manLoop(x, cx + 18, cy, 21); }],
    [/fire again in the same order/, (x, cx, cy) => { manCirc(x, cx, cy + 6, 3); manLoop(x, cx, cy + 6, 30); }],
    [/the round ends now/, (x, cx, cy) => { manPages(x, cx, cy, 3); manCross(x, cx + 22, cy, 9); manInk(x, GREEN, 4); x.beginPath(); x.moveTo(cx - 30, cy + 20); x.lineTo(cx - 22, cy + 28); x.lineTo(cx - 6, cy + 14); x.stroke(); }],
    [/One more reagent is dealt/, (x, cx, cy) => { [-24, 0, 24].forEach((d, i) => manBottle(x, cx + d, cy, i === 2 ? '#e6b0a0' : null)); manPlus(x, cx + 24, cy - 26); }],
    [/(One|Two) more uses? of every reagent/, (x, cx, cy) => { manBottle(x, cx - 8, cy); manInk(x, REDINK, 3); x.beginPath(); x.arc(cx + 20, cy + 4, 5, 0, 6.3); x.fill(); manPlus(x, cx + 20, cy - 16); }],
    [/fourth circle|four circles/, (x, cx, cy) => { manCirc(x, cx, cy, 4, 1); }], [/has four pages|One more page is played/, (x, cx, cy) => { manPages(x, cx, cy, 4, 1); }], [/two pages a round/, (x, cx, cy) => { manPages(x, cx, cy, 2); }],
    [/counts twice|count on from this one/, (x, cx, cy) => { manPages(x, cx - 16, cy, 1); manInk(x, GREEN, 4); [[6, -8], [6, 10]].forEach(q => { x.beginPath(); x.moveTo(cx + q[0], cy + q[1]); x.lineTo(cx + q[0] + 7, cy + q[1] + 7); x.lineTo(cx + q[0] + 20, cy + q[1] - 8); x.stroke(); }); }],
    [/every C=C becomes C-OH/, (x, cx, cy) => { manMol(x, 'C-C-O-H', cx, cy, 0.85); }],
    [/pours every dealt reagent/, (x, cx, cy) => { [-22, 0, 22].forEach(d => manBottle(x, cx + d, cy - 4)); manArrow(x, cx - 24, cy + 24, cx + 24, REDINK); }],
    [/get their use back/, (x, cx, cy) => { manBottle(x, cx, cy); manLoop(x, cx, cy, 24, GREEN); }], [/are shut on the next page/, (x, cx, cy) => { manBottle(x, cx, cy, '#cfcabd'); manCross(x, cx, cy, 14); }],
    [/number to beat (is )?1\./, (x, cx, cy) => { manInk(x, REDINK, 3); x.beginPath(); x.arc(cx, cy, 13, 0, 6.3); x.stroke(); x.beginPath(); x.moveTo(cx + 24, cy + 10); x.lineTo(cx + 24, cy - 12); x.moveTo(cx + 18, cy - 6); x.lineTo(cx + 24, cy - 12); x.lineTo(cx + 30, cy - 6); x.stroke(); }],
    [/instruments? drawn at random/, (x, cx, cy) => { manInk(x, INK, 3); x.beginPath(); x.rect(cx - 16, cy - 14, 32, 30); x.stroke(); [[-7, -5], [7, 7], [0, 1]].forEach(q => { x.beginPath(); x.arc(cx + q[0], cy + q[1], 3, 0, 6.3); x.fill(); }); }],
    [/three of the starting reagents/, (x, cx, cy) => { [-22, 0, 22].forEach(d => manBottle(x, cx + d, cy)); }],
    [/run of six rounds/, (x, cx, cy) => { manPages(x, cx, cy - 13, 3); manPages(x, cx, cy + 15, 3, 3); }], [/run of nine rounds/, (x, cx, cy) => { manPages(x, cx, cy - 22, 3); manPages(x, cx, cy + 2, 3); manPages(x, cx, cy + 26, 3, 3); }],
    [/soundtrack/, (x, cx, cy) => { manInk(x, INK, 3); for (let i = 0; i < 9; i++) { const h = 6 + 22 * Math.abs(Math.sin(i * 1.3 + cx)); x.beginPath(); x.moveTo(cx - 32 + i * 8, cy - h / 2); x.lineTo(cx - 32 + i * 8, cy + h / 2); x.stroke(); } }],
    [/given up and earned again/, (x, cx, cy) => { manLoop(x, cx, cy, 14, INK); }] ];
  const MANJOB = { water: ['drives off 4 waters'], h2: ['oxidize is fired last'], co2: ['carbon dioxide came off'], acid: ['atoms smaller'], wood: ['finds nothing to act on', 'pours every dealt reagent'], salt: ['line of the page before again'], slime: ['each set off a reflex'], ammonia: ['nitrogen goes on', 'fire again in the same order'], seedling: ['atoms bigger'], brimstone: ['sulfur goes on', 'the round ends now'] };
  function manDoes(x, row, cx, cy, w) {
    if (row.category === 'reagent') { const W = 300, H = 150, c = document.createElement('canvas'); c.width = W; c.height = H; try { cardDraw(c.getContext('2d'), row.id, true, W, H); } catch (e) { return; } const k = Math.min(w / W, 0.62); x.drawImage(c, cx - W * k / 2, cy - H * k / 2, W * k, H * k); return; }
    if (row.category === 'reflex') { const R = { seal: () => { manMol(x, 'O-C-C-C-O', cx - 44, cy, 0.62); manArrow(x, cx - 2, cy, cx + 14); manRing(x, cx + 44, cy, 17, 5, 'O'); }, open: () => { manRing(x, cx - 42, cy + 2, 11, 3, 'O'); manArrow(x, cx - 14, cy, cx + 4); manRing(x, cx + 38, cy, 17, 5, 'O'); }, fold: () => { manRing(x, cx - 40, cy + 2, 11, 3, 'O'); manArrow(x, cx - 14, cy, cx + 4); manMol(x, 'C-C=O', cx + 44, cy, 0.9); } }; if (R[row.id]) R[row.id](); return; }
    if (row.category === 'motif') { /* (builder 18) the level's dot, an arrow, what one level pays (P.MOTIFS) */ const rt = P.MOTIFS[row.id] ? P.MOTIFS[row.id].rate : 0; x.fillStyle = INK; x.beginPath(); x.arc(cx - 40, cy, 5, 0, 6.3); x.fill(); manArrow(x, cx - 22, cy, cx - 2); manNum(x, cx + 42, cy, 'x' + (1 + rt).toFixed(2), true); return; }
    // (builder 18) the picture of the job, then its numbers. A creature's pictures are picked by its id (MANJOB), not by the words of its line (the
    // rules side is rewording those); the numbers are the row's own nums: [{ v, sign }] in the pen's hand, a loss in red. No sentence is read for a number.
    const job = MANJOB[row.id] && row.category === 'homunculus' ? MANJOB[row.id].map(k => MANP.find(q => q[0].source.indexOf(k) >= 0)).filter(q => q) : MANP.filter(q => q[0].test(row.does)), nums = (row.nums || []).slice(0, 3), hits = job.slice(0, nums.length >= 2 ? 2 : 3), n = hits.length + nums.length; if (!n) return;
    const st = Math.min(92, w / n), x0 = cx - (n - 1) * st / 2, k = st < 80 ? 0.78 : 0.95;
    hits.forEach((q, i) => { x.save(); x.translate(x0 + i * st, cy); x.scale(k, k); q[1](x, 0, 0, row.does.match(q[0]) || []); x.restore(); if (i < n - 1) manArrow(x, x0 + i * st + st / 2 - 7, cy, x0 + i * st + st / 2 + 7, PENCIL); });
    nums.forEach((q, j) => { const i = hits.length + j; x.save(); x.translate(x0 + i * st, cy); const kn = Math.min(k, st / 96); x.scale(kn, kn); manNum(x, 0, 0, 'x' + (+q.v).toFixed(2), q.sign !== '-'); x.restore(); });
  }
  // the flat emblem of a thing that is not an object on the bench (also a category's tab)
  function manEmblem(x, row, cx, cy, r) {
    const c = row.category, k = r / 40; x.save(); x.translate(cx, cy); x.scale(k, k); manInk(x, INK, 3.2);
    if (c === 'sigil') { x.restore(); manInk(x, '#7a1d16', 3); sigGlyph(x, row.id, cx, cy, r * 0.78, '#7a1d16', Math.max(2.5, r / 11)); return; }
    if (c === 'motif') { x.restore(); try { AA.rxMarks.motifMark(x, row.id, cx, cy + r * 0.1, r * 1.75, { ink: INK }); } catch (e) { /* none */ } return; }
    if (c === 'reagent') { const cd = RX.CARDS[row.id] || {}, col = cd.rgb ? rgb(bright(cd.rgb)) : '#9fc4d8'; x.scale(1.9, 1.9); manBottle(x, 0, 0, col); }
    else if (c === 'reflex') { manRing(x, 0, 0, 24, row.id === 'seal' ? 5 : 3, 'O'); manLoop(x, 0, 0, 36, REDINK); }
    else if (c === 'term') { const h = hash(row.id); manInk(x, INK, 3.2); x.fillStyle = '#fbf8ee'; x.beginPath(); x.rect(-24, -32, 48, 64); x.fill(); x.stroke(); x.fillStyle = INK;
      if (row.id === 'glass') { x.beginPath(); x.moveTo(-12, -20); x.lineTo(12, -20); x.lineTo(-12, 20); x.lineTo(12, 20); x.closePath(); x.stroke(); } else if (row.id === 'occult') { x.beginPath(); x.moveTo(-16, 0); x.quadraticCurveTo(0, -18, 16, 0); x.quadraticCurveTo(0, 18, -16, 0); x.stroke(); x.beginPath(); x.arc(0, 0, 5, 0, 6.3); x.fill(); } else if (row.id === 'lean') { [-12, 0, 12].forEach(d => { x.beginPath(); x.rect(d - 4, -8, 8, 20); x.stroke(); }); } else if (row.id === 'long') { [-15, -5, 5, 15].forEach(d => { x.beginPath(); x.arc(d, 0, 4.2, 0, 6.3); x.stroke(); }); } else if (row.id === 'hoard') { [[-10, 8], [10, 8], [0, -10]].forEach(q => { x.beginPath(); x.rect(q[0] - 8, q[1] - 8, 16, 16); x.stroke(); }); } else { x.beginPath(); x.arc(0, 0, 8 + 8 * h, 0, 6.3); x.stroke(); } }
    else if (c === 'length') { const n = row.id === 'master' ? 6 : 9; for (let i = 0; i < n; i++) { const px = -22 + (i % 3) * 22, py = (n === 6 ? -14 : -26) + Math.floor(i / 3) * 26; x.fillStyle = '#fbf8ee'; x.beginPath(); x.rect(px - 8, py - 10, 16, 20); x.fill(); x.stroke(); } }
    else if (c === 'soundtrack') { const h = hash(row.id); x.beginPath(); x.ellipse(-12, 20, 10, 7, -0.4, 0, 6.3); x.fill(); x.beginPath(); x.ellipse(18, 12, 10, 7, -0.4, 0, 6.3); x.fill(); x.lineWidth = 4; x.beginPath(); x.moveTo(-3, 18); x.lineTo(-3, -24); x.lineTo(27, -32); x.lineTo(27, 10); x.stroke(); x.lineWidth = 2.5; x.strokeStyle = REDINK; for (let i = 0; i < 3 + Math.floor(h * 3); i++) { x.beginPath(); x.arc(-3, -24, 12 + i * 7, -2.6 - h, -1.9 - h * 0.5); x.stroke(); } }
    else if (c === 'sign') { const n = +String(row.id).replace('sign', '') || 1; manInk(x, '#c9a200', 4.5); x.beginPath(); x.arc(0, 8, 16, 0, 6.3); x.stroke(); x.beginPath(); x.moveTo(0, -8); x.lineTo(0, -34); if (n >= 2) { x.moveTo(-4, -12); x.lineTo(-20, -28); x.moveTo(4, -12); x.lineTo(20, -28); } if (n >= 3) { x.moveTo(-26, 8); x.lineTo(26, 8); } x.stroke(); if (n >= 3) { x.beginPath(); x.arc(0, 8, 3.5, 0, 6.3); x.fill(); } }
    else if (c === 'instrument') { x.lineWidth = 9; x.strokeStyle = '#b3261c'; x.beginPath(); x.arc(0, -4, 18, Math.PI, 0); x.lineTo(18, 22); x.moveTo(-18, -4); x.lineTo(-18, 22); x.stroke(); x.strokeStyle = '#cfcabd'; x.beginPath(); x.moveTo(18, 14); x.lineTo(18, 24); x.moveTo(-18, 14); x.lineTo(-18, 24); x.stroke(); }
    else if (c === 'homunculus') { manInk(x, INK, 3.2); x.fillStyle = '#bfe3d4'; x.beginPath(); x.rect(-20, -22, 40, 50); x.fill(); x.stroke(); x.beginPath(); x.rect(-14, -30, 28, 8); x.stroke(); x.fillStyle = INK; x.beginPath(); x.arc(-7, -2, 3.2, 0, 6.3); x.arc(7, -2, 3.2, 0, 6.3); x.fill(); x.beginPath(); x.arc(0, 6, 8, 0.3, 2.84); x.stroke(); }
    x.restore();
  }
  function manPaper(x) {
    x.clearRect(0, 0, 1280, 720); x.fillStyle = 'rgba(20,14,8,0.62)'; x.fillRect(0, 0, 1280, 720); x.fillStyle = '#4a2e1e'; x.fillRect(46, 62, 1188, 644); const g = x.createLinearGradient(60, 0, 1220, 0); g.addColorStop(0, '#e9dfc3'); g.addColorStop(0.47, '#efe6cf'); g.addColorStop(0.5, '#cdbf9c'); g.addColorStop(0.53, '#efe6cf'); g.addColorStop(1, '#e6dbbd'); x.fillStyle = g; x.fillRect(60, 74, 1160, 620);
    for (let i = 0; i < 260; i++) { x.fillStyle = 'rgba(120,90,40,' + (0.02 + 0.04 * hash('mp' + i)) + ')'; x.beginPath(); x.arc(60 + hash('mx' + i) * 1160, 74 + hash('my' + i) * 620, 2 + 16 * hash('mr' + i), 0, 6.3); x.fill(); }
    x.strokeStyle = 'rgba(90,70,40,0.28)'; x.lineWidth = 1; for (let y = 120; y < 690; y += 114) { x.beginPath(); x.moveTo(80, y + 96); x.lineTo(620, y + 96); x.moveTo(660, y + 96); x.lineTo(1200, y + 96); x.stroke(); }
  }
  function manSpread(x) {
    manPaper(x); const cats = P.REFERENCE_CATS, rows = MAN.rows || []; MAN.tabs = []; MAN.cells = [];
    cats.forEach((ct, i) => { const w = 104, tx = 96 + i * 110, on = i === MAN.cat, ty = on ? 16 : 26, h = on ? 62 : 50, list = rows.filter(r => r.category === ct[0]), own = list.filter(r => r.owned).length; x.fillStyle = on ? '#efe6cf' : '#d6c9a6'; x.strokeStyle = '#4a2e1e'; x.lineWidth = 3; x.beginPath(); x.moveTo(tx, ty + h); x.lineTo(tx, ty + 10); x.quadraticCurveTo(tx, ty, tx + 10, ty); x.lineTo(tx + w - 10, ty); x.quadraticCurveTo(tx + w, ty, tx + w, ty + 10); x.lineTo(tx + w, ty + h); x.fill(); x.stroke();
      manEmblem(x, { category: ct[0], id: ct[0] === 'reflex' ? 'seal' : ct[0] === 'length' ? 'master' : ct[0] === 'sign' ? 'sign3' : ct[0] === 'term' ? 'occult' : list[0] ? list[0].id : '' }, tx + 34, ty + 30, 20);
      // how many of the tab's things are held: filled pips, no numerals
      for (let k = 0; k < Math.min(list.length, 18); k++) { x.fillStyle = k < own ? '#2f6b3a' : 'rgba(74,46,30,0.25)'; x.beginPath(); x.arc(tx + 66 + (k % 3) * 11, ty + 12 + Math.floor(k / 3) * 7.5, 3, 0, 6.3); x.fill(); } MAN.tabs.push({ x: tx, y: ty, w, h, i }); });
    const list = rows.filter(r => r.category === cats[MAN.cat][0]); if (cats[MAN.cat][0] === 'motif') { (P.MOTIF_START || []).slice().reverse().forEach(id => { if (!list.some(r => r.id === id)) list.unshift({ id, category: 'motif', name: '', does: '', how: '', owned: true, nums: [], bare: true }); }); list.sort((a, b) => AA.rxMarks.motifMarkIds.indexOf(a.id) - AA.rxMarks.motifMarkIds.indexOf(b.id)); }
    const big = list.length <= 10, per = big ? 5 : 10, CW = big ? 536 : 268, CH = 114;
    list.slice(0, 20).forEach((row, i) => { const pg = i < per ? 0 : 1, j = i % per, cx0 = (pg ? 662 : 82) + (big ? 0 : (j % 2) * CW), cy0 = 106 + (big ? j : Math.floor(j / 2)) * CH; x.drawImage(manThumb(row), cx0 + 2, cy0 + 2, 104, 104);
      if (big) { if (row.owned) { manArrow(x, cx0 + 122, cy0 + 54, cx0 + 150, PENCIL); x.save(); x.translate(cx0 + 340, cy0 + 54); x.scale(1.3, 1.3); manDoes(x, row, 0, 0, 270); x.restore(); } else { x.setLineDash([5, 6]); x.strokeStyle = 'rgba(90,86,78,0.45)'; x.lineWidth = 2; x.strokeRect(cx0 + 170, cy0 + 12, 330, 76); x.setLineDash([]); if (row.target) { const f = Math.max(0, Math.min(1, (row.count || 0) / row.target)); x.fillStyle = 'rgba(90,86,78,0.2)'; x.fillRect(cx0 + 170, cy0 + 94, 330, 5); x.fillStyle = '#2f6b3a'; x.fillRect(cx0 + 170, cy0 + 94, 330 * f, 5); } } MAN.cells.push({ x: cx0, y: cy0, w: CW - 8, h: CH - 8, row }); return; }
      if (row.owned) { manArrow(x, cx0 + 102, cy0 + 52, cx0 + 120, PENCIL); manDoes(x, row, cx0 + 192, cy0 + 52, 136); } else { x.setLineDash([5, 6]); x.strokeStyle = 'rgba(90,86,78,0.45)'; x.lineWidth = 2; x.strokeRect(cx0 + 128, cy0 + 20, 126, 64); x.setLineDash([]); if (row.target) { const f = Math.max(0, Math.min(1, (row.count || 0) / row.target)); x.fillStyle = 'rgba(90,86,78,0.2)'; x.fillRect(cx0 + 128, cy0 + 90, 126, 5); x.fillStyle = '#2f6b3a'; x.fillRect(cx0 + 128, cy0 + 90, 126 * f, 5); } }
      MAN.cells.push({ x: cx0, y: cy0, w: CW - 8, h: CH - 8, row }); });
  }
  function manWrap(str, size, w) { const words = String(str).split(' '), out = []; let ln = ''; words.forEach(wd => { const t = ln ? ln + ' ' + wd : wd; if (AA.rxPen.width(t, size, 'thin') > w && ln) { out.push(ln); ln = wd; } else ln = t; }); if (ln) out.push(ln); return out; }
  function manDetail(x, now) {
    const row = MAN.pick; manPaper(x); x.fillStyle = 'rgba(239,230,207,0.6)'; x.fillRect(60, 74, 1160, 620);
    // the turn: it coasts after the hand lets go, and after a while comes home (front to the eye)
    if (!MAN.drag) { MAN.yaw += MAN.vy; MAN.pit = Math.max(-1.1, Math.min(1.1, MAN.pit + MAN.vp)); MAN.vy *= 0.95; MAN.vp *= 0.9; if (now - MAN.idle > 2600 && Math.abs(MAN.vy) < 0.004) { const home = Math.round((MAN.yaw + 0.5) / (2 * Math.PI)) * 2 * Math.PI - 0.5; MAN.yaw += (home - MAN.yaw) * 0.07; MAN.pit += (0.12 - MAN.pit) * 0.07; } }
    x.fillStyle = 'rgba(60,40,20,0.16)'; x.beginPath(); x.ellipse(330, 560, 150, 22, 0, 0, 6.3); x.fill(); const img = manShot(row, MAN.yaw, MAN.pit); x.drawImage(row.owned ? img : manPencil(img, 400), 110, 150, 440, 440);
    const W = AA.rxPen.write, X0 = 640, WD = 540; let y = 170; W(x, row.name.charAt(0).toUpperCase() + row.name.slice(1), X0, y, 56, { weight: 'heavy', color: INK, align: 'left' }); y += 26; x.strokeStyle = PENCIL; x.lineWidth = 2; x.beginPath(); x.moveTo(X0, y); x.lineTo(X0 + WD, y); x.stroke(); y += 44;
    if (row.owned) { manWrap(row.does, 33, WD).forEach(l => { W(x, l, X0, y, 33, { weight: 'thin', color: INK, align: 'left' }); y += 44; }); y += 24; }
    manWrap(row.how, 29, WD).forEach(l => { W(x, l, X0, y, 29, { weight: 'thin', color: row.owned ? PENCIL : INK, align: 'left' }); y += 39; });
    if (row.target && !(row.owned && row.target === 1)) { y += 14; const f = Math.max(0, Math.min(1, (row.count || 0) / row.target)); x.fillStyle = 'rgba(90,86,78,0.2)'; x.fillRect(X0, y, 300, 12); x.fillStyle = '#2f6b3a'; x.fillRect(X0, y, 300 * f, 12); W(x, fmt(row.count || 0) + ' of ' + fmt(row.target), X0 + 316, y + 14, 30, { weight: 'heavy', color: row.owned ? GREEN : REDINK, align: 'left' }); }
    if (row.category === 'homunculus' && row.owned && row.stages && row.stages.length) { /* (builder 18) five numbers in a row under the creature: passed ones in pencil, the one it holds in ink with a line under it, the ones to come faint; five pips over them */
      const stg = row.stage || 0, n5 = row.stages.length, x0 = 120, stp = 420 / n5; row.stages.forEach((v, i) => { const cxn = x0 + stp * (i + 0.5), cur = stg === i + 1, col = cur ? INK : stg && i + 1 < stg ? PENCIL : 'rgba(90,86,78,0.45)'; x.fillStyle = stg && i + 1 <= stg ? '#2f6b3a' : 'rgba(74,46,30,0.25)'; x.beginPath(); x.arc(cxn, 606, cur ? 7 : 5, 0, 6.3); x.fill();
        W(x, 'x' + (+v).toFixed(2), cxn, 648, cur ? 34 : 26, { weight: cur ? 'heavy' : 'thin', color: col, align: 'center' }); if (cur) { x.strokeStyle = INK; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath(); x.moveTo(cxn - 34, 660); x.lineTo(cxn + 34, 658); x.stroke(); } }); }
    // the way back: a turned-down corner, drawn
    x.fillStyle = '#cdbf9c'; x.strokeStyle = '#4a2e1e'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(1220, 74); x.lineTo(1160, 74); x.lineTo(1220, 134); x.closePath(); x.fill(); x.stroke();
  }
  function manFrame(now) { if (!REFB) { try { manBook(); } catch (e) { REFB = { grp: null, err: String(e) }; } } if (!MAN.on) return; if (MAN.pick) { manDetail(MAN.x, now); return; } if (MAN.dirty) { MAN.dirty = false; try { manSpread(MAN.x); } catch (e) { MAN.err = String(e && e.stack); } } }
  cv.addEventListener('pointerdown', e => { try { if (!MAN.on && manHit(manPx(e))) { e.stopPropagation(); manOpen(); } } catch (q) { /* the book never breaks play */ } }, true);
  AA.rxScheme = { homRestand: () => { homStand(); return homObj ? { stage: homObj.stage, s: homObj.s } : null; }, homEvoState: () => Object.assign({}, HEVO, { seen: !!HEVO.seen }), kinSet: v => { KINV.mode = v === 'a' || v === 'b' || v === 'c' ? v : null; KINV.g = null; }, kinState: () => ({ mode: KINV.mode, err: KINV.err, S: JSON.parse(JSON.stringify(KINV.S)), feat: KINV.F ? { arene: KINV.F.arene.length, loops: KINV.F.loops.length, conj: KINV.F.conj.length, oh: KINV.F.oh.length, back: KINV.F.back.length } : null, where: KINV.F && KINV.F.where ? Object.keys(KINV.F.where).reduce((o, k) => { o[k] = KINV.F.where[k].length; return o; }, {}) : null, strip: KINV.strip || null, row: KINV.row || null, motifs: g ? P.motifsOf(g.m) : null, open: g ? P.motifOpen(g) : null }), kinAt: (x, z) => { KINV.at.x = x; KINV.at.z = z; }, manOpen, manShut, manTab: i => { MAN.cat = i; MAN.dirty = true; sfxN('pageTurn'); }, manPick, manBack: () => { MAN.pick = null; MAN.dirty = true; }, manSpin: (vy, vp) => { MAN.vy = vy; MAN.vp = vp || 0; MAN.idle = performance.now(); }, manState: () => ({ on: MAN.on, cat: MAN.cat, pick: MAN.pick && MAN.pick.id, yaw: MAN.yaw, err: MAN.err || null, book: !!(REFB && REFB.grp), bookErr: REFB && REFB.err, cells: MAN.cells.map(q => [q.row.id, q.row.owned ? 1 : 0]), cats: P.REFERENCE_CATS.map(c => c[0]) }), inkLog: z => { INKW.on = true; const o = { frames: INKW.frames, bad: INKW.bad, worst: INKW.worst, at: INKW.at, by: Object.assign({}, INKW.by), img: INKW.img }; if (z) { INKW.frames = 0; INKW.bad = 0; INKW.worst = 0; INKW.at = null; INKW.by = {}; } return o; }, safe: () => SAFE, paceLog: () => (AA.rxFeel.log || []).filter(e => e[0] === 'pace').map(e => e.slice(1).join(':')).join(' '), fitLog: z => { const o = Object.assign({}, FITW); if (z) { FITW.frames = 0; FITW.bad = 0; FITW.worst = 0; FITW.at = null; } return o; }, cupAct: () => cupAct(), cupHov: v => { CUP.hov = !!v; if (v) sfxN('hover'); }, coined: () => { meta.coined = true; return pairOn(); }, cupState: () => ({ can: g && P.canRedraw(g), why: g && [P.RULE.redraw, P.RULE.hand, !!g.syn, g.over, !!g.chain, g.redrawn, g.shot, (g.rackIds || []).length, (g.kinds || []).length, g.pageSteps, JSON.stringify(g.kinds), JSON.stringify(g.free || 0), JSON.stringify(g.left)], lvl: CUP.lvl, shown: +CUP.shown.toFixed(2), tides: CUP.tides.length, steam: +CUP.steamK.toFixed(2) }), debug11: a => { if (a === 'mol') { const m = center, H = homeNow(), bb = m && liveBox(m); return m && { sc: +st.sc.toFixed(2), box: [+m.box.w.toFixed(1), +m.box.d.toFixed(1)], live: [+bb.w.toFixed(1), +bb.d.toFixed(1)], home: [H.w, H.d, H.smax], fit: +flScale(m).toFixed(2) }; } const pr = (x, y, z) => { const v = new T.Vector3(x, y, z).project(cam); return [Math.round((v.x + 1) * 640), Math.round((1 - v.y) * 360)]; }; if (/^made:/.test(a)) { const v = +a.slice(5); st.want = v; st.shown = v; if (g) { g.total = v; g.made = v; } dirty = true; return v; } if (a === 'need') return { need: needNow(), quota: st.quota, marks: P.runMarks(st.quota), tier: run && run.tierNo, round: run && run.round, spec: !!(g && g.specDef) }; if (a === 'bench') return { row: [pr(TOPB.x0, 0, TOPB.z), pr(TOPB.x0 + 10, 0, TOPB.z)], page: [pr(-32, 0, 0), pr(32, 0, 0), pr(-32 - (PGE.on ? PGE.ext : 0), 0, 0)], cup: [pr(CUP.x - 2.1 * CUP.B, 0, CUP.z), pr(CUP.x + 2.1 * CUP.B, 0, CUP.z)], kit: kitObjs.map(k => [k.id, +(k.pw * k.base).toFixed(1), +(k.ph * k.base).toFixed(1), pr(k.hx, 0, k.hz)]), jars: JARK.filter(jarSeen).map(k => { const j = jarPos(k), bb = new T.Box3().setFromObject(jars[k].grp); return [k, pr(j.x, 0, j.z), +(bb.max.x - bb.min.x).toFixed(1), +((bb.max.y - bb.min.y) / Math.cos(0.8)).toFixed(1)]; }), hom: homObj && (() => { const bb = new T.Box3().setFromObject(homObj.grp); return [+(bb.max.x - bb.min.x).toFixed(1), pr(HOMP.x, 0, HOMP.z)]; })(), coin: [pr(GP.x, 0, GP.z), 2.76], card: [BT.cw, BT.ch, BT.bw, BT.bh, pr(BT.x, 0, 0)], ext: PGE.on ? PGE.ext : 0 }; return null; }, toolArm: id => toolArm(id), toolSpots: () => (st.toolList || []).map(q => { const sc = center.group.scale.x; return { x: C0.x + q.x * sc, z: C0.z + q.z * sc, whole: q.whole }; }), toolPx: () => (st.toolList || []).map(q => { const sc = center.group.scale.x; return mpx({ x: C0.x + q.x * sc, z: C0.z + q.z * sc }); }), toolUse: i => { st.toolSpot = st.toolList && st.toolList[i]; if (st.toolSpot) doTool(); }, toolPeek: i => { st.toolSpot = st.toolList && st.toolList[i]; if (st.toolSpot && st.toolSpot.sp.b && st.toolSpot.ghost === undefined) st.toolSpot.ghost = null; dirty = true; }, toolWorths: () => (st.toolList || []).map(q => q.worth), toolGhost: () => st.toolSpot && st.toolSpot.ghost, debugMorph: () => morph && { bend: !!morph.bend, f: morph.bend && [morph.bend.f0, morph.bend.f1, morph.bend.F.x1, morph.bend.F.r, morph.bend.F.dir, morph.bend.F.cx, morph.bend.F.cz], n: morph.bend && morph.bend.bodies.length, u0: morph.bend && morph.bend.U0.size, end: morph.end, pts: Array.from(morph.cur.entries()).filter(e => e[0].el !== 'H').map(e => [+e[1].x.toFixed(1), +e[1].z.toFixed(1), morph.from.has(e[0]) ? 1 : 0]) }, debugFold: () => center && center.at.fold && { r: center.at.fold.r, dir: center.at.fold.dir }, debugShape: (smi, o) => { o = o || {}; let m = RX.fromSmiles(smi); RX.reopen(m); let spots = 0; if (o.tool) { const sp = RX.tools.spots(m, o.tool, P.RULE.atoms); spots = sp.length; if (!sp.length) return { none: true, spots: 0 }; const t = P.toolTry(m, o.tool, sp[Math.min(sp.length - 1, o.spot || 0)]); if (!t) return { none: true, spots }; m = t; } if (o.hom) { const hs = P.HOMS[o.hom].spots(m, { m, self: P.SELF0, kinds: [], left: {} }); if (!hs.length) return { none: true, spots: 0 }; const t = P.homTry(m, o.hom, hs[Math.min(hs.length - 1, o.spot || 0)]); if (!t) return { none: true, spots: hs.length }; m = t; spots = hs.length; } let z = 0; for (let i = 0; i < (o.zips || 0); i++) { const c = RX.CARDS.lactol; if (!c.find(m).length) break; c.apply(m); z++; } const cg = caged(m, archesOf(m)); if (cg && m.settle) m.settle(300); setAlign(m); const t0 = performance.now(), mm = buildMol(m, null, false), ms = performance.now() - t0, hv = []; mm.balls.forEach((b, a) => { if (a.el !== 'H') hv.push(a); }); let worst = 1, near = 9, lo = 1e9, hi = -1e9, zl = 1e9, zh = -1e9; const bd = new Set(); mm.sticks.forEach(q => { if (q.a.el === 'H' || q.b.el === 'H') return; const A = mm.at.get(q.a), B = mm.at.get(q.b), r = Math.hypot(A.x - B.x, A.z - B.z) / 1.55; if (Math.abs(r - 1) > Math.abs(worst - 1)) worst = r; bd.add(q.a); }); const bonded = (a, b) => mm.sticks.some(q => (q.a === a && q.b === b) || (q.a === b && q.b === a)); for (let i = 0; i < hv.length; i++) { const A = mm.at.get(hv[i]); lo = Math.min(lo, A.x); hi = Math.max(hi, A.x); zl = Math.min(zl, A.z); zh = Math.max(zh, A.z); for (let j = i + 1; j < hv.length; j++) { const B = mm.at.get(hv[j]), d = Math.hypot(A.x - B.x, A.z - B.z) / 1.55; if (d < near && !bonded(hv[i], hv[j])) near = d; } } const sc = fitMain(mm); if (o.show) { freeMol(center); center = mm; SC_MAIN = sc; st.sc = sc; place(mm, C0, sc); mm.groups = groupsOf(mm); mm.ghosts = []; mm.hot = []; dirty = true; } else freeMol(mm); const un = { lo: 1e9, hi: -1e9, zl: 1e9, zh: -1e9 }; if (mm.at.unf) mm.at.unf.forEach(v => { un.lo = Math.min(un.lo, v.x); un.hi = Math.max(un.hi, v.x); un.zl = Math.min(un.zl, v.z); un.zh = Math.max(un.zh, v.z); }); return { uw: +(un.hi - un.lo).toFixed(1), ud: +(un.zh - un.zl).toFixed(1), fr: mm.at.fold ? +mm.at.fold.r.toFixed(1) : 0, worst: +worst.toFixed(3), near: +near.toFixed(3), w: +(hi - lo).toFixed(1), d: +(zh - zl).toFixed(1), sc: +sc.toFixed(2), caged: cg, zips: z, spots, n: hv.length, ms: +ms.toFixed(1) }; }, debugLay: (smi, n) => { const m = RX.fromSmiles(smi); RX.reopen(m); for (let i = 0; i < n; i++) { const c = RX.CARDS.lactol; if (!c.find(m).length) break; c.apply(m); } setAlign(m); const mm = buildMol(m, null, false), out = []; mm.at.forEach((v, a) => { if (a.el !== 'H') out.push((a.bead || a.el) + ' ' + v.x.toFixed(1) + ' ' + v.z.toFixed(1) + ' ' + v.y.toFixed(1)); }); const info = { caged: caged(m, archesOf(m)), arches: archesOf(m).length, flat: mm.flat, beads: mm.beads.length }; freeMol(mm); return { info, out }; }, st, load, pick, next, setHover, takePick, chooseTerm, chooseHom, showHoms, debugTerm: i => { P.runTerm(run, P.TERMS[i].id); }, debugBare: on => { P.RULE.bare = on !== false; newRun(); }, debugStage: n => { meta.stage = n; if (n < 2) run.noGear = true; }, debugRound: n => { run.round = n; run.beaten = n - 1; showPicks(); }, meta, newRun, showSuppliers, frame, wish: () => doWish(), douse: () => doDouse(), debugKit: ids => { run.gear = ids.slice(); load(); }, debugHom: id => { run.hom = id && P.HOMS[id] ? id : null; if (st.mode === 'play' || st.mode === 'move') load(); else homStand(); }, debugJar: o => { JARK.forEach(k => { if (o && o[k] != null) { meta.jar[k] = Math.max(0, Math.min(JFULL(k), o[k] | 0)); meta.hatched[k] = meta.jar[k] >= JFULL(k); } }); saveMeta(); dirty = true; return { jar: Object.assign({}, meta.jar), hatched: Object.assign({}, meta.hatched) }; }, debugFeedHom: n => { if (g && g.hom) { g.hom = Object.assign({}, g.hom, { fed: n }); dirty = true; } }, homState: () => ({ hom: g && g.hom ? Object.assign({}, g.hom) : null, wait: !!st.homWait, spots: (st.homList || []).map(q => { const sc = center.group.scale.x; return { x: C0.x + q.x * sc, z: C0.z + q.z * sc, worth: q.worth }; }), at: HOMP, jar: { water: jarOf('water'), h2: jarOf('h2') }, by: Object.assign({}, st.by), opts: homOpts.slice() }), homUse: i => { const it = (st.homList || [])[i || 0]; if (st.homWait && it) doHom(it); }, homTap: () => { if (lining() && g.hom && P.HOMS[g.hom.id].before && !st.homWait && center && center.model === g.m && P.homLit(g)) { homPre(); return true; } return false; }, homSkip: () => homSkip(), chooseHom: i => chooseHom(i), showHoms: () => showHoms(),
    clashOf: m => clashOf(m || center, true), crossOf: m => crossOf(m || center), partsScr: () => { const b = molScr(center); if (!b) return null; const bx = new T.Box3(), v = new T.Vector3(); (st.flyers || []).forEach(f => { if (!f.grp || !f.grp.visible || !f.real) return; let op = 1; if (f.real.mats && f.real.mats[0]) op = f.real.mats[0].opacity; if (op < 0.25) return; bx.setFromObject(f.grp); if (bx.isEmpty()) return; for (let i = 0; i < 8; i++) { v.set(i & 1 ? bx.max.x : bx.min.x, i & 2 ? bx.max.y : bx.min.y, i & 4 ? bx.max.z : bx.min.z).project(cam); const x = (v.x + 1) * 640, y = (1 - v.y) * 360; b[0] = Math.min(b[0], Math.round(x)); b[2] = Math.max(b[2], Math.round(x)); b[1] = Math.min(b[1], Math.round(y)); b[3] = Math.max(b[3], Math.round(y)); } }); return b; },
    bondScr: mm => { const m = mm || center, L = [], v = new T.Vector3(); if (!m) return null; m.group.updateMatrixWorld(); m.sticks.forEach(q => { if (q.rung || q.vis === false || q.a.el === 'H' || q.b.el === 'H' || q.a.bead || q.b.bead || q.kfree) return; const ba = m.balls.get(q.a), bb = m.balls.get(q.b); if (!ba || !bb || ba.mesh.scale.x < 0.3 * ba.R || bb.mesh.scale.x < 0.3 * bb.R) return; ba.mesh.getWorldPosition(v).project(cam); const ax = v.x * 640, ay = v.y * 360; bb.mesh.getWorldPosition(v).project(cam); L.push(Math.hypot(v.x * 640 - ax, v.y * 360 - ay)); }); if (L.length < 2) return { n: L.length, hi: 1, lo: 1 }; const s2 = L.slice().sort((a, b) => a - b), md = s2[s2.length >> 1] || 1; return { n: L.length, hi: +(s2[s2.length - 1] / md).toFixed(2), lo: +(s2[0] / md).toFixed(2), px: Math.round(md) }; }, homeScr: () => { const R = playRect(), v = new T.Vector3(), c = [[R[0], R[1]], [R[2], R[1]], [R[2], R[3]], [R[0], R[3]]].map(q => { v.set(q[0], 0.45, q[1]).project(cam); return [(v.x + 1) * 640, (1 - v.y) * 360]; }); return [Math.round(Math.max(c[0][0], c[3][0])), Math.round(Math.max(c[0][1], c[1][1])), Math.round(Math.min(c[1][0], c[2][0])), Math.round(Math.min(c[2][1], c[3][1]))]; }, molScr: m => molScr(m || center), knotSet: v => { KNOT.mode = v; return KNOT; }, knotState: () => ({ mode: KNOT.mode, err: KNOT.err || null, kn: center && center.kn ? { names: center.kn.names, placed: !!center.kn.placed, n: center.kn.set.size } : null }), clashStat: z => { const o = Object.assign({}, DCL.stat); if (z) Object.keys(DCL.stat).forEach(q => { DCL.stat[q] = 0; }); return o; }, clashSet: o => Object.assign(DCL, o), layJob: (model, o, fresh) => layJob(model, o, fresh), card: (n, sig, ms) => cardShow(n, sig, ms), sigSet: ids => { Object.keys(P.SIGILS).forEach(k => { P.RULE.sigil[k] = false; }); (ids || []).forEach(k => { if (P.SIGILS[k]) P.RULE.sigil[k] = true; }); if (run) run.sigils = (ids || []).slice(0, 3); P.sigSync(run); dirty = true; return P.sigilsOf(run); }, sigState: () => ({ held: run ? P.sigilsOf(run) : [], hits: SIGC.hits.map(h => h.ids.join('+')), trail: g ? g.trail.map(r => (r.id || r.kind || '?') + (r.sig ? '*' + [].concat(r.sig).join('+') : '')) : [] }), sigGlyph, layGrab: () => { const m = LAYJ.prev; if (!m) return null; const cv0 = center && center.group.visible; if (center) center.group.visible = false; m.group.visible = true; ren.render(scene, cam); const d = cv.toDataURL('image/jpeg', 0.92); m.group.updateMatrixWorld(); let x0 = 9, x1 = -9, y0 = 9, y1 = -9; m.balls.forEach(b => { const w = b.mesh.getWorldPosition(new T.Vector3()).project(cam); x0 = Math.min(x0, w.x); x1 = Math.max(x1, w.x); y0 = Math.min(y0, -w.y); y1 = Math.max(y1, -w.y); }); m.group.visible = false; if (center) center.group.visible = cv0; return { d, box: [(x0 + 1) / 2, (y0 + 1) / 2, (x1 + 1) / 2, (y1 + 1) / 2] }; }, layJobEnd: () => { if (LAYJ.prev) freeMol(LAYJ.prev); LAYJ.prev = null; }, layFeed: (smi, rd, rack) => { run.round = rd; run.beaten = rd - 1; if (rack) run.rack = rack.slice(); run.feed = P.salt(P.modelOf(smi)); run.brief = 'plain'; run.kin = P.kinOf(smi); run.quota = P.runQuota(run, smi, 'plain'); load(); return g; },
    debugLayOf: (model, keep) => { const mm = buildMol(model, null, false), hv = []; mm.balls.forEach((b, a) => { if (a.el !== 'H') hv.push(a); }); let ov = 9, bl = 0, op = null, bp = null; const bonded = new Set(); mm.sticks.forEach(q => { bonded.add(q.a.id + '_' + q.b.id); bonded.add(q.b.id + '_' + q.a.id); if (q.a.el === 'H' || q.b.el === 'H' || q.rung) return; const A = mm.at.get(q.a), B = mm.at.get(q.b), r = A.distanceTo(B) / FL.L; if (r > bl) { bl = r; bp = [hv.indexOf(q.a), hv.indexOf(q.b)]; } });
      for (let i = 0; i < hv.length; i++) for (let j = i + 1; j < hv.length; j++) { const A = mm.at.get(hv[i]), B = mm.at.get(hv[j]), d = Math.hypot(A.x - B.x, (A.z - B.z) * 0.87) / (radOf(hv[i]) + radOf(hv[j])); if (d < ov) { ov = d; op = [i, j, hv[i].el, hv[j].el]; } }
      const out = { ov: +ov.toFixed(2), bl: +bl.toFixed(2), op, bp, n: hv.length, fl: !!mm.fl, rows: mm.fl ? mm.fl.rows : 0, w: mm.box ? +mm.box.w.toFixed(1) : 0, d: mm.box ? +mm.box.d.toFixed(1) : 0 }; if (keep) out.pts = hv.map(a => [a.el, +mm.at.get(a).x.toFixed(2), +mm.at.get(a).z.toFixed(2)]); freeMol(mm); return out; },
    stainCheck: n => { let worst = -9, count = 0; for (let i = 0; i < (n || 50); i++) { const L = stainSet(1000 + i * 7919, (i % 9) / 8); L.forEach(q => { worst = Math.max(worst, q.pen); count++; }); } return { pages: n || 50, stains: count, worstInside: +worst.toFixed(3) }; },
    titleGo, titleOn: () => title.on, doReroll, doSkip, shopAct: k => (k === 'shelf' ? shopShelf() : k === 'bad' ? shopBad(shopObj('bell')) : null), shopState: () => shopB && { objs: shopB.objs.map(o => [o.kind, o.price, o.pays || 0]), coins: run.coins }, benchKit: () => { st.gear = run.gear.slice(); buildKit(); }, stepLog: () => SL.log, debugCam: () => cam, measure: () => { const m = center; if (!m || !m.balls) return null; m.group.updateMatrixWorld(true); const sc = m.group.scale.x, pts = [], v = new T.Vector3(), w = new T.Vector3(), right = new T.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
      m.balls.forEach((b, a) => { if (!b.mesh.visible) return; const r = b.mesh.scale.x * sc; if (r < 0.05 * sc) return; b.mesh.getWorldPosition(v); w.copy(v).addScaledVector(right, r); const p = v.clone().project(cam), q = w.project(cam); pts.push({ a, x: (p.x + 1) * 640, y: (1 - p.y) * 360, r: Math.hypot((q.x - p.x) * 640, (q.y - p.y) * 360), h: a.el === 'H' }); });
      let ov = 9, ovH = 9, op = null; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const A = pts[i], B = pts[j], d = Math.hypot(A.x - B.x, A.y - B.y) / (A.r + B.r); if (A.h || B.h) { if (d < ovH) ovH = d; } else if (d < ov) { ov = d; op = [A.a.el, B.a.el, Math.round((A.x + B.x) / 2), Math.round((A.y + B.y) / 2)]; } }
      let bl = 0, bp = null, rung = 0; m.sticks.forEach(q => { if (!q.vis || q.len == null || q.a.el === 'H' || q.b.el === 'H') return; const r = q.len / FL.L; if (q.rung) rung = Math.max(rung, r); if (r > bl) { bl = r; bp = [q.a.el, q.b.el]; } });
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; pts.forEach(p => { x0 = Math.min(x0, p.x - p.r); x1 = Math.max(x1, p.x + p.r); y0 = Math.min(y0, p.y - p.r); y1 = Math.max(y1, p.y + p.r); });
      return { ov: +ov.toFixed(3), ovH: +ovH.toFixed(3), op, bl: +bl.toFixed(3), bp, rung: +rung.toFixed(2), n: pts.length, box: [Math.round(x0), Math.round(x1), Math.round(y0), Math.round(y1)] }; },
    playRect: () => playRect(), inPlay: () => { const q = seenIn(center); return q ? { out: +q.out.toFixed(1), box: q.box.map(Math.round), play: q.play.map(Math.round) } : null; },
    speedAt: () => (SHP ? SHP.speed : BENCHV ? { x: 15.6, z: 17.0 } : null), keepClear: () => keepClear(),
    debugG: () => g, debugCenter: () => center, debugMorph2: () => morph, debugSelf: ids => { run.self = ids.slice(); }, setOff, fire: doFire, unqueue: doUnqueue, spots: () => ({ fire: FIREP(), bank: BANK, draw: DRAW, step: STEP, lab: LAB.slice(), reroll: REROLL, skip: SKIP, held: [0, 1, 2, 3, 4].map(HELD) }), bank: doBank, redraw: doRedraw, reroll: doReroll, redrawPair: doPair, debugCoined: v => { meta.coined = !!v; dirty = true; }, skip: doSkip, bin: doBin, debugCoins: n => { run.coins = n; dirty = true; }, turn: doTurn, twist: doTwist, canTwist: () => !!twistOpt(), debugTip: id => { st.tip = id; dirty = true; }, debugRack: ids => { run.rack = ids.slice(); load(); }, debugFeed: smi => { run.feed = P.salt(P.modelOf(smi)); run.brief = 'plain'; run.kin = P.kinOf(smi); run.quota = P.runQuota(run, smi, 'plain'); load(); },
    openSupplier, meta, debugGear: ids => { run.gear = ids.slice(); run.noGear = false; }, debugRun: () => run,
    chooseBrief,
    state: () => (!g || st.mode === 'pick' || st.mode === 'shop' || st.mode === 'brief' || st.mode === 'terms' || st.mode === 'hom' ? { mode: st.mode, hom: run.hom || null, briefs: briefs.map(b => b.brief + ':' + b.quota + ':' + (b.pays || '')), pair: briefs.map(b => ({ src: b.src, ease: b.ease, coins: b.coins || 0, quota: b.quota })), pairCost: P.pairCost(run), coined: !!meta.coined, pairAt: PAIR, pairX: briefs.map((b, i) => BX(i)), assay: P.assayOf(run), round: run.round, beaten: run.beaten, picks: picks.map(o => o.kind + ':' + o.id), coins: run.coins || 0, rerollCost: P.rerollCost(run), gear: run.gear.slice(), rack: run.rack.slice(), credit: meta.credit, tier: meta.tier } : { mode: st.mode, queue: (g.queue || []).slice(), lining: lining(), firing: !!st.firing, room: P.stepsOf(g) - g.pageSteps, will: st.view ? st.view.kinds.slice() : [], casc: g.casc || 0, self: (g.self || []).slice(), charged: P.charged(g), fork: !!g.chain && st.mode === 'play', canBank: st.mode === 'play' && P.canBank(g), bankGain: P.canBank(g) ? P.bankGain(g) : 0, canRedraw: st.mode === 'play' && P.canRedraw(g), stuck: stuck(), left: Object.assign({}, g.left), rack: (g.rackIds || []).slice(), heavy: P.heavy(g.m), brief: g.brief, round: run.round, beaten: run.beaten, page: g.page, steps: g.pageSteps, offer: g.kinds.slice(), usable: slots.map((s, i) => (s && s.o ? i : -1)).filter(i => i >= 0), conts: slots.map((s, i) => (s && s.o && s.o.cont && g.cur.path.length > 0 ? i : -1)).filter(i => i >= 0), made: P.made(g), coins: run.coins || 0, marks: P.runMarks(st.quota), gear: st.gear.slice(), rare: Object.assign({}, g.rare), places: g.P, rowNum: g.R, extra: g.E, times: P.mult(g), row: g.cur.path.length, best: g.best, quota: st.quota, pass: st.pass, won: !!st.won, call: st.call && st.call.text }) };
  AA.rxScheme.benchBoxes = benchBoxes; AA.rxScheme.profile = () => ({ from: PROF.from, older: PROF.older, noSave: PROF.noSave, stage: P.stageOf(meta), earn: A20.earn ? A20.earn.list.map(q => q.id + ':' + q.gives + ':' + (q.thing || q.credit)) : null, err: A20.err || null }); AA.rxScheme.profileSave = () => saveMeta(); AA.rxScheme.jarBack = v => { JARK.forEach(k => { jars[k].back = v === 1; jars[k].front = v === 2; }); }; AA.rxScheme.slotIds = () => slots.map(q => (q ? q.id : null)); AA.rxScheme.jumpShow = id => { if (!homObj || !center) return false; st.homAct = { t: performance.now(), to: { x: C0.x, z: C0.z }, id }; const jj = jumpPlan(id, { x: C0.x + 1.5, z: C0.z + 1.2 }); if (jj) st.homAct.j = jj; return jj ? Math.round(jj.W + jj.J + jj.D + jj.B + jj.L) : 0; }; AA.rxScheme.actShow = id => { st.homAct = { t: performance.now(), to: actTo(id, { x: C0.x, z: C0.z }), id }; actStart(id); }; AA.rxScheme.jarDrop = k => { if (jars[k]) jars[k].born = performance.now(); }; AA.rxScheme.bz = () => BZ;
  AA.rxScheme.marginE = measureE; AA.rxScheme.pageE = PGE;
  size(); newRun(); requestAnimationFrame(frame);
}
const el = root.document && document.getElementById('schemeapp');
if (el) { const boot = () => start(el); if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('40px Marker'), document.fonts.load('40px Hand')]).then(boot, boot); else boot(); }
})(window);
