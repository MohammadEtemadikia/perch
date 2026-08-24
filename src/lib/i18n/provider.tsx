"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DICTS, translate, type Locale } from "./dictionaries";

type Ctx = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.documentElement.setAttribute("lang", next);
    document.documentElement.setAttribute("dir", next === "fa" ? "rtl" : "ltr");
    void fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ locale: next }) });
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(DICTS[locale], key, vars), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within an I18nProvider");
  return ctx;
}
