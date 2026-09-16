"use client";

import { useEffect, useState } from "react";

/**
 * Supabase, onay bağlantısı başarısız olduğunda sebebi adres çubuğunun
 * "#" kısmına yazar. Hash sunucuya hiç ulaşmadığı için sebebi ancak
 * tarayıcıda okuyabiliriz; burada genel uyarının yerine net bir cümle koyar.
 */
const SEBEPLER: Record<string, string> = {
  otp_expired: "bağlantının süresi dolmuş.",
  access_denied: "bağlantı daha önce kullanılmış ya da artık geçerli değil.",
};

export default function HashNotice() {
  const [sebep, setSebep] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const kod = params.get("error_code") ?? params.get("error");
    if (!kod) return;

    setSebep(SEBEPLER[kod] ?? null);
    // Sayfa yenilenince uyarı tekrar çıkmasın.
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  }, []);

  if (!sebep) return null;

  return <span> {sebep}</span>;
}
