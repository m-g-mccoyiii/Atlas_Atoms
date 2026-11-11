// One round, played on pages of a lab notebook. The molecule stands in the middle of the page with an inked arrow
// to each molecule it can become. Clicking a product reacts. After three reactions the page turns and the same
// molecule carries on. Reactions that build on one another multiply what is made. Every reading is ink or pencil
// on the page. Rules come from path.js. This file draws and takes input only.
(function (root) {
'use strict';
const AA = root.AA, T = root.THREE, RX = AA.rx, E = AA.ELEMENTS, P = AA.rxPath, sfx = AA.sfx;
const lin = h => new T.Color(h).convertSRGBToLinear();
const rgb = c => 'rgb(' + c.join(',') + ')';
const bright = c => { const m = Math.max(c[0], c[1], c[2], 1), k = Math.max(1, 190 / m); return c.map(q => Math.min(255, Math.round(q * k + 20))); };
const hash = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619); return ((x >>> 0) % 1000) / 1000; };
const fmt = n => Math.round(n).toLocaleString('en-US');
const fmtB = n => (n < 100 ? String(Math.round(n * 10) / 10) : fmt(n));
const BALL = el => Math.min(0.62, 0.2 + 0.36 * E[el].cov);
const INK = '#1f2a55', PENCIL = '#5a564e', FAINT = 'rgba(90,86,78,0.35)', REDINK = '#c8261c', GREEN = '#1c8a4a', HILITE = 'rgba(255,214,0,0.6)';
const SW = 64, SH = 44, IW = 2048, IH = 1408, U = IW / SW;
// The page, near to far: a band along the bottom for the count, the molecule in the middle, and the molecules it
// can become in one row along the top. The round and its pages run down the left edge, equipment down the right.
const C0 = { x: 3.5, z: 2.6 }, SPOT = [], LAB = [], SCS = [], FIN = 7;
// the left column reads down one edge: what is kept, the round and its pages, this page's reactions, the count, the three numbers
const KITV = (() => { try { return new URLSearchParams(root.location.search).get('kit') || 'back'; } catch (e) { return 'back'; } })(), SX = KITV === 'side' ? 5 : 0;
// How big each piece really is, as its longest side in centimetres. Pieces are drawn in proportion, but gently: a
// goat is not fifteen times a stopwatch on the page, or the stopwatch could not be seen.
const CM = { balance: 35, spatula: 30, schlenk: 60, stopper: 20, mirror: 30, mortar: 12, cannula: 25, reflux: 45, burette: 70, clamp: 60, magnet: 5, recycler: 30, stirrer: 16, cards: 26, logbook: 30, crystal: 7, scalepan: 35, coldtrap: 30, bunsen: 30, litmus: 26, stopwatch: 7, thermometer: 30, carousel: 25, dropper: 12, loupe: 12, timer: 15,
  stone: 22, transmute: 30, regia: 18, ouroboros: 25, homunculus: 25, elixir: 14, ouija: 38, voodoo: 26, tower: 30, duck: 22, cat: 26, paw: 28, idol: 28, grimoire: 30, hourglass: 30, poster: 30, coffee: 22, coat: 32, milk: 26, mystery: 24, raven: 30, glory: 30, goggles: 28, grant: 30, extinguisher: 30, intern: 30, orb: 26, candle: 38, goat: 80, pact: 30, dryer: 30, sieves: 14, hood: 55, scrubber: 35 };
const sizeOf = id => Math.max(0.86, Math.min(1.55, Math.pow((CM[id] || 25) / 28, 0.42)));
const EDGE = -22.6 + SX, STEP = { x: -21.6 + SX, z: 0.9 }, PAGES = { x: -15.2 + SX, z: -2.9 }, HIST = { x: 6, z: 6.6 };
let SC_MAIN = 1.5; const SC_HOVER = 1.3;

