"use client";

import { submitWithoutReset } from "@/lib/form";
import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, signUp, type AuthState } from "@/app/auth-actions";

const inputClass =
  "block w-full rounded-xl border border-line bg-sunken px-3 py-2.5 outline-none focus:border-link focus:ring-2 focus:ring-link/25";
const buttonClass =
  "flex h-11 w-full items-center justify-center rounded-xl bg-accent font-semibold text-on-accent transition hover:brightness-110 disabled:opacity-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function withNext(path: string, next: string | null) {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next");
  const [state, action, pending] = useActionState<AuthState, FormData>(signIn, { status: "idle" });

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-4">
      {params.get("confirmed") && (
        <p className="rounded-xl bg-ok-soft px-3 py-2 text-sm text-ok">Adresse confirmée. Tu peux te connecter.</p>
      )}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Email">
        <input name="email" type="email" autoComplete="email" required className={inputClass} />
      </Field>
      <Field label="Mot de passe">
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </Field>
      {state.status === "error" && <p className="text-sm text-danger">{state.message}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
      <p className="text-center text-sm text-muted">
        Pas encore de compte ?{" "}
        <Link href={withNext("/inscription", next)} className="font-medium text-link hover:underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const params = useSearchParams();
  const next = params.get("next");
  const [state, action, pending] = useActionState<AuthState, FormData>(signUp, { status: "idle" });

  if (state.status === "check_email") {
    return (
      <div className="space-y-3 text-center">
        <p className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-soft text-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </p>
        <p className="font-semibold">Vérifie ta boîte mail</p>
        <p className="text-sm text-muted">
          On a envoyé un lien de confirmation à <strong className="text-foreground">{state.email}</strong>. Clique
          dessus pour activer ton compte.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="Pseudo">
        <input name="display_name" required minLength={2} maxLength={40} autoComplete="nickname" className={inputClass} />
      </Field>
      <Field label="Email">
        <input name="email" type="email" autoComplete="email" required className={inputClass} />
      </Field>
      <Field label="Mot de passe">
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-muted">8 caractères minimum.</span>
      </Field>
      {state.status === "error" && <p className="text-sm text-danger">{state.message}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Création…" : "Créer mon compte"}
      </button>
      <p className="text-center text-xs leading-relaxed text-muted">
        En créant un compte, tu confirmes avoir 18 ans ou plus et accepter les{" "}
        <Link href="/conditions-utilisation" className="font-medium text-link hover:underline">
          conditions d&apos;utilisation
        </Link>
        .
      </p>
      <p className="text-center text-sm text-muted">
        Déjà membre ?{" "}
        <Link href={withNext("/connexion", next)} className="font-medium text-link hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
