import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/auth/actions";
import type { PublicProfile } from "@/lib/types";
import Avatar from "./Avatar";
import {
  BellIcon,
  LogOutIcon,
  MessageIcon,
  SettingsIcon,
  ShieldIcon,
  StarIcon,
  UserIcon,
} from "./icons";
import UserMenu from "./UserMenu";

type Props = {
  viewer: Pick<PublicProfile, "username" | "avatar_url" | "role">;
  unreadMessages: number;
  unreadNotifications: number;
  iconButtonClass: string;
};

const menuItem = "flex h-11 w-full items-center gap-2.5 px-4 text-left text-[15px] hover:bg-page";

// 9'dan fazlası "9+" olarak gösterilir.
function badgeText(count: number) {
  return count > 9 ? "9+" : String(count);
}

export default function AccountNav({
  viewer,
  unreadMessages,
  unreadNotifications,
  iconButtonClass,
}: Props) {
  const profileHref = `/yazar/${encodeURIComponent(viewer.username)}`;
  const isStaff = viewer.role === "admin" || viewer.role === "mod";
  const messagesLabel = unreadMessages > 0 ? `mesajlar, ${unreadMessages} okunmamış` : "mesajlar";
  const notificationsLabel =
    unreadNotifications > 0 ? `bildirimler, ${unreadNotifications} okunmamış` : "bildirimler";

  return (
    <>
      <Link href="/mesajlar" aria-label={messagesLabel} className={iconButtonClass}>
        <MessageIcon className="size-7" />
        {unreadMessages > 0 && <CountBadge>{badgeText(unreadMessages)}</CountBadge>}
      </Link>

      <Link href="/bildirimler" aria-label={notificationsLabel} className={iconButtonClass}>
        <BellIcon className="size-7" />
        {unreadNotifications > 0 && <CountBadge>{badgeText(unreadNotifications)}</CountBadge>}
      </Link>

      <UserMenu
        label={`${viewer.username} menüsü`}
        triggerClassName={`${iconButtonClass} overflow-hidden`}
        trigger={<Avatar username={viewer.username} url={viewer.avatar_url} size="md" />}
      >
        <p className="border-b border-line px-4 pb-2 pt-1 text-sm font-bold">{viewer.username}</p>
        <MenuLink href={profileHref} icon={<UserIcon className="size-4" />}>
          ben
        </MenuLink>
        <MenuLink href="/mesajlar" icon={<MessageIcon className="size-4" />}>
          mesajlar
        </MenuLink>
        <MenuLink href="/bildirimler" icon={<BellIcon className="size-4" />}>
          bildirimler
        </MenuLink>
        <MenuLink href={`${profileHref}?sekme=favoriler`} icon={<StarIcon className="size-4" />}>
          favoriler
        </MenuLink>
        <MenuLink href="/ayarlar" icon={<SettingsIcon className="size-4" />}>
          ayarlar
        </MenuLink>
        {isStaff && (
          <MenuLink href="/yonetim" icon={<ShieldIcon className="size-4" />} highlight>
            yönetim
          </MenuLink>
        )}
        <form action={signOut} className="border-t border-line">
          <button type="submit" role="menuitem" className={menuItem}>
            <LogOutIcon className="size-4" />
            çıkış
          </button>
        </form>
      </UserMenu>
    </>
  );
}

function MenuLink({
  href,
  icon,
  highlight = false,
  children,
}: {
  href: string;
  icon: ReactNode;
  highlight?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className={`${menuItem} ${highlight ? "font-semibold text-gold-ink" : ""}`}
    >
      {icon}
      {children}
    </Link>
  );
}

function CountBadge({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-alert px-1 text-[11px] font-bold leading-none text-on-alert"
    >
      {children}
    </span>
  );
}
