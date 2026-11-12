// paper and notes frames: the pick of two, a round mid-play, the round end. address: paper, notes, tag
window.SHOT = async function (H) {
  const { S, P, run, save } = H, q = H.q, tag = q.get('tag') || 'paper', M = S.meta;
  M.taught = true; M.stage = 1; P.seed(+(q.get('seed') || 3)); S.debugBare(true); S.debugRound(1); await run(1200);
  S.takePick(0); await run(1500); await run(300, () => save(tag + '-pick.jpg'));
  S.chooseBrief(0); await run(2500);
  S.debugG().specDef.parts[0].n = 1;
  const u = S.state().usable || []; u.slice(0, 3).forEach(i => S.pick(i)); await run(500); S.fire(); await run(3500, () => save(tag + '-mid.jpg'));
  let k = 0; while (S.st.mode !== 'done' && k < 14) { await run(2500); const uu = S.state().usable || []; if (S.st.mode === 'play') { if (uu.length) { uu.slice(0, 3).forEach(i => S.pick(i)); S.fire(); } else S.turn(); } k++; }
  await run(3500, () => save(tag + '-end.jpg'));
};
