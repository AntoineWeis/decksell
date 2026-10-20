import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createSupabaseServer } from "./supabase-auth.ts";

// Point d'accès unique à la session (couche d'accès aux données).
// Toujours revérifier ici côté serveur : ne jamais se fier à ce que dit le navigateur.

export type SessionUser = { id: string; email: string };

export type Profile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  moxfieldUrl: string | null;
  archidektUrl: string | null;
};

/** Membre connecté, ou null. Le jeton est vérifié (signature et expiration). */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  // La vérification du jeton compare son expiration à l'heure actuelle :
  // elle ne doit se faire qu'au moment de la requête, jamais au pré-rendu.
  await connection();
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "" };
});

/** Membre connecté, sinon redirection vers la connexion (puis retour sur `next`). */
export async function requireUser(next: string): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  return user;
}

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, moxfield_url, archidekt_url")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    moxfieldUrl: data.moxfield_url,
    archidektUrl: data.archidekt_url,
  };
});

/** N'accepte que les chemins internes ("/espace"), jamais une autre adresse. */
export function safeNext(value: unknown, fallback = "/espace"): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
    ? value
    : fallback;
}
