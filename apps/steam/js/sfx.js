(function (root) {
'use strict';
const AA = root.AA = root.AA || {};

// Lab sounds, all synthesized in code: no audio files.
// Every voice goes to one master bus: master gain -> limiter (compressor) -> soft clip -> speakers.
// Loudness ladder (multiplies a voice's own gain): ui quiet, ring medium, flag loud, over loudest.
const LADDER = { ui: 0.5, ring: 0.8, flag: 1.1, over: 2.4 };
const KEY = 'overreact.sfx';
const SLV = 1.2;          // the styled bus trim (times the volume)
let atOff = 0, ctx = null, master = null, noiseBuf = null, noiseFor = null, muted = false, volume = 0.8, hooked = false;

try { const s = JSON.parse(root.localStorage.getItem(KEY) || 'null'); if (s) { muted = !!s.muted; if (typeof s.volume === 'number') volume = Math.max(0, Math.min(1, s.volume)); } } catch (e) { /* storage blocked */ }
function persist() { try { root.localStorage.setItem(KEY, JSON.stringify({ muted, volume })); } catch (e) { /* ignore */ } }
function level() { return muted ? 0 : volume; }

function buildBus(c) {
  const m = c.createGain(), lim = c.createDynamicsCompressor(), shaper = c.createWaveShaper();
  lim.threshold.value = -6; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12;
  const n = 1024, curve = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; curve[i] = Math.tanh(x * 1.2) / Math.tanh(1.2) * 0.98; }
  shaper.curve = curve;
  m.connect(lim); lim.connect(shaper); shaper.connect(c.destination);
  m.gain.value = 0.7 * level();
  return m;
}
function ac() {
  if (!ctx) {
    try { ctx = new (root.AudioContext || root.webkitAudioContext)(); master = buildBus(ctx); } catch (e) { ctx = null; master = null; }
  }
  if (ctx && ctx.state === 'suspended' && ctx.resume) ctx.resume();
  return ctx;
}
function applyLevel() { if (ctx && master) master.gain.setTargetAtTime(0.7 * level(), ctx.currentTime, 0.02); if (ctx && ctx.__ovsb) ctx.__ovsb.trim.gain.setTargetAtTime(SLV * level(), ctx.currentTime, 0.02); }
// resume on the first real gesture, so the first sounds are not lost to the autoplay block
function hook() {
  if (hooked || !root.addEventListener) return; hooked = true;
  const go = () => { ac(); root.removeEventListener('pointerdown', go, true); root.removeEventListener('keydown', go, true); };
  root.addEventListener('pointerdown', go, true); root.addEventListener('keydown', go, true);
}
hook();

function noise(c) {
  if (noiseFor !== c) {
    noiseFor = c; noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}
function amp(o) { return (o.lv || 1) * (o.gain === undefined ? 1 : o.gain); }
// a filtered burst of noise. o: freq, freqEnd, q, type, dur, gain, lv, attack, delay
function hiss(o) {
  const c = ac(); if (!c || muted) return;
  const t = c.currentTime + atOff + (o.delay || 0), src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), a = amp(o);
  src.buffer = noise(c); src.loop = true; f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.freq, t);
  if (o.freqEnd) f.frequency.exponentialRampToValueAtTime(o.freqEnd, t + o.dur);
  f.Q.value = o.q || 1;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(a, 0.0002), t + (o.attack || 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  src.connect(f); f.connect(g); g.connect(master); src.start(t, Math.random()); src.stop(t + o.dur + 0.05);
}
// an oscillator. o: freq, freqEnd, type, dur, gain, lv, delay, attack, lp (low-pass cutoff), lpEnd, lpq, detune
function tone(o) {
  const c = ac(); if (!c || muted) return;
  const t = c.currentTime + atOff + (o.delay || 0), osc = c.createOscillator(), g = c.createGain(), a = amp(o);
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.freq, t);
  if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, t + o.dur);
  if (o.detune) osc.detune.value = o.detune;
  if (o.attack) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(a, 0.0002), t + o.attack); } else g.gain.setValueAtTime(Math.max(a, 0.0002), t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  let tail = osc;
  if (o.lp) {
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = o.lpq || 0.7; f.frequency.setValueAtTime(o.lp, t);
    if (o.lpEnd) f.frequency.exponentialRampToValueAtTime(o.lpEnd, t + o.dur);
    osc.connect(f); tail = f;
  }
  tail.connect(g); g.connect(master); osc.start(t); osc.stop(t + o.dur + 0.02);
}

// ---------- music: a sixteen-step loop scheduled a little ahead of the clock (the game does not start it) ----------
const BPM = 112, STEP = 60 / BPM / 4, ROOTS = [55, 55, 65.41, 49], ARP = [0, 7, 12, 15, 12, 7, 19, 12];
let music = true, started = false, mlevel = 0.15, nextT = 0, stepN = 0, bus = null, timer = null;
function mnote(type, freq, t, dur, gain, freqEnd) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.03);
}
function mhat(t, gain) {
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = noise(ctx); f.type = 'highpass'; f.frequency.value = 7000;
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  src.connect(f); f.connect(g); g.connect(bus); src.start(t, Math.random()); src.stop(t + 0.06);
}
function schedule() {
  if (!ctx || !bus) return;
  bus.gain.setTargetAtTime(music && !muted ? 0.5 : 0, ctx.currentTime, 0.08);
  if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05;
  while (nextT < ctx.currentTime + 0.2) {
    const s = stepN % 16, r = ROOTS[(stepN >> 4) % 4], t = nextT;
    if (s % 4 === 0 || s === 10) mnote('triangle', r, t, 0.22, 0.2);
    if (mlevel > 0.3 && s % 4 === 0) mnote('sine', 130, t, 0.14, 0.34, 42);
    if (mlevel > 0.5 && s % 2 === 1) mhat(t, s % 4 === 3 ? 0.07 : 0.04);
    if (mlevel > 0.7) mnote('square', r * 4 * Math.pow(2, ARP[s % 8] / 12), t, 0.1, 0.035);
    if (mlevel > 0.9 && s % 4 === 2) mhat(t, 0.09);
    nextT += STEP; stepN++;
  }
}
function startMusic() {
  if (started) return;
  const c = ac(); if (!c) return;
  started = true; bus = c.createGain(); bus.gain.value = 0; bus.connect(master);
  timer = setInterval(schedule, 60);
}

// ---------- foundation sounds ----------
const PENTA = [0, 2, 4, 7, 9];            // major pentatonic: every ring lands on a pleasant note
const BASE = 261.63;                       // C4
function ringFreq(n) {
  const step = Math.max(0, Math.round(n) - 1);
  let oct = Math.floor(step / PENTA.length);
  if (oct > 3) oct = 2 + (oct % 2);        // no cap on rings: past the top it keeps stepping through the top two octaves
  return { f: BASE * Math.pow(2, oct + PENTA[step % PENTA.length] / 12), oct };
}
// a soft bell: sine plus a quiet partial at 2.76 times
function bell(f, g, dur, L, delay) {
  tone({ freq: f, dur, gain: g, lv: L, attack: 0.002, delay });
  tone({ freq: f * 2.76, dur: dur * 0.45, gain: g * 0.22, lv: L, attack: 0.002, delay });
}
function chord(freqs, dur, g, L, type, delay) { freqs.forEach(f => { tone({ freq: f, dur, gain: g, lv: L, type: type || 'triangle', attack: 0.03, delay, lp: 2400 }); }); }

// =====================================================================================================================
// THE STYLES (docs/SOUND2.md). AA.sfx.style(0 | 1 | 2 | 3 | 4), or ?sfx=0..4 in the address; saved under overreact.sfx.style5
// (a new key, so a style saved by an earlier build does not hide the new default).
//   4 lab band (the default; it began as an orchestra, and none of that is left): lab sounds, a kit and hand drums, vibraphone, glass,
//     electric piano, bass and a low drone (further down; docs/SOUND3.md).
//   0 today: the set above, unchanged.
//   1 bench: glass, wood and metal struck on a lab bench, tuned like a marimba and a gamelan, a thump under every step.
//   2 arcade: synths and drums in D: a rising arpeggio over a bass that moves every three steps, a snare that rolls faster,
//     a riser, a resolved chord with a sub drop.
//   3 boiler: pressure: knocks and steam chuffs that speed up, bubbles, a kettle whistle that climbs, a held breath, then a
//     valve that lets go with a huge low boom and a ringing boiler.
// Each styled voice goes to its own stereo bus: hits and a ducked bed -> breath gain -> trim -> limiter -> soft clip, with a
// small room (two allpass diffusers into a four-line feedback delay network) on a send. Every call is still self-contained
// in time (it schedules from c.currentTime + atOff), so a logged timeline renders offline; the only memory is the beat clock
// (the time of the last step, to fit the fills between steps), kept on the bus of that context.
// =====================================================================================================================
const SKEY = 'overreact.sfx.style5', SNAMES = ['today', 'bench', 'arcade', 'boiler', 'lab band'], DEFAULT_STYLE = 4;
const cl3 = v => { v = Math.round(+v); return v >= 0 && v <= 4 ? v : DEFAULT_STYLE; };
let STY = DEFAULT_STYLE;
try { const q = root.location && root.location.search ? new URLSearchParams(root.location.search).get('sfx') : null; if (q !== null && q !== '') STY = cl3(q); else { const s = root.localStorage.getItem(SKEY); if (s !== null) STY = cl3(s); } } catch (e) { /* default */ }
let C = null, SB = null, seed = 1;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mf = m => 440 * Math.pow(2, (m - 69) / 12);
const HASPAN = typeof root.StereoPannerNode !== 'undefined';

function softCurve() { const n = 4096, cu = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1, a = Math.abs(x); cu[i] = Math.sign(x) * (a < 0.75 ? a : 0.75 + 0.23 * Math.tanh((a - 0.75) / 0.23)); } return cu; }
// drive k: slope 1 at zero, a ceiling of 1/k, so loud parts round off into harmonics a phone speaker can play
function satCurve(k) { const n = 2048, cu = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; cu[i] = Math.tanh(x * k) / k; } return cu; }
function nbuf(c, col) {
  const key = '__ovn' + (col || 'w'); if (c[key]) return c[key];
  const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0); let s = 7, b0 = 0, b1 = 0, b2 = 0, br = 0;
  const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 1073741823 - 1; };
  for (let i = 0; i < d.length; i++) { const w = r();
    if (col === 'p') { b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; }
    else if (col === 'b') { br = (br + 0.02 * w) / 1.02; d[i] = br * 3.5; } else d[i] = w; }
  c[key] = b; return b;
}
// the styled bus of a context, built once
function sbOf(c) {
  if (c.__ovsb) return c.__ovsb;
  const G = v => { const g = c.createGain(); if (v !== undefined) g.gain.value = v; return g; }, sb = { sat: {}, clk: { last: -99, P: 0.8 } };
  sb.sum = G(); sb.bed = G(); sb.duck = G(); sb.breath = G(); sb.trim = G(SLV * level());
  const lim = c.createDynamicsCompressor(); lim.threshold.value = -6; lim.knee.value = 4; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.16;
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 32; hp.Q.value = 0.6;
  const clip = c.createWaveShaper(); clip.curve = softCurve(); clip.oversample = '4x';
  sb.bed.connect(sb.duck); sb.duck.connect(sb.sum); sb.sum.connect(hp); hp.connect(sb.breath); sb.breath.connect(sb.trim); sb.trim.connect(lim); lim.connect(clip); clip.connect(c.destination);
  sb.lim = lim; sb.clip = clip;
  // the room: pre-delay, two Schroeder allpasses, six damped feedback combs (three to each side), one more allpass a side.
  // (A Hadamard-mixed delay network was tried first: in Chrome it decayed far slower than its gains say, and with a low-pass in
  // the loop it grew without end; independent combs with a high shelf decay exactly as set.)
  sb.rin = G(); sb.rin.channelCount = 1; sb.rin.channelCountMode = 'explicit';
  const ap = (x, d, g) => { const v = G(), dl = c.createDelay(0.1), fb = G(g), ff = G(-g), y = G(); dl.delayTime.value = d; x.connect(v); v.connect(dl); dl.connect(fb); fb.connect(v); v.connect(ff); ff.connect(y); dl.connect(y); return y; };
  const pre = c.createDelay(0.2); pre.delayTime.value = 0.012; sb.rin.connect(pre); const x = ap(ap(pre, 0.0051, 0.6), 0.0123, 0.55);
  const D = [0.0253, 0.0269, 0.0290, 0.0307, 0.0322, 0.0338], sideL = G(), sideR = G();
  sb.fb = []; sb.D = D;
  D.forEach((d, i) => { const s = G(), dl = c.createDelay(0.1), sh = c.createBiquadFilter(), g = G(Math.pow(10, -3 * d / 1.5)); dl.delayTime.value = d; sh.type = 'highshelf'; sh.frequency.value = 3200; sh.gain.value = -2.5; x.connect(s); s.connect(dl); dl.connect(sh); sh.connect(g); g.connect(s); g.connect(i % 2 ? sideR : sideL); sb.fb.push(g); });
  const mg = c.createChannelMerger(2), ret = G(0.33); ap(sideL, 0.0126, 0.5).connect(mg, 0, 0); ap(sideR, 0.0100, 0.5).connect(mg, 0, 1); mg.connect(ret); ret.connect(sb.sum);
  c.__ovsb = sb; return sb;
}
// the room's decay time (seconds to -60 dB), changed from time t
function roomRT(t, rt, tau) { SB.fb.forEach((g, i) => g.gain.setTargetAtTime(Math.pow(10, -3 * SB.D[i] / rt), t, tau || 0.05)); }
function bloom(t, rt, hold) { roomRT(t, rt, 0.02); roomRT(t + hold, 1.5, 0.4); }
// the bed (pads, drones, risers) dips under a hit and comes back
function duck(t, depth, rel, hold) { const p = SB.duck.gain; p.setTargetAtTime(depth, t, 0.004); p.setTargetAtTime(1, t + (hold || 0.03), (rel || 0.2) / 3); }
// the held breath: everything falls to near silence from t0 and comes back at t1 (the hit)
function breathe(t0, t1) { const p = SB.breath.gain; p.setTargetAtTime(0.012, t0, 0.018); p.setValueAtTime(1, t1); }
function shaper(k) { const key = k.toFixed(2); if (!SB.sat[key]) SB.sat[key] = satCurve(k); const w = C.createWaveShaper(); w.curve = SB.sat[key]; w.oversample = '2x'; return w; }
function begin() { const c = ac(); if (!c || muted) return null; C = c; SB = sbOf(c); return c.currentTime + atOff; }
function filt(n, o, t, end) {
  const c = C, f = (type, fr, fr1, ft, q) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.setValueAtTime(fr, t); if (fr1) b.frequency.exponentialRampToValueAtTime(fr1, t + (ft || end - t)); b.Q.value = q == null ? 0.7 : q; n.connect(b); n = b; };
  if (o.lp) f('lowpass', o.lp, o.lp1, o.lpt, o.q); if (o.hp) f('highpass', o.hp, o.hp1, o.hpt, 0.7); if (o.bp) f('bandpass', o.bp, o.bp1, o.bpt, o.bq || 1); if (o.pk) f('peaking', o.pk, null, null, 1.2); if (o.pk && o.pkg) n.gain.value = o.pkg;
  return n;
}
function envelope(g, o, t, end) {
  const a = Math.max(0.0005, o.a == null ? 0.002 : o.a), h = o.h || 0, pk = Math.max(1e-5, o.g);
  if (o.ax) { g.gain.setValueAtTime(pk * 0.002, t); g.gain.exponentialRampToValueAtTime(pk, t + a); } else { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + a); }
  if (h) g.gain.setValueAtTime(pk, t + a + h);
  if (o.cut) { g.gain.linearRampToValueAtTime(0, end); } else { g.gain.exponentialRampToValueAtTime(pk * 0.001, end); g.gain.setValueAtTime(0, end + 0.004); }
}
function route(n, o, t, stop) {
  const c = C; let p = n;
  if (o.trem) { const tg = c.createGain(), l = c.createOscillator(), lg = c.createGain(); tg.gain.value = 1 - o.trem.d / 2; l.frequency.value = o.trem.f; lg.gain.value = o.trem.d / 2; l.connect(lg); lg.connect(tg.gain); p.connect(tg); p = tg; l.start(t); l.stop(stop); }
  if (o.rm) { const rg = c.createGain(), l = c.createOscillator(), mix = c.createGain(), dry = c.createGain(); rg.gain.value = 0; l.frequency.setValueAtTime(o.rm.f, t); l.connect(rg.gain); p.connect(rg); p.connect(dry); dry.gain.value = 1 - o.rm.mix; mix.gain.value = o.rm.mix; rg.connect(mix); const s = c.createGain(); dry.connect(s); mix.connect(s); p = s; l.start(t); l.stop(stop); }
  if (o.sat) { const w = shaper(o.sat); p.connect(w); p = w; }
  if (HASPAN && (o.pan || o.pan1)) { const pn = c.createStereoPanner(); pn.pan.setValueAtTime(clamp(o.pan || 0, -1, 1), t); if (o.pan1 != null) pn.pan.linearRampToValueAtTime(clamp(o.pan1, -1, 1), stop); p.connect(pn); p = pn; }
  p.connect(o.bed ? SB.bed : SB.sum);
  if (o.rev) { const s = c.createGain(); s.gain.value = o.rev; p.connect(s); s.connect(SB.rin); }
}
// one oscillator voice. o: t, f, f1 (glide to), ft (glide time), type, det (cents), g, a, ax (exponential attack), h (hold), d (decay
// to -60 dB), cut (linear fade instead), lp/lp1/lpt/q, hp, bp/bq, fm { r, i, i1, d } (modulator ratio, index, end index, time),
// vib { f, c, in }, trem { f, d }, rm { f, mix } (ring modulation), sat (drive), pan/pan1, rev (room send), bed (ducked bus)
function V(o) {
  const c = C, t = o.t, a = Math.max(0.0005, o.a == null ? 0.002 : o.a), end = t + a + (o.h || 0) + (o.d || 0.3), stop = end + 0.03;
  const osc = c.createOscillator(); osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, t);
  if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + (o.ft || (end - t)));
  if (o.det) osc.detune.setValueAtTime(o.det, t);
  if (o.fm) { const m = c.createOscillator(), mg = c.createGain(), I = o.f * o.fm.r * o.fm.i; m.frequency.setValueAtTime(o.f * o.fm.r, t); if (o.f1) m.frequency.exponentialRampToValueAtTime(o.f1 * o.fm.r, t + (o.ft || (end - t))); mg.gain.setValueAtTime(I, t); mg.gain.exponentialRampToValueAtTime(Math.max(0.01, I * (o.fm.i1 == null ? 0.02 : o.fm.i1)), t + (o.fm.d || (end - t))); m.connect(mg); mg.connect(osc.frequency); m.start(t); m.stop(stop); }
  if (o.vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib.f; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(o.vib.c, t + (o.vib.in || 0.04)); l.connect(lg); lg.connect(osc.detune); l.start(t); l.stop(stop); }
  const n = filt(osc, o, t, end), g = c.createGain(); envelope(g, o, t, end); n.connect(g); route(g, o, t, stop);
  osc.start(t); osc.stop(stop);
}
// a filtered noise voice. o: t, col ('w' white, 'p' pink, 'b' brown), ft (filter type), f, f1, fT, q, ft2/f2/q2 (a second filter),
// rate (playback rate), and the envelope, pan, room and bed keys of V
function N(o) {
  const c = C, t = o.t, a = Math.max(0.0005, o.a == null ? 0.002 : o.a), end = t + a + (o.h || 0) + (o.d || 0.2), stop = end + 0.03, src = c.createBufferSource();
  src.buffer = nbuf(c, o.col); src.loop = true; if (o.rate) src.playbackRate.value = o.rate;
  let n = src; const add = (type, f, f1, fT, q) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.setValueAtTime(f, t); if (f1) b.frequency.exponentialRampToValueAtTime(f1, t + (fT || end - t)); b.Q.value = q == null ? 0.8 : q; n.connect(b); n = b; };
  if (o.ft) add(o.ft, o.f, o.f1, o.fT, o.q); if (o.ft2) add(o.ft2, o.f2, o.f21, o.fT, o.q2);
  const g = c.createGain(); envelope(g, o, t, end); n.connect(g); route(g, o, t, stop);
  src.start(t, rnd() * 1.6); src.stop(stop);
}
// a kick: a sine whose pitch falls fast (f0 to f1 in pt), a harmonic an octave up, drive for a phone speaker, a click on top
function K(o) {
  const pt = o.pt || 0.05;
  V({ t: o.t, f: o.f0, f1: o.f1, ft: pt, g: o.g * 0.8, a: 0.0008, d: o.d, h: o.h, sat: o.sat, pan: o.pan });
  if (o.harm) V({ t: o.t, f: o.f0 * 2, f1: o.f1 * 2, ft: pt, g: o.g * o.harm * 0.9, a: 0.0008, d: o.d * 0.45, sat: o.sat, pan: o.pan });
  if (o.click) N({ t: o.t, ft: 'highpass', f: 1600, g: o.g * o.click, a: 0.0003, d: 0.009, pan: o.pan });
}
// detuned unison: n voices spread over spread cents and width of stereo
function U(o, n, spread, width) { for (let i = 0; i < n; i++) { const k = n === 1 ? 0 : i / (n - 1) * 2 - 1; V(Object.assign({}, o, { det: (o.det || 0) + k * spread, pan: clamp((o.pan || 0) + k * width, -1, 1), g: o.g / Math.sqrt(n) })); } }

// ---------- the beat clock and the harmony shared by the styles ----------
// clk: at a step's hit, the time to the next step is guessed from the last gap (steps shrink), so fills land between hits
function clk(t, n) { const k = SB.clk; let gap = t - k.last; if (n <= 1 || gap > 2.4 || gap <= 0.05) gap = k.P0 || 0.86; k.last = t; k.n = n; k.P = gap; return clamp(gap * 0.94, 0.16, 1.1); }
// I vi IV V in D, three steps a chord; the last step always resolves to I
const PROG = [[62, 66, 69], [59, 62, 66], [55, 59, 62], [57, 61, 64]], ROOT = [50, 47, 43, 45];
const chordIx = (n, last) => last ? 0 : Math.floor((Math.max(1, n) - 1) / 3) % 4;
// the melody climbs one chord tone a step from D5; past D7 it drops an octave
function mel(n) { let m = 74; for (let k = 2; k <= n; k++) { const ch = PROG[chordIx(k)]; let best = 999; ch.forEach(p => { for (let o = -24; o <= 48; o += 12) { const q = p + o; if (q > m && q < best) best = q; } }); m = best > 98 ? best - 12 : best; } return m; }
// the chord tone just under m
function under(m, ix) { let best = -1; PROG[ix].forEach(p => { for (let o = -24; o <= 36; o += 12) { const q = p + o; if (q < m && q > best) best = q; } }); return best; }
// a held, driven chord between 300 Hz and 1.5 kHz, so a payoff still fills a phone speaker
function midSwell(t, ms, g, h, d, type) { ms.forEach((m, i) => V({ t, f: mf(m), type: type || 'triangle', g, a: 0.01, h, d, lp: 1800, sat: 1.4, pan: (i / Math.max(1, ms.length - 1) - 0.5) * 1.2, rev: 0.3 })); }
const lvl = n => clamp(0.18 + 0.075 * n, 0.24, 1);
const KALIAS = { ring: 'lactol', dry: 'enone', dehydrate: 'enone', flip: 'taut', snap: 'snap6', close: 'ether', rung: 'fold', across: 'fold' };
const kindOf = k => KALIAS[k] || k || 'lactol';
// each kind also sits in its own register and has its own knock under it, so a change of kind is heard even under the shared layers
const KORDER = ['lactol', 'enone', 'taut', 'weld', 'snap6', 'ether', 'shift', 'tuck', 'knit', 'seal', 'cap', 'open', 'fold'];
const KOCT = { weld: -12, tuck: -12, knit: 12, fold: -12, taut: 12, ether: 12, cap: 12 };
function kindKnock(t, kind, g) { const i = Math.max(0, KORDER.indexOf(kind)), f = 260 * Math.pow(1.28, i); N({ t, ft: 'bandpass', f, q: 4, g: g * 0.9, a: 0.0005, d: 0.05 + 0.01 * (i % 4), pan: (i % 3 - 1) * 0.5 }); V({ t, f: f * 0.5, f1: f * 0.35, ft: 0.04, type: i % 2 ? 'triangle' : 'sine', g: g * 0.6, a: 0.0006, d: 0.08 }); }

// ===================== 1 BENCH =====================
const B = {
  marimba(t, f, g, o) { o = o || {}; const d = (o.d || 1) * clamp(0.95 * Math.pow(220 / f, 0.5), 0.16, 1.2), pan = o.pan || 0, br = o.bright == null ? 1 : o.bright, rev = o.rev == null ? 0.16 : o.rev;
    V({ t, f, g, a: 0.0015, d, pan, rev, lp: o.lp });
    V({ t, f: f * 3.93, g: g * 0.3 * br, a: 0.001, d: d * 0.22, pan, rev });
    V({ t, f: f * 9.2, g: g * 0.07 * br, a: 0.0008, d: 0.035, pan });
    N({ t, ft: 'bandpass', f: Math.min(9000, f * 5), q: 1.3, g: g * 0.4 * br, a: 0.0005, d: 0.016, pan });
    if (f < 420) V({ t, f, g: g * 0.55, a: 0.007, d: d * 1.3, pan, lp: f * 2.2 }); },
  glass(t, f, g, o) { o = o || {}; const pan = o.pan || 0, d = o.d || 1;
    V({ t, f, g, a: 0.001, d: 1.5 * d, pan, rev: 0.32, fm: { r: 2.76, i: 0.9, i1: 0.03, d: 0.22 } });
    V({ t, f: f * 2.32, g: g * 0.26, a: 0.001, d: 0.55 * d, pan: -pan, rev: 0.3 });
    V({ t, f: f * 4.25, g: g * 0.13, a: 0.001, d: 0.26 * d, pan, rev: 0.3 });
    V({ t, f: f * 6.63, g: g * 0.06, a: 0.001, d: 0.12, pan });
    N({ t, ft: 'highpass', f: 4500, g: g * 0.3, a: 0.0004, d: 0.012, pan }); },
  metal(t, f, g, o) { o = o || {}; const pan = o.pan || 0, d = o.d || 1;
    [[1, 1, 1.2], [2.76, 0.5, 0.6], [5.4, 0.3, 0.32], [8.93, 0.18, 0.16], [13.3, 0.1, 0.08]].forEach(([r, gg, dd], i) => V({ t, f: f * r, g: g * gg, a: 0.0008, d: dd * d, pan: pan + (i % 2 ? 0.15 : -0.15), rev: 0.28 }));
    N({ t, ft: 'bandpass', f: Math.min(9000, f * 6), q: 2, g: g * 0.5, a: 0.0003, d: 0.01, pan }); },
  gong(t, f, g, o) { o = o || {}; const pan = o.pan || 0, d = o.d || 1.6;
    V({ t, f, g, a: 0.004, d, pan: pan - 0.2, rev: 0.3 }); V({ t, f: f * 1.006, g: g * 0.8, a: 0.004, d, pan: pan + 0.2, rev: 0.3 });
    V({ t, f: f * 2.02, g: g * 0.35, a: 0.003, d: d * 0.6, pan, rev: 0.3 }); V({ t, f: f * 3.01, g: g * 0.22, a: 0.002, d: d * 0.4, pan, rev: 0.3 }); V({ t, f: f * 4.16, g: g * 0.12, a: 0.002, d: d * 0.25, pan });
    N({ t, ft: 'lowpass', f: 900, g: g * 0.3, a: 0.001, d: 0.03, pan }); },
  wood(t, f, g, o) { o = o || {}; const pan = o.pan || 0; V({ t, f, g, type: 'triangle', a: 0.0005, d: 0.07, pan, rev: 0.12 }); V({ t, f: f * 1.47, g: g * 0.4, a: 0.0005, d: 0.035, pan }); N({ t, ft: 'bandpass', f: f * 1.1, q: 5, g: g * 0.6, a: 0.0003, d: 0.012, pan }); },
  shaker(t, g, o) { o = o || {}; N({ t, ft: 'highpass', f: 6500, g, a: 0.004, d: 0.05, pan: o.pan || 0 }); },
  thump(t, g) { K({ t, f0: 150, f1: 52, pt: 0.04, d: 0.22, g, harm: 0.5, sat: 2.5, click: 0.2 }); N({ t, ft: 'lowpass', f: 900, g: g * 0.5, a: 0.0006, d: 0.06 }); N({ t, ft: 'bandpass', f: 520, q: 2, g: g * 0.7, a: 0.0006, d: 0.045 }); V({ t, f: 330, f1: 220, ft: 0.03, type: 'triangle', g: g * 0.35, a: 0.0006, d: 0.06 }); },
  drip(t, f, g, o) { V({ t, f: f * 0.6, f1: f * 1.3, ft: 0.03, g, a: 0.001, d: 0.06, pan: (o && o.pan) || 0, rev: 0.25 }); },
  pop(t, g, o) { V({ t, f: 300, f1: 1250, ft: 0.014, g, a: 0.0005, d: 0.035, pan: (o && o.pan) || 0 }); N({ t, ft: 'bandpass', f: 2200, q: 0.8, g: g * 0.8, a: 0.0003, d: 0.02, pan: (o && o.pan) || 0 }); }
};
// the thirteen kinds: a different struck object each
const BK = {
  lactol: (t, f, g, p) => B.glass(t, f, g, { pan: p }),
  enone: (t, f, g, p) => { B.marimba(t, f, g * 0.9, { pan: p }); B.drip(t + 0.05, f * 2, g * 0.5, { pan: -p }); },
  taut: (t, f, g, p) => { V({ t, f: f * 0.94, f1: f, ft: 0.018, g, a: 0.0008, d: 0.7, pan: p, rev: 0.2 }); V({ t, f: f * 5.4, g: g * 0.2, a: 0.0006, d: 0.09, pan: p }); N({ t, ft: 'bandpass', f: f * 3, q: 3, g: g * 0.4, a: 0.0004, d: 0.012, pan: p }); },
  weld: (t, f, g, p) => B.metal(t, f, g * 0.75, { pan: p }),
  snap6: (t, f, g, p) => { B.marimba(t, f, g * 0.8, { pan: p }); [0, 0.011, 0.022].forEach((d, i) => N({ t: t + d, ft: 'bandpass', f: 1300 + i * 150, q: 1.4, g: g * 0.7, a: 0.0004, d: 0.02, pan: p })); },
  ether: (t, f, g, p) => { B.glass(t, f, g * 0.85, { pan: p }); N({ t, ft: 'bandpass', f: 5200, q: 1.5, g: g * 0.25, a: 0.02, d: 0.5, pan: -p, trem: { f: 31, d: 0.9 } }); },
  shift: (t, f, g, p) => { V({ t, f: f * 0.84, f1: f, ft: 0.07, g, a: 0.001, d: 0.6, pan: p, rev: 0.18 }); V({ t, f: f * 3.93 * 0.84, f1: f * 3.93, ft: 0.07, g: g * 0.25, a: 0.001, d: 0.12, pan: p }); N({ t, ft: 'bandpass', f: f * 4, q: 1.3, g: g * 0.3, a: 0.0005, d: 0.014, pan: p }); },
  tuck: (t, f, g, p) => { B.marimba(t, f, g * 1.1, { pan: p, bright: 0.15, lp: f * 2.5 }); V({ t, f: 140, f1: 70, ft: 0.05, g: g * 0.5, a: 0.001, d: 0.12 }); },
  knit: (t, f, g, p) => B.gong(t, f, g * 0.7, { pan: p, d: 1.1 }),
  seal: (t, f, g, p) => { B.pop(t, g * 0.7, { pan: p }); V({ t: t + 0.02, f, g: g * 0.8, a: 0.001, d: 0.4, pan: p, rev: 0.2, fm: { r: 1.5, i: 2, i1: 0.05, d: 0.08 } }); },
  cap: (t, f, g, p) => { const f0 = f; [[1, 1], [1.48, 0.7]].forEach(([r, gg]) => V({ t, f: f0 * r, type: 'square', g: g * gg * 0.5, a: 0.0006, d: 0.28, pan: p, bp: f0 * 2, bq: 2.5, rev: 0.15 })); },
  open: (t, f, g, p) => V({ t, f: f * 1.03, f1: f, ft: 0.06, g, a: 0.001, d: 0.9, pan: p, rev: 0.25, fm: { r: 2, i: 3, i1: 0.2, d: 0.3 } }),
  fold: (t, f, g, p) => { [[0.5, 1, 1.4], [1, 0.6, 1.0], [1.5, 0.35, 0.7], [2.1, 0.25, 0.4], [2.7, 0.15, 0.25]].forEach(([r, gg, dd]) => V({ t, f: f * r, g: g * gg * 0.8, a: 0.001, d: dd, pan: p, rev: 0.3 })); }
};

// ===================== 2 ARCADE =====================
const A = {
  kick(t, g) { K({ t, f0: 170, f1: 48, pt: 0.04, d: 0.28, g, harm: 0.5, sat: 2.8, click: 0.3 }); N({ t, ft: 'bandpass', f: 3200, q: 1, g: g * 0.25, a: 0.0004, d: 0.012 }); V({ t, f: 380, f1: 240, ft: 0.02, type: 'triangle', g: g * 0.3, a: 0.0005, d: 0.04 }); },
  hat(t, g, o) { o = o || {}; N({ t, ft: 'highpass', f: 7500, ft2: 'peaking', f2: 10500, q2: 1, g, a: 0.0004, d: o.open ? 0.14 : 0.035, pan: o.pan || 0.25 }); },
  snare(t, g, o) { o = o || {}; N({ t, ft: 'bandpass', f: 2000, q: 0.7, g, a: 0.0006, d: 0.13, pan: o.pan || -0.1, rev: 0.12 }); V({ t, f: 210, f1: 170, ft: 0.04, type: 'triangle', g: g * 0.6, a: 0.0006, d: 0.07, pan: o.pan || -0.1 }); N({ t, ft: 'highpass', f: 5500, g: g * 0.4, a: 0.0004, d: 0.05, pan: o.pan || -0.1 }); },
  clap(t, g) { [0, 0.009, 0.019].forEach(d => N({ t: t + d, ft: 'bandpass', f: 1400, q: 1.2, g, a: 0.0004, d: d === 0.019 ? 0.12 : 0.012, rev: 0.25 })); },
  pluck(t, f, g, o) { o = o || {}; const pan = o.pan || 0; U({ t, f, type: 'sawtooth', g, a: 0.001, d: o.d || 0.38, lp: f * 9, lp1: f * 1.6, lpt: 0.16, q: 3, pan, rev: 0.22 }, 2, 9, 0.2); V({ t, f: f / 2, g: g * 0.35, a: 0.001, d: 0.2, pan }); },
  bell(t, f, g, o) { o = o || {}; V({ t, f, g, a: 0.001, d: o.d || 0.9, pan: o.pan || 0, rev: 0.3, fm: { r: 3.5, i: 1.6, i1: 0.05, d: 0.35 } }); },
  lead(t, f, g, o) { o = o || {}; V({ t, f: o.from || f, f1: o.from ? f : null, ft: 0.05, type: 'square', g, a: 0.002, d: o.d || 0.3, lp: 4200, pan: o.pan || 0, rev: 0.2, vib: o.vib ? { f: 6, c: 18, in: 0.12 } : null }); },
  saw(t, f, g, o) { o = o || {}; U({ t, f, type: 'sawtooth', g, a: o.a || 0.002, h: o.h || 0, d: o.d || 0.3, lp: o.lp || 3500, lp1: o.lp1, lpt: o.lpt, q: 1, pan: o.pan || 0, rev: o.rev == null ? 0.2 : o.rev, bed: o.bed }, o.n || 3, o.spread || 14, o.width || 0.5); },
  bass(t, f, P, g) { V({ t, f, type: 'sawtooth', g, a: 0.002, h: P * 0.35, d: P * 0.5, lp: 1800, lp1: 420, lpt: 0.14, q: 4, sat: 1.6, bed: true }); V({ t, f: f * 2, type: 'square', g: g * 0.25, a: 0.002, h: P * 0.2, d: P * 0.3, lp: 1200, bed: true }); },
  sub(t, f0, f1, d, g) { V({ t, f: f0, f1, ft: d * 0.8, g, a: 0.002, d, sat: 1.8 }); V({ t, f: f0 * 2, f1: f1 * 2, ft: d * 0.8, g: g * 0.25, a: 0.002, d: d * 0.6 }); },
  zap(t, f0, f1, d, g, o) { V({ t, f: f0, f1, ft: d, type: (o && o.type) || 'square', g, a: 0.001, d, lp: 5000, pan: (o && o.pan) || 0, rev: 0.2 }); },
  riser(t, d, g) { N({ t, ft: 'bandpass', f: 500, f1: 7000, fT: d, q: 1.6, g, a: d, ax: true, d: 0.04, cut: true, bed: true, pan: -0.5, pan1: 0.5 }); V({ t, f: 220, f1: 1760, ft: d, type: 'sawtooth', g: g * 0.3, a: d, ax: true, d: 0.03, cut: true, lp: 3000, bed: true }); },
  crash(t, g, d) { N({ t, ft: 'highpass', f: 3800, g, a: 0.0008, d: d || 1.8, pan: -0.3, rev: 0.4 }); N({ t, ft: 'highpass', f: 5200, g: g * 0.8, a: 0.0008, d: (d || 1.8) * 0.85, pan: 0.3, rev: 0.4 }); V({ t, f: 420, g: g * 0.25, a: 0.0006, d: 1.0, fm: { r: 1.414, i: 9, i1: 0.3, d: 0.6 }, hp: 1500, rev: 0.3 }); }
};
const AK = {
  lactol: (t, f, g, p) => { A.bell(t, f, g * 0.8, { pan: p }); A.pluck(t, f, g * 0.5, { pan: -p }); },
  enone: (t, f, g, p) => { A.zap(t, f / 2, f, 0.05, g * 0.5, { type: 'triangle', pan: p }); A.pluck(t + 0.03, f, g * 0.7, { pan: p }); },
  taut: (t, f, g, p) => { [0, 4, 7, 12].forEach((s, i) => A.lead(t + i * 0.028, f * Math.pow(2, s / 12), g * 0.55, { d: 0.09, pan: p })); },
  weld: (t, f, g, p) => A.saw(t, f, g * 0.9, { d: 0.32, n: 5, spread: 18, width: 0.7, lp: 5200, lp1: 1400, lpt: 0.2 }),
  snap6: (t, f, g, p) => { V({ t, f: f * 2, f1: f, ft: 0.03, type: 'sawtooth', g: g * 0.8, a: 0.0008, d: 0.28, lp: 6000, lp1: 1800, lpt: 0.1, q: 6, pan: p, rev: 0.2 }); A.clap(t, g * 0.35); },
  ether: (t, f, g, p) => { V({ t, f, type: 'sawtooth', g: g * 0.6, a: 0.01, d: 0.45, bp: 800, bq: 4, pan: p, rev: 0.25, vib: { f: 5.5, c: 15 } }); V({ t, f, type: 'sawtooth', g: g * 0.45, a: 0.01, d: 0.45, bp: 1250, bq: 5, pan: -p, rev: 0.25 }); V({ t, f: f * 2, g: g * 0.25, a: 0.01, d: 0.3, pan: p }); },
  shift: (t, f, g, p) => A.lead(t, f, g * 0.8, { from: f * 0.75, d: 0.42, vib: true, pan: p }),
  tuck: (t, f, g, p) => { V({ t, f, type: 'triangle', g, a: 0.002, d: 0.35, pan: p, rev: 0.2 }); V({ t, f: f / 2, g: g * 0.6, a: 0.002, d: 0.3 }); },
  knit: (t, f, g, p) => { [1, 2, 3, 4].forEach((r, i) => V({ t, f: f * r, g: g * [0.6, 0.35, 0.22, 0.14][i], a: 0.004, d: 0.5, pan: p, rev: 0.25, trem: i === 0 ? { f: 7, d: 0.4 } : null })); },
  seal: (t, f, g, p) => { A.lead(t, f, g * 0.6, { d: 0.06, pan: p }); A.lead(t + 0.06, f * 1.335, g * 0.65, { d: 0.32, pan: p }); },
  cap: (t, f, g, p) => { V({ t, f, g, a: 0.001, d: 0.7, pan: p, rev: 0.25, fm: { r: 1, i: 1.4, i1: 0.05, d: 0.3 } }); V({ t, f: f * 14, g: g * 0.08, a: 0.0005, d: 0.05, pan: p }); },
  open: (t, f, g, p) => V({ t, f, type: 'sawtooth', g: g * 0.8, a: 0.002, d: 0.45, lp: f * 2, q: 8, pan: p, rev: 0.2, trem: { f: 9, d: 0.7 } }),
  fold: (t, f, g, p) => { A.zap(t, f * 3, f, 0.09, g * 0.55, { type: 'sawtooth', pan: p }); A.bell(t + 0.04, f, g * 0.55, { pan: -p, d: 0.6 }); }
};

