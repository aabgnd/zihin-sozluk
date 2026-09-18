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
            className="group flex min-h-12 items-center gap-3 rounded-md px-2 py-3 hover:bg-surface-2 hover:text-logo"
            activeClassName="bg-gold font-semibold text-on-gold hover:bg-gold hover:text-on-gold"
          >
            <span className="break-words leading-snug">{topic.title}</span>
            <span className="ml-auto flex shrink-0 items-baseline gap-2 text-xs">
              {/* Bugünkü sayı yalnızca toplamdan farkliysa yazılır, aynı sayı iki kez görünmesin. */}
              {(topic.today_count ?? 0) > 0 &&
                topic.today_count !== topic.entry_count && (
                  // Küçük sarı yazı okunmuyordu; sarı çip + koyu yazı. Satır
                  // aktifken (sarı şerit) çip ters döner, yoksa kaybolurdu.
                  <span className="rounded bg-gold px-1 font-semibold text-on-gold group-aria-[current=page]:bg-on-gold group-aria-[current=page]:text-gold">
                    +{topic.today_count}
                  </span>
                )}
              <span className="text-muted group-aria-[current=page]:text-on-gold">
                {topic.entry_count}
              </span>
            </span>
          </TopicLink>
        </li>
      ))}
    </ul>
  );
}
