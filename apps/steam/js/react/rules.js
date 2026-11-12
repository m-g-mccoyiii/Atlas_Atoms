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
  if (MODE.zip && otherHetero(m, s.c, o)) return null;     // the OH a zip leaves on its last ring stays: a zip can always open again
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
// MODE.zip is set by the cascade game (path.js). With it on, two reagents are setup tools for the zip and no longer
// wipe out every C=O at once: hydroborate acts on C=C only (a hindered borane does), and reduce takes only a C=O at
// the end of a chain (an aldehyde, which borohydride takes long before a ketone). The main game leaves it off.
// MODE.weld: 'ol' stops a weld before water leaves, so it leaves an OH on the new ring (an aldol); 'ene' lets the
// water go and leaves a C=C beside the C=O that stays (the condensation).
const MODE = { zip: false, weld: 'ol', reach: 4, co2: false };
// MODE.co2 (path.js RULE.co2, off): oxidize also cuts a C=C at the very end of a chain (CH=CH2). The end carbon
// leaves as carbon dioxide and a C=O is left on the new end carbon.
const endEnes = m => (MODE.co2 ? alkenes(m).map(s => { const a = s.bond.a, b = s.bond.b, end = x => Hs(m, x).length === 2 && nbs(m, x).filter(n => n.atom.el !== 'H').length === 1, ce = end(a) ? a : end(b) ? b : null, c = ce === a ? b : a; return ce && Hs(m, c).length === 1 && !c.fly && !ce.fly ? { kind: 'cleave', bond: s.bond, c, ce, atoms: [c, ce] } : null; }).filter(Boolean) : []);
const aldehydes = m => carbonyls(m).filter(s => Hs(m, s.c).length > 0);
// a C=O whose carbon carries a CH3: the end of a chain, where a base takes a hydrogen off and a new piece goes on
const methylKetones = m => carbonyls(m).map(k => { const me = carbonsOf(m, k.c).find(c => !c.fly && Hs(m, c).length === 3); return me ? { kind: 'end', kc: k.c, ko: k.o, me, atoms: [me, k.c] } : null; }).filter(Boolean);
const endOk = (m, s) => m.atoms.includes(s.me) && Hs(m, s.me).length === 3 && isCarbonylC(m, s.kc);
// builds a piece of chain onto atom `to`, one carbon for each entry of spec: [hydrogens, bond order to the one before, '=O' or 'OH' or '']
function grow(m, to, spec) { const made = [], cs = []; let prev = to; spec.forEach(q => { const c = attach(m, 'C', prev, 3.0); if (q[1] === 2) m.bond(prev, c); made.push(c); cs.push(c); for (let i = 0; i < q[0]; i++) made.push(attach(m, 'H', c, 2.2)); if (q[2] === '=O') { const o = attach(m, 'O', c, 2.8); m.bond(c, o); made.push(o); } else if (q[2] === 'OH') { const o = attach(m, 'O', c, 2.8), h = attach(m, 'H', o, 1.2); made.push(o, h); } prev = c; }); return { made, cs }; }
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
    find: m => m.atoms.map(a => oxidisable(m, a)).filter(Boolean).concat(endEnes(m)), ok: (m, s) => (s.kind === 'cleave' ? m.bonds.includes(s.bond) && s.bond.order === 2 : !!oxidisable(m, s.o)),
    apply(m, s) { if (s.kind === 'cleave') { const c = s.c, ce = s.ce; Hs(m, ce).forEach(h => m.removeAtom(h)); m.bonds = m.bonds.filter(k => k !== s.bond); const o = attach(m, 'O', c, 2.8); m.bond(c, o); const o1 = attach(m, 'O', ce, 2.6), o2 = attach(m, 'O', ce, 2.6); m.bond(ce, o1); m.bond(ce, o2); return { focus: [c, o], incoming: [o], leaving: [[ce, o1, o2]], tag: 'loses CO2' }; } const hc = Hs(m, s.c)[0]; cut(m, s.c, hc); cut(m, s.o, s.ho); m.bond(s.c, s.o); m.bond(hc, s.ho); return { focus: [s.c, s.o], incoming: [], leaving: [[hc, s.ho]], tag: 'loses 2 H' }; } },
  { id: 'nabh4', verb: 'Reduce', formula: 'NaBH₄', chem: 'Sodium borohydride', rgb: [214, 40, 40], cls: 'hydride', ghs: ['flame', 'corr', 'skull'],
    rule: 'Turns C=O into C-OH. Leaves C=C alone.', from: 'one', to: 'ol',
    find: m => (MODE.zip ? aldehydes(m) : carbonyls(m)), ok: (m, s) => m.bonds.includes(s.bond) && !!reducible(m, s.bond), apply: reduceCO },
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
    find: m => (MODE.zip ? alkenes(m) : alkenes(m).concat(carbonyls(m))),
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
  // Reagents of the cascade game. Each is a setup move for a cascade (docs/CASCADES.md): grow, chunk, bridge.
  // Extend: a base takes a hydrogen off the CH3 beside a C=O and a three-carbon piece with its own C=O goes on there.
  // The new C=O sits three carbons from the old one, which is where a zip can reach it, and it ends in a CH3 again.
  { id: 'extend', verb: 'Extend', formula: 'LDA, BrCH₂COCH₃', chem: 'Lithium diisopropylamide, then a masked bromoacetone', rgb: [110, 160, 30], cls: 'base', ghs: ['flame', 'corr'],
    rule: 'A chain that ends in C(=O)CH₃ grows by three carbons with a new C=O on them.', from: 'one', to: 'one',
    find: methylKetones, ok: endOk,
    apply(m, s) { const h = Hs(m, s.me)[0]; cut(m, s.me, h); const g = grow(m, s.me, [[2, 1, ''], [0, 1, '=O'], [3, 1, '']]); return { focus: [s.me, g.cs[1]], incoming: g.made, leaving: [[h]], tag: '+C₃H₅O' }; } },
  // Chunk: the same move with a longer piece that carries two C=O, each three carbons from the last.
  { id: 'dione', verb: 'Chain on', formula: 'LDA, BrCH₂COC₂H₄COCH₃', chem: 'Lithium diisopropylamide, then a masked bromo diketone', rgb: [214, 96, 30], cls: 'base', ghs: ['flame', 'corr'],
    rule: 'A chain that ends in C(=O)CH₃ grows by six carbons with two new C=O on them.', from: 'one', to: 'one',
    find: methylKetones, ok: endOk,
    apply(m, s) { const h = Hs(m, s.me)[0]; cut(m, s.me, h); const g = grow(m, s.me, [[2, 1, ''], [0, 1, '=O'], [2, 1, ''], [2, 1, ''], [0, 1, '=O'], [3, 1, '']]); return { focus: [s.me, g.cs[1], g.cs[4]], incoming: g.made, leaving: [[h]], tag: '+2 C=O' }; } },
  // Chunk: a benzene ring with an OH on it goes on at the CH3 beside a C=O. That OH sits where it can zip onto the
  // C=O (a chromanol, as in the vitamin E family), and nothing the player holds can take it away again.
  { id: 'phenol', verb: 'Add phenol', formula: 'LDA, HOC₆H₄CH₂Br', chem: 'Lithium diisopropylamide, then 2-hydroxybenzyl bromide', rgb: [150, 90, 170], cls: 'base', ghs: ['flame', 'corr', 'skull'],
    rule: 'A chain that ends in C(=O)CH₃ takes on a benzene ring that carries an OH.', from: 'one', to: 'ol',
    find: methylKetones, ok: endOk,
    apply(m, s) { const h = Hs(m, s.me)[0]; cut(m, s.me, h); const made = [], c1 = attach(m, 'C', s.me, 3.0); made.push(c1, attach(m, 'H', c1, 2.2), attach(m, 'H', c1, 2.2));
      const R = [attach(m, 'C', c1, 3.0)]; for (let i = 1; i < 6; i++) R.push(attach(m, 'C', R[i - 1], 3.0)); m.bond(R[5], R[0]); [0, 2, 4].forEach(i => m.bond(R[i], R[i + 1])); R.forEach(a => made.push(a));
      const o = attach(m, 'O', R[1], 2.8); made.push(o, attach(m, 'H', o, 1.2)); [2, 3, 4, 5].forEach(i => made.push(attach(m, 'H', R[i], 2.2)));
      return { focus: [s.me, c1, o], incoming: made, leaving: [[h]], tag: '+phenol' }; } },
  // Bridge: two chain ends C(=O)CH3 lose a hydrogen each and their CH3 carbons join (an oxidative coupling of two
  // enolates). The two C=O are then three carbons apart, so a zip that has run to one end of the molecule crosses to
  // the other end and runs on from there. One pair a use: the two ends that are farthest apart.
  { id: 'couple', verb: 'Bridge', formula: 'LDA, CuCl₂', chem: 'Lithium diisopropylamide, then copper(II) chloride', rgb: [40, 110, 120], cls: 'base', ghs: ['flame', 'corr'],
    rule: 'Two chain ends C(=O)CH₃ join through their CH₃ carbons into one ring.', from: 'one', to: 'ring',
    find: m => couplable(m).slice(0, 1), ok: m => couplable(m).length > 0,
    apply(m) { const s = couplable(m)[0], h1 = Hs(m, s.me1)[0], h2 = Hs(m, s.me2)[0]; cut(m, s.me1, h1); cut(m, s.me2, h2); m.bond(s.me1, s.me2); m.bond(h1, h2); return { focus: [s.me1, s.me2], incoming: [], leaving: [[h1, h2]], tag: 'ties a ring' }; } },
  // A bridge that was tried first and is not offered: ring-closing metathesis. Measured with the rig it made cascades
  // shorter, because it uses up the C=C that a zip is started from.
  // Bridge: two C=C at the ends of chains swap partners. The two end carbons leave as ethene and the carbons behind
  // them join, so two far parts of the molecule are tied into one ring and whatever was far apart is now close.
  { id: 'rcm', verb: 'Bridge', formula: 'Ru cat.', chem: 'A ruthenium carbene, ring-closing metathesis', rgb: [40, 110, 120], cls: 'metal', ghs: ['excl'],
    rule: 'Two C=C at the ends of chains join into one ring. Ethene leaves.', from: 'ene', to: 'ring',
    find: m => bridgeable(m).slice(0, 1), ok: m => bridgeable(m).length > 0,
    apply(m) { const s = bridgeable(m)[0], gone = [s.e1, s.e2].concat(Hs(m, s.e1), Hs(m, s.e2)); cut(m, s.a, s.e1); cut(m, s.a, s.e1); cut(m, s.b, s.e2); cut(m, s.b, s.e2); m.bond(s.a, s.b); m.bond(s.a, s.b); m.bond(s.e1, s.e2); return { focus: [s.a, s.b], incoming: [], leaving: [gone], tag: 'ties a ring' }; } },
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
// Reactions a molecule has with itself when two of its groups sit close together. They are not reagents: nothing is
// held or used. Each finds one pair at a time. (Close, Snap and Aromatize above are of this kind too.)
//   lactol (named zip on the page, docs/CASCADES.md kind 1): an OH whose carbon is three or four carbons from the
//   carbon of a C=O closes a ring of five or six through its oxygen, and the C=O becomes C-OH. That new OH can do
//   the same to the next C=O along, so on a chain with a C=O every three or four carbons one OH runs down it.
//   The OH may be on a ring, or on a benzene ring (a phenol). Either part may be in a ring as long as the new ring
//   shares at most one bond with rings of eight atoms or fewer that are already there, so small rings come out side
//   by side or joined at one atom and never bridged (a wide ring tied by a bridge may be crossed). One pair a step: the first C=O in the molecule's own order that has such an OH, and the first such OH.
//   reopen undoes it: a zip ring is loose (a hemiketal), and it comes apart again when the page is turned.
//   weld (docs/CASCADES.md kind 5): the carbon beside one C=O joins the carbon of a second C=O four or five carbons
//   away and a ring of five or six closes. As played (MODE.weld 'ol') the second C=O becomes C-OH on the new ring, and
//   that OH can start a zip. With MODE.weld 'ene' water leaves as well and a C=C is left beside the first C=O.
//   ether: an OH and a Cl three or four carbons apart close a ring through the oxygen. HCl leaves.
//   enone: an OH two carbons from a C=O leaves as water, and a C=C forms beside the C=O.
// (salt, docs/HOMUNCULI.md: a cured C=O carries cure on its carbon and its oxygen. A ring that closes on it leaves it
//  a C=O, up to three rings, and no bottle finds a site on it)
const cureRings = (m, c) => nbs(m, c).filter(n => n.atom.el === 'O' && n.bond.order === 1 && nbs(m, n.atom).length === 2 && nbs(m, n.atom).every(y => y.atom.el === 'C')).length;
function lactolable(m) {
  const ks = carbonyls(m).filter(k => !k.c.cure); m.atoms.forEach(c => { if (!c.cure || c.el !== 'C' || c.fly) return; const q = nbs(m, c).find(n => n.atom.el === 'O' && n.bond.order === 2); if (q && cureRings(m, c) < 3) ks.push({ c, o: q.atom, bond: q.bond, cure: true }); }); if (!ks.length) return [];
  const ar = aromaticAtoms(m), ohs = []; m.atoms.forEach(o => { if (o.fly || o.el !== 'O') return; const s = hydroxylAny(m, o, ar); if (s) ohs.push(s); }); if (!ohs.length) return [];
  // A zip travels. The OH the last step left (it sits on a carbon that also carries a ring oxygen) goes before any
  // other, so a cascade runs along the chain from where it was set off and does not jump about; and an OH takes the
  // nearest C=O in reach. MODE.reach is how many carbons apart the two may be (4; the magnet makes it 8).
  const R = m.reach || MODE.reach || 4; let best = null, bf = 0, bd = 99;
  ohs.forEach(s => { s.front = nbs(m, s.c).some(n => n.atom.el === 'O' && n.atom !== s.o && nbs(m, n.atom).length === 2 && nbs(m, n.atom).every(y => y.atom.el === 'C')) ? 1 : 0; });
  for (const k of ks) { const kr = ringAtom(m, k.c), dist = carbonDist(m, k.c, R);
    for (const s of ohs) { if (s.c === k.c) continue; const d = dist.get(s.c); if (!(d >= 3 && d <= R)) continue;
      if (best && (s.front < bf || (s.front === bf && d >= bd))) continue;
      if (kr || ringAtom(m, s.c)) { const p = carbonPath(m, s.c, k.c, R); let shared = 0; for (let i = 0; p && i + 1 < p.length; i++) if (ringBond(m, p[i], p[i + 1], 8)) shared++; if (!p || shared > 1) continue; }
      best = { o: s.o, ho: s.ho, c: s.c, kc: k.c, ko: k.o, bond: k.bond, d, cure: !!k.cure, atoms: [s.o, s.c, k.c, k.o] }; bf = s.front; bd = d; } }
  return best ? [best] : [];
}
function etherable(m) { for (const o of m.atoms) { if (o.fly) continue; const s = hydroxyl(m, o); if (!s || ringAtom(m, s.c)) continue; const dist = carbonDist(m, s.c, 4); for (const x of m.atoms) { if (x.el !== 'Cl' || x.fly) continue; const c2 = carbonsOf(m, x)[0]; if (!c2 || c2 === s.c || ringAtom(m, c2)) continue; const d = dist.get(c2); if (d === 3 || d === 4) return [{ o: s.o, ho: s.ho, c: s.c, cl: x, c2, atoms: [s.o, s.c, c2, x] }]; } } return []; }
function enonable(m) { const dbl = a => nbs(m, a).some(n => n.bond.order === 2); for (const k of carbonyls(m)) for (const a of carbonsOf(m, k.c)) { if (!Hs(m, a).length || dbl(a)) continue; for (const b of carbonsOf(m, a)) { if (b === k.c || dbl(b)) continue; const oh = nbs(m, b).map(n => n.atom).find(q => q.el === 'O' && !q.fly && hydroxyl(m, q)); if (!oh) continue; const s = hydroxyl(m, oh); return [{ a, b, o: s.o, ho: s.ho, kc: k.c, atoms: [a, b, s.o] }]; } } return []; }
//   taut: an OH on a carbon of a C=C (an enol) becomes C=O, and the other carbon takes the hydrogen.
function tautable(m) { for (const q of alkenes(m)) for (const pr of [[q.bond.a, q.bond.b], [q.bond.b, q.bond.a]]) { const a = pr[0], b = pr[1]; for (const n of nbs(m, a)) { const o = n.atom; if (o.el !== 'O' || o.fly || n.bond.order !== 1) continue; const on = nbs(m, o), hh = on.find(k => k.atom.el === 'H'); if (on.length !== 2 || !hh) continue; return [{ a, b, o, ho: hh.atom, bond: q.bond, atoms: [a, b, o] }]; } } return []; }
//   aldol: the carbon beside one C=O joins the carbon of a second C=O four or five carbons away. A ring of five or
//   six closes and the second C=O becomes C-OH, which then sits where an enone can form.
function aldolable(m) { const ks = carbonyls(m); for (const k of ks) for (const a of carbonsOf(m, k.c)) { if (!Hs(m, a).length || ringAtom(m, a) || nbs(m, a).some(n => n.bond.order === 2)) continue; const dist = carbonDist(m, a, 5); for (const k2 of ks) { if (k2 === k || k2.c === k.c || ringAtom(m, k2.c)) continue; const d = dist.get(k2.c); if (d === 4 || d === 5) return [{ a, c1: k.c, c2: k2.c, o2: k2.o, bond: k2.bond, atoms: [a, k.c, k2.c, k2.o] }]; } } return []; }
//   snap6 (named snap on the page, docs/CASCADES.md kind 3): two C=C side by side (C1=C2-C3=C4) and a third C=C
//   whose near carbon is four or five carbons from C4 close a six-ring (a Diels-Alder inside one molecule). The ring
//   keeps one C=C, between C2 and C3, and what hung beside C1 now sits three carbons from what hangs beside the third
//   C=C: an OH there and a C=O here can zip. The older snap, a four-ring from any two C=C a few carbons apart, used up
//   the C=C a zip starts from and made cascades shorter when measured, so it is not a kind of cascade any more.
function dielsable(m) { const es = alkenes(m).map(q => q.bond), dbl = (a, b) => { const k = bondOf(m, a, b); return !!k && k.order === 2; };
  for (const A of es) for (const pr of [[A.a, A.b], [A.b, A.a]]) { const c1 = pr[0], c2 = pr[1]; for (const c3 of carbonsOf(m, c2)) { if (c3 === c1 || c3.fly || dbl(c2, c3)) continue; for (const c4 of carbonsOf(m, c3)) { if (c4 === c2 || c4 === c1 || !dbl(c3, c4)) continue;
    for (const B of es) { if (B === A || [B.a, B.b].some(x => x === c1 || x === c2 || x === c3 || x === c4)) continue; for (const q of [[B.a, B.b], [B.b, B.a]]) { const ca = q[0], cb = q[1], p = carbonPath(m, c4, ca, 5); if (!p || p.length < 5 || p.includes(c3) || p.includes(cb) || p.includes(c1) || bondOf(m, c1, cb)) continue; return [{ c1, c2, c3, c4, ca, cb, atoms: [c1, c2, c3, c4, ca, cb] }]; } } } } }
  return []; }
