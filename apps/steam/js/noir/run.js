(function () {
'use strict';
// Run mode: five samples that get harder. Build the molecule, submit, and every peak that locks adds to a growing
// multiplier. Between samples you draft one tool. Three strikes ends the run.
const AA = window.AA, C = AA.chem, sfx = AA.sfx, lib = C.library(), $ = s => document.querySelector(s), app = $('#app');

function h(tag, attrs) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v); }
  for (const kid of [].slice.call(arguments, 2).flat(Infinity)) { if (kid == null || kid === false) continue; el.append(kid.nodeType ? kid : document.createTextNode(kid)); }
  return el;
}
$('#mute').addEventListener('click', e => { sfx.setMuted(!sfx.isMuted()); e.target.textContent = sfx.isMuted() ? 'Sound off' : 'Sound on'; if (!sfx.isMuted()) sfx.click(); });

const TOOLS = [
  { id: 'resonance', name: 'Resonance', desc: 'Each peak in a streak raises the multiplier by 1.0 instead of 0.5.' },
  { id: 'amp', name: 'Amplifier', desc: 'Every submission starts at x2 instead of x1.' },
  { id: 'chain', name: 'Chain reaction', desc: 'Every 4th peak locked in a row detonates for +2,000 and a big explosion.' },
  { id: 'storm', name: 'Hydrogen storm', desc: 'Fill with hydrogen scores +250 for every hydrogen it adds.' },
  { id: 'overclock', name: 'Overclock', desc: 'Round clear bonuses are doubled.' },
  { id: 'jackpot', name: 'Jackpot', desc: 'Solve a sample on your first submission for x3 round bonus.' },
  { id: 'insurance', name: 'Insurance', desc: 'The first missed submission on each sample costs no strike.' }
];
const TIERS = [['water', 'ammonia', 'chlorine'], ['ethanol', 'acetone', 'acetic', 'butane'], ['ethanol', 'acetone', 'acetic', 'butane'], ['urea', 'acetic', 'acetone', 'butane'], ['aspirin', 'urea']];
const KEY = 'run-best-v1';
const best = () => { try { return +localStorage.getItem(KEY) || 0; } catch (e) { return 0; } };
const setBest = n => { try { localStorage.setItem(KEY, String(n)); } catch (e) { /* ignore */ } };

let R = null, tn = null, hud = {}, raf = 0, cleanup = null;
const has = id => R.tools.includes(id);
const colorFor = m => m >= 5 ? [255, 90, 70] : m >= 3 ? [255, 210, 63] : m >= 2 ? [125, 255, 176] : [235, 231, 218];
function show(node) { if (cleanup) { cleanup(); cleanup = null; } document.querySelectorAll('.cover').forEach(e => e.remove()); app.innerHTML = ''; app.append(node); window.scrollTo(0, 0); }
function head(t) { $('#crumb').textContent = t; $('#stats').textContent = 'Best ' + best(); }

function title() {
  head('');
  show(h('div', { class: 'title' }, h('div', { class: 'kicker' }, 'A run is five samples'), h('h1', null, 'Build. Lock. Detonate.'),
    h('p', null, 'Each sample has a fingerprint. Build the molecule that explains it, then submit. Every peak your molecule explains locks and raises your multiplier, so a clean build chains into a huge score. Between samples you pick a tool. Three misses and the run ends.'),
    h('div', { class: 'row' }, h('button', { class: 'btn red', onclick: () => { sfx.click(); start(); } }, 'Start a run'))));
}
function start() {
  const ids = []; TIERS.forEach(t => { const pool = t.filter(x => !ids.includes(x)); ids.push(pool[Math.floor(Math.random() * pool.length)]); });
  R = { ids, round: 0, strikes: 0, score: 0, shown: 0, mult: 1, streak: 0, tools: [], attempts: 0, usedIns: false };
  round();
}