// ===================== 3 BOILER =====================
// a darker scale: D Phrygian dominant (D Eb F# G A Bb C)
const PH = [0, 1, 4, 5, 7, 8, 10];
const mel3 = n => { const k = Math.max(0, n - 1), o = Math.floor(k / 7) % 2; return 69 + 12 * o + PH[k % 7]; };
const H = {
  ping(t, f, g, o) { o = o || {}; const pan = o.pan || 0, d = o.d || 1; V({ t, f, g, a: 0.0008, d: 0.9 * d, pan, rev: 0.3, fm: { r: 1.414, i: 1.6, i1: 0.04, d: 0.25 } }); V({ t, f: f * 2.93, g: g * 0.3, a: 0.0006, d: 0.25 * d, pan: -pan, rev: 0.25 }); V({ t, f: f * 5.1, g: g * 0.12, a: 0.0005, d: 0.1, pan }); },
  knock(t, g) { K({ t, f0: 120, f1: 44, pt: 0.05, d: 0.3, g, harm: 0.5, sat: 3, click: 0.12 }); V({ t, f: 310, g: g * 0.4, a: 0.0006, d: 0.15, fm: { r: 1.414, i: 3, i1: 0.1, d: 0.05 } }); N({ t, ft: 'bandpass', f: 600, q: 1.5, g: g * 0.7, a: 0.0006, d: 0.06 }); },
  chuff(t, g, o) { o = o || {}; N({ t, col: 'p', ft: 'bandpass', f: o.f || 1000, f1: (o.f || 1000) * 0.55, q: 1.1, g, a: 0.006, d: o.d || 0.1, pan: o.pan || 0 }); N({ t, ft: 'highpass', f: 4200, g: g * 0.45, a: 0.004, d: (o.d || 0.1) * 0.6, pan: -(o.pan || 0) }); },
  bubble(t, f, g, o) { V({ t, f, f1: f * 1.9, ft: 0.03, g, a: 0.001, d: 0.045, pan: (o && o.pan) || 0, rev: 0.15 }); },
  whistle(t, f, d, g, o) { o = o || {}; V({ t, f, f1: o.f1, ft: d, g, a: o.a || 0.04, ax: !!o.ax, h: d * 0.6, d: d * 0.4, pan: 0.2, rev: 0.3, bed: true, vib: { f: 5.2, c: 10 } }); N({ t, ft: 'bandpass', f, f1: o.f1, fT: d, q: 28, g: g * 2.2, a: o.a || 0.04, ax: !!o.ax, h: d * 0.6, d: d * 0.4, pan: -0.2, bed: true }); },
  hissbed(t, d, g) { N({ t, ft: 'highpass', f: 3200, g, a: d * 0.4, h: d * 0.3, d: d * 0.4, bed: true, pan: -0.4, pan1: 0.4 }); },
  rumble(t, d, g) { N({ t, col: 'b', ft: 'bandpass', f: 260, q: 0.7, g, a: d * 0.2, h: d * 0.4, d: d * 0.5, bed: true }); V({ t, f: 73.4, type: 'sawtooth', g: g * 0.6, a: d * 0.2, h: d * 0.4, d: d * 0.5, lp: 600, bed: true, sat: 2 }); },
  pop(t, g, o) { V({ t, f: 300, f1: 1400, ft: 0.012, g, a: 0.0004, d: 0.035, pan: (o && o.pan) || 0 }); N({ t, ft: 'bandpass', f: 2000, q: 0.7, g: g * 0.9, a: 0.0003, d: 0.022, pan: (o && o.pan) || 0 }); },
  rattle(t, g, k, span) { for (let i = 0; i < k; i++) { const tt = t + rnd() * span; V({ t: tt, f: 1800 + rnd() * 3500, g: g * (0.5 + rnd() * 0.5), a: 0.0004, d: 0.03 + rnd() * 0.05, pan: rnd() * 1.4 - 0.7, fm: { r: 1.73, i: 2, i1: 0.1, d: 0.02 } }); } },
  steam(t, d, g, o) { o = o || {}; N({ t, ft: 'highpass', f: o.f || 6000, f1: o.f1 || 1500, fT: d, g, a: o.a || 0.002, d, pan: -0.5, pan1: 0.5, rev: 0.3 }); N({ t, col: 'p', ft: 'bandpass', f: 2500, f1: 900, fT: d, q: 0.6, g: g * 0.6, a: o.a || 0.002, d: d * 0.8, pan: 0.4, pan1: -0.4 }); }
};
const HK = {
  lactol: (t, f, g, p) => H.ping(t, f, g, { pan: p }),
  enone: (t, f, g, p) => { H.ping(t, f, g * 0.55, { pan: p, d: 0.6 }); [0, 0.035, 0.08, 0.12].forEach((d, i) => H.bubble(t + d, 260 + i * 90, g * 0.55, { pan: -p })); },
  taut: (t, f, g, p) => { V({ t, f: 2400, type: 'square', g: g * 0.25, a: 0.0003, d: 0.012, hp: 1500, pan: p }); H.ping(t + 0.012, f, g * 0.7, { pan: p, d: 0.5 }); },
  weld: (t, f, g, p) => { for (let i = 0; i < 9; i++) N({ t: t + i * 0.018 + rnd() * 0.01, ft: 'bandpass', f: 2500 + rnd() * 4000, q: 2, g: g * 0.5, a: 0.0004, d: 0.015, pan: p }); V({ t, f: 100, type: 'sawtooth', g: g * 0.35, a: 0.003, d: 0.2, lp: 900, sat: 2 }); H.ping(t, f, g * 0.45, { pan: -p, d: 0.6 }); },
  snap6: (t, f, g, p) => V({ t, f, g, a: 0.001, d: 0.8, pan: p, rev: 0.25, vib: { f: 11, c: 80, in: 0.002 }, fm: { r: 2.1, i: 1.2, i1: 0.05, d: 0.2 } }),
  ether: (t, f, g, p) => { N({ t, ft: 'bandpass', f: 5500, q: 1.2, g: g * 0.6, a: 0.005, d: 0.5, pan: p, trem: { f: 37, d: 0.9 } }); H.ping(t, f, g * 0.5, { pan: -p, d: 0.5 }); },
  shift: (t, f, g, p) => { V({ t, f: f * 0.8, f1: f, ft: 0.12, type: 'sawtooth', g: g * 0.5, a: 0.01, d: 0.25, bp: f * 2, bq: 6, pan: p, vib: { f: 23, c: 40 } }); H.ping(t + 0.1, f, g * 0.5, { pan: p, d: 0.5 }); },
  tuck: (t, f, g, p) => { V({ t, f: 180, f1: 70, ft: 0.08, g: g * 0.9, a: 0.002, d: 0.18, pan: p }); N({ t, col: 'b', ft: 'lowpass', f: 500, g: g * 0.5, a: 0.002, d: 0.12 }); H.bubble(t + 0.04, 180, g * 0.5); },
  knit: (t, f, g, p) => { H.rattle(t, g * 0.6, 7, 0.14); H.ping(t, f, g * 0.45, { pan: p, d: 0.5 }); },
  seal: (t, f, g, p) => { H.pop(t, g * 0.9, { pan: p }); H.ping(t + 0.03, f, g * 0.45, { pan: -p, d: 0.5 }); },
  cap: (t, f, g, p) => { H.ping(t, f * 0.5, g * 0.8, { pan: p, d: 0.5 }); H.ping(t + 0.045, f * 0.53, g * 0.5, { pan: -p, d: 0.4 }); N({ t, ft: 'lowpass', f: 600, g: g * 0.4, a: 0.0006, d: 0.05 }); },
  open: (t, f, g, p) => { H.steam(t, 0.22, g * 0.5, { f: 7000, f1: 2000 }); H.ping(t, f, g * 0.55, { pan: p, d: 0.6 }); },
  fold: (t, f, g, p) => { V({ t, f: f / 2, f1: f / 2 * 0.92, ft: 0.4, type: 'sawtooth', g: g * 0.6, a: 0.01, d: 0.5, lp: 1200, q: 3, pan: p, vib: { f: 4, c: 30 }, rev: 0.25 }); H.ping(t, f, g * 0.4, { pan: -p }); }
};



// ===================== 2 ARCADE, GROWN UP (owner, 12 November: "less child game sounding") =====================
// D minor over a moving bass (Dm Bb Gm A: the A major pulls back to D minor), low register, filtered saw and FM bass, dry heavy
// drums with drive, sparse low leads, the boiler's steam and knocks for texture. No bright major bleeps, no square leads, nothing
// slides up. Three variants (AA.sfx.arcade('a' | 'b' | 'c'), saved; 'old' is the first arcade, kept for reference):
//   a dark synth, driving: an FM bass in eighths then sixteenths, saw stabs, a snare that rolls
//   b industrial: metal and steam on the offbeats, a distorted bass, knocks that roll
//   c ominous: a slow heavy pulse at half time, low brass swells, led by the chant of the deep layer
const MPROG = [[62, 65, 69], [58, 62, 65], [55, 58, 62], [57, 61, 64]], MROOT = [38, 34, 31, 33];
function melD(n) { let m = 57; for (let k = 2; k <= n; k++) { const ch = MPROG[chordIx(k)]; let best = 999; ch.forEach(p => { for (let o = -24; o <= 36; o += 12) { const q = p + o; if (q > m && q < best) best = q; } }); m = best > 81 ? best - 12 : best; } return m; }
function underD(m, ix) { let best = -1; MPROG[ix].forEach(p => { for (let o = -24; o <= 36; o += 12) { const q = p + o; if (q < m && q > best) best = q; } }); return best; }
const AKEY = 'overreact.sfx.arcade', AVAR = ['old', 'a', 'b', 'c'];
let ARCV = 1;
try { const q = root.location && root.location.search ? new URLSearchParams(root.location.search).get('arcade') : null, s0 = q !== null && q !== '' ? q : root.localStorage.getItem(AKEY); if (s0 !== null && AVAR.indexOf(s0) >= 0) ARCV = AVAR.indexOf(s0); } catch (e) { /* default */ }
const D = {
  kick(t, g, v) { K({ t, f0: v === 3 ? 95 : 125, f1: 40, pt: 0.055, d: v === 3 ? 0.55 : 0.32, g, harm: 0.5, sat: 3.2, click: 0.14 }); V({ t, f: 210, f1: 120, ft: 0.03, type: 'triangle', g: g * 0.35, a: 0.0006, d: 0.07, sat: 2 }); if (v === 2) H.ping(t, mf(43), g * 0.12, { d: 0.25 }); },
  snare(t, g, v) { N({ t, ft: 'bandpass', f: 1500, q: 0.6, g, a: 0.0006, d: 0.15, sat: 2.5, rev: 0.12, pan: -0.1 }); V({ t, f: 185, f1: 150, ft: 0.04, type: 'triangle', g: g * 0.6, a: 0.0006, d: 0.08, sat: 2 }); if (v === 2) H.chuff(t, g * 0.6, { d: 0.08, f: 1300 }); },
  tom(t, g) { V({ t, f: 120, f1: 78, ft: 0.12, g, a: 0.001, d: 0.38, sat: 2.5 }); N({ t, ft: 'lowpass', f: 900, g: g * 0.35, a: 0.0006, d: 0.05 }); },
  hat(t, g, o) { N({ t, ft: 'highpass', f: 6000, ft2: 'lowpass', f2: 10000, g, a: 0.0005, d: (o && o.open) ? 0.1 : 0.03, pan: (o && o.pan) || 0.25 }); },
  fmbass(t, f, d, g, v) { g *= 0.8; V({ t, f: f * 2, type: 'sawtooth', g: g * 0.3, a: 0.002, h: d * 0.2, d: d * 0.5, lp: 1400, lp1: 500, q: 2, sat: 2, bed: true }); V({ t, f, g, a: 0.002, h: d * 0.3, d: d * 0.7, fm: { r: 1, i: v === 2 ? 5 : 3, i1: 0.15, d: d * 0.6 }, sat: v === 2 ? 4 : 2.2, bed: true }); if (v !== 3) V({ t, f, type: 'sawtooth', g: g * 0.6, a: 0.002, h: d * 0.3, d: d * 0.7, lp: 900, lp1: 220, lpt: 0.15, q: 5, sat: v === 2 ? 3 : 1.6, bed: true }); },
  stab(t, ms, g, d, o) { o = o || {}; ms.forEach((m, i) => U({ t, f: mf(m), type: 'sawtooth', g, a: o.a || 0.003, h: o.h || 0, d, lp: o.lp || 2200, lp1: o.lp1 || 320, lpt: o.lpt || d * 0.7, q: 2, sat: o.sat || 1.6, pan: (i / Math.max(1, ms.length - 1) - 0.5) * 0.8, rev: o.rev == null ? 0.25 : o.rev, bed: o.bed }, 2, o.spread || 10, 0.4)); },
  pluck(t, f, g, o) { o = o || {}; V({ t, f, g, a: 0.001, d: o.d || 0.5, fm: { r: o.r || 2, i: o.i || 3.5, i1: 0.05, d: 0.12 }, lp: 2200, pan: o.pan || 0, rev: 0.22 }); V({ t, f: f / 2, type: 'sawtooth', g: g * 0.35, a: 0.001, d: 0.22, lp: 700, pan: o.pan || 0 }); },
  metal(t, f, g, o) { o = o || {}; V({ t, f, g, a: 0.0008, d: o.d || 0.8, pan: o.pan || 0, rev: 0.3, lp: 2600, fm: { r: 1.414, i: 2.6, i1: 0.08, d: 0.3 } }); V({ t, f: f * 2.76, g: g * 0.12, a: 0.0006, d: 0.15, lp: 2600, pan: -(o.pan || 0) }); },
  crash(t, g, d) { N({ t, ft: 'highpass', f: 2800, ft2: 'lowpass', f2: 9000, g, a: 0.0008, d, pan: -0.3, rev: 0.4, sat: 1.5 }); N({ t, ft: 'highpass', f: 4000, ft2: 'lowpass', f2: 8000, g: g * 0.8, a: 0.0008, d: d * 0.85, pan: 0.3, rev: 0.4 }); D.metal(t, mf(45), g * 0.6, { d: d * 0.7 }); },
  riser(t, d, g) { N({ t, ft: 'bandpass', f: 300, f1: 3500, fT: d, q: 1.4, g, a: d, ax: true, d: 0.03, cut: true, bed: true, pan: -0.5, pan1: 0.5 }); V({ t, f: 110, f1: 220, ft: d, type: 'sawtooth', g: g * 0.25, a: d, ax: true, d: 0.03, cut: true, lp: 900, bed: true, sat: 2 }); }
};
const DK = {
  lactol: (t, f, g, p) => D.metal(t, f, g * 0.8, { pan: p }),
  enone: (t, f, g, p) => { V({ t, f: f * 2, f1: f, ft: 0.06, type: 'sawtooth', g: g * 0.6, a: 0.001, d: 0.3, lp: 2400, lp1: 500, lpt: 0.2, q: 4, pan: p, rev: 0.2 }); H.chuff(t + 0.02, g * 0.3, { d: 0.08, f: 900, pan: -p }); },
  taut: (t, f, g, p) => D.pluck(t, f, g * 0.9, { pan: p, r: 2, i: 4 }),
  weld: (t, f, g, p) => U({ t, f, type: 'sawtooth', g: g * 0.9, a: 0.002, d: 0.35, lp: 3000, lp1: 500, lpt: 0.25, q: 2, sat: 2.5, pan: p, rev: 0.2 }, 4, 20, 0.6),
  snap6: (t, f, g, p) => { D.metal(t, f, g * 0.5, { pan: p, d: 0.4 }); N({ t, ft: 'bandpass', f: 2400, q: 1, g: g * 0.6, a: 0.0004, d: 0.03, sat: 2, pan: p }); },
  ether: (t, f, g, p) => { [[500, 5, 1], [900, 6, 0.6]].forEach(([b, q, gg]) => V({ t, f: f / 2, type: 'sawtooth', g: g * gg * 0.9, a: 0.01, d: 0.5, bp: b, bq: q, pan: p, rev: 0.25, vib: { f: 3.5, c: 18 }, sat: 1.5 })); },
  shift: (t, f, g, p) => V({ t, f: f * 1.33, f1: f, ft: 0.1, type: 'sawtooth', g: g * 0.7, a: 0.002, d: 0.45, lp: 1800, lp1: 450, q: 3, pan: p, rev: 0.2 }),
  tuck: (t, f, g, p) => { V({ t, f: f / 2, g, a: 0.001, d: 0.3, fm: { r: 1, i: 1.5, i1: 0.05, d: 0.06 }, pan: p }); N({ t, ft: 'lowpass', f: 500, g: g * 0.4, a: 0.001, d: 0.06 }); },
  knit: (t, f, g, p) => [1, 2, 3].forEach((r, i) => V({ t, f: f / 2 * r, det: (i - 1) * 8, g: g * [0.6, 0.35, 0.2][i], a: 0.01, d: 0.55, pan: p, rev: 0.25, trem: i === 0 ? { f: 4, d: 0.5 } : null })),
  seal: (t, f, g, p) => { D.metal(t, f / 2, g * 0.7, { pan: p, d: 0.5 }); D.metal(t + 0.04, f / 2 * 1.06, g * 0.45, { pan: -p, d: 0.4 }); },
  cap: (t, f, g, p) => V({ t, f, g, a: 0.001, d: 0.7, lp: 2000, pan: p, rev: 0.25, fm: { r: 1, i: 2.2, i1: 0.05, d: 0.25 } }),
  open: (t, f, g, p) => V({ t, f: f / 2, type: 'sawtooth', g: g * 0.8, a: 0.002, d: 0.45, lp: 3000, lp1: 380, lpt: 0.35, q: 7, pan: p, rev: 0.2, sat: 1.8 }),
  fold: (t, f, g, p) => V({ t, f: f * 3, f1: f, ft: 0.09, type: 'sawtooth', g: g * 0.55, a: 0.001, d: 0.4, lp: 2600, lp1: 600, q: 4, pan: p, rev: 0.2 })
};
function darkArcade(v) {
  const ms = m => mf(m);
  return { name: 'arcade-' + AVAR[v], mel: melD, under: underD, K: DK, kg: 1.9, prog: MPROG, root: MROOT, deepFrom: v === 3 ? 1 : 2, deepG: v === 3 ? 1.7 : 1,
    thump: (t, g) => D.kick(t, g * (v === 3 ? 1.25 : 1.1), v),
    off: (t, e, n, p) => { if (v === 3) { if (n >= 3) D.tom(t, 0.22 * e); return; } D.hat(t, 0.07 * e, { pan: 0.3 }); if (v === 2) { H.chuff(t, 0.14 * e, { pan: p, f: 1100 }); if (n >= 3) D.metal(t, ms(50 + (n % 3) * 3), 0.05 * e, { pan: -p, d: 0.3 }); } if (n >= 4) D.snare(t, 0.2 * e, v); },
    bass: (t, ix, P, e, n) => { const f = mf(MROOT[ix]); if (v === 3) { D.fmbass(t, f, P * 0.95, 0.2 * e, v); return; } D.fmbass(t, f, P * 0.45, 0.17 * e, v); D.fmbass(t + P / 2, f * (n >= 5 ? 2 : 1), P * 0.45, 0.13 * e, v); if (n >= 7) { D.fmbass(t + P / 4, f, P * 0.2, 0.08 * e, v); D.fmbass(t + 3 * P / 4, f * 2, P * 0.2, 0.08 * e, v); } },
    harm: (t, m, e, p) => { if (v !== 3) D.pluck(t, mf(m - 12), 0.07 * e, { pan: p, d: 0.3 }); },
    six: (t, g, n, p) => { if (v === 3) { if (n >= 8) D.hat(t, 0.03 * g, { pan: p }); return; } D.hat(t, 0.045 * g, { pan: p }); if (v === 2 && n >= 8) H.rattle(t, 0.03 * g, 3, 0.05); },
    pad: (t, ix, P, lv) => { if (v === 2) { H.hissbed(t, P, 0.015 + 0.02 * lv); } MPROG[ix].forEach((m, i) => U({ t, f: mf(m - (v === 3 ? 12 : 0)), type: 'sawtooth', g: (v === 3 ? 0.06 : 0.035) * lv, a: v === 3 ? P * 0.5 : 0.05, h: P * 0.4, d: P * 0.5, lp: 400 + (v === 3 ? 500 : 1300) * lv, q: 1, pan: i - 1, bed: true, rev: 0.3 }, 2, 12, 0.6)); },
    dbl: (t, f, e, n, p) => { if (v === 2) { for (let i = 0; i < 2; i++) D.metal(t + 0.08 + rnd() * 0.3, ms(62 + Math.floor(rnd() * 3) * 5), 0.04 * e, { pan: rnd() * 1.4 - 0.7, d: 0.35 }); } else if (v === 1) D.pluck(t + 0.01, f / 2, 0.06 * e, { pan: -p, d: 0.3 }); },
    roll: (t, P, e, n) => { const k = n >= 11 ? 8 : 4; for (let i = 0; i < k; i++) { const tt = t + P * (0.5 + 0.48 * i / k), g = 0.05 * e * (0.4 + i / k); if (v === 3) D.tom(tt, g * 1.6); else if (v === 2) H.knock(tt, g * 1.4); else D.snare(tt, g, v); } },
    finale(t, kind, n) {
      // dangerous, not cheerful: D minor low and distorted with a semitone rub that dies first, metal, steam, a long dark tail
      D.stab(t, [38, 45, 50, 53, 57, 62], 0.05, 1.6, { lp: 3000, lp1: 700, lpt: 1.4, sat: 2.2, h: 0.1 }); midSwell(t, [50, 53, 57, 62], 0.035, 0.4, 1.0, 'sawtooth');
      D.stab(t, [51, 63], 0.05, 0.35, { lp: 3000, lp1: 800, sat: 2.5 });
      (DK[kind] || DK.lactol)(t, mf(62), 0.2, 0); D.crash(t, 0.18, 1.8); H.steam(t, 1.2, 0.14); duck(t, 0.12, 0.6); bloom(t, 2.8, 1.2);
    },
    snap: (t, n, w) => { if (n >= 5) N({ t, ft: 'bandpass', f: 1800, q: 1, g: 0.05 * w * lvl(n), a: 0.0004, d: 0.03, sat: 2 }); },
    boom: t => { V({ t, f: 240, f1: 110, ft: 0.08, type: 'triangle', g: 0.2, a: 0.0008, d: 0.3, sat: 2 }); D.kick(t, 0.9, v); V({ t, f: 95, f1: 27, ft: 1.0, g: 0.8, a: 0.002, d: 1.2, sat: 2 }); H.knock(t, 0.3); },
    flag(t, k) {
      if (k === 1) { D.kick(t, 0.5, v); D.stab(t, [50, 57, 62], 0.09, 0.4, { lp: 2600, lp1: 500, sat: 2 }); D.metal(t + 0.05, mf(57), 0.12, { d: 0.5 }); H.knock(t + 0.05, 0.3); }
      else if (k === 2) { D.kick(t, 0.45, v); [50, 53, 57, 60].forEach((m, i) => V({ t, f: mf(m), f1: mf(m) * 0.985, type: 'sawtooth', g: 0.055, a: 0.01, d: 1.0, lp: 1500, q: 4, pan: (i / 3 - 0.5) * 1.2, rev: 0.3, trem: { f: 6, d: 0.7 }, sat: 1.6 })); }
      else if (k === 3) { D.riser(t, 0.24, 0.16); D.stab(t + 0.24, [45, 52, 57, 61, 64], 0.07, 0.6, { lp: 4000, lp1: 900, sat: 2.5 }); D.kick(t + 0.24, 0.65, v); for (let i = 0; i < 8; i++) N({ t: t + 0.25 + rnd() * 0.35, ft: 'bandpass', f: 2000 + rnd() * 4000, q: 3, g: 0.1, a: 0.0004, d: 0.012, pan: rnd() * 1.6 - 0.8 }); }
      else {
        // OVERREACT: the single biggest sound: a double hit, a sub drop, D minor torn by a semitone, metal, steam roaring, a falling siren
        D.kick(t, 1.3, v); D.kick(t + 0.11, 1.0, v); V({ t, f: 110, f1: 26, ft: 2.0, g: 1.3, a: 0.002, d: 2.6, sat: 2 }); V({ t, f: 240, f1: 100, ft: 0.12, type: 'triangle', g: 0.28, a: 0.0008, d: 0.4, sat: 2 });
        D.stab(t, [26, 38, 45, 50, 53, 57, 62, 65], 0.07, 3.0, { lp: 5000, lp1: 900, lpt: 2.8, sat: 2.4, h: 0.6, spread: 18 }); D.stab(t, [51, 63, 75], 0.05, 0.6, { lp: 4000, lp1: 900, sat: 2.8 });
        midSwell(t, [50, 53, 57, 62, 65, 69], 0.1, 1.5, 1.6, 'sawtooth'); D.crash(t, 0.26, 3.0); H.steam(t, 3.0, 0.24, { f: 7000, f1: 900 });
        D.stab(t, [38, 45, 50, 57], 0.1, 1.8, { lp: 1300, lp1: 600, lpt: 1.6, sat: 3, h: 0.8, spread: 22 }); H.whistle(t + 0.1, 1300, 2.2, 0.04, { f1: 330 }); H.rattle(t + 0.3, 0.05, 18, 1.8); duck(t, 0.08, 1.2); bloom(t, 4.2, 2.4);
      }
    },
    flagSoft: t => D.metal(t, mf(69), 0.06, { d: 0.6 }),
    queue: (t, i) => { N({ t, ft: 'bandpass', f: 2400, q: 2, g: 0.05, a: 0.0004, d: 0.015 }); V({ t, f: mf([50, 53, 57][i]), g: 0.09, a: 0.001, d: 0.15, fm: { r: 1, i: 2, i1: 0.1, d: 0.05 } }); },
    fire: t => { V({ t, f: 800, f1: 110, ft: 0.15, type: 'sawtooth', g: 0.08, a: 0.001, d: 0.2, lp: 2500, lp1: 300, sat: 2 }); D.kick(t + 0.02, 0.6, v); H.steam(t, 0.3, 0.1, { f: 5000, f1: 2000 }); },
    strike: (t, i, w) => { D.kick(t, (0.45 + 0.12 * i) * w, v); D.stab(t, [MPROG[0], MPROG[2], MPROG[3]][i].map(m => m - 12), 0.06 * w, 0.3, { lp: 2200, lp1: 400, sat: 2 }); if (i === 2) D.snare(t, 0.2 * w, v); },
    handoff: t => { V({ t, f: 110, f1: 55, ft: 0.35, type: 'sawtooth', g: 0.14, a: 0.003, d: 0.55, lp: 2000, lp1: 180, lpt: 0.45, q: 5, sat: 2 }); H.steam(t, 0.4, 0.05, { f: 4000, f1: 1500 }); SB.clk.P0 = 0.86; },
    tick: (t, n) => N({ t, ft: 'bandpass', f: (2600 + 60 * Math.min(10, n || 0)) * (1 + (rnd() - 0.5) * 0.1), q: 5, g: 0.035, a: 0.0004, d: 0.014, pan: rnd() * 0.8 - 0.4 }),
    swish: (t, d) => N({ t, col: 'p', ft: 'bandpass', f: 400, f1: 1600, fT: d * 1.4, q: 0.9, g: 0.05, a: d * 0.9, ax: true, d: d * 0.5, bed: true, pan: -0.5, pan1: 0.5 }),
    drone: (t, lv, step, d) => { const ix = chordIx(SB.clk.n || 1); MPROG[ix].forEach((m, i) => U({ t, f: mf(m - 24), type: 'sawtooth', g: 0.02 + 0.03 * lv, a: Math.min(0.06, d * 0.3), h: d * 0.5, d: d * 0.6, lp: 300 + 900 * lv, pan: i - 1, bed: true }, 2, 10, 0.5)); },
    draw: (t, n, d) => N({ t, ft: 'bandpass', f: 600, f1: 2400, fT: d, q: 1, g: 0.05, a: d, ax: true, d: 0.02, cut: true, bed: true }),
    windup: (t, n, ms, last) => { const d = ms / 1000;
      if (!last) { if (d > 0.12) N({ t: t + d * 0.35, ft: 'bandpass', f: 800, f1: 2400, q: 0.8, g: 0.045 * lvl(n), a: d * 0.6, ax: true, d: 0.01, cut: true, bed: true }); return; }
      const end = d - 0.16; D.riser(t, end, 0.18); H.steam(t, end, 0.06, { f: 2000, f1: 7000, a: end * 0.9 });
      const k = Math.max(4, Math.floor(end / 0.03)); for (let i = 0; i < k; i++) { const u = i / k, tt = t + end * (1 - Math.pow(1 - u, 1.6)), g = 0.03 + 0.09 * u; if (v === 3) D.tom(tt, g * 1.3); else D.snare(tt, g, v); }
      breathe(t + end, t + d); },
    clink: (t, n) => D.metal(t, mf(74), 0.07, { d: 0.4, pan: 0.5 }),
    gold: t => { D.metal(t, mf(69), 0.07, { d: 0.5 }); D.metal(t + 0.08, mf(74), 0.08, { d: 0.7 }); },
    wasted: t => { V({ t, f: 220, f1: 70, ft: 0.2, type: 'sawtooth', g: 0.1, a: 0.002, d: 0.25, lp: 700, sat: 2 }); D.kick(t, 0.25, v); },
    lost: t => { [62, 58, 57, 50].forEach((m, i) => D.pluck(t + i * 0.32, mf(m), 0.13, { d: 0.7 })); V({ t: t + 1.1, f: 73.4, f1: 46, ft: 1.3, type: 'sawtooth', g: 0.13, a: 0.01, d: 1.5, lp: 600, lp1: 150, sat: 2 }); },
    pageTurn: t => { N({ t, col: 'p', ft: 'bandpass', f: 600, f1: 3200, fT: 0.2, q: 1.2, g: 0.13, a: 0.06, d: 0.16, pan: -0.5, pan1: 0.5 }); N({ t: t + 0.2, ft: 'bandpass', f: 2200, q: 2, g: 0.04, a: 0.0004, d: 0.015 }); }
  };
}

// ===================== the deep layer (owner, 12 November: "a deeper sound that gets louder") =====================
// It enters at step 2 and grows with every step: louder, thicker, lower. It sits on the ducked bed, so it breathes under each hit
// and falls silent in the held breath; it lands with the last hit and is at its loudest inside OVERREACT. Three takes, any style:
//   1 drone: saws and a sine on the chord's root, more detuned and more open each step, a fifth from 5, the octave under from 8
//   2 chant: low synthesised voices (a buzz through two vowel formants), one more voice every two steps, the vowel opening oo-oh-ah
//   3 engine: a low rumble that pulses, the pulse speeding up with the steps
// Each has its harmonics above 150 Hz so a phone speaker plays it. deep(0) turns it off.
const DKEY = 'overreact.sfx.deep', DEFAULT_DEEP = 2;
let DEEP = DEFAULT_DEEP;
try { const q = root.location && root.location.search ? new URLSearchParams(root.location.search).get('deep') : null; if (q !== null && q !== '') DEEP = clamp(Math.round(+q) || 0, 0, 3); else { const s = root.localStorage.getItem(DKEY); if (s !== null) DEEP = clamp(Math.round(+s) || 0, 0, 3); } } catch (e) { /* default */ }
let DEEPG = 1;
const VOW = [[300, 870], [400, 800], [570, 840], [700, 1100]];   // oo, oh, aw, ah
function chantVoice(t, f, g, d, vi, pan, a) { const v = VOW[clamp(vi, 0, 3)];
  [[v[0], 6, 1], [v[1], 8, 0.55], [2500, 6, 0.12]].forEach(([fq, q, gg]) => V({ t, f, type: 'sawtooth', g: g * gg, a: a || 0.06, h: d * 0.65, d: d * 0.35, bp: fq, bq: q, pan, bed: true, rev: 0.25, vib: { f: 4.6 + rnd(), c: 9, in: 0.2 }, det: (rnd() - 0.5) * 14 }));
  V({ t, f, g: g * 0.5, a: a || 0.06, h: d * 0.65, d: d * 0.35, bed: true }); }
function deepStep(t, n, P, ix, big, rootM) {
  const L = Math.min(1, Math.pow(10, 1.6 * (Math.min(n, 13) - 12) / 20)) * 1.15 * (big || 1) * (DEEPG || 1), d = P * 1.08 + 0.04, r = mf((rootM == null ? ROOT[ix] : rootM) - 12);
  if (DEEP === 1) {
    const det = 4 + 2.2 * n, lp = 260 + 70 * n, f = [r]; if (n >= 5) f.push(r * 1.5); if (n >= 8) f.push(r / 2);
    V({ t, f: r * 2, type: 'sawtooth', g: 0.035 * L, a: 0.05, h: d * 0.6, d: d * 0.4, lp: 900, sat: 1.8, bed: true }); V({ t, f: r * 3, type: 'sawtooth', g: 0.02 * L, a: 0.05, h: d * 0.6, d: d * 0.4, lp: 1200, bed: true });
    f.forEach((fq, i) => { [-1, 1].forEach(k => V({ t, f: fq, type: 'sawtooth', det: k * det, g: 0.05 * L, a: 0.05, h: d * 0.6, d: d * 0.4, lp, q: 2, sat: 1.6, pan: k * 0.3 * (i + 1) / f.length, bed: true })); V({ t, f: fq, g: 0.07 * L, a: 0.05, h: d * 0.6, d: d * 0.4, bed: true }); });
  } else if (DEEP === 2) {
    const k = Math.min(7, 1 + Math.floor(n / 2)), vi = Math.min(3, Math.floor((n - 1) / 3)), notes = [r * 2, r * 3, r * 2 * 1.003, r * 4, r * 3 * 0.997, r, r * 2 * 0.997];
    for (let i = 0; i < k; i++) chantVoice(t, notes[i], 0.09 * L / Math.sqrt(k) * 1.6, d, vi, (i % 2 ? 1 : -1) * 0.15 * i);
  } else if (DEEP === 3) {
    const rate = clamp(2.5 / Math.max(0.2, P) * (1 + n / 12), 3, 16);
    V({ t, f: r, type: 'sawtooth', g: 0.12 * L, a: 0.04, h: d * 0.6, d: d * 0.4, lp: 300 + 50 * n, q: 3, sat: 2, trem: { f: rate, d: 0.9 }, bed: true });
    V({ t, f: r / 2, type: 'square', g: 0.05 * L, a: 0.04, h: d * 0.6, d: d * 0.4, lp: 220, trem: { f: rate, d: 0.9 }, bed: true });
    V({ t, f: r * 2, type: 'sawtooth', g: 0.05 * L, a: 0.04, h: d * 0.6, d: d * 0.4, lp: 800, sat: 2, trem: { f: rate, d: 0.9 }, bed: true });
    N({ t, col: 'b', ft: 'bandpass', f: 160 + 10 * n, q: 1.2, g: 0.18 * L, a: 0.04, h: d * 0.6, d: d * 0.4, trem: { f: rate * 2, d: 0.8 }, bed: true });
  }
}
// with the last hit: the deep layer at full, ringing out over 1.4 s; inside OVERREACT: its biggest, three seconds long
function deepLand(t, peak) { if (!DEEP) return; if (STY === 4) { deepLand4(t, peak); return; } const P = peak ? 2.8 : 1.3, n = peak ? 16 : 12;
  if (DEEP === 2) { const r = mf(38); [r * 2, r * 3, r * 4, r * 2 * 1.004, r * 3 * 0.996, r, r * 1.5, r * 5].slice(0, peak ? 8 : 6).forEach((f, i) => chantVoice(t, f, (peak ? 0.075 : 0.055), P, 3, (i % 2 ? 1 : -1) * 0.12 * i, 0.02)); }
  else deepStep(t, n, P, 0, peak ? 1.5 : 1.1); }

