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
  "flex h-12 flex-1 items-center justify-center border-b-2 text-[15px] transition-colors";

export function TabLinks({ active }: { active: TabKey | null }) {
  return (
    <nav aria-label="listeler" className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1200px] px-4">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active === tab.key ? "page" : undefined}
            className={`${tabClass} ${
              active === tab.key
                ? "border-gold font-semibold text-ink"
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
