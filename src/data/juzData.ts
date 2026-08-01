/** All 30 Juz with their well-known names in Arabic, Urdu, and English */
export const JUZ_LIST = [
  { number: 1,  arabic: 'الم',           urdu: 'الم',          english: 'Alif Lam Meem',    startSurah: 1,  startAyah: 1  },
  { number: 2,  arabic: 'سَيَقُولُ',    urdu: 'سیقول',        english: 'Sayaqool',         startSurah: 2,  startAyah: 142},
  { number: 3,  arabic: 'تِلْكَ الرُّسُلُ', urdu: 'تلک الرسل',  english: 'Tilka ar-Rusul',   startSurah: 2,  startAyah: 253},
  { number: 4,  arabic: 'لَن تَنَالُوا', urdu: 'لن تنالوا',    english: "Lan Tanaloo",      startSurah: 3,  startAyah: 92 },
  { number: 5,  arabic: 'وَالْمُحْصَنَاتُ', urdu: 'والمحصنات',  english: 'Wal Mohsanat',     startSurah: 4,  startAyah: 24 },
  { number: 6,  arabic: 'لَا يُحِبُّ', urdu: 'لا یحب',        english: "La Yuhibbu",       startSurah: 4,  startAyah: 148},
  { number: 7,  arabic: 'وَإِذَا سَمِعُوا', urdu: 'واذا سمعوا',english: 'Wa Iza Samioo',    startSurah: 5,  startAyah: 82 },
  { number: 8,  arabic: 'وَلَوْ أَنَّنَا', urdu: 'ولو اننا',   english: 'Wa Lau Annana',    startSurah: 6,  startAyah: 111},
  { number: 9,  arabic: 'قَالَ الْمَلأُ', urdu: 'قال الملا',   english: "Qalal Malao",      startSurah: 7,  startAyah: 88 },
  { number: 10, arabic: 'وَاعْلَمُوا',   urdu: 'واعلموا',      english: 'Wa Alamu',         startSurah: 8,  startAyah: 41 },
  { number: 11, arabic: 'يَعْتَذِرُونَ', urdu: 'یعتذرون',     english: "Ya'taziroon",       startSurah: 9,  startAyah: 93 },
  { number: 12, arabic: 'وَمَا مِن دَآبَّةٍ', urdu: 'وما من دابۃ', english: 'Wa Ma Min Dabbah', startSurah: 11, startAyah: 6  },
  { number: 13, arabic: 'وَمَا أُبَرِّئُ', urdu: 'وما ابریء',  english: "Wama Ubarri'o",    startSurah: 12, startAyah: 53 },
  { number: 14, arabic: 'رُبَمَا',       urdu: 'ربما',          english: 'Rubama',           startSurah: 15, startAyah: 1  },
  { number: 15, arabic: 'سُبْحَانَ الَّذِي', urdu: 'سبحن الذی', english: 'Subhana Allazi',  startSurah: 17, startAyah: 1  },
  { number: 16, arabic: 'قَالَ أَلَمْ', urdu: 'قال الم',       english: "Qala Alam",        startSurah: 18, startAyah: 75 },
  { number: 17, arabic: 'اقْتَرَبَ',    urdu: 'اقترب',         english: 'Iqtaraba',         startSurah: 21, startAyah: 1  },
  { number: 18, arabic: 'قَدْ أَفْلَحَ', urdu: 'قد افلح',      english: 'Qad Aflaha',       startSurah: 23, startAyah: 1  },
  { number: 19, arabic: 'وَقَالَ الَّذِينَ', urdu: 'وقال الذین', english: 'Wa Qalallazina',  startSurah: 25, startAyah: 21 },
  { number: 20, arabic: 'أَمَّن خَلَقَ', urdu: 'امن خلق',      english: 'Amman Khalaqa',    startSurah: 27, startAyah: 56 },
  { number: 21, arabic: 'اتْلُ مَا أُوحِيَ', urdu: 'اتل ما اوحی', english: 'Utlu Ma Oohi', startSurah: 29, startAyah: 45 },
  { number: 22, arabic: 'وَمَن يَقْنُتْ', urdu: 'ومن یقنت',    english: 'Wa Man Yaqnut',    startSurah: 33, startAyah: 31 },
  { number: 23, arabic: 'وَمَا لِيَ',    urdu: 'ومالی',         english: 'Wa Mali',          startSurah: 36, startAyah: 28 },
  { number: 24, arabic: 'فَمَن أَظْلَمُ', urdu: 'فمن اظلم',    english: 'Faman Azlam',      startSurah: 39, startAyah: 32 },
  { number: 25, arabic: 'إِلَيْهِ يُرَدُّ', urdu: 'الیه یرد',  english: 'Ilahe Yuradu',     startSurah: 41, startAyah: 47 },
  { number: 26, arabic: 'حم',            urdu: 'حم',            english: 'Ha Meem',          startSurah: 46, startAyah: 1  },
  { number: 27, arabic: 'قَالَ فَمَا خَطْبُكُمْ', urdu: 'قال فما خطبکم', english: 'Qala Fama Khatbukum', startSurah: 51, startAyah: 31 },
  { number: 28, arabic: 'قَدْ سَمِعَ اللَّهُ', urdu: 'قد سمع اللہ', english: 'Qad Samiallah', startSurah: 58, startAyah: 1 },
  { number: 29, arabic: 'تَبَارَكَ الَّذِي', urdu: 'تبارک الذی', english: 'Tabaraka Allazi', startSurah: 67, startAyah: 1  },
  { number: 30, arabic: 'عَمَّ',         urdu: 'عم',            english: 'Amma',             startSurah: 78, startAyah: 1  },
] as const;

/** Map surah number to which Juz it starts in (approximate) */
export function getJuzForSurah(surahNumber: number): number {
  for (let i = JUZ_LIST.length - 1; i >= 0; i--) {
    if (JUZ_LIST[i].startSurah <= surahNumber) return JUZ_LIST[i].number;
  }
  return 1;
}
