(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
const E = AA.ELEMENTS, C = AA.chem, T = root.THREE;

const BALL = el => Math.min(0.62, 0.2 + 0.36 * E[el].cov);
const col = hex => new T.Color(hex).convertSRGBToLinear();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- shared geometry / textures (never disposed) ----
const G = {
  sphere: new T.SphereGeometry(1, 64, 44),
  cyl: new T.CylinderGeometry(1, 1, 1, 16, 1),
  plane: new T.PlaneGeometry(1, 1)
};
const labelCache = {};
function labelMat(sym, color, soft) {
  const key = sym + color + (soft ? 's' : '');
  if (labelCache[key]) return labelCache[key];
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.font = 'bold 84px "Trebuchet MS", system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  if (!soft) { x.lineWidth = 8; x.strokeStyle = 'rgba(0,0,0,.35)'; x.strokeText(sym, 64, 68); }
  x.fillStyle = color; x.fillText(sym, 64, 68);
  const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding; tex.anisotropy = 4;
  return (labelCache[key] = new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
}
function textOn(hex) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
  return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? '#14202e' : '#ffffff';
}
const glow = (hex, op) => new T.MeshBasicMaterial({ color: col(hex), transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false });
const basic = (hex, op) => new T.MeshBasicMaterial({ color: col(hex), transparent: op !== undefined && op < 1, opacity: op === undefined ? 1 : op });

// teardrop lobe along +Y, base at origin
function lobeGeo(L, w) {
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    pts.push(new T.Vector2(Math.max(0.001, w * Math.pow(Math.sin(Math.PI * t), 0.85) * (0.35 + 0.65 * t)), t * L));
  }
  return new T.LatheGeometry(pts, 20);
}
const lobeCache = {};
const lobe = (L, w) => lobeCache[L + '_' + w] || (lobeCache[L + '_' + w] = lobeGeo(L, w));

const Y = new T.Vector3(0, 1, 0);

