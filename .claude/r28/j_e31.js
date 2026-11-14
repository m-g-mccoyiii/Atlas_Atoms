// j_e31.js: stills of Water's change of stage (builder 31). stage=3 (the stage it leaves), at=a.1,b.5,v.3 : a is the gathering 0..1, b the whirlpool 0..1, v beats after the hit
window.JOB = async function (q) {
  const S = AA.rxScheme, P = AA.rxPath, T = ms => V.tick(ms), out = { plog: [] }, M = S.meta, part = q.get('part') || 'act', name = q.get('name');
  M.stage = 3; M.taught = true; M.reach = 1; V.coarse = 120; if (AA.rxFeel) { AA.rxFeel.probe = false; if (AA.rxFeel.setPace) AA.rxFeel.setPace(q.get('pace') || '2', true); }
  const seed = +(q.get('seed') || 11), hom = 'water', stage = +(q.get('stage') || 3);
  const jarFor = sg => { for (let n = 0; n < 200000; n += 5) { if (P.homStage({ meta: { jar: { [hom]: n } } }, hom).stage >= sg) return n; } return 0; };
  P.seed(seed); S.newRun(); await T(500);
  if (S.st.mode === 'pick') { S.takePick(0); await T(900); }
  if (S.st.mode === 'brief') { S.chooseBrief(0); for (let w = 0; w < 80 && S.st.mode === 'brief'; w++) await T(100); }
  const lines = [(q.get('lines') || 'dehydrate').split(',')], need = lines[0].concat((q.get('rack') || '').split(',').filter(Boolean));
  try { P.RULE.bare = false; S.debugJar({ water: 200, h2: 130, co2: 30, acid: 200, slime: 70 }); const rr = S.debugRun(); rr.bare = false; rr.noHom = false; rr.noGear = false; rr.meta = M; rr.rack = need.slice(); M.hatched = M.hatched || {}; M.hatched[hom] = true; M.jar[hom] = jarFor(stage); S.debugHom(hom); } catch (e) { out.ownErr = String(e && e.stack); }
  if (q.get('smi')) { P.seed(seed); S.debugFeed(q.get('smi')); }
  await T(1500); M.jar[hom] = jarFor(stage); out.stand = S.homRestand(); out.mode = S.st.mode;
  let n = 1; const snap = async () => { V.dir = name; V.n = n; V.rec = true; await T(33.34); V.rec = false; await V.stop(); n++; };
  await T(900); V.coarse = 33.34; M.jar[hom] = jarFor(stage + 1); const ats = (q.get('at') || '').split(',').filter(Boolean).map(s => [s[0], +s.slice(1)]); let k = 0; out.ph = [];
  for (let w = 0; w < 600 && k < ats.length; w++) { await T(33.34); const d = AA.rxKit.s31dbg && AA.rxKit.s31dbg(), ph = d && d.ph; if (!ph) { if (w > 60 && k > 0) break; continue; } const cur = ats[k][0] === 'a' ? (ph[1] >= 0 ? 9 : ph[0]) : ats[k][0] === 'b' ? (ph[2] >= 0 ? 9 : ph[1]) : ph[2]; if (cur >= ats[k][1]) { out.ph.push(ph.map(x => +x.toFixed(2)).join('/')); await snap(); k++; } }
  if (q.get('after')) { await T(+q.get('after')); await snap(); }
  out.d31 = AA.rxKit.s31dbg && AA.rxKit.s31dbg(); out.d30 = AA.rxKit.s30dbg && AA.rxKit.s30dbg(); out.hevo = S.homEvoState(); return out;
};
