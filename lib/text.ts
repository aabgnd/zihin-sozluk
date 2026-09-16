const TR_TO_ASCII: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

export const RULES_TITLE = "stoa adabı ve sözlük kuralları";

export const RULES_TEXT =
  "Zihin Sözlük üyeleri birbirine karşı nazik, saygılı ve nezaket kurallarına uygun davranmakla yükümlüdür. Hakaret, kışkırtma ve nezaketsiz davranışlarda bulunan hesaplar uyarı yapılmadan kapatılabilir.";

export function normalizeTitle(input: string) {
  return input.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();
}

export function slugify(input: string) {
  return normalizeTitle(input)
    .replace(/[çğıöşü]/g, (char) => TR_TO_ASCII[char])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
}

/*
 * Tüm tarih/saat gösterimi buradan geçer. Biçim: 16.09.2026 13:30
 *
 * Saatler veritabanında UTC durur. "site" saat dilimi yalnızca sunucuda
 * boyanan ilk hâl içindir; kullanıcının gördüğü saat LocalTime bileşeni
 * aracılığıyla kendi cihazının saat dilimine göre yazılır.
 */
export type StampMode = "datetime" | "date";

const SITE_TIMEZONE = "Europe/Istanbul";

function buildFormat(mode: StampMode, timeZone: string | undefined) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(mode === "datetime"
      ? { hour: "2-digit" as const, minute: "2-digit" as const }
      : {}),
    ...(timeZone ? { timeZone } : {}),
  });
}

const FORMATS = {
  "datetime:site": buildFormat("datetime", SITE_TIMEZONE),
  "date:site": buildFormat("date", SITE_TIMEZONE),
  "datetime:device": buildFormat("datetime", undefined),
  "date:device": buildFormat("date", undefined),
};

export function formatStamp(
  iso: string,
  mode: StampMode = "datetime",
  zone: "site" | "device" = "site",
) {
  return FORMATS[`${mode}:${zone}`].format(new Date(iso));
}

const isoDayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: SITE_TIMEZONE,
});

/** Metin içine gömülen saatler (mail, uyarı cümlesi) için site saati. */
export function formatDateTime(iso: string) {
  return formatStamp(iso, "datetime");
}

export function formatDate(iso: string) {
  return formatStamp(iso, "date");
}

export function istanbulDay(offsetDays: number) {
  const date = new Date(Date.now() + offsetDays * 86_400_000);
  // Gündem günü site saatine göre belirlenir, cihaza göre değil.
  return {
    iso: isoDayFormat.format(date),
    label: formatStamp(date.toISOString(), "date"),
  };
}

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
