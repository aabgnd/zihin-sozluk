"use client";

import { useActionState } from "react";
import { resendConfirmation, signIn } from "@/app/auth/actions";
import Field from "@/components/Field";
import type { FormState } from "@/lib/types";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    signIn,
    {},
  );
  const [resendState, resendAction, resending] = useActionState<
    FormState,
    FormData
  >(resendConfirmation, {});

  return (
    <>
      <form action={formAction} className="space-y-4">
        <Field
          label="e-posta"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <Field
          label="şifre"
          name="password"
          type="password"
          autoComplete="current-password"
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
          className="h-11 w-full rounded-lg bg-gold font-bold text-on-gold hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "giriş yapılıyor…" : "giriş yap"}
        </button>
      </form>

      {state.unconfirmedEmail && (
        <form
          action={resendAction}
          className="mt-4 space-y-2 rounded-lg border border-line bg-page p-3 text-sm"
        >
          <input type="hidden" name="email" value={state.unconfirmedEmail} />
          {resendState.message ? (
            <p role="status">{resendState.message}</p>
          ) : (
            <button
              type="submit"
              disabled={resending}
              className="h-10 rounded-lg border border-gold px-4 font-semibold text-gold-ink disabled:opacity-60"
            >
              {resending ? "gönderiliyor…" : "onay e-postasını tekrar gönder"}
            </button>
          )}
          {resendState.error && (
            <p role="alert" className="text-danger">
              {resendState.error}
            </p>
          )}
        </form>
      )}
    </>
  );
}
