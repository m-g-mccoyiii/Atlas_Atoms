(function () {
'use strict';
const AA = window.AA, C = AA.chem, sfx = AA.sfx, N = AA.NOIR, lib = C.library(), $ = s => document.querySelector(s), app = $('#app');

function h(tag, attrs) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) { if (v == null || v === false) continue; if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else el.setAttribute(k, v); }
  for (const kid of [].slice.call(arguments, 2).flat(Infinity)) { if (kid == null || kid === false) continue; el.append(kid.nodeType ? kid : document.createTextNode(kid)); }
  return el;
}
$('#mute').addEventListener('click', e => { sfx.setMuted(!sfx.isMuted()); e.target.textContent = sfx.isMuted() ? 'Sound off' : 'Sound on'; if (!sfx.isMuted()) sfx.click(); });

// ---------- save ----------
const KEY = 'noir-save-v1';
const fresh = () => ({ cash: 300, rep: 50, caseIdx: 0, log: [], upg: { hours: 0, tokens: 0, opinion: 0 }, cur: null, ledger: [], pred: null });
let S = (() => { try { return Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch (e) { return fresh(); } })();
const hasSave = () => { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } };
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };
const money = n => (n < 0 ? '-' : '') + '$' + Math.abs(n);
const caseOf = () => N.cases[S.cur ? N.cases.findIndex(c => c.id === S.cur.id) : S.caseIdx];

let cleanup = null, tuner = null;
function show(node) { if (cleanup) { cleanup(); cleanup = null; } tuner = null; document.querySelectorAll('.cover').forEach(e => e.remove()); app.innerHTML = ''; app.append(node); window.scrollTo(0, 0); }
function head(crumb) { $('#crumb').textContent = crumb; const s = $('#stats'); s.innerHTML = ''; s.append('Cash ', h('b', null, money(S.cash)), '   Reputation ', h('b', null, String(S.rep))); }
function sheet(content) { const el = h('div', { class: 'cover' }, h('div', { class: 'sheet' }, content)); document.body.append(el); return el; }

// ============================== title ==============================
function title() {
  head('');
  show(h('div', { class: 'title' }, h('div', { class: 'kicker' }, 'Calloway Street'), h('h1', null, 'Meitner Analytical'),
    h('p', null, 'You run an independent laboratory. Detectives, inspectors and investigators bring you evidence. You read the instruments and say what the sample is. Then the people who sent it decide who to blame.'),
    h('div', { class: 'row' }, S.cur || S.caseIdx > 0 ? h('button', { class: 'btn red', onclick: () => { sfx.click(); hub(); } }, 'Continue') : '',
      h('button', { class: S.cur || S.caseIdx > 0 ? 'btn ghost' : 'btn red', onclick: () => { if ((S.cur || S.caseIdx > 0) && !confirm('Start over and erase the current save?')) return; S = fresh(); persist(); sfx.click(); hub(); } }, S.cur || S.caseIdx > 0 ? 'New game' : 'Begin')),
    h('p', { class: 'fine' }, 'Spectra are simulated from textbook rules for teaching. They are not real instrument data.')));
}

