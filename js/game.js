(function () {
'use strict';
const AA = window.AA, E = AA.ELEMENTS, C = AA.chem, Model = AA.Model, Viewer = AA.Viewer;
const NIL = document.createElement('div');   // stand-in so a missing element can never crash startup
const $ = s => document.querySelector(s) || NIL;
const SAVE = 'atlas-atoms-v1';
const root = document.documentElement;
// Layout: 'auto' picks phone / tablet / desktop from the screen; 'phone' and 'tablet' force it.
const LAYOUTS = ['auto', 'phone', 'tablet'];
const LAYOUT_NAME = { auto: 'Auto', phone: 'iPhone', tablet: 'iPad' };
const LAYOUT_ICON = { auto: '\uD83D\uDDA5', phone: '\uD83D\uDCF1', tablet: '\uD83D\uDD33' };
function applyLayout() {
  const pref = LAYOUTS.includes(state.layout) ? state.layout : 'auto', w = window.innerWidth, h = window.innerHeight;
  let mode = 'desktop';
  if (pref === 'phone' || pref === 'tablet') mode = pref;
  else if (w <= 760 || h <= 520) mode = 'phone';
  else if (window.matchMedia('(pointer: coarse)').matches) mode = 'tablet';
  root.classList.toggle('m-phone', mode === 'phone');
  root.classList.toggle('m-tablet', mode === 'tablet');
  root.classList.toggle('m-land', w > h);
  root.classList.toggle('m-narrow', w < 1000);
  const b = document.querySelector('#btnLayout');
  if (b) { b.innerHTML = LAYOUT_ICON[pref] + '<span class="lbl"> ' + LAYOUT_NAME[pref] + '</span>'; b.title = 'Layout: ' + LAYOUT_NAME[pref] + (pref === 'auto' ? ' (' + mode + ')' : '') + '. Tap to change.'; }
}
// the info panel is a slide-over sheet on phones and on narrow tablets
const isMobile = () => root.classList.contains('m-phone') || (root.classList.contains('m-tablet') && root.classList.contains('m-narrow'));

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
const boot = AA.profiles.boot();          // loads (or creates) the active player's profile
const state = boot.state;
function save() { AA.profiles.save(state); }
let remindedFor = 0;
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


// ---------- read aloud (browser voice, no audio files) ----------
const SUBS = { '\u2080': '0', '\u2081': '1', '\u2082': '2', '\u2083': '3', '\u2084': '4', '\u2085': '5', '\u2086': '6', '\u2087': '7', '\u2088': '8', '\u2089': '9' };
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const clean = String(text).replace(/[\u2080-\u2089]/g, c => ' ' + SUBS[c] + ' ').replace(/\u2013|\u2212/g, ' ').replace(/\u2192/g, ' makes ').replace(/\s+/g, ' ');
    const u = new SpeechSynthesisUtterance(clean); u.rate = 0.9; u.pitch = 1.05; u.lang = 'en-US';
    speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}
function speakBtn(getText, label) {
  return h('button', { class: 'pill speakbtn', title: 'Read this out loud', onclick: () => speak(getText()) }, label || '\uD83D\uDD0A Read to me');
}

// ---------- bench ----------
const bench = new Viewer($('#bench'), new Model(), { interactive: true, mode: state.mode, faces: state.faces, zoom: 42 });
const model = bench.model;

const CAPTIONS = {
  ball: 'Balls are atoms and sticks are bonds. Dots under an atom are its bonding hands: green dots are used, gold rings are open. Drag empty space to turn the view.',
  space: 'Space-filling: each atom is drawn at its true size, so you see how much room a molecule takes up.',
  lewis: 'Electron dot picture. A line is a shared pair of electrons (two lines make a double bond). Gold dots are lone pairs. Chemists draw molecules this way.',
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
  if (state.voice) speak(text);
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
    if (open) b.addEventListener('pointerdown', e => trayDown(el, e));
    list.append(b);
  }
}
// On touch screens the tray also scrolls sideways, so an atom only leaves the tray
// when the finger moves upward; a plain tap opens the element card.
function trayDown(el, e) {
  if (e.pointerType !== 'touch') { spawnFromTray(el, e); return; }
  const sx = e.clientX, sy = e.clientY;
  let started = false;
  const clean = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel); };
  const mv = ev => {
    if (started) return;
    const dx = ev.clientX - sx, dy = ev.clientY - sy;
    const sideTray = !(root.classList.contains('m-phone') && !root.classList.contains('m-land'));
    const out = sideTray ? dx > 10 && Math.abs(dx) > Math.abs(dy) : dy < -10 && Math.abs(dy) > Math.abs(dx);
    if (out) { started = true; clean(); spawnFromTray(el, ev); }
  };
  const up = ev => { clean(); if (!started && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) showElement(el); };
  const cancel = () => clean();
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', cancel);
}
function spawnFromTray(el, e) {
  if (e.preventDefault) e.preventDefault();
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
      sfx.bond(); bench.pop(a); bench.pop(target);
      bench.burstAtoms([a, target], 14);
      const firstBond = !tipSeen.bond;
      tipOnce('bond', 'Bond made. The dots under each atom count its hands. When every hand is used, the atom smiles.');
      if (!firstBond && model.canBond(a, target)) tipOnce('upgrade', 'Both atoms still have open hands. Tap the gold + on the bond, or drop one atom on the other again, to make a double bond.');
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
bench.cb.onPoke = function (a) {
  bench.pop(a);
  const d = E[a.el], sum = model.bondSum(a), eff = C.effValence(a.el, sum) || sum;
  a.vx += (Math.random() - 0.5) * 4; a.vy += (Math.random() - 0.5) * 4; a.vz += (Math.random() - 0.5) * 4;
  tone(380 + d.z * 18, 0.14, 'sine', 0.07);
  tip(d.name + ': ' + sum + ' of ' + eff + ' bonds used. ' + d.fact, 9000);
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
  checkLessons();
  renderBenchList(); renderMission(); renderReactions(); updateCount();
  return comps;
}
function updateCount() { $('#count').textContent = '(' + foundCount() + '/' + lib.list.length + ')'; }

function showBanner(m, more) {
  const b = $('#banner'); b.innerHTML = '';
  b.append(h('h2', null, m.icon + ' You made ' + m.name + '!  ' + C.sub(m.formula)),
    h('p', null, m.real), h('p', null, m.learn),
    AA.real.block(m),
    more > 0 ? h('p', null, '...and ' + more + ' more molecule' + (more > 1 ? 's' : '') + ' on the bench.') : '',
    speakBtn(() => 'You made ' + m.name + '! ' + m.real + ' ' + m.learn), ' ',
    h('button', { class: 'btn', onclick: () => b.classList.add('hidden') }, 'Nice!'),
    h('button', { class: 'btn alt', style: 'margin-left:6px', onclick: () => { b.classList.add('hidden'); openAtlas(m.id); } }, 'See in my Atlas'));
  b.classList.remove('hidden');
  if (state.voice) speak('You made ' + m.name + '! ' + m.real + ' ' + m.learn);
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
    const row = h('div', { class: 'benchrow' }, h('b', null, C.sub(c.formula)), ' ', status);
    if (!c.mol && !c.unhappy.length && c.atoms.length > 1) row.append(' ', AA.real.lookupButton(c));
    box.append(row);
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
  const nl = nextLesson();
  if (nl) box.append(h('p', null, h('button', { class: 'btn alt', onclick: () => openLessons(nl.n) }, '\uD83C\uDF93 Next lesson: ' + nl.n + '. ' + nl.title)));
  box.append(h('div', { class: 'bar' }, h('div', { style: 'width:' + (foundCount() / lib.list.length * 100) + '%' })),
    h('small', { style: 'color:var(--dim)' }, foundCount() + ' of ' + lib.list.length + ' molecules found'));
}

// ---------- element card ----------
function showElement(el) {
  if (isMobile()) document.body.classList.add('showSide');
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
  state.reacted[rx.id] = Date.now(); save(); checkLessons();
  bench.burstAtoms(atoms, 60);
  tip('Spark! ' + rxText(rx.reactants) + ' → ' + rxText(rx.products) + '. Every atom is still here. Reactions only rearrange atoms, they never make or destroy them.', 12000);
  setTimeout(analyze, 900);
  analyze();
}

// ---------- modals ----------
function modalShell(title, body, onClose) {
  const m = $('#modal'); m.innerHTML = ''; m.classList.remove('hidden');
  const close = () => { m.classList.add('hidden'); m.innerHTML = ''; if (detail) { detail.dispose(); detail = null; } if (onClose) onClose(); };
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
    if (detail) detail.dispose();
    detail = new Viewer(cv, tpl, { autoRotate: true, autoFit: true, mode: state.mode, faces: state.faces });
  }, 0);
  const seg = h('div', { class: 'seg' });
  [['ball', 'Ball & Stick'], ['space', 'Space-filling'], ['lewis', 'Electrons'], ['orbital', 'Orbitals']].forEach(([k, label]) => {
    const b = h('button', { class: state.mode === k ? 'on' : '', onclick: () => { if (detail) detail.mode = k; seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); } }, label);
    seg.append(b);
  });
  wrap.append(seg);
  wrap.append(h('h3', { style: 'margin:6px 0' }, (opts.preview ? 'Mystery molecule' : m.icon + ' ' + m.name), ' ', h('span', { class: 'formula', style: 'font-size:20px' }, C.sub(m.formula))));
  wrap.append(h('div', null, countChips(m.counts)));
  if (opts.preview) wrap.append(h('p', { style: 'color:var(--dim)' }, 'This is a preview of the shape. Build it yourself to add it to your Atlas.'));
  else {
    wrap.append(h('p', null, h('b', null, 'In real life: '), m.real), h('p', null, h('b', null, 'The chemistry: '), m.learn), speakBtn(() => m.name + '. ' + m.real + ' ' + m.learn), ' ');
    wrap.append(AA.real.block(m));
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
  const c = bench.randomSpot();
  const map = tpl.atoms.map(a => model.addAtom(a.el, a.x + c[0], a.y + c[1], a.z + c[2]));
  tpl.bonds.forEach(k => model.bonds.push({ a: map[tpl.atoms.indexOf(k.a)], b: map[tpl.atoms.indexOf(k.b)], order: k.order }));
  tip('Added ' + m.name + ' to the bench.');
  analyze();
}


