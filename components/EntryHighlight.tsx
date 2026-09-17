"use client";

import { useEffect } from "react";

/**
 * Adreste #entry-<numara> çapası varsa o entry'ye kaydırır ve kısa süre
 * vurgular. Çapayla gelen kullanıcı, uzun bir başlıkta hangi entry'ye
 * geldiğini görsün diye.
 */
export default function EntryHighlight() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#entry-")) return;

    const hedef = document.getElementById(hash.slice(1));
    if (!hedef) return;

    hedef.scrollIntoView({ block: "center" });
    hedef.classList.add("entry-vurgu");
    const zamanlayici = setTimeout(
      () => hedef.classList.remove("entry-vurgu"),
      2200,
    );
    return () => clearTimeout(zamanlayici);
  }, []);

  return null;
}
