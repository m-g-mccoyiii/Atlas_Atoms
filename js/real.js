(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
const C = AA.chem;

const PUB = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound';

// ---- write a built molecule as SMILES (every atom in brackets, hydrogens explicit) ----
function toSmiles(atoms, bonds) {
  const n = atoms.length, idx = new Map(atoms.map((a, i) => [a, i])), adj = atoms.map(() => []);
  bonds.forEach(b => { const i = idx.get(b.a), j = idx.get(b.b); adj[i].push([j, b.order]); adj[j].push([i, b.order]); });
  const disc = new Array(n).fill(-1), parent = new Array(n).fill(-1), closures = [];
  let t = 0;
  (function dfs(u) {
    disc[u] = t++;
    for (const [v, o] of adj[u]) {
      if (v === parent[u]) continue;
      if (disc[v] < 0) { parent[v] = u; dfs(v); }
      else if (disc[v] < disc[u]) closures.push({ open: v, close: u, order: o });
    }
  })(0);
  const sym = o => o === 2 ? '=' : o === 3 ? '#' : '';
  closures.forEach((c, k) => { c.digit = k + 1 < 10 ? String(k + 1) : '%' + (k + 1); });
  function emit(u) {
    let s = '[' + atoms[u].el + ']';
    closures.forEach(c => { if (c.open === u) s += sym(c.order) + c.digit; else if (c.close === u) s += c.digit; });
    const kids = adj[u].filter(([v]) => parent[v] === u && v !== parent[u]);
    kids.forEach(([v, o], k) => { s += k < kids.length - 1 ? '(' + sym(o) + emit(v) + ')' : sym(o) + emit(v); });
    return s;
  }
  return emit(0);
}

// ---- "you are leaving the game" confirmation (for a 7-year-old: ask a grown-up) ----
function ask(opts, onOk) {
  const h = AA.ui.h;
  const old = document.getElementById('extConfirm'); if (old) old.remove();
  const close = () => { const e = document.getElementById('extConfirm'); if (e) e.remove(); };
  const box = h('div', { id: 'extConfirm', class: 'extConfirm' },
    h('div', { class: 'extCard' },
      h('h3', { style: 'margin:0 0 8px' }, opts.title),
      h('p', null, opts.text),
      h('p', null, h('button', { class: 'btn', onclick: () => { close(); onOk(); } }, opts.ok), ' ',
        h('button', { class: 'btn alt', onclick: close }, 'Stay here'))));
  box.addEventListener('click', e => { if (e.target === box) close(); });
  document.body.append(box);
}
function openLink(url, label) {
  ask({ title: 'Leaving the game', text: 'This opens ' + label + ' in a new tab. It is a real website for grown-ups and big kids. Ask a grown-up before you go.', ok: 'Open ' + label },
    () => window.open(url, '_blank', 'noopener'));
}

// ---- the "real compound" box shown for molecules in the Atlas ----
function block(m) {
  const h = AA.ui.h, r = AA.REAL && AA.REAL[m.id];
  if (!r || !r.pubchem) return h('span');
  const kids = [h('b', null, '✅ This is a real compound. '),
    'PubChem, a science database, lists it as compound #' + r.pubchem.cid + ' with the same formula (' + C.sub(m.formula) + '). '];
  const links = h('div', { class: 'reallinks' });
  if (r.wikipedia) links.append(h('button', { class: 'pill', onclick: () => openLink(r.wikipedia.url, 'Wikipedia') }, '📖 Wikipedia'));
  links.append(h('button', { class: 'pill', onclick: () => openLink('https://pubchem.ncbi.nlm.nih.gov/compound/' + r.pubchem.cid, 'PubChem') }, '🧬 PubChem'));
  return h('div', { class: 'realbox' }, h('p', { style: 'margin:0 0 6px' }, kids), links);
}

// ---- "Is it real?" for molecules the child invented ----
const cache = {};
async function lookup(smiles) {
  if (cache[smiles]) return cache[smiles];
  const r = await fetch(PUB + '/smiles/' + encodeURIComponent(smiles) + '/cids/JSON');
  let res = { found: false };
  if (r.ok) {
    const cid = ((await r.json()).IdentifierList || { CID: [] }).CID[0];
    if (cid) {
      const p = await (await fetch(PUB + '/cid/' + cid + '/property/Title,MolecularFormula/JSON')).json();
      const pr = p.PropertyTable.Properties[0];
      res = { found: true, cid, title: pr.Title, formula: pr.MolecularFormula };
    }
  } else if (r.status !== 404 && r.status !== 400) throw new Error('PubChem ' + r.status);
  cache[smiles] = res;
  return res;
}
function lookupButton(c) {
  const h = AA.ui.h, out = h('span', { class: 'lookup' });
  const btn = h('button', { class: 'pill', style: 'padding:2px 10px;font-size:13px;min-height:0', onclick: () => ask({
    title: 'Ask PubChem?',
    text: 'This sends the shape of your molecule, written as a text code, to PubChem (pubchem.ncbi.nlm.nih.gov), a science database run by the US government. Nothing about you is sent. Ask a grown-up first.',
    ok: 'Ask PubChem'
  }, async () => {
    out.textContent = ' Looking it up...';
    try {
      const res = await lookup(toSmiles(c.atoms, c.bonds));
      out.textContent = '';
      if (res.found) out.append(' ✅ Real! PubChem knows it as ', h('b', null, res.title), ' (#' + res.cid + '). ',
        h('button', { class: 'pill', style: 'padding:2px 10px;font-size:13px;min-height:0', onclick: () => openLink('https://pubchem.ncbi.nlm.nih.gov/compound/' + res.cid, 'PubChem') }, 'See it'));
      else out.textContent = ' 🤔 PubChem does not list this exact molecule. It may still be possible, just not common.';
    } catch (e) { out.textContent = ' Could not reach PubChem. Check the internet connection and try again.'; }
  }) }, '🔎 Is it real?');
  return h('span', null, btn, out);
}

AA.real = { toSmiles, block, lookupButton, openLink, lookup };
if (typeof module !== 'undefined') module.exports = AA.real;
})(typeof globalThis !== 'undefined' ? globalThis : window);
