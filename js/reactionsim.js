(function (root) {
'use strict';
const AA = root.AA = root.AA || {};

// A simplified collision-theory model of  A2 + B2 -> 2 AB  in a box.
// A reaction happens only when two molecules collide (1) hard enough, (2) the right way round.
// Real reactions can have extra steps; this model keeps the main idea.
const R = 11;                                    // molecule radius in pixels
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

class ReactionSim {
  constructor(canvas, onEvent) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.onEvent = onEvent || function () {};
    this.temp = 0.4; this.catalyst = false; this.Ea = 4; this.dH = -4; this.n = 10;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); this.w = 320; this.h = 300; this.dead = false;
    this.resize(); if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(canvas);
    this.reset();
  }
  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.w = w; this.h = h;
    this.canvas.width = Math.round(w * this.dpr); this.canvas.height = Math.round(h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }
  sigma() { return 40 + 130 * this.temp; }
  need() { return this.catalyst ? this.Ea / 2 : this.Ea; }
  _new(kind) {
    const s = this.sigma(); let x, y, tries = 0;
    do { x = R + Math.random() * (this.w - 2 * R); y = R + Math.random() * (this.h - 2 * R); tries++; }
    while (tries < 40 && this.p.some(q => Math.hypot(q.x - x, q.y - y) < 2.4 * R));
    return { kind, x, y, vx: gauss() * s, vy: gauss() * s, a: Math.random() * 6.28, spin: (Math.random() - 0.5) * 3, flash: 0 };
  }
  reset(n) {
    if (n) this.n = n;
    this.p = []; this.stats = { coll: 0, soft: 0, wrong: 0, react: 0 }; this.recent = []; this.t = 0;
    for (let i = 0; i < this.n; i++) { this.p.push(this._new('A')); this.p.push(this._new('B')); }
  }
  setTemp(t) {
    const old = this.sigma(); this.temp = t; const k = this.sigma() / old;
    this.p.forEach(q => { q.vx *= k; q.vy *= k; });
  }
  counts() {
    let a = 0, b = 0, ab = 0;
    this.p.forEach(q => { if (q.kind === 'A') a++; else if (q.kind === 'B') b++; else ab++; });
    return { a, b, ab };
  }
  rate() { return this.recent.filter(t => this.t - t < 4).length; }

  _bounce(p, q, nx, ny) {
    const dv = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny;
    p.vx -= dv * nx; p.vy -= dv * ny; q.vx += dv * nx; q.vy += dv * ny;
  }
  _react(i, j, nx, ny) {
    const p = this.p[i], q = this.p[j];
    const cx = (p.vx + q.vx) / 2, cy = (p.vy + q.vy) / 2;
    const boost = Math.max(-40, Math.min(170, -this.dH * 25));    // heat released (or taken in)
    const a = { kind: 'AB', x: p.x, y: p.y, vx: cx - nx * boost, vy: cy - ny * boost, a: p.a, spin: p.spin, flash: 1 };
    const b = { kind: 'AB', x: q.x, y: q.y, vx: cx + nx * boost, vy: cy + ny * boost, a: q.a, spin: q.spin, flash: 1 };
    this.p[i] = a; this.p[j] = b;
    this.stats.react++; this.recent.push(this.t);
    this.onEvent('react', { temp: this.temp, catalyst: this.catalyst });
  }
  step(dt) {
    this.t += dt; const p = this.p, w = this.w, h = this.h;
    for (const q of p) {
      q.x += q.vx * dt; q.y += q.vy * dt; q.a += q.spin * dt; if (q.flash > 0) q.flash = Math.max(0, q.flash - dt * 1.6);
      if (q.x < R) { q.x = R; q.vx = Math.abs(q.vx); } else if (q.x > w - R) { q.x = w - R; q.vx = -Math.abs(q.vx); }
      if (q.y < R) { q.y = R; q.vy = Math.abs(q.vy); } else if (q.y > h - R) { q.y = h - R; q.vy = -Math.abs(q.vy); }
    }
    for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) {
      const a = p[i], b = p[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
      if (d >= 2 * R || d < 1e-6) continue;
      const nx = dx / d, ny = dy / d, approach = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      const push = (2 * R - d) / 2; a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
      if (approach <= 0) continue;
      const pair = (a.kind === 'A' && b.kind === 'B') || (a.kind === 'B' && b.kind === 'A');
      if (!pair) { this._bounce(a, b, nx, ny); continue; }
      this.stats.coll++;
      const E = ((a.vx - b.vx) ** 2 + (a.vy - b.vy) ** 2) / 10000;
      if (E < this.need()) { this.stats.soft++; this._bounce(a, b, nx, ny); }
      else if (Math.random() < 0.5) this._react(i, j, nx, ny);           // right way round
      else { this.stats.wrong++; this._bounce(a, b, nx, ny); }
    }
    // a water bath keeps the box at the chosen temperature
    let m = 0; for (const q of p) m += q.vx * q.vx + q.vy * q.vy; m /= p.length || 1;
    const f = Math.sqrt(2 * this.sigma() ** 2 / (m || 1)), k = 1 + (f - 1) * Math.min(1, dt * 1.5);
    for (const q of p) { q.vx *= k; q.vy *= k; }
  }

  render(dt) {
    if (this.dead) return;
    dt = Math.min(dt || 0.016, 0.05);
    for (let s = 0; s < 2; s++) this.step(dt / 2);
    const x = this.ctx, w = this.w, h = this.h;
    x.clearRect(0, 0, w, h);
    x.fillStyle = '#0b1626'; x.fillRect(0, 0, w, h);
    x.strokeStyle = this.catalyst ? '#ffd23f' : '#2a4466'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, w - 3, h - 3);
    const RED = '#ff4d4d', GREEN = '#37d67a';
    for (const q of this.p) {
      x.save(); x.translate(q.x, q.y); x.rotate(q.a);
      const atom = (dx, col) => { x.beginPath(); x.arc(dx, 0, 6.5, 0, 6.2832); x.fillStyle = col; x.fill(); x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 1; x.stroke(); };
      x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(-5, -2, 10, 4);
      if (q.kind === 'A') { atom(-5, RED); atom(5, RED); } else if (q.kind === 'B') { atom(-5, GREEN); atom(5, GREEN); } else { atom(-5, RED); atom(5, GREEN); }
      x.restore();
      if (q.flash > 0) { x.beginPath(); x.arc(q.x, q.y, R + 22 * (1 - q.flash), 0, 6.2832); x.strokeStyle = 'rgba(255,210,63,' + q.flash + ')'; x.lineWidth = 3; x.stroke(); }
    }
    if (this.catalyst) { x.fillStyle = 'rgba(255,210,63,.9)'; x.font = 'bold 13px system-ui'; x.fillText('catalyst on', 10, 20); }
  }
  dispose() { this.dead = true; }
}