// two chain ends C(=O)CH3 whose CH3 carbons are four or more carbons apart, the farthest pair first
function couplable(m) { const es = methylKetones(m), out = []; for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) { const A = es[i], B = es[j]; if (A.kc === B.kc || A.me === B.me) continue; const d = carbonDist(m, A.me, 60).get(B.me); if (d == null || d < 4) continue; out.push({ me1: A.me, me2: B.me, d, atoms: [A.me, A.kc, B.me, B.kc] }); } return out.sort((x, y) => y.d - x.d); }
const weldable = m => { const ks = carbonyls(m); for (const k of ks) for (const a of carbonsOf(m, k.c)) { if (Hs(m, a).length < 2 || ringAtom(m, a) || nbs(m, a).some(n => n.bond.order === 2)) continue; const dist = carbonDist(m, a, 5); for (const k2 of ks) { if (k2 === k || k2.c === k.c || ringAtom(m, k2.c)) continue; const d = dist.get(k2.c); if (d === 4 || d === 5) return [{ a, c1: k.c, c2: k2.c, o2: k2.o, bond: k2.bond, atoms: [a, k.c, k2.c, k2.o] }]; } } return []; };
const SELFCARDS = [
  { id: 'snap6', verb: 'Snap', formula: '', chem: 'by itself', rgb: [200, 38, 28], cls: 'self', ghs: [], rule: 'Two C=C side by side and a third nearby close a six-ring with one new C=C in it.', from: 'ene', to: 'ring', find: dielsable, ok: m => dielsable(m).length > 0,
    apply(m) { const s = dielsable(m)[0]; bondOf(m, s.c1, s.c2).order = 1; bondOf(m, s.c3, s.c4).order = 1; bondOf(m, s.c2, s.c3).order = 2; bondOf(m, s.ca, s.cb).order = 1; m.bond(s.c1, s.cb); m.bond(s.c4, s.ca); return { focus: [s.c1, s.c4, s.ca, s.cb], incoming: [], leaving: [], tag: 'snaps shut' }; } },
  { id: 'weld', verb: 'Weld', formula: '', chem: 'by itself', rgb: [168, 92, 36], cls: 'self', ghs: [], rule: 'Two C=O close a ring between them.', from: 'one', to: 'ring', find: m => (MODE.weld === 'ene' ? weldable(m) : aldolable(m)), ok: m => (MODE.weld === 'ene' ? weldable(m) : aldolable(m)).length > 0,
    apply(m) {
      if (MODE.weld !== 'ene') { const s = aldolable(m)[0], ha = Hs(m, s.a)[0]; cut(m, s.a, ha); s.bond.order = 1; m.bond(s.a, s.c2); m.bond(s.o2, ha); return { focus: [s.a, s.c2, s.o2], incoming: [], leaving: [], tag: 'welds a ring' }; }
      const s = weldable(m)[0], hs = Hs(m, s.a).slice(0, 2); hs.forEach(h => cut(m, s.a, h)); cut(m, s.c2, s.o2); m.bond(s.a, s.c2); m.bond(s.a, s.c2); hs.forEach(h => m.bond(s.o2, h)); return { focus: [s.a, s.c2, s.c1], incoming: [], leaving: [[s.o2].concat(hs)], tag: 'welds a ring' }; } },
  { id: 'aldol', verb: 'Aldol', formula: '', chem: 'by itself', rgb: [31, 95, 191], cls: 'self', ghs: [], rule: 'Two C=O close a ring between them.', from: 'one', to: 'ring', find: aldolable, ok: m => aldolable(m).length > 0,
    apply(m) { const s = aldolable(m)[0], ha = Hs(m, s.a)[0]; cut(m, s.a, ha); s.bond.order = 1; m.bond(s.a, s.c2); m.bond(s.o2, ha); return { focus: [s.a, s.c2, s.o2], incoming: [], leaving: [], tag: 'closes a ring' }; } },
  { id: 'taut', verb: 'Shift', formula: '', chem: 'by itself', rgb: [176, 24, 154], cls: 'self', ghs: [], rule: 'An OH on a C=C becomes C=O.', from: 'ene', to: 'one', find: tautable, ok: m => tautable(m).length > 0,
    apply(m) { const s = tautable(m)[0]; cut(m, s.o, s.ho); m.bond(s.b, s.ho); s.bond.order = 1; bondOf(m, s.a, s.o).order = 2; return { focus: [s.a, s.b, s.o], incoming: [], leaving: [], tag: 'shifts' }; } },
  { id: 'lactol', verb: 'Zip', formula: '', chem: 'by itself', rgb: [47, 120, 160], cls: 'self', ghs: [], rule: 'An OH and a C=O close a ring.', from: 'ol', to: 'ring', find: lactolable, ok: m => lactolable(m).length > 0,
    apply(m) { const s = lactolable(m)[0]; if (s.cure) { m.removeAtom(s.ho); m.bond(s.o, s.kc); return { focus: [s.o, s.kc, s.ko], incoming: [], leaving: [], tag: 'closes a ring' }; } cut(m, s.o, s.ho); s.bond.order = 1; m.bond(s.o, s.kc); m.bond(s.ko, s.ho); return { focus: [s.o, s.kc, s.ko], incoming: [], leaving: [], tag: 'closes a ring' }; } },
  { id: 'ether', verb: 'Ether', formula: '', chem: 'by itself', rgb: [60, 154, 95], cls: 'self', ghs: [], rule: 'An OH and a Cl close a ring. HCl leaves.', from: 'cl', to: 'ring', find: etherable, ok: m => etherable(m).length > 0,
    apply(m) { const s = etherable(m)[0]; cut(m, s.o, s.ho); cut(m, s.c2, s.cl); m.bond(s.cl, s.ho); m.bond(s.o, s.c2); return { focus: [s.o, s.c2], incoming: [], leaving: [[s.cl, s.ho]], tag: 'closes a ring' }; } },
  { id: 'enone', verb: 'Enone', formula: '', chem: 'by itself', rgb: [224, 122, 0], cls: 'self', ghs: [], rule: 'An OH near a C=O leaves as water and a C=C forms.', from: 'ol', to: 'ene', find: enonable, ok: m => enonable(m).length > 0,
    apply(m) { const s = enonable(m)[0], ha = Hs(m, s.a)[0]; cut(m, s.b, s.o); cut(m, s.a, ha); m.bond(s.o, ha); bondOf(m, s.a, s.b).order = 2; return { focus: [s.a, s.b], incoming: [], leaving: [[s.o, s.ho, ha]], tag: 'loses water' }; } }
];
SELFCARDS.forEach(c => { CARDS[c.id] = c; });
// ===================================================================================================================
// THE ENGINE (rules builder, eighth measure): the eighteen reagents and thirteen reflexes of docs/tools_chem/library.py, ported
// onto the game's molecule. A reading of the molecule is a snapshot G of the heavy atoms (indices, neighbours with bond orders,
// the hydrogens counted); a change edits the model and then sets the hydrogens of the atoms it touched from the valences
// (C 4, N 3, O 2, S 2, Cl 1), as RDKit's implicit hydrogens do. docs/tools_chem/FINAL.md says what each piece does.
//   ENG.fire(m, id)            a reagent at every place it fits, one place at a time (library.py Reaction.fire): { n, off, piece }
//   ENG.nextReflex(m, held, cnt) the reflex that fires next (engine.py _next_self): { id, site } or null
//   ENG.settle(m, held, cnt, budget) the reflexes run one at a time until none fits or the budget is spent: { steps, off, capped }
//   ENG.reopen(m)              the loose rings open again (library.py reopen)
//   ENG.toSmiles(m)            the molecule as a Kekule SMILES (for the comparison with RDKit)
// ===================================================================================================================
const ENG = (() => {
  const REMOVED = [];
  const VAL = { C: 4, N: 3, O: 2, S: 2, Cl: 1 }, DIST = { C: 3.0, N: 2.9, O: 2.8, S: 3.3, Cl: 3.0, H: 2.2 };
  // ---------- the reading ----------
  function snapG(m) {
    const atoms = [], idx = new Map();
    m.atoms.forEach(a => { if (a.el !== 'H' && !a.fly) { idx.set(a, atoms.length); atoms.push(a); } });
    const nb = atoms.map(() => []), hc = atoms.map(() => 0);
    m.bonds.forEach(k => {
      const ia = idx.get(k.a), ib = idx.get(k.b);
      if (ia != null && ib != null) { nb[ia].push({ j: ib, o: k.order }); nb[ib].push({ j: ia, o: k.order }); }
      else if (k.a.el === 'H' && ib != null) hc[ib]++;
      else if (k.b.el === 'H' && ia != null) hc[ia]++;
    });
    const G = { m, atoms, idx, nb, hc, n: atoms.length, cd: new Map(), rb: null, lock: atoms.map(a => !!(a.prot || a.cure || a.clamp)), lockSelf: atoms.map(a => !!a.prot), self: false };
    let dc = 0; for (const k of m.bonds) if (k.order === 2 && k.a.el === 'C' && k.b.el === 'C') dc++;       // a benzene ring has three C=C: fewer, and the search is skipped
    const ar = dc >= 3 ? aromaticAtoms(m) : null; G.ar = atoms.map(a => !!ar && ar.has(a));
    return G;
  }
  const el = (G, i) => G.atoms[i].el, X = (G, i) => G.nb[i].length + G.hc[i];
  const aC = (G, i) => el(G, i) === 'C' && !G.ar[i];
  const bo = (G, i, j) => { for (const q of G.nb[i]) if (q.j === j) return q.o; return 0; };
  const cnb = (G, i) => G.nb[i].filter(q => el(G, q.j) === 'C').map(q => q.j);
  const hetero = (G, i) => G.nb[i].some(q => el(G, q.j) !== 'C');
  const sp3 = (G, i) => G.nb[i].every(q => q.o === 1);
  const oneHet = (G, i) => G.nb[i].filter(q => q.o === 1 && el(G, q.j) !== 'C').length < 2;          // !$(C(-[!#6])-[!#6])
  const CX4 = (G, i) => aC(G, i) && X(G, i) === 4, CX3 = (G, i) => aC(G, i) && X(G, i) === 3;
  const dblO = (G, i) => { const q = G.nb[i].find(q => q.o === 2 && el(G, q.j) === 'O'); return q ? q.j : -1; };
  // THE NEIGHBOUR RELATION (owner's ruling AC, docs/HARNESS.md): every reflex asks which sites are close through cdist, and says whether the
  // two sites are close along the chain or facing each other across the fold through NEAR.via. Today only along the chain; docs/tools_chem/FOLD.md
  // (when it lands) sets NEAR.fn(G, src, maxd) -> Map(atom index -> distance) and NEAR.via(G, a, b) -> 'chain' | 'fold'. The fold must be one
  // deterministic function of the molecule that the page also uses to draw it.
  const NEAR = { fn: null, via: () => 'chain' };
  function cdist(G, src, maxd) {
    if (NEAR.fn) return NEAR.fn(G, src, maxd);
    const key = src + ':' + maxd, hit = G.cd.get(key); if (hit) return hit;
    const dist = new Map([[src, 0]]), q = [src];
    for (let k = 0; k < q.length; k++) { const u = q[k], d = dist.get(u); if (d >= maxd) continue; for (const v of cnb(G, u)) if (!dist.has(v)) { dist.set(v, d + 1); q.push(v); } }
    G.cd.set(key, dist); return dist;
  }
  function cpath(G, src, dst, maxd) {
    const prev = new Map([[src, null]]), dist = new Map([[src, 0]]), q = [src];
    for (let k = 0; k < q.length; k++) { const u = q[k]; if (u === dst) break; if (dist.get(u) >= maxd) continue; for (const v of cnb(G, u).sort((a, b) => a - b)) if (!prev.has(v)) { prev.set(v, u); dist.set(v, dist.get(u) + 1); q.push(v); } }
    if (!prev.has(dst)) return null; const p = []; for (let u = dst; u != null; u = prev.get(u)) p.push(u); return p.reverse();
  }
  // bonds that lie in a ring: all but the bridges
  function ringSet(G) {
    if (G.rb) return G.rb; const n = G.n, disc = new Array(n).fill(-1), low = new Array(n).fill(0), bridge = new Set(); let t = 0;
    const key = (a, b) => (a < b ? a + ',' + b : b + ',' + a);
    const dfs = (u, pe) => { disc[u] = low[u] = t++; for (const q of G.nb[u]) { const v = q.j; if (v === pe) continue; if (disc[v] < 0) { dfs(v, u); low[u] = Math.min(low[u], low[v]); if (low[v] > disc[u]) bridge.add(key(u, v)); } else low[u] = Math.min(low[u], disc[v]); } };
    for (let i = 0; i < n; i++) if (disc[i] < 0) dfs(i, -1);
    G.rb = { bridge, key }; return G.rb;
  }
  const bondInRing = (G, a, b) => !ringSet(G).bridge.has(ringSet(G).key(a, b));
  const inRing = (G, i) => G.nb[i].some(q => bondInRing(G, i, q.j));
  function bondRingSize(G, a, b) {              // the smallest ring that holds the bond a-b, 0 if none
    if (!bondInRing(G, a, b)) return 0;
    const dist = new Map([[a, 0]]), q = [a];
    for (let k = 0; k < q.length; k++) { const u = q[k]; for (const w of G.nb[u]) { if (u === a && w.j === b) continue; if (w.j === b) return dist.get(u) + 2; if (!dist.has(w.j)) { dist.set(w.j, dist.get(u) + 1); q.push(w.j); } } }
    return 0;
  }
  function lactolOk(G, a, b, limit) {
    if (!(inRing(G, a) || inRing(G, b))) return true;
    const p = cpath(G, a, b, 99); if (!p) return false;
    let shared = 0; for (let i = 0; i + 1 < p.length; i++) { const r = bondRingSize(G, p[i], p[i + 1]); if (r && r <= limit) shared++; }
    return shared <= 1;
  }
  function endDist(G, c) {
    const seen = new Set([c]); let layer = [c], d = 0;
    while (layer.length) { const nx = []; for (const a of layer) { const cn = cnb(G, a); if (cn.length <= 1) return d; cn.forEach(x => { if (!seen.has(x)) { seen.add(x); nx.push(x); } }); } layer = nx; d++; }
    return d;
  }
  // a site that touches a protected, cured or clamped atom (prot, cure, clamp) is left out: reagents leave them alone (prot, cure, clamp); the molecule's own reflexes leave only prot alone (a cured C=O still takes the ring, the salt rule); a protected site never stalls the cascade
  const free = (G, s) => { const L = G.self ? G.lockSelf : G.lock; for (const f of ['t', 'k', 'oh', 'c', 'A', 'B']) { const v = s[f]; if (v && v.some(i => L[i])) return false; } return true; };
  const lex = (a, b) => { for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i]; return a.length - b.length; };
  // ---------- groups (each is a list of tuples of atom indices, the numbered atoms of the SMARTS) ----------
  const KC = (G, c) => CX3(G, c) && dblO(G, c) >= 0 && !G.nb[c].some(q => q.o === 1 && el(G, q.j) !== 'C');    // [CX3;!$(C(=O)-[!#6])] with its =O
  const ketones = G => { const out = []; for (let c = 0; c < G.n; c++) if (KC(G, c)) out.push([c, dblO(G, c)]); return out; };       // [KC:1]=[O:2]
  const isOH = (G, o) => el(G, o) === 'O' && X(G, o) === 2 && G.hc[o] === 1;                     // [OX2H]
  const hydroxyls = (G, withAr) => { const out = []; for (let o = 0; o < G.n; o++) if (isOH(G, o)) { const q = G.nb[o][0]; if (q.o === 1 && (CX4(G, q.j) || (withAr && el(G, q.j) === 'C' && G.ar[q.j]))) out.push([o, q.j]); } return out; };
  const hx = (G, x) => (el(G, x) === 'O' && isOH(G, x)) || (el(G, x) === 'N' && X(G, x) === 3 && G.hc[x] === 2) || (el(G, x) === 'S' && X(G, x) === 2 && G.hc[x] === 1);
  const donors = G => { const out = []; for (let x = 0; x < G.n; x++) if (hx(G, x) && G.nb[x].length === 1) { const q = G.nb[x][0]; if (q.o === 1 && CX4(G, q.j) && oneHet(G, q.j)) out.push([x, q.j]); } return out; };   // [OX2H,NX3H2,SX2H]-[CX4;ONE_HET]
  // the pairs of groups whose anchor carbons are lo..hi bonds apart along carbon (chemlib.pair_sites)
  function pairs(G, As, Bs, aa, bb, lo, hi, ring, limit) {
    const out = [];
    As.forEach((a, ia) => { const dist = cdist(G, a[aa], hi); Bs.forEach((b, ib) => {
      const ca = a[aa], cb = b[bb], d = dist.get(cb); if (d == null || d < lo || d > hi || cb === ca) return;
      if (a.some(x => b.includes(x))) return; if (ring === 'lactol' && !lactolOk(G, cb, ca, limit || 8)) return;
      out.push({ A: a, B: b, dist: d, tie: [ia, ib], anch: [ca, cb], via: NEAR.via(G, ca, cb) }); }); });
    return out;
  }
  const byDist = (x, y) => x.dist - y.dist || lex(x.tie, y.tie);
  // ---------- the editing ----------
  const setBond = (m, a, b, o) => { const k = m.findBond(a, b); if (k) k.order = o; else m.bonds.push({ a, b, order: o }); };
  function normH(m, list) {
    list.forEach(a => {
      if (!a || a.el === 'H' || !m.atoms.includes(a)) return; let s = 0; const hs = [];
      m.bonds.forEach(k => { if (k.a === a) { if (k.b.el === 'H') hs.push(k.b); else s += k.order; } else if (k.b === a) { if (k.a.el === 'H') hs.push(k.a); else s += k.order; } });
      const want = (VAL[a.el] || 0) - s; for (let i = hs.length; i < want; i++) attach(m, 'H', a, DIST.H); for (let i = hs.length; i > want && i > 0; i--) { REMOVED.push(hs[i - 1]); m.removeAtom(hs[i - 1]); }
    });
  }
  const newAt = (m, e, to, order) => { const a = attach(m, e, to, DIST[e]); if (order > 1) setBond(m, to, a, order); return a; };
  const unbond = (m, a, b) => cut(m, a, b);
  // a group leaving: the atom and the hydrogens on it, detached from the molecule (the caller removes them)
  const hOf = (m, a) => nbs(m, a).filter(n => n.atom.el === 'H').map(n => n.atom);
  const take = (m, a) => [a].concat(hOf(m, a));
  // ---------- the reflexes ----------
  const R = {};
  // ring (the zip): an OH 3 or 4 carbons from a C=O closes a ring through its oxygen
  R.ring = {
    prio: 2, per: 2,
    find(G, reach) {
      const hi = Math.max(4, reach | 0), ks = ketones(G), ohs = hydroxyls(G, true), out = []; if (!ks.length || !ohs.length) return out;
      ks.forEach((k, ik) => { const dist = cdist(G, k[0], hi); ohs.forEach((s, io) => {
        const kc = k[0], sc = s[1]; if (sc === kc) return; const d = dist.get(sc); if (d == null || d < 3 || d > hi) return;
        if ((inRing(G, kc) || inRing(G, sc)) && !lactolOk(G, sc, kc, 8)) return;
        let front = 0; G.nb[sc].forEach(q => { if (q.j !== s[0] && el(G, q.j) === 'O' && G.nb[q.j].length === 2 && G.nb[q.j].every(w => el(G, w.j) === 'C')) front = 1; });
        out.push({ dist: d, sort: [-front, d, ik, io], k, oh: s }); }); });
      return out.sort((x, y) => lex(x.sort, y.sort));
    },
    edit(G, m, s) { const A = i => G.atoms[i]; setBond(m, A(s.k[0]), A(s.k[1]), 1); m.bond(A(s.oh[0]), A(s.k[0])); normH(m, [A(s.oh[0]), A(s.k[1])]); return { focus: [A(s.oh[0]), A(s.k[0]), A(s.k[1])], incoming: [], leaving: [] }; }
  };
  // dry: an OH 2 carbons from a C=O leaves as water and a C=C forms beside the C=O
  R.dry = {
    prio: 1, per: 1, off: { water: 1 },
    find(G) {
      const out = [];
      ketones(G).forEach(k => { const c1 = k[0]; G.nb[c1].forEach(q3 => { const c3 = q3.j; if (q3.o !== 1 || !CX4(G, c3) || G.hc[c3] < 1) return;
        G.nb[c3].forEach(q4 => { const c4 = q4.j; if (c4 === c1 || q4.o !== 1 || !CX4(G, c4) || !oneHet(G, c4)) return;
          G.nb[c4].forEach(q5 => { if (q5.j !== c3 && q5.o === 1 && isOH(G, q5.j)) out.push({ dist: 2, t: [c1, k[1], c3, c4, q5.j] }); }); }); }); });
      return out.sort((x, y) => lex(x.t, y.t));
    },
    edit(G, m, s) { const A = i => G.atoms[i], c3 = A(s.t[2]), c4 = A(s.t[3]), o = A(s.t[4]), g = take(m, o); cut(m, c4, o); setBond(m, c3, c4, 2); normH(m, [c3, c4]); return { focus: [c3, c4], incoming: [], leaving: [g] }; }
  };
  // flip: an OH on a carbon of a C=C becomes C=O
  R.flip = {
    prio: 1, dist0: 0,
    find(G) {
      const out = []; for (let c1 = 0; c1 < G.n; c1++) { if (!aC(G, c1)) continue;
        const oh = G.nb[c1].find(q => q.o === 1 && isOH(G, q.j)); if (!oh) continue;
        G.nb[c1].forEach(q => { if (q.o === 2 && aC(G, q.j)) out.push({ dist: 0, t: [c1, oh.j, q.j] }); }); }
      return out.sort((x, y) => lex(x.t, y.t));
    },
    edit(G, m, s) { const A = i => G.atoms[i], c1 = A(s.t[0]), o = A(s.t[1]), c3 = A(s.t[2]); setBond(m, c1, c3, 1); setBond(m, c1, o, 2); normH(m, [c1, o, c3]); return { focus: [c1, o, c3], incoming: [], leaving: [] }; }
  };
  // shift: a C=C whose near carbon is 2 carbons from a C=O slides one carbon toward it
  R.shift = {
    prio: 1,
    find(G) {
      const out = [], conj = c => G.nb[c].some(q => q.o === 1 && el(G, q.j) === 'C' && dblO(G, q.j) >= 0);
      ketones(G).forEach(k => { const c1 = k[0]; G.nb[c1].forEach(q3 => { const c3 = q3.j; if (q3.o !== 1 || !CX4(G, c3) || G.hc[c3] < 1) return;
        G.nb[c3].forEach(q4 => { const c4 = q4.j; if (c4 === c1 || q4.o !== 1 || !CX3(G, c4) || conj(c4)) return;
          G.nb[c4].forEach(q5 => { const c5 = q5.j; if (q5.o === 2 && aC(G, c5) && !conj(c5)) out.push({ dist: 2, t: [c1, k[1], c3, c4, c5] }); }); }); });  });
      return out.sort((x, y) => lex(x.t, y.t));
    },
    edit(G, m, s) { const A = i => G.atoms[i], c3 = A(s.t[2]), c4 = A(s.t[3]), c5 = A(s.t[4]); setBond(m, c3, c4, 2); setBond(m, c4, c5, 1); normH(m, [c3, c4, c5]); return { focus: [c3, c4, c5], incoming: [], leaving: [] }; }
  };
  // tuck: a C=C beside a C=O and an OH 3 or 4 carbons from its far end: the OH adds to the far carbon and closes a ring
  R.tuck = {
    prio: 1,
    find(G) {
      const As = []; ketones(G).forEach(k => { const c1 = k[0]; G.nb[c1].forEach(q3 => { if (q3.o !== 1 || !aC(G, q3.j)) return; G.nb[q3.j].forEach(q4 => { if (q4.o === 2 && aC(G, q4.j) && q4.j !== c1) As.push([c1, k[1], q3.j, q4.j]); }); }); });
      As.sort(lex); const Bs = hydroxyls(G, false).filter(b => oneHet(G, b[1]));
      return pairs(G, As, Bs, 3, 1, 3, 4, 'lactol').sort(byDist);
    },
    edit(G, m, s) { const A = i => G.atoms[i], c3 = A(s.A[2]), c4 = A(s.A[3]), o = A(s.B[0]); setBond(m, c3, c4, 1); m.bond(o, c4); normH(m, [c3, c4, o]); return { focus: [o, c4, c3], incoming: [], leaving: [] }; }
  };
  // weld: the carbon beside one C=O joins a second C=O 4 or 5 carbons away and a ring closes
  R.weld = {
    prio: 1, per: 2,
    find(G) {
      const As = [], Bs = [];
      ketones(G).forEach(k => { G.nb[k[0]].forEach(q => { const c3 = q.j; if (q.o === 1 && CX4(G, c3) && !inRing(G, c3) && G.hc[c3] >= 1) As.push([k[0], k[1], c3]); }); if (!inRing(G, k[0])) Bs.push([k[0], k[1]]); });
      As.sort(lex);
      return pairs(G, As, Bs, 2, 0, 4, 5, 'any').sort(byDist);
    },
    edit(G, m, s) { const A = i => G.atoms[i], a = A(s.A[2]), c2 = A(s.B[0]), o2 = A(s.B[1]); setBond(m, c2, o2, 1); m.bond(a, c2); normH(m, [a, c2, o2]); return { focus: [a, c2, o2], incoming: [], leaving: [] }; }
  };
  // snap: two C=C side by side and a third C=C close a six-ring
  R.snap = {
    prio: 1,
    find(G) {
      const out = [], dbls = []; G.nb.forEach((l, a) => l.forEach(q => { if (q.j > a && q.o === 2 && el(G, a) === 'C' && el(G, q.j) === 'C' && !G.ar[a] && !G.ar[q.j]) dbls.push([a, q.j]); }));
      if (dbls.length < 3) return out;
      dbls.forEach(([x, y], ia) => [[x, y], [y, x]].forEach(([c1, c2]) => { cnb(G, c2).forEach(c3 => { if (c3 === c1 || bo(G, c2, c3) === 2) return;
        cnb(G, c3).forEach(c4 => { if (c4 === c2 || c4 === c1 || bo(G, c3, c4) !== 2) return;
          dbls.forEach(([u, v], ib) => { if (ib === ia || [u, v].some(w => w === c1 || w === c2 || w === c3 || w === c4)) return;
            [[u, v], [v, u]].forEach(([ca, cb]) => { const p = cpath(G, c4, ca, 5); if (!p || p.length < 5 || p.includes(c3) || p.includes(cb) || p.includes(c1) || bo(G, c1, cb)) return;
              out.push({ dist: p.length - 1, tie: [ia, ib], c: [c1, c2, c3, c4, ca, cb] }); }); }); }); }); }));
      return out.sort(byDist);
    },
    edit(G, m, s) { const A = i => G.atoms[i], [c1, c2, c3, c4, ca, cb] = s.c.map(A); setBond(m, c1, c2, 1); setBond(m, c3, c4, 1); setBond(m, c2, c3, 2); setBond(m, ca, cb, 1); m.bond(c1, cb); m.bond(c4, ca); normH(m, [c1, c2, c3, c4, ca, cb]); return { focus: [c1, c4, ca, cb], incoming: [], leaving: [] }; }
  };
  // knit: an NH2 3 or 4 carbons from a C=O adds to it and closes a ring through N
  R.knit = {
    prio: 0,
    find(G) { const Bs = []; for (let n = 0; n < G.n; n++) if (el(G, n) === 'N' && X(G, n) === 3 && G.hc[n] === 2 && G.nb[n].length === 1 && G.nb[n][0].o === 1 && CX4(G, G.nb[n][0].j)) Bs.push([n, G.nb[n][0].j]);
      return pairs(G, ketones(G), Bs, 0, 1, 3, 4, 'lactol').sort(byDist); },
    edit(G, m, s) { const A = i => G.atoms[i], c = A(s.A[0]), o = A(s.A[1]), n = A(s.B[0]); setBond(m, c, o, 1); m.bond(c, n); normH(m, [c, o, n]); return { focus: [c, o, n], incoming: [], leaving: [] }; }
  };
  // seal: a COOH and an OH, NH2 or SH 3 or 4 carbons apart join as a lactone, lactam or thiolactone; water comes off
  R.seal = {
    prio: 0, off: { water: 1 },
    find(G) {
      const As = []; for (let c = 0; c < G.n; c++) { if (!CX3(G, c)) continue; const o = dblO(G, c); if (o < 0) continue; const oh = G.nb[c].find(q => q.o === 1 && isOH(G, q.j)); if (!oh) continue; if (!G.nb[c].some(q => q.o === 1 && el(G, q.j) === 'C')) continue; As.push([c, o, oh.j]); }
      return pairs(G, As, donors(G), 0, 1, 3, 4, 'lactol').sort(byDist);
    },
    edit(G, m, s) { const A = i => G.atoms[i], c = A(s.A[0]), oh = A(s.A[2]), x = A(s.B[0]), g = take(m, oh); cut(m, c, oh); m.bond(x, c); normH(m, [c, x]); return { focus: [c, x], incoming: [], leaving: [g] }; }
  };
  // cap: an SH 3 or 4 carbons from a C=O adds to it and closes a ring through S
  R.cap = {
    prio: 0,
    find(G) { const As = []; for (let s = 0; s < G.n; s++) if (el(G, s) === 'S' && X(G, s) === 2 && G.hc[s] === 1 && G.nb[s].length === 1 && G.nb[s][0].o === 1 && CX4(G, G.nb[s][0].j)) As.push([s, G.nb[s][0].j]);
      return pairs(G, As, ketones(G), 1, 0, 3, 4, 'lactol').sort(byDist); },
    edit(G, m, s) { const A = i => G.atoms[i], sf = A(s.A[0]), c = A(s.B[0]), o = A(s.B[1]); setBond(m, c, o, 1); m.bond(sf, c); normH(m, [c, o, sf]); return { focus: [sf, c, o], incoming: [], leaving: [] }; }
  };
  // close: a Cl and an OH, NH2, SH or COOH 3 to 5 carbons apart close a ring; acid fumes come off
  R.close = {
    prio: 0, off: { acid_fumes: 1 },
    find(G) {
      const As = []; for (let c = 0; c < G.n; c++) if (el(G, c) === 'Cl' && G.nb[c].length === 1 && CX4(G, G.nb[c][0].j) && G.nb[c][0].o === 1) As.push([c, G.nb[c][0].j]);
      if (!As.length) return [];
      const Bacid = []; for (let o = 0; o < G.n; o++) if (isOH(G, o)) { const q = G.nb[o][0]; if (q.o === 1 && CX3(G, q.j) && dblO(G, q.j) >= 0) Bacid.push([o, q.j]); }
      return pairs(G, As, donors(G), 1, 1, 3, 5, 'lactol').concat(pairs(G, As, Bacid, 1, 1, 3, 5, 'lactol')).sort(byDist);
    },
    edit(G, m, s) { const A = i => G.atoms[i], cl = A(s.A[0]), c = A(s.A[1]), x = A(s.B[0]), g = take(m, cl); cut(m, cl, c); m.bond(x, c); normH(m, [c, x]); return { focus: [x, c], incoming: [], leaving: [g] }; }
  };
  // open: an OH 3 or 4 carbons from a carbon of an epoxide opens it and closes a ring
  R.open = {
    prio: 0,
    find(G) {
      const As = []; for (let o = 0; o < G.n; o++) { if (el(G, o) !== 'O' || G.nb[o].length !== 2 || G.hc[o] !== 0 || G.nb[o].some(q => q.o !== 1 || !aC(G, q.j))) continue; const a = G.nb[o][0].j, b = G.nb[o][1].j; if (bo(G, a, b) === 1) { As.push([a, o, b]); As.push([b, o, a]); } }
      As.sort(lex); return pairs(G, As, hydroxyls(G, false).filter(b => oneHet(G, b[1])), 0, 1, 3, 4, 'lactol').sort(byDist);
    },
    edit(G, m, s) { const A = i => G.atoms[i], ca = A(s.A[0]), oe = A(s.A[1]), oh = A(s.B[0]); cut(m, ca, oe); m.bond(oh, ca); normH(m, [ca, oe, oh]); return { focus: [ca, oh, oe], incoming: [], leaving: [] }; }
  };
  // fold: an epoxide with a carbon on both ends turns into a C=O
  R.fold = {
    prio: 1, dist0: 9,
    find(G) {
      const out = []; for (let o = 0; o < G.n; o++) { if (el(G, o) !== 'O' || G.nb[o].length !== 2 || G.hc[o] !== 0 || G.nb[o].some(q => q.o !== 1 || !aC(G, q.j))) continue; const a = G.nb[o][0].j, b = G.nb[o][1].j; if (bo(G, a, b) !== 1) continue;
        [[a, b], [b, a]].forEach(([c1, c3]) => { if (G.hc[c1] <= 1 && G.hc[c3] === 1) out.push({ dist: 9, t: [c1, o, c3] }); }); }
      return out.sort((x, y) => lex(x.t, y.t));
    },
    edit(G, m, s) { const A = i => G.atoms[i], c1 = A(s.t[0]), o = A(s.t[1]), c3 = A(s.t[2]); cut(m, c1, o); setBond(m, c3, o, 2); normH(m, [c1, c3, o]); return { focus: [c1, c3, o], incoming: [], leaving: [] }; }
  };
  const ORDER = ['seal', 'close', 'knit', 'cap', 'open', 'fold', 'dry', 'flip', 'shift', 'tuck', 'weld', 'snap', 'ring'];
  // the game's card ids for the reflexes it already had (the page draws them by these names); the kind is the name in the record
  const KIND = { lactol: 'ring', enone: 'dry', taut: 'flip', weld: 'weld', snap6: 'snap', ether: 'close', shift: 'shift', tuck: 'tuck', knit: 'knit', seal: 'seal', cap: 'cap', open: 'open', fold: 'fold' };
  const CARDID = {}; Object.keys(KIND).forEach(k => { CARDID[KIND[k]] = k; });
  // which reflex goes next (engine.py _next_self). held: the kinds the run holds (any order); cnt: the steps made so far this turn by kind
  function nextReflex(m, held, cnt, G0) {
    const G = G0 || snapG(m); G.self = true; const rules = ORDER.filter(k => held.includes(k) && (R[k].per == null || (cnt[k] || 0) < R[k].per)), cands = [];
    rules.forEach((k, ri) => { const sites = R[k].find(G).filter(s => free(G, s)); if (sites.length) cands.push({ key: [R[k].prio, sites[0].dist, ri], k, sites }); });
    cands.sort((a, b) => lex(a.key, b.key));
    return cands.length ? { id: cands[0].k, site: cands[0].sites[0], sites: cands[0].sites, G } : null;
  }
  const mergeOff = (to, off) => { if (off) Object.keys(off).forEach(k => { to[k] = (to[k] || 0) + off[k]; }); };
  function doReflex(m, nx, remove) {
    const r = R[nx.id].edit(nx.G, m, nx.site); if (remove) r.leaving.forEach(g => g.forEach(a => m.removeAtom(a))); return r;
  }
  function settle(m, held, cnt, budget) {
    const steps = [], off = {}; let capped = false; cnt = cnt || {};
    for (;;) {
      if (steps.length >= budget) { capped = !!nextReflex(m, held, cnt); break; }
      const nx = nextReflex(m, held, cnt); if (!nx) break;
      doReflex(m, nx, true); steps.push(nx.id); cnt[nx.id] = (cnt[nx.id] || 0) + 1; mergeOff(off, R[nx.id].off);
    }
    return { steps, off, capped };
  }
  // loose rings: a carbon with an OH, beside a ring bond to an O, S or N of two connections: the ring lets go (library.py reopen)
  function reopenOne(m, cuts) {
    const G = snapG(m);
    for (let c = 0; c < G.n; c++) { if (!CX4(G, c)) continue; const oh = G.nb[c].find(q => q.o === 1 && isOH(G, q.j)); if (!oh) continue;
      for (const q of G.nb[c]) { const x = q.j; if (x === oh.j || G.atoms[x].frz || G.atoms[oh.j].prot || q.o !== 1 || !((el(G, x) === 'O' && X(G, x) === 2) || (el(G, x) === 'S' && X(G, x) === 2) || (el(G, x) === 'N' && X(G, x) === 3)) || G.nb[x].length !== 2) continue;
        if (!bondInRing(G, c, x) || !G.nb[x].some(w => w.j !== c && el(G, w.j) === 'C')) continue;
        const A = i => G.atoms[i], ca = A(c), xa = A(x), oa = A(oh.j); cut(m, ca, xa); setBond(m, ca, oa, 2); normH(m, [ca, oa, xa]); if (cuts) cuts.push({ c: ca, o: xa }); return true; } }
    return false;
  }
  function reopen(m, cuts) { let n = 0; for (let i = 0; i < 80 && reopenOne(m, cuts); i++) n++; return n; }
  // ---------- the twelve reagents after the six (library.py Reaction.steps) ----------
  // A step is applied at one place, then looked for again, until it fits nowhere. find gives the places best first.
  const allC = (G, f) => { const out = []; for (let a = 0; a < G.n; a++) for (const q of G.nb[a]) if (q.j > a && q.o === 2 && aC(G, a) && aC(G, q.j)) out.push([a, q.j]); return out.flatMap(([a, b]) => [[a, b], [b, a]]).filter(p => (f ? f(p[0], p[1]) : true)); };
  const conjC = (G, c) => G.nb[c].some(q => q.o === 1 && el(G, q.j) === 'C' && dblO(G, q.j) >= 0);                 // $(C-[#6]=O)
  const pull = (G, c, other) => G.nb[c].some(q => q.j !== other && el(G, q.j) === 'C' && hetero(G, q.j));
  // addition across C=C: X on one carbon, H on the other (library.addition_steps); X is O, N, S or CHO
  function putX(G, m, cx, ch, X) {
    const a = G.atoms[cx], b = G.atoms[ch], inc = [];
    setBond(m, a, b, 1);
    if (X === 'CHO') { const c = newAt(m, 'C', a, 1), o = newAt(m, 'O', c, 2); inc.push(c, o); normH(m, [c, o]); } else { const x = newAt(m, X, a, 1); inc.push(x); normH(m, [x]); }
    normH(m, [a, b]); return { focus: [a, b], incoming: inc, leaving: [] };
  }
  function addSteps(X, anti) {
    const mk = (f, pick, key) => ({
      find(G) { const out = allC(G, f).map(([c1, c2]) => ({ t: [c1, c2], cx: pick(c1, c2), key: key ? key(G, c1, c2) : [0] })); return out.sort((x, y) => lex(x.key, y.key) || lex(x.t, y.t)); },
      edit(G, m, s) { const ch = s.t[0] === s.cx ? s.t[1] : s.t[0]; return putX(G, m, s.cx, ch, X); }
    });
    const stepA = G => allC(G, (c1, c2) => conjC(G, c1) && !conjC(G, c2));
    const steps = [];
    steps.push({ find(G) { return allC(G, (c1, c2) => conjC(G, c1) && !conjC(G, c2)).map(([c1, c2]) => ({ t: [c1, c2], cx: anti ? c1 : c2 })).sort((x, y) => lex(x.t, y.t)); }, edit: (G, m, s) => putX(G, m, s.cx, s.t[0] === s.cx ? s.t[1] : s.t[0], X) });
    [[0, [1, 2]], [1, [2]]].forEach(([lo, his]) => steps.push({ find(G) { return allC(G, (c1, c2) => G.hc[c1] === lo && his.includes(G.hc[c2])).map(([c1, c2]) => ({ t: [c1, c2], cx: anti ? c2 : c1 })).sort((x, y) => lex(x.t, y.t)); }, edit: (G, m, s) => putX(G, m, s.cx, s.t[0] === s.cx ? s.t[1] : s.t[0], X) }));
    steps.push({ find(G) { return allC(G).map(([c1, c2]) => { const k = [pull(G, c1, c2) ? 1 : 0, endDist(G, c1)]; return { t: [c1, c2], cx: c1, key: anti ? [-k[0], -k[1]] : k }; }).sort((x, y) => lex(x.key, y.key) || lex(x.t, y.t)); }, edit: (G, m, s) => putX(G, m, s.cx, s.t[1], X) });
    return steps;
  }
  // elimination: the group on c1 leaves and a C=C forms toward a neighbour with an H; zaitsev (fewest H) or most H
  function elimStep(groupOK, mostH, noOxyNb, leaveOff) {
    return {
      off: leaveOff,
      find(G) {
        const out = [];
        for (let c1 = 0; c1 < G.n; c1++) { if (!CX4(G, c1) || !oneHet(G, c1)) continue;
          if (noOxyNb && G.nb[c1].some(q => el(G, q.j) === 'C' && G.nb[q.j].some(w => el(G, w.j) === 'O'))) continue;
          const g = G.nb[c1].find(q => q.o === 1 && groupOK(G, q.j)); if (!g) continue;
          G.nb[c1].forEach(q => { const c3 = q.j; if (c3 === g.j || q.o !== 1 || !CX4(G, c3) || G.hc[c3] < 1 || G.nb[c3].some(w => el(G, w.j) !== 'C')) return;
            const conj = G.nb[c3].some(w => w.j !== c1 && el(G, w.j) === 'C' && !sp3(G, w.j));
            out.push({ t: [c1, g.j, c3], key: mostH ? [-G.hc[c3]] : [G.hc[c3], conj ? 0 : 1, -endDist(G, c3)] }); }); }
        return out.sort((x, y) => lex(x.key, y.key) || lex(x.t, y.t));
      },
      edit(G, m, s) { const A = i => G.atoms[i], c1 = A(s.t[0]), x = A(s.t[1]), c3 = A(s.t[2]), g = take(m, x); cut(m, c1, x); setBond(m, c1, c3, 2); normH(m, [c1, c3]); return { focus: [c1, c3], incoming: [], leaving: [g] }; }
    };
  }
  const isNH2 = (G, x) => el(G, x) === 'N' && X(G, x) === 3 && G.hc[x] === 2 && G.nb[x].length === 1;
  const methylKet = (G, c) => dblO(G, c) >= 0 && G.nb[c].some(q => q.o === 1 && el(G, q.j) === 'C' && G.hc[q.j] === 3 && X(G, q.j) === 4);       // $(C(=O)[CH3])
  const hweSite = (G, c) => KC(G, c) && (methylKet(G, c) || G.hc[c] === 1);
  // every C=O (a ketone or aldehyde, see KC) that a test takes, best first: the places of a carbonyl reagent
  const carbonyls = (G, f) => ketones(G).filter(k => f(G, k[0])).map(k => ({ t: k }));
  const REAG = {
    hydrate: addSteps('O', false),
    hydroborate: addSteps('O', true),
    dehydrate: [elimStep(isOH, false, true, { water: 1 })],
    oxidize: [
      { off: { hydrogen: 1 }, find(G) { const out = []; for (let c = 0; c < G.n; c++) { if (!CX4(G, c) || G.hc[c] < 1 || !oneHet(G, c)) continue; const q = G.nb[c].find(w => w.o === 1 && isOH(G, w.j)); if (q) out.push({ t: [c, q.j] }); } return out; },
        edit(G, m, s) { const A = i => G.atoms[i], c = A(s.t[0]), o = A(s.t[1]); setBond(m, c, o, 2); normH(m, [c, o]); return { focus: [c, o], incoming: [], leaving: [] }; } },
      { when: () => MODE.co2, off: { carbon_dioxide: 1 }, find: G => { const out = []; for (let c1 = 0; c1 < G.n; c1++) for (const q of G.nb[c1]) { const c2 = q.j; if (q.o === 2 && aC(G, c1) && aC(G, c2) && G.hc[c1] === 2 && G.nb[c1].length === 1 && G.hc[c2] === 1 && G.nb[c2].length === 2) out.push({ t: [c1, c2] }); } return out.sort((x, y) => lex(x.t, y.t)); },
        edit(G, m, s) { const A = i => G.atoms[i], c1 = A(s.t[0]), c2 = A(s.t[1]), g = take(m, c1); cut(m, c1, c2); const o1 = newAt(m, 'O', c2, 2); normH(m, [c2, o1]); return { focus: [c2], incoming: [o1], leaving: [g] }; } }
    ],
    reduce: [{ find: G => ketones(G).filter(k => G.hc[k[0]] === 1 || G.hc[k[0]] === 2).map(t => ({ t })), edit(G, m, s) { const A = i => G.atoms[i], c = A(s.t[0]), o = A(s.t[1]); setBond(m, c, o, 1); normH(m, [c, o]); return { focus: [c, o], incoming: [], leaving: [] }; } }],
    grow: [{ find: G => ketones(G).map(t => ({ t })), edit(G, m, s) { const A = i => G.atoms[i], c = A(s.t[0]), o = A(s.t[1]); setBond(m, c, o, 1); const c1 = newAt(m, 'C', c, 1), c2 = newAt(m, 'C', c1, 1), c3 = newAt(m, 'C', c2, 2); normH(m, [c, o, c1, c2, c3]); return { focus: [c, o], incoming: [c1, c2, c3], leaving: [] }; } }],
    hwe: [{ find: G => carbonyls(G, (g, c) => hweSite(g, c) && !g.nb[c].some(q => q.o === 1 && el(g, q.j) === 'C' && g.nb[q.j].some(w => w.o === 2 && el(g, w.j) === 'C')))
      , edit(G, m, s) { const A = i => G.atoms[i], c = A(s.t[0]), o = A(s.t[1]); m.removeAtom(o); const c2 = newAt(m, 'C', c, 2), c3 = newAt(m, 'C', c2, 1), o3 = newAt(m, 'O', c3, 2), c4 = newAt(m, 'C', c3, 1); normH(m, [c, c2, c3, o3, c4]); return { focus: [c, c2], incoming: [c2, c3, o3, c4], leaving: [] }; } }],
    dihydroxylation: [{ find: G => allC(G).filter((p, i) => p[0] < p[1]).map(t => ({ t })), edit(G, m, s) { const A = i => G.atoms[i], a = A(s.t[0]), b = A(s.t[1]); setBond(m, a, b, 1); const o1 = newAt(m, 'O', a, 1), o2 = newAt(m, 'O', b, 1); normH(m, [a, b, o1, o2]); return { focus: [a, b], incoming: [o1, o2], leaving: [] }; } }],
    ozonolysis: [{ cut: true, find: G => allC(G).filter(p => p[0] < p[1]).map(t => ({ t })), edit(G, m, s) { const A = i => G.atoms[i], a = A(s.t[0]), b = A(s.t[1]); cut(m, a, b); const o1 = newAt(m, 'O', a, 2), o2 = newAt(m, 'O', b, 2); normH(m, [a, b, o1, o2]); return { focus: [a, b], incoming: [o1, o2], leaving: [] }; } }],
    permanganate: [
      { off: { carbon_dioxide: 1 }, find: G => { const out = []; for (let c1 = 0; c1 < G.n; c1++) for (const q of G.nb[c1]) { const c2 = q.j; if (q.o === 2 && aC(G, c1) && aC(G, c2) && G.hc[c1] === 2 && G.nb[c1].length === 1 && G.hc[c2] === 1 && G.nb[c2].length === 2) out.push({ t: [c1, c2] }); } return out.sort((x, y) => lex(x.t, y.t)); },
        edit(G, m, s) { const A = i => G.atoms[i], c1 = A(s.t[0]), c2 = A(s.t[1]), g = take(m, c1); cut(m, c1, c2); const o1 = newAt(m, 'O', c2, 2), o2 = newAt(m, 'O', c2, 1); normH(m, [c2, o1, o2]); return { focus: [c2], incoming: [o1, o2], leaving: [g] }; } },
      { find: G => ketones(G).filter(k => G.hc[k[0]] === 1).map(t => ({ t })), edit(G, m, s) { const A = i => G.atoms[i], c = A(s.t[0]), o = A(s.t[1]); const o2 = newAt(m, 'O', c, 1); normH(m, [c, o, o2]); return { focus: [c, o], incoming: [o2], leaving: [] }; } },
      { off: { hydrogen: 1 }, find: G => { const out = []; for (let o = 0; o < G.n; o++) { if (!isOH(G, o)) continue; const c = G.nb[o][0].j; if (G.nb[o][0].o === 1 && CX4(G, c) && G.hc[c] === 2 && G.nb[c].length === 2 && G.nb[c].some(q => el(G, q.j) === 'C')) out.push({ t: [c, o] }); } return out.sort((x, y) => lex(x.t, y.t)); },
        edit(G, m, s) { const A = i => G.atoms[i], c = A(s.t[0]), o = A(s.t[1]), o2 = newAt(m, 'O', c, 2); normH(m, [c, o, o2]); return { focus: [c, o], incoming: [o2], leaving: [] }; } }
    ],
    ritter: addSteps('N', false),
    thiolene: addSteps('S', true),
    hydroformylation: addSteps('CHO', true),
    chlorination: [{ off: { acid_fumes: 1 }, find(G) { const out = []; for (let c = 0; c < G.n; c++) { if (!CX4(G, c) || G.hc[c] < 1 || !oneHet(G, c)) continue; const q = G.nb[c].find(w => w.o === 1 && isOH(G, w.j)); if (q) out.push({ t: [c, q.j] }); } return out; },
      edit(G, m, s) { const A = i => G.atoms[i], c = A(s.t[0]), o = A(s.t[1]), g = take(m, o); cut(m, c, o); const cl = newAt(m, 'Cl', c, 1); normH(m, [c, cl]); return { focus: [c, cl], incoming: [cl], leaving: [g] }; } }],
    cyanohydrin: [{ off: { ammonia: 1 }, find: G => carbonyls(G, (g, c) => KC(g, c) && (methylKet(g, c) || g.hc[c] === 1)),
      edit(G, m, s) { const A = i => G.atoms[i], c = A(s.t[0]), o = A(s.t[1]); setBond(m, c, o, 1); const c2 = newAt(m, 'C', c, 1), o2 = newAt(m, 'O', c2, 2), o3 = newAt(m, 'O', c2, 1); normH(m, [c, o, c2, o2, o3]); return { focus: [c, o], incoming: [c2, o2, o3], leaving: [] }; } }],
    hofmann: [Object.assign(elimStep(isNH2, true, false, { trimethylamine: 1, water: 1 }), {})],
    chugaev: [elimStep(isOH, true, true, { sulfur: 1 })],
    epoxidation: [{ find: G => allC(G).filter(p => p[0] < p[1]).map(t => ({ t })), edit(G, m, s) { const A = i => G.atoms[i], a = A(s.t[0]), b = A(s.t[1]); setBond(m, a, b, 1); const o = newAt(m, 'O', a, 1); m.bond(o, b); normH(m, [a, b, o]); return { focus: [a, b], incoming: [o], leaving: [] }; } }]
  };
  // the heaviest piece stays when a cut makes two (ozonolysis); the others are 'piece'
  function dropPieces(m) {
    const comps = m.components ? m.components() : null; if (!comps || comps.length < 2) return 0;
    const size = c => c.filter(a => a.el !== 'H').length; comps.sort((a, b) => size(b) - size(a) || m.atoms.indexOf(a[0]) - m.atoms.indexOf(b[0]));
    let dropped = 0; for (let i = 1; i < comps.length; i++) { if (comps[i].some(a => a.prot || a.cure || a.clamp)) continue; comps[i].forEach(a => m.removeAtom(a)); dropped++; } return dropped;
  }
  // one reagent at every place it fits: { n, off, piece, made, gone } (library.py Reaction.fire); the molecule is changed in place
  function fire(m, id, each) {
    const steps = REAG[id]; if (!steps) return null; const res = { n: 0, off: {}, piece: 0, made: [], gone: [] };
    steps.forEach(st => {
      if (st.when && !st.when()) return;
      for (let guard = 0; guard < 64; guard++) {
        const G = snapG(m), sites = st.find(G).filter(s => free(G, s)); if (!sites.length) break;
        REMOVED.length = 0; const r = st.edit(G, m, sites[0]); const grp = r.leaving.reduce((a, g) => a.concat(g), []).concat(REMOVED); r.leaving.forEach(g => g.forEach(a => m.removeAtom(a)));
        if (st.off || r.leaving.length) { grp.off = st.off || null; res.gone.push(grp); }
        r.focus.concat(r.incoming).forEach(a => res.made.push(a)); res.n++; mergeOff(res.off, st.off);
        if (st.cut) { const k = dropPieces(m); if (k) { res.piece += k; res.off.piece = (res.off.piece || 0) + k; } }
        if (each) each(r);
      }
    });
    return res;
  }
  // ---------- SMILES out (Kekule, hydrogens implicit): for the comparison with RDKit ----------
  function toSmiles(m) {
    const G = snapG(m), seen = new Array(G.n).fill(false), nr = [0], parts = [];
    const sym = i => el(G, i), ob = o => (o === 2 ? '=' : o === 3 ? '#' : '');
    for (let s = 0; s < G.n; s++) {
      if (seen[s]) continue;
      const order = [], parent = new Map(), tree = new Set(), ring = new Map(); const stack = [[s, -1]];
      // depth-first: find ring closure bonds
      const state = new Array(G.n).fill(0), kids = new Map(), closes = []; const dfs = (u, p) => { state[u] = 1; seen[u] = true; kids.set(u, []); for (const q of G.nb[u]) { if (q.j === p) continue; if (state[q.j] === 0) { kids.get(u).push(q); dfs(q.j, u); } else if (state[q.j] === 1) closes.push({ a: q.j, b: u, o: q.o }); } state[u] = 2; };
      dfs(s, -1);
      const opens = new Map(), digs = new Map(); closes.forEach((c, i) => { const d = (i % 9) + 1; (opens.get(c.a) || opens.set(c.a, []).get(c.a)).push({ d: i + 1, o: c.o }); (digs.get(c.b) || digs.set(c.b, []).get(c.b)).push({ d: i + 1, o: c.o }); });
      const num = d => (d < 10 ? String(d) : '%' + d);
      const w = u => { let t = sym(u); (opens.get(u) || []).forEach(r => { t += ob(r.o) + num(r.d); }); (digs.get(u) || []).forEach(r => { t += num(r.d); }); const k = kids.get(u); k.forEach((q, i) => { const sub = ob(q.o) + w(q.j); t += i < k.length - 1 ? '(' + sub + ')' : sub; }); return t; };
      parts.push(w(s));
    }
    return parts.join('.');
  }
  return { free, NEAR, R, REAG, ORDER, KIND, CARDID, removed: REMOVED, snapG, nextReflex, doReflex, settle, reopen, fire, toSmiles, smilesOf: toSmiles, normH, X, el };
})();
// ---------- the cards: the twelve reagents and the thirteen reflexes as the page and the rules read them ----------
// MODE.eng (path.js RULE.engine, on) switches the engine's version of a reflex on; off, the older version of the card is used.
MODE.eng = true;
const siteAnch = (G, s) => (s.anch ? s.anch : s.t ? [s.t[0], s.t[s.t.length - 1]] : s.k ? [s.k[0], s.oh[1]] : s.c ? [s.c[0], s.c[3]] : [0, 0]).map(i => G.atoms[i]);
const siteAtoms = (G, s) => { const idx = []; ['k', 'oh', 't', 'c', 'A', 'B'].forEach(f => { if (s[f]) idx.push(...s[f]); }); return Array.from(new Set(idx)).map(i => G.atoms[i]); };
const REFLEXES = {
  ring: { id: 'lactol', verb: 'Zip', tag: 'closes a ring', rgb: [47, 120, 160], rule: 'An OH and a C=O close a ring.', from: 'ol', to: 'ring' },
  dry: { id: 'enone', verb: 'Dry', tag: 'loses water', rgb: [224, 122, 0], rule: 'An OH near a C=O leaves as water and a C=C forms.', from: 'ol', to: 'ene' },
  flip: { id: 'taut', verb: 'Flip', tag: 'flips', rgb: [176, 24, 154], rule: 'An OH on a C=C becomes C=O.', from: 'ene', to: 'one' },
  weld: { id: 'weld', verb: 'Weld', tag: 'welds a ring', rgb: [168, 92, 36], rule: 'Two C=O close a ring between them.', from: 'one', to: 'ring' },
  snap: { id: 'snap6', verb: 'Snap', tag: 'folds shut', rgb: [200, 38, 28], rule: 'Two C=C side by side and a third nearby close a six-ring with one new C=C in it.', from: 'ene', to: 'ring' },
  close: { id: 'ether', verb: 'Close', tag: 'closes a ring', rgb: [60, 154, 95], rule: 'A Cl and an OH, NH2, SH or COOH close a ring. Acid fumes leave.', from: 'cl', to: 'ring' },
  shift: { id: 'shift', verb: 'Shift', tag: 'slides', rgb: [140, 90, 190], rule: 'A C=C two carbons from a C=O slides to sit beside it.', from: 'ene', to: 'ene' },
  tuck: { id: 'tuck', verb: 'Tuck', tag: 'tucks in', rgb: [30, 140, 140], rule: 'An OH adds to the far end of a C=C beside a C=O and closes a ring.', from: 'ol', to: 'ring' },
  knit: { id: 'knit', verb: 'Knit', tag: 'knits a ring', rgb: [80, 90, 200], rule: 'An NH2 and a C=O close a ring.', from: 'one', to: 'ring' },
  seal: { id: 'seal', verb: 'Seal', tag: 'seals a ring', rgb: [120, 120, 60], rule: 'A COOH and an OH, NH2 or SH join into a ring. Water leaves.', from: 'ol', to: 'ring' },
  cap: { id: 'cap', verb: 'Cap', tag: 'caps a ring', rgb: [200, 170, 30], rule: 'An SH and a C=O close a ring.', from: 'one', to: 'ring' },
  open: { id: 'open', verb: 'Open', tag: 'opens an epoxide', rgb: [60, 110, 170], rule: 'An OH opens an epoxide and closes a ring.', from: 'ol', to: 'ring' },
  fold: { id: 'fold', verb: 'Fold', tag: 'folds over', rgb: [170, 70, 100], rule: 'An epoxide turns into a C=O.', from: 'ene', to: 'one' }
};
Object.keys(REFLEXES).forEach(kind => {
  const P = REFLEXES[kind], old = CARDS[P.id], lf = old ? { find: old.find, ok: old.ok, apply: old.apply } : null;
  const c = old || { id: P.id, verb: P.verb, formula: '', chem: 'by itself', rgb: P.rgb, cls: 'self', ghs: [], rule: P.rule, from: P.from, to: P.to };
  c.kind = kind; c.legacy = lf;
  c.find = m => { if (!MODE.eng && lf) return lf.find(m); const G = ENG.snapG(m); G.self = true; const s = ENG.R[kind].find(G, m.reach).filter(x => ENG.free(G, x)); return s.length ? [{ atoms: siteAtoms(G, s[0]), d: s[0].dist, kind, join: siteAnch(G, s[0]), via: s[0].via || 'chain' }] : []; };
  c.ok = (m, s) => ((!MODE.eng && lf) ? lf.ok(m, s) : c.find(m).length > 0);
  c.apply = (m, s) => { if (!MODE.eng && lf) return lf.apply(m, s); const G = ENG.snapG(m); G.self = true; const sites = ENG.R[kind].find(G, m.reach).filter(x => ENG.free(G, x)); if (!sites.length) return { focus: [], incoming: [], leaving: [], tag: '' }; ENG.removed.length = 0; const r = ENG.R[kind].edit(G, m, sites[0]); r.tag = P.tag; r.off = ENG.R[kind].off || null; if (r.off && !r.leaving.length && ENG.removed.length) r.leaving = [ENG.removed.slice()]; if (r.off) r.leaving.forEach(g => { g.off = r.off; }); return r; };
  CARDS[P.id] = c;
});
const SIXMAP = { hydrate: 'hydrate', pcc: 'oxidize', nabh4: 'reduce', dehydrate: 'dehydrate', bh3: 'hydroborate', allyl: 'grow' };
Object.keys(SIXMAP).forEach(cid => {
  const c = LIST.find(x => x.id === cid), eid = SIXMAP[cid], steps = ENG.REAG[eid], lf = { find: c.find, ok: c.ok, apply: c.apply };
  c.legacy = lf; c.eid = eid;
  c.find = m => { if (!MODE.eng) return lf.find(m); const G = ENG.snapG(m), seen = new Set(), out = []; steps.forEach(st => { if (st.when && !st.when()) return; st.find(G).filter(x => ENG.free(G, x)).forEach(s => { const t = s.t.slice().sort((a, b) => a - b).join(','); if (seen.has(t)) return; seen.add(t); out.push({ kind: 'eng', atoms: s.t.map(i => G.atoms[i]) }); }); }); return out; };
  c.ok = (m, s) => { if (!MODE.eng) return lf.ok(m, s); const G = ENG.snapG(m); return steps.some(st => (!st.when || st.when()) && st.find(G).filter(x => ENG.free(G, x)).length > 0); };
  c.apply = (m, s) => { if (!MODE.eng) return lf.apply(m, s); const G = ENG.snapG(m); for (const st of steps) { if (st.when && !st.when()) continue; const sites = st.find(G).filter(x => ENG.free(G, x)); if (sites.length) { ENG.removed.length = 0; const r = st.edit(G, m, sites[0]); r.tag = c.verb; r.off = st.off || null; if (r.off && !r.leaving.length && ENG.removed.length) r.leaving = [ENG.removed.slice()]; if (r.off) r.leaving.forEach(g => { g.off = r.off; }); return r; } } return { focus: [], incoming: [], leaving: [], tag: '' }; };
  c.all = m => (MODE.eng ? ENG.fire(m, eid) : null);
});
const NEWR = {
  hwe: { verb: 'Extend', formula: 'HWE', chem: 'Dimethyl 2-oxopropylphosphonate, base', rgb: [196, 120, 40], cls: 'ylide', ghs: ['flame'], rule: 'Turns an aldehyde or methyl ketone C=O into C=C beside a new ketone.', from: 'one', to: 'ene' },
  dihydroxylation: { verb: 'Dihydroxylate', formula: 'OsO₄, NMO', chem: 'Osmium tetroxide, N-methylmorpholine N-oxide', rgb: [90, 60, 150], cls: 'oxidant', ghs: ['skull', 'health'], rule: 'Puts an OH on both carbons of every C=C.', from: 'ene', to: 'ol' },
  ozonolysis: { verb: 'Cleave', formula: 'O₃, Zn', chem: 'Ozone, then zinc', rgb: [120, 170, 220], cls: 'oxidant', ghs: ['oxid'], rule: 'Cuts every C=C into two C=O.', from: 'ene', to: 'one' },
  permanganate: { verb: 'Burn', formula: 'KMnO₄, heat', chem: 'Potassium permanganate, hot, acid', rgb: [150, 30, 120], cls: 'oxidant', ghs: ['oxid', 'corr'], rule: 'Turns chain-end C=C, aldehydes and chain-end CH2-OH into COOH.', from: 'ene', to: 'acid' },
  ritter: { verb: 'Aminate', formula: 'CH₃CN, H₂SO₄', chem: 'Acetonitrile in strong acid, then boiling aqueous acid', rgb: [60, 90, 200], cls: 'acid', ghs: ['corr'], rule: 'Adds NH2 and H across every C=C. The NH2 goes on the carbon with fewer H.', from: 'ene', to: 'amine' },
  thiolene: { verb: 'Thiolate', formula: 'AcSH, hν', chem: 'Thioacetic acid with light, then base', rgb: [200, 180, 40], cls: 'radical', ghs: ['flame', 'skull'], rule: 'Adds SH and H across every C=C. The SH goes on the carbon with more H.', from: 'ene', to: 'thiol' },
  chlorination: { verb: 'Chlorinate', formula: 'SOCl₂', chem: 'Thionyl chloride', rgb: [150, 160, 0], cls: 'chloride', ghs: ['corr', 'skull'], rule: 'Swaps the OH of a primary or secondary alcohol for Cl.', from: 'ol', to: 'cl' },
  cyanohydrin: { verb: 'Cyanate', formula: 'NaCN, H₃O⁺', chem: 'Sodium cyanide, then boiling acid', rgb: [110, 70, 40], cls: 'base', ghs: ['skull', 'corr'], rule: 'Turns an aldehyde or methyl ketone C=O into C(OH)-COOH. Ammonia leaves.', from: 'one', to: 'acid' },
  hofmann: { verb: 'Eliminate N', formula: 'MeI, Ag₂O', chem: 'Excess methyl iodide, silver oxide, heat', rgb: [70, 110, 90], cls: 'base', ghs: ['health'], rule: 'An NH2 leaves and a C=C forms toward the neighbor with more H.', from: 'amine', to: 'ene' },
  chugaev: { verb: 'Eliminate S', formula: 'CS₂, MeI', chem: 'Carbon disulfide, base, methyl iodide, heat', rgb: [170, 150, 20], cls: 'base', ghs: ['flame', 'health'], rule: 'An OH leaves and a C=C forms toward the neighbor with more H.', from: 'ol', to: 'ene' },
  hydroformylation: { verb: 'Formylate', formula: 'CO, H₂, Rh', chem: 'Carbon monoxide and hydrogen over a rhodium catalyst', rgb: [60, 130, 130], cls: 'metal', ghs: ['flame', 'cyl'], rule: 'Adds CHO and H across every C=C. The CHO goes on the carbon with more H.', from: 'ene', to: 'one' },
  epoxidation: { verb: 'Epoxidize', formula: 'mCPBA', chem: 'meta-Chloroperoxybenzoic acid', rgb: [210, 90, 90], cls: 'oxidant', ghs: ['oxid', 'flame'], rule: 'Turns every C=C into an epoxide.', from: 'ene', to: 'epoxide' }
};
Object.keys(NEWR).forEach(id => {
  const steps = ENG.REAG[id], P = NEWR[id];
  const c = Object.assign({ id }, P);
  c.find = m => { const G = ENG.snapG(m), seen = new Set(), out = []; steps.forEach(st => st.find(G).filter(x => ENG.free(G, x)).forEach(s => { const t = s.t.slice().sort((a, b) => a - b).join(','); if (seen.has(t)) return; seen.add(t); out.push({ kind: 'eng', atoms: s.t.map(i => G.atoms[i]) }); })); return out; };
  c.ok = m => { const G = ENG.snapG(m); return steps.some(st => st.find(G).filter(x => ENG.free(G, x)).length > 0); };
  c.apply = (m, s) => { const G = ENG.snapG(m); for (const st of steps) { const sites = st.find(G).filter(x => ENG.free(G, x)); if (sites.length) { ENG.removed.length = 0; const r = st.edit(G, m, sites[0]); r.tag = P.verb; r.off = st.off || null; if (r.off && !r.leaving.length && ENG.removed.length) r.leaving = [ENG.removed.slice()]; if (r.off) r.leaving.forEach(g => { g.off = r.off; }); return r; } } return { focus: [], incoming: [], leaving: [], tag: '' }; };
  // every place at once, as the engine does it (the molecule is changed in place; what left is already removed)
  c.all = m => ENG.fire(m, id);
  c.reagent = true; LIST.push(c); CARDS[id] = c;
});
// a capped oxygen carries prot, and no bottle finds a site there
// a clamped atom (the clamp, docs/PIECES.md) is out of reach of every reagent, but the molecule's own reactions still use it
LIST.forEach(c => { CARDS[c.id] = c; const f = c.find; c.find = m => f(m).filter(s => !s.atoms.some(a => a.prot || a.cure || (a.clamp && c.cls !== 'self'))); });
// the oxygens an order can ask to be kept: alcohol OH and aldehyde or ketone C=O, by index in the atom list
const keepable = m => m.atoms.map((a, i) => (a.el !== 'O' ? null : hydroxyl(m, a) ? { i, kind: 'OH' } : carbonyls(m).some(s => s.o === a) ? { i, kind: 'C=O' } : null)).filter(Boolean);

