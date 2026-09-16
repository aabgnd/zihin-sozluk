import Link from "next/link";
import { getAgendaTopics, getYesterdayTop } from "@/lib/topics";
import type { TopEntry, TopicListItem } from "@/lib/types";
import SidebarTabs from "./SidebarTabs";

export default async function TopicSidebar() {
  const [topics, topRated] = await Promise.all([getAgendaTopics(), getYesterdayTop()]);

  return (
    <SidebarTabs
      agenda={<AgendaList topics={topics} />}
      topRated={<TopRatedList entries={topRated} />}
    />
  );
}

function AgendaList({ topics }: { topics: TopicListItem[] }) {
  if (topics.length === 0) {
    return <p className="py-2 text-sm text-muted">henüz başlık yok.</p>;
  }

  return (
    <ul>
      {topics.map((topic) => (
        <li key={topic.slug}>
          <Link
            href={`/baslik/${topic.slug}`}
            className="flex items-start justify-between gap-3 rounded-md px-2 py-2.5 text-sm leading-snug text-ink hover:bg-surface-2"
          >
            <span className="break-words">{topic.title}</span>
            <span className="shrink-0 pt-0.5 text-xs text-muted">{topic.entry_count}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function TopRatedList({ entries }: { entries: TopEntry[] }) {
  if (entries.length === 0) {
    return <p className="py-2 text-sm text-muted">dün beğenilen entry yok.</p>;
  }

  return (
    <ul>
      {entries.map((entry) => (
        <li key={entry.entry_id}>
          <Link
            href={`/baslik/${entry.topic_slug}#entry-${entry.entry_id}`}
            className="block rounded-md px-2 py-2.5 hover:bg-surface-2"
          >
            <span className="flex items-baseline justify-between gap-3">
              <span className="break-words text-sm">{entry.topic_title}</span>
              <span className="shrink-0 text-xs text-gold-ink">+{entry.upvotes}</span>
            </span>
            <span className="mt-0.5 line-clamp-2 block break-words text-xs text-muted">
              {entry.snippet}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