class Viewer {
  constructor(canvas, model, opts) {
    opts = opts || {};
    this.canvas = canvas; this.model = model;
    this.mode = opts.mode || 'ball';
    this.interactive = !!opts.interactive;
    this.autoRotate = !!opts.autoRotate;
    this.autoFit = !!opts.autoFit;
    this.faces = opts.faces !== false;
    this.yaw = opts.yaw !== undefined ? opts.yaw : 0.45;
    this.pitch = opts.pitch !== undefined ? opts.pitch : 0.25;
    this.zoom = opts.zoom || 60;
    this.tool = 'build'; this.cb = {}; this.time = 0;
    this.hover = null; this.hoverBond = null; this.drag = null; this.rot = null; this.target = null;
    this.glow = new Map(); this.glowBonds = new Map();   // atom or bond -> emissive colour, pulsed; used to point at what a signal comes from
    this.yawVel = 0; this.pitchVel = 0; this.pan = new T.Vector3();
    this.touches = new Map(); this.pinch = null;
    this.w = 300; this.h = 300;

    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, (window.matchMedia && matchMedia('(pointer: coarse)').matches) ? 1.5 : 2));
    this.renderer.outputEncoding = T.sRGBEncoding;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = T.PCFSoftShadowMap;   // soft shadows give space-filling models their depth
    this.scene = new T.Scene();
    this.camera = new T.PerspectiveCamera(40, 1, 0.1, 300);
    this.scene.add(this.camera);
    this.hemi = new T.HemisphereLight(0xffffff, 0x1b2c4a, 0.85); this.scene.add(this.hemi);
    const key = new T.DirectionalLight(0xffffff, 1.0); key.position.set(3, 5, 6); this.camera.add(key); this.scene.add(key.target);
    key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; key.shadow.radius = 4;
    Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 0.5, far: 60 });
    const rim = new T.DirectionalLight(0x6fd8ff, 0.4); rim.position.set(-4, -2, -3); this.camera.add(rim);
    this.key = key; this.rim = rim;
    this.root = new T.Group(); this.scene.add(this.root);
    if (this.interactive) {
      const gt = opts.grid || {};
      const grid = new T.GridHelper(26, 26, gt.main !== undefined ? gt.main : 0x2f6aa0, gt.sub !== undefined ? gt.sub : 0x1d3d63);
      grid.position.y = -4.6; grid.material.transparent = true; grid.material.opacity = gt.opacity !== undefined ? gt.opacity : 0.4;
      this.scene.add(grid);
    }
    this.ring = new T.Mesh(new T.TorusGeometry(1, 0.06, 8, 40), new T.MeshBasicMaterial({ color: col('#7dffb0') }));
    this.ring.visible = false; this.scene.add(this.ring);

    this.atomObjs = new Map(); this.bondObjs = new Map(); this.builtMode = null;
    this.pops = new Map();
    this.raycaster = new T.Raycaster();

    // particles
    this.NP = 400; this.pi = 0;
    this.pPos = new Float32Array(this.NP * 3); this.pCol = new Float32Array(this.NP * 3);
    this.pVel = new Float32Array(this.NP * 3); this.pLife = new Float32Array(this.NP);
    const pg = new T.BufferGeometry();
    pg.setAttribute('position', new T.BufferAttribute(this.pPos, 3));
    pg.setAttribute('color', new T.BufferAttribute(this.pCol, 3));
    this.points = new T.Points(pg, new T.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, depthWrite: false }));
    this.points.frustumCulled = false; this.scene.add(this.points);

    this._bind();
    this.resize();
    if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(canvas);
  }

  dispose() {
    this._dead = true;
    window.removeEventListener('pointerup', this._tUp);
    this.renderer.dispose();
    try { this.renderer.forceContextLoss(); } catch (e) { /* ignore */ }
  }
  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.w = w; this.h = h;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }

  // ---------- helpers ----------
  _pxPerA(pos) {
    const d = this.camera.position.distanceTo(pos);
    return this.h / (2 * Math.tan(T.MathUtils.degToRad(this.camera.fov / 2)) * d);
  }
  _screen(a) {
    const v = new T.Vector3(a.x, a.y, a.z).project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * this.w, y: (-v.y * 0.5 + 0.5) * this.h };
  }
  _radius(a) {
    if (this.mode === 'space') return E[a.el].vdw * 0.9;
    if (this.mode === 'orbital') return 0.2;
    if (this.mode === 'lewis') return 0.3;
    return BALL(a.el);
  }
  randomSpot() {
    this.camera.updateMatrixWorld();
    const r = new T.Vector3(), u = new T.Vector3();
    this.camera.matrixWorld.extractBasis(r, u, new T.Vector3());
    const x = (Math.random() - 0.5) * 6, y = (Math.random() - 0.5) * 3;
    return [r.x * x + u.x * y + this.pan.x, r.y * x + u.y * y + this.pan.y, r.z * x + u.z * y + this.pan.z];
  }
  pop(a) { this.pops.set(a, this.time); }
  burst(p, n, colors) {
    colors = colors || ['#ffd23f', '#3dd6c6', '#ff6b8b', '#8ab4ff'];
    for (let i = 0; i < (n || 40); i++) {
      const k = this.pi; this.pi = (this.pi + 1) % this.NP;
      const d = new T.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(1.5 + Math.random() * 3.5);
      this.pPos.set([p.x, p.y, p.z], k * 3); this.pVel.set([d.x, d.y + 1.5, d.z], k * 3); this.pLife[k] = 1;
      const c = col(colors[i % colors.length]); this.pCol.set([c.r, c.g, c.b], k * 3);
    }
  }
  burstAtoms(atoms, n) {
    if (!atoms.length) return;
    const p = new T.Vector3();
    atoms.forEach(a => p.add(new T.Vector3(a.x, a.y, a.z)));
    p.divideScalar(atoms.length);
    this.burst(p, n || 50);
  }

  // ---------- input ----------
  _bind() {
    const c = this.canvas;
    c.addEventListener('pointerdown', e => this._down(e));
    c.addEventListener('pointermove', e => {
      if (this.touches.has(e.pointerId)) {
        this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.pinch && this.touches.size === 2) {
          const [p, q] = [...this.touches.values()];
          this.zoom = clamp(this.pinch.z0 * Math.hypot(p.x - q.x, p.y - q.y) / this.pinch.d0, 25, 130);
        }
      }
      if (!this.drag && !this.rot) this._hoverUpdate(e);
    });
    c.addEventListener('pointerleave', () => { if (!this.drag) { this.hover = null; this.hoverBond = null; } });
    c.addEventListener('wheel', e => { e.preventDefault(); this.zoom = clamp(this.zoom * (e.deltaY > 0 ? 0.92 : 1.08), 25, 130); }, { passive: false });
    c.addEventListener('contextmenu', e => e.preventDefault());
    this._tUp = e => { this.touches.delete(e.pointerId); if (this.touches.size < 2) this.pinch = null; };
    window.addEventListener('pointerup', this._tUp);
    window.addEventListener('pointercancel', this._tUp);
  }
  _ray(e) {
    const r = this.canvas.getBoundingClientRect();
    this.camera.updateMatrixWorld();
    this.raycaster.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -(((e.clientY - r.top) / r.height) * 2 - 1) }, this.camera);
  }
  hitAtom(e) {
    this._ray(e);
    const hits = this.raycaster.intersectObjects([...this.atomObjs.values()].map(o => o.body), false);
    return hits.length ? hits[0].object.userData.atom : null;
  }
  hitBond(e) {
    this._ray(e);
    const hits = this.raycaster.intersectObjects([...this.bondObjs.values()].map(o => o.hit).filter(Boolean), false);
    return hits.length ? hits[0].object.userData.bond : null;
  }
  _hoverUpdate(e) {
    if (!this.interactive) return;
    this.hover = this.hitAtom(e);
    this.hoverBond = this.tool === 'cut' && !this.hover ? this.hitBond(e) : null;
  }
  _down(e) {
    if (e.pointerType === 'touch') {
      this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.touches.size === 2) {
        const [p, q] = [...this.touches.values()];
        this.pinch = { d0: Math.hypot(p.x - q.x, p.y - q.y) || 1, z0: this.zoom };
        this.rot = null; return;
      }
    }
    if (this.interactive) {
      if (this.tool === 'cut') { const b = this.hitBond(e); if (b && this.cb.onCut) this.cb.onCut(b); return; }
      const a = this.hitAtom(e);
      if (a) { this.startDrag(a, e); return; }
    }
    this.yawVel = this.pitchVel = 0;
    this.rot = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, t: performance.now(), pan: e.shiftKey || e.button === 2 || e.button === 1 };
    this._listen();
  }
  startDrag(a, e) {
    a.pinned = true; this.drag = { atom: a, sx: e.clientX, sy: e.clientY, moved: false }; this.target = null;
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
    if (this.pinch) return;
    if (this.drag) { this._dragMove(e); return; }
    if (!this.rot) return;
    const now = performance.now(), dx = e.clientX - this.rot.lx, dy = e.clientY - this.rot.ly, dt = Math.max(1, now - this.rot.t) / 1000;
    this.rot.lx = e.clientX; this.rot.ly = e.clientY; this.rot.t = now;
    if (this.rot.pan) {
      const r = new T.Vector3(), u = new T.Vector3();
      this.camera.matrixWorld.extractBasis(r, u, new T.Vector3());
      const k = 1 / this._pxPerA(this.pan);
      this.pan.addScaledVector(r, -dx * k).addScaledVector(u, dy * k);
      return;
    }
    this.yaw -= dx * 0.008; this.pitch = clamp(this.pitch + dy * 0.008, -1.45, 1.45);
    this.yawVel = clamp(-dx * 0.008 / dt, -6, 6); this.pitchVel = 0;
  }
  _dragMove(e) {
    const a = this.drag.atom, r = this.canvas.getBoundingClientRect();
    if (Math.hypot(e.clientX - this.drag.sx, e.clientY - this.drag.sy) > 5) this.drag.moved = true;
    const nx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -0.9, 0.9), ny = clamp(-(((e.clientY - r.top) / r.height) * 2 - 1), -0.86, 0.86);
    this.camera.updateMatrixWorld();
    this.raycaster.setFromCamera({ x: nx, y: ny }, this.camera);
    const n = new T.Vector3(); this.camera.getWorldDirection(n);
    const origin = new T.Vector3(a.x, a.y, a.z);
    if (this.target) {
      const t = new T.Vector3(this.target.x, this.target.y, this.target.z);
      origin.addScaledVector(n, t.sub(origin).dot(n) * 0.15);
    }
    const plane = new T.Plane().setFromNormalAndCoplanarPoint(n, origin), p = new T.Vector3();
    if (this.raycaster.ray.intersectPlane(plane, p)) { a.x = p.x; a.y = p.y; a.z = p.z; a.vx = a.vy = a.vz = 0; }
    this.target = this.findTarget(a);
  }
  findTarget(a) {
    const pa = this._screen(a);
    let best = null, bd = Infinity;
    for (const b of this.model.atoms) {
      if (b === a) continue;
      const pb = this._screen(b), d = Math.hypot(pa.x - pb.x, pa.y - pb.y);
      const k = this._pxPerA(new T.Vector3(b.x, b.y, b.z));
      const thr = (BALL(a.el) + BALL(b.el)) * k * 0.7 + 6;
      if (d < thr && d < bd) { bd = d; best = b; }
    }
    return best;
  }
  _up(e) {
    if (this.drag) {
      const a = this.drag.atom, t = this.target, moved = this.drag.moved;
      a.pinned = false; this.drag = null; this.target = null;
      if (!moved && !a.fromTray && this.cb.onPoke) this.cb.onPoke(a);
      else if (this.cb.onDrop) this.cb.onDrop(a, t, e);
    }
    this.rot = null;
  }

  // ---------- scene sync ----------
  _clearObjs() {
    for (const o of this.atomObjs.values()) this.root.remove(o.group);
    for (const o of this.bondObjs.values()) this.root.remove(o.group);
    this.atomObjs.clear(); this.bondObjs.clear();
  }

  _buildAtom(a) {
    const group = new T.Group(), R = this._radius(a), el = E[a.el];
    const o = { group, sig: '', deco: null, R, lobes: [], dots: [] };
    const mode = this.mode;
    if (mode === 'ball' || mode === 'space') {
      if (mode === 'space') {      // matte, lighter carbon, casts and receives soft shadows
        o.mat = new T.MeshStandardMaterial({ color: col(a.el === 'C' ? '#6f7b98' : el.color), roughness: 0.62, metalness: 0 });
      } else o.mat = new T.MeshStandardMaterial({ color: col(el.color), roughness: 0.3, metalness: 0.08 });
      o.body = new T.Mesh(G.sphere, o.mat); o.body.scale.setScalar(R);
      o.body.castShadow = o.body.receiveShadow = (mode === 'space');
    } else if (mode === 'orbital') {
      o.mat = new T.MeshStandardMaterial({ color: col(el.color), roughness: 0.4, metalness: 0 });
      o.body = new T.Mesh(G.sphere, o.mat); o.body.scale.setScalar(R);
      const s = new T.Mesh(G.sphere, glow(el.color, 0.28));
      s.scale.setScalar(a.el === 'H' ? 0.55 : Math.min(0.85, el.cov * 0.9 + 0.2)); group.add(s);
    } else {
      o.mat = new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      o.body = new T.Mesh(G.sphere, o.mat); o.body.scale.setScalar(R);
    }
    o.body.userData.atom = a;
    group.add(o.body);
    o.bb = new T.Group(); group.add(o.bb);          // billboard (faces camera)
    this.root.add(group);
    return o;
  }

  _decorate(o, a, sum) {
    // remove old decorations
    if (o.deco) { o.bb.remove(o.deco); }
    if (o.lobes.length) { o.lobes.forEach(l => o.group.remove(l.mesh)); o.lobes = []; }
    if (o.dots.length) { o.dots.forEach(d => o.group.remove(d)); o.dots = []; }
    const d = new T.Group(); o.deco = d; o.bb.add(d);
    const R = o.R, el = E[a.el], mode = this.mode;
    const happy = el.valences.includes(sum) && sum > 0;
    const tc = textOn(el.color);
    const face = this.faces && mode === 'ball' && R >= 0.4;

    if (mode === 'space') {          // space-filling: small, quiet labels, none on white hydrogen
      if (a.el !== 'H') { const sl = new T.Mesh(G.plane, labelMat(a.el, tc, true)); sl.scale.set(R * 0.5, R * 0.5, 1); sl.position.set(0, 0, R * 1.0); d.add(sl); }
      return;
    }
    if (mode === 'ball') {
      const lab = new T.Mesh(G.plane, labelMat(a.el, tc));
      const sz = R * (face ? 0.85 : 1.15);
      lab.scale.set(sz, sz, 1); lab.position.set(0, face ? -R * 0.3 : 0, R * 1.02);
      d.add(lab);
      if (mode === 'space') return;
      if (face) {
        const black = basic('#14202e'), white = basic('#ffffff');
        for (const s of [-1, 1]) {
          if (happy) {
            const arc = new T.Mesh(new T.TorusGeometry(R * 0.12, R * 0.035, 8, 16, Math.PI), black);
            arc.position.set(s * R * 0.3, R * 0.2, R * 0.96); d.add(arc);
          } else {
            const eye = new T.Mesh(G.sphere, white); eye.scale.setScalar(R * 0.14); eye.position.set(s * R * 0.3, R * 0.27, R * 0.9); d.add(eye);
            const pu = new T.Mesh(G.sphere, black); pu.scale.setScalar(R * 0.08); pu.position.set(s * R * 0.3, R * 0.27, R * 0.9 + R * 0.1); d.add(pu);
          }
        }
      }
      if (happy && this.interactive) {
        const ring = new T.Mesh(new T.TorusGeometry(R * 1.12, 0.035, 8, 40), basic('#7dffb0', 0.8)); d.add(ring);
      }
      if (this.interactive) {
        const eff = C.effValence(a.el, sum) || sum, n = Math.max(eff, sum), gap = 0.19;
        for (let i = 0; i < n; i++) {
          const x = (i - (n - 1) / 2) * gap, y = -R - 0.22;
          if (i < sum) { const m = new T.Mesh(G.sphere, basic('#7dffb0')); m.scale.setScalar(0.055); m.position.set(x, y, 0.1); d.add(m); }
          else { const m = new T.Mesh(new T.TorusGeometry(0.06, 0.018, 6, 16), basic('#ffd23f')); m.position.set(x, y, 0.1); d.add(m); }
        }
      }
      const ion = this.model.neighbors(a).some(n => C.isIonic(a.el, n.atom.el));
      if (ion) {
        const ch = new T.Mesh(G.plane, labelMat(a.el === 'Na' ? '+' : '−', '#ffd23f'));
        ch.scale.set(0.5, 0.5, 1); ch.position.set(R * 0.9, R * 0.9, R); d.add(ch);
      }
    } else if (mode === 'orbital') {
      const lab = new T.Mesh(G.plane, labelMat(a.el, textOn(el.color)));
      lab.scale.set(0.34, 0.34, 1); lab.position.set(0, 0, 0.25); d.add(lab);
      const alone = this.model.neighbors(a).length === 0;
      if (alone && a.el !== 'H') {
        const L = el.cov * 1.1 + 0.5, w = 0.3;
        [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(ax => [1, -1].forEach(s => {
          const m = new T.Mesh(lobe(L, w), glow(s > 0 ? '#6aa8ff' : '#ff9a6a', 0.55));
          m.quaternion.setFromUnitVectors(Y, new T.Vector3(ax[0] * s, ax[1] * s, ax[2] * s));
          o.group.add(m); o.lobes.push({ mesh: m, fixed: true });
        }));
      } else {
        const n = C.lonePairs(a.el, sum);
        for (let i = 0; i < n; i++) {
          const m = new T.Mesh(lobe(0.95, 0.3), glow('#ffd37a', 0.6));
          o.group.add(m); o.lobes.push({ mesh: m, idx: i });
        }
      }
    } else { // lewis
      const lab = new T.Mesh(G.plane, labelMat(a.el, '#e8f0fb'));
      lab.scale.set(0.8, 0.8, 1); d.add(lab);
      for (let i = 0; i < 8; i++) {
        const m = new T.Mesh(G.sphere, basic('#ffd23f')); m.scale.setScalar(0.065); m.visible = false;
        o.group.add(m); o.dots.push(m);
      }
      const ion = this.model.neighbors(a).some(n => C.isIonic(a.el, n.atom.el));
      if (ion) {
        const ch = new T.Mesh(G.plane, labelMat(a.el === 'Na' ? '+' : '−', '#ffd23f'));
        ch.scale.set(0.45, 0.45, 1); ch.position.set(0.4, 0.4, 0); d.add(ch);
      }
    }
  }

  _buildBond(b) {
    const group = new T.Group(), o = { group, order: b.order, parts: [], hit: null };
    const ion = C.isIonic(b.a.el, b.b.el), mode = this.mode;
    if (ion) {
      for (let i = 0; i < 7; i++) {
        const m = new T.Mesh(G.cyl, mode === 'orbital' ? glow('#ffd23f', 0.8) : new T.MeshStandardMaterial({ color: col('#ffd23f'), emissive: col('#a67c00'), roughness: 0.4 }));
        group.add(m); o.parts.push({ m, k: i });
      }
      o.kind = 'ion';
    } else if (mode === 'orbital') {
      const n = b.order;
      for (let i = 0; i < n; i++) {
        const m1 = new T.Mesh(G.sphere, glow('#7be7ff', 0.28)), m2 = new T.Mesh(G.sphere, glow('#b9f3ff', 0.3));
        group.add(m1); group.add(m2); o.parts.push({ m1, m2, off: n === 1 ? 0 : n === 2 ? (i - 0.5) * 0.4 : (i - 1) * 0.5 });
      }
      const line = new T.Mesh(G.cyl, basic('#ffffff', 0.18)); group.add(line); o.line = line;
      o.kind = 'orb';
    } else {
      const lew = mode === 'lewis', n = b.order;
      const offs = n === 1 ? [0] : n === 2 ? [-0.5, 0.5] : [-1, 0, 1];
      offs.forEach(f => {
        if (lew) {
          const m = new T.Mesh(G.cyl, basic('#e8f0fb')); group.add(m); o.parts.push({ m, f });
        } else {
          const ma = new T.Mesh(G.cyl, new T.MeshStandardMaterial({ color: col(E[b.a.el].color), roughness: 0.35 }));
          const mb = new T.Mesh(G.cyl, new T.MeshStandardMaterial({ color: col(E[b.b.el].color), roughness: 0.35 }));
          group.add(ma); group.add(mb); o.parts.push({ ma, mb, f });
        }
      });
      o.kind = lew ? 'lew' : 'stick';
    }
    if (this.interactive) {
      const hit = new T.Mesh(G.cyl, new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
      hit.userData.bond = b; group.add(hit); o.hit = hit;
    }
    this.root.add(group);
    return o;
  }

  _updateBond(o, b) {
    const A = new T.Vector3(b.a.x, b.a.y, b.a.z), B = new T.Vector3(b.b.x, b.b.y, b.b.z);
    const u = B.clone().sub(A), len = u.length();
    if (len < 1e-4) return;
    u.divideScalar(len);
    const q = new T.Quaternion().setFromUnitVectors(Y, u);
    const fwd = new T.Vector3(); this.camera.getWorldDirection(fwd);
    let perp = new T.Vector3().crossVectors(u, fwd);
    if (perp.lengthSq() < 1e-6) perp.set(1, 0, 0);
    perp.normalize();
    const place = (m, from, to, r, off) => {
      const c = from.clone().add(to).multiplyScalar(0.5).addScaledVector(perp, off);
      m.position.copy(c); m.quaternion.copy(q); m.scale.set(r, from.distanceTo(to), r);
    };
    const mid = A.clone().add(B).multiplyScalar(0.5);
    if (o.kind === 'ion') {
      const seg = len / 7;
      o.parts.forEach(p => {
        const f = A.clone().addScaledVector(u, seg * (p.k + 0.2)), t = A.clone().addScaledVector(u, seg * (p.k + 0.8));
        place(p.m, f, t, 0.05, 0);
      });
    } else if (o.kind === 'orb') {
      o.parts.forEach(p => {
        const c = mid.clone().addScaledVector(perp, p.off);
        p.m1.position.copy(c); p.m1.quaternion.copy(q); p.m1.scale.set(0.22, len / 2 + 0.2, 0.22);
        p.m2.position.copy(c); p.m2.quaternion.copy(q); p.m2.scale.set(0.12, len / 2 + 0.05, 0.12);
      });
      place(o.line, A, B, 0.015, 0);
    } else if (o.kind === 'lew') {
      const ga = b.a.el === 'H' ? 0.22 : 0.34, gb = b.b.el === 'H' ? 0.22 : 0.34;
      const from = A.clone().addScaledVector(u, ga), to = B.clone().addScaledVector(u, -gb);
      if (from.distanceTo(to) < 0.05 || to.clone().sub(from).dot(u) < 0) { o.parts.forEach(p => { p.m.visible = false; }); }
      else o.parts.forEach(p => { p.m.visible = true; place(p.m, from, to, 0.028, p.f * 0.12); });
    } else {
      const multi = b.order > 1, r = multi ? 0.06 : 0.09, sp = 0.17;
      o.parts.forEach(p => { place(p.ma, A, mid, r, p.f * sp); place(p.mb, mid, B, r, p.f * sp); });
    }
    if (o.hit) {
      o.hit.visible = true;
      place(o.hit, A, B, 0.2, 0);
    }
    // cut-tool highlight
    const hot = this.hoverBond === b && this.tool === 'cut', gb = this.glowBonds.get(b), hx = gb !== undefined ? gb : hot ? 0xaa2222 : 0;
    if (o.kind === 'stick') o.parts.forEach(p => { p.ma.material.emissive.setHex(hx); p.mb.material.emissive.setHex(hx); });
  }

  _sync(dt) {
    if (this.builtMode !== this.mode || this.builtFaces !== this.faces) {
      this._clearObjs(); this.builtMode = this.mode; this.builtFaces = this.faces;
      const sp = this.mode === 'space'; this.key.castShadow = sp; this.rim.intensity = sp ? 0.1 : 0.4;
      this.hemi.intensity = sp ? 0.42 : 0.85; this.key.intensity = sp ? 1.35 : 1.0;   // more contrast in the crevices
    }
    const atoms = new Set(this.model.atoms), bonds = new Set(this.model.bonds);
    for (const [a, o] of this.atomObjs) if (!atoms.has(a)) { this.root.remove(o.group); this.atomObjs.delete(a); }
    for (const [b, o] of this.bondObjs) if (!bonds.has(b) || o.order !== b.order) { this.root.remove(o.group); this.bondObjs.delete(b); }
    for (const b of this.model.bonds) if (!this.bondObjs.has(b)) this.bondObjs.set(b, this._buildBond(b));
    for (const a of this.model.atoms) if (!this.atomObjs.has(a)) this.atomObjs.set(a, this._buildAtom(a));
    for (const [b, o] of this.bondObjs) this._updateBond(o, b);

    const sums = new Map();
    this.model.atoms.forEach(a => sums.set(a, 0));
    this.model.bonds.forEach(b => { sums.set(b.a, sums.get(b.a) + b.order); sums.set(b.b, sums.get(b.b) + b.order); });
    const right = new T.Vector3(), up = new T.Vector3();
    this.camera.matrixWorld.extractBasis(right, up, new T.Vector3());

    for (const [a, o] of this.atomObjs) {
      const sum = sums.get(a), nb = this.model.neighbors(a).length;
      const sig = sum + '|' + nb + '|' + (this.interactive ? 1 : 0);
      if (sig !== o.sig) { o.sig = sig; this._decorate(o, a, sum); }
      o.group.position.set(a.x, a.y, a.z);
      o.bb.quaternion.copy(this.camera.quaternion);
      let s = 1;
      const pt = this.pops.get(a);
      if (pt !== undefined) {
        const t = this.time - pt;
        if (t > 1.2) this.pops.delete(a); else s = 1 + 0.4 * Math.exp(-5 * t) * Math.cos(16 * t);
      }
      const gl = this.glow.get(a);
      if (gl !== undefined) s *= 1 + 0.09 * Math.sin(this.time * 7);
      o.group.scale.setScalar(s);
      if (o.mat.emissive) o.mat.emissive.setHex(gl !== undefined ? gl : this.hover === a && !this.drag ? 0x2c3a55 : 0);
      // orbital lobes + lewis dots follow geometry
      if (this.mode === 'orbital') {
        const dirs = this.model.lonePairDirs(a);
        o.lobes.forEach(l => {
          if (l.fixed || !dirs[l.idx]) return;
          const q = new T.Quaternion().setFromUnitVectors(Y, new T.Vector3(dirs[l.idx][0], dirs[l.idx][1], dirs[l.idx][2]));
          if (l.ready) l.mesh.quaternion.slerp(q, 0.25); else { l.mesh.quaternion.copy(q); l.ready = true; }
        });
      } else if (this.mode === 'lewis') {
        const anion = this.model.neighbors(a).some(n => C.isIonic(a.el, n.atom.el)) && a.el !== 'Na';
        const dirs = anion
          ? [right.clone(), right.clone().negate(), up.clone(), up.clone().negate()]
          : this.model.lonePairDirs(a).map(d => new T.Vector3(d[0], d[1], d[2]));
        const fwd = new T.Vector3(); this.camera.getWorldDirection(fwd);
        o.dots.forEach(d => { d.visible = false; });
        dirs.slice(0, 4).forEach((d, i) => {
          const dd = d.clone();
          const flat = dd.clone().sub(fwd.clone().multiplyScalar(dd.dot(fwd)));   // keep pairs readable
          if (flat.length() < 0.35) flat.copy(right).add(up).normalize();
          flat.normalize();
          const px = new T.Vector3().crossVectors(flat, fwd).normalize().multiplyScalar(0.085);
          const c = flat.multiplyScalar(0.55);
          o.dots[i * 2].visible = o.dots[i * 2 + 1].visible = true;
          o.dots[i * 2].position.copy(c).add(px); o.dots[i * 2 + 1].position.copy(c).sub(px);
        });
      }
    }
  }

  // ---------- frame ----------
  render(dt) {
    if (this._dead) return;
    dt = dt || 0.016; this.time += dt;
    if (this.autoRotate && !this.rot) this.yaw += dt * 0.5;
    if (!this.rot) {
      this.yaw += this.yawVel * dt; this.yawVel *= Math.pow(0.04, dt);
      if (Math.abs(this.yawVel) < 0.02) this.yawVel = 0;
    }
    if (this.autoFit) {
      let r = 1;
      this.model.atoms.forEach(a => { r = Math.max(r, Math.hypot(a.x, a.y, a.z) + (this.mode === 'space' ? E[a.el].vdw : 0.9)); });
      const want = 640 / (r * 3.3 / Math.min(1, this.camera.aspect));
      this.zoom += (want - this.zoom) * 0.15;
    }
    const dist = 640 / this.zoom;
    this.camera.position.set(
      this.pan.x + dist * Math.sin(this.yaw) * Math.cos(this.pitch),
      this.pan.y + dist * Math.sin(this.pitch),
      this.pan.z + dist * Math.cos(this.yaw) * Math.cos(this.pitch));
    this.camera.lookAt(this.pan);
    this.camera.updateMatrixWorld();

    this._sync(dt);

    // target ring
    if (this.drag && this.target) {
      const t = this.target, ok = this.model.canBond(this.drag.atom, t);
      this.ring.visible = true;
      this.ring.position.set(t.x, t.y, t.z);
      this.ring.quaternion.copy(this.camera.quaternion);
      const s = this._radius(t) + 0.14 + 0.04 * Math.sin(this.time * 10);
      this.ring.scale.setScalar(s);
      this.ring.material.color.copy(col(ok ? '#7dffb0' : '#ff6464'));
    } else this.ring.visible = false;

    // particles
    for (let i = 0; i < this.NP; i++) {
      if (this.pLife[i] <= 0) { this.pPos[i * 3 + 1] = -999; continue; }
      this.pLife[i] -= dt * 0.8;
      this.pVel[i * 3 + 1] -= 5 * dt;
      this.pPos[i * 3] += this.pVel[i * 3] * dt; this.pPos[i * 3 + 1] += this.pVel[i * 3 + 1] * dt; this.pPos[i * 3 + 2] += this.pVel[i * 3 + 2] * dt;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  }
}

AA.Viewer = Viewer;
})(typeof globalThis !== 'undefined' ? globalThis : window);
