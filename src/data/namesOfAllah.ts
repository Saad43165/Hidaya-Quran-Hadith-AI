export type NameCategory = 'jamal' | 'jalal' | 'kamal';

export interface NameOfAllah {
  number: number;
  arabic: string;
  transliteration: string;
  meaning: string;
  explanation: string;
  benefits: string;
  category: NameCategory;
}

// Numbers in Jamal (beauty/mercy) category
const JAMAL_NUMBERS = new Set([2, 3, 31, 33, 35, 43, 48, 80, 81, 83, 84]);
// Numbers in Jalal (majesty/power) category
const JALAL_NUMBERS = new Set([4, 5, 9, 10, 11, 16, 54, 55, 71, 82]);

function getCategory(n: number): NameCategory {
  if (JAMAL_NUMBERS.has(n)) return 'jamal';
  if (JALAL_NUMBERS.has(n)) return 'jalal';
  return 'kamal';
}

const BENEFITS_MAP: Record<number, string> = {
  2: 'Recite 100× daily for compassion in heart',
  3: 'Recite after each prayer for Allah\'s mercy',
  4: 'Recite after Fajr for worldly sufficiency',
};
const DEFAULT_BENEFIT = 'Recite with sincerity for closeness to Allah';

function b(n: number): string {
  return BENEFITS_MAP[n] ?? DEFAULT_BENEFIT;
}

function name(
  number: number,
  arabic: string,
  transliteration: string,
  meaning: string,
  explanation: string,
): NameOfAllah {
  return { number, arabic, transliteration, meaning, explanation, benefits: b(number), category: getCategory(number) };
}

