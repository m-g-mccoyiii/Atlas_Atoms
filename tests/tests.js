(function () {
'use strict';
const AA = window.AA, C = AA.chem, E = AA.ELEMENTS, Model = AA.Model;
const out = document.getElementById('out');
let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; out.insertAdjacentHTML('beforeend', '<span class="pass">PASS</span> ' + name + '\n'); }
  catch (e) { fail++; out.insertAdjacentHTML('beforeend', '<span class="fail">FAIL</span> ' + name + ' -- ' + e.message + '\n'); }
}
function eq(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' expected ' + b + ' got ' + a); }
function near(a, b, tol, msg) { if (Math.abs(a - b) > tol) throw new Error((msg || '') + ' expected ' + b + '±' + tol + ' got ' + a.toFixed(1)); }
function angle(c, a, b) {
  const u = [a.x - c.x, a.y - c.y, a.z - c.z], v = [b.x - c.x, b.y - c.y, b.z - c.z];
  const d = u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  return Math.acos(d / (Math.hypot(...u) * Math.hypot(...v))) * 180 / Math.PI;
}

const lib = C.library();

test('formulas of known molecules', () => {
  const want = { water: 'H2O', co2: 'CO2', methane: 'CH4', ammonia: 'NH3', salt: 'NaCl', hcl: 'HCl', glucose: 'C6H12O6',
    vitc: 'C6H8O6', vanillin: 'C8H8O3', h2so4: 'H2SO4', h3po4: 'H3PO4', glycine: 'C2H5NO2', ethanol: 'C2H6O', benzene: 'C6H6', so2: 'SO2', peroxide: 'H2O2' };
  for (const id in want) eq(lib.byId.get(id).formula, want[id], id);
});
test('molecule ids and signatures are unique', () => {
  eq(new Set(lib.list.map(m => m.id)).size, lib.list.length, 'ids');
  eq(new Set(lib.list.map(m => m.sig)).size, lib.list.length, 'signatures');
});
test('every atom in every molecule has an allowed valence', () => {
  for (const m of AA.MOLECULES) {
    const g = C.parseSmiles(m.smiles), sums = g.atoms.map(() => 0);
    g.bonds.forEach(b => { sums[b.a] += b.order; sums[b.b] += b.order; });
    g.atoms.forEach((a, i) => { if (!E[a.el].valences.includes(sums[i])) throw new Error(m.id + ': ' + a.el + ' has ' + sums[i] + ' bonds'); });
  }
});
test('benzene matches either Kekule arrangement', () => {
  const a = C.parseSmiles('C1=CC=CC=C1'), b = C.parseSmiles('C1CC=CC=C1'.replace('C1CC', 'C1=CC')); // same ring, same pattern
  eq(C.signature(a.atoms.map(x => x.el), a.bonds), lib.byId.get('benzene').sig);
  eq(b.atoms.length, 12);
});
test('Model.analyze recognises a hand-built water molecule', () => {
  const m = new Model(), o = m.addAtom('O'), h1 = m.addAtom('H'), h2 = m.addAtom('H');
  m.bond(o, h1); m.bond(o, h2);
  const c = m.analyze();
  eq(c.length, 1); eq(c[0].mol && c[0].mol.id, 'water');
});
test('valence limits are enforced', () => {
  const m = new Model(), o = m.addAtom('O'), a = m.addAtom('H'), b = m.addAtom('H'), c = m.addAtom('H');
  m.bond(o, a); m.bond(o, b);
  eq(m.canBond(o, c), false, 'third bond on O');
  const n1 = m.addAtom('N'), n2 = m.addAtom('N');
  m.bond(n1, n2); m.bond(n1, n2); m.bond(n1, n2);
  eq(m.canBond(n1, n2), false, 'fourth bond');
  eq(m.analyze().filter(x => x.mol && x.mol.id === 'nitrogen').length, 1);
});
test('same atoms, different arrangement is flagged (isomers)', () => {
  const m = new Model(), c1 = m.addAtom('C'), c2 = m.addAtom('C'), o = m.addAtom('O');
  m.bond(c1, o); m.bond(o, c2);   // dimethyl ether skeleton
  for (let i = 0; i < 3; i++) { m.bond(c1, m.addAtom('H')); m.bond(c2, m.addAtom('H')); }
  const c = m.analyze()[0];
  eq(c.formula, 'C2H6O'); eq(c.mol, null); eq(c.sameFormula && c.sameFormula.id, 'ethanol');
});
test('reactions conserve atoms', () => {
  const count = side => { const t = {}; for (const id in side) for (const el in lib.byId.get(id).counts) t[el] = (t[el] || 0) + side[id] * lib.byId.get(id).counts[el]; return t; };
  const norm = o => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]]));
  for (const rx of AA.REACTIONS) eq(norm(count(rx.reactants)), norm(count(rx.products)), rx.id);
});
test('reaction molecules all exist', () => {
  for (const rx of AA.REACTIONS) Object.keys(Object.assign({}, rx.reactants, rx.products)).forEach(id => { if (!lib.byId.has(id)) throw new Error(rx.id + ' uses missing ' + id); });
});
test('relaxed geometry: bond lengths close to ideal for every molecule', () => {
  for (const m of lib.list) {
    const mod = Model.fromSmilesRelaxed(m.smiles, 5);
    let worst = 0;
    mod.bonds.forEach(b => { worst = Math.max(worst, Math.abs(Math.hypot(b.a.x - b.b.x, b.a.y - b.b.y, b.a.z - b.b.z) - C.bondRest(b.a.el, b.b.el, b.order))); });
    if (worst > 0.2) throw new Error(m.id + ' worst bond error ' + worst.toFixed(2) + ' A');
  }
});
test('relaxed shapes: water bent, CO2 linear, methane tetrahedral, ammonia pyramid', () => {
  const w = Model.fromSmilesRelaxed('O', 3), o = w.atoms[0];
  near(angle(o, w.atoms[1], w.atoms[2]), 104.5, 6, 'water');
  const c = Model.fromSmilesRelaxed('O=C=O', 3);
  near(angle(c.atoms[1], c.atoms[0], c.atoms[2]), 180, 10, 'CO2');
  const me = Model.fromSmilesRelaxed('C', 3);
  near(angle(me.atoms[0], me.atoms[1], me.atoms[2]), 109.5, 6, 'CH4');
  const n = Model.fromSmilesRelaxed('N', 3);
  near(angle(n.atoms[0], n.atoms[1], n.atoms[2]), 107, 6, 'NH3');
});
test('benzene ring is flat', () => {
  const b = Model.fromSmilesRelaxed('C1=CC=CC=C1', 5);
  const cs = b.atoms.filter(a => a.el === 'C');
  const p0 = cs[0], p1 = cs[1], p2 = cs[2];
  const u = [p1.x - p0.x, p1.y - p0.y, p1.z - p0.z], v = [p2.x - p0.x, p2.y - p0.y, p2.z - p0.z];
  const n = AA.v3.norm(AA.v3.cross(u, v));
  cs.forEach(a => { const d = Math.abs((a.x - p0.x) * n[0] + (a.y - p0.y) * n[1] + (a.z - p0.z) * n[2]); if (d > 0.25) throw new Error('out of plane by ' + d.toFixed(2)); });
});

