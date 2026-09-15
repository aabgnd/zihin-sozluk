import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createEntry } from "@/app/baslik/actions";
import EntryCard from "@/components/EntryCard";
import EntryForm from "@/components/EntryForm";
import LiveRefresh from "@/components/LiveRefresh";
import Pagination from "@/components/Pagination";
import { ENTRY_SELECT, getViewerEntryState } from "@/lib/entries";
import { createClient } from "@/lib/supabase/server";
import { firstParam } from "@/lib/text";
import type { EntryRow, PublicProfile } from "@/lib/types";
import { getViewer } from "@/lib/viewer";

const PAGE_SIZE = 10;

export default async function TopicPage({
  params,
  searchParams,
}: PageProps<"/baslik/[slug]">) {
  const { slug } = await params;
  const pageParam = firstParam((await searchParams).sayfa);
  const supabase = await createClient();

  const [{ data: topic }, viewer] = await Promise.all([
    supabase
      .from("topics")
      .select("id, title, slug")
      .eq("slug", slug)
      .maybeSingle(),
    getViewer(),
  ]);
  if (!topic) notFound();

  const { count } = await supabase
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("topic_id", topic.id);
  const total = count ?? 0;
  if (total === 0) redirect(`/ara?q=${encodeURIComponent(topic.title)}`);

  const pageCount = Math.ceil(total / PAGE_SIZE);
  const page =
    pageParam === "son"
      ? pageCount
      : Math.min(Math.max(1, Math.trunc(Number(pageParam)) || 1), pageCount);
  const from = (page - 1) * PAGE_SIZE;

  const { data } = await supabase
    .from("entries")
    .select(ENTRY_SELECT)
    .eq("topic_id", topic.id)
    .order("created_at", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);
  const entries = (data ?? []) as unknown as EntryRow[];
  const { votes, favorites } = await getViewerEntryState(
    viewer?.id ?? null,
    entries.map((entry) => entry.id),
  );
  const basePath = `/baslik/${topic.slug}`;

  return (
    <section>
      <LiveRefresh
        channel={`baslik:${topic.id}`}
        subscriptions={[
          { table: "entries", filter: `topic_id=eq.${topic.id}` },
        ]}
      />
      <header className="px-3 pt-4">
        <h1 className="break-words text-xl font-bold leading-snug">
          {topic.title}
        </h1>
        <div className="flex items-center justify-between gap-3 py-3 text-sm text-muted">
          <span>{total} entry</span>
          <Pagination basePath={basePath} page={page} pageCount={pageCount} />
        </div>
      </header>

      <div className="border-t border-line">
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            viewerId={viewer?.id ?? null}
            myVote={votes.get(entry.id)}
            favorited={favorites.has(entry.id)}
          />
        ))}
      </div>

      {pageCount > 1 && (
        <div className="flex justify-end px-3 py-3">
          <Pagination basePath={basePath} page={page} pageCount={pageCount} />
        </div>
      )}

      <EntryComposer viewer={viewer} topicId={topic.id} slug={topic.slug} />
    </section>
  );
}

function EntryComposer({
  viewer,
  topicId,
  slug,
}: {
  viewer: PublicProfile | null;
  topicId: number;
  slug: string;
}) {
  if (!viewer) {
    return (
      <p className="px-3 py-4 text-muted">
        entry yazmak için{" "}
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
  return <EntryForm action={createEntry.bind(null, topicId, slug)} />;
}
