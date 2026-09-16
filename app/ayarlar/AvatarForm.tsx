"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/lib/types";
import { updateAvatar } from "./actions";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function AvatarForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(updateAvatar, {});
  const [localError, setLocalError] = useState<string | null>(null);

  const checkFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setLocalError(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setLocalError("sadece jpg, png ya da webp yükleyebilirsin.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError(
        `görsel en fazla 2 mb olabilir. seçtiğin dosya ${(file.size / 1024 / 1024).toFixed(1)} mb.`,
      );
      event.target.value = "";
      return;
    }
    setLocalError(null);
  };

  const error = localError ?? state.error;

  return (
    <form action={formAction} className="min-w-0 flex-1 space-y-2">
      <label htmlFor="avatar" className="block text-sm font-semibold">
        yeni fotoğraf <span className="font-normal text-muted">(jpg, png, webp · en fazla 2 mb)</span>
      </label>
      <input
        id="avatar"
        name="avatar"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required
        onChange={checkFile}
        className="block w-full text-sm text-muted file:mr-3 file:h-10 file:cursor-pointer file:rounded-md file:border file:border-line file:bg-surface file:px-3 file:text-ink"
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {state.message && !localError && (
        <p role="status" className="text-sm font-semibold text-gold-ink">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-md bg-gold px-4 text-sm font-semibold text-on-gold hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "yükleniyor…" : "fotoğrafı değiştir"}
      </button>
    </form>
  );
}
