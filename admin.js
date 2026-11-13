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
  addHanzi: document.getElementById('addHanzi'),
  addPinyin: document.getElementById('addPinyin'),
  addTranslation: document.getElementById('addTranslation'),
  addWordBtn: document.getElementById('addWordBtn'),
  lookupBtn: document.getElementById('lookupBtn'),
  addSuggestions: document.getElementById('addSuggestions'),
  addBook: document.getElementById('addBook'),
  inviteCode: document.getElementById('inviteCode'),
  copyInviteBtn: document.getElementById('copyInviteBtn'),
};

// Список учебников в форме добавления слова
BOOKS.forEach((b) => {
  const opt = document.createElement('option');
  opt.value = b.id;
  opt.textContent = b.title;
  el.addBook.appendChild(opt);
});

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

let pickerOwnLessonGroup = null; // «Свои слова»: слова из старых подборок ученика

function createPickerRow(word, checked) {
  const idx = pickerWords.push(word) - 1;
  const pinyin = word.pinyin.join(' ');
  const label = document.createElement('label');
  label.className = 'picker-item';
  label.dataset.hanzi = word.hanzi;
  label.dataset.raw = `${word.hanzi} ${pinyin} ${word.translation}`.toLowerCase();
  label.dataset.plain = plainPinyin(pinyin);
  label.innerHTML = `
    <input type="checkbox" class="picker-word-cb" value="${idx}" ${checked ? 'checked' : ''}>
    <span class="picker-hanzi">${escapeHtml(word.hanzi)}</span>
    <span class="picker-pinyin">${escapeHtml(pinyin)}</span>
    <span class="picker-translation">${escapeHtml(word.translation)}</span>
  `;
  // У слов, добавленных вручную, есть кнопка удаления из учебника
  if (word.extraId) {
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'picker-del';
    del.title = 'Удалить слово из учебника';
    del.textContent = '✕';
    del.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteExtraWord(word);
    });
    label.appendChild(del);
  }
  return label;
}

function currentSelection() {
  return Array.from(el.pickerList.querySelectorAll('.picker-word-cb:checked')).map(
    (cb) => pickerWords[Number(cb.value)]
  );
}

// Находит слово в выбранном учебнике, отмечает его и прокручивает список к нему
function selectExistingWord(book, hanzi) {
  el.pickerSearch.value = '';
  filterPicker();
  const row = el.pickerList.querySelector(
    `.picker-book-group[data-book="${book}"] .picker-item[data-hanzi="${hanzi}"]`
  );
  if (!row) return;
  const cb = row.querySelector('input');
  if (!cb.checked) {
    cb.checked = true;
    cb.dispatchEvent(new Event('change'));
  }
  row.scrollIntoView({ block: 'center' });
}

function clearSuggestions() {
  el.addSuggestions.innerHTML = '';
  el.addSuggestions.hidden = true;
}

