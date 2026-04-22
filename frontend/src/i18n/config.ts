/**
 * i18n Configuration
 * Multi-language support infrastructure
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translations
import enTranslations from "./locales/en.json";

// Available languages
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "zh", name: "Chinese", nativeName: "中文" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "ar", name: "Arabic", nativeName: "العربية", rtl: true },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];

// i18n configuration
i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n to react-i18next
  .init({
    resources: {
      en: { translation: enTranslations },
    },
    fallbackLng: "en",
    defaultNS: "translation",

    // Language detection options
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes
    },

    // React options
    react: {
      useSuspense: true,
    },

    // Performance
    load: "languageOnly", // Load only language code (en, not en-US)

    // Missing key handling
    saveMissing: process.env.NODE_ENV === "development",
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === "development") {
        console.warn(`Missing translation: ${lng}.${ns}.${key}`);
      }
    },
  });

export default i18n;
