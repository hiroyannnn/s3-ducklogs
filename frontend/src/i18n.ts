import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import jaTranslation from './locales/ja/translation.json';
import enTranslation from './locales/en/translation.json';

const resources = {
  ja: {
    translation: jaTranslation
  },
  en: {
    translation: enTranslation
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ja',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // Reactは既にXSSを防いでいる
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    }
  });

export default i18n;
