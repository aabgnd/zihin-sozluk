"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { MenuIcon, XIcon } from "./icons";

export default function MobileAgendaDrawer({
  buttonClassName,
  footer,
  children,
}: {
  buttonClassName: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="menü"
        aria-expanded={open}
        className={buttonClassName}
      >
        <MenuIcon className="size-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="menüyü kapat"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col border-r border-line bg-surface">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold">gündem</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="kapat"
                className="grid size-11 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
              >
                <XIcon className="size-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              {children}
            </div>

            {footer && (
              <div className="flex items-center gap-1 border-t border-line px-4 py-2">
                {footer}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