// Подставляет пиньинь (локально) и перевод (из интернета) по иероглифам
async function lookupWord() {
  const hanzi = el.addHanzi.value.trim();
  if (!/^[\u4e00-\u9fff]+$/.test(hanzi)) {
    el.pickerError.textContent = 'В поле «Иероглифы» только китайские символы, без пробелов и знаков.';
    return;
  }
  el.pickerError.textContent = '';
  clearSuggestions();

  if (window.pinyinPro) {
    el.addPinyin.value = pinyinPro.pinyin(hanzi, { type: 'array' }).join('');
  }

  el.lookupBtn.disabled = true;
  el.lookupBtn.textContent = 'Ищу…';
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(hanzi)}&langpair=zh-CN|ru`;
    const res = await fetch(url);
    const data = await res.json();
    if (Number(data.responseStatus) !== 200) {
      throw new Error(data.responseDetails || 'сервис недоступен');
    }

    const isGood = (s) => s && s !== hanzi && !/[\u4e00-\u9fff]/.test(s) && s.length <= 60;
    const options = [];
    const main = ((data.responseData && data.responseData.translatedText) || '').trim();
    if (isGood(main)) options.push(main);
    (data.matches || []).forEach((m) => {
      const t = (m.translation || '').trim();
      if (isGood(t) && !options.includes(t)) options.push(t);
    });
    if (options.length === 0) throw new Error('перевод не найден');

    el.addTranslation.value = options[0];

    // Остальные варианты показываем кнопками: клик подставляет перевод
    options.slice(1, 5).forEach((opt) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'picker-suggestion';
      chip.textContent = opt;
      chip.addEventListener('click', () => (el.addTranslation.value = opt));
      el.addSuggestions.appendChild(chip);
    });
    el.addSuggestions.hidden = el.addSuggestions.children.length === 0;
  } catch (e) {
    el.pickerError.textContent = `Перевод не найден автоматически (${e.message}). Впишите его вручную.`;
  } finally {
    el.lookupBtn.disabled = false;
    el.lookupBtn.textContent = 'Найти';
  }
}

async function addCustomWord() {
  const hanzi = el.addHanzi.value.trim();
  const pinyin = el.addPinyin.value.trim().replace(/\s+/g, ' ');
  const translation = el.addTranslation.value.trim();
  const book = el.addBook.value;
  const bookTitle = (BOOKS.find((b) => b.id === book) || {}).title || book;

  if (!/^[\u4e00-\u9fff]+$/.test(hanzi)) {
    el.pickerError.textContent = 'В поле «Иероглифы» только китайские символы, без пробелов и знаков.';
    return;
  }
  // Поля пустые — сначала подставляем данные, чтобы их можно было проверить
  if (!pinyin || !translation) {
    lookupWord();
    return;
  }

  // Слово уже есть в этом учебнике — просто отмечаем его
  const exists = LESSONS.some(
    (l) => (l.book || 'hsk1') === book && l.words.some((w) => w.hanzi === hanzi)
  );
  if (exists) {
    selectExistingWord(book, hanzi);
    el.pickerError.textContent = `Слово ${hanzi} уже есть в ${bookTitle}, оно отмечено.`;
    return;
  }

  el.addWordBtn.disabled = true;
  const { error } = await sb.from('extra_words').insert({ book, hanzi, pinyin, translation });
  el.addWordBtn.disabled = false;
  if (error) {
    el.pickerError.textContent = 'Не удалось сохранить слово: ' + error.message;
    return;
  }

  // Перечитываем учебники и перерисовываем список, сохранив выбор
  const selected = currentSelection();
  await loadExtraWords();
  selected.push({ hanzi, pinyin: [pinyin], translation });
  renderPicker(selected);
  selectExistingWord(book, hanzi);

  el.addHanzi.value = '';
  el.addPinyin.value = '';
  el.addTranslation.value = '';
  clearSuggestions();
  el.pickerError.textContent = `Слово добавлено в ${bookTitle} («Дополнительные слова») и отмечено в подборке.`;
}

async function deleteExtraWord(word) {
  if (!confirm(`Удалить слово «${word.hanzi}» из учебника? Оно пропадёт у всех ваших учеников. В уже сохранённых подборках оно останется.`)) return;

  const { error } = await sb.from('extra_words').delete().eq('id', word.extraId);
  if (error) {
    el.pickerError.textContent = 'Не удалось удалить: ' + error.message;
    return;
  }
  const selected = currentSelection().filter((w) => w.extraId !== word.extraId);
  await loadExtraWords();
  renderPicker(selected);
  el.pickerError.textContent = '';
}

el.addWordBtn.addEventListener('click', addCustomWord);
el.lookupBtn.addEventListener('click', lookupWord);
el.addHanzi.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    lookupWord();
  }
});
[el.addPinyin, el.addTranslation].forEach((input) =>
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomWord();
    }
  })
);

function renderPicker(selectedWords) {
  el.pickerList.innerHTML = '';
  pickerWords = [];

  const existingHanzi = new Set(selectedWords.map((w) => w.hanzi));
  const knownHanzi = new Set(LESSONS.flatMap((l) => l.words.map((w) => w.hanzi)));

  // «Свои слова»: слова из старых подборок, которых нет ни в одном учебнике
  const ownGroup = document.createElement('div');
  ownGroup.className = 'picker-book-group';
  const ownHead = document.createElement('div');
  ownHead.className = 'picker-book';
  ownHead.textContent = 'Свои слова (только у этого ученика)';
  pickerOwnLessonGroup = document.createElement('div');
  pickerOwnLessonGroup.className = 'picker-lesson-group';
  ownGroup.append(ownHead, pickerOwnLessonGroup);
  el.pickerList.appendChild(ownGroup);

  selectedWords
    .filter((w) => !knownHanzi.has(w.hanzi))
    .forEach((w) => pickerOwnLessonGroup.appendChild(createPickerRow(w, true)));

  BOOKS.forEach((book) => {
    const lessons = LESSONS.filter((l) => (l.book || 'hsk1') === book.id);
    if (lessons.length === 0) return;

    const bookGroup = document.createElement('div');
    bookGroup.className = 'picker-book-group';
    bookGroup.dataset.book = book.id;

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
        const label = createPickerRow(word, existingHanzi.has(word.hanzi));
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
}

function openPicker(userId, userEmail, existingWords) {
  currentPickerUserId = userId;
  el.pickerTitle.textContent = `Подборка для ${userEmail}`;
  el.pickerError.textContent = '';
  el.pickerSearch.value = '';
  el.addHanzi.value = '';
  el.addPinyin.value = '';
  el.addTranslation.value = '';
  clearSuggestions();

  renderPicker(existingWords || []);
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
    .map((cb) => {
      const { extraId, ...word } = pickerWords[Number(cb.value)];
      return word; // служебное поле extraId в подборку не попадает
    })
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

  // Код и ссылка для регистрации учеников этого преподавателя
  el.inviteCode.textContent = profile.invite_code || '—';
  el.copyInviteBtn.addEventListener('click', async () => {
    const url = new URL('index.html', window.location.href);
    url.searchParams.set('t', profile.invite_code);
    try {
      await navigator.clipboard.writeText(url.href);
      el.copyInviteBtn.textContent = 'Скопировано ✓';
    } catch (e) {
      window.prompt('Скопируйте ссылку:', url.href);
    }
    setTimeout(() => (el.copyInviteBtn.textContent = 'Скопировать ссылку'), 2000);
  });

  await loadExtraWords();
  loadUsers();
})();
