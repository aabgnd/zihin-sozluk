import Link from "next/link";

type Props = { basePath: string; page: number; pageCount: number };

const box =
  "grid h-9 min-w-9 place-items-center rounded-lg border border-line px-2";

export default function Pagination({ basePath, page, pageCount }: Props) {
  if (pageCount <= 1) return null;
  const href = (target: number) => `${basePath}?sayfa=${target}`;

  return (
    <nav aria-label="sayfalar" className="flex items-center gap-1.5 text-sm">
      {page > 1 && (
        <Link
          href={href(page - 1)}
          aria-label="önceki sayfa"
          className={`${box} text-gold-ink hover:bg-page`}
        >
          ‹
        </Link>
      )}
      <span aria-current="page" className={`${box} bg-page font-bold text-ink`}>
        {page}
      </span>
      <span className="text-muted">/</span>
      <Link
        href={href(pageCount)}
        aria-label="son sayfa"
        className={`${box} text-gold-ink hover:bg-page`}
      >
        {pageCount}
      </Link>
      {page < pageCount && (
        <Link
          href={href(page + 1)}
          aria-label="sonraki sayfa"
          className={`${box} text-gold-ink hover:bg-page`}
        >
          ›
        </Link>
      )}
    </nav>
  );
}
