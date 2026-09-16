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

const dateTimeFormat = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

const dateFormat = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

const isoDayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Istanbul",
});

export function formatDateTime(iso: string) {
  return dateTimeFormat.format(new Date(iso));
}

export function formatDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

export function istanbulDay(offsetDays: number) {
  const date = new Date(Date.now() + offsetDays * 86_400_000);
  return { iso: isoDayFormat.format(date), label: dateFormat.format(date) };
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