function round() {
  const id = R.ids[R.round]; R.attempts = 0; R.usedIns = false; R.streak = 0; R.mult = has('amp') ? 2 : 1; head('Round ' + (R.round + 1) + ' of ' + R.ids.length);
  hud = { score: h('div', { class: 'score' }, '0'), mult: h('div', { class: 'mult' }, '×1.0'), strikes: h('div', { class: 'strikes' }), tools: h('div', { class: 'tools' }), round: h('div', { class: 'rd' }) };
  const host = h('div'), bar = h('div', { class: 'hud' }, h('div', { class: 'hl' }, hud.round, hud.strikes), h('div', { class: 'hc' }, h('div', { class: 'lab' }, 'SCORE'), hud.score), h('div', { class: 'hr' }, h('div', { class: 'lab' }, 'MULTIPLIER'), hud.mult), hud.tools);
  show(h('div', { class: 'runWrap' }, bar, h('p', { class: 'dim', style: 'margin:6px 0 10px' }, 'Build the molecule that matches the fingerprint, then Submit. Peaks that lock build your multiplier. A miss resets it.'), host));
  renderHud();
  tn = AA.tuner.mount(host, {
    target: id, head: false, scanAll: true, hours: () => 99, spend: () => true, submitLabel: 'Submit',
    power: () => Math.min(5, 1 + Math.floor(R.streak / 3)),
    onLock: (idx, item, info) => lock(item, info), onMiss: () => { R.streak = 0; R.mult = has('amp') ? 2 : 1; renderHud(); },
    onCheck: res => check(res),
    onFill: n => { if (has('storm')) { const pts = 250 * n; addScore(pts); const c = tn.fx.centre(); tn.fx.floatText(c.x, c.y, '+' + pts.toLocaleString() + ' HYDROGEN STORM', tn.fx.GOLD, 26); tn.fx.burst(c.x, c.y, tn.fx.GOLD, 40, 220); tn.fx.shake(6); } },
    onSolved: () => roundClear()
  });
  cleanup = () => { cancelAnimationFrame(raf); if (tn) tn.destroy(); tn = null; };
  const loop = () => { R.shown += (R.score - R.shown) * 0.18; if (Math.abs(R.score - R.shown) < 1) R.shown = R.score; hud.score.textContent = Math.round(R.shown).toLocaleString(); raf = requestAnimationFrame(loop); };
  cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
function renderHud() {
  hud.round.textContent = 'Round ' + (R.round + 1) + ' / ' + R.ids.length;
  hud.strikes.innerHTML = ''; for (let i = 0; i < 3; i++) hud.strikes.append(h('span', { class: i < R.strikes ? 'x gone' : 'x' }));
  hud.mult.textContent = '×' + R.mult.toFixed(1); const c = colorFor(R.mult); hud.mult.style.color = 'rgb(' + c.join(',') + ')';
  hud.tools.innerHTML = ''; R.tools.forEach(id => hud.tools.append(h('span', { class: 'chip', title: TOOLS.find(t => t.id === id).desc }, TOOLS.find(t => t.id === id).name)));
}
function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
function addScore(n) { R.score += n; bump(hud.score); }

function lock(item, info) {
  R.streak++; const step = has('resonance') ? 1 : 0.5, base = has('amp') ? 2 : 1; R.mult = base + step * (R.streak - 1);
  const pts = Math.round(100 * R.mult * (item.k === 'nmr' ? 1.5 : 1)); addScore(pts);
  const c = colorFor(R.mult), fxs = tn.fx, jx = (Math.random() - 0.5) * 140, jy = (Math.random() - 0.5) * 70;
  fxs.floatText(info.pos.x + jx, info.pos.y + jy - 8, '+' + pts.toLocaleString(), c, 22 + Math.min(34, R.mult * 5));
  if (R.mult >= 2) fxs.floatText(info.pos.x + jx, info.pos.y + jy + 20, '×' + R.mult.toFixed(1), c, 16);
  fxs.shake(2 + R.mult * 1.6);
  if (has('chain') && R.streak % 4 === 0) {
    addScore(2000); const m = fxs.centre(); fxs.floatText(m.x, m.y, 'CHAIN REACTION +2,000', fxs.GOLD, 36); fxs.ring(m.x, m.y, fxs.GOLD, 240, 0.9); fxs.ring(m.x, m.y, fxs.BLUE, 160, 0.7); fxs.burst(m.x, m.y, fxs.GOLD, 90, 330); fxs.shake(20); fxs.flash(0.35); sfx.fanfare();
  }
  renderHud(); bump(hud.mult);
}
function check(res) {
  R.attempts++;
  if (res.solved) return;
  R.streak = 0; R.mult = has('amp') ? 2 : 1;
  if (has('insurance') && !R.usedIns) { R.usedIns = true; tn.fx.floatText(tn.fx.centre().x, tn.fx.centre().y, 'INSURED', tn.fx.BLUE, 30); renderHud(); return; }
  R.strikes++; sfx.bad(); tn.fx.shake(22); tn.fx.flash(0.28); const c = tn.fx.centre(); tn.fx.floatText(c.x, c.y, 'MISS  ' + R.strikes + '/3', [255, 90, 70], 34); renderHud();
  if (R.strikes >= 3) setTimeout(() => end(false), 1400);
}
function roundClear() {
  const mol = lib.byId.get(R.ids[R.round]), perfect = R.attempts === 1;
  let bonus = 1000 + 400 * R.round; if (perfect) bonus *= 2; if (has('jackpot') && perfect) bonus *= 3; if (has('overclock')) bonus *= 2;
  addScore(bonus); sfx.stamp(); const last = R.round === R.ids.length - 1;
  const el = h('div', { class: 'cover' }, h('div', { class: 'sheet' }, h('span', { class: 'verdict good' }, 'Sample cleared'), h('h2', null, mol.name + '   ' + C.sub(mol.formula)), h('p', null, mol.real),
    h('table', null, h('tr', null, h('th', null, 'Submissions'), h('td', null, String(R.attempts) + (perfect ? '  (perfect)' : ''))), h('tr', null, h('th', null, 'Round bonus'), h('td', null, '+' + bonus.toLocaleString())), h('tr', null, h('th', null, 'Score'), h('td', null, R.score.toLocaleString()))),
    h('div', { class: 'row' }, h('button', { class: 'btn red', onclick: () => { el.remove(); sfx.click(); last ? end(true) : draft(); } }, last ? 'Finish the run' : 'Choose a tool'))));
  document.body.append(el);
}
function draft() {
  head('Choose a tool'); const pool = TOOLS.filter(t => !has(t.id)).sort(() => Math.random() - 0.5).slice(0, 3);
  show(h('div', { class: 'brief', style: 'max-width:900px' }, h('div', { class: 'kicker' }, 'Round ' + (R.round + 1) + ' cleared'), h('h1', null, 'Choose a tool'),
    h('div', { class: 'draft' }, pool.map(t => h('button', { class: 'card pick', onclick: () => { R.tools.push(t.id); R.round++; sfx.stamp(); round(); } }, h('div', { class: 'ct' }, t.name), h('p', null, t.desc)))),
    h('p', { class: 'dim' }, 'Score so far ' + R.score.toLocaleString() + '. Strikes ' + R.strikes + ' of 3.')));
}
function end(won) {
  head(won ? 'Run complete' : 'Run over'); const isBest = R.score > best(); if (isBest) setBest(R.score); won ? sfx.fanfare() : sfx.bad();
  show(h('div', { class: 'brief' }, h('span', { class: 'verdict ' + (won ? 'good' : 'bad') }, won ? 'Run complete' : 'Run over'), h('h1', null, R.score.toLocaleString()), h('p', null, (won ? 'All five samples cleared.' : 'Three misses.') + (isBest ? ' New best score.' : ' Best ' + best() + '.')),
    R.tools.length ? h('p', { class: 'dim' }, 'Tools: ' + R.tools.map(id => TOOLS.find(t => t.id === id).name).join(', ')) : '', h('div', { class: 'row' }, h('button', { class: 'btn red', onclick: () => { sfx.click(); start(); } }, 'New run'), h('button', { class: 'btn ghost', onclick: title }, 'Title'))));
}

title();
window.RUN = { start, get tn() { return tn; }, get R() { return R; } };
})();