function start(app) {
  const cv = document.createElement('canvas'); app.append(cv);
  const ren = new T.WebGLRenderer({ canvas: cv, antialias: true });
  ren.setPixelRatio(Math.min(2, root.devicePixelRatio || 1)); ren.outputEncoding = T.sRGBEncoding;
  ren.shadowMap.enabled = true; ren.shadowMap.type = T.PCFSoftShadowMap;
  // a look being tried, see kitart.js
  const LOOK = (() => { try { return new URLSearchParams(root.location.search).get('look') || 'toy'; } catch (e) { return 'toy'; } })(); AA.rxKit.K.look = LOOK;
  const scene = new T.Scene(); scene.background = lin('#e9e2d0');
  const cam = new T.PerspectiveCamera(34, 1, 0.5, 200), CAM = new T.Vector3(0, 43, 22.6), LOOKAT = new T.Vector3(0, 0, 0.6);
  const camDir = LOOKAT.clone().sub(CAM).normalize();
  scene.add(new T.HemisphereLight(0xfff6e6, 0xcabf9f, LOOK === 'clay' ? 1.0 : LOOK === 'desk' ? 0.55 : 0.8));
  const sun = new T.DirectionalLight(0xfff0d6, LOOK === 'clay' ? 0.6 : LOOK === 'desk' ? 1.1 : 0.85); sun.position.set(-16, 18, 4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005; sun.shadow.radius = LOOK === 'toy' ? 1.5 : LOOK === 'now' ? 7 : 11;
  if (LOOK === 'desk') { // a room for glass and metal to reflect: a warm ceiling, a bright window, a dark floor
    const room = new T.Scene(), bm = c => new T.MeshBasicMaterial({ color: c, side: T.BackSide }); room.add(new T.Mesh(new T.SphereGeometry(50, 24, 16), bm(0x8a7f70)));
    const pane = (w, h, x, y, z, c) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); room.add(m); }; pane(30, 22, -30, 26, 6, 0xffffff); pane(40, 14, 14, 34, -18, 0xfff0d0); pane(60, 60, 0, -30, 0, 0x2a2420);
    const pm = new T.PMREMGenerator(ren); scene.environment = pm.fromScene(room, 0.03).texture; ren.toneMapping = T.ACESFilmicToneMapping; ren.toneMappingExposure = 1.15; }
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 22, bottom: -22, near: 1, far: 90 }); scene.add(sun); scene.add(sun.target);
  const maxAn = ren.capabilities.getMaxAnisotropy();
  const canvasTex = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = maxAn; return { c, x: c.getContext('2d'), t }; };
  const noise = (x, w, h, n, a, c) => { for (let i = 0; i < n; i++) { x.fillStyle = 'rgba(' + c + ',' + (Math.random() * a).toFixed(3) + ')'; x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); } };
  const std = o => new T.MeshStandardMaterial(o);
  const add = (geo, mat, x, y, z, parent) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (parent || scene).add(m); return m; };

  // ---------- the page, and the layer of ink over it ----------
  const paper = canvasTex(2048, 1408);
  (() => { const x = paper.x, w = 2048, h = 1408, u = w / SW; x.fillStyle = '#f3eddc'; x.fillRect(0, 0, w, h); noise(x, w, h, 50000, 0.05, '120,100,60');
    x.strokeStyle = 'rgba(70,120,170,0.2)'; x.lineWidth = 1.4; for (let i = 0; i <= SW; i++) { x.beginPath(); x.moveTo(i * u, 0); x.lineTo(i * u, h); x.stroke(); } for (let j = 0; j <= SH; j++) { x.beginPath(); x.moveTo(0, j * u); x.lineTo(w, j * u); x.stroke(); }
    x.strokeStyle = 'rgba(200,60,50,0.45)'; x.lineWidth = 3; x.beginPath(); x.moveTo(5.5 * u, 0); x.lineTo(5.5 * u, h); x.stroke(); paper.t.needsUpdate = true; })();
  add(new T.PlaneGeometry(SW, SH).rotateX(-Math.PI / 2), std({ map: paper.t, roughness: 0.95 }), 0, 0, 0).castShadow = false;
  const ink = canvasTex(IW, IH);
  const inkMesh = add(new T.PlaneGeometry(SW, SH).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ map: ink.t, transparent: true, depthWrite: false }), 0, 0.02, 0); inkMesh.castShadow = false; inkMesh.receiveShadow = false;
  const veil = document.createElement('canvas'); veil.className = 'veil'; app.append(veil);

  // a pencil lying across the margin
  add(new T.CylinderGeometry(0.2, 0.2, 9, 6), std({ color: lin(0xf0b21c), roughness: 0.5 }), -28, 0.2, 2).rotation.set(Math.PI / 2, 0, 0.12);

  // Three ways of keeping a large molecule readable, being tried side by side with ?fold= on the page.
  //   bead: an arm or ring that nothing can act on folds into one lettered bead (Me, Et, Ph)
  //   flat: the molecule is laid out flat on the page with no overlaps, over an inked skeleton
  //   focus: what is far from anything that can react is drawn small and pale
  const FOLD = (() => { try { return new URLSearchParams(root.location.search).get('fold') || 'bead'; } catch (e) { return 'bead'; } })(), BIG = 11;
  // Ways of drawing every molecule, being tried side by side with ?mol= on the page.
  //   full: every atom, standing as it settles.  lean: no H on carbon, no letter on carbon.
  //   flatlean: lean, and laid flat over an inked skeleton.  pads: flatlean, with a colored pad under each group.
  const MOLV = (() => { try { return new URLSearchParams(root.location.search).get('mol') || 'flatlean'; } catch (e) { return 'flatlean'; } })(), PADC = { 'C=C': '58,111,208', 'C=O': '240,132,0', OH: '214,69,58', Cl: '60,154,95' };
  // Cuts to what is drawn on top of the molecule, tried with ?cut= and any of the letters:
  //   a: one kind of mark at a time.  b: no group letters.  c: heavy atoms are tinted, no collar.  d: choices in a column at the side.
  const CUT = (() => { try { const v = new URLSearchParams(root.location.search).get('cut'); return v == null ? 'abcd' : v; } catch (e) { return 'abcd'; } })(), SIDE = CUT.includes('d'), mIso = {};
  if (SIDE) { C0.x = -0.6; C0.z = 0.2; }
  const isoMat = a => { const k = a.el + a.iso; return mIso[k] || (mIso[k] = std({ color: new T.Color(E[a.el].color).lerp(new T.Color(ISOC[a.iso]), 0.55).convertSRGBToLinear(), emissive: lin(ISOC[a.iso]), emissiveIntensity: 0.45, roughness: 0.3 })); };
  const beadMat = std({ color: lin(0xf0d9a0), roughness: 0.7 }), polyMat = std({ color: lin(0xf08aa8), roughness: 0.6 }), beadEdge = new T.MeshBasicMaterial({ color: lin(0x1f2a55), side: T.BackSide }), paleMat = std({ color: lin(0xd9d6cc), roughness: 0.8 }), mWord = {};
  function wordMat(txt) { if (mWord[txt]) return mWord[txt]; const c = canvasTex(128, 128); c.x.font = 'bold ' + (txt.length > 2 ? 50 : 66) + 'px "Trebuchet MS", system-ui, sans-serif'; c.x.textAlign = 'center'; c.x.textBaseline = 'middle'; c.x.fillStyle = '#1f2a55'; c.x.fillText(txt, 64, 68); c.t.needsUpdate = true; return (mWord[txt] = new T.SpriteMaterial({ map: c.t, depthWrite: false })); }
  // the atoms a reagent could act on, or that carry something: the ends of C=C and C=O, O and Cl with their carbon, heavy atoms
  function liveAtoms(md, ar) {
    const live = new Set();
    md.bonds.forEach(b => { if (b.order === 2 && !(ar.has(b.a) && ar.has(b.b))) { live.add(b.a); live.add(b.b); } });
    md.atoms.forEach(a => { if (a.poly) live.add(a); if (a.el === 'O' || a.el === 'Cl') { live.add(a); md.neighbors(a).forEach(q => { if (q.atom.el === 'C') live.add(q.atom); }); } if (a.iso) live.add(a); });
    return live;
  }
  // arms and rings that hold nothing live, each to be drawn as one bead on the atom it hangs from
  function foldsOf(md) {
    const ar = RX.aromaticAtoms(md), live = liveAtoms(md, ar), heavy = md.atoms.filter(a => a.el !== 'H' && !a.tail), gone = new Set(), hn = a => md.neighbors(a).filter(q => q.atom.el !== 'H' && !q.atom.tail && !gone.has(q.atom)).map(q => q.atom);
    for (let again = true; again;) {
      again = false;
      heavy.forEach(a => { if (gone.has(a) || live.has(a) || ar.has(a)) return; if (hn(a).length <= 1) { gone.add(a); again = true; } });
      const seen = new Set(); heavy.forEach(a => { if (!ar.has(a) || gone.has(a) || seen.has(a)) return; const ring = [], st0 = [a]; while (st0.length) { const q = st0.pop(); if (seen.has(q)) continue; seen.add(q); ring.push(q); md.neighbors(q).forEach(n => { if (ar.has(n.atom) && !gone.has(n.atom)) st0.push(n.atom); }); }
        let out = 0; ring.forEach(q => hn(q).forEach(n => { if (!ar.has(n)) out++; })); if (out <= 1 && !ring.some(q => live.has(q))) { ring.forEach(q => gone.add(q)); again = true; } });
    }
    if (gone.size >= heavy.length) return [];
    const beads = [], done = new Set();
    gone.forEach(a => { if (done.has(a)) return; const comp = [], st0 = [a]; let anchor = null, rootA = null; while (st0.length) { const q = st0.pop(); if (done.has(q)) continue; done.add(q); comp.push(q); md.neighbors(q).forEach(n => { if (n.atom.el === 'H') return; if (gone.has(n.atom)) st0.push(n.atom); else { anchor = n.atom; rootA = q; } }); }
      if (!anchor || comp.length < 2) return; const nC = comp.filter(q => q.el === 'C').length, ring = comp.some(q => ar.has(q)); beads.push({ atoms: comp, anchor, root: rootA, txt: ring ? (nC === 6 ? 'Ph' : 'Ar') : ({ 1: 'Me', 2: 'Et', 3: 'Pr', 4: 'Bu' })[nC] || 'C' + nC }); });
    return beads;
  }
  // lays the atoms out flat with nothing on top of anything else: bonds keep their length, everything else is pushed apart
  function flatten(md, at, skip, beads, iters) {
    const pts = md.atoms.filter(a => !skip.has(a)).concat(beads.map(b => b.pa)), bonds = md.bonds.filter(b => !skip.has(b.a) && !skip.has(b.b)).map(b => ({ a: at.get(b.a), b: at.get(b.b), len: Math.hypot(b.a.x - b.b.x, b.a.y - b.b.y, b.a.z - b.b.z) })).concat(beads.map(b => ({ a: at.get(b.anchor), b: at.get(b.pa), len: Math.hypot(b.anchor.x - b.root.x, b.anchor.y - b.root.y, b.anchor.z - b.root.z) * 1.15 }))), P2 = pts.map(a => ({ p: at.get(a), h: a.el === 'H' }));
    const typ = bonds.filter(b => b.len > 0).map(b => b.len).sort((x, y) => x - y)[Math.floor(bonds.length * 0.7)] || 1.5;
    P2.forEach(q => { q.p.y = 0; });
    for (let it = 0; it < (iters || 120); it++) {
      for (let i = 0; i < P2.length; i++) for (let j = i + 1; j < P2.length; j++) { const A = P2[i], B = P2[j], min = typ * (A.h || B.h ? (A.h && B.h ? 0.75 : 0.9) : 1.25); let dx = B.p.x - A.p.x, dz = B.p.z - A.p.z, d = Math.hypot(dx, dz); if (d >= min) continue; if (d < 1e-3) { dx = Math.cos(i * 1.7 + j); dz = Math.sin(i * 1.7 + j); d = 1; } const k = (min - d) / d * 0.5; A.p.x -= dx * k; A.p.z -= dz * k; B.p.x += dx * k; B.p.z += dz * k; }
      bonds.forEach(b => { const dx = b.b.x - b.a.x, dz = b.b.z - b.a.z, d = Math.hypot(dx, dz) || 1, k = (d - b.len) / d * 0.5; b.a.x += dx * k; b.a.z += dz * k; b.b.x -= dx * k; b.b.z -= dz * k; });
    }
    let cx = 0, cz = 0; P2.forEach(q => { cx += q.p.x; cz += q.p.z; }); cx /= P2.length || 1; cz /= P2.length || 1; P2.forEach(q => { q.p.x -= cx; q.p.z -= cz; });
  }

  // A molecule laid out as it would be drawn by hand: a chain is an even zigzag, a ring is a regular polygon, and
  // what hangs off them leaves at even angles. Hydrogens that are drawn sit a short way out from their atom.
  function tidy(md, at, skip, beads, seed) {
    const L = 1.55, nodes = md.atoms.filter(a => !skip.has(a) && a.el !== 'H'), adj = new Map(), pos = new Map(); nodes.forEach(a => adj.set(a, []));
    md.bonds.forEach(b => { if (adj.has(b.a) && adj.has(b.b)) { adj.get(b.a).push(b.b); adj.get(b.b).push(b.a); } });
    beads.forEach(b => { if (!adj.has(b.anchor)) return; adj.set(b.pa, [b.anchor]); adj.get(b.anchor).push(b.pa); nodes.push(b.pa); });
    if (!nodes.length) return;
    // ring atoms are what is left when ends are stripped away again and again
    const deg = new Map(), ring = new Set(nodes); nodes.forEach(a => deg.set(a, adj.get(a).length));
    for (let again = true; again;) { again = false; Array.from(ring).forEach(a => { if (deg.get(a) <= 1) { ring.delete(a); adj.get(a).forEach(n => deg.set(n, deg.get(n) - 1)); again = true; } }); }
    const far = (a, from, seen) => { let best = 0; adj.get(a).forEach(n => { if (n === from || seen.has(n) || pos.has(n)) return; seen.add(n); best = Math.max(best, 1 + far(n, a, seen)); }); return best; };
    const grow = (a, ang, turn) => {
      const kids = adj.get(a).filter(n => !pos.has(n)).sort((p, q) => far(q, a, new Set([a, q])) - far(p, a, new Set([a, p])));
      const angs = [ang + turn * Math.PI / 3, ang - turn * Math.PI / 3, ang], todo = [];
      kids.forEach((n, k) => { if (pos.has(n)) return; const t = angs[Math.min(k, 2)] + (k > 2 ? k : 0), p = pos.get(a); pos.set(n, { x: p.x + Math.cos(t) * L, y: p.y + Math.sin(t) * L }); todo.push([n, t, k === 0 ? -turn : turn]); });
      todo.forEach(q => grow(q[0], q[1], q[2]));
    };
    if (ring.size) {
      const s0 = Array.from(ring)[0], order = [s0]; for (let cur = s0, prev = null; ;) { const nx = adj.get(cur).find(n => ring.has(n) && n !== prev && !order.includes(n)); if (!nx) break; order.push(nx); prev = cur; cur = nx; }
      const n = order.length, R = L / (2 * Math.sin(Math.PI / n)); order.forEach((a, k) => pos.set(a, { x: Math.cos(k * 2 * Math.PI / n) * R, y: Math.sin(k * 2 * Math.PI / n) * R }));
      order.forEach(a => { const p = pos.get(a); grow(a, Math.atan2(p.y, p.x) - Math.PI / 3, 1); });
      nodes.forEach(a => { if (!pos.has(a)) { const nb = adj.get(a).find(q => pos.has(q)); if (nb) { const p = pos.get(nb); pos.set(a, { x: p.x + L, y: p.y }); grow(a, 0, 1); } } });
    } else {
      const bfs = s => { const d = new Map([[s, 0]]), q = [s]; let last = s; while (q.length) { const a = q.shift(); last = a; adj.get(a).forEach(n => { if (!d.has(n)) { d.set(n, d.get(a) + 1); q.push(n); } }); } return last; };
      const start = bfs(bfs(nodes[0])); pos.set(start, { x: 0, y: 0 }); grow(start, -Math.PI / 6, 1);
    }
    nodes.forEach(a => { if (!pos.has(a)) pos.set(a, { x: 0, y: 0 }); });
    // atoms that landed on top of each other are pushed apart, while every bond is pulled back toward its length
    for (let it = 0; it < 160; it++) { let moved = false;
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const p = pos.get(nodes[i]), q = pos.get(nodes[j]); let dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy); const min = adj.get(nodes[i]).includes(nodes[j]) ? L * 0.8 : nodes[i].bead || nodes[j].bead ? L * 1.6 : L * 1.08; if (d >= min) continue; if (d < 1e-3) { dx = Math.cos(i * 2.4 + j); dy = Math.sin(i * 2.4 + j); d = 1; } const push = (min - d) / 2 + 0.01; p.x -= dx / d * push; p.y -= dy / d * push; q.x += dx / d * push; q.y += dy / d * push; moved = true; }
      if (!moved) break;
      nodes.forEach(n => adj.get(n).forEach(m => { const p = pos.get(n), q = pos.get(m), dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1e-3, df = (d - L) / d * 0.2; p.x += dx * df; p.y += dy * df; q.x -= dx * df; q.y -= dy * df; })); }
    // hydrogens that are drawn: out from their atom, away from its neighbours
    md.atoms.forEach(a => { if (skip.has(a) || a.el !== 'H') return; const par = md.neighbors(a).map(q => q.atom).find(q => pos.has(q)); if (!par) { pos.set(a, { x: 0, y: 0 }); return; } const p = pos.get(par); let ax = 0, ay = 0; adj.get(par).forEach(n => { const q = pos.get(n); ax += q.x - p.x; ay += q.y - p.y; }); const d = Math.hypot(ax, ay); const ux = d > 0.01 ? -ax / d : 0.87, uy = d > 0.01 ? -ay / d : 0.5; pos.set(a, { x: p.x + ux * L * 0.62, y: p.y + uy * L * 0.62 }); });
    // long way lies left to right; then whichever mirror image is nearest to how it stood before
    let cx = 0, cy = 0, n = 0; pos.forEach(p => { cx += p.x; cy += p.y; n++; }); cx /= n; cy /= n; pos.forEach(p => { p.x -= cx; p.y -= cy; });
    { let sxx = 0, syy = 0, sxy = 0; pos.forEach(p => { sxx += p.x * p.x; syy += p.y * p.y; sxy += p.x * p.y; }); const th = 0.5 * Math.atan2(2 * sxy, sxx - syy), c = Math.cos(-th), s = Math.sin(-th); if (!ring.size || sxx + syy > 0) pos.forEach(p => { const x = p.x * c - p.y * s, y = p.x * s + p.y * c; p.x = x; p.y = y; }); }
    let fx = 1, fy = 1;
    if (seed && seed.size) { let best = 1e18; [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(m => { let e = 0; seed.forEach((q, a) => { const p = pos.get(a); if (p) e += (p.x * m[0] - q.x) * (p.x * m[0] - q.x) + (-p.y * m[1] - q.z) * (-p.y * m[1] - q.z); }); if (e < best) { best = e; fx = m[0]; fy = m[1]; } }); }
    const lift = new Map(); nodes.forEach((c, ci) => { const nb = adj.get(c); if (nb.length < 3) return; let sgn = ci % 2 ? 1 : -1; nb.filter(t => adj.get(t).length === 1).forEach(t => { lift.set(t, 0.26 * sgn); sgn = -sgn; }); });
    md.atoms.forEach(a => { if (a.el !== 'H' || skip.has(a)) return; const par = md.neighbors(a).map(q => q.atom).find(q => lift.has(q)); if (par) lift.set(a, lift.get(par) * 1.25); });
    pos.forEach((p, a) => { const v = at.get(a); if (v) v.set(p.x * fx, lift.get(a) || 0, -p.y * fy); });
  }

  // ---------- ball and stick, drawn as the viewer draws it ----------
  const SPH = new T.SphereGeometry(1, 36, 24), CYL = new T.CylinderGeometry(1, 1, 1, 12), UP = new T.Vector3(0, 1, 0), mBall = {}, mStick = {}, mLetter = {};
  const ballMat = el => mBall[el] || (mBall[el] = std({ color: lin(E[el].color), roughness: 0.3, metalness: 0.08 }));
  const stickMat = el => mStick[el] || (mStick[el] = std({ color: lin(E[el].color), roughness: 0.35 }));
  function letterMat(el) {
    if (mLetter[el]) return mLetter[el];
    const hx = E[el].color, n = parseInt(hx.slice(1), 16), dark = ((n >> 16 & 255) * 0.299 + (n >> 8 & 255) * 0.587 + (n & 255) * 0.114) > 150, c = canvasTex(128, 128);
    c.x.font = 'bold 84px "Trebuchet MS", system-ui, sans-serif'; c.x.textAlign = 'center'; c.x.textBaseline = 'middle'; c.x.fillStyle = dark ? '#14202e' : '#ffffff'; c.x.fillText(el, 64, 68); c.t.needsUpdate = true;
    return (mLetter[el] = new T.SpriteMaterial({ map: c.t, depthWrite: false }));
  }
  // a heavy atom wears a collar in the color of the number it adds to
  const ISOC = { c13: 0x1f5fbf, o18: 0xd9a400, c14: 0xb0189a };
  let align = new T.Quaternion();
  // the long axis lies left to right, then the molecule is rolled until it lies as flat as it can
  function setAlign(model) {
    let best = 0; const v = new T.Vector3(1, 0, 0);
    model.atoms.forEach(a => model.atoms.forEach(b => { const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); if (d > best) { best = d; v.set(b.x - a.x, b.y - a.y, b.z - a.z); } }));
    if (v.x < 0) v.negate();
    const q = new T.Quaternion().setFromUnitVectors(v.normalize(), new T.Vector3(1, 0, 0)); let roll = 0, least = 1e9;
    for (let k = 0; k < 36; k++) {
      const r = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), k * Math.PI / 36).multiply(q); let lo = 1e9, hi = -1e9;
      model.atoms.forEach(a => { if (a.el === 'H') return; const y = new T.Vector3(a.x, a.y, a.z).applyQuaternion(r).y; lo = Math.min(lo, y); hi = Math.max(hi, y); });
      if (hi - lo < least) { least = hi - lo; roll = k; }
    }
    align = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), roll * Math.PI / 36).multiply(q);
  }
  function collar(grp, p, R, col) { const t = add(new T.TorusGeometry(R * 1.34, R * 0.15, 8, 32), std({ color: lin(col), roughness: 0.45 }), p.x, p.y, p.z, grp); t.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), camDir.clone().negate()); t.userData.own = true; return t; }
  // lean: a product is drawn without the hydrogens on its carbons and without letters on carbon, so it reads at a
  // distance. The middle molecule is always drawn in full. Nothing is ringed in 3D: what changed is circled in ink
  // on the page under it, see marksOf.
  // seed: where atoms stood before a reaction, so that a flat layout carries on from the last one and does not start afresh
  // A cage or fused rings: some atom has three or more bonds that are each part of a ring. These cannot be laid flat
  // without bonds crossing, so they keep their shape in space.
  function caged(model) {
    const hv = model.atoms.filter(a => a.el !== 'H'), nb = a => model.neighbors(a).map(q => q.atom).filter(b => b.el !== 'H');
    const inRing = (a, b) => { const seen = new Set([a]), st = [a]; while (st.length) { const u = st.pop(); for (const v of nb(u)) { if (u === a && v === b) continue; if (v === b) return true; if (!seen.has(v)) { seen.add(v); st.push(v); } } } return false; };
    return hv.some(a => nb(a).filter(b => inRing(a, b)).length >= 3);
  }
  function buildMol(model, rings, lean0, seed, seedBead) {
    const lean = lean0 || MOLV !== 'full', grp = new T.Group(), c = new T.Vector3(), at = new Map(), skip = new Set(), balls = new Map(), sticks = [], pale = new Set(); let low = 1e9, n = 0;
    const big = model.atoms.filter(a => a.el !== 'H' && !a.tail).length >= BIG, beads = (FOLD === 'bead' || FOLD === 'both') && big ? foldsOf(model) : [], flat = ((FOLD === 'flat' || FOLD === 'both') && big) || MOLV === 'flatlean' || MOLV === 'pads';
    if (lean || flat) model.atoms.forEach(a => { if (a.el === 'H' && model.neighbors(a).every(q => q.atom.el === 'C')) skip.add(a); });
    model.atoms.forEach(a => { if (a.tail) skip.add(a); });
    beads.forEach(b => b.atoms.forEach(a => { skip.add(a); model.neighbors(a).forEach(q => { if (q.atom.el === 'H') skip.add(q.atom); }); }));
    model.atoms.forEach(a => { if (skip.has(a)) return; c.add(new T.Vector3(a.x, a.y, a.z)); n++; }); c.divideScalar(n || 1);
    model.atoms.forEach(a => { at.set(a, new T.Vector3(a.x, a.y, a.z).sub(c).applyQuaternion(align)); });
    // a bead stands where the first atom of its arm stood
    beads.forEach(b => { b.pa = { el: 'R', bead: b.txt, root: b.root }; at.set(b.pa, ((seedBead && seedBead.get(b.root)) || at.get(b.root)).clone()); });
    if (flat && !caged(model)) tidy(model, at, skip, beads, seed);
    if (FOLD === 'focus' && big) { const ar = RX.aromaticAtoms(model), dist = new Map(), q0 = []; liveAtoms(model, ar).forEach(a => { dist.set(a, 0); q0.push(a); }); while (q0.length) { const a = q0.shift(); model.neighbors(a).forEach(nb => { if (!dist.has(nb.atom)) { dist.set(nb.atom, dist.get(a) + 1); q0.push(nb.atom); } }); } model.atoms.forEach(a => { if ((dist.has(a) ? dist.get(a) : 9) > 2) pale.add(a); }); }
    const radius = a => (a.bead ? 0.82 : a.poly ? 0.7 + 0.12 * Math.min(6, Math.log2(a.poly)) : BALL(a.el) * (pale.has(a) ? 0.5 : 1));
    at.forEach((p, a) => { if (!skip.has(a)) low = Math.min(low, p.y - radius(a)); });
    at.forEach(p => { p.y += 0.5 - low; });
    model.atoms.forEach(a => {
      if (skip.has(a)) return;
      if (a.poly) { const e = { R: radius(a), sk: 1.6, mesh: add(SPH, polyMat, 0, 0, 0, grp), sprite: new T.Sprite(wordMat('n' + a.poly)), collar: null }; e.mesh.add(new T.Mesh(SPH, beadEdge)).scale.setScalar(1.09); grp.add(e.sprite); balls.set(a, e); return; }
      const R = radius(a), b = { R, mesh: add(SPH, pale.has(a) ? paleMat : a.iso && CUT.includes('c') ? isoMat(a) : ballMat(a.el), 0, 0, 0, grp), sprite: null, collar: null };
      if (a.iso && !CUT.includes('c')) b.collar = collar(grp, new T.Vector3(), R, ISOC[a.iso]);
      if (!pale.has(a) && (!(lean || flat) || (a.el !== 'C' && a.el !== 'H'))) { b.sprite = new T.Sprite(letterMat(a.el)); grp.add(b.sprite); }
      balls.set(a, b);
    });
    beads.forEach(b => { const e = { R: 0.82, sk: 1.75, mesh: add(SPH, beadMat, 0, 0, 0, grp), sprite: new T.Sprite(wordMat(b.txt)), collar: null }; e.mesh.add(new T.Mesh(SPH, beadEdge)).scale.setScalar(1.09); grp.add(e.sprite); balls.set(b.pa, e); sticks.push({ a: b.anchor, b: b.pa, r: 0.09, parts: [0, 1].map(h => ({ f: 0, h, mesh: add(CYL, h ? beadMat : stickMat(b.anchor.el), 0, 0, 0, grp) })) }); });
    model.bonds.forEach(bd => {
      if (!balls.has(bd.a) || !balls.has(bd.b)) return;
      const far = pale.has(bd.a) && pale.has(bd.b), parts = []; (bd.order === 1 ? [0] : bd.order >= 3 ? [-1, 0, 1] : [-0.5, 0.5]).forEach(f => [0, 1].forEach(h => parts.push({ f, h, mesh: add(CYL, far ? paleMat : stickMat((h ? bd.b : bd.a).el), 0, 0, 0, grp) })));
      sticks.push({ a: bd.a, b: bd.b, r: (bd.order > 1 ? 0.06 : 0.09) * (far ? 0.6 : 1), parts });
    });
    scene.add(grp);
    const m = { group: grp, at, model, balls, sticks, beads, flat, hover: [], marks: [], hot: [] };
    layout(m, a => at.get(a), null);
    if (rings) m.marks = marksOf(m, Array.from(rings.keys()));
    return m;
  }
  // Puts every ball and stick of a molecule where pos says its atoms are. grow(atom) runs 0 to 1 for an atom that is
  // appearing, and a stick appears with the later of its two ends.
  const _u = new T.Vector3(), _q = new T.Quaternion(), _perp = new T.Vector3(), _mid = new T.Vector3();
  function layout(m, pos, grow) {
    m.balls.forEach((b, a) => { const p = pos(a), k = grow ? grow(a) : 1; b.mesh.position.copy(p); b.mesh.scale.setScalar(Math.max(0.0001, b.R * k)); if (b.sprite) { b.sprite.position.copy(p).addScaledVector(camDir, -b.R * 1.04); b.sprite.scale.setScalar(Math.max(0.0001, b.R * (b.sk || 1.25) * k)); } if (b.collar) { b.collar.position.copy(p); b.collar.scale.setScalar(Math.max(0.0001, k)); } });
    m.sticks.forEach(s => {
      const A = pos(s.a), B = pos(s.b), k0 = grow ? Math.min(grow(s.a), grow(s.b)) : 1; _u.copy(B).sub(A); const len = _u.length(); if (len < 1e-4) return; _u.divideScalar(len);
      // a bond between atoms that are still far apart is not drawn until they have come near: it grows in as a fold closes
      if (!s.rest) { const fa = m.at.get(s.a), fb = m.at.get(s.b); s.rest = fa && fb ? Math.max(0.3, fa.distanceTo(fb)) : len; }
      const k = k0 * Math.max(0, Math.min(1, 1 - (len / s.rest - 1.25) / 0.6));
      _q.setFromUnitVectors(UP, _u); _perp.crossVectors(_u, camDir).normalize(); _mid.copy(A).add(B).multiplyScalar(0.5);
      s.parts.forEach(pt => { const fr = pt.h ? _mid : A, to = pt.h ? B : _mid; const many = s.parts.length > 2, rr = s.r * k * (many ? 0.7 : 1); pt.mesh.position.copy(fr).add(to).multiplyScalar(0.5).addScaledVector(_perp, pt.f * (s.parts.length > 4 ? 0.34 : 0.36)); pt.mesh.quaternion.copy(_q); pt.mesh.scale.set(Math.max(0.0001, rr), fr.distanceTo(to), Math.max(0.0001, rr)); pt.mesh.visible = k > 0.01; });
    });
  }
  // Where to circle a set of atoms on the page. Each atom is carried down to the page along the line of sight, so
  // the circle sits behind it on screen. Atoms close together share one circle. Lengths are in the molecule's own units.
  function marksOf(m, atoms, join, pad) {
    const pts = []; atoms.forEach(a => { const p = m.at.get(a); if (!p || a.el === 'H') return; const t = -p.y / camDir.y; pts.push({ x: p.x + camDir.x * t, z: p.z + camDir.z * t }); });
    const out = [];
    pts.forEach(p => { const o = out.find(q => q.pts.some(t => Math.hypot(t.x - p.x, t.z - p.z) < (join || 2.3))); if (o) o.pts.push(p); else out.push({ pts: [p] }); });
    out.forEach(o => { o.x = o.pts.reduce((t, q) => t + q.x, 0) / o.pts.length; o.z = o.pts.reduce((t, q) => t + q.z, 0) / o.pts.length; o.r = Math.max(...o.pts.map(q => Math.hypot(q.x - o.x, q.z - o.z))) + (pad || 0.7); });
    return out;
  }
  // The groups a reagent can act on, each with where it sits on the page under the molecule: C=C, C=O, OH and Cl.
  function groupsOf(m) {
    const out = [], md = m.model, ar = RX.aromaticAtoms(md), down = (a, b) => { const p = m.at.get(a), q = b ? m.at.get(b) : p; if (!p || !q) return null; const x = (p.x + q.x) / 2, y = (p.y + q.y) / 2, z = (p.z + q.z) / 2, t = -y / camDir.y; return { x: x + camDir.x * t, z: z + camDir.z * t }; };
    md.bonds.forEach(b => { if (b.order !== 2 || (ar.has(b.a) && ar.has(b.b))) return; const cc = b.a.el === 'C' && b.b.el === 'C', co = (b.a.el === 'C' && b.b.el === 'O') || (b.a.el === 'O' && b.b.el === 'C'); if (!cc && !co) return; const p = down(b.a, b.b); if (p) out.push({ txt: cc ? 'C=C' : 'C=O', x: p.x, z: p.z }); });
    md.atoms.forEach(a => { if (a.el === 'Cl') { const p = down(a); if (p) out.push({ txt: 'Cl', x: p.x, z: p.z }); } else if (a.el === 'O') { const nb = md.neighbors(a); if (nb.length === 2 && nb.every(q => q.bond.order === 1) && nb.some(q => q.atom.el === 'H') && nb.some(q => q.atom.el === 'C')) { const p = down(a); if (p) out.push({ txt: 'OH', x: p.x, z: p.z }); } } });
    return out;
  }
  // how wide a molecule is, left to right, counting what is drawn
  const spanOf = m => { let lo = 1e9, hi = -1e9; m.at.forEach((q, a) => { if (a.el === 'H') return; lo = Math.min(lo, q.x); hi = Math.max(hi, q.x); }); return Math.max(3, hi - lo + 1.2); };
  // the molecule in the middle is the largest thing on the page: as big as the room between the choices and the equipment allows
  const deepOf = m => { let lo = 1e9, hi = -1e9; m.balls.forEach((b, a) => { if (a.el === 'H') return; const q = m.at.get(a); lo = Math.min(lo, q.z - q.y * 0.5); hi = Math.max(hi, q.z); }); return Math.max(2, hi - lo + 1.2); };
  const fitMain = m => Math.max(0.7, (SIDE ? Math.min(4.4, (KITV === 'side' ? 17 : 16) / spanOf(m), (KITV === 'bottom' ? 10.5 : 10) / deepOf(m)) : Math.min(2.9, 24 / spanOf(m), 10 / deepOf(m))));
  function freeMol(m) { if (!m) return; scene.remove(m.group); m.group.traverse(o => { if (o.userData.own && o.geometry) { o.geometry.dispose(); o.material.dispose(); } }); }
  const place = (m, p, sc) => { m.group.position.set(p.x, 0, p.z); m.group.scale.setScalar(sc); };

  // ---------- sparks, bits and bubbles: one pool of small balls ----------
  const PN = 700, pMesh = new T.InstancedMesh(new T.SphereGeometry(1, 8, 6), new T.MeshBasicMaterial(), PN), parts = [], pM = new T.Matrix4(), pQ = new T.Quaternion(), pV = new T.Vector3(), pS = new T.Vector3(), pC = new T.Color();
  pMesh.instanceMatrix.setUsage(T.DynamicDrawUsage); pMesh.frustumCulled = false; scene.add(pMesh);
  for (let i = 0; i < PN; i++) { parts.push({ life: 0 }); pMesh.setMatrixAt(i, pM.makeScale(0, 0, 0)); pMesh.setColorAt(i, pC.set(0xffffff)); }
  let pNext = 0;
  // g is gravity: positive falls and bounces on the page, negative rises
  // A hit throws ink onto the paper under it: blots, and streaks running out from the spot. Nothing flies through the air.
  // ?show=plain plays a reaction with one thing to look at: no spray, slashes or bursts, little shake, a slower chain,
  // and no banner for every step of a chain. In both, each step of a chain shows the reagent that is acting.
  const PLAIN = (() => { try { return new URLSearchParams(root.location.search).get('show') !== 'full'; } catch (e) { return true; } })();
  function burst3(x, y, z, n, col) { if (PLAIN) return;
    const t = -y / camDir.y, gx = x + camDir.x * t, gz = z + camDir.z * t, now = performance.now();
    for (let k = 0; k < n; k++) { const a = Math.random() * 6.283, d = 0.6 + Math.random() * 3.2; st.blots.push({ x: gx + Math.cos(a) * d * 1.2, z: gz + Math.sin(a) * d * 0.75, r: 3 + Math.random() * 9, t: now, col }); }
    for (let k = 0; k < Math.ceil(n / 2); k++) { const a = Math.random() * 6.283, d0 = 0.8 + Math.random(), d1 = d0 + 1 + Math.random() * 2.6; st.blots.push({ line: true, x: gx + Math.cos(a) * d0 * 1.2, z: gz + Math.sin(a) * d0 * 0.75, x2: gx + Math.cos(a) * d1 * 1.2, z2: gz + Math.sin(a) * d1 * 0.75, r: 3 + Math.random() * 5, t: now, col }); }
  }
  function stepParts(dt) {
    for (let i = 0; i < PN; i++) {
      const q = parts[i]; if (q.life <= 0) continue;
      q.life -= dt; q.vy -= q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      if (q.g > 0 && q.y < q.s) { q.y = q.s; q.vy *= -0.45; q.vx *= 0.7; q.vz *= 0.7; }
      const k = q.life <= 0 ? 0 : q.s * Math.sqrt(q.life / q.max);
      pMesh.setMatrixAt(i, pM.compose(pV.set(q.x, q.y, q.z), pQ, pS.set(k, k, k)));
    }
    pMesh.instanceMatrix.needsUpdate = true;
  }

  // ---------- state ----------
  // the band along the bottom, left to right: the multiplier, what has been made, the number to beat, the last gain
  const BAND = 11.2, MULT = { x: EDGE + 0.9 + (KITV === 'side' ? 0.6 : 0), z: BAND }, MADE = { x: EDGE, z: 7.6 }, BEAT = KITV === 'back' ? { x: -1.2, z: 12.3 } : { x: -4.8 + SX, z: 14.4 }, GAIN = { x: 22, z: -1.5 }, CALL = { x: 3.5, z: -4.3 }, KITP = i => (KITV === 'side' ? { x: -23.4 + i * 0.42, z: -8.8 + i * 4.2 } : KITV === 'back' ? { x: -9.6 + i * 4.5, z: -10.4 } : { x: 0.2 + i * 4.75, z: 11.0 });
  if (SIDE) { GAIN.x = -12.6 + SX; GAIN.z = 7.4; CALL.x = -1; CALL.z = -12.3; }
  if (KITV === 'back') { GAIN.x = -17.5; GAIN.z = 3.6; CALL.x = 7; CALL.z = 12.6; }
  if (KITV !== 'bottom') { C0.x += SX * 0.55; C0.z += 1.3; }
  if (KITV === 'back') { C0.x += 0.3; C0.z += 0.3; }
  let SLOTW = 10, LABF = 50;
  const st = { mode: 'play', feed: 0, hover: -1, quota: 0, shown: 0, pass: false, tok: 0, shake: 0, flash: 0, flashC: '28,138,74', pageStart: 0, floats: [], blots: [], pings: [], slashes: [], strokes: [], flyers: [], motes: [], chainN: 0, tip: null, teach: { i: 0, t: 0 }, by: { water: 0, h2: 0, gauge: 0 }, byBump: { water: 0, h2: 0, gauge: 0 }, struck: 0, hold: 0, kx: 0, kz: 0, kvx: 0, kvz: 0, sq: 0, zoomUntil: 0, fx: 3.5, fz: 2.6, focus: { x: 3.5, z: 2.6 }, peek: null, willFire: null, pending: null, sc: 1, fury: 0, call: null, multBump: 0, over: 0, turned: 0, gear: [], fired: {}, want: 0, mult: 1, P: 0, R: 1, E: 1, bump: { p: 0, r: 0, e: 0 }, stains: [], pop: 0, zoom: 0, zoomT: 0, madeBump: 0, bubble: 0 };
  let g = null, slots = [], center = null, prods = [], rowMols = [], tweens = [], dirty = true, last = performance.now(), lastInk = 0;
  let run = null, picks = [], pickObjs = [], briefs = [], briefMols = [], best = 0; const meta = { credit: 0, tier: 0, fam: {}, found: {}, taught: false }, shop = { earned: 0 };
  try { best = +(localStorage.getItem('aa_scheme_best') || 0) || 0; const m = JSON.parse(localStorage.getItem('aa_scheme_meta') || 'null'); if (m) { meta.credit = m.credit | 0; meta.tier = Math.max(0, Math.min(P.SUPPLY.length - 1, m.tier | 0)); meta.fam = m.fam || {}; meta.found = m.found || {}; meta.taught = !!m.taught; } } catch (e) { /* storage unavailable */ }
  const saveMeta = () => { try { localStorage.setItem('aa_scheme_meta', JSON.stringify(meta)); } catch (e) { /* storage unavailable */ } };
  run = P.runNew(meta.tier);
  const PICKX = [-15, 0, 15];
  // the molecule in the middle while it is changing from what it was to what it is
  let morph = null;
  const tween = (m, to, sc, dur, done) => tweens.push({ m, fx: m.group.position.x, fz: m.group.position.z, fs: m.group.scale.x, to, sc, t: 0, dur, done });
  const colOf = id => bright(RX.CARDS[id].rgb);
  // how near the page is to going off by itself: grows with the row and with the page's reactions used
  const chargeOf = () => (!g || g.fired || g.chain || st.mode === 'done' || st.mode === 'pick' || st.mode === 'brief' || st.mode === 'shop') ? 0 : st.mode === 'fuse' ? 1 : Math.min(0.94, Math.min(g.cur.path.length, 3) / 6 + Math.min(1, g.pageSteps / P.stepsOf(g)) / 2);
  const callout = (text, sub, col, ticks) => { if (PLAIN && (st.chainN || 0) > 0 && / in a row$/.test(text)) return; st.call = { text, sub: sub || '', col: col || INK, ticks: ticks || 0, t: performance.now() }; };
  const spray = (n, col, wide) => { if (PLAIN) return; const now = performance.now(); for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, d = 2 + Math.random() * (wide ? 12 : 6); if (k % 3) continue; st.blots.push({ x: C0.x + Math.cos(a) * d * 1.3, z: C0.z + Math.sin(a) * d * 0.7, r: 4 + Math.random() * (wide ? 12 : 8), t: now, col }); } };

  // ---------- equipment: objects standing on the page, each with its name and what it does pencilled under it ----------
  let kitObjs = [];
  const GLASS = AA.rxKit.mat(T, 0xdfe9ee, 0.08, 0, { transparent: true, opacity: 0.42 });
  function piece(id) {
    const grp = new T.Group(), inner = new T.Group(), liq = new T.Color().setHSL(hash(id + 'hue'), 0.75, 0.5), yaw = (hash(id + 'yaw') - 0.5) * 0.7;
    if (!AA.rxKit.build(id, T, inner, liq)) add(new T.BoxGeometry(2, 1.2, 2), std({ color: lin(0x3b3e42), roughness: 0.5 }), 0, 0.6, 0, inner);
    const bb = new T.Box3().setFromObject(inner), sz = bb.getSize(new T.Vector3()), k = Math.min(1.7, 3.0 / Math.max(sz.x, sz.z), 3.3 / sz.y);
    inner.scale.setScalar(k); inner.position.set(-(bb.min.x + bb.max.x) / 2 * k, -bb.min.y * k, -(bb.min.z + bb.max.z) / 2 * k);
    // each piece leans back on the page so that it is seen from the front and not from on top
    grp.add(inner); grp.rotation.x = AA.rxKit.FLAT[id] ? 0 : -0.8; grp.rotation.y = yaw; scene.add(grp);
    return { id, grp, yaw, col: '#' + liq.getHexString() };
  }
  // How each piece moves when it fires. Anything not named hops.
  //   tip: rocks from side to side.  spin: turns once.  butt: lunges at the molecule.  flare: swells and settles.
  //   drip: squashes, then stretches.  slam: lifts and comes down flat.  shake: rattles.
  const FIRE = { balance: 'tip', scalepan: 'tip', carousel: 'spin', magnet: 'spin', stopwatch: 'spin', ouroboros: 'spin', goat: 'butt', candle: 'flare', bunsen: 'flare', stone: 'flare', elixir: 'flare', crystal: 'flare',
    dryer: 'drip', scrubber: 'drip', sieves: 'shake', hood: 'flare', burette: 'drip', dropper: 'drip', cannula: 'drip', reflux: 'drip', coldtrap: 'drip', schlenk: 'drip', logbook: 'slam', cards: 'slam', pact: 'slam', ouija: 'slam', mirror: 'slam', transmute: 'slam',
    mortar: 'shake', stopper: 'shake', regia: 'shake', homunculus: 'shake', recycler: 'shake', timer: 'shake', loupe: 'shake', litmus: 'shake', thermometer: 'shake', clamp: 'shake', stirrer: 'shake' };
  function animKit(k, i, now, heat) {
    const f = st.fired[k.id], age = f ? (now - f.t) / 1000 : 9, t = now / 1000, G = k.grp, B = k.base || 1, style = FIRE[k.id] || 'hop', ready = st.willFire && st.willFire.has(k.id);
    // idle: a slow breath, a sway, a small hop now and then, each out of step with its neighbours
    const beat = (t + i * 1.9 + hash(k.id) * 5) % 7, hop = beat < 0.34 ? Math.sin(beat / 0.34 * Math.PI) * 0.35 : 0, look = (k.id === 'goat' || k.id === 'homunculus' ? 0.4 : 0.1) * Math.sin(t * 0.55 + i * 3);
    let y = hop + (ready ? 0.35 + 0.25 * Math.sin(now / 90) : 0), x = 0, z = 0, yaw = k.yaw + look, rz = (0.025 + 0.1 * heat) * Math.sin(t * (1.3 + 9 * heat) + i * 2), sx = 1, sy = 1 + 0.02 * Math.sin(t * 1.7 + i);
    if (age < 0.7) {
      const u = age / 0.7, out = 1 - u, snap = age < 0.07 ? age / 0.07 : 1;
      if (style === 'tip') rz += 0.5 * Math.sin(age * 26) * out * out;
      else if (style === 'spin') { yaw += (1 - Math.pow(out, 3)) * 6.283; y += Math.sin(Math.min(1, u * 2) * Math.PI) * 0.8; }
      else if (style === 'butt') { const g2 = age < 0.12 ? -age / 0.12 * 0.5 : age < 0.26 ? -0.5 + (age - 0.12) / 0.14 * 2.9 : 2.4 * Math.pow(1 - (age - 0.26) / 0.44, 2); z -= g2 * 1.1; x -= g2 * 0.5; sx = 1 + 0.12 * Math.max(0, g2 / 2.4); sy *= 1 - 0.1 * Math.max(0, g2 / 2.4); }
      else if (style === 'flare') { const w = Math.sin(Math.min(1, u * 1.6) * Math.PI); sx = 1 + 0.3 * w; sy *= 1 + 0.42 * w; y += 0.3 * w; }
      else if (style === 'drip') { const w = age < 0.12 ? -(age / 0.12) * 0.25 : 0.3 * Math.cos((age - 0.12) * 24) * out * out; sy *= 1 + w; sx = 1 - w * 0.5; }
      else if (style === 'slam') { const up = age < 0.2 ? Math.sin(age / 0.2 * Math.PI / 2) * 1.7 : age < 0.3 ? 1.7 * (1 - (age - 0.2) / 0.1) : 0; y += up; if (age >= 0.3) { const w = Math.pow(1 - (age - 0.3) / 0.4, 2); sy *= 1 - 0.25 * w * Math.cos((age - 0.3) * 30); sx = 1 + 0.14 * w; } rz += age < 0.3 ? 0.15 * Math.sin(age * 20) : 0; }
      else if (style === 'shake') { x += Math.sin(age * 70) * 0.28 * out * out; rz += Math.sin(age * 55) * 0.2 * out * out; y += 0.25 * out * snap; }
      else { const w = Math.sin(Math.min(1, u * 1.5) * Math.PI); y += 1.8 * w; sy *= 1 + 0.18 * w - (u > 0.66 ? 0.2 * Math.sin((u - 0.66) / 0.34 * Math.PI) : 0); sx = 1 - 0.08 * w + (u > 0.66 ? 0.12 * Math.sin((u - 0.66) / 0.34 * Math.PI) : 0); }
    }
    // arriving: a drop from above, a squash on landing
    { const a0 = (now - (k.born || 0)) / 1000; G.visible = a0 >= 0; if (a0 >= 0 && a0 < 0.8) { const u = Math.min(1, a0 / 0.38); y += (1 - u) * (1 - u) * 11; if (a0 >= 0.38) { const w = Math.sin((a0 - 0.38) / 0.42 * Math.PI) * (1 - (a0 - 0.38) / 0.42); sy *= 1 - 0.3 * w; sx *= 1 + 0.18 * w; } } }
    G.position.set(k.hx + x, y, k.hz + z); G.rotation.y = yaw; G.rotation.z = rz; G.scale.set(B * sx, B * sy, B * sx);
  }
  function buildKit() {
    kitObjs.forEach(k => scene.remove(k.grp)); kitObjs = []; AA.rxKit.wishes = run.wishes || 0;
    st.gear.forEach((id, i) => { const k = piece(id), q = KITP(i); k.grp.position.set(q.x, 0, q.z); k.hx = q.x; k.hz = q.z; k.born = performance.now() + 250 + i * 110; k.base = (KITV === 'bottom' ? 1.3 : KITV === 'side' ? 0.85 : 1.05) * sizeOf(id); k.grp.scale.setScalar(k.base); kitObjs.push(k); });
  }
  // The flask stands by the count. Its red line is the number to beat. Past the line it boils over, harder with
  // every doubling, and what spills stains the page under it.
  const FLASK = KITV === 'back' ? { x: -4.0, z: 11.5 } : { x: -4.8 + SX, z: 10.4 }, FB = { h: 2.3, r0: 1.3, r1: 0.36, line: 0.7 };
  const flask = (() => {
    const grp = new T.Group(), rAt = y => FB.r0 - (FB.r0 - FB.r1) * (y / FB.h), liqM = std({ color: lin(0x3aa6c8), roughness: 0.3 });
    add(new T.CylinderGeometry(FB.r1, FB.r0, FB.h, 28), GLASS, 0, FB.h / 2, 0, grp); add(new T.CylinderGeometry(FB.r1, FB.r1, 0.8, 20), GLASS, 0, FB.h + 0.4, 0, grp);
    add(new T.TorusGeometry(FB.r1 + 0.04, 0.06, 8, 24), GLASS, 0, FB.h + 0.8, 0, grp).rotation.x = Math.PI / 2;
    add(new T.TorusGeometry(rAt(FB.h * FB.line) + 0.02, 0.05, 8, 28), std({ color: lin(0xc8261c), roughness: 0.5 }), 0, FB.h * FB.line, 0, grp).rotation.x = Math.PI / 2;
    const liq = add(new T.CylinderGeometry(1, 1, 1, 24), liqM, 0, 0, 0, grp), neck = add(new T.CylinderGeometry(FB.r1 * 0.85, FB.r1 * 0.85, 0.8, 16), liqM, 0, FB.h + 0.4, 0, grp), dome = add(new T.SphereGeometry(0.5, 20, 14), liqM, 0, FB.h + 0.85, 0, grp);
    const runs = [0, 1, 2, 3].map(k => { const a = k * 1.571 + 0.5, m = add(new T.CylinderGeometry(0.09, 0.12, 1, 8), liqM, Math.cos(a) * 0.55, FB.h, Math.sin(a) * 0.55, grp); m.rotation.set(Math.sin(a) * 0.42, 0, -Math.cos(a) * 0.42); return m; });
    [liq, neck, dome].concat(runs).forEach(m => { m.userData.plain = true; }); AA.rxKit.finish(T, grp);
    grp.rotation.x = -0.8; grp.scale.setScalar(1.25); grp.position.set(FLASK.x, 0, FLASK.z); grp.visible = false; scene.add(grp);
    let last = -1;
    // level 0 to 1 is empty to the red line; over is how many doublings past it
    return { grp, liqM, set(level, over) {
      const L = Math.max(0.02, Math.min(1, over > 0 ? FB.line + (1 - FB.line) * Math.min(1, over / 1.5) : FB.line * level)), y = FB.h * L;
      if (Math.abs(L - last) > 0.004) { last = L; liq.geometry.dispose(); liq.geometry = new T.CylinderGeometry(rAt(y) * 0.93, FB.r0 * 0.93, y, 24); liq.position.y = y / 2; }
      const full = over > 1.4; neck.visible = full; dome.visible = full; const d = full ? Math.min(1.8, 0.5 + 0.28 * over) : 0; dome.scale.set(d, d * 0.7, d);
      runs.forEach((m, k) => { const len = full ? Math.min(FB.h * 0.95, Math.max(0, over - 1.4 - k * 0.6) * 0.8) : 0; m.visible = len > 0.05; m.scale.y = Math.max(0.05, len); const a = k * 1.571 + 0.5, rr = rAt(FB.h - len / 2) + 0.06; m.position.set(Math.cos(a) * rr, FB.h - len / 2, Math.sin(a) * rr); });
      const hot = Math.min(1, over / 6), c = over > 0 ? new T.Color().setHSL(0.36 - 0.5 * hot + (hot > 0.72 ? 1 : 0), 0.85, 0.48) : new T.Color(0x3aa6c8); liqM.color.copy(c.convertSRGBToLinear()); this.hex = '#' + c.convertLinearToSRGB().getHexString();
    }, hex: '#3aa6c8' };
  })();
  // What leaves a molecule and is not caught is kept at the top left: water in a beaker, hydrogen in a balloon, and
  // one stroke on a tally for every by-product. A full beaker or balloon is spent with a click.
  const BEAK = { x: -21.6 + SX, z: KITV === 'back' ? -9.6 : -7.6 }, BALN = { x: -17.4 + SX, z: KITV === 'back' ? -9.6 : -7.6 }, TALLY = { x: -13.4 + SX, z: KITV === 'back' ? -8.6 : -6.4 };
  const keep = (() => {
    const KM = AA.rxKit.mat, bk = new T.Group(), bl = new T.Group(), waterM = KM(T, 0x3a6fd0, 0.3), red = KM(T, 0xd6453a, 0.5);
    add(new T.CylinderGeometry(0.85, 0.8, 1.5, 24), GLASS, 0, 0.75, 0, bk); const water = add(new T.CylinderGeometry(0.76, 0.74, 1, 20), waterM, 0, 0.1, 0, bk); water.userData.plain = true;
    const skin = add(new T.SphereGeometry(0.9, 26, 18), red, 0, 2.3, 0, bl); skin.scale.set(1, 1.22, 1); skin.userData.plain = true; skin.add(new T.Mesh(skin.geometry, new T.MeshBasicMaterial({ color: lin(0x1f2a55), side: T.BackSide }))).scale.setScalar(1.06);
    { const knot = add(new T.ConeGeometry(0.15, 0.22, 10), red, 0, 1.13, 0, bl); knot.userData.plain = true;
      const cord = add(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(0, 1.04, 0), new T.Vector3(0.16, 0.74, 0), new T.Vector3(-0.13, 0.42, 0), new T.Vector3(0.06, 0.04, 0)]), 18, 0.024, 6), KM(T, 0x7d838c, 0.7), 0, 0, 0, bl); cord.userData.plain = true;
      const shine = add(new T.SphereGeometry(0.22, 12, 10), KM(T, 0xffc2b8, 0.25), -0.34, 2.78, 0.6, bl); shine.scale.set(0.8, 1.5, 0.4); shine.userData.plain = true; }
    [bk, bl].forEach((q, i) => { AA.rxKit.finish(T, q); q.rotation.x = -0.8; q.position.set(i ? BALN.x : BEAK.x, 0, i ? BALN.z : BEAK.z); q.visible = false; scene.add(q); }); bk.userData.base = 1.5; bl.scale.setScalar(1.35);
    return { bk, bl, water, skin };
  })();
  function byAt() { if (st.mode !== 'play') return null; for (const k of ['water', 'h2']) { const p = k === 'water' ? BEAK : BALN; if (Math.abs(hit.x - p.x) < 2 && hit.z > p.z - 3.4 && hit.z < p.z + 1.8) return k; } return null; }
  function spend(kind) { if (st.mode !== 'play' || !P.spendBy(g, kind)) { sfx.bad(); return; } flush(); st.by[kind] = Math.max(0, st.by[kind] - P.BY.need); st.byBump[kind] = 1; const p = kind === 'water' ? BEAK : BALN; burst3(p.x, 0.5, p.z, 30, kind === 'water' ? '#3a6fd0' : '#d6453a'); st.shake = 1; sfx.good(); refresh(); }
  // Ways of saying what the things on the page are, tried with ?name= on the page:
  //   point: in a first round, an inked arrow and a few words point at one thing at a time as it first matters
  //   words: one or two pencil words by each thing, always.  hover: its name and a line under the pointer.
  //   fewer: no names, fewer things: no tally, no page numbers, beaker and balloon only once they hold something,
  //          and the three numbers small on one line under the count
  const NAMEV = (() => { try { return new URLSearchParams(root.location.search).get('name') || 'both'; } catch (e) { return 'both'; } })(), FEWER = NAMEV === 'fewer';
  // each thing: where it is, how near the pointer must be, its name, one line, and where a word for it is written
  const zones = () => [
    { id: 'water', x: BEAK.x, z: BEAK.z - 0.8, r: 2.2, name: 'water', line: 'three give one more reaction on this page', lx: BEAK.x, lz: BEAK.z + 2.7 },
    { id: 'h2', x: BALN.x, z: BALN.z - 1.2, r: 2.2, name: 'hydrogen', line: 'three give each reagent one more use', lx: BALN.x, lz: BALN.z + 2.7 },
    { id: 'tally', x: TALLY.x + 1, z: TALLY.z - 0.9, r: 1.8, name: 'left the molecule', line: 'the fifth pays', lx: TALLY.x + 1, lz: TALLY.z + 1.1 },
    { id: 'pages', x: PAGES.x + 1.8, z: PAGES.z, r: 2.4, name: 'page', line: 'three pages to a round', lx: PAGES.x + 1.8, lz: PAGES.z - 1.5 },
    { id: 'steps', x: STEP.x + 2.5, z: STEP.z, r: 3, name: 'reactions', line: 'on this page', lx: STEP.x + 9.4, lz: STEP.z + 0.4 },
    { id: 'made', x: EDGE + 3.4, z: MADE.z - 1.4, r: 3.4, name: 'made', line: 'this round', lx: EDGE + 12, lz: MADE.z - 0.4 },
    { id: 'p', x: MULT.x + 2.2, z: BAND - 1, r: 2.1, name: 'places', line: 'each place a reaction changes', lx: MULT.x + 2.2, lz: BAND + 1.5 },
    { id: 'r', x: MULT.x + 6.9, z: BAND - 1, r: 2.1, name: 'row', line: 'grows with reactions in a row', lx: MULT.x + 6.9, lz: BAND + 1.5 },
    { id: 'e', x: MULT.x + 11.6, z: BAND - 1, r: 2.1, name: 'extra', line: 'added by equipment', lx: MULT.x + 11.6, lz: BAND + 1.5 },
    { id: 'beat', x: FLASK.x, z: FLASK.z - 1, r: 2.6, name: 'to beat', line: 'fill past the red line', lx: FLASK.x - 3.6, lz: BEAT.z },
    { id: 'choices', x: 16.8, z: -9.6, r: 0, name: 'reactions', line: 'pick one', lx: 16.8, lz: -12.3 }
  ];
  // the first round: what is pointed at, in order, each once the page has reached it
  const TEACH = [
    { z: 'choices', say: 'pick a reaction', when: () => true },
    { z: 'made', say: 'what the round has made', when: () => g.trail.length >= 1 },
    { z: 'beat', say: 'fill it past the red line', when: () => g.trail.length >= 1 && st.shown < st.quota },
    { z: 'r', say: 'in a row: this one grows', when: () => g.cur.path.length >= 2 },
    { z: 'water', say: 'what leaves is kept. three can be spent', when: () => st.by.water + st.by.h2 > 0 },
    { z: 'pages', say: 'three pages to a round', when: () => g.page >= 2 }
  ];
  const clearKit = () => { kitObjs.forEach(k => scene.remove(k.grp)); kitObjs = []; };

  // what stands on the page: one slot for each reagent on offer, and on the last page one for the finishing reagent
  function refresh() {
    prods.forEach(freeMol); prods = []; slots = [];
    const live = st.mode === 'play' && !g.over, o = live ? P.options(g) : {};
    g.kinds.forEach((id, i) => { slots[i] = { id, o: o[id] || null }; });
    const fin = live && g.pageSteps < P.stepsOf(g) ? P.finishOpt(g) : null; slots[FIN] = fin ? { id: fin.id, o: fin, fin: true } : null;
    { const ids = []; slots.forEach((q, i) => { if (q) ids.push(i); }); const n = ids.length, step = Math.min(10, 44 / Math.max(1, n)); SLOTW = step; LABF = Math.min(50, step * 5.4);
      ids.forEach((i, k) => { const x = (k - (n - 1) / 2) * step; SPOT[i] = { x, z: -7.4 }; LAB[i] = { x, z: -12.9 }; SCS[i] = Math.min(0.88, 0.09 * step); });
      if (SIDE) { const gap = Math.min(4.2, (KITV === 'back' ? 19.5 : 17) / Math.max(1, n)); SLOTW = gap; LABF = 40; ids.forEach((i, k) => { const z = (KITV === 'back' ? -8.2 : -10.4) + k * gap + gap / 2; SPOT[i] = { x: 23.4, z }; LAB[i] = { x: 16.6, z: z + 0.4 }; SCS[i] = 0.4; }); } }
    slots.forEach((s, i) => {
      if (!s || !s.o) return;
      s.o.model.settle(FOLDS[s.id] ? 2200 : 160);
      const rings = new Map(), c = rgb(colOf(s.id)); s.o.r.made.forEach(a => rings.set(a, c));
      const m = buildMol(s.o.model, rings, true); m.col = c; SCS[i] = SIDE ? Math.max(0.14, Math.min(0.3, 3.4 / spanOf(m))) : Math.max(0.3, Math.min(1.05, (SLOTW - 1.6) / spanOf(m))); place(m, SPOT[i], 0.01); tween(m, SPOT[i], SCS[i], 0.16 + (i % 7) * 0.03); prods[i] = m;
    });
    st.hover = -1; setHover(-1); dirty = true;
  }
  function clearRound() { st.flyers.forEach(f => scene.remove(f.grp)); st.flyers = []; morph = null; st.pending = null; st.strokes = []; st.peek = null; st.willFire = null; tweens = []; prods.forEach(freeMol); prods = []; slots = []; freeMol(center); center = null; rowMols.forEach(freeMol); rowMols = []; }
  // the next round of the run: a molecule, the equipment held, and a number to beat
  function load() {
    st.tok++; st.mode = 'play'; st.paid = ''; st.shown = 0; st.pass = false; st.pageStart = 0; st.floats = []; st.blots = []; st.pings = []; st.slashes = []; st.fury = 0; st.call = null; st.over = 0;
    clearRound(); clearBriefs(); pickObjs.forEach(k => scene.remove(k.grp)); pickObjs = [];
    st.stains = []; st.gear = run.gear.slice(); st.fired = {}; st.want = 0; st.mult = 1; st.P = 0; st.R = 1; st.E = 1; buildKit();
    g = P.runBegin(run, run.feed, true); st.quota = run.quota; st.E = g.E; st.R = g.R;
    setAlign(g.m); center = buildMol(g.m, null); SC_MAIN = fitMain(center); place(center, C0, 0.01); tween(center, C0, SC_MAIN, 0.3); st.sc = SC_MAIN; center.groups = groupsOf(center); center.ghosts = []; st.by = Object.assign({}, g.by);
    refresh(); sfx.feed(); callout('round ' + run.round, fmt(st.quota) + ' to beat', INK);
  }
  // between rounds: three things on the page, take one
  function showPicks() {
    st.tok++; st.mode = 'pick'; clearRound(); clearBriefs(); clearKit(); st.call = null; st.floats = []; st.blots = []; st.pings = [];
    pickObjs.forEach(k => scene.remove(k.grp)); pickObjs = [];
    picks = P.runPicks(run);
    picks.forEach((o, i) => { if (o.kind === 'gear' || o.kind === 'level') { const k = piece(o.id); k.grp.position.set(PICKX[i], 0, -2.2); k.grp.scale.setScalar(1.7); k.slot = i; k.born = performance.now() + 120 + i * 130; k.grp.visible = false; pickObjs.push(k); } });
    sfx.feed(); dirty = true;
  }
  function takePick(i) {
    const o = picks[i]; if (st.mode !== 'pick' || !o) return;
    P.runTake(run, o); sfx.stamp(); st.shake = 0.6; showBriefs();
  }
  // before each round: three rounds stand on the page, each a molecule with what the round asks and what it pays
  function clearBriefs() { briefMols.forEach(freeMol); briefMols = []; }
  function showBriefs() {
    st.tok++; st.mode = 'brief'; clearRound(); clearKit(); clearBriefs(); st.call = null; st.floats = []; st.blots = []; st.pings = []; st.hover = -1;
    pickObjs.forEach(k => scene.remove(k.grp)); pickObjs = [];
    briefs = P.runBriefs(run);
    briefs.forEach((b, i) => { const mdl = P.modelOf(b.model); setAlign(mdl); const m = buildMol(mdl, null, true), sc = Math.min(1.1, 11.5 / spanOf(m)); m.sc = sc; place(m, { x: PICKX[i], z: -2.2 }, 0.01); tween(m, { x: PICKX[i], z: -2.2 }, sc, 0.2 + i * 0.05); briefMols.push(m); });
    sfx.feed(); dirty = true;
  }
  function chooseBrief(i) {
    const b = briefs[i]; if (st.mode !== 'brief' || !b) return;
    P.runChoose(run, b); sfx.stamp(); st.shake = 0.6; load();
  }
  // what a run can turn up beyond the suppliers: families that have been opened and reactions that have been found
  const extraR = () => P.FAMILIES.filter(f => meta.fam[f.id]).reduce((a, f) => a.concat(f.reagents), []).concat(Object.keys(meta.found).filter(k => meta.found[k]));
  function newRun() { run = P.runNew(meta.tier, extraR()); showPicks(); }
  function openFamily(i) { const f = P.FAMILIES[i]; if (st.mode !== 'shop' || !f || meta.fam[f.id] || meta.credit < f.cost) { sfx.bad(); return; } meta.credit -= f.cost; meta.fam[f.id] = true; saveMeta(); sfx.fanfare(); st.shake = 1.2; st.flash = 1; st.flashC = '255,214,0'; callout(f.name + ' opened', '', '#8a6a00'); dirty = true; }
  // between runs: what the run paid, and the suppliers that can be opened with it
  function showSuppliers() { st.tok++; st.mode = 'shop'; shop.earned = run.beaten + (run.bonus || 0); meta.credit += shop.earned; saveMeta(); clearRound(); clearBriefs(); clearKit(); pickObjs.forEach(k => scene.remove(k.grp)); pickObjs = []; st.call = null; st.floats = []; st.blots = []; st.pings = []; st.hover = -1; sfx.feed(); dirty = true; }
  function openSupplier(i) { const sp = P.SUPPLY[i]; if (st.mode !== 'shop' || i !== meta.tier + 1 || !sp || meta.credit < sp.cost) { sfx.bad(); return; } meta.credit -= sp.cost; meta.tier = i; saveMeta(); sfx.fanfare(); st.shake = 1.2; st.flash = 1; st.flashC = '255,214,0'; callout(sp.name + ' opened', '', '#8a6a00'); dirty = true; }
  // Pointing at a reaction works out what it would do, so the page can show it before the click
  function setHover(i) {
    st.hover = i; st.peek = null; st.willFire = null;
    const s = st.mode === 'play' && g && slots[i], o = s && s.o;
    if (o && center && center.model === g.m) { const pk = P.peek(g, o); pk.marks = marksOf(center, o.atoms || [], 0.01, 0.2); pk.col = rgb(colOf(s.id)); st.peek = pk; st.willFire = new Set(pk.fires); }
    dirty = true;
  }
  // sets off the chain that the row has charged. From here the molecule reacts by itself until nothing carries it on
  function setOff() {
    if (st.mode !== 'fuse' || !P.fire(g)) return;
    callout('overreact', '', REDINK); sfx.fuse(); sfx.over(); st.shake = 2.4; st.flash = 1; st.flashC = '214,69,58'; st.hold = performance.now() + 220; spray(60, REDINK, true);
    const c = P.chainNext(g); if (!c) { st.mode = 'play'; return nextPage(); }
    st.chainN = 1; const k = g.kinds.indexOf(c.id); st.mode = 'play'; react(c, c.id, false, LAB[k] ? { x: LAB[k].x - 0.8, z: LAB[k].z + 0.5 } : { x: 17, z: -6 }, true);
  }
  // finishes at once whatever the last reaction was still playing, so that the next one can start
  function flush() {
    if (morph) { layout(morph.m, a => morph.m.at.get(a), null); morph = null; }
    if (st.pending) { const pd = st.pending; st.pending = null; pd.ids.forEach(clearTimeout); pd.final(); }
  }
  function endRound() {
    st.mode = 'done'; st.call = null; clearKit(); st.pass = g.total >= st.quota; if (!meta.taught) { meta.taught = true; saveMeta(); }
    if (st.pass) { run.beaten++; P.runKeep(run, g); st.paid = P.runPay(run); { const extra = (run.gear.includes('goggles') ? 1 : 0) + (run.gear.includes('grant') && g.total >= st.quota * 10 ? 5 : 0); if (extra) { run.bonus = (run.bonus || 0) + extra; st.paid = (st.paid || 0) + extra; } } sfx.fanfare(); st.shake = 1.2; st.flash = 1; st.flashC = '28,138,74'; }
    else { run.over = true; sfx.bad(); st.shake = 0.5; st.flash = 0.8; st.flashC = '200,38,28'; }
    if (run.beaten > best) { best = run.beaten; try { localStorage.setItem('aa_scheme_best', String(best)); } catch (e) { /* storage unavailable */ } }
    refresh();
  }
  function nextPage() {
    if (!P.turn(g)) { P.synEnd(g); return endRound(); }
    st.E = g.E; if (st.gear.includes('intern')) { const tk = st.tok; setTimeout(() => { if (tk === st.tok) internGo(); }, 700); }
    flush(); setAlign(g.m); tweens = tweens.filter(tw => tw.m !== center); freeMol(center); center = buildMol(g.m, null, false); SC_MAIN = fitMain(center); place(center, C0, st.sc); center.hot = g.cur.path.length ? marksOf(center, Array.from(g.cur.fresh), 0.01, 0.2) : []; center.groups = groupsOf(center); center.ghosts = []; st.pop = 1;
    rowMols.forEach(freeMol); rowMols = []; st.pageStart = g.trail.length; st.turned = performance.now(); sfx.feed(); refresh(); st.sq = 0.8; st.kvz += 10;
    // a page on which no reagent acts turns itself
    if (!slots.some(q => q && q.o)) { const tok = st.tok; st.mode = 'move'; setTimeout(() => { if (tok !== st.tok) return; st.mode = 'play'; nextPage(); }, 350); }
  }
  // Everything the player sees and hears when a reaction lands. Each change arrives on its own beat, in the order it
  // was scored: the reagent at each place, then the row, then each piece of equipment. Returns how long it takes.
  const PART = { p: '#1f5fbf', h: '#1f5fbf', r: '#a87a00', e: '#a87a00' };
  function land(o, before, wasOpen, mol, reagent, lab, from) {
    const ids = [], later = (fn, ms) => ids.push(setTimeout(fn, ms)), placeAt = [];
    const tok = st.tok, t = g.trail[g.trail.length - 1], beats = t.ev, n = beats.length, rcol = rgb(colOf(reagent));
    // where on the page each place of the new molecule will be once it has landed in the middle
    const sc = SC_MAIN, marks = (mol && mol.marks) || [], spot = k => { const m = marks.length ? marks[k % marks.length] : { x: 0, z: 0 }; return { x: C0.x + m.x * sc, z: C0.z + m.z * sc }; };
    const heavy = id => { let best = null, bd = 1e9; if (mol) mol.model.atoms.forEach(a => { if (a.iso !== id) return; const q = mol.at.get(a); if (!q) return; const tt = -q.y / camDir.y, gx = q.x + camDir.x * tt, gz = q.z + camDir.z * tt; let d = 1e9; marks.forEach(m => { d = Math.min(d, Math.hypot(m.x - gx, m.z - gz)); }); if (d < bd) { bd = d; best = { x: C0.x + gx * sc, z: C0.z + gz * sc }; } }); return best; };
    // the longer the row, the harder everything on the page hits: bigger lettering, more ink, slashes across the page
    const f = Math.min(1, Math.max(0, (g.cur.path.length - 1) / 5) + 0.12 * (st.chainN || 0)), FL = { p: '31,95,191', h: '31,95,191', r: '255,176,0', e: '200,24,160' }; st.fury = f;
    const ping = (at, txt, col, size, ring) => st.pings.push({ x: at.x, z: at.z, txt, col, size: size * (PLAIN ? 0.62 : 1 + 0.3 * f), ring, f, t: performance.now() });
    const slash = col => { if (PLAIN) return; for (let q = 0; q < Math.min(2, Math.floor(f * 2.4)); q++) { const a = (Math.random() - 0.5) * 1.1 + (Math.random() < 0.5 ? 0 : Math.PI), len = 6 + Math.random() * 9 * f; st.slashes.push({ x: C0.x + (Math.random() - 0.5) * 16, z: C0.z + (Math.random() - 0.5) * 7, dx: Math.cos(a) * len, dz: Math.sin(a) * len * 0.5, w: 10 + 14 * f * Math.random(), col, t: performance.now() }); } };
    sfx.bond(); st.shake = Math.max(st.shake, 0.3);
    // the reaction is played out one beat at a time, quicker as it goes: each place, each heavy atom, the row, then
    // each piece of equipment in the order it stands
    const quick = PLAIN ? Math.max(0.42, Math.pow(0.87, st.chainN || 0)) : Math.pow(0.8, st.chainN || 0); let at = (PLAIN ? 120 : 300) * Math.max(0.35, quick), gap = Math.max(50, (PLAIN ? 110 : 210) * quick), place = -1, last = { x: C0.x, z: C0.z };
    if (PLAIN && TILE[reagent] && lab && !o.self) { const trav = 210 * Math.max(0.55, quick); st.fly = { a: lab, b: spot(0), tl: TILE[reagent], t: performance.now(), trav: at + trav - 120, hold: 620 * Math.max(0.6, quick) }; at += trav; }
    const whenOf = new Map();
    beats.forEach((e, k) => {
      const when = at; whenOf.set(e, when); at += e.src === 'bottle' ? Math.max(gap, 300 * Math.max(0.35, quick)) : gap; gap = Math.max(70, gap * 0.88);
      if (e.src === 'bottle') { place++; placeAt.push(when); const kk = place; later(() => { if (tok === st.tok && !PLAIN) st.strokes.push({ a: lab, b: spot(kk), col: rcol, t: performance.now(), dur: 150 }); }, Math.max(0, when - 150)); }
      const pl = place;
      later(() => {
        if (tok !== st.tok) return;
        const key = e.part === 'h' ? 'p' : e.part, big = e.op === 'mul';
        st.want = e.made; st.P = e.P; st.R = e.R; st.E = e.E; st.mult = e.R * e.E; st.bump[key] = 1; st.madeBump = 1;
        const piece = P.GEARS[e.src] ? e.src : null, txt = (big ? 'times ' : '+') + fmtB(e.val);
        if (e.src === 'bottle') { last = spot(pl); st.focus = { x: last.x, z: last.z }; { const dx = last.x - lab.x, dz = last.z - lab.z, d = Math.hypot(dx, dz) || 1, imp = 7 + 9 * f; st.kvx += dx / d * imp; st.kvz += dz / d * imp; st.sq = Math.min(1, 0.55 + 0.4 * f); st.hold = performance.now() + 55 + 50 * f; } if (!PLAIN) ping({ x: last.x, z: last.z - 1.7 - (pl % 2) * 1.1 }, txt, PART.p, 50, rcol); burst3(last.x, 0, last.z, Math.round(8 + 10 * f), rcol); }
        else if (e.src === 'iso') { const h = heavy(e.iso) || last; if (!PLAIN) ping({ x: h.x, z: h.z - 2.8 }, txt, PART[e.part], 62, PART[e.part]); burst3(h.x, 0, h.z, 14, PART[e.part]); }
        else if (piece) { st.fired[piece] = { t: performance.now(), txt, col: PART[e.part] }; const ko = kitObjs.find(q => q.id === piece); if (ko) { burst3(ko.grp.position.x, 0.2, ko.grp.position.z, big ? 12 : 7, PART[e.part]); if (!PLAIN) st.strokes.push({ a: last, b: { x: ko.grp.position.x, z: ko.grp.position.z - 2.4 }, col: PART[e.part], t: performance.now(), dur: 130 }); } }
        else if (e.src === 'brief') st.floats.push({ txt, t: performance.now(), size: 66, dx: -6, col: PART[e.part] });
        else if (e.src === 'rare') st.floats.push({ txt: t.rare + ' ' + txt, t: performance.now(), size: 74, dx: 6, col: '#b0189a' });
        else if (e.src === 'collect') { st.bump.p = 0; }
        else if (e.src === 'short' && big) ping({ x: last.x, z: last.z - 2.2 }, txt, PART.p, 64, PART.p);
        else if (e.src === 'family' && e.kin === 'resonance') { /* shown by the extra number and the label */ }
        else if (e.src === 'family' && !PLAIN) { const K = P.KIN[e.kin]; ping({ x: last.x + 3.4, z: last.z - 5.2 }, (K ? K.name + ' ' : '') + txt, K ? K.col : PART[e.part], 60, K ? K.col : PART[e.part]); }
        else if (e.src === 'tally') { ping({ x: TALLY.x + 1, z: TALLY.z - 1.5 }, txt, PART.p, 60, PART.p); st.struck = performance.now(); }
        else if (e.src === 'homunculus') ping({ x: last.x, z: last.z - 1.6 }, 'again', PART.p, 56, PART.p);
        if (PLAIN && e.val && (e.src === 'bottle' || piece || e.src === 'family' || e.src === 'iso' || e.src === 'row' || e.src === 'route' || e.src === 'short' || e.src === 'brief')) { const ko2 = piece ? kitObjs.find(q => q.id === piece) : null, src = ko2 ? { x: ko2.grp.position.x, z: ko2.grp.position.z + 2.6 } : { x: last.x, z: under() + 0.6 }; st.motes.push({ txt, part: key === 'p' ? 'p' : 'm', col: e.src === 'family' && P.KIN[e.kin] ? P.KIN[e.kin].col : PART[e.part], a: src, t: performance.now() + 120, dur: 380 }); }
        st.shake = Math.max(st.shake, (big ? 0.7 : e.src === 'iso' ? 0.5 : 0.2) * (1 + 1.0 * f));
        if (f >= 0.5 && k % 2 === 0) slash(PART[e.part]);
        sfx.lock(Math.min(12, k + g.cur.path.length));
      }, when);
    });
    const dur = at + 60 + (FOLDS[reagent] ? 380 : 0), lastPlace = placeAt.length ? placeAt[placeAt.length - 1] : 300;
    // every atom sets off for its new position when the reagent reaches the place nearest to it
    { const start = new Map(), cur = new Map(); let end = 0;
      mol.balls.forEach((b, a) => { const q = mol.at.get(a), tt = -q.y / camDir.y, gx = q.x + camDir.x * tt, gz = q.z + camDir.z * tt; let bi = 0, bd = 1e9; marks.forEach((m, k) => { const d = Math.hypot(m.x - gx, m.z - gz); if (d < bd) { bd = d; bi = k; } }); const s0 = placeAt.length ? placeAt[Math.min(bi, placeAt.length - 1)] : 300; start.set(a, s0); cur.set(a, new T.Vector3()); end = Math.max(end, s0 + (FOLDS[reagent] ? 1100 : 480)); });
      morph = { s0: o.self ? 0 : Math.min.apply(null, Array.from(start.values()).concat(1e9)), slow: !!FOLDS[reagent], m: mol, from: from || new Map(), start, cur, t0: performance.now(), end, made: new Set(o.r.made || []) }; }
    st.zoomUntil = performance.now() + lastPlace + 330; st.focus = spot(0);
    // what leaves sets off when the reagent reaches the place nearest to it, and letters change at the same moment
    { const near = p => { let bi = 0, bd = 1e9; marks.forEach((m, k) => { const d = Math.hypot(m.x - p.x, m.z - p.z); if (d < bd) { bd = d; bi = k; } }); return performance.now() + (placeAt.length ? placeAt[Math.min(bi, placeAt.length - 1)] : 300); };
      const t00 = performance.now();
      st.flyers.forEach(f => { if (f.t0) return; f.t0 = near(f.at);
        const ev = beats.find(e => e.gone === f.gi && (P.GEARS[e.src] || e.src === 'collect')), ko = ev && P.GEARS[ev.src] ? kitObjs.find(q => q.id === ev.src) : null;
        if (ko) { f.to = new T.Vector3(ko.grp.position.x, 1.6, ko.grp.position.z - 0.6); f.dur = 420; f.t0 = Math.max(f.t0, t00 + whenOf.get(ev) - 420); }
        else { const q = f.kind === 'water' ? BEAK : f.kind === 'h2' ? BALN : TALLY; f.to = new T.Vector3(q.x, f.kind === 'h2' ? 2.4 : 1.2, q.z - (f.kind === 'h2' ? 1.6 : 0.6)); f.keep = ev ? f.kind : null; } }); (mol.groups || []).forEach(q => { if (q.born) q.t = near(q); }); (mol.ghosts || []).forEach(q => { q.t = near(q); }); }
    const final = () => {
      if (tok !== st.tok) return;
      const now = performance.now(), gain = P.made(g) - before, route = t.ev.find(e => e.src === 'route'), len = g.cur.path.length, size = Math.log10(Math.max(10, gain));
      st.want = P.made(g); st.P = g.P; st.R = g.R; st.E = g.E; st.mult = P.mult(g);
      if (!PLAIN) st.floats.push({ txt: '+' + fmt(gain), t: now, size: 80 + 34 * size, dx: (Math.random() - 0.5) * 3, col: '#8a6a00' });
      st.shake = Math.max(st.shake, 0.4 + 0.35 * size);
      // a hot reaction leaves its mark on the paper for the rest of the round
      if (false) st.stains.push({ x: C0.x + (Math.random() - 0.5) * 30, z: C0.z + (Math.random() - 0.5) * 10, r: 30 + Math.random() * 70, a: 0.03 + Math.random() * 0.04, ring: Math.random() < 0.6 });
      if (route && P.FOUND[route.route] && !meta.found[P.FOUND[route.route]]) { const nid = P.FOUND[route.route]; meta.found[nid] = true; saveMeta(); if (run.extra && !run.extra.includes(nid)) run.extra.push(nid); st.floats.push({ txt: 'found ' + RX.CARDS[nid].verb.toLowerCase(), t: now, size: 70, dx: 0, col: P.RARITY.rare.col }); sfx.fanfare(); }
      if (route) { callout(AA.rxRun.ROUTE[route.route].tag || AA.rxRun.ROUTE[route.route].name, 'row +' + fmtB(route.val), PART.r); sfx.good(); st.shake = Math.max(st.shake, 1.6); spray(60, PART.r, true); }
      else if (o.finish) { callout('finished', 'extra +' + fmtB(P.SYN.finishExtra * o.r.hits), GREEN); sfx.good(); spray(50, GREEN, true); }

      if (route || o.finish || t.set) { /* named above */ } else if (t.cont && len >= 3) { callout(len + ' in a row', 'row ' + fmtB(g.R), INK); spray(20 * len, INK, true); st.shake = Math.max(st.shake, 0.6 + 0.3 * len); }
      else if (wasOpen && !t.cont && t.held) callout('held', '', PENCIL); else if (wasOpen && !t.cont && !st.gear.includes('ouroboros')) callout('row broken', '', PENCIL);
      // passing the number to beat, and each doubling past it
      const m = P.made(g), times = Math.floor(m / st.quota);
      if (times >= 1 && st.over === 0) { st.hold = performance.now() + 200; st.over = 1; st.flash = 1; st.flashC = '28,138,74'; st.shake = 2; sfx.quota(); spray(90, GREEN, true); burst3(FLASK.x, 0.2, FLASK.z, 30, flask.hex); }
      else if (times >= 2 && times >= st.over * 2) { st.hold = performance.now() + 140; st.over = times; st.flash = 0.4; st.flashC = '255,214,0'; st.shake = 1.1; sfx.over(); spray(40, flask.hex, true); burst3(FLASK.x, 0.2, FLASK.z, 50, flask.hex); }
      dirty = true;
    };
    ids.push(setTimeout(() => { st.pending = null; final(); }, dur)); st.pending = { ids, final };
    return { dur, unlock: Math.min(dur, lastPlace + (FOLDS[reagent] ? 520 : 210)) };
  }
  function pick(i) {
    const s = slots[i], o = s && s.o;
    if (!o || !prods[i] || st.mode !== 'play') return;
    st.chainN = 0; react(o, s.id, s.fin, LAB[i] ? { x: LAB[i].x - 0.8, z: LAB[i].z + 0.5 } : { x: C0.x, z: -9 }, false);
  }
  // reactions that fold the molecule into a new shape: the model is settled fully first, and the move is slow enough to follow
  const FOLDS = { cyclize: 1, snap: 1, aromatize: 1 };
  // the clear lane just below the molecule as it stands
  const under = () => { let d = 6; try { if (center) d = deepOf(center) * center.group.scale.x; } catch (e) { d = 6; } return Math.min(7.4, C0.z + d / 2 + 0.9); };
  // ?self=auto: a molecule that has been set off also reacts with itself. Otherwise the player does it: when the
  // molecule could react with itself, a twist stands under it, once a page. It uses none of the page's reactions.
  try { P.SELFMODE.auto = new URLSearchParams(root.location.search).get('self') === 'auto'; } catch (e) { /* default */ }
  const TWIST = { x: 0.6, z: 8.5 };
  const twistOpt = () => { if (!g || st.mode !== 'play' || P.SELFMODE.auto || g.twisted === g.page) return null; const key = g.page + ':' + g.trail.length; if (!st.twC || st.twC.key !== key) st.twC = { key, o: P.selfOptions(g)[0] || null }; return st.twC.o; };
  const twistAt = () => twistOpt() && Math.abs(hit.x - C0.x) < 8.5 && Math.abs(hit.z - C0.z) < 3.8;
  // the monkey's paw is its own control: a click on it makes a wish
  const kitAt = id => kitObjs.find(k => k.id === id && Math.abs(hit.x - k.hx) < 1.8 && hit.z > k.hz - 3.6 && hit.z < k.hz + 1.4);
  const pawAt = () => kitAt('paw');
  function doDouse() { const k = kitObjs.find(q => q.id === 'extinguisher'); if (!k || !P.douse(g)) return; st.motes.push({ txt: 'times 1.5', part: 'm', col: PART.e, a: { x: k.hx, z: k.hz + 2.6 }, t: performance.now() + 80, dur: 420 }); callout('doused', '', PENCIL); dirty = true; }
  function internGo() { if (st.mode !== 'play' || g.over || g.chain) return; const o = P.options(g, true), ids = Object.keys(o).filter(id => o[id].r && o[id].r.hits > 0); if (!ids.length) return; const id = ids[Math.floor(Math.random() * ids.length)], k = kitObjs.find(q => q.id === 'intern'); callout('intern', RX.CARDS[id].verb.toLowerCase(), PENCIL); react(o[id], id, false, k ? { x: k.hx, z: k.hz + 2.6 } : { x: 17, z: -6 }, true); }
  function doWish() { if (st.mode !== 'play') return; const k = kitObjs.find(q => q.id === 'paw'), id = P.wish(g, run); if (id === null || !k) return; st.E = g.E; st.want = (g.bank + g.P * g.R) * g.E; st.motes.push({ txt: 'times 2', part: 'm', col: PART.e, a: { x: k.hx, z: k.hz + 2.6 }, t: performance.now() + 80, dur: 420 }); callout('wish', id ? 'no more ' + RX.CARDS[id].verb.toLowerCase() : '', PENCIL); buildKit(); kitObjs.forEach(q => { q.born = 0; }); dirty = true; }
  function doTwist() { const o = twistOpt(); if (!o) return; g.twisted = g.page; st.twC = null; st.chainN = 0; react(o, o.id, false, { x: C0.x, z: C0.z }, true); }
  // One reaction on the page, whether it was clicked or is a step of a chain that is running by itself
  function react(o, rid, fin, lab, free) {
    const s = { id: rid, fin };
    if (free && o.model.settle) o.model.settle(FOLDS[rid] ? 2200 : 160);
    if (free && !o.self) sfx.chain(st.chainN || 0);
    flush(); setHover(-1); st.mode = 'move';
    const prev = center, tok = st.tok, before = P.made(g), wasOpen = g.cur.path.length > 0, from = new Map();
    if (s.fin) P.synFinish(g, o); else P.synTake(g, o, free);
    // The molecule changes where it stands. Every atom that is still there moves from where it was to where it now
    // belongs, and atoms that are new grow in at the place the reagent reaches.
    const seed = new Map(), seedBead = new Map(); if (o.map) { o.map.forEach((na, oa) => { const p = prev.at.get(oa); if (p && prev.balls.has(oa)) seed.set(na, p); }); prev.beads.forEach(q => { const nr = o.map.get(q.root); if (nr) seedBead.set(nr, prev.at.get(q.pa)); }); }
    const nm = buildMol(g.m, null, false, seed.size ? seed : null, seedBead); place(nm, C0, st.sc);
    if (o.map) o.map.forEach((na, oa) => { const p = prev.at.get(oa); if (p && prev.balls.has(oa) && nm.balls.has(na)) from.set(na, p.clone()); });
    nm.beads.forEach(b => { const ob = prev.beads.find(q => o.map && o.map.get(q.root) === b.root); if (ob) from.set(b.pa, prev.at.get(ob.pa).clone()); });
    nm.marks = marksOf(nm, o.r.made || []);
    // group letters: one that is no longer there is struck through, one that is new is written when the reagent arrives
    { const old = prev.groups || [], now2 = groupsOf(nm), used = new Set(); now2.forEach(q => { let bi = -1, bd = 2.2; old.forEach((p, k) => { if (used.has(k) || p.txt !== q.txt) return; const d = Math.hypot(p.x - q.x, p.z - q.z); if (d < bd) { bd = d; bi = k; } }); if (bi >= 0) used.add(bi); else q.born = true; }); nm.groups = now2; nm.ghosts = old.filter((p, k) => !used.has(k)); }
    // What leaves the molecule: a small molecule of its own, set where it left from. It will fly to whatever
    // catches it, or to the beaker, the balloon or the tally.
    { const rev = new Map(); if (o.map) o.map.forEach((na, oa) => rev.set(na, oa));
      (o.r.gone || []).forEach((grp0, gi) => {
        const kind = P.byKind(grp0), grp = new T.Group(), els = kind === 'water' ? ['O', 'H', 'H'] : kind === 'h2' ? ['H', 'H'] : grp0.map(a => a.el).sort((a, b) => (a === 'H') - (b === 'H')).slice(0, 3), hub = els[0] !== 'H';
        els.forEach((el, k) => { const side = k % 2 ? -1 : 1, px0 = hub ? (k ? side * 0.78 : 0) : side * 0.36, py = hub && k ? 0.5 : 0; add(SPH, ballMat(el), px0, py, 0, grp).scale.setScalar(BALL(el)); });
        const srcA = grp0.map(a => rev.get(a)).find(a => a && prev.balls.has(a)), p = srcA ? prev.at.get(srcA) : nm.marks[0] ? { x: nm.marks[0].x, y: 0.6, z: nm.marks[0].z } : { x: 0, y: 0.6, z: 0 };
        grp.position.set(C0.x + p.x * st.sc, p.y * st.sc, C0.z + p.z * st.sc); grp.scale.setScalar(st.sc); scene.add(grp);
        st.flyers.push({ grp, gi, kind, at: { x: p.x, z: p.z }, from: grp.position.clone(), to: null, t0: 0, dur: 520, spin: (Math.random() - 0.5) * 9 });
      }); }
    prods.forEach(m => { if (m) tween(m, { x: m.group.position.x, z: m.group.position.z }, 0.01, 0.14, () => freeMol(m)); }); prods = [];
    tweens = tweens.filter(tw => tw.m !== prev); freeMol(prev); center = nm; SC_MAIN = fitMain(nm);
    const L = land(o, before, wasOpen, nm, s.id, lab, from);
    st.zoomT = performance.now();
    // the next choice opens as soon as the places have changed. Equipment goes on firing while the player looks
    setTimeout(() => {
      if (tok !== st.tok || center !== nm) return;
      nm.hot = g.cur.path.length ? marksOf(nm, Array.from(g.cur.fresh), 0.01, 0.2) : [];
      if (g.over) return;
      // a page that is used up with a row of three or more on it waits for the player to set it off
      if (!g.chain && g.pageSteps >= P.stepsOf(g) && P.charged(g)) { st.mode = 'fuse'; st.fuseT = performance.now(); slots = []; prods.forEach(freeMol); prods = []; dirty = true; const tk = st.tok; setTimeout(() => { if (st.tok === tk && st.mode === 'fuse') setOff(); }, 280); return; }
      // a chain that has been set off takes the next reaction by itself
      { const wasChain = g.chain, c = P.chainNext(g); if (!c && wasChain) { st.chainN = 0; st.mode = 'play'; return nextPage(); } if (c) { st.chainN = (st.chainN || 0) + 1; const k = g.kinds.indexOf(c.id); return react(c, c.id, false, LAB[k] ? { x: LAB[k].x - 0.8, z: LAB[k].z + 0.5 } : { x: 17, z: -6 }, true); } st.chainN = 0; }
      st.mode = 'play'; refresh();
      // a page with nothing left to do turns itself
      if (!slots.some(q => q && q.o)) { st.mode = 'move'; setTimeout(() => { if (tok !== st.tok) return; st.mode = 'play'; nextPage(); }, Math.max(300, L.dur - L.unlock + 120)); }
    }, L.unlock);
    if (g.over) setTimeout(() => { if (tok === st.tok) endRound(); }, L.dur + 120);
    dirty = true;
  }
  const next = () => { if (st.mode === 'shop') return newRun(); if (st.mode !== 'done') return; if (st.pass) { run.round++; showPicks(); } else showSuppliers(); };

  // ---------- ink ----------
  const px = p => [(p.x + SW / 2) * U, (p.z + SH / 2) * U];
  // The page is written in the game's own pen lettering (pen.js). ?font=classic brings back the two font files.
