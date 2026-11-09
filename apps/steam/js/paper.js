(function (root) {
'use strict';
const AA = root.AA = root.AA || {};

// Instrument printouts: ink traces on graph paper, drawn left to right like a pen plotter.
//   draw(canvas, kind, data, { quality, progress, seed, overlay })
// `data` is a spectrum from AA.spectra (already degraded for a quick scan). `overlay` is the player's own
// structure's spectrum, drawn in red pencil on top.
const INK = '#1c2230', FAINT = '#8a7f66', PENCIL = '#b03a2e', MARK = 'rgba(240,207,74,.55)';
const FONT = '12px "Plex Mono", ui-monospace, monospace';

function rng(seed) { let a = seed | 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function setup(cv, progress) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth || 520, h = cv.clientHeight || 210;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
  const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, h); x.font = FONT;
  return { x, w, h, p: progress === undefined ? 1 : progress };
}
function axis(x, w, h, m, ticks, title, mapX) {
  x.strokeStyle = INK; x.fillStyle = FAINT; x.lineWidth = 1.2; x.textAlign = 'center';
  x.beginPath(); x.moveTo(m.l, h - m.b); x.lineTo(w - m.r, h - m.b); x.stroke();
  ticks.forEach(t => { const px = mapX(t); x.beginPath(); x.moveTo(px, h - m.b); x.lineTo(px, h - m.b + 5); x.stroke(); x.fillText(String(t), px, h - m.b + 17); });
  x.fillStyle = INK; x.font = '11px "Plex Mono", monospace'; x.fillText(title, (m.l + w - m.r) / 2, h - 5); x.font = FONT;
}
function clip(x, w, h, p) { x.save(); x.beginPath(); x.rect(0, 0, Math.max(1, w * p), h); x.clip(); }

// ---------- mass spectrum ----------
function drawMS(cv, d, o) {
  const { x, w, h, p } = setup(cv, o.progress), m = { l: 14, r: 12, t: 22, b: 36 }, ms = d.ms;
  const maxMz = Math.max(ms.M + 6, 20), mapX = v => m.l + (v / maxMz) * (w - m.l - m.r), mapY = r => h - m.b - (r / 100) * (h - m.t - m.b);
  const step = maxMz > 130 ? 20 : maxMz > 70 ? 10 : 5, ticks = []; for (let t = 0; t <= maxMz; t += step) ticks.push(t);
  axis(x, w, h, m, ticks, 'm/z', mapX);
  clip(x, w, h, p);
  if (o.quality === 'quick') { const r = rng(o.seed); for (let i = 0; i < 16; i++) { const mz = 2 + r() * (maxMz - 4), hh = 1 + r() * 3.5; x.strokeStyle = FAINT; x.lineWidth = 1.5; x.beginPath(); x.moveTo(mapX(mz), mapY(0)); x.lineTo(mapX(mz), mapY(hh)); x.stroke(); } }
  ms.peaks.forEach(pk => {
    const px = mapX(pk.mz);
    if (pk.mz === ms.M) { x.fillStyle = MARK; x.fillRect(px - 14, mapY(pk.rel) - 20, 28, 15); }
    x.strokeStyle = INK; x.lineWidth = 2.2; x.beginPath(); x.moveTo(px, mapY(0)); x.lineTo(px, mapY(pk.rel)); x.stroke();
    if (pk.rel >= 12 || pk.mz === ms.M) { x.fillStyle = INK; x.textAlign = 'center'; x.fillText(String(pk.mz), px, mapY(pk.rel) - 7); }
  });
  if (o.overlay) o.overlay.ms.peaks.forEach(pk => { const px = mapX(pk.mz) + 3.5; x.strokeStyle = PENCIL; x.lineWidth = 1.6; x.setLineDash([3, 2]); x.beginPath(); x.moveTo(px, mapY(0)); x.lineTo(px, mapY(pk.rel)); x.stroke(); x.setLineDash([]); });
  x.restore();
}

// ---------- infrared ----------
function irCurve(ir, quality, seed) {
  const pts = AA.spectra.irCurve(ir.peaks || [], 520);
  if (quality === 'quick') { const r = rng(seed); return pts.map(q => [q[0], Math.max(2, Math.min(99, q[1] + (r() - 0.5) * 5))]); }
  return pts;
}
function drawIR(cv, d, o) {
  const { x, w, h, p } = setup(cv, o.progress), m = { l: 14, r: 12, t: 16, b: 36 };
  const mapX = v => m.l + ((4000 - v) / 3500) * (w - m.l - m.r), mapY = t => m.t + ((100 - t) / 100) * (h - m.t - m.b);
  axis(x, w, h, m, [4000, 3500, 3000, 2500, 2000, 1500, 1000, 500], 'wavenumber, cm-1', mapX);
  clip(x, w, h, p);
  const line = (curve, col, wd, dash) => { x.strokeStyle = col; x.lineWidth = wd; x.setLineDash(dash || []); x.beginPath(); curve.forEach((q, i) => { const px = mapX(q[0]), py = mapY(q[1]); i ? x.lineTo(px, py) : x.moveTo(px, py); }); x.stroke(); x.setLineDash([]); };
  if (d.ir.silent) {
    line([[4000, 97], [500, 97]], INK, 1.8); x.fillStyle = INK; x.textAlign = 'center'; x.fillText('flat line: no absorption in this range', w / 2, h / 2);
  } else {
    const curve = irCurve(d.ir, o.quality, o.seed); line(curve, INK, 1.7);
    const marked = [];
    d.ir.peaks.slice().sort((a, b) => b.amp - a.amp).forEach(pk => {
      if (marked.some(c => Math.abs(c - pk.centre) < 150)) return; marked.push(pk.centre);
      const t = curve.reduce((b, q) => Math.abs(q[0] - pk.centre) < Math.abs(b[0] - pk.centre) ? q : b)[1];
      x.fillStyle = INK; x.textAlign = 'center'; x.fillText(String(pk.centre), mapX(pk.centre), Math.min(h - m.b - 4, mapY(t) + 15));
    });
  }
  if (o.overlay) { const mine = o.overlay; if (mine.ir.silent) line([[4000, 94], [500, 94]], PENCIL, 1.6, [4, 3]); else line(AA.spectra.irCurve(mine.ir.peaks, 520), PENCIL, 1.6, [4, 3]); }
  x.restore();
}

// ---------- hydrogen NMR ----------
const PASCAL = { s: [1], d: [1, 1], t: [1, 2, 1], q: [1, 3, 3, 1] };
function drawNMR(cv, d, o) {
  const { x, w, h, p } = setup(cv, o.progress), m = { l: 14, r: 14, t: 30, b: 40 };
  const mapX = v => m.l + ((12 - v) / 12) * (w - m.l - m.r), base = h - m.b, top = m.t;
  axis(x, w, h, m, [12, 10, 8, 6, 4, 2, 0], 'shift, ppm', mapX);
  clip(x, w, h, p);
  const peaks = d.nmr.peaks, maxHs = Math.max(1, ...peaks.map(q => q.hs)), pxPerPpm = (w - m.l - m.r) / 12;
  const draw = (q, col, wd, dash, yoff) => {
    const full = (base - top) * (0.3 + 0.7 * q.hs / maxHs), cx = mapX(q.shift);
    x.strokeStyle = col; x.lineWidth = wd; x.setLineDash(dash || []);
    if (o.quality === 'quick' || q.mult === 'm') {
      x.beginPath(); for (let i = -26; i <= 26; i++) { const px = cx + i * 1.2, py = base - full * (q.mult === 'm' ? 0.62 : 0.9) * Math.exp(-(i * i) / (q.mult === 'm' ? 220 : 90)) - yoff; i === -26 ? x.moveTo(px, py) : x.lineTo(px, py); } x.stroke();
    } else {
      const co = PASCAL[q.mult] || [1], sp = Math.max(7, 0.09 * pxPerPpm), mx = Math.max.apply(null, co);
      co.forEach((c, i) => { const px = cx + (i - (co.length - 1) / 2) * sp; x.beginPath(); x.moveTo(px, base - yoff); x.lineTo(px, base - yoff - full * c / mx * (q.exchangeable ? 0.55 : 1)); x.stroke(); });
    }
    x.setLineDash([]); return { full, cx };
  };
  peaks.forEach(q => {
    const r = draw(q, INK, 2, null, 0);
    x.fillStyle = INK; x.textAlign = 'center'; x.fillText(q.hs + 'H' + (o.quality === 'quick' ? '' : ' ' + (q.exchangeable ? 'br ' : '') + q.mult), r.cx, base - r.full - 8);
    x.fillStyle = FAINT; x.font = '10px "Plex Mono", monospace'; x.fillText(q.shift.toFixed(1), r.cx, base + 28); x.font = FONT;
  });
  if (o.overlay) o.overlay.nmr.peaks.forEach(q => draw(q, PENCIL, 1.5, [4, 3], 0));
  x.restore();
}

AA.paper = { draw(cv, kind, data, o) { o = o || {}; if (kind === 'ms') drawMS(cv, data, o); else if (kind === 'ir') drawIR(cv, data, o); else drawNMR(cv, data, o); } };
})(typeof globalThis !== 'undefined' ? globalThis : window);
