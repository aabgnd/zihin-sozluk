import { RowsSkeleton, TitleSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <section>
      <TitleSkeleton />
      <RowsSkeleton />
    </section>
  );
}
