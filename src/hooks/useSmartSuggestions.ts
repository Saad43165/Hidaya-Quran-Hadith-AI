import { useMemo } from 'react';
import { ConversationMode } from '../store/useAIStore';

interface Suggestion {
  text: string;
  textUr: string;
  mode: ConversationMode;
}

function getHijriMonth(): number {
  // Simple Hijri month approximation — accurate enough for seasonal suggestions
  // Proper Hijri libraries are not bundled; we use a rough offset
  const now = new Date();
  const jd = Math.floor((now.getTime() / 86400000) + 2440587.5);
  const z = jd + 0.5;
  const a = Math.floor((z - 1867216.25) / 36524.25);
  const b = z + 1 + a - Math.floor(a / 4) + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const dayOfMonth = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;
  // Rough Hijri conversion
  const n = jd - 1948439.5;
  const hijriMonth = Math.floor(((n % 10631) % 354) / 29.53);
  return (hijriMonth % 12) + 1;
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

const TIME_SUGGESTIONS: Record<ReturnType<typeof getTimeOfDay>, Suggestion[]> = {
  morning: [
    { text: 'What morning adhkar should I recite after Fajr?',        textUr: 'فجر کے بعد کون سے اذکار پڑھنے چاہئیں؟',     mode: 'dua'    },
    { text: 'Explain the Fajr prayer — its significance and blessings', textUr: 'فجر نماز کی اہمیت اور فضائل بیان کریں',    mode: 'learn'  },
    { text: 'A du\'a for a productive and blessed day',                textUr: 'پرسکون اور بابرکت دن کے لیے دعا',           mode: 'dua'    },
  ],
  afternoon: [
    { text: 'Explain the wisdom behind Dhuhr prayer at midday',       textUr: 'ظہر کی نماز کی حکمت بیان کریں',             mode: 'learn'  },
    { text: 'Du\'a to seek Allah\'s help in my work and responsibilities', textUr: 'کام اور ذمہ داریوں میں مدد کی دعا',    mode: 'dua'    },
    { text: 'What does Islam say about barakah in provision (rizq)?',  textUr: 'رزق میں برکت کے بارے میں اسلام کیا کہتا ہے؟', mode: 'fiqh' },
  ],
  evening: [
    { text: 'Evening adhkar: which are most important?',               textUr: 'شام کے اذکار: کون سے سب سے اہم ہیں؟',       mode: 'dua'    },
    { text: 'What is the tafsir of Ayat al-Kursi [Quran 2:255]?',     textUr: 'آیت الکرسی کی تفسیر بیان کریں',             mode: 'tafsir' },
    { text: 'Stories of Sahaba making the most of their evenings',     textUr: 'صحابہ کرام کی شام گزارنے کی کہانیاں',       mode: 'seerah' },
  ],
  night: [
    { text: 'Du\'a before sleeping — what did the Prophet ﷺ recite?',  textUr: 'سونے سے پہلے نبی ﷺ کون سی دعا پڑھتے تھے؟', mode: 'dua'    },
    { text: 'What is Tahajjud prayer and how do I start?',             textUr: 'تہجد نماز کیا ہے اور کیسے شروع کریں؟',      mode: 'learn'  },
    { text: 'Ayah about the night (Laylah) in the Quran',              textUr: 'قرآن میں رات کے بارے میں آیات',              mode: 'tafsir' },
  ],
};

const RAMADAN_SUGGESTIONS: Suggestion[] = [
  { text: 'Dua for breaking the fast (iftar)',                        textUr: 'افطار کی دعا',                                mode: 'dua'    },
  { text: 'What are the virtues of the last 10 nights of Ramadan?',  textUr: 'رمضان کے آخری دس دنوں کی فضیلت',            mode: 'learn'  },
  { text: 'Explain Laylat al-Qadr [Quran 97:1-5]',                   textUr: 'لیلۃ القدر کی تفسیر',                        mode: 'tafsir' },
];

const DHUL_HIJJAH_SUGGESTIONS: Suggestion[] = [
  { text: 'What makes the first 10 days of Dhul Hijjah so special?', textUr: 'ذوالحجہ کے پہلے دس دن کیوں خاص ہیں؟',      mode: 'learn'  },
  { text: 'Du\'a for Eid al-Adha',                                    textUr: 'عید الاضحیٰ کی دعا',                         mode: 'dua'    },
  { text: 'Story of Ibrahim ﷺ and Ismail ﷺ in Seerah',               textUr: 'ابراہیم ﷺ اور اسماعیل ﷺ کی سیرت',           mode: 'seerah' },
];

const MUHARRAM_SUGGESTIONS: Suggestion[] = [
  { text: 'Why is Ashura (10th Muharram) significant?',              textUr: 'عاشورا (دس محرم) کی اہمیت',                  mode: 'learn'  },
  { text: 'Du\'a recommended for the day of Ashura',                  textUr: 'عاشورا کے دن کی دعا',                        mode: 'dua'    },
];

const MODE_SUGGESTIONS: Record<ConversationMode, Suggestion[]> = {
  general: [
    { text: 'What are the five pillars of Islam?',                     textUr: 'اسلام کے پانچ ارکان کیا ہیں؟',              mode: 'general' },
    { text: 'How can I strengthen my iman (faith)?',                   textUr: 'ایمان کو کیسے مضبوط کریں؟',                  mode: 'general' },
    { text: 'What does Islam say about gratitude (shukr)?',            textUr: 'اسلام شکرگزاری کے بارے میں کیا کہتا ہے؟',   mode: 'general' },
  ],
  tafsir: [
    { text: 'Explain Surah Al-Fatiha in depth',                        textUr: 'سورۃ الفاتحہ کی تفصیلی تفسیر',               mode: 'tafsir' },
    { text: 'What is the message of Surah Al-Asr [Quran 103]?',       textUr: 'سورۃ العصر کا پیغام کیا ہے؟',                mode: 'tafsir' },
    { text: 'Tafsir of Ayat al-Kursi',                                  textUr: 'آیت الکرسی کی تفسیر',                        mode: 'tafsir' },
  ],
  dua: [
    { text: 'Best du\'a for anxiety and worry',                         textUr: 'پریشانی اور فکر کے لیے بہترین دعا',         mode: 'dua'    },
    { text: 'Du\'a for parents — what did the Quran teach us?',        textUr: 'والدین کے لیے قرآنی دعا',                    mode: 'dua'    },
    { text: 'Seeking forgiveness: du\'a for istighfar',                 textUr: 'استغفار کی دعا',                              mode: 'dua'    },
  ],
  fiqh: [
    { text: 'What invalidates wudu according to the four madhabs?',    textUr: 'چاروں مذاہب کے مطابق وضو کیسے ٹوٹتا ہے؟',  mode: 'fiqh'   },
    { text: 'Is cryptocurrency halal or haram?',                        textUr: 'کرپٹو کرنسی حلال ہے یا حرام؟',              mode: 'fiqh'   },
    { text: 'How does Islam view taking out a mortgage?',               textUr: 'اسلام میں مارگیج کا کیا حکم ہے؟',            mode: 'fiqh'   },
  ],
  learn: [
    { text: 'Explain the concept of tawakkul (reliance on Allah)',      textUr: 'توکل کا مفہوم بیان کریں',                    mode: 'learn'  },
    { text: 'What is ihsan and why does it matter?',                    textUr: 'احسان کیا ہے اور اس کی کیوں اہمیت ہے؟',     mode: 'learn'  },
    { text: 'Teach me about the 99 names of Allah',                     textUr: 'اللہ کے ۹۹ ناموں کے بارے میں بتائیں',       mode: 'learn'  },
  ],
  seerah: [
    { text: 'What was the Night Journey (Isra and Mi\'raj)?',          textUr: 'اسراء اور معراج کیا تھا؟',                   mode: 'seerah' },
    { text: 'How did the Prophet ﷺ treat non-Muslims?',                 textUr: 'نبی ﷺ غیر مسلموں سے کیسے پیش آتے تھے؟',    mode: 'seerah' },
    { text: 'Tell me about the Battle of Badr',                         textUr: 'غزوہ بدر کے بارے میں بتائیں',                mode: 'seerah' },
  ],
  word: [
    { text: 'Explain the Arabic word "Taqwa"',                          textUr: 'عربی لفظ "تقویٰ" کی وضاحت',                 mode: 'word'   },
    { text: 'What is the root meaning of "Quran"?',                     textUr: '"قرآن" کا جذر اور معنی کیا ہے؟',             mode: 'word'   },
    { text: 'Explain "Sabr" — all its Quranic meanings',                textUr: '"صبر" کے قرآنی معانی بیان کریں',             mode: 'word'   },
  ],
};

export function useSmartSuggestions(mode: ConversationMode): Suggestion[] {
  return useMemo(() => {
    const hijriMonth = getHijriMonth();
    const time       = getTimeOfDay();

    let seasonal: Suggestion[] = [];
    if (hijriMonth === 9)  seasonal = RAMADAN_SUGGESTIONS;
    if (hijriMonth === 12) seasonal = DHUL_HIJJAH_SUGGESTIONS;
    if (hijriMonth === 1)  seasonal = MUHARRAM_SUGGESTIONS;

    const timeSuggestions  = TIME_SUGGESTIONS[time];
    const modeSuggestions  = MODE_SUGGESTIONS[mode];

    // Pick 2 from seasonal (if available), then fill from time + mode
    const pool: Suggestion[] = [
      ...seasonal.slice(0, 2),
      ...timeSuggestions.slice(0, 2),
      ...modeSuggestions,
    ];

    // Dedupe by text and return 4
    const seen = new Set<string>();
    const out: Suggestion[] = [];
    for (const s of pool) {
      if (!seen.has(s.text)) {
        seen.add(s.text);
        out.push(s);
      }
      if (out.length === 4) break;
    }
    return out;
  }, [mode]);
}