// ---------- graph -> fingerprint ----------
function graphOf(m) {
  const atoms = m.atoms.filter(a => !a.fly), idx = new Map(atoms.map((a, i) => [a, i]));
  const bonds = m.bonds.filter(b => idx.has(b.a) && idx.has(b.b)).map(b => ({ a: idx.get(b.a), b: idx.get(b.b), order: b.order }));
  return { els: atoms.map(a => a.el), bonds };
}
// A fast signature (Weisfeiler-Lehman on integers); the rules only compare it with other signatures of the same session, it is not saved anywhere.
const sigOf = m => {
  const g = graphOf(m), n = g.els.length, adj = g.els.map(() => []), cnt = {};
  g.bonds.forEach(b => { adj[b.a].push([b.b, b.order]); adj[b.b].push([b.a, b.order]); });
  let lab = g.els.map(e => { cnt[e] = (cnt[e] || 0) + 1; let h = 7; for (let i = 0; i < e.length; i++) h = Math.imul(h ^ e.charCodeAt(i), 2654435761); return h | 0; });
  for (let r = 0, R = Math.min(n, 12); r < R; r++) {
    const prev = lab; lab = prev.map((l, i) => { const nb = adj[i].map(q => (Math.imul(prev[q[0]], 31) + q[1] * 1000003) | 0).sort((a, b) => a - b); let h = Math.imul(l ^ 0x9e3779b1, 2246822507); for (let k = 0; k < nb.length; k++) h = Math.imul(h ^ nb[k], 3266489909) ^ (h >>> 15); return h | 0; });
  }
  return Object.keys(cnt).sort().map(e => e + cnt[e]).join('') + '/' + lab.slice().sort((a, b) => a - b).join('.');
};
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
  m.atoms.forEach(a => { if (a.fly) return; const c = n.addAtom(a.el, a.x, a.y, a.z); if (a.keep) c.keep = true; if (a.prot) c.prot = true; if (a.clamp) c.clamp = true; if (a.frz) c.frz = true; if (a.cure) c.cure = true; if (a.slime) c.slime = true; if (a.seed) c.seed = true; if (a.iso) c.iso = a.iso; if (a.poly) c.poly = a.poly; if (a.tail) c.tail = true; map.set(a, c); });
  m.bonds.forEach(b => { if (map.has(b.a) && map.has(b.b)) n.bonds.push({ a: map.get(b.a), b: map.get(b.b), order: b.order }); });
  if (m.reach) n.reach = m.reach;
  return { model: n, map };
}
const cloneModel = m => cloneMap(m).model;
// applies a bottle to every site of m in place and returns how many sites reacted
function runCard(m, card, out) {
  const all = card.all ? card.all(m) : null; if (all) { if (out) all.gone.forEach(g => out.push(g)); return all.n; }
  let hits = 0;
  card.find(m).forEach(s => { if (!card.ok(m, s)) return; const r = card.apply(m, s); if (out) r.leaving.forEach(g => out.push(g)); r.leaving.flat().forEach(a => m.removeAtom(a)); hits++; });
  return hits;
}
const fromSmiles = smi => AA.Model.fromSmiles(smi, 1);

