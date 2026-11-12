// step 4: motifs, with injected test state
window.SHOT = async function (H) {
  const { S, P, run, save } = H, L = m => { new Image().src = '/__log?m=' + encodeURIComponent(m); }, b = H.base, q = H.q;
  P.seed(+(q.get('seed') || 3)); S.debugBare(true); S.debugRound(1); await run(1500);
  S.takePick(0); await run(1500); S.chooseBrief(0); await run(2500);
  const g = S.debugG();
  g.motifs = { sugar: 2, resonance: 3, ring: 1, branch: 2, acid: 1 };
  await run(900, () => save(b + '-1.jpg'));
  g.motifs = { sugar: 3, resonance: 3, ring: 1, branch: 2, acid: 1 };
  await run(140, () => save(b + '-2.jpg'));
  await run(900, () => save(b + '-3.jpg'));
  g.motifs = { sugar: 3, resonance: 3, ring: 1, branch: 2, acid: 0, chain: 2, cage: 4, spiro: 1, amine: 2 };
  await run(200, () => save(b + '-4.jpg'));
  await run(900, () => save(b + '-5.jpg'));
  g.motifs = { sugar: 3, resonance: 2, ring: 1, branch: 2, chain: 2, cage: 4, spiro: 1, amine: 2 };
  await run(180, () => save(b + '-6.jpg'));
};
