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
  "flex h-12 items-center border-b-2 px-3 text-[15px] transition-colors sm:px-4";

export function TabLinks({ active }: { active: TabKey | null }) {
  return (
    <nav aria-label="listeler" className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-7xl gap-1 px-3 md:px-5">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active === tab.key ? "page" : undefined}
            className={`${tabClass} ${
              active === tab.key
                ? "border-gold font-bold text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        ))}
        <a
          href="/rastgele"
          className={`${tabClass} border-transparent text-muted hover:text-ink`}
        >
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
