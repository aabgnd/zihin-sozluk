import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/auth/actions";
import type { PublicProfile } from "@/lib/types";
import { BellIcon, MessageIcon, UserIcon } from "./icons";
import MobileMenu from "./MobileMenu";

type Props = {
  viewer: Pick<PublicProfile, "username" | "role">;
  unreadMessages: number;
  unreadNotifications: number;
};

const tileBase =
  "relative grid size-10 place-items-center rounded-sm bg-bar-2 hover:text-gold sm:size-11";
const menuItem =
  "flex h-11 w-full items-center px-4 text-left text-[15px] hover:bg-page";

export default function AccountNav({
  viewer,
  unreadMessages,
  unreadNotifications,
}: Props) {
  const profileHref = `/yazar/${encodeURIComponent(viewer.username)}`;
  const isStaff = viewer.role === "admin" || viewer.role === "mod";
  const messagesLabel =
    unreadMessages > 0 ? `mesajlar (+${unreadMessages})` : "mesajlar";
  const notificationsLabel =
    unreadNotifications > 0
      ? `bildirimler (${unreadNotifications})`
      : "bildirimler";

  return (
    <>
      <nav
        aria-label="hesap"
        className="hidden shrink-0 items-center gap-3 lg:flex"
      >
        <DesktopLink href={profileHref}>ben</DesktopLink>
        <DesktopLink href="/mesajlar" highlight={unreadMessages > 0}>
          {messagesLabel}
        </DesktopLink>
        <DesktopLink href="/bildirimler" highlight={unreadNotifications > 0}>
          {notificationsLabel}
        </DesktopLink>
        <DesktopLink href={`${profileHref}?sekme=favoriler`}>
          favoriler
        </DesktopLink>
        <DesktopLink href="/ayarlar">ayarlar</DesktopLink>
        {isStaff && (
          <DesktopLink href="/admin" highlight>
            yönetim
          </DesktopLink>
        )}
        <form action={signOut}>
          <button
            type="submit"
            className="whitespace-nowrap text-sm text-on-bar hover:text-gold"
          >
            çıkış
          </button>
        </form>
      </nav>

      <nav aria-label="hesap" className="flex items-center gap-1.5 lg:hidden">
        <Link
          href={profileHref}
          aria-label="ben"
          title="ben"
          className={`${tileBase} text-on-bar`}
        >
          <UserIcon className="size-5" />
        </Link>
        <Link
          href="/mesajlar"
          aria-label={messagesLabel}
          title={messagesLabel}
          className={`${tileBase} ${unreadMessages > 0 ? "text-gold ring-1 ring-gold" : "text-on-bar"}`}
        >
          <MessageIcon className="size-5" />
          {unreadMessages > 0 && <CountBadge>+{unreadMessages}</CountBadge>}
        </Link>
        <Link
          href="/bildirimler"
          aria-label={notificationsLabel}
          title={notificationsLabel}
          className={`${tileBase} ${unreadNotifications > 0 ? "text-gold ring-1 ring-gold" : "text-on-bar"}`}
        >
          <BellIcon className="size-5" />
          {unreadNotifications > 0 && (
            <CountBadge>{unreadNotifications}</CountBadge>
          )}
        </Link>
        <MobileMenu triggerClassName={`${tileBase} text-on-bar`}>
          <Link href={`${profileHref}?sekme=favoriler`} className={menuItem}>
            favoriler
          </Link>
          <Link href="/ayarlar" className={menuItem}>
            ayarlar
          </Link>
          {isStaff && (
            <Link
              href="/admin"
              className={`${menuItem} font-semibold text-gold-ink`}
            >
              yönetim
            </Link>
          )}
          <form action={signOut} className="border-t border-line">
            <button type="submit" className={menuItem}>
              çıkış
            </button>
          </form>
        </MobileMenu>
      </nav>
    </>
  );
}

function DesktopLink({
  href,
  highlight = false,
  children,
}: {
  href: string;
  highlight?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap text-sm hover:text-gold ${highlight ? "font-bold text-gold" : "text-on-bar"}`}
    >
      {children}
    </Link>
  );
}

function CountBadge({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold leading-none text-on-gold motion-safe:animate-pulse"
    >
      {children}
    </span>
  );
}
