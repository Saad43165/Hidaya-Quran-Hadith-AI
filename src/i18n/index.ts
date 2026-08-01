import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ur from './locales/ur.json';
import ar from './locales/ar.json';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    ur: { translation: ur },
    ar: { translation: ar },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

/** Arabic and Urdu are both RTL scripts. */
export const RTL_LANGUAGES = ['ur', 'ar'];

export default i18n;
