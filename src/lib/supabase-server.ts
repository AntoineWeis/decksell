import "server-only";
import { createClient } from "@supabase/supabase-js";

// Client Supabase avec la clé secrète : UNIQUEMENT côté serveur.
// "server-only" fait échouer le build si ce fichier est importé côté navigateur.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error("Variables Supabase manquantes : NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SECRET_KEY.");
  }

  return createClient(url, secretKey, { auth: { persistSession: false } });
}

/**
 * Client Supabase avec la clé publique, sans session : pour les lectures publiques (vues
 * public_listings, public_sellers…), soumises aux mêmes droits qu'un visiteur anonyme.
 */
export function getSupabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Variables Supabase manquantes : NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  return createClient(url, key, { auth: { persistSession: false } });
}
