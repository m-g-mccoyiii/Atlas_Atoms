// Development driver: plays a case through the real UI code paths. Not loaded by noir.html; inject it from the console.
window.PLAY = async function (culpritName, pickIdx, opts) {
  opts = opts || {};
  const w = ms => new Promise(r => setTimeout(r, ms));
  const click = t => { const b = [...document.querySelectorAll('button')].find(b => new RegExp(t).test(b.textContent) && !b.disabled); if (!b) throw new Error('no button ' + t + ' on ' + document.body.innerText.slice(0, 100)); b.click(); };
  const lib = AA.chem.library(), out = [];
  if (!document.querySelector('.cols')) {
    click('Open case|Continue case'); await w(250);
    if (/Take the case/.test(document.body.innerText)) { click('Take the case'); await w(300); }
  }
  const c = AA.NOIR.cases.find(x => x.title === document.querySelector('.labTop h2').textContent);
  for (const s of c.samples) {
    if (opts.skip && opts.skip.includes(s.id)) continue;
    click('Analyze'); await w(700);
    const tn = NOIR_DBG.tuner, m = tn.model;
    const tpl = AA.Model.fromSmilesRelaxed(lib.byId.get(s.compound).smiles, 3);
    const map = tpl.atoms.map(a => m.addAtom(a.el, a.x, a.y, a.z));
    tpl.bonds.forEach(b => m.bonds.push({ a: map[tpl.atoms.indexOf(b.a)], b: map[tpl.atoms.indexOf(b.b)], order: b.order }));
    if (s.anomaly) tn.scan('nmr');
    await w(300); tn.refresh(); tn.assay();
    for (let i = 0; i < 60 && !document.querySelector('.cover'); i++) {
      await w(200);
      const rb = [...document.querySelectorAll('button')].find(b => /Report anomaly/.test(b.textContent) && b.style.display !== 'none');
      if (rb && s.anomaly) { rb.click(); }
    }
    out.push(s.compound + ':' + (document.querySelector('.cover') ? 'identified' : 'FAILED') + ' hrs' + NOIR_DBG.S.cur.hours);
    click('Back to case'); await w(300);
  }
  click('Name the (culprit|explanation)'); await w(300);
  const os = [...document.querySelectorAll('.sheet .opt')], sus = os.find(b => b.textContent.includes(culpritName));
  if (!sus) throw new Error('no suspect; opts=' + os.length);
  sus.click(); const clues = os.filter(b => !b.textContent.includes(' — ')); pickIdx.forEach(i => clues[i].click()); await w(200);
  click('Submit to the detective'); await w(400);
  const v = document.querySelector('.brief').innerText.replace(/\n/g, ' ').slice(0, 320);
  click('Back to the office'); await w(300);
  return out.join(' | ') + ' => ' + v;
};
'devplay loaded';
