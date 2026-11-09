(function (root) {
'use strict';
const AA = root.AA = root.AA || {};

// Lab sounds, all synthesized: no audio files. Paper feed, pen on paper, key clicks, stamp thump.
let ctx = null, muted = false, noiseBuf = null;
function ac() {
  if (!ctx) { try { ctx = new (root.AudioContext || root.webkitAudioContext)(); } catch (e) { ctx = null; } }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function noise(c) {
  if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  return noiseBuf;
}
// a short filtered burst of noise
function hiss(o) {
  const c = ac(); if (!c || muted) return;
  const t = c.currentTime + (o.delay || 0), src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  src.buffer = noise(c); src.loop = true; f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.freq, t); if (o.freqEnd) f.frequency.exponentialRampToValueAtTime(o.freqEnd, t + o.dur); f.Q.value = o.q || 1;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.gain, t + (o.attack || 0.004)); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  src.connect(f); f.connect(g); g.connect(c.destination); src.start(t, Math.random()); src.stop(t + o.dur + 0.05);
}
function tone(o) {
  const c = ac(); if (!c || muted) return;
  const t = c.currentTime + (o.delay || 0), osc = c.createOscillator(), g = c.createGain();
  osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.freq, t); if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, t + o.dur);
  g.gain.setValueAtTime(o.gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  osc.connect(g); g.connect(c.destination); osc.start(t); osc.stop(t + o.dur + 0.02);
}

// ---------- music: a sixteen-step loop scheduled a little ahead of the clock ----------
// Four layers come in as the intensity rises: bass, kick, hat, then an arpeggio.
const BPM = 112, STEP = 60 / BPM / 4, ROOTS = [55, 55, 65.41, 49], ARP = [0, 7, 12, 15, 12, 7, 19, 12];
let music = true, started = false, level = 0.15, nextT = 0, stepN = 0, bus = null, timer = null;
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
    const s = stepN % 16, root = ROOTS[(stepN >> 4) % 4], t = nextT;
    if (s % 4 === 0 || s === 10) mnote('triangle', root, t, 0.22, 0.2);
    if (level > 0.3 && s % 4 === 0) mnote('sine', 130, t, 0.14, 0.34, 42);
    if (level > 0.5 && s % 2 === 1) mhat(t, s % 4 === 3 ? 0.07 : 0.04);
    if (level > 0.7) mnote('square', root * 4 * Math.pow(2, ARP[s % 8] / 12), t, 0.1, 0.035);
    if (level > 0.9 && s % 4 === 2) mhat(t, 0.09);
    nextT += STEP; stepN++;
  }
}
function startMusic() {
  if (started) return;
  const c = ac(); if (!c) return;
  started = true; bus = c.createGain(); bus.gain.value = 0; bus.connect(c.destination);
  timer = setInterval(schedule, 60);
}

AA.sfx = {
  setMuted(v) { muted = !!v; }, isMuted() { return muted; },
  startMusic, setMusic(v) { music = !!v; }, musicOn() { return music; }, setIntensity(x) { level = Math.max(0, Math.min(1, x)); },
  click() { hiss({ freq: 2600, q: 2, dur: 0.035, gain: 0.12 }); tone({ freq: 180, freqEnd: 90, dur: 0.05, gain: 0.07 }); },
  feed() { for (let i = 0; i < 7; i++) hiss({ freq: 700 + i * 80, q: 0.9, dur: 0.07, gain: 0.05, delay: i * 0.07 }); },
  pen(ms) { const n = Math.max(3, Math.round(ms / 70)); for (let i = 0; i < n; i++) hiss({ freq: 3400 + Math.random() * 1600, q: 3, dur: 0.06, gain: 0.03, delay: i * 0.07 }); },
  bond() { tone({ freq: 330, freqEnd: 440, dur: 0.07, gain: 0.07, type: 'triangle' }); hiss({ freq: 1800, q: 2, dur: 0.03, gain: 0.07 }); },
  stamp() { tone({ freq: 110, freqEnd: 48, dur: 0.22, gain: 0.35 }); hiss({ freq: 500, q: 0.7, dur: 0.14, gain: 0.25 }); hiss({ freq: 3000, q: 1, dur: 0.04, gain: 0.12 }); },
  good() { [392, 494, 587].forEach((f, i) => tone({ freq: f, dur: 0.22, gain: 0.07, delay: 0.1 + i * 0.09, type: 'triangle' })); },
  lock(i) { const f = 330 * Math.pow(2, Math.min(i, 12) / 6); tone({ freq: f, dur: 0.2, gain: 0.06, type: 'triangle' }); tone({ freq: f * 2, dur: 0.12, gain: 0.025, delay: 0.02 }); },
  fanfare() { tone({ freq: 90, freqEnd: 38, dur: 0.55, gain: 0.4 }); [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.55, gain: 0.07, delay: 0.1 + i * 0.07, type: 'triangle' })); hiss({ freq: 5000, q: 0.6, dur: 0.7, gain: 0.08, delay: 0.1, attack: 0.3 }); },
  // the score has passed the quota; and passed twice the quota
  quota() { tone({ freq: 80, freqEnd: 40, dur: 0.45, gain: 0.38 }); [523, 784, 1047].forEach((f, i) => { tone({ freq: f, dur: 0.6, gain: 0.045, delay: i * 0.07, type: 'square' }); tone({ freq: f * 1.006, dur: 0.6, gain: 0.06, delay: i * 0.07 }); }); },
  over() { [784, 1047, 1319, 1568].forEach((f, i) => tone({ freq: f, dur: 0.4, gain: 0.04, delay: i * 0.05, type: 'square' })); hiss({ freq: 6000, q: 0.6, dur: 0.5, gain: 0.07, attack: 0.2 }); },
  bad() { tone({ freq: 140, freqEnd: 90, dur: 0.22, gain: 0.1, type: 'sawtooth' }); }
};
})(typeof globalThis !== 'undefined' ? globalThis : window);
