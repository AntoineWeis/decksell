"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-auth";
import { safeNext } from "@/lib/auth";

export type AuthState = { status: "idle" } | { status: "error"; message: string } | { status: "check_email"; email: string };

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

/** Messages Supabase traduits pour l'utilisateur. */
function frenchError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou mot de passe incorrect.";
  if (m.includes("email not confirmed")) return "Confirme d'abord ton adresse avec le lien reçu par email.";
  if (m.includes("already registered")) return "Un compte existe déjà avec cet email. Connecte-toi.";
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

  const h = await headers();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

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
  if (data.session) redirect(next); // confirmation par email désactivée
  return { status: "check_email", email };
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}
