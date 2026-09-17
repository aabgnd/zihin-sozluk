import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ENTRY_PAGE_SIZE } from "@/lib/entries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "entry",
  robots: { index: false, follow: true },
};

type Satir = {
  id: number;
  created_at: string;
  deleted_at: string | null;
  topic_id: number;
  topic: { slug: string; title: string; deleted_at: string | null } | null;
};

/**
 * Entry'nin kalıcı adresi. Numara, entries tablosundaki id'dir: site
 * genelinde tekrarsız, yazılma sırasına göre artan ve asla değişmeyen bir
 * sayı. Silinen entry'nin numarası boşta kalır, sonrakiler kaymaz.
 *
 * Burada başlık bulunur, entry'nin hangi sayfaya düştüğü hesaplanır ve
 * çapasıyla birlikte o sayfaya yönlendirilir.
 */
export default async function EntryPage({ params }: PageProps<"/entry/[no]">) {
  const numara = Math.trunc(Number((await params).no));
  if (!Number.isSafeInteger(numara) || numara < 1) {
    return <Uyari baslik="geçersiz numara" mesaj="entry numarası bir sayı olmalı." />;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("entries")
    .select(
      "id, created_at, deleted_at, topic_id, topic:topics!entries_topic_id_fkey(slug, title, deleted_at)",
    )
    .eq("id", numara)
    .maybeSingle();
  const entry = data as unknown as Satir | null;

  if (!entry) {
    return (
      <Uyari
        baslik={`#${numara}`}
        mesaj="böyle bir entry yok. numara hiç kullanılmamış olabilir."
      />
    );
  }

  if (entry.deleted_at || !entry.topic || entry.topic.deleted_at) {
    return (
      <Uyari
        baslik={`#${numara}`}
        mesaj="bu entry silinmiş."
        slug={entry.topic?.deleted_at ? null : (entry.topic?.slug ?? null)}
        topicTitle={entry.topic?.title ?? null}
      />
    );
  }

  // Varsayılan sıralama "en eski", yani entry'nin sırası kendinden önce
  // yazılmış silinmemiş entry sayısıdır.
  const { count } = await supabase
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("topic_id", entry.topic_id)
    .is("deleted_at", null)
    .lte("created_at", entry.created_at);

  const sayfa = Math.max(1, Math.ceil((count ?? 1) / ENTRY_PAGE_SIZE));
  const sayfaKismi = sayfa > 1 ? `?sayfa=${sayfa}` : "";
  redirect(`/baslik/${entry.topic.slug}${sayfaKismi}#entry-${entry.id}`);
}

function Uyari({
  baslik,
  mesaj,
  slug = null,
  topicTitle = null,
}: {
  baslik: string;
  mesaj: string;
  slug?: string | null;
  topicTitle?: string | null;
}) {
  return (
    <section className="mx-auto max-w-sm py-4">
      <h1 className="mb-3 text-2xl font-bold">{baslik}</h1>
      <p className="mb-5 leading-relaxed text-muted">{mesaj}</p>
      {slug ? (
        <Link
          href={`/baslik/${slug}`}
          className="flex h-11 w-full items-center justify-center rounded-md bg-gold text-sm font-semibold text-on-gold hover:brightness-95"
        >
          {topicTitle ? `"${topicTitle}" başlığına git` : "başlığa git"}
        </Link>
      ) : (
        <Link
          href="/"
          className="flex h-11 w-full items-center justify-center rounded-md bg-gold text-sm font-semibold text-on-gold hover:brightness-95"
        >
          gündeme dön
        </Link>
      )}
    </section>
  );
}