// ============================== office ==============================
function hub() {
  head('Office');
  const done = S.caseIdx >= N.cases.length, wrap = h('div', { class: 'hub' });
  if (done) {
    const solved = S.log.filter(l => l.outcome === 'solved').length, end = N.endings.find(e => S.rep >= e.min);
    wrap.append(h('section', { class: 'sec' }, h('div', { class: 't' }, h('span', null, 'End of Act II')), h('h2', null, N.cases.length + ' cases closed'), h('p', { class: 'dim' }, 'The ledger predicts the next anomaly at 0.0 ppm with 5 hydrogens, which is where the instrument\'s own reference line sits. Act III has not been built yet.'), h('p', null, 'You solved ' + solved + ' of ' + N.cases.length + ' cleanly. Final cash ' + money(S.cash) + ', reputation ' + S.rep + '.'), h('p', null, end.text),
      h('div', { class: 'row' }, h('button', { class: 'btn red', onclick: () => { S = fresh(); persist(); hub(); } }, 'Play again'))));
  } else {
    const c = N.cases[S.caseIdx], open = S.cur && S.cur.id === c.id;
    wrap.append(h('section', { class: 'sec' }, h('div', { class: 't' }, h('span', null, 'Next case'), h('span', null, 'File ' + (S.caseIdx + 1) + ' of ' + N.cases.length)),
      h('h2', null, c.title), h('p', { class: 'dim' }, (c.act === 2 ? 'Act II  ·  ' : '') + c.client + '  ·  ' + c.place + '  ·  pays ' + money(c.pay)),
      h('div', { class: 'row' }, h('button', { class: 'btn red', onclick: () => { sfx.click(); open ? caseScreen() : briefing(c); } }, open ? 'Continue case' : 'Open case'))));
  }
  if (S.ledger.length) wrap.append(h('section', { class: 'sec' }, h('div', { class: 't' }, h('span', null, 'Anomaly ledger')), h('p', null, S.ledger.length + ' anomal' + (S.ledger.length === 1 ? 'y' : 'ies') + ' reported. ' + (S.pred ? 'Your prediction: ' + S.pred.shift + ' ppm, ' + S.pred.hs + ' H.' : 'No prediction entered.')), h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: () => { sfx.click(); ledgerScreen(hub); } }, 'Open ledger'))));
  wrap.append(h('section', { class: 'sec' }, h('div', { class: 't' }, h('span', null, 'Lab upgrades')),
    N.upgrades.map(u => { const own = S.upg[u.id], max = own >= u.max, cost = u.costs[own]; return h('div', { class: 'upg' }, h('div', null, h('b', null, u.name + '  ' + own + '/' + u.max), h('div', { class: 'dim' }, u.desc)),
      h('button', { class: 'btn ghost', disabled: max || S.cash < cost ? 'disabled' : null, onclick: () => { S.cash -= cost; S.upg[u.id]++; persist(); sfx.stamp(); hub(); } }, max ? 'Maxed' : 'Buy ' + money(cost))); })));
  wrap.append(h('section', { class: 'sec' }, h('div', { class: 't' }, h('span', null, 'Casebook')),
    S.log.length ? S.log.map(l => h('div', { class: 'logrow' }, h('span', null, l.title), h('span', { class: 'o ' + l.outcome }, l.outcome === 'solved' ? 'Solved' : l.outcome === 'partial' ? 'Right person, thin evidence' : 'Named the wrong person'), h('span', null, (l.cash >= 0 ? '+' : '') + money(l.cash)))) : h('p', { class: 'dim' }, 'No cases closed yet.')));
  show(wrap);
}

// ============================== briefing ==============================
function briefing(c) {
  head('Briefing');
  show(h('div', { class: 'brief' }, h('div', { class: 'kicker' }, c.place), h('h1', null, c.title),
    c.brief.map(l => h('div', { class: 'line' }, h('b', null, l[0]), h('p', null, l[1]))),
    h('div', { class: 'row' }, h('button', { class: 'btn red', onclick: () => { S.cur = { id: c.id, hours: N.hoursBase + 2 * S.upg.hours, ident: {}, opinionUsed: false, opinions: {} }; persist(); sfx.click(); caseScreen(); } }, 'Take the case'), h('button', { class: 'btn ghost', onclick: hub }, 'Not now'))));
}

