// Уроки. Каждый урок — это тема с набором слов (hanzi/pinyin/translation/audio).
// Урок автоматически делится на 2-3 части функцией splitLessonIntoParts —
// добавлять части вручную не нужно, просто дописывайте слова в урок.

const LESSONS = [
  {
    id: 'lesson-1',
    title: 'Урок 1',
    words: [
      { hanzi: '好', pinyin: ['hǎo'], translation: 'хорошо / хороший / добрый', audio: 'audio/hǎo.mp3' },
      { hanzi: '您', pinyin: ['nín'], translation: 'Вы', audio: 'audio/nín.mp3' },
      { hanzi: '你们', pinyin: ['nǐmen'], translation: 'вы', audio: 'audio/nǐmen.mp3' },
      { hanzi: '对不起', pinyin: ['duìbuqǐ'], translation: 'прости(те)', audio: 'audio/duìbuqǐ.mp3' },
      { hanzi: '没关系', pinyin: ['méiguānxi'], translation: 'ничего страшного', audio: 'audio/méiguānxi.mp3' },
    ],
  },
  {
    id: 'lesson-2',
    title: 'Урок 2',
    words: [
      { hanzi: '谢谢', pinyin: ['xièxiè'], translation: 'спасибо', audio: 'audio/xièxiè.mp3' },
      { hanzi: '不', pinyin: ['bù'], translation: 'Не', audio: 'audio/bù.mp3' },
      { hanzi: '不客气', pinyin: ['búkèqì'], translation: 'пожалуйста / не за что', audio: 'audio/búkèqì.mp3' },
      { hanzi: '再见', pinyin: ['zàijiàn'], translation: 'до свидания', audio: 'audio/zàijiàn.mp3' },
    ],
  },
  {
    id: 'lesson-3',
    title: 'Урок 3',
    words: [
      { hanzi: '叫', pinyin: ['jiào'], translation: 'звать', audio: 'audio/jiào.mp3' },
      { hanzi: '什么', pinyin: ['shénme'], translation: 'Что / какой', audio: 'audio/shénme.mp3' },
      { hanzi: '名字', pinyin: ['míngzì'], translation: 'имя', audio: 'audio/míngzì.mp3' },
      { hanzi: '我', pinyin: ['wǒ'], translation: 'я', audio: 'audio/wǒ.mp3' },
      { hanzi: '是', pinyin: ['shì'], translation: 'являться / да', audio: 'audio/shì.mp3' },
      { hanzi: '老师', pinyin: ['lǎoshī'], translation: 'учитель', audio: 'audio/lǎoshī.mp3' },
      { hanzi: '吗', pinyin: ['ma'], translation: 'вопросительная частица', audio: 'audio/ma.mp3' },
      { hanzi: '学生', pinyin: ['xuéshēng'], translation: 'студент / ученик', audio: 'audio/xuéshēng.mp3' },
      { hanzi: '人', pinyin: ['rén'], translation: 'человек', audio: 'audio/rén.mp3' },
    ],
  },
  {
    id: 'lesson-4',
    title: 'Урок 4',
    words: [
      { hanzi: '她', pinyin: ['tā'], translation: 'она', audio: 'audio/tā.mp3' },
      { hanzi: '谁', pinyin: ['shuí'], translation: 'Кто', audio: 'audio/shuí.mp3' },
      { hanzi: '的', pinyin: ['de'], translation: 'структурная частица', audio: 'audio/de.mp3' },
      { hanzi: '汉语', pinyin: ['hànyǔ'], translation: 'Китайский язык', audio: 'audio/hànyǔ.mp3' },
      { hanzi: '哪', pinyin: ['nǎ'], translation: 'Какой', audio: 'audio/nǎ.mp3' },
      { hanzi: '国', pinyin: ['guó'], translation: 'страна', audio: 'audio/guó.mp3' },
      { hanzi: '呢', pinyin: ['ne'], translation: 'вопросительная чатица / (а)', audio: 'audio/ne.mp3' },
      { hanzi: '他', pinyin: ['tā'], translation: 'он', audio: 'audio/tā.mp3' },
      { hanzi: '同学', pinyin: ['tóngxué'], translation: 'одноклассник', audio: 'audio/tóngxué.mp3' },
      { hanzi: '朋友', pinyin: ['péngyou'], translation: 'друг / подруга', audio: 'audio/péngyou.mp3' },
    ],
  },
  {
    id: 'lesson-5',
    title: 'Урок 5',
    words: [
      { hanzi: '家', pinyin: ['jiā'], translation: 'дом', audio: 'audio/jiā.mp3' },
      { hanzi: '有', pinyin: ['yǒu'], translation: 'иметь / есть', audio: 'audio/yǒu.mp3' },
      { hanzi: '口', pinyin: ['kǒu'], translation: 'счётное слово', audio: 'audio/kǒu.mp3' },
      { hanzi: '女儿', pinyin: ['nǚér'], translation: 'дочь', audio: 'audio/nǚér.mp3' },
      { hanzi: '几', pinyin: ['jǐ'], translation: 'сколько', audio: 'audio/jǐ.mp3' },
      { hanzi: '岁', pinyin: ['suì'], translation: 'Лет / год', audio: 'audio/suì.mp3' },
      { hanzi: '了', pinyin: ['le'], translation: 'частица', audio: 'audio/le.mp3' },
      { hanzi: '今年', pinyin: ['jīnnián'], translation: 'в этом году / этот год', audio: 'audio/jīnnián.mp3' },
      { hanzi: '多', pinyin: ['duō'], translation: 'много', audio: 'audio/duō.mp3' },
      { hanzi: '大', pinyin: ['dà'], translation: 'большой', audio: 'audio/dà.mp3' },
    ],
  },
  {
    id: 'lesson-6',
    title: 'Урок 6',
    words: [
      { hanzi: '会', pinyin: ['huì'], translation: 'будет / уметь', audio: 'audio/huì.mp3' },
      { hanzi: '说', pinyin: ['shuō'], translation: 'говорить', audio: 'audio/shuō.mp3' },
      { hanzi: '妈妈', pinyin: ['māmа'], translation: 'мама', audio: 'audio/māmа.mp3' },
      { hanzi: '菜', pinyin: ['cài'], translation: 'блюдо', audio: 'audio/cài.mp3' },
      { hanzi: '很', pinyin: ['hěn'], translation: 'очень', audio: 'audio/hěn.mp3' },
      { hanzi: '好吃', pinyin: ['hàochī'], translation: 'вкусно(ый)', audio: 'audio/hàochī.mp3' },
      { hanzi: '做', pinyin: ['zuò'], translation: 'делать / готовить', audio: 'audio/zuò.mp3' },
      { hanzi: '写', pinyin: ['xiě'], translation: 'писать', audio: 'audio/xiě.mp3' },
      { hanzi: '汉字', pinyin: ['hànzì'], translation: 'Китайский иероглиф', audio: 'audio/hànzì.mp3' },
      { hanzi: '字', pinyin: ['zì'], translation: 'иероглиф', audio: 'audio/zì.mp3' },
      { hanzi: '怎么', pinyin: ['zěnme'], translation: 'как', audio: 'audio/zěnme.mp3' },
      { hanzi: '读', pinyin: ['dú'], translation: 'читать', audio: 'audio/dú.mp3' },
    ],
  },
  {
    id: 'lesson-7',
    title: 'Урок 7',
    words: [
      { hanzi: '请', pinyin: ['qǐng'], translation: 'пожалуйста', audio: 'audio/qǐng.mp3' },
      { hanzi: '问', pinyin: ['wèn'], translation: 'спросить', audio: 'audio/wèn.mp3' },
      { hanzi: '今天', pinyin: ['jīntiān'], translation: 'сегодня', audio: 'audio/jīntiān.mp3' },
      { hanzi: '号', pinyin: ['hào'], translation: 'число', audio: 'audio/hào.mp3' },
      { hanzi: '月', pinyin: ['yuè'], translation: 'месяц', audio: 'audio/yuè.mp3' },
      { hanzi: '星期', pinyin: ['xīngqī'], translation: 'неделя', audio: 'audio/xīngqī.mp3' },
      { hanzi: '昨天', pinyin: ['zuótiān'], translation: 'вчера', audio: 'audio/zuótiān.mp3' },
      { hanzi: '明天', pinyin: ['míngtiān'], translation: 'завтра', audio: 'audio/míngtiān.mp3' },
      { hanzi: '去', pinyin: ['qù'], translation: 'идти / ходить / ехать', audio: 'audio/qù.mp3' },
      { hanzi: '学校', pinyin: ['xuéxiào'], translation: 'школа', audio: 'audio/xuéxiào.mp3' },
      { hanzi: '看', pinyin: ['kàn'], translation: 'смотри / читать', audio: 'audio/kàn.mp3' },
      { hanzi: '书', pinyin: ['shū'], translation: 'книга', audio: 'audio/shū.mp3' },
    ],
  },
  {
    id: 'lesson-8',
    title: 'Урок 8',
    words: [
      { hanzi: '想', pinyin: ['xiǎng'], translation: 'думать', audio: 'audio/xiǎng.mp3' },
      { hanzi: '喝', pinyin: ['hē'], translation: 'пить', audio: 'audio/hē.mp3' },
      { hanzi: '茶', pinyin: ['chá'], translation: 'чай', audio: 'audio/chá.mp3' },
      { hanzi: '吃', pinyin: ['chī'], translation: 'есть', audio: 'audio/chī.mp3' },
      { hanzi: '米饭', pinyin: ['mǐfàn'], translation: 'рис', audio: 'audio/mǐfàn.mp3' },
      { hanzi: '下午', pinyin: ['xiàwǔ'], translation: 'после обеда', audio: 'audio/xiàwǔ.mp3' },
      { hanzi: '商店', pinyin: ['shāngdiàn'], translation: 'магазин', audio: 'audio/shāngdiàn.mp3' },
      { hanzi: '买', pinyin: ['mǎi'], translation: 'купить / покупать', audio: 'audio/mǎi.mp3' },
      { hanzi: '个', pinyin: ['gè'], translation: 'счётное слово', audio: 'audio/gè.mp3' },
      { hanzi: '杯子', pinyin: ['bēizi'], translation: 'стакан', audio: 'audio/bēizi.mp3' },
      { hanzi: '这', pinyin: ['zhè'], translation: 'это', audio: 'audio/zhè.mp3' },
      { hanzi: '多少', pinyin: ['duōshǎo'], translation: 'сколько', audio: 'audio/duōshǎo.mp3' },
      { hanzi: '钱', pinyin: ['qián'], translation: 'деньги', audio: 'audio/qián.mp3' },
      { hanzi: '块', pinyin: ['kuài'], translation: 'юань', audio: 'audio/kuài.mp3' },
      { hanzi: '那', pinyin: ['nà'], translation: 'тот / этот', audio: 'audio/nà.mp3' },
    ],
  },
  {
    id: 'lesson-9',
    title: 'Урок 9',
    words: [
      { hanzi: '小', pinyin: ['xiǎo'], translation: 'маленький', audio: 'audio/xiǎo.mp3' },
      { hanzi: '猫', pinyin: ['māo'], translation: 'кот', audio: 'audio/māo.mp3' },
      { hanzi: '在', pinyin: ['zài'], translation: 'находиться', audio: 'audio/zài.mp3' },
      { hanzi: '那儿', pinyin: ['nàer'], translation: 'там', audio: 'audio/nàer.mp3' },
      { hanzi: '狗', pinyin: ['gǒu'], translation: 'собака', audio: 'audio/gǒu.mp3' },
      { hanzi: '椅子', pinyin: ['yǐzi'], translation: 'стул', audio: 'audio/yǐzi.mp3' },
      { hanzi: '下面', pinyin: ['xiàmian'], translation: 'под / внизу', audio: 'audio/xiàmian.mp3' },
      { hanzi: '哪儿', pinyin: ['nǎer'], translation: 'где', audio: 'audio/nǎer.mp3' },
      { hanzi: '工作', pinyin: ['gōngzuò'], translation: 'работа / работать', audio: 'audio/gōngzuò.mp3' },
      { hanzi: '儿子', pinyin: ['érzi'], translation: 'сын', audio: 'audio/érzi.mp3' },
      { hanzi: '医院', pinyin: ['yīyuàn'], translation: 'больница', audio: 'audio/yīyuàn.mp3' },
      { hanzi: '医生', pinyin: ['yīshēng'], translation: 'врач', audio: 'audio/yīshēng.mp3' },
      { hanzi: '爸爸', pinyin: ['bàba'], translation: 'папа', audio: 'audio/bàba.mp3' },
    ],
  },
  {
    id: 'lesson-10',
    title: 'Урок 10',
    words: [
      { hanzi: '桌子', pinyin: ['zhuōzi'], translation: 'стол', audio: 'audio/zhuōzi.mp3' },
      { hanzi: '上', pinyin: ['shàng'], translation: 'на / над / наверху', audio: 'audio/shàng.mp3' },
      { hanzi: '电脑', pinyin: ['diànnǎo'], translation: 'компьютер', audio: 'audio/diànnǎo.mp3' },
      { hanzi: '和', pinyin: ['hé'], translation: 'и', audio: 'audio/hé.mp3' },
      { hanzi: '本', pinyin: ['běn'], translation: 'счётное слово', audio: 'audio/běn.mp3' },
      { hanzi: '里', pinyin: ['lǐ'], translation: 'внутри', audio: 'audio/lǐ.mp3' },
      { hanzi: '前面', pinyin: ['qiánmian'], translation: 'спереди / перед', audio: 'audio/qiánmian.mp3' },
      { hanzi: '后面', pinyin: ['hòumian'], translation: 'сзади/ за', audio: 'audio/hòumian.mp3' },
      { hanzi: '这儿', pinyin: ['zhèer'], translation: 'здесь', audio: 'audio/zhèer.mp3' },
      { hanzi: '没有', pinyin: ['méiyǒu'], translation: 'нет', audio: 'audio/méiyǒu.mp3' },
      { hanzi: '能', pinyin: ['néng'], translation: 'мочь / уметь', audio: 'audio/néng.mp3' },
      { hanzi: '坐', pinyin: ['zuò'], translation: 'сидеть', audio: 'audio/zuò.mp3' },
    ],
  },
  {
    id: 'lesson-11',
    title: 'Урок 11',
    words: [
      { hanzi: '现在', pinyin: ['xiànzài'], translation: 'сейчас', audio: 'audio/xiànzài.mp3' },
      { hanzi: '点', pinyin: ['diǎn'], translation: 'час', audio: 'audio/diǎn.mp3' },
      { hanzi: '分', pinyin: ['fēn'], translation: 'минута', audio: 'audio/fēn.mp3' },
      { hanzi: '中午', pinyin: ['zhōngwǔ'], translation: 'полдень', audio: 'audio/zhōngwǔ.mp3' },
      { hanzi: '吃饭', pinyin: ['chīfàn'], translation: 'принимать пищу', audio: 'audio/chīfàn.mp3' },
      { hanzi: '时候', pinyin: ['shíhou'], translation: 'время / момент', audio: 'audio/shíhou.mp3' },
      { hanzi: '回', pinyin: ['huí'], translation: 'вернуться /возвращаться', audio: 'audio/huí.mp3' },
      { hanzi: '我们', pinyin: ['wǒmen'], translation: 'мы', audio: 'audio/wǒmen.mp3' },
      { hanzi: '电影', pinyin: ['diànyǐng'], translation: 'фильм / кино', audio: 'audio/diànyǐng.mp3' },
      { hanzi: '住', pinyin: ['zhù'], translation: 'жить', audio: 'audio/zhù.mp3' },
      { hanzi: '前', pinyin: ['qián'], translation: 'до / назад', audio: 'audio/qián.mp3' },
    ],
  },
  {
    id: 'lesson-12',
    title: 'Урок 12',
    words: [
      { hanzi: '天气', pinyin: ['tiānqì'], translation: 'погода', audio: 'audio/tiānqì.mp3' },
      { hanzi: '怎么样', pinyin: ['zěnmeyàng'], translation: 'как', audio: 'audio/zěnmeyàng.mp3' },
      { hanzi: '太', pinyin: ['tài'], translation: 'слишком', audio: 'audio/tài.mp3' },
      { hanzi: '太…了', pinyin: ['tài...le'], translation: 'слишком', audio: 'audio/tài...le.mp3' },
      { hanzi: '热', pinyin: ['rè'], translation: 'горячий / жарко', audio: 'audio/rè.mp3' },
      { hanzi: '冷', pinyin: ['lěng'], translation: 'холодный', audio: 'audio/lěng.mp3' },
      { hanzi: '下雨', pinyin: ['xiàyǔ'], translation: 'дождь идет', audio: 'audio/xiàyǔ.mp3' },
      { hanzi: '下', pinyin: ['xià'], translation: 'подать', audio: 'audio/xià.mp3' },
      { hanzi: '雨', pinyin: ['yǔ'], translation: 'дождь', audio: 'audio/yǔ.mp3' },
      { hanzi: '小姐', pinyin: ['xiǎojiě'], translation: 'Мисс', audio: 'audio/xiǎojiě.mp3' },
      { hanzi: '来', pinyin: ['lái'], translation: 'Придти', audio: 'audio/lái.mp3' },
      { hanzi: '身体', pinyin: ['shēntǐ'], translation: 'тело / состояние здровья', audio: 'audio/shēntǐ.mp3' },
      { hanzi: '爱', pinyin: ['ài'], translation: 'любовь / любить', audio: 'audio/ài.mp3' },
      { hanzi: '些', pinyin: ['xiē'], translation: 'некоторые / несколько', audio: 'audio/xiē.mp3' },
      { hanzi: '水果', pinyin: ['shuǐguǒ'], translation: 'фрукты', audio: 'audio/shuǐguǒ.mp3' },
      { hanzi: '水', pinyin: ['shuǐ'], translation: 'вода', audio: 'audio/shuǐ.mp3' },
    ],
  },
  {
    id: 'lesson-13',
    title: 'Урок 13',
    words: [
      { hanzi: '喂', pinyin: ['wèi'], translation: 'Алло', audio: 'audio/wèi.mp3' },
      { hanzi: '也', pinyin: ['yě'], translation: 'тоже', audio: 'audio/yě.mp3' },
      { hanzi: '学习', pinyin: ['xuéxí'], translation: 'учиться', audio: 'audio/xuéxí.mp3' },
      { hanzi: '上午', pinyin: ['shàngwǔ'], translation: 'утро / утром', audio: 'audio/shàngwǔ.mp3' },
      { hanzi: '睡觉', pinyin: ['shuìjiào'], translation: 'спать', audio: 'audio/shuìjiào.mp3' },
      { hanzi: '电视', pinyin: ['diànshì'], translation: 'телевизор', audio: 'audio/diànshì.mp3' },
      { hanzi: '喜欢', pinyin: ['xǐhuan'], translation: 'нравится', audio: 'audio/xǐhuan.mp3' },
      { hanzi: '给', pinyin: ['gěi'], translation: 'дать', audio: 'audio/gěi.mp3' },
      { hanzi: '打电话', pinyin: ['dǎdiànhuà'], translation: 'позвонить по телефону', audio: 'audio/dǎdiànhuà.mp3' },
      { hanzi: '吧', pinyin: ['ba'], translation: 'давай', audio: 'audio/ba.mp3' },
    ],
  },
  {
    id: 'lesson-14',
    title: 'Урок 14',
    words: [
      { hanzi: '东西', pinyin: ['dōngxī'], translation: 'вещество', audio: 'audio/dōngxī.mp3' },
      { hanzi: '一点儿', pinyin: ['yìdiǎner'], translation: 'немного / чуть-чуть', audio: 'audio/yìdiǎner.mp3' },
      { hanzi: '苹果', pinyin: ['píngguǒ'], translation: 'яблоко', audio: 'audio/píngguǒ.mp3' },
      { hanzi: '看见', pinyin: ['kànjiàn'], translation: 'увидеть', audio: 'audio/kànjiàn.mp3' },
      { hanzi: '先生', pinyin: ['xiānsheng'], translation: 'Господин', audio: 'audio/xiānsheng.mp3' },
      { hanzi: '开', pinyin: ['kāi'], translation: 'водить', audio: 'audio/kāi.mp3' },
      { hanzi: '车', pinyin: ['chē'], translation: 'машина', audio: 'audio/chē.mp3' },
      { hanzi: '回来', pinyin: ['huílái'], translation: 'вернуться (к говорящему)', audio: 'audio/huílái.mp3' },
      { hanzi: '分钟', pinyin: ['fēnzhōng'], translation: 'минута', audio: 'audio/fēnzhōng.mp3' },
      { hanzi: '后', pinyin: ['hòu'], translation: 'после / через', audio: 'audio/hòu.mp3' },
      { hanzi: '衣服', pinyin: ['yīfu'], translation: 'одежда', audio: 'audio/yīfu.mp3' },
      { hanzi: '漂亮', pinyin: ['piàoliang'], translation: 'красивый', audio: 'audio/piàoliang.mp3' },
      { hanzi: '啊', pinyin: ['ā'], translation: '', audio: 'audio/ā.mp3' },
      { hanzi: '少', pinyin: ['shǎo'], translation: 'модальная частица', audio: 'audio/shǎo.mp3' },
      { hanzi: '不少', pinyin: ['bùshǎo'], translation: 'не мало', audio: 'audio/bùshǎo.mp3' },
      { hanzi: '这些', pinyin: ['zhèxiē'], translation: 'эти', audio: 'audio/zhèxiē.mp3' },
      { hanzi: '都', pinyin: ['dōu'], translation: 'все', audio: 'audio/dōu.mp3' },
    ],
  },
  {
    id: 'lesson-15',
    title: 'Урок 15',
    words: [
      { hanzi: '认识', pinyin: ['rènshi'], translation: 'знать / знаком ( с кем-либо)', audio: 'audio/rènshi.mp3' },
      { hanzi: '年', pinyin: ['nián'], translation: 'год', audio: 'audio/nián.mp3' },
      { hanzi: '大学', pinyin: ['dàxué'], translation: 'университет', audio: 'audio/dàxué.mp3' },
      { hanzi: '饭店', pinyin: ['fàndiàn'], translation: 'ресторан', audio: 'audio/fàndiàn.mp3' },
      { hanzi: '出租车', pinyin: ['chūzūchē'], translation: 'такси', audio: 'audio/chūzūchē.mp3' },
      { hanzi: '一起', pinyin: ['yìqǐ'], translation: 'вместе', audio: 'audio/yìqǐ.mp3' },
      { hanzi: '高兴', pinyin: ['gāoxìng'], translation: 'раз', audio: 'audio/gāoxìng.mp3' },
      { hanzi: '听', pinyin: ['tīng'], translation: 'слушать', audio: 'audio/tīng.mp3' },
      { hanzi: '飞机', pinyin: ['fēijī'], translation: 'самолёт', audio: 'audio/fēijī.mp3' },
    ],
  },
];

// Плоский список всех слов — используется в админ-панели как пул для
// индивидуальных подборок, а также как запасной вариант, если вдруг
// потребуется старый режим без уроков.
const DEFAULT_WORDS = LESSONS.flatMap((lesson) => lesson.words);

// Делит слова урока на 2-3 примерно равные части в зависимости от их количества.
function splitLessonIntoParts(lesson) {
  const words = lesson.words;
  const numParts = words.length <= 4 ? 2 : 3;
  const base = Math.floor(words.length / numParts);
  let extra = words.length % numParts;

  const parts = [];
  let idx = 0;
  for (let i = 0; i < numParts; i++) {
    const size = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra--;
    if (size > 0) parts.push(words.slice(idx, idx + size));
    idx += size;
  }
  return parts;
}

// Перемешивает копию массива (алгоритм Фишера-Йейтса), не трогая оригинал.
function shuffleWords(words) {
  const arr = [...words];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
