(function () {
'use strict';
// Proof of concept for the core loop: build with fragments, watch your trace chase the target, peaks lock in.
const AA = window.AA, C = AA.chem, S = AA.spectra, E = AA.ELEMENTS, sfx = AA.sfx, R = AA.rules, lib = C.library();
const $ = s => document.querySelector(s), app = $('#app');

function h(tag, attrs) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v); }
  for (const kid of [].slice.call(arguments, 2).flat()) { if (kid == null || kid === false) continue; el.append(kid.nodeType ? kid : document.createTextNode(kid)); }
  return el;
}
$('#mute').addEventListener('click', e => { sfx.setMuted(!sfx.isMuted()); e.target.textContent = sfx.isMuted() ? 'Sound off' : 'Sound on'; if (!sfx.isMuted()) sfx.click(); });

// ---------- fragments: attach atom is index 0 ----------
const ring = (open, kek) => { const b = []; for (let i = 0; i < 6; i++) b.push([i, (i + 1) % 6, kek[i]]); return b; };
const FRAGS = [
  { id: 'CH3', label: 'CH₃', atoms: ['C', 'H', 'H', 'H'], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]] },
  { id: 'CH2', label: 'CH₂', atoms: ['C', 'H', 'H'], bonds: [[0, 1, 1], [0, 2, 1]] },
  { id: 'OH', label: 'OH', atoms: ['O', 'H'], bonds: [[0, 1, 1]] },
  { id: 'CO', label: 'C=O', atoms: ['C', 'O'], bonds: [[0, 1, 2]] },
  { id: 'COOH', label: 'COOH', atoms: ['C', 'O', 'O', 'H'], bonds: [[0, 1, 2], [0, 2, 1], [2, 3, 1]] },
  { id: 'Ac', label: 'CH₃CO', atoms: ['C', 'O', 'C', 'H', 'H', 'H'], bonds: [[0, 1, 2], [0, 2, 1], [2, 3, 1], [2, 4, 1], [2, 5, 1]] },
  { id: 'NH2', label: 'NH₂', atoms: ['N', 'H', 'H'], bonds: [[0, 1, 1], [0, 2, 1]] },
  { id: 'Ph', label: 'C₆H₅', atoms: ['C', 'C', 'C', 'C', 'C', 'C', 'H', 'H', 'H', 'H', 'H'], bonds: [].concat(ring(0, [2, 1, 2, 1, 2, 1]), [[1, 6, 1], [2, 7, 1], [3, 8, 1], [4, 9, 1], [5, 10, 1]]) },
  { id: 'Ph2', label: 'C₆H₄ (ortho)', atoms: ['C', 'C', 'C', 'C', 'C', 'C', 'H', 'H', 'H', 'H'], bonds: [].concat(ring(0, [1, 2, 1, 2, 1, 2]), [[2, 6, 1], [3, 7, 1], [4, 8, 1], [5, 9, 1]]) },
  { id: 'a-H', label: 'H', atom: 'H' }, { id: 'a-C', label: 'C', atom: 'C' }, { id: 'a-N', label: 'N', atom: 'N' }, { id: 'a-O', label: 'O', atom: 'O' }, { id: 'a-Cl', label: 'Cl', atom: 'Cl' }
];
const PUZZLES = [
  { id: 'water', tokens: 1, brief: 'One scan is free: the mass spectrum. You may also spend one token on a second instrument. Choose.' },
  { id: 'ethanol', tokens: 1, brief: 'Mass 46. Which fragments make that, and where do they go?' },
  { id: 'acetic', tokens: 1, brief: 'Two oxygens. One of the unlit peaks is an acid.' },
  { id: 'acetone', tokens: 1, brief: 'A single hydrogen environment says something about symmetry.' },
  { id: 'aspirin', tokens: 2, brief: 'A ring with two different groups on neighbouring carbons.' }
];
const INSTR = [{ k: 'ms', name: 'Mass spectrum' }, { k: 'ir', name: 'Infrared' }, { k: 'nmr', name: '¹H NMR' }];
const solved = new Set();
let cleanup = null;

