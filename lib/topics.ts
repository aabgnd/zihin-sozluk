import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { TopicListItem } from "@/lib/types";

export const getAgendaTopics = cache(async (): Promise<TopicListItem[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("topic_stats")
    .select("title, slug, entry_count")
    .gt("entry_count", 0)
    .order("last_entry_at", { ascending: false, nullsFirst: false })
    .limit(50);
  return (data ?? []) as TopicListItem[];
});
