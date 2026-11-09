(function (root) {
'use strict';
const AA = root.AA = root.AA || {};

// ---------- lesson completion rule (shared by the game, badges and the progress page) ----------
AA.lessonDoneFor = function (s, L) {
  if (s.lessons && s.lessons[L.n]) return true;
  const d = L.done;
  if (!d) return false;
  const f = s.found || {}, r = s.reacted || {}, lab = s.labSeen || {};
  if (d.found) return !!f[d.found];
  if (d.foundAll) return d.foundAll.every(id => f[id]);
  if (d.reacted) return !!r[d.reacted];
  if (d.reactedAny) return d.reactedAny.some(id => r[id]);
  if (d.reactedCount) return Object.keys(r).length >= d.reactedCount;
  if (d.lab) return !!lab[d.lab];
  if (d.labAll) return d.labAll.every(k => lab[k]);
  return false;
};

// ---------- numbers everything else is built from ----------
AA.progressStats = function (s) {
  const L = AA.LESSONS || [], units = AA.LESSON_UNITS || [];
  const done = L.filter(l => AA.lessonDoneFor(s, l));
  const perfect = L.filter(l => (AA.QUIZZES[l.n] || []).length && s.quiz && s.quiz[l.n] === AA.QUIZZES[l.n].length);
  const unitInfo = units.map((u, i) => {
    const inUnit = L.filter(l => l.n >= u[0] && l.n <= u[1]);
    return { index: i, name: u[2], from: u[0], to: u[1], total: inUnit.length,
      done: inUnit.filter(l => AA.lessonDoneFor(s, l)).length,
      perfect: inUnit.filter(l => perfect.includes(l)).length };
  });
  return {
    lessonsDone: done.length, lessonsTotal: L.length, perfect: perfect.length,
    found: Object.keys(s.found || {}).length, foundTotal: (AA.MOLECULES || []).length,
    reacted: Object.keys(s.reacted || {}).length, reactionsTotal: (AA.REACTIONS || []).length,
    labTabs: ['explore', 'orbitals', 'mo', 'rxn'].filter(k => (s.labSeen || {})[k]).length,
    lookups: s.lookups || 0, units: unitInfo
  };
};

// ---------- badges ----------
const UNIT_ICON = ['🧱', '🧪', '🌀', '💥', '⚛️', '🔗', '🌱', '🌡️', '🧫', '🌍'];
AA.BADGES = (function () {
  const B = [];
  const add = (id, name, icon, kind, desc, test) => B.push({ id, name, icon, kind, desc, test });
  add('first-molecule', 'First Molecule', '🧪', 'discover', 'Build your first real molecule.', (st) => st.found >= 1);
  add('molecules-10', 'Molecule Maker', '⚗️', 'discover', 'Discover 10 molecules.', st => st.found >= 10);
  add('molecules-20', 'Molecule Collector', '🔬', 'discover', 'Discover 20 molecules.', st => st.found >= 20);
  add('atlas-complete', 'Atlas Complete', '📖', 'discover', 'Discover every molecule in the Atlas.', st => st.found >= st.foundTotal);
  add('all-elements', 'Element Explorer', '🧲', 'discover', 'Unlock all nine elements.', (st, s) => Object.keys(AA.ELEMENTS).every(el => st.found >= AA.ELEMENTS[el].unlock));
  add('first-reaction', 'First Spark', '⚡', 'react', 'Run your first reaction.', st => st.reacted >= 1);
  add('reactions-4', 'Reaction Runner', '🔥', 'react', 'Try 4 different reactions.', st => st.reacted >= 4);
  add('reactions-all', 'Reaction Master', '💥', 'react', 'Try every reaction.', st => st.reacted >= st.reactionsTotal);
  add('first-lesson', 'First Lesson', '🎓', 'learn', 'Finish your first lesson.', st => st.lessonsDone >= 1);
  [10, 25, 50, 75].forEach(n => add('lessons-' + n, n + ' Lessons', n >= 50 ? '🏅' : '📚', 'learn', 'Finish ' + n + ' lessons.', st => st.lessonsDone >= n));
  add('first-star', 'First Star', '⭐', 'quiz', 'Get a perfect score on a quiz.', st => st.perfect >= 1);
  add('stars-10', 'Quiz Whiz', '🌟', 'quiz', 'Perfect scores on 10 quizzes.', st => st.perfect >= 10);
  add('stars-50', 'Quiz Champion', '💫', 'quiz', 'Perfect scores on 50 quizzes.', st => st.perfect >= 50);
  add('lab-explorer', 'Lab Explorer', '🔭', 'lab', 'Visit all four tabs of the Molecule Lab.', st => st.labTabs >= 4);
  add('real-detective', 'Real Detective', '🕵️', 'lab', 'Ask PubChem if a molecule you built is real.', st => st.lookups >= 1);
  (AA.LESSON_UNITS || []).forEach((u, i) => add('unit-' + (i + 1), u[2], UNIT_ICON[i] || '🏅', 'unit', 'Finish every lesson in the unit "' + u[2] + '" (lessons ' + u[0] + ' to ' + u[1] + ').', st => st.units[i] && st.units[i].done >= st.units[i].total));
  add('chemist', 'Certified Chemist', '🏆', 'chemist', 'Finish all ' + (AA.LESSONS || []).length + ' lessons.', st => st.lessonsDone >= st.lessonsTotal);
  return B;
})();

AA.earnedBadges = function (s) {
  const st = AA.progressStats(s);
  return AA.BADGES.filter(b => { try { return b.test(st, s); } catch (e) { return false; } }).map(b => b.id);
};

// ---------- awarding + celebration ----------
let queue = [], showing = false;
function toast(b) {
  const U = AA.ui, h = U.h;
  const el = h('div', { class: 'badgeToast' }, medal(b, true), h('div', null, h('small', null, 'New badge!'), h('b', null, b.name), h('div', { class: 'bdesc' }, b.desc)));
  document.body.append(el);
  try { U.sfx.found(); U.bench.burst(new root.THREE.Vector3(0, 0, 0), 40); } catch (e) { /* ignore */ }
  if (U.state.voice) U.speak('New badge! ' + b.name + '.');
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 500); }, 3600);
}
function pump() {
  if (showing || !queue.length) return;
  showing = true; toast(queue.shift());
  setTimeout(() => { showing = false; pump(); }, 4000);
}
AA.checkBadges = function () {
  const U = AA.ui; if (!U) return;
  const s = U.state; s.badges = s.badges || {};
  const have = AA.earnedBadges(s), fresh = have.filter(id => !s.badges[id]);
  if (!fresh.length) { updateCount(); return; }
  const now = Date.now(); fresh.forEach(id => { s.badges[id] = now; });
  U.save(); updateCount();
  const list = fresh.map(id => AA.BADGES.find(b => b.id === id));
  if (list.length > 4) {                                  // e.g. progress made before badges existed
    queue.push({ name: list.length + ' new badges', icon: '🎉', kind: 'chemist', desc: 'Open the Badges screen to see them all.' });
  } else queue.push(...list);
  pump();
};
function updateCount() {
  const el = document.querySelector('#bcount'); if (!el || !AA.ui) return;
  el.textContent = '(' + Object.keys(AA.ui.state.badges || {}).length + '/' + AA.BADGES.length + ')';
}

