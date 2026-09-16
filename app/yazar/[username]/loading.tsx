import { EntriesSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <section>
      <div className="flex items-start gap-4 pb-4">
        <div className="size-14 shrink-0 animate-pulse rounded-full bg-surface-2" />
        <div className="space-y-2">
          <div className="h-7 w-44 animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-64 animate-pulse rounded bg-surface-2" />
        </div>
      </div>
      <div className="h-11 border-b border-line" />
      <EntriesSkeleton count={3} />
    </section>
  );
}
