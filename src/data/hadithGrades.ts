/**
 * Hadith authenticity grades for well-known hadiths.
 * Grade system: Sahih (authentic) > Hasan (good) > Da'if (weak) > Mawdu' (fabricated)
 * Keyed by collectionId:hadithNumber
 */
export type HadithGrade = 'sahih' | 'hasan' | 'daif' | 'mawdu' | 'unknown';

export const GRADE_LABELS: Record<HadithGrade, string> = {
  sahih:   'Sahih (Authentic)',
  hasan:   'Hasan (Good)',
  daif:    "Da'if (Weak)",
  mawdu:   "Mawdu' (Fabricated)",
  unknown: 'Grade Unknown',
};

export const GRADE_COLORS: Record<HadithGrade, string> = {
  sahih:   '#1E6B4A',
  hasan:   '#2E6B80',
  daif:    '#8A6010',
  mawdu:   '#9B2B1A',
  unknown: '#6B7280',
};

export const GRADE_BG: Record<HadithGrade, string> = {
  sahih:   '#E8F5EF',
  hasan:   '#E6F0F5',
  daif:    '#FDF3DF',
  mawdu:   '#FAECEA',
  unknown: '#F3F4F6',
};

/** Returns grade for a given collection + hadith number */
export function getHadithGrade(collectionId: string, hadithNumber: number): HadithGrade {
  // Nawawi's 40 are all sahih/hasan by scholarly consensus
  if (collectionId === 'nawawi') return 'sahih';
  // Bukhari and Muslim are sahih by definition
  if (collectionId === 'bukhari' || collectionId === 'muslim') return 'sahih';
  // Qudsi hadiths — generally sahih
  if (collectionId === 'qudsi') return 'sahih';
  // For others we return unknown — the actual grade requires per-hadith lookup
  return 'unknown';
}

export interface ScholarNote {
  scholar: string;
  madhab?: string;
  note: string;
}

/** Well-known scholarly notes on major topics — shown in relevant chapters */
export const CHAPTER_SCHOLAR_NOTES: Record<string, ScholarNote[]> = {
  'Ablution (Wuzu)': [
    { scholar: 'Ibn Qudama (Hanbali)', note: 'Intention (niyyah) is obligatory for wudu according to the majority of scholars.' },
    { scholar: 'Imam al-Nawawi (Shafi\'i)', note: 'The obligatory acts of wudu are six: intention, washing the face, both arms, wiping the head, washing the feet, and maintaining order.' },
  ],
  'Bathing (Ghusl)': [
    { scholar: 'Ibn Rushd', note: 'Scholars agree ghusl is obligatory after sexual intercourse, ejaculation, menstruation, and postnatal bleeding.' },
  ],
  'Fasting (Sawm)': [
    { scholar: 'Ibn Taymiyyah (Hanbali)', note: 'The intention for Ramadan fasting must be made before Fajr each night according to the majority.' },
    { scholar: 'Imam Malik', note: 'A single intention at the start of Ramadan suffices for the whole month according to the Maliki school.' },
  ],
  'Prayer (Salah)': [
    { scholar: 'Imam al-Shafi\'i', note: 'Prayer is the pillar of the religion. Its conditions are purity, covering the awrah, facing the qibla, and intention.' },
  ],
  'Zakat': [
    { scholar: 'Ibn Qudama', note: 'Zakat becomes obligatory when the nisab threshold is reached and one complete lunar year passes while owning that amount.' },
  ],
  'Marriage (Nikah)': [
    { scholar: 'Imam Ibn Hazm', note: 'The guardian (wali), two witnesses, and the consent of both parties are essential components of a valid marriage contract.' },
  ],
};
