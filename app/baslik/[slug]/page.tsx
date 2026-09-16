import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createEntry, updateEntry } from "@/app/baslik/actions";
import { modDeleteTopic } from "@/app/yonetim/actions";
import CaylakBox from "@/components/CaylakBox";
import ConfirmButton from "@/components/ConfirmButton";
import EntryCard from "@/components/EntryCard";
import EntryEditor from "@/components/EntryEditor";
import LiveRefresh from "@/components/LiveRefresh";
import Pagination from "@/components/Pagination";
import { ENTRY_SELECT, getViewerEntryState } from "@/lib/entries";
import { isPermanentMute } from "@/lib/moderation";
import { createClient } from "@/lib/supabase/server";
import { firstParam, formatDateTime } from "@/lib/text";
import type { EntryRow, Viewer } from "@/lib/types";
import { getViewer } from "@/lib/viewer";

const PAGE_SIZE = 10;

export default async function TopicPage({
  params,
  searchParams,
}: PageProps<"/baslik/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const pageParam = firstParam(query.sayfa);
  const editingId = Math.trunc(Number(firstParam(query.duzenle))) || null;
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
    .eq("topic_id", topic.id)
    .is("deleted_at", null);
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
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .range(from, from + PAGE_SIZE - 1);
  const entries = (data ?? []) as unknown as EntryRow[];
  const { votes, favorites } = await getViewerEntryState(
    viewer?.id ?? null,
    entries.map((entry) => entry.id),
  );
  const basePath = `/baslik/${topic.slug}`;

  return (
    <section className="space-y-3">
      <LiveRefresh
        channel={`baslik:${topic.id}`}
        subscriptions={[
          { table: "entries", filter: `topic_id=eq.${topic.id}` },
        ]}
      />

      <header className="rounded-xl border border-line bg-surface p-4 shadow-sm">
        <h1 className="break-words text-xl font-bold leading-snug">
          {topic.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <span>{total} entry</span>
          <div className="flex items-center gap-2">
            {viewer?.isStaff && (
              <ConfirmButton
                action={modDeleteTopic.bind(null, topic.id)}
                label="başlığı sil"
                title="bu başlık silinsin mi?"
                description="başlık çöp kutusuna taşınır, gündemden ve aramadan kalkar."
                className="h-9 rounded-lg border border-danger px-3 text-xs font-semibold text-danger hover:bg-page"
              />
            )}
            <Pagination basePath={basePath} page={page} pageCount={pageCount} />
          </div>
        </div>
      </header>

      {entries.map((entry) =>
        viewer && editingId === entry.id && entry.author?.id === viewer.id ? (
          <EntryEditor
            key={entry.id}
            action={updateEntry.bind(null, entry.id, topic.slug)}
            draftKey={`taslak-duzenle:${viewer.id}:${entry.id}`}
            initialContent={entry.content}
            label="entry'yi düzenle"
            submitLabel="kaydet"
            cancelHref={basePath}
          />
        ) : (
          <EntryCard
            key={entry.id}
            entry={entry}
            viewerId={viewer?.id ?? null}
            isStaff={viewer?.isStaff ?? false}
            myVote={votes.get(entry.id)}
            favorited={favorites.has(entry.id)}
          />
        ),
      )}

      {pageCount > 1 && (
        <div className="flex justify-end">
          <Pagination basePath={basePath} page={page} pageCount={pageCount} />
        </div>
      )}

      {!editingId && (
        <EntryComposer viewer={viewer} topicId={topic.id} slug={topic.slug} />
      )}
    </section>
  );
}

function EntryComposer({
  viewer,
  topicId,
  slug,
}: {
  viewer: Viewer | null;
  topicId: number;
  slug: string;
}) {
  const card =
    "rounded-xl border border-line bg-surface p-4 text-muted shadow-sm";

  if (!viewer) {
    return (
      <p className={card}>
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
  if (viewer.isMuted && viewer.mutedUntil) {
    return (
      <p className={card}>
        {isPermanentMute(viewer.mutedUntil)
          ? "moderasyon tarafından süresiz susturuldun."
          : `moderasyon tarafından ${formatDateTime(viewer.mutedUntil)} tarihine kadar susturuldun.`}
      </p>
    );
  }
  if (viewer.is_frozen) {
    return (
      <p className={card}>hesabın dondurulduğu için şu an entry yazamazsın.</p>
    );
  }

  return (
    <div className="space-y-3">
      {!viewer.isWriter && (
        <CaylakBox
          entryCount={viewer.reviewEntryCount}
          threshold={viewer.writerThreshold}
        />
      )}
      <EntryEditor
        action={createEntry.bind(null, topicId, slug)}
        draftKey={`taslak:${viewer.id}:${topicId}`}
      />
    </div>
  );
}