// ============================== the case file ==============================
const clueOf = (c, sid) => c.samples.find(s => s.id === sid);
function suspectState(c, sp) {
  const ids = Object.keys(S.cur.ident).filter(k => S.cur.ident[k]).map(k => clueOf(c, k));
  return { cleared: ids.some(s => s.clears.includes(sp.id)), pointed: ids.filter(s => s.against.includes(sp.id)).length };
}
function caseScreen() {
  const c = caseOf(); head('Case: ' + c.title);
  const idn = S.cur.ident, nIdent = Object.keys(idn).filter(k => idn[k]).length;
  const sampleCard = s => {
    const done = !!idn[s.id], m = lib.byId.get(s.compound);
    return h('div', { class: 'card' + (done ? ' ok' : '') }, h('div', { class: 'ct' }, s.label), h('div', { class: 'dim' }, s.where),
      done ? [h('p', { class: 'res' }, h('b', null, s.resultLabel || m.name + '  ' + C.sub(m.formula))), h('p', null, s.clue)]
        : [h('p', { class: 'dim' }, S.cur.opinions[s.id] ? 'Colleague says: ' + s.family : 'Unidentified.'),
          h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { sfx.click(); analyze(s); } }, 'Analyze'),
            S.upg.opinion && !S.cur.opinionUsed && !S.cur.opinions[s.id] ? h('button', { class: 'btn ghost', onclick: () => { S.cur.opinionUsed = true; S.cur.opinions[s.id] = true; persist(); sfx.click(); caseScreen(); } }, 'Second opinion') : '')]);
  };
  const ruled = S.cur.ruled || (S.cur.ruled = {});
  const suspectCard = sp => h('div', { class: 'card' + (ruled[sp.id] ? ' cleared' : '') }, h('div', { class: 'ct' }, sp.name), h('div', { class: 'dim' }, sp.role), h('p', { class: 'say' }, sp.says),
    h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: () => { ruled[sp.id] = !ruled[sp.id]; persist(); sfx.click(); caseScreen(); } }, ruled[sp.id] ? 'Ruled out (undo)' : 'Rule out')));
  show(h('div', null,
    h('div', { class: 'labTop' }, h('button', { class: 'btn ghost', onclick: () => { sfx.click(); hub(); } }, 'Office'), h('h2', null, c.title), S.ledger.length ? h('button', { class: 'btn ghost', onclick: () => { sfx.click(); ledgerScreen(caseScreen); } }, 'Anomaly ledger (' + S.ledger.length + ')') : '', h('div', { class: 'hours' }, h('b', null, S.cur.hours), ' lab hours left'),
      h('button', { class: 'btn red', disabled: nIdent ? null : 'disabled', title: nIdent ? '' : 'Identify a sample first', onclick: () => { sfx.click(); accuse(c); } }, c.accuseTitle || 'Name the culprit')),
    h('p', { class: 'dim' }, c.client + '  ·  ' + c.place),
    h('div', { class: 'cols' },
      h('section', { class: 'sec' }, h('div', { class: 't' }, h('span', null, 'Evidence')), c.samples.map(sampleCard)),
      h('section', { class: 'sec' }, h('div', { class: 't' }, h('span', null, 'Suspects')), c.suspects.map(suspectCard)),
      h('section', { class: 'sec' }, h('div', { class: 't' }, h('span', null, 'Evidence board')),
        nIdent ? c.samples.filter(s => idn[s.id]).map(s => h('div', { class: 'clue' }, h('i', null, s.label), s.clue)) : h('p', { class: 'dim' }, 'Nothing yet. Identify a sample and its meaning appears here.')))));
}

// ============================== analysis ==============================
function analyze(s) {
  if (s.needsPrediction && !S.pred) { sheet([h('h2', null, 'Enter your prediction first'), h('p', null, 'Dr. Varga will not release this package until you have entered the shift and the number of hydrogens you expect. Open the anomaly ledger and work out the rule.'), h('div', { class: 'row' }, h('button', { class: 'btn red', onclick: () => { ledgerScreen(caseScreen); } }, 'Open the ledger'), h('button', { class: 'btn ghost', onclick: () => document.querySelector('.cover').remove() }, 'Not yet'))]); return; }
  const c = caseOf(); head('Analysis: ' + s.label); const host = h('div');
  show(h('div', null, h('div', { class: 'labTop' }, h('button', { class: 'btn ghost', onclick: () => { sfx.click(); caseScreen(); } }, 'Back to case'), h('h2', null, s.label), h('div', { class: 'dim' }, s.where)), host));
  tuner = AA.tuner.mount(host, {
    target: s.compound, anomaly: s.anomaly, tokens: 1 + S.upg.tokens, hours: () => S.cur.hours,
    spend: () => { if (S.cur.hours < 1) return false; S.cur.hours--; persist(); return true; },
    onSolved: info => {
      S.cur.ident[s.id] = true; sfx.stamp(); const m = lib.byId.get(s.compound); let predRow = null;
      if (info.anomaly && s.anomaly) {
        if (!s.noLedger && !S.ledger.some(e => e.sample === s.label && e.case === c.title)) S.ledger.push({ case: c.title, sample: s.label, shift: s.anomaly.shift, hs: s.anomaly.hs });
        if (s.needsPrediction && S.pred) {
          const hit = Math.abs(S.pred.shift - s.anomaly.shift) <= 0.2 && S.pred.hs === s.anomaly.hs;
          if (hit) { S.cash += 200; S.rep += 10; } else S.rep = Math.max(0, S.rep - 5);
          predRow = h('tr', null, h('th', null, 'Your prediction'), h('td', null, S.pred.shift + ' ppm, ' + S.pred.hs + ' H: ' + (hit ? 'correct. +$200, reputation +10' : 'missed. Reputation -5')));
        }
      }
      persist();
      const el = sheet([h('span', { class: 'verdict good' }, info.anomaly ? 'Anomaly reported' : 'Identified'), h('h2', null, s.resultLabel && info.anomaly ? s.resultLabel : m.name + '   ' + C.sub(m.formula)), h('p', null, info.anomaly ? 'Your structure explains every signal but one. That one signal fits no structure you can build.' : m.real), h('table', null, h('tr', null, h('th', null, 'Assays used'), h('td', null, String(info.assays))), h('tr', null, h('th', null, 'Hours left'), h('td', null, String(S.cur.hours))), predRow),
        h('p', null, h('b', null, 'What it means: '), s.clue), h('div', { class: 'row' }, h('button', { class: 'btn red', onclick: () => { el.remove(); caseScreen(); } }, 'Back to case'))]);
    }
  });
  cleanup = () => { if (tuner) tuner.destroy(); };
  window.NOIR_DBG = { get tuner() { return tuner; }, get S() { return S; } };
}

