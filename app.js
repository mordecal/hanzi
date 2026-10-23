const el = {
  pinyin: document.getElementById('pinyinDisplay'),
  translation: document.getElementById('translationDisplay'),
  charsRow: document.getElementById('charsRow'),
  gridWrap: document.getElementById('gridWrap'),
  target: document.getElementById('writerTarget'),
  dots: document.querySelectorAll('#attemptDots .dot'),
  attemptLabel: document.getElementById('attemptLabel'),
  mistakesLabel: document.getElementById('mistakesLabel'),
  replayBtn: document.getElementById('replayBtn'),
  nextWordBtn: document.getElementById('nextWordBtn'),
  audioBtn: document.getElementById('audioBtn'),
  wordCounter: document.getElementById('wordCounter'),
  progressSegments: document.getElementById('progressSegments'),
  taskTitle: document.getElementById('taskTitle'),
  doneOverlay: document.getElementById('doneOverlay'),
  doneTitle: document.getElementById('doneTitle'),
  doneCount: document.getElementById('doneCount'),
  restartBtn: document.getElementById('restartBtn'),
  authOverlay: document.getElementById('authOverlay'),
  appRoot: document.getElementById('appRoot'),
  authForm: document.getElementById('authForm'),
  authEmail: document.getElementById('authEmail'),
  authPassword: document.getElementById('authPassword'),
  authError: document.getElementById('authError'),
  authSubmitBtn: document.getElementById('authSubmitBtn'),
  authToggleModeBtn: document.getElementById('authToggleModeBtn'),
  accountEmail: document.getElementById('accountEmail'),
  adminLink: document.getElementById('adminLink'),
  logoutBtn: document.getElementById('logoutBtn'),
  backToLessonsBtn: document.getElementById('backToLessonsBtn'),
  lessonsRoot: document.getElementById('lessonsRoot'),
  lessonsList: document.getElementById('lessonsList'),
  accountEmailLessons: document.getElementById('accountEmailLessons'),
  adminLinkLessons: document.getElementById('adminLinkLessons'),
  logoutBtnLessons: document.getElementById('logoutBtnLessons'),
  nameOverlay: document.getElementById('nameOverlay'),
  nameForm: document.getElementById('nameForm'),
  nameFirst: document.getElementById('nameFirst'),
  nameLast: document.getElementById('nameLast'),
  nameError: document.getElementById('nameError'),
  nameSubmitBtn: document.getElementById('nameSubmitBtn'),
};

// Активный список слов: подставляется либо частью урока, либо (если админ
// назначил пользователю индивидуальную подборку) — этой подборкой целиком.
let WORDS = [];

const state = {
  wordIndex: 0,
  charIndex: 0,
  attempt: 0,
  mistakes: 0,
  charMistakesTotal: 0,
  doneChars: new Set(),
  busy: false,
  userId: null,
  customMode: false, // true — индивидуальная подборка от админа, без деления на уроки
  lessonId: null,
  partIndex: null,
};
let writer = null;

const WRITER_OPTS = {
  width: 260,
  height: 260,
  padding: 12,
  showCharacter: false,
  showOutline: true,
  strokeAnimationSpeed: 1,
  delayBetweenStrokes: 220,
  strokeColor: '#16181D',
  radicalColor: '#16181D',
  outlineColor: '#B1AFB3',
  drawingColor: '#16181D',
  highlightColor: '#6B7A99',
};

function renderSegments(index) {
  el.progressSegments.innerHTML = '';
  WORDS.forEach((_, i) => {
    const s = document.createElement('span');
    s.className = 'segment' + (i < index ? ' done' : i === index ? ' current' : '');
    el.progressSegments.appendChild(s);
  });
}

function loadWord(index) {
  state.wordIndex = index;
  state.charIndex = 0;
  state.doneChars = new Set();
  const word = WORDS[index];

  el.pinyin.textContent = word.pinyin.join(' ');
  el.translation.textContent = word.translation;
  el.wordCounter.textContent = `Слово ${index + 1} из ${WORDS.length}`;
  renderSegments(index);
  el.taskTitle.textContent = `Напишите «${word.translation}»`;
  el.nextWordBtn.disabled = true;

  renderThumbs(word);
  loadChar(0);
}

