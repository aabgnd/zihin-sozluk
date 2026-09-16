"use client";

import { useRouter } from "next/navigation";

export default function PagePicker({
  basePath,
  page,
  pageCount,
  query = "",
}: {
  basePath: string;
  page: number;
  pageCount: number;
  query?: string;
}) {
  const router = useRouter();
  if (pageCount <= 1) return null;

  const hrefFor = (target: number) => `${basePath}?sayfa=${target}${query}`;

  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <label htmlFor="sayfa" className="sr-only">
        sayfa
      </label>
      <select
        id="sayfa"
        value={page}
        onChange={(event) => router.push(hrefFor(Number(event.target.value)))}
        className="h-9 rounded-md border border-line bg-surface px-2 text-sm text-ink focus:border-gold focus:outline-none"
      >
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
          <option key={number} value={number}>
            {number}
          </option>
        ))}
      </select>
      <span>/ {pageCount}</span>
      {page < pageCount && (
        <button
          type="button"
          onClick={() => router.push(hrefFor(page + 1))}
          aria-label="sonraki sayfa"
          className="grid size-9 place-items-center rounded-md border border-line text-ink hover:bg-surface-2"
        >
          »
        </button>
      )}
    </div>
  );
}
