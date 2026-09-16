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
    // Dolgu yok: iki temada da sarı kenarlık + sarı yazı.
    <span className="inline-block rounded-md border border-gold px-2 py-px text-[13px] font-bold lowercase text-gold-ink">
      {`${generation} – ${title}`.toLocaleLowerCase("tr")}
    </span>
  );
}
