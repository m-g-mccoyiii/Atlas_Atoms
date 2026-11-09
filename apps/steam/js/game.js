(function () {
'use strict';
const AA = window.AA, C = AA.chem, S = AA.spectra, E = AA.ELEMENTS, sfx = AA.sfx;
const lib = C.library(), $ = s => document.querySelector(s), app = $('#app');
const steam = window.steam || { achievement: () => Promise.resolve(false) };   // supplied by the Electron preload on Steam

function h(tag, attrs) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v); }
  for (const kid of [].slice.call(arguments, 2).flat()) { if (kid == null || kid === false) continue; el.append(kid.nodeType ? kid : document.createTextNode(kid)); }
  return el;
}

// ---------- save ----------
const SAVE = 'meitner-save-v2';
const save = (() => { try { return Object.assign({ cases: {}, tips: {} }, JSON.parse(localStorage.getItem(SAVE) || '{}')); } catch (e) { return { cases: {}, tips: {} }; } })();
const persist = () => { try { localStorage.setItem(SAVE, JSON.stringify(save)); } catch (e) { /* ignore */ } };
const closed = () => AA.CASES.filter(c => (save.cases[c.id] || {}).stars > 0).length;
const standing = () => AA.CASES.reduce((s, c) => s + ((save.cases[c.id] || {}).score || 0), 0);
function head(crumb) { $('#crumb').textContent = crumb; $('#stats').innerHTML = ''; $('#stats').append('Standing ', h('b', null, String(standing())), '   Files closed ', h('b', null, closed() + '/' + AA.CASES.length)); }
$('#mute').addEventListener('click', e => { sfx.setMuted(!sfx.isMuted()); e.target.textContent = sfx.isMuted() ? 'Sound off' : 'Sound on'; if (!sfx.isMuted()) sfx.click(); });
const stars = n => h('span', null, [0, 1, 2].map(i => h('i', { class: 'star' + (i < n ? '' : ' off') })));

let cleanup = null;
function show(node) { if (cleanup) { cleanup(); cleanup = null; } app.innerHTML = ''; app.append(node); window.scrollTo(0, 0); }

// ============================== case board ==============================
function board() {
  head('Case board');
  const done = closed(), grid = h('div', { class: 'folders' });
  AA.CASES.forEach((c, i) => {
    const rec = save.cases[c.id] || { stars: 0 }, open = i <= done + 1;
    grid.append(h('button', { class: 'folder' + (open ? '' : ' locked'), 'data-no': 'FILE ' + String(i + 1).padStart(2, '0'), disabled: open ? null : 'disabled', onclick: () => { sfx.click(); lab(c); } },
      h('h3', null, c.title), h('div', { class: 'who' }, c.client),
      h('div', { class: 'diff' }, open ? 'Budget: ' + (6 + c.tier) + ' days' : 'Close the earlier files first'),
      rec.stars ? h('div', { style: 'margin-top:6px' }, lib.byId.get(c.id).name + ' · ' + C.sub(lib.byId.get(c.id).formula)) : '',
      rec.stars ? h('div', { class: 'stamp' }, 'Closed') : '', rec.stars ? h('div', { style: 'margin-top:4px' }, stars(rec.stars)) : ''));
  });
  show(h('div', null,
    h('div', { class: 'boardHead' }, h('div', null, h('h1', null, 'Case board'), h('p', null, 'Each file is an unknown sample and a client waiting on an answer. You have a fixed number of days. Every instrument run costs one. Read the printouts, build a structure on the bench, and declare it before the rival lab does.'))),
    grid,
    h('p', { style: 'color:#8f8a78;font-size:12px;margin-top:26px' }, 'Spectra are simulated from textbook rules for teaching. They are not real instrument data.')));
}

