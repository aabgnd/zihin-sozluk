import Link from "next/link";
import type { ReactNode } from "react";

/*
 * Entry referansı: başında # olan sayı.
 *
 * Başta ya da bir boşluktan sonra gelmesi şart; böylece "5", "(5)" ve
 * "abc#5" düz metin kalır, yalnızca "#5" bağlantıya döner. Sonuna rakam
 * gelmemesi de kontrol edilir ki uzun sayılar yarıda bölünmesin.
 *
 * Aynı kural entry metninde ve mesaj metninde geçerli.
 */
const ENTRY_REF_PATTERN = /(^|\s)#(\d{1,9})(?!\d)/g;

/** Metin parçasındaki #sayı referanslarını bağlantıya çevirir. */
export function referanslariBagla(text: string, anahtar: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(ENTRY_REF_PATTERN)) {
    const start = match.index ?? 0;
    const onEk = match[1];
    const numara = match[2];

    if (start > cursor) parts.push(text.slice(cursor, start));
    if (onEk) parts.push(onEk);

    parts.push(
      <Link
        key={`${anahtar}-${start}`}
        href={`/entry/${numara}`}
        className="font-semibold text-gold-ink hover:underline"
      >
        #{numara}
      </Link>,
    );
    cursor = start + match[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));

  return parts;
}
