// Country, dial-code, currency data for worldwide shipping.
// `hub` = the default Trackora hub used for routing in/out of that country.

export type Country = {
  code: string;   // ISO-2
  name: string;
  dial: string;   // e.g. "+1"
  currency: string; // ISO-4217
  hub: string;    // default hub id from network.ts (HUBS)
  flag: string;   // emoji
};

export const COUNTRIES: Country[] = [
  { code: "US", name: "United States",     dial: "+1",   currency: "USD", hub: "JFK", flag: "🇺🇸" },
  { code: "CA", name: "Canada",            dial: "+1",   currency: "CAD", hub: "YYZ", flag: "🇨🇦" },
  { code: "MX", name: "Mexico",            dial: "+52",  currency: "MXN", hub: "MEX", flag: "🇲🇽" },
  { code: "BR", name: "Brazil",            dial: "+55",  currency: "BRL", hub: "GRU", flag: "🇧🇷" },
  { code: "AR", name: "Argentina",         dial: "+54",  currency: "ARS", hub: "EZE", flag: "🇦🇷" },
  { code: "CO", name: "Colombia",          dial: "+57",  currency: "COP", hub: "BOG", flag: "🇨🇴" },
  { code: "CL", name: "Chile",             dial: "+56",  currency: "CLP", hub: "EZE", flag: "🇨🇱" },
  { code: "PE", name: "Peru",              dial: "+51",  currency: "PEN", hub: "BOG", flag: "🇵🇪" },
  { code: "GB", name: "United Kingdom",    dial: "+44",  currency: "GBP", hub: "LHR", flag: "🇬🇧" },
  { code: "IE", name: "Ireland",           dial: "+353", currency: "EUR", hub: "LHR", flag: "🇮🇪" },
  { code: "FR", name: "France",            dial: "+33",  currency: "EUR", hub: "CDG", flag: "🇫🇷" },
  { code: "DE", name: "Germany",           dial: "+49",  currency: "EUR", hub: "FRA", flag: "🇩🇪" },
  { code: "NL", name: "Netherlands",       dial: "+31",  currency: "EUR", hub: "AMS", flag: "🇳🇱" },
  { code: "BE", name: "Belgium",           dial: "+32",  currency: "EUR", hub: "AMS", flag: "🇧🇪" },
  { code: "ES", name: "Spain",             dial: "+34",  currency: "EUR", hub: "MAD", flag: "🇪🇸" },
  { code: "PT", name: "Portugal",          dial: "+351", currency: "EUR", hub: "MAD", flag: "🇵🇹" },
  { code: "IT", name: "Italy",             dial: "+39",  currency: "EUR", hub: "FRA", flag: "🇮🇹" },
  { code: "CH", name: "Switzerland",       dial: "+41",  currency: "CHF", hub: "FRA", flag: "🇨🇭" },
  { code: "AT", name: "Austria",           dial: "+43",  currency: "EUR", hub: "FRA", flag: "🇦🇹" },
  { code: "SE", name: "Sweden",            dial: "+46",  currency: "SEK", hub: "AMS", flag: "🇸🇪" },
  { code: "NO", name: "Norway",            dial: "+47",  currency: "NOK", hub: "AMS", flag: "🇳🇴" },
  { code: "DK", name: "Denmark",           dial: "+45",  currency: "DKK", hub: "AMS", flag: "🇩🇰" },
  { code: "FI", name: "Finland",           dial: "+358", currency: "EUR", hub: "AMS", flag: "🇫🇮" },
  { code: "PL", name: "Poland",            dial: "+48",  currency: "PLN", hub: "FRA", flag: "🇵🇱" },
  { code: "TR", name: "Turkey",            dial: "+90",  currency: "TRY", hub: "IST", flag: "🇹🇷" },
  { code: "RU", name: "Russia",            dial: "+7",   currency: "RUB", hub: "SVO", flag: "🇷🇺" },
  { code: "UA", name: "Ukraine",           dial: "+380", currency: "UAH", hub: "IST", flag: "🇺🇦" },
  { code: "EG", name: "Egypt",             dial: "+20",  currency: "EGP", hub: "CAI", flag: "🇪🇬" },
  { code: "NG", name: "Nigeria",           dial: "+234", currency: "NGN", hub: "LOS", flag: "🇳🇬" },
  { code: "KE", name: "Kenya",             dial: "+254", currency: "KES", hub: "CAI", flag: "🇰🇪" },
  { code: "ZA", name: "South Africa",      dial: "+27",  currency: "ZAR", hub: "JNB", flag: "🇿🇦" },
  { code: "MA", name: "Morocco",           dial: "+212", currency: "MAD", hub: "MAD", flag: "🇲🇦" },
  { code: "AE", name: "United Arab Emirates", dial: "+971", currency: "AED", hub: "DXB", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia",      dial: "+966", currency: "SAR", hub: "DXB", flag: "🇸🇦" },
  { code: "IL", name: "Israel",            dial: "+972", currency: "ILS", hub: "IST", flag: "🇮🇱" },
  { code: "QA", name: "Qatar",             dial: "+974", currency: "QAR", hub: "DXB", flag: "🇶🇦" },
  { code: "IN", name: "India",             dial: "+91",  currency: "INR", hub: "BOM", flag: "🇮🇳" },
  { code: "PK", name: "Pakistan",          dial: "+92",  currency: "PKR", hub: "DEL", flag: "🇵🇰" },
  { code: "BD", name: "Bangladesh",        dial: "+880", currency: "BDT", hub: "DEL", flag: "🇧🇩" },
  { code: "LK", name: "Sri Lanka",         dial: "+94",  currency: "LKR", hub: "BOM", flag: "🇱🇰" },
  { code: "SG", name: "Singapore",         dial: "+65",  currency: "SGD", hub: "SIN", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia",          dial: "+60",  currency: "MYR", hub: "SIN", flag: "🇲🇾" },
  { code: "ID", name: "Indonesia",         dial: "+62",  currency: "IDR", hub: "SIN", flag: "🇮🇩" },
  { code: "TH", name: "Thailand",          dial: "+66",  currency: "THB", hub: "SIN", flag: "🇹🇭" },
  { code: "VN", name: "Vietnam",           dial: "+84",  currency: "VND", hub: "HKG", flag: "🇻🇳" },
  { code: "PH", name: "Philippines",       dial: "+63",  currency: "PHP", hub: "HKG", flag: "🇵🇭" },
  { code: "HK", name: "Hong Kong",         dial: "+852", currency: "HKD", hub: "HKG", flag: "🇭🇰" },
  { code: "TW", name: "Taiwan",            dial: "+886", currency: "TWD", hub: "HKG", flag: "🇹🇼" },
  { code: "CN", name: "China",             dial: "+86",  currency: "CNY", hub: "PVG", flag: "🇨🇳" },
  { code: "JP", name: "Japan",             dial: "+81",  currency: "JPY", hub: "NRT", flag: "🇯🇵" },
  { code: "KR", name: "South Korea",       dial: "+82",  currency: "KRW", hub: "ICN", flag: "🇰🇷" },
  { code: "AU", name: "Australia",         dial: "+61",  currency: "AUD", hub: "SYD", flag: "🇦🇺" },
  { code: "NZ", name: "New Zealand",       dial: "+64",  currency: "NZD", hub: "AKL", flag: "🇳🇿" },
];

export const countryByCode = new Map(COUNTRIES.map(c => [c.code, c]));

// Common currencies (deduped, ordered by familiarity)
export const CURRENCIES: { code: string; symbol: string; name: string }[] = [
  { code: "USD", symbol: "$",    name: "US Dollar" },
  { code: "EUR", symbol: "€",    name: "Euro" },
  { code: "GBP", symbol: "£",    name: "British Pound" },
  { code: "JPY", symbol: "¥",    name: "Japanese Yen" },
  { code: "CNY", symbol: "¥",    name: "Chinese Yuan" },
  { code: "INR", symbol: "₹",    name: "Indian Rupee" },
  { code: "AED", symbol: "د.إ",  name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼",    name: "Saudi Riyal" },
  { code: "AUD", symbol: "A$",   name: "Australian Dollar" },
  { code: "NZD", symbol: "NZ$",  name: "New Zealand Dollar" },
  { code: "CAD", symbol: "C$",   name: "Canadian Dollar" },
  { code: "MXN", symbol: "Mex$", name: "Mexican Peso" },
  { code: "BRL", symbol: "R$",   name: "Brazilian Real" },
  { code: "ARS", symbol: "$",    name: "Argentine Peso" },
  { code: "CLP", symbol: "$",    name: "Chilean Peso" },
  { code: "COP", symbol: "$",    name: "Colombian Peso" },
  { code: "PEN", symbol: "S/",   name: "Peruvian Sol" },
  { code: "CHF", symbol: "CHF",  name: "Swiss Franc" },
  { code: "SEK", symbol: "kr",   name: "Swedish Krona" },
  { code: "NOK", symbol: "kr",   name: "Norwegian Krone" },
  { code: "DKK", symbol: "kr",   name: "Danish Krone" },
  { code: "PLN", symbol: "zł",   name: "Polish Zloty" },
  { code: "TRY", symbol: "₺",    name: "Turkish Lira" },
  { code: "RUB", symbol: "₽",    name: "Russian Ruble" },
  { code: "UAH", symbol: "₴",    name: "Ukrainian Hryvnia" },
  { code: "ZAR", symbol: "R",    name: "South African Rand" },
  { code: "NGN", symbol: "₦",    name: "Nigerian Naira" },
  { code: "KES", symbol: "KSh",  name: "Kenyan Shilling" },
  { code: "EGP", symbol: "£",    name: "Egyptian Pound" },
  { code: "MAD", symbol: "DH",   name: "Moroccan Dirham" },
  { code: "ILS", symbol: "₪",    name: "Israeli Shekel" },
  { code: "QAR", symbol: "QR",   name: "Qatari Riyal" },
  { code: "PKR", symbol: "₨",    name: "Pakistani Rupee" },
  { code: "BDT", symbol: "৳",    name: "Bangladeshi Taka" },
  { code: "LKR", symbol: "Rs",   name: "Sri Lankan Rupee" },
  { code: "SGD", symbol: "S$",   name: "Singapore Dollar" },
  { code: "MYR", symbol: "RM",   name: "Malaysian Ringgit" },
  { code: "IDR", symbol: "Rp",   name: "Indonesian Rupiah" },
  { code: "THB", symbol: "฿",    name: "Thai Baht" },
  { code: "VND", symbol: "₫",    name: "Vietnamese Dong" },
  { code: "PHP", symbol: "₱",    name: "Philippine Peso" },
  { code: "HKD", symbol: "HK$",  name: "Hong Kong Dollar" },
  { code: "TWD", symbol: "NT$",  name: "Taiwan Dollar" },
  { code: "KRW", symbol: "₩",    name: "South Korean Won" },
];

export const currencyByCode = new Map(CURRENCIES.map(c => [c.code, c]));

export function formatMoney(amount: number, code: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: code, maximumFractionDigits: 2 }).format(amount);
  } catch {
    const c = currencyByCode.get(code);
    return `${c?.symbol ?? ""}${amount.toLocaleString()} ${code}`;
  }
}

/** Choose the default hub for a given country. Falls back to JFK. */
export function hubForCountry(code: string): string {
  return countryByCode.get(code)?.hub ?? "JFK";
}