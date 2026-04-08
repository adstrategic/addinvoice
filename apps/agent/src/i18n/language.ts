export const SUPPORTED_LANGUAGES = ["es", "en", "fr", "pt", "de"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "es";

export const DEEPGRAM_LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  es: "es",
  en: "en",
  fr: "fr-CA",
  pt: "pt-BR",
  de: "de",
};

export const CARTESIA_LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  es: "es",
  en: "en",
  fr: "fr",
  pt: "pt",
  de: "de",
};

// Default voice used today in the agent for English.
const DEFAULT_CARTESIA_VOICE_ID_EN =
  "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc";

export function normalizeAgentLanguage(raw: unknown): SupportedLanguage {
  if (typeof raw !== "string") return DEFAULT_LANGUAGE;
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(raw)
    ? (raw as SupportedLanguage)
    : DEFAULT_LANGUAGE;
}

export function getDeepgramLanguageCode(lang: SupportedLanguage): string {
  return DEEPGRAM_LANGUAGE_MAP[lang];
}

export function getCartesiaLanguageCode(lang: SupportedLanguage): string {
  return CARTESIA_LANGUAGE_MAP[lang];
}

export function getCartesiaVoiceId(
  lang: SupportedLanguage,
): string | undefined {
  const envVarByLang: Record<SupportedLanguage, string> = {
    en: "CARTESIA_VOICE_ID_EN",
    es: "CARTESIA_VOICE_ID_ES",
    fr: "CARTESIA_VOICE_ID_FR",
    pt: "CARTESIA_VOICE_ID_PT",
    de: "CARTESIA_VOICE_ID_DE",
  };

  const envValue = process.env[envVarByLang[lang]];
  if (envValue) return envValue;

  if (lang === "en") return DEFAULT_CARTESIA_VOICE_ID_EN;
  return undefined;
}

