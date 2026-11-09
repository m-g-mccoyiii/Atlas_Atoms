(function () {
'use strict';
const AA = window.AA, E = AA.ELEMENTS, C = AA.chem, Model = AA.Model, Viewer = AA.Viewer;
const $ = s => document.querySelector(s);
const SAVE = 'atlas-atoms-v1';

function h(tag, attrs) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  for (const kid of [].slice.call(arguments, 2).flat()) {
    if (kid == null) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return el;
}

// ---------- state ----------
const state = Object.assign({ found: {}, mode: 'ball', faces: true, mute: false, seenHelp: false }, (() => {
  try { return JSON.parse(localStorage.getItem(SAVE) || '{}'); } catch (e) { return {}; }
})());
function save() { try { localStorage.setItem(SAVE, JSON.stringify(state)); } catch (e) { /* ignore */ } }
const lib = C.library();
const foundCount = () => Object.keys(state.found).length;
const isUnlocked = el => foundCount() >= E[el].unlock;

// ---------- sound ----------
let ac = null;
function tone(f, d, type, v, delay) {
  if (state.mute) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(v || 0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (d || 0.12));
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + (d || 0.12));
  } catch (e) { /* ignore */ }
}
const sfx = {
  bond() { tone(520, 0.1); tone(780, 0.12, 'sine', 0.07, 0.06); },
  found() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'triangle', 0.08, i * 0.1)); },
  bad() { tone(160, 0.18, 'square', 0.05); },
  spark() { [300, 600, 900, 1200].forEach((f, i) => tone(f, 0.15, 'sawtooth', 0.04, i * 0.05)); }
};

// ---------- bench ----------
const bench = new Viewer($('#bench'), new Model(), { interactive: true, mode: state.mode, faces: state.faces });
const model = bench.model;

const CAPTIONS = {
  ball: 'Balls are atoms and sticks are bonds. Dots under an atom are its bonding hands: green dots are used, gold rings are open. Drag empty space to turn the view.',
  space: 'Space-filling: each atom is drawn at its true size, so you see how much room a molecule takes up.',
  orbital: 'Cyan clouds are shared electrons in bonds. Gold lobes are lone pairs. A lone atom shows its s sphere and its three p orbitals.'
};
function setMode(m) {
  state.mode = m; bench.mode = m; save();
  document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  $('#caption').textContent = CAPTIONS[m];
}

let tipTimer = null; const tipSeen = {};
function tip(text, ms) {
  const t = $('#tip'); t.textContent = text; t.classList.add('show');
  clearTimeout(tipTimer); tipTimer = setTimeout(() => t.classList.remove('show'), ms || 7000);
}
function tipOnce(key, text) { if (tipSeen[key]) return; tipSeen[key] = 1; tip(text); }

// ---------- tray ----------
function buildTray() {
  const list = $('#trayList'); list.innerHTML = '';
  for (const el of AA.ELEMENT_ORDER) {
    const d = E[el], open = isUnlocked(el);
    const b = h('div', { class: 'elbtn' + (open ? '' : ' locked'), 'data-el': el },
      h('div', { class: 'dot', style: 'background:' + d.color + ';color:' + (el === 'H' || el === 'S' || el === 'F' || el === 'Cl' ? '#14202e' : '#fff') }, el),
      h('div', { class: 'nm' }, d.name, h('small', null, open ? 'makes ' + d.valences.join(' or ') + (d.valences[0] === 1 && d.valences.length === 1 ? ' bond' : ' bonds') : 'find ' + d.unlock + ' molecules')));
    if (open) b.addEventListener('pointerdown', e => spawnFromTray(el, e));
    list.append(b);
  }
}
function spawnFromTray(el, e) {
  e.preventDefault();
  const a = model.addAtom(el, 0, 0, 0);
  a.fromTray = { x: e.clientX, y: e.clientY, el };
  bench.startDrag(a, e);
  tipOnce('first', 'Drop this atom on top of another atom to bond them. Oxygen makes 2 bonds, carbon makes 4, hydrogen makes 1.');
}

