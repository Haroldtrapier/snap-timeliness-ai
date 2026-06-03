import { cookies } from "next/headers";
import { LOCALE_COOKIE, DEFAULT_LOCALE, isAvailableLocale } from "./config";
import { en, type Messages } from "./messages/en";
import { es } from "./messages/es";

const DICTS: Record<string, Messages> = { en, es };

export async function getLocale(): Promise<string> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value && isAvailableLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getMessages(): Promise<Messages> {
  const locale = await getLocale();
  return DICTS[locale] ?? en;
}

export type { Messages };
