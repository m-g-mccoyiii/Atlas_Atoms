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

const KEY = 'overreact.music', TRIM = 0.96, LOOK = 0.35, MASTER = 0.67;
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
  E.c = c; E.G = G; E.th = clamp(Math.round(+o.theme) || 4, 1, 6); E.gv = E.th >= 4; E.arr = ARR[o.arr] ? o.arr : 'c'; E.slow = 0.5; E.sg = 0; E.playI = 0.2; E.rnd = 1; E.I = 0.5; E.vol = o.volume === undefined ? 0.7 : o.volume; E.seed = o.seed || 1; E.dry = !!o.dry; E.solo = o.solo || null;
  E.jr = RNG(E.seed * 31 + 5); E.deck = null; E.pending = null; E.nDeck = 0; E.log = []; E.nodes = 0; E.spans = []; E.stepN = 0; E.cix = 0;
  E.sum = G(MASTER); E.duckG = G(1); E.volG = G(E.vol); E.out = G(1); E.duckG.connect(E.volG); E.volG.connect(E.out);
  // the grooves go to "tape": a slow wobble of pitch (a short delay whose length wanders), a faster flutter, a soft squash. The older themes go straight through.
  E.plain = G(E.gv ? 0 : 1); E.sum.connect(E.plain); E.plain.connect(E.duckG);
  const td = c.createDelay(0.06); td.delayTime.value = 0.014; const w1 = c.createOscillator(), w2 = c.createOscillator(), fl = G(0.00005); E.wowG = G(0.0007); w1.frequency.value = 0.53; w2.frequency.value = 6.1; w1.connect(E.wowG); E.wowG.connect(td.delayTime); w2.connect(fl); fl.connect(td.delayTime); w1.start(); w2.start();
  const tsh = c.createWaveShaper(), tcu = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; tcu[i] = Math.tanh(x * 1.5) / Math.tanh(1.5); } tsh.curve = tcu; tsh.oversample = '2x'; E.taped = G(E.gv ? 1 : 0); E.sum.connect(td); td.connect(tsh); tsh.connect(E.taped); E.taped.connect(E.duckG);
  // noise, made here from a seed
  const nb = c.createBuffer(1, Math.floor(c.sampleRate * 2), c.sampleRate), nd = nb.getChannelData(0), nr = RNG(4711); for (let i = 0; i < nd.length; i++) nd[i] = nr() * 2 - 1; E.noise = nb;
  // a room: a made impulse (decaying noise, darker towards the end) in a convolver
  const len = Math.floor(c.sampleRate * 3.0), ir = c.createBuffer(2, len, c.sampleRate), pre = Math.floor(0.025 * c.sampleRate);
  for (let chn = 0; chn < 2; chn++) { const d = ir.getChannelData(chn), r = RNG(99 + chn * 31); let lp = 0; for (let i = 0; i < len; i++) { const x = i / len, w = r() * 2 - 1, k = 0.8 - 0.68 * x; lp += k * (w - lp); d[i] = i < pre ? 0 : lp * Math.pow(1 - x, 2.2) * Math.exp(-(E.gv ? 6.5 : E.arr === 'a' && E.th === 3 ? 5 : 3.4) * x) * (i < pre + 400 ? (i - pre) / 400 : 1); } for (let j = 0; j < 9; j++) { const at = Math.floor((0.007 + r() * 0.07) * c.sampleRate); d[at] += (r() - 0.5) * 1.6; } }   // a hall: a few early walls, then a tail that darkens
  E.revIn = G(1); const cv = c.createConvolver(); cv.normalize = true; cv.buffer = ir; const rr = G(0.55); E.revIn.connect(cv); cv.connect(rr); rr.connect(E.sum);
  // an echo
  E.dlyIn = G(1); E.dl = c.createDelay(1.5); E.dl.delayTime.value = 0.4; const fb = G(0.36), dlp = c.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2400; const dr = G(0.5);
  E.dlyIn.connect(E.dl); E.dl.connect(dlp); dlp.connect(fb); fb.connect(E.dl); dlp.connect(dr); dr.connect(E.sum);
  E.fx = G(1); E.fx.connect(E.sum); const fr = G(0.3); E.fx.connect(fr); fr.connect(E.revIn);
  E.sat = {};
}
const EP = Engine.prototype;
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
EP.setTheme = function (k) { const E = this; E.th = k; E.gv = k >= 4; E.plain.gain.value = E.gv ? 0 : 1; E.taped.gain.value = E.gv ? 1 : 0; };
EP.heat = function (t, tau) { const E = this; E.I = clamp(E.slow + (1 - E.slow) * E.sg, 0, 1); if (E.deck) E.setI(E.deck, E.I, t, tau || 0.25); if (E.gv && E.state === 'chain' && E.chainTrim) E.chainTrim(t, true); };
// in a chain the effects are the star: the groove gets denser and brighter with the surge but steps back in level, and comes forward again after
EP.chainTrim = function (t, on) { const dk = this.deck; if (dk && dk.sg0 && !dk.dead) dk.gs.forEach(g => g.gain.setTargetAtTime(dk.sg0 * (on ? (this.th === 4 ? 0.2 * (1 - 0.3 * this.sg) : this.th === 6 ? 0.6 * (1 - 0.15 * this.sg) : 0.45 * (1 - 0.4 * this.sg)) : 1), t, on ? 0.12 : 0.5)); };
EP.stat = function (n, t0, t1) { this.nodes += n; this.spans.push(t0, t1, n); };
EP.note = function (dst, t, f, kind) { const d = this.cur; if (d) d.push((dst.__n || '?') + ':' + Math.round((t - d.t) / d.spu) + ':' + Math.round(69 + 12 * Math.log2(Math.max(f, 1) / 440)) + (kind || '')); };

