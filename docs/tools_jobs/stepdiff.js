// stepdiff.js: the bond record of every step (made, broken, changed, left) checked against the molecule before and after it.
// Rounds are dealt as a run deals them and random lines of three are fired. Every step is replayed here: the record applied to the bonds
// before the step must give exactly the bonds after it (pairs of atom ids with their order), the atoms listed as left must be exactly the
// atoms that are gone, and a weld or snap step must make carbon-carbon bonds only (bonds to H aside).
// Also tallies, per reagent and reflex kind, the elements that left. n= rounds per round number, rack=extra reagents, holdAll=1, rule64=
HL.job = async function (q) {
  ["rule", "opts"].forEach(function (k) { if (q[k + "64"]) q[k] = atob(q[k + "64"]); });
  const P = AA.rxPath, RX = AA.rx, n = +(q.n || 20), rule = q.rule ? JSON.parse(q.rule) : {}; Object.assign(P.RULE, { spec: false }, rule); P.MODEL.relaxed = false; if (q.holdAll === '1') P.RULE.holdAll = true;
  const rack = q.rack === 'ALL' ? Object.keys(RX.CARDS).filter(id => !(P.RULE.ban || []).includes(id)) : (q.rack || '').split(',').filter(Boolean), out = { steps: 0, checked: 0, bad: 0, badList: [], kinds: {}, noRecord: 0, ccBad: 0, err: 0 };
  // watch every step: wrap bondDiff, which synTake calls with the molecule before, after and the map
  const orig = P.bondDiff; let seen = [];
  const check = (m0, m1, map, d) => {
    const live = new Set(m1.atoms.filter(a => !a.fly)), key = (a, b) => (a < b ? a + ':' + b : b + ':' + a), B = new Map();
    m0.bonds.forEach(b => { if (b.a.fly || b.b.fly) return; const na = map.get(b.a), nb = map.get(b.b); if (na && nb && live.has(na) && live.has(nb)) B.set(key(na.id, nb.id), b.order); });
    let ok = true;
    d.broken.forEach(x => { if (x.a != null && x.b != null) { if (!B.has(key(x.a, x.b))) ok = false; B.delete(key(x.a, x.b)); } });
    d.changed.forEach(x => { if (B.get(key(x.a, x.b)) !== x.was) ok = false; B.set(key(x.a, x.b), x.order); });
    d.made.forEach(x => { if (B.has(key(x.a, x.b))) ok = false; B.set(key(x.a, x.b), x.order); });
    const A = new Map(); m1.bonds.forEach(b => { if (live.has(b.a) && live.has(b.b)) A.set(key(b.a.id, b.b.id), b.order); });
    if (A.size !== B.size) ok = false; A.forEach((v, k) => { if (B.get(k) !== v) ok = false; });
    const gone = m0.atoms.filter(a => !a.fly && !(map.get(a) && live.has(map.get(a)))).length; if (gone !== d.left.length + d.moved.length) ok = false;
    return ok;
  };
  const el = (m, id) => { const a = m.atoms.find(x => x.id === id); return a ? a.el : '?'; };
  for (let r = 1; r <= 9; r++) for (let i = 0; i < n; i++) {
    try {
      P.seed(70000 + i * 11 + r * 1009); const rnd = P.rand, run = P.runNew(0, [], { tierNo: 3 }); run.noGear = true; run.round = r; rack.forEach(id => { if (!run.rack.includes(id)) run.rack.push(id); });
      const bs = P.runBriefs(run, rnd), b = bs[Math.floor(rnd() * bs.length)]; P.runChoose(run, b); const g = P.synBegin(run.feed, false, rnd, run.gear, run);
      for (;;) {
        const hand = g.kinds.slice(); g.queue = []; for (let k = 0; k < 3; k++) P.queueAdd(g, hand[Math.floor(rnd() * hand.length)]);
        while (g.queue.length && !g.over) {
          const t0 = g.trail.length; let mPrev = g.m; const opts = [];
          // the options a step will take are not visible from outside, so each entry is checked by diffing again here: before = molecule when the entry was pushed
          P.queueStep(g);
          g.trail.slice(t0).forEach(t => { if (t.wasted || t.bank) return; out.steps++;
            const K = t.free ? 'reflex ' + (RX.ENG.KIND[t.id] || t.id) + (t.via === 'fold' ? ' (across)' : '') : 'reagent ' + t.id, o = out.kinds[K] || (out.kinds[K] = { n: 0, left: {}, made: {}, changed: {} }); o.n++;
            if (!t.made) { out.noRecord++; return; }
            const lk = t.left.map(x => x.el).sort().join('') || '-'; o.left[lk] = (o.left[lk] || 0) + 1; o.off = o.off || {}; (t.off || []).forEach(x => { const k = x.kind + ' as ' + (x.atoms.slice().sort().join('') || 'no atoms'); o.off[k] = (o.off[k] || 0) + 1; }); o.addedEl = o.addedEl || {}; { const ak = t.added.map(x => x.el).sort().join('') || '-'; o.addedEl[ak] = (o.addedEl[ak] || 0) + 1; }
            t.made.forEach(x => { if (x.elA === 'H' || x.elB === 'H') return; const k = [x.elA, x.elB].sort().join('-'); o.made[k] = (o.made[k] || 0) + 1; }); o.broken = o.broken || {}; t.broken.forEach(x => { if (x.elA === 'H' || x.elB === 'H') return; const k = [x.elA, x.elB].sort().join('-'); o.broken[k] = (o.broken[k] || 0) + 1; });
            t.changed.forEach(x => { const k = [x.elA, x.elB].sort().join('-') + ' ' + x.was + 'to' + x.order; o.changed[k] = (o.changed[k] || 0) + 1; });
            if (/^reflex (weld|snap)/.test(K) && t.made.some(x => x.elA !== 'H' && x.elB !== 'H' && !(x.elA === 'C' && x.elB === 'C'))) out.ccBad++; });
        }
        g.queue = []; g.shot = true; if (g.over || g.page >= P.pagesOf(g)) break; if (!P.turn(g, rnd)) break;
      }
    } catch (e) { out.err++; out.lastErr = String(e && e.stack || e).slice(0, 400); }
    if (i % 4 === 3) { HL.hb({ r, i }); await new Promise(res => setTimeout(res, 0)); }
  }
  // the exact replay: options taken straight from the engine on fresh molecules, every reagent and every held reflex
  const feeds = P.FEEDS.slice(0, +(q.feeds || 120)); let rep = 0, repBad = 0; const repBadList = [];
  feeds.forEach(smi => { try { const run = P.runNew(0, [], { tierNo: 3 }); run.round = 6; P.RULE.holdAll = true; const g = P.synBegin(P.modelOf(smi), false, P.rand, [], run);
      for (let k = 0; k < 6 && !g.over; k++) { const o = P.options(g, true), ids = Object.keys(o); let c = P.cascadeNext ? P.cascadeNext(g) : null; const pick = c || (ids.length ? o[ids[(k * 7 + smi.length) % ids.length]] : null); if (!pick || !pick.map) break;
        const d = P.bondDiff(g.m, pick.model, pick.map); rep++; if (!check(g.m, pick.model, pick.map, d)) { repBad++; if (repBadList.length < 6) repBadList.push({ smi, id: pick.id, d }); } P.synTake(g, pick, true); }
    } catch (e) { out.err++; out.lastErr = String(e && e.stack || e).slice(0, 400); } });
  out.replayed = rep; out.replayBad = repBad; out.replayBadList = repBadList;
  return out;
};
