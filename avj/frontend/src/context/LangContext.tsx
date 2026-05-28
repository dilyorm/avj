import { createContext, useContext, useState, type ReactNode } from 'react';

export type Lang = 'uz' | 'ru';

const UZ = {
  // Nav / tabs
  lenta: "Lenta",
  search: "Qidiruv",
  addFriend: "Do'st qo'shish",
  profile: "Men",

  // Feed
  listeningNow: "Hozir tinglashmoqda",
  recentlyListened: "Yaqinda tingladi",
  friends: "Do'stlar",
  friendRequests: "Do'stlik so'rovlari",
  accept: "Qabul",
  reject: "Rad",
  notListening: "hozir tinglayotgani yo'q",
  feedEmpty: "Lenta hozircha bo'sh",
  feedEmptySub: "Do'st qo'sh — ular nima eshityotgani shu yerda ko'rinadi.",
  reload: "Qayta yuklash",

  // Add friends / search
  searchPlaceholder: "Ism yoki @username",
  searchPlaceholderFull: "Do'stlar, qo'shiqlar, artistlar...",
  searchResults: "Qidiruv natijalari",
  suggestions: "Sen uchun tavsiya",
  noResults: "Natija topilmadi",
  noSuggestions: "Hozircha tavsiya yo'q",
  noResultsFor: (q: string) => `"${q}" bo'yicha hech kim topilmadi`,
  noSearchFor: (q: string) => `"${q}" bo'yicha hech narsa yo'q`,
  results: (n: number) => `Natijalar · ${n}`,
  friendStatus: "Do'st",
  cancelRequest: "Bekor qilish",
  addBtn: "+ Qo'sh",

  // Profile / friend profile
  nowPlaying: "HOZIR TINGLAMOQDA",
  youNow: "SEN HOZIR",
  lastPlayed: "OXIRGI TINGLANGAN",
  notListeningNow: "Hozir hech narsa tinglamayapti",
  notListeningYou: "Hozir hech narsa tinglamayapsan",
  lastSeen: "Oxirgi marta",
  recentTracks: "Oxirgi tracklar",
  friendCount: "do'st",
  trackCount: "track",
  shareProfile: "Profilni ulashish",
  linkCopied: "Havola nusxalandi!",
  logout: "Chiqish",
  back: "Orqaga",

  // Friendship actions
  unfriend: "Do'stlikdan chiqish",
  requestSent: "So'rov yuborildi · Bekor qilish",
  acceptRequest: "Qabul qilish",
  rejectRequest: "Rad etish",
  sendRequest: "Do'st bo'lish so'rovi yuborish",

  // Private profile
  privateAccount: "Bu hisob yopiq",
  privateRequestSent: "Do'stlik so'rovingiz yuborildi. Qabul qilingandan so'ng musiqa lentasini ko'ra olasiz.",
  privateIncoming: (name: string) => `${name} sizga do'stlik so'rovi yubordi.`,
  privateDefault: "Do'st bo'lsangiz, musiqa lentasini ko'ra olasiz.",

  // My profile
  historyTitle: "Oxirgi tinglangan",
  historyEmpty: "Tarix topilmadi",
  visible: "Ko'rinaman",
  hidden: "Yashirin",
  connectedAccounts: "Ulangan hisoblar",
  connected: "Ulangan",
  spotifySub: "Premium yoki Free",
  yandexSub: "Token orqali ulanish",
  noMusicWarning: "Musiqa hisobingni ulab, do'stlaringga nima eshityotganingni ko'rsat.",

  // Right panel
  yourFeed: "Sening lenta",
  lastTrack: "Oxirgi",
  nothingNow: "Hozir hech narsa",
  openMusicApp: "Musiqa ilovani oching va tinglang",
  connectMusicAccount: "Musiqa hisobini ulang",
  connectBtn: "Ulash",
  tagline: "avj. — do'stlaringni real vaqtda kuzat",

  // Yandex modal
  yandexTitle: "Yandex Music",
  yandexDesc: "Yandex saytida tez tasdiqlash orqali ulanasiz.",
  start: "Boshlash",
  loading: "Yuklanmoqda...",
  confirmCode: "Tasdiqlash kodi",
  confirmOnYandex: "Yandex saytida tasdiqlash →",
  waitingConfirm: "Tasdiqlanishini kutmoqda...",
  connected2: "Ulandi!",
  codeExpired: "Kod muddati tugadi.",
  retry: "Qayta urinish",

  // Errors
  profileNotFound: "Profil topilmadi",
  loadFailed: "Yuklab bo'lmadi",

  // Time
  now: "hozir",
  minAgo: (n: number) => `${n}d oldin`,
  hourAgo: (n: number) => `${n}s oldin`,
  dayAgo: (n: number) => `${n}k oldin`,
} as const;

