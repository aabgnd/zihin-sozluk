"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { MenuIcon } from "./icons";

export default function MobileMenu({
  triggerClassName,
  children,
}: {
  triggerClassName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (menu.current?.open && !menu.current.contains(event.target as Node)) {
        menu.current.open = false;
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, []);

  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [pathname]);

  return (
    <details ref={menu} className="relative">
      <summary
        aria-label="menü"
        title="menü"
        className={`${triggerClassName} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
      >
        <MenuIcon className="size-5" />
      </summary>
      <div className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-sm border border-line bg-surface py-1 text-ink shadow-lg">
        {children}
      </div>
    </details>
  );
}
