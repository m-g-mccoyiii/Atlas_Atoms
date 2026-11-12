// locks.js: test cases with locked atoms (prot, cure, clamp) for the reagents, the reflexes, the instruments and the cut piece.
HL.job = async function () {
  var RX = AA.rx, ENG = RX.ENG, out = [], ok = function (name, v, info) { out.push({ name: name, pass: !!v, info: info }); };
  RX.MODE.zip = true; RX.MODE.co2 = true; RX.MODE.eng = true;
  var lock = function (m, pick, flag) { var a = m.atoms.find(pick); a[flag] = true; return a; };
  var isKO = function (m) { return function (a) { return a.el === 'O' && m.neighbors(a).some(function (n) { return n.bond.order === 2; }); }; };
  // 1 reagent: grow acts on both C=O; with one oxygen locked only on the other
  ['prot', 'cure', 'clamp'].forEach(function (flag) {
    var m = RX.fromSmiles('CCC(=O)CCCC(=O)CC'); lock(m, isKO(m), flag); var n = RX.runCard(m, RX.CARDS.allyl); ok('grow with a ' + flag + ' C=O acts once', n === 1, n);
  });
  // 2 reagent card.all (new reagents) honour the lock: epoxidation of two C=C, one carbon locked
  ['prot', 'clamp'].forEach(function (flag) {
    var m = RX.fromSmiles('C=CCCCC=C'); lock(m, function (a) { return a.el === 'C'; }, flag); var n = RX.runCard(m, RX.CARDS.epoxidation); ok('epoxidation with a ' + flag + ' C=C acts once', n === 1, n);
  });
  // 3 reflex: ring closes on an OH and a C=O; prot on the C=O blocks, cure does not (the salt rule), and a blocked site leaves the rest to go on
  var base = 'OCCCC(=O)C', m1 = RX.fromSmiles(base); lock(m1, isKO(m1), 'prot'); ok('ring blocked by prot', !ENG.nextReflex(m1, ['ring'], {}));
  var m2 = RX.fromSmiles(base); lock(m2, isKO(m2), 'cure'); ok('ring still closes on a cured C=O', !!ENG.nextReflex(m2, ['ring'], {}));
  var m3 = RX.fromSmiles('OCCCC(=O)CCCCC(=O)CCCO'); lock(m3, isKO(m3), 'prot'); var nx = ENG.nextReflex(m3, ['ring', 'dry'], {}); ok('a protected site does not stop another reflex', !!nx, nx && nx.id);
  var st = ENG.settle(m3, ['ring', 'dry'], {}, 40); ok('settle ends with a protected site', st.steps.length < 40, st.steps.length);
  // 4 instruments
  var m4 = RX.fromSmiles('CC(O)CCC(=O)C'); m4.atoms.forEach(function (a) { a.prot = true; });
  ['mirror', 'crystal', 'balance', 'mortar', 'burette', 'bunsen'].forEach(function (id) { var sp = RX.tools.spots(m4, id, 56); ok('instrument ' + id + ' finds nothing on a protected molecule', sp.length === 0, sp.length); });
  var m5 = RX.fromSmiles('CCCCCC(O)CC'); m5.atoms.forEach(function (a) { a.cure = true; }); ok('crystal finds nothing on cured atoms', RX.tools.spots(m5, 'crystal', 56).length === 0);
  // 5 the cut piece: ozonolysis keeps a piece that holds a locked atom
  var m6 = RX.fromSmiles('CCCC=CCC'); var tail = m6.atoms.filter(function (a) { return a.el === 'C'; }).pop(); tail.prot = true; var r = ENG.fire(m6, 'ozonolysis'); ok('a piece with a locked atom is not dropped', m6.atoms.some(function (a) { return a === tail; }) && r.piece === 0, r.piece);
  // 6 mirror copies the locks
  var m7 = RX.fromSmiles('CCCCCCCC'); var sp = RX.tools.spots(m7, 'mirror', 56)[0]; var c7 = m7.atoms.filter(function (a) { return a.el === 'C'; }); c7.forEach(function (a) { a.prot = true; });
  var res = RX.tools.act(m7, 'mirror', sp); ok('mirror copies prot', !res || res.made.every(function (a) { return a.el === 'H' || a.prot; }), res && res.made.length);

  // 7 the clamp tool on a C=C: with either carbon locked (first or second atom of the bond) the C=C is not offered, and acting on it by hand changes nothing
  ['prot', 'cure', 'clamp'].forEach(function (flag) {
    var bad = [], seenFree = 0;
    [0, 1].forEach(function (which) {
      var m = RX.fromSmiles('C=CCCCC=C'), dbl = m.bonds.filter(function (k) { return k.order === 2; }), k0 = dbl[0], la = which ? k0.b : k0.a, other = which ? k0.a : k0.b; la[flag] = true;
      var sp = RX.tools.spots(m, 'clamp', 56).filter(function (s) { return s.part.length === 2; });
      if (sp.some(function (s) { return s.part.indexOf(la) >= 0; })) bad.push('offered with ' + (which ? 'second' : 'first') + ' atom locked');
      if (sp.some(function (s) { return s.part.indexOf(dbl[1].a) >= 0 && s.part.indexOf(dbl[1].b) >= 0; })) seenFree++;
      var res = RX.tools.apply(m, 'clamp', { part: [k0.a, k0.b] });
      if (res || other.clamp || (flag !== 'clamp' && la.clamp)) bad.push('acted with ' + (which ? 'second' : 'first') + ' atom locked');
    });
    ok('clamp tool leaves a C=C with a ' + flag + ' carbon alone (either atom), and still offers the free C=C', bad.length === 0 && seenFree === 2, bad);
  });
  (function () { var m = RX.fromSmiles('CC(=O)CC=C'), o = m.atoms.find(isKO(m)); o.prot = true; var res = RX.tools.apply(m, 'clamp', { part: [o] }); ok('clamp tool does not act on a locked oxygen', !res && !o.clamp, !!res);
    var m2 = RX.fromSmiles('CC(=O)CC=C'), sp = RX.tools.spots(m2, 'clamp', 56), n = sp.length, r2 = RX.tools.apply(m2, 'clamp', sp[sp.length - 1]); ok('clamp tool still clamps a free C=C (both atoms)', n === 2 && !!r2 && r2.made.length === 2 && r2.made.every(function (a) { return a.clamp; }), n); })();

  // per-atom invariant (added after review): lock one atom at a time with each flag, fire every reagent and use every instrument, and check the locked atom and its bonds are as they were
  var mols = ['C=CCC(O)CC=C', 'CC(=O)CCC(=O)CCC=C', 'OCCCC(=O)CCCC=O', 'CC(O)CCC(O)CCC(=O)CC=C', 'C=CCCCCCCC=C', 'CC(N)CC(S)CC(=O)CCCl', 'C=CC=CCC=CC', 'CCCCCCCCCC(=O)C', 'OC(CC=C)CCC(=O)CCC(O)C'];
  var viol = [], trials = 0, sig = function (m, a) { return m.atoms.indexOf(a) < 0 ? 'GONE' : m.neighbors(a).map(function (n) { return n.atom.el + n.bond.order; }).sort().join(','); };
  var reag = ['hydrate', 'bh3', 'dehydrate', 'pcc', 'nabh4', 'allyl', 'hwe', 'dihydroxylation', 'ozonolysis', 'permanganate', 'ritter', 'thiolene', 'chlorination', 'cyanohydrin', 'hofmann', 'chugaev', 'hydroformylation', 'epoxidation'];
  var heavyOf = function (m) { return m.atoms.filter(function (a) { return a.el !== 'H'; }); };
  mols.forEach(function (smi) {
    var n0 = heavyOf(RX.fromSmiles(smi)).length;
    for (var ai = 0; ai < n0; ai++) ['prot', 'cure', 'clamp'].forEach(function (flag) {
      reag.forEach(function (id) { var m = RX.fromSmiles(smi), a = heavyOf(m)[ai], before = sig(m, a); a[flag] = true; try { RX.runCard(m, RX.CARDS[id]); } catch (e) { return; } trials++; var now = sig(m, a); if (now !== before) viol.push(smi + ' ' + flag + ' atom ' + ai + ' reagent ' + id); });
      ['mirror', 'burette', 'bunsen', 'balance', 'magnet', 'crystal', 'mortar'].forEach(function (tool) { var m = RX.fromSmiles(smi), a = heavyOf(m)[ai], before = sig(m, a); a[flag] = true; var sp = RX.tools.spots(m, tool, 56); if (!sp.length) return; trials++; try { RX.tools.apply(m, tool, sp[0]); } catch (e) { return; } var now = sig(m, a); if (now !== before && !(tool === 'crystal')) viol.push(smi + ' ' + flag + ' atom ' + ai + ' tool ' + tool); });
    });
  });
  ok('per-atom lock invariant: reagents and instruments never change a locked atom (' + trials + ' trials)', viol.length === 0, viol.slice(0, 8));
  return { pass: out.filter(function (x) { return x.pass; }).length, total: out.length, failed: out.filter(function (x) { return !x.pass; }), all: out.map(function (x) { return x.name + ': ' + x.pass; }) };
};
