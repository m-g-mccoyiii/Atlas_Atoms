(function (root) {
'use strict';
const AA = root.AA, C = AA.chem, S = AA.spectra;

// Reaction rules for the reagent bottles. Every rule is a textbook functional-group transformation applied
// to the molecular graph. A bottle acts on every matching site at once. No rule makes or breaks a C-C bond,
// so the carbon skeleton of the feedstock is kept and every product can be named from its chain.

// ---------- reading the graph ----------
const nbs = (m, a) => m.neighbors(a);
const Hs = (m, a) => nbs(m, a).filter(n => n.atom.el === 'H').map(n => n.atom);
const isSp3 = (m, a) => nbs(m, a).every(n => n.bond.order === 1);
const hetero = (m, a) => nbs(m, a).some(n => n.atom.el !== 'C' && n.atom.el !== 'H');
const otherHetero = (m, c, x) => nbs(m, c).some(n => n.atom !== x && n.atom.el !== 'C' && n.atom.el !== 'H');
const hasO = (m, a) => nbs(m, a).some(n => n.atom.el === 'O');
const isCarbonylC = (m, a) => a.el === 'C' && nbs(m, a).some(n => n.atom.el === 'O' && n.bond.order === 2);
const carbonsOf = (m, a) => nbs(m, a).filter(n => n.atom.el === 'C').map(n => n.atom);
const cut = (m, a, b) => { m.bonds = m.bonds.filter(k => !((k.a === a && k.b === b) || (k.a === b && k.b === a))); };

// number of C-C bonds from a carbon to the nearest end of the chain; used only to settle ties the same way every time
function endDist(m, c) {
  const seen = new Set([c]); let layer = [c], d = 0;
  while (layer.length) {
    const next = [];
    for (const a of layer) { const cn = carbonsOf(m, a); if (cn.length <= 1) return d; cn.forEach(x => { if (!seen.has(x)) { seen.add(x); next.push(x); } }); }
    layer = next; d++;
  }
  return d;
}

// a direction pointing away from an atom's neighbours, so new atoms arrive through free space
function outward(m, c) {
  const q = nbs(m, c);
  let d = [0, 0, 0];
  q.forEach(n => { d[0] += c.x - n.atom.x; d[1] += c.y - n.atom.y; d[2] += c.z - n.atom.z; });
  let L = Math.hypot(d[0], d[1], d[2]);
  if (L < 0.5 && q.length >= 2) {
    const u = [q[0].atom.x - c.x, q[0].atom.y - c.y, q[0].atom.z - c.z], w = [q[1].atom.x - c.x, q[1].atom.y - c.y, q[1].atom.z - c.z];
    d = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    if (Math.random() < 0.5) d = [-d[0], -d[1], -d[2]];
    L = Math.hypot(d[0], d[1], d[2]);
  }
  if (L < 1e-3) { d = [Math.random() - 0.5, 1, Math.random() - 0.5]; L = Math.hypot(d[0], d[1], d[2]); }
  d = [d[0] / L + (Math.random() - 0.5) * 0.5, d[1] / L + (Math.random() - 0.5) * 0.5, d[2] / L + (Math.random() - 0.5) * 0.5];
  L = Math.hypot(d[0], d[1], d[2]);
  return [d[0] / L, d[1] / L, d[2] / L];
}
function attach(m, el, to, dist) {
  const d = outward(m, to), a = m.addAtom(el, to.x + d[0] * dist, to.y + d[1] * dist, to.z + d[2] * dist);
  m.bond(to, a);
  return a;
}

// Markovnikov: returns [carbon that takes the heteroatom, carbon that takes H].
function markovnikov(m, a, b) {
  const other = c => c === a ? b : a;
  const conj = c => nbs(m, c).some(n => n.atom !== other(c) && isCarbonylC(m, n.atom));
  const ca = conj(a), cb = conj(b);
  if (ca !== cb) return ca ? [b, a] : [a, b];             // next to C=O the group goes on the far (beta) carbon
  const ha = Hs(m, a).length, hb = Hs(m, b).length;
  if (ha !== hb) return ha < hb ? [a, b] : [b, a];        // the carbon with fewer H carries the positive charge better
  const pull = c => nbs(m, c).some(n => n.atom !== other(c) && n.atom.el === 'C' && hetero(m, n.atom));
  const pa = pull(a), pb = pull(b);
  if (pa !== pb) return pa ? [b, a] : [a, b];             // stay away from a carbon that already carries O or Cl
  const da = endDist(m, a), db = endDist(m, b);
  return da <= db ? [a, b] : [b, a];                      // a real reaction gives both; the game picks one, always the same
}

// The carbons of benzene rings: six carbons in a ring with three double bonds between them. No reagent here acts
// on one. A molecule with no ring at all is answered at once.
function aromaticAtoms(m) {
  const out = new Set(), heavy = m.atoms.filter(a => a.el !== 'H' && !a.fly);
  if (m.bonds.filter(b => b.a.el !== 'H' && b.b.el !== 'H').length < heavy.length) return out;
  const nb = a => nbs(m, a).filter(n => n.atom.el === 'C');
  heavy.forEach(a0 => {
    if (a0.el !== 'C' || out.has(a0)) return;
    const walk = (path, dbl) => {
      const a = path[path.length - 1];
      if (path.length === 6) { const cl = nb(a).find(n => n.atom === a0); if (cl && dbl + (cl.bond.order === 2 ? 1 : 0) === 3) path.forEach(x => out.add(x)); return; }
      nb(a).forEach(n => { if (!path.includes(n.atom)) walk(path.concat(n.atom), dbl + (n.bond.order === 2 ? 1 : 0)); });
    };
    walk([a0], 0);
  });
  return out;
}
function alkenes(m) {
  const ar = aromaticAtoms(m);
  return m.bonds.filter(b => b.order === 2 && b.a.el === 'C' && b.b.el === 'C' && !(ar.has(b.a) && ar.has(b.b)))
    .map(b => ({ kind: 'ene', bond: b, atoms: [b.a, b.b], asym: Math.abs(Hs(m, b.a).length - Hs(m, b.b).length) }))
    .sort((p, q) => q.asym - p.asym);
}
const alkeneOk = (m, s) => m.bonds.includes(s.bond) && s.bond.order === 2;

function hydroxyl(m, o) {
  if (o.el !== 'O') return null;
  const q = nbs(m, o);
  if (q.length !== 2 || q.some(n => n.bond.order !== 1)) return null;
  const c = q.find(n => n.atom.el === 'C'), hh = q.find(n => n.atom.el === 'H');
  if (!c || !hh || !isSp3(m, c.atom)) return null;
  return { o, c: c.atom, ho: hh.atom };
}
function oxidisable(m, o) {
  const s = hydroxyl(m, o);
  if (!s || !Hs(m, s.c).length || otherHetero(m, s.c, o)) return null;
  return { o, c: s.c, ho: s.ho, atoms: [s.c, o] };
}
function swappable(m, o) {                                  // C-OH that thionyl chloride turns into C-Cl
  const s = hydroxyl(m, o);
  if (!s || otherHetero(m, s.c, o)) return null;
  return { o, c: s.c, ho: s.ho, atoms: [s.c, o] };
}
const zaitsev = (m, c, betas) => {
  const conj = x => nbs(m, x).some(n => n.atom !== c && n.atom.el === 'C' && !isSp3(m, n.atom));
  return betas.sort((p, q) => (Hs(m, p).length - Hs(m, q).length) || ((conj(q) ? 1 : 0) - (conj(p) ? 1 : 0)) || (endDist(m, q) - endDist(m, p)))[0];
};
function eliminable(m, o) {
  const s = hydroxyl(m, o);
  if (!s) return null;
  const cn = carbonsOf(m, s.c);
  if (cn.some(x => hasO(m, x))) return null;              // 1,2-diols and alpha-hydroxy ketones rearrange instead; left out
  const betas = cn.filter(x => isSp3(m, x) && Hs(m, x).length && !hetero(m, x));
  if (!betas.length) return null;
  const beta = zaitsev(m, s.c, betas);
  return { o, c: s.c, ho: s.ho, beta, atoms: [s.c, beta, o] };
}
function reducible(m, b) {
  if (b.order !== 2) return null;
  const c = b.a.el === 'C' && b.b.el === 'O' ? b.a : b.b.el === 'C' && b.a.el === 'O' ? b.b : null;
  if (!c) return null;
  const o = c === b.a ? b.b : b.a;
  if (otherHetero(m, c, o)) return null;                  // acids, esters, amides are untouched
  return { kind: 'co', bond: b, c, o, atoms: [c, o] };
}
function chloride(m, x) {
  if (x.el !== 'Cl') return null;
  const q = nbs(m, x);
  if (q.length !== 1 || q[0].atom.el !== 'C' || !isSp3(m, q[0].atom)) return null;
  return { cl: x, c: q[0].atom };
}
function substitutable(m, x) {
  const s = chloride(m, x);
  if (!s || otherHetero(m, s.c, x)) return null;
  return { cl: x, c: s.c, atoms: [s.c, x] };
}
function dehydrohalogenable(m, x) {
  const s = chloride(m, x);
  if (!s) return null;
  const cn = carbonsOf(m, s.c);
  if (cn.some(y => hasO(m, y))) return null;              // chlorohydrins close to epoxides and alpha-chloro ketones rearrange; left out
  const betas = cn.filter(y => isSp3(m, y) && Hs(m, y).length && !hetero(m, y));
  if (!betas.length) return null;
  const beta = zaitsev(m, s.c, betas);
  return { cl: x, c: s.c, beta, atoms: [s.c, beta, x] };
}
const carbonyls = m => m.bonds.map(b => reducible(m, b)).filter(Boolean);
const reduceCO = (m, s) => { s.bond.order = 1; const h1 = attach(m, 'H', s.c, 2.4), h2 = attach(m, 'H', s.o, 2.0); return { focus: [s.c, s.o], incoming: [h1, h2], leaving: [], tag: '+2H' }; };

// find(model) -> sites; ok(model, site) re-checks a site just before it reacts;
// apply(model, site) edits the graph and returns { focus, incoming, leaving, tag } for the animation.
// ghs: hazard pictograms printed on the label. cls: reagent class, used by order restrictions.
const LIST = [
  { id: 'hydrate', verb: 'Hydrate', formula: 'H₂SO₄ (aq)', chem: 'Sulfuric acid, 1 M', rgb: [36, 104, 214], cls: 'acid', ghs: ['corr'],
    rule: 'Adds water across C=C. The OH goes on the carbon with fewer H.', from: 'ene', to: 'addO',
    find: alkenes, ok: alkeneOk,
    apply(m, s) { const [cx, ch] = markovnikov(m, s.bond.a, s.bond.b); s.bond.order = 1; const hh = attach(m, 'H', ch, 2.4), o = attach(m, 'O', cx, 2.8), ho = attach(m, 'H', o, 1.2); return { focus: [cx, ch], incoming: [hh, o, ho], leaving: [], tag: '+H₂O' }; } },
  { id: 'pcc', verb: 'Oxidize', formula: 'PCC', chem: 'Pyridinium chlorochromate', rgb: [240, 132, 0], cls: 'oxidant', ghs: ['oxid', 'health'],
    rule: 'Turns C-OH into C=O. The carbon must have an H to give up.', from: 'ol', to: 'one',
    find: m => m.atoms.map(a => oxidisable(m, a)).filter(Boolean), ok: (m, s) => !!oxidisable(m, s.o),
    apply(m, s) { const hc = Hs(m, s.c)[0]; cut(m, s.c, hc); cut(m, s.o, s.ho); m.bond(s.c, s.o); m.bond(hc, s.ho); return { focus: [s.c, s.o], incoming: [], leaving: [[hc, s.ho]], tag: 'loses 2 H' }; } },
  { id: 'nabh4', verb: 'Reduce', formula: 'NaBH₄', chem: 'Sodium borohydride', rgb: [214, 40, 40], cls: 'hydride', ghs: ['flame', 'corr', 'skull'],
    rule: 'Turns C=O into C-OH. Leaves C=C alone.', from: 'one', to: 'ol',
    find: carbonyls, ok: (m, s) => m.bonds.includes(s.bond) && !!reducible(m, s.bond), apply: reduceCO },
  { id: 'dehydrate', verb: 'Dehydrate', formula: 'H₂SO₄ conc.', chem: 'Sulfuric acid, 98 %, hot', rgb: [24, 24, 24], cls: 'acid', ghs: ['corr'],
    rule: 'Removes water from an alcohol and leaves C=C behind.', from: 'addO', to: 'ene',
    find: m => m.atoms.map(a => eliminable(m, a)).filter(Boolean), ok: (m, s) => !!eliminable(m, s.o),
    apply(m, s0) { const s = eliminable(m, s0.o), hb = Hs(m, s.beta)[0]; cut(m, s.c, s.o); cut(m, s.beta, hb); m.bond(s.o, hb); m.bond(s.c, s.beta); return { focus: [s.c, s.beta], incoming: [], leaving: [[s.o, s.ho, hb]], tag: 'loses H₂O' }; } },
  { id: 'h2', verb: 'Hydrogenate', formula: 'H₂, Pd/C', chem: 'Hydrogen over palladium on carbon', rgb: [110, 122, 134], cls: 'metal', ghs: ['flame', 'cyl'],
    rule: 'Adds H₂ across C=C. Leaves C=O alone.', from: 'ene', to: 'addH',
    find: alkenes, ok: alkeneOk,
    apply(m, s) { s.bond.order = 1; const h1 = attach(m, 'H', s.bond.a, 2.4), h2 = attach(m, 'H', s.bond.b, 2.4); return { focus: [s.bond.a, s.bond.b], incoming: [h1, h2], leaving: [], tag: '+H₂' }; } },
  { id: 'hcl', verb: 'Add HCl', formula: 'HCl', chem: 'Hydrogen chloride', rgb: [22, 150, 84], cls: 'acid', ghs: ['corr', 'excl'],
    rule: 'Adds H and Cl across C=C. The Cl goes on the carbon with fewer H.', from: 'ene', to: 'addCl',
    find: alkenes, ok: alkeneOk,
    apply(m, s) { const [cx, ch] = markovnikov(m, s.bond.a, s.bond.b); s.bond.order = 1; const hh = attach(m, 'H', ch, 2.4), cl = attach(m, 'Cl', cx, 3.0); return { focus: [cx, ch], incoming: [hh, cl], leaving: [], tag: '+HCl' }; } },
  { id: 'bh3', verb: 'Hydroborate', formula: 'BH₃ in THF', chem: 'Borane, then H₂O₂ and NaOH', rgb: [0, 140, 150], cls: 'hydride', ghs: ['flame', 'corr', 'excl'],
    rule: 'Adds water across C=C with the OH on the carbon with more H. Also turns C=O into C-OH.', from: 'ene', to: 'addOanti',
    find: m => alkenes(m).concat(carbonyls(m)),
    ok: (m, s) => s.kind === 'ene' ? alkeneOk(m, s) : m.bonds.includes(s.bond) && !!reducible(m, s.bond),
    apply(m, s) {
      if (s.kind === 'co') return reduceCO(m, s);
      const [ch, cx] = markovnikov(m, s.bond.a, s.bond.b); s.bond.order = 1;
      const hh = attach(m, 'H', ch, 2.4), o = attach(m, 'O', cx, 2.8), ho = attach(m, 'H', o, 1.2);
      return { focus: [cx, ch], incoming: [hh, o, ho], leaving: [], tag: '+H₂O' };
    } },
  { id: 'socl2', verb: 'Chlorinate', formula: 'SOCl₂', chem: 'Thionyl chloride', rgb: [150, 160, 0], cls: 'chloride', ghs: ['corr', 'skull'],
    rule: 'Swaps the OH of an alcohol for Cl.', from: 'ol', to: 'cl',
    find: m => m.atoms.map(a => swappable(m, a)).filter(Boolean), ok: (m, s) => !!swappable(m, s.o),
    apply(m, s) { cut(m, s.c, s.o); const cl = attach(m, 'Cl', s.c, 3.0); return { focus: [s.c, cl], incoming: [cl], leaving: [[s.o, s.ho]], tag: 'OH to Cl' }; } },
  { id: 'koh', verb: 'Eliminate', formula: 'KOH / EtOH', chem: 'Potassium hydroxide in ethanol, hot', rgb: [112, 62, 196], cls: 'base', ghs: ['corr', 'flame'],
    rule: 'Removes H and Cl from neighbouring carbons and leaves C=C behind.', from: 'addCl', to: 'ene',
    find: m => m.atoms.map(a => dehydrohalogenable(m, a)).filter(Boolean), ok: (m, s) => !!dehydrohalogenable(m, s.cl),
    apply(m, s0) { const s = dehydrohalogenable(m, s0.cl), hb = Hs(m, s.beta)[0]; cut(m, s.c, s.cl); cut(m, s.beta, hb); m.bond(s.cl, hb); m.bond(s.c, s.beta); return { focus: [s.c, s.beta], incoming: [], leaving: [[s.cl, hb]], tag: 'loses HCl' }; } },
  { id: 'naoh', verb: 'Substitute', formula: 'NaOH (aq)', chem: 'Sodium hydroxide, 2 M, warm', rgb: [168, 92, 36], cls: 'base', ghs: ['corr'],
    rule: 'Swaps the Cl of a chloroalkane for OH.', from: 'cl', to: 'ol',
    find: m => m.atoms.map(a => substitutable(m, a)).filter(Boolean), ok: (m, s) => !!substitutable(m, s.cl),
    apply(m, s) { cut(m, s.c, s.cl); const o = attach(m, 'O', s.c, 2.8), ho = attach(m, 'H', o, 1.2); return { focus: [s.c, o], incoming: [o, ho], leaving: [[s.cl]], tag: 'Cl to OH' }; } },
  // Ring closing: two OH groups four or five carbons apart join into a ring through one oxygen, and water leaves.
  // This is how a chain becomes a ring in the player's hands.
  { id: 'cyclize', verb: 'Close', formula: 'H₂SO₄ dil., heat', chem: 'Dilute acid, heat', rgb: [47, 143, 106], cls: 'acid', ghs: ['corr'],
    rule: 'Joins two OH groups four or five carbons apart into a ring. Water leaves.', from: 'ol', to: 'ring',
    find: m => m.atoms.map(a => ringable(m, a)).filter(Boolean).slice(0, 1), ok: (m, s) => !!ringable(m, s.o),
    apply(m, s0) { const s = ringable(m, s0.o); cut(m, s.o, s.ho); cut(m, s.c2, s.o2); m.bond(s.o2, s.ho); m.bond(s.o, s.c2); return { focus: [s.c, s.o, s.c2], incoming: [], leaving: [[s.o2, s.ho2, s.ho]], tag: 'closes a ring' }; } },
  // Snap: two C=C in one molecule, a few carbons apart, close a four-ring between them under light. The chain folds
  // into fused rings, which is how a cage is built.
  { id: 'snap', verb: 'Snap', formula: 'hν', chem: 'Ultraviolet light', rgb: [200, 38, 28], cls: 'light', ghs: [],
    rule: 'Two C=C a few carbons apart join into a four-ring. The chain folds into fused rings.', from: 'ene', to: 'cage',
    find: snappable, ok: m => snappable(m).length > 0,
    apply(m) { const s = snappable(m)[0]; s.A.order = 1; s.B.order = 1; m.bond(s.a1, s.b1); m.bond(s.a2, s.b2); return { focus: [s.a1, s.a2, s.b1, s.b2], incoming: [], leaving: [], tag: 'folds shut' }; } },
  // Aromatize: a six-ring of carbon that already has a C=C gives up hydrogen and becomes a benzene ring.
  { id: 'aromatize', verb: 'Aromatize', formula: 'Pd/C, heat', chem: 'Palladium on carbon, heat', rgb: [168, 121, 26], cls: 'metal', ghs: ['flame'],
    rule: 'A six-ring with a C=C in it gives up hydrogen and becomes a benzene ring.', from: 'ring', to: 'arene',
    find: aromatizable, ok: m => aromatizable(m).length > 0,
    apply(m) { const s = aromatizable(m)[0], R = s.ring, leaving = [];
      for (let i = 0; i < 6; i++) { if (i % 2 !== s.par) continue; const a = R[i], b = R[(i + 1) % 6], k = bondOf(m, a, b); if (k.order === 2) continue; const ha = Hs(m, a)[0], hb = Hs(m, b)[0]; cut(m, a, ha); cut(m, b, hb); m.bond(ha, hb); k.order = 2; leaving.push([ha, hb]); }
      return { focus: R.slice(), incoming: [], leaving, tag: 'becomes aromatic' }; } },
  // Reagents that build. Each adds carbon at a C=O, so the molecule grows as the round goes on.
  { id: 'memgbr', verb: 'Add methyl', formula: 'CH₃MgBr', chem: 'Methylmagnesium bromide, then dilute acid', rgb: [196, 60, 150], cls: 'grignard', ghs: ['flame', 'corr'],
    rule: 'Adds CH₃ to the carbon of C=O and leaves C-OH.', from: 'one', to: 'ol',
    find: carbonyls, ok: (m, s) => m.bonds.includes(s.bond) && !!reducible(m, s.bond),
    apply(m, s) { s.bond.order = 1; const c = attach(m, 'C', s.c, 3.0), hs = [0, 1, 2].map(() => attach(m, 'H', c, 2.2)), ho = attach(m, 'H', s.o, 2.0); return { focus: [s.c, s.o], incoming: [c, ho].concat(hs), leaving: [], tag: '+CH₃' }; } },
  { id: 'wittig', verb: 'Methylenate', formula: 'Ph₃P=CH₂', chem: 'Methylenetriphenylphosphorane', rgb: [230, 100, 60], cls: 'ylide', ghs: ['excl'],
    rule: 'Swaps the O of C=O for CH₂ and leaves C=C.', from: 'one', to: 'ene',
    find: carbonyls, ok: (m, s) => m.bonds.includes(s.bond) && !!reducible(m, s.bond),
    apply(m, s) { cut(m, s.c, s.o); const c = attach(m, 'C', s.c, 3.0); m.bond(s.c, c); const hs = [0, 1].map(() => attach(m, 'H', c, 2.2)); return { focus: [s.c, c], incoming: [c].concat(hs), leaving: [[s.o]], tag: 'O to CH₂' }; } },
  { id: 'allyl', verb: 'Grow', formula: 'C₃H₅MgBr', chem: 'Allylmagnesium bromide, then dilute acid', rgb: [110, 160, 30], cls: 'grignard', ghs: ['flame', 'corr'],
    rule: 'Adds a three-carbon arm with its own C=C to the carbon of C=O and leaves C-OH.', from: 'one', to: 'ol',
    find: carbonyls, ok: (m, s) => m.bonds.includes(s.bond) && !!reducible(m, s.bond),
    apply(m, s) { s.bond.order = 1; const c1 = attach(m, 'C', s.c, 3.0), h1 = [0, 1].map(() => attach(m, 'H', c1, 2.2)), c2 = attach(m, 'C', c1, 3.0), h2 = attach(m, 'H', c2, 2.2), c3 = attach(m, 'C', c2, 3.0); m.bond(c2, c3); const h3 = [0, 1].map(() => attach(m, 'H', c3, 2.2)), ho = attach(m, 'H', s.o, 2.0); return { focus: [s.c, s.o], incoming: [c1, c2, c3, h2, ho].concat(h1, h3), leaving: [], tag: '+C₃H₅' }; } },
  // A radical starts a chain at a C=C. The chain is one carbon that carries its length, and every further use doubles
  // it. An unseen carbon is added each time so that the molecule counts as a new one.
  { id: 'aibn', verb: 'Polymerize', formula: 'AIBN, heat', chem: 'Azobisisobutyronitrile, a radical initiator', rgb: [226, 60, 110], cls: 'radical', ghs: ['flame', 'excl'],
    rule: 'Starts a chain at C=C. Used again, it doubles every chain.', from: 'ene', to: 'poly',
    find: m => alkenes(m).concat(m.atoms.filter(a => a.poly).map(a => ({ kind: 'poly', p: a, atoms: [a] }))), ok: (m, s) => (s.kind === 'poly' ? m.atoms.includes(s.p) : alkeneOk(m, s)),
    apply(m, s) {
      if (s.kind === 'poly') { s.p.poly *= 2; const t = attach(m, 'C', s.p, 1.2); t.tail = true; return { focus: [s.p], incoming: [], leaving: [], tag: 'doubles' }; }
      const [cx, ch] = markovnikov(m, s.bond.a, s.bond.b); s.bond.order = 1; const hh = attach(m, 'H', ch, 2.4), p = attach(m, 'C', cx, 3.0); p.poly = 2; return { focus: [cx, ch], incoming: [hh, p], leaving: [], tag: 'chain' }; } },
  // Reactions found by doing the longer way round first. Each does a named sequence in one step.
  { id: 'wacker', verb: 'Oxidize C=C', formula: 'PdCl₂, CuCl₂, O₂', chem: 'Wacker oxidation', rgb: [200, 150, 20], cls: 'oxidant', ghs: ['oxid', 'health'],
    rule: 'Turns C=C straight into C=O on the carbon with fewer H.', from: 'ene', to: 'one',
    find: m => alkenes(m).filter(s => { const cx = markovnikov(m, s.bond.a, s.bond.b)[0]; return Hs(m, cx).length > 0; }), ok: alkeneOk,
    apply(m, s) { const [cx, ch] = markovnikov(m, s.bond.a, s.bond.b), hx = Hs(m, cx)[0]; s.bond.order = 1; cut(m, cx, hx); m.bond(ch, hx); const o = attach(m, 'O', cx, 2.8); m.bond(cx, o); return { focus: [cx, ch], incoming: [o], leaving: [], tag: '+O' }; } },
  { id: 'wolff', verb: 'Strip C=O', formula: 'N₂H₄, KOH, heat', chem: 'Wolff-Kishner reduction', rgb: [90, 110, 160], cls: 'base', ghs: ['skull', 'corr'],
    rule: 'Takes the O off C=O and leaves CH₂.', from: 'one', to: 'ane',
    find: carbonyls, ok: (m, s) => m.bonds.includes(s.bond) && !!reducible(m, s.bond),
    apply(m, s) { cut(m, s.c, s.o); const hs = [0, 1].map(() => attach(m, 'H', s.c, 2.4)); return { focus: [s.c], incoming: hs, leaving: [[s.o]], tag: 'loses O' }; } }
];
const CARDS = {};
// a capped oxygen carries prot, and no bottle finds a site there
LIST.forEach(c => { CARDS[c.id] = c; const f = c.find; c.find = m => f(m).filter(s => !s.atoms.some(a => a.prot)); });
// the oxygens an order can ask to be kept: alcohol OH and aldehyde or ketone C=O, by index in the atom list
const keepable = m => m.atoms.map((a, i) => (a.el !== 'O' ? null : hydroxyl(m, a) ? { i, kind: 'OH' } : carbonyls(m).some(s => s.o === a) ? { i, kind: 'C=O' } : null)).filter(Boolean);

// ---------- graph -> fingerprint ----------
function graphOf(m) {
  const atoms = m.atoms.filter(a => !a.fly), idx = new Map(atoms.map((a, i) => [a, i]));
  const bonds = m.bonds.filter(b => idx.has(b.a) && idx.has(b.b)).map(b => ({ a: idx.get(b.a), b: idx.get(b.b), order: b.order }));
  return { els: atoms.map(a => a.el), bonds };
}
const sigOf = m => { const g = graphOf(m); return C.signature(g.els, g.bonds); };
// what the three instruments can tell: the mass spectrum gives the molecular mass, the infrared gives the kinds of
// functional group present, and the NMR settles the exact structure
function probe(m) {
  const g = graphOf(m), deg = g.els.map(() => []), kinds = {};
  g.bonds.forEach(b => { deg[b.a].push(b.b); deg[b.b].push(b.a); const x = g.els[b.a], y = g.els[b.b]; if (b.order === 2) kinds[x === 'C' && y === 'C' ? 'ene' : 'one'] = 1; });
  g.els.forEach((el, i) => { if (el === 'Cl') kinds.cl = 1; else if (el === 'O' && deg[i].some(j => g.els[j] === 'H')) kinds.ol = 1; });
  return { sig: C.signature(g.els, g.bonds), mass: S.describeGraph(g.els.map(el => ({ el })), g.bonds).ms.M, grp: Object.keys(kinds).sort().join(' ') };
}
const describe = m => { const g = graphOf(m); return S.describeGraph(g.els.map(el => ({ el })), g.bonds); };

// ---------- systematic names for unbranched chains carrying C=C, OH, C=O and Cl ----------
const STEM = ['', 'meth', 'eth', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec', 'undec', 'dodec', 'tridec', 'tetradec'];
const MULT = ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta'];
function nameOf(m) {
  const live = a => !a.fly, cs = m.atoms.filter(a => a.el === 'C' && live(a)), n = cs.length;
  if (!n || n >= STEM.length) return null;
  const cn = a => carbonsOf(m, a).filter(live);
  const ends = cs.filter(a => cn(a).length <= 1);
  if (cs.some(a => cn(a).length > 2) || (n > 1 && ends.length !== 2)) return null;
  const chain = [ends[0]];
  while (chain.length < n) { const nx = cn(chain[chain.length - 1]).find(a => !chain.includes(a)); if (!nx) return null; chain.push(nx); }
  const read = ch => {
    const f = { ene: [], ol: [], one: [], al: [], chloro: [] };
    ch.forEach((c, i) => nbs(m, c).forEach(q => {
      const x = q.atom;
      if (!live(x)) return;
      if (x.el === 'O') { if (q.bond.order === 2) ((i === 0 || i === n - 1) ? f.al : f.one).push(i + 1); else f.ol.push(i + 1); }
      else if (x.el === 'Cl') f.chloro.push(i + 1);
      else if (x.el === 'C' && q.bond.order === 2 && ch[i + 1] === x) f.ene.push(i + 1);
    }));
    const suffix = f.al.length ? 'al' : f.one.length ? 'one' : f.ol.length ? 'ol' : '';
    const pre = [];
    if (f.chloro.length) pre.push(['chloro', f.chloro]);
    if (suffix !== 'ol' && f.ol.length) pre.push(['hydroxy', f.ol]);
    if (suffix === 'al' && f.one.length) pre.push(['oxo', f.one]);
    const sl = suffix ? f[suffix] : [];
    return { f, suffix, sl, pre, key: [sl, f.ene, pre.reduce((a, p) => a.concat(p[1]), []).sort((a, b) => a - b)] };
  };
  const less = (a, b) => { for (let k = 0; k < 3; k++) for (let i = 0; i < a[k].length; i++) if (a[k][i] !== b[k][i]) return a[k][i] < b[k][i]; return false; };
  let r = read(chain); const r2 = read(chain.slice().reverse());
  if (less(r2.key, r.key)) r = r2;
  const prefix = r.pre.map(p => p[1].join(',') + '-' + MULT[p[1].length] + p[0]).join('-');
  const ne = r.f.ene.length, ns = r.sl.length;
  let body = STEM[n];
  if (!ne) body += 'an';
  else if (ne === 1) body += (n <= 3 ? '' : '-' + r.f.ene[0] + '-') + 'en';
  else body += 'a-' + r.f.ene.join(',') + '-' + MULT[ne] + 'en';
  let tail;
  if (!ns) tail = 'e';
  else if (r.suffix === 'al') tail = ns === 1 ? 'al' : 'e' + MULT[ns] + 'al';
  else if (ns === 1) tail = ((r.suffix === 'ol' && n <= 2) || (r.suffix === 'one' && n <= 4 && !ne && !prefix) ? '' : '-' + r.sl[0] + '-') + r.suffix;
  else tail = 'e-' + r.sl.join(',') + '-' + MULT[ns] + r.suffix;
  return prefix + body + tail;
}
const label = m => nameOf(m) || describe(m).formula;

// ---------- headless use: the same rules without the animation ----------
// cloneMap also returns the map from each atom of m to its copy
function cloneMap(m) {
  const n = new AA.Model(), map = new Map();
  m.atoms.forEach(a => { if (a.fly) return; const c = n.addAtom(a.el, a.x, a.y, a.z); if (a.keep) c.keep = true; if (a.prot) c.prot = true; if (a.iso) c.iso = a.iso; if (a.poly) c.poly = a.poly; if (a.tail) c.tail = true; map.set(a, c); });
  m.bonds.forEach(b => { if (map.has(b.a) && map.has(b.b)) n.bonds.push({ a: map.get(b.a), b: map.get(b.b), order: b.order }); });
  return { model: n, map };
}
const cloneModel = m => cloneMap(m).model;
// applies a bottle to every site of m in place and returns how many sites reacted
function runCard(m, card) {
  let hits = 0;
  card.find(m).forEach(s => { if (!card.ok(m, s)) return; card.apply(m, s).leaving.flat().forEach(a => m.removeAtom(a)); hits++; });
  return hits;
}
const fromSmiles = smi => AA.Model.fromSmiles(smi, 1);

const bondOf = (m, a, b) => m.bonds.find(k => (k.a === a && k.b === b) || (k.a === b && k.b === a));
function carbonDist(m, from, max) { const dist = new Map([[from, 0]]), q = [from]; while (q.length) { const a = q.shift(), d = dist.get(a); if (d >= max) continue; carbonsOf(m, a).forEach(b => { if (!b.fly && !dist.has(b)) { dist.set(b, d + 1); q.push(b); } }); } return dist; }
// pairs of C=C whose nearest carbons are three to five bonds apart
function snappable(m) {
  const es = alkenes(m).map(q => q.bond), out = [], used = new Set();
  for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
    const A = es[i], B = es[j]; if (used.has(A) || used.has(B) || A.a === B.a || A.a === B.b || A.b === B.a || A.b === B.b) continue;
    let best = null; [[A.a, A.b], [A.b, A.a]].forEach(pa => { const dist = carbonDist(m, pa[0], 5); [[B.a, B.b], [B.b, B.a]].forEach(pb => { const d = dist.get(pb[0]); if (d != null && (!best || d < best.d)) best = { d, a1: pa[0], a2: pa[1], b1: pb[0], b2: pb[1] }; }); });
    if (!best || best.d < 3 || best.d > 5 || bondOf(m, best.a2, best.b2)) continue;
    used.add(A); used.add(B); out.push({ A, B, a1: best.a1, a2: best.a2, b1: best.b1, b2: best.b2, atoms: [best.a1, best.a2, best.b1, best.b2] });
  }
  return out;
}
// six-rings of carbon that can become benzene: at least one C=C in the ring, the double bonds it has fit one
// alternating pattern, nothing double-bonded outside the ring, and a hydrogen to give on every carbon that needs one
function aromatizable(m) {
  const ar = aromaticAtoms(m), cs = m.atoms.filter(a => a.el === 'C' && !a.fly), rings = [], seen = new Set(), out = [];
  const walk = (start, path) => { const last = path[path.length - 1]; if (path.length === 6) { if (carbonsOf(m, last).includes(start)) { const key = path.map(a => m.atoms.indexOf(a)).sort((x, y) => x - y).join(','); if (!seen.has(key)) { seen.add(key); rings.push(path.slice()); } } return; } carbonsOf(m, last).forEach(n => { if (!n.fly && !path.includes(n)) { path.push(n); walk(start, path); path.pop(); } }); };
  cs.forEach(c => walk(c, [c]));
  rings.forEach(R => { if (R.some(a => ar.has(a))) return;
    const dbl = R.map((a, i) => bondOf(m, a, R[(i + 1) % 6]).order === 2), first = dbl.findIndex(Boolean); if (first < 0) return;
    const par = first % 2; if (dbl.some((d, i) => d && i % 2 !== par)) return;
    const fits = R.every((a, i) => { if (nbs(m, a).some(n => n.bond.order === 2 && !R.includes(n.atom))) return false; const has = dbl[i] || dbl[(i + 5) % 6]; return has || Hs(m, a).length > 0; });
    if (fits) out.push({ ring: R, par, atoms: R.slice() }); });
  return out;
}
// the first OH of a pair that can close a ring: the carbons that carry them are three or four bonds apart along carbon
// whether a heavy atom is part of a ring
function ringAtom(m, c) { const nb = a => nbs(m, a).map(n => n.atom).filter(b => b.el !== 'H' && !b.fly); for (const n1 of nb(c)) { const seen = new Set([n1]), st = [n1]; while (st.length) { const u = st.pop(); for (const v of nb(u)) { if (v === c) { if (u !== n1) return true; continue; } if (!seen.has(v)) { seen.add(v); st.push(v); } } } } return false; }
// one ring at a time, and never onto a carbon that is already in a ring: fused rings made this way do not draw well
function ringable(m, o) {
  const s = hydroxyl(m, o); if (!s || ringAtom(m, s.c)) return null;
  const dist = new Map([[s.c, 0]]), q = [s.c];
  while (q.length) { const a = q.shift(), d = dist.get(a); if (d >= 4) continue; carbonsOf(m, a).forEach(b => { if (!b.fly && !dist.has(b)) { dist.set(b, d + 1); q.push(b); } }); }
  const io = m.atoms.indexOf(o);
  for (const o2 of m.atoms) { if (o2 === o || o2.fly || m.atoms.indexOf(o2) < io) continue; const t = hydroxyl(m, o2); if (!t || t.c === s.c || ringAtom(m, t.c)) continue; const d = dist.get(t.c); if (d === 3 || d === 4) return { o: s.o, c: s.c, ho: s.ho, o2: t.o, c2: t.c, ho2: t.ho, atoms: [s.o, s.c, t.c, t.o] }; }
  return null;
}
// What the molecule is, read from its structure as it stands: rings that are not aromatic, aromatic rings, whether it is
// a cage (an atom with three bonds that each lie in a ring), and how many OH groups it carries.
function shapeOf(m) {
  const hv = m.atoms.filter(a => a.el !== 'H' && !a.fly), set = new Set(hv), nb = a => nbs(m, a).map(n => n.atom).filter(b => set.has(b));
  let bonds = 0; hv.forEach(a => { bonds += nb(a).length; }); bonds /= 2;
  const seen = new Set(); let comps = 0; hv.forEach(a => { if (seen.has(a)) return; comps++; const st = [a]; seen.add(a); while (st.length) { const u = st.pop(); nb(u).forEach(v => { if (!seen.has(v)) { seen.add(v); st.push(v); } }); } });
  const rings = Math.max(0, bonds - hv.length + comps), arene = Math.floor(aromaticAtoms(m).size / 6);
  const inRing = (a, b) => { const sn = new Set([a]), st = [a]; while (st.length) { const u = st.pop(); for (const v of nb(u)) { if (u === a && v === b) continue; if (v === b) return true; if (!sn.has(v)) { sn.add(v); st.push(v); } } } return false; };
  const cage = rings >= 2 && hv.some(a => nb(a).filter(b => inRing(a, b)).length >= 3);
  // resonance: single bonds with a double bond on each side (C=C-C=C, C=C-C=O, and three in a benzene ring)
  const dbl = a => nbs(m, a).some(n => n.bond.order === 2), conj = m.bonds.filter(b => b.order === 1 && set.has(b.a) && set.has(b.b) && dbl(b.a) && dbl(b.b)).length;
  return { conj, ring: Math.max(0, rings - arene), arene, cage, oh: m.atoms.filter(a => !a.fly && hydroxyl(m, a)).length };
}
AA.rx = { shapeOf, aromaticAtoms, LIST, CARDS, sigOf, probe, describe, nameOf, label, cloneModel, cloneMap, runCard, fromSmiles, keepable };
})(typeof globalThis !== 'undefined' ? globalThis : window);
