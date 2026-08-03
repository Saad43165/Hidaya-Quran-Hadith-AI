export interface QuranicWord {
  id: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  root: string;
  category: QVCategory;
  timesInQuran: number;
  exampleSurah?: number;
  exampleAyah?: number;
  notes?: string;
}

export type QVCategory =
  | 'divine'
  | 'pillars'
  | 'character'
  | 'nature'
  | 'actions'
  | 'concepts';

export interface QVCategoryMeta {
  key: QVCategory;
  icon: string;
  label: string;
  color: string;
}

export const QV_CATEGORIES: QVCategoryMeta[] = [
  { key: 'divine',    icon: '✨', label: 'Divine Names & Attributes', color: '#F59E0B' },
  { key: 'pillars',   icon: '🕌', label: 'Pillars & Worship',        color: '#4ADE80' },
  { key: 'character', icon: '🌿', label: 'Character & Virtues',      color: '#60A5FA' },
  { key: 'nature',    icon: '🌙', label: 'Creation & Nature',        color: '#C084FC' },
  { key: 'actions',   icon: '⚡', label: 'Key Actions',              color: '#F472B6' },
  { key: 'concepts',  icon: '📖', label: 'Core Concepts',            color: '#34D399' },
];

export const QURANIC_VOCABULARY: QuranicWord[] = [
  // ── Divine Names & Attributes ──────────────────────────────────────────────
  {
    id: 'qv_allah',      arabic: 'اللَّه',        transliteration: 'Allah',
    meaning: 'God — The One and Only', root: '',
    category: 'divine', timesInQuran: 2699, exampleSurah: 1, exampleAyah: 1,
  },
  {
    id: 'qv_rabb',       arabic: 'رَبّ',          transliteration: 'Rabb',
    meaning: 'Lord, Sustainer, Nurturer', root: 'ر-ب-ب',
    category: 'divine', timesInQuran: 975, exampleSurah: 1, exampleAyah: 2,
  },
  {
    id: 'qv_rahman',     arabic: 'رَحْمٰن',       transliteration: 'Rahmān',
    meaning: 'Most Gracious (broad, universal mercy)', root: 'ر-ح-م',
    category: 'divine', timesInQuran: 57, exampleSurah: 1, exampleAyah: 1,
  },
  {
    id: 'qv_raheem',     arabic: 'رَحِيم',        transliteration: 'Rahīm',
    meaning: 'Most Merciful (specific, ongoing mercy)', root: 'ر-ح-م',
    category: 'divine', timesInQuran: 115, exampleSurah: 1, exampleAyah: 1,
  },
  {
    id: 'qv_malik',      arabic: 'مَالِك',        transliteration: 'Mālik',
    meaning: 'Master, Owner, Sovereign', root: 'م-ل-ك',
    category: 'divine', timesInQuran: 34, exampleSurah: 1, exampleAyah: 4,
  },
  {
    id: 'qv_quddus',     arabic: 'قُدُّوس',       transliteration: 'Quddūs',
    meaning: 'The Most Holy, Pure and Sacred', root: 'ق-د-س',
    category: 'divine', timesInQuran: 2, exampleSurah: 59, exampleAyah: 23,
  },
  {
    id: 'qv_salam',      arabic: 'السَّلَام',     transliteration: 'As-Salām',
    meaning: 'The Source of Peace', root: 'س-ل-م',
    category: 'divine', timesInQuran: 1, exampleSurah: 59, exampleAyah: 23,
    notes: 'Also used as Islamic greeting',
  },
  {
    id: 'qv_aziz',       arabic: 'عَزِيز',        transliteration: "'Azīz",
    meaning: 'Almighty, Most Powerful', root: 'ع-ز-ز',
    category: 'divine', timesInQuran: 99, exampleSurah: 2, exampleAyah: 129,
  },
  {
    id: 'qv_hakeem',     arabic: 'حَكِيم',        transliteration: 'Hakīm',
    meaning: 'All-Wise', root: 'ح-ك-م',
    category: 'divine', timesInQuran: 97, exampleSurah: 2, exampleAyah: 129,
  },
  {
    id: 'qv_aleem',      arabic: 'عَلِيم',        transliteration: "'Alīm",
    meaning: 'All-Knowing, Omniscient', root: 'ع-ل-م',
    category: 'divine', timesInQuran: 157, exampleSurah: 2, exampleAyah: 32,
  },
  {
    id: 'qv_samee',      arabic: 'سَمِيع',        transliteration: 'Samī\'',
    meaning: 'All-Hearing', root: 'س-م-ع',
    category: 'divine', timesInQuran: 47, exampleSurah: 2, exampleAyah: 127,
  },
  {
    id: 'qv_baseer',     arabic: 'بَصِير',        transliteration: 'Basīr',
    meaning: 'All-Seeing', root: 'ب-ص-ر',
    category: 'divine', timesInQuran: 42, exampleSurah: 4, exampleAyah: 58,
  },
  {
    id: 'qv_wadood',     arabic: 'وَدُود',        transliteration: 'Wadūd',
    meaning: 'The Most Loving', root: 'و-د-د',
    category: 'divine', timesInQuran: 2, exampleSurah: 11, exampleAyah: 90,
  },
  {
    id: 'qv_tawwab',     arabic: 'تَوَّاب',       transliteration: 'Tawwāb',
    meaning: 'Ever-Relenting, Acceptor of Repentance', root: 'ت-و-ب',
    category: 'divine', timesInQuran: 11, exampleSurah: 2, exampleAyah: 37,
  },
  {
    id: 'qv_ghafoor',    arabic: 'غَفُور',        transliteration: 'Ghafūr',
    meaning: 'Oft-Forgiving', root: 'غ-ف-ر',
    category: 'divine', timesInQuran: 91, exampleSurah: 2, exampleAyah: 173,
  },

  // ── Pillars & Worship ─────────────────────────────────────────────────────
  {
    id: 'qv_salah',      arabic: 'الصَّلَاة',     transliteration: 'As-Salāh',
    meaning: 'Prayer — the ritual prayer', root: 'ص-ل-و',
    category: 'pillars', timesInQuran: 67, exampleSurah: 2, exampleAyah: 3,
  },
  {
    id: 'qv_zakah',      arabic: 'الزَّكَاة',     transliteration: 'Az-Zakāh',
    meaning: 'Purifying alms, obligatory charity', root: 'ز-ك-و',
    category: 'pillars', timesInQuran: 30, exampleSurah: 2, exampleAyah: 3,
  },
  {
    id: 'qv_sawm',       arabic: 'صَوْم',         transliteration: 'Sawm',
    meaning: 'Fasting', root: 'ص-و-م',
    category: 'pillars', timesInQuran: 4, exampleSurah: 2, exampleAyah: 183,
  },
  {
    id: 'qv_hajj',       arabic: 'الحَجّ',        transliteration: 'Al-Hajj',
    meaning: 'Pilgrimage to Makkah', root: 'ح-ج-ج',
    category: 'pillars', timesInQuran: 9, exampleSurah: 3, exampleAyah: 97,
  },
  {
    id: 'qv_ibadah',     arabic: 'عِبَادَة',      transliteration: "'Ibādah",
    meaning: 'Worship, servitude to Allah', root: 'ع-ب-د',
    category: 'pillars', timesInQuran: 0, exampleSurah: 1, exampleAyah: 5,
    notes: 'Derived from "abd" (servant)',
  },
  {
    id: 'qv_dua',        arabic: 'دُعَاء',        transliteration: "Du'ā",
    meaning: 'Supplication, calling upon Allah', root: 'د-ع-و',
    category: 'pillars', timesInQuran: 14, exampleSurah: 2, exampleAyah: 186,
  },
  {
    id: 'qv_dhikr',      arabic: 'ذِكْر',         transliteration: 'Dhikr',
    meaning: 'Remembrance of Allah', root: 'ذ-ك-ر',
    category: 'pillars', timesInQuran: 292, exampleSurah: 13, exampleAyah: 28,
  },
  {
    id: 'qv_tawbah',     arabic: 'تَوْبَة',       transliteration: 'Tawbah',
    meaning: 'Repentance, returning to Allah', root: 'ت-و-ب',
    category: 'pillars', timesInQuran: 17, exampleSurah: 9, exampleAyah: 104,
  },
  {
    id: 'qv_wudu',       arabic: 'وُضُوء',        transliteration: 'Wudū',
    meaning: 'Ritual purification (ablution)', root: 'و-ض-أ',
    category: 'pillars', timesInQuran: 1, exampleSurah: 5, exampleAyah: 6,
  },
  {
    id: 'qv_quran',      arabic: 'قُرْآن',        transliteration: 'Qur\'ān',
    meaning: 'The Recitation — Allah\'s revealed book', root: 'ق-ر-أ',
    category: 'pillars', timesInQuran: 70, exampleSurah: 2, exampleAyah: 2,
  },

  // ── Character & Virtues ────────────────────────────────────────────────────
  {
    id: 'qv_sabr',       arabic: 'صَبْر',         transliteration: 'Sabr',
    meaning: 'Patience, steadfastness, endurance', root: 'ص-ب-ر',
    category: 'character', timesInQuran: 103, exampleSurah: 2, exampleAyah: 153,
  },
  {
    id: 'qv_shukr',      arabic: 'شُكْر',         transliteration: 'Shukr',
    meaning: 'Gratitude, thankfulness', root: 'ش-ك-ر',
    category: 'character', timesInQuran: 75, exampleSurah: 2, exampleAyah: 52,
  },
  {
    id: 'qv_taqwa',      arabic: 'تَقْوَى',       transliteration: 'Taqwā',
    meaning: 'God-consciousness, piety, fear of Allah', root: 'و-ق-ي',
    category: 'character', timesInQuran: 251, exampleSurah: 2, exampleAyah: 2,
  },
  {
    id: 'qv_sidq',       arabic: 'صِدْق',         transliteration: 'Sidq',
    meaning: 'Truthfulness, sincerity', root: 'ص-د-ق',
    category: 'character', timesInQuran: 155, exampleSurah: 9, exampleAyah: 119,
  },
  {
    id: 'qv_adl',        arabic: 'عَدْل',         transliteration: "'Adl",
    meaning: 'Justice, fairness, equity', root: 'ع-د-ل',
    category: 'character', timesInQuran: 28, exampleSurah: 16, exampleAyah: 90,
  },
  {
    id: 'qv_ihsan',      arabic: 'إِحْسَان',      transliteration: 'Ihsān',
    meaning: 'Excellence in worship and conduct', root: 'ح-س-ن',
    category: 'character', timesInQuran: 166, exampleSurah: 16, exampleAyah: 90,
  },
  {
    id: 'qv_hilm',       arabic: 'حِلْم',         transliteration: 'Hilm',
    meaning: 'Forbearance, composure, gentleness', root: 'ح-ل-م',
    category: 'character', timesInQuran: 18, exampleSurah: 9, exampleAyah: 114,
  },
  {
    id: 'qv_rahma',      arabic: 'رَحْمَة',       transliteration: 'Rahmah',
    meaning: 'Mercy, compassion, kindness', root: 'ر-ح-م',
    category: 'character', timesInQuran: 79, exampleSurah: 21, exampleAyah: 107,
  },
  {
    id: 'qv_tawadu',     arabic: 'تَوَاضُع',      transliteration: 'Tawādu\'',
    meaning: 'Humility, modesty', root: 'و-ض-ع',
    category: 'character', timesInQuran: 0, exampleSurah: 25, exampleAyah: 63,
    notes: 'Characteristic of "Ibad ur-Rahman" (Servants of the Merciful)',
  },

  // ── Creation & Nature ──────────────────────────────────────────────────────
  {
    id: 'qv_sama',       arabic: 'سَمَاء',        transliteration: 'Samā\'',
    meaning: 'Sky, heaven', root: 'س-م-و',
    category: 'nature', timesInQuran: 391, exampleSurah: 2, exampleAyah: 22,
  },
  {
    id: 'qv_ard',        arabic: 'الأَرْض',       transliteration: 'Al-Ard',
    meaning: 'The Earth', root: 'أ-ر-ض',
    category: 'nature', timesInQuran: 461, exampleSurah: 2, exampleAyah: 22,
  },
  {
    id: 'qv_nur',        arabic: 'نُور',          transliteration: 'Nūr',
    meaning: 'Light', root: 'ن-و-ر',
    category: 'nature', timesInQuran: 49, exampleSurah: 24, exampleAyah: 35,
  },
  {
    id: 'qv_maa',        arabic: 'مَاء',          transliteration: 'Mā\'',
    meaning: 'Water', root: 'م-و-ه',
    category: 'nature', timesInQuran: 63, exampleSurah: 2, exampleAyah: 22,
  },
  {
    id: 'qv_shams',      arabic: 'شَمْس',         transliteration: 'Shams',
    meaning: 'Sun', root: 'ش-م-س',
    category: 'nature', timesInQuran: 33, exampleSurah: 91, exampleAyah: 1,
  },
  {
    id: 'qv_qamar',      arabic: 'قَمَر',         transliteration: 'Qamar',
    meaning: 'Moon', root: 'ق-م-ر',
    category: 'nature', timesInQuran: 27, exampleSurah: 91, exampleAyah: 2,
  },
  {
    id: 'qv_nafs',       arabic: 'نَفْس',         transliteration: 'Nafs',
    meaning: 'Soul, self, person', root: 'ن-ف-س',
    category: 'nature', timesInQuran: 295, exampleSurah: 89, exampleAyah: 27,
  },
  {
    id: 'qv_qalb',       arabic: 'قَلْب',         transliteration: 'Qalb',
    meaning: 'Heart (spiritual and physical)', root: 'ق-ل-ب',
    category: 'nature', timesInQuran: 132, exampleSurah: 2, exampleAyah: 10,
  },
  {
    id: 'qv_jannah',     arabic: 'جَنَّة',        transliteration: 'Jannah',
    meaning: 'Paradise, garden', root: 'ج-ن-ن',
    category: 'nature', timesInQuran: 147, exampleSurah: 2, exampleAyah: 25,
  },
  {
    id: 'qv_naar',       arabic: 'نَار',          transliteration: 'Nār',
    meaning: 'Fire, Hellfire', root: 'ن-و-ر',
    category: 'nature', timesInQuran: 145, exampleSurah: 2, exampleAyah: 24,
  },

  // ── Key Actions ────────────────────────────────────────────────────────────
  {
    id: 'qv_qul',        arabic: 'قُل',           transliteration: 'Qul',
    meaning: 'Say! (command to speak)', root: 'ق-و-ل',
    category: 'actions', timesInQuran: 332, exampleSurah: 112, exampleAyah: 1,
  },
  {
    id: 'qv_iqra',       arabic: 'اِقْرَأ',       transliteration: 'Iqra\'',
    meaning: 'Read! Recite! (first word revealed)', root: 'ق-ر-أ',
    category: 'actions', timesInQuran: 0, exampleSurah: 96, exampleAyah: 1,
    notes: 'The very first word revealed to the Prophet ﷺ',
  },
  {
    id: 'qv_amana',      arabic: 'آمَنَ',         transliteration: 'Āmana',
    meaning: 'To believe, have faith', root: 'أ-م-ن',
    category: 'actions', timesInQuran: 537, exampleSurah: 2, exampleAyah: 3,
  },
  {
    id: 'qv_tawakkul',   arabic: 'تَوَكَّل',      transliteration: 'Tawakkal',
    meaning: 'To put trust in Allah, to rely', root: 'و-ك-ل',
    category: 'actions', timesInQuran: 44, exampleSurah: 3, exampleAyah: 159,
  },
  {
    id: 'qv_hidaya',     arabic: 'هِدَايَة',      transliteration: 'Hidāyah',
    meaning: 'Guidance, to be guided', root: 'ه-د-ي',
    category: 'actions', timesInQuran: 316, exampleSurah: 1, exampleAyah: 6,
  },
  {
    id: 'qv_shukara',    arabic: 'شَكَرَ',        transliteration: 'Shakara',
    meaning: 'To give thanks, be grateful', root: 'ش-ك-ر',
    category: 'actions', timesInQuran: 75, exampleSurah: 14, exampleAyah: 7,
  },
  {
    id: 'qv_istighfar',  arabic: 'اِسْتَغْفَر',   transliteration: 'Istaghfara',
    meaning: 'To seek forgiveness (istighfar)', root: 'غ-ف-ر',
    category: 'actions', timesInQuran: 46, exampleSurah: 71, exampleAyah: 10,
  },
  {
    id: 'qv_jihad',      arabic: 'جِهَاد',        transliteration: 'Jihād',
    meaning: 'Striving, struggle (in the path of Allah)', root: 'ج-ه-د',
    category: 'actions', timesInQuran: 41, exampleSurah: 9, exampleAyah: 24,
    notes: 'Primarily means inner struggle against the lower self',
  },
  {
    id: 'qv_fasabr',     arabic: 'فَاصْبِر',      transliteration: 'Fasbir',
    meaning: 'So be patient! (command)', root: 'ص-ب-ر',
    category: 'actions', timesInQuran: 0, exampleSurah: 52, exampleAyah: 48,
  },
  {
    id: 'qv_astaedhu',   arabic: 'أَعُوذُ',       transliteration: "A'ūdhu",
    meaning: 'I seek refuge (in Allah)', root: 'ع-و-ذ',
    category: 'actions', timesInQuran: 4, exampleSurah: 23, exampleAyah: 97,
    notes: 'Part of "A\'udhu billahi min ash-shaytanir-rajeem"',
  },

  // ── Core Concepts ─────────────────────────────────────────────────────────
  {
    id: 'qv_islam',      arabic: 'الإِسْلَام',    transliteration: 'Al-Islām',
    meaning: 'Submission to Allah, peace through submission', root: 'س-ل-م',
    category: 'concepts', timesInQuran: 8, exampleSurah: 3, exampleAyah: 19,
  },
  {
    id: 'qv_iman',       arabic: 'الإِيمَان',     transliteration: 'Al-Imān',
    meaning: 'Faith, belief', root: 'أ-م-ن',
    category: 'concepts', timesInQuran: 45, exampleSurah: 49, exampleAyah: 7,
  },
  {
    id: 'qv_deen',       arabic: 'الدِّين',       transliteration: 'Ad-Dīn',
    meaning: 'The way of life, religion, judgment', root: 'د-ي-ن',
    category: 'concepts', timesInQuran: 92, exampleSurah: 1, exampleAyah: 4,
  },
  {
    id: 'qv_haqq',       arabic: 'حَقّ',          transliteration: 'Haqq',
    meaning: 'Truth, right, due', root: 'ح-ق-ق',
    category: 'concepts', timesInQuran: 287, exampleSurah: 2, exampleAyah: 147,
  },
  {
    id: 'qv_khair',      arabic: 'خَيْر',         transliteration: 'Khayr',
    meaning: 'Good, goodness, better', root: 'خ-ي-ر',
    category: 'concepts', timesInQuran: 197, exampleSurah: 2, exampleAyah: 54,
  },
  {
    id: 'qv_barakah',    arabic: 'بَرَكَة',       transliteration: 'Barakah',
    meaning: 'Blessing, divine grace and abundance', root: 'ب-ر-ك',
    category: 'concepts', timesInQuran: 32, exampleSurah: 7, exampleAyah: 96,
  },
  {
    id: 'qv_amanah',     arabic: 'الأَمَانَة',    transliteration: 'Al-Amānah',
    meaning: 'Trust, responsibility, integrity', root: 'أ-م-ن',
    category: 'concepts', timesInQuran: 6, exampleSurah: 33, exampleAyah: 72,
  },
  {
    id: 'qv_fitrah',     arabic: 'فِطْرَة',       transliteration: 'Fitrah',
    meaning: 'Natural disposition, the pure innate nature', root: 'ف-ط-ر',
    category: 'concepts', timesInQuran: 1, exampleSurah: 30, exampleAyah: 30,
  },
  {
    id: 'qv_ummah',      arabic: 'أُمَّة',        transliteration: 'Ummah',
    meaning: 'Community of believers', root: 'أ-م-م',
    category: 'concepts', timesInQuran: 64, exampleSurah: 2, exampleAyah: 143,
  },
  {
    id: 'qv_hikmah',     arabic: 'حِكْمَة',       transliteration: 'Hikmah',
    meaning: 'Wisdom, sound judgment', root: 'ح-ك-م',
    category: 'concepts', timesInQuran: 20, exampleSurah: 2, exampleAyah: 129,
  },
  {
    id: 'qv_yaqeen',     arabic: 'يَقِين',        transliteration: 'Yaqīn',
    meaning: 'Certainty, conviction', root: 'ي-ق-ن',
    category: 'concepts', timesInQuran: 28, exampleSurah: 2, exampleAyah: 4,
  },
  {
    id: 'qv_birr',       arabic: 'البِرّ',        transliteration: 'Al-Birr',
    meaning: 'Righteousness, piety, goodness', root: 'ب-ر-ر',
    category: 'concepts', timesInQuran: 20, exampleSurah: 2, exampleAyah: 177,
  },
  {
    id: 'qv_zulm',       arabic: 'ظُلْم',         transliteration: 'Dhulm',
    meaning: 'Oppression, injustice, wrongdoing', root: 'ظ-ل-م',
    category: 'concepts', timesInQuran: 315, exampleSurah: 2, exampleAyah: 279,
  },
  {
    id: 'qv_nifaq',      arabic: 'نِفَاق',        transliteration: 'Nifāq',
    meaning: 'Hypocrisy', root: 'ن-ف-ق',
    category: 'concepts', timesInQuran: 13, exampleSurah: 9, exampleAyah: 67,
  },
];

export function getWordOfDay(): QuranicWord {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return QURANIC_VOCABULARY[dayOfYear % QURANIC_VOCABULARY.length];
}
