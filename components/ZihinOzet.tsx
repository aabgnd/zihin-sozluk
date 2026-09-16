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
  // Hiç artı oy almamış entry'ler bu bölümde gösterilmez.
  const showTopEntry = Boolean(topEntryHref && (summary?.top_entry_upvotes ?? 0) > 0);
  // Tek entry'lik başlık "en çok yazdığı başlık" sayılmaz.
  const showTopTopic = Boolean(
    summary?.top_topic_title && summary.top_topic_slug && (summary.top_topic_count ?? 0) >= 2,
  );
  const snippet = kelimeSinirindaKes(summary?.top_entry_snippet ?? "");

  return (
    <section className="rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold">zihin özeti</h2>
        <nav aria-label="özet dönemi" className="flex gap-1">
          {SUMMARY_PERIODS.map((option) => (
            <Link
              key={option.value}
              href={`${basePath}?ozet=${option.value}`}
              aria-current={period === option.value ? "page" : undefined}
              className={`flex h-8 items-center rounded-lg px-2.5 text-xs font-semibold ${
                period === option.value ? "bg-gold text-on-gold" : "text-muted hover:text-ink"
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
        <div className="mt-3 space-y-3 text-sm">
          <p>
            <span className="font-bold">{entryCount}</span>{" "}
            <span className="text-muted">entry yazdı.</span>
          </p>

          {showTopEntry && topEntryHref && (
            <div>
              <p className="text-xs font-semibold text-muted">
                en çok beğenilen entry&apos;si
              </p>
              <div className="mt-1 rounded-lg border border-line bg-page p-3">
                <p className="break-words leading-6">{snippet.metin}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-gold-ink">
                    +{summary?.top_entry_upvotes}
                  </span>
                  {snippet.kesildi && (
                    <Link
                      href={topEntryHref}
                      className="text-xs font-semibold text-gold-ink hover:underline"
                    >
                      devamı
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {showTopTopic && summary?.top_topic_slug && (
            <p>
              <span className="text-xs font-semibold text-muted">en çok yazdığı başlık: </span>
              <Link
                href={`/baslik/${summary.top_topic_slug}`}
                className="font-semibold text-gold-ink hover:underline"
              >
                {summary.top_topic_title}
              </Link>
              <span className="text-muted"> ({summary.top_topic_count} entry)</span>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
