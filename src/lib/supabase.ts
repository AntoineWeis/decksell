import { createClient } from "@supabase/supabase-js";

// Client Supabase côté navigateur et serveur (clé publishable uniquement).
// La clé secrète ne doit jamais passer par ce fichier.
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Variables Supabase manquantes : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return createClient(url, publishableKey);
}