// ---------- bench events ----------
bench.cb.onDrop = function (a, target, e) {
  const over = document.elementFromPoint(e.clientX, e.clientY);
  if (over && over.closest('#tray')) {
    const tr = a.fromTray;
    model.removeAtom(a);
    if (tr && Math.hypot(e.clientX - tr.x, e.clientY - tr.y) < 8) showElement(tr.el);
    analyze();
    return;
  }
  delete a.fromTray;
  if (target) {
    if (model.canBond(a, target)) {
      model.bond(a, target);
      a.z += (Math.random() - 0.5) * 0.3;
      sfx.bond();
      tipOnce('bond', 'Bond made. The dots under each atom count its hands. When every hand is used, the atom smiles.');
    } else {
      sfx.bad();
      const full = model.bondSum(a) >= C.maxValence(a.el) ? a : target;
      const n = C.maxValence(full.el);
      if (model.findBond(a, target) && model.findBond(a, target).order >= 3) tip('Two atoms can share at most three pairs of electrons, which is a triple bond.');
      else tip(E[full.el].name + ' can make up to ' + n + ' bond' + (n > 1 ? 's' : '') + ' and all of them are used. Remove a bond or pick another atom.');
    }
  }
  analyze();
};
bench.cb.onCut = function (b) {
  model.unbond(b);
  [b.a, b.b].forEach(a => { a.vx += (Math.random() - 0.5) * 2; a.vy += (Math.random() - 0.5) * 2; });
  sfx.bad(); analyze();
};

// ---------- analysis ----------
let lastComps = [];
function analyze() {
  const comps = model.analyze();
  lastComps = comps;
  const before = foundCount(), newly = [];
  for (const c of comps) if (c.mol && !state.found[c.mol.id]) { state.found[c.mol.id] = Date.now(); newly.push(c); }
  if (newly.length) {
    save();
    sfx.found();
    newly.forEach(c => bench.burstAtoms(c.atoms, 50));
    showBanner(newly[0].mol, newly.length - 1);
    const now = foundCount();
    const opened = AA.ELEMENT_ORDER.filter(el => E[el].unlock > before && E[el].unlock <= now);
    if (opened.length) setTimeout(() => tip('New atoms unlocked: ' + opened.map(el => E[el].name).join(', ') + '.', 9000), 600);
    buildTray();
  }
  renderBenchList(); renderMission(); renderReactions(); updateCount();
  return comps;
}
function updateCount() { $('#count').textContent = '(' + foundCount() + '/' + lib.list.length + ')'; }

function showBanner(m, more) {
  const b = $('#banner'); b.innerHTML = '';
  b.append(h('h2', null, m.icon + ' You made ' + m.name + '!  ' + C.sub(m.formula)),
    h('p', null, m.real), h('p', null, m.learn),
    more > 0 ? h('p', null, '...and ' + more + ' more molecule' + (more > 1 ? 's' : '') + ' on the bench.') : '',
    h('button', { class: 'btn', onclick: () => b.classList.add('hidden') }, 'Nice!'),
    h('button', { class: 'btn alt', style: 'margin-left:6px', onclick: () => { b.classList.add('hidden'); openAtlas(m.id); } }, 'See in my Atlas'));
  b.classList.remove('hidden');
}

function countChips(counts) {
  return Object.keys(counts).map(el => h('span', { class: 'chip' }, h('i', { style: 'background:' + E[el].color }), counts[el] + ' × ' + el));
}

function renderBenchList() {
  const box = $('#benchList'); box.innerHTML = '';
  if (!lastComps.length) { box.append(h('p', { style: 'color:var(--dim)' }, 'Empty. Drag atoms from the left.')); return; }
  for (const c of lastComps) {
    let status;
    if (c.mol) status = h('span', null, h('span', { class: 'ok' }, '✓ ' + c.mol.name));
    else if (c.unhappy.length) {
      const names = [...new Set(c.unhappy.map(a => E[a.el].name.toLowerCase()))].join(', ');
      status = h('span', { style: 'color:var(--gold)' }, 'Still has open hands (' + names + ').');
    } else if (c.sameFormula) status = h('span', { style: 'color:var(--gold)' }, 'Right atoms, different arrangement. Try connecting them another way.');
    else status = h('span', { style: 'color:var(--dim)' }, 'All hands are used, but this one is not in the Atlas yet.');
    box.append(h('div', { class: 'benchrow' }, h('b', null, C.sub(c.formula)), ' ', status));
  }
}