// ---------- medal drawing ----------
function medal(b, earned) {
  return AA.ui.h('div', { class: 'medal k-' + b.kind + (earned ? '' : ' locked') }, earned ? b.icon : '🔒');
}

AA.openBadges = function () {
  const U = AA.ui, h = U.h, s = U.state, have = s.badges || {};
  const groups = [['discover', 'Discover'], ['react', 'Reactions'], ['learn', 'Learning'], ['quiz', 'Quizzes'], ['lab', 'Lab'], ['unit', 'Units'], ['chemist', 'The big one']];
  const body = h('div', { class: 'badgePage' });
  body.append(h('p', { style: 'margin:0 0 8px' }, h('button', { class: 'btn alt', onclick: () => AA.openProgress() }, '👨‍👩‍👧 Progress page for grown-ups')));
  groups.forEach(([k, name]) => {
    const list = AA.BADGES.filter(b => b.kind === k); if (!list.length) return;
    body.append(h('h3', { class: 'bgroup' }, name));
    const grid = h('div', { class: 'badgeGrid' });
    list.forEach(b => {
      const e = !!have[b.id];
      grid.append(h('div', { class: 'badge' + (e ? '' : ' off'), title: e ? 'Earned ' + new Date(have[b.id]).toLocaleDateString() : 'Locked' },
        medal(b, e), h('b', null, b.name), h('small', null, b.desc)));
    });
    body.append(grid);
  });
  U.modalShell('Badges — ' + Object.keys(have).length + ' of ' + AA.BADGES.length, body);
};