// ===================== a step, built in layers that come in with the step number =====================
// thump on the beat; an offbeat from step 2; a second note of the chord from 4; sixteenths from 6; a bed from 7; the melody
// doubled from 9; a roll into the next step from 10. P is the guessed time to the next step.
function stepLayers(S, kind, n, o) {
  const t = begin(); if (t == null) return; o = o || {}; const last = !!o.last, P = clk(t, n), e = lvl(n) * Math.sqrt(clamp(o.bell || 1, 0.6, 1.6)), pan = (n % 2 ? -1 : 1) * 0.28;
  if (last) { S.finale(t, kindOf(kind), n, o); DEEPG = S.deepG || 1; deepLand(t, false); DEEPG = 1; return; }
  const ix = chordIx(n), kd = kindOf(kind), m = S.mel(n), f = mf(m + (KOCT[kd] || 0)), kv = S.K[kd] || S.K.lactol, dur = o.fast ? 0.6 : 1;
  S.thump(t, (0.06 + 0.04 * Math.min(n, 12)) * Math.sqrt(clamp(o.bell || 1, 0.6, 1.6)), n); const kg = S.kg || 1; kv(t, f, 0.85 * kg * e * (o.fast ? 0.85 : 1), pan); kindKnock(t, kd, 0.12 * kg * e); duck(t, 0.35, 0.22);
  if (o.echo) { kv(t + 0.11 * dur, f, 0.06 * e, -pan); }
  // the kind answers itself on the offbeat, so each kind colors the whole step, not just its first note
  if (n >= 2) { S.off(t + P / 2, e * 0.8, n, -pan); kv(t + P / 2, f * (n >= 5 ? 1.5 : 1), 0.32 * kg * e, -pan); }
  if (n >= 3) S.bass(t, ix, P, e, n);
  if (DEEP && n >= (S.deepFrom || 2)) { DEEPG = S.deepG || 1; deepStep(t, n, P, ix, 1, S.root ? S.root[ix] + 12 : null); DEEPG = 1; }
  if (n >= 4) S.harm(t, (S.under || under)(m, ix), e, -pan, n);
  if (n >= 6) { S.six(t + P / 4, e * 0.7, n, pan); S.six(t + P * 3 / 4, e * 0.85, n, -pan); }
  if (n >= 7) S.pad(t, ix, P, clamp((n - 6) / 6, 0.15, 1), n);
  if (n >= 9) S.dbl(t, f, e, n, pan);
  if (n >= 10) S.roll(t, P, e, n);
}

const STYLE = {
  1: { name: 'bench', mel, K: BK,
    thump: (t, g) => B.thump(t, g),
    off: (t, e, n, p) => B.wood(t, mf(81 + (n >= 8 ? 5 : 0)), 0.13 * e, { pan: p }),
    bass: (t, ix, P, e, n) => { B.marimba(t, mf(ROOT[ix]), 0.24 * e, { pan: 0, bright: 0.5 }); if (n >= 5 && (n - 1) % 3 === 0) B.gong(t, mf(ROOT[ix] - 12), 0.16 * e, { d: 1.6 }); },
    harm: (t, m, e, p) => B.marimba(t, mf(m), 0.16 * e, { pan: p }),
    six: (t, g, n, p) => B.shaker(t, 0.05 * g, { pan: p }),
    pad: (t, ix, P, lv) => PROG[ix].forEach((m, i) => V({ t, f: mf(m + 12), g: 0.018 * lv, a: 0.08, h: P * 0.5, d: P * 0.6, pan: i - 1, rev: 0.3, bed: true, vib: { f: 4.5, c: 6 }, fm: { r: 2, i: 0.3, i1: 0.3 } })),
    dbl: (t, f, e, n, p) => B.glass(t, f * 2, 0.08 * e, { pan: -p, d: 0.6 }),
    roll: (t, P, e, n) => { const f = mf(mel(n + 1)), k = n >= 11 ? 6 : 4; for (let i = 0; i < k; i++) B.marimba(t + P * (0.55 + 0.4 * i / k), f, 0.026 * e * (0.5 + i / k), { pan: 0.3 * (i % 2 ? 1 : -1), d: 0.4 }); },
    finale(t, kind, n) {
      // the full struck chord: D across four octaves on marimba, glass and metal, the kind's own voice on top, then a crash of glass
      [38, 45, 50, 57, 62, 66, 69, 74].forEach((m, i) => B.marimba(t, mf(m), 0.11, { pan: (i / 7 - 0.5) * 1.2, d: 1.8 }));
      [78, 81, 86, 90].forEach((m, i) => B.glass(t + 0.004 * i, mf(m), 0.09, { pan: (i / 3 - 0.5) * 1.4, d: 1.4 }));
      B.metal(t, mf(74), 0.1, { d: 1.6 }); (BK[kind] || BK.lactol)(t, mf(86), 0.18, 0);
      for (let i = 0; i < 22; i++) { const tt = t + 0.01 + Math.pow(rnd(), 1.6) * 0.5; B.glass(tt, 1900 + rnd() * 4200, 0.05 * (1 - (tt - t) * 1.3), { pan: rnd() * 1.6 - 0.8, d: 0.35 }); }
      N({ t, ft: 'highpass', f: 6000, g: 0.16, a: 0.001, d: 1.6, pan: -0.3, rev: 0.4 }); N({ t, ft: 'bandpass', f: 2600, q: 0.7, g: 0.2, a: 0.001, d: 0.3, pan: 0.3, rev: 0.3 });
      duck(t, 0.15, 0.6); bloom(t, 3.2, 1.2);
    },
    snap: (t, n, w) => { N({ t, ft: 'bandpass', f: 1700, q: 1, g: 0.06 * w * lvl(n), a: 0.0004, d: 0.025 }); },
    boom: t => { V({ t, f: 260, f1: 130, ft: 0.08, type: 'triangle', g: 0.22, a: 0.0008, d: 0.25, sat: 2 }); K({ t, f0: 170, f1: 36, pt: 0.07, d: 1.0, g: 1.4, harm: 0.4, sat: 2, click: 0.25 }); B.gong(t, mf(38), 0.3, { d: 3.2 }); N({ t, col: 'b', ft: 'lowpass', f: 300, g: 0.3, a: 0.002, d: 0.8 }); },
    flag(t, k) {
      const ix = chordIx(SB.clk.n || 1);
      if (k === 1) { B.wood(t, mf(79), 0.25, { pan: -0.3 }); B.wood(t + 0.07, mf(86), 0.3, { pan: 0.3 }); B.marimba(t + 0.07, mf(62), 0.22); B.marimba(t + 0.07, mf(69), 0.2); B.marimba(t + 0.07, mf(74), 0.18); B.thump(t + 0.07, 0.4); }
      else if (k === 2) { [66, 70, 73].forEach((m, i) => V({ t: t + i * 0.03, f: mf(m), g: 0.12, a: 0.002, d: 1.1, pan: (i - 1) * 0.6, rev: 0.35, trem: { f: 6.5, d: 0.8 }, vib: { f: 6.5, c: 25 }, fm: { r: 4, i: 0.4, i1: 0.05, d: 0.2 } })); B.thump(t, 0.3); }
      else if (k === 3) { for (let i = 0; i < 9; i++) B.glass(t + i * 0.028, mf(69 + [0, 4, 7, 12, 16, 19, 24, 28, 31][i]), 0.07 + i * 0.008, { pan: (i / 8 - 0.5) * 1.6, d: 0.5 }); N({ t, ft: 'bandpass', f: 3000, f1: 9000, fT: 0.3, q: 1, g: 0.2, a: 0.25, ax: true, d: 0.25, rev: 0.3 }); B.metal(t + 0.25, mf(81), 0.12); B.thump(t + 0.25, 0.45); }
      else {
        // the loudest, longest, richest: a deep gong, the whole bench struck together, glass raining down for two seconds
        K({ t, f0: 180, f1: 34, pt: 0.08, d: 1.4, g: 1.5, harm: 0.45, sat: 2, click: 0.3 }); B.gong(t, mf(26), 0.4, { d: 4.0 }); B.gong(t, mf(38), 0.3, { d: 3.5 });
        [50, 57, 62, 66, 69, 74, 78, 81].forEach((m, i) => B.marimba(t, mf(m), 0.12, { pan: (i / 7 - 0.5) * 1.4, d: 2.2 }));
        [86, 90, 93, 98].forEach((m, i) => B.glass(t, mf(m), 0.09, { pan: (i / 3 - 0.5) * 1.6, d: 2.4 })); B.metal(t, mf(62), 0.14, { d: 2.5 }); B.metal(t + 0.01, mf(69), 0.1, { d: 2.5 });
        N({ t, ft: 'highpass', f: 5000, g: 0.2, a: 0.001, d: 2.8, pan: -0.4, rev: 0.5 }); N({ t, ft: 'highpass', f: 7000, g: 0.16, a: 0.001, d: 2.6, pan: 0.4, rev: 0.5 });
        midSwell(t, [62, 66, 69, 74], 0.07, 1.4, 1.8, 'sine'); V({ t, f: 220, f1: 110, ft: 0.1, type: 'triangle', g: 0.25, a: 0.0008, d: 0.35, sat: 2 }); [62, 66, 69, 74, 78].forEach((m, i) => V({ t: t + 0.05, f: mf(m), g: 0.05, a: 0.3, h: 1.2, d: 1.6, pan: (i / 4 - 0.5) * 1.4, rev: 0.4, trem: { f: 6, d: 0.5 }, fm: { r: 2, i: 0.4, i1: 0.4 } }));
        const rain = [98, 93, 90, 86, 81, 78, 74, 69, 66, 62]; for (let i = 0; i < 26; i++) { const tt = t + 0.15 + i * 0.075 + rnd() * 0.03; B.glass(tt, mf(rain[i % rain.length] + (i > 12 ? -12 : 0)), 0.06 * (1 - i / 32), { pan: rnd() * 1.6 - 0.8, d: 0.6 }); }
        duck(t, 0.1, 1.0); bloom(t, 4.0, 2.2);
      }
    },
    flagSoft: t => B.glass(t, mf(86), 0.07, { d: 0.6 }),
    queue: (t, i) => B.glass(t, mf([74, 78, 81][i]), 0.09, { d: 0.4, pan: (i - 1) * 0.4 }),
    fire: t => { B.thump(t, 0.55); B.marimba(t, mf(50), 0.25); B.wood(t, mf(74), 0.15); },
    strike: (t, i, w) => { const g = (0.4 + 0.12 * i) * w; B.thump(t, g); B.marimba(t, mf([50, 57, 62][i]), 0.22 * w); if (i === 2) B.glass(t, mf(74), 0.12 * w); N({ t, ft: 'bandpass', f: 800, q: 1.5, g: 0.15 * w, a: 0.0005, d: 0.03 }); },
    handoff: t => { B.gong(t, mf(50), 0.22, { d: 1.6 }); B.marimba(t, mf(38), 0.2); SB.clk.P0 = 0.86; },
    tick: (t, n) => B.wood(t, mf(84 + [0, 2, 4, 7, 9][(n || 0) % 5]) * (1 + (rnd() - 0.5) * 0.01), 0.035, { pan: rnd() * 0.8 - 0.4 }),
    swish: (t, d) => N({ t, col: 'p', ft: 'bandpass', f: 500, f1: 2200, fT: d * 1.4, q: 0.8, g: 0.05, a: d * 0.9, ax: true, d: d * 0.6, bed: true, pan: -0.4, pan1: 0.4 }),
    drone: (t, lv, step, d) => { const ix = chordIx(SB.clk.n || 1); PROG[ix].forEach((m, i) => V({ t, f: mf(m), g: 0.02 + 0.04 * lv, a: Math.min(0.08, d * 0.3), h: d * 0.5, d: d * 0.6, pan: i - 1, bed: true, rev: 0.3, fm: { r: 1, i: 0.2, i1: 0.2 }, vib: { f: 5, c: 5 } })); },
    draw: (t, n, d) => N({ t, ft: 'highpass', f: 5000, g: 0.04, a: d, ax: true, d: 0.02, cut: true, bed: true }),
    windup: (t, n, ms, last) => { const d = ms / 1000;
      if (!last) { if (d > 0.1) { const f = mf(mel(n)); [0.75, 0.88].forEach((u, i) => B.marimba(t + d * u, f * (i ? 1 : 0.89), 0.04 * lvl(n), { pan: 0.3, d: 0.3 })); } return; }
      const end = d - 0.17, k = Math.max(4, Math.floor(end / 0.035)); for (let i = 0; i < k; i++) { const u = i / k; B.marimba(t + u * end, mf(62 + Math.round(u * 24)), 0.05 + 0.1 * u, { pan: (i % 2 ? 0.4 : -0.4), d: 0.25 }); }
      N({ t, ft: 'highpass', f: 3000, f1: 9000, fT: end, g: 0.12, a: end, ax: true, d: 0.01, cut: true, bed: true }); breathe(t + end, t + d); },
    clink: (t, n, m) => { B.glass(t, mf(86 + [0, 4, 7][(n || 1) % 3]), 0.1, { d: 0.5, pan: 0.5 }); B.drip(t + 0.03, 900, 0.08, { pan: 0.5 }); },
    gold: (t, n) => { B.metal(t, mf(95), 0.08, { d: 0.6, pan: 0.4 }); B.metal(t + 0.07, mf(100), 0.09, { d: 0.8, pan: 0.4 }); },
    wasted: t => { B.marimba(t, mf(43), 0.25, { bright: 0.1, lp: 300, d: 0.4 }); V({ t, f: 180, f1: 90, ft: 0.15, g: 0.15, type: 'triangle', a: 0.002, d: 0.18, lp: 600 }); N({ t, ft: 'lowpass', f: 400, g: 0.2, a: 0.001, d: 0.08 }); },
    lost: t => { [69, 66, 62, 59, 54].forEach((m, i) => B.marimba(t + i * 0.26, mf(m - (i === 4 ? 1 : 0)), 0.2 - i * 0.02, { d: 1.2, bright: 0.6 })); B.gong(t + 1.3, mf(38), 0.2, { d: 2.4 }); },
    pageTurn: t => { N({ t, col: 'p', ft: 'bandpass', f: 700, f1: 3500, fT: 0.22, q: 1, g: 0.18, a: 0.06, d: 0.18, pan: -0.5, pan1: 0.5 }); B.wood(t + 0.22, mf(79), 0.06); }
  },
  2: { name: 'arcade', mel, K: AK, kg: 1.4,
    thump: (t, g) => A.kick(t, g * 1.05),
    off: (t, e, n, p) => { A.hat(t, 0.09 * e, { open: n >= 5, pan: 0.3 }); if (n >= 4) A.snare(t, 0.2 * e); },
    bass: (t, ix, P, e, n) => { const f = mf(ROOT[ix] - 12); A.bass(t, f, P / 2, 0.14 * e); A.bass(t + P / 2, f * 2, P / 2, 0.1 * e); },
    harm: (t, m, e, p) => A.pluck(t, mf(m), 0.12 * e, { pan: p, d: 0.25 }),
    six: (t, g, n, p) => { A.hat(t, 0.05 * g, { pan: p }); if (n >= 8) A.pluck(t, mf(mel(n) + 12), 0.05 * g, { pan: p, d: 0.12 }); },
    pad: (t, ix, P, lv) => PROG[ix].forEach((m, i) => A.saw(t, mf(m), 0.05 * lv, { a: 0.05, h: P * 0.5, d: P * 0.55, lp: 700 + 2600 * lv, n: 2, spread: 16, width: 0.6, pan: i - 1, bed: true, rev: 0.3 })),
    dbl: (t, f, e, n, p) => A.lead(t, f * 2, 0.05 * e, { d: 0.22, vib: true, pan: -p }),
    roll: (t, P, e, n) => { const k = n >= 11 ? 8 : 4; for (let i = 0; i < k; i++) { const u = (k === 8 ? 0.5 : 0.5) + 0.48 * i / k; A.snare(t + P * u, 0.06 * e * (0.4 + i / k), { pan: 0.1 * (i % 2 ? 1 : -1) }); } },
    finale(t, kind, n) {
      // the resolved chord: D major across three octaves on a wide detuned stack, a lead and a bell on top, a crash
      [50, 57, 62, 66, 69, 74, 78].forEach((m, i) => A.saw(t, mf(m), 0.06, { a: 0.003, h: 0.25, d: 1.6, lp: 6000, lp1: 1300, lpt: 1.4, n: 3, spread: 16, width: 0.9, pan: (i / 6 - 0.5) * 0.6, rev: 0.35 }));
      A.lead(t, mf(86), 0.09, { d: 1.2, vib: true }); A.bell(t, mf(86), 0.12, { d: 1.6 }); (AK[kind] || AK.lactol)(t, mf(74), 0.14, 0); A.crash(t, 0.2, 2.0);
      duck(t, 0.12, 0.6); bloom(t, 2.8, 1.2);
    },
    snap: (t, n, w) => { if (n >= 5) A.clap(t, 0.06 * w * lvl(n)); },
    boom: t => { V({ t, f: 300, f1: 150, ft: 0.06, type: 'triangle', g: 0.2, a: 0.0008, d: 0.2, sat: 2 }); A.kick(t, 1.2); A.sub(t, 120, 31, 1.3, 1.2); A.clap(t, 0.3); },
    flag(t, k) {
      if (k === 1) { A.kick(t, 0.5); [62, 69, 74].forEach((m, i) => A.saw(t, mf(m), 0.1, { d: 0.35, n: 3, spread: 12, width: 0.6, lp: 4000, lp1: 1200, lpt: 0.3 })); A.bell(t + 0.08, mf(86), 0.12, { d: 0.8 }); A.lead(t, mf(74), 0.06, { d: 0.1 }); A.lead(t + 0.07, mf(81), 0.07, { d: 0.3 }); }
      else if (k === 2) { A.kick(t, 0.45); [57, 62, 64, 69].forEach((m, i) => V({ t, f: mf(m), type: 'sawtooth', g: 0.055, a: 0.01, d: 1.0, lp: 2600, q: 3, pan: (i / 3 - 0.5) * 1.2, rev: 0.3, vib: { f: 5.5, c: 45, in: 0.15 }, trem: { f: 5.5, d: 0.5 } })); A.zap(t, 900, 600, 0.3, 0.05, { type: 'triangle' }); }
      else if (k === 3) { A.riser(t, 0.22, 0.14); A.zap(t, 300, 2400, 0.22, 0.06, { type: 'sawtooth' }); [57, 61, 64, 67].forEach((m, i) => A.saw(t + 0.22, mf(m + 12), 0.075, { d: 0.6, n: 3, spread: 18, width: 0.8, lp: 7000, lp1: 2000, lpt: 0.5 })); A.kick(t + 0.22, 0.6); A.crash(t + 0.22, 0.09, 0.8); }
      else {
        // the loudest, longest, richest: a fast climb to the top, a huge D major chord, a sub drop, a crash and a shimmering tail
        [62, 66, 69, 74, 78, 81, 86, 90].forEach((m, i) => A.lead(t + i * 0.024, mf(m), 0.05 + i * 0.006, { d: 0.16, pan: (i / 7 - 0.5) * 1.4 }));
        const T = t + 0.2; A.kick(T, 1.3); A.sub(T, 130, 29, 2.0, 1.3);
        midSwell(T, [62, 66, 69, 74], 0.06, 1.3, 1.6, 'sawtooth'); V({ t: T, f: 300, f1: 150, ft: 0.06, type: 'triangle', g: 0.25, a: 0.0008, d: 0.3, sat: 2 });
        [38, 50, 57, 62, 66, 69, 74, 78, 81].forEach((m, i) => A.saw(T, mf(m), 0.07, { a: 0.003, h: 1.1, d: 2.6, lp: 7500, lp1: 1100, lpt: 2.4, n: 4, spread: 20, width: 1, pan: (i / 8 - 0.5) * 0.4, rev: 0.4 }));
        A.bell(T, mf(86), 0.14, { d: 2.8 }); A.bell(T + 0.01, mf(93), 0.08, { d: 2.4, pan: 0.5 }); A.lead(T, mf(98), 0.05, { d: 2.0, vib: true });
        A.crash(T, 0.26, 2.8); A.clap(T, 0.3);
        for (let i = 0; i < 16; i++) { const tt = T + 0.3 + i * 0.11; A.bell(tt, mf([98, 93, 90, 86][i % 4] - (i > 7 ? 12 : 0)), 0.05 * (1 - i / 20), { d: 0.7, pan: (i % 2 ? 0.6 : -0.6) }); }
        duck(T, 0.1, 1.0); bloom(T, 3.6, 2.4);
      }
    },
    flagSoft: t => A.bell(t, mf(93), 0.06, { d: 0.6 }),
    queue: (t, i) => A.lead(t, mf([74, 78, 81][i]), 0.08, { d: 0.08, pan: (i - 1) * 0.4 }),
    fire: t => { A.zap(t, 180, 1600, 0.14, 0.09, { type: 'sawtooth' }); A.kick(t + 0.12, 0.55); N({ t, ft: 'bandpass', f: 400, f1: 6000, fT: 0.13, q: 1.2, g: 0.12, a: 0.12, ax: true, d: 0.03, cut: true }); },
    strike: (t, i, w) => { A.kick(t, (0.45 + 0.12 * i) * w); const ch = [PROG[0], PROG[2], PROG[3]][i]; ch.forEach((m, j) => A.saw(t, mf(m + 12), 0.06 * w, { d: 0.22, n: 2, spread: 12, width: 0.5, lp: 4500, lp1: 1200, lpt: 0.2, pan: j - 1 })); if (i === 2) A.clap(t, 0.2 * w); },
    handoff: t => { V({ t, f: 110, f1: 55, ft: 0.35, type: 'sawtooth', g: 0.14, a: 0.003, d: 0.5, lp: 2500, lp1: 200, lpt: 0.45, q: 5, sat: 1.5 }); A.hat(t, 0.06, { open: true }); SB.clk.P0 = 0.86; },
    tick: (t, n) => V({ t, f: mf(86 + [0, 4, 7, 12, 16][(n || 0) % 5]) * (1 + (rnd() - 0.5) * 0.01), type: 'triangle', g: 0.03, a: 0.0006, d: 0.035, pan: rnd() * 0.8 - 0.4 }),
    swish: (t, d) => N({ t, ft: 'bandpass', f: 800, f1: 4500, fT: d * 1.4, q: 1, g: 0.04, a: d * 0.9, ax: true, d: d * 0.5, bed: true, pan: -0.5, pan1: 0.5 }),
    drone: (t, lv, step, d) => { const ix = chordIx(SB.clk.n || 1); PROG[ix].forEach((m, i) => A.saw(t, mf(m - 12), 0.025 + 0.035 * lv, { a: Math.min(0.06, d * 0.3), h: d * 0.5, d: d * 0.6, lp: 500 + 2000 * lv, n: 2, spread: 14, width: 0.7, pan: i - 1, bed: true, rev: 0.25 })); },
    draw: (t, n, d) => N({ t, ft: 'bandpass', f: 1200, f1: 5000, fT: d, q: 1, g: 0.05, a: d, ax: true, d: 0.02, cut: true, bed: true }),
    windup: (t, n, ms, last) => { const d = ms / 1000;
      if (!last) { if (d > 0.12) N({ t: t + d * 0.35, ft: 'bandpass', f: 1500, f1: 4000, q: 0.8, g: 0.05 * lvl(n), a: d * 0.6, ax: true, d: 0.01, cut: true, bed: true }); return; }
      const end = d - 0.16; A.riser(t, end, 0.16); const k = Math.max(4, Math.floor(end / 0.03)); for (let i = 0; i < k; i++) { const u = i / k; A.snare(t + end * (1 - Math.pow(1 - u, 1.6)), 0.03 + 0.09 * u, { pan: i % 2 ? 0.15 : -0.15 }); }
      breathe(t + end, t + d); },
    clink: (t, n) => { A.lead(t, mf(93), 0.05, { d: 0.05, pan: 0.5 }); A.bell(t + 0.04, mf(98), 0.06, { d: 0.4, pan: 0.5 }); },
    gold: t => { A.lead(t, mf(93), 0.07, { d: 0.07 }); A.lead(t + 0.07, mf(98), 0.08, { d: 0.35, vib: true }); A.bell(t + 0.07, mf(98), 0.05, { d: 0.5 }); },
    wasted: t => { V({ t, f: 320, f1: 110, ft: 0.2, type: 'square', g: 0.08, a: 0.002, d: 0.25, lp: 900 }); A.kick(t, 0.25); },
    lost: t => { [69, 65, 62, 57].forEach((m, i) => A.lead(t + i * 0.28, mf(m), 0.07, { d: 0.5, vib: true })); V({ t: t + 1.1, f: 73.4, f1: 55, ft: 1.2, type: 'sawtooth', g: 0.12, a: 0.01, d: 1.4, lp: 600, lp1: 150 }); },
    pageTurn: t => { N({ t, ft: 'bandpass', f: 600, f1: 5000, fT: 0.2, q: 1.2, g: 0.12, a: 0.06, d: 0.16, pan: -0.5, pan1: 0.5 }); V({ t: t + 0.2, f: mf(86), g: 0.04, type: 'triangle', a: 0.001, d: 0.06 }); }
  },
  3: { name: 'boiler', mel: mel3, K: HK, kg: 1.5,
    thump: (t, g) => H.knock(t, g * 1.05),
    off: (t, e, n, p) => H.chuff(t, 0.12 * e, { pan: p, f: 1000 + 40 * n }),
    bass: (t, ix, P, e, n) => H.rumble(t, P, 0.025 + 0.007 * n),
    harm: (t, m, e, p, n) => { for (let i = 0; i < Math.min(5, n - 2); i++) H.bubble(t + 0.05 + rnd() * 0.3, 300 + rnd() * 700, 0.07 * e, { pan: rnd() * 1.2 - 0.6 }); },
    six: (t, g, n, p) => H.chuff(t, 0.1 * g, { pan: p, d: 0.06, f: 1400 }),
    pad: (t, ix, P, lv, n) => { H.whistle(t, 820 * Math.pow(2, (n - 7) / 9), P * 1.02, 0.03 + 0.04 * lv, { f1: 820 * Math.pow(2, (n - 6) / 9) }); if (n >= 9) H.whistle(t, 820 * Math.pow(2, (n - 7) / 9) * 1.06, P * 1.02, 0.02 + 0.03 * lv, { f1: 820 * Math.pow(2, (n - 6) / 9) * 1.06 }); H.hissbed(t, P, 0.02 + 0.03 * lv); },
    dbl: (t, f, e, n, p) => { for (let i = 0; i < 2; i++) H.ping(t + 0.1 + rnd() * 0.25, f * (2 + rnd()), 0.04 * e, { pan: rnd() * 1.4 - 0.7, d: 0.4 }); },
    roll: (t, P, e, n) => { const k = n >= 11 ? 8 : 4; for (let i = 0; i < k; i++) H.chuff(t + P * (0.5 + 0.48 * i / k), 0.06 * e * (0.5 + i / k), { d: 0.05, f: 1600, pan: i % 2 ? 0.3 : -0.3 }); },
    finale(t, kind, n) {
      // the valve lets go: a cork-bright pop, steam roaring out across the stereo field, the boiler ringing after
      H.pop(t, 0.5); H.steam(t, 1.6, 0.26);
      [[1, 0.2, 3.2], [2.32, 0.12, 2.4], [3.86, 0.09, 1.8], [5.1, 0.07, 1.3], [6.9, 0.05, 0.9], [9.0, 0.04, 0.6]].forEach(([r, g, d], i) => { V({ t, f: 110 * r, g, a: 0.001, d, pan: (i % 2 ? 0.3 : -0.3), rev: 0.45 }); V({ t, f: 110 * r * 1.004, g: g * 0.6, a: 0.001, d, pan: (i % 2 ? -0.3 : 0.3), rev: 0.45 }); });
      (HK[kind] || HK.lactol)(t, mf(74), 0.18, 0); H.rattle(t + 0.1, 0.06, 14, 0.9);
      duck(t, 0.1, 0.8); bloom(t, 3.4, 1.4);
    },
    snap: (t, n, w) => { if (n >= 4) V({ t, f: 2400, g: 0.03 * w * lvl(n), a: 0.0004, d: 0.05, fm: { r: 1.41, i: 3, i1: 0.1, d: 0.03 }, pan: 0.4 }); },
    boom: t => { V({ t, f: 240, f1: 110, ft: 0.1, type: 'triangle', g: 0.22, a: 0.0008, d: 0.3, sat: 2 }); K({ t, f0: 125, f1: 27, pt: 0.12, d: 2.2, g: 1.5, harm: 0.45, sat: 2, click: 0.35 }); N({ t, col: 'b', ft: 'lowpass', f: 300, f1: 70, fT: 2, g: 0.55, a: 0.002, d: 2.4 }); K({ t: t + 0.09, f0: 90, f1: 30, pt: 0.1, d: 1.2, g: 0.8, harm: 0.35, sat: 2 }); },
    flag(t, k) {
      if (k === 1) { H.knock(t, 0.5); H.ping(t, mf(62), 0.14, { d: 0.6 }); H.steam(t, 0.12, 0.12, { f: 6000, f1: 5000 }); V({ t: t + 0.06, f: 1900, g: 0.08, a: 0.0004, d: 0.12, fm: { r: 1.41, i: 2, i1: 0.1, d: 0.05 } }); H.knock(t + 0.06, 0.3); }
      else if (k === 2) { V({ t, f: 140, type: 'sawtooth', g: 0.16, a: 0.005, d: 1.1, lp: 1400, q: 2, vib: { f: 7.5, c: 140, in: 0.01 }, rev: 0.3, sat: 1.5 }); V({ t, f: 280, g: 0.08, a: 0.005, d: 0.9, vib: { f: 7.5, c: 140, in: 0.01 }, pan: 0.4 }); H.rattle(t, 0.05, 8, 0.6); H.knock(t, 0.35); }
      else if (k === 3) { N({ t, col: 'p', ft: 'bandpass', f: 300, f1: 3200, fT: 0.35, q: 0.9, g: 0.3, a: 0.2, ax: true, d: 0.4, rev: 0.35 }); H.whistle(t, 1400, 0.35, 0.06, { f1: 2800, ax: true, a: 0.2 }); for (let i = 0; i < 10; i++) N({ t: t + 0.15 + rnd() * 0.4, ft: 'bandpass', f: 2000 + rnd() * 5000, q: 3, g: 0.12, a: 0.0004, d: 0.012, pan: rnd() * 1.6 - 0.8 }); H.knock(t + 0.2, 0.5); }
      else {
        // the loudest, longest, richest: the boiler goes: a double boom, steam roaring for seconds, the shell ringing, debris
        K({ t, f0: 140, f1: 25, pt: 0.14, d: 2.6, g: 1.6, harm: 0.5, sat: 2, click: 0.4 }); K({ t: t + 0.11, f0: 100, f1: 27, pt: 0.1, d: 2.0, g: 1.0, harm: 0.4, sat: 2 });
        N({ t, col: 'b', ft: 'lowpass', f: 400, f1: 60, fT: 3, g: 0.6, a: 0.002, d: 3.2 }); H.steam(t, 3.0, 0.3, { f: 7000, f1: 900 }); H.pop(t, 0.5);
        [[1, 0.24, 4.2], [2.32, 0.15, 3.4], [3.86, 0.11, 2.6], [5.1, 0.08, 2.0], [6.9, 0.06, 1.4], [9.0, 0.05, 1.0], [12.1, 0.03, 0.7]].forEach(([r, g, d], i) => { V({ t, f: 73.4 * r, g, a: 0.001, d, pan: (i % 2 ? 0.35 : -0.35), rev: 0.5 }); V({ t, f: 73.4 * r * 1.005, g: g * 0.7, a: 0.001, d, pan: (i % 2 ? -0.35 : 0.35), rev: 0.5 }); });
        H.whistle(t + 0.05, 2600, 1.4, 0.05, { f1: 700 }); midSwell(t, [50, 51, 57, 62], 0.06, 1.3, 1.8, 'sawtooth'); V({ t, f: 240, f1: 100, ft: 0.12, type: 'triangle', g: 0.28, a: 0.0008, d: 0.4, sat: 2 });
        for (let i = 0; i < 30; i++) { const tt = t + 0.2 + Math.pow(rnd(), 1.5) * 2.2; V({ t: tt, f: 1200 + rnd() * 4000, g: 0.05 * (1 - (tt - t) / 2.6), a: 0.0004, d: 0.05 + rnd() * 0.12, pan: rnd() * 1.6 - 0.8, rev: 0.3, fm: { r: 1.73, i: 2, i1: 0.1, d: 0.03 } }); }
        duck(t, 0.08, 1.2); bloom(t, 4.2, 2.4);
      }
    },
    flagSoft: t => H.ping(t, mf(74), 0.06, { d: 0.6 }),
    queue: (t, i) => { V({ t, f: 2200, type: 'square', g: 0.04, a: 0.0003, d: 0.01, hp: 1500 }); H.ping(t + 0.008, mf([62, 66, 69][i]), 0.08, { d: 0.35, pan: (i - 1) * 0.4 }); },
    fire: t => { H.knock(t, 0.55); H.steam(t, 0.35, 0.16, { f: 5000, f1: 2000 }); H.ping(t, mf(50), 0.15, { d: 0.9 }); },
    strike: (t, i, w) => { H.knock(t, (0.42 + 0.12 * i) * w); H.ping(t, mf([62, 67, 74][i]), 0.16 * w, { d: 0.7 }); if (i === 2) H.chuff(t, 0.2 * w); },
    handoff: t => { H.rumble(t, 0.9, 0.12); V({ t, f: 55, f1: 62, ft: 0.8, type: 'sawtooth', g: 0.1, a: 0.3, d: 0.6, lp: 300, sat: 2 }); SB.clk.P0 = 0.86; },
    tick: (t, n) => H.bubble(t, (420 + 45 * Math.min(14, n || 0)) * (1 + (rnd() - 0.5) * 0.3), 0.05, { pan: rnd() * 1.0 - 0.5 }),
    swish: (t, d) => N({ t, col: 'p', ft: 'bandpass', f: 1500, f1: 800, fT: d, q: 0.8, g: 0.045, a: d * 0.8, ax: true, d: d * 0.5, bed: true, pan: 0.4, pan1: -0.4 }),
    drone: (t, lv, step, d) => { H.whistle(t, 700 * Math.pow(2, (lv * 8 + step) / 12), d * 1.05, 0.02 + 0.03 * lv); H.hissbed(t, d, 0.015 + 0.03 * lv); },
    draw: (t, n, d) => N({ t, ft: 'highpass', f: 2500, f1: 6000, fT: d, g: 0.05, a: d, ax: true, d: 0.02, cut: true, bed: true }),
    windup: (t, n, ms, last) => { const d = ms / 1000;
      if (!last) { if (d > 0.12) N({ t: t + d * 0.3, ft: 'highpass', f: 2500, f1: 5000, g: 0.04 * lvl(n), a: d * 0.65, ax: true, d: 0.01, cut: true, bed: true }); return; }
      const end = d - 0.17; H.whistle(t, 1200, end, 0.08, { f1: 3400, ax: true, a: end * 0.9 }); N({ t, ft: 'highpass', f: 2000, f1: 7000, fT: end, g: 0.16, a: end, ax: true, d: 0.01, cut: true, bed: true }); H.rumble(t, end, 0.12);
      for (let i = 0; i < 10; i++) H.bubble(t + rnd() * end, 400 + rnd() * 900, 0.05); breathe(t + end, t + d); },
    clink: (t, n) => { H.bubble(t, 240, 0.12, { pan: 0.5 }); V({ t: t + 0.02, f: mf(88), g: 0.07, a: 0.0005, d: 0.4, pan: 0.5, fm: { r: 2.76, i: 0.6, i1: 0.02, d: 0.1 }, rev: 0.25 }); },
    gold: t => { for (let i = 0; i < 6; i++) H.ping(t + 0.25 * (1 - Math.pow(0.7, i)), mf(93), 0.06 * (1 - i / 8), { d: 0.25, pan: i % 2 ? 0.3 : -0.3 }); },
    wasted: t => { V({ t, f: 140, f1: 60, ft: 0.12, g: 0.3, a: 0.001, d: 0.2, lp: 500 }); N({ t: t + 0.03, ft: 'highpass', f: 3000, f1: 1200, g: 0.05, a: 0.01, d: 0.4 }); },
    lost: t => { H.whistle(t, 1100, 1.3, 0.06, { f1: 380 }); N({ t, ft: 'highpass', f: 3000, f1: 800, fT: 1.4, g: 0.1, a: 0.1, d: 1.3 }); V({ t: t + 0.4, f: 62, f1: 44, ft: 1.4, type: 'sawtooth', g: 0.12, a: 0.05, d: 1.4, lp: 400, sat: 2 }); },
    pageTurn: t => { N({ t, col: 'p', ft: 'bandpass', f: 700, f1: 3000, fT: 0.22, q: 1, g: 0.16, a: 0.06, d: 0.18, pan: -0.5, pan1: 0.5 }); H.steam(t + 0.12, 0.2, 0.05, { f: 5000, f1: 3000 }); }
  }
};
// ===================== the rest of the game: every screen and act has a voice in each style (docs/SOUND2.md) =====================
// Each style lends five instruments: note (its melodic voice), bell (its bright voice), hit (its thump), tick (its small click),
// boing (a creature acting); ACTS builds every act from them, and ambience() is the quiet bed for the screens between reactions.
const PAL = {
  1: { key: 0, note: (t, m, g, d) => B.marimba(t, mf(m), g, { d: d || 1 }), bell: (t, m, g) => B.glass(t, mf(m), g), hit: (t, g) => B.thump(t, g), tick: (t, g) => B.wood(t, mf(91), g),
       boing: (t, g) => { V({ t, f: 300, f1: 600, ft: 0.08, g, a: 0.001, d: 0.3, vib: { f: 14, c: 120, in: 0.01 }, rev: 0.2 }); B.wood(t, mf(79), g * 0.5); } },
  2: { key: 0, note: (t, m, g, d) => A.pluck(t, mf(m), g, { d: 0.35 * (d || 1) }), bell: (t, m, g) => A.bell(t, mf(m), g), hit: (t, g) => A.kick(t, g), tick: (t, g) => A.hat(t, g * 1.5),
       boing: (t, g) => V({ t, f: 200, f1: 900, ft: 0.12, type: 'square', g: g * 0.6, a: 0.001, d: 0.2, lp: 2500, vib: { f: 18, c: 150, in: 0.01 } }) },
  3: { key: 0, note: (t, m, g, d) => H.ping(t, mf(m), g, { d: d || 1 }), bell: (t, m, g) => H.ping(t, mf(m + 12), g, { d: 1.2 }), hit: (t, g) => H.knock(t, g), tick: (t, g) => H.bubble(t, 700, g * 1.5),
       boing: (t, g) => { [0, 0.04, 0.09].forEach((d, i) => H.bubble(t + d, 200 + i * 160, g)); V({ t, f: 150, f1: 90, ft: 0.2, type: 'sawtooth', g: g * 0.5, a: 0.002, d: 0.25, lp: 700, vib: { f: 9, c: 90 } }); } },
  // the grown-up arcade: minor, low, metal; the creature is a wet low squelch that falls, not a toy boing
  d: { key: -1, note: (t, m, g, d) => D.pluck(t, mf(m - 12), g * 1.2, { d: 0.6 * (d || 1) }), bell: (t, m, g) => D.metal(t, mf(m - 12), g), hit: (t, g) => D.kick(t, g, ARCV), tick: (t, g) => N({ t, ft: 'bandpass', f: 2600, q: 5, g: g * 1.2, a: 0.0004, d: 0.014 }),
       boing: (t, g) => { V({ t, f: 320, f1: 90, ft: 0.18, type: 'sawtooth', g: g * 0.7, a: 0.002, d: 0.25, lp: 1600, lp1: 300, q: 8, vib: { f: 11, c: 60 } }); H.bubble(t + 0.05, 180, g * 0.6); } }
};
// m: the act's notes in D major; for a minor palette (key -1) the thirds and sixths are flattened
const KEYM = (P, m) => { if (P.key !== -1) return m; const pc = ((m - 62) % 12 + 12) % 12; return (pc === 4 || pc === 9 || pc === 11) ? m - 1 : m; };
const ACTS = {
  title: (P, t) => { P.hit(t, 0.35); [62, 66, 69, 74].forEach((m, i) => P.note(t + i * 0.16, KEYM(P, m), 0.16, 1.4)); P.bell(t + 0.64, KEYM(P, 86), 0.12); },
  runStart: (P, t) => { [62, 69, 74, 78].forEach((m, i) => P.note(t + i * 0.09, KEYM(P, m), 0.14 + i * 0.02)); P.hit(t + 0.36, 0.5); P.bell(t + 0.36, KEYM(P, 86), 0.14); },
  shopOpen: (P, t) => { P.bell(t, KEYM(P, 81), 0.12); P.bell(t + 0.14, 86, 0.1); },
  buy: (P, t) => { P.tick(t, 0.06); P.note(t + 0.04, KEYM(P, 81), 0.14); P.note(t + 0.1, 86, 0.14); P.hit(t + 0.04, 0.25); },
  cantBuy: (P, t) => { P.note(t, 57, 0.14, 0.5); P.note(t + 0.12, 56, 0.14, 0.6); },
  hover: (P, t) => P.tick(t, 0.025),
  click: (P, t) => { P.tick(t, 0.06); P.hit(t, 0.12); },
  pick: (P, t) => { P.hit(t, 0.35); P.note(t, 74, 0.16); P.note(t + 0.05, KEYM(P, 81), 0.1); },
  redraw: (P, t) => { N({ t, col: 'p', ft: 'bandpass', f: 600, f1: 3000, fT: 0.2, q: 1, g: 0.12, a: 0.05, d: 0.16, pan: -0.5, pan1: 0.5 }); P.note(t + 0.18, 69, 0.12); P.note(t + 0.25, 74, 0.12); },
  roundWon: (P, t) => { [62, 66, 69, 74, 78, 81].forEach((m, i) => P.note(t + i * 0.07, KEYM(P, m), 0.13 + i * 0.01)); P.hit(t + 0.42, 0.55); P.bell(t + 0.42, 86, 0.16); [62, 69, 74].forEach(m => P.note(t + 0.42, m, 0.1, 1.6)); bloom(t + 0.42, 2.4, 1); },
  runWon: (P, t) => { [[55, 59, 62], [57, 61, 64], [62, 66, 69, 74]].forEach((ch, j) => { const tt = t + j * 0.42; P.hit(tt, 0.4 + 0.15 * j); ch.forEach(m => P.note(tt, KEYM(P, m + 12), 0.1 + 0.02 * j, j === 2 ? 2.4 : 1)); }); P.bell(t + 0.84, 98, 0.14); for (let i = 0; i < 10; i++) P.bell(t + 1.0 + i * 0.12, KEYM(P, [86, 90, 93, 98][i % 4]), 0.06); deepLand(t + 0.84, true); bloom(t + 0.84, 3.6, 2); },
  runLost: (P, t) => { [69, 65, 62, 57, 50].forEach((m, i) => P.note(t + i * 0.32, m, 0.16 - i * 0.015, 1.4)); P.hit(t + 1.6, 0.3); },
  unlock: (P, t) => { for (let i = 0; i < 8; i++) P.bell(t + i * 0.045, KEYM(P, 74 + [0, 4, 7, 12, 16, 19, 24, 28][i]), 0.05 + i * 0.006); P.hit(t + 0.36, 0.45); [62, 66, 69].forEach(m => P.note(t + 0.36, KEYM(P, m + 12), 0.1, 1.6)); },
  finding: (P, t) => { for (let i = 0; i < 6; i++) N({ t: t + i * 0.05, ft: 'bandpass', f: 3500 + rnd() * 1500, q: 3, g: 0.04, a: 0.002, d: 0.04 }); P.note(t + 0.32, KEYM(P, 81), 0.13); P.note(t + 0.42, 86, 0.15, 1.3); P.hit(t + 0.42, 0.3); },
  creature: (P, t) => { P.boing(t, 0.18); P.boing(t + 0.14, 0.12); },
  instrument: (P, t) => { P.hit(t, 0.4); N({ t, ft: 'bandpass', f: 400, f1: 2500, fT: 0.25, q: 1.5, g: 0.1, a: 0.2, ax: true, d: 0.1 }); P.note(t + 0.25, 62, 0.16); P.note(t + 0.25, 69, 0.12); }
};
// the quiet bed for the screens between reactions: kind 'title' | 'bench' | 'shop' | 'pick', or null to fade it out; dur (s) ends it (for a render)
function ambience(kind, dur) {
  const t = begin(); if (t == null) return; const c = C;
  if (SB.amb) { const old = SB.amb; if (old.timer) root.clearInterval(old.timer); old.g.gain.setTargetAtTime(0, t, 0.4); if (old.timer) root.setTimeout(() => { try { old.g.disconnect(); } catch (e) { /* gone */ } }, 3000); old.nodes.forEach(nd => { try { nd.stop(t + 2.5); } catch (e) { /* already stopped */ } }); SB.amb = null; }
  if (!kind) return;
  if (STY === 4) { amb4(kind, dur, t); return; }
  const g = c.createGain(), nodes = [], stop = dur ? t + dur : null, dark = STY === 2 && ARCV; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 1.5); if (stop) g.gain.setTargetAtTime(0, stop - 1, 0.3); g.connect(SB.bed);
  const chord = (kind === 'shop' ? [55, 62, 71] : kind === 'pick' ? [57, 64, 69] : [50, 57, 66]).map(m => dark ? KEYM(PAL.d, m) - 12 : m), lv0 = 0.018;
  chord.forEach((m, i) => { const o = c.createOscillator(), og = c.createGain(), l = c.createOscillator(), lg = c.createGain(), f = c.createBiquadFilter();
    o.type = STY === 2 ? 'sawtooth' : STY === 3 ? 'triangle' : 'sine'; o.frequency.value = mf(m) * (STY === 3 ? 0.5 : 1); o.detune.value = (i - 1) * 6;
    f.type = 'lowpass'; f.frequency.value = STY === 2 ? (dark ? 600 : 900) : 2000; l.frequency.value = 0.07 + 0.05 * i; lg.gain.value = lv0 * 0.8; og.gain.value = lv0;
    l.connect(lg); lg.connect(og.gain); o.connect(f); f.connect(og); og.connect(g); o.start(t); l.start(t); nodes.push(o, l); if (stop) { o.stop(stop + 0.1); l.stop(stop + 0.1); } });
  if (STY === 3 || dark) { const src = c.createBufferSource(), f = c.createBiquadFilter(), ng = c.createGain(); src.buffer = nbuf(c, 'p'); src.loop = true; f.type = 'bandpass'; f.frequency.value = dark ? 1200 : 2400; f.Q.value = 0.6; ng.gain.value = 0.01; src.connect(f); f.connect(ng); ng.connect(g); src.start(t); nodes.push(src); if (stop) src.stop(stop + 0.1); }
  SB.amb = { g, nodes };
}

