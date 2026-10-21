"use client";

import { submitWithoutReset } from "@/lib/form";
import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset, signIn, signUp, updatePassword, type AuthState } from "@/app/auth-actions";

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

/** Message « Vérifie ta boîte mail » après l'envoi d'un lien. */
function MailNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3 text-center" role="status">
      <p className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-soft text-link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-6" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </p>
      <p className="font-semibold">Vérifie ta boîte mail</p>
      <p className="text-sm text-muted">{children}</p>
    </div>
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
      <label className="block">
        <span className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium">Mot de passe</span>
          <Link href="/mot-de-passe-oublie" className="text-sm text-link hover:underline">
            Mot de passe oublié ?
          </Link>
        </span>
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </label>
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
      <MailNotice>
        On a envoyé un lien de confirmation à <strong className="text-foreground">{state.email}</strong>. Clique dessus
        pour activer ton compte.
      </MailNotice>
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

export function ForgotPasswordForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, { status: "idle" });

  if (state.status === "check_email") {
    return (
      <MailNotice>
        Si un compte existe avec <strong className="text-foreground">{state.email}</strong>, tu vas recevoir un lien
        pour choisir un nouveau mot de passe. Ouvre-le dans ce même navigateur et pense à regarder dans tes spams.
      </MailNotice>
    );
  }

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-4">
      {params.get("expired") && (
        <p className="rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">
          Ce lien a expiré ou a déjà servi. Demande un nouveau lien ci-dessous.
        </p>
      )}
      <Field label="Email">
        <input name="email" type="email" autoComplete="email" required className={inputClass} />
      </Field>
      {state.status === "error" && <p className="text-sm text-danger">{state.message}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Envoi…" : "Recevoir un lien"}
      </button>
      <p className="text-center text-sm text-muted">
        Tu t&apos;en souviens ?{" "}
        <Link href="/connexion" className="font-medium text-link hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}

export function NewPasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, { status: "idle" });

  if (state.status === "done") {
    return (
      <div className="space-y-4 text-center" role="status">
        <p className="mx-auto flex size-12 items-center justify-center rounded-full bg-ok-soft text-ok">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6" aria-hidden>
            <path d="m5 12 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </p>
        <p className="font-semibold">Mot de passe modifié</p>
        <p className="text-sm text-muted">Utilise-le à ta prochaine connexion.</p>
        <Link href="/espace" className={buttonClass}>
          Aller à mes annonces
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-4">
      {/* Aide les gestionnaires de mots de passe à associer le nouveau mot de passe au bon compte */}
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
      <p className="text-sm text-muted">
        Compte : <strong className="text-foreground">{email}</strong>
      </p>
      <Field label="Nouveau mot de passe">
        <input name="password" type="password" autoComplete="new-password" required minLength={8} className={inputClass} />
        <span className="mt-1 block text-xs text-muted">8 caractères minimum.</span>
      </Field>
      <Field label="Confirme le mot de passe">
        <input name="confirm" type="password" autoComplete="new-password" required minLength={8} className={inputClass} />
      </Field>
      {state.status === "error" && <p className="text-sm text-danger">{state.message}</p>}
      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Enregistrement…" : "Enregistrer le mot de passe"}
      </button>
    </form>
  );
}
