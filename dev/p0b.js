window.SHOT = async function (H) {
  const L = m => { new Image().src = '/__log?m=' + encodeURIComponent(m); };
  console.error('test capture');
  L('feel ' + typeof AA.rxFeel + ' ' + (AA.rxFeel && Object.keys(AA.rxFeel).join(',')));
  L('state ' + JSON.stringify(AA.rxFeel.state()).slice(0,300) + ' get ' + (localStorage.getItem('overreact.feel')));
  L('sfx ' + typeof AA.sfx + ' keys ' + Object.keys(AA.sfx).length);
};
