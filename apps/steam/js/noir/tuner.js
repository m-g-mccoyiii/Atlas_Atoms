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
  if (o.scanAll) { const now = performance.now(); st.scanned = { ms: true, ir: true, nmr: true }; st.tokens = 0; st.t0 = { ms: now, ir: now, nmr: now }; }
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
  function fillH() {   // put a real hydrogen on every open bond
    let n = 0;
    model.atoms.slice().forEach(a => {
      if (a.el === 'H') return; const sum = model.bondSum(a), tgt = E[a.el].valences.find(v => v >= sum); if (tgt === undefined) return;
      for (let k = 0; k < tgt - sum; k++) { const hh = model.addAtom('H', a.x + (Math.random() - 0.5) * 0.8, a.y + (Math.random() - 0.5) * 0.8, a.z + (Math.random() - 0.5) * 0.8); model.bonds.push({ a, b: hh, order: 1 }); n++; if (box.v) { const p = box.v._screen(a); burst(p.x, p.y, GREEN, 6, 80); } }
    });
    if (n) { sfx.bond(); say(n + ' hydrogen' + (n > 1 ? 's' : '') + ' added'); if (o.onFill) o.onFill(n); } else say('No open bonds to fill');
    refresh();
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
    let nLock = 0;
    order.forEach((it, i) => setTimeout(() => {   // timers, not the render loop, so a background tab still finishes
      if (box.dead || st.snap !== snap) return; snap.shown = i + 1;
      if (it.lock) { st.flash.push({ k: it.k, pos: it.pos, t0: performance.now() }); const li = lightUp(it, nLock++); if (o.onLock && li) o.onLock(nLock - 1, it, li); } else { sfx.click(); if (o.onMiss) o.onMiss(it); }
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
    } else if (sigOk || close) { st.fired = true; if (o.onCheck) o.onCheck({ got, total, solved: true }); celebrate(() => o.onSolved({ assays: st.assays }), o.power ? o.power() : 1); }
    else { say(got + ' of ' + total + ' peaks explained'); if (o.onCheck) o.onCheck({ got, total, solved: false }); } refresh();
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
  const benchCv = h('canvas', { class: 'benchCanvas' }), fxCv = h('canvas', { class: 'fxCv' }), benchWrap = h('div', { class: 'benchWrap' }, benchCv, fxCv), frags = h('div', { class: 'fragrow' });

  // ----- effects: sparks, shockwaves, drifting motes, flash, big title -----
  const GREEN = [125, 255, 176], GOLD = [255, 210, 63], BLUE = [107, 140, 255], rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, a).toFixed(3) + ')';
  const fx = { parts: [], rings: [], floats: [], shake: 0, flash: 0, title: null, titleT: 0, motes: Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), v: 0.01 + Math.random() * 0.03, r: 0.6 + Math.random() * 1.4, a: 0.12 + Math.random() * 0.25 })) };
  const burst = (x, y, c, n, spd) => { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, s = spd * (0.3 + Math.random()); fx.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: 1, decay: 0.9 + Math.random() * 0.9, r: 1.5 + Math.random() * 2.5, c }); } };
  const ring = (x, y, c, r1, dur) => fx.rings.push({ x, y, c, r0: 6, r1, t: 0, dur });
  const floatText = (x, y, text, c, size) => fx.floats.push({ x, y, text, c: c || GOLD, size: size || 22, t: 0, dur: 1.15 });
  const shakeScreen = mag => { fx.shake = Math.max(fx.shake, mag); };
  function drawFx(dt) {
    const w = benchCv.clientWidth, hg = benchCv.clientHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (fxCv.width !== Math.round(w * dpr) || fxCv.height !== Math.round(hg * dpr)) { fxCv.width = Math.round(w * dpr); fxCv.height = Math.round(hg * dpr); }
    const x = fxCv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, hg); x.globalCompositeOperation = 'lighter';
    fx.motes.forEach(m => { m.y -= m.v * dt; if (m.y < 0) { m.y = 1; m.x = Math.random(); } x.fillStyle = rgba(BLUE, m.a); x.beginPath(); x.arc(m.x * w, m.y * hg, m.r, 0, 6.3); x.fill(); });
    fx.rings = fx.rings.filter(r => { r.t += dt; const k = r.t / r.dur; if (k >= 1) return false; x.strokeStyle = rgba(r.c, (1 - k) * 0.85); x.lineWidth = 4 * (1 - k) + 1; x.beginPath(); x.arc(r.x, r.y, r.r0 + k * r.r1, 0, 6.3); x.stroke(); return true; });
    fx.parts = fx.parts.filter(p => { p.life -= dt * p.decay; if (p.life <= 0) return false; p.vy += 80 * dt; p.x += p.vx * dt; p.y += p.vy * dt; x.fillStyle = rgba(p.c, p.life); x.beginPath(); x.arc(p.x, p.y, p.r * p.life + 0.4, 0, 6.3); x.fill(); return true; });
    x.globalCompositeOperation = 'source-over';
    fx.floats = fx.floats.filter(f => {   // score pops: rise, grow, fade
      f.t += dt; const k = f.t / f.dur; if (k >= 1) return false; const pop = k < 0.15 ? 0.6 + k / 0.15 * 0.8 : 1.4 - Math.min(0.4, (k - 0.15) * 0.5);
      x.save(); x.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; x.textAlign = 'center'; x.font = '700 ' + Math.round(f.size * pop) + 'px "Plex Serif", Georgia, serif'; x.lineWidth = 5; x.strokeStyle = 'rgba(8,10,16,.9)'; x.strokeText(f.text, f.x, f.y - k * 70); x.fillStyle = rgba(f.c, 1); x.fillText(f.text, f.x, f.y - k * 70); x.restore(); return true;
    });
    if (fx.shake > 0.3) { benchWrap.style.transform = 'translate(' + ((Math.random() - 0.5) * fx.shake).toFixed(1) + 'px,' + ((Math.random() - 0.5) * fx.shake).toFixed(1) + 'px)'; fx.shake *= Math.pow(0.02, dt); } else if (fx.shake) { fx.shake = 0; benchWrap.style.transform = ''; }
    if (fx.flash > 0) { x.fillStyle = 'rgba(255,255,255,' + fx.flash.toFixed(3) + ')'; x.fillRect(0, 0, w, hg); fx.flash = Math.max(0, fx.flash - dt * 2.2); }
    if (fx.title) {
      fx.titleT += dt; const k = Math.min(1, fx.titleT / 0.35), a = fx.titleT > 1.9 ? Math.max(0, 1 - (fx.titleT - 1.9) / 0.4) : 1;
      x.save(); x.globalAlpha = a; x.textAlign = 'center'; x.fillStyle = '#fff'; x.shadowColor = fx.title.col; x.shadowBlur = 30; x.font = '600 ' + Math.round(26 + 18 * k) + 'px "Plex Serif", Georgia, serif'; x.fillText(fx.title.text, w / 2, hg * 0.18);
      x.shadowBlur = 0; x.font = '500 14px "Plex Mono", monospace'; x.fillStyle = '#cfd3dc'; x.fillText(fx.title.sub, w / 2, hg * 0.18 + 28); x.restore(); if (fx.titleT > 2.4) fx.title = null;
    }
  }
  const centre = atoms => { if (!box.v) return { x: 200, y: 200 }; const ps = atoms.map(a => box.v._screen(a)); return ps.length ? { x: ps.reduce((s, p) => s + p.x, 0) / ps.length, y: ps.reduce((s, p) => s + p.y, 0) / ps.length } : { x: 100, y: 100 }; };
  function involvedAtoms(k, peak) {   // which atoms of the assayed structure make this peak
    const comp = st.snap && st.snap.info && st.snap.info.comp, mine = st.snap && st.snap.mine; if (!comp || !mine) return [];
    if (k === 'ms') return comp.slice();
    const out = [];
    if (k === 'nmr') { const mp = mine.nmr.peaks.find(p => Math.abs(p.shift - peak.shift) <= 0.5 && p.hs === peak.hs); ((mp && mp.atoms) || []).forEach(i => { const a = comp[i]; if (!a) return; out.push(a); model.neighbors(a).forEach(n => { if (n.atom.el === 'H') out.push(n.atom); }); }); return out; }
    const t = bondType(peak.name); if (t) model.bonds.forEach(b => { if (comp.includes(b.a) && b.order === t.order && ((b.a.el === t.a && b.b.el === t.b) || (b.a.el === t.b && b.b.el === t.a))) out.push(b.a, b.b); });
    return out;
  }
  function lightUp(item, idx) {   // a peak locked: the atoms behind it flash on the bench
    const v = box.v; if (!v) return null; const atoms = involvedAtoms(item.k, item.pk); sfx.lock(idx);
    atoms.forEach(a => { v.glow.set(a, 0x2fe08a); const p = v._screen(a); burst(p.x, p.y, GREEN, 7, 90); });
    if (atoms.length) { const c = centre(atoms); ring(c.x, c.y, GREEN, 60, 0.5); }
    setTimeout(() => { if (!st.hover && !st.party) atoms.forEach(a => v.glow.delete(a)); }, 520);
    return { atoms, pos: atoms.length ? centre(atoms) : { x: benchCv.clientWidth / 2, y: benchCv.clientHeight / 2 } };
  }
  function celebrate(done, power) {
    power = power || 1;
    const v = box.v; if (!v) { done(); return; }
    const c = centre(model.atoms); fx.flash = 0.8; sfx.fanfare(); st.party = performance.now(); v.yawVel = 2.4;
    ring(c.x, c.y, GOLD, 220, 1.0); ring(c.x, c.y, GREEN, 150, 0.8); ring(c.x, c.y, BLUE, 280, 1.3); burst(c.x, c.y, GOLD, Math.round(100 * power), 280 + 50 * power); burst(c.x, c.y, GREEN, Math.round(70 * power), 220 + 40 * power); burst(c.x, c.y, BLUE, Math.round(70 * power), 320 + 60 * power); shakeScreen(10 + 8 * power);
    for (let i = 1; i < Math.min(5, power); i++) setTimeout(() => { ring(c.x, c.y, i % 2 ? GOLD : BLUE, 260 + i * 60, 1.0); burst(c.x, c.y, i % 2 ? GREEN : GOLD, 60, 300); shakeScreen(12); sfx.lock(8 + i * 2); }, i * 220);
    fx.title = { text: 'IDENTIFIED', sub: mol.name + '   ' + C.sub(mol.formula), col: '#ffd23f' }; fx.titleT = 0; setTimeout(done, 2600);
  }
  FRAGS.forEach(f => frags.append(h('div', { class: 'frag' + (f.atom ? ' atom' : ''), title: f.atom ? E[f.atom].name : 'Drag onto the bench', onpointerdown: ev => {
    ev.preventDefault(); sfx.click(); let first; const n = st.spawn++, ox = (n % 3 - 1) * 2.2, oy = (Math.floor(n / 3) % 2 - 0.5) * 2;
    if (f.atom) first = model.addAtom(f.atom, ox, oy, 0);
    else { const as = f.atoms.map((el, i) => model.addAtom(el, ox + (i ? Math.cos(i * 1.7) : 0) * 1.1, oy + (i ? Math.sin(i * 1.7) : 0) * 1.1, 0)); f.bonds.forEach(b => model.bonds.push({ a: as[b[0]], b: as[b[1]], order: b[2] })); first = as[0]; }
    box.v.startDrag(first, ev); refresh();
  } }, f.label)));
  const assayBtn = h('button', { class: 'btn red', onclick: assay }, 'Run assay (1 hour)');
  const reportBtn = h('button', { class: 'btn', style: 'display:none;border-color:#e0b04a;color:#e0b04a', onclick: () => { if (st.fired) return; st.fired = true; sfx.stamp(); o.onSolved({ assays: st.assays, anomaly: true }); } }, 'Report anomaly');
  const bench = h('div', { class: 'benchBox' }, h('div', { class: 'benchTitle' }, h('span', null, 'Bench'), h('span', null, 'drag an open atom onto another to bond')), benchWrap, frags,
    h('div', { class: 'row' }, assayBtn, reportBtn, h('button', { class: 'btn', title: 'Put a hydrogen on every open bond', onclick: fillH }, 'Fill with hydrogen'), h('button', { class: 'btn', onclick: () => { model.clear(); st.spawn = 0; refresh(); } }, 'Clear'), h('button', { class: 'btn', onclick: () => { const v = box.v; if (v) { v.yaw = 0.45; v.pitch = 0.55; v.zoom = 58; v.yawVel = v.pitchVel = 0; v.pan.set(0, 0, 0); } } }, 'Reset view'), h('button', { class: 'btn', onclick: reference }, 'Tables')),
    readout, spotEl);
  function reference() {
    sfx.click(); const el = h('div', { class: 'cover' }, h('div', { class: 'sheet' }, h('h2', null, 'Reference tables'), Object.entries(REF).map(([t, rows]) => [h('h3', null, t), h('table', null, rows.map(r => h('tr', null, h('th', null, r[0]), h('td', null, r[1]))))]), h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: () => el.remove() }, 'Close'))));
    el.addEventListener('click', e => { if (e.target === el) el.remove(); }); document.body.append(el);
  }
  tokenEl.textContent = String(st.tokens); hoursEl.textContent = String(o.hours());
  assayBtn.textContent = o.submitLabel || 'Submit for the official check (1 hour)';
  host.append(o.head === false ? '' : h('div', { class: 'tuneHead' }, h('div', null, h('b', null, 'Lab hours left '), hoursEl, '   ', h('b', null, 'Scan tokens '), tokenEl), meterEl), h('div', { class: 'pr' }, left, bench));
  paintVeils();

  requestAnimationFrame(() => {
    if (box.dead) return;
    const v = new AA.Viewer(benchCv, model, { interactive: true, zoom: 58, pitch: 0.55, faces: false, grid: { main: 0x6f8cff, sub: 0x6f8cff, opacity: 0.16 } }); box.v = v;
    v.findTarget = a => {   // pieces snap: any atom you can bond to within ~70px is the target, no precise aiming
      const pa = v._screen(a); let best = null, bd = 1e9;
      for (const b of model.atoms) { if (b === a || !model.canBond(a, b)) continue; const pb = v._screen(b), d = Math.hypot(pa.x - pb.x, pa.y - pb.y); if (d < 70 && d < bd) { bd = d; best = b; } }
      return best;
    };
    v.cb.onDrop = (a, t, e) => {
      const over = document.elementFromPoint(e.clientX, e.clientY);
      if (over && over.closest('.fragrow')) { model.components().find(c => c.includes(a)).forEach(x => model.removeAtom(x)); sfx.click(); refresh(); return; }
      if (t && model.canBond(a, t)) { model.bond(a, t); sfx.bond(); v.pop(a); v.pop(t); const pa = v._screen(a), pt = v._screen(t); burst((pa.x + pt.x) / 2, (pa.y + pt.y) / 2, GREEN, 26, 170); ring((pa.x + pt.x) / 2, (pa.y + pt.y) / 2, GREEN, 55, 0.45); } else if (t) { sfx.bad(); say('No free bond there'); }
      refresh();
    };
    let last = performance.now();
    const loop = now => {
      if (box.dead) return; const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!vibrate(now)) {
        for (let i = 0; i < 4; i++) model.step(0.012);
        model.atoms.forEach(a => { if (a.pinned) return; const cl = (u, m) => Math.max(-m, Math.min(m, u)), x = cl(a.x, 3.2), y = cl(a.y, 2.1), z = cl(a.z, 2); if (x !== a.x) a.vx = 0; if (y !== a.y) a.vy = 0; if (z !== a.z) a.vz = 0; a.x = x; a.y = y; a.z = z; });
      }
      v.render(dt); drawFx(dt);
      if (st.party) { if (now - st.party < 2500) model.atoms.forEach((a, i) => v.glow.set(a, new THREE.Color().setHSL(((now / 1000) * 0.6 + i * 0.07) % 1, 0.9, 0.5).getHex())); else { v.glow.clear(); st.party = 0; } }
      else if (!v.drag && !v.rot && Math.abs(v.yawVel) < 0.05 && !st.vib) v.yaw += dt * 0.18;   // the molecule never sits still
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
    model, st, refresh, assay, celebrate, viewer: () => box.v,
    fx: { burst, ring, floatText, shake: shakeScreen, centre: () => centre(model.atoms), flash: v => { fx.flash = v; }, GREEN, GOLD, BLUE }, scan(k) { if (st.tokens > 0 && !st.scanned[k]) { st.tokens--; st.scanned[k] = true; tokenEl.textContent = String(st.tokens); st.t0[k] = performance.now(); paintVeils(); } },
    destroy() { box.dead = true; cancelAnimationFrame(box.raf); if (box.v) box.v.dispose(); banner.remove(); host.innerHTML = ''; }
  };
}
AA.tuner = { mount };
})(typeof globalThis !== 'undefined' ? globalThis : window);