function currentMission() {
  return lib.list.find(m => !state.found[m.id] && Object.keys(m.counts).every(isUnlocked)) || null;
}
function renderMission() {
  const box = $('#mission'); box.innerHTML = '';
  const m = currentMission();
  box.append(h('h3', null, 'Mission'));
  if (!m) {
    box.append(h('p', null, 'You found every molecule in the Atlas. Try the reactions below, or build your own.'));
  } else {
    box.append(h('p', null, 'Build a molecule with this formula:'), h('div', { class: 'formula' }, C.sub(m.formula)),
      h('div', null, countChips(m.counts)),
      h('p', { style: 'color:var(--dim)' }, 'Every atom has to use all of its hands.'),
      h('button', { class: 'btn alt', onclick: () => openPreview(m) }, 'Show me the shape'));
  }
  box.append(h('div', { class: 'bar' }, h('div', { style: 'width:' + (foundCount() / lib.list.length * 100) + '%' })),
    h('small', { style: 'color:var(--dim)' }, foundCount() + ' of ' + lib.list.length + ' molecules found'));
}

// ---------- element card ----------
function showElement(el) {
  const d = E[el], box = $('#elementCard'); box.innerHTML = ''; box.classList.remove('hidden');
  const cv = h('canvas', { width: 180, height: 180, style: 'display:block;margin:6px auto' });
  box.append(h('button', { class: 'pill', style: 'float:right;padding:2px 8px', onclick: () => box.classList.add('hidden') }, '✕'),
    h('h3', null, d.name + ' (' + el + ')'), cv,
    h('p', null, 'Atomic number ' + d.z + ' · mass ' + d.mass),
    h('p', null, 'Makes ' + d.valences.join(' or ') + ' bond' + (d.valences[d.valences.length - 1] > 1 ? 's' : '') + '. It has ' + d.ve + ' outer electron' + (d.ve > 1 ? 's' : '') + ' (gold dots).'),
    h('p', null, d.fact));
  drawBohr(cv, el);
}
function drawBohr(cv, el) {
  const ctx = cv.getContext('2d'), s = cv.width, c = s / 2, sh = E[el].shells;
  ctx.clearRect(0, 0, s, s);
  sh.forEach((n, i) => {
    const r = 24 + (c - 30) * (i + 1) / sh.length;
    ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(157,179,207,.5)'; ctx.lineWidth = 1; ctx.stroke();
    for (let k = 0; k < n; k++) {
      const a = k / n * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath(); ctx.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = i === sh.length - 1 ? '#ffd23f' : '#9db3cf'; ctx.fill();
    }
  });
  ctx.beginPath(); ctx.arc(c, c, 18, 0, Math.PI * 2); ctx.fillStyle = E[el].color; ctx.fill();
  ctx.fillStyle = '#14202e'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(el, c, c + 1);
}

// ---------- reactions ----------
function rxText(map) {
  return Object.keys(map).map(id => (map[id] > 1 ? map[id] + ' ' : '') + C.sub(lib.byId.get(id).formula)).join(' + ');
}
function chosenFor(rx) {
  const need = Object.assign({}, rx.reactants), chosen = [];
  for (const c of lastComps) if (c.mol && need[c.mol.id] > 0) { need[c.mol.id]--; chosen.push(c); }
  return Object.values(need).some(v => v > 0) ? null : chosen;
}
function renderReactions() {
  const box = $('#reactions'); box.innerHTML = '';
  let any = false;
  for (const rx of AA.REACTIONS) {
    const known = Object.keys(rx.reactants).concat(Object.keys(rx.products)).every(id => state.found[id]);
    if (!known) continue;
    any = true;
    const ready = !!chosenFor(rx);
    box.append(h('div', { class: 'rx' }, h('b', null, rx.name), h('div', { class: 'eq' }, rxText(rx.reactants) + ' → ' + rxText(rx.products)),
      h('small', { style: 'color:var(--dim)' }, rx.real), h('br'),
      h('button', { class: 'btn', style: 'margin-top:4px', onclick: () => spark(rx), ...(ready ? {} : { disabled: 'disabled' }) }, ready ? 'Spark!' : 'Put the molecules on the bench')));
  }
  if (!any) box.append(h('p', { style: 'color:var(--dim)' }, 'Find H₂, O₂ and water to unlock your first reaction. Open My Atlas to put molecules on the bench.'));
}
function spark(rx) {
  const chosen = chosenFor(rx);
  if (!chosen) return;
  const atoms = chosen.flatMap(c => c.atoms), set = new Set(atoms), pool = {};
  atoms.forEach(a => { (pool[a.el] = pool[a.el] || []).push(a); });
  model.bonds = model.bonds.filter(k => !set.has(k.a));
  let cx = 0, cy = 0, cz = 0;
  atoms.forEach(a => { cx += a.x; cy += a.y; cz += a.z; });
  cx /= atoms.length; cy /= atoms.length; cz /= atoms.length;
  const prods = [];
  Object.keys(rx.products).forEach(id => { for (let i = 0; i < rx.products[id]; i++) prods.push(id); });
  const R = 1.2 + 0.8 * Math.sqrt(prods.length);
  prods.forEach((id, i) => {
    const tpl = Model.fromSmilesRelaxed(lib.byId.get(id).smiles, 3);
    const ang = prods.length === 1 ? 0 : i / prods.length * Math.PI * 2;
    const ox = cx + Math.cos(ang) * R, oy = cy + Math.sin(ang) * R;
    const map = tpl.atoms.map(ta => {
      const a = pool[ta.el].pop();
      a.tween = { from: [a.x, a.y, a.z], to: [ox + ta.x, oy + ta.y, cz + ta.z], t: 0 };
      a.pinned = true;
      return a;
    });
    tpl.bonds.forEach(k => model.bonds.push({ a: map[tpl.atoms.indexOf(k.a)], b: map[tpl.atoms.indexOf(k.b)], order: k.order }));
  });
  sfx.spark();
  bench.burstAtoms(atoms, 60);
  tip('Spark! ' + rxText(rx.reactants) + ' → ' + rxText(rx.products) + '. Every atom is still here. Reactions only rearrange atoms, they never make or destroy them.', 12000);
  setTimeout(analyze, 900);
  analyze();
}

