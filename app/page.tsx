import EntryCard from "@/components/EntryCard";
import TopicList from "@/components/TopicList";
import { ENTRY_SELECT, getViewerEntryState } from "@/lib/entries";
import { createClient } from "@/lib/supabase/server";
import { firstParam, istanbulDay } from "@/lib/text";
import { getAgendaTopics } from "@/lib/topics";
import type { EntryRow, TopicListItem } from "@/lib/types";
import { getViewer } from "@/lib/viewer";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const list = firstParam((await searchParams).liste);
  const supabase = await createClient();

  if (list === "bugun" || list === "dun") {
    const day = istanbulDay(list === "bugun" ? 0 : -1);
    const { data } = await supabase.rpc("topics_for_day", { day: day.iso });
    return (
      <TopicSection
        heading={`${day.label} başlıkları`}
        topics={(data ?? []) as TopicListItem[]}
        empty={
          list === "bugun"
            ? "bugün henüz entry girilmedi."
            : "dün entry girilmemiş."
        }
      />
    );
  }

  const [topics, { data }, viewer] = await Promise.all([
    getAgendaTopics(),
    supabase
      .from("entries")
      .select(ENTRY_SELECT)
      .order("created_at", { ascending: false })
      .limit(15),
    getViewer(),
  ]);
  const entries = (data ?? []) as unknown as EntryRow[];
  const { votes, favorites } = await getViewerEntryState(
    viewer?.id ?? null,
    entries.map((entry) => entry.id),
  );

  return (
    <>
      <div className="lg:hidden">
        <TopicSection
          heading="gündem"
          topics={topics}
          empty="henüz başlık açılmamış. arama kutusuna bir başlık yazıp ilkini sen aç."
        />
      </div>

      <section className="hidden lg:block">
        <h1 className="px-3 pb-3 pt-4 text-xl font-bold">{"son entry'ler"}</h1>
        <div className="border-t border-line">
          {entries.length === 0 ? (
            <p className="px-3 py-6 text-muted">
              {
                "henüz entry yok. arama kutusuna bir başlık yazıp ilk entry'yi sen gir."
              }
            </p>
          ) : (
            entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                myVote={votes.get(entry.id)}
                favorited={favorites.has(entry.id)}
                viewerId={viewer?.id ?? null}
                showTopic
              />
            ))
          )}
        </div>
      </section>
    </>
  );
}

function TopicSection({
  heading,
  topics,
  empty,
}: {
  heading: string;
  topics: TopicListItem[];
  empty: string;
}) {
  return (
    <section>
      <h1 className="px-3 py-3 text-lg font-bold">{heading}</h1>
      <TopicList topics={topics} empty={empty} />
    </section>
  );
}
