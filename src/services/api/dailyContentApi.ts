import { quranClient } from './client';
import { fetchWithCache } from '../db/cacheRepo';

export interface DailyAyah {
  surahNumber: number;
  surahEnglishName: string;
  ayahNumber: number;
  arabicText: string;
  translation: string;
  globalVerseNumber: number;
  date: string;
}

export interface DailyHadith {
  collectionName: string;
  hadithNumber: number;
  arabicText: string;
  translation: string;
  date: string;
}

function getDayIndex(max: number): number {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return (now.getFullYear() * 365 + dayOfYear) % max;
}

/**
 * Well-known hadiths that are always available offline as a fallback.
 * These are also shown when the CDN is unreachable.
 */
const CLASSIC_HADITHS: Array<{ arabic: string; english: string; number: number }> = [
  {
    number: 1,
    arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    english: 'Actions are judged by intentions, and every person will be rewarded according to their intention. Whoever emigrates for the sake of Allah and His Messenger, his emigration will be for Allah and His Messenger.',
  },
  {
    number: 2,
    arabic: 'الإِسْلامُ أَنْ تَشْهَدَ أَنْ لا إِلَهَ إِلاَّ اللهُ وَأَنَّ مُحَمَّداً رَسُولُ اللهِ',
    english: 'Islam is to testify that there is no god but Allah and Muhammad is the Messenger of Allah, to perform the prayer, to give zakat, to fast in Ramadan, and to perform the pilgrimage to the House if you are able.',
  },
  {
    number: 3,
    arabic: 'بُنِيَ الإِسْلامُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لاَ إِلَهَ إِلاَّ اللهُ وَأَنَّ مُحَمَّداً رَسُولُ اللهِ',
    english: 'Islam was built upon five pillars: testifying that there is no god but Allah and that Muhammad is the Messenger of Allah, performing the prayer, paying zakat, making pilgrimage to the House, and fasting Ramadan.',
  },
  {
    number: 4,
    arabic: 'مِنْ حُسْنِ إِسْلامِ الْمَرْءِ تَرْكُهُ مَا لاَ يَعْنِيهِ',
    english: 'Part of the perfection of a person\'s Islam is leaving alone what does not concern them.',
  },
  {
    number: 5,
    arabic: 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    english: 'None of you truly believes until he loves for his brother what he loves for himself.',
  },
  {
    number: 6,
    arabic: 'الْحَلاَلُ بَيِّنٌ وَالْحَرَامُ بَيِّنٌ',
    english: 'The lawful is clear and the unlawful is clear, and between them are doubtful matters that many people do not know about.',
  },
  {
    number: 7,
    arabic: 'الدِّينُ النَّصِيحَةُ',
    english: 'Religion is sincere counsel — to Allah, His Book, His Messenger, the leaders of the Muslims, and their common people.',
  },
  {
    number: 8,
    arabic: 'أُمِرْتُ أَنْ أُقَاتِلَ النَّاسَ حَتَّى يَشْهَدُوا أَنْ لاَ إِلَهَ إِلاَّ اللهُ',
    english: 'I have been commanded to fight people until they testify that there is no god but Allah and that Muhammad is the Messenger of Allah.',
  },
  {
    number: 9,
    arabic: 'مَا نَهَيْتُكُمْ عَنْهُ فَاجْتَنِبُوهُ، وَمَا أَمَرْتُكُمْ بِهِ فَافْعَلُوا مِنْهُ مَا اسْتَطَعْتُمْ',
    english: 'Whatever I have forbidden you, avoid it, and whatever I have commanded you, do as much of it as you are able.',
  },
  {
    number: 10,
    arabic: 'إِنَّ اللَّهَ طَيِّبٌ لاَ يَقْبَلُ إِلاَّ طَيِّباً',
    english: 'Allah is pure and only accepts that which is pure. Allah has commanded the believers with the same that He commanded the Messengers.',
  },
  {
    number: 11,
    arabic: 'دَعْ مَا يَرِيبُكَ إِلَى مَا لاَ يَرِيبُكَ',
    english: 'Leave what makes you doubt for what does not make you doubt.',
  },
  {
    number: 12,
    arabic: 'مِنْ حُسْنِ الإِسْلامِ الْمَرْءِ تَرْكُهُ مَا لاَ يَعْنِيهِ',
    english: 'Part of the beauty of a person\'s Islam is their leaving alone that which does not concern them.',
  },
  {
    number: 13,
    arabic: 'لاَ يَحِلُّ لِمُسْلِمٍ أَنْ يَهْجُرَ أَخَاهُ فَوْقَ ثَلاَثٍ',
    english: 'It is not lawful for a Muslim to desert his brother for more than three days.',
  },
  {
    number: 14,
    arabic: 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    english: 'None of you truly believes until he loves for his brother what he loves for himself.',
  },
];

/** Fetch today's ayah — rotates through short surahs (78–114) daily */
export async function fetchDailyAyah(): Promise<DailyAyah> {
  const today = new Date().toISOString().slice(0, 10);
  return fetchWithCache(`daily-ayah:${today}`, async () => {
    const shortSurahs = Array.from({ length: 37 }, (_, i) => i + 78);
    const surahNumber = shortSurahs[getDayIndex(shortSurahs.length)];

    const [arabicRes, transRes] = await Promise.all([
      quranClient.get(`/surah/${surahNumber}/quran-uthmani`),
      quranClient.get(`/surah/${surahNumber}/en.sahih`),
    ]);

    const arabicAyahs = arabicRes.data.data.ayahs as Array<{
      number: number;
      numberInSurah: number;
      text: string;
    }>;
    const transAyahs = transRes.data.data.ayahs as Array<{ text: string }>;
    const surahInfo = arabicRes.data.data as { englishName: string };

    const ayahIdx = getDayIndex(arabicAyahs.length);
    const ayah = arabicAyahs[ayahIdx];
    const trans = transAyahs[ayahIdx];

    return {
      surahNumber,
      surahEnglishName: surahInfo.englishName,
      ayahNumber: ayah.numberInSurah,
      arabicText: ayah.text,
      translation: trans.text,
      globalVerseNumber: ayah.number,
      date: today,
    };
  });
}

/** Today's hadith — rotates through 14 classic hadiths, always available offline */
export async function fetchDailyHadith(): Promise<DailyHadith> {
  const today = new Date().toISOString().slice(0, 10);
  return fetchWithCache(`daily-hadith:${today}`, async () => {
    const idx = getDayIndex(CLASSIC_HADITHS.length);
    const selected = CLASSIC_HADITHS[idx];
    return {
      collectionName: "Al-Nawawi's 40 Hadith",
      hadithNumber: selected.number,
      arabicText: selected.arabic,
      translation: selected.english,
      date: today,
    };
  });
}
