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
  tabStudents: document.getElementById('tabStudents'),
  tabWords: document.getElementById('tabWords'),
  wordsList: document.getElementById('wordsList'),
  wordsEmpty: document.getElementById('wordsEmpty'),
  wordsSearch: document.getElementById('wordsSearch'),
  wordsCount: document.getElementById('wordsCount'),
  wordsStatus: document.getElementById('wordsStatus'),
  statsOverlay: document.getElementById('statsOverlay'),
  statsTitle: document.getElementById('statsTitle'),
  statsSummary: document.getElementById('statsSummary'),
  statsSort: document.getElementById('statsSort'),
  statsSearch: document.getElementById('statsSearch'),
  statsList: document.getElementById('statsList'),
  statsError: document.getElementById('statsError'),
  statsPickBtn: document.getElementById('statsPickBtn'),
  statsHardBtn: document.getElementById('statsHardBtn'),
  statsCloseBtn: document.getElementById('statsCloseBtn'),
};

// Список учебников в форме добавления слова
BOOKS.forEach((b) => {
  const opt = document.createElement('option');
  opt.value = b.id;
  opt.textContent = bookLabel(b);
  el.addBook.appendChild(opt);
});

let currentPickerUserId = null;
let customByUserCache = {}; // подборки учеников — нужны статистике, чтобы дополнять их

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

