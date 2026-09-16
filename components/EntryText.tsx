import type { ReactNode } from "react";
import Spoiler from "./Spoiler";

const SPOILER_PATTERN = /\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi;

// Metin HTML olarak basılmaz; spoiler etiketi ayrıştırılıp bileşen olarak çizilir.
export default function EntryText({ content }: { content: string }) {
  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const match of content.matchAll(SPOILER_PATTERN)) {
    const start = match.index ?? 0;
    if (start > cursor) parts.push(content.slice(cursor, start));
    parts.push(<Spoiler key={start} text={match[1]} />);
    cursor = start + match[0].length;
  }
  if (cursor < content.length) parts.push(content.slice(cursor));

  return (
    <p className="whitespace-pre-line break-words text-[15px] leading-7">
      {parts}
    </p>
  );
}