// ---------- modals ----------
function modalShell(title, body, onClose) {
  const m = $('#modal'); m.innerHTML = ''; m.classList.remove('hidden');
  const close = () => { m.classList.add('hidden'); m.innerHTML = ''; if (detail) detail = null; if (onClose) onClose(); };
  const sheet = h('div', { class: 'sheet' }, h('button', { class: 'x', onclick: close }, '✕'), h('h2', null, title), body);
  m.append(sheet);
  m.onclick = e => { if (e.target === m) close(); };
  return close;
}
let detail = null;

function detailPane(m, opts) {
  const cv = h('canvas');
  const wrap = h('div', { class: 'detail' }, cv);
  const tpl = Model.fromSmilesRelaxed(m.smiles, 5);
  setTimeout(() => {
    detail = new Viewer(cv, tpl, { autoRotate: true, autoFit: true, mode: state.mode, faces: state.faces });
  }, 0);
  const seg = h('div', { class: 'seg' });
  [['ball', 'Ball & Stick'], ['space', 'Space-filling'], ['orbital', 'Orbitals']].forEach(([k, label]) => {
    const b = h('button', { class: state.mode === k ? 'on' : '', onclick: () => { if (detail) detail.mode = k; seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); } }, label);
    seg.append(b);
  });
  wrap.append(seg);
  wrap.append(h('h3', { style: 'margin:6px 0' }, (opts.preview ? 'Mystery molecule' : m.icon + ' ' + m.name), ' ', h('span', { class: 'formula', style: 'font-size:20px' }, C.sub(m.formula))));
  wrap.append(h('div', null, countChips(m.counts)));
  if (opts.preview) wrap.append(h('p', { style: 'color:var(--dim)' }, 'This is a preview of the shape. Build it yourself to add it to your Atlas.'));
  else {
    wrap.append(h('p', null, h('b', null, 'In real life: '), m.real), h('p', null, h('b', null, 'The chemistry: '), m.learn));
    wrap.append(h('button', { class: 'btn', onclick: () => { putOnBench(m); $('#modal').click(); } }, 'Put on bench'));
  }
  return wrap;
}
function openPreview(m) { modalShell('Show me the shape', detailPane(m, { preview: true })); }

function openAtlas(focusId) {
  const grid = h('div', { class: 'grid' }), side = h('div', { class: 'detailSide' }, h('p', { style: 'color:var(--dim)' }, 'Pick a molecule you found to see it spin.'));
  let selected = null;
  function pick(m, card) {
    grid.querySelectorAll('.mcard').forEach(c => c.classList.remove('sel')); card.classList.add('sel');
    side.innerHTML = ''; side.append(detailPane(m, {}));
  }
  lib.list.forEach(m => {
    const f = !!state.found[m.id];
    const card = h('div', { class: 'mcard' + (f ? '' : ' lock') }, h('div', { class: 'ic' }, f ? m.icon : '❓'), f ? m.name : '???',
      h('small', null, f ? C.sub(m.formula) : (Object.keys(m.counts).every(isUnlocked) ? C.sub(m.formula) : 'needs new atoms')));
    if (f) card.addEventListener('click', () => pick(m, card));
    if (m.id === focusId) selected = [m, card];
    grid.append(card);
  });
  modalShell('My Atlas — ' + foundCount() + ' of ' + lib.list.length + ' found', h('div', { class: 'atlasWrap' }, grid, side));
  if (selected) pick(selected[0], selected[1]);
}

