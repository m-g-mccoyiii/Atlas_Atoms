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
const INK = '#2b2622', PENCIL = '#5a564e', FAINT = 'rgba(90,86,78,0.35)', REDINK = '#c8261c', GREEN = '#1c8a4a', HILITE = 'rgba(255,214,0,0.6)';
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
  const slimeMat = std({ color: lin(0x7fd14a), roughness: 0.15 }), cureMat = std({ color: lin(0xf4f1e8), roughness: 0.95 });
  const beadMat = std({ color: lin(0xf0d9a0), roughness: 0.7 }), polyMat = std({ color: lin(0xf08aa8), roughness: 0.6 }), beadEdge = new T.MeshBasicMaterial({ color: lin(0x2b2622), side: T.BackSide }), paleMat = std({ color: lin(0xd9d6cc), roughness: 0.8 }), mWord = {};
  function wordMat(txt) { if (mWord[txt]) return mWord[txt]; const c = canvasTex(128, 128); c.x.font = 'bold ' + (txt.length > 2 ? 50 : 66) + 'px "Trebuchet MS", system-ui, sans-serif'; c.x.textAlign = 'center'; c.x.textBaseline = 'middle'; c.x.fillStyle = '#2b2622'; c.x.fillText(txt, 64, 68); c.t.needsUpdate = true; return (mWord[txt] = new T.SpriteMaterial({ map: c.t, depthWrite: false })); }
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

  // A molecule laid out as it would be drawn by hand: a chain is an even zigzag, every ring is a regular polygon, and
  // what hangs off them leaves at even angles. Any number of separate rings are laid out, each where the chain
  // reaches it. A molecule whose two halves are the same (a mirrored one) is laid out as one half and its
  // reflection. Hydrogens that are drawn sit a short way out from their atom. Every bond ends at its own length.
  const fnv = s => { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619); return (x >>> 0).toString(36); };
  // where a point of the flat drawing goes when the drawing is bent round by the share f of a half turn (f 1: a full U)
  function bendXf(x, z, F, f) {
    const sx = x - F.x1, d = z - F.z0; if (f < 1e-3 || sx <= 0) return { x, z, th: 0 };
    const R = F.r / f, arc = Math.PI * F.r;
    if (sx <= arc) { const th = sx / R; return { x: F.x1 + (R - d) * Math.sin(th), z: F.z0 + R - (R - d) * Math.cos(th), th }; }
    const the = arc / R, t = sx - arc; return { x: F.x1 + R * Math.sin(the) + t * Math.cos(the) - d * Math.sin(the), z: F.z0 + R - R * Math.cos(the) + t * Math.sin(the) + d * Math.cos(the), th: the };
  }
  // Bends a flat drawing: each body (a ring, or a chain atom with what hangs from it) is carried whole to where its
  // place on the chain goes, so nothing in it is stretched. U(a) is where atom a stands flat; put(a, x, z) takes the result
  function bendAll(F, bodies, U, f, put) {
    bodies.forEach(o => { const ref = o.bbs.length ? o.bbs : o.atoms; let rx = 0, rz = 0, n = 0; ref.forEach(a => { const u = U(a); if (u) { rx += u.x; rz += u.z * F.dir; n++; } }); if (!n) return; rx /= n; rz /= n;
      const T0 = bendXf(rx, rz, F, f), c = Math.cos(T0.th), s = Math.sin(T0.th); o.atoms.forEach(a => { const u = U(a); if (!u) return; const ox = u.x - rx, oz = u.z * F.dir - rz; put(a, T0.x + ox * c - oz * s - F.cx * f, F.dir * (T0.z + ox * s + oz * c) - F.cz * f); }); });
  }
  function tidy(md, at, skip, beads, seed, arch) {
    const L = 1.55, TAU = 2 * Math.PI, nodes = md.atoms.filter(a => !skip.has(a) && a.el !== 'H'), adj = new Map(), pos = new Map(); nodes.forEach(a => adj.set(a, []));
    md.bonds.forEach(b => { if ((arch || []).some(q => (q.o === b.a && q.c === b.b) || (q.o === b.b && q.c === b.a))) return; if (adj.has(b.a) && adj.has(b.b) && !adj.get(b.a).includes(b.b)) { adj.get(b.a).push(b.b); adj.get(b.b).push(b.a); } });
    beads.forEach(b => { if (!adj.has(b.anchor)) return; adj.set(b.pa, [b.anchor]); adj.get(b.anchor).push(b.pa); nodes.push(b.pa); });
    at.unf = null; at.fold = null;
    if (!nodes.length) return;
    // ring atoms are what is left when ends are stripped away again and again; each ring is the shortest way round through one of its bonds
    const deg = new Map(), core = new Set(nodes); nodes.forEach(a => deg.set(a, adj.get(a).length));
    for (let again = true; again;) { again = false; Array.from(core).forEach(a => { if (deg.get(a) <= 1) { core.delete(a); adj.get(a).forEach(n => deg.set(n, deg.get(n) - 1)); again = true; } }); }
    const rings = [], ringOf = new Map();
    core.forEach(u => { if (ringOf.has(u)) return; for (const v of adj.get(u)) { if (!core.has(v) || ringOf.has(v)) continue; const par = new Map([[u, null]]), qu = [u]; let found = false; while (qu.length && !found) { const a = qu.shift(); for (const n of adj.get(a)) { if (!core.has(n) || par.has(n) || (a === u && n === v)) continue; par.set(n, a); if (n === v) { found = true; break; } qu.push(n); } } if (!found) continue; const cyc = []; for (let a = v; a; a = par.get(a)) cyc.push(a); if (cyc.some(a => ringOf.has(a))) continue; cyc.forEach(a => ringOf.set(a, cyc)); rings.push(cyc); break; } });
    const far = (a, from, seen) => { let best = 0; adj.get(a).forEach(n => { if (n === from || seen.has(n) || pos.has(n)) return; seen.add(n); best = Math.max(best, 1 + far(n, a, seen)); }); return best; };
    const kidsOf = a => adj.get(a).filter(n => !pos.has(n)).sort((p, q) => far(q, a, new Set([a, q])) - far(p, a, new Set([a, p])));
    const step = (a, n, t) => { const p = pos.get(a); pos.set(n, { x: p.x + Math.cos(t) * L, y: p.y + Math.sin(t) * L }); };
    // A ring is set down whole. The atom it is reached at stays, and the ring is turned about it so that the corner the
    // chain leaves by (the one whose arm reaches furthest) points the way the chain was heading; that arm leans a
    // little further toward the heading. What hangs from the other corners points away from the middle of the ring
    const norm = t => Math.atan2(Math.sin(t), Math.cos(t));
    const setRing = (cyc, a, ang, turn) => { const n = cyc.length, R = L / (2 * Math.sin(Math.PI / n)), p = pos.get(a), i0 = cyc.indexOf(a), H = ang + turn * Math.PI / 6, todo = [];
      const came = new Map(); cyc.forEach(b => came.set(b, adj.get(b).some(q => pos.has(q) && ringOf.get(q) !== cyc)));
      let ex = -1, top = 0; cyc.forEach((b, k) => { if (b === a) return; adj.get(b).forEach(q => { if (pos.has(q) || ringOf.get(q) === cyc) return; const f = 1 + far(q, b, new Set([b, q])); if (f > top) { top = f; ex = k; } }); });
      let dl = 0, sg = 1; if (ex >= 0) { let bestE = 9; [1, -1].forEach(s2 => { const phi = s2 * (ex - i0) * TAU / n, d0 = Math.max(-1.05, Math.min(1.05, norm(H - ang - Math.PI - phi))), err = Math.abs(norm(ang + d0 + Math.PI + phi - H)); if (err < bestE - 1e-6) { bestE = err; dl = d0; sg = s2; } }); }
      const ca = ang + dl, cx = p.x + Math.cos(ca) * R, cy = p.y + Math.sin(ca) * R;
      cyc.forEach((b, k) => { if (b !== a) { const t = ca + Math.PI + sg * (k - i0) * TAU / n; pos.set(b, { x: cx + Math.cos(t) * R, y: cy + Math.sin(t) * R }); } });
      cyc.forEach((b, bi) => { const q = pos.get(b), out = Math.atan2(q.y - cy, q.x - cx), kids = kidsOf(b), angs = came.get(b) ? [out + 1.05, out - 1.05, out + 2.1] : kids.length === 1 ? [out] : [out + 0.55, out - 0.55, out];
        kids.forEach((n2, k) => { let t = angs[Math.min(k, 2)], tn = k % 2 ? 1 : -1; if (bi === ex && k === 0 && kids.length === 1) { t = out + Math.max(-0.5, Math.min(0.5, norm(H - out))); tn = norm(H - t) >= 0 ? 1 : -1; } step(b, n2, t); todo.push([n2, t, tn]); }); });
      todo.forEach(q => grow(q[0], q[1], q[2])); };
    const grow = (a, ang, turn) => {
      const cyc = ringOf.get(a); if (cyc && !cyc.done) { cyc.done = true; return setRing(cyc, a, ang, turn); }
      const kids = kidsOf(a), angs = [ang + turn * Math.PI / 3, ang - turn * Math.PI / 3, ang], todo = [];
      kids.forEach((n, k) => { if (pos.has(n)) return; const t = angs[Math.min(k, 2)] + (k > 2 ? k : 0); step(a, n, t); todo.push([n, t, k === 0 ? -turn : turn]); });
      todo.forEach(q => grow(q[0], q[1], q[2]));
    };
    // two halves that are the same, joined by one bond: found by giving every atom a mark made from its neighbors' marks, over and over, and pairing the atoms off outward from the bond
    const sym = (() => { const n = nodes.length; if (n < 6 || n % 2) return null; let pair = null;
      for (const u of nodes) { if (pair) break; for (const v of adj.get(u)) { if (ringOf.has(u) && ringOf.get(u) === ringOf.get(v)) continue; const S = new Set([u]), st0 = [u]; while (st0.length) { const x = st0.pop(); for (const y of adj.get(x)) { if (S.has(y) || (x === u && y === v)) continue; S.add(y); st0.push(y); } } if (S.size * 2 === n && !S.has(v)) { pair = [u, v, S]; break; } } }
      if (!pair) return null; const a = pair[0], b = pair[1], S = pair[2]; let inv = new Map(); nodes.forEach(q => inv.set(q, (q.bead || q.el) + adj.get(q).length));
      for (let it = 0; it < Math.min(30, n / 2 + 1); it++) { const nx = new Map(); nodes.forEach(q => nx.set(q, fnv(inv.get(q) + '|' + adj.get(q).map(t => inv.get(t)).sort().join(',')))); inv = nx; }
      if (inv.get(a) !== inv.get(b)) return null;
      const map = new Map([[a, b]]), used = new Set([b]), qu = [a]; while (qu.length) { const u = qu.shift(), u2 = map.get(u); for (const v of adj.get(u)) { if ((u === a && v === b) || map.has(v)) continue; if (!S.has(v)) return null; const v2 = adj.get(u2).find(q => !used.has(q) && !S.has(q) && inv.get(q) === inv.get(v)); if (!v2) return null; map.set(v, v2); used.add(v2); qu.push(v); } }
      if (map.size * 2 !== n) return null; for (const e of map) for (const v of adj.get(e[0])) { if (e[0] === a && v === b) continue; if (!adj.get(e[1]).includes(map.get(v))) return null; }
      return { a, b, map }; })();
    if (sym) { const a = sym.a; sym.map.forEach(v2 => pos.set(v2, { x: 0, y: 0 })); pos.set(a, { x: -L / 2, y: 0 });
      if (ringOf.has(a)) grow(a, Math.PI, 1); else { const todo = []; kidsOf(a).forEach((n, k) => { const t = [3.665, 2.094, 4.712][Math.min(k, 2)]; step(a, n, t); todo.push([n, t, k === 0 ? -1 : 1]); }); todo.forEach(q => grow(q[0], q[1], q[2])); }
      let clash = false; { const hs = Array.from(sym.map.keys()); for (let i = 0; i < hs.length && !clash; i++) for (let j = i; j < hs.length; j++) { const p = pos.get(hs[i]), q = pos.get(hs[j]); if (Math.hypot(p.x + q.x, p.y - q.y) < 0.9 * L) { clash = true; break; } } }
      sym.map.forEach((v2, v) => { const p = pos.get(v); pos.set(v2, { x: -p.x, y: clash ? -p.y : p.y }); }); }
    else { const bfs = s => { const d = new Map([[s, 0]]), q = [s]; let last = s; while (q.length) { const a = q.shift(); last = a; adj.get(a).forEach(n => { if (!d.has(n)) { d.set(n, d.get(a) + 1); q.push(n); } }); } return last; };
      const start = bfs(bfs(nodes[0])); pos.set(start, { x: 0, y: 0 }); grow(start, ringOf.has(start) ? 0 : -Math.PI / 6, 1); }
    nodes.forEach(a => { if (!pos.has(a)) { let hx = 0; pos.forEach(p => { hx = Math.max(hx, p.x); }); pos.set(a, { x: hx + 2 * L, y: 0 }); grow(a, 0, 1); } });
    // Atoms that landed on top of each other are pushed apart, and then every bond is put back to its length: the bonds win
    const settle = (N, get, bonds, rounds) => { const P0 = N.map(get), id = new Map(N.map((a, i) => [a, i])), nb = N.map(() => new Set()), B = []; bonds.forEach(q => { const i = id.get(q[0]), j = id.get(q[1]); if (i == null || j == null) return; nb[i].add(j); nb[j].add(i); B.push([P0[i], P0[j]]); });
      const pull = k => { let worst = 0; B.forEach(q => { const p = q[0], t = q[1], dx = t.x - p.x, dy = t.z - p.z, d = Math.hypot(dx, dy) || 1e-3, df = (d - L) / d * k; worst = Math.max(worst, Math.abs(d - L)); p.x += dx * df; p.z += dy * df; t.x -= dx * df; t.z -= dy * df; }); return worst; };
      for (let it = 0; it < rounds; it++) { let moved = false;
        for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) { if (nb[i].has(j)) continue; const p = P0[i], q = P0[j]; let dx = q.x - p.x, dy = q.z - p.z, d = Math.hypot(dx, dy); const min = N[i].bead || N[j].bead ? L * 1.5 : L * 0.98; if (d >= min) continue; if (d < 1e-3) { dx = Math.cos(i * 2.4 + j); dy = Math.sin(i * 2.4 + j); d = 1; } const push = (min - d) / 2 + 0.02; p.x -= dx / d * push; p.z -= dy / d * push; q.x += dx / d * push; q.z += dy / d * push; moved = true; }
        if (!moved) break; for (let k = 0; k < 3; k++) pull(0.5); }
      for (let k = 0; k < 60 && pull(0.5) > 0.004; k++) { /* until every bond is its length */ } };
    const bondsOf = M => { const out = []; M.forEach((v, a) => v.forEach(n => { out.push([a, n]); })); return out; };
    { const P1 = new Map(); nodes.forEach(a => { const p = pos.get(a); P1.set(a, { x: p.x, z: p.y }); }); settle(nodes, a => P1.get(a), bondsOf(adj), 80); nodes.forEach(a => { const p = pos.get(a), q = P1.get(a); p.x = q.x; p.y = q.z; }); }
    // long way lies left to right; then whichever mirror image is nearest to how it stood before
    let cx = 0, cy = 0, n = 0; pos.forEach(p => { cx += p.x; cy += p.y; n++; }); cx /= n; cy /= n; pos.forEach(p => { p.x -= cx; p.y -= cy; });
    { let sxx = 0, syy = 0, sxy = 0; pos.forEach(p => { sxx += p.x * p.x; syy += p.y * p.y; sxy += p.x * p.y; }); const th = 0.5 * Math.atan2(2 * sxy, sxx - syy), c = Math.cos(-th), s = Math.sin(-th); if (sxx + syy > 0) pos.forEach(p => { const x = p.x * c - p.y * s, y = p.x * s + p.y * c; p.x = x; p.y = y; }); }
    let fx = 1, fy = 1;
    if (seed && seed.flip) { fx = seed.flip[0]; fy = seed.flip[1]; }
    else if (seed && seed.size) { let best = 1e18; [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(m => { let e = 0; seed.forEach((q, a) => { const p = pos.get(a); if (p) e += (p.x * m[0] - q.x) * (p.x * m[0] - q.x) + (-p.y * m[1] - q.z) * (-p.y * m[1] - q.z); }); if (e < best) { best = e; fx = m[0]; fy = m[1]; } }); }
    const lift = new Map(); nodes.forEach((c, ci) => { const nb = adj.get(c); if (nb.length < 3) return; let sgn = ci % 2 ? 1 : -1; nb.filter(t => adj.get(t).length === 1).forEach(t => { lift.set(t, 0.26 * sgn); sgn = -sgn; }); });
    at.flip = [fx, fy];
    pos.forEach((p, a) => { const v = at.get(a); if (v) v.set(p.x * fx, lift.get(a) || 0, -p.y * fy); });
    // each oxygen a zip has closed stands over the chain, half way between the two carbons it joins, on the upper side of the page
    const ringed = closeRings(md, at, adj, arch || []);
    (arch || []).forEach(q => { if (ringed.has(q)) return; const sc = (adj.get(q.o) || [])[0], P1 = sc && at.get(sc), P2 = at.get(q.c), O = at.get(q.o); if (!P1 || !P2 || !O) return; let ux = -(P2.z - P1.z), uz = P2.x - P1.x; const d = Math.hypot(ux, uz) || 1; ux /= d; uz /= d; if (uz > 0) { ux = -ux; uz = -uz; } O.set((P1.x + P2.x) / 2 + ux * 1.5, 0.3, (P1.z + P2.z) / 2 + uz * 1.5); });
    // every bond, the ones a zip closed as well
    const adjF = new Map(); nodes.forEach(a => adjF.set(a, adj.get(a).slice())); (arch || []).forEach(q => { if (ringed.has(q) && adjF.has(q.o) && adjF.has(q.c)) { adjF.get(q.o).push(q.c); adjF.get(q.c).push(q.o); } });
    const allRings = rings.concat(ringed.rings || []);
    if (ringed.size) settle(nodes, a => at.get(a), bondsOf(adjF), 60);
    at.unf = new Map(); nodes.forEach(a => { const v = at.get(a); at.unf.set(a, { x: v.x, z: v.z }); });
    // A drawing too wide for the page turns back under itself in a U. Nothing is cut and nothing is stretched: each
    // ring, and each atom of the chain with all that hangs from it, is carried whole round a half circle. The U is
    // taken when it lets the molecule be drawn larger, toward whichever side leaves the two rows closer, and once a
    // molecule has turned back it stays so until the page turns (seed.fold), so that a cascade does not flip it open.
    { const box = get => { let lo = 1e9, hi = -1e9, zl = 1e9, zh = -1e9; nodes.forEach(a => { const v = get(a); lo = Math.min(lo, v.x); hi = Math.max(hi, v.x); zl = Math.min(zl, v.z); zh = Math.max(zh, v.z); }); return { lo, hi, zl, zh, fit: Math.min(16 / (hi - lo + 1.2), 10 / (zh - zl + 1.6)) }; };
      const b0 = box(a => at.get(a)), keep = seed && seed.fold;
      const tryFold = (dir, shift) => {
        const V = new Map(); nodes.forEach(a => { const v = at.get(a); V.set(a, { x: v.x, z: v.z * dir }); });
        let A = nodes[0], B = nodes[0]; nodes.forEach(a => { if (V.get(a).x < V.get(A).x) A = a; if (V.get(a).x > V.get(B).x) B = a; });
        const par = new Map([[A, null]]), qu = [A]; while (qu.length) { const a = qu.shift(); adjF.get(a).forEach(q => { if (!par.has(q)) { par.set(q, a); qu.push(q); } }); }
        if (!par.has(B)) return null; const bb = new Set(); for (let a = B; a; a = par.get(a)) bb.add(a);
        const uf = new Map(); nodes.forEach(a => uf.set(a, a)); const find = a => { while (uf.get(a) !== a) { uf.set(a, uf.get(uf.get(a))); a = uf.get(a); } return a; }, join = (a, b) => { uf.set(find(a), find(b)); };
        allRings.forEach(c => c.forEach(a => { if (uf.has(a) && uf.has(c[0])) join(a, c[0]); }));
        { const seen = new Set(bb), q2 = Array.from(bb); while (q2.length) { const a = q2.shift(); adjF.get(a).forEach(q => { if (!seen.has(q)) { seen.add(q); join(q, a); q2.push(q); } }); } }
        const bm = new Map(); nodes.forEach(a => { const r0 = find(a); if (!bm.has(r0)) bm.set(r0, { atoms: [], bbs: [], ring: false }); const o = bm.get(r0); o.atoms.push(a); if (bb.has(a)) o.bbs.push(a); }); allRings.forEach(c => { const o = bm.get(find(c[0])); if (o) o.ring = true; });
        const bodies = Array.from(bm.values()); let z0 = 0; bb.forEach(a => { z0 += V.get(a).z; }); z0 /= bb.size;
        let r = 2.5, x1 = 0, arc = 0; for (let pass = 0; pass < 3; pass++) { arc = Math.PI * r; x1 = (b0.lo + b0.hi - arc) / 2; const xm = x1 + arc / 2; let dN = 0, dF = 0; nodes.forEach(a => { const v = V.get(a), d = v.z - z0; if (v.x < xm) dN = Math.max(dN, d); else dF = Math.max(dF, d); }); r = Math.max(2.4, (dN + dF) / 2 + 0.95); }
        arc = Math.PI * r; x1 = (b0.lo + b0.hi - arc) / 2; if (b0.hi - b0.lo < arc + (keep ? 4.5 : 11)) return null;
        // a ring is not bent, and the turn is moved along the chain to a stretch that holds none, if there is one near
        { const refX = o => { let x = 0; (o.bbs.length ? o.bbs : o.atoms).forEach(a => { x += V.get(a).x; }); return x / (o.bbs.length || o.atoms.length); }, rb = bodies.filter(o => o.ring).map(refX), hit = x => rb.some(q => q > x - 0.6 && q < x + arc + 0.6);
          if (hit(x1)) { let got = false; for (let k = 1; k <= 6 && !got; k++) for (const sg of [-1, 1]) { const t = x1 + sg * k * 0.7; if (!hit(t)) { x1 = t; got = true; break; } } } }
        x1 += shift || 0; if (x1 - b0.lo < 2 || b0.hi - x1 - arc < 2) return null;
        const F = { x1, z0, r, dir, cx: 0, cz: 0, bodies }, out = new Map(); bendAll(F, bodies, a => at.unf.get(a), 1, (a, x, z) => out.set(a, { x, z }));
        let sx = 0, sz = 0; out.forEach(p => { sx += p.x; sz += p.z; }); F.cx = sx / out.size; F.cz = sz / out.size; out.forEach(p => { p.x -= F.cx; p.z -= F.cz; });
        const b1 = box(a => out.get(a)); return { F, out, fit: b1.fit };
      };
      if (b0.hi - b0.lo > 11 && (keep || b0.hi - b0.lo + 1.2 > 18.5)) { const want = keep && keep.dir ? [keep.dir] : [1, -1]; const pick = sh => want.map(d => tryFold(d, sh)).filter(t => t && (keep || t.fit > b0.fit * 1.12)).sort((p, q) => q.fit - p.fit), bF = bondsOf(adjF), nbF = (a, b) => adjF.get(a).includes(b);
        // a U in which two atoms still stand on each other after everything has been pushed apart is not taken
        const nearest = () => { let m = 9; for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const p = at.get(nodes[i]), q = at.get(nodes[j]), d = Math.hypot(p.x - q.x, p.z - q.z); if (d < m && !nbF(nodes[i], nodes[j])) m = d; } return m; }, floor = Math.min(0.72 * L, nearest() - 0.03), clear = () => nearest() >= floor;
        // if the turn cannot be made clean where it falls, it is tried a little way along the chain on either side
        let done = false; for (const sh of [0, 1.6, -1.6, 3.2, -3.2, 4.8, -4.8]) { if (done) break; for (const t of pick(sh)) { t.out.forEach((p, a) => { const v = at.get(a); v.x = p.x; v.z = p.z; }); at.fold = t.F; settle(nodes, a => at.get(a), bF, 60); if (clear()) { done = true; break; } at.fold = null; at.unf.forEach((p, a) => { const v = at.get(a); v.x = p.x; v.z = p.z; }); } } } }
    // hydrogens that are drawn: out from their atom, away from its neighbors
    md.atoms.forEach(a => { if (skip.has(a) || a.el !== 'H') return; const v = at.get(a), par = md.neighbors(a).map(q => q.atom).find(q => adjF.has(q)); if (!v) return; if (!par) { v.set(0, 0, 0); return; } const p = at.get(par); let ax = 0, az = 0; adjF.get(par).forEach(q => { const t = at.get(q); ax += t.x - p.x; az += t.z - p.z; }); const d = Math.hypot(ax, az), ux = d > 0.01 ? -ax / d : 0.87, uz = d > 0.01 ? -az / d : -0.5; v.set(p.x + ux * L * 0.62, lift.has(par) ? lift.get(par) * 1.25 : p.y, p.z + uz * L * 0.62); });
  }
  // A ring closed by a zip is drawn as a ring. The chain is laid out open, as it was before the zip, and then each
  // ring in turn is pulled shut into a regular polygon: the carbon that carries the oxygen stays where it is, the
  // ring's atoms take their corners, and everything beyond the ring is carried along with the corner it hangs from.
  // So each step of a cascade moves the page by one ring and reels the rest of the chain in. Rings that share a
  // corner (each zip starts from the carbon the last one closed on) lie on alternate sides of one straight line.
  // A ring that shares a bond with a ring already there is built on that bond. Returns the arches it has drawn.
  function closeRings(md, at, adj, arch) {
    const done = new Set(); done.atoms = new Set(); if (!arch.length) return done;
    const info = arch.map(q => ({ q, O: q.o, p0: (adj.get(q.o) || [])[0], pk: q.c })).filter(r => r.p0 && at.get(r.p0) && at.get(r.pk) && at.get(r.O));
    const order = []; info.filter(r => !info.some(t => t.pk === r.p0)).forEach(r0 => { let r = r0, prev = null; while (r && !order.includes(r)) { r.prev = prev; order.push(r); prev = r; r = info.find(t => t.p0 === prev.pk && !order.includes(t)); } });
    info.forEach(r => { if (!order.includes(r)) { r.prev = null; order.push(r); } });
    const withH = S => { const out = new Set(S); S.forEach(a => { if (a.bead || !md.atoms.includes(a)) return; md.neighbors(a).forEach(n => { if (n.atom.el === 'H' && at.has(n.atom)) out.add(n.atom); }); }); return out; };
    order.forEach(r => {
      const O = r.O, par = new Map([[r.p0, null]]), qu = [r.p0]; while (qu.length) { const a = qu.shift(); if (a === r.pk) break; (adj.get(a) || []).forEach(n => { if (!par.has(n) && n !== O) { par.set(n, a); qu.push(n); } }); }
      if (!par.has(r.pk)) return; const path = []; for (let a = r.pk; a; a = par.get(a)) path.unshift(a);
      const n = path.length + 1, k = path.length - 1; if (n < 4 || n > 11) return;
      // what hangs from each corner once the ring's own bonds are left out
      const idx = new Map(path.map((a, i) => [a, i])), comps = [], owner = new Map(); let bad = false;
      path.forEach((p, i) => { if (owner.has(p)) return; const S = new Set([p]), st0 = [p], ringAtoms = [i]; while (st0.length) { const a = st0.pop(); (adj.get(a) || []).forEach(nb => { if (nb === O || S.has(nb)) return; if (idx.has(a) && idx.has(nb) && Math.abs(idx.get(a) - idx.get(nb)) === 1) return; S.add(nb); st0.push(nb); if (idx.has(nb)) ringAtoms.push(idx.get(nb)); }); }
        ringAtoms.sort((x, y) => x - y); if (ringAtoms.length > 2 || (ringAtoms.length === 2 && ringAtoms[1] - ringAtoms[0] !== 1)) bad = true; const c = { S, ring: ringAtoms }; comps.push(c); ringAtoms.forEach(j => owner.set(path[j], c)); });
      if (bad) return;
      const W = a => at.get(a), c0 = owner.get(r.p0), fused0 = c0.ring.length === 2;
      const s0 = Math.hypot(W(path[1]).x - W(path[0]).x, W(path[1]).z - W(path[0]).z) || 1.55, side = fused0 ? s0 : 1.55, R = side / (2 * Math.sin(Math.PI / n));
      // corners in order round the ring: the oxygen, then the carbons from the one that carries it
      const canon = sg => { const out = []; for (let m = 0; m < n; m++) out.push({ x: R * Math.cos(2 * Math.PI * m / n), z: sg * R * Math.sin(2 * Math.PI * m / n) }); return out; };
      const fitTo = (sg, i1, W1, i2, W2) => { const C = canon(sg), zx = C[i2].x - C[i1].x, zz = C[i2].z - C[i1].z, wx = W2.x - W1.x, wz = W2.z - W1.z, d = zx * zx + zz * zz, ax = (wx * zx + wz * zz) / d, az = (wz * zx - wx * zz) / d, l = Math.hypot(ax, az) || 1, ux = ax / l, uz = az / l; return C.map(c => ({ x: W1.x + (c.x - C[i1].x) * ux - (c.z - C[i1].z) * uz, z: W1.z + (c.x - C[i1].x) * uz + (c.z - C[i1].z) * ux })); };
      const cen = V => { let x = 0, z = 0; V.forEach(v => { x += v.x; z += v.z; }); return { x: x / V.length, z: z / V.length }; };
      let V, u, sd;
      if (fused0) {
        let cx = 0, cz = 0, cn = 0; c0.S.forEach(a => { if (a === path[0] || a === path[1]) return; const w = W(a); cx += w.x; cz += w.z; cn++; }); const mid = { x: (W(path[0]).x + W(path[1]).x) / 2, z: (W(path[0]).z + W(path[1]).z) / 2 };
        V = fitTo(1, 1, W(path[0]), 2, W(path[1])); if (cn) { const c = cen(V); if ((c.x - mid.x) * (cx / cn - mid.x) + (c.z - mid.z) * (cz / cn - mid.z) > 0) V = fitTo(-1, 1, W(path[0]), 2, W(path[1])); }
      } else {
        const A = W(r.p0), B = W(r.pk), ow = W(O); let want;
        // rings that share a corner run on in one straight line, on alternate sides of it
        if (r.prev && r.prev.u && Math.abs(r.prev.u.z) < 0.3) { u = r.prev.u; want = -r.prev.sd; } else { const d = Math.hypot(B.x - A.x, B.z - A.z) || 1; u = Math.abs(B.x - A.x) >= Math.abs(B.z - A.z) ? { x: B.x >= A.x ? 1 : -1, z: 0 } : { x: (B.x - A.x) / d, z: (B.z - A.z) / d }; const tw = r.prev && r.prev.cen ? r.prev.cen : ow; want = (u.x * (tw.z - A.z) - u.z * (tw.x - A.x)) >= 0 ? 1 : -1; }
        const tgt = { x: A.x + u.x, z: A.z + u.z }; V = fitTo(1, 1, A, n - 1, tgt); { const cr = u.x * (V[0].z - A.z) - u.z * (V[0].x - A.x); if ((cr >= 0 ? 1 : -1) !== want) V = fitTo(-1, 1, A, n - 1, tgt); }
        // fitTo keeps the bond length only when the two anchors are a chord apart: scale the ring back to its size about the first carbon
        { const ch = Math.hypot(V[n - 1].x - V[1].x, V[n - 1].z - V[1].z), full = 2 * R * Math.sin(Math.PI * (n - 2) / n), f = full / (ch || 1); V = V.map(v => ({ x: A.x + (v.x - A.x) * f, z: A.z + (v.z - A.z) * f })); }
      }
      { const A = V[1], B = V[n - 1], d = Math.hypot(B.x - A.x, B.z - A.z) || 1; u = { x: (B.x - A.x) / d, z: (B.z - A.z) / d }; sd = (u.x * (V[0].z - A.z) - u.z * (V[0].x - A.x)) >= 0 ? 1 : -1; }
      // carry what hangs from each corner
      comps.forEach(c => { if (c === c0) return; const all = withH(c.S), i = c.ring[0], oa = W(path[i]), na = V[i + 1], ox = oa.x, oz = oa.z;
        if (c.ring.length === 1) all.forEach(a => { const w = W(a); if (w) { w.x += na.x - ox; w.z += na.z - oz; } });
        else { const ob = W(path[i + 1]), nb = V[i + 2], th = Math.atan2(nb.z - na.z, nb.x - na.x) - Math.atan2(ob.z - oz, ob.x - ox), cs = Math.cos(th), sn = Math.sin(th); all.forEach(a => { const w = W(a); if (!w) return; const dx = w.x - ox, dz = w.z - oz; w.x = na.x + dx * cs - dz * sn; w.z = na.z + dx * sn + dz * cs; }); } });
      W(O).x = V[0].x; W(O).z = V[0].z; W(O).y = W(r.p0).y;
      // the small things on the carbon the ring closed on (its new OH, a methyl) stand clear of the ring and of the chain
      { const pk = r.pk, ck = owner.get(pk); if (ck.ring.length === 1) { const c = cen(V), w = W(pk), b = Math.atan2(w.z - c.z, w.x - c.x), outs = (adj.get(pk) || []).filter(nb => nb !== O && !idx.has(nb)), sub = nb => { const S = new Set([nb]), st0 = [nb]; while (st0.length) { const a = st0.pop(); (adj.get(a) || []).forEach(q => { if (q !== pk && !S.has(q)) { S.add(q); st0.push(q); } }); } return S; };
        const subs = outs.map(nb => ({ nb, S: sub(nb) })); subs.forEach(q => { if (q.S.size <= 1) return; const v = W(q.nb), dx = v.x - w.x, dz = v.z - w.z, d = Math.hypot(dx, dz) || 1; if ((dx * u.x + dz * u.z) / d > -0.2) return; withH(q.S).forEach(a => { const t = W(a); if (!t) return; const dt = (t.x - w.x) * u.x + (t.z - w.z) * u.z; t.x -= 2 * dt * u.x; t.z -= 2 * dt * u.z; }); });
        const small = subs.filter(q => q.S.size <= 1), taken = subs.filter(q => q.S.size > 1).map(q => Math.atan2(W(q.nb).z - w.z, W(q.nb).x - w.x)), dist = (a, b2) => Math.abs(Math.atan2(Math.sin(a - b2), Math.cos(a - b2)));
        small.forEach(q => { let best = b, top = -1; [b + 0.9, b - 0.9, b].forEach(a => { const v = taken.length ? Math.min.apply(null, taken.map(t => dist(a, t))) : 1; if (v > top + 0.05) { top = v; best = a; } }); taken.push(best); const nx = w.x + Math.cos(best) * 1.55, nz = w.z + Math.sin(best) * 1.55, ow = W(q.nb), dx = nx - ow.x, dz = nz - ow.z; withH(q.S).forEach(a => { const v = W(a); if (v) { v.x += dx; v.z += dz; } }); }); } }
      r.u = u; r.sd = sd; r.cen = cen(V); done.add(r.q); (done.rings = done.rings || []).push(path.concat([O])); path.forEach(a => done.atoms.add(a)); done.atoms.add(O);
    });
    if (done.size) { let sx = 0, sz = 0, n2 = 0; at.forEach((v, a) => { if (a.el === 'H' || !adj.has(a)) return; sx += v.x; sz += v.z; n2++; }); if (n2) at.forEach((v, a) => { if (adj.has(a) || a.el === 'H') { v.x -= sx / n2; v.z -= sz / n2; } }); }
    return done;
  }
  // the atoms of each ring that holds one of the given oxygens (the shortest way round from one of its carbons to the other)
  function frostOf(md, oxy) { const out = []; (oxy || md.atoms.filter(a => a.frz)).forEach(o => { const nb = md.neighbors(o).map(q => q.atom).filter(a => a.el !== 'H'); if (nb.length !== 2) return; const par = new Map([[nb[0], null]]), qu = [nb[0]]; while (qu.length) { const a = qu.shift(); if (a === nb[1]) break; md.neighbors(a).forEach(q => { const b = q.atom; if (b === o || b.el === 'H' || par.has(b)) return; par.set(b, a); qu.push(b); }); } if (!par.has(nb[1])) return; const ring = [o]; for (let a = nb[1]; a; a = par.get(a)) ring.push(a); if (ring.length <= 9) out.push(ring); }); return out; }
  // the bonds a zip has closed, as pairs of the oxygen and the carbon it closed onto: found by opening a copy of the molecule
  function archesOf(model) { try { const cm = RX.cloneMap(model), cuts = []; RX.reopen(cm.model, cuts); const rev = new Map(); cm.map.forEach((c, a) => rev.set(c, a)); const out = cuts.map(q => ({ c: rev.get(q.c), o: rev.get(q.o) })).filter(q => q.c && q.o);
    // a frozen ring is laid out as the zip ring it was: its oxygen, and the carbon it closed onto (the one that carries a second oxygen)
    model.atoms.forEach(o => { if (!o.frz) return; const cs = model.neighbors(o).map(q => q.atom).filter(c => c.el === 'C'), c = cs.find(k => model.neighbors(k).some(q => q.atom !== o && q.atom.el === 'O')); if (c) out.unshift({ c, o }); }); return out; } catch (e) { return []; } }

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
  function caged(model, arch) {
    // a ring that closes across the slime's bridge is tied to the big ring the bridge made: it cannot lie flat either
    if ((arch || []).length && model.atoms.some(a => a.slime)) return true;
    const cutB = (a, b) => (arch || []).some(q => (q.o === a && q.c === b) || (q.o === b && q.c === a));
    const hv = model.atoms.filter(a => a.el !== 'H'), nb = a => model.neighbors(a).map(q => q.atom).filter(b => b.el !== 'H' && !cutB(a, b));
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
    { const arch = flat ? archesOf(model) : []; if (flat && !caged(model, arch)) tidy(model, at, skip, beads, seed, arch); }
    if (FOLD === 'focus' && big) { const ar = RX.aromaticAtoms(model), dist = new Map(), q0 = []; liveAtoms(model, ar).forEach(a => { dist.set(a, 0); q0.push(a); }); while (q0.length) { const a = q0.shift(); model.neighbors(a).forEach(nb => { if (!dist.has(nb.atom)) { dist.set(nb.atom, dist.get(a) + 1); q0.push(nb.atom); } }); } model.atoms.forEach(a => { if ((dist.has(a) ? dist.get(a) : 9) > 2) pale.add(a); }); }
    const radius = a => (a.bead ? 0.82 : a.poly ? 0.7 + 0.12 * Math.min(6, Math.log2(a.poly)) : BALL(a.el) * (pale.has(a) ? 0.5 : 1));
    at.forEach((p, a) => { if (!skip.has(a)) low = Math.min(low, p.y - radius(a)); });
    at.forEach(p => { p.y += 0.5 - low; });
    model.atoms.forEach(a => {
      if (skip.has(a)) return;
      if (a.poly) { const e = { R: radius(a), sk: 1.6, mesh: add(SPH, polyMat, 0, 0, 0, grp), sprite: new T.Sprite(wordMat('n' + a.poly)), collar: null }; e.mesh.add(new T.Mesh(SPH, beadEdge)).scale.setScalar(1.09); grp.add(e.sprite); balls.set(a, e); return; }
      const R = radius(a), b = { R, mesh: add(SPH, pale.has(a) ? paleMat : a.slime ? slimeMat : a.cure && a.el === 'O' ? cureMat : a.iso && CUT.includes('c') ? isoMat(a) : ballMat(a.el), 0, 0, 0, grp), sprite: null, collar: null };
      if (a.iso && !CUT.includes('c')) b.collar = collar(grp, new T.Vector3(), R, ISOC[a.iso]); else if (a.clamp) b.collar = collar(grp, new T.Vector3(), R, 0x39435c);
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
      const k = s.old ? k0 * Math.max(0, Math.min(1, 1 - (len / s.rest - 1.22) / 0.12)) : k0 * Math.max(0, Math.min(1, 1 - (len / s.rest - 1.05) / 0.1));
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
  // the room the molecule has: with no piece standing on the page and no creature beside it, it takes the whole middle
  const LANE = { w: KITV === 'side' ? 17 : 16, d: KITV === 'bottom' ? 10.5 : 10 }, C0B = {};
  const laneSet = () => { if (C0B.x == null) { C0B.x = C0.x; C0B.z = C0.z; } const wide = SIDE && KITV === 'back' && !st.gear.length && !(run && run.hom) && (P.RULE.bare || !JARK.some(jarSeen)); C0.x = wide ? 1.3 : C0B.x; C0.z = wide ? 0.5 : C0B.z; LANE.w = wide ? 22 : KITV === 'side' ? 17 : 16; LANE.d = wide ? 11.5 : KITV === 'bottom' ? 10.5 : 10; };
  const fitMain = m => Math.max(0.7, (SIDE ? Math.min(4.4, LANE.w / spanOf(m), LANE.d / deepOf(m)) : Math.min(2.9, 24 / spanOf(m), 10 / deepOf(m))));
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
  const BAND = 11.2, MULT = { x: EDGE + 0.9 + (KITV === 'side' ? 0.6 : 0), z: BAND }, MADE = { x: EDGE, z: 7.6 }, BEAT = KITV === 'back' ? { x: -1.2, z: 12.3 } : { x: -4.8 + SX, z: 14.4 }, GAIN = { x: 22, z: -1.5 }, CALL = { x: 3.5, z: -4.3 }, KITP = i => (KITV === 'side' ? { x: -23.4 + i * 0.42, z: -8.8 + i * 4.2 } : KITV === 'back' ? { x: -12.4 + i * 5.4, z: -10.4 } : { x: 0.2 + i * 4.75, z: 11.0 });
  if (SIDE) { GAIN.x = -12.6 + SX; GAIN.z = 7.4; CALL.x = -1; CALL.z = -12.3; }
  if (KITV === 'back') { GAIN.x = -17.5; GAIN.z = 3.6; CALL.x = 10; CALL.z = 13.1; }
  if (KITV !== 'bottom') { C0.x += SX * 0.55; C0.z += 1.3; }
  if (KITV === 'back') { C0.x += 0.3; C0.z += 0.3; }
  let SLOTW = 10, LABF = 50;
  const st = { mode: 'play', feed: 0, hover: -1, quota: 0, shown: 0, pass: false, tok: 0, shake: 0, flash: 0, flashC: '28,138,74', pageStart: 0, floats: [], blots: [], pings: [], slashes: [], strokes: [], flyers: [], motes: [], gains: [], passT: [], chainN: 0, tip: null, teach: { i: 0, t: 0 }, by: { water: 0, h2: 0, gauge: 0 }, byBump: { water: 0, h2: 0, gauge: 0 }, struck: 0, hold: 0, kx: 0, kz: 0, kvx: 0, kvz: 0, sq: 0, zoomUntil: 0, fx: 3.5, fz: 2.6, focus: { x: 3.5, z: 2.6 }, peek: null, willFire: null, pending: null, sc: 1, fury: 0, call: null, multBump: 0, over: 0, turned: 0, gear: [], fired: {}, want: 0, mult: 1, P: 0, R: 1, E: 1, bump: { p: 0, r: 0, e: 0 }, stains: [], pop: 0, zoom: 0, zoomT: 0, madeBump: 0, bubble: 0 };
  let g = null, slots = [], center = null, prods = [], rowMols = [], tweens = [], dirty = true, last = performance.now(), lastInk = 0;
  let run = null, picks = [], pickObjs = [], briefs = [], briefMols = [], best = 0; const meta = { credit: 0, tier: 0, fam: {}, found: {}, sig: {}, stage: 1, six: 0, taught: false, jar: { water: 0, h2: 0 }, hatched: {} }, shop = { earned: 0 };
  try { best = +(localStorage.getItem('aa_scheme_best') || 0) || 0; const m = JSON.parse(localStorage.getItem('aa_scheme_meta') || 'null'); if (m) { meta.credit = m.credit | 0; meta.tier = Math.max(0, Math.min(P.SUPPLY.length - 1, m.tier | 0)); meta.fam = m.fam || {}; meta.found = m.found || {}; meta.sig = m.sig || {}; meta.six = m.six | 0; meta.stage = m.stage | 0 || (meta.tier >= 4 ? 3 : meta.tier >= 1 ? 2 : 1); meta.taught = !!m.taught; meta.coined = !!m.coined; meta.jar = { water: 0, h2: 0 }; Object.keys(m.jar || {}).forEach(k => { meta.jar[k] = m.jar[k] | 0; }); meta.hatched = Object.assign({}, m.hatched || {}); } } catch (e) { /* storage unavailable */ }
  const saveMeta = () => { try { localStorage.setItem('aa_scheme_meta', JSON.stringify(meta)); } catch (e) { /* storage unavailable */ } };
  run = P.runNew(meta.tier); run.manual = true;
  const PICKX = [-15, 0, 15];
  // the molecule in the middle while it is changing from what it was to what it is
  let morph = null;
  const tween = (m, to, sc, dur, done) => tweens.push({ m, fx: m.group.position.x, fz: m.group.position.z, fs: m.group.scale.x, to, sc, t: 0, dur, done });
  const colOf = id => bright(RX.CARDS[id].rgb);
  // how near the page is to going off by itself: grows with the row and with the page's reactions used
  const chargeOf = () => (!g || g.fired || g.chain || st.mode === 'done' || st.mode === 'pick' || st.mode === 'brief' || st.mode === 'shop' || st.mode === 'terms' || st.mode === 'hom') ? 0 : st.mode === 'fuse' ? 1 : Math.min(0.94, Math.min(g.cur.path.length, 3) / 6 + Math.min(1, g.pageSteps / P.stepsOf(g)) / 2);
  const callout = (text, sub, col, ticks) => { if (PLAIN && (st.chainN || 0) > 0 && / in a row$/.test(text)) return; if (st.firing && P.RULE.cascade) return; st.call = { text, sub: sub || '', col: col || INK, ticks: ticks || 0, t: performance.now() }; };
  const spray = (n, col, wide) => { if (PLAIN) return; const now = performance.now(); for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, d = 2 + Math.random() * (wide ? 12 : 6); if (k % 3) continue; st.blots.push({ x: C0.x + Math.cos(a) * d * 1.3, z: C0.z + Math.sin(a) * d * 0.7, r: 4 + Math.random() * (wide ? 12 : 8), t: now, col }); } };

  // ---------- equipment: objects standing on the page, each with its name and what it does pencilled under it ----------
  let kitObjs = [], heldObjs = [];
  const clearPicks = () => { clearHoms(); pickObjs.forEach(k => scene.remove(k.grp)); pickObjs = []; heldObjs.forEach(k => scene.remove(k.grp)); heldObjs = []; };
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
  // What leaves a molecule is kept in two jars at the top left: water in one, hydrogen in the other. They fill across
  // runs, are saved with the player's progress (meta.jar) and are never emptied. A homunculus grows in each: a
  // speck, a small figure, full size; it hatches when the jar is full (docs/JARS.md).
  const BEAK = { x: -21.6 + SX, z: KITV === 'back' ? -9.6 : -7.6 }, BALN = { x: -17.4 + SX, z: KITV === 'back' ? -9.6 : -7.6 }, TALLY = { x: -13.4 + SX, z: KITV === 'back' ? -8.6 : -6.4 };
  // one jar for each creature that is built (P.HOMS). A jar stands on the page once its substance has first come off;
  // water and hydrogen stand from the start. Up to two stand full size; more share the same corner in rows of up to five
  const JARK = Object.keys(P.HOMS).filter(P.homOn), JARC = { water: 0x3a6fd0, h2: 0xe58a7c, co2: 0xa9d8ee, acid: 0x76a83a, wood: 0x9a6b3a, salt: 0xe9e4d6, slime: 0x7fd14a, seedling: 0x3f9a4f }, JARINK = { water: '#3a6fd0', h2: '#c8604e', co2: '#4f9fc4', acid: '#5e8f2a', wood: '#8a5a2b', salt: '#8d8872', slime: '#4fa52a', seedling: '#2f7d3f' }, HOMID = { water: 'homwater', h2: 'homh2', co2: 'homco2', acid: 'homacid', wood: 'homwood', salt: 'homsalt', slime: 'homslime', seedling: 'homseed' };
  const jarSeen = k => !P.RULE.bare && (k === 'water' || k === 'h2' || !!meta.hatched[k] || (meta.jar[k] || 0) > 0 || (st.by[k] || 0) > 0);
  const jarPos = k => { const L = JARK.filter(jarSeen), i = L.indexOf(k), n = L.length; if (i < 0) return null; if (n <= 2) return { x: i ? BALN.x : BEAK.x, z: BEAK.z, s: 1.2 }; const cols = n <= 5 ? n : Math.ceil(n / 2), rows = n <= 5 ? 1 : 2, sp = 8.6 / cols, row = Math.floor(i / cols); return { x: BEAK.x - 2.2 + sp * (i % cols + 0.5), z: BEAK.z + (rows > 1 ? -2.5 + row * 3.9 : 0), s: Math.min(1.0, sp / 2.75) }; };
  const homFig = kind => { const grp = new T.Group(); AA.rxKit.build(HOMID[kind], T, grp, new T.Color(JARC[kind])); return grp; };
  const jarOf = k => Math.min(P.JAR.full[k], ((meta.jar && meta.jar[k]) || 0) + (st.by[k] || 0));
  const JGLASS = std({ color: lin(0xdfe9ee), roughness: 0.08, transparent: true, opacity: 0.3, depthWrite: false });
  const jars = (() => { const KM = AA.rxKit.mat, out = {};
    JARK.forEach(k => { const grp = new T.Group(), shell = new T.Group(); grp.add(shell);
      add(new T.CylinderGeometry(1.0, 1.05, 0.14, 24), KM(T, 0x8a5a2b, 0.7), 0, 0.07, 0, shell); { const gl = add(new T.CylinderGeometry(0.92, 0.92, 2.1, 24, 1, true), JGLASS, 0, 1.19, 0, shell); gl.renderOrder = 3; gl.userData.plain = true; gl.castShadow = false; gl.receiveShadow = false; const rim = add(new T.TorusGeometry(0.93, 0.035, 6, 28), new T.MeshBasicMaterial({ color: lin(0x2b2622) }), 0, 0.16, 0, shell); rim.rotation.x = Math.PI / 2; rim.userData.plain = true; }
      const lid = add(new T.CylinderGeometry(0.98, 0.98, 0.16, 24), KM(T, 0x2c2f34, 0.55, 0.3), 0, 2.32, 0, shell); AA.rxKit.finish(T, shell);
      const fill = add(new T.CylinderGeometry(0.85, 0.85, 1, 24), std({ color: lin(JARC[k]), roughness: 0.3, transparent: true, opacity: k === 'h2' ? 0.4 : 0.5, depthWrite: false }), 0, 0.64, 0, grp); fill.renderOrder = 2; fill.userData.plain = true; fill.castShadow = false;
      const speck = add(new T.SphereGeometry(0.14, 12, 10), KM(T, k === 'h2' ? 0xf8e3dc : k === 'co2' ? 0xf2f8fb : k === 'water' ? 0x7fc0ea : JARC[k], 0.4), 0.1, 0.5, 0.3, grp), small = homFig(k), full = homFig(k); small.scale.setScalar(0.42); small.position.set(0, 0.16, 0.3); full.scale.setScalar(0.74); full.position.set(0, 0.16, 0.12); grp.add(small); grp.add(full);
      grp.rotation.x = -0.8; grp.position.set(BEAK.x, 0, BEAK.z); grp.scale.setScalar(1.2); grp.visible = false; scene.add(grp); out[k] = { grp, fill, lid, figs: [speck, small, full] }; });
    return out; })();
  // the homunculus taken into the run stands beside the molecule
  const HOMP = { x: 13.0, z: 13.7 }; let homObj = null, homObjs = [], homOpts = [];
  function homStand() { if (homObj) { scene.remove(homObj.grp); homObj = null; } if (!run || !run.hom) return; const grp = homFig(run.hom), hold = new T.Group(); hold.add(grp); hold.rotation.x = -0.8; hold.scale.setScalar(1.45); hold.position.set(HOMP.x, 0, HOMP.z); hold.visible = false; scene.add(hold); homObj = { id: run.hom, grp: hold }; }
  // where a thing that has left the molecule is collected, by its kind. Everything that flies off goes here
  function byTarget(kind) { if (P.RULE.bare) return new T.Vector3(-36, 3, -19); const j = JARK.includes(kind) ? jarPos(kind) : null; return j ? new T.Vector3(j.x, 2.0 * j.s / 1.2, j.z - 2.3 * j.s / 1.2) : new T.Vector3(TALLY.x, 1.2, TALLY.z - 0.6); }
  // Ways of saying what the things on the page are, tried with ?name= on the page:
  //   point: in a first round, an inked arrow and a few words point at one thing at a time as it first matters
  //   words: one or two pencil words by each thing, always.  hover: its name and a line under the pointer.
  //   fewer: no names, fewer things: no tally, no page numbers, beaker and balloon only once they hold something,
  //          and the three numbers small on one line under the count
  const NAMEV = (() => { try { return new URLSearchParams(root.location.search).get('name') || 'both'; } catch (e) { return 'both'; } })(), FEWER = NAMEV === 'fewer';
  // each thing: where it is, how near the pointer must be, its name, one line, and where a word for it is written
  const zones = () => [
    { id: 'water', x: BEAK.x, z: BEAK.z - 0.8, r: 2.2, name: 'water', line: '', lx: BEAK.x, lz: BEAK.z + 2.7 },
    { id: 'h2', x: BALN.x, z: BALN.z - 1.2, r: 2.2, name: 'hydrogen', line: '', lx: BALN.x, lz: BALN.z + 2.7 },
    { id: 'tally', x: TALLY.x + 1, z: TALLY.z - 0.9, r: 1.8, name: 'left', line: '', lx: TALLY.x + 1, lz: TALLY.z + 1.1 },
    { id: 'pages', x: PAGES.x + 1.8, z: PAGES.z, r: 2.4, name: 'page', line: '', lx: PAGES.x + 1.8, lz: PAGES.z - 1.5 },
    { id: 'steps', x: STEP.x + 2.5, z: STEP.z, r: 3, name: 'reactions', line: '', lx: STEP.x + 9.4, lz: STEP.z + 0.4 },
    { id: 'made', x: EDGE + 3.4, z: MADE.z - 1.4, r: 3.4, name: 'made', line: '', lx: EDGE + 12, lz: MADE.z - 0.4 },
    { id: 'p', x: MULT.x + 2.2, z: BAND - 1, r: 2.1, name: 'places', line: '', lx: MULT.x + 2.2, lz: BAND + 1.5 },
    { id: 'r', x: MULT.x + 6.9, z: BAND - 1, r: 2.1, name: 'row', line: '', lx: MULT.x + 6.9, lz: BAND + 1.5 },
    { id: 'e', x: MULT.x + 11.6, z: BAND - 1, r: 2.1, name: 'extra', line: '', lx: MULT.x + 11.6, lz: BAND + 1.5 },
    { id: 'beat', x: -8.8, z: 10.6, r: 2.2, name: 'to beat', line: '', lx: FLASK.x - 3.6, lz: BEAT.z },
    { id: 'bank', x: BANK.x, z: BANK.z, r: 2.3, name: 'bank', line: '', lx: BANK.x, lz: BANK.z + 2 },
    { id: 'draw', x: DRAW.x + 1.6, z: DRAW.z, r: 2.6, name: 'redraw', line: '', lx: DRAW.x, lz: DRAW.z + 2 },
    { id: 'choices', x: 16.8, z: -9.6, r: 0, name: 'reactions', line: '', lx: 16.8, lz: -12.3 }
  ];
  // the first round: what is pointed at, in order, each once the page has reached it
  const TEACH = [
    { z: 'choices', say: 'pick three', when: () => true },
    { z: 'made', say: 'made', when: () => g.trail.length >= 1 },
    { z: 'beat', say: 'beat this', when: () => g.trail.length >= 1 && st.shown < st.quota },
    { z: 'r', say: 'row', when: () => g.cur.path.length >= 2 },
    { z: 'pages', say: 'three pages', when: () => g.page >= 2 }
  ];
  const clearKit = () => { kitObjs.forEach(k => scene.remove(k.grp)); kitObjs = []; };

  // what stands on the page: one slot for each reagent on offer, and on the last page one for the finishing reagent
  function refresh() {
    prods.forEach(freeMol); prods = []; slots = [];
    const live = st.mode === 'play' && !g.over, fork = live && g.chain, lining = live && !fork && P.RULE.queue && !g.shot, view = lining ? P.queueView(g) : null, o = view ? view.o : live ? P.options(g, fork) : {};
    st.view = view;
    if (fork) Object.keys(o).forEach(id => { if (!o[id].cont) delete o[id]; });
    g.kinds.forEach((id, i) => { slots[i] = { id, o: o[id] || null }; });
    const fin = view ? (view.fin && !g.queue.includes(P.SYN.finish) ? view.fin : null) : live && !fork && g.pageSteps < P.stepsOf(g) ? P.finishOpt(g) : null; slots[FIN] = fin ? { id: fin.id, o: fin, fin: true } : null;
    { const ids = []; slots.forEach((q, i) => { if (q) ids.push(i); }); const n = ids.length, step = Math.min(10, 44 / Math.max(1, n)); SLOTW = step; LABF = Math.min(50, step * 5.4);
      ids.forEach((i, k) => { const x = (k - (n - 1) / 2) * step; SPOT[i] = { x, z: -7.4 }; LAB[i] = { x, z: -12.9 }; SCS[i] = Math.min(0.88, 0.09 * step); });
      if (SIDE) { const gap = Math.min(4.2, (KITV === 'back' ? 19.5 : 17) / Math.max(1, n)); SLOTW = gap; LABF = 40; ids.forEach((i, k) => { const z = (KITV === 'back' ? -8.2 : -10.4) + k * gap + gap / 2; SPOT[i] = { x: 22.6, z }; LAB[i] = { x: 16.6, z: z + 0.4 }; SCS[i] = 0.4; }); } }
    slots.forEach((s, i) => {
      if (!s || !s.o) return;
      s.o.model.settle(FOLDS[s.id] ? 2200 : 160);
      const rings = new Map(), c = rgb(colOf(s.id)); s.o.r.made.forEach(a => rings.set(a, c));
      const m = buildMol(s.o.model, rings, true); m.col = c; SCS[i] = SIDE ? Math.max(0.14, Math.min(0.3, 3.4 / spanOf(m))) : Math.max(0.3, Math.min(1.05, (SLOTW - 1.6) / spanOf(m))); if (P.RULE.queue && SIDE) m.group.visible = false; place(m, SPOT[i], 0.01); tween(m, SPOT[i], SCS[i], 0.16 + (i % 7) * 0.03); prods[i] = m;
    });
    st.hover = -1; setHover(-1); dirty = true;
  }
  function clearRound() { st.flyers.forEach(f => scene.remove(f.grp)); st.flyers = []; morph = null; st.pending = null; st.strokes = []; st.peek = null; st.willFire = null; tweens = []; prods.forEach(freeMol); prods = []; slots = []; freeMol(center); center = null; rowMols.forEach(freeMol); rowMols = []; }
  // the next round of the run: a molecule, the equipment held, and a number to beat
  function load() {
    st.tok++; st.mode = 'play'; st.firing = false; st.starting = false; st.rezip = false; st.tool = null; st.toolList = null; st.toolSpot = null; st.view = null; st.paid = ''; st.shown = 0; st.gains = []; st.passT = []; st.pass = false; st.won = false; st.pageStart = 0; st.floats = []; st.blots = []; st.pings = []; st.slashes = []; st.fury = 0; st.call = null; st.over = 0;
    clearRound(); clearBriefs(); clearPicks();
    st.stains = []; st.homPre = false; st.homWait = false; st.homList = null; st.homSpot = null; st.homHover = false; st.homAct = null; st.homNone = false; st.puddles = []; if ((homObj ? homObj.id : null) !== (run.hom || null)) homStand(); st.gear = run.gear.slice(); st.fired = {}; st.want = 0; st.mult = 1; st.P = 0; st.R = 1; st.E = 1; buildKit();
    g = P.runBegin(run, run.feed, true); st.quota = run.quota; st.E = g.E; st.R = g.R;
    laneSet(); setAlign(g.m); center = buildMol(g.m, null); SC_MAIN = fitMain(center); place(center, C0, 0.01); tween(center, C0, SC_MAIN, 0.3); st.sc = SC_MAIN; center.groups = groupsOf(center); center.ghosts = []; st.by = Object.assign({}, g.by);
    refresh(); sfx.feed();
    startPage();
  }
  // between rounds: three things on the page, take one
  // coins on the take-one page: the three dealt again, all three left for a coin, a held piece removed
  const REROLL = { x: -3.4, z: 11.6 }, SKIP = { x: 9, z: 11.6 }, PURSE = { x: -17, z: 12 }, HELD = i => ({ x: 10 + i * 3.3, z: -10.2 });
  function pickMark() { if (!P.RULE.coins || st.mode !== 'pick') return ''; if (hit.x > REROLL.x - 1.6 && hit.x < REROLL.x + 5.4 && Math.abs(hit.z - REROLL.z) < 1.8) return 'reroll'; if (hit.x > SKIP.x - 2.2 && hit.x < SKIP.x + 4.6 && Math.abs(hit.z - SKIP.z) < 1.8) return 'skip'; for (let i = 0; i < run.gear.length; i++) { const q = HELD(i); if (Math.abs(hit.x - q.x) < 1.6 && hit.z > q.z - 3.2 && hit.z < q.z + 1.6) return 'bin' + i; } return ''; }
  function doReroll() { if (st.mode !== 'pick') return; const n = P.runReroll(run); if (!n) { sfx.bad(); return; } st.drawT = performance.now(); st.coinT = performance.now(); showPicks(n); }
  function doSkip() { if (st.mode !== 'pick' || !P.RULE.coins) return; P.runSkip(run); st.coinT = performance.now(); sfx.stamp(); showBriefs(); }
  function doBin(i) { const id = run.gear[i]; if (st.mode !== 'pick' || !id) return; if (!P.runBin(run, id)) { sfx.bad(); return; } st.coinT = performance.now(); sfx.stamp(); st.shake = 0.5; showPicks(picks); }
  function showPicks(list) {
    st.tok++; st.mode = 'pick'; clearRound(); clearBriefs(); clearKit(); st.call = null; st.floats = []; st.blots = []; st.pings = [];
    clearPicks(); st.mark = '';
    picks = list || P.runPicks(run);
    if (P.RULE.coins) run.gear.forEach((id, i) => { const k = piece(id), q = HELD(i); k.grp.position.set(q.x, 0, q.z); k.grp.scale.setScalar(0.62 * sizeOf(id)); heldObjs.push(k); });
    picks.forEach((o, i) => { if (o.kind === 'gear' || o.kind === 'level') { const k = piece(o.id); k.grp.position.set(PICKX[i], 0, -2.2); k.grp.scale.setScalar(1.7); k.slot = i; k.born = performance.now() + 120 + i * 130; k.grp.visible = false; pickObjs.push(k); } });
    sfx.feed(); dirty = true;
  }
  function takePick(i) {
    const o = picks[i]; if (st.mode !== 'pick' || !o) return;
    P.runTake(run, o); sfx.stamp(); st.shake = 0.6; showBriefs();
  }
  // before each round: three rounds stand on the page, each a molecule with what the round asks and what it pays
  function clearBriefs() { briefMols.forEach(freeMol); briefMols = []; }
  // an assay is one round and stands alone in the middle of the page
  const BX = i => (briefs.length === 1 ? 0 : briefs.length === 2 ? (i ? 11 : -11) : PICKX[i]);
  // the pair drawn again: a turning arrow under the two molecules, and the coins it costs
  const PAIR = { x: -1.6, z: 11.6 };
  const pairOn = () => P.RULE.choose && P.RULE.coins && st.mode === 'brief' && briefs.length === 2 && !!meta.coined;
  const pairAt = () => pairOn() && hit.x > PAIR.x - 1.8 && hit.x < PAIR.x + 6.2 && Math.abs(hit.z - PAIR.z) < 1.8;
  function doPair() { if (!pairOn()) return; const n = P.runRedraw(run); if (!n) { sfx.bad(); return; } st.drawT = performance.now(); st.coinT = performance.now(); showBriefs(n); }
  function showBriefs(list) {
    st.tok++; st.mode = 'brief'; clearRound(); clearKit(); clearBriefs(); st.call = null; st.floats = []; st.blots = []; st.pings = []; st.hover = -1; st.mark = '';
    clearPicks();
    if ((run.coins || 0) > 0 && !meta.coined) { meta.coined = true; saveMeta(); }
    briefs = list || P.runBriefs(run);
    briefs.forEach((b, i) => { const mdl = P.modelOf(b.model); setAlign(mdl); const m = buildMol(mdl, null, true), sc = briefs.length === 2 ? Math.min(1.3, 16 / spanOf(m), 8 / deepOf(m)) : Math.min(1.1, 11.5 / spanOf(m)); m.sc = sc; place(m, { x: BX(i), z: -2.2 }, 0.01); tween(m, { x: BX(i), z: -2.2 }, sc, 0.2 + i * 0.05); briefMols.push(m); });
    sfx.feed(); dirty = true;
  }
  function chooseBrief(i) {
    const b = briefs[i]; if (st.mode !== 'brief' || !b) return;
    P.runChoose(run, b); sfx.stamp(); st.shake = 0.6; load();
  }
  // what a run can turn up beyond the suppliers: families that have been opened and reactions that have been found
  const extraR = () => P.FAMILIES.filter(f => meta.fam[f.id]).reduce((a, f) => a.concat(f.reagents), []).concat(Object.keys(meta.found).filter(k => meta.found[k]));
  // Sigils belong to the occult part of the game. Nothing of them shows until the alchemist has been opened; after
  // that they are earned by deeds in play, and the page of sigils appears once one is earned
  // The game opens in stages (docs/ARC.md). 1: the bare game. 2: equipment, suppliers, families. 3: the occult.
  // Nothing of a later stage is shown before it is reached.
  const occultOpen = () => meta.stage >= 3;
  const shopMax = () => (meta.stage >= 3 ? P.SUPPLY.length - 1 : 3);
  const sigOpen = t => t.id === 'plain' || (occultOpen() && !!(meta.sig && meta.sig[t.id]));
  // ?seed=N plays the run whose draws all come from N. Without it the draws are the system's, as before.
  function newRun() { try { const sd = new URLSearchParams(root.location.search).get('seed'); if (sd != null && sd !== '' && isFinite(+sd)) P.seed(+sd); } catch (e) { /* unseeded */ } run = P.runNew(meta.tier, extraR()); run.manual = true; run.single = !meta.taught; if (!meta.sig) meta.sig = {}; if (meta.stage < 2) run.noGear = true; if (P.RULE.bare) { run.noGear = true; run.hom = null; } homStand(); if (!P.RULE.bare && JARK.some(k => meta.hatched[k])) showHoms(); else runOpen(); }
  function runOpen() { if (P.TERMS.filter(sigOpen).length < 2) { P.runTerm(run, 'plain'); showPicks(); } else showTerms(); }
  // Before a run, once a homunculus has hatched: those that have stand on the page with an empty jar, and one is
  // taken into the run, or none
  const clearHoms = () => { homObjs.forEach(k => scene.remove(k.grp)); homObjs = []; };
  function showHoms() { st.tok++; st.mode = 'hom'; clearRound(); clearBriefs(); clearKit(); clearPicks(); clearHoms(); st.call = null; st.floats = []; st.blots = []; st.pings = []; st.hover = -1;
    homOpts = JARK.filter(k => meta.hatched[k]).concat([null]); const n = homOpts.length;
    homOpts.forEach((k, i) => { const hold = new T.Group(); if (k) hold.add(homFig(k)); else { const KM = AA.rxKit.mat; add(new T.CylinderGeometry(1.0, 1.05, 0.14, 24), KM(T, 0x8a5a2b, 0.7), 0, 0.07, 0, hold); { const gl = add(new T.CylinderGeometry(0.92, 0.92, 2.1, 24, 1, true), JGLASS, 0, 1.19, 0, hold); gl.renderOrder = 3; gl.userData.plain = true; gl.castShadow = false; gl.receiveShadow = false; [0.16, 2.24].forEach(y => { const rim = add(new T.TorusGeometry(0.93, 0.035, 6, 28), new T.MeshBasicMaterial({ color: lin(0x2b2622) }), 0, y, 0, hold); rim.rotation.x = Math.PI / 2; rim.userData.plain = true; }); } AA.rxKit.finish(T, hold); }
      { const q = HOMPOS(i, n); hold.rotation.x = -0.8; hold.position.set(q.x, 0, q.z); hold.scale.setScalar(k ? q.s : q.s * 0.62); } scene.add(hold); homObjs.push({ grp: hold, id: k, slot: i, born: performance.now() + 120 + i * 130 }); });
    sfx.feed(); dirty = true; }
  // where each stands on the page before a run: up to three as on the take-one page, up to six in one row, more in two rows
  const HOMPOS = (i, n) => { if (n <= 3) return { x: n === 2 ? [-8, 8][i] : n === 1 ? 0 : PICKX[i], z: -1.6, s: 2.4, tz: 4.6, ts: 1 }; if (n <= 6) return { x: (i - (n - 1) / 2) * (44 / n), z: -1.2, s: 1.9, tz: 3.9, ts: 0.72 }; const cols = Math.ceil(n / 2), row = i < cols ? 0 : 1, k = row ? i - cols : i, m = row ? n - cols : cols; return { x: (k - (m - 1) / 2) * (46 / cols), z: row ? 5.6 : -5.2, s: 1.5, tz: row ? 9.2 : -1.6, ts: 0.56 }; };
  const HOMX = (i, n) => HOMPOS(i, n).x;
  function chooseHom(i) { if (st.mode !== 'hom' || i < 0 || i >= homOpts.length) return; run.hom = homOpts[i]; clearHoms(); homStand(); if (run.hom === 'water') sfx.squish(); else if (run.hom) sfx.drift(); sfx.stamp(); st.shake = 0.6; runOpen(); }
  function homPageAt(e) { const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); if (!ray.ray.intersectPlane(ground, hit)) return -1; let best = -1, bd = 1e9; const n = homOpts.length; homOpts.forEach((k, i) => { const q = HOMPOS(i, n), dx = Math.abs(hit.x - q.x), w = n <= 3 ? 6 : n <= 6 ? 22 / n : 23 / Math.ceil(n / 2); if (dx < w && hit.z > q.z - 2.8 * q.s && hit.z < q.tz + 4.6 * q.ts && dx < bd) { bd = dx; best = i; } }); return best; }
  // before a run: six sigils on the page, one is taken as the terms of the run
  const TERMP = i => ({ x: PICKX[i % 3], z: i < 3 ? -3.2 : 6.2 });
  function showTerms() { st.tok++; st.mode = 'terms'; clearRound(); clearBriefs(); clearKit(); clearPicks(); st.call = null; st.floats = []; st.blots = []; st.pings = []; st.hover = -1; sfx.feed(); dirty = true; }
  function chooseTerm(i) { const t = P.TERMS[i]; if (st.mode !== 'terms' || !t) return; if (!sigOpen(t)) { sfx.bad(); return; } P.runTerm(run, t.id); sfx.stamp(); st.shake = 0.6; showPicks(); }
  function termAt(e) { const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam); if (!ray.ray.intersectPlane(ground, hit)) return -1; for (let i = 0; i < P.TERMS.length; i++) { const q = TERMP(i); if (Math.abs(hit.x - q.x) < 6.5 && Math.abs(hit.z - q.z) < 4.4) return i; } return -1; }
  // a sigil: two rings and a figure inside that belongs to its terms
  function sigil(x, c, r, id, col, lw, sq) {
    // drawn by hand: every line wanders a little and the rings are gone over twice
    const wob = (k, n) => 1 + 0.035 * Math.sin(k * 2.7 + n * 1.9 + r * 0.01);
    const pt = (a, rr, n) => [c[0] + Math.cos(a) * rr * wob(a * 3, n), c[1] + Math.sin(a) * rr * (sq == null ? 0.62 : sq) * wob(a * 5, n + 2)];
    const ring = (rr, n) => { x.beginPath(); for (let k = 0; k <= 40; k++) { const q = pt(k / 40 * 6.4 + n, rr, n); if (k) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); } x.stroke(); };
    const star = (m, skip, rot, rr, n) => { x.beginPath(); for (let k = 0; k <= m; k++) { const q = pt(rot + k * skip * 2 * Math.PI / m, rr, n + k); if (k) x.lineTo(q[0], q[1]); else x.moveTo(q[0], q[1]); } x.stroke(); };
    x.strokeStyle = col; x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = lw; ring(r, 0); x.lineWidth = lw * 0.5; ring(r * 0.97, 3); x.lineWidth = lw * 0.6; ring(r * 0.86, 5);
    x.lineWidth = lw * 0.8; const up = -Math.PI / 2;
    if (id === 'glass') { star(4, 1, up, r * 0.84, 1); x.beginPath(); const a = pt(up, r * 0.84, 1), b = pt(up + 2.2, r * 0.5, 2), d = pt(up + 3.6, r * 0.84, 3); x.moveTo(a[0], a[1]); x.lineTo(c[0], c[1]); x.lineTo(b[0], b[1]); x.moveTo(c[0], c[1]); x.lineTo(d[0], d[1]); x.stroke(); }
    else if (id === 'occult') star(5, 2, up, r * 0.84, 1);
    else if (id === 'lean') { star(3, 1, up, r * 0.5, 1); [0, 1, 2].forEach(k => { const q = pt(up + k * 2.094, r * 0.66, 9); x.beginPath(); x.ellipse(q[0], q[1], r * 0.12, r * 0.08, 0, 0, 6.3); x.stroke(); }); }
    else if (id === 'long') { star(4, 1, up + Math.PI / 4, r * 0.84, 1); star(4, 1, up, r * 0.58, 4); }
    else if (id === 'hoard') { star(3, 1, up, r * 0.84, 1); star(3, 1, -up, r * 0.84, 6); }
    else { const q = pt(0, 0, 0); x.beginPath(); x.ellipse(c[0], c[1], r * 0.08, r * 0.05, 0, 0, 6.3); x.stroke(); }
  }

  function openFamily(i) { const f = P.FAMILIES[i]; if (st.mode !== 'shop' || !f || meta.tier < 1 || meta.fam[f.id] || meta.credit < f.cost) { sfx.bad(); return; } meta.credit -= f.cost; meta.fam[f.id] = true; saveMeta(); sfx.fanfare(); st.shake = 1.2; st.flash = 1; st.flashC = '255,214,0'; callout(f.name + ' opened', '', '#8a6a00'); dirty = true; }
  // between runs: what the run paid, and the suppliers that can be opened with it
  function showSuppliers() { st.tok++; st.mode = 'shop'; shop.earned = (run.beaten + (run.bonus || 0)) * (run.payMul || 1); meta.credit += shop.earned; saveMeta(); clearRound(); clearBriefs(); clearKit(); clearPicks(); st.call = null; st.floats = []; st.blots = []; st.pings = []; st.hover = -1; sfx.feed(); dirty = true; }
  function openSupplier(i) { const sp = P.SUPPLY[i]; if (st.mode !== 'shop' || i !== meta.tier + 1 || i > shopMax() || !sp || meta.credit < sp.cost) { sfx.bad(); return; } meta.credit -= sp.cost; meta.tier = i; saveMeta(); sfx.fanfare(); st.shake = 1.2; st.flash = 1; st.flashC = '255,214,0'; callout(sp.name + ' opened', '', '#8a6a00'); dirty = true; }
  // Pointing at a reaction works out what it would do, so the page can show it before the click
  function setHover(i) {
    st.hover = i; st.peek = null; st.willFire = null;
    const s = st.mode === 'play' && g && slots[i], o = s && s.o;
    if (o && center && center.model === g.m && st.view) { let at = o.atoms || []; if (st.view.fwd) { const inv = new Map(); st.view.fwd.forEach((a, a0) => inv.set(a, a0)); at = at.map(a => inv.get(a)).filter(Boolean); } st.peek = { marks: marksOf(center, at, 0.01, 0.2), col: rgb(colOf(s.id)), outline: g.queue.length > 0, quiet: true }; }
    else if (o && center && center.model === g.m) { const pk = P.peek(g, o); pk.marks = marksOf(center, o.atoms || [], 0.01, 0.2); pk.col = rgb(colOf(s.id)); st.peek = pk; st.willFire = new Set(pk.fires); }
    dirty = true;
  }
  // sets off the chain that the row has charged. From here the molecule reacts by itself until nothing carries it on
  function setOff() {
    if (st.mode !== 'fuse' || !P.fire(g)) return;
    callout('overreact', '', REDINK); sfx.fuse(); sfx.over(); st.shake = 2.4; st.flash = 1; st.flashC = '214,69,58'; st.hold = performance.now() + 220; spray(60, REDINK, true);
    const c = P.chainNext(g); if (!c && g.chain) { st.chainN = 0; st.mode = 'play'; return refresh(); } if (!c) { st.mode = 'play'; return nextPage(); }
    st.chainN = 1; const k = g.kinds.indexOf(c.id); st.mode = 'play'; react(c, c.id, false, LAB[k] ? { x: LAB[k].x - 0.8, z: LAB[k].z + 0.5 } : { x: 17, z: -6 }, true);
  }
  // A molecule that turns back in a U, or straightens out of one, between two drawings: the move is the bend itself
  // opening or closing, each body carried whole, and not every atom going straight to its new place through the others
  function bendOf(prev, nm, fwd, from) {
    const pf = prev && prev.at.fold, nf = nm.at.fold; if (!prev || !fwd || !!pf === !!nf || !prev.at.unf || !nm.at.unf) return null;
    const U0 = new Map(); fwd.forEach((na, oa) => { const u = prev.at.unf.get(oa); if (u && nm.at.unf.has(na) && from.has(na)) U0.set(na, u); });
    const F = pf || nf, tr = pf ? (a => fwd.get(a)) : (a => a), ok = a => a && U0.has(a);
    const bodies = F.bodies.map(o => ({ atoms: o.atoms.map(tr).filter(ok), bbs: o.bbs.map(tr).filter(ok) })).filter(o => o.atoms.length);
    const B = { F, bodies, U0, U1: nm.at.unf, f0: pf ? 1 : 0, f1: nf ? 1 : 0, e0: new Map(), e1: new Map(), tmp: new Map() };
    bendAll(F, bodies, a => U0.get(a), B.f0, (a, x, z) => { const fr = from.get(a); B.e0.set(a, { x: fr.x - x, z: fr.z - z }); });
    bendAll(F, bodies, a => B.U1.get(a), B.f1, (a, x, z) => { const to = nm.at.get(a); B.e1.set(a, { x: to.x - x, z: to.z - z }); });
    return B;
  }
  function bendEval(B, k, mo) {
    const f = B.f0 + (B.f1 - B.f0) * k, U = a => { const u0 = B.U0.get(a), u1 = B.U1.get(a); let t = B.tmp.get(a); if (!t) { t = { x: 0, z: 0 }; B.tmp.set(a, t); } t.x = u0.x + (u1.x - u0.x) * k; t.z = u0.z + (u1.z - u0.z) * k; return t; };
    bendAll(B.F, B.bodies, U, f, (a, x, z) => { const c = mo.cur.get(a), fr = mo.from.get(a), to = mo.m.at.get(a), e0 = B.e0.get(a), e1 = B.e1.get(a); if (!c || !fr || !e0 || !e1) return; c.set(x + e0.x * (1 - k) + e1.x * k, fr.y + (to.y - fr.y) * k, z + e0.z * (1 - k) + e1.z * k); });
    mo.m.balls.forEach((b, a) => { if (a.el !== 'H') return; const fr = mo.from.get(a); if (!fr) return; const par = mo.m.model.neighbors(a).map(q => q.atom).find(q => B.e0.has(q)); if (!par) return; const pf = mo.from.get(par), pt = mo.m.at.get(par), to = mo.m.at.get(a), pc = mo.cur.get(par); mo.cur.get(a).set(pc.x + (fr.x - pf.x) * (1 - k) + (to.x - pt.x) * k, fr.y + (to.y - fr.y) * k, pc.z + (fr.z - pf.z) * (1 - k) + (to.z - pt.z) * k); });
  }
  // finishes at once whatever the last reaction was still playing, so that the next one can start
  function flush() {
    if (morph) { layout(morph.m, a => morph.m.at.get(a), null); morph = null; }
    if (st.pending) { const pd = st.pending; st.pending = null; pd.ids.forEach(clearTimeout); pd.final(); }
  }
  function endRound() {
    // what the round gave off goes into the jars for good, win or lose; a jar that is now full hatches
    { const b = P.runBank(run, g); st.hatched = null; JARK.forEach(k => { meta.jar[k] = Math.min(P.JAR.full[k], (meta.jar[k] || 0) + (b[k] || 0)); if (!meta.hatched[k] && meta.jar[k] >= P.JAR.full[k]) { meta.hatched[k] = true; st.hatched = k; st.hatchT = performance.now(); } }); st.by = { water: 0, h2: 0, gauge: 0 }; JARK.forEach(k => { g.by[k] = 0; }); st.flyers.forEach(f => { f.keep = null; }); saveMeta(); }
    st.homWait = false; st.homList = null;
    st.mode = 'done'; st.call = null; clearKit(); st.pass = g.total >= st.quota; st.won = st.pass && run.round === 9; if (st.won) run.won = true; if (!meta.taught) { meta.taught = true; saveMeta(); }
    if (st.pass) run.beaten++;
    if (meta.stage < 2 && run.beaten >= 3) { meta.stage = 2; if (run.term !== 'hoard') run.noGear = false; saveMeta(); }
    else if (meta.stage === 2 && st.pass && run.beaten === 6) { meta.six = (meta.six || 0) + 1; if (meta.six >= 2) meta.stage = 3; saveMeta(); }
    { if (!meta.sig) meta.sig = {}; const got = occultOpen() ? P.deeds(g, run, st.pass).filter(id => !meta.sig[id]) : []; if (got.length) { got.forEach(id => { meta.sig[id] = true; }); saveMeta(); st.newSig = got[0]; st.newSigT = performance.now(); } else st.newSig = null; }
    st.earn = st.pass ? P.runEarn(run, g.total, st.quota) : null; if (st.earn && st.earn.marks + st.earn.interest + (st.earn.extra || 0)) st.coinT = performance.now();
    if (st.pass) { P.runKeep(run, g); st.paid = P.runPay(run); { const extra = (run.gear.includes('goggles') ? 1 : 0) + (run.gear.includes('grant') && g.total >= st.quota * 10 ? 5 : 0); if (extra) { run.bonus = (run.bonus || 0) + extra; st.paid = (st.paid || 0) + extra; } } sfx.fanfare(); st.shake = 1.2; st.flash = 1; st.flashC = '28,138,74'; }
    else { run.over = true; sfx.bad(); st.shake = 0.5; st.flash = 0.8; st.flashC = '200,38,28'; }
    if (run.beaten > best) { best = run.beaten; try { localStorage.setItem('aa_scheme_best', String(best)); } catch (e) { /* storage unavailable */ } }
    refresh();
  }
  function nextPage() {
    st.homWait = false; st.homList = null; st.homSpot = null; st.homHover = false; st.homNone = false;
    if (!P.turn(g)) { P.synEnd(g); return endRound(); }
    st.cstep = null;
    if (g.hom && g.hom.frozen) { st.want = P.made(g); st.P = g.P; st.R = g.R; st.mult = P.mult(g); st.madeBump = 1; }
    st.E = g.E; if (st.gear.includes('intern')) { const tk = st.tok; setTimeout(() => { if (tk === st.tok) internGo(); }, 700); }
    flush(); if (g.reopened && g.m.settle && caged(g.m, archesOf(g.m))) g.m.settle(500); setAlign(g.m); tweens = tweens.filter(tw => tw.m !== center);
    // the new page's drawing carries on from the last: the same way up, and turned back to the same side if it turns back
    const sd = new Map(); if (center) { const mp = g.reopened && g.reopened.map, live = new Set(g.m.atoms); if (mp) mp.forEach((na, oa) => { const q = center.at.get(oa); if (q && center.balls.has(oa) && live.has(na)) sd.set(na, q); }); if (!sd.size) center.balls.forEach((b, a) => { if (live.has(a)) sd.set(a, center.at.get(a)); }); if (center.at.fold) sd.fold = { dir: center.at.fold.dir }; }
    freeMol(center); center = buildMol(g.m, null, false, sd.size ? sd : null); SC_MAIN = fitMain(center); place(center, C0, st.sc); center.hot = g.cur.path.length ? marksOf(center, Array.from(g.cur.fresh), 0.01, 0.2) : []; center.groups = groupsOf(center); center.ghosts = []; st.pop = 1;
    rowMols.forEach(freeMol); rowMols = []; st.pageStart = g.trail.length; st.turned = performance.now(); sfx.feed(); refresh(); st.sq = 0.8; st.kvz += 10;
    if (startPage()) return;
    // a page on which no reagent acts turns itself
    if (!slots.some(q => q && q.o) && !P.canRedraw(g) && !P.canBank(g) && !kitObjs.some(k => P.canTool(g, k.id))) { const tok = st.tok; st.mode = 'move'; setTimeout(() => { if (tok !== st.tok) return; st.mode = 'play'; nextPage(); }, 350); }
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
    const quick = st.firing ? 0.4 : PLAIN ? Math.max(0.42, Math.pow(0.87, st.chainN || 0)) : Math.pow(0.8, st.chainN || 0); let at = (PLAIN ? 120 : 300) * Math.max(0.35, quick), gap = Math.max(50, (PLAIN ? 110 : 210) * quick), place = -1, last = { x: C0.x, z: C0.z };
    if (PLAIN && TILE[reagent] && lab && !o.self) { const trav = 210 * Math.max(0.55, quick); st.fly = { a: lab, b: spot(0), tl: TILE[reagent], t: performance.now(), trav: at + trav - 120, hold: 620 * Math.max(0.6, quick) }; at += trav; }
    const whenOf = new Map();
    beats.forEach((e, k) => {
      const when = at; whenOf.set(e, when); at += e.src === 'bottle' ? Math.max(gap, 300 * Math.max(0.35, quick)) : gap; gap = Math.max(70, gap * 0.88);
      if (e.src === 'bottle') { place++; placeAt.push(when); const kk = place; later(() => { if (tok === st.tok && !PLAIN) st.strokes.push({ a: lab, b: spot(kk), col: rcol, t: performance.now(), dur: 150 }); }, Math.max(0, when - 150)); }
      const pl = place;
      later(() => {
        if (tok !== st.tok) return;
        const key = e.part === 'h' ? 'p' : e.part, big = e.op === 'mul';
        if (!o.casc) { st.want = Math.max(st.want, e.made); st.madeBump = 1; } st.P = e.P; st.R = e.R; st.E = e.E; st.mult = e.R * e.E; st.bump[key] = 1;
        const piece = P.GEARS[e.src] ? e.src : null, txt = e.act ? '' : (big ? 'times ' : '+') + fmtB(e.val);
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
        if (e.src === 'circle') { st.ringT = performance.now(); callout('transmute', '', '#8a6a00'); }
        if (PLAIN && !o.casc && e.val && (e.src === 'bottle' || piece || e.src === 'circle' || e.src === 'family' || e.src === 'iso' || e.src === 'row' || e.src === 'route' || e.src === 'short' || e.src === 'brief')) { const ko2 = piece ? kitObjs.find(q => q.id === piece) : null, src = ko2 ? { x: ko2.grp.position.x, z: ko2.grp.position.z + 2.6 } : { x: last.x, z: under() + 0.6 }; st.motes.push({ txt, part: key === 'p' ? 'p' : 'm', col: e.src === 'family' && P.KIN[e.kin] ? P.KIN[e.kin].col : PART[e.part], a: src, t: performance.now() + 120, dur: 380 }); }
        st.shake = Math.max(st.shake, (big ? 0.7 : e.src === 'iso' ? 0.5 : 0.2) * (1 + 1.0 * f));
        if (f >= 0.5 && k % 2 === 0) slash(PART[e.part]);
        sfx.lock(Math.min(12, k + g.cur.path.length));
      }, when);
    });
    const stepT = o.casc ? stepMs(g.casc || 1) : 0, dur = Math.max(at + 60 + (FOLDS[reagent] && !stepT ? 380 : 0), stepT), lastPlace = placeAt.length ? placeAt[placeAt.length - 1] : 300;
    // every atom sets off for its new position when the reagent reaches the place nearest to it
    { const start = new Map(), cur = new Map(); let end = 0;
      mol.balls.forEach((b, a) => { const q = mol.at.get(a), tt = -q.y / camDir.y, gx = q.x + camDir.x * tt, gz = q.z + camDir.z * tt; let bi = 0, bd = 1e9; marks.forEach((m, k) => { const d = Math.hypot(m.x - gx, m.z - gz); if (d < bd) { bd = d; bi = k; } }); const s0 = placeAt.length ? placeAt[Math.min(bi, placeAt.length - 1)] : 300; start.set(a, s0); cur.set(a, new T.Vector3()); end = Math.max(end, s0 + (FOLDS[reagent] ? 1100 : 480)); });
      morph = { s0: stepT ? stepT * 0.28 : o.self ? 0 : Math.min.apply(null, Array.from(start.values()).concat(1e9)), ms: stepT ? stepT * 0.6 : 0, slow: !!FOLDS[reagent], m: mol, from: from || new Map(), start, cur, t0: performance.now(), end, made: new Set(o.r.made || []) }; }
    st.zoomUntil = performance.now() + lastPlace + 330; st.focus = spot(0);
    // what leaves sets off when the reagent reaches the place nearest to it, and letters change at the same moment
    { const near = p => { let bi = 0, bd = 1e9; marks.forEach((m, k) => { const d = Math.hypot(m.x - p.x, m.z - p.z); if (d < bd) { bd = d; bi = k; } }); return performance.now() + (placeAt.length ? placeAt[Math.min(bi, placeAt.length - 1)] : 300); };
      const t00 = performance.now();
      st.flyers.forEach(f => { if (f.set) return; f.set = true; f.t0 = Math.min(near(f.at), t00 + 260);
        const ev = beats.find(e => e.gone === f.gi && (P.GEARS[e.src] || e.src === 'collect')), ko = ev && P.GEARS[ev.src] ? kitObjs.find(q => q.id === ev.src) : null;
        if (ko) { f.to = new T.Vector3(ko.grp.position.x, 1.6, ko.grp.position.z - 0.6); }
        else { f.to = byTarget(f.kind); f.keep = ev ? f.kind : null; } }); (mol.groups || []).forEach(q => { if (q.born) q.t = near(q); }); (mol.ghosts || []).forEach(q => { q.t = near(q); }); }
    if (o.casc) { const gn = P.made(g) - before, src = spot(0), t0 = performance.now(); st.gains.push({ txt: '+' + fmt(gn), a: { x: src.x, z: src.z }, t0: t0 + stepT * 0.03, t: t0 + stepT * 0.14, dur: Math.max(110, stepT * 0.42), to: P.made(g), fresh: !st.cstep || st.cstep.fresh }); }
    const final = () => {
      if (tok !== st.tok) return;
      const now = performance.now(), gain = P.made(g) - before, route = t.ev.find(e => e.src === 'route'), len = g.cur.path.length, size = Math.log10(Math.max(10, gain));
      if (!st.gains.length) st.want = P.made(g); st.P = g.P; st.R = g.R; st.E = g.E; st.mult = P.mult(g);
      if (!PLAIN) st.floats.push({ txt: '+' + fmt(gain), t: now, size: 80 + 34 * size, dx: (Math.random() - 0.5) * 3, col: '#8a6a00' });
      st.shake = Math.max(st.shake, 0.4 + 0.35 * size);
      // a hot reaction leaves its mark on the paper for the rest of the round
      if (false) st.stains.push({ x: C0.x + (Math.random() - 0.5) * 30, z: C0.z + (Math.random() - 0.5) * 10, r: 30 + Math.random() * 70, a: 0.03 + Math.random() * 0.04, ring: Math.random() < 0.6 });
      if (route && P.FOUND[route.route] && !meta.found[P.FOUND[route.route]]) { const nid = P.FOUND[route.route]; meta.found[nid] = true; saveMeta(); if (run.extra && !run.extra.includes(nid)) run.extra.push(nid); st.floats.push({ txt: 'found ' + RX.CARDS[nid].verb.toLowerCase(), t: now, size: 70, dx: 0, col: P.RARITY.rare.col }); sfx.fanfare(); }
      if (route) { callout(AA.rxRun.ROUTE[route.route].tag || AA.rxRun.ROUTE[route.route].name, 'row +' + fmtB(route.val), PART.r); sfx.good(); st.shake = Math.max(st.shake, 1.6); spray(60, PART.r, true); }
      else if (o.finish) { callout('finished', 'extra +' + fmtB(P.SYN.finishExtra * o.r.hits), GREEN); sfx.good(); spray(50, GREEN, true); }

      if (route || o.finish || t.set) { /* named above */ } else if (t.cont && len >= 3) { callout(len + ' in a row', 'row ' + fmtB(g.R), INK); spray(20 * len, INK, true); st.shake = Math.max(st.shake, 0.6 + 0.3 * len); }
      else if (wasOpen && !t.cont && t.held) callout('held', '', PENCIL); else if (wasOpen && !t.cont && !st.gear.includes('ouroboros') && !P.RULE.cascade) callout('row broken', '', PENCIL);
      // passing the number to beat, and each doubling past it
      const m = P.made(g), times = Math.floor(m / st.quota);
      // (the page marks the number being passed at the frame the total crosses it: see frame and passT)
      if (times >= 1 && st.over < times) st.over = times;
      dirty = true;
    };
    ids.push(setTimeout(() => { st.pending = null; final(); }, dur)); st.pending = { ids, final };
    if (stepT) return { dur, unlock: stepT };
    return { dur, unlock: Math.min(dur, st.firing && !FOLDS[reagent] ? (placeAt.length ? placeAt[0] : 160) + 70 : lastPlace + (FOLDS[reagent] ? (st.firing ? Math.max(120, 300 * quick) : 520) : 210)) };
  }
  function pick(i) {
    const s = slots[i], o = s && s.o;
    if (P.RULE.queue && g && !g.chain) { if (!s || st.mode !== 'play' || g.shot) return; if (!P.queueAdd(g, s.id)) { sfx.bad(); return; } sfx.lock(g.queue.length); st.qT = performance.now(); refresh(); return; }
    if (!o || !prods[i] || st.mode !== 'play') return;
    const link = !!g.chain; st.chainN = link ? (st.chainN || 0) + 1 : 0; react(o, s.id, s.fin, LAB[i] ? { x: LAB[i].x - 0.8, z: LAB[i].z + 0.5 } : { x: C0.x, z: -9 }, link);
  }
  // The bank, the redraw and the turn of a page on which nothing acts. Each is one click on a mark on the page.
  const BANK = { x: STEP.x + 0.2, z: STEP.z + 2.45 }, DRAW = { x: 16.9, z: -10.2 };
  const lining = () => P.RULE.queue && st.mode === 'play' && !!g && !g.over && !g.chain && !g.shot;
  const bankAt = () => st.mode === 'play' && g && (lining() || P.canBank(g)) && hit.x > BANK.x - 1.4 && hit.x < BANK.x + 5 && Math.abs(hit.z - BANK.z) < 1.2;
  // the reaction arrow after the circles fires the page; a click on a filled circle takes its reagent back
  const FIREP = () => ({ x: STEP.x + P.stepsOf(g) * 2.5 + 0.9, z: STEP.z });
  const fireAt = () => lining() && Math.abs(hit.x - FIREP().x) < 2.2 && Math.abs(hit.z - STEP.z) < 1.4;
  const circleAt = () => { if (!lining()) return -1; for (let k = 0; k < g.queue.length; k++) if (Math.abs(hit.x - (STEP.x + (g.pageSteps + k) * 2.5)) < 1.15 && Math.abs(hit.z - STEP.z) < 1.2) return k; return -1; };
  function doUnqueue(k) { if (!lining() || !P.queueDrop(g, k < 0 ? g.queue.length - 1 : k)) return; sfx.feed(); refresh(); }
  function bankNow() { const gain = P.bankGain(g); P.bank(g); st.want = P.made(g); st.P = g.P; st.R = g.R; st.E = g.E; st.mult = P.mult(g); st.bump.p = 1; st.madeBump = 1; st.chainN = 0; if (center) center.hot = []; st.motes.push({ txt: '+' + fmt(gain), part: 'p', col: '#8a6a00', a: { x: STEP.x + (g.pageSteps - 1) * 2.5, z: STEP.z - 1 }, t: performance.now(), dur: 420 }); sfx.good(); st.shake = Math.max(st.shake, 0.5); }
  function doFire() { if (!lining()) return; toolOff(); flush(); setHover(-1); st.firing = true; st.fireN = 0; st.acted = false; st.rezip = false; st.seeded = false; st.chainN = 0; g.shot = true; slots = []; prods.forEach(m => { if (m) freeMol(m); }); prods = []; fireNext(); }
  // A piece that acts on the molecule or the page is shown acting: it hops, as a piece does when it fires
  const pieceActs = id => { st.fired[id] = { t: performance.now(), txt: '', col: INK }; const k = kitObjs.find(q => q.id === id); if (k) st.strokes.push({ a: { x: k.hx, z: k.hz + 4.3 }, b: { x: C0.x + (k.hx - C0.x) * 0.25, z: C0.z - 3.2 }, col: '#2f78a0', t: performance.now(), dur: 300 }); sfx.lock(6); dirty = true; };
  // ---------- a piece used on the molecule ----------
  // A click on a piece that can still be used this round picks it up. The places it can go are then dotted on the
  // page under the molecule, the one under the pointer shows what would happen there, and a click does it. A piece
  // that acts on the whole molecule shows everything it would change, and a click anywhere on the molecule does it.
  const toolAt = () => { if (!lining() || !g) return null; for (const k of kitObjs) if (P.canTool(g, k.id) && Math.abs(hit.x - k.hx) < 1.9 && hit.z > k.hz - 3.8 && hit.z < k.hz + 3.4) return k.id; return null; };
  const toolPt = a => { const mk = a && a.el !== 'H' ? marksOf(center, [a], 0.01, 0.2)[0] : null; return mk ? { x: mk.x, z: mk.z } : null; };
  const toolOff = () => { if (st.tool) dirty = true; st.tool = null; st.toolList = null; st.toolSpot = null; };
  function toolArm(id) {
    if (st.tool === id) return toolOff();
    const G = P.GEARS[id], md = center.model, side = (a, b) => { const S = new Set([a]), q = [a]; while (q.length) { const u = q.pop(); md.neighbors(u).forEach(n => { const v = n.atom; if (v.el === 'H' || S.has(v) || (u === a && v === b)) return; S.add(v); q.push(v); }); } return Array.from(S); };
    st.tool = id; st.toolSpot = null;
    st.toolList = P.toolSpots(g, id).map(sp => { const at = RX.tools.at(sp).map(toolPt).filter(Boolean); if (!at.length) return null; let x = 0, z = 0; if (sp.b && at.length === 2) { x = at[0].x * 0.72 + at[1].x * 0.28; z = at[0].z * 0.72 + at[1].z * 0.28; } else at.forEach(q => { x += q.x / at.length; z += q.z / at.length; });
      const it = { sp, x, z, at, whole: !!G.whole };
      if (sp.runs) it.gone = [].concat.apply([], sp.runs.map(r => r.slice(1, -1))).map(toolPt).filter(Boolean);
      if (sp.pairs) it.at = sp.pairs.map(q => toolPt(q[0])).filter(Boolean);
      if (sp.ols) it.words = sp.ols.map(() => 'C=O').concat(sp.ones.map(() => 'OH'));
      { const ga = sp.runs ? [].concat.apply([], sp.runs.map(r => r.slice(1, -1))) : sp.b ? side(sp.b, sp.a) : null; if (ga) { const gs = new Set(ga); it.goneB = md.bonds.filter(k => k.a.el !== 'H' && k.b.el !== 'H' && (gs.has(k.a) || gs.has(k.b))).map(k => [toolPt(k.a), toolPt(k.b)]).filter(q => q[0] && q[1]); } }
      return it; }).filter(Boolean);
    // what each place is worth is worked out once, when the piece is picked up: the steps the molecule would zip with the piece used there
    if (id === 'crystal' || id === 'mirror') st.toolList.forEach(it => { try { it.worth = Math.max(0, P.toolWorth(g.m, id, it.sp, g.self)); } catch (e) { it.worth = null; } });
    if (!st.toolList.length) { toolOff(); sfx.bad(); } else sfx.click(); dirty = true;
  }
  // the mirror's ghost: the molecule as it would be, laid out as it will be, to be drawn in faint ink where it will stand
  function ghostOf(it) {
    try { const cm = RX.cloneMap(g.m), sp = { a: cm.map.get(it.sp.a), b: cm.map.get(it.sp.b), n: it.sp.n }, res = RX.tools.apply(cm.model, 'mirror', sp); if (!res) return null; RX.reopen(cm.model);
      const seed = new Map(), live = new Set(cm.model.atoms); cm.map.forEach((na, oa) => { const q = center.at.get(oa); if (q && center.balls.has(oa) && live.has(na)) seed.set(na, q); }); if (center.at.fold) seed.fold = { dir: center.at.fold.dir };
      const gm = buildMol(cm.model, null, false, seed.size ? seed : null, new Map()), down = a => { const p = gm.at.get(a), t = -p.y / camDir.y; return { x: p.x + camDir.x * t, z: p.z + camDir.z * t }; }, made = new Set(res.made || []), out = { sc: fitMain(gm), bonds: [], os: [], join: null };
      gm.sticks.forEach(q => { if (q.a.el === 'H' || q.b.el === 'H') return; const e = [down(q.a), down(q.b)]; if ((q.a === sp.a && made.has(q.b)) || (q.b === sp.a && made.has(q.a))) out.join = e; else out.bonds.push(e); });
      gm.balls.forEach((b, a) => { if (a.el === 'O') out.os.push(down(a)); }); freeMol(gm); return out; } catch (e) { return null; }
  }
  function toolHover() { if (!st.tool || !st.toolList || !center) return; const sc = center.group.scale.x; let best = null, bd = 1.6; st.toolList.forEach(q => { const d = q.whole ? (Math.abs(hit.x - C0.x) < 11 && Math.abs(hit.z - C0.z) < 5.5 ? 0 : 9) : Math.hypot(hit.x - (C0.x + q.x * sc), hit.z - (C0.z + q.z * sc)); if (d < bd) { bd = d; best = q; } }); if (best !== st.toolSpot) { st.toolSpot = best; if (best && best.sp.b && best.ghost === undefined) best.ghost = ghostOf(best); dirty = true; } }
  function doTool() {
    const id = st.tool, it = st.toolSpot; toolOff(); if (!it || !P.toolUse(g, id, it.sp)) { sfx.bad(); return; }
    setHover(-1); pieceActs(id); reopenShow(); sfx.good(); st.shake = Math.max(st.shake, 0.5); const tok = st.tok; st.mode = 'move';
    if (g.toolRun) { g.toolRun = false; st.starting = true; st.firing = true; st.rezip = true; st.acted = false; st.chainN = 0; setTimeout(() => { if (tok === st.tok) fireNext(); }, 420); }
    else setTimeout(() => { if (tok !== st.tok) return; st.mode = 'play'; refresh(); }, 360);
  }
  // What a page does by itself before any reagent (the burette adds a link, the seed crystal starts the zip) is played
  // one step at a time, like a cascade, before the page can be lined up
  function startPage() { if (!g || g.over || !g.startTodo || !g.startTodo.length) return false; const tok = st.tok; st.mode = 'move'; st.starting = true; setTimeout(() => { if (tok !== st.tok) return; st.firing = true; st.acted = false; st.chainN = 0; fireNext(); }, 420); return true; }
  // the recycler has opened the rings: the molecule on the page springs open from where its atoms stood
  function reopenShow() {
    flush(); const prev = center, mp = g.reopened && g.reopened.map, seed = new Map(); if (mp) mp.forEach((na, oa) => { const q = prev.at.get(oa); if (q && prev.balls.has(oa)) seed.set(na, q); }); if (prev.at.fold) seed.fold = { dir: prev.at.fold.dir };
    if (g.m.settle && g.m.atoms.some(a => a.slime) && caged(g.m, archesOf(g.m))) g.m.settle(500);
    const nm = buildMol(g.m, null, false, seed.size ? seed : null, new Map()); place(nm, C0, st.sc); const from = new Map(), start = new Map(), cur = new Map(); seed.forEach((q, na) => { if (nm.balls.has(na)) from.set(na, q.clone()); }); nm.balls.forEach((b, a) => { start.set(a, 0); cur.set(a, new T.Vector3()); });
    nm.sticks.forEach(q => { const fa = from.get(q.a), fb = from.get(q.b), ta = nm.at.get(q.a), tb = nm.at.get(q.b); q.old = !!(fa && fb && ta && tb && fa.distanceTo(fb) < 1.4 * ta.distanceTo(tb)); }); tweens = tweens.filter(tw => tw.m !== prev); freeMol(prev); center = nm; SC_MAIN = fitMain(nm); nm.hot = []; nm.groups = groupsOf(nm); nm.ghosts = []; nm.marks = [];
    morph = { s0: 0, ms: 0, slow: false, m: nm, from, start, cur, t0: performance.now(), end: 260, made: new Set() }; dirty = true;
    if (mp) { morph.bend = bendOf(prev, nm, mp, from); if (morph.bend) morph.end = 440; }
    // what the piece drove off: each a small molecule of its own, set where it left from, on its way to where it is kept
    if (mp && g.reopened.gone && g.reopened.gone.length) { const rev = new Map(); mp.forEach((na, oa) => rev.set(na, oa)); const t00 = performance.now(); g.reopened.gone.forEach((grp0, gi) => { const kind = P.byKind(grp0); const p = flyer(grp0, gi, kind, a => rev.get(a), prev, null); const f = st.flyers[st.flyers.length - 1]; f.set = true; f.t0 = t00 + 60 + gi * 40; f.to = byTarget(kind); f.keep = kind === 'water' || kind === 'h2' ? kind : null; }); g.reopened.gone = []; }
  }
  // one thing that has left the molecule, as a small molecule of its own standing where it left from
  function flyer(grp0, gi, kind, back, prev, nm) {
    const grp = new T.Group(), els = kind === 'water' ? ['O', 'H', 'H'] : kind === 'h2' ? ['H', 'H'] : grp0.map(a => a.el).sort((a, b) => (a === 'H') - (b === 'H')).slice(0, 3), hub = els[0] !== 'H';
    els.forEach((el, k) => { const side = k % 2 ? -1 : 1, px0 = hub ? (k ? side * 0.78 : 0) : side * 0.36, py = hub && k ? 0.5 : 0; add(SPH, ballMat(el), px0, py, 0, grp).scale.setScalar(BALL(el)); });
    const srcA = grp0.map(back).find(a => a && prev.balls.has(a)), p = srcA ? prev.at.get(srcA) : nm && nm.marks[0] ? { x: nm.marks[0].x, y: 0.6, z: nm.marks[0].z } : { x: 0, y: 0.6, z: 0 };
    grp.position.set(C0.x + p.x * st.sc, p.y * st.sc, C0.z + p.z * st.sc); grp.scale.setScalar(st.sc); scene.add(grp);
    st.flyers.push({ grp, gi, kind, at: { x: p.x, z: p.z }, from: grp.position.clone(), to: byTarget(kind), t0: performance.now() + 200, dur: 400, spin: gi % 2 ? 1.2 : -1.2 });
    return p;
  }
  // the next thing in the queue has its turn. When the queue is empty the page overreacts if its row held, or turns
  function fireNext() {
    { const s0 = st.starting && !g.over ? P.startDue(g) : null; if (s0) { const k = kitObjs.find(q => q.id === s0.by); if (s0.by) pieceActs(s0.by); if (s0.casc) { st.chainN = (st.chainN || 0) + 1; if (s0.model.settle && caged(s0.model, archesOf(s0.model))) s0.model.settle(500); } return react(s0, s0.id, false, k ? { x: k.hx, z: k.hz + 2.6 } : { x: C0.x, z: C0.z - 2 }, true); } }
    // the cascade: whatever the molecule can do to itself happens first, one step at a time, each quicker than the last.
    // The seed crystal holds it until the line is empty and then starts it whatever the reagents did
    { const end = P.cascMode(g) === 'end', c = g.over ? null : st.rezip ? P.cascadeNext(g) : st.starting ? null : st.acted || end ? P.cascadeDue(g) : null;
      if (c) { if (end && !st.rezip && !st.seeded) { st.seeded = true; pieceActs('crystal'); } if (c.by) pieceActs(c.by); st.chainN = (st.chainN || 0) + 1; const n = (g.casc || 0) + 1; st.cstep = { n, name: KINDNAME[c.id] || c.id, t: performance.now(), fresh: !P.RULE.fresh || n > (g.cascBest || 0) }; st.fly = null; if (c.model.settle && caged(c.model, archesOf(c.model))) c.model.settle(500); return react(c, c.id, false, { x: C0.x, z: C0.z - 2 }, true); }
      st.rezip = false;
      // the mirror, the recycler: the rings spring open and the chain zips again
      if (!g.over && !st.starting) { const by = P.again(g); if (by) { const tk = st.tok; pieceActs(by); reopenShow(); st.rezip = true; st.mode = 'move'; setTimeout(() => { if (tk === st.tok) fireNext(); }, 430); return; } } }
    let h = P.queueHead(g); const tok = st.tok;
    if (st.starting) { st.firing = false; st.starting = false; if (g.over) return; st.mode = 'play'; refresh(); if (!slots.some(q => q && q.o) && !P.canRedraw(g) && !P.canBank(g) && !g.queue.length && !kitObjs.some(k => P.canTool(g, k.id))) { st.mode = 'move'; setTimeout(() => { if (tok !== st.tok) return; st.mode = 'play'; nextPage(); }, 350); } return; }
    if (!h) { st.firing = false; if (g.over) return; if (P.charged(g)) { st.mode = 'fuse'; st.fuseT = performance.now(); dirty = true; setTimeout(() => { if (st.tok === tok && st.mode === 'fuse') setOff(); }, 280); return; } st.mode = 'play'; if (homOffer()) return; return nextPage(); }
    P.queueShift(g); st.fireN = (st.fireN || 0) + 1; st.acted = h.kind === 'take';
    if (h.kind === 'take' || h.kind === 'finish') return react(h.o, h.id, h.kind === 'finish', { x: STEP.x + g.pageSteps * 2.5, z: STEP.z }, false);
    const wait = 160; if (h.kind === 'bank') bankNow(); else { P.waste(g, h.id); sfx.bad(); st.shake = Math.max(st.shake, 0.3); }
    st.mode = 'move'; dirty = true; setTimeout(() => { if (tok === st.tok) fireNext(); }, wait);
  }

  // The homunculus (docs/JARS.md). When it has been fed and the page has fired, the page waits: a click on the figure
  // sets it off (hydrogen with more than one place: a click on the place), the turn arrow leaves it. The next deal
  // is not on the page yet. homOffer says whether the page is waiting.
  function homListOf() {
    const id = g.hom.id, H = P.HOMS[id], pre = !!H.before, base0 = pre ? (() => { try { return P.selfRun(RX.cloneModel(g.m), g.self); } catch (e) { return 0; } })() : 0;
    return P.homSpots(g).map(sp => { const it = { sp, whole: !!H.whole, x: 0, z: 0, at: [], bonds: [] };
      if (sp.pairs) sp.pairs.forEach(q => { const A = toolPt(q[0]), B = toolPt(q[1]); if (A && B) { it.bonds.push([A, B]); it.at.push({ x: (A.x + B.x) / 2, z: (A.z + B.z) / 2 }); } });
      if (sp.runs) sp.runs.forEach(run => { for (let k = 1; k + 2 < run.length; k++) { const A = toolPt(run[k]), B = toolPt(run[k + 1]); if (A && B) it.bonds.push([A, B]); } });
      if (sp.c && sp.o) { const A = toolPt(sp.c), B = toolPt(sp.o); if (A && B) { it.bonds.push([A, B]); it.at.push(B); it.x = B.x; it.z = B.z; } }
      else if (sp.c) { const A = toolPt(sp.c); if (A) { it.at.push(A); it.x = A.x; it.z = A.z; } }
      if (sp.rings) frostOf(center.model, sp.rings.map(q => q[0])).forEach(ring => ring.forEach((a, k) => { const A = toolPt(a), B = toolPt(ring[(k + 1) % ring.length]); if (A && B) it.bonds.push([A, B]); }));
      if (sp.rings || sp.all) it.worth = null; else try { const t = P.homTry(g.m, id, sp); it.worth = t ? Math.max(0, P.selfRun(t, g.self) - base0) : 0; } catch (e) { it.worth = null; } return it; });
  }
  function homOffer() {
    if (!g || g.over || !g.hom || P.HOMS[g.hom.id].before || !P.homReady(g) || !center || center.model !== g.m) return false;
    const base = g.casc || 0, list = homListOf();
    if (!list.length) { st.homNone = true; dirty = true; return false; }
    st.homWait = true; st.homPre = false; st.homList = list; st.homSpot = null; st.homHover = false; st.homBase = base; st.firing = false; dirty = true; return true;
  }
  // A creature tapped before the page is lined up (salt, wood spirit): a click on the figure while it is lit. The
  // wood spirit acts at once and the page fires; the salt shows its places and waits for one, and the go arrow leaves it
  const homPreAt = () => lining() && !!g.hom && !!P.HOMS[g.hom.id].before && !st.homWait && homAt() && !!center && center.model === g.m && P.homLit(g);
  function homPre() {
    const id = g.hom.id, H = P.HOMS[id]; toolOff(); setHover(-1);
    if (!H.whole) { const list = homListOf(); if (!list.length) { sfx.bad(); return; } st.homWait = true; st.homPre = true; st.homList = list; st.homSpot = null; st.homHover = false; sfx.click(); dirty = true; return; }
    if (!P.homUse(g, P.homSpots(g)[0])) { sfx.bad(); return; }
    st.homAct = { t: performance.now(), to: { x: C0.x - 5.5, z: C0.z + 1.6 }, id }; sfx.drift(); reopenShow(); refresh(); const tok = st.tok; st.mode = 'move';
    setTimeout(() => { if (tok !== st.tok) return; st.mode = 'play'; refresh(); doFire(); }, 430);
  }
  const homAt = () => !!homObj && Math.abs(hit.x - HOMP.x) < 2.2 && hit.z > HOMP.z - 4.2 && hit.z < HOMP.z + 2.6;
  const homTurnAt = () => !!st.homWait && Math.abs(hit.x - FIREP().x) < 2.2 && Math.abs(hit.z - STEP.z) < 1.4;
  function homPoint() { if (!st.homWait || !st.homList) return; const sc = center.group.scale.x, on = homAt(); let best = null, bd = 1.7; if (st.homList.length > 1) st.homList.forEach(q => { const d = Math.hypot(hit.x - (C0.x + q.x * sc), hit.z - (C0.z + q.z * sc)); if (d < bd) { bd = d; best = q; } }); if (on !== st.homHover || best !== st.homSpot) { st.homHover = on; st.homSpot = best; dirty = true; } }
  function homSkip() { if (!st.homWait) return; if (st.homPre) { st.homWait = false; st.homPre = false; st.homList = null; st.homSpot = null; sfx.feed(); dirty = true; return; } st.homWait = false; st.homList = null; sfx.feed(); st.mode = 'play'; nextPage(); }
  function doHom(it) {
    if (!st.homWait || !it) return; const id = g.hom.id, sc = center.group.scale.x, to = it.whole ? { x: C0.x - 5.5, z: C0.z + 1.6 } : { x: C0.x + it.x * sc - 0.9, z: C0.z + it.z * sc + 1.9 };
    if (!P.homUse(g, it.sp)) { sfx.bad(); return; }
    const pre = !!st.homPre; st.homPre = false; st.homWait = false; st.homList = null; st.homSpot = null; st.homHover = false; st.mode = 'move'; st.homAct = { t: performance.now(), to, id }; if (id === 'water') sfx.squish(); else sfx.drift();
    const tok = st.tok; setTimeout(() => { if (tok !== st.tok) return; reopenShow(); sfx.good(); if (pre) { setTimeout(() => { if (tok === st.tok) { st.mode = 'play'; refresh(); } }, 300); return; } st.firing = true; st.rezip = true; st.acted = false; setTimeout(() => { if (tok === st.tok) fireNext(); }, P.HOMS[id].now ? 380 : 200); }, 210);
  }
  const drawAt = () => st.mode === 'play' && g && P.canRedraw(g) && Math.abs(hit.x - DRAW.x) < 1.7 && Math.abs(hit.z - DRAW.z) < 1.5;
  const stuck = () => st.mode === 'play' && !!g && !g.over && !g.chain && !slots.some(q => q && q.o);
  const pagesAt = () => stuck() && hit.x > PAGES.x - 1.2 && hit.x < PAGES.x + 1.8 * P.pagesOf(g) + 1.6 && Math.abs(hit.z - PAGES.z) < 1.4;
  function doBank() {
    if (lining()) { if (!P.queueAdd(g, P.BANKID)) { sfx.bad(); return; } sfx.lock(g.queue.length); refresh(); return; }
    if (st.mode !== 'play' || !g || !P.canBank(g)) return;
    flush(); setHover(-1); const wasChain = g.chain, gain = P.bankGain(g); P.bank(g);
    st.want = P.made(g); st.P = g.P; st.R = g.R; st.E = g.E; st.mult = P.mult(g); st.bump.p = 1; st.madeBump = 1; st.chainN = 0; if (center) center.hot = [];
    st.motes.push({ txt: '+' + fmt(gain), part: 'p', col: '#8a6a00', a: { x: BANK.x, z: BANK.z - 1 }, t: performance.now(), dur: 420 }); sfx.good(); st.shake = Math.max(st.shake, 0.5);
    if (wasChain || g.pageSteps >= P.stepsOf(g)) { const tok = st.tok; st.mode = 'move'; slots = []; prods.forEach(freeMol); prods = []; setTimeout(() => { if (tok !== st.tok) return; st.mode = 'play'; nextPage(); }, 260); }
    else refresh();
    dirty = true;
  }
  function doRedraw() {
    if (st.mode !== 'play' || !g || !P.canRedraw(g)) return;
    flush(); P.redraw(g); st.drawT = performance.now(); sfx.feed(); refresh(); dirty = true;
  }
  function doTurn() { if (stuck()) nextPage(); }
  // reactions that fold the molecule into a new shape: the model is settled fully first, and the move is slow enough to follow
  const FOLDS = { cyclize: 1, snap: 1, aromatize: 1, lactol: 1, ether: 1, aldol: 1 };
  // the clear lane just below the molecule as it stands
  // how long step n of a cascade takes on the page: the first is slow enough to follow, each one after is quicker.
  // Six steps take 1.54 seconds and twelve 2.3
  const stepMs = n => Math.max(130, 380 * Math.pow(0.84, Math.max(0, n - 1)));
  const KINDNAME = { lactol: 'zip', snap6: 'snap', weld: 'weld' };
  // the clear lane just above the molecule as it stands
  const over = () => { let d = 6; try { if (center) d = deepOf(center) * center.group.scale.x; } catch (e) { d = 6; } return Math.max(-9.4, C0.z - d / 2 - 3.0); };
  const under = () => { let d = 6; try { if (center) d = deepOf(center) * center.group.scale.x; } catch (e) { d = 6; } return Math.min(7.4, C0.z + d / 2 + 0.9); };
  // ?self=auto: a molecule that has been set off also reacts with itself. Otherwise the player does it: when the
  // molecule could react with itself, a twist stands under it, once a page. It uses none of the page's reactions.
  try { P.SELFMODE.auto = new URLSearchParams(root.location.search).get('self') === 'auto'; } catch (e) { /* default */ }
  const TWIST = { x: 0.6, z: 8.5 };
  const twistOpt = () => { if (!g || st.mode !== 'play' || P.RULE.cascade || P.SELFMODE.auto || g.twisted === g.page) return null; const key = g.page + ':' + g.trail.length; if (!st.twC || st.twC.key !== key) st.twC = { key, o: P.selfOptions(g)[0] || null }; return st.twC.o; };
  const twistAt = () => twistOpt() && Math.abs(hit.x - C0.x) < 8.5 && Math.abs(hit.z - C0.z) < 3.8;
  // the monkey's paw is its own control: a click on it makes a wish
  const kitAt = id => kitObjs.find(k => k.id === id && Math.abs(hit.x - k.hx) < 1.8 && hit.z > k.hz - 3.6 && hit.z < k.hz + 1.4);
  const pawAt = () => kitAt('paw');
  function doDouse() { const k = kitObjs.find(q => q.id === 'extinguisher'); if (!k || !P.douse(g)) return; st.motes.push({ txt: 'times 1.5', part: 'm', col: PART.e, a: { x: k.hx, z: k.hz + 2.6 }, t: performance.now() + 80, dur: 420 }); callout('doused', '', PENCIL); dirty = true; }
  function internGo() { if (st.mode !== 'play' || g.over || g.chain) return; const o = P.options(g, true), ids = Object.keys(o).filter(id => o[id].r && o[id].r.hits > 0); if (!ids.length) return; const id = ids[Math.floor(P.rand() * ids.length)], k = kitObjs.find(q => q.id === 'intern'); callout('intern', RX.CARDS[id].verb.toLowerCase(), PENCIL); react(o[id], id, false, k ? { x: k.hx, z: k.hz + 2.6 } : { x: 17, z: -6 }, true); }
  function doWish() { if (st.mode !== 'play') return; const k = kitObjs.find(q => q.id === 'paw'), id = P.wish(g, run); if (id === null || !k) return; st.E = g.E; st.want = (g.bank + g.P * g.R) * g.E; st.motes.push({ txt: 'times 2', part: 'm', col: PART.e, a: { x: k.hx, z: k.hz + 2.6 }, t: performance.now() + 80, dur: 420 }); callout('wish', id ? 'no more ' + RX.CARDS[id].verb.toLowerCase() : '', PENCIL); buildKit(); kitObjs.forEach(q => { q.born = 0; }); dirty = true; }
  function doTwist() { const o = twistOpt(); if (!o) return; g.twisted = g.page; st.twC = null; st.chainN = 0; react(o, o.id, false, { x: C0.x, z: C0.z }, true); }
  // One reaction on the page, whether it was clicked or is a step of a chain that is running by itself
  function react(o, rid, fin, lab, free) {
    const s = { id: rid, fin };
    if (free && o.model.settle && !o.casc) o.model.settle(FOLDS[rid] ? 2200 : 160);
    if (o.casc && center && o.atoms && o.atoms.length >= 4) { const mk = a => marksOf(center, [a], 0.01, 0.2)[0]; st.pair = { a: mk(o.atoms[0]), b: mk(o.atoms[3]), t: performance.now(), ms: stepMs((g.casc || 0) + 1) }; }
    if (o.casc) st.cstep = { n: (g.casc || 0) + 1, name: KINDNAME[rid] || rid, t: performance.now(), fresh: !P.RULE.fresh || (g.casc || 0) + 1 > (g.cascBest || 0) };
    if (free && (!o.self || o.casc)) sfx.chain(st.chainN || 0);
    flush(); setHover(-1); st.mode = 'move';
    const prev = center, tok = st.tok, before = P.made(g), wasOpen = g.cur.path.length > 0, from = new Map();
    if (s.fin) P.synFinish(g, o); else P.synTake(g, o, free);
    // The molecule changes where it stands. Every atom that is still there moves from where it was to where it now
    // belongs, and atoms that are new grow in at the place the reagent reaches.
    const seed = new Map(), seedBead = new Map(); if (o.map) { o.map.forEach((na, oa) => { const p = prev.at.get(oa); if (p && prev.balls.has(oa)) seed.set(na, p); }); prev.beads.forEach(q => { const nr = o.map.get(q.root); if (nr) seedBead.set(nr, prev.at.get(q.pa)); }); }
    if (o.casc && prev.at.flip) seed.flip = prev.at.flip;
    if (prev.at.fold) seed.fold = { dir: prev.at.fold.dir };
    const nm = buildMol(g.m, null, false, seed.size ? seed : null, seedBead); place(nm, C0, st.sc);
    if (o.map) o.map.forEach((na, oa) => { const p = prev.at.get(oa); if (p && prev.balls.has(oa) && nm.balls.has(na)) from.set(na, p.clone()); });
    nm.beads.forEach(b => { const ob = prev.beads.find(q => o.map && o.map.get(q.root) === b.root); if (ob) from.set(b.pa, prev.at.get(ob.pa).clone()); });
    nm.marks = marksOf(nm, o.r.made || []);
    if (o.map) { const was = new Map(); prev.model.bonds.forEach(b => { const a2 = o.map.get(b.a), b2 = o.map.get(b.b); if (a2 && b2) { if (!was.has(a2)) was.set(a2, new Set()); was.get(a2).add(b2); } }); nm.sticks.forEach(q => { q.old = (was.has(q.a) && was.get(q.a).has(q.b)) || (was.has(q.b) && was.get(q.b).has(q.a)); }); nm.sticks.forEach(q => { if (!q.old) [q.a, q.b].forEach(a => { if (a.el === 'H') from.delete(a); }); }); }
    // group letters: one that is no longer there is struck through, one that is new is written when the reagent arrives
    { const old = prev.groups || [], now2 = groupsOf(nm), used = new Set(); now2.forEach(q => { let bi = -1, bd = 2.2; old.forEach((p, k) => { if (used.has(k) || p.txt !== q.txt) return; const d = Math.hypot(p.x - q.x, p.z - q.z); if (d < bd) { bd = d; bi = k; } }); if (bi >= 0) used.add(bi); else q.born = true; }); nm.groups = now2; nm.ghosts = old.filter((p, k) => !used.has(k)); }
    // What leaves the molecule: a small molecule of its own, set where it left from. It will fly to whatever
    // catches it, or to the beaker, the balloon or the tally.
    { const rev = new Map(); if (o.map) o.map.forEach((na, oa) => rev.set(na, oa));
      (o.r.gone || []).forEach((grp0, gi) => {
        flyer(grp0, gi, P.byKind(grp0), a => rev.get(a), prev, nm);
      }); }
    prods.forEach(m => { if (m) tween(m, { x: m.group.position.x, z: m.group.position.z }, 0.01, 0.14, () => freeMol(m)); }); prods = [];
    tweens = tweens.filter(tw => tw.m !== prev); freeMol(prev); center = nm; SC_MAIN = fitMain(nm);
    const L = land(o, before, wasOpen, nm, s.id, lab, from);
    if (morph && morph.m === nm && o.map) morph.bend = bendOf(prev, nm, o.map, from);
    st.zoomT = performance.now();
    // the next choice opens as soon as the places have changed. Equipment goes on firing while the player looks
    setTimeout(() => {
      if (tok !== st.tok || center !== nm) return;
      nm.hot = g.cur.path.length ? marksOf(nm, Array.from(g.cur.fresh), 0.01, 0.2) : [];
      if (g.over) { st.firing = false; return; }
      if (st.firing) return fireNext();
      // a page that is used up with a row of three or more on it waits for the player to set it off
      if (!g.chain && g.pageSteps >= P.stepsOf(g) && P.charged(g)) { st.mode = 'fuse'; st.fuseT = performance.now(); slots = []; prods.forEach(freeMol); prods = []; dirty = true; const tk = st.tok; setTimeout(() => { if (st.tok === tk && st.mode === 'fuse') setOff(); }, 280); return; }
      // a chain that has been set off takes the next reaction by itself
      { const wasChain = g.chain, c = P.chainNext(g); if (!c && wasChain && g.chain) { st.mode = 'play'; return refresh(); } if (!c && wasChain) { st.chainN = 0; st.mode = 'play'; return nextPage(); } if (c) { st.chainN = (st.chainN || 0) + 1; const k = g.kinds.indexOf(c.id); return react(c, c.id, false, LAB[k] ? { x: LAB[k].x - 0.8, z: LAB[k].z + 0.5 } : { x: 17, z: -6 }, true); } st.chainN = 0; }
      st.mode = 'play'; refresh();
      // a page with nothing left to do turns itself
      if (!slots.some(q => q && q.o) && !P.canRedraw(g) && !P.canBank(g)) { st.mode = 'move'; setTimeout(() => { if (tok !== st.tok) return; st.mode = 'play'; nextPage(); }, Math.max(300, L.dur - L.unlock + 120)); }
    }, L.unlock);
    if (g.over) setTimeout(() => { if (tok === st.tok) endRound(); }, L.dur + 120);
    dirty = true;
  }
  const next = () => { if (st.mode === 'shop') return newRun(); if (st.mode !== 'done') return; if (st.pass) { run.round++; showPicks(); } else if (meta.stage < 2) { meta.credit += run.beaten + (run.bonus || 0); saveMeta(); newRun(); } else showSuppliers(); };

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
    memgbr: ['C=O', 'OH', '+C'], wittig: ['C=O', 'C=C', '+C'], allyl: ['C=O', 'OH', '+3C'], aibn: ['C=C', 'chain'], wacker: ['C=C', 'C=O'], wolff: ['C=O', 'CH'],
    extend: ['C=O', 'C=O', '+C=O'], dione: ['C=O', 'C=O', '+2 C=O'], phenol: ['C=O', 'OH', '+ring'], couple: ['C=O', 'ring'], rcm: ['C=C', 'ring'] };
  const GCOL = { 'C=C': '#3a6fd0', OH: '#d6453a', 'C=O': '#e07a00', Cl: '#3c9a5f', CH: '#8d949c', chain: '#e23c6e' };
  function chip(x, txt, cx, cy, on) { hand(x, 34); const w = Math.max(74, x.measureText(txt).width + 26); x.fillStyle = on ? GCOL[txt] || INK : 'rgba(141,148,156,0.35)'; x.beginPath(); x.ellipse(cx, cy - 11, w / 2, 25, 0, 0, 6.3); x.fill(); x.fillStyle = '#fbf8ee'; x.textAlign = 'center'; x.fillText(txt, cx, cy); return w; }
  // a coin of credit, drawn in ink
  function coin(x, cx, cy, r) { x.fillStyle = '#e9b93a'; x.beginPath(); x.arc(cx, cy, r, 0, 6.3); x.fill(); x.strokeStyle = '#8a6a00'; x.lineWidth = 4; x.beginPath(); x.arc(cx, cy, r, 0, 6.3); x.stroke(); x.beginPath(); x.arc(cx, cy, r * 0.55, 0.4, 5.2); x.stroke(); }
  // A coin of the run, seen from the side so that coins stack, in copper: the credit kept between runs is the gold one.
  function rcoin(x, cx, cy, r, a) { x.globalAlpha = a == null ? 1 : a; x.fillStyle = '#d98a4a'; x.strokeStyle = '#7a4318'; x.lineWidth = Math.max(2.5, r * 0.2); x.beginPath(); x.ellipse(cx, cy, r, r * 0.5, 0, 0, 6.3); x.fill(); x.stroke(); x.globalAlpha = 1; }
  // the coins held: a stack, at most ten high, and how many
  function purse(x, cx, cy, n, r, plus) { if (n <= 0) { x.strokeStyle = FAINT; x.lineWidth = 3; x.beginPath(); x.ellipse(cx, cy, r, r * 0.5, 0, 0, 6.3); x.stroke(); } for (let k = 0; k < Math.min(10, n); k++) rcoin(x, cx + ((k * 7) % 3 - 1) * 1.5, cy - k * r * 0.46, r);
    marker(x, r * 2); x.textAlign = 'left'; x.fillStyle = '#7a4318'; x.fillText(String(n), cx + r + 14, cy + r * 0.6); if (plus) { const w = x.measureText(String(n)).width; marker(x, r * 1.5); x.fillStyle = GREEN; x.fillText('+' + plus, cx + r + 30 + w, cy + r * 0.6); } }
  // a drop: one use of a reagent
  function drop(x, cx, cy, r, col, full) { x.beginPath(); x.moveTo(cx, cy - r * 1.5); x.bezierCurveTo(cx + r * 0.3, cy - r * 0.7, cx + r, cy - r * 0.1, cx + r, cy + r * 0.35); x.arc(cx, cy + r * 0.35, r, 0, Math.PI); x.bezierCurveTo(cx - r, cy - r * 0.1, cx - r * 0.3, cy - r * 0.7, cx, cy - r * 1.5); x.closePath(); if (full) { x.fillStyle = col; x.fill(); } else { x.strokeStyle = col; x.lineWidth = 2.5; x.stroke(); } }
  // the bank: a tray with an arrow into it
  function tray(x, cx, cy, s, col, lw) { x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(cx - 34 * s, cy + 2 * s); x.lineTo(cx - 34 * s, cy + 24 * s); x.lineTo(cx + 34 * s, cy + 24 * s); x.lineTo(cx + 34 * s, cy + 2 * s); x.moveTo(cx, cy - 36 * s); x.lineTo(cx, cy + 6 * s); x.moveTo(cx - 13 * s, cy - 8 * s); x.lineTo(cx, cy + 6 * s); x.lineTo(cx + 13 * s, cy - 8 * s); x.stroke(); }
  function turnMark(x, cx, cy, r, col, lw) { x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.arc(cx, cy, r, 0.9, 5.6); x.stroke(); const a = 5.6, hx = cx + Math.cos(a) * r, hy = cy + Math.sin(a) * r; x.beginPath(); x.moveTo(hx - r * 0.6, hy - r * 0.2); x.lineTo(hx, hy); x.lineTo(hx - r * 0.12, hy + r * 0.64); x.stroke(); }
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
    const word = (b, i) => (b[1] === 'p' || /^\s*times/.test(bits[i + 1] || '') ? '' : /^\s*[+-]/.test(bits[i + 1] || '') ? 'mult' : 'times'), ws = bits.map((b, i) => (b[0] === '{' ? x.measureText(word(b, i)).width : x.measureText(b).width)), tot = ws.reduce((a, b) => a + b, 0);
    let px0 = align === 'right' ? cx - tot : align === 'left' ? cx : cx - tot / 2, cur = col; x.textAlign = 'left';
    bits.forEach((b, i) => { if (b[0] === '{') { cur = PART[b[1]]; const w = word(b, i); if (w) { x.fillStyle = cur; x.fillText(w, px0, y); } } else { x.fillStyle = cur || col; x.fillText(b, px0, y); } px0 += ws[i]; });
    return tot;
  }
  // a line struck through by hand: it wanders a little, and only the first k of its length is drawn while it is being struck
  // a flag on a pole, drawn by hand: the number to beat, and each mark past it
  function flag(x, cx, by, h, col, full) { x.strokeStyle = col; x.lineWidth = Math.max(4, h * 0.075); x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(cx + 1, by); x.lineTo(cx - 2, by - h); x.stroke(); x.beginPath(); x.moveTo(cx - 2, by - h); x.lineTo(cx + h * 0.56, by - h * 0.76); x.lineTo(cx - 1, by - h * 0.5); x.closePath(); x.fillStyle = full ? col : '#fbf8ee'; x.fill(); x.stroke(); }
  const TRK = { x0: EDGE + 0.4, x1: 4.6, z: 11.3 }, FORM = { x: EDGE + 0.3, z: 9.45 };
  function strike(x, x0, y0, x1, y1, k, lw, col) { k = Math.max(0, Math.min(1, k)); if (k <= 0) return; if (k < 1) dirty = true; x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); const n = 10; for (let i = 0; i <= n; i++) { const t = k * i / n, j = Math.sin(t * 7 + x0 * 0.03) * lw * 0.35; if (i) x.lineTo(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + j); else x.moveTo(x0, y0 + j); } x.stroke(); }
  const swipe = (x, a, b, w, col) => { x.strokeStyle = col || HILITE; x.lineWidth = w; x.lineCap = 'round'; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); };
  function ends(i) { const p = SPOT[i], dx = p.x - C0.x, dz = p.z + 3 - C0.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d; return { a: { x: p.x - ux * 3.2, z: p.z + 2.9 - uz * 2.6 }, b: { x: p.x - ux * 0.6, z: p.z + 2.9 } }; }
  function drawInk(now) {
    const x = ink.x; x.clearRect(0, 0, IW, IH); x.textBaseline = 'alphabetic';
    if (st.mode === 'shop') {
      const h = px({ x: 0, z: -13 }); marker(x, 100); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('suppliers', h[0], h[1]);
      { hand(x, 46); x.fillStyle = PENCIL; const ww = x.measureText('+' + shop.earned + '    ' + meta.credit).width; coin(x, h[0] - ww / 2 - 34, h[1] + 50, 18); x.fillText('+' + shop.earned + '    ' + meta.credit, h[0], h[1] + 64); }
      P.SUPPLY.forEach((sp, i) => { if (i > Math.min(meta.tier + 1, shopMax())) return;
        const c = px({ x: -20, z: -9.2 + i * 3.6 }), open = i <= meta.tier, nextUp = i === meta.tier + 1, can = nextUp && meta.credit >= sp.cost, hov = st.hover === i && nextUp;
        if (open) swipe(x, [c[0] - 6, c[1] + 14], [c[0] + x.measureText(sp.name).width * 1.5 + 60, c[1] + 10], 6, GREEN);
        marker(x, 50); x.textAlign = 'left'; x.fillStyle = open ? INK : nextUp ? INK : FAINT; x.fillText(sp.name, c[0], c[1]);
        hand(x, 40); x.fillStyle = open ? GREEN : can ? REDINK : PENCIL; if (!open && nextUp) { coin(x, c[0] + 540, c[1] - 20, 16); x.fillText(String(sp.cost), c[0] + 566, c[1] - 6); }
        hand(x, 38); x.fillStyle = open || nextUp ? PENCIL : FAINT;
        const things = (sp.kin || []).map(k => k + ' molecules').concat(sp.reagents.map(id => RX.CARDS[id].verb.toLowerCase())).concat(sp.gear.map(id => P.GEARS[id].name)).concat(sp.rare ? ['rare versions of reagents'] : []);
        if (nextUp) { hand(x, 30); wrap(x, (things.length ? things.join(',  ') : ''), 800).slice(0, 1).forEach((ln, j) => x.fillText(ln, c[0], c[1] + 40 + j * 30)); }
        if (hov) ring(x, [c[0] + 400, c[1] + 6], 470, 86, 5, INK, 0.01);
      });
      P.FAMILIES.forEach((f, i) => { if (meta.tier < 1) return;
        const c = px({ x: 8, z: -9.2 + i * 3.6 }), open = !!meta.fam[f.id], can = !open && meta.credit >= f.cost, hov = st.hover === 100 + i && !open;
        if (open) swipe(x, [c[0] - 6, c[1] + 14], [c[0] + 330, c[1] + 10], 6, GREEN);
        marker(x, 50); x.textAlign = 'left'; x.fillStyle = INK; x.fillText(f.name, c[0], c[1]);
        hand(x, 40); x.fillStyle = open ? GREEN : can ? REDINK : PENCIL; if (!open) { coin(x, c[0] + 370, c[1] - 20, 16); x.fillText(String(f.cost), c[0] + 396, c[1] - 6); }
        hand(x, 30); x.fillStyle = PENCIL; x.fillText(f.reagents.map(id => RX.CARDS[id].verb.toLowerCase()).join(',  '), c[0], c[1] + 40); f.reagents.forEach((id, k) => dots(x, id, c[0] + 380 + k * 70, c[1] + 32, 6));
        if (hov) ring(x, [c[0] + 250, c[1] + 6], 300, 86, 5, INK, 0.01);
      });
      { const found = Object.keys(meta.found).filter(k => meta.found[k]), c = px({ x: 8, z: 2.6 }); if (found.length) { marker(x, 50); x.textAlign = 'left'; x.fillStyle = INK; x.fillText('found', c[0], c[1]); hand(x, 30); x.fillStyle = PENCIL; x.fillText(found.map(id => RX.CARDS[id].verb.toLowerCase()).join(',  '), c[0], c[1] + 40); } }
      const n0 = px({ x: 0, z: 12.4 }); marker(x, 70); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('new run', n0[0], n0[1]);
      if (st.call && now - st.call.t < 1400) { const c = px(CALL); marker(x, 110); x.fillStyle = st.call.col; x.lineWidth = 14; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(st.call.text, c[0], c[1] + 500); x.fillText(st.call.text, c[0], c[1] + 500); }
      ink.t.needsUpdate = true; return;
    }
    if (st.mode === 'hom') {
      const h = px({ x: 0, z: -11 }); marker(x, 110); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('homunculus', h[0], h[1]);
      homOpts.forEach((k, i) => { const q = HOMPOS(i, homOpts.length), u = q.ts, c = px({ x: q.x, z: q.tz }), hov = st.hover === i, H = k ? P.HOMS[k] : null;
        if (u === 1) { hand(x, 40); x.textAlign = 'center'; x.fillStyle = PENCIL; x.fillText(String(i + 1), c[0] - 190, c[1] - 56); }
        marker(x, (hov ? 66 : 58) * u); x.textAlign = 'center'; x.fillStyle = k ? JARINK[k] : INK; x.fillText(k ? H.name : 'none', c[0], c[1]);
        if (H) { String(H.tok).split('|').forEach((ln, li) => inkLine(x, ln, c[0], c[1] + (52 + li * 40) * u, 38 * u, INK)); for (let n = 0; n < H.need; n++) drop(x, c[0] + (n - (H.need - 1) / 2) * 30 * u, c[1] + 150 * u, 10 * u, JARINK[k], true); }
        if (hov) swipe(x, [c[0] - 150 * u, c[1] + 16 * u], [c[0] + 150 * u, c[1] + 10 * u], 16 * u); });
      ink.t.needsUpdate = true; return;
    }
    if (st.mode === 'terms') {
      const h = px({ x: 0, z: -11 }); marker(x, 110); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('terms', h[0], h[1]);
      P.TERMS.forEach((t, i) => { const q = TERMP(i), c = px(q), open = sigOpen(t), hov = st.hover === i && open, r = hov ? 132 : 116;
        if (!open) { x.globalAlpha = 0.3; sigil(x, c, r, 'plain', PENCIL, 6); x.globalAlpha = 1; hand(x, 30); x.textAlign = 'center'; x.fillStyle = PENCIL; x.fillText(t.deed, c[0], c[1] + 132); return; }
        sigil(x, c, r, t.id, hov ? REDINK : INK, hov ? 12 : 9); marker(x, 52); x.textAlign = 'center'; x.fillStyle = hov ? REDINK : INK; x.fillText(t.name, c[0], c[1] + 132);
        hand(x, 27); x.fillStyle = PENCIL; wrap(x, t.note, 520).forEach((ln, j) => x.fillText(ln, c[0], c[1] + 166 + j * 30)); });
      ink.t.needsUpdate = true; return;
    }
    if (st.mode === 'brief') {
      const h = px({ x: 0, z: -11 }); marker(x, 110); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('round ' + run.round + (briefs.length && briefs[0].assay && (briefs.length === 1 || briefs[0].ease != null) ? '  assay' : ''), h[0], h[1]);
      briefs.forEach((b, i) => {
        const c = px({ x: BX(i), z: 3.2 }), B = P.BRIEF[b.brief], hov = st.hover === i;
        if (b.ease != null) {
          // one of two molecules: its family, the number to beat, and the coins the harder one pays on top
          { const K = P.KIN[b.kin], k1 = px({ x: BX(i), z: -8.6 }); if (K && meta.stage >= 2 && !b.assay) { marker(x, 58); x.textAlign = 'center'; x.fillStyle = K.col; x.fillText(K.name, k1[0], k1[1]); } }
          hand(x, 40); x.textAlign = 'center'; x.fillStyle = PENCIL; x.fillText(String(i + 1), c[0] - 240, c[1] + 70);
          const y = c[1] + 80; marker(x, hov ? 84 : 74); x.textAlign = 'center'; x.fillStyle = REDINK; x.fillText(fmt(b.quota), c[0] + 30, y); flag(x, c[0] + 30 - x.measureText(fmt(b.quota)).width / 2 - 62, y + 2, 92, REDINK, true);
          if (b.coins) { const w = (b.coins - 1) * 58; marker(x, 58); x.textAlign = 'right'; x.fillStyle = GREEN; x.fillText('+', c[0] - w / 2 - 36, y + 86); for (let n = 0; n < b.coins; n++) rcoin(x, c[0] - w / 2 + n * 58, y + 68, 25); }
          if (hov) swipe(x, [c[0] - 150, y + 24], [c[0] + 150, y + 19], 6, INK);
          return;
        }
        hand(x, 40); x.textAlign = 'center'; x.fillStyle = PENCIL; x.fillText(String(i + 1), c[0] - 205, c[1] - 6);
        { const K = P.KIN[b.kin], k1 = px({ x: BX(i), z: -8.3 }); if (K) { marker(x, 66); x.textAlign = 'center'; x.fillStyle = K.col; x.fillText(K.name, k1[0], k1[1]); inkLine(x, K.tok, k1[0], k1[1] + 44, 34, INK); } }
        fit(x, B.name, hov ? 76 : 68, 350, marker); x.textAlign = 'center'; x.fillStyle = INK; x.fillText(B.name, c[0], c[1]);
        if (B.note) inkLine(x, B.note, c[0], c[1] + 62, 40, INK);
        const y = c[1] + 150; marker(x, 62); x.textAlign = 'center'; x.fillStyle = REDINK; x.fillText(fmt(b.quota), c[0], y);
        for (let n = 0; n < (b.pays || 0); n++) coin(x, c[0] - ((b.pays - 1) * 26) + n * 52, y + 52, 20);
        if (hov) swipe(x, [c[0] - 150, c[1] + 16], [c[0] + 150, c[1] + 10], 6, INK);
      });
      if (P.RULE.choose && briefs.length && briefs[0].ease != null) {
        // an assay changes one rule for both: its name and rule stand once, between the two
        if (briefs[0].assay) { const B = P.BRIEF[briefs[0].brief], a0 = px({ x: 0, z: -8.9 }); marker(x, 56); x.textAlign = 'center'; x.fillStyle = INK; x.fillText(B.name, a0[0], a0[1]); if (B.note) inkLine(x, B.note, a0[0], a0[1] + 44, 32, INK); }
        if (P.RULE.coins && (meta.coined || (run.coins || 0) > 0)) { const c = px(PURSE); purse(x, c[0], c[1], run.coins || 0, 24); }
        if (pairOn()) { const c = px(PAIR), cost = P.pairCost(run), can = cost != null && (run.coins || 0) >= cost, hov = st.mark === 'pair', age = st.drawT ? (now - st.drawT) / 350 : 9; x.save(); x.translate(c[0], c[1]); if (age < 1) x.rotate(age * 6.283); turnMark(x, 0, 0, 30, can ? INK : FAINT, hov && can ? 11 : 7); x.restore(); for (let k = 0; k < (cost == null ? 3 : cost); k++) rcoin(x, c[0] + 66 + k * 38, c[1] + 2, 15, can ? 1 : 0.35); if (cost == null) { x.strokeStyle = PENCIL; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(c[0] - 40, c[1] + 26); x.lineTo(c[0] + 160, c[1] - 22); x.stroke(); } }
      }
      ink.t.needsUpdate = true; return;
    }
    if (st.mode === 'pick') {
      const h = px({ x: 0, z: -11 }); marker(x, 110); x.textAlign = 'center'; x.fillStyle = INK; x.fillText('take one', h[0], h[1]);
      picks.forEach((o, i) => {
        const c = px({ x: PICKX[i], z: 3.6 }), isGear = o.kind === 'gear' || o.kind === 'level', title = isGear ? P.GEARS[o.id].name : RX.CARDS[o.id].verb.toLowerCase() + (o.kind === 'reagent' && P.PAIR[o.id] ? ' + ' + RX.CARDS[P.PAIR[o.id]].verb.toLowerCase() : ''), hov = st.hover === i;
        const kind = o.kind === 'reagent' ? 'new' : o.kind === 'gear' ? 'equipment' : o.kind === 'level' ? 'level up' : o.kind === 'strong' ? 'stronger' : 'more';
        if (!isGear) { const t0 = px({ x: PICKX[i], z: -2 }); fit(x, title, 96, 440, marker); x.textAlign = 'center'; x.fillStyle = rgb(colOf(o.id)); x.fillText(title, t0[0], t0[1]); swipe(x, [t0[0] - 150, t0[1] + 22], [t0[0] + 150, t0[1] + 16], 20, rgb(colOf(o.id))); }
        hand(x, 40); x.fillStyle = PENCIL; x.fillText(String(i + 1), c[0] - 190, c[1] - 56); if (o.kind === 'reagent') { hand(x, 36); x.fillText('new', c[0], c[1] - 56); }
        if (isGear) { marker(x, hov ? 66 : 58); x.fillStyle = INK; x.fillText(title, c[0], c[1]); }
        if (isGear) inkLine(x, P.GEARS[o.id].tok || '', c[0], c[1] + 52, 40, INK); else { hand(x, 40); x.fillStyle = INK; x.textAlign = 'center'; x.fillText(P.pickText(run, o), c[0], c[1] + 52); }
        if (hov) ring(x, [c[0], c[1] - 10], 300, 150, 6, INK, 0.02);
      });
      if (P.RULE.coins) {
        { const c = px(PURSE); purse(x, c[0], c[1], run.coins || 0, 24); }
        // the three dealt again: a turning arrow, and beside it the coins it costs
        { const c = px(REROLL), cost = P.rerollCost(run), can = (run.coins || 0) >= cost, hov = st.mark === 'reroll', age = st.drawT ? (now - st.drawT) / 350 : 9; x.save(); x.translate(c[0], c[1]); if (age < 1) x.rotate(age * 6.283); turnMark(x, 0, 0, 30, can ? INK : FAINT, hov && can ? 11 : 7); x.restore(); for (let k = 0; k < cost; k++) rcoin(x, c[0] + 66 + k * 38, c[1] + 2, 15, can ? 1 : 0.4); }
        // all three left: an arrow past three dots, and the coin it pays
        { const c = px(SKIP), hov = st.mark === 'skip'; x.fillStyle = PENCIL; for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(c[0] - 34 + k * 26, c[1] + 12, 5, 0, 6.3); x.fill(); } x.strokeStyle = INK; x.lineWidth = hov ? 10 : 7; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(c[0] - 46, c[1] - 6); x.quadraticCurveTo(c[0] - 8, c[1] - 40, c[0] + 34, c[1] - 6); x.moveTo(c[0] + 14, c[1] - 22); x.lineTo(c[0] + 36, c[1] - 4); x.lineTo(c[0] + 38, c[1] - 30); x.stroke();
          marker(x, 34); x.textAlign = 'left'; x.fillStyle = GREEN; x.fillText('+', c[0] + 58, c[1] + 10); rcoin(x, c[0] + 100, c[1] + 2, 15); }
        // what is held stands at the top. One of them can go in the bin for two coins
        if (run.gear.length) { const n = run.gear.length, b = px({ x: HELD(n).x - 0.4, z: HELD(0).z + 0.2 }), can = (run.coins || 0) >= P.COIN.bin, col = can ? INK : FAINT, hi = /^bin/.test(st.mark || '') ? +st.mark.slice(3) : -1;
          x.strokeStyle = col; x.lineWidth = 5; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(b[0] - 24, b[1] - 40); x.lineTo(b[0] - 17, b[1] + 6); x.lineTo(b[0] + 17, b[1] + 6); x.lineTo(b[0] + 24, b[1] - 40); x.moveTo(b[0] - 30, b[1] - 40); x.lineTo(b[0] + 30, b[1] - 41); x.moveTo(b[0] - 8, b[1] - 30); x.lineTo(b[0] - 6, b[1] - 4); x.moveTo(b[0] + 8, b[1] - 30); x.lineTo(b[0] + 6, b[1] - 4); x.stroke();
          for (let k = 0; k < P.COIN.bin; k++) rcoin(x, b[0] - 15 + k * 30, b[1] + 30, 12, can ? 1 : 0.4);
          if (hi >= 0 && run.gear[hi]) { const q = px({ x: HELD(hi).x, z: HELD(hi).z - 0.7 }); x.strokeStyle = can ? REDINK : FAINT; x.lineWidth = 8; x.beginPath(); x.moveTo(q[0] - 34, q[1] - 34); x.lineTo(q[0] + 34, q[1] + 30); x.moveTo(q[0] + 34, q[1] - 34); x.lineTo(q[0] - 34, q[1] + 30); x.stroke(); hand(x, 28); x.textAlign = 'center'; x.fillStyle = PENCIL; const q2 = px({ x: HELD(hi).x, z: HELD(hi).z + 2.2 }); x.fillText(P.GEARS[run.gear[hi]].name, q2[0], q2[1]); } }
      }
      ink.t.needsUpdate = true; return;
    }
    const play = st.mode === 'play', lineUp = lining(), open = (lineUp && st.view ? st.view.row : g.cur.path.length) > 0;
    { const occ = st.gear.filter(id => P.GEARS[id].kin === 'occult').length; x.strokeStyle = 'rgba(70,30,90,0.42)'; x.lineWidth = 3; x.lineCap = 'round';
      for (let k = 0; k < occ * 5; k++) { const dp = px({ x: -26 + 3.4 * hash('dx' + k), z: -12.5 + 6 * hash('dy' + k) }), cx = dp[0], cy = dp[1], r = 13 + 12 * hash('dr' + k), kind = k % 3;
        x.beginPath();
        if (kind === 0) { for (let q = 0; q <= 5; q++) { const a = -1.571 + q * 2.513; if (q) x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); else x.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } }
        else if (kind === 1) { x.ellipse(cx, cy, r, r * 0.5, 0, 0, 7); x.moveTo(cx + r * 0.25, cy); x.arc(cx, cy, r * 0.25, 0, 7); }
        else { for (let q = 0; q < 4; q++) { x.moveTo(cx - r + q * r * 0.5, cy - r * 0.6); x.lineTo(cx - r + q * r * 0.5, cy + r * 0.6); } x.moveTo(cx - r * 1.2, cy + r * 0.5); x.lineTo(cx + r * 0.9, cy - r * 0.5); }
        x.stroke(); } }
    // the transmutation circle lies on the page under the molecule: the run's sigil, and a rune for every reaction in the row
    if (g && g.ring && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse')) { const c = px(C0), R0 = 196, fl = st.ringT ? Math.max(0, 1 - (now - st.ringT) / 800) : 0, GOLD = '#b88a00', n = g.ring, lit = fl > 0 ? n : (g.lit || 0), up = -Math.PI / 2;
      x.globalAlpha = 0.62 + 0.38 * fl; sigil(x, c, R0, run.term || 'plain', fl ? GOLD : PENCIL, 7 + 6 * fl, 1); x.globalAlpha = 1;
      // the lit part of the circle is one gold arc from the top, so how far it has come is read at a glance
      if (lit > 0) { x.strokeStyle = GOLD; x.lineWidth = 13; x.lineCap = 'round'; x.beginPath(); x.arc(c[0], c[1], R0 * 1.17, up, up + (lit - 0.5) / n * 2 * Math.PI + (lit >= n ? Math.PI / n : 0)); x.stroke(); }
      for (let k = 0; k < n; k++) { const a = up + k * 2 * Math.PI / n, q0 = c[0] + Math.cos(a) * R0 * 1.17, q1 = c[1] + Math.sin(a) * R0 * 1.17, on = k < lit, sz = on ? 20 : 15;
        x.fillStyle = '#fbf8ee'; x.strokeStyle = on ? GOLD : PENCIL; x.lineWidth = on ? 8 : 5.5; x.lineCap = 'round'; x.lineJoin = 'round'; x.globalAlpha = on ? 1 : 0.85; x.beginPath();
        if (k % 4 === 0) { x.moveTo(q0, q1 - sz); x.lineTo(q0 + sz, q1 + sz * 0.8); x.lineTo(q0 - sz, q1 + sz * 0.8); x.closePath(); }
        else if (k % 4 === 1) x.arc(q0, q1, sz * 0.85, 0, 6.3);
        else if (k % 4 === 2) { x.moveTo(q0, q1 - sz); x.lineTo(q0 + sz, q1); x.lineTo(q0, q1 + sz); x.lineTo(q0 - sz, q1); x.closePath(); }
        else { x.rect(q0 - sz * 0.8, q1 - sz * 0.8, sz * 1.6, sz * 1.6); }
        x.fill(); if (on) { x.fillStyle = GOLD; x.fill(); } x.stroke(); x.globalAlpha = 1; }
      // what a full circle gives, written at its foot
      hand(x, 30); x.textAlign = 'right'; x.fillStyle = lit >= n - 1 ? GOLD : PENCIL; x.fillText('times ' + g.ringMul, c[0] - R0 * 1.17 - 34, c[1] + 10);
      if (fl > 0) dirty = true; }
    st.stains.forEach(k => { const c = px(k); if (k.ring) { x.strokeStyle = 'rgba(120,70,20,' + (k.a * 1.6) + ')'; x.lineWidth = k.r * 0.16; x.beginPath(); x.ellipse(c[0], c[1], k.r, k.r * 0.9, 0.3, 0, 7); x.stroke(); } else { x.fillStyle = 'rgba(150,80,20,' + k.a + ')'; x.beginPath(); x.ellipse(c[0], c[1], k.r, k.r * 0.8, 0.5, 0, 7); x.fill(); } });
    // ink thrown off by the last reaction
    if (false && g && st.shown >= st.quota && st.quota > 0) { const ov = Math.log2(Math.max(1, st.shown / st.quota)), c = px({ x: FLASK.x, z: FLASK.z + 0.9 }), r = Math.min(140, 46 + 20 * ov); x.globalAlpha = 0.3; x.fillStyle = flask.hex; x.beginPath(); x.ellipse(c[0], c[1], r * 1.25, r * 0.6, 0.05, 0, 6.3); x.fill(); x.beginPath(); x.ellipse(c[0] + r * 0.9, c[1] + r * 0.2, r * 0.45, r * 0.25, 0.4, 0, 6.3); x.fill(); x.beginPath(); x.ellipse(c[0] - r, c[1] - r * 0.1, r * 0.35, r * 0.2, -0.3, 0, 6.3); x.fill(); x.globalAlpha = 1; }
    st.slashes = st.slashes.filter(q => now - q.t < 520); st.slashes.forEach(q => { const k = (now - q.t) / 520, head = Math.min(1, k * 4), tail = Math.max(0, k * 2.2 - 1), a = px({ x: q.x - q.dx / 2, z: q.z - q.dz / 2 }), b = px({ x: q.x + q.dx / 2, z: q.z + q.dz / 2 }); x.globalAlpha = 0.45 * (1 - k * k); flick(x, a, b, tail, head, q.w * 1.3, q.col, (hash(String(Math.round(q.t + q.x * 97))) - 0.5) * 0.35); x.globalAlpha = 1; });
    st.blots = st.blots.filter(b => now - b.t < 700); st.blots.forEach(b => { const k = (now - b.t) / 700, c = px(b); x.globalAlpha = (0.55 + 0.4 * st.fury) * (1 - k); if (b.line) { const c2 = px({ x: b.x + (b.x2 - b.x) * 0.55, z: b.z + (b.z2 - b.z) * 0.55 }), head = Math.min(1, k * 5), tail = Math.max(0, k * 2.4 - 0.6); flick(x, c, c2, Math.min(tail, head), head, b.r * 1.8, b.col, 0); } else { x.fillStyle = b.col; x.beginPath(); x.arc(c[0], c[1], b.r * (0.6 + k), 0, 7); x.fill(); } }); x.globalAlpha = 1;
    // circled in ink on the page: what each product changed, and on the middle molecule where the reagent under the pointer acts
    const circle = (m, k, col, lw) => { const sc = m.group.scale.x, c = px({ x: m.group.position.x + k.x * sc, z: m.group.position.z + k.z * sc }), r = k.r * sc * U; x.strokeStyle = col; x.lineWidth = lw; x.lineCap = 'round'; x.beginPath(); x.ellipse(c[0], c[1], r * 1.05, r, 0.1, 0.25, 6.7); x.stroke(); };
    // the atoms the last reaction changed stay marked in yellow while the row is open: react there and the row goes on
    if (false && center && center.hot.length && g.cur.path.length && st.mode !== 'done' && !(CUT.includes('a') && st.peek)) { const pk = st.peek, sc = center.group.scale.x;
      center.hot.forEach(k => { const c = px({ x: C0.x + k.x * sc, z: C0.z + k.z * sc + 1.25 }); swipe(x, [c[0] - 30, c[1] + 12], [c[0] + 30, c[1] + 8], 12, pk && pk.breaks ? 'rgba(160,160,160,0.4)' : HILITE); }); }
    if (center && st.mode !== 'done') { if (!center.frost) center.frost = frostOf(center.model); if (center.frost.length) { const sc = center.group.scale.x, gp = a => { const p = center.at.get(a), t = -p.y / camDir.y; return px({ x: C0.x + (p.x + camDir.x * t) * sc, z: C0.z + (p.z + camDir.z * t) * sc }); };
      center.frost.forEach(ring => { if (ring.some(a => !center.at.get(a))) return; const pts = ring.map(gp); let cx = 0, cy = 0; pts.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= pts.length; cy /= pts.length; x.fillStyle = 'rgba(126,190,226,0.42)'; x.strokeStyle = 'rgba(79,159,196,0.8)'; x.lineWidth = 4; x.lineJoin = 'round'; x.beginPath(); pts.forEach((p, k) => { const X = cx + (p[0] - cx) * 1.22, Y = cy + (p[1] - cy) * 1.22; if (k) x.lineTo(X, Y); else x.moveTo(X, Y); }); x.closePath(); x.fill(); x.stroke(); }); } }
    if (false && center && center.flat && !(morph && morph.m === center)) { const sc = center.group.scale.x, gp = a => { const p = center.at.get(a), t = -p.y / camDir.y; return px({ x: C0.x + (p.x + camDir.x * t) * sc, z: C0.z + (p.z + camDir.z * t) * sc }); }; x.strokeStyle = 'rgba(43,38,34,0.55)'; x.lineCap = 'round'; center.sticks.forEach(s => { if (s.a.el === 'H' || s.b.el === 'H') return; const a = gp(s.a), b = gp(s.b); x.lineWidth = s.parts.length > 2 ? 11 : 6; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); }); }
    // a page turning: a leaf of paper sweeps across from the right, its edge shaded
    if (st.turned && now - st.turned < 420) { const k = (now - st.turned) / 420, e = 1 - Math.pow(1 - k, 3), xe = IW * (1 - e), w = IW * 0.22 * Math.sin(k * Math.PI); x.fillStyle = 'rgba(243,237,220,' + (0.9 * (1 - k)).toFixed(3) + ')'; x.fillRect(xe, 0, IW - xe, IH); const gr = x.createLinearGradient(xe - w, 0, xe, 0); gr.addColorStop(0, 'rgba(60,50,30,0)'); gr.addColorStop(1, 'rgba(60,50,30,' + (0.28 * (1 - k)).toFixed(3) + ')'); x.fillStyle = gr; x.fillRect(xe - w, 0, w, IH); dirty = true; }
    // each group is lettered on the page under it. One that has gone is struck through, one that is new is written in
    if (center && center.groups && st.mode !== 'done' && !CUT.includes('b')) { const sc = center.group.scale.x, at2 = q => px({ x: C0.x + q.x * sc, z: C0.z + q.z * sc + 1.25 });
      center.groups.forEach(q => { const age = q.born ? (now - q.t) / 1000 : 9; if (q.born && !(age >= 0)) return; const c = at2(q); if (MOLV === 'pads') { const c0 = px({ x: C0.x + q.x * sc, z: C0.z + q.z * sc }); x.fillStyle = 'rgba(' + PADC[q.txt] + ',0.3)'; x.beginPath(); x.ellipse(c0[0], c0[1], 30 * sc, 22 * sc, 0.1, 0, 6.3); x.fill(); } const pop = age < 0.25 ? 1.7 - 2.8 * age : 1; hand(x, 40 * pop); x.textAlign = 'center'; x.lineJoin = 'round'; x.lineWidth = 8; x.strokeStyle = '#fbf8ee'; x.strokeText(q.txt, c[0], c[1]); x.fillStyle = age < 1.2 ? REDINK : INK; x.fillText(q.txt, c[0], c[1]); if (age < 1.2) dirty = true; });
      (center.ghosts || []).forEach(q => { const age = (now - q.t) / 1000, c = at2(q); if (age > 1.3) return; hand(x, 40); x.textAlign = 'center'; x.globalAlpha = age < 0 ? 1 : Math.max(0, 1 - age / 1.3); x.fillStyle = age < 0 ? INK : PENCIL; x.fillText(q.txt, c[0], c[1]); if (age >= 0) { const w = x.measureText(q.txt).width / 2 + 8, k = Math.min(1, age / 0.12); x.strokeStyle = REDINK; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(c[0] - w, c[1] - 6); x.lineTo(c[0] - w + 2 * w * k, c[1] - 14); x.stroke(); } x.globalAlpha = 1; dirty = true; }); }
    if (st.mode !== 'done') {
      const t0 = px(TALLY), n = 0, sa = 9; x.strokeStyle = INK; x.lineCap = 'round';
      const full = sa < 0.9, shown = full ? 4 : n; for (let k = 0; k < Math.min(4, shown); k++) { x.lineWidth = 6; x.beginPath(); x.moveTo(t0[0] + k * 20 + 3 * hash('ta' + k), t0[1]); x.lineTo(t0[0] + k * 20 - 4, t0[1] - 58 * (k === shown - 1 && !full ? 1 - 0.5 * st.byBump.gauge * 0 : 1)); x.stroke(); }
      if (full) { const k2 = Math.min(1, sa / 0.14); x.globalAlpha = sa > 0.6 ? 1 - (sa - 0.6) / 0.3 : 1; x.strokeStyle = REDINK; x.lineWidth = 8; x.beginPath(); x.moveTo(t0[0] - 16, t0[1] - 8); x.lineTo(t0[0] - 16 + 100 * k2, t0[1] - 8 - 42 * k2); x.stroke(); x.globalAlpha = 1; dirty = true; } }
    // pointing at a reaction rings the places it will change, in its color
    // pointing at a reaction underlines the groups it will change, in its color (no discs: circles on the molecule are a rejected look)
    if (st.peek && center) { const sc = center.group.scale.x, ol = st.peek.outline; x.strokeStyle = st.peek.col; x.lineWidth = 8; x.lineCap = 'round'; x.setLineDash(ol ? [12, 11] : []); x.globalAlpha = 0.85; st.peek.marks.forEach(k => { const c = px({ x: C0.x + k.x * sc, z: C0.z + k.z * sc + 1.25 }); x.beginPath(); x.moveTo(c[0] - 34, c[1] + 16); x.lineTo(c[0] + 34, c[1] + 13); x.stroke(); }); x.setLineDash([]); x.globalAlpha = 1; }
    // a step of a cascade: for the instant before two parts join, a thin dashed pencil arc bows out from the OH to the C=O
    // with a small arrowhead. It is gone before the ring starts to close, and it is not drawn like a bond
    if (st.pair && st.pair.a && st.pair.b && center && now - st.pair.t < st.pair.ms * 0.3) { const sc = center.group.scale.x, k = (now - st.pair.t) / (st.pair.ms * 0.3), A = px({ x: C0.x + st.pair.a.x * sc, z: C0.z + st.pair.a.z * sc }), B = px({ x: C0.x + st.pair.b.x * sc, z: C0.z + st.pair.b.z * sc }), C = px(C0), r = 0.7 * sc * U;
      let dx = B[0] - A[0], dy = B[1] - A[1]; const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len; let nx = -dy, ny = dx; if (ny > 0) { nx = -nx; ny = -ny; } const bow = Math.max(70, len * 0.45) + r, a0 = [A[0] + nx * r, A[1] + ny * r], b0 = [B[0] + nx * r, B[1] + ny * r], cx = (A[0] + B[0]) / 2 + nx * bow * 1.6, cy = (A[1] + B[1]) / 2 + ny * bow * 1.6, e = Math.min(1, k / 0.5);
      x.strokeStyle = PENCIL; x.lineWidth = 4; x.lineCap = 'round'; x.lineJoin = 'round'; x.setLineDash([9, 9]); x.beginPath(); let lx = a0[0], ly = a0[1], qx = lx, qy = ly; x.moveTo(lx, ly); for (let i = 1; i <= 14; i++) { const t = e * i / 14, u = 1 - t; qx = lx; qy = ly; lx = u * u * a0[0] + 2 * u * t * cx + t * t * b0[0]; ly = u * u * a0[1] + 2 * u * t * cy + t * t * b0[1]; x.lineTo(lx, ly); } x.stroke(); x.setLineDash([]);
      if (e >= 1) { const an = Math.atan2(ly - qy, lx - qx); x.beginPath(); x.moveTo(lx - Math.cos(an - 0.5) * 20, ly - Math.sin(an - 0.5) * 20); x.lineTo(lx, ly); x.lineTo(lx - Math.cos(an + 0.5) * 20, ly - Math.sin(an + 0.5) * 20); x.stroke(); } dirty = true; }
    // a piece picked up: a short ink tick under each place it can go. The place under the pointer shows what would happen in
    // lines and letters only: what goes is drawn over heavy in red, what comes is a ghost of bonds, a new group is its word
    if (st.tool && st.toolList && center && lining()) { const sc = center.group.scale.x, P2 = q => px({ x: C0.x + q.x * sc, z: C0.z + q.z * sc }), r = 1.0 * sc * U, seg = (a, b) => { x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); };
      x.strokeStyle = INK; x.lineCap = 'round'; x.lineWidth = 6; x.globalAlpha = 0.85; st.toolList.forEach(q => { if (q.whole || q === st.toolSpot) return; const c = P2(q), dead = q.worth === 0; x.strokeStyle = dead ? PENCIL : INK; x.globalAlpha = dead ? 0.45 : 0.85; seg([c[0] - 1, c[1] + r * 0.8], [c[0] + 2, c[1] + r * 0.8 + 22]); if (q.worth != null) { hand(x, 24); x.textAlign = 'center'; x.fillStyle = dead ? PENCIL : INK; x.fillText(String(q.worth), c[0] + 1, c[1] + r * 0.8 + 46); } }); x.strokeStyle = INK; x.globalAlpha = 0.85;
      const h = st.toolList.length === 1 && st.toolList[0].whole ? st.toolList[0] : st.toolSpot;
      if (h) { if (h.goneB) { x.globalAlpha = 0.6; x.strokeStyle = REDINK; x.lineWidth = Math.max(10, 0.3 * sc * U); h.goneB.forEach(b => seg(P2(b[0]), P2(b[1]))); }
        if (h.ghost) { x.globalAlpha = 0.45; x.strokeStyle = INK; x.lineWidth = Math.max(4, 0.16 * sc * U); x.setLineDash([10, 9]); const gs = h.ghost.sc, G2 = q => px({ x: C0.x + q.x * gs, z: C0.z + q.z * gs }); x.lineWidth = Math.max(4, 0.16 * gs * U); if (h.ghost.join) seg(G2(h.ghost.join[0]), G2(h.ghost.join[1])); x.setLineDash([]); h.ghost.bonds.forEach(b => seg(G2(b[0]), G2(b[1]))); hand(x, Math.max(22, 0.55 * gs * U)); x.textAlign = 'center'; x.fillStyle = REDINK; x.globalAlpha = 0.6; h.ghost.os.forEach(q => { const c = G2(q); x.fillText('O', c[0], c[1] + 9); }); }
        else if (h.words || st.tool === 'burette') { /* the word of what each part becomes is written over it, below */ }
        else if (st.tool === 'mortar') { x.globalAlpha = 0.85; x.strokeStyle = REDINK; x.lineWidth = Math.max(9, 0.3 * sc * U); seg(P2(h.at[0]), P2(h.at[1] || h.at[0])); }
        else if (st.tool === 'bunsen') { x.globalAlpha = 0.9; x.strokeStyle = REDINK; x.lineWidth = 6; h.at.forEach(q => { const c = P2(q); seg([c[0] - r * 0.7, c[1] + r * 0.45], [c[0] + r * 0.7, c[1] - r * 0.45]); }); }
        else if (st.tool === 'crystal') { x.globalAlpha = 0.9; x.strokeStyle = h.worth === 0 ? PENCIL : '#2f78a0'; x.lineWidth = 7; h.at.forEach(q => { const c = P2(q); seg([c[0], c[1] - r * 0.25], [c[0] + 2, c[1] - r * 0.95]); }); }
        else if (!h.goneB) { x.globalAlpha = 0.9; x.strokeStyle = '#2f78a0'; x.lineWidth = 7; h.at.forEach(q => { const c = P2(q); seg([c[0] - r * 0.6, c[1] + r * 0.7], [c[0] + r * 0.6, c[1] + r * 0.66]); }); }
        const word = st.tool === 'crystal' ? 'OH' : st.tool === 'bunsen' ? 'C=C' : st.tool === 'burette' ? 'C=O' : ''; if (word || h.words) { hand(x, 30); x.textAlign = 'center'; x.globalAlpha = 0.9; x.fillStyle = h.worth === 0 ? PENCIL : '#2f78a0'; h.at.forEach((q, i) => { const c = P2(q); x.fillText(h.words ? h.words[i] || '' : word, c[0], c[1] - r - 8); }); }
        // what the place under the pointer is worth, before the click: the steps it would zip. A place that starts nothing says 0 and is struck through in pencil
        if (h.worth != null && !h.whole) { const c = P2(h), y = c[1] + r * 0.8 + 62; marker(x, 44); x.textAlign = 'center'; x.globalAlpha = 1; x.lineJoin = 'round'; x.lineWidth = 9; x.strokeStyle = '#fbf8ee'; x.strokeText(String(h.worth), c[0], y); x.fillStyle = h.worth === 0 ? PENCIL : INK; x.fillText(String(h.worth), c[0], y); if (h.worth === 0 && st.tool === 'crystal') { x.strokeStyle = PENCIL; x.lineWidth = 5; h.at.forEach(q => { const c2 = P2(q); seg([c2[0] - 26, c2[1] - r - 12], [c2[0] + 26, c2[1] - r - 24]); }); } } }
      x.globalAlpha = 1; }
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
      if (o && !SIDE) { arrow(x, e.a, e.b, hov ? 9 : 6, col, o.loop ? [14, 12] : null); }
      if (o && SIDE && o.cont && open) { x.strokeStyle = PART.r; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(m[0] - 44, m[1] + 44); x.lineTo(m[0] + 36, m[1] + 42); x.stroke(); }
      x.save(); x.translate(m[0], m[1]);
      { const tl = TILE[s.id] || ['', ''], on = !!o;
        hand(x, 30); x.textAlign = 'right'; x.fillStyle = 'rgba(90,86,78,0.7)'; x.fillText(s.fin ? 'F' : String(i + 1), -128, -2);
        chip(x, tl[0], -72, 0, on); x.strokeStyle = on ? INK : FAINT; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(-22, -12); x.lineTo(8, -12); x.lineTo(-2, -22); x.moveTo(8, -12); x.lineTo(-2, -2); x.stroke(); chip(x, tl[1], 62, 0, on);
        if (tl[2]) { hand(x, 30); x.textAlign = 'left'; x.fillStyle = on ? '#8a5a2b' : FAINT; x.fillText(tl[2], 108, -2); }
        hand(x, 26); x.textAlign = 'center'; x.fillStyle = on ? (hov ? INK : PENCIL) : FAINT; x.fillText(verb, -4, 34);
        if (o && g && st.mode === 'play' && !P.RULE.queue) { const key = g.page + ':' + g.trail.length; if (s.gk !== key) { s.gk = key; try { s.gv = P.peek(g, o).gain; } catch (e) { s.gv = null; } } if (s.gv != null) { marker(x, o.cont ? 40 : 32); x.textAlign = 'right'; x.fillStyle = o.cont ? INK : PENCIL; x.fillText('+' + fmt(s.gv), -186, 6); if (g.ring && !(g.ringSet || []).includes(o.id)) { const w0 = x.measureText('+' + fmt(s.gv)).width; x.strokeStyle = '#b88a00'; x.lineWidth = 5; x.lineJoin = 'round'; x.beginPath(); x.moveTo(-186 - w0 - 26, -18); x.lineTo(-186 - w0 - 12, 6); x.lineTo(-186 - w0 - 40, 6); x.closePath(); x.stroke(); } } }
        // uses left: one drop each, on the reagent's own chip. One placed in a circle is an empty drop
        if (!s.fin) { const qd = P.queued(g, s.id), nL = Math.min(6, Math.max(0, (g.left[s.id] || 0) - qd)); x.globalAlpha = on ? 1 : 0.5;
          if (g.free && g.free[s.id]) { x.strokeStyle = INK; x.lineWidth = 4; x.beginPath(); x.ellipse(-120, 30, 9, 6.5, 0, 0, 6.3); x.moveTo(-93, 30); x.ellipse(-102, 30, 9, 6.5, 0, 0, 6.3); x.stroke(); }
          else { for (let k = 0; k < nL; k++) drop(x, -124 + k * 17, 30, 7.5, INK, true); for (let k = 0; k < Math.min(3, qd); k++) drop(x, -124 + (nL + k) * 17, 30, 7.5, INK, false); }
          x.globalAlpha = 1; }
        if (hov && o) { x.strokeStyle = INK; x.lineWidth = 5; x.beginPath(); x.moveTo(-120, 46); x.lineTo(112, 44); x.stroke(); } }
      x.restore();
    });
    // the three numbers that multiply into what is made: places, row and extra. Each jumps when it changes
    if (st.mode !== 'done') {
      const mp = px(FEWER ? { x: MULT.x + 0.6, z: MADE.z + 2.9 } : FORM), len = g.cur.path.length; x.save(); if (FEWER) { x.translate(mp[0], mp[1]); x.scale(0.6, 0.6); x.translate(-mp[0], -mp[1]); }
      { const mult = st.R * st.E, liveP = st.P > 0, liveM = mult > 1.0001, kp = 1 + 0.25 * st.bump.p, km = 1 + 0.25 * Math.max(st.bump.r, st.bump.e), tP = fmt(st.P), tM = fmtB(mult); x.textAlign = 'left';
        // the two numbers that multiply into the total, written small under it in the page's hand
        hand(x, 46); const wP = x.measureText(tP).width; hand(x, 32); const wT = x.measureText('times').width; hand(x, 46); const wM = x.measureText(tM).width, x2 = mp[0] + wP + 22, x3 = x2 + wT + 22, c1 = mp[0] + wP / 2, c3 = x3 + wM / 2; st.fW = x3 + wM - mp[0];
        hand(x, 46 * kp); x.fillStyle = liveP ? PART.p : FAINT; x.fillText(tP, mp[0], mp[1]); hand(x, 32); x.fillStyle = liveP ? PENCIL : FAINT; x.fillText('times', x2, mp[1] - 3); hand(x, 46 * km); x.fillStyle = liveM ? PART.r : FAINT; x.fillText(tM, x3, mp[1]);
        // what the reaction under the pointer would add to each, and what it would make
        if (st.peek && !st.peek.quiet) { const pk = st.peek, dM = (st.R + pk.dR) * (st.E + pk.dE) - mult; marker(x, 34); x.textAlign = 'center';
          if (Math.abs(pk.dP) >= 0.5) { x.fillStyle = PART.p; x.fillText((pk.dP > 0 ? '+' : '') + fmt(pk.dP), c1, mp[1] - 70); }
          if (Math.abs(dM) >= 0.005) { x.fillStyle = dM < 0 ? PENCIL : PART.r; x.fillText((dM > 0 ? '+' : '') + fmtB(dM), c3, mp[1] - 70); }
          const gq = px(MADE); marker(x, 46); x.textAlign = 'left'; x.fillStyle = '#8a6a00'; x.fillText('+' + fmt(pk.gain), gq[0] + 6, gq[1] - 104); } }
      // one small chevron for each reaction in the row that is open
      x.restore();
    }
    // equipment: a short token beside it. Its name and what it does are written out only under the pointer
    kitObjs.forEach((k, i) => {
      if (now - (k.born || 0) < 380) { dirty = true; return; }
      const q = P.GEARS[k.id], kp = KITP(i), sideK = KITV === 'side', c = px(sideK ? { x: kp.x + 2.3, z: kp.z + 0.9 } : { x: kp.x, z: kp.z + (KITV === 'back' ? 2.9 : 3.6) }), f = st.fired[k.id], age = f ? (now - f.t) / 1000 : 9, lv = run.lv[k.id] || 1;
      const tokNow = k.id === 'paw' ? (3 - (run.wishes || 0)) + ' wishes' : k.id === 'orb' && g && g.fore ? (g.fore.filter(id => !g.kinds.includes(id)).map(id => '+' + RX.CARDS[id].verb.toLowerCase()).concat(g.kinds.filter(id => !g.fore.includes(id)).map(id => '-' + RX.CARDS[id].verb.toLowerCase())).slice(0, 3).join(' ') || 'same') : q.tok || '';
      const spent = q.tool && g && ((g.tools || {})[k.id] || 0) >= P.TOOLUSES, tl2 = String(tokNow).split('|'); let tw = 0; tl2.forEach((ln, li) => { tw = Math.max(tw, inkLine(x, ln, c[0], c[1] + li * 27, sideK ? 28 : 26, spent ? FAINT : INK, sideK ? 'left' : undefined)); }); if (st.tool === k.id) { x.strokeStyle = INK; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(c[0] - 62, c[1] + 36); x.lineTo(c[0] + 62, c[1] + 33); x.stroke(); } fit(x, q.name, sideK ? 26 : 28, 148, hand); x.textAlign = sideK ? 'left' : 'center'; x.fillStyle = PENCIL; x.fillText(q.name, c[0], c[1] - (sideK ? 34 : 40));
      for (let n = 1; n < lv; n++) { x.fillStyle = INK; x.beginPath(); x.arc(c[0] + tw / 2 + 18 + (n - 1) * 20, c[1] - 12, 6, 0, 6.3); x.fill(); }
      if (st.kitHover === i) { const h0 = px(sideK ? { x: kp.x + 9, z: kp.z - 1.2 } : KITV === 'back' ? { x: kp.x, z: kp.z + 5 } : { x: kp.x, z: kp.z - 6.4 }); x.lineJoin = 'round'; x.textAlign = 'center'; x.strokeStyle = '#f3eddc';
        hand(x, 40); x.lineWidth = 14; x.strokeText(q.name, h0[0], h0[1]); x.fillStyle = INK; x.fillText(q.name, h0[0], h0[1]);
        hand(x, 28); wrap(x, q.note, 380).forEach((ln, j) => { x.lineWidth = 12; x.strokeText(ln, h0[0], h0[1] + 34 + j * 30); x.fillStyle = PENCIL; x.fillText(ln, h0[0], h0[1] + 34 + j * 30); }); }
      if (age < 0.7 && !PLAIN) { const up = px(sideK ? { x: kp.x + 7.5 + 1.2 * age, z: kp.z - 0.6 } : KITV === 'back' ? { x: kp.x, z: kp.z + 4.6 + (i % 2) * 1.2 + 1.2 * age } : { x: kp.x, z: kp.z - 4.2 - (i % 2) * 1.5 - 1.2 * age }); fit(x, f.txt, 58 * (age < 0.08 ? 1.3 : 1), 160, marker); x.textAlign = 'center'; x.globalAlpha = 1 - age / 0.7; x.lineWidth = 12; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(f.txt, up[0], up[1]); x.fillStyle = f.col || k.col; x.fillText(f.txt, up[0], up[1]); x.globalAlpha = 1; }
    });
    // the round of the run, the pages, and a circle for each reaction on this page
    { const r0 = px({ x: EDGE, z: PAGES.z + 0.45 }); marker(x, 52); x.textAlign = 'left'; x.fillStyle = INK; x.fillText('round ' + run.round, r0[0], r0[1]); }
    if (g.brief !== 'plain') { const B = P.BRIEF[g.brief], b0 = px({ x: PAGES.x + 1.8 * P.pagesOf(g) + 2.4, z: PAGES.z + 0.45 }); hand(x, 36); x.textAlign = 'left'; x.fillStyle = INK; x.fillText(B.name, b0[0], b0[1]); inkLine(x, B.note, b0[0] + x.measureText(B.name).width + 22, b0[1], 30, PENCIL, 'left'); }
    if (!FEWER) for (let k = 1; k <= P.pagesOf(g); k++) { const c = px({ x: PAGES.x + (k - 1) * 1.8, z: PAGES.z }); hand(x, 46); x.textAlign = 'center'; x.fillStyle = k === g.page ? INK : k < g.page ? PENCIL : FAINT; x.fillText(String(k), c[0], c[1] + 14); if (k === g.page) ring(x, [c[0], c[1]], 28, 26, 4, INK); }
    // one circle for each reaction on this page. A done one is filled with the color of its reagent, and yellow joins those in a row
    const tr = g.trail.slice(st.pageStart).filter(t => !t.free);
    for (let k = 1; k < tr.length; k++) if (tr[k].cont) { const a0 = px({ x: STEP.x + (k - 1) * 2.5, z: STEP.z }), b0 = px({ x: STEP.x + k * 2.5, z: STEP.z }); x.strokeStyle = PART.r; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(a0[0] + 34, a0[1] + 40); x.lineTo(b0[0] - 34, b0[1] + 40); x.stroke(); }
    const cross = (c, col) => { x.strokeStyle = col; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.moveTo(c[0] - 15, c[1] - 13); x.lineTo(c[0] + 15, c[1] + 13); x.moveTo(c[0] + 15, c[1] - 13); x.lineTo(c[0] - 15, c[1] + 13); x.stroke(); };
    for (let k = 0; k < P.stepsOf(g); k++) { const c = px({ x: STEP.x + k * 2.5, z: STEP.z }), qi = k - g.pageSteps, qid = st.mode !== 'done' && qi >= 0 && g.queue ? g.queue[qi] : null; ring(x, c, 30, 27, 5, INK, 0.1 * k);
      if (k < g.pageSteps) { const t = tr[k]; if (t && t.wasted) cross(c, PENCIL); else if (t && t.bank) tray(x, c[0], c[1] - 2, 0.5, INK, 5); else { x.strokeStyle = t ? rgb(colOf(t.id)) : INK; x.fillStyle = x.strokeStyle; x.beginPath(); x.ellipse(c[0] + 1, c[1], 19, 17, 0.2, 0, 6.3); x.fill(); } }
      else if (qid === P.BANKID) tray(x, c[0], c[1] - 2, 0.5, INK, 5);
      else if (qid) { const kd = st.view && st.view.kinds[qi], cc = rgb(colOf(qid)), hi = g.kinds.indexOf(qid); x.fillStyle = cc; x.globalAlpha = kd === 'waste' ? 0.3 : 0.85; x.beginPath(); x.ellipse(c[0] + 1, c[1], 21, 19, 0.2, 0, 6.3); x.fill(); x.globalAlpha = 1; marker(x, 30); x.textAlign = 'center'; x.fillStyle = '#fbf8ee'; x.fillText(qid === P.SYN.finish ? 'F' : String(hi + 1), c[0] + 1, c[1] + 11); if (kd === 'waste') cross(c, PENCIL); }
    }
    // the reaction arrow after the circles fires the page
    if (P.RULE.queue && g && !g.over && (play || st.firing) && !g.chain) { const f = FIREP(), on = lineUp || !!st.homWait, hov = st.mark === 'fire' && on; arrow(x, { x: f.x - 1.3, z: f.z }, { x: f.x + 1.7, z: f.z }, hov ? 15 : 11, on ? INK : FAINT); if (st.homWait && !st.homPre) { hand(x, 28); x.textAlign = 'center'; x.fillStyle = on ? PENCIL : FAINT; const fc = px({ x: f.x, z: f.z + 1.25 }); x.fillText('turn', fc[0], fc[1]); } }
    // how much has been made, and the number to beat
    const q = px(MADE), bq = px(BEAT), beaten = st.shown >= st.quota, done = st.mode === 'done';
    { const txt = fmt(st.shown), size = fit(x, txt, 112 * (1 + 0.3 * st.madeBump * Math.cos((1 - st.madeBump) * 5)), 400, marker), mw = x.measureText(txt).width; st.madeW = mw; x.textAlign = 'left'; x.fillStyle = beaten ? GREEN : done ? REDINK : INK; x.fillText(txt, q[0], q[1]);
    }
    { const marks = P.runMarks(st.quota), top = done ? g.total : st.shown, T0 = px({ x: TRK.x0, z: TRK.z }), T1 = px({ x: TRK.x1, z: TRK.z }), W = T1[0] - T0[0], y = T0[1], n = marks.length, fr = k => (k === 0 ? 0.5 : 0.5 + 0.5 * k / n), vals = [st.quota].concat(marks);
      let f = 0.5 * top / Math.max(1, st.quota); if (top >= st.quota) { f = fr(vals.length - 1); for (let k = 0; k + 1 < vals.length; k++) if (top < vals[k + 1]) { f = fr(k) + (fr(k + 1) - fr(k)) * (top - vals[k]) / (vals[k + 1] - vals[k]); break; } }
      // the track: the round's total runs along it as a line of ink toward the red flag, which is the number to beat; the flags past it are the marks, each with the coin it pays
      x.lineCap = 'round'; x.strokeStyle = FAINT; x.lineWidth = 5; x.beginPath(); x.moveTo(T0[0], y); x.lineTo(T0[0] + W * (n ? 1 : 0.5), y - 3); x.stroke();
      if (f > 0.002) { x.strokeStyle = beaten ? GREEN : INK; x.lineWidth = 11; x.beginPath(); x.moveTo(T0[0], y); x.lineTo(T0[0] + W * f, y - 3 * f); x.stroke(); }
      vals.forEach((v, k) => { const fx = T0[0] + W * fr(k), on = done ? top >= v : !!st.passT[k], tx = fmt(v);
        if (k === 0) { flag(x, fx, y, 62, on ? GREEN : REDINK, true); marker(x, 50); x.textAlign = 'center'; x.fillStyle = on ? GREEN : REDINK; x.fillText(tx, fx + 10, y + 58); if (st.passT[0]) { const qw = x.measureText(tx).width / 2 + 14; strike(x, fx + 10 - qw, y + 46, fx + 10 + qw, y + 34, (now - st.passT[0]) / 120, 7, GREEN); } }
        else { flag(x, fx, y, 48, on ? GREEN : PENCIL, on); hand(x, 28); x.textAlign = 'center'; x.fillStyle = on ? GREEN : PENCIL; x.fillText(tx, fx + 6, y + 42); if (on && st.passT[k]) { const mw = x.measureText(tx).width / 2 + 8; strike(x, fx + 6 - mw, y + 35, fx + 6 + mw, y + 28, (now - st.passT[k]) / 120, 5, GREEN); } if (P.RULE.coins) rcoin(x, fx + 46, y - 30, 11, on ? 1 : 0.3); } });
      if (P.RULE.coins) { const e = done && st.earn ? st.earn.marks + st.earn.interest + (st.earn.extra || 0) : 0; purse(x, T1[0] + 86, y - 4, run.coins || 0, 17, e); } }
    // The rest of the rack and the redraw: top right, above the hand. Each reagent that is not in the hand is a group
    // of its use dots. The redraw is a turning arrow, and beside it the one dot it costs, struck through.
    if (g && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse') && P.RULE.hand && !st.firing) {
      const rack = (g.rackIds || []).filter(id => !g.kinds.includes(id)), c = px(DRAW), can = play && P.canRedraw(g), hov = st.mark === 'draw', pay = can ? P.redrawCost(g) : null, age = st.drawT ? (now - st.drawT) / 350 : 9;
      if ((g.rackIds || []).length > g.kinds.filter(id => (g.rackIds || []).includes(id)).length || rack.length) {
        x.save(); x.translate(c[0], c[1]); if (age < 1) { x.rotate(age * 6.283); dirty = true; }
        x.strokeStyle = can ? INK : FAINT; x.lineWidth = hov ? 10 : 7; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.arc(0, 0, 25, 0.9, 5.6); x.stroke();
        { const a = 5.6, hx = Math.cos(a) * 25, hy = Math.sin(a) * 25; x.beginPath(); x.moveTo(hx - 15, hy - 5); x.lineTo(hx, hy); x.lineTo(hx - 3, hy + 16); x.stroke(); }
        x.restore();
        if (pay) { x.strokeStyle = INK; x.lineWidth = 5; x.beginPath(); x.moveTo(c[0] + 40, c[1] + 2); x.lineTo(c[0] + 54, c[1] + 2); x.stroke(); drop(x, c[0] + 70, c[1], 9, INK, true); }
        let dx = 118; if (false) rack.forEach(id => { const nL = Math.min(8, g.left[id] || 0); x.globalAlpha = 0.6; if (!nL) { drop(x, c[0] + dx, c[1], 6, PENCIL, false); dx += 15; } for (let k = 0; k < nL; k++) { drop(x, c[0] + dx, c[1], 6, PENCIL, true); dx += 14; } x.globalAlpha = 1; dx += 13; });
      }
    }
    // The bank: a tray with an arrow into it, and what banking the open row would add now.
    if (g && play && P.RULE.bank && P.RULE.queue) { const c = px(BANK), placed = lineUp && g.queue.includes(P.BANKID), can = lineUp ? !placed && P.queueRoom(g) && !!st.view && st.view.bank : P.canBank(g), hov = st.mark === 'bank' && can;
      if (lineUp || can) { tray(x, c[0], c[1], 0.72, can ? INK : FAINT, hov ? 8 : 6); inkLine(x, 'times ' + P.RULE.bank, c[0] + 38, c[1] + 16, 30, can ? PENCIL : FAINT, 'left'); } }
    if (g && play && P.RULE.bank && !P.RULE.queue) {
      const c = px(BANK), can = P.canBank(g), hov = st.mark === 'bank', col = can ? INK : FAINT;
      if (can || g.cur.path.length > 0) {
        x.strokeStyle = col; x.lineWidth = hov ? 9 : 6; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath();
        x.moveTo(c[0] - 34, c[1] - 14); x.lineTo(c[0] - 34, c[1] + 8); x.lineTo(c[0] + 34, c[1] + 8); x.lineTo(c[0] + 34, c[1] - 14);
        x.moveTo(c[0], c[1] - 52); x.lineTo(c[0], c[1] - 10); x.moveTo(c[0] - 13, c[1] - 24); x.lineTo(c[0], c[1] - 10); x.lineTo(c[0] + 13, c[1] - 24); x.stroke();
        hand(x, 28); x.textAlign = 'center'; x.fillStyle = can ? PENCIL : FAINT; x.fillText('bank', c[0], c[1] + 40);
        if (can) { marker(x, hov ? 44 : 38); x.textAlign = 'left'; x.fillStyle = '#8a6a00'; x.fillText('+' + fmt(P.bankGain(g)), c[0] + 50, c[1] + 4); }
      }
    }
    // a page on which nothing acts: an arrow after the page numbers turns it
    if (g && stuck() && !P.RULE.queue) { const c = px({ x: PAGES.x + 1.8 * P.pagesOf(g) - 0.3, z: PAGES.z }), hov = st.mark === 'pages'; x.strokeStyle = INK; x.lineWidth = hov ? 9 : 6; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(c[0], c[1]); x.lineTo(c[0] + 44, c[1]); x.moveTo(c[0] + 28, c[1] - 14); x.lineTo(c[0] + 44, c[1]); x.lineTo(c[0] + 28, c[1] + 14); x.stroke(); }
    // what the last reaction made, at the right end of the band, with anything a rare reagent added above it
    st.pings = st.pings.filter(q => now - q.t < 800); st.pings.forEach(q => {
      const k = (now - q.t) / 800, c = px(q), up = c[1] - 30 - 46 * (1 - Math.pow(1 - k, 2));
      if (false) { x.globalAlpha = 1 - k / 0.6; x.strokeStyle = q.ring; x.lineWidth = 7 * (1 - k / 0.6) + 2; x.beginPath(); x.ellipse(c[0], c[1], 14 + (90 + 140 * q.f) * k, 11 + (70 + 110 * q.f) * k, 0.1, 0, 6.3); x.stroke(); if (q.f > 0.4) { x.beginPath(); x.ellipse(c[0], c[1], 8 + (50 + 80 * q.f) * k, 6 + (40 + 60 * q.f) * k, 0.1, 0, 6.3); x.stroke(); } }
      x.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1; { const slam = k < 0.08 ? 2.3 - 17 * k : k < 0.16 ? 0.94 + 0.75 * (k - 0.08) : 1; marker(x, q.size * slam); x.textAlign = 'center'; x.lineJoin = 'round'; x.lineWidth = 10; x.strokeStyle = '#f3eddc'; x.save(); x.translate(c[0], up); x.rotate((hash(q.txt + Math.round(q.t)) - 0.5) * 0.16); x.strokeText(q.txt, 0, 0); x.fillStyle = q.col; x.fillText(q.txt, 0, 0); x.restore(); } x.globalAlpha = 1; });
    st.floats = st.floats.filter(f => now - f.t < 1100); { let lane = 0; st.floats.forEach(f => { f.lane = f.col === '#8a6a00' ? 0 : ++lane; }); }
    st.floats.forEach(f => { const k = (now - f.t) / 1100, rare = f.lane > 0, c = px({ x: GAIN.x, z: GAIN.z - f.lane * 2.6 - 0.5 * k }), pop = k < 0.1 ? 1.4 - 4 * k : 1; x.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1; fit(x, f.txt, Math.min(rare ? 54 : 96, f.size) * pop, 250, marker); x.textAlign = 'left'; x.lineWidth = 10; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.strokeText(f.txt, c[0], c[1]); x.fillStyle = f.col || '#8a6a00'; x.fillText(f.txt, c[0], c[1]); }); x.globalAlpha = 1;
    // a line lettered across the page when something worth naming happens, or a row of ticks when the number is beaten again
    // the steps of a cascade, counted over the molecule in the page's own ink: a number and the name of the kind
    if (st.cstep && now - st.cstep.t < 1500 && (st.mode === 'play' || st.mode === 'move') && !lining()) {
      const k = (now - st.cstep.t) / 1500, c = px({ x: 19.4, z: -6.2 }), pop = k < 0.04 ? 1 + 6 * k : k < 0.1 ? 1.24 - 4 * (k - 0.04) : 1;
      x.save(); x.translate(c[0], c[1]); x.scale(pop, pop); x.globalAlpha = k > 0.72 ? 1 - (k - 0.72) / 0.28 : 1; marker(x, st.cstep.fresh ? Math.min(260, 104 + 20 * st.cstep.n) : 80); x.textAlign = 'center'; x.fillStyle = st.cstep.fresh ? INK : PENCIL; x.fillText(String(st.cstep.n), 0, 0);
      if (g && g.self && g.self.length > 1) { hand(x, 36); x.fillStyle = PENCIL; x.fillText(st.cstep.name, 0, 46); } x.restore(); x.globalAlpha = 1;
    } else if (st.cstep) st.cstep = null;
    if (st.call && now - st.call.t < 1400 && st.mode !== 'fuse') {
      const k = (now - st.call.t) / 1400, c = px(LANE.w > 20 ? { x: C0.x, z: -11.2 } : { x: CALL.x + 4.6, z: CALL.z - 0.4 }), pop = (k < 0.07 ? 0.3 + 14 * k : k < 0.14 ? 1.28 - 4 * (k - 0.07) : 1) * Math.min(1.5, 1 + 0.07 * (st.chainN || 0)), al = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
      x.save(); x.translate(c[0], c[1]); x.rotate(-0.03); x.scale(pop, pop); x.globalAlpha = al;
      if (st.call.ticks) { const n = st.call.ticks, w = (n > 10 ? 3 : n) * 110; tickRow(x, 0, -24, n, 92, st.call.col); }
      else {
        fit(x, st.call.text, 50, 280, marker); x.textAlign = 'center'; const tw = x.measureText(st.call.text).width;
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
    if (g && P.RULE.cascade && g.self && g.self.length > 1 && (st.mode === 'play' || st.mode === 'move')) { const TOK = { aldol: 'C=O+C=O', taut: 'C=C+OH', cyclize: 'OH+OH', lactol: 'zip', enone: 'C=O+OH', ether: 'Cl+OH', aromatize: 'ring', snap: 'snap', snap6: 'snap', weld: 'weld' }, c = px({ x: EDGE + 0.9, z: 13.2 }); let dx = 0; hand(x, 26); x.textAlign = 'left'; const key = g.trail.length + ':' + g.page; if (!st.selfK || st.selfK.key !== key) st.selfK = { key, on: g.self.filter(id => RX.CARDS[id].find(g.m).length) };
      g.self.forEach(id => { const t = TOK[id] || id, on = st.selfK.on.includes(id); x.fillStyle = on ? rgb(colOf(id)) : FAINT; x.fillText(t, c[0] + dx, c[1]); dx += x.measureText(t).width + 26; }); }
    // the family of the round's molecule and its rule, above the round
    if (g && g.m && meta.stage >= 2 && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse')) { const c = px({ x: EDGE + 0.2, z: PAGES.z - 2.5 }); let dx = 0; P.kinsOf(g.m).forEach(q => { const K = P.KIN[q.id], nm = K.name + (q.lv > 1 ? ' ' + q.lv : ''); marker(x, 44); x.textAlign = 'left'; x.fillStyle = K.col; x.fillText(nm, c[0] + dx, c[1]); const w1 = x.measureText(nm).width, w2 = 0; dx += Math.max(w1, w2) + 34; }); }
    // a molecule that could react with itself: the atoms that would meet are lit, and a click on the molecule folds it
    { const o = twistOpt(); if (o && center && center.model === g.m) { const key = st.twC.key; if (!st.twM || st.twM.key !== key) st.twM = { key, marks: marksOf(center, o.atoms || [], 0.01, 0.2) };
        const sc = center.group.scale.x, hov = twistAt(); x.fillStyle = '#2f8f6a'; x.globalAlpha = (hov ? 0.62 : 0.32) + 0.08 * Math.sin(now / 320);
        st.twM.marks.forEach(k => { const c = px({ x: C0.x + k.x * sc, z: C0.z + k.z * sc }), r = 0.95 * sc * U; x.beginPath(); x.ellipse(c[0], c[1], r, r * 0.86, 0, 0, 6.3); x.fill(); }); x.globalAlpha = 1; dirty = true; } }
    // the gain of each step of a cascade: written at the new ring, then it travels to the total and the total takes it
    if (st.gains.length && st.mode !== 'done') { const T0 = px(MADE), B = [T0[0] + (st.madeW || 200) + 90, T0[1] - 30]; st.gains.forEach(q => { if (now < q.t0) return; const A0 = px({ x: q.a.x, z: q.a.z - 2.5 }), k = Math.max(0, Math.min(1, (now - q.t) / q.dur)), e = k * k, pop = now - q.t0 < 70 ? 1.25 : 1, cx = A0[0] + (B[0] - A0[0]) * e, cy = A0[1] + (B[1] - A0[1]) * e - 36 * Math.sin(Math.PI * e);
        x.globalAlpha = k > 0.78 ? Math.max(0, 1 - (k - 0.78) / 0.24) : 1; marker(x, (q.fresh ? 76 : 48) * pop * (1 - 0.3 * e)); x.textAlign = 'center'; x.lineJoin = 'round'; x.lineWidth = 12; x.strokeStyle = '#f3eddc'; x.strokeText(q.txt, cx, cy); x.fillStyle = q.fresh ? INK : PENCIL; x.fillText(q.txt, cx, cy); x.globalAlpha = 1; }); dirty = true; }
    // bonuses in flight: from where they were earned to the points or to the multiplier
    if (st.motes.length) { const mp2 = px(FORM), tx0 = mp2[0] + Math.max(st.fW || 260, (st.madeW || 0) + 10) + 64, tgt = { p: [tx0, mp2[1] - 24], m: [tx0, mp2[1] - 24] }; st.motes = st.motes.filter(m => now - m.t < m.dur);
      const lanes = { p: 0, m: 0 }; st.motes.forEach(m => { const k = (now - m.t) / m.dur; if (k < 0) return; const lane = lanes[m.part]++ % 3; const e = k * k * (3 - 2 * k), A = px(m.a), B = [tgt[m.part][0] + lane * 70, tgt[m.part][1]], cx = A[0] + (B[0] - A[0]) * e, cy = A[1] + (B[1] - A[1]) * e * e * e;
        marker(x, 42 - 12 * e); x.globalAlpha = Math.max(0, Math.min(1, (k - 0.2) / 0.15, (0.8 - k) / 0.2)); x.textAlign = 'center'; x.lineJoin = 'round'; x.lineWidth = 8; x.strokeStyle = '#fbf8ee'; x.strokeText(m.txt, cx, cy); x.fillStyle = m.col; x.fillText(m.txt, cx, cy); x.globalAlpha = 1; }); dirty = true; }
    // the reagent of a reaction travels from where it is listed to the place it changes, as the group it looks for,
    // and on landing shows that group and what it has become
    if (st.fly && st.mode !== 'done') { const F = st.fly, age = now - F.t; if (age > F.trav + F.hold) st.fly = null; else {
      const u = Math.min(1, age / F.trav), e = u * u * (3 - 2 * u), A = px(F.a), B = px({ x: Math.max(F.b.x, C0.x - 9), z: Math.max(-8.6, Math.min(F.b.z - 2.4, C0.z + 1)) }), cx = A[0] + (B[0] - A[0]) * e, cy = A[1] + (B[1] - A[1]) * e - 90 * Math.sin(Math.PI * e);
      const landed = u >= 1, k2 = landed ? (age - F.trav) / F.hold : 0, sc = 1.25 + (landed ? 0.4 * Math.max(0, 1 - k2 * 6) : 0);
      x.save(); x.translate(cx, cy); x.scale(sc, sc); x.globalAlpha = k2 > 0.75 ? 1 - (k2 - 0.75) / 0.25 : 1;
      if (!landed) chip(x, F.tl[0], 0, 0, true);
      else { chip(x, F.tl[0], -72, 0, false); x.strokeStyle = INK; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(-22, -12); x.lineTo(8, -12); x.lineTo(-2, -22); x.moveTo(8, -12); x.lineTo(-2, -2); x.stroke(); chip(x, F.tl[1], 62, 0, true); }
      x.restore(); x.globalAlpha = 1; dirty = true; } }
    // the jars: how much each holds of what fills it. A full one carries the name of what hatched
    if (meta.stage >= 2 && g && st.mode !== 'pick' && st.mode !== 'brief' && st.mode !== 'shop') JARK.forEach(k => { const j = jarPos(k); if (!j) return; const c = px({ x: j.x, z: j.z + 1.75 * j.s / 1.2 }), n = jarOf(k), full = P.JAR.full[k], few = j.s >= 1.2; fit(x, meta.hatched[k] ? P.HOMS[k].name : few ? n + '/' + full : String(n), (few ? 26 : 22) * (1 + 0.25 * (st.byBump[k] || 0)), few ? 200 : 84, hand); x.textAlign = 'center'; x.fillStyle = meta.hatched[k] ? JARINK[k] : PENCIL; x.fillText(meta.hatched[k] ? P.HOMS[k].name : few ? n + '/' + full : String(n), c[0], c[1]); });
    // the homunculus of the run: its name, a drop for each time it has been fed, and when the page waits on it what it would do
    if (g && g.hom && homObj && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse')) { const H = P.HOMS[g.hom.id], c = px({ x: HOMP.x - 3.3, z: HOMP.z - 1.7 }), col = JARINK[g.hom.id], fed = Math.min(H.need, g.hom.fed), ready = fed >= H.need;
      { const key = g.trail.length + ':' + g.hom.fed + ':' + g.hom.used + ':' + g.page; if (st.litK !== key) { st.litK = key; try { st.lit = P.homLit(g); } catch (e) { st.lit = false; } } }
      hand(x, st.lit ? 30 : 26); x.textAlign = 'center'; x.fillStyle = st.lit ? col : PENCIL; x.fillText(H.name, c[0], c[1]); for (let k = 0; k < H.need; k++) drop(x, c[0] + (k - (H.need - 1) / 2) * 24, c[1] + 34, 8, col, k < fed);
      if (st.homNone && ready) strike(x, c[0] - 44, c[1] + 40, c[0] + 44, c[1] + 28, 1, 5, PENCIL);
      if (st.homWait && st.homList && center) { const sc = center.group.scale.x, P2 = q => px({ x: C0.x + q.x * sc, z: C0.z + q.z * sc }), r = 1.0 * sc * U, seg = (a, b) => { x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); }, one = st.homList.length === 1 ? st.homList[0] : null, h = st.homSpot || (st.homHover ? one : null);
        x.strokeStyle = INK; x.lineWidth = st.homHover ? 7 : 5; x.lineCap = 'round'; seg([c[0] - 50, c[1] + 58], [c[0] + 50, c[1] + 55]);
        if (one && one.worth != null) { marker(x, 44); x.textAlign = 'right'; x.fillStyle = one.worth ? INK : PENCIL; x.fillText('+' + one.worth, c[0] - 62, c[1] + 46); }
        if (!one) st.homList.forEach(q => { if (q === h) return; const p = P2(q), dead = q.worth === 0; x.strokeStyle = dead ? PENCIL : INK; x.globalAlpha = dead ? 0.45 : 0.85; x.lineWidth = 6; seg([p[0] - 1, p[1] + r * 0.8], [p[0] + 2, p[1] + r * 0.8 + 22]); if (q.worth != null) { hand(x, 24); x.textAlign = 'center'; x.fillStyle = dead ? PENCIL : INK; x.fillText('+' + q.worth, p[0] + 1, p[1] + r * 0.8 + 46); } });
        x.globalAlpha = 1;
        if (h) { x.globalAlpha = 0.6; x.strokeStyle = col; x.lineWidth = Math.max(10, 0.3 * sc * U); h.bonds.forEach(b => seg(P2(b[0]), P2(b[1]))); x.globalAlpha = 0.95; hand(x, 30); x.textAlign = 'center'; x.fillStyle = col; if (H.word) h.at.forEach(q => { const p = P2(q); x.fillText(H.word, p[0], p[1] - r - 8); });
          if (!one && h.worth != null) { const p = P2(h), y = p[1] + r * 0.8 + 62; marker(x, 44); x.lineJoin = 'round'; x.lineWidth = 9; x.strokeStyle = '#fbf8ee'; x.strokeText('+' + h.worth, p[0], y); x.fillStyle = h.worth ? INK : PENCIL; x.fillText('+' + h.worth, p[0], y); } }
        x.globalAlpha = 1; } }
    // where the wet one has run: small puddles on the paper that dry
    if (st.puddles && st.puddles.length) { st.puddles = st.puddles.filter(q => now - q.t < 2600); st.puddles.forEach((q, i) => { const k = (now - q.t) / 2600; const c = px(q), w = hash('pd' + Math.round(q.t)); x.globalAlpha = 0.3 * (1 - k); x.fillStyle = '#3a6fd0'; x.beginPath(); x.ellipse(c[0], c[1], q.r * 1.5, q.r * 0.62, w - 0.5, 0, 6.3); x.fill(); x.beginPath(); x.ellipse(c[0] + q.r * (0.9 + w), c[1] + q.r * 0.35, q.r * 0.55, q.r * 0.26, 0.2, 0, 6.3); x.fill(); }); x.globalAlpha = 1; dirty = true; }
    // the round is over: how it went, and where to click
    if (done) {
      const c = px({ x: 0, z: -9 }), ratio = g.total / st.quota;
      marker(x, 130); x.textAlign = 'center'; x.lineWidth = 16; x.lineJoin = 'round'; x.strokeStyle = '#f3eddc'; x.fillStyle = st.pass ? GREEN : REDINK;
      const txt = st.won ? 'won' : st.pass ? 'beaten' : fmt(st.quota - g.total) + ' short', tw = x.measureText(txt).width, n = Math.floor(ratio);
      x.strokeText(txt, c[0], c[1]); x.fillText(txt, c[0], c[1]);
      hand(x, 50); x.fillStyle = PENCIL; for (let n = 0; n < (st.pass ? st.paid || 0 : 0); n++) coin(x, c[0] + tw / 2 + 60 + n * 56, c[1] - 36, 22);
      x.fillText(st.pass ? '' : run.beaten + ' beaten    best ' + best, c[0], c[1] + 80);
      if (st.newSig) { const sc = px({ x: -12, z: 3.5 }), T0 = P.TERMS.find(q => q.id === st.newSig); sigil(x, sc, 120, st.newSig, '#b88a00', 10); marker(x, 50); x.textAlign = 'center'; x.fillStyle = '#b88a00'; x.fillText(T0.name, sc[0], sc[1] + 136); hand(x, 28); x.fillStyle = PENCIL; x.fillText('new sigil', sc[0], sc[1] - 96); }
      { const nx = px({ x: 17.5, z: 11.6 }), wd = st.pass ? 'next' : 'new run'; marker(x, 58); x.textAlign = 'center'; x.fillStyle = INK; x.fillText(wd, nx[0], nx[1]); const w2 = x.measureText(wd).width / 2 + 26; x.strokeStyle = INK; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(nx[0] + w2, nx[1] - 18); x.lineTo(nx[0] + w2 + 60, nx[1] - 18); x.lineTo(nx[0] + w2 + 38, nx[1] - 38); x.moveTo(nx[0] + w2 + 60, nx[1] - 18); x.lineTo(nx[0] + w2 + 38, nx[1] + 2); x.stroke(); }
    }
    ink.t.needsUpdate = true;
  }

  // ---------- pointer and keys ----------
  const ray = new T.Raycaster(), ndc = new T.Vector2(), ground = new T.Plane(new T.Vector3(0, 1, 0), 0), hit = new T.Vector3();
  function slotAt(e) {
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(ground, hit) || st.mode !== 'play') return -1;
    const any = lining(); let slot = -1; slots.forEach((s, i) => { if (!s || (!s.o && !any)) return; const p = SPOT[i]; if (p && (SIDE ? hit.x > 12 && Math.abs(hit.z - p.z) < SLOTW / 2 : Math.abs(hit.x - p.x) < SLOTW / 2 && hit.z > -14.5 && hit.z < p.z + 3)) slot = i; });
    return slot;
  }
  function pickAt(e, arr) {
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(ground, hit) || hit.z < -7 || hit.z > 9) return -1;
    if (arr === briefs && briefs.length === 1) return Math.abs(hit.x) < 7 ? 0 : -1;
    if (arr === briefs && briefs.length === 2) return Math.abs(hit.x - BX(0)) < 10 ? 0 : Math.abs(hit.x - BX(1)) < 10 ? 1 : -1;
    let best = -1; PICKX.forEach((px0, i) => { if ((arr || picks)[i] && Math.abs(hit.x - px0) < 7) best = i; }); return best;
  }
  function shopAt(e) {
    const r = cv.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
    if (!ray.ray.intersectPlane(ground, hit)) return -2;
    for (let i = 0; i < P.SUPPLY.length; i++) { const z = -9.2 + i * 3.6; if (hit.z > z - 1.7 && hit.z < z + 1.9 && hit.x > -24 && hit.x < 6.5) return i; }
    for (let i = 0; i < P.FAMILIES.length; i++) { const z = -9.2 + i * 3.6; if (hit.z > z - 1.7 && hit.z < z + 1.9 && hit.x >= 6.5) return 100 + i; }
    return hit.z > 9.5 ? -1 : -2;
  }
  cv.addEventListener('pointermove', e => { if (st.mode === 'hom') { const i = homPageAt(e); if (i !== st.hover) { st.hover = i; dirty = true; } cv.style.cursor = i >= 0 ? 'pointer' : ''; return; } if (st.mode === 'terms') { const i = termAt(e); if (i !== st.hover) { st.hover = i; dirty = true; } cv.style.cursor = i >= 0 ? 'pointer' : ''; return; } if (st.mode === 'brief') { const i = pickAt(e, briefs), mk = i < 0 && pairAt() ? 'pair' : ''; if (i !== st.hover || mk !== st.mark) { st.hover = i; st.mark = mk; dirty = true; } cv.style.cursor = i >= 0 || mk ? 'pointer' : ''; return; } if (st.mode === 'shop') { const i = shopAt(e); if (i !== st.hover) { st.hover = i; dirty = true; } cv.style.cursor = i === -1 || i === meta.tier + 1 ? 'pointer' : ''; return; } if (st.mode === 'pick') { const i = pickAt(e), mk = i < 0 ? pickMark() : ''; if (i !== st.hover || mk !== st.mark) { st.hover = i; st.mark = mk; dirty = true; } cv.style.cursor = i >= 0 || mk ? 'pointer' : ''; return; } const s = slotAt(e); if (s !== st.hover) setHover(s); toolHover(); homPoint(); { const mk = bankAt() ? 'bank' : drawAt() ? 'draw' : fireAt() || homTurnAt() ? 'fire' : circleAt() >= 0 ? 'circle' : pagesAt() ? 'pages' : ''; if (mk !== st.mark) { st.mark = mk; dirty = true; } } { let kh = -1; kitObjs.forEach((k, i) => { const kp = KITP(i); if (Math.abs(hit.x - kp.x) < 2.4 && hit.z > kp.z - 4.5 && hit.z < kp.z + 3.8) kh = i; }); if (kh !== st.kitHover) { st.kitHover = kh; dirty = true; } if (NAMEV === 'hover' || NAMEV === 'both') { let tip = null; zones().forEach(q => { if (q.r && Math.hypot(hit.x - q.x, hit.z - q.z) < q.r) tip = q.id; }); if (tip !== st.tip) { st.tip = tip; dirty = true; } } } cv.style.cursor = s >= 0 || st.mark || st.mode === 'done' || st.toolSpot || toolAt() || (st.homWait && (st.homSpot || homAt())) ? 'pointer' : ''; });
  cv.addEventListener('pointerleave', () => setHover(-1));
  cv.addEventListener('pointerdown', () => { if (!twistAt()) return; st.drag = { x: hit.x, z: hit.z }; doTwist(); if (morph && morph.slow) { morph.scrub = true; morph.kDrag = 0; morph.kHeld = 0; } });
  cv.addEventListener('pointermove', () => { if (st.drag && morph && morph.scrub) morph.kDrag = Math.min(1, Math.hypot(hit.x - st.drag.x, hit.z - st.drag.z) / 5); });
  root.addEventListener('pointerup', () => { if (!st.drag) return; st.drag = null; if (morph && morph.scrub) { morph.scrub = false; morph.t0 = performance.now() - morph.s0 - (morph.K || 0) * 460; } });
  cv.addEventListener('click', e => { if (st.mode === 'hom') { const i = homPageAt(e); if (i >= 0) chooseHom(i); return; } if (st.mode === 'terms') { const i = termAt(e); if (i >= 0) chooseTerm(i); return; } if (st.mode === 'brief') { const i = pickAt(e, briefs); if (i >= 0) chooseBrief(i); else if (pairAt()) doPair(); return; } if (st.mode === 'shop') { const i = shopAt(e); if (i === -1) next(); else if (i >= 100) openFamily(i - 100); else if (i >= 0) openSupplier(i); return; } if (st.mode === 'pick') { const i = pickAt(e), mk = i < 0 ? pickMark() : ''; if (i >= 0) takePick(i); else if (mk === 'reroll') doReroll(); else if (mk === 'skip') doSkip(); else if (mk) doBin(+mk.slice(3)); return; } if (st.mode === 'fuse') return; if (st.mode === 'done') return next(); const s = slotAt(e); if (homPreAt()) return homPre(); if (st.homWait) { homPoint(); if (homTurnAt()) return homSkip(); const it = st.homSpot || (homAt() && st.homList && st.homList.length === 1 ? st.homList[0] : null); if (it) doHom(it); return; } { const tk = toolAt(); if (tk) return toolArm(tk); if (st.tool) { toolHover(); if (st.toolSpot) return doTool(); toolOff(); } } if (s >= 0) pick(s); else if (circleAt() >= 0) doUnqueue(circleAt()); else if (fireAt()) doFire(); else if (bankAt()) doBank(); else if (drawAt()) doRedraw(); else if (pagesAt()) doTurn(); else if (twistAt()) doTwist(); else if (pawAt()) doWish(); else if (kitAt('extinguisher')) doDouse(); });
  root.addEventListener('keydown', e => {
    if (e.key >= '1' && e.key <= '6') { if (st.mode === 'hom') chooseHom(+e.key - 1); else if (st.mode === 'terms') chooseTerm(+e.key - 1); else if (st.mode === 'pick') takePick(+e.key - 1); else if (st.mode === 'brief') chooseBrief(+e.key - 1); else pick(+e.key - 1); }
    else if (e.key === 'f' || e.key === 'F') pick(FIN);
    else if (e.key === 't' || e.key === 'T') doTwist();
    else if (e.key === 'b' || e.key === 'B') doBank();
    else if (e.key === 'd' || e.key === 'D') { if (st.mode === 'pick') doReroll(); else if (st.mode === 'brief') doPair(); else doRedraw(); }
    else if ((e.key === 's' || e.key === 'S') && st.mode === 'pick') doSkip();
    else if (e.key === 'n' || e.key === 'N') doTurn();
    else if (e.key === 'Backspace') { e.preventDefault(); doUnqueue(-1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (st.homWait) homSkip(); else if (lining()) doFire(); else next(); }
    else if (e.key === 'r' || e.key === 'R') newRun();
  });

  function size() {
    const w = app.clientWidth, h = app.clientHeight; if (!w || !h) return; ren.setSize(w, h, false); cam.aspect = w / h; cam.fov = w / h > 1.6 ? 34 : 34 * 1.6 / (w / h) * 0.86; cam.updateProjectionMatrix();
    veil.width = w; veil.height = h; const x = veil.getContext('2d'), gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,236,190,0.16)'); gr.addColorStop(1, 'rgba(60,50,90,0.14)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); noise(x, w, h, w * h / 30, 0.05, '80,60,30');
  }
  function frame(now) {
    requestAnimationFrame(frame);
    const raw = now - last, dt = Math.min(0.05, raw / 1000), ended = []; last = now;
    if (PLAIN) { st.shake = Math.min(st.shake, 0.55); st.flash = 0; }
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
      const FOLD_MS = morph.ms || (st.firing ? Math.max(150, 330 * Math.pow(0.86, st.chainN || 0)) : 460), slowDone = morph.slow && !morph.scrub && el - morph.s0 >= FOLD_MS;
      if (morph.slow ? slowDone : el > morph.end) { if (morph.slow) { st.pop = 1; st.sq = 1; st.hold = now + 90; st.shake = Math.max(st.shake, 0.55); sfx.bond(); sfx.good(); } else { st.pop = Math.max(st.pop, 0.4); st.sq = Math.max(st.sq, 0.35); } layout(morph.m, a => morph.m.at.get(a), null); morph = null; }
      else if (morph.slow) {
        let K = Math.max(0, Math.min(1, (el - morph.s0) / FOLD_MS)); if (morph.scrub) { K = Math.max(morph.kHeld || 0, Math.min(0.9, morph.kDrag || 0)); morph.kHeld = K; } morph.K = K;
        // slow to start, then quick: the two ends are drawn together as if they pulled on each other
        const k = K < 0.3 ? 0.12 * Math.pow(K / 0.3, 2) : 0.12 + 0.88 * (1 - Math.pow(1 - (K - 0.3) / 0.7, 3));
        morph.m.balls.forEach((b, a) => { const fr = morph.from.get(a), to = morph.m.at.get(a), c = morph.cur.get(a); if (fr) c.copy(fr).lerp(to, k); else c.copy(to); });
        if (morph.bend) bendEval(morph.bend, k, morph);
        for (let it = 0; it < 10; it++) morph.m.sticks.forEach(q => { const fa = morph.from.get(q.a), fb = morph.from.get(q.b); if (!fa || !fb) return; const ca = morph.cur.get(q.a), cb = morph.cur.get(q.b), rest = fa.distanceTo(fb) * (1 - k) + morph.m.at.get(q.a).distanceTo(morph.m.at.get(q.b)) * k; _u.copy(cb).sub(ca); const len = _u.length() || 1e-4, df = (len - rest) / len * 0.5; ca.addScaledVector(_u, df); cb.addScaledVector(_u, -df); });
        layout(morph.m, a => morph.cur.get(a), a => (morph.from.has(a) ? 1 : k));
      }
      else if (morph.bend) { const s0 = morph.s0 < 1e8 ? morph.s0 : 0, kb = ease(Math.max(0, Math.min(1, (el - s0) / Math.max(200, morph.end - s0 - 60)))); morph.m.balls.forEach((b, a) => { const fr = morph.from.get(a); if (fr) morph.cur.get(a).copy(fr).lerp(morph.m.at.get(a), kb); }); bendEval(morph.bend, kb, morph);
        layout(morph.m, a => (morph.from.has(a) ? morph.cur.get(a) : morph.m.at.get(a)), a => (morph.from.has(a) ? 1 : kb)); }
      else layout(morph.m, a => { const fr = morph.from.get(a), to = morph.m.at.get(a); return fr ? morph.cur.get(a).copy(fr).lerp(to, ease(kOf(a, 240))) : to; }, a => { const d = el - morph.start.get(a), bump = morph.made.has(a) && d >= 0 ? 0.28 * Math.max(0, 1 - d / 420) : 0; return morph.from.has(a) ? 1 + bump : kOf(a, 300) <= 0 ? 0 : back(kOf(a, 300)) + bump; });
      dirty = true; }
    if (st.flyers.length) { st.flyers = st.flyers.filter(f => {
      if (!f.to) f.to = byTarget(f.kind); if (!f.t0) f.t0 = now; const age = now - f.t0; if (age < 0) return true;
      const k = Math.min(1, age / f.dur), e = k * k * (3 - 2 * k), d = f.from.distanceTo(f.to);
      f.grp.position.set(f.from.x + (f.to.x - f.from.x) * e, f.from.y + (f.to.y - f.from.y) * e + Math.sin(k * Math.PI) * (0.9 + 0.04 * d), f.from.z + (f.to.z - f.from.z) * e);
      f.grp.rotation.set(0, f.spin * k, 0); f.grp.scale.setScalar(st.sc * (k > 0.6 ? 1 - (k - 0.6) / 0.4 * 0.7 : 1));
      if (k < 1) return true;
      scene.remove(f.grp); burst3(f.to.x, 0.2, f.to.z + 0.6, 8, f.kind === 'water' ? '#3a6fd0' : f.kind === 'h2' ? '#d6453a' : '#5a564e');
      if (f.keep) { st.by[f.keep] = Math.min(g ? g.by[f.keep] || 0 : 9, (st.by[f.keep] || 0) + 1); st.byBump[f.keep] = 1; }
      st.by.gauge = (st.by.gauge + 1) % P.BY.tally; st.byBump.gauge = 1; dirty = true; return false; }); dirty = true; }
    JARK.concat(['gauge']).forEach(q => { if (st.byBump[q] > 0) { st.byBump[q] = Math.max(0, st.byBump[q] - dt * 3.5); dirty = true; } });
    { const on = meta.stage >= 2 && ((!!g && (st.mode === 'play' || st.mode === 'move' || st.mode === 'done' || st.mode === 'fuse')) || (st.mode === 'hom' && JARK.filter(jarSeen).length <= 5)), tq = now / 1000;
      JARK.forEach((k, ji) => { const J = jars[k], jp = on ? jarPos(k) : null; J.grp.visible = !!jp; if (!jp) return; J.grp.position.set(jp.x, 0, jp.z); const f = jarOf(k) / P.JAR.full[k], out = !!(run && run.hom === k) && st.mode !== 'hom', stage = meta.hatched[k] ? 3 : f >= P.JAR.stages[1] ? 2 : f >= P.JAR.stages[0] ? 1 : 0, lv = 0.06 + 1.9 * Math.min(1, f);
        J.fill.scale.y = lv; J.fill.position.y = 0.16 + lv / 2; J.fill.visible = f > 0 && !meta.hatched[k]; J.figs.forEach((m, n) => { m.visible = !out && stage === n + 1; });
        const bump = st.byBump[k] || 0, hb = st.hatched === k && st.hatchT ? Math.max(0, 1 - (now - st.hatchT) / 600) : 0, s0 = jp.s * (1 + 0.1 * bump * Math.cos(bump * 9)); J.grp.scale.set(s0, s0 * (1 + 0.16 * hb * Math.cos(hb * 10)), s0); J.grp.rotation.z = 0.02 * Math.sin(tq * 1.2 + ji * 2);
        if (stage === 2 || stage === 3) { const m = J.figs[stage - 1]; m.rotation.y = 0.5 * Math.sin(tq * 0.8 + ji); m.position.y = 0.16 + (k === 'h2' ? 0.08 + 0.06 * Math.sin(tq * 1.7) : 0); } if (hb) dirty = true; }); }
    if (homObj) { const on = !!g && !!g.hom && (st.mode === 'play' || st.mode === 'move' || st.mode === 'fuse'), G = homObj.grp; G.visible = on;
      if (on) { const tq = now / 1000, A = st.homAct, age = A ? now - A.t : 1e9, floaty = homObj.id === 'h2', ease = u => u * u * (3 - 2 * u); let hx = HOMP.x, hz = HOMP.z, y = floaty ? 0.3 + 0.22 * Math.sin(tq * 1.7) : 0, sy = floaty ? 1 : 1 + 0.03 * Math.sin(tq * 2.3), rz = floaty ? 0.09 * Math.sin(tq * 1.1) : 0.02 * Math.sin(tq * 1.5);
        if (age < 470) { const k = ease(Math.min(1, age / 190)) * (1 - ease(Math.max(0, Math.min(1, (age - 270) / 200)))); hx += (A.to.x - HOMP.x) * k; hz += (A.to.z - HOMP.z) * k; y += Math.sin(k * Math.PI) * (floaty ? 1.2 : 0.5); if (homObj.id === 'water') { sy *= 1 - 0.18 * Math.abs(Math.sin(age / 38)); if (!A.pd || now - A.pd > 36) { A.pd = now; st.puddles.push({ x: hx + 0.5 * Math.sin(age / 20), z: hz + 1.1, r: 13 + 9 * Math.abs(Math.sin(age / 31)), t: now }); } } else if (floaty) rz += 0.25 * Math.sin(age / 60); else rz += 0.12 * Math.sin(age / 45); dirty = true; } else if (A) st.homAct = null;
        if (st.lit) y += 0.1 + 0.05 * Math.sin(tq * 3); if (st.homWait) y += 0.12 + (st.homHover ? 0.3 : 0);
        G.position.set(hx, y, hz); G.rotation.z = rz; G.scale.set(1.45, 1.45 * sy, 1.45); } }
    homObjs.forEach(k => { const age = (now - k.born) / 1000, u = Math.max(0, Math.min(1, age / 0.45)), dropY = u < 1 ? (1 - u) * (1 - u) * 9 : 0, hov = st.hover === k.slot; k.grp.visible = age >= 0; k.grp.position.y = dropY + (k.id === 'h2' ? 0.3 + 0.2 * Math.sin(now / 600) : 0) + (hov ? 0.6 : 0); k.grp.rotation.z = k.id === 'h2' ? 0.08 * Math.sin(now / 900) : 0.02 * Math.sin(now / 700 + k.slot); });
    prods.forEach((m, i) => { if (!m || tweens.some(tw => tw.m === m)) return; const hov = st.hover === i, want = hov ? 0.7 : 0, sc = (SCS[i] || 0.8) * (hov ? SC_HOVER : 1), k = Math.min(1, dt * 14); m.group.position.y += (want - m.group.position.y) * k; const s0 = m.group.scale.x; if (Math.abs(s0 - sc) > 0.002) { m.group.scale.setScalar(s0 + (sc - s0) * k); dirty = true; } });
    if (st.mode === 'pick' || st.mode === 'shop' || st.mode === 'brief' || st.mode === 'terms' || st.mode === 'hom') dirty = true;
    if (st.mode === 'brief') briefMols.forEach((m, i) => { if (!tweens.some(tw => tw.m === m)) { m.group.scale.setScalar(m.sc * (st.hover === i ? 1.15 : 1)); m.group.rotation.z = 0.05 * Math.sin(now / 1000 * 1.3 + i * 1.7); } });
    if (st.gains.length) { st.gains = st.gains.filter(q => { if (now < q.t + q.dur) return true; st.want = Math.max(st.want, q.to); st.madeBump = 1; st.tickT = now; return false; }); if (!st.gains.length && g && st.mode !== 'done' && !st.pending) st.want = P.made(g); dirty = true; }
    const target = st.mode === 'done' && g ? g.total : st.want;
    if (st.shown !== target) { const d = target - st.shown; st.shown = Math.abs(d) < 2 ? target : st.shown + d * Math.min(1, dt * (now - (st.tickT || 0) < 260 ? 50 : 16)); dirty = true; }
    // the number to beat, and each mark above it, is passed at the frame the total shown crosses it
    if (g && st.quota > 0 && st.mode !== 'pick' && st.mode !== 'brief' && st.mode !== 'shop' && st.mode !== 'terms') [st.quota].concat(P.runMarks(st.quota)).forEach((m, k) => { if (!st.passT[k] && st.shown >= m) { st.passT[k] = now; if (k === 0) sfx.quota(); else sfx.lock(8 + k); dirty = true; } });
    pickObjs.forEach(k => { const age = (now - (k.born || 0)) / 1000, u = Math.max(0, Math.min(1, age / 0.45)), drop = u < 1 ? (1 - u) * (1 - u) * 9 : 0, sq = u >= 1 && age < 0.75 ? Math.sin((age - 0.45) / 0.3 * Math.PI) * 0.18 : 0; k.grp.visible = age >= 0; k.grp.rotation.y += dt * 0.6; k.grp.position.y = drop + (st.hover === k.slot ? 0.8 + 0.15 * Math.sin(now / 140) : 0); k.grp.scale.set(1.7 * (1 + sq * 0.6), 1.7 * (1 - sq), 1.7 * (1 + sq * 0.6)); });
    // equipment is moved further down, once the heat of the round is known
    if (st.multBump > 0) { st.multBump = Math.max(0, st.multBump - dt * 3.5); dirty = true; }
    if (st.floats.length || st.blots.length || st.pings.length || st.slashes.length || st.strokes.length || st.call || st.cstep) dirty = true;
    st.shake *= Math.pow(0.002, dt); const sh = st.shake > 0.02 ? st.shake : 0;
    // the view pushes in on the molecule for a moment when it reacts
    { const want = 0; st.zoom += (want * 0.012 - st.zoom) * Math.min(1, dt * (want ? 9 : 5)); const fk = Math.min(1, dt * 8); st.fx += (st.focus.x - st.fx) * fk; st.fz += (st.focus.z - st.fz) * fk; }
    const zk = st.zoom, hx = Math.max(-0.22, Math.min(0.22, (Math.random() - 0.5) * sh * 0.6)), hz = Math.max(-0.3, Math.min(0.3, (Math.random() - 0.5) * sh * 0.6));
    cam.position.set(CAM.x + (st.fx - CAM.x) * zk + hx, CAM.y + (16 - CAM.y) * zk, CAM.z + (st.fz + 12 - CAM.z) * zk + hz);
    cam.lookAt(LOOKAT.x + (st.fx - LOOKAT.x) * zk, 0.8 * zk, LOOKAT.z + (st.fz - LOOKAT.z) * zk);
    // the hotter the run, the warmer the page
    const playing = g && (st.mode === 'play' || st.mode === 'move'), heat = playing ? Math.min(1, Math.log2(Math.max(1, st.mult)) / 6) : 0;
    if (st.flash > 0) { st.flash = Math.max(0, st.flash - dt * 2.2); veil.style.backgroundColor = 'rgba(' + st.flashC + ',' + (st.flash * 0.3).toFixed(3) + ')'; }
    else if (heat > 0.05 && LOOK === 'now') veil.style.backgroundColor = 'rgba(255,110,30,' + (heat * 0.3).toFixed(3) + ')';
    else if (veil.style.backgroundColor) veil.style.backgroundColor = '';
    // nothing on the page sits dead still: molecules rock, equipment trembles with the multiplier, a hot run throws bubbles
    const tt = now / 1000;
    if (center && !tweens.some(tw => tw.m === center)) { { let lo = 1e9, hi = -1e9; center.balls.forEach(b => { const q = b.mesh.position.x; if (q < lo) lo = q; if (q > hi) hi = q; }); const w = hi - lo + 1.4; if (w * SC_MAIN > LANE.w * 1.02) SC_MAIN = Math.max(0.7, LANE.w / w); } st.pop = Math.max(0, st.pop - dt * 3.2); const sp = 1 + 0.28 * st.pop * Math.cos(st.pop * 9); st.sc += (SC_MAIN - st.sc) * Math.min(1, dt * 13); { const q = st.sq * Math.cos(st.sq * 11); center.group.scale.set(st.sc * sp * (1 + 0.1 * q), st.sc * sp * (1 - 0.2 * q), st.sc * sp * (1 + 0.1 * q)); } center.group.position.set(C0.x + st.kx, 0.25 + 0.2 * Math.sin(tt * (1.6 + 2 * heat)), C0.z + st.kz); center.group.rotation.z = 0.035 * Math.sin(tt * 1.1) + (Math.random() - 0.5) * (0.03 * heat + 0.07 * st.fury); if (st.ch > 0.02) { const c = st.ch, fz = st.mode === 'fuse'; center.group.scale.multiplyScalar(1 + 0.15 * c + (fz ? 0.06 * Math.sin(now / 70) : 0)); center.group.rotation.z += (Math.random() - 0.5) * 0.09 * c * c * (fz ? 1.8 : 1); center.group.position.x += (Math.random() - 0.5) * 0.25 * c * c; dirty = true; } }
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
  AA.rxScheme = { toolArm: id => toolArm(id), toolSpots: () => (st.toolList || []).map(q => { const sc = center.group.scale.x; return { x: C0.x + q.x * sc, z: C0.z + q.z * sc, whole: q.whole }; }), toolPx: () => (st.toolList || []).map(q => { const sc = center.group.scale.x; return px({ x: C0.x + q.x * sc, z: C0.z + q.z * sc }); }), toolUse: i => { st.toolSpot = st.toolList && st.toolList[i]; if (st.toolSpot) doTool(); }, toolPeek: i => { st.toolSpot = st.toolList && st.toolList[i]; if (st.toolSpot && st.toolSpot.sp.b && st.toolSpot.ghost === undefined) st.toolSpot.ghost = ghostOf(st.toolSpot); dirty = true; }, toolWorths: () => (st.toolList || []).map(q => q.worth), toolGhost: () => st.toolSpot && st.toolSpot.ghost, debugMorph: () => morph && { bend: !!morph.bend, f: morph.bend && [morph.bend.f0, morph.bend.f1, morph.bend.F.x1, morph.bend.F.r, morph.bend.F.dir, morph.bend.F.cx, morph.bend.F.cz], n: morph.bend && morph.bend.bodies.length, u0: morph.bend && morph.bend.U0.size, end: morph.end, pts: Array.from(morph.cur.entries()).filter(e => e[0].el !== 'H').map(e => [+e[1].x.toFixed(1), +e[1].z.toFixed(1), morph.from.has(e[0]) ? 1 : 0]) }, debugFold: () => center && center.at.fold && { r: center.at.fold.r, dir: center.at.fold.dir }, debugShape: (smi, o) => { o = o || {}; let m = RX.fromSmiles(smi); RX.reopen(m); let spots = 0; if (o.tool) { const sp = RX.tools.spots(m, o.tool, P.RULE.atoms); spots = sp.length; if (!sp.length) return { none: true, spots: 0 }; const t = P.toolTry(m, o.tool, sp[Math.min(sp.length - 1, o.spot || 0)]); if (!t) return { none: true, spots }; m = t; } if (o.hom) { const hs = P.HOMS[o.hom].spots(m, { m, self: P.SELF0, kinds: [], left: {} }); if (!hs.length) return { none: true, spots: 0 }; const t = P.homTry(m, o.hom, hs[Math.min(hs.length - 1, o.spot || 0)]); if (!t) return { none: true, spots: hs.length }; m = t; spots = hs.length; } let z = 0; for (let i = 0; i < (o.zips || 0); i++) { const c = RX.CARDS.lactol; if (!c.find(m).length) break; c.apply(m); z++; } const cg = caged(m, archesOf(m)); if (cg && m.settle) m.settle(300); setAlign(m); const t0 = performance.now(), mm = buildMol(m, null, false), ms = performance.now() - t0, hv = []; mm.balls.forEach((b, a) => { if (a.el !== 'H') hv.push(a); }); let worst = 1, near = 9, lo = 1e9, hi = -1e9, zl = 1e9, zh = -1e9; const bd = new Set(); mm.sticks.forEach(q => { if (q.a.el === 'H' || q.b.el === 'H') return; const A = mm.at.get(q.a), B = mm.at.get(q.b), r = Math.hypot(A.x - B.x, A.z - B.z) / 1.55; if (Math.abs(r - 1) > Math.abs(worst - 1)) worst = r; bd.add(q.a); }); const bonded = (a, b) => mm.sticks.some(q => (q.a === a && q.b === b) || (q.a === b && q.b === a)); for (let i = 0; i < hv.length; i++) { const A = mm.at.get(hv[i]); lo = Math.min(lo, A.x); hi = Math.max(hi, A.x); zl = Math.min(zl, A.z); zh = Math.max(zh, A.z); for (let j = i + 1; j < hv.length; j++) { const B = mm.at.get(hv[j]), d = Math.hypot(A.x - B.x, A.z - B.z) / 1.55; if (d < near && !bonded(hv[i], hv[j])) near = d; } } const sc = fitMain(mm); if (o.show) { freeMol(center); center = mm; SC_MAIN = sc; st.sc = sc; place(mm, C0, sc); mm.groups = groupsOf(mm); mm.ghosts = []; mm.hot = []; dirty = true; } else freeMol(mm); const un = { lo: 1e9, hi: -1e9, zl: 1e9, zh: -1e9 }; if (mm.at.unf) mm.at.unf.forEach(v => { un.lo = Math.min(un.lo, v.x); un.hi = Math.max(un.hi, v.x); un.zl = Math.min(un.zl, v.z); un.zh = Math.max(un.zh, v.z); }); return { uw: +(un.hi - un.lo).toFixed(1), ud: +(un.zh - un.zl).toFixed(1), fr: mm.at.fold ? +mm.at.fold.r.toFixed(1) : 0, worst: +worst.toFixed(3), near: +near.toFixed(3), w: +(hi - lo).toFixed(1), d: +(zh - zl).toFixed(1), sc: +sc.toFixed(2), caged: cg, zips: z, spots, n: hv.length, ms: +ms.toFixed(1) }; }, debugLay: (smi, n) => { const m = RX.fromSmiles(smi); RX.reopen(m); for (let i = 0; i < n; i++) { const c = RX.CARDS.lactol; if (!c.find(m).length) break; c.apply(m); } setAlign(m); const mm = buildMol(m, null, false), out = []; mm.at.forEach((v, a) => { if (a.el !== 'H') out.push((a.bead || a.el) + ' ' + v.x.toFixed(1) + ' ' + v.z.toFixed(1) + ' ' + v.y.toFixed(1)); }); const info = { caged: caged(m, archesOf(m)), arches: archesOf(m).length, flat: mm.flat, beads: mm.beads.length }; freeMol(mm); return { info, out }; }, st, load, pick, next, setHover, takePick, chooseTerm, debugTerm: i => { P.runTerm(run, P.TERMS[i].id); }, debugBare: on => { P.RULE.bare = on !== false; newRun(); }, debugStage: n => { meta.stage = n; if (n < 2) run.noGear = true; }, debugRound: n => { run.round = n; run.beaten = n - 1; showPicks(); }, meta, newRun, showSuppliers, frame, wish: () => doWish(), douse: () => doDouse(), debugKit: ids => { run.gear = ids.slice(); load(); }, debugHom: id => { run.hom = id && P.HOMS[id] ? id : null; if (st.mode === 'play' || st.mode === 'move') load(); else homStand(); }, debugJar: o => { JARK.forEach(k => { if (o && o[k] != null) { meta.jar[k] = Math.max(0, Math.min(P.JAR.full[k], o[k] | 0)); meta.hatched[k] = meta.jar[k] >= P.JAR.full[k]; } }); saveMeta(); dirty = true; return { jar: Object.assign({}, meta.jar), hatched: Object.assign({}, meta.hatched) }; }, debugFeedHom: n => { if (g && g.hom) { g.hom = Object.assign({}, g.hom, { fed: n }); dirty = true; } }, homState: () => ({ hom: g && g.hom ? Object.assign({}, g.hom) : null, wait: !!st.homWait, spots: (st.homList || []).map(q => { const sc = center.group.scale.x; return { x: C0.x + q.x * sc, z: C0.z + q.z * sc, worth: q.worth }; }), at: HOMP, jar: { water: jarOf('water'), h2: jarOf('h2') }, by: Object.assign({}, st.by), opts: homOpts.slice() }), homUse: i => { const it = (st.homList || [])[i || 0]; if (st.homWait && it) doHom(it); }, homTap: () => { if (lining() && g.hom && P.HOMS[g.hom.id].before && !st.homWait && center && center.model === g.m && P.homLit(g)) { homPre(); return true; } return false; }, homSkip: () => homSkip(), chooseHom: i => chooseHom(i), showHoms: () => showHoms(),
    debugG: () => g, debugSelf: ids => { run.self = ids.slice(); }, setOff, fire: doFire, unqueue: doUnqueue, spots: () => ({ fire: FIREP(), bank: BANK, draw: DRAW, step: STEP, lab: LAB.slice(), reroll: REROLL, skip: SKIP, held: [0, 1, 2, 3, 4].map(HELD) }), bank: doBank, redraw: doRedraw, reroll: doReroll, redrawPair: doPair, debugCoined: v => { meta.coined = !!v; dirty = true; }, skip: doSkip, bin: doBin, debugCoins: n => { run.coins = n; dirty = true; }, turn: doTurn, twist: doTwist, canTwist: () => !!twistOpt(), debugTip: id => { st.tip = id; dirty = true; }, debugRack: ids => { run.rack = ids.slice(); load(); }, debugFeed: smi => { run.feed = P.salt(P.modelOf(smi)); run.brief = 'plain'; run.kin = P.kinOf(smi); run.quota = P.runQuota(run, smi, 'plain'); load(); },
    openSupplier, meta,
    chooseBrief,
    state: () => (!g || st.mode === 'pick' || st.mode === 'shop' || st.mode === 'brief' || st.mode === 'terms' || st.mode === 'hom' ? { mode: st.mode, hom: run.hom || null, briefs: briefs.map(b => b.brief + ':' + b.quota + ':' + (b.pays || '')), pair: briefs.map(b => ({ src: b.src, ease: b.ease, coins: b.coins || 0, quota: b.quota })), pairCost: P.pairCost(run), coined: !!meta.coined, pairAt: PAIR, pairX: briefs.map((b, i) => BX(i)), assay: P.assayOf(run), round: run.round, beaten: run.beaten, picks: picks.map(o => o.kind + ':' + o.id), coins: run.coins || 0, rerollCost: P.rerollCost(run), gear: run.gear.slice(), rack: run.rack.slice(), credit: meta.credit, tier: meta.tier } : { mode: st.mode, queue: (g.queue || []).slice(), lining: lining(), firing: !!st.firing, room: P.stepsOf(g) - g.pageSteps, will: st.view ? st.view.kinds.slice() : [], casc: g.casc || 0, self: (g.self || []).slice(), charged: P.charged(g), fork: !!g.chain && st.mode === 'play', canBank: st.mode === 'play' && P.canBank(g), bankGain: P.canBank(g) ? P.bankGain(g) : 0, canRedraw: st.mode === 'play' && P.canRedraw(g), stuck: stuck(), left: Object.assign({}, g.left), rack: (g.rackIds || []).slice(), heavy: P.heavy(g.m), brief: g.brief, round: run.round, beaten: run.beaten, page: g.page, steps: g.pageSteps, offer: g.kinds.slice(), usable: slots.map((s, i) => (s && s.o ? i : -1)).filter(i => i >= 0), conts: slots.map((s, i) => (s && s.o && s.o.cont && g.cur.path.length > 0 ? i : -1)).filter(i => i >= 0), made: P.made(g), coins: run.coins || 0, marks: P.runMarks(st.quota), gear: st.gear.slice(), rare: Object.assign({}, g.rare), places: g.P, rowNum: g.R, extra: g.E, times: P.mult(g), row: g.cur.path.length, best: g.best, quota: st.quota, pass: st.pass, won: !!st.won, call: st.call && st.call.text }) };
  size(); newRun(); requestAnimationFrame(frame);
}
const el = root.document && document.getElementById('schemeapp');
if (el) { const boot = () => start(el); if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('40px Marker'), document.fonts.load('40px Hand')]).then(boot, boot); else boot(); }
})(window);
