"use client";

import { useEffect, useState } from "react";
import { ArrowUpIcon } from "./icons";

export default function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="yukarı çık"
      className="fixed bottom-5 left-1/2 z-30 flex h-11 -translate-x-1/2 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-sm text-ink shadow-sm hover:bg-surface-2"
    >
      <ArrowUpIcon className="size-4" />
      yukarı çık
    </button>
  );
}
