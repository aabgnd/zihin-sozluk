import Link from "next/link";

const box = "grid h-9 min-w-9 place-items-center rounded-md px-2 text-sm";

export default function PageNumbers({
  basePath,
  page,
  pageCount,
}: {
  basePath: string;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  const pages: number[] = [];
  for (let candidate = 1; candidate <= pageCount; candidate++) {
    const nearEdge = candidate === 1 || candidate === pageCount;
    const nearCurrent = Math.abs(candidate - page) <= 2;
    if (nearEdge || nearCurrent) pages.push(candidate);
  }

  return (
    <nav aria-label="sayfalar" className="flex flex-wrap items-center gap-1">
      {pages.map((candidate, index) => (
        <span key={candidate} className="flex items-center gap-1">
          {index > 0 && candidate - pages[index - 1] > 1 && (
            <span className="text-muted">…</span>
          )}
          {candidate === page ? (
            <span
              aria-current="page"
              className={`${box} bg-gold font-semibold text-on-gold`}
            >
              {candidate}
            </span>
          ) : (
            <Link
              href={`${basePath}?sayfa=${candidate}`}
              className={`${box} border border-line text-ink hover:bg-surface-2`}
            >
              {candidate}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