// ===================== 4 LAB ORCHESTRA (docs/SOUND3.md) =====================
// The owner liked the arcade's pulse but not its sound ("less child game sounding"), wants "a deeper sound that gets louder" as a
// reaction goes on, a build that is "way longer", effects that sit with any soundtrack (mad science funk first; gothic, EDM, metal
// to come), and OVERREACT as "a visual and auditory dopamine hit". Style 4 is the default. Nothing in it is a bare saw, square or
// triangle oscillator, and there is no orchestra in it: no pizzicato, no choir, no pipe organ, no brass.
//   The palette: the lab itself (glass clinked, cracked and shattered, a flask rung like a bowl, a burner, steam, bubbles, a pour,
//   a cork, a clamp, paper, a drip, fizz, grains, a coin), a kit and hand drums (kick, snare, hats, cymbal, toms, congas), pitched
//   hits on vibraphone, marimba, tuned glass and electric piano, an electric bass and a low warm drone, a warm pad and an electric
//   organ for width. Every instrument is a short recording worked out by code the first time it is needed and kept (LAB), as
//   music.js does it. The hall is the soundtrack's own (the same made impulse, same seeds), on a send.
//   The harmony follows the soundtrack: roots from AA.music.chainChords() when music.js is there (else D, G, C, A), and pitched
//   notes only from D, E, G, A, which are right over every chord of every soundtrack.
//   A chain builds over 10 to 15 s: every step louder, brighter and wider than the last whatever its kind (step4); the fills
//   between the hits close up; a riser and a held breath before the last hit (rise5); AA.sfx.intensity(v) carries the build across
//   the round. OVERREACT (over5) is a strike, a fall, a swell that resolves, a pay-out and a long warm tail. AA.sfx.tremble(level)
//   is glass humming and rattling on the bench once the round's target is passed.
// AA.sfx.round(1..9) makes the same sounds more unhinged with depth (ruling AM): the kind echoes on across the room, things boil
// over and break between the hits, strokes come early and late, notes drift and slide, the organ lurches, the hall grows, and
// OVERREACT gains aftershocks. The hits themselves stay on time and in tune. Round 1 is sane.
const LAB = (function () {
  const SR = 44100, RAW = {}, GEN = { ms: 0, bytes: 0, n: 0 }; let TAKE = 0;
  const RNG = sd => { let s = Math.floor(Math.abs(sd)) % 2147483647; if (s <= 0) s += 2147483646; return () => { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; };
  const bump = (f, c, w, g) => g * Math.exp(-((f - c) / w) * ((f - c) / w));
  function fftInv(re, im) {
    const n = re.length; for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let len = 2; len <= n; len <<= 1) { const ang = 2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang), h = len >> 1;
      for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < h; k++) { const a = i + k, b = a + h, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr; re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } }
  }
  const norm = (x, pk) => { let m = 0; for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > m) m = a; } const k = pk / (m || 1); for (let i = 0; i < x.length; i++) x[i] *= k; return x; };
  const buf = s => new Float32Array(Math.floor(s * SR));
  const fade = (x, s) => { const k = Math.min(x.length, Math.floor(s * SR)); for (let i = 0; i < k; i++) x[x.length - 1 - i] *= i / k; return x; };
  // a held tone as a 1.5 s loop: amp(n, f) the strength of harmonic n, bw the smear in cents, floor(f) the breath or bow noise under it
  function padTone(f0, amp, bw, sd, floor, steady) {
    const N = 65536, re = new Float64Array(N), im = new Float64Array(N), mag = new Float64Array(N / 2), hz = SR / N, r = RNG(sd);
    for (let n = 1; n * f0 < 15000; n++) { const f = n * f0, a = amp(n, f); if (a < 1e-5) continue; const sg = Math.max(0.6, (Math.pow(2, bw / 1200) - 1) * f0 * n / hz), c = f / hz, lo = Math.max(1, Math.floor(c - 3 * sg)), hi = Math.min(N / 2 - 1, Math.ceil(c + 3 * sg)); for (let k = lo; k <= hi; k++) { const x = (k - c) / sg; mag[k] += a * (steady ? 0.33 : 1) * Math.exp(-0.5 * x * x) / Math.sqrt(sg); } if (steady) mag[Math.round(c)] += a * 1.5; }
    if (floor) for (let k = Math.floor(80 / hz); k < N / 2; k++) mag[k] += floor(k * hz);
    for (let k = 1; k < N / 2; k++) { const p = r() * 2 * Math.PI; re[k] = mag[k] * Math.cos(p); im[k] = mag[k] * Math.sin(p); }
    fftInv(re, im); const out = new Float32Array(N); let s = 0; for (let i = 0; i < N; i++) { out[i] = re[i]; s += re[i] * re[i]; } const k = 0.16 / Math.sqrt(s / N || 1); for (let i = 0; i < N; i++) out[i] *= k; return out;
  }
  // shaped noise as a loop (a burner, steam); flut makes it flutter, in whole cycles so the loop has no seam
  function noiseLoop(shape, sd, flut, N) {
    N = N || 65536; const re = new Float64Array(N), im = new Float64Array(N), hz = SR / N, r = RNG(sd);
    for (let k = 2; k < N / 2; k++) { const a = shape(k * hz), p = r() * 2 * Math.PI; if (a < 1e-6) continue; re[k] = a * Math.cos(p); im[k] = a * Math.sin(p); }
    fftInv(re, im); const out = new Float32Array(N); let s = 0;
    for (let i = 0; i < N; i++) { const u = 2 * Math.PI * i / N; out[i] = re[i] * (1 + (flut || 0) * (0.5 * Math.sin(13 * u) + 0.3 * Math.sin(29 * u + 1) + 0.2 * Math.sin(47 * u + 2))); s += out[i] * out[i]; }
    const k = 0.16 / Math.sqrt(s / N || 1); for (let i = 0; i < N; i++) out[i] *= k; return out;
  }
  // struck: parts [[frequency, strength, seconds to die away], ...] summed as ringing modes
  function modal(parts, len, att) {
    const n = Math.floor(len * SR), out = new Float32Array(n), tr = RNG(977 + TAKE * 131);
    parts.forEach(p => { if (p[0] > 18000 || p[0] < 15) return; if (TAKE) p = [p[0] * (1 + (tr() - 0.5) * 0.004), p[1] * (0.8 + 0.4 * tr()), p[2]]; const w = 2 * Math.PI * p[0] / SR, d = Math.exp(-1 / (p[2] * SR / 6.9)), c = Math.cos(w) * d, s = Math.sin(w) * d; let x = p[1], y = 0; for (let i = 0; i < n; i++) { out[i] += y; const t = x * c - y * s; y = x * s + y * c; x = t; if (i > 2000 && Math.abs(x) + Math.abs(y) < 1e-5) break; } });
    if (att) { const k = Math.floor(att * SR); for (let i = 0; i < k && i < n; i++) out[i] *= i / k; }
    return out;
  }
  // the noise of a blow: a burst through a band (lo to hi Hz), dying over tau seconds, added into out from t0
  function burst(out, t0, tau, lo, hi, g, sd) {
    const r = RNG(sd + TAKE * 7919), i0 = Math.floor(t0 * SR), n = Math.min(out.length - i0, Math.floor(tau * 7 * SR)), kl = 1 - Math.exp(-2 * Math.PI * hi / SR), kh = 1 - Math.exp(-2 * Math.PI * lo / SR); let a = 0, b = 0, c2 = 0;
    for (let i = 0; i < n; i++) { const w = r() * 2 - 1; a += kl * (w - a); b += kl * (a - b); c2 += kh * (b - c2); out[i0 + i] += (b - c2) * g * Math.exp(-i / (tau * SR)) * Math.min(1, i / 20); }
    return out;
  }
  // one small ringing thing at t0 (a splinter of glass): a dying sine
  function ping(out, t0, f, g, tau) { const i0 = Math.floor(t0 * SR), n = Math.min(out.length - i0, Math.floor(tau * 7 * SR)), w = 2 * Math.PI * f / SR; for (let i = 0; i < n; i++) out[i0 + i] += Math.sin(w * i) * g * Math.exp(-i / (tau * SR)); }
  // one bubble: a sine whose pitch rises from f0 to f1 over d seconds as the bubble shrinks
  function chirp(out, t0, f0, f1, d, g) { const i0 = Math.floor(t0 * SR), n = Math.min(out.length - i0, Math.floor(d * SR)); if (n <= 0) return; let ph = 0; const tau = d / 4.5 * SR; for (let i = 0; i < n; i++) { ph += 2 * Math.PI * f0 * Math.pow(f1 / f0, i / n) / SR; out[i0 + i] += Math.sin(ph) * g * Math.exp(-i / tau) * Math.min(1, i / 30); } }
  // a plucked string: a burst of noise going round a delay line that loses its top each trip
  function pluck(f, len, t60, bright, sd, pos) {
    const n = Math.floor(len * SR), out = new Float32Array(n), L = SR / f, Li = Math.floor(L), fr = L - Li, bf = new Float32Array(Li + 2), r = RNG(sd + TAKE * 7919), g = Math.pow(0.001, 1 / (f * t60)), s = 0.5 - 0.42 * bright;
    let lp = 0; for (let i = 0; i < Li + 2; i++) { const w = r() * 2 - 1; lp += (0.25 + 0.7 * bright) * (w - lp); bf[i] = lp; }
    const pk = Math.max(1, Math.floor(Li * (pos || 0.18))); for (let i = Li + 1; i >= pk; i--) bf[i] -= bf[i - pk] * 0.9;
    let ix = 0, prev = 0; const M = Li + 1;
    for (let i = 0; i < n; i++) { const a = bf[ix], b = bf[(ix + 1) % M], y = a + (b - a) * (1 - fr); out[i] = y; const v = g * ((1 - s) * y + s * prev); prev = y; bf[ix] = v; ix = (ix + 1) % M; }
    return fade(out, 0.004);
  }
  // a wooden body: the signal also rings a few fixed modes
  function body(x, modes, mix) { const y = new Float32Array(x.length); modes.forEach(m => { const w = 2 * Math.PI * m[0] / SR, rr = Math.exp(-Math.PI * m[0] / m[1] / SR), a1 = -2 * rr * Math.cos(w), a2 = rr * rr; let y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const v = x[i] * (1 - rr) - a1 * y1 - a2 * y2; y2 = y1; y1 = v; y[i] += v * m[2]; } }); for (let i = 0; i < x.length; i++) x[i] += y[i] * mix; return x; }
  const pianoParts = (m, prep, r) => { const f = mf(m), Bq = 0.00012 * Math.pow(f / 110, 1.1), T0 = clamp(6.5 - (m - 28) * 0.085, 0.5, 6.5), P = [];
    for (let n = 1; n < 90; n++) { let fn = n * f * Math.sqrt(1 + Bq * n * n); if (fn > 13000) break; if (prep && n > 1) fn *= 1 + (r() - 0.5) * 0.07; const a = Math.pow(n, -0.85) * (0.25 + Math.abs(Math.sin(Math.PI * n / 7.6))) * Math.exp(-n / (m < 48 ? 26 : 16)), tau = T0 / (1 + 0.02 * Math.pow(n, 1.5)) * (prep ? 0.28 : 1);
      P.push([fn, a, tau]); if (n <= 10 && !prep) { P[P.length - 1][1] = a * 0.6; P.push([fn * 1.0007, a * 0.45, tau * 3.5]); } } return P; };
  const addAt = (x, y, t0, g) => { const i0 = Math.floor(t0 * SR); for (let i = 0; i < y.length && i0 + i < x.length; i++) x[i0 + i] += y[i] * g; };
  const INST = {
    // ---- held tones (loops), the soundtrack's recipes ----
    cello:   { loop: 1, lo: 36, hi: 81, gen: m => padTone(mf(m), (n, f) => Math.pow(n, -1.05) * (0.35 + bump(f, 250, 120, 1) + bump(f, 480, 160, 0.9) + bump(f, 950, 320, 0.7) + bump(f, 2500, 900, 0.5)) / (1 + Math.pow(f / 7500, 2)), 7, 11 + m, f => 0.003 * bump(f, 5500, 4500, 1), true) },
    strings: { loop: 1, lo: 48, hi: 98, gen: m => padTone(mf(m), (n, f) => Math.pow(n, -1.25) * (0.12 + bump(f, 480, 200, 0.8) + bump(f, 1100, 420, 0.9) + bump(f, 2900, 1100, 0.75)) / (1 + Math.pow(f / 10000, 2)), 26, 23 + m, f => 0.002 * bump(f, 6500, 5000, 1)) },
    basses:  { loop: 1, lo: 24, hi: 60, gen: m => padTone(mf(m), (n, f) => Math.pow(n, -1.1) * (0.4 + bump(f, 110, 60, 1) + bump(f, 230, 110, 0.8) + bump(f, 720, 320, 0.5) + bump(f, 1900, 800, 0.25)) / (1 + Math.pow(f / 5000, 2)), 16, 37 + m, f => 0.0012 * bump(f, 3000, 2500, 1), true) },
    horn:    { loop: 1, lo: 33, hi: 77, gen: m => padTone(mf(m), (n, f) => (1 + bump(f, 360, 200, 0.9)) / (1 + Math.pow(f / 750, 2.4)), 9, 41 + m, f => 0.0016 * bump(f, 4000, 3500, 1), true) },
    bone:    { loop: 1, lo: 28, hi: 72, gen: m => padTone(mf(m), (n, f) => Math.pow(n, -0.35) * (1 + bump(f, 520, 260, 0.8) + bump(f, 1500, 600, 0.5)) / (1 + Math.pow(f / 2600, 2.6)), 12, 53 + m, f => 0.0012 * bump(f, 3500, 3000, 1)) },
    choirA:  { loop: 1, lo: 43, hi: 84, gen: m => padTone(mf(m), (n, f) => Math.pow(n, -1.2) * (0.08 + bump(f, 720, 120, 1) + bump(f, 1180, 140, 0.6) + bump(f, 2750, 260, 0.32) + bump(f, 3500, 320, 0.2)), 38, 61 + m, f => 0.0008 * (bump(f, 2800, 900, 1) + bump(f, 900, 400, 0.4))) },
    choirO:  { loop: 1, lo: 36, hi: 79, gen: m => padTone(mf(m), (n, f) => Math.pow(n, -1.3) * (0.08 + bump(f, 440, 95, 1) + bump(f, 800, 120, 0.5) + bump(f, 2650, 260, 0.2) + bump(f, 3300, 320, 0.1)), 36, 71 + m, f => 0.0008 * (bump(f, 2600, 900, 1) + bump(f, 600, 300, 0.4))) },
    choirU:  { loop: 1, lo: 36, hi: 72, gen: m => padTone(mf(m), (n, f) => Math.pow(n, -1.4) * (0.1 + bump(f, 310, 90, 1) + bump(f, 870, 110, 0.35) + bump(f, 2250, 240, 0.1)), 34, 79 + m, f => 0.0006 * (bump(f, 2300, 900, 1) + bump(f, 500, 300, 0.4))) },
    organ:   { loop: 1, lo: 24, hi: 60, gen: m => padTone(mf(m), (n, f) => ({ 1: 1, 2: 0.8, 3: 0.5, 4: 0.6, 5: 0.15, 6: 0.4, 8: 0.5, 10: 0.15, 12: 0.3, 16: 0.3 }[n] || 0.03) / (1 + Math.pow(f / 8000, 2)), 3, 83 + m, f => 0.004 * bump(f, 5500, 5000, 1)) },
    roar:    { loop: 1, fix: 60, gen: () => noiseLoop(f => bump(f, 150, 170, 1) + bump(f, 520, 480, 0.45) + bump(f, 2200, 2600, 0.12), 311, 0.5) },
    steam:   { loop: 1, fix: 60, gen: () => noiseLoop(f => bump(f, 5200, 3600, 1) + bump(f, 1900, 1300, 0.3), 313, 0.15) },
    roarL:   { loop: 1, fix: 60, gen: () => noiseLoop(f => bump(f, 150, 170, 1) + bump(f, 520, 480, 0.45) + bump(f, 2200, 2600, 0.12), 317, 0.5, 524288) },
    sizzle:  { loop: 1, fix: 60, gen: () => noiseLoop(f => bump(f, 7500, 4500, 1) + bump(f, 3200, 1500, 0.35), 319, 0.1) },
    // ---- plucked ----
    pizz:    { lo: 26, hi: 74, gen: m => norm(body(pluck(mf(m), m < 45 ? 1.6 : 1.1, m < 45 ? 1.3 : 0.8, 0.55, 5 + m), [[105, 9, 1], [198, 10, 0.8], [290, 12, 0.6], [560, 8, 0.3]], 1.4), 0.85) },
    harp:    { lo: 36, hi: 96, gen: m => norm(body(pluck(mf(m), 2.0, clamp(4.2 - (m - 36) * 0.045, 1.2, 4.2), 0.8, 9 + m, 0.3), [[180, 8, 1], [420, 9, 0.5]], 0.4), 0.85) },
    legno:   { rr: 2, lo: 43, hi: 76, gen: m => { const x = pluck(mf(m), 0.28, 0.07, 0.9, 3 + m, 0.09); burst(x, 0, 0.006, 1400, 6500, 1.6, 77 + m); burst(x, 0.0005, 0.02, 250, 900, 0.5, 78 + m); return norm(body(x, [[280, 10, 1], [520, 12, 0.7], [2300, 14, 0.6]], 0.8), 0.85); } },
    // ---- struck ----
    piano:   { lo: 24, hi: 100, gen: m => { const T0 = clamp(6.5 - (m - 28) * 0.085, 0.5, 6.5), x = modal(pianoParts(m), Math.min(2.0, T0 * 1.3 + 0.5)); burst(x, 0, 0.012, 80, 900, 0.5, 7 + m); burst(x, 0.001, 0.004, 1800, 7000, 0.12, 8 + m); return norm(fade(x, 0.05), 0.85); } },
    prep:    { lo: 24, hi: 88, gen: m => { const r = RNG(131 + m), P = pianoParts(m, true, r); for (let i = 0; i < 4; i++) P.push([1400 + r() * 4200, 0.25, 0.12 + r() * 0.2]); const x = modal(P, 1.6), bz = 62 + r() * 50; for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] *= 1 + 0.7 * Math.exp(-t / 0.22) * (Math.sin(2 * Math.PI * bz * t) > 0 ? 1 : -0.6); } burst(x, 0, 0.01, 300, 5000, 0.5, 9 + m); return norm(fade(x, 0.05), 0.85); } },
    tbell:   { lo: 48, hi: 79, gen: m => { const f = mf(m), P = []; [0.3, 0.5, 1, 0.9, 0.8, 0.5, 0.35, 0.25, 0.15].forEach((a, i) => { const k = i + 2, fk = f * 2 * (2 * k + 1) * (2 * k + 1) / 81; P.push([fk, a, 7 / (1 + 0.35 * i)], [fk * 1.003, a * 0.5, 6 / (1 + 0.35 * i)]); }); const x = modal(P, 3.2); burst(x, 0, 0.005, 1500, 9000, 0.6, 17 + m); return norm(fade(x, 0.3), 0.85); } },
    glass:   { lo: 67, hi: 96, gen: m => { const f = mf(m), x = modal([[f, 1, 1.1], [f * 2.32, 0.45, 0.6], [f * 4.25, 0.3, 0.35], [f * 6.63, 0.14, 0.2]], 1.4); burst(x, 0, 0.003, 2500, 11000, 0.5, 19 + m); return norm(x, 0.8); } },
    timp:    { rr: 2, lo: 36, hi: 60, gen: m => { const f = mf(m), x = modal([[f * 0.63, 0.35, 0.18], [f, 1, 2.2], [f * 1.5, 0.6, 1.5], [f * 1.98, 0.45, 1.1], [f * 2.44, 0.3, 0.7], [f * 2.91, 0.2, 0.5], [f * 3.4, 0.12, 0.35], [f * 3.9, 0.08, 0.25], [f * 1.68, 0.3, 0.25], [f * 2.09, 0.2, 0.2]], 1.8); burst(x, 0, 0.03, 40, 320, 1.4, 21 + m); burst(x, 0, 0.012, 900, 4500, 0.25, 22 + m); return norm(fade(x, 0.2), 0.9); } },
    bdrum:   { rr: 2, fix: 30, gen: () => { const f = 44, x = modal([[f, 1, 1.1], [f * 1.59, 0.5, 0.6], [f * 2.14, 0.35, 0.4], [f * 2.3, 0.3, 0.35], [f * 2.65, 0.2, 0.25], [f * 2.92, 0.15, 0.2]], 1.6); burst(x, 0, 0.05, 30, 220, 1.6, 25); burst(x, 0, 0.02, 700, 3500, 0.3, 26); return norm(fade(x, 0.2), 0.9); } },
    fdrum:   { rr: 3, fix: 50, gen: () => { const x = modal([[178, 1, 0.16], [326, 0.5, 0.1], [470, 0.25, 0.07]], 0.5); burst(x, 0, 0.11, 1200, 8500, 1.1, 29); burst(x, 0, 0.004, 3000, 12000, 0.5, 30); return norm(x, 0.9); } },
    anvil:   { lo: 70, hi: 82, gen: m => { const f = mf(m), r = RNG(33 + m), P = [[f, 0.6, 0.7], [f * 2.76, 1, 0.55], [f * 5.4, 0.8, 0.4], [f * 8.93, 0.5, 0.28], [f * 13.34, 0.3, 0.16]]; for (let i = 0; i < 7; i++) P.push([3000 + r() * 7000, 0.25, 0.1 + r() * 0.2]); const x = modal(P, 1.1); burst(x, 0, 0.004, 3000, 14000, 1.2, 34 + m); burst(x, 0, 0.02, 200, 900, 0.4, 35 + m); return norm(x, 0.85); } },
    tam:     { fix: 40, gen: () => { const r = RNG(41), P = []; for (let i = 0; i < 240; i++) { const f = 110 * Math.pow(90, r()); P.push([f, Math.pow(f / 110, -0.45) * (0.5 + r()), clamp(7 - 1.6 * Math.log2(f / 110), 0.8, 7)]); } const x = modal(P.filter(q => q[0] < 1500), 3.6, 0.06), hi = modal(P.filter(q => q[0] >= 1500), 3.6, 0.06); burst(hi, 0, 0.35, 2500, 12000, 2.5, 42); for (let i = 0; i < x.length; i++) x[i] += hi[i] * Math.min(1, 0.15 + i / (0.7 * SR)); return norm(fade(x, 0.5), 0.85); } },
    cym:     { rr: 2, fix: 60, gen: () => { const r = RNG(45 + TAKE * 977), P = []; for (let i = 0; i < 90; i++) { const f = 320 * Math.pow(38, r()); P.push([f, Math.pow(f / 320, 0.25) * (0.4 + r()), clamp(2.4 - 0.5 * Math.log2(f / 320), 0.35, 2.4)]); } const x = modal(P, 2.2); burst(x, 0, 0.25, 4000, 14000, 2.2, 46); burst(x, 0, 0.004, 2000, 12000, 2.0, 47); return norm(fade(x, 0.3), 0.85); } },
    bow:     { fix: 60, rr: 3, gen: () => { const x = buf(0.12); burst(x, 0, 0.02, 800, 5000, 1, 61); return norm(body(x, [[280, 8, 1], [520, 9, 0.8], [950, 8, 0.6], [2400, 6, 0.5]], 1.2), 0.8); } },
    tick:    { rr: 3, fix: 60, gen: () => { const x = buf(0.14); [0, 0.011].forEach((t0, j) => addAt(x, modal([[2150, 1, 0.022], [3480, 0.8, 0.016], [5300, 0.6, 0.012], [8100, 0.35, 0.008], [410, 0.5, 0.03]], 0.12), t0, j ? 0.55 : 1)); burst(x, 0, 0.0015, 2500, 12000, 1.5, 51); return norm(x, 0.8); } },
    // ---- the cool palette: vibraphone, marimba, electric piano, electric bass, a kit and hand drums, a warm pad, a low drone, an electric organ ----
    vibes:   { lo: 48, hi: 96, gen: m => { const f = mf(m), x = modal([[f, 1, 3.2], [f * 1.002, 0.4, 3.0], [f * 4, 0.28, 1.1], [f * 10.1, 0.08, 0.3]], 2.2); burst(x, 0, 0.004, 600, 4000, 0.25, 401 + m); return norm(fade(x, 0.2), 0.85); } },
    marimba: { rr: 2, lo: 36, hi: 96, gen: m => { const f = mf(m), d = clamp(0.9 * Math.pow(220 / f, 0.5), 0.15, 1.2), x = modal([[f, 1, d], [f * 3.93, 0.3, d * 0.25], [f * 9.2, 0.08, 0.05]], Math.min(1.2, d + 0.2)); burst(x, 0, 0.004, 500, 5000, 0.4, 403 + m); return norm(x, 0.85); } },
    ep:      { lo: 28, hi: 96, gen: m => { const f = mf(m), x = modal([[f, 1, 2.4], [f * 2, 0.4, 1.5], [f * 3, 0.16, 1.0], [f * 4, 0.08, 0.6], [f * 7.02, 0.22, 0.2], [f * 13.1, 0.08, 0.08]], 1.8); burst(x, 0, 0.003, 800, 5000, 0.15, 405 + m); for (let i = 0; i < x.length; i++) x[i] = Math.tanh(x[i] * 1.6); return norm(fade(x, 0.1), 0.85); } },
    ebass:   { lo: 24, hi: 60, gen: m => norm(pluck(mf(m), 1.2, 1.1, 0.22, 407 + m, 0.3), 0.85) },
    kick:    { fix: 30, gen: () => { const n = Math.floor(0.5 * SR), x = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR; ph += 2 * Math.PI * (48 + 80 * Math.exp(-t / 0.03)) / SR; x[i] = Math.sin(ph) * Math.exp(-t / 0.12) * Math.min(1, i / 30); } burst(x, 0, 0.01, 60, 500, 0.5, 409); burst(x, 0, 0.004, 1500, 6000, 0.2, 410); return norm(x, 0.9); } },
    hat:     { rr: 3, fix: 60, gen: () => { const x = buf(0.1); burst(x, 0, 0.014, 6000, 15000, 1, 411); return norm(x, 0.8); } },
    conga:   { rr: 2, lo: 48, hi: 72, gen: m => { const f = mf(m), x = modal([[f, 1, 0.3], [f * 1.59, 0.5, 0.18], [f * 2.3, 0.25, 0.1]], 0.4); burst(x, 0, 0.004, 800, 5000, 0.6, 413 + m); return norm(x, 0.85); } },
    tom:     { rr: 2, lo: 36, hi: 60, gen: m => { const f = mf(m), x = modal([[f, 1, 0.55], [f * 1.5, 0.4, 0.3], [f * 2.1, 0.2, 0.15]], 0.7); burst(x, 0, 0.02, 60, 400, 0.8, 415 + m); burst(x, 0, 0.005, 1000, 5000, 0.3, 416 + m); return norm(x, 0.9); } },
    pad:     { loop: 1, lo: 36, hi: 96, gen: m => padTone(mf(m), (n, f) => Math.pow(n, -1.1) / (1 + Math.pow(f / 2600, 2)), 22, 421 + m) },
    drone:   { loop: 1, lo: 24, hi: 60, gen: m => padTone(mf(m), (n, f) => Math.pow(n, -1.5) * (1 + bump(f, 220, 160, 0.8)) / (1 + Math.pow(f / 1800, 2)), 10, 423 + m, null, true) },
    eorg:    { loop: 1, lo: 24, hi: 96, gen: m => padTone(mf(m), (n, f) => ({ 1: 1, 2: 0.9, 3: 0.7, 4: 0.5, 6: 0.3, 8: 0.35, 10: 0.1, 12: 0.1, 16: 0.12 }[n] || 0.01) / (1 + Math.pow(f / 5000, 2)), 6, 425 + m, f => 0.002 * bump(f, 5000, 4000, 1)) },
    // a flask humming on the bench: a few steady partials, nearly a pure tone
    ghum:    { loop: 1, lo: 48, hi: 72, gen: m => padTone(mf(m), (n, f) => ({ 1: 1, 2: 0.22, 3: 0.45, 5: 0.2, 7: 0.08 }[n] || 0), 4, 431 + m, f => 0.0012 * bump(f, 3000, 2500, 1), true) },
    // ---- the lab ----
    // glass set down or tapped: a short ring at the mode ratios of a beaker
    clink:   { rr: 2, lo: 84, hi: 102, gen: m => { const f = mf(m), x = modal([[f, 1, 0.24], [f * 2.32, 0.6, 0.15], [f * 4.25, 0.4, 0.09], [f * 6.63, 0.2, 0.05]], 0.4); burst(x, 0, 0.002, 3000, 12000, 0.7, 201 + m); return norm(x, 0.8); } },
    // glass cracking: a handful of splinters ringing for a few milliseconds, a snap of noise, a late tick
    crack:   { rr: 3, fix: 60, gen: () => { const r = RNG(211 + TAKE * 977), x = buf(0.35); for (let i = 0; i < 9; i++) ping(x, i ? r() * 0.06 : 0, 2500 + r() * 7000, i ? 0.3 + 0.5 * r() : 1, 0.004 + 0.012 * r()); burst(x, 0, 0.003, 3000, 14000, 1.4, 212); burst(x, 0.001, 0.006, 300, 1200, 0.5, 213); burst(x, 0.05 + r() * 0.05, 0.002, 4000, 12000, 0.5, 214); return norm(x, 0.85); } },
    // glass shattering: a crash, a thud, three hundred splinters falling for two seconds
    shatter: { rr: 2, fix: 60, gen: () => { const r = RNG(221 + TAKE * 977), x = buf(2.3); for (let i = 0; i < 300; i++) { const u = r(), t0 = 1.9 * u * u * u, a = (1 - 0.8 * u) * (0.2 + 0.8 * r()); ping(x, t0, 1400 + r() * 9000, a * 0.5, 0.004 + 0.05 * r() * r()); burst(x, t0, 0.0015 + 0.003 * r(), 2500, 14000, a * 0.9, 222 + i); } burst(x, 0, 0.06, 900, 14000, 2.2, 240); burst(x, 0, 0.02, 2500, 15000, 1.6, 241); burst(x, 0.002, 0.05, 150, 400, 1.3, 242); return norm(fade(x, 0.2), 0.85); } },
    // a flask rung like a bowl: long modes in close pairs, so it beats
    bowl:    { lo: 45, hi: 84, gen: m => { const f = mf(m), x = modal([[f, 1, 2.4], [f * 1.005, 0.6, 2.2], [f * 2.71, 0.5, 1.3], [f * 2.722, 0.3, 1.2], [f * 5.12, 0.25, 0.6], [f * 8.1, 0.1, 0.3]], 2.4); burst(x, 0, 0.003, 1800, 9000, 0.35, 225 + m); return norm(fade(x, 0.3), 0.85); } },
    bubble:  { rr: 3, fix: 60, gen: () => { const r = RNG(227 + TAKE * 977), x = buf(0.6); for (let i = 0; i < 8; i++) { const f0 = 220 + r() * 480, t0 = i ? r() * 0.4 : 0, a = 0.5 + 0.5 * r(); chirp(x, t0, f0, f0 * (1.05 + 0.05 * r()), 0.03 + 0.05 * r(), a); burst(x, t0, 0.004, 1500, 6000, a * 0.12, 228 + i); } return norm(x, 0.8); } },
    blub:    { rr: 2, lo: 48, hi: 84, gen: m => { const f = mf(m) / 2, x = buf(0.2); chirp(x, 0, f, f * 1.08, 0.11, 1); chirp(x, 0.03, f * 1.5, f * 1.6, 0.06, 0.4); burst(x, 0, 0.012, 300, 2500, 0.25, 226 + m); burst(x, 0.05, 0.02, 1500, 6000, 0.08, 227 + m); return norm(x, 0.8); } },
    pour:    { rr: 2, fix: 60, gen: () => { const r = RNG(229 + TAKE * 977), x = buf(0.9); for (let i = 0; i < 70; i++) { const u = r(), f0 = (250 + 600 * u) * (0.7 + 0.6 * r()); chirp(x, 0.75 * u, f0, f0 * 1.08, 0.015 + 0.03 * r(), (0.3 + 0.7 * r()) * Math.sin(Math.PI * Math.min(1, u * 1.1))); } for (let j = 0; j < 10; j++) burst(x, j * 0.07, 0.03, 1200, 7000, 0.3 * Math.sin(Math.PI * (j + 0.5) / 10), 230 + j); return norm(fade(x, 0.05), 0.8); } },
    cork:    { rr: 2, fix: 60, gen: () => { const x = modal([[390, 1, 0.12], [780, 0.5, 0.08], [1290, 0.3, 0.05], [2350, 0.15, 0.03]], 0.3); burst(x, 0, 0.004, 400, 3500, 0.9, 231); burst(x, 0.002, 0.03, 120, 600, 0.5, 232); chirp(x, 0.004, 520, 300, 0.12, 0.35); return norm(x, 0.85); } },
    clamp:   { rr: 2, fix: 60, gen: () => { const x = buf(0.4); [0, 0.05].forEach((t0, j) => addAt(x, modal([[1150, 1, 0.25], [3170, 0.7, 0.16], [6200, 0.5, 0.1], [640, 0.5, 0.12]], 0.3), t0, j ? 1 : 0.6)); burst(x, 0, 0.0015, 2500, 10000, 1.2, 241); burst(x, 0.05, 0.0015, 2500, 10000, 1.5, 242); return norm(x, 0.85); } },
    paper:   { rr: 3, fix: 60, gen: () => { const r = RNG(251 + TAKE * 977), x = buf(0.34); for (let i = 0; i < 16; i++) burst(x, r() * 0.24, 0.004 + 0.012 * r(), 1500, 9000, 0.3 + 0.7 * r(), 252 + i); return norm(fade(x, 0.03), 0.8); } },
    page:    { fix: 60, gen: () => { const r = RNG(271), x = buf(0.6); for (let i = 0; i < 26; i++) burst(x, 0.05 + r() * 0.38, 0.004 + 0.014 * r(), 1200, 8000, 0.3 + 0.7 * r(), 272 + i); burst(x, 0.02, 0.07, 700, 4500, 0.5, 299); burst(x, 0.3, 0.05, 1500, 6000, 0.35, 298); return norm(fade(x, 0.03), 0.8); } },
    drip:    { lo: 72, hi: 96, gen: m => { const f = mf(m) / 2, x = buf(0.2); chirp(x, 0, f, f * 1.07, 0.05, 1); burst(x, 0, 0.003, 2000, 9000, 0.5, 259 + m); burst(x, 0.004, 0.02, 800, 4000, 0.15, 260 + m); return norm(x, 0.8); } },
    fizz:    { fix: 60, gen: () => { const r = RNG(261), x = buf(0.8); for (let i = 0; i < 220; i++) { const u = r(), f0 = 2500 + r() * 5000; chirp(x, 0.7 * u * u, f0, f0 * 1.05, 0.004 + 0.008 * r(), (1 - u * 0.6) * (0.3 + 0.7 * r())); } burst(x, 0, 0.1, 3000, 10000, 0.15, 262); return norm(x, 0.8); } },
    grain:   { rr: 2, fix: 60, gen: () => { const r = RNG(281 + TAKE * 977), x = buf(0.4); for (let i = 0; i < 45; i++) burst(x, r() * 0.3, 0.0008 + 0.001 * r(), 3000, 12000, 0.3 + 0.7 * r(), 282 + i); return norm(x, 0.8); } },
    puff:    { rr: 2, fix: 60, gen: () => { const x = buf(0.5); burst(x, 0, 0.06, 900, 6000, 1, 291); burst(x, 0, 0.02, 3000, 11000, 0.6, 292); for (let i = 0; i < 530; i++) x[i] *= i / 530; return norm(x, 0.8); } },
    coin:    { rr: 2, lo: 93, hi: 105, gen: m => { const f = mf(m), x = modal([[f, 1, 0.5], [f * 1.61, 0.7, 0.35], [f * 2.41, 0.5, 0.25], [f * 3.9, 0.3, 0.14]], 0.6); burst(x, 0, 0.0015, 4000, 13000, 0.6, 301 + m); return norm(x, 0.8); } }
  };
  // the made recording nearest to note m (one every three semitones), built on first use
  function rawOf(name, m, take) {
    const sp = INST[name], z = sp.fix !== undefined ? sp.fix : clamp(sp.lo + Math.round((m - sp.lo) / 3) * 3, sp.lo, sp.hi), tk = sp.rr ? (take || 0) % sp.rr : 0, key = name + z + (tk ? '_' + tk : '');
    if (!RAW[key]) { const t0 = Date.now(), keep = TAKE; TAKE = tk; const x = sp.gen(z); TAKE = keep; RAW[key] = x; GEN.ms += Date.now() - t0; GEN.bytes += x.length * 4; GEN.n++; }
    return { key, z, raw: RAW[key] };
  }
  const keyOf = (name, m, take) => { const sp = INST[name], z = sp.fix !== undefined ? sp.fix : clamp(sp.lo + Math.round((m - sp.lo) / 3) * 3, sp.lo, sp.hi), tk = sp.rr ? (take || 0) % sp.rr : 0; return { key: name + z + (tk ? '_' + tk : ''), z }; };
  return { INST, rawOf, keyOf, GEN, RAW, drop: k => { delete RAW[k]; }, H: { modal, burst, padTone, noiseLoop, norm, fade, buf, RNG, bump, ping, chirp } };
})();
const MST = { notes: 0, cents: 0, slides: 0, wrong: 0, extra: 0, late: 0 };   // what the last render did that a sane round would not (test hook _mad)
// The first build of style 4 was an orchestra; the owner found the made orchestra "a bit too toony and now it's a little dark".
// Some recipes of the kinds and the screen acts still name the role a voice had (a harp, a kettledrum, a choir); SWAP4 says what
// plays that role now, so none of the orchestra sounds. The chain, the riser, OVERREACT and the tremble name their real voices.
const SWAP4 = { harp: 'vibes', tbell: 'vibes', piano: 'ep', prep: 'ep', legno: 'conga', timp: 'tom', bdrum: 'kick', tick: 'hat', tam: 'cym',
  basses: 'drone', cello: 'pad', strings: 'pad', choirA: 'pad', choirO: 'pad', choirU: 'pad', bone: 'eorg', horn: 'eorg', organ: 'eorg' };