const bondOf = (m, a, b) => m.bonds.find(k => (k.a === a && k.b === b) || (k.a === b && k.b === a));
function carbonDist(m, from, max) { const dist = new Map([[from, 0]]), q = [from]; while (q.length) { const a = q.shift(), d = dist.get(a); if (d >= max) continue; carbonsOf(m, a).forEach(b => { if (!b.fly && !dist.has(b)) { dist.set(b, d + 1); q.push(b); } }); } return dist; }
// the shortest way from one carbon to another along carbon, as a list of atoms, or nothing past max bonds
function carbonPath(m, from, to, max) { const prev = new Map([[from, null]]), dist = new Map([[from, 0]]), q = [from]; while (q.length) { const a = q.shift(), d = dist.get(a); if (a === to) break; if (d >= max) continue; carbonsOf(m, a).forEach(b => { if (!b.fly && !prev.has(b)) { prev.set(b, a); dist.set(b, d + 1); q.push(b); } }); } if (!prev.has(to)) return null; const p = []; for (let a = to; a; a = prev.get(a)) p.push(a); return p.reverse(); }
// whether the bond between two atoms lies in a ring: one is still reached from the other without it
// (with size: in a ring of at most that many atoms)
function ringBond(m, a, b, size) { const nb = x => nbs(m, x).map(n => n.atom).filter(y => y.el !== 'H' && !y.fly), dist = new Map([[a, 0]]), q = [a]; while (q.length) { const u = q.shift(), d = dist.get(u); if (size && d + 1 >= size) continue; for (const v of nb(u)) { if (u === a && v === b) continue; if (v === b) return true; if (!dist.has(v)) { dist.set(v, d + 1); q.push(v); } } } return false; }
// an O-H on a carbon with single bonds only, or on a benzene ring: what a zip can start from
function hydroxylAny(m, o, ar) { if (o.el !== 'O') return null; const q = nbs(m, o); if (q.length !== 2 || q.some(n => n.bond.order !== 1)) return null; const c = q.find(n => n.atom.el === 'C'), hh = q.find(n => n.atom.el === 'H'); if (!c || !hh) return null; if (!isSp3(m, c.atom) && !(ar || aromaticAtoms(m)).has(c.atom)) return null; return { o, c: c.atom, ho: hh.atom }; }
// (a ring whose oxygen carries frz has been frozen by the carbon dioxide homunculus and never opens again)
// Every ring a zip has closed and that can still come apart: a carbon that carries an OH and, beside it, an oxygen
// that is in a ring. The ring oxygen lets go and takes the hydrogen, and the OH becomes the C=O it was. Done last
// ring first until none is left (cuts, if given, collects the carbon and the oxygen of each bond that was cut), so a ladder comes apart from its far end back to the OH that set it off. A ring
// whose OH has been taken away (by a dehydration, say) stays shut for good. Returns how many rings opened.
function reopen(m, cuts) { let n = 0;
  m.atoms.slice().forEach(c => { if (!c.cure || c.el !== 'C' || c.fly) return; nbs(m, c).slice().forEach(x => { const o = x.atom; if (o.el !== 'O' || x.bond.order !== 1 || o.frz || nbs(m, o).length !== 2 || !nbs(m, o).every(y => y.atom.el === 'C')) return; cut(m, c, o); attach(m, 'H', o, 1.2); if (cuts) cuts.push({ c, o }); n++; }); });
  if (MODE.eng) return n + ENG.reopen(m, cuts);
  for (let guard = 0; guard < 80; guard++) { let hit = null;
  for (const c of m.atoms) { if (c.el !== 'C' || c.fly) continue; const q = nbs(m, c); if (q.some(x => x.bond.order !== 1)) continue;
    const oh = q.find(x => x.atom.el === 'O' && !x.atom.prot && nbs(m, x.atom).length === 2 && nbs(m, x.atom).some(y => y.atom.el === 'H')); if (!oh) continue;
    const or = q.find(x => x.atom.el === 'O' && x.atom !== oh.atom && !x.atom.frz && nbs(m, x.atom).length === 2 && nbs(m, x.atom).every(y => y.atom.el === 'C') && ringBond(m, c, x.atom)); if (!or) continue;
    hit = { c, oh: oh.atom, or: or.atom }; break; }
  if (!hit) break; const h = nbs(m, hit.oh).find(y => y.atom.el === 'H').atom; cut(m, hit.c, hit.or); cut(m, hit.oh, h); m.bond(hit.or, h); m.bond(hit.c, hit.oh); if (cuts) cuts.push({ c: hit.c, o: hit.or }); n++; }
  return n; }
