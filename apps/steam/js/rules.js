(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
const S = AA.spectra, C = AA.chem;

// Rules for reading signals and checking a structure against what the player has written down.
// Kept apart from the screens so they can be tested without a browser UI.

function hash(s) { let a = 2166136261; for (const ch of String(s)) a = Math.imul(a ^ ch.charCodeAt(0), 16777619); return a >>> 0; }
function rng(seed) { let a = seed | 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const nameOf = (k, p) => k === 'ir' ? p.name : p.label;
const posOf = (k, p) => k === 'ms' ? p.mz : k === 'ir' ? p.centre : p.shift;
const keyOf = (k, p) => k + '|' + posOf(k, p) + '|' + nameOf(k, p);

// Labels that mean the same thing to a chemist are one answer.
const ALIAS = {
  ir: [['O–H stretch (carboxylic acid, very broad)', 'O–H stretch (acid)'], ['C–H stretch', 'C–H stretch (sp³)'], ['S=O stretch', 'S=O asymmetric stretch', 'S=O symmetric stretch']],
  nmr: [['COOH', 'acid O–H']], ms: []
};
function canon(k, n) {
  if (k === 'ms') { if (/^M⁺/.test(n)) return 'M⁺ (molecular ion)'; if (/^M\+2/.test(n)) return 'M+2 (isotope)'; return n.replace(/^M−1\s+/, 'M−'); }
  const g = ALIAS[k].find(a => a.includes(n)); return g ? g[0] : n;
}

// ---- nominal masses of the groups named in mass-spectrum labels ----
const SUBS = { '₀': 0, '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9 };
const MASS = { H: 1, C: 12, N: 14, O: 16, F: 19, Na: 23, P: 31, S: 32, Cl: 35 };
function formulaMass(f) {
  f = f.replace(/[₀-₉]/g, c => SUBS[c]); let m = 0, ok = true;
  f.replace(/([A-Z][a-z]?)(\d*)/g, (x, e, n) => { if (MASS[e] === undefined) ok = false; else m += MASS[e] * (+n || 1); return ''; });
  return ok && m > 0 ? m : null;
}
// The m/z a label would put a peak at, given the molecular mass. null = cannot say.
function impliedMz(label, M) {
  if (/\(/.test(label) && !/^M⁺/.test(label) && !/^M\+/.test(label)) return null;
  if (/^M⁺/.test(label)) return M;
  let m = /^M\+(\d)/.exec(label); if (m) return M + (+m[1]);
  m = /^M−(\d*)\s*([A-Za-z₀-₉]+)/.exec(label); if (m) { const g = formulaMass(m[2]); return g == null ? null : M - (+m[1] || 1) * g; }
  m = /^([A-Za-z₀-₉]+)⁺$/.exec(label); if (m) return formulaMass(m[1]);
  return null;
}

// ---- pools ----
const POOL = { ms: new Map(), ir: new Map(), nmr: new Map() };   // canonical name -> list of positions
function pool() {
  if (pool.done) return; pool.done = true;
  C.library().list.forEach(m => {
    const d = S.describe(m.smiles), add = (k, n, pos) => { const c = canon(k, n); (POOL[k].get(c) || POOL[k].set(c, []).get(c)).push(pos); };
    d.ms.peaks.forEach(p => add('ms', p.label, p.mz)); d.ir.peaks.forEach(p => add('ir', p.name, p.centre)); d.nmr.peaks.forEach(p => { if (!/^H–(H|Cl)$/.test(p.label)) add('nmr', p.label, p.shift); });
  });
}

// Five choices: the right one and four that are plausible but wrong. Wrong ones never describe the same signal.
function optionsFor(k, peak, key, M) {
  pool();
  const truth = canon(k, nameOf(k, peak)), pos = posOf(k, peak), r = rng(hash(key));
  let cands = [];
  POOL[k].forEach((positions, name) => {
    if (name === truth) return;
    let dist;
    if (k === 'ms') { const imp = impliedMz(name, M); if (imp == null || Math.abs(imp - pos) < 1) return; dist = Math.abs(imp - pos); }
    else dist = Math.min.apply(null, positions.map(x => Math.abs(x - pos)));
    cands.push({ name, dist });
  });
  cands.sort((a, b) => a.dist - b.dist);
  const near = cands.slice(0, 8);
  for (let i = near.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [near[i], near[j]] = [near[j], near[i]]; }
  const out = near.slice(0, 4).map(c => c.name); out.splice(Math.floor(r() * (out.length + 1)), 0, truth);
  return out;
}

function carbons(formula) { const m = /C(\d*)/.exec(formula.replace(/Cl/g, '').replace(/Na/g, '')); return m ? (+m[1] || 1) : 0; }
function dou(formula) {
  const n = {}; formula.replace(/([A-Z][a-z]?)(\d*)/g, (m, e, c) => { if (e) n[e] = (n[e] || 0) + (+c || 1); return ''; });
  if (!n.C) return null; return (2 * n.C + 2 + (n.N || 0) + (n.P || 0) - (n.H || 0) - (n.F || 0) - (n.Cl || 0)) / 2;
}
// Does a structure's own spectrum explain a finding the player has written down?
//   finding: { k, pos, kind: 'M'|'M1'|'', hs, mult, n }
function explains(f, d) {
  if (f.k === 'ms') {
    if (f.kind === 'M') return d.ms.M === f.pos;
    if (f.kind === 'M1') return Math.abs(carbons(d.formula) - f.n) <= 1;
    return d.ms.peaks.some(p => Math.abs(p.mz - f.pos) < 1);
  }
  if (f.k === 'ir') return !d.ir.silent && d.ir.peaks.some(p => Math.abs(p.centre - f.pos) <= 40);
  return d.nmr.peaks.some(p => Math.abs(p.shift - f.pos) <= 0.5 && p.hs === f.hs && (!f.mult || f.mult === '?' || p.mult === f.mult));
}

AA.rules = { hash, rng, nameOf, posOf, keyOf, canon, optionsFor, explains, dou, carbons, impliedMz };
})(typeof globalThis !== 'undefined' ? globalThis : window);
