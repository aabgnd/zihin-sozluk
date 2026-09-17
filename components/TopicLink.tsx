"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Başlık bağlantısı. Açık olan başlığı adres çubuğundan anlar.
 *
 * Aktiflik URL'den okunur, bir yerde tutulan seçim durumundan değil; böylece
 * sayfa yenilendiğinde de doğru başlık işaretli kalır ve aynı anda yalnızca
 * bir başlık aktif olabilir.
 */
export default function TopicLink({
  slug,
  href,
  className,
  activeClassName,
  children,
}: {
  slug: string;
  /** Verilmezse /baslik/<slug> kullanılır (ör. entry çapası için). */
  href?: string;
  className: string;
  activeClassName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const aktif = pathname === `/baslik/${slug}`;

  return (
    <Link
      href={href ?? `/baslik/${slug}`}
      aria-current={aktif ? "page" : undefined}
      className={`${className} ${aktif ? activeClassName : ""}`}
    >
      {children}
    </Link>
  );
}