let INT4 = 0;                                        // intensity carried across the round, 0 to 1: the next chain starts that far up its build
let MAD = 1;                                         // the round, 1 to 9
let G4 = 1;                                          // the level of what is being written now (a chain step sits under the last hit and OVERREACT)
const LAST4 = 0.111;                                  // the last hit: under OVERREACT, so OVERREACT is the biggest
const RISE4 = 0.63;                                   // the riser before the last hit
const CHAIN4 = 0.239;                                 // a chain step and its wind-up: 7 dB under full, so the chain sits about 6 dB over the soundtrack
const ACT4 = 0.45;                                   // the acts of the other screens (the soundtrack leads there)
const madW = () => Math.pow((MAD - 1) / 8, 0.8);     // how unhinged, 0 to 1, bowed so the middle rounds are already plainly odd
// one buffer per recording, shared by every audio context (a buffer belongs to no context); the working copy is dropped once it is in one
const ABUF = {}, ABYTES = { n: 0 };
function labBuf(c, name, m, take) {
  const k = LAB.keyOf(name, m, take); let b = ABUF[k.key];
  if (!b) { const raw = LAB.rawOf(name, m, take).raw; try { b = new root.AudioBuffer({ length: raw.length, numberOfChannels: 1, sampleRate: 44100 }); } catch (e) { b = c ? c.createBuffer(1, raw.length, 44100) : null; } if (!b) return { b: null, z: k.z }; b.getChannelData(0).set(raw); ABUF[k.key] = b; ABYTES.n += raw.length * 4; LAB.drop(k.key); }
  return { b, z: k.z };
}
// the hall of the soundtrack (music.js makes the same impulse from the same seeds: a 25 ms gap, a few early walls, a tail that darkens)
function hall4() {
  if (SB.hall) return SB.hall; const c = C, len = Math.floor(c.sampleRate * 3.0), ir = c.createBuffer(2, len, c.sampleRate), pre = Math.floor(0.025 * c.sampleRate);
  for (let chn = 0; chn < 2; chn++) { const d = ir.getChannelData(chn); let s = 99 + chn * 31, lp = 0; const r = () => { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
    for (let i = 0; i < len; i++) { const x = i / len, w = r() * 2 - 1, k = 0.8 - 0.68 * x; lp += k * (w - lp); d[i] = i < pre ? 0 : lp * Math.pow(1 - x, 2.2) * Math.exp(-3.4 * x) * (i < pre + 400 ? (i - pre) / 400 : 1); }
    for (let j = 0; j < 9; j++) { const at = Math.floor((0.007 + r() * 0.07) * c.sampleRate); d[at] += (r() - 0.5) * 1.6; } }
  const inp = c.createGain(), cv = c.createConvolver(), ret = c.createGain(); cv.normalize = true; cv.buffer = ir; ret.gain.value = 0.55; inp.connect(cv); cv.connect(ret); ret.connect(SB.sum); SB.hall = inp; return inp;
}
// past the limiter and the bus, through its own soft clip with a ceiling of -1.5 dB: only the blow of OVERREACT goes this way, so it can stand far over everything before it
// two of them, the low voices and the bright ones, each with its own ceiling (-5.4 and -8.1 dB, -0.6 dB together), so the thump does not grind the glass
function dir4(lo) { const k = lo ? 'dirLo' : 'dir'; if (!SB[k]) { const w = C.createWaveShaper(), out = C.createGain(); w.curve = softCurve(); w.oversample = '2x'; out.gain.value = lo ? 0.55 : 0.40; SB[k] = C.createGain(); SB[k].connect(w); w.connect(out); out.connect(C.destination); } SB[k].gain.value = 1.3 * SLV * level(); return SB[k]; }
// play one made instrument. o: i (instrument), m (note), t, g, pan, rev (hall send), bed (the ducked bus), det (cents),
// gl [from cents, to cents, seconds, delay] (a slide), lp/lp1/lpt, hp, bp/bq, vib (cents), trem { f, d }, strict (no looseness);
// held tones: dur, a (attack), r (release), ax (swell in from nothing), g1 (level at the end, times g), cut (stop dead), wide;
// struck and plucked: dur (damped then), r
function L4(o) {
  const c = C, w = madW(), j1 = rnd(), j2 = rnd(), j3 = rnd(); let name = o.i; if (name === 'bow') return; if (name === 'pizz') name = (o.m || 60) < 50 ? 'ebass' : 'marimba'; if (!o.raw) name = SWAP4[name] || name;
  const sp = LAB.INST[name]; if (!sp || !(o.g > 0)) return;
  const m = o.m === undefined || o.m === null ? (sp.fix === undefined ? sp.lo : sp.fix) : o.m, bz = labBuf(c, name, m, o.take !== undefined ? o.take : Math.floor(j3 * 3)); if (!bz.b) return;
  const t = Math.max(0, o.t + (o.strict ? 0 : (j1 - 0.5) * 0.006)), vel = o.g * G4 * (o.strict ? 1 : 0.9 + 0.2 * j3);
  const cents = (sp.fix === undefined ? (m - bz.z) * 100 : 0) + (o.det || 0) + (o.strict ? 0 : (j1 - 0.5) * 2 * (sp.fix === undefined ? 3 + (o.bed ? 9 : 24) * w : 6 + 14 * w)), rate = Math.pow(2, cents / 1200);
  if (!o.strict && sp.fix === undefined) { MST.notes++; MST.cents += Math.abs((j1 - 0.5) * 2 * (3 + (o.bed ? 9 : 24) * w)); }
  // later rounds: some of the tuned notes sag or creep after they start
  if (!o.gl && !o.strict && sp.fix === undefined && !o.bed && w > 0.3 && j2 > 1 - 0.4 * w) { MST.slides++; o = Object.assign({}, o, { gl: [0, (j3 < 0.6 ? -1 : 1) * 60 * w, sp.loop ? 0.5 : 0.3, 0.04] }); }
  const g = c.createGain(); let head = g, tail = g, end;
  if (sp.loop) { const a = Math.max(0.004, o.a || 0.05), h = Math.max(0.01, (o.dur || 0.5) - a), r = o.r || 0.18; end = t + a + h + (o.cut ? 0.03 : r * 1.6);
    if (o.ax) { g.gain.setValueAtTime(vel * 0.004, t); g.gain.exponentialRampToValueAtTime(vel, t + a); } else { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + a); }
    if (o.g1 !== undefined) g.gain.linearRampToValueAtTime(Math.max(1e-5, vel * o.g1), t + a + h); else g.gain.setValueAtTime(vel, t + a + h);
    if (o.cut) g.gain.linearRampToValueAtTime(0, t + a + h + 0.02); else g.gain.setTargetAtTime(0, t + a + h, r / 4); }
  else { const len = (bz.b.duration - (o.off || 0)) / rate; g.gain.setValueAtTime(vel, t); if (o.fin) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + o.fin); } end = t + len; if (o.dur && o.dur < len - 0.03) { g.gain.setTargetAtTime(0, t + o.dur, (o.r || 0.1) / 3); end = t + o.dur + (o.r || 0.1) * 2; } }
  const F = (type, f0, f1, ft, q) => { const b = c.createBiquadFilter(); b.type = type; b.Q.value = q || 0.6; b.frequency.setValueAtTime(f0, t); if (f1) b.frequency.exponentialRampToValueAtTime(f1, t + (ft || 0.15)); b.connect(head); head = b; };
  if (o.lp) F('lowpass', o.lp, o.lp1, o.lpt); if (o.hp) F('highpass', o.hp, o.hp1, o.hpt); if (o.bp) F('bandpass', o.bp, o.bp1, o.bpt, o.bq || 1);
  if (o.trem) { const tg = c.createGain(), l = c.createOscillator(), lg = c.createGain(); tg.gain.value = 1 - o.trem.d / 2; l.frequency.value = o.trem.f * (0.92 + 0.16 * j2); lg.gain.value = o.trem.d / 2; l.connect(lg); lg.connect(tg.gain); tail.connect(tg); tail = tg; l.start(t); l.stop(end + 0.05); }
  let vg = null; if (o.vib) { const l = c.createOscillator(); vg = c.createGain(); l.frequency.value = 5.2 + j3 * 0.8; vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(o.vib * (1 + w), t + 0.3); l.connect(vg); l.start(t); l.stop(end + 0.05); }
  const n0 = o.wide && sp.loop && HASPAN ? 2 : 1;
  for (let k = 0; k < n0; k++) {
    const src = c.createBufferSource(); src.buffer = bz.b; const c0 = cents + (k ? 5 : 0);
    if (o.gl) { const d0 = t + (o.gl[3] || 0); src.detune.setValueAtTime(c0 + o.gl[0], t); src.detune.setValueAtTime(c0 + o.gl[0], d0); src.detune.linearRampToValueAtTime(c0 + o.gl[1], d0 + o.gl[2]); } else src.detune.value = c0;
    if (vg) vg.connect(src.detune);
    if (n0 === 2) { const p = c.createStereoPanner(); p.pan.value = clamp((o.pan || 0) + (k ? o.wide : -o.wide), -1, 1); src.connect(p); p.connect(head); } else src.connect(head);
    if (sp.loop) { src.loop = true; src.start(t, ((j1 + k * 0.41) % 1) * (bz.b.duration - 0.01)); } else src.start(t, o.off || 0);
    src.stop(end + 0.05);
  }
  if (n0 === 1 && o.pan && HASPAN) { const p = c.createStereoPanner(); p.pan.value = clamp(o.pan, -1, 1); tail.connect(p); tail = p; }
  tail.connect(o.dir ? dir4(o.dir === 'lo') : o.bed ? SB.bed : (OUT4 || SB.sum));
  if (o.rev) { const s = c.createGain(); s.gain.value = o.rev * (1 + 0.45 * w); tail.connect(s); s.connect(hall4()); }
}
const Q = (i, m, t, g, x) => L4(Object.assign({ i, m, t, g }, x));
const NO = null;
// a roll: strokes from t0 to t1, level g0 to g1, sp seconds apart (closing up a little towards the end)
function roll4(i, m, t0, t1, g0, g1, sp, x) { let t = t0; while (t < t1 - 0.01) { const u = (t - t0) / Math.max(0.01, t1 - t0); Q(i, m, t, g0 + (g1 - g0) * u * u, Object.assign({ pan: (rnd() - 0.5) * 0.3, rev: 0.2 }, x)); t += sp * (1.15 - 0.3 * u); } }
// ---------- the thirteen kinds: a different instrument or lab object each, in its own register ----------
const sn = m => { const a = safeUp(m), b = safeUp(m - 2); return a - m <= m - b ? a : b; };   // the nearest of D, E, G, A
const K4 = {
  // a ring closes on itself: a flask rung like a bowl, a tap of glass on top
  lactol: (t, m, g, p) => { Q('bowl', m, t, g * 0.95, { pan: p, rev: 0.35, dur: 1.0, r: 0.3 }); Q('clink', clamp(m + 24, 84, 100), t, g * 0.3, { pan: -p, rev: 0.2 }); },
  // water is driven off: a puff of steam and the drop that falls
  enone: (t, m, g, p) => { Q('puff', NO, t, g * 1.3, { pan: p, rev: 0.3, hp: 1200 }); Q('steam', NO, t + 0.01, g * 2.2, { dur: 0.14, a: 0.02, r: 0.25, g1: 0.4, pan: p, rev: 0.3 }); Q('roar', NO, t, g * 2.2, { dur: 0.1, a: 0.015, r: 0.18, g1: 0.3, lp: 500, pan: -p * 0.3 }); Q('drip', clamp(m + 24, 76, 94), t + 0.12, g * 0.4, { pan: -p, rev: 0.2 }); Q('tom', 43, t, g * 1.2, { lp: 500, pan: -p * 0.3 }); },
  // a hydrogen hops and the double bond flips: two plucked notes, there and back
  taut: (t, m, g, p) => { Q('pizz', sn(m - 5), t, g * 1.3, { pan: p, rev: 0.25 }); Q('pizz', m - 12, t + 0.07, g * 1.5, { pan: -p * 0.5, rev: 0.25 }); Q('pizz', sn(m - 5), t + 0.14, g * 0.7, { pan: p, rev: 0.25 }); Q('harp', m - 12, t + 0.07, g * 1.1, { pan: -p * 0.5, rev: 0.3, dur: 0.9, r: 0.4, lp: 1500 }); Q('hat', NO, t, g * 0.5, { pan: p }); Q('hat', NO, t + 0.14, g * 0.35, { pan: -p }); },
  // carbon welded to carbon: an anvil and a short blast of low brass
  weld: (t, m, g, p) => { Q('anvil', 76, t, g * 1.1, { pan: p, rev: 0.3 }); Q('bone', m - 24, t, g * 0.9, { dur: 0.26, a: 0.012, r: 0.14, lp: 1200, lp1: 5000, lpt: 0.05, pan: -p * 0.5, rev: 0.25 }); },
  // a six ring snaps shut: glass cracks
  snap6: (t, m, g, p) => { Q('crack', NO, t, g * 1.3, { pan: p, rev: 0.3 }); Q('clink', clamp(sn(m + 31), 88, 102), t + 0.012, g * 0.8, { pan: -p, rev: 0.3 }); Q('crack', NO, t + 0.1, g * 0.6, { pan: -p, rev: 0.3, det: 300 }); Q('shatter', NO, t + 0.02, g * 0.5, { dur: 0.3, r: 0.25, pan: p * 0.5, rev: 0.3, hp: 2500 }); Q('conga', clamp(m - 12, 48, 72), t, g * 1.0, { pan: p * 0.3, rev: 0.15 }); Q('marimba', clamp(m - 12, 40, 70), t, g * 0.5, { pan: -p * 0.3 }); },
  // an oxygen bridges: an organ chord opens and shuts, its speaker spinning
  ether: (t, m, g, p) => { Q('eorg', m + 12, t, g * 1.1, { dur: 0.3, a: 0.03, r: 0.25, wide: 0.4, pan: p * 0.4, rev: 0.4, trem: { f: 6.5, d: 0.6 } }); Q('glass', clamp(m + 12, 67, 93), t, g * 0.15, { pan: -p, rev: 0.3 }); },
  // a group slides along the chain: a cello slides into its note
  shift: (t, m, g, p) => { Q('bow', NO, t, g * 0.4, { pan: p }); Q('cello', m, t, g * 1.15, { dur: 0.42, a: 0.03, r: 0.2, gl: [-500, 0, 0.22], pan: p, rev: 0.25, vib: 10 }); },
  // a group tucks in: a kettledrum, and the clamp that holds it
  tuck: (t, m, g, p) => { Q('timp', clamp(sn(m - 19), 38, 57), t, g * 0.8, { pan: p * 0.5, rev: 0.3, dur: 0.5, r: 0.2 }); Q('clamp', NO, t + 0.01, g * 0.5, { pan: -p, rev: 0.2 }); Q('pizz', clamp(sn(m - 7), 45, 74), t, g * 0.6, { pan: p, rev: 0.2, dur: 0.2, r: 0.1 }); },
  // chains knit together: a harp chord, its top string plucked again and again
  knit: (t, m, g, p) => { [m + 12, sn(m + 19)].forEach((q, i) => Q('harp', q, t, g * 1.3, { pan: i ? p : -p, rev: 0.35, dur: 1.1, r: 0.4 })); [0.06, 0.12, 0.18].forEach((d, i) => Q('harp', sn(m + 19), t + d, g * (0.7 - 0.15 * i), { pan: p, rev: 0.35, dur: 0.6, r: 0.3 })); Q('harp', m, t, g * 0.6, { pan: -p, rev: 0.3, dur: 0.8, r: 0.3 }); },
  // sealed: a cork driven home and the clamp shut
  seal: (t, m, g, p) => { Q('cork', NO, t, g * 1.1, { pan: p, rev: 0.3, det: -400, lp: 1600 }); Q('cork', NO, t + 0.006, g * 0.8, { pan: -p, det: -1200, lp: 900, rev: 0.3 }); Q('puff', NO, t + 0.01, g * 0.7, { lp: 1200, pan: p, rev: 0.25, det: -700 }); Q('clamp', NO, t + 0.02, g * 0.45, { pan: -p, rev: 0.2 }); },
  // capped: a piano string with a bolt in it
  cap: (t, m, g, p) => { Q('prep', m, t, g * 1.4, { pan: p, rev: 0.3, dur: 1.0, r: 0.3, hp: 500 }); Q('prep', m + 12, t + 0.004, g * 1.0, { pan: -p, rev: 0.3, dur: 0.6, r: 0.3, hp: 700 }); Q('glass', clamp(m + 12, 67, 93), t, g * 0.9, { pan: p * 0.5, rev: 0.35 }); },
  // a ring opens and spills: a pour and a bubble
  open: (t, m, g, p) => { Q('pour', NO, t, g * 1.4, { pan: p, rev: 0.2, dur: 0.5, r: 0.2 }); Q('blub', clamp(m - 12, 48, 72), t, g * 0.9, { pan: -p, rev: 0.2 }); },
  // a rung across the fold: the page creases, two cellos bow an open fifth over a low piano string, one far bell
  fold: (t, m, g, p) => { Q('paper', NO, t, g * 0.9, { pan: -p, rev: 0.15 }); Q('paper', NO, t + 0.07, g * 0.6, { pan: p, rev: 0.15, det: -400 }); Q('piano', m - 24, t, g * 0.55, { rev: 0.25, dur: 0.7, r: 0.3 }); [m - 12, sn(m - 5)].forEach((q, i) => Q('cello', q, t, g * 0.7, { dur: 0.4, a: 0.02, r: 0.25, pan: i ? p : -p, rev: 0.3 })); Q('tbell', clamp(sn(m + 7), 50, 79), t + 0.03, g * 0.2, { pan: -p, rev: 0.35, dur: 0.9, r: 0.4 }); }
};
// each kind's level, set by measuring the first 300 ms of each alone, so a step's size comes from the step and not from the kind
const KLV4 = { lactol: 0.776, enone: 0.701, taut: 0.271, weld: 0.961, snap6: 1.094, ether: 1.438, shift: 0.954, tuck: 0.982, knit: 0.259, seal: 1.224, cap: 0.148, open: 0.928, fold: 0.508 };
// ---------- the harmony of a chain: it follows whatever soundtrack is playing ----------
// Roots: the soundtrack's four chain chords, three steps each (AA.music.chainChords()), else D, G, C, A. Pitched hits use only the
// notes that are right over every chord of every soundtrack: D, E, G, A (the root and its fifth are always among them or C).
const SAFE4 = [2, 4, 7, 9];
function roots4() { let R = [38, 31, 36, 33]; try { const cc = AA.music && AA.music.chainChords && AA.music.chainChords(); if (cc && cc.length >= 4) R = cc.slice(0, 4).map(c => 31 + (((c.root - 31) % 12) + 12) % 12); } catch (e) { /* the safe set */ } return R; }
// the third of the home chord as the soundtrack has it: 4 major, 3 minor, 0 when there is no soundtrack to ask (then no third is played)
function third4() { try { const cc = AA.music && AA.music.chainChords && AA.music.chainChords(); if (cc && cc[0]) { const pcs = cc[0].notes.map(q => (((q - cc[0].root) % 12) + 12) % 12); return pcs.indexOf(4) >= 0 ? 4 : pcs.indexOf(3) >= 0 ? 3 : 0; } } catch (e) { /* none */ } return 0; }
const safeUp = m => { m = Math.ceil(m); while (SAFE4.indexOf(((m % 12) + 12) % 12) < 0) m++; return m; };
// the line climbs the safe notes one a step from A3 (A D E G A D ...): k is the place in the build
function mel5(k) { let m = 57; for (let i = 1; i < Math.min(k, 13); i++) m = safeUp(m + 1); return m; }
const dB = x => Math.pow(10, x / 20);
// the gap to the next step, guessed from the last one: steps start about 1.5 s apart and close 9% a step to about 0.5 s
function clk5(t, n) { const k = SB.clk; let gap = t - k.last; if (n <= 1 || gap > 3 || gap <= 0.05) gap = 1.5 / 0.91; k.last = t; k.n = n; k.P = gap; return clamp(gap * 0.91, 0.2, 1.8); }
let SHK = true;                                      // test hook (_raw): _kind through the kind's own level and shelf (true) or with neither (null)
const place5 = n => { const i0 = 0.45 * INT4; return i0 + (1 - i0) * (n - 1) / 11; };   // the place in the build: 0 at step 1 of a cold round, 1 at step 12
let OUT4 = null;                                     // where the voices being written go instead of the bus (a step's tone shelf, the tremble)
function shelf5(db) { const f = C.createBiquadFilter(); f.type = 'highshelf'; f.frequency.value = 2200; f.gain.value = clamp(db, -14, 16); f.connect(SB.sum); return f; }
// each kind's tone, set by measuring each alone: decibels of high shelf that bring its share over 2 kHz to the same place, so a
// step's brightness comes from the step and not from the kind
const KSH4 = { lactol: 10.0, enone: -12.0, taut: 10.0, weld: 2.5, snap6: -9.0, ether: -11.5, shift: 9.0, tuck: 8.0, knit: -2.0, seal: 9.0, cap: 6.5, open: 10.0, fold: 0.0 };
// ---------- the deep layer (ruling AK): an electric bass and a low warm drone that come in at step 2 and grow every step ----------
// deep 1 the drone alone; 2 with a warm pad on the fifth and the bass pulsing; 3 adds a heartbeat on the kick
function deep5(t, n, P, r, u) {
  if (!DEEP || n < 2) return; const L = dB(-9 * (1 - Math.min(u, 1.2))), d = P * 1.02;
  Q('drone', r, t, 0.55 * L, { dur: d, a: 0.05, r: 0.22, bed: true, wide: 0.25, rev: 0.15, strict: true });
  Q('drone', r + 12, t, 0.5 * L, { dur: d, a: 0.05, r: 0.22, bed: true, pan: 0.2, rev: 0.15, strict: true });
  if (u >= 0.5) Q('drone', Math.max(26, r - 12), t, 0.45 * L, { dur: d, a: 0.05, r: 0.22, bed: true, strict: true });
  if (DEEP >= 2) { [r + 19, r + 24].forEach((q, i) => Q('pad', q, t, 0.3 * L, { dur: d, a: 0.07, r: 0.25, bed: true, pan: i ? 0.35 : -0.35, wide: 0.25, rev: 0.3, lp: 500 + 2500 * Math.min(1, u), vib: 5 }));
    if (u >= 0.3) { const div = u >= 0.7 ? 4 : 2; for (let j = 1; j < div; j++) Q('ebass', r + 12, t + P * j / div, 0.3 * L, { dur: P / div * 0.8, r: 0.08, strict: true }); } }
  if (DEEP === 3 && u >= 0.25) { Q('kick', NO, t + P / 2 - 0.13, 0.25 * L, { lp: 500, bed: true, strict: true }); Q('kick', NO, t + P / 2, 0.4 * L, { lp: 600, bed: true, strict: true }); }
}
// the warm tail: under the last hit (1.4 s) and under OVERREACT's close (long); calm: a run won
function deepLand4(t, peak, calm) {
  if (!DEEP || (peak && !calm)) return; const P = calm ? 2.6 : 1.3, g = calm ? 0.3 : 0.2;
  [26, 38].forEach(q => Q('drone', q, t, g, { dur: P, a: 0.03, r: calm ? 2.0 : 0.7, bed: true, wide: 0.3, rev: 0.3, strict: true }));
  if (DEEP >= 2) [45, 50, 57, 62].forEach((q, i) => Q('pad', q, t, g * 0.7, { dur: P, a: 0.04, r: calm ? 2.0 : 0.8, bed: true, pan: (i - 1.5) * 0.3, wide: 0.25, rev: 0.4, vib: 5 }));
}
// ---------- a step of the chain ----------
// u is the place in the build: 0 at step 1 of a cold round, 1 at step 12; intensity(v) moves the start up, so the next chain
// begins where the round has got to. Every step is the same recipe turned further: louder (10 dB over the twelve), brighter (the
// kind's own voice through a shelf that opens, hats, snare, cymbal, glass) and wider (voices placed further out, held chords spread).
// Between the hits: hand drums that bounce closer and closer into the next hit, the kit dividing the gap in 4, 8, 16, bubbles and
// glass, a tom roll and steam rising into the next step.
function step4(kind, n, o) {
  const t = begin(); if (t == null) return; o = o || {}; const kd = kindOf(kind), w = madW(), bl = Math.sqrt(clamp(o.bell || 1, 0.6, 1.6)), P = clk5(t, n), u = place5(n);
  // the last hit of a short chain is smaller than the last hit of a long one; a deeper round is wilder, not louder
  if (o.last) { G4 = LAST4 * bl * dB(-8 * (1 - Math.min(u, 1))); try { fin5(t, kd, w); deepLand4(t, false); } finally { G4 = 1; OUT4 = null; } return; }
  G4 = CHAIN4 * dB(-6 * (1 - Math.min(u, 1.3))) * bl; try { steps5(t, kd, n, o, P, u, w); } finally { G4 = 1; OUT4 = null; }
}
function steps5(t, kd, n, o, P, u, w) {
  const U = Math.min(u, 1.25), u1 = Math.min(u, 1), r = roots4()[chordIx(n)], m = mel5(1 + Math.round(u * 11)), kv = K4[kd] || K4.lactol, kg = 1.7 * (KLV4[kd] || 1) * (o.fast ? 0.85 : 1), ksh = 0.6 * (KSH4[kd] || 0), wd = 0.2 + 0.75 * u1, pan = (n % 2 ? -1 : 1) * (0.12 + 0.5 * u1);
  const slip = () => { const d = (rnd() - 0.3) * 0.06 * w; if (Math.abs(d) > 0.012) MST.late++; return d; };
  // the hit: kick, electric bass, a hand drum, the kind's own voice, a vibraphone on the line. Never late, never out of tune
  Q('kick', NO, t, 0.5 + 0.5 * U, { strict: true, rev: 0.06 }); if (u >= 0.5) Q('drone', r, t, 0.5, { strict: true, dur: 0.12, a: 0.004, r: 0.12 }); Q('ebass', r + 12, t, 0.5, { strict: true, dur: Math.min(0.45, P * 0.5), r: 0.12 }); Q('conga', 60, t, 0.32, { strict: true, pan: 0.1, rev: 0.1 });
  OUT4 = shelf5(ksh - 3 + 10 * U); try { kv(t, m, kg, pan, n); if (o.echo) kv(t + 0.12, m, kg * 0.07, -pan, n); } finally { OUT4 = null; }
  Q('marimba', m + 12, t, 0.22, { pan: -pan, rev: 0.25, strict: true });
  duck(t, 0.09 + 0.13 * u1, 0.6 - 0.25 * u1, 0.17 - 0.1 * u1);   // the soundtrack is pushed further down, for longer, and held there 70 to 170 ms, under the early (quieter) steps
  // bigger: an electric piano under the line, a low tom, the bass an octave down
  if (u >= 0.5) { Q('tom', 38, t, 0.35 + 0.3 * (U - 0.5), { strict: true, rev: 0.15 }); Q('ebass', r, t, 0.35, { strict: true, dur: 0.4, r: 0.12 }); }
  // brighter: a hat on the hit, then a snare, a cymbal that rings longer each step, tuned glass, cracking glass
  Q('hat', NO, t, 0.08 + 0.4 * U, { strict: true, pan: 0.2 });
  if (u >= 0.27) Q('fdrum', NO, t, 0.12 + 0.5 * (U - 0.27), { strict: true, pan: -0.1, rev: 0.15 });
  if (u >= 0.36) Q('cym', NO, t, 0.14 + 0.75 * (U - 0.36), { pan: 0.5, rev: 0.3, dur: 0.3 + 0.8 * u1, r: 0.4, hp: 2500 });
  if (u >= 0.72) Q('hat', NO, t + 0.004, 0.3 + 0.5 * (U - 0.72), { strict: true, pan: -0.5, hp: 7000 });
  // wider: an electric organ on the open fifth, its speaker turning, spread further each step; steam shaken in sixteenths
  if (u >= 0.3) [r + 24, r + 31, r + 36].forEach((q, i) => Q('eorg', q, t, 0.05 + 0.3 * (U - 0.3), { dur: P * 0.92, a: 0.03, r: 0.2, pan: (i - 1) * wd, wide: 0.2 + 0.7 * u1, rev: 0.4, trem: { f: 5.5 + 5 * u1 + 4 * w, d: 0.5 + 0.3 * w } }));
  if (u >= 0.4) Q('sizzle', NO, t, 0.05 + 0.55 * (U - 0.4), { dur: P * 0.95, a: 0.02, r: 0.1, wide: 0.4 + 0.6 * u1, trem: { f: 4 / P, d: 0.95 }, hp: 3000 });
  // between the hits. The hand drums bounce into the next hit, closing up
  if (n >= 2) { const K = Math.round((2 + 7 * U) * (1 + 0.6 * w)); for (let j = 1; j <= K; j++) { const x = j / (K + 1); Q('conga', 55 + Math.round(12 * x), Math.min(t + P - 0.07, t + P * (0.13 + 0.8 * (1 - Math.pow(1 - x, 1.7))) + slip()), 0.1 + 0.22 * x, { pan: (j % 2 ? 1 : -1) * wd * 0.7, rev: 0.12 }); } }
  // no kit between the hits: the soundtrack keeps the beat, and a second kit in another tempo would fight it
  // the kind answers itself on the half, a safe note up
  if (n >= 2) { OUT4 = shelf5(ksh - 3 + 10 * U); try { kv(t + P / 2 + slip(), u >= 0.4 ? safeUp(m + 1) : m, 0.4 * kg, -pan, n); } finally { OUT4 = null; } }
  // the lab: bubbles and glass set ringing, more of them each step
  if (u >= 0.27) { const K = Math.round(1 + 4 * U + 4 * w); for (let j = 0; j < K; j++) { const g = rnd() < 0.7; Q(g ? 'clink' : 'blub', g ? 84 + Math.floor(rnd() * 16) : 48 + Math.floor(rnd() * 12), t + P * (0.12 + 0.7 * rnd()), 0.07 + 0.12 * U, g ? { pan: (rnd() * 2 - 1) * wd, rev: 0.2 } : { pan: (rnd() * 2 - 1) * wd, rev: 0.2, det: -700, lp: 1500 }); } }
  // into the next step: a tom roll that climbs, a snare roll, steam rising
  if (u >= 0.62) { const K = Math.max(3, Math.round(P * 0.42 / 0.055)); for (let j = 0; j < K; j++) { const x = j / K; Q('tom', 43 + Math.round(12 * x), Math.min(t + P - 0.07, t + P * (0.55 + 0.4 * x)), (0.05 + 0.3 * x * x) * (0.5 + U - 0.62), { pan: (x - 0.5) * wd, rev: 0.15 }); } }
  if (u >= 0.85) roll4('fdrum', NO, t + P * 0.7, t + P - 0.07, 0.04, 0.25, 0.04, { rev: 0.1 });
  if (u >= 0.45) Q('steam', NO, t + P * 0.3, 0.1 + 0.6 * (U - 0.45), { dur: P * 0.7 - 0.08, a: P * 0.7 - 0.1, ax: true, cut: true, wide: wd, bp: 1200, bp1: 7000, bpt: P * 0.62, bq: 0.8 });
  deep5(t, n, P, r, u);
  // deeper in the run (ruling AM): the kind echoes on and on across the room, things boil over and break between the hits, the organ lurches
  if (w > 0.2) { const E = 1 + Math.round(5 * w); OUT4 = shelf5(ksh + 4); try { for (let j = 1; j <= E; j++) { MST.extra++; kv(t + P * j / (E + 1.5) + slip(), safeUp(m + 2 * j), 0.28 * kg * Math.pow(0.75, j), (j % 2 ? 1 : -1) * 0.8, n); } } finally { OUT4 = null; } }
  if (w > 0.25 && rnd() < 0.3 + 0.6 * w) { MST.extra++; const tt = t + P * (0.25 + 0.5 * rnd()), k = rnd(); if (k < 0.4) { Q('crack', NO, tt, 0.4, { pan: rnd() * 1.6 - 0.8, rev: 0.3 }); Q('shatter', NO, tt, 0.25 * w, { dur: 0.3, r: 0.25, hp: 2000, pan: rnd() * 1.6 - 0.8, rev: 0.3 }); } else if (k < 0.75) { Q('bubble', NO, tt, 0.4, { det: -700, lp: 1500, pan: rnd() * 1.6 - 0.8, rev: 0.2 }); } else { Q('clamp', NO, tt, 0.35, { pan: rnd() * 1.6 - 0.8, rev: 0.25 }); Q('cork', NO, tt + 0.05, 0.3, { pan: rnd() * 1.6 - 0.8, rev: 0.25 }); } }
  if (w > 0.45 && rnd() < 0.7 * w) { MST.slides++; Q('eorg', r + 36, t + P * 0.3, 0.2, { dur: P * 0.5, a: 0.05, r: 0.15, wide: 0.8, rev: 0.4, gl: [0, (rnd() < 0.5 ? -1 : 1) * (100 + 300 * w), P * 0.5, 0], trem: { f: 13, d: 0.8 } }); }
}
// the last hit: everything lands at once on D and A (right over any soundtrack), with glass breaking on top
function fin5(t, kd, w) {
  const th = third4();
  Q('kick', NO, t, 1.0, { strict: true, rev: 0.1 }); Q('kick', NO, t, 0.6, { strict: true, det: -500 }); Q('tom', 38, t, 0.7, { strict: true, rev: 0.2 }); Q('ebass', 38, t, 0.8, { strict: true, dur: 0.9, r: 0.3 }); Q('ebass', 26, t, 0.6, { strict: true, dur: 0.7, r: 0.3 });
  Q('fdrum', NO, t, 1.0, { strict: true, rev: 0.25 }); Q('cym', NO, t, 2.0, { pan: 0.6, rev: 0.4 }); Q('cym', NO, t + 0.008, 1.6, { pan: -0.7, det: 300, rev: 0.4 }); Q('hat', NO, t, 1.0, { strict: true, pan: 0.3 }); Q('hat', NO, t + 0.004, 0.8, { strict: true, pan: -0.5 });
  Q('crack', NO, t + 0.01, 1.3, { pan: 0.7, rev: 0.3 }); Q('crack', NO, t + 0.02, 1.0, { pan: -0.7, rev: 0.3, det: 200 }); Q('shatter', NO, t, 1.6, { pan: -0.5, rev: 0.35, dur: 0.7, r: 0.5, hp: 1500 }); Q('shatter', NO, t + 0.01, 1.1, { pan: 0.6, det: 300, rev: 0.35, dur: 0.6, r: 0.5, hp: 2500 }); Q('anvil', 74, t, 0.35, { pan: 0.2, rev: 0.4, dur: 0.5, r: 0.3 });
  [62, 69, 74, 76, 81].forEach((q, i) => Q('vibes', q, t, 0.5, { pan: (i - 2) * 0.35, rev: 0.4 })); [38, 50, 57, 62].concat(th ? [62 + th] : []).forEach((q, i) => Q('ep', q, t, 0.45, { pan: (i - 1.5) * 0.25, rev: 0.3 }));
  [74, 81, 86, 93].forEach((q, i) => Q('glass', q, t, 1.0, { pan: (1.5 - i) * 0.6, rev: 0.4 })); Q('bowl', 62, t, 0.4, { pan: -0.3, rev: 0.45 }); Q('marimba', 50, t, 0.5, { rev: 0.25 });
  [50, 57, 62, 69].forEach((q, i) => Q('eorg', q, t, 0.3, { dur: 0.9, a: 0.012, r: 0.5, g1: 0.5, pan: (i - 1.5) * 0.5, wide: 0.8, rev: 0.4, trem: { f: 7, d: 0.5 } }));
  OUT4 = shelf5((KSH4[kd] || 0) + 6); try { (K4[kd] || K4.lactol)(t, 74, 0.7 * (KLV4[kd] || 1), 0); } finally { OUT4 = null; }
  Q('steam', NO, t, 1.0, { dur: 0.6, a: 0.01, r: 0.7, g1: 0.2, wide: 0.9, rev: 0.3 }); Q('sizzle', NO, t, 1.4, { dur: 0.5, a: 0.01, r: 0.8, g1: 0.3, wide: 0.9, rev: 0.3 });
  if (w > 0.3) { MST.extra++; Q('shatter', NO, t + 0.21, 0.6 * w, { pan: 0.5, det: 300, hp: 1800, dur: 0.5, r: 0.4, rev: 0.35 }); Q('bubble', NO, t + 0.25, 0.4 * w, { det: -700, lp: 1500, pan: rnd() * 1.6 - 0.8, rev: 0.2 }); }
  duck(t, 0.15, 0.6);
}
// ---------- the riser before the last hit, and the held breath ----------
// Everything climbs for as long as the page gives it (ms, to the hit): steam swept from a growl to a hiss, a warm chord sliding up
// an octave, toms climbing, a snare roll, glass rattling faster and higher, the burner. It stops dead 170 ms before the hit.
function rise5(t, d, w) {
  const end = Math.max(0.12, d - 0.17), X = { dur: end, a: end * 0.97, ax: true, cut: true, rev: 0.03 };
  Q('steam', NO, t, 0.9, Object.assign({}, X, { wide: 0.6, bp: 500, bp1: 9000, bpt: end, bq: 0.9 })); Q('sizzle', NO, t, 0.8, Object.assign({}, X, { wide: 0.7 })); Q('roar', NO, t, 0.5, Object.assign({}, X, { lp: 250, lp1: 4000, lpt: end }));
  [45, 52, 57, 64, 69, 76].forEach((q, i) => Q('pad', q, t, 0.2, { ax: true, dur: end, a: end * 0.97, cut: true, pan: (i - 2.5) * 0.3, wide: 0.3, rev: 0.03, gl: [-1200, 0, end, 0], lp: 600, lp1: 7000, lpt: end, vib: 8 }));
  [57, 69].forEach((q, i) => Q('eorg', q, t, 0.3, Object.assign({}, X, { pan: i ? 0.4 : -0.4, wide: 0.5, gl: [-1200, 0, end, 0], trem: { f: 9 + 5 * i, d: 0.7 } })));
  { const K = Math.max(4, Math.round(end / 0.06)); for (let j = 0; j < K; j++) { const x = j / K, tt = t + end * (1 - Math.pow(1 - x, 1.35)); Q('tom', 40 + Math.round(17 * x), tt, 0.03 + 0.4 * x * x * x, { pan: (x - 0.5) * 0.8, rev: 0.03, dur: 0.12, r: 0.08 }); if (j % 2) Q('clink', 84 + Math.round(16 * x), tt, 0.03 + 0.5 * x * x, { pan: (j % 4 === 1 ? 1 : -1) * 0.7, rev: 0.03 }); } }
  roll4('fdrum', NO, t + end * 0.35, t + end, 0.02, 0.55, 0.045, { rev: 0.03, dur: 0.1, r: 0.08 }); roll4('hat', NO, t + end * 0.2, t + end, 0.02, 0.6, 0.05, { rev: 0 });
  for (let j = 0; j < 2 + Math.round(4 * w); j++) Q('bubble', NO, t + end * (0.3 + 0.6 * rnd()), 0.3, { det: -700, lp: 1500, pan: rnd() * 1.6 - 0.8, rev: 0.03 });
  trembleCut(t + end); breathe(t + end, t + d);
}
// ---------- OVERREACT: the reward ----------
// A held breath of 90 ms. The strike: a sub thump with breaking glass, tuned glass, coins and a cymbal on top of it, sent past the
// limiter so it stands far over everything before it. The fall: almost nothing for half a second, the soundtrack held under. The
// swell: a warm chord and an organ sliding up into D, steam, toms and rattling glass climbing with it, the soundtrack rising with
// them. The resolve: a bright hit on D and the soundtrack let go. Then the pay-out as the yield counts up: glass ticks that climb,
// a coin on every fourth, closing up, a last ring. A long warm tail. o: { count: ms the pay-out lasts (2400) }
let RSV5 = 1;                                        // the level of OVERREACT's resolve (build c lowers it so the lift after it is the top)
function over5(t0, o) {
  const w = madW(), t = t0 + 0.09, th = third4(), bp = SB.breath.gain, dk = SB.duck.gain, sw = t + 0.55, L = 1.35, rs = sw + L + 0.04, cn = clamp(o && o.count ? o.count / 1000 : 2.4, 0.8, 8), D = x => Object.assign({ dir: true }, x), DL = x => Object.assign({ dir: 'lo' }, x);
  trembleCut(t0);
  bp.cancelScheduledValues(t0); bp.setTargetAtTime(0.012, t0, 0.018); bp.setValueAtTime(0.1, t); bp.setValueAtTime(0.1, t + 0.24); bp.linearRampToValueAtTime(1, t + 0.5);
  dk.cancelScheduledValues(t0); dk.setTargetAtTime(0.16, t0, 0.004); dk.setValueAtTime(0.16, sw); dk.exponentialRampToValueAtTime(0.5, rs - 0.03); dk.linearRampToValueAtTime(1, rs + 0.01);
  // the strike
  Q('kick', NO, t, 2.0, DL({ strict: true, det: -500 })); Q('kick', NO, t, 1.4, DL({ strict: true })); Q('tom', 38, t, 1.0, DL({ strict: true, rev: 0.2 })); Q('drone', 26, t, 2.0, DL({ strict: true, dur: 0.5, a: 0.003, r: 0.5, g1: 0.25 })); Q('drone', 38, t, 2.0, DL({ strict: true, dur: 0.45, a: 0.003, r: 0.5, g1: 0.2 })); Q('sizzle', NO, t, 3.0, D({ dur: 0.13, a: 0.002, r: 0.25, wide: 0.5 })); Q('steam', NO, t, 2.2, D({ dur: 0.13, a: 0.002, r: 0.3, wide: 0.4 }));
  Q('shatter', NO, t, 2.0, D({ pan: -0.2, rev: 0.4, dur: 0.45, r: 0.5 })); Q('shatter', NO, t + 0.012, 1.2, D({ pan: 0.4, det: 400, rev: 0.4, hp: 2000, dur: 0.4, r: 0.5 })); Q('crack', NO, t, 1.4, D({ pan: 0.5 })); Q('crack', NO, t + 0.03, 1.0, D({ pan: -0.5 }));
  Q('cym', NO, t, 1.1, D({ pan: 0.3, rev: 0.4, dur: 0.5, r: 0.5 })); Q('fdrum', NO, t, 1.0, D({ strict: true, rev: 0.3 })); Q('anvil', 74, t, 0.8, D({ pan: -0.3, rev: 0.4, dur: 0.4, r: 0.3 }));
  [86, 93, 88, 96].forEach((q, i) => Q('glass', q, t, 0.9, D({ pan: (i - 1.5) * 0.5, rev: 0.5 }))); [74, 81, 86].forEach((q, i) => Q('vibes', q, t, 0.8, D({ pan: (1 - i) * 0.5, rev: 0.45, dur: 0.5, r: 0.4 })));
  for (let i = 0; i < 8; i++) Q('coin', 93 + Math.floor(rnd() * 12), t + 0.01 + rnd() * 0.14, 0.5, D({ pan: rnd() * 1.8 - 0.9, rev: 0.3 }));
  [38, 50, 57, 62].forEach((q, i) => Q('ep', q, t, 0.6, DL({ strict: true, hp: 70, rev: 0.3, pan: (i - 1.5) * 0.3, dur: 0.3, r: 0.25 }))); [50, 57, 62, 69].forEach((q, i) => Q('eorg', q, t, 0.5, D({ dur: 0.16, a: 0.006, r: 0.14, pan: (i - 1.5) * 0.4, wide: 0.4, rev: 0.4 })));
  // the fall: a few splinters still landing
  for (let i = 0; i < 5; i++) Q('clink', 88 + Math.floor(rnd() * 12), t + 0.3 + rnd() * 0.3, 0.07, { pan: rnd() * 1.6 - 0.8, rev: 0.4 });
  // the swell
  const X = { dur: L, a: L * 0.97, cut: true }, up = (i, m, g, x) => Q(i, m, sw, g, Object.assign({}, X, x));
  [38, 45, 50, 57, 62, 64, 69].concat(th ? [62 + th] : []).forEach((q, i) => up('pad', q, 0.34, { pan: (i - 3) * 0.25, wide: 0.3, rev: 0.4, gl: [-200 - 100 * (i % 3) - 300 * w, 0, L * 0.95, 0], lp: 500, lp1: 7000, lpt: L, vib: 6 }));
  [50, 62, 69].forEach((q, i) => up('eorg', q, 0.3, { ax: true, pan: (i - 1) * 0.4, wide: 0.5, rev: 0.3, gl: [-1200, 0, L, 0], trem: { f: 7 + 3 * i + 5 * w, d: 0.6 } }));
  up('steam', NO, 0.6, { ax: true, wide: 0.6, rev: 0.2, bp: 600, bp1: 9000, bpt: L, bq: 0.9 }); up('sizzle', NO, 0.45, { ax: true, wide: 0.7 }); up('roar', NO, 0.3, { ax: true, lp: 300, lp1: 3000, lpt: L });
  { const K = Math.round(L / 0.062); for (let j = 0; j < K; j++) { const x = j / K, tt = sw + L * (1 - Math.pow(1 - x, 1.3)); Q('tom', 40 + Math.round(17 * x), tt, 0.04 + 0.55 * x * x, { pan: (x - 0.5) * 0.8, rev: 0.15, dur: 0.12, r: 0.08 }); if (j % 2) Q('clink', safeUp(84 + Math.round(14 * x)), tt, 0.04 + 0.3 * x, { pan: (j % 4 === 1 ? 1 : -1) * 0.7, rev: 0.2 }); } }
  roll4('fdrum', NO, sw + L * 0.5, sw + L, 0.03, 0.4, 0.045, { rev: 0.1, dur: 0.1, r: 0.08 });
  if (w > 0.3) for (let j = 0; j < Math.round(5 * w); j++) Q('bubble', NO, sw + L * (0.2 + 0.7 * rnd()), 0.35, { det: -700, lp: 1500, pan: rnd() * 1.6 - 0.8, rev: 0.2 });
  // the resolve
  G4 = RSV5; Q('kick', NO, rs, 1.0, { strict: true, rev: 0.1 }); Q('tom', 38, rs, 0.5, { strict: true }); Q('ebass', 38, rs, 0.9, { strict: true, dur: 1.2, r: 0.4 }); Q('ebass', 26, rs, 0.6, { strict: true, dur: 1.0, r: 0.4 }); Q('fdrum', NO, rs, 0.5, { strict: true, rev: 0.25 }); Q('cym', NO, rs, 1.0, { pan: -0.3, rev: 0.4 });
  [50, 57, 62].concat(th ? [62 + th] : [64]).forEach((q, i) => Q('ep', q, rs, 0.5, { strict: true, pan: (i - 1.5) * 0.3, rev: 0.3 })); [62, 69, 74, 76, 81].concat(th ? [74 + th] : []).forEach((q, i) => Q('vibes', q, rs, 0.55, { strict: true, pan: (i - 2) * 0.35, rev: 0.45 }));
  [86, 93].forEach((q, i) => Q('glass', q, rs, 0.6, { strict: true, pan: i ? 0.5 : -0.5, rev: 0.45 })); [62, 69].forEach((q, i) => Q('bowl', q, rs, 0.4, { strict: true, pan: i ? -0.5 : 0.5, rev: 0.5 }));
  G4 = 1;
  // the pay-out: ticks of glass climbing the safe notes and closing up, a coin on every eighth, a hand drum pushing 3 + 3 + 2, a last ring
  { const NT = Math.round(cn * 10 * (1 + 0.4 * w)); let te = rs;
    for (let i = 0; i < NT; i++) { const x = i / Math.max(1, NT - 1), tt = rs + 0.16 + cn * (0.45 * x + 0.55 * (1 - Math.pow(1 - x, 1.6))), g = 0.2 + 0.14 * x; te = tt;
      Q('clink', safeUp(84 + Math.round(15 * x)), tt, g, { strict: true, pan: (i % 2 ? 1 : -1) * (0.3 + 0.5 * x), rev: 0.2 });
      if (i % 8 === 7) Q('coin', safeUp(93 + Math.round(9 * x)), tt, g * 1.1, { strict: true, pan: (i % 16 === 7 ? -0.5 : 0.5), rev: 0.25 });
      if (i % 8 === 0 || i % 8 === 3 || i % 8 === 6) Q('conga', 57 + Math.round(10 * x), tt, g * 0.9, { strict: true, pan: -0.2, rev: 0.12 });
      if (i % 8 === 4) Q('glass', safeUp(72 + Math.round(12 * x)), tt, g * 0.8, { strict: true, pan: 0.4, rev: 0.35 });
      if (w > 0.4 && rnd() < 0.5 * w) { MST.extra++; Q('clink', safeUp(91 + Math.round(9 * rnd())), tt + 0.03, g * 0.7, { pan: rnd() * 1.8 - 0.9, rev: 0.3 }); } }
    te += 0.14; [93, 98, 100].forEach((q, i) => Q('coin', q, te + i * 0.012, 0.3, { strict: true, pan: (i - 1) * 0.5, rev: 0.35 })); [86, 93].forEach((q, i) => Q('glass', q, te, 0.4, { strict: true, pan: i ? 0.5 : -0.5, rev: 0.45 })); Q('vibes', 74, te, 0.4, { strict: true, rev: 0.45 }); Q('bowl', 74, te, 0.3, { strict: true, rev: 0.5 }); Q('kick', NO, te, 0.5, { strict: true }); Q('cym', NO, te, 0.3, { pan: 0.3, rev: 0.4, hp: 3000 });
    // the tail: a warm chord and the drone under it, let go slowly; flasks still ringing
    [26, 38].forEach(q => Q('drone', q, rs, 0.3, { dur: te - rs + 0.6, a: 0.03, r: 3.2, wide: 0.3, rev: 0.3, strict: true }));
    [45, 50, 57, 62, 69].concat(th ? [62 + th] : [64]).forEach((q, i) => Q('pad', q, rs, 0.22, { dur: te - rs + 0.6, a: 0.05, r: 3.2, pan: (i - 2) * 0.3, wide: 0.3, rev: 0.45, vib: 5, lp: 5000, lp1: 1500, lpt: te - rs + 3 }));
    [57, 62].forEach((q, i) => Q('bowl', q, te + 0.5 + i * 0.4, 0.2, { pan: i ? 0.5 : -0.5, rev: 0.5 })); }
  // deeper in the run: aftershocks off the beat after the resolve, and more glass
  if (w > 0.3) { MST.extra++; Q('kick', NO, rs + 0.37, 0.8 * w, { strict: true }); Q('crack', NO, rs + 0.37, 0.7 * w, { pan: -0.5, rev: 0.3 }); Q('anvil', 76, rs + 0.37, 0.4 * w, { pan: 0.4, rev: 0.4, dur: 0.3, r: 0.2 }); }
  if (w > 0.6) { MST.extra++; Q('kick', NO, rs + 0.83, 0.8 * w, { strict: true }); Q('tom', 43, rs + 0.83, 0.5 * w, {}); Q('shatter', NO, rs + 0.85, 0.6 * w, { pan: 0.3, rev: 0.35, det: 200, hp: 1500, dur: 0.5, r: 0.4 }); }
}
// ---------- the tremble: once the round's target is passed, glass on the bench starts to hum and rattle (ruling AO) ----------
// tremble(level 0..1): a flask humming with a shake in it, and small glass buzzing against the bench in short runs; more objects,
// faster and louder as level rises. tremble(0) lets it die away. The held breath before the last hit and before OVERREACT cuts it
// dead, and it stays off until tremble is called again. dur (seconds, optional): how far ahead to write when nothing will call again.
function trm5() {
  if (SB.trm) return SB.trm; const c = C, T = { lv: 0, upTo: 0, timer: null, live: typeof c.startRendering !== 'function' };
  T.g = c.createGain(); T.g.gain.value = 0; T.g.connect(SB.sum); T.inp = c.createGain(); T.inp.connect(T.g);
  // the hum: two flasks a fifth apart, shaken by a slow tremolo that speeds up with level
  T.hum = c.createGain(); T.hum.gain.value = 0; T.lfo = c.createOscillator(); T.lfo.frequency.value = 9; T.lg = c.createGain(); T.lg.gain.value = 0; T.lfo.connect(T.lg); T.lg.connect(T.hum.gain); T.hum.connect(T.g); T.lfo.start();
  [[50, 1], [57, 0.7], [62, 0.5]].forEach((q, i) => { const bz = labBuf(c, 'ghum', q[0], 0); if (!bz.b) return; const s = c.createBufferSource(), g = c.createGain(); s.buffer = bz.b; s.loop = true; s.detune.value = (q[0] - bz.z) * 100; g.gain.value = q[1];
    if (HASPAN) { const p = c.createStereoPanner(); p.pan.value = (i - 1) * 0.5; s.connect(g); g.connect(p); p.connect(T.hum); } else { s.connect(g); g.connect(T.hum); } s.start(0, i * 0.37); });
  SB.trm = T; return T;
}
function trmFill(T, t, until) {
  const lv = T.lv; if (!(lv > 0)) return; let a = Math.max(T.upTo, t); if (until - a < 0.05) return;
  const keepG = G4, keepO = OUT4; G4 = 1; OUT4 = T.inp;
  try { // each run is one object buzzing against the bench: ticks 40 to 80 ms apart that die away
    const runs = (2 + 9 * lv) * (until - a); let k = Math.floor(runs) + (rnd() < runs % 1 ? 1 : 0);
    while (k-- > 0) { const tt = a + rnd() * (until - a), m = 84 + Math.floor(rnd() * 17), K = 3 + Math.floor(rnd() * (4 + 8 * lv)), gap = 0.085 - 0.045 * lv * rnd(), pan = rnd() * 1.7 - 0.85, g0 = (0.05 + 0.45 * lv) * (0.4 + 0.6 * rnd()), inst = rnd() < 0.75 ? 'clink' : 'clamp';
      for (let j = 0; j < K; j++) { const tj = tt + j * gap * (1 - 0.03 * j); if (tj < until + 0.4) Q(inst, m, tj, g0 * Math.pow(0.86, j), { strict: true, pan, det: (rnd() - 0.5) * 30, dur: 0.08, r: 0.06 }); } }
  } finally { G4 = keepG; OUT4 = keepO; }
  T.upTo = until;
}
function tremble5(level, dur) {
  const t = begin(); if (t == null) return 0; const lv = clamp(+level || 0, 0, 1), T = trm5();
  T.lv = lv; T.g.gain.cancelScheduledValues(t); T.g.gain.setTargetAtTime(lv > 0 ? 1 : 0, t, lv > 0 ? 0.08 : 0.25);
  T.hum.gain.setTargetAtTime(0.02 + 0.07 * lv, t, 0.2); T.lg.gain.setTargetAtTime((0.02 + 0.07 * lv) * 0.8, t, 0.2); T.lfo.frequency.setTargetAtTime(8 + 11 * lv, t, 0.3);
  if (!(lv > 0)) { T.upTo = 0; if (T.timer) { root.clearInterval(T.timer); T.timer = null; } return lv; }
  trmFill(T, t, t + (dur || (T.live ? 0.9 : 2.5)));
  if (T.live && !T.timer && root.setInterval) T.timer = root.setInterval(() => { try { const c = ctx; if (!c || !c.__ovsb || c.__ovsb.trm !== T || !(T.lv > 0)) return; C = c; SB = c.__ovsb; trmFill(T, c.currentTime, c.currentTime + 0.9); } catch (e) { /* the rattle is never worth a crash */ } }, 300);
  return lv;
}
// cut dead at time t (the held breath): what was already written is thrown away with its input
function trembleCut(t) {
  const T = SB && SB.trm; if (!T) return; T.lv = 0; T.upTo = 0; T.g.gain.cancelScheduledValues(t); T.g.gain.setTargetAtTime(0, t, 0.004);
  const old = T.inp; old.gain.setValueAtTime(0, t + 0.02); T.inp = C.createGain(); T.inp.connect(T.g); if (T.live && root.setTimeout) root.setTimeout(() => { try { old.disconnect(); } catch (e) { /* gone */ } }, 3000);
  if (T.timer) { root.clearInterval(T.timer); T.timer = null; }
}
const DMS = [50, 52, 55, 57, 62, 64, 67, 69];        // D, E, G, A, for things that count up
const S4 = { name: 'lab band', step: step4, deepLand: deepLand4,
  snap: (t, n, w) => { if (n >= 5) Q('legno', 50, t, 0.1 * w * lvl(n), { rev: 0.1 }); },
  boom: t => { G4 = LAST4; Q('bdrum', NO, t, 0.14, { rev: 0.3 }); Q('timp', 50, t, 0.12, { rev: 0.3 }); Q('piano', 50, t, 0.2, { rev: 0.3 }); Q('tam', NO, t, 0.1, { dur: 1.0, r: 0.6, rev: 0.3 }); G4 = 1; },
  // the marks on the way up (no words now): a bell tolls once, twice, three times, each darker; then OVERREACT
  flag(t, k, o) {
    if (k < 4) { G4 = 0.4; try { S4.mark(t, k); } finally { G4 = 1; } } else { G4 = 1; try { over5(t, o); } finally { G4 = 1; OUT4 = null; } }
  },
  mark(t, k) {
    if (k === 1) { Q('tbell', 74, t, 0.4, { rev: 0.45 }); Q('timp', 50, t, 0.15, { rev: 0.3 }); Q('piano', 62, t, 0.25, { rev: 0.3 }); }
    else if (k === 2) { Q('tbell', 74, t, 0.38, { rev: 0.45, pan: -0.2 }); Q('tbell', 74, t + 0.16, 0.4, { rev: 0.45, pan: 0.2 }); Q('timp', 50, t, 0.15, { rev: 0.3 }); [50, 52, 57].forEach((q, i) => Q('strings', q + 12, t, 0.2, { dur: 0.8, a: 0.03, r: 0.4, g1: 0.3, pan: (i - 1) * 0.5, wide: 0.3, rev: 0.4, trem: { f: 12, d: 0.8 } })); }
    else if (k === 3) { [0, 0.16, 0.32].forEach((d, i) => { Q('tbell', 74, t + d, 0.36, { rev: 0.45, pan: -0.3 }); Q('tbell', 69, t + d, 0.3, { rev: 0.45, pan: 0.3 }); }); Q('timp', 50, t, 0.2, { rev: 0.3 }); Q('anvil', 74, t + 0.26, 0.3, { rev: 0.4 }); [50, 52, 57].forEach((q, i) => Q('choirA', q, t + 0.26, 0.32, { dur: 0.6, a: 0.03, r: 0.4, pan: (i - 1) * 0.4, wide: 0.3, rev: 0.5 })); for (let i = 0; i < 4; i++) Q('crack', NO, t + 0.3 + rnd() * 0.4, 0.2, { pan: rnd() * 1.6 - 0.8, rev: 0.3 }); }
  },
  flagSoft: t => Q('bowl', 69, t, 0.14, { rev: 0.4, dur: 0.8, r: 0.4 }),
  // a reagent set down in the line: glass on the bench, the same glass each time
  queue: (t, i) => { Q('clink', 88, t, 0.2, { rev: 0.2, pan: (i - 1) * 0.3 }); Q('legno', 50, t, 0.12, { rev: 0.1 }); },
  // the line fires: the cork goes, the burner lights
  fire: t => { Q('cork', NO, t, 0.3, { rev: 0.25, det: -500, lp: 1500 }); Q('bdrum', NO, t + 0.02, 0.5, { rev: 0.2 }); Q('roar', NO, t + 0.02, 0.5, { dur: 0.35, a: 0.02, r: 0.3, g1: 0.3, wide: 0.4, rev: 0.2 }); Q('steam', NO, t + 0.02, 0.25, { dur: 0.25, a: 0.01, r: 0.2, g1: 0.3 }); },
  // a reagent lands on the molecule: a splash, a drum, the basses plucking Dm, Gm, A; heavier each
  strike: (t, i, w) => { Q('bdrum', NO, t, (0.4 + 0.14 * i) * w, { rev: 0.2 }); Q('pour', NO, t, 0.3 * w, { dur: 0.25, r: 0.15, pan: (i - 1) * 0.4, rev: 0.2 }); Q('pizz', [38, 43, 45][i], t, 0.4 * w, { rev: 0.2 }); Q('piano', [50, 55, 57][i], t, 0.22 * w, { rev: 0.25, pan: 0.2 }); if (i === 2) Q('timp', 45, t, 0.4 * w, { rev: 0.3 }); },
  // the molecule takes over: a low flask rings and the basses settle under it
  handoff: t => { Q('bowl', 50, t, 0.3, { rev: 0.45 }); Q('basses', 38, t, 0.45, { dur: 0.5, a: 0.04, r: 0.4, g1: 0.4, rev: 0.3, gl: [0, -100, 0.5, 0] }); Q('steam', NO, t, 0.12, { dur: 0.3, a: 0.05, r: 0.3 }); },
  // the yield counting: a pencil of glass ticks on one pitch
  tick: (t, n) => Q('clink', 93, t, 0.06, { pan: rnd() * 0.8 - 0.4, rev: 0.1, det: (rnd() - 0.5) * 60 }),
  swish: (t, d) => Q('steam', NO, t, 0.06, { dur: d * 1.2, a: d * 0.9, r: d * 0.5, lp: 3000, bed: true, pan: -0.4 }),
  drone: (t, lv, step, d) => { const r = roots4()[chordIx(SB.clk.n || 1)]; Q('drone', r, t, 0.2 + 0.3 * lv, { dur: d, a: Math.min(0.06, d * 0.3), r: 0.2, bed: true, wide: 0.3 }); Q('pad', r + 19, t, 0.1 + 0.2 * lv, { dur: d, a: Math.min(0.06, d * 0.3), r: 0.2, bed: true }); },
  draw: (t, n, d) => Q('steam', NO, t, 0.1, { dur: d, a: d * 0.95, ax: true, cut: true, bed: true, wide: 0.4, bp: 1500, bp1: 5000, bpt: d }),
  // before a step: a breath of steam into the hit. Before the last: the riser, then the held breath (rise5)
  windup: (t, n, ms, last) => { G4 = last ? RISE4 * dB(-8 * (1 - Math.min(place5(n), 1))) : CHAIN4; try { S4.wind(t, n, ms, last); } finally { G4 = 1; OUT4 = null; } },
  wind: (t, n, ms, last) => { const d = ms / 1000;
    if (last) { rise5(t, d, madW()); return; }
    if (d > 0.12) { Q('steam', NO, t + d * 0.3, 0.2 * lvl(n), { dur: d * 0.7, a: d * 0.66, ax: true, cut: true, bed: true, wide: 0.4, bp: 2000, bp1: 6000, bpt: d * 0.7 }); Q('conga', 57, t + d - 0.1, 0.07 * lvl(n), { pan: 0.3 }); } },
  // runoff lands in its jar. m names what came off: 'water' (or 0, 3) a drip, 'heavy' (1) a thunk, 'gas' (2) a puff and the lid,
  // 'acid' (4) a fizz, 'salt' (5) grains, 'oil' (6) a slow bubble; then the jar rings, always the same note
  clink: (t, n, m) => { const k = typeof m === 'string' ? ({ water: 0, heavy: 1, gas: 2, acid: 4, salt: 5, oil: 6 })[m] || 0 : (m | 0), jar = 74;
    if (k === 1) { Q('grain', NO, t, 0.2, { pan: 0.4 }); Q('pizz', 38, t + 0.03, 0.3, { dur: 0.15, pan: 0.4 }); }
    else if (k === 2) { Q('puff', NO, t, 0.2, { pan: 0.4, hp: 1500 }); Q('clamp', NO, t + 0.12, 0.14, { pan: 0.4 }); }
    else if (k === 4) Q('fizz', NO, t, 0.25, { pan: 0.4, rev: 0.2 });
    else if (k === 5) Q('grain', NO, t, 0.3, { pan: 0.4, rev: 0.15 });
    else if (k === 6) Q('blub', 55, t, 0.3, { pan: 0.4, rev: 0.2 });
    else Q('drip', 84, t, 0.25, { pan: 0.4, rev: 0.2 });
    Q('glass', jar, t + 0.05, 0.14, { pan: 0.5, rev: 0.35, dur: 0.5, r: 0.3 }); },
  gold: (t, n) => { Q('coin', 96, t, 0.16, { rev: 0.25, det: -700, lp: 6000 }); if ((n | 0) > 1) Q('coin', 93, t + 0.11, 0.13, { pan: 0.2, rev: 0.25, det: -700, lp: 6000 }); Q('legno', 50, t, 0.1); },
  // a reagent that did nothing: a dull cork, a damped string, a fizzle
  wasted: t => { Q('cork', NO, t, 0.3, { lp: 900, det: -500 }); Q('pizz', 33, t, 0.3, { dur: 0.12, r: 0.08 }); Q('steam', NO, t + 0.03, 0.12, { dur: 0.2, a: 0.02, r: 0.25, g1: 0.2, lp: 4000, lp1: 800, lpt: 0.3 }); },
  // a round lost: the cello falls D, B flat, A, and stops on the low D; a soft drum under the last
  lost: t => { [62, 57, 55, 50].forEach((q, i) => { Q('bow', NO, t + i * 0.36, 0.08); Q('cello', q, t + i * 0.36, 0.4, { dur: i === 3 ? 1.3 : 0.33, a: 0.05, r: i === 3 ? 0.8 : 0.15, rev: 0.4, vib: i === 3 ? 12 : 0 }); }); Q('timp', 38, t + 1.08, 0.3, { rev: 0.3 }); Q('piano', 26, t + 1.08, 0.3, { rev: 0.3 }); },
  pageTurn: t => Q('page', NO, t, 0.3, { pan: -0.2, rev: 0.15 })
};
// what the player does before the chain sits under the chain's late steps
(function () { const lv = { clink: 0.45, queue: 0.7, fire: 0.6, strike: 0.6, handoff: 0.1, lost: 0.4, wasted: 0.45, snap: CHAIN4, drone: CHAIN4, draw: CHAIN4, swish: CHAIN4 }; Object.keys(lv).forEach(k => { const f = S4[k]; S4[k] = function () { G4 = lv[k]; try { return f.apply(S4, arguments); } finally { G4 = 1; } }; }); })();
STYLE[4] = S4;
// the other screens and acts in style 4. No tunes, no runs up: the soundtrack carries the tune, so each act is one gesture on the
// orchestra or one thing done at the bench
const ACTS4 = {
  title: t => { Q('bdrum', NO, t, 0.6, { rev: 0.3 }); Q('timp', 38, t, 0.5, { rev: 0.35 }); [26, 38, 45].forEach(q => Q('piano', q, t, 0.4, { rev: 0.35 })); Q('tbell', 62, t + 0.02, 0.35, { rev: 0.5, pan: 0.3 }); Q('bowl', 50, t + 0.5, 0.2, { rev: 0.5, pan: -0.3 }); },
  runStart: t => { Q('cork', NO, t, 0.3, { det: -500, lp: 1500, rev: 0.25 }); Q('roar', NO, t + 0.02, 0.6, { dur: 0.5, a: 0.03, r: 0.5, g1: 0.3, wide: 0.4, rev: 0.25 }); Q('timp', 38, t + 0.02, 0.6, { rev: 0.35 }); [38, 45, 50, 52].forEach((q, i) => Q('bone', q, t + 0.02, 0.26, { dur: 0.5, a: 0.015, r: 0.4, lp: 1200, lp1: 5000, lpt: 0.06, pan: (i - 1.5) * 0.3, rev: 0.4 })); Q('piano', 26, t + 0.02, 0.4, { rev: 0.3 }); },
  shopOpen: t => { Q('bowl', 57, t, 0.3, { rev: 0.45 }); Q('clink', 90, t + 0.12, 0.16, { pan: 0.3, rev: 0.2 }); Q('page', NO, t, 0.14, { pan: -0.3 }); },
  buy: t => { Q('coin', 96, t, 0.22, { det: -700, lp: 6000, rev: 0.2 }); Q('legno', 50, t, 0.2); Q('clamp', NO, t + 0.1, 0.22, { pan: 0.2, rev: 0.2 }); [38, 45].forEach(q => Q('piano', q, t + 0.1, 0.3, { rev: 0.3 })); },
  cantBuy: t => { Q('pizz', 38, t, 0.3, { dur: 0.14, r: 0.08 }); Q('pizz', 38, t + 0.14, 0.3, { dur: 0.14, r: 0.08 }); Q('cork', NO, t, 0.16, { det: -900, lp: 800 }); },
  hover: t => Q('clink', 93, t, 0.03, { rev: 0.1 }),
  click: t => { Q('legno', 50, t, 0.14, { rev: 0.1 }); Q('clink', 90, t, 0.07, { rev: 0.1 }); },
  pick: t => { Q('timp', 38, t, 0.4, { rev: 0.3 }); Q('piano', 50, t, 0.35, { rev: 0.3 }); Q('bowl', 62, t, 0.25, { rev: 0.45, pan: 0.3 }); },
  redraw: t => { Q('page', NO, t, 0.35, { pan: -0.3, rev: 0.15 }); Q('pizz', 45, t + 0.22, 0.3, { rev: 0.2 }); Q('pizz', 38, t + 0.34, 0.35, { rev: 0.2, pan: 0.2 }); },
  // a round won: the kettledrums step from A to D and the brass and choir close on a bare fifth
  roundWon: t => { Q('timp', 45, t, 0.5, { rev: 0.35 }); Q('timp', 38, t + 0.3, 0.7, { rev: 0.35 }); Q('bdrum', NO, t + 0.3, 0.6, { rev: 0.3 }); [38, 45, 50, 57].forEach((q, i) => Q('bone', q, t + 0.3, 0.26, { dur: 1.1, a: 0.02, r: 0.7, lp: 1400, lp1: 5500, lpt: 0.08, pan: (i - 1.5) * 0.3, wide: 0.15, rev: 0.45 })); [57, 62].forEach((q, i) => Q('horn', q, t + 0.3, 0.3, { dur: 1.1, a: 0.03, r: 0.7, pan: i ? 0.4 : -0.4, rev: 0.45 })); [50, 57, 62].forEach((q, i) => Q('choirO', q, t + 0.3, 0.26, { dur: 1.2, a: 0.05, r: 0.8, pan: (i - 1) * 0.4, wide: 0.3, rev: 0.5 })); Q('tbell', 62, t + 0.3, 0.3, { rev: 0.5, pan: 0.3 }); Q('piano', 26, t + 0.3, 0.4, { rev: 0.3 }); },
  // a run won: G minor, A, then D major held, every player, the tam-tam under it
  runWon: t => { [[31, 43, 50, 55, 57, 62], [33, 45, 50, 52, 55, 57], [26, 38, 45, 50, 57, 62, 64, 69]].forEach((ch, j) => { const tt = t + j * 0.5, d = j === 2 ? 2.4 : 0.42; Q('timp', [43, 45, 38][j], tt, 0.5 + 0.15 * j, { rev: 0.35 }); Q('bdrum', NO, tt, 0.4 + 0.2 * j, { rev: 0.3 }); ch.forEach((q, i) => Q(q < 44 ? 'basses' : q < 56 ? 'bone' : i % 2 ? 'horn' : 'choirA', q, tt, 0.24, { dur: d, a: 0.02, r: j === 2 ? 1.2 : 0.2, lp: q < 56 && q >= 44 ? 1400 : 0, lp1: 6000, lpt: 0.08, pan: (i / (ch.length - 1) - 0.5) * 1.2, wide: 0.15, rev: 0.45, strict: q < 44 })); }); Q('tam', NO, t + 1.0, 0.4, { rev: 0.5 }); Q('tbell', 62, t + 1.0, 0.35, { rev: 0.5, pan: 0.3 }); Q('tbell', 69, t + 1.02, 0.3, { rev: 0.5, pan: -0.3 }); Q('piano', 26, t + 1.0, 0.45, { rev: 0.3 }); deepLand4(t + 1.0, true, true); },
  runLost: t => { [57, 55, 50].forEach((q, i) => { Q('bow', NO, t + i * 0.55, 0.08); Q('cello', q, t + i * 0.55, 0.4, { dur: i === 2 ? 1.6 : 0.5, a: 0.06, r: i === 2 ? 1.0 : 0.2, rev: 0.45, vib: i === 2 ? 12 : 0 }); }); [38, 45].forEach((q, i) => Q('choirU', q, t + 1.1, 0.35, { dur: 1.6, a: 0.3, r: 1.0, wide: 0.3, rev: 0.5 })); Q('piano', 26, t + 1.1, 0.4, { rev: 0.35 }); Q('tam', NO, t + 1.1, 0.14, { rev: 0.5 }); },
  // an unlock: a clamp let go, a flask and a bell a fifth apart over a low string
  unlock: t => { Q('clamp', NO, t, 0.35, { rev: 0.2 }); Q('bowl', 50, t + 0.12, 0.35, { rev: 0.5, pan: -0.3 }); Q('tbell', 57, t + 0.12, 0.35, { rev: 0.5, pan: 0.3 }); [26, 38].forEach(q => Q('piano', q, t + 0.12, 0.35, { rev: 0.3 })); Q('timp', 38, t + 0.12, 0.4, { rev: 0.35 }); },
  // a finding: the page, a pencil, one cello note and a glass harmonic left hanging
  finding: t => { Q('paper', NO, t, 0.3, { pan: -0.3 }); Q('tick', NO, t + 0.2, 0.14); Q('tick', NO, t + 0.3, 0.1); Q('bow', NO, t + 0.4, 0.1); Q('cello', 57, t + 0.4, 0.4, { dur: 0.9, a: 0.08, r: 0.6, rev: 0.45, vib: 10 }); Q('glass', 76, t + 0.45, 0.25, { rev: 0.5, pan: 0.3 }); },
  // a creature: something wet and low turning over in its jar
  creature: t => { Q('bubble', NO, t, 0.45, { det: -1200, lp: 900, rev: 0.25 }); Q('pour', NO, t + 0.05, 0.35, { det: -1000, lp: 1200, dur: 0.4, r: 0.2, pan: 0.2, rev: 0.25 }); Q('cork', NO, t + 0.3, 0.2, { det: -1200, lp: 700 }); Q('basses', 31, t, 0.3, { dur: 0.3, a: 0.05, r: 0.2, gl: [0, -200, 0.3, 0.05] }); },
  instrument: t => { Q('clamp', NO, t, 0.35, { rev: 0.2 }); Q('roar', NO, t, 0.5, { dur: 0.28, a: 0.2, r: 0.25, wide: 0.4, rev: 0.2 }); Q('timp', 38, t + 0.25, 0.5, { rev: 0.35 }); [38, 45].forEach(q => Q('piano', q, t + 0.25, 0.35, { rev: 0.3 })); Q('anvil', 74, t + 0.25, 0.2, { rev: 0.35, pan: 0.3 }); }
};
// the quiet room under the screens between reactions: the burner, and a loop of the lab (bubbles, glass, paper, drips)
function amb4(kind, dur, t) {
  const c = C, g = c.createGain(), nodes = [], stop = dur ? t + dur : null; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 1.5); if (stop) g.gain.setTargetAtTime(0, stop - 1, 0.3); g.connect(SB.bed);
  const send = c.createGain(); send.gain.value = 0.3; g.connect(send); send.connect(hall4());
  const one = (name, lv, lp, rate) => { const src = c.createBufferSource(), og = c.createGain(), b = labBuf(c, name, NO, 0).b; if (!b) return; src.buffer = b; src.loop = true; src.playbackRate.value = rate; og.gain.value = lv; let n = src; if (lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; src.connect(f); n = f; } n.connect(og); og.connect(g); src.start(t, Math.random() * 10); nodes.push(src); if (stop) src.stop(stop + 0.1);
    // the speed drifts a few percent over half a minute or more, so the recording never comes round at the same length twice
    const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 0.011 + 0.017 * Math.random(); lg.gain.value = 0.07 * rate; l.connect(lg); lg.connect(src.playbackRate); l.start(t); nodes.push(l); if (stop) l.stop(stop + 0.1); };
  // the burner: twelve seconds of it, twice, at two speeds that drift, so it does not come round
  const rl = kind === 'title' ? 0.1 : kind === 'bench' ? 0.07 : 0.04; one('roarL', rl * 0.7, 700, 1); one('roarL', rl * 0.7, 600, 0.83); if (kind === 'pick' || kind === 'title') { one('steam', 0.009, 5000, 1); one('steam', 0.008, 4000, 0.71); }
  // the room: things dropped at random times, never a loop. each [instrument, lowest note, how many notes up, per minute, level]
  const LIST = { title: [['bubble', NO, 0, 26, 0.06], ['drip', 78, 9, 8, 0.035], ['clink', 86, 12, 6, 0.03], ['bowl', 50, 0, 2.5, 0.016]], bench: [['bubble', NO, 0, 40, 0.07], ['drip', 78, 9, 14, 0.04], ['paper', NO, 0, 4, 0.025], ['clink', 86, 12, 5, 0.025], ['tick', NO, 0, 6, 0.02]],
    shop: [['clink', 84, 14, 22, 0.035], ['coin', 93, 6, 5, 0.018], ['paper', NO, 0, 8, 0.03], ['clamp', NO, 0, 3, 0.02], ['legno', 48, 12, 5, 0.02]], pick: [['bubble', NO, 0, 18, 0.055], ['drip', 76, 12, 18, 0.04], ['bowl', 57, 0, 3, 0.014], ['bowl', 62, 0, 2, 0.012], ['paper', NO, 0, 3, 0.02]] }[kind] || [];
  const drop = (a, b) => LIST.forEach(q => { let k = q[3] * (b - a) / 60; k = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0); for (let i = 0; i < k; i++) { const bz = labBuf(c, q[0], q[1] === NO ? NO : q[1] + Math.floor(Math.random() * (q[2] + 1)), Math.floor(Math.random() * 3)); if (!bz.b) continue; const src = c.createBufferSource(), og = c.createGain(), tt = a + Math.random() * (b - a); src.buffer = bz.b; src.detune.value = (Math.random() - 0.5) * (q[1] === NO ? 500 : 30); og.gain.value = q[4] * (0.4 + 0.8 * Math.random()); src.connect(og);
    if (HASPAN) { const pn = c.createStereoPanner(); pn.pan.value = Math.random() * 1.6 - 0.8; og.connect(pn); pn.connect(g); } else og.connect(g); src.start(tt); } });
  const amb = { g, nodes };
  if (stop) drop(t + 0.3, stop); else { let upTo = t + 0.3; const tick = () => { const now = c.currentTime; if (upTo < now + 3) { drop(Math.max(upTo, now + 0.05), now + 5); upTo = now + 5; } }; tick(); amb.timer = root.setInterval(tick, 1500); }
  SB.amb = amb;
}
// make the bank ahead of time, a little at a time, so the first sound of a kind does not wait for its instrument
function warm4(sync) {
  const L = []; Object.keys(LAB.INST).forEach(k => { const sp = LAB.INST[k]; if (sp.fix !== undefined) { for (let tk = 0; tk < (sp.rr || 1); tk++) L.push([k, sp.fix, tk]); } else for (let m = sp.lo; m <= sp.hi; m += 3) for (let tk = 0; tk < (sp.rr || 1); tk++) L.push([k, m, tk]); });
  const go = () => { const t0 = Date.now(); while (L.length && Date.now() - t0 < 12) { const q = L.shift(); labBuf(ctx, q[0], q[1], q[2]); } if (L.length) setTimeout(go, 30); }; if (sync) { while (L.length) { const q = L.shift(); labBuf(ctx, q[0], q[1], q[2]); } return 0; } go(); return L.length;
}

