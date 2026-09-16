// Kurucu rozeti: rütbeden bağımsız, rütbe rozetinin yanında durur.
export default function TitleBadge({
  generation,
  title,
}: {
  generation: string | null;
  title: string | null;
}) {
  if (!generation || !title) return null;

  return (
    <span className="inline-block rounded-md border border-gold bg-gold/20 px-2 py-px text-[13px] font-bold lowercase text-gold-ink">
      {`${generation} – ${title}`.toLocaleLowerCase("tr")}
    </span>
  );
}
