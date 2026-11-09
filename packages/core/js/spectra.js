(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
const C = AA.chem;

// ---------------------------------------------------------------------------------------------
// Teaching-grade spectra simulator. From a molecule's bond graph it produces
//   - a mass spectrum (molecular ion, isotope peaks and typical fragments),
//   - an infrared spectrum (peaks for each functional group),
//   - a 1H NMR spectrum (one signal per chemically different hydrogen: shift, integral, splitting).
// These follow the standard textbook rules and correlation tables. They are NOT predictions of real
// instrument output, and the game says so. All numbers here are approximate on purpose.
// ---------------------------------------------------------------------------------------------

const NOMINAL = { H: 1, C: 12, N: 14, O: 16, F: 19, Na: 23, P: 31, S: 32, Cl: 35 };

function fromGraph(atoms, bonds) {
  const adj = atoms.map(() => []);
  bonds.forEach(b => { adj[b.a].push({ j: b.b, o: b.order }); adj[b.b].push({ j: b.a, o: b.order }); });
  const counts = {}; atoms.forEach(a => { counts[a.el] = (counts[a.el] || 0) + 1; });
  return { A: atoms, bonds, adj, n: atoms.length, counts };
}
function build(smiles) { const g = C.parseSmiles(smiles); return fromGraph(g.atoms, g.bonds); }

// ---- helpers over the graph ----
const H = (G, i) => G.adj[i].filter(x => G.A[x.j].el === 'H').length;
const heavy = (G, i) => G.adj[i].filter(x => G.A[x.j].el !== 'H');
const isCarbonyl = (G, i) => G.A[i].el === 'C' && G.adj[i].some(x => G.A[x.j].el === 'O' && x.o === 2);

// six-membered all-carbon rings with one double bond per atom (benzene-type)
function aromaticAtoms(G) {
  const set = new Set(), n = G.n;
  const order = (a, b) => { const e = G.adj[a].find(x => x.j === b); return e ? e.o : 0; };
  function dfs(start, path) {
    const last = path[path.length - 1];
    if (path.length === 6) { if (order(last, start)) check(path); return; }
    for (const x of G.adj[last]) if (G.A[x.j].el === 'C' && x.j > start && !path.includes(x.j)) dfs(start, path.concat(x.j));
  }
  function check(p) {
    for (let k = 0; k < 6; k++) {
      const a = p[k], b = p[(k + 1) % 6], c = p[(k + 5) % 6];
      const dbl = (order(a, b) === 2 ? 1 : 0) + (order(a, c) === 2 ? 1 : 0);
      if (dbl !== 1) return;
    }
    p.forEach(i => set.add(i));
  }
  for (let i = 0; i < n; i++) if (G.A[i].el === 'C') dfs(i, [i]);
  return set;
}

// ---- functional groups ----
function groups(G) {
  const A = G.A, arom = aromaticAtoms(G);
  const g = { alcohol: 0, phenol: 0, acid: 0, aldehyde: 0, ketone: 0, ester: 0, ether: 0, amine: 0, amide: 0, alkene: 0, alkyne: 0,
    terminalAlkyne: 0, symmetricAlkyne: 0, aromaticRings: arom.size / 6, CHsp3: 0, CHsp2: 0, CHsp: 0, CHald: 0, CH3: 0, acylCH3: 0, ethyl: 0,
    NH: 0, halide: 0, sulfonyl: 0, phosphoryl: 0, inorganicOH: 0, water: false, arom };
  if (G.counts.C === undefined && G.counts.O === 1 && G.counts.H === 2 && G.n === 3) g.water = true;
  for (let i = 0; i < G.n; i++) {
    const el = A[i].el, hv = heavy(G, i), h = H(G, i);
    if (el === 'C') {
      const dbl = G.adj[i].filter(x => x.o === 2), trip = G.adj[i].some(x => x.o === 3);
      if (isCarbonyl(G, i)) {
        const others = G.adj[i].filter(x => !(A[x.j].el === 'O' && x.o === 2));
        if (others.some(x => A[x.j].el === 'O' && H(G, x.j) > 0)) g.acid++;
        else if (others.some(x => A[x.j].el === 'O' && heavy(G, x.j).length === 2)) g.ester++;
        else if (others.some(x => A[x.j].el === 'N')) g.amide++;
        else if (others.some(x => A[x.j].el === 'H')) { g.aldehyde++; g.CHald += h; }
        else {
          g.ketone++;
          if (others.some(x => A[x.j].el === 'C' && H(G, x.j) === 3)) g.acylCH3++;
        }
        if (others.some(x => A[x.j].el === 'C' && H(G, x.j) === 3) && !g.ketone) g.acylCH3++;
      } else if (arom.has(i)) g.CHsp2 += h;
      else if (trip) { g.CHsp += h; }
      else if (dbl.some(x => A[x.j].el === 'C')) g.CHsp2 += h;
      else g.CHsp3 += h;
      if (h === 3) g.CH3++;
      if (h === 2 && hv.some(x => A[x.j].el === 'C' && H(G, x.j) === 3)) g.ethyl++;
      G.adj[i].forEach(x => {
        if (x.j > i && A[x.j].el === 'C' && !(arom.has(i) && arom.has(x.j))) {
          if (x.o === 2) g.alkene++;
          if (x.o === 3) { g.alkyne++; if (h > 0 || H(G, x.j) > 0) g.terminalAlkyne++; if (h > 0 && H(G, x.j) > 0) g.symmetricAlkyne++; }
        }
      });
      if (G.adj[i].some(x => A[x.j].el === 'Cl' || A[x.j].el === 'F')) g.halide++;
    } else if (el === 'O') {
      if (h > 0 && hv.length === 1) {
        const c = hv[0];
        if (A[c.j].el === 'C') { if (isCarbonyl(G, c.j)) { /* counted as acid */ } else if (arom.has(c.j)) g.phenol++; else g.alcohol++; }
        else if (A[c.j].el === 'S' || A[c.j].el === 'P') g.inorganicOH++;
      } else if (h === 0 && hv.length === 2 && hv.every(x => A[x.j].el === 'C')) {
        if (!hv.some(x => isCarbonyl(G, x.j))) g.ether++;
      }
    } else if (el === 'N') {
      g.NH += h;
      if (hv.some(x => A[x.j].el === 'C')) { if (hv.some(x => isCarbonyl(G, x.j))) { /* amide counted */ } else g.amine++; }
    } else if (el === 'S' && G.adj[i].some(x => A[x.j].el === 'O' && x.o === 2)) g.sulfonyl++;
    else if (el === 'P' && G.adj[i].some(x => A[x.j].el === 'O' && x.o === 2)) g.phosphoryl++;
  }
  return g;
}

// ---------------------------------------------------------------------------------------------
// Infrared
// ---------------------------------------------------------------------------------------------
const WIDTH = { sharp: 16, medium: 32, broad: 130, vbroad: 280 };
const AMP = { strong: 0.72, medium: 0.42, weak: 0.18 };
const FORMULA_IR = {
  H2O: [[3400, 'strong', 'broad', 'O–H stretch'], [1640, 'medium', 'sharp', 'H–O–H bend']],
  NH3: [[3336, 'medium', 'sharp', 'N–H stretch'], [3444, 'medium', 'sharp', 'N–H stretch'], [1627, 'medium', 'sharp', 'N–H bend'], [950, 'strong', 'sharp', 'umbrella bend']],
  HCl: [[2886, 'medium', 'medium', 'H–Cl stretch']],
  H2S: [[2615, 'weak', 'sharp', 'S–H stretch']],
  SO2: [[1362, 'strong', 'sharp', 'S=O asymmetric stretch'], [1151, 'strong', 'sharp', 'S=O symmetric stretch']],
  CO2: [[2349, 'strong', 'sharp', 'C=O asymmetric stretch'], [667, 'strong', 'sharp', 'O=C=O bend']],
  CH4: [[3019, 'strong', 'sharp', 'C–H stretch'], [1306, 'medium', 'sharp', 'C–H bend']],
  H2O2: [[3400, 'strong', 'broad', 'O–H stretch']]
};
const NO_IR = { H2: 1, N2: 1, O2: 1, Cl2: 1, NaCl: 1, NaF: 1 };

function irPeaks(G, grp, formulaKey) {
  const peaks = [], add = (c, strength, shape, name) => peaks.push({ centre: c, strength, shape, name, width: WIDTH[shape], amp: AMP[strength] });
  if (NO_IR[formulaKey]) return { peaks: [], silent: true, why: (G.counts.Na ? 'An ionic solid has no bond vibrations in this range.' : 'A symmetrical two-atom molecule has no changing dipole, so it absorbs no infrared.') };
  if (FORMULA_IR[formulaKey]) { FORMULA_IR[formulaKey].forEach(p => add(p[0], p[1], p[2], p[3])); return { peaks }; }
  if (grp.alcohol) add(3350, 'strong', 'broad', 'O–H stretch (alcohol)');
  if (grp.phenol) add(3350, 'strong', 'broad', 'O–H stretch (phenol)');
  if (grp.acid) { add(3000, 'strong', 'vbroad', 'O–H stretch (carboxylic acid, very broad)'); add(1710, 'strong', 'sharp', 'C=O stretch (acid)'); }
  if (grp.inorganicOH) add(3000, 'strong', 'vbroad', 'O–H stretch (acid)');
  if (grp.aldehyde) { add(1725, 'strong', 'sharp', 'C=O stretch (aldehyde)'); add(2720, 'weak', 'sharp', 'aldehyde C–H'); add(2820, 'medium', 'sharp', 'aldehyde C–H'); }
  if (grp.ketone) add(1715, 'strong', 'sharp', 'C=O stretch (ketone)');
  if (grp.ester) { add(1740, 'strong', 'sharp', 'C=O stretch (ester)'); add(1240, 'strong', 'medium', 'C–O stretch (ester)'); }
  if (grp.amide) add(1660, 'strong', 'sharp', 'C=O stretch (amide)');
  if (grp.amine || (grp.NH && !grp.amide)) add(3350, 'medium', 'medium', 'N–H stretch');
  if (grp.amide && grp.NH) add(3300, 'medium', 'medium', 'N–H stretch (amide)');
  if (grp.ether) add(1100, 'strong', 'medium', 'C–O stretch (ether)');
  if (grp.alcohol) add(1050, 'strong', 'medium', 'C–O stretch (alcohol)');
  if (grp.phenol) add(1220, 'strong', 'medium', 'C–O stretch (phenol)');
  if (grp.alkene) { add(1650, 'medium', 'sharp', 'C=C stretch'); }
  if (grp.alkyne) {
    if (!grp.symmetricAlkyne) add(2120, 'weak', 'sharp', 'C≡C stretch');
    if (grp.terminalAlkyne) add(3300, 'strong', 'sharp', '≡C–H stretch');
  }
  if (grp.aromaticRings) { add(1600, 'medium', 'sharp', 'aromatic C=C'); add(1500, 'medium', 'sharp', 'aromatic C=C'); add(780, 'strong', 'medium', 'C–H out-of-plane bend (ring)'); }
  if (grp.CHsp2) add(3040, 'medium', 'sharp', '=C–H stretch');
  if (grp.CHsp3) { add(2960, 'strong', 'medium', 'C–H stretch (sp³)'); add(2870, 'medium', 'sharp', 'C–H stretch (sp³)'); add(1450, 'medium', 'sharp', 'C–H bend'); }
  if (grp.CH3) add(1375, 'medium', 'sharp', 'CH₃ bend');
  if (grp.sulfonyl) { add(1350, 'strong', 'sharp', 'S=O stretch'); add(1150, 'strong', 'sharp', 'S=O stretch'); }
  if (grp.phosphoryl) add(1280, 'strong', 'sharp', 'P=O stretch');
  if (grp.halide) add(750, 'strong', 'medium', 'C–Cl stretch');
  return { peaks };
}
// transmittance curve (percent) across the usual 4000 to 500 cm-1 range
function irCurve(peaks, n) {
  n = n || 400; const out = [];
  for (let i = 0; i <= n; i++) {
    const x = 4000 - (3500 * i) / n; let a = 0;
    peaks.forEach(p => { const d = (x - p.centre) / p.width; a += p.amp * Math.exp(-d * d); });
    out.push([x, Math.max(4, 100 - 95 * Math.min(1, a))]);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Mass spectrum
// ---------------------------------------------------------------------------------------------
const TINY_MS = {
  H2O: [[18, 100, 'M⁺'], [17, 21, 'M−H'], [16, 1, 'M−H₂']],
  CO2: [[44, 100, 'M⁺'], [28, 10, 'CO⁺'], [16, 9, 'O⁺'], [12, 9, 'C⁺']],
  N2: [[28, 100, 'M⁺'], [14, 14, 'N⁺']],
  O2: [[32, 100, 'M⁺'], [16, 11, 'O⁺']],
  H2: [[2, 100, 'M⁺'], [1, 2, 'H⁺']],
  CH4: [[16, 100, 'M⁺'], [15, 85, 'M−H'], [14, 10, 'M−2H']],
  NH3: [[17, 100, 'M⁺'], [16, 80, 'M−H'], [15, 8, 'M−2H']],
  HCl: [[36, 100, 'M⁺ (³⁵Cl)'], [38, 32, 'M+2 (³⁷Cl)'], [35, 16, 'Cl⁺'], [37, 5, 'Cl⁺ (³⁷Cl)']],
  Cl2: [[70, 100, 'M⁺ (³⁵Cl₂)'], [72, 64, 'M+2'], [74, 10, 'M+4'], [35, 45, 'Cl⁺'], [37, 14, 'Cl⁺']],
  H2S: [[34, 100, 'M⁺'], [33, 42, 'M−H'], [32, 44, 'S⁺']],
  SO2: [[64, 100, 'M⁺'], [48, 49, 'SO⁺'], [32, 10, 'S⁺']]
};
function massSpec(G, grp, formulaKey) {
  let M = 0; G.A.forEach(a => { M += NOMINAL[a.el] || 0; });
  const nC = G.counts.C || 0, nCl = G.counts.Cl || 0, nS = G.counts.S || 0;
  let list = [];
  if (TINY_MS[formulaKey]) list = TINY_MS[formulaKey].map(r => ({ mz: r[0], rel: r[1], label: r[2] }));
  else {
    const raw = {}; const put = (mz, rel, label) => { if (mz > 0 && mz < M && (!raw[mz] || raw[mz].rel < rel)) raw[mz] = { mz, rel, label }; };
    const mi = grp.aromaticRings ? 100 : (grp.acid || grp.alcohol || grp.inorganicOH) ? 12 : grp.ketone || grp.ether || grp.ester ? 45 : 30;
    list.push({ mz: M, rel: mi, label: 'M⁺ (molecular ion)' });
    if (nC) list.push({ mz: M + 1, rel: mi * 0.011 * nC, label: 'M+1 (¹³C)' });
    if (nCl) list.push({ mz: M + 2, rel: mi * 0.32 * nCl, label: 'M+2 (³⁷Cl)' });
    if (nS) list.push({ mz: M + 2, rel: mi * 0.044 * nS, label: 'M+2 (³⁴S)' });
    if (grp.aldehyde) put(M - 1, 60, 'M−H'), put(M - 29, 55, 'M−CHO');
    if (grp.alcohol) put(M - 1, 25, 'M−H'), put(M - 18, 35, 'M−H₂O'), put(31, 100, 'CH₂OH⁺');
    if (grp.acid) put(M - 17, 35, 'M−OH'), put(M - 45, 45, 'M−COOH'), put(M - 18, 12, 'M−H₂O');
    if (grp.ketone && grp.acylCH3) put(43, 100, 'CH₃CO⁺'), put(M - 15, 65, 'M−CH₃');
    if (grp.ester) put(M - 31, 30, 'M−OCH₃');
    if (grp.CH3 && !grp.acylCH3) put(M - 15, grp.aromaticRings ? 8 : 35, 'M−CH₃');
    if (grp.ethyl) put(M - 29, 40, 'M−C₂H₅');
    if (grp.aromaticRings) put(77, 40, 'C₆H₅⁺'), put(51, 18, 'C₄H₃⁺'), put(M - 1, 14, 'M−H');
    if (!grp.aromaticRings && grp.CHsp3 && !grp.alcohol && !grp.acid && !grp.ketone && !grp.ether && !grp.ester && !grp.aldehyde)
      [[15, 30, 'CH₃⁺'], [29, 60, 'C₂H₅⁺'], [43, 100, 'C₃H₇⁺'], [57, 70, 'C₄H₉⁺']].forEach(r => { if (r[0] < M - 1) put(r[0], r[1], r[2]); });
    if (grp.alkene && !grp.aromaticRings) put(M - 1, 40, 'M−H'), put(27, 100, 'C₂H₃⁺');
    if (grp.alkyne) put(M - 1, 30, 'M−H'), put(24, 14, 'C₂⁺');
    if (grp.ether) put(45, 80, 'CH₃OCH₂⁺'), put(29, 40, 'C₂H₅⁺');
    if (grp.amine || G.counts.N) put(30, 100, 'CH₂NH₂⁺');
    if (grp.sulfonyl || grp.phosphoryl) put(M - 17, 40, 'M−OH'), put(M - 18, 30, 'M−H₂O');
    Object.keys(raw).forEach(k => list.push(raw[k]));
    // ring/sugar-sized molecules: water losses are the story
    if (grp.alcohol >= 3) { for (let k = 1; k <= 3; k++) { const mz = M - 18 * k; if (mz > 20) list.push({ mz, rel: 40 / k, label: 'M−' + k + ' H₂O' }); } }
  }
  const byMz = {}; list.forEach(p => { if (!byMz[p.mz] || byMz[p.mz].rel < p.rel) byMz[p.mz] = p; });
  const peaks = Object.values(byMz).sort((a, b) => a.mz - b.mz), top = Math.max.apply(null, peaks.map(p => p.rel));
  peaks.forEach(p => { p.rel = Math.max(1, Math.round(p.rel / top * 100)); });
  return { M, peaks };
}

// ---------------------------------------------------------------------------------------------
// 1H NMR
// ---------------------------------------------------------------------------------------------
function classes(G) {
  let lab = G.A.map(a => a.el);
  for (let r = 0; r < Math.min(G.n, 6); r++) {
    const prev = lab;
    lab = prev.map((l, i) => C.cyrb53(l + '[' + G.adj[i].map(x => x.o + ':' + prev[x.j]).sort().join(',') + ']'));
  }
  return lab;
}
function shiftFor(G, i, grp) {
  const A = G.A, el = A[i].el, hv = heavy(G, i), h = H(G, i), arom = grp.arom;
  const label = {};
  if (el === 'O') {
    if (grp.water && G.n === 3) return [4.7, 'O–H', true];
    if (hv.length === 1 && A[hv[0].j].el === 'C' && isCarbonyl(G, hv[0].j)) return [11.5, 'COOH', true];
    if (hv.length === 1 && A[hv[0].j].el === 'C' && arom.has(hv[0].j)) return [5.5, 'phenol O–H', true];
    if (hv.length === 1 && (A[hv[0].j].el === 'S' || A[hv[0].j].el === 'P')) return [11.0, 'acid O–H', true];
    return [2.6, 'O–H', true];
  }
  if (el === 'N') return [hv.some(x => A[x.j].el === 'C' && isCarbonyl(G, x.j)) ? 7.5 : hv.length ? 1.5 : 0.9, 'N–H', true];
  if (el === 'S') return [1.5, 'S–H', true];
  if (el === 'Cl') return [1.0, 'H–Cl', true];
  if (el === 'H') return [4.6, 'H–H', false];
  if (el === 'C') {
    if (isCarbonyl(G, i)) return [9.7, 'aldehyde H', false];
    if (arom.has(i)) {
      let s = 7.27;
      G.adj[i].forEach(x => { if (arom.has(x.j)) G.adj[x.j].forEach(y => { if (!arom.has(y.j) && A[y.j].el !== 'H') {
        if (A[y.j].el === 'O' || A[y.j].el === 'N') s -= 0.45; else if (isCarbonyl(G, y.j)) s += 0.45; } }); });
      return [Math.round(s * 10) / 10, 'aromatic H', false];
    }
    if (G.adj[i].some(x => x.o === 3)) return [2.0, '≡C–H', false];
    if (G.adj[i].some(x => x.o === 2 && A[x.j].el === 'C')) return [5.3, '=C–H', false];
    let s = h === 4 ? 0.2 : h === 3 ? 0.9 : h === 2 ? 1.3 : 1.5, kind = 'CH' + (h > 1 ? '₃₂'.charAt(h === 3 ? 0 : 1) : '');
    hv.forEach(x => {
      const e = A[x.j].el;
      if (e === 'O') { const ester = heavy(G, x.j).some(y => y.j !== i && A[y.j].el === 'C' && isCarbonyl(G, y.j)); s += ester ? 2.8 : 2.4; }
      else if (e === 'N') s += 1.5; else if (e === 'Cl') s += 2.2; else if (e === 'S') s += 1.3;
      else if (e === 'C') {
        if (isCarbonyl(G, x.j)) s += 1.2;
        else if (arom.has(x.j)) s += 1.4;
        else if (G.adj[x.j].some(y => y.o >= 2 && A[y.j].el === 'C')) s += 0.8;
        else G.adj[x.j].forEach(y => { if (y.j !== i && (A[y.j].el === 'O' || A[y.j].el === 'N')) s += 0.3; });
      }
    });
    return [Math.min(4.6, Math.round(s * 10) / 10), kind, false];
  }
  return [1.0, 'H', false];
}
function nmr(G, grp) {
  if (G.n === 2 && G.counts.H === 2) return { peaks: [{ shift: 4.6, hs: 2, mult: 's', label: 'H–H', exchangeable: false, neighbours: 0 }], total: 2 };
  const lab = classes(G), envs = new Map();
  for (let i = 0; i < G.n; i++) {
    if (G.A[i].el === 'H') continue;
    const h = H(G, i); if (!h) continue;
    const key = lab[i]; if (!envs.has(key)) envs.set(key, { atoms: [], hs: 0 });
    const e = envs.get(key); e.atoms.push(i); e.hs += h;
  }
  const peaks = [];
  envs.forEach(e => {
    const i = e.atoms[0], sh = shiftFor(G, i, grp), exch = sh[2], key = lab[i];
    let nb = 0;
    if (!exch) {
      const seen = new Set();
      heavy(G, i).forEach(x => { if (G.A[x.j].el === 'C' && lab[x.j] !== key && !seen.has(x.j)) { seen.add(x.j); nb += H(G, x.j); } });
    }
    let mult = exch ? 's' : nb === 0 ? 's' : nb === 1 ? 'd' : nb === 2 ? 't' : nb === 3 ? 'q' : 'm';
    if (sh[1] === 'aromatic H' && e.hs < grp.arom.size && nb > 0) mult = 'm';
    peaks.push({ shift: sh[0], hs: e.hs, mult, label: sh[1], exchangeable: exch, neighbours: nb, atoms: e.atoms });
  });
  peaks.sort((a, b) => b.shift - a.shift);
  return { peaks, total: peaks.reduce((s, p) => s + p.hs, 0) };
}

// ---------------------------------------------------------------------------------------------
function describeG(G, smiles) {
  const grp = groups(G), formula = C.formulaOf(G.counts);
  return { smiles: smiles || null, formula, groups: grp, ms: massSpec(G, grp, formula), ir: irPeaks(G, grp, formula), nmr: nmr(G, grp), atoms: G.n };
}
function describe(smiles) { return describeG(build(smiles), smiles); }
// from a graph: atoms = [{el}], bonds = [{a, b, order}] with every hydrogen present as an atom
function describeGraph(atoms, bonds) { return describeG(fromGraph(atoms, bonds)); }

// What a quick scan shows: small peaks and fine detail are lost in the noise.
function degrade(d) {
  return Object.assign({}, d, {
    quality: 'quick',
    ms: { M: d.ms.M, peaks: d.ms.peaks.filter(p => p.rel >= 10 && !/^M\+[12] /.test(p.label || '')) },
    ir: d.ir.silent ? d.ir : { peaks: d.ir.peaks.filter(p => p.amp >= 0.3) },
    nmr: { total: d.nmr.total, peaks: d.nmr.peaks.map(p => Object.assign({}, p, { shift: Math.round(p.shift * 10) / 10, mult: '?' })) }
  });
}

// ---- how well does one spectrum match another? (0 to 1) ----
function cmpMS(a, b) {
  const va = new Map(), vb = new Map(); a.peaks.forEach(p => va.set(p.mz, p.rel)); b.peaks.forEach(p => vb.set(p.mz, p.rel));
  let dot = 0, na = 0, nb = 0; va.forEach((r, k) => { na += r * r; if (vb.has(k)) dot += r * vb.get(k); }); vb.forEach(r => { nb += r * r; });
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
function cmpIR(a, b) {
  if (a.silent && b.silent) return 1; if (a.silent || b.silent) return 0;
  // C-H bands are in almost every organic molecule, so they count for less than the bands that tell molecules apart
  const w = p => p.amp * (/C.H|CH₃/.test(p.name) ? 0.4 : 1.2);
  let m = 0, sa = 0, sb = 0; a.peaks.forEach(p => { sa += w(p); }); b.peaks.forEach(p => { sb += w(p); });
  const used = new Set();
  a.peaks.forEach(p => {
    let best = -1, bd = 1e9;
    b.peaks.forEach((q, i) => { if (used.has(i)) return; const d = Math.abs(q.centre - p.centre); if (d <= Math.max(35, Math.min(p.width, q.width) * 1.2) && d < bd) { bd = d; best = i; } });
    if (best >= 0) { used.add(best); m += Math.min(w(p), w(b.peaks[best])); }
  });
  return (2 * m) / (sa + sb || 1);
}
function cmpNMR(a, b) {
  if (!a.total && !b.total) return 1;          // no hydrogen at all: nothing to see, and nothing to disagree about
  if (!a.total || !b.total) return 0;
  const used = new Set(); let m = 0;
  a.peaks.forEach(p => {
    let best = -1, bd = 9;
    b.peaks.forEach((q, i) => { if (used.has(i)) return; const d = Math.abs(q.shift - p.shift); if (d <= 0.4 && d < bd) { bd = d; best = i; } });
    if (best >= 0) { const q = b.peaks[best]; used.add(best); m += Math.min(p.hs, q.hs) * (p.mult !== q.mult && p.mult !== '?' && q.mult !== '?' ? 0.85 : 1); }
  });
  return (2 * m) / (a.total + b.total);
}
function compare(target, mine) { return { ms: cmpMS(target.ms, mine.ms), ir: cmpIR(target.ir, mine.ir), nmr: cmpNMR(target.nmr, mine.nmr) }; }
// names of the functional groups present, for hints
function groupNames(grp) {
  const out = [];
  [['alcohol', 'alcohol (–OH)'], ['phenol', 'phenol'], ['acid', 'carboxylic acid (–COOH)'], ['aldehyde', 'aldehyde (–CHO)'], ['ketone', 'ketone (C=O)'],
   ['ester', 'ester'], ['ether', 'ether (C–O–C)'], ['amine', 'amine (–NH₂)'], ['amide', 'amide'], ['alkene', 'C=C double bond'], ['alkyne', 'C≡C triple bond'],
   ['aromaticRings', 'benzene-type ring'], ['sulfonyl', 'S=O'], ['phosphoryl', 'P=O']].forEach(([k, n]) => { if (grp[k]) out.push(n); });
  return out;
}

AA.spectra = { describe, describeGraph, degrade, compare, irCurve, groupNames, build, groups, NOMINAL };
if (typeof module !== 'undefined') module.exports = AA.spectra;
})(typeof globalThis !== 'undefined' ? globalThis : window);
