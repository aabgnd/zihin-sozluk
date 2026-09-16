import Link from "next/link";
import type { TopicListItem } from "@/lib/types";

export default function TopicList({ topics, empty }: { topics: TopicListItem[]; empty: string }) {
  if (topics.length === 0) {
    return <p className="py-4 leading-relaxed text-muted">{empty}</p>;
  }

  return (
    <ul>
      {topics.map((topic) => (
        <li key={topic.slug} className="border-b border-line last:border-b-0">
          <Link
            href={`/baslik/${topic.slug}`}
            className="flex min-h-12 items-center gap-3 rounded-md px-2 py-3 hover:bg-surface-2"
          >
            <span className="min-w-6 shrink-0 text-center text-xs font-semibold text-gold-ink">
              {topic.entry_count}
            </span>
            <span className="break-words leading-snug">{topic.title}</span>
            {(topic.today_count ?? 0) > 0 && (
              <span className="ml-auto shrink-0 text-xs text-muted">{topic.today_count}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
