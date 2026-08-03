import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type Madhab = 'hanafi' | 'shafii' | 'maliki' | 'hanbali' | 'none';
export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';
export type AILanguage = 'en' | 'ur' | 'ar';
export type ConversationMode = 'general' | 'tafsir' | 'dua' | 'fiqh' | 'learn' | 'seerah' | 'word';

export interface SavedAnswer {
  id: string;
  question: string;
  answer: string;
  mode: ConversationMode;
  savedAt: number;
}

export const CONVERSATION_MODES: {
  key: ConversationMode;
  icon: string;
  labelEn: string;
  labelUr: string;
  color: string;
  placeholder: string;
  placeholderUr: string;
}[] = [
  { key: 'general', icon: '✨', labelEn: 'General',  labelUr: 'عام',      color: '#38BDF8', placeholder: 'Ask anything Islamic…',       placeholderUr: 'کوئی بھی سوال پوچھیں…' },
  { key: 'tafsir',  icon: '📖', labelEn: 'Tafsir',   labelUr: 'تفسیر',   color: '#F59E0B', placeholder: 'Ask about an ayah or surah…',  placeholderUr: 'آیت یا سورہ کے بارے میں پوچھیں…' },
  { key: 'dua',     icon: '🤲', labelEn: "Du'a",     labelUr: 'دعا',     color: '#4ADE80', placeholder: 'Find a du\'a for any occasion…', placeholderUr: 'کسی موقع کے لیے دعا تلاش کریں…' },
  { key: 'fiqh',    icon: '⚖️', labelEn: 'Fiqh',     labelUr: 'فقہ',     color: '#C084FC', placeholder: 'Ask about Islamic rulings…',    placeholderUr: 'اسلامی احکام کے بارے میں پوچھیں…' },
  { key: 'learn',   icon: '🎓', labelEn: 'Learn',    labelUr: 'سیکھیں',  color: '#60A5FA', placeholder: 'What topic to learn today?',    placeholderUr: 'آج کیا سیکھنا ہے؟' },
  { key: 'seerah',  icon: '🌙', labelEn: 'Seerah',   labelUr: 'سیرت',    color: '#F472B6', placeholder: 'Ask about the Prophet\'s ﷺ life…', placeholderUr: 'نبی ﷺ کی سیرت کے بارے میں…' },
  { key: 'word',    icon: '🔤', labelEn: 'Arabic',   labelUr: 'عربی',    color: '#34D399', placeholder: 'Enter an Arabic word to explain…', placeholderUr: 'عربی لفظ کی وضاحت…' },
];

const PREFS_KEY   = 'kitaabai.ai.prefs';
const SAVED_KEY   = 'kitaabai.ai.saved';

interface AIState {
  madhab:       Madhab;
  level:        KnowledgeLevel;
  language:     AILanguage;
  mode:         ConversationMode;
  savedAnswers: SavedAnswer[];
  onboarded:    boolean;

  setMadhab:          (m: Madhab) => Promise<void>;
  setLevel:           (l: KnowledgeLevel) => Promise<void>;
  setLanguage:        (l: AILanguage) => void;
  setMode:            (m: ConversationMode) => void;
  saveAnswer:         (q: string, a: string, mode: ConversationMode) => Promise<void>;
  deleteSavedAnswer:  (id: string) => Promise<void>;
  completeOnboarding: (madhab: Madhab, level: KnowledgeLevel) => Promise<void>;
  hydrate:            () => Promise<void>;
}

export const useAIStore = create<AIState>((set, get) => ({
  madhab:       'none',
  level:        'intermediate',
  language:     'en',
  mode:         'general',
  savedAnswers: [],
  onboarded:    false,

  setMadhab: async (madhab) => {
    set({ madhab });
    await _savePrefs({ ...get(), madhab });
  },
  setLevel: async (level) => {
    set({ level });
    await _savePrefs({ ...get(), level });
  },
  setLanguage: (language) => set({ language }),
  setMode: (mode) => set({ mode }),

  saveAnswer: async (question, answer, mode) => {
    const entry: SavedAnswer = { id: `${Date.now()}`, question, answer, mode, savedAt: Date.now() };
    const next = [entry, ...get().savedAnswers].slice(0, 100);
    set({ savedAnswers: next });
    await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next)).catch(() => {});
  },

  deleteSavedAnswer: async (id) => {
    const next = get().savedAnswers.filter(a => a.id !== id);
    set({ savedAnswers: next });
    await AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next)).catch(() => {});
  },

  completeOnboarding: async (madhab, level) => {
    set({ madhab, level, onboarded: true });
    await _savePrefs({ ...get(), madhab, level, onboarded: true });
  },

  hydrate: async () => {
    try {
      const [prefsRaw, savedRaw] = await Promise.all([
        AsyncStorage.getItem(PREFS_KEY),
        AsyncStorage.getItem(SAVED_KEY),
      ]);
      const prefs = prefsRaw ? JSON.parse(prefsRaw) : {};
      const saved = savedRaw ? JSON.parse(savedRaw) : [];
      set({
        madhab:    prefs.madhab    ?? 'none',
        level:     prefs.level     ?? 'intermediate',
        language:  prefs.language  ?? 'en',
        onboarded: prefs.onboarded ?? false,
        savedAnswers: saved,
      });
    } catch {}
  },
}));

async function _savePrefs(state: AIState) {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify({
    madhab:    state.madhab,
    level:     state.level,
    language:  state.language,
    onboarded: state.onboarded,
  })).catch(() => {});
}
