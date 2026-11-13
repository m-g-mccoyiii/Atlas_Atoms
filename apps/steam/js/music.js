(function (root) {
'use strict';
const AA = root.AA = root.AA || {};

// Overreact soundtrack. Everything is synthesised here in Web Audio: no audio files, no samples, no libraries.
// A sequencer on the audio clock plays one of three themes, all in D minor like the effects (sfx.js: Dm Bb Gm A).
// The music is a set of states (title, bench, shop, pick, plan, chain, overreact, won, lost, runwon, runlost).
// Bars are written a bar ahead; a new state starts on the next bar line (chain, overreact and the four endings cut in at once).
// In a chain the music stops keeping its own beat (the effects keep the beat of the steps) and holds a bed that grows with
// intensity; step(n) moves its chord with the effects' chords (three steps a chord) so every step lands in key.
// Output goes into the effects' own bus (the ducked bed of sfx.js) when one exists, so hits push the music down and the two
// share one limiter; otherwise the music has its own limiter. See docs/MUSIC.md.

const KEY = 'overreact.music', TRIM = 0.96, LOOK = 0.35, MASTER = 0.67, NTH = 11;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
function RNG(seed) { let s = Math.floor(Math.abs(seed)) % 2147483647; if (s <= 0) s += 2147483646; const r = () => { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; r.i = n => Math.floor(r() * n); r.pick = a => a[r.i(a.length)]; r.chance = p => r() < p; return r; }
const hash = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 2147483647; return h; };

// ---------- the context of the effects, caught when sfx.js makes it (sfx.js keeps it private) ----------
let cap = null;
['AudioContext', 'webkitAudioContext'].forEach(k => { const O = root[k]; if (!O || O.__ovm) return; const W = function (a) { const c = a === undefined ? new O() : new O(a); cap = c; return c; }; W.prototype = O.prototype; W.__ovm = true; W.__orig = O; try { root[k] = W; } catch (e) { /* left alone */ } });

// ---------- harmony ----------
const CH = {
  Dm: { r: 38, n: [62, 65, 69] }, Bb: { r: 34, n: [58, 62, 65] }, Gm: { r: 31, n: [55, 58, 62] }, A: { r: 33, n: [57, 61, 64] },
  C: { r: 36, n: [60, 64, 67] }, F: { r: 29, n: [60, 65, 69] }, Eb: { r: 39, n: [58, 63, 67] }, Am: { r: 33, n: [57, 60, 64] },
  Edim: { r: 40, n: [58, 64, 67] }, Asus: { r: 33, n: [57, 62, 64] }, Dsus: { r: 38, n: [62, 67, 69] }, D5: { r: 38, n: [62, 69, 74] }, D: { r: 38, n: [62, 66, 69] }
};
const SFXCH = ['Dm', 'Bb', 'Gm', 'A'];                       // the chords of the effects, three steps each
const SCALE = [0, 2, 3, 5, 7, 8, 10];                         // D natural minor, as steps above D
const SCALES = { 4: [0, 2, 3, 5, 7, 9, 10], 5: [0, 2, 4, 5, 7, 9, 10], 6: [0, 2, 4, 5, 7, 9, 10] };   // the grooves: dorian, mixolydian, mixolydian
const upTone = (m, a, th) => { const sc = SCALES[th] || SCALE; for (let k = 1; k < 4; k++) { const pc = ((m + k - 62) % 12 + 12) % 12; if (a && !SCALES[th] && pc === 11) return m + k; if (sc.indexOf(pc) >= 0 && !(a && !SCALES[th] && pc === 10)) return m + k; } return m + 2; };
const nearTone = (m, ch) => { let best = m, bd = 99; ch.n.forEach(p => { for (let o = -36; o <= 36; o += 12) { const d = Math.abs(p + o - m); if (d < bd) { bd = d; best = p + o; } } }); return best; };

// ---------- the three themes: the tunes are bars of [place, length, note], in sixteenths ----------
const TH = {
  1: { name: 'Burner', line: 'driving dark synth: a pumping bass, an arpeggio and a saw lead with a rising riff', upb: 16, bpm: [108, 124],
    prog: { A: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Dm', 'Bb', 'A'], B: ['Gm', 'Dm', 'Bb', 'A', 'F', 'C', 'Gm', 'A'] }, alt: { A: { 3: 'Am', 1: 'F' }, B: { 5: 'Am' } },
    tune: {
      A: [[[0, 6, 74], [6, 2, 69], [8, 2, 74], [10, 2, 76], [12, 4, 77]], [[0, 6, 76], [6, 2, 74], [8, 8, 69]], [[0, 6, 70], [6, 2, 74], [8, 2, 77], [10, 2, 79], [12, 4, 77]], [[0, 6, 76], [6, 2, 72], [8, 8, 76]],
          [[0, 6, 74], [6, 2, 69], [8, 2, 74], [10, 2, 76], [12, 4, 77]], [[0, 6, 81], [6, 2, 79], [8, 8, 77]], [[0, 4, 79], [4, 4, 77], [8, 4, 75], [12, 4, 74]], [[0, 6, 73], [6, 2, 76], [8, 8, 69]]],
      B: [[[0, 8, 79], [8, 4, 82], [12, 4, 81]], [[0, 8, 77], [8, 4, 81], [12, 4, 79]], [[0, 8, 77], [8, 4, 74], [12, 4, 70]], [[0, 6, 73], [6, 2, 74], [8, 8, 76]],
          [[0, 8, 81], [8, 4, 84], [12, 4, 81]], [[0, 8, 79], [8, 4, 76], [12, 4, 79]], [[0, 4, 82], [4, 4, 81], [8, 4, 79], [12, 4, 77]], [[0, 4, 76], [4, 4, 73], [8, 8, 76]]] },
    leads: ['saw', 'fm', 'brass'] },
  2: { name: 'Athanor', line: 'alchemical and strange: a slow swaying chant of low voices with bells, drums and a drone', upb: 12, bpm: [58, 68],
    prog: { A: ['Dm', 'Eb', 'Dm', 'A', 'Dm', 'Gm', 'Eb', 'A'], B: ['Gm', 'Dm', 'Eb', 'A', 'Bb', 'Gm', 'A', 'Dm'] }, alt: { A: { 2: 'Bb' }, B: { 1: 'Bb' } },
    tune: {
      A: [[[0, 6, 62], [6, 4, 65], [10, 2, 64]], [[0, 6, 63], [6, 6, 67]], [[0, 4, 65], [4, 2, 64], [6, 4, 62], [10, 2, 61]], [[0, 8, 64], [8, 4, 57]],
          [[0, 6, 62], [6, 4, 65], [10, 2, 67]], [[0, 6, 70], [6, 4, 69], [10, 2, 67]], [[0, 6, 67], [6, 4, 63], [10, 2, 65]], [[0, 4, 64], [4, 2, 62], [6, 6, 61]]],
      B: [[[0, 6, 67], [6, 4, 70], [10, 2, 69]], [[0, 8, 69], [8, 4, 65]], [[0, 6, 67], [6, 4, 70], [10, 2, 67]], [[0, 12, 64]],
          [[0, 6, 65], [6, 4, 70], [10, 2, 72]], [[0, 6, 74], [6, 4, 70], [10, 2, 67]], [[0, 4, 69], [4, 2, 67], [6, 4, 64], [10, 2, 61]], [[0, 12, 62]]] },
    leads: ['chant', 'organum', 'bell'] },
  3: { name: 'Fuse', line: 'a clock and wood on strings that wait, a tune on cello or horn, then timpani, low brass, choir and an anvil', upb: 16, bpm: [92, 108],
    prog: { A: ['Dm', 'Dm', 'Bb', 'A', 'Gm', 'Dm', 'Edim', 'Dm'], B: ['Bb', 'C', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A'] }, alt: { A: { 1: 'A' }, B: { 3: 'F' } },
    tune: {
      A: [[[6, 2, 74], [8, 2, 77], [10, 6, 76]], [[6, 2, 74], [8, 2, 77], [10, 6, 73]], [[0, 4, 74], [4, 2, 77], [6, 2, 79], [8, 6, 82], [14, 2, 81]], [[0, 6, 81], [6, 2, 79], [8, 8, 76]],
          [[6, 2, 79], [8, 2, 82], [10, 6, 81]], [[6, 2, 77], [8, 2, 81], [10, 6, 79]], [[0, 4, 79], [4, 4, 76], [8, 4, 74], [12, 4, 73]], [[0, 12, 74]]],
      B: [[[0, 6, 77], [6, 2, 74], [8, 8, 82]], [[0, 6, 79], [6, 2, 76], [8, 6, 84], [14, 2, 82]], [[0, 8, 81], [8, 4, 77], [12, 4, 74]], [[0, 4, 76], [4, 4, 77], [8, 8, 74]],
          [[0, 6, 77], [6, 2, 74], [8, 8, 82]], [[0, 6, 79], [6, 2, 76], [8, 6, 84], [14, 2, 86]], [[0, 6, 85], [6, 2, 81], [8, 4, 79], [12, 4, 76]], [[0, 4, 73], [4, 4, 76], [8, 8, 81]]] },
    leads: ['cello', 'cello', 'cello'] }
};
// the short phrases that open an ending (sixteenths of a 16-step bar; scaled for the 12-step theme)
const STING = {
  won: { prog: ['Gm', 'A', 'D5', 'D5'], tune: [[[0, 8, 70], [8, 8, 74]], [[0, 4, 73], [4, 4, 76], [8, 8, 81]], [[0, 16, 74]], null] },
  lost: { prog: ['Dm', 'Bb', 'Edim', 'Edim'], tune: [[[0, 8, 69], [8, 8, 65]], [[0, 8, 62], [8, 8, 58]], [[0, 16, 61]], null] },
  runwon: { prog: ['Bb', 'C', 'D', 'D'], tune: [[[0, 8, 74], [8, 8, 77]], [[0, 8, 76], [8, 8, 79]], [[0, 16, 81]], [[0, 16, 86]]] },
  runlost: { prog: ['Dm', 'Gm', 'Edim', 'Dm'], tune: [[[0, 16, 69]], [[0, 16, 67]], [[0, 8, 64], [8, 8, 61]], [[0, 16, 62]]] }
};
// ---------- the states: level, starting intensity, how the tune is used, the drums, and each layer as [level, enters at intensity] ----------
const ST = {
  title:     { g: 1.0, I: 0.6, tune: 'full', drum: 'main', intro: 2, L: { drums: [1, 0.3], bass: [1, 0], pad: [1, 0], lead: [1, 0], arp: [0.8, 0.2], vox: [0.8, 0.5], bell: [0.8, 0.35] } },
  bench:     { g: 0.8, I: 0.3, tune: 'frag', drum: 'light', pedal: true, L: { drums: [0.55, 0.2], bass: [0.75, 0], pad: [1, 0], lead: [0.85, 0], arp: [0.6, 0.25], vox: [0.6, 0.6], bell: [0.6, 0.15] } },
  shop:      { g: 0.85, I: 0.4, tune: 'full', drum: 'light', forms: ['BABA', 'BBAB'], L: { drums: [0.8, 0.1], bass: [1, 0], pad: [0.55, 0], lead: [0.9, 0], arp: [0.9, 0], vox: [0.5, 0.75], bell: [0.6, 0.3] } },
  pick:      { g: 0.75, I: 0.3, tune: 'ask', drum: 'tick', prog: ['Dsus', 'Dm', 'Bb', 'Bb', 'Gm', 'Gm', 'Asus', 'A'], L: { drums: [0.5, 0.15], bass: [0.6, 0.2], pad: [1, 0], lead: [0.85, 0], arp: [0.7, 0], vox: [0.5, 0.55], bell: [0.5, 0.2] } },
  plan:      { g: 0.85, I: 0.25, tune: 'frag', drum: 'tick', L: { drums: [0.6, 0.1], bass: [0.9, 0], pad: [0.8, 0], lead: [0.7, 0.1], arp: [0.7, 0.3], vox: [0.6, 0.7], bell: [0.5, 0.4] } },
  chain:     { g: 0.5, I: 0.08, cut: 0.25, drone: true },
  overreact: { g: 1.25, I: 1, tune: 'oct', drum: 'heavy', settle: 8, cut: 0.08, fadeIn: [0.3, 0.45], L: { drums: [1, 0], bass: [1, 0], pad: [1, 0], lead: [1.1, 0], arp: [0.9, 0], vox: [1, 0], bell: [1, 0] } },
  won:       { g: 0.95, I: 0.55, tune: 'frag', drum: 'light', cut: 0.3, sting: 'won', L: { drums: [0.8, 0.2], bass: [1, 0], pad: [1, 0], lead: [1, 0], arp: [0.7, 0.3], vox: [0.8, 0.3], bell: [0.8, 0.2] } },
  lost:      { g: 0.8, I: 0.15, tune: 'none', drum: 'none', cut: 0.3, sting: 'lost', pedal: true, L: { drums: [0.4, 0.5], bass: [0.8, 0], pad: [1, 0], lead: [0.9, 0], arp: [0, 9], vox: [0.9, 0], bell: [0.7, 0] } },
  runwon:    { g: 1.15, I: 0.9, tune: 'oct', drum: 'heavy', settle: 12, cut: 0.3, sting: 'runwon', L: { drums: [1, 0], bass: [1, 0], pad: [1, 0], lead: [1.1, 0], arp: [0.9, 0], vox: [1, 0], bell: [1, 0] } },
  runlost:   { g: 0.85, I: 0.2, tune: 'low', drum: 'none', cut: 0.4, sting: 'runlost', tm: 0.7, pedal: true, L: { drums: [0.4, 0.6], bass: [0.8, 0], pad: [1, 0], lead: [1, 0], arp: [0, 9], vox: [1, 0], bell: [0.8, 0] } }
};
const LAY = { drums: { rev: 0.07, dly: 0, sat: 2.2 }, bass: { rev: 0, dly: 0, sat: 1.6 }, pad: { rev: 0.35, dly: 0 }, lead: { rev: 0.3, dly: 0.22 }, arp: { rev: 0.2, dly: 0.3 }, vox: { rev: 0.5, dly: 0 }, bell: { rev: 0.45, dly: 0.18 } };
// each theme's own balance of the layers (set by measuring each layer alone)
const LMIX = { 1: { drums: 0.6, bass: 0.55, pad: 1, lead: 0.7, arp: 3.5, vox: 1, bell: 2.5 }, 2: { drums: 0.6, bass: 0.45, pad: 0.5, lead: 0.85, arp: 3, vox: 1, bell: 1 }, 3: { drums: 0.5, bass: 0.6, pad: 1.5, lead: 0.75, arp: 2.5, vox: 1, bell: 1 } };
const FORMS = ['AABA', 'ABAB', 'AABB', 'ABAA'], FRAG = [[1, 1, 0, 0, 1, 1, 0, 0], [1, 0, 0, 0, 1, 0, 1, 0], [0, 0, 1, 1, 0, 0, 1, 1], [1, 1, 1, 1, 0, 0, 0, 0], [1, 1, 0, 0, 0, 0, 1, 1], [0, 0, 0, 0, 1, 1, 1, 1]];

// ====================================================================================================================
// the engine: one per audio context (the live one, or an offline one for a render)
// ====================================================================================================================
function Engine(c, o) {
  o = o || {}; const E = this, G = v => { const g = c.createGain(); if (v !== undefined) g.gain.value = v; return g; };
  E.c = c; E.G = G; E.th = clamp(Math.round(+o.theme) || 6, 1, NTH); E.gv = E.th >= 4; E.arr = ARR[o.arr] ? o.arr : 'c'; E.slow = 0.5; E.sg = 0; E.playI = 0.2; E.rnd = 1; E.I = 0.5; E.vol = o.volume === undefined ? 0.7 : o.volume; E.seed = o.seed || 1; E.dry = !!o.dry; E.solo = o.solo || null;
  E.jr = RNG(E.seed * 31 + 5); E.deck = null; E.pending = null; E.nDeck = 0; E.log = []; E.nodes = 0; E.spans = []; E.stepN = 0; E.cix = 0;
  E.sum = G(MASTER); E.duckG = G(1); E.volG = G(E.vol); E.out = G(1); E.duckG.connect(E.volG); E.volG.connect(E.out);
  // the grooves go to "tape": a slow wobble of pitch (a short delay whose length wanders), a faster flutter, a soft squash. The older themes go straight through.
  E.plain = G(E.gv ? 0 : 1); E.sum.connect(E.plain); E.plain.connect(E.duckG);
  const td = c.createDelay(0.06); td.delayTime.value = 0.014; const w1 = c.createOscillator(), w2 = c.createOscillator(), fl = G(0.00005); E.wowG = G(0.0007 * wowOf(E.th)); w1.frequency.value = 0.53; w2.frequency.value = 6.1; w1.connect(E.wowG); E.wowG.connect(td.delayTime); w2.connect(fl); fl.connect(td.delayTime); w1.start(); w2.start();
  const tsh = c.createWaveShaper(), tcu = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; tcu[i] = Math.tanh(x * 1.5) / Math.tanh(1.5); } tsh.curve = tcu; tsh.oversample = '2x'; E.taped = G(E.gv ? 1 : 0); E.sum.connect(td); td.connect(tsh); tsh.connect(E.taped); E.taped.connect(E.duckG);
  // noise, made here from a seed
  const nb = c.createBuffer(1, Math.floor(c.sampleRate * 2), c.sampleRate), nd = nb.getChannelData(0), nr = RNG(4711); for (let i = 0; i < nd.length; i++) nd[i] = nr() * 2 - 1; E.noise = nb;
  // a room: a made impulse (decaying noise, darker towards the end) in a convolver
  E.revIn = G(1); E.cv = c.createConvolver(); E.cv.normalize = true; const rr = G(0.55); E.rr = rr; E.revIn.connect(E.cv); E.cv.connect(rr); rr.connect(E.sum); E.mkRoom();
  // an echo
  E.dlyIn = G(1); E.dl = c.createDelay(1.5); E.dl.delayTime.value = 0.4; const fb = G(0.36), dlp = c.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2400; const dr = G(0.5);
  E.dlyIn.connect(E.dl); E.dl.connect(dlp); dlp.connect(fb); fb.connect(E.dl); dlp.connect(dr); dr.connect(E.sum);
  E.fx = G(1); E.fx.connect(E.sum); const fr = G(0.3); E.fx.connect(fr); fr.connect(E.revIn);
  E.sat = {};
}
const EP = Engine.prototype;
// the room of the engine: made again when a track with another hall is chosen
EP.mkRoom = function () {
  const E = this, c = E.c, hall = hallOf(E); if (E.hall === hall) return; const first = E.hall === undefined; E.hall = hall;
  const len = Math.floor(c.sampleRate * 3.0), ir = c.createBuffer(2, len, c.sampleRate), pre = Math.floor(0.025 * c.sampleRate);
  for (let chn = 0; chn < 2; chn++) { const d = ir.getChannelData(chn), r = RNG(99 + chn * 31); let lp = 0; for (let i = 0; i < len; i++) { const x = i / len, w = r() * 2 - 1, k = 0.8 - 0.68 * x; lp += k * (w - lp); d[i] = i < pre ? 0 : lp * Math.pow(1 - x, 2.2) * Math.exp(-hall * x) * (i < pre + 400 ? (i - pre) / 400 : 1); } for (let j = 0; j < 9; j++) { const at = Math.floor((0.007 + r() * 0.07) * c.sampleRate); d[at] += (r() - 0.5) * 1.6; } }   // a hall: a few early walls, then a tail that darkens
  if (first || !E.cv.buffer) { E.cv.buffer = ir; return; }
  // another track's hall while music is sounding: a new room takes the sound from here on and the old one rings out (changing a room's impulse under a tail clicks)
  const old = E.cv, cv = c.createConvolver(); cv.normalize = true; cv.buffer = ir; try { E.revIn.disconnect(old); } catch (e) { /* not connected */ } E.revIn.connect(cv); cv.connect(E.rr); E.cv = cv;
  if (typeof c.startRendering !== 'function' && root.setTimeout) root.setTimeout(() => { try { old.disconnect(); } catch (e) { /* gone */ } }, 4500);
};
EP.shaper = function (k, over) { const key = k.toFixed(1); if (!this.sat[key]) { const n = 1024, cu = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; cu[i] = Math.tanh(x * k) / Math.tanh(k); } this.sat[key] = cu; } const w = this.c.createWaveShaper(); w.curve = this.sat[key]; if (over) w.oversample = '4x'; return w; };
// where the music goes: a node of the effects' bus, or (null) its own limiter
EP.attach = function (node) {
  const E = this, c = E.c; try { E.out.disconnect(); } catch (e) { /* nothing connected */ }
  if (node) { E.out.gain.value = 1; E.out.connect(node); E.shared = true; return; }
  if (!E.lim) { E.own = E.G(TRIM); E.lim = c.createDynamicsCompressor(); E.lim.threshold.value = -6; E.lim.knee.value = 4; E.lim.ratio.value = 20; E.lim.attack.value = 0.002; E.lim.release.value = 0.15; E.own.connect(E.lim); E.lim.connect(c.destination); }
  E.out.connect(E.own); E.shared = false;
};
// how unhinged: 0 in round 1 (sane, in tune, in time) to 1 in round 9 (owner, 12 November: "more unhinged the deeper into chemistry")
EP.u = function () { return (this.rnd - 1) / 8; };
// the same, bowed so the middle rounds are already plainly odd
EP.w = function () { return Math.pow(this.u(), 0.8); };
// the heat of a groove: the slow value the game raises turn by turn, plus the surge of a chain on top of it
EP.setTheme = function (k) { const E = this; E.th = k; E.gv = k >= 4; E.plain.gain.value = E.gv ? 0 : 1; E.taped.gain.value = E.gv ? 1 : 0; E.wowG.gain.value = 0.0007 * wowOf(k) * (1 + 2.5 * E.w()); E.mkRoom(); E.glide = null; };
EP.heat = function (t, tau) { const E = this; E.I = clamp(E.slow + (1 - E.slow) * E.sg, 0, 1); if (E.deck) E.setI(E.deck, E.I, t, tau || 0.25); if (E.gv && E.state === 'chain' && E.chainTrim) E.chainTrim(t, true); };
// in a chain the effects are the star: the groove gets denser and brighter with the surge but steps back in level, and comes forward again after
EP.chainTrim = function (t, on) { const dk = this.deck; if (dk && dk.sg0 && !dk.dead) dk.gs.forEach(g => g.gain.setTargetAtTime(dk.sg0 * (on ? trimOf(this.th, this.sg) : 1), t, on ? 0.12 : 0.5)); };
EP.stat = function (n, t0, t1) { this.nodes += n; this.spans.push(t0, t1, n); };
EP.note = function (dst, t, f, kind) { const d = this.cur; if (d) d.push((dst.__n || '?') + ':' + Math.round((t - d.t) / d.spu) + ':' + Math.round(69 + 12 * Math.log2(Math.max(f, 1) / 440)) + (kind || '')); };

// ---------- voices ----------
const skipRe = (E, dst, t) => t < E.reT - 0.002 || dst.__n === 'drums' || dst === E.fx;
// a voice that has ended is taken off the graph at once (not left for the garbage collector)
const done = n => { try { n.disconnect(); } catch (e) { /* gone */ } };
// a pitched voice: o = { t, f, g, type, det [cents...], a, h, d, lp, lp1, lpt, q, f1, ft, fm { r, i, i1, d }, vib { f, c, in }, pan }
function V(E, dst, o) {
  const u = E.w(), ln = dst.__n, mel = ln === 'lead' || ln === 'arp' || ln === 'bell' || ln === 'vox', j1 = E.jr(), j2 = E.jr(), j3 = E.jr();
  let f0 = o.f; if (ln === 'arp' && j3 < 0.07 * u) f0 *= j1 < 0.5 ? 1.0595 : 1.4142;                      // a wrong note in the arpeggio: a semitone or a tritone off
  if (E.reT && skipRe(E, dst, o.t)) return; E.note(dst, o.t, f0); if (E.dry || (E.solo && dst.__n !== E.solo)) return;
  const slip = u > 0.2 && ln && ln !== 'bass' ? (j1 - 0.35) * (mel ? 0.04 : 0.012) * u : 0, drift = mel ? (j2 - 0.5) * 30 * u : 0, wide = 1 + u;
  const c = E.c, t = Math.max(o.t + slip, 0), a = o.a || 0.004, h = o.h || 0, d = o.d || 0.15, end = t + a + h + d, dets = o.det || [0], gg = o.g / Math.sqrt(dets.length);
  o = Object.assign({}, o, { f: f0 });
  const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gg, t + a); g.gain.setValueAtTime(gg, t + a + h); g.gain.setTargetAtTime(0, t + a + h, d / 4.5);
  let head = g, n = 1, tail = g;
  if (o.lp) { const f = c.createBiquadFilter(); f.type = o.ftype || 'lowpass'; f.Q.value = o.q || 0.7; f.frequency.setValueAtTime(o.lp, t); if (o.lp1) f.frequency.exponentialRampToValueAtTime(o.lp1, t + (o.lpt || a + h + d)); f.connect(g); head = f; n++; }
  let lfo = null; if (o.vib) { lfo = c.createOscillator(); lfo.frequency.value = o.vib.f; const lg = c.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(o.vib.c, t + (o.vib.in || 0.25)); lfo.connect(lg); lfo.start(t); lfo.stop(end + 0.03); lfo = lg; n += 2; }
  dets.forEach((dt, i) => {
    const os = c.createOscillator(); os.type = Array.isArray(o.type) ? o.type[i % o.type.length] : (o.type || 'sine'); os.frequency.setValueAtTime(o.f, t); if (o.f1) os.frequency.exponentialRampToValueAtTime(o.f1, t + (o.ft || 0.05)); os.detune.value = dt * wide + drift;
    if (lfo) lfo.connect(os.detune);
    if (o.fm && i === 0) { const m = c.createOscillator(), mg = c.createGain(); m.frequency.setValueAtTime(o.f * o.fm.r, t); mg.gain.setValueAtTime(o.f * o.fm.i, t); mg.gain.exponentialRampToValueAtTime(Math.max(0.01, o.f * (o.fm.i1 || 0.01)), t + (o.fm.d || d)); m.connect(mg); mg.connect(os.frequency); m.start(t); m.stop(end + 0.03); n += 2; }
    os.connect(head); os.start(t); os.stop(end + 0.03); n++; if (i === dets.length - 1) os.onended = () => done(tail);
  });
  if (o.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp(o.pan, -1, 1); g.connect(p); p.connect(dst); tail = p; n++; } else g.connect(dst);
  E.stat(n, t, end);
}
// noise: o = { t, g, ft, f, f1, fT, q, hp, a, d, pan }
function N(E, dst, o) {
  if (E.reT && skipRe(E, dst, o.t)) return; E.note(dst, o.t, o.f || 1000, 'n'); if (E.dry || (E.solo && dst.__n !== E.solo)) return;
  const c = E.c, t = Math.max(o.t, 0), a = o.a || 0.001, d = o.d || 0.05, end = t + a + d;
  const src = c.createBufferSource(); src.buffer = E.noise; src.loop = true; const f = c.createBiquadFilter(); f.type = o.ft || 'bandpass'; f.Q.value = o.q || 0.7; f.frequency.setValueAtTime(o.f || 1000, t); if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + (o.fT || a + d));
  const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.g, t + a); g.gain.setTargetAtTime(0, t + a, d / 4.5);
  let n = 3; src.connect(f); let tail = f; if (o.hp) { const h = c.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = o.hp; f.connect(h); tail = h; n++; } tail.connect(g);
  let out = g; if (o.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp(o.pan, -1, 1); g.connect(p); p.connect(dst); out = p; n++; } else g.connect(dst);
  src.onended = () => done(out); src.start(t, (t * 0.731) % 1.7); src.stop(end + 0.03); E.stat(n, t, end);
}
// a low singing voice: two saws through two mouth resonances and a body; vow 0 ah, 1 oh, 2 oo
const VOW = [[700, 1150], [450, 820], [330, 720]];
function chant(E, dst, o) {
  if (E.reT && skipRe(E, dst, o.t)) return; E.note(dst, o.t, o.f, 'v'); if (E.dry || (E.solo && dst.__n !== E.solo)) return;
  const uu = E.w(), drift = (E.jr() - 0.5) * 30 * uu, c = E.c, t = Math.max(o.t + (uu > 0.2 ? E.jr() * 0.04 * uu : 0), 0), a = o.a || 0.08, h = o.h || 0, d = o.d || 0.3, end = t + a + h + d, vw = VOW[o.vow || 0];
  const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.g, t + a); g.gain.setValueAtTime(o.g, t + a + h); g.gain.setTargetAtTime(0, t + a + h, d / 4.5);
  const f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), f0 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = vw[0]; f1.Q.value = 5; f2.type = 'bandpass'; f2.frequency.value = vw[1]; f2.Q.value = 7; f0.type = 'lowpass'; f0.frequency.value = 280; f0.Q.value = 0.5;
  const b0 = c.createGain(); b0.gain.value = 0.35; f0.connect(b0); b0.connect(g); f1.connect(g); f2.connect(g);
  const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 4.6 + (o.f % 7) * 0.12; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(14, t + 0.5); lfo.connect(lg); lfo.start(t); lfo.stop(end + 0.03);
  [-8, 7].forEach(dt => { const os = c.createOscillator(); os.type = 'sawtooth'; os.frequency.setValueAtTime(o.f * 0.985, t); os.frequency.linearRampToValueAtTime(o.f, t + 0.07); os.detune.value = dt * (1 + uu) + drift; lg.connect(os.detune); os.connect(f0); os.connect(f1); os.connect(f2); os.start(t); os.stop(end + 0.03); });
  let n = 10, out = g; if (o.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp(o.pan, -1, 1); g.connect(p); p.connect(dst); out = p; n++; } else g.connect(dst);
  lfo.onended = () => done(out); E.stat(n, t, end);
}
const I_ = {
  bell(E, dst, t, f, g, d, pan) { V(E, dst, { t, f, g, a: 0.002, d, pan, fm: { r: 3.51, i: 2.4, i1: 0.04, d: d * 0.45 } }); V(E, dst, { t, f: f * 2.76, g: g * 0.22, a: 0.002, d: d * 0.3, pan: -(pan || 0) }); },
  kick(E, dst, t, g, lo) { V(E, dst, { t, f: lo ? 105 : 135, f1: 42, ft: 0.06, g: g * 0.8, a: 0.001, d: lo ? 0.42 : 0.28 }); V(E, dst, { t, f: 240, f1: 110, ft: 0.025, type: 'triangle', g: g * 0.5, a: 0.0008, d: 0.05 }); },
  snare(E, dst, t, g) { N(E, dst, { t, ft: 'bandpass', f: 1700, q: 0.6, g, a: 0.0008, d: 0.17, pan: -0.1 }); V(E, dst, { t, f: 190, f1: 150, ft: 0.04, type: 'triangle', g: g * 0.55, a: 0.0008, d: 0.09 }); },
  rim(E, dst, t, g) { V(E, dst, { t, f: 820, type: 'triangle', g, a: 0.0006, d: 0.035, pan: 0.2 }); N(E, dst, { t, ft: 'bandpass', f: 2600, q: 2, g: g * 0.5, a: 0.0005, d: 0.02, pan: 0.2 }); },
  hat(E, dst, t, g, open, pan) { N(E, dst, { t, ft: 'highpass', f: 6500, g, a: 0.0006, d: open ? 0.11 : 0.03, pan: pan === undefined ? 0.25 : pan }); },
  tom(E, dst, t, f, g, pan) { V(E, dst, { t, f: f * 1.45, f1: f, ft: 0.1, g, a: 0.001, d: 0.32, pan }); N(E, dst, { t, ft: 'lowpass', f: 900, g: g * 0.3, a: 0.0008, d: 0.05, pan }); },
  thud(E, dst, t, g) { V(E, dst, { t, f: 96, f1: 54, ft: 0.09, g: g * 0.7, a: 0.002, d: 0.5 }); N(E, dst, { t, ft: 'bandpass', f: 520, q: 0.8, g: g * 0.8, a: 0.001, d: 0.1 }); },
  clank(E, dst, t, f, g, pan) { V(E, dst, { t, f, g, a: 0.0008, d: 0.5, pan, fm: { r: 1.414, i: 2.8, i1: 0.1, d: 0.2 } }); V(E, dst, { t, f: f * 2.76, g: g * 0.25, a: 0.0006, d: 0.15, pan }); },
  tick(E, dst, t, g, pan) { V(E, dst, { t, f: 1150, f1: 900, ft: 0.02, type: 'triangle', g, a: 0.0005, d: 0.03, pan }); },
  shake(E, dst, t, g, pan) { N(E, dst, { t, ft: 'bandpass', f: 5200, q: 1.2, g, a: 0.004, d: 0.04, pan }); },
  crash(E, dst, t, g) { N(E, dst, { t, ft: 'highpass', f: 3000, g, a: 0.001, d: 1.6, pan: -0.3 }); N(E, dst, { t, ft: 'bandpass', f: 5200, q: 0.5, g: g * 0.7, a: 0.001, d: 1.1, pan: 0.3 }); }
};
// one note of the tune on the chosen instrument
function leadNote(E, dk, inst, t, dur, m, g, bright) {
  const L = dk.L.lead.in, f = mf(m), pan = dk.sec.lv === 1 ? 0.12 : -0.08;
  if (inst === 'saw') { V(E, L, { t, f, type: 'sawtooth', det: [-10, 9], g: g * 0.3, a: 0.012, h: dur * 0.82, d: 0.16, lp: 1400 + 2800 * bright, lp1: 900 + 900 * bright, lpt: dur, q: 2.5, pan, vib: dur > 0.5 ? { f: 5.2, c: 9, in: 0.35 } : null }); V(E, L, { t, f: f / 2, type: 'triangle', g: g * 0.12, a: 0.01, h: dur * 0.8, d: 0.12 }); }
  else if (inst === 'fm') { V(E, L, { t, f, g: g * 0.32, a: 0.003, h: dur * 0.5, d: Math.max(0.35, dur * 0.9), pan, fm: { r: 2, i: 2.6 + bright, i1: 0.35, d: 0.3 } }); V(E, L, { t, f: f * 2.005, g: g * 0.06, a: 0.003, d: 0.25, pan: -pan }); }
  else if (inst === 'pluck') { V(E, L, { t, f, type: 'sawtooth', det: [-6, 6], g: g * 0.3, a: 0.002, h: dur * 0.2, d: Math.max(0.25, dur * 0.7), lp: 2600 + 2000 * bright, lp1: 500, lpt: 0.22, q: 3, pan }); }
  else if (inst === 'brass') { V(E, L, { t, f, type: 'sawtooth', det: [-13, 0, 12], g: g * 0.36, a: 0.03, h: dur * 0.8, d: 0.2, lp: 500, lp1: 1800 + 2400 * bright, lpt: Math.min(0.18, dur * 0.6), q: 1.2, pan }); V(E, L, { t, f: f / 2, type: 'sawtooth', det: [-7, 7], g: g * 0.18, a: 0.03, h: dur * 0.8, d: 0.2, lp: 1200, pan: -pan }); }
  else if (inst === 'bell') { I_.bell(E, L, t, f * 2, g * 0.24, Math.max(0.9, dur * 1.6), pan); }
  else if (inst === 'chant' || inst === 'organum') { chant(E, L, { t, f: f / 2, g: g * 0.5, a: 0.07, h: dur * 0.85, d: 0.25, vow: 1, pan: -0.25 }); chant(E, L, { t: t + 0.012, f: f / 2, g: g * 0.36, a: 0.09, h: dur * 0.85, d: 0.3, vow: 0, pan: 0.3 }); if (inst === 'organum') chant(E, L, { t, f: f / 2 * 1.4983, g: g * 0.3, a: 0.08, h: dur * 0.85, d: 0.25, vow: 2, pan: 0.05 }); }
}

// ---------- a deck: one state's music, with its own layer buses, fading in and out as a whole ----------
EP.mkDeck = function (state, t0, fin) {
  const E = this, c = E.c, G = E.G, S = ST[state], T = TH[E.th], dk = { E, state, S, T, t0, nextT: t0, bar: 0, sb: 0, secN: 0, sec: null, L: {}, rng: RNG(E.seed * 7919 + hash(state) + (E.nDeck++) * 977 + E.th * 131), form: 'AABA', ends: [], mix: E.gv ? GMIX[E.th] : E.th === 3 ? FMIX[E.arr] : LMIX[E.th] };
  dk.sw = !E.gv ? (u => u) : TK[E.th] && TK[E.th].swing ? TK[E.th].swing(E.w()) : swingOf(E.th, E.w());
  dk.upb = T.upb; dk.setTempo = () => { const d = (E.rnd - 1) / 8, bpm = (T.bpm[0] + (T.bpm[1] - T.bpm[0]) * d) * (S.tm || 1); dk.spu = T.upb === 12 ? 60 / bpm / 6 : 60 / bpm / 4; }; dk.setTempo();
  const a = fin || [1, 0.01], sg = S.g * (E.gv ? (S.I > 0.8 ? 0.33 : state === 'plan' ? 0.62 : 0.34) * tkG(E.th, state, S) : E.th !== 3 ? 1 : S.drone ? 0.9 : S.I > 0.8 ? 0.53 : 0.66);   // Fuse's loud states are many instruments at once: held back so the limiter is not what sets their level
  dk.sg0 = sg; dk.gs = ['dry', 'rev', 'dly'].map((k, i) => { const g = G(0); g.gain.setValueAtTime(a[0] * sg, t0 - 0.01); g.gain.setTargetAtTime(sg, t0, a[1]); g.connect(i === 0 ? E.sum : i === 1 ? E.revIn : E.dlyIn); return g; });
  if (E.gv) { dk.tone = c.createBiquadFilter(); dk.tone.type = 'lowpass'; dk.tone.Q.value = 0.5; dk.tone.frequency.value = 6000; dk.tone.connect(dk.gs[0]); }   // a groove opens up as it heats: the whole deck through a filter that rises with the heat
  if (!S.drone) Object.keys(LAY).forEach(k => {
    const cf = (E.gv ? (TK[E.th] && TK[E.th].lay) || LAYG : E.th === 3 ? LAYF : LAY)[k], inp = G(1), lv = G(0), nx = G(1); inp.__n = k; inp.connect(nx); let x = nx;
    if (k === 'bass' || k === 'pad' || cf.pump) { const p = G(1); x.connect(p); x = p; dk.L[k + 'Pump'] = p; }
    const uu = E.w(), drive = cf.sat ? cf.sat + 2.2 * uu : (k === 'lead' || k === 'vox' || k === 'arp') && uu > 0.1 ? 1 + 2.5 * uu : 0;   // more drive as the rounds go on, levelled so it gets rougher, not louder
    if (drive) { const pg = cf.sat ? (k === 'drums' ? 0.9 : 0.8) : 1 + 1.5 * uu, pre = G(pg), sh = E.shaper(drive, !cf.sat), post = G(cf.sat ? Math.pow(cf.sat / drive, E.gv ? 0.65 : 0.8) : 1 / (pg * Math.pow(drive, E.th === 5 ? 0.4 : E.gv ? 0.65 : 0.8))); x.connect(pre); pre.connect(sh); sh.connect(post); x = post; }
    if (cf.ins) { const io = cf.ins(E, dk, k); x.connect(io.i); x = io.o; }
    x.connect(lv); lv.connect(dk.tone || dk.gs[0]); if (cf.rev) { const s = G(cf.rev); lv.connect(s); s.connect(dk.gs[1]); } if (cf.dly) { const s = G(cf.dly); lv.connect(s); s.connect(dk.gs[2]); }
    dk.L[k] = { in: inp, lv, nx };
  });
  if (E.gv && E.th <= 5 && dk.L.vox && !E.dry) { dk.rot = c.createOscillator(); dk.rot.frequency.value = 0.9; const rg = G(0.25); dk.rot.connect(rg); rg.connect(dk.L.vox.in.gain); dk.rot.start(Math.max(0, t0 - 0.01)); dk.ends.push(dk.rot); }   // the turning speaker: slow when cool, fast when hot
  if (S.drone) (E.th === 3 ? buildDrone3 : buildDrone)(E, dk);
  E.setI(dk, E.I, t0 - 0.01, 0.001);
  return dk;
};
const thOf = (dk, k) => { const l = dk.S.L[k]; return !l ? 9 : dk.E.gv ? (k === 'lead' && dk.state === 'plan' ? leadAt(dk.E.th) : l[1] > 5 ? 9 : 0) : k === 'vox' && l[1] < 5 ? l[1] - 0.55 * dk.E.u() : l[1]; };
const layLvl = (l, I, th) => !l || l[0] <= 0 ? 0 : l[0] * (th <= 0 ? 1 : clamp((I - th) / 0.12 + 0.25, 0, 1) * (I >= th - 0.03 ? 1 : 0)) * (0.78 + 0.22 * I);
EP.setI = function (dk, I, t, tau) {
  if (dk.S.drone) { droneI(this, dk, I, t, tau); return; }
  if (dk.tone) dk.tone.frequency.setTargetAtTime(TK[this.th] && TK[this.th].tone ? TK[this.th].tone(I) : 6500 * Math.pow(2, 1.6 * I), t, tau || 0.2); if (dk.rot) dk.rot.frequency.setTargetAtTime(I > 0.85 ? 6.6 : 0.9, t, 0.8);
  Object.keys(LAY).forEach(k => dk.L[k].lv.gain.setTargetAtTime(layLvl(dk.S.L[k], I, thOf(dk, k)) * dk.mix[k] * (dk.E.gv ? 0.95 + 0.15 * I : 1), t, tau || 0.25));
};
EP.fadeOut = function (dk, t, tau) { dk.gs.forEach(g => g.gain.setTargetAtTime(0, t, tau)); dk.dead = t + tau * 6; dk.ends.forEach(o => { try { o.stop(dk.dead + 0.1); } catch (e) { /* already stopped */ } }); };
const on = (dk, k) => { const l = dk.S.L[k]; return !!l && l[0] > 0 && dk.E.I >= thOf(dk, k) - 0.05; };
function pump(dk, t, depth, rel) { ['bassPump', 'padPump'].forEach((k, i) => { const p = dk.L[k].gain, lo = i ? 1 - (1 - depth) * 0.7 : depth; p.setValueAtTime(lo, t); p.linearRampToValueAtTime(1, t + rel); }); }
const pat = (s, fn) => { for (let i = 0; i < s.length; i++) if (s[i] !== '.') fn(i, s[i]); };

// a new section: 8 bars (4 for an opening): which tune, which chords, and this section's choices
function newSection(E, dk) {
  const r = dk.rng, S = dk.S, T = dk.T, n = dk.secN++, k16 = T.upb / 16;
  if (dk.secM === undefined) dk.secM = 0;
  const sting = S.sting && n === 0, intro = S.intro && n === 0, SG = E.gv ? (TK[E.th] && TK[E.th].sting) || STINGG : STING, sprog = !S.prog ? null : E.gv ? [0, 0, 2, 2, 1, 1, 3, 3].map(i => T.chain[i]) : S.prog;
  let type, len = 8, prog, base;
  if (sting) { type = 'S'; len = 4; prog = SG[S.sting].prog.slice(); base = SG[S.sting].tune.map(b => b && b.map(x => [Math.round(x[0] * k16), Math.max(1, Math.round(x[1] * k16)), x[2]])); }
  else if (intro) { type = 'I'; len = S.intro; prog = T.prog.A.slice(0, len); base = null; }
  else { if (dk.secM % 4 === 0) dk.form = r.pick(S.forms || T.forms || FORMS); type = dk.form[dk.secM % 4]; dk.secM++; prog = (sprog || T.prog[type]).slice(); base = T.tune[type];
    const al = T.alt[type]; if (!S.prog && al && dk.secM > 1) Object.keys(al).forEach(b => { if (r.chance(0.3)) prog[b] = al[b]; }); }
  const first = dk.secM <= 1, mode = sting ? 'full' : E.gv && dk.state === 'plan' && E.I > 0.6 ? 'full' : S.tune, plain = first || r.chance(E.gv ? 0.25 : 0.4);   // the tune comes back as written about two sections in five
  const mask = !base ? [] : mode === 'none' ? [0, 0, 0, 0, 0, 0, 0, 0] : mode === 'frag' ? r.pick(FRAG) : mode === 'ask' ? r.pick([[1, 1, 0, 0, 1, 1, 0, 0], [1, 0, 0, 0, 1, 1, 0, 0], [1, 1, 0, 0, 0, 0, 1, 0]]) : [1, 1, 1, 1, 1, 1, 1, 1];
  const tune = [];
  for (let b = 0; b < len; b++) {
    let bar = base && mask[b] && base[b] ? base[b].map(x => sprog ? [x[0], x[1], nearTone(x[2], CH[prog[b]])] : x.slice()) : null;   // a state with its own chords bends the tune onto them
    if (bar && !plain && !sting) { const v = r() * 1.6;
      if (v < 0.16) bar = bar.reduce((acc, x) => { if (x[1] >= T.upb * 3 / 8) { acc.push([x[0], x[1] - 4, x[2]], [x[0] + x[1] - 4, 2, upTone(x[2], prog[b] === 'A', E.th)], [x[0] + x[1] - 2, 2, x[2]]); } else acc.push(x); return acc; }, []);   // a turn on the long notes
      else if (v < 0.26 && b % 4 !== 0) bar = bar.map(x => [Math.min(T.upb - 1, x[0] + 2), x[1], x[2]]);                                                                                  // late by an eighth
      else if (v < 0.34 && b % 4 === 3) bar = null;                                                                                                                                         // the phrase is left open
      else if (v < 0.42) bar = bar.filter((x, i) => i === 0 || x[1] > 2);                                                                                                                   // plainer
      else if (v < 0.5 && bar.length > 2) { const l = bar[bar.length - 1]; bar[bar.length - 1] = [l[0], l[1], nearTone(l[2] + (r.chance(0.5) ? 3 : -3), CH[prog[b]])]; }              // a different last note
    }
    tune.push(bar);
  }
  dk.sec = { type, len, prog, tune, lv: first ? 0 : r.i(T.leads.length), lo: !first && r.chance(E.th === 3 ? 0.3 : 0.2) ? (E.th !== 3 && r.chance(0.5) ? 12 : -12) : 0, bv: r.i(4), dv: r.i(6), av: r.i(6), brk: !first && !sting && r.chance(0.16), fill: r.chance(0.75), pedal: !!S.pedal || (!first && r.chance(0.15)), n };
  dk.sb = 0;
}
EP.schedBar = function (dk) {
  const E = this; if (dk.S.drone) { droneTick(E, dk, dk.nextT); dk.nextT += 0.5; return; }
  if (!dk.sec || dk.sb >= dk.sec.len) newSection(E, dk);
  if (E.gv && E.state !== 'chain' && E.sg > 0.005) { E.sg *= 0.5; E.heat(dk.nextT, 0.6); }                                       // after a chain the surge drains away over a few bars; the slow value stays
  dk.setTempo(); const s = dk.sec, b = dk.sb, t = dk.nextT, inChain = E.gv && E.state === 'chain' && dk.state === 'plan', name = inChain ? dk.T.chain[E.cix] : s.prog[b % s.prog.length], ch = CH[name], u = E.u(), w = E.w();
  dk.spu *= 1 - 0.07 * w * (b / Math.max(1, s.len - 1));                                                     // the tempo runs away through the section, then is pulled back
  E.cur = []; E.cur.t = t; E.cur.spu = dk.spu; dk.curCh = ch;
  if (dk.bar === 0 && !dk.S.cut) { if (E.gv) { /* a groove needs no marker: its own kit is there */ } else if (E.th === 3) Sm(E, E.fx, { i: 'bdrum', t, g: 0.22 }); else { I_.kick(E, E.fx, t, 0.16, true); N(E, E.fx, { t, ft: 'highpass', f: 5000, g: 0.025, a: 0.002, d: 1.2 }); } }
  if (dk.S.settle && dk.bar === dk.S.settle) { dk.drum = 'main'; E.I = 0.72; E.setI(dk, E.I, t, 0.4); }                // a long celebration eases off after its first statement
  PLAY[E.th](E, dk, t, b, ch, name);
  dk.hist = (dk.hist || []).slice(-1).concat([{ t, b, spu: dk.spu, sec: s, bar: dk.bar, end: t + dk.upb * dk.spu }]);
  writeTune(E, dk, t, b, ch, name, s, inChain, u, w);
  const full = E.cur.join('|'), lead = E.cur.filter(x => x.slice(0, 4) === 'lead').join('|');
  E.log.push({ t: +t.toFixed(3), state: dk.state, sec: s.type, b, ch: name, sig: hash(full), lead: lead ? hash(lead) : 0, n: E.cur.length }); E.cur = null;
  dk.bar++; dk.sb++; dk.nextT = t + dk.upb * dk.spu;
};

// the tune and the late-round mischief of one bar
function writeTune(E, dk, t, b, ch, name, s, inChain, u, w) {
  const bar = s.tune[b], gl = (TK[E.th] && TK[E.th].lead) || grooveLead;
  if (bar && on(dk, 'lead')) {
    const minor = ['Dm', 'Bb', 'Gm', 'Eb', 'Dsus', 'Edim'].indexOf(name) >= 0, dark = !E.gv && E.rnd >= 4 && minor, flat5 = !E.gv && E.rnd >= 6 && ['Bb', 'Gm', 'Eb', 'Edim'].indexOf(name) >= 0, mode = s.type === 'S' ? 'full' : dk.S.tune, bright = clamp(E.I, 0, 1), lastBar = b === s.len - 1;   // from round 4 E falls to E flat; from round 6 the short A's fall to A flat
    let inst = dk.T.leads[s.lv]; if (mode === 'low') inst = 'chant'; if ((E.th === 3 && E.I > 0.72) || (E.th === 1 && dk.state === 'overreact')) inst = 'brass';
    const answer = E.gv && w > 0.2 && b % 4 === 3 && dk.rng.chance(0.8 * w);                                                         // in later rounds the fourth bar of a phrase jumps up an octave, like someone butting in
    bar.forEach(x => { let m = x[2] + s.lo + (answer ? 12 : 0); if (dark && ((m - 64) % 12 + 12) % 12 === 0) m -= 1; if (flat5 && x[1] <= dk.upb / 2 && ((m - 69) % 12 + 12) % 12 === 0) m -= 1; if (inChain) m = nearTone(m, ch); const tt = t + dk.sw(x[0]) * dk.spu, du = x[1] * dk.spu;
      if (mode === 'low') m = m > 69 ? m - 12 : m;
      if (x[1] <= dk.upb / 2 && dk.rng.chance(0.06 * w)) m += E.gv ? 12 : dk.rng.chance(0.5) ? 1 : -1;                // a wrong note (in a groove: a note that jumps the octave)
      if (E.gv && w > 0.15 && x[1] >= 2 && dk.rng.chance(0.4 * w)) gl(E, dk, tt - 0.08, 0.08, m - 1, 0.6, mode);                // in later rounds notes are slid into from a semitone under: cheeky, not sad
      if (E.rnd >= 8 && lastBar && !E.gv) { if (E.th === 3) fuseLead(E, dk, tt, du, m + 6, 0.4, 'full'); else leadNote(E, dk, inst, tt, du, m + 6, 0.4, bright); }                                 // from round 8 the last bar of a section is doubled a tritone up                     // a wrong note, a semitone off, on the shorter notes
      if (E.gv) gl(E, dk, tt, du, m, 1, mode); else if (E.th === 3) fuseLead(E, dk, tt, du, m, 1, mode); else leadNote(E, dk, inst, tt, du, m, 1, bright);
      if (mode === 'oct' && E.th !== 3) { leadNote(E, dk, E.th === 2 ? 'bell' : 'saw', tt, du, m + (E.th === 2 ? 0 : 12), 0.5, bright); if (E.th !== 2) chant(E, dk.L.vox.in, { t: tt, f: mf(m - 24 > 45 ? m - 24 : m - 12), g: 0.3, a: 0.05, h: du * 0.85, d: 0.2, vow: 0, pan: 0.2 }); }
    });
  }
  if (u > 0.3 && on(dk, 'vox') && !E.gv) { const X = dk.L.vox.in, n = u > 0.8 ? 3 : u > 0.55 ? 2 : 1; for (let i = 0; i < n; i++) if (E.th === 3) { if (i < 2 || b % 2 === 0) hold(E, X, 'choirA', ch.r + [24, 31, 25][i], t + i * 0.09, dk.upb * dk.spu - 0.3, (i === 2 ? 0.5 : 0.3) * w, { a: 0.3, r: 0.5, wide: 0.7 }); } else chant(E, X, { t: t + i * 0.09, f: mf(ch.r + [24, 31, 25][i]), g: (i === 2 ? 0.2 : 0.11) * w, a: 0.3, h: dk.upb * dk.spu - 0.5, d: 0.5, vow: i, pan: [0, -0.6, 0.6][i] }); }   // more voices join; the last sings a semitone off
  if (E.gv) { /* the grooves have their own late-round mischief in playGroove */ } else if (E.rnd >= 8 && b === s.len - 1 && on(dk, 'bass') && E.th === 3) hold(E, dk.L.bass.in, E.arr === 'a' ? 'basses' : 'bone', ch.r + 18, t + dk.upb * dk.spu * 0.75, dk.upb * dk.spu * 0.24, 0.6, { a: 0.03, r: 0.1 });
  else if (E.rnd >= 8 && b === s.len - 1 && on(dk, 'bass')) V(E, dk.L.bass.in, { t: t + dk.upb * dk.spu * 0.75, f: mf(ch.r + 6), type: 'sawtooth', det: [-8, 8], g: 0.3, a: 0.004, h: dk.upb * dk.spu * 0.15, d: dk.upb * dk.spu * 0.1, lp: 900, lp1: 250, q: 3 });   // and the bass steps to the tritone
}
// a chain step has moved the chord: what is already written of the pitched layers is let go and the rest of the bar (and the next, if
// it was written already) is written again on the new chord, so the harmony lands with the hit and not a bar late
EP.rechord = function (t) {
  const E = this, dk = E.deck; if (!dk || dk.S.drone || !dk.hist || E.dry) return;
  if (E.olds) E.olds = E.olds.filter(x => { if (x[0] < t) { done(x[1]); return false; } return true; }); else E.olds = [];
  ['bass', 'pad', 'lead', 'arp', 'vox', 'bell'].forEach(k => { const L = dk.L[k], old = L.in, inp = E.G(1); inp.__n = k; inp.connect(L.nx); old.gain.setTargetAtTime(0, t, 0.012); L.in = inp; E.olds.push([t + 0.5, old]); });
  const keep = { sec: dk.sec, spu: dk.spu, bar: dk.bar, sb: dk.sb, cur: E.cur }, name = dk.T.chain[E.cix], ch = CH[name]; E.cur = null; E.reT = t;
  try { dk.hist.forEach(h => { if (h.end <= t + 0.03) return; dk.sec = h.sec; dk.spu = h.spu; dk.bar = h.bar; dk.sb = h.b; dk.curCh = ch; PLAY[E.th](E, dk, h.t, h.b, ch, name); writeTune(E, dk, h.t, h.b, ch, name, h.sec, true, E.u(), E.w()); }); }
  finally { E.reT = 0; dk.sec = keep.sec; dk.spu = keep.spu; dk.bar = keep.bar; dk.sb = keep.sb; E.cur = keep.cur; dk.curCh = ch; }
};
// ---------- theme 1, Burner: four on the floor, a pumping FM bass, a filtered arpeggio, saw stabs ----------
const PLAY = {};
PLAY[1] = function (E, dk, t, b, ch, name) {
  const s = dk.sec, r = dk.rng, S = dk.S, L = dk.L, I = E.I, sp = dk.spu, at = u => t + u * sp, st = dk.drum || S.drum, last = b === s.len - 1, d9 = (E.rnd - 1) / 8;
  if (on(dk, 'drums') && st !== 'none') {
    const D = L.drums.in, hv = st === 'heavy' || (st === 'main' && I > 0.85), intro = s.type === 'I' && b < 2;
    const kp = st === 'tick' ? 'x...............' : st === 'light' ? ['x.........x.....', 'x......x..x.....', 'x.........x..x..'][s.dv % 3] : hv ? ['x...x...x...x...', 'x...x..xx...x.x.'][(s.dv + b) % 2] : ['x...x...x...x...', 'x..x..x.x...x...', 'x...x...x..x..x.'][s.dv % 3];
    if (!(s.brk && b < 4) && !intro) {
      pat(kp, i => { I_.kick(E, D, at(i), 0.5); if (st !== 'tick') pump(dk, at(i), 0.35, sp * 2.6); });
      if (st === 'main' || hv) { pat('....x.......x...', i => I_.snare(E, D, at(i), hv ? 0.4 : 0.32)); if (r.chance(0.3)) I_.snare(E, D, at(15), 0.1); }
      if (st === 'light') pat('....x.......x...', i => I_.rim(E, D, at(i), 0.16));
      if (last && s.fill && (st === 'main' || hv)) for (let i = 0; i < 4; i++) { (i % 2 ? I_.snare : I_.tom)(E, D, at(12 + i), i % 2 ? 0.16 + 0.05 * i : 110 - i * 8, i % 2 ? undefined : 0.3, (i - 1.5) * 0.3); }
      if (b === 0 && (st === 'main' || hv) && s.type !== 'I') I_.crash(E, D, t, hv ? 0.16 : 0.09);
    }
    for (let i = 0; i < 16; i++) { if (st === 'tick' && i % 4 !== 2 && !(i % 2 === 0 && r.chance(0.2))) continue; if (st === 'light' && i % 2) continue; if (intro && i % 4 !== 2) continue;
      I_.hat(E, D, at(i), (i % 4 === 2 ? 0.1 : i % 2 ? 0.035 : 0.055) * (st === 'tick' ? 0.6 : 1) * (0.8 + 0.4 * r()), hv && i % 4 === 2); }
  }
  if (on(dk, 'bass')) {
    const B = L.bass.in, root = s.pedal ? 38 : ch.r, calm = st === 'tick' || st === 'none' || (st === 'light' && I < 0.5), g = 0.34;
    const bn = (u, m, du, gg) => { const f = mf(m); V(E, B, { t: at(u), f, g: gg * 0.6, a: 0.003, h: du * 0.35, d: du * 0.65, fm: { r: 1, i: 2.6, i1: 0.2, d: du * 0.6 } }); V(E, B, { t: at(u), f, type: 'sawtooth', g: gg * 0.9, a: 0.003, h: du * 0.35, d: du * 0.65, lp: 500 + 900 * I, lp1: 180, lpt: du * 0.8, q: 4 }); };
    if (calm) { bn(0, root, sp * 15, g * 0.8); if (s.bv % 2) bn(10, root, sp * 3, g * 0.7); if (r.chance(0.5)) bn(14, root + (r.chance(0.5) ? 12 : 7), sp * 2, g * 0.6); }
    else if (s.bv === 1) pat('x..x..x.x..x..x.', i => bn(i, root + (i === 12 || i === 14 ? 12 : 0), sp * 2.2, g));
    else if (s.bv === 2) { bn(0, root, sp * 1.8, g); pat('..x...x...x...x.', i => bn(i, root + 12, sp * 1.8, g * 0.9)); pat('....x...x...x...', i => bn(i, root, sp * 1.6, g * 0.8)); }
    else for (let i = 0; i < 16; i += 2) bn(i, root + ((i === 6 || i === 14) && s.bv === 3 ? 12 : 0), sp * 1.8, g * (i % 4 ? 0.85 : 1));
    if (last && !calm) { const nx = CH[s.prog[0]].r; bn(15, nx - 1, sp, g * 0.8); }
  }
  if (on(dk, 'pad')) { const P = L.pad.in; ch.n.forEach((m, i) => V(E, P, { t, f: mf(m), type: 'sawtooth', det: [-8, 7], g: 0.085, a: 0.25, h: 16 * sp - 0.3, d: 0.6, lp: (500 + 1500 * I) * (1 - 0.35 * d9), q: 0.8, pan: (i - 1) * 0.5 })); if (d9 > 0.6) V(E, P, { t, f: mf(ch.r + 12), type: 'sawtooth', det: [-14, 14], g: 0.05 * d9, a: 0.4, h: 16 * sp - 0.4, d: 0.5, lp: 320 }); }
  if (on(dk, 'arp')) {
    const A = L.arp.in, tones = [ch.n[0], ch.n[1], ch.n[2], ch.n[0] + 12, ch.n[1] + 12, ch.n[2] + 12], P = [[0, 1, 2, 3, 2, 1, 2, 3], [0, 2, 1, 3, 2, 4, 3, 2], [3, 2, 1, 0, 1, 2, 3, 4], [0, 3, 1, 4, 2, 5, 4, 3], [0, 1, 2, 3, 4, 5, 4, 3], [2, 0, 3, 0, 4, 0, 3, 0]][s.av], stp = I > 0.45 ? 1 : 2;
    for (let i = 0; i < 16; i += stp) { if (stp === 1 && r.chance(0.06)) continue; const m = tones[P[(i / stp) % 8]] + (s.av > 3 && I > 0.7 ? 12 : 0); V(E, A, { t: at(i), f: mf(m), type: 'sawtooth', det: [-5, 5], g: 0.1 * (i % 4 ? 0.8 : 1), a: 0.002, h: 0, d: sp * 1.6, lp: 900 + 2600 * I, lp1: 350, lpt: sp * 1.4, q: 3.5, pan: (i % 4 - 1.5) * 0.3 }); }
  }
  if (on(dk, 'vox')) { const X = L.vox.in; [ch.r + 12, ch.r + 19].forEach((m, i) => chant(E, X, { t, f: mf(m), g: 0.22, a: 0.3, h: 16 * sp - 0.5, d: 0.5, vow: 1 + i, pan: i ? 0.4 : -0.4 })); }
  if (on(dk, 'bell')) { const X = L.bell.in, pos = [[6, 14], [0, 6, 12], [3, 6, 14], [6]][s.av % 4]; pos.forEach(u => ch.n.forEach((m, i) => V(E, X, { t: at(u), f: mf(m + 12), type: 'sawtooth', det: [-9, 9], g: 0.075, a: 0.003, h: sp * 0.6, d: sp * 1.6, lp: 3200, lp1: 500, lpt: sp * 2, q: 2, pan: (i - 1) * 0.6 }))); }
};

// ---------- theme 2, Athanor: six to the bar; frame drum, a drone, a chant, bells and an anvil ----------
PLAY[2] = function (E, dk, t, b, ch, name) {
  const s = dk.sec, r = dk.rng, S = dk.S, L = dk.L, I = E.I, sp = dk.spu, at = u => t + u * sp, st = dk.drum || S.drum, last = b === s.len - 1, d9 = (E.rnd - 1) / 8, bar = 12 * sp;
  if (on(dk, 'drums') && st !== 'none') {
    const D = L.drums.in, hv = st === 'heavy' || (st === 'main' && I > 0.85);
    if (!(s.brk && b < 4)) {
      if (hv) { pat(['x.....x...x.', 'x...x.x...x.'][(s.dv + b) % 2], i => I_.kick(E, D, at(i), 0.5, true)); I_.snare(E, D, at(6), 0.36); I_.clank(E, D, at(6), mf(57 + (b % 2) * 5), 0.11, 0.3); if (b % 2) for (let i = 8; i < 12; i++) I_.tom(E, D, at(i), 120 - (i - 8) * 9, 0.16 + 0.04 * (i - 8), (i - 9.5) * 0.3); if (b % 4 === 0) I_.crash(E, D, t, 0.15); }
      else if (st === 'main') { I_.thud(E, D, t, 0.55); I_.thud(E, D, at(6), 0.34); pat(['.........xx.', '....x....x..', '..........x.'][s.dv % 3], i => I_.tom(E, D, at(i), 92, 0.2, 0.2)); if (I > 0.55 && s.type !== 'I') I_.clank(E, D, at(6), mf(57 + (s.dv % 2) * 5), 0.09, 0.3); if (last && s.fill) for (let i = 6; i < 12; i++) I_.tom(E, D, at(i), 130 - (i - 6) * 8, 0.1 + 0.03 * (i - 6), (i - 9) * 0.2); }
      else if (st === 'light') { I_.thud(E, D, t, 0.42); if (s.dv % 2 || I > 0.4) I_.thud(E, D, at(6), 0.22); if (s.dv % 3 === 0) I_.tom(E, D, at(10), 92, 0.12, 0.2); }
      else if (b % 2 === 0) I_.thud(E, D, t, 0.3);
    }
    for (let i = 0; i < 12; i++) { if (i % 2 && !(hv || (st === 'main' && I > 0.7))) continue; if (st === 'tick' && i % 4 !== 0 && !r.chance(0.15)) continue; I_.shake(E, D, at(i), (i % 6 === 0 ? 0.09 : i % 2 ? 0.035 : 0.06) * (st === 'tick' ? 0.7 : 1) * (0.8 + 0.4 * r()), i % 4 ? 0.35 : -0.3); }
  }
  if (on(dk, 'bass')) {
    const B = L.bass.in, root = s.pedal ? 38 : ch.r, drive = st === 'heavy' || (st === 'main' && I > 0.55), g = 0.33;
    if (!drive) { V(E, B, { t, f: mf(root), g: g * 0.5, a: 0.05, h: bar - 0.3, d: 0.4 }); if (I > 0.35) V(E, B, { t, f: mf(root + 12), type: 'sawtooth', det: [-6, 6], g: g * 0.7, a: 0.1, h: bar - 0.3, d: 0.4, lp: 380 + 500 * I, q: 1 }); }
    else { const P = [[0, 12, 0, 7, 0, 12], [0, 0, 12, 0, 7, 12], [0, 7, 12, 0, 7, 12], [0, 12, 7, 0, 12, 7]][s.bv]; for (let i = 0; i < 6; i++) { const f = mf(root + P[i]), du = sp * 1.9; V(E, B, { t: at(i * 2), f, g: g * (i % 3 ? 0.5 : 0.6), a: 0.004, h: du * 0.4, d: du * 0.6, fm: { r: 1, i: 3, i1: 0.2, d: du * 0.6 } }); V(E, B, { t: at(i * 2), f, type: 'sawtooth', g: g * 0.9, a: 0.004, h: du * 0.4, d: du * 0.6, lp: 700 + 700 * I, lp1: 200, lpt: du * 0.8, q: 4 }); } }
  }
  if (on(dk, 'pad')) { const P = L.pad.in; ch.n.forEach((m, i) => { V(E, P, { t, f: mf(m), type: 'triangle', det: [-5, 5], g: 0.13, a: 0.3, h: bar - 0.35, d: 0.7, pan: (i - 1) * 0.5 }); if (I > 0.35) V(E, P, { t, f: mf(m + 12), g: 0.035, a: 0.4, h: bar - 0.45, d: 0.7, pan: (1 - i) * 0.5 }); });
    V(E, P, { t, f: mf(name === 'Eb' ? 46 : 50), type: 'sawtooth', det: [-9, 8], g: 0.06 + 0.04 * d9, a: 0.3, h: bar - 0.3, d: 0.5, lp: (700 + 900 * I) * (1 - 0.3 * d9), q: 2, vib: { f: 0.7, c: 6, in: 0.1 } }); V(E, P, { t, f: mf(name === 'Eb' ? 58 : 57), type: 'sawtooth', det: [-7, 7], g: 0.04, a: 0.3, h: bar - 0.3, d: 0.5, lp: 900, q: 2 }); }
  if (on(dk, 'arp')) { const A = L.arp.in, tones = [ch.n[0] + 12, ch.n[1] + 12, ch.n[2] + 12, ch.n[0] + 24, ch.n[1] + 24], pos = [[0, 4, 8], [2, 6, 10], [0, 2, 4, 8], [4, 8, 10], [0, 6, 8, 10], [2, 4, 6, 10]][s.av], order = [[0, 2, 3, 1, 4], [3, 2, 0, 1, 2], [1, 3, 4, 3, 0]][(s.av + b) % 3]; if (I > 0.7 && st !== 'heavy') for (let i = 0; i < 12; i += 2) I_.bell(E, A, at(i), mf(tones[order[(i / 2) % 5]]), 0.06, 0.6, (i % 4 - 1) * 0.4); else pos.slice(0, 3).forEach((u, i) => I_.bell(E, A, at(u), mf(tones[order[i % 5]] - (st === 'heavy' ? 12 : 0)), 0.075, 0.9, (i % 2 ? 0.45 : -0.45))); }
  if (on(dk, 'vox')) { const X = L.vox.in; [ch.r + 12, ch.r + 19].forEach((m, i) => chant(E, X, { t, f: mf(m), g: 0.24, a: 0.35, h: bar - 0.5, d: 0.5, vow: 2, pan: i ? 0.5 : -0.5 })); }
  if (on(dk, 'bell')) { const X = L.bell.in; if (b % 4 === 0 || I > 0.75) I_.bell(E, X, t, mf(ch.r + 24), 0.2, 3.2, 0); if (b % 4 === 2 && s.av % 2) I_.bell(E, X, at(6), mf(ch.r + 31), 0.1, 2.4, 0.3); }
};

// ====================================================================================================================
// MADE INSTRUMENTS (owner, 12 November: "I like 3 but it's too Arcade-y can we use more than just 8 bit noise").
// Fuse no longer plays raw oscillators. Each instrument is worked out here as a short recording made by code, kept in
// memory, and played back like a sample: nothing is downloaded.
//   held tones (cello, string section, double basses, horn, trombones, choir ah/oh, organ, bass clarinet): the spectrum of
//     the instrument (its harmonics, each smeared a little as a group of players smears it, shaped by the body or the mouth,
//     with breath or bow noise underneath) is written into a frequency table and turned into a 1.5 s loop by one inverse FFT
//   plucked strings (pizzicato, harp, col legno): a string model (a noise burst going round a damped delay line) and a body
//   struck things (piano, prepared piano, celesta, tubular bell, glass, timpani, bass drum, field drum, anvil, tam-tam,
//     clock): a sum of ringing modes at the real mode ratios of each, each mode with its own decay, plus the noise of the blow
// One is made the first time it is needed (a few to about 100 ms) and kept; a note is played from the nearest made pitch.
// ====================================================================================================================
const SR = 44100, RAW = {}, GEN = { ms: 0, bytes: 0, n: 0 };
let TAKE = 0;   // which take is being made (0, 1, 2): struck and plucked things are made three times, a little different, so a fast repeat is not the same recording
const bump = (f, c, w, g) => g * Math.exp(-((f - c) / w) * ((f - c) / w));
function fftInv(re, im) {
  const n = re.length; for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2; len <= n; len <<= 1) { const ang = 2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang), h = len >> 1;
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < h; k++) { const a = i + k, b = a + h, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr; re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } }
}
const norm = (x, pk) => { let m = 0; for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > m) m = a; } const k = pk / (m || 1); for (let i = 0; i < x.length; i++) x[i] *= k; return x; };
// a held tone as a loop: amp(n, f) the strength of harmonic n at frequency f, bw the smear in cents, floor(f) the noise under it
function padTone(f0, amp, bw, seed, floor, steady) {
  const bws = 1;
  const N = 65536, re = new Float64Array(N), im = new Float64Array(N), mag = new Float64Array(N / 2), hz = SR / N, r = RNG(seed);
  for (let n = 1; n * f0 < 15000; n++) { const f = n * f0, a = amp(n, f); if (a < 1e-5) continue; const sg = Math.max(0.6, (Math.pow(2, bw / 1200) - 1) * f0 * Math.pow(n, bws || 1) / hz), c = f / hz, lo = Math.max(1, Math.floor(c - 3 * sg)), hi = Math.min(N / 2 - 1, Math.ceil(c + 3 * sg)); for (let k = lo; k <= hi; k++) { const x = (k - c) / sg; mag[k] += a * (steady ? 0.33 : 1) * Math.exp(-0.5 * x * x) / Math.sqrt(sg); } if (steady) mag[Math.round(c)] += a * 1.5; }
  if (floor) for (let k = Math.floor(80 / hz); k < N / 2; k++) mag[k] += floor(k * hz);
  for (let k = 1; k < N / 2; k++) { const p = r() * 2 * Math.PI; re[k] = mag[k] * Math.cos(p); im[k] = mag[k] * Math.sin(p); }
  fftInv(re, im); const out = new Float32Array(N); let s = 0; for (let i = 0; i < N; i++) { out[i] = re[i]; s += re[i] * re[i]; } const k = 0.16 / Math.sqrt(s / N || 1); for (let i = 0; i < N; i++) out[i] *= k; return out;
}
// struck: parts [[frequency, strength, seconds to die away], ...] summed as ringing modes; len seconds
function modal(parts, len, att) {
  const n = Math.floor(len * SR), out = new Float32Array(n), tr = RNG(977 + TAKE * 131);
  parts.forEach(p => { if (p[0] > 18000 || p[0] < 15) return; if (TAKE) p = [p[0] * (1 + (tr() - 0.5) * 0.004), p[1] * (0.8 + 0.4 * tr()), p[2]]; const w = 2 * Math.PI * p[0] / SR, d = Math.exp(-1 / (p[2] * SR / 6.9)), c = Math.cos(w) * d, s = Math.sin(w) * d; let x = p[1], y = 0; for (let i = 0; i < n; i++) { out[i] += y; const t = x * c - y * s; y = x * s + y * c; x = t; if (i > 2000 && Math.abs(x) + Math.abs(y) < 1e-5) break; } });
  if (att) { const k = Math.floor(att * SR); for (let i = 0; i < k && i < n; i++) out[i] *= i / k; }
  return out;
}
// the noise of a blow: a burst through a band (lo to hi Hz), dying over tau seconds, added into out from t0
function burst(out, t0, tau, lo, hi, g, seed) {
  const r = RNG(seed + TAKE * 7919), i0 = Math.floor(t0 * SR), n = Math.min(out.length - i0, Math.floor(tau * 7 * SR)), kl = 1 - Math.exp(-2 * Math.PI * hi / SR), kh = 1 - Math.exp(-2 * Math.PI * lo / SR); let a = 0, b = 0, c2 = 0;
  for (let i = 0; i < n; i++) { const w = r() * 2 - 1; a += kl * (w - a); b += kl * (a - b); c2 += kh * (b - c2); out[i0 + i] += (b - c2) * g * Math.exp(-i / (tau * SR)) * Math.min(1, i / 20); }
  return out;
}
// a plucked string: a burst of noise going round a delay line that loses its top each trip; t60 seconds to die, bright 0..1
function pluck(f, len, t60, bright, seed, pos) {
  const n = Math.floor(len * SR), out = new Float32Array(n), L = SR / f, Li = Math.floor(L), fr = L - Li, buf = new Float32Array(Li + 2), r = RNG(seed + TAKE * 7919), g = Math.pow(0.001, 1 / (f * t60)), s = 0.5 - 0.42 * bright;
  let lp = 0; for (let i = 0; i < Li + 2; i++) { const w = r() * 2 - 1; lp += (0.25 + 0.7 * bright) * (w - lp); buf[i] = lp; }
  if (bright < 0.2) { let acc = 0, mean = 0; for (let i = 0; i < Li + 2; i++) mean += buf[i]; mean /= Li + 2; for (let i = 0; i < Li + 2; i++) { acc += buf[i] - mean; buf[i] = acc; } const d = (buf[Li + 1] - buf[0]) / (Li + 1); for (let i = 0; i < Li + 2; i++) buf[i] -= d * i; }   // a finger, not a pick: the string starts as a smooth shape (mostly its low harmonics), as a plucked bass does
  const pk = Math.max(1, Math.floor(Li * (pos || 0.18))); for (let i = Li + 1; i >= pk; i--) buf[i] -= buf[i - pk] * 0.9;     // where the finger plucks
  let ix = 0, prev = 0; const M = Li + 1;
  for (let i = 0; i < n; i++) { const a = buf[ix], b = buf[(ix + 1) % M], y = a + (b - a) * (1 - fr); out[i] = y; const v = g * ((1 - s) * y + s * prev); prev = y; buf[ix] = v; ix = (ix + 1) % M; }
  const k = Math.floor(0.004 * SR); for (let i = 0; i < k; i++) out[n - 1 - i] *= i / k; return out;
}
// a wooden or brass body: the signal also rings a few fixed modes (a cheap body)
function body(x, modes, mix) { const y = new Float32Array(x.length); modes.forEach(m => { const w = 2 * Math.PI * m[0] / SR, rr = Math.exp(-Math.PI * m[0] / m[1] / SR), a1 = -2 * rr * Math.cos(w), a2 = rr * rr; let y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const v = x[i] * (1 - rr) - a1 * y1 - a2 * y2; y2 = y1; y1 = v; y[i] += v * m[2]; } }); for (let i = 0; i < x.length; i++) x[i] += y[i] * mix; return x; }
const pianoParts = (m, prep, r) => { const f = mf(m), B = 0.00012 * Math.pow(f / 110, 1.1), T0 = clamp(6.5 - (m - 28) * 0.085, 0.5, 6.5), P = [];
  for (let n = 1; n < 90; n++) { let fn = n * f * Math.sqrt(1 + B * n * n); if (fn > 13000) break; if (prep && n > 1) fn *= 1 + (r() - 0.5) * 0.07; const a = Math.pow(n, -0.85) * (0.25 + Math.abs(Math.sin(Math.PI * n / 7.6))) * Math.exp(-n / (m < 48 ? 26 : 16)), tau = T0 / (1 + 0.02 * Math.pow(n, 1.5)) * (prep ? 0.28 : 1);
    P.push([fn, a, tau]); if (n <= 10 && !prep) { P[P.length - 1][1] = a * 0.6; P.push([fn * 1.0007, a * 0.45, tau * 3.5]); } } return P; };
const INST = {
  // ---- held tones (loops) ----
  cello:   { loop: 1, lo: 36, hi: 81, gen: m => padTone(mf(m), (n, f) => Math.pow(n, -1.05) * (0.35 + bump(f, 250, 120, 1) + bump(f, 480, 160, 0.9) + bump(f, 950, 320, 0.7) + bump(f, 2500, 900, 0.5)) / (1 + Math.pow(f / 7500, 2)), 7, 11 + m, f => 0.003 * bump(f, 5500, 4500, 1), true) },
  strings: { loop: 1, lo: 48, hi: 98, gen: m => padTone(mf(m), (n, f) => Math.pow(n, -1.25) * (0.12 + bump(f, 480, 200, 0.8) + bump(f, 1100, 420, 0.9) + bump(f, 2900, 1100, 0.75)) / (1 + Math.pow(f / 10000, 2)), 26, 23 + m, f => 0.002 * bump(f, 6500, 5000, 1)) },
  basses:  { loop: 1, lo: 24, hi: 60, gen: m => padTone(mf(m), (n, f) => Math.pow(n, -1.1) * (0.4 + bump(f, 110, 60, 1) + bump(f, 230, 110, 0.8) + bump(f, 720, 320, 0.5) + bump(f, 1900, 800, 0.25)) / (1 + Math.pow(f / 5000, 2)), 16, 37 + m, f => 0.0012 * bump(f, 3000, 2500, 1), true) },
  horn:    { loop: 1, lo: 33, hi: 77, gen: m => padTone(mf(m), (n, f) => (1 + bump(f, 360, 200, 0.9)) / (1 + Math.pow(f / 750, 2.4)), 9, 41 + m, f => 0.0016 * bump(f, 4000, 3500, 1), true) },
  bone:    { loop: 1, lo: 28, hi: 72, gen: m => padTone(mf(m), (n, f) => Math.pow(n, -0.35) * (1 + bump(f, 520, 260, 0.8) + bump(f, 1500, 600, 0.5)) / (1 + Math.pow(f / 2600, 2.6)), 12, 53 + m, f => 0.0012 * bump(f, 3500, 3000, 1)) },
  choirA:  { loop: 1, lo: 43, hi: 84, gen: m => padTone(mf(m), (n, f) => Math.pow(n, -1.2) * (0.08 + bump(f, 720, 120, 1) + bump(f, 1180, 140, 0.6) + bump(f, 2750, 260, 0.32) + bump(f, 3500, 320, 0.2)) , 38, 61 + m, f => 0.0008 * (bump(f, 2800, 900, 1) + bump(f, 900, 400, 0.4))) },
  choirO:  { loop: 1, lo: 36, hi: 79, gen: m => padTone(mf(m), (n, f) => Math.pow(n, -1.3) * (0.08 + bump(f, 440, 95, 1) + bump(f, 800, 120, 0.5) + bump(f, 2650, 260, 0.2) + bump(f, 3300, 320, 0.1)), 36, 71 + m, f => 0.0008 * (bump(f, 2600, 900, 1) + bump(f, 600, 300, 0.4))) },
  organ:   { loop: 1, lo: 24, hi: 84, gen: m => padTone(mf(m), (n, f) => ({ 1: 1, 2: 0.8, 3: 0.5, 4: 0.6, 5: 0.15, 6: 0.4, 8: 0.5, 10: 0.15, 12: 0.3, 16: 0.3, 20: 0.15, 24: 0.2, 32: 0.15 }[n] || 0.03) / (1 + Math.pow(f / 8000, 2)), 3, 83 + m, f => 0.004 * bump(f, 5500, 5000, 1)) },
  bcl:     { loop: 1, lo: 26, hi: 70, gen: m => padTone(mf(m), (n, f) => (n % 2 ? 1 : Math.min(0.6, 0.13 + 0.05 * n)) / n * (1 + bump(f, 380, 220, 0.5)) / (1 + Math.pow(f / 1900, 2)), 9, 97 + m, f => 0.0048 * bump(f, 3500, 3000, 1), true) },
  // ---- plucked ----
  pizz:    { rr: 3, vl: 1, lo: 26, hi: 74, gen: m => norm(body(pluck(mf(m), m < 45 ? 1.6 : 1.1, m < 45 ? 1.3 : 0.8, 0.55, 5 + m), [[105, 9, 1], [198, 10, 0.8], [290, 12, 0.6], [560, 8, 0.3]], 1.4), 0.85) },
  harp:    { lo: 36, hi: 96, gen: m => norm(body(pluck(mf(m), 3.2, clamp(4.2 - (m - 36) * 0.045, 1.2, 4.2), 0.8, 9 + m, 0.3), [[180, 8, 1], [420, 9, 0.5]], 0.4), 0.85) },
  legno:   { rr: 3, lo: 43, hi: 76, gen: m => { const x = pluck(mf(m), 0.28, 0.07, 0.9, 3 + m, 0.09); burst(x, 0, 0.006, 1400, 6500, 1.6, 77 + m); burst(x, 0.0005, 0.02, 250, 900, 0.5, 78 + m); return norm(body(x, [[280, 10, 1], [520, 12, 0.7], [2300, 14, 0.6]], 0.8), 0.85); } },
  // ---- struck ----
  piano:   { rr: 2, vl: 1, lo: 24, hi: 100, gen: m => { const T0 = clamp(6.5 - (m - 28) * 0.085, 0.5, 6.5), x = modal(pianoParts(m), Math.min(6, T0 * 1.3 + 0.5)); burst(x, 0, 0.012, 80, 900, 0.5, 7 + m); burst(x, 0.001, 0.004, 1800, 7000, 0.12, 8 + m); const k = Math.floor(0.05 * SR); for (let i = 0; i < k; i++) x[x.length - 1 - i] *= i / k; return norm(x, 0.85); } },
  prep:    { lo: 24, hi: 88, gen: m => { const r = RNG(131 + m), P = pianoParts(m, true, r); for (let i = 0; i < 4; i++) P.push([1400 + r() * 4200, 0.25, 0.12 + r() * 0.2]); const x = modal(P, 1.6), bz = 62 + r() * 50; for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] *= 1 + 0.7 * Math.exp(-t / 0.22) * (Math.sin(2 * Math.PI * bz * t) > 0 ? 1 : -0.6); } burst(x, 0, 0.01, 300, 5000, 0.5, 9 + m); const k = Math.floor(0.05 * SR); for (let i = 0; i < k; i++) x[x.length - 1 - i] *= i / k; return norm(x, 0.85); } },
  celesta: { lo: 60, hi: 96, gen: m => { const f = mf(m), x = modal([[f, 1, 1.5], [f * 2, 0.2, 0.9], [f * 4.02, 0.22, 0.5], [f * 6.3, 0.08, 0.25], [f * 0.5, 0.15, 0.6]], 1.8, 0.003); burst(x, 0, 0.004, 900, 5000, 0.1, 15 + m); return norm(x, 0.8); } },
  tbell:   { lo: 48, hi: 79, gen: m => { const f = mf(m), P = []; [0.3, 0.5, 1, 0.9, 0.8, 0.5, 0.35, 0.25, 0.15].forEach((a, i) => { const k = i + 2, fk = f * 2 * (2 * k + 1) * (2 * k + 1) / 81; P.push([fk, a, 7 / (1 + 0.35 * i)], [fk * 1.003, a * 0.5, 6 / (1 + 0.35 * i)]); }); const x = modal(P, 5.5); burst(x, 0, 0.005, 1500, 9000, 0.6, 17 + m); const k = Math.floor(0.3 * SR); for (let i = 0; i < k; i++) x[x.length - 1 - i] *= i / k; return norm(x, 0.85); } },
  glass:   { lo: 67, hi: 96, gen: m => { const f = mf(m), x = modal([[f, 1, 1.1], [f * 2.32, 0.45, 0.6], [f * 4.25, 0.3, 0.35], [f * 6.63, 0.14, 0.2]], 1.4); burst(x, 0, 0.003, 2500, 11000, 0.5, 19 + m); return norm(x, 0.8); } },
  timp:    { rr: 3, vl: 1, lo: 36, hi: 60, gen: m => { const f = mf(m), x = modal([[f * 0.63, 0.35, 0.18], [f, 1, 2.2], [f * 1.5, 0.6, 1.5], [f * 1.98, 0.45, 1.1], [f * 2.44, 0.3, 0.7], [f * 2.91, 0.2, 0.5], [f * 3.4, 0.12, 0.35], [f * 3.9, 0.08, 0.25], [f * 1.68, 0.3, 0.25], [f * 2.09, 0.2, 0.2]], 2.6); burst(x, 0, 0.03, 40, 320, 1.4, 21 + m); burst(x, 0, 0.012, 900, 4500, 0.25, 22 + m); const k = Math.floor(0.2 * SR); for (let i = 0; i < k; i++) x[x.length - 1 - i] *= i / k; return norm(x, 0.9); } },
  bdrum:   { fix: 30, gen: () => { const f = 44, x = modal([[f, 1, 1.1], [f * 1.59, 0.5, 0.6], [f * 2.14, 0.35, 0.4], [f * 2.3, 0.3, 0.35], [f * 2.65, 0.2, 0.25], [f * 2.92, 0.15, 0.2]], 1.6); burst(x, 0, 0.05, 30, 220, 1.6, 25); burst(x, 0, 0.02, 700, 3500, 0.3, 26); const k = Math.floor(0.2 * SR); for (let i = 0; i < k; i++) x[x.length - 1 - i] *= i / k; return norm(x, 0.9); } },
  kick:    { fix: 30, gen: () => { const n = Math.floor(0.5 * SR), x = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR; ph += 2 * Math.PI * (46 + 70 * Math.exp(-t / 0.035)) / SR; x[i] = Math.sin(ph) * Math.exp(-t / 0.13) * Math.min(1, i / 30); } burst(x, 0, 0.01, 60, 500, 0.5, 27); burst(x, 0, 0.004, 1500, 6000, 0.12, 28); return norm(x, 0.9); } },
  fdrum:   { fix: 50, gen: () => { const x = modal([[178, 1, 0.16], [326, 0.5, 0.1], [470, 0.25, 0.07]], 0.5); burst(x, 0, 0.11, 1200, 8500, 1.1, 29); burst(x, 0, 0.004, 3000, 12000, 0.5, 30); return norm(x, 0.9); } },
  anvil:   { lo: 70, hi: 82, gen: m => { const f = mf(m), r = RNG(33 + m), P = [[f, 0.6, 0.7], [f * 2.76, 1, 0.55], [f * 5.4, 0.8, 0.4], [f * 8.93, 0.5, 0.28], [f * 13.34, 0.3, 0.16]]; for (let i = 0; i < 7; i++) P.push([3000 + r() * 7000, 0.25, 0.1 + r() * 0.2]); const x = modal(P, 1.1); burst(x, 0, 0.004, 3000, 14000, 1.2, 34 + m); burst(x, 0, 0.02, 200, 900, 0.4, 35 + m); return norm(x, 0.85); } },
  tam:     { fix: 40, gen: () => { const r = RNG(41), P = []; for (let i = 0; i < 240; i++) { const f = 110 * Math.pow(90, r()); P.push([f, Math.pow(f / 110, -0.45) * (0.5 + r()), clamp(7 - 1.6 * Math.log2(f / 110), 0.8, 7)]); } const x = modal(P.filter(q => q[0] < 1500), 5, 0.06), hi = modal(P.filter(q => q[0] >= 1500), 5, 0.06); burst(hi, 0, 0.35, 2500, 12000, 2.5, 42); for (let i = 0; i < x.length; i++) x[i] += hi[i] * Math.min(1, 0.15 + i / (0.7 * SR)); const k = Math.floor(0.5 * SR); for (let i = 0; i < k; i++) x[x.length - 1 - i] *= i / k; return norm(x, 0.85); } },
  bow:     { fix: 60, rr: 3, gen: () => { const x = new Float32Array(Math.floor(0.12 * SR)); burst(x, 0, 0.02, 800, 5000, 1, 61); return norm(body(x, [[280, 8, 1], [520, 9, 0.8], [950, 8, 0.6], [2400, 6, 0.5]], 1.2), 0.8); } },
  chiff:   { fix: 60, rr: 3, gen: () => { const x = new Float32Array(Math.floor(0.1 * SR)); burst(x, 0, 0.012, 500, 4000, 1, 63); return norm(x, 0.8); } },
  tick:    { rr: 3, fix: 60, gen: () => { const x = new Float32Array(Math.floor(0.14 * SR)); [0, 0.011].forEach((t0, j) => { const y = modal([[2150, 1, 0.022], [3480, 0.8, 0.016], [5300, 0.6, 0.012], [8100, 0.35, 0.008], [410, 0.5, 0.03]], 0.12); for (let i = 0; i < y.length && i + Math.floor(t0 * SR) < x.length; i++) x[i + Math.floor(t0 * SR)] += y[i] * (j ? 0.55 : 1); }); burst(x, 0, 0.0015, 2500, 12000, 1.5, 51); return norm(x, 0.8); } },
  tock:    { rr: 3, fix: 60, gen: () => { const x = new Float32Array(Math.floor(0.14 * SR)); [0, 0.013].forEach((t0, j) => { const y = modal([[1500, 1, 0.026], [2600, 0.8, 0.018], [4300, 0.5, 0.012], [6900, 0.3, 0.009], [300, 0.6, 0.035]], 0.12); for (let i = 0; i < y.length && i + Math.floor(t0 * SR) < x.length; i++) x[i + Math.floor(t0 * SR)] += y[i] * (j ? 0.55 : 1); }); burst(x, 0, 0.0015, 1800, 10000, 1.3, 52); return norm(x, 0.8); } }
};
// the made recording nearest to note m (one every three semitones), built on first use
function rawOf(name, m, take) {
  const sp = INST[name], z = sp.fix !== undefined ? sp.fix : clamp(sp.lo + Math.round((m - sp.lo) / 3) * 3, sp.lo, sp.hi), tk = sp.rr ? (take || 0) % sp.rr : 0, key = name + z + (tk ? '_' + tk : '');
  if (!RAW[key]) { const t0 = Date.now(); TAKE = tk; RAW[key] = sp.gen(z); TAKE = 0; GEN.ms += Date.now() - t0; GEN.bytes += RAW[key].length * 4; GEN.n++; }
  return { key, z, raw: RAW[key] };
}
EP.buf = function (name, m, take) { const E = this, r = rawOf(name, m, take); if (!E.bufs) E.bufs = {}; if (!E.bufs[r.key]) { const b = E.c.createBuffer(1, r.raw.length, SR); b.getChannelData(0).set(r.raw); E.bufs[r.key] = b; } return { b: E.bufs[r.key], z: r.z }; };
// play one: o = { i instrument, m note, t, g, dur (held length, or when a struck note is damped), a attack, r release, lp, lp1, lpt, vib, trem, pan, wide, strict (no human looseness: a clock) }
function Sm(E, dst, o) {
  const sp = INST[o.i], m = o.m === undefined ? sp.fix : o.m, u = E.w(), j1 = E.jr(), j2 = E.jr(), j3 = E.jr();
  if (E.reT && skipRe(E, dst, o.t)) return; E.note(dst, o.t, mf(m), o.i); if (E.dry || (E.solo && dst.__n !== E.solo)) return;
  const c = E.c, bz = E.buf(o.i, m, Math.floor(j3 * 3)), loose = o.strict ? 0 : (j1 - 0.5) * 0.016 + (u > 0.15 && !(E.gv && dst.__n === 'drums') ? (j2 - 0.3) * 0.05 * u : 0), t = Math.max(o.t + loose, 0), vel = o.g * (o.strict ? 1 : 0.84 + 0.32 * j3);
  const cents = (m - bz.z) * 100 + (sp.fix === undefined && !o.strict ? (j2 - 0.5) * (E.gv ? 12 : 34) * u : 0), rate = Math.pow(2, cents / 1200), n0 = o.wide && sp.loop ? 2 : 1;
  const g = c.createGain(); let head = g, tail = g, n = 1, end;
  if (sp.loop) { const a = o.a || 0.06, h = Math.max(0.02, (o.dur || 0.5) - a), r = o.r || 0.18; end = t + a + h + r * 1.6; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + a); g.gain.setValueAtTime(vel, t + a + h); g.gain.setTargetAtTime(0, t + a + h, r / 4); }
  else { const len = bz.b.duration / rate; g.gain.setValueAtTime(vel, t); end = t + len; if (o.dur && o.dur < len - 0.05) { g.gain.setTargetAtTime(0, t + o.dur, (o.r || 0.12) / 3); end = t + o.dur + (o.r || 0.12) * 2; } }
  if (sp.vl && !o.lp) o = Object.assign({}, o, { lp: 1800 + 15000 * clamp(vel, 0, 1) * (0.6 + 0.4 * j3) });
  if (o.lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.6; f.frequency.setValueAtTime(o.lp, t); if (o.lp1) f.frequency.exponentialRampToValueAtTime(o.lp1, t + (o.lpt || 0.15)); f.connect(g); head = f; n++; }
  if (o.trem) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.trem * (0.9 + 0.2 * j1); lg.gain.value = vel * 0.45; l.connect(lg); lg.connect(g.gain); l.start(t); l.stop(end + 0.05); n += 2; }
  let vg = null; if (o.vib) { const l = c.createOscillator(); vg = c.createGain(); l.frequency.value = 5.2 + j3 * 0.8; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(o.vib * (1 + u), t + 0.35); l.connect(vg); l.start(t); l.stop(end + 0.05); n += 2; }
  for (let k = 0; k < n0; k++) {
    const src = c.createBufferSource(); src.buffer = bz.b; src.detune.value = cents + (k ? 4 : 0); if (vg) vg.connect(src.detune); n++;
    if (n0 === 2 && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp((o.pan || 0) + (k ? o.wide : -o.wide), -1, 1); src.connect(p); p.connect(head); n++; } else src.connect(head);
    if (sp.loop) { src.loop = true; src.start(t, ((j1 + k * 0.41) % 1) * (bz.b.duration - 0.01)); } else src.start(t);
    src.stop(end + 0.05); if (k === n0 - 1) src.onended = () => done(tail);
  }
  if (n0 === 1 && o.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp(o.pan, -1, 1); g.connect(p); p.connect(dst); tail = p; n++; } else g.connect(dst);
  E.stat(n, t, end);
}
// the three arrangements of Fuse: a chamber (strings, piano, clock), b gothic (choir, organ, bells, low brass), c hybrid (both, with a restrained modern bass and drums)
const ARR = { a: 'chamber: strings, piano, a clock', b: 'gothic: choir, organ, bells, low brass', c: 'hybrid: strings, brass and choir with a restrained modern bass and drums' };
const LAYF = { drums: { rev: 0.2, dly: 0, sat: 1.2 }, bass: { rev: 0.1, dly: 0, sat: 1.1 }, pad: { rev: 0.45, dly: 0 }, lead: { rev: 0.28, dly: 0 }, arp: { rev: 0.4, dly: 0 }, vox: { rev: 0.6, dly: 0 }, bell: { rev: 0.45, dly: 0 } };
const FMIX = { a: { drums: 1, bass: 1.5, pad: 0.8, lead: 1.4, arp: 1.6, vox: 1, bell: 0.8 }, b: { drums: 1, bass: 1, pad: 0.8, lead: 1.4, arp: 2.2, vox: 1, bell: 1.6 }, c: { drums: 0.9, bass: 0.9, pad: 0.75, lead: 1.45, arp: 1.6, vox: 1, bell: 1.6 } };   // set by measuring each layer alone
// a held note of the tune or of a chord, on one instrument
const hold = (E, dst, i, m, t, du, g, o) => { if (i === 'cello') Sm(E, dst, { i: 'bow', t, g: g * 0.3, pan: o && o.pan }); if (i === 'organ') Sm(E, dst, { i: 'chiff', t, g: g * 0.25 }); Sm(E, dst, Object.assign({ i, m, t, g, dur: du, a: 0.07, r: 0.2 }, o || {})); };
// one note of the tune, as each arrangement plays it
function fuseLead(E, dk, t, du, m, g, mode) {
  const A = E.arr, L = dk.L.lead.in, I = E.I, lo = m - 12, big = mode === 'oct' || I > 0.8, d = du * 0.92; if (big) g *= 0.68;
  if (mode === 'low') { hold(E, L, 'choirO', lo, t, d, g * 0.9, { a: 0.14, r: 0.3, wide: 0.5 }); hold(E, L, A === 'b' ? 'organ' : 'cello', lo - 12, t, d, g * 0.5, { a: 0.12 }); return; }
  if (A !== 'b') { hold(E, L, 'cello', lo, t, d, g * (A === 'c' ? 0.8 : 1), { a: 0.05, vib: du > 0.45 ? 16 : 0, pan: 0.18, lp: 3500 + 10000 * I }); if (I > 0.35 || du < 0.4) Sm(E, L, { i: 'piano', m: lo, t, g: g * (0.28 + 0.3 * I), dur: du + 0.5, pan: -0.15, lp: 1800 + 6000 * I }); }
  if (A === 'b' || (A === 'c' && (I >= 0.6 || big))) { hold(E, L, 'horn', lo, t, d, g * (A === 'c' ? 0.7 : 1), { a: 0.07, vib: du > 0.6 ? 7 : 0, pan: -0.25, lp: 700, lp1: 1500 + 3500 * I, lpt: 0.12 }); if (A === 'b' && (I > 0.45 || mode === 'full')) hold(E, L, 'choirO', lo, t, d, g * 0.55, { a: 0.12, r: 0.28, wide: 0.6 }); }
  if (big) { if (A !== 'a') hold(E, L, 'bone', lo, t, d, g * 0.8, { a: 0.05, pan: 0.3, lp: 900, lp1: 6000, lpt: 0.09 }); if (A !== 'b') { hold(E, L, 'strings', m, t, d, g * 0.8, { a: 0.05, wide: 0.6 }); hold(E, L, 'strings', m + 12, t, d, g * 0.45, { a: 0.05, wide: 0.7 }); } else hold(E, L, 'choirA', m, t, d, g * 0.8, { a: 0.1, r: 0.25, wide: 0.7 }); }
}
// ---------- theme 3, Fuse: a clock and wood on strings that wait in threes and twos; then timpani, low brass, choir and an anvil ----------
PLAY[3] = function (E, dk, t, b, ch, name) {
  const s = dk.sec, r = dk.rng, S_ = dk.S, L = dk.L, I = E.I, sp = dk.spu, at = u => t + u * sp, st = dk.drum || S_.drum, last = b === s.len - 1, u9 = E.w(), bar = 16 * sp, A = E.arr;
  const hv = st === 'heavy' || (st === 'main' && I > 0.85), root = s.pedal ? 38 : ch.r, tr = root + 12 > 57 ? root : root + 12, ACC = [0, 6, 12];
  if (on(dk, 'drums') && st !== 'none') {
    const D = L.drums.in;
    // the clock: tick, tock on the eighths (a metronome that does not care); under the blow-up it is drowned
    if (!hv) for (let i = 0; i < 16; i += 2) Sm(E, D, { i: (i / 2) % 2 ? 'tock' : 'tick', t: at(i), g: (ACC.indexOf(i) >= 0 ? 0.55 : 0.38) * (st === 'tick' || st === 'light' ? 1.7 : 0.9), strict: u9 < 0.3, pan: -0.3 });
    if (!(s.brk && b < 4)) {
      // wood of the bow on the string, in threes and twos
      if (A !== 'b' && s.type !== 'I') { ACC.concat(s.dv > 2 ? [3] : []).forEach(i => Sm(E, D, { i: 'legno', m: ch.n[0] - 12, t: at(i), g: 0.85, pan: 0.35 })); for (let i = 0; i < 16; i++) if (ACC.indexOf(i) < 0 && r.chance(hv ? 0.6 : st === 'main' ? 0.3 : 0.1)) Sm(E, D, { i: 'legno', m: ch.n[(i % 3)] - 12, t: at(i), g: 0.32 + 0.15 * r(), pan: 0.35 + (i % 3 - 1) * 0.2 }); }
      if (hv) { pat(['x..x..x...x.x...', 'x..x..x..xx...x.'][(s.dv + b) % 2], i => Sm(E, D, { i: 'timp', m: i % 6 === 3 || i === 10 ? tr + 7 > 57 ? tr - 5 : tr + 7 : tr, t: at(i), g: 0.75, pan: 0.2 })); Sm(E, D, { i: 'bdrum', t, g: 0.9 }); Sm(E, D, { i: 'bdrum', t: at(8), g: 0.6 });
        if (A !== 'a') pat('....x.......x...', i => Sm(E, D, { i: 'anvil', m: 76 + (r() - 0.5) * 0.6, t: at(i), g: 0.5, pan: -0.4 })); else pat('....x.......x...', i => Sm(E, D, { i: 'prep', m: 31 + (i > 8 ? 2 : 0), t: at(i), g: 0.7, pan: -0.3 }));
        if (A === 'c') { pat('x.....x...x.....', i => Sm(E, D, { i: 'kick', t: at(i), g: 0.5 })); pat('....x.......x...', i => Sm(E, D, { i: 'fdrum', t: at(i), g: 0.45, pan: 0.1 })); }
        if (b % 2) pat('..........x.x.xx', i => Sm(E, D, { i: 'timp', m: tr, t: at(i), g: 0.35 + 0.08 * (i - 10), pan: 0.2 })); if (b % 4 === 0) Sm(E, D, { i: 'tam', t, g: 0.45, pan: -0.2 }); }
      else if (st === 'main') { pat(['x.....x.....x...', 'x.....x...x.....', 'x..x..x.....x...'][s.dv % 3], (i, _, k) => Sm(E, D, { i: 'timp', m: tr, t: at(i), g: i ? 0.45 : 0.7, pan: 0.2 })); if (A === 'c') { Sm(E, D, { i: 'kick', t, g: 0.55 }); if (s.type !== 'I') Sm(E, D, { i: 'fdrum', t: at(8), g: 0.28, pan: 0.1 }); }
        if (last && s.fill) for (let i = 0; i < 8; i++) Sm(E, D, { i: 'timp', m: tr, t: at(12) + i * sp / 2, g: 0.16 + 0.05 * i, pan: 0.2 }); }
      else if (st === 'light') { if (b % 2 === 0) Sm(E, D, { i: 'timp', m: tr, t, g: 0.3, pan: 0.2 }); if (A === 'c') Sm(E, D, { i: 'kick', t, g: 0.4 }); }
      else if (b % 4 === 0) Sm(E, D, { i: A === 'b' ? 'bdrum' : 'timp', m: A === 'b' ? undefined : tr, t, g: 0.26, pan: 0.2 });
    }
  }
  if (on(dk, 'bass')) {
    const B = L.bass.in, loud = hv || I > 0.72;
    if (A === 'b') { hold(E, B, 'organ', root, t, bar - 0.1, 0.5, { a: 0.1, r: 0.3 }); if (I > 0.3) hold(E, B, 'basses', root + 12, t, bar - 0.1, 0.35, { a: 0.15, r: 0.3 }); }
    else { const P = ['x.....x.....x...', 'x.....x...x.x...', 'x..x..x.....x.x.', 'x.....x..x..x...'][s.bv]; pat(P, i => Sm(E, B, { i: 'pizz', m: root + 12 + (i === 14 ? 7 : i === 10 && s.bv === 1 ? 12 : 0), t: at(i), g: ACC.indexOf(i) >= 0 ? 0.7 : 0.4, pan: 0.3 })); }
    if (A === 'c') V(E, B, { t, f: mf(root), g: 0.16, a: 0.02, h: sp * 4, d: sp * 6 });                                            // the one plain tone kept: a soft sine under the hybrid's bass
    if (loud) { ACC.forEach(i => { hold(E, B, 'basses', root + 12, at(i), sp * 4, 0.6, { a: 0.03, r: 0.15, pan: 0.3 }); if (A !== 'a') hold(E, B, 'bone', root + 12, at(i), sp * 4, 0.45, { a: 0.04, r: 0.15, pan: 0.25, lp: 700, lp1: 3500, lpt: 0.08 }); else hold(E, B, 'bcl', root + 12, at(i), sp * 4, 0.5, { a: 0.03, r: 0.15, pan: -0.2 }); }); }
  }
  if (on(dk, 'pad')) {
    const P = L.pad.in, soft = I < 0.45;
    if (A !== 'b') { ch.n.forEach((m, i) => hold(E, P, 'strings', m - (i === 2 ? 12 : 0), t, bar - 0.15, 0.3, { a: 0.3, r: 0.4, wide: 0.7, trem: soft ? 10 + 2 * i : 0, lp: 3000 + 10000 * I })); if (b >= 4 && soft) hold(E, P, 'strings', name === 'Bb' || name === 'Edim' ? 82 : name === 'C' ? 79 : 81, t, bar - 0.2, 0.12, { a: 0.6, r: 0.5, wide: 0.8, trem: 13 }); }
    if (A === 'b' || (A === 'c' && I >= 0.45)) { ch.n.forEach((m, i) => hold(E, P, 'organ', m - 12, t, bar - 0.1, A === 'c' ? 0.14 : 0.24, { a: 0.12, r: 0.3, wide: 0.5 })); hold(E, P, 'choirO', ch.n[0] - 12, t, bar - 0.2, 0.26, { a: 0.4, r: 0.5, wide: 0.7 }); hold(E, P, 'choirO', ch.n[2] - 12, t, bar - 0.2, 0.2, { a: 0.5, r: 0.5, wide: 0.7 }); }
    if (A === 'a' && (I > 0.3 || u9 > 0.4)) hold(E, P, 'bcl', ch.n[1] - 24, t, bar - 0.2, 0.3, { a: 0.2, r: 0.3, pan: -0.3 });
  }
  if (on(dk, 'arp')) {
    // the piano (harp in the gothic one) turns the chord over low down, a few notes a bar, pedal down; in later rounds some strings have bolts in them
    const X = L.arp.in, pos = [[4, 10, 14], [3, 9], [6, 12, 15], [2, 8, 14], [10, 13], [4, 7, 12]][(s.av + (r.chance(0.5) ? b : 0)) % 6], tones = [ch.n[0] - 12, ch.n[1] - 12, ch.n[2] - 12, ch.n[0], ch.n[1]];
    pos.forEach((p, i) => { let m = tones[(i * 2 + s.av + b) % 5]; if (r.chance(0.07 * u9)) m += r.chance(0.5) ? 1 : 6; const ins = A === 'b' ? 'harp' : r.chance(0.6 * u9) ? 'prep' : 'piano'; Sm(E, X, { i: ins, m, t: at(p), g: 0.36, pan: A === 'b' ? 0.45 : -0.2 + i * 0.1, lp: ins === 'piano' ? 2500 + 6000 * I : 0 }); });
    if (A === 'b' && I > 0.5 && b % 2 === 0) Sm(E, X, { i: 'celesta', m: ch.n[2] + 12, t: at(8), g: 0.2, pan: -0.4 });
    if (A === 'a' && s.av % 2 && b % 4 === 3 && I < 0.5) Sm(E, X, { i: 'glass', m: ch.n[0] + 12, t: at(13), g: 0.12, pan: 0.5 });       // a beaker touched, once in a while
  }
  if (on(dk, 'vox') && (A !== 'a' || E.rnd >= 6)) {
    const X = L.vox.in, big = I > 0.7; [root + 12, root + 19].forEach((m, i) => hold(E, X, big ? 'choirA' : 'choirO', m, t, bar - 0.25, 0.42, { a: 0.4, r: 0.5, wide: 0.7, pan: i ? 0.2 : -0.2 })); if (big) ch.n.forEach(m => hold(E, X, 'choirA', m, t, bar - 0.25, 0.28, { a: 0.3, r: 0.5, wide: 0.8 }));
  }
  if (on(dk, 'bell')) {
    const X = L.bell.in;
    if (hv || I > 0.7) ACC.forEach(i => { if (A !== 'a') { ch.n.forEach((m, k) => hold(E, X, k === 1 ? 'horn' : 'bone', m - 12, at(i), sp * 2.6, 0.5, { a: 0.03, r: 0.14, pan: (k - 1) * 0.5, lp: 600, lp1: 5000, lpt: 0.06 })); } else { ch.n.forEach((m, k) => hold(E, X, 'strings', m, at(i), sp * 1.8, 0.55, { a: 0.02, r: 0.1, wide: 0.6 })); Sm(E, X, { i: 'piano', m: root, t: at(i), g: 0.6, pan: -0.2 }); Sm(E, X, { i: 'piano', m: root + 12, t: at(i), g: 0.5, pan: -0.1 }); } });
    else if (A !== 'a' && s.type !== 'I') { if (b % 4 === 0) Sm(E, X, { i: 'tbell', m: tr + 12, t, g: A === 'b' ? 0.9 : 0.55, pan: 0.4 }); if (A === 'b' && b % 4 === 2 && s.av % 2) Sm(E, X, { i: 'tbell', m: tr + 19, t: at(6), g: 0.5, pan: 0.4 }); }
    else if (b % 4 === 0 && s.type !== 'I') Sm(E, X, { i: 'piano', m: root, t, g: 0.9, pan: -0.2 });                                           // chamber: a low piano note where the bell would be
  }
};
// ---------- the chain bed of Fuse: shivering strings, a choir that grows, low brass, a clock that speeds up, a drum roll ----------
function buildDrone3(E, dk) {
  if (E.dry) { dk.dr = null; return; }
  const c = E.c, G = E.G, t0 = dk.t0, A = E.arr, D = { loops: [], three: true }, dry = dk.gs[0], rev = dk.gs[1], u = E.w();
  const grp = (rv) => { const g = G(1); g.connect(dry); const s = G(rv); g.connect(s); s.connect(rev); return g; };
  D.str = grp(0.5); D.vox = grp(0.65); D.brs = grp(0.45); D.one = grp(0.4); D.one.__n = 'lead';
  D.trem = G(1); D.trem.connect(D.str); D.lfo = c.createOscillator(); D.lfo.frequency.value = 7; D.lfoG = G(0.4); D.lfo.connect(D.lfoG); D.lfoG.connect(D.trem.gain); D.lfo.start(t0); dk.ends.push(D.lfo);
  D.filt = c.createBiquadFilter(); D.filt.type = 'lowpass'; D.filt.frequency.value = 1500; D.filt.connect(D.trem);
  const mk = (i, m, th, gmax, dst, w, pan) => { const bz = E.buf(i, m), g = G(0); g.connect(dst); for (let k = 0; k < 2; k++) { const src = c.createBufferSource(); src.buffer = bz.b; src.loop = true; const cents = (m - bz.z) * 100 + (k ? 5 : -4) * (1 + 3 * u); src.detune.value = cents; let o = src; if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp((pan || 0) + (k ? 0.6 : -0.6), -1, 1); src.connect(p); o = p; } o.connect(g); src.start(t0, (k * 0.43 + (m % 7) * 0.09) % 1.4); dk.ends.push(src); D.loops.push({ src, m, base: cents - (m - bz.z) * 100, z: bz.z, fixed: w === 'fixed' }); } E.nodes += 5; return { g, th, gmax, w: typeof w === 'number' ? w : 0.14 }; };
  D.lay = [];
  const strG = A === 'b' ? 0.5 : 1, voxG = A === 'a' ? 0.45 : 1, brG = A === 'a' ? 0 : 1;
  [[62, -0.12, 0.3], [69, 0.0, 0.3], [74, 0.35, 0.24], [81, 0.55, 0.16]].forEach(x => D.lay.push(mk('strings', x[0], x[1], x[2] * strG, D.filt)));
  D.lay.push(mk('strings', 85, 0.82 - 0.35 * E.u(), 0.11, D.filt, 'fixed'));                                         // the note a semitone off, near the top
  [['choirO', 50, 0.12, 0.3], ['choirO', 57, 0.24, 0.26], ['choirA', 62, 0.42, 0.24], ['choirA', 65, 0.56, 0.2], ['choirA', 69, 0.7, 0.2], ['choirA', 76, 0.84, 0.14]].forEach(x => D.lay.push(mk(x[0], x[1], x[2] - 0.3 * E.u(), x[3] * voxG, D.vox)));
  if (A === 'a') { D.lay.push(mk('cello', 50, 0.3, 0.3, D.brs)); D.lay.push(mk('bcl', 38, 0.5, 0.3, D.brs)); D.lay.push(mk('basses', 38, 0.7, 0.3, D.brs)); }
  else { D.lay.push(mk('horn', 50, 0.3, 0.3 * brG, D.brs)); D.lay.push(mk('horn', 57, 0.45, 0.26 * brG, D.brs)); D.lay.push(mk('bone', 38, 0.62, 0.3 * brG, D.brs, 0.3)); D.lay.push(mk(A === 'b' ? 'organ' : 'basses', 38, 0.2, 0.3, D.brs, 0.5)); }
  dk.dr = D;
}
function drone3I(E, dk, I, t, tau) {
  const D = dk.dr, k = tau || 0.3; D.lay.forEach(l => l.g.gain.setTargetAtTime(l.gmax * ramp(I, l.th, l.w + 0.2), t, k));
  D.filt.frequency.setTargetAtTime(1200 + 9000 * I * I, t, k); D.lfo.frequency.setTargetAtTime(6 + 8 * I, t, k); D.lfoG.gain.setTargetAtTime(0.25 + 0.3 * I, t, k);
}
function drone3Tick(E, dk, t) {
  const D = dk.dr, I = E.I, A = E.arr, r = dk.rng, n = Math.round(2 + 6 * I);
  for (let i = 0; i < n; i++) Sm(E, D.one, { i: (dk.tk = (dk.tk || 0) + 1) % 2 ? 'tick' : 'tock', t: t + i * 0.5 / n, g: 0.16 + 0.12 * I, strict: true, pan: -0.3 });
  if (A !== 'b' && I > 0.35) for (let i = 0; i < n; i++) if (r.chance(0.3 + 0.4 * I)) Sm(E, D.one, { i: 'legno', m: 50 + [0, 7, 12, 3][r.i(4)], t: t + (i + 0.5) * 0.5 / n, g: 0.14 + 0.2 * I, pan: 0.35 });
  if (I > 0.58) { const k = I > 0.85 ? 8 : 6; for (let i = 0; i < k; i++) Sm(E, D.one, { i: 'timp', m: 50 - (E.cix === 3 ? 5 : E.cix === 2 ? 7 : E.cix === 1 ? 4 : 0), t: t + i * 0.5 / k, g: (0.08 + 0.3 * (I - 0.58)) * (i % 2 ? 0.8 : 1), pan: 0.2 }); }   // a roll that swells
}
function drone3Chord(E, dk, ix, t) { const D = dk.dr, ch = CH[SFXCH[ix]]; D.loops.forEach(x => { if (!x.fixed) x.src.detune.setTargetAtTime((nearTone(x.m, ch) - x.z) * 100 + x.base, t, 0.06); }); }
function drone3Step(E, dk, t, n, m, g) {
  const D = dk.dr, A = E.arr; Sm(E, D.one, { i: A === 'b' ? 'harp' : 'piano', m: m - 12, t, g: g * 2.2, pan: -0.2 });
  if (A !== 'a' && (n % 3 === 1 || n >= 10)) Sm(E, D.one, { i: 'tbell', m: clamp(m, 50, 77), t, g: g * 1.6, pan: 0.4 }); if (A !== 'b') Sm(E, D.one, { i: 'pizz', m: m - 24, t, g: g * 2.4, pan: 0.3 });
  if (n >= 9) Sm(E, D.one, { i: 'bdrum', t, g: g * 1.6 });
}
// make ahead of time what a state will need first, a little at a time, so the first bar does not wait for it
function warm(E) {
  const A = E.arr, list = []; const add = (i, ms) => ms.forEach(m => list.push([i, m]));
  add('tick', [60]); add('tock', [60]); add('timp', [38, 44, 50, 56]); add('piano', [26, 32, 38, 44, 50, 56, 62, 68, 74]); add('strings', [54, 60, 66, 72, 78, 84]); add('choirO', [36, 42, 48, 54, 60, 66]); add('choirA', [49, 55, 61, 67, 73]);
  if (A !== 'b') { add('legno', [46, 52, 58]); add('pizz', [38, 44, 50, 56]); add('cello', [48, 54, 60, 66, 72]); } if (A !== 'a') { add('horn', [45, 51, 57, 63, 69]); add('bone', [40, 46, 52, 58, 64]); add('organ', [30, 36, 42, 48, 54, 60]); add('tbell', [51, 57, 63]); }
  add('bdrum', [30]); add('tam', [40]); let i = 0; const go = () => { const t0 = Date.now(); while (i < list.length && Date.now() - t0 < 12) { rawOf(list[i][0], list[i][1]); i++; } if (i < list.length) root.setTimeout(go, 30); }; go();
}
// ====================================================================================================================
// THE GROOVES (owner, 12 November, after the made orchestra: "still a bit too toony and now it's a little dark ... the
// building up needs to be way longer"). Themes 4, 5, 6 = AA.music.groove(1 | 2 | 3). No orchestra: instruments that a
// computer plays honestly because they are electric or simple: electric piano, vibraphone, marimba, upright and electric
// bass, a drum kit (brushes when calm, sticks when hot), clavinet, tonewheel organ with a rotary speaker, analog-style pads
// and a gliding lead, hand percussion, and lab glass as percussion, all through a little tape wobble and saturation.
// Bright modes on D (dorian, mixolydian, a lydian touch), not D minor. The build is long: intensity is a slow value that the
// game raises turn by turn across a round; a chain is a surge on top of it (step(n)); the groove never stops for a chain.
//   1 lab lounge: electric piano, vibes, upright bass, brushes, a sly swung tune; heats to an organ-and-kit groove
//   2 hypnotic: two short figures of different lengths drifting against each other, pads, a slow tune; grows by layers
//   3 mad science funk: clavinet, synth bass, tight kit, glass percussion; synth brass stabs for the blow-up
// ====================================================================================================================
Object.assign(CH, {
  Dm7: { r: 38, n: [60, 65, 69] }, G7: { r: 43, n: [59, 62, 65] }, Fmaj7: { r: 41, n: [60, 64, 69] }, Em7: { r: 40, n: [59, 62, 67] }, A7sus: { r: 33, n: [55, 62, 64] }, A7: { r: 33, n: [55, 61, 64] }, Cmaj7: { r: 36, n: [59, 64, 67] },
  D69: { r: 38, n: [59, 64, 66] }, Dadd9: { r: 38, n: [57, 64, 66] }, Cadd9: { r: 36, n: [55, 62, 64] }, Gmaj: { r: 43, n: [55, 59, 62] }, Dlyd: { r: 38, n: [57, 64, 68] }, Bm7: { r: 35, n: [57, 62, 66] }, Asus: { r: 33, n: [57, 62, 64] },
  D7: { r: 38, n: [60, 66, 69] }, G7f: { r: 43, n: [59, 65, 67] }, C7: { r: 36, n: [58, 64, 67] }, A7f: { r: 33, n: [55, 61, 64] }
});
TH[4] = { name: 'Lab lounge', line: 'electric piano, vibes, upright bass and brushes with a sly swung tune, heating to a burning organ-and-kit groove', upb: 16, bpm: [104, 122],
  prog: { A: ['Dm7', 'G7', 'Dm7', 'G7', 'Fmaj7', 'Em7', 'Dm7', 'A7sus'], B: ['G7', 'G7', 'Dm7', 'Dm7', 'Cmaj7', 'Em7', 'A7sus', 'A7'] }, alt: { A: { 3: 'Em7' }, B: { 1: 'Em7' } }, chain: ['Dm7', 'G7', 'Cmaj7', 'A7sus'],
  tune: { A: [[[2, 2, 69], [4, 2, 72], [6, 4, 74], [12, 2, 72], [14, 2, 69]], [[0, 6, 71], [8, 2, 67], [10, 6, 65]], [[2, 2, 69], [4, 2, 72], [6, 4, 74], [12, 2, 77], [14, 2, 76]], [[0, 10, 74], [12, 4, 71]],
               [[2, 2, 72], [4, 2, 76], [6, 4, 77], [12, 2, 76], [14, 2, 72]], [[0, 6, 74], [8, 2, 71], [10, 6, 67]], [[2, 2, 65], [4, 2, 69], [6, 2, 72], [8, 4, 74], [12, 4, 76]], [[0, 12, 74]]],
          B: [[[0, 4, 79], [4, 2, 77], [6, 6, 74], [14, 2, 71]], [[0, 6, 74], [6, 2, 71], [8, 8, 67]], [[0, 4, 77], [4, 2, 76], [6, 6, 72], [14, 2, 69]], [[0, 6, 72], [6, 2, 69], [8, 8, 65]],
               [[2, 2, 67], [4, 2, 71], [6, 2, 72], [8, 4, 76], [12, 4, 79]], [[0, 6, 79], [6, 2, 76], [8, 8, 74]], [[2, 2, 69], [4, 2, 74], [6, 4, 76], [12, 4, 79]], [[0, 4, 81], [4, 4, 79], [8, 8, 76]]] }, leads: ['vibes', 'vibes', 'vibes'] };
TH[5] = { name: 'Hypnotic', line: 'two short figures drifting against each other on electric piano and synth, warm pads, a slow tune, tape wobble; grows by layers', upb: 16, bpm: [98, 110],
  prog: { A: ['Dadd9', 'Dadd9', 'Cadd9', 'Gmaj', 'Dadd9', 'Dadd9', 'Cadd9', 'Gmaj'], B: ['Dlyd', 'Dlyd', 'Bm7', 'Bm7', 'Gmaj', 'Gmaj', 'Asus', 'Asus'] }, alt: { A: {}, B: {} }, chain: ['Dadd9', 'Gmaj', 'Cadd9', 'Asus'],
  tune: { A: [[[0, 8, 69], [8, 8, 76]], [[0, 12, 78], [12, 4, 76]], [[0, 8, 79], [8, 8, 76]], [[0, 16, 74]], [[0, 8, 69], [8, 4, 76], [12, 4, 81]], [[0, 12, 78], [12, 4, 74]], [[0, 8, 72], [8, 8, 76]], [[0, 16, 74]]],
          B: [[[0, 8, 80], [8, 8, 81]], [[0, 12, 78], [12, 4, 76]], [[0, 8, 74], [8, 8, 78]], [[0, 16, 81]], [[0, 8, 83], [8, 8, 79]], [[0, 12, 78], [12, 4, 74]], [[0, 8, 76], [8, 8, 74]], [[0, 16, 76]]] }, leads: ['glide', 'glide', 'glide'] };
TH[6] = { name: 'Mad science funk', line: 'clavinet, synth bass, a tight kit and glass percussion, with synth brass stabs for the blow-up', upb: 16, bpm: [100, 116],
  prog: { A: ['D7', 'D7', 'G7f', 'D7', 'D7', 'D7', 'C7', 'A7f'], B: ['G7f', 'G7f', 'D7', 'D7', 'C7', 'C7', 'A7f', 'A7f'] }, alt: { A: {}, B: {} }, chain: ['D7', 'G7f', 'C7', 'A7f'],
  tune: { A: [[[0, 2, 74], [3, 1, 74], [4, 1, 77], [5, 3, 78], [10, 2, 81], [12, 3, 79]], [[0, 3, 78], [3, 3, 74], [6, 2, 72], [8, 6, 74]], [[0, 2, 74], [3, 1, 74], [4, 1, 77], [5, 3, 79], [10, 2, 83], [12, 3, 81]], [[0, 3, 78], [3, 3, 74], [6, 2, 72], [8, 6, 74]],
               [[2, 2, 81], [4, 2, 84], [6, 2, 86], [9, 3, 84], [12, 4, 81]], [[0, 3, 78], [3, 3, 81], [6, 2, 78], [8, 6, 74]], [[0, 2, 76], [3, 1, 76], [4, 2, 79], [6, 4, 82], [12, 4, 79]], [[0, 3, 76], [3, 3, 73], [6, 2, 76], [8, 8, 81]]],
          B: [[[0, 6, 83], [6, 2, 81], [8, 2, 79], [10, 6, 77]], [[2, 2, 74], [4, 2, 77], [6, 2, 79], [8, 8, 83]], [[0, 6, 81], [6, 2, 78], [8, 2, 77], [10, 6, 74]], [[2, 2, 69], [4, 2, 72], [6, 2, 74], [8, 8, 78]],
               [[0, 6, 82], [6, 2, 79], [8, 2, 76], [10, 6, 72]], [[2, 2, 72], [4, 2, 76], [6, 2, 79], [8, 8, 82]], [[0, 4, 81], [4, 4, 79], [8, 4, 76], [12, 4, 73]], [[0, 3, 76], [3, 3, 79], [6, 2, 81], [8, 8, 85]]] }, leads: ['glide', 'glide', 'glide'] };
// the endings of the grooves: a close that lands bright, and a loss that slides off like a shrug, not a dirge
const STINGG = {
  won: { prog: ['Gmaj', 'A7sus', 'D69', 'D69'], tune: [[[0, 4, 71], [4, 4, 74], [8, 8, 79]], [[0, 4, 76], [4, 4, 79], [8, 8, 81]], [[0, 16, 78]], null] },
  lost: { prog: ['G7', 'Fmaj7', 'Em7', 'Em7'], tune: [[[0, 4, 74], [4, 4, 71], [8, 8, 69]], [[0, 6, 67], [6, 10, 64]], [[10, 2, 62], [12, 4, 64]], null] },
  runwon: { prog: ['Cadd9', 'Gmaj', 'D69', 'D69'], tune: [[[0, 8, 76], [8, 8, 79]], [[0, 8, 83], [8, 8, 86]], [[0, 16, 90]], [[0, 16, 86]]] },
  runlost: { prog: ['G7', 'Fmaj7', 'Em7', 'Dm7'], tune: [[[0, 16, 74]], [[0, 16, 72]], [[0, 8, 71], [8, 8, 67]], [[0, 16, 65]]] }
};
// ---- the groove instruments (made the same way as Fuse's: by code, on first use) ----
const rndParts = (seed, n, lo, hi, t0, t1, tilt) => { const r = RNG(seed), P = []; for (let i = 0; i < n; i++) { const f = lo * Math.pow(hi / lo, r()); P.push([f, Math.pow(f / lo, tilt || -0.3) * (0.5 + r()), t0 + (t1 - t0) * r()]); } return P; };
const fadeEnd = (x, s) => { const k = Math.min(x.length, Math.floor(s * SR)); for (let i = 0; i < k; i++) x[x.length - 1 - i] *= i / k; return x; };
function epiano(m, hard) {   // a tine struck by a hammer in front of a pickup: the tone barks when struck hard, then mellows; a small bell on top
  const f = mf(m), T = clamp(5.5 - (m - 36) * 0.055, 1.2, 5.5), n = Math.floor(Math.min(4.5, T) * SR), x = new Float32Array(n), w = 2 * Math.PI * f / SR, I0 = hard ? 2.4 : 1.8;
  for (let i = 0; i < n; i++) { const t = i / SR, ph = w * i, y = Math.sin(ph + I0 * Math.exp(-t / (hard ? 0.35 : 0.6)) * Math.sin(ph)) * Math.exp(-t / (T / 3)), b = Math.sin(ph + 0.5 * Math.exp(-t / 0.1) * Math.sin(14 * ph)) * 0.5 * Math.exp(-t / (T / 5)); const v = (y + b) * Math.min(1, i / 60); x[i] = v + 0.18 * v * v; }
  burst(x, 0, 0.008, 90, 900, 0.35, 5 + m); return norm(fadeEnd(x, 0.06), 0.85);
}
function synthBass(m) {      // a saw through a filter that snaps shut, with a sine underneath: one analog-style bass voice
  const f = mf(m), n = Math.floor(0.8 * SR), x = new Float32Array(n); let ph = 0, lo = 0, bd = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; ph = (ph + f / SR) % 1; const saw = 2 * ph - 1 + 0.5 * Math.sin(2 * Math.PI * (ph * 2 % 1)) * 0.2, fc = 160 + 2600 * Math.exp(-t / 0.06), k = 2 * Math.sin(Math.PI * Math.min(0.24, fc / SR)), hp = saw - lo - 0.55 * bd; bd += k * hp; lo += k * bd; x[i] = (lo + 0.8 * Math.sin(2 * Math.PI * f * t)) * Math.exp(-t / 0.3) * Math.min(1, i / 40); }
  return norm(fadeEnd(x, 0.04), 0.85);
}
Object.assign(INST, {
  rhodes:  { lo: 33, hi: 96, gen: m => epiano(m, false) }, rhodesH: { lo: 33, hi: 96, gen: m => epiano(m, true) },
  vibes:   { lo: 53, hi: 96, gen: m => { const f = mf(m), T = clamp(7 - (m - 53) * 0.08, 2.2, 7), x = modal([[f, 1, T], [f * 4, 0.5, T * 0.3], [f * 9.9, 0.14, T * 0.1]], Math.min(5, T)); burst(x, 0, 0.004, 600, 7000, 0.6, 3 + m); return norm(fadeEnd(x, 0.2), 0.85); } },
  marimba: { rr: 2, lo: 41, hi: 84, gen: m => { const f = mf(m), x = modal([[f, 1, 0.9], [f * 3.92, 0.25, 0.22], [f * 9.2, 0.07, 0.08]], 1); burst(x, 0, 0.005, 300, 2500, 0.2, 4 + m); return norm(x, 0.85); } },
  ubass:   { rr: 2, lo: 26, hi: 60, gen: m => { const x = body(pluck(mf(m), 2.4, 2.1, 0.12, 15 + m, 0.3), [[82, 7, 1], [160, 8, 0.9], [240, 9, 0.6], [420, 7, 0.3]], 1.6); burst(x, 0, 0.012, 500, 2600, 0.12, 16 + m); return norm(x, 0.85); } },
  ebass:   { lo: 26, hi: 60, gen: m => norm(pluck(mf(m), 3, 3.2, 0.15, 17 + m, 0.16), 0.85) },
  sbass:   { lo: 26, hi: 60, gen: m => synthBass(m) },
  clav:    { rr: 2, lo: 38, hi: 86, gen: m => { const x = pluck(mf(m), 0.9, 0.75, 0.97, 19 + m, 0.07); let lp = 0; for (let i = 0; i < x.length; i++) { lp += 0.02 * (x[i] - lp); x[i] -= lp * 0.8; } burst(x, 0, 0.003, 1500, 7000, 0.3, 20 + m); return norm(x, 0.85); } },
  tw:      { loop: 1, lo: 36, hi: 96, gen: m => padTone(mf(m) / 2, (n, f) => ({ 1: 0.8, 2: 1, 3: 0.5, 4: 0.6, 6: 0.25, 8: 0.2, 10: 0.12, 12: 0.12, 16: 0.25 }[n] || 0), 1.2, 103 + m, f => 0.0006 * bump(f, 3000, 3000, 1), true) },
  poly:    { loop: 1, lo: 36, hi: 96, gen: m => padTone(mf(m), (n, f) => 1 / n / (1 + Math.pow(f / 5200, 2)), 17, 113 + m) },
  kk:      { rr: 2, fix: 30, gen: () => { const n = Math.floor(0.45 * SR), x = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR; ph += 2 * Math.PI * (57 + 75 * Math.exp(-t / 0.022)) / SR; x[i] = Math.sin(ph) * Math.exp(-t / 0.11) * Math.min(1, i / 25); } burst(x, 0, 0.012, 60, 420, 0.6, 201); burst(x, 0, 0.003, 1800, 5500, 0.25, 202); return norm(x, 0.9); } },
  sn:      { rr: 3, fix: 50, gen: () => { const x = modal([[186, 1, 0.14], [332, 0.6, 0.1], [412, 0.3, 0.08]], 0.5); burst(x, 0, 0.1, 1500, 9000, 1.3, 203); burst(x, 0, 0.003, 3000, 11000, 0.6, 204); return norm(x, 0.9); } },
  brushS:  { rr: 3, fix: 50, gen: () => { const x = new Float32Array(Math.floor(0.4 * SR)); burst(x, 0, 0.09, 1800, 7500, 1, 205); const k = Math.floor(0.07 * SR); for (let i = 0; i < k; i++) x[i] *= (i / k) * (i / k); return norm(x, 0.8); } },
  brushT:  { rr: 3, fix: 50, gen: () => { const x = modal([[190, 0.5, 0.08]], 0.2); burst(x, 0, 0.022, 900, 6000, 1, 206); return norm(x, 0.8); } },
  hh:      { rr: 3, fix: 70, gen: () => { const x = modal(rndParts(207, 40, 3500, 13000, 0.03, 0.06), 0.15); burst(x, 0, 0.018, 6000, 14000, 2.5, 208); return norm(x, 0.8); } },
  hho:     { rr: 2, fix: 70, gen: () => { const x = modal(rndParts(209, 60, 3200, 13000, 0.25, 0.5), 0.6); burst(x, 0, 0.12, 5500, 14000, 2.5, 210); return norm(fadeEnd(x, 0.05), 0.8); } },
  ride:    { rr: 2, fix: 70, gen: () => { const x = modal(rndParts(211, 130, 900, 12000, 1.0, 2.6, -0.1), 2.4); burst(x, 0, 0.008, 3000, 11000, 2.6, 212); return norm(fadeEnd(x, 0.3), 0.8); } },
  crashC:  { fix: 70, gen: () => { const x = modal(rndParts(213, 220, 300, 13000, 0.8, 2.2, -0.15), 2.4, 0.004); burst(x, 0, 0.3, 3000, 13000, 3, 214); return norm(fadeEnd(x, 0.3), 0.85); } },
  tomK:    { lo: 40, hi: 55, gen: m => { const f = mf(m), x = modal([[f, 1, 0.5], [f * 1.5, 0.4, 0.28], [f * 2.1, 0.2, 0.16]], 0.7); burst(x, 0, 0.01, 800, 5000, 0.4, 215 + m); return norm(x, 0.9); } },
  rimK:    { rr: 2, fix: 70, gen: () => { const x = modal([[1720, 1, 0.035], [2460, 0.6, 0.025], [520, 0.5, 0.05]], 0.12); burst(x, 0, 0.002, 2000, 9000, 0.8, 216); return norm(x, 0.8); } },
  shaker:  { rr: 3, fix: 70, gen: () => { const x = new Float32Array(Math.floor(0.12 * SR)); burst(x, 0, 0.012, 4500, 12000, 1, 217); burst(x, 0.035, 0.02, 4000, 11000, 0.7, 218); return norm(x, 0.8); } },
  conga:   { rr: 2, lo: 55, hi: 64, gen: m => { const f = mf(m), x = modal([[f, 1, 0.32], [f * 2.02, 0.25, 0.12], [f * 3.1, 0.1, 0.07]], 0.5); burst(x, 0, 0.012, 1000, 4500, 0.5, 219 + m); return norm(x, 0.85); } },
  tamb:    { rr: 2, fix: 70, gen: () => { const x = modal(rndParts(221, 28, 5000, 12500, 0.08, 0.16), 0.3); burst(x, 0, 0.03, 5000, 13000, 1.5, 222); return norm(x, 0.8); } },
  clap:    { rr: 2, fix: 60, gen: () => { const x = new Float32Array(Math.floor(0.35 * SR)); [0, 0.011, 0.023].forEach((t0, i) => burst(x, t0, 0.006, 900, 5200, 1, 223 + i)); burst(x, 0.03, 0.07, 1000, 4800, 0.8, 227); return norm(x, 0.85); } },
  beaker:  { rr: 2, lo: 74, hi: 92, gen: m => { const f = mf(m), x = modal([[f, 1, 0.4], [f * 2.32, 0.5, 0.22], [f * 4.25, 0.3, 0.13], [f * 6.63, 0.12, 0.08]], 0.6); burst(x, 0, 0.002, 2500, 11000, 0.5, 229 + m); return norm(x, 0.8); } },
  smash:   { fix: 80, gen: () => { const x = modal(rndParts(231, 70, 2200, 12500, 0.08, 0.5), 0.9); [0, 0.04, 0.09, 0.16, 0.27].forEach((t0, i) => burst(x, t0, 0.012, 3000, 13000, 1.4 - i * 0.2, 233 + i)); return norm(x, 0.85); } }
});
// ---- the tracks: each theme from 4 up may bring its own tables (TRACK below); 4, 5, 6 keep the grooves' ----
const TK = { 4: { g: 1 }, 6: { g: 1.3 } }, TRACKS = [];
const tkG = (th, state, S) => { const k = TK[th]; return k ? (k.g || 1) * ((k.sg && k.sg[state]) || 1) : th === 5 ? (S.I > 0.8 ? 0.7 : 0.62) : 1; };
const trimOf = (th, sg) => TK[th] && TK[th].trim ? TK[th].trim(sg) : th === 4 ? 0.2 * (1 - 0.3 * sg) : th === 6 ? 0.6 * (1 - 0.15 * sg) : 0.45 * (1 - 0.4 * sg);
const wowOf = th => TK[th] && TK[th].wow !== undefined ? TK[th].wow : 1;
const leadAt = th => TK[th] && TK[th].leadAt !== undefined ? TK[th].leadAt : 0.28;
const hallOf = E => E.gv ? (TK[E.th] && TK[E.th].hall) || 6.5 : E.arr === 'a' && E.th === 3 ? 5 : 3.4;
// a track: th its theme number, id its name in AA.music.track(id); o brings the tune and chords (as TH), scale, mix, and its own play, lead and step
function TRACK(th, id, o) {
  TH[th] = { name: o.name, line: o.line, upb: 16, bpm: o.bpm, prog: o.prog, alt: o.alt || {}, chain: o.chain, tune: o.tune, leads: o.leads || ['x'], forms: o.forms };
  SCALES[th] = o.scale; GMIX[th] = o.mix; PLAY[th] = o.play; TK[th] = Object.assign(TK[th] || {}, o); TRACKS.push({ id, th, name: o.name, line: o.line, why: o.why || '' });
}
const LAYG = { drums: { rev: 0.1, dly: 0, sat: 1.15 }, bass: { rev: 0.03, dly: 0, sat: 1.3 }, pad: { rev: 0.28, dly: 0.05 }, lead: { rev: 0.22, dly: 0.14 }, arp: { rev: 0.2, dly: 0.16 }, vox: { rev: 0.18, dly: 0, sat: 2.2 }, bell: { rev: 0.25, dly: 0.08 } };
const GMIX = { 4: { drums: 3, bass: 1, pad: 0.7, lead: 1.2, arp: 3, vox: 1, bell: 6 }, 5: { drums: 2.8, bass: 1.8, pad: 2, lead: 1.2, arp: 1.6, vox: 1.2, bell: 6 }, 6: { drums: 2.4, bass: 1.1, pad: 1, lead: 1.3, arp: 5, vox: 0.9, bell: 5 } };   // set by measuring each layer alone
// the kit's own balance: the kick is all low end and was drowning the rest; brushes and cymbals are thin and were lost
const KITG = { kk: 0.3, hh: 3, hho: 2.5, ride: 2.5, brushS: 0.8, brushT: 0.8, shaker: 2.5, tamb: 2.5, rimK: 1.5, clap: 1.2, crashC: 1.3, tomK: 0.8 };
// swing: where step u of the bar really falls (1 lounge: the off eighths lean late, like a shuffle; 3 funk: the odd sixteenths a touch late)
const swingOf = (th, w) => th === 4 ? u => u + (u % 4 === 2 ? 0.62 : u % 4 === 3 ? 0.3 : u % 4 === 1 ? 0.3 : 0) : th === 6 ? u => u + (u % 2 ? 0.14 + 0.1 * w : 0) : u => u;
// a gliding analog-style lead: two saws and a triangle through a soft filter, sliding in from the last note played
function glideNote(E, dst, t, du, m, g, bright, id) { const f = mf(m), mem = E.glide || (E.glide = {}), last = mem[id || 0], from = last && t - last.e < 0.15 && t >= last.t ? last.f : f; mem[id || 0] = { f, t, e: t + du };
  V(E, dst, { t, f: from, f1: f, ft: 0.07 + 0.06 * E.w(), type: ['sawtooth', 'triangle', 'sawtooth'], det: [-7, 0, 6], g: g * 0.3, a: 0.02, h: du * 0.9, d: 0.22, lp: 1400 + 4500 * bright, lp1: 1000 + 2400 * bright, lpt: du, q: 1.6, pan: 0.1, vib: du > 0.4 ? { f: 5.4, c: 10, in: 0.3 } : null }); }
// a tonewheel organ note through a turning speaker: slow when calm, fast when hot
const organ = (E, dst, m, t, du, g, fast, pan) => { Sm(E, dst, { i: 'chiff', t, g: g * 0.22, pan: pan || 0 }); Sm(E, dst, { i: 'tw', m, t, g, dur: du, a: 0.012, r: 0.06, wide: 0.5, pan: pan || 0, vib: fast ? 5 : 2 }); };
// one note of the tune, as each groove plays it
function grooveLead(E, dk, t, du, m, g, mode) {
  const L = dk.L.lead.in, X = dk.L.vox.in, I = E.I, hot = mode === 'oct' || I > 0.82, th = E.th, short = du < 0.1; if (hot) g *= 0.6;
  if (mode === 'low') { Sm(E, L, { i: 'rhodes', m: m - 12, t, g: g * 0.8, dur: du + 0.6, pan: -0.1 }); return; }
  if (th === 4) { Sm(E, L, { i: 'vibes', m, t, g: g * 0.8, dur: short ? 0.07 : du + 0.8, r: short ? 0.05 : 0.3, trem: 5.2, pan: 0.2 }); if (I > 0.6) Sm(E, L, { i: 'rhodes', m: m - 12, t, g: g * 0.35, dur: du + 0.3, pan: -0.2 }); if (hot) { organ(E, X, m, t, du * 0.95, g * 0.5, true, -0.1); organ(E, X, m + 12, t, du * 0.95, g * 0.25, true, 0.2); } }
  else if (th === 5) { if (I > 0.6 || hot) glideNote(E, L, t, du, m, g * (hot ? 2.2 : 1.8), 0.3 + 0.5 * I, 0); else Sm(E, L, { i: 'rhodes', m, t, g: g * 0.9, dur: du + 0.5, pan: 0.15 }); Sm(E, L, { i: 'vibes', m, t, g: g * (I > 0.6 ? 0.3 : 0.6), dur: short ? 0.07 : du + 0.8, r: 0.3, trem: 4.4, pan: -0.25 }); if (hot) glideNote(E, L, t, du, m + 12, g * 0.9, 0.8, 1); }
  else { if (I > 0.6 || hot) glideNote(E, L, t, du, m - 12, g, 0.5 + 0.5 * I, 0); else Sm(E, L, { i: 'rhodesH', m: m - 12, t, g: g * 0.7, dur: du + 0.3, pan: 0.3 }); Sm(E, L, { i: 'clav', m: m - 12, t, g: g * (I > 0.6 ? 0.4 : 0.9), dur: du, pan: -0.5, lp: 1500, lp1: 6000, lpt: 0.05 }); if (hot) Sm(E, X, { i: 'poly', m, t, g: g * 0.7, dur: du * 0.9, a: 0.02, r: 0.1, wide: 0.6, lp: 600, lp1: 5200, lpt: 0.06 }); }
}
// a bar of a groove. I is the heat (the slow value plus the surge of a chain): things join as it rises.
function playGroove(E, dk, t, b, ch, name) {
  const s = dk.sec, r = dk.rng, S_ = dk.S, L = dk.L, I = E.I, sp = dk.spu, w = E.w(), th = E.th, sw = dk.sw, at = u => t + sw(u) * sp, st = dk.drum || S_.drum, last = b === s.len - 1, bar = 16 * sp, root = s.pedal ? 38 : ch.r, gE = dk.bar * 8;
  const D = L.drums.in, B = L.bass.in, P = L.pad.in, A = L.arp.in, X = L.vox.in, G = L.bell.in, drums = st !== 'none', intro = s.type === 'I', brk = s.brk && b < 4;
  const peak = st === 'heavy', kitUp = (th !== 6 && I > 0.8 ? 1.7 : 1), hit = (i, u, g, o) => Sm(E, D, Object.assign({ i, t: at(u), g: g * (KITG[i] || 1) * kitUp }, o || {})), fill = (last || (w > 0.4 && b % 4 === 3)) && s.fill && I > 0.5 && drums;
  if (peak && drums) { [0, 4, 8, 12].forEach(u => hit('kk', u, 0.5)); if (b % 2 === 0 && dk.bar > 0) hit('crashC', 0, 0.3, { pan: b % 4 ? 0.3 : -0.3 }); [2, 6, 10, 14].forEach(u => hit('hho', u, 0.14, { pan: 0.3 })); }
  const chord = (i, u, du, g, o) => ch.n.forEach((m, k) => Sm(E, P, Object.assign({ i, m, t: at(u) + k * 0.006, g, dur: du, pan: (k - 1) * 0.3 }, o || {})));
  if (th === 4) {
    if (drums && !brk) {
      if (I < 0.5) { [0, 4, 8, 12].forEach(u => hit('brushS', u, u % 8 ? 0.42 : 0.3, { pan: -0.15 })); [2, 6, 10, 14].forEach(u => { if (r.chance(0.7)) hit('brushT', u, 0.18 + 0.1 * r(), { pan: -0.1 }); }); if (I > 0.2) [4, 12].forEach(u => hit('hh', u, 0.14, { pan: 0.3 })); if (I > 0.3 && !intro) hit('kk', 0, 0.3); }
      else { [0, 4, 6, 8, 12, 14].forEach(u => hit('ride', u, u % 4 ? 0.2 : 0.3, { pan: 0.35 })); [4, 12].forEach(u => { hit('hh', u, 0.16, { pan: 0.3 }); hit(I < 0.7 ? 'rimK' : 'sn', u, I < 0.7 ? 0.4 : 0.5, { pan: -0.1 }); }); if (!peak) pat(['x.........x.....', 'x.....x...x.....', 'x......x..x...x.'][s.dv % 3], u => hit('kk', u, 0.55));
        for (let u = 1; u < 16; u++) if (u % 4 !== 0 && r.chance(0.1 + 0.15 * (I - 0.5) + 0.15 * w)) hit('sn', u, 0.1 + 0.08 * r(), { pan: -0.1, lp: 3500 }); if (b === 0 && I > 0.8 && !intro && !peak) hit('crashC', 0, 0.35, { pan: -0.3 }); }
      if (fill) [10, 11, 12, 13, 14, 15].forEach((u, k) => { if (r.chance(0.8)) hit(k % 3 === 2 ? 'tomK' : 'sn', u, 0.2 + 0.05 * k, { m: 50 - k, pan: (k - 2.5) * 0.2 }); });
    }
    // upright bass: two to the bar when cool, walking when warm
    const b3 = ch.n[r.i(3)] - 24, nx = CH[s.prog[(b + 1) % s.prog.length]].r, bn = (u, m, g, du) => Sm(E, B, { i: 'ubass', m, t: at(u), g, dur: du * sp, pan: 0.15 });
    if (I < 0.3) { bn(0, root, 0.8, 7); bn(8, s.bv % 2 ? root + 7 : root, 0.6, 6); if (r.chance(0.4)) bn(14, nx - 1, 0.45, 2); }
    else { bn(0, root, 0.85, 4); bn(4, b3, 0.7, 4); bn(8, root + 7, 0.75, 4); bn(12, nx + (r.chance(0.5) ? -1 : 1), 0.7, 4); if (I > 0.7 && r.chance(0.5)) bn(14, nx - 2, 0.4, 2); }
    // electric piano: comping
    const pt = I < 0.25 ? [[0, 14]] : [[[0, 5], [6, 8]], [[6, 5], [14, 2]], [[2, 4], [10, 5]], [[0, 3], [6, 3], [12, 3]]][(s.bv + b) % 4]; pt.forEach(x => chord(I > 0.45 ? 'rhodesH' : 'rhodes', x[0], x[1] * sp + 0.3, 0.4 + 0.1 * I));
    if (I > 0.4 && I < 0.78 && !intro) [2, 10].forEach((u, k) => { if (r.chance(0.6)) Sm(E, A, { i: 'marimba', m: ch.n[(k + b) % 3] - 12, t: at(u), g: 0.3, pan: -0.4 }); });
    if (I > 0.68) { const fast = I > 0.85; if (fast) [[2, 2], [6, 2], [10, 3], [14, 2]].forEach(x => ch.n.forEach((m, k) => organ(E, X, m + (k === 0 ? 12 : 0), at(x[0]), x[1] * sp, 0.26, true, (k - 1) * 0.3))); else ch.n.forEach((m, k) => organ(E, X, m, t, bar - 0.1, 0.2, false, (k - 1) * 0.3)); }
    if (!intro) { if (I < 0.6 && r.chance(0.35)) Sm(E, G, { i: 'beaker', m: 78 + r.i(3) * 4, t: at([6, 10, 14][r.i(3)]), g: 0.16, pan: 0.5 }); if (I > 0.45 && drums) [6, 10, 14].forEach((u, k) => { if (r.chance(0.6)) Sm(E, G, { i: 'conga', m: k === 1 ? 57 : 62, t: at(u), g: 0.3, pan: 0.45 }); }); }
  } else if (th === 5) {
    if (drums && !brk && !intro) {
      if (I > 0.42 && !peak) [0, 4, 8, 12].forEach(u => hit('kk', u, 0.34 + 0.25 * I)); if (I > 0.42) for (let u = 0; u < 16; u++) hit('shaker', u, (u % 4 === 2 ? 0.2 : 0.09) * (0.8 + 0.4 * r()), { pan: 0.4 });
      if (I > 0.62) { [2, 6, 10, 14].forEach(u => hit(I > 0.9 && !peak ? 'hho' : 'hh', u, 0.16, { pan: 0.3 })); [4, 12].forEach(u => hit('rimK', u, 0.34, { pan: -0.15 })); } if (I > 0.82) [4, 12].forEach(u => { hit('clap', u, 0.34); hit('sn', u, 0.3, { pan: -0.1 }); });
      if (fill && I > 0.8) [12, 13, 14, 15].forEach((u, k) => hit('sn', u, 0.14 + 0.06 * k, { pan: -0.1 }));
    }
    if (I > 0.13) { if (I < 0.72) Sm(E, B, { i: 'ebass', m: root, t, g: 0.55, dur: bar - 0.05 }); else pat(['x..x..x.x..x..x.', 'x.....x.x..x....', 'x..x....x.x...x.'][s.bv % 3], u => Sm(E, B, { i: 'ebass', m: root + (u === 6 || u === 14 ? 12 : u === 11 ? 7 : 0), t: at(u), g: 0.6, dur: sp * 2.4 })); }
    if (I > 0.1) ch.n.concat([ch.n[0] + 12]).forEach((m, k) => Sm(E, P, { i: 'poly', m, t, g: 0.17, dur: bar + 0.4, a: 0.5, r: 0.7, wide: 0.7, lp: 1200 + 9000 * I, pan: (k - 1.5) * 0.2 }));
    // the two figures: five notes against six, an eighth each, so they drift and meet again every thirty eighths
    const rot = (a, n) => a.slice(n % a.length).concat(a.slice(0, n % a.length)), cA = rot([ch.r + 24, ch.n[1], ch.n[2], ch.n[0] + 12, ch.n[1] + 12], s.av), cB = rot([ch.n[2], ch.n[0], ch.n[1], ch.n[2] - 12, ch.n[0], ch.n[1] - 12], s.bv), restA = s.dv % 2 ? s.bv % 5 : -1, restB = s.dv > 2 ? s.av % 6 : -1;
    for (let u = 0; u < 16; u += 2) { const k = gE + u / 2; if (k % 5 !== restA) Sm(E, A, { i: 'rhodes', m: cA[k % 5], t: at(u), g: 0.3 + (k % 5 === 0 ? 0.1 : 0), dur: sp * 3, pan: -0.35 }); }
    if (I > 0.33) for (let u = 0; u < 16; u += 2) { const k = gE + u / 2, m = cB[k % 6]; if (k % 6 !== restB) Sm(E, A, { i: 'marimba', m, t: at(u), g: 0.22 + 0.12 * I, dur: clamp(0.9 - (m - 45) * 0.025, 0.22, 0.9), pan: 0.4 }); }
    if (I > 0.68) [74, 81].forEach((m, k) => organ(E, X, m, t, bar - 0.1, 0.13 + 0.08 * I, I > 0.9, k ? 0.3 : -0.3));
    if (I > 0.08) for (let u = 0; u < 16; u += 2) if ((gE + u / 2) % 7 === 0) Sm(E, G, { i: 'beaker', m: 86, t: at(u), g: 0.13, pan: 0.55 });
  } else {
    if (drums && !brk) {
      if (I > 0.13 && !intro) { if (!peak) pat(['x.....x...x.....', 'x..x......x..x..', 'x.....x..xx.....'][s.dv % 3], u => hit('kk', u, 0.6)); for (let u = 0; u < 16; u++) { if (I > 0.85 && u % 4 === 2 && !peak) hit('hho', u, 0.2, { pan: 0.3 }); else hit('hh', u, (u % 2 ? 0.08 : 0.17) * (0.8 + 0.4 * r()), { pan: 0.3 }); } }
      if (I > 0.43) { [4, 12].forEach(u => hit('sn', u, 0.55, { pan: -0.1 })); for (let u = 1; u < 16; u++) if (u % 4 !== 0 && r.chance(0.12 + 0.12 * w)) hit('sn', u, 0.1 + 0.06 * r(), { pan: -0.1, lp: 3500 }); if (I > 0.6) [4, 12].forEach(u => hit('clap', u, 0.2)); }
      if (I > 0.63) { [3, 6, 11, 14].forEach((u, k) => { if (r.chance(0.7)) hit('conga', u, 0.3, { m: k % 2 ? 57 : 62, pan: 0.45 }); }); for (let u = 0; u < 16; u += 2) hit('tamb', u, u % 4 === 2 ? 0.16 : 0.07, { pan: -0.4 }); }
      if (b === 0 && I > 0.8 && !intro && !peak) hit('crashC', 0, 0.35, { pan: -0.3 }); if (fill) [12, 13, 14, 15].forEach((u, k) => hit(k === 3 ? 'tomK' : 'sn', u, 0.22 + 0.07 * k, { m: 45, pan: (k - 1.5) * 0.25 }));
    }
    // lab glass as percussion: threes and twos on beakers, a higher one off the beat
    (I < 0.3 ? [0] : [0, 6, 12]).forEach((u, k) => Sm(E, G, { i: 'beaker', m: [81, 86, 81][k], t: at(u), g: 0.14, pan: 0.7 })); if (!intro) [3, 10].forEach(u => { if (r.chance(0.6)) Sm(E, G, { i: 'beaker', m: 93, t: at(u), g: 0.12, pan: -0.7 }); });
    // clavinet: a muted few notes when cool, the whole riff when warm
    const cp = I < 0.43 ? 'x..x....x.......' : ['x.xx.x.xx.x.xx.x', 'x..x.xx.x.xx.x.x', 'x.x..xx.x.x.xx..'][(s.av + b) % 3]; if (!intro || b > 0) pat(cp, u => { const m = (u % 8 === 0 ? root + 24 : u % 3 === 0 ? ch.n[0] : u % 3 === 1 ? root + 24 + 10 : root + 36); Sm(E, A, { i: 'clav', m: m > 74 ? m - 12 : m, t: at(u), g: (u % 4 === 0 ? 0.36 : 0.24) * (I < 0.43 ? 0.8 : 1), dur: sp * (u % 4 === 0 ? 1.6 : 0.9), pan: -0.5, lp: 900 + 1200 * I, lp1: 2500 + 6000 * I, lpt: 0.06 }); });
    if (I > 0.28) pat(['x..x..x...x.x...', 'x.....x..x..x.x.', 'x..x....x.x...x.'][s.bv % 3], u => Sm(E, B, { i: 'sbass', m: root + (u === 12 ? 10 : u === 14 ? 12 : u === 3 ? 12 : 0), t: at(u), g: 0.6, dur: sp * (u === 0 ? 2.6 : 1.5) }));
    if (I > 0.73) [6, 14].forEach(u => chord('rhodesH', u, sp * 1.6, 0.28)); if (I < 0.28 && !drums) chord('rhodes', 0, bar, 0.3);
    if (I > 0.83) [0, 6, 12].forEach(u => ch.n.forEach((m, k) => Sm(E, X, { i: 'poly', m: m + (k === 2 ? 0 : 12), t: at(u), g: 0.34, dur: sp * 2.2, a: 0.015, r: 0.1, wide: 0.6, pan: (k - 1) * 0.4, lp: 500, lp1: 5600, lpt: 0.05 })));
  }
  // wilder, not sadder: in later rounds a glass breaks on the downbeat now and then, and the organ smears up into a bar
  if (w > 0.5 && I > 0.7 && b === 0 && !intro && r.chance(0.5 * w)) Sm(E, G, { i: 'smash', t, g: 0.3 * w, pan: 0.4 });
  if (w > 0.3 && last && I > 0.5 && r.chance(0.35 * w)) for (let k = 0; k < 6; k++) organ(E, X, ch.n[1] + 12 - 6 + k, t + bar - (6 - k) * sp * 0.33, sp * 0.4, 0.2, true, 0.2);
}
// a step of a chain in a groove: the surge goes up, the chord moves to the chain chord, and one note rings, climbing
function grooveStep(E, dk, t, n) {
  const ch = dk.curCh || CH[TH[E.th].chain[E.cix]], m = nearTone(64 + Math.min(n, 14) * 1.6, ch), G = dk.L.bell.in, g = 0.3 + 0.03 * Math.min(n, 12);
  if (E.th === 4) { Sm(E, G, { i: 'vibes', m, t, g, dur: 1.6, trem: 5.2, pan: 0.3 }); Sm(E, dk.L.drums.in, { i: 'ride', t, g: 0.2, pan: 0.35 }); }
  else if (E.th === 5) { Sm(E, G, { i: 'rhodes', m, t, g, dur: 1.6, pan: -0.3 }); Sm(E, G, { i: 'beaker', m: clamp(m + 12, 74, 92), t, g: 0.18, pan: 0.5 }); }
  else { Sm(E, G, { i: 'clav', m, t, g: g * 1.2, dur: 0.5, pan: -0.3 }); Sm(E, G, { i: 'beaker', m: clamp(m + 12, 74, 92), t, g: 0.22, pan: 0.5 }); }
  if (n >= 5) Sm(E, dk.L.drums.in, { i: 'sn', t, g: 0.2 + 0.03 * Math.min(n - 5, 8), pan: -0.1 }); if (n % 4 === 0 || n >= 11) Sm(E, dk.L.drums.in, { i: 'tomK', m: 50 - (n % 3) * 3, t: t + 0.09, g: 0.3, pan: 0.2 });
}
PLAY[4] = PLAY[5] = PLAY[6] = playGroove;
const ORDER = ['funk', 'gothic', 'edm', 'metal', 'surf', 'baroque'];
TRACKS.push({ id: 'funk', th: 6, name: TH[6].name, line: TH[6].line, why: '' });
// <<<TRACKS (each track's own block goes between these two lines)
// <<<TRACK:gothic
// The gothic hybrid (the made orchestra of Fuse, arrangement c), which the owner liked: "I like the gothic hybrid just tweak it
// a little" after "a bit too toony and now it's a little dark ... the building up needs to be way longer". Tweaked, not rebuilt:
// - less cartoon plucking: the wood of the bow only on the three accents, the bass bowed with a pluck on the accents alone
// - a touch more light: D dorian (G major and C in place of G minor, B flat and the diminished chord), the strings opened up,
//   a harp and a celesta now and then, the choir waits until it is warm, endings that land on D major
// - the long build: it runs on the grooves' engine, so the heat of the round brings things in turn by turn and a chain is a
//   surge of the same music (the chain chords have roots D, G, C, A like every other track)
Object.assign(CH, { gtG: { r: 43, n: [59, 62, 67] }, gtC: { r: 36, n: [60, 64, 67] }, gtF: { r: 41, n: [60, 65, 69] } });
const gothB = bars => bars.map(b => b.map(x => [x[0], x[1], ((x[2] % 12) + 12) % 12 === 10 ? x[2] + 1 : x[2]]));   // the tune as it was, B flat raised to B
function gothPlay(E, dk, t, b, ch, name) {
  const s = dk.sec, r = dk.rng, S_ = dk.S, L = dk.L, I = E.I, sp = dk.spu, at = u => t + u * sp, st = dk.drum || S_.drum, last = b === s.len - 1, u9 = E.w(), bar = 16 * sp;
  const hv = st === 'heavy' || I > 0.88, lvl = st === 'none' ? -1 : hv ? 3 : (st === 'main' && I > 0.5) || I > 0.62 ? 2 : st === 'light' || I > 0.4 ? 1 : 0;
  const root = s.pedal ? 38 : ch.r, tr = root + 12 > 57 ? root : root + 12, ACC = [0, 6, 12], intro = s.type === 'I', brk = s.brk && b < 4;
  const D = L.drums.in, B = L.bass.in, P = L.pad.in, X = L.arp.in, VX = L.vox.in, G = L.bell.in, calm = I < 0.3;
  // when a chain step moves the chord mid-bar the engine drops every note that began before the step: a held note is started again from the step
  const re = E.reT && E.reT > t ? E.reT : 0, H = (dst, i, m, t0, du, g, o) => { if (re && t0 < re) { if (t0 + du < re + 0.25) return; du -= re - t0; t0 = re; o = Object.assign({}, o, { a: 0.03 }); } hold(E, dst, i, m, t0, du, g, o); };
  if (lvl >= 0) {
    if (!hv) for (let i = 0; i < 16; i += 2) Sm(E, D, { i: (i / 2) % 2 ? 'tock' : 'tick', t: at(i), g: (ACC.indexOf(i) >= 0 ? 0.5 : 0.32) * (lvl === 0 ? 1.2 : 0.9), strict: u9 < 0.3, pan: -0.3 });
    if (!brk) {
      if (!intro && I > 0.3) ACC.forEach(i => Sm(E, D, { i: 'legno', m: ch.n[0] - 12, t: at(i), g: 0.5, pan: 0.35 }));
      if (hv) { pat(['x..x..x...x.x...', 'x..x..x..xx...x.'][(s.dv + b) % 2], i => Sm(E, D, { i: 'timp', m: i % 6 === 3 || i === 10 ? tr + 7 > 57 ? tr - 5 : tr + 7 : tr, t: at(i), g: 0.75, pan: 0.2 })); Sm(E, D, { i: 'bdrum', t, g: 0.9 }); Sm(E, D, { i: 'bdrum', t: at(8), g: 0.6 });
        pat('....x.......x...', i => Sm(E, D, { i: 'anvil', m: 76 + (r() - 0.5) * 0.6, t: at(i), g: 0.5, pan: -0.4 })); pat('x.....x...x.....', i => Sm(E, D, { i: 'kick', t: at(i), g: 0.5 })); pat('....x.......x...', i => Sm(E, D, { i: 'fdrum', t: at(i), g: 0.45, pan: 0.1 }));
        if (b % 2) pat('..........x.x.xx', i => Sm(E, D, { i: 'timp', m: tr, t: at(i), g: 0.35 + 0.08 * (i - 10), pan: 0.2 })); if (b % 4 === 0) Sm(E, D, { i: 'tam', t, g: 0.45, pan: -0.2 }); }
      else if (lvl === 2) { pat(['x.....x.....x...', 'x.....x...x.....', 'x..x..x.....x...'][s.dv % 3], i => Sm(E, D, { i: 'timp', m: tr, t: at(i), g: i ? 0.45 : 0.7, pan: 0.2 })); Sm(E, D, { i: 'kick', t, g: 0.55 }); if (!intro) Sm(E, D, { i: 'fdrum', t: at(8), g: 0.28 + 0.3 * Math.max(0, I - 0.62), pan: 0.1 });
        if ((last || (b % 4 === 3 && I > 0.75)) && s.fill) for (let i = 0; i < 8; i++) Sm(E, D, { i: 'timp', m: tr, t: at(12) + i * sp / 2, g: 0.16 + 0.05 * i, pan: 0.2 }); }
      else if (lvl === 1) { if (b % 2 === 0) Sm(E, D, { i: 'timp', m: tr, t, g: 0.3, pan: 0.2 }); Sm(E, D, { i: 'kick', t, g: 0.4 }); }
      else if (b % 4 === 0 && I > 0.15) Sm(E, D, { i: 'timp', m: tr, t, g: 0.26, pan: 0.2 });
    }
  }
  { // the bass: bowed, with a pluck only where the accents fall
    const loud = hv || I > 0.72, Pt = calm ? 'x...............' : ['x.....x.....x...', 'x.....x...x.x...', 'x..x..x.....x.x.', 'x.....x..x..x...'][s.bv];
    pat(Pt, i => { const m = root + 12 + (i === 14 ? 7 : i === 10 && s.bv === 1 ? 12 : 0); if (ACC.indexOf(i) >= 0) Sm(E, B, { i: 'pizz', m, t: at(i), g: 0.45, pan: 0.3 }); H(B, 'basses', m, at(i), sp * (ACC.indexOf(i) >= 0 ? 4 : 2.2), ACC.indexOf(i) >= 0 ? 0.42 : 0.3, { a: 0.04, r: 0.14, pan: 0.3 }); });
    V(E, B, { t, f: mf(root), g: 0.16, a: 0.02, h: sp * 4, d: sp * 6 });
    if (loud) ACC.forEach(i => { H(B, 'basses', root + 12, at(i), sp * 4, 0.6, { a: 0.03, r: 0.15, pan: 0.3 }); H(B, 'bone', root + 12, at(i), sp * 4, 0.45, { a: 0.04, r: 0.15, pan: 0.25, lp: 700, lp1: 3500, lpt: 0.08 }); });
  }
  { // strings, opened up; the organ and a low choir once it is warm
    const soft = I < 0.45;
    ch.n.forEach((m, i) => (calm && i === 1) || H(P, 'strings', m - (i === 2 ? 12 : 0), t, bar - 0.15, calm ? 0.2 : 0.3, { a: 0.3, r: 0.4, wide: 0.7, trem: soft ? 10 + 2 * i : 0, lp: 4500 + 10000 * I }));
    if (b >= 4 && soft && !calm) H(P, 'strings', name === 'gtC' ? 79 : 81, t, bar - 0.2, 0.12, { a: 0.6, r: 0.5, wide: 0.8, trem: 13 });
    if (I >= 0.45) { ch.n.forEach(m => H(P, 'organ', m - 12, t, bar - 0.1, 0.14, { a: 0.12, r: 0.3, wide: 0.5 })); H(P, 'choirO', ch.n[0] - 12, t, bar - 0.2, 0.26, { a: 0.4, r: 0.5, wide: 0.7 }); H(P, 'choirO', ch.n[2] - 12, t, bar - 0.2, 0.2, { a: 0.5, r: 0.5, wide: 0.7 }); }
  }
  { // the piano turns the chord over, an octave higher in the second half of a section; a harp answers now and then; a celesta when warm
    const pos = [[4, 10, 14], [3, 9], [6, 12, 15], [2, 8, 14], [10, 13], [4, 7, 12]][(s.av + (r.chance(0.5) ? b : 0)) % 6], up = b >= 4 ? 12 : 0, tones = [ch.n[0] - 12, ch.n[1] - 12, ch.n[2] - 12, ch.n[0], ch.n[1]];
    pos.slice(0, calm ? 2 : 3).forEach((p, i) => { let m = tones[(i * 2 + s.av + b) % 5] + up; if (r.chance(0.07 * u9)) m += r.chance(0.5) ? 1 : 6; const ins = r.chance(0.6 * u9) ? 'prep' : 'piano'; Sm(E, X, { i: ins, m, t: at(p), g: calm ? 0.28 : 0.36, pan: -0.2 + i * 0.1, lp: ins === 'piano' ? 3000 + 6000 * I : 0 }); });
    if (!intro && b % 4 === 3 && I < 0.7 && s.av % 2 === 0) [0, 1, 2].forEach(k => Sm(E, X, { i: 'harp', m: ch.n[k] + 12, t: at(8 + 2 * k), g: 0.2, pan: 0.45 }));
    if (I > 0.5 && b % 2 === 0) Sm(E, X, { i: 'celesta', m: ch.n[2] + 12, t: at(8), g: 0.2, pan: -0.4 });
  }
  if (I > 0.35) { const big = I > 0.7; [root + 12, root + 19].forEach((m, i) => H(VX, big ? 'choirA' : 'choirO', m, t, bar - 0.25, 0.42, { a: 0.4, r: 0.5, wide: 0.7, pan: i ? 0.2 : -0.2 })); if (big) ch.n.forEach(m => H(VX, 'choirA', m, t, bar - 0.25, 0.28, { a: 0.3, r: 0.5, wide: 0.8 })); }
  if (hv || I > 0.7) ACC.forEach(i => ch.n.forEach((m, k) => H(G, k === 1 ? 'horn' : 'bone', m - 12, at(i), sp * 2.6, 0.5, { a: 0.03, r: 0.14, pan: (k - 1) * 0.5, lp: 600, lp1: 5000, lpt: 0.06 })));
  else if (!intro && b % 4 === 0 && I > 0.22) Sm(E, G, { i: 'tbell', m: tr + 12, t, g: 0.55, pan: 0.4 });
}
function gothLead(E, dk, t, du, m, g, mode) { const k = E.arr; E.arr = 'c'; try { fuseLead(E, dk, t, du, m, g, mode); } finally { E.arr = k; } }
// a chain step: a kettledrum on the chord's root, a harp note climbing, and from step 5 a short string swell
function gothStep(E, dk, t, n) {
  const ch = dk.curCh || CH[TH[E.th].chain[E.cix]], m = nearTone(66 + Math.min(n, 14) * 1.6, ch), tr = ch.r + 12 > 57 ? ch.r : ch.r + 12;
  Sm(E, dk.L.bell.in, { i: 'harp', m, t, g: 0.34 + 0.03 * Math.min(n, 12), pan: 0.4 }); Sm(E, dk.L.drums.in, { i: 'timp', m: tr, t, g: 0.3 + 0.03 * Math.min(n, 12), pan: 0.2 });
  if (n >= 5) hold(E, dk.L.pad.in, 'strings', m, t, 0.5, 0.2, { a: 0.02, r: 0.3, wide: 0.7 });
}
TRACK(7, 'gothic', {
  name: 'Gothic hybrid', line: 'a clock, strings that wait and a cello tune; then kettledrums, low brass, an organ and a choir with a restrained modern bass and drums',
  why: 'the owner liked it: the old-laboratory theme, tweaked only a little',
  bpm: [92, 108], scale: [0, 2, 3, 5, 7, 9, 10], chain: ['Dm', 'gtG', 'gtC', 'Asus'],
  prog: { A: ['Dm', 'Dm', 'gtG', 'A', 'gtG', 'Dm', 'A', 'Dm'], B: ['gtG', 'gtC', 'Dm', 'Dm', 'gtG', 'gtC', 'A', 'A'] }, alt: { A: { 1: 'A' }, B: { 3: 'gtF' } }, forms: ['AABA', 'ABAB', 'AABB', 'ABAA'],
  tune: { A: gothB(TH[3].tune.A), B: gothB(TH[3].tune.B) },
  sting: { won: { prog: ['gtG', 'Asus', 'D', 'D'], tune: STINGG.won.tune }, lost: { prog: ['gtG', 'gtF', 'Dm', 'Dm'], tune: STINGG.lost.tune }, runwon: { prog: ['gtC', 'gtG', 'D', 'D'], tune: STINGG.runwon.tune }, runlost: { prog: ['gtG', 'gtF', 'gtC', 'Dm'], tune: STINGG.runlost.tune } },
  mix: { drums: 0.5, bass: 0.6, pad: 1.5, lead: 0.75, arp: 2.5, vox: 1, bell: 1 }, lay: LAYF,
  g: 1, sg: { overreact: 1.23, runwon: 1.15, plan: 0.9 }, wow: 0.15, hall: 3.4, leadAt: 0.28, swing: () => (u => u), trim: sg => 0.5 * (1 - 0.3 * sg),
  play: gothPlay, lead: gothLead, step: gothStep
});
// TRACK:gothic>>>
// <<<TRACK:edm
// ELECTRONIC DANCE (theme 8, track 'edm'): planning is the breakdown, a chain is the build, OVERREACT is the drop.
// Every sound is a synthesiser, as in the genre, but none is a bare oscillator: a seven-voice detuned saw stack made once as a
// loop (pads, stabs, the big lead), a pluck with its own filter sweep, a sine sub, a filtered saw bass, and made drums (a kick
// with a click and a long tuned body, a layered clap, noise hats, a white-noise crash, an impact). Pads, bass, stabs, lead and
// plucks pump against the kick. D mixolydian, sus2 and add9 chords: bright, not minor.
Object.assign(CH, {
  edmD: { r: 38, n: [57, 62, 66] }, edmDs: { r: 38, n: [57, 62, 64] }, edmA: { r: 33, n: [57, 62, 64] }, edmBm: { r: 35, n: [59, 62, 66] },
  edmG: { r: 43, n: [57, 59, 62] }, edmEm: { r: 40, n: [59, 62, 67] }, edmC: { r: 36, n: [55, 62, 64] }
});
// ---- offline synthesis ----
// band-limited saws (polyBLEP), one per detune in cents, summed
function edmSaws(n, f, dets, seed) { const x = new Float32Array(n), r = RNG(seed); dets.forEach(d => { const dt = f * Math.pow(2, d / 1200) / SR; let ph = r(); for (let i = 0; i < n; i++) { ph += dt; if (ph >= 1) ph -= 1; let v = 2 * ph - 1; if (ph < dt) { const q = ph / dt; v -= q + q - q * q - 1; } else if (ph > 1 - dt) { const q = (ph - 1) / dt; v -= q * q + q + q + 1; } x[i] += v; } }); return x; }
// a resonant low-pass whose cutoff falls from fa to fb (a filter envelope)
function edmSvf(x, fa, fb, tau, damp) { let lo = 0, bd = 0; const k = 1 / (tau * SR); for (let i = 0; i < x.length; i++) { const fc = fb + (fa - fb) * Math.exp(-i * k), c = 2 * Math.sin(Math.PI * Math.min(0.22, fc / SR)), hp = x[i] - lo - damp * bd; bd += c * hp; lo += c * bd; x[i] = lo; } return x; }
function edmHpf(x, hz, passes) { const k = 1 - Math.exp(-2 * Math.PI * hz / SR); for (let p = 0; p < (passes || 1); p++) { let lp = 0; for (let i = 0; i < x.length; i++) { lp += k * (x[i] - lp); x[i] -= lp; } } return x; }
// the supersaw: seven saws spread over 47 cents, written straight into a spectrum so the 1.5 s loop closes without a seam
function edmSuper(m) {
  const N = 65536, re = new Float64Array(N), im = new Float64Array(N), hz = SR / N, r = RNG(800 + m), f0 = mf(m);
  [-24, -15, -6, 0, 7, 14, 23].forEach((d, v) => { const f = f0 * Math.pow(2, d / 1200), p0 = r() * 2 * Math.PI, a0 = 1 - 0.07 * Math.abs(v - 3);
    for (let n = 1; n * f < 17000; n++) { const fr = n * f, k = Math.round(fr / hz), a = a0 / n / (1 + Math.pow(fr / 13000, 4)), p = n * p0 - Math.PI / 2; re[k] += a * Math.cos(p); im[k] += a * Math.sin(p); } });
  fftInv(re, im); const out = new Float32Array(N); let s = 0; for (let i = 0; i < N; i++) { out[i] = re[i]; s += re[i] * re[i]; } const g = 0.16 / Math.sqrt(s / N || 1); for (let i = 0; i < N; i++) out[i] *= g; return out;
}
// the kick: a click, a fast fall of pitch, then a long body tuned to A (55 Hz); top = the same without its low end (for the top of a build)
function edmKick(top) {
  const n = Math.floor(0.4 * SR), x = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const tt = i / SR; ph += 2 * Math.PI * (55 + 230 * Math.exp(-tt / 0.012) + 55 * Math.exp(-tt / 0.06)) / SR; x[i] = Math.tanh(2.2 * Math.sin(ph) * (tt < 0.05 ? 1 : Math.exp(-(tt - 0.05) / 0.1)) * Math.min(1, i / 8)); }
  burst(x, 0, 0.0025, 2500, 10000, 0.45, 811); burst(x, 0, 0.01, 300, 2200, 0.2, 812); if (top) edmHpf(x, 420, 2); return norm(fadeEnd(x, 0.03), 0.9);
}
Object.assign(INST, {
  edm_saw:   { loop: 1, lo: 45, hi: 99, gen: m => edmSuper(m) },
  edm_pl:    { rr: 2, lo: 50, hi: 98, gen: m => { const f = mf(m), n = Math.floor(0.75 * SR), x = edmSaws(n, f, [-9, 0, 8], 400 + m + TAKE * 17), y = edmSaws(n, f * 2, [4], 450 + m); for (let i = 0; i < n; i++) x[i] += 0.35 * y[i]; edmSvf(x, Math.min(9000, 2200 + f * 5), Math.max(350, f * 1.1), 0.06, 0.5); for (let i = 0; i < n; i++) x[i] *= Math.exp(-i / (0.2 * SR)) * Math.min(1, i / 40); return norm(fadeEnd(x, 0.05), 0.85); } },
  edm_bass:  { lo: 31, hi: 55, gen: m => { const f = mf(m), n = Math.floor(0.6 * SR), x = edmSaws(n, f, [-11, 10], 500 + m); edmSvf(x, 3200, 260, 0.07, 0.4); for (let i = 0; i < n; i++) { const tt = i / SR; x[i] = Math.tanh(1.2 * (x[i] * 0.6 + 0.7 * Math.sin(2 * Math.PI * f * tt))) * Math.exp(-tt / 0.3) * Math.min(1, i / 60); } return norm(fadeEnd(x, 0.04), 0.85); } },
  edm_sub:   { lo: 30, hi: 42, gen: m => { const f = mf(m), n = Math.floor(2.4 * SR), x = new Float32Array(n); for (let i = 0; i < n; i++) { const p = 2 * Math.PI * f * i / SR; x[i] = Math.tanh(1.3 * (Math.sin(p) + 0.18 * Math.sin(2 * p))) * Math.min(1, i / 300); } return norm(fadeEnd(x, 0.05), 0.8); } },
  edm_kick:  { fix: 30, gen: () => edmKick(false) },
  edm_kickt: { fix: 30, gen: () => edmKick(true) },
  edm_clap:  { rr: 2, fix: 60, gen: () => { const x = modal([[195, 0.25, 0.07], [340, 0.15, 0.05]], 0.5); [0, 0.009, 0.019, 0.03].forEach((t0, i) => burst(x, t0, 0.004, 1000, 6500, 1, 861 + i)); burst(x, 0.032, 0.09, 1200, 7000, 0.9, 866); burst(x, 0.03, 0.2, 2500, 9000, 0.22, 867); return norm(fadeEnd(x, 0.03), 0.85); } },
  edm_sn:    { rr: 3, fix: 50, gen: () => { const x = modal([[205, 1, 0.1], [352, 0.5, 0.07]], 0.32); burst(x, 0, 0.065, 1800, 11000, 1.4, 851); burst(x, 0, 0.003, 3000, 12000, 0.7, 852); return norm(fadeEnd(x, 0.02), 0.9); } },
  edm_hh:    { rr: 3, fix: 70, gen: () => { const x = modal(rndParts(841, 14, 7000, 14000, 0.015, 0.035), 0.1); burst(x, 0, 0.011, 7500, 16000, 3, 842); return norm(edmHpf(x, 6000, 1), 0.8); } },
  edm_oh:    { rr: 2, fix: 70, gen: () => { const x = modal(rndParts(843, 24, 6000, 14000, 0.1, 0.22), 0.5); burst(x, 0, 0.09, 6500, 16000, 3, 844); return norm(fadeEnd(edmHpf(x, 5000, 1), 0.05), 0.8); } },
  edm_crash: { fix: 70, gen: () => { const x = new Float32Array(Math.floor(2 * SR)); burst(x, 0, 0.4, 4000, 15000, 1, 831); burst(x, 0, 0.12, 2000, 9000, 0.7, 832); return norm(fadeEnd(x, 0.3), 0.85); } },
  edm_imp:   { fix: 30, gen: () => { const n = Math.floor(2.2 * SR), x = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const tt = i / SR; ph += 2 * Math.PI * (38 + 80 * Math.exp(-tt / 0.09)) / SR; x[i] = Math.tanh(1.6 * Math.sin(ph) * Math.exp(-tt / 0.55)) * Math.min(1, i / 20); } burst(x, 0, 0.3, 50, 700, 0.9, 821); burst(x, 0, 0.05, 800, 6000, 0.5, 822); return norm(fadeEnd(x, 0.3), 0.9); } }
});
// ---- live helpers ----
// a sweep that can run on from bar to bar: noise through a band that moves (a riser, a swell, a fall) or two saws that climb
function edmSweep(E, dst, o) {
  if (E.reT && skipRe(E, dst, o.t)) return; E.note(dst, o.t, o.f1, o.saw ? 'r' : 'z'); if (E.dry || (E.solo && dst.__n !== E.solo)) return;
  const c = E.c, t = Math.max(o.t, 0), end = t + o.dur, g = c.createGain(), f = c.createBiquadFilter(); let n = 2, tail = g, src = null;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.g0, t + 0.01); g.gain.linearRampToValueAtTime(o.g1, end); g.gain.linearRampToValueAtTime(0, end + 0.012);
  if (o.saw) { f.type = 'lowpass'; f.Q.value = 0.8; f.frequency.setValueAtTime(o.f0 * 3.5, t); f.frequency.exponentialRampToValueAtTime(o.f1 * 3.5, end);
    [-13, 12].forEach(d => { const os = c.createOscillator(); os.type = 'sawtooth'; os.detune.value = d; os.frequency.setValueAtTime(o.f0, t); os.frequency.exponentialRampToValueAtTime(o.f1, end); os.connect(f); os.start(t); os.stop(end + 0.03); n++; src = os; }); }
  else { f.type = 'bandpass'; f.Q.value = o.q || 1; f.frequency.setValueAtTime(o.f0, t); f.frequency.exponentialRampToValueAtTime(o.f1, end); src = c.createBufferSource(); src.buffer = E.noise; src.loop = true; src.connect(f); src.start(t, (t * 0.613 + ((o.pan || 0) > 0 ? 0.83 : 0)) % 1.7); src.stop(end + 0.03); n++; }
  f.connect(g); if (o.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp(o.pan, -1, 1); g.connect(p); p.connect(dst); tail = p; n++; } else g.connect(dst);
  src.onended = () => done(tail); E.stat(n, t, end + 0.03);
}
// the sidechain: at a kick the bass, pads, stabs, lead and plucks dip (by dp, 0 to 1) and swell back over rel seconds
function edmPump(dk, tk, dp, rel) { [['bassPump', 1], ['padPump', 0.92], ['voxPump', 0.8], ['leadPump', 0.45], ['arpPump', 0.5]].forEach(x => { const p = dk.L[x[0]]; if (!p) return; p.gain.setTargetAtTime(1 - dp * x[1], Math.max(0, tk - 0.014), 0.004); p.gain.setTargetAtTime(1, tk + 0.035, rel / 3); }); }
// each layer's insert: a high-pass where wanted (pads, lead, plucks and stabs stay out of the bass), then a gain that the hits of a chain duck
const edmIns = hz => (E, dk, k) => { const g = E.G(1); (dk.edmDuck || (dk.edmDuck = [])).push(g); if (!hz) return { i: g, o: g }; const f = E.c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hz; f.Q.value = 0.6; f.connect(g); return { i: f, o: g }; };
const EDMLIFT = 2.92;   // seconds from the start of OVERREACT to the lift of the effect (sfx.js: 0.09 + 0.55 + 1.35 + 0.04 + 0.92, less the deck's own lead-in): the drop lands there
const EDMC = [[0, 2, 4, 3, 5], [0, 3, 1, 4, 2, 5], [5, 4, 2, 3, 1, 2, 0], [1, 4, 2, 6, 3], [1, 3, 5, 4, 2, 0], [0, 2, 1, 3, 2, 4, 3, 6]];   // the pluck figure: cycles of 5, 6, 7, 8 notes that drift against the bar
const EDMG = { kick: 0.5, clap: 1.1, sn: 0.6, hh: 11, oh: 10, crash: 2.2, sub: 0.17, mid: 0.5, pad: 0.2, stab: 0.2, arp: 0.3, lead: 1, air: 0.05 };          // balance inside the layers
// ---- the bar before the drop. OVERREACT's effect strikes, falls, swells and resolves, and 0.92 s after the resolve it lifts:
// this one bar is stretched to end exactly on that lift, so the drop (kick, bass, the hook) lands with it. No kick, no bass:
// a hiss and two saws climbing, the chord held with its filter opening, a snare roll that doubles into the drop ----
function edmPreDrop(E, dk, t, ch) {
  const w = E.w(), D = dk.L.drums.in, P = dk.L.pad.in, Q = EDMG; dk.spu = Math.max(0.08, (dk.t0 + EDMLIFT - t) / 16); const sp = dk.spu, bar = 16 * sp, at = u => t + u * sp, td = t + bar;
  [-0.6, 0.6].forEach(pan => edmSweep(E, D, { t, dur: bar, f0: 500, f1: 12000, g0: 0.01, g1: 0.3, q: 0.8, pan }));
  dk.sb = -1;   // the section starts again on the drop, so the hook is heard from its first bar
  edmSweep(E, D, { t, dur: bar, saw: 1, f0: 146.83, f1: 587.33 * (w > 0.5 ? 2 : 1), g0: 0.02, g1: 0.3, pan: -0.15 });
  [50, 57, 62, 64, 69, 74].forEach((m, k) => Sm(E, P, { i: 'edm_saw', m, t: t + k * 0.004, g: Q.pad * 1.1, dur: bar - 0.05, a: bar * 0.6, r: 0.04, lp: 350, lp1: 11000, lpt: bar, wide: k % 4 ? 0.5 + 0.1 * k : 0, pan: k ? 0.25 : -0.15 }));
  for (let u = 2; u < 16; u += u < 8 ? 2 : u < 12 ? 1 : 0.5) { const x = u / 16; Sm(E, D, { i: 'edm_sn', t: at(u), g: (0.12 + 0.7 * x * x) * Q.sn * 2, m: 50 + (6 + 6 * w) * x, pan: u % 1 ? 0.12 : -0.1, dur: u < 12 ? 0.07 : 0.035, r: 0.04, strict: 1 }); }
  if (w > 0.35 && dk.rng.chance(0.5 * w)) [8, 9, 10, 11].forEach((u, k) => { Sm(E, D, { i: 'edm_kickt', t: at(u), g: 0.3, m: 30 + 3 * k, strict: 1 }); Sm(E, dk.L.arp.in, { i: 'edm_pl', m: [74, 76, 78, 81][k] + (k === 3 ? 1 : 0), t: at(u), g: 0.3, strict: 1 }); });   // later rounds, a fake drop: the beat seems to start, thin and wrong, and stops again
  Sm(E, E.fx, { i: 'edm_imp', t: td, g: 0.5, strict: 1 }); Sm(E, E.fx, { i: 'edm_crash', t: td, g: 0.3, strict: 1 });
}
// ---- a bar ----
function edmPlay(E, dk, t, b, ch, name) {
  if (dk.state === 'overreact' && dk.bar === 0 && !E.reT) { edmPreDrop(E, dk, t, ch); return; }
  const s = dk.sec, r = dk.rng, L = dk.L, sp = dk.spu, w = E.w(), st = dk.drum || dk.S.drum, bar = 16 * sp, at = u => t + u * sp, re = E.reT || 0, Q = EDMG;
  const D = L.drums.in, B = L.bass.in, P = L.pad.in, A = L.arp.in, X = L.vox.in, G = L.bell.in;
  const chain = E.state === 'chain' && dk.state === 'plan', big = dk.state === 'overreact' || dk.state === 'runwon', peak = st === 'heavy', drums = st !== 'none', intro = s.type === 'I', last = b === s.len - 1;
  const K = dk.state === 'won' ? clamp(0.62 - 0.03 * Math.max(0, dk.bar - 3), 0.32, 0.62) : chain ? E.slow : E.I;      // the heat that decides who plays (a win eases off bar by bar)
  // the build of a chain: x runs from x0 to x1 through this bar, following the surge and a guess of where it will be at the bar's end
  const M = dk.edm || (dk.edm = { bar: -9, s0: 0, s1: 0, on: 0, mis: 0 });
  const nN = E.stepOf || 16, nS = chain ? E.stepN || 0 : 0, xg = chain ? Math.pow(clamp(nS / nN, 0, 1), 1.2) : 0;   // how far up its build a chain is: by its own length when the game says it (step(n, of)), else as if it had 16 steps
  let x0 = xg, x1 = x0, after = 0;
  if (!re) {
    if (chain) { const c0 = M.on && M.bar === dk.bar - 1 ? M.s1 : xg * 0.6; x0 = c0; x1 = Math.max(c0, Math.min(1.12, Math.pow(Math.min(1.1, (nS + 2) / nN), 1.2))); M.s0 = x0; M.s1 = x1; M.bar = dk.bar; M.on = 1; }
    else { if (M.on && M.bar === dk.bar - 1) after = M.s1; M.on = 0; }
    const hot = !chain && !intro && drums && (peak || K > 0.6) && !(big && dk.bar < 2) && s.type !== 'S';
    M.mis = hot && w > 0.15 && b % 4 === 3 && r.chance(0.5 * w) ? 1 + r.i(3) : hot && w > 0.3 && b % 4 === 1 && r.chance(0.25 * w) ? 2 : 0;   // later rounds: 1 the last beat stutters, 2 a bar at half time, 3 the last beat falls silent
  }
  const mis = chain ? 0 : M.mis, xs = u => x0 + (x1 - x0) * u / 16, u0 = big && dk.bar === 0 ? dk.edmU0 || 4 : 0, u1 = mis === 3 ? 12 : 16, brk = !!s.brk && b < 4 && !big && !chain && !intro;
  const from = Math.max(at(u0), re ? re + 0.004 : 0), left = at(u1) - from;
  // the kick: none when cool, soft and filtered as the heat comes, open from the middle; and the pump that goes with it
  let kg = 0, klp = 0; if (drums && !intro && !brk) { if (peak) kg = 0.85; else if (K >= 0.32) { const a = clamp((K - 0.32) / 0.2, 0, 1); kg = 0.32 + 0.38 * a; klp = a < 1 ? 170 * Math.pow(2, 4.5 * a) : 0; } }
  if (chain && kg < 0.4) { kg = 0.4; klp = klp || 420; }
  if (!re) { const dp = !drums || intro ? 0 : peak ? 0.86 : kg > 0 || brk ? 0.3 + 0.5 * clamp((K - 0.3) / 0.4, 0, 1) : 0; if (dp) [0, 4, 8, 12].forEach(u => { if (u >= u0 && u < u1 && !(mis === 2 && u % 8)) edmPump(dk, at(u), dp, sp * 3.2); }); }
  let HD = D; const hit = (i, u, g, o) => { if (u >= u0 && u < u1) Sm(E, HD, Object.assign({ i, t: at(u), g, strict: 1 }, o || {})); };
  const over = chain && E.stepOf > 0 && E.stepN >= E.stepOf;   // the chain's last hit has landed: the roll and the risers have stopped and stay stopped until the game moves on
  if (drums && !re) {
    if (chain && !over) {
      const RZ = dk.edmRise || (dk.edmRise = (() => { const g = E.G(1); g.__n = 'drums'; g.connect(D); return g; })()); HD = RZ; if (!M.gate) { RZ.gain.cancelScheduledValues(Math.max(0, t - 0.01)); RZ.gain.setValueAtTime(1, Math.max(0, t - 0.01)); M.gate = 1; }
      // the build: a snare roll that doubles (quarters, eighths, sixteenths, thirty-seconds) and climbs in pitch, the kick losing its low end and then leaving, a noise riser and a pitch riser
      for (let u = 0; u < 16; u++) { const x = xs(u), stp = x < 0.2 ? 4 : x < 0.45 ? 2 : 1; if (u % stp) continue; const g = Math.min(1.1, (0.3 + 0.85 * x + 0.008 * u) * Q.sn * 2), m = 50 + (5 + 7 * w) * x, cut = stp > 1 ? null : x >= 0.72 ? { m, pan: -0.1, dur: 0.035, r: 0.03 } : { m, pan: -0.1, dur: 0.07, r: 0.05 }; hit('edm_sn', u, g, cut || { m, pan: -0.1 }); if (x >= 0.72) hit('edm_sn', u + 0.5, g * 0.7, { m, pan: 0.1, dur: 0.03, r: 0.03 }); }
      [0, 4, 8, 12].forEach(u => { const x = xs(u); if (x < 0.5) hit('edm_kick', u, kg * Q.kick, klp ? { lp: klp } : null); else if (x < 0.78) hit('edm_kickt', u, (0.65 - (x - 0.5) * 1.5) * Q.kick); });   // the kick loses its low end half way up and is gone for the last quarter
      for (let u = 0; u < 16; u++) { const x = xs(u); if (u % 4 === 2) hit('edm_hh', u, (0.1 + 0.1 * x) * Q.hh, { pan: 0.3 }); else if (x > 0.3 && u % 2) hit('edm_hh', u, (0.05 + 0.06 * x) * Q.hh, { pan: -0.3 }); }
      if (K >= 0.5) [4, 12].forEach(u => { if (xs(u) < 0.5) hit('edm_clap', u, 0.6 * Q.clap); });
      const nf = x => 450 * Math.pow(2, 4.7 * x), ng = x => 0.03 + 0.35 * x, pf = x => 293.66 * Math.pow(2, (2 + 1.6 * w) * x), pg = x => 0.04 + 0.3 * x;
      [-0.6, 0.6].forEach(pan => edmSweep(E, RZ, { t, dur: bar, f0: nf(x0), f1: nf(x1), g0: ng(x0), g1: ng(x1), q: 0.9, pan }));
      if (x1 > 0.1) edmSweep(E, RZ, { t, dur: bar, saw: 1, f0: pf(x0), f1: pf(x1), g0: x0 > 0.1 ? pg(x0) : 0, g1: pg(x1), pan: 0.15 });
      HD = D;
    } else if (!chain) {
      M.gate = 0;
      if (after > 0.08) { hit('edm_crash', 0, (0.1 + 0.22 * after) * Q.crash, { pan: -0.2 }); edmSweep(E, D, { t, dur: bar * 0.6, f0: 7000, f1: 500, g0: 0.1 * after, g1: 0, q: 0.8, pan: 0.3 }); }   // the bar after a build: the beat is back, with a crash and a falling hiss
      if (kg > 0) {
        (mis === 2 ? [0, 8] : [0, 4, 8, 12]).forEach(u => hit('edm_kick', u, kg * Q.kick, klp ? { lp: klp } : null));
        if (mis === 1) [13, 14, 15].forEach((u, k) => hit('edm_kick', u, kg * 0.8 * Q.kick, { m: 32 + 2 * k }));
        else if (!klp && !peak && (s.dv % 3 === 1 ? b % 4 === 3 : s.dv % 3 === 2 && last)) hit('edm_kick', 14, kg * 0.7 * Q.kick);
        else if (peak && b % 4 === 3 && r.chance(0.5)) hit('edm_kick', 14, 0.7 * Q.kick);
      }
      const hK = brk ? Math.min(K, 0.5) : K;
      if (peak || hK >= 0.7) { for (let u = 0; u < 16; u++) { if (u % 4 === 2) { if (mis === 2 && u % 8 === 2) hit('edm_hh', u, 0.16 * Q.hh, { pan: 0.3 }); else hit('edm_oh', u, 0.26 * Q.oh, { pan: 0.3, dur: sp * 1.9, r: 0.05 }); } else if (r.chance(u % 2 ? 0.8 : 0.35)) hit('edm_hh', u, (u % 2 ? 0.07 : 0.05) * (0.8 + 0.5 * r()) * Q.hh, { pan: -0.3 }); } }
      else if (hK >= 0.55) { for (let u = 0; u < 16; u++) { if (u % 4 === 2) hit('edm_hh', u, 0.17 * Q.hh, { pan: 0.3 }); else if (r.chance(u % 2 ? 0.75 : 0.3)) hit('edm_hh', u, 0.06 * (0.8 + 0.5 * r()) * Q.hh, { pan: -0.3 }); } }
      else if (hK >= 0.36) { [2, 6, 10, 14].forEach(u => hit('edm_hh', u, (0.1 + 0.3 * (hK - 0.36)) * Q.hh, { pan: 0.3 })); if (hK > 0.45) [3, 7, 11, 15].forEach(u => { if (r.chance(0.4)) hit('edm_hh', u, 0.05 * Q.hh, { pan: -0.3 }); }); }
      else if (hK >= 0.25 && !intro) [2, 6, 10, 14].forEach(u => { if (r.chance(0.85)) hit('edm_hh', u, 0.05 * Q.hh, { pan: 0.3, lp: 7000 }); });
      if (!brk && !intro && (peak || K >= 0.5)) { const cg = (peak ? 1 : 0.56 + (K - 0.5)) * Q.clap; (mis === 2 ? [8] : [4, 12]).forEach(u => { hit('edm_clap', u, cg, { pan: 0.05 }); if (peak || K >= 0.75) hit('edm_sn', u, cg * 0.5, { pan: -0.05 }); }); if (s.dv > 2 && b % 2 && r.chance(0.5)) hit('edm_clap', 15, cg * 0.4, { pan: -0.2 }); }
      if (!intro && dk.bar > 0 && !brk && (peak ? b % 4 === 0 : K > 0.55 && (b === 0 || (s.brk && b === 4)))) hit('edm_crash', 0, (peak ? 0.22 : 0.16) * Q.crash, { pan: b ? 0.25 : -0.25 });
      if ((peak ? last : last && s.fill && K > 0.5) && mis !== 3) [8, 10, 12, 13, 14, 15].forEach((u, k) => hit('edm_sn', u, (0.2 + 0.1 * k) * (peak ? 1.3 : 1) * Q.sn, { m: 50 + k * 0.5, pan: (k - 2.5) * 0.08 }));
      if ((last || (brk && b === 3) || mis === 3) && K > 0.4) [-0.5, 0.5].forEach(pan => edmSweep(E, D, { t: at(8), dur: 8 * sp, f0: 800, f1: 8000, g0: 0, g1: 0.03 + 0.05 * K, q: 0.8, pan }));
      if (intro && last) { for (let u = 0; u < 16; u++) if (u >= 8 || u % 2 === 0) hit('edm_sn', u, (0.12 + 0.03 * u) * Q.sn, { m: 50 + u * 0.25, pan: -0.1 }); [-0.5, 0.5].forEach(pan => edmSweep(E, D, { t, dur: bar, f0: 600, f1: 9000, g0: 0, g1: 0.07, q: 0.8, pan })); }
    }
  }
  // ---- bass: a sine sub under a filtered saw bass; a long sub when cool, off the beat when warm, rolling when hot; it leaves near the top of a build ----
  const root = s.pedal ? 38 : ch.r > 40 ? ch.r - 12 : ch.r, bn = (i, u, m, g, du, o) => { if (u >= u0 && u < u1 && at(u) + 0.001 >= re) Sm(E, B, Object.assign({ i, m, t: at(u), g, dur: du * sp, r: 0.06, strict: 1 }, o || {})); };
  if (!intro && !brk && !(chain && x0 >= 0.7) && left > 0.1) {
    const long = (g, rr) => Sm(E, B, { i: 'edm_sub', m: root, t: from, g, dur: left - 0.04, r: rr, strict: 1 });
    if (!drums) long(0.42 * Q.sub, 0.3);
    else if (peak || K >= 0.42) {
      const hotB = peak || K >= 0.75, bp = K < 0.6 && !peak ? '..x...x...x...x.' : ['..x...x...x...x.', '..xx..xx..xx..xx', '..x.x.x...x.x.xo', '..xo..xx..xo..x.'][(s.bv + (b >> 2)) % 4], blp = peak ? 6000 : 500 + 5000 * K;
      if (hotB) long((peak ? 0.62 : 0.5) * Q.sub, 0.08);
      if (hotB && w > 0.3 && !re && b % 2 === 1 && r.chance(0.6 * w)) { const div = r.chance(0.5) ? 4 / 3 : r.chance(0.5) ? 2 : 1; for (let u = 0; u < 16 - 0.01; u += div) bn('edm_bass', u, root + 12 + (w > 0.6 && Math.round(u / div) % 4 === 3 ? 1 : 0), Q.mid * 1.1, div * 0.95, { lp: 250, lp1: 2500 + 4500 * w, lpt: div * sp * 0.5 }); }   // later rounds: on some bars the bass wobbles, its filter yawning open on every note (in triplets, eighths or sixteenths)
      else
      pat(bp, (u, c) => { bn('edm_bass', u, root + 12 + (c === 'o' ? 12 : 0), Q.mid * (u % 4 === 2 ? 1 : 0.8), bp[u + 1] === '.' || u === 15 ? 1.7 : 0.9, { lp: blp }); if (!hotB && u % 4 === 2) bn('edm_sub', u, root, 0.5 * Q.sub, 1.8); });
      if (mis === 1) [13, 15].forEach(u => bn('edm_bass', u, root + 24, Q.mid * 0.8, 0.8, { lp: blp }));
    } else if (K >= 0.15) long((K < 0.25 ? 0.34 : 0.45) * Q.sub, 0.2);
  }
  // ---- pads: the supersaw chord through a low-pass that opens with the heat (and with the surge of a chain) ----
  if (left > 0.1) {
    const padF = k => 700 + 7500 * Math.pow(k, 1.3); let f0 = peak ? 10000 : padF(K), f1 = f0;
    if (chain) { f0 = Math.min(13000, padF(K) * Math.pow(2, 3.4 * xs(Math.max(0, (from - t) / sp)))); f1 = Math.min(13000, padF(K) * Math.pow(2, 3.4 * x1)); }
    else if (intro) { f0 = b ? 1000 : 320; f1 = b ? 3600 : 1000; }
    else if (brk) { f0 = 350 * Math.pow(2, b * 0.8); f1 = f0 * 1.7; }
    else if (w > 0.25 && K > 0.4 && r.chance(0.25 * w)) { f0 = r.chance(0.5) ? 280 : 12000; f1 = f0 < 1000 ? 12000 : 280; }                   // later rounds: the filter sweeps wildly through a bar
    const slow = K < 0.45 && !chain && !intro, pa = slow ? 0.3 : 0.03, pg = Q.pad * (0.4 + 0.9 * Math.min(1, K + (chain ? 0.3 * x1 : 0)));
    [ch.r + 12, ch.n[0], ch.n[1], ch.n[2], ch.n[0] + 12].forEach((m, k) => Sm(E, P, { i: 'edm_saw', m, t: from + k * 0.004, g: pg * (k < 1 ? 0.9 : 1), dur: left - (slow ? 0 : 0.04), a: pa, r: slow ? 0.6 : 0.12, lp: f0, lp1: f1 !== f0 ? f1 : 0, lpt: left, wide: k % 4 ? 0.5 + 0.12 * k : 0, pan: k ? 0.25 : -0.15 }));
  }
  // ---- air: a band of hiss over the pads that pumps with them: faint when cool, plain in the drop ----
  if (!re && !intro && left > 0.1) { const ag0 = Q.air * (peak ? 1 : brk ? 0.2 : 0.12 + K * 0.75); [-0.7, 0.7].forEach(pan => edmSweep(E, X, { t: from, dur: left, f0: 9500, f1: chain ? 9500 * (1 + 0.4 * x1) : 9500, g0: ag0, g1: ag0 * (chain ? 1 + 1.5 * x1 : 1), q: 0.5, pan })); }
  // ---- stabs: short bright chords in a dance rhythm, when it is hot ----
  if ((peak || K >= 0.78) && !chain && !brk && !intro) {
    const sp_ = mis === 1 ? 'x..x..x.x...xxxx' : ['x..x..x...x..x..', 'x..x..x..x..x.x.', 'x.....x..x....x.'][(s.av + (b >> 1)) % 3];
    pat(sp_, u => { if (u < u0 || u >= u1 || at(u) + 0.001 < re) return; ch.n.forEach((m, k) => Sm(E, X, { i: 'edm_saw', m: m + 12, t: at(u), g: Q.stab * (peak ? 1 : 0.7), dur: sp * 1.4, a: 0.005, r: 0.09, pan: (k - 1) * 0.5, strict: 1 })); });
  }
  // in a build the chord is hammered: eighths, then sixteenths, louder as the surge climbs
  if (chain && !over && x1 >= 0.3) for (let u = 0; u < 16; u++) { const x = xs(u); if (x < 0.3 || (x < 0.6 && u % 2) || at(u) + 0.001 < re) continue; ch.n.forEach((m, k) => Sm(E, X, { i: 'edm_saw', m: m + 12, t: at(u), g: Q.stab * (0.5 + 0.9 * x), dur: sp * 0.8, a: 0.005, r: 0.06, pan: (k - 1) * 0.5, strict: 1 })); }
  // ---- the pluck figure: a short cycle of chord notes that drifts against the bar; sparse when cool, sixteenths when hot ----
  {
    const pool = [ch.r + 24, ch.n[0], ch.n[1], ch.n[2], ch.n[0] + 12, ch.n[1] + 12, ch.n[2] + 12].sort((p, q) => p - q), cyc = EDMC[s.av % 6];
    const dens = intro ? 0 : chain ? (x1 > 0.24 ? 2 : K >= 0.33 ? 1 : 0) : peak ? 2 : K < 0.33 ? 0 : K < 0.58 ? 1 : 2;
    const mask = dens === 0 ? ['x..x..x...x..x..', 'x..x..x.x..x....', 'x.....x..x..x...'][(s.bv + b) % 3] : dens === 1 ? ['x.x.x.x.x.x.x.x.', 'x.xx..x.x.xx..x.', 'x..x.xx.x..x.xx.'][(s.bv + (b >> 1)) % 3] : ['xxx.xxx.xxx.xxx.', 'x.xxx.xxx.xxx.xx', 'xx.xx.xxxx.xx.xx', 'xxxxxxx.xxxxxxx.'][(s.bv + (b >> 1)) % 4];
    const ag = Q.arp * (0.45 + 0.9 * K) * (dens === 2 ? 0.8 : 1), alp = peak ? 12000 : 2400 + 9500 * Math.pow(K, 1.5) + (chain ? 7000 * x1 : 0);
    pat(mask, u => { if (u < u0 || u >= u1 || at(u) + 0.001 < re || r.chance(0.1)) return; const pos = dk.bar * 16 + u; let m = pool[cyc[(dens ? pos : pos >> 1) % cyc.length]]; if (r.chance(0.1)) m += 12; if (chain && xs(u) > 0.45) m += 12; if (m > 96) m -= 12; if (w > 0.1 && r.chance(0.09 * w)) m += r.chance(0.5) ? 1 : 6;   // later rounds: a wrong note in the figure
      Sm(E, A, { i: 'edm_pl', m, t: at(u), g: ag * (u % 4 === 0 ? 1.15 : u % 2 ? 0.8 : 1) * (0.9 + 0.2 * r()), dur: sp * (dens === 2 ? 1.3 : 2.6), r: 0.12, lp: alp, pan: (pos % 3 - 1) * 0.5, strict: 1 }); });
  }
  if (!chain && !intro && K >= 0.3 && b % 2 === 1 && r.chance(0.45) && at(10) >= re) Sm(E, G, { i: 'edm_pl', m: ch.n[r.i(3)] + 24, t: at([6, 10, 14][r.i(3)]), g: 0.2, pan: r.chance(0.5) ? 0.6 : -0.6 });
}
// ---- one note of the tune: a pluck when cool, a saw lead when warm, the big three-octave supersaw in the drop ----
function edmLead(E, dk, t, du, m, g, mode) {
  const L = dk.L.lead.in, X = dk.L.vox.in, big = dk.state === 'overreact' || dk.state === 'runwon', chain = E.state === 'chain' && dk.state === 'plan', K = chain ? E.slow : E.I, Q = EDMG.lead;
  if (big && dk.bar === 0 && t < dk.t0 + ((dk.edmU0 || 4) - 0.1) * dk.spu) return;                                                    // the beat of near-silence before the drop
  if (g < 0.9) { Sm(E, L, { i: 'edm_pl', m, t, g: g * 0.4 * Q, pan: 0.1 }); return; }
  if (chain) g *= 1 - 0.5 * E.sg;
  if (mode === 'low') { Sm(E, L, { i: 'edm_saw', m, t, g: 0.5 * Q, dur: du * 0.95, a: 0.1, r: 0.5, lp: 1100, wide: 0.4 }); Sm(E, L, { i: 'edm_pl', m, t, g: 0.35 * Q, lp: 2500, pan: -0.1 }); return; }
  if (mode === 'oct') {
    Sm(E, L, { i: 'edm_saw', m, t, g: 0.62 * g * Q, dur: du * 0.92, a: 0.006, r: 0.14, lp: 1400, lp1: 11000, lpt: 0.04, wide: 0.75 });
    Sm(E, X, { i: 'edm_saw', m: m + 12, t, g: 0.2 * g * Q, dur: du * 0.92, a: 0.006, r: 0.16, lp: 2000, lp1: 12000, lpt: 0.05, wide: 0.95 });
    Sm(E, L, { i: 'edm_saw', m: m - 12, t, g: 0.5 * g * Q, dur: du * 0.92, a: 0.006, r: 0.12, lp: 3000 });
    Sm(E, L, { i: 'edm_pl', m, t, g: 0.5 * g * Q });
  } else if (K >= 0.55) {
    Sm(E, L, { i: 'edm_saw', m, t, g: 0.5 * g * Q, dur: du * 0.92, a: 0.008, r: 0.14, lp: 900, lp1: 2500 + 6000 * K, lpt: 0.05, wide: 0.5 });
    Sm(E, L, { i: 'edm_pl', m, t, g: 0.45 * g * Q, pan: 0.1 });
    if (K > 0.8) Sm(E, L, { i: 'edm_saw', m: m - 12, t, g: 0.3 * g * Q, dur: du * 0.92, a: 0.008, r: 0.12, lp: 3000 });
  } else {
    Sm(E, L, { i: 'edm_pl', m, t, g: 0.7 * g * Q, dur: Math.max(du, 0.3), r: 0.25, lp: 2500 + 9000 * K, pan: 0.1 });
    if (du > 3 * dk.spu) Sm(E, L, { i: 'edm_saw', m, t, g: 0.22 * g * Q, dur: du * 0.9, a: 0.03, r: 0.3, lp: 700 + 1800 * K, wide: 0.4 });
  }
}
// ---- a step of a chain: the music ducks under the hit for a quarter of a second (the effect is the star), one climbing pluck rings
// through as it comes back (late in a long chain the effects are loud and the dip is slight); on a chord change the new root and a short stab ----
function edmStep(E, dk, t, n) {
  if (E.state === 'chain' && E.stepOf > 0 && n >= E.stepOf && dk.edmRise) { dk.edmRise.gain.setTargetAtTime(0, t, 0.015); if (dk.edm) dk.edm.gate = 0; }   // the last hit: the roll and the risers stop dead
  const ch = dk.curCh || CH[TH[E.th].chain[E.cix]], m = nearTone(66 + Math.min(n, 14) * 1.5, ch);
  if (E.state === 'chain' && dk.edmDuck) { const dip = n <= 6 ? 0.5 : n <= 8 ? 0.6 : 0.75; dk.edmDuck.forEach(g => { g.gain.setTargetAtTime(dip, t, 0.006); g.gain.setTargetAtTime(1, t + 0.24, 0.06); }); }
  Sm(E, dk.L.bell.in, { i: 'edm_pl', m, t, g: 0.3 + 0.02 * Math.min(n, 12), pan: n % 2 ? 0.3 : -0.3, strict: 1 });
  if (n > 1 && (n - 1) % 3 === 0) { Sm(E, dk.L.bass.in, { i: 'edm_sub', m: ch.r > 40 ? ch.r - 12 : ch.r, t, g: 0.4 * EDMG.sub, dur: 0.45, r: 0.1, strict: 1 }); ch.n.forEach((p, k) => Sm(E, dk.L.pad.in, { i: 'edm_saw', m: p + 12, t, g: 0.8 * EDMG.stab, dur: 0.22, a: 0.004, r: 0.2, lp: 800, lp1: 6000, lpt: 0.04, pan: (k - 1) * 0.5, strict: 1 })); }
}
// ---- a state starts. The drop: one beat of near-silence with a rising hiss, then the impact; the deck is at full level at once (not faded in) ----
function edmEnter(E, state, t, dk) {
  if (state === 'overreact') { dk.edmU0 = 16; dk.gs.forEach(g => { g.gain.cancelScheduledValues(0); g.gain.setValueAtTime(dk.sg0, Math.max(0, dk.t0 - 0.01)); }); }   // the whole first bar is the climb to the drop (edmPreDrop); the deck is at full level at once
  else if (state === 'runwon') {
    const g4 = 4, gap = g4 * dk.spu, th = dk.t0 + gap; dk.edmU0 = g4;
    dk.gs.forEach(g => { g.gain.cancelScheduledValues(0); g.gain.setValueAtTime(dk.sg0, Math.max(0, dk.t0 - 0.01)); });
    [-0.6, 0.6].forEach(pan => edmSweep(E, E.fx, { t, dur: gap, f0: 1200, f1: 10000, g0: 0, g1: 0.025, q: 0.8, pan }));
    Sm(E, E.fx, { i: 'edm_imp', t: th, g: 0.5, strict: 1 }); Sm(E, E.fx, { i: 'edm_crash', t: th, g: 0.25, strict: 1 });
  } else if (state === 'won') { Sm(E, E.fx, { i: 'edm_crash', t, g: 0.12, strict: 1 }); Sm(E, E.fx, { i: 'edm_imp', t, g: 0.2, strict: 1 }); }
}
// a state change waits for the bar line: a hiss swells up to it
function edmRoll(E, t, tb) { [-0.5, 0.5].forEach(pan => edmSweep(E, E.fx, { t, dur: tb - t, f0: 700, f1: 7000, g0: 0, g1: 0.035, q: 0.8, pan })); }
TRACK(8, 'edm', {
  name: 'Chain Reactor', line: 'supersaw pads and plucks over a four-on-the-floor that grows turn by turn; a chain is the build, OVERREACT is the drop',
  why: 'a build and a drop is a reaction running away: pressure climbs step by step, then everything goes at once',
  bpm: [124, 134], scale: [0, 2, 4, 5, 7, 9, 10],
  chain: ['edmDs', 'edmG', 'edmC', 'edmA'],
  prog: { A: ['edmD', 'edmA', 'edmBm', 'edmG', 'edmD', 'edmA', 'edmBm', 'edmG'], B: ['edmG', 'edmG', 'edmD', 'edmD', 'edmEm', 'edmEm', 'edmA', 'edmA'], C: ['edmC', 'edmC', 'edmG', 'edmG', 'edmD', 'edmD', 'edmC', 'edmA'] },
  alt: { A: { 3: 'edmEm', 7: 'edmA' }, B: { 1: 'edmBm', 5: 'edmC' }, C: { 3: 'edmEm', 7: 'edmG' } }, forms: ['AABA', 'ABAC', 'ABCB', 'ACAB'],
  tune: {
    A: [[[0, 3, 78], [3, 3, 78], [6, 2, 76], [8, 4, 78], [12, 4, 81]], [[0, 6, 76], [6, 2, 74], [8, 8, 76]], [[0, 3, 78], [3, 3, 78], [6, 2, 76], [8, 4, 78], [12, 4, 83]], [[0, 6, 81], [6, 2, 79], [8, 8, 74]],
        [[0, 3, 78], [3, 3, 78], [6, 2, 76], [8, 4, 78], [12, 4, 81]], [[0, 6, 76], [6, 2, 78], [8, 8, 81]], [[0, 3, 83], [3, 3, 83], [6, 2, 81], [8, 4, 78], [12, 4, 76]], [[0, 12, 74]]],
    B: [[[0, 8, 79], [8, 4, 83], [12, 4, 81]], [[0, 6, 79], [6, 2, 78], [8, 8, 74]], [[0, 8, 78], [8, 4, 81], [12, 4, 78]], [[0, 6, 76], [6, 2, 78], [8, 8, 74]],
        [[0, 8, 79], [8, 4, 83], [12, 4, 81]], [[0, 6, 83], [6, 2, 81], [8, 8, 79]], [[0, 4, 76], [4, 4, 78], [8, 4, 81], [12, 4, 83]], [[0, 12, 86]]],
    C: [[[2, 2, 76], [4, 2, 79], [6, 6, 84], [12, 4, 83]], [[0, 6, 81], [6, 2, 79], [8, 8, 76]], [[2, 2, 74], [4, 2, 79], [6, 6, 83], [12, 4, 81]], [[0, 6, 79], [6, 2, 78], [8, 8, 74]],
        [[2, 2, 78], [4, 2, 81], [6, 6, 86], [12, 4, 83]], [[0, 6, 81], [6, 2, 78], [8, 8, 81]], [[0, 4, 84], [4, 4, 83], [8, 4, 79], [12, 4, 76]], [[0, 12, 76]]]
  },
  sting: {
    won: { prog: ['edmG', 'edmA', 'edmD', 'edmD'], tune: [[[0, 4, 74], [4, 4, 76], [8, 8, 79]], [[0, 4, 76], [4, 4, 81], [8, 8, 83]], [[0, 16, 86]], null] },
    lost: { prog: ['edmG', 'edmEm', 'edmC', 'edmC'], tune: [[[0, 4, 78], [4, 4, 76], [8, 8, 74]], [[0, 6, 71], [6, 10, 67]], [[10, 2, 74], [12, 4, 76]], null] },
    runwon: { prog: ['edmC', 'edmG', 'edmD', 'edmD'], tune: [[[0, 8, 76], [8, 8, 79]], [[0, 8, 83], [8, 8, 86]], [[0, 16, 90]], [[0, 16, 86]]] },
    runlost: { prog: ['edmG', 'edmBm', 'edmEm', 'edmA'], tune: [[[0, 16, 79]], [[0, 16, 78]], [[0, 8, 76], [8, 8, 74]], [[0, 16, 76]]] }
  },
  mix: { drums: 1, bass: 0.5, pad: 2.4, lead: 1.6, arp: 2.6, vox: 2.2, bell: 2 }, tone: I => 10000 * Math.pow(2, I),
  lay: { drums: { rev: 0.05, dly: 0, sat: 1.2, ins: edmIns(0) }, bass: { rev: 0, dly: 0, sat: 1.3, ins: edmIns(0) }, pad: { rev: 0.3, dly: 0.04, ins: edmIns(140) }, lead: { rev: 0.26, dly: 0.2, pump: true, ins: edmIns(200) },
         arp: { rev: 0.22, dly: 0.26, pump: true, ins: edmIns(220) }, vox: { rev: 0.3, dly: 0.12, pump: true, ins: edmIns(250) }, bell: { rev: 0.3, dly: 0.2, ins: edmIns(0) } },
  g: 1, sg: { title: 1.11, bench: 1.48, pick: 1.33, overreact: 0.85, shop: 1.53, lost: 1.6, runwon: 0.88, runlost: 1.46 }, wow: 0.1, hall: 4.6, leadAt: 0.16, swing: w => (u => u), trim: sg => 0.58,
  play: edmPlay, lead: edmLead, step: edmStep, enter: edmEnter, roll: edmRoll
});
// TRACK:edm>>>
// <<<TRACK:metal
// METAL (theme 9). Drop-D heavy metal played by guitars that are built the way a guitar works: plucked strings (a delay line
// with a pick, a pickup, stiffness, a pitch that settles after the attack, a palm on the bridge), several strings summed and
// THEN driven (so root and fifth intermodulate: the low "chug"), a bass cut before the gain, two clipping stages worked four
// times oversampled, and a 4x12 cabinet as a made impulse in a convolver. Rhythm guitar is two different takes, hard left and
// right. Planning: a clean guitar picks over D, tense; muted chugs creep in, the kit enters, then riffs with the tune on the
// lead. A chain gallops. OVERREACT is the half-time breakdown. No thirds in the chain chords (D5 G5 C5 A5).
Object.assign(CH, { mD5: { r: 38, n: [62, 69, 64] }, mG5: { r: 43, n: [55, 62, 57] }, mC5: { r: 36, n: [60, 67, 62] }, mA5: { r: 33, n: [57, 64, 62] }, mF5: { r: 41, n: [60, 65, 69] }, mBb5: { r: 34, n: [58, 62, 65] } });
// a second-order filter run over a recording in place: 'lp' | 'hp' | 'pk' (peak, db) | 'ls' | 'hs' (shelves, db); sr for oversampled work
function metalBq(x, type, f, q, db, sr) {
  const w = 2 * Math.PI * f / (sr || SR), cs = Math.cos(w), sn = Math.sin(w), al = sn / (2 * q), A = Math.pow(10, (db || 0) / 40), sq = 2 * Math.sqrt(A) * al;
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
  else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
  else if (type === 'pk') { b0 = 1 + al * A; b1 = -2 * cs; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cs; a2 = 1 - al / A; }
  else if (type === 'ls') { b0 = A * ((A + 1) - (A - 1) * cs + sq); b1 = 2 * A * ((A - 1) - (A + 1) * cs); b2 = A * ((A + 1) - (A - 1) * cs - sq); a0 = (A + 1) + (A - 1) * cs + sq; a1 = -2 * ((A - 1) + (A + 1) * cs); a2 = (A + 1) + (A - 1) * cs - sq; }
  else { b0 = A * ((A + 1) + (A - 1) * cs + sq); b1 = -2 * A * ((A - 1) + (A + 1) * cs); b2 = A * ((A + 1) + (A - 1) * cs - sq); a0 = (A + 1) - (A - 1) * cs + sq; a1 = 2 * ((A - 1) - (A + 1) * cs); a2 = (A + 1) - (A - 1) * cs - sq; }
  b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0; let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = x[i], y = b0 * v + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = v; y2 = y1; y1 = y; x[i] = y; }
  return x;
}
// one guitar string: a pick lets go at `pos` along the string, the wave goes round a delay line that loses a little each trip
// (damp: the top goes first; k < 1: a palm on the bridge), through all-pass sections that make the upper partials sharp (a stiff
// string: `stiff` times the usual), tuned with an all-pass for the odd part of the length; the pitch starts a few cents sharp and settles (drift); a
// pickup at `pu` along the string hears it. o: { seed, t60, damp, k, pos, pu, hard, noise, drift, res }
function metalStr(f, n, o) {
  const out = new Float32Array(n), r = RNG(o.seed), w0 = 2 * Math.PI * f / SR, L = SR / f, s = o.damp, k = o.k || 1, K = clamp(Math.round(L / 50), 1, 12);
  // how stiff: partial n sits sqrt(1 + B n n) sharp, B about 4e-5 on the low D string and more on a shorter, higher one; the all-pass sections are set to give that
  const cc = 4e-5 * Math.sqrt(f / 73.4) * (o.stiff || 1) * SR * SR * SR / (8 * Math.PI * Math.PI * f * f * f) / K; let D0 = 1.5; for (let i = 0; i < 24; i++) D0 = Math.cbrt(12 * cc + D0); const a = (1 - D0) / (1 + D0);
  const dS = Math.atan2(s * Math.sin(w0), 1 - s + s * Math.cos(w0)) / w0, dK = k >= 1 ? 0 : Math.atan2((1 - k) * Math.sin(w0), 1 - (1 - k) * Math.cos(w0)) / w0;
  const dA = (Math.atan2(Math.sin(w0), a + Math.cos(w0)) + Math.atan2(-a * Math.sin(w0), 1 + a * Math.cos(w0))) / w0, d0 = L - dS - dK - K * dA;
  let M = 64; while (M < L + 16) M *= 2; const buf = new Float32Array(M), mask = M - 1, g = Math.pow(0.001, 1 / (f * o.t60));
  const Li = Math.floor(L), pkN = Math.max(1, Math.round(L * o.pos)), ne = Li + pkN + 4, exc = new Float32Array(ne), kb = 0.1 + 0.85 * o.hard, nz = o.noise === undefined ? 0.06 : o.noise, nt = 0.0025 * SR;
  let e1 = 0, e2 = 0; for (let i = 0; i < Li; i++) { const v = (i === 0 ? 1 : 0) + (r() * 2 - 1) * nz * Math.exp(-i / nt); e1 += kb * (v - e1); e2 += kb * (e1 - e2); exc[i] = e2; }
  for (let i = ne - 1; i >= pkN; i--) exc[i] -= 0.9 * exc[i - pkN];
  const ax = new Float64Array(K), ay = new Float64Array(K), dr = o.drift || 0, tau = 0.14 * SR; let Di = 1, eta = 0, fx1 = 0, fy1 = 0, p1 = 0, lp = 0;
  for (let i = 0; i < n; i++) {
    if ((i & 31) === 0) { const d = d0 * (1 - dr * Math.exp(-i / tau)); Di = Math.floor(d - 0.3); const fr = d - Di; eta = (1 - fr) / (1 + fr); }
    const v = buf[(i - Di) & mask]; let y = eta * v + fx1 - eta * fy1; fx1 = v; fy1 = y;
    for (let j = 0; j < K; j++) { const u = a * y + ax[j] - a * ay[j]; ax[j] = y; ay[j] = u; y = u; }
    let lo = (1 - s) * y + s * p1; p1 = y; if (k < 1) { lp += k * (lo - lp); lo = lp; }
    const z = g * lo + (i < ne ? exc[i] : 0); buf[i & mask] = z; out[i] = z;
  }
  const puN = Math.max(1, Math.round(L * (o.pu || 0.11))); for (let i = n - 1; i >= puN; i--) out[i] -= 0.8 * out[i - puN];
  // a pickup hears the string's speed: each harmonic weaker than the one under it (6 dB an octave from `tilt` times the note); the click of the pick itself is not tilted
  const kt = 1 - Math.exp(-2 * Math.PI * (o.tilt || 3) * f / SR); let tl = 0; for (let i = 0; i < n; i++) { tl += kt * (out[i] - tl); out[i] = tl; }
  if (o.click) { norm(out, 1); burst(out, 0, 0.002, 1800, 6000, o.click, o.seed + 3); }
  return metalBq(out, 'lp', o.res || 4200, 1.3);
}
const metalSat = v => v > 3 ? 1 : v < -3 ? -1 : v * (27 + v * v) / (27 + 9 * v * v);
// the amplifier, without its cabinet: lows cut before the gain (as a pedal in front does), a soft stage that is not the same
// up and down (even harmonics), a harder stage, all at four times the rate so the clipping does not fold back into the sound
function metalAmp(x, o) {
  const n = x.length, OS = 4, sr = SR * OS, y = new Float32Array(n * OS);
  metalBq(x, 'hp', o.tight, 0.7); metalBq(x, 'ls', 650, 0.6, -o.cut); metalBq(x, 'pk', 1300, 0.7, 4); metalBq(x, 'lp', 6500, 0.7); norm(x, 1);
  for (let i = 0, p = 0; i < n; i++) { const v = x[i], d = ((i + 1 < n ? x[i + 1] : 0) - v) / OS; for (let j = 0; j < OS; j++) y[p++] = v + d * j; }
  metalBq(y, 'lp', 15000, 0.54, 0, sr); metalBq(y, 'lp', 15000, 1.31, 0, sr);
  const g1 = o.gain, bias = 0.18, tb = metalSat(bias); for (let i = 0; i < y.length; i++) y[i] = metalSat(g1 * y[i] + bias) - tb;
  metalBq(y, 'hp', 70, 0.6, 0, sr); metalBq(y, 'lp', 9000, 0.7, 0, sr);
  const g2 = o.g2 || 3, c0 = 1.5 * 0.1 - 0.5 * 0.001; for (let i = 0; i < y.length; i++) { let v = g2 * y[i] + 0.1; v = v > 1 ? 1 : v < -1 ? -1 : v; y[i] = 1.5 * v - 0.5 * v * v * v - c0; }
  metalBq(y, 'lp', 16000, 0.54, 0, sr); metalBq(y, 'lp', 16000, 1.31, 0, sr);
  for (let i = 0; i < n; i++) x[i] = y[i * OS];
  metalBq(x, 'hp', 28, 0.7); metalBq(x, 'ls', 190, 0.7, o.low === undefined ? 7 : o.low); metalBq(x, 'pk', 750, 0.8, -3); return x;   // the tone controls after the gain: bass back up, the middle pulled down
}
// a power chord as one take: two strings palm-muted (short, dark, a thump), or root, fifth and octave left to ring; the strings
// are struck a few milliseconds apart (a down stroke), each a few cents off, and go through the amplifier TOGETHER
function metalChord(m, side, mute) {
  const sd = 9000 + m * 37 + side * 1009 + TAKE * 211 + (mute ? 5 : 0), r = RNG(sd), n = Math.floor((mute ? 0.32 : 2.1) * SR), x = new Float32Array(n);
  (mute ? [0, 7] : [0, 7, 12]).forEach((iv, j) => {
    const f = mf(m + iv) * Math.pow(2, ((r() - 0.5) * 5 + (j === 2 ? 3 : 0)) / 1200);
    const sx = norm(metalStr(f, n, { seed: sd + j * 17, t60: mute ? 0.2 : 5.5 - j, damp: mute ? 0.5 : 0.2 + 0.05 * j, k: mute ? 0.48 : 1, pos: 0.12 + 0.05 * r(), hard: mute ? 0.9 : 0.6 + 0.25 * r(), drift: 0.005 + 0.002 * r(), pu: 0.1 + 0.02 * r(), tilt: mute ? 3.8 : 3, click: mute ? 1.1 : 0.35 }), 1);
    const dl = Math.floor(j * (0.0025 + 0.004 * r()) * SR), gj = [1, 0.9, 0.7][j] * (0.85 + 0.3 * r()); for (let i = dl; i < n; i++) x[i] += sx[i - dl] * gj;
  });
  metalAmp(x, { gain: mute ? 14 : 18, g2: 2.5, tight: mute ? 80 : 70, cut: mute ? 6 : 5, low: mute ? 6 : 7 });
  return norm(fadeEnd(x, mute ? 0.03 : 0.08), 0.8);
}
// the cabinet: four twelve-inch speakers in a closed box, a microphone close to one cone. Nothing below 80 Hz, a thump just
// above it, a scoop in the low mids, presence near 2.5 kHz, a steep fall from 4.7 kHz, a few narrow notches (the direct sound
// against its reflections off the cone edge and the floor), and a breath of room. Left and right are two cabinets, not one.
const metalIRs = {};
function metalCabIR(side, sr) {
  const key = side + '_' + sr; if (metalIRs[key]) return metalIRs[key];
  const t0 = Date.now(), n = Math.floor(0.05 * sr), x = new Float32Array(n), r = RNG(771 + side * 13); x[0] = 1;
  (side ? [[0.00025, 0.3], [0.00064, -0.2], [0.0011, 0.13]] : [[0.0003, 0.28], [0.00052, -0.22], [0.00125, 0.14]]).forEach(c => { x[Math.round(c[0] * sr)] += c[1]; });
  metalBq(x, 'hp', 82, 0.95, 0, sr); metalBq(x, 'pk', side ? 122 : 112, 1.3, 3.5, sr); metalBq(x, 'pk', side ? 450 : 400, 0.9, -4.5, sr); metalBq(x, 'pk', side ? 2700 : 2450, 1.5, 5, sr); metalBq(x, 'pk', side ? 3500 : 3750, 4, -4, sr); metalBq(x, 'pk', 1500, 3, -2, sr);
  metalBq(x, 'lp', 4700, 0.8, 0, sr); metalBq(x, 'lp', 5200, 1.4, 0, sr); metalBq(x, 'lp', 6500, 0.6, 0, sr);
  for (let j = 0; j < 7; j++) { const at = Math.floor((0.006 + r() * 0.03) * sr), w = (r() - 0.5) * 0.09; for (let i = 0; i < 40 && at + i < n; i++) x[at + i] += w * (r() * 2 - 1) * Math.exp(-i / 12); }
  let e = 0; for (let i = 0; i < n; i++) e += x[i] * x[i]; const k = 1 / Math.sqrt(e); for (let i = 0; i < n; i++) x[i] *= k;
  GEN.ms += Date.now() - t0; GEN.bytes += n * 4; metalIRs[key] = fadeEnd(x, 0.004); return x;
}
const metalCab = (E, dk, k) => { const c = E.c, sr = c.sampleRate; if (!E.metalIR) { E.metalIR = c.createBuffer(2, Math.floor(0.05 * sr), sr); E.metalIR.getChannelData(0).set(metalCabIR(0, sr)); E.metalIR.getChannelData(1).set(metalCabIR(1, sr)); }
  const cv = c.createConvolver(); cv.normalize = false; cv.buffer = E.metalIR; return { i: cv, o: cv }; };
// the lead guitar's own cabinet and its own echo (three sixteenths long, darker each time round)
const metalLeadIns = (E, dk, k) => { const c = E.c, cab = metalCab(E, dk, k), o = E.G(1), d = c.createDelay(1), f = c.createBiquadFilter(), fb = E.G(0.34), wet = E.G(0.3);
  d.delayTime.value = clamp(dk.spu * 3, 0.12, 0.6); f.type = 'lowpass'; f.frequency.value = 2600; cab.o.connect(o); cab.o.connect(d); d.connect(f); f.connect(fb); fb.connect(d); f.connect(wet); wet.connect(o); return { i: cab.i, o }; };
// the clean guitar's chorus: two short delays that drift, one each side
const metalChorus = (E, dk) => { const c = E.c, i = E.G(1), o = E.G(1), mg = c.createChannelMerger(2);
  [0, 1].forEach(q => { const d = c.createDelay(0.05), l = c.createOscillator(), lg = E.G(0.0021), g = E.G(0.62); d.delayTime.value = 0.011 + q * 0.006; l.frequency.value = 0.57 + q * 0.26; l.connect(lg); lg.connect(d.delayTime); l.start(Math.max(0, dk.t0 - 0.01)); dk.ends.push(l); i.connect(d); d.connect(g); g.connect(mg, 0, q); });
  i.connect(o); mg.connect(o); return { i, o }; };
Object.assign(INST, {
  metal_pmL: { rr: 2, lo: 38, hi: 47, gen: m => metalChord(m, 0, true) }, metal_pmR: { rr: 2, lo: 38, hi: 47, gen: m => metalChord(m, 1, true) },
  metal_opL: { lo: 38, hi: 47, gen: m => metalChord(m, 0, false) }, metal_opR: { lo: 38, hi: 47, gen: m => metalChord(m, 1, false) },
  // the lead: one string, more gain, less bass cut, the neck side of the pickups (rounder): it holds for seconds
  metal_ld: { lo: 57, hi: 93, gen: m => { const n = Math.floor(2.3 * SR), x = metalStr(mf(m), n, { seed: 7000 + m, t60: clamp(7 - (m - 57) * 0.09, 3, 7), damp: 0.07, pos: 0.2, hard: 0.5, drift: 0.003, pu: 0.2, res: 3600, tilt: 3, click: 0.25 }); metalAmp(x, { gain: 30, g2: 3, tight: 120, cut: 5, low: 3 }); return norm(fadeEnd(x, 0.15), 0.8); } },
  // the clean guitar: the same string, no gain stage: a touch of valve squash, a glassy top
  metal_cl: { lo: 45, hi: 81, gen: m => { const n = Math.floor(2.6 * SR), x = metalStr(mf(m), n, { seed: 6000 + m, t60: clamp(6 - (m - 45) * 0.08, 2.6, 6), damp: 0.13, pos: 0.17, hard: 0.42, noise: 0.03, drift: 0.002, pu: 0.19, res: 5000, tilt: 5, click: 0.12 }); metalBq(x, 'hp', 85, 0.7); metalBq(x, 'pk', 2900, 1, 4); metalBq(x, 'pk', 300, 0.8, -2); norm(x, 1); for (let i = 0; i < n; i++) x[i] = metalSat(1.6 * x[i]); metalBq(x, 'lp', 5600, 0.7); return norm(fadeEnd(x, 0.25), 0.8); } },
  // the bass guitar: a picked string an octave under the guitars, a little grit, the clank of the pick
  metal_bs: { rr: 2, lo: 26, hi: 47, gen: m => { const n = Math.floor(1.6 * SR), x = metalStr(mf(m), n, { seed: 5000 + m + TAKE * 31, t60: 3.6, damp: 0.2, pos: 0.13, hard: 0.6, drift: 0.003, pu: 0.16, res: 2600, tilt: 2.2, click: 0.3, stiff: 2 }); metalBq(x, 'hp', 30, 0.7); norm(x, 1); for (let i = 0; i < n; i++) x[i] = metalSat(2.6 * x[i] + 0.1) - 0.0998; metalBq(x, 'pk', 850, 1, 4); metalBq(x, 'lp', 3400, 0.7); metalBq(x, 'hp', 30, 0.7); return norm(fadeEnd(x, 0.1), 0.85); } },
  // the kit: a tight kick with the click of the beater (so sixteenths stay apart), a cracking snare, a trashy china, a crash, a ride and its bell
  metal_kk: { rr: 2, fix: 30, gen: () => { const n = Math.floor(0.2 * SR), x = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR; ph += 2 * Math.PI * (52 + 105 * Math.exp(-t / 0.016)) / SR; x[i] = Math.sin(ph) * Math.exp(-t / 0.05) * Math.min(1, i / 12); } const c = modal([[3900, 2, 0.018], [2100, 1.2, 0.02], [5200, 1.2, 0.012]], 0.06); for (let i = 0; i < c.length; i++) x[i] += c[i]; burst(x, 0, 0.004, 2500, 6500, 4, 301); return norm(fadeEnd(x, 0.02), 0.9); } },
  metal_sn: { rr: 3, fix: 50, gen: () => { const x = modal([[205, 1, 0.12], [330, 0.5, 0.09], [470, 0.35, 0.07], [720, 0.2, 0.05]], 0.4); burst(x, 0, 0.075, 1800, 9500, 1.5, 303); burst(x, 0, 0.004, 2500, 12000, 1.2, 304); return norm(fadeEnd(x, 0.05), 0.9); } },
  metal_china: { fix: 70, gen: () => { const x = modal(rndParts(311, 100, 350, 11000, 0.25, 0.85, -0.05), 0.9, 0.002); burst(x, 0, 0.16, 1500, 12000, 3.2, 312); return norm(fadeEnd(x, 0.15), 0.85); } },
  metal_crash: { fix: 70, gen: () => { const x = modal(rndParts(315, 120, 300, 12500, 0.6, 1.5, -0.15), 1.5, 0.003); burst(x, 0, 0.25, 3000, 13000, 3, 316); return norm(fadeEnd(x, 0.25), 0.85); } },
  metal_ride: { rr: 2, fix: 70, gen: () => { const x = modal(rndParts(317, 60, 900, 11000, 0.5, 1.2, -0.1), 1.1); burst(x, 0, 0.008, 3000, 11000, 2.2, 318); return norm(fadeEnd(x, 0.2), 0.8); } },
  metal_bell: { rr: 2, fix: 70, gen: () => { const x = modal([[790, 0.5, 0.7], [1480, 0.8, 0.6], [2350, 1, 0.5], [3620, 0.8, 0.4], [4900, 0.5, 0.3], [6400, 0.3, 0.2]].concat(rndParts(319, 24, 3000, 11000, 0.15, 0.5)), 0.8); burst(x, 0, 0.004, 3000, 10000, 1.2, 320); return norm(fadeEnd(x, 0.15), 0.8); } }
});
const metalKit = { metal_kk: 0.75, metal_sn: 1.25, hh: 3.2, metal_ride: 1.8, metal_bell: 1.4, metal_crash: 1.3, metal_china: 1.3, tomK: 1 };
const metalRoot = r => r < 38 ? r + 12 : r;   // where the chord sits on a guitar in drop D: D2 G2 C3 A2 F2 B flat 2
// one guitar note from a made recording with what the left hand and the bar do: a bend or slide into the note (bend cents
// under, over bt seconds), vibrato that comes in late and widens (vib cents), a dive (dive: [after s, cents, over s])
function metalNote(E, dst, o) {
  const m = o.m, j1 = E.jr(), j2 = E.jr();
  if (E.reT && skipRe(E, dst, o.t)) return; E.note(dst, o.t, mf(m), o.i); if (E.dry || (E.solo && dst.__n !== E.solo)) return;
  const c = E.c, u = E.w(), bz = E.buf(o.i, m, 0), t = Math.max(o.t + (j1 - 0.5) * 0.012, 0), cents = (m - bz.z) * 100 + (j2 - 0.5) * 10 * u, len = bz.b.duration / Math.pow(2, cents / 1200), dur = Math.max(0.03, Math.min(o.dur, len - 0.06)), rel = o.r || 0.05, end = t + dur + rel * 4;
  const src = c.createBufferSource(), g = c.createGain(), dt = src.detune; src.buffer = bz.b; dt.setValueAtTime(cents + (o.bend || 0), t); if (o.bend) dt.linearRampToValueAtTime(cents, t + (o.bt || 0.07));
  if (o.dive) { dt.setValueAtTime(cents, t + o.dive[0]); dt.linearRampToValueAtTime(cents + o.dive[1], t + o.dive[0] + o.dive[2]); }
  g.gain.setValueAtTime(o.g, t); g.gain.setTargetAtTime(0, t + dur, rel); let n = 2;
  if (o.vib && dur > 0.3) { const l = c.createOscillator(), vg = c.createGain(); l.frequency.value = 5.3 + j1 * 0.9; vg.gain.setValueAtTime(0, t + 0.15); vg.gain.linearRampToValueAtTime(o.vib, t + 0.15 + Math.min(0.5, dur * 0.6)); l.connect(vg); vg.connect(dt); l.start(t); l.stop(end + 0.05); n += 2; }
  src.connect(g); let tail = g; if (o.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp(o.pan, -1, 1); g.connect(p); p.connect(dst); tail = p; n++; } else g.connect(dst);
  src.onended = () => done(tail); src.start(t); src.stop(end + 0.05); E.stat(n, t, end);
}
// a third above in D mixolydian (an octave below for a note outside it): the second guitar of a harmonised lead
const metalThird = m => { const sc = [0, 2, 4, 5, 7, 9, 10], pc = ((m - 62) % 12 + 12) % 12, ix = sc.indexOf(pc); return ix < 0 ? m - 12 : m + ((sc[(ix + 2) % 7] - pc + 12) % 12); };
// one note of the tune: on the clean guitar while the music is cool, on the lead guitar when it is hot, in two-part harmony at the peak
function metalLead(E, dk, t, du, m, g, mode) {
  const L = dk.L, I = E.I, st = dk.state, w = E.w(), j = E.jr();
  if (mode === 'low' || st === 'runlost' || st === 'lost') { Sm(E, L.pad.in, { i: 'metal_cl', m: m > 69 ? m - 12 : m, t, g: g * 0.8, dur: du + 1.2, r: 0.4, pan: 0.15 }); return; }
  if (st === 'bench' || st === 'pick' || st === 'shop' || (st === 'plan' && I < 0.5 && E.state !== 'chain')) { Sm(E, L.pad.in, { i: 'metal_cl', m, t, g: g * 0.7, dur: du + 0.8, r: 0.3, pan: 0.25 }); return; }
  const hot = mode === 'oct' || st === 'runwon' || st === 'overreact', long = du > 0.42, bend = g < 1 ? 0 : long && j < 0.3 ? -200 : j > 0.7 ? -100 : 0;
  metalNote(E, L.lead.in, { i: 'metal_ld', m, t, g: g * (hot ? 0.5 : 0.56), dur: du * 0.97, bend, bt: bend < -150 ? 0.11 : 0.05, vib: long ? 16 + 12 * w + (hot ? 8 : 0) : 0, pan: hot ? -0.3 : -0.08 });
  if (hot && g >= 1) metalNote(E, L.vox.in, { i: 'metal_ld', m: metalThird(m), t: t + 0.006, g: 0.36, dur: du * 0.97, bend, bt: bend < -150 ? 0.11 : 0.05, vib: long ? 20 + 12 * w : 0, pan: 0.4 });
}
const metalArp = [[0, 1, 2, 3, 4, 3, 2, 1], [0, 2, 1, 3, 2, 4, 3, 1], [0, 1, 3, 1, 2, 1, 4, 1], [0, 2, 3, 2, 4, 2, 5, 1], [0, 1, 2, 5, 3, 2, 1, 2], [0, 3, 2, 1, 4, 2, 3, 2]];
const metalRiffs = ['o.....mmo...m.mm', 'm.mmm.mmo.....mm', 'o..o..m.m.mmo...', 'm.mmo...m.mmo...', 'o...m.mmm.mmo.m.', 'm.mmm.mmm.mmo...', 'o.mmo.mmo.mmx.x.', 'x..x..x.m.mmm.mm'];
const metalBreak = ['O.....MMO.MM..M.', 'O..M.MO...MMMM..', 'O...MM..O..MM.M.', 'OMM...OMM...o.M.', 'O.....M.MMO...MM', 'O.MM....O.M.MM..'];
const metalGallop = ['m.mmm.mmm.mmm.mm', 'm.mmm.mmm.mmmmmm', 'x.mmm.mmx.mmm.mm', 'x.mmm.mmm.mmx.mm'];
// a bar. I is the heat: clean picking (under 0.3), chugs creep in (to 0.43), the kit and open chords (to 0.56), riffs (to 0.8), everything.
function metalPlay(E, dk, t, b, ch, name) {
  const s = dk.sec, r = dk.rng, L = dk.L, I = E.I, sp = dk.spu, w = E.w(), sw = dk.sw, at = u => t + sw(u) * sp, st = dk.drum || dk.S.drum, last = b === s.len - 1, state = dk.state;
  const D = L.drums.in, B = L.bass.in, P = L.pad.in, A = L.arp.in, X = L.vox.in;
  const chain = E.state === 'chain' && state === 'plan', sting = s.type === 'S', intro = s.type === 'I', drums = st !== 'none', sg = E.sg, gm = metalRoot(s.pedal && !chain && !sting ? 38 : ch.r), sus = name === 'mA5';
  const hit = (i, u, g, o) => Sm(E, D, Object.assign({ i, t: at(u), g: g * (metalKit[i] || 1) }, o || {}));
  const gt = (kind, m, u, g, du, dst) => { for (let sd = -1; sd <= 1; sd += 2) Sm(E, dst || A, { i: 'metal_' + kind + (sd < 0 ? 'L' : 'R'), m, t: at(u) + (sd > 0 ? 0.003 : 0), g, dur: du * sp, r: kind === 'pm' ? 0.03 : 0.07, pan: sd * 0.92 }); };
  const bs = (m, u, g, du) => Sm(E, B, { i: 'metal_bs', m, t: at(u), g, dur: du * sp, r: 0.05 });
  const cl = (m, u, g, du, pan) => Sm(E, P, { i: 'metal_cl', m, t: at(u), g, dur: du * sp + 0.25, r: 0.3, pan: pan || 0 });
  const kk = (u, g) => hit('metal_kk', u, g, { strict: 1 });
  // a bar of rhythm guitar from a pattern: 'o' an open chord that rings to the next stroke, 'x' an open chord cut short, 'm' a palm mute (capitals: on low D whatever the chord); the bass and the kick go with every stroke
  const riff = (p, g, o) => { o = o || {}; const ev = []; for (let u = 0; u < 16; u++) if (p[u] !== '.') ev.push(u);
    ev.forEach((u, k) => { const c = p[u], lc = c.toLowerCase(), gap = (k + 1 < ev.length ? ev[k + 1] : 16) - u, m = c === lc ? gm : 38, acc = u % 4 ? 0.82 : 1;
      if (lc === 'm') gt('pm', m, u, g * acc, Math.min(gap, 2.5));
      else if (lc === 'o' && gap >= 3 && w > 0.3 && r.chance(0.12 * w)) { gt('op', m + 1, u, g, 0.9); gt('op', m, u + 1, g, gap - 1.1); }      // later rounds: the wrong fret, put right a sixteenth later
      else gt('op', m, u, g * (lc === 'x' ? 0.9 : 1), lc === 'x' ? Math.min(gap, 1.5) : gap - 0.1);
      if (o.bass) bs(m - 12, u, o.bass * (lc === 'm' ? 0.85 : 1), lc === 'o' ? gap : Math.min(gap, 1.8));
      if (o.kick && drums) kk(u, o.kick * acc); }); };
  let mode;
  if (state === 'lost' || state === 'runlost') mode = state;
  else if (chain) mode = 'chain';
  else if (sting) mode = 'sting';
  else if (intro) mode = 'intro';
  else if (st === 'heavy') mode = state === 'overreact' ? 'break' : 'full';
  else if (state === 'bench' || state === 'pick' || state === 'shop' || state === 'won') mode = 'clean';
  else mode = I < 0.3 ? 'clean' : I < 0.43 ? 'creep' : I < 0.56 ? 'half' : I < 0.8 ? 'riff' : 'full';
  const hot = mode === 'riff' || mode === 'full', brk = s.brk && b < 4 && hot, blast = w > 0.25 && (hot || mode === 'break') && b % 4 === 3 && !last && !brk && r.chance(0.45 * w), over = dk.metalLong === dk.bar;
  const fill = drums && s.fill && (last || (w > 0.4 && b % 4 === 3)) && !blast && (hot || mode === 'half' || mode === 'break');
  const toms = (u0, u1, g) => { for (let u = u0; u < u1; u++) { const x = (u - u0) / Math.max(1, u1 - u0); if (u % 4 === 3 || r.chance(0.3)) hit('metal_sn', u, g * (0.7 + 0.4 * x), { pan: -0.1 }); else hit('tomK', u, g * (0.8 + 0.3 * x), { m: 52 - Math.floor(x * 4) * 3, pan: x * 1.2 - 0.6 }); } };
  // ---- the clean guitar: picked notes left to ring over the chord (no third while a chain may start: root, fifth, ninth, fourth) ----
  if (mode === 'clean' || mode === 'creep' || mode === 'half' || brk || (mode === 'intro' && b === 0)) {
    const k = mode === 'half' ? 0.5 : mode === 'creep' ? 0.8 : state === 'plan' ? 1 : 1.35, q = state === 'plan' || state === 'pick', tn = [gm + 12, gm + 19, gm + 24, gm + 26, gm + 31, q || sus ? gm + 29 : gm + 28];
    const seq = metalArp[(s.av + b * (1 + s.bv % 2)) % 6], calm = state === 'bench' ? 0.4 : state === 'pick' ? 0.25 : 0.1;
    if (state === 'shop') [0, 3, 6, 8, 11, 14].forEach((u, i) => { if (i === 0 || !r.chance(0.15)) cl(tn[seq[i]], u, 0.56 * (i % 3 ? 0.8 : 1), 16 - u, i % 2 ? 0.3 : -0.3); });
    else for (let i = 0; i < 8; i++) { if (state === 'pick' && b % 2 === 1 && i > 4) break; if (i === 0 || !r.chance(calm)) cl(tn[seq[i]], i * 2, 0.4 * k * (i % 4 === 0 ? 1.15 : i % 2 ? 0.75 : 0.9), 16 - i * 2, i % 2 ? 0.35 : -0.3); }
    if (state === 'pick' && b % 2 === 1) cl(Math.min(81, gm + 31 + (r.chance(0.5) ? 5 : 2)), 12, 0.22, 4, 0.5);                                 // a high note left hanging: the question
    if (mode === 'clean' || brk || mode === 'intro') { const bg = state === 'plan' ? 0.5 : 0.56; bs(gm - 12, 0, bg, 14); if (r.chance(0.4)) bs(gm - 5, 8 + 2 * r.i(3), bg * 0.7, 4); }
    if (drums && (mode === 'clean' || brk || mode === 'intro')) {
      if (st === 'tick' || state === 'bench' || brk || intro) { [0, 4, 8, 12].forEach(u => hit('metal_ride', u, 0.15 * (u ? 0.8 : 1), { pan: 0.35 })); if (I > 0.24 || state === 'pick') [2, 6, 10, 14].forEach(u => { if (r.chance(0.6)) hit('hh', u, 0.09, { pan: -0.3 }); }); if (r.chance(0.3)) hit('metal_bell', [6, 10, 14][r.i(3)], 0.1, { pan: 0.35 }); if (state === 'bench' || brk) kk(0, 0.22); }
      else { for (let u = 0; u < 16; u += 2) hit('hh', u, (u % 4 ? 0.09 : 0.15) * (0.8 + 0.4 * r()), { pan: -0.3 }); kk(0, 0.3); kk([8, 10, 7, 8][r.i(4)], 0.26); [4, 12].forEach(u => hit('metal_sn', u, 0.24, { pan: -0.1, lp: 4500 })); if (r.chance(0.3)) hit('metal_bell', [2, 6, 14][r.i(3)], 0.1, { pan: 0.35 }); if (last && s.fill) toms(13, 16, 0.25); }
    }
  }
  // ---- chugs creep in under the clean guitar; the kick, the hat, then a snare on three ----
  if (mode === 'creep') { const k = clamp((I - 0.3) / 0.13, 0.15, 1), p = ['m.m.m.m.m.m.m.m.', 'm.m.m.mmm.m.m.m.', 'm.m.m.m.m.mmm.m.', 'm...m.m.m...m.mm'][r.i(4)];
    riff(p, 0.2 + 0.26 * k, { bass: 0.42 });
    if (drums) { kk(0, 0.55); kk(r.chance(0.5) ? 8 : 10, 0.5); if (r.chance(0.3)) kk(6, 0.4); for (let u = 0; u < 16; u += 2) hit('hh', u, (u % 4 ? 0.1 : 0.16) * (0.8 + 0.4 * r()), { pan: -0.3 }); if (k > 0.45) hit('metal_sn', 8, 0.35 + 0.2 * k, { pan: -0.1 }); if (r.chance(0.3)) hit('tomK', 14, 0.4, { m: 43, pan: 0.4 }); } }
  // ---- the kit is in: an open chord on one, chugs after it ----
  if (mode === 'half' && !blast) { const p = ['o.....m.m.m.m.mm', 'o...m.m.o...m.mm', 'o.....mmm.m.m.m.', 'o..m..m.o..m..mm'][(s.av + b + r.i(2)) % 4];
    riff(p, 0.5, { bass: 0.6, kick: 0.7 });
    if (drums) { (I < 0.5 ? [8] : [4, 12]).forEach(u => { if (!(fill && u === 12)) hit('metal_sn', u, 0.62, { pan: -0.1 }); }); for (let u = 0; u < 16; u += 2) hit('hh', u, (u % 4 ? 0.11 : 0.18) * (0.8 + 0.4 * r()), { pan: -0.3 }); if (b === 0) hit('metal_crash', 0, 0.3, { pan: -0.4 }); if (r.chance(0.25)) kk([7, 11, 15][r.i(3)], 0.45); } }
  // ---- riffs ----
  if (hot && !brk && !blast) { const f = mode === 'full', p = metalRiffs[(s.av * 3 + b * (s.bv + 1) + (r.chance(0.3) ? r.i(8) : 0)) % 8];
    riff(p, f ? 0.6 : 0.54, { bass: 0.66, kick: 0.8 });
    if (drums && !over) {
      [4, 12].forEach(u => { if (!(fill && u === 12)) hit('metal_sn', u, 0.72, { pan: -0.1 }); });
      if (f && r.chance(0.6)) { for (let u = 0; u < 16; u++) if (p[u] === '.') kk(u, 0.55); }                                                        // both feet: every sixteenth
      else if (r.chance(0.3)) kk([3, 7, 11, 15][r.i(4)], 0.5);
      if (s.dv % 3 === 0) { for (let u = 0; u < 16; u += 2) hit(u % 4 ? 'metal_ride' : 'metal_bell', u, u % 4 ? 0.12 : 0.16, { pan: 0.35 }); }
      else for (let u = 0; u < 16; u += 2) hit('hh', u, (u % 4 ? 0.12 : 0.19) * (0.8 + 0.4 * r()), { pan: -0.3 });
      if (b === 0) hit('metal_crash', 0, 0.34, { pan: s.n % 2 ? 0.4 : -0.4 }); if (f && b % 2 === 1 && r.chance(0.5)) hit('metal_china', 8, 0.24, { pan: 0.45 });
    } }
  // a break: the riff rests for four bars, one chord left ringing over the clean guitar
  if (brk) { gt('op', gm, 0, 0.42, 12); }
  // later rounds: a blast beat bar, the guitars tremolo picking
  if (blast) { riff('mmmmmmmmmmmmmmmm', 0.46, { bass: 0.5 }); for (let u = 0; u < 16; u++) { if (u % 2 === 0) kk(u, 0.6); else hit('metal_sn', u, 0.42, { pan: -0.1 }); if (u % 2 === 0) hit('metal_ride', u, 0.14, { pan: 0.35 }); } hit('metal_china', 0, 0.26, { pan: 0.45 }); }
  // ---- a chain: the gallop (an eighth and two sixteenths), palm muted, both feet under it, more of everything as the surge grows ----
  if (mode === 'chain') { const p = metalGallop[sg < 0.25 ? r.i(2) : r.i(4)], g = 0.4 + 0.3 * sg + 0.12 * I;
    riff(p, g, { bass: 0.5 + 0.2 * sg });
    { for (let u = 0; u < 16; u++) { if (u % 4 === 0 || (sg > 0.12 && p[u] !== '.') || sg > 0.55) kk(u, (u % 4 ? 0.5 : 0.7) * (0.75 + 0.3 * sg)); }
      [4, 12].forEach(u => hit('metal_sn', u, 0.45 + 0.3 * sg, { pan: -0.1 }));
      for (let u = 0; u < 16; u += 2) hit(sg > 0.4 && u % 4 === 0 ? 'metal_bell' : 'hh', u, (u % 4 ? 0.1 : 0.16) * (0.8 + 0.4 * r()), { pan: sg > 0.4 && u % 4 === 0 ? 0.35 : -0.3 });
      if (sg > 0.6) [0, 8].forEach(u => hit('metal_china', u, 0.2, { pan: 0.45 })); if (sg > 0.45 && last) toms(12, 16, 0.4); } }
  // ---- OVERREACT: the breakdown. Half time: huge open chords on low D, palm-muted stabs off the beat, china on the quarters, both feet under the stabs, snare on three ----
  if (mode === 'break' && !blast) { const p0 = metalBreak[(s.av + b + (r.chance(0.25) ? r.i(6) : 0)) % 6], p = gm !== 38 && !over ? p0.slice(0, 12) + 'o.M.' : p0;
    riff(p, 0.7, { bass: 0.8, kick: 0.9 });
    for (let u = 1; u < 16; u++) if (p[u] === 'M' && p[u - 1] === '.' && r.chance(0.7)) kk(u - 1, 0.6);                                              // a flam of the feet into each stab
    if (!over) { hit('metal_sn', 8, 0.9, { pan: -0.1 }); if (!fill) { [0, 4, 8, 12].forEach(u => hit('metal_china', u, u ? 0.26 : 0.32, { pan: 0.45 })); } if (b % 2 === 0) hit('metal_crash', 0, 0.36, { pan: -0.45 }); if (r.chance(0.35)) { kk(13, 0.6); kk(14, 0.6); kk(15, 0.65); } } }
  // ---- endings and openings ----
  if (mode === 'sting') { const big = state === 'runwon';                                                                                            // round won: three chords up to D, held; the lead plays the flourish
    if (b < 3) { gt('op', gm, 0, 0.6, 15.5); bs(gm - 12, 0, 0.7, 15); kk(0, 0.8); hit('metal_crash', 0, 0.36, { pan: b % 2 ? 0.4 : -0.4 }); if (b === 2) hit('metal_china', 0, 0.24, { pan: 0.45 }); if (big) { for (let u = 2; u < 16; u++) kk(u, 0.5); hit('metal_sn', 8, 0.7); } else { hit('metal_sn', 8, 0.5, { pan: -0.1 }); if (b === 1) toms(12, 16, 0.4); } }
    else { gt('op', gm, 0, 0.6, 15.5); bs(gm - 12, 0, 0.7, 15); kk(0, 0.8); hit('metal_crash', 0, 0.3, { pan: 0.4 }); if (big) toms(8, 16, 0.5); } }
  if (mode === 'intro' && b > 0) { riff('m...m...m.m.mmmm', 0.4, { bass: 0.5, kick: 0.6 }); toms(8, 16, 0.4); hit('metal_ride', 0, 0.15, { pan: 0.35 }); hit('metal_ride', 4, 0.15, { pan: 0.35 }); }
  if (mode === 'lost') {                                                                                                                             // one clean chord that rings, and a muted shrug
    if (sting && b === 0) { [gm + 12, gm + 19, gm + 24, gm + 26, gm + 28, gm + 31].forEach((m, i) => Sm(E, P, { i: 'metal_cl', m, t: t + i * 0.022, g: 0.8, pan: (i - 2.5) * 0.15 })); bs(gm - 12, 0, 0.6, 14); }
    if (sting && b === 1) { gt('pm', 38, 6, 0.42, 2, X); gt('pm', 36, 9, 0.34, 2, X); }
    if (!sting && b % 4 === 0) cl(gm + 24 + (r.chance(0.5) ? 7 : 2), 0, 0.2, 16, 0.3); }
  if (mode === 'runlost') { const tn = [gm + 12, gm + 19, gm + 24, gm + 28]; [0, 4, 8, 12].forEach((u, i) => { if (i === 0 || r.chance(0.75)) cl(tn[(i + (b % 2 ? 1 : 0) + r.i(2)) % 4], u, 0.26, 16 - u, i % 2 ? 0.3 : -0.3); }); bs(gm - 12, 0, 0.45, 15); }
  // ---- fills; in later rounds one goes on too long ----
  if (fill) { const u0 = [12, 10, 8, 12][r.i(4)]; toms(u0, 16, 0.5); if (w > 0.3 && last && r.chance(0.5 * w)) dk.metalLong = dk.bar + 1; }
  if (over && drums) { toms(0, 6 + 2 * r.i(3), 0.5); hit('metal_crash', 8, 0.3, { pan: 0.4 }); }
  // ---- later rounds: a pinch-harmonic squeal, a dive on the bar ----
  if (w > 0.2 && (hot || mode === 'break') && !brk) {
    if (r.chance(0.3 * w)) metalNote(E, X, { i: 'metal_ld', m: 86 + 2 * r.i(4), t: at([6, 10, 14][r.i(3)]), g: 0.3, dur: 0.55, bend: -400, bt: 0.13, vib: 55, pan: r.chance(0.5) ? 0.6 : -0.6 });
    if (last && r.chance(0.4 * w)) metalNote(E, X, { i: 'metal_ld', m: gm + 24, t: at(8), g: 0.34, dur: 7.5 * sp, dive: [0.12, -1700, 6.5 * sp], pan: -0.45 });
  }
}
// a step of a chain: a pinch of open chord with the hit (longer, with the bass and a choked china, where the chord moves), and one climbing note on the lead
function metalStep(E, dk, t, n) {
  if (n === 1 && E.state === 'chain') E.rechord(t);                                                                                                  // the gallop starts with the first hit, not at the next bar line
  const ch = dk.curCh || CH[TH[E.th].chain[E.cix]], gm = metalRoot(ch.r), L = dk.L, D = L.drums.in, moved = n > 1 && (n - 1) % 3 === 0, g = 0.3 + 0.02 * Math.min(n, 12);
  // the effect is the star of this instant: the whole band is choked for a quarter of a second under it, then let go
  ['drums', 'bass', 'arp', 'lead', 'pad', 'vox'].forEach(k => { const p = L[k + 'Pump']; if (p) { p.gain.cancelScheduledValues(t); p.gain.setTargetAtTime(0.42, t, 0.005); p.gain.setTargetAtTime(1, t + 0.21, 0.05); } });
  for (let sd = -1; sd <= 1; sd += 2) Sm(E, L.arp.in, { i: 'metal_op' + (sd < 0 ? 'L' : 'R'), m: gm, t, g: moved ? g * 1.15 : g * 0.8, dur: moved ? 0.4 : 0.15, r: 0.05, pan: sd * 0.92 });
  Sm(E, D, { i: 'metal_kk', t, g: 0.7, strict: 1 });
  if (moved || n === 1) { Sm(E, L.bass.in, { i: 'metal_bs', m: gm - 12, t, g: 0.65, dur: 0.5 }); Sm(E, D, { i: 'metal_china', t, g: 0.3, dur: 0.2, r: 0.06, pan: 0.45 }); }
  else if (n >= 3) Sm(E, D, { i: 'metal_sn', t, g: 0.22 + 0.03 * Math.min(n, 10), pan: -0.1 });
  metalNote(E, L.vox.in, { i: 'metal_ld', m: nearTone(69 + Math.min(n, 14) * 1.5, ch), t, g: 0.3, dur: 0.24, bend: -70, bt: 0.04, pan: 0.3 });
}
function metalEnter(E, state, t, dk) {
  if (state === 'overreact' || state === 'runwon') { Sm(E, E.fx, { i: 'metal_crash', t, g: 0.34, pan: -0.4 }); Sm(E, E.fx, { i: 'metal_china', t, g: 0.26, pan: 0.4 }); Sm(E, E.fx, { i: 'tomK', m: 40, t, g: 0.5 }); }
}
// a lead-in to the bar line where the state changes: toms and snare into a loud state, a hat that opens into a calm one
function metalRoll(E, t, tb) {
  const hot = ['title', 'overreact', 'runwon', 'won'].indexOf(E.pending) >= 0, k = Math.max(3, Math.round((tb - t) / 0.1));
  for (let i = 0; i < k; i++) { const x = i / k; if (hot) Sm(E, E.fx, { i: i % 2 ? 'tomK' : 'metal_sn', m: 52 - Math.floor(x * 4) * 3, t: t + (tb - t) * x, g: 0.1 + 0.3 * x, pan: x - 0.5 }); else if (i % 2 === 0) Sm(E, E.fx, { i: 'hh', t: t + (tb - t) * x, g: 0.1 + 0.2 * x, pan: 0.3 }); }
}
TRACK(9, 'metal', {
  name: 'Chain Lightning', line: 'drop-D heavy metal: a clean, tense guitar that turns to galloping palm-muted riffs, twin lead guitars and a double-kick kit',
  why: 'a reaction running away is a gallop that will not stop; the blow-up is the breakdown',
  bpm: [140, 165], scale: [0, 2, 4, 5, 7, 9, 10], chain: ['mD5', 'mG5', 'mC5', 'mA5'],
  prog: { A: ['mD5', 'mD5', 'mC5', 'mG5', 'mD5', 'mD5', 'mC5', 'mA5'], B: ['mG5', 'mD5', 'mC5', 'mD5', 'mG5', 'mD5', 'mC5', 'mA5'], C: ['mBb5', 'mC5', 'mD5', 'mD5', 'mBb5', 'mC5', 'mD5', 'mA5'] },
  alt: { A: { 6: 'mF5' }, B: { 2: 'mF5' }, C: { 3: 'mG5' } }, forms: ['AABA', 'ABAC', 'ABCB', 'AABC'],
  tune: {
    A: [[[0, 4, 74], [4, 2, 76], [6, 2, 78], [8, 8, 81]], [[0, 4, 81], [4, 2, 78], [6, 2, 76], [8, 8, 74]], [[0, 4, 76], [4, 2, 79], [6, 2, 76], [8, 8, 72]], [[0, 4, 74], [4, 2, 71], [6, 2, 74], [8, 8, 79]],
        [[0, 4, 74], [4, 2, 76], [6, 2, 78], [8, 8, 81]], [[0, 4, 83], [4, 2, 81], [6, 2, 78], [8, 8, 81]], [[0, 4, 79], [4, 2, 76], [6, 2, 79], [8, 8, 84]], [[0, 4, 81], [4, 2, 79], [6, 2, 76], [8, 8, 76]]],
    B: [[[0, 6, 83], [6, 2, 81], [8, 8, 79]], [[0, 6, 81], [6, 2, 78], [8, 8, 74]], [[0, 6, 79], [6, 2, 76], [8, 4, 72], [12, 4, 76]], [[0, 12, 78], [12, 4, 81]],
        [[0, 6, 83], [6, 2, 81], [8, 8, 86]], [[0, 6, 81], [6, 2, 78], [8, 8, 81]], [[0, 6, 79], [6, 2, 76], [8, 4, 79], [12, 4, 84]], [[0, 16, 81]]],
    C: [[[0, 3, 74], [3, 3, 77], [6, 2, 74], [8, 8, 82]], [[0, 3, 76], [3, 3, 79], [6, 2, 76], [8, 8, 84]], [[0, 3, 78], [3, 3, 81], [6, 2, 78], [8, 8, 86]], [[0, 8, 86], [8, 4, 84], [12, 4, 81]],
        [[0, 3, 82], [3, 3, 81], [6, 2, 77], [8, 8, 74]], [[0, 3, 84], [3, 3, 79], [6, 2, 76], [8, 8, 79]], [[0, 4, 81], [4, 4, 78], [8, 8, 74]], [[0, 4, 76], [4, 4, 73], [8, 8, 76]]]
  },
  sting: {
    won: { prog: ['mBb5', 'mC5', 'mD5', 'mD5'], tune: [[[0, 4, 74], [4, 4, 77], [8, 8, 82]], [[0, 4, 76], [4, 4, 79], [8, 8, 84]], [[0, 2, 81], [2, 2, 83], [4, 2, 85], [6, 10, 86]], null] },
    lost: { prog: ['mD5', 'mD5', 'mD5', 'mD5'], tune: [null, null, null, null] },
    runwon: { prog: ['mBb5', 'mC5', 'mD5', 'mD5'], tune: [[[0, 8, 77], [8, 8, 82]], [[0, 8, 79], [8, 8, 84]], [[0, 2, 81], [2, 2, 83], [4, 2, 85], [6, 10, 86]], [[0, 16, 86]]] },
    runlost: { prog: ['mG5', 'mD5', 'mC5', 'mD5'], tune: [[[0, 6, 71], [6, 2, 69], [8, 8, 67]], [[0, 6, 69], [6, 2, 66], [8, 8, 62]], [[0, 6, 67], [6, 2, 64], [8, 8, 60]], [[0, 16, 66]]] }
  },
  mix: { drums: 1.5, bass: 0.9, pad: 1, lead: 0.45, arp: 0.4, vox: 0.45, bell: 1 },
  lay: { drums: { rev: 0.09, dly: 0, sat: 1.3, pump: true }, bass: { rev: 0.02, dly: 0, sat: 1.6 }, pad: { rev: 0.32, dly: 0.1, ins: metalChorus }, lead: { rev: 0.2, dly: 0, ins: metalLeadIns, pump: true }, arp: { rev: 0.07, dly: 0, ins: metalCab, pump: true }, vox: { rev: 0.16, dly: 0.05, ins: metalCab, pump: true }, bell: { rev: 0.2, dly: 0 } },
  g: 1, sg: { title: 1.15, bench: 1.45, pick: 1.4, won: 1.35, shop: 2.25, lost: 4.6, runwon: 1.13, runlost: 1.65 }, wow: 0.1, hall: 6.5, leadAt: 0.36, swing: w => (u => u), trim: sg => 0.6 * (1 - 0.3 * sg),
  play: metalPlay, lead: metalLead, step: metalStep, enter: metalEnter, roll: metalRoll
});
// TRACK:metal>>>
// <<<TRACK:surf
// MONSTER-MOVIE LAB (theme 10, id surf): the late-night B-movie laboratory played by a 1960s instrumental combo.
// A twangy single-coil guitar through a spring tank (the tune: tremolo-picked runs, whammy dips, slides, muted "drips"),
// a second guitar (muted chords, or a chord shimmering in the amp tremolo), a thin reedy combo organ, a picked bass in
// driving eighths, a kit on the surf beat, and a baritone sax growl at the peak. D mixolydian with a flat third in the runs.
// Everything is made here: strings as sums of their own partials (pick place, pickup place, stiffness), the amp's tone
// and slight breakup baked in, and the spring tank as a made impulse (three springs a side, each echo a chirp) in a convolver.
Object.assign(CH, {
  sfD: { r: 38, n: [57, 62, 66] }, sfC: { r: 36, n: [55, 60, 64] }, sfG: { r: 43, n: [55, 59, 62] }, sfA: { r: 33, n: [57, 61, 64] }, sfA7: { r: 33, n: [55, 61, 64] }, sfF: { r: 41, n: [57, 60, 65] },
  sfD5: { r: 38, n: [57, 62, 64] }, sfAs: { r: 33, n: [57, 62, 64] }
});
const surfSc = [0, 2, 4, 5, 7, 9, 10], surfOpen = [40, 45, 50, 55, 59, 64], surfBOpen = [28, 33, 38, 43];
const surfThird = m => { let k = m, c = 0; while (c < 2) { k--; if (surfSc.indexOf(((k - 62) % 12 + 12) % 12) >= 0) c++; } return k; };
// a string: every partial on its own (stiffness sharpens the high ones), as strong as the pick place and the pickup place make it, the high ones dying first
function surfStr(m, o) {
  const f0 = mf(m), P = []; let k = 0; while (k < o.open.length - 1 && m - o.open[k] > 9) k++;
  const fret = Math.max(0, m - o.open[k]), st = Math.pow(2, fret / 12), beta = Math.min(0.45, o.beta * st * (TAKE ? 1.3 : 1)), rho = Math.min(0.47, o.rho * st), B = o.B * st * st * (k < 3 ? 1 : 0.5);
  for (let n = 1; n < 90; n++) { const f = n * f0 * Math.sqrt(1 + B * n * n); if (f > o.top) break; const a = Math.sin(n * Math.PI * beta) * Math.sin(n * Math.PI * rho) / n * o.tone(f), T = o.t60 / (1 + Math.pow(f / o.fd, 2));
    if (n <= 5 && !o.mute) { P.push([f, a * 0.72, T], [f * 1.0007, a * 0.36, T * 1.3]); } else P.push([f, a, T]); }
  return modal(P, o.len);
}
// the amp and its speaker: scooped middle, bright top, the 12 inch speaker's roll-off; with the bridge pickup's own peak
const surfTone = f => (f / (f + 85)) * (1 - 0.42 * bump(f, 520, 380, 1)) * (1 + 1.1 * bump(f, 3100, 1500, 1)) / Math.sqrt(1 + Math.pow(f / 5600, 4));
function surfGtr(m, mute) {
  const len = mute ? 0.42 : clamp(2.5 - (m - 45) * 0.025, 1.5, 2.5);
  const x = surfStr(m, { open: surfOpen, beta: 0.13, rho: 0.09, B: 2.5e-5, top: 9500, len, t60: mute ? 0.22 : clamp(8.5 - (m - 45) * 0.08, 4.5, 8.5), fd: mute ? 500 : 1000, tone: surfTone, mute });
  norm(x, 1); burst(x, 0, mute ? 0.004 : 0.002, 1800, 5500, mute ? 0.5 : 0.35, 310 + m); if (mute) burst(x, 0, 0.018, 90, 380, 0.9, 311 + m);
  norm(x, 1); for (let i = 0; i < x.length; i++) x[i] = Math.tanh(1.35 * x[i]);                        // the amp just starting to break up on the pick
  return norm(fadeEnd(x, mute ? 0.05 : 0.1), 0.85);
}
function surfBass(m) {
  const x = surfStr(m, { open: surfBOpen, beta: 0.13, rho: 0.19, B: 6e-5, top: 4200, len: 1.5, t60: 3.2, fd: 520, tone: f => (f / (f + 110)) * (1 + 0.6 * bump(f, 320, 260, 1)) / Math.sqrt(1 + Math.pow(f / 2400, 4)) });
  norm(x, 1); burst(x, 0, 0.003, 900, 2800, 0.3, 330 + m); norm(x, 1); for (let i = 0; i < x.length; i++) x[i] = Math.tanh(1.2 * x[i]); return norm(fadeEnd(x, 0.08), 0.85);
}
// the spring tank. Three springs a side. Each trip down a spring is a chirp: under the spring's own limit (about 4.3 kHz) the lows
// arrive first and the tones near the limit several times later; over it a faint second set arrives highs first. mode 1: the tank kicked.
function surfSpring(mode) {
  const N = 131072, re = new Float64Array(N), im = new Float64Array(N), hz = SR / N, r = RNG(7001 + TAKE * 613 + mode * 97), a = 0.33, k1 = (1 + a) * (1 + a);
  const sp = [[0.0331, 4300, 2.3, 1], [0.0409, 4050, 2.0, 0.9], [0.0372, 4550, 2.6, 0.8]].map(q => ({ td: q[0] * (1 + (r() - 0.5) * 0.08), fc: q[1] * (1 + (r() - 0.5) * 0.06), t60: q[2], w: q[3], ph: 0, ph2: 0, j: [0, 1, 2].map(() => [250 + 1300 * r(), r() * 6.283, 0.0004 + 0.0005 * r()]) }));
  for (let k = 1; k < N / 2; k++) { const f = k * hz; let sr = 0, si = 0;
    const M = (f / (f + 180)) * (1 + 0.8 * bump(f, 1800, 1400, 1)) * (mode ? 1 + 4 * bump(f, 160, 220, 1) : 1) / (1 + Math.pow(f / 9000, 4));
    for (let q = 0; q < 3; q++) { const s = sp[q]; let tau, g, wt, ph;
      if (f < s.fc) { tau = s.td * k1 / (1 + a * a + 2 * a * Math.cos(Math.PI * f / s.fc)); let dj = 0; for (let i = 0; i < 3; i++) dj += s.j[i][2] * Math.sin(6.283 * f / s.j[i][0] + s.j[i][1]); s.ph += 6.283185 * (tau + dj) * hz; ph = s.ph; g = Math.pow(10, -3 * tau / (s.t60 * (1 - 0.45 * f / s.fc))); wt = s.w * Math.sqrt(1 - Math.pow(f / s.fc, 6)); }
      else { tau = 0.5 * s.td * (1 + 3 * (s.fc / f) * (s.fc / f)); s.ph2 += 6.283185 * tau * hz; ph = s.ph2; g = Math.pow(10, -3 * tau / 0.55); wt = s.w * 0.1 * Math.min(1, (f - s.fc) / 300); }
      const xr = g * Math.cos(ph), xi = -g * Math.sin(ph), den = (1 - xr) * (1 - xr) + xi * xi; sr += wt * (xr - g * g) / den; si += wt * xi / den; }
    if (mode) { const p1 = 6.283185 * f * 0.013, p2 = 6.283185 * f * 0.031, cr = 1 + 0.8 * Math.cos(p1) + 0.6 * Math.cos(p2), ci = -0.8 * Math.sin(p1) - 0.6 * Math.sin(p2), tr = sr * cr - si * ci; si = sr * ci + si * cr; sr = tr; }
    re[k] = sr * M; im[k] = si * M; }
  fftInv(re, im); const n = Math.floor(2.7 * SR), out = new Float32Array(n); let e = 0; for (let i = 0; i < n; i++) { out[i] = re[i]; e += re[i] * re[i]; }
  fadeEnd(out, 0.25); if (mode) return norm(out, 0.85); const kk = 1 / Math.sqrt(e || 1); for (let i = 0; i < n; i++) out[i] *= kk; return out;
}
Object.assign(INST, {
  surf_gtr:    { rr: 2, lo: 45, hi: 84, gen: m => surfGtr(m, 0) },
  surf_mute:   { rr: 2, lo: 45, hi: 84, gen: m => surfGtr(m, 1) },
  surf_bass:   { rr: 2, lo: 27, hi: 51, gen: m => surfBass(m) },
  surf_org:    { loop: 1, lo: 48, hi: 84, gen: m => padTone(mf(m), (n, f) => (n % 2 ? 1 : 0.55) * Math.pow(n, -0.8) * (f / (f + 700)) / (1 + Math.pow(f / 4800, 2)), 1, 340 + m, null, true) },
  surf_sax:    { loop: 1, lo: 36, hi: 57, gen: m => padTone(mf(m), (n, f) => Math.pow(n, -0.6) * (0.3 + bump(f, 450, 250, 1) + bump(f, 1300, 500, 0.7) + bump(f, 2600, 900, 0.4)) / (1 + Math.pow(f / 2800, 3)), 4, 350 + m, f => 0.0012 * bump(f, 2500, 2000, 1)) },
  surf_ther:   { loop: 1, lo: 72, hi: 84, gen: m => padTone(mf(m), n => [1, 0.22, 0.08, 0.03][n - 1] || 0, 2, 360 + m, null, true) },
  surf_spring: { fix: 60, gen: () => surfSpring(0) },
  surf_crash:  { fix: 60, gen: () => surfSpring(1) }
});
// the tank's impulse as a buffer of this context
function surfIR(E) {
  if (E.surfIRb) return E.surfIRb; const c = E.c, k = c.sampleRate / SR, x = rawOf('surf_spring', 60, 0).raw, n = Math.floor(x.length * k), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  if (k === 1) d.set(x); else for (let i = 0; i < n; i++) { const p = i / k, i0 = Math.floor(p), fr = p - i0; d[i] = (x[i0] || 0) * (1 - fr) + (x[i0 + 1] || 0) * fr; }
  return (E.surfIRb = buf);
}
// one tank for the deck (the guitars share it): the convolver, then left and right pulled apart a little
function surfTank(E, dk) {
  if (dk.surfTk) return dk.surfTk; const c = E.c, inp = E.G(1), cv = c.createConvolver(), mg = c.createChannelMerger(2);
  cv.normalize = false; cv.channelCount = 1; cv.channelCountMode = 'explicit'; cv.buffer = surfIR(E); inp.connect(cv);
  const dl = c.createDelay(0.05), sp = E.G(0.55), sn = E.G(-0.55); dl.delayTime.value = 0.0173; cv.connect(dl); dl.connect(sp); dl.connect(sn); cv.connect(mg, 0, 0); cv.connect(mg, 0, 1); sp.connect(mg, 0, 0); sn.connect(mg, 0, 1);   // left = tank + a late copy, right = tank - it: wide, and the same in mono
  const og = E.G(1); mg.connect(og); og.connect(dk.tone || dk.gs[0]); dk.surfTkOut = og; return (dk.surfTk = inp);
}
// the guitar amp as a layer insert: amp tremolo (a slow wobble of level, one for the whole part), and a send to the spring tank
const surfAmp = (wet, trem) => (E, dk, k) => {
  const c = E.c, G = E.G, i = G(1); if (E.dry) return { i, o: i };
  let x = i; if (trem) { const tg = G(1), lfo = c.createOscillator(), lg = G(0); lfo.frequency.value = 5.8; lfo.connect(lg); lg.connect(tg.gain); lfo.start(Math.max(0, dk.t0 - 0.02)); dk.ends.push(lfo); i.connect(tg); x = tg; dk['surfTr' + k] = { base: tg.gain, dep: lg.gain };
    const d0 = k === 'lead' ? (dk.state === 'runlost' || dk.state === 'lost' ? 0.32 : 0) : 0.3; tg.gain.value = 1 - d0; lg.gain.value = d0; }
  const sl = dk.S.L[k], s = G(wet * dk.mix[k] * (sl ? sl[0] : 0) * 0.85); x.connect(s); s.connect(surfTank(E, dk)); return { i, o: x };
};
// one picked note: as Sm, with the take chosen (down stroke, up stroke) and the pitch free to move (whammy bar, slides)
function surfP(E, dst, o) {
  const sp = INST[o.i], m = o.m === undefined ? sp.fix : o.m;
  if (E.reT && skipRe(E, dst, o.t)) return; E.note(dst, o.t, mf(m), o.i); if (E.dry || (E.solo && dst.__n !== E.solo)) return;
  const c = E.c, u = E.w(), j = E.jr(), j2 = E.jr(), bz = E.buf(o.i, m, o.take === undefined ? Math.floor(j * 3) : o.take);
  const t = Math.max(0, o.t + (j - 0.5) * 0.008 + (u > 0.15 ? (j2 - 0.3) * 0.03 * u : 0)), vel = o.g * (0.88 + 0.24 * j2);
  const cents = (m - bz.z) * 100 + (sp.fix === undefined ? (j2 - 0.5) * 10 * u : 0) + (o.det || 0), len = bz.b.duration / Math.pow(2, cents / 1200);
  const src = c.createBufferSource(), g = c.createGain(); src.buffer = bz.b; src.detune.setValueAtTime(cents, t); if (o.bend) o.bend.forEach(b => src.detune.setTargetAtTime(cents + b[1], t + b[0], b[2] || 0.03));
  g.gain.setValueAtTime(vel, t); let end = t + len, n = 2, tail = g; if (o.dur && o.dur < len - 0.03) { const rl = o.r || 0.06; g.gain.setTargetAtTime(0, t + o.dur, rl / 3); end = t + o.dur + rl * 2; }
  src.connect(g); if (o.pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp(o.pan, -1, 1); g.connect(p); p.connect(dst); tail = p; n++; } else g.connect(dst);
  src.start(t); src.stop(end + 0.05); src.onended = () => done(tail); E.stat(n, t, end);
}
// a chord strummed: down (low string first) or up (high first, the top strings only)
function surfStrum(E, dst, notes, t, g, du, up, o) {
  const v = up ? notes.slice(-3).reverse() : notes; v.forEach((m, k) => surfP(E, dst, Object.assign({ i: 'surf_gtr', m, t: t + k * (up ? 0.007 : 0.011), g: g * (up ? 0.8 : 1), dur: du, r: 0.08, take: up ? 1 : 0 }, o || {})));
}
// a slide down the low string, picked fast all the way
function surfGliss(E, dst, t, m0, drop, T, g, inst, pan) {
  const n = Math.max(4, Math.round(T / 0.058)); for (let k = 0; k < n; k++) { const c0 = -drop * 100 * Math.pow(k / n, 1.2), c1 = -drop * 100 * Math.pow((k + 1) / n, 1.2), m = Math.round(m0 + c0 / 100);
    surfP(E, dst, { i: inst || 'surf_gtr', m, t: t + k * T / n, g: g * (0.75 + 0.25 * (k % 2 ? 0 : 1)) * (1 - 0.3 * k / n), det: c0 - (m - m0) * 100, bend: [[0, c1 - c0, T / n / 2.5]], dur: T / n * 1.05, r: k === n - 1 ? 0.3 : 0.03, take: k % 2, pan: pan || 0 }); }
}
// the tank kicked: both sides crash
const surfKick = (E, dst, t, g) => { surfP(E, dst, { i: 'surf_crash', t, g, take: 0, pan: -0.6, det: -25 }); surfP(E, dst, { i: 'surf_crash', t: t + 0.004, g, take: 0, pan: 0.6, det: 30 }); };
// one note of the tune on the lead guitar
function surfLead(E, dk, t, du, m, g, mode) {
  const L = dk.L.lead.in, I = E.I, w = E.w(), sp = dk.spu, r = dk.rng, st = dk.state, chain = E.state === 'chain';
  while (m > 84) m -= 12; while (m < 47) m += 12;
  if (st === 'lost') { surfP(E, L, { i: 'surf_mute', m, t, g: g * 1.1, pan: -0.2, bend: [[0.02, -60, 0.08]] }); return; }
  if (mode === 'low' || st === 'runlost') { surfP(E, L, { i: 'surf_gtr', m: m > 69 ? m - 12 : m, t, g: g * 0.75, dur: du + 0.7, r: 0.4, pan: -0.15, take: 0 }); return; }
  const hot = mode === 'oct' || I > 0.8, gg = g * clamp(0.45 + 0.6 * I, 0.6, 1) * (hot ? 0.8 : 1), pan = -0.3;
  if (du < 0.1) { surfP(E, L, { i: 'surf_gtr', m, t, g: gg * 0.7, dur: 0.09, r: 0.03, pan, take: 1 }); return; }                 // a quick slide-in
  const n16 = Math.max(1, Math.round(du / sp)), run = n16 >= 2 && (dk.sec.type === 'C' || (hot && n16 >= 4 && r.chance(0.45))), long = n16 >= 6;
  const dip = long && !run && r.chance(0.75) ? [[du * 0.42, -(100 + 170 * w), 0.045], [du * 0.42 + 0.17, 0, 0.055]] : null, over = run && w > 0.3 && r.chance(0.2 * w);
  const voice = (mm, gv, pn, tk) => {
    if (run) for (let k = 0; k < n16; k++) { const lk = k === n16 - 1; surfP(E, L, { i: 'surf_gtr', m: mm + (over && lk ? 2 : 0), t: t + k * sp, g: gv * (k === 0 ? 1 : k % 2 ? 0.6 : 0.8) * (0.9 + 0.2 * r()), dur: lk ? sp * 1.5 : sp * 1.02, r: lk ? 0.12 : 0.03, pan: pn, take: (k + tk) % 2 }); }
    else surfP(E, L, { i: 'surf_gtr', m: mm, t, g: gv, dur: du * (n16 <= 2 ? 0.92 : 1) + (long ? 0.3 : 0.05), r: long ? 0.25 : 0.07, pan: pn, take: tk, bend: dip });
  };
  voice(m, gg, pan, 0);
  if (hot) { const m2 = mode === 'oct' || chain ? m - 12 : surfThird(m); voice(m2 < 45 ? m2 + 12 : m2, gg * 0.7, 0.4, 1); }                 // the second guitar: an octave under at the peak, a third under when hot
}
// the endings: four bars each
function surfSting(E, dk, t, b, ch) {
  const L = dk.L, sp = dk.spu, at = u => t + u * sp, D = L.drums.in, st = dk.state, bar = 16 * sp, r = dk.rng, big = st === 'runwon';
  const hit = (i, u, g, o) => Sm(E, D, Object.assign({ i, t: at(u), g: g * (KITG[i] || 1) }, o || {})), bn = (u, m, g, du) => surfP(E, L.bass.in, { i: 'surf_bass', m, t: at(u), g, dur: du * sp, r: 0.06, take: (u >> 1) & 1 });
  const full = [ch.r + 12, ch.r + 19, ch.n[0] + (ch.n[0] < ch.r + 19 ? 12 : 0), ch.n[1] + 12, ch.n[2] + 12].sort((x, y) => x - y);
  if (st === 'won' || big) {
    if (b < 2) { surfStrum(E, L.arp.in, full, at(0), 0.3, bar * 0.9, false, { pan: 0.35 }); for (let u = 0; u < 16; u += 2) bn(u, ch.r, 0.6, 1.9);
      if (b === 0) { for (let u = 0; u < 8; u++) hit('sn', u, 0.18 + 0.04 * u, { pan: -0.1 }); [50, 50, 48, 48, 45, 45, 41, 41].forEach((m, k) => hit('tomK', 8 + k, 0.5 + 0.03 * k, { m, pan: (k - 3.5) * 0.15 })); hit('kk', 0, 0.6); hit('kk', 8, 0.6); }
      else { for (let u = 0; u < 12; u += 2) hit('sn', u, 0.3 + 0.03 * u, { pan: -0.1 }); [12, 13, 14, 15].forEach((u, k) => hit(k < 2 ? 'sn' : 'tomK', u, 0.5 + 0.05 * k, { m: 43, pan: 0.2 })); [0, 4, 8, 12].forEach(u => hit('kk', u, 0.6)); }
      ch.n.forEach((m, k) => Sm(E, L.pad.in, { i: 'surf_org', m: m + 12, t, g: 0.16, dur: bar - 0.05, a: 0.01, r: 0.05, vib: 9, pan: (k - 1) * 0.5 })); }
    else if (b === 2) { const sh = []; for (let k = 0; k < 14; k++) sh.push([0.35 + k * 0.085, k % 2 ? 12 : -38, 0.03]); sh.push([1.6, 0, 0.1]);        // the ringing chord, shimmered on the whammy bar
      surfStrum(E, L.arp.in, full, t, 0.42, bar * 2 - 0.1, false, { pan: 0.35, bend: sh, r: 0.3 }); surfStrum(E, L.lead.in, full.map(m => m + (m < 60 ? 12 : 0)), t + 0.01, 0.3, bar * 2 - 0.1, false, { pan: -0.35, bend: sh, r: 0.3 });
      hit('crashC', 0, 0.4, { pan: -0.3 }); hit('kk', 0, 0.7); hit('sn', 0, 0.5); bn(0, ch.r, 0.8, 14); if (big) { hit('crashC', 1, 0.3, { pan: 0.4 }); Sm(E, L.vox.in, { i: 'surf_sax', m: ch.r + 12, t, g: 0.3, dur: bar * 1.6, a: 0.03, r: 0.2, trem: 27, pan: 0.2 }); }
      ch.n.forEach((m, k) => Sm(E, L.pad.in, { i: 'surf_org', m: m + 12, t, g: 0.15, dur: bar * 1.7, a: 0.01, r: 0.2, vib: 9, pan: (k - 1) * 0.5 }));
      for (let u = 4; u < 16; u++) hit('ride', u, 0.06 + 0.08 * r(), { pan: 0.4 }); }
    else { [[8, 48], [10, 43]].forEach(x => hit('tomK', x[0], 0.6, { m: x[1], pan: 0.2 })); hit('sn', 12, 0.6); hit('kk', 12, 0.7); hit('crashC', 12, 0.35, { pan: 0.3 }); surfStrum(E, L.arp.in, full, at(12), 0.36, 1.2, false, { pan: 0.35 }); bn(12, ch.r, 0.8, 6); }
  } else if (st === 'lost') {
    if (b === 0) { surfGliss(E, L.lead.in, at(8), 57, 14, 5 * sp, 0.7, 'surf_mute', -0.2); surfKick(E, L.bell.in, at(13.5), 0.22); bn(0, 38, 0.5, 7); }
    else { if (b === 1) surfStrum(E, L.lead.in, [50, 57, 62, 64], t, 0.22, bar * 2.6, false, { pan: 0.3, r: 0.5 }); if (b === 3) surfStrum(E, L.lead.in, [50, 57, 62, 64], t, 0.16, bar, true, { pan: 0.3, r: 0.5 }); surfP(E, L.bell.in, { i: 'surf_mute', m: ch.n[r.i(3)] + 12, t: at(2 + r.i(12)), g: 0.45, pan: r() * 1.2 - 0.6 }); }
  } else {   // run lost: a slow chord under the slow tune, both in the amp tremolo
    surfStrum(E, L.lead.in, [ch.r + 12, ch.n[0], ch.n[1]], t, 0.2, bar - 0.1, false, { pan: 0.3, r: 0.3 }); bn(0, ch.r, 0.5, 14);
  }
}
// a bar. The heat decides who plays: the creepy-quiet scene, then the bass drives, the kit takes the surf beat, the organ joins,
// the lead brings the tune, the second guitar doubles; a chain is the chase scene on top.
function surfPlay(E, dk, t, b, ch, name) {
  const s = dk.sec, r = dk.rng, L = dk.L, I = E.I, sp = dk.spu, w = E.w(), at = u => t + dk.sw(u) * sp, st = dk.drum || dk.S.drum, last = b === s.len - 1, bar = 16 * sp, state = dk.state;
  if (s.type === 'S') { surfSting(E, dk, t, b, ch); return; }
  const D = L.drums.in, B = L.bass.in, P = L.pad.in, A = L.arp.in, X = L.vox.in, G = L.bell.in, chain = E.state === 'chain' && state === 'plan', sg = chain ? E.sg : 0, intro = s.type === 'I', brk = s.brk && b < 4 && !chain, peak = st === 'heavy';
  const root = s.pedal && !chain ? 38 : ch.r, d = st === 'none' ? 0 : state === 'plan' ? I : peak ? 1 : st === 'main' ? Math.max(I, 0.66) : st === 'light' ? Math.min(I, 0.4) : 0.2;
  const hit = (i, u, g, o) => Sm(E, D, Object.assign({ i, t: at(u), g: g * (KITG[i] || 1) }, o || {})), noDr = state === 'lost' || state === 'runlost';
  // ---- the kit ----
  if (d > 0 && !brk && !intro) {
    const fill = last && s.fill && d > 0.55, f0 = fill ? (w > 0.3 && r.chance(0.6 * w) ? (r.chance(0.5) ? 0 : 4) : 8 + 2 * r.i(3)) : 99;   // in later rounds the drummer's fills run long
    if (d < 0.28) { [0, 4, 8, 12].forEach(u => hit('ride', u, 0.09 + 0.04 * r(), { pan: 0.4 })); if (r.chance(0.5)) hit('ride', [6, 10, 14][r.i(3)], 0.06, { pan: 0.4 }); [4, 12].forEach(u => { if (r.chance(0.85)) hit('brushS', u, 0.3, { pan: -0.15 }); }); if (r.chance(0.35)) hit('brushT', [6, 10, 14, 15][r.i(4)], 0.22, { pan: -0.1 }); }
    else if (d < 0.34) { for (let u = 0; u < 16; u += 2) hit('ride', u, (u % 4 ? 0.09 : 0.15) * (0.8 + 0.4 * r()), { pan: 0.4, dur: 0.6, r: 0.4 }); [0, 8].forEach(u => hit('kk', u, 0.28)); if (r.chance(0.3)) hit('kk', [6, 10][r.i(2)], 0.2); [4, 12].forEach(u => hit('rimK', u, 0.4, { pan: -0.1 })); if (r.chance(0.4)) hit('rimK', [6, 14, 10][r.i(3)], 0.26, { pan: -0.1 }); }
    else if (d < 0.86) { const lv = 0.8 + 0.35 * (d - 0.34);
      pat(['....x.x.....x...', '....x.....x...x.', '....x.x...x.x...', '....x.x.....x.x.', '....x.......x.x.', '....x.x.x...x...'][s.dv % 6], u => { if (u < f0) hit('sn', u, (u % 8 === 4 ? 0.52 : 0.36) * lv, { pan: -0.1 }); });   // the surf beat: the snare on two and doubled around it
      pat(['x.......x.x.....', 'x.....x.x.......', 'x.......x.......', 'x..x....x.......'][(s.dv + s.bv) % 4], u => hit('kk', u, 0.36 * lv)); if (r.chance(0.25)) hit('kk', [14, 6, 11][r.i(3)], 0.26 * lv);
      for (let u = 0; u < 16; u += 2) hit('ride', u, (u % 4 ? 0.12 : 0.2) * (0.8 + 0.4 * r()) * lv, { pan: 0.4, dur: 0.5, r: 0.4 }); [4, 12].forEach(u => hit('hh', u, 0.12, { pan: 0.3 }));
      for (let u = 1; u < 16; u++) if (u % 4 !== 0 && u < f0 && r.chance(0.07 + 0.1 * w)) hit('sn', u, 0.09 + 0.06 * r(), { pan: -0.1, lp: 3500 });
      if (b === 0 && d > 0.62 && dk.bar > 0) hit('crashC', 0, 0.28, { pan: -0.3 }); }
    else { for (let u = 0; u < 16; u += 2) if (u < f0) hit('sn', u, (u % 8 === 4 ? 0.6 : 0.3 + 0.08 * r()), { pan: -0.1 });                                   // flat out: the snare in driving eighths
      pat(['x...x...x...x...', 'x...x.x.x...x.x.', 'x..xx...x..xx...'][s.dv % 3], u => hit('kk', u, 0.4)); for (let u = 0; u < 16; u += 4) hit('ride', u, 0.26, { pan: 0.4, dur: 0.7, r: 0.4 }); [2, 6, 10, 14].forEach(u => hit('hho', u, 0.13 + 0.05 * r(), { pan: 0.3 }));
      if (b % 2 === 0) hit('crashC', 0, 0.34, { pan: b % 4 ? 0.35 : -0.35 }); if (r.chance(0.3)) hit('tomK', [7, 15, 11][r.i(3)], 0.5, { m: 43, pan: 0.3 }); }
    if (fill) { const tm = [50, 50, 48, 48, 45, 45, 43, 41]; for (let u = f0; u < 16; u++) { const k = Math.floor((u - f0) * 8 / (16 - f0)); if (r.chance(0.9)) hit(k < 2 && f0 >= 8 ? 'sn' : 'tomK', u, 0.4 + 0.02 * (u - f0), { m: tm[k], pan: (k - 3.5) * 0.17 }); } }
  }
  if (intro && b === s.len - 1) { for (let u = 6; u < 16; u++) hit('tomK', u, 0.12 + 0.035 * (u - 6), { m: u > 13 ? 43 : 41, pan: 0.3, dur: 0.22, r: 0.15 }); surfGliss(E, L.lead.in, at(9), 64, 14, 6.5 * sp, 0.6, 'surf_gtr', -0.3); }   // the title: a roll and a slide into the tune
  if (chain && st !== 'none') {   // the chase: a floor-tom roll building under everything, the snare joining in eighths
    for (let u = 0; u < 16; u++) hit('tomK', u, (0.1 + 0.42 * sg) * (u % 4 === 0 ? 1.25 : 0.75 + 0.3 * r()), { m: u % 8 >= 6 && sg > 0.3 ? 43 : 41, pan: 0.3, dur: 0.22, r: 0.15 });
    if (sg > 0.28 && d < 0.86) for (let u = 0; u < 16; u += 2) hit('sn', u, (0.1 + 0.3 * sg) * (u % 8 === 4 ? 1.3 : 1), { pan: -0.1 });
  }
  // ---- the bass: roots when quiet, driving eighths when warm ----
  const nx = chain ? ch.r : CH[s.prog[(b + 1) % s.prog.length]].r, sus = name === 'sfD5' || name === 'sfAs', bn = (u, m, g, du) => surfP(E, B, { i: 'surf_bass', m, t: at(u), g, dur: du * sp, r: 0.05, take: (u >> 1) & 1 });
  if (I < 0.28 && !chain) { if (!intro) { bn(0, root, 0.5, 7.5); if (r.chance(0.6)) bn(8, r.chance(0.5) ? root + 7 : root, 0.38, 7); if (r.chance(0.25)) bn(14, r.chance(0.5) ? root : root - 2, 0.35, 2); } }
  else { const dr = clamp((I - 0.28) / 0.3, 0, 1), lv = 0.64 + 0.14 * dr, third = sus ? 5 : 4;
    const sh = I < 0.45 && !chain ? [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 7, 7], [0, 0, 0, 0, 7, 7, 0, 0]][(s.bv + b) % 3] : [[0, 0, third, third, 7, 7, 9, 7], [0, 0, 0, 7, 0, 0, 10, 7], [0, 0, 7, 7, 12, 12, 7, 7], [0, 12, 0, 12, 0, 12, 10, 7], [0, 0, 0, 0, 7, 7, third, 7], [0, 7, 12, 7, 0, 7, 12, 7]][(s.bv + (b % 4 === 3 ? 1 : 0) + r.i(2) * 2) % 6];
    const ap = !chain && nx !== root && r.chance(0.5) ? (r.chance(0.5) ? nx - 1 : nx + 2) : null;
    for (let k = 0; k < 8; k++) { let m = root + sh[k]; if (k === 7 && ap !== null) m = ap < 28 ? ap + 12 : ap; else if (k > 1 && r.chance(0.05)) m += 12; if (m > 52) m -= 12; if (!(brk && k % 2) && !(intro && k)) bn(2 * k, m, lv * (k % 2 ? 0.82 : 1), 1.85); } }
  // ---- the second guitar: a chord shimmering in the amp tremolo, then muted chords, then full strums ----
  const tr = dk.surfTrarp; if (tr && !E.reT) { const dep = chain ? 0.05 : I < 0.3 || intro ? 0.42 : I < 0.6 ? 0.14 : 0.05; tr.dep.setTargetAtTime(dep, t, 0.4); tr.base.setTargetAtTime(1 - dep, t, 0.4); }
  const voic = [ch.r + 12, ch.n[0], ch.n[1], ch.n[2]].sort((x, y) => x - y);
  if (chain && sg > 0.1) { const cm = nearTone(55 + Math.min(E.stepN || 1, 14) * 1.5, ch); for (let u = 0; u < 16; u++) surfP(E, A, { i: 'surf_gtr', m: cm, t: at(u), g: (0.14 + 0.3 * sg) * (u % 4 === 0 ? 1 : u % 2 ? 0.6 : 0.8), dur: sp * 1.02, r: 0.03, take: u % 2, pan: 0.4 }); }   // the chase: tremolo-picked, climbing with the steps
  else if (I < 0.3 || noDr || intro) { const A2 = noDr ? L.lead.in : A; surfStrum(E, A2, voic, t, 0.24, bar - 0.05, false, { pan: 0.4, r: 0.3 }); if (r.chance(0.3) && !intro) surfStrum(E, A2, voic, at(8 + 2 * r.i(2)), 0.2, bar * 0.5, true, { pan: 0.4, r: 0.3 }); }
  else if (I < 0.6 && !peak) { pat(['..x...x...x...x.', '..x...x.x.x...x.', 'x.x...x...x.x...', '..x.x.x...x.x.x.'][(s.av + b) % 4], u => { if (!(brk && u > 8) && r.chance(0.93)) voic.slice(1).forEach((m, k) => surfP(E, A, { i: 'surf_mute', m, t: at(u) + k * 0.005, g: 0.95 * (u % 4 === 2 ? 1 : 0.75), take: (u >> 1) & 1, pan: 0.4 })); }); }
  else if (!brk) { pat(['x...x.x...x.x.x.', 'x.x.x.x.x.x.x.x.', 'x...x.xx..x.x.x.', 'x.x...x.x.x...x.'][(s.av + b) % 4], u => { if (r.chance(0.94)) surfStrum(E, A, voic, at(u), 0.2 * (u % 4 === 0 ? 1 : 0.8), sp * (u % 4 === 0 ? 2.4 : 1.7), u % 4 !== 0, { pan: 0.4 }); }); }
  // ---- the combo organ: held chords, then stabs; it swells in a chase ----
  if ((I > 0.34 || sg > 0.2) && !intro && !noDr) { const og = 0.13 + 0.05 * I + 0.1 * sg, on2 = [ch.n[1], ch.n[2], ch.n[0] + 12];
    if (w > 0.3 && I > 0.5 && b % 2 === 0 && r.chance(0.2 * w)) Sm(E, P, { i: 'surf_org', m: ch.n[2] + 12, t, g: og * 1.1, dur: bar * 2.4, a: 0.01, r: 0.05, vib: 14, pan: -0.5 });                                // later rounds: a key sticks
    if ((I < 0.72 && !peak) || chain) on2.slice(0, I > 0.55 || chain ? 3 : 2).forEach((m, k) => Sm(E, P, { i: 'surf_org', m, t, g: og, dur: bar - 0.05, a: 0.012, r: 0.05, vib: 9, pan: [-0.55, 0.1, -0.2][k] }));
    else { pat(['..x...x...x...x.', 'x..x..x...x..x..', '....x.x.....x.x.', 'x.....x.x.....x.'][(s.bv + b + s.av) % 4], u => { if (r.chance(0.92)) on2.forEach((m, k) => Sm(E, P, { i: 'surf_org', m, t: at(u), g: og * 1.2, dur: sp * 1.5, a: 0.006, r: 0.04, pan: [-0.55, 0.1, -0.2][k] })); });
      if (peak) Sm(E, P, { i: 'surf_org', m: ch.n[2] + 12, t, g: og * 0.7, dur: bar - 0.05, a: 0.02, r: 0.06, vib: 12, pan: 0.5 }); } }
  // ---- the peak: a baritone sax growls along with the bass ----
  if ((peak || I > 0.9) && !intro) { const sx = [[0, 0], [4, 0], [8, 7], [12, s.bv % 2 ? 10 : 7]]; if (r.chance(0.4)) sx.push([14, 12]); sx.forEach(x => { let m = root + 12 + x[1]; if (m > 57) m -= 12; Sm(E, X, { i: 'surf_sax', m, t: at(x[0]), g: 0.38, dur: sp * (x[0] === 14 ? 1.6 : 3.3), a: 0.025, r: 0.07, trem: 27, pan: 0.2 }); }); }
  // ---- drips: muted notes that splash in the springs, when the lab is quiet ----
  if (I < 0.5 && !chain) { const n = intro ? 1 : I < 0.3 ? 1 + r.i(3) : r.i(2); for (let k = 0; k < n; k++) surfP(E, G, { i: 'surf_mute', m: ch.n[r.i(3)] + (r.chance(0.6) ? 12 : 0), t: at(r.i(16)), g: 0.33 + 0.17 * r(), pan: r() * 1.4 - 0.7 }); }
  else if (!chain && I < 0.8 && r.chance(0.18)) surfP(E, G, { i: 'surf_mute', m: ch.n[r.i(3)] + 12, t: at(2 + 4 * r.i(4)), g: 0.4, pan: r() * 1.4 - 0.7 });
  // ---- later rounds: wilder and funnier, never darker ----
  if (w > 0.2 && b === 0 && I > 0.5 && !intro && r.chance(0.3 * w)) surfKick(E, G, t + 0.01, 0.2 + 0.15 * w);                                              // somebody kicks the spring tank
  if (w > 0.25 && last && I > 0.55 && !chain && r.chance(0.3 * w)) surfGliss(E, A, at(10), 64, 12 + r.i(8), 6 * sp, 0.4, 'surf_gtr', 0.4);          // a slide nobody asked for
  if (E.rnd >= 6 && b % 4 === 3 && I > 0.55 && !chain && r.chance(0.14)) { const m = 79 + r.i(3) * 2; Sm(E, X, { i: 'surf_ther', m, t: at(4), g: 0.07, dur: bar * 0.7, a: 0.25, r: 0.4, vib: 45, pan: -0.6 }); }   // rare, quiet, late: a wail from the next lab
}
// a chain step: one climbing note, picked three times fast, splashing in the springs; on a chord change the root and an organ stab
function surfStep(E, dk, t, n) {
  const ch = dk.curCh || CH[TH[E.th].chain[E.cix]], G = dk.L.bell.in, m = nearTone(58 + Math.min(n, 14) * 1.6, ch), g = 0.17 + 0.012 * Math.min(n, 12), dv = clamp(0.52 - 0.8 * (E.I - 0.2), 0.18, 0.52);
  if (!E.dry) ['drums', 'bass', 'pad', 'lead', 'arp', 'vox', 'tank'].forEach(k => { const p = k === 'tank' ? dk.surfTkOut : dk.L[k + 'Pump']; if (p) { p.gain.setTargetAtTime(dv, Math.max(0, t - 0.015), 0.005); p.gain.setTargetAtTime(1, t + 0.24, 0.07); } });   // the band ducks under the hit: the effect is the star of that instant
  [0, 0.06, 0.12].forEach((dt, k) => surfP(E, G, { i: 'surf_gtr', m, t: t + dt, g: g * [1, 0.55, 0.8][k], take: k % 2, dur: k < 2 ? 0.065 : 0.45, r: k < 2 ? 0.03 : 0.2, pan: -0.25 }));
  if (n > 1 && (n - 1) % 3 === 0) { surfP(E, dk.L.bass.in, { i: 'surf_bass', m: ch.r, t, g: 0.7, dur: 0.5, take: 0 }); ch.n.forEach((mm, k) => Sm(E, dk.L.pad.in, { i: 'surf_org', m: mm, t, g: 0.16, dur: 0.22, a: 0.006, r: 0.05, vib: 9, pan: (k - 1) * 0.5 })); }
  if (n >= 5) Sm(E, dk.L.drums.in, { i: 'sn', t, g: 0.2 + 0.03 * Math.min(n - 5, 8), pan: -0.1 }); if (n % 4 === 0 || n >= 11) Sm(E, dk.L.drums.in, { i: 'tomK', m: 48 - (n % 3) * 3, t: t + 0.09, g: 0.3, pan: 0.2 });
}
// a state starts: OVERREACT opens with the slide down the low string, a crash and the tank kicked
function surfEnter(E, state, t, dk) {
  if (state === 'overreact') { Sm(E, E.fx, { i: 'crashC', t, g: 0.3 }); Sm(E, E.fx, { i: 'kk', t, g: 0.5 }); if (dk && dk.L.lead) { surfGliss(E, dk.L.lead.in, t, 64, 19, 0.75, 2.2, 'surf_gtr', -0.3); surfKick(E, dk.L.bell.in, t + 0.02, 0.8); } }
  else if (state === 'runwon') { Sm(E, E.fx, { i: 'crashC', t, g: 0.3 }); Sm(E, E.fx, { i: 'kk', t, g: 0.5 }); }
}
// waiting for the bar line: a floor-tom roll into it
function surfRoll(E, t, tb) { const k = Math.max(3, Math.round((tb - t) / 0.09)); for (let i = 0; i < k; i++) Sm(E, E.fx, { i: 'tomK', m: i > k - 3 ? 43 : 41, t: t + (tb - t) * i / k, g: 0.03 + 0.12 * i / k, pan: 0.2 }); }
TRACK(10, 'surf', {
  name: 'Monster-movie lab', line: 'twangy guitar through a spring tank, combo organ, picked bass and a surf beat: the late-night laboratory, played by a 1960s combo',
  why: 'a lab going wrong is the oldest scene in monster movies, and surf guitar is their sound: fast, twangy, fun, a little spooky',
  bpm: [150, 172], scale: [0, 2, 4, 5, 7, 9, 10], chain: ['sfD5', 'sfG', 'sfC', 'sfAs'],
  prog: { A: ['sfD', 'sfD', 'sfC', 'sfG', 'sfD', 'sfD', 'sfC', 'sfA'], B: ['sfG', 'sfG', 'sfD', 'sfD', 'sfG', 'sfG', 'sfA', 'sfA7'], C: ['sfD', 'sfC', 'sfD', 'sfC', 'sfG', 'sfG', 'sfA', 'sfA7'] },
  alt: { A: { 1: 'sfC' }, B: { 5: 'sfC' }, C: { 1: 'sfG' } }, forms: ['AABA', 'ABAC', 'ABCB', 'ACAB', 'AABC'],
  tune: {
    // A, the hook: three steps up and a leap to the top, then down by step; the same a tone lower; an answer
    A: [[[0, 4, 62], [4, 2, 62], [6, 2, 64], [8, 4, 66], [12, 4, 69]], [[0, 6, 74], [6, 2, 72], [8, 8, 69]], [[0, 4, 60], [4, 2, 60], [6, 2, 62], [8, 4, 64], [12, 4, 67]], [[0, 6, 71], [6, 2, 69], [8, 8, 67]],
        [[0, 4, 62], [4, 2, 62], [6, 2, 64], [8, 4, 66], [12, 4, 69]], [[0, 6, 74], [6, 2, 76], [8, 8, 78]], [[0, 4, 76], [4, 4, 72], [8, 4, 67], [12, 4, 72]], [[0, 4, 73], [4, 2, 71], [6, 2, 69], [8, 8, 69]]],
    // B, the bridge on G: long notes for the whammy bar
    B: [[[0, 8, 67], [8, 4, 71], [12, 4, 74]], [[0, 12, 76], [12, 4, 74]], [[0, 8, 66], [8, 4, 69], [12, 4, 74]], [[0, 12, 72], [12, 4, 69]],
        [[0, 8, 67], [8, 4, 71], [12, 4, 74]], [[0, 6, 79], [6, 2, 76], [8, 8, 74]], [[0, 4, 73], [4, 4, 76], [8, 4, 73], [12, 4, 69]], [[0, 4, 67], [4, 4, 69], [8, 8, 73]]],
    // C, the runs: tremolo-picked, crawling up through the flat third
    C: [[[0, 2, 62], [2, 2, 64], [4, 2, 65], [6, 2, 66], [8, 2, 69], [10, 2, 71], [12, 4, 74]], [[0, 2, 72], [2, 2, 71], [4, 2, 69], [6, 2, 67], [8, 8, 64]], [[0, 2, 62], [2, 2, 64], [4, 2, 65], [6, 2, 66], [8, 2, 69], [10, 2, 71], [12, 4, 76]], [[0, 2, 79], [2, 2, 76], [4, 2, 74], [6, 2, 72], [8, 8, 67]],
        [[0, 2, 67], [2, 2, 69], [4, 2, 71], [6, 2, 72], [8, 2, 74], [10, 2, 76], [12, 4, 79]], [[0, 4, 77], [4, 4, 74], [8, 8, 71]], [[0, 2, 69], [2, 2, 73], [4, 2, 76], [6, 2, 79], [8, 2, 76], [10, 2, 73], [12, 4, 69]], [[0, 8, 76], [8, 8, 69]]]
  },
  sting: {
    won: { prog: ['sfG', 'sfA', 'sfD', 'sfD'], tune: [[[0, 4, 67], [4, 4, 71], [8, 8, 74]], [[0, 4, 69], [4, 4, 73], [8, 8, 76]], null, null] },
    lost: { prog: ['sfD5', 'sfD5', 'sfD5', 'sfD5'], tune: [[[0, 2, 69], [2, 2, 66], [4, 4, 62]], null, null, null] },
    runwon: { prog: ['sfC', 'sfA', 'sfD', 'sfD'], tune: [[[0, 4, 72], [4, 4, 76], [8, 8, 79]], [[0, 4, 73], [4, 4, 76], [8, 8, 81]], null, null] },
    runlost: { prog: ['sfD', 'sfD', 'sfC', 'sfA'], tune: [[[0, 8, 62], [8, 4, 62], [12, 4, 64]], [[0, 8, 66], [8, 8, 69]], [[0, 12, 72], [12, 4, 71]], [[0, 16, 69]]] }
  },
  mix: { drums: 4, bass: 0.6, pad: 3.2, lead: 1.05, arp: 1.8, vox: 1.1, bell: 2.5 },
  lay: { drums: { rev: 0.12, dly: 0, sat: 1.15, pump: true }, bass: { rev: 0.02, dly: 0, sat: 1.3 }, pad: { rev: 0.16, dly: 0 }, lead: { rev: 0.05, dly: 0, pump: true, ins: surfAmp(0.4, true) }, arp: { rev: 0.05, dly: 0, pump: true, ins: surfAmp(0.32, true) }, vox: { rev: 0.16, dly: 0, sat: 2.4, pump: true }, bell: { rev: 0.04, dly: 0, ins: surfAmp(1.5, false) } },
  g: 0.8, sg: { bench: 1.5, pick: 1.45, shop: 1.2, lost: 1.9, runlost: 1.5, overreact: 0.9, runwon: 0.9 }, wow: 0.25, hall: 6.5, leadAt: 0.5, swing: () => (u => u), trim: sg => 0.5 * (1 - 0.25 * sg),
  play: surfPlay, lead: surfLead, step: surfStep, enter: surfEnter, roll: surfRoll
});
// TRACK:surf>>>
// <<<TRACK:baroque
// ====================================================================================================================
// BAROQUE, theme 11: "harpsichord gone wrong". The alchemist's workshop: a chamber band in D major with a two-manual
// harpsichord in front (the lead and the motor), cello and violone on a walking bass, a chamber organ, violins, a baroque
// oboe as second voice, and natural trumpets and timpani in D for the peak. Tidy counterpoint that comes apart as the
// reaction runs away. Buses: arp = harpsichord, lead = the tune (harpsichord, oboe, violins; trumpets at the peak go to
// bell), bass = cello and violone, pad = organ, vox = violins, bell = second voice (oboe) and trumpets, drums = timpani.
// ====================================================================================================================
Object.assign(CH, {
  bqD: { r: 38, n: [62, 66, 69] }, bqG: { r: 43, n: [59, 62, 67] }, bqC: { r: 36, n: [60, 64, 67] }, bqA7: { r: 33, n: [61, 64, 67] }, bqA: { r: 33, n: [57, 61, 64] },
  bqBm: { r: 35, n: [59, 62, 66] }, bqEm: { r: 40, n: [59, 64, 67] }, bqD7: { r: 38, n: [60, 66, 69] }
});
// ---- the string of a harpsichord: a loop the length of the string, plucked by a quill close to its end. The pluck is a
// pair of opposite pulses (one for each way round the string); the loop loses a little of its top each trip (so the buzz
// dies before the body of the tone) and is tuned by an all-pass. ----
function bqString(f, len, t60, damp, pos) {
  const n = Math.floor(len * SR), out = new Float32Array(n), Lt = SR / f - damp, M = Math.max(2, Math.floor(Lt - 0.1)), d = Lt - M, ap = (1 - d) / (1 + d), buf = new Float32Array(M), g = Math.pow(0.001, 1 / (f * t60));
  const pk = clamp(Math.round(M * pos), 1, M - 1); buf[0] = 1; buf[pk] -= 1;
  let ix = 0, x1 = 0, ax = 0, ay = 0;
  for (let i = 0; i < n; i++) { const y = buf[ix]; out[i] = y; const v = (1 - damp) * y + damp * x1; x1 = y; const a = ap * v + ax - ap * ay; ax = v; ay = a; buf[ix] = g * a; ix++; if (ix === M) ix = 0; }
  return out;
}
// what the soundboard gives of it: level up to fc, falling above; then normalised
function bqChoir(f, len, t60, damp, pos, fc) {
  const x = bqString(f, len, t60, damp, pos), n = x.length, k1 = 1 - Math.exp(-2 * Math.PI * fc / SR), k2 = 1 - Math.exp(-2 * Math.PI * 9500 / SR), k3 = 1 - Math.exp(-2 * Math.PI * 170 / SR); let a = 0, b = 0, c = 0;
  for (let i = 0; i < n; i++) { a += k1 * (x[i] - a); b += k2 * (a - b); c += k3 * (b - c); x[i] = b - c; }
  return norm(x, 1);
}
const bqBODY = [[128, 5, 0.4], [215, 6, 0.5], [340, 6, 0.5], [530, 6, 0.6], [820, 5, 0.7], [1300, 4, 0.9], [2100, 4, 1], [3300, 3, 1], [5000, 3, 0.8]];
// kind 0: the two 8-foot choirs together (the back one a touch sharp, plucked nearer the end, a few ms late); 1: the 4-foot; 2: one 8-foot under the lute stop (felt on the string)
function bqHarp(m, kind) {
  const f = mf(m), len = kind === 2 ? clamp(1.2 - (m - 36) * 0.012, 0.55, 1.2) : kind === 1 ? clamp(1.5 - (m - 48) * 0.024, 0.4, 1.5) : clamp(2.2 - (m - 36) * 0.033, 0.5, 2.2), t60 = kind === 2 ? clamp(1.5 - (m - 36) * 0.018, 0.5, 1.5) : clamp(5.5 - (m - 36) * 0.09, 0.8, 5.5);
  const damp = kind === 2 ? clamp(30 / f, 0.04, 0.35) : clamp(9 / f, 0.012, 0.18), fc = kind === 2 ? 2300 : clamp(2800 + f * 1.5, 3000, 5200), n = Math.floor(len * SR);
  const x = bqChoir(f, len, t60, damp, kind === 1 ? 0.13 : 0.105, fc);
  if (kind === 0) { const y = bqChoir(f * 1.0019, len, t60 * 0.9, damp * 1.15, 0.065, fc * 1.15), dl = Math.floor(0.0045 * SR); for (let i = dl; i < n; i++) x[i] += 0.85 * y[i - dl]; }
  norm(x, 1);
  burst(x, 0, 0.0016, 2200, 9500, kind === 2 ? 0.2 : 0.34, 301 + m + kind * 50);                 // the chiff of the quill
  if (kind === 0) burst(x, 0.0045, 0.0016, 2500, 10000, 0.24, 351 + m);
  burst(x, 0, 0.009, 140, 700, 0.1, 401 + m);                                                    // the key and the jack
  return norm(fadeEnd(body(x, bqBODY, 0.5), 0.12), 0.85);
}
// a held tone as padTone makes it, in a loop half as long (half the memory): enough for one player's steady tone
function bqTone(f0, amp, bw, seed, floor) {
  const N = 32768, re = new Float64Array(N), im = new Float64Array(N), mag = new Float64Array(N / 2), hz = SR / N, r = RNG(seed);
  for (let n = 1; n * f0 < 15000; n++) { const f = n * f0, a = amp(n, f); if (a < 1e-5) continue; const sg = Math.max(0.6, (Math.pow(2, bw / 1200) - 1) * f / hz), c = f / hz, lo = Math.max(1, Math.floor(c - 3 * sg)), hi = Math.min(N / 2 - 1, Math.ceil(c + 3 * sg)); for (let k = lo; k <= hi; k++) { const x = (k - c) / sg; mag[k] += a * 0.33 * Math.exp(-0.5 * x * x) / Math.sqrt(sg); } mag[Math.round(c)] += a * 1.5; }
  if (floor) for (let k = Math.floor(80 / hz); k < N / 2; k++) mag[k] += floor(k * hz) * 0.7;
  for (let k = 1; k < N / 2; k++) { const p = r() * 2 * Math.PI; re[k] = mag[k] * Math.cos(p); im[k] = mag[k] * Math.sin(p); }
  fftInv(re, im); const out = new Float32Array(N); let s = 0; for (let i = 0; i < N; i++) { out[i] = re[i]; s += re[i] * re[i]; } const k = 0.16 / Math.sqrt(s / N || 1); for (let i = 0; i < N; i++) out[i] *= k; return out;
}
Object.assign(INST, {
  bq_h88:  { lo: 33, hi: 93, gen: m => bqHarp(m, 0) },
  bq_h4:   { lo: 45, hi: 102, gen: m => bqHarp(m, 1) },
  bq_lute: { lo: 33, hi: 90, gen: m => bqHarp(m, 2) },
  // the jack falling back: the damper touches the string, wood knocks softly
  bq_jack: { rr: 3, fix: 60, gen: () => { const x = modal([[205, 1, 0.03], [470, 0.6, 0.02], [930, 0.35, 0.012]], 0.09); burst(x, 0, 0.003, 1800, 6500, 0.6, 451); return norm(x, 0.6); } },
  // a chamber organ: stopped wooden flutes (odd harmonics, breath, a little of the octave)
  bq_fl:   { loop: 1, lo: 36, hi: 84, gen: m => bqTone(mf(m), (n, f) => (n % 2 ? Math.pow(n, -1.7) : 0.06 / n) * (n === 3 ? 1.6 : 1) / (1 + Math.pow(f / 3800, 2)), 3, 501 + m, f => 0.0035 * bump(f, 2800, 2600, 1)) },
  // a baroque oboe: reedy, two formants, little vibrato
  bq_ob:   { loop: 1, lo: 57, hi: 87, gen: m => bqTone(mf(m), (n, f) => Math.pow(n, -0.55) * (0.12 + bump(f, 560, 240, 0.45) + bump(f, 1180, 330, 1) + bump(f, 2950, 620, 0.5)) / (1 + Math.pow(f / 6200, 3)), 5, 521 + m, f => 0.0012 * bump(f, 4200, 3200, 1)) },
  // a few violins on gut strings
  bq_vn:   { loop: 1, lo: 55, hi: 91, gen: m => padTone(mf(m), (n, f) => Math.pow(n, -1.0) * (0.14 + bump(f, 290, 110, 0.5) + bump(f, 520, 170, 0.9) + bump(f, 1250, 420, 0.8) + bump(f, 2900, 950, 0.9) + bump(f, 4400, 1300, 0.35)) / (1 + Math.pow(f / 9000, 2)), 11, 541 + m, f => 0.0024 * bump(f, 6000, 4500, 1)) },
  // a natural trumpet in D
  bq_tp:   { loop: 1, lo: 57, hi: 87, gen: m => bqTone(mf(m), (n, f) => (1 + bump(f, 1250, 520, 1.3) + bump(f, 2700, 900, 0.6)) / (1 + Math.pow(f / 1500, 2.3)), 4, 561 + m, f => 0.0009 * bump(f, 3500, 3000, 1)) },
  // baroque timpani: small drums, hard sticks
  bq_timp: { rr: 2, lo: 45, hi: 51, gen: m => { const f = mf(m), x = modal([[f, 1, 1.3], [f * 1.5, 0.7, 0.9], [f * 1.98, 0.5, 0.6], [f * 2.44, 0.3, 0.4], [f * 2.91, 0.2, 0.3], [f * 3.4, 0.12, 0.2], [f * 0.63, 0.3, 0.12]], 1.5); burst(x, 0, 0.022, 50, 380, 1.2, 581 + m); burst(x, 0, 0.008, 1200, 6000, 0.4, 582 + m); return norm(fadeEnd(x, 0.2), 0.9); } }
});
// ---- notes and scales ----
const bqLad = {};
function bqNotes(pcs) { const key = pcs.join(','); if (!bqLad[key]) { const a = []; for (let m = 24; m <= 108; m++) if (pcs.indexOf(m % 12) >= 0) a.push(m); bqLad[key] = a; } return bqLad[key]; }
function bqIdx(a, m) { let bi = 0, bd = 99; for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - m); if (d < bd) { bd = d; bi = i; } } return bi; }
const bqMAJ = [1, 2, 4, 6, 7, 9, 11], bqMIX = [0, 2, 4, 6, 7, 9, 11];                               // D major; with C natural under C and D7
const bqScale = name => name === 'bqC' || name === 'bqD7' ? bqMIX : bqMAJ;
const bqStepN = (m, k, sc) => { const a = bqNotes(sc); return a[clamp(bqIdx(a, m) + k, 0, a.length - 1)]; };
const bqPcs = ch => { const a = [ch.r % 12]; ch.n.forEach(x => { if (a.indexOf(x % 12) < 0) a.push(x % 12); }); return a; };
// one harpsichord note. reg 0 the lute stop, 1 the two 8-foot choirs, 2 with the 4-foot. No touch: every note as loud as the next.
function bqH(E, dst, m, t, du, reg, g, jack) {
  if (reg === 0) { Sm(E, dst, { i: 'bq_lute', m, t, g: g * 2.5, dur: Math.max(du, 0.15), r: 0.08 }); return; }
  Sm(E, dst, { i: 'bq_h88', m, t, g, dur: du, r: 0.05 });
  if (reg >= 2 && m <= 88) Sm(E, dst, { i: 'bq_h4', m: m + 12, t: t + 0.003, g: g * 0.55, dur: du, r: 0.05 });
  if (jack) Sm(E, dst, { i: 'bq_jack', t: t + du, g: g * 0.16 });
}
// the harpsichord as the player hears it: bass strings to the left, treble to the right (one fixed pair of filters on the bus, no node per note)
function bqSpread(E, dk, k) {
  const c = E.c, i = E.G(1), o = E.G(1); if (!c.createIIRFilter || !c.createStereoPanner) { i.connect(o); return { i, o }; }
  const a = 1 - Math.exp(-2 * Math.PI * 440 / c.sampleRate), lp = c.createIIRFilter([a], [1, a - 1]), neg = E.G(-1), hi = E.G(1), pl = c.createStereoPanner(), pr = c.createStereoPanner();
  pl.pan.value = -0.65; pr.pan.value = 0.5; i.connect(lp); lp.connect(pl); i.connect(hi); lp.connect(neg); neg.connect(hi); hi.connect(pr); pl.connect(o); pr.connect(o); return { i, o };
}
// a rolled chord
const bqRoll = (E, dst, ms, t, du, reg, g, gap) => ms.forEach((m, i) => bqH(E, dst, m, t + i * (gap || 0.014), du, reg, g, i === ms.length - 1));
const bqBow = (E, dst, i, m, t, du, g, o) => Sm(E, dst, Object.assign({ i, m, t, g, dur: du, a: 0.05, r: 0.14 }, o || {}));
// ---- the bass line: k notes from the root of this chord that walk by step into the root of the next one ----
const bqPRE = { 0: [], 1: [0], 2: [0, 2], 3: [0, 1, 2], 4: [0, 1, 2, 0], 5: [0, 1, 2, 0, 2], 6: [0, 1, 2, 3, 4, 2], 7: [0, 1, 2, 3, 4, 2, 0] };
function bqWalk(r0, nr, k, pcs, sc, r) {
  const sl = bqNotes(sc), i0 = bqIdx(sl, r0); let best = null, bs = -99;
  for (let o = -24; o <= 24; o += 12) { const tg = nr + o; if (tg < 33 || tg > 57) continue;
    let lo = 0; while (lo + 1 < sl.length && sl[lo + 1] < tg) lo++; let hi = lo + 1; while (sl[hi] <= tg) hi++;
    for (let side = -1; side <= 1; side += 2) for (let m = k; m >= 1; m--) {
      const run = []; for (let j = 0; j < m; j++) run.push(side < 0 ? sl[lo - m + 1 + j] : sl[hi + m - 1 - j]);
      const p = k - m, pre = bqPRE[p].map(x => sl[i0 + x]), st = run[0], from = p ? pre[p - 1] : st, leap = Math.abs(st - from);
      if (p === 0 && st !== r0) continue; if (p > 0 && pcs.indexOf(st % 12) < 0) continue; if (leap > 12 || st < 31 || st > 59 || (p > 0 && leap < 1)) continue;
      const sc2 = m * 2 - leap * 0.2 - Math.abs(tg - r0) * 0.05 + r() * 1.2; if (sc2 > bs) { bs = sc2; best = pre.concat(run); }
    } }
  return best || [0, 2, 4, 2, 0, 2, 4, 7].slice(0, k).map(x => sl[i0 + x]);
}
// ---- the right hand: broken-chord figures. c: steps of the chord, s: steps of the scale from a chord note, p: a pedal note above against a scale ----
const bqF16 = [['c', [0, 1, 2, 3, 2, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1]], ['s', [0, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 3, 4, 2, 3, 1]], ['p', [-1, -2, -3, -4, -3, -2, -1, -2]], ['c', [3, 2, 1, 0, 4, 3, 2, 1, 5, 4, 3, 2, 4, 3, 2, 1]],
  ['s', [0, 1, 2, 3, 4, 5, 4, 3, 2, 3, 4, 5, 4, 3, 2, 1]], ['c', [0, 2, 1, 2, 3, 2, 1, 2, 0, 2, 1, 2, 3, 4, 3, 2]], ['p', [-2, -1, -2, -3, -4, -3, -2, -1]], ['s', [4, 3, 2, 1, 0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 2]]];
const bqF8 = [['c', [0, 2, 3, 2, 1, 2, 3, 2]], ['c', [0, 1, 2, 3, 4, 3, 2, 1]], ['c', [2, 0, 1, 2, 3, 1, 2, 3]], ['s', [0, 1, 2, 0, 4, 3, 2, 1]], ['c', [0, 2, 1, 3, 2, 4, 3, 1]], ['s', [0, 2, 4, 2, 7, 6, 4, 2]]];
function bqFig(pt, ch, name, base) {
  const pcs = bqPcs(ch), cl = bqNotes(pcs), sl = bqNotes(bqScale(name)), c0 = bqIdx(cl, base), top = cl.length - 1;
  if (pt[0] === 'c') return pt[1].map(k => cl[clamp(c0 + k, 0, top)]);
  if (pt[0] === 's') { const rl = bqNotes([ch.r % 12]), s0 = bqIdx(sl, rl[bqIdx(rl, base)]); return pt[1].map(k => sl[clamp(s0 + k, 0, sl.length - 1)]); }
  const ped = cl[Math.min(c0 + 3, top)], p0 = bqIdx(sl, ped), out = []; pt[1].forEach(k => { out.push(sl[p0 + k], ped); }); return out;
}
// ---- a bar ----
const bqMem = { slow: 0.2 };   // the slow heat when the last bar was written: a chain that starts hot steps further back (see trim)
function bqPlay(E, dk, t, b, ch, name) {
  if (dk.state === 'plan') bqMem.slow = E.slow;
  const s = dk.sec, r = dk.rng, S_ = dk.S, L = dk.L, I = E.I, sp = dk.spu, w = E.w(), at = u => t + u * sp, bar = 16 * sp, state = dk.state;
  const st = dk.drum || S_.drum, chain = E.state === 'chain' && state === 'plan', sg = chain ? E.sg : 0, peak = st === 'heavy';
  const last = b === s.len - 1, sting = s.type === 'S', intro = s.type === 'I', quietEnd = state === 'lost' || state === 'runlost';
  const H = quietEnd ? L.pad.in : L.arp.in, hk = quietEnd ? dk.mix.arp / dk.mix.pad : 1, B = L.bass.in, P = L.pad.in, X = L.vox.in, O = L.bell.in, D = L.drums.in;
  const cad = !sting && !intro && !chain && b === s.len - 2 && name === 'bqA7', fin = !sting && !intro && !chain && last && name === 'bqD';
  const brk = s.brk && b < 4 && !chain, tutti = !brk && !intro, pcs = bqPcs(ch), sc = bqScale(name), cl = bqNotes(pcs), sl = bqNotes(sc);
  let reg = I < 0.32 ? 0 : I < 0.76 ? 1 : 2;
  dk.bq = { b, name, cad, chain, sting, t };
  if (E.seed >= 990000 && E.seed < 990010) { if (dk.bar < 10) bqH(E, L.arp.in, 36 + dk.bar * 6, t + 0.2, 12 * sp, E.seed - 990000, 0.5, true); return; }   // TESTHOOK
  const tuneBar = s.tune && s.tune[b], tuneOn = !!tuneBar && on(dk, 'lead');
  // ---- an ending that lost: after the deceptive cadence only a slow broken chord now and then ----
  if (state === 'lost') {
    if (sting) { const bm = [40, 45, 47, 47][b]; if (b < 3) { bqH(E, H, bm + 12, t, bar * 0.9, 0, 0.5 * hk, true); bqBow(E, B, 'cello', bm, t, bar * (b === 2 ? 1.5 : 0.92), b === 2 ? 0.34 : 0.42, { a: 0.12, r: 0.5, pan: 0.2 }); }
      if (b < 2) bqFig(bqF8[b], ch, name, 59).forEach((m, i) => bqH(E, H, m, at(i * 2), sp * 5, 0, 0.42 * hk)); else if (b === 2) bqRoll(E, H, [59, 62, 66, 71], t, bar * 1.2, 0, 0.44 * hk, 0.05); }
    else if (b % 2 === 0) bqFig(bqF8[(s.av + b) % 3], ch, name, 59).slice(0, 4).forEach((m, i) => bqH(E, H, m, at(i * 4), sp * 9, 0, 0.3 * hk));
    return;
  }
  // ---- late rounds: a coupler slams in; the hands get out of step for a beat; the sequence overshoots ----
  const mis = w > 0.2 && !quietEnd && !sting && !intro, slam = mis && I > 0.4 && b % 2 === 0 && r.chance(0.28 * w), slip = mis && r.chance(0.3 * w) ? 4 * (1 + r.i(3)) : -1, over = mis && (b === 5 || chain) && r.chance(0.45 * w);
  if (slam) { reg = 2; Sm(E, H, { i: 'bq_jack', t: t - 0.02, g: 1.1 }); bqRoll(E, H, [ch.r + 12, ch.n[0], ch.n[1], ch.n[2], ch.n[0] + 12], t, sp * 5, 2, 0.4, 0.008); }
  // ---- the bass: continuo ----
  const r0 = ch.r < 36 ? ch.r + 12 : ch.r, pedal = (s.type === 'C' || s.pedal) && !chain && !sting && !cad && !fin && !peak;
  const nxRoot = CH[last ? (s.type === 'S' ? 'bqD' : s.prog[0]) : s.prog[b + 1]].r;
  const hold2 = sting && (state === 'won' || state === 'runwon') && b >= 2;
  const k = sting ? (hold2 ? 1 : 2) : chain || peak ? 8 : state === 'runlost' ? 2 : I < 0.32 ? 2 : I < 0.5 || pedal ? 4 : 8, slot = 16 / k;
  let bn;
  if (sting) bn = hold2 ? [38] : name === 'bqA7' ? [45, 33] : [r0, r0 + (name === 'bqG' ? 2 : 0)];
  else if (chain) bn = [0, 1, 2, 3, 4, 5, 6, 7].map(i => r0 + (sg > 0.3 && i % 2 ? 12 : 0) - (r0 + 12 > 55 && sg > 0.3 && i % 2 ? 24 : 0));
  else if (pedal) bn = k === 2 ? [38, 38] : [38, 38, 38, 38];
  else if (cad) bn = k === 2 ? [45, 33] : k === 4 ? [43, 45, 45, 33] : r.chance(0.5) ? [42, 43, 45, 43, 45, 45, 33, 33] : [43, 42, 40, 43, 45, 45, 33, 33];
  else if (fin) bn = k === 2 ? [38, 33] : k === 4 ? [38, 37, 35, 33] : r.chance(0.5) ? [38, 40, 42, 43, 45, 43, 42, 40] : [50, 49, 47, 45, 43, 42, 40, 38];
  else bn = bqWalk(r0, nxRoot, k, pcs, sc, r);
  const celloOn = tutti && (I >= 0.36 || quietEnd || state === 'won'), violone = tutti && I >= 0.5 && !quietEnd && E.seed !== 990020;   // TESTHOOK
  bn.forEach((m, i) => { const u = i * slot, du = slot * sp * (hold2 ? 2 : 1), sl8 = slip >= 0 && u >= slip && u < slip + 4 ? sp * 0.5 : 0;
    if (hold2 && b === 3) return;
    bqH(E, H, reg === 0 && m < 38 ? m + 12 : m, at(u) + sl8, du * 1.02, Math.min(reg, 1), 0.5 * hk, k <= 4);
    if (pedal && celloOn) { if (i === 0) bqBow(E, B, 'cello', 38, t, bar * 0.99, 0.45 + 0.3 * I, { a: 0.08, r: 0.2 }); }
    else if (celloOn) { const cm = m < 36 ? m + 12 : m, cg = (chain ? 0.5 + 0.2 * sg : peak ? 0.75 : 0.45 + 0.3 * I) * (i % (k / 2) === 0 ? 1 : 0.85); Sm(E, B, { i: 'bow', t: at(u), g: cg * 0.22 }); bqBow(E, B, 'cello', cm, at(u), du * (chain || peak ? 0.82 : 0.97), cg, { a: 0.035, r: 0.12 }); }
    if (violone && !(pedal && i > 0) && (k <= 4 || i % 2 === 0 || chain || peak)) bqBow(E, B, 'basses', m - 12 < 26 ? m : m - 12, at(u), du * (chain || peak ? 0.85 : k === 8 ? 1.9 : 0.97), 0.4 + 0.2 * I, { a: 0.05, r: 0.15 });
  });
  // ---- the right hand ----
  let lev = I < 0.32 ? 0 : 1; if (chain) lev += 1 + (sg > 0.42 ? 1 : 0); if (peak) lev = 1; lev = Math.min(lev, 3);
  if (state === 'runlost' || state === 'pick') lev = 0;
  const climb = chain ? Math.min(5, Math.floor((E.stepN || 0) * 0.45)) : 0, base = 62 + (r.i(3) - 1) * 2 + (s.type === 'B' ? 2 : 0) + (tuneOn ? -2 : 3), hg = 0.5 * hk;
  if (sting && !quietEnd) {
    if (b < 2) bqFig(bqF16[b ? 3 : 0], ch, name, 64).forEach((m, i) => bqH(E, H, m, at(i), sp * 2.6, reg, hg));
    if (b === 2) { bqRoll(E, H, [50, 57, 62, 66, 69, 74, 78], t, bar * 1.9, reg, hg * 0.9, 0.022); }
    if (b === 0 || b === 1) bqRoll(E, H, ch.n, t, sp * 7, reg, hg * 0.8);
  } else if (lev >= 2) {
    const n = lev === 2 ? 24 : 32, per = lev === 2 ? 6 : 8, wv = per === 6 ? [0, 1, 2, 3, 2, 1] : [0, 1, 2, 3, 4, 3, 2, 1], c0 = bqIdx(cl, 59) + climb, tir = (s.av + b) % 3 === 0, s0 = bqIdx(sl, cl[c0]);
    for (let i = 0; i < n; i++) { const beat = Math.floor(i / per), ov = over && i >= n / 2 ? 1 : 0, m = tir ? sl[clamp(s0 + (i % per) + (beat % 2) * 2 + ov, 0, sl.length - 1)] : cl[clamp(c0 + wv[i % per] + (beat % 2) + ov, 0, cl.length - 1)];
      bqH(E, H, m > 91 ? m - 12 : m, t + i * bar / n, bar / n * 1.7, reg, hg * 0.92); }
  } else if (lev === 1) {
    const pi = s.type === 'C' ? [2, 6, 2, 5][(s.av + (b >> 1)) % 4] : s.type === 'B' ? [1, 3, 4, 7, 0, 5][s.av] : [0, 5, 3, 4, 1, 7, 2][(s.av + (b >> 1) + (r.chance(0.2) ? 1 : 0)) % 7];
    const notes = bqFig(bqF16[cad && !peak ? 4 : pi], ch, name, base + climb * 3), stop = fin ? 8 : brk && b === 3 ? 12 : 16;
    for (let u = 0; u < stop; u++) { let m = notes[u]; if (over && u >= 12) m = bqStepN(m, -1, sc); if (m > 91) m -= 12; const sl8 = slip >= 0 && u >= slip && u < slip + 4 ? -sp * 0.5 : 0;
      if (u % 4 === 0 && u > 0 && r.chance(0.07 + 0.2 * w)) { bqH(E, H, bqStepN(m, 1, sc), at(u) + sl8, sp * 0.5, reg, hg); bqH(E, H, m, at(u + 0.5) + sl8, sp * 2, reg, hg); }   // a short appoggiatura on a beat
      else bqH(E, H, m, at(u) + sl8, sp * 2.4, reg, hg); }
    if (fin) bqRoll(E, H, [ch.n[1], ch.n[2], ch.n[0] + 12, ch.n[1] + 12], at(8), sp * 7, reg, hg * 0.9, 0.02);
  } else {
    const pt = bqF8[(s.av + (b >> 1) + (r.chance(0.25) ? 1 : 0)) % 6], notes = bqFig(pt, ch, name, base - 1), thin = state === 'bench' && b % 2 === 1;
    for (let i = 0; i < (fin ? 5 : 8); i++) { if (thin && i > 4 && r.chance(0.6)) continue; bqH(E, H, notes[i], at(i * 2), sp * (fin && i === 4 ? 7 : 5.5), reg, hg); }
  }
  // the left hand's chords: rolled, held
  if (!sting && reg >= 1 && lev <= 1) {
    const cn = [ch.n[0], ch.n[1], ch.n[2]];
    if (peak) [0, 4, 8, 12].forEach(u => { bqRoll(E, H, cn, at(u), sp * 3.4, 1, 0.42, 0.009); bqH(E, H, ch.n[0] + 12, at(u) + 0.027, sp * 3.4, 2, 0.42); });
    else { bqRoll(E, H, cn, t, sp * 7, reg, 0.42 * hk); if (I > 0.5 || cad) bqRoll(E, H, cad ? [57, 61, 64, 67] : cn, at(8), sp * 7, reg, 0.42 * hk); }
  }
  if (chain && reg >= 1) bqRoll(E, H, [ch.n[0], ch.n[1], ch.n[2]], t, sp * 6, reg, 0.4);
  // ---- the organ ----
  if (state === 'bench' || (pedal && I >= 0.3 && tutti)) [50, 57].forEach((m, i) => bqBow(E, P, 'bq_fl', m, t, bar * 0.99, 0.3, { a: 0.12, r: 0.3 }));
  if (tutti && !quietEnd && (I >= 0.45 || hold2)) {
    const du = hold2 ? bar * 1.9 : bar * 0.98; if (!(hold2 && b === 3) && !peak) [ch.r + 12, ch.n[0], ch.n[1], ch.n[2]].forEach((m, i) => bqBow(E, P, 'bq_fl', m, t, du, 0.3 + 0.15 * I, { a: 0.05, r: 0.16 }));
    if (peak || (chain && sg > 0.7)) [ch.r + 12, ch.n[0], ch.n[2], ch.n[1] + 12].forEach((m, i) => bqBow(E, P, 'organ', m, t, bar * 0.98, peak ? 0.36 : 0.18, { a: 0.03, r: 0.1 }));
  }
  // ---- the violins ----
  const sv = [ch.n[0], ch.n[1], ch.n[2], ch.n[0] + 12].map(m => m < 59 ? m + 12 : m).sort((a, b2) => a - b2), strOn = tutti && !quietEnd && reg > 0 && (I >= 0.55 || (sting && state !== 'lost'));
  if (strOn || (chain && tutti && I > 0.42 && sg > 0.2)) {
    if (chain) sv.slice(1).forEach((m, i) => bqBow(E, X, 'bq_vn', m + (sg > 0.6 ? 12 : 0), t, bar * 0.99, 0.3 + 0.35 * sg, { a: 0.03, r: 0.1, trem: 12.5, pan: (i - 1) * 0.6 }));
    else if (sting) { if (b < 3) sv.slice(1).forEach((m, i) => bqBow(E, X, 'bq_vn', m + (b === 2 ? 12 : 0), t, b === 2 ? bar * 1.9 : bar * 0.97, 0.5, { a: 0.06, r: 0.3, wide: 0.5, pan: (i - 1) * 0.3 })); }
    else if (peak) { for (let u = 0; u < 16; u++) Sm(E, X, { i: 'bq_vn', m: u % 4 === 2 ? sv[2] : sv[3], t: at(u), g: 0.55, dur: sp * 0.92, a: 0.012, r: 0.04, pan: -0.4 }); for (let u = 0; u < 16; u += 2) Sm(E, X, { i: 'bq_vn', m: sv[u % 4 ? 1 : 2] , t: at(u), g: 0.5, dur: sp * 1.9, a: 0.015, r: 0.05, pan: 0.4 }); }
    else if (I >= 0.75) { for (let u = 0; u < 16; u += 2) { Sm(E, X, { i: 'bq_vn', m: sv[3], t: at(u), g: 0.5, dur: sp * 1.9, a: 0.02, r: 0.05, pan: -0.4 }); Sm(E, X, { i: 'bq_vn', m: sv[u % 4 ? 1 : 2], t: at(u), g: 0.45, dur: sp * 1.9, a: 0.02, r: 0.05, pan: 0.4 }); } }
    else if (s.type === 'B' && !cad && !fin) { if (b % 2 === 0) bqBow(E, X, 'bq_vn', sv[2], t, bar * 1.95, 0.4, { a: 0.1, r: 0.3, wide: 0.5 }); }
    else if (s.type === 'C' && !cad && !fin) sv.slice(2).forEach((m, i) => bqBow(E, X, 'bq_vn', m, t, bar * 0.98, 0.4, { a: 0.1, r: 0.25, wide: 0.5, pan: i ? 0.3 : -0.3 }));
    else [0, 8].forEach(u => sv.slice(1).forEach((m, i) => bqBow(E, X, 'bq_vn', m, at(u), sp * (fin && u === 8 ? 7.6 : 7.4), 0.5, { a: 0.04, r: 0.14, pan: (i - 1) * 0.4 })));
  }
  // ---- the second voice (oboe): in thirds under the tune over the pedal; else the head again a bar later, at the fifth ----
  const prevBar = b > 0 && s.tune ? s.tune[b - 1] : null, ob = (m, tt, du, g, o) => bqBow(E, O, 'bq_ob', m < 58 ? m + 12 : m > 86 ? m - 12 : m, tt, du, g, Object.assign({ a: 0.03, r: 0.09, pan: 0.35, lp: 2600 + 5000 * I }, o || {}));
  if (tutti && !quietEnd && !peak && !sting && !chain && reg > 0) {
    if (s.type === 'C' && tuneOn && I >= 0.36) tuneBar.forEach(x => { let m = bqStepN(x[2], -2, sc); if (x[1] >= 4) { const i2 = bqIdx(cl, m); m = cl[i2] >= x[2] ? cl[i2 - 1] : cl[i2]; } ob(m, at(x[0]), x[1] * sp * 0.95, 0.5); });
    else if (prevBar && I >= 0.58 && b < s.len - 1 && !cad && (b % 2 === 1 || !tuneBar) && r.chance(0.8)) {
      const wrong = w > 0.2 && r.chance(0.5 * w);
      prevBar.forEach(x => { let m = x[2] - 5; const strong = x[0] % 4 === 0 || x[1] >= 4; m = strong ? nearTone(m, ch) : bqStepN(m, 0, sc); if (wrong && x[0] < 8) m = x[2] - 3;                 // in later rounds the answer comes in in the wrong key and puts itself right
        ob(m, at(x[0]), x[1] * sp * 0.94, 0.55); if (I >= 0.75) bqBow(E, O, 'bq_vn', m, at(x[0]), x[1] * sp * 0.94, 0.35, { a: 0.03, r: 0.08, pan: 0.5 }); });
    }
  }
  // ---- trumpets: a fanfare where the tune rests at the peak ----
  if (peak && !tuneBar && !sting) [[0, 2, 74], [2, 1, 74], [3, 1, 74], [4, 2, 78], [6, 2, 74], [8, 3, 81], [11, 1, 78], [12, 4, name === 'bqA7' ? 76 : name === 'bqG' ? 79 : name === 'bqC' ? 76 : 81]].forEach(x => { const m = nearTone(x[2], ch); Sm(E, O, { i: 'bq_tp', m, t: at(x[0]), g: 0.5, dur: x[1] * sp * 0.9, a: 0.02, r: 0.07, lp: 1500, lp1: 9000, lpt: 0.05, pan: -0.35 }); Sm(E, O, { i: 'bq_tp', m: cl[bqIdx(cl, m) - 1], t: at(x[0]), g: 0.36, dur: x[1] * sp * 0.9, a: 0.02, r: 0.07, lp: 1300, lp1: 7000, lpt: 0.05, pan: 0.3 }); });
  // ---- timpani in D and A ----
  const tp = (u, m, g) => Sm(E, D, { i: 'bq_timp', m, t: at(u), g, dur: 0.6, r: 0.25 }), tn = name === 'bqA7' || name === 'bqA' || name === 'bqEm' ? 45 : 50;
  if (st !== 'none' && !quietEnd) {
    if (chain) { if (sg > 0.22 && I > 0.42) { const n = sg > 0.55 ? 32 : 16; for (let i = 0; i < n; i++) Sm(E, D, { i: 'bq_timp', m: E.cix >= 2 ? 45 : 50, t: t + i * bar / n, g: (0.05 + 0.3 * sg) * (0.75 + 0.25 * i / n) * (i % (n / 4) === 0 ? 1.3 : 1), dur: 0.14, r: 0.12 }); } }
    else if (peak) { if (last || cad) { pat('x...x...', u => tp(u, tn, 0.6)); for (let u = 8; u < 16; u++) tp(u, tn, 0.2 + 0.05 * (u - 8)); }
      else pat(['D...D.DDA...A.AA', 'D..DD...A..AA...', 'D.DDA.AAD.DDA...'][(s.dv + b) % 3], (u, c) => tp(u, name === 'bqD' || name === 'bqD7' ? (c === 'D' ? 50 : 45) : tn, u % 4 === 0 ? 0.62 : 0.4)); }
    else if (st === 'main' && tutti && !intro) { if (cad) pat('x.......x...x.xx', u => tp(u, 45, u >= 12 ? 0.3 : 0.4)); else if (fin || (b === 0 && s.type === 'A')) tp(0, 50, 0.5); }
    else if (sting && state === 'won' && b === 2) tp(0, 50, 0.4);
    if (sting && state === 'runwon') { if (b === 1) for (let u = 0; u < 16; u++) tp(u, 45, 0.2 + 0.03 * u); else pat(b === 0 ? 'x..xx.x.x...x.xx' : 'x...............', u => tp(u, 50, 0.6)); }
  }
}
// ---- one note of the tune ----
function bqLead(E, dk, t, du, m, g, mode) {
  const I = E.I, L = dk.L.lead.in, O = dk.L.bell.in, sp = dk.spu, w = E.w(), q = dk.bq || {}, r = dk.rng, sc = bqScale(q.name), l16 = du / sp;
  while (m > 88) m -= 12;
  const grace = du < 0.1 && g < 0.9, hot = (dk.drum || dk.S.drum) === 'heavy', reg = mode === 'low' || I < 0.32 ? 0 : I < 0.76 ? 1 : 2;
  if (mode === 'low') { bqH(E, L, m, t, du * 1.1, 0, g * 0.8, !grace); if (!grace) bqBow(E, L, 'cello', m - 12 < 43 ? m : m - 12, t, du * 0.95, g * 0.4, { a: 0.1, r: 0.25, pan: 0.2 }); return; }
  // ornaments on the long notes: a real trill at the cadence (from the note above, about twelve notes a second), a mordent elsewhere; in later rounds they multiply
  let orn = 0, whole = false;
  if (!grace) { if (q.name === 'bqA7' && l16 >= 4.5 && (q.cad || q.sting)) orn = 2; else if (l16 >= 3.5 && r.chance(0.3 + 0.3 * w)) orn = 1; if (w > 0.2 && l16 >= 2 && r.chance(0.32 * w)) { orn = 2; whole = true; } }
  const rate = 12 + 2 * w, up = bqStepN(m, 1, sc), dn = bqStepN(m, -1, sc), hg = g * 0.5 * (hot ? 0.85 : 1), nT = orn === 2 ? Math.max(4, Math.floor(du * (whole ? 1 : 0.78) * rate / 2) * 2) : 0;
  let tm = t, dm = du;
  if (orn === 2) { for (let k = 0; k < nT; k++) bqH(E, L, k % 2 ? m : up, t + k / rate, 1.25 / rate, reg, hg * 0.92); tm = t + nT / rate; dm = du - nT / rate; }
  else if (orn === 1) { bqH(E, L, m, t, 0.07, reg, hg); bqH(E, L, dn, t + 0.072, 0.07, reg, hg); tm = t + 0.144; dm = du - 0.144; }
  if (dm > 0.05) bqH(E, L, m, tm, Math.max(dm * 1.08, 0.1), reg, hg, dm > 0.25);
  if (grace) return;
  if (hot) {                                                                                         // trumpets on the tune, violins with them
    const tm2 = m > 86 ? m - 12 : m, crack = w > 0.25 && tm2 >= 79 && l16 >= 2 && r.chance(0.3 * w), cl = bqNotes(bqPcs(CH[q.name] || CH.bqD)), t0 = crack ? t + 0.075 : t;
    if (crack) Sm(E, O, { i: 'bq_tp', m: tm2 + (r.chance(0.5) ? 2 : -3), t, g: g * 0.5, dur: 0.07, a: 0.01, r: 0.03, lp: 5000, pan: -0.35 });   // a cracked note: the wrong partial for an instant
    Sm(E, O, { i: 'bq_tp', m: tm2, t: t0, g: g * 0.62, dur: du * 0.92 - (t0 - t), a: 0.022, r: 0.08, lp: 1500, lp1: 9500, lpt: 0.05, pan: -0.35 });
    if (l16 >= 3) Sm(E, O, { i: 'bq_tp', m: cl[Math.max(0, bqIdx(cl, tm2 - 2) - (cl[bqIdx(cl, tm2 - 2)] >= tm2 ? 1 : 0))], t, g: g * 0.42, dur: du * 0.92, a: 0.022, r: 0.08, lp: 1300, lp1: 7500, lpt: 0.05, pan: 0.3 });
    bqBow(E, L, 'bq_vn', m, t, du * 0.95, g * 0.6, { a: 0.03, r: 0.08, pan: 0.45 });
    return;
  }
  // the oboe has the tune while the band is small; when the violins come in they take it and the oboe is free to answer
  if (I >= 0.3 && I < 0.58) { const og = g * (0.4 + 0.5 * clamp((I - 0.3) / 0.28, 0, 1)), oo = { a: 0.03, r: 0.09, pan: -0.25, lp: 2400 + 6000 * I, vib: l16 >= 6 ? 5 : 0 };
    if (orn === 2) { for (let k = 0; k < nT; k++) bqBow(E, L, 'bq_ob', k % 2 ? m : up, t + k / rate, 1 / rate, og, { a: 0.012, r: 0.03, pan: -0.25, lp: 2400 + 6000 * I }); if (dm > 0.05) bqBow(E, L, 'bq_ob', m, tm, dm * 0.95, og, oo); }
    else bqBow(E, L, 'bq_ob', m, t, du * 0.96, og, oo); }
  else if (I >= 0.58) bqBow(E, L, 'bq_vn', m, t, du * 0.96, g * 0.55, { a: 0.035, r: 0.1, wide: 0.45 });
}
// ---- a step of a chain: one climbing note on the harpsichord with the hit; a new chord is stated (root in the bass, a rolled chord) ----
function bqStep(E, dk, t, n) {
  const ch = dk.curCh || CH[TH[E.th].chain[E.cix]], m = nearTone(64 + Math.min(n, 14) * 1.5, ch), H = dk.L.arp.in, reg = E.I < 0.32 ? 0 : 2;
  bqH(E, H, m, t, 0.5, reg, 0.4, true);
  if (n > 1 && (n - 1) % 3 === 0) { const r0 = ch.r < 36 ? ch.r + 12 : ch.r; bqRoll(E, H, [r0, ch.n[0], ch.n[1], ch.n[2]], t, 0.6, reg ? 1 : 0, 0.32, 0.01); if (E.I >= 0.36) bqBow(E, dk.L.bass.in, 'cello', r0, t, 0.4, 0.45, { a: 0.03, r: 0.15 }); }
  if (n >= 6 && E.I > 0.42) Sm(E, dk.L.drums.in, { i: 'bq_timp', m: E.cix >= 2 ? 45 : 50, t, g: 0.16 + 0.02 * Math.min(n - 6, 8), dur: 0.5, r: 0.25 });
}
// ---- the hit that opens the peak; the run into a bar line (a tirata: a scale rushing up into the downbeat) ----
function bqEnter(E, state, t, dk) {
  if (state !== 'overreact' && state !== 'runwon') return;
  Sm(E, E.fx, { i: 'bq_timp', m: 50, t, g: 0.3 }); [38, 57, 66, 74].forEach((m, i) => { Sm(E, E.fx, { i: 'bq_h88', m, t: t + i * 0.008, g: 0.12, dur: 0.9, r: 0.15 }); if (m > 60) Sm(E, E.fx, { i: 'bq_h4', m: m + 12, t: t + i * 0.008, g: 0.06, dur: 0.9, r: 0.15 }); });
}
function bqRollIn(E, t, tb) {
  const k = clamp(Math.round((tb - t) / 0.1), 3, 8), sl = bqNotes(bqMAJ), top = bqIdx(sl, 73), lute = E.I < 0.32, old = E.deck;
  if (old && old.gs && old.sg0 && !old.dead) old.gs.forEach(g => g.gain.setTargetAtTime(old.sg0 * 0.4, t, (tb - t) / 2.5));                          // a diminuendo: the bar being left bows out under the run
  for (let i = 0; i < k; i++) Sm(E, E.fx, { i: lute ? 'bq_lute' : 'bq_h88', m: sl[top - (k - 1 - i)], t: tb - (k - i) * (tb - t) / (k + 0.5), g: 0.05 + 0.03 * i / k, dur: 0.3, r: 0.08, pan: 0.1 });
}
TRACK(11, 'baroque', {
  name: 'Harpsichord unhinged', line: 'a baroque band in D: harpsichord, cello, organ, violins and oboe in tidy counterpoint that runs off the rails; trumpets and drums for the blow-up',
  why: 'the game is alchemy as much as chemistry, and nothing shows order turning into chaos like strict counterpoint coming apart',
  bpm: [96, 116], scale: [0, 2, 4, 5, 7, 9, 11], chain: ['bqD', 'bqG', 'bqC', 'bqA7'],
  prog: { A: ['bqD', 'bqG', 'bqA7', 'bqD', 'bqBm', 'bqEm', 'bqA7', 'bqD'], B: ['bqBm', 'bqEm', 'bqA7', 'bqD', 'bqG', 'bqC', 'bqA7', 'bqD'], C: ['bqD', 'bqG', 'bqD', 'bqA7', 'bqG', 'bqD', 'bqA7', 'bqD'] },
  alt: { A: { 5: 'bqG' }, B: { 3: 'bqD7' }, C: { 1: 'bqEm' } }, forms: ['AABA', 'ABAC', 'ABCB', 'ACAB'],
  tune: {
    // A, the subject: a rising triad, a turn on the sixth and a stepwise fall (two bars); the same a step lower; spun on in a shorter figure; a cadence with a trill
    A: [[[0, 2, 74], [2, 2, 78], [4, 4, 81], [8, 2, 83], [10, 1, 81], [11, 1, 79], [12, 2, 78], [14, 2, 81]], [[0, 6, 79], [6, 2, 78], [8, 2, 76], [10, 2, 74], [12, 4, 71]],
        [[0, 2, 73], [2, 2, 76], [4, 4, 79], [8, 2, 81], [10, 1, 79], [11, 1, 78], [12, 2, 76], [14, 2, 79]], [[0, 6, 78], [6, 2, 76], [8, 2, 74], [10, 2, 73], [12, 4, 69]],
        [[0, 2, 83], [2, 1, 81], [3, 1, 79], [4, 2, 78], [6, 2, 74], [8, 2, 78], [10, 1, 76], [11, 1, 74], [12, 4, 71]], [[0, 2, 81], [2, 1, 79], [3, 1, 78], [4, 2, 76], [6, 2, 71], [8, 2, 76], [10, 1, 74], [11, 1, 73], [12, 4, 71]],
        [[0, 2, 79], [2, 2, 78], [4, 2, 76], [6, 2, 73], [8, 6, 76], [14, 2, 74]], [[0, 8, 74]]],
    // B, the episode: a leap of a fourth and a fall by step, two bars, three times, each a step lower, over falling fifths
    B: [[[0, 2, 78], [2, 4, 83], [6, 2, 81], [8, 2, 79], [10, 2, 78], [12, 2, 76], [14, 2, 78]], [[0, 6, 79], [6, 2, 76], [8, 4, 71], [12, 4, 76]],
        [[0, 2, 76], [2, 4, 81], [6, 2, 79], [8, 2, 78], [10, 2, 76], [12, 2, 74], [14, 2, 76]], [[0, 6, 78], [6, 2, 74], [8, 4, 69], [12, 4, 74]],
        [[0, 2, 74], [2, 4, 79], [6, 2, 78], [8, 2, 76], [10, 2, 74], [12, 2, 72], [14, 2, 74]], [[0, 6, 76], [6, 2, 72], [8, 4, 67], [12, 4, 72]],
        [[0, 2, 73], [2, 2, 76], [4, 2, 79], [6, 2, 78], [8, 6, 76], [14, 2, 74]], [[0, 8, 74]]],
    // C, over a held D: a rocking tune in longer notes, the oboe a third under it
    C: [[[0, 4, 81], [4, 2, 78], [6, 2, 81], [8, 4, 86], [12, 4, 81]], [[0, 4, 83], [4, 2, 79], [6, 2, 83], [8, 6, 86], [14, 2, 83]], [[0, 4, 81], [4, 2, 78], [6, 2, 74], [8, 8, 78]], [[0, 4, 76], [4, 2, 73], [6, 2, 76], [8, 4, 79], [12, 4, 76]],
        [[0, 4, 79], [4, 2, 83], [6, 2, 79], [8, 4, 74], [12, 2, 76], [14, 2, 78]], [[0, 4, 81], [4, 2, 78], [6, 2, 74], [8, 4, 78], [12, 4, 81]], [[0, 2, 83], [2, 2, 81], [4, 2, 79], [6, 2, 76], [8, 6, 76], [14, 2, 74]], [[0, 12, 74]]]
  },
  sting: {
    won: { prog: ['bqG', 'bqA7', 'bqD', 'bqD'], tune: [[[0, 4, 79], [4, 4, 83], [8, 8, 86]], [[0, 4, 88], [4, 10, 85], [14, 2, 86]], [[0, 16, 86]], null] },
    lost: { prog: ['bqEm', 'bqA7', 'bqBm', 'bqBm'], tune: [[[0, 4, 79], [4, 4, 76], [8, 8, 74]], [[0, 6, 76], [6, 2, 73], [8, 8, 76]], [[0, 12, 74]], null] },
    runwon: { prog: ['bqD', 'bqA7', 'bqD', 'bqD'], tune: [[[0, 3, 74], [3, 1, 74], [4, 4, 78], [8, 3, 81], [11, 1, 81], [12, 4, 86]], [[0, 4, 88], [4, 4, 86], [8, 6, 85], [14, 2, 86]], [[0, 16, 86]], [[0, 4, 81], [4, 4, 78], [8, 8, 86]]] },
    runlost: { prog: ['bqD', 'bqG', 'bqA7', 'bqBm'], tune: [[[0, 4, 74], [4, 4, 78], [8, 8, 81]], [[0, 8, 79], [8, 4, 76], [12, 4, 74]], [[0, 8, 76], [8, 8, 73]], [[0, 16, 74]]] }
  },
  mix: { drums: 1, bass: 0.8, pad: 1, lead: 1, arp: 1, vox: 1, bell: 1 },
  lay: { drums: { rev: 0.3, dly: 0 }, bass: { rev: 0.1, dly: 0 }, pad: { rev: 0.35, dly: 0, ins: bqSpread }, lead: { rev: 0.24, dly: 0 }, arp: { rev: 0.2, dly: 0, ins: bqSpread }, vox: { rev: 0.38, dly: 0 }, bell: { rev: 0.32, dly: 0 } },
  g: 1.12, sg: { title: 1.3, bench: 1.85, pick: 1.35, shop: 1.5, overreact: 1.07, runwon: 1.07 }, wow: 0, hall: 4.5, leadAt: 0.16, swing: () => (u => u), trim: sg => 0.45 * (1 - 0.1 * sg) * clamp(1.6 - 1.6 * bqMem.slow, 0.5, 1.4),
  play: bqPlay, lead: bqLead, step: bqStep, enter: bqEnter, roll: bqRollIn
});
// TRACK:baroque>>>
// TRACKS>>>
// ---------- the chain bed: held voices that come in with intensity; no beat of its own ----------
// mix per theme: [pad, voices, high strings, noise, sub]
const DMIX = { 1: [1, 0.55, 0.8, 0.8, 1], 2: [0.5, 1.3, 0.6, 0.5, 0.8], 3: [0.35, 0.7, 1.3, 1, 0.6] };
function buildDrone(E, dk) {
  if (E.dry) { dk.dr = null; return; }
  const c = E.c, G = E.G, t0 = dk.t0, mix = DMIX[E.th], D = { voices: [], tune: [] }, dry = dk.gs[0], rev = dk.gs[1];
  const u = E.u(), mk = (m, type, det, dst) => { const o = c.createOscillator(); o.type = type; o.frequency.value = mf(m); o.detune.value = det * (1 + E.w()); o.connect(dst); o.start(t0); dk.ends.push(o); D.tune.push({ o, m, det }); E.nodes++; return o; };
  // pad: fifths through a low-pass that opens, pulsed by a slow wave that speeds up
  D.filt = c.createBiquadFilter(); D.filt.type = 'lowpass'; D.filt.frequency.value = 400; D.filt.Q.value = 1.5; D.trem = G(1); D.padG = G(0); D.filt.connect(D.trem); D.trem.connect(D.padG); D.padG.connect(dry); const pr = G(0.3); D.padG.connect(pr); pr.connect(rev);
  [[50, -9], [50, 8], [57, -6], [57, 7], [62, 0]].forEach(x => mk(x[0], 'sawtooth', x[1], D.filt));
  D.lfo = c.createOscillator(); D.lfo.type = E.th === 1 ? 'square' : 'sine'; D.lfo.frequency.value = 2; D.lfoG = G(0); D.lfo.connect(D.lfoG); D.lfoG.connect(D.trem.gain); D.lfo.start(t0); dk.ends.push(D.lfo);
  // voices: a choir that grows one voice at a time
  const f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), f0 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 520; f1.Q.value = 4; f2.type = 'bandpass'; f2.frequency.value = 980; f2.Q.value = 6; f0.type = 'lowpass'; f0.frequency.value = 260; D.f1 = f1; D.f2 = f2;
  D.voxG = G(mix[1] * 0.5); const b0 = G(0.3); f0.connect(b0); b0.connect(D.voxG); f1.connect(D.voxG); f2.connect(D.voxG); D.voxG.connect(dry); const vr = G(0.6); D.voxG.connect(vr); vr.connect(rev);
  [[50, 0.12], [57, 0.22], [53, 0.36], [62, 0.5], [65, 0.62], [64, 0.76], [69, 0.88]].forEach((x, i) => { const g = G(0); g.connect(f0); g.connect(f1); g.connect(f2); mk(x[0], 'sawtooth', (i % 2 ? 9 : -8), g); mk(x[0], 'sawtooth', (i % 2 ? -5 : 6), g); D.voices.push({ g, th: x[1] }); });
  // high strings: a fifth that shivers; a second a semitone under it joins near the top
  D.hiG = G(0); const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900; D.hiT = G(1); hp.connect(D.hiT); D.hiT.connect(D.hiG); D.hiG.connect(dry); const hr = G(0.5); D.hiG.connect(hr); hr.connect(rev);
  [[81, -10], [81, 9], [86, -7], [86, 8]].forEach(x => mk(x[0], 'sawtooth', x[1], hp)); D.alarm = G(0); D.alarm.connect(hp); mk(85, 'sawtooth', 0, D.alarm); D.tune.pop();
  D.hl = c.createOscillator(); D.hl.frequency.value = 9; const hlg = G(0.45); D.hl.connect(hlg); hlg.connect(D.hiT.gain); D.hl.start(t0); dk.ends.push(D.hl);
  // noise that opens upward, and a little sub
  const ns = c.createBufferSource(); ns.buffer = E.noise; ns.loop = true; D.nf = c.createBiquadFilter(); D.nf.type = 'bandpass'; D.nf.frequency.value = 700; D.nf.Q.value = 0.9; D.nG = G(0); ns.connect(D.nf); D.nf.connect(D.nG); D.nG.connect(dry); ns.start(t0); dk.ends.push(ns);
  D.subG = G(0); D.subG.connect(dry); D.sub = c.createOscillator(); D.sub.frequency.value = mf(50); D.sub.connect(D.subG); D.sub.start(t0); dk.ends.push(D.sub);
  D.one = G(1); D.one.__n = 'lead'; D.one.connect(dry); const orv = G(0.5); D.one.connect(orv); orv.connect(rev); const od = G(0.25); D.one.connect(od); od.connect(dk.gs[2]);
  E.nodes += 40; dk.dr = D;
}
const ramp = (I, th, w) => clamp((I - th) / w, 0, 1);
function droneI(E, dk, I, t, tau) {
  const D = dk.dr; if (!D) return; if (D.three) { drone3I(E, dk, I, t, tau); return; } const mix = DMIX[E.th], k = tau || 0.3, d9 = (E.rnd - 1) / 8;
  D.padG.gain.setTargetAtTime(mix[0] * (0.05 + 0.1 * I), t, k); D.filt.frequency.setTargetAtTime((300 + 2600 * I * I) * (1 - 0.3 * d9), t, k);
  D.lfo.frequency.setTargetAtTime(1.5 + 9 * I, t, k); D.lfoG.gain.setTargetAtTime(0.5 * ramp(I, 0.12, 0.4), t, k);
  D.voices.forEach(v => v.g.gain.setTargetAtTime(0.22 * ramp(I, v.th - 0.1 - 0.3 * d9, 0.12), t, k)); D.f1.frequency.setTargetAtTime(480 + 240 * I, t, k); D.f2.frequency.setTargetAtTime(860 + 320 * I, t, k);
  D.hiG.gain.setTargetAtTime(mix[2] * 0.05 * ramp(I, 0.4, 0.5), t, k); D.hl.frequency.setTargetAtTime(6 + 9 * I, t, k); D.alarm.gain.setTargetAtTime(ramp(I, 0.82 - 0.35 * d9, 0.12) * (0.6 + 0.4 * d9), t, k);
  D.nG.gain.setTargetAtTime(mix[3] * 0.06 * ramp(I, 0.55, 0.45), t, k); D.nf.frequency.setTargetAtTime(600 + 4200 * I, t, k);
  D.subG.gain.setTargetAtTime(mix[4] * 0.1 * ramp(I, 0.25, 0.75), t, k);
}
// the bed moves to the effects' chord
function droneChord(E, dk, ix, t) { const D = dk.dr; if (!D) return; if (D.three) { drone3Chord(E, dk, ix, t); return; } const ch = CH[SFXCH[ix]]; D.tune.forEach(x => x.o.frequency.setTargetAtTime(mf(nearTone(x.m, ch)), t, 0.05)); D.sub.frequency.setTargetAtTime(mf(ch.r + 12), t, 0.05); }
// small things between the steps, written half a second at a time
function droneTick(E, dk, t) {
  const D = dk.dr, I = E.I; if (!D) return; if (D.three) { drone3Tick(E, dk, t); return; }
  if (E.th === 3) { const n = Math.round(2 + 10 * I); for (let i = 0; i < n; i++) I_.tick(E, D.one, t + i * 0.5 / n, 0.035 + 0.05 * I, (i % 3 - 1) * 0.5); }
  if (E.th === 1 && I > 0.3) { const n = I > 0.7 ? 8 : 4; for (let i = 0; i < n; i++) I_.hat(E, D.one, t + i * 0.5 / n, 0.02 + 0.03 * I, false, (i % 2 ? 0.4 : -0.4)); }
  if (E.th === 2 && I > 0.5 && dk.rng.chance(0.5)) I_.shake(E, D.one, t + dk.rng() * 0.4, 0.05, dk.rng() - 0.5);
}
// a step of the chain: the chord follows the effects, and one note of the theme's tune is sung low, bent to the chord
EP.step = function (t, n, of) {
  const E = this, dk = E.deck; n = Math.max(1, Math.round(n) || 1); E.stepN = n; E.stepOf = of > 0 ? Math.max(n, Math.round(of)) : 0;   // of: how many steps this chain has, if the game knows (a track can then time its build to the last hit) E.cix = Math.floor((n - 1) / 3) % 4;
  if (E.gv) { const was = E.cixWas; E.cixWas = E.cix; E.sg = Math.pow(clamp(n / 16, 0, 1), 1.2); E.heat(t, 0.12); if (dk && !dk.S.drone) { if (E.state === 'chain' && was !== undefined && was !== E.cix) E.rechord(t); ((TK[E.th] && TK[E.th].step) || grooveStep)(E, dk, t, n); } return; }
  E.I = clamp(n / 12, 0.08, 1); if (!dk) return; E.setI(dk, E.I, t, 0.2); if (!dk.S.drone || !dk.dr) return;
  droneChord(E, dk, E.cix, t);
  const flat = TH[E.th].tune.A.reduce((a, b) => a.concat(b), []), x = flat[(n - 1) % flat.length], ch = CH[SFXCH[E.cix]], m = nearTone(x[2] - 12, ch), g = 0.1 + 0.12 * E.I;
  if (E.th === 3) drone3Step(E, dk, t, n, m, g);
  else if (E.th === 2) { I_.bell(E, dk.dr.one, t, mf(m + 12), g * 0.9, 2.2, 0.2); chant(E, dk.dr.one, { t, f: mf(m - 12), g: g * 1.3, a: 0.06, h: 0.35, d: 0.5, vow: 0, pan: -0.2 }); }
  else if (E.th === 1) V(E, dk.dr.one, { t, f: mf(m), type: 'sawtooth', det: [-9, 9], g: g * 0.9, a: 0.01, h: 0.2, d: 0.5, lp: 600 + 1800 * E.I, lp1: 400, lpt: 0.5, q: 3, pan: 0.2 });
  else V(E, dk.dr.one, { t, f: mf(m), g: g, a: 0.003, h: 0.1, d: 0.7, pan: -0.2, fm: { r: 2, i: 2.5, i1: 0.3, d: 0.3 } });
};

// ---------- the clock ----------
EP.start = function (state, t) {
  const E = this, key = E.gv && state === 'chain' ? 'plan' : state, S = ST[key], old = E.deck; E.pending = null;
  if (old) E.fadeOut(old, t, E.swapT !== undefined ? 0.07 : S.cut ? S.cut / 3 : Math.max(0.12, old.upb * old.spu / 7 || 0.2)); E.swapT = undefined;
  E.I = S.I; if (E.gv) { E.slow = key === 'plan' ? E.playI : S.I; E.sg = 0; E.I = E.slow; } E.state = state; E.deck = E.mkDeck(key, t + (S.cut ? 0.02 : 0), S.fadeIn || (old && !S.cut ? [0.6, 0.12] : null));
  if (E.gv && state === 'chain') E.chainTrim(t + 0.05, true);
  if (E.gv && TK[E.th] && TK[E.th].enter) { if (!E.dry) TK[E.th].enter(E, state, t + 0.02, E.deck); } else if (state === 'overreact' && !E.dry) { if (E.gv) { Sm(E, E.fx, { i: 'crashC', t: t + 0.02, g: 0.3 }); Sm(E, E.fx, { i: 'kk', t: t + 0.02, g: 0.5 }); } else if (E.th === 3) { Sm(E, E.fx, { i: 'tam', t: t + 0.02, g: 0.3 }); Sm(E, E.fx, { i: 'bdrum', t: t + 0.02, g: 0.5 }); } else I_.crash(E, E.fx, t + 0.02, 0.07); }
};
EP.cmd = function (t, name, a) {
  const E = this; a = a || [];
  if (name === 'state') { const s = a[0]; if (!ST[s]) return; if (E.state === s && !E.pending) return; if (E.pending === s) return;
    if (E.gv && (s === 'plan' || s === 'chain') && E.deck && E.deck.state === 'plan' && !E.pending) { E.state = s; if (s === 'chain') { E.sg = 0; E.cix = 0; E.cixWas = 0; E.stepN = 0; E.stepOf = 0; } E.chainTrim(t, s === 'chain'); return; }   // a groove does not stop for a chain: the same music carries on and the chain surges on top
    if (E.gv && s === 'chain' && E.deck) { E.pending = s; return; }
    if (!E.deck || ST[s].cut || E.deck.S.drone) E.start(s, t + 0.01);
    else { E.pending = s; const tb = E.deck.nextT; if (tb - t > 0.45 && !E.dry) { if (E.gv && TK[E.th] && TK[E.th].roll) TK[E.th].roll(E, t, tb); else if (E.gv) { const k = Math.max(3, Math.round((tb - t) * 8)); for (let i = 0; i < k; i++) Sm(E, E.fx, { i: 'shaker', t: t + (tb - t) * i / k, g: 0.04 + 0.16 * i / k, pan: 0.3 }); } else if (E.th === 3) { const k = Math.max(3, Math.round((tb - t) * 11)); for (let i = 0; i < k; i++) Sm(E, E.fx, { i: 'timp', m: 50, t: t + (tb - t) * i / k, g: 0.04 + 0.14 * i / k, pan: 0.2 }); } else N(E, E.fx, { t, ft: 'bandpass', f: 500, f1: 3200, fT: tb - t, q: 1.2, g: 0.045, a: tb - t, d: 0.05 }); } } }   // a soft roll (a swell of noise in the old themes) into the bar line
  else if (name === 'intensity') { const v = clamp(+a[0] || 0, 0, 1); if (E.gv) { E.slow = v; if (E.state === 'plan' || E.state === 'chain' || !E.state) E.playI = v; E.heat(t, 0.5); } else { E.I = v; if (E.deck) E.setI(E.deck, E.I, t, 0.25); } }
  // a turn has ended: result 0 (did nothing) to 1 (a great turn). The slow value goes up, more for a better turn; a weak turn lets it sag a little. It is never reset between turns.
  else if (name === 'turn') { const r = clamp(+a[0] || 0, 0, 1); E.playI = clamp(E.playI + (r >= 0.25 ? 0.1 + 0.18 * r : -0.05), 0.12, 0.85); if (E.gv && (E.state === 'plan' || E.state === 'chain')) { E.slow = E.playI; E.heat(t, 0.8); } }
  else if (name === 'step') E.step(t, a[0], a[1]);
  else if (name === 'round') { const was = E.rnd; E.rnd = clamp(Math.round(+a[0]) || 1, 1, 9); if (E.rnd !== was || a[1]) E.playI = Math.max(0.18 + 0.03 * (E.rnd - 1), E.playI * 0.55); if (E.wowG) E.wowG.gain.setTargetAtTime(0.0007 * wowOf(E.th) * (1 + 2.5 * E.w()), t, 0.5); }   // a new round starts cooler than the last one ended, but warmer than round 1 did
  else if (name === 'volume') { E.vol = clamp(+a[0], 0, 1); E.volG.gain.setTargetAtTime(E.vol, t, 0.05); }
  else if (name === 'duck') { const p = E.duckG.gain; p.setTargetAtTime(clamp(a[0] === undefined ? 0.4 : +a[0], 0, 1), t, 0.01); p.setTargetAtTime(1, t + 0.04, ((a[1] || 300) / 1000) / 3); }
  else if (name === 'theme') { const k = clamp(Math.round(+a[0]) || 1, 1, NTH); if (k !== E.th) { E.thNext = k; if (E.deck && E.state) { if (E.deck.S.drone || (E.gv && k >= 4)) { const st = E.pending || E.state; E.setTheme(k); E.thNext = 0; E.swapT = t; E.start(st, t + 0.01); } else E.pending = E.state; } else { E.setTheme(k); E.thNext = 0; } } }   // between soundtracks the change is at once: the old one fades under the new one's first bar (both on smooth ramps, so nothing clicks); the heat of the round is kept
  else if (name === 'stop') { if (E.deck) E.fadeOut(E.deck, t, 0.15); E.deck = null; E.state = null; E.pending = null; }
};
// write everything that begins before `until`
EP.advance = function (until) {
  const E = this; let guard = 0;
  while (E.deck && E.deck.nextT < until && guard++ < 4000) {
    if (E.pending) { const s = E.pending, tb = E.deck.nextT; if (E.thNext) { E.setTheme(E.thNext); E.thNext = 0; } const keepI = s === E.state ? E.I : null; E.state = null; E.start(s, tb); if (keepI !== null) { E.I = keepI; E.setI(E.deck, keepI, tb, 0.01); } continue; }
    E.schedBar(E.deck);
  }
};
// the most voices sounding at once (from the spans of every voice written)
EP.peakNodes = function () { const ev = []; for (let i = 0; i < this.spans.length; i += 3) { ev.push([this.spans[i], this.spans[i + 2]], [this.spans[i + 1], -this.spans[i + 2]]); } ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]); let cur = 0, pk = 0; ev.forEach(e => { cur += e[1]; if (cur > pk) pk = cur; }); return pk; };

// ====================================================================================================================
// the live player
// ====================================================================================================================
const thOfId = id => { const x = TRACKS.filter(k => k.id === id)[0]; return x ? x.th : 0; }, idOfTh = th => { const x = TRACKS.filter(k => k.th === th)[0]; return x ? x.id : ''; };
let unlocked = ['funk'], shuffle = false, dflt = 'funk', picked = false;   // dflt: the soundtrack a player hears who has never picked one (a setting, saved); picked: the player has chosen
let LE = null, timer = null, theme = 6, arrange = 'c', volume = 0.7, runSeed = Math.floor(Math.random() * 1e9) + 1, want = null, wantI = null, wantR = 1;
try { const s = JSON.parse(root.localStorage.getItem(KEY) || 'null'); if (s) { if (typeof s.dflt === 'string' && thOfId(s.dflt)) dflt = s.dflt; picked = s.picked === undefined ? !!s.theme && +s.theme !== 6 : !!s.picked; if (s.theme && picked) theme = clamp(Math.round(+s.theme) || 6, 1, NTH); else theme = thOfId(dflt) || 6; if (Array.isArray(s.unlocked)) unlocked = s.unlocked.filter(x => typeof x === 'string'); shuffle = !!s.shuffle; if (ARR[s.arrange]) arrange = s.arrange; if (typeof s.volume === 'number') volume = clamp(s.volume, 0, 1); } const q = root.location && root.location.search ? new URLSearchParams(root.location.search).get('music') : null; if (q !== null && q !== '') theme = clamp(Math.round(+q) || 6, 1, NTH); const qd = root.location && root.location.search ? new URLSearchParams(root.location.search).get('maintrack') : null; if (qd && thOfId(qd)) { dflt = qd; if (!picked) theme = thOfId(qd); } const qt = root.location && root.location.search ? new URLSearchParams(root.location.search).get('track') : null; if (qt && thOfId(qt)) theme = thOfId(qt); if (!PLAY[theme]) theme = 6; const qg = root.location && root.location.search ? new URLSearchParams(root.location.search).get('groove') : null; if (qg === '1' || qg === '2' || qg === '3') theme = 3 + (+qg); const qa = root.location && root.location.search ? new URLSearchParams(root.location.search).get('fuse') : null; if (ARR[qa]) arrange = qa; } catch (e) { /* defaults */ }
function persist() { try { root.localStorage.setItem(KEY, JSON.stringify({ theme, arrange, volume, unlocked, shuffle, dflt, picked })); } catch (e) { /* storage blocked */ } }
function live() {
  if (LE) return LE;
  let c = cap; if (!c && AA.sfx && AA.sfx.resume) { try { AA.sfx.resume(); } catch (e) { /* no effects */ } c = cap; }
  if (!c) { const AC = root.AudioContext || root.webkitAudioContext; if (!AC) return null; try { c = new AC(); } catch (e) { return null; }
    const wake = () => { if (c.state === 'suspended' && c.resume) c.resume(); }; ['pointerdown', 'keydown'].forEach(ev => { try { root.addEventListener(ev, wake, { passive: true }); } catch (e) { /* no window */ } }); }
  LE = new Engine(c, { theme, arr: arrange, volume, seed: runSeed }); LE.rnd = wantR; if (theme === 3) warm(LE); LE.attach(c.__ovsb ? c.__ovsb.bed : null);
  timer = root.setInterval(tick, 50); return LE;
}
function tick() {
  const E = LE; if (!E) return; const c = E.c;
  if (!E.shared && c.__ovsb) E.attach(c.__ovsb.bed);
  if (c.state === 'running' || c.currentTime > 0) E.advance(c.currentTime + LOOK);
  if (E.spans.length > 30000) { const now = c.currentTime, keep = []; for (let i = 0; i < E.spans.length; i += 3) if (E.spans[i + 1] > now) keep.push(E.spans[i], E.spans[i + 1], E.spans[i + 2]); E.spans = keep; }
  if (E.log.length > 4000) E.log.splice(0, 2000);
}
const now = E => Math.max(E.c.currentTime, 0) + 0.02;
const music = {
  THEMES: [1, 2, 3].map(k => ({ n: k, name: TH[k].name, line: TH[k].line })), STATES: Object.keys(ST),
  // the state of the game: 'title' | 'bench' | 'shop' | 'pick' | 'plan' | 'chain' | 'overreact' | 'won' | 'lost' | 'runwon' | 'runlost'
  state(name) { if (name === undefined) return LE ? (LE.pending || LE.state) : want; if (!ST[name]) return; want = name; const E = live(); if (!E) return; E.cmd(now(E), 'state', [name]); tick(); return name; },
  // how hard the music plays, 0 to 1; each state starts at its own level
  intensity(v) { if (v === undefined) return LE ? LE.I : wantI; wantI = v; if (LE) LE.cmd(now(LE), 'intensity', [v]); },
  // a step of the chain, 1 and up, called at the hit: the bed grows and its chord follows the effects. of (optional): how many steps the chain has
  step(n, of) { if (LE) LE.cmd(now(LE), 'step', [n, of]); },
  // a turn (a page) has ended: how it went, 0 (nothing happened) to 1 (a great turn). Raises the slow value; a weak turn lets it sag a little.
  turn(result) { if (LE) LE.cmd(now(LE), 'turn', [result]); },
  // the groove: 1 lab lounge, 2 hypnotic, 3 mad science funk (saved; also ?groove=1..3)
  groove(k) { if (k === undefined) return theme >= 4 ? theme - 3 : 0; return music.theme(3 + clamp(Math.round(+k) || 1, 1, 3)) - 3; },
  // the four chords a chain moves through in the current groove, three steps each (for the effects to follow)
  chainChords(id) { const th = (id && thOfId(id)) || theme; return th >= 4 ? TH[th].chain.map(n => ({ name: n, root: CH[n].r, notes: CH[n].n.slice() })) : SFXCH.map(n => ({ name: n, root: CH[n].r, notes: CH[n].n.slice() })); },
  // the round of the run, 1 to 9: later rounds are faster and darker
  round(n) { if (n === undefined) return wantR; wantR = clamp(Math.round(+n) || 1, 1, 9); if (LE) LE.cmd(now(LE), 'round', [wantR]); },
  volume(v) { if (v === undefined) return volume; volume = clamp(+v, 0, 1); persist(); if (LE) LE.cmd(now(LE), 'volume', [volume]); },
  // push the music down for a moment (depth 0 to 1, back up over ms); not needed when the effects' bus is shared
  duck(depth, ms) { if (LE) LE.cmd(now(LE), 'duck', [depth, ms]); },
  stop() { want = null; if (LE) LE.cmd(now(LE), 'stop'); },
  // the arrangement of Fuse: 'a' chamber, 'b' gothic, 'c' hybrid (saved; also ?fuse=a..c). It takes hold on the next bar line.
  arrange(a) { if (a === undefined) return arrange; if (!ARR[a]) return arrange; arrange = a; persist(); if (LE) { LE.arr = a; warm(LE); if (LE.deck && LE.state && !LE.pending) { if (LE.deck.S.drone) LE.start(LE.state, now(LE)); else LE.pending = LE.state; } } return arrange; },
  ARRANGEMENTS: ARR, _made() { return { ms: GEN.ms, bytes: GEN.bytes, n: GEN.n }; },
  theme(k) { if (k === undefined) return theme; theme = clamp(Math.round(+k) || 6, 1, NTH); if (!PLAY[theme]) theme = 6; persist(); if (LE) LE.cmd(now(LE), 'theme', [theme]); return theme; },
  // the seed of the run: the same seed gives the same choices; a new run should give a new one
  seed(n) { if (n === undefined) return runSeed; runSeed = Math.floor(Math.abs(+n)) || 1; if (LE) LE.seed = runSeed;
    if (shuffle) { const pool = music.unlocked(), cur = idOfTh(theme), rest = pool.filter(x => x !== cur); if (rest.length) music.theme(thOfId(rest[RNG(runSeed * 13 + 7).i(rest.length)])); } },
  // the soundtracks. track(id) chooses one (saved; also ?track=id); it takes hold on the next bar line. tracks() lists them.
  track(id) { if (id === undefined) return idOfTh(theme); const th = thOfId(String(id)); if (!th) return idOfTh(theme); picked = true; music.theme(th); return String(id); },
  // the default soundtrack: what plays for a player who has never picked one. defaultTrack(id) sets it (saved; also ?maintrack=id) and, if the player has not
  // picked, changes to it at once; defaultTrack() reads it. The default track is always among the found ones. track('') forgets the player's pick.
  defaultTrack(id) { if (id === undefined) return dflt; if (!thOfId(String(id))) return dflt; dflt = String(id); if (!picked) music.theme(thOfId(dflt)); else persist(); return dflt; },
  unpick() { picked = false; music.theme(thOfId(dflt) || 6); return dflt; },
  tracks() { const u = music.unlocked(); return TRACKS.map(k => ({ id: k.id, name: k.name, line: k.line, found: u.indexOf(k.id) >= 0 })); },
  // the tracks the player has found (funk is always there). unlocked(list) sets them, unlocked() reads them; saved.
  unlocked(list) { if (list !== undefined) { unlocked = (Array.isArray(list) ? list : [list]).filter(x => thOfId(x)); persist(); } const base = dflt === 'funk' ? ['funk'] : ['funk', dflt]; return base.concat(unlocked.filter(x => base.indexOf(x) < 0 && thOfId(x))); },
  // shuffle(true): each run (each call of seed(n)) plays another found track, never the one just played; saved.
  shuffle(v) { if (v === undefined) return shuffle; shuffle = !!v; persist(); return shuffle; },
  info() { return LE ? { track: idOfTh(LE.th), theme: LE.th, state: LE.state, pending: LE.pending, intensity: LE.I, round: LE.rnd, shared: !!LE.shared, nodes: LE.nodes, bars: LE.log.length } : null; },

  _live() { return LE; },
  // -- test hooks: no speakers needed --
  // a timeline [{ t: ms, n: 'state' | 'intensity' | 'step' | 'round' | 'theme' | 'volume' | 'duck' | 'stop', a: [...] }] rendered offline.
  // opts: theme, seed, round, volume, solo (one layer only), rate. Resolves { l, r, bars, nodes, peak, ms }.
  _renderTimeline(events, secs, opts) {
    const OC = (root.OfflineAudioContext && root.OfflineAudioContext.__orig) || root.OfflineAudioContext || root.webkitOfflineAudioContext; if (!OC) return Promise.reject(new Error('no OfflineAudioContext'));
    opts = opts || {}; const sr = opts.rate || 44100, off = new OC(2, Math.ceil(sr * secs), sr), E = new Engine(off, { theme: opts.theme || thOfId(opts.track) || theme, arr: opts.arr || arrange, seed: opts.seed || 1, volume: opts.volume === undefined ? 0.7 : opts.volume, solo: opts.solo });
    E.rnd = opts.round || 1; E.attach(null); run(E, events, secs, off);
    const t0 = Date.now(); return off.startRendering().then(b => ({ l: b.getChannelData(0), r: b.getChannelData(1), bars: E.log, nodes: E.nodes, peak: E.peakNodes(), ms: Date.now() - t0, err: E.err, made: { ms: GEN.ms, bytes: GEN.bytes, n: GEN.n } }));
  },
  // the same without sound: only the bar log (what was written, bar by bar), for counting repeats over a long time
  _score(events, secs, opts) {
    const OC = (root.OfflineAudioContext && root.OfflineAudioContext.__orig) || root.OfflineAudioContext || root.webkitOfflineAudioContext; opts = opts || {};
    const off = new OC(2, 4410, 44100), E = new Engine(off, { theme: opts.theme || thOfId(opts.track) || theme, arr: opts.arr || arrange, seed: opts.seed || 1, dry: true }); E.rnd = opts.round || 1; run(E, events, secs); return E.log;
  },
  // music and effects together through the effects' own bus: sfxEvents as AA.sfx._renderTimeline takes them. Resolves { l, r }.
  _renderWithSfx(events, sfxEvents, secs, opts, sfxOpts) {
    if (!AA.sfx || !AA.sfx._renderTimeline) return Promise.reject(new Error('no sfx'));
    opts = opts || {}; const key = root.OfflineAudioContext ? 'OfflineAudioContext' : 'webkitOfflineAudioContext', O = root[key]; let off = null, E = null;
    const W = function (a, b, c2) { off = new O(a, b, c2); return off; }; W.prototype = O.prototype; W.__orig = O; root[key] = W;
    const fns = { __mus() { E = new Engine(off, { theme: opts.theme || thOfId(opts.track) || theme, arr: opts.arr || arrange, seed: opts.seed || 1, volume: opts.volume === undefined ? 0.7 : opts.volume }); E.rnd = opts.round || 1; if (opts.probe) { const o = off.createOscillator(), g = E.G(0.004); o.frequency.value = 15000; o.connect(g); g.connect(E.out); o.start(); } else if (!opts.mute) run(E, events, secs, off); }, __att() { if (E) E.attach(off.__ovsb ? off.__ovsb.bed : null); music._lastShared = !!(E && E.shared); } };
    let p; try { p = AA.sfx._renderTimeline([{ t: -1, n: '__mus', a: [] }].concat(sfxEvents || [], [{ t: secs * 1000 - 1, n: '__att', a: [] }]), secs, fns, Object.assign({ stereo: true }, sfxOpts || {})); } finally { root[key] = O; }
    return p;
  }
};
// offline: the timeline is written a second at a time while the render is held, as the live clock writes it (so the node
// count at any moment is the live one); with no suspend() the whole timeline is written at once
function run(E, events, secs, off) {
  const evs = (events || []).slice().sort((a, b) => a.t - b.t).filter(e => e.t / 1000 < secs); let i = 0;
  const upTo = t1 => { while (i < evs.length && evs[i].t / 1000 < t1) { const e = evs[i++], t = Math.max(0, e.t / 1000); E.advance(t + LOOK); E.cmd(t, e.n, e.a); } E.advance(Math.min(secs, t1 + LOOK)); };
  if (!off || !off.suspend || E.dry) { upTo(secs + 1); return; }
  upTo(1); for (let T = 1; T < secs; T++) off.suspend(T).then(() => { try { upTo(T + 1); } catch (e) { E.err = String(e && e.stack || e); } off.resume(); });
}
TRACKS.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
AA.music = music;
})(typeof globalThis !== 'undefined' ? globalThis : window);
