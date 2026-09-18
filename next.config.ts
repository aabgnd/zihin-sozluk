import type { NextConfig } from "next";

const supabaseHost = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://localhost",
).hostname;

/*
 * İçerik Güvenliği Politikası şimdilik yalnızca RAPOR modunda.
 *
 * Engellemez, tarayıcı konsoluna ihlal yazar. Doğrudan zorunlu yapılsaydı,
 * listede unutulan tek bir kaynak (tema betiği, Supabase realtime soketi)
 * siteyi sessizce bozabilirdi. Konsolda ihlal görülmedikten sonra başlık
 * adı "Content-Security-Policy" yapılarak zorunlu hâle getirilebilir.
 */
const csp = [
  "default-src 'self'",
  // Next.js hidrasyon ve tema betiği satır içi; geliştirmede HMR eval kullanır.
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${supabaseHost}`,
  "font-src 'self' data:",
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const guvenlikBasliklari = [
  // Site başka bir sitenin içine gömülemesin (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Tarayıcı dosya türünü tahmin etmesin.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Dış sitelere yalnızca alan adı gitsin, tam adres gitmesin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Kullanılmayan cihaz izinleri baştan kapalı.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: guvenlikBasliklari }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // 2 MB dosya + form verisi payı.
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
