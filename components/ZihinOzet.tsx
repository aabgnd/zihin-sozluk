import Link from "next/link";
import { SUMMARY_PERIODS } from "@/lib/badges";

export type SummaryRow = {
  entry_count: number;
  top_entry_id: number | null;
  top_entry_snippet: string | null;
  top_entry_upvotes: number | null;
  top_entry_slug: string | null;
  top_topic_title: string | null;
  top_topic_slug: string | null;
  top_topic_count: number | null;
};

// Özet metni veritabanından 150 karakter kırpılmış gelir; kelime ortasında
// kesilmesin diye son boşluktan kesilir.
const SNIPPET_LIMIT = 150;

function kelimeSinirindaKes(snippet: string) {
  if (snippet.length < SNIPPET_LIMIT) return { metin: snippet, kesildi: false };

  const sonBosluk = snippet.lastIndexOf(" ");
  const kesilmis = sonBosluk > 40 ? snippet.slice(0, sonBosluk) : snippet;
  return { metin: `${kesilmis.trimEnd()}…`, kesildi: true };
}

export default function ZihinOzet({
  summary,
  period,
  basePath,
}: {
  summary: SummaryRow | null;
  period: string;
  basePath: string;
}) {
  const entryCount = summary?.entry_count ?? 0;
  const topEntryHref =
    summary?.top_entry_id && summary.top_entry_slug
      ? `/baslik/${summary.top_entry_slug}#entry-${summary.top_entry_id}`
      : null;
  const showTopEntry = Boolean(
    topEntryHref && (summary?.top_entry_upvotes ?? 0) > 0,
  );
  const showTopTopic = Boolean(
    summary?.top_topic_title &&
    summary.top_topic_slug &&
    (summary.top_topic_count ?? 0) >= 2,
  );
  const snippet = kelimeSinirindaKes(summary?.top_entry_snippet ?? "");

  return (
    <section className="border-b border-line py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">zihin özeti</h2>
        <nav aria-label="özet dönemi" className="flex gap-3">
          {SUMMARY_PERIODS.map((option) => (
            <Link
              key={option.value}
              href={`${basePath}?ozet=${option.value}`}
              aria-current={period === option.value ? "page" : undefined}
              className={`border-b-2 pb-0.5 text-xs ${
                period === option.value
                  ? "border-gold font-semibold text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </nav>
      </div>

      {entryCount === 0 ? (
        <p className="mt-2 text-sm text-muted">bu dönemde entry yazılmamış.</p>
      ) : (
        <div className="mt-2 space-y-2 text-sm">
          <p>
            <span className="font-semibold">{entryCount}</span>{" "}
            <span className="text-muted">entry yazdı.</span>
          </p>

          {showTopEntry && topEntryHref && (
            <div>
              <p className="text-xs text-muted">
                en çok beğenilen entry&apos;si
              </p>
              <p className="mt-0.5 break-words leading-6">{snippet.metin}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-gold-ink">
                  +{summary?.top_entry_upvotes}
                </span>
                {snippet.kesildi && (
                  <Link
                    href={topEntryHref}
                    className="italic text-muted hover:text-ink"
                  >
                    devamı
                  </Link>
                )}
              </p>
            </div>
          )}

          {showTopTopic && summary?.top_topic_slug && (
            <p className="text-sm">
              <span className="text-xs text-muted">
                en çok yazdığı başlık:{" "}
              </span>
              <Link
                href={`/baslik/${summary.top_topic_slug}`}
                // Küçük satır içi bağlantı: koyu yazı, sarı alt çizgi.
                className="font-semibold text-ink underline decoration-gold decoration-2 underline-offset-4"
              >
                {summary.top_topic_title}
              </Link>
              <span className="text-muted">
                {" "}
                ({summary.top_topic_count} entry)
              </span>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