const FONT = new URLSearchParams(location.search).get('font') === 'classic' ? 'classic' : 'own', FAM = '';
const hand = (x, n) => { x.font = Math.round(n) + 'px ' + (FAM || 'Hand') + ', "Segoe Print", sans-serif'; if (FONT === 'own') AA.rxPen.set(x, n, false); };
  const marker = (x, n) => { x.font = (FAM ? 'bold ' : '') + Math.round(n) + 'px ' + (FAM || 'Marker') + ', "Segoe Print", sans-serif'; if (FONT === 'own') AA.rxPen.set(x, n, true); };
  function wob(x, a, b, lw, col, dash) {
    const A = px(a), B = px(b), n = 14; x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.setLineDash(dash || []); x.beginPath();
    for (let k = 0; k <= n; k++) { const t = k / n, j = Math.sin(t * 11 + A[0] * 0.013) * 2.2; const X = A[0] + (B[0] - A[0]) * t + j, Y = A[1] + (B[1] - A[1]) * t + j * 0.6; if (k) x.lineTo(X, Y); else x.moveTo(X, Y); }
    x.stroke(); x.setLineDash([]);
  }
  function arrow(x, a, b, lw, col, dash) {
    const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, hd = Math.min(1.0, d * 0.3);
    wob(x, a, b, lw, col, dash);
    wob(x, { x: b.x - ux * hd - uz * hd * 0.55, z: b.z - uz * hd + ux * hd * 0.55 }, b, lw, col); wob(x, { x: b.x - ux * hd + uz * hd * 0.55, z: b.z - uz * hd - ux * hd * 0.55 }, b, lw, col);
  }
  // letters text no wider than w, shrinking it if it has to. Returns the size used
  const fit = (x, text, size, w, font) => { let n = size; font(x, n); while (n > 14 && x.measureText(text).width > w) { n -= 4; font(x, n); } return n; };
  // one tick for each time the number to beat has been reached. Past ten, the count and a single tick
  function tickRow(x, cx, cy, n, size, col) {
    const one = (px0, py0) => { x.beginPath(); x.moveTo(px0 - size * 0.42, py0 - size * 0.05); x.lineTo(px0 - size * 0.12, py0 + size * 0.32); x.lineTo(px0 + size * 0.48, py0 - size * 0.5); x.stroke(); };
    x.strokeStyle = col; x.lineWidth = size * 0.2; x.lineCap = 'round'; x.lineJoin = 'round';
    if (n > 10) { marker(x, size * 1.5); x.textAlign = 'right'; x.fillStyle = col; x.fillText(String(n), cx - size * 0.2, cy + size * 0.4); one(cx + size * 0.7, cy); return; }
    for (let k = 0; k < n; k++) one(cx + (k - (n - 1) / 2) * size * 1.15, cy);
  }
  const wrap = (x, text, w) => { const out = []; let line = ''; String(text).split(' ').forEach(t => { const n = line ? line + ' ' + t : t; if (line && x.measureText(n).width > w) { out.push(line); line = t; } else line = n; }); if (line) out.push(line); return out; };
  const ring = (x, c, rx, ry, lw, col, rot) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); x.ellipse(c[0], c[1], rx, ry, rot || 0.15, 0.3, 6.6); x.stroke(); };
  // how rare a reagent is: one to four dots in the color of its rarity
  function dots(x, id, cx, cy, r) { const q = P.rarityOf(id); x.fillStyle = q.col; for (let k = 0; k < q.dots; k++) { x.beginPath(); x.arc(cx + (k - (q.dots - 1) / 2) * r * 2.8, cy, r, 0, 6.3); x.fill(); } }
  // A flick of ink from a to b, in ink pixels: a curve that bows to one side, thin at its tail and full at its head.
  // Only the part between t0 and t1 of the way is drawn, so a flick can travel and its tail can catch up.
  function flick(x, a, b, t0, t1, w, col, bow) {
    if (t1 - t0 < 0.01) return;
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, cx = (a[0] + b[0]) / 2 + nx * len * bow, cy = (a[1] + b[1]) / 2 + ny * len * bow, N = 16, L = [], R = [];
    for (let i = 0; i <= N; i++) { const u = i / N, t = t0 + (t1 - t0) * u, q = 1 - t, X = q * q * a[0] + 2 * q * t * cx + t * t * b[0], Y = q * q * a[1] + 2 * q * t * cy + t * t * b[1], tx = 2 * q * (cx - a[0]) + 2 * t * (b[0] - cx), ty = 2 * q * (cy - a[1]) + 2 * t * (b[1] - cy), tl = Math.hypot(tx, ty) || 1, h = w * 0.5 * Math.pow(u, 0.7) * (u > 0.93 ? (1 - u) / 0.07 * 0.5 + 0.5 : 1); L.push([X - ty / tl * h, Y + tx / tl * h]); R.push([X + ty / tl * h, Y - tx / tl * h]); }
    x.fillStyle = col; x.beginPath(); x.moveTo(L[0][0], L[0][1]); for (let i = 1; i <= N; i++) x.lineTo(L[i][0], L[i][1]); for (let i = N; i >= 0; i--) x.lineTo(R[i][0], R[i][1]); x.closePath(); x.fill();
  }
  // a splat where a flick lands: a blot with a few short spokes
  function splat(x, c, r, col, seed) { x.fillStyle = col; x.beginPath(); for (let i = 0; i <= 20; i++) { const a = i / 20 * 6.283, rr = r * (0.75 + 0.5 * hash(seed + 's' + (i % 20))); if (i) x.lineTo(c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr * 0.8); else x.moveTo(c[0] + Math.cos(a) * rr, c[1] + Math.sin(a) * rr * 0.8); } x.fill(); }
  // What each reagent takes and what it leaves, by group. A row carries on when the next tile takes what the last one left.
  const TILE = { snap: ['C=C', 'cage'], aromatize: ['ring', 'arene'], cyclize: ['OH', 'ring'], hydrate: ['C=C', 'OH'], pcc: ['OH', 'C=O'], nabh4: ['C=O', 'OH'], dehydrate: ['OH', 'C=C'], h2: ['C=C', 'CH'], hcl: ['C=C', 'Cl'], bh3: ['C=C', 'OH'], socl2: ['OH', 'Cl'], koh: ['Cl', 'C=C'], naoh: ['Cl', 'OH'],
    memgbr: ['C=O', 'OH', '+C'], wittig: ['C=O', 'C=C', '+C'], allyl: ['C=O', 'OH', '+3C'], aibn: ['C=C', 'chain'], wacker: ['C=C', 'C=O'], wolff: ['C=O', 'CH'] };
  const GCOL = { 'C=C': '#3a6fd0', OH: '#d6453a', 'C=O': '#e07a00', Cl: '#3c9a5f', CH: '#8d949c', chain: '#e23c6e' };
  function chip(x, txt, cx, cy, on) { hand(x, 34); const w = Math.max(74, x.measureText(txt).width + 26); x.fillStyle = on ? GCOL[txt] || INK : 'rgba(141,148,156,0.35)'; x.beginPath(); x.ellipse(cx, cy - 11, w / 2, 25, 0, 0, 6.3); x.fill(); x.fillStyle = '#fbf8ee'; x.textAlign = 'center'; x.fillText(txt, cx, cy); return w; }
  // a coin of credit, drawn in ink
  function coin(x, cx, cy, r) { x.fillStyle = '#e9b93a'; x.beginPath(); x.arc(cx, cy, r, 0, 6.3); x.fill(); x.strokeStyle = '#8a6a00'; x.lineWidth = 4; x.beginPath(); x.arc(cx, cy, r, 0, 6.3); x.stroke(); x.beginPath(); x.arc(cx, cy, r * 0.55, 0.4, 5.2); x.stroke(); }
  // the marks of the three numbers: a ring for places, chevrons for the row, a star for extra
  function glyph(x, k, cx, cy, s, col) {
    x.strokeStyle = col || PART[k]; x.lineWidth = Math.max(3, s * 0.15); x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath();
    if (k === 'p') x.arc(cx, cy, s * 0.34, 0, 6.3);
    else if (k === 'r') [-0.2, 0.18].forEach(d => { x.moveTo(cx + (d - 0.15) * s, cy - 0.3 * s); x.lineTo(cx + (d + 0.15) * s, cy); x.lineTo(cx + (d - 0.15) * s, cy + 0.3 * s); });
    else for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3 + 0.26; x.moveTo(cx - Math.cos(a) * s * 0.38, cy - Math.sin(a) * s * 0.38); x.lineTo(cx + Math.cos(a) * s * 0.38, cy + Math.sin(a) * s * 0.38); }
    x.stroke();
  }
  // lettering in which {p}, {r} and {e} are drawn as the marks. Words take the color of the mark before them
  function inkLine(x, str, cx, y, size, col, align) {
    const bits = String(str).trim().split(/(\{[pre]\})/).filter(Boolean); hand(x, size); if (bits.length > 1 && bits[0] === '{p}') bits[1] = bits[1].replace(/^\s+/, '');
    const word = (b, i) => (b[1] === 'p' || /^\s*times/.test(bits[i + 1] || '') ? '' : 'times'), ws = bits.map((b, i) => (b[0] === '{' ? x.measureText(word(b, i)).width : x.measureText(b).width)), tot = ws.reduce((a, b) => a + b, 0);
    let px0 = align === 'right' ? cx - tot : align === 'left' ? cx : cx - tot / 2, cur = col; x.textAlign = 'left';
    bits.forEach((b, i) => { if (b[0] === '{') { cur = PART[b[1]]; const w = word(b, i); if (w) { x.fillStyle = cur; x.fillText(w, px0, y); } } else { x.fillStyle = cur || col; x.fillText(b, px0, y); } px0 += ws[i]; });
    return tot;
  }
  const swipe = (x, a, b, w, col) => { x.strokeStyle = col || HILITE; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); };
  function ends(i) { const p = SPOT[i], dx = p.x - C0.x, dz = p.z + 3 - C0.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d; return { a: { x: p.x - ux * 3.2, z: p.z + 2.9 - uz * 2.6 }, b: { x: p.x - ux * 0.6, z: p.z + 2.9 } }; }
  function drawInk(now) {
    const x = ink.x; x.clearRect(0, 0, IW, IH); x.textBaseline = 'alphabetic';
    if (st.mode === 'shop') {
      const h = px({ x: 0, z: -13 }); marker(x, 100); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('suppliers', h[0], h[1]);
      hand(x, 46); x.fillStyle = PENCIL; x.fillText('that run beat ' + shop.earned + ' rounds and paid ' + shop.earned + ' credit.   credit: ' + meta.credit, h[0], h[1] + 64);
      P.SUPPLY.forEach((sp, i) => {
        const c = px({ x: -20, z: -9.2 + i * 3.6 }), open = i <= meta.tier, nextUp = i === meta.tier + 1, can = nextUp && meta.credit >= sp.cost, hov = st.hover === i && nextUp;
        if (open) swipe(x, [c[0] - 10, c[1] - 18], [c[0] + x.measureText(sp.name).width * 1.5 + 60, c[1] - 22], 50);
        marker(x, 50); x.textAlign = 'left'; x.fillStyle = open ? INK : nextUp ? INK : FAINT; x.fillText(sp.name, c[0], c[1]);
        hand(x, 40); x.fillStyle = open ? GREEN : can ? REDINK : PENCIL; x.fillText(open ? 'open' : nextUp ? (can ? 'open for ' + sp.cost : sp.cost + ' credit') : '', c[0] + 560, c[1] - 6);
        hand(x, 38); x.fillStyle = open || nextUp ? PENCIL : FAINT;
        const things = (sp.kin || []).map(k => k + ' molecules').concat(sp.reagents.map(id => RX.CARDS[id].verb.toLowerCase())).concat(sp.gear.map(id => P.GEARS[id].name)).concat(sp.rare ? ['rare versions of reagents'] : []);
        hand(x, 30); wrap(x, (things.length ? things.join(',  ') : ''), 800).slice(0, 1).forEach((ln, j) => x.fillText(ln, c[0], c[1] + 40 + j * 30));
        if (hov) ring(x, [c[0] + 400, c[1] + 6], 470, 86, 5, INK, 0.01);
      });
      P.FAMILIES.forEach((f, i) => {
        const c = px({ x: 8, z: -9.2 + i * 3.6 }), open = !!meta.fam[f.id], can = !open && meta.credit >= f.cost, hov = st.hover === 100 + i && !open;
        if (open) swipe(x, [c[0] - 10, c[1] - 18], [c[0] + 330, c[1] - 22], 50);
        marker(x, 50); x.textAlign = 'left'; x.fillStyle = INK; x.fillText(f.name, c[0], c[1]);
        hand(x, 40); x.fillStyle = open ? GREEN : can ? REDINK : PENCIL; x.fillText(open ? 'open' : can ? 'open for ' + f.cost : f.cost + ' credit', c[0] + 380, c[1] - 6);
        hand(x, 30); x.fillStyle = PENCIL; x.fillText(f.reagents.map(id => RX.CARDS[id].verb.toLowerCase()).join(',  '), c[0], c[1] + 40); f.reagents.forEach((id, k) => dots(x, id, c[0] + 380 + k * 70, c[1] + 32, 6));
        if (hov) ring(x, [c[0] + 250, c[1] + 6], 300, 86, 5, INK, 0.01);
      });
      { const found = Object.keys(meta.found).filter(k => meta.found[k]), c = px({ x: 8, z: 2.6 }); marker(x, 50); x.textAlign = 'left'; x.fillStyle = found.length ? INK : FAINT; x.fillText('found', c[0], c[1]); hand(x, 30); x.fillStyle = PENCIL; x.fillText(found.length ? found.map(id => RX.CARDS[id].verb.toLowerCase()).join(',  ') : 'a named row done for the first time', c[0], c[1] + 40); }
      const n0 = px({ x: 0, z: 12.4 }); marker(x, 70); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('click here to start a run', n0[0], n0[1]);
      hand(x, 40); x.fillStyle = PENCIL; x.fillText('best: ' + best + ' rounds', n0[0], n0[1] + 50);
      if (st.call && now - st.call.t < 1400) { const c = px(CALL); marker(x, 110); x.fillStyle = st.call.col; x.lineWidth = 14; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(st.call.text, c[0], c[1] + 500); x.fillText(st.call.text, c[0], c[1] + 500); }
      ink.t.needsUpdate = true; return;
    }
    if (st.mode === 'brief') {
      const h = px({ x: 0, z: -11 }); marker(x, 120); x.textAlign = 'center'; swipe(x, [h[0] - 300, h[1] - 36], [h[0] + 300, h[1] - 46], 110); x.fillStyle = INK; x.fillText('round ' + run.round, h[0], h[1]);
      briefs.forEach((b, i) => {
        const c = px({ x: PICKX[i], z: 3.2 }), B = P.BRIEF[b.brief], hov = st.hover === i;
        hand(x, 40); x.textAlign = 'center'; x.fillStyle = PENCIL; x.fillText(String(i + 1), c[0] - 205, c[1] - 6);
        { const K = P.KIN[b.kin], k1 = px({ x: PICKX[i], z: -8.3 }); if (K) { marker(x, 66); x.textAlign = 'center'; x.fillStyle = K.col; x.fillText(K.name, k1[0], k1[1]); inkLine(x, K.tok + '  ' + K.note, k1[0], k1[1] + 44, 34, INK); } }
        fit(x, B.name, hov ? 76 : 68, 350, marker); x.textAlign = 'center'; x.fillStyle = INK; x.fillText(B.name, c[0], c[1]);
        if (B.note) inkLine(x, B.note, c[0], c[1] + 62, 40, INK);
        const y = c[1] + 150; marker(x, 62); x.textAlign = 'center'; x.fillStyle = REDINK; x.fillText(fmt(b.quota), c[0], y);
        for (let n = 0; n < (b.pays || 0); n++) coin(x, c[0] - ((b.pays - 1) * 26) + n * 52, y + 52, 20);
        if (hov) swipe(x, [c[0] - 150, c[1] + 16], [c[0] + 150, c[1] + 10], 16);
      });
      { const k0 = px({ x: 0, z: 12.1 }); hand(x, 38); x.textAlign = 'center'; x.fillStyle = PENCIL; x.fillText('reagents: ' + run.rack.map(id => RX.CARDS[id].verb.toLowerCase()).join(',  '), k0[0], k0[1]); if (run.gear.length) x.fillText('equipment: ' + run.gear.map(id => P.GEARS[id].name + ((run.lv[id] || 1) > 1 ? ' level ' + run.lv[id] : '')).join(',  '), k0[0], k0[1] + 46); }
      ink.t.needsUpdate = true; return;
    }
    if (st.mode === 'pick') {
      const h = px({ x: 0, z: -11 }); marker(x, 120); x.textAlign = 'center'; swipe(x, [h[0] - 230, h[1] - 36], [h[0] + 230, h[1] - 46], 110); x.fillStyle = INK; x.fillText('take one', h[0], h[1]);
      hand(x, 50); x.fillStyle = PENCIL; x.fillText('round ' + run.round, h[0], h[1] + 70);
      picks.forEach((o, i) => {
        const c = px({ x: PICKX[i], z: 3.6 }), isGear = o.kind === 'gear' || o.kind === 'level', title = isGear ? P.GEARS[o.id].name : RX.CARDS[o.id].verb.toLowerCase() + (o.kind === 'reagent' && P.PAIR[o.id] ? ' + ' + RX.CARDS[P.PAIR[o.id]].verb.toLowerCase() : ''), hov = st.hover === i;
        const kind = o.kind === 'reagent' ? 'new reagent' : o.kind === 'gear' ? 'equipment' : o.kind === 'level' ? 'level up' : o.kind === 'strong' ? 'stronger reagent' : 'more of a reagent';
        if (!isGear) { const t0 = px({ x: PICKX[i], z: -2 }); fit(x, title, 96, 440, marker); x.textAlign = 'center'; x.fillStyle = rgb(colOf(o.id)); x.fillText(title, t0[0], t0[1]); swipe(x, [t0[0] - 150, t0[1] + 22], [t0[0] + 150, t0[1] + 16], 20, rgb(colOf(o.id))); if (o.kind === 'reagent') dots(x, o.id, t0[0], t0[1] + 62, 9); }
        hand(x, 40); x.fillStyle = PENCIL; x.fillText((i + 1) + '   ' + kind, c[0], c[1] - 56);
        if (isGear) { marker(x, hov ? 66 : 58); x.fillStyle = INK; x.fillText(title, c[0], c[1]); }
        hand(x, 40); x.fillStyle = INK; wrap(x, P.pickText(run, o), 430).forEach((w, j) => x.fillText(w, c[0], c[1] + 52 + j * 42));
        if (hov) ring(x, [c[0], c[1] - 10], 300, 150, 6, INK, 0.02);
      });
      { const k0 = px({ x: 0, z: 11.4 }); hand(x, 38); x.fillStyle = PENCIL; x.fillText('reagents: ' + run.rack.map(id => RX.CARDS[id].verb.toLowerCase()).join(',  '), k0[0], k0[1]); if (run.gear.length) x.fillText('equipment: ' + run.gear.map(id => P.GEARS[id].name + ((run.lv[id] || 1) > 1 ? ' level ' + run.lv[id] : '')).join(',  '), k0[0], k0[1] + 46); }
      const b0 = px({ x: -21.5, z: 12.6 }); hand(x, 40); x.textAlign = 'left'; x.fillStyle = PENCIL; x.fillText('best ' + best, b0[0], b0[1]);
      ink.t.needsUpdate = true; return;
    }
    const play = st.mode === 'play', open = g.cur.path.length > 0;
    { const occ = st.gear.filter(id => P.GEARS[id].kin === 'occult').length; x.strokeStyle = 'rgba(70,30,90,0.42)'; x.lineWidth = 3; x.lineCap = 'round';
      for (let k = 0; k < occ * 5; k++) { const dp = px({ x: -26 + 3.4 * hash('dx' + k), z: -12.5 + 6 * hash('dy' + k) }), cx = dp[0], cy = dp[1], r = 13 + 12 * hash('dr' + k), kind = k % 3;
        x.beginPath();
        if (kind === 0) { for (let q = 0; q <= 5; q++) { const a = -1.571 + q * 2.513; if (q) x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); else x.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } }
        else if (kind === 1) { x.ellipse(cx, cy, r, r * 0.5, 0, 0, 7); x.moveTo(cx + r * 0.25, cy); x.arc(cx, cy, r * 0.25, 0, 7); }
        else { for (let q = 0; q < 4; q++) { x.moveTo(cx - r + q * r * 0.5, cy - r * 0.6); x.lineTo(cx - r + q * r * 0.5, cy + r * 0.6); } x.moveTo(cx - r * 1.2, cy + r * 0.5); x.lineTo(cx + r * 0.9, cy - r * 0.5); }
        x.stroke(); } }
    st.stains.forEach(k => { const c = px(k); if (k.ring) { x.strokeStyle = 'rgba(120,70,20,' + (k.a * 1.6) + ')'; x.lineWidth = k.r * 0.16; x.beginPath(); x.ellipse(c[0], c[1], k.r, k.r * 0.9, 0.3, 0, 7); x.stroke(); } else { x.fillStyle = 'rgba(150,80,20,' + k.a + ')'; x.beginPath(); x.ellipse(c[0], c[1], k.r, k.r * 0.8, 0.5, 0, 7); x.fill(); } });
    // ink thrown off by the last reaction
    if (false && g && st.shown >= st.quota && st.quota > 0) { const ov = Math.log2(Math.max(1, st.shown / st.quota)), c = px({ x: FLASK.x, z: FLASK.z + 0.9 }), r = Math.min(140, 46 + 20 * ov); x.globalAlpha = 0.3; x.fillStyle = flask.hex; x.beginPath(); x.ellipse(c[0], c[1], r * 1.25, r * 0.6, 0.05, 0, 6.3); x.fill(); x.beginPath(); x.ellipse(c[0] + r * 0.9, c[1] + r * 0.2, r * 0.45, r * 0.25, 0.4, 0, 6.3); x.fill(); x.beginPath(); x.ellipse(c[0] - r, c[1] - r * 0.1, r * 0.35, r * 0.2, -0.3, 0, 6.3); x.fill(); x.globalAlpha = 1; }
    st.slashes = st.slashes.filter(q => now - q.t < 520); st.slashes.forEach(q => { const k = (now - q.t) / 520, head = Math.min(1, k * 4), tail = Math.max(0, k * 2.2 - 1), a = px({ x: q.x - q.dx / 2, z: q.z - q.dz / 2 }), b = px({ x: q.x + q.dx / 2, z: q.z + q.dz / 2 }); x.globalAlpha = 0.45 * (1 - k * k); flick(x, a, b, tail, head, q.w * 1.3, q.col, (hash(String(Math.round(q.t + q.x * 97))) - 0.5) * 0.35); x.globalAlpha = 1; });
    st.blots = st.blots.filter(b => now - b.t < 700); st.blots.forEach(b => { const k = (now - b.t) / 700, c = px(b); x.globalAlpha = (0.55 + 0.4 * st.fury) * (1 - k); if (b.line) { const c2 = px({ x: b.x + (b.x2 - b.x) * 0.55, z: b.z + (b.z2 - b.z) * 0.55 }), head = Math.min(1, k * 5), tail = Math.max(0, k * 2.4 - 0.6); flick(x, c, c2, Math.min(tail, head), head, b.r * 1.8, b.col, 0); } else { x.fillStyle = b.col; x.beginPath(); x.arc(c[0], c[1], b.r * (0.6 + k), 0, 7); x.fill(); } }); x.globalAlpha = 1;
    // circled in ink on the page: what each product changed, and on the middle molecule where the reagent under the pointer acts
    const circle = (m, k, col, lw) => { const sc = m.group.scale.x, c = px({ x: m.group.position.x + k.x * sc, z: m.group.position.z + k.z * sc }), r = k.r * sc * U; x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.beginPath(); x.ellipse(c[0], c[1], r * 1.05, r, 0.1, 0.25, 6.7); x.stroke(); };
    // the atoms the last reaction changed stay marked in yellow while the row is open: react there and the row goes on
    if (center && center.hot.length && g.cur.path.length && st.mode !== 'done' && !(CUT.includes('a') && st.peek)) { const pk = st.peek, sc = center.group.scale.x, pulse = 0.45 + 0.2 * Math.sin(now / 220);
      center.hot.forEach(k => { const c = px({ x: C0.x + k.x * sc, z: C0.z + k.z * sc }), r = 0.8 * sc * U; x.globalAlpha = pk && pk.breaks ? 0.25 : pk ? 0.8 : pulse; x.fillStyle = pk && pk.breaks ? 'rgb(160,160,160)' : 'rgb(255,214,0)'; x.beginPath(); x.ellipse(c[0], c[1], r, r * 0.86, 0, 0, 6.3); x.fill(); x.globalAlpha = 1; }); dirty = true; }
    if (center && center.flat && !(morph && morph.m === center)) { const sc = center.group.scale.x, gp = a => { const p = center.at.get(a), t = -p.y / camDir.y; return px({ x: C0.x + (p.x + camDir.x * t) * sc, z: C0.z + (p.z + camDir.z * t) * sc }); }; x.strokeStyle = 'rgba(31,42,85,0.55)'; x.lineCap = 'round'; center.sticks.forEach(s => { if (s.a.el === 'H' || s.b.el === 'H') return; const a = gp(s.a), b = gp(s.b); x.lineWidth = s.parts.length > 2 ? 11 : 6; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); }); }
    // a page turning: a leaf of paper sweeps across from the right, its edge shaded
    if (st.turned && now - st.turned < 420) { const k = (now - st.turned) / 420, e = 1 - Math.pow(1 - k, 3), xe = IW * (1 - e), w = IW * 0.22 * Math.sin(k * Math.PI); x.fillStyle = 'rgba(243,237,220,' + (0.9 * (1 - k)).toFixed(3) + ')'; x.fillRect(xe, 0, IW - xe, IH); const gr = x.createLinearGradient(xe - w, 0, xe, 0); gr.addColorStop(0, 'rgba(60,50,30,0)'); gr.addColorStop(1, 'rgba(60,50,30,' + (0.28 * (1 - k)).toFixed(3) + ')'); x.fillStyle = gr; x.fillRect(xe - w, 0, w, IH); dirty = true; }
    // each group is lettered on the page under it. One that has gone is struck through, one that is new is written in
    if (center && center.groups && st.mode !== 'done' && !CUT.includes('b')) { const sc = center.group.scale.x, at2 = q => px({ x: C0.x + q.x * sc, z: C0.z + q.z * sc + 1.25 });
      center.groups.forEach(q => { const age = q.born ? (now - q.t) / 1000 : 9; if (q.born && !(age >= 0)) return; const c = at2(q); if (MOLV === 'pads') { const c0 = px({ x: C0.x + q.x * sc, z: C0.z + q.z * sc }); x.fillStyle = 'rgba(' + PADC[q.txt] + ',0.3)'; x.beginPath(); x.ellipse(c0[0], c0[1], 30 * sc, 22 * sc, 0.1, 0, 6.3); x.fill(); } const pop = age < 0.25 ? 1.7 - 2.8 * age : 1; hand(x, 40 * pop); x.textAlign = 'center'; x.lineJoin = 'round'; x.lineWidth = 8; x.strokeStyle = '#fbf8ee'; x.strokeText(q.txt, c[0], c[1]); x.fillStyle = age < 1.2 ? REDINK : INK; x.fillText(q.txt, c[0], c[1]); if (age < 1.2) dirty = true; });
      (center.ghosts || []).forEach(q => { const age = (now - q.t) / 1000, c = at2(q); if (age > 1.3) return; hand(x, 40); x.textAlign = 'center'; x.globalAlpha = age < 0 ? 1 : Math.max(0, 1 - age / 1.3); x.fillStyle = age < 0 ? INK : PENCIL; x.fillText(q.txt, c[0], c[1]); if (age >= 0) { const w = x.measureText(q.txt).width / 2 + 8, k = Math.min(1, age / 0.12); x.strokeStyle = REDINK; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(c[0] - w, c[1] - 6); x.lineTo(c[0] - w + 2 * w * k, c[1] - 14); x.stroke(); } x.globalAlpha = 1; dirty = true; }); }
    // under the beaker and the balloon: how many of three. A ring when it can be spent. Beside them, the tally
    if (st.mode !== 'done') { [['water', BEAK, '#3a6fd0'], ['h2', BALN, '#d6453a']].forEach(q => { if (true) return; const c = px({ x: q[1].x, z: q[1].z + 1.5 }), n = Math.min(P.BY.need, st.by[q[0]]);
        for (let k = 0; k < P.BY.need; k++) { x.beginPath(); x.arc(c[0] + (k - 1) * 26, c[1], 9, 0, 6.3); if (k < n) { x.fillStyle = q[2]; x.fill(); } else { x.strokeStyle = FAINT; x.lineWidth = 3; x.stroke(); } }
        });
      const t0 = px(TALLY), n = 0, sa = 9; x.strokeStyle = INK; x.lineCap = 'round';
      const full = sa < 0.9, shown = full ? 4 : n; for (let k = 0; k < Math.min(4, shown); k++) { x.lineWidth = 6; x.beginPath(); x.moveTo(t0[0] + k * 20 + 3 * hash('ta' + k), t0[1]); x.lineTo(t0[0] + k * 20 - 4, t0[1] - 58 * (k === shown - 1 && !full ? 1 - 0.5 * st.byBump.gauge * 0 : 1)); x.stroke(); }
      if (full) { const k2 = Math.min(1, sa / 0.14); x.globalAlpha = sa > 0.6 ? 1 - (sa - 0.6) / 0.3 : 1; x.strokeStyle = REDINK; x.lineWidth = 8; x.beginPath(); x.moveTo(t0[0] - 16, t0[1] - 8); x.lineTo(t0[0] - 16 + 100 * k2, t0[1] - 8 - 42 * k2); x.stroke(); x.globalAlpha = 1; dirty = true; } }
    // pointing at a reaction rings the places it will change, in its color
    if (st.peek && center) { const sc = center.group.scale.x; x.fillStyle = st.peek.col; x.globalAlpha = 0.5 + 0.12 * Math.sin(now / 130); st.peek.marks.forEach(k => { const c = px({ x: C0.x + k.x * sc, z: C0.z + k.z * sc }), r = 0.95 * sc * U; x.beginPath(); x.ellipse(c[0], c[1], r, r * 0.86, 0, 0, 6.3); x.fill(); }); x.globalAlpha = 1; dirty = true; }
    // ink that runs from a reagent to a place, and from a place to the equipment it sets off
    st.strokes = st.strokes.filter(q => now - q.t < q.dur + 260); st.strokes.forEach(q => {
      const age = now - q.t, k0 = Math.min(1, age / q.dur), head = k0 * k0, tail = age < q.dur ? Math.max(0, head - 0.55) : Math.min(1, 0.45 + (age - q.dur) / 130 * 0.55), a = px(q.a), b = px(q.b), bow = (hash(String(Math.round(q.t))) - 0.5) * 0.5;
      x.globalAlpha = 0.92; flick(x, a, b, tail, head, 22, q.col, bow);
      if (age >= q.dur) { const k = (age - q.dur) / 260; x.globalAlpha = 0.85 * (1 - k); splat(x, b, 16 + 26 * Math.sqrt(k), q.col, String(Math.round(q.t))); }
      x.globalAlpha = 1; });
    // the arrows out of the molecule, and what each one does. Yellow marks the ones that continue the run
    if (play) slots.forEach((s, i) => {
      if (!s) return;
      const o = s.o, hov = st.hover === i, card = RX.CARDS[s.id], verb = card.verb.toLowerCase(), m = px(LAB[i]), e = ends(i), col = o ? INK : FAINT;
      if (o && !SIDE) { if (o.cont && open) swipe(x, px(e.a), px(e.b), 26); arrow(x, e.a, e.b, hov ? 9 : 6, col, o.loop ? [14, 12] : null); }
      if (o && SIDE && o.cont && open) swipe(x, [m[0] - 130, m[1] - 10], [m[0] + 120, m[1] - 14], 70);
      x.save(); x.translate(m[0], m[1]);
      { const tl = TILE[s.id] || ['', ''], on = !!o;
        hand(x, 30); x.textAlign = 'right'; x.fillStyle = 'rgba(90,86,78,0.7)'; x.fillText(s.fin ? 'F' : String(i + 1), -128, -2);
        chip(x, tl[0], -72, 0, on); x.strokeStyle = on ? INK : FAINT; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(-22, -12); x.lineTo(8, -12); x.lineTo(-2, -22); x.moveTo(8, -12); x.lineTo(-2, -2); x.stroke(); chip(x, tl[1], 62, 0, on);
        if (tl[2]) { hand(x, 30); x.textAlign = 'left'; x.fillStyle = on ? '#8a5a2b' : FAINT; x.fillText(tl[2], 108, -2); }
        hand(x, 26); x.textAlign = 'center'; x.fillStyle = on ? (hov ? INK : PENCIL) : FAINT; x.fillText(verb, -4, 34);
        if (o && g && st.mode === 'play') { const key = g.page + ':' + g.trail.length; if (s.gk !== key) { s.gk = key; try { s.gv = P.peek(g, o).gain; } catch (e) { s.gv = null; } } if (s.gv != null) { marker(x, o.cont ? 40 : 32); x.textAlign = 'right'; x.fillStyle = o.cont ? INK : PENCIL; x.fillText('+' + fmt(s.gv), -186, 6); } }
        if (!s.fin && o) { x.fillStyle = rgb(colOf(s.id)); for (let k = 0; k < Math.min(6, g.left[s.id] || 0); k++) { x.beginPath(); x.arc(-112 + k * 17, 27, 5.5, 0, 6.3); x.fill(); } }
        if (hov && o) { x.strokeStyle = INK; x.lineWidth = 5; x.beginPath(); x.moveTo(-120, 46); x.lineTo(112, 44); x.stroke(); } }
      x.restore();
    });
    // the three numbers that multiply into what is made: places, row and extra. Each jumps when it changes
    if (st.mode !== 'done') {
      const mp = px(FEWER ? { x: MULT.x + 0.6, z: MADE.z + 2.9 } : MULT), len = g.cur.path.length; x.save(); if (FEWER) { x.translate(mp[0], mp[1]); x.scale(0.6, 0.6); x.translate(-mp[0], -mp[1]); }
      { const mult = st.R * st.E, liveP = st.P > 0, liveM = mult > 1.0001, kp = 1 + 0.4 * st.bump.p, km = 1 + 0.4 * Math.max(st.bump.r, st.bump.e), c1 = mp[0] + 80, c2 = mp[0] + 228, c3 = mp[0] + 385;
        if (liveM && len >= 2) swipe(x, [c3 - 70, mp[1] - 24], [c3 + 70, mp[1] - 30], 66);
        fit(x, fmt(st.P), 64 * kp, 150, marker); x.textAlign = 'center'; x.fillStyle = liveP ? PART.p : FAINT; x.fillText(fmt(st.P), c1, mp[1]);
        marker(x, 38); x.fillStyle = liveP ? INK : FAINT; x.fillText('times', c2, mp[1] - 4);
        fit(x, fmtB(mult), 64 * km, 160, marker); x.textAlign = 'center'; x.fillStyle = liveM ? PART.r : FAINT; x.fillText(fmtB(mult), c3, mp[1]);
        // what the reaction under the pointer would add to each, and what it would make
        if (st.peek) { const pk = st.peek, dM = (st.R + pk.dR) * (st.E + pk.dE) - mult; marker(x, 34); x.textAlign = 'center';
          if (Math.abs(pk.dP) >= 0.5) { x.fillStyle = PART.p; x.fillText((pk.dP > 0 ? '+' : '') + fmt(pk.dP), c1, mp[1] - 70); }
          if (Math.abs(dM) >= 0.005) { x.fillStyle = dM < 0 ? PENCIL : PART.r; x.fillText((dM > 0 ? '+' : '') + fmtB(dM), c3, mp[1] - 70); }
          const gq = px(MADE); marker(x, 46); x.textAlign = 'left'; x.fillStyle = '#8a6a00'; x.fillText('+' + fmt(pk.gain), gq[0] + 6, gq[1] - 104); } }
      // one small chevron for each reaction in the row that is open
      for (let k = 0; k < Math.min(9, len); k++) glyph(x, 'r', mp[0] + 385 - (Math.min(9, len) - 1) * 9 + k * 18, mp[1] + 34, 16, PART.r);
      x.restore();
    }
    // equipment: a short token beside it. Its name and what it does are written out only under the pointer
    kitObjs.forEach((k, i) => {
      if (now - (k.born || 0) < 380) { dirty = true; return; }
      const q = P.GEARS[k.id], kp = KITP(i), sideK = KITV === 'side', c = px(sideK ? { x: kp.x + 2.3, z: kp.z + 0.9 } : { x: kp.x, z: kp.z + (KITV === 'back' ? 2.9 : 3.6) }), f = st.fired[k.id], age = f ? (now - f.t) / 1000 : 9, lv = run.lv[k.id] || 1;
      const tokNow = k.id === 'paw' ? (3 - (run.wishes || 0)) + ' wishes' : k.id === 'orb' && g && g.fore ? (g.fore.filter(id => !g.kinds.includes(id)).map(id => '+' + RX.CARDS[id].verb.toLowerCase()).concat(g.kinds.filter(id => !g.fore.includes(id)).map(id => '-' + RX.CARDS[id].verb.toLowerCase())).slice(0, 3).join(' ') || 'same') : q.tok || '';
      const tw = inkLine(x, tokNow, c[0], c[1], sideK ? 28 : 23, INK, sideK ? 'left' : undefined); fit(x, q.name, sideK ? 26 : 28, 148, hand); x.textAlign = sideK ? 'left' : 'center'; x.fillStyle = PENCIL; x.fillText(q.name, c[0], c[1] - (sideK ? 34 : 40));
      for (let n = 1; n < lv; n++) { x.fillStyle = INK; x.beginPath(); x.arc(c[0] + tw / 2 + 18 + (n - 1) * 20, c[1] - 12, 6, 0, 6.3); x.fill(); }
      if (st.kitHover === i) { const h0 = px(sideK ? { x: kp.x + 9, z: kp.z - 1.2 } : KITV === 'back' ? { x: kp.x, z: kp.z + 5 } : { x: kp.x, z: kp.z - 6.4 }); x.lineJoin = 'round'; x.textAlign = 'center'; x.strokeStyle = '#f3eddc';
        hand(x, 40); x.lineWidth = 14; x.strokeText(q.name, h0[0], h0[1]); x.fillStyle = INK; x.fillText(q.name, h0[0], h0[1]);
        hand(x, 28); wrap(x, q.note, 380).forEach((ln, j) => { x.lineWidth = 12; x.strokeText(ln, h0[0], h0[1] + 34 + j * 30); x.fillStyle = PENCIL; x.fillText(ln, h0[0], h0[1] + 34 + j * 30); }); }
      if (age < 0.7 && !PLAIN) { const up = px(sideK ? { x: kp.x + 7.5 + 1.2 * age, z: kp.z - 0.6 } : KITV === 'back' ? { x: kp.x, z: kp.z + 4.6 + (i % 2) * 1.2 + 1.2 * age } : { x: kp.x, z: kp.z - 4.2 - (i % 2) * 1.5 - 1.2 * age }); fit(x, f.txt, 58 * (age < 0.08 ? 1.3 : 1), 160, marker); x.textAlign = 'center'; x.globalAlpha = 1 - age / 0.7; x.lineWidth = 12; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(f.txt, up[0], up[1]); x.fillStyle = f.col || k.col; x.fillText(f.txt, up[0], up[1]); x.globalAlpha = 1; }
    });
    // the round of the run, the pages, and a circle for each reaction on this page
    { const r0 = px({ x: EDGE, z: PAGES.z + 0.45 }); marker(x, 52); x.textAlign = 'left'; x.fillStyle = INK; x.fillText('round ' + run.round, r0[0], r0[1]); }
    if (g.brief !== 'plain') { const B = P.BRIEF[g.brief], b0 = px({ x: EDGE, z: 3.4 }); hand(x, 36); x.textAlign = 'left'; x.fillStyle = INK; x.fillText(B.name, b0[0], b0[1]); inkLine(x, B.note, b0[0] + x.measureText(B.name).width + 22, b0[1], 30, PENCIL, 'left'); }
    if (!FEWER) for (let k = 1; k <= P.pagesOf(g); k++) { const c = px({ x: PAGES.x + (k - 1) * 1.8, z: PAGES.z }); hand(x, 46); x.textAlign = 'center'; x.fillStyle = k === g.page ? INK : k < g.page ? PENCIL : FAINT; x.fillText(String(k), c[0], c[1] + 14); if (k === g.page) ring(x, [c[0], c[1]], 28, 26, 4, INK); }
    // one circle for each reaction on this page. A done one is filled with the color of its reagent, and yellow joins those in a row
    const tr = g.trail.slice(st.pageStart);
    for (let k = 1; k < tr.length; k++) if (tr[k].cont) { const a0 = px({ x: STEP.x + (k - 1) * 2.5, z: STEP.z }), b0 = px({ x: STEP.x + k * 2.5, z: STEP.z }); swipe(x, a0, b0, 34); }
    for (let k = 0; k < P.stepsOf(g); k++) { const c = px({ x: STEP.x + k * 2.5, z: STEP.z }); ring(x, c, 30, 27, 5, INK, 0.1 * k); if (k < g.pageSteps) { x.strokeStyle = tr[k] ? rgb(colOf(tr[k].id)) : INK; x.fillStyle = x.strokeStyle; x.beginPath(); x.ellipse(c[0] + 1, c[1], 19, 17, 0.2, 0, 6.3); x.fill(); } }
    // how much has been made, and the number to beat
    const q = px(MADE), bq = px(BEAT), beaten = st.shown >= st.quota, done = st.mode === 'done';
    { const txt = fmt(st.shown), size = fit(x, txt, 112 * (1 + 0.3 * st.madeBump * Math.cos((1 - st.madeBump) * 5)), 400, marker), mw = x.measureText(txt).width; x.textAlign = 'left'; x.fillStyle = beaten ? GREEN : done ? REDINK : INK; x.fillText(txt, q[0], q[1]);
    }
    hand(x, 30); x.textAlign = 'center'; x.fillStyle = PENCIL; x.fillText('beat', bq[0], bq[1] - 62);
    marker(x, 46); x.textAlign = 'center'; x.fillStyle = REDINK; x.fillText(fmt(st.quota), bq[0], bq[1]); x.strokeStyle = REDINK; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(bq[0] - 60, bq[1] - 46); x.lineTo(bq[0] + 60, bq[1] - 49); x.stroke();
    // what the last reaction made, at the right end of the band, with anything a rare reagent added above it
    st.pings = st.pings.filter(q => now - q.t < 800); st.pings.forEach(q => {
      const k = (now - q.t) / 800, c = px(q), up = c[1] - 30 - 46 * (1 - Math.pow(1 - k, 2));
      if (false) { x.globalAlpha = 1 - k / 0.6; x.strokeStyle = q.ring; x.lineWidth = 7 * (1 - k / 0.6) + 2; x.beginPath(); x.ellipse(c[0], c[1], 14 + (90 + 140 * q.f) * k, 11 + (70 + 110 * q.f) * k, 0.1, 0, 6.3); x.stroke(); if (q.f > 0.4) { x.beginPath(); x.ellipse(c[0], c[1], 8 + (50 + 80 * q.f) * k, 6 + (40 + 60 * q.f) * k, 0.1, 0, 6.3); x.stroke(); } }
      x.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1; { const slam = k < 0.08 ? 2.3 - 17 * k : k < 0.16 ? 0.94 + 0.75 * (k - 0.08) : 1; marker(x, q.size * slam); x.textAlign = 'center'; x.lineJoin = 'round'; x.lineWidth = 10; x.strokeStyle = '#f3eddc'; x.save(); x.translate(c[0], up); x.rotate((hash(q.txt + Math.round(q.t)) - 0.5) * 0.16); x.strokeText(q.txt, 0, 0); x.fillStyle = q.col; x.fillText(q.txt, 0, 0); x.restore(); } x.globalAlpha = 1; });
    st.floats = st.floats.filter(f => now - f.t < 1100); { let lane = 0; st.floats.forEach(f => { f.lane = f.col === '#8a6a00' ? 0 : ++lane; }); }
    st.floats.forEach(f => { const k = (now - f.t) / 1100, rare = f.lane > 0, c = px({ x: GAIN.x, z: GAIN.z - f.lane * 2.6 - 0.5 * k }), pop = k < 0.1 ? 1.4 - 4 * k : 1; x.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1; fit(x, f.txt, Math.min(rare ? 54 : 96, f.size) * pop, 250, marker); x.textAlign = 'left'; x.lineWidth = 10; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(f.txt, c[0], c[1]); x.fillStyle = f.col || '#8a6a00'; x.fillText(f.txt, c[0], c[1]); }); x.globalAlpha = 1;
    // a line lettered across the page when something worth naming happens, or a row of ticks when the number is beaten again
    if (st.call && now - st.call.t < 1400 && st.mode !== 'fuse') {
      const k = (now - st.call.t) / 1400, c = px({ x: CALL.x + 4.6, z: CALL.z - 0.4 }), pop = (k < 0.07 ? 0.3 + 14 * k : k < 0.14 ? 1.28 - 4 * (k - 0.07) : 1) * Math.min(1.5, 1 + 0.07 * (st.chainN || 0)), al = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
      x.save(); x.translate(c[0], c[1]); x.rotate(-0.03); x.scale(pop, pop); x.globalAlpha = al;
      if (st.call.ticks) { const n = st.call.ticks, w = (n > 10 ? 3 : n) * 110; swipe(x, [-w / 2 - 40, -20], [w / 2 + 40, -28], 120); tickRow(x, 0, -24, n, 92, st.call.col); }
      else {
        fit(x, st.call.text, 50, 280, marker); x.textAlign = 'center'; const tw = x.measureText(st.call.text).width;
        swipe(x, [-tw / 2 - 20, -30], [tw / 2 + 20, -38], 96);
        x.lineWidth = 14; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(st.call.text, 0, 0); x.fillStyle = st.call.col; x.fillText(st.call.text, 0, 0);
        if (st.call.sub) { marker(x, 30); x.fillStyle = REDINK; x.textAlign = 'center'; x.strokeText(st.call.sub, 0, 40); x.fillText(st.call.sub, 0, 40); }
      }
      x.restore(); x.globalAlpha = 1;
    } else if (st.call) st.call = null;
    if (st.mode !== 'done' && NAMEV !== 'none' && !FEWER) {
      const zs = zones(), halo = (txt, cx, cy, size, col, font) => { (font || hand)(x, size); x.textAlign = 'center'; x.lineJoin = 'round'; x.lineWidth = 10; x.strokeStyle = '#fbf8ee'; x.strokeText(txt, cx, cy); x.fillStyle = col; x.fillText(txt, cx, cy); };
      if (NAMEV === 'words') zs.forEach(q => { const c = px({ x: q.lx, z: q.lz }); halo(q.name, c[0], c[1], 28, PENCIL); });
      if ((NAMEV === 'hover' || NAMEV === 'both') && st.tip) { const q = zs.find(k => k.id === st.tip); if (q) { const c = px({ x: q.x, z: q.z - q.r - 0.8 }); halo(q.name, c[0], c[1] - 30, 40, INK); halo(q.line, c[0], c[1] + 4, 28, PENCIL); } }
      if (NAMEV === 'point' || (NAMEV === 'both' && !meta.taught)) { const T0 = st.teach; if (!T0.t) T0.t = now + 1700;
        const nx = TEACH[T0.i + 1]; if (nx && now - T0.t > 2600 && nx.when()) { T0.i++; T0.t = now; }
        const cur = TEACH[T0.i], q = cur && zs.find(k => k.id === cur.z), age = (now - T0.t) / 1000;
        if (q && age >= 0 && age < 7) { const tgt = px({ x: q.x, z: q.z }), right = q.x > 8, from = px({ x: q.x + (right ? -7.5 : 6.5), z: q.z - 3.2 }), k = Math.min(1, age / 0.3);
          x.globalAlpha = age > 6 ? 7 - age : 1; flick(x, from, [from[0] + (tgt[0] - from[0]) * 0.86, from[1] + (tgt[1] - from[1]) * 0.86], 0, k, 20, REDINK, right ? -0.18 : 0.18);
          if (k >= 1) { const hx = from[0] + (tgt[0] - from[0]) * 0.86, hy = from[1] + (tgt[1] - from[1]) * 0.86, a = Math.atan2(tgt[1] - from[1], tgt[0] - from[0]); x.strokeStyle = REDINK; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath(); x.moveTo(hx - Math.cos(a - 0.5) * 34, hy - Math.sin(a - 0.5) * 34); x.lineTo(hx, hy); x.lineTo(hx - Math.cos(a + 0.5) * 34, hy - Math.sin(a + 0.5) * 34); x.stroke(); }
          halo(cur.say, from[0] + (right ? -40 : 40), from[1] - 26, 46, REDINK, marker); x.globalAlpha = 1; dirty = true; } }
    }
    // the family of the round's molecule and its rule, above the round
    if (g && g.m && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse')) { const c = px({ x: EDGE + 0.2, z: PAGES.z - 2.5 }); let dx = 0; P.kinsOf(g.m).forEach(q => { const K = P.KIN[q.id], nm = K.name + (q.lv > 1 ? ' ' + q.lv : ''); marker(x, 44); x.textAlign = 'left'; x.fillStyle = K.col; x.fillText(nm, c[0] + dx, c[1]); const w1 = x.measureText(nm).width, w2 = inkLine(x, K.note + ': ' + K.tok, c[0] + dx, c[1] + 30, 22, PENCIL, 'left'); dx += Math.max(w1, w2) + 34; }); }
    // a molecule that could react with itself: the atoms that would meet are lit, and a click on the molecule folds it
    { const o = twistOpt(); if (o && center && center.model === g.m) { const key = st.twC.key; if (!st.twM || st.twM.key !== key) st.twM = { key, marks: marksOf(center, o.atoms || [], 0.01, 0.2) };
        const sc = center.group.scale.x, hov = twistAt(); x.fillStyle = '#2f8f6a'; x.globalAlpha = (hov ? 0.62 : 0.32) + 0.08 * Math.sin(now / 320);
        st.twM.marks.forEach(k => { const c = px({ x: C0.x + k.x * sc, z: C0.z + k.z * sc }), r = 0.95 * sc * U; x.beginPath(); x.ellipse(c[0], c[1], r, r * 0.86, 0, 0, 6.3); x.fill(); }); x.globalAlpha = 1; dirty = true; } }
    // bonuses in flight: from where they were earned to the points or to the multiplier
    if (st.motes.length) { const mp2 = px(MULT), tgt = { p: [mp2[0] + 250, mp2[1] - 76], m: [mp2[0] + 550, mp2[1] - 76] }; st.motes = st.motes.filter(m => now - m.t < m.dur);
      const lanes = { p: 0, m: 0 }; st.motes.forEach(m => { const k = (now - m.t) / m.dur; if (k < 0) return; const lane = lanes[m.part]++ % 3; const e = k * k * (3 - 2 * k), A = px(m.a), B = [tgt[m.part][0] + lane * 70, tgt[m.part][1]], cx = A[0] + (B[0] - A[0]) * e + Math.sin(Math.PI * e) * Math.max(0, mp2[0] + 600 - A[0]) * 0.9, cy = A[1] + (B[1] - A[1]) * (1 - Math.pow(1 - e, 3));
        marker(x, 42 - 12 * e); x.globalAlpha = Math.max(0, Math.min(1, (k - 0.2) / 0.15, (1 - k) / 0.3)); x.textAlign = 'center'; x.lineJoin = 'round'; x.lineWidth = 8; x.strokeStyle = '#fbf8ee'; x.strokeText(m.txt, cx, cy); x.fillStyle = m.col; x.fillText(m.txt, cx, cy); x.globalAlpha = 1; }); dirty = true; }
    // the reagent of a reaction travels from where it is listed to the place it changes, as the group it looks for,
    // and on landing shows that group and what it has become
    if (st.fly && st.mode !== 'done') { const F = st.fly, age = now - F.t; if (age > F.trav + F.hold) st.fly = null; else {
      const u = Math.min(1, age / F.trav), e = u * u * (3 - 2 * u), A = px(F.a), B = px({ x: Math.max(F.b.x, BEAT.x + 5), z: under() + 1.9 }), cx = A[0] + (B[0] - A[0]) * e, cy = A[1] + (B[1] - A[1]) * e - 90 * Math.sin(Math.PI * e);
      const landed = u >= 1, k2 = landed ? (age - F.trav) / F.hold : 0, sc = 1.25 + (landed ? 0.4 * Math.max(0, 1 - k2 * 6) : 0);
      x.save(); x.translate(cx, cy); x.scale(sc, sc); x.globalAlpha = k2 > 0.75 ? 1 - (k2 - 0.75) / 0.25 : 1;
      if (!landed) chip(x, F.tl[0], 0, 0, true);
      else { chip(x, F.tl[0], -72, 0, false); x.strokeStyle = INK; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(-22, -12); x.lineTo(8, -12); x.lineTo(-2, -22); x.moveTo(8, -12); x.lineTo(-2, -2); x.stroke(); chip(x, F.tl[1], 62, 0, true); }
      x.restore(); x.globalAlpha = 1; dirty = true; } }
    // the beaker and the balloon are named while they hold something
    if (g && st.mode !== 'done' && st.mode !== 'pick' && st.mode !== 'brief' && st.mode !== 'shop') [['water', BEAK, 'click: +1 reaction'], ['h2', BALN, 'click: +1 use']].forEach(q => { if (st.by[q[0]] < P.BY.need) return; const c = px({ x: q[1].x + (q[0] === 'h2' ? -0.7 : 0.9), z: q[1].z + 2.2 }); hand(x, 27); x.textAlign = q[0] === 'h2' ? 'left' : 'right'; x.fillStyle = st.by[q[0]] >= P.BY.need ? INK : PENCIL; x.fillText(q[2], c[0], c[1]); });
    // the round is over: how it went, and where to click
    if (done) {
      const c = px({ x: 0, z: -9 }), ratio = g.total / st.quota;
      marker(x, 130); x.textAlign = 'center'; x.lineWidth = 16; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.fillStyle = st.pass ? GREEN : REDINK;
      const txt = st.pass ? 'beaten' : fmt(st.quota - g.total) + ' short', tw = x.measureText(txt).width, n = Math.floor(ratio);
      x.strokeText(txt, c[0], c[1]); x.fillText(txt, c[0], c[1]);
      hand(x, 50); x.fillStyle = PENCIL; for (let n = 0; n < (st.pass ? st.paid || 0 : 0); n++) coin(x, c[0] + tw / 2 + 60 + n * 56, c[1] - 36, 22);
      x.fillText(st.pass ? '' : run.beaten + ' beaten    best ' + best, c[0], c[1] + 80);
      { const nx = px({ x: 12, z: 11.6 }), wd = st.pass ? 'next' : 'new run'; marker(x, 58); x.textAlign = 'center'; x.fillStyle = INK; x.fillText(wd, nx[0], nx[1]); const w2 = x.measureText(wd).width / 2 + 26; x.strokeStyle = INK; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(nx[0] + w2, nx[1] - 18); x.lineTo(nx[0] + w2 + 60, nx[1] - 18); x.lineTo(nx[0] + w2 + 38, nx[1] - 38); x.moveTo(nx[0] + w2 + 60, nx[1] - 18); x.lineTo(nx[0] + w2 + 38, nx[1] + 2); x.stroke(); }
    }
    ink.t.needsUpdate = true;
  }

  // ---------- pointer and keys ----------
  const ray = new T.Raycaster(), ndc = new T.Vector2(), ground = new T.Plane(new T.Vector3(0, 1, 0), 0), hit = new T.Vector3();
  function slotAt(e) {
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(ground, hit) || st.mode !== 'play') return -1;
    let slot = -1; slots.forEach((s, i) => { if (!s || !s.o) return; const p = SPOT[i]; if (p && (SIDE ? hit.x > 12 && Math.abs(hit.z - p.z) < SLOTW / 2 : Math.abs(hit.x - p.x) < SLOTW / 2 && hit.z > -14.5 && hit.z < p.z + 3)) slot = i; });
    return slot;
  }
  function pickAt(e, arr) {
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(ground, hit) || hit.z < -7 || hit.z > 9) return -1;
    let best = -1; PICKX.forEach((px0, i) => { if ((arr || picks)[i] && Math.abs(hit.x - px0) < 7) best = i; }); return best;
  }
  function shopAt(e) {
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(ground, hit)) return -2;
    for (let i = 0; i < P.SUPPLY.length; i++) { const z = -9.2 + i * 3.6; if (hit.z > z - 1.7 && hit.z < z + 1.9 && hit.x > -24 && hit.x < 6.5) return i; }
    for (let i = 0; i < P.FAMILIES.length; i++) { const z = -9.2 + i * 3.6; if (hit.z > z - 1.7 && hit.z < z + 1.9 && hit.x >= 6.5) return 100 + i; }
    return hit.z > 9.5 ? -1 : -2;
  }
  cv.addEventListener('pointermove', e => { if (st.mode === 'brief') { const i = pickAt(e, briefs); if (i !== st.hover) { st.hover = i; dirty = true; } cv.style.cursor = i >= 0 ? 'pointer' : ''; return; } if (st.mode === 'shop') { const i = shopAt(e); if (i !== st.hover) { st.hover = i; dirty = true; } cv.style.cursor = i === -1 || i === meta.tier + 1 ? 'pointer' : ''; return; } if (st.mode === 'pick') { const i = pickAt(e); if (i !== st.hover) { st.hover = i; dirty = true; } cv.style.cursor = i >= 0 ? 'pointer' : ''; return; } const s = slotAt(e); if (s !== st.hover) setHover(s); { let kh = -1; kitObjs.forEach((k, i) => { const kp = KITP(i); if (Math.abs(hit.x - kp.x) < 2.4 && hit.z > kp.z - 4.5 && hit.z < kp.z + 3.8) kh = i; }); if (kh !== st.kitHover) { st.kitHover = kh; dirty = true; } if (NAMEV === 'hover' || NAMEV === 'both') { let tip = null; zones().forEach(q => { if (q.r && Math.hypot(hit.x - q.x, hit.z - q.z) < q.r) tip = q.id; }); if (tip !== st.tip) { st.tip = tip; dirty = true; } } } cv.style.cursor = s >= 0 || st.mode === 'done' ? 'pointer' : ''; });
  cv.addEventListener('pointerleave', () => setHover(-1));
  cv.addEventListener('pointerdown', () => { if (!twistAt()) return; st.drag = { x: hit.x, z: hit.z }; doTwist(); if (morph && morph.slow) { morph.scrub = true; morph.kDrag = 0; morph.kHeld = 0; } });
  cv.addEventListener('pointermove', () => { if (st.drag && morph && morph.scrub) morph.kDrag = Math.min(1, Math.hypot(hit.x - st.drag.x, hit.z - st.drag.z) / 5); });
  root.addEventListener('pointerup', () => { if (!st.drag) return; st.drag = null; if (morph && morph.scrub) { morph.scrub = false; morph.t0 = performance.now() - morph.s0 - (morph.K || 0) * 460; } });
  cv.addEventListener('click', e => { if (st.mode === 'brief') { const i = pickAt(e, briefs); if (i >= 0) chooseBrief(i); return; } if (st.mode === 'shop') { const i = shopAt(e); if (i === -1) next(); else if (i >= 100) openFamily(i - 100); else if (i >= 0) openSupplier(i); return; } if (st.mode === 'pick') { const i = pickAt(e); if (i >= 0) takePick(i); return; } if (st.mode === 'fuse') return; if (st.mode === 'done') return next(); const s = slotAt(e); if (s >= 0) pick(s); else if (twistAt()) doTwist(); else if (pawAt()) doWish(); else if (kitAt('extinguisher')) doDouse(); else { const b = byAt(); if (b) spend(b); } });
  root.addEventListener('keydown', e => {
    if (e.key >= '1' && e.key <= '6') { if (st.mode === 'pick') takePick(+e.key - 1); else if (st.mode === 'brief') chooseBrief(+e.key - 1); else pick(+e.key - 1); }
    else if (e.key === 'f' || e.key === 'F') pick(FIN);
    else if (e.key === 't' || e.key === 'T') doTwist();
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); }
    else if (e.key === 'r' || e.key === 'R') newRun();
  });

  function size() {
    const w = app.clientWidth, h = app.clientHeight; if (!w || !h) return; ren.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h > 1.6 ? 34 : 34 * 1.6 / (w / h) * 0.86; cam.updateProjectionMatrix();
    veil.width = w; veil.height = h; const x = veil.getContext('2d'), gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,236,190,0.16)'); gr.addColorStop(1, 'rgba(60,50,90,0.14)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); noise(x, w, h, w * h / 30, 0.05, '80,60,30');
  }
  function frame(now) {
    requestAnimationFrame(frame);
    const raw = now - last, dt = Math.min(0.05, raw / 1000), ended = []; last = now;
    if (PLAIN) { st.shake = Math.min(st.shake, 0.55); st.flash = Math.min(st.flash || 0, 0.3); }
    // a held moment: while it lasts, the molecule and anything flying off it stand still
    if (now < st.hold) { if (morph) morph.t0 += raw; st.flyers.forEach(f => { if (f.t0) f.t0 += raw; }); }
    // the recoil of the molecule from a strike: a spring that pulls it back to where it stands
    { const k = 220, c = 14; st.kvx += (-k * st.kx - c * st.kvx) * dt; st.kvz += (-k * st.kz - c * st.kvz) * dt; st.kx += st.kvx * dt; st.kz += st.kvz * dt; st.sq = Math.max(0, st.sq - dt * 4.5); }
    tweens = tweens.filter(tw => {
      tw.t += dt; const k = Math.min(1, tw.t / tw.dur), e = 1 - Math.pow(1 - k, 3), grow = tw.sc > tw.fs * 1.5, es = grow ? 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2) : e;
      tw.m.group.position.set(tw.fx + (tw.to.x - tw.fx) * e, Math.sin(k * Math.PI) * 1.4 * (tw.dur > 0.2 ? 1 : 0), tw.fz + (tw.to.z - tw.fz) * e); tw.m.group.scale.setScalar(Math.max(0.001, tw.fs + (tw.sc - tw.fs) * es));
      if (k >= 1) { if (tw.done) ended.push(tw.done); return false; } return true;
    });
    ended.forEach(f => f());
    if (morph) { const el = now - morph.t0, ease = k => 1 - Math.pow(1 - k, 3), back = k => 1 + 2.70158 * Math.pow(k - 1, 3) + 1.70158 * Math.pow(k - 1, 2), kOf = (a, d) => Math.max(0, Math.min(1, (el - morph.start.get(a)) / d));
      const FOLD_MS = 460, slowDone = morph.slow && !morph.scrub && el - morph.s0 >= FOLD_MS;
      if (morph.slow ? slowDone : el > morph.end) { if (morph.slow) { st.pop = 1; st.sq = 1; st.hold = now + 90; st.shake = Math.max(st.shake, 0.55); sfx.bond(); sfx.good(); } else { st.pop = Math.max(st.pop, 0.4); st.sq = Math.max(st.sq, 0.35); } layout(morph.m, a => morph.m.at.get(a), null); morph = null; }
      else if (morph.slow) {
        let K = Math.max(0, Math.min(1, (el - morph.s0) / FOLD_MS)); if (morph.scrub) { K = Math.max(morph.kHeld || 0, Math.min(0.9, morph.kDrag || 0)); morph.kHeld = K; } morph.K = K;
        // slow to start, then quick: the two ends are drawn together as if they pulled on each other
        const k = K < 0.3 ? 0.12 * Math.pow(K / 0.3, 2) : 0.12 + 0.88 * (1 - Math.pow(1 - (K - 0.3) / 0.7, 3));
        morph.m.balls.forEach((b, a) => { const fr = morph.from.get(a), to = morph.m.at.get(a), c = morph.cur.get(a); if (fr) c.copy(fr).lerp(to, k); else c.copy(to); });
        for (let it = 0; it < 10; it++) morph.m.sticks.forEach(q => { const fa = morph.from.get(q.a), fb = morph.from.get(q.b); if (!fa || !fb) return; const ca = morph.cur.get(q.a), cb = morph.cur.get(q.b), rest = fa.distanceTo(fb) * (1 - k) + morph.m.at.get(q.a).distanceTo(morph.m.at.get(q.b)) * k; _u.copy(cb).sub(ca); const len = _u.length() || 1e-4, df = (len - rest) / len * 0.5; ca.addScaledVector(_u, df); cb.addScaledVector(_u, -df); });
        layout(morph.m, a => morph.cur.get(a), a => (morph.from.has(a) ? 1 : k));
      }
      else layout(morph.m, a => { const fr = morph.from.get(a), to = morph.m.at.get(a); return fr ? morph.cur.get(a).copy(fr).lerp(to, ease(kOf(a, 240))) : to; }, a => { const d = el - morph.start.get(a), bump = morph.made.has(a) && d >= 0 ? 0.28 * Math.max(0, 1 - d / 420) : 0; return morph.from.has(a) ? 1 + bump : kOf(a, 300) <= 0 ? 0 : back(kOf(a, 300)) + bump; });
      dirty = true; }
    if (st.flyers.length) { st.flyers = st.flyers.filter(f => {
      if (!f.t0 || !f.to) return true; const age = now - f.t0; if (age < 0) return true;
      const k = Math.min(1, age / f.dur), e = k * k * (3 - 2 * k), d = f.from.distanceTo(f.to);
      f.grp.position.set(f.from.x + (f.to.x - f.from.x) * e, f.from.y + (f.to.y - f.from.y) * e + Math.sin(k * Math.PI) * (2.5 + 0.16 * d), f.from.z + (f.to.z - f.from.z) * e);
      f.grp.rotation.set(f.spin * k * 0.7, f.spin * k, 0); f.grp.scale.setScalar(st.sc * (1 + 0.22 * Math.sin(Math.min(1, k * 2.2) * Math.PI)) * (k > 0.75 ? 1 - (k - 0.75) / 0.25 * 0.6 : 1));
      if (k < 1) return true;
      scene.remove(f.grp); burst3(f.to.x, 0.2, f.to.z + 0.6, 8, f.kind === 'water' ? '#3a6fd0' : f.kind === 'h2' ? '#d6453a' : '#5a564e');
      if (f.keep) { st.by[f.keep] = Math.min(g ? g.by[f.keep] : 9, st.by[f.keep] + 1); st.byBump[f.keep] = 1; }
      st.by.gauge = (st.by.gauge + 1) % P.BY.tally; st.byBump.gauge = 1; dirty = true; return false; }); dirty = true; }
    ['water', 'h2', 'gauge'].forEach(q => { if (st.byBump[q] > 0) { st.byBump[q] = Math.max(0, st.byBump[q] - dt * 3.5); dirty = true; } });
    { const on = !!g && (st.mode === 'play' || st.mode === 'move' || st.mode === 'done'), tq = now / 1000, nw = Math.min(P.BY.need, st.by.water), nh = Math.min(P.BY.need, st.by.h2), fullW = st.by.water >= P.BY.need, fullH = st.by.h2 >= P.BY.need;
      keep.bk.visible = on && st.mode !== 'done' && st.by.water >= P.BY.need; keep.bl.visible = on && st.mode !== 'done' && st.by.h2 >= P.BY.need;
      if (on) { const lv = 0.08 + 1.25 * nw / P.BY.need; keep.water.scale.y = lv; keep.water.position.y = 0.06 + lv / 2; keep.water.visible = nw > 0;
        const bw = 1 + 0.25 * st.byBump.water, bh = 1 + 0.25 * st.byBump.h2; keep.bk.scale.set(1.5 * bw, 1.5 * (2 - bw), 1.5 * bw); keep.bk.position.y = fullW ? 0.25 + 0.2 * Math.sin(tq * 5) : 0;
        const sz = (0.45 + 0.22 * nh) * bh; keep.skin.scale.setScalar(sz); keep.skin.position.y = 1.24 + 0.9 * sz; keep.bl.rotation.z = 0.08 * Math.sin(tq * 1.6) + (fullH ? 0.1 * Math.sin(tq * 9) : 0); keep.bl.position.y = fullH ? 0.3 + 0.25 * Math.sin(tq * 4) : 0; } }
    prods.forEach((m, i) => { if (!m || tweens.some(tw => tw.m === m)) return; const hov = st.hover === i, want = hov ? 0.7 : 0, sc = (SCS[i] || 0.8) * (hov ? SC_HOVER : 1), k = Math.min(1, dt * 14); m.group.position.y += (want - m.group.position.y) * k; const s0 = m.group.scale.x; if (Math.abs(s0 - sc) > 0.002) { m.group.scale.setScalar(s0 + (sc - s0) * k); dirty = true; } });
    if (st.mode === 'pick' || st.mode === 'shop' || st.mode === 'brief') dirty = true;
    if (st.mode === 'brief') briefMols.forEach((m, i) => { if (!tweens.some(tw => tw.m === m)) { m.group.scale.setScalar(m.sc * (st.hover === i ? 1.15 : 1)); m.group.rotation.z = 0.05 * Math.sin(now / 1000 * 1.3 + i * 1.7); } });
    const target = st.mode === 'done' && g ? g.total : st.want;
    if (st.shown !== target) { const d = target - st.shown; st.shown = Math.abs(d) < 2 ? target : st.shown + d * Math.min(1, dt * 16); dirty = true; }
    pickObjs.forEach(k => { const age = (now - (k.born || 0)) / 1000, u = Math.max(0, Math.min(1, age / 0.45)), drop = u < 1 ? (1 - u) * (1 - u) * 9 : 0, sq = u >= 1 && age < 0.75 ? Math.sin((age - 0.45) / 0.3 * Math.PI) * 0.18 : 0; k.grp.visible = age >= 0; k.grp.rotation.y += dt * 0.6; k.grp.position.y = drop + (st.hover === k.slot ? 0.8 + 0.15 * Math.sin(now / 140) : 0); k.grp.scale.set(1.7 * (1 + sq * 0.6), 1.7 * (1 - sq), 1.7 * (1 + sq * 0.6)); });
    // equipment is moved further down, once the heat of the round is known
    if (st.multBump > 0) { st.multBump = Math.max(0, st.multBump - dt * 3.5); dirty = true; }
    if (st.floats.length || st.blots.length || st.pings.length || st.slashes.length || st.strokes.length || st.call) dirty = true;
    st.shake *= Math.pow(0.002, dt); const sh = st.shake > 0.02 ? st.shake : 0;
    // the view pushes in on the molecule for a moment when it reacts
    { const want = now < st.zoomUntil ? 1 : 0; st.zoom += (want * 0.012 - st.zoom) * Math.min(1, dt * (want ? 9 : 5)); const fk = Math.min(1, dt * 8); st.fx += (st.focus.x - st.fx) * fk; st.fz += (st.focus.z - st.fz) * fk; }
    const zk = st.zoom, hx = (Math.random() - 0.5) * sh * 0.6, hz = (Math.random() - 0.5) * sh * 0.6;
    cam.position.set(CAM.x + (st.fx - CAM.x) * zk + hx, CAM.y + (16 - CAM.y) * zk, CAM.z + (st.fz + 12 - CAM.z) * zk + hz);
    cam.lookAt(LOOKAT.x + (st.fx - LOOKAT.x) * zk, 0.8 * zk, LOOKAT.z + (st.fz - LOOKAT.z) * zk);
    // the hotter the run, the warmer the page
    const playing = g && (st.mode === 'play' || st.mode === 'move'), heat = playing ? Math.min(1, Math.log2(Math.max(1, st.mult)) / 6) : 0;
    if (st.flash > 0) { st.flash = Math.max(0, st.flash - dt * 2.2); veil.style.backgroundColor = 'rgba(' + st.flashC + ',' + (st.flash * 0.3).toFixed(3) + ')'; }
    else if (heat > 0.05 && LOOK === 'now') veil.style.backgroundColor = 'rgba(255,110,30,' + (heat * 0.3).toFixed(3) + ')';
    else if (veil.style.backgroundColor) veil.style.backgroundColor = '';
    // nothing on the page sits dead still: molecules rock, equipment trembles with the multiplier, a hot run throws bubbles
    const tt = now / 1000;
    if (center && !tweens.some(tw => tw.m === center)) { st.pop = Math.max(0, st.pop - dt * 3.2); const sp = 1 + 0.28 * st.pop * Math.cos(st.pop * 9); st.sc += (SC_MAIN - st.sc) * Math.min(1, dt * 5); { const q = st.sq * Math.cos(st.sq * 11); center.group.scale.set(st.sc * sp * (1 + 0.1 * q), st.sc * sp * (1 - 0.2 * q), st.sc * sp * (1 + 0.1 * q)); } center.group.position.set(C0.x + st.kx, 0.25 + 0.2 * Math.sin(tt * (1.6 + 2 * heat)), C0.z + st.kz); center.group.rotation.z = 0.035 * Math.sin(tt * 1.1) + (Math.random() - 0.5) * (0.03 * heat + 0.07 * st.fury); if (st.ch > 0.02) { const c = st.ch, fz = st.mode === 'fuse'; center.group.scale.multiplyScalar(1 + 0.15 * c + (fz ? 0.06 * Math.sin(now / 70) : 0)); center.group.rotation.z += (Math.random() - 0.5) * 0.09 * c * c * (fz ? 1.8 : 1); center.group.position.x += (Math.random() - 0.5) * 0.25 * c * c; dirty = true; } }
    prods.forEach((m, i) => { if (m) m.group.rotation.z = 0.05 * Math.sin(tt * 1.3 + i * 1.7); });
    { const tc = chargeOf(); st.ch = (st.ch || 0) + (tc - (st.ch || 0)) * Math.min(1, dt * (tc < (st.ch || 0) ? 8 : 2.2)); if (Math.abs(tc - st.ch) > 0.003) dirty = true; }
    { const on = !!g && (st.mode === 'play' || st.mode === 'move' || st.mode === 'done' || st.mode === 'fuse'); flask.grp.visible = false; if (on) { const ratio = st.quota ? st.shown / st.quota : 0, ov = ratio >= 1 ? Math.log2(ratio) + 0.001 : 0; flask.set(Math.min(1, ratio), ov); const boil = Math.min(1, ov / 5), near = Math.max(0, Math.min(1, (ratio - 0.6) / 0.4)), tq = now / 1000; flask.grp.rotation.z = 0.03 * Math.sin(tq * 1.4) + (boil ? (Math.random() - 0.5) * 0.09 * boil : near * 0.03 * Math.sin(tq * 17)); flask.grp.position.y = boil ? Math.random() * 0.25 * boil : near * 0.06 * Math.abs(Math.sin(tq * 9)); flask.grp.scale.set(1.25 * (1 + 0.012 * Math.sin(tq * 2.1)), 1.25 * (1 - 0.012 * Math.sin(tq * 2.1)), 1.25); if (boil) dirty = true; } }
    kitObjs.forEach((k, i) => animKit(k, i, now, heat));
    if (st.madeBump > 0) { st.madeBump = Math.max(0, st.madeBump - dt * 6); dirty = true; }
    ['p', 'r', 'e'].forEach(q => { if (st.bump[q] > 0) { st.bump[q] = Math.max(0, st.bump[q] - dt * 4); dirty = true; } });
    if (heat > 0.2) dirty = true;
    stepParts(dt);
    if (dirty && now - lastInk > 24) { drawInk(now); dirty = false; lastInk = now; }
    ren.render(scene, cam);
  }
  root.addEventListener('resize', size);
  AA.rxScheme = { st, load, pick, next, setHover, takePick, newRun, showSuppliers, frame, wish: () => doWish(), douse: () => doDouse(), debugKit: ids => { run.gear = ids.slice(); load(); }, spend, debugBy: (w, h) => { g.by.water = w; g.by.h2 = h; st.by.water = w; st.by.h2 = h; },
    setOff, twist: doTwist, canTwist: () => !!twistOpt(), debugTip: id => { st.tip = id; dirty = true; }, debugRack: ids => { run.rack = ids.slice(); load(); }, debugFeed: smi => { run.feed = P.salt(P.modelOf(smi)); run.brief = 'plain'; run.kin = P.kinOf(smi); run.quota = P.runQuota(run, smi, 'plain'); load(); },
    openSupplier, meta,
    chooseBrief,
    state: () => (!g || st.mode === 'pick' || st.mode === 'shop' || st.mode === 'brief' ? { mode: st.mode, briefs: briefs.map(b => b.brief + ':' + b.quota + ':' + (b.pays || '')), round: run.round, beaten: run.beaten, picks: picks.map(o => o.kind + ':' + o.id), gear: run.gear.slice(), rack: run.rack.slice(), credit: meta.credit, tier: meta.tier } : { mode: st.mode, charged: P.charged(g), brief: g.brief, round: run.round, beaten: run.beaten, page: g.page, steps: g.pageSteps, offer: g.kinds.slice(), usable: slots.map((s, i) => (s && s.o ? i : -1)).filter(i => i >= 0), conts: slots.map((s, i) => (s && s.o && s.o.cont && g.cur.path.length > 0 ? i : -1)).filter(i => i >= 0), made: P.made(g), gear: st.gear.slice(), rare: Object.assign({}, g.rare), places: g.P, rowNum: g.R, extra: g.E, times: P.mult(g), row: g.cur.path.length, best: g.best, quota: st.quota, pass: st.pass, call: st.call && st.call.text }) };
  size(); newRun(); requestAnimationFrame(frame);
}
const el = root.document && document.getElementById('schemeapp');
if (el) { const boot = () => start(el); if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('40px Marker'), document.fonts.load('40px Hand')]).then(boot, boot); else boot(); }
})(window);
