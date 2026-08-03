export interface AdhkarItem {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
  count: number;
  benefits?: string;
}

export interface AdhkarSection {
  id: string;
  title: string;
  arabicTitle: string;
  time: 'morning' | 'evening' | 'afterPrayer' | 'sleep' | 'general';
  color: string;
  items: AdhkarItem[];
}

export const ADHKAR_SECTIONS: AdhkarSection[] = [
  {
    id: 'morning',
    title: 'Morning Adhkar',
    arabicTitle: 'أذكار الصباح',
    time: 'morning',
    color: '#F59E0B',
    items: [
      {
        id: 'm1',
        arabic: 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ\nاللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ',
        transliteration: "Allahu la ilaha illa huwa, Al-Hayyul-Qayyum, la ta'khudhuhu sinatun wa la nawm...",
        translation: 'Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep...',
        reference: 'Quran 2:255 (Ayat al-Kursi)',
        count: 1,
        benefits: 'Whoever recites Ayat al-Kursi in the morning will be protected until the evening.',
      },
      {
        id: 'm2',
        arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration: "Asbahna wa asbahal mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la shareeka lah, lahul mulku walahul hamd, wahuwa 'ala kulli shay'in qadeer",
        translation: 'We have reached the morning and at this very time all sovereignty belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah, alone, without partner.',
        reference: 'Abu Dawud 5076',
        count: 1,
      },
      {
        id: 'm3',
        arabic: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
        transliteration: "Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namootu, wa ilaykan-nushoor",
        translation: 'O Allah, by Your leave we have reached the morning and by Your leave we have reached the evening, by Your leave we live and die and unto You is our resurrection.',
        reference: 'Abu Dawud 5068, Tirmidhi 3391',
        count: 1,
      },
      {
        id: 'm4',
        arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
        transliteration: "Allahumma anta rabbi la ilaha illa anta, khalaqtani wa ana 'abduka, wa ana 'ala 'ahdika wa wa'dika mastata'tu...",
        translation: 'O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can...',
        reference: 'Bukhari 6306',
        count: 1,
        benefits: 'Sayyid al-Istighfar — the best form of seeking forgiveness. Whoever says this with firm conviction and dies that day will be from the people of Paradise.',
      },
      {
        id: 'm5',
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
        transliteration: 'Subhan Allahi wa bihamdihi',
        translation: 'Glory be to Allah and praise Him.',
        reference: 'Muslim 2692',
        count: 100,
        benefits: "Whoever says this 100 times, his sins will be forgiven even if they were like the foam of the sea.",
      },
      {
        id: 'm6',
        arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration: "La ilaha illallahu wahdahu la shareeka lah, lahul mulku walahul hamd, wahuwa 'ala kulli shay'in qadeer",
        translation: 'None has the right to be worshipped except Allah, alone, without partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent.',
        reference: 'Bukhari 3293, Muslim 2693',
        count: 10,
        benefits: 'Equivalent to freeing 10 slaves, 100 good deeds recorded, 100 sins wiped away, and protection from Shaytan all day.',
      },
      {
        id: 'm7',
        arabic: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
        transliteration: "Radeetu billahi rabba, wa bil islami deena, wa bi Muhammadin sallallahu 'alayhi wa sallama nabiyya",
        translation: 'I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace be upon him) as my Prophet.',
        reference: 'Abu Dawud 5072, Tirmidhi 3389',
        count: 3,
        benefits: 'It is the right of Allah to please whoever says this 3 times.',
      },
      {
        id: 'm8',
        arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ',
        transliteration: "Allahumma inni as'alukal 'afiyata fid-dunya wal akhirah",
        translation: 'O Allah, I ask You for wellbeing in this world and in the Hereafter.',
        reference: 'Ibn Majah 3871',
        count: 1,
      },
    ],
  },
  {
    id: 'evening',
    title: 'Evening Adhkar',
    arabicTitle: 'أذكار المساء',
    time: 'evening',
    color: '#818CF8',
    items: [
      {
        id: 'e1',
        arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration: "Amsayna wa amsal mulku lillah, walhamdu lillah, la ilaha illallahu wahdahu la shareeka lah...",
        translation: 'We have reached the evening and at this very time all sovereignty belongs to Allah. All praise is for Allah. None has the right to be worshipped except Allah, alone, without partner.',
        reference: 'Abu Dawud 5076',
        count: 1,
      },
      {
        id: 'e2',
        arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ',
        transliteration: "Allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namootu, wa ilaykal maseer",
        translation: 'O Allah, by Your leave we have reached the evening and by Your leave we have reached the morning, by Your leave we live and die and unto You is our return.',
        reference: 'Abu Dawud 5068, Tirmidhi 3391',
        count: 1,
      },
      {
        id: 'e3',
        arabic: 'اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ وَمَلَائِكَتَكَ وَجَمِيعَ خَلْقِكَ أَنَّكَ أَنْتَ اللَّهُ لَا إِلَٰهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ',
        transliteration: "Allahumma inni amsaytu ushhiduka wa ushhidu hamalata 'arshika wa mala'ikataka wa jami'a khalqika annaka antallahu la ilaha illa anta wahdaka la shareeka lak...",
        translation: 'O Allah, I have reached the evening and call upon You, the bearers of Your Throne, Your angels and all of Your creation to witness that You are Allah, none has the right to be worshipped except You, alone...',
        reference: 'Abu Dawud 5069',
        count: 4,
        benefits: 'Whoever says this 4 times in the morning or evening will be freed from the Fire.',
      },
      {
        id: 'e4',
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
        transliteration: 'Subhan Allahi wa bihamdihi',
        translation: 'Glory be to Allah and praise Him.',
        reference: 'Muslim 2692',
        count: 100,
      },
      {
        id: 'e5',
        arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
        transliteration: "A'oothu bikalimatillahit-tammati min sharri ma khalaq",
        translation: 'I take refuge in the perfect words of Allah from the evil of what He has created.',
        reference: 'Muslim 2708',
        count: 3,
        benefits: 'Whoever says this in the evening, nothing will harm them that night.',
      },
      {
        id: 'e6',
        arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
        transliteration: "Bismillahil-ladhi la yadurru ma'asmihi shay'un fil ardi wa la fis-sama'i wa huwas-sami'ul 'aleem",
        translation: 'In the name of Allah with whose name nothing is harmed on earth nor in the heavens, and He is the All-Hearing, All-Knowing.',
        reference: 'Abu Dawud 5088, Tirmidhi 3388',
        count: 3,
        benefits: 'Nothing will harm the one who says this 3 times.',
      },
    ],
  },
  {
    id: 'afterPrayer',
    title: 'After Prayer',
    arabicTitle: 'أذكار بعد الصلاة',
    time: 'afterPrayer',
    color: '#4ADE80',
    items: [
      {
        id: 'ap1',
        arabic: 'أَسْتَغْفِرُ اللَّهَ',
        transliteration: 'Astaghfirullah',
        translation: 'I seek forgiveness from Allah.',
        reference: 'Muslim 591',
        count: 3,
      },
      {
        id: 'ap2',
        arabic: 'اللَّهُمَّ أَنْتَ السَّلَامُ، وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
        transliteration: "Allahumma antas-salam, wa minkas-salam, tabarakta ya dhal jalali wal ikram",
        translation: 'O Allah, You are Peace and from You comes peace. Blessed are You, O Owner of majesty and honour.',
        reference: 'Muslim 591',
        count: 1,
      },
      {
        id: 'ap3',
        arabic: 'سُبْحَانَ اللَّهِ',
        transliteration: 'Subhan Allah',
        translation: 'Glory be to Allah.',
        reference: 'Muslim 596',
        count: 33,
      },
      {
        id: 'ap4',
        arabic: 'الْحَمْدُ لِلَّهِ',
        transliteration: 'Alhamdu lillah',
        translation: 'All praise is for Allah.',
        reference: 'Muslim 596',
        count: 33,
      },
      {
        id: 'ap5',
        arabic: 'اللَّهُ أَكْبَرُ',
        transliteration: 'Allahu Akbar',
        translation: 'Allah is the Greatest.',
        reference: 'Muslim 596',
        count: 33,
      },
      {
        id: 'ap6',
        arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration: "La ilaha illallahu wahdahu la shareeka lah, lahul mulku walahul hamd, wahuwa 'ala kulli shay'in qadeer",
        translation: 'None has the right to be worshipped except Allah, alone, without partner. To Him belongs all sovereignty and praise, and He is over all things omnipotent.',
        reference: 'Muslim 597',
        count: 1,
        benefits: 'Sins are forgiven even if they were like the foam of the sea.',
      },
    ],
  },
  {
    id: 'sleep',
    title: 'Before Sleep',
    arabicTitle: 'أذكار النوم',
    time: 'sleep',
    color: '#C084FC',
    items: [
      {
        id: 's1',
        arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
        transliteration: "Bismika Allahumma amootu wa ahya",
        translation: 'In Your name O Allah, I die and I live.',
        reference: 'Bukhari 6324',
        count: 1,
      },
      {
        id: 's2',
        arabic: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ',
        transliteration: "Allahumma qini 'adhabaka yawma tab'athu 'ibadak",
        translation: 'O Allah, protect me from Your punishment on the Day You resurrect Your slaves.',
        reference: 'Abu Dawud 5045, Tirmidhi 3398',
        count: 3,
      },
      {
        id: 's3',
        arabic: 'سُبْحَانَ اللَّهِ',
        transliteration: 'Subhan Allah',
        translation: 'Glory be to Allah.',
        reference: 'Bukhari 5362, Muslim 2727',
        count: 33,
        benefits: 'Better for you than a servant.',
      },
      {
        id: 's4',
        arabic: 'الْحَمْدُ لِلَّهِ',
        transliteration: 'Alhamdu lillah',
        translation: 'All praise is for Allah.',
        reference: 'Bukhari 5362, Muslim 2727',
        count: 33,
      },
      {
        id: 's5',
        arabic: 'اللَّهُ أَكْبَرُ',
        transliteration: 'Allahu Akbar',
        translation: 'Allah is the Greatest.',
        reference: 'Bukhari 5362, Muslim 2727',
        count: 34,
      },
      {
        id: 's6',
        arabic: 'اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَا مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ',
        transliteration: "Allahumma aslamtu nafsi ilayk, wa fawwadtu amri ilayk, wa wajjahtu wajhi ilayk...",
        translation: 'O Allah, I submit myself to You, entrust my affairs to You, turn my face to You, and take refuge with You, in hope and in fear of You...',
        reference: 'Bukhari 247, Muslim 2710',
        count: 1,
        benefits: "If you die that night you will die upon the fitrah (natural state of Islam).",
      },
    ],
  },
];