// ---------- lessons ----------
function lessonDone(L) { return AA.lessonDoneFor(state, L); }
function nextLesson() { return AA.LESSONS.find(L => !lessonDone(L)) || null; }
function lessonCount() { return AA.LESSONS.filter(lessonDone).length; }
function checkLessons() {
  let changed = false;
  for (const L of AA.LESSONS) if (!state.lessons[L.n] && L.done && lessonDone(L)) {
    state.lessons[L.n] = Date.now(); changed = true;
    setTimeout(() => tip('Lesson ' + L.n + ' complete: ' + L.title + '.', 8000), 1400);
  }
  if (changed) save();
  const el = $('#lcount'); if (el) el.textContent = '(' + lessonCount() + '/' + AA.LESSONS.length + ')';
  const doneN = lessonCount();
  if (doneN > 0 && doneN % 10 === 0 && doneN !== remindedFor && Date.now() - (state.lastBackup || 0) > 7 * 86400000) {
    remindedFor = doneN;
    setTimeout(() => tip('You have finished ' + doneN + ' lessons! Open your profile (top of the screen) and tap Back up so your progress is safe.', 11000), 5000);
  }
  if (AA.checkBadges) AA.checkBadges();
}
function openLessons(focus) {
  const list = h('div', { class: 'lessonList' }), side = h('div', { class: 'lessonBody' });
  function show(L, row) {
    list.querySelectorAll('.lrow').forEach(r => r.classList.remove('sel')); row.classList.add('sel');
    side.innerHTML = '';
    side.append(
      h('h3', { style: 'margin:0 0 4px;font-size:20px;color:var(--gold);text-transform:none;letter-spacing:0' }, 'Lesson ' + L.n + ': ' + L.title),
      h('small', { style: 'color:var(--dim)' }, L.level + ' \u00B7 about ' + L.minutes + ' minutes'),
      speakBtn(() => 'Lesson ' + L.n + '. ' + L.title + '. ' + L.bigIdea + ' Try it in the game. ' + L.tryIt.join(' ')),
      h('p', null, h('b', null, 'Big idea: '), L.bigIdea),
      h('p', null, h('b', null, 'Words: '), L.words.map(w => h('span', { class: 'chip' }, h('b', null, w[0]), ' = ' + w[1]))),
      h('h4', null, 'Try it in the game'), h('ol', null, L.tryIt.map(s => h('li', null, s))),
      h('h4', null, 'Check yourself'),
      h('ul', null, L.check.map(c => { const ans = h('div', { class: 'ans hidden' }, c.a); return h('li', null, c.q, ' ', h('button', { class: 'pill', style: 'padding:0 8px;font-size:12px', onclick: () => ans.classList.toggle('hidden') }, 'Show answer'), ans); })),
      h('p', null, h('b', null, 'In real life: '), L.realLife),
      h('p', null, h('b', null, 'Away from the screen: '), L.offScreen, h('i', { style: 'color:var(--dim)' }, ' (Ask an adult before trying anything with real chemicals or fire.)')),
      L.grownup ? h('p', { class: 'grownup' }, h('b', null, 'Grown-up question: '), L.grownup.replace(/^Ask:\s*/, '')) : '',
      h('p', null,
        h('button', { class: 'btn', onclick: () => $('#modal').click() }, 'Go to the bench'), ' ',
        h('button', { class: 'btn', onclick: () => openQuiz(L) }, '\uD83D\uDCDD Take the quiz' + (state.quiz[L.n] !== undefined ? ' (best ' + state.quiz[L.n] + '/' + AA.QUIZZES[L.n].length + ')' : '')), ' ',
        lessonDone(L) ? h('span', { class: 'ok' }, '\u2713 Complete')
          : L.done ? h('span', { style: 'color:var(--dim)' }, 'Completes automatically when you do the activity.')
          : h('button', { class: 'btn alt', onclick: () => { state.lessons[L.n] = Date.now(); save(); checkLessons(); renderMission(); openLessons(L.n); } }, 'Mark done')));
  }
  let sel = null; const rows = [];
  AA.LESSONS.forEach(L => {
    const u = (AA.LESSON_UNITS || []).find(x => x[0] === L.n);
    if (u) {
      const inUnit = AA.LESSONS.filter(x => x.n >= u[0] && x.n <= u[1]), got = inUnit.filter(lessonDone).length;
      list.append(h('div', { class: 'lunit' }, u[2], h('small', null, '  ' + got + '/' + inUnit.length)));
    }
    const row = h('div', { class: 'lrow' }, h('span', { class: 'lnum' }, lessonDone(L) ? '\u2713' : L.n), h('span', null, L.title + (state.quiz[L.n] === AA.QUIZZES[L.n].length ? ' \u2605' : '')));
    row.addEventListener('click', () => show(L, row));
    rows.push(row);
    if (L.n === focus) sel = [L, row];
    list.append(row);
  });
  modalShell('Lessons \u2014 ' + lessonCount() + ' of ' + AA.LESSONS.length + ' complete', h('div', { class: 'lessonWrap' }, list, side));
  const first = sel ? sel[0] : (AA.LESSONS.find(L => !lessonDone(L)) || AA.LESSONS[0]);
  const row = sel ? sel[1] : rows[first.n - 1];
  show(first, row);
}

