import Link from "next/link";
import { getAgendaTopics, getYesterdayTop } from "@/lib/topics";
import type { TopEntry, TopicListItem } from "@/lib/types";
import SidebarTabs from "./SidebarTabs";

export default async function TopicSidebar() {
  const [topics, topRated] = await Promise.all([
    getAgendaTopics(),
    getYesterdayTop(),
  ]);

  return (
    <SidebarTabs
      agenda={<AgendaList topics={topics} />}
      topRated={<TopRatedList entries={topRated} />}
    />
  );
}

function AgendaList({ topics }: { topics: TopicListItem[] }) {
  if (topics.length === 0) {
    return <p className="px-1 py-2 text-sm text-muted">henüz başlık yok.</p>;
  }

  return (
    <ul className="space-y-0.5">
      {topics.map((topic) => (
        <li key={topic.slug}>
          <Link
            href={`/baslik/${topic.slug}`}
            className="flex items-start justify-between gap-2 rounded-lg px-2 py-2 text-sm leading-snug hover:bg-page"
          >
            <span className="break-words">{topic.title}</span>
            {(topic.today_count ?? 0) > 0 && (
              <span className="shrink-0 text-xs text-muted">
                {topic.today_count}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function TopRatedList({ entries }: { entries: TopEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="px-1 py-2 text-sm text-muted">dün beğenilen entry yok.</p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {entries.map((entry) => (
        <li key={entry.entry_id}>
          <Link
            href={`/baslik/${entry.topic_slug}#entry-${entry.entry_id}`}
            className="block rounded-lg px-2 py-2 hover:bg-page"
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="break-words text-sm font-semibold">
                {entry.topic_title}
              </span>
              <span className="shrink-0 text-xs font-semibold text-gold-ink">
                +{entry.upvotes}
              </span>
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
