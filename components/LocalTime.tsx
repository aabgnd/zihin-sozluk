"use client";

import { useEffect, useState } from "react";
import { formatStamp, type StampMode } from "@/lib/text";

/**
 * Saati kullanıcının kendi cihazının saat dilimine göre gösterir.
 *
 * Sunucuda ve ilk boyamada site saati (Europe/Istanbul) yazılır, böylece
 * hydration uyuşmazlığı olmaz; bileşen bağlandıktan sonra cihazın saat
 * dilimine geçilir.
 */
export default function LocalTime({
  iso,
  mode = "datetime",
  className,
}: {
  iso: string;
  mode?: StampMode;
  className?: string;
}) {
  const [text, setText] = useState(() => formatStamp(iso, mode));

  useEffect(() => {
    setText(formatStamp(iso, mode, "device"));
  }, [iso, mode]);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {text}
    </time>
  );
}
