import { EntriesSkeleton, TitleSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <section>
      <TitleSkeleton />
      <EntriesSkeleton />
    </section>
  );
}
