// Internationalization config.
//
// The product targets 12 languages (see the FAQ). Translations are added one
// catalog at a time; AVAILABLE_LOCALES lists the ones that actually have a
// catalog today, and the language switcher only offers those. Untranslated
// locales fall back to English.

export const LOCALE_COOKIE = "snap_locale";
export const DEFAULT_LOCALE = "en";

export interface LocaleInfo {
  code: string;
  name: string;
  dir: "ltr" | "rtl";
}

export const AVAILABLE_LOCALES: LocaleInfo[] = [
  { code: "en", name: "English", dir: "ltr" },
  { code: "es", name: "Español", dir: "ltr" },
];

export function isAvailableLocale(code: string): boolean {
  return AVAILABLE_LOCALES.some((l) => l.code === code);
}

export function localeDir(code: string): "ltr" | "rtl" {
  // Arabic (and other RTL languages) when their catalogs are added.
  return code === "ar" ? "rtl" : "ltr";
}
