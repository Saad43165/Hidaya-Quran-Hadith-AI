import { quranClient } from './client';
import { fetchWithCache } from '../db/cacheRepo';

export interface DailyAyah {
  surahNumber: number;
  surahEnglishName: string;
  ayahNumber: number;
  arabicText: string;
  translation: string;
  translationUrdu?: string;
  globalVerseNumber: number;
  date: string;
}

export interface DailyHadith {
  collectionName: string;
  hadithNumber: number;
  arabicText: string;
  translation: string;
  translationUrdu?: string;
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
const CLASSIC_HADITHS: Array<{ arabic: string; english: string; urdu: string; number: number }> = [
  {
    number: 1,
    arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    english: 'Actions are judged by intentions, and every person will be rewarded according to their intention. Whoever emigrates for the sake of Allah and His Messenger, his emigration will be for Allah and His Messenger.',
    urdu: 'اعمال کا دارومدار نیتوں پر ہے، اور ہر شخص کو وہی ملے گا جس کی اس نے نیت کی۔ جو اللہ اور اس کے رسول کے لیے ہجرت کرے، اس کی ہجرت اللہ اور اس کے رسول کے لیے ہے۔',
  },
  {
    number: 2,
    arabic: 'الإِسْلامُ أَنْ تَشْهَدَ أَنْ لا إِلَهَ إِلاَّ اللهُ وَأَنَّ مُحَمَّداً رَسُولُ اللهِ',
    english: 'Islam is to testify that there is no god but Allah and Muhammad is the Messenger of Allah, to perform the prayer, to give zakat, to fast in Ramadan, and to perform the pilgrimage to the House if you are able.',
    urdu: 'اسلام یہ ہے کہ تم گواہی دو کہ اللہ کے سوا کوئی معبود نہیں اور محمد ﷺ اللہ کے رسول ہیں، نماز قائم کرو، زکات ادا کرو، رمضان کے روزے رکھو، اور اگر طاقت ہو تو حج کرو۔',
  },
  {
    number: 3,
    arabic: 'بُنِيَ الإِسْلامُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لاَ إِلَهَ إِلاَّ اللهُ وَأَنَّ مُحَمَّداً رَسُولُ اللهِ',
    english: 'Islam was built upon five pillars: testifying that there is no god but Allah and that Muhammad is the Messenger of Allah, performing the prayer, paying zakat, making pilgrimage to the House, and fasting Ramadan.',
    urdu: 'اسلام کی بنیاد پانچ چیزوں پر رکھی گئی ہے: لا الہ الا اللہ اور محمد رسول اللہ کی گواہی، نماز، زکات، حج اور رمضان کے روزے۔',
  },
  {
    number: 4,
    arabic: 'مِنْ حُسْنِ إِسْلامِ الْمَرْءِ تَرْكُهُ مَا لاَ يَعْنِيهِ',
    english: 'Part of the perfection of a person\'s Islam is leaving alone what does not concern them.',
    urdu: 'کسی شخص کے اسلام کی خوبی یہ ہے کہ وہ بے فائدہ باتوں کو چھوڑ دے۔',
  },
  {
    number: 5,
    arabic: 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    english: 'None of you truly believes until he loves for his brother what he loves for himself.',
    urdu: 'تم میں سے کوئی اس وقت تک مومن نہیں جب تک وہ اپنے بھائی کے لیے وہی نہ چاہے جو اپنے لیے چاہتا ہے۔',
  },
  {
    number: 6,
    arabic: 'الْحَلاَلُ بَيِّنٌ وَالْحَرَامُ بَيِّنٌ',
    english: 'The lawful is clear and the unlawful is clear, and between them are doubtful matters that many people do not know about.',
    urdu: 'حلال واضح ہے اور حرام واضح ہے، اور ان دونوں کے درمیان مشتبہ امور ہیں جنہیں بہت سے لوگ نہیں جانتے۔',
  },
  {
    number: 7,
    arabic: 'الدِّينُ النَّصِيحَةُ',
    english: 'Religion is sincere counsel — to Allah, His Book, His Messenger, the leaders of the Muslims, and their common people.',
    urdu: 'دین خیرخواہی کا نام ہے — اللہ کے لیے، اس کی کتاب کے لیے، اس کے رسول ﷺ کے لیے، مسلمانوں کے ائمہ اور عوام کے لیے۔',
  },
  {
    number: 8,
    arabic: 'أُمِرْتُ أَنْ أُقَاتِلَ النَّاسَ حَتَّى يَشْهَدُوا أَنْ لاَ إِلَهَ إِلاَّ اللهُ',
    english: 'I have been commanded to fight people until they testify that there is no god but Allah and that Muhammad is the Messenger of Allah.',
    urdu: 'مجھے لوگوں سے لڑنے کا حکم دیا گیا ہے یہاں تک کہ وہ گواہی دیں کہ اللہ کے سوا کوئی معبود نہیں اور محمد ﷺ اللہ کے رسول ہیں۔',
  },
  {
    number: 9,
    arabic: 'مَا نَهَيْتُكُمْ عَنْهُ فَاجْتَنِبُوهُ، وَمَا أَمَرْتُكُمْ بِهِ فَافْعَلُوا مِنْهُ مَا اسْتَطَعْتُمْ',
    english: 'Whatever I have forbidden you, avoid it, and whatever I have commanded you, do as much of it as you are able.',
    urdu: 'جن چیزوں سے میں نے تمہیں منع کیا ان سے بچو، اور جن چیزوں کا میں نے حکم دیا انہیں اپنی طاقت کے مطابق ادا کرو۔',
  },
  {
    number: 10,
    arabic: 'إِنَّ اللَّهَ طَيِّبٌ لاَ يَقْبَلُ إِلاَّ طَيِّباً',
    english: 'Allah is pure and only accepts that which is pure. Allah has commanded the believers with the same that He commanded the Messengers.',
    urdu: 'بے شک اللہ پاک ہے اور پاک چیز ہی قبول فرماتا ہے۔ اللہ نے مومنوں کو وہی حکم دیا جو اس نے انبیاء کو دیا تھا۔',
  },
  {
    number: 11,
    arabic: 'دَعْ مَا يَرِيبُكَ إِلَى مَا لاَ يَرِيبُكَ',
    english: 'Leave what makes you doubt for what does not make you doubt.',
    urdu: 'جو چیز تمہیں شک میں ڈالے اسے چھوڑ دو اور جو شک میں نہ ڈالے اسے اختیار کرو۔',
  },
  {
    number: 12,
    arabic: 'مِنْ حُسْنِ الإِسْلامِ الْمَرْءِ تَرْكُهُ مَا لاَ يَعْنِيهِ',
    english: 'Part of the beauty of a person\'s Islam is their leaving alone that which does not concern them.',
    urdu: 'کسی شخص کے اسلام کی خوبصورتی یہ ہے کہ وہ لایعنی باتوں کو ترک کر دے۔',
  },
  {
    number: 13,
    arabic: 'لاَ يَحِلُّ لِمُسْلِمٍ أَنْ يَهْجُرَ أَخَاهُ فَوْقَ ثَلاَثٍ',
    english: 'It is not lawful for a Muslim to desert his brother for more than three days.',
    urdu: 'کسی مسلمان کے لیے جائز نہیں کہ وہ اپنے بھائی سے تین دن سے زیادہ قطع تعلق رکھے۔',
  },
  {
    number: 14,
    arabic: 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
    english: 'None of you truly believes until he loves for his brother what he loves for himself.',
    urdu: 'تم میں سے کوئی اس وقت تک مومن نہیں جب تک وہ اپنے بھائی کے لیے وہی نہ چاہے جو اپنے لیے چاہتا ہے۔',
  },
];

/** Fetch today's ayah — rotates through short surahs (78–114) daily */
export async function fetchDailyAyah(): Promise<DailyAyah> {
  const today = new Date().toISOString().slice(0, 10);
  return fetchWithCache(`daily-ayah:${today}`, async () => {
    const shortSurahs = Array.from({ length: 37 }, (_, i) => i + 78);
    const surahNumber = shortSurahs[getDayIndex(shortSurahs.length)];

    const [arabicRes, transRes, urduRes] = await Promise.all([
      quranClient.get(`/surah/${surahNumber}/quran-uthmani`),
      quranClient.get(`/surah/${surahNumber}/en.sahih`),
      quranClient.get(`/surah/${surahNumber}/ur.ahmedali`).catch(() => null),
    ]);

    const arabicAyahs = arabicRes.data.data.ayahs as Array<{
      number: number;
      numberInSurah: number;
      text: string;
    }>;
    const transAyahs = transRes.data.data.ayahs as Array<{ text: string }>;
    const urduAyahs = urduRes ? (urduRes.data.data.ayahs as Array<{ text: string }>) : null;
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
      translationUrdu: urduAyahs ? urduAyahs[ayahIdx]?.text : undefined,
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
      translationUrdu: selected.urdu,
      date: today,
    };
  });
}