function renderThumbs(word) {
  el.charsRow.innerHTML = '';
  word.hanzi.split('').forEach((ch, i) => {
    const d = document.createElement('div');
    d.className = 'char-thumb';
    d.textContent = ch;
    d.dataset.i = i;
    el.charsRow.appendChild(d);
  });
  refreshThumbs();
}

function refreshThumbs() {
  const nodes = el.charsRow.querySelectorAll('.char-thumb');
  nodes.forEach((n, i) => {
    n.classList.toggle('active', i === state.charIndex);
    n.classList.toggle('done', state.doneChars.has(i));
  });
  el.charsRow.classList.remove('concealed'); // сбрасываем при каждом переходе к новому иероглифу
}

function loadChar(charIndex) {
  state.charIndex = charIndex;
  state.attempt = 0;
  state.mistakes = 0;
  state.charMistakesTotal = 0;
  refreshThumbs();
  el.target.innerHTML = '';
  el.mistakesLabel.textContent = '';
  updateAttemptUI('demo');

  const char = WORDS[state.wordIndex].hanzi[charIndex];
  const size = el.gridWrap.clientWidth || 320;
  writer = HanziWriter.create(el.target, char, { ...WRITER_OPTS, width: size, height: size });

  state.busy = true;
  el.replayBtn.disabled = true;
  writer.animateCharacter({
    onComplete: () => {
      state.busy = false;
      el.replayBtn.disabled = false;
      startQuizRound(1);
    },
  });
}

function startQuizRound(n) {
  state.attempt = n;
  state.mistakes = 0;
  el.mistakesLabel.textContent = '';
  updateAttemptUI(n);

  // showOutline влияет только на первый рендер writer'а, поэтому переключаем
  // видимость контура явными методами, а не через опцию в quiz().
  if (n < 3) {
    writer.showOutline();
  } else {
    writer.hideOutline();
  }

  // На 3-й попытке скрываем весь прогресс по слову (ряд иероглифов сверху) —
  // должен остаться только пиньинь, без каких-либо визуальных подсказок.
  el.charsRow.classList.toggle('concealed', n === 3);

  writer.quiz({
    onMistake: () => {
      state.mistakes++;
      state.charMistakesTotal++;
      el.mistakesLabel.textContent = `Ошибки в этой попытке: ${state.mistakes}`;
      flashGrid('mistake');
    },
    onCorrectStroke: () => {},
    onComplete: () => {
      flashGrid('success');
      if (state.attempt < 3) {
        setTimeout(() => startQuizRound(state.attempt + 1), 650);
      } else {
        charCompleted();
      }
    },
  });
}

function charCompleted() {
  state.doneChars.add(state.charIndex);
  refreshThumbs();
  const word = WORDS[state.wordIndex];
  recordProgress(word, word.hanzi[state.charIndex], state.charMistakesTotal);

  if (state.charIndex < word.hanzi.length - 1) {
    setTimeout(() => loadChar(state.charIndex + 1), 800);
  } else {
    el.attemptLabel.textContent = 'Слово выучено! Нажмите «Следующее слово».';
    el.nextWordBtn.disabled = false;
  }
}

// Отправляем событие о пройденном иероглифе в Supabase. Ошибки записи прогресса
// не должны мешать самому обучению, поэтому просто логируем их в консоль.
async function recordProgress(word, hanzi, mistakes) {
  if (!state.userId) return;
  try {
    await sb.from('progress').insert({
      user_id: state.userId,
      word: word.hanzi,
      hanzi,
      mistakes,
    });
  } catch (e) {
    console.error('Не удалось сохранить прогресс:', e);
  }
}

