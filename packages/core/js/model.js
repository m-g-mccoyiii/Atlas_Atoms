(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
const E = AA.ELEMENTS, C = AA.chem;

const K_BOND = 60, K_ANGLE = 30, K_REP = 15;

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const v3 = {
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  len: a => Math.hypot(a[0], a[1], a[2]),
  norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  perp: a => { const ax = Math.abs(a[0]) < 0.7 ? [1, 0, 0] : [0, 1, 0]; return v3.norm(v3.cross(a, ax)); }
};

class Model {
  constructor() { this.atoms = []; this.bonds = []; this._id = 1; }

  addAtom(el, x, y, z) {
    const a = { id: this._id++, el, x: x || 0, y: y || 0, z: z || (Math.random() - 0.5) * 0.1, vx: 0, vy: 0, vz: 0, pinned: false };
    this.atoms.push(a);
    return a;
  }
  findBond(a, b) { return this.bonds.find(k => (k.a === a && k.b === b) || (k.a === b && k.b === a)); }
  bondSum(a) { let s = 0; for (const k of this.bonds) if (k.a === a || k.b === a) s += k.order; return s; }
  neighbors(a) {
    const r = [];
    for (const k of this.bonds) { if (k.a === a) r.push({ atom: k.b, bond: k }); else if (k.b === a) r.push({ atom: k.a, bond: k }); }
    return r;
  }
  canBond(a, b) {
    if (a === b) return false;
    const ex = this.findBond(a, b);
    return this.bondSum(a) < C.maxValence(a.el) && this.bondSum(b) < C.maxValence(b.el) && (!ex || ex.order < 3);
  }
  bond(a, b) {
    const ex = this.findBond(a, b);
    if (ex) ex.order++; else this.bonds.push({ a, b, order: 1 });
  }
  unbond(k) {
    if (k.order > 1) k.order--;
    else this.bonds = this.bonds.filter(x => x !== k);
  }
  removeAtom(a) {
    this.bonds = this.bonds.filter(k => k.a !== a && k.b !== a);
    this.atoms = this.atoms.filter(x => x !== a);
  }
  clear() { this.atoms = []; this.bonds = []; }

  components() {
    const seen = new Set(), out = [];
    for (const a of this.atoms) {
      if (seen.has(a)) continue;
      const comp = [], q = [a]; seen.add(a);
      while (q.length) {
        const c = q.pop(); comp.push(c);
        for (const n of this.neighbors(c)) if (!seen.has(n.atom)) { seen.add(n.atom); q.push(n.atom); }
      }
      out.push(comp);
    }
    return out;
  }

  analyze() {
    const lib = C.library();
    return this.components().map(atoms => {
      const set = new Set(atoms);
      const bonds = this.bonds.filter(k => set.has(k.a));
      const idx = new Map(atoms.map((a, i) => [a, i]));
      const els = atoms.map(a => a.el);
      const gb = bonds.map(k => ({ a: idx.get(k.a), b: idx.get(k.b), order: k.order }));
      const counts = {};
      els.forEach(e => { counts[e] = (counts[e] || 0) + 1; });
      const formula = C.formulaOf(counts);
      const sig = C.signature(els, gb);
      const mol = lib.bySig.get(sig) || null;
      const sameFormula = !mol ? lib.list.find(m => m.formula === formula) || null : null;
      const unhappy = atoms.filter(a => !E[a.el].valences.includes(this.bondSum(a)));
      return { atoms, bonds, counts, formula, sig, mol, sameFormula, unhappy };
    });
  }

  // number of electron domains used to pick an ideal bond angle
  _domains(a) {
    const sum = this.bondSum(a);
    const eff = C.effValence(a.el, sum) || sum;
    return { n: this.neighbors(a).length + (eff - sum) + C.lonePairs(a.el, sum), lp: C.lonePairs(a.el, sum) };
  }
  _targetAngle(a) {
    const d = this._domains(a);
    if (d.n <= 2) return 180;
    if (d.n === 3) return 120;
    return d.lp === 2 ? 104.5 : d.lp === 1 ? 107 : 109.5;
  }

  lonePairDirs(a) {
    const lp = C.lonePairs(a.el, this.bondSum(a));
    if (!lp) return [];
    const nb = this.neighbors(a).map(n => v3.norm([n.atom.x - a.x, n.atom.y - a.y, n.atom.z - a.z]));
    if (nb.length === 0) {
      const T = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(v3.norm);
      return T.slice(0, Math.min(lp, 4));
    }
    let s = [0, 0, 0];
    nb.forEach(u => { s = v3.add(s, u); });
    let b = v3.mul(s, -1);
    if (v3.len(b) < 0.2) b = v3.perp(nb[0]);
    b = v3.norm(b);
    // The sideways axis is remembered between frames so the lobes never flip when the atoms move a little.
    const prev = a._lpFrame;
    let p = nb.length >= 2 ? v3.cross(nb[0], nb[1]) : null;
    if (!p || v3.len(p) < 0.15) {
      if (prev) { const d = prev[0] * nb[0][0] + prev[1] * nb[0][1] + prev[2] * nb[0][2]; p = v3.sub(prev, v3.mul(nb[0], d)); }
      if (!p || v3.len(p) < 0.1) p = v3.perp(nb[0]);
    } else if (prev && (p[0] * prev[0] + p[1] * prev[1] + p[2] * prev[2]) < 0) p = v3.mul(p, -1);
    p = v3.norm(p);
    a._lpFrame = p;
    if (lp === 1) return [b];
    if (lp === 2) {
      const c = nb.length >= 2 ? 0.58 : 0.5, sn = nb.length >= 2 ? 0.82 : 0.866;
      return [v3.norm(v3.add(v3.mul(b, c), v3.mul(p, sn))), v3.norm(v3.add(v3.mul(b, c), v3.mul(p, -sn)))];
    }
    const q = v3.cross(b, p), out = [];
    for (let i = 0; i < lp; i++) {
      const f = i * 2 * Math.PI / 3;
      out.push(v3.norm(v3.add(v3.mul(b, 0.333), v3.mul(v3.add(v3.mul(p, Math.cos(f)), v3.mul(q, Math.sin(f))), 0.943))));
    }
    return out;
  }

  _forces(F) {
    const atoms = this.atoms, n = atoms.length;
    const idx = new Map(); atoms.forEach((a, i) => idx.set(a, i));
    const adj = atoms.map(() => []);
    const excl = new Set();
    const key = (i, j) => i < j ? i * n + j : j * n + i;
    let En = 0;
    const spring = (i, j, rest, k, oneSided) => {
      const a = atoms[i], b = atoms[j];
      let dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
      let L = Math.hypot(dx, dy, dz);
      if (L < 1e-6) { dx = (Math.random() - 0.5) * 1e-3; dy = (Math.random() - 0.5) * 1e-3; dz = (Math.random() - 0.5) * 1e-3; L = Math.hypot(dx, dy, dz); }
      const s = L - rest;
      if (oneSided && s >= 0) return;
      En += 0.5 * k * s * s;
      const f = k * s / L;
      F[i * 3] += f * dx; F[i * 3 + 1] += f * dy; F[i * 3 + 2] += f * dz;
      F[j * 3] -= f * dx; F[j * 3 + 1] -= f * dy; F[j * 3 + 2] -= f * dz;
    };
    for (const b of this.bonds) {
      const i = idx.get(b.a), j = idx.get(b.b);
      adj[i].push({ j, rest: C.bondRest(b.a.el, b.b.el, b.order) });
      adj[j].push({ j: i, rest: C.bondRest(b.a.el, b.b.el, b.order) });
      excl.add(key(i, j));
      spring(i, j, C.bondRest(b.a.el, b.b.el, b.order), K_BOND);
    }
    for (let c = 0; c < n; c++) {
      const nb = adj[c];
      if (nb.length < 2) continue;
      const cos = Math.cos(this._targetAngle(atoms[c]) * Math.PI / 180);
      for (let p = 0; p < nb.length; p++) for (let q = p + 1; q < nb.length; q++) {
        const ri = nb[p].rest, rj = nb[q].rest;
        const D = Math.sqrt(Math.max(0.01, ri * ri + rj * rj - 2 * ri * rj * cos));
        spring(nb[p].j, nb[q].j, D, K_ANGLE);
        excl.add(key(nb[p].j, nb[q].j));
      }
    }
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (atoms[i].pinned || atoms[j].pinned || excl.has(key(i, j))) continue;
      const dmin = 0.72 * (E[atoms[i].el].vdw + E[atoms[j].el].vdw);
      spring(i, j, dmin, K_REP, true);
    }
    return En;
  }

  step(dt, damp) {
    const n = this.atoms.length;
    if (!n) return 0;
    dt = dt || 0.012; damp = damp || 0.88;
    const F = new Float64Array(n * 3);
    const En = this._forces(F);
    for (let i = 0; i < n; i++) {
      const a = this.atoms[i];
      if (a.pinned) { a.vx = a.vy = a.vz = 0; continue; }
      a.vx = (a.vx + F[i * 3] * dt) * damp; a.vy = (a.vy + F[i * 3 + 1] * dt) * damp; a.vz = (a.vz + F[i * 3 + 2] * dt) * damp;
      const sp = Math.hypot(a.vx, a.vy, a.vz);
      if (sp > 6) { const s = 6 / sp; a.vx *= s; a.vy *= s; a.vz *= s; }
      a.x += a.vx * dt; a.y += a.vy * dt; a.z += a.vz * dt;
    }
    return En;
  }
  energy() { const F = new Float64Array(this.atoms.length * 3); return this._forces(F); }
  settle(iters) { for (let i = 0; i < iters; i++) this.step(0.02, i < 200 ? 0.8 : 0.9); }
  center() {
    if (!this.atoms.length) return;
    let x = 0, y = 0, z = 0;
    this.atoms.forEach(a => { x += a.x; y += a.y; z += a.z; });
    x /= this.atoms.length; y /= this.atoms.length; z /= this.atoms.length;
    this.atoms.forEach(a => { a.x -= x; a.y -= y; a.z -= z; });
  }

  static fromSmiles(smi, seed) {
    const g = C.parseSmiles(smi), m = new Model(), rnd = mulberry32(seed || 1);
    const adj = g.atoms.map(() => []);
    g.bonds.forEach(b => { adj[b.a].push(b); adj[b.b].push(b); });
    const placed = g.atoms.map(() => null);
    placed[0] = m.addAtom(g.atoms[0].el, 0, 0, 0);
    const q = [0];
    while (q.length) {
      const i = q.shift();
      for (const b of adj[i]) {
        const j = b.a === i ? b.b : b.a;
        if (placed[j]) continue;
        const r = C.bondRest(g.atoms[i].el, g.atoms[j].el, b.order);
        const u = v3.norm([rnd() - 0.5, rnd() - 0.5, (rnd() - 0.5) * 0.3]);
        placed[j] = m.addAtom(g.atoms[j].el, placed[i].x + u[0] * r, placed[i].y + u[1] * r, placed[i].z + u[2] * r);
        q.push(j);
      }
    }
    g.bonds.forEach(b => m.bonds.push({ a: placed[b.a], b: placed[b.b], order: b.order }));
    // molecules with no sp3 atoms (benzene, ethylene...) start exactly flat so they stay flat
    if (m.atoms.every(a => m._domains(a).n <= 3)) m.atoms.forEach(a => { a.z = 0; });
    return m;
  }
  static fromSmilesRelaxed(smi, tries) {
    let best = null, bestE = Infinity;
    for (let s = 1; s <= (tries || 8); s++) {
      const m = Model.fromSmiles(smi, s * 7919);
      m.settle(900);
      const e = m.energy();
      if (e < bestE) { best = m; bestE = e; }
    }
    best.center();
    return best;
  }
}

AA.Model = Model;
AA.v3 = v3;
if (typeof module !== 'undefined') module.exports = Model;
})(typeof globalThis !== 'undefined' ? globalThis : window);
