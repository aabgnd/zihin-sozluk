import { headers } from "next/headers";

const YEREL_ADRES = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

function duzelt(deger: string | null | undefined): string | null {
  const temiz = (deger ?? "").trim().replace(/\/+$/, "");
  if (!temiz) return null;
  return /^https?:\/\//i.test(temiz) ? temiz : `https://${temiz}`;
}

/**
 * Onay maillerine yazılacak site adresi.
 *
 * Sıra: açık ayar → Vercel'in verdiği üretim alan adı → isteğin kendi adresi.
 * Üretimde localhost'a işaret eden bir ayar yok sayılır; aksi hâlde canlıdan
 * gönderilen onay maili açılamayan bir bağlantı taşır.
 */
export async function siteUrl(): Promise<string> {
  const uretim = process.env.NODE_ENV === "production";
  const acikAyar = duzelt(
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  );
  if (acikAyar && !(uretim && YEREL_ADRES.test(acikAyar))) return acikAyar;

  const vercel = duzelt(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercel) return vercel;

  const istek = await headers();
  const origin = duzelt(istek.get("origin"));
  if (origin) return origin;

  const host = istek.get("host");
  const hostAdresi = duzelt(host);
  if (hostAdresi) return hostAdresi;

  return "http://localhost:3002";
}

/** Kayıt ve "tekrar gönder" maillerinin dönüş adresi. */
export async function onayAdresi(): Promise<string> {
  return `${await siteUrl()}/auth/confirm`;
}