// ====================================================================================================================
// THE BUILD-UPS (builder 5). Owner, 12 November, after watching arrows drawn before each reaction: "I liked the arrow pushing,
// but I need the sound to be more majestic with the buildup to reactions building. It's a bit flat. Needs to hit the dopamine."
// Asked what majestic should lean on: "Drums and a riser". Three options to hear, AA.sfx.build('a' | 'b' | 'c') ('' = off):
//   a  timpani and toms: a roll under each arrow that lands on the hit, each hit a bigger drum, a whoosh into every hit, the
//      roll never stopping from step 5 on
//   b  war drums: a steady pattern that gains a player every step and doubles its pace twice (2, 4, 8 strokes to the gap),
//      risers stacked in octaves under the arrows, every player together on the hit
//   c  cinematic: a low boom on each hit, a long reversed cymbal into the next, a heartbeat under the arrows, snare rolls, and
//      one tone that climbs the whole chain without starting again
// The arrow (AA.sfx.arrow(n, ms, { last, of, gap })) is the anticipation; the hit (AA.sfx.reflex) is the release. Before the last
// hit everything stops dead for BREATH5 seconds. OVERREACT (AA.sfx.flag(4)) is style 4's reward with drums, brass and glass on it.
// Every drum is made here by code: kettledrums, a bass drum, big barrel drums and their rim, a field snare, a low boom, a
// cymbal played backwards. Notes: the chain chord's root on the kettledrums; everything else D, E, G, A.
// ====================================================================================================================
const BKEY = 'overreact.sfx.build';
let BLD = 'c';                                       // the owner's pick (12 November): cinematic. Saved between sessions; '' is style 4's own chain
const C5HIT = 0.43, C5LAST = 0.95, C5RISE = 8, C5ARR = 0.33, C5ARISE = 1.5, C5LARR = 0.7;   // c: the hit at the top of the build, the last hit, decibels from the first hit to the top, the arrow, the last arrow
const H5 = LAB.H, BREATH5 = 0.32, B5HIT = 0.52, B5LAST = 0.72, B5RISE = 6.5;   // B5RISE: decibels from the first hit of a cold 12-step chain to its last ordinary hit
Object.assign(LAB.INST, {
  taiko: { rr: 2, lo: 26, hi: 41, gen: m => { const f = mf(m), x = H5.modal([[f, 1, 0.95], [f * 1.59, 0.55, 0.5], [f * 2.14, 0.4, 0.34], [f * 2.65, 0.25, 0.24], [f * 3.16, 0.16, 0.18], [f * 3.6, 0.1, 0.14]], 1.3); H5.chirp(x, 0, f * 2.2, f, 0.09, 0.9); H5.burst(x, 0, 0.035, 60, 500, 1.5, 501 + m); H5.burst(x, 0, 0.006, 1200, 5200, 0.8, 502 + m); return H5.norm(H5.fade(x, 0.2), 0.9); } },
  ka:    { rr: 3, fix: 60, gen: () => { const x = H5.modal([[1080, 1, 0.035], [1630, 0.6, 0.028], [2290, 0.4, 0.02], [610, 0.5, 0.045]], 0.15); H5.burst(x, 0, 0.002, 2000, 9000, 0.9, 511); return H5.norm(x, 0.85); } },
  snr:   { rr: 3, fix: 60, gen: () => { const x = H5.modal([[185, 1, 0.12], [330, 0.5, 0.09], [520, 0.2, 0.05]], 0.4); H5.burst(x, 0, 0.07, 1800, 9500, 1.4, 515); H5.burst(x, 0, 0.003, 3000, 12000, 0.7, 516); return H5.norm(x, 0.9); } },
  boom:  { fix: 30, gen: () => { const n = Math.floor(2.8 * 44100), x = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / 44100; ph += 2 * Math.PI * (31 + 70 * Math.exp(-t / 0.07)) / 44100; x[i] = Math.tanh(2.2 * Math.sin(ph) * (0.35 + 0.65 * Math.exp(-t / 0.12))) * Math.exp(-t / 0.75) * Math.min(1, i / 40); } H5.burst(x, 0, 0.09, 30, 200, 1.6, 521); H5.burst(x, 0, 0.02, 300, 2400, 0.9, 522); H5.burst(x, 0, 0.008, 1500, 7000, 0.5, 524); H5.burst(x, 0.01, 0.6, 25, 110, 0.6, 523); return H5.norm(H5.fade(x, 0.4), 0.9); } },
  rcym:  { rr: 2, fix: 60, gen: () => { const r = H5.RNG(531), P = []; for (let i = 0; i < 110; i++) { const f = 300 * Math.pow(40, r()); P.push([f, Math.pow(f / 300, 0.2) * (0.4 + r()), clamp(3.2 - 0.55 * Math.log2(f / 300), 0.6, 3.2)]); } const x = H5.modal(P, 3.2); H5.burst(x, 0, 0.5, 3500, 14000, 1.6, 532); H5.burst(x, 0, 0.01, 2000, 12000, 1.2, 533); H5.norm(x, 0.85); x.reverse(); const k = 220; for (let i = 0; i < k; i++) x[x.length - 1 - i] *= i / k; return x; } }
});
const R5 = (i, m, t, g, x) => L4(Object.assign({ i, m, t, g, raw: true, strict: true, take: 0 }, x));   // the same take every time, so a hit is never smaller than the last by chance
// a roll: strokes from t0 to t1, r0 to r1 strokes a second, level g0 to g1, hand to hand
function roll5(i, m, t0, t1, g0, g1, r0, r1, x) { let t = t0, k = 0; const D = Math.max(0.02, t1 - t0); while (t < t1 - 0.012) { const u = (t - t0) / D; R5(i, m, t, (g0 + (g1 - g0) * Math.pow(u, 1.6)) * (0.88 + 0.24 * rnd()), Object.assign({ pan: k % 2 ? 0.14 : -0.14, take: k % 3 }, x)); t += 1 / (r0 + (r1 - r0) * u); k++; } }
// a rising whoosh of d seconds that stops dead at its top
const whoosh5 = (t, d, g, top) => { R5('steam', NO, t, g, { dur: d, a: d * 0.97, ax: true, cut: true, wide: 0.6, bp: 280, bp1: top, bpt: d, bq: 0.8, rev: 0.12 }); R5('roar', NO, t, g * 0.55, { dur: d, a: d * 0.97, ax: true, cut: true, lp: 140, lp1: Math.max(300, top * 0.4), lpt: d }); };
// a cymbal played backwards from t0, swelling to end exactly at t1
const rcym5 = (t0, t1, g, x) => { const L = 3.2, d = Math.min(L - 0.02, Math.max(0.1, t1 - t0)); R5('rcym', NO, t1 - d, g, Object.assign({ off: L - d, rev: 0.25, fin: 0.05 }, x)); };
const pc5 = (ix, lo) => { const r = roots4()[ix]; return lo + (((r - lo) % 12) + 12) % 12; };   // the chain chord's root, in the octave from lo up
// ---- a: timpani and toms ----
function arrA(t, n, d, u, last) {
  const m = pc5(chordIx(n, false), 36), end = last ? Math.max(0.1, d - BREATH5) : d;
  roll5('timp', m, t, t + end, 0.2 + 0.1 * u, 0.5 + 0.5 * u, 11, 15 + 4 * u, { rev: 0.3, lp: 1800 + 4000 * u, dur: 0.5, r: 0.2 });
  R5('horn', pc5(chordIx(n, false), 45), t, 0.1 + 0.2 * u, { dur: end, a: end * 0.95, ax: true, cut: true, gl: [-700, 0, end * 0.93, 0], lp: 600, lp1: 2500 + 5000 * u, lpt: end, wide: 0.4, rev: 0.25 });   // a pitched riser under the roll: a horn sliding up a fifth into the chord's root
  whoosh5(t, end, 0.3 + 0.7 * u, 2200 + 7000 * u);
  if (n >= 3) { const K = 3 + Math.round(4 * u); for (let j = 0; j < K; j++) { const x = (j + 1) / (K + 1); R5('tom', 43 + Math.round(14 * x), t + end * (0.35 + 0.6 * x), (0.2 + 0.5 * x) * (0.5 + 0.5 * u), { pan: (x - 0.5) * 1.2, rev: 0.25 }); } }
  if (u > 0.5 || last) roll5('cym', NO, t + end * 0.3, t + end, 0.02, 0.12 + 0.25 * u, 14, 20, { hp: 2500, dur: 0.25, r: 0.15, rev: 0.2 });
  if (last) { rcym5(t, t + end, 0.9); roll5('bdrum', NO, t, t + end, 0.1, 0.7, 9, 13, { rev: 0.3, dur: 0.4, r: 0.2 }); }
}
function hitA(t, n, u, last, tNA) {
  const m = pc5(chordIx(n, last), 36), big = last ? 1.25 : 1;
  R5('tom', 57 - Math.round(12 * u), t, 0.75, { rev: 0.3, pan: -0.25 }); R5('tom', 52 - Math.round(12 * u), t + 0.004, 0.55, { rev: 0.3, pan: 0.25 });
  R5('timp', m, t, (n === 1 ? 0.5 : 0.8 + 0.4 * u) * big, { rev: 0.4 }); if (u > 0.45) R5('timp', m - 12, t, (0.3 + 0.7 * (u - 0.45)) * big, { rev: 0.4 });
  if (u > 0.2) R5('bdrum', NO, t, (0.3 + 1.0 * (u - 0.2)) * big, { rev: 0.3 });
  R5('snr', NO, t, 0.3 + 0.9 * u, { rev: 0.3, hp: 300 });
  if (u > 0.1) R5('cym', NO, t, (0.12 + 0.9 * (u - 0.1)) * big, { pan: 0.3, rev: 0.4, hp: 1500 });
  if (u > 0.7 || last) R5('tam', NO, t, last ? 0.9 : 0.35 + (u - 0.7), { rev: 0.4 });
  if (last) R5('boom', NO, t, 0.8, { rev: 0.2 });
  if (n >= 5 && !last && tNA > t + 0.2) roll5('timp', m, t + 0.14, tNA, 0.07 + 0.08 * u, 0.1 + 0.12 * u, 11, 13, { rev: 0.3, lp: 1200, dur: 0.4, r: 0.2 });
}
// ---- b: war drums ----
function arrB(t, n, d, u, last) {
  const r = pc5(chordIx(n, false), 33), end = last ? Math.max(0.1, d - BREATH5) : d, NV = Math.min(4, 1 + (n > 1 ? 1 : 0) + Math.floor(u * 2.6));
  for (let k = 0; k < NV; k++) { const q = r + 12 * k; R5(q < 57 ? 'horn' : 'pad', q, t, (0.3 + 0.35 * u) / (1 + 0.25 * k), { dur: end, a: end * 0.95, ax: true, cut: true, gl: [-700, 0, end * 0.93, 0], lp: 500 + 1500 * u, lp1: 2500 + 6000 * u, lpt: end, wide: 0.4, pan: (k - (NV - 1) / 2) * 0.3, rev: 0.25 }); }
  whoosh5(t, end, 0.25 + 0.6 * u, 2000 + 7000 * u);
  { const K = 4 + Math.round(4 * u); for (let j = 0; j < K; j++) { const x = (j + 1) / (K + 1); R5('ka', NO, t + end * Math.pow(x, 0.6), (0.15 + 0.5 * x) * (0.5 + 0.5 * u), { pan: j % 2 ? 0.5 : -0.5, rev: 0.2 }); } }
  R5('taiko', 31, t, 0.3 + 0.4 * u, { rev: 0.3 });
  if (last) { rcym5(t, t + end, 0.9); roll5('taiko', 31, t, t + end, 0.15, 0.9, 10, 16, { rev: 0.3 }); roll5('snr', NO, t, t + end, 0.05, 0.5, 15, 22, { rev: 0.25, pan: 0.2 }); }
}
function hitB(t, n, u, last, tNA, tNH) {
  const P = Math.min(n, 9), big = last ? 1.2 : 1, h = () => (rnd() - 0.5) * 0.012;
  R5('taiko', 31, t, 0.9 * big, { rev: 0.35 }); if (P >= 2) R5('ka', NO, t, 0.8, { pan: 0.4, rev: 0.2 }); if (P >= 3) R5('taiko', 38, t + 0.006, 0.7 * big, { pan: -0.55, rev: 0.35 }); if (P >= 4) R5('snr', NO, t, 0.6, { pan: 0.2, rev: 0.3 }); if (P >= 5) R5('taiko', 36, t + 0.009, 0.7 * big, { pan: 0.55, rev: 0.35 });
  if (P >= 6) { R5('tom', 45, t, 0.6, { pan: -0.3, rev: 0.3 }); R5('tom', 50, t + 0.005, 0.5, { pan: 0.3, rev: 0.3 }); } if (P >= 7) R5('bdrum', NO, t, 1.0 * big, { rev: 0.3 }); if (P >= 8) R5('cym', NO, t, 0.6 * big, { pan: -0.3, rev: 0.4, hp: 1500 });
  if (P >= 9 || last) { R5('taiko', 26, t, 0.9, { rev: 0.4 }); R5('boom', NO, t, 0.7, {}); R5('tam', NO, t, 0.5, { rev: 0.4 }); }
  if (last || tNH < t + 0.25) return;
  // the war drums until the next hit: 2 strokes to the gap, then 4, then 8; a player joins each step
  const span = tNH - t, p = n <= 3 ? 2 : n <= 6 ? 4 : 8, s = span / p;
  for (let k = 0; k < p; k++) { const tk = t + k * s, acc = k % 2 === 0 ? 1 : 0.7;
    if (k) { R5('taiko', 31, tk + h(), 0.55 * acc, { rev: 0.3 }); if (P >= 3) R5('taiko', 38, tk + h(), 0.42 * acc, { pan: -0.55, rev: 0.3 }); if (P >= 5) R5('taiko', 36, tk + h(), 0.42 * acc, { pan: 0.55, rev: 0.3 }); if (P >= 7 && k % 2 === 0) R5('bdrum', NO, tk, 0.5, { rev: 0.3 }); if (P >= 4) R5('snr', NO, tk + h(), 0.3 * acc, { pan: 0.2, rev: 0.25 }); }
    if (P >= 2) R5('ka', NO, tk + s / 2 + h(), 0.45, { pan: 0.4, rev: 0.15 });
    if (P >= 4 && p < 8) { R5('snr', NO, tk + s * 0.5 + h(), 0.18, { pan: 0.2, rev: 0.25 }); R5('snr', NO, tk + s * 0.75 + h(), 0.22, { pan: 0.2, rev: 0.25 }); }
    if (P >= 6) R5('tom', k % 2 ? 50 : 45, tk + s / 2 + h(), 0.3, { pan: k % 2 ? 0.3 : -0.3, rev: 0.25 });
    if (P >= 8) R5('hat', NO, tk + s / 2, 0.25, { pan: -0.5 }); }
}
// ---- c: cinematic (the owner's pick, 12 November; rebuilt by builder 6) ----
// The hit: a boom with a body (a sub under 60 Hz, drum modes from 70 to 400 Hz, a thud and a crack a phone can play) in a big
// hall, a snare in the same hall, a cymbal and a gong that come in by degrees. The arrow: a heartbeat, a snare roll, and the
// riser: one tone that climbs D, E, G, A step by step in stacked octaves and never starts again, low brass swelling into the
// hit, a cymbal roll, and the cymbal played backwards from the hit before. Every layer's level is a smooth curve of u (the
// place in the build), so each step is a little bigger and a little brighter than the last. Deeper rounds (w): the heart
// races and skips, the tone wavers and a wrong note leans into it, the boom sags and echoes, glass falls after the hit.
Object.assign(LAB.INST, {
  boomc: { fix: 30, gen: () => { const n = Math.floor(3.6 * 44100), x = new Float32Array(n), f = 36.7; let ph = 0; for (let i = 0; i < n; i++) { const t = i / 44100; ph += 2 * Math.PI * (f + 85 * Math.exp(-t / 0.05)) / 44100; x[i] = 0.55 * Math.tanh(2.4 * Math.sin(ph) * (0.3 + 0.7 * Math.exp(-t / 0.14))) * Math.exp(-t / 0.85) * Math.min(1, i / 40); }
      const md = H5.modal([[f * 2, 0.8, 1.3], [f * 3.18, 0.6, 1.0], [f * 4.28, 0.5, 0.75], [f * 5.3, 0.42, 0.6], [f * 6.3, 0.34, 0.5], [f * 8.5, 0.3, 0.4], [f * 11.2, 0.24, 0.32], [f * 14.6, 0.18, 0.26], [f * 19, 0.12, 0.2]], 3.4); for (let i = 0; i < md.length; i++) x[i] += md[i] * 0.6;
      H5.burst(x, 0, 0.08, 30, 220, 1.0, 541); H5.burst(x, 0, 0.07, 260, 1300, 4.5, 542); H5.burst(x, 0, 0.014, 1500, 7000, 1.6, 543); H5.burst(x, 0.012, 0.5, 60, 600, 0.6, 544); H5.burst(x, 0.02, 0.4, 400, 2800, 0.7, 545); return H5.norm(H5.fade(x, 0.5), 0.9); } }
});
const TONE5 = [45, 50, 52, 55, 57, 62, 64, 67, 69, 74, 76, 79, 81, 86];
function arrC(t, n, d, u, last, gap) {
  const w = madW(), end = last ? Math.max(0.1, d - BREATH5) : d, from = TONE5[Math.min(n - 1, 12)], to = TONE5[Math.min(n, 13)], len = last ? end : gap + 0.06, g = 0.2 + 0.2 * u, rt = pc5(chordIx(n, false), 33);
  // the one tone, in octaves: it slides up from the last step's note while the arrow is drawn and holds until the next arrow
  const X = x => Object.assign({ dur: len, a: 0.07, r: 0.14, gl: [(from - to) * 100, 0, Math.min(d, end) * 0.9, 0], wide: 0.4, rev: 0.3, cut: last, g1: last ? 1.6 : 1, vib: w > 0.2 ? 30 * w : 0 }, x);
  R5(to < 67 ? 'horn' : 'pad', to, t, g, X({ lp: 1600 + 5000 * u })); R5('pad', to + 12, t, g * 0.75, X({ lp: 2200 + 6000 * u, pan: 0.3 })); R5('pad', Math.min(96, to + 24), t, g * (0.3 + 0.3 * u), X({ lp: 2500 + 7000 * u, pan: -0.3 })); if (to - 12 >= 33) R5('horn', to - 12, t, g * 0.5, X({ lp: 700 + 2500 * u })); R5('drone', clamp(to - 12, 33, 50), t, g * 0.3, X({}));
  if (w > 0.4) { MST.wrong++; R5('pad', to + 6, t, g * 0.5 * w, X({ gl: [-100 - 200 * w, 100, Math.min(d, end) * 0.95, 0], lp: 2500, pan: -0.5 })); }   // deeper rounds: a wrong note leans up into the fifth
  // low brass swelling into the hit on the chain chord's root and fifth, and a cymbal roll opening under it
  const S = x => Object.assign({ dur: end, a: end * 0.96, ax: true, cut: true, lp: 500, lp1: 1800 + 5000 * u, lpt: end, wide: 0.35, rev: 0.35 }, x);
  R5('horn', rt + 12, t, 0.16 + 0.3 * u, S({})); R5('horn', rt + 19, t, 0.1 + 0.26 * u, S({ pan: 0.3 })); R5('horn', rt + 24, t, 0.05 + 0.26 * u, S({ pan: -0.3 })); R5('drone', rt + 12, t, 0.08 + 0.15 * u, S({ lp: 0 }));
  roll5('cym', NO, t + end * 0.25, t + end, 0.01, 0.03 + 0.2 * u, 16, 22, { hp: 2500 - 1000 * u, dur: 0.25, r: 0.15, rev: 0.25 });
  // the heartbeat: a low thump with a knock a phone can play; it quickens with the build and, deeper in the run, races and skips
  const hb = (tt, gg) => { R5('kick', NO, tt, gg * 0.6, { det: -200, lp: 1600 }); R5('tom', 57, tt, gg * 0.7, { lp: 1800, dur: 0.12, r: 0.08 }); R5('kick', NO, tt + 0.14, gg * 0.35, { det: -400, lp: 1200 }); R5('tom', 55, tt + 0.14, gg * 0.4, { lp: 1500, dur: 0.1, r: 0.08 }); };
  { const iv = (0.44 - 0.16 * u) / (1 + 0.45 * w); for (let tt = t; tt < t + end - 0.2; tt += iv * (w > 0.3 && rnd() < 0.3 * w ? (rnd() < 0.5 ? 0.5 : 1.5) : 1)) hb(tt, 0.4 + 0.35 * u); }
  if (n >= 3) roll5('snr', NO, t + end * Math.max(0, 0.5 - 0.6 * u), t + end, 0.03, 0.12 + 0.36 * u, 15 + 6 * w, 21 + 9 * w, { rev: 0.25, pan: 0.15 });
  if (last) { rcym5(t, t + end, 0.9); rcym5(t, t + end, 0.5, { det: -700, pan: -0.4 }); whoosh5(t, end, 0.7, 9000); roll5('bdrum', NO, t, t + end, 0.1, 0.6, 9, 14, { rev: 0.3, dur: 0.4, r: 0.2 }); roll5('timp', pc5(0, 36) + 7, t, t + end, 0.1, 0.5, 11, 17, { rev: 0.3, dur: 0.4, r: 0.2 }); }
}
function hitC(t, n, u, last, tNA, tNH) {
  const w = madW(), X = last ? x => Object.assign({ dir: true, dur: 0.24, r: 0.25 }, x) : x => x, XL = last ? x => Object.assign({ dir: 'lo', dur: 0.24, r: 0.2 }, x) : x => x, k = last ? 1.0 : 1, br = dB(-11 * (1 - u));   // br: the bright layers, 11 dB down at the first step, all on one curve
  R5('boomc', NO, t, 0.8 * k, XL({ rev: 0.55, gl: w > 0.25 ? [0, -500 * w, 0.6, 0.05] : undefined })); R5('taiko', 28, t, 0.4 * k, XL({ rev: 0.5 })); R5('kick', NO, t, 0.4 * k, XL({})); R5('tom', 45, t, 0.4, XL({ rev: 0.4, pan: -0.2 })); R5('tom', 57, t, 0.5, XL({ rev: 0.4, pan: 0.2 })); R5('snr', NO, t, 0.5, XL({ rev: 0.5, lp: 1800, pan: 0.1 }));
  R5('snr', NO, t, (last ? 2.2 : 0.9) * br, X({ rev: 0.6, pan: -0.2, hp: 200 })); R5('crack', NO, t, (last ? 1.6 : 0.7) * br, X({ pan: 0.4, rev: 0.4 }));
  R5('cym', NO, t, (last ? 3.2 : 0.8) * br, X({ pan: 0.3, rev: 0.45, hp: 1200 })); R5('tam', NO, t, last ? 1.6 : 0.4 * br * u, X({ rev: 0.45 })); if (last) { R5('cym', NO, t, 1.0, { pan: -0.3, rev: 0.45, hp: 1500, take: 1 }); R5('boomc', NO, t, 0.8, { rev: 0.6 }); R5('tam', NO, t, 0.6, { rev: 0.45 }); }   /* the tail of the last hit, on the bus as it opens */
  R5('steam', NO, t, (last ? 1.5 : 0.35) * br, X({ dur: 0.1, a: 0.004, r: 0.3, wide: 0.5, hp: 3500 }));
  if (last) { R5('bdrum', NO, t, 0.7, XL({ rev: 0.4 })); R5('timp', pc5(0, 36), t, 0.6, XL({ rev: 0.4 })); R5('shatter', NO, t, 2.4, X({ rev: 0.4, hp: 1500 })); [38, 50, 57, 62, 69, 74].forEach((q, i) => R5('horn', q, t, 0.5, { dur: 0.9, a: 0.02, r: 0.5, pan: (i - 2.5) * 0.25, wide: 0.3, rev: 0.5, lp: 6000, lp1: 1800, lpt: 1.2 })); }
  // deeper rounds: the boom echoes off the beat, a flam on the snare, glass falls
  if (w > 0.3) { MST.extra++; R5('boomc', NO, t + 0.17, 0.3 * w, { lp: 700, rev: 0.5, det: -300 }); R5('snr', NO, t + 0.035, 0.3 * w * (0.5 + u), { rev: 0.5, pan: 0.3 }); for (let i = 0; i < Math.round(5 * w); i++) R5('clink', safeUp(86 + Math.floor(rnd() * 12)), t + 0.08 + rnd() * 0.3, 0.12 * w, { pan: rnd() * 1.6 - 0.8, rev: 0.4 }); }
  if (!last && tNH > t + 0.3) { rcym5(t + 0.06, tNH, 0.22 + 0.5 * u, { pan: n % 2 ? 0.35 : -0.35, hp: 900, fin: 0.08 }); if (w > 0.5) rcym5(t + 0.06, tNH, 0.3 * w, { det: -700, pan: n % 2 ? -0.5 : 0.5, hp: 500, fin: 0.08 }); }
}
// ---- the arrow, the hit, OVERREACT ----
function st5() { return SB.b5 || (SB.b5 = { la: -99, gap: 1.5, d: 0.4, n: 0, of: 0 }); }
const u5 = (n, of) => { const i0 = 0.3 * INT4; return clamp(i0 + (1 - i0) * (n - 1) / Math.max(1, (of || 12) - 1), 0, 1); };
// an arrow starts: step n will hit in ms. o: last (the held breath before the hit), of (steps in this chain, if known), gap (ms to the next arrow, if known)
function arrow5(n, ms, o) {
  const t = begin(); if (t == null) return; o = o || {}; const b = st5(), d = clamp((+ms || 400) / 1000, 0.08, 3), last = !!o.last;
  if (n <= 1) b.of = 0; if (o.of) b.of = o.of | 0;
  const seen = t - b.la; b.gap = o.gap ? clamp(o.gap / 1000, 0.2, 4) : n > 1 && seen > 0.2 && seen < 3 ? Math.max(0.5, seen * 0.91) : 1.5; b.la = t; b.d = d; b.n = n;
  const u = u5(n, b.of), c = BLD === 'c'; G4 = c ? C5ARR * dB(-C5ARISE * (1 - u)) * (last ? C5LARR : 1) : B5HIT * dB(-B5RISE * (1 - u)) * (last ? 0.9 : 0.8); OUT4 = shelf5(c ? 1 + 8 * u : 1 + 9 * u); SB.duck.gain.setTargetAtTime(c ? 0.33 : 0.6, t, c ? 0.05 : d / 3);
  try { (BLD === 'b' ? arrB : BLD === 'c' ? arrC : arrA)(t, n, d, u, last, b.gap); if (last) { const e = t + Math.max(0.1, d - BREATH5); trembleCut(e); breathe(e, t + d); } } finally { G4 = 1; OUT4 = null; }
}
function hit5(kind, n, o) {
  const t = begin(); if (t == null) return; o = o || {}; const b = st5(), last = !!o.last, kd = kindOf(kind), had = b.n === n && t - b.la < 3, tNA = had ? b.la + b.gap : t + Math.max(0.5, b.gap * 0.91) - b.d, tNH = tNA + b.d;
  if (o.of) b.of = o.of | 0; const u = u5(n, b.of);
  const c = BLD === 'c'; if (c) { duck(t, 0.32, 0.5, 0.2); if (last) { const bp = SB.breath.gain; bp.cancelScheduledValues(t); bp.setValueAtTime(0.1, t); bp.setValueAtTime(0.1, t + 0.1); bp.linearRampToValueAtTime(0.7, t + 0.3); bp.linearRampToValueAtTime(1, t + 0.6); } } else duck(t, 0.3, 0.5, 0.06); /* c's last hit goes past the bus (as OVERREACT's strike does), so the bus opens behind it */ G4 = c ? (last ? C5LAST : C5HIT * dB(-C5RISE * (1 - u))) : last ? B5LAST : B5HIT * dB(-B5RISE * (1 - u)); OUT4 = shelf5(c ? 1 + 8 * u : 2 + 9 * u);
  try { (BLD === 'b' ? hitB : BLD === 'c' ? hitC : hitA)(t, n, u, last, tNA, tNH);
    // the kind keeps its own voice on top of the drums, climbing D, E, G, A
    if (c) { G4 *= 0.38; const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.5; lp.frequency.value = 700 * Math.pow(2, 3.4 * u); lp.connect(shelf5((KSH4[kd] || 0) + 2)); OUT4 = lp; }   // the kind's top opens with the build, so the step sets the brightness
    else { G4 *= 0.6; OUT4 = shelf5((KSH4[kd] || 0) + 2 + 6 * u); } (K4[kd] || K4.lactol)(t, mel5(n) + 12, 0.7 * (KLV4[kd] || 1), 0);
  } finally { G4 = 1; OUT4 = null; }
}
// OVERREACT with the drums on it: weight on the strike; through the swell a roll on A, a snare roll, a cymbal backwards and brass
// opening on A; on the resolve the whole section lands on D, then lifts: A below, then D an octave up; glass runs up and coins down
function over6(t0, o) {
  RSV5 = BLD === 'c' ? 0.45 : 1; try { over5(t0, o); } finally { RSV5 = 1; } G4 = 1; OUT4 = null;
  const t = t0 + 0.09, sw = t + 0.55, L = 1.35, rs = sw + L + 0.04, th = third4(), DL = x => Object.assign({ dir: 'lo' }, x), D = x => Object.assign({ dir: true }, x), B = BLD === 'b';
  R5('boom', NO, t, 1.3, DL({})); R5('bdrum', NO, t, 1.0, DL({})); R5('timp', 38, t, 0.9, DL({ rev: 0.3 })); R5('tam', NO, t, 0.8, D({ rev: 0.4 })); if (B) R5('taiko', 26, t, 1.0, DL({ rev: 0.3 }));
  roll5(B ? 'taiko' : 'timp', B ? 33 : 45, sw, rs - 0.03, 0.08, 0.9, 11, 18, { rev: 0.35, dur: 0.5, r: 0.2 }); roll5('snr', NO, sw + L * 0.4, rs - 0.03, 0.03, 0.5, 15, 22, { rev: 0.25 }); rcym5(sw, rs, 0.8, { fin: 0.1 });
  [45, 52, 57, 62, 64].forEach((q, i) => R5('horn', q, sw, 0.3, { dur: L, a: L * 0.97, ax: true, cut: true, pan: (i - 2) * 0.3, wide: 0.3, rev: 0.4, lp: 600, lp1: 6000, lpt: L }));
  const Cc = BLD === 'c', rk = Cc ? 0.45 : 1;   // c: the resolve gives way to the lift
  R5('timp', 38, rs, 1.1 * rk, { rev: 0.4 }); R5('bdrum', NO, rs, 1.0 * rk, { rev: 0.3 }); R5('tam', NO, rs, 0.5 * rk, { rev: 0.4 }); R5('cym', NO, rs, 0.8 * rk, { pan: 0.3, rev: 0.4 }); if (B) { R5('taiko', 26, rs, 1.0, { rev: 0.35 }); R5('taiko', 38, rs, 0.7, { pan: -0.5, rev: 0.35 }); }
  [38, 45, 50, 57, 62, th ? 62 + th : 64, 69].forEach((q, i) => R5('horn', q, rs, 0.5 * rk, { dur: 2.4, a: 0.03, r: 2.6, pan: (i - 3) * 0.25, wide: 0.3, rev: 0.45, lp: 6500, lp1: 2200, lpt: 4 }));
  R5('timp', 45, rs + 0.46, 0.5, { rev: 0.4 }); R5('horn', 74, rs + 0.46, 0.7, { dur: 1.6, a: 0.03, r: 2, rev: 0.45, wide: 0.3 });
  R5('timp', 38, rs + 0.92, 0.9, { rev: 0.4 }); R5('bdrum', NO, rs + 0.92, 0.7, { rev: 0.3 }); R5('pad', 81, rs + 0.92, 0.7, { dur: 1.4, a: 0.03, r: 2.4, rev: 0.5, wide: 0.4 }); R5('cym', NO, rs + 0.92, 0.5, { pan: -0.3, rev: 0.4, hp: 2000 });
  if (Cc) { const tl = rs + 0.92, dk = SB.duck.gain; dk.cancelScheduledValues(rs - 0.02); dk.setValueAtTime(0.5, rs - 0.02); dk.setValueAtTime(0.5, tl - 0.04); dk.linearRampToValueAtTime(1, tl); { const bp = SB.breath.gain; bp.setValueAtTime(0.5, rs - 0.012); bp.setValueAtTime(0.5, tl - 0.4); bp.linearRampToValueAtTime(1, tl - 0.01); }   // the resolve lands under the bus's ceiling (the whole bus half down, the soundtrack half down again) and everything is let go on the lift   // the lift: a cymbal backwards and a snare roll up to it, then a boom, a crash and the brass and pads an octave higher; then the cascade
    rcym5(rs + 0.12, tl, 0.6, { fin: 0.1 }); roll5('snr', NO, rs + 0.5, tl, 0.05, 0.4, 16, 24, { rev: 0.3 });
    R5('boomc', NO, tl, 1.0, { rev: 0.5 }); R5('cym', NO, tl, 1.2, { pan: 0.3, rev: 0.4 }); R5('snr', NO, tl, 0.9, { rev: 0.5 }); R5('tam', NO, tl, 0.7, { rev: 0.4 }); R5('timp', 38, tl, 1.0, { rev: 0.4 });
    [38, 50, 57, 62, 69, 74, th ? 74 + th : 76, 81, 86].forEach((q, i) => R5(q < 72 ? 'horn' : 'pad', q, tl, 1.3, { dur: 1.6, a: 0.02, r: 2.2, pan: (i - 4) * 0.2, wide: 0.3, rev: 0.5, lp: 8000, lp1: 2500, lpt: 3 }));
    for (let i = 0; i < 16; i++) R5(i % 2 ? 'coin' : 'glass', safeUp((i % 2 ? 105 : 96) - i), tl + 0.12 + i * 0.045, 0.3, { pan: (0.5 - i / 15) * 1.5, rev: 0.45 }); }
  for (let i = 0; i < 12; i++) R5('glass', safeUp(74 + i * 2), rs + 0.02 + i * 0.028, 0.32, { pan: (i / 11 - 0.5) * 1.6, rev: 0.45 });
  for (let i = 0; i < 8; i++) R5('coin', safeUp(93 + i), rs + 0.94 + i * 0.03, 0.3, { pan: (0.5 - i / 7) * 1.4, rev: 0.4 });
}
// what a call does while a build is chosen (true = handled here)
const B5 = {
  reflex: a => { hit5(a[0], Math.max(1, Math.round(a[1]) || 1), a[2]); return true; },
  ring: a => { hit5('lactol', Math.max(1, Math.round(a[0]) || 1), {}); return true; },
  windup: a => { arrow5(Math.max(1, a[0] | 0), Math.max(60, +a[1] || 400), { last: !!a[2] }); return true; },
  flag: a => { if ((a[0] | 0) !== 4) return false; const t = begin(); if (t == null) return true; try { over6(t, a[1]); } finally { G4 = 1; OUT4 = null; } return true; }
};
try { const q = root.location && root.location.search ? new URLSearchParams(root.location.search).get('build') : null; if (q !== null && /^([abc]|0|off|)$/.test(q)) BLD = /^[abc]$/.test(q) ? q : ''; else { const sv = root.localStorage.getItem(BKEY); if (sv !== null && /^[abc]?$/.test(sv)) BLD = sv; } } catch (e) { /* default */ }

