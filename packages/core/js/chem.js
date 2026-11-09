(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
const E = AA.ELEMENTS;

function maxValence(el) { const v = E[el].valences; return v[v.length - 1]; }
// smallest allowed valence that fits the current bond total, or null if over the max
function effValence(el, sum) { for (const v of E[el].valences) if (v >= sum) return v; return null; }
function lonePairs(el, sum) {
  if (el === 'H' || el === 'Na') return 0;
  const v = effValence(el, sum);
  if (v === null) return 0;
  return Math.max(0, Math.floor((E[el].ve - v) / 2));
}
function isIonic(a, b) { return a !== b && (a === 'Na' || b === 'Na'); }
function bondRest(a, b, order, ) {
  const base = E[a].cov + E[b].cov;
  const f = [1, 0.87, 0.78][order - 1] || 0.78;
  return base * f * (isIonic(a, b) ? 0.88 : 1);
}

const RANK = ['Na', 'N', 'H', 'P', 'S', 'O', 'F', 'Cl'];
function formulaOf(counts) {
  const els = Object.keys(counts);
  let order;
  if (counts.C) {
    order = ['C'];
    if (counts.H) order.push('H');
    order = order.concat(els.filter(e => e !== 'C' && e !== 'H').sort());
  } else {
    order = els.slice().sort((a, b) => RANK.indexOf(a) - RANK.indexOf(b));
  }
  return order.map(e => e + (counts[e] > 1 ? counts[e] : '')).join('');
}
function sub(str) { return String(str).replace(/\d/g, d => '₀₁₂₃₄₅₆₇₈₉'[d]); }

function cyrb53(str, seed) {
  seed = seed || 0;
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

// Weisfeiler-Lehman style fingerprint of an element/bond graph. Two molecules with
// the same connectivity and bond orders get the same signature.
function signature(els, bonds) {
  const n = els.length, adj = els.map(() => []);
  bonds.forEach(b => { adj[b.a].push([b.b, b.order]); adj[b.b].push([b.a, b.order]); });
  let lab = els.slice();
  const rounds = Math.min(n, 12);
  for (let r = 0; r < rounds; r++) {
    const prev = lab;
    lab = prev.map((l, i) => cyrb53(l + '[' + adj[i].map(([j, o]) => o + ':' + prev[j]).sort().join(',') + ']'));
  }
  const counts = {};
  els.forEach(e => { counts[e] = (counts[e] || 0) + 1; });
  return formulaOf(counts) + '/' + lab.slice().sort().join('.');
}

// Minimal SMILES: organic atoms C N O S P F Cl, bracket atoms like [Na] and [H], - = #, ( ), ring digits.
function parseSmiles(smi) {
  const atoms = [], bonds = [], stack = [], rings = {};
  let prev = -1, order = 1;
  for (let i = 0; i < smi.length; i++) {
    const c = smi[i];
    let sym = null, bracket = false;
    if (c === '[') { const j = smi.indexOf(']', i); sym = smi.slice(i + 1, j); i = j; bracket = true; }
    else if (c === 'C' && smi[i + 1] === 'l') { sym = 'Cl'; i++; }
    else if ('CNOSPFH'.includes(c)) sym = c;
    else if (c === '-') { order = 1; continue; }
    else if (c === '=') { order = 2; continue; }
    else if (c === '#') { order = 3; continue; }
    else if (c === '(') { stack.push(prev); continue; }
    else if (c === ')') { prev = stack.pop(); continue; }
    else if (/[0-9]/.test(c)) {
      if (rings[c] !== undefined) { bonds.push({ a: rings[c], b: prev, order }); delete rings[c]; order = 1; }
      else rings[c] = prev;
      continue;
    } else throw new Error('Bad SMILES character ' + c + ' in ' + smi);
    if (!E[sym]) throw new Error('Unknown element ' + sym);
    atoms.push({ el: sym, bracket });
    const idx = atoms.length - 1;
    if (prev >= 0) bonds.push({ a: prev, b: idx, order });
    order = 1; prev = idx;
  }
  // implicit hydrogens
  const n = atoms.length;
  for (let i = 0; i < n; i++) {
    if (atoms[i].bracket) continue;
    let sum = 0;
    bonds.forEach(b => { if (b.a === i || b.b === i) sum += b.order; });
    const v = effValence(atoms[i].el, sum);
    if (v === null) throw new Error('Too many bonds on ' + atoms[i].el + ' in ' + smi);
    for (let h = 0; h < v - sum; h++) { atoms.push({ el: 'H', bracket: true }); bonds.push({ a: i, b: atoms.length - 1, order: 1 }); }
  }
  return { atoms, bonds };
}

let _lib = null;
function library() {
  if (_lib) return _lib;
  const list = AA.MOLECULES.map(m => {
    const g = parseSmiles(m.smiles);
    const els = g.atoms.map(a => a.el);
    const counts = {};
    els.forEach(e => { counts[e] = (counts[e] || 0) + 1; });
    const formula = formulaOf(counts);
    return Object.assign({}, m, { counts, formula, sig: signature(els, g.bonds), atomCount: els.length });
  });
  _lib = { list, byId: new Map(list.map(m => [m.id, m])), bySig: new Map(list.map(m => [m.sig, m])) };
  return _lib;
}

AA.chem = { maxValence, effValence, lonePairs, isIonic, bondRest, formulaOf, sub, signature, parseSmiles, library, cyrb53 };
if (typeof module !== 'undefined') module.exports = AA.chem;
})(typeof globalThis !== 'undefined' ? globalThis : window);
