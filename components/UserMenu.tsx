"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

export default function UserMenu({
  label,
  triggerClassName,
  trigger,
  children,
}: {
  label: string;
  triggerClassName: string;
  trigger: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface py-1 text-ink shadow-lg"
        >
          {children}
        </div>
      )}
    </div>
  );
}
