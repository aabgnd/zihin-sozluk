import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createEntry, updateEntry } from "@/app/baslik/actions";
import { modDeleteTopic } from "@/app/yonetim/actions";
import CaylakBox from "@/components/CaylakBox";
import ConfirmButton from "@/components/ConfirmButton";
import EntryCard from "@/components/EntryCard";
import EntryEditor from "@/components/EntryEditor";
import LiveRefresh from "@/components/LiveRefresh";
import PagePicker from "@/components/PagePicker";
import SortSelect from "@/components/SortSelect";
import { ENTRY_SELECT, getViewerEntryState } from "@/lib/entries";
import { isPermanentMute } from "@/lib/moderation";
import { normalizeSort } from "@/lib/siralama";
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
  const sort = normalizeSort(firstParam(query.sirala));
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

  const listQuery = supabase
    .from("entries")
    .select(ENTRY_SELECT)
    .eq("topic_id", topic.id)
    .is("deleted_at", null)
    .range(from, from + PAGE_SIZE - 1);

  const { data } =
    sort === "begeni"
      ? await listQuery
          .order("upvotes", { ascending: false })
          .order("created_at")
      : await listQuery.order("created_at", { ascending: sort !== "yeni" });

  const entries = (data ?? []) as unknown as EntryRow[];
  const authorIds = [
    ...new Set(
      entries.flatMap((entry) => (entry.author ? [entry.author.id] : [])),
    ),
  ];

  const [{ votes, favorites }, countResult] = await Promise.all([
    getViewerEntryState(
      viewer?.id ?? null,
      entries.map((entry) => entry.id),
    ),
    authorIds.length > 0
      ? supabase.rpc("user_entry_counts", { ids: authorIds })
      : Promise.resolve({ data: [] }),
  ]);

  const authorCounts = new Map(
    (
      (countResult.data ?? []) as { user_id: string; entry_count: number }[]
    ).map((row) => [row.user_id, row.entry_count]),
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

      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Açık başlık, listelerdeki aktif başlıkla aynı sarıda. */}
        <h1 className="break-words text-2xl font-bold leading-snug text-logo">
          {topic.title}
        </h1>
        {viewer?.isStaff && (
          <ConfirmButton
            action={modDeleteTopic.bind(null, topic.id)}
            label="başlığı sil"
            title="bu başlık silinsin mi?"
            description="başlık çöp kutusuna taşınır, gündemden ve aramadan kalkar."
            className="h-9 rounded-md border border-line px-3 text-xs text-danger hover:bg-surface-2"
          />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-3 text-sm text-muted">
          <SortSelect basePath={basePath} value={sort} />
          <span>{total} entry</span>
        </div>
        <PagePicker
          basePath={basePath}
          page={page}
          pageCount={pageCount}
          query={sort === "eski" ? "" : `&sirala=${sort}`}
        />
      </div>

      {entries.map((entry) =>
        viewer && editingId === entry.id && entry.author?.id === viewer.id ? (
          <div key={entry.id} className="border-b border-line py-6">
            <EntryEditor
              action={updateEntry.bind(null, entry.id, topic.slug)}
              draftKey={`taslak-duzenle:${viewer.id}:${entry.id}`}
              initialContent={entry.content}
              label="entry'yi düzenle"
              submitLabel="kaydet"
              cancelHref={basePath}
            />
          </div>
        ) : (
          <EntryCard
            key={entry.id}
            entry={entry}
            viewerId={viewer?.id ?? null}
            isStaff={viewer?.isStaff ?? false}
            myVote={votes.get(entry.id)}
            favorited={favorites.has(entry.id)}
            authorEntryCount={
              entry.author ? (authorCounts.get(entry.author.id) ?? null) : null
            }
          />
        ),
      )}

      {pageCount > 1 && (
        <div className="flex justify-end py-4">
          <PagePicker
            basePath={basePath}
            page={page}
            pageCount={pageCount}
            query={sort === "eski" ? "" : `&sirala=${sort}`}
          />
        </div>
      )}

      {!editingId && (
        <div className="py-6">
          <EntryComposer viewer={viewer} topicId={topic.id} slug={topic.slug} />
        </div>
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
  if (!viewer) {
    return (
      <p className="text-muted">
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
