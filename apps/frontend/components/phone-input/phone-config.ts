// Configuración de países para el selector de teléfono
export const PHONE_COUNTRIES = [
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "ES", name: "España", flag: "🇪🇸" },
  { code: "CA", name: "Canadá", flag: "🇨🇦" },
] as const;

export type CountryCode = (typeof PHONE_COUNTRIES)[number]["code"];

// País por defecto
export const DEFAULT_COUNTRY: CountryCode = "US";

// Función para obtener el nombre del país por código
export const getCountryName = (code: CountryCode): string => {
  const country = PHONE_COUNTRIES.find((c) => c.code === code);
  return country?.name || code;
};

// Función para obtener la bandera del país por código
export const getCountryFlag = (code: CountryCode): string => {
  const country = PHONE_COUNTRIES.find((c) => c.code === code);
  return country?.flag || "🏳️";
};