// two C=C that each end in CH2, whose inner carbons are four or more carbons apart: the pair a bridge ties, nearest ends last
function bridgeable(m) { const ar = aromaticAtoms(m), ends = []; m.bonds.forEach(b => { if (b.order !== 2 || b.a.el !== 'C' || b.b.el !== 'C' || ar.has(b.a)) return; [[b.a, b.b], [b.b, b.a]].forEach(q => { if (Hs(m, q[0]).length === 2 && carbonsOf(m, q[1]).length >= 2) ends.push({ e: q[0], a: q[1] }); }); });
  const out = []; for (let i = 0; i < ends.length; i++) for (let j = i + 1; j < ends.length; j++) { const A = ends[i], B = ends[j]; if (A.a === B.a || A.e === B.a || A.a === B.e) continue; const d = carbonDist(m, A.a, 16).get(B.a); if (d == null || d < 4) continue; out.push({ a: A.a, e1: A.e, b: B.a, e2: B.e, d, atoms: [A.a, A.e, B.a, B.e] }); }
  return out.sort((x, y) => y.d - x.d); }
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
  // a cage: some atom has three bonds in rings, and three of those neighbours are still joined to each other when the
  // atom is taken away. Two rings that share one atom only (as a zip leaves them) are not a cage.
  const joined = a => { const rn = nb(a).filter(b => inRing(a, b)); if (rn.length < 3) return false; const comp = new Map(); rn.forEach((s0, i) => { if (comp.has(s0)) return; const sn = new Set([s0]), st = [s0]; while (st.length) { const u = st.pop(); for (const v of nb(u)) { if (v === a || sn.has(v)) continue; sn.add(v); st.push(v); } } rn.forEach(t => { if (sn.has(t) && !comp.has(t)) comp.set(t, i); }); }); const cnt = {}; comp.forEach(v => { cnt[v] = (cnt[v] || 0) + 1; }); return Object.keys(cnt).some(k => cnt[k] >= 3); };
  const cage = rings >= 2 && hv.some(joined);
  // resonance: single bonds with a double bond on each side (C=C-C=C, C=C-C=O, and three in a benzene ring)
  const dbl = a => nbs(m, a).some(n => n.bond.order === 2), conj = m.bonds.filter(b => b.order === 1 && set.has(b.a) && set.has(b.b) && dbl(b.a) && dbl(b.b)).length;
  return { conj, ring: Math.max(0, rings - arene), arene, cage, oh: m.atoms.filter(a => !a.fly && hydroxyl(m, a)).length };
}
// ---------- the five pieces: things used on the molecule (docs/PIECES.md) ----------
// spots(m, id, limit): every place piece id can be used on m, as plain objects holding atoms of m. A piece that acts
// on the whole molecule has one spot. apply(m, id, spot): does it to m in place. Nothing here scores or animates.
//   mirror, on a bond: a single bond between two carbons that is in no ring. spot { a, b }: everything on b's side of
//     the bond is taken away and a copy of a's side, reflected, is joined on in its place by a bond from a to its copy.
//   clamp (not offered any more; the cap it puts on is kept for the wood spirit), on a part: an oxygen, or the two
//     carbons of a C=C. spot { part }: for the rest of the round no reagent and no other piece changes it.
//   crystal, on a carbon that has a hydrogen and no oxygen: spot { c }: one hydrogen becomes an OH.
//   magnet, on the whole molecule: spot { runs }: every stretch of four or more plain CH2 in a row loses all but its
//     two end carbons, which are bonded. What stood on either side of the stretch is then three carbons apart.
//   bunsen (the burner), on the whole molecule: spot { ohs }: every OH that can lose water does, all at once, and
//     leaves a C=C where it stood (the same elimination as dehydrate). The waters are returned as `leaving`.
//   Three candidates for the fifth piece (path.js RULE.fifth picks the one on offer):
//   balance, on the whole molecule: spot { ols, ones }: every OH on a carbon with a hydrogen becomes a C=O and every
//     C=O becomes an OH, at once: the hydrogens tip from one side to the other. Needs at least one of each.
//   mortar, on a bond of a ring that is not a benzene ring: spot { ra, rb }: that bond is cut and each carbon takes a hydrogen.
//   burette, on the whole molecule: spot { pairs }: every C=C outside a benzene ring becomes a C=O on the carbon with
//     fewer hydrogens, and the other carbon takes that carbon's hydrogen.
// apply takes what leaves out of the model and returns it as groups of atoms, so the page can show it going.
const heavyNb = (m, a) => nbs(m, a).map(n => n.atom).filter(b => b.el !== 'H' && !b.fly);
const sideOf = (m, a, b) => { const S = new Set([a]), st = [a]; while (st.length) { const u = st.pop(); nbs(m, u).forEach(n => { const v = n.atom; if (S.has(v) || (u === a && v === b)) return; S.add(v); st.push(v); }); } return S; };
const plainCH2 = (m, c) => c.el === 'C' && !c.fly && !c.clamp && Hs(m, c).length === 2 && heavyNb(m, c).length === 2 && heavyNb(m, c).every(q => q.el === 'C') && isSp3(m, c);
const gapRuns = m => { const seen = new Set(), out = []; m.atoms.forEach(c => { if (seen.has(c) || !plainCH2(m, c)) return; const run = [c]; seen.add(c); for (let end = 0; end < 2; end++) for (let cur = c, prev = null; ;) { const nx = heavyNb(m, cur).find(q => q !== prev && !seen.has(q) && plainCH2(m, q)); if (!nx) break; seen.add(nx); if (end) run.unshift(nx); else run.push(nx); prev = cur; cur = nx; if (run.length > 40) break; } if (run.length >= 4 && !run.some(q => ringAtom(m, q))) out.push(run); }); return out; };
// the C=C the burner can change, each as [the carbon that gets the O, the other carbon]
const burnPairs = m => { const ar = aromaticAtoms(m), out = []; m.bonds.forEach(k => { if (k.order !== 2 || k.a.el !== 'C' || k.b.el !== 'C' || k.a.fly || k.b.fly || k.a.clamp || k.b.clamp || (ar.has(k.a) && ar.has(k.b))) return; const ha = Hs(m, k.a).length, hb = Hs(m, k.b).length; let cx = ha <= hb ? k.a : k.b, ch = cx === k.a ? k.b : k.a; if (Hs(m, cx).length > 1 || nbs(m, cx).some(n => n.atom !== ch && n.bond.order > 1)) return; if (!Hs(m, cx).length) { if (Hs(m, ch).length !== 1) return; const t = cx; cx = ch; ch = t; } out.push([cx, ch]); }); return out; };
const lk = a => !!(a.clamp || a.prot || a.cure);   // a locked atom: out of reach of every instrument too
const tools = {
  spots(m, id, limit) {
    const out = [];
    if (id === 'mirror') m.bonds.forEach(k => { if (k.order !== 1 || k.a.el !== 'C' || k.b.el !== 'C' || k.a.fly || k.b.fly || lk(k.a) || lk(k.b) || ringBond(m, k.a, k.b)) return; [[k.a, k.b], [k.b, k.a]].forEach(q => { let n = 0; sideOf(m, q[0], q[1]).forEach(x => { if (x.el !== 'H') n++; }); if (n >= 3 && (!limit || 2 * n <= limit - 6)) out.push({ a: q[0], b: q[1], n }); }); });
    else if (id === 'clamp') { m.atoms.forEach(o => { if (o.el === 'O' && !o.fly && !lk(o)) out.push({ part: [o] }); }); const ar = aromaticAtoms(m); m.bonds.forEach(k => { if (k.order === 2 && k.a.el === 'C' && k.b.el === 'C' && !lk(k.a) && !(ar.has(k.a) && ar.has(k.b))) out.push({ part: [k.a, k.b] }); }); }
    else if (id === 'crystal') m.atoms.forEach(c => { if (c.el === 'C' && !c.fly && !lk(c) && isSp3(m, c) && Hs(m, c).length && heavyNb(m, c).every(q => q.el === 'C')) out.push({ c }); });
    else if (id === 'magnet') { const runs = gapRuns(m); if (runs.length) out.push({ runs }); }
    else if (id === 'balance') { const ols = m.atoms.filter(o => !o.fly && !lk(o) && oxidisable(m, o)), ones = carbonyls(m).filter(q => !lk(q.o) && !q.o.fly).map(q => q.o); if (ols.length && ones.length) out.push({ ols, ones }); }
    else if (id === 'mortar') { const ar = aromaticAtoms(m); m.bonds.forEach(k => { if (k.order !== 1 || k.a.el !== 'C' || k.b.el !== 'C' || k.a.fly || k.b.fly || lk(k.a) || lk(k.b) || (ar.has(k.a) && ar.has(k.b)) || !ringBond(m, k.a, k.b)) return; out.push({ ra: k.a, rb: k.b }); }); }
    else if (id === 'burette') { const pairs = burnPairs(m); if (pairs.length) out.push({ pairs }); }
    else if (id === 'bunsen') { const ohs = m.atoms.filter(o => o.el === 'O' && !o.fly && !lk(o) && eliminable(m, o)); if (ohs.length) out.push({ ohs }); }
    return out;
  },
  // the atoms a spot is drawn at, on the molecule as it stands; and those of them that will be gone
  at(sp) { return sp.ohs ? sp.ohs : sp.ols ? sp.ols.concat(sp.ones) : sp.ra ? [sp.ra, sp.rb] : sp.runs ? [].concat.apply([], sp.runs) : sp.pairs ? [].concat.apply([], sp.pairs) : sp.b ? [sp.a, sp.b] : sp.part || [sp.c]; },
  apply(m, id, sp) { const res = tools.act(m, id, sp); if (res && res.leaving) res.leaving.forEach(grp => grp.forEach(a => m.removeAtom(a))); return res; },
  act(m, id, sp) {
    if (id === 'mirror') {
      const a = sp.a, b = sp.b, gone = sideOf(m, b, a), keep = Array.from(sideOf(m, a, b)); gone.forEach(x => m.removeAtom(x));
      let ux = b.x - a.x, uy = b.y - a.y, uz = b.z - a.z; const d = Math.hypot(ux, uy, uz) || 1; ux /= d; uy /= d; uz /= d;
      const copy = new Map(); keep.forEach(x => { const t = 2 * ((a.x + ux * 0.77 - x.x) * ux + (a.y + uy * 0.77 - x.y) * uy + (a.z + uz * 0.77 - x.z) * uz), c = m.addAtom(x.el, x.x + t * ux, x.y + t * uy, x.z + t * uz); if (x.iso) c.iso = x.iso; if (x.clamp) c.clamp = true; if (x.prot) c.prot = true; if (x.cure) c.cure = true; if (x.frz) c.frz = true; copy.set(x, c); });
      m.bonds.slice().forEach(k => { if (copy.has(k.a) && copy.has(k.b)) m.bonds.push({ a: copy.get(k.a), b: copy.get(k.b), order: k.order }); });
      m.bond(a, copy.get(a)); return { made: Array.from(copy.values()) };
    }
    if (id === 'clamp') { sp.part.forEach(a => { a.clamp = true; }); return { made: sp.part }; }
    if (id === 'crystal') { const h = Hs(m, sp.c)[0]; if (!h) return null; cut(m, sp.c, h); const o = attach(m, 'O', sp.c, 2.8); m.bond(o, h); return { made: [o] }; }
    if (id === 'magnet') { const made = []; sp.runs.forEach(run => { run.slice(1, -1).forEach(c => { Hs(m, c).forEach(h => m.removeAtom(h)); m.removeAtom(c); }); m.bond(run[0], run[run.length - 1]); made.push(run[0], run[run.length - 1]); }); return { made }; }
    if (id === 'balance') { const ols = sp.ols.map(o => oxidisable(m, o)).filter(Boolean), ones = sp.ones.map(o => carbonyls(m).find(q => q.o === o)).filter(Boolean); if (!ols.length || !ones.length) return null;
      ols.forEach(q => { const hc = Hs(m, q.c)[0]; m.removeAtom(hc); m.removeAtom(q.ho); m.bond(q.c, q.o); }); ones.forEach(q => reduceCO(m, q)); return { made: ols.map(q => q.o).concat(ones.map(q => q.o)) }; }
    if (id === 'mortar') { const k = m.findBond(sp.ra, sp.rb); if (!k || k.order !== 1) return null; cut(m, sp.ra, sp.rb); attach(m, 'H', sp.ra, 2.2); attach(m, 'H', sp.rb, 2.2); return { made: [sp.ra, sp.rb] }; }
    if (id === 'burette') { const made = []; sp.pairs.forEach(q => { const cx = q[0], ch = q[1], k = m.findBond(cx, ch); if (!k || k.order !== 2) return; const hx = Hs(m, cx)[0]; if (!hx) return; k.order = 1; cut(m, cx, hx); m.bond(ch, hx); const o = attach(m, 'O', cx, 2.8); m.bond(cx, o); made.push(o); }); return { made }; }
    if (id === 'bunsen') { const made = [], leaving = []; sp.ohs.forEach(o => { const q = eliminable(m, o); if (!q) return; const hb = Hs(m, q.beta)[0]; cut(m, q.c, q.o); cut(m, q.beta, hb); m.bond(q.o, hb); m.bond(q.c, q.beta); made.push(q.c, q.beta); leaving.push([q.o, q.ho, hb]); }); return made.length ? { made, leaving } : null; }
    return null;
  }
};
// ---------- what five of the homunculi do to the molecule (path.js HOMS, docs/HOMUNCULI.md) ----------
//   acid: every stretch of four or more plain CH2 is eaten down to three, and from then on a ring closes across up to
//     six carbons (m.reach, carried by copies of the molecule).
//   salt: one C=O is cured (cure on its carbon and oxygen).
//   slime: two carbons are stuck together by two carbons of slime, so they count as three apart.
//   seedling: an arm grows from one carbon, three carbons and one C=O for each of `arms`.
const homs = {
  acidRuns: m => gapRuns(m),
  acid(m, reach) { const made = []; gapRuns(m).forEach(run => { const keep = run[run.length - 2]; run.slice(1, -2).forEach(c => { Hs(m, c).forEach(h => m.removeAtom(h)); m.removeAtom(c); }); m.bond(run[0], keep); made.push(run[0], keep); }); m.reach = reach || 6; return { made }; },
  saltSpots(m) { return carbonyls(m).filter(k => !k.c.cure && !k.c.fly).map(k => ({ c: k.c, o: k.o })); },
  salt(m, sp) { if (!sp.c || !sp.o || sp.c.cure) return null; sp.c.cure = true; sp.o.cure = true; return { made: [sp.o] }; },
  // pairs that would let an OH reach a C=O it cannot reach now: one carbon at or beside the OH's carbon, one at or
  // beside the C=O's carbon, three apart once stuck
  slimeSpots(m) {
    const ar = aromaticAtoms(m), R = m.reach || MODE.reach || 4, ohC = [], out = [], seen = new Set(), free = c => c.el === 'C' && !c.fly && !c.slime && isSp3(m, c) && Hs(m, c).length > 0;
    m.atoms.forEach(o => { if (o.fly || o.el !== 'O') return; const s = hydroxylAny(m, o, ar); if (s && !ohC.includes(s.c)) ohC.push(s.c); });
    const ks = carbonyls(m).filter(k => !k.c.fly); if (!ohC.length || !ks.length) return [];
    ohC.forEach(c0 => { const d0 = carbonDist(m, c0, 60); ks.forEach(k => { const dk = d0.get(k.c); if (dk != null && dk <= R) return;
      const A = [c0].concat(carbonsOf(m, c0)), B = [k.c].concat(carbonsOf(m, k.c));
      A.forEach((a, i) => B.forEach((b, j) => { if ((i ? 1 : 0) + (j ? 1 : 0) > 1 || a === b || !free(a) || !free(b)) return; const dab = d0.get(b) == null ? 99 : carbonDist(m, a, 60).get(b); if (dab != null && dab < 4) return; const key = m.atoms.indexOf(c0) + ':' + m.atoms.indexOf(k.c); if (seen.has(key)) return; seen.add(key); out.push({ a, b, c: k.c, o: k.o }); })); }); });
    return out;
  },
  slime(m, sp) { const a = sp.a, b = sp.b, ha = a && Hs(m, a)[0], hb = b && Hs(m, b)[0]; if (!ha || !hb || a === b) return null; m.removeAtom(ha); m.removeAtom(hb);
    const at = t => m.addAtom('C', a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t + 0.4, a.z + (b.z - a.z) * t), x1 = at(0.33), x2 = at(0.67); x1.slime = true; x2.slime = true; m.bond(a, x1); m.bond(x1, x2); m.bond(x2, b);
    [x1, x2].forEach(c => { attach(m, 'H', c, 2.2); attach(m, 'H', c, 2.2); }); return { made: [x1, x2] }; },
  seedSpots(m) { const ar = aromaticAtoms(m), out = [], add = c => { if (c.el === 'C' && !c.fly && !c.slime && isSp3(m, c) && Hs(m, c).length && !out.includes(c)) out.push(c); };
    m.atoms.forEach(o => { if (o.fly || o.el !== 'O') return; const s = hydroxylAny(m, o, ar); if (!s) return; add(s.c); carbonsOf(m, s.c).forEach(add); }); return out.map(c => ({ c })); },
  seed(m, sp, arms) { const h = sp.c && Hs(m, sp.c)[0]; if (!h) return null; m.removeAtom(h); const spec = []; for (let k = 0, n = arms || 2; k < n; k++) spec.push([2, 1, ''], [2, 1, ''], [k === n - 1 ? 1 : 0, 1, '=O']); const r = grow(m, sp.c, spec); r.made.forEach(a => { a.seed = true; }); return { made: r.made }; },
  // an OH that oxidize would take at the very end of a chain (CH2-OH): what feeds the salt
  endOls: m => m.atoms.filter(o => { const s = !o.fly && oxidisable(m, o); return !!s && Hs(m, s.c).length === 2; })
};
AA.rx = { ENG, homs, tools, MODE, reopen, shapeOf, aromaticAtoms, LIST, CARDS, sigOf, probe, describe, nameOf, label, cloneModel, cloneMap, runCard, fromSmiles, keepable };
})(typeof globalThis !== 'undefined' ? globalThis : window);
