import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";
import AccountNav from "./AccountNav";
import InfoModal from "./InfoModal";
import LiveRefresh from "./LiveRefresh";
import MobileAgendaDrawer from "./MobileAgendaDrawer";
import MobileSearch from "./MobileSearch";
import SearchForm from "./SearchForm";
import TabBar, { TabLinks } from "./TabBar";
import ThemeToggle from "./ThemeToggle";
import TopicSidebar from "./TopicSidebar";

// Dokunma alanı sm üstünde 44px; 360px'de yedi öğe sığsın diye mobilde 40px.
const iconButton =
  "relative grid size-10 place-items-center rounded-md text-ink hover:bg-surface-2 sm:size-11";

export default async function SiteHeader() {
  const viewer = await getViewer();

  let unreadMessages = 0;
  let unreadNotifications = 0;
  if (viewer) {
    const supabase = await createClient();
    const [messages, notifications] = await Promise.all([
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", viewer.id)
        .eq("is_read", false),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", viewer.id)
        .eq("is_read", false),
    ]);
    unreadMessages = messages.count ?? 0;
    unreadNotifications = notifications.count ?? 0;
  }

  return (
    <header className="bg-surface">
      {viewer && (
        <LiveRefresh
          channel={`kullanici:${viewer.id}`}
          listenForSync
          subscriptions={[
            { table: "messages", filter: `receiver_id=eq.${viewer.id}` },
            { table: "messages", filter: `sender_id=eq.${viewer.id}` },
            { table: "notifications", filter: `user_id=eq.${viewer.id}` },
          ]}
        />
      )}

      {/* Sarı sadece ince şerit olarak. */}
      <div className="h-1 bg-gold" />

      <div className="relative border-b border-line">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-1 px-4 sm:gap-3">
          {/* Bilgi (i) çekmecede; tema ana ekranda kalır. */}
          <div className="lg:hidden">
            <MobileAgendaDrawer
              buttonClassName={iconButton}
              footer={<InfoModal className={iconButton} />}
            >
              <TopicSidebar />
            </MobileAgendaDrawer>
          </div>

          <Link
            href="/"
            aria-label="zihin sözlük ana sayfa"
            className="shrink-0 text-base font-extrabold lowercase tracking-tight sm:text-xl md:text-2xl"
          >
            <span className="text-logo">zihin</span>
            <span className="ml-[0.1em] text-ink">sözlük</span>
          </Link>

          <SearchForm
            inputId="q-genis"
            className="mx-auto hidden w-full max-w-xl md:flex"
          />

          {/* Sıra: arama, tema, mesajlar, bildirimler, avatar. */}
          <div className="ml-auto flex items-center gap-0.5 md:ml-0">
            <div className="md:hidden">
              <MobileSearch buttonClassName={iconButton} />
            </div>
            <div className="hidden lg:block">
              <InfoModal className={iconButton} />
            </div>
            <ThemeToggle className={iconButton} />

            {viewer ? (
              <AccountNav
                viewer={viewer}
                unreadMessages={unreadMessages}
                unreadNotifications={unreadNotifications}
                iconButtonClass={iconButton}
              />
            ) : (
              <>
                <Link
                  href="/giris"
                  className="flex h-10 shrink-0 items-center rounded-md border border-line px-2.5 text-sm hover:bg-surface-2 sm:h-11 sm:px-4 sm:text-[15px]"
                >
                  giriş yap
                </Link>
                <Link
                  href="/kayit"
                  className="flex h-10 shrink-0 items-center rounded-md bg-gold px-2.5 text-sm font-semibold text-on-gold hover:brightness-95 sm:h-11 sm:px-4 sm:text-[15px]"
                >
                  kaydol
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <Suspense fallback={<TabLinks active={null} />}>
        <TabBar />
      </Suspense>
    </header>
  );
}
