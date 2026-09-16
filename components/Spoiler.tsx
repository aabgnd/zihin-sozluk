"use client";

import { useState } from "react";

export default function Spoiler({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-ink">
        {text}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted hover:text-ink"
    >
      spoiler — görmek için tıkla
    </button>
  );
}
