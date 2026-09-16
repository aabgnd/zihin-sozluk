export default function TitleBadge({
  generation,
  title,
}: {
  generation: string | null;
  title: string | null;
}) {
  if (!generation || !title) return null;

  return (
    <span className="rounded-md border border-gold bg-gold/15 px-1.5 py-px text-[11px] font-semibold text-gold-ink">
      {`${generation} – ${title}`.toLocaleLowerCase("tr")}
    </span>
  );
}
