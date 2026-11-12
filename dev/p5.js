// step 5: a whole played run by the page's own functions on the hand-stepped clock, one frame per screen and state
// address keys: seed, w (win flags by round, e.g. 1,1,1), stage (meta.stage), tag (frame name prefix), taught (1 = the pair is shown)
window.SHOT = async function (H) {
  const { S, P, run, save } = H, L = m => { new Image().src = '/__log?m=' + encodeURIComponent(m); }, q = H.q, tag = q.get('tag') || 'r', M = S.meta;
  const W = (q.get('w') || '1,1,1').split(',').map(Number); let fn = 0;
  const snap = async (name, ms) => { await run(ms || 400, () => save(tag + '-' + String(++fn).padStart(2, '0') + '-' + name + '.jpg')); L('frame ' + fn + ' ' + name + ' mode ' + S.st.mode); };
  M.stage = +(q.get('stage') || 1); M.taught = q.get('taught') !== '0'; M.reach = 1; if (M.stage >= 2) { M.tier = 1; M.credit = 6; }
  P.seed(+(q.get('seed') || 11)); S.newRun(); await run(1500);
  await snap('first-screen', 300);
  let rounds = 0;
  for (;;) {
    rounds++; if (S.st.mode === 'pick') { await snap('pick-' + rounds, 500); S.takePick(0); await run(1800); }
    if (S.st.mode === 'brief') { await snap('molecule-' + rounds, 500); S.chooseBrief(0); await run(2500); }
    if (S.st.mode !== 'play') { L('unexpected mode ' + S.st.mode); break; }
    const g = S.debugG(), win = W[rounds - 1] !== 0; g.specDef.parts[0].n = win ? 1 : 99; if (win) g.specDef.parts[0].n = 1;
    await snap('round-' + rounds + '-start', 300);
    let pg = 0;
    while (S.st.mode === 'play' || S.st.mode === 'move' || S.st.mode === 'fuse') {
      const u = S.state().usable || []; if (S.st.mode === 'play' && u.length) { u.slice(0, 3).forEach(i => S.pick(i)); await run(500); if (pg === 0) await snap('round-' + rounds + '-lined', 200); S.fire(); pg++; await run(2200); await snap('round-' + rounds + '-page' + pg + '-a', 100); await run(2800); if (pg <= 2) await snap('round-' + rounds + '-page' + pg + '-b', 100); await run(2500); }
      else if (S.st.mode === 'play') { S.turn(); await run(1500); } else await run(1200);
      if (pg > 6) break;
    }
    await run(1000); await snap('round-' + rounds + '-end-a', 100); await run(2500); await snap('round-' + rounds + '-end-b', 100);
    L('end round ' + rounds + ' pass ' + S.st.pass + ' won ' + S.st.won + ' mode ' + S.st.mode);
    const wasWon = S.st.won, pass = S.st.pass; S.next(); await run(2000);
    if (wasWon) { await snap('after-run-won', 300); break; }
    if (!pass) { await snap('after-run-lost', 300); if (S.st.mode === 'shop') { await run(1500); await snap('bench', 300); } break; }
    if (rounds > 4) break;
  }
};