// ---------- quizzes ----------
function shuffled(a) { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; }
function openQuiz(L) {
  const Q = shuffled(AA.QUIZZES[L.n]);
  let i = 0, score = 0;
  const box = h('div', { class: 'quiz' });
  modalShell('Quiz: ' + L.title, box);
  function ask() {
    box.innerHTML = '';
    if (i >= Q.length) { finish(); return; }
    const q = Q[i], opts = shuffled([q.right].concat(q.wrong));
    const why = h('div', { class: 'why hidden' });
    const buttons = opts.map(o => h('button', { class: 'choice', onclick: () => pick(o, q, buttons, why) }, o));
    box.append(h('small', { style: 'color:var(--dim)' }, 'Question ' + (i + 1) + ' of ' + Q.length),
      h('p', { class: 'qtext' }, q.q),
      speakBtn(() => q.q + ' ' + opts.join('. Or. ')),
      h('div', { class: 'choices' }, buttons), why);
    if (state.voice) speak(q.q + ' ' + opts.join('. Or. '));
  }
  function pick(o, q, buttons, why) {
    if (why.dataset.done) return;
    why.dataset.done = '1';
    const ok = o === q.right;
    if (ok) { score++; sfx.found(); } else sfx.bad();
    buttons.forEach(b => { b.disabled = true; if (b.textContent === q.right) b.classList.add('right'); else if (b.textContent === o) b.classList.add('wrong'); });
    why.classList.remove('hidden');
    why.append(h('b', null, ok ? 'Yes! ' : 'Not quite. '), q.why, ' ',
      h('button', { class: 'btn', onclick: () => { i++; ask(); } }, i + 1 >= Q.length ? 'See my score' : 'Next question'));
    if (state.voice) speak((ok ? 'Yes! ' : 'Not quite. ') + q.why);
  }
  function finish() {
    const perfect = score === Q.length;
    state.tries[L.n] = (state.tries[L.n] || 0) + 1;
    if (state.quiz[L.n] === undefined || score > state.quiz[L.n]) state.quiz[L.n] = score;
    if (perfect && !state.lessons[L.n]) state.lessons[L.n] = Date.now();
    save(); checkLessons(); renderMission();
    const stars = perfect ? '\u2605\u2605\u2605' : score > 0 ? '\u2605' : '';
    box.append(h('div', { class: 'score' }, stars || '\u2606'), h('h3', { style: 'text-align:center' }, 'You got ' + score + ' of ' + Q.length + (perfect ? '! Lesson complete.' : '.')),
      h('p', { style: 'text-align:center;color:var(--dim)' }, perfect ? 'Great work. Pick the next lesson or build something.' : 'Read the lesson again and try once more. You can do it.'),
      h('p', { style: 'text-align:center' },
        h('button', { class: 'btn', onclick: () => { i = 0; score = 0; ask(); } }, 'Try again'), ' ',
        h('button', { class: 'btn alt', onclick: () => openLessons(L.n) }, 'Back to lessons')));
    if (perfect) { bench.burst(new THREE.Vector3(0, 0, 0), 60); sfx.found(); }
    if (state.voice) speak('You got ' + score + ' of ' + Q.length + '.');
  }
  ask();
}