const DARK = [null, darkArcade(1), darkArcade(2), darkArcade(3)], OLD2 = STYLE[2];
const cur = () => STY === 2 ? (ARCV ? DARK[ARCV] : OLD2) : STYLE[STY];
// a styled call: the style's own voice, at the time the call was made
function sty(name, args) {
  const S = cur(); if (!S) return false;
  if ((name === 'reflex' || name === 'ring') && S.step) { S.step(name === 'ring' ? 'lactol' : args[0], Math.max(1, Math.round(name === 'ring' ? args[0] : args[1]) || 1), name === 'ring' ? {} : args[2]); return true; }
  if (name === 'reflex' || name === 'ring') { stepLayers(S, name === 'ring' ? 'lactol' : args[0], name === 'ring' ? args[0] : args[1], name === 'ring' ? {} : args[2]); return true; }
  if (name === 'ambience') { ambience(args[0], args[1]); return true; }
  if (STY === 4 && ACTS[name] && !ACTS4[name]) return true;
  if (STY === 4 && ACTS4[name]) { const t = begin(); if (t == null) return true; G4 = ACT4; try { ACTS4[name](t, args[0]); } finally { G4 = 1; } return true; }
  if (ACTS[name]) { const t = begin(); if (t == null) return true; G4 = ACT4; try { ACTS[name](STY === 2 && ARCV ? PAL.d : PAL[STY], t, args[0]); } finally { G4 = 1; } return true; }
  const fn = S[name]; if (!fn) return false; const t = begin(); if (t == null) return true;
  if (name === 'snap') { fn(t, Math.max(1, args[0] | 0), args[1] || 1); return true; }
  if (name === 'flag') { const k = clamp(args[0] | 0, 1, 4); fn(t, k, args[1]); if (k === 4) deepLand(t + (STY === 2 ? 0.2 : 0), true); return true; }
  if (name === 'queue' || name === 'strike') { fn(t, clamp(args[0] | 0, 0, 2), args[1] || 1); return true; }
  if (name === 'tick') { fn(t, args[0] || 0); return true; }
  if (name === 'swish') { fn(t, Math.max(0.1, args[0] || 0.2)); return true; }
  if (name === 'drone') { fn(t, clamp(args[0] || 0, 0, 1), args[1] | 0, Math.max(0.12, args[2] || 0.3), args[3]); return true; }
  if (name === 'draw') { fn(t, args[0] || 1, Math.max(0.06, args[1] || 0.1)); return true; }
  if (name === 'windup') { fn(t, Math.max(1, args[0] | 0), Math.max(60, +args[1] || 300), !!args[2]); return true; }
  fn(t, args[0], args[1]); return true;
}

