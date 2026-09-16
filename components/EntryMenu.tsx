"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { MoreIcon } from "./icons";

const copyItem =
  "flex h-11 w-full items-center px-4 text-left text-sm hover:bg-surface-2";

export default function EntryMenu({
  entryHref,
  children,
}: {
  entryHref: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${entryHref}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // pano kapalıysa sessiz geç.
    }
  };

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="entry menüsü"
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid size-9 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
      >
        <MoreIcon className="size-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-md border border-line bg-surface py-1 shadow-sm"
        >
          <button
            type="button"
            role="menuitem"
            onClick={copyLink}
            className={copyItem}
          >
            {copied ? "bağlantı kopyalandı" : "bağlantıyı kopyala"}
          </button>
          {children}
        </div>
      )}
    </div>
  );
}
