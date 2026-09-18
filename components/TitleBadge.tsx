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
    // Dolu sarı ve yuvarlak: köşeli rütbe rozetinden şekliyle ayrışır.
    // Yazı koyu, çünkü sarı zemin üzerinde koyu yazı 10,8:1 ile okunuyor.
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-px text-[13px] font-semibold lowercase text-on-gold">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-on-gold/55" />
      {`${generation} – ${title}`.toLocaleLowerCase("tr")}
    </span>
  );
}
