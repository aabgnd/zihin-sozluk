"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type TabKey = "gundem" | "bugun" | "dun";

const TABS: { key: TabKey; label: string; href: string }[] = [
  { key: "gundem", label: "gündem", href: "/" },
  { key: "bugun", label: "bugün", href: "/?liste=bugun" },
  { key: "dun", label: "dün", href: "/?liste=dun" },
];

const tabClass =
  "flex h-11 items-center px-3 text-[15px] text-on-gold sm:px-4 lg:px-5";

export function TabLinks({ active }: { active: TabKey | null }) {
  return (
    <nav aria-label="listeler" className="bg-gold">
      <div className="mx-auto flex max-w-2xl px-1 lg:max-w-6xl lg:gap-2 lg:px-3">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active === tab.key ? "page" : undefined}
            className={`${tabClass} ${active === tab.key ? "font-bold underline decoration-2 underline-offset-8" : ""}`}
          >
            {tab.label}
          </Link>
        ))}
        <a href="/rastgele" className={tabClass}>
          rastgele
        </a>
      </div>
    </nav>
  );
}

export default function TabBar() {
  const pathname = usePathname();
  const list = useSearchParams().get("liste");
  const active: TabKey | null =
    pathname !== "/"
      ? null
      : list === "bugun" || list === "dun"
        ? list
        : "gundem";

  return <TabLinks active={active} />;
}
