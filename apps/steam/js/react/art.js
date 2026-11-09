// Shared drawing helpers for the reaction game: DOM builder, colours, bottle-label diagrams, hazard diamonds.
(function (root) {
'use strict';
const AA = root.AA = root.AA || {};

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  kids.flat(3).forEach(c => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c))); });
  return el;
}
const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
const css = c => 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
const hex = c => (c[0] << 16) | (c[1] << 8) | c[2];
// a version of the band colour that stays visible on the dark hood
const bright = c => { const m = Math.max(c[0], c[1], c[2], 1), k = Math.max(1, 215 / m); return c.map(q => Math.min(255, Math.round(q * k + 30))); };

// ---------- before -> after diagrams, drawn for a white label ----------
const FRAG = {
  ene:      { a: [['C', 0, 0], ['C', 1.35, 0]], b: [[0, 1, 2]], s: [[0, -0.75, 0.6], [1, 2.1, 0.6]] },
  addO:     { a: [['C', 0, 0], ['C', 1.35, 0], ['H', 0, -1.05], ['O', 1.35, -1.1], ['H', 2.15, -1.55]], b: [[0, 1, 1], [0, 2, 1], [1, 3, 1], [3, 4, 1]], s: [[0, -0.75, 0.6], [1, 2.1, 0.6]] },
  addOanti: { a: [['C', 0, 0], ['C', 1.35, 0], ['O', 0, -1.1], ['H', -0.8, -1.55], ['H', 1.35, -1.05]], b: [[0, 1, 1], [0, 2, 1], [2, 3, 1], [1, 4, 1]], s: [[0, -0.75, 0.6], [1, 2.1, 0.6]] },
  addH:     { a: [['C', 0, 0], ['C', 1.35, 0], ['H', 0, -1.05], ['H', 1.35, -1.05]], b: [[0, 1, 1], [0, 2, 1], [1, 3, 1]], s: [[0, -0.75, 0.6], [1, 2.1, 0.6]] },
  addCl:    { a: [['C', 0, 0], ['C', 1.35, 0], ['H', 0, -1.05], ['Cl', 1.35, -1.2]], b: [[0, 1, 1], [0, 2, 1], [1, 3, 1]], s: [[0, -0.75, 0.6], [1, 2.1, 0.6]] },
  ol:       { a: [['C', 0.6, 0], ['H', -0.2, -0.8], ['O', 1.4, -0.85], ['H', 2.25, -0.5]], b: [[0, 1, 1], [0, 2, 1], [2, 3, 1]], s: [[0, -0.15, 0.65], [0, 1.35, 0.65]] },
  cl:       { a: [['C', 0.6, 0], ['H', -0.2, -0.8], ['Cl', 1.5, -0.9]], b: [[0, 1, 1], [0, 2, 1]], s: [[0, -0.15, 0.65], [0, 1.35, 0.65]] },
  one:      { a: [['C', 0.6, 0], ['O', 0.6, -1.2]], b: [[0, 1, 2]], s: [[0, -0.15, 0.65], [0, 1.35, 0.65]] }
};
const RAD = { H: 4.2, C: 7, O: 6.6, Cl: 8 };
const FILL = { H: '#ffffff', C: '#454b57', O: '#e23b2e', Cl: '#2aa85c' };
function drawFrag(x, f, cx, cy, u) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  f.a.forEach(q => { x0 = Math.min(x0, q[1]); x1 = Math.max(x1, q[1]); y0 = Math.min(y0, q[2]); y1 = Math.max(y1, q[2]); });
  f.s.forEach(q => { x0 = Math.min(x0, q[1]); x1 = Math.max(x1, q[1]); y1 = Math.max(y1, q[2]); });
  const px = q => cx + (q - (x0 + x1) / 2) * u, py = q => cy + (q - (y0 + y1) / 2) * u, k = u / 17;
  x.lineCap = 'round';
  f.s.forEach(q => { x.strokeStyle = '#a9adb5'; x.lineWidth = 3 * k; x.beginPath(); x.moveTo(px(f.a[q[0]][1]), py(f.a[q[0]][2])); x.lineTo(px(q[1]), py(q[2])); x.stroke(); });
  f.b.forEach(q => {
    const A = f.a[q[0]], B = f.a[q[1]], ax = px(A[1]), ay = py(A[2]), bx = px(B[1]), by = py(B[2]);
    const L = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / L * 2.7 * k, ny = (bx - ax) / L * 2.7 * k;
    x.strokeStyle = '#1d2026'; x.lineWidth = (q[2] === 2 ? 2.4 : 3) * k;
    (q[2] === 2 ? [-1, 1] : [0]).forEach(s => { x.beginPath(); x.moveTo(ax + nx * s, ay + ny * s); x.lineTo(bx + nx * s, by + ny * s); x.stroke(); });
  });
  f.a.forEach(q => {
    x.fillStyle = FILL[q[0]] || '#888'; x.strokeStyle = '#1d2026'; x.lineWidth = 1.6 * k;
    x.beginPath(); x.arc(px(q[1]), py(q[2]), (RAD[q[0]] || 6) * k, 0, 6.3); x.fill(); x.stroke();
  });
}
function drawCardArt(cv, card, dim) {
  const dpr = Math.min(root.devicePixelRatio || 1, 2), w = cv.clientWidth || 180, hh = cv.clientHeight || 70;
  cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr);
  const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, hh);
  x.globalAlpha = dim ? 0.3 : 1;
  const u = Math.min(19, w / 10.5, hh / 3.6);
  drawFrag(x, FRAG[card.from] || FRAG.ene, w * 0.23, hh / 2, u);
  drawFrag(x, FRAG[card.to] || FRAG.ene, w * 0.77, hh / 2, u);
  x.strokeStyle = '#111'; x.fillStyle = '#111'; x.lineWidth = 3; x.lineCap = 'butt';
  const ax = w * 0.5, ay = hh / 2;
  x.beginPath(); x.moveTo(ax - 15, ay); x.lineTo(ax + 8, ay); x.stroke();
  x.beginPath(); x.moveTo(ax + 16, ay); x.lineTo(ax + 6, ay - 6.5); x.lineTo(ax + 6, ay + 6.5); x.closePath(); x.fill();
  x.globalAlpha = 1;
}