// ---------- the grown-up progress page ----------
function fmt(ts) { return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }

AA.progressSummary = function (s) {
  const st = AA.progressStats(s), L = AA.LESSONS, lines = [];
  lines.push("Atlas' Atoms progress report");
  lines.push('Lessons complete: ' + st.lessonsDone + ' of ' + st.lessonsTotal);
  lines.push('Perfect quizzes: ' + st.perfect);
  lines.push('Molecules found: ' + st.found + ' of ' + st.foundTotal);
  lines.push('Reactions tried: ' + st.reacted + ' of ' + st.reactionsTotal);
  lines.push('Badges: ' + Object.keys(s.badges || {}).length + ' of ' + AA.BADGES.length);
  lines.push('');
  st.units.forEach(u => lines.push(u.name + ': ' + u.done + '/' + u.total + ' lessons, ' + u.perfect + ' perfect quizzes'));
  const next = L.find(l => !AA.lessonDoneFor(s, l));
  if (next) { lines.push(''); lines.push('Next lesson: ' + next.n + '. ' + next.title); if (next.grownup) lines.push('Talk about: ' + next.grownup.replace(/^Ask:\s*/, '')); }
  return lines.join('\n');
};

AA.openProgress = function () {
  const U = AA.ui, h = U.h, s = U.state, L = AA.LESSONS, st = AA.progressStats(s);
  const have = s.badges || {};
  const body = h('div', { class: 'report' });
  const cards = [[st.lessonsDone + '/' + st.lessonsTotal, 'lessons complete'], [st.perfect, 'perfect quizzes'], [st.found + '/' + st.foundTotal, 'molecules found'],
    [st.reacted + '/' + st.reactionsTotal, 'reactions tried'], [Object.keys(have).length + '/' + AA.BADGES.length, 'badges']];
  body.append(h('div', { class: 'repCards' }, cards.map(c => h('div', { class: 'repCard' }, h('b', null, String(c[0])), h('small', null, c[1])))));

  // days played: unique calendar days that have any recorded activity
  const stamps = [];
  [s.found, s.lessons, s.reacted, s.labSeen, s.badges].forEach(o => Object.values(o || {}).forEach(v => { if (typeof v === 'number' && v > 1e12) stamps.push(v); }));
  const days = new Set(stamps.map(t => new Date(t).toDateString())).size;
  if (stamps.length) body.append(h('p', { class: 'labText' }, 'Active on ' + days + ' day' + (days === 1 ? '' : 's') + '. Last activity: ' + fmt(Math.max.apply(null, stamps)) + '.'));

  body.append(h('h3', { class: 'bgroup' }, 'Progress by unit'));
  st.units.forEach(u => {
    const pct = u.total ? Math.round(u.done / u.total * 100) : 0;
    body.append(h('div', { class: 'unitRow' },
      h('div', { class: 'unitName' }, u.name, h('small', null, '  lessons ' + u.from + '–' + u.to)),
      h('div', { class: 'bar' }, h('div', { style: 'width:' + pct + '%' })),
      h('small', null, u.done + '/' + u.total + ' done · ' + u.perfect + ' perfect quizzes')));
  });

  const next = L.find(l => !AA.lessonDoneFor(s, l));
  body.append(h('h3', { class: 'bgroup' }, 'What is next'));
  if (next) {
    body.append(h('div', { class: 'repBox' }, h('b', null, 'Lesson ' + next.n + ': ' + next.title), h('p', { style: 'margin:4px 0' }, next.bigIdea),
      next.grownup ? h('p', { class: 'grownup' }, h('b', null, 'Talk about it: '), next.grownup.replace(/^Ask:\s*/, '')) : '',
      h('button', { class: 'btn noprint', onclick: () => { document.querySelector('#modal').click(); setTimeout(() => document.querySelector('#btnLessons').click(), 50); } }, 'Open the lessons')));
  } else body.append(h('p', null, 'Every lesson is complete. Time for the chemist poster, or to invent new molecules.'));

  const review = L.filter(l => s.quiz && s.quiz[l.n] !== undefined && s.quiz[l.n] < (AA.QUIZZES[l.n] || []).length);
  body.append(h('h3', { class: 'bgroup' }, 'Worth another look'));
  body.append(review.length
    ? h('ul', { class: 'repList' }, review.slice(0, 12).map(l => h('li', null, 'Lesson ' + l.n + ': ' + l.title + ' — best quiz score ' + s.quiz[l.n] + ' of ' + AA.QUIZZES[l.n].length + (s.tries && s.tries[l.n] ? ', ' + s.tries[l.n] + ' tr' + (s.tries[l.n] === 1 ? 'y' : 'ies') : ''))))
    : h('p', { style: 'color:var(--dim)' }, 'Nothing yet. Quizzes that were not perfect will show up here.'));

  const ev = [];
  Object.keys(s.found || {}).forEach(id => { const m = AA.chem.library().byId.get(id); if (m && typeof s.found[id] === 'number') ev.push([s.found[id], 'Discovered ' + m.name]); });
  Object.keys(s.lessons || {}).forEach(n => { const l = L.find(x => String(x.n) === n); if (l) ev.push([s.lessons[n], 'Finished lesson ' + n + ': ' + l.title]); });
  Object.keys(have).forEach(id => { const b = AA.BADGES.find(x => x.id === id); if (b) ev.push([have[id], 'Earned the ' + b.name + ' badge']); });
  ev.sort((a, b) => b[0] - a[0]);
  body.append(h('h3', { class: 'bgroup' }, 'Recent activity'));
  body.append(ev.length ? h('ul', { class: 'repList' }, ev.slice(0, 10).map(e => h('li', null, h('small', { style: 'color:var(--dim)' }, fmt(e[0]) + '  '), e[1])))
    : h('p', { style: 'color:var(--dim)' }, 'No activity yet.'));

  const copyBtn = h('button', { class: 'btn alt', onclick: () => {
    const text = AA.progressSummary(s);
    const done = () => { copyBtn.textContent = 'Copied!'; setTimeout(() => { copyBtn.textContent = 'Copy summary'; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => window.prompt('Copy this summary:', text));
    else window.prompt('Copy this summary:', text);
  } }, 'Copy summary');
  body.append(h('div', { class: 'repActions noprint' }, copyBtn, ' ', h('button', { class: 'btn alt', onclick: () => window.print() }, 'Print'), ' ',
    h('button', { class: 'pill', style: 'margin-left:auto', onclick: () => AA.real.ask({ title: 'Erase all progress?', text: 'This removes every discovery, lesson, quiz score and badge on this device. It cannot be undone.', ok: 'Erase everything' },
      () => { try { localStorage.removeItem('atlas-atoms-v1'); } catch (e) { /* ignore */ } location.reload(); }) }, 'Reset progress')));
  U.modalShell('Progress report', body);
};
})(typeof globalThis !== 'undefined' ? globalThis : window);
