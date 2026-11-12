window.SHOT = async function (H) {
  const { S, P, run } = H, L = m => { new Image().src = '/__log?m=' + encodeURIComponent(m); };
  P.seed(3); S.debugBare(true); S.debugRound(1); await run(1500);
  L('briefs ' + JSON.stringify(S.state().pair).slice(0,300));
  const R = S.debugRun(); L('run.spec ' + JSON.stringify(R.spec) + ' RULE.spec ' + P.RULE.spec + ' bare ' + P.RULE.bare);
  S.takePick(0); await run(1500);
  L('briefs ' + JSON.stringify(S.debugBriefs ? S.debugBriefs() : null));
  S.chooseBrief(0); await run(2500);
  const g = S.debugG(); L('g.spec ' + JSON.stringify(g.spec) + ' def ' + JSON.stringify(g.specDef) + ' quota ' + S.st.quota + ' hurdle ' + JSON.stringify(S.st.hurdle) + ' run.spec ' + JSON.stringify(R.spec));
  L('keys ' + Object.keys(P).join(','));
};
