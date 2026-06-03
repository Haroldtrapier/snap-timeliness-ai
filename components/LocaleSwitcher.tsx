"use client";

import { usePathname } from "next/navigation";
import { AVAILABLE_LOCALES } from "@/lib/i18n/config";
import { setLocale } from "@/app/actions/locale";

export default function LocaleSwitcher({ current, label }: { current: string; label: string }) {
  const pathname = usePathname();
  return (
    <form action={setLocale} className="locale-switcher" aria-label={label}>
      <input type="hidden" name="next" value={pathname || "/"} />
      {AVAILABLE_LOCALES.map((l) => (
        <button
          key={l.code}
          type="submit"
          name="locale"
          value={l.code}
          className={"locale-btn" + (current === l.code ? " active" : "")}
          aria-current={current === l.code ? "true" : undefined}
        >
          {l.code.toUpperCase()}
        </button>
      ))}
    </form>
  );
}