function flash(text) { let el = $('.flashline'); if (!el) { el = h('div', { class: 'flashline' }); document.body.append(el); } el.textContent = text; el.classList.add('on'); clearTimeout(flash.t); flash.t = setTimeout(() => el.classList.remove('on'), 1300); }
function head() { $('#stats').innerHTML = 'Solved <b>' + solved.size + '/' + PUZZLES.length + '</b>'; }

function load(pi) {
  if (cleanup) cleanup();
  head();
  const P = PUZZLES[pi], mol = lib.byId.get(P.id), truth = S.describe(mol.smiles);
  const st = { scanned: { ms: true, ir: false, nmr: false }, tokens: P.tokens, mine: null, info: null, won: false, seen: new Set(), spawn: 0, hover: null, vib: null, vibBase: null, flash: [], t0: { ms: performance.now() } };
  const spotEl = h('div', { class: 'spot' }, 'Point at a peak to see which atoms make it.');
  const model = new AA.Model(), box = { v: null, raf: 0, dead: false };
  window.PROTO = window.PROTO || {}; window.PROTO.cur = { model, box, st, refresh };   // handle for testing
  const panels = {}, tokenEl = h('b'), meterBar = h('i'), meterTxt = h('span'), meterWrap = h('div', { class: 'bar' }, meterBar), readout = h('div', { class: 'readout' });

  // ----- the player's molecule, with open bonds filled by hydrogen (like a skeletal drawing) -----
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
      readout.append(h('span', null, 'Your structure'), h('b', null, C.sub(st.mine.formula)), h('span', null, 'Mass'), h('b', null, String(st.mine.ms.M)));
      readout.append(h('span', null, 'Open bonds filled with H'), h('b', null, String(c.caps)));
      const u = R.dou(st.mine.formula); if (u != null) readout.append(h('span', null, 'Unsaturation'), h('b', null, String(u)));
      if (c.pieces > 1) readout.append(h('span', { style: 'color:#ff8a73' }, 'Separate pieces (largest is traced)'), h('b', null, String(c.pieces)));
    } else readout.append(h('span', null, c && c.over ? 'Too many bonds on one atom' : 'Bench is empty'), h('b', null, ''));
    check(); if (st.hover) spotlight();
  }
  function check() {
    if (st.won) return;
    // new locks make a sound
    let total = 0, got = 0, fresh = [];
    INSTR.forEach(i => { if (!st.scanned[i.k]) return; (i.k === 'ms' ? truth.ms.peaks : i.k === 'ir' ? (truth.ir.silent ? [] : truth.ir.peaks) : truth.nmr.peaks).forEach(pk => {
      total++; const key = i.k + '|' + (pk.mz || pk.centre || pk.shift), ok = R.locked(i.k, pk, st.mine); if (ok) { got++; if (!st.seen.has(key)) { st.seen.add(key); fresh.push({ k: i.k, pos: pk.mz || pk.centre || pk.shift }); } } else st.seen.delete(key); }); });
    if (fresh.length) { sfx.good(); flash('Peak locked'); fresh.forEach(f => st.flash.push({ k: f.k, pos: f.pos, t0: performance.now() })); }
    const pct = total ? Math.round(got / total * 100) : 0; meterBar.style.width = pct + '%'; meterTxt.textContent = got + ' of ' + total + ' peaks';
    meterWrap.classList.toggle('full', got === total && total > 0);
    // identified?
    if (!st.mine || !st.info) return;
    const sigOk = (m => m && m.id === P.id)(lib.bySig.get(C.signature(st.info.els, st.info.bonds)));
    const sc = S.compare(truth, st.mine), close = st.mine.formula === truth.formula && INSTR.every(i => sc[i.k] >= 0.97);
    if (sigOk || close) win();
  }
  function win() {
    st.won = true; solved.add(P.id); head(); sfx.stamp(); sfx.good();
    const used = P.tokens - st.tokens, next = PUZZLES[pi + 1];
    document.querySelectorAll('.picker button')[pi].classList.add('done');
    const el = h('div', { class: 'cover' }, h('div', { class: 'sheet' }, h('span', { class: 'verdict good' }, 'Identified'), h('h2', null, mol.name + '   ' + C.sub(mol.formula)), h('p', null, mol.real),
      h('table', null, h('tr', null, h('th', null, 'Extra scans used'), h('td', null, used + ' of ' + P.tokens))),
      h('div', { class: 'row' }, next ? h('button', { class: 'btn red', onclick: () => { el.remove(); load(pi + 1); } }, 'Next sample') : '', h('button', { class: 'btn ghost', onclick: () => el.remove() }, 'Keep playing'))));
    document.body.append(el);
  }

  // ----- point at a peak: which atoms make it, and why it sits where it does -----
  const MASSES = { H: 1, C: 12, N: 14, O: 16, F: 19, Na: 23, P: 31, S: 32, Cl: 35 };
  function explain(k, p) {
    if (k === 'nmr') {
      let s = p.hs + ' hydrogen' + (p.hs > 1 ? 's' : '') + ' (' + p.label + ') at ' + p.shift + ' ppm. The further downfield, the more an electronegative neighbour (O, N, C=O, a ring) has pulled electron density away from them.';
      s += p.exchangeable ? ' O–H and N–H hydrogens swap with the solvent, so they appear as one broad line.' : p.neighbours ? ' ' + p.neighbours + ' hydrogen' + (p.neighbours > 1 ? 's' : '') + ' on the neighbouring carbon split this into ' + (p.neighbours + 1) + ' lines (n + 1).' : ' No hydrogens on the neighbouring carbons, so it stays a single line.';
      return s;
    }
    if (k === 'ir') return p.name + ' near ' + p.centre + ' cm⁻¹. This bond vibrates at that frequency. Lighter atoms and stronger bonds vibrate faster, so O–H and C–H sit high and C=O sits in the middle.' + (/broad/.test(p.shape) ? ' Hydrogen bonding spreads the frequency, which is why the dip is wide.' : '');
    if (/^M⁺/.test(p.label)) return 'm/z ' + p.mz + ': the intact molecule with one electron knocked off. Its mass is the molecular mass.';
    if (/^M\+/.test(p.label)) return 'm/z ' + p.mz + ': a small peak from a heavier isotope (13C, 37Cl, 34S) sitting naturally in the sample.';
    if (/^M−/.test(p.label)) return 'm/z ' + p.mz + ': the molecule broke and lost a piece of mass ' + (truth.ms.M - p.mz) + ' (' + p.label.replace(/^M−/, '') + ').';
    return 'm/z ' + p.mz + ': a fragment ion, ' + p.label + '.';
  }
  const bondType = name => { const m = /([A-Z][a-z]?)\s*([–=≡])\s*([A-Z][a-z]?)/.exec(name || ''); return m ? { a: m[1], b: m[3], order: m[2] === '=' ? 2 : m[2] === '≡' ? 3 : 1 } : null; };
  function endVibration() { if (st.vibBase) { st.vibBase.forEach((p, a) => { a.x = p.x; a.y = p.y; a.z = p.z; a.vx = a.vy = a.vz = 0; }); } st.vib = null; st.vibBase = null; }
  function spotlight() {
    const v = box.v; if (!v) return;
    v.glow.clear(); v.glowBonds.clear(); endVibration();
    const hv = st.hover; if (!hv) { spotEl.textContent = 'Point at a peak to see which atoms make it.'; return; }
    const k = hv.k, peak = hv.peak, comp = st.info && st.info.comp; let note = explain(k, peak);
    if (!st.mine || !comp) note += ' Nothing on the bench makes this signal yet.';
    else if (!R.locked(k, peak, st.mine)) note += ' Your structure does not produce this signal yet.';
    else {
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
    const vb = st.vib; if (!vb) return false;
    const s = Math.sin(now / 1000 * (5 + vb.freq / 450));
    vb.bonds.forEach(b => {
      const A = st.vibBase.get(b.a), B = st.vibBase.get(b.b); let dx = B.x - A.x, dy = B.y - A.y, dz = B.z - A.z; const L = Math.hypot(dx, dy, dz) || 1; dx /= L; dy /= L; dz /= L;
      const ma = MASSES[b.a.el] || 12, mb = MASSES[b.b.el] || 12, wa = mb / (ma + mb), wb = ma / (ma + mb);
      let ux = dx, uy = dy, uz = dz;
      if (vb.bend) { ux = -dy; uy = dx; uz = 0; const n = Math.hypot(ux, uy) || 1; ux /= n; uy /= n; }
      const amp = vb.bend ? 0.28 : 0.2;
      b.a.x = A.x - ux * amp * wa * s; b.a.y = A.y - uy * amp * wa * s; b.a.z = A.z - uz * amp * wa * s;
      b.b.x = B.x + ux * amp * wb * s * (vb.bend ? -1 : 1); b.b.y = B.y + uy * amp * wb * s * (vb.bend ? -1 : 1); b.b.z = B.z + uz * amp * wb * s * (vb.bend ? -1 : 1);
    });
    return true;
  }

  // ----- screen -----
  const picker = h('div', { class: 'picker' }, PUZZLES.map((p, i) => h('button', { class: (i === pi ? 'on ' : '') + (solved.has(p.id) ? 'done' : ''), onclick: () => { sfx.click(); load(i); } }, 'Sample ' + (i + 1))));
  const left = h('div'); left.append(h('div', { class: 'legend' }, h('span', null, h('b', { style: 'border-color:#14161b' }), 'Target'), h('span', null, h('b', { style: 'border-color:#1f4fd8;border-top-style:dashed' }), 'Your structure'), h('span', null, '✓ locked'), h('span', { style: 'color:#d4402b' }, '○ still unexplained')));
  INSTR.forEach(i => {
    const cv = h('canvas'), veil = h('div', { class: 'veil' });
    const pn = h('div', { class: 'panel' }, h('header', null, h('span', null, i.name), h('span', { 'data-cnt': i.k })), cv, veil); panels[i.k] = { cv, veil, el: pn }; left.append(pn);
    cv.addEventListener('mousemove', ev => {
      const r = cv.getBoundingClientRect(), x = ev.clientX - r.left;
      const hit = (cv._hits || []).filter(t => x >= t.x0 && x <= t.x1).sort((a, b) => Math.abs(a.cx - x) - Math.abs(b.cx - x))[0];
      if (hit && !(st.hover && st.hover.peak === hit.peak)) { st.hover = { k: i.k, peak: hit.peak, hit }; spotlight(); }
      else if (!hit && st.hover) { st.hover = null; spotlight(); }
      cv.style.cursor = hit ? 'pointer' : 'default';
    });
    cv.addEventListener('mouseleave', () => { if (st.hover) { st.hover = null; spotlight(); } });
  });
  function paintVeils() {
    INSTR.forEach(i => { const p = panels[i.k]; p.veil.style.display = st.scanned[i.k] ? 'none' : 'grid'; if (!st.scanned[i.k]) { p.veil.innerHTML = ''; p.veil.append(h('div', null, h('span', null, 'Not scanned'), h('button', { class: 'btn', disabled: st.tokens < 1 ? 'disabled' : null, onclick: () => { if (st.tokens < 1) return; st.tokens--; st.scanned[i.k] = true; tokenEl.textContent = String(st.tokens); sfx.feed(); sfx.pen(900); st.t0[i.k] = performance.now(); paintVeils(); check(); } }, st.tokens < 1 ? 'No tokens left' : 'Scan (1 token)'))); } });
  }

  const benchCv = h('canvas', { class: 'benchCanvas' }), frags = h('div', { class: 'fragrow' });
  FRAGS.forEach(f => frags.append(h('div', { class: 'frag' + (f.atom ? ' atom' : ''), title: f.atom ? E[f.atom].name : 'Drag onto the bench, then drag atoms together', onpointerdown: ev => {
    ev.preventDefault(); sfx.click();
    let first;
    const n = st.spawn++, ox = (n % 3 - 1) * 2.4, oy = (Math.floor(n / 3) % 2 - 0.5) * 2.2;
    if (f.atom) first = model.addAtom(f.atom, ox, oy, 0);
    else { const as = f.atoms.map((el, i) => model.addAtom(el, ox + (i ? Math.cos(i * 1.7) : 0) * 1.1, oy + (i ? Math.sin(i * 1.7) : 0) * 1.1, 0)); f.bonds.forEach(b => model.bonds.push({ a: as[b[0]], b: as[b[1]], order: b[2] })); first = as[0]; }
    box.v.startDrag(first, ev); refresh();
  } }, f.label)));
  const bench = h('div', { class: 'benchBox' }, h('div', { class: 'benchTitle' }, h('span', null, 'Bench'), h('span', null, 'drag an open atom onto another to bond')), benchCv, frags,
    h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { model.clear(); st.spawn = 0; refresh(); } }, 'Clear'), h('button', { class: 'btn', onclick: () => { const v = box.v; if (v) { v.yaw = 0.45; v.pitch = 0.55; v.zoom = 75; v.yawVel = v.pitchVel = 0; v.pan.set(0, 0, 0); } } }, 'Reset view')),
    readout, spotEl, h('div', { class: 'hint' }, 'Drop a fragment back on this tray to remove it.'));

  app.innerHTML = '';
  app.append(picker, h('p', { class: 'brief' }, P.brief), h('div', { class: 'meter' }, h('span', null, 'Scan tokens'), tokenEl, h('span')), h('div', { class: 'meter' }, h('span', null, 'Progress'), meterWrap, meterTxt), h('div', { class: 'pr' }, left, bench));
  tokenEl.textContent = String(st.tokens); paintVeils();

  requestAnimationFrame(() => {
    if (box.dead) return;
    const v = new AA.Viewer(benchCv, model, { interactive: true, zoom: 52, pitch: 0.55, faces: true, grid: { main: 0x6f8cff, sub: 0x6f8cff, opacity: 0.16 } }); box.v = v;
    v.cb.onDrop = (a, t, e) => {
      const over = document.elementFromPoint(e.clientX, e.clientY);
      if (over && over.closest('.fragrow')) { model.components().find(c => c.includes(a)).forEach(x => model.removeAtom(x)); sfx.click(); refresh(); return; }
      if (t && model.canBond(a, t)) { model.bond(a, t); sfx.bond(); v.pop(a); v.pop(t); }
      else if (t) { sfx.bad(); flash('No free bond there'); }
      refresh();
    };
    let last = performance.now();
    const loop = now => {
      if (box.dead) return; const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!vibrate(now)) {
        for (let i = 0; i < 4; i++) model.step(0.012);
        model.atoms.forEach(a => { if (a.pinned) return; const cl = (u, m) => Math.max(-m, Math.min(m, u)); const x = cl(a.x, 3.2), y = cl(a.y, 2.1), z = cl(a.z, 2); if (x !== a.x) a.vx = 0; if (y !== a.y) a.vy = 0; if (z !== a.z) a.vz = 0; a.x = x; a.y = y; a.z = z; });
      }
      v.render(dt);
      INSTR.forEach(i => {
        if (!st.scanned[i.k]) return; const cv = panels[i.k].cv;
        AA.paper.draw(cv, i.k, truth, { quality: 'hires', progress: Math.min(1, (now - (st.t0[i.k] || 0)) / 1100), seed: 7, overlay: st.mine, overlayColor: '#1f4fd8', status: (k, pk) => R.locked(k, pk, st.mine) ? 'lock' : 'open', t: now });
        const x = cv.getContext('2d'), ch = cv.clientHeight;
        if (st.hover && st.hover.k === i.k) { x.fillStyle = 'rgba(31,79,216,.12)'; x.fillRect(st.hover.hit.x0, 0, st.hover.hit.x1 - st.hover.hit.x0, ch); }
        st.flash = st.flash.filter(f => { const age = (now - f.t0) / 700; if (age >= 1) return false; if (f.k === i.k) { const hit = (cv._hits || []).find(t => t.pos === f.pos); if (hit) { x.fillStyle = 'rgba(29,122,77,' + (0.4 * (1 - age)).toFixed(3) + ')'; x.fillRect(hit.x0 - age * 14, 0, hit.x1 - hit.x0 + age * 28, ch); } } return true; });
      });
      box.raf = requestAnimationFrame(loop);
    };
    box.raf = requestAnimationFrame(loop); refresh();
  });
  cleanup = () => { box.dead = true; cancelAnimationFrame(box.raf); if (box.v) box.v.dispose(); document.querySelectorAll('.cover').forEach(e => e.remove()); cleanup = null; };
}
load(0);
window.PROTO = Object.assign(window.PROTO || {}, { load });
})();
