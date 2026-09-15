import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import LiveRefresh from "@/components/LiveRefresh";
import MarkRead from "@/components/MarkRead";
import ScrollAnchor from "@/components/ScrollAnchor";
import { getMessageBlocker, MESSAGE_COLUMNS } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, safeDecode } from "@/lib/text";
import type { MessageRow, PublicProfile } from "@/lib/types";
import { getViewer, PROFILE_COLUMNS } from "@/lib/viewer";
import { markConversationRead, sendMessage } from "../actions";
import MessageForm from "../MessageForm";

export const metadata: Metadata = { title: "sohbet" };

export default async function ConversationPage({
  params,
}: PageProps<"/mesajlar/[username]">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");

  const username = safeDecode((await params).username);
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("username", username)
    .maybeSingle();
  const other = data as PublicProfile | null;
  if (!other) notFound();
  if (other.id === viewer.id) redirect("/mesajlar");

  const [{ data: messageData }, blocker] = await Promise.all([
    supabase
      .from("messages")
      .select(MESSAGE_COLUMNS)
      .or(
        `and(sender_id.eq.${viewer.id},receiver_id.eq.${other.id}),and(sender_id.eq.${other.id},receiver_id.eq.${viewer.id})`,
      )
      .order("created_at", { ascending: false })
      .limit(100),
    getMessageBlocker(viewer, other),
  ]);
  const messages = ((messageData ?? []) as MessageRow[]).reverse();
  const unread = messages.filter(
    (message) => message.receiver_id === viewer.id && !message.is_read,
  );
  const lastUnread = unread.at(-1);

  return (
    <section>
      <LiveRefresh
        channel={`sohbet:${viewer.id}:${other.id}`}
        subscriptions={[
          { table: "messages", filter: `sender_id=eq.${other.id}` },
          { table: "messages", filter: `receiver_id=eq.${other.id}` },
        ]}
      />
      {lastUnread && (
        <MarkRead
          key={lastUnread.id}
          action={markConversationRead.bind(null, other.id)}
        />
      )}

      <header className="flex items-center gap-3 border-b border-line px-3 py-2">
        <Link
          href="/mesajlar"
          className="flex h-11 items-center pr-2 text-sm text-muted hover:text-ink"
        >
          ‹ mesajlar
        </Link>
        <Link
          href={`/yazar/${encodeURIComponent(other.username)}`}
          className="ml-auto inline-flex min-w-0 items-center gap-2 font-bold text-gold-ink hover:underline"
        >
          <span className="break-words">{other.username}</span>
          <Avatar username={other.username} url={other.avatar_url} size="md" />
        </Link>
      </header>

      <ol
        aria-label={`${other.username} ile mesajlar`}
        className="space-y-2 px-3 py-4"
      >
        {messages.length === 0 && (
          <li className="text-sm text-muted">
            henüz mesajlaşmadınız. ilk mesajı sen yaz.
          </li>
        )}
        {messages.map((message) => {
          const mine = message.sender_id === viewer.id;
          return (
            <li
              key={message.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-sm border px-3 py-2 ${
                  mine ? "border-gold bg-gold/15" : "border-line bg-surface"
                }`}
              >
                <p className="whitespace-pre-line break-words text-[15px] leading-6">
                  {message.content}
                </p>
                <p className="mt-1 text-right text-[11px] text-muted">
                  <time dateTime={message.created_at}>
                    {formatDateTime(message.created_at)}
                  </time>
                  {mine && message.is_read && " · okundu"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      <ScrollAnchor key={messages.length} />

      {blocker ? (
        <p className="border-t border-line px-3 py-4 text-sm leading-relaxed text-muted">
          {blocker}
        </p>
      ) : (
        <MessageForm action={sendMessage.bind(null, other.id)} />
      )}
    </section>
  );
}
