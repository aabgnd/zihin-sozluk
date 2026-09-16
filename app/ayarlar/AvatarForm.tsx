"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/types";
import { updateAvatar } from "./actions";

export default function AvatarForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updateAvatar,
    {},
  );

  return (
    <form action={formAction} className="min-w-0 flex-1 space-y-2">
      <label htmlFor="avatar" className="block text-sm font-semibold">
        yeni avatar{" "}
        <span className="font-normal text-muted">
          (jpg, png, webp · en fazla 1 mb)
        </span>
      </label>
      <input
        id="avatar"
        name="avatar"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required
        className="block w-full text-sm text-muted file:mr-3 file:h-10 file:cursor-pointer file:rounded-lg file:border-0 file:bg-bar-2 file:px-3 file:font-semibold file:text-ink"
      />
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="text-sm font-semibold text-gold-ink">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-gold px-4 text-sm font-bold text-on-gold hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "yükleniyor…" : "avatarı değiştir"}
      </button>
    </form>
  );
}
