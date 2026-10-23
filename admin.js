const el = {
  appRoot: document.getElementById('appRoot'),
  accountEmail: document.getElementById('accountEmail'),
  logoutBtn: document.getElementById('logoutBtn'),
  usersTableBody: document.getElementById('usersTableBody'),
  usersEmpty: document.getElementById('usersEmpty'),
  adminLoading: document.getElementById('adminLoading'),
  pickerOverlay: document.getElementById('pickerOverlay'),
  pickerTitle: document.getElementById('pickerTitle'),
  pickerList: document.getElementById('pickerList'),
  pickerError: document.getElementById('pickerError'),
  pickerSaveBtn: document.getElementById('pickerSaveBtn'),
  pickerResetBtn: document.getElementById('pickerResetBtn'),
  pickerCancelBtn: document.getElementById('pickerCancelBtn'),
};

let currentPickerUserId = null;

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

async function loadUsers() {
  const [{ data: profiles, error: profilesError }, { data: progressRows }, { data: customLists }, { data: lessonRows }] = await Promise.all([
    sb.from('profiles').select('*').order('created_at'),
    sb.from('progress').select('user_id, mistakes, completed_at'),
    sb.from('custom_word_lists').select('user_id, words'),
    sb.from('lesson_progress').select('user_id'),
  ]);

  if (profilesError) {
    console.error('Не удалось загрузить пользователей:', profilesError.message);
    el.usersEmpty.hidden = false;
    el.usersEmpty.textContent = 'Не удалось загрузить список пользователей.';
    return;
  }

  const progressByUser = {};
  (progressRows || []).forEach((r) => {
    if (!progressByUser[r.user_id]) progressByUser[r.user_id] = { count: 0, mistakesSum: 0, last: null };
    const p = progressByUser[r.user_id];
    p.count++;
    p.mistakesSum += r.mistakes || 0;
    if (!p.last || r.completed_at > p.last) p.last = r.completed_at;
  });

  const lessonPartsByUser = {};
  (lessonRows || []).forEach((r) => {
    lessonPartsByUser[r.user_id] = (lessonPartsByUser[r.user_id] || 0) + 1;
  });

  const customByUser = {};
  (customLists || []).forEach((c) => {
    customByUser[c.user_id] = c.words;
  });

  renderUsersTable(profiles || [], progressByUser, customByUser, lessonPartsByUser);
}

function renderUsersTable(profiles, progressByUser, customByUser, lessonPartsByUser) {
  el.usersTableBody.innerHTML = '';

  if (profiles.length === 0) {
    el.usersEmpty.hidden = false;
    return;
  }
  el.usersEmpty.hidden = true;

  profiles.forEach((profile) => {
    const p = progressByUser[profile.id] || { count: 0, mistakesSum: 0, last: null };
    const avgMistakes = p.count > 0 ? (p.mistakesSum / p.count).toFixed(1) : '—';
    const hasCustom = Boolean(customByUser[profile.id]);
    const partsDone = lessonPartsByUser[profile.id] || 0;
    const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
    const displayName = fullName || profile.email || '—';

    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td title="${escapeHtml(profile.email || '')}">${escapeHtml(displayName)}</td>
      <td><span class="role-badge role-${profile.role}">${profile.role === 'admin' ? 'админ' : 'user'}</span></td>
      <td>${p.count}</td>
      <td>${avgMistakes}</td>
      <td>${hasCustom ? '—' : partsDone}</td>
      <td>${formatDate(p.last)}</td>
      <td><button class="ghost-btn picker-open-btn" data-user-id="${profile.id}" data-user-email="${escapeHtml(displayName)}">${hasCustom ? 'Изменить' : 'Назначить'}</button></td>
    `;
    el.usersTableBody.appendChild(tr);
  });

  el.usersTableBody.querySelectorAll('.picker-open-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      openPicker(btn.dataset.userId, btn.dataset.userEmail, customByUser[btn.dataset.userId] || null);
    });
  });
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function openPicker(userId, userEmail, existingWords) {
  currentPickerUserId = userId;
  el.pickerTitle.textContent = `Подборка для ${userEmail}`;
  el.pickerError.textContent = '';
  el.pickerList.innerHTML = '';

  const existingHanzi = new Set((existingWords || []).map((w) => w.hanzi));

  DEFAULT_WORDS.forEach((word, i) => {
    const id = `pick_${i}`;
    const label = document.createElement('label');
    label.className = 'picker-item';
    label.innerHTML = `
      <input type="checkbox" id="${id}" value="${i}" ${existingHanzi.has(word.hanzi) ? 'checked' : ''}>
      <span class="picker-hanzi">${word.hanzi}</span>
      <span class="picker-pinyin">${word.pinyin.join(' ')}</span>
      <span class="picker-translation">${escapeHtml(word.translation)}</span>
    `;
    el.pickerList.appendChild(label);
  });

  el.pickerOverlay.hidden = false;
}

function closePicker() {
  el.pickerOverlay.hidden = true;
  currentPickerUserId = null;
}

el.pickerCancelBtn.addEventListener('click', closePicker);

el.pickerSaveBtn.addEventListener('click', async () => {
  if (!currentPickerUserId) return;
  const checked = Array.from(el.pickerList.querySelectorAll('input[type=checkbox]:checked')).map((cb) => DEFAULT_WORDS[Number(cb.value)]);

  if (checked.length === 0) {
    el.pickerError.textContent = 'Выберите хотя бы одно слово (или используйте «Сбросить к общему списку»).';
    return;
  }

  const { error } = await sb.from('custom_word_lists').upsert({
    user_id: currentPickerUserId,
    words: checked,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    el.pickerError.textContent = 'Не удалось сохранить: ' + error.message;
    return;
  }

  closePicker();
  loadUsers();
});

el.pickerResetBtn.addEventListener('click', async () => {
  if (!currentPickerUserId) return;
  const { error } = await sb.from('custom_word_lists').delete().eq('user_id', currentPickerUserId);
  if (error) {
    el.pickerError.textContent = 'Не удалось сбросить: ' + error.message;
    return;
  }
  closePicker();
  loadUsers();
});

el.logoutBtn.addEventListener('click', async () => {
  await signOut();
  window.location.href = 'index.html';
});

(async function init() {
  const profile = await requireAdmin(); // редиректит на index.html, если не админ
  if (!profile) return;

  el.accountEmail.textContent = profile.email || '';
  el.adminLoading.hidden = true;
  el.appRoot.hidden = false;

  loadUsers();
})();
