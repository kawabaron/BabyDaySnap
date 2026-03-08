import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

// Import all locales
import en from '../locales/en.json';
import ja from '../locales/ja.json';

const translations = {
    en,
    ja: {
        ...en,
        ...ja,
    },
};

const i18n = new I18n(translations);

// Set the locale once at the beginning of your app.
i18n.locale = getLocales()[0].languageCode ?? 'en';

// When a value is missing from a language it'll fall back to another language with the key present.
i18n.enableFallback = true;
// Fallback language
i18n.defaultLocale = 'en';

export default i18n;