// ---------- voices ----------
// a voice that has ended is taken off the graph at once (not left for the garbage collector)
const done = n => { try { n.disconnect(); } catch (e) { /* gone */ } };
// a pitched voice: o = { t, f, g, type, det [cents...], a, h, d, lp, lp1, lpt, q, f1, ft, fm { r, i, i1, d }, vib { f, c, in }, pan }
function V(E, dst, o) {
  const u = E.w(), ln = dst.__n, mel = ln === 'lead' || ln === 'arp' || ln === 'bell' || ln === 'vox', j1 = E.jr(), j2 = E.jr(), j3 = E.jr();
  let f0 = o.f; if (ln === 'arp' && j3 < 0.07 * u) f0 *= j1 < 0.5 ? 1.0595 : 1.4142;                      // a wrong note in the arpeggio: a semitone or a tritone off
  E.note(dst, o.t, f0); if (E.dry || (E.solo && dst.__n !== E.solo)) return;
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
  E.note(dst, o.t, o.f || 1000, 'n'); if (E.dry || (E.solo && dst.__n !== E.solo)) return;
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
  E.note(dst, o.t, o.f, 'v'); if (E.dry || (E.solo && dst.__n !== E.solo)) return;
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
  dk.sw = E.gv ? swingOf(E.th, E.w()) : (u => u);
  dk.upb = T.upb; dk.setTempo = () => { const d = (E.rnd - 1) / 8, bpm = (T.bpm[0] + (T.bpm[1] - T.bpm[0]) * d) * (S.tm || 1); dk.spu = T.upb === 12 ? 60 / bpm / 6 : 60 / bpm / 4; }; dk.setTempo();
  const a = fin || [1, 0.01], sg = S.g * (E.gv ? (S.I > 0.8 ? 0.33 : state === 'plan' ? 0.62 : 0.34) * (E.th === 6 ? 1.3 : E.th === 5 ? (S.I > 0.8 ? 0.7 : 0.62) : 1) : E.th !== 3 ? 1 : S.drone ? 0.9 : S.I > 0.8 ? 0.53 : 0.66);   // Fuse's loud states are many instruments at once: held back so the limiter is not what sets their level
  dk.sg0 = sg; dk.gs = ['dry', 'rev', 'dly'].map((k, i) => { const g = G(0); g.gain.setValueAtTime(a[0] * sg, t0 - 0.01); g.gain.setTargetAtTime(sg, t0, a[1]); g.connect(i === 0 ? E.sum : i === 1 ? E.revIn : E.dlyIn); return g; });
  if (E.gv) { dk.tone = c.createBiquadFilter(); dk.tone.type = 'lowpass'; dk.tone.Q.value = 0.5; dk.tone.frequency.value = 6000; dk.tone.connect(dk.gs[0]); }   // a groove opens up as it heats: the whole deck through a filter that rises with the heat
  if (!S.drone) Object.keys(LAY).forEach(k => {
    const cf = (E.gv ? LAYG : E.th === 3 ? LAYF : LAY)[k], inp = G(1), lv = G(0); inp.__n = k; let x = inp;
    if (k === 'bass' || k === 'pad') { const p = G(1); x.connect(p); x = p; dk.L[k + 'Pump'] = p; }
    const uu = E.w(), drive = cf.sat ? cf.sat + 2.2 * uu : (k === 'lead' || k === 'vox' || k === 'arp') && uu > 0.1 ? 1 + 2.5 * uu : 0;   // more drive as the rounds go on, levelled so it gets rougher, not louder
    if (drive) { const pg = cf.sat ? (k === 'drums' ? 0.9 : 0.8) : 1 + 1.5 * uu, pre = G(pg), sh = E.shaper(drive, !cf.sat), post = G(cf.sat ? Math.pow(cf.sat / drive, E.gv ? 0.65 : 0.8) : 1 / (pg * Math.pow(drive, E.th === 5 ? 0.4 : E.gv ? 0.65 : 0.8))); x.connect(pre); pre.connect(sh); sh.connect(post); x = post; }
    x.connect(lv); lv.connect(dk.tone || dk.gs[0]); if (cf.rev) { const s = G(cf.rev); lv.connect(s); s.connect(dk.gs[1]); } if (cf.dly) { const s = G(cf.dly); lv.connect(s); s.connect(dk.gs[2]); }
    dk.L[k] = { in: inp, lv };
  });
  if (E.gv && dk.L.vox && !E.dry) { dk.rot = c.createOscillator(); dk.rot.frequency.value = 0.9; const rg = G(0.25); dk.rot.connect(rg); rg.connect(dk.L.vox.in.gain); dk.rot.start(Math.max(0, t0 - 0.01)); dk.ends.push(dk.rot); }   // the turning speaker: slow when cool, fast when hot
  if (S.drone) (E.th === 3 ? buildDrone3 : buildDrone)(E, dk);
  E.setI(dk, E.I, t0 - 0.01, 0.001);
  return dk;
};
const thOf = (dk, k) => { const l = dk.S.L[k]; return !l ? 9 : dk.E.gv ? (k === 'lead' && dk.state === 'plan' ? 0.28 : l[1] > 5 ? 9 : 0) : k === 'vox' && l[1] < 5 ? l[1] - 0.55 * dk.E.u() : l[1]; };
const layLvl = (l, I, th) => !l || l[0] <= 0 ? 0 : l[0] * (th <= 0 ? 1 : clamp((I - th) / 0.12 + 0.25, 0, 1) * (I >= th - 0.03 ? 1 : 0)) * (0.78 + 0.22 * I);
EP.setI = function (dk, I, t, tau) {
  if (dk.S.drone) { droneI(this, dk, I, t, tau); return; }
  if (dk.tone) dk.tone.frequency.setTargetAtTime(6500 * Math.pow(2, 1.6 * I), t, tau || 0.2); if (dk.rot) dk.rot.frequency.setTargetAtTime(I > 0.85 ? 6.6 : 0.9, t, 0.8);
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
  const sting = S.sting && n === 0, intro = S.intro && n === 0, SG = E.gv ? STINGG : STING, sprog = !S.prog ? null : E.gv ? [0, 0, 2, 2, 1, 1, 3, 3].map(i => T.chain[i]) : S.prog;
  let type, len = 8, prog, base;
  if (sting) { type = 'S'; len = 4; prog = SG[S.sting].prog.slice(); base = SG[S.sting].tune.map(b => b && b.map(x => [Math.round(x[0] * k16), Math.max(1, Math.round(x[1] * k16)), x[2]])); }
  else if (intro) { type = 'I'; len = S.intro; prog = T.prog.A.slice(0, len); base = null; }
  else { if (dk.secM % 4 === 0) dk.form = r.pick(S.forms || FORMS); type = dk.form[dk.secM % 4]; dk.secM++; prog = (sprog || T.prog[type]).slice(); base = T.tune[type];
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
  // the tune
  const bar = s.tune[b];
  if (bar && on(dk, 'lead')) {
    const minor = ['Dm', 'Bb', 'Gm', 'Eb', 'Dsus', 'Edim'].indexOf(name) >= 0, dark = !E.gv && E.rnd >= 4 && minor, flat5 = !E.gv && E.rnd >= 6 && ['Bb', 'Gm', 'Eb', 'Edim'].indexOf(name) >= 0, mode = s.type === 'S' ? 'full' : dk.S.tune, bright = clamp(E.I, 0, 1), lastBar = b === s.len - 1;   // from round 4 E falls to E flat; from round 6 the short A's fall to A flat
    let inst = dk.T.leads[s.lv]; if (mode === 'low') inst = 'chant'; if ((E.th === 3 && E.I > 0.72) || (E.th === 1 && dk.state === 'overreact')) inst = 'brass';
    const answer = E.gv && w > 0.2 && b % 4 === 3 && dk.rng.chance(0.8 * w);                                                         // in later rounds the fourth bar of a phrase jumps up an octave, like someone butting in
    bar.forEach(x => { let m = x[2] + s.lo + (answer ? 12 : 0); if (dark && ((m - 64) % 12 + 12) % 12 === 0) m -= 1; if (flat5 && x[1] <= dk.upb / 2 && ((m - 69) % 12 + 12) % 12 === 0) m -= 1; if (inChain) m = nearTone(m, ch); const tt = t + dk.sw(x[0]) * dk.spu, du = x[1] * dk.spu;
      if (mode === 'low') m = m > 69 ? m - 12 : m;
      if (x[1] <= dk.upb / 2 && dk.rng.chance(0.06 * w)) m += E.gv ? 12 : dk.rng.chance(0.5) ? 1 : -1;                // a wrong note (in a groove: a note that jumps the octave)
      if (E.gv && w > 0.15 && x[1] >= 2 && dk.rng.chance(0.4 * w)) grooveLead(E, dk, tt - 0.08, 0.08, m - 1, 0.6, mode);                // in later rounds notes are slid into from a semitone under: cheeky, not sad
      if (E.rnd >= 8 && lastBar && !E.gv) { if (E.th === 3) fuseLead(E, dk, tt, du, m + 6, 0.4, 'full'); else leadNote(E, dk, inst, tt, du, m + 6, 0.4, bright); }                                 // from round 8 the last bar of a section is doubled a tritone up                     // a wrong note, a semitone off, on the shorter notes
      if (E.gv) grooveLead(E, dk, tt, du, m, 1, mode); else if (E.th === 3) fuseLead(E, dk, tt, du, m, 1, mode); else leadNote(E, dk, inst, tt, du, m, 1, bright);
      if (mode === 'oct' && E.th !== 3) { leadNote(E, dk, E.th === 2 ? 'bell' : 'saw', tt, du, m + (E.th === 2 ? 0 : 12), 0.5, bright); if (E.th !== 2) chant(E, dk.L.vox.in, { t: tt, f: mf(m - 24 > 45 ? m - 24 : m - 12), g: 0.3, a: 0.05, h: du * 0.85, d: 0.2, vow: 0, pan: 0.2 }); }
    });
  }
  if (u > 0.3 && on(dk, 'vox') && !E.gv) { const X = dk.L.vox.in, n = u > 0.8 ? 3 : u > 0.55 ? 2 : 1; for (let i = 0; i < n; i++) if (E.th === 3) { if (i < 2 || b % 2 === 0) hold(E, X, 'choirA', ch.r + [24, 31, 25][i], t + i * 0.09, dk.upb * dk.spu - 0.3, (i === 2 ? 0.5 : 0.3) * w, { a: 0.3, r: 0.5, wide: 0.7 }); } else chant(E, X, { t: t + i * 0.09, f: mf(ch.r + [24, 31, 25][i]), g: (i === 2 ? 0.2 : 0.11) * w, a: 0.3, h: dk.upb * dk.spu - 0.5, d: 0.5, vow: i, pan: [0, -0.6, 0.6][i] }); }   // more voices join; the last sings a semitone off
  if (E.gv) { /* the grooves have their own late-round mischief in playGroove */ } else if (E.rnd >= 8 && b === s.len - 1 && on(dk, 'bass') && E.th === 3) hold(E, dk.L.bass.in, E.arr === 'a' ? 'basses' : 'bone', ch.r + 18, t + dk.upb * dk.spu * 0.75, dk.upb * dk.spu * 0.24, 0.6, { a: 0.03, r: 0.1 });
  else if (E.rnd >= 8 && b === s.len - 1 && on(dk, 'bass')) V(E, dk.L.bass.in, { t: t + dk.upb * dk.spu * 0.75, f: mf(ch.r + 6), type: 'sawtooth', det: [-8, 8], g: 0.3, a: 0.004, h: dk.upb * dk.spu * 0.15, d: dk.upb * dk.spu * 0.1, lp: 900, lp1: 250, q: 3 });   // and the bass steps to the tritone
  const full = E.cur.join('|'), lead = E.cur.filter(x => x.slice(0, 4) === 'lead').join('|');
  E.log.push({ t: +t.toFixed(3), state: dk.state, sec: s.type, b, ch: name, sig: hash(full), lead: lead ? hash(lead) : 0, n: E.cur.length }); E.cur = null;
  dk.bar++; dk.sb++; dk.nextT = t + dk.upb * dk.spu;
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
  E.note(dst, o.t, mf(m), o.i); if (E.dry || (E.solo && dst.__n !== E.solo)) return;
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
EP.step = function (t, n) {
  const E = this, dk = E.deck; n = Math.max(1, Math.round(n) || 1); E.stepN = n; E.cix = Math.floor((n - 1) / 3) % 4;
  if (E.gv) { E.sg = Math.pow(clamp(n / 16, 0, 1), 1.2); E.heat(t, 0.12); if (dk && !dk.S.drone) grooveStep(E, dk, t, n); return; }
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
  if (old) E.fadeOut(old, t, S.cut ? S.cut / 3 : Math.max(0.12, old.upb * old.spu / 7 || 0.2));
  E.I = S.I; if (E.gv) { E.slow = key === 'plan' ? E.playI : S.I; E.sg = 0; E.I = E.slow; } E.state = state; E.deck = E.mkDeck(key, t + (S.cut ? 0.02 : 0), S.fadeIn || (old && !S.cut ? [0.6, 0.12] : null));
  if (E.gv && state === 'chain') E.chainTrim(t + 0.05, true);
  if (state === 'overreact' && !E.dry) { if (E.gv) { Sm(E, E.fx, { i: 'crashC', t: t + 0.02, g: 0.3 }); Sm(E, E.fx, { i: 'kk', t: t + 0.02, g: 0.5 }); } else if (E.th === 3) { Sm(E, E.fx, { i: 'tam', t: t + 0.02, g: 0.3 }); Sm(E, E.fx, { i: 'bdrum', t: t + 0.02, g: 0.5 }); } else I_.crash(E, E.fx, t + 0.02, 0.07); }
};
EP.cmd = function (t, name, a) {
  const E = this; a = a || [];
  if (name === 'state') { const s = a[0]; if (!ST[s]) return; if (E.state === s && !E.pending) return; if (E.pending === s) return;
    if (E.gv && (s === 'plan' || s === 'chain') && E.deck && E.deck.state === 'plan' && !E.pending) { E.state = s; if (s === 'chain') { E.sg = 0; E.cix = 0; } E.chainTrim(t, s === 'chain'); return; }   // a groove does not stop for a chain: the same music carries on and the chain surges on top
    if (E.gv && s === 'chain' && E.deck) { E.pending = s; return; }
    if (!E.deck || ST[s].cut || E.deck.S.drone) E.start(s, t + 0.01);
    else { E.pending = s; const tb = E.deck.nextT; if (tb - t > 0.45 && !E.dry) { if (E.gv) { const k = Math.max(3, Math.round((tb - t) * 8)); for (let i = 0; i < k; i++) Sm(E, E.fx, { i: 'shaker', t: t + (tb - t) * i / k, g: 0.04 + 0.16 * i / k, pan: 0.3 }); } else if (E.th === 3) { const k = Math.max(3, Math.round((tb - t) * 11)); for (let i = 0; i < k; i++) Sm(E, E.fx, { i: 'timp', m: 50, t: t + (tb - t) * i / k, g: 0.04 + 0.14 * i / k, pan: 0.2 }); } else N(E, E.fx, { t, ft: 'bandpass', f: 500, f1: 3200, fT: tb - t, q: 1.2, g: 0.045, a: tb - t, d: 0.05 }); } } }   // a soft roll (a swell of noise in the old themes) into the bar line
  else if (name === 'intensity') { const v = clamp(+a[0] || 0, 0, 1); if (E.gv) { E.slow = v; if (E.state === 'plan' || E.state === 'chain' || !E.state) E.playI = v; E.heat(t, 0.5); } else { E.I = v; if (E.deck) E.setI(E.deck, E.I, t, 0.25); } }
  // a turn has ended: result 0 (did nothing) to 1 (a great turn). The slow value goes up, more for a better turn; a weak turn lets it sag a little. It is never reset between turns.
  else if (name === 'turn') { const r = clamp(+a[0] || 0, 0, 1); E.playI = clamp(E.playI + (r >= 0.25 ? 0.1 + 0.18 * r : -0.05), 0.12, 0.85); if (E.gv && (E.state === 'plan' || E.state === 'chain')) { E.slow = E.playI; E.heat(t, 0.8); } }
  else if (name === 'step') E.step(t, a[0]);
  else if (name === 'round') { const was = E.rnd; E.rnd = clamp(Math.round(+a[0]) || 1, 1, 9); if (E.rnd !== was || a[1]) E.playI = Math.max(0.18 + 0.03 * (E.rnd - 1), E.playI * 0.55); if (E.wowG) E.wowG.gain.setTargetAtTime(0.0007 * (1 + 2.5 * E.w()), t, 0.5); }   // a new round starts cooler than the last one ended, but warmer than round 1 did
  else if (name === 'volume') { E.vol = clamp(+a[0], 0, 1); E.volG.gain.setTargetAtTime(E.vol, t, 0.05); }
  else if (name === 'duck') { const p = E.duckG.gain; p.setTargetAtTime(clamp(a[0] === undefined ? 0.4 : +a[0], 0, 1), t, 0.01); p.setTargetAtTime(1, t + 0.04, ((a[1] || 300) / 1000) / 3); }
  else if (name === 'theme') { const k = clamp(Math.round(+a[0]) || 1, 1, 6); if (k !== E.th) { E.thNext = k; if (E.deck && E.state) { if (E.deck.S.drone) { E.setTheme(k); E.thNext = 0; E.start(E.state, t + 0.01); } else E.pending = E.state; } else { E.setTheme(k); E.thNext = 0; } } }
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
let LE = null, timer = null, theme = 4, arrange = 'c', volume = 0.7, runSeed = Math.floor(Math.random() * 1e9) + 1, want = null, wantI = null, wantR = 1;
try { const s = JSON.parse(root.localStorage.getItem(KEY) || 'null'); if (s) { if (s.theme) theme = clamp(Math.round(+s.theme) || 4, 1, 6); if (ARR[s.arrange]) arrange = s.arrange; if (typeof s.volume === 'number') volume = clamp(s.volume, 0, 1); } const q = root.location && root.location.search ? new URLSearchParams(root.location.search).get('music') : null; if (q !== null && q !== '') theme = clamp(Math.round(+q) || 4, 1, 6); const qg = root.location && root.location.search ? new URLSearchParams(root.location.search).get('groove') : null; if (qg === '1' || qg === '2' || qg === '3') theme = 3 + (+qg); const qa = root.location && root.location.search ? new URLSearchParams(root.location.search).get('fuse') : null; if (ARR[qa]) arrange = qa; } catch (e) { /* defaults */ }
function persist() { try { root.localStorage.setItem(KEY, JSON.stringify({ theme, arrange, volume })); } catch (e) { /* storage blocked */ } }
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
  // a step of the chain, 1 and up, called at the hit: the bed grows and its chord follows the effects
  step(n) { if (LE) LE.cmd(now(LE), 'step', [n]); },
  // a turn (a page) has ended: how it went, 0 (nothing happened) to 1 (a great turn). Raises the slow value; a weak turn lets it sag a little.
  turn(result) { if (LE) LE.cmd(now(LE), 'turn', [result]); },
  // the groove: 1 lab lounge, 2 hypnotic, 3 mad science funk (saved; also ?groove=1..3)
  groove(k) { if (k === undefined) return theme >= 4 ? theme - 3 : 0; return music.theme(3 + clamp(Math.round(+k) || 1, 1, 3)) - 3; },
  // the four chords a chain moves through in the current groove, three steps each (for the effects to follow)
  chainChords() { return theme >= 4 ? TH[theme].chain.map(n => ({ name: n, root: CH[n].r, notes: CH[n].n.slice() })) : SFXCH.map(n => ({ name: n, root: CH[n].r, notes: CH[n].n.slice() })); },
  // the round of the run, 1 to 9: later rounds are faster and darker
  round(n) { if (n === undefined) return wantR; wantR = clamp(Math.round(+n) || 1, 1, 9); if (LE) LE.cmd(now(LE), 'round', [wantR]); },
  volume(v) { if (v === undefined) return volume; volume = clamp(+v, 0, 1); persist(); if (LE) LE.cmd(now(LE), 'volume', [volume]); },
  // push the music down for a moment (depth 0 to 1, back up over ms); not needed when the effects' bus is shared
  duck(depth, ms) { if (LE) LE.cmd(now(LE), 'duck', [depth, ms]); },
  stop() { want = null; if (LE) LE.cmd(now(LE), 'stop'); },
  // the arrangement of Fuse: 'a' chamber, 'b' gothic, 'c' hybrid (saved; also ?fuse=a..c). It takes hold on the next bar line.
  arrange(a) { if (a === undefined) return arrange; if (!ARR[a]) return arrange; arrange = a; persist(); if (LE) { LE.arr = a; warm(LE); if (LE.deck && LE.state && !LE.pending) { if (LE.deck.S.drone) LE.start(LE.state, now(LE)); else LE.pending = LE.state; } } return arrange; },
  ARRANGEMENTS: ARR, _made() { return { ms: GEN.ms, bytes: GEN.bytes, n: GEN.n }; },
  theme(k) { if (k === undefined) return theme; theme = clamp(Math.round(+k) || 4, 1, 6); persist(); if (LE) LE.cmd(now(LE), 'theme', [theme]); return theme; },
  // the seed of the run: the same seed gives the same choices; a new run should give a new one
  seed(n) { if (n === undefined) return runSeed; runSeed = Math.floor(Math.abs(+n)) || 1; if (LE) LE.seed = runSeed; },
  info() { return LE ? { theme: LE.th, state: LE.state, pending: LE.pending, intensity: LE.I, round: LE.rnd, shared: !!LE.shared, nodes: LE.nodes, bars: LE.log.length } : null; },

  _live() { return LE; },
  // -- test hooks: no speakers needed --
  // a timeline [{ t: ms, n: 'state' | 'intensity' | 'step' | 'round' | 'theme' | 'volume' | 'duck' | 'stop', a: [...] }] rendered offline.
  // opts: theme, seed, round, volume, solo (one layer only), rate. Resolves { l, r, bars, nodes, peak, ms }.
  _renderTimeline(events, secs, opts) {
    const OC = (root.OfflineAudioContext && root.OfflineAudioContext.__orig) || root.OfflineAudioContext || root.webkitOfflineAudioContext; if (!OC) return Promise.reject(new Error('no OfflineAudioContext'));
    opts = opts || {}; const sr = opts.rate || 44100, off = new OC(2, Math.ceil(sr * secs), sr), E = new Engine(off, { theme: opts.theme || theme, arr: opts.arr || arrange, seed: opts.seed || 1, volume: opts.volume === undefined ? 0.7 : opts.volume, solo: opts.solo });
    E.rnd = opts.round || 1; E.attach(null); run(E, events, secs, off);
    const t0 = Date.now(); return off.startRendering().then(b => ({ l: b.getChannelData(0), r: b.getChannelData(1), bars: E.log, nodes: E.nodes, peak: E.peakNodes(), ms: Date.now() - t0, err: E.err, made: { ms: GEN.ms, bytes: GEN.bytes, n: GEN.n } }));
  },
  // the same without sound: only the bar log (what was written, bar by bar), for counting repeats over a long time
  _score(events, secs, opts) {
    const OC = (root.OfflineAudioContext && root.OfflineAudioContext.__orig) || root.OfflineAudioContext || root.webkitOfflineAudioContext; opts = opts || {};
    const off = new OC(2, 4410, 44100), E = new Engine(off, { theme: opts.theme || theme, arr: opts.arr || arrange, seed: opts.seed || 1, dry: true }); E.rnd = opts.round || 1; run(E, events, secs); return E.log;
  },
  // music and effects together through the effects' own bus: sfxEvents as AA.sfx._renderTimeline takes them. Resolves { l, r }.
  _renderWithSfx(events, sfxEvents, secs, opts, sfxOpts) {
    if (!AA.sfx || !AA.sfx._renderTimeline) return Promise.reject(new Error('no sfx'));
    opts = opts || {}; const key = root.OfflineAudioContext ? 'OfflineAudioContext' : 'webkitOfflineAudioContext', O = root[key]; let off = null, E = null;
    const W = function (a, b, c2) { off = new O(a, b, c2); return off; }; W.prototype = O.prototype; W.__orig = O; root[key] = W;
    const fns = { __mus() { E = new Engine(off, { theme: opts.theme || theme, arr: opts.arr || arrange, seed: opts.seed || 1, volume: opts.volume === undefined ? 0.7 : opts.volume }); E.rnd = opts.round || 1; if (!opts.mute) run(E, events, secs, off); }, __att() { if (E) E.attach(off.__ovsb ? off.__ovsb.bed : null); music._lastShared = !!(E && E.shared); } };
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
AA.music = music;
})(typeof globalThis !== 'undefined' ? globalThis : window);
