(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
const E = AA.ELEMENTS, C = AA.chem;

function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function shade(hex, amt) {
  const c = rgb(hex), t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  return 'rgb(' + c.map(v => Math.round((t - v) * p + v)).join(',') + ')';
}
function rgba(hex, a) { const c = rgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
function textOn(hex) { const c = rgb(hex); return (c[0] * 0.299 + c[1] * 0.587 + c[2] * 0.114) > 150 ? '#14202e' : '#ffffff'; }
const BALL = el => Math.min(0.75, 0.25 + 0.45 * E[el].cov);

class Viewer {
  constructor(canvas, model, opts) {
    opts = opts || {};
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.model = model;
    this.mode = opts.mode || 'ball';
    this.interactive = !!opts.interactive;
    this.autoRotate = !!opts.autoRotate;
    this.autoFit = !!opts.autoFit;
    this.faces = opts.faces !== false;
    this.yaw = opts.yaw !== undefined ? opts.yaw : 0.45;
    this.pitch = opts.pitch !== undefined ? opts.pitch : 0.25;
    this.zoom = opts.zoom || 60;
    this.tool = 'build';
    this.hover = null; this.hoverBond = null; this.drag = null; this.rot = null; this.target = null; this.pointer = null;
    this.particles = []; this.cb = {}; this.time = 0; this.w = 300; this.h = 300;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._bind();
    this.resize();
    if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(canvas);
  }

  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.w = w; this.h = h;
    this.canvas.width = Math.round(w * this.dpr); this.canvas.height = Math.round(h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  // ---- camera ----
  cam(p) {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const x1 = cy * p.x + sy * p.z, z1 = -sy * p.x + cy * p.z;
    return [x1, cp * p.y - sp * z1, sp * p.y + cp * z1];
  }
  uncam(c) {
    const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const y = cp * c[1] + sp * c[2], z1 = -sp * c[1] + cp * c[2];
    return [cy * c[0] - sy * z1, y, sy * c[0] + cy * z1];
  }
  perspective(z) { return Math.max(0.5, Math.min(2, 1 / (1 + z * 0.045))); }
  proj(p) {
    const c = this.cam(p), k = this.zoom * this.perspective(c[2]);
    return { x: this.w / 2 + c[0] * k, y: this.h / 2 - c[1] * k, z: c[2], k };
  }
  _r(a, p) {
    if (this.mode === 'space') return E[a.el].vdw * p.k * 0.92;
    if (this.mode === 'orbital') return Math.max(7, 0.14 * p.k);
    return BALL(a.el) * p.k;
  }

  // ---- input ----
  _bind() {
    const c = this.canvas;
    c.addEventListener('pointerdown', e => this._down(e));
    c.addEventListener('pointermove', e => { this._pos(e); if (!this.drag && !this.rot) this._hoverUpdate(); });
    c.addEventListener('pointerleave', () => { if (!this.drag) { this.hover = null; this.hoverBond = null; this.pointer = null; } });
    c.addEventListener('wheel', e => { e.preventDefault(); this.zoom = Math.max(25, Math.min(130, this.zoom * (e.deltaY > 0 ? 0.92 : 1.08))); }, { passive: false });
  }
  _pos(e) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    return this.pointer;
  }
  _hoverUpdate() {
    if (!this.interactive || !this.pointer) return;
    this.hover = this.hitAtom(this.pointer);
    this.hoverBond = this.tool === 'cut' && !this.hover ? this.hitBond(this.pointer) : null;
  }
  hitAtom(p) {
    const list = this.model.atoms.map(a => ({ a, pr: this.proj(a) })).sort((u, v) => u.pr.z - v.pr.z);
    for (const it of list) {
      const r = Math.max(this._r(it.a, it.pr), 14);
      if (Math.hypot(p.x - it.pr.x, p.y - it.pr.y) <= r) return it.a;
    }
    return null;
  }
  hitBond(p) {
    let best = null, bd = 11;
    for (const b of this.model.bonds) {
      const A = this.proj(b.a), B = this.proj(b.b);
      const dx = B.x - A.x, dy = B.y - A.y, L2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((p.x - A.x) * dx + (p.y - A.y) * dy) / L2));
      const d = Math.hypot(p.x - (A.x + t * dx), p.y - (A.y + t * dy));
      if (d < bd) { bd = d; best = b; }
    }
    return best;
  }
  _down(e) {
    const p = this._pos(e);
    if (this.interactive) {
      if (this.tool === 'cut') { const b = this.hitBond(p); if (b && this.cb.onCut) this.cb.onCut(b); return; }
      const a = this.hitAtom(p);
      if (a) { this.startDrag(a, e); return; }
    }
    this.rot = { x: e.clientX, y: e.clientY, yaw: this.yaw, pitch: this.pitch };
    this._listen();
  }
  startDrag(a, e) {
    a.pinned = true; this.drag = { atom: a }; this.target = null;
    this._listen();
    this._dragMove(e);
  }
  _listen() {
    const mv = e => this._move(e);
    const up = e => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      this._up(e);
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }
  _move(e) {
    if (this.drag) this._dragMove(e);
    else if (this.rot) {
      this.yaw = this.rot.yaw + (e.clientX - this.rot.x) * 0.01;
      this.pitch = Math.max(-1.4, Math.min(1.4, this.rot.pitch + (e.clientY - this.rot.y) * 0.01));
    }
  }
  _dragMove(e) {
    const p = this._pos(e), a = this.drag.atom;
    const px = Math.max(24, Math.min(this.w - 24, p.x)), py = Math.max(24, Math.min(this.h - 24, p.y));
    const pr = this.proj(a);
    let z = pr.z;
    if (this.target) z += (this.proj(this.target).z - z) * 0.15;
    const k = this.zoom * this.perspective(z);
    const w = this.uncam([(px - this.w / 2) / k, (this.h / 2 - py) / k, z]);
    a.x = w[0]; a.y = w[1]; a.z = w[2]; a.vx = a.vy = a.vz = 0;
    this.target = this.findTarget(a);
  }
  findTarget(a) {
    const pa = this.proj(a);
    let best = null, bd = Infinity;
    for (const b of this.model.atoms) {
      if (b === a) continue;
      const pb = this.proj(b);
      const d = Math.hypot(pa.x - pb.x, pa.y - pb.y);
      const thr = (BALL(a.el) * pa.k + BALL(b.el) * pb.k) * 0.7 + 6;
      if (d < thr && d < bd) { bd = d; best = b; }
    }
    return best;
  }
  _up(e) {
    if (this.drag) {
      const a = this.drag.atom, t = this.target;
      a.pinned = false; this.drag = null; this.target = null;
      if (this.cb.onDrop) this.cb.onDrop(a, t, e);
    }
    this.rot = null;
  }

  // ---- effects ----
  burst(x, y, n, colors) {
    colors = colors || ['#ffd23f', '#3dd6c6', '#ff6b8b', '#8ab4ff'];
    for (let i = 0; i < (n || 40); i++) {
      const ang = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 220;
      this.particles.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 80, life: 1, size: 3 + Math.random() * 4, color: colors[i % colors.length] });
    }
  }
  burstAtoms(atoms, n) {
    if (!atoms.length) return;
    let x = 0, y = 0;
    atoms.forEach(a => { const p = this.proj(a); x += p.x; y += p.y; });
    this.burst(x / atoms.length, y / atoms.length, n);
  }

  // ---- drawing ----
  _fit() {
    let r = 1;
    this.model.atoms.forEach(a => { r = Math.max(r, Math.hypot(a.x, a.y, a.z) + (this.mode === 'space' ? E[a.el].vdw : 0.9)); });
    this.zoom += (Math.min(this.w, this.h) * 0.45 / r - this.zoom) * 0.2;
  }
  render(dt) {
    dt = dt || 0.016; this.time += dt;
    if (this.autoRotate && !this.rot) this.yaw += dt * 0.5;
    if (this.autoFit) this._fit();
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    const P = new Map(), S = new Map();
    this.model.atoms.forEach(a => { P.set(a, this.proj(a)); S.set(a, 0); });
    this.model.bonds.forEach(b => { S.set(b.a, (S.get(b.a) || 0) + b.order); S.set(b.b, (S.get(b.b) || 0) + b.order); });
    this.P = P; this.S = S;
    if (this.mode === 'orbital') this._orbital(P, S); else this._solid(P, S);
    this._overlay(P);
  }

  _solid(P, S) {
    const items = [];
    this.model.atoms.forEach(a => items.push({ t: 0, z: P.get(a).z, a }));
    if (this.mode === 'ball') this.model.bonds.forEach(b => items.push({ t: 1, z: (P.get(b.a).z + P.get(b.b).z) / 2, b }));
    items.sort((u, v) => v.z - u.z);
    for (const it of items) it.t ? this._bond(it.b, P) : this._atom(it.a, P.get(it.a), S.get(it.a));
  }

  _bond(b, P) {
    const ctx = this.ctx, pa = P.get(b.a), pb = P.get(b.b);
    const dx = pb.x - pa.x, dy = pb.y - pa.y, L = Math.hypot(dx, dy);
    if (L < 1) return;
    const nx = -dy / L, ny = dx / L, k = (pa.k + pb.k) / 2;
    const ion = C.isIonic(b.a.el, b.b.el);
    if (ion) {
      ctx.save(); ctx.setLineDash([8, 6]); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke(); ctx.restore();
      return;
    }
    const w = (b.order === 1 ? 0.16 : 0.11) * k, sp = 0.15 * k;
    const offs = [[0], [-0.5, 0.5], [-1, 0, 1]][b.order - 1];
    const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2;
    ctx.lineCap = 'butt';
    for (const o of offs) {
      const ox = nx * o * sp, oy = ny * o * sp;
      [[pa, b.a, mx, my], [pb, b.b, mx, my]].forEach(([p, at, ex, ey]) => {
        const col = E[at.el].color;
        ctx.beginPath(); ctx.moveTo(p.x + ox, p.y + oy); ctx.lineTo(ex + ox, ey + oy);
        ctx.strokeStyle = shade(col, -0.1); ctx.lineWidth = w; ctx.stroke();
        ctx.strokeStyle = shade(col, 0.4); ctx.lineWidth = w * 0.4; ctx.stroke();
      });
    }
    if (this.hoverBond === b) {
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y);
      ctx.strokeStyle = 'rgba(255,80,80,.65)'; ctx.lineWidth = w + 8; ctx.lineCap = 'round'; ctx.stroke();
    }
  }

  _atom(a, p, sum) {
    const ctx = this.ctx, r = this._r(a, p), el = E[a.el], col = el.color;
    const g = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.4, r * 0.1, p.x, p.y, r);
    g.addColorStop(0, shade(col, 0.55)); g.addColorStop(0.45, col); g.addColorStop(1, shade(col, -0.45));
    ctx.fillStyle = this.mode === 'space' ? g : g;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
    if (this.mode === 'space') { ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.stroke(); }

    const happy = el.valences.includes(sum) && sum > 0;
    if (this.mode === 'ball' && this.interactive && happy) {
      ctx.beginPath(); ctx.arc(p.x, p.y, r + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(120,255,170,.6)'; ctx.lineWidth = 3; ctx.stroke();
    }
    const face = this.faces && this.mode === 'ball' && r >= 22;
    const tc = textOn(col);
    if (face) {
      const ey = p.y - r * 0.28, ex = r * 0.3, er = r * 0.13;
      ctx.lineWidth = Math.max(1.5, r * 0.06);
      for (const s of [-1, 1]) {
        const x = p.x + s * ex;
        if (happy) { ctx.beginPath(); ctx.arc(x, ey + er * 0.6, er, Math.PI, 0); ctx.strokeStyle = tc; ctx.stroke(); }
        else {
          ctx.beginPath(); ctx.arc(x, ey, er, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
          let px = 0, py = 0;
          if (this.pointer) { const dx = this.pointer.x - x, dy = this.pointer.y - ey, d = Math.hypot(dx, dy) || 1; px = dx / d * er * 0.45; py = dy / d * er * 0.45; }
          ctx.beginPath(); ctx.arc(x + px, ey + py, er * 0.55, 0, Math.PI * 2); ctx.fillStyle = '#14202e'; ctx.fill();
        }
      }
    }
    ctx.fillStyle = tc; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold ' + Math.max(10, r * (face ? 0.5 : 0.62)) + 'px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillText(a.el, p.x, p.y + (face ? r * 0.3 : 0));

    if (this.mode === 'ball') {
      const ion = this.model.neighbors(a).some(n => C.isIonic(a.el, n.atom.el));
      if (ion) {
        ctx.font = 'bold ' + Math.max(12, r * 0.55) + 'px system-ui, sans-serif'; ctx.fillStyle = '#ffd23f';
        ctx.fillText(a.el === 'Na' ? '+' : '−', p.x + r * 0.85, p.y - r * 0.8);
      }
    }
    if (this.mode === 'ball' && this.interactive) {
      const eff = C.effValence(a.el, sum) || sum;
      const n = Math.max(eff, sum), gap = 9, y = p.y + r + 9;
      for (let i = 0; i < n; i++) {
        const x = p.x + (i - (n - 1) / 2) * gap;
        ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        if (i < sum) { ctx.fillStyle = '#7dffb0'; ctx.fill(); }
        else { ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 1.6; ctx.stroke(); }
      }
    }
  }

  _blob(x, y, rx, ry, ang, color, alpha) {
    const ctx = this.ctx;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(1, Math.max(0.05, ry / rx));
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, rgba(color, alpha)); g.addColorStop(0.6, rgba(color, alpha * 0.45)); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  _lobe(p0, p1, w, color, alpha) {
    const ctx = this.ctx, dx = p1.x - p0.x, dy = p1.y - p0.y, L = Math.hypot(dx, dy);
    if (L < 3) { this._blob(p0.x, p0.y, w, w, 0, color, alpha); return; }
    const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const cx = p0.x + ux * L * 0.55, cy = p0.y + uy * L * 0.55;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(L * 0.6, w));
    g.addColorStop(0, rgba(color, alpha)); g.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(p0.x, p0.y);
    ctx.bezierCurveTo(p0.x + nx * w * 1.3 + ux * L * 0.1, p0.y + ny * w * 1.3 + uy * L * 0.1,
      p1.x + nx * w - ux * L * 0.15, p1.y + ny * w - uy * L * 0.15, p1.x, p1.y);
    ctx.bezierCurveTo(p1.x - nx * w - ux * L * 0.15, p1.y - ny * w - uy * L * 0.15,
      p0.x - nx * w * 1.3 + ux * L * 0.1, p0.y - ny * w * 1.3 + uy * L * 0.1, p0.x, p0.y);
    ctx.fill();
  }

  _orbital(P, S) {
    const ctx = this.ctx, m = this.model;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const b of m.bonds) {
      if (C.isIonic(b.a.el, b.b.el)) continue;
      const pa = P.get(b.a), pb = P.get(b.b);
      const dx = pb.x - pa.x, dy = pb.y - pa.y, len = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx);
      const nx = -dy / len, ny = dx / len, k = (pa.k + pb.k) / 2;
      const offs = [[0], [-0.17, 0.17], [-0.3, 0, 0.3]][b.order - 1];
      offs.forEach(o => this._blob((pa.x + pb.x) / 2 + nx * o * k, (pa.y + pb.y) / 2 + ny * o * k, len / 2 + 0.12 * k, 0.17 * k, ang, '#7be7ff', 0.6));
    }
    for (const a of m.atoms) {
      const p = P.get(a), k = p.k, sum = S.get(a), col = E[a.el].color;
      this._blob(p.x, p.y, (a.el === 'H' ? 0.55 : E[a.el].cov * 0.9 + 0.2) * k, (a.el === 'H' ? 0.55 : E[a.el].cov * 0.9 + 0.2) * k, 0, col, 0.35);
      if (m.neighbors(a).length === 0 && a.el !== 'H') {
        const L = (E[a.el].cov * 1.1 + 0.5);
        [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach((ax, i) => {
          for (const s of [1, -1]) {
            const q = this.proj({ x: a.x + ax[0] * L * s, y: a.y + ax[1] * L * s, z: a.z + ax[2] * L * s });
            this._lobe(p, q, 0.3 * k, s > 0 ? '#6aa8ff' : '#ff9a6a', 0.55);
          }
        });
      } else {
        for (const d of m.lonePairDirs(a)) {
          const q = this.proj({ x: a.x + d[0] * 0.9, y: a.y + d[1] * 0.9, z: a.z + d[2] * 0.9 });
          this._lobe(p, q, 0.28 * k, '#ffd37a', 0.6);
        }
      }
    }
    ctx.restore();
    for (const b of m.bonds) {
      const pa = P.get(b.a), pb = P.get(b.b);
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y);
      if (C.isIonic(b.a.el, b.b.el)) { ctx.setLineDash([8, 6]); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2.5; }
      else { ctx.setLineDash([]); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1; }
      ctx.stroke(); ctx.setLineDash([]);
    }
    for (const a of m.atoms) {
      const p = P.get(a), r = this._r(a, p), col = E[a.el].color;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = textOn(col); ctx.font = 'bold ' + Math.max(9, r * 0.9) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(a.el, p.x, p.y + 0.5);
      if (m.neighbors(a).some(n => C.isIonic(a.el, n.atom.el))) {
        ctx.fillStyle = '#ffd23f'; ctx.font = 'bold 14px system-ui, sans-serif';
        ctx.fillText(a.el === 'Na' ? '+' : '−', p.x + r + 8, p.y - r - 4);
      }
    }
  }

  _overlay(P) {
    const ctx = this.ctx;
    if (this.interactive && this.hover && !this.drag) {
      const p = P.get(this.hover);
      if (p) { ctx.beginPath(); ctx.arc(p.x, p.y, this._r(this.hover, p) + 4, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.stroke(); }
    }
    if (this.drag && this.target && P.get(this.target)) {
      const a = this.drag.atom, t = this.target, p = P.get(t);
      const ok = this.model.canBond(a, t);
      const pulse = 0.6 + 0.4 * Math.sin(this.time * 10);
      ctx.beginPath(); ctx.arc(p.x, p.y, this._r(t, p) + 6, 0, Math.PI * 2);
      ctx.strokeStyle = (ok ? 'rgba(120,255,170,' : 'rgba(255,100,100,') + pulse + ')'; ctx.lineWidth = 3; ctx.stroke();
    }
    const dt = 0.016;
    this.particles = this.particles.filter(q => q.life > 0);
    for (const q of this.particles) {
      q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 400 * dt; q.life -= dt * 0.9;
      ctx.globalAlpha = Math.max(0, q.life); ctx.fillStyle = q.color;
      ctx.fillRect(q.x, q.y, q.size, q.size);
    }
    ctx.globalAlpha = 1;
  }
}

AA.Viewer = Viewer;
})(typeof globalThis !== 'undefined' ? globalThis : window);
