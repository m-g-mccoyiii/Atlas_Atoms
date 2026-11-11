// Overreact's own lettering. Every letter is a few pen strokes written out below, drawn with a broad nib: the pen is
// put down twice a little apart, which gives thick and thin the way a cut quill does. Nothing here is a font file.
// A glyph is [advance, strokes]. A stroke is a string of commands on a grid where the baseline is 0, small letters
// are 0.6 tall and capitals are 1 tall: M x y, L x y, Q cx cy x y, and E cx cy rx ry from to (an ellipse, degrees).
(function () {
  const AA = (window.AA = window.AA || {});
  const G = {
    ' ': [0.3, ''],
    a: [0.62, 'E .28 .3 .24 .3 0 360 M .54 .6 L .54 .06 Q .55 0 .62 0'], b: [0.66, 'M .08 1 L .08 0 E .34 .3 .26 .3 0 360'], c: [0.56, 'E .32 .3 .26 .3 48 312'],
    d: [0.62, 'E .28 .3 .24 .3 0 360 M .54 1 L .54 0'], e: [0.62, 'M .07 .32 L .56 .32 E .32 .3 .26 .3 4 312'], f: [0.4, 'M .44 .92 Q .36 1.02 .26 .98 Q .18 .94 .18 .78 L .18 0 M .02 .58 L .38 .58'],
    g: [0.62, 'E .28 .3 .24 .3 0 360 M .54 .6 L .54 -.14 Q .52 -.32 .3 -.3 Q .16 -.3 .08 -.2'], h: [0.6, 'M .08 1 L .08 0 M .08 .4 Q .1 .62 .32 .6 Q .52 .58 .52 .38 L .52 0'],
    i: [0.2, 'M .1 .6 L .1 0 M .1 .84 L .1 .85'], j: [0.28, 'M .2 .6 L .2 -.14 Q .2 -.3 .02 -.28 M .2 .84 L .2 .85'], k: [0.54, 'M .08 1 L .08 0 M .48 .6 L .1 .26 L .5 0'],
    l: [0.26, 'M .1 1 L .1 .12 Q .1 0 .24 0'], m: [0.92, 'M .08 .6 L .08 0 M .08 .4 Q .1 .62 .28 .6 Q .46 .58 .46 .38 L .46 0 M .46 .4 Q .48 .62 .66 .6 Q .84 .58 .84 .38 L .84 0'],
    n: [0.6, 'M .08 .6 L .08 0 M .08 .4 Q .1 .62 .32 .6 Q .52 .58 .52 .38 L .52 0'], o: [0.6, 'E .3 .3 .25 .3 0 360'], p: [0.66, 'M .08 .6 L .08 -.3 E .34 .3 .26 .3 0 360'],
    q: [0.62, 'E .28 .3 .24 .3 0 360 M .54 .6 L .54 -.3'], r: [0.42, 'M .08 .6 L .08 0 M .08 .38 Q .14 .6 .4 .58'], s: [0.5, 'M .44 .5 Q .3 .64 .16 .56 Q .02 .42 .24 .31 Q .5 .2 .4 .07 Q .26 -.06 .05 .1'],
    t: [0.46, 'M .2 .92 L .2 .14 Q .2 0 .44 .06 M .0 .6 L .46 .64'], u: [0.6, 'M .08 .6 L .08 .22 Q .08 0 .3 0 Q .5 .02 .52 .3 M .52 .6 L .52 0'], v: [0.56, 'M .04 .6 L .28 0 L .52 .6'],
    w: [0.76, 'M .04 .6 L .2 0 L .38 .5 L .56 0 L .72 .6'], x: [0.52, 'M .04 .6 L .48 0 M .48 .6 L .04 0'], y: [0.56, 'M .04 .6 L .28 .02 M .52 .6 L .22 -.2 Q .14 -.34 -.04 -.26'], z: [0.58, 'M .06 .6 L .5 .6 L .06 0 L .52 0'],
    A: [0.68, 'M .04 0 L .34 1 L .64 0 M .16 .36 L .52 .36'], B: [0.72, 'M .08 0 L .08 1 L .34 1 Q .58 1 .58 .76 Q .58 .54 .34 .52 L .08 .52 M .34 .52 Q .64 .5 .64 .26 Q .64 0 .36 0 L .08 0'],
    C: [0.76, 'E .4 .5 .34 .5 50 310'], D: [0.78, 'M .08 0 L .08 1 L .3 1 Q .7 1 .7 .5 Q .7 0 .3 0 L .08 0'], E: [0.64, 'M .56 1 L .08 1 L .08 0 L .58 0 M .08 .52 L .48 .52'],
    F: [0.6, 'M .56 1 L .08 1 L .08 0 M .08 .52 L .46 .52'], G: [0.82, 'E .4 .5 .34 .5 50 330 M .44 .44 L .74 .44 L .74 .16'], H: [0.7, 'M .08 0 L .08 1 M .62 0 L .62 1 M .08 .52 L .62 .52'],
    I: [0.2, 'M .1 0 L .1 1'], J: [0.52, 'M .44 1 L .44 .26 Q .44 0 .22 0 Q .06 0 .04 .2'], K: [0.66, 'M .08 0 L .08 1 M .6 1 L .1 .44 L .62 0'], L: [0.56, 'M .08 1 L .08 0 L .52 0'],
    M: [0.84, 'M .08 0 L .08 1 L .42 .3 L .76 1 L .76 0'], N: [0.7, 'M .08 0 L .08 1 L .62 0 L .62 1'], O: [0.8, 'E .4 .5 .34 .5 0 360'],
    P: [0.66, 'M .08 0 L .08 1 L .36 1 Q .62 1 .62 .72 Q .62 .46 .36 .46 L .08 .46'], Q: [0.8, 'E .4 .5 .34 .5 0 360 M .5 .22 L .76 -.06'],
    R: [0.7, 'M .08 0 L .08 1 L .36 1 Q .62 1 .62 .72 Q .62 .46 .36 .46 L .08 .46 M .34 .46 L .64 0'], S: [0.66, 'M .58 .84 Q .46 1.02 .28 1 Q .04 .96 .08 .74 Q .12 .56 .34 .5 Q .62 .42 .6 .22 Q .56 -.02 .3 0 Q .12 .02 .04 .18'],
    T: [0.64, 'M .02 1 L .62 1 M .32 1 L .32 0'], U: [0.72, 'M .08 1 L .08 .32 Q .08 0 .36 0 Q .64 0 .64 .32 L .64 1'], V: [0.64, 'M .02 1 L .32 0 L .62 1'],
    W: [0.88, 'M .02 1 L .22 0 L .44 .7 L .66 0 L .86 1'], X: [0.64, 'M .04 1 L .6 0 M .6 1 L .04 0'], Y: [0.64, 'M .02 1 L .32 .5 L .62 1 M .32 .5 L .32 0'], Z: [0.68, 'M .06 1 L .6 1 L .06 0 L .62 0'],
    0: [0.64, 'E .32 .5 .26 .5 0 360'], 1: [0.5, 'M .06 .74 L .3 1 L .3 0 M .1 0 L .5 0'], 2: [0.66, 'M .08 .76 Q .12 1 .32 1 Q .56 1 .56 .76 Q .56 .56 .08 0 L .6 0'],
    3: [0.66, 'M .08 .86 Q .2 1 .34 1 Q .56 1 .56 .76 Q .56 .54 .28 .52 Q .6 .5 .6 .26 Q .6 0 .32 0 Q .14 0 .06 .16'], 4: [0.66, 'M .46 0 L .46 1 L .04 .32 L .62 .32'],
    5: [0.66, 'M .54 1 L .14 1 L .1 .56 Q .22 .64 .36 .62 Q .6 .58 .6 .3 Q .6 0 .32 0 Q .14 0 .06 .16'], 6: [0.66, 'M .5 .98 Q .1 .8 .08 .3 E .33 .3 .25 .3 0 360'],
    7: [0.64, 'M .06 1 L .6 1 L .26 0 M .22 .5 L .54 .5'], 8: [0.64, 'E .32 .76 .22 .24 0 360 E .32 .27 .26 .27 0 360'], 9: [0.66, 'E .31 .7 .25 .3 0 360 M .56 .7 Q .56 .2 .14 .02'],
    '.': [0.2, 'M .1 .03 L .1 .04'], ',': [0.2, 'M .1 .06 L .05 -.14'], '+': [0.56, 'M .06 .42 L .5 .42 M .28 .2 L .28 .64'], '-': [0.52, 'M .08 .4 L .44 .4'], "'": [0.18, 'M .1 1 L .08 .78'],
    ':': [0.2, 'M .1 .08 L .1 .09 M .1 .5 L .1 .51'], '!': [0.2, 'M .1 1 L .1 .3 M .1 .03 L .1 .04'], '?': [0.56, 'M .06 .8 Q .1 1 .28 1 Q .5 1 .5 .78 Q .5 .6 .28 .46 L .28 .3 M .28 .03 L .28 .04'],
    '=': [0.56, 'M .06 .54 L .5 .54 M .06 .28 L .5 .28'], '>': [0.54, 'M .08 .66 L .46 .42 L .08 .18'], '<': [0.54, 'M .46 .66 L .08 .42 L .46 .18'],
    '»': [0.7, 'M .06 .56 L .28 .36 L .06 .16 M .36 .56 L .58 .36 L .36 .16'], '/': [0.44, 'M .04 0 L .4 1'], '(': [0.3, 'M .26 1.05 Q .02 .5 .26 -.1'], ')': [0.3, 'M .04 1.05 Q .28 .5 .04 -.1'],
    '%': [0.68, 'M .08 0 L .6 1 E .16 .8 .12 .16 0 360 E .52 .2 .12 .16 0 360'], '#': [0.62, 'M .2 0 L .28 1 M .42 0 L .5 1 M .04 .68 L .6 .68 M .02 .32 L .58 .32'], '→': [0.76, 'M .04 .4 L .7 .4 M .5 .58 L .7 .4 L .5 .22']
  };
  G['−'] = G['-']; G['–'] = G['-'];
  const CMD = {}; Object.keys(G).forEach(ch => { CMD[ch] = G[ch][1].split(' ').filter(Boolean).map(t => (/^[MLQE]$/.test(t) ? t : parseFloat(t))); });
  const GAP = 0.07, CAP = 0.7;
  const adv = ch => (G[ch] ? G[ch][0] : 0.5) + GAP;
  const width = (str, size) => { let w = 0; for (const ch of String(str)) w += adv(ch); return w * size * CAP; };
  // writes the strokes of a string into the current path of ctx
  function trace(ctx, str, x0, yb, size, dots) {
    const u = size * CAP; let cx = x0, n = 0;
    for (const ch of String(str)) {
      const y0 = yb + Math.sin((n++) * 2.3 + ch.charCodeAt(0)) * u * 0.018;
      const c = CMD[ch]; if (c) { let i = 0;
        while (i < c.length) { const k = c[i++];
          if (k === 'M') { ctx.moveTo(cx + c[i] * u, y0 - c[i + 1] * u); if (dots) dots.push(cx + c[i] * u, y0 - c[i + 1] * u); i += 2; }
          else if (k === 'L') { ctx.lineTo(cx + c[i] * u, y0 - c[i + 1] * u); i += 2; }
          else if (k === 'Q') { ctx.quadraticCurveTo(cx + c[i] * u, y0 - c[i + 1] * u, cx + c[i + 2] * u, y0 - c[i + 3] * u); i += 4; }
          else if (k === 'E') { const ex = cx + c[i] * u, ey = y0 - c[i + 1] * u, a0 = -c[i + 4] * Math.PI / 180, a1 = -c[i + 5] * Math.PI / 180; ctx.moveTo(ex + c[i + 2] * u * Math.cos(a0), ey + c[i + 3] * u * Math.sin(a0)); ctx.ellipse(ex, ey, c[i + 2] * u, c[i + 3] * u, 0, a0, a1, true); i += 6; } } }
      cx += adv(ch) * u; }
  }
  // Replaces the text calls of one canvas context. The size comes from the font last set through hand or marker.
  function install(ctx) {
    if (ctx.__pen) return; ctx.__pen = { size: 20, heavy: false };
    const start = (str, x) => { const w = width(str, ctx.__pen.size), al = ctx.textAlign; return al === 'center' ? x - w / 2 : al === 'right' || al === 'end' ? x - w : x; };
    const base = y => (ctx.textBaseline === 'middle' ? y + ctx.__pen.size * 0.26 : ctx.textBaseline === 'top' ? y + ctx.__pen.size * 0.74 : y);
    const pen = () => Math.max(ctx.__pen.heavy ? 3 : 2.3, ctx.__pen.size * (ctx.__pen.heavy ? 0.105 : 0.066));
    const write = (str, x, y, col, extra) => { const s = ctx.__pen.size, nib = s * (ctx.__pen.heavy ? 0.05 : 0.032), x0 = start(str, x), y0 = base(y);
      ctx.save(); ctx.setLineDash([]); ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = pen() + (extra || 0);
      const dots = []; ctx.beginPath(); trace(ctx, str, x0, y0, s, dots); trace(ctx, str, x0 + nib, y0 - nib, s); ctx.stroke();
      if (!extra) { ctx.fillStyle = col; const r = ctx.lineWidth * 0.72; ctx.beginPath(); for (let i = 0; i < dots.length; i += 2) { ctx.moveTo(dots[i] + nib / 2 + r, dots[i + 1] - nib / 2); ctx.arc(dots[i] + nib / 2, dots[i + 1] - nib / 2, r, 0, 6.3); } ctx.fill(); } ctx.restore(); };
    ctx.fillText = (str, x, y) => write(str, x, y, ctx.fillStyle, 0);
    ctx.strokeText = (str, x, y) => write(str, x, y, ctx.strokeStyle, ctx.lineWidth);
    ctx.measureText = str => ({ width: width(str, ctx.__pen.size) });
  }
  AA.rxPen = { install, width, set: (ctx, size, heavy) => { install(ctx); ctx.__pen.size = size; ctx.__pen.heavy = !!heavy; } };
})();