// ---- the energy hill picture ----
function drawHill(cv, Ea, dH, catalyst) {
  const x = cv.getContext('2d'), W = cv.width, H = cv.height, padL = 54, padB = 46, padT = 24, padR = 16;
  x.clearRect(0, 0, W, H);
  const E0 = 4, scale = (H - padB - padT) / 13, yOf = e => H - padB - e * scale;
  const Ep = E0 + dH, tsOf = a => E0 + Math.max(a, dH > 0 ? dH + 0.7 : 0.7), Ets = tsOf(Ea);
  const xOf = f => padL + f * (W - padL - padR);
  const ease = t => (1 - Math.cos(Math.PI * t)) / 2;
  const curve = ts => f => f < 0.22 ? E0 : f < 0.5 ? E0 + (ts - E0) * ease((f - 0.22) / 0.28) : f < 0.78 ? ts + (Ep - ts) * ease((f - 0.5) / 0.28) : Ep;
  const line = (fn, color, wd, dash) => {
    x.beginPath(); x.setLineDash(dash || []);
    for (let i = 0; i <= 160; i++) { const f = 0.04 + 0.92 * i / 160, px = xOf(f), py = yOf(fn(f)); i ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.strokeStyle = color; x.lineWidth = wd; x.stroke(); x.setLineDash([]);
  };
  x.fillStyle = '#9db3cf'; x.strokeStyle = '#9db3cf'; x.lineWidth = 2; x.font = '16px "Trebuchet MS", system-ui, sans-serif';
  x.beginPath(); x.moveTo(padL, padT); x.lineTo(padL, H - padB); x.lineTo(W - padR, H - padB); x.stroke();
  x.textAlign = 'center'; x.fillText('reaction progress →', (padL + W - padR) / 2, H - 8);
  x.save(); x.translate(16, (padT + H - padB) / 2); x.rotate(-Math.PI / 2); x.fillText('energy →', 0, 0); x.restore();
  if (catalyst) line(curve(tsOf(Ea / 2)), '#ffd23f', 3, [8, 6]);
  line(curve(Ets), '#3dd6c6', 4);
  const arrow = (px, y1, y2, color, label, side) => {
    x.strokeStyle = color; x.fillStyle = color; x.lineWidth = 3; x.beginPath(); x.moveTo(px, y1); x.lineTo(px, y2); x.stroke();
    const dir = y2 < y1 ? 1 : -1; x.beginPath(); x.moveTo(px, y2); x.lineTo(px - 6, y2 + 10 * dir); x.lineTo(px + 6, y2 + 10 * dir); x.closePath(); x.fill();
    x.textAlign = side; x.font = 'bold 15px system-ui'; x.fillText(label, px + (side === 'left' ? -10 : 10), (y1 + y2) / 2 + 5);
  };
  arrow(xOf(0.5), yOf(E0), yOf(Ets), '#ff8a4a', 'hill (Ea)', 'left');
  if (Math.abs(dH) > 0.25) arrow(xOf(0.9), yOf(E0), yOf(Ep), dH < 0 ? '#7dffb0' : '#8ab4ff', dH < 0 ? 'heat out' : 'heat in', 'left');
  x.fillStyle = '#e8f0fb'; x.font = '15px system-ui'; x.textAlign = 'center';
  x.fillText('A₂ + B₂', xOf(0.13), yOf(E0) + 22); x.fillText('2 AB', xOf(0.88), yOf(Ep) + 22);
  x.fillStyle = '#ffd23f'; x.textAlign = 'left';
  if (catalyst) x.fillText('dashed = with catalyst', padL + 8, padT + 8);
}

AA.ReactionSim = ReactionSim;
AA.drawHill = drawHill;
})(typeof globalThis !== 'undefined' ? globalThis : window);
