"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE, isAvailableLocale } from "@/lib/i18n/config";

export async function setLocale(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  const next = String(formData.get("next") ?? "/");

  if (isAvailableLocale(locale)) {
    const store = await cookies();
    store.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  redirect(next.startsWith("/") ? next : "/");
}
