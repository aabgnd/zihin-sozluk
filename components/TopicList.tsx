import Link from "next/link";
import type { TopicListItem } from "@/lib/types";

export default function TopicList({
  topics,
  empty,
}: {
  topics: TopicListItem[];
  empty: string;
}) {
  if (topics.length === 0)
    return <p className="px-3 py-6 text-muted">{empty}</p>;

  return (
    <ul className="border-t border-line">
      {topics.map((topic) => (
        <li key={topic.slug} className="border-b border-line bg-surface">
          <Link
            href={`/baslik/${topic.slug}`}
            className="flex min-h-11 items-center gap-2.5 px-3 py-2 hover:bg-page"
          >
            <span className="grid h-6 min-w-6 shrink-0 place-items-center rounded-sm bg-gold px-1.5 text-[13px] font-semibold text-on-gold">
              {topic.entry_count}
            </span>
            <span className="break-words text-base font-semibold leading-snug">
              {topic.title}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
