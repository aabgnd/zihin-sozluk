import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createTopicWithEntry } from "@/app/baslik/actions";
import EntryForm from "@/components/EntryForm";
import TopicList from "@/components/TopicList";
import { createClient } from "@/lib/supabase/server";
import { firstParam, normalizeTitle, slugify } from "@/lib/text";
import type { PublicProfile, TopicListItem } from "@/lib/types";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "arama" };

export default async function SearchPage({ searchParams }: PageProps<"/ara">) {
  const query = normalizeTitle(firstParam((await searchParams).q) ?? "")
    .slice(0, 100)
    .trim();
  if (!query) redirect("/");

  const slug = slugify(query);
  const supabase = await createClient();

  if (slug) {
    const { data: existing } = await supabase
      .from("topic_stats")
      .select("slug")
      .eq("slug", slug)
      .gt("entry_count", 0)
      .maybeSingle();
    if (existing) redirect(`/baslik/${slug}`);
  }

  const pattern = `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
  const [{ data }, viewer] = await Promise.all([
    supabase
      .from("topic_stats")
      .select("title, slug, entry_count")
      .ilike("title", pattern)
      .gt("entry_count", 0)
      .order("entry_count", { ascending: false })
      .limit(30),
    getViewer(),
  ]);
  const similar = (data ?? []) as TopicListItem[];

  return (
    <section>
      <header className="px-3 pb-3 pt-4">
        <h1 className="break-words text-xl font-bold leading-snug">{query}</h1>
        <p className="mt-1 text-sm text-muted">
          {"bu başlık henüz açılmamış, ilk entry'yi sen yaz."}
        </p>
      </header>
      <div className="border-t border-line">
        <FirstEntry viewer={viewer} query={query} hasSlug={slug !== ""} />
      </div>
      {similar.length > 0 && (
        <>
          <h2 className="border-t border-line px-3 pb-2 pt-4 text-sm font-semibold text-muted">
            benzer başlıklar
          </h2>
          <TopicList topics={similar} empty="" />
        </>
      )}
    </section>
  );
}

function FirstEntry({
  viewer,
  query,
  hasSlug,
}: {
  viewer: PublicProfile | null;
  query: string;
  hasSlug: boolean;
}) {
  if (!viewer) {
    return (
      <p className="px-3 py-4 text-muted">
        {"ilk entry'yi yazmak için "}
        <Link
          href="/giris"
          className="font-semibold text-gold-ink hover:underline"
        >
          giriş yap
        </Link>
        .
      </p>
    );
  }
  if (viewer.is_frozen) {
    return (
      <p className="px-3 py-4 text-muted">
        hesabın dondurulduğu için şu an entry yazamazsın.
      </p>
    );
  }
  if (!hasSlug) {
    return (
      <p className="px-3 py-4 text-muted">
        başlıkta en az bir harf ya da rakam olmalı.
      </p>
    );
  }
  return <EntryForm action={createTopicWithEntry.bind(null, query)} />;
}