function openHelp() {
  state.seenHelp = true; save();
  modalShell('Welcome to the lab, ' + AA.PLAYER_NAME + '!', h('div', null,
    h('p', null, '1. Drag atoms from the atom tray onto the bench. On a phone, swipe up from an atom in the bottom strip. On an iPad, swipe right from an atom in the left tray.'),
    h('p', null, '2. Drop one atom on top of another to bond them. Tap the gold + on a bond, or drop them together again, to make a double or triple bond.'),
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
$('#btnRecenter').addEventListener('click', () => { bench.yaw = 0.45; bench.pitch = 0.25; bench.zoom = 42; bench.pan.set(0, 0, 0); bench.yawVel = 0; });
$('#btnShake').addEventListener('click', () => {
  model.atoms.forEach(a => { a.vx += (Math.random() - 0.5) * 8; a.vy += (Math.random() - 0.5) * 8; a.vz += (Math.random() - 0.5) * 8; });
  tone(200, 0.2, 'sawtooth', 0.04);
});
let heat = 0.15;
$('#heat').addEventListener('input', e => { heat = parseFloat(e.target.value); });
$('#btnClear').addEventListener('click', () => { model.clear(); analyze(); });
$('#chkVoice').checked = state.voice;
$('#chkVoice').addEventListener('change', e => { state.voice = e.target.checked; save(); if (state.voice) speak('Reading out loud is on.'); else if ('speechSynthesis' in window) speechSynthesis.cancel(); });
$('#chkFaces').checked = state.faces;
$('#chkFaces').addEventListener('change', e => { state.faces = e.target.checked; bench.faces = state.faces; save(); });
$('#btnAtlas').addEventListener('click', () => openAtlas());
$('#btnLessons').addEventListener('click', () => openLessons());
$('#btnBadges').addEventListener('click', () => AA.openBadges());
$('#btnLab').addEventListener('click', () => AA.openLab());
$('#btnLayout').addEventListener('click', () => {
  state.layout = LAYOUTS[(LAYOUTS.indexOf(state.layout) + 1) % LAYOUTS.length] || 'auto';
  save(); applyLayout(); document.body.classList.remove('showSide');
  tip('Layout: ' + LAYOUT_NAME[state.layout] + (state.layout === 'auto' ? ' (picks the best layout for your screen).' : '.'), 4000);
});
window.addEventListener('resize', applyLayout);
window.addEventListener('orientationchange', applyLayout);
$('#btnInfo').addEventListener('click', () => document.body.classList.toggle('showSide'));
$('#btnSideClose').addEventListener('click', () => document.body.classList.remove('showSide'));
$('#btnHelp').addEventListener('click', openHelp);
function soundBtn() { $('#btnSound').textContent = state.mute ? '🔇' : '🔊'; }
$('#btnSound').addEventListener('click', () => { state.mute = !state.mute; save(); soundBtn(); });


// ---------- the gold "+" on bonds that can still become double / triple ----------
const bondBtns = new Map();
function updateBondButtons() {
  const box = $('.canvasbox');
  const show = !bench.drag && bench.tool === 'build' && (state.mode === 'ball' || state.mode === 'lewis');
  const live = new Set();
  if (show) for (const b of model.bonds) {
    if (!model.canBond(b.a, b.b)) continue;
    const A = bench._screen(b.a), B = bench._screen(b.b), dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy);
    if (len < 34) continue;
    live.add(b);
    let el = bondBtns.get(b);
    if (!el) {
      el = h('button', { class: 'bondplus', title: 'Add another bond (double or triple)', 'aria-label': 'Add another bond' }, '+');
      el.addEventListener('pointerdown', e => e.stopPropagation());
      el.addEventListener('click', e => {
        e.stopPropagation();
        if (!model.canBond(b.a, b.b)) return;
        model.bond(b.a, b.b); bench.pop(b.a); bench.pop(b.b); bench.burstAtoms([b.a, b.b], 10); sfx.bond(); analyze();
      });
      box.append(el); bondBtns.set(b, el);
    }
    el.style.left = ((A.x + B.x) / 2 - dy / len * 22) + 'px';
    el.style.top = ((A.y + B.y) / 2 + dx / len * 22) + 'px';
  }
  for (const [b, el] of bondBtns) if (!live.has(b)) { el.remove(); bondBtns.delete(b); }
}

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
  if (heat > 0) for (const a of model.atoms) if (!a.pinned) { const k = heat * 0.9; a.vx += (Math.random() - 0.5) * k; a.vy += (Math.random() - 0.5) * k; a.vz += (Math.random() - 0.5) * k; }
  for (let i = 0; i < 4; i++) model.step(0.012);
  bench.render(dt);
  updateBondButtons();
  if (detail) detail.render(dt);
  requestAnimationFrame(frame);
}

applyLayout(); buildTray(); setMode(state.mode); soundBtn(); analyze();
AA.ui = { h, modalShell, speakBtn, state, lib, putOnBench, save, checkLessons, bench, sfx, tip, speak, lessonDone, getDetail: () => detail, setDetail: v => { detail = v; } };
AA.refreshProfileButton();
AA.checkBadges();
AA.profiles.requestPersist();
$('#btnProfile').addEventListener('click', () => AA.openProfile());
const afterSetup = () => { if (!state.seenHelp) openHelp(); };
if (boot.needsSetup) AA.openSetup(afterSetup);
else { tip('Welcome, ' + AA.PLAYER_NAME + '! Drag an atom from the left onto the bench.', 9000); afterSetup(); }
requestAnimationFrame(frame);
window.AA_debug = { bench, model, state, analyze };
})();
