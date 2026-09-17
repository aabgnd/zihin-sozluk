import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LiveRefresh from "@/components/LiveRefresh";
import { MESSAGE_COLUMNS } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";
import type { MessageRow } from "@/lib/types";
import { getViewer } from "@/lib/viewer";
import ConversationList, { type Konusma } from "./ConversationList";

export const metadata: Metadata = { title: "mesajlar" };

type Person = { id: string; username: string; avatar_url: string | null };

export default async function MessagesPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");

  const supabase = await createClient();
  // Kendi tarafında silinmiş mesajlar hiç gelmez.
  const { data } = await supabase
    .from("messages")
    .select(MESSAGE_COLUMNS)
    .or(
      `and(sender_id.eq.${viewer.id},sender_deleted_at.is.null),and(receiver_id.eq.${viewer.id},receiver_deleted_at.is.null)`,
    )
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

  const konusmalar: Konusma[] = [];
  for (const [otherId, { last, unread }] of conversations) {
    const person = people.get(otherId);
    if (!person) continue;
    konusmalar.push({
      otherId,
      username: person.username,
      avatarUrl: person.avatar_url,
      sonMetin: last.content,
      sonTarih: last.created_at,
      benimMi: last.sender_id === viewer.id,
      okunmamis: unread,
    });
  }

  return (
    <section>
      <LiveRefresh
        channel={`mesaj-kutusu:${viewer.id}`}
        subscriptions={[
          { table: "messages", filter: `receiver_id=eq.${viewer.id}` },
          { table: "messages", filter: `sender_id=eq.${viewer.id}` },
        ]}
      />
      <h1 className="border-b border-line pb-3 text-2xl font-bold">mesajlar</h1>
      <ConversationList konusmalar={konusmalar} />
    </section>
  );
}
