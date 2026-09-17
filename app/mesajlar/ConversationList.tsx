"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import Avatar from "@/components/Avatar";
import LocalTime from "@/components/LocalTime";
import { deleteAllConversations, deleteConversations } from "./actions";

export type Konusma = {
  otherId: string;
  username: string;
  avatarUrl: string | null;
  sonMetin: string;
  sonTarih: string;
  benimMi: boolean;
  okunmamis: number;
};

const dugme =
  "h-10 rounded-md border border-line px-3 text-sm hover:bg-surface-2 disabled:opacity-50";

export default function ConversationList({
  konusmalar,
}: {
  konusmalar: Konusma[];
}) {
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [gizli, setGizli] = useState<Set<string>>(new Set());
  const [hata, setHata] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);

  const gorunen = konusmalar.filter((k) => !gizli.has(k.otherId));
  const hepsiSecili = gorunen.length > 0 && secili.size === gorunen.length;

  const degistir = (id: string) => {
    setSecili((onceki) => {
      const yeni = new Set(onceki);
      if (yeni.has(id)) yeni.delete(id);
      else yeni.add(id);
      return yeni;
    });
  };

  const tumunuSec = () => {
    setSecili(hepsiSecili ? new Set() : new Set(gorunen.map((k) => k.otherId)));
  };

  // Silinenler anında kaybolur; işlem başarısız olursa geri gelirler.
  const sil = (idler: string[], hepsiMi: boolean) => {
    if (idler.length === 0) return;
    setGizli((onceki) => new Set([...onceki, ...idler]));
    setSecili(new Set());
    setHata(null);
    startTransition(async () => {
      try {
        if (hepsiMi) await deleteAllConversations();
        else await deleteConversations(idler);
      } catch {
        setGizli((onceki) => {
          const yeni = new Set(onceki);
          for (const id of idler) yeni.delete(id);
          return yeni;
        });
        setHata("silinemedi, tekrar dene.");
      }
    });
  };

  if (gorunen.length === 0) {
    return (
      <p className="py-4 leading-relaxed text-muted">
        {
          "henüz mesajın yok. bir yazarın profilinden ya da entry'sinin altındaki menüden yazışmaya başlayabilirsin."
        }
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-b border-line py-3">
        <label className="flex h-10 cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={hepsiSecili}
            onChange={tumunuSec}
            className="size-4 accent-gold"
          />
          tümünü seç
        </label>
        <button
          type="button"
          disabled={secili.size === 0}
          onClick={() => sil([...secili], false)}
          className={`${dugme} ${secili.size > 0 ? "text-danger" : ""}`}
        >
          {secili.size > 0 ? `seçilenleri sil (${secili.size})` : "seçilenleri sil"}
        </button>
        <button
          type="button"
          onClick={() => dialog.current?.showModal()}
          className={`${dugme} ml-auto text-danger`}
        >
          tüm mesajları sil
        </button>
      </div>

      {hata && (
        <p role="alert" className="py-2 text-sm text-danger">
          {hata}
        </p>
      )}

      <ul>
        {gorunen.map((k) => (
          <li key={k.otherId} className="flex items-center gap-1 border-b border-line">
            <label className="grid size-11 shrink-0 cursor-pointer place-items-center">
              <input
                type="checkbox"
                checked={secili.has(k.otherId)}
                onChange={() => degistir(k.otherId)}
                aria-label={`${k.username} ile olan konuşmayı seç`}
                className="size-4 accent-gold"
              />
            </label>
            <Link
              href={`/mesajlar/${encodeURIComponent(k.username)}`}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-3 hover:bg-surface-2"
            >
              <Avatar username={k.username} url={k.avatarUrl} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={`break-words ${k.okunmamis > 0 ? "font-bold" : "font-semibold"}`}
                  >
                    {k.username}
                  </span>
                  <LocalTime
                    iso={k.sonTarih}
                    className="shrink-0 text-xs text-muted"
                  />
                </div>
                <p className="line-clamp-1 break-all text-sm text-muted">
                  {k.benimMi ? "sen: " : ""}
                  {k.sonMetin}
                </p>
              </div>
              {k.okunmamis > 0 && (
                <span className="shrink-0 rounded-full bg-alert px-2 py-0.5 text-xs font-bold text-on-alert">
                  {k.okunmamis}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-ink shadow-lg backdrop:bg-black/50"
      >
        <div className="p-5">
          <h2 className="text-lg font-bold">tüm mesajlar silinsin mi?</h2>
          <p className="mt-2 text-sm text-muted">
            bütün yazışmalar yalnızca senin tarafında silinir, karşı taraf kendi
            kopyasını görmeye devam eder.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              className="h-10 rounded-lg border border-line px-4 text-sm font-semibold hover:bg-page"
            >
              vazgeç
            </button>
            <button
              type="button"
              onClick={() => {
                dialog.current?.close();
                sil(
                  gorunen.map((k) => k.otherId),
                  true,
                );
              }}
              className="h-10 rounded-lg bg-danger px-4 text-sm font-bold text-surface hover:opacity-90"
            >
              hepsini sil
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
