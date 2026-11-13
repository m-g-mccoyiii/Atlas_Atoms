// dom.js: which reagents the best lines hold, by real play with the game's own yield (RIG.md, eleventh measure).
// A round of round number r is dealt as a run deals it (runNew, runBriefs, runChoose, synBegin: the molecule of the round, five of the held
// reagents). On every page every ordered line of three of the hand is fired on a copy and valued two ways:
//   greedy     what the round has made when the page has run (P.made)
//   look-ahead what the round has made at its END when the pages still to come are played by the greedy one-at-a-time player on a deal of
//              their own (the same deal for every line of the page)
// The round then goes on with the best line of the valuation being measured (pol=greedy or look), so the later pages are the pages that
// player meets. A reagent is "in" a line only where it acted (a wasted circle does not count).
// Per reagent and round number: held (hands holding it), inBest (in at least one best line), inEvery (in every best line), loss (mean over
// hands holding it of 1 - best line without it / best line).
// Params: rounds=1,2,3 n=300 from=20001 pol=greedy|look rule={...} opts={...runNew opts} rack=a,b (extra reagents held)
HL.job = async function (q) {
  ["rule", "opts"].forEach(function (k) { if (q[k + "64"]) q[k] = atob(q[k + "64"]); });   // JSON arguments come base64-coded (quotes do not survive the shells)
  const P = AA.rxPath, S = SIM, RX = AA.rx;
  const rule = q.rule ? JSON.parse(q.rule) : {}, rounds = (q.rounds || '1,2,3').split(',').map(Number), n = +(q.n || 300), from = +(q.from || 20001), pol = q.pol || 'greedy';
  const ropts = q.opts ? JSON.parse(q.opts) : { tierNo: 3 };
  Object.assign(P.RULE, { spec: false }, rule); if (P.modeSync) P.modeSync(null);
  const greedyLine = S.PLAYERS.greedy.line;
  const mk = () => ({ held: 0, inBest: 0, inEvery: 0, loss: 0, own: 0, set: 0, uses: 0 });
  const out = { pol, rule, rounds: {}, n };
  const fire = (g, line) => { g.queue = []; const acted = [], slot = []; line.forEach(id => P.queueAdd(g, id)); while (g.queue.length && !g.over) { const c0 = g.casc || 0, t0 = g.trail.length, h = P.queueStep(g); const took = h && h.kind === 'take'; acted.push(took ? h.id : null); const sk = []; for (let k = t0 + 1; k < g.trail.length; k++) if (g.trail[k].kind) sk.push(g.trail[k].kind); slot.push({ id: h ? h.id : null, took, hits: took ? (g.trail[t0] ? g.trail[t0].hits : 0) : 0, set: (g.casc || 0) - c0, sk }); } g.queue = []; return { acted, slot }; };
  // the rest of the round after this page, played greedily on a private deal; returns what the round made
  const rest = (g) => {
    if (g.over || g.page >= P.pagesOf(g)) return P.made(g);
    const sv = Object.assign({}, g), kinds = g.kinds.slice(), left = Object.assign({}, g.left); let a = (g.page * 104729 + 977) >>> 0;
    const r2 = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    let v = -1; const s0 = S.snap(g);
    try { while (!g.over && P.turn(g, r2)) { g.shot = false; greedyLine(g).forEach(id => P.queueAdd(g, id)); while (g.queue.length && !g.over) P.queueStep(g); g.queue = []; } v = P.made(g); } catch (e) { v = -1; }
    Object.keys(g).forEach(k => { if (!(k in sv)) delete g[k]; }); Object.assign(g, sv); g.kinds = kinds; g.left = left; S.back(g, s0); return v;
  };
  for (const r of rounds) {
    const R = { reagent: {}, hands: 0, kinds: 0, steps: 0, chains: 0, total: 0, totalN: 0, lineKinds: {}, top: {}, err: 0, ties: 0, zero: 0, own: 0, heavy: 0 };
    for (let i = 0; i < n; i++) {
      try {
        P.seed(from + i * 13 + r * 100003); const rnd = P.rand, run = P.runNew(0, [], ropts); run.noGear = true; run.round = r;
        (q.rack ? q.rack.split(',') : []).forEach(id => { if (!run.rack.includes(id)) run.rack.push(id); });
        const briefs = P.runBriefs(run, rnd), b = briefs[Math.floor(rnd() * briefs.length)]; P.runChoose(run, b);
        const g = P.synBegin(run.feed, false, rnd, run.gear, run); R.heavy += P.heavy(g.m);
        for (;;) {
          const hand = g.kinds.slice(), lines = [], base = P.made(g);
          for (const a of hand) for (const b2 of hand) for (const c of hand) {
            const line = [a, b2, c], cnt = {}; if (line.some(id => (cnt[id] = (cnt[id] || 0) + 1) > P.usesLeft(g, id))) continue;
            const s = S.snap(g), t0 = g.trail.length, f = fire(g, line), made = P.made(g), ks = {}, st = (g.casc || 0);
            for (let k = t0; k < g.trail.length; k++) if (g.trail[k].kind) ks[g.trail[k].kind] = 1;
            const val = pol === 'look' ? rest(g) : made; S.back(g, s);
            lines.push({ line, acted: f.acted, slot: f.slot, val, made, steps: st, kinds: Object.keys(ks).length, klist: Object.keys(ks) });
          }
          if (!lines.length) break;
          let best = -1; lines.forEach(l => { if (l.val > best) best = l.val; });
          const bl = lines.filter(l => l.val === best); R.hands++; if (bl.length > 1) R.ties++; if (best <= base) R.zero++;
          // the best line played: the one with fewest wasted circles among the tied
          bl.sort((x, y) => y.acted.filter(Boolean).length - x.acted.filter(Boolean).length); const play = bl[0];
          R.kinds += play.kinds; R.steps += play.steps; if (play.steps > 0) R.chains++; play.klist.forEach(k => { R.lineKinds[k] = (R.lineKinds[k] || 0) + 1; });
          hand.forEach(id => { const o = R.reagent[id] || (R.reagent[id] = mk()); o.held++;
            if (bl.some(l => l.acted.includes(id))) o.inBest++; if (bl.every(l => l.acted.includes(id))) o.inEvery++;
            let wo = base; lines.forEach(l => { if (!l.line.includes(id) && l.val > wo) wo = l.val; }); const gain = best - base; o.loss += gain > 0 ? 1 - Math.max(0, wo - base) / gain : 0; });
          play.slot.forEach(sl => { if (sl.took) { const o = R.reagent[sl.id]; o.uses++; o.own += sl.hits; o.set += sl.set; } }); { const key = play.acted.map(x => x || '-').join(' '); R.top[key] = (R.top[key] || 0) + 1; play.slot.forEach((sl, si) => { if (sl.took) { const o = R.reagent[sl.id]; o.pos = o.pos || [0, 0, 0]; o.pos[si]++; o.sk = o.sk || {}; sl.sk.forEach(k => { o.sk[k] = (o.sk[k] || 0) + 1; }); } }); }
          fire(g, play.line); g.shot = true;
          if (g.over || g.page >= P.pagesOf(g)) break;
          if (!P.turn(g, rnd)) break;
        }
        R.total += Math.log(Math.max(1, P.made(g))); R.totalN++;
      } catch (e) { R.err++; R.lastErr = String(e && e.stack || e).slice(0, 300); }
      if (i % 5 === 4) { HL.hb({ r, i }); await new Promise(res => setTimeout(res, 0)); }
    }
    Object.keys(R.reagent).forEach(k => { const o = R.reagent[k]; o.best = Math.round(100 * o.inBest / Math.max(1, o.held)); o.every = Math.round(100 * o.inEvery / Math.max(1, o.held)); o.lossPct = Math.round(100 * o.loss / Math.max(1, o.held)); o.ownPerUse = +(o.own / Math.max(1, o.uses)).toFixed(2); o.setPerUse = +(o.set / Math.max(1, o.uses)).toFixed(2); delete o.loss; });
    { const ks = Object.keys(R.top).sort((x, y) => R.top[y] - R.top[x]); const t2 = {}; ks.slice(0, 14).forEach(k => { t2[k] = R.top[k]; }); R.top = t2; } R.kindsPerChain = +(R.kinds / Math.max(1, R.chains)).toFixed(2); R.stepsPerHand = +(R.steps / Math.max(1, R.hands)).toFixed(2); R.meanLog = +(R.total / Math.max(1, R.totalN)).toFixed(3); R.heavy = +(R.heavy / n).toFixed(1);
    out.rounds[r] = R;
  }
  return out;
};
