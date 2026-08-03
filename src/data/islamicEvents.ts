export interface IslamicEvent {
  id: string;
  name: string;
  arabicName: string;
  description: string;
  hijriMonth: number;
  hijriDay: number;
  hijriEndDay?: number;
  hijriMonthName: string;
  category: 'obligatory' | 'sunnah' | 'historical';
  color: string;
  icon: string;
  // Approximate Gregorian 2026
  approxGregorian2026: string;
}

export const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah',
];

export const ISLAMIC_EVENTS: IslamicEvent[] = [
  {
    id: 'muharram',
    name: 'Islamic New Year',
    arabicName: 'رأس السنة الهجرية',
    description: 'The first day of Muharram marks the beginning of the Islamic lunar calendar year, commemorating the Hijra (migration) of the Prophet Muhammad ﷺ from Mecca to Medina.',
    hijriMonth: 1, hijriDay: 1, hijriMonthName: 'Muharram',
    category: 'historical',
    color: '#4ADE80',
    icon: '🌙',
    approxGregorian2026: 'June 16, 2026',
  },
  {
    id: 'ashura',
    name: 'Day of Ashura',
    arabicName: 'يوم عاشوراء',
    description: 'The 10th of Muharram is Ashura — a day of great significance. The Prophet ﷺ recommended fasting on this day. It is the day Allah saved Musa (AS) and the Children of Israel.',
    hijriMonth: 1, hijriDay: 10, hijriMonthName: 'Muharram',
    category: 'sunnah',
    color: '#38BDF8',
    icon: '🤲',
    approxGregorian2026: 'June 25, 2026',
  },
  {
    id: 'mawlid',
    name: 'Mawlid al-Nabi',
    arabicName: 'المولد النبوي',
    description: 'The birth of Prophet Muhammad ﷺ on the 12th of Rabi al-Awwal. A day to reflect on the Seerah and send abundant salutations upon the Prophet ﷺ.',
    hijriMonth: 3, hijriDay: 12, hijriMonthName: "Rabi' al-Awwal",
    category: 'historical',
    color: '#F59E0B',
    icon: '⭐',
    approxGregorian2026: 'September 27, 2026',
  },
  {
    id: 'isra_miraj',
    name: "Isra' wal Mi'raj",
    arabicName: 'الإسراء والمعراج',
    description: "The miraculous night journey of Prophet Muhammad ﷺ from Mecca to Jerusalem (Isra'), then ascending to the heavens (Mi'raj), where the 5 daily prayers were ordained.",
    hijriMonth: 7, hijriDay: 27, hijriMonthName: 'Rajab',
    category: 'historical',
    color: '#C084FC',
    icon: '🌃',
    approxGregorian2026: 'February 13, 2027',
  },
  {
    id: 'shaban15',
    name: "Laylat al-Bara'at",
    arabicName: 'ليلة البراءة',
    description: "The 15th night of Sha'ban, known as Shab-e-Barat. A blessed night where it is recommended to offer optional prayers, recite Quran, and seek forgiveness.",
    hijriMonth: 8, hijriDay: 15, hijriMonthName: "Sha'ban",
    category: 'sunnah',
    color: '#818CF8',
    icon: '🌟',
    approxGregorian2026: 'March 3, 2027',
  },
  {
    id: 'ramadan_start',
    name: 'First Day of Ramadan',
    arabicName: 'أول رمضان',
    description: 'The blessed month of Ramadan begins — a month of fasting, prayer, charity, and Quran recitation. The gates of Heaven are opened and the gates of Hell are closed.',
    hijriMonth: 9, hijriDay: 1, hijriMonthName: 'Ramadan',
    category: 'obligatory',
    color: '#F59E0B',
    icon: '🌙',
    approxGregorian2026: 'March 17, 2027',
  },
  {
    id: 'laylatul_qadr',
    name: 'Laylat al-Qadr',
    arabicName: 'ليلة القدر',
    description: "The Night of Power, better than a thousand months. Sought in the last 10 nights of Ramadan (odd nights), particularly the 27th. Angel Jibreel (AS) descends with Allah's decree.",
    hijriMonth: 9, hijriDay: 27, hijriMonthName: 'Ramadan',
    category: 'obligatory',
    color: '#F472B6',
    icon: '✨',
    approxGregorian2026: 'April 12, 2027',
  },
  {
    id: 'eid_fitr',
    name: 'Eid al-Fitr',
    arabicName: 'عيد الفطر',
    description: "The Festival of Breaking the Fast. Celebrated on the 1st of Shawwal after the completion of Ramadan. It is obligatory to pay Zakat al-Fitr and perform the Eid prayer.",
    hijriMonth: 10, hijriDay: 1, hijriMonthName: 'Shawwal',
    category: 'obligatory',
    color: '#4ADE80',
    icon: '🎉',
    approxGregorian2026: 'April 17, 2027',
  },
  {
    id: 'arafah',
    name: 'Day of Arafah',
    arabicName: 'يوم عرفة',
    description: "The 9th of Dhu al-Hijjah, when pilgrims gather on the plains of Arafah. Fasting on this day expiates sins of the previous and coming year. The Prophet ﷺ called it the pillar of Hajj.",
    hijriMonth: 12, hijriDay: 9, hijriMonthName: 'Dhu al-Hijjah',
    category: 'obligatory',
    color: '#38BDF8',
    icon: '🏔️',
    approxGregorian2026: 'June 23, 2026',
  },
  {
    id: 'eid_adha',
    name: 'Eid al-Adha',
    arabicName: 'عيد الأضحى',
    description: "The Festival of Sacrifice — commemorating Prophet Ibrahim's (AS) willingness to sacrifice his son. Muslims offer Qurbani (sacrifice) and pray Eid prayer on the 10th of Dhu al-Hijjah.",
    hijriMonth: 12, hijriDay: 10, hijriMonthName: 'Dhu al-Hijjah',
    category: 'obligatory',
    color: '#EF4444',
    icon: '🐑',
    approxGregorian2026: 'June 26, 2027',
  },
  {
    id: 'dhulhijjah10',
    name: 'First 10 Days of Dhu al-Hijjah',
    arabicName: 'أول عشر ذي الحجة',
    description: "The Prophet ﷺ said: 'There are no days in which righteous deeds are more beloved to Allah than these ten days.' Increase in dhikr, fasting, and good deeds during this period.",
    hijriMonth: 12, hijriDay: 1, hijriEndDay: 10, hijriMonthName: 'Dhu al-Hijjah',
    category: 'sunnah',
    color: '#F59E0B',
    icon: '🌟',
    approxGregorian2026: 'June 16, 2027',
  },
];