const fx = {
  // -- settings --
  setMuted(v) { muted = !!v; persist(); applyLevel(); }, isMuted() { return muted; },
  setVolume(v) { v = +v; if (isFinite(v)) volume = Math.max(0, Math.min(1, v)); persist(); applyLevel(); }, getVolume() { return volume; },
  startMusic, setMusic(v) { music = !!v; }, musicOn() { return music; }, setIntensity(x) { mlevel = Math.max(0, Math.min(1, x)); },
  resume() { ac(); },

  // -- foundation set --
  // a soft click per queued reaction, a semitone higher each (i 0 to 2)
  queue(i) {
    i = Math.max(0, Math.min(2, i | 0)); const f = 620 * Math.pow(2, i / 12);
    tone({ freq: f, freqEnd: f * 0.8, dur: 0.05, gain: 0.4, lv: LADDER.ui, type: 'triangle', attack: 0.001 });
    hiss({ freq: 3200, q: 2, dur: 0.02, gain: 0.3, lv: LADDER.ui });
  },
  // the line fires: one low wood knock
  fire() {
    tone({ freq: 190, freqEnd: 82, dur: 0.12, gain: 0.5, lv: LADDER.ui * 4, attack: 0.001 });
    tone({ freq: 410, freqEnd: 240, dur: 0.05, gain: 0.12, lv: LADDER.ui * 4, attack: 0.001 });
    hiss({ freq: 900, q: 3, dur: 0.03, gain: 0.25, lv: LADDER.ui * 4, attack: 0.001 });
  },
  // ring n of a row (1 and up): one pentatonic step higher per ring, no cap; short enough to stay clean 130 ms apart
  ring(n) {
    n = Math.max(1, Math.round(n) || 1); const r = ringFreq(n), soft = 1 / (1 + r.oct * 0.3), dur = Math.max(0.26, 0.55 - n * 0.02);
    bell(r.f, 0.34 * soft, dur, LADDER.ring);
  },
  // the four words: 1 stable, 2 unstable, 3 volatile, 4 overreact
  flag(k) {
    k = Math.max(1, Math.min(4, k | 0));
    if (k === 1) bell(220, 0.5, 1.2, LADDER.flag);
    else if (k === 2) { bell(330, 0.5, 1.1, LADDER.flag); hiss({ freq: 1800, q: 0.8, dur: 0.7, gain: 0.07, lv: LADDER.flag, attack: 0.4 }); }
    else if (k === 3) {
      tone({ freq: 110, dur: 1.0, gain: 0.3, lv: LADDER.flag, type: 'sawtooth', detune: -9, attack: 0.04, lp: 250, lpEnd: 3600, lpq: 3 });
      tone({ freq: 110, dur: 1.0, gain: 0.3, lv: LADDER.flag, type: 'sawtooth', detune: 9, attack: 0.04, lp: 250, lpEnd: 3600, lpq: 3 });
      for (let i = 0; i < 6; i++) hiss({ freq: 2500 + Math.random() * 3500, q: 4, dur: 0.02, gain: 0.12, lv: LADDER.flag, delay: 0.25 + i * 0.07 + Math.random() * 0.04, attack: 0.001 });
    } else {
      const L = LADDER.over;
      tone({ freq: 90, freqEnd: 38, dur: 1.4, gain: 0.5, lv: L, attack: 0.004 });
      hiss({ freq: 5200, q: 0.5, type: 'highpass', dur: 1.6, gain: 0.22, lv: L, attack: 0.004 });
      hiss({ freq: 400, freqEnd: 90, q: 0.8, type: 'lowpass', dur: 0.9, gain: 0.4, lv: L, attack: 0.004 });
      chord([130.81, 138.59, 164.81, 196, 233.08, 293.66], 2.8, 0.1, L, 'triangle', 0.12);
      chord([65.41, 98], 2.8, 0.14, L, 'sine', 0.12);
    }
  },
  // a reaction that did nothing: dull muted thud, no buzz
  wasted() {
    tone({ freq: 150, freqEnd: 52, dur: 0.16, gain: 0.45, lv: LADDER.ui * 3.5, attack: 0.002 });
    hiss({ type: 'lowpass', freq: 420, freqEnd: 140, q: 0.7, dur: 0.12, gain: 0.35, lv: LADDER.ui * 3.5, attack: 0.002 });
  },
  // one paper sweep
  pageTurn() { hiss({ freq: 600, freqEnd: 3000, q: 1.2, dur: 0.2, gain: 0.5, lv: LADDER.ui, attack: 0.05 }); },
  // round lost: a slow falling minor third, then silence
  lost() {
    const o = { type: 'triangle', lv: LADDER.flag, lp: 1100, lpEnd: 350, lpq: 0.7, attack: 0.03 };
    tone(Object.assign({ freq: 392, freqEnd: 380, dur: 0.7, gain: 0.34 }, o));
    tone(Object.assign({ freq: 311.13, freqEnd: 300, dur: 1.2, gain: 0.34, delay: 0.6 }, o));
  },

  // -- the moment of play (feel.js). Every voice is self-contained (no held state), so a logged timeline renders offline --
  // a thrown reagent lands: a wood knock that gets heavier across the three (i 0 to 2); the third has a low body under it
  strike(i, w) {
    i = Math.max(0, Math.min(2, i | 0)); w = w || 1; const f = [190, 213, 240][i], L = LADDER.ui * 2.2 * [1, 1.25, 1.6][i] * w;
    tone({ freq: f, freqEnd: f * 0.45, dur: 0.14, gain: 0.5, lv: L, attack: 0.001 });
    tone({ freq: f * 2.2, freqEnd: f * 1.3, dur: 0.05, gain: 0.14, lv: L, attack: 0.001 });
    hiss({ freq: 1100, q: 3, dur: 0.03, gain: 0.3, lv: L, attack: 0.001 });
    if (i === 2) tone({ freq: 95, freqEnd: 45, dur: 0.3, gain: 0.5, lv: L, attack: 0.002 });
  },
  // the molecule takes over: one low bell where the player's part ends
  handoff() { bell(130.81, 0.32, 0.9, LADDER.ring); tone({ freq: 65.41, dur: 0.7, gain: 0.18, lv: LADDER.ring, attack: 0.01 }); },
  // a reflex step lands. Each kind has its own color: a ring closing is a bell, a water loss a hollow wood, a C=C shift a
  // plucked string. n climbs the pentatonic scale. o: bell (level), fast (short decay), echo (a small room), last
  reflex(kind, n, o) {
    o = o || {}; n = Math.max(1, Math.round(n) || 1); const r = ringFreq(n), soft = 1 / (1 + r.oct * 0.25), lv = LADDER.ring * (o.bell || 1) * Math.min(1, 0.45 + 0.06 * n) * (o.last ? 1.6 : 1);
    const dur = o.fast ? 0.14 : o.last ? 1.4 : Math.max(0.3, 0.6 - n * 0.02), f = r.f * (1 + (Math.random() - 0.5) * 0.0093);
    const voice = (dl, g) => {
      if (kind === 'weld' || kind === 'dehydrate' || kind === 'ether') { tone({ freq: f * 0.5, freqEnd: f * 0.42, dur: dur * 0.6, gain: 0.4 * soft * g, lv, attack: 0.001, delay: dl, type: 'triangle', lp: 900 }); hiss({ freq: f * 1.5, q: 6, dur: 0.06, gain: 0.25 * g, lv, delay: dl, attack: 0.001 }); }
      else if (kind === 'snap6' || kind === 'shift' || kind === 'snap') { tone({ freq: f, dur: dur * 0.8, gain: 0.32 * soft * g, lv, type: 'sawtooth', attack: 0.001, delay: dl, lp: f * 6, lpEnd: f * 1.1, lpq: 2 }); tone({ freq: f * 2, dur: dur * 0.3, gain: 0.08 * g, lv, attack: 0.001, delay: dl }); }
      else { tone({ freq: f, dur, gain: 0.36 * soft * g, lv, attack: 0.002, delay: dl }); tone({ freq: f * 2.76, dur: dur * 0.45, gain: 0.08 * soft * g, lv, attack: 0.002, delay: dl }); tone({ freq: f * 5.4, dur: 0.05, gain: 0.05 * g, lv, attack: 0.001, delay: dl }); }
    };
    voice(0, 1); if (o.echo) { voice(0.09, 0.25); voice(0.18, 0.07); }
    if (o.last) { tone({ freq: f / 2, dur: 1.6, gain: 0.22, lv, attack: 0.004 }); tone({ freq: f * 1.5, dur: 1.2, gain: 0.08, lv, attack: 0.004 }); }
  },
  // a short low body hit under the bell: a sine sweep from 160 to 60 Hz and a click, heavier with the step and the weight
  snap(n, w) {
    n = Math.max(1, n | 0); w = w || 1; const lv = LADDER.ring * Math.min(1.0, 0.18 + 0.07 * n) * w, cut = 400 + 120 * n;
    tone({ freq: 160, freqEnd: 58, dur: 0.11, gain: 0.55, lv, attack: 0.001, lp: Math.min(4000, cut) });
    tone({ freq: 2000, freqEnd: 1200, dur: 0.012, gain: 0.08, lv, attack: 0.0005, type: 'square' });
    hiss({ type: 'lowpass', freq: Math.min(3000, cut), q: 0.7, dur: 0.07, gain: 0.2, lv, attack: 0.001 });
  },
  // the last hit of an overreaction: the floor of the page
  boom(m) { const L = LADDER.over * 0.6; tone({ freq: 70, freqEnd: 34, dur: 0.9, gain: 0.55, lv: L, attack: 0.002 }); tone({ freq: 140, freqEnd: 60, dur: 0.25, gain: 0.3, lv: L, attack: 0.001 }); hiss({ type: 'lowpass', freq: 900, freqEnd: 120, q: 0.6, dur: 0.5, gain: 0.35, lv: L, attack: 0.002 }); },
  // one held drone segment: two sines a fifth apart (C2 and G2, detuned) with the octave and fifth above, for dur seconds.
  // level 0 to 1 is -24 dB to -8 dB; step moves it up the pentatonic scale; low 1 puts more weight in the lowest pair
  drone(level, step, dur, low) {
    const db = -24 + 16 * Math.max(0, Math.min(1, level || 0)), g = Math.pow(10, db / 20), semis = PENTA[(step | 0) % 5] + 12 * Math.floor((step | 0) / 5), base = 65.41 * Math.pow(2, semis / 12), d = Math.max(0.12, dur || 0.3), L = LADDER.ring * 3;
    const v = (f, gg, det) => tone({ freq: f, dur: d + 0.06, gain: gg, lv: L, attack: Math.min(0.06, d * 0.3), detune: det, lp: 1400 });
    v(base, g * (low ? 1.2 : 0.9), 6); v(base, g * (low ? 1.2 : 0.9), -6); v(base * 1.5, g * 0.7, 5); v(base * 2, g * 0.55, -4); v(base * 3, g * 0.3, 3);
  },
  // the wind-up of a late step: a quiet swell of band-passed noise as long as the wind-up
  draw(n, dur) { const d = Math.max(0.06, dur || 0.1); hiss({ freq: 700 + 60 * n, freqEnd: 1800 + 80 * n, q: 2, dur: d, gain: 0.05, lv: LADDER.ui, attack: d * 0.9 }); },
  // the yield counting: one dry tick, pitch varied by plus or minus 30 cents
  tick(n) { const f = 2600 * Math.pow(2, ((Math.random() - 0.5) * 60 + Math.min(12, n || 0) * 8) / 1200); tone({ freq: f, freqEnd: f * 0.7, dur: 0.018, gain: 0.07, lv: LADDER.ui, type: 'square', attack: 0.0005, lp: 5000 }); },
  // a camera move: low noise along with it
  swish(dur) { const d = Math.max(0.1, dur || 0.2); hiss({ freq: 300, freqEnd: 900, q: 0.8, dur: d, gain: 0.12, lv: LADDER.ui, attack: d * 0.5 }); },
  // the overreact flag passed before the end: it fills quietly; the word and its sound wait for the last hit
  flagSoft(k) { bell(330, 0.22, 0.6, LADDER.flag * 0.5); },
  // runoff lands where it is kept: a small glass clink an octave above the bell of that step; mass adds a low thunk
  clink(n, m) { const f = ringFreq(Math.max(1, n | 0)).f * 2; tone({ freq: f, dur: 0.12, gain: 0.16, lv: LADDER.ui, attack: 0.001 }); tone({ freq: f * 2.4, dur: 0.06, gain: 0.06, lv: LADDER.ui, attack: 0.001 }); if (m === 1) tone({ freq: 120, freqEnd: 70, dur: 0.08, gain: 0.25, lv: LADDER.ui, attack: 0.001 }); },

  // -- new in sound builder 2 (docs/SOUND2.md) --
  // the style: style() reads it, style(n) sets and saves it (0 today, 1 bench, 2 arcade, 3 boiler). setStyle/getStyle are the same,
  // under names a recorder that wraps every call leaves alone
  style(n) { if (n === undefined) return STY; STY = cl3(n); if (STY === 4) { try { warm4(); } catch (e) { /* made on first use instead */ } } try { root.localStorage.setItem(SKEY, String(STY)); } catch (e) { /* storage blocked */ } return STY; },
  setStyle(n) { return fx.style(n); }, getStyle() { return STY; }, styleName(n) { return SNAMES[n === undefined ? STY : cl3(n)]; }, STYLES: SNAMES,
  // the wind-up of a reflex step, called when the step begins: n the step, ms the time to its hit, last true for the last step.
  // Before an ordinary step: a short pickup into the hit. Before the last: a riser that stops 170 ms before the hit, and the whole
  // mix held near silence until the hit (the held breath). Today's set (style 0) plays nothing here.
  windup(n, ms, last) { },
  // the deep layer: deep() reads it, deep(n) sets and saves it (0 off, 1 drone, 2 chant, 3 engine); setDeep/getDeep the same
  deep(n) { if (n === undefined) return DEEP; DEEP = clamp(Math.round(+n) || 0, 0, 3); try { root.localStorage.setItem(DKEY, String(DEEP)); } catch (e) { /* storage blocked */ } return DEEP; },
  setDeep(n) { return fx.deep(n); }, getDeep() { return DEEP; },
  // the arcade variant: arcade() reads it, arcade('a' | 'b' | 'c' | 'old') sets and saves it; setArcade/getArcade the same
  arcade(v) { if (v === undefined) return AVAR[ARCV]; const i = AVAR.indexOf(String(v)); if (i >= 0) ARCV = i; try { root.localStorage.setItem(AKEY, AVAR[ARCV]); } catch (e) { /* storage blocked */ } return AVAR[ARCV]; },
  setArcade(v) { return fx.arcade(v); }, getArcade() { return AVAR[ARCV]; },
  // intensity carried across the round, 0 to 1 (style 4): the next chain starts that far up its build (level and layers). intensity() reads it
  intensity(v) { if (v === undefined) return INT4; INT4 = clamp(+v || 0, 0, 1); return INT4; },
  // the round, 1 to 9: round() reads it, round(n) sets it. Style 4 plays the same sounds more unhinged the deeper the run (ruling AM);
  // the other styles ignore it. setRound/getRound are the same, under names a recorder leaves alone
  round(n) { if (n === undefined) return MAD; MAD = clamp(Math.round(+n) || 1, 1, 9); return MAD; },
  // the tremble (style 4, ruling AO): tremble(level 0..1) once the round's target is passed: glass humming and rattling on the bench,
  // more of it as level rises; tremble(0) lets it die. The held breath before the last hit and before OVERREACT cuts it dead.
  // dur (seconds, optional) writes that far ahead in one go (offline renders); live it keeps itself going until told otherwise
  tremble(level, dur) { if (STY !== 4) return 0; try { return tremble5(level, dur); } catch (e) { if (ERRS.length < 20) ERRS.push('tremble: ' + (e && e.stack || e)); return 0; } },
  setRound(n) { return fx.round(n); }, getRound() { return MAD; },
  // test hooks for style 4: one kind's voice alone at step n; one made instrument alone
  _kind(kind, n) { const t = begin(); if (t == null) return; n = Math.max(1, n | 0); G4 = CHAIN4; try { const kd = kindOf(kind); OUT4 = SHK === null ? null : shelf5(SHK === true ? (KSH4[kd] || 0) : SHK); (K4[kd] || K4.lactol)(t, mel5(n), 1.25 * (SHK === null ? 1 : (KLV4[kd] || 1)), 0, n); } finally { G4 = 1; OUT4 = null; } },
  _raw(v) { SHK = v ? null : true; },
  _inst(i, m, g, x) { const t = begin(); if (t == null) return; L4(Object.assign({ i, m, t, g: g || 0.5 }, x || {})); },
  // make style 4's instruments ahead of time, in small slices (style(4) does this itself); returns how many are left to make
  warm(sync) { return warm4(sync); },
  // test hook: what the bank has made so far (count, milliseconds of work, bytes)
  _mad() { return Object.assign({ round: MAD }, MST); },
  _lab() { return { n: LAB.GEN.n, ms: LAB.GEN.ms, bytes: ABYTES.n, keys: Object.keys(ABUF) }; },
  // the rest of the game (each has a voice in every style; style 0 falls back to the nearest old call)
  title() { fx.fanfare(); }, runStart() { fx.fanfare(); }, shopOpen() { fx.click(); }, buy() { fx.good(); }, cantBuy() { fx.bad(); }, hover() { }, pick() { fx.stamp(); },
  redraw() { fx.feed(); }, roundWon() { fx.quota(); }, runWon() { fx.fanfare(); }, runLost() { fx.lost(); }, unlock() { fx.over(); }, finding() { fx.good(); },
  creature() { fx.squish(); }, instrument() { fx.stamp(); },
  // the quiet bed under the screens between reactions: ambience('title' | 'bench' | 'shop' | 'pick'), ambience(null) fades it out
  ambience(kind, dur) { },
  // gold earned: n coins (today's set: a small two-note chime)
  gold(n) { tone({ freq: 1568, dur: 0.08, gain: 0.12, lv: LADDER.ui, attack: 0.001 }); tone({ freq: 2093, dur: 0.3, gain: 0.12, lv: LADDER.ui, attack: 0.001, delay: 0.07 }); },

  // -- the old set, kept by name and signature, now on the bus --
  click() { hiss({ freq: 2600, q: 2, dur: 0.035, gain: 0.12, lv: LADDER.ui }); tone({ freq: 180, freqEnd: 90, dur: 0.05, gain: 0.07, lv: LADDER.ui }); },
  feed() { for (let i = 0; i < 3; i++) hiss({ freq: 900 + i * 350, q: 0.9, dur: 0.04, gain: 0.07, lv: LADDER.ui, delay: i * 0.035 }); },
  pen(ms) { const n = Math.max(3, Math.round(ms / 70)); for (let i = 0; i < n; i++) hiss({ freq: 3400 + Math.random() * 1600, q: 3, dur: 0.06, gain: 0.03, lv: LADDER.ui, delay: i * 0.07 }); },
  bond() { tone({ freq: 330, freqEnd: 440, dur: 0.07, gain: 0.07, type: 'triangle', lv: LADDER.ui }); hiss({ freq: 1800, q: 2, dur: 0.03, gain: 0.07, lv: LADDER.ui }); },
  stamp() { tone({ freq: 110, freqEnd: 48, dur: 0.22, gain: 0.35, lv: LADDER.ring }); hiss({ freq: 500, q: 0.7, dur: 0.14, gain: 0.25, lv: LADDER.ring }); hiss({ freq: 3000, q: 1, dur: 0.04, gain: 0.12, lv: LADDER.ring }); },
  good() { [392, 494, 587].forEach((f, i) => tone({ freq: f, dur: 0.22, gain: 0.07, delay: 0.1 + i * 0.09, type: 'triangle', lv: LADDER.ring })); },
  lock(i) { const f = 330 * Math.pow(2, Math.min(i, 12) / 6); tone({ freq: f, dur: 0.2, gain: 0.06, type: 'triangle', lv: LADDER.ring }); tone({ freq: f * 2, dur: 0.12, gain: 0.025, delay: 0.02, lv: LADDER.ring }); },
  fanfare() { tone({ freq: 90, freqEnd: 38, dur: 0.55, gain: 0.4, lv: LADDER.ring }); [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.55, gain: 0.07, delay: 0.1 + i * 0.07, type: 'triangle', lv: LADDER.ring })); hiss({ freq: 5000, q: 0.6, dur: 0.7, gain: 0.08, delay: 0.1, attack: 0.3, lv: LADDER.ring }); },
  // the score has passed the quota
  quota() { tone({ freq: 80, freqEnd: 40, dur: 0.45, gain: 0.38, lv: LADDER.flag }); [523, 784, 1047].forEach((f, i) => { tone({ freq: f, dur: 0.6, gain: 0.045, delay: i * 0.07, type: 'square', lv: LADDER.flag }); tone({ freq: f * 1.006, dur: 0.6, gain: 0.06, delay: i * 0.07, lv: LADDER.flag }); }); },
  over() { [784, 1047, 1319, 1568].forEach((f, i) => tone({ freq: f, dur: 0.4, gain: 0.04, delay: i * 0.05, type: 'square', lv: LADDER.flag })); hiss({ freq: 6000, q: 0.6, dur: 0.5, gain: 0.07, attack: 0.2, lv: LADDER.flag }); },
  fuse() { tone({ freq: 180, freqEnd: 720, dur: 0.28, gain: 0.09, type: 'sawtooth', lv: LADDER.ring }); hiss({ freq: 3200, q: 1.5, dur: 0.3, gain: 0.05, lv: LADDER.ring }); },
  chain(i) { const f = 440 * Math.pow(2, Math.min(i, 14) / 7); tone({ freq: f, dur: 0.09, gain: 0.07, type: 'square', lv: LADDER.ring }); tone({ freq: f * 1.5, dur: 0.07, gain: 0.03, delay: 0.03, lv: LADDER.ring }); },
  squish() { [0, 0.11].forEach((d, i) => { hiss({ type: 'lowpass', freq: 1500 - i * 300, freqEnd: 260, q: 7, dur: 0.11, gain: 0.3, delay: d, attack: 0.012, lv: LADDER.ui }); tone({ freq: 250 - i * 40, freqEnd: 95, dur: 0.09, gain: 0.07, delay: d, lv: LADDER.ui }); hiss({ freq: 3600, q: 3, dur: 0.03, gain: 0.05, delay: d + 0.07, lv: LADDER.ui }); }); },
  drift() { tone({ freq: 520, freqEnd: 880, dur: 0.22, gain: 0.035, type: 'sine', lv: LADDER.ui }); hiss({ freq: 5200, q: 0.8, dur: 0.2, gain: 0.02, attack: 0.08, lv: LADDER.ui }); },
  bad() { tone({ freq: 140, freqEnd: 90, dur: 0.22, gain: 0.1, type: 'sawtooth', lv: LADDER.ui }); },

  // -- self-test: plays the whole foundation set from the console; returns the length in ms --
  demo() {
    ac(); let t = 0; const at = (ms, fn) => setTimeout(fn, ms);
    for (let i = 0; i < 3; i++) { const j = i; at(t, () => fx.queue(j)); t += 260; }
    at(t, () => fx.fire()); t += 900;
    for (let n = 1; n <= 8; n++) { const m = n; at(t, () => fx.ring(m)); t += Math.round(380 - (380 - 130) * (n - 1) / 7); }
    t += 900;
    for (let k = 1; k <= 4; k++) { const j = k; at(t, () => fx.flag(j)); t += k === 4 ? 3600 : 1700; }
    at(t, () => fx.wasted()); t += 900;
    at(t, () => fx.pageTurn()); t += 900;
    at(t, () => fx.lost()); t += 2200;
    return t;
  },

  // -- test hook: run one function into an OfflineAudioContext and resolve its samples (no speakers) --
  // opts (optional): style, deep, arcade, round (render with those without changing the saved ones), stereo (resolve { l, r } instead of one channel)
  _render(name, args, secs, opts) { return fx._renderTimeline([{ t: 0, n: name, a: args || [] }], secs, null, opts); },
  // test hook: a whole logged timeline [{ t: ms, n: name, a: args }] rendered through one bus, as the speakers would
  // have heard it. fns: the functions to call by name (a recorder that logged the calls passes the originals)
  _renderTimeline(events, secs, fns, opts) {
    const OC = root.OfflineAudioContext || root.webkitOfflineAudioContext; if (!OC) return Promise.reject(new Error('no OfflineAudioContext'));
    opts = opts || {}; const off = new OC(2, Math.ceil(44100 * secs), 44100), save = { ctx, master, noiseBuf, noiseFor, muted, STY, seed, DEEP, ARCV, MAD, INT4, BLD };
    Object.keys(MST).forEach(k => { MST[k] = 0; }); ctx = off; muted = false; master = buildBus(off); master.gain.value = 0.7 * volume; noiseFor = null; seed = 1; if (opts.style !== undefined) STY = cl3(opts.style); if (opts.deep !== undefined) DEEP = clamp(+opts.deep || 0, 0, 3); if (opts.intensity !== undefined) INT4 = clamp(+opts.intensity || 0, 0, 1); if (opts.round !== undefined) MAD = clamp(Math.round(+opts.round) || 1, 1, 9); if (opts.build !== undefined) BLD = /^[abc]$/.test(String(opts.build)) ? String(opts.build) : ''; if (opts.arcade !== undefined && AVAR.indexOf(String(opts.arcade)) >= 0) ARCV = AVAR.indexOf(String(opts.arcade));
    const evs = (events || []).slice().sort((a, b) => a.t - b.t);
    try { evs.forEach(e => { const f = (fns && fns[e.n]) || fx[e.n]; if (typeof f !== 'function' || e.t / 1000 >= secs) return; atOff = e.t / 1000; try { f.apply(fx, e.a || []); } catch (err) { /* one bad call does not stop the rest */ } }); }
    finally { atOff = 0; ctx = save.ctx; master = save.master; noiseBuf = save.noiseBuf; noiseFor = save.noiseFor; muted = save.muted; STY = save.STY; seed = save.seed; DEEP = save.DEEP; ARCV = save.ARCV; MAD = save.MAD; INT4 = save.INT4; BLD = save.BLD; }
    return off.startRendering().then(b => { const l = b.getChannelData(0), r = b.getChannelData(1); if (opts.stereo) return { l, r }; const m = new Float32Array(l.length); for (let i = 0; i < l.length; i++) m[i] = (l[i] + r[i]) / 2; return m; });
  }
};
// every call of the moment of play goes to the chosen style first; style 0 (or a style without that call) plays the set above
['queue', 'fire', 'ring', 'flag', 'wasted', 'pageTurn', 'lost', 'strike', 'handoff', 'reflex', 'snap', 'boom', 'drone', 'draw', 'tick', 'swish', 'flagSoft', 'clink', 'windup', 'gold', 'title', 'runStart', 'shopOpen', 'buy', 'cantBuy', 'hover', 'click', 'pick', 'redraw', 'roundWon', 'runWon', 'runLost', 'unlock', 'finding', 'creature', 'instrument', 'ambience'].forEach(k => {
  const f0 = fx[k] || function () {};
  fx[k] = function () { const a = Array.prototype.slice.call(arguments); if (BLD && STY === 4 && B5[k]) { try { if (B5[k](a)) return; } catch (e) { if (ERRS.length < 20) ERRS.push('build ' + k + ': ' + (e && e.stack || e)); G4 = 1; OUT4 = null; return; } } if (STY) { try { if (sty(k, a)) return; } catch (e) { if (ERRS.length < 20) ERRS.push(k + ': ' + (e && e.stack || e)); /* a broken voice never breaks play */ } } return f0.apply(fx, a); };
});
// the build-up options: build('a' | 'b' | 'c') chooses one, build('') goes back to style 4's own chain, build() reads it (also ?build=a)
fx.build = function (id) { if (id === undefined) return BLD; BLD = /^[abc]$/.test(String(id)) ? String(id) : ''; try { root.localStorage.setItem(BKEY, BLD); } catch (e) { /* storage blocked */ } return BLD; };
// an arrow starts being drawn for step n and its hit comes in ms: the anticipation. o: { last, of, gap } (see arrow5). With no build chosen it is style 4's wind-up.
fx.arrow = function (n, ms, o) { n = Math.max(1, Math.round(n) || 1); if (BLD && STY === 4) { try { arrow5(n, ms, o); } catch (e) { if (ERRS.length < 20) ERRS.push('arrow: ' + (e && e.stack || e)); G4 = 1; OUT4 = null; } return; } if (o && o.last) fx.windup(n, ms, true); };
const ERRS = []; fx._errs = () => ERRS.splice(0);   // test hook: what went wrong inside a styled call since the last look
AA.sfx = fx;
if (STY === 4 && root.setTimeout) root.setTimeout(() => { try { warm4(); } catch (e) { /* made on first use instead */ } }, 0);
})(typeof globalThis !== 'undefined' ? globalThis : window);
