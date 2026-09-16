"use client";

import { useState, type ReactNode } from "react";

export default function SidebarTabs({
  agenda,
  topRated,
}: {
  agenda: ReactNode;
  topRated: ReactNode;
}) {
  const [tab, setTab] = useState<"gundem" | "dun">("gundem");

  const tabClass = (active: boolean) =>
    `flex h-9 items-center border-b-2 pb-1 text-sm transition-colors ${
      active
        ? "border-gold font-semibold text-ink"
        : "border-transparent text-muted hover:text-ink"
    }`;

  return (
    <nav aria-label="gündem">
      <div
        role="tablist"
        aria-label="gündem sekmeleri"
        className="mb-2 flex gap-4"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "gundem"}
          onClick={() => setTab("gundem")}
          className={tabClass(tab === "gundem")}
        >
          gündem
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "dun"}
          onClick={() => setTab("dun")}
          className={tabClass(tab === "dun")}
        >
          dünün en beğenilenleri
        </button>
      </div>
      {tab === "gundem" ? agenda : topRated}
    </nav>
  );
}
