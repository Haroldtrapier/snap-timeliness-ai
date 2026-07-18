import { describe, it, expect } from "vitest";
import {
  AVAILABLE_LOCALES,
  DEFAULT_LOCALE,
  isAvailableLocale,
  localeDir,
} from "@/lib/i18n/config";

describe("i18n config", () => {
  it("exposes English + Spanish as available", () => {
    const codes = AVAILABLE_LOCALES.map((l) => l.code);
    expect(codes).toContain("en");
    expect(codes).toContain("es");
  });

  it("default locale is available", () => {
    expect(isAvailableLocale(DEFAULT_LOCALE)).toBe(true);
  });

  it("isAvailableLocale rejects unlisted locales", () => {
    expect(isAvailableLocale("fr")).toBe(false);
    expect(isAvailableLocale("")).toBe(false);
  });

  it("localeDir is rtl only for known RTL languages", () => {
    expect(localeDir("en")).toBe("ltr");
    expect(localeDir("es")).toBe("ltr");
    expect(localeDir("ar")).toBe("rtl");
  });
});