// ============================== a case ==============================
const INSTR = [
  { k: 'ms', plate: 'MASS SPECTROMETER', short: 'MASS SPEC', blurb: 'Weighs the molecule and the pieces it breaks into.' },
  { k: 'ir', plate: 'INFRARED SPECTROMETER', short: 'INFRARED', blurb: 'Finds which kinds of bond are present.' },
  { k: 'nmr', plate: 'HYDROGEN NMR', short: 'H NMR', blurb: 'Counts the different kinds of hydrogen.' }
];
const REF = {
  ir: [['O–H, alcohol', 'wide dip, 3200–3550'], ['O–H, carboxylic acid', 'very wide dip, 2500–3300'], ['N–H', '3300–3500'], ['C–H', 'just under 3000'], ['≡C–H', 'sharp, 3300'], ['C≡C', '2100–2260, weak'],
       ['C=O', 'sharp and deep, 1670–1780'], ['C=C', '1620–1680'], ['C–O', '1000–1300'], ['No peaks at all', 'symmetrical molecule or an ionic solid']],
  nmr: [['CH₃ on carbon', '0.9'], ['CH₂ in a chain', '1.3'], ['next to C=O', '2.1–2.7'], ['next to O', '3.3–4.0'], ['alkene H', '5–6'], ['aromatic H', '6.5–8'], ['aldehyde H', '9–10'], ['acid O–H', '10–12'], ['splitting', 'n neighbors give n+1 lines']],
  ms: [['M⁺', 'the tall bar farthest right is usually the whole molecule'], ['M−15', 'lost a CH₃'], ['M−18', 'lost water, common for alcohols'], ['43', 'CH₃CO, common for methyl ketones'], ['77', 'a benzene ring'], ['M+2', 'chlorine or sulfur is present']]
};

