// Test hook, loaded only when the page address has ?shot=. It replaces the page's clock with one that is stepped by hand, so a headless
// browser can play a step of the game at an exact time and save frames from it:
//   ?shot=chain (a ring chain) or ?shot=water (a reagent that gives off water), &at=ms,ms,... (times after the line is fired), &name=page5
// Frames are posted to the local server as images of the page's own canvas. Nothing here runs without ?shot.
(function () {
  const q = new URLSearchParams(location.search), mode = q.get('shot'); if (!mode) return;
  const realST = window.setTimeout.bind(window);
  let vnow = 1000, tid = 1, rafs = []; const timers = [];
  performance.now = () => vnow;
  window.setTimeout = (fn, ms, ...a) => { const id = tid++; timers.push({ id, t: vnow + Math.max(0, ms || 0), fn, a }); return id; };
  window.clearTimeout = id => { const i = timers.findIndex(x => x.id === id); if (i >= 0) timers.splice(i, 1); };
  window.setInterval = (fn, ms) => { const id = tid++; timers.push({ id, t: vnow + ms, fn, a: [], every: ms }); return id; };
  window.clearInterval = window.clearTimeout;
  window.requestAnimationFrame = cb => { rafs.push(cb); return rafs.length; };
  function step(dt) {
    vnow += dt;
    for (;;) { timers.sort((a, b) => a.t - b.t); const t = timers[0]; if (!t || t.t > vnow) break; timers.shift(); if (t.every) { t.t += t.every; timers.push(t); } try { t.fn(...t.a); } catch (e) { console.error(e); } }
    const cbs = rafs; rafs = []; cbs.forEach(cb => { try { cb(vnow); } catch (e) { console.error(e); } });
  }
  const yieldReal = () => new Promise(r => realST(r, 0));
  async function run(ms, onEnd) { const end = vnow + ms; let k = 0; while (vnow < end) { step(Math.min(33, end - vnow)); if (vnow < end && ++k % 10 === 0) await yieldReal(); } if (onEnd) onEnd(); }
  function save(name) {
    const cvs = document.querySelector('#schemeapp canvas'), url = cvs.toDataURL('image/jpeg', 0.88), n = Math.ceil(url.length / 20000);
    for (let i = 0; i < n; i++) { const im = new Image(); im.src = '/__save?name=' + encodeURIComponent(name) + '&i=' + i + '&n=' + n + '&d=' + encodeURIComponent(url.slice(i * 20000, (i + 1) * 20000)); }
  }
  window.addEventListener('load', () => realST(async () => {
    const S = AA.rxScheme, P = AA.rxPath, base = q.get('name') || 'shot', at = (q.get('at') || '300').split(',').map(Number);
    if (q.get('next')) P.RULE.next = true; if (q.get('free')) P.RULE.usesFree = true; P.seed(+(q.get('seed') || 3)); S.debugBare(true); S.debugRound(+(q.get('round') || 1));
    await run(1500); S.takePick(0); await run(1200); S.chooseBrief(0); await run(2500);
    if (q.get('rack') || mode === 'water') { S.debugRack((q.get('rack') || 'dehydrate,hydrate,pcc,bh3,nabh4').split(',')); await run(900); }
    S.debugFeed(q.get('smiles') || (mode === 'water' ? 'CC(O)CCC(O)CC' : 'O=CCCC(=O)CCC(C)(O)CCC=C')); await run(1500);
    if (q.get('spec')) { const g = S.debugG(); const p = q.get('spec').split(':'); S.st.hurdle = { kind: p[0], n: +p[1], value: +p[2], met: p[3] === '1' }; }
    const names = (q.get('line') || (mode === 'water' ? 'dehydrate' : 'hydrate,pcc,bh3')).split(','), off = S.state().offer; names.forEach(n => S.pick(off.indexOf(n))); await run(600);
    if (q.get('pre')) { await run(300, () => save(base + '-pre.jpg')); }
    if (q.get('quota')) S.st.quota = +q.get('quota');
    if (q.get('lose')) { S.st.quota = 99999999; }
    S.fire(); const t0 = vnow; const first = +(q.get('first') || 1);
    if (q.get('ring')) { let seen = 0, last = null; while (vnow - t0 < 20000) { await run(10); const c = S.st.cstep; if (c && c !== last) { last = c; if (++seen === +q.get('ring')) break; } } }
    if (q.get('end')) { for (let k = 0; k < 6 && S.st.mode !== 'done'; k++) { await run(2500); if (S.st.mode === 'play') { const u = S.state().usable || []; if (u.length) { u.slice(0, 3).forEach(i => S.pick(i)); S.fire(); } else S.turn(); } } }
    const t1 = vnow;
    for (let i = 0; i < at.length; i++) { await run(Math.max(1, at[i] - (vnow - t1)), () => save(base + '-' + (i + first) + '.jpg')); }
    document.title = 'done';
  }, 50));
})();
