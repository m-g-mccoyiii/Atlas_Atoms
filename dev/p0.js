// step 0: the real page, a whole bare round, console errors logged by shot.js
window.SHOT = async function (H) {
  const { S, P, run, save } = H, L = m => { new Image().src = '/__log?m=' + encodeURIComponent(m); }, b = H.base;
  L('start mode ' + S.st.mode + ' paper ' + localStorage.getItem('aa_paper') + ' feel ' + (AA.rxFeel && AA.rxFeel.state && JSON.stringify(AA.rxFeel.state()).slice(0, 80)));
  await run(1500, () => save(b + '-01.jpg'));
  L('after load mode ' + S.st.mode);
  P.seed(3); S.debugBare(true); S.debugRound(1);
  await run(1500, () => save(b + '-02.jpg')); L('mode ' + S.st.mode);
  S.takePick(0); await run(1500, () => save(b + '-03.jpg')); L('mode ' + S.st.mode);
  S.chooseBrief(0); await run(2500, () => save(b + '-04.jpg')); L('mode ' + S.st.mode);
  const off = S.state().offer; L('offer ' + JSON.stringify(off));
  [0, 1, 2].forEach(i => S.pick(i)); await run(600, () => save(b + '-05.jpg'));
  S.fire(); L('fired');
  for (let i = 0; i < 6; i++) await run(1200, () => save(b + '-06' + 'abcdefg'[i] + '.jpg'));
  for (let k = 0; k < 12 && S.st.mode === 'play'; k++) { await run(2500); const u = S.state().usable || []; L('page ' + k + ' mode ' + S.st.mode + ' usable ' + u.length); if (S.st.mode === 'play') { if (u.length) { u.slice(0, 3).forEach(i => S.pick(i)); S.fire(); } else S.turn(); } }
  await run(2500); L('end mode ' + S.st.mode + ' total ' + (S.debugG() && S.debugG().total)); save(b + '-07.jpg');
  await run(3500, () => save(b + '-08.jpg')); L('mode ' + S.st.mode);
};
