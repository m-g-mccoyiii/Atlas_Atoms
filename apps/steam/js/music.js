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
const upTone = (m, a) => { for (let k = 1; k < 4; k++) { const pc = ((m + k - 62) % 12 + 12) % 12; if (a && pc === 11) return m + k; if (SCALE.indexOf(pc) >= 0 && !(a && pc === 10)) return m + k; } return m + 2; };
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
  3: { name: 'Fuse', line: 'tense and bare: a ticking pulse and a four-note figure that waits, then brass and drums blow up', upb: 16, bpm: [92, 108],
    prog: { A: ['Dm', 'Dm', 'Bb', 'A', 'Gm', 'Dm', 'Edim', 'Dm'], B: ['Bb', 'C', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A'] }, alt: { A: { 1: 'Bb' }, B: { 3: 'F' } },
    tune: {
      A: [[[6, 2, 74], [8, 2, 77], [10, 6, 76]], [[6, 2, 74], [8, 2, 77], [10, 6, 73]], [[6, 2, 74], [8, 2, 77], [10, 6, 82]], [[0, 6, 76], [6, 2, 73], [8, 8, 69]],
          [[6, 2, 79], [8, 2, 82], [10, 6, 81]], [[6, 2, 77], [8, 2, 81], [10, 6, 79]], [[0, 4, 79], [4, 4, 76], [8, 4, 74], [12, 4, 73]], [[0, 12, 74]]],
      B: [[[0, 3, 77], [3, 3, 77], [6, 2, 74], [8, 8, 70]], [[0, 3, 79], [3, 3, 79], [6, 2, 76], [8, 8, 72]], [[0, 3, 81], [3, 3, 81], [6, 2, 77], [8, 8, 74]], [[0, 6, 76], [6, 2, 77], [8, 8, 74]],
          [[0, 3, 77], [3, 3, 77], [6, 2, 74], [8, 8, 70]], [[0, 3, 79], [3, 3, 79], [6, 2, 76], [8, 8, 72]], [[0, 3, 81], [3, 3, 81], [6, 2, 79], [8, 8, 76]], [[0, 4, 73], [4, 4, 76], [8, 8, 81]]] },
    leads: ['fm', 'pluck', 'fm'] }
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
  E.c = c; E.G = G; E.th = clamp(Math.round(+o.theme) || 1, 1, 3); E.rnd = 1; E.I = 0.5; E.vol = o.volume === undefined ? 0.7 : o.volume; E.seed = o.seed || 1; E.dry = !!o.dry; E.solo = o.solo || null;
  E.jr = RNG(E.seed * 31 + 5); E.deck = null; E.pending = null; E.nDeck = 0; E.log = []; E.nodes = 0; E.spans = []; E.stepN = 0; E.cix = 0;
  E.sum = G(MASTER); E.duckG = G(1); E.volG = G(E.vol); E.out = G(1); E.sum.connect(E.duckG); E.duckG.connect(E.volG); E.volG.connect(E.out);
  // noise, made here from a seed
  const nb = c.createBuffer(1, Math.floor(c.sampleRate * 2), c.sampleRate), nd = nb.getChannelData(0), nr = RNG(4711); for (let i = 0; i < nd.length; i++) nd[i] = nr() * 2 - 1; E.noise = nb;
  // a room: a made impulse (decaying noise, darker towards the end) in a convolver
  const len = Math.floor(c.sampleRate * 2.4), ir = c.createBuffer(2, len, c.sampleRate);
  for (let chn = 0; chn < 2; chn++) { const d = ir.getChannelData(chn), r = RNG(99 + chn * 31); let lp = 0; for (let i = 0; i < len; i++) { const x = i / len, w = r() * 2 - 1, k = 0.5 - 0.42 * x; lp += k * (w - lp); d[i] = lp * Math.pow(1 - x, 2.4) * Math.exp(-3.2 * x) * (i < 400 ? i / 400 : 1); } }
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
EP.w = function () { return Math.pow(this.u(), 1.3); };
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
  const E = this, c = E.c, G = E.G, S = ST[state], T = TH[E.th], dk = { E, state, S, T, t0, nextT: t0, bar: 0, sb: 0, secN: 0, sec: null, L: {}, rng: RNG(E.seed * 7919 + hash(state) + (E.nDeck++) * 977 + E.th * 131), form: 'AABA', ends: [], mix: LMIX[E.th] };
  dk.upb = T.upb; dk.setTempo = () => { const d = (E.rnd - 1) / 8, bpm = (T.bpm[0] + (T.bpm[1] - T.bpm[0]) * d) * (S.tm || 1); dk.spu = T.upb === 12 ? 60 / bpm / 6 : 60 / bpm / 4; }; dk.setTempo();
  const a = fin || [1, 0.01], sg = S.g * (E.th === 3 && S.I < 0.45 && !S.drone ? 1.4 : 1);   // Fuse is bare when calm, so its calm states sit a little higher
  dk.gs = ['dry', 'rev', 'dly'].map((k, i) => { const g = G(0); g.gain.setValueAtTime(a[0] * sg, t0 - 0.01); g.gain.setTargetAtTime(sg, t0, a[1]); g.connect(i === 0 ? E.sum : i === 1 ? E.revIn : E.dlyIn); return g; });
  if (!S.drone) Object.keys(LAY).forEach(k => {
    const cf = LAY[k], inp = G(1), lv = G(0); inp.__n = k; let x = inp;
    if (k === 'bass' || k === 'pad') { const p = G(1); x.connect(p); x = p; dk.L[k + 'Pump'] = p; }
    const uu = E.w(), drive = cf.sat ? cf.sat + 2.2 * uu : (k === 'lead' || k === 'vox' || k === 'arp') && uu > 0.1 ? 1 + 2.5 * uu : 0;   // more drive as the rounds go on, levelled so it gets rougher, not louder
    if (drive) { const pg = cf.sat ? (k === 'drums' ? 0.9 : 0.8) : 1 + 1.5 * uu, pre = G(pg), sh = E.shaper(drive, !cf.sat), post = G(cf.sat ? Math.pow(cf.sat / drive, 0.8) : 1 / (pg * Math.pow(drive, 0.8))); x.connect(pre); pre.connect(sh); sh.connect(post); x = post; }
    x.connect(lv); lv.connect(dk.gs[0]); if (cf.rev) { const s = G(cf.rev); lv.connect(s); s.connect(dk.gs[1]); } if (cf.dly) { const s = G(cf.dly); lv.connect(s); s.connect(dk.gs[2]); }
    dk.L[k] = { in: inp, lv };
  });
  if (S.drone) buildDrone(E, dk);
  E.setI(dk, E.I, t0 - 0.01, 0.001);
  return dk;
};
const thOf = (dk, k) => { const l = dk.S.L[k]; return !l ? 9 : k === 'vox' && l[1] < 5 ? l[1] - 0.55 * dk.E.u() : l[1]; };
const layLvl = (l, I, th) => !l || l[0] <= 0 ? 0 : l[0] * (th <= 0 ? 1 : clamp((I - th) / 0.12 + 0.25, 0, 1) * (I >= th - 0.03 ? 1 : 0)) * (0.78 + 0.22 * I);
EP.setI = function (dk, I, t, tau) {
  if (dk.S.drone) { droneI(this, dk, I, t, tau); return; }
  Object.keys(LAY).forEach(k => dk.L[k].lv.gain.setTargetAtTime(layLvl(dk.S.L[k], I, thOf(dk, k)) * dk.mix[k], t, tau || 0.25));
};
EP.fadeOut = function (dk, t, tau) { dk.gs.forEach(g => g.gain.setTargetAtTime(0, t, tau)); dk.dead = t + tau * 6; dk.ends.forEach(o => { try { o.stop(dk.dead + 0.1); } catch (e) { /* already stopped */ } }); };
const on = (dk, k) => { const l = dk.S.L[k]; return !!l && l[0] > 0 && dk.E.I >= thOf(dk, k) - 0.05; };
function pump(dk, t, depth, rel) { ['bassPump', 'padPump'].forEach((k, i) => { const p = dk.L[k].gain, lo = i ? 1 - (1 - depth) * 0.7 : depth; p.setValueAtTime(lo, t); p.linearRampToValueAtTime(1, t + rel); }); }
const pat = (s, fn) => { for (let i = 0; i < s.length; i++) if (s[i] !== '.') fn(i, s[i]); };

// a new section: 8 bars (4 for an opening): which tune, which chords, and this section's choices
function newSection(E, dk) {
  const r = dk.rng, S = dk.S, T = dk.T, n = dk.secN++, k16 = T.upb / 16;
  if (dk.secM === undefined) dk.secM = 0;
  const sting = S.sting && n === 0, intro = S.intro && n === 0;
  let type, len = 8, prog, base;
  if (sting) { type = 'S'; len = 4; prog = STING[S.sting].prog.slice(); base = STING[S.sting].tune.map(b => b && b.map(x => [Math.round(x[0] * k16), Math.max(1, Math.round(x[1] * k16)), x[2]])); }
  else if (intro) { type = 'I'; len = S.intro; prog = T.prog.A.slice(0, len); base = null; }
  else { if (dk.secM % 4 === 0) dk.form = r.pick(S.forms || FORMS); type = dk.form[dk.secM % 4]; dk.secM++; prog = (S.prog || T.prog[type]).slice(); base = T.tune[type];
    const al = T.alt[type]; if (!S.prog && al && dk.secM > 1) Object.keys(al).forEach(b => { if (r.chance(0.3)) prog[b] = al[b]; }); }
  const first = dk.secM <= 1, mode = sting ? 'full' : S.tune, plain = first || r.chance(0.4);   // the tune comes back as written about two sections in five
  const mask = !base ? [] : mode === 'none' ? [0, 0, 0, 0, 0, 0, 0, 0] : mode === 'frag' ? r.pick(FRAG) : mode === 'ask' ? r.pick([[1, 1, 0, 0, 1, 1, 0, 0], [1, 0, 0, 0, 1, 1, 0, 0], [1, 1, 0, 0, 0, 0, 1, 0]]) : [1, 1, 1, 1, 1, 1, 1, 1];
  const tune = [];
  for (let b = 0; b < len; b++) {
    let bar = base && mask[b] && base[b] ? base[b].map(x => S.prog ? [x[0], x[1], nearTone(x[2], CH[prog[b]])] : x.slice()) : null;   // a state with its own chords bends the tune onto them
    if (bar && !plain && !sting) { const v = r() * 1.6;
      if (v < 0.16) bar = bar.reduce((acc, x) => { if (x[1] >= T.upb * 3 / 8) { acc.push([x[0], x[1] - 4, x[2]], [x[0] + x[1] - 4, 2, upTone(x[2], prog[b] === 'A')], [x[0] + x[1] - 2, 2, x[2]]); } else acc.push(x); return acc; }, []);   // a turn on the long notes
      else if (v < 0.26 && b % 4 !== 0) bar = bar.map(x => [Math.min(T.upb - 1, x[0] + 2), x[1], x[2]]);                                                                                  // late by an eighth
      else if (v < 0.34 && b % 4 === 3) bar = null;                                                                                                                                         // the phrase is left open
      else if (v < 0.42) bar = bar.filter((x, i) => i === 0 || x[1] > 2);                                                                                                                   // plainer
      else if (v < 0.5 && bar.length > 2) { const l = bar[bar.length - 1]; bar[bar.length - 1] = [l[0], l[1], nearTone(l[2] + (r.chance(0.5) ? 3 : -3), CH[prog[b]])]; }              // a different last note
    }
    tune.push(bar);
  }
  dk.sec = { type, len, prog, tune, lv: first ? 0 : r.i(T.leads.length), lo: !first && r.chance(E.th === 3 ? 0.4 : 0.2) ? (r.chance(E.th === 3 ? 0.15 : 0.5) ? 12 : -12) : 0, bv: r.i(4), dv: r.i(6), av: r.i(6), brk: !first && !sting && r.chance(0.16), fill: r.chance(0.75), pedal: !!S.pedal || (!first && r.chance(0.15)), n };
  dk.sb = 0;
}
EP.schedBar = function (dk) {
  const E = this; if (dk.S.drone) { droneTick(E, dk, dk.nextT); dk.nextT += 0.5; return; }
  if (!dk.sec || dk.sb >= dk.sec.len) newSection(E, dk);
  dk.setTempo(); const s = dk.sec, b = dk.sb, t = dk.nextT, name = s.prog[b % s.prog.length], ch = CH[name], u = E.u(), w = E.w();
  dk.spu *= 1 - 0.07 * w * (b / Math.max(1, s.len - 1));                                                     // the tempo runs away through the section, then is pulled back
  E.cur = []; E.cur.t = t; E.cur.spu = dk.spu;
  if (dk.bar === 0 && !dk.S.cut) { I_.kick(E, E.fx, t, 0.16, true); N(E, E.fx, { t, ft: 'highpass', f: 5000, g: 0.025, a: 0.002, d: 1.2 }); }
  if (dk.S.settle && dk.bar === dk.S.settle) { dk.drum = 'main'; E.I = 0.72; E.setI(dk, E.I, t, 0.4); }                // a long celebration eases off after its first statement
  PLAY[E.th](E, dk, t, b, ch, name);
  // the tune
  const bar = s.tune[b];
  if (bar && on(dk, 'lead')) {
    const minor = ['Dm', 'Bb', 'Gm', 'Eb', 'Dsus', 'Edim'].indexOf(name) >= 0, dark = E.rnd >= 4 && minor, flat5 = E.rnd >= 6 && ['Bb', 'Gm', 'Eb', 'Edim'].indexOf(name) >= 0, mode = s.type === 'S' ? 'full' : dk.S.tune, bright = clamp(E.I, 0, 1), lastBar = b === s.len - 1;   // from round 4 E falls to E flat; from round 6 the short A's fall to A flat
    let inst = dk.T.leads[s.lv]; if (mode === 'low') inst = 'chant'; if ((E.th === 3 && E.I > 0.72) || (E.th === 1 && dk.state === 'overreact')) inst = 'brass';
    bar.forEach(x => { let m = x[2] + s.lo; if (dark && ((m - 64) % 12 + 12) % 12 === 0) m -= 1; if (flat5 && x[1] <= dk.upb / 2 && ((m - 69) % 12 + 12) % 12 === 0) m -= 1; const tt = t + x[0] * dk.spu, du = x[1] * dk.spu;
      if (mode === 'low') m = m > 69 ? m - 12 : m;
      if (x[1] <= dk.upb / 2 && dk.rng.chance(0.06 * w)) m += dk.rng.chance(0.5) ? 1 : -1;
      if (E.rnd >= 8 && lastBar) leadNote(E, dk, inst, tt, du, m + 6, 0.4, bright);                                 // from round 8 the last bar of a section is doubled a tritone up                     // a wrong note, a semitone off, on the shorter notes
      leadNote(E, dk, inst, tt, du, m, 1, bright);
      if (mode === 'oct') { leadNote(E, dk, E.th === 2 ? 'bell' : 'saw', tt, du, m + (E.th === 2 ? 0 : 12), 0.5, bright); if (E.th !== 2) chant(E, dk.L.vox.in, { t: tt, f: mf(m - 24 > 45 ? m - 24 : m - 12), g: 0.3, a: 0.05, h: du * 0.85, d: 0.2, vow: 0, pan: 0.2 }); }
    });
  }
  if (u > 0.3 && on(dk, 'vox')) { const X = dk.L.vox.in, n = u > 0.8 ? 3 : u > 0.55 ? 2 : 1; for (let i = 0; i < n; i++) chant(E, X, { t: t + i * 0.09, f: mf(ch.r + [24, 31, 25][i]), g: (i === 2 ? 0.2 : 0.11) * w, a: 0.3, h: dk.upb * dk.spu - 0.5, d: 0.5, vow: i, pan: [0, -0.6, 0.6][i] }); }   // more voices join; the last sings a semitone off
  if (E.rnd >= 8 && b === s.len - 1 && on(dk, 'bass')) V(E, dk.L.bass.in, { t: t + dk.upb * dk.spu * 0.75, f: mf(ch.r + 6), type: 'sawtooth', det: [-8, 8], g: 0.3, a: 0.004, h: dk.upb * dk.spu * 0.15, d: dk.upb * dk.spu * 0.1, lp: 900, lp1: 250, q: 3 });   // and the bass steps to the tritone
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

// ---------- theme 3, Fuse: a muted ticking line in threes and twos, a thin held string, then brass and toms ----------
PLAY[3] = function (E, dk, t, b, ch, name) {
  const s = dk.sec, r = dk.rng, S = dk.S, L = dk.L, I = E.I, sp = dk.spu, at = u => t + u * sp, st = dk.drum || S.drum, last = b === s.len - 1, d9 = (E.rnd - 1) / 8, bar = 16 * sp;
  const hv = st === 'heavy' || (st === 'main' && I > 0.85);
  if (on(dk, 'drums') && st !== 'none') {
    const D = L.drums.in;
    if (!(s.brk && b < 4)) {
      if (hv) { pat(['x..x..x...x.x...', 'x..x..x..xx...x.'][(s.dv + b) % 2], i => I_.kick(E, D, at(i), 0.52)); pat('....x.......x...', i => I_.snare(E, D, at(i), 0.4)); if (b % 2) pat('..........x.x.xx', i => I_.tom(E, D, at(i), 150 - (i - 10) * 9, 0.22, (i - 12.5) * 0.25)); if (b % 4 === 0) I_.crash(E, D, t, 0.16); }
      else if (st === 'main') { pat(['x.....x.....x...', 'x.....x...x.....', 'x..x..x.....x...'][s.dv % 3], i => I_.kick(E, D, at(i), 0.48, true)); if (s.type !== 'I') I_.snare(E, D, at(8), 0.3); if (last && s.fill) pat('............xxxx', i => I_.tom(E, D, at(i), 140 - (i - 12) * 10, 0.14 + 0.04 * (i - 12), (i - 13.5) * 0.3)); }
      else if (st === 'light') { I_.kick(E, D, t, 0.4, true); if (s.dv % 2) I_.rim(E, D, at(12), 0.14); }
      else if (b % 4 === 0) I_.kick(E, D, t, 0.34, true);
    }
    for (let i = 0; i < 16; i++) { const acc = i === 0 || i === 6 || i === 12 || (s.dv > 2 && i === 3); if (!acc && !hv && !(st === 'main' && i % 2 === 0) && !r.chance(st === 'tick' ? 0.12 : 0.3)) continue; if (hv) I_.hat(E, D, at(i), acc ? 0.09 : 0.04, i % 4 === 2); else I_.tick(E, D, at(i), acc ? 0.12 : 0.04 + 0.03 * r(), (i % 3 - 1) * 0.4); }
  }
  if (on(dk, 'bass')) {
    const B = L.bass.in, root = (s.pedal ? 38 : ch.r) + 12, g = 0.3, P = ['x.xx.xx.x.xx.x..', 'x..x..x.x..x.xx.', 'x.x..xx.x.x..x.x', 'xx.x..x.xx.x..x.'][s.bv];
    pat(P, i => { const acc = i === 0 || i === 6 || i === 12, m = root + (i === 14 && s.bv % 2 ? 7 : i === 11 && s.bv > 1 ? 12 : 0); V(E, B, { t: at(i), f: mf(m), type: 'sawtooth', det: [-4, 4], g: g * (acc ? 1 : 0.6), a: 0.002, h: 0, d: sp * 1.1, lp: (acc ? 700 : 420) + 900 * I, lp1: 160, lpt: sp, q: 5 }); });
    V(E, B, { t, f: mf(root - 12), g: g * 0.45, a: 0.004, h: sp * 2, d: sp * 6 });
    if (hv || I > 0.72) pat('x.....x.....x...', i => V(E, B, { t: at(i), f: mf(root - 12), type: 'sawtooth', det: [-8, 8], g: g * 0.8, a: 0.004, h: sp * 3, d: sp * 2, lp: 900, lp1: 250, lpt: sp * 4, q: 3 }));
  }
  if (on(dk, 'pad')) { const P = L.pad.in; if (b >= 4 || I > 0.5) V(E, P, { t, f: mf(name === 'Bb' || name === 'Edim' ? 82 : name === 'C' ? 79 : 81), type: 'sawtooth', det: [-11, 10], g: 0.025, a: 0.6, h: bar - 0.7, d: 0.8, lp: 2400, ftype: 'bandpass', q: 0.8, pan: 0.3, vib: { f: 5.5, c: 7, in: 0.6 } });
    if (I > 0.2 || d9 > 0.5) [ch.n[0], ch.n[2]].forEach((m, i) => V(E, P, { t, f: mf(m - 12), type: 'sawtooth', det: [-8, 8], g: 0.07, a: 0.4, h: bar - 0.5, d: 0.6, lp: (350 + 1100 * I) * (1 - 0.3 * d9), pan: i ? 0.4 : -0.4 })); }
  if (on(dk, 'arp')) { const A = L.arp.in, pos = [[4, 10, 14], [3, 9], [6, 12, 15], [2, 8, 14], [10, 13], [4, 7, 12]][s.av]; pos.forEach((u, i) => V(E, A, { t: at(u), f: mf(ch.n[(i + s.av) % 3] + 12), g: 0.07, a: 0.002, d: 0.5, pan: i % 2 ? 0.5 : -0.5, fm: { r: 3, i: 1.5, i1: 0.05, d: 0.15 } })); }
  if (on(dk, 'vox')) { const X = L.vox.in; [ch.r + 12, ch.r + 19].forEach((m, i) => chant(E, X, { t, f: mf(m), g: 0.22, a: 0.4, h: bar - 0.6, d: 0.5, vow: 2 - i, pan: i ? 0.4 : -0.4 })); }
  if (on(dk, 'bell') && (hv || I > 0.7)) { const X = L.bell.in; pat('x.....x.....x...', i => ch.n.forEach((m, k) => V(E, X, { t: at(i), f: mf(m), type: 'sawtooth', det: [-12, 0, 11], g: 0.1, a: 0.012, h: sp * 1.5, d: sp * 2.5, lp: 600, lp1: 3000, lpt: 0.07, q: 1.2, pan: (k - 1) * 0.6 }))); }
};

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
  const D = dk.dr; if (!D) return; const mix = DMIX[E.th], k = tau || 0.3, d9 = (E.rnd - 1) / 8;
  D.padG.gain.setTargetAtTime(mix[0] * (0.05 + 0.1 * I), t, k); D.filt.frequency.setTargetAtTime((300 + 2600 * I * I) * (1 - 0.3 * d9), t, k);
  D.lfo.frequency.setTargetAtTime(1.5 + 9 * I, t, k); D.lfoG.gain.setTargetAtTime(0.5 * ramp(I, 0.12, 0.4), t, k);
  D.voices.forEach(v => v.g.gain.setTargetAtTime(0.22 * ramp(I, v.th - 0.1 - 0.3 * d9, 0.12), t, k)); D.f1.frequency.setTargetAtTime(480 + 240 * I, t, k); D.f2.frequency.setTargetAtTime(860 + 320 * I, t, k);
  D.hiG.gain.setTargetAtTime(mix[2] * 0.05 * ramp(I, 0.4, 0.5), t, k); D.hl.frequency.setTargetAtTime(6 + 9 * I, t, k); D.alarm.gain.setTargetAtTime(ramp(I, 0.82 - 0.35 * d9, 0.12) * (0.6 + 0.4 * d9), t, k);
  D.nG.gain.setTargetAtTime(mix[3] * 0.06 * ramp(I, 0.55, 0.45), t, k); D.nf.frequency.setTargetAtTime(600 + 4200 * I, t, k);
  D.subG.gain.setTargetAtTime(mix[4] * 0.1 * ramp(I, 0.25, 0.75), t, k);
}
// the bed moves to the effects' chord
function droneChord(E, dk, ix, t) { const D = dk.dr; if (!D) return; const ch = CH[SFXCH[ix]]; D.tune.forEach(x => x.o.frequency.setTargetAtTime(mf(nearTone(x.m, ch)), t, 0.05)); D.sub.frequency.setTargetAtTime(mf(ch.r + 12), t, 0.05); }
// small things between the steps, written half a second at a time
function droneTick(E, dk, t) {
  const D = dk.dr, I = E.I; if (!D) return;
  if (E.th === 3) { const n = Math.round(2 + 10 * I); for (let i = 0; i < n; i++) I_.tick(E, D.one, t + i * 0.5 / n, 0.035 + 0.05 * I, (i % 3 - 1) * 0.5); }
  if (E.th === 1 && I > 0.3) { const n = I > 0.7 ? 8 : 4; for (let i = 0; i < n; i++) I_.hat(E, D.one, t + i * 0.5 / n, 0.02 + 0.03 * I, false, (i % 2 ? 0.4 : -0.4)); }
  if (E.th === 2 && I > 0.5 && dk.rng.chance(0.5)) I_.shake(E, D.one, t + dk.rng() * 0.4, 0.05, dk.rng() - 0.5);
}
// a step of the chain: the chord follows the effects, and one note of the theme's tune is sung low, bent to the chord
EP.step = function (t, n) {
  const E = this, dk = E.deck; n = Math.max(1, Math.round(n) || 1); E.stepN = n; E.cix = Math.floor((n - 1) / 3) % 4;
  E.I = clamp(n / 12, 0.08, 1); if (!dk) return; E.setI(dk, E.I, t, 0.2); if (!dk.S.drone || !dk.dr) return;
  droneChord(E, dk, E.cix, t);
  const flat = TH[E.th].tune.A.reduce((a, b) => a.concat(b), []), x = flat[(n - 1) % flat.length], ch = CH[SFXCH[E.cix]], m = nearTone(x[2] - 12, ch), g = 0.1 + 0.12 * E.I;
  if (E.th === 2) { I_.bell(E, dk.dr.one, t, mf(m + 12), g * 0.9, 2.2, 0.2); chant(E, dk.dr.one, { t, f: mf(m - 12), g: g * 1.3, a: 0.06, h: 0.35, d: 0.5, vow: 0, pan: -0.2 }); }
  else if (E.th === 1) V(E, dk.dr.one, { t, f: mf(m), type: 'sawtooth', det: [-9, 9], g: g * 0.9, a: 0.01, h: 0.2, d: 0.5, lp: 600 + 1800 * E.I, lp1: 400, lpt: 0.5, q: 3, pan: 0.2 });
  else V(E, dk.dr.one, { t, f: mf(m), g: g, a: 0.003, h: 0.1, d: 0.7, pan: -0.2, fm: { r: 2, i: 2.5, i1: 0.3, d: 0.3 } });
};

// ---------- the clock ----------
EP.start = function (state, t) {
  const E = this, S = ST[state], old = E.deck; E.pending = null;
  if (old) E.fadeOut(old, t, S.cut ? S.cut / 3 : Math.max(0.12, old.upb * old.spu / 7 || 0.2));
  E.I = S.I; E.state = state; E.deck = E.mkDeck(state, t + (S.cut ? 0.02 : 0), S.fadeIn || (old && !S.cut ? [0.6, 0.12] : null));
  if (state === 'overreact' && !E.dry) { I_.crash(E, E.fx, t + 0.02, 0.07); }
};
EP.cmd = function (t, name, a) {
  const E = this; a = a || [];
  if (name === 'state') { const s = a[0]; if (!ST[s]) return; if (E.state === s && !E.pending) return; if (E.pending === s) return;
    if (!E.deck || ST[s].cut || E.deck.S.drone) E.start(s, t + 0.01);
    else { E.pending = s; const tb = E.deck.nextT; if (tb - t > 0.45 && !E.dry) N(E, E.fx, { t, ft: 'bandpass', f: 500, f1: 3200, fT: tb - t, q: 1.2, g: 0.045, a: tb - t, d: 0.05 }); } }
  else if (name === 'intensity') { E.I = clamp(+a[0] || 0, 0, 1); if (E.deck) E.setI(E.deck, E.I, t, 0.25); }
  else if (name === 'step') E.step(t, a[0]);
  else if (name === 'round') { E.rnd = clamp(Math.round(+a[0]) || 1, 1, 9); }
  else if (name === 'volume') { E.vol = clamp(+a[0], 0, 1); E.volG.gain.setTargetAtTime(E.vol, t, 0.05); }
  else if (name === 'duck') { const p = E.duckG.gain; p.setTargetAtTime(clamp(a[0] === undefined ? 0.4 : +a[0], 0, 1), t, 0.01); p.setTargetAtTime(1, t + 0.04, ((a[1] || 300) / 1000) / 3); }
  else if (name === 'theme') { const k = clamp(Math.round(+a[0]) || 1, 1, 3); if (k !== E.th) { E.thNext = k; if (E.deck && E.state) { if (E.deck.S.drone) { E.th = k; E.thNext = 0; E.start(E.state, t + 0.01); } else E.pending = E.state; } else { E.th = k; E.thNext = 0; } } }
  else if (name === 'stop') { if (E.deck) E.fadeOut(E.deck, t, 0.15); E.deck = null; E.state = null; E.pending = null; }
};
// write everything that begins before `until`
EP.advance = function (until) {
  const E = this; let guard = 0;
  while (E.deck && E.deck.nextT < until && guard++ < 4000) {
    if (E.pending) { const s = E.pending, tb = E.deck.nextT; if (E.thNext) { E.th = E.thNext; E.thNext = 0; } const keepI = s === E.state ? E.I : null; E.state = null; E.start(s, tb); if (keepI !== null) { E.I = keepI; E.setI(E.deck, keepI, tb, 0.01); } continue; }
    E.schedBar(E.deck);
  }
};
// the most voices sounding at once (from the spans of every voice written)
EP.peakNodes = function () { const ev = []; for (let i = 0; i < this.spans.length; i += 3) { ev.push([this.spans[i], this.spans[i + 2]], [this.spans[i + 1], -this.spans[i + 2]]); } ev.sort((a, b) => a[0] - b[0] || a[1] - b[1]); let cur = 0, pk = 0; ev.forEach(e => { cur += e[1]; if (cur > pk) pk = cur; }); return pk; };

// ====================================================================================================================
// the live player
// ====================================================================================================================
let LE = null, timer = null, theme = 1, volume = 0.7, runSeed = Math.floor(Math.random() * 1e9) + 1, want = null, wantI = null, wantR = 1;
try { const s = JSON.parse(root.localStorage.getItem(KEY) || 'null'); if (s) { if (s.theme) theme = clamp(Math.round(+s.theme) || 1, 1, 3); if (typeof s.volume === 'number') volume = clamp(s.volume, 0, 1); } const q = root.location && root.location.search ? new URLSearchParams(root.location.search).get('music') : null; if (q !== null && q !== '') theme = clamp(Math.round(+q) || 1, 1, 3); } catch (e) { /* defaults */ }
function persist() { try { root.localStorage.setItem(KEY, JSON.stringify({ theme, volume })); } catch (e) { /* storage blocked */ } }
function live() {
  if (LE) return LE;
  let c = cap; if (!c && AA.sfx && AA.sfx.resume) { try { AA.sfx.resume(); } catch (e) { /* no effects */ } c = cap; }
  if (!c) { const AC = root.AudioContext || root.webkitAudioContext; if (!AC) return null; try { c = new AC(); } catch (e) { return null; }
    const wake = () => { if (c.state === 'suspended' && c.resume) c.resume(); }; ['pointerdown', 'keydown'].forEach(ev => { try { root.addEventListener(ev, wake, { passive: true }); } catch (e) { /* no window */ } }); }
  LE = new Engine(c, { theme, volume, seed: runSeed }); LE.rnd = wantR; LE.attach(c.__ovsb ? c.__ovsb.bed : null);
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
  // the round of the run, 1 to 9: later rounds are faster and darker
  round(n) { if (n === undefined) return wantR; wantR = clamp(Math.round(+n) || 1, 1, 9); if (LE) LE.cmd(now(LE), 'round', [wantR]); },
  volume(v) { if (v === undefined) return volume; volume = clamp(+v, 0, 1); persist(); if (LE) LE.cmd(now(LE), 'volume', [volume]); },
  // push the music down for a moment (depth 0 to 1, back up over ms); not needed when the effects' bus is shared
  duck(depth, ms) { if (LE) LE.cmd(now(LE), 'duck', [depth, ms]); },
  stop() { want = null; if (LE) LE.cmd(now(LE), 'stop'); },
  theme(k) { if (k === undefined) return theme; theme = clamp(Math.round(+k) || 1, 1, 3); persist(); if (LE) LE.cmd(now(LE), 'theme', [theme]); return theme; },
  // the seed of the run: the same seed gives the same choices; a new run should give a new one
  seed(n) { if (n === undefined) return runSeed; runSeed = Math.floor(Math.abs(+n)) || 1; if (LE) LE.seed = runSeed; },
  info() { return LE ? { theme: LE.th, state: LE.state, pending: LE.pending, intensity: LE.I, round: LE.rnd, shared: !!LE.shared, nodes: LE.nodes, bars: LE.log.length } : null; },

  _live() { return LE; },
  // -- test hooks: no speakers needed --
  // a timeline [{ t: ms, n: 'state' | 'intensity' | 'step' | 'round' | 'theme' | 'volume' | 'duck' | 'stop', a: [...] }] rendered offline.
  // opts: theme, seed, round, volume, solo (one layer only), rate. Resolves { l, r, bars, nodes, peak, ms }.
  _renderTimeline(events, secs, opts) {
    const OC = (root.OfflineAudioContext && root.OfflineAudioContext.__orig) || root.OfflineAudioContext || root.webkitOfflineAudioContext; if (!OC) return Promise.reject(new Error('no OfflineAudioContext'));
    opts = opts || {}; const sr = opts.rate || 44100, off = new OC(2, Math.ceil(sr * secs), sr), E = new Engine(off, { theme: opts.theme || theme, seed: opts.seed || 1, volume: opts.volume === undefined ? 0.7 : opts.volume, solo: opts.solo });
    E.rnd = opts.round || 1; E.attach(null); run(E, events, secs, off);
    const t0 = Date.now(); return off.startRendering().then(b => ({ l: b.getChannelData(0), r: b.getChannelData(1), bars: E.log, nodes: E.nodes, peak: E.peakNodes(), ms: Date.now() - t0 }));
  },
  // the same without sound: only the bar log (what was written, bar by bar), for counting repeats over a long time
  _score(events, secs, opts) {
    const OC = (root.OfflineAudioContext && root.OfflineAudioContext.__orig) || root.OfflineAudioContext || root.webkitOfflineAudioContext; opts = opts || {};
    const off = new OC(2, 4410, 44100), E = new Engine(off, { theme: opts.theme || theme, seed: opts.seed || 1, dry: true }); E.rnd = opts.round || 1; run(E, events, secs); return E.log;
  },
  // music and effects together through the effects' own bus: sfxEvents as AA.sfx._renderTimeline takes them. Resolves { l, r }.
  _renderWithSfx(events, sfxEvents, secs, opts, sfxOpts) {
    if (!AA.sfx || !AA.sfx._renderTimeline) return Promise.reject(new Error('no sfx'));
    opts = opts || {}; const key = root.OfflineAudioContext ? 'OfflineAudioContext' : 'webkitOfflineAudioContext', O = root[key]; let off = null, E = null;
    const W = function (a, b, c2) { off = new O(a, b, c2); return off; }; W.prototype = O.prototype; W.__orig = O; root[key] = W;
    const fns = { __mus() { E = new Engine(off, { theme: opts.theme || theme, seed: opts.seed || 1, volume: opts.volume === undefined ? 0.7 : opts.volume }); E.rnd = opts.round || 1; if (!opts.mute) run(E, events, secs, off); }, __att() { if (E) E.attach(off.__ovsb ? off.__ovsb.bed : null); music._lastShared = !!(E && E.shared); } };
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
  upTo(1); for (let T = 1; T < secs; T++) off.suspend(T).then(() => { upTo(T + 1); off.resume(); });
}
AA.music = music;
})(typeof globalThis !== 'undefined' ? globalThis : window);
