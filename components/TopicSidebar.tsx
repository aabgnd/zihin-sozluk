import Link from "next/link";
import { getAgendaTopics } from "@/lib/topics";

export default async function TopicSidebar() {
  const topics = await getAgendaTopics();

  return (
    <nav aria-label="gündem başlıkları">
      <h2 className="mb-1 text-sm font-bold text-gold-ink">gündem</h2>
      {topics.length === 0 ? (
        <p className="py-2 text-sm text-muted">henüz başlık yok.</p>
      ) : (
        <ul>
          {topics.map((topic) => (
            <li key={topic.slug}>
              <Link
                href={`/baslik/${topic.slug}`}
                className="flex items-baseline justify-between gap-3 py-2 text-sm leading-snug hover:text-gold-ink"
              >
                <span className="break-words">{topic.title}</span>
                <span className="shrink-0 text-xs text-muted">
                  {topic.entry_count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
