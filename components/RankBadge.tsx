import { rutbeBul, RUTBE_STILLERI } from "@/lib/rutbe";

export default function RankBadge({
  entryCount,
  size = "sm",
}: {
  entryCount: number;
  size?: "sm" | "md";
}) {
  const rutbe = rutbeBul(entryCount);
  const sizeClass = size === "md" ? "px-2.5 py-0.5 text-sm" : "px-2 py-px text-[13px]";

  return (
    <span
      className={`inline-block rounded-md border font-bold lowercase ${sizeClass} ${RUTBE_STILLERI[rutbe]}`}
    >
      {rutbe}
    </span>
  );
}
