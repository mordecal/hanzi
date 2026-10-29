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
  pickerSearch: document.getElementById('pickerSearch'),
  pickerNoResults: document.getElementById('pickerNoResults'),
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

let pickerWords = []; // слова в том порядке, в каком они показаны в окне

let pickerWords = []; // слова в том порядке, в каком они показаны в окне

function plainPinyin(s) {
  // убираем тоны: nǐ → ni, lǜ → lu
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function filterPicker() {
  const tokens = el.pickerSearch.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
  let totalVisible = 0;

  el.pickerList.querySelectorAll('.picker-book-group').forEach((bookGroup) => {
    let bookVisible = 0;
    bookGroup.querySelectorAll('.picker-lesson-group').forEach((lessonGroup) => {
      let lessonVisible = 0;
      lessonGroup.querySelectorAll('.picker-item').forEach((item) => {
        const match = tokens.every(
          (t) => item.dataset.raw.includes(t) || item.dataset.plain.includes(t.replace(/v/g, 'u'))
        );
        item.hidden = !match;
        if (match) lessonVisible++;
      });
      lessonGroup.hidden = lessonVisible === 0;
      bookVisible += lessonVisible;
    });
    bookGroup.hidden = bookVisible === 0;
    totalVisible += bookVisible;
  });

  el.pickerNoResults.hidden = totalVisible > 0;
}

el.pickerSearch.addEventListener('input', filterPicker);

function openPicker(userId, userEmail, existingWords) {
  currentPickerUserId = userId;
  el.pickerTitle.textContent = `Подборка для ${userEmail}`;
  el.pickerError.textContent = '';
  el.pickerList.innerHTML = '';
  el.pickerSearch.value = '';
  pickerWords = [];

  const existingHanzi = new Set((existingWords || []).map((w) => w.hanzi));

  BOOKS.forEach((book) => {
    const lessons = LESSONS.filter((l) => (l.book || 'hsk1') === book.id);
    if (lessons.length === 0) return;

    const bookGroup = document.createElement('div');
    bookGroup.className = 'picker-book-group';

    const bookHead = document.createElement('div');
    bookHead.className = 'picker-book';
    bookHead.textContent = book.title;
    bookGroup.appendChild(bookHead);

    lessons.forEach((lesson) => {
      const lessonGroup = document.createElement('div');
      lessonGroup.className = 'picker-lesson-group';

      // Заголовок урока с флажком «выбрать все»
      const lessonHead = document.createElement('label');
      lessonHead.className = 'picker-lesson';
      const allBox = document.createElement('input');
      allBox.type = 'checkbox';
      const lessonName = document.createElement('span');
      lessonName.textContent = `${lesson.title} · выбрать все`;
      lessonHead.append(allBox, lessonName);
      lessonGroup.appendChild(lessonHead);

      const boxes = [];
      lesson.words.forEach((word) => {
        const idx = pickerWords.push(word) - 1;
        const pinyin = word.pinyin.join(' ');
        const label = document.createElement('label');
        label.className = 'picker-item';
        label.dataset.raw = `${word.hanzi} ${pinyin} ${word.translation}`.toLowerCase();
        label.dataset.plain = plainPinyin(pinyin);
        label.innerHTML = `
          <input type="checkbox" class="picker-word-cb" value="${idx}" ${existingHanzi.has(word.hanzi) ? 'checked' : ''}>
          <span class="picker-hanzi">${word.hanzi}</span>
          <span class="picker-pinyin">${pinyin}</span>
          <span class="picker-translation">${escapeHtml(word.translation)}</span>
        `;
        lessonGroup.appendChild(label);

        const box = label.querySelector('input');
        boxes.push(box);
        box.addEventListener('change', () => {
          allBox.checked = boxes.every((b) => b.checked);
        });
      });

      allBox.checked = boxes.every((b) => b.checked);
      // «Выбрать все» действует только на видимые (найденные) слова урока
      allBox.addEventListener('change', () => {
        boxes.forEach((b) => {
          if (!b.closest('.picker-item').hidden) b.checked = allBox.checked;
        });
      });

      bookGroup.appendChild(lessonGroup);
    });

    el.pickerList.appendChild(bookGroup);
  });

  filterPicker();
  el.pickerOverlay.hidden = false;
}

function closePicker() {
  el.pickerOverlay.hidden = true;
  currentPickerUserId = null;
}

el.pickerCancelBtn.addEventListener('click', closePicker);

el.pickerSaveBtn.addEventListener('click', async () => {
  if (!currentPickerUserId) return;

  const seen = new Set();
  const checked = Array.from(el.pickerList.querySelectorAll('.picker-word-cb:checked'))
    .map((cb) => pickerWords[Number(cb.value)])
    .filter((w) => !seen.has(w.hanzi) && seen.add(w.hanzi));

  if (checked.length === 0) {
    // Ничего не выбрано: убираем подборку, у ученика снова общий список
    const { error } = await sb.from('custom_word_lists').delete().eq('user_id', currentPickerUserId);
    if (error) {
      el.pickerError.textContent = 'Не удалось сбросить: ' + error.message;
      return;
    }
  } else {
    const { error } = await sb.from('custom_word_lists').upsert({
      user_id: currentPickerUserId,
      words: checked,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      el.pickerError.textContent = 'Не удалось сохранить: ' + error.message;
      return;
    }
  }

  closePicker();
  loadUsers();
});

el.pickerResetBtn.addEventListener('click', () => {
  el.pickerList.querySelectorAll('input[type=checkbox]').forEach((cb) => (cb.checked = false));
  el.pickerError.textContent = '';
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
