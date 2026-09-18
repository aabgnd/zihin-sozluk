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
    // Rütbe rozetlerinden ayrışsın diye yuvarlak ve başında sarı nokta var.
    // Yazı koyu; sarı yazı beyaz zeminde okunmuyordu.
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/70 px-2.5 py-px text-[13px] font-semibold lowercase text-ink">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />
      {`${generation} – ${title}`.toLocaleLowerCase("tr")}
    </span>
  );
}
