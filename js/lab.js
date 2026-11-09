(function (root) {
'use strict';
const AA = root.AA, C = AA.chem, E = AA.ELEMENTS;

const SPECIES = {
  1: { name: 'H₂⁺', order: 0.5, text: 'One electron in the bonding orbital. That gives a weak bond. This molecule is real, but it falls apart quickly in normal air.' },
  2: { name: 'H₂', order: 1, text: 'Two electrons fill the bonding orbital. That is a normal strong bond. Both electrons spend their time between the two nuclei.' },
  3: { name: 'He₂⁺', order: 0.5, text: 'Three electrons: two bonding and one antibonding. The bond is weak but it exists.' },
  4: { name: 'He₂', order: 0, text: 'Two bonding and two antibonding electrons cancel out. Bond order zero means no bond. This is why helium atoms stay alone.' }
};

AA.openLab = function (tab) {
  const U = AA.ui, h = U.h;
  const body = h('div', { class: 'lab' }), content = h('div', { class: 'labContent' });
  const tabs = [['explore', '🔍 Explore molecules'], ['orbitals', '🧪 Orbitals'], ['mo', '⚛ Molecular orbitals'], ['rxn', '⚗ How reactions happen']];
  const bar = h('div', { class: 'seg labTabs' });
  tabs.forEach(t => bar.append(h('button', { 'data-t': t[0], onclick: () => go(t[0]) }, t[1])));
  body.append(bar, content);
  U.modalShell('Molecule Lab', body);

  const mark = k => { U.state.labSeen = U.state.labSeen || {}; if (!U.state.labSeen[k]) { U.state.labSeen[k] = Date.now(); U.save(); U.checkLessons(); } };
  function setView(v) { const d = U.getDetail(); if (d) d.dispose(); U.setDetail(v); }
  function go(t) {
    bar.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
    mark(t); setView(null); content.innerHTML = '';
    if (t === 'explore') explore(); else if (t === 'orbitals') orbitals(); else if (t === 'rxn') reactions(); else mo();
  }
  const seg = (items, cur, cb) => {
    const s = h('div', { class: 'seg' });
    items.forEach(it => { const b = h('button', { class: it[0] === cur ? 'on' : '', onclick: () => { s.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); cb(it[0]); } }, it[1]); s.append(b); });
    return s;
  };
  const legend = () => h('p', { class: 'legend' }, h('span', { class: 'chip' }, h('i', { style: 'background:#4aa8ff' }), 'positive phase'), h('span', { class: 'chip' }, h('i', { style: 'background:#ff8a4a' }), 'negative phase'));

  // ---------- Explore ----------
  function explore() {
    const lib = U.lib, search = h('input', { type: 'search', class: 'search', placeholder: 'Search by name or formula' });
    const grid = h('div', { class: 'grid' }), side = h('div', { class: 'detailSide' }, h('p', { style: 'color:var(--dim)' }, 'Pick a molecule you have found.'));
    function fill() {
      grid.innerHTML = '';
      const q = search.value.trim().toLowerCase();
      lib.list.filter(m => !q || m.name.toLowerCase().includes(q) || m.formula.toLowerCase().includes(q)).forEach(m => {
        const f = !!U.state.found[m.id];
        const card = h('div', { class: 'mcard' + (f ? '' : ' lock') }, h('div', { class: 'ic' }, f ? m.icon : '❓'), f ? m.name : '???', h('small', null, f ? C.sub(m.formula) : 'not found yet'));
        if (f) card.addEventListener('click', () => show(m, card));
        grid.append(card);
      });
    }
    function show(m, card) {
      grid.querySelectorAll('.mcard').forEach(c => c.classList.remove('sel')); card.classList.add('sel');
      side.innerHTML = '';
      const info = AA.MOLINFO[m.id] || {}, t = AA.bondTally(m.smiles);
      const bonds = [t.single && t.single + ' single', t.double && t.double + ' double', t.triple && t.triple + ' triple', t.ionic && t.ionic + ' ionic'].filter(Boolean).join(', ');
      const atoms = Object.keys(m.counts).map(el => m.counts[el] + ' ' + E[el].name.toLowerCase()).join(', ');
      const cv = h('canvas');
      const rows = [['Formula', C.sub(m.formula)], ['Weight', AA.molarMass(m.counts).toFixed(1) + ' (one hydrogen atom is about 1)'], ['Atoms', m.atomCount + ' in all: ' + atoms],
        ['Bonds', bonds], ['Shape', info.shape || '-'], ['At room temperature', info.state || '-']];
      side.append(h('div', { class: 'detail' }, cv,
        seg([['ball', 'Ball & Stick'], ['space', 'Space-filling'], ['lewis', 'Electrons'], ['orbital', 'Orbitals']], U.state.mode, k => { const d = U.getDetail(); if (d) d.mode = k; }),
        h('h3', { style: 'margin:6px 0' }, m.icon + ' ' + m.name),
        h('table', { class: 'facts' }, rows.map(r => h('tr', null, h('th', null, r[0]), h('td', null, r[1])))),
        h('p', null, h('b', null, 'In real life: '), m.real), h('p', null, h('b', null, 'The chemistry: '), m.learn), AA.real.block(m),
        U.speakBtn(() => m.name + '. ' + m.real + ' ' + m.learn), ' ',
        h('button', { class: 'btn', onclick: () => { U.putOnBench(m); document.querySelector('#modal').click(); } }, 'Put on bench')));
      setTimeout(() => { setView(new AA.Viewer(cv, AA.Model.fromSmilesRelaxed(m.smiles, 5), { autoRotate: true, autoFit: true, mode: U.state.mode, faces: U.state.faces })); }, 0);
    }
    search.addEventListener('input', fill);
    content.append(search, h('div', { class: 'atlasWrap' }, grid, side)); fill();
  }

  // ---------- Atomic orbitals, hybrids, pi bonds ----------
  function orbitals() {
    const cv = h('canvas', { class: 'labCanvas' });
    const cap = h('p', { class: 'labText' }), controls = h('div'), mixRow = h('div', { class: 'hidden' });
    const TEXT = {
      '1s': 'The 1s orbital is a ball. The ball holds the place where the electron is found 90 out of 100 times. Each dot is one possible place the electron could be. Hydrogen has one electron here.',
      '2s': 'The 2s orbital is a ball inside a bigger ball. The blue part and the orange part have opposite phase. Between them is a node, a spot where the electron is never found.',
      '2p': 'A p orbital is a dumbbell with two lobes. The lobes have opposite phase, and the nucleus sits at a node in the middle. Carbon, nitrogen and oxygen all use p orbitals.',
      '2p3': 'There are three p orbitals at right angles to each other, one along x, one along y and one along z. Together they reach in every direction.',
      'sp3': 'Carbon mixes its s orbital with its three p orbitals to make four new orbitals called sp³. They point to the corners of a tetrahedron, 109.5° apart. That is why methane is a little pyramid. Slide Mix, or press the button.',
      'pi': 'In ethene each carbon has one p orbital left over. They overlap side by side, above and below the atoms. That cloud is a π bond. The sticks are the σ bonds. The π bond is why the double bond stays flat and does not twist.'
    };
    let scene = null, kind = '1s', view = 'both';
    const mix = h('input', { type: 'range', min: 0, max: 1, step: 0.01, value: 0, class: 'wide' });
    mix.addEventListener('input', () => { if (scene && scene.update) { scene.mix = parseFloat(mix.value); } });
    const play = h('button', { class: 'btn', onclick: () => { let v = parseFloat(mix.value) >= 0.99 ? 0 : parseFloat(mix.value); const id = setInterval(() => { v = Math.min(1, v + 0.02); mix.value = v; if (scene) scene.mix = v; if (v >= 1) clearInterval(id); }, 30); } }, 'Mix!');
    mixRow.append(h('label', null, 'Mix s and p ', mix), ' ', play);
    const viewSeg = seg([['both', 'Shape + dots'], ['shape', 'Shape'], ['dots', 'Dots']], 'both', v => { view = v; if (scene) scene.setView(v); });
    function pick(k) {
      kind = k; cap.textContent = TEXT[k]; mark(k);
      const atomic = ['1s', '2s', '2p', '2p3'].includes(k);
      viewSeg.classList.toggle('hidden', !atomic); mixRow.classList.toggle('hidden', k !== 'sp3');
      if (!scene) return;
      scene.view = view;
      if (atomic) scene.showAtomic(k); else if (k === 'sp3') { mix.value = 0; scene.showHybrid(); } else scene.showPi();
    }
    const kinds = seg([['1s', '1s'], ['2s', '2s'], ['2p', '2p (one)'], ['2p3', '2p (all three)'], ['sp3', 'sp³ hybrid'], ['pi', 'π bond']], '1s', pick);
    controls.append(kinds, viewSeg, mixRow, legend());
    content.append(h('div', { class: 'labGrid' }, cv, h('div', null, controls, cap, U.speakBtn(() => cap.textContent))));
    cap.textContent = TEXT['1s'];
    setTimeout(() => { scene = new AA.OrbitalScene(cv); setView(scene); scene.view = 'both'; scene.showAtomic('1s'); mark('1s'); }, 0);
  }

  // ---------- Molecular orbitals (H2-like) ----------
  function mo() {
    const cv = h('canvas', { class: 'labCanvas' }), dg = h('canvas', { width: 320, height: 300, class: 'diagram' });
    let scene = null, n = 2, sel = 'sigma', d = 1.4, view = 'dots';
    const title = h('h3', { style: 'margin:0' }), txt = h('p', { class: 'labText' }), meter = h('p', { class: 'labText' });
    const dist = h('input', { type: 'range', min: 0.6, max: 5, step: 0.05, value: 1.4, class: 'wide' });
    const nel = h('input', { type: 'range', min: 1, max: 4, step: 1, value: 2, class: 'wide' });
    function refresh() {
      const sp = SPECIES[n];
      title.textContent = sp.name + '  —  bond order ' + sp.order;
      txt.textContent = sp.text;
      const S = AA.overlap1s(d);
      meter.textContent = 'Distance ' + (d * AA.A0).toFixed(2) + ' Å. The two 1s orbitals overlap by ' + Math.round(S * 100) + '%.' + (Math.abs(d - 1.4) < 0.1 ? ' This is the distance H₂ likes best.' : d < 1.0 ? ' Too close: the nuclei push apart.' : d > 3 ? ' Too far: hardly any overlap, so hardly any bond.' : '');
      drawDiagram(); mark('mo'); if (sel === 'sigmastar') mark('sigmastar'); if (n === 4) mark('he2');
      if (scene) scene.showMO(sel, d, view);
    }
    function drawDiagram() {
      const x = dg.getContext('2d'), yAO = 150, yS = 218, yT = 82;
      x.clearRect(0, 0, 320, 300); x.lineCap = 'round';
      x.font = '14px "Trebuchet MS", system-ui, sans-serif'; x.fillStyle = '#9db3cf'; x.textAlign = 'center';
      const line = (x1, y, x2, hi) => { x.beginPath(); x.moveTo(x1, y); x.lineTo(x2, y); x.strokeStyle = hi ? '#3dd6c6' : '#e8f0fb'; x.lineWidth = hi ? 5 : 3; x.stroke(); };
      x.setLineDash([4, 4]); x.strokeStyle = 'rgba(157,179,207,.6)'; x.lineWidth = 1;
      [[90, yAO, 130, yS], [90, yAO, 130, yT], [230, yAO, 190, yS], [230, yAO, 190, yT]].forEach(c => { x.beginPath(); x.moveTo(c[0], c[1]); x.lineTo(c[2], c[3]); x.stroke(); });
      x.setLineDash([]);
      line(25, yAO, 90); line(230, yAO, 295); line(130, yS, 190, sel === 'sigma'); line(130, yT, 190, sel === 'sigmastar');
      x.fillText('1s', 57, yAO + 20); x.fillText('1s', 262, yAO + 20);
      x.textAlign = 'left'; x.fillStyle = '#e8f0fb';
      x.fillText('σ (bonding)', 200, yS + 5); x.fillText('σ* (antibonding)', 200, yT + 5);
      x.save(); x.translate(12, 150); x.rotate(-Math.PI / 2); x.textAlign = 'center'; x.fillStyle = '#9db3cf'; x.fillText('energy →', 0, 0); x.restore();
      x.font = 'bold 26px system-ui, sans-serif'; x.fillStyle = '#ffd23f'; x.textAlign = 'center';
      const arrows = (cx, y, c) => { if (c >= 1) x.fillText('↑', c === 1 ? cx : cx - 12, y - 6); if (c >= 2) x.fillText('↓', cx + 12, y - 6); };
      arrows(160, yS, Math.min(n, 2)); arrows(160, yT, Math.max(0, n - 2));
    }
    nel.addEventListener('input', () => { n = parseInt(nel.value, 10); refresh(); });
    dist.addEventListener('input', () => { d = parseFloat(dist.value); refresh(); });
    const nLabel = h('div', null, h('label', null, 'Electrons: ', nel));
    content.append(h('div', { class: 'labGrid' }, cv, h('div', null, title, dg, nLabel,
      h('label', null, 'Nuclei distance: ', dist), meter,
      seg([['sigma', 'σ bonding orbital'], ['sigmastar', 'σ* antibonding orbital']], 'sigma', k => { sel = k; refresh(); }),
      seg([['dots', 'Dots'], ['both', 'Shape + dots'], ['shape', 'Shape']], 'dots', v => { view = v; refresh(); }), txt, legend(),
      h('p', { class: 'labText' }, 'When two atomic orbitals meet they make two molecular orbitals. Adding them (same phase) makes the bonding orbital, with electrons piled up between the nuclei. Subtracting them (opposite phase) makes the antibonding orbital, which has a node in the middle. Bond order = (bonding electrons − antibonding electrons) ÷ 2.'))));
    setTimeout(() => { scene = new AA.OrbitalScene(cv); setView(scene); refresh(); }, 0);
  }

  // ---------- How reactions happen (collision theory + the energy hill) ----------
  function reactions() {
    const cv = h('canvas', { class: 'simCanvas' }), hill = h('canvas', { width: 640, height: 440, class: 'diagram', style: 'max-width:440px' });
    const stat = h('div', { class: 'labText' }), dhText = h('span', { style: 'color:var(--dim);font-size:14px' });
    const range = (min, max, step, val) => h('input', { type: 'range', min, max, step, value: val, class: 'wide' });
    const heat = range(0, 1, 0.01, 0.4), crowd = range(4, 20, 1, 10), ea = range(1, 8, 0.5, 4), dh = range(-6, 4, 0.5, -4);
    const cat = h('input', { type: 'checkbox' });
    let sim = null, iv = null;
    function redraw() {
      const d = parseFloat(dh.value);
      AA.drawHill(hill, parseFloat(ea.value), d, cat.checked);
      dhText.textContent = d < -0.25 ? 'gives off heat (exothermic)' : d > 0.25 ? 'takes in heat (endothermic)' : 'about the same energy';
    }
    function showStats() {
      if (!sim) return;
      const s = sim.stats, c = sim.counts();
      stat.innerHTML = '';
      stat.append(
        h('div', null, h('b', null, 'Bumps between a red pair and a green pair: '), String(s.coll)),
        h('div', null, '\uD83D\uDFE1 too gentle: ' + s.soft + '   \u00B7   \uD83D\uDD04 wrong way round: ' + s.wrong + '   \u00B7   \u2705 reacted: ' + s.react),
        h('div', null, 'Left to react: ' + c.a + ' red pairs, ' + c.b + ' green pairs. New molecules made: ' + c.ab + '.'),
        h('div', null, 'Reaction speed: ' + sim.rate() + ' reactions in the last 4 seconds.'));
    }
    heat.addEventListener('input', () => { if (sim) sim.setTemp(parseFloat(heat.value)); });
    crowd.addEventListener('input', () => { if (sim) sim.reset(parseInt(crowd.value, 10)); });
    cat.addEventListener('change', () => { if (sim) sim.catalyst = cat.checked; redraw(); });
    ea.addEventListener('input', () => { if (sim) sim.Ea = parseFloat(ea.value); mark('rxn_ea'); redraw(); });
    dh.addEventListener('input', () => { if (sim) sim.dH = parseFloat(dh.value); mark('rxn_dh'); redraw(); });
    const reset = h('button', { class: 'btn', onclick: () => { if (sim) sim.reset(); } }, 'Start again');
    const note = h('p', { class: 'labText' }, 'Red pairs and green pairs zoom around. When a red pair and a green pair bump hard enough and the right way round, they swap partners and make two red-green molecules (A\u2082 + B\u2082 \u2192 2 AB). A water bath keeps the box at one temperature. This is a simplified model: real reactions can have extra steps.');
    content.append(h('div', { class: 'labGrid' },
      h('div', null, cv, stat),
      h('div', null,
        h('div', null, h('label', null, '\uD83C\uDF21 Heat ', heat)), h('div', null, h('label', null, '\uD83D\uDC65 Crowding ', crowd)),
        h('div', null, h('label', null, cat, ' \uD83E\uDDEA Add a catalyst (a helper that lowers the hill)')), h('div', null, reset),
        hill,
        h('div', null, h('label', null, '\u26F0 Hill height ', ea)),
        h('div', null, h('label', null, '\uD83D\uDD25 Energy change ', dh), ' ', dhText),
        note, legendReact())));
    function legendReact() { return h('p', { class: 'legend' }, h('span', { class: 'chip' }, h('i', { style: 'background:#ff4d4d' }), 'A atom'), h('span', { class: 'chip' }, h('i', { style: 'background:#37d67a' }), 'B atom')); }
    redraw();
    setTimeout(() => {
      sim = new AA.ReactionSim(cv, (type, info) => {
        if (type !== 'react') return;
        mark('rxn_react'); if (info.temp >= 0.7) mark('rxn_hot'); if (info.catalyst) mark('rxn_cat');
      });
      const od = sim.dispose.bind(sim);
      sim.dispose = () => { clearInterval(iv); od(); };
      iv = setInterval(showStats, 300);
      setView(sim);
    }, 0);
  }

  go(tab || 'explore');
};
})(typeof globalThis !== 'undefined' ? globalThis : window);
