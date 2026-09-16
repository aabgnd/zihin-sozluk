"use client";

import { useRouter } from "next/navigation";
import { SORT_OPTIONS } from "@/lib/siralama";

export default function SortSelect({
  basePath,
  value,
}: {
  basePath: string;
  value: string;
}) {
  const router = useRouter();

  return (
    <>
      <label htmlFor="sirala" className="sr-only">
        sıralama
      </label>
      <select
        id="sirala"
        value={value}
        onChange={(event) =>
          router.push(`${basePath}?sirala=${event.target.value}`)
        }
        className="h-9 rounded-md border border-line bg-surface px-2 text-sm text-ink focus:border-gold focus:outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  );
}
