// Overreact's own lettering. Every letter is a few pen strokes written out below. Nothing here is a font file.
// One hand in two weights: heavy (a loaded brush: numbers, the four words) and thin (a quick pen: names). Same glyphs, same slant, same x-height.
// Each stroke is a filled outline whose width swells and tapers (real start and end), and a whole string is one fill, so
// there is no doubling and a see-through color does not darken where strokes cross. Every glyph varies a little in size,
// tilt and baseline, seeded by the glyph and its place, so a string looks the same every time it is drawn.
// A glyph is [advance, strokes]. A stroke is a string of commands on a grid where the baseline is 0, small letters
// are 0.6 tall and capitals are 1 tall: M x y, L x y, Q cx cy x y, and E cx cy rx ry from to (an ellipse, degrees).
(function () {
  const AA = (window.AA = window.AA || {});
  const G = {
    ' ': [0.3, ''],
    a: [0.62, 'E .28 .3 .24 .3 0 360 M .54 .6 L .54 .06 Q .55 0 .62 0'], b: [0.66, 'M .08 1 L .08 0 E .34 .3 .26 .3 0 360'], c: [0.56, 'E .32 .3 .26 .3 48 312'],
    d: [0.62, 'E .28 .3 .24 .3 0 360 M .54 1 L .54 0'], e: [0.62, 'M .07 .27 L .57 .36 E .32 .3 .26 .3 10 312'], f: [0.4, 'M .44 .92 Q .36 1.02 .26 .98 Q .18 .94 .18 .78 L .18 0 M .02 .58 L .38 .58'],
    g: [0.62, 'E .28 .3 .24 .3 0 360 M .54 .6 L .54 -.14 Q .52 -.32 .3 -.3 Q .16 -.3 .08 -.2'], h: [0.6, 'M .08 1 L .08 0 M .08 .4 Q .1 .62 .32 .6 Q .52 .58 .52 .38 L .52 0'],
    i: [0.2, 'M .1 .6 L .1 0 M .1 .84 L .1 .85'], j: [0.28, 'M .2 .6 L .2 -.14 Q .2 -.3 .02 -.28 M .2 .84 L .2 .85'], k: [0.54, 'M .08 1 L .08 0 M .48 .6 L .1 .26 L .5 0'],
    l: [0.26, 'M .1 1 L .1 .12 Q .1 0 .24 0'], m: [0.92, 'M .08 .6 L .08 0 M .08 .4 Q .1 .62 .28 .6 Q .46 .58 .46 .38 L .46 0 M .46 .4 Q .48 .62 .66 .6 Q .84 .58 .84 .38 L .84 0'],
    n: [0.6, 'M .08 .6 L .08 0 M .08 .4 Q .1 .62 .32 .6 Q .52 .58 .52 .38 L .52 0'], o: [0.6, 'E .3 .3 .25 .3 0 360'], p: [0.66, 'M .08 .6 L .08 -.3 E .34 .3 .26 .3 0 360'],
    q: [0.62, 'E .28 .3 .24 .3 0 360 M .54 .6 L .54 -.3'], r: [0.44, 'M .08 .6 L .08 0 M .08 .34 Q .14 .62 .44 .5'], s: [0.5, 'M .44 .5 Q .3 .64 .16 .56 Q .02 .42 .24 .31 Q .5 .2 .4 .07 Q .26 -.06 .05 .1'],
    t: [0.46, 'M .22 .98 L .2 .16 Q .2 0 .46 .1 M -.02 .6 L .48 .66'], u: [0.6, 'M .08 .6 L .08 .22 Q .08 0 .3 0 Q .5 .02 .52 .3 M .52 .6 L .52 0'], v: [0.56, 'M .04 .6 L .28 0 L .52 .6'],
    w: [0.76, 'M .04 .6 L .2 0 L .38 .5 L .56 0 L .72 .6'], x: [0.52, 'M .04 .6 L .48 0 M .48 .6 L .04 0'], y: [0.58, 'M .05 .6 L .06 .26 Q .1 0 .32 .02 Q .5 .06 .54 .3 M .54 .6 L .5 -.12 Q .44 -.32 .08 -.28'], z: [0.58, 'M .06 .6 L .5 .6 L .06 0 L .52 0'],
    A: [0.68, 'M .04 0 L .34 1 L .64 0 M .16 .36 L .52 .36'], B: [0.72, 'M .08 0 L .08 1 L .34 1 Q .58 1 .58 .76 Q .58 .54 .34 .52 L .08 .52 M .34 .52 Q .64 .5 .64 .26 Q .64 0 .36 0 L .08 0'],
    C: [0.76, 'E .4 .5 .34 .5 50 310'], D: [0.78, 'M .08 0 L .08 1 L .3 1 Q .7 1 .7 .5 Q .7 0 .3 0 L .08 0'], E: [0.64, 'M .56 1 L .08 1 L .08 0 L .58 0 M .08 .52 L .48 .52'],
    F: [0.6, 'M .56 1 L .08 1 L .08 0 M .08 .52 L .46 .52'], G: [0.82, 'E .4 .5 .34 .5 50 330 M .44 .44 L .74 .44 L .74 .16'], H: [0.7, 'M .08 0 L .08 1 M .62 0 L .62 1 M .08 .52 L .62 .52'],
    I: [0.2, 'M .1 0 L .1 1'], J: [0.52, 'M .44 1 L .44 .26 Q .44 0 .22 0 Q .06 0 .04 .2'], K: [0.66, 'M .08 0 L .08 1 M .6 1 L .1 .44 L .62 0'], L: [0.56, 'M .08 1 L .08 0 L .52 0'],
    M: [0.84, 'M .08 0 L .08 1 L .42 .3 L .76 1 L .76 0'], N: [0.7, 'M .08 0 L .08 1 L .62 0 L .62 1'], O: [0.8, 'E .4 .5 .34 .5 0 360'],
    P: [0.66, 'M .08 0 L .08 1 L .36 1 Q .62 1 .62 .72 Q .62 .46 .36 .46 L .08 .46'], Q: [0.8, 'E .4 .5 .34 .5 0 360 M .5 .22 L .76 -.06'],
    R: [0.7, 'M .08 0 L .08 1 L .36 1 Q .62 1 .62 .72 Q .62 .46 .36 .46 L .08 .46 M .34 .46 L .64 0'], S: [0.66, 'M .58 .84 Q .46 1.02 .28 1 Q .04 .96 .08 .74 Q .12 .56 .34 .5 Q .62 .42 .6 .22 Q .56 -.02 .3 0 Q .12 .02 .04 .18'],
    T: [0.64, 'M .02 1 L .62 1 M .32 1 L .32 0'], U: [0.72, 'M .08 1 L .08 .32 Q .08 0 .36 0 Q .64 0 .64 .32 L .64 1'], V: [0.64, 'M .02 1 L .32 0 L .62 1'],
    W: [0.88, 'M .02 1 L .22 0 L .44 .7 L .66 0 L .86 1'], X: [0.64, 'M .04 1 L .6 0 M .6 1 L .04 0'], Y: [0.64, 'M .02 1 L .32 .5 L .62 1 M .32 .5 L .32 0'], Z: [0.68, 'M .06 1 L .6 1 L .06 0 L .62 0'],
    0: [0.64, 'E .32 .5 .26 .5 0 360'], 1: [0.5, 'M .06 .74 L .3 1 L .3 0 M .1 0 L .5 0'], 2: [0.66, 'M .08 .76 Q .12 1 .32 1 Q .56 1 .56 .76 Q .56 .56 .08 0 Q .34 .06 .62 .02'],
    3: [0.66, 'M .08 .86 Q .2 1 .34 1 Q .56 1 .56 .76 Q .56 .54 .28 .52 Q .6 .5 .6 .26 Q .6 0 .32 0 Q .14 0 .06 .16'], 4: [0.66, 'M .46 0 L .46 1 L .04 .32 L .62 .32'],
    5: [0.66, 'M .56 .98 L .16 1 L .1 .56 Q .22 .64 .36 .62 Q .6 .58 .6 .3 Q .6 0 .32 0 Q .14 0 .06 .16'], 6: [0.66, 'M .5 .98 Q .1 .8 .08 .3 E .33 .3 .25 .3 0 360'],
    7: [0.64, 'M .05 .98 L .6 1 Q .42 .5 .22 0'], 8: [0.64, 'E .32 .76 .22 .24 0 360 E .32 .27 .26 .27 0 360'], 9: [0.66, 'E .31 .7 .25 .3 0 360 M .56 .7 Q .56 .2 .14 .02'],
    '.': [0.2, 'M .1 .03 L .1 .04'], ',': [0.26, 'M .13 .07 L .13 .03 Q .13 -.1 .04 -.2'], '+': [0.56, 'M .06 .42 L .5 .42 M .28 .2 L .28 .64'], '-': [0.52, 'M .08 .4 L .44 .4'], "'": [0.18, 'M .1 1 L .08 .78'],
    ':': [0.2, 'M .1 .08 L .1 .09 M .1 .5 L .1 .51'], '!': [0.2, 'M .1 1 L .1 .3 M .1 .03 L .1 .04'], '?': [0.56, 'M .06 .8 Q .1 1 .28 1 Q .5 1 .5 .78 Q .5 .6 .28 .46 L .28 .3 M .28 .03 L .28 .04'],
    '=': [0.56, 'M .06 .54 L .5 .54 M .06 .28 L .5 .28'], '>': [0.54, 'M .08 .66 L .46 .42 L .08 .18'], '<': [0.54, 'M .46 .66 L .08 .42 L .46 .18'],
    '»': [0.7, 'M .06 .56 L .28 .36 L .06 .16 M .36 .56 L .58 .36 L .36 .16'], '/': [0.44, 'M .04 0 L .4 1'], '(': [0.3, 'M .26 1.05 Q .02 .5 .26 -.1'], ')': [0.3, 'M .04 1.05 Q .28 .5 .04 -.1'],
    '%': [0.68, 'M .08 0 L .6 1 E .16 .8 .12 .16 0 360 E .52 .2 .12 .16 0 360'], '#': [0.62, 'M .2 0 L .28 1 M .42 0 L .5 1 M .04 .68 L .6 .68 M .02 .32 L .58 .32'], '→': [0.76, 'M .04 .4 L .7 .4 M .5 .58 L .7 .4 L .5 .22']
  };
  G['−'] = G['-']; G['–'] = G['-'];
  const SLANT = 0.09, CAP = 0.7, XH = 0.6, GAPS = { thin: 0.075, heavy: 0.1 }, CELL = 0.62;
  const wname = w => (w === true || w === 'heavy' || w === 'bold' ? 'heavy' : 'thin');
  // Glyph strokes become polylines once (y up, grid units). Digits are centered in one fixed cell so numbers keep their width as they count.
  const POLY = {}, ADV = {};
  const flat = (cmd) => { const out = []; let cur = null, i = 0;
    while (i < cmd.length) { const k = cmd[i++];
      if (k === 'M') { cur = [[cmd[i], cmd[i + 1]]]; out.push(cur); i += 2; }
      else if (k === 'L') { cur.push([cmd[i], cmd[i + 1]]); i += 2; }
      else if (k === 'Q') { const p0 = cur[cur.length - 1]; for (let s = 1; s <= 8; s++) { const t = s / 8, m = 1 - t; cur.push([m * m * p0[0] + 2 * m * t * cmd[i] + t * t * cmd[i + 2], m * m * p0[1] + 2 * m * t * cmd[i + 1] + t * t * cmd[i + 3]]); } i += 4; }
      else if (k === 'E') { const cx = cmd[i], cy = cmd[i + 1], rx = cmd[i + 2], ry = cmd[i + 3], a0 = cmd[i + 4], a1 = cmd[i + 5], n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 10)); cur = []; out.push(cur); for (let s = 0; s <= n; s++) { const a = (a0 + (a1 - a0) * s / n) * Math.PI / 180; cur.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } i += 6; } }
    return out; };
  // where a stroke turns sharply (more than 40 degrees) it is written as separate pieces so the outline never folds
  const corners = (st) => { const c = []; for (let i = 1; i < st.length - 1; i++) { const ax = st[i][0] - st[i - 1][0], ay = st[i][1] - st[i - 1][1], bx = st[i + 1][0] - st[i][0], by = st[i + 1][1] - st[i][1], la = Math.hypot(ax, ay), lb = Math.hypot(bx, by); if (la > 1e-6 && lb > 1e-6 && (ax * bx + ay * by) / (la * lb) < 0.766) c.push(i); } return c; };
  Object.keys(G).forEach(ch => { const cmd = G[ch][1].split(' ').filter(Boolean).map(t => (/^[MLQE]$/.test(t) ? t : parseFloat(t)));
    let pl = flat(cmd), a = G[ch][0];
    if (/[0-9]/.test(ch) && pl.length) { let lo = 9, hi = -9; pl.forEach(s => s.forEach(p => { lo = Math.min(lo, p[0]); hi = Math.max(hi, p[0]); })); const d = (CELL - (lo + hi)) / 2; pl = pl.map(s => s.map(p => [p[0] + d, p[1]])); a = CELL + 0.04; }
    POLY[ch] = pl.map(s => ({ p: s, c: corners(s) })); ADV[ch] = a; });
  const adv = (ch, g) => (ADV[ch] !== undefined ? ADV[ch] : 0.5) + g;
  // Nominal (fullest) line width. Heavy gets a little louder as the size grows: a big word is the same hand speaking up.
  const lineW = (size, w) => w === 'heavy' ? Math.max(2.4, size * (0.132 - 0.016 * Math.min(1, Math.max(0, (size - 50) / 120)))) : Math.max(1.8, size * 0.057);
  const width = (str, size, w) => { w = wname(w); let t = 0; for (const ch of String(str)) t += adv(ch, GAPS[w]); return t * size * CAP; };
  function measure(str, size, w) { w = wname(w); const u = size * CAP, lw = lineW(size, w), s = String(str); let desc = 0, asc = 0;
    for (const ch of s) { (POLY[ch] || []).forEach(st => st.p.forEach(p => { desc = Math.max(desc, -p[1]); asc = Math.max(asc, p[1]); })); }
    const aw = width(s, size, w) - GAPS[w] * u;
    return { width: aw + lw + SLANT * u * asc + 0.03 * u, w: aw + lw, ascent: asc * u + lw / 2 + 0.03 * u, descent: desc * u + lw / 2 + 0.03 * u, height: (asc + desc) * u + lw + 0.06 * u, xHeight: XH * u, cap: u, lineWidth: lw, advance: aw }; }
  // Small steady variation: a hash of the glyph, its place and the string, so the same string always looks the same
  // (nothing shimmers between frames) but two of the same letter in a word differ. Digits are seeded by the digit and its
  // place from the right, so a total that counts up keeps its other digits exactly as they were.
  const hash = n => { n = (n ^ 61) ^ (n >>> 16); n = Math.imul(n + (n << 3), 0x27d4eb2d); n ^= n >>> 15; n = Math.imul(n, 0x85ebca6b); n ^= n >>> 13; return (n >>> 0) / 4294967296; };
  const rnd = (seed, k) => hash(Math.imul(seed | 0, 2654435761) + k * 40503 + 7) * 2 - 1;
  function layout(str, w) { const s = Array.from(String(str)), n = s.length; let sh = 7; for (const ch of s) sh = (Math.imul(sh, 31) + ch.charCodeAt(0)) | 0; const out = []; let cx = 0;
    s.forEach((ch, i) => { const dg = /[0-9]/.test(ch), seed = dg ? ch.charCodeAt(0) * 977 + (n - 1 - i) * 31 : sh * 7 + i * 131 + ch.charCodeAt(0), a = adv(ch, GAPS[w]);
      out.push({ ch, x: cx + (dg ? 0 : rnd(seed, 0) * 0.012), a, seed, dg }); cx += a; });
    return { items: out, total: cx }; }
  // one glyph's pieces as pixel polylines: [{pts, len}], with the small per-glyph change applied
  function glyphPieces(it, ox, yb, u) { const out = [], v = it.dg ? 0.7 : 1, sc = 1 + 0.035 * v * rnd(it.seed, 1), tl = 0.04 * v * rnd(it.seed, 2), by = 0.014 * v * rnd(it.seed, 3), sx = 0.035 * v * rnd(it.seed, 4), sy = 0.02 * v * rnd(it.seed, 5), cxm = (it.a - 0.07) / 2, ca = Math.cos(tl), sa = Math.sin(tl);
    (POLY[it.ch] || []).forEach(st => { const P = st.p.map(q => { let x = q[0] - cxm, y = q[1] - 0.3; x += sx * y; y += sy * x; x *= sc; y *= sc; const rx = x * ca - y * sa, ry = x * sa + y * ca; const gx = rx + cxm, gy = ry + 0.3 + by; return [ox + (gx + SLANT * gy) * u, yb - gy * u]; });
      const cuts = [0].concat(st.c, [P.length - 1]); let L = 0; const cum = [0]; for (let i = 1; i < P.length; i++) { L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); cum.push(L); }
      for (let c = 0; c < cuts.length - 1; c++) out.push({ pts: P.slice(cuts[c], cuts[c + 1] + 1), s0: cum[cuts[c]], L, whole: cuts.length === 2 }); });
    return out; }
  // pen pressure along a stroke (0..1 of its length). Heavy is a loaded brush: it lands, swells, and lifts to a point.
  // Thin is a quick pen: nearly even, a light start and a flick at the end.
  const press = (f, w) => { const r = Math.min(1, f / 0.22), e = Math.min(1, (1 - f) / 0.3), sm = x => x * x * (3 - 2 * x); return w === 'heavy' ? (0.68 + 0.32 * sm(r)) * (0.5 + 0.5 * sm(e)) : (0.8 + 0.2 * sm(r)) * (0.55 + 0.45 * sm(e)); };
  // adds one filled brush outline (a stroke piece) to the current path; pts are cut at length `cut`
  function outline(ctx, pc, lw, w, cut) { let P = pc.pts, T = [P[0]], s = pc.s0, rem = cut - pc.s0;
    for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); if (d <= rem) { rem -= d; T.push(P[i]); } else { if (rem > 0.01) T.push([P[i - 1][0] + (P[i][0] - P[i - 1][0]) * rem / d, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * rem / d]); break; } }
    if (T.length < 2) return T[0];
    const R = [T[0]], q = Math.max(1.2, lw * 0.5); for (let i = 1; i < T.length; i++) { const dx = T[i][0] - T[i - 1][0], dy = T[i][1] - T[i - 1][1], n = Math.ceil(Math.hypot(dx, dy) / q); for (let k = 1; k <= n; k++) R.push([T[i - 1][0] + dx * k / n, T[i - 1][1] + dy * k / n]); }
    const m = R.length, Lft = [], Rgt = []; let acc = 0, dn = 0, dd = [0, 1];
    for (let i = 0; i < m; i++) { const a = R[Math.max(0, i - 1)], b = R[Math.min(m - 1, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; if (i) acc += Math.hypot(R[i][0] - R[i - 1][0], R[i][1] - R[i - 1][1]);
      const f = Math.min(1, (pc.s0 + acc) / pc.L), hw = Math.max(0.35, lw * 0.5 * press(f, w) * (1 + (w === 'heavy' ? 0.16 : 0.1) * dy)), nx = -dy, ny = dx; Lft.push([R[i][0] + nx * hw, R[i][1] + ny * hw]); Rgt.push([R[i][0] - nx * hw, R[i][1] - ny * hw, hw, nx, ny, dx, dy]); Lft[i].push(hw, nx, ny, dx, dy); }
    ctx.moveTo(Lft[0][0], Lft[0][1]); for (let i = 1; i < m; i++) ctx.lineTo(Lft[i][0], Lft[i][1]);
    const e = Lft[m - 1], er = e[2]; for (let k = 1; k <= 6; k++) { const th = Math.PI * k / 6; ctx.lineTo(R[m - 1][0] + er * (e[3] * Math.cos(th) + e[5] * Math.sin(th)), R[m - 1][1] + er * (e[4] * Math.cos(th) + e[6] * Math.sin(th))); }
    for (let i = m - 2; i >= 0; i--) ctx.lineTo(Rgt[i][0], Rgt[i][1]);
    const s0 = Lft[0], sr = s0[2]; for (let k = 1; k <= 6; k++) { const th = Math.PI * k / 6; ctx.lineTo(R[0][0] + sr * (-s0[3] * Math.cos(th) - s0[5] * Math.sin(th)), R[0][1] + sr * (-s0[4] * Math.cos(th) - s0[6] * Math.sin(th))); }
    ctx.closePath(); return T[T.length - 1]; }
  // Draws a string. o: { weight 'heavy'|'thin', color, align 'left'|'center'|'right', t 0..1 (how much is written so far),
  // base 'alphabetic'|'middle'|'top', extra (added width, for a knockout under text), alpha }. Returns the pen tip {x, y}.
  function write(ctx, str, x, y, size, o) { o = o || {}; const w = wname(o.weight), al = o.align || 'left', bl = o.base || 'alphabetic', t = o.t === undefined ? 1 : o.t, u = size * CAP, lw = lineW(size, w);
    const lay = layout(str, w), adw = (lay.total - GAPS[w]) * u, x0 = al === 'center' ? x - adw / 2 : al === 'right' || al === 'end' ? x - adw : x, yb = bl === 'middle' ? y + size * 0.26 : bl === 'top' ? y + size * 0.74 : y;
    let tip = { x: x0, y: yb }; if (t <= 0) return tip;
    const pcs = [], dots = []; let tot = 0;
    lay.items.forEach(it => glyphPieces(it, x0 + it.x * u, yb, u).forEach(pc => { pc.dot = pc.L < 0.04 * u; if (pc.dot) { pc.w = 0.05 * size; dots.push(pc); } else { pc.w = pc.pts.length > 1 ? Math.hypot(pc.pts[pc.pts.length - 1][0] - pc.pts[0][0], pc.pts[pc.pts.length - 1][1] - pc.pts[0][1]) * 0 + pc.pts.reduce((a, p, i) => a + (i ? Math.hypot(p[0] - pc.pts[i - 1][0], p[1] - pc.pts[i - 1][1]) : 0), 0) : 0; } pcs.push(pc); tot += pc.w; }));
    let left = t >= 1 ? Infinity : t * tot; const col = o.color || ctx.fillStyle;
    ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = col; if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha; ctx.beginPath();
    for (const pc of pcs) { if (left <= 0) break; if (pc.dot) { const r = lw * 0.6, p = pc.pts[0]; ctx.moveTo(p[0] + r, p[1]); ctx.arc(p[0], p[1], r, 0, 6.3); tip = { x: p[0], y: p[1] }; left -= pc.w; continue; }
      const tp = outline(ctx, pc, lw, w, pc.s0 + Math.min(left, pc.w)); if (tp) tip = { x: tp[0], y: tp[1] }; left -= pc.w; }
    if (o.extra) { ctx.lineJoin = 'round'; ctx.lineWidth = o.extra; ctx.stroke(); } ctx.fill(); ctx.restore(); return tip; }
  // Replaces the text calls of one canvas context. The size and weight come from the last hand() / marker() call (set).
  // fillText writes the string; strokeText is the page's paper-colored knockout, drawn as the same strokes slightly fatter.
  function install(ctx) {
    if (ctx.__pen) return; ctx.__pen = { size: 20, heavy: false };
    const go = (str, x, y, col, extra) => { const P = ctx.__pen; write(ctx, str, x, y, P.size, { weight: P.heavy ? 'heavy' : 'thin', color: col, align: ctx.textAlign, base: ctx.textBaseline, extra: extra }); };
    ctx.fillText = (str, x, y) => go(str, x, y, ctx.fillStyle, 0);
    ctx.strokeText = (str, x, y) => go(str, x, y, ctx.strokeStyle, Math.min(ctx.lineWidth, ctx.__pen.size * 0.14));
    ctx.measureText = str => ({ width: measure(str, ctx.__pen.size, ctx.__pen.heavy ? 'heavy' : 'thin').advance });
  }
  AA.rxPen = { install, width: (s, n, w) => measure(s, n, w).advance, measure, write, INK: '#2b2420', slant: SLANT, lineWidth: (n, w) => lineW(n, wname(w)),
    set: (ctx, size, heavy) => { install(ctx); ctx.__pen.size = size; ctx.__pen.heavy = !!heavy; } };
})();
