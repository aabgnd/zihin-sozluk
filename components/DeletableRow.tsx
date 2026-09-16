"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { TrashIcon } from "./icons";

/**
 * İçeriğini bir çöp kutusu düğmesiyle birlikte gösterir.
 *
 * Onaylanınca satır anında ekrandan kalkar, silme arka planda yapılır.
 * İşlem başarısız olursa satır geri gelir ve hata yazısı görünür.
 */
export default function DeletableRow({
  action,
  title,
  description,
  ariaLabel,
  className,
  children,
}: {
  action: () => Promise<void>;
  title: string;
  description?: string;
  ariaLabel: string;
  className?: string;
  children: ReactNode;
}) {
  const [silindi, setSilindi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);

  if (silindi) return null;

  const onayla = () => {
    dialog.current?.close();
    setSilindi(true);
    setHata(null);
    startTransition(async () => {
      try {
        await action();
      } catch {
        setSilindi(false);
        setHata("silinemedi, tekrar dene.");
      }
    });
  };

  return (
    <>
      <div className={className}>
        {children}
        {/* Dokunma alanı 44px. */}
        <button
          type="button"
          onClick={() => dialog.current?.showModal()}
          aria-label={ariaLabel}
          className="grid size-11 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-danger"
        >
          <TrashIcon className="size-5" />
        </button>
      </div>

      {hata && (
        <p role="alert" className="px-2 pb-2 text-sm text-danger">
          {hata}
        </p>
      )}

      <dialog
        ref={dialog}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-line bg-surface p-0 text-ink shadow-lg backdrop:bg-black/50"
      >
        <div className="p-5">
          <h2 className="text-lg font-bold">{title}</h2>
          {description && (
            <p className="mt-2 text-sm text-muted">{description}</p>
          )}
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
              onClick={onayla}
              className="h-10 rounded-lg bg-danger px-4 text-sm font-bold text-surface hover:opacity-90"
            >
              sil
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
