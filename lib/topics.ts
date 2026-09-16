import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { TopEntry, TopicListItem } from "@/lib/types";

export const AGENDA_PAGE_SIZE = 25;

export const getAgendaPage = cache(async (page: number) => {
  const supabase = await createClient();
  const from = (page - 1) * AGENDA_PAGE_SIZE;
  const { data, count } = await supabase
    .from("topic_stats")
    .select("title, slug, entry_count, today_count", { count: "exact" })
    .gt("entry_count", 0)
    .order("last_entry_at", { ascending: false, nullsFirst: false })
    .range(from, from + AGENDA_PAGE_SIZE - 1);

  return { topics: (data ?? []) as TopicListItem[], total: count ?? 0 };
});

export const getAgendaTopics = cache(
  async () => (await getAgendaPage(1)).topics,
);

export const getYesterdayTop = cache(async (): Promise<TopEntry[]> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("top_entries_yesterday");
  return (data ?? []) as TopEntry[];
});
