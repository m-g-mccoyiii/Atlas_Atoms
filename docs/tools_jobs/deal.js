// deal.js: n deals per round number as a run deals them (both molecules of the pair); share holding each element other than C, H, O, atoms of them per molecule, kinds per molecule.
HL.job = async function (q) {
  ["rule", "opts"].forEach(function (k) { if (q[k + "64"]) q[k] = atob(q[k + "64"]); });   // JSON arguments come base64-coded (quotes do not survive the shells)
  var P = AA.rxPath, n = +(q.n || 500), out = {}, rule = q.rule ? JSON.parse(q.rule) : {}; Object.assign(P.RULE, { spec: false }, rule); P.MODEL.relaxed = false;
  var last = +(q.last || 9);
  for (var r = 1; r <= last; r++) {
    var o = { deals: 0, het: 0, atoms: 0, kinds: 0, by: {}, pool: 0, bank: 0, heavy: 0, tableHet: 0, table: 0, err: 0 };
    P.FEEDS.forEach(function (s) { if ((P.FEED_ROUNDS[s] || []).indexOf(r) >= 0) { o.table++; if (/N|S|Cl|Br|F|P|I|B/.test(s.replace(/C(?!l)/g, ''))) o.tableHet++; } });
    for (var i = 0; i < n; i++) {
      try {
        P.seed(50000 + i * 7 + r * 1009); var run = P.runNew(0, [], q.opts ? JSON.parse(q.opts) : { tierNo: 3 }); run.noGear = true; run.round = r;
        P.runBriefs(run, P.rand).forEach(function (b) { var els = {}, k = 0; b.model.atoms.forEach(function (a) { if (a.el !== 'C' && a.el !== 'H' && a.el !== 'O') { els[a.el] = 1; k++; } });
          o.deals++; o.heavy += P.heavy(b.model); if (k) o.het++; o.atoms += k; o.kinds += Object.keys(els).length; Object.keys(els).forEach(function (e) { o.by[e] = (o.by[e] || 0) + 1; }); if (b.src && P.FEED_BANK[b.src]) o.bank++; else o.pool++; });
      } catch (e) { o.err++; o.lastErr = String(e).slice(0, 200); }
      if (i % 50 === 49) await new Promise(function (res) { setTimeout(res, 0); });
    }
    out[r] = o; HL.hb({ r: r });
  }
  return out;
};