function putOnBench(m) {
  const tpl = Model.fromSmilesRelaxed(m.smiles, 3);
  const c = bench.uncam([(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 3, 0]);
  const map = tpl.atoms.map(a => model.addAtom(a.el, a.x + c[0], a.y + c[1], a.z + c[2]));
  tpl.bonds.forEach(k => model.bonds.push({ a: map[tpl.atoms.indexOf(k.a)], b: map[tpl.atoms.indexOf(k.b)], order: k.order }));
  tip('Added ' + m.name + ' to the bench.');
  analyze();
}

function openHelp() {
  state.seenHelp = true; save();
  modalShell('Welcome to the lab, ' + AA.PLAYER_NAME + '!', h('div', null,
    h('p', null, '1. Drag atoms from the left onto the bench.'),
    h('p', null, '2. Drop one atom on top of another to bond them. Drop them together again to make a double or triple bond.'),
    h('p', null, '3. Each atom has a number of hands (bonds it wants). Fill every hand and the atom smiles.'),
    h('p', null, '4. When a molecule is real and in the Atlas, you discover it and learn where it shows up in real life.'),
    h('p', null, '5. Switch to Orbitals to see shared electrons and lone pairs. Use Cut bond to take molecules apart.'),
    h('p', null, '6. Once you know the right molecules, put them on the bench and press Spark to run a real reaction.'),
    h('button', { class: 'btn', onclick: () => $('#modal').click() }, 'Start building')));
}

// ---------- wiring ----------
document.querySelectorAll('#modes button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
document.querySelectorAll('#tools button').forEach(b => b.addEventListener('click', () => {
  bench.tool = b.dataset.tool;
  document.querySelectorAll('#tools button').forEach(x => x.classList.toggle('on', x === b));
  $('#bench').classList.toggle('cut', bench.tool === 'cut');
  if (bench.tool === 'cut') tip('Click a bond to cut it. A double or triple bond loses one line at a time.');
}));
$('#btnRecenter').addEventListener('click', () => { bench.yaw = 0.45; bench.pitch = 0.25; bench.zoom = 60; });
$('#btnClear').addEventListener('click', () => { model.clear(); analyze(); });
$('#chkFaces').checked = state.faces;
$('#chkFaces').addEventListener('change', e => { state.faces = e.target.checked; bench.faces = state.faces; save(); });
$('#btnAtlas').addEventListener('click', () => openAtlas());
$('#btnHelp').addEventListener('click', openHelp);
function soundBtn() { $('#btnSound').textContent = state.mute ? '🔇' : '🔊'; }
$('#btnSound').addEventListener('click', () => { state.mute = !state.mute; save(); soundBtn(); });

// ---------- main loop ----------
let last = performance.now();
function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  for (const a of model.atoms) if (a.tween) {
    a.tween.t = Math.min(1, a.tween.t + dt / 0.7);
    const e = a.tween.t < 0.5 ? 2 * a.tween.t * a.tween.t : 1 - Math.pow(-2 * a.tween.t + 2, 2) / 2;
    a.x = a.tween.from[0] + (a.tween.to[0] - a.tween.from[0]) * e;
    a.y = a.tween.from[1] + (a.tween.to[1] - a.tween.from[1]) * e;
    a.z = a.tween.from[2] + (a.tween.to[2] - a.tween.from[2]) * e;
    if (a.tween.t >= 1) { a.tween = null; a.pinned = false; }
  }
  for (let i = 0; i < 4; i++) model.step(0.012);
  bench.render(dt);
  if (detail) detail.render(dt);
  requestAnimationFrame(frame);
}

buildTray(); setMode(state.mode); soundBtn(); analyze();
tip('Welcome, ' + AA.PLAYER_NAME + '! Drag an atom from the left onto the bench to start.', 9000);
if (!state.seenHelp) openHelp();
requestAnimationFrame(frame);
window.AA_debug = { bench, model, state, analyze };
})();
