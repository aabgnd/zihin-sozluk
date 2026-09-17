import Link from "next/link";
import type { MesajReferansi } from "@/lib/messages";

/**
 * Mesajın üstündeki entry kartı: başlık adı, entry numarası ve ilk satırdan
 * kısa bir alıntı. Hem gönderen hem alan aynı kartı görür.
 *
 * Entry silinmişse kart "entry silinmiş" yazar ve bağlantı vermez; mesajın
 * kendisi yine görünür.
 */
export default function MessageRefCard({
  referans,
}: {
  referans: MesajReferansi;
}) {
  const icerik = (
    <>
      <span className="flex items-baseline gap-1.5">
        <span className="shrink-0 text-xs font-semibold text-gold-ink">
          #{referans.id}
        </span>
        {referans.topicTitle && (
          <span className="truncate text-xs font-semibold">
            {referans.topicTitle}
          </span>
        )}
      </span>
      <span className="mt-0.5 line-clamp-2 block break-words text-xs text-muted">
        {referans.silinmis ? "entry silinmiş" : referans.alinti}
      </span>
    </>
  );

  if (referans.silinmis || !referans.topicSlug) {
    return (
      <div className="rounded-md border border-line bg-surface-2 px-2.5 py-2">
        {icerik}
      </div>
    );
  }

  return (
    <Link
      href={`/entry/${referans.id}`}
      className="block rounded-md border border-line bg-surface-2 px-2.5 py-2 hover:border-gold"
    >
      {icerik}
    </Link>
  );
}