export const NAMES_OF_ALLAH: NameOfAllah[] = [
  name(1,  'اللَّهُ',        'Allah',       'The Greatest Name',      'The personal name of God in Islam, encompassing all attributes of perfection.'),
  name(2,  'الرَّحْمَنُ',   'Ar-Rahman',   'The Most Gracious',      'The one whose vast mercy encompasses every single creation in this world.'),
  name(3,  'الرَّحِيمُ',    'Ar-Rahim',    'The Most Merciful',      'The one who specifically bestows mercy on the believers in the Hereafter.'),
  name(4,  'الْمَلِكُ',     'Al-Malik',    'The King',               'The sovereign Lord who possesses dominion over the entire universe.'),
  name(5,  'الْقُدُّوسُ',   'Al-Quddus',   'The Pure',               'The one who is pure and free from every deficiency or imperfection.'),
  name(6,  'السَّلَامُ',    'As-Salam',    'The Source of Peace',    'The one who is free from all faults and grants safety and peace to His creation.'),
  name(7,  'الْمُؤْمِنُ',   'Al-Mumin',    'The Guardian of Faith',  'The one who grants security and protects believers from harm and loss.'),
  name(8,  'الْمُهَيْمِنُ', 'Al-Muhaymin', 'The Protector',          'The one who watches over and protects all of His creation.'),
  name(9,  'الْعَزِيزُ',    'Al-Aziz',     'The Almighty',           'The all-powerful one who cannot be overcome by anything.'),
  name(10, 'الْجَبَّارُ',   'Al-Jabbar',   'The Compeller',          'The one who compels all His creation to His will.'),
  name(11, 'الْمُتَكَبِّرُ', 'Al-Mutakabbir', 'The Supreme',        'The one who possesses all greatness and is above all faults.'),
  name(12, 'الْخَالِقُ',    'Al-Khaliq',   'The Creator',            'The one who brings everything into existence from nothing.'),
  name(13, 'الْبَارِئُ',    'Al-Bari',     'The Evolver',            'The one who creates in a manner that distinguishes things from one another.'),
  name(14, 'الْمُصَوِّرُ',  'Al-Musawwir', 'The Fashioner',          'The one who forms and shapes all creatures in whatever way He wills.'),
  name(15, 'الْغَفَّارُ',   'Al-Ghaffar',  'The Forgiving',          'The one who continually forgives the sins of His servants.'),
  name(16, 'الْقَهَّارُ',   'Al-Qahhar',   'The Subduer',            'The one who dominates and has power over all things.'),
  name(17, 'الْوَهَّابُ',   'Al-Wahhab',   'The Bestower',           'The one who gives generously without limit or expectation of return.'),
  name(18, 'الرَّزَّاقُ',   'Ar-Razzaq',   'The Provider',           'The one who provides and sustains all of creation.'),
  name(19, 'الْفَتَّاحُ',   'Al-Fattah',   'The Opener',             'The one who opens all doors of mercy, sustenance, and knowledge.'),
  name(20, 'الْعَلِيمُ',    'Al-Alim',     'The All-Knowing',        'The one whose knowledge encompasses everything, seen and unseen.'),
  name(21, 'الْقَابِضُ',    'Al-Qabid',    'The Withholder',         'The one who holds back and restricts according to His wisdom.'),
  name(22, 'الْبَاسِطُ',    'Al-Basit',    'The Extender',           'The one who expands and gives abundantly according to His mercy.'),
  name(23, 'الْخَافِضُ',    'Al-Khafid',   'The Abaser',             'The one who humbles and lowers whoever He wills.'),
  name(24, 'الرَّافِعُ',    'Ar-Rafi',     'The Exalter',            'The one who raises and elevates whoever He wills in rank and honor.'),
  name(25, 'الْمُعِزُّ',    'Al-Muizz',    'The Honorer',            'The one who bestows honor, dignity, and strength upon His servants.'),
  name(26, 'الْمُذِلُّ',    'Al-Mudhill',  'The Dishonorer',         'The one who can abase and humiliate those who deserve it.'),
  name(27, 'السَّمِيعُ',    'As-Sami',     'The All-Hearing',        'The one who hears every sound, near and far, spoken and unspoken.'),
  name(28, 'الْبَصِيرُ',    'Al-Basir',    'The All-Seeing',         'The one who sees all things, no matter how small or hidden.'),
  name(29, 'الْحَكَمُ',     'Al-Hakam',    'The Judge',              'The one who judges between His creation with perfect justice.'),
  name(30, 'الْعَدْلُ',     'Al-Adl',      'The Just',               'The one who is perfectly just and equitable in all His decisions.'),
  name(31, 'اللَّطِيفُ',    'Al-Latif',    'The Subtle',             'The one who is aware of the finest details and is gentle with His servants.'),
  name(32, 'الْخَبِيرُ',    'Al-Khabir',   'The All-Aware',          'The one who is fully aware of all things, inner and outer.'),
  name(33, 'الْحَلِيمُ',    'Al-Halim',    'The Forbearing',         'The one who does not hasten to punish but remains patient and forgiving.'),
  name(34, 'الْعَظِيمُ',    'Al-Azim',     'The Magnificent',        'The one who possesses limitless greatness in every aspect.'),
  name(35, 'الْغَفُورُ',    'Al-Ghafur',   'The All-Forgiving',      'The one who forgives all sins, no matter how great, for those who repent.'),
  name(36, 'الشَّكُورُ',    'Ash-Shakur',  'The Appreciative',       'The one who rewards abundantly even for small acts of worship.'),
  name(37, 'الْعَلِيُّ',    'Al-Ali',      'The Most High',          'The one who is above all His creation in every sense.'),
  name(38, 'الْكَبِيرُ',    'Al-Kabir',    'The Most Great',         'The one who is great in essence, attributes, and deeds.'),
  name(39, 'الْحَفِيظُ',    'Al-Hafiz',    'The Preserver',          'The one who preserves and guards all things under His protection.'),
  name(40, 'الْمُقِيتُ',    'Al-Muqit',    'The Sustainer',          'The one who nourishes and sustains all of creation.'),
  name(41, 'الْحَسِيبُ',    'Al-Hasib',    'The Reckoner',           'The one who takes account of all deeds and rewards accordingly.'),
  name(42, 'الْجَلِيلُ',    'Al-Jalil',    'The Majestic',           'The one who possesses perfect majesty in His essence and attributes.'),
  name(43, 'الْكَرِيمُ',    'Al-Karim',    'The Most Generous',      'The one who is generous beyond measure, giving without end.'),
  name(44, 'الرَّقِيبُ',    'Ar-Raqib',    'The Watchful',           'The one who watches over all deeds of creation at every moment.'),
  name(45, 'الْمُجِيبُ',    'Al-Mujib',    'The Responsive',         'The one who answers every prayer and supplication.'),
  name(46, 'الْوَاسِعُ',    'Al-Wasi',     'The All-Encompassing',   'The one whose mercy, knowledge, and provision are boundless.'),
  name(47, 'الْحَكِيمُ',    'Al-Hakim',    'The All-Wise',           'The one who places all things in their proper place with perfect wisdom.'),
  name(48, 'الْوَدُودُ',    'Al-Wadud',    'The Most Loving',        'The one who loves the believers and whom the believers love.'),
  name(49, 'الْمَجِيدُ',    'Al-Majid',    'The Most Glorious',      'The one who is glorious in essence and generous in giving.'),
  name(50, 'الْبَاعِثُ',    'Al-Baith',    'The Resurrector',        'The one who will resurrect all creation on the Day of Judgment.'),
  name(51, 'الشَّهِيدُ',    'Ash-Shahid',  'The Witness',            'The one who witnesses all things at all times.'),
  name(52, 'الْحَقُّ',      'Al-Haqq',     'The Truth',              'The one who is the absolute truth and reality.'),
  name(53, 'الْوَكِيلُ',    'Al-Wakil',    'The Trustee',            'The one who is the perfect disposer of all affairs for those who trust in Him.'),
  name(54, 'الْقَوِيُّ',    'Al-Qawi',     'The All-Powerful',       'The one whose power is perfect and never diminishes.'),
  name(55, 'الْمَتِينُ',    'Al-Matin',    'The Firm',               'The one who is firm and never weakened or exhausted.'),
  name(56, 'الْوَلِيُّ',    'Al-Waliyy',   'The Protecting Friend',  'The guardian and close friend of the believers.'),
  name(57, 'الْحَمِيدُ',    'Al-Hamid',    'The Praiseworthy',       'The one who deserves all praise at all times.'),
  name(58, 'الْمُحْصِي',   'Al-Muhsi',    'The All-Enumerating',    'The one who counts and records everything without omission.'),
  name(59, 'الْمُبْدِئُ',   'Al-Mubdi',    'The Originator',         'The one who originates creation from nothing.'),
  name(60, 'الْمُعِيدُ',    'Al-Muid',     'The Restorer',           'The one who will restore creation after its destruction.'),
  name(61, 'الْمُحْيِي',   'Al-Muhyi',    'The Giver of Life',      'The one who gives life to all living things.'),
  name(62, 'الْمُمِيتُ',    'Al-Mumit',    'The Taker of Life',      'The one who causes death when He wills.'),
  name(63, 'الْحَيُّ',      'Al-Hayy',     'The Ever-Living',        'The one who is eternally alive and never dies.'),
  name(64, 'الْقَيُّومُ',   'Al-Qayyum',   'The Self-Subsisting',    'The one who is self-sufficient and sustains all of creation.'),
  name(65, 'الْوَاجِدُ',    'Al-Wajid',    'The Finder',             'The one who finds what He wills whenever He wills.'),
  name(66, 'الْمَاجِدُ',    'Al-Majid',    'The Noble',              'The one who is noble and generous to His servants.'),
  name(67, 'الْوَاحِدُ',    'Al-Wahid',    'The Unique',             'The one who is unique and unrivaled in His essence and attributes.'),
  name(68, 'الْأَحَدُ',     'Al-Ahad',     'The One',                'The uniquely singular one who has no partner or equal.'),
  name(69, 'الصَّمَدُ',     'As-Samad',    'The Eternal',            'The one to whom all creation turns for its needs.'),
  name(70, 'الْقَادِرُ',    'Al-Qadir',    'The Capable',            'The one who has the ability to do whatever He wills.'),
  name(71, 'الْمُقْتَدِرُ', 'Al-Muqtadir', 'The Powerful',           'The one whose power is absolute and complete.'),
  name(72, 'الْمُقَدِّمُ',  'Al-Muqaddim', 'The Expediter',          'The one who brings forward whom He wills.'),
  name(73, 'الْمُؤَخِّرُ',  'Al-Muakhkhir', 'The Delayer',           'The one who postpones what He wills according to His wisdom.'),
  name(74, 'الْأَوَّلُ',    'Al-Awwal',    'The First',              'The one who has no beginning — He existed before everything.'),
  name(75, 'الْآخِرُ',      'Al-Akhir',    'The Last',               'The one who will remain after everything else has perished.'),
  name(76, 'الظَّاهِرُ',    'Az-Zahir',    'The Manifest',           'The one who is manifest through His signs, creation, and power.'),
  name(77, 'الْبَاطِنُ',    'Al-Batin',    'The Hidden',             'The one whose essence cannot be fully perceived by any creation.'),
  name(78, 'الْوَالِي',     'Al-Wali',     'The Governor',           'The one who governs and administers all of creation.'),
  name(79, 'الْمُتَعَالِي', 'Al-Mutaali',  'The Self-Exalted',       'The one who is high and exalted above all things.'),
  name(80, 'الْبَرُّ',      'Al-Barr',     'The Source of Goodness', 'The one who is kind and benevolent to all His creation.'),
  name(81, 'التَّوَّابُ',   'At-Tawwab',   'The Acceptor of Repentance', 'The one who continually accepts repentance from His servants.'),
  name(82, 'الْمُنْتَقِمُ', 'Al-Muntaqim', 'The Avenger',            'The one who punishes those who persist in sin and tyranny.'),
  name(83, 'الْعَفُوُّ',    'Al-Afuww',    'The Pardoner',           'The one who pardons and overlooks the sins of those who repent.'),
  name(84, 'الرَّؤُوفُ',    'Ar-Rauf',     'The Most Kind',          'The one who is full of compassion and extreme gentleness.'),
  name(85, 'مَالِكُ الْمُلْكِ', 'Malik ul-Mulk', 'Owner of all Sovereignty', 'The one who owns and controls all dominion.'),
  name(86, 'ذُو الْجَلَالِ وَالْإِكْرَامِ', "Dhul Jalali wal Ikram", 'Lord of Majesty and Bounty', 'The owner of all greatness and generosity.'),
  name(87, 'الْمُقْسِطُ',   'Al-Muqsit',   'The Equitable',          'The one who is perfectly fair and equitable in all things.'),
  name(88, 'الْجَامِعُ',    'Al-Jami',     'The Gatherer',           'The one who will gather all creation on the Day of Resurrection.'),
  name(89, 'الْغَنِيُّ',    'Al-Ghani',    'The Self-Sufficient',    'The one who is completely free of all needs.'),
  name(90, 'الْمُغْنِي',    'Al-Mughni',   'The Enricher',           'The one who enriches whoever He wills from His bounty.'),
  name(91, 'الْمَانِعُ',    'Al-Mani',     'The Preventer',          'The one who prevents whatever He wills according to His wisdom.'),
  name(92, 'الضَّارُّ',     'Ad-Darr',     'The Creator of Harm',    'The one who creates harm and difficulty as a test or punishment.'),
  name(93, 'النَّافِعُ',    'An-Nafi',     'The Creator of Good',    'The one who creates benefit and good for whoever He wills.'),
  name(94, 'النُّورُ',      'An-Nur',      'The Light',              'The light of the heavens and earth who guides to the right path.'),
  name(95, 'الْهَادِي',     'Al-Hadi',     'The Guide',              'The one who guides His servants to what is right and beneficial.'),
  name(96, 'الْبَدِيعُ',    'Al-Badi',     'The Originator',         'The one who creates in ways and forms that have no precedent.'),
  name(97, 'الْبَاقِي',     'Al-Baqi',     'The Everlasting',        'The one who is permanent and will never cease to exist.'),
  name(98, 'الْوَارِثُ',    'Al-Warith',   'The Inheritor',          'The one who inherits the earth after all creation has perished.'),
  name(99, 'الرَّشِيدُ',    'Ar-Rashid',   'The Guide to Right Path', 'The one who guides all affairs to their perfect conclusion.'),
];
