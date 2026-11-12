window.SHOT = async function (H) {
  const { S, P, run, save, q } = H, L = m => { new Image().src = '/__log?m=' + encodeURIComponent(m); }, n = q.get('paper') || '1';
  S.meta.taught = true; S.meta.stage = 1; P.seed(3); S.debugBare(true); S.debugRound(1);
  await run(1500); S.takePick(0); await run(1500);
  await run(600, () => save('paper-' + n + '-b.jpg'));
  S.chooseBrief(0); await run(2500);
  S.debugRack('dehydrate,hydrate,pcc,bh3,nabh4'.split(',')); await run(900);
  S.debugFeed('O=CCCC(=O)CCC(C)(O)CCC=C'); await run(1500);
  const off = S.state().offer; ['hydrate', 'pcc', 'bh3'].forEach(k => S.pick(off.indexOf(k))); await run(600);
  S.st.quota = 150; S.fire(); await run(1100, () => save('paper-' + n + '-a.jpg'));
  for (let k = 0; k < 40 && S.st.mode !== 'done'; k++) { await run(2500); if (S.st.mode === 'play') { const u = S.state().usable || []; if (u.length) { u.slice(0, 3).forEach(i => S.pick(i)); S.fire(); } else S.turn(); } }
  await run(3000, () => save('paper-' + n + '-c.jpg'));
  await run(1500); L('paper ' + n + ' mode ' + S.st.mode);
};
