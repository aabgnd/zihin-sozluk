import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createTopicWithEntry } from "@/app/baslik/actions";
import EntryEditor from "@/components/EntryEditor";
import TopicList from "@/components/TopicList";
import { isPermanentMute } from "@/lib/moderation";
import { createClient } from "@/lib/supabase/server";
import {
  firstParam,
  formatDateTime,
  normalizeTitle,
  slugify,
} from "@/lib/text";
import type { TopicListItem, Viewer } from "@/lib/types";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "arama" };

export default async function SearchPage({ searchParams }: PageProps<"/ara">) {
  const query = normalizeTitle(firstParam((await searchParams).q) ?? "")
    .slice(0, 100)
    .trim();
  if (!query) redirect("/");

  const slug = slugify(query);
  const supabase = await createClient();

  // "@nick" doğrudan yazarın profiline gider. @ olmadan yazılan aynı metin
  // başlık araması sayılır.
  if (query.startsWith("@")) {
    const kullanici = query.slice(1).trim();
    if (kullanici) {
      const { data: yazar } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", kullanici)
        .maybeSingle();
      if (yazar) redirect(`/yazar/${encodeURIComponent(yazar.username)}`);
    }
    return <YazarYok kullanici={kullanici} />;
  }

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
      .select("title, slug, entry_count, today_count")
      .ilike("title", pattern)
      .gt("entry_count", 0)
      .order("entry_count", { ascending: false })
      .limit(30),
    getViewer(),
  ]);
  const similar = (data ?? []) as TopicListItem[];

  return (
    <section>
      <header className="border-b border-line pb-3">
        <h1 className="break-words text-2xl font-bold leading-snug">{query}</h1>
        <p className="mt-1 text-sm text-muted">
          {"bu başlık henüz açılmamış, ilk entry'yi sen yaz."}
        </p>
      </header>

      <div className="py-5">
        <FirstEntry viewer={viewer} query={query} slug={slug} />
      </div>

      {similar.length > 0 && (
        <section className="border-t border-line pt-5">
          <h2 className="pb-2 text-sm font-semibold text-muted">
            benzer başlıklar
          </h2>
          <TopicList topics={similar} empty="" />
        </section>
      )}
    </section>
  );
}

function YazarYok({ kullanici }: { kullanici: string }) {
  return (
    <section>
      <header className="border-b border-line pb-3">
        <h1 className="break-words text-2xl font-bold leading-snug">
          @{kullanici}
        </h1>
        <p className="mt-1 text-sm text-muted">böyle bir yazar yok.</p>
      </header>
      <p className="py-5 text-sm leading-relaxed text-muted">
        yazar aramak için başına @ koy. başlık aramak istiyorsan{" "}
        <Link
          href={`/ara?q=${encodeURIComponent(kullanici)}`}
          className="font-semibold text-gold-ink hover:underline"
        >
          {kullanici}
        </Link>{" "}
        diye ara.
      </p>
    </section>
  );
}

function FirstEntry({
  viewer,
  query,
  slug,
}: {
  viewer: Viewer | null;
  query: string;
  slug: string;
}) {
  if (!viewer) {
    return (
      <p className="text-muted">
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
  if (!viewer.isWriter) {
    return (
      <p className="text-muted">
        yazar olduğunda yeni başlık açabilir ve mesaj gönderebilirsin.
      </p>
    );
  }
  if (viewer.isMuted && viewer.mutedUntil) {
    return (
      <p className="text-muted">
        {isPermanentMute(viewer.mutedUntil)
          ? "moderasyon tarafından süresiz susturuldun."
          : `moderasyon tarafından ${formatDateTime(viewer.mutedUntil)} tarihine kadar susturuldun.`}
      </p>
    );
  }
  if (viewer.is_frozen) {
    return (
      <p className="text-muted">
        hesabın dondurulduğu için şu an entry yazamazsın.
      </p>
    );
  }
  if (!slug) {
    return (
      <p className="text-muted">başlıkta en az bir harf ya da rakam olmalı.</p>
    );
  }
  return (
    <EntryEditor
      action={createTopicWithEntry.bind(null, query)}
      draftKey={`taslak-yeni:${viewer.id}:${slug}`}
    />
  );
}