async function loadUsers() {
  // Сводка по ученикам считается в базе (функция students_overview): так числа
  // остаются точными, даже когда записей прогресса больше 1000.
  const [{ data: profiles, error: profilesError }, { data: overview, error: overviewError }, { data: customLists }] = await Promise.all([
    sb.from('profiles').select('*').order('created_at'),
    sb.rpc('students_overview'),
    sb.from('custom_word_lists').select('user_id, words'),
  ]);

  if (profilesError) {
    console.error('Не удалось загрузить пользователей:', profilesError.message);
    el.usersEmpty.hidden = false;
    el.usersEmpty.textContent = 'Не удалось загрузить список пользователей.';
    return;
  }
  if (overviewError) {
    console.error('Не удалось загрузить сводку (выполнен ли stats.sql?):', overviewError.message);
  }

  const progressByUser = {};
  const lessonPartsByUser = {};
  (overview || []).forEach((r) => {
    progressByUser[r.user_id] = {
      count: Number(r.passes),
      mistakesSum: Number(r.mistakes_total),
      last: r.last_at,
    };
    lessonPartsByUser[r.user_id] = Number(r.lesson_parts);
  });

  const customByUser = {};
  (customLists || []).forEach((c) => {
    customByUser[c.user_id] = c.words;
  });
  customByUserCache = customByUser;

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
      <td class="actions-cell">
        <button class="ghost-btn stats-open-btn" data-user-id="${profile.id}" data-user-name="${escapeHtml(displayName)}">Статистика</button>
        <button class="ghost-btn picker-open-btn" data-user-id="${profile.id}" data-user-email="${escapeHtml(displayName)}">${hasCustom ? 'Изменить' : 'Назначить'}</button>
      </td>
    `;
    el.usersTableBody.appendChild(tr);
  });

  el.usersTableBody.querySelectorAll('.picker-open-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      openPicker(btn.dataset.userId, btn.dataset.userEmail, customByUser[btn.dataset.userId] || null);
    });
  });

  el.usersTableBody.querySelectorAll('.stats-open-btn').forEach((btn) => {
    btn.addEventListener('click', () => openStats(btn.dataset.userId, btn.dataset.userName));
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
  return label;
}

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
    bookHead.textContent = bookLabel(book);
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

// ============================================================
// Вкладка «Слова»: добавление слов в учебники и список добавленных
// ============================================================

function setWordsStatus(text, ok = false) {
  el.wordsStatus.textContent = text;
  el.wordsStatus.className = 'words-status' + (ok ? ' ok' : '');
}

function clearSuggestions() {
  el.addSuggestions.innerHTML = '';
  el.addSuggestions.hidden = true;
}

function showTab(name) {
  el.tabStudents.hidden = name !== 'students';
  el.tabWords.hidden = name !== 'words';
  document.querySelectorAll('.admin-tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  if (name === 'words') renderWordsTab();
}

document.querySelectorAll('.admin-tab').forEach((btn) => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
});

// Подставляет пиньинь (локально) и перевод (из интернета) по иероглифам
async function lookupWord() {
  const hanzi = el.addHanzi.value.trim();
  if (!/^[\u4e00-\u9fff]+$/.test(hanzi)) {
    setWordsStatus('В поле «Иероглифы» только китайские символы, без пробелов и знаков.');
    return;
  }
  setWordsStatus('');
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
    setWordsStatus(`Перевод не найден автоматически (${e.message}). Впишите его вручную.`);
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
  const bookObj = BOOKS.find((b) => b.id === book);
  const bookTitle = bookObj ? bookLabel(bookObj) : book;

  if (!/^[\u4e00-\u9fff]+$/.test(hanzi)) {
    setWordsStatus('В поле «Иероглифы» только китайские символы, без пробелов и знаков.');
    return;
  }
  // Поля пустые — сначала подставляем данные, чтобы их можно было проверить
  if (!pinyin || !translation) {
    lookupWord();
    return;
  }

  // Слово уже есть в этом учебнике
  const exists = LESSONS.some(
    (l) => (l.book || 'hsk1') === book && l.words.some((w) => w.hanzi === hanzi)
  );
  if (exists) {
    setWordsStatus(`Слово ${hanzi} уже есть в ${bookTitle}.`);
    return;
  }

  el.addWordBtn.disabled = true;
  const { error } = await sb.from('extra_words').insert({ book, hanzi, pinyin, translation });
  el.addWordBtn.disabled = false;
  if (error) {
    setWordsStatus('Не удалось сохранить слово: ' + error.message);
    return;
  }

  await loadExtraWords();
  renderWordsTab();

  el.addHanzi.value = '';
  el.addPinyin.value = '';
  el.addTranslation.value = '';
  clearSuggestions();
  setWordsStatus(`Слово ${hanzi} добавлено в ${bookTitle} («Дополнительные слова»).`, true);
  el.addHanzi.focus();
}

async function deleteExtraWord(word) {
  if (!confirm(`Удалить слово «${word.hanzi}» из учебника? Оно пропадёт у всех ваших учеников. В уже сохранённых подборках оно останется.`)) return;

  const { error } = await sb.from('extra_words').delete().eq('id', word.extraId);
  if (error) {
    setWordsStatus('Не удалось удалить: ' + error.message);
    return;
  }
  await loadExtraWords();
  renderWordsTab();
  setWordsStatus(`Слово ${word.hanzi} удалено.`, true);
}

// Список добавленных слов по учебникам, новые сверху
function renderWordsTab() {
  const q = el.wordsSearch.value.trim().toLowerCase();
  const extraLessons = LESSONS.filter((l) => l.extra);
  const totalAll = extraLessons.reduce((n, l) => n + l.words.length, 0);

  el.wordsList.innerHTML = '';
  let shown = 0;

  extraLessons.forEach((lesson) => {
    const words = lesson.words
      .filter((w) => !q || `${w.hanzi} ${w.pinyin.join(' ')} ${w.translation}`.toLowerCase().includes(q))
      .reverse();
    if (words.length === 0) return;
    shown += words.length;

    const book = BOOKS.find((b) => b.id === lesson.book);
    const head = document.createElement('div');
    head.className = 'words-book';
    head.textContent = `${book ? bookLabel(book) : lesson.book} · ${words.length}`;
    el.wordsList.appendChild(head);

    words.forEach((w) => {
      const row = document.createElement('div');
      row.className = 'words-row';

      const hanzi = document.createElement('span');
      hanzi.className = 'words-hanzi';
      hanzi.textContent = w.hanzi;
      const pinyin = document.createElement('span');
      pinyin.className = 'words-pinyin';
      pinyin.textContent = w.pinyin.join(' ');
      const tr = document.createElement('span');
      tr.className = 'words-translation';
      tr.textContent = w.translation;

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'picker-del';
      del.title = 'Удалить слово из учебника';
      del.textContent = '✕';
      del.addEventListener('click', () => deleteExtraWord(w));

      row.append(hanzi, pinyin, tr, del);
      el.wordsList.appendChild(row);
    });
  });

  el.wordsCount.textContent = totalAll ? `(${totalAll})` : '';
  el.wordsEmpty.hidden = shown > 0;
  el.wordsEmpty.textContent = totalAll
    ? 'Ничего не найдено'
    : 'Вы ещё не добавляли слов. Добавьте первое в форме выше.';
}

el.wordsSearch.addEventListener('input', renderWordsTab);
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

// ============================================================
// Подробная статистика по ученику
// ============================================================

let statsUser = null;      // { id, name }
let statsRows = [];        // по одной строке на иероглиф
const statsSelected = new Set(); // отмеченные иероглифы

const STATS_SORTERS = {
  mistakes: (a, b) => b.mistakes - a.mistakes || b.avg - a.avg,
  avg: (a, b) => b.avg - a.avg || b.passes - a.passes,
  passes: (a, b) => b.passes - a.passes || b.mistakes - a.mistakes,
  recent: (a, b) => new Date(b.last) - new Date(a.last),
};

async function openStats(userId, name) {
  statsUser = { id: userId, name };
  statsRows = [];
  statsSelected.clear();
  el.statsTitle.textContent = `Статистика: ${name}`;
  el.statsError.textContent = '';
  el.statsSummary.textContent = '';
  el.statsSearch.value = '';
  el.statsSort.value = 'mistakes';
  el.statsList.innerHTML = '<div class="admin-empty">Загрузка…</div>';
  updateStatsPickLabel();
  el.statsOverlay.hidden = false;

  const { data, error } = await sb.rpc('student_char_stats', { uid: userId });
  if (error) {
    el.statsList.innerHTML = '';
    el.statsError.textContent = 'Не удалось загрузить статистику: ' + error.message;
    return;
  }

  statsRows = (data || []).map((r) => {
    const passes = Number(r.passes);
    const mistakes = Number(r.mistakes_total);
    return {
      hanzi: r.hanzi,
      words: r.words || [],
      passes,
      mistakes,
      clean: Number(r.clean_passes),
      avg: passes ? mistakes / passes : 0,
      last: r.last_at,
    };
  });
  renderStats();
}

function updateStatsPickLabel() {
  el.statsPickBtn.textContent = statsSelected.size
    ? `Назначить слова с отмеченными (${statsSelected.size})`
    : 'Назначить слова с отмеченными';
}

function renderStats() {
  // Сводка по всем иероглифам ученика
  if (statsRows.length === 0) {
    el.statsSummary.textContent = 'Пока нет данных: ученик ещё не прошёл ни одного иероглифа.';
  } else {
    const passes = statsRows.reduce((n, r) => n + r.passes, 0);
    const mistakes = statsRows.reduce((n, r) => n + r.mistakes, 0);
    const clean = statsRows.reduce((n, r) => n + r.clean, 0);
    el.statsSummary.textContent =
      `Иероглифов: ${statsRows.length} · проходов: ${passes} · ошибок: ${mistakes} · ` +
      `без ошибок: ${Math.round((clean / passes) * 100)}% проходов`;
  }

  const q = el.statsSearch.value.trim();
  const rows = statsRows
    .filter((r) => !q || r.hanzi.includes(q) || r.words.some((w) => w.includes(q)))
    .sort(STATS_SORTERS[el.statsSort.value] || STATS_SORTERS.mistakes);

  el.statsList.innerHTML = '';
  if (rows.length === 0) {
    if (statsRows.length > 0) {
      el.statsList.innerHTML = '<div class="admin-empty">Ничего не найдено</div>';
    }
    return;
  }

  const table = document.createElement('table');
  table.className = 'stats-table';
  table.innerHTML = `
    <thead><tr>
      <th></th>
      <th>Иероглиф</th>
      <th class="stats-num" title="Сколько раз иероглиф был полностью написан (3 попытки подряд)">Проходов</th>
      <th class="stats-num" title="Неверных штрихов за все проходы">Ошибок</th>
      <th class="stats-num" title="Ошибок на один проход">В среднем</th>
      <th class="stats-num" title="Проходов без единой ошибки">Без ошибок</th>
    </tr></thead>`;
  const tbody = document.createElement('tbody');

  rows.forEach((r) => {
    const tr = document.createElement('tr');

    const tdCb = document.createElement('td');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = statsSelected.has(r.hanzi);
    cb.addEventListener('change', () => {
      if (cb.checked) statsSelected.add(r.hanzi);
      else statsSelected.delete(r.hanzi);
      updateStatsPickLabel();
    });
    tdCb.appendChild(cb);

    const tdHanzi = document.createElement('td');
    const big = document.createElement('div');
    big.className = 'stats-hanzi';
    big.textContent = r.hanzi;
    const small = document.createElement('div');
    small.className = 'stats-words';
    small.textContent = r.words.join(', ');
    small.title = `Последний раз: ${formatDate(r.last)}`;
    tdHanzi.append(big, small);

    const num = (text, cls) => {
      const td = document.createElement('td');
      td.className = 'stats-num' + (cls ? ' ' + cls : '');
      td.textContent = text;
      return td;
    };
    const avgCls = r.avg >= 2 ? 'stats-hard' : r.avg >= 1 ? 'stats-mid' : '';

    tr.append(
      tdCb,
      tdHanzi,
      num(r.passes),
      num(r.mistakes),
      num(r.avg.toFixed(1), avgCls),
      num(`${r.clean} из ${r.passes}`)
    );
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  el.statsList.appendChild(table);
}

function closeStats() {
  el.statsOverlay.hidden = true;
  statsUser = null;
}

// Слова, в которых встречаются отмеченные иероглифы, добавляем к подборке ученика
function assignFromStats() {
  if (!statsUser) return;
  if (statsSelected.size === 0) {
    el.statsError.textContent = 'Отметьте иероглифы, по которым нужны слова.';
    return;
  }

  const wantedWords = new Set();
  statsRows
    .filter((r) => statsSelected.has(r.hanzi))
    .forEach((r) => r.words.forEach((w) => wantedWords.add(w)));

  const custom = customByUserCache[statsUser.id] || [];
  const known = new Map();
  LESSONS.forEach((l) => l.words.forEach((w) => { if (!known.has(w.hanzi)) known.set(w.hanzi, w); }));
  custom.forEach((w) => { if (!known.has(w.hanzi)) known.set(w.hanzi, w); });

  const merged = new Map(custom.map((w) => [w.hanzi, w])); // уже назначенные остаются
  const missing = [];
  wantedWords.forEach((h) => {
    const w = known.get(h);
    if (w) merged.set(h, w);
    else missing.push(h);
  });

  const { id, name } = statsUser;
  closeStats();
  openPicker(id, name, Array.from(merged.values()));
  if (missing.length) {
    el.pickerError.textContent = `Этих слов нет в учебниках, они не добавлены: ${missing.join(', ')}`;
  }
}

el.statsSort.addEventListener('change', renderStats);
el.statsSearch.addEventListener('input', renderStats);
el.statsCloseBtn.addEventListener('click', closeStats);
el.statsPickBtn.addEventListener('click', assignFromStats);
el.statsHardBtn.addEventListener('click', () => {
  statsRows.filter((r) => r.avg >= 1).forEach((r) => statsSelected.add(r.hanzi));
  updateStatsPickLabel();
  renderStats();
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