const RU = {
  lenta: "Лента",
  search: "Поиск",
  addFriend: "Добавить друга",
  profile: "Я",

  listeningNow: "Сейчас слушают",
  recentlyListened: "Недавно слушал",
  friends: "Друзья",
  friendRequests: "Запросы в друзья",
  accept: "Принять",
  reject: "Отклонить",
  notListening: "сейчас не слушает",
  feedEmpty: "Лента пока пуста",
  feedEmptySub: "Добавь друзей — что они слушают появится здесь.",
  reload: "Обновить",

  searchPlaceholder: "Имя или @username",
  searchPlaceholderFull: "Друзья, треки, артисты...",
  searchResults: "Результаты поиска",
  suggestions: "Рекомендации для тебя",
  noResults: "Ничего не найдено",
  noSuggestions: "Пока нет рекомендаций",
  noResultsFor: (q: string) => `По "${q}" никого не найдено`,
  noSearchFor: (q: string) => `По "${q}" ничего нет`,
  results: (n: number) => `Результаты · ${n}`,
  friendStatus: "Друг",
  cancelRequest: "Отменить",
  addBtn: "+ Добавить",

  nowPlaying: "СЕЙЧАС СЛУШАЕТ",
  youNow: "ТЫ СЕЙЧАС",
  lastPlayed: "ПОСЛЕДНИЙ ТРЕК",
  notListeningNow: "Сейчас ничего не слушает",
  notListeningYou: "Сейчас ничего не слушаешь",
  lastSeen: "Последний раз",
  recentTracks: "Последние треки",
  friendCount: "друзей",
  trackCount: "треков",
  shareProfile: "Поделиться профилем",
  linkCopied: "Ссылка скопирована!",
  logout: "Выйти",
  back: "Назад",

  unfriend: "Удалить из друзей",
  requestSent: "Запрос отправлен · Отменить",
  acceptRequest: "Принять",
  rejectRequest: "Отклонить",
  sendRequest: "Отправить запрос в друзья",

  privateAccount: "Этот аккаунт закрыт",
  privateRequestSent: "Запрос отправлен. После принятия сможешь видеть музыкальную ленту.",
  privateIncoming: (name: string) => `${name} отправил тебе запрос в друзья.`,
  privateDefault: "Добавь в друзья, чтобы видеть музыкальную ленту.",

  historyTitle: "История прослушиваний",
  historyEmpty: "История пуста",
  visible: "Виден всем",
  hidden: "Скрыт",
  connectedAccounts: "Подключённые аккаунты",
  connected: "Подключён",
  spotifySub: "Premium или Free",
  yandexSub: "Подключение через токен",
  noMusicWarning: "Подключи музыкальный аккаунт, чтобы друзья видели что ты слушаешь.",

  yourFeed: "Твоя лента",
  lastTrack: "Последний",
  nothingNow: "Сейчас ничего",
  openMusicApp: "Открой музыкальное приложение и слушай",
  connectMusicAccount: "Подключи музыкальный аккаунт",
  connectBtn: "Подключить",
  tagline: "avj. — следи за друзьями в реальном времени",

  yandexTitle: "Яндекс Музыка",
  yandexDesc: "Подключитесь через быстрое подтверждение на сайте Яндекс.",
  start: "Начать",
  loading: "Загрузка...",
  confirmCode: "Код подтверждения",
  confirmOnYandex: "Подтвердить на Яндексе →",
  waitingConfirm: "Ожидаем подтверждения...",
  connected2: "Подключено!",
  codeExpired: "Срок действия кода истёк.",
  retry: "Попробовать снова",

  profileNotFound: "Профиль не найден",
  loadFailed: "Не удалось загрузить",

  now: "сейчас",
  minAgo: (n: number) => `${n}м назад`,
  hourAgo: (n: number) => `${n}ч назад`,
  dayAgo: (n: number) => `${n}д назад`,
} as const;

export type Translations = {
  [K in keyof typeof UZ]: (typeof UZ)[K] extends (...args: infer A) => infer R
    ? (...args: A) => R
    : string;
};
const translations: Record<Lang, Translations> = { uz: UZ as Translations, ru: RU as Translations };

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LangContext = createContext<LangCtx>({ lang: 'uz', setLang: () => {}, t: UZ });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('avj-lang');
    return (saved === 'uz' || saved === 'ru') ? saved : 'uz';
  });

  const setLang = (l: Lang) => {
    localStorage.setItem('avj-lang', l);
    setLangState(l);
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