test('every lesson has a quiz with 2 sensible questions', () => {
  AA.LESSONS.forEach((L, i) => eq(L.n, i + 1, 'lesson numbering at position ' + i));
  if (AA.LESSONS.length < 31) throw new Error('lessons went missing');
  for (const L of AA.LESSONS) {
    const q = AA.QUIZZES[L.n];
    if (!q || q.length < 2) throw new Error('lesson ' + L.n + ' has no quiz');
    q.forEach(x => {
      if (x.wrong.includes(x.right)) throw new Error('lesson ' + L.n + ': right answer also listed as wrong');
      if (new Set(x.wrong.concat(x.right)).size !== 3) throw new Error('lesson ' + L.n + ': duplicate choices');
      if (!x.why) throw new Error('lesson ' + L.n + ': missing explanation');
    });
  }
});
test('lesson completion rules point at real molecules and reactions', () => {
  const ids = new Set(AA.MOLECULES.map(m => m.id)), rx = new Set(AA.REACTIONS.map(r => r.id));
  for (const L of AA.LESSONS) {
    const d = L.done || {};
    [].concat(d.found || [], d.foundAll || []).forEach(id => { if (!ids.has(id)) throw new Error('lesson ' + L.n + ' needs missing molecule ' + id); });
    [].concat(d.lab || [], d.labAll || []).forEach(k => { if (!['1s', '2s', '2p', '2p3', 'sp3', 'pi', 'mo', 'sigmastar', 'he2', 'explore', 'orbitals', 'rxn', 'rxn_react', 'rxn_hot', 'rxn_cat', 'rxn_dh', 'rxn_ea'].includes(k)) throw new Error('lesson ' + L.n + ' needs unknown lab step ' + k); });
    [].concat(d.reacted || [], d.reactedAny || []).forEach(id => { if (!rx.has(id)) throw new Error('lesson ' + L.n + ' needs missing reaction ' + id); });
  }
});

