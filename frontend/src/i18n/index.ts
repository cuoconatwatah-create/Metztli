// ─────────────────────────────────────────────────────────
// Metztli — i18next Configuration (Trilingual)
// ─────────────────────────────────────────────────────────

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import es from './locales/es.json';
import miskitu from './locales/miskitu.json';
import creole from './locales/creole.json';
import uiCreole from './locales/ui.creole';
import uiMiskitu from './locales/ui.miskitu';
import { saveLanguage } from './storage';

const resources = {
  es: { translation: es },
  miskitu: { translation: miskitu, ui: uiMiskitu },
  creole: { translation: creole, ui: uiCreole },
};

/**
 * Detects the device locale and maps it to a supported language.
 * Falls back to Spanish if the locale is not supported.
 */
function detectLanguage(): string {
  const locales = Localization.getLocales();
  if (locales.length > 0) {
    const deviceLang = locales[0].languageCode;
    if (deviceLang === 'es') return 'es';
    if (deviceLang === 'en') return 'creole'; // English speakers likely prefer Creole
  }
  return 'es'; // Default to Spanish
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v3',
});

// Recordar la última elección de idioma (se restaura al abrir la app, ver App.tsx)
i18n.on('languageChanged', (lng) => {
  saveLanguage(lng);
});

export default i18n;
