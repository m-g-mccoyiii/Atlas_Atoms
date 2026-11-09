// twelve card styles side by side, for choosing one
(function () {
'use strict';
const A = AA.rxArt, h = A.h, C = AA.rx.CARDS, ids = ['dehydrate', 'pcc', 'koh'], sites = [2, 1, 3];
const dark = c => 'rgb(' + c.map(q => Math.round(q * 0.62)).join(',') + ')';
const vars = c => '--cc:' + A.css(c.rgb) + ';--cd:' + dark(c.rgb) + ';';
const art = (c, cls) => h('canvas', { class: 'cArt' + (cls ? ' ' + cls : ''), 'data-id': c.id });
const haz = c => h('div', { class: 'cGhs' }, c.ghs.map(g => A.ghs(g)));
const num = (i, cls) => h('div', { class: cls }, String(sites[i]));
const svg = (cls, w, hh, body) => { const el = h('div', { class: cls }); el.innerHTML = '<svg viewBox="0 0 ' + w + ' ' + hh + '" width="100%" height="100%" aria-hidden="true">' + body + '</svg>'; return el; };
const TILT = [-1.5, 2, -1];

const S = {};
S.A = ['Bottles', (c, i) => h('div', { class: 'cA', style: vars(c) + '--t:' + TILT[i] + 'deg' },
  svg('fill', 200, 320,
    '<rect x="68" y="4" width="64" height="38" rx="4" fill="var(--cc)" stroke="#000" stroke-width="4"/>' +
    '<path d="M78 8v30M90 8v30M102 8v30M114 8v30M126 8v30" stroke="var(--cd)" stroke-width="4"/>' +
    '<path d="M76 42h48v20c0 14 62 20 62 56v176c0 12-8 20-20 20H34c-12 0-20-8-20-20V118c0-36 62-42 62-56z" fill="#7a4313" stroke="#000" stroke-width="4"/>' +
    '<path d="M150 96c14 8 28 14 28 30v164c0 10-6 16-16 16h-12z" fill="#57300d"/>' +
    '<path d="M30 122c0-14 14-22 30-30v214h-18c-8 0-12-6-12-12z" fill="#a9652a"/>' +
    '<path d="M38 128c0-8 6-14 12-18v60h-12z" fill="#e2b27a"/>'),
  num(i, 'dot aTag'),
  h('div', { class: 'aLabel' }, h('div', { class: 'aVerb' }, c.verb), h('div', { class: 'aForm' }, c.formula), art(c), haz(c)))];

S.B = ['Placards', (c, i) => h('div', { class: 'cB', style: vars(c) },
  h('div', { class: 'bSide' }, h('span', null, c.verb)),
  h('div', { class: 'bDia' }, h('div', null, art(c))),
  num(i, 'bNum'), h('div', { class: 'bForm' }, c.formula), haz(c))];

S.C = ['Playing cards', (c, i) => {
  const idx = cls => h('div', { class: 'pIdx' + cls }, h('b', null, String(sites[i])), A.ghs(c.ghs[0]));
  return h('div', { class: 'cC', style: vars(c) + '--r:' + (i - 1) * 5 + 'deg;--y:' + (i - 1) * (i - 1) * 8 + 'px' },
    idx(''), idx(' flip'), h('div', { class: 'pWin' }, h('div', { class: 'pVerb' }, c.verb), art(c)), h('div', { class: 'pForm' }, c.formula));
}];

S.D = ['Flasks', (c, i) => h('div', { class: 'cD', style: vars(c) },
  svg('fill', 200, 300,
    '<path d="M82 14h36v70l62 170c6 16-4 30-20 30H40c-16 0-26-14-20-30l62-170z" fill="#e4eeee" stroke="#000" stroke-width="4"/>' +
    '<path d="M62 138h76l42 116c6 16-4 30-20 30H40c-16 0-26-14-20-30z" fill="var(--cc)"/>' +
    '<path d="M62 138h76" stroke="var(--cd)" stroke-width="5"/>' +
    '<path d="M82 14h36v70l62 170c6 16-4 30-20 30H40c-16 0-26-14-20-30l62-170z" fill="none" stroke="#000" stroke-width="4"/>' +
    '<rect x="72" y="6" width="56" height="12" rx="5" fill="#e4eeee" stroke="#000" stroke-width="4"/>' +
    '<path d="M92 26v52l-50 138" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M90 100h10M90 116h16M90 132h10" stroke="#000" stroke-width="2"/>'),
  num(i, 'dot dTag'), h('div', { class: 'dArt' }, art(c)), h('div', { class: 'dVerb' }, c.verb), h('div', { class: 'dForm' }, c.formula))];

S.E = ['Chips', (c, i) => h('div', { class: 'cE', style: vars(c) },
  svg('fill', 200, 200,
    '<defs><path id="eT' + i + '" d="M38 100A62 62 0 0 1 162 100"/><path id="eB' + i + '" d="M30 100A70 70 0 0 0 170 100"/></defs>' +
    '<circle cx="100" cy="100" r="96" fill="var(--cc)" stroke="#000" stroke-width="4"/>' +
    '<circle cx="100" cy="100" r="87" fill="none" stroke="#fff" stroke-width="13" stroke-dasharray="22.8 22.8"/>' +
    '<circle cx="100" cy="100" r="78" fill="#f4eedd" stroke="#000" stroke-width="3"/>' +
    '<text font-size="21" font-weight="700" fill="var(--cd)" text-anchor="middle"><textPath href="#eT' + i + '" startOffset="50%">' + c.verb + '</textPath></text>' +
    '<text font-size="19" font-weight="700" fill="#111" text-anchor="middle"><textPath href="#eB' + i + '" startOffset="50%">' + c.formula + '</textPath></text>'),
  h('div', { class: 'eArt' }, art(c)), num(i, 'dot eTag'))];

const PIX = ['......kkkkkkkkk.....', '......kccccccdk.....', '......kccccccdk.....', '......kkkkkkkkk.....', '.......khggggsk.....', '.......khggggsk.....',
  '......kkhggggskk....', '....kkhhgggggggskk..', '...khhgggggggggggsk.', '..khhggggggggggggssk', '..khgggggggggggggssk', '..kxxxxxxxxxxxxxxxxk', '..kxxxxxxxxxxxxxxxxk',
  '..kwwwwwwwwwwwwwwwlk', '..kwwwwwwwwwwwwwwwlk', '..kwwwwwwwwwwwwwwwlk', '..kwwwwwwwwwwwwwwwlk', '..kwwwwwwwwwwwwwwwlk', '..kwwwwwwwwwwwwwwwlk', '..kwwwwwwwwwwwwwwwlk', '..kwwwwwwwwwwwwwwwlk', '..kwwwwwwwwwwwwwwwlk', '..kwwwwwwwwwwwwwwwlk',
  '..kllllllllllllllllk', '..khgggggggggggggssk', '..khgggggggggggggssk', '...kgggggggggggggsk.', '....kkkkkkkkkkkkkk..'];
S.F = ['Pixel bottles', (c, i) => {
  const cv = h('canvas', { class: 'fill pix', width: 20, height: 28 }), x = cv.getContext('2d');
  const pal = { k: '#000', c: A.css(c.rgb), d: dark(c.rgb), x: A.css(c.rgb), g: '#8a4a16', h: '#c98238', s: '#5a2c0a', w: '#f4eedd', l: '#d3c8a8' };
  PIX.forEach((row, y) => row.split('').forEach((ch, xx) => { if (pal[ch]) { x.fillStyle = pal[ch]; x.fillRect(xx, y, 1, 1); } }));
  return h('div', { class: 'cF', style: vars(c) }, cv, num(i, 'fTag'), h('div', { class: 'fVerb' }, c.verb), h('div', { class: 'fForm' }, c.formula), art(c, 'low'));
}];

S.G = ['Tiles', (c, i) => h('div', { class: 'cG', style: vars(c) }, num(i, 'gNum'), h('div', { class: 'gHaz' }, A.ghs(c.ghs[0])), art(c), h('div', { class: 'gVerb' }, c.verb), h('div', { class: 'gForm' }, c.formula))];

S.H = ['Hexes', (c, i) => h('div', { class: 'cH' + (i === 1 ? ' low' : ''), style: vars(c) },
  h('div', { class: 'hOut' }), h('div', { class: 'hIn' }, h('div', { class: 'hVerb' }, c.verb), art(c), h('div', { class: 'hForm' }, c.formula), haz(c)), num(i, 'hNum'))];

S.I = ['Drums', (c, i) => h('div', { class: 'cI', style: vars(c) },
  svg('fill', 200, 290,
    '<path d="M16 30v230c0 16 38 26 84 26s84-10 84-26V30z" fill="var(--cc)" stroke="#000" stroke-width="4"/>' +
    '<path d="M150 50v230c20-4 34-10 34-20V30c0 10-14 16-34 20z" fill="var(--cd)"/>' +
    '<path d="M16 84c0 16 38 26 84 26s84-10 84-26M16 214c0 16 38 26 84 26s84-10 84-26" fill="none" stroke="#000" stroke-width="9"/>' +
    '<path d="M16 84c0 16 38 26 84 26s84-10 84-26M16 214c0 16 38 26 84 26s84-10 84-26" fill="none" stroke="var(--cd)" stroke-width="4"/>' +
    '<ellipse cx="100" cy="30" rx="84" ry="24" fill="var(--cd)" stroke="#000" stroke-width="4"/>' +
    '<ellipse cx="100" cy="30" rx="68" ry="17" fill="none" stroke="#000" stroke-width="2"/>' +
    '<ellipse cx="140" cy="30" rx="13" ry="5" fill="#111"/>'),
  h('div', { class: 'iVerb' }, c.verb), h('div', { class: 'iLabel' }, art(c), h('div', { class: 'iForm' }, c.formula)), num(i, 'dot iTag'), haz(c))];

S.J = ['Tags', (c, i) => h('div', { class: 'cJ', style: vars(c) + '--t:' + TILT[i] * 2.5 + 'deg' },
  h('div', { class: 'jString' }),
  h('div', { class: 'jBody' }, h('div', { class: 'jHole' }), h('div', { class: 'jVerb' }, c.verb), art(c), h('div', { class: 'jForm' }, c.formula), haz(c), h('div', { class: 'jStripe' }, h('b', null, String(sites[i])))))];

S.K = ['Framed cards', (c, i) => h('div', { class: 'cK', style: vars(c) },
  h('div', { class: 'kBanner' }, c.verb), h('div', { class: 'kWin' }, art(c)),
  h('div', { class: 'kPlate' }, h('div', { class: 'kForm' }, c.formula), haz(c)), h('div', { class: 'kGem' }, h('b', null, String(sites[i]))))];

S.L = ['Notebook slips', (c, i) => h('div', { class: 'cL', style: vars(c) + '--t:' + TILT[i] * 1.6 + 'deg' },
  h('div', { class: 'lStamp' }, c.verb), num(i, 'lNum'), art(c), h('div', { class: 'lForm' }, c.formula), haz(c))];

const rows = document.getElementById('rows');
Object.keys(S).forEach(k => {
  rows.append(h('div', { class: 'cCell cell' + k }, h('div', { class: 'cName' }, h('b', null, k), S[k][0]), h('div', { class: 'cHand' }, ids.map((id, i) => S[k][1](C[id], i)))));
});
setTimeout(() => document.querySelectorAll('.cArt').forEach(cv => {
  A.drawCardArt(cv, C[cv.dataset.id], false);
  if (!cv.classList.contains('low')) return;
  const w = Math.round(cv.clientWidth / 2), hh = Math.round(cv.clientHeight / 2), t = document.createElement('canvas');
  t.width = w; t.height = hh; t.getContext('2d').drawImage(cv, 0, 0, w, hh);
  cv.width = w; cv.height = hh; cv.getContext('2d').drawImage(t, 0, 0);
}), 150);
})();
