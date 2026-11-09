(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
const T = root.THREE;

// World units are Bohr radii (1 unit = 0.529 angstrom), so the shapes are true to scale.
const A0 = 0.529;
const POS = '#4aa8ff', NEG = '#ff8a4a';
const col = hex => new T.Color(hex).convertSRGBToLinear();

// ---- wave functions (unnormalised, hydrogen-like) ----
const rr = (x, y, z) => Math.sqrt(x * x + y * y + z * z);
const psi1s = (x, y, z, cx) => Math.exp(-rr(x - (cx || 0), y, z));
const psi2s = (x, y, z) => { const r = rr(x, y, z); return (2 - r) * Math.exp(-r / 2); };
const psi2p = axis => (x, y, z) => [x, y, z][axis] * Math.exp(-rr(x, y, z) / 2);

// Metropolis sampling of |psi|^2: returns flat array [x,y,z,sign,...]
function sampleCloud(psi, n, step, starts) {
  const out = [], per = Math.ceil(n / starts.length);
  for (const s of starts) {
    let x = s[0], y = s[1], z = s[2], p = psi(x, y, z), d = p * p, kept = 0;
    for (let i = 0; i < per * 10 + 600 && kept < per; i++) {
      const nx = x + (Math.random() - 0.5) * 2 * step, ny = y + (Math.random() - 0.5) * 2 * step, nz = z + (Math.random() - 0.5) * 2 * step;
      const np = psi(nx, ny, nz), nd = np * np;
      if (nd >= d || Math.random() * d < nd) { x = nx; y = ny; z = nz; p = np; d = nd; }
      if (i > 600 && i % 10 === 0) { out.push(x, y, z, p >= 0 ? 1 : -1); kept++; }
    }
  }
  return out;
}

function lobeGeo(L, w) {
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    pts.push(new T.Vector2(Math.max(0.001, w * Math.pow(Math.sin(Math.PI * t), 0.85) * (0.35 + 0.65 * t)), t * L));
  }
  return new T.LatheGeometry(pts, 28);
}
const Y = new T.Vector3(0, 1, 0);

class OrbitalScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, (window.matchMedia && matchMedia('(pointer: coarse)').matches) ? 1.5 : 2));
    this.renderer.outputEncoding = T.sRGBEncoding;
    this.scene = new T.Scene();
    this.camera = new T.PerspectiveCamera(40, 1, 0.1, 300);
    this.scene.add(this.camera);
    this.scene.add(new T.HemisphereLight(0xffffff, 0x1b2c4a, 0.9));
    const key = new T.DirectionalLight(0xffffff, 0.9); key.position.set(3, 5, 6); this.camera.add(key);
    this.root = new T.Group(); this.scene.add(this.root);
    this.yaw = 0.6; this.pitch = 0.3; this.dist = 16; this.auto = true; this.t = 0;
    this.disposables = []; this.update = null; this.dead = false;
    this._bind(); this.resize();
    if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(canvas);
  }
  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  _bind() {
    const c = this.canvas; let drag = null;
    c.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw: this.yaw, pitch: this.pitch }; this.auto = false; c.setPointerCapture(e.pointerId); });
    c.addEventListener('pointermove', e => { if (!drag) return; this.yaw = drag.yaw - (e.clientX - drag.x) * 0.01; this.pitch = Math.max(-1.4, Math.min(1.4, drag.pitch + (e.clientY - drag.y) * 0.01)); });
    const end = () => { drag = null; };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
    c.addEventListener('wheel', e => { e.preventDefault(); this.dist = Math.max(5, Math.min(40, this.dist * (e.deltaY > 0 ? 1.08 : 0.92))); }, { passive: false });
  }
  clear() {
    this.root.clear();
    this.disposables.forEach(o => o.dispose && o.dispose());
    this.disposables = []; this.update = null;
  }
  _track(o) { this.disposables.push(o); return o; }
  _mat(hex, op) {
    return this._track(new T.MeshPhongMaterial({ color: col(hex), transparent: true, opacity: op, shininess: 70, depthWrite: false, side: T.DoubleSide }));
  }
  _sphere(r, hex, op, x, y, z) {
    const m = new T.Mesh(this._track(new T.SphereGeometry(1, 40, 28)), this._mat(hex, op));
    m.scale.setScalar(r); m.position.set(x || 0, y || 0, z || 0); this.root.add(m); return m;
  }
  _nucleus(x, y, z, hex, r) {
    const m = new T.Mesh(this._track(new T.SphereGeometry(r || 0.3, 20, 14)), this._track(new T.MeshStandardMaterial({ color: col(hex || '#ffd23f'), roughness: 0.4 })));
    m.position.set(x || 0, y || 0, z || 0); this.root.add(m); return m;
  }
  _lobe(L, w, dir, hex, op, at) {
    const m = new T.Mesh(this._track(lobeGeo(L, w)), this._mat(hex, op));
    m.quaternion.setFromUnitVectors(Y, new T.Vector3(dir[0], dir[1], dir[2]).normalize());
    if (at) m.position.set(at[0], at[1], at[2]);
    this.root.add(m); return m;
  }
  _dots(list, size) {
    const n = list.length / 4, pos = new Float32Array(n * 3), cc = new Float32Array(n * 3);
    const p = col(POS), q = col(NEG);
    for (let i = 0; i < n; i++) {
      pos.set([list[i * 4], list[i * 4 + 1], list[i * 4 + 2]], i * 3);
      const c = list[i * 4 + 3] > 0 ? p : q; cc.set([c.r, c.g, c.b], i * 3);
    }
    const g = this._track(new T.BufferGeometry());
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(cc, 3));
    const pts = new T.Points(g, this._track(new T.PointsMaterial({ size: size || 0.16, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false })));
    this.root.add(pts); return pts;
  }
  setView(mode) { // 'shape' | 'dots' | 'both'
    this.view = mode;
    if (this.shapeG) this.shapeG.forEach(o => { o.visible = mode !== 'dots'; });
    if (this.dotG) this.dotG.forEach(o => { o.visible = mode !== 'shape'; });
  }
  _group(shapes, dots) { this.shapeG = shapes; this.dotG = dots; this.setView(this.view || 'both'); }

  // ---- atomic orbitals ----
  showAtomic(kind) {
    this.clear(); this.dist = 17;
    const shapes = [], dots = [];
    this._nucleus(0, 0, 0);
    if (kind === '1s') {
      shapes.push(this._sphere(2.6, POS, 0.4));
      dots.push(this._dots(sampleCloud(psi1s, 3500, 0.9, [[1, 0.2, 0.1]])));
    } else if (kind === '2s') {
      shapes.push(this._sphere(2.0, POS, 0.55), this._sphere(5.2, NEG, 0.2));
      dots.push(this._dots(sampleCloud(psi2s, 4500, 1.6, [[1, 0.2, 0.1], [4, 1, 0.5]]), 0.18));
    } else if (kind === '2p') {
      shapes.push(this._lobe(7, 2.3, [0, 0, 1], POS, 0.5), this._lobe(7, 2.3, [0, 0, -1], NEG, 0.5));
      dots.push(this._dots(sampleCloud(psi2p(2), 4000, 1.6, [[0.2, 0.2, 3], [0.2, 0.2, -3]]), 0.18));
    } else { // 2p x3
      const axes = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
      axes.forEach((a, i) => {
        shapes.push(this._lobe(7, 2.1, a, POS, 0.4), this._lobe(7, 2.1, a.map(v => -v), NEG, 0.4));
        const s = [[0.2, 0.2, 0.2], [0.2, 0.2, 0.2]]; s[0][i] = 3; s[1][i] = -3;
        dots.push(this._dots(sampleCloud(psi2p(i), 1700, 1.6, s), 0.17));
      });
    }
    this._group(shapes, dots);
  }

  // ---- sp3 hybrids: t = 0 (s + three p) to 1 (four sp3) ----
  showHybrid() {
    this.clear(); this.dist = 15; this.view = 'shape';
    this._nucleus(0, 0, 0, '#9aa7c0', 0.35);
    const sS = this._sphere(2.1, POS, 0.5), pL = [];
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(a => {
      pL.push(this._lobe(5.2, 1.7, a, POS, 0.45), this._lobe(5.2, 1.7, a.map(v => -v), NEG, 0.45));
    });
    const D = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(v => new T.Vector3(...v).normalize());
    const hy = [], hs = [], backs = [];
    D.forEach(d => {
      hy.push(this._lobe(4.2, 1.5, [d.x, d.y, d.z], POS, 0.6));
      backs.push(this._lobe(1.4, 0.65, [-d.x, -d.y, -d.z], NEG, 0.5));
      hs.push(this._sphere(0.55, '#f1f5f9', 1, d.x * 4.6, d.y * 4.6, d.z * 4.6));
    });
    this.mix = 0;
    this.update = () => {
      const t = this.mix;
      sS.material.opacity = 0.5 * (1 - t); sS.visible = t < 0.99;
      pL.forEach(m => { m.material.opacity = 0.45 * (1 - t); m.visible = t < 0.99; });
      hy.forEach(m => { m.material.opacity = 0.6 * t; m.visible = t > 0.01; m.scale.setScalar(0.6 + 0.4 * t); });
      backs.forEach(m => { m.material.opacity = 0.5 * t; m.visible = t > 0.01; });
      hs.forEach(m => { m.material.opacity = Math.max(0, (t - 0.6) / 0.4); m.visible = t > 0.6; });
    };
    this.update();
  }

  // ---- sigma and pi bonds in ethene ----
  showPi() {
    this.clear(); this.dist = 15; this.view = 'shape';
    const cx = 1.27, stick = (a, b, r, hex) => {
      const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), L = d.length();
      const m = new T.Mesh(this._track(new T.CylinderGeometry(1, 1, 1, 12)), this._track(new T.MeshStandardMaterial({ color: col(hex), roughness: 0.4 })));
      m.position.copy(A.clone().add(B).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(Y, d.normalize()); m.scale.set(r, L, r); this.root.add(m);
    };
    this._nucleus(-cx, 0, 0, '#9aa7c0', 0.4); this._nucleus(cx, 0, 0, '#9aa7c0', 0.4);
    stick([-cx, 0, 0], [cx, 0, 0], 0.12, '#cfd8e6');
    [[-1, 1], [-1, -1], [1, 1], [1, -1]].forEach(([sx, sy]) => {
      const hx = sx * (cx + 1.03), hy = sy * 1.78;
      stick([sx * cx, 0, 0], [hx, hy, 0], 0.09, '#cfd8e6'); this._sphere(0.5, '#f1f5f9', 1, hx, hy, 0);
    });
    const up = this._sphere(1, POS, 0.55, 0, 0, 1.3), dn = this._sphere(1, NEG, 0.55, 0, 0, -1.3);
    up.scale.set(3.2, 1.5, 1.4); dn.scale.set(3.2, 1.5, 1.4);
  }

  // ---- molecular orbitals of H2-like two-centre systems ----
  showMO(kind, d, view) { // kind 'sigma' | 'sigmastar'; d = nuclear distance in a0
    this.clear(); this.dist = Math.max(14, d * 2.5 + 8);
    const h = d / 2, sgn = kind === 'sigma' ? 1 : -1, shapes = [], dots = [];
    this._nucleus(-h, 0, 0, '#ffd23f', 0.28); this._nucleus(h, 0, 0, '#ffd23f', 0.28);
    if (kind === 'sigma') {
      shapes.push(this._sphere(2.3, POS, 0.4, -h, 0, 0), this._sphere(2.3, POS, 0.4, h, 0, 0));
      const br = this._sphere(1, POS, 0.4, 0, 0, 0); br.scale.set(h + 1.4, 1.9, 1.9); shapes.push(br);
    } else {
      shapes.push(this._sphere(2.3, POS, 0.45, -h - 0.4, 0, 0), this._sphere(2.3, NEG, 0.45, h + 0.4, 0, 0));
      const plane = new T.Mesh(this._track(new T.CircleGeometry(4, 40)), this._track(new T.MeshBasicMaterial({ color: col('#9db3cf'), transparent: true, opacity: 0.18, side: T.DoubleSide, depthWrite: false })));
      plane.rotation.y = Math.PI / 2; this.root.add(plane); shapes.push(plane);
    }
    const psi = (x, y, z) => psi1s(x, y, z, -h) + sgn * psi1s(x, y, z, h);
    dots.push(this._dots(sampleCloud(psi, 4200, 0.9, [[-h + 0.8, 0.1, 0.1], [h - 0.8, 0.1, 0.1]]), 0.15));
    this.view = view || 'dots'; this._group(shapes, dots);
  }

  render(dt) {
    if (this.dead) return;
    this.t += dt || 0.016;
    if (this.auto) this.yaw += (dt || 0.016) * 0.3;
    this.camera.position.set(this.dist * Math.sin(this.yaw) * Math.cos(this.pitch), this.dist * Math.sin(this.pitch), this.dist * Math.cos(this.yaw) * Math.cos(this.pitch));
    this.camera.lookAt(0, 0, 0);
    if (this.update) this.update();
    this.renderer.render(this.scene, this.camera);
  }
  dispose() {
    this.dead = true; this.clear();
    this.renderer.dispose();
    try { this.renderer.forceContextLoss(); } catch (e) { /* ignore */ }
  }
}

// overlap of two 1s orbitals a distance R (in a0) apart
AA.overlap1s = R => Math.exp(-R) * (1 + R + R * R / 3);
AA.A0 = A0;
AA.OrbitalScene = OrbitalScene;
})(typeof globalThis !== 'undefined' ? globalThis : window);
