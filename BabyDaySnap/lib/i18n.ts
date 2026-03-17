import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

// Import all locales
import en from '../locales/en.json';
import ja from '../locales/ja.json';

const jaMonetizationOverrides = {
    adFreeDescription: "各画面のバナー広告と保存時の広告を非表示にします",
    adFreeUnlocked: "この端末では、各画面のバナー広告を非表示にしています",
    adFreeSheetTitle: "各画面のバナー広告を非表示にする",
    adFreeSheetDescription: "一度の購入で、この端末の各画面のバナー広告と保存時の広告を非表示にします",
    watchVideoHideDescription: "今日の残り時間は、各画面のバナー広告を非表示にします",
    removeAdsDescription: "各画面のバナー広告を非表示にする購入画面を開きます",
    bannerHiddenMessage: "今日の残り時間は、各画面のバナー広告を表示しません",
};

const translations = {
    en,
    ja: {
        ...en,
        ...ja,
        monetization: {
            ...en.monetization,
            ...ja.monetization,
            ...jaMonetizationOverrides,
        },
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
