(function (root) {
'use strict';
const AA = root.AA = root.AA || {};

// Lab sounds, all synthesized in code: no audio files.
// Every voice goes to one master bus: master gain -> limiter (compressor) -> soft clip -> speakers.
// Loudness ladder (multiplies a voice's own gain): ui quiet, ring medium, flag loud, over loudest.
const LADDER = { ui: 0.5, ring: 0.8, flag: 1.1, over: 2.4 };
const KEY = 'overreact.sfx';
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
function applyLevel() { if (ctx && master) master.gain.setTargetAtTime(0.7 * level(), ctx.currentTime, 0.02); }
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
  _render(name, args, secs) {
    const OC = root.OfflineAudioContext || root.webkitOfflineAudioContext; if (!OC) return Promise.reject(new Error('no OfflineAudioContext'));
    const off = new OC(1, Math.ceil(44100 * secs), 44100), save = { ctx, master, noiseBuf, noiseFor, muted };
    ctx = off; muted = false; master = buildBus(off); master.gain.value = 0.7 * volume; noiseFor = null;
    try { fx[name].apply(fx, args || []); } finally { ctx = save.ctx; master = save.master; noiseBuf = save.noiseBuf; noiseFor = save.noiseFor; muted = save.muted; }
    return off.startRendering().then(b => b.getChannelData(0));
  },
  // test hook: a whole logged timeline [{ t: ms, n: name, a: args }] rendered through one bus, as the speakers would
  // have heard it. fns: the functions to call by name (a recorder that logged the calls passes the originals)
  _renderTimeline(events, secs, fns) {
    const OC = root.OfflineAudioContext || root.webkitOfflineAudioContext; if (!OC) return Promise.reject(new Error('no OfflineAudioContext'));
    const off = new OC(1, Math.ceil(44100 * secs), 44100), save = { ctx, master, noiseBuf, noiseFor, muted };
    ctx = off; muted = false; master = buildBus(off); master.gain.value = 0.7 * volume; noiseFor = null;
    try { (events || []).forEach(e => { const f = (fns && fns[e.n]) || fx[e.n]; if (typeof f !== 'function' || e.t / 1000 >= secs) return; atOff = e.t / 1000; try { f.apply(fx, e.a || []); } catch (err) { /* one bad call does not stop the rest */ } }); }
    finally { atOff = 0; ctx = save.ctx; master = save.master; noiseBuf = save.noiseBuf; noiseFor = save.noiseFor; muted = save.muted; }
    return off.startRendering().then(b => b.getChannelData(0));
  }
};
AA.sfx = fx;
})(typeof globalThis !== 'undefined' ? globalThis : window);
