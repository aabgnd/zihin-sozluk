import Link from "next/link";
import type { ReactNode } from "react";
import Spoiler from "./Spoiler";

const SPOILER_PATTERN = /\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi;

/*
 * Entry referansı: başında # olan sayı.
 *
 * Başta ya da bir boşluktan sonra gelmesi şart; böylece "5", "(5)" ve
 * "abc#5" düz metin kalır, yalnızca "#5" bağlantıya döner. Sonuna rakam
 * gelmemesi de kontrol edilir ki uzun sayılar yarıda bölünmesin.
 */
const ENTRY_REF_PATTERN = /(^|\s)#(\d{1,9})(?!\d)/g;

/** Metin parçasındaki #sayı referanslarını bağlantıya çevirir. */
function referanslariBagla(text: string, anahtar: string): ReactNode[] {
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

// Metin HTML olarak basılmaz; spoiler etiketi ayrıştırılıp bileşen olarak çizilir.
export default function EntryText({ content }: { content: string }) {
  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const match of content.matchAll(SPOILER_PATTERN)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      parts.push(
        ...referanslariBagla(content.slice(cursor, start), `m${start}`),
      );
    }
    parts.push(<Spoiler key={start} text={match[1]} />);
    cursor = start + match[0].length;
  }
  if (cursor < content.length) {
    parts.push(...referanslariBagla(content.slice(cursor), `s${cursor}`));
  }

  return (
    <p className="whitespace-pre-line break-words text-[15px] leading-7">
      {parts}
    </p>
  );
}
