(function (root) {
'use strict';
const AA = root.AA = root.AA || {};

// ---------------------------------------------------------------------------------
// Profiles: each child gets a name, a picture and their own progress.
//   atlas-atoms-profiles   -> { profiles: [{id, name, avatar, created, named}], active }
//   atlas-atoms-p-<id>     -> that child's progress
//   atlas-atoms-device     -> settings that belong to the device (layout, sound, view...)
// Progress lives in this browser. Back up to a file to keep it safe or move it.
// ---------------------------------------------------------------------------------
const INDEX = 'atlas-atoms-profiles', DEVICE = 'atlas-atoms-device', LEGACY = 'atlas-atoms-v1';
const PROG = id => 'atlas-atoms-p-' + id;
const PROGRESS_KEYS = ['found', 'lessons', 'reacted', 'quiz', 'tries', 'labSeen', 'badges', 'lookups', 'lastBackup'];
const DEVICE_KEYS = ['layout', 'mute', 'voice', 'faces', 'mode', 'seenHelp'];
const AVATARS = ['🧑‍🔬', '🦊', '🐙', '🦉', '🐼', '🚀', '🐢', '🦄', '🐬', '🦖', '🌟', '🤖'];
const BAD_KEYS = ['__proto__', 'constructor', 'prototype'];

function memStore() { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; }
let store;
try { store = root.localStorage; store.getItem('atlas-test'); } catch (e) { store = memStore(); }
const read = (k, fb) => { try { const v = store.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } };
const write = (k, v) => { try { store.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

const isObj = o => !!o && typeof o === 'object' && !Array.isArray(o);
const num = v => typeof v === 'number' && isFinite(v);

function defaults() {
  return { found: {}, lessons: {}, reacted: {}, quiz: {}, tries: {}, labSeen: {}, badges: {}, lookups: 0, lastBackup: 0,
    mode: 'ball', faces: true, mute: false, voice: false, layout: 'auto', seenHelp: false };
}
// ---- anything read from storage or a backup file is checked before it is trusted ----
function cleanMap(o) {
  const out = {};
  if (!isObj(o)) return out;
  Object.keys(o).slice(0, 3000).forEach(k => { if (/^[\w-]{1,48}$/.test(k) && BAD_KEYS.indexOf(k) < 0 && num(o[k])) out[k] = o[k]; });
  return out;
}
function cleanProgress(p) {
  p = isObj(p) ? p : {};
  return { found: cleanMap(p.found), lessons: cleanMap(p.lessons), reacted: cleanMap(p.reacted), quiz: cleanMap(p.quiz), tries: cleanMap(p.tries),
    labSeen: cleanMap(p.labSeen), badges: cleanMap(p.badges), lookups: num(p.lookups) ? Math.max(0, Math.floor(p.lookups)) : 0, lastBackup: num(p.lastBackup) ? p.lastBackup : 0 };
}
function cleanDevice(d) {
  d = isObj(d) ? d : {}; const out = {};
  if (['ball', 'space', 'lewis', 'orbital'].indexOf(d.mode) >= 0) out.mode = d.mode;
  if (['auto', 'phone', 'tablet'].indexOf(d.layout) >= 0) out.layout = d.layout;
  ['faces', 'mute', 'voice', 'seenHelp'].forEach(k => { if (typeof d[k] === 'boolean') out[k] = d[k]; });
  return out;
}
function cleanName(n) {
  n = String(n == null ? '' : n).replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20);
  return n || 'Explorer';
}
const cleanAvatar = a => (AVATARS.indexOf(a) >= 0 ? a : AVATARS[0]);
const newId = () => Math.random().toString(36).slice(2, 10);
const makeProfile = (name, avatar, named) => ({ id: newId(), name: cleanName(name), avatar: cleanAvatar(avatar), created: Date.now(), named: !!named });

function readIndex() {
  const idx = read(INDEX, null);
  if (!idx || !Array.isArray(idx.profiles)) return null;
  idx.profiles = idx.profiles.filter(p => isObj(p) && typeof p.id === 'string' && /^[\w-]{1,24}$/.test(p.id)).map(p => ({ id: p.id, name: cleanName(p.name), avatar: cleanAvatar(p.avatar), created: num(p.created) ? p.created : Date.now(), named: p.named !== false }));
  return idx.profiles.length ? idx : null;
}

const P = {
  AVATARS, cleanName, cleanProgress, defaults,
  _useStore(s) { store = s; },
  _read: read,

  // Called once at start-up. Creates, migrates or loads the active profile and returns the game state.
  boot() {
    let idx = readIndex(), fresh = false;
    if (!idx) {
      idx = { profiles: [], active: null };
      const legacy = read(LEGACY, null);
      if (isObj(legacy)) {                                   // progress saved before profiles existed
        const p = makeProfile(AA.PLAYER_NAME || 'Explorer', AVATARS[0], true);
        idx.profiles.push(p); idx.active = p.id;
        write(PROG(p.id), cleanProgress(legacy)); write(DEVICE, cleanDevice(legacy));
      } else {
        const p = makeProfile('Explorer', AVATARS[0], false); fresh = true;
        idx.profiles.push(p); idx.active = p.id; write(PROG(p.id), cleanProgress({}));
      }
      write(INDEX, idx);
    }
    const saved = read(INDEX, null);
    if (!idx.profiles.some(p => p.id === (saved && saved.active))) idx.active = idx.profiles[0].id; else idx.active = saved.active;
    write(INDEX, idx);
    const prof = idx.profiles.find(p => p.id === idx.active);
    AA.PLAYER_NAME = prof.name;
    P._active = prof.id;
    const state = Object.assign(defaults(), cleanProgress(read(PROG(prof.id), {})), cleanDevice(read(DEVICE, {})));
    return { state, profile: prof, needsSetup: !prof.named, fresh };
  },
  save(state) {
    const prog = {}; PROGRESS_KEYS.forEach(k => { prog[k] = state[k]; });
    const dev = {}; DEVICE_KEYS.forEach(k => { dev[k] = state[k]; });
    write(PROG(P._active), prog); write(DEVICE, dev);
  },
  list() { const i = readIndex(); return i ? i.profiles : []; },
  current() { return P.list().find(p => p.id === P._active) || null; },
  progressOf(id) { return cleanProgress(read(PROG(id), {})); },

  create(name, avatar) {
    const idx = readIndex() || { profiles: [], active: null };
    const p = makeProfile(name, avatar, true);
    idx.profiles.push(p); write(INDEX, idx); write(PROG(p.id), cleanProgress({}));
    return p;
  },
  switchTo(id) {
    const idx = readIndex(); if (!idx || !idx.profiles.some(p => p.id === id)) return false;
    idx.active = id; return write(INDEX, idx);
  },
  update(id, patch) {
    const idx = readIndex(); if (!idx) return null;
    const p = idx.profiles.find(x => x.id === id); if (!p) return null;
    if (patch.name !== undefined) p.name = cleanName(patch.name);
    if (patch.avatar !== undefined) p.avatar = cleanAvatar(patch.avatar);
    if (patch.named) p.named = true;
    write(INDEX, idx);
    if (id === P._active) AA.PLAYER_NAME = p.name;
    return p;
  },
  remove(id) {
    const idx = readIndex(); if (!idx || idx.profiles.length < 2) return false;   // always keep one profile
    idx.profiles = idx.profiles.filter(p => p.id !== id);
    if (idx.active === id) idx.active = idx.profiles[0].id;
    write(INDEX, idx); try { store.removeItem(PROG(id)); } catch (e) { /* ignore */ }
    return true;
  },
  resetProgress(id) { write(PROG(id || P._active), cleanProgress({})); },

  // ---- backups ----
  exportProfile(id, state) {
    const p = P.list().find(x => x.id === id); if (!p) return null;
    const prog = (id === P._active && state) ? cleanProgress(state) : P.progressOf(id);
    prog.lastBackup = Date.now();
    return { app: 'atlas-atoms', version: 1, exported: prog.lastBackup, profile: { name: p.name, avatar: p.avatar, created: p.created }, progress: prog };
  },
  // Always makes a NEW profile, so restoring can never overwrite anyone's current progress.
  importText(text) {
    if (typeof text !== 'string' || text.length > 1500000) throw new Error('That does not look like an Atlas’ Atoms backup.');
    let data; try { data = JSON.parse(text); } catch (e) { throw new Error('That file is not a backup (it could not be read).'); }
    if (!isObj(data) || data.app !== 'atlas-atoms' || !isObj(data.progress)) throw new Error('That file is not an Atlas’ Atoms backup.');
    const names = P.list().map(p => p.name), pf = isObj(data.profile) ? data.profile : {};
    let name = cleanName(pf.name); if (names.indexOf(name) >= 0) name = cleanName(name.slice(0, 11) + ' (restored)');
    const idx = readIndex() || { profiles: [], active: null };
    const p = makeProfile(name, pf.avatar, true); if (num(pf.created)) p.created = pf.created;
    idx.profiles.push(p); write(INDEX, idx); write(PROG(p.id), cleanProgress(data.progress));
    return p;
  },
  async requestPersist() {
    try { if (root.navigator && navigator.storage && navigator.storage.persist) return await navigator.storage.persist(); } catch (e) { /* ignore */ }
    return false;
  }
};
AA.profiles = P;
if (typeof module !== 'undefined') module.exports = P;
})(typeof globalThis !== 'undefined' ? globalThis : window);