function lab(c) {
  const mol = lib.byId.get(c.id), truth = S.describe(mol.smiles), idx = AA.CASES.indexOf(c);
  const st = { days: 6 + c.tier, max: 6 + c.tier, used: 0, runs: {}, papers: [], solved: false, over: false, fit: { ready: false, text: '' }, tip: 0 };
  head('File ' + String(idx + 1).padStart(2, '0') + '  —  ' + c.title);
  const dataFor = quality => quality === 'quick' ? S.degrade(truth) : truth;

  const daysEl = h('div', { class: 'days' }), rack = h('div', { class: 'rack' }), papers = h('div'), stickyHost = h('div'), logEl = h('div', { class: 'log' }), fitEl = h('div', { class: 'fit' }), libEl = h('div', { class: 'lib' });
  const log = msg => { logEl.append(h('div', null, msg)); logEl.scrollTop = logEl.scrollHeight; };
  const labEl = h('div', { class: 'lab' });

  function renderDays() { daysEl.innerHTML = ''; for (let i = 0; i < st.max; i++) daysEl.append(h('span', { class: i < st.used ? 'gone' : '' })); daysEl.append(h('small', null, st.days + ' day' + (st.days === 1 ? '' : 's') + ' left')); }

  // ---------- instruments ----------
  function renderRack() {
    rack.innerHTML = '';
    const lockedOut = st.solved || st.over;
    INSTR.forEach(ins => {
      const run = st.runs[ins.k];
      rack.append(h('div', { class: 'unit' }, h('div', { class: 'plate' }, ins.plate),
        h('div', { class: 'lcd' }, run ? (run.quality === 'quick' ? 'QUICK SCAN ON FILE' : 'HIGH-RES ON FILE') : 'READY', h('br'), ins.blurb),
        h('div', { class: 'keys' },
          !run ? h('button', { class: 'key red', disabled: lockedOut || st.days < 1 ? 'disabled' : null, onclick: () => runInstr(ins, 'quick') }, 'Quick scan', h('small', null, '1 day'))
          : run.quality === 'quick' ? h('button', { class: 'key', disabled: lockedOut || st.days < 1 ? 'disabled' : null, onclick: () => runInstr(ins, 'hires') }, 'High resolution', h('small', null, '1 day'))
          : h('button', { class: 'key', disabled: 'disabled' }, 'Best available'))));
    });
    rack.append(h('div', { class: 'unit' }, h('div', { class: 'plate' }, 'SPECTRAL LIBRARY'), h('div', { class: 'lcd' }, 'Ranks known compounds against the printouts you have.'),
      h('div', { class: 'keys' }, h('button', { class: 'key', disabled: lockedOut || st.days < 1 ? 'disabled' : null, onclick: search }, 'Search library', h('small', null, '1 day')),
        h('button', { class: 'key', onclick: reference }, 'Reference sheet', h('small', null, 'free')))));
  }

  function spend(what) {
    st.days--; st.used++; renderDays(); renderRack();
    if (st.days <= 0 && !st.solved) setTimeout(lose, 500);
  }
  function runInstr(ins, quality) {
    if (st.solved || st.over || st.days < 1) return;
    sfx.click(); sfx.feed(); spend();
    const rec = { k: ins.k, quality, seed: (Math.random() * 1e9) | 0, cv: h('canvas') };
    rec.el = h('figure', { class: 'paper' }, h('header', null, ins.short, h('span', null, (quality === 'quick' ? 'quick scan' : 'high resolution') + '  day ' + st.used)), rec.cv,
      h('figcaption', null, quality === 'quick' ? 'Noisy. Weak peaks and fine splitting are lost.' : 'Clean trace.'));
    if (st.runs[ins.k]) st.runs[ins.k].el.classList.add('old');
    st.runs[ins.k] = rec; st.papers.push(rec);
    if (papers.querySelector('.empty')) papers.innerHTML = '';
    papers.prepend(rec.el);
    log('Day ' + st.used + ': ' + ins.short.toLowerCase() + ', ' + (quality === 'quick' ? 'quick scan.' : 'high resolution.'));
    const t0 = performance.now(), dur = 1100; sfx.pen(dur);
    const frame = now => { const p = Math.min(1, (now - t0) / dur); drawPaper(rec, p); if (p < 1 && document.body.contains(rec.el)) requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
    renderFit();
  }
  function overlayFor(rec) { return st.fit.ready && st.runs[rec.k] === rec ? (rec.quality === 'quick' ? S.degrade(st.fit.desc) : st.fit.desc) : null; }
  function drawPaper(rec, progress) { AA.paper.draw(rec.cv, rec.k, dataFor(rec.quality), { quality: rec.quality, seed: rec.seed, progress, overlay: overlayFor(rec) }); }
  const redrawAll = () => st.papers.forEach(r => drawPaper(r, 1));

  // ---------- fit meter ----------
  function renderFit() {
    fitEl.innerHTML = '';
    fitEl.append(h('div', { class: 'note' }, st.fit.text || ''));
    if (!st.fit.ready) return;
    const ran = INSTR.filter(i => st.runs[i.k]);
    if (!ran.length) { fitEl.append(h('div', { class: 'note' }, 'Run an instrument to see how this compares.')); return; }
    ran.forEach(i => {
      const r = st.runs[i.k], sc = S.compare(dataFor(r.quality), r.quality === 'quick' ? S.degrade(st.fit.desc) : st.fit.desc)[i.k], pct = Math.round(sc * 100);
      fitEl.append(h('div', { class: 'line' }, h('span', null, i.short), h('div', { class: 'track' }, h('div', { style: 'width:' + pct + '%' })), h('b', null, pct + '%')));
    });
  }
  function updateFit() {
    const comps = model.analyze();
    if (!comps.length) st.fit = { ready: false, text: 'The bench is empty. Drag atoms out of the tins.' };
    else if (comps.length > 1) st.fit = { ready: false, text: 'Build one connected molecule. There are ' + comps.length + ' separate pieces.' };
    else {
      const k = comps[0];
      if (k.unhappy.length) st.fit = { ready: false, text: 'Not finished: ' + k.unhappy.length + ' atom' + (k.unhappy.length > 1 ? 's' : '') + ' with open bonds.' };
      else {
        const ix = new Map(k.atoms.map((a, i) => [a, i]));
        const desc = S.describeGraph(k.atoms.map(a => ({ el: a.el })), k.bonds.map(b => ({ a: ix.get(b.a), b: ix.get(b.b), order: b.order })));
        st.fit = { ready: true, desc, mol: k.mol, text: 'Complete: ' + C.sub(k.formula) + (k.mol ? '' : '   (not in the library)') };
      }
    }
    renderFit(); redrawAll();
  }

  // ---------- library search ----------
  function search() {
    if (st.solved || st.over || st.days < 1) return;
    const ran = INSTR.filter(i => st.runs[i.k]);
    if (!ran.length) { log('Library: nothing to match yet. Run an instrument first.'); sfx.bad(); return; }
    sfx.click(); spend();
    const rows = lib.list.map(m => {
      const d = S.describe(m.smiles); let sum = 0;
      ran.forEach(i => { const r = st.runs[i.k]; sum += S.compare(dataFor(r.quality), r.quality === 'quick' ? S.degrade(d) : d)[i.k]; });
      return { m, score: sum / ran.length };
    }).sort((a, b) => b.score - a.score).slice(0, 6);
    libEl.innerHTML = '';
    libEl.append(h('div', { class: 'note', style: 'color:#b9b29d;margin-bottom:4px' }, 'Library ranking from ' + ran.map(i => i.short).join(', ') + ':'));
    rows.forEach(r => libEl.append(h('div', { class: 'item' }, h('span', null, r.m.name + '  ' + C.sub(r.m.formula)), h('b', null, Math.round(r.score * 100) + '%'), h('button', { class: 'btn', onclick: () => loadMol(r.m) }, 'To bench'))));
    log('Day ' + st.used + ': library search. Closest: ' + rows[0].m.name + ' at ' + Math.round(rows[0].score * 100) + '%.');
  }
  function loadMol(m) {
    sfx.click(); const tpl = AA.Model.fromSmilesRelaxed(m.smiles, 3);
    model.clear(); const map = tpl.atoms.map(a => model.addAtom(a.el, a.x, a.y, a.z));
    tpl.bonds.forEach(b => model.bonds.push({ a: map[tpl.atoms.indexOf(b.a)], b: map[tpl.atoms.indexOf(b.b)], order: b.order }));
    updateFit();
  }

  // ---------- declare ----------
  function declare() {
    if (st.solved || st.over) return;
    if (!st.fit.ready) { sfx.bad(); log('Cannot declare: ' + (st.fit.text || 'nothing on the bench.')); return; }
    if (st.fit.mol && st.fit.mol.id === mol.id) { win(); return; }
    sfx.bad(); const sc = S.compare(truth, st.fit.desc), worst = INSTR.slice().sort((a, b) => sc[a.k] - sc[b.k])[0];
    log('Declared ' + (st.fit.mol ? st.fit.mol.name : 'an unlisted compound') + '. Peer review: the ' + worst.short.toLowerCase() + ' does not support it. One day lost.');
    labEl.classList.remove('shake'); void labEl.offsetWidth; labEl.classList.add('shake'); spend();
  }

  // ---------- results ----------
  function cover(sheet) { const el = h('div', { class: 'cover' }, sheet); document.body.append(el); return el; }
  function win() {
    st.solved = true; renderRack();
    const par = 3 + (c.tier >= 3 ? 1 : 0), n = st.used <= par ? 3 : st.used <= par + 2 ? 2 : 1, score = n * 100 + st.days * 10;
    const rec = save.cases[c.id] || { stars: 0, score: 0 }, gain = Math.max(0, score - rec.score);
    save.cases[c.id] = { stars: Math.max(rec.stars, n), score: Math.max(rec.score, score) }; persist(); head('File ' + String(idx + 1).padStart(2, '0') + '  —  ' + c.title);
    sfx.stamp(); sfx.good(); steam.achievement('FIRST_CASE'); if (n === 3) steam.achievement('THREE_STARS'); if (closed() >= AA.CASES.length) steam.achievement('ALL_CASES');
    const next = AA.CASES[idx + 1];
    const el = cover(h('div', { class: 'sheet' }, h('div', { class: 'stamp bigstamp' }, 'Case closed'), h('h2', { style: 'margin-top:14px' }, mol.name + '   ' + C.sub(mol.formula)), h('p', null, mol.real),
      h('table', null, h('tr', null, h('th', null, 'Days used'), h('td', null, st.used + ' of ' + st.max)), h('tr', null, h('th', null, 'Rating'), h('td', null, stars(n))), h('tr', null, h('th', null, 'Standing'), h('td', null, '+' + gain))),
      h('p', { style: 'display:flex;gap:10px;flex-wrap:wrap' }, next ? h('button', { class: 'btn red', onclick: () => { el.remove(); sfx.click(); lab(next); } }, 'Next file') : '', h('button', { class: 'btn paper', onclick: () => { el.remove(); board(); } }, 'Case board'))));
  }
  function lose() {
    if (st.solved || st.over) return; st.over = true; renderRack(); sfx.stamp(); sfx.bad();
    const el = cover(h('div', { class: 'sheet' }, h('div', { class: 'stamp bigstamp' }, 'Scooped'), h('h2', { style: 'margin-top:14px' }, 'The rival lab published first'),
      h('p', null, 'Out of days. ' + c.client + ' went with their answer. The sample was ' + mol.name + '. Look at what the printouts were showing, then try the file again.'),
      h('p', { style: 'display:flex;gap:10px' }, h('button', { class: 'btn red', onclick: () => { el.remove(); lab(c); } }, 'Try again'), h('button', { class: 'btn paper', onclick: () => { el.remove(); board(); } }, 'Case board'))));
  }
  function reference() {
    sfx.click();
    const tbl = (rows) => h('table', null, rows.map(r => h('tr', null, h('th', null, r[0]), h('td', null, r[1]))));
    const el = cover(h('div', { class: 'sheet' }, h('h2', null, 'Reference sheet'), h('p', { style: 'color:#8a7f66;margin-top:0' }, 'Standard textbook values. Real spectra vary.'),
      h('h3', null, 'Infrared (cm-1)'), tbl(REF.ir), h('h3', { style: 'margin-top:10px' }, 'Hydrogen NMR (ppm)'), tbl(REF.nmr), h('h3', { style: 'margin-top:10px' }, 'Mass spectrum'), tbl(REF.ms),
      h('p', null, h('button', { class: 'btn paper', onclick: () => el.remove() }, 'Close'))));
    el.addEventListener('click', e => { if (e.target === el) el.remove(); });
  }

  // ---------- the bench ----------
  const model = new AA.Model(), benchCv = h('canvas', { class: 'benchCanvas' }), tins = h('div', { class: 'tins' }), viewerBox = { v: null, raf: 0, dead: false };
  ['H', 'C', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Na'].forEach(el => tins.append(h('div', { class: 'tin', style: 'background:' + E[el].color + ';color:' + (['H', 'S', 'F', 'Cl'].includes(el) ? '#1c2230' : '#fff'), title: E[el].name + ': makes ' + E[el].valences.join(' or ') + ' bond' + (E[el].valences[0] > 1 ? 's' : ''),
    onpointerdown: ev => { ev.preventDefault(); sfx.click(); const a = model.addAtom(el, 0, 0, 0); viewerBox.v.startDrag(a, ev); } }, el)));
  const benchBox = h('div', { class: 'benchBox' }, h('div', { class: 'benchTitle' }, h('span', null, 'BENCH'), h('span', null, 'drop atoms on atoms to bond')), benchCv, tins,
    h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { model.clear(); updateFit(); } }, 'Clear'), h('button', { class: 'btn', title: 'Put the camera back', onclick: () => { const v = viewerBox.v; if (v) { v.yaw = 0.45; v.pitch = 0.55; v.zoom = 75; v.yawVel = v.pitchVel = 0; v.pan.set(0, 0, 0); } } }, 'Reset view'), h('button', { class: 'btn red', onclick: declare }, 'Declare this structure')), fitEl, libEl);

  const file = h('div', { class: 'file' }, h('h3', null, c.title), h('div', { class: 'who' }, 'Client: ' + c.client), h('p', null, c.story), h('ul', null, c.notes.map(n => h('li', null, n))));
  labEl.append(rack, h('div', { class: 'desk' }, stickyHost, papers), h('div', { class: 'right' }, file, benchBox, logEl));
  papers.append(h('div', { class: 'empty' }, 'Nothing on the desk yet. Run an instrument.'));

  function renderTip() {
    stickyHost.innerHTML = ''; const tips = c.tips || [];
    if (save.tips[c.id] || st.tip >= tips.length) return;
    stickyHost.append(h('div', { class: 'sticky' }, h('b', null, 'Note from the technician'), tips[st.tip],
      h('div', { style: 'margin-top:8px' }, h('button', { class: 'btn paper', onclick: () => { sfx.click(); st.tip++; if (st.tip >= tips.length) { save.tips[c.id] = true; persist(); } renderTip(); } }, st.tip + 1 < tips.length ? 'Next' : 'Got it'))));
  }

  show(h('div', null, h('div', { class: 'labTop' }, h('button', { class: 'btn paper', onclick: () => { sfx.click(); board(); } }, 'Case board'), h('h2', null, 'Case: ' + c.title), daysEl), labEl));
  renderDays(); renderRack(); renderTip(); log('File opened. ' + st.max + ' days to answer.'); updateFit();

  requestAnimationFrame(() => {
    if (viewerBox.dead) return;
    const v = new AA.Viewer(benchCv, model, { interactive: true, zoom: 75, pitch: 0.55, faces: true, grid: { main: 0xffffff, sub: 0xffffff, opacity: 0.2 } }); viewerBox.v = v;
    v.cb.onDrop = (a, t, e) => {
      const over = document.elementFromPoint(e.clientX, e.clientY);
      if (over && over.closest('.tins')) { model.removeAtom(a); updateFit(); return; }
      if (t && model.canBond(a, t)) { model.bond(a, t); sfx.bond(); v.pop(a); v.pop(t); }
      else if (t) { sfx.bad(); log(E[(model.bondSum(a) >= C.maxValence(a.el) ? a : t).el].name + ' has no free bonds left.'); }
      updateFit();
    };
    let last = performance.now();
    const loop = now => { if (viewerBox.dead) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; for (let i = 0; i < 4; i++) model.step(0.012); v.render(dt); viewerBox.raf = requestAnimationFrame(loop); };
    viewerBox.raf = requestAnimationFrame(loop);
  });
  const onResize = () => redrawAll(); window.addEventListener('resize', onResize);
  cleanup = () => { window.removeEventListener('resize', onResize); viewerBox.dead = true; cancelAnimationFrame(viewerBox.raf); if (viewerBox.v) viewerBox.v.dispose(); document.querySelectorAll('.cover').forEach(e => e.remove()); };
}

board();
window.MEITNER = { board, save };
})();
