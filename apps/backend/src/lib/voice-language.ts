import type { AgentLanguage } from "@addinvoice/db";

const LANGUAGE_NAMES: Record<AgentLanguage, string> = {
  de: "German",
  en: "English",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
};

export function languageDisplayName(lang: AgentLanguage): string {
  return LANGUAGE_NAMES[lang];
}
