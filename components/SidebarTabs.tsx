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
    `flex h-9 items-center rounded-lg px-2.5 text-xs font-bold ${
      active ? "bg-gold text-on-gold" : "text-muted hover:text-ink"
    }`;

  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
      <div
        role="tablist"
        aria-label="gündem sekmeleri"
        className="mb-2 flex flex-wrap gap-1"
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
    </div>
  );
}
