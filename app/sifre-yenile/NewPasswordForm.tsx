"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/auth/actions";
import Field from "@/components/Field";
import type { FormState } from "@/lib/types";

export default function NewPasswordForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    updatePassword,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <Field
        label="yeni şifre (en az 8 karakter)"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Field
        label="yeni şifre (tekrar)"
        name="password_tekrar"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-md bg-gold text-sm font-semibold text-on-gold hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "kaydediliyor…" : "şifremi değiştir"}
      </button>
    </form>
  );
}
