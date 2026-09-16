import Link from "next/link";
import type { TopicListItem } from "@/lib/types";

export default function TopicList({
  topics,
  empty,
}: {
  topics: TopicListItem[];
  empty: string;
}) {
  if (topics.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-surface p-4 leading-relaxed text-muted shadow-sm">
        {empty}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      {topics.map((topic) => (
        <li key={topic.slug}>
          <Link
            href={`/baslik/${topic.slug}`}
            className="flex min-h-12 items-center gap-3 px-4 py-3 hover:bg-page"
          >
            <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-md bg-gold px-1.5 text-[13px] font-bold text-on-gold">
              {topic.entry_count}
            </span>
            <span className="break-words font-semibold leading-snug">
              {topic.title}
            </span>
            {(topic.today_count ?? 0) > 0 && (
              <span className="ml-auto shrink-0 text-xs text-muted">
                {topic.today_count}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