// ============================== accusation ==============================
function supports(clue, id) { return clue.against.includes(id) || clue.clears.some(x => x !== id); }
function accuse(c) {
  const idn = Object.keys(S.cur.ident).filter(k => S.cur.ident[k]).map(k => clueOf(c, k)), need = Math.min(2, idn.length);
  let who = null; const picked = new Set(), go = h('button', { class: 'btn red', disabled: 'disabled', onclick: () => { el.remove(); verdict(c, who, [...picked]); } }, 'Submit to the detective');
  const sync = () => { go.disabled = !(who && picked.size >= need); };
  const sp = c.suspects.map(s => h('button', { class: 'opt', onclick: e => { who = s.id; sp.forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); sync(); } }, s.name + ' — ' + s.role));
  const cl = idn.map(s => h('button', { class: 'opt', onclick: e => { const on = picked.has(s.id); if (on) picked.delete(s.id); else if (picked.size < 3) picked.add(s.id); e.currentTarget.classList.toggle('on', picked.has(s.id)); sync(); } }, s.label + ': ' + s.clue));
  const el = sheet([h('h2', null, c.accuseTitle || 'Name the culprit'), h('p', { class: 'dim' }, c.kind === 'mystery' ? 'Pick one explanation and the ' + need + ' (up to 3) findings that support it.' : 'Pick one person and the ' + need + ' (up to 3) findings that prove it. If you are wrong, someone innocent pays for it.'), h('h3', null, 'Who'), sp, h('h3', null, 'Evidence'), cl,
    h('div', { class: 'row' }, go, h('button', { class: 'btn ghost', onclick: () => el.remove() }, 'Keep investigating'))]);
}
function verdict(c, who, clueIds) {
  const right = who === c.culprit, strong = clueIds.filter(id => supports(clueOf(c, id), who)).length >= Math.min(2, clueIds.length || 1), culprit = c.suspects.find(s => s.id === c.culprit), named = c.suspects.find(s => s.id === who);
  let outcome, cash, rep, text;
  if (right && strong) { outcome = 'solved'; cash = c.pay + 50 * S.cur.hours; rep = 15; text = c.win; }
  else if (right) { outcome = 'partial'; cash = Math.round(c.pay / 2); rep = 5; text = 'You named ' + culprit.name + ', who is responsible, but the findings you gave do not prove it. The prosecutor drops the charge for lack of proof and refiles it after more work. The detective pays half.'; }
  else { outcome = 'wrong'; cash = -Math.min(S.cash, 150); rep = -20; text = c.lose.replace(/the person you named/gi, named.name).replace(/the first suspect/gi, named.name); }
  S.cash += cash; S.rep = Math.max(0, S.rep + rep); S.log.push({ title: c.title, outcome, cash }); S.caseIdx++; S.cur = null; persist(); head('Verdict'); outcome === 'wrong' ? sfx.bad() : sfx.stamp();
  show(h('div', { class: 'brief' }, h('span', { class: 'verdict ' + (outcome === 'wrong' ? 'bad' : 'good') }, outcome === 'solved' ? 'Case solved' : outcome === 'partial' ? 'Right person, thin evidence' : 'Wrong person'),
    h('h1', null, c.title), h('p', null, text),
    h('table', { class: 'tbl' }, h('tr', null, h('th', null, 'Cash'), h('td', null, (cash >= 0 ? '+' : '') + money(cash))), h('tr', null, h('th', null, 'Reputation'), h('td', null, (rep >= 0 ? '+' : '') + rep))),
    h('div', { class: 'row' }, h('button', { class: 'btn red', onclick: () => { sfx.click(); hub(); } }, 'Back to the office'))));
}

