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
// THE STYLES (docs/SOUND2.md). AA.sfx.style(0 | 1 | 2 | 3), or ?sfx=0..3 in the address; saved under overreact.sfx.style.
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
const SKEY = 'overreact.sfx.style', SNAMES = ['today', 'bench', 'arcade', 'boiler'], DEFAULT_STYLE = 2;
const cl3 = v => { v = Math.round(+v); return v >= 0 && v <= 3 ? v : DEFAULT_STYLE; };
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
  sb.lim = lim;
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
function duck(t, depth, rel) { const p = SB.duck.gain; p.setTargetAtTime(depth, t, 0.004); p.setTargetAtTime(1, t + 0.03, (rel || 0.2) / 3); }
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
const KALIAS = { ring: 'lactol', dry: 'enone', dehydrate: 'enone', flip: 'taut', snap: 'snap6', close: 'ether' };
const kindOf = k => KALIAS[k] || k || 'lactol';

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

// ===================== a step, built in layers that come in with the step number =====================
// thump on the beat; an offbeat from step 2; a second note of the chord from 4; sixteenths from 6; a bed from 7; the melody
// doubled from 9; a roll into the next step from 10. P is the guessed time to the next step.
function stepLayers(S, kind, n, o) {
  const t = begin(); if (t == null) return; o = o || {}; const last = !!o.last, P = clk(t, n), e = lvl(n) * Math.sqrt(clamp(o.bell || 1, 0.6, 1.6)), pan = (n % 2 ? -1 : 1) * 0.28;
  if (last) return S.finale(t, kindOf(kind), n, o);
  const ix = chordIx(n), m = S.mel(n), f = mf(m), kv = S.K[kindOf(kind)] || S.K.lactol, dur = o.fast ? 0.6 : 1;
  S.thump(t, (0.06 + 0.04 * Math.min(n, 12)) * Math.sqrt(clamp(o.bell || 1, 0.6, 1.6)), n); kv(t, f, 0.62 * e * (o.fast ? 0.85 : 1), pan); duck(t, 0.35, 0.22);
  if (o.echo) { kv(t + 0.11 * dur, f, 0.06 * e, -pan); }
  if (n >= 2) S.off(t + P / 2, e, n, -pan);
  if (n >= 3) S.bass(t, ix, P, e, n);
  if (n >= 4) S.harm(t, under(m, ix), e, -pan, n);
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
  2: { name: 'arcade', mel, K: AK,
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
  3: { name: 'boiler', mel: mel3, K: HK,
    thump: (t, g) => H.knock(t, g * 1.05),
    off: (t, e, n, p) => H.chuff(t, 0.18 * e, { pan: p, f: 1000 + 40 * n }),
    bass: (t, ix, P, e, n) => H.rumble(t, P, 0.05 + 0.012 * n),
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
// a styled call: the style's own voice, at the time the call was made
function sty(name, args) {
  const S = STYLE[STY]; if (!S) return false;
  if (name === 'reflex' || name === 'ring') { stepLayers(S, name === 'ring' ? 'lactol' : args[0], name === 'ring' ? args[0] : args[1], name === 'ring' ? {} : args[2]); return true; }
  const fn = S[name]; if (!fn) return false; const t = begin(); if (t == null) return true;
  if (name === 'snap') { fn(t, Math.max(1, args[0] | 0), args[1] || 1); return true; }
  if (name === 'flag') { fn(t, clamp(args[0] | 0, 1, 4)); return true; }
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
  style(n) { if (n === undefined) return STY; STY = cl3(n); try { root.localStorage.setItem(SKEY, String(STY)); } catch (e) { /* storage blocked */ } return STY; },
  setStyle(n) { return fx.style(n); }, getStyle() { return STY; }, styleName(n) { return SNAMES[n === undefined ? STY : cl3(n)]; }, STYLES: SNAMES,
  // the wind-up of a reflex step, called when the step begins: n the step, ms the time to its hit, last true for the last step.
  // Before an ordinary step: a short pickup into the hit. Before the last: a riser that stops 170 ms before the hit, and the whole
  // mix held near silence until the hit (the held breath). Today's set (style 0) plays nothing here.
  windup(n, ms, last) { },
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
  // opts (optional): style (render in that style without changing the saved one), stereo (resolve { l, r } instead of one channel)
  _render(name, args, secs, opts) { return fx._renderTimeline([{ t: 0, n: name, a: args || [] }], secs, null, opts); },
  // test hook: a whole logged timeline [{ t: ms, n: name, a: args }] rendered through one bus, as the speakers would
  // have heard it. fns: the functions to call by name (a recorder that logged the calls passes the originals)
  _renderTimeline(events, secs, fns, opts) {
    const OC = root.OfflineAudioContext || root.webkitOfflineAudioContext; if (!OC) return Promise.reject(new Error('no OfflineAudioContext'));
    opts = opts || {}; const off = new OC(2, Math.ceil(44100 * secs), 44100), save = { ctx, master, noiseBuf, noiseFor, muted, STY, seed };
    ctx = off; muted = false; master = buildBus(off); master.gain.value = 0.7 * volume; noiseFor = null; seed = 1; if (opts.style !== undefined) STY = cl3(opts.style);
    const evs = (events || []).slice().sort((a, b) => a.t - b.t);
    try { evs.forEach(e => { const f = (fns && fns[e.n]) || fx[e.n]; if (typeof f !== 'function' || e.t / 1000 >= secs) return; atOff = e.t / 1000; try { f.apply(fx, e.a || []); } catch (err) { /* one bad call does not stop the rest */ } }); }
    finally { atOff = 0; ctx = save.ctx; master = save.master; noiseBuf = save.noiseBuf; noiseFor = save.noiseFor; muted = save.muted; STY = save.STY; seed = save.seed; }
    return off.startRendering().then(b => { const l = b.getChannelData(0), r = b.getChannelData(1); if (opts.stereo) return { l, r }; const m = new Float32Array(l.length); for (let i = 0; i < l.length; i++) m[i] = (l[i] + r[i]) / 2; return m; });
  }
};
// every call of the moment of play goes to the chosen style first; style 0 (or a style without that call) plays the set above
['queue', 'fire', 'ring', 'flag', 'wasted', 'pageTurn', 'lost', 'strike', 'handoff', 'reflex', 'snap', 'boom', 'drone', 'draw', 'tick', 'swish', 'flagSoft', 'clink', 'windup', 'gold'].forEach(k => {
  const f0 = fx[k] || function () {};
  fx[k] = function () { const a = Array.prototype.slice.call(arguments); if (STY) { try { if (sty(k, a)) return; } catch (e) { /* a broken voice never breaks play */ } } return f0.apply(fx, a); };
});
AA.sfx = fx;
})(typeof globalThis !== 'undefined' ? globalThis : window);