function updateAttemptUI(phase) {
  el.dots.forEach((dot) => {
    const n = Number(dot.dataset.n);
    dot.classList.toggle('filled', typeof phase === 'number' ? n < phase : false);
    dot.classList.toggle('current', typeof phase === 'number' ? n === phase : n === 1);
  });
  if (phase === 'demo') {
    el.attemptLabel.textContent = 'Смотрите, как пишется иероглиф…';
  } else if (phase === 1) {
    el.attemptLabel.textContent = 'Попытка 1 из 3 · обведите по контуру';
  } else if (phase === 2) {
    el.attemptLabel.textContent = 'Попытка 2 из 3 · обведите по контуру';
  } else if (phase === 3) {
    el.attemptLabel.textContent = 'Попытка 3 из 3 · без подсказки, только пиньинь';
  }
}

function flashGrid(kind) {
  el.gridWrap.classList.remove('mistake', 'success');
  void el.gridWrap.offsetWidth;
  el.gridWrap.classList.add(kind);
  setTimeout(() => el.gridWrap.classList.remove(kind), kind === 'mistake' ? 300 : 550);
}

el.replayBtn.addEventListener('click', () => {
  if (!writer || state.busy) return;
  state.busy = true;
  el.replayBtn.disabled = true;
  const attemptBefore = state.attempt || 1;
  writer.animateCharacter({
    onComplete: () => {
      state.busy = false;
      el.replayBtn.disabled = false;
      startQuizRound(attemptBefore);
    },
  });
});

