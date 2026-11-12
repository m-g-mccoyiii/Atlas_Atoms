window.SHOT = async function (H) {
  const { S, P, run, save } = H, L = m => { new Image().src = '/__log?m=' + encodeURIComponent(m); }, q = H.q, b = H.base;
  const M = S.meta; M.stage = 2; M.taught = true;
  M.jar = { water: 120, h2: 40, co2: 0, acid: 30, wood: 0, salt: 0, slime: 0, seedling: 0 }; M.hatched = { water: true };
  P.seed(5); S.newRun(); await run(1500);
  L('mode ' + S.st.mode);
  await run(1200, () => save(b + '-1.jpg'));
  S.setHover(0); S.st.hover = 0; await run(300, () => save(b + '-2.jpg'));
  S.chooseHom(0); await run(500, () => save(b + '-3.jpg'));
  await run(500, () => save(b + '-4.jpg'));
  await run(1500, () => save(b + '-5.jpg'));
  L('mode after ' + S.st.mode + ' hom ' + (S.state().hom));
};