// ============================== anomaly ledger ==============================
function ledgerScreen(back) {
  head('Anomaly ledger'); document.querySelectorAll('.cover').forEach(e => e.remove());
  const L = S.ledger, cv = h('canvas', { class: 'ledgerCv' }), si = h('input', { type: 'number', step: '0.1', value: S.pred ? S.pred.shift : '', placeholder: 'shift, ppm' }), hi = h('input', { type: 'number', step: '1', value: S.pred ? S.pred.hs : '', placeholder: 'hydrogens' }), msg = h('div', { class: 'dim' }, S.pred ? 'Prediction on file: ' + S.pred.shift + ' ppm, ' + S.pred.hs + ' H.' : 'No prediction on file.');
  const draw = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth || 560, hgt = 240; cv.width = w * dpr; cv.height = hgt * dpr; const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, hgt);
    const n = L.length + 1, lo = Math.min(-7, ...L.map(e => e.shift)) - 0.5, hi2 = 1, X = i => 50 + i * ((w - 130) / Math.max(1, n)), Y = v => 20 + (hi2 - v) / (hi2 - lo) * (hgt - 50);
    x.strokeStyle = '#3a3f4b'; x.fillStyle = '#8e94a1'; x.font = '11px "Plex Mono", monospace'; x.textAlign = 'right';
    for (let v = 0; v >= lo; v -= 2) { x.beginPath(); x.moveTo(44, Y(v)); x.lineTo(w - 10, Y(v)); x.stroke(); x.fillText(String(v), 40, Y(v) + 4); }
    x.textAlign = 'center'; x.fillText('entries in order reported', w / 2, hgt - 4);
    L.forEach((e, i) => { const px = X(i + 1), py = Y(e.shift); x.fillStyle = '#6b8cff'; x.beginPath(); x.arc(px, py, 4 + e.hs * 2.2, 0, 6.3); x.fill(); x.fillStyle = '#ebe7da'; x.fillText(e.hs + ' H', px, py - 10 - e.hs * 2.2); });
    if (S.pred) { const px = X(L.length + 1), py = Y(S.pred.shift); x.strokeStyle = '#e0533d'; x.setLineDash([4, 3]); x.beginPath(); x.arc(px, py, 4 + S.pred.hs * 2.2, 0, 6.3); x.stroke(); x.setLineDash([]); x.fillStyle = '#e0533d'; x.fillText('prediction', px, py - 10 - S.pred.hs * 2.2); }
  };
  show(h('div', { class: 'brief', style: 'max-width:760px' }, h('div', { class: 'kicker' }, 'Anomaly ledger'), h('h1', null, 'What the unexplained signals have in common'),
    L.length ? h('table', { class: 'tbl' }, h('tr', null, h('th', null, 'Case'), h('th', null, 'Sample'), h('th', null, 'Shift'), h('th', null, 'Hydrogens')), L.map(e => h('tr', null, h('td', null, e.case), h('td', null, e.sample), h('td', null, e.shift + ' ppm'), h('td', null, String(e.hs))))) : h('p', { class: 'dim' }, 'No anomalies reported yet.'),
    cv, h('h3', { style: 'margin-top:18px' }, 'Predict the next signal'), h('p', { class: 'dim' }, 'Find what changes from one entry to the next. Enter the shift (ppm) and the number of hydrogens you expect in the next anomaly. You are scored when the next one is measured.'),
    h('div', { class: 'row' }, si, hi, h('button', { class: 'btn red', onclick: () => { const sh = parseFloat(si.value), hs = parseInt(hi.value, 10); if (isNaN(sh) || isNaN(hs) || hs < 1) { msg.textContent = 'Enter a shift and a whole number of hydrogens.'; sfx.bad(); return; } S.pred = { shift: Math.round(sh * 10) / 10, hs }; persist(); sfx.stamp(); msg.textContent = 'Prediction on file: ' + S.pred.shift + ' ppm, ' + S.pred.hs + ' H.'; draw(); } }, 'Record prediction')), msg,
    h('div', { class: 'row' }, h('button', { class: 'btn ghost', onclick: () => { sfx.click(); back(); } }, 'Back'))));
  requestAnimationFrame(draw);
}

title();
window.NOIR = { title, hub };
})();
