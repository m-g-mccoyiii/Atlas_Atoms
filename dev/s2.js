window.SHOT = async function (H) {
  const { S, P, run, save } = H, L = m => { new Image().src = '/__log?m=' + encodeURIComponent(m); }, b = H.base;
  const M = S.meta; M.stage = 2; M.taught = true; M.tier = 1; M.credit = 9; M.found = {};
  M.jar = { water: 120, h2: 40, co2: 0, acid: 30, wood: 0, salt: 0, slime: 0, seedling: 0 }; M.hatched = { water: true };
  P.seed(5); S.debugRound(4); S.showSuppliers(); await run(1500);
  L('shop mode ' + S.st.mode + ' credit ' + M.credit);
  await run(800, () => save(b + '-1.jpg'));
  S.st.hover = M.tier + 1; await run(300, () => save(b + '-2.jpg')); await run(1500);
};
