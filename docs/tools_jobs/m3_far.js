// m3_far.js: do the readings made without a live round hold the across-the-fold reflex kinds a real round holds (from round 4)?
// round=6 n=30 [all=1: the run holds every reflex] [from=0 to=10: molecules by index] [only=28] [quick=1: no proof, no offers]
// For n pool molecules of the round: REAL = synBegin for a run in that round, every line of three of the dealt hand fired on page 1
// (each on a fresh round), the reflex kinds made read from g.trail. EASE = P.easeOf(run, molecule) (the reading that compares the two
// molecules offered). PROOF = P.specPick with the run (the spec proof: specPick -> reach -> specPlay). BRIEFS = P.runBriefs(run)
// (easeOf and specFor as the game calls them). The engine's nextReflex and settle are wrapped to record the held list they are
// given and the kinds they return. Pass: wherever REAL makes an across kind, EASE makes it too, and every call holds the across kinds.
HL.job = async function (q) {
  var P = AA.rxPath, RX = AA.rx, ENG = RX.ENG, round = +(q.round || 6), n = +(q.n || 30), FAR = ENG.FAR_IDS, isFar = function (k) { return FAR.indexOf(k) >= 0; };
  var cur = null, o1 = ENG.nextReflex, o2 = ENG.settle;
  var note = function (held, ks) { if (!cur) return; cur.calls++; if (held.some(isFar)) cur.withFar++; (ks || []).forEach(function (k) { cur.kinds[k] = (cur.kinds[k] || 0) + 1; }); };
  ENG.nextReflex = function (m, held, cnt, G0) { var r = o1.call(ENG, m, held, cnt, G0); note(held, r ? [r.id] : []); return r; };
  ENG.settle = function (m, held, cnt, budget) { var r = o2.call(ENG, m, held, cnt, budget); note(held, r.steps); return r; };
  var fresh = function () { return { calls: 0, withFar: 0, kinds: {} }; }, farOf = function (o) { return Object.keys(o).filter(isFar).sort(); };
  var inR = function (s) { return (P.FEED_ROUNDS[s] || []).indexOf(round) >= 0; }, mols = P.FEEDS.filter(function (s) { return !P.FEED_BANK[s] && inR(s); }).concat(P.FEEDS.filter(function (s) { return P.FEED_BANK[s] && inR(s); })).slice(0, n).map(function (s, j) { return [s, j]; }).filter(function (x) { return (q.only == null || +q.only === x[1]) && x[1] >= +(q.from || 0) && x[1] < +(q.to || 1e9); }), rows = [];   // only=<index>: one molecule; quick=1: no proof and no offers. The pool molecules of the round (24), then bank ones up to n
  var mkRun = function () { var run = P.runNew(0, []); run.round = round; if (q.all === '1') run.self = P.SELF.map(function (x) { return x.id; }); P.modeSync(run); return run; };
  try {
    for (var i = 0; i < mols.length; i++) {
      var smi = mols[i][0], ix = mols[i][1], run = mkRun(), row = { mol: smi };
      // REAL
      var begin = function () { P.seed(4000 + ix); return P.synBegin(P.salt(P.modelOf(smi), P.rand), false, P.rand, [], run); };
      var g0 = begin(), hand = g0.kinds.slice(), lines = [], real = {}; row.realHeld = g0.self.filter(isFar).length;
      hand.forEach(function (a) { hand.forEach(function (b) { hand.forEach(function (c) { var l = [a, b, c], okl = l.every(function (id) { return l.filter(function (x) { return x === id; }).length <= (g0.left[id] || 0); }); if (okl) lines.push(l); }); }); });
      lines.forEach(function (l) { var g = begin(); l.forEach(function (id) { P.queueAdd(g, id); }); while (g.queue.length && !g.over) P.queueStep(g); g.trail.forEach(function (t) { var k = t.free && ENG.KIND[t.id]; if (k) real[k] = (real[k] || 0) + 1; }); });
      row.lines = lines.length; row.realFar = farOf(real); row.realKinds = Object.keys(real).length;
      // EASE
      cur = fresh(); row.ease = P.easeOf(run, smi); var e = cur; cur = null; row.easeCalls = e.calls; row.easeWithFar = e.withFar; row.easeFar = farOf(e.kinds); row.easeKinds = Object.keys(e.kinds).length;
      row.missing = row.realFar.filter(function (k) { return row.easeFar.indexOf(k) < 0; });
      // PROOF
      if (q.quick === '1') { row.proofCalls = 0; row.proofWithFar = 0; row.proofFar = []; rows.push(row); HL.hb({ done: i + 1, of: mols.length }); await new Promise(function (res) { setTimeout(res, 0); }); continue; }
      P.seed(5000 + ix); cur = fresh(); var sp = P.specPick(P.salt(P.modelOf(smi), P.rand), round, run.rack.concat(run.self), P.rand, run.tierNo || 3, [], Object.assign({}, run, { brief: 'plain' })); var pr = cur; cur = null;
      row.proofCalls = pr.calls; row.proofWithFar = pr.withFar; row.proofFar = farOf(pr.kinds); row.spec = sp && sp.parts ? sp.parts.map(function (x) { return x.name; }).join('+') : '';
      rows.push(row); HL.hb({ done: i + 1, of: mols.length }); await new Promise(function (res) { setTimeout(res, 0); });
    }
    // BRIEFS: the game's own call (easeOf and specFor on the two molecules offered), 10 offers
    var br = fresh(), offers = 0; for (var k = 0; k < (q.quick === '1' ? 0 : 10); k++) { var run2 = mkRun(); P.seed(6000 + k); cur = br; var bs = P.runBriefs(run2, P.rand); cur = null; offers += bs.length; }
  } finally { ENG.nextReflex = o1; ENG.settle = o2; P.seed(); }
  var sum = function (f) { return rows.reduce(function (t, r) { return t + f(r); }, 0); };
  return { round: round, molecules: rows.length, heldFor: typeof P.heldFor,
    realHeldAcross: sum(function (r) { return r.realHeld > 0 ? 1 : 0; }), realMakesAcross: sum(function (r) { return r.realFar.length ? 1 : 0; }),
    easeCallsHoldingAcross: sum(function (r) { return r.easeWithFar; }) + ' of ' + sum(function (r) { return r.easeCalls; }), easeMakesAcross: sum(function (r) { return r.easeFar.length ? 1 : 0; }),
    moleculesWhereEaseMissesAnAcrossKindTheRoundMakes: sum(function (r) { return r.missing.length ? 1 : 0; }),
    proofCallsHoldingAcross: sum(function (r) { return r.proofWithFar; }) + ' of ' + sum(function (r) { return r.proofCalls; }), proofMakesAcross: sum(function (r) { return r.proofFar.length ? 1 : 0; }),
    briefsCallsHoldingAcross: br.withFar + ' of ' + br.calls, briefsAcrossKinds: farOf(br.kinds), offers: offers,
    pass: sum(function (r) { return r.missing.length; }) === 0 && sum(function (r) { return r.easeCalls - r.easeWithFar; }) === 0 && sum(function (r) { return r.proofCalls - r.proofWithFar; }) === 0 && br.withFar === br.calls,
    rows: rows.map(function (r) { return [r.mol, r.lines, r.realFar.join(','), r.easeFar.join(','), r.missing.join(','), r.proofFar.join(','), r.ease]; }) };
};
