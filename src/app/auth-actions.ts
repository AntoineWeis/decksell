"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-auth";
import { getUser, safeNext } from "@/lib/auth";
import { setFlash } from "@/lib/flash";

export type AuthState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "check_email"; email: string }
  | { status: "done" };

/** Adresse du site, pour les liens envoyés par email. */
async function siteOrigin() {
  const h = await headers();
  return process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

/** Messages Supabase traduits pour l'utilisateur. */
function frenchError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (m.includes("email not confirmed")) return "Confirme d'abord ton adresse avec le lien reçu par email.";
  if (m.includes("already registered")) return "Un compte existe déjà avec cet email. Connecte-toi.";
  if (m.includes("different from the old")) return "Choisis un mot de passe différent de l'ancien.";
  if (m.includes("rate limit")) return "Trop de tentatives. Réessaie dans quelques minutes.";
  if (m.includes("password")) return "Mot de passe trop faible : 8 caractères minimum.";
  if (m.includes("email")) return "Adresse email invalide.";
  return "Une erreur est survenue. Réessaie dans un instant.";
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = str(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { status: "error", message: "Renseigne ton email et ton mot de passe." };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { status: "error", message: frenchError(error.message) };
  await setFlash("success", "Connexion réussie");
  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const displayName = str(formData.get("display_name"));
  const email = str(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (displayName.length < 2 || displayName.length > 40) {
    return { status: "error", message: "Ton pseudo doit faire entre 2 et 40 caractères." };
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) return { status: "error", message: "Adresse email invalide." };
  if (password.length < 8) return { status: "error", message: "Mot de passe trop court : 8 caractères minimum." };

  const origin = await siteOrigin();
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) return { status: "error", message: frenchError(error.message) };
  if (data.session) {
    // Confirmation par email désactivée : le compte est déjà actif.
    await setFlash("success", "Compte créé, bienvenue !");
    redirect(next);
  }
  return { status: "check_email", email };
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  await setFlash("success", "Déconnexion réussie");
  redirect("/");
}

/** Envoie un lien pour choisir un nouveau mot de passe. */
export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = str(formData.get("email"));
  if (!/^\S+@\S+\.\S+$/.test(email)) return { status: "error", message: "Adresse email invalide." };

  const origin = await siteOrigin();
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Le modèle d'email Supabase peut ajouter &token_hash=…&type=recovery à cette adresse.
    redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent("/nouveau-mot-de-passe")}`,
  });
  // Même réponse qu'il existe un compte ou non : on ne révèle pas quels emails sont inscrits.
  if (error && error.message.toLowerCase().includes("rate limit")) {
    return { status: "error", message: frenchError(error.message) };
  }
  return { status: "check_email", email };
}

/** Enregistre le nouveau mot de passe du membre connecté (via le lien reçu ou depuis son profil). */
export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { status: "error", message: "Mot de passe trop court : 8 caractères minimum." };
  if (password !== confirm) return { status: "error", message: "Les deux mots de passe ne sont pas identiques." };

  const user = await getUser();
  if (!user) return { status: "error", message: "Ton lien a expiré. Demande un nouveau lien." };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { status: "error", message: frenchError(error.message) };
  return { status: "done" };
}