function speakWithBrowserTTS(word) {
  if (!('speechSynthesis' in window)) {
    alert('Синтез речи не поддерживается в этом браузере.');
    return;
  }
  const utter = new SpeechSynthesisUtterance(word.hanzi);
  utter.lang = 'zh-CN';
  utter.rate = 0.85;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

// Публичные ссылки вида disk.yandex.ru/d/... и yadi.sk/... ведут на HTML-страницу,
// а не на сам файл. Эта функция превращает такую ссылку в настоящую прямую ссылку
// через API Яндекс.Диска. Ссылка на файл действует ограниченное время, поэтому
// запрашиваем её заново перед каждым воспроизведением, а не храним заранее.
const yandexDirectLinkCache = new Map();

function isYandexDiskShareLink(url) {
  return /^(https?:\/\/)?(disk\.yandex\.[a-z.]+|yadi\.sk)\//i.test(url);
}

async function resolveAudioSrc(url) {
  if (!isYandexDiskShareLink(url)) return url; // локальный путь или обычный прямой URL — как есть

  if (yandexDirectLinkCache.has(url)) return yandexDirectLinkCache.get(url);

  const apiUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(url)}`;
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`Яндекс.Диск API вернул ошибку: ${res.status}`);
  const data = await res.json();
  yandexDirectLinkCache.set(url, data.href);
  return data.href;
}

el.audioBtn.addEventListener('click', async () => {
  const word = WORDS[state.wordIndex];

  if (!word.audio) {
    speakWithBrowserTTS(word);
    return;
  }

  try {
    const src = await resolveAudioSrc(word.audio);
    const player = new Audio(src);
    player.addEventListener('error', () => speakWithBrowserTTS(word));
    await player.play();
  } catch (e) {
    // Файл не найден, API недоступен из браузера (CORS) или ссылка истекла —
    // тихо откатываемся на встроенный синтез речи.
    speakWithBrowserTTS(word);
  }
});

el.nextWordBtn.addEventListener('click', async () => {
  const next = state.wordIndex + 1;
  if (next < WORDS.length) {
    loadWord(next);
    return;
  }

  if (!state.customMode && state.lessonId !== null) {
    await recordPartCompletion(state.lessonId, state.partIndex);
    el.doneTitle.textContent = 'Часть урока пройдена!';
    el.restartBtn.textContent = 'К урокам';
  } else {
    el.doneTitle.textContent = 'Все слова пройдены!';
    el.restartBtn.textContent = 'Начать заново';
  }
  el.doneCount.textContent = WORDS.length;
  el.doneOverlay.hidden = false;
});

el.restartBtn.addEventListener('click', () => {
  el.doneOverlay.hidden = true;
  if (state.customMode) {
    loadWord(0);
  } else {
    el.appRoot.hidden = true;
    el.lessonsRoot.hidden = false;
    renderLessonsMenu();
  }
});

// ============================================================
// Авторизация
// ============================================================

let authMode = 'signin'; // 'signin' | 'signup'

function showAuthScreen() {
  el.authOverlay.hidden = false;
  el.appRoot.hidden = true;
  el.lessonsRoot.hidden = true;
}

// Возвращает индивидуальную подборку пользователя, если админ её назначил,
// иначе null — тогда используется обычный режим с уроками.
async function loadCustomWordsForUser(userId) {
  try {
    const { data, error } = await sb
      .from('custom_word_lists')
      .select('words')
      .eq('user_id', userId)
      .maybeSingle();
    if (!error && data && Array.isArray(data.words) && data.words.length > 0) {
      return data.words;
    }
  } catch (e) {
    console.error('Не удалось загрузить индивидуальную подборку:', e);
  }
  return null;
}

// Показывает окно «Как вас зовут?» и ждёт, пока имя будет сохранено.
function askForName(profile) {
  return new Promise((resolve) => {
    el.nameError.textContent = '';
    el.nameOverlay.hidden = false;
    el.nameFirst.focus();

    el.nameForm.onsubmit = async (e) => {
      e.preventDefault();
      const first_name = el.nameFirst.value.trim();
      const last_name = el.nameLast.value.trim();
      if (!first_name || !last_name) {
        el.nameError.textContent = 'Заполните имя и фамилию.';
        return;
      }

      el.nameSubmitBtn.disabled = true;
      const { error } = await sb.from('profiles').update({ first_name, last_name }).eq('id', profile.id);
      el.nameSubmitBtn.disabled = false;

      if (error) {
        el.nameError.textContent = 'Не удалось сохранить: ' + error.message;
        return;
      }

      profile.first_name = first_name;
      profile.last_name = last_name;
      el.nameOverlay.hidden = true;
      resolve();
    };
  });
}

async function startAppForProfile(profile) {
  state.userId = profile.id;
  el.authOverlay.hidden = true;
  el.authError.textContent = '';
  el.authForm.reset();

  if (!profile.first_name || !profile.last_name) {
    await askForName(profile);
  }

  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email || '';
  [el.accountEmail, el.accountEmailLessons].forEach((n) => (n.textContent = displayName));
  [el.adminLink, el.adminLinkLessons].forEach((n) => (n.hidden = profile.role !== 'admin'));

  const customWords = await loadCustomWordsForUser(profile.id);

  if (customWords) {
    // Админ назначил индивидуальный список — единый плоский список без уроков.
    state.customMode = true;
    state.lessonId = null;
    state.partIndex = null;
    WORDS = customWords;
    el.backToLessonsBtn.hidden = true;
    el.lessonsRoot.hidden = true;
    el.appRoot.hidden = false;
    loadWord(0);
  } else {
    state.customMode = false;
    el.appRoot.hidden = true;
    el.lessonsRoot.hidden = false;
    renderLessonsMenu();
  }
}

// ============================================================
// Уроки и части
// ============================================================

async function renderLessonsMenu() {
  el.lessonsList.innerHTML = '<div class="admin-empty">Загрузка…</div>';

  let completedSet = new Set();
  if (state.userId) {
    try {
      const { data } = await sb.from('lesson_progress').select('lesson_id, part_index').eq('user_id', state.userId);
      (data || []).forEach((r) => completedSet.add(`${r.lesson_id}::${r.part_index}`));
    } catch (e) {
      console.error('Не удалось загрузить прогресс по урокам:', e);
    }
  }

  el.lessonsList.innerHTML = '';

  LESSONS.forEach((lesson) => {
    const parts = splitLessonIntoParts(lesson);

    const block = document.createElement('div');
    block.className = 'lesson-block';

    const heading = document.createElement('div');
    heading.className = 'lesson-heading';
    heading.textContent = lesson.title;
    block.appendChild(heading);

    const row = document.createElement('div');
    row.className = 'lesson-parts-row';

    parts.forEach((partWords, i) => {
      const done = completedSet.has(`${lesson.id}::${i}`);
      const btn = document.createElement('button');
      btn.className = 'ghost-btn lesson-part-btn' + (done ? ' done' : '');
      btn.textContent = `Часть ${i + 1} · ${partWords.length} симв.${done ? ' ✓' : ''}`;
      btn.addEventListener('click', () => startLessonPart(lesson.id, i));
      row.appendChild(btn);
    });

    block.appendChild(row);
    el.lessonsList.appendChild(block);
  });
}

async function startLessonPart(lessonId, partIndex) {
  const lesson = LESSONS.find((l) => l.id === lessonId);
  const parts = splitLessonIntoParts(lesson);
  const partWords = parts[partIndex];

  let alreadyCompleted = false;
  if (state.userId) {
    try {
      const { data } = await sb
        .from('lesson_progress')
        .select('completed_at')
        .eq('user_id', state.userId)
        .eq('lesson_id', lessonId)
        .eq('part_index', partIndex)
        .maybeSingle();
      alreadyCompleted = Boolean(data);
    } catch (e) {
      console.error('Не удалось проверить прогресс по части урока:', e);
    }
  }

  // Первое прохождение — иероглифы в исходном порядке.
  // Если часть уже была пройдена раньше — перемешиваем.
  WORDS = alreadyCompleted ? shuffleWords(partWords) : partWords;

  state.customMode = false;
  state.lessonId = lessonId;
  state.partIndex = partIndex;

  el.lessonsRoot.hidden = true;
  el.appRoot.hidden = false;
  el.backToLessonsBtn.hidden = false;

  loadWord(0);
}

// Отмечаем часть урока как пройденную — при следующем заходе она перемешается.
async function recordPartCompletion(lessonId, partIndex) {
  if (!state.userId) return;
  try {
    await sb.from('lesson_progress').upsert({
      user_id: state.userId,
      lesson_id: lessonId,
      part_index: partIndex,
      completed_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Не удалось сохранить прогресс по части урока:', e);
  }
}

el.backToLessonsBtn.addEventListener('click', () => {
  el.appRoot.hidden = true;
  el.lessonsRoot.hidden = false;
  renderLessonsMenu();
});

el.authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  el.authError.textContent = '';
  el.authSubmitBtn.disabled = true;

  const email = el.authEmail.value.trim();
  const password = el.authPassword.value;

  if (authMode === 'signin') {
    const { error } = await signIn(email, password);
    if (error) {
      el.authError.textContent = 'Не удалось войти: ' + error.message;
    } else {
      const profile = await getCurrentProfile();
      await startAppForProfile(profile);
    }
  } else {
    const firstName = el.authFirstName.value.trim();
    const lastName = el.authLastName.value.trim();
    const { data, error } = await signUp(email, password, firstName, lastName);
    if (error) {
      el.authError.textContent = 'Не удалось зарегистрироваться: ' + error.message;
    } else if (!data.session) {
      el.authError.textContent = 'Проверьте почту и подтвердите регистрацию по ссылке, затем войдите.';
    } else {
      const profile = await getCurrentProfile();
      await startAppForProfile(profile);
    }
  }

  el.authSubmitBtn.disabled = false;
});

el.authToggleModeBtn.addEventListener('click', () => {
  authMode = authMode === 'signin' ? 'signup' : 'signin';
  const isSignup = authMode === 'signup';

  el.authSubmitBtn.textContent = isSignup ? 'Зарегистрироваться' : 'Войти';
  el.authToggleModeBtn.textContent = isSignup
    ? 'Уже есть аккаунт? Войти'
    : 'Ещё нет аккаунта? Зарегистрироваться';

  // Имя и фамилия нужны только при регистрации
  el.nameFields.hidden = !isSignup;
  el.authFirstName.required = isSignup;
  el.authLastName.required = isSignup;
  el.authPassword.autocomplete = isSignup ? 'new-password' : 'current-password';

  el.authError.textContent = '';
});

el.logoutBtnLessons.addEventListener('click', async () => {
  await signOut();
  window.location.reload();
});

(async function init() {
  const profile = await requireAuth();
  if (profile) {
    await startAppForProfile(profile);
  } else {
    showAuthScreen();
  }
})();
