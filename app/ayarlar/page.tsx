import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import Avatar from "@/components/Avatar";
import ConfirmButton from "@/components/ConfirmButton";
import ThemeToggle from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import { removeAvatar, setAllowMessages, unblockUser } from "./actions";
import AvatarForm from "./AvatarForm";

export const metadata: Metadata = { title: "ayarlar" };

type BlockRow = {
  blocked_id: string;
  blocked: { username: string; avatar_url: string | null } | null;
};

export default async function SettingsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/giris");

  const supabase = await createClient();
  const { data } = await supabase
    .from("blocks")
    .select(
      "blocked_id, blocked:profiles!blocks_blocked_id_fkey(username, avatar_url)",
    )
    .eq("blocker_id", viewer.id)
    .order("created_at", { ascending: false });
  const blocks = (data ?? []) as unknown as BlockRow[];

  return (
    <section>
      <h1 className="border-b border-line pb-3 text-2xl font-bold">ayarlar</h1>

      <SettingsSection title="görünüm">
        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggle className="grid size-11 place-items-center rounded-md border border-line hover:bg-surface-2" />
          <p className="text-sm text-muted">
            açık ve karanlık mod arasında geçiş yapar. tercihin bu cihazda
            saklanır.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection title="profil fotoğrafı">
        <div className="flex flex-wrap items-start gap-4">
          <div className="space-y-2">
            <Avatar
              username={viewer.username}
              url={viewer.avatar_url}
              size="lg"
            />
            {viewer.avatar_url && (
              <ConfirmButton
                action={removeAvatar}
                label="fotoğrafı kaldır"
                title="profil fotoğrafın kaldırılsın mı?"
                description="fotoğraf silinir, yerine adının baş harfi görünür."
                confirmLabel="kaldır"
                className="h-10 rounded-md border border-line px-3 text-sm text-danger hover:bg-surface-2"
              />
            )}
          </div>
          <AvatarForm />
        </div>
      </SettingsSection>

      <SettingsSection title="güvenlik">
        <p className="mb-3 text-sm leading-relaxed text-muted">
          şifreni değiştirdiğinde diğer cihazlardaki oturumların kapatılır.
        </p>
        <Link
          href="/sifre-yenile?kaynak=ayarlar"
          className="inline-flex h-10 items-center rounded-md border border-line px-4 text-sm hover:bg-surface-2"
        >
          şifremi değiştir
        </Link>
      </SettingsSection>

      <SettingsSection title="özel mesajlar">
        <p className="text-sm leading-relaxed text-muted">
          {viewer.allow_messages
            ? "özel mesajların açık, yazarlar sana mesaj atabilir."
            : "özel mesajların kapalı, kimse sana yeni mesaj atamaz. eski mesajlarını okumaya devam edebilirsin."}
        </p>
        <form
          action={setAllowMessages.bind(null, !viewer.allow_messages)}
          className="mt-3"
        >
          <button
            type="submit"
            role="switch"
            aria-checked={viewer.allow_messages}
            className={`h-10 rounded-md px-4 text-sm font-semibold ${
              viewer.allow_messages
                ? "border border-line text-ink hover:bg-surface-2"
                : "bg-gold text-on-gold hover:brightness-95"
            }`}
          >
            {viewer.allow_messages
              ? "özel mesajları kapat"
              : "özel mesajları aç"}
          </button>
        </form>
      </SettingsSection>

      <SettingsSection title="engellenenler">
        {blocks.length === 0 ? (
          <p className="text-sm text-muted">kimseyi engellemedin.</p>
        ) : (
          <ul>
            {blocks.map((block) => (
              <li
                key={block.blocked_id}
                className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-b-0"
              >
                {block.blocked ? (
                  <Link
                    href={`/yazar/${encodeURIComponent(block.blocked.username)}`}
                    className="inline-flex min-w-0 items-center gap-2 font-semibold text-gold-ink hover:underline"
                  >
                    <Avatar
                      username={block.blocked.username}
                      url={block.blocked.avatar_url}
                    />
                    <span className="break-words">
                      {block.blocked.username}
                    </span>
                  </Link>
                ) : (
                  <span className="text-muted">silinmiş hesap</span>
                )}
                <form action={unblockUser.bind(null, block.blocked_id)}>
                  <button
                    type="submit"
                    className="h-10 shrink-0 rounded-md border border-line px-3 text-sm hover:bg-surface-2"
                  >
                    engeli kaldır
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </SettingsSection>
    </section>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-b border-line py-5">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}