test('every molecule has Molecule Lab info and sensible facts', () => {
  for (const m of lib.list) {
    const i = AA.MOLINFO[m.id];
    if (!i || !i.shape || !i.state) throw new Error(m.id + ' missing shape/state');
  }
  near(AA.molarMass(lib.byId.get('water').counts), 18.015, 0.02, 'water mass');
  near(AA.molarMass(lib.byId.get('glucose').counts), 180.16, 0.05, 'glucose mass');
  const b = AA.bondTally(AA.MOLECULES.find(x => x.id === 'co2').smiles);
  eq(b.double, 2, 'CO2 double bonds'); eq(b.single, 0, 'CO2 single bonds');
  eq(AA.bondTally(AA.MOLECULES.find(x => x.id === 'salt').smiles).ionic, 1, 'salt ionic');
});

test('every molecule is linked to a verified PubChem compound and Wikipedia article', () => {
  for (const m of lib.list) {
    const r = AA.REAL && AA.REAL[m.id];
    if (!r || !r.pubchem || !r.pubchem.cid) throw new Error(m.id + ' has no PubChem link');
    const f = {}; (r.pubchem.formula.match(/[A-Z][a-z]?\d*/g) || []).forEach(t => { const el = t.match(/[A-Z][a-z]?/)[0], n = parseInt(t.slice(el.length) || '1', 10); f[el] = (f[el] || 0) + n; });
    eq(JSON.stringify(Object.keys(f).sort().map(k => [k, f[k]])), JSON.stringify(Object.keys(m.counts).sort().map(k => [k, m.counts[k]])), m.id + ' formula vs PubChem');
    if (!r.wikipedia || !/^https:\/\/en\.wikipedia\.org\/wiki\//.test(r.wikipedia.url)) throw new Error(m.id + ' has no Wikipedia link');
  }
});
test('toSmiles round-trips every molecule (so PubChem lookups send the right structure)', () => {
  for (const m of lib.list) {
    const comp = Model.fromSmiles(m.smiles, 3).analyze()[0];
    const smi = AA.real.toSmiles(comp.atoms, comp.bonds), g = C.parseSmiles(smi);
    eq(C.signature(g.atoms.map(a => a.el), g.bonds), m.sig, m.id + ' via ' + smi);
  }
});

test('badges: unique, none for a new player, all for a finished one', () => {
  eq(new Set(AA.BADGES.map(b => b.id)).size, AA.BADGES.length, 'unique badge ids');
  AA.LESSON_UNITS.forEach((u, i) => { if (!AA.BADGES.some(b => b.id === 'unit-' + (i + 1))) throw new Error('no badge for unit ' + (i + 1)); });
  eq(AA.earnedBadges({ found: {}, lessons: {}, quiz: {}, reacted: {}, labSeen: {} }).length, 0, 'new player');
  const full = { found: {}, lessons: {}, quiz: {}, reacted: {}, labSeen: { explore: 1, orbitals: 1, mo: 1, rxn: 1 }, lookups: 1 };
  AA.MOLECULES.forEach(m => { full.found[m.id] = 1; }); AA.REACTIONS.forEach(r => { full.reacted[r.id] = 1; });
  AA.LESSONS.forEach(l => { full.lessons[l.n] = 1; full.quiz[l.n] = AA.QUIZZES[l.n].length; });
  eq(AA.earnedBadges(full).length, AA.BADGES.length, 'finished player earns every badge');
  const half = JSON.parse(JSON.stringify(full)); half.lessons = {}; AA.LESSONS.filter(l => l.n <= 10).forEach(l => { half.lessons[l.n] = 1; });
  const st = AA.progressStats({ found: {}, lessons: half.lessons, quiz: {}, reacted: {}, labSeen: {} });
  eq(st.lessonsDone >= 10, true, 'ten lessons counted'); eq(st.units[0].done, 10, 'unit 1 done'); eq(st.units[1].done, 0, 'unit 2 untouched');
});

test('profiles: first run, old saves, switching, backup and restore', () => {
  const mk = () => { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; };
  const P = AA.profiles;
  let s = mk(); P._useStore(s); let b = P.boot();
  eq(b.needsSetup, true, 'a brand new player is asked for a name'); eq(b.profile.name, 'Explorer');
  b.state.found.water = 123; P.save(b.state);
  b = P.boot(); eq(b.state.found.water, 123, 'progress survives a restart');
  P.update(b.profile.id, { name: '  Mia<script>  ', avatar: P.AVATARS[3], named: true });
  b = P.boot(); eq(b.profile.name, 'Miascript', 'name is cleaned'); eq(b.needsSetup, false);
  const first = b.profile.id, p2 = P.create('Leo', P.AVATARS[1]); P.switchTo(p2.id); b = P.boot();
  eq(b.profile.name, 'Leo'); eq(Object.keys(b.state.found).length, 0, 'new player starts empty');
  b.state.lessons[5] = 1; P.save(b.state);
  P.switchTo(first); b = P.boot();
  eq(b.state.lessons[5], undefined, 'players do not share progress'); eq(b.state.found.water, 123);
  const exp = JSON.stringify(P.exportProfile(b.profile.id, b.state)), imp = P.importText(exp);
  eq(imp.name === b.profile.name, false, 'a restored copy never overwrites the original'); eq(P.progressOf(imp.id).found.water, 123, 'restore brings progress back');
  ['', 'not json', '{}', JSON.stringify({ app: 'other', progress: {} })].forEach(x => { let threw = false; try { P.importText(x); } catch (e) { threw = true; } eq(threw, true, 'rejects: ' + x.slice(0, 14)); });
  const evil = P.importText('{"app":"atlas-atoms","progress":{"found":{"__proto__":1,"water":5,"x y":2,"bad":"str"},"lessons":{"3":9}},"profile":{"name":"' + 'A'.repeat(100) + '"}}');
  eq(Object.keys(P.progressOf(evil.id).found).join(','), 'water', 'junk keys and values are dropped'); eq(evil.name.length <= 20, true, 'long names are cut'); eq(({}).polluted, undefined);
  s = mk(); s.setItem('atlas-atoms-v1', JSON.stringify({ found: { water: 99 }, layout: 'phone', mute: true })); P._useStore(s); AA.PLAYER_NAME = 'Atlas'; b = P.boot();
  eq(b.state.found.water, 99, 'old single-slot progress moves into a profile'); eq(b.state.layout, 'phone'); eq(b.state.mute, true); eq(b.profile.name, 'Atlas'); eq(b.needsSetup, false);
  eq(P.remove(b.profile.id), false, 'the last profile cannot be deleted');
});

test('spectra: textbook cases come out right', () => {
  const S = AA.spectra, by = id => S.describe(AA.MOLECULES.find(m => m.id === id).smiles);
  const sig = (d, shift) => d.nmr.peaks.find(p => Math.abs(p.shift - shift) < 0.15);
  let d = by('ethanol'); eq(d.ms.M, 46, 'ethanol M');
  eq(d.nmr.peaks.length, 3, 'ethanol has 3 signals');
  let p = sig(d, 3.7); eq(p && p.hs + p.mult, '2q', 'CH2 quartet'); p = sig(d, 1.2); eq(p && p.hs + p.mult, '3t', 'CH3 triplet'); p = sig(d, 2.6); eq(p && p.hs + p.mult, '1s', 'OH singlet');
  eq(d.ir.peaks.some(x => x.centre === 3350 && x.shape === 'broad'), true, 'ethanol broad O-H');
  d = by('acetone'); eq(d.nmr.peaks.length, 1, 'acetone one signal'); eq(d.nmr.peaks[0].hs + d.nmr.peaks[0].mult, '6s', 'acetone 6H singlet');
  eq(d.ms.peaks.find(x => x.mz === 43).rel, 100, 'acetone base peak 43'); eq(d.ir.peaks.some(x => x.centre === 1715), true, 'ketone C=O');
  d = by('acetic'); eq(d.ms.M, 60); p = sig(d, 11.5); eq(p && p.hs, 1, 'acid H near 11.5'); eq(d.ir.peaks.some(x => x.shape === 'vbroad'), true, 'very broad acid O-H');
  d = by('benzene'); eq(d.ms.M, 78); eq(d.nmr.peaks.length, 1, 'benzene one signal'); eq(d.nmr.peaks[0].hs, 6);
  d = by('co2'); eq(d.ms.M, 44); eq(d.ir.peaks.some(x => x.centre === 2349), true, 'CO2 asymmetric stretch');
  d = by('nitrogen'); eq(d.ir.silent, true, 'N2 has no IR');
  d = by('ethyne'); eq(d.ir.peaks.some(x => x.centre === 2120), false, 'symmetric alkyne C-C triple bond is IR-quiet');
});
test('spectra: aspirin and glucose weigh the same but their spectra tell them apart', () => {
  const S = AA.spectra, a = S.describe(AA.MOLECULES.find(m => m.id === 'aspirin').smiles), g = S.describe(AA.MOLECULES.find(m => m.id === 'glucose').smiles);
  eq(a.ms.M, 180); eq(g.ms.M, 180, 'same nominal mass');
  eq(a.nmr.total, 8); eq(g.nmr.total, 12, 'different hydrogen counts');
  eq(a.groups.alcohol, 0); eq(g.groups.alcohol >= 4, true, 'glucose is covered in alcohols');
  eq(a.groups.acid, 1); eq(a.groups.ester, 1); eq(a.groups.aromaticRings, 1);
});
test('spectra: every molecule gets a sane spectrum', () => {
  const S = AA.spectra;
  for (const m of AA.MOLECULES) {
    const d = S.describe(m.smiles), g = AA.chem.parseSmiles(m.smiles), nH = g.atoms.filter(a => a.el === 'H').length;
    eq(d.nmr.total, nH, m.id + ' NMR integrals add up to the hydrogens');
    if (d.ms.peaks.length < 1 || !d.ms.peaks.some(x => x.rel === 100)) throw new Error(m.id + ' MS has no base peak');
    d.ms.peaks.forEach(x => { if (x.rel < 1 || x.rel > 100 || x.mz < 1) throw new Error(m.id + ' bad MS peak ' + x.mz); });
    let M = 0; g.atoms.forEach(a => { M += S.NOMINAL[a.el]; }); eq(d.ms.M, M, m.id + ' molecular ion');
    if (!d.ir.silent && d.ir.peaks.length === 0) throw new Error(m.id + ' has no IR peaks and is not marked silent');
    d.nmr.peaks.forEach(p => { if (!(p.shift > -1 && p.shift < 13)) throw new Error(m.id + ' shift out of range ' + p.shift); });
  }
});

test('spectra: comparison separates real answers from near misses', () => {
  const S = AA.spectra, d = id => S.describe(AA.MOLECULES.find(m => m.id === id).smiles), eth = d('ethanol'), dme = S.describe('COC');
  const same = S.compare(eth, eth); eq(same.ms > 0.999 && same.ir > 0.999 && same.nmr > 0.999, true, 'a spectrum matches itself');
  const near = S.compare(eth, dme); eq(near.ms > 0.3, true, 'same mass gives some MS overlap'); eq(near.nmr < 0.7 && near.ir < 0.8, true, 'isomers differ in NMR and IR');
  for (const m of AA.MOLECULES) { const x = S.describe(m.smiles), q = S.degrade(x), c = S.compare(q, x); eq(c.nmr > 0.9, true, m.id + ' quick scan still matches its own NMR'); }
  const g = AA.chem.parseSmiles('CCO'); const viaGraph = S.describeGraph(g.atoms, g.bonds); eq(viaGraph.ms.M, 46, 'describeGraph agrees with describe');
});

document.getElementById('summary').innerHTML = '<h2 class="' + (fail ? 'fail' : 'pass') + '">' + pass + ' passed, ' + fail + ' failed</h2>';
document.title = (fail ? 'FAIL ' : 'PASS ') + pass + '/' + (pass + fail);
})();
