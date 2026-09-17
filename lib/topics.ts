import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { TopEntry, TopicListItem } from "@/lib/types";

export const AGENDA_PAGE_SIZE = 25;

/** Gündem ve gün listeleri en çok iki sayfa. */
export const AGENDA_MAX_PAGES = 2;

/** Gündeme girmek için son entry'nin bu kadar yeni olması gerekir. */
const GUNDEM_SAAT = 48;

export const getAgendaPage = cache(async (page: number) => {
  const supabase = await createClient();
  const from = (page - 1) * AGENDA_PAGE_SIZE;
  const esik = new Date(Date.now() - GUNDEM_SAAT * 3600 * 1000).toISOString();

  const { data, count } = await supabase
    .from("topic_stats")
    .select("title, slug, entry_count, today_count", { count: "exact" })
    .gt("entry_count", 0)
    // Son 48 saatte entry almış başlıklar.
    .gte("last_entry_at", esik)
    // En çok entry alan üstte; eşitlikte en yeni hareket önde.
    .order("entry_count", { ascending: false })
    .order("last_entry_at", { ascending: false, nullsFirst: false })
    .range(from, from + AGENDA_PAGE_SIZE - 1);

  const tavan = AGENDA_PAGE_SIZE * AGENDA_MAX_PAGES;
  return {
    topics: (data ?? []) as TopicListItem[],
    total: Math.min(count ?? 0, tavan),
  };
});

export const getAgendaTopics = cache(
  async () => (await getAgendaPage(1)).topics,
);

export const getYesterdayTop = cache(async (): Promise<TopEntry[]> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("top_entries_yesterday");
  return (data ?? []) as TopEntry[];
});
