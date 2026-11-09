(function (root) {
'use strict';
const AA = root.AA = root.AA || {};
const P = AA.profiles;
const fmt = ts => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

function avatarPicker(h, current, onPick) {
  const wrap = h('div', { class: 'avatarGrid' });
  P.AVATARS.forEach(a => {
    const b = h('button', { type: 'button', class: 'avatarBtn' + (a === current ? ' on' : ''), 'aria-label': 'Picture ' + a, onclick: () => {
      wrap.querySelectorAll('.avatarBtn').forEach(x => x.classList.toggle('on', x === b)); onPick(a);
    } }, a);
    wrap.append(b);
  });
  return wrap;
}

AA.refreshProfileButton = function () {
  const p = P.current(), b = document.querySelector('#btnProfile'); if (!p || !b) return;
  b.innerHTML = ''; b.append(document.createTextNode(p.avatar));
  const l = document.createElement('span'); l.className = 'lbl'; l.textContent = ' ' + p.name; b.append(l);
  b.title = 'Profile: ' + p.name; b.setAttribute('aria-label', 'Profile: ' + p.name);
};

// ---- backup / restore ----
function backupJson() {
  const U = AA.ui, p = P.current(); U.save();
  const data = P.exportProfile(p.id, U.state);
  U.state.lastBackup = data.progress.lastBackup; U.save();
  return JSON.stringify(data, null, 1);
}
AA.profileBackup = function () {
  const p = P.current(), text = backupJson();
  const blob = new Blob([text], { type: 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = 'atlas-atoms-' + p.name.replace(/[^\w-]+/g, '_') + '-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 3000);
  return text;
};
function restoreFromText(text, msg) {
  try {
    const p = P.importText(text);
    AA.ui.save(); P.switchTo(p.id); location.reload();
  } catch (e) { if (msg) msg.textContent = e.message; }
}
function restoreControls(h, msg) {
  const file = h('input', { type: 'file', accept: '.json,application/json', style: 'display:none' });
  file.addEventListener('change', () => {
    const f = file.files && file.files[0]; if (!f) return;
    if (f.size > 1500000) { msg.textContent = 'That file is too big to be a backup.'; return; }
    const r = new FileReader(); r.onload = () => restoreFromText(String(r.result), msg); r.onerror = () => { msg.textContent = 'The file could not be read.'; }; r.readAsText(f);
  });
  return h('span', null, file,
    h('button', { class: 'btn alt', onclick: () => file.click() }, 'Restore from a backup file'), ' ',
    h('button', { class: 'pill', onclick: () => { const t = window.prompt('Paste your backup code here:'); if (t) restoreFromText(t, msg); } }, 'Paste a backup code'));
}

// ---- first launch: who is playing? ----
AA.openSetup = function (onDone) {
  const U = AA.ui, h = U.h, p = P.current();
  let avatar = p.avatar, finished = false;
  const name = h('input', { type: 'text', maxlength: '20', class: 'search', placeholder: 'Type your name', autocomplete: 'off' });
  const msg = h('p', { style: 'color:var(--gold);min-height:1.3em;margin:6px 0' });
  const finish = () => { if (!finished) { finished = true; if (onDone) onDone(); } };
  let close = null;
  const start = h('button', { class: 'btn', onclick: () => {
    P.update(p.id, { name: name.value.trim() || 'Explorer', avatar, named: true });
    AA.refreshProfileButton(); finished = true; close(); U.tip('Welcome, ' + AA.PLAYER_NAME + '! Your progress is saved on this device.', 7000); if (onDone) onDone();
  } }, 'Start playing');
  name.addEventListener('keydown', e => { if (e.key === 'Enter') start.click(); });
  const body = h('div', { class: 'profileBox' },
    h('p', { style: 'font-size:20px;margin:0 0 6px' }, 'Welcome to the lab! What is your name?'), name,
    h('p', { style: 'margin:10px 0 4px;color:var(--dim)' }, 'Pick a picture:'), avatarPicker(h, avatar, a => { avatar = a; }),
    h('p', { style: 'margin:12px 0' }, start), msg,
    h('hr', { style: 'border:0;border-top:1px solid var(--line);margin:12px 0' }),
    h('p', { style: 'color:var(--dim);margin:0 0 6px' }, 'Played before on another device? Restore your progress:'), restoreControls(h, msg));
  close = U.modalShell('Who is playing?', body, finish);
  setTimeout(() => name.focus(), 50);
};

// ---- the profile screen ----
AA.openProfile = function () {
  const U = AA.ui, h = U.h, cur = P.current(), body = h('div', { class: 'profileBox' });
  const msg = h('p', { style: 'color:var(--gold);min-height:1.3em;margin:6px 0' });
  const st = AA.progressStats(U.state);
  const card = h('div', { class: 'profileCard' }, h('div', { class: 'bigAvatar' }, cur.avatar),
    h('div', null, h('b', { style: 'font-size:22px' }, cur.name), h('div', { style: 'color:var(--dim);font-size:14px' }, 'Playing since ' + fmt(cur.created)),
      h('div', { style: 'font-size:14px;margin-top:4px' }, st.lessonsDone + (st.lessonsDone === 1 ? ' lesson' : ' lessons') + ' · ' + st.found + (st.found === 1 ? ' molecule' : ' molecules') + ' · ' + Object.keys(U.state.badges || {}).length + (Object.keys(U.state.badges || {}).length === 1 ? ' badge' : ' badges'))));
  body.append(card);

  // edit name and picture
  const editBox = h('div', { class: 'hidden' });
  let avatar = cur.avatar;
  const nameIn = h('input', { type: 'text', maxlength: '20', class: 'search', value: cur.name });
  editBox.append(h('p', { style: 'margin:0 0 4px;color:var(--dim)' }, 'Name'), nameIn, h('p', { style: 'margin:8px 0 4px;color:var(--dim)' }, 'Picture'), avatarPicker(h, avatar, a => { avatar = a; }),
    h('p', null, h('button', { class: 'btn', onclick: () => { P.update(cur.id, { name: nameIn.value, avatar }); AA.refreshProfileButton(); AA.openProfile(); } }, 'Save')));
  body.append(h('p', null, h('button', { class: 'btn alt', onclick: () => editBox.classList.toggle('hidden') }, '✏️ Change name or picture')), editBox);

  // switch / add
  const others = P.list().filter(p => p.id !== cur.id);
  body.append(h('h3', { class: 'bgroup' }, 'Players on this device'));
  const list = h('div', { class: 'profileList' });
  others.forEach(p => {
    const s2 = AA.progressStats(P.progressOf(p.id));
    list.append(h('div', { class: 'profileRow' }, h('span', { class: 'rowAvatar' }, p.avatar), h('span', { style: 'flex:1' }, h('b', null, p.name), h('small', { style: 'color:var(--dim)' }, '  ' + s2.lessonsDone + ' lessons')),
      h('button', { class: 'btn alt', onclick: () => { U.save(); P.switchTo(p.id); location.reload(); } }, 'Switch')));
  });
  if (!others.length) list.append(h('p', { style: 'color:var(--dim);margin:0' }, 'Only you so far. A brother, sister or friend can have their own profile.'));
  body.append(list);
  const newBox = h('div', { class: 'hidden' });
  let newAvatar = P.AVATARS[(P.list().length) % P.AVATARS.length];
  const newName = h('input', { type: 'text', maxlength: '20', class: 'search', placeholder: 'Name' });
  newBox.append(newName, avatarPicker(h, newAvatar, a => { newAvatar = a; }),
    h('p', null, h('button', { class: 'btn', onclick: () => { U.save(); const p = P.create(newName.value, newAvatar); P.switchTo(p.id); location.reload(); } }, 'Create and switch')));
  body.append(h('p', null, h('button', { class: 'btn alt', onclick: () => newBox.classList.toggle('hidden') }, '➕ Add a player')), newBox);

  // device settings (also the only place for these on phones, where the header is short on room)
  body.append(h('h3', { class: 'bgroup' }, 'Settings on this device'));
  const voice = h('input', { type: 'checkbox' }), sound = h('input', { type: 'checkbox' });
  voice.checked = !!U.state.voice; sound.checked = !U.state.mute;
  voice.addEventListener('change', () => { const c = document.querySelector('#chkVoice'); if (c) { c.checked = voice.checked; c.dispatchEvent(new Event('change')); } });
  sound.addEventListener('change', () => { const b = document.querySelector('#btnSound'); if (b) b.click(); });
  body.append(h('div', { class: 'settingsRow' }, h('label', null, voice, '\uD83D\uDDE3 Read aloud'), h('label', null, sound, '\uD83D\uDD0A Sound'),
    h('button', { class: 'pill', onclick: () => { const b = document.querySelector('#btnHelp'); if (b) b.click(); } }, '? How to play')));

  // backup
  body.append(h('h3', { class: 'bgroup' }, 'Keep your progress safe'));
  const last = U.state.lastBackup ? 'Last backup: ' + fmt(U.state.lastBackup) + '.' : 'No backup yet.';
  body.append(h('p', { class: 'labText', style: 'margin:0 0 6px' }, 'Your progress is saved in this browser. If the browser clears its data, or you use another device, a backup file brings it back. ' + last));
  body.append(h('p', null,
    h('button', { class: 'btn', onclick: () => { AA.profileBackup(); msg.textContent = 'Backup saved to your downloads. Keep the file somewhere safe.'; } }, '💾 Back up now'), ' ',
    h('button', { class: 'btn alt', onclick: () => { const t = backupJson(); const ok = () => { msg.textContent = 'Backup code copied. Paste it somewhere safe.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, () => window.prompt('Copy this backup code:', t)); else window.prompt('Copy this backup code:', t); } }, 'Copy backup code')));
  body.append(h('p', null, restoreControls(h, msg)), msg);
  body.append(h('p', { class: 'labText', style: 'color:var(--dim)' }, 'Tip for iPhone and iPad: Safari can erase a website’s saved data after about a week of not using it. Add this game to the Home Screen (Share, then Add to Home Screen) to keep it safe, and back up from time to time.'));

  body.append(h('p', null, h('button', { class: 'btn alt', onclick: () => AA.openProgress() }, '👨‍👩‍👧 Progress page for grown-ups'), ' ',
    P.list().length > 1 ? h('button', { class: 'pill', onclick: () => AA.real.ask({ title: 'Delete ' + cur.name + '?', text: 'This removes this player and all of their progress from this device. A backup file is the only way to get it back.', ok: 'Delete ' + cur.name },
      () => { P.remove(cur.id); location.reload(); }) }, 'Delete this player') : ''));
  U.modalShell('Your profile', body);
};
})(typeof globalThis !== 'undefined' ? globalThis : window);
