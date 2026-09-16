import EntryCard from "@/components/EntryCard";
import PageNumbers from "@/components/PageNumbers";
import TopicList from "@/components/TopicList";
import { ENTRY_SELECT, getViewerEntryState } from "@/lib/entries";
import { createClient } from "@/lib/supabase/server";
import { firstParam, istanbulDay } from "@/lib/text";
import { AGENDA_PAGE_SIZE, getAgendaPage } from "@/lib/topics";
import type { EntryRow, TopicListItem } from "@/lib/types";
import { getViewer } from "@/lib/viewer";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const list = firstParam(params.liste);
  const page = Math.max(1, Math.trunc(Number(firstParam(params.sayfa))) || 1);
  const supabase = await createClient();

  if (list === "bugun" || list === "dun") {
    const day = istanbulDay(list === "bugun" ? 0 : -1);
    const { data } = await supabase.rpc("topics_for_day", { day: day.iso });
    return (
      <TopicSection
        heading={`${day.label} başlıkları`}
        topics={(data ?? []) as TopicListItem[]}
        empty={list === "bugun" ? "bugün henüz entry girilmedi." : "dün entry girilmemiş."}
      />
    );
  }

  const { topics, total } = await getAgendaPage(page);
  const pageCount = Math.max(1, Math.ceil(total / AGENDA_PAGE_SIZE));

  // 2. sayfadan itibaren gündem listesi masaüstünde de ana sütunda gösterilir.
  if (page > 1) {
    return (
      <TopicSection heading="gündem" topics={topics} empty="bu sayfada başlık yok.">
        <PageNumbers basePath="/" page={page} pageCount={pageCount} />
      </TopicSection>
    );
  }

  const [{ data }, viewer] = await Promise.all([
    supabase
      .from("entries")
      .select(ENTRY_SELECT)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(15),
    getViewer(),
  ]);
  const entries = (data ?? []) as unknown as EntryRow[];
  const authorIds = [
    ...new Set(entries.flatMap((entry) => (entry.author ? [entry.author.id] : []))),
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
    ((countResult.data ?? []) as { user_id: string; entry_count: number }[]).map((row) => [
      row.user_id,
      row.entry_count,
    ]),
  );

  return (
    <>
      <div className="lg:hidden">
        <TopicSection
          heading="gündem"
          topics={topics}
          empty="henüz başlık açılmamış. arama kutusuna bir başlık yazıp ilkini sen aç."
        >
          <PageNumbers basePath="/" page={page} pageCount={pageCount} />
        </TopicSection>
      </div>

      <section className="hidden lg:block">
        <h1 className="border-b border-line pb-3 text-2xl font-bold">{"son entry'ler"}</h1>
        {entries.length === 0 ? (
          <p className="py-4 leading-relaxed text-muted">
            {"henüz entry yok. arama kutusuna bir başlık yazıp ilk entry'yi sen gir."}
          </p>
        ) : (
          entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              viewerId={viewer?.id ?? null}
              isStaff={viewer?.isStaff ?? false}
              myVote={votes.get(entry.id)}
              favorited={favorites.has(entry.id)}
              authorEntryCount={entry.author ? (authorCounts.get(entry.author.id) ?? null) : null}
              showTopic
            />
          ))
        )}
      </section>
    </>
  );
}

function TopicSection({
  heading,
  topics,
  empty,
  children,
}: {
  heading: string;
  topics: TopicListItem[];
  empty: string;
  children?: React.ReactNode;
}) {
  return (
    <section>
      <h1 className="border-b border-line pb-3 text-2xl font-bold">{heading}</h1>
      <TopicList topics={topics} empty={empty} />
      {children && <div className="pt-4">{children}</div>}
    </section>
  );
}
