import { createI18n } from "vue-i18n";
import en from "./locales/en.js";
import nl from "./locales/nl.js";

const STORAGE_KEY = "locale";
const FALLBACK_LOCALE = "en";

export const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "nl", label: "Nederlands" },
];

const isSupported = (code) => SUPPORTED_LOCALES.some((l) => l.code === code);

const storedLocale = localStorage.getItem(STORAGE_KEY);
const initialLocale = isSupported(storedLocale) ? storedLocale : FALLBACK_LOCALE;

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: initialLocale,
  fallbackLocale: FALLBACK_LOCALE,
  messages: { en, nl },
});

document.documentElement.setAttribute("lang", initialLocale);

/**
 * Change the active locale and persist the choice.
 * @param {string} code - One of the SUPPORTED_LOCALES codes
 */
export const setLocale = (code) => {
  if (!isSupported(code)) return;
  i18n.global.locale.value = code;
  localStorage.setItem(STORAGE_KEY, code);
  document.documentElement.setAttribute("lang", code);
};

/** The currently active locale code (reactive ref). */
export const currentLocale = i18n.global.locale;

/**
 * Translate a key outside of a component's template (e.g. in plain JS / script).
 * Mirrors the template `$t` helper.
 */
export const t = (...args) => i18n.global.t(...args);

export default i18n;
