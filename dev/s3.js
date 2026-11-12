// the round page with a homunculus and instruments, stage 2
window.SHOT = async function (H) {
  const { S, P, run, save } = H, L = m => { new Image().src = '/__log?m=' + encodeURIComponent(m); }, b = H.base, M = S.meta;
  M.stage = 2; M.taught = true; M.reach = 3; M.tier = 1; M.credit = 3;
  M.jar = { water: 200, h2: 40, co2: 0, acid: 30, wood: 0, salt: 0, slime: 0, seedling: 0 }; M.hatched = { water: true };
  P.seed(7); S.newRun(); await run(1200); S.chooseHom(0); await run(2200);
  L('mode ' + S.st.mode + ' hom ' + S.debugRun().hom);
  await run(500, () => save(b + '-0.jpg'));
  S.debugGear(['mirror', 'magnet', 'bunsen']);
  S.takePick(0); await run(1200); S.chooseBrief(0); await run(2500);
  await run(500, () => save(b + '-1.jpg'));
  S.debugRack('dehydrate,hydrate,pcc,bh3,nabh4'.split(',')); await run(900);
  S.debugFeed('CC(O)CCC(O)CC'); await run(1500);
  const off = S.state().offer; ['dehydrate', 'hydrate'].forEach(k => { const i = off.indexOf(k); if (i >= 0) S.pick(i); }); await run(600);
  S.fire(); await run(1800, () => save(b + '-2.jpg'));
  await run(2500, () => save(b + '-3.jpg'));
  { const r = S.debugRun(), g = S.debugG(); L('run bare ' + P.bareRun(r) + ' noHom ' + r.noHom + ' hom ' + r.hom + ' tier ' + r.tierNo + ' g.hom ' + JSON.stringify(g.hom) + ' gear ' + r.gear); }
  L('state ' + JSON.stringify(S.homState ? S.homState() : null).slice(0, 300));
  await run(1500);
};
