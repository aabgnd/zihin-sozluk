import type { TopicListItem } from "@/lib/types";
import TopicLink from "./TopicLink";

export default function TopicList({
  topics,
  empty,
}: {
  topics: TopicListItem[];
  empty: string;
}) {
  if (topics.length === 0) {
    return <p className="py-4 leading-relaxed text-muted">{empty}</p>;
  }

  return (
    <ul>
      {topics.map((topic) => (
        <li key={topic.slug} className="border-b border-line last:border-b-0">
          <TopicLink
            slug={topic.slug}
            className="flex min-h-12 items-center gap-3 rounded-md px-2 py-3 hover:bg-surface-2"
            activeClassName="font-semibold text-logo"
          >
            <span className="break-words leading-snug">{topic.title}</span>
            <span className="ml-auto flex shrink-0 items-baseline gap-2 text-xs">
              {/* Bugünkü sayı yalnızca toplamdan farkliysa yazılır, aynı sayı iki kez görünmesin. */}
              {(topic.today_count ?? 0) > 0 &&
                topic.today_count !== topic.entry_count && (
                  <span className="font-semibold text-gold-ink">
                    +{topic.today_count}
                  </span>
                )}
              <span className="text-muted">{topic.entry_count}</span>
            </span>
          </TopicLink>
        </li>
      ))}
    </ul>
  );
}
