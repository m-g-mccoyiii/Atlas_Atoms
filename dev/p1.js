// step 1: the spec on the round page, met moment, end screens won and lost
window.SHOT = async function (H) {
  const { S, P, run, save } = H, L = m => { new Image().src = '/__log?m=' + encodeURIComponent(m); }, b = H.base, q = H.q;
  P.seed(+(q.get('seed') || 3)); S.debugBare(true); S.debugRound(+(q.get('round') || 1)); await run(1500);
  S.takePick(0); await run(1500); S.chooseBrief(0); await run(2500);
  const g = S.debugG(); if (q.get('n')) { g.specDef.parts[0].n = +q.get('n'); }
  L('spec ' + JSON.stringify(g.spec) + ' quota ' + S.st.quota);
  await run(300, () => save(b + '-a.jpg'));
  [0, 1, 2].forEach(i => S.pick(i)); await run(500);
  S.fire(); L('fired');
  let k = 0;
  while (S.st.mode !== 'done' && k < 14) { await run(2500, () => { if (k < 4) save(b + '-p' + k + '.jpg'); }); const u = S.state().usable || []; L('page ' + k + ' mode ' + S.st.mode + ' spec ' + JSON.stringify(S.debugG().spec && { v: S.debugG().spec.value, n: S.debugG().spec.n, met: S.debugG().spec.met }) + ' total ' + S.debugG().total); if (S.st.mode === 'play') { if (u.length) { u.slice(0, 3).forEach(i => S.pick(i)); S.fire(); } else S.turn(); } k++; }
  await run(1200, () => save(b + '-d1.jpg')); await run(2500, () => save(b + '-d2.jpg'));
  L('end pass ' + S.st.pass + ' ypass ' + S.st.ypass + ' res ' + JSON.stringify(S.st.res).slice(0, 400));
};