// ---------- hazard diamonds: red square on its point, white fill, black symbol ----------
const SYM = {
  flame: '<path d="M16 6c1 4-4 6-4 11a4.6 4.6 0 0 0 9.2 0c0-2-1-3-1.4-4.6-1 .9-1.5 1.8-1.7 2.8-.6-3-1.2-6.200-2.100-9.200z"/><rect x="10" y="23.500" width="12" height="1.800"/>',
  oxid: '<circle cx="16" cy="19.500" r="4" fill="none" stroke="#111" stroke-width="1.800"/><path d="M16 5.500c.8 3-2.600 4.300-2.600 7.600a2.900 2.900 0 0 0 5.800 0c0-1.400-.7-2.200-1-3.300-.5.6-.8 1.100-.9 1.700-.4-2.100-.7-4-1.300-6z"/><rect x="10" y="24.500" width="12" height="1.600"/>',
  corr: '<path d="M8 8h7v2.200h-1.600l-1.200 2.300h-1.400l-1.200-2.300H8z"/><path d="M17 8h7v2.200h-1.600l-1.200 2.300h-1.400l-1.200-2.300H17z"/><circle cx="11.500" cy="15" r="1.100"/><circle cx="20.500" cy="15" r="1.100"/><rect x="7" y="18.500" width="9" height="2.200"/><path d="M17.500 21.500c2-1.800 4.500-1.800 6.500 0v1.700h-6.500z"/><rect x="7" y="23.200" width="18" height="1.500"/>',
  skull: '<path d="M16 6.500c-4 0-6.500 2.700-6.500 6.200 0 2.200 1 3.800 2.500 4.800v2.500h8v-2.500c1.500-1 2.500-2.600 2.500-4.800 0-3.500-2.500-6.200-6.500-6.200z"/><circle cx="13.300" cy="13" r="1.700" fill="#fff"/><circle cx="18.700" cy="13" r="1.700" fill="#fff"/><path d="M16 15.200l1 2.100h-2z" fill="#fff"/><path d="M8.500 21.500l15 4.500M23.500 21.500l-15 4.500" stroke="#111" stroke-width="2" stroke-linecap="round"/>',
  excl: '<path d="M14.300 6.500h3.400l-.7 12h-2z"/><circle cx="16" cy="22.800" r="2.100"/>',
  health: '<circle cx="16" cy="8.500" r="2.700"/><path d="M10 12.500h12l-1.500 7.500h-2.200l.7 6h-6l.7-6h-2.200z"/><path d="M16 13.500l1 2.300 2.500.2-1.900 1.600.6 2.400-2.200-1.300-2.200 1.300.6-2.400-1.900-1.600 2.500-.2z" fill="#fff"/>',
  cyl: '<rect x="8" y="13" width="14" height="7" rx="3.500"/><rect x="22" y="15.300" width="2.600" height="2.400"/><rect x="7" y="23" width="18" height="1.600"/>'
};
const GHS_NAME = { flame: 'Flammable', oxid: 'Oxidiser', corr: 'Corrosive', skull: 'Toxic', excl: 'Irritant', health: 'Health hazard', cyl: 'Gas under pressure' };
function ghs(kind) {
  const el = document.createElement('span');
  el.className = 'ghs'; el.title = GHS_NAME[kind] || kind;
  el.innerHTML = '<svg viewBox="-6 -6 44 44" width="100%" height="100%" aria-hidden="true"><rect x="2" y="2" width="28" height="28" fill="#fff" stroke="#d81e1e" stroke-width="3.200" transform="rotate(45 16 16)"/><g fill="#111">' + (SYM[kind] || SYM.excl) + '</g></svg>';
  return el;
}

AA.rxArt = { h, rgba, css, hex, bright, drawCardArt, ghs, GHS_NAME };
})(typeof globalThis !== 'undefined' ? globalThis : window);
