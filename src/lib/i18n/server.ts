import { getSetting } from "../queries";
import { DICTS, translate, type Locale } from "./dictionaries";

export function getLocale(): Locale {
  const stored = getSetting("locale");
  return stored === "fa" || stored === "nl" ? stored : "en";
}

export function getServerT(locale: Locale) {
  return (key: string, vars?: Record<string, string | number>) => translate(DICTS[locale], key, vars);
}
