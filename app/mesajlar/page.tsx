import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import LiveRefresh from "@/components/LiveRefresh";
import { MESSAGE_COLUMNS } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/text";
import type { MessageRow } from "@/lib/types";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "mesajlar" };

type Person = { id: string; username: string; avatar_url: string | null };

export default async function MessagesPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");

  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select(MESSAGE_COLUMNS)
    .or(`sender_id.eq.${viewer.id},receiver_id.eq.${viewer.id}`)
    .order("created_at", { ascending: false })
    .limit(500);
  const messages = (data ?? []) as MessageRow[];

  const conversations = new Map<string, { last: MessageRow; unread: number }>();
  for (const message of messages) {
    const otherId =
      message.sender_id === viewer.id ? message.receiver_id : message.sender_id;
    const unread =
      message.receiver_id === viewer.id && !message.is_read ? 1 : 0;
    const conversation = conversations.get(otherId);
    if (conversation) conversation.unread += unread;
    else conversations.set(otherId, { last: message, unread });
  }

  const otherIds = [...conversations.keys()];
  const { data: peopleData } = otherIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", otherIds)
    : { data: [] };
  const people = new Map(
    ((peopleData ?? []) as Person[]).map((person) => [person.id, person]),
  );

  return (
    <section className="space-y-3">
      <LiveRefresh
        channel={`mesaj-kutusu:${viewer.id}`}
        subscriptions={[
          { table: "messages", filter: `receiver_id=eq.${viewer.id}` },
          { table: "messages", filter: `sender_id=eq.${viewer.id}` },
        ]}
      />
      <h1 className="text-xl font-bold">mesajlar</h1>

      {conversations.size === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-4 leading-relaxed text-muted shadow-sm">
          {
            'henüz mesajın yok. bir yazarın profilinden ya da entry\'sinin altındaki "mesaj at" ile yazışmaya başlayabilirsin.'
          }
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
          {[...conversations.entries()].map(([otherId, { last, unread }]) => {
            const person = people.get(otherId);
            if (!person) return null;
            return (
              <li key={otherId}>
                <Link
                  href={`/mesajlar/${encodeURIComponent(person.username)}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-page"
                >
                  <Avatar
                    username={person.username}
                    url={person.avatar_url}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={`break-words ${unread > 0 ? "font-bold" : "font-semibold"}`}
                      >
                        {person.username}
                      </span>
                      <time
                        dateTime={last.created_at}
                        className="shrink-0 text-xs text-muted"
                      >
                        {formatDateTime(last.created_at)}
                      </time>
                    </div>
                    <p className="line-clamp-1 break-all text-sm text-muted">
                      {last.sender_id === viewer.id ? "sen: " : ""}
                      {last.content}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="shrink-0 rounded-full bg-alert px-2 py-0.5 text-xs font-bold text-on-alert">
                      {unread}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
