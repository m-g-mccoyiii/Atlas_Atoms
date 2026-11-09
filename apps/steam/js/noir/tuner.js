(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
const C = AA.chem, S = AA.spectra, E = AA.ELEMENTS, sfx = AA.sfx, R = AA.rules;

function h(tag, attrs) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v); }
  for (const kid of [].slice.call(arguments, 2).flat(Infinity)) { if (kid == null || kid === false) continue; el.append(kid.nodeType ? kid : document.createTextNode(kid)); }
  return el;
}

// ---------- fragments: the attach atom is index 0 ----------
const ring = kek => { const b = []; for (let i = 0; i < 6; i++) b.push([i, (i + 1) % 6, kek[i]]); return b; };
const FRAGS = [
  { label: 'CH₃', atoms: ['C', 'H', 'H', 'H'], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
  { label: 'CH₂', atoms: ['C', 'H', 'H'], bonds: [[0, 1, 1], [0, 2, 1]] },
  { label: 'OH', atoms: ['O', 'H'], bonds: [[0, 1, 1]] },
  { label: 'C=O', atoms: ['C', 'O'], bonds: [[0, 1, 2]] },
  { label: 'COOH', atoms: ['C', 'O', 'O', 'H'], bonds: [[0, 1, 2], [0, 2, 1], [2, 3, 1]] },
  { label: 'CH₃CO', atoms: ['C', 'O', 'C', 'H', 'H', 'H'], bonds: [[0, 1, 2], [0, 2, 1], [2, 3, 1], [2, 4, 1], [2, 5, 1]] },
  { label: 'NH₂', atoms: ['N', 'H', 'H'], bonds: [[0, 1, 1], [0, 2, 1]] },
  { label: 'C₆H₅', atoms: ['C', 'C', 'C', 'C', 'C', 'C', 'H', 'H', 'H', 'H', 'H'], bonds: [].concat(ring([2, 1, 2, 1, 2, 1]), [[1, 6, 1], [2, 7, 1], [3, 8, 1], [4, 9, 1], [5, 10, 1]]) },
  { label: 'C₆H₄ (ortho)', atoms: ['C', 'C', 'C', 'C', 'C', 'C', 'H', 'H', 'H', 'H'], bonds: [].concat(ring([1, 2, 1, 2, 1, 2]), [[2, 6, 1], [3, 7, 1], [4, 8, 1], [5, 9, 1]]) },
  { label: 'H', atom: 'H' }, { label: 'C', atom: 'C' }, { label: 'N', atom: 'N' }, { label: 'O', atom: 'O' }, { label: 'Cl', atom: 'Cl' }
];
const INSTR = [{ k: 'ms', name: 'Mass spectrum' }, { k: 'ir', name: 'Infrared' }, { k: 'nmr', name: '¹H NMR' }];
const MASSES = { H: 1, C: 12, N: 14, O: 16, F: 19, Na: 23, P: 31, S: 32, Cl: 35 };
const MULT = { s: 'a single line', d: '2 lines', t: '3 lines', q: '4 lines', m: 'many lines' };
const REF = {
  'Infrared (cm⁻¹)': [['O–H alcohol', 'broad, 3200–3550'], ['O–H acid', 'very broad, 2500–3300'], ['N–H', '3300–3500'], ['C–H', 'just under 3000'], ['C=O', 'sharp, strong, 1670–1780'], ['C=C', '1620–1680'], ['C–O', '1000–1300'], ['No peaks', 'symmetrical molecule']],
  '¹H NMR (ppm)': [['CH₃ on carbon', '0.9'], ['CH₂ in a chain', '1.3'], ['next to C=O', '2.1–2.7'], ['next to O', '3.3–4.0'], ['aromatic H', '6.5–8'], ['acid O–H', '10–12'], ['splitting', 'n neighbours give n+1 lines']],
  'Mass spectrum': [['M⁺', 'strong peak at the highest mass: the intact molecule'], ['M−15', 'lost CH₃'], ['M−17', 'lost OH'], ['M−18', 'lost H₂O'], ['M−29', 'lost C₂H₅ or CHO'], ['M−45', 'lost COOH'], ['M+2', 'chlorine or sulfur']]
};

// opts: { target: molecule id, tokens, hours() -> number, spend() -> bool, onSolved({assays}), label }
function mount(host, o) {
  const lib = C.library(), mol = lib.byId.get(o.target), truth = S.describe(mol.smiles);
  if (o.anomaly) { truth.nmr.peaks.push({ shift: o.anomaly.shift, hs: o.anomaly.hs, mult: 's', label: 'unassigned', exchangeable: false, neighbours: 0, atoms: [], anomaly: true }); truth.nmr.total += o.anomaly.hs; }   // a signal no structure can make
  const st = { scanned: { ms: true, ir: false, nmr: false }, tokens: o.tokens || 1, mine: null, info: null, snap: null, assays: 0, busy: false, fired: false, spawn: 0, hover: null, vib: null, vibBase: null, flash: [], t0: { ms: performance.now() } };
  const model = new AA.Model(), box = { v: null, raf: 0, dead: false };
  const panels = {}, tokenEl = h('b'), hoursEl = h('b'), meterEl = h('span', null, 'No assay yet'), readout = h('div', { class: 'readout' }), spotEl = h('div', { class: 'spot' }, 'Point at a peak on a printout.'), banner = h('div', { class: 'flashline' });
  host.append(banner);

  const peaksOf = k => k === 'ms' ? truth.ms.peaks : k === 'ir' ? (truth.ir.silent ? [] : truth.ir.peaks) : truth.nmr.peaks;
  const say = t => { banner.textContent = t; banner.classList.add('on'); clearTimeout(say.t); say.t = setTimeout(() => banner.classList.remove('on'), 1500); };

  // ----- the player's molecule; open bonds are filled with hydrogen, like a skeletal drawing -----
  function capped() {
    let best = null;
    model.components().forEach(c => { const heavy = c.filter(a => a.el !== 'H').length; if (heavy && (!best || heavy > best.heavy || (heavy === best.heavy && c.length > best.atoms.length))) best = { atoms: c, heavy }; });
    if (!best) return null;
    const els = best.atoms.map(a => a.el), idx = new Map(best.atoms.map((a, i) => [a, i])), bonds = []; let caps = 0, over = false;
    model.bonds.forEach(b => { if (idx.has(b.a)) bonds.push({ a: idx.get(b.a), b: idx.get(b.b), order: b.order }); });
    best.atoms.forEach((a, i) => {
      const sum = model.bondSum(a), vs = E[a.el].valences, tgt = vs.find(v => v >= sum);
      if (tgt === undefined) { over = true; return; }
      for (let k = 0; k < tgt - sum; k++) { els.push('H'); bonds.push({ a: i, b: els.length - 1, order: 1 }); caps++; }
    });
    return { els, bonds, caps, over, comp: best.atoms, pieces: model.components().filter(c => c.some(a => a.el !== 'H')).length };
  }
  function refresh() {
    const c = capped(); st.info = c; st.mine = null;
    if (c && !c.over) { try { st.mine = S.describeGraph(c.els.map(el => ({ el })), c.bonds); } catch (e) { st.mine = null; } }
    readout.innerHTML = '';
    if (st.mine) {
      readout.append(h('span', null, 'Your structure'), h('b', null, C.sub(st.mine.formula)), h('span', null, 'Mass'), h('b', null, String(st.mine.ms.M)), h('span', null, 'Open bonds filled with H'), h('b', null, String(c.caps)));
      const u = R.dou(st.mine.formula); if (u != null) readout.append(h('span', null, 'Unsaturation'), h('b', null, String(u)));
      if (c.pieces > 1) readout.append(h('span', { style: 'color:#ff8a73' }, 'Separate pieces (largest used)'), h('b', null, String(c.pieces)));
    } else readout.append(h('span', null, c && c.over ? 'Too many bonds on one atom' : 'Bench is empty'), h('b', null, ''));
    const now = c && !c.over ? C.signature(c.els, c.bonds) : '';
    if (st.snap && !st.busy && now !== st.snap.sig) readout.append(h('span', { style: 'color:#e0b04a' }, 'You changed the structure since the last assay'), h('b', null, ''));
    if (st.hover) spotlight();
  }

  // ----- assay: the only way to learn how close you are -----
  function assay() {
    if (st.busy || st.fired) return;
    if (!st.mine) { say('Build a structure first'); sfx.bad(); return; }
    if (o.hours() < 1 || !o.spend()) { say('No lab hours left'); sfx.bad(); return; }
    hoursEl.textContent = String(o.hours()); st.assays++;
    const order = []; INSTR.forEach(i => { if (st.scanned[i.k]) peaksOf(i.k).forEach(pk => order.push({ k: i.k, pk, pos: pk.mz || pk.centre || pk.shift, lock: R.locked(i.k, pk, st.mine) })); });
    const snap = { mine: st.mine, info: st.info, sig: C.signature(st.info.els, st.info.bonds), t0: performance.now(), order, shown: 0 }; st.snap = snap; st.busy = true; sfx.feed();
    meterEl.textContent = 'Assay ' + st.assays + ' running';
    order.forEach((it, i) => setTimeout(() => {   // timers, not the render loop, so a background tab still finishes
      if (box.dead || st.snap !== snap) return; snap.shown = i + 1;
      if (it.lock) { sfx.good(); st.flash.push({ k: it.k, pos: it.pos, t0: performance.now() }); } else sfx.click();
      if (snap.shown === order.length) finishAssay();
    }, 350 + i * 170));
  }
  const lockedItem = pk => st.snap && st.snap.order.find(x => x.pk === pk);
  function finishAssay() {
    const s = st.snap, got = s.order.filter(x => x.lock).length, total = s.order.length; st.busy = false;
    meterEl.textContent = 'Assay ' + st.assays + ': ' + got + ' of ' + total + ' peaks explained';
    const sigOk = (m => m && m.id === o.target)(lib.bySig.get(C.signature(s.info.els, s.info.bonds)));
    const sc = S.compare(truth, s.mine), close = s.mine.formula === truth.formula && INSTR.every(i => sc[i.k] >= 0.97);
    const open = s.order.filter(x => !x.lock);
    if (o.anomaly) {   // the sample matches your structure except for one signal no structure can make: that is a finding of its own
      if (open.length === 1 && open[0].pk.anomaly) { reportBtn.style.display = ''; say('One signal is still unexplained. Report it.'); }
      else { reportBtn.style.display = 'none'; say(got + ' of ' + total + ' peaks explained'); }
    } else if (sigOk || close) { st.fired = true; setTimeout(() => o.onSolved({ assays: st.assays }), 900); }
    else say(got + ' of ' + total + ' peaks explained'); refresh();
  }

  // ----- pointing at a peak -----
  function observe(k, p) {
    if (k === 'nmr') return p.hs + ' hydrogen' + (p.hs > 1 ? 's' : '') + ' at ' + p.shift + ' ppm, splitting into ' + (MULT[p.mult] || 'a single line') + '.';
    if (k === 'ir') return 'A ' + p.shape + ' dip at ' + p.centre + ' cm⁻¹. Build something that absorbs there, then assay.';
    return 'm/z ' + p.mz + ', ' + p.rel + '% of the tallest peak.' + (p.mz === truth.ms.M ? '' : '');
  }
  function explain(k, p) {
    if (k === 'nmr') {
      let s = p.hs + ' hydrogen' + (p.hs > 1 ? 's' : '') + ' (' + p.label + ') at ' + p.shift + ' ppm. The further downfield, the more an electronegative neighbour (O, N, C=O, a ring) has pulled electron density away from them.';
      s += p.exchangeable ? ' O–H and N–H hydrogens swap with the solvent, so they give one broad line.' : p.neighbours ? ' ' + p.neighbours + ' hydrogen' + (p.neighbours > 1 ? 's' : '') + ' on the neighbouring carbon split it into ' + (p.neighbours + 1) + ' lines (n + 1).' : ' No hydrogens on the neighbouring carbons, so it stays a single line.';
      return s;
    }
    if (k === 'ir') return p.name + ' near ' + p.centre + ' cm⁻¹. The bond vibrates at that frequency. Lighter atoms and stronger bonds vibrate faster.' + (/broad/.test(p.shape) ? ' Hydrogen bonding spreads the frequency, so the dip is wide.' : '');
    if (/^M⁺/.test(p.label)) return 'm/z ' + p.mz + ': the intact molecule with one electron removed. Its mass is the molecular mass.';
    if (/^M\+/.test(p.label)) return 'm/z ' + p.mz + ': a small peak from a heavier isotope (13C, 37Cl or 34S) present naturally in the sample.';
    if (/^M−/.test(p.label)) return 'm/z ' + p.mz + ': the molecule broke and lost a piece of mass ' + (truth.ms.M - p.mz) + ' (' + p.label.replace(/^M−/, '') + ').';
    return 'm/z ' + p.mz + ': a fragment ion, ' + p.label + '.';
  }
  const bondType = name => { const m = /([A-Z][a-z]?)\s*([–=≡])\s*([A-Z][a-z]?)/.exec(name || ''); return m ? { a: m[1], b: m[3], order: m[2] === '=' ? 2 : m[2] === '≡' ? 3 : 1 } : null; };
  function endVibration() { if (st.vibBase) st.vibBase.forEach((p, a) => { a.x = p.x; a.y = p.y; a.z = p.z; a.vx = a.vy = a.vz = 0; }); st.vib = null; st.vibBase = null; }
  function spotlight() {
    const v = box.v; if (!v) return;
    v.glow.clear(); v.glowBonds.clear(); endVibration();
    const hv = st.hover; if (!hv) { spotEl.textContent = 'Point at a peak on a printout.'; return; }
    const k = hv.k, peak = hv.peak, item = lockedItem(peak), comp = st.info && st.info.comp;
    if (!(item && item.lock)) { spotEl.textContent = observe(k, peak) + (item ? ' Your last assay did not explain it.' : ''); return; }
    let note = explain(k, peak);
    if (st.mine && comp && R.locked(k, peak, st.mine)) {
      const BLUE = 0x3a6bff;
      if (k === 'ms') comp.forEach(a => v.glow.set(a, 0x2a4a99));
      else if (k === 'nmr') { const mp = st.mine.nmr.peaks.find(p => Math.abs(p.shift - peak.shift) <= 0.5 && p.hs === peak.hs); ((mp && mp.atoms) || []).forEach(i => { const a = comp[i]; if (!a) return; v.glow.set(a, BLUE); model.neighbors(a).forEach(n => { if (n.atom.el === 'H') v.glow.set(n.atom, BLUE); }); }); }
      else {
        const t = bondType(peak.name), hit = [];
        if (t) model.bonds.forEach(b => { if (comp.includes(b.a) && b.order === t.order && ((b.a.el === t.a && b.b.el === t.b) || (b.a.el === t.b && b.b.el === t.a))) { hit.push(b); v.glowBonds.set(b, BLUE); v.glow.set(b.a, BLUE); v.glow.set(b.b, BLUE); } });
        if (hit.length) { st.vib = { bonds: hit, bend: /bend/.test(peak.name), freq: peak.centre }; st.vibBase = new Map(); hit.forEach(b => [b.a, b.b].forEach(a => st.vibBase.set(a, { x: a.x, y: a.y, z: a.z }))); note += ' Watch the highlighted bond vibrate.'; }
      }
    }
    spotEl.textContent = note;
  }
  function vibrate(now) {
    const vb = st.vib; if (!vb) return false; const s = Math.sin(now / 1000 * (5 + vb.freq / 450));
    vb.bonds.forEach(b => {
      const A = st.vibBase.get(b.a), B = st.vibBase.get(b.b); let dx = B.x - A.x, dy = B.y - A.y, dz = B.z - A.z; const L = Math.hypot(dx, dy, dz) || 1; dx /= L; dy /= L; dz /= L;
      const ma = MASSES[b.a.el] || 12, mb = MASSES[b.b.el] || 12, wa = mb / (ma + mb), wb = ma / (ma + mb); let ux = dx, uy = dy, uz = dz, sg = 1;
      if (vb.bend) { ux = -dy; uy = dx; uz = 0; const n = Math.hypot(ux, uy) || 1; ux /= n; uy /= n; sg = -1; }
      const amp = vb.bend ? 0.28 : 0.2;
      b.a.x = A.x - ux * amp * wa * s; b.a.y = A.y - uy * amp * wa * s; b.a.z = A.z - uz * amp * wa * s;
      b.b.x = B.x + ux * amp * wb * s * sg; b.b.y = B.y + uy * amp * wb * s * sg; b.b.z = B.z + uz * amp * wb * s * sg;
    });
    return true;
  }

  // ----- screen -----
  const left = h('div'); left.append(h('div', { class: 'legend' }, h('span', null, h('b', { style: 'border-color:#14161b' }), 'Sample'), h('span', null, h('b', { style: 'border-color:#1f4fd8;border-top-style:dashed' }), 'Your structure at the last assay'), h('span', null, '✓ explained'), h('span', { style: 'color:#d4402b' }, '○ not explained')));
  INSTR.forEach(i => {
    const cv = h('canvas'), veil = h('div', { class: 'veil' });
    const pn = h('div', { class: 'panel' }, h('header', null, h('span', null, i.name)), cv, veil); panels[i.k] = { cv, veil }; left.append(pn);
    cv.addEventListener('mousemove', ev => {
      const r = cv.getBoundingClientRect(), x = ev.clientX - r.left, hit = (cv._hits || []).filter(t => x >= t.x0 && x <= t.x1).sort((a, b) => Math.abs(a.cx - x) - Math.abs(b.cx - x))[0];
      if (hit && !(st.hover && st.hover.peak === hit.peak)) { st.hover = { k: i.k, peak: hit.peak, hit }; spotlight(); } else if (!hit && st.hover) { st.hover = null; spotlight(); }
      cv.style.cursor = hit ? 'pointer' : 'default';
    });
    cv.addEventListener('mouseleave', () => { if (st.hover) { st.hover = null; spotlight(); } });
  });
  function paintVeils() {
    INSTR.forEach(i => { const p = panels[i.k]; p.veil.style.display = st.scanned[i.k] ? 'none' : 'grid'; if (st.scanned[i.k]) return; p.veil.innerHTML = '';
      p.veil.append(h('div', null, h('span', null, 'Not scanned'), h('button', { class: 'btn', disabled: st.tokens < 1 ? 'disabled' : null, onclick: () => { if (st.tokens < 1) return; st.tokens--; st.scanned[i.k] = true; tokenEl.textContent = String(st.tokens); sfx.feed(); sfx.pen(900); st.t0[i.k] = performance.now(); paintVeils(); } }, st.tokens < 1 ? 'No tokens left' : 'Scan (1 token)'))); });
  }
  const benchCv = h('canvas', { class: 'benchCanvas' }), frags = h('div', { class: 'fragrow' });
  FRAGS.forEach(f => frags.append(h('div', { class: 'frag' + (f.atom ? ' atom' : ''), title: f.atom ? E[f.atom].name : 'Drag onto the bench', onpointerdown: ev => {
    ev.preventDefault(); sfx.click(); let first; const n = st.spawn++, ox = (n % 3 - 1) * 2.2, oy = (Math.floor(n / 3) % 2 - 0.5) * 2;
    if (f.atom) first = model.addAtom(f.atom, ox, oy, 0);
    else { const as = f.atoms.map((el, i) => model.addAtom(el, ox + (i ? Math.cos(i * 1.7) : 0) * 1.1, oy + (i ? Math.sin(i * 1.7) : 0) * 1.1, 0)); f.bonds.forEach(b => model.bonds.push({ a: as[b[0]], b: as[b[1]], order: b[2] })); first = as[0]; }
    box.v.startDrag(first, ev); refresh();
  } }, f.label)));
  const assayBtn = h('button', { class: 'btn red', onclick: assay }, 'Run assay (1 hour)');
  const reportBtn = h('button', { class: 'btn', style: 'display:none;border-color:#e0b04a;color:#e0b04a', onclick: () => { if (st.fired) return; st.fired = true; sfx.stamp(); o.onSolved({ assays: st.assays, anomaly: true }); } }, 'Report anomaly');
  const modeBtns = [['ball', 'Ball and stick'], ['space', 'Space-filling'], ['orbital', 'Orbitals'], ['lewis', 'Electrons']].map(([m, t]) => h('button', { class: 'modebtn' + (m === 'ball' ? ' on' : ''), onclick: e => { if (box.v) box.v.mode = m; modeBtns.forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); sfx.click(); } }, t));
  const bench = h('div', { class: 'benchBox' }, h('div', { class: 'benchTitle' }, h('span', null, 'Bench'), h('span', null, 'drag an open atom onto another to bond')), h('div', { class: 'modes' }, modeBtns), benchCv, frags,
    h('div', { class: 'row' }, assayBtn, reportBtn, h('button', { class: 'btn', onclick: () => { model.clear(); st.spawn = 0; refresh(); } }, 'Clear'), h('button', { class: 'btn', onclick: () => { const v = box.v; if (v) { v.yaw = 0.45; v.pitch = 0.55; v.zoom = 52; v.yawVel = v.pitchVel = 0; v.pan.set(0, 0, 0); } } }, 'Reset view'), h('button', { class: 'btn', onclick: reference }, 'Tables')),
    readout, spotEl);
  function reference() {
    sfx.click(); const el = h('div', { class: 'cover' }, h('div', { class: 'sheet' }, h('h2', null, 'Reference tables'), Object.entries(REF).map(([t, rows]) => [h('h3', null, t), h('table', null, rows.map(r => h('tr', null, h('th', null, r[0]), h('td', null, r[1]))))]), h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: () => el.remove() }, 'Close'))));
    el.addEventListener('click', e => { if (e.target === el) el.remove(); }); document.body.append(el);
  }
  tokenEl.textContent = String(st.tokens); hoursEl.textContent = String(o.hours());
  assayBtn.textContent = 'Submit for the official check (1 hour)';
  host.append(h('div', { class: 'tuneHead' }, h('div', null, h('b', null, 'Lab hours left '), hoursEl, '   ', h('b', null, 'Scan tokens '), tokenEl), meterEl), h('div', { class: 'pr' }, left, bench));
  paintVeils();

  requestAnimationFrame(() => {
    if (box.dead) return;
    const v = new AA.Viewer(benchCv, model, { interactive: true, zoom: 52, pitch: 0.55, faces: false, grid: { main: 0x6f8cff, sub: 0x6f8cff, opacity: 0.16 } }); box.v = v;
    v.findTarget = a => {   // pieces snap: any atom you can bond to within ~70px is the target, no precise aiming
      const pa = v._screen(a); let best = null, bd = 1e9;
      for (const b of model.atoms) { if (b === a || !model.canBond(a, b)) continue; const pb = v._screen(b), d = Math.hypot(pa.x - pb.x, pa.y - pb.y); if (d < 70 && d < bd) { bd = d; best = b; } }
      return best;
    };
    v.cb.onDrop = (a, t, e) => {
      const over = document.elementFromPoint(e.clientX, e.clientY);
      if (over && over.closest('.fragrow')) { model.components().find(c => c.includes(a)).forEach(x => model.removeAtom(x)); sfx.click(); refresh(); return; }
      if (t && model.canBond(a, t)) { model.bond(a, t); sfx.bond(); v.pop(a); v.pop(t); } else if (t) { sfx.bad(); say('No free bond there'); }
      refresh();
    };
    let last = performance.now();
    const loop = now => {
      if (box.dead) return; const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!vibrate(now)) {
        for (let i = 0; i < 4; i++) model.step(0.012);
        model.atoms.forEach(a => { if (a.pinned) return; const cl = (u, m) => Math.max(-m, Math.min(m, u)), x = cl(a.x, 3.2), y = cl(a.y, 2.1), z = cl(a.z, 2); if (x !== a.x) a.vx = 0; if (y !== a.y) a.vy = 0; if (z !== a.z) a.vz = 0; a.x = x; a.y = y; a.z = z; });
      }
      v.render(dt);
      const s = st.snap;
      INSTR.forEach(i => {
        if (!st.scanned[i.k]) return; const cv = panels[i.k].cv;
        AA.paper.draw(cv, i.k, truth, { quality: 'hires', progress: Math.min(1, (now - (st.t0[i.k] || 0)) / 1100), seed: 7, overlay: st.mine, overlayColor: '#1f4fd8', t: now,
          status: (k, pk) => { if (!s) return undefined; const idx = s.order.findIndex(x => x.pk === pk); if (idx < 0 || idx >= s.shown) return undefined; return s.order[idx].lock ? 'lock' : 'open'; } });
        const x = cv.getContext('2d'), ch = cv.clientHeight;
        if (st.hover && st.hover.k === i.k) { x.fillStyle = 'rgba(31,79,216,.12)'; x.fillRect(st.hover.hit.x0, 0, st.hover.hit.x1 - st.hover.hit.x0, ch); }
        st.flash = st.flash.filter(f => { const age = (now - f.t0) / 700; if (age >= 1) return false; if (f.k === i.k) { const hit = (cv._hits || []).find(t => t.pos === f.pos); if (hit) { x.fillStyle = 'rgba(29,122,77,' + (0.4 * (1 - age)).toFixed(3) + ')'; x.fillRect(hit.x0 - age * 14, 0, hit.x1 - hit.x0 + age * 28, ch); } } return true; });
      });
      box.raf = requestAnimationFrame(loop);
    };
    box.raf = requestAnimationFrame(loop); refresh();
  });
  return {
    model, st, refresh, assay, viewer: () => box.v, scan(k) { if (st.tokens > 0 && !st.scanned[k]) { st.tokens--; st.scanned[k] = true; tokenEl.textContent = String(st.tokens); st.t0[k] = performance.now(); paintVeils(); } },
    destroy() { box.dead = true; cancelAnimationFrame(box.raf); if (box.v) box.v.dispose(); banner.remove(); host.innerHTML = ''; }
  };
}
AA.tuner = { mount };
})(typeof globalThis !== 'undefined' ? globalThis : window);
