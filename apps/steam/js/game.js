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
const R = AA.rules, hash = R.hash;

// ---------- save ----------
const SAVE = 'meitner-save-v3';
const save = (() => { try { return Object.assign({ cases: {}, tips: {} }, JSON.parse(localStorage.getItem(SAVE) || '{}')); } catch (e) { return { cases: {}, tips: {} }; } })();
const persist = () => { try { localStorage.setItem(SAVE, JSON.stringify(save)); } catch (e) { /* ignore */ } };
const closed = () => AA.CASES.filter(c => (save.cases[c.id] || {}).stars > 0).length;
const standing = () => AA.CASES.reduce((s, c) => s + ((save.cases[c.id] || {}).score || 0), 0);
function head(crumb) { $('#crumb').textContent = crumb; const s = $('#stats'); s.innerHTML = ''; s.append('Standing ', h('b', null, String(standing())), '   Files closed ', h('b', null, closed() + '/' + AA.CASES.length)); }
$('#mute').addEventListener('click', e => { sfx.setMuted(!sfx.isMuted()); e.target.textContent = sfx.isMuted() ? 'Sound off' : 'Sound on'; if (!sfx.isMuted()) sfx.click(); });
const stars = n => h('span', { class: 'stars' }, [0, 1, 2].map(i => h('span', { class: i < n ? '' : 'off' }, '★')));

let cleanup = null;
function show(node) { if (cleanup) { cleanup(); cleanup = null; } app.innerHTML = ''; app.append(node); window.scrollTo(0, 0); }

// ---------- reading signals (the rules live in rules.js) ----------
const { nameOf, posOf, keyOf, canon, dou, explains } = R;

// ============================== case board ==============================
function board() {
  head('Case board');
  const done = closed(), grid = h('div', { class: 'cases' });
  AA.CASES.forEach((c, i) => {
    const rec = save.cases[c.id] || { stars: 0 }, open = i <= done + 1;
    grid.append(h('button', { class: 'case', disabled: open ? null : 'disabled', onclick: () => { sfx.click(); lab(c); } },
      h('div', { class: 'no' }, 'FILE ' + String(i + 1).padStart(2, '0')), h('h3', null, c.title), h('div', { class: 'who' }, c.client),
      h('div', { class: 'res' }, open ? (rec.stars ? [h('b', null, lib.byId.get(c.id).name), '  ', C.sub(lib.byId.get(c.id).formula), h('br'), stars(rec.stars)] : 'Budget ' + (5 + c.tier) + ' days') : 'Close earlier files first')));
  });
  show(h('div', null,
    h('div', { class: 'boardHead' }, h('h1', null, 'Case board'), h('p', null, 'Each file is an unknown sample. Run instruments (one day each), read the signals, and say what each one means. Then build the molecule that explains all of it.')),
    grid, h('p', { class: 'fine' }, h('a', { href: 'proto.html' }, 'Open the live-tuning prototype (new core loop)')), h('p', { class: 'fine' }, 'Spectra are simulated from textbook rules for teaching. They are not real instrument data.')));
}

// ============================== a case ==============================
const INSTR = [
  { k: 'ms', name: 'Mass spectrometer', short: 'MS', fig: 'Mass spectrum', blurb: 'Electron-impact MS. The mass of the molecule and of the pieces it breaks into.' },
  { k: 'ir', name: 'IR spectrometer', short: 'IR', fig: 'Infrared spectrum', blurb: 'Which bonds are present, from how they vibrate.' },
  { k: 'nmr', name: '¹H NMR', short: 'NMR', fig: '¹H NMR spectrum', blurb: 'Each distinct hydrogen environment, with integral and splitting.' }
];
const REF = {
  ir: [['O–H, alcohol', 'broad, 3200–3550'], ['O–H, carboxylic acid', 'very broad, 2500–3300'], ['N–H', '3300–3500'], ['C–H (sp³)', 'just under 3000'], ['≡C–H', 'sharp, 3300'], ['C≡C', '2100–2260, weak'], ['C=O', 'sharp, strong, 1670–1780'], ['C=C', '1620–1680'], ['C–O', '1000–1300'], ['No peaks', 'symmetrical molecule or ionic solid']],
  nmr: [['CH₃ on carbon', '0.9'], ['CH₂ in a chain', '1.3'], ['next to C=O', '2.1–2.7'], ['next to O', '3.3–4.0'], ['alkene H', '5–6'], ['aromatic H', '6.5–8'], ['aldehyde H', '9–10'], ['acid O–H', '10–12'], ['splitting', 'n neighbours give n+1 lines']],
  ms: [['M⁺', 'highest-mass strong peak: the intact molecule'], ['M+1', '¹³C: about 1.1% of M⁺ per carbon'], ['M−15', 'loss of CH₃'], ['M−18', 'loss of H₂O'], ['M+2', 'chlorine or sulfur present'], ['77', 'phenyl ring'], ['Lost mass 15 / 17 / 18', 'CH₃ / OH / H₂O'], ['Lost mass 29 / 31', 'C₂H₅ or CHO / OCH₃ or CH₂OH'], ['Lost mass 43 / 45', 'C₃H₇ or CH₃CO / COOH or OC₂H₅'], ['Label arithmetic', 'peak m/z = M minus the mass lost']]
};

