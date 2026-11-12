window.SHOT = async function (H) {
  const { S, P, run } = H, L = m => { new Image().src = '/__log?m=' + encodeURIComponent(m); };
  L('HOMS ' + Object.keys(P.HOMS).join(',') + ' homOn ' + Object.keys(P.HOMS).filter(P.homOn).join(','));
  L('JAR ' + JSON.stringify(P.JAR));
  L('keys kit ' + Object.keys(AA.rxKit).join(','));
  L('HOMID ' + JSON.stringify(AA.rxKit.HOMID));
  L('RULE.bare ' + P.RULE.bare + ' meta ' + JSON.stringify(S.meta));
  const H0 = P.HOMS; Object.keys(H0).forEach(k => L(k + ' ' + JSON.stringify({ name: H0[k].name, tok: H0[k].tok, jar: H0[k].jar, need: H0[k].need, feed: H0[k].feed, offered: H0[k].offered })));
  await run(100);
};
