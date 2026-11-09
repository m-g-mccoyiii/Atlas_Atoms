// 2D effects drawn over the fume hood: rings, sparks, score numbers, screen shake, flash, slab banners.
(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
const { rgba } = AA.rxArt;
const FONT = 'Bahnschrift, "DIN Alternate", "Arial Narrow", Arial, sans-serif';
const YELLOW = [255, 205, 0], WHITE = [255, 255, 255];
const lum = c => (c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000;

function make(cv, wrap) {
  const s = { parts: [], rings: [], floats: [], shake: 0, punch: 0, flash: 0, flashC: WHITE, banner: null };
  const api = {
    burst(x, y, c, n, spd) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = spd * (0.3 + Math.random()); s.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: 1, decay: 0.9 + Math.random() * 0.9, r: 1.5 + Math.random() * 3, c, sq: Math.random() < 0.35 }); } },
    ring(x, y, c, r1, dur) { s.rings.push({ x, y, c, r0: 6, r1, t: 0, dur }); },
    floatText(x, y, text, c, size) { s.floats.push({ x, y, text, c: c || YELLOW, size: size || 26, t: 0, dur: 1.2 }); },
    shake(mag) { s.shake = Math.max(s.shake, mag); },
    punch(k) { s.punch = Math.min(0.16, Math.max(s.punch, k)); },
    flash(a, c) { s.flash = Math.max(s.flash, a); s.flashC = c || WHITE; },
    banner(text, sub, c, dur) { s.banner = { text, sub: sub || '', c: c || YELLOW, t: 0, dur: dur || 2.2 }; },
    clear() { s.parts.length = s.rings.length = s.floats.length = 0; s.banner = null; s.flash = 0; },
    draw(dt) {
      const w = cv.clientWidth, hh = cv.clientHeight, dpr = Math.min(root.devicePixelRatio || 1, 2);
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(hh * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr); }
      const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, hh);
      x.globalCompositeOperation = 'lighter';
      s.rings = s.rings.filter(r => (r.t += dt) < r.dur);
      s.rings.forEach(r => { const k = r.t / r.dur, e = 1 - Math.pow(1 - k, 3); x.strokeStyle = rgba(r.c, 1 - k); x.lineWidth = 7 * (1 - k) + 1; x.beginPath(); x.arc(r.x, r.y, r.r0 + (r.r1 - r.r0) * e, 0, 6.3); x.stroke(); });
      s.parts = s.parts.filter(p => (p.life -= p.decay * dt) > 0);
      s.parts.forEach(p => {
        p.vy += 120 * dt; p.vx *= Math.pow(0.25, dt); p.vy *= Math.pow(0.4, dt); p.x += p.vx * dt; p.y += p.vy * dt;
        x.fillStyle = rgba(p.c, p.life); const r = p.r * (0.4 + p.life);
        if (p.sq) x.fillRect(p.x - r, p.y - r, r * 2, r * 2); else { x.beginPath(); x.arc(p.x, p.y, r, 0, 6.3); x.fill(); }
      });
      if (s.flash > 0.01) { x.fillStyle = rgba(s.flashC, s.flash * 0.5); x.fillRect(0, 0, w, hh); s.flash *= Math.pow(0.02, dt); }
      x.globalCompositeOperation = 'source-over';
      s.floats = s.floats.filter(f => (f.t += dt) < f.dur);
      s.floats.forEach(f => {
        const k = f.t / f.dur, pop = k < 0.1 ? 0.6 + k / 0.1 * 0.7 : 1.3 - Math.min(0.3, (k - 0.1) * 1.6), y = f.y - 80 * (1 - Math.pow(1 - k, 2));
        x.font = '700 ' + Math.round(f.size * pop) + 'px ' + FONT; x.textAlign = 'center'; x.lineJoin = 'round';
        x.lineWidth = 6; x.strokeStyle = rgba([0, 0, 0], 1 - k * k); x.fillStyle = rgba(f.c, 1 - k * k);
        x.strokeText(f.text, f.x, y); x.fillText(f.text, f.x, y);
      });
      const b = s.banner;
      if (b && (b.t += dt) < b.dur) {
        // a solid slab that slides in from the left, holds, and slides out to the right
        const k = b.t / b.dur, inn = Math.min(1, b.t / 0.14), out = k > 0.82 ? (k - 0.82) / 0.18 : 0;
        const size = Math.round(Math.min(58, w / 13)), bh = size + (b.sub ? 44 : 22), by = 28;
        const off = (1 - (1 - Math.pow(1 - inn, 3))) * -w + out * out * w;
        x.save(); x.translate(off, 0);
        x.fillStyle = rgba(b.c, 0.96); x.beginPath(); x.moveTo(0, by); x.lineTo(w, by); x.lineTo(w, by + bh); x.lineTo(0, by + bh); x.closePath(); x.fill();
        x.fillStyle = '#000'; x.fillRect(0, by - 5, w, 5); x.fillRect(0, by + bh, w, 5);
        const ink = lum(b.c) > 140 ? '#000' : '#fff';
        x.fillStyle = ink; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
        x.font = '700 ' + size + 'px ' + FONT; x.fillText(b.text, w / 2, by + size * 0.9 + 4);
        if (b.sub) { x.font = '600 22px ' + FONT; x.fillText(b.sub, w / 2, by + size + 30); }
        x.restore();
      }
      // shake moves the hood; punch pushes it toward the viewer and lets it settle back
      const sh = s.shake > 0.3 ? s.shake : 0, pu = s.punch > 0.002 ? s.punch : 0;
      if (sh || pu) wrap.style.transform = 'translate(' + ((Math.random() - 0.5) * sh).toFixed(1) + 'px,' + ((Math.random() - 0.5) * sh).toFixed(1) + 'px) scale(' + (1 + pu).toFixed(4) + ')';
      else if (wrap.style.transform) wrap.style.transform = '';
      s.shake *= Math.pow(0.004, dt); s.punch *= Math.pow(0.01, dt);
    }
  };
  return api;
}
AA.rxFx = { make, FONT };
})(typeof globalThis !== 'undefined' ? globalThis : window);