function lab(c) {
  const mol = lib.byId.get(c.id), truth = S.describe(mol.smiles), idx = AA.CASES.indexOf(c), max = 5 + c.tier;
  // The lab's library holds only some known compounds. For files after the first, the answer is not in it.
  const shelf = lib.list.filter(m => (c.tier === 1 ? true : m.id !== c.id) && hash(c.id + m.id) % 100 < 60);
  const st = { days: max, max, used: 0, runs: {}, papers: [], found: new Map(), mis: 0, solved: false, over: false, fit: { ready: false, text: '' }, tip: 0, M: null };
  head('File ' + String(idx + 1).padStart(2, '0') + '  —  ' + c.title);
  const dataFor = quality => quality === 'quick' ? S.degrade(truth) : truth;

  const daysEl = h('div', { class: 'days' }), instrEl = h('div'), figs = h('div', { class: 'figs' }), nbEl = h('ul', { class: 'nb' }), logEl = h('div', { class: 'log' }), fitEl = h('div', { class: 'fit' }), chkEl = h('div'), libEl = h('div', { class: 'lib' }), tipHost = h('div'), labEl = h('div', { class: 'lab' });
  const log = msg => { logEl.append(h('div', null, msg)); logEl.scrollTop = logEl.scrollHeight; };

  function renderDays() { daysEl.innerHTML = ''; for (let i = 0; i < st.max; i++) daysEl.append(h('span', { class: i < st.used ? 'gone' : '' })); daysEl.append(h('small', null, st.days + ' day' + (st.days === 1 ? '' : 's') + ' left · ' + st.mis + ' misread' + (st.mis === 1 ? '' : 's'))); }

  // ---------- instruments ----------
  function renderInstr() {
    instrEl.innerHTML = ''; const out = st.solved || st.over;
    INSTR.forEach(ins => {
      const run = st.runs[ins.k];
      instrEl.append(h('div', { class: 'instr' }, h('b', null, ins.name), h('div', { class: 'go' },
        !run && ins.k === 'ir' ? h('button', { class: 'btn red', disabled: out || st.days < 1 ? 'disabled' : null, onclick: () => runInstr(ins, 'hires') }, 'Run', h('small', null, '1d'))
        : !run ? h('button', { class: 'btn red', disabled: out || st.days < 1 ? 'disabled' : null, onclick: () => runInstr(ins, 'quick') }, 'Quick scan', h('small', null, '1d'))
        : run.quality === 'quick' ? h('button', { class: 'btn', disabled: out || st.days < 1 ? 'disabled' : null, onclick: () => runInstr(ins, 'hires') }, 'High-res', h('small', null, '1d'))
        : h('button', { class: 'btn ghost', disabled: 'disabled' }, 'Best on file')),
        h('div', { class: 'd' }, run ? h('span', { class: 'st' }, run.quality === 'quick' ? 'Quick scan on file. ' : ins.k === 'ir' ? 'Run on file. ' : 'High resolution on file. ') : '', ins.k === 'ir' ? ins.blurb + ' One setting.' : ins.k === 'ms' ? ins.blurb + ' High-res adds the isotope peaks (M+1 counts carbons).' : ins.blurb + ' High-res resolves the splitting.')));
    });
    instrEl.append(h('div', { class: 'instr' }, h('b', null, 'Spectral library'), h('div', { class: 'go' }, h('button', { class: 'btn', disabled: out || st.days < 1 ? 'disabled' : null, onclick: search }, 'Search', h('small', null, '1d'))),
      h('div', { class: 'd' }, 'This lab holds ' + shelf.length + ' known compounds. The sample may not be one of them.')));
    instrEl.append(h('div', { style: 'margin-top:10px' }, h('button', { class: 'btn ghost', onclick: reference }, 'Reference tables')));
  }
  function spend() { st.days--; st.used++; renderDays(); renderInstr(); if (st.days <= 0 && !st.solved) setTimeout(lose, 600); }
  function runInstr(ins, quality) {
    if (st.solved || st.over || st.days < 1) return;
    sfx.click(); sfx.feed(); spend();
    const rec = { k: ins.k, quality, seed: (Math.random() * 1e9) | 0, cv: h('canvas') };
    rec.cv.addEventListener('click', ev => pick(rec, ev));
    rec.el = h('figure', { class: 'fig' }, h('header', null, h('span', null, 'Fig. ' + (st.papers.length + 1) + '  ' + ins.fig), h('span', null, (quality === 'quick' ? 'quick scan' : 'high resolution') + ' · day ' + st.used)), rec.cv,
      h('figcaption', null, quality === 'quick' ? 'Quick scan: noisy, weak peaks and fine splitting are lost. Click a signal to say what it is.' : 'Clean trace. Click a signal to say what it is.'));
    if (st.runs[ins.k]) st.runs[ins.k].el.classList.add('old');
    st.runs[ins.k] = rec; st.papers.push(rec);
    const empty = figs.querySelector('.empty'); if (empty) empty.remove();
    figs.prepend(rec.el);
    log('Day ' + st.used + ': ' + ins.short + ', ' + (quality === 'quick' ? 'quick scan.' : 'high resolution.'));
    const t0 = performance.now(), dur = 1100; sfx.pen(dur);
    const frame = now => { const p = Math.min(1, (now - t0) / dur); drawPaper(rec, p); if (p < 1 && document.body.contains(rec.el)) requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
    renderFit();
  }
  const overlayFor = rec => st.fit.ready && st.runs[rec.k] === rec ? (rec.quality === 'quick' ? S.degrade(st.fit.desc) : st.fit.desc) : null;
  function drawPaper(rec, progress) { AA.paper.draw(rec.cv, rec.k, dataFor(rec.quality), { quality: rec.quality, seed: rec.seed, progress, overlay: overlayFor(rec), assigned: (k, p) => st.found.has(keyOf(k, p)) }); }
  const redrawAll = () => st.papers.forEach(r => drawPaper(r, 1));

  // ---------- say what a signal is ----------
  let pop = null; const closePop = () => { if (pop) { pop.remove(); pop = null; } };
  const onDown = e => { if (pop && !pop.contains(e.target)) closePop(); };
  function pick(rec, ev) {
    if (st.solved || st.over) return;
    const r = rec.cv.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
    const hit = (rec.cv._hits || []).filter(t => x >= t.x0 && x <= t.x1 && y >= t.y0 && y <= t.y1).sort((a, b) => Math.abs(a.cx - x) - Math.abs(b.cx - x))[0];
    closePop(); if (!hit) return;
    const key = keyOf(hit.k, hit.peak), truthName = canon(hit.k, nameOf(hit.k, hit.peak));
    if (st.found.has(key)) { log('Already in your notebook.'); return; }
    const wrong = new Set(), title = hit.k === 'ms' ? 'm/z ' + hit.peak.mz : hit.k === 'ir' ? hit.peak.centre + ' cm⁻¹' : 'δ ' + hit.peak.shift.toFixed(1) + ' ppm, ' + hit.peak.hs + 'H';
    pop = h('div', { class: 'pop' }, h('h4', null, title + '  —  what is this signal?'));
    R.optionsFor(hit.k, hit.peak, key, truth.ms.M).forEach(o => pop.append(h('button', { class: 'opt', onclick: e => {
      e.stopPropagation(); if (wrong.has(o)) return;
      if (o === truthName) { closePop(); found(hit); }
      else { wrong.add(o); e.currentTarget.classList.add('wrong'); st.mis++; sfx.bad(); renderDays(); }
    } }, o)));
    pop.append(h('button', { class: 'btn ghost', style: 'margin-top:4px', onclick: closePop }, 'Cancel'));
    pop.style.left = Math.min(ev.clientX + 12, window.innerWidth - 320) + 'px'; pop.style.top = Math.max(8, Math.min(ev.clientY + 12, window.innerHeight - 330)) + 'px';
    document.body.append(pop);
  }
  function found(hit) {
    const p = hit.peak, k = hit.k, f = { k, pos: posOf(k, p), name: nameOf(k, p), hs: p.hs, mult: p.mult, kind: '' };
    if (k === 'ms') {
      const dd = dataFor(st.runs.ms.quality).ms, mp = dd.peaks.find(q => q.mz === dd.M);
      if (/^M⁺/.test(f.name)) { f.kind = 'M'; st.M = p.mz; f.text = 'M⁺ = ' + p.mz + '  (molecular mass ' + p.mz + ')'; }
      else if (/^M\+1/.test(f.name) && mp) { const n = Math.round((p.rel / mp.rel) / 0.011); f.kind = 'M1'; f.text = 'M+1 is ' + (p.rel / mp.rel * 100).toFixed(1) + '% of M⁺: about ' + n + ' carbon' + (n === 1 ? '' : 's'); f.n = n; }
      else f.text = 'm/z ' + p.mz + ': ' + f.name;
    } else if (k === 'ir') f.text = f.pos + ' cm⁻¹: ' + f.name;
    else f.text = 'δ ' + f.pos.toFixed(1) + ': ' + f.name + ', ' + p.hs + 'H, ' + p.mult;
    st.found.set(keyOf(k, p), f); sfx.good(); log('Identified: ' + f.text);
    renderNotebook(); renderFit(); redrawAll();
  }
  function renderNotebook() {
    nbEl.innerHTML = '';
    if (!st.found.size) { nbEl.append(h('li', { class: 'none' }, 'Empty. Run an instrument and click a signal.')); return; }
    [...st.found.values()].forEach(f => nbEl.append(h('li', null, h('i', null, f.k.toUpperCase()), f.text, st.fit.ready ? (explains(f, st.fit.desc) ? h('span', { class: 'ok' }, '✓') : h('span', { class: 'no' }, '✗')) : '')));
  }

  // ---------- the bench and its checks ----------
  function renderFit() {
    fitEl.innerHTML = ''; chkEl.innerHTML = '';
    fitEl.append(h('div', { class: 'note' }, st.fit.text || ''));
    renderNotebook();
    if (!st.fit.ready) return;
    const d = st.fit.desc, u = dou(d.formula);
    chkEl.append(h('div', { class: 'chk' }, h('span', null, 'Formula'), h('span', null, C.sub(d.formula)), h('span', null, 'Nominal mass'), h('span', null, String(d.ms.M)),
      u != null ? [h('span', null, 'Unsaturation'), h('span', null, String(u))] : '',
      st.M != null ? [h('span', null, 'Measured M⁺ = ' + st.M), h('span', { class: d.ms.M === st.M ? 'ok' : 'no' }, d.ms.M === st.M ? 'match' : 'no match')] : ''));
    const ran = INSTR.filter(i => st.runs[i.k]);
    ran.forEach(i => {
      const r = st.runs[i.k], sc = S.compare(dataFor(r.quality), r.quality === 'quick' ? S.degrade(d) : d)[i.k], pct = Math.round(sc * 100);
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
        st.fit = { ready: true, desc, mol: k.mol, text: 'Structure complete. Its predicted spectrum is drawn in red over your printouts.' };
      }
    }
    renderFit(); redrawAll();
  }

  // ---------- library ----------
  function search() {
    if (st.solved || st.over || st.days < 1) return;
    const ran = INSTR.filter(i => st.runs[i.k]);
    if (!ran.length) { log('Library: nothing to match yet. Run an instrument first.'); sfx.bad(); return; }
    sfx.click(); spend();
    const rows = shelf.map(m => {
      const d = S.describe(m.smiles); let sum = 0;
      ran.forEach(i => { const r = st.runs[i.k]; sum += S.compare(dataFor(r.quality), r.quality === 'quick' ? S.degrade(d) : d)[i.k]; });
      return { m, score: sum / ran.length };
    }).sort((a, b) => b.score - a.score).slice(0, 5);
    libEl.innerHTML = '';
    libEl.append(h('div', { class: 'note' }, 'Closest of ' + shelf.length + ' known compounds, by ' + ran.map(i => i.short).join(' + ') + ':'));
    rows.forEach(r => libEl.append(h('div', { class: 'item' }, h('span', null, r.m.name + '  ' + C.sub(r.m.formula)), h('b', null, Math.round(r.score * 100) + '%'))));
    libEl.append(h('div', { class: 'note', style: 'margin-top:6px' }, 'A high score is a lead, not an answer. Build it and check.'));
    log('Day ' + st.used + ': library search. Closest: ' + rows[0].m.name + ' at ' + Math.round(rows[0].score * 100) + '%.');
  }

  // ---------- declare ----------
  function declare() {
    if (st.solved || st.over) return;
    if (!st.fit.ready) { sfx.bad(); log('Cannot declare: ' + (st.fit.text || 'nothing on the bench.')); return; }
    if (st.fit.mol && st.fit.mol.id === mol.id) { win(); return; }
    const near = S.compare(truth, st.fit.desc);
    if (c.decide && INSTR.every(i => near[i.k] >= 0.85)) {   // an isomer these instruments cannot tell apart: no day is lost
      sfx.bad(); log('Peer review: that structure fits every signal this lab can measure, and so could another. The client notes decide it. ' + c.decide); return;
    }
    sfx.bad();
    const fails = [...st.found.values()].filter(f => !explains(f, st.fit.desc)), sc = S.compare(truth, st.fit.desc), ran = INSTR.filter(i => st.runs[i.k]);
    const worst = (ran.length ? ran : INSTR).slice().sort((a, b) => sc[a.k] - sc[b.k])[0];
    log('Declared ' + (st.fit.mol ? st.fit.mol.name : 'an unlisted compound') + '. Peer review: ' + (fails.length ? 'it does not explain "' + fails[0].text + '".' : 'the ' + worst.short + ' trace does not agree with it.') + ' One day lost.');
    labEl.classList.remove('shake'); void labEl.offsetWidth; labEl.classList.add('shake'); spend();
  }

  // ---------- results ----------
  function cover(sheet) { const el = h('div', { class: 'cover' }, sheet); document.body.append(el); return el; }
  function win() {
    st.solved = true; renderInstr(); closePop();
    let n = st.used <= 3 ? 3 : st.used <= 5 ? 2 : 1; if (st.mis >= 5) n = Math.max(1, n - 1);
    const score = n * 100 + st.days * 10 - st.mis * 5, rec = save.cases[c.id] || { stars: 0, score: 0 }, gain = Math.max(0, score - rec.score);
    save.cases[c.id] = { stars: Math.max(rec.stars, n), score: Math.max(rec.score, score) }; persist(); head('File ' + String(idx + 1).padStart(2, '0') + '  —  ' + c.title);
    sfx.stamp(); sfx.good(); steam.achievement('FIRST_CASE'); if (n === 3) steam.achievement('THREE_STARS'); if (!st.mis) steam.achievement('CLEAN_READ'); if (closed() >= AA.CASES.length) steam.achievement('ALL_CASES');
    const next = AA.CASES[idx + 1];
    const el = cover(h('div', { class: 'sheet' }, h('span', { class: 'verdict good' }, 'Identified'), h('h2', null, mol.name + '   ' + C.sub(mol.formula)), h('p', null, mol.real),
      h('table', null, h('tr', null, h('th', null, 'Days used'), h('td', null, st.used + ' of ' + st.max)), h('tr', null, h('th', null, 'Misread signals'), h('td', null, String(st.mis))), h('tr', null, h('th', null, 'Rating'), h('td', null, stars(n))), h('tr', null, h('th', null, 'Standing'), h('td', null, '+' + gain))),
      h('div', { class: 'row' }, next ? h('button', { class: 'btn red', onclick: () => { el.remove(); sfx.click(); lab(next); } }, 'Next file') : '', h('button', { class: 'btn ghost', onclick: () => { el.remove(); board(); } }, 'Case board'))));
  }
  function lose() {
    if (st.solved || st.over) return; st.over = true; renderInstr(); closePop(); sfx.stamp(); sfx.bad();
    const el = cover(h('div', { class: 'sheet' }, h('span', { class: 'verdict bad' }, 'Out of days'), h('h2', null, 'The rival lab published first'),
      h('p', null, c.client + ' took their answer. The sample was ' + mol.name + ', ' + C.sub(mol.formula) + '. Go back over the printouts and see which signals pointed to it.'),
      h('div', { class: 'row' }, h('button', { class: 'btn red', onclick: () => { el.remove(); lab(c); } }, 'Try again'), h('button', { class: 'btn ghost', onclick: () => { el.remove(); board(); } }, 'Case board'))));
  }
  function reference() {
    sfx.click();
    const tbl = rows => h('table', null, rows.map(r => h('tr', null, h('th', null, r[0]), h('td', null, r[1]))));
    const el = cover(h('div', { class: 'sheet' }, h('h2', null, 'Reference tables'), h('p', { style: 'color:#6a6f7a;margin-top:0' }, 'Standard textbook values. Real spectra vary with solvent and conditions.'),
      h('h3', null, 'Infrared (cm⁻¹)'), tbl(REF.ir), h('h3', null, '¹H NMR (ppm)'), tbl(REF.nmr), h('h3', null, 'Mass spectrum'), tbl(REF.ms),
      h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: () => el.remove() }, 'Close'))));
    el.addEventListener('click', e => { if (e.target === el) el.remove(); });
  }

  // ---------- the bench ----------
  const model = new AA.Model(), benchCv = h('canvas', { class: 'benchCanvas' }), tins = h('div', { class: 'tins' }), viewerBox = { v: null, raf: 0, dead: false };
  ['H', 'C', 'N', 'O', 'S', 'P', 'F', 'Cl', 'Na'].forEach(el => tins.append(h('div', { class: 'tin', style: 'background:' + E[el].color + ';color:' + (['H', 'S', 'F', 'Cl'].includes(el) ? '#1c2230' : '#fff'), title: E[el].name + ': makes ' + E[el].valences.join(' or ') + ' bond' + (E[el].valences[0] > 1 ? 's' : ''),
    onpointerdown: ev => { ev.preventDefault(); sfx.click(); const a = model.addAtom(el, 0, 0, 0); viewerBox.v.startDrag(a, ev); } }, el)));
  const benchBox = h('div', { class: 'benchBox' }, h('div', { class: 'benchTitle' }, h('span', null, 'Bench'), h('span', null, 'drop an atom on an atom to bond')), benchCv, tins,
    h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { model.clear(); updateFit(); } }, 'Clear'), h('button', { class: 'btn', title: 'Put the camera back', onclick: () => { const v = viewerBox.v; if (v) { v.yaw = 0.45; v.pitch = 0.55; v.zoom = 75; v.yawVel = v.pitchVel = 0; v.pan.set(0, 0, 0); } } }, 'Reset view'), h('button', { class: 'btn red', onclick: declare }, 'Declare this structure')), fitEl, chkEl, libEl);

  const sec = (t, ...kids) => h('section', { class: 'sec' }, h('div', { class: 't' }, h('span', null, t)), kids);
  labEl.append(
    h('div', { class: 'colA' }, sec('Case file', h('p', { class: 'client' }, 'Client: ' + c.client), h('p', { class: 'story' }, c.story), h('ul', { class: 'notes' }, c.notes.map(n => h('li', null, n)))),
      tipHost, sec('Instruments', instrEl), sec('Notebook', nbEl), sec('Log', logEl)),
    h('div', { class: 'colB' }, sec('Printouts', figs)),
    h('div', { class: 'colC' }, benchBox));
  figs.append(h('div', { class: 'empty' }, 'No printouts yet. Run an instrument.'));

  function renderTip() {
    tipHost.innerHTML = ''; const tips = c.tips || [];
    if (save.tips[c.id] || st.tip >= tips.length) return;
    tipHost.append(sec('Technician note', h('p', { style: 'margin:0 0 8px' }, tips[st.tip]), h('button', { class: 'btn ghost', onclick: () => { sfx.click(); st.tip++; if (st.tip >= tips.length) { save.tips[c.id] = true; persist(); } renderTip(); } }, st.tip + 1 < tips.length ? 'Next' : 'Got it')));
  }

  show(h('div', null, h('div', { class: 'labTop' }, h('button', { class: 'btn ghost', onclick: () => { sfx.click(); board(); } }, 'Case board'), h('h2', null, c.title), daysEl), labEl));
  renderDays(); renderInstr(); renderNotebook(); renderTip(); log('File opened. ' + st.max + ' days to answer.'); updateFit();
  document.addEventListener('pointerdown', onDown);

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
  cleanup = () => { window.removeEventListener('resize', onResize); document.removeEventListener('pointerdown', onDown); closePop(); viewerBox.dead = true; cancelAnimationFrame(viewerBox.raf); if (viewerBox.v) viewerBox.v.dispose(); document.querySelectorAll('.cover').forEach(e => e.remove()); };
}

board();
window.MEITNER = { board, save };
})();
