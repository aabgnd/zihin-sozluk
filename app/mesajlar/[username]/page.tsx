import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import ConfirmButton from "@/components/ConfirmButton";
import DeletableRow from "@/components/DeletableRow";
import LiveRefresh from "@/components/LiveRefresh";
import LocalTime from "@/components/LocalTime";
import MarkRead from "@/components/MarkRead";
import ScrollAnchor from "@/components/ScrollAnchor";
import { getMessageBlocker, MESSAGE_COLUMNS } from "@/lib/messages";
import { createClient } from "@/lib/supabase/server";
import { safeDecode } from "@/lib/text";
import type { MessageRow, PublicProfile } from "@/lib/types";
import { getViewer, PROFILE_COLUMNS } from "@/lib/viewer";
import {
  deleteConversation,
  deleteMessage,
  markConversationRead,
  sendMessage,
} from "../actions";
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
      // Kendi tarafında sildiklerin bu listeye hiç girmez.
      .or(
        `and(sender_id.eq.${viewer.id},receiver_id.eq.${other.id},sender_deleted_at.is.null),and(sender_id.eq.${other.id},receiver_id.eq.${viewer.id},receiver_deleted_at.is.null)`,
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

      <header className="flex items-center gap-2 border-b border-line pb-3">
        <Link href="/mesajlar" className="text-sm text-muted hover:text-ink">
          ‹ mesajlar
        </Link>

        <div className="ml-auto flex min-w-0 items-center gap-1">
          {messages.length > 0 && (
            <ConfirmButton
              action={deleteConversation.bind(null, other.id)}
              label="tüm konuşmayı sil"
              title="tüm konuşma silinsin mi?"
              description="yazışma yalnızca senin tarafında silinir, karşı taraf kendi kopyasını görmeye devam eder."
              className="h-10 rounded-md border border-line px-3 text-sm text-danger hover:bg-surface-2"
            />
          )}
          <Link
            href={`/yazar/${encodeURIComponent(other.username)}`}
            className="inline-flex min-w-0 items-center gap-2 font-semibold text-gold-ink hover:underline"
          >
            <span className="break-words">{other.username}</span>
            <Avatar
              username={other.username}
              url={other.avatar_url}
              size="md"
            />
          </Link>
        </div>
      </header>

      <ol
        aria-label={`${other.username} ile mesajlar`}
        className="space-y-2 py-5"
      >
        {messages.length === 0 && (
          <li className="text-sm text-muted">
            henüz mesajlaşmadınız. ilk mesajı sen yaz.
          </li>
        )}
        {messages.map((message) => {
          const mine = message.sender_id === viewer.id;
          return (
            <li key={message.id}>
              <DeletableRow
                action={deleteMessage.bind(null, message.id)}
                ariaLabel="bu mesajı sil"
                title="bu mesaj silinsin mi?"
                description="mesaj yalnızca senin tarafında silinir, karşı taraf kendi kopyasını görmeye devam eder."
                className={`flex items-center gap-1 ${
                  mine
                    ? "flex-row-reverse justify-start"
                    : "flex-row justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    mine ? "bg-gold/15" : "bg-surface-2"
                  }`}
                >
                  <p className="whitespace-pre-line break-words text-[15px] leading-6">
                    {message.content}
                  </p>
                  <p className="mt-1 text-right text-[11px] text-muted">
                    <LocalTime iso={message.created_at} />
                    {mine && message.is_read && " · okundu"}
                  </p>
                </div>
              </DeletableRow>
            </li>
          );
        })}
      </ol>
      <ScrollAnchor key={messages.length} />

      {blocker ? (
        <p className="border-t border-line py-4 text-sm leading-relaxed text-muted">
          {blocker}
        </p>
      ) : (
        <MessageForm action={sendMessage.bind(null, other.id)} />
      )}
    </section>
  );
}
